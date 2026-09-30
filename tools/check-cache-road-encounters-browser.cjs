// Real Chromium production bridge -> road input, shared Canvas/RAF, encounter
// modules, and production sprite renderer. Audio clock/Campaign persistence
// are controlled host boundaries. Ability/delivery shots are explicit state
// fixtures, not a played race; complete-race balance is checked separately.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const root=path.resolve(__dirname,'..');
const output=path.resolve(process.env.CACHE_ENCOUNTERS_BROWSER_OUTPUT||
  path.join(os.tmpdir(),'barcode-cache-encounters-browser'));
const chromePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium',
  '/usr/bin/chromium-browser'].find(fs.existsSync);
assert(chromePath,'Set CHROME_BIN to an installed Chrome/Chromium executable.');
fs.mkdirSync(output,{recursive:true});
const artRevision='8b9343cd365d2efc9c6f04c4d65295fd293eec9b';
const assets=[['cachePushArc','push-arc'],['cacheBraceHalo','brace-halo'],
  ['cacheEchoRibbons','echo-ribbons'],['cacheDeliveryBeacon','delivery-beacon']];
const scripts=['src/engine/music-profiles.js','src/engine/music-transport.js',
  'src/engine/cache-road-proof-profile.js','src/engine/presentation-assets.js',
  'src/game/cache-chapter.js','src/game/cache-road-landscape.js',
  'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
  'src/game/cache-road-pursuit.js','src/game/cache-road-proof.js',
  'src/engine/cache-scene-layouts.js','src/engine/cache-scene-effects.js','src/engine/comic-dialogue.js',
  'src/engine/cache-bridge.js','src/core/action-input.js','src/core/gamepad-ui.js',
  'src/core/input.js','src/core/loop.js'];
