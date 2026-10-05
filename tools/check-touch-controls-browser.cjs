#!/usr/bin/env node
'use strict';
// Real built index, trusted browser touch pointers, natural menu/start and earned
// Continue. This is mobile layout/input evidence, not a mobile FPS benchmark.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),cp=require('node:child_process'),
 crypto=require('node:crypto'),assert=require('node:assert/strict'),{once}=require('node:events');
const [gameArg,outArg,mode]=process.argv.slice(2);assert(gameArg&&outArg,'Usage: node tools/check-touch-controls-browser.cjs BUILT_GAME OUTPUT [--prototype-working-tree]');
const prototype=mode==='--prototype-working-tree';assert(!mode||prototype,'Unsupported mode');
const game=path.resolve(gameArg),out=path.resolve(outArg),root=path.resolve(__dirname,'..'),delay=ms=>new Promise(r=>setTimeout(r,ms)),
 sha=b=>crypto.createHash('sha256').update(b).digest('hex'),manifest=JSON.parse(fs.readFileSync(path.join(game,'.standalone-build.json'),'utf8'));
const index=fs.readFileSync(path.join(game,'index.html'),'utf8'),scripts=[...index.matchAll(/<script\b[^>]*src=["']([^"']+)/gi)].map(match=>match[1]);
assert(scripts.includes('src/core/touch-controls.js'),'Built game has no production touch controls');
const files=['index.html','style.css',...scripts,'src/engine/cache-road-texture-worker.js','src/vendor/basis-2.50/basis_transcoder.wasm','assets/cache-road/gpu-textures/manifest.json'];
const hashes=()=>Object.fromEntries(files.map(file=>[file,sha(fs.readFileSync(path.join(game,file)))])),inputHashes=hashes();
const manifestDeviations=[];
for(const file of files){if(prototype&&file==='src/core/touch-controls.js'&&inputHashes[file]!==manifest.files[file]?.sha256){
 assert.equal(inputHashes[file],sha(fs.readFileSync(path.join(root,file))),'Frozen prototype touch/source continuity');
 manifestDeviations.push({file,declaredSHA256:manifest.files[file]?.sha256,actualSHA256:inputHashes[file]});
 }else assert.equal(inputHashes[file],manifest.files[file]?.sha256,'Built hash '+file);}
const earned=JSON.parse(fs.readFileSync(path.join(root,'tools/fixtures/cache-road-earned-boss.json'),'utf8'));
assert.equal(earned.kind,'production-played-cache-road-save');
for(const [key,value]of Object.entries(earned.host.storage))assert.equal(sha(value),earned.storageSHA256[key]);
const receipt={kind:'actual-built-mobile-touch-check',sourceCommit:manifest.sourceCommit,inputHashes,startedAt:new Date().toISOString(),
 prototypeWorkingTree:prototype,manifestDeviations,
 scope:'Real portrait/landscape touch input, ordinary frontend/Level1 and earned Level2 Continue. No new mobile performance acceptance.',performance:{status:'notExercised'}};
fs.mkdirSync(out,{recursive:true});const save=(name,value)=>fs.writeFileSync(path.join(out,name),JSON.stringify(value,null,2));
let stage='startup',chrome,socket,browserSocket,send,browserSend,evaluate,failure,stderr='',width=390,height=844;
const timeline=[],exceptions=[],resourceFailures=[],events=[],requests=new Map(),profile=fs.mkdtempSync(path.join(os.tmpdir(),'bso-mobile-'));
function mark(name){stage=name;timeline.push({stage,at:new Date().toISOString()});save('operation-timeline.json',timeline);console.log('MOBILE_STAGE '+name);}
function connect(url,event){return new Promise((resolve,reject)=>{const ws=new WebSocket(url),pending=new Map();let serial=0;
 ws.addEventListener('open',()=>resolve({socket:ws,send:(method,params={},ms=15000)=>new Promise((res,rej)=>{
  const id=++serial,timer=setTimeout(()=>{pending.delete(id);rej(Error(stage+': '+method+' timeout'));},ms);
  pending.set(id,{res,rej,timer});ws.send(JSON.stringify({id,method,params}));})}),{once:true});ws.addEventListener('error',reject,{once:true});
 ws.addEventListener('message',message=>{const data=JSON.parse(message.data);if(data.method)event?.(data);const item=pending.get(data.id);
  if(item){clearTimeout(item.timer);pending.delete(data.id);data.error?item.rej(Error(JSON.stringify(data.error))):item.res(data.result);}});});}
const server=http.createServer((request,response)=>{const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname),
 file=path.resolve(game,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(game+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404);response.end();return;}
 const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.mp3':'audio/mpeg','.wasm':'application/wasm'};
 response.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(response);});
async function wait(expression,name,limit=60000){mark(name);const start=Date.now();while(Date.now()-start<limit){if(await evaluate(expression))return;await delay(150);}throw Error('Timed out: '+name);}
async function shot(name){const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(result.data,'base64'));}
async function viewport(w,h){width=w;height=h;await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await delay(150);}
async function point(selector){return evaluate('(()=>{const e=document.querySelector('+JSON.stringify(selector)+');if(!e||e.hidden)throw Error("Missing visible control");const r=e.getBoundingClientRect();if(!e.getClientRects().length||r.width<=0||r.height<=0)throw Error("Hidden control surface");return {x:r.x+r.width/2,y:r.y+r.height/2}})()');}
const action=id=>'[data-touch-action="'+id+'"]';
const tp=(point,id)=>({x:point.x,y:point.y,id,radiusX:1,radiusY:1,force:1});
async function touch(type,points=[]){await send('Input.dispatchTouchEvent',{type,touchPoints:points});}
async function tap(selector,hold=60){const p=await point(selector);await touch('touchStart',[tp(p,1)]);await delay(hold);await touch('touchEnd');await delay(90);}
async function key(type,key,code,vk){await send('Input.dispatchKeyEvent',{type,key,code,windowsVirtualKeyCode:vk});}
function layout(){const T=BARCODE.TouchControls,rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
 return {viewport:{width:innerWidth,height:innerHeight,visualWidth:visualViewport?.width,visualHeight:visualViewport?.height},touch:T.diagnostics(),
  canvas:{width:renderer.canvas.width,height:renderer.canvas.height,rect:rect(renderer.canvas)},
  joystick:T.joystick.hidden?null:rect(T.joystick),toolsOpen:!!T.toolsOpen,
  actions:{rect:rect(T.actions),columns:getComputedStyle(T.actions).gridTemplateColumns,rows:getComputedStyle(T.actions).gridTemplateRows,pointerEvents:getComputedStyle(T.actions).pointerEvents},
  buttons:[...T.buttons].filter(([,{node}])=>node.getClientRects().length).map(([id,{node}])=>({id,rect:rect(node),label:node.textContent,aria:node.getAttribute('aria-label'),disabled:node.disabled,
   slot:{row:getComputedStyle(node).gridRowStart,column:getComputedStyle(node).gridColumnStart},
   panel:node.closest('.touch-tools')?'tools':node.closest('.touch-gears')?'gears':node.closest('.touch-utilities')?'utility':'main'})),
  lifecycle:BARCODE.RuntimeLifecycle.getSnapshot(),audioState:audioSystem?.context?.state,rafOwners:window.mobileSmoke?.rafOwners||{},
  virtualOwners:inputManager.actionInput.virtualOwners.size,physicalKeys:[...inputManager.physicalKeys],scroll:{x:scrollX,y:scrollY},
  gpu:BARCODE.CacheRoadGPU?.diagnostics?.()||null,road:BARCODE.CacheRoadProof?.active?{status:BARCODE.CacheRoadProof.status,introMs:BARCODE.CacheRoadProof.introMs,presentation:BARCODE.CacheRoadProof.presentationResult}:null};}
async function verifyLayout(name){const row=await evaluate('('+layout.toString()+')()');receipt.layouts||={};receipt.layouts[name]=row;save('mobile-layouts.json',receipt.layouts);
 assert.equal(row.canvas.width,1920);assert.equal(row.canvas.height,1080);assert.equal(row.touch.enabled,true);
 for(const button of row.buttons){assert(button.aria,'Accessible touch label '+button.id);assert(button.rect.width>=43.99&&button.rect.height>=43.99,'Minimum44 target '+button.id);
  assert(button.rect.x>=-0.1&&button.rect.y>=-0.1&&button.rect.x+button.rect.width<=width+.1&&button.rect.y+button.rect.height<=height+.1,'Offscreen touch target '+button.id);}
 if(['level1','level3','road'].includes(row.touch.context)){
  assert(!row.toolsOpen&&!row.buttons.some(button=>['ui:more','ui:pads','run'].includes(button.id)),'Gameplay actions must be direct, without a controls menu');
  assert.equal(row.actions.pointerEvents,'none','Empty action slots cannot intercept the game surface');
 }
 if(row.touch.context==='road'){
  const main=row.buttons.filter(button=>button.panel==='main'),gears=row.buttons.filter(button=>button.panel==='gears');
  assert(main.length<=5,'The road cluster contains only the current beat and four relevant direct skills');
  const slots={'road_turbo':['1','1'],'road_disrupt':['1','2'],'road_echo':['1','2'],'road_attack':['2','1'],'road_defend':['2','2'],'road:beat':['3','1']};
  for(const button of main){assert(slots[button.id],'Unexpected road action '+button.id);assert.deepEqual([button.slot.row,button.slot.column],slots[button.id],'Fixed thumb slot '+button.id);}
  assert.deepEqual(gears.map(button=>button.id).sort(),['move_down','move_up'],'Stable separate gear pair');
  assert(!row.buttons.some(button=>button.panel==='tools'),'Secondary tools are hidden by default');
  const intersect=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y));
  for(let i=0;i<row.buttons.length;i++)for(let j=i+1;j<row.buttons.length;j++)assert(intersect(row.buttons[i].rect,row.buttons[j].rect)<.1,'Touch buttons overlap '+row.buttons[i].id+' / '+row.buttons[j].id);
  const canvas=row.canvas.rect,protectedArea={x:canvas.x+canvas.width*.4,y:canvas.y+canvas.height*.28,width:canvas.width*.2,height:canvas.height*.68};
  const overlap=rect=>Math.max(0,Math.min(rect.x+rect.width,protectedArea.x+protectedArea.width)-Math.max(rect.x,protectedArea.x))*
    Math.max(0,Math.min(rect.y+rect.height,protectedArea.y+protectedArea.height)-Math.max(rect.y,protectedArea.y));
  row.defaultRoad={mainCount:main.length,gearCount:gears.length,directActions:true,fixedThumbSlots:true,protectedArea,overlapPixels:row.buttons.reduce((sum,button)=>sum+overlap(button.rect),0)};
  assert(row.defaultRoad.overlapPixels<.1,'Default buttons must leave the central road/car region unobstructed');
  save('mobile-layouts.json',receipt.layouts);
 }
 await shot(name);return row;}
