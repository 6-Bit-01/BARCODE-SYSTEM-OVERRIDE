'use strict';
// Actual standalone index, production lifecycle, real keyboard input and shared RAF.
// Run after build-standalone.py; software/unavailable GL never counts as hardware
// performance acceptance. The earned boss fixture preserves production save bytes.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{once}=require('node:events');
const {classifyBackend,inspectBootstrap,unexercisedGate}=require('./lib/cache-road-gpu-backend.cjs');
const usage='Usage: node tools/check-cache-road-gpu-browser.cjs BUILT_GAME OUTPUT [fresh|boss|diagnose-startup]';
if(process.argv[2]==='--help'){console.log(usage);process.exit(0);}
assert(process.argv[2]&&process.argv[3],usage);
const source=path.resolve(__dirname,'..'),game=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),
 scenario=process.argv[4]||'fresh';
assert(['fresh','boss','diagnose-startup'].includes(scenario),usage);
const diagnosticOnly=scenario==='diagnose-startup';
const chromePath=process.env.CHROME_BIN||[
 'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
 '/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser',
 '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(fs.existsSync);
assert(chromePath,'Set CHROME_BIN to Chrome/Chromium. Node22+ provides the CDP WebSocket.');
const bossPath=scenario==='boss'?path.join(source,'tools/fixtures/cache-road-earned-boss.json'):null,
 bossBytes=bossPath?fs.readFileSync(bossPath):null,bossReceipt=bossBytes?JSON.parse(bossBytes):null;
fs.mkdirSync(out,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),delay=ms=>new Promise(r=>setTimeout(r,ms));
const manifest=JSON.parse(fs.readFileSync(path.join(game,'.standalone-build.json'),'utf8'));
const fixtureMatch=fs.readFileSync(path.join(source,'tools/check-cache-combat-browser.cjs'),'utf8').match(/const parent=(\{[\s\S]*?\});\s*const initialRecord=/);
assert(fixtureMatch,'Existing completed-Level-1 boundary fixture is absent');const fixture=fixtureMatch[1];
const index=fs.readFileSync(path.join(game,'index.html'),'utf8'),
 scripts=Array.from(index.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi),m=>m[1]);
assert(scripts.length>0,'Built index has no scripts');assert(!scripts.some(s=>/^(?:https?:)?\/\//.test(s)),'Built page contains external scripts');
const files=['index.html',...new Set(scripts.map(s=>s.replace(/^\.\//,'')))];
const textureManifestPath='assets/cache-road/gpu-textures/manifest.json',
 textureManifest=fs.existsSync(path.join(game,textureManifestPath))?JSON.parse(fs.readFileSync(path.join(game,textureManifestPath),'utf8')):null;
if(scripts.some(file=>file.endsWith('/cache-road-texture-bank.js')))assert(textureManifest,'Built compressed bank manifest is absent');
if(textureManifest){
 assert.equal(textureManifest.sourceCount,171);assert.equal(textureManifest.compressedCount,149);assert.equal(textureManifest.originalCount,22);
 assert.equal(textureManifest.alphaMode,'premultiplied-alpha');assert.equal(textureManifest.colorSpace,'unorm');
 files.push(textureManifestPath,'src/engine/cache-road-texture-worker.js','src/vendor/basis-2.50/basis_transcoder.js',
  'src/vendor/basis-2.50/basis_transcoder.wasm','src/vendor/basis-2.50/LICENSE','src/vendor/basis-2.50/provenance.json',
  ...new Set(Object.values(textureManifest.entries).flatMap(entry=>[entry.path,entry.originalPath])));
}
// Preserve the builder's existing Google Fonts exception, scoped to this exact
// authored stylesheet and font-resource requests. Graphics/audio/scripts remain local.
const googleFontsCSS='https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap',
 allowedFontCSS=index.includes(googleFontsCSS)?new Set([googleFontsCSS]):new Set();
for(const file of files){assert(!path.isAbsolute(file)&&!file.split('/').includes('..'),'Unsafe script path');
 assert.equal(sha(fs.readFileSync(path.join(game,file))),manifest.files[file]?.sha256,'Built manifest differs: '+file);}
if(bossReceipt){assert.equal(bossReceipt.kind,'production-played-cache-road-save');
 for(const [key,value]of Object.entries(bossReceipt.host.storage))assert.equal(sha(value),bossReceipt.storageSHA256[key],'Earned fixture storage changed');
 const saved=JSON.parse(bossReceipt.host.storage['barcode.system-override.save.v1.default']);
 assert.equal(saved.current.levelId,bossReceipt.expected.levelId);assert.equal(saved.current.checkpointId,bossReceipt.expected.checkpointId);
 assert.deepEqual(Object.fromEntries(Object.keys(bossReceipt.expected.boss).map(k=>[k,saved.current.levelState.proof.combat.boss[k]])),bossReceipt.expected.boss);}
const hashes=()=>Object.fromEntries(files.map(n=>[n,sha(fs.readFileSync(path.join(game,n)))])),inputHashes=hashes();
fs.writeFileSync(path.join(out,'input-receipt.json'),JSON.stringify({sourceCommit:manifest.sourceCommit,
 sourceTree:manifest.sourceTree,inputHashes,parentFixtureSHA256:sha(Buffer.from(fixture)),backend:'default GPU',scenario,
 earnedBossCheckpoint:bossPath,earnedBossCheckpointSHA256:bossBytes?sha(bossBytes):null},null,2));
const requests=[],resourceFailures=[],exceptions=[],consoleMessages=[],networkRequests=new Map();
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(game,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(game+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){resourceFailures.push(pathname);res.writeHead(404);res.end();return;}
 requests.push(pathname);const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
 '.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.woff2':'font/woff2'}[path.extname(file)]||'application/octet-stream';
 res.writeHead(200,{'Content-Type':type});fs.createReadStream(file).pipe(res);
});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'bso-gpu-'));
let chrome,closed,socket,send,evaluate,failure,lastRuntimeEvaluation=null,browserSocket,browserSend,ownedTargetId,
 traceCompletion,completeTrace,diagnosticStarted=false,diagnosticStopped=false;
const operationTimeline=[],memoryTelemetry=[],targetEvents=[];let currentOperation='checker startup',chromeStderr='';
const targetEvent=(method,params)=>{targetEvents.push({method,params,at:Date.now(),operation:currentOperation});
 fs.writeFileSync(path.join(out,'target-events.json'),JSON.stringify(targetEvents,null,2));};
const operation=label=>{currentOperation=label;operationTimeline.push({label,at:Date.now()});
 fs.writeFileSync(path.join(out,'operation-timeline.json'),JSON.stringify(operationTimeline,null,2));};
async function ownedProcessMemory(){
 if(!chrome?.pid)return {status:'notExercised',reason:'Owned Chrome was not launched'};
 if(process.platform==='win32'){
  const command='$all=Get-CimInstance Win32_Process;$owned=@('+chrome.pid+');for($i=0;$i -lt 8;$i++) {'+
   '$next=@($all | Where-Object { $_.ParentProcessId -in $owned } | ForEach-Object { [int]$_.ProcessId });'+
   '$owned=@($owned+$next | Sort-Object -Unique)};'+
   '$rows=@($all | Where-Object { $_.ProcessId -in $owned } | ForEach-Object {'+
   '$role=if($_.CommandLine -match "--type=([^ ]+)"){$Matches[1]}else{"browser"};'+
   '[pscustomobject]@{pid=$_.ProcessId;parentPid=$_.ParentProcessId;name=$_.Name;role=$role;'+
   'workingSetBytes=[long]$_.WorkingSetSize;privatePageBytes=[long]$_.PrivatePageCount;'+
   'kernelTime100ns=[long]$_.KernelModeTime;userTime100ns=[long]$_.UserModeTime}});'+
   '$ram=Get-CimInstance Win32_OperatingSystem;[pscustomobject]@{status="sampled";ownedRootPid='+chrome.pid+';'+
   'processes=$rows;physicalAvailableBytes=[long]$ram.FreePhysicalMemory*1024;physicalTotalBytes=[long]$ram.TotalVisibleMemorySize*1024} | ConvertTo-Json -Depth 5 -Compress';
  const output=await new Promise((resolve,reject)=>cp.execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],
   {timeout:4000,windowsHide:true,maxBuffer:512*1024},(error,stdout)=>error?reject(error):resolve(stdout)));
  return JSON.parse(output);
 }
 if(process.platform==='linux'){
  const pids=new Set([chrome.pid]);for(let round=0;round<8;round++)for(const pid of [...pids]){
   try{for(const id of fs.readFileSync('/proc/'+pid+'/task/'+pid+'/children','utf8').trim().split(/\s+/))if(id)pids.add(Number(id));}catch{}}
  const processes=[];for(const pid of pids){try{const status=fs.readFileSync('/proc/'+pid+'/status','utf8'),value=name=>
   Number(status.match(new RegExp('^'+name+':\\s+(\\d+)','m'))?.[1]||0)*1024;
   processes.push({pid,name:status.match(/^Name:\s+(.+)/m)?.[1],workingSetBytes:value('VmRSS'),privateDataBytes:value('VmData')});}catch{}}
  const mem=fs.readFileSync('/proc/meminfo','utf8'),kb=name=>Number(mem.match(new RegExp('^'+name+':\\s+(\\d+)','m'))?.[1]||0)*1024;
  return {status:'sampled',ownedRootPid:chrome.pid,processes,physicalAvailableBytes:kb('MemAvailable'),physicalTotalBytes:kb('MemTotal')};
 }
 return {status:'notExercised',reason:'Process memory sampler unavailable on '+process.platform};
}
async function sampleMemory(label){
 const sampledAt=Date.now(),[heap,processes,resources]=await Promise.allSettled([
  send('Runtime.getHeapUsage',{},3000),ownedProcessMemory(),send('Runtime.evaluate',{expression:'('+sceneResources.toString()+')()',returnByValue:true},3000)]),row={label,sampledAt,operation:currentOperation,
   hostMemory:{totalBytes:os.totalmem(),freeBytes:os.freemem()},helperMemory:process.memoryUsage(),
   heap:heap.status==='fulfilled'?heap.value:{status:'unavailable',reason:String(heap.reason)},
   processes:processes.status==='fulfilled'?processes.value:{status:'unavailable',reason:String(processes.reason)},
   sceneResources:resources.status==='fulfilled'?resources.value.result?.value:{status:'unavailable',reason:String(resources.reason)},
   limitation:'Process working sets and JavaScript/backing-store heap are sampled; these are not measured GPU VRAM or physical-display FPS.'};
 memoryTelemetry.push(row);fs.writeFileSync(path.join(out,'memory-telemetry.json'),JSON.stringify(memoryTelemetry,null,2));return row;
}
function sceneResources(){
 const B=window.BARCODE,S=B?.StandaloneSprites;
 return {presentationAssets:B?.PresentationAssets?.diagnostics?.()||null,
  standaloneSprites:S?{loaded:S.isLoaded(),characters:S._characters.size,sourceImages:S._sourceImages.size,pendingImages:S._imageLoads.size}:null,
  level1Globals:{parallax:!!window.parallaxBackground,cutscene:!!window.cutsceneSystem,spaceships:!!window.spaceShipSystem},
  roadReleaseReport:B?.CacheRoadProof?.sceneReleaseReport||null,
  level1ImageCacheKeys:Object.keys(B?.assetLoadPromises||{}).filter(key=>key.startsWith('image.level-01.')),
  activeMusicProfile:window.audioSystem?.getActiveMusicProfile?.()?.profileId||null};
}
async function connectBrowserDiagnostics(url){
 browserSocket=new WebSocket(url);await new Promise((resolve,reject)=>{
  browserSocket.addEventListener('open',resolve,{once:true});browserSocket.addEventListener('error',reject,{once:true});});
 let serial=0;const pending=new Map();traceCompletion=new Promise(resolve=>{completeTrace=resolve;});
 browserSocket.addEventListener('message',event=>{const m=JSON.parse(event.data);
  if(m.method==='Tracing.tracingComplete')completeTrace(m.params);
  if(['Target.targetCrashed','Target.targetDestroyed'].includes(m.method)&&m.params.targetId===ownedTargetId)
   targetEvent(m.method,m.params);
  const request=pending.get(m.id);if(request){pending.delete(m.id);clearTimeout(request.timer);
   m.error?request.reject(Error(JSON.stringify(m.error))):request.resolve(m.result);}});
 browserSend=(method,params={},timeoutMs=10000)=>new Promise((resolve,reject)=>{const id=++serial,
  timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser '+method+' timeout'));},timeoutMs);
  pending.set(id,{resolve,reject,timer});browserSocket.send(JSON.stringify({id,method,params}));});
}
async function startStartupDiagnostics(){
 operation('diagnostic: start profile and browser trace before normal runtime start');
 await sampleMemory('diagnostic-before-normal-runtime-start');
 const processes=await browserSend('SystemInfo.getProcessInfo');
 fs.writeFileSync(path.join(out,'diagnostic-processes-before.json'),JSON.stringify(processes,null,2));
 await send('Profiler.enable',{},10000);await send('Profiler.setSamplingInterval',{interval:1000},10000);
 await browserSend('Tracing.start',{categories:'devtools.timeline,v8,gpu',options:'record-as-much-as-possible',
  transferMode:'ReturnAsStream',streamFormat:'json',streamCompression:'none'});
 await send('Profiler.start',{},10000);diagnosticStarted=true;
 console.log('STARTUP_DIAGNOSTICS_STARTED hardware backend unchanged; no acceptance timings');
}
async function stopStartupDiagnostics(reason){
 if(!diagnosticStarted||diagnosticStopped)return;diagnosticStopped=true;
 const receipt={reason,diagnosticOnly:true,acceptanceTimings:false,at:Date.now(),lastRuntimeEvaluation},
  result=await Promise.allSettled([send('Profiler.stop',{},10000),browserSend('Tracing.end'),
   browserSend('SystemInfo.getProcessInfo')]);
 if(result[0].status==='fulfilled'){
  fs.writeFileSync(path.join(out,'startup-cpu-profile.json'),JSON.stringify(result[0].value.profile));
  receipt.cpuProfile={status:'captured',nodes:result[0].value.profile.nodes.length,samples:result[0].value.profile.samples?.length||0};
 }else receipt.cpuProfile={status:'unavailable',reason:String(result[0].reason)};
 receipt.processesAfter=result[2].status==='fulfilled'?result[2].value:{status:'unavailable',reason:String(result[2].reason)};
 if(result[1].status==='fulfilled'){
  try{let timer;const complete=await Promise.race([traceCompletion,new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Error('Browser trace completion timeout')),15000);})]);clearTimeout(timer);
   assert(complete.stream,'Browser tracing returned no stream');const file=path.join(out,'startup-browser-trace.json'),fd=fs.openSync(file,'w');let bytes=0;
   try{for(;;){const chunk=await browserSend('IO.read',{handle:complete.stream,size:1024*1024});
    const data=Buffer.from(chunk.data,chunk.base64Encoded?'base64':'utf8');fs.writeSync(fd,data);bytes+=data.length;if(chunk.eof)break;}}
   finally{fs.closeSync(fd);await browserSend('IO.close',{handle:complete.stream}).catch(()=>{});}
   receipt.browserTrace={status:'captured',bytes,dataLossOccurred:complete.dataLossOccurred||false};
  }catch(error){receipt.browserTrace={status:'unavailable',reason:String(error)};}
 }else receipt.browserTrace={status:'unavailable',reason:String(result[1].reason)};
 fs.writeFileSync(path.join(out,'startup-diagnostic-capture.json'),JSON.stringify(receipt,null,2));
 console.log('STARTUP_DIAGNOSTICS_CAPTURE '+JSON.stringify(receipt));
}
async function waitFor(expression,label,ms=90000){const start=Date.now();
 while(Date.now()-start<ms){if(await evaluate(expression,diagnosticOnly&&diagnosticStarted?3000:90000))return;await delay(200);}throw Error('Timed out: '+label);}
