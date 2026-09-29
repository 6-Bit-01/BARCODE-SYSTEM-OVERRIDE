// Real Chromium regression for Cache Road host and full-song audio.
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
  if(typeof url==='string' && url.startsWith('https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/b0b26df3ca3289a24163f6b198072ea0de1429af/assets/audio/')){
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
  const type=pathname.endsWith('.mp3')?'audio/mpeg':pathname.endsWith('.webp')?'image/webp':
    pathname.endsWith('.png')?'image/png':pathname.endsWith('.svg')?'image/svg+xml':'text/javascript';
  response.writeHead(200, { 'Content-Type': type });
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

  async function checkAudio(missingLocal) {
    omitLocalStems = missingLocal;
    return evaluate(`(async()=>{
      BARCODE.musicDirector.reset();
      BARCODE.MusicProfiles.select('level-02.proof'); BARCODE.MusicTransport.load('level-02.proof');
      const player=new AudioSystem();player.context=new AudioContext({sampleRate:44100});
      player.musicGain=player.context.createGain();player.musicGain.connect(player.context.destination);
      const analyser=player.context.createAnalyser();player.musicGain.connect(analyser);
      player.initialized=true;
      const prepared=await player.prepareActiveMusicProfile();
      const started=prepared.ok?player.startAllLayersSimultaneously():{ok:false};
      let captures=[],previewLane=null,previewBeat=null,hitRecovery=false;
      BARCODE.CacheRoadProof={active:true,mixSnapshot:()=>({captures,previewLane,previewBeat,hitRecovery}),startOffsetSec:()=>0};
      player.updateLayers();
      await new Promise(resolve=>setTimeout(resolve,300));
      const waveform=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(waveform);
      const result={prepared,started:{ok:started.ok,reason:started.reason},
        rms:Math.sqrt(waveform.reduce((sum,x)=>sum+x*x,0)/waveform.length),
        pressure:player.musicTracks['cache-pressure'].volume,
        drive:player.musicTracks['cache-drive'].volume,
        undercurrent:player.musicTracks['cache-undercurrent'].volume,
        tracks:Object.entries(player.musicTracks).filter(([name])=>name.startsWith('cache-'))
          .map(([name,track])=>({name,duration:track.buffer.duration,fallback:track.isFallback,
            playing:track.isPlaying,start:track.startTime,
            sample:track.buffer.getChannelData(0).slice(10000,15000).some(x=>Math.abs(x)>0.001)}))};
      result.catches=[];
      for(const next of [[],[{lane:0,startBeat:0,endBeat:16}],
        [{lane:0,startBeat:0,endBeat:16},{lane:2,startBeat:0,endBeat:16}],[]]){
        captures=next;player.updateLayers();
        await new Promise(resolve=>setTimeout(resolve,100));
        analyser.getFloatTimeDomainData(waveform);
        result.catches.push({captures:next.length,pressure:player.musicTracks['cache-pressure'].volume,
          drive:player.musicTracks['cache-drive'].volume,
          flow:player.musicTracks['cache-flow'].volume,
          breakaway:player.musicTracks['cache-breakaway'].volume,
          rms:Math.sqrt(waveform.reduce((sum,x)=>sum+x*x,0)/waveform.length)});
      }
      hitRecovery=true;player.updateLayers();
      result.hitDrive=player.musicTracks['cache-drive'].volume;
      result.hitFlow=player.musicTracks['cache-flow'].volume;
      result.stumble=player.playRoadStumble();
      await new Promise(resolve=>setTimeout(resolve,220));
      analyser.getFloatTimeDomainData(waveform);
      result.droppedRms=Math.sqrt(waveform.reduce((sum,x)=>sum+x*x,0)/waveform.length);
      await new Promise(resolve=>setTimeout(resolve,800));
      analyser.getFloatTimeDomainData(waveform);
      result.recoveredRms=Math.sqrt(waveform.reduce((sum,x)=>sum+x*x,0)/waveform.length);
      result.recoveredGain=player.musicGain.gain.value;
      await player.context.close(); return result;
    })()`);
  }
  const audio = await checkAudio(false);
  assert(audio.prepared.ok && audio.started.ok, JSON.stringify(audio));
  assert(audio.rms > .0001, 'the actual intro MP3s produce signal');
  assert.equal(audio.pressure, .60); assert.equal(audio.drive, .10);
  assert.equal(audio.undercurrent, 0, 'sparse intro FX is a selectable layer');
  assert.equal(audio.tracks.length, 5);
  assert(audio.tracks.every(track => !track.fallback && track.playing && track.sample &&
    Math.abs(track.duration - 187.5) < .08), JSON.stringify(audio.tracks));
  assert.equal(new Set(audio.tracks.map(track => track.start)).size, 1);
  assert.deepEqual(audio.catches.map(point => point.drive), [.10,.19,.19,.10]);
  assert.deepEqual(audio.catches.map(point => point.breakaway), [0,0,.50,0],
    'the quiet intro Breakaway passage is not muted when captured');
  assert(audio.catches.every(point => point.pressure === .60 && point.flow === 0 &&
    point.rms > .0001), 'the sparse intro keeps drums while Drive catches and releases');
  assert(audio.hitDrive === 0 && audio.hitFlow === 0,
    'a hit removes both quiet beds while the drums remain');
  assert(audio.stumble && audio.droppedRms < .0001 && audio.recoveredRms > .0001 &&
    Math.abs(audio.recoveredGain - .8) < .01,
  'browser music bus cuts out and returns on the beat without restarting MP3s');
  assert.equal(requests.head, 0);
  assert.equal(requests.get.filter(url => url.endsWith('.mp3')).length, 5);
  const fallback = await checkAudio(true);
  assert(fallback.prepared.ok && fallback.started.ok && fallback.rms > .0001, JSON.stringify(fallback));
  assert.equal(fallback.tracks.length, 5);
  assert(fallback.tracks.every(track => !track.fallback && track.playing &&
    Math.abs(track.duration - 187.5) < .08));
  assert.equal(requests.get.filter(url => url.endsWith('.mp3')).length, livePublished ? 10 : 15);
  if (!livePublished) assert.equal(await evaluate('window.publishedRequests.length'), 5);
  omitLocalStems=false;
  const renderRoadAudio=require('./cache-road-review-audio.cjs');
  const beat=60/128;
  const probe={seconds:2,mixEvents:[],audioEvents:[
    ...[0,1,2].map(index=>({kind:'roadCount',at:index*beat,calledAt:Math.max(0,index*beat-.1)})),
    {kind:'roadPerfect',at:3*beat,calledAt:3*beat-.32}]};
  const cueAudio=await evaluate(`(${renderRoadAudio.toString()})(${JSON.stringify(probe)})`);
  assert(cueAudio.rms>.003&&cueAudio.peak<1&&cueAudio.remainingVoices===0);
  assert(cueAudio.scheduled.every(event=>event.ok&&Math.abs(event.actual-event.requested)<1e-8),
    'countdown and calibrated early catch sounds start on exact source-clock beats');
  const reviewTrace=path.join(root,'docs/source-pack/review-cache-world-polish/Drive-Trace.json');
  if(fs.existsSync(reviewTrace)) {
    const trace=JSON.parse(fs.readFileSync(reviewTrace,'utf8'));
    const review=await evaluate(`(${renderRoadAudio.toString()})(${JSON.stringify(trace)})`);
    assert(review.rms>.01&&review.peak<1&&review.remainingVoices===0,
      'the driving review has audible music and cues without clipping or leaked voices');
    assert(review.scheduled.filter(event=>/^road/.test(event.kind)).every(event=>event.ok));
    const reviewOutput=process.env.CACHE_ROAD_REVIEW_OUTPUT ||
      (process.env.RUNNER_TEMP&&path.join(process.env.RUNNER_TEMP,'music-browser/cache-road'));
    if(reviewOutput) {
      const output=path.resolve(reviewOutput);fs.mkdirSync(output,{recursive:true});
      fs.writeFileSync(path.join(output,'Drive-Audio.wav'),Buffer.from(review.pcm,'base64'));
      delete review.pcm;
      fs.writeFileSync(path.join(output,'Drive-Audio-Checks.json'),JSON.stringify(review,null,2));
    }
  }
  const reviewWorld=require('./cache-road-browser-world.cjs');
  const world=await evaluate(`(${reviewWorld.toString()})()`);
  assert(world.loadedAssets>200&&world.frames.length===96&&world.contextCalls<=4);
  assert(Object.keys(world.animations).length>=25);
  const worldOutput=process.env.CACHE_ROAD_REVIEW_OUTPUT||
    (process.env.RUNNER_TEMP&&path.join(process.env.RUNNER_TEMP,'music-browser/cache-road'));
  if(worldOutput) {
    fs.mkdirSync(worldOutput,{recursive:true});
    for(const screen of world.screens)fs.writeFileSync(path.join(worldOutput,
      `Road-${screen.progress}.png`),Buffer.from(screen.png,'base64'));
    delete world.screens;
    fs.writeFileSync(path.join(worldOutput,'World-Checks.json'),JSON.stringify(world,null,2));
  }
  assert.deepEqual(exceptions, []);
  console.log(`Cache Road Chromium passed: ${frames.drawn} guarded frames (${frames.contextCalls} context calls), five local and published MP3s, aligned phrases and audible collision break.`);
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(async () => {
  socket?.close();
  if (chrome && chrome.exitCode === null) { chrome.kill(); await chromeClosed; }
  server.close();
  await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});
