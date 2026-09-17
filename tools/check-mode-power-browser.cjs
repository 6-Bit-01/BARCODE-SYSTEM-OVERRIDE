// Real Chromium PCM for production synthesized power cues. The offline context
// adapter supplies scheduled time/running state; nodes, buffers and routing are real.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const chromePath=process.env.CHROME_BIN || ['/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
assert(chromePath,'Set CHROME_BIN to Chrome/Chromium.');
const output=path.resolve(process.env.MODE_POWER_BROWSER_OUTPUT || path.join(os.tmpdir(),'barcode-mode-power-browser'));
fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'barcode-mode-power-chrome-'));
let chrome,chromeClosed,socket; const errors=[];
async function main(){
  chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  chromeClosed = new Promise(resolve => chrome.once('close', resolve));
  const debuggerUrl = await new Promise((resolve, reject) => {
    let stderr = '';
    const timeout = setTimeout(() => fail(new Error(`Chrome did not expose DevTools within 30s.\n${stderr}`)), 30000);
    const cleanup = () => {
      clearTimeout(timeout);
      chrome.off('error', fail); chrome.off('close', closed);
      chrome.stderr.off('data', readStderr);
    };
    const fail = error => { cleanup(); reject(error); };
    const closed = (code, signal) => fail(new Error(`Chrome closed before DevTools (${code ?? signal}).\n${stderr}`));
    const readStderr = data => {
      // Pipe chunks can split the endpoint line; wait for its terminating whitespace.
      stderr = (stderr + data).slice(-16384);
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)\s/);
      if (match) { cleanup(); resolve(match[1]); }
    };
    chrome.once('error', fail); chrome.once('close', closed);
    chrome.stderr.on('data', readStderr);
  });
  const debuggerOrigin = new URL(debuggerUrl).origin.replace('ws:', 'http:');
  const target = await (await fetch(`${debuggerOrigin}/json/new`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let serial = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timeout } = pending.get(message.id); pending.delete(message.id); clearTimeout(timeout);
      if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 120000);
    pending.set(id, { resolve, reject, timeout }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: false });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value;
  };

  await send('Runtime.enable');

  await evaluate(fs.readFileSync(path.join(root,'src/game/mode-power-fx.js'),'utf8'));
  const result=await evaluate(`(async()=>{
    const context=new OfflineAudioContext(1,48000*6,48000),gain=context.createGain();
    gain.gain.value=.8;gain.connect(context.destination);let now=0;
    const adapter=new Proxy(context,{get(t,k){if(k==='currentTime')return now;if(k==='state')return 'running';const v=t[k];return typeof v==='function'?v.bind(t):v;}});
    window.audioSystem={context:adapter,sfxGain:gain,combatVoices:new Set()};window.isPaused=false;
    window.gameState={paused:false};const fx=BARCODE.modePowerFX;
    const kinds=['time-enter','deflect','time-return','rhythm-surge','rhythm-impact'];
    const report=[];
    for(const kind of kinds){if(!fx.playCue(kind))throw Error('Cue did not schedule: '+kind);report.push({kind,at:now});now++;}
    const buffer=await context.startRendering(),data=buffer.getChannelData(0);
    for(const [i,cue] of report.entries()){
      let energy=0,peak=0;for(let j=i*48000;j<(i+1)*48000;j++){const v=data[j];if(!Number.isFinite(v))throw Error('Nonfinite PCM');energy+=v*v;peak=Math.max(peak,Math.abs(v));}
      cue.rms=Math.sqrt(energy/48000);cue.peak=peak;if(cue.rms<.015||cue.peak>=1)throw Error('Cue silent/clipped: '+cue.kind);
    }
    if(audioSystem.combatVoices.size!==0||fx.voices.size!==0)throw Error('Voices leaked after render');
    const raw=new ArrayBuffer(44+data.length*2),view=new DataView(raw);
    const str=(o,s)=>{for(let i=0;i<s.length;i++)view.setUint8(o+i,s.charCodeAt(i));};
    str(0,'RIFF');view.setUint32(4,raw.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);
    view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,48000,true);view.setUint32(28,96000,true);view.setUint16(32,2,true);view.setUint16(34,16,true);
    str(36,'data');view.setUint32(40,raw.byteLength-44,true);for(let i=0;i<data.length;i++)view.setInt16(44+i*2,Math.round(data[i]*32767),true);
    const bytes=new Uint8Array(raw);let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
    return {report,pcm:btoa(binary),voicesAfter:audioSystem.combatVoices.size};
  })()`);
  fs.writeFileSync(path.join(output,'power-cues.wav'),Buffer.from(result.pcm,'base64'));delete result.pcm;
  assert.equal(errors.length,0,JSON.stringify(errors));result.status='passed';
  result.scope='Production synthesis and SFX routing in real Chromium; OfflineAudioContext scheduled-time/state adapter. Not hosted listening acceptance.';
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(result,null,2)+'\n');console.log(result);
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;}).finally(async()=>{
  socket?.close();if(chrome&&chrome.exitCode===null){chrome.kill();await chromeClosed;}
  fs.rmSync(profile,{recursive:true,force:true});
});
