// Real Chromium regression for the two reported Cache Road host failures.
// The local asset host deliberately rejects HEAD, and the canvas guard counts
// every getContext call, including calls on an existing 2D canvas.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const root = path.resolve(__dirname, '..');
const chromePath = process.env.CHROME_BIN || ['/usr/bin/google-chrome', '/usr/bin/chromium'].find(fs.existsSync);
assert(chromePath, 'Set CHROME_BIN to Chromium.');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'barcode-road-chrome-'));
const requests = { head: 0, get: [] }, exceptions = [];
let omitLocalStems = false;
const livePublished = process.env.CACHE_ROAD_LIVE_CDN === '1';
const scripts = ['src/engine/renderer.js', 'src/engine/music-profiles.js',
  'src/engine/music-transport.js', 'src/engine/cache-road-proof-profile.js',
  'src/engine/music-director.js', 'src/engine/audio.js', 'src/core/loop.js'];
const fixture = `<!doctype html><canvas id="gameCanvas" width="1920" height="1080"></canvas>
<script>
window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};
window.contextCalls=0;
window.publishedRequests=[];
${livePublished ? '' : `const nativeFetch=window.fetch.bind(window);
window.fetch=(url,...options)=>{
  if(typeof url==='string' && url.startsWith('https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/c2ca847c63c3b8b70ba178dd02fda0ad8ab4f508/assets/audio/')){
    window.publishedRequests.push(url);
    return nativeFetch('/published-'+url.split('/').pop(),...options);
  }
  return nativeFetch(url,...options);
};`}
const getContext=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(...args){
  if(this.id==='gameCanvas' && ++window.contextCalls>4) throw Error('Canvas context creation limit exceeded');
  return getContext.apply(this,args);
};
</script>${scripts.map(file => `<script src="/${file}"></script>`).join('')}`;
const server = http.createServer((request, response) => {
  if (request.method === 'HEAD') {
    requests.head++; response.writeHead(405); response.end(); return;
  }
  if (request.url === '/') {
    response.writeHead(200, { 'Content-Type': 'text/html' }); response.end(fixture); return;
  }
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (omitLocalStems && /^\/assets\/audio\/cache-[a-z]+\.mp3$/.test(pathname)) {
    requests.get.push(pathname);
    response.writeHead(404); response.end(); return;
  }
  const file = pathname.startsWith('/published-cache-')
    ? path.resolve(root, 'assets/audio', pathname.slice('/published-'.length))
    : path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404); response.end(); return;
  }
  requests.get.push(pathname);
  response.writeHead(200, { 'Content-Type': pathname.endsWith('.mp3') ? 'audio/mpeg' : 'text/javascript' });
  fs.createReadStream(file).pipe(response);
});

