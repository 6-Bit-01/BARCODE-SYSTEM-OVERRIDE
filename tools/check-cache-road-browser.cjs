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
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 300000);
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
  async function checkChipAudio() {
    const reviewChipAudio = require('./cache-road-chip-audio-review.cjs');
    const chip = await evaluate(`(${reviewChipAudio.toString()})()`);
    assert(chip.metrics.rms > .001 && chip.metrics.peak < 1 && chip.metrics.clipped === 0);
    assert.equal(chip.originalStems.length, 5);
    assert(chip.scheduled.length >= 30 && chip.maxVoices <= 12 && chip.cacheEntries <= 96);
    assert(chip.stress.accepted > 100 && chip.stress.maxVoices <= 12 && chip.stress.metrics.peak < 1);
    assert(chip.lifecycle.pause === 'paused' && chip.lifecycle.resume === 'resumed' &&
      chip.lifecycle.restart === 'restart-audio-ready');
    const reviewOutput = process.env.CACHE_ROAD_REVIEW_OUTPUT ||
      (process.env.RUNNER_TEMP && path.join(process.env.RUNNER_TEMP, 'music-browser/cache-road'));
    if (reviewOutput) {
      fs.mkdirSync(reviewOutput, { recursive: true });
      fs.writeFileSync(path.join(reviewOutput, 'Chip-SFX-Audition.wav'), Buffer.from(chip.pcm, 'base64'));
      delete chip.pcm;
      fs.writeFileSync(path.join(reviewOutput, 'Chip-SFX-Checks.json'), JSON.stringify(chip, null, 2));
    }
    return chip;
  }
  if (process.env.CACHE_ROAD_CHIP_AUDIO_ONLY === '1') {
    const chip = await checkChipAudio();
    assert.deepEqual(exceptions, []);
    console.log(`Cache Road chip audio passed: ${chip.seconds}s production PCM; ${chip.scheduled.length} exact cues; five original stems; ${chip.stress.accepted} stress voices; pause/resume/restart.`);
    return;
  }
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
      let captures=[],previewLane=null,previewBeat=null,hitRecovery=false,reactivityVersion=1;
      BARCODE.CacheRoadProof={active:true,mixSnapshot:()=>({captures,previewLane,previewBeat,hitRecovery,reactivityVersion}),startOffsetSec:()=>0};
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
      reactivityVersion=2;hitRecovery=false;
      result.reactive=[];
      const sourceStarts=result.tracks.map(track=>track.start);
      for(const next of [[],[{lane:0,startBeat:0,endBeat:400}],
        [{lane:0,startBeat:0,endBeat:400},{lane:2,startBeat:0,endBeat:400}],
        [{lane:0,startBeat:0,endBeat:400}],[]]) {
        captures=next;hitRecovery=result.reactive.length===3;player.updateLayers();
        await new Promise(resolve=>setTimeout(resolve,350));
        analyser.getFloatTimeDomainData(waveform);
        result.reactive.push({gains:['pressure','drive','flow','breakaway','undercurrent']
          .map(role=>player.musicTracks['cache-'+role].gain.gain.value),
          bus:player.musicGain.gain.value,
          rms:Math.sqrt(waveform.reduce((sum,x)=>sum+x*x,0)/waveform.length)});
      }
      result.reactiveSameStarts=Object.values(player.musicTracks).filter(track=>track.isPlaying)
        .every((track,index)=>track.startTime===sourceStarts[index]);
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
  const expectedReactive=[[.60,.03,.045,0,0],[.60,.19,.045,0,0],
    [.60,.19,.045,.50,0],[.60,.19,.045,0,0],[.60,.03,.045,0,0]];
  audio.reactive.forEach((point,index)=>{
    point.gains.forEach((gain,lane)=>assert(Math.abs(gain-expectedReactive[index][lane])<.00001,
      `v2 decoded source ${lane} does not follow catch/release step ${index}`));
    assert(point.rms>.0001&&Math.abs(point.bus-.8)<.00001,
      'v2 catches, loss and recovery retain audible drums and music bus');
  });
  assert(audio.reactiveSameStarts,'v2 mix changes do not restart the five sources');
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
  const chip = await checkChipAudio();
  const renderRoadAudio=require('./cache-road-review-audio.cjs');
  const reactiveTrace=require('./check-cache-road-music-reactivity.cjs').auditionTrace();
  const reactiveAudio=await evaluate(`(${renderRoadAudio.toString()})(${JSON.stringify(reactiveTrace)})`);
  assert(reactiveAudio.rms>.005&&reactiveAudio.peak<1&&reactiveAudio.remainingVoices===0,
    'v2 catch/expiry/crash audition is audible, unclipped and releases its SFX');
  assert.equal(new Set(reactiveTrace.mixEvents.map(event=>event.sourceId)).size,5);
  assert(reactiveTrace.mixEvents.some(event=>event.sourceId==='cache-breakaway'&&event.volume===0&&event.at>0),
    'audition includes a real recorded part leaving the mix');
  const reactiveOutput=process.env.CACHE_ROAD_REVIEW_OUTPUT ||
    (process.env.RUNNER_TEMP&&path.join(process.env.RUNNER_TEMP,'music-browser/cache-road'));
  if(reactiveOutput) {
    fs.mkdirSync(reactiveOutput,{recursive:true});
    fs.writeFileSync(path.join(reactiveOutput,'Reactive-Music-Audition.wav'),Buffer.from(reactiveAudio.pcm,'base64'));
    delete reactiveAudio.pcm;
    fs.writeFileSync(path.join(reactiveOutput,'Reactive-Music-Checks.json'),JSON.stringify(reactiveAudio,null,2));
    fs.writeFileSync(path.join(reactiveOutput,'Reactive-Music-Trace.json'),JSON.stringify(reactiveTrace,null,2));
  }
  const beat=60/128;
  const probe={seconds:2,mixEvents:[],audioEvents:[
    ...[0,1,2].map(index=>({kind:'roadCount',at:index*beat,calledAt:Math.max(0,index*beat-.1)})),
    {kind:'roadTurboReady',at:beat+.2,calledAt:beat+.2},
    {kind:'roadPerfect',at:3*beat,calledAt:3*beat-.32}]};
  const cueAudio=await evaluate(`(${renderRoadAudio.toString()})(${JSON.stringify(probe)})`);
  assert(cueAudio.rms>.003&&cueAudio.peak<1&&cueAudio.remainingVoices===0);
  assert(cueAudio.scheduled.every(event=>event.ok&&Math.abs(event.actual-event.requested)<1e-8),
    'countdown and calibrated early catch sounds start on exact source-clock beats');
  const reviewTrace=path.join(root,'docs/source-pack/review-cache-lamps-chip-sound/Drive-Trace.json');
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
  assert(world.loadedAssets>200&&world.frames.length===192&&world.contextCalls<=4);
  assert(Object.keys(world.animations).length===61 && world.animationRoutes.animatedKeys===61);
  assert.equal(world.animationRoutes.legacyAnimatedKeys,51,
    'all original legacy route assertions remain intact');
  assert.equal(world.hosted.filter(entry=>entry.frames>1).length,61);
  assert.deepEqual(world.animationRoutes.authoredBeatKeys,['cacheBeatHardware','cacheBeatEnergy','cacheBeatTiming']);
  for(const [key,count] of [['cacheBeatHardware',8],['cacheBeatEnergy',12],['cacheBeatTiming',8]]) {
    assert.deepEqual(world.animationRoutes.main[key],Array.from({length:count},(_,i)=>i),
      `${key}: real production chart timing and receipts paint every new source cel`);
    assert(!world.animationRoutes.mirror[key],`${key}: ground timing does not enter the rearview`);
    const hosted=world.hosted.find(entry=>entry.key===key);
    assert(hosted&&hosted.bytes>0&&hosted.frames===count&&hosted.productionLoader,
      `${key}: exact immutable published bytes decode and draw through the remote-first loader`);
  }
  assert.deepEqual([...new Set(world.animationRoutes.beatReceipts.map(receipt=>receipt.kind))].sort(),
    ['good','miss','perfect'],'native real chart judgments cover Good, Perfect and an actual miss');
  assert.deepEqual(world.animationRoutes.authoredFeedbackKeys,['cacheBloodSplatter','cacheCrewCallouts']);
  assert.deepEqual(world.animationRoutes.main.cacheBloodSplatter,[0,1,2,3,4,5],
    'all six blood cells follow real staged pedestrian/rider contacts through the front road');
  assert.deepEqual(world.animationRoutes.mirror.cacheBloodSplatter,[0,1,2,3,4,5],
    'the same contacted bodies paint all blood cells through the rearview');
  assert.deepEqual(world.animationRoutes.main.cacheCrewCallouts,[0,1,2],
    'physical pedestrian hit events select all three crew portraits in the main HUD');
  assert(!world.animationRoutes.mirror.cacheCrewCallouts,'crew portraits cannot enter reflected scenery');
  for(const [key,count] of [['cacheCombatBike',8],['cacheCombatHostiles',12],
    ['cacheCombatBikeCrash',6],['cacheCombatBlast',6]]) {
    const frames=Array.from({length:count},(_,i)=>i);
    assert.deepEqual(world.animationRoutes.main[key],frames,
      `${key}: diagnostic physical combat poses paint every cel through the full front road`);
    assert.deepEqual(world.animationRoutes.mirror[key],frames,
      `${key}: the same physical combat poses paint every cel through the rearview`);
  }
  assert.deepEqual(world.animationRoutes.main.cachePursuitRig,[0,1,2,3,4,5,6,7],
    'all eight rig damage/action poses render through the production front camera');
  assert.deepEqual(world.animationRoutes.mirror.cachePursuitRig,[0,1,2,3,4,5,6,7],
    'all eight rig damage/action poses render through the same rearview owner');
  assert.deepEqual(world.animationRoutes.main.cachePursuitImpact,[0,1,4,5],
    'all four live pursuit effects render; retained debris and skid source cells stay inactive');
  const dashboard=world.hosted.filter(entry=>entry.frames===1);
  assert.deepEqual(dashboard.map(entry=>entry.key).sort(),
    ['cacheDashBezel','cacheDashDigits','cacheDashIcons']);
  assert(dashboard.every(entry=>entry.columns===1&&entry.rows===1&&
    entry.bytes>0&&entry.productionLoader),
  'all three static dashboard assets match published bytes and draw through the remote loader');
  const worldOutput=process.env.CACHE_ROAD_REVIEW_OUTPUT||
    (process.env.RUNNER_TEMP&&path.join(process.env.RUNNER_TEMP,'music-browser/cache-road'));
  if(worldOutput) {
    fs.mkdirSync(worldOutput,{recursive:true});
    for(const screen of world.screens)fs.writeFileSync(path.join(worldOutput,
      `Road-${screen.progress}.webp`),Buffer.from(screen.webp,'base64'));
    delete world.screens;
    fs.writeFileSync(path.join(worldOutput,'World-Checks.json'),JSON.stringify(world,null,2));
  }
  assert.deepEqual(exceptions, []);
  console.log(`Cache Road Chromium passed: ${frames.drawn} guarded frames; ${world.frames.length} world frames; ${world.drive.frames} driving frames in all gears; ${world.drive.arrivals} beat-1 arrivals; ${world.hosted.length} byte-identical published assets (${world.animationRoutes.animatedKeys} animations, 3 static dashboard assets); five MP3s; ${chip.scheduled.length} exact chip cues and engine lifecycle.`);
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; }).finally(async () => {
  socket?.close();
  if (chrome && chrome.exitCode === null) { chrome.kill(); await chromeClosed; }
  server.close();
  await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});