async function screenshot(name){const measured=await evaluate('!!window.gpuSmoke?.measure');
 if(measured)await evaluate('gpuSmoke.measure=false;gpuSmoke.lastMeasured=null');
 const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},diagnosticOnly?5000:90000);
 fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(s.data,'base64'));
 if(measured)await evaluate('gpuSmoke.measure=true');}
async function hold(key,code,vk,ms=100){await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:vk});await delay(ms);
 await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk});}
function instrument(){
 window.gpuSmoke={contexts:[],frames:[],intervals:[],lastMeasured:null,rafOwners:{},activeRafOwners:{},drawCosts:[],gl:null,
  gpuCanvases:new WeakSet(),gpuContext:null,phaseCosts:{},frameRows:[],currentFrame:null,currentInterval:null,
  lifecycleFrames:[],lifecycleRafOwners:{},verifyLoss:false,warmupCalls:[],slowNativeCalls:[],
  gpuToNativeCopyCount:0,directScreenSupported:false,directPresentedFrames:0,drawDepth:0};
 const ids=new WeakMap();let id=0;const get=HTMLCanvasElement.prototype.getContext;
 HTMLCanvasElement.prototype.getContext=function(type,options){const ctx=get.call(this,type,options);if(!ids.has(this))ids.set(this,++id);
  gpuSmoke.contexts.push({id:ids.get(this),element:this.id||null,type,options:options||null,width:this.width,height:this.height});
  if(ctx&&/webgl/.test(type)){gpuSmoke.gpuCanvases.add(this);if(this.width===1920&&this.height===1080)gpuSmoke.gpuContext=ctx;
   if(ctx===gpuSmoke.gpuContext){const ext=ctx.getExtension('WEBGL_debug_renderer_info');
    gpuSmoke.gl={version:ctx.getParameter(ctx.VERSION),unmaskedRenderer:!!ext,vendor:ctx.getParameter(ext?ext.UNMASKED_VENDOR_WEBGL:ctx.VENDOR),
     renderer:ctx.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:ctx.RENDERER),attributes:ctx.getContextAttributes()};}}return ctx;};
 const raf=window.requestAnimationFrame;
 window.requestAnimationFrame=function(callback){const owner=(new Error()).stack.split('\n')[2]?.trim()||'unknown';
  gpuSmoke.rafOwners[owner]=(gpuSmoke.rafOwners[owner]||0)+1;
  return raf.call(window,function(timestamp){if(gpuSmoke.verifyLoss&&window.BARCODE?.CacheRoadProof?.active&&!window.isPaused)
    gpuSmoke.lifecycleRafOwners[owner]=(gpuSmoke.lifecycleRafOwners[owner]||0)+1;
   if(gpuSmoke.measure&&window.BARCODE?.CacheRoadProof?.active&&!window.isPaused){
   gpuSmoke.activeRafOwners[owner]=(gpuSmoke.activeRafOwners[owner]||0)+1;
   gpuSmoke.frames.push(timestamp);gpuSmoke.currentInterval=gpuSmoke.lastMeasured===null?null:timestamp-gpuSmoke.lastMeasured;
   if(gpuSmoke.currentInterval!==null)gpuSmoke.intervals.push(gpuSmoke.currentInterval);gpuSmoke.lastMeasured=timestamp;
  }else gpuSmoke.lastMeasured=null;
   return callback(timestamp);});};
}
async function stage(){
 const parent=PARENT_FIXTURE,B=BARCODE,mark=label=>{gpuSmoke.stage=label;
  (gpuSmoke.stageMarks||=[]).push({label,at:performance.now()});console.info('GPU_SMOKE_STAGE '+label);};
 mark('validate-level1-boundary');
 if(!B.Campaign.validateLevel01Checkpoint(parent))throw Error('Existing parent fixture rejected');
 const archive=B.Campaign.archive();archive.checkpoint(parent);
 if(!archive.record.progress.completedLevels.includes('level-01'))archive.record.progress.completedLevels.push('level-01');
 mark('await-normal-runtime-start');
 const start=await B.RuntimeLifecycle.start({resume:parent,initialStart:true});if(!start.ok)throw Error(JSON.stringify(start));
 mark('stage-existing-cleared-level1');
 const initializedArchive=B.Campaign.archive();if(!initializedArchive.record.progress.completedLevels.includes('level-01'))initializedArchive.record.progress.completedLevels.push('level-01');
 initializedArchive.checkpoint(parent);if(!B.Campaign.readResume()||!B.Campaign.archive().record.progress.completedLevels.includes('level-01'))throw Error('Initialized parent save staging failed');
 B.CacheBridge.dispose({reset:true});B.Campaign.intermission=true;
 mark('await-normal-road-entry');
 const entry=await B.CacheRoadProof.enter();if(!entry.ok)throw Error(JSON.stringify(entry));
 mark('road-entry-complete');return {start,entry};
}
function instrumentGameplay(){
 const B=BARCODE,engine=B.CacheRoadGPU,render=engine.render;gpuSmoke.gpuCalls={};
 gpuSmoke.monitorStartup=true;gpuSmoke.startupCoverage={observedFrames:0,lateHudFadeFrames:0,visibleHudFadeFrames:0,rearQueuedFrames:0,
  finalPresentedFrames:0,selfCanvasCopies:0,gpuToNativeCopies:0,firstIntroMs:null,lastIntroMs:null};
 gpuSmoke.directScreenSupported=typeof engine.beginFrame==='function'&&typeof engine.present==='function';
 const directActive=()=>typeof engine.directFrameActive==='function'?engine.directFrameActive():engine.directFrameActive===true;
 const phase=(name,ms)=>{(gpuSmoke.phaseCosts[name]||=[]).push(ms);
  if(gpuSmoke.currentFrame)gpuSmoke.currentFrame.phases[name]=(gpuSmoke.currentFrame.phases[name]||0)+ms;};
 const begin=engine.begin,prepare=engine.prepare,replay=B.CacheRoadGPUContext.prototype.replay;
 if(typeof engine.beginFrame==='function'){const beginFrame=engine.beginFrame;
  engine.beginFrame=function(...args){const value=beginFrame.apply(this,args),frame=gpuSmoke.currentFrame;
   if(frame)frame.directFrameActive ||= value===true||directActive();return value;};}
 if(typeof engine.warmup==='function'){const warmup=engine.warmup;
  engine.warmup=async function(...args){const t=performance.now(),before=B.MusicTransport.getDiagnostics();
   gpuSmoke.warmupActive={startedAt:t,suppliedSources:Array.isArray(args[1])?args[1].length:null};
   const result=await warmup.apply(this,args);gpuSmoke.warmupCalls.push({startedAt:t,elapsedMs:performance.now()-t,
    suppliedSources:Array.isArray(args[1])?args[1].length:null,beforeTransport:before,afterTransport:B.MusicTransport.getDiagnostics(),result});
    gpuSmoke.warmupActive=null;return result;};}
 engine.begin=function(ctx,options={}){const t=performance.now(),kind=options.kind||'forward',frame=gpuSmoke.currentFrame;
  if(gpuSmoke.measure&&frame){if(kind==='forward')phase('draw-before-forward',t-frame.drawStarted);
   else if(frame.lastForwardRenderEnd!==null)phase('foreground-before-rear',t-frame.lastForwardRenderEnd);}
  try{return begin.call(this,ctx,options);}
  finally{const end=performance.now();if(gpuSmoke.measure){phase('begin-'+kind,end-t);
   if(frame)frame.commandStarted[kind]=end;}}};
 engine.prepare=function(...args){const t=performance.now();try{return prepare.apply(this,args);}
  finally{if(gpuSmoke.measure)phase('prepare',performance.now()-t);}};
 B.CacheRoadGPUContext.prototype.replay=function(ctx){const previous=gpuSmoke.phaseKind,kind=this.options.kind||'forward',t=performance.now();
  gpuSmoke.phaseKind='replay-'+kind;try{return replay.call(this,ctx);}
  finally{if(gpuSmoke.measure)phase('replay-'+kind,performance.now()-t);gpuSmoke.phaseKind=previous;}};
 const native=renderer.ctx,copy=native.drawImage,restore=native.restore,pixiRender=PIXI.WebGLRenderer.prototype.render;
 native.drawImage=function(...args){const startup=gpuSmoke.currentStartupFrame;
  if(startup){if(args[0]===native.canvas)startup.selfCanvasCopies++;
   if(gpuSmoke.gpuCanvases.has(args[0]))startup.gpuToNativeCopies++;}
  if(!gpuSmoke.measure||!gpuSmoke.gpuCanvases.has(args[0]))return copy.apply(this,args);
  gpuSmoke.gpuToNativeCopyCount++;if(gpuSmoke.currentFrame)gpuSmoke.currentFrame.gpuToNativeCopies++;
  const t=performance.now();try{return copy.apply(this,args);}
  finally{const ms=performance.now()-t;phase('copy-'+(gpuSmoke.phaseKind||'other'),ms);
   if(ms>15&&gpuSmoke.slowNativeCalls.length<8)gpuSmoke.slowNativeCalls.push({method:'GPU canvas copy',ms,
    kind:gpuSmoke.phaseKind||'other',sourceDimensions:[args[0].width,args[0].height],stack:(new Error()).stack});}};
 native.restore=function(...args){if(!gpuSmoke.measure)return restore.apply(this,args);
  const t=performance.now();try{return restore.apply(this,args);}
  finally{const ms=performance.now()-t;phase('native-restore-'+(gpuSmoke.phaseKind||'foreground'),ms);
   if(ms>15&&gpuSmoke.slowNativeCalls.length<8)gpuSmoke.slowNativeCalls.push({method:'native restore',ms,
    kind:gpuSmoke.phaseKind||'foreground',stack:(new Error()).stack});}};
 PIXI.WebGLRenderer.prototype.render=function(...args){if(!gpuSmoke.measure||!gpuSmoke.phaseKind)return pixiRender.apply(this,args);
  const t=performance.now();try{return pixiRender.apply(this,args);}
  finally{phase('gpu-submit-'+gpuSmoke.phaseKind,performance.now()-t);}};
 engine.render=function(commands,ctx,options={}){const previous=gpuSmoke.phaseKind,kind=options.kind||'forward',t=performance.now();
  const frame=gpuSmoke.currentFrame;if(gpuSmoke.measure&&frame?.commandStarted[kind]!==undefined)
   phase('command-generation-'+kind,t-frame.commandStarted[kind]);
  if(gpuSmoke.currentFrame)gpuSmoke.currentFrame.directFrameActive ||= directActive();
  gpuSmoke.phaseKind=kind;let value;try{value=render.call(this,commands,ctx,options);}finally{
   const end=performance.now();if(gpuSmoke.measure){phase('scene-render-'+kind,end-t);
    if(frame)frame[kind==='rear'?'lastRearRenderEnd':'lastForwardRenderEnd']=end;}gpuSmoke.phaseKind=previous;}if(gpuSmoke.measure){
  const kind=options.kind||'forward',row=gpuSmoke.gpuCalls[kind]||={success:0,fallback:0,reasons:{}};
  if(value)row.success++;else{row.fallback++;const reason=engine.diagnostics().fallback||'unknown';row.reasons[reason]=(row.reasons[reason]||0)+1;}
  if(gpuSmoke.currentFrame)gpuSmoke.currentFrame.views[kind]={success:!!value,reason:value?null:engine.diagnostics().fallback};}
  if(gpuSmoke.currentStartupFrame&&kind==='rear')gpuSmoke.currentStartupFrame.rearQueued ||= value===true;
  return value;};
 if(typeof engine.present==='function'){const present=engine.present;
  engine.present=function(...args){const previous=gpuSmoke.phaseKind,t=performance.now(),active=directActive();gpuSmoke.phaseKind='present';let value;
   if(gpuSmoke.measure&&gpuSmoke.currentFrame&&gpuSmoke.currentFrame.lastRearRenderEnd!==null)
    phase('foreground-after-rear',t-gpuSmoke.currentFrame.lastRearRenderEnd);
   try{value=present.apply(this,args);return value;}finally{if(active&&value===true)gpuSmoke.directPresentedFrames++;
    if(gpuSmoke.currentStartupFrame){const frame=gpuSmoke.currentStartupFrame,canvas=document.getElementById('cacheRoadGpuCanvas');
     frame.presentCalls++;frame.finalPresented ||= active&&value===true&&!!canvas?.isConnected&&
      canvas.style.display!=='none'&&renderer.canvas.classList.contains('cache-road-gpu-active');}
    if(gpuSmoke.measure){phase('present',performance.now()-t);
    const frame=gpuSmoke.currentFrame,canvas=document.getElementById('cacheRoadGpuCanvas');if(frame){frame.finalPresent=value===true;
     frame.layerVisibleAtPresent=!!canvas?.isConnected&&canvas.parentElement===renderer.canvas.parentElement&&
      canvas.style.display!=='none'&&canvas.style.visibility!=='hidden'&&renderer.canvas.classList.contains('cache-road-gpu-active');
     frame.presentCalls++;frame.lastPresentEnd=performance.now();}}
    gpuSmoke.phaseKind=previous;}};}
 const road=B.CacheRoadProof,draw=road.draw;road.draw=function(...args){
  const outermost=gpuSmoke.drawDepth++===0,t=performance.now();
  if(outermost&&gpuSmoke.monitorStartup&&!window.isPaused&&road.active){const introMs=road.introMs,
    lateHudFade=Number.isFinite(introMs)&&introMs>=6200&&introMs<7600;
   gpuSmoke.currentStartupFrame={introMs,lateHudFade,visibleHud:lateHudFade&&road.cinematicPose()?.hudAlpha>.001,
    rearQueued:false,finalPresented:false,presentCalls:0,selfCanvasCopies:0,gpuToNativeCopies:0};}
  if(outermost&&gpuSmoke.measure&&!window.isPaused)gpuSmoke.currentFrame={intervalMs:gpuSmoke.currentInterval,
   views:{},phases:{},directFrameActive:false,finalPresent:null,layerVisibleAtPresent:false,presentCalls:0,gpuToNativeCopies:0,
   drawStarted:t,commandStarted:{},lastForwardRenderEnd:null,lastRearRenderEnd:null,lastPresentEnd:null};
  try{return draw.apply(this,args);}finally{gpuSmoke.drawDepth--;
   if(outermost){const startup=gpuSmoke.currentStartupFrame;if(startup){const coverage=gpuSmoke.startupCoverage;coverage.observedFrames++;
     if(startup.lateHudFade){coverage.lateHudFadeFrames++;if(startup.visibleHud)coverage.visibleHudFadeFrames++;
      if(startup.visibleHud&&startup.rearQueued)coverage.rearQueuedFrames++;
      if(startup.finalPresented&&startup.presentCalls===1)coverage.finalPresentedFrames++;
      coverage.selfCanvasCopies+=startup.selfCanvasCopies;coverage.gpuToNativeCopies+=startup.gpuToNativeCopies;
      coverage.firstIntroMs??=startup.introMs;coverage.lastIntroMs=startup.introMs;}}
    gpuSmoke.currentStartupFrame=null;
    if(gpuSmoke.measure&&!window.isPaused){const ms=performance.now()-t;gpuSmoke.drawCosts.push(ms);
    const frame=gpuSmoke.currentFrame;if(frame){if(frame.lastPresentEnd!==null)phase('draw-after-present',performance.now()-frame.lastPresentEnd);
     frame.drawMs=ms;delete frame.drawStarted;delete frame.commandStarted;delete frame.lastForwardRenderEnd;
     delete frame.lastRearRenderEnd;delete frame.lastPresentEnd;gpuSmoke.frameRows.push(frame);}}
    if(gpuSmoke.verifyLoss){const diagnostic=engine.diagnostics();gpuSmoke.lifecycleFrames.push({gpuStatus:diagnostic.status,
     presentation:diagnostic.presentation,activeNativeClass:renderer.canvas.classList.contains('cache-road-gpu-active'),
     roadStatus:road.status,progress:road.state.progress,elapsedMs:road.state.elapsedMs});}gpuSmoke.currentFrame=null;}}};
}
function layerDisplay(){
 const snapshot=element=>{if(!element)return null;const rect=element.getBoundingClientRect(),style=getComputedStyle(element);
  return {id:element.id,backing:{width:element.width,height:element.height},className:element.className,
   bounds:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},style:{display:style.display,visibility:style.visibility,
    backgroundColor:style.backgroundColor,zIndex:style.zIndex,pointerEvents:style.pointerEvents,opacity:style.opacity}};};
 return {standaloneViewportMarker:!!document.getElementById('standalone-viewport-style'),
  viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},
  native:snapshot(renderer.canvas),gpu:snapshot(document.getElementById('cacheRoadGpuCanvas')),
  sameParent:!!document.getElementById('cacheRoadGpuCanvas')&&
   document.getElementById('cacheRoadGpuCanvas').parentElement===renderer.canvas.parentElement};
}
function fontReadiness(){
 return {status:document.fonts?.status||null,oxaniumP:document.fonts?.check('bold 64px Oxanium','P')??null,
  faces:document.fonts?[...document.fonts].map(face=>({family:face.family,status:face.status})):[],
  fontResources:performance.getEntriesByType('resource').filter(entry=>/fonts|\.(?:ttf|woff2?|otf)(?:\?|$)/.test(entry.name))
   .map(entry=>({name:entry.name,startTime:entry.startTime,duration:entry.duration,responseEnd:entry.responseEnd}))};
}
function summary(){
 const road=BARCODE.CacheRoadProof,intervals=gpuSmoke.intervals;
 const stats=values=>{const a=values.slice().sort((a,b)=>a-b);return {count:a.length,min:a[0]??null,median:a[Math.floor(a.length*.5)]??null,
  p95:a[Math.floor(a.length*.95)]??null,max:a[a.length-1]??null,over33ms:a.filter(v=>v>33.3334).length};};
 const complete=row=>row.views.forward?.success&&row.views.rear?.success&&
   (!row.directFrameActive||(row.finalPresent===true&&row.layerVisibleAtPresent&&row.presentCalls===1)),
  rows=gpuSmoke.frameRows,
  fullyGpuRows=rows.filter(complete),fullyGpuIntervals=rows.filter((row,i)=>i>0&&complete(row)&&complete(rows[i-1])&&row.intervalMs!==null).map(row=>row.intervalMs),
  phaseNames=Object.keys(gpuSmoke.phaseCosts),gpu=BARCODE.CacheRoadGPU.diagnostics();
 return {pixiVersion:PIXI.VERSION,frameCadenceMs:stats(intervals),cpuDrawMs:stats(gpuSmoke.drawCosts),
  fullyGpu:{frames:fullyGpuRows.length,cpuDrawMs:stats(fullyGpuRows.map(row=>row.drawMs)),frameCadenceMs:stats(fullyGpuIntervals),
   phaseMs:Object.fromEntries(phaseNames.map(name=>[name,stats(fullyGpuRows.map(row=>row.phases[name]||0))]))},
  phaseMs:Object.fromEntries(phaseNames.map(name=>[name,stats(gpuSmoke.phaseCosts[name])])),
  framePhaseRows:rows,warmupCalls:gpuSmoke.warmupCalls,presentationResult:gpuSmoke.hudPresentationResult||null,
  startup:{pageTimeOrigin:performance.timeOrigin,hudReadyAt:gpuSmoke.hudReadyAt,stageMarks:gpuSmoke.stageMarks||[],
   fontReadinessAtHud:gpuSmoke.hudFontReadiness||null,lateHudFade:gpuSmoke.startupCoverage},
  slowNativeCalls:gpuSmoke.slowNativeCalls,contexts:gpuSmoke.contexts,
  directScreenAcceptance:{supported:gpuSmoke.directScreenSupported,displayAtHud:gpuSmoke.hudLayerDisplay||null,
   measuredFrames:rows.length,activeDirectFrames:rows.filter(row=>row.directFrameActive).length,
   completedPresentFrames:rows.filter(row=>row.directFrameActive&&row.finalPresent===true&&row.layerVisibleAtPresent&&row.presentCalls===1).length,
   gpuToNativeCopies:rows.reduce((sum,row)=>sum+row.gpuToNativeCopies,0),
   otherMeasuredGpuToNativeCopies:gpuSmoke.gpuToNativeCopyCount-rows.reduce((sum,row)=>sum+row.gpuToNativeCopies,0),
   queuedCommandsAreNotPresentedFrames:true},
  rafOwners:gpuSmoke.rafOwners,activeRafOwners:gpuSmoke.activeRafOwners,gl:gpuSmoke.gl,gpuCalls:gpuSmoke.gpuCalls,gpu,
  measuredTextureUploads:{start:gpuSmoke.measurementStartUploads??null,end:gpu.uploads,
   delta:gpuSmoke.measurementStartUploads===undefined?null:gpu.uploads-gpuSmoke.measurementStartUploads,
   scope:'Driving measurement span, including intervening screenshot/pause gaps; excludes initial warmup and later context-recovery uploads.'},
  native:{width:renderer.canvas.width,height:renderer.canvas.height},
  road:{status:road.status,progress:road.state.progress,gear:road.state.gear,integrity:road.state.integrity,
   musicBar:road.state.musicBar,boss:!!road.state.combat?.boss,cinematic:road.cinematicPose(),audioDegraded:road.audioDegraded},
  audio:{profileId:BARCODE.MusicProfiles.getActive()?.profileId,contextState:window.audioSystem?.context?.state,
   audioTime:window.audioSystem?.context?.currentTime,transport:BARCODE.MusicTransport.getDiagnostics?.()},
  externalResources:performance.getEntriesByType('resource').map(r=>r.name).filter(n=>
   !n.startsWith(location.origin)&&!n.startsWith('blob:'+location.origin)&&!n.startsWith('data:'))};
}
function inspectLayerDisplay(display){
 const native=display?.native,gpu=display?.gpu,viewport=display?.viewport,
  near=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<.15,
  backing=element=>element?.backing?.width===1920&&element?.backing?.height===1080,
  visible=element=>!!element&&element.style.display!=='none'&&element.style.visibility==='visible'&&Number(element.style.opacity)===1,
  scale=viewport?Math.min(viewport.width/1920,viewport.height/1080):NaN,
  fit={x:(viewport?.width-1920*scale)/2,y:(viewport?.height-1080*scale)/2,width:1920*scale,height:1080*scale},
  fits=element=>['x','y','width','height'].every(key=>near(element?.bounds?.[key],fit[key])),
  checks={standaloneViewportMarker:display?.standaloneViewportMarker===true,
   native1920x1080:backing(native),gpu1920x1080:backing(gpu),nativeVisible:visible(native),gpuVisible:visible(gpu),
   nativeForegroundClass:/(?:^|\s)cache-road-gpu-active(?:\s|$)/.test(native?.className||''),
   nativeTransparent:native?.style.backgroundColor==='rgba(0, 0, 0, 0)'||native?.style.backgroundColor==='transparent',
   sameParent:display?.sameParent===true,nativeFullFit:fits(native),gpuFullFit:fits(gpu),
   matchedBounds:['x','y','width','height'].every(key=>near(native?.bounds?.[key],gpu?.bounds?.[key])),
   gpuBehindNative:Number.isFinite(Number(gpu?.style.zIndex))&&Number.isFinite(Number(native?.style.zIndex))&&
    Number(gpu?.style.zIndex)<Number(native?.style.zIndex),gpuIgnoresPointerInput:gpu?.style.pointerEvents==='none'};
 return {accepted:Object.values(checks).every(Boolean),checks,expectedFit:fit};
}
function inspectTextureBank(gpu){
 if(!textureManifest)return {supported:false,accepted:true,reason:'Legacy build has no compressed bank'};
 const checks={all171Sources:gpu.residentSources===171,all149Compressed:gpu.compressedSources===149,
  exact22OriginalSvg:gpu.expectedOriginalSources===22,zeroCompressedFallbacks:gpu.compressedFallbackSources===0,
  zeroOtherFallbacks:gpu.originalFallbackSources===0,exactMipStorage:gpu.sourceStorageBytes===textureManifest.allGpuMipBytes,
  workerTerminated:gpu.textureBank?.workerActive===false,noPendingJobs:gpu.textureBank?.pendingJobs===0,
  noFailedJobs:gpu.textureBank?.lastResult?.failed?.length===0,noUnlistedKeys:gpu.textureBank?.lastResult?.unlisted?.length===0};
 return {supported:true,accepted:Object.values(checks).every(Boolean),checks,sourceFormats:gpu.sourceFormats,
  sourceStorageBytes:gpu.sourceStorageBytes,expectedStorageBytes:textureManifest.allGpuMipBytes,
  worker:gpu.textureBank,limitation:'Compressed decoding/storage and actual browser upload are exercised; this does not claim lossless pixels.'};
}
function inspectWorldBatches(gpu){
 const compiler=gpu.worldCompiler||{},views=gpu.clipGroupsByKind||{},
  checks={compilerEnabled:compiler.enabled===true,
   forwardImages:(views.forward?.worldBatchImages||0)>0,rearImages:(views.rear?.worldBatchImages||0)>0,
   forwardGradients:(views.forward?.worldBatchGradients||0)>0,rearGradients:(views.rear?.worldBatchGradients||0)>0,
   forwardBatches:(views.forward?.worldBatches||0)>0,rearBatches:(views.rear?.worldBatches||0)>0};
 return {accepted:Object.values(checks).every(Boolean),checks,compiler,views,
  limitation:'These are submitted compound batches and geometry counts, not measured GL draw calls.'};
}
async function checkPerformance(result){
 assert(result.gpu.residentTexels<=result.gpu.residentBudgetTexels,'GPU residency exceeded its actual budget');
 assert.equal(result.gpu.pixiSystemTickerStarted,false);assert.equal(result.gpu.pixiSharedTickerStarted,false);
 assert.equal(Object.keys(result.activeRafOwners).length,1,'More than one active RAF owner');
 assert(Object.keys(result.activeRafOwners)[0].includes('/src/core/loop.js:'),'Gameplay RAF owner changed');
 const classification=classifyBackend(result.gl,result.gpu),{unavailable,hardware}=classification,
  budget=1000/30,
  fullyGpuAccepted=result.fullyGpu.frames===result.framePhaseRows.length&&result.framePhaseRows.length>0,
  zeroDrivingUploads=result.measuredTextureUploads.delta===0,
  completeLevelSources=result.presentationResult?.complete===true&&Array.isArray(result.presentationResult?.missingKeys)&&
   result.presentationResult.missingKeys.length===0,
  direct=result.directScreenAcceptance,layerDisplay=inspectLayerDisplay(direct.displayAtHud),
  directPresentAccepted=direct.supported&&layerDisplay.accepted&&direct.measuredFrames>0&&
   direct.activeDirectFrames===direct.measuredFrames&&direct.completedPresentFrames===direct.measuredFrames,
  zeroCanvasCopies=direct.gpuToNativeCopies===0&&direct.otherMeasuredGpuToNativeCopies===0,
  compressedBankAcceptance=inspectTextureBank(result.gpu),
  worldBatchAcceptance=inspectWorldBatches(result.gpu),
  gate={budgetMs:budget,backend:classification.backend,
   performanceExercised:hardware,status:hardware?(result.cpuDrawMs.median<=budget&&fullyGpuAccepted&&zeroDrivingUploads&&completeLevelSources&&directPresentAccepted&&zeroCanvasCopies&&compressedBankAcceptance.accepted&&worldBatchAcceptance.accepted?'passed':'failed'):'performanceUnexercised',
   fullyGpuAccepted,zeroDrivingUploads,completeLevelSources,directPresentAccepted,zeroCanvasCopies,
   directScreenAcceptance:{...direct,layerDisplay},presentationResult:result.presentationResult,
   cpuDrawMedianMs:result.cpuDrawMs.median,cpuDrawP95Ms:result.cpuDrawMs.p95,cpuDrawMaxMs:result.cpuDrawMs.max,
   observedRafCadence:result.frameCadenceMs,gpuFallbacks:result.gpuCalls,measuredTextureUploads:result.measuredTextureUploads,
   fullyGpu:result.fullyGpu,
   compressedBankAcceptance,
   worldBatchAcceptance,
   limitation:'This hardware gate retains the existing 33.333 ms draw-median threshold. Tail times and RAF intervals are reported separately; passing the median is not smooth-frame or physical-display acceptance.'};
 fs.writeFileSync(path.join(out,'performance-gate.json'),JSON.stringify(gate,null,2));
 if(!unavailable){assert(directPresentAccepted,'Every measured available-GPU frame must finish one visible direct presentation with matched full-fit native/HUD layers');
  if(scenario==='fresh'){const fade=result.startup.lateHudFade;assert(fade.lateHudFadeFrames>0,'Actual late intro HUD fade was not observed');
   assert(fade.visibleHudFadeFrames>0,'Actual visible HUD fade was not observed');
   assert.equal(fade.rearQueuedFrames,fade.visibleHudFadeFrames,'Every HUD-visible fade frame must queue its rear view on the actual GPU path');
   assert.equal(fade.finalPresentedFrames,fade.lateHudFadeFrames,'Every observed late HUD fade frame must finish visible GPU output');
   assert.equal(fade.selfCanvasCopies,0,'Late HUD fade must not copy the native canvas onto itself');
   assert.equal(fade.gpuToNativeCopies,0,'Late HUD fade must not copy GPU output into the native canvas');}
  assert(zeroCanvasCopies,'Measured direct GPU frames must not copy the GPU canvas into native Canvas2D');
  assert.equal(result.fullyGpu.frames,result.framePhaseRows.length,
  'Every measured available-GPU frame must render both views and finish visible GPU output');
  assert.equal(result.presentationResult?.complete,true,'All requested Level2 source keys must be ready before driving');
  assert.deepEqual(result.presentationResult?.missingKeys,[],'Requested Level2 source keys are missing');
  assert.equal(result.measuredTextureUploads.delta,0,'Measured driving must not upload new textures after level warmup');}
 if(hardware&&textureManifest)assert(compressedBankAcceptance.accepted,'Hardware warmup must retain149compressed+22originalSVGtextures with zerocodec fallback and no live decoder worker');
 if(hardware)assert(worldBatchAcceptance.accepted,'Available hardware must exercise compound image and analytic gradient batches in both scenery views');
 console.log('GPU_PERFORMANCE '+JSON.stringify({status:gate.status,backend:gate.backend,
  performanceExercised:gate.performanceExercised,budgetMs:gate.budgetMs,cpuDrawMedianMs:gate.cpuDrawMedianMs,
  cpuDrawP95Ms:gate.cpuDrawP95Ms,cpuDrawMaxMs:gate.cpuDrawMaxMs,directPresentAccepted,zeroCanvasCopies,
  observedRafCadence:gate.observedRafCadence}));
 if(gate.status==='failed'){
  await send('Profiler.enable');await send('Profiler.start');await delay(2500);
  const captured=await send('Profiler.stop');fs.writeFileSync(path.join(out,'slow-scene-cpu-profile.json'),JSON.stringify(captured.profile));
 }
 return gate;
}
async function verifyContextRecovery(){
 operation('context recovery: read before state');
 const before=await evaluate('({gpu:BARCODE.CacheRoadGPU.diagnostics(),road:{status:BARCODE.CacheRoadProof.status,progress:BARCODE.CacheRoadProof.state.progress},audioTime:audioSystem.context.currentTime,audioState:audioSystem.context.state,transport:BARCODE.MusicTransport.getDiagnostics()})');
 operation('context recovery: read before layer geometry');
 before.layerDisplay=await evaluate('('+layerDisplay.toString()+')()');
 operation('context recovery: acquire WEBGL_lose_context');
 const available=await evaluate("(()=>{gpuSmoke.recoveryExtension=gpuSmoke.gpuContext?.getExtension('WEBGL_lose_context');return !!gpuSmoke.recoveryExtension})()");
 if(!available)return {status:'notExercised',reason:'WEBGL_lose_context unavailable',before};
 operation('context recovery: request actual context loss');
 await evaluate('gpuSmoke.verifyLoss=true;gpuSmoke.recoveryExtension.loseContext()');
 operation('context recovery: observe complete native fallback frame');
 await waitFor("BARCODE.CacheRoadGPU.diagnostics().status==='lost'&&gpuSmoke.lifecycleFrames.some(f=>f.gpuStatus==='lost')",'complete native fallback frame after context loss',15000);
 operation('context recovery: screenshot complete native fallback');
 await screenshot('05-context-lost-native-fallback');
 await sampleMemory('native-context-loss-after-complete-frame');
 const lost=await evaluate('({gpu:BARCODE.CacheRoadGPU.diagnostics(),road:{status:BARCODE.CacheRoadProof.status,progress:BARCODE.CacheRoadProof.state.progress},audioState:audioSystem.context.state,audioTime:audioSystem.context.currentTime})');
 lost.layerDisplay=await evaluate('('+layerDisplay.toString()+')()');
 assert.equal(lost.road.status,'playing','Context loss stopped gameplay');assert.equal(lost.audioState,'running','Context loss stopped audio');
 if(before.gpu.presentation==='direct-gpu-layer'){
  assert.equal(lost.gpu.presentation,'native-canvas','Lost GPU output must switch to the full native road');
  assert(!/(?:^|\s)cache-road-gpu-active(?:\s|$)/.test(lost.layerDisplay.native.className),'Lost GPU left the native HUD transparent');
  assert.equal(lost.layerDisplay.gpu?.style.display,'none','Lost GPU canvas remained visible');}
 operation('context recovery: request actual context restoration');
 await evaluate('gpuSmoke.recoveryExtension.restoreContext()');
 operation('context recovery: observe ordinary update texture restoration');
 await waitFor("BARCODE.CacheRoadGPU.diagnostics().status==='ready'&&BARCODE.CacheRoadGPU.diagnostics().framesByKind.forward>"+before.gpu.framesByKind.forward+
  "&&BARCODE.CacheRoadGPU.diagnostics().framesByKind.rear>"+before.gpu.framesByKind.rear,'ordinary update restores GPU originals and both views',20000);
 operation('context recovery: screenshot restored direct scene');
 await screenshot('06-context-restored');
 await sampleMemory('restored-direct-GPU');
 const restored=await evaluate('({gpu:BARCODE.CacheRoadGPU.diagnostics(),road:{status:BARCODE.CacheRoadProof.status,progress:BARCODE.CacheRoadProof.state.progress},audioState:audioSystem.context.state,audioTime:audioSystem.context.currentTime,transport:BARCODE.MusicTransport.getDiagnostics(),frames:gpuSmoke.lifecycleFrames,rafOwners:gpuSmoke.lifecycleRafOwners})');
 restored.layerDisplay=await evaluate('('+layerDisplay.toString()+')()');
 await evaluate('gpuSmoke.verifyLoss=false');
 assert.equal(restored.road.status,'playing');assert.equal(restored.audioState,'running');assert(restored.audioTime>before.audioTime);
 assert.equal(restored.transport.profileId,before.transport.profileId);assert.equal(restored.transport.generation,before.transport.generation);
 assert.equal(restored.gpu.fallback,null);assert.equal(restored.gpu.error,null);assert(restored.gpu.uploads>before.gpu.uploads,'Restored textures were not reuploaded');
 assert.equal(restored.gpu.pixiSystemTickerStarted,false);assert.equal(restored.gpu.pixiSharedTickerStarted,false);
 if(textureManifest&&before.gpu.compressedSources===149){const bank=inspectTextureBank(restored.gpu);
  fs.writeFileSync(path.join(out,'restored-texture-bank-acceptance.json'),JSON.stringify(bank,null,2));
  assert(bank.accepted,'Context recovery lost compressed/original texture ownership or left a decoder worker alive');}
 if(before.gpu.worldCompiler?.enabled){const batches=inspectWorldBatches(restored.gpu);
  fs.writeFileSync(path.join(out,'restored-world-batch-acceptance.json'),JSON.stringify(batches,null,2));
  assert(batches.accepted,'Context recovery must restore complete image and gradient batches in both views');}
 if(before.gpu.presentation==='direct-gpu-layer'){
  assert.equal(restored.gpu.presentation,'direct-gpu-layer','Restored GPU did not resume direct visible output');
  assert(inspectLayerDisplay(restored.layerDisplay).accepted,'Restored GPU/native layers lost their full-fit display geometry');
  assert(restored.frames.some(frame=>frame.gpuStatus==='lost'&&frame.presentation==='native-canvas'&&!frame.activeNativeClass),
   'No complete ordinary native road frame occurred during context loss');}
 assert.equal(Object.keys(restored.rafOwners).length,1);assert(Object.keys(restored.rafOwners)[0].includes('/src/core/loop.js:'));
 assert.equal(exceptions.length,0,'Context loss/restoration raised a page exception');
 return {status:'passed',before,lost,restored,limitation:'Frames and captures demonstrate the native fallback and automatic recovery; screenshots require visual review.'};
}
async function verifyPausedBoss(){
 await hold('p','KeyP',80);await waitFor('window.isPaused','boss keyboard pause',3000);
 const expression='({progress:BARCODE.CacheRoadProof.state.progress,elapsedMs:BARCODE.CacheRoadProof.state.elapsedMs,audioState:audioSystem.context.state,audioTime:audioSystem.context.currentTime,transport:BARCODE.MusicTransport.getDiagnostics()})',
  paused=await evaluate(expression);
 await screenshot('03-boss-paused');await delay(400);const stillPaused=await evaluate(expression);
 assert.equal(paused.progress,stillPaused.progress);assert.equal(paused.elapsedMs,stillPaused.elapsedMs);
 assert.equal(paused.audioTime,stillPaused.audioTime);assert.equal(paused.audioState,'suspended');assert.equal(stillPaused.audioState,'suspended');
 assert.equal(paused.transport.running,false);assert.equal(stillPaused.transport.running,false);
 await hold('Escape','Escape',27);await waitFor('!window.isPaused','boss keyboard resume',3000);
 await waitFor("audioSystem.context.state==='running'&&BARCODE.MusicTransport.getDiagnostics().running",'boss audio resumes',3000);
 return {paused,stillPaused,resumed:await evaluate(expression)};
}
function inspectExternalResources(resources){
 const fonts=[],unexpected=[];
 for(const url of resources){if(allowedFontCSS.has(url)){fonts.push({url,type:'authored Google Fonts stylesheet'});continue;}
  const request=Array.from(networkRequests.values()).find(row=>row.url===url),parsed=new URL(url),
   fontPath=parsed.hostname==='fonts.gstatic.com'&&/\.(?:woff2?|ttf|otf)$/.test(parsed.pathname),
   fontMime=!request?.mimeType||/^(?:font\/|application\/(?:font-woff|x-font-ttf))/.test(request.mimeType);
  if(fontPath&&request?.resourceType==='Font'&&fontMime)fonts.push({url,type:'font resource',mimeType:request.mimeType||null,
   initiatorType:request.initiatorType});else unexpected.push(url);}
 fs.writeFileSync(path.join(out,'external-fonts.json'),JSON.stringify({existingBuilderException:true,externalFonts:fonts,
  unexpectedExternalResources:unexpected},null,2));
 assert.deepEqual(unexpected,[],'Built game fetched graphics, audio, scripts or unauthorized resources outside its host');
 return fonts;
}
async function finishChecks(result){
 assert.equal(result.native.width,1920);assert.equal(result.native.height,1080);assert.equal(exceptions.length,0);
 assert.deepEqual(resourceFailures.filter(n=>n!=='/favicon.ico'),[],'Built game requested missing resources');
 const fonts=inspectExternalResources(result.externalResources);
 assert.equal(result.audio.contextState,'running');assert.equal(result.audio.transport.running,true);
 if(result.gpu.status!=='unavailable'){assert.equal(result.gpu.status,'ready');assert.equal(result.gpu.fallback,null);assert.equal(result.gpu.error,null);
  assert(result.gpu.framesByKind.forward>0&&result.gpu.framesByKind.rear>0,'Both GPU views must render');}
 const gate=await checkPerformance(result);operation('post-driving: sample memory before context loss');
 await sampleMemory('post-driving-before-context-loss');const recovery=await verifyContextRecovery();
 fs.writeFileSync(path.join(out,'context-recovery.json'),JSON.stringify(recovery,null,2));
 console.log('GPU_CONTEXT_RECOVERY '+JSON.stringify({status:recovery.status,reason:recovery.reason||null}));
 let level1Return={status:'notExercised',reason:'Scoped scene resource contract absent'};
 if(await evaluate('!!BARCODE.LevelSceneResources')){
  operation('resource return: normal Road.exit to saved Level 1 results');
  const returned=await evaluate('BARCODE.CacheRoadProof.exit()');assert.equal(returned,true,'Normal road exit failed');
  await waitFor("!BARCODE.CacheRoadProof.active&&BARCODE.StandaloneSprites.isLoaded()&&BARCODE.RuntimeLifecycle.getState()==='running'",'Level 1 resources reload after normal road exit',30000);
  await screenshot('07-return-level1-results');await sampleMemory('returned-Level1-resources');
  const state=await evaluate('({resources:('+sceneResources.toString()+')(),roadActive:BARCODE.CacheRoadProof.active,runtime:BARCODE.RuntimeLifecycle.getState(),gameState:{victory:gameState.victory,running:gameState.running},rafOwners:gpuSmoke.lifecycleRafOwners})');
  assert.equal(state.resources.standaloneSprites.loaded,true);assert(state.resources.standaloneSprites.characters>0);assert(state.resources.standaloneSprites.sourceImages>0);
  assert.equal(state.roadActive,false);assert.equal(state.gameState.victory,true,'Return did not preserve completed Level 1 results');
  await hold('p','KeyP',80);await waitFor('window.isPaused','returned Level 1 keyboard pause',3000);
  // The completed-Level-1 bridge owns P/P, while active road pause owns P/Escape.
  await hold('p','KeyP',80);await waitFor('!window.isPaused','returned Level 1 bridge keyboard resume',3000);
  level1Return={status:'passed',normalRoadExit:true,resourcesReloaded:true,keyboardPauseResume:true,keys:'P/P (authored bridge)',state};
  fs.writeFileSync(path.join(out,'level1-return.json'),JSON.stringify(level1Return,null,2));
 }
 assert.deepEqual(hashes(),inputHashes,'Build changed during context recovery');
 assert.deepEqual(resourceFailures.filter(n=>n!=='/favicon.ico'),[],'Recovery requested missing resources');
 fs.writeFileSync(path.join(out,'functional-gate.json'),JSON.stringify({status:'passed',scenario,
  normalIndex:true,normalContinue:scenario==='boss',native1920x1080:true,resourceFailures:[],oneGameplayRaf:true,
  activeAudio:true,gpuCoverage:result.gpu.status==='ready'?'both views':'unavailable native fallback',
  externalFonts:fonts,
  directPresentAccepted:gate.directPresentAccepted,zeroCanvasCopies:gate.zeroCanvasCopies,
  directScreenAcceptance:gate.directScreenAcceptance,
  contextRecovery:recovery.status,level1Return:level1Return.status,hardwarePerformance:gate.status,sourceCommit:manifest.sourceCommit,inputHashes},null,2));
 if(gate.status==='failed')throw Error('Actual hardware scene draw median '+result.cpuDrawMs.median+' ms exceeds '+gate.budgetMs+' ms; CPU profile captured');
}
function compactGpu(gpu){const {residentSourceDescriptors,...rest}=gpu;
 return {...rest,residentSourceDescriptorCount:residentSourceDescriptors?.length||0};}
