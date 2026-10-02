#!/usr/bin/env node
// Earned fresh version-3 showdown in real Chromium, through production
// ActionInput, shared RAF, pursuit and Canvas rendering. The audio clock,
// gamepad device and Campaign persistence are controlled host boundaries.
// Every simulation/input frame uses the shared RAF; native Canvas samples
// cover periodic play, live pursuit transitions and every earned damage state.
// Never injects road progress, health, immunity, abilities, captures or boss hits.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const http = require('node:http'), crypto = require('node:crypto');
const { spawn } = require('node:child_process'), { once } = require('node:events');
const { Driver, instrument, safeItem, PROFILES, ACTION_BUTTON, SNAPSHOT_KEYS } =
  require('./check-cache-road-races.cjs');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.CACHE_PURSUIT_BROWSER_OUTPUT ||
  path.join(os.tmpdir(), 'barcode-cache-pursuit-browser'));
const requireHosted = process.env.CACHE_PURSUIT_BROWSER_REQUIRE_HOSTED === '1';
const chromePath = process.env.CHROME_BIN || ['/usr/bin/google-chrome', '/usr/bin/chromium',
  '/usr/bin/chromium-browser'].find(fs.existsSync);
assert(chromePath, 'Set CHROME_BIN to an installed Chrome/Chromium executable.');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'assets/cache-road/pursuit/atlas-metadata.json')));
const assets = [['cachePursuitRig', 'pursuit-rig-atlas'], ['cachePursuitImpact', 'pursuit-impact-atlas']];
const scripts = ['src/engine/music-profiles.js', 'src/engine/music-transport.js',
  'src/engine/cache-road-proof-profile.js', 'src/engine/presentation-assets.js',
  'src/game/cache-chapter.js', 'src/game/cache-road-landscape.js',
  'src/game/cache-road-encounters.js', 'src/game/cache-road-reactions.js',
  'src/game/cache-road-pursuit.js', 'src/game/cache-road-boss-art.js', 'src/game/cache-road-guidance.js', 'src/game/cache-road-proof.js',
  'src/engine/intro-sequence.js', 'src/engine/cache-scene-layouts.js',
  'src/engine/cache-scene-effects.js', 'src/engine/comic-dialogue.js',
  'src/engine/cache-bridge.js', 'src/engine/cache-ending.js',
  'src/core/action-input.js', 'src/core/gamepad-ui.js', 'src/core/input.js', 'src/core/loop.js'];
fs.mkdirSync(output, { recursive: true });
const checkedFiles = [...scripts, 'tools/check-cache-road-races.cjs', 'tools/check-cache-pursuit-browser.cjs',
  'assets/cache-road/pursuit/atlas-metadata.json', ...metadata.assets.map(asset => asset.runtime)];
