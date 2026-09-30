// Real Chromium and production shared Canvas/input/RAF/ending/audio owners.
// Chapter/road receipt and pause commands are explicit fixture boundaries;
// separate completion integration checks exercise their actual game owners.
// Local ending art is deliberately unavailable: all four pictures must decode
// from the production immutable GitHub URLs and match the bundled bytes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const root=path.resolve(__dirname,'..');
const output=path.resolve(process.env.CACHE_ENDING_BROWSER_OUTPUT||
  path.join(os.tmpdir(),'barcode-cache-ending-browser'));
const chromePath=process.env.CHROME_BIN||['/usr/bin/google-chrome','/usr/bin/chromium',
  '/usr/bin/chromium-browser'].find(fs.existsSync);
assert(chromePath,'Set CHROME_BIN to an installed Chrome/Chromium executable.');
fs.mkdirSync(output,{recursive:true});
const scripts=['src/engine/audio.js','src/core/action-input.js','src/core/gamepad-ui.js',
  'src/engine/cache-ending.js','src/core/input.js','src/core/loop.js'];
const fixture=`<!doctype html><style>
@font-face{font-family:Oxanium;src:url('/assets/studies/visual-overhaul/references/fonts/Oxanium.ttf') format('truetype');font-weight:200 800}
html,body{margin:0;background:#090e18;width:100%;height:100%;overflow:hidden}
canvas{display:block;width:100vw;height:100vh;object-fit:contain}
</style><canvas id="gameCanvas" width="1920" height="1080"></canvas><script>
window.browserProof={contexts:0,worldUpdates:0,roadUpdates:0,macEntries:0,musicStarts:0,saves:[],resultArms:0,resultActions:0,clock:0,pad:null};
const nativeGetContext=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(...args){
  if(this.id==='gameCanvas'&&++browserProof.contexts>1)throw Error('Repeated main Canvas context acquisition');
  return nativeGetContext.apply(this,args);
};
window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};
window.gameState={running:true,paused:false,victory:false};window.isPaused=false;window.isRunning=true;
window.updateGame=()=>{browserProof.worldUpdates++;};window.renderGame=()=>{};
Object.defineProperty(navigator,'getGamepads',{value:()=>browserProof.pad?[browserProof.pad]:[]});
window.BARCODE={Preferences:{values:{reducedMotion:false}},Campaign:{intermission:false,
  archive:()=>({status:'ready',record:{progress:{items:['stem.voice','stem.bass'],completedLevels:['level-01','level-02']}}})},
  CacheRoadProof:{active:true,status:'clear',state:{status:'clear'},chapter:{delivery:{version:1,result:{rank:'A',score:420},
    ending:{version:1,page:0,cue:0,done:false}}},keyDown:()=>false,keyUp:()=>{},
    update(){browserProof.roadUpdates++;},draw(){},armResultControls(){browserProof.resultArms++;inputManager.resetActionEdges();},
    retry(){browserProof.resultActions++;},exit(){browserProof.resultActions++;}},
  CacheChapter:{persist(road){const saved=JSON.parse(JSON.stringify(road.chapter));browserProof.saves.push(saved);
      localStorage.setItem('ending-browser-state',JSON.stringify(saved));return true;},saveStatus:()=> 'saved'},
  RunAndGunProof:{enter(){browserProof.macEntries++;throw Error('Ending launched development/Mac stage');}},
  RuntimeLifecycle:{togglePause(){const promise=(async()=>{window.isPaused=!window.isPaused;gameState.paused=window.isPaused;
      const result=await(window.isPaused?audioSystem.pauseRuntimeAudio():audioSystem.resumeRuntimeAudio());
      window.lastTime=browserProof.clock;return result;})();browserProof.pausePromise=promise;return promise;}},
  PauseMenu:{sync(){},render(){},keyDown(event){if(['p','escape'].includes(event.key.toLowerCase()))BARCODE.RuntimeLifecycle.togglePause();return true;},
    keyUp(){},pointer(){return false;}}};
</script>${scripts.map(file=>`<script src="/${file}"></script>`).join('')}
<script>
window.audioSystem=new AudioSystem();audioSystem.context=new AudioContext();
audioSystem.sfxGain=audioSystem.context.createGain();audioSystem.sfxGain.gain.value=.8;
audioSystem.sfxGain.connect(audioSystem.context.destination);audioSystem.musicGain=audioSystem.context.createGain();
audioSystem.startRuntimeGameplayMusic=()=>{browserProof.musicStarts++;throw Error('Ending started a song');};
const canvas=document.getElementById('gameCanvas');window.renderer={canvas,ctx:canvas.getContext('2d')};
browserProof.step=ms=>{for(let left=ms;left>0;){const dt=Math.min(20,left);left-=dt;
  browserProof.clock+=dt;gameLoop(browserProof.clock);}};
browserProof.boot=saved=>{BARCODE.CacheEnding.dispose();window.isRunning=true;window.isPaused=false;gameState.paused=false;
  if(saved==='saved'){BARCODE.CacheRoadProof.chapter=JSON.parse(localStorage.getItem('ending-browser-state'));
    saved=BARCODE.CacheRoadProof.chapter.delivery.ending;}
  window.lastTime=browserProof.clock;BARCODE.CacheEnding.start(saved);browserProof.step(40);};
browserProof.connectPad=()=>{browserProof.pad={index:0,id:'Ending browser controller',mapping:'standard',connected:true,
  buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0]};browserProof.step(40);};
</script>`;
const requests={head:0,localArt:[],remoteArt:[]},errors=[],frames=[];
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(req.method==='HEAD'){requests.head++;res.writeHead(405);res.end();return;}
  if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(fixture);return;}
  if(pathname.startsWith('/assets/cache-ending/')){
    requests.localArt.push(pathname);res.writeHead(404);res.end();return;
  }
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;
  }
  res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.ttf':'font/ttf'}[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'barcode-ending-chrome-'));
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
    if(message.method==='Network.requestWillBeSent'&&/\/assets\/cache-ending\//.test(message.params.request.url)&&
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
  const state=()=>evaluate(`({active:BARCODE.CacheEnding.active,page:BARCODE.CacheEnding.page,cue:BARCODE.CacheEnding.cue,
    skip:BARCODE.CacheEnding.skipMs,done:BARCODE.CacheEnding.done,resultArms:browserProof.resultArms,voices:audioSystem.combatVoices?.size||0})`);
  const render=async page=>{
    const frame=await evaluate(`(()=>{browserProof.step(240);const b=BARCODE.CacheEnding,ctx=renderer.ctx;
      const pixels=ctx.getImageData(176,104,1568,712).data;let bright=0;
      for(let i=0;i<pixels.length;i+=64)if(pixels[i]+pixels[i+1]+pixels[i+2]>120)bright++;
      return {page:b.page,cue:b.cue,title:b.panels[b.page].title,status:b.images[b.page].status,
        source:b.images[b.page].element.src,contexts:browserProof.contexts,bright,
        webp:renderer.canvas.toDataURL('image/webp',.92).split(',')[1]};})()`);
    assert.equal(frame.page,page);assert.equal(frame.cue,2);assert.equal(frame.status,'ready');
    assert(frame.bright>3000,'illustrated page must contain substantial visible art');assert.equal(frame.contexts,1);
    fs.writeFileSync(path.join(output,`Ending-${String(page+1).padStart(2,'0')}.webp`),Buffer.from(frame.webp,'base64'));
    delete frame.webp;frames.push(frame);
  };
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin});
  await until('document.readyState==="complete"&&!!inputManager','production input ready');
  await evaluate('document.fonts.ready');await evaluate('browserProof.boot()');
  assert.equal(await evaluate('audioSystem.lastSFXCue?.kind'),'cacheBridge:relay','fresh ending plays its finite relay cue');
  await until('BARCODE.CacheEnding.images.every(item=>item.status==="ready")','all four hosted pictures decode with local fallback disabled');
  const hosted=await evaluate(`Promise.all(BARCODE.CacheEnding.images.map(async(item,index)=>{
    const response=await fetch(item.element.src);if(!response.ok)throw Error('Hosted picture fetch failed');
    const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
    return {asset:BARCODE.CacheEnding.panels[index].asset,url:item.element.src,bytes:bytes.byteLength,
      sha256:[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join(''),
      width:item.element.naturalWidth,height:item.element.naturalHeight};}))`);
  assert.equal(hosted.length,4);
  for(const asset of hosted){
    assert.match(asset.url,/^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/[0-9a-f]{40}\/assets\/cache-ending\//);
    const bytes=fs.readFileSync(path.join(root,asset.asset));assert.equal(asset.bytes,bytes.length);
    assert.equal(asset.sha256,crypto.createHash('sha256').update(bytes).digest('hex'));
    assert(asset.width>=1000&&asset.height>=500);
  }
  const pad=async(index,held)=>evaluate(`browserProof.pad.buttons[${index}].pressed=${held};browserProof.step(40)`);
  const padTap=async index=>{await pad(index,true);await pad(index,false);};
  const pointer=async(x,y)=>{await send('Input.dispatchMouseEvent',{type:'mousePressed',x:x*2/3,y:y*2/3,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x*2/3,y:y*2/3,button:'left',clickCount:1});await evaluate('browserProof.step(40)');};
  // Native keyboard events reach the production InputManager and all 12 cues.
  await key('Enter');await key('Enter',true,true);await key('Enter');
  assert.equal((await state()).cue,1,'repeat and a held non-repeat cannot advance twice');
  await key('Enter',false);await tap('Enter');await render(0);
  await tap('t');assert(await evaluate('BARCODE.CacheEnding.transcriptOpen&&audioSystem.combatVoices.size===0'));
  await pointer(500,1035);assert(!(await evaluate('BARCODE.CacheEnding.transcriptOpen')),'pointer closes transcript');
  for(let page=1;page<4;page++){await tap('Enter');await tap('Enter');await tap('Enter');await render(page);}
  await evaluate('browserProof.step(12000)');
  assert.deepEqual(await state(),{active:true,page:3,cue:2,skip:0,done:false,resultArms:0,voices:0},
    'final Ready waits indefinitely without finishing or retaining previous cue voices');
  assert(await evaluate('browserProof.worldUpdates===0&&browserProof.roadUpdates===0&&browserProof.musicStarts===0&&audioSystem.layersStarted===false&&!audioSystem.roadEngine'));
  await tap('Escape');assert(!(await state()).active);assert.equal((await state()).resultArms,1);
  assert.equal(await evaluate('BARCODE.CacheRoadProof.chapter.delivery.ending.done'),false);
  // The persisted reading position reopens silently; one explicit pointer choice finishes it.
  await evaluate('browserProof.boot("saved")');assert.equal((await state()).page,3);
  assert.equal((await state()).voices,0);await pointer(1500,1035);
  assert(!(await state()).active);assert.equal(await evaluate('BARCODE.CacheRoadProof.chapter.delivery.ending.done'),true);
  // Held gamepad controls cannot cross an ownership boundary into the ending.
  await evaluate('browserProof.connectPad()');await pad(0,true);const priorActions=await evaluate('browserProof.resultActions');
  await evaluate('browserProof.boot({version:1,page:0,cue:0,done:false})');
  await evaluate('browserProof.step(200)');assert.equal((await state()).cue,0);
  await pad(0,false);await pad(0,true);assert.equal((await state()).cue,1);
  await evaluate('browserProof.step(40)');assert.equal((await state()).cue,1);await pad(0,false);
  await padTap(2);assert(await evaluate('BARCODE.CacheEnding.transcriptOpen'));await padTap(2);
  assert(!(await evaluate('BARCODE.CacheEnding.transcriptOpen')));
  // Pause uses the shared audio system; resume cannot replay a suspended cue.
  await evaluate('BARCODE.CacheEnding.setCue(2,0)');
  assert.equal(await evaluate('audioSystem.lastSFXCue?.kind'),'cacheBridge:tape');
  await padTap(9);await evaluate('browserProof.pausePromise');assert(await evaluate('window.isPaused'));
  assert.equal(await evaluate('audioSystem.combatVoices.size'),0);
  const beforePause=await evaluate('JSON.stringify(BARCODE.CacheEnding.serialize())');
  await evaluate('browserProof.step(6000)');assert.equal(await evaluate('JSON.stringify(BARCODE.CacheEnding.serialize())'),beforePause);
  await padTap(9);await evaluate('browserProof.pausePromise');assert(!(await evaluate('window.isPaused')));
  assert.equal(await evaluate('audioSystem.combatVoices.size'),0);await evaluate('browserProof.step(40)');
  await padTap(8);assert(!(await state()).active,'View returns to results');
  // A partial keyboard skip cancels; a full controller hold reaches Ready only.
  await evaluate('browserProof.boot({version:1,page:0,cue:0,done:false})');
  await key('s');await evaluate('browserProof.step(2300)');await key('s',false);
  assert.equal((await state()).page,0);assert.equal((await state()).skip,0);
  await pad(1,true);await evaluate('browserProof.step(5000)');
  assert.equal((await state()).page,3);assert.equal((await state()).cue,2);assert.equal((await state()).done,false);
  await evaluate('browserProof.step(8000)');assert((await state()).active);
  await pad(1,false);await padTap(0);assert(!(await state()).active);
  assert.equal(await evaluate('BARCODE.CacheRoadProof.chapter.delivery.ending.done'),true);
  assert.equal(await evaluate('browserProof.resultActions'),priorActions,'ending and carried controls never choose Replay/Title');
  assert.equal(await evaluate('browserProof.macEntries'),0);assert.equal(await evaluate('browserProof.musicStarts'),0);
  const firstSession={contextCalls:await evaluate('browserProof.contexts'),resultArms:await evaluate('browserProof.resultArms'),
    savedPositions:await evaluate('browserProof.saves.length'),noMusicStarts:true,noMacEntries:true};
  // Real page reload restores the saved receipt and dialogue without any cue replay.
  await evaluate('browserProof.boot({version:1,page:2,cue:1,done:false})');
  await send('Page.reload',{ignoreCache:true});
  await until('document.readyState==="complete"&&!!inputManager','reload production input ready');
  await evaluate('document.fonts.ready');await evaluate('browserProof.boot("saved")');
  assert.equal((await state()).page,2);assert.equal((await state()).cue,1);assert.equal((await state()).voices,0);
  assert.equal(await evaluate('audioSystem.lastSFXCue?.kind||null'),null);
  assert(await evaluate('browserProof.musicStarts===0&&audioSystem.layersStarted===false&&!audioSystem.roadEngine'));
  await tap('Escape');assert(!(await state()).active);assert.equal(await evaluate('audioSystem.combatVoices.size'),0);
  assert.equal(await evaluate('browserProof.contexts'),1);assert.equal(firstSession.contextCalls,1);assert.equal(requests.head,0);
  assert.deepEqual(requests.localArt,[],'no page used local artwork fallback');assert.deepEqual(errors,[]);
  receipt={passed:true,hosted,frames,requests,firstSession,contextCallsPerPage:1,cues:12,
    keyboardHeldRelease:true,controllerHeldRelease:true,pointerFinalAction:true,transcriptAudioCleanup:true,
    pauseCancelsFiniteCues:true,resumeDoesNotReplayCue:true,backCleanup:true,partialSkipCancelled:true,
    skipReadyOnly:true,finalManualFinishOnly:true,reloadPreservesReadingPositionSilently:true,
    noWorldOrRoadUpdatesWhileReading:true,noSongOrEngine:true,noMacOrDevelopmentLaunch:true,
    limits:'Real Chromium hosted art decoding, shared Canvas, native keyboard/pointer input, production controller navigation, ending/RAF/audio owners. Campaign/road receipt persistence and pause-menu commands are explicit host boundaries; their full integration is covered separately. Not Makko/device acceptance.'};
  console.log('Cache ending Chromium passed: four hosted byte-identical paintings, 12 cues, one main context per page load, released keyboard/controller input, pointer Finish, pause, skip, silent reload and no Mac launch.');
}
main().catch(error=>{receipt={passed:false,error:error.stack,frames,requests,errors};console.error(error);process.exitCode=1;})
  .finally(async()=>{
    fs.writeFileSync(path.join(output,'Ending-Browser-Checks.json'),JSON.stringify(receipt||{passed:false},null,2)+'\n');
    socket?.close();if(chrome&&chrome.exitCode===null&&chrome.signalCode===null)chrome.kill();
    if(chromeClosed)await chromeClosed;server.close();
    await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});
  });