function backendSnapshot(){
 const R=BARCODE.CacheRoadProof,ctx=gpuSmoke.gpuContext;
 let gl=null;
 if(ctx&&!ctx.isContextLost()){
  const ext=ctx.getExtension('WEBGL_debug_renderer_info');
  gl={version:ctx.getParameter(ctx.VERSION),unmaskedRenderer:!!ext,
   vendor:ctx.getParameter(ext?ext.UNMASKED_VENDOR_WEBGL:ctx.VENDOR),
   renderer:ctx.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:ctx.RENDERER),attributes:ctx.getContextAttributes()};
 }
 return {gl,gpu:BARCODE.CacheRoadGPU.diagnostics(),
  actualContext:ctx?{width:ctx.canvas.width,height:ctx.canvas.height,element:ctx.canvas.id||null,lost:ctx.isContextLost()}:null,
  road:{active:R.active,presentationPreparing:R.presentationPreparing,status:R.status,introMs:R.introMs,handoffMs:R.handoffMs},
  presentationResult:R.presentationResult,warmupActive:gpuSmoke.warmupActive||null,warmupCalls:gpuSmoke.warmupCalls,
  stageMarks:gpuSmoke.stageMarks||[],contexts:gpuSmoke.contexts,
  externalResources:performance.getEntriesByType('resource').map(r=>r.name).filter(n=>
   !n.startsWith(location.origin)&&!n.startsWith('blob:'+location.origin)&&!n.startsWith('data:'))};
}
async function main(){
 server.listen(0,'127.0.0.1');await once(server,'listening');const origin='http://127.0.0.1:'+server.address().port;
 const args=['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run','--autoplay-policy=no-user-gesture-required',
  '--window-size=1920,1080','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'];
 chrome=cp.spawn(chromePath,args,{stdio:['ignore','ignore','pipe']});closed=once(chrome,'close');
 const url=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Chrome startup: '+text)),30000);
   chrome.once('error',reject);chrome.stderr.on('data',b=>{text=(text+b).slice(-16384);chromeStderr=(chromeStderr+b).slice(-32768);const m=text.match(/DevTools listening on (ws:\/\/\S+)/);
   if(m){clearTimeout(timer);resolve(m[1]);}});});
 const target=await (await fetch(new URL(url).origin.replace('ws:','http:')+'/json/new',{method:'PUT'})).json();
 socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});});
 ownedTargetId=target.id;await connectBrowserDiagnostics(url);
 await browserSend('Target.setDiscoverTargets',{discover:true});
 let serial=0;const pending=new Map();socket.addEventListener('message',event=>{const m=JSON.parse(event.data);
  if(['Inspector.targetCrashed','Inspector.detached','Inspector.targetReloadedAfterCrash'].includes(m.method))targetEvent(m.method,m.params||{});
  if(m.method==='Network.requestWillBeSent')networkRequests.set(m.params.requestId,{url:m.params.request.url,
   resourceType:m.params.type,initiatorType:m.params.initiator?.type});
  if(m.method==='Network.responseReceived'){const row=networkRequests.get(m.params.requestId);if(row)row.mimeType=m.params.response.mimeType;}
  if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails);
  if(m.method==='Runtime.consoleAPICalled'){const args=m.params.args.map(a=>a.value??a.description);
   consoleMessages.push({type:m.params.type,timestamp:m.params.timestamp,args});if(typeof args[0]==='string'&&args[0].startsWith('GPU_SMOKE_STAGE '))console.log(args[0]);}
  const e=pending.get(m.id);if(e){pending.delete(m.id);clearTimeout(e.timer);m.error?e.reject(Error(JSON.stringify(m.error))):e.resolve(m.result);}});
 send=(method,params={},timeoutMs=90000)=>new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},timeoutMs);
  pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));});
 evaluate=async (expression,timeoutMs=90000)=>{lastRuntimeEvaluation={operation:currentOperation,expression,startedAt:Date.now()};
  const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},timeoutMs);lastRuntimeEvaluation.completedAt=Date.now();
  if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 try{await send('Inspector.enable',{},3000);}catch(error){targetEvent('Inspector.notificationsUnavailable',{reason:String(error)});}
 fs.writeFileSync(path.join(out,'target-events.json'),JSON.stringify(targetEvents,null,2));
 await send('Emulation.setDeviceMetricsOverride',{width:1920,height:1080,deviceScaleFactor:1,mobile:false});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:'('+instrument.toString()+')()'});
 if(bossReceipt)await send('Page.addScriptToEvaluateOnNewDocument',{source:
  'for(const [key,value] of Object.entries('+JSON.stringify(bossReceipt.host.storage)+'))localStorage.setItem(key,value);'});
 await send('Page.navigate',{url:origin});
 await waitFor("document.readyState==='complete'&&!!window.BARCODE?.RuntimeLifecycle&&!!window.BARCODE?.CacheRoadProof&&!!window.renderer",'actual index boot');
 await waitFor("!!document.getElementById('soundEnablePopup')",'actual sound button',15000);
 const soundButton=await evaluate("(()=>{const r=document.getElementById('soundEnablePopup').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
 await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...soundButton});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...soundButton});
 await waitFor("!document.getElementById('bootLoader')&&!document.getElementById('soundEnablePopup')",'natural boot completion',60000);
 await screenshot('00-title');await evaluate('('+instrumentGameplay.toString()+')()');let started;
 if(diagnosticOnly)await startStartupDiagnostics();
 if(bossReceipt){
  await waitFor("!!BARCODE.Campaign.readResume()&&!document.getElementById('continueButton').hidden",'earned save Continue button',10000);
  const resume=await evaluate('BARCODE.Campaign.readResume()');
  assert.equal(resume.levelId,'level-02');assert(resume.levelState.proof.combat.boss?.arrived,'Earned resume has no live boss');
  assert.equal(resume.checkpointId,bossReceipt.expected.checkpointId);assert.equal(resume.levelState.proof.combat.boss.hp,bossReceipt.expected.boss.hp);
  const button=await evaluate("(()=>{const r=document.getElementById('continueButton').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()");
  await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...button});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...button});
  started={scenario:'earned-live-boss',resume:{levelId:resume.levelId,checkpointId:resume.checkpointId,progress:resume.levelState.proof.progress,boss:resume.levelState.proof.combat.boss}};
 }else {operation('fresh: normal Runtime.start and Road.enter');started=await evaluate('('+stage.toString().replace('PARENT_FIXTURE',fixture)+')()');}
 operation('backend: actual game context after settled normal presentation preparation');
 await waitFor('BARCODE.CacheRoadProof.active&&!BARCODE.CacheRoadProof.presentationPreparing',
  'normal Road entry and settled presentation preparation',60000);
 const backendState=await evaluate('('+backendSnapshot.toString()+')()'),classification=classifyBackend(backendState.gl,backendState.gpu);
 backendState.compressedBankAcceptance=inspectTextureBank(backendState.gpu);
 // Persist raw context/compiler/preparation evidence before any assertion, so
 // a real bootstrap defect remains diagnosable rather than a backend waiver.
 fs.writeFileSync(path.join(out,'gpu-backend.json'),JSON.stringify({...backendState,classification,
  scenario,sourceCommit:manifest.sourceCommit,inputHashes},null,2));
 assert.equal(exceptions.length,0,'Actual index raised exceptions before backend classification');
 assert.deepEqual(resourceFailures.filter(n=>n!=='/favicon.ico'),[],'Built game requested missing resources during bootstrap');
 assert.deepEqual(hashes(),inputHashes,'Build changed during bootstrap');
 inspectExternalResources(backendState.externalResources);
 const bootstrap=inspectBootstrap(backendState);
 fs.writeFileSync(path.join(out,'gpu-backend.json'),JSON.stringify({...backendState,classification,bootstrap,
  scenario,sourceCommit:manifest.sourceCommit,inputHashes},null,2));
 console.log('GPU_BACKEND '+JSON.stringify({backend:classification.backend,hardware:classification.hardware,
  actualContext:backendState.actualContext,gl:backendState.gl,gpu:compactGpu(backendState.gpu),bootstrap}));
 if(!classification.hardware&&!diagnosticOnly){
  const gate=unexercisedGate(backendState,scenario,manifest.sourceCommit,inputHashes),
   functional={status:gate.functionalStatus,scenario,backend:gate.backend,scenarios:gate.functionalScenarios,
    bootstrap:gate.bootstrap,hardwarePerformance:gate.status,sourceCommit:manifest.sourceCommit,inputHashes};
  fs.writeFileSync(path.join(out,'performance-gate.json'),JSON.stringify(gate,null,2));
  fs.writeFileSync(path.join(out,'functional-gate.json'),JSON.stringify(functional,null,2));
  fs.writeFileSync(path.join(out,'actual-game-result.json'),JSON.stringify({started,backendState,
   performanceGate:gate,functionalGate:functional,exceptions,consoleMessages,requests,resourceFailures,inputHashes},null,2));
  console.log('GPU_PERFORMANCE '+JSON.stringify({status:gate.status,backend:gate.backend,performanceExercised:false,
   functionalStatus:gate.functionalStatus,bootstrap:gate.bootstrap,budgetMs:gate.budgetMs,cpuDrawMedianMs:null,
   directPresentAccepted:null,zeroCanvasCopies:null,fullyGpuAccepted:null}));return;
 }
 operation('gameplay: natural ready HUD handoff');
 await waitFor('window.isRunning&&!window.isPaused&&BARCODE.CacheRoadProof.active&&!BARCODE.CacheRoadProof.presentationPreparing&&BARCODE.CacheRoadProof.introMs===null&&BARCODE.CacheRoadProof.handoffMs===null',
  'completed presentation preparation and natural HUD handoff',60000);
 await waitFor("BARCODE.CacheRoadGPU.diagnostics().status==='unavailable'||BARCODE.CacheRoadGPU.diagnostics().frames>0",
  'first actual GPU frame or explicit unavailable fallback',15000);
 await waitFor("BARCODE.CacheRoadGPU.diagnostics().status==='unavailable'||!gpuSmoke.directScreenSupported||gpuSmoke.directPresentedFrames>0",
  'first completed direct GPU presentation or explicit unavailable fallback',15000);
 const hudReady=await evaluate('(()=>{gpuSmoke.monitorStartup=false;gpuSmoke.hudReadyAt=performance.now();gpuSmoke.hudFontReadiness=('+fontReadiness.toString()+')();gpuSmoke.hudPresentationResult=BARCODE.CacheRoadProof.presentationResult;gpuSmoke.hudLayerDisplay=('+layerDisplay.toString()+')();return {gpu:BARCODE.CacheRoadGPU.diagnostics(),presentationResult:gpuSmoke.hudPresentationResult,directScreenDisplay:gpuSmoke.hudLayerDisplay,fontReadiness:gpuSmoke.hudFontReadiness,lateHudFade:gpuSmoke.startupCoverage,warmupActive:gpuSmoke.warmupActive||null,hudReadyAt:gpuSmoke.hudReadyAt,stageMarks:gpuSmoke.stageMarks||[],gl:gpuSmoke.gl,contexts:gpuSmoke.contexts,road:{status:BARCODE.CacheRoadProof.status,progress:BARCODE.CacheRoadProof.state.progress},rafOwners:gpuSmoke.rafOwners}})()');
 hudReady.sceneResources=await evaluate('('+sceneResources.toString()+')()');
 hudReady.compressedBankAcceptance=inspectTextureBank(hudReady.gpu);
 if(await evaluate('!!BARCODE.LevelSceneResources')){
  assert.equal(hudReady.sceneResources.presentationAssets.selectedSources,197,'Road must select its original GPU and shared native assets');
  assert.equal(hudReady.sceneResources.presentationAssets.cachedSources,197,'Inactive PA sources remain cached');
  assert.equal(hudReady.sceneResources.standaloneSprites.loaded,false);assert.equal(hudReady.sceneResources.standaloneSprites.characters,0);
  assert.equal(hudReady.sceneResources.standaloneSprites.sourceImages,0);assert.deepEqual(hudReady.sceneResources.level1Globals,{parallax:false,cutscene:false,spaceships:false});
  assert.equal(hudReady.sceneResources.roadReleaseReport.ok,true,'Level 1 retirement handoff failed');
 }
 fs.writeFileSync(path.join(out,'hud-ready.json'),JSON.stringify(hudReady,null,2));console.log('HUD_READY '+JSON.stringify({...hudReady,gpu:compactGpu(hudReady.gpu)}));
 await sampleMemory('HUD-ready-before-driving-measurement');
 await screenshot('01-HUD');
 const gpuStarted=await evaluate('BARCODE.CacheRoadGPU.diagnostics()');
 fs.writeFileSync(path.join(out,'gpu-started.json'),JSON.stringify(gpuStarted,null,2));console.log('GPU_STARTED '+JSON.stringify(compactGpu(gpuStarted)));
 if(diagnosticOnly){await stopStartupDiagnostics('Natural HUD reached without reproduced stall');
  assert.deepEqual(hashes(),inputHashes,'Build changed during startup diagnostic');
  fs.writeFileSync(path.join(out,'diagnostic-startup-result.json'),JSON.stringify({status:'diagnosticOnly',
   stallReproduced:false,hudReady,started,backend:gpuStarted.renderer,warmupCalls:await evaluate('gpuSmoke.warmupCalls'),
   inputHashes,limitation:'CPU/trace instrumentation is diagnostic; no driving performance or context-recovery acceptance was run.'},null,2));return;}
 await evaluate('gpuSmoke.measurementStartUploads=BARCODE.CacheRoadGPU.diagnostics().uploads;gpuSmoke.measure=true');
 const controls=[{before:await evaluate('({lane:BARCODE.CacheRoadProof.state.lanePos,gear:BARCODE.CacheRoadProof.state.gear})')}];
 if(bossReceipt){
  await delay(4500);await screenshot('02-live-boss');await evaluate('gpuSmoke.measure=false');
  const result=await evaluate('('+summary.toString()+')()');assert.deepEqual(hashes(),inputHashes,'Build changed during smoke');
  const pause=await verifyPausedBoss();
  const report={started,controls,pause,result,exceptions,consoleMessages,requests,resourceFailures,inputHashes,
   limitation:'Actual browser resume of a production-played checkpoint; headless RAF cadence and CPU submission, not physical display FPS.',
   bossCoverage:result.road.boss?'live boss present':'boss not present after real play'};
  fs.writeFileSync(path.join(out,'actual-game-result.json'),JSON.stringify(report,null,2));
  assert.equal(result.road.status,'playing','Earned boss window stopped being live gameplay');assert.equal(result.road.boss,true,'No live boss in actual resumed window');
  assert.equal(exceptions.length,0);console.log(JSON.stringify({gpu:compactGpu(result.gpu),frames:result.frameCadenceMs,draw:result.cpuDrawMs,gl:result.gl,bossCoverage:report.bossCoverage}));await finishChecks(result);return;
 }
 await hold('ArrowRight','ArrowRight',39,800);controls.push({right:await evaluate('BARCODE.CacheRoadProof.state.lanePos')});
 await hold('ArrowLeft','ArrowLeft',37,800);controls.push({left:await evaluate('BARCODE.CacheRoadProof.state.lanePos')});
 await hold('ArrowUp','ArrowUp',38);await delay(2200);controls.push({gear:await evaluate('({gear:BARCODE.CacheRoadProof.state.gear,pending:BARCODE.CacheRoadProof.state.pendingGear})')});
 await delay(7000);await screenshot('02-chase');
 await hold('p','KeyP',80);await waitFor('window.isPaused','keyboard pause',3000);
 const paused=await evaluate('({progress:BARCODE.CacheRoadProof.state.progress,elapsedMs:BARCODE.CacheRoadProof.state.elapsedMs,state:BARCODE.RuntimeLifecycle.getState(),audioState:audioSystem.context.state,audioTime:audioSystem.context.currentTime,transport:BARCODE.MusicTransport.getDiagnostics()})');
 await screenshot('03-paused');await delay(400);
 const stillPaused=await evaluate('({progress:BARCODE.CacheRoadProof.state.progress,elapsedMs:BARCODE.CacheRoadProof.state.elapsedMs,audioState:audioSystem.context.state,audioTime:audioSystem.context.currentTime,transport:BARCODE.MusicTransport.getDiagnostics()})');
 await hold('Escape','Escape',27);await waitFor('!window.isPaused','keyboard resume',3000);
 await delay(4000);await evaluate('gpuSmoke.measure=false');await screenshot('04-driving');
 const result=await evaluate('('+summary.toString()+')()');assert.deepEqual(hashes(),inputHashes,'Build changed during smoke');
 const report={started,controls,paused,stillPaused,result,exceptions,consoleMessages,requests,resourceFailures,inputHashes,
  limitation:'Real headless Chromium RAF cadence and CPU submission; physical display FPS not measured.',
  bossCoverage:result.road.boss?'live boss present':'pending; fresh race was not fast-forwarded'};
 fs.writeFileSync(path.join(out,'actual-game-result.json'),JSON.stringify(report,null,2));
 assert.equal(result.pixiVersion,'8.22.0');assert.equal(result.native.width,1920);assert.equal(result.native.height,1080);
 assert(controls[1].right>controls[0].before.lane+.15,'Actual right key did not steer');
 assert(controls[2].left<controls[1].right-.15,'Actual left key did not steer');
 assert.equal(controls[3].gear.gear,controls[0].before.gear+1,'Actual gear-up key did not shift');
 assert.equal(exceptions.length,0,'Actual index raised exceptions');
 assert.equal(paused.progress,stillPaused.progress);assert.equal(paused.elapsedMs,stillPaused.elapsedMs);
 assert.equal(paused.audioState,'suspended');assert.equal(stillPaused.audioState,'suspended');assert.equal(paused.audioTime,stillPaused.audioTime);
 assert.equal(paused.transport.running,false);assert.equal(result.audio.contextState,'running');assert.equal(result.audio.transport.running,true);
 assert(!result.externalResources.some(n=>/cdn\.jsdelivr\.net\/npm\/pixi\.js\/transcoders/.test(n)));
 console.log(JSON.stringify({gpu:compactGpu(result.gpu),frames:result.frameCadenceMs,draw:result.cpuDrawMs,gl:result.gl,bossCoverage:report.bossCoverage}));
 await finishChecks(result);
}
main().catch(async e=>{failure=String(e.stack||e);let pageState=null;
 if(diagnosticOnly)await stopStartupDiagnostics('Startup/HUD failure: '+failure);
 try{await sampleMemory('failure-before-owned-browser-close');}catch{}
 try{const r=await send('Runtime.evaluate',{expression:'(()=>{const B=window.BARCODE,R=B?.CacheRoadProof,G=B?.CacheRoadGPU?.diagnostics();return {stage:window.gpuSmoke?.stage||null,running:window.isRunning,paused:window.isPaused,runtime:B?.RuntimeLifecycle?.getState(),road:R?{active:R.active,pending:R.pending,status:R.status,presentationPreparing:R.presentationPreparing,presentationResult:R.presentationResult,introMs:R.introMs,handoffMs:R.handoffMs}:null,gpu:G?{status:G.status,error:G.error,fallback:G.fallback,warmup:G.warmup,uploads:G.uploads}:null,warmupCalls:window.gpuSmoke?.warmupCalls,warmupActive:window.gpuSmoke?.warmupActive,fonts:document.fonts?.status,audioState:window.audioSystem?.context?.state,transport:B?.MusicTransport?.getDiagnostics()}})()',returnByValue:true},3000);
  pageState=r.result.value;const capture=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},3000);
  fs.writeFileSync(path.join(out,'failure.png'),Buffer.from(capture.data,'base64'));}catch(snapshotError){pageState={...(pageState||{}),snapshotFailure:String(snapshotError)};}
 fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({failure,pageState,lastRuntimeEvaluation,operationTimeline,memoryTelemetry,targetEvents,chromeStderrTail:chromeStderr,exceptions,consoleMessages,requests},null,2));
 console.error(e);process.exitCode=1;}).finally(async()=>{
 if(socket?.readyState===WebSocket.OPEN)socket.close();
 if(browserSocket?.readyState===WebSocket.OPEN)browserSocket.close();
 if(chrome&&chrome.exitCode===null){chrome.kill();await Promise.race([closed,delay(5000)]);}
 if(server.listening)await new Promise(r=>server.close(r));let profileRemoved=false;
 for(let i=0;i<10&&!profileRemoved;i++){try{fs.rmSync(profile,{recursive:true,force:true});profileRemoved=true;}catch{await delay(250);}}
 fs.writeFileSync(path.join(out,'cleanup.json'),JSON.stringify({chromeClosed:!chrome||chrome.exitCode!==null||chrome.signalCode!==null,chromeExitCode:chrome?.exitCode,chromeSignalCode:chrome?.signalCode,serverClosed:!server.listening,
  profileRemoved,profile,inputHashesAfter:hashes(),targetEvents,helperMemory:process.memoryUsage(),chromeStderrTail:chromeStderr,failure:failure||null},null,2));
});