const sourceHashes = () => Object.fromEntries(checkedFiles.map(file =>
  [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
const initialSourceHashes = sourceHashes();
const fixture = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oxanium;src:url('/assets/studies/visual-overhaul/references/fonts/Oxanium.ttf') format('truetype');font-weight:200 800}
html,body{margin:0;background:#090e18;width:100%;height:100%;overflow:hidden}
canvas{display:block;width:100vw;height:100vh;object-fit:contain}
</style><canvas id="gameCanvas" width="1920" height="1080"></canvas><script>
window.browserProof={contexts:0,extraCanvases:0,worldUpdates:0,roadUpdates:0,musicStarts:0,
  clock:0,images:[],drawn:{},rigCalls:0,impactCalls:0,rigHealth:{},impactHealth:{},drawCosts:[],saves:[],timingNegative:null,
  completions:[],completionRequests:[],guidanceCalls:0,bossGuidanceCalls:0,
  cues:[],raceFrames:0,rafUpdates:0,simulationFrames:0,pad:{index:0,id:'Standard browser test controller',
    mapping:'standard',connected:true,timestamp:0,axes:[0,0],
    buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))}};
const nativeGetContext=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(...args){
  if(this.id!=='gameCanvas')throw Error('Unexpected secondary Canvas context');
  if(++browserProof.contexts>1)throw Error('Repeated main Canvas context acquisition');
  return nativeGetContext.apply(this,args);
};
const nativeCreate=document.createElement.bind(document);
document.createElement=function(tag,...args){
  if(String(tag).toLowerCase()==='canvas')browserProof.extraCanvases++;
  return nativeCreate(tag,...args);
};
// Existing art is bundled at this controlled host. Hosted mode leaves both
// new pursuit assets on their actual production immutable URLs and refuses
// their bundled fallback; local review truthfully records bundled decoding.
const NativeImage=window.Image;
const srcProperty=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
window.Image=function(...args){const image=new NativeImage(...args);browserProof.images.push(image);
  Object.defineProperty(image,'src',{get(){return srcProperty.get.call(this);},set(value){
    this.proofOriginalSrc=value;
    if(typeof value==='string'&&value.startsWith('https://raw.githubusercontent.com/')&&
       !(${requireHosted}&&value.includes('/assets/cache-road/pursuit/'))){
      const at=value.indexOf('/assets/');if(at>=0)value=value.slice(at);
    }
    srcProperty.set.call(this,value);
  }});return image;
};
window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};
window.gameState={running:false,paused:false,victory:true};window.isPaused=false;window.isRunning=true;
window.updateGame=()=>{browserProof.worldUpdates++;};window.renderGame=()=>{};
Object.defineProperty(navigator,'getGamepads',{value:()=>[browserProof.pad]});
const parent={levelId:'level-01',checkpointId:'intermission',levelState:{difficultyId:'standard'}};
let saved=structuredClone(parent);
const archive={status:'ready',record:{current:structuredClone(parent),progress:{
    completedLevels:['level-01'],unlockedLevels:['level-01','level-02'],items:['stem.voice'],lore:[],results:{}}},
  checkpoint(value){saved=structuredClone(value);this.record.current=structuredClone(value);
    browserProof.saves.push(structuredClone(value));return true;},
  collect(){return true;},
  completeCampaignLevel(level,difficulty,result,item,unlock,options){
    const request={level,difficulty,result:structuredClone(result),item,unlock,
      checkpoint:structuredClone(options.checkpoint),loreIds:structuredClone(options.loreIds||[]),
      source:BARCODE.CacheEnding?.active?'ending-position':'earned-clear'};
    browserProof.completionRequests.push(request);
    // The production archive deduplicates reward facts while saving the same
    // frozen receipt again as the ending's reading position changes.
    if(!browserProof.completions.some(saved=>saved.level===level&&saved.difficulty===difficulty&&
      saved.result.runId===result.runId))browserProof.completions.push(structuredClone(request));
    this.record.progress.completedLevels=[...new Set([...this.record.progress.completedLevels,level])];
    this.record.progress.items=[...new Set([...this.record.progress.items,item])];
    this.record.progress.unlockedLevels=[...new Set([...this.record.progress.unlockedLevels,unlock])];
    this.record.progress.lore=[...new Set([...this.record.progress.lore,...request.loreIds])];
    this.record.progress.results[level]=structuredClone(result);
    return this.checkpoint(options.checkpoint);
  }};
window.BARCODE={Preferences:{values:{reducedMotion:false,flashes:true,inputOffsetMs:0}},
  Campaign:{intermission:true,register(){},syncTitleButton(){},archive:()=>archive,
    readResume:()=>structuredClone(saved),
    validateLevel01Checkpoint:value=>value?.levelId==='level-01'&&value.checkpointId==='intermission',
    saveBridgeCheckpoint:()=>true},
  PauseMenu:{heldKeys:new Set(),drag:null,sync(){},render(){},keyDown(event){
      if(window.isPaused&&['p','escape'].includes(event.key.toLowerCase())){
        BARCODE.RuntimeLifecycle.togglePause();return true;}return false;},
    keyUp(){},pointer:()=>false},
  RuntimeLifecycle:{restart(){throw Error('Unexpected road handoff recovery');},
    togglePause(){window.isPaused=!window.isPaused;gameState.paused=window.isPaused;
      const result=window.isPaused?BARCODE.MusicTransport.pause(audioSystem.context.currentTime):
        BARCODE.MusicTransport.resume(audioSystem.context.currentTime);
      window.lastTime=browserProof.clock;return result;}}};
window.audioSystem={context:{currentTime:0,state:'running'},musicTracks:{},
  prepareActiveMusicProfile:async function(){this.musicTracks=Object.fromEntries(
    BARCODE.MusicProfiles.getActive().arrangement.sources.map(source=>
      [source.sourceId,{buffer:{duration:187.5},isFallback:false}]));return {ok:true};},
  startRuntimeGameplayMusic(){browserProof.musicStarts++;const result=BARCODE.MusicTransport.start({
    sourceAnchorAudioSec:this.context.currentTime,sourceOffsetTrackSec:BARCODE.CacheRoadProof.startOffsetSec()});
    return {ok:result.status==='ok'&&result.running};},
  stopRuntimeAudio(){BARCODE.MusicTransport.stop();},updateLayers(){},stopRoadEngine(){},
  getOutputAudioTime(value){return value??this.context.currentTime;},
  playCombatCue(kind){browserProof.cues.push(kind);return true;},stopCacheBridgeAudio(){}};
</script>${scripts.map(file => `<script src="/${file}"></script>`).join('')}
<script>
const canvas=document.getElementById('gameCanvas');window.renderer={canvas,ctx:canvas.getContext('2d')};
const originalDraw=BARCODE.PresentationAssets.draw;
BARCODE.PresentationAssets.draw=function(key,...args){const ready=originalDraw.call(this,key,...args);
  if(ready)browserProof.drawn[key]=(browserProof.drawn[key]||0)+1;return ready;};