const fixture=`<!doctype html><style>
@font-face{font-family:Oxanium;src:url('/assets/studies/visual-overhaul/references/fonts/Oxanium.ttf') format('truetype');font-weight:200 800}
html,body{margin:0;background:#090e18;width:100%;height:100%;overflow:hidden}
canvas{display:block;width:100vw;height:100vh;object-fit:contain}
</style><canvas id="gameCanvas" width="1920" height="1080"></canvas><script>
window.browserProof={contexts:0,extraCanvases:0,worldUpdates:0,roadUpdates:0,musicStarts:0,
  clock:0,images:[],drawn:{},saves:[],cues:[]};
const nativeGetContext=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(...args){
  if(this.id!=='gameCanvas')throw Error('Unexpected secondary Canvas context');
  if(++browserProof.contexts>1)throw Error('Repeated main Canvas context acquisition');
  return nativeGetContext.apply(this,args);
};
const nativeCreate=document.createElement.bind(document);
document.createElement=function(tag,...args){if(String(tag).toLowerCase()==='canvas')browserProof.extraCanvases++;
  return nativeCreate(tag,...args);};
// Prior approved art uses the bundled host. The four new files bypass this
// host adapter and retain the exact production immutable remote URL.
const NativeImage=window.Image,srcProperty=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
window.Image=function(...args){const image=new NativeImage(...args);browserProof.images.push(image);
  Object.defineProperty(image,'src',{get(){return srcProperty.get.call(this);},set(value){
    if(typeof value==='string'&&value.startsWith('https://raw.githubusercontent.com/')&&
       !value.includes('/assets/cache-road/encounters/')){
      const at=value.indexOf('/assets/');if(at>=0)value=value.slice(at);
    }
    srcProperty.set.call(this,value);
  }});return image;};
window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};
window.gameState={running:false,paused:false,victory:true};window.isPaused=false;window.isRunning=true;
window.updateGame=()=>{browserProof.worldUpdates++;};window.renderGame=()=>{};
Object.defineProperty(navigator,'getGamepads',{value:()=>[]});
const parent={levelId:'level-01',checkpointId:'intermission',levelState:{difficultyId:'standard'}};
let saved=structuredClone(parent);
const archive={status:'ready',record:{progress:{completedLevels:['level-01'],items:['stem.voice']}},
  checkpoint(value){saved=structuredClone(value);browserProof.saves.push(saved);return true;}};
window.BARCODE={Preferences:{values:{reducedMotion:false,inputOffsetMs:0}},Campaign:{intermission:true,
  register(){},syncTitleButton(){},archive:()=>archive,readResume:()=>structuredClone(saved),
  validateLevel01Checkpoint:value=>value?.levelId==='level-01'&&value.checkpointId==='intermission',
  saveBridgeCheckpoint:()=>true},PauseMenu:{heldKeys:new Set(),drag:null,
    sync(){},keyDown:()=>false,keyUp(){},pointer:()=>false},
  RuntimeLifecycle:{restart(){throw Error('Unexpected road handoff recovery');}}};
window.audioSystem={context:{currentTime:0,state:'running'},musicTracks:{},
  prepareActiveMusicProfile:async function(){this.musicTracks=Object.fromEntries(
    BARCODE.MusicProfiles.getActive().arrangement.sources.map(source=>
      [source.sourceId,{buffer:{duration:187.5},isFallback:false}]));return {ok:true};},
  startRuntimeGameplayMusic(){browserProof.musicStarts++;const result=BARCODE.MusicTransport.start({
    sourceAnchorAudioSec:this.context.currentTime,sourceOffsetTrackSec:BARCODE.CacheRoadProof.startOffsetSec()});
    return {ok:result.status==='ok'&&result.running};},
  stopRuntimeAudio(){BARCODE.MusicTransport.stop();},updateLayers(){},stopRoadEngine(){},
  getOutputAudioTime(value){return value??this.context.currentTime;},
  playCombatCue(kind){browserProof.cues.push(kind);return true;},
  stopCacheBridgeAudio(){}};
</script>${scripts.map(file=>`<script src="/${file}"></script>`).join('')}
<script>
const canvas=document.getElementById('gameCanvas');window.renderer={canvas,ctx:canvas.getContext('2d')};
const originalDraw=BARCODE.PresentationAssets.draw;
BARCODE.PresentationAssets.draw=function(key,...args){const ready=originalDraw.call(this,key,...args);
  if(ready)browserProof.drawn[key]=(browserProof.drawn[key]||0)+1;return ready;};
const originalUpdate=BARCODE.CacheRoadProof.update;
BARCODE.CacheRoadProof.update=function(...args){browserProof.roadUpdates++;return originalUpdate.apply(this,args);};
browserProof.step=ms=>{for(let left=ms;left>0;){const dt=Math.min(50,left);left-=dt;
  browserProof.clock+=dt;audioSystem.context.currentTime+=dt/1000;gameLoop(browserProof.clock);}};
browserProof.boot=()=>{window.lastTime=browserProof.clock;
  BARCODE.CacheBridge.start({version:1,page:7,cue:2});browserProof.step(50);};
browserProof.renderFixture=kind=>{const road=BARCODE.CacheRoadProof,s=road.state;
  s.ramMs=0;s.shield=0;s.defenseFlashMs=0;s.defenseKind='';
  if(kind==='push'){s.ramMs=1200;s.defenseKind='PUSH';s.defenseFlashMs=450;}
  if(kind==='brace'){s.shield=1;s.defenseKind='BRACE';s.defenseFlashMs=450;}
  if(kind==='delivery'){s.gateAt=s.progress+120;s.echo=null;
    BARCODE.CacheRoadPursuit.step(s.pursuit,{before:s.progress,progress:s.progress,
      barFloat:92,dt:0,lane:s.lanePos,gateAt:s.gateAt,difficultyId:'standard'});}
  road.draw(renderer.ctx);
  return {kind,drawn:{...browserProof.drawn},contexts:browserProof.contexts,
    extraCanvases:browserProof.extraCanvases,phase:s.pursuit.phase,
    pursuit:BARCODE.CacheRoadPursuit.pose(s.pursuit,{progress:s.progress})};};
</script>`;
const requests={head:0,localArt:[],remoteArt:[]},errors=[],frames=[];
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(req.method==='HEAD'){requests.head++;res.writeHead(405);res.end();return;}
  if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(fixture);return;}
  if(pathname.startsWith('/assets/cache-road/encounters/')){
    requests.localArt.push(pathname);res.writeHead(404);res.end();return;}
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.ttf':'font/ttf',
    '.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'barcode-encounters-chrome-'));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let chrome,chromeClosed,socket,receipt;
