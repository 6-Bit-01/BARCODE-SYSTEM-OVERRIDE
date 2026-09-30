// Real Chromium, real shared Canvas/input/RAF/bridge/audio owners. Campaign
// persistence and the final road-entry endpoint are counted host boundaries;
// check-cache-bridge.cjs separately exercises their full game integration.
// Local bridge art is deliberately unavailable: all eight pictures must decode
// from the production immutable GitHub URLs and match the bundled bytes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const root=path.resolve(__dirname,'..');
const output=path.resolve(process.env.CACHE_BRIDGE_BROWSER_OUTPUT||
  path.join(os.tmpdir(),'barcode-cache-bridge-browser'));
const chromePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium',
  '/usr/bin/chromium-browser'].find(fs.existsSync);
assert(chromePath,'Set CHROME_BIN to an installed Chrome/Chromium executable.');
fs.mkdirSync(output,{recursive:true});
const scripts=['src/engine/audio.js','src/core/action-input.js','src/core/gamepad-ui.js',
  'src/engine/cache-scene-layouts.js','src/engine/cache-scene-effects.js','src/engine/comic-dialogue.js',
  'src/engine/cache-bridge.js','src/core/input.js','src/core/loop.js'];
const fixture=`<!doctype html><style>
@font-face{font-family:Oxanium;src:url('/assets/studies/visual-overhaul/references/fonts/Oxanium.ttf') format('truetype');font-weight:200 800}
html,body{margin:0;background:#090e18;width:100%;height:100%;overflow:hidden}
canvas{display:block;width:100vw;height:100vh;object-fit:contain}
</style><canvas id="gameCanvas" width="1920" height="1080"></canvas><script>
window.browserProof={contexts:0,worldUpdates:0,roadEntries:0,saves:[],back:0,clock:0,pad:null};
const nativeGetContext=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(...args){
  if(this.id==='gameCanvas'&&++browserProof.contexts>1)throw Error('Repeated main Canvas context acquisition');
  return nativeGetContext.apply(this,args);
};
window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};
window.gameState={running:false,paused:false,victory:true};window.isPaused=false;window.isRunning=true;
window.updateGame=()=>{browserProof.worldUpdates++;};window.renderGame=()=>{};
Object.defineProperty(navigator,'getGamepads',{value:()=>browserProof.pad?[browserProof.pad]:[]});
window.BARCODE={Preferences:{values:{reducedMotion:false}},Campaign:{intermission:true,
  archive:()=>({status:'ready'}),saveBridgeCheckpoint:s=>{browserProof.saves.push({...s});return true;},
  closeIntermission:()=>{browserProof.back++;BARCODE.CacheBridge.dispose();}},
  CacheRoadProof:{enter:async()=>{browserProof.roadEntries++;window.isRunning=false;return {ok:true};}},
  RuntimeLifecycle:{togglePause(){const promise=(async()=>{window.isPaused=!window.isPaused;gameState.paused=window.isPaused;
      const result=await(window.isPaused?audioSystem.pauseRuntimeAudio():audioSystem.resumeRuntimeAudio());
      window.lastTime=browserProof.clock;return result;})();browserProof.pausePromise=promise;return promise;}},
  PauseMenu:{heldKeys:new Set(),drag:null,sync(){},render(){},keyDown(event){
    if(['p','escape'].includes(event.key.toLowerCase()))BARCODE.RuntimeLifecycle.togglePause();return true;},
    keyUp(){},pointer(){return false;}}};
</script>${scripts.map(file=>`<script src="/${file}"></script>`).join('')}
<script>
window.audioSystem=new AudioSystem();audioSystem.context=new AudioContext();
audioSystem.sfxGain=audioSystem.context.createGain();audioSystem.sfxGain.gain.value=.8;
audioSystem.sfxGain.connect(audioSystem.context.destination);audioSystem.musicGain=audioSystem.context.createGain();
const canvas=document.getElementById('gameCanvas');window.renderer={canvas,ctx:canvas.getContext('2d')};
browserProof.step=ms=>{for(let left=ms;left>0;){const dt=Math.min(20,left);left-=dt;
  browserProof.clock+=dt;gameLoop(browserProof.clock);}};
browserProof.boot=(page=0,cue=0)=>{BARCODE.CacheBridge.dispose();BARCODE.Campaign.intermission=true;
  window.isRunning=true;window.isPaused=false;gameState.paused=false;window.lastTime=browserProof.clock;
  BARCODE.CacheBridge.start({version:1,page,cue});browserProof.step(40);};
</script>`;
const requests={head:0,localArt:[],remoteArt:[]},errors=[],frames=[];
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(req.method==='HEAD'){requests.head++;res.writeHead(405);res.end();return;}
  if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(fixture);return;}
  if(pathname.startsWith('/assets/cache-bridge/')){
    requests.localArt.push(pathname);res.writeHead(404);res.end();return;
  }
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.ttf':'font/ttf'}[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'barcode-bridge-chrome-'));
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
    if(message.method==='Network.requestWillBeSent'&&/\/assets\/cache-bridge\//.test(message.params.request.url)&&
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
  const key=async(name,down=true,repeat=false)=>send('Input.dispatchKeyEvent',{
    type:down?'keyDown':'keyUp',key:name,code:name==='Enter'?'Enter':name===' '?'Space':
      name==='Escape'?'Escape':`Key${name.toUpperCase()}`,autoRepeat:repeat,
    windowsVirtualKeyCode:name==='Enter'?13:name===' '?32:name==='Escape'?27:name.toUpperCase().charCodeAt(0)});
  const tap=async name=>{await key(name);await key(name,false);await evaluate('browserProof.step(40)');};
  const state=()=>evaluate(`({active:BARCODE.CacheBridge.active,page:BARCODE.CacheBridge.page,cue:BARCODE.CacheBridge.cue,
    skip:BARCODE.CacheBridge.skipMs,roadEntries:browserProof.roadEntries,voices:audioSystem.combatVoices?.size||0})`);
  const sceneClock=()=>evaluate('BARCODE.CacheBridge.sceneElapsedMs');
  const render=async page=>{
    const frame=await evaluate(`(()=>{browserProof.step(240);const b=BARCODE.CacheBridge,ctx=renderer.ctx;
      const pixels=ctx.getImageData(176,104,1568,712).data;let bright=0;
      for(let i=0;i<pixels.length;i+=64)if(pixels[i]+pixels[i+1]+pixels[i+2]>120)bright++;
      const preferences=BARCODE.Preferences.values,reduced=preferences.reducedMotion,flashes=preferences.flashes;
      const still=mode=>{
        preferences.reducedMotion=mode==='reduced';preferences.flashes=mode!=='flashesOff';browserProof.step(20);
        const first=ctx.getImageData(0,0,1920,1080).data;browserProof.step(400);
        const second=ctx.getImageData(0,0,1920,1080).data;return first.every((value,i)=>value===second[i]);};
      let reducedMotionStatic,flashesOffStatic;
      try{reducedMotionStatic=still('reduced');flashesOffStatic=still('flashesOff');}
      finally{preferences.reducedMotion=reduced;preferences.flashes=flashes;browserProof.step(20);}
      const imageRect=b.imageRect(),bubbles=b.dialogueLayouts(ctx).map(l=>{
        ctx.save();ctx.font='bold '+l.fontSize+'px Oxanium, sans-serif';
        const lineWidths=l.lines.map(line=>ctx.measureText(line).width);ctx.restore();return {...l,lineWidths};});
      return {page:b.page,cue:b.cue,title:b.panels[b.page].title,status:b.images[b.page].status,
        source:b.images[b.page].element.src,contexts:browserProof.contexts,bright,imageRect,bubbles,
        reducedMotionStatic,flashesOffStatic,
        webp:renderer.canvas.toDataURL('image/webp',.92).split(',')[1]};})()`);
    assert.equal(frame.page,page);assert.equal(frame.cue,2);assert.equal(frame.status,'ready');
    assert(frame.bright>3000,'illustrated page must contain substantial visible art');assert.equal(frame.contexts,1);
    assert.equal(frame.bubbles.length,2,'both authored dialogue lines have measured balloons');
    for(const l of frame.bubbles){
      assert([l.x,l.y,l.w,l.h,l.fontSize,l.lineHeight].every(Number.isFinite));
      assert(l.w>0&&l.h>0&&l.fontSize>=28&&l.lineHeight>=l.fontSize);
      assert(l.x>=0&&l.x+l.w+8<=1920&&l.y>=104&&l.y+l.h+8<=986,
        'balloon body and shadow stay between the title and status/control bands');
      for(const box of [l.textRect,l.labelRect]){
        assert([box.x,box.y,box.w,box.h].every(Number.isFinite)&&box.w>0&&box.h>0);
        assert(box.x>=l.x&&box.y>=l.y&&box.x+box.w<=l.x+l.w&&box.y+box.h<=l.y+l.h,
          'lettering remains inside its balloon');
      }
      assert(l.lines.length>0&&l.lineWidths.every(width=>width<=l.textRect.w+.01),'actual Oxanium lines fit');
      if(l.radio)assert.equal(l.tail,null,'radio speech never points to a painted person');
      else {assert.equal(l.tail.length,2);const [x,y]=l.tail,r=frame.imageRect;
        assert(Number.isFinite(x)&&Number.isFinite(y)&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h,
          'speech points into the actual painted image');}
    }
    assert(frame.reducedMotionStatic&&frame.flashesOffStatic,'both accessibility modes draw a static, complete page');
    fs.writeFileSync(path.join(output,`Bridge-${String(page+1).padStart(2,'0')}.webp`),Buffer.from(frame.webp,'base64'));
    delete frame.webp;frames.push(frame);
  };
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin});
  await until('document.readyState==="complete"&&!!inputManager','production input ready');
  await evaluate('document.fonts.ready');await evaluate('browserProof.boot()');
  await until('BARCODE.CacheBridge.images.every(item=>item.status==="ready")','all eight hosted pictures decode with local fallback disabled');
  const hosted=await evaluate(`Promise.all(BARCODE.CacheBridge.images.map(async(item,index)=>{
    const response=await fetch(item.element.src);if(!response.ok)throw Error('Hosted picture fetch failed');
    const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
    return {asset:BARCODE.CacheBridge.panels[index].asset,url:item.element.src,bytes:bytes.byteLength,
      sha256:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join(''),
      width:item.element.naturalWidth,height:item.element.naturalHeight};}))`);
  assert.equal(hosted.length,8);
  for(const asset of hosted){
    assert.match(asset.url,/^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/[0-9a-f]{40}\/assets\/cache-bridge\//);
    const bytes=fs.readFileSync(path.join(root,asset.asset));assert.equal(asset.bytes,bytes.length);
    assert.equal(asset.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
    assert(asset.width>=1000&&asset.height>=500);
  }
  // Native browser key events reach the actual InputManager, then the bridge.
  await key('Enter');await key('Enter',true,true);await key('Enter');
  assert.equal((await state()).cue,1,'repeat and a held non-repeat cannot advance twice');
  await key('Enter',false);await tap('Enter');await render(0);
  assert.equal((await state()).roadEntries,0);
  const beforeTranscript=await sceneClock();
  await tap('t');assert(await evaluate('BARCODE.CacheBridge.transcriptOpen&&audioSystem.combatVoices.size===0'));
  await evaluate('browserProof.step(600)');assert.equal(await sceneClock(),beforeTranscript,'native transcript input freezes scene effects');
  await tap('t');assert(await sceneClock()>beforeTranscript);
  const beforePause=await sceneClock();await tap('p');await evaluate('browserProof.pausePromise');
  assert(await evaluate('window.isPaused'));await evaluate('browserProof.step(600)');
  assert.equal(await sceneClock(),beforePause,'native pause input freezes scene effects');
  await tap('p');await evaluate('browserProof.pausePromise');assert(!(await evaluate('window.isPaused')));
  await evaluate('browserProof.step(40)');assert(await sceneClock()>beforePause);
  for(let page=1;page<8;page++){await tap('Enter');await tap('Enter');await tap('Enter');await render(page);}
  await evaluate('browserProof.step(12000)');
  assert.deepEqual(await state(),{active:true,page:7,cue:2,skip:0,roadEntries:0,voices:0},
    'final Ready page cannot auto-launch, advance world simulation or retain earlier cue voices');
  assert(await evaluate('browserProof.worldUpdates===0&&audioSystem.layersStarted===false&&!audioSystem.roadEngine'));
  // Back returns through the production bridge input adapter, without Drive.
  await tap('Escape');assert(!(await state()).active);assert.equal((await state()).roadEntries,0);
  assert.equal(await evaluate('browserProof.back'),1);
  await evaluate('browserProof.boot()');const beforeSkip=await sceneClock();
  await key('s');await evaluate('browserProof.step(2300)');
  assert.equal(await sceneClock(),beforeSkip,'native skip hold freezes scene effects');await key('s',false);
  assert.equal((await state()).page,0);assert.equal((await state()).skip,0,'release cancels a partial skip');
  await key('s');await evaluate('browserProof.step(5020)');
  assert.deepEqual(await state(),{active:true,page:7,cue:2,skip:0,roadEntries:0,voices:0},'skip lands on Ready, not gameplay');
  await key('s',false);await tap('Enter');
  assert.equal((await state()).roadEntries,1);assert(!(await state()).active);
  assert.equal(await evaluate('audioSystem.combatVoices.size'),0);
  assert.equal(await evaluate('browserProof.contexts'),1);assert.equal(requests.head,0);
  assert.deepEqual(requests.localArt,[],'no page used local artwork fallback');assert.deepEqual(errors,[]);
  receipt={passed:true,hosted,frames,requests,contextCalls:1,keyboardHeldRelease:true,
    transcriptAudioCleanup:true,sceneClockFreezesOnTranscriptPauseAndSkip:true,backCleanup:true,partialSkipCancelled:true,skipReadyOnly:true,
    finalManualDriveOnly:true,roadEntries:1,noWorldUpdatesWhileReading:true,noSongOrEngine:true,
    limits:'Real Chromium art decoding, shared Canvas, native keyboard input, production bridge/RAF/audio lifecycle. Campaign persistence and final road entry are counted boundaries; their full integration is covered separately. Not a Makko/device acceptance.'};
  console.log(`Cache bridge Chromium passed: eight hosted byte-identical paintings, eight rendered pages, one main context, held/released input, frozen scene effects during transcript/pause/skip, back and final Drive.`);
}
main().catch(error=>{receipt={passed:false,error:error.stack,frames,requests,errors};console.error(error);process.exitCode=1;})
  .finally(async()=>{
    fs.writeFileSync(path.join(output,'Bridge-Browser-Checks.json'),JSON.stringify(receipt||{passed:false},null,2)+'\n');
    socket?.close();if(chrome&&chrome.exitCode===null&&chrome.signalCode===null)chrome.kill();
    if(chromeClosed)await chromeClosed;server.close();
    await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
  });