const bossArt=BARCODE.CacheRoadBossArt;
BARCODE.CacheRoadBossArt={...bossArt,
  drawRig(ctx,options){browserProof.rigCalls++;browserProof.rigHealth[options.health]=
      (browserProof.rigHealth[options.health]||0)+1;return bossArt.drawRig(ctx,options);},
  drawImpact(...args){browserProof.impactCalls++;const painted=bossArt.drawImpact(...args);
    if(painted){const health=BARCODE.CacheRoadProof.state.pursuit.boss.health;
      browserProof.impactHealth[health]=(browserProof.impactHealth[health]||0)+1;}return painted;}};
const guidance=BARCODE.CacheRoadGuidance;
if(!guidance)throw Error('Production guidance missing');
BARCODE.CacheRoadGuidance={...guidance,draw(ctx,road,...args){browserProof.guidanceCalls++;
  if(road.status==='playing'&&road.chapter?.encounterVersion===3&&road.state.musicBeatFloat/4>=72)
    browserProof.bossGuidanceCalls++;
  return guidance.draw(ctx,road,...args);}};
const originalUpdate=BARCODE.CacheRoadProof.update;
BARCODE.CacheRoadProof.update=function(...args){browserProof.roadUpdates++;return originalUpdate.apply(this,args);};
const originalRoadDraw=BARCODE.CacheRoadProof.draw;
browserProof.renderedSamples=0;browserProof.drawNext=false;browserProof.drawReasons=[];
BARCODE.CacheRoadProof.draw=function(...args){if(!browserProof.drawNext)return;
  browserProof.drawNext=false;browserProof.renderedSamples++;const begin=performance.now();
  try{return originalRoadDraw.apply(this,args);}finally{
    browserProof.drawCosts.push(performance.now()-begin);}};
const copy=value=>JSON.parse(JSON.stringify(value));
const round=(value,digits=3)=>Number(Number(value||0).toFixed(digits));
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const PROFILES=${JSON.stringify(PROFILES)},ACTION_BUTTON=${JSON.stringify(ACTION_BUTTON)};
const SNAPSHOT_KEYS=${JSON.stringify(SNAPSHOT_KEYS)},safeItem=${safeItem.toString()};
const instrument=${instrument.toString()},Driver=${Driver.toString()};
browserProof.step=ms=>{for(let left=ms;left>0;){const dt=Math.min(20,left);left-=dt;
  browserProof.clock+=dt;audioSystem.context.currentTime+=dt/1000;
  browserProof.rafUpdates++;
  if(BARCODE.CacheRoadProof.active&&BARCODE.CacheRoadProof.status==='playing'&&
      BARCODE.CacheRoadProof.introMs===null&&!window.isPaused)browserProof.simulationFrames++;
  browserProof.pad.timestamp=browserProof.clock;gameLoop(browserProof.clock);}};
browserProof.render=reason=>{const road=BARCODE.CacheRoadProof,before=browserProof.frozen();
  browserProof.drawNext=true;road.draw(renderer.ctx);
  if(JSON.stringify(browserProof.frozen())!==JSON.stringify(before))
    throw Error('Selected native draw changed the pursuit simulation');
  const boss=road.encounterSnapshot().boss;
  browserProof.drawReasons.push({reason,frame:browserProof.raceFrames,
    bar:road.state.musicBeatFloat/4,status:road.status,phase:road.state.pursuit.phase,
    health:boss?.health??null,counterMs:boss?.counterMs??0});};
browserProof.boot=()=>{window.lastTime=browserProof.clock;
  BARCODE.CacheBridge.start({version:1,page:7,cue:2});browserProof.step(20);};
browserProof.startDriver=()=>{const r={B:BARCODE,road:BARCODE.CacheRoadProof,
    pad:browserProof.pad,audio:audioSystem};
  browserProof.observed=instrument(r);
  // One genuine late controller press proves the boundary rejects timing
  // errors. Only the controller policy changes afterward; gameplay is earned.
  browserProof.driver=new Driver(r,PROFILES.practiced,1,browserProof.observed,{timingBiasMs:240});};