function instrument(){window.mobileSmoke={rows:[],observe:false,rafOwners:{}};const raf=requestAnimationFrame;
 window.requestAnimationFrame=function(callback){const owner=(new Error().stack||'').split('\n').slice(2).find(row=>/\/src\//.test(row))||'unidentified';
  return raf.call(window,function(time){if(mobileSmoke.observe&&window.isRunning)mobileSmoke.rafOwners[owner]=(mobileSmoke.rafOwners[owner]||0)+1;return callback.call(this,time);});};}
function observeInput(){const original=inputManager.routeActions;inputManager.routeActions=function(actions,...args){if(mobileSmoke.observe){
  const row={};for(const id of ['move_left','move_right','move_down','run','jump','road_a','road_b','road_x','road_y','road_attack','road_defend','road_turbo','road_disrupt','move_up'])row[id]={held:!!actions[id]?.held,pressed:!!actions[id]?.pressed,presses:actions[id]?.presses?.length||0};
  mobileSmoke.rows.push(row);if(mobileSmoke.rows.length>256)mobileSmoke.rows.shift();}return original.call(this,actions,...args);};}
async function boot(origin){await send('Page.navigate',{url:origin});
 await wait('document.readyState==="complete"&&!!window.BARCODE?.TouchControls&&!!window.renderer','actual mobile index boot',90000);
 await wait('!!document.getElementById("soundEnablePopup")','real sound gesture',15000);await tap('#soundEnablePopup');
 await wait('!document.getElementById("bootLoader")&&!!window.audioSystem?.isInitialized?.()&&audioSystem.context.state==="running"&&getComputedStyle(document.getElementById("startOverlay")).opacity==="1"','normal mobile title/audio readiness',90000);}
async function main(){server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;
 const chromePath=process.env.CHROME_BIN||['C:/Program Files/Google/Chrome/Application/chrome.exe','/usr/bin/google-chrome','/usr/bin/chromium'].find(fs.existsSync);assert(chromePath,'Set CHROME_BIN');
 chrome=cp.spawn(chromePath,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--window-size=390,844','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
 const url=await new Promise((resolve,reject)=>{let text='';const timeout=setTimeout(()=>reject(Error('Chrome launch timeout')),25000);chrome.once('error',reject);
  chrome.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-65536);text=(text+chunk).slice(-16000);const match=text.match(/DevTools listening on (ws:\/\/\S+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});});
 const browser=await connect(url,m=>{if(['Target.targetCrashed'].includes(m.method))events.push(m);});browserSocket=browser.socket;browserSend=browser.send;
 await browserSend('Target.setDiscoverTargets',{discover:true});const target=await(await fetch(new URL(url).origin.replace('ws:','http:')+'/json/new',{method:'PUT'})).json();
 const page=await connect(target.webSocketDebuggerUrl,m=>{
  if(m.method==='Runtime.exceptionThrown')exceptions.push({...m.params,stage});
  if(m.method==='Network.requestWillBeSent')requests.set(m.params.requestId,m.params.request.url);
  if(m.method==='Network.responseReceived'&&m.params.response.status>=400&&requests.get(m.params.requestId)?.startsWith(origin)&&!requests.get(m.params.requestId).endsWith('/favicon.ico'))resourceFailures.push(m.params.response);
  if(['Inspector.targetCrashed','Inspector.detached'].includes(m.method))events.push(m);
 });socket=page.socket;send=page.send;evaluate=async expression=>{save('last-operation.json',{stage,expression,at:new Date().toISOString()});
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},10000);if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:'('+instrument.toString()+')()'});
 await viewport(390,844);await boot(origin);await wait('BARCODE.TouchControls.context?.name==="title"','touch title context');await verifyLayout('01-portrait-title');
 await tap(action('title:settings'));await wait('BARCODE.PauseMenu.titleOpen&&BARCODE.TouchControls.context?.name==="menu"','touch title settings');await verifyLayout('02-portrait-settings');
 const focus=await evaluate('BARCODE.PauseMenu.focus');await tap(action('menu:down'));assert.notEqual(await evaluate('BARCODE.PauseMenu.focus'),focus,'Touch menu navigation');
 await tap(action('menu:resume'));await wait('!BARCODE.PauseMenu.titleOpen&&BARCODE.TouchControls.context?.name==="title"','close touch settings');
 await tap(action('title:start'));await wait('window.cutsceneSystem?.isActive&&BARCODE.TouchControls.context?.name==="intro"','normal touch opening');await verifyLayout('03-portrait-opening');
 await tap(action('ui:more'));assert.equal(await evaluate('BARCODE.TouchControls.toolsOpen'),true);
 await tap(action('intro:skip'),5300);await wait('!cutsceneSystem.inputDisabled&&cutsceneSystem.currentImageIndex===BARCODE.IntroSequence.panels.length','authored touch hold-to-skip',20000);
 if(await evaluate('BARCODE.TouchControls.toolsOpen'))await tap(action('ui:more'));
 await tap(action('intro:scene'));await wait('BARCODE.LevelDifficulty.open&&BARCODE.TouchControls.context?.name==="difficulty"','touch difficulty');await verifyLayout('04-portrait-difficulty');
 const selected=await evaluate('BARCODE.LevelDifficulty.selected');await tap(action('difficulty:right'));assert.equal(await evaluate('BARCODE.LevelDifficulty.selected'),(selected+1)%3);
 await tap(action('difficulty:left'));assert.equal(await evaluate('BARCODE.LevelDifficulty.selected'),selected);await tap(action('difficulty:begin'));
 await wait('BARCODE.RuntimeLifecycle.getState()==="running"&&BARCODE.TouchControls.context?.name==="level1"','normal touch Level1');
 await evaluate('('+observeInput.toString()+')();mobileSmoke.observe=true');await verifyLayout('05-portrait-level1');
 let stick=await point('#touchJoystick'),jump=await point(action('jump'));
 await touch('touchStart',[tp(stick,1)]);await touch('touchMove',[tp({x:stick.x+36,y:stick.y},1)]);await delay(100);
 await touch('touchStart',[tp({x:stick.x+36,y:stick.y},1),tp(jump,2)]);await delay(100);
 assert(await evaluate('mobileSmoke.rows.some(row=>row.move_right.held&&row.jump.pressed)'),'Real multitouch jump preserves joystick movement');
 await touch('touchEnd',[tp(jump,2)]);await delay(80);assert(await evaluate('inputManager.actionInput.held("move_right")&&!inputManager.actionInput.held("jump")'),'Finger releases independently');
 await touch('touchCancel');await delay(80);assert.equal(await evaluate('inputManager.actionInput.virtualOwners.size'),0);
 await key('keyDown','ArrowRight','ArrowRight',39);await touch('touchStart',[tp(stick,1)]);await touch('touchMove',[tp({x:stick.x-36,y:stick.y},1)]);await delay(100);
 assert(await evaluate('inputManager.actionInput.held("move_left")&&inputManager.actionInput.held("move_right")'),'Touch and physical keyboard coexist');
 await touch('touchEnd');await delay(80);assert(await evaluate('inputManager.actionInput.held("move_right")'),'Touch release preserves physical key');await key('keyUp','ArrowRight','ArrowRight',39);
 await touch('touchStart',[tp(stick,1)]);await touch('touchMove',[tp({x:stick.x+54,y:stick.y},1)]);await delay(100);
 assert(await evaluate('inputManager.actionInput.held("run")'),'Running is a direct outer-stick gesture');
 await viewport(844,390);assert.equal(await evaluate('BARCODE.TouchControls.pointers.size'),0,'Rotation clears captures');await touch('touchCancel');await delay(100);
 assert.equal(await evaluate('inputManager.actionInput.held("run")'),false,'Rotation releases outer-stick run');
 await verifyLayout('06-landscape-level1');await tap(action('pause'));await wait('BARCODE.RuntimeLifecycle.getState()==="paused"&&BARCODE.TouchControls.context?.name==="menu"','touch pause');await verifyLayout('07-landscape-pause');
 await tap(action('menu:resume'));await wait('BARCODE.RuntimeLifecycle.getState()==="running"','touch resume');
 const owners=await evaluate('Object.keys(mobileSmoke.rafOwners)');assert(owners.length&&owners.every(owner=>/\/src\/core\/loop\.js:/.test(owner)),'One existing gameplay RAF');
 receipt.level1={passed:true,rafOwners:owners,multitouch:true,keyboardCoexistence:true,cancel:true,rotateRelease:true,pauseResume:true};
 // The fixture is actual production-earned bytes; Continue remains the ordinary
 // UI path. No Road state or gameplay globals are injected.
 await send('Page.addScriptToEvaluateOnNewDocument',{source:'for(const [key,value]of Object.entries('+JSON.stringify(earned.host.storage)+'))localStorage.setItem(key,value);'});
 await boot(origin);await wait('!document.getElementById("continueButton").hidden&&BARCODE.TouchControls.buttons.has("title:continue")','earned mobile Continue');
 await tap(action('title:continue'));await wait('BARCODE.CacheRoadProof.active&&!BARCODE.CacheRoadProof.presentationPreparing&&BARCODE.CacheRoadProof.introMs===null&&BARCODE.TouchControls.context?.name==="road"','normal earned mobile road',60000);
 await evaluate('('+observeInput.toString()+')();mobileSmoke.observe=true');await verifyLayout('08-landscape-level2');
 const directSkills=[];
 const directSkill=async(id,label,limit=15000)=>{
  await wait('BARCODE.TouchControls.buttons.get('+JSON.stringify(id)+')&&!BARCODE.TouchControls.buttons.get('+JSON.stringify(id)+').node.disabled','naturally ready direct '+label,limit);
  await evaluate('mobileSmoke.rows=[];mobileSmoke.skillNode=BARCODE.TouchControls.buttons.get('+JSON.stringify(id)+').node');
  stick=await point('#touchJoystick');const skill=await point(action(id));
  await touch('touchStart',[tp(stick,1)]);await touch('touchMove',[tp({x:stick.x+36,y:stick.y},1)]);
  await touch('touchStart',[tp({x:stick.x+36,y:stick.y},1),tp(skill,2)]);await delay(150);
  assert(await evaluate('mobileSmoke.rows.some(row=>row.move_right.held&&row['+JSON.stringify(id)+'].pressed)'),'Direct '+label+' accepts an independent steering finger');
  await touch('touchCancel');await delay(100);assert.equal(await evaluate('inputManager.actionInput.virtualOwners.size'),0);
  assert(await evaluate('BARCODE.TouchControls.buttons.get('+JSON.stringify(id)+')?.node===mobileSmoke.skillNode'),label+' retains its target through cooldown feedback');
  directSkills.push(id);
 };
 await directSkill('road_turbo','Boost');await directSkill('road_defend','Guard');await verifyLayout('08b-landscape-direct-skills');
 await directSkill('road_disrupt','Jam',45000);await verifyLayout('08c-landscape-direct-jam');
 await wait('BARCODE.TouchControls.buttons.has("road:beat")','naturally announced direct Sync',20000);
 await evaluate('mobileSmoke.rows=[]');const face=await point(action('road:beat'));stick=await point('#touchJoystick');
 await touch('touchStart',[tp(stick,1)]);await touch('touchMove',[tp({x:stick.x+36,y:stick.y},1)]);
 await touch('touchStart',[tp({x:stick.x+36,y:stick.y},1),tp(face,2)]);await delay(150);
 assert(await evaluate('mobileSmoke.rows.some(row=>row.move_right.held&&["road_a","road_b","road_x","road_y"].some(id=>row[id].pressed))'),'Announced Sync accepts an independent steering finger');
 await touch('touchCancel');await delay(100);assert.equal(await evaluate('inputManager.actionInput.virtualOwners.size'),0);
 const gearAction=await evaluate('BARCODE.TouchControls.buttons.get("move_up").node.disabled?"move_down":"move_up"');
 await tap(action(gearAction));assert(await evaluate('mobileSmoke.rows.some(row=>row['+JSON.stringify(gearAction)+'].pressed)'),'Real available gear tap reaches the shared road actions');
 await viewport(568,320);await verifyLayout('08d-short-landscape-level2');
 await viewport(375,667);await verifyLayout('09-short-portrait-level2');await viewport(320,568);await verifyLayout('10-small-portrait-level2');
 await viewport(390,844);await verifyLayout('11-portrait-level2');await tap(action('pause'));await wait('BARCODE.RuntimeLifecycle.getState()==="paused"','mobile road pause');await verifyLayout('12-portrait-road-pause');
 await tap(action('menu:resume'));await wait('BARCODE.RuntimeLifecycle.getState()==="running"','mobile road resume');
 receipt.level2={passed:true,earnedCheckpoint:earned.expected.checkpointId,multitouchCueSteering:true,multitouchSkillSteering:true,directSkills,noGameplayControlsMenu:true,gearTap:true,portraitLandscape:true,shortLandscape:true,pauseResume:true,defaultPanelClear:true};
 assert.deepEqual(exceptions,[],'Page exceptions');assert.deepEqual(resourceFailures,[],'Missing game resources');assert.deepEqual(events,[],'Game crash/detach');assert.deepEqual(hashes(),inputHashes,'Runtime changed during mobile check');
 receipt.status='passed';mark('mobile normal controls/layout passed');
}
(async()=>{try{await main();}catch(error){failure=error;receipt.status='failed';receipt.failure={stage,error:String(error),stack:error.stack};
 if(evaluate)try{receipt.failure.snapshot=await evaluate('('+layout.toString()+')()');}catch(error){receipt.failure.snapshotError=String(error);}if(send)try{await shot('failure');}catch{}
 }finally{save('exceptions.json',exceptions);save('resource-failures.json',resourceFailures);save('target-events.json',events);fs.writeFileSync(path.join(out,'chrome-stderr.txt'),stderr);
 if(browserSend)try{await browserSend('Browser.close',{},5000);}catch{}socket?.close();browserSocket?.close();
 if(chrome?.exitCode===null)try{await Promise.race([once(chrome,'close'),delay(3000)]);}catch{}
 if(chrome?.exitCode===null){if(process.platform==='win32')cp.spawnSync('taskkill.exe',['/PID',String(chrome.pid),'/T','/F'],{windowsHide:true});else chrome.kill('SIGKILL');}
 server.close();assert(profile.startsWith(path.resolve(os.tmpdir())+path.sep+'bso-mobile-'),'Unsafe profile cleanup');
 receipt.cleanup={browserPid:chrome?.pid||null,processExited:!chrome||chrome.exitCode!==null};try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:250});receipt.cleanup.profileRemoved=true;}catch(error){receipt.cleanup.error=String(error);}
 receipt.finishedAt=new Date().toISOString();save('mobile-touch-receipt.json',receipt);console.log(JSON.stringify({status:receipt.status,stage,sourceCommit:receipt.sourceCommit,cleanup:receipt.cleanup}));
 if(failure){console.error(failure.stack);process.exitCode=1;}
 }})();
