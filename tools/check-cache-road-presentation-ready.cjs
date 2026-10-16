'use strict';
// Production loader, road handoff, input and lifecycle owners in a fast VM.
// Image/network, bitmap decoding and GPU uploads are deferred host boundaries;
// this checks readiness and cancellation, not browser or performance acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {bridgeRig}=require('./check-cache-bridge.cjs');
const root=path.resolve(__dirname,'..');
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const flush=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};

async function loaderReadiness(){
  const bitmap=deferred();let deferredImage=null,closed=0;
  class Image {
    constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;this.decodeCalls=0;}
    decode(){this.decodeCalls++;return Promise.resolve();}
  }
  const w={Image,BARCODE:{},performance:{now:()=>0},createImageBitmap(image){
    return image===deferredImage?bitmap.promise:Promise.resolve({width:image.naturalWidth,height:image.naturalHeight,close(){closed++;}});
  }};
  const source=fs.readFileSync(path.join(root,'src/engine/presentation-assets.js'),'utf8');
  assert(source.includes('  const cache = {};'));
  // Inspect existing metadata/state only; every production loader operation runs intact.
  vm.runInNewContext(source.replace('  const cache = {};','  const cache = {};window.readinessAudit={entries,cache};'),{window:w});
  const {entries,cache}=w.readinessAudit,assets=w.BARCODE.PresentationAssets;
  const svgKey=Object.keys(entries).find(key=>entries[key].path.endsWith('.svg'));
  assert(svgKey,'A production SVG source is required for the original/derivative-readiness contract');
  const svg=cache[svgKey].image;deferredImage=svg;
  Object.assign(svg,{complete:true,naturalWidth:1024,naturalHeight:512});svg.onload();
  let settled=false;const waiting=assets.waitForGpuSources([svgKey,svgKey]).then(value=>{settled=true;return value;});
  await flush();assert.equal(settled,true,'A pending optional SVG bitmap cannot hold loaded-original GPU readiness');
  const ready=await waiting;assert.equal(ready.length,1);assert.equal(ready[0].image,svg);
  assert.equal(svg.decodeCalls,0,'PA does not duplicate the GPU warmup owner\'s original decode');
  assert.equal(assets.ready(svgKey),true);assert.equal(closed,0);
  assert.equal(cache[svgKey].bitmap,undefined,'GPU readiness does not invent a completed native bitmap');
  const gpuCalls=[],nativeCalls=[],gpu={isGpuScene:true,imageSmoothingEnabled:true,
    drawImage(...args){gpuCalls.push(args);}},native={imageSmoothingEnabled:true,
    drawImage(...args){nativeCalls.push(args);}},paint={x:0,y:0,width:32,height:16};
  assert(assets.draw(svgKey,gpu,paint));assert.equal(gpuCalls.at(-1)[0],svg);
  assert(assets.draw(svgKey,native,paint));assert.equal(nativeCalls.at(-1)[0],svg,
    'Complete native fallback uses the original while its optional bitmap is pending');
  const prepared={width:1024,height:512,close(){closed++;}};
  bitmap.resolve(prepared);await flush();
  assert.equal(cache[svgKey].bitmap,prepared);assert(assets.draw(svgKey,native,paint));
  assert.equal(nativeCalls.at(-1)[0],prepared,'Native painting can reuse the optional bitmap after it settles');
  assert(assets.draw(svgKey,gpu,paint));assert.equal(gpuCalls.at(-1)[0],svg);
  assert.equal(svg.decodeCalls,0);

  const rasterKey=Object.keys(entries).find(key=>entries[key].path.endsWith('.webp'));
  const raster=cache[rasterKey].image,hosted=raster.src;raster.onerror();
  assert.notEqual(raster.src,hosted);assert.equal(raster.src,entries[rasterKey].path,'Existing local fallback owns the second request');
  settled=false;const fallback=assets.waitForGpuSources([rasterKey]).then(value=>{settled=true;return value;});
  await flush();assert.equal(settled,false,'Hosted failure does not finish readiness before bundled fallback settles');
  Object.assign(raster,{complete:true,naturalWidth:1024,naturalHeight:512});raster.onload();
  assert.equal((await fallback)[0].image,raster);
  assert.equal(raster.decodeCalls,0);

  const failedKey=Object.keys(entries).find(key=>key!==svgKey&&key!==rasterKey),failed=cache[failedKey].image;
  failed.onerror();failed.onerror();
  assert.equal((await assets.waitForGpuSources([failedKey])).length,0,'Exhausted fallback settles without false GPU readiness');
  const invalidKey=Object.keys(entries).find(key=>![svgKey,rasterKey,failedKey].includes(key));
  cache[invalidKey].image.onload();
  assert.equal((await assets.waitForGpuSources([invalidKey])).length,0,'Invalid image dimensions settle without hanging the loader');
}

