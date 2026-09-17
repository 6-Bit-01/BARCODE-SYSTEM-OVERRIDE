// Real Chromium media regression using the production background owner.
// Node 22+ and Chrome; no npm dependencies. Makko is outside this fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.BACKGROUND_BROWSER_OUTPUT || path.join(os.tmpdir(), 'barcode-background-browser'));
const chromePath = process.env.CHROME_BIN || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(file => fs.existsSync(file));
assert(chromePath, 'Set CHROME_BIN to an installed Chrome/Chromium executable.');
fs.mkdirSync(output, { recursive: true });
const fixture = `<!doctype html><html><body style="margin:0;background:#10131b"><canvas id="gameCanvas" width="1920" height="1080" style="width:100vw"></canvas>
<script>window.gameState={running:true,paused:false,gameOver:false};window.isRunning=true;window.isPaused=false;window.gameCamera={x:2048,y:0};</script>
<script src="/src/engine/parallax.js"></script><script src="/src/game/update-coordinator.js"></script><script src="/src/core/loop.js"></script>
<script>
window.isRunning=true;
// Supply only the omitted gameplay coordinator's media tick; the production
// RAF and background owner still perform scheduling, seeking and playback.
window.updateGame=()=>window.parallaxBackground?.syncSkyPlayback();
initParallax();
</script></body></html>`;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(fixture); return;
  }
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  const type = { '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp4': 'video/mp4' }[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(file).pipe(res);
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let chrome, chromeClosed, socket;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'barcode-chrome-'));
const errors = [];
const receipts = [];
async function main() {
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
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
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 10000);
    pending.set(id, { resolve, reject, timeout }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: false });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value;
  };
  const until = async (expression, label, attempts = 100) => {
    for (let i = 0; i < attempts; i++) { if (await evaluate(expression)) return; await delay(50); }
    const state=await evaluate('({running:window.isRunning,game:window.gameState,ready:window.parallaxBackground?.skyVideo?.readyState,paused:window.parallaxBackground?.skyVideo?.paused,time:window.parallaxBackground?.skyVideo?.currentTime,pending:window.parallaxBackground?.skyPlayPending,blocked:window.parallaxBackground?.skyPlaybackBlocked})');
    throw new Error(`Browser timeout: ${label}; ${JSON.stringify(state)}`);
  };
  const screenshot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://raw.githubusercontent.com/*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin });
  await until('window.parallaxBackground?.skyVideo?.readyState >= 2 && parallaxBackground.layers.every(layer => layer.loaded)', 'bundled video and artwork decode after hosted URL fails');
  const media = await evaluate(`(() => { const p=parallaxBackground,v=p.skyVideo; window.firstVideo=v;
    initParallax(); p.syncSkyPlayback(); return {same:v===p.skyVideo, muted:v.muted, inline:v.playsInline,loop:v.loop,width:v.videoWidth,height:v.videoHeight,duration:v.duration,src:v.currentSrc}; })()`);
  assert(media.same && media.muted && media.inline && media.loop, 'one muted inline looping video per background owner');
  assert.equal(media.width,2088); assert.equal(media.height,754); assert.equal(media.duration,8);
  assert(media.src.startsWith(origin), 'actual bundled fallback decoded');
  await until('parallaxBackground.skyVideo.currentTime > .15 && !parallaxBackground.skyVideo.paused', 'muted autoplay without user gesture');
  await evaluate('window.hackingSystem={active:true,isActive(){return this.active;}};parallaxBackground.syncSkyPlayback()');
  assert.equal(await evaluate('parallaxBackground.skyVideo.playbackRate'),.35,'real media uses tactical focus');
  const slowStart=await evaluate('parallaxBackground.skyVideo.currentTime');await delay(750);
  const slowAdvance=await evaluate('parallaxBackground.skyVideo.currentTime')-slowStart;
  assert(slowAdvance>.08 && slowAdvance<.5,'decoded skyline advances at slowed speed');
  await evaluate('hackingSystem.active=false;parallaxBackground.syncSkyPlayback()');
  assert.equal(await evaluate('parallaxBackground.skyVideo.playbackRate'),1,'media speed restores on exit');
  await evaluate('pauseGame()');
  const pausedAt=await evaluate('parallaxBackground.skyVideo.currentTime');
  await delay(200);
  assert.equal(await evaluate('parallaxBackground.skyVideo.currentTime'),pausedAt,'production pause stops the media clock');
  await evaluate('window.isPaused=false;parallaxBackground.syncSkyPlayback()');
  await until(`parallaxBackground.skyVideo.currentTime > ${pausedAt+.1}`, 'resume advances video');
  await evaluate('gameState.running=false;parallaxBackground.syncSkyPlayback()');
  assert(await evaluate('parallaxBackground.skyVideo.paused'), 'terminal game state stops playback');
  await evaluate('gameState.running=true;parallaxBackground.resetSkyAnimation();parallaxBackground.syncSkyPlayback();parallaxBackground.resetSkyAnimation();parallaxBackground.syncSkyPlayback()');
  await until('parallaxBackground.skyVideo.currentTime > .1 && !parallaxBackground.skyPlayPending', 'rapid reset/resume settles pending plays');
  await evaluate('gameState.running=false;parallaxBackground.resetSkyAnimation()');
  assert(await evaluate('parallaxBackground.skyVideo.paused && parallaxBackground.skyVideo.currentTime === 0'), 'reset starts at frame zero');
  // Observe presented playback frames, and draw through the production
  // far-background method. The scene's original fixed scale is retained.
  const rendered=await evaluate(`(async()=>{
    const p=parallaxBackground,v=p.skyVideo,ctx=gameCanvas.getContext('2d');
    // Use the real rooftop camera: the upper painted clouds are largely
    // above the sidewalk viewport. Sample architecture below the plume mask.
    gameCamera.y=-650;
    const presentedAfter=time=>new Promise(resolve=>{const check=(_,frame)=>frame.mediaTime>=time?resolve(frame.mediaTime):v.requestVideoFrameCallback(check);v.requestVideoFrameCallback(check);});
    const records=[],original=ctx.drawImage;
    ctx.drawImage=function(...args){if(args[0]===v)records.push(args.slice(1));return original.apply(this,args);};
    const frames=[],mediaTimes=[];
    gameState.running=true;p.syncSkyPlayback();
    for(const time of [.1,1.5]){mediaTimes.push(await presentedAfter(time));ctx.clearRect(0,0,1920,1080);p.drawFarBackground(ctx,p.layers[0],{x:0,y:0});frames.push(ctx.getImageData(0,0,1920,1080).data);}
    gameState.running=false;p.syncSkyPlayback();
    let upper=0,lower=0; for(let y=0;y<1080;y++)for(let x=0;x<1920;x+=3){const i=(y*1920+x)*4; const d=Math.abs(frames[0][i]-frames[1][i]);if(y<140)upper+=d;else if(y>380)lower+=d;}
    for(const cameraY of [0,-650,-1040])for(const zoom of [.9,1,1.2]){gameCamera.y=cameraY;ctx.setTransform(zoom,0,0,zoom,30,-50);p.drawFarBackground(ctx,p.layers[0],{x:0,y:0});}
    ctx.setTransform(1,0,0,1,0,0);ctx.drawImage=original;gameCamera.y=-650;
    p.drawFarBackground(ctx,p.layers[0],{x:0,y:0});
    let opaqueSamples=0;for(let i=3;i<frames[0].length;i+=400)if(frames[0][i]===255)opaqueSamples++;
    return {upper,lower,records,mediaTimes,opaqueSamples};
  })()`);
  console.log(JSON.stringify({cloudPixelDifference:rendered.upper,cityPixelDifference:rendered.lower,videoDraws:rendered.records.length,firstDraw:rendered.records[0],mediaTimes:rendered.mediaTimes,opaqueSamples:rendered.opaqueSamples}));
  assert(rendered.mediaTimes[1]-rendered.mediaTimes[0]>1,'two distinct presented video frames were sampled');
  assert(rendered.opaqueSamples>1000,'decoded video paints visible city pixels');
  assert(rendered.upper>1000,'painted clouds visibly change through real decoded video');
  assert(rendered.lower/rendered.upper<.15,'static city variation is limited to encoding noise');
  for(const r of rendered.records){assert.deepEqual(r.slice(0,4),[0,0,2087,754],'exclude padded column');assert.equal(r[6],4600);assert.equal(r[7],4600*754/2087);}
  await screenshot('01-animated-sky-roof');
  // Run through the complete asset instead of forcing an artificial seek on
  // this simple non-range HTTP fixture. This exercises the actual game loop.
  await evaluate('gameState.running=true;parallaxBackground.syncSkyPlayback()');
  await until('parallaxBackground.skyVideo.currentTime > 7.5','natural playback reaches the endpoint',180);
  await until('parallaxBackground.skyVideo.currentTime < 1 && !parallaxBackground.skyVideo.paused','natural playback wraps seamlessly');
  await evaluate('stopGame()');
  assert(await evaluate('parallaxBackground.skyVideo.paused'),'production stop stops video');
  await evaluate('parallaxBackground.disposeSkyAnimation()');
  assert(await evaluate('parallaxBackground.skyVideo===null && firstVideo.paused && !firstVideo.getAttribute("src")'),'dispose releases the media source');
  await evaluate('initParallax()');
  await until('parallaxBackground.skyVideo?.readyState >= 2','restart reloads decoder');
  assert(await evaluate('parallaxBackground.skyVideo!==firstVideo && parallaxBackground.layers.length===2'),'restart retains one owner and two scene layers');
  // If neither location can be decoded, the production draw uses the existing
  // static city instead of a blank image. No changing URLs or endless retries.
  await evaluate('parallaxBackground.disposeSkyAnimation();parallaxBackground.loadSkyAnimation({url:"/missing-primary.mp4",fallbackUrl:"/missing-fallback.mp4"})');
  await until('parallaxBackground.skyPlaybackBlocked','both unavailable assets settle');
  const fallback=await evaluate(`(()=>{const p=parallaxBackground,ctx=gameCanvas.getContext('2d');ctx.clearRect(0,0,1920,1080);p.drawFarBackground(ctx,p.layers[0],{x:0,y:0});return Array.from(ctx.getImageData(800,500,1,1).data);})()`);
  assert.equal(fallback[3],255,'original artwork remains visible on media failure');
  await screenshot('02-static-fallback');
  assert.deepEqual(errors,[],'no browser JavaScript exceptions');
  receipts.push({media,slowMotion:{rate:.35,realMs:750,mediaAdvanceSec:slowAdvance,restoredRate:1},cloudPixelDifference:rendered.upper,cityPixelDifference:rendered.lower,fixedScaleCases:rendered.records.length});
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,receipts,errors,limits:'Real Chromium H.264 decoder and production background/loop APIs with local assets; not a Makko host acceptance or full game playtest.'},null,2));
  console.log(`Chromium background decode, autoplay, cloud motion, fixed scale, pause/reset/loop/restart/disposal and static fallback passed. Evidence: ${output}`);
}
main().catch(error => {
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ passed: false, error: error.stack, receipts, errors }, null, 2));
  console.error(error); process.exitCode = 1;
}).finally(async () => {
  socket?.close();
  if (chrome && chrome.exitCode === null && chrome.signalCode === null) chrome.kill();
  if (chromeClosed) await chromeClosed;
  server.close();
  // Chromium helpers can finish profile writes after the main process exits.
  // Wait for closed stdio, then retry transient directory-removal races.
  await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});
