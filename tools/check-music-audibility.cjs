// Render the production music graph in real Chromium. No device, Makko or
// hearing claim: measured PCM confirms that automation changes the output.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const chromePath=process.env.CHROME_BIN || ['/usr/bin/google-chrome','/usr/bin/chromium'].find(p=>fs.existsSync(p));
assert(chromePath,'Set CHROME_BIN to Chrome/Chromium.');
const output=path.resolve(process.env.MUSIC_BROWSER_OUTPUT || path.join(os.tmpdir(),'barcode-music-browser'));
fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'barcode-music-chrome-'));
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
  for(const file of ['src/engine/music-profiles.js','src/engine/level-01-music-profile.js','src/engine/music-transport.js','src/engine/music-director.js','src/engine/audio.js'])
    await evaluate(fs.readFileSync(path.join(root,file),'utf8'));
  const renderMusic=require('./music-browser-render.cjs');
  await evaluate('window.renderMusic='+renderMusic.toString());
  let assets=null;
  if(process.env.MUSIC_ASSET_DIR) assets=Object.fromEntries(['foundation','bass-layer','fx-layer'].map(id=>[id,fs.readFileSync(path.join(process.env.MUSIC_ASSET_DIR,id+'.mp3')).toString('base64')]));
  if(!assets && process.env.MUSIC_FETCH_ASSETS==='1') {
    assets={};
    const sources=await evaluate("BARCODE.MusicProfiles.get('level-01.main').arrangement.sources.map(s=>({id:s.sourceId,url:s.url}))");
    for(const source of sources){
      const response=await fetch(source.url,{signal:AbortSignal.timeout(30000)});
      assert(response.ok,`Music asset unavailable: ${source.id} (${response.status})`);
      assets[source.id]=Buffer.from(await response.arrayBuffer()).toString('base64');
    }
  }
  if(assets) await evaluate('window.musicReviewAssets='+JSON.stringify(assets));
  const report={host:'Chromium OfflineAudioContext',source:assets?'original linked MP3s':'controlled spectrum fixture',runs:[]};
  for(const enabled of [false,true]){
    const result=await evaluate('renderMusic('+enabled+',window.musicReviewAssets)');
    assert.deepEqual(result.starts.map(x=>[x.at,x.offset]),[[.01,0],[.01,0],[.01,0]],'source scheduling preserved');
    assert(result.starts.every(x=>x.rate===1 && x.loop));
    assert(result.snapshots.filter(x=>x.time>.5).every(x=>Math.abs(x.gains.foundation-.4)<.001),'foundation stays steady after startup ramp');
    const wave=Buffer.from(result.pcm,'base64'); delete result.pcm;
    fs.writeFileSync(path.join(output,enabled?'dynamic.wav':'original.wav'),wave);
    report.runs.push(result);
  }
  const [off,on]=report.runs;
  const hack=on.snapshots.find(s=>s.time>15 && s.time<16), normal=on.snapshots.find(s=>s.time>8 && s.time<9);
  assert(hack && normal && hack.gains['fx-layer']<normal.gains['fx-layer']/4,'actual sub-bass AudioParam drops in hacking');
  assert.equal(hack.filterHz,850);assert.equal(hack.colourSource,'bass-layer');
  assert(on.snapshots.every(s=>s.foundationDirect && s.subBassDirect));
  assert(on.windows.hack.rms < off.windows.hack.rms*.85,'rendered hacking mix has a substantial measurable change');
  if(!assets)assert(on.peak<1,'controlled signal fixture must not clip');
  else assert(on.peak<=off.peak && on.clipped<=off.clipped,'dynamic treatment must not worsen excerpt headroom');
  assert.equal(errors.length,0,JSON.stringify(errors));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:'passed',output,source:report.source,peak:{off:off.peak,on:on.peak},hackRms:{off:off.windows.hack.rms,on:on.windows.hack.rms}},null,2));
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;}).finally(async()=>{
  socket?.close(); if(chrome && chrome.exitCode===null){chrome.kill();await chromeClosed;}
  fs.rmSync(profile,{recursive:true,force:true});
});