function prepareHost(r){
  const assets=deferred(),textures=deferred(),calls={keys:null,warmups:0};
  r.B.PresentationAssets={waitForGpuSources(keys){calls.keys=keys;return assets.promise;},gpuSources:()=>[]};
  r.B.CacheRoadGPU={warmup(){calls.warmups++;return textures.promise;},prepare(){}};
  return {assets,textures,calls,load(){assets.resolve(calls.keys.map(key=>({key,image:{}})));}};
}

function resetBridgeBoundary(r,parent){
  r.road.dispose();delete r.B.CacheRoadGPU;delete r.B.PresentationAssets;
  // Reuse one VM; restore only the completed-Level-1 host fixture between cases.
  r.B.Campaign.archive().checkpoint(parent);r.B.Campaign.intermission=true;
  r.bridge.active=true;r.bridge.pending=false;r.bridge.setCue(7,2);
}

async function freshAndCancellation(r,parent){
  r.bridge.skipToReady();const host=prepareHost(r);
  const drive=r.bridge.drive();await flush();assert.equal(r.road.presentationPreparing,true);
  const initial={progress:r.road.state.progress,intro:r.road.introMs,gear:r.road.state.gear};
  r.tap('Enter');r.tap('ArrowUp');r.step(200);
  assert.equal(r.road.state.progress,initial.progress);assert.equal(r.road.introMs,initial.intro);assert.equal(r.road.state.gear,initial.gear);
  assert.equal(r.road.finishIntro(),false);assert.equal(r.roadStarts(),0);
  host.load();await flush();assert.equal(host.calls.warmups,1);assert.equal(r.road.presentationPreparing,true);
  host.textures.resolve({ready:true,fit:true});assert((await drive).ok);
  assert.equal(r.road.presentationPreparing,false);assert.equal(r.road.presentationResult.complete,true);
  assert.equal(r.roadStarts(),0,'Fresh preparation retains the original silent opening');
  const roadResume=r.B.Campaign.readResume();
  assert(r.road.finishIntro());assert.equal(r.roadStarts(),1);

  for(const cancelAt of ['loader','gpu']){
    resetBridgeBoundary(r,parent);const starts=r.roadStarts(),pending=prepareHost(r);
    let settled=false;const entry=r.bridge.drive().then(value=>{settled=true;return value;});await flush();
    if(cancelAt==='gpu'){pending.load();await flush();assert.equal(pending.calls.warmups,1);}
    r.road.dispose();
    await flush();assert.equal(settled,true,'Disposal releases preparation before the loader/GPU host settles');
    assert.equal((await entry).ok,false);
    if(cancelAt==='loader')pending.load();
    pending.textures.resolve({ready:true,fit:true});await flush();
    assert.equal(r.roadStarts(),starts);assert.equal(r.road.active,false);
    assert.equal(r.road.presentationPreparing,false);assert.equal(r.road.gpuLevelSources,null);
    assert.equal(pending.calls.warmups,cancelAt==='gpu'?1:0,'Cancelled loader cannot begin a stale GPU upload handoff');
  }
  return roadResume;
}

async function retryAndInput(r,parent){
  resetBridgeBoundary(r,parent);await r.bridge.drive();assert(r.road.finishIntro());
  const beginRetry=()=>{
    // Explicit failed-result fixture; retry itself restores the real saved marker.
    r.road.status='failed';r.road.state.status='failed';const host=prepareHost(r);
    assert.equal(r.road.retry(),true);return host;
  };
  const before=r.roadStarts(),host=beginRetry();await flush();assert.equal(r.road.presentationPreparing,true);
  const gear=r.road.state.gear;
  r.tap('p');r.pad.buttons[9].pressed=true;r.input();await flush();
  assert.equal(r.w.isPaused,false,'Keyboard and controller cannot pause the loading handoff');
  assert.equal(r.B.RuntimeLifecycle.getState(),'running');assert.equal(r.roadStarts(),before);
  assert.equal(r.B.MusicTransport.sample(r.audio.context.currentTime).running,false);
  r.tap('ArrowUp');r.road.handleActions({move_up:{held:true,pressed:true}});
  assert.equal(r.road.state.gear,gear,'Loading discards gameplay action edges');
  host.load();await flush();host.textures.resolve({ready:true,fit:true});await flush();
  assert.equal(r.road.presentationPreparing,false);assert.equal(r.roadStarts(),before+1);
  r.input();await flush();assert.equal(r.w.isPaused,false,'Held controller Pause cannot leak through the ready transition');
  r.pad.buttons[9].pressed=false;r.input();

  const pausedStarts=r.roadStarts(),paused=beginRetry();await flush();
  r.w.isPaused=true;r.w.gameState.paused=true;
  paused.load();await flush();paused.textures.resolve({ready:true,fit:true});await flush();
  assert.equal(r.roadStarts(),pausedStarts,'A late preparation continuation cannot start music while paused');
  r.w.isPaused=false;r.w.gameState.paused=false;

  const cancelledStarts=r.roadStarts(),cancelled=beginRetry();await flush();r.road.dispose();
  cancelled.load();cancelled.textures.resolve({ready:true,fit:true});await flush();
  assert.equal(r.roadStarts(),cancelledStarts,'Disposed retry cannot restart its old music generation');
}