async function main(){
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const origin=`http://127.0.0.1:${server.address().port}`;
  chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required','--no-first-run','--remote-debugging-port=0',
    `--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
  chromeClosed=new Promise(resolve=>chrome.once('close',resolve));
  const debuggerUrl=await new Promise((resolve,reject)=>{
    let stderr='';const timeout=setTimeout(()=>fail(Error(`Chrome startup timeout: ${stderr}`)),30000);
    const cleanup=()=>{clearTimeout(timeout);chrome.off('error',fail);chrome.off('close',closed);chrome.stderr.off('data',read);};
    const fail=error=>{cleanup();reject(error);};const closed=code=>fail(Error(`Chrome exited ${code}: ${stderr}`));
    const read=chunk=>{stderr=(stderr+chunk).slice(-16384);const m=stderr.match(/DevTools listening on (ws:\/\/\S+)\s/);
      if(m){cleanup();resolve(m[1]);}};
    chrome.once('error',fail);chrome.once('close',closed);chrome.stderr.on('data',read);
  });
  const target=await(await fetch(`${new URL(debuggerUrl).origin.replace('ws:','http:')}/json/new`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let serial=0;const pending=new Map();
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);
    if(message.method==='Network.requestWillBeSent'&&/\/assets\/cache-road\/encounters\//.test(message.params.request.url)&&
        message.params.request.url.startsWith('https://'))requests.remoteArt.push(message.params.request.url);
    if(pending.has(message.id)){const {resolve,reject,timeout}=pending.get(message.id);pending.delete(message.id);clearTimeout(timeout);
      if(message.error)reject(Error(JSON.stringify(message.error)));else resolve(message.result);}
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++serial,timeout=setTimeout(()=>{pending.delete(id);reject(Error(`${method} timeout`));},30000);
    pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));
  });
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{
    expression,returnByValue:true,awaitPromise:true,userGesture:true});
    assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;};
  const until=async(expression,label)=>{for(let i=0;i<150;i++){
    if(await evaluate(expression))return;await delay(200);}throw Error(`Browser timeout: ${label}`);};
  const key=(name,held=true)=>send('Input.dispatchKeyEvent',{type:held?'keyDown':'keyUp',key:name,
    code:name==='Enter'?'Enter':name.startsWith('Arrow')?name:`Key${name.toUpperCase()}`,
    windowsVirtualKeyCode:name==='Enter'?13:name==='ArrowRight'?39:name.toUpperCase().charCodeAt(0)});
  const shot=async(kind)=>{const frame=await evaluate(`browserProof.renderFixture(${JSON.stringify(kind)})`);
    const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    const file=`Encounter-${kind}.png`;fs.writeFileSync(path.join(output,file),Buffer.from(image.data,'base64'));
    frames.push({...frame,file,fixture:true});return frame;};
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin});
  await until('document.readyState==="complete"&&!!window.inputManager&&!!window.renderer','production scripts and input ready');
  await evaluate('document.fonts.ready');
  await until(`${JSON.stringify(assets.map(([key])=>key))}.every(key=>BARCODE.PresentationAssets.ready(key))`,
    'four new production images decode directly from GitHub');
  await until('["cacheCar","cacheRival","cacheDashBezel","cacheMirror","cachePulsePad"].every(key=>BARCODE.PresentationAssets.ready(key))',
    'existing cars, dashboard, mirror and road paint decode from bundled host');
  const hosted=await evaluate(`Promise.all(browserProof.images.filter(image=>
    image.src.includes('/assets/cache-road/encounters/')).map(async image=>{
      const response=await fetch(image.src);if(!response.ok)throw Error('Hosted encounter image fetch failed');
      const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
      return {url:image.src,bytes:bytes.byteLength,width:image.naturalWidth,height:image.naturalHeight,
        sha256:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('')};}))`);
  assert.equal(hosted.length,4);
  for(const [,name] of assets){
    const asset=hosted.find(item=>item.url.endsWith(`/assets/cache-road/encounters/${name}.webp`));
    assert(asset,`Missing decoded ${name}`);
    assert.equal(asset.url,`https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/${artRevision}/assets/cache-road/encounters/${name}.webp`);
    const bytes=fs.readFileSync(path.join(root,'assets/cache-road/encounters',`${name}.webp`));
    assert.equal(asset.bytes,bytes.length);assert.equal(asset.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
    assert(asset.width>1000&&asset.height>700);
  }
  // The ready panel is a saved-position fixture; Drive itself is native input
  // through the real bridge, road entry, profile selection, and checkpoint.
  await evaluate('browserProof.boot()');
  assert.equal(await evaluate('browserProof.musicStarts'),0);
  await key('Enter');await key('Enter',false);
  await until('BARCODE.CacheRoadProof.active&&!BARCODE.CacheBridge.active','native final Drive enters authored road');
  assert.equal(await evaluate('BARCODE.CacheRoadProof.chapter.encounterVersion'),2);
  assert(await evaluate('!!BARCODE.CacheRoadProof.state.encounters&&!!BARCODE.CacheRoadProof.state.pursuit'));
  assert.equal(await evaluate('browserProof.musicStarts'),1);
  await evaluate('browserProof.step(100)');
  const laneBefore=await evaluate('BARCODE.CacheRoadProof.state.lanePos');
  await key('ArrowRight');await evaluate('browserProof.step(300)');await key('ArrowRight',false);
  assert((await evaluate('BARCODE.CacheRoadProof.state.lanePos'))>laneBefore+.3,'native steering moves the actual road car');
  assert((await evaluate('BARCODE.CacheRoadProof.state.progress'))>0,'production clock advances road position');
  // Refill is an explicit test fixture, while Echo activation uses real input.
  await evaluate('BARCODE.CacheRoadProof.state.echoEnergy=100');
  await key('h');await evaluate('browserProof.step(50)');await key('h',false);
  assert(await evaluate('!!BARCODE.CacheRoadProof.state.echo'),'native Echo key activates the production decoy');
  const inputRoute=await evaluate(`({musicStarts:browserProof.musicStarts,roadUpdates:browserProof.roadUpdates,
    progress:BARCODE.CacheRoadProof.state.progress,lane:BARCODE.CacheRoadProof.state.lanePos,
    echoActive:!!BARCODE.CacheRoadProof.state.echo,checkpoint:browserProof.saves.at(-1)?.checkpointId})`);
  assert.equal(inputRoute.checkpoint,'road-start');
  const push=await shot('push');assert(push.drawn.cachePushArc>0&&push.drawn.cacheEchoRibbons>0);
  const brace=await shot('brace');assert(brace.drawn.cacheBraceHalo>0);
  const delivery=await shot('delivery');assert(delivery.drawn.cacheDeliveryBeacon>0);assert.equal(delivery.phase,'delivery');
  assert.equal(delivery.pursuit?.id,'delivery-audit','final shot includes the actual delivery pursuit actor');
  assert(delivery.drawn.cacheRival>0,'delivery audit uses the approved animated rival sprite');
  assert.equal(await evaluate('browserProof.contexts'),1);assert.equal(await evaluate('browserProof.extraCanvases'),0);
  assert.equal(await evaluate('browserProof.worldUpdates'),0);assert.equal(await evaluate('document.querySelectorAll("canvas").length'),1);
  assert.equal(requests.head,0);assert.deepEqual(requests.localArt,[],'new assets cannot silently use bundled fallback');
  assert.deepEqual(errors,[]);
  receipt={passed:true,artRevision,hosted,frames,requests,inputRoute,mainContextCalls:1,extraCanvases:0,
    nativeBridgeDrive:true,nativeSteering:true,nativeEchoActivation:true,productionEncounterOwners:true,
    allFourProductionSpriteDraws:true,
    limits:'Real Chromium hosted-byte/decode and production Canvas/input/RAF smoke. Campaign persistence and audio clock are controlled boundaries; prior art is served from bundled files. Push/Brace/delivery screenshot states and Echo refill are explicit fixtures, not complete-race or audio evidence. Complete races and real MP3 audio have separate checks. Not Makko/device acceptance.'};
  console.log('Cache encounters Chromium passed: four hosted byte-identical sprites, native Drive/steering/Echo, production encounter owners and three fixture screenshots on one Canvas.');
}
main().catch(error=>{receipt={passed:false,error:error.stack,frames,requests,errors};console.error(error);process.exitCode=1;})
  .finally(async()=>{
    fs.writeFileSync(path.join(output,'Encounters-Browser-Checks.json'),JSON.stringify(receipt||{passed:false},null,2)+'\n');
    socket?.close();if(chrome&&chrome.exitCode===null&&chrome.signalCode===null)chrome.kill();
    if(chromeClosed)await chromeClosed;server.close();
    await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
  });