browserProof.playChunk=count=>{const road=BARCODE.CacheRoadProof;
  const initialHealth=road.state.pursuit.boss.health;
  for(let frame=0;frame<count&&road.status==='playing';frame++){
    const eventsBefore=browserProof.observed.events.length;
    browserProof.driver.step();browserProof.step(20);browserProof.raceFrames++;
    if(!browserProof.timingNegative){
      const rejected=browserProof.observed.events.find(event=>event.kind==='missed-press'&&
        Number.isFinite(event.timingOffsetMs)&&event.timingOffsetMs>=240);
      if(rejected){browserProof.timingNegative=copy(rejected);browserProof.driver.options.timingBiasMs=0;}
    }
    const view=road.encounterSnapshot(),boss=view.boss;
    if(boss?.arrived&&(!browserProof.lastBossHealth&&browserProof.lastBossHealth!==0||boss.health!==browserProof.lastBossHealth)){
      browserProof.observed.event('boss-health',{health:boss.health,defeated:boss.defeated,
        lastCounter:copy(boss.lastCounter)});browserProof.lastBossHealth=boss.health;
    }
    const actor=view.pursuit,paintKey=JSON.stringify([road.state.pursuit.phase,
      actor?.id,actor?.warning,actor?.locked,actor?.echoCommitted,actor?.crossed,
      boss?.arrived,boss?.visible,boss?.health]);
    const changed=paintKey!==browserProof.lastPaintKey;browserProof.lastPaintKey=paintKey;
    const event=browserProof.observed.events.slice(eventsBefore).find(event=>
      ['capture','missed-press','earned-action','damage','push','brace','echo',
        'turbo-input','pursuit-stage','boss-health'].includes(event.kind));
    if(changed||event||browserProof.raceFrames%25===0)
      browserProof.render(event?.kind||(changed?'visible-pursuit-transition':'periodic'));
    if(road.state.pursuit.boss.health!==initialHealth)break;
  }
  return browserProof.summary();};
browserProof.summary=()=>{const road=BARCODE.CacheRoadProof,s=road.state,boss=road.encounterSnapshot().boss;
  return {status:road.status,encounterVersion:road.chapter.encounterVersion,
    bar:s.musicBeatFloat/4,progress:s.progress,integrity:s.integrity,
    chapter:copy(road.chapter),boss:copy(boss),phase:s.pursuit.phase,
    pursuitSnapshot:BARCODE.CacheRoadPursuit.snapshot(s.pursuit),
    camera:copy(s.cameraMotion),music:BARCODE.MusicTransport.sample(audioSystem.context.currentTime).grid?.beatFloat,
    drawn:{...browserProof.drawn},rigCalls:browserProof.rigCalls,impactCalls:browserProof.impactCalls,
    rigHealth:{...browserProof.rigHealth},impactHealth:{...browserProof.impactHealth},raceFrames:browserProof.raceFrames,
    roadUpdates:browserProof.roadUpdates,
    rafUpdates:browserProof.rafUpdates,simulationFrames:browserProof.simulationFrames,
    renderedSamples:browserProof.renderedSamples,
    guidanceCalls:browserProof.guidanceCalls,bossGuidanceCalls:browserProof.bossGuidanceCalls,
    saved:BARCODE.Campaign.readResume(),completions:copy(browserProof.completions),
    completionRequests:copy(browserProof.completionRequests),
    rewardFacts:copy(BARCODE.Campaign.archive().record.progress)};};
browserProof.frozen=()=>{const s=BARCODE.CacheRoadProof.state;return {
  progress:s.progress,elapsedMs:s.elapsedMs,timeMs:s.timeMs,musicBeat:s.musicBeatFloat,
  pursuit:BARCODE.CacheRoadPursuit.snapshot(s.pursuit),camera:copy(s.cameraMotion),
  heardBeat:BARCODE.MusicTransport.sample(audioSystem.context.currentTime).grid?.beatFloat};};