async function paintFailureCleanup(r,parent){
  resetBridgeBoundary(r,parent);await r.bridge.drive();
  prepareHost(r);r.road.draw=()=>{throw Error('controlled loading painter failure');};
  await assert.rejects(r.road.preparePresentation(),/controlled loading painter failure/);
  assert.equal(r.road.presentationPreparing,false,'Thrown loading paint clears the preparation gate');
}

async function stoppedContinue(r,parent,roadResume){
  await r.B.RuntimeLifecycle.stop('presentation-ready-test');const host=prepareHost(r),starts=r.roadStarts();
  let settled=false;const start=r.B.RuntimeLifecycle.start({resume:roadResume}).then(value=>{settled=true;return value;});
  await flush();assert.equal(r.road.presentationPreparing,true,'Actual Continue reaches the deferred production preparation');
  assert.equal(r.B.RuntimeLifecycle.getState(),'starting');
  assert((await r.B.RuntimeLifecycle.stop('cancel-pending-continue')).ok);
  await flush();assert.equal(settled,true,'Stop releases Continue before asset readiness settles');
  assert.equal((await start).ok,false);assert.equal(r.B.RuntimeLifecycle.getSnapshot().transitionInFlight,false);
  assert.equal(r.B.RuntimeLifecycle.getState(),'idle');assert.equal(r.roadStarts(),starts);
  const next=await r.B.RuntimeLifecycle.start({resume:parent});
  assert(next.ok,'A fresh start cannot remain joined to the cancelled Continue');
  host.load();host.textures.resolve({ready:true,fit:true});await flush();
  assert.equal(host.calls.warmups,0);assert.equal(r.road.active,false);assert.equal(r.roadStarts(),starts);
}

async function level1ResourceReload(r,parent){
  await r.B.RuntimeLifecycle.stop('resource-return');
  const sprites=deferred();let loaded=false,reloads=0,selections=0;
  r.B.StandaloneSprites={isLoaded:()=>loaded};
  r.B.PresentationAssets={selectLevel1Scene:()=>{selections++;return Promise.resolve([]);},releaseScene(){}};
  const priorInit=r.w.initSprites;
  r.w.initSprites=async()=>{reloads++;await sprites.promise;loaded=true;};
  let settled=false;const start=r.B.RuntimeLifecycle.start({resume:parent}).then(value=>{settled=true;return value;});
  await flush();assert.equal(selections,1);assert.equal(reloads,1);
  assert.equal(settled,false);assert.equal(r.B.RuntimeLifecycle.getState(),'starting');
  sprites.resolve();assert((await start).ok);assert.equal(r.B.RuntimeLifecycle.getState(),'running');

  for(const phase of ['images','sprites']){
    await r.B.RuntimeLifecycle.stop('cancel-resource-'+phase);loaded=false;
    const pending=deferred();let reloadCalls=0;
    r.B.PresentationAssets.selectLevel1Scene=()=>phase==='images'?pending.promise:Promise.resolve([]);
    r.w.initSprites=()=>{reloadCalls++;return phase==='sprites'?pending.promise:Promise.resolve();};
    let done=false;const stopped=r.B.RuntimeLifecycle.start({resume:parent}).then(value=>{done=true;return value;});
    await flush();assert.equal(r.B.RuntimeLifecycle.getState(),'starting');
    assert((await r.B.RuntimeLifecycle.stop('cancel-loading')).ok);await flush();
    assert.equal(done,true,'Stop releases the new scene resource wait immediately');
    assert.equal((await stopped).ok,false);assert.equal(r.B.RuntimeLifecycle.getSnapshot().transitionInFlight,false);
    pending.resolve();await flush();
    assert.equal(reloadCalls,phase==='images'?0:1,'Cancelled image scope cannot start stale sprite reload');
    assert.equal(r.B.RuntimeLifecycle.getState(),'idle');
  }
  r.w.initSprites=priorInit;delete r.B.StandaloneSprites;delete r.B.PresentationAssets;
}

(async()=>{const started=performance.now();await loaderReadiness();const r=bridgeRig();await r.boot();
  const parent=r.B.Campaign.readResume(),roadResume=await freshAndCancellation(r,parent);await retryAndInput(r,parent);
  await stoppedContinue(r,parent,roadResume);await level1ResourceReload(r,parent);await paintFailureCleanup(r,parent);
  console.log(JSON.stringify({gate:'cache-road-presentation-ready',passed:true,elapsedMs:performance.now()-started,
    checks:['loaded SVG original readiness with optional bitmap','sole GPU warmup decode ownership','bundled fallback settlement','failed/invalid loader settlement','fresh silent opening',
      'immediate loader/GPU cancellation','stopped Continue releases lifecycle transition','retry delayed music','keyboard/controller loading suppression','held Pause release',
      'paused/disposed retry music guards','Level1 resource reload before start','cancelled image/sprite resource waits','loading paint failure cleanup'],performanceAcceptance:false}));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