let chrome, chromeClosed, socket;
async function main() {
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required',
    '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    ...(livePublished && process.env.HTTPS_PROXY ? ['--ignore-certificate-errors',
      `--proxy-server=${process.env.HTTPS_PROXY}`,
      '--proxy-bypass-list=localhost;127.0.0.1'] : []), 'about:blank'],
  { stdio: ['ignore', 'ignore', 'pipe'] });
  chromeClosed = new Promise(resolve => chrome.once('close', resolve));
  const debuggerUrl = await new Promise((resolve, reject) => {
    let stderr = '';
    const timeout = setTimeout(() => reject(new Error(`Chromium did not start: ${stderr}`)), 30000);
    const read = chunk => {
      stderr = (stderr + chunk).slice(-16384);
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)\s/);
      if (match) { clearTimeout(timeout); chrome.stderr.off('data', read); resolve(match[1]); }
    };
    chrome.once('error', reject); chrome.stderr.on('data', read);
  });
  const target = await (await fetch(`${new URL(debuggerUrl).origin.replace('ws:', 'http:')}/json/new`,
    { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let serial = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails);
    if (pending.has(message.id)) {
      const { resolve, reject, timeout } = pending.get(message.id);
      pending.delete(message.id); clearTimeout(timeout);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 120000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: origin });
  const waitUntil = async expression => {
    for (let i = 0; i < 100; i++) {
      if (await evaluate(expression)) return;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(`Timed out waiting for ${expression}`);
  };
  await waitUntil('document.readyState === "complete" && !!window.renderer && !!window.AudioSystem && !!window.gameLoop');
  const frames = await evaluate(`(()=>{
    let drawn=0;
    BARCODE.CacheRoadProof={active:true,update(){},draw(ctx){if(!ctx)throw Error('No road canvas');drawn++;ctx.fillRect(0,0,1,1);}};
    window.inputManager={update(){}};window.audioSystem.updateLayers=()=>{};
    window.isRunning=true;window.lastTime=0;
    for(let frame=1;frame<=600;frame++)window.gameLoop(frame*16);
    return {drawn,contextCalls};
  })()`);
  assert.equal(frames.drawn, 600);
  assert(frames.contextCalls <= 2, `road reacquired its canvas ${frames.contextCalls} times`);

  const audio = await evaluate(`(async()=>{
    BARCODE.MusicProfiles.select('level-02.proof');BARCODE.MusicTransport.load('level-02.proof');
    const player=new AudioSystem();player.context=new AudioContext({sampleRate:44100});
    player.musicGain=player.context.createGain();player.musicGain.connect(player.context.destination);
    const analyser=player.context.createAnalyser();player.musicGain.connect(analyser);
    player.initialized=true;
    const prepared=await player.prepareActiveMusicProfile();
    const tracks=Object.entries(player.musicTracks).filter(([name])=>name.startsWith('cache-'));
    const started=player.startAllLayersSimultaneously();
    BARCODE.CacheRoadProof={active:true,mixSnapshot:()=>({lane:1,locked:[],finalMix:false})};
    player.updateLayers();
    await new Promise(resolve=>setTimeout(resolve,350));
    const waveform=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(waveform);
    const result={prepared,started:{ok:started.ok,reason:started.reason},
      drumGain:player.musicTracks['cache-drums'].volume,contextState:player.context.state,
      rms:Math.sqrt(waveform.reduce((sum,x)=>sum+x*x,0)/waveform.length),
      tracks:tracks.map(([name,track])=>({name,duration:track.buffer.duration,
        fallback:track.isFallback,playing:track.isPlaying,start:track.startTime,
        sample:track.buffer.getChannelData(0).slice(10000,15000).some(x=>Math.abs(x)>0.001)}))};
    await player.context.close();return result;
  })()`);
  assert(audio.prepared.ok && audio.started.ok, JSON.stringify(audio));
  assert.equal(audio.contextState, 'running', 'the unlocked audio clock must be running');
  assert(audio.rms > .0001, 'the selected real drum stem must produce audible signal');
  assert.equal(audio.drumGain, .62, 'the selected lane must leave the zero-gain startup mix');
  assert.equal(audio.tracks.length, 4);
  assert(audio.tracks.every(track => !track.fallback && track.playing && track.sample &&
    Math.abs(track.duration - 187.5) < .08), JSON.stringify(audio.tracks));
  assert.equal(new Set(audio.tracks.map(track => track.start)).size, 1, 'four sources share one audio start');
  assert.equal(requests.head, 0, 'a host that rejects HEAD never receives a HEAD probe');
  assert.equal(requests.get.filter(url => url.endsWith('.mp3')).length, 4);
  // Reproduce the preview-import failure: JS arrives, but the four local MP3
  // URLs do not. Fetch the fixed public copies and decode them in Chromium.
  omitLocalStems = true;
  const fallback = await evaluate(`(async()=>{
    const player=new AudioSystem();player.context=new AudioContext({sampleRate:44100});
    player.musicGain=player.context.createGain();player.musicGain.connect(player.context.destination);
    const analyser=player.context.createAnalyser();player.musicGain.connect(analyser);
    player.initialized=true;
    const prepared=await player.prepareActiveMusicProfile();
    const started=prepared.ok ? player.startAllLayersSimultaneously() : {ok:false};
    BARCODE.CacheRoadProof={active:true,mixSnapshot:()=>({lane:1,locked:[],finalMix:false})};
    player.updateLayers();
    await new Promise(resolve=>setTimeout(resolve,350));
    const waveform=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(waveform);
    const result={prepared,started:{ok:started.ok,reason:started.reason},
      contextState:player.context.state,
      rms:Math.sqrt(waveform.reduce((sum,x)=>sum+x*x,0)/waveform.length),
      tracks:Object.entries(player.musicTracks).filter(([name])=>name.startsWith('cache-'))
        .map(([name,track])=>({name,duration:track.buffer.duration,fallback:track.isFallback,
          playing:track.isPlaying,volume:track.volume,
          sample:track.buffer.getChannelData(0).slice(10000,15000).some(x=>Math.abs(x)>0.001)}))};
    await player.context.close();return result;
  })()`);
  assert(fallback.prepared.ok && fallback.started.ok, JSON.stringify(fallback));
  assert.equal(fallback.contextState, 'running', 'published stems need a running audio clock');
  assert(fallback.rms > .0001, 'published drum stem must produce audible signal');
  assert.equal(fallback.tracks.length, 4);
  assert(fallback.tracks.every(track => !track.fallback && track.playing && track.sample &&
    Math.abs(track.duration - 187.5) < .08), JSON.stringify(fallback.tracks));
  assert.equal(fallback.tracks.find(track => track.name === 'cache-drums').volume, .62);
  assert.equal(requests.get.filter(url => url.endsWith('.mp3')).length, livePublished ? 8 : 12,
    'missing local assets were requested and rejected before published copies loaded');
  if (!livePublished) assert.equal(await evaluate('window.publishedRequests.length'), 4,
    'every missing local stem tried the pinned published URL');
  assert.deepEqual(exceptions, []);
  console.log(`Cache Road Chromium passed: ${frames.drawn} guarded frames (${frames.contextCalls} context calls), local and missing-import/published MP3 paths decoded and mixed.`);
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(async () => {
  socket?.close();
  if (chrome && chrome.exitCode === null) { chrome.kill(); await chromeClosed; }
  server.close();
  await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});