</script>`;
const requests = { head: 0, localPursuit: [], remotePursuit: [] }, errors = [], frames = [];
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (req.method === 'HEAD') { requests.head++; res.writeHead(405); res.end(); return; }
  if (pathname === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(fixture); return; }
  if (pathname.startsWith('/assets/cache-road/pursuit/')) {
    requests.localPursuit.push(pathname);
    if (requireHosted) { res.writeHead(404); res.end(); return; }
  }
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.ttf': 'font/ttf',
    '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'barcode-pursuit-chrome-'));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const startedAt = Date.now(), progressStages = [], pending = new Map();
const progress = (stage, detail = '') => {
  const elapsedSec = Number(((Date.now() - startedAt) / 1000).toFixed(1));
  progressStages.push({ stage, elapsedSec, detail });
  console.log(`Cache pursuit [${elapsedSec}s] ${stage}${detail ? ': ' + detail : ''}`);
};
const bounded = async (operation, ms, label) => {
  let timeout;
  try { return await Promise.race([operation, new Promise((_, reject) => {
    timeout = setTimeout(() => reject(Error(`${label} timeout after ${ms} ms`)), ms);
  })]); } finally { clearTimeout(timeout); }
};
const rejectPending = error => {
  for (const { reject, timeout } of pending.values()) { clearTimeout(timeout); reject(error); }
  pending.clear();
};
let chrome, chromeClosed, socket, receipt;
async function main() {
  progress('starting local host and Chromium');
  server.listen(0, '127.0.0.1'); await bounded(once(server, 'listening'), 10000, 'Local host startup');
  const origin = `http://127.0.0.1:${server.address().port}`;
  chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required', '--no-first-run', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  chromeClosed = new Promise(resolve => chrome.once('close', resolve));
  const debuggerUrl = await new Promise((resolve, reject) => {
    let stderr = '';
    const timeout = setTimeout(() => fail(Error(`Chrome startup timeout: ${stderr}`)), 30000);
    const cleanup = () => { clearTimeout(timeout); chrome.off('error', fail); chrome.off('close', closed); chrome.stderr.off('data', read); };
    const fail = error => { cleanup(); reject(error); };
    const closed = (code, signal) => fail(Error(`Chrome exited ${signal || code}: ${stderr}`));
    const read = chunk => { stderr = (stderr + chunk).slice(-16384);
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)\s/);
      if (match) { cleanup(); resolve(match[1]); } };
    chrome.once('error', fail); chrome.once('close', closed); chrome.stderr.on('data', read);
  });
  const target = await (await fetch(`${new URL(debuggerUrl).origin.replace('ws:', 'http:')}/json/new`,
    { method: 'PUT', signal: AbortSignal.timeout(30000) })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => fail(Error('Chrome DevTools connection timeout')), 30000);
    const cleanup = () => { clearTimeout(timeout); socket.removeEventListener('open', opened);
      socket.removeEventListener('error', fail); socket.removeEventListener('close', closed); };
    const opened = () => { cleanup(); resolve(); };
    const fail = error => { cleanup(); reject(error); };
    const closed = () => fail(Error('Chrome DevTools closed before connection'));
    socket.addEventListener('open', opened, { once: true }); socket.addEventListener('error', fail, { once: true });
    socket.addEventListener('close', closed, { once: true });
  });
  let serial = 0;
  socket.addEventListener('close', () => rejectPending(Error('Chrome DevTools connection closed')));
  socket.addEventListener('error', () => rejectPending(Error('Chrome DevTools connection failed')));
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.method === 'Network.requestWillBeSent' && message.params.request.url.startsWith('https://') &&
        /\/assets\/cache-road\/pursuit\//.test(message.params.request.url)) requests.remotePursuit.push(message.params.request.url);
    if (pending.has(message.id)) { const { resolve, reject, timeout } = pending.get(message.id); pending.delete(message.id); clearTimeout(timeout);
      if (message.error) reject(Error(JSON.stringify(message.error))); else resolve(message.result); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    if (socket.readyState !== WebSocket.OPEN) { reject(Error(`Chrome DevTools closed before ${method}`)); return; }
    const id = ++serial, timeout = setTimeout(() => { pending.delete(id); reject(Error(`${method} timeout`)); }, 30000);
    pending.set(id, { resolve, reject, timeout });
    try { socket.send(JSON.stringify({ id, method, params })); }
    catch (error) { pending.delete(id); clearTimeout(timeout); reject(error); }
  });
  const evaluate = async expression => { const result = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true, userGesture: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value; };
  const until = async (expression, label) => { for (let i = 0; i < 150; i++) {
    if (await evaluate(expression)) return; await delay(200);
  } throw Error(`Browser timeout: ${label}`); };
  const key = (name, held = true) => send('Input.dispatchKeyEvent', { type: held ? 'keyDown' : 'keyUp', key: name,
    code: name === 'Enter' ? 'Enter' : `Key${name.toUpperCase()}`,
    windowsVirtualKeyCode: name === 'Enter' ? 13 : name.toUpperCase().charCodeAt(0) });
  const tap = async name => { await key(name); await key(name, false); };
  const shot = async state => {
    const image = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = `Pursuit-earned-health-${state.boss.health}.png`;
    fs.writeFileSync(path.join(output, file), Buffer.from(image.data, 'base64'));
    frames.push({ file, fixture: false, health: state.boss.health, bar: state.bar,
      integrity: state.integrity, boss: state.boss, drawn: state.drawn });
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin });
  progress('loading production owners, input and painted art');
  await until('document.readyState==="complete"&&!!window.inputManager&&!!window.renderer', 'production scripts/input ready');
  await evaluate('document.fonts.ready');
  // Readiness is requested through the production loader; no Image override
  // manufactures dimensions or passes a failed decode.
  await until(`${JSON.stringify(assets.map(([key]) => key))}.every(key=>BARCODE.PresentationAssets.ready(key))`,
    requireHosted ? 'both immutable pursuit assets decode' : 'both bundled pursuit assets decode');
  await until('["cacheCar","cacheRival","cacheDashBezel","cacheMirror","cachePulsePad"].every(key=>BARCODE.PresentationAssets.ready(key))',
    'prior cars/dashboard/road paint decode');
  progress('verifying decoded pursuit asset bytes', requireHosted ? 'immutable hosted art' : 'bundled art');
  const decoded = await evaluate(`Promise.all(browserProof.images.filter(image=>
    image.src.includes('/assets/cache-road/pursuit/')).map(async image=>{
      const response=await fetch(image.src);if(!response.ok)throw Error('Pursuit image fetch failed');
      const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
      return {url:image.src,productionUrl:image.proofOriginalSrc,bytes:bytes.byteLength,
        width:image.naturalWidth,height:image.naturalHeight,
        sha256:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')};}))`);
  assert.equal(decoded.length, 2);
  for (const [, name] of assets) {
    const asset = decoded.find(item => item.url.endsWith(`/assets/cache-road/pursuit/${name}.webp`));
    const authored = metadata.assets.find(item => item.asset === name);
    assert(asset && authored, `Missing decoded ${name}`);
    const bytes = fs.readFileSync(path.join(root, authored.runtime));
    assert.equal(asset.bytes, bytes.length);
    assert.equal(asset.sha256, crypto.createHash('sha256').update(bytes).digest('hex'));
    assert.equal(asset.sha256, authored.sha256.runtime);
    assert.deepEqual([asset.width, asset.height], authored.size);
    if (requireHosted) {
      assert.match(asset.url, /^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/[0-9a-f]{40}\/assets\/cache-road\/pursuit\//);
      assert.equal(asset.url, asset.productionUrl);
    }
  }
  // The retained native pursuit gate owns historical v3 behavior. Fresh
  // campaigns use the separate combat rules and their production browser gate.
  progress('entering retained v3 race through native Drive');
  await evaluate(`{const create=BARCODE.CacheChapter.create.bind(BARCODE.CacheChapter);
    BARCODE.CacheChapter.create=options=>({...create(options),encounterVersion:3});browserProof.boot();}`);
  assert.equal(await evaluate('browserProof.musicStarts'), 0);
  await tap('Enter');
  await until('BARCODE.CacheRoadProof.active&&!BARCODE.CacheBridge.active', 'native final Drive enters fresh chapter');
  assert.equal(await evaluate('BARCODE.CacheRoadProof.chapter.encounterVersion'), 3);
  assert.equal(await evaluate('BARCODE.CacheRoadProof.state.invulnerableMs'), 0);
  assert.equal(await evaluate('BARCODE.CacheRoadProof.state.pursuit.boss.health'), 3);
  assert.equal(await evaluate('browserProof.musicStarts'), 0, 'fresh setup stays silent');
  await tap('Enter');
  assert.equal(await evaluate('BARCODE.CacheRoadProof.introMs'), null);
  assert.equal(await evaluate('browserProof.musicStarts'), 1, 'fresh native setup skip starts once');
  await evaluate('browserProof.startDriver()');
  let state, paused = false;
  let lastHeartbeat = Date.now(), lastReportedHealth = null;
  progress('playing full 100-bar race', 'every shared RAF/input update; selected native Canvas frames');
  const seenHealth = new Set();
  for (let chunk = 0; chunk < 500; chunk++) {
    state = await evaluate('browserProof.playChunk(40)');
    if (Date.now() - lastHeartbeat >= 15000 || state.boss && state.boss.health !== lastReportedHealth) {
      progress('race progress', `bar ${state.bar.toFixed(2)}, boss health ${state.boss?.health ?? 'approaching'}, ` +
        `${state.simulationFrames} simulation / ${state.renderedSamples} Canvas frames`);
      lastHeartbeat = Date.now(); lastReportedHealth = state.boss?.health ?? null;
    }
    if (state.boss?.arrived && state.boss.visible !== false && !seenHealth.has(state.boss.health)) { seenHealth.add(state.boss.health); await shot(state); }
    if (state.boss?.arrived && state.boss.visible !== false && !paused) {
      for (const button of [0, 1, 2, 3, 4, 5, 12, 13])
        await evaluate(`browserProof.pad.buttons[${button}].pressed=false`);
      await tap('p'); await evaluate('browserProof.step(20)');
      assert(await evaluate('window.isPaused'), 'native pause enters lifecycle host');
      const before = await evaluate('browserProof.frozen()');
      await evaluate('browserProof.step(1000)');
      assert.deepEqual(await evaluate('browserProof.frozen()'), before,
        'paused shared RAF freezes actual rig, camera, road and audible beat');
      await tap('p');
      assert(!(await evaluate('window.isPaused')));
      paused = true;
    }
    if (state.status !== 'playing') break;
  }
  assert(state, 'full browser race produced a result');
  progress('verifying earned clear, art, timing, pause and persistence');
  assert.equal(state.status, 'clear', JSON.stringify({ status: state.status, bar: state.bar, integrity: state.integrity, boss: state.boss }));
  assert(state.bar >= 100 && state.bar <= 100.02);
  assert.equal(state.encounterVersion, 3);
  assert.equal(state.boss.health, 0); assert.equal(state.boss.defeated, true);
  assert.equal(state.boss.counters, 3);
  assert.deepEqual([...seenHealth], [3, 2, 1, 0], 'all actual earned damage states were rendered');
  assert(state.rigCalls > 0 && state.drawn.cachePursuitRig > 0, 'production front/rear drawRig paints the new rig');
  assert(state.impactCalls > 0 && state.drawn.cachePursuitImpact > 0, 'earned counters paint actual impact art');
  assert(state.guidanceCalls > 0 && state.bossGuidanceCalls > 0,
    'production fixed route and three-system boss guidance is drawn during the earned race');
  for (const health of [3, 2, 1, 0]) assert(state.rigHealth[health] > 0, `drawRig painted health ${health}`);
  for (const health of [2, 1, 0]) assert(state.impactHealth[health] > 0,
    `earned counter impact art was painted at health ${health}`);
  assert(state.simulationFrames >= 9375, 'every 20 ms simulation update spans the full 187.5-second race');
  assert.equal(state.roadUpdates, state.simulationFrames, 'every racing frame traverses the actual shared-RAF road update');
  assert(state.rafUpdates > state.simulationFrames, 'shared RAF also processes bridge and paused input polling');
  assert(state.renderedSamples >= 100 && state.renderedSamples < state.simulationFrames / 4,
    'representative native Canvas samples supplement every actual simulation frame');
  assert(paused, 'pause was exercised during actual boss approach');
  assert(state.chapter.delivery && state.chapter.delivery.result.accurate > 0 && state.chapter.delivery.result.elapsedMs >= 187500);
  assert.equal(state.completions.length, 1, 'one unique earned Campaign run receipt');
  assert.equal(state.completionRequests.length, 2, 'earned clear and initial ending position both persist');
  assert.deepEqual(state.completionRequests.map(request=>request.source), ['earned-clear','ending-position']);
  for(const request of state.completionRequests)
    assert.deepEqual(request.result, state.chapter.delivery.result,
      'repeated persistence keeps the same frozen earned receipt');
  for(const [key,id] of [['completedLevels','level-02'],['items','stem.bass'],['unlockedLevels','level-03']])
    assert.equal(state.rewardFacts[key].filter(value=>value===id).length, 1,
      'the earned reward fact remains unique');
  assert.deepEqual(state.rewardFacts.lore, [...new Set(state.chapter.records)],
    'optional earned records are persisted without duplicate facts');
  assert.deepEqual(state.saved.levelState.chapter.delivery.ending, state.chapter.delivery.ending,
    'the second persistence stores the current ending position');
  assert.equal(state.completions[0].level, 'level-02');
  assert.equal(state.completions[0].item, 'stem.bass');
  assert.equal(state.completions[0].unlock, 'level-03');
  assert.equal(state.saved.checkpointId, 'road-clear');
  assert.deepEqual(state.saved.levelState.chapter.delivery.result, state.chapter.delivery.result);
  assert.equal(await evaluate('BARCODE.CacheChapter.saveStatus()'), 'saved');
  assert(await evaluate('BARCODE.CacheEnding.active'), 'earned clear enters production authored ending');
  assert.equal(await evaluate('browserProof.musicStarts'), 1);
  assert.equal(await evaluate('browserProof.contexts'), 1);
  assert.equal(await evaluate('browserProof.extraCanvases'), 0);
  assert.equal(await evaluate('browserProof.worldUpdates'), 0);
  assert.equal(await evaluate('document.querySelectorAll("canvas").length'), 1);
  assert.equal(requests.head, 0);
  if (requireHosted) assert.deepEqual(requests.localPursuit, [], 'immutable new art never silently uses bundled fallback');
  assert.deepEqual(errors, []);
  assert.deepEqual(sourceHashes(), initialSourceHashes, 'all loaded source/art bytes remain frozen throughout the browser run');
  const events = await evaluate('browserProof.observed.events');
  const timingNegative = await evaluate('browserProof.timingNegative');
  assert(timingNegative?.kind === 'missed-press' && timingNegative.timingOffsetMs >= 240 &&
    timingNegative.feedback === 'late', 'an actual off-window controller press receives late feedback and is rejected');
  const captures = events.filter(event => event.kind === 'capture');
  assert(captures.length > 0 && captures.every(event => Number.isFinite(event.timingOffsetMs) &&
    Math.abs(event.timingOffsetMs) <= 180 + 1e-6), 'every earned capture lies inside the existing 180 ms window');
  const costs = (await evaluate('browserProof.drawCosts')).sort((a, b) => a - b);
  const drawSamples = await evaluate('browserProof.drawReasons');
  assert.equal(costs.length, state.renderedSamples);
  assert.equal(drawSamples.length, state.renderedSamples);
  for (const health of [2, 1, 0]) assert(drawSamples.some(sample => sample.health === health && sample.counterMs > 0),
    `the live earned counter at health ${health} has an immediate native draw sample`);
  const percentile = p => costs[Math.min(costs.length - 1, Math.floor(costs.length * p))];
  const drawCostMs = { samples: costs.length, mean: costs.reduce((a, b) => a + b, 0) / costs.length,
    median: percentile(.5), p95: percentile(.95), p99: percentile(.99), maximum: costs.at(-1),
    meaning: 'Selected native headless Chromium synchronous production draw-call cost, accelerated deterministic host clock. Periodic, visible pursuit transition and earned event samples; not every display frame, display FPS, wall-clock pacing or device performance acceptance.' };
  receipt = { passed: true, artMode: requireHosted ? 'immutable-hosted' : 'bundled-local', decoded,
    frames, final: state, requests, drawCostMs, drawSamples, events, timingNegative,
    rendering: { simulationFrames: state.simulationFrames, sharedRafUpdates: state.rafUpdates,
      nativeCanvasSamples: state.renderedSamples, periodicEverySimulationFrames: 25,
      selection: 'Periodic plus visible pursuit phase/warning/lock/crossing and earned capture, action, damage and boss health events.',
      simulationUnchangedBySampledDraws: true, everyDisplayFrameRendered: false },
    driverPolicy: { ...PROFILES.practiced, gear: 2, initialTimingBiasMs: 240,
      timingProbe: 'After the first actual late rejected press, clear policy bias for later offers; already observed offers retain their intended timing error.', observation: 'production visible encounter snapshot', controls: 'mock standard gamepad through production ActionInput' },
    checks: { freshNativeDrive: true, full100BarRace: true, earnedThreeCounters: true,
      actualDamageFrames: [3, 2, 1, 0], productionRigAndImpactDraws: true,
      immediateEarnedCounterDraws: [2, 1, 0], everySharedRafSimulationFrame: true,
      productionFixedGuidanceDrawn: true,
      pausedRigCameraMusicFrozen: true, uniqueEarnedRun: true, uniqueBassReward: true,
      rawPersistenceCallCount: state.completionRequests.length,
      identicalRepeatedReceipt: true, uniqueRewardFacts: true,
      actualLateControllerPressRejected: true, acceptedCaptureWindowMs: 180,
      canvasCount: 1, contextAcquisitions: 1, unrelatedWorldUpdates: 0, stateInjection: false },
    sourceHashes: initialSourceHashes, sourceStableThroughoutRun: true,
    limits: 'Real Chromium production input/RAF/pursuit earned playthrough with every shared-RAF simulation update and selected native Canvas samples, not every display frame. Prior art is bundled. Audio clock, physical gamepad and Campaign persistence are controlled host boundaries; the final bridge-ready position is a saved reading fixture. No health/progress/immunity/resources/captures/boss-hit injection. Synchronous sampled draw cost does not establish display pacing. Separate tests cover actual storage and recorded audio. Not Makko, physical-controller, human-balance or comfort acceptance.' };
  progress('passed', `${requireHosted ? 'immutable hosted' : 'bundled'} art; earned health 3/2/1/0; full 100 bars, rejected late press, one Canvas, pause and completion; ` +
    `${state.simulationFrames} simulation / ${state.renderedSamples} Canvas frames`);
}
bounded(main(), 10 * 60 * 1000, 'Full pursuit browser check').catch(error => {
  receipt = { passed: false, error: error.stack, frames, requests, errors };
  console.error(error); process.exitCode = 1; }).finally(async () => {
  progress('closing Chromium and local host');
  rejectPending(Error('Pursuit browser check finished')); socket?.close();
  try {
    if (chrome && chrome.exitCode === null && chrome.signalCode === null) chrome.kill('SIGTERM');
    if (chromeClosed) {
      try { await bounded(chromeClosed, 5000, 'Chrome graceful shutdown'); }
      catch { chrome.kill('SIGKILL'); await bounded(chromeClosed, 5000, 'Chrome forced shutdown'); }
    }
    server.closeAllConnections();
    await bounded(new Promise(resolve => server.close(resolve)), 5000, 'Local host shutdown');
    await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
  } catch (error) { receipt = { ...receipt, passed: false, cleanupError: error.stack };
    console.error(error); process.exitCode = 1; }
  receipt = { ...receipt, progressStages, wallTimeSec: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
    timeoutMs: 10 * 60 * 1000 };
  fs.writeFileSync(path.join(output, 'Pursuit-Browser-Checks.json'), JSON.stringify(receipt || { passed: false }, null, 2) + '\n');
});
