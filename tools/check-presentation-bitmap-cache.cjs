// Loader lifecycle and production Chromium frame/raster comparisons.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const nativeFallbackDiagnostic=process.env.CACHE_NATIVE_FALLBACK_DIAGNOSTIC==='1';
const source=fs.readFileSync(path.resolve(__dirname,'../src/engine/presentation-assets.js'),'utf8');
const inspected=source.replace('  const cache = {};','  const cache = {};window.bitmapReview={entries,cache};');
async function unit(){
  for(const failure of ['none','reject','throw','invalid']){
    const images=[],prepared=[],closed=[];
    class Image {constructor(){this.naturalWidth=1024;this.naturalHeight=512;images.push(this);}}
    const w={Image,BARCODE:{},createImageBitmap(image,...args){
      const options=typeof args[0]==='object'?args[0]:undefined;
      const cw=typeof args[0]==='number'?args[2]:image.naturalWidth;
      const ch=typeof args[0]==='number'?args[3]:image.naturalHeight;
      prepared.push(image);
      if(failure==='throw')throw Error('unsupported');
      if(failure==='reject')return Promise.reject(Error('unsupported'));
      return Promise.resolve({width:failure==='invalid'?0:(options?.resizeWidth||cw),height:options?.resizeHeight||ch,
        image,close(){closed.push(this);}});
    }},context={window:w};
    vm.runInNewContext(inspected,context);
    const {entries,cache}=w.bitmapReview,key='cacheDashDigits',state=cache[key],image=state.image;
    assert.equal(state.ready,false);image.onload();
    assert.equal(state.image.onload,null);assert.equal(state.image.onerror,null);
    const count=images.length;w.BARCODE.PresentationAssets.preload();
    assert.equal(images.length,count,'preload cannot recreate pending or prepared images');
    await new Promise(setImmediate);assert(state.ready,'unsupported preparation retains the original art');
    assert.equal(prepared.filter(value=>value===image).length,1,'a loaded SVG has exactly one preparation attempt');
    assert.equal(!!state.bitmap,failure==='none');assert.equal(closed.length,failure==='invalid'?1:0);
    const calls=[],ctx={globalAlpha:.37,filter:'blur(2.3px)',imageSmoothingEnabled:false,
      save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}};
    for(let frame=0;frame<20;frame++)
      assert(w.BARCODE.PresentationAssets.draw(key,ctx,{x:0,y:0,width:50,height:17,sourceRect:[12,9,31,19]}));
    assert.equal(prepared.length,1,'drawing and paused repeats never prepare or decode another bitmap');
    for(const call of calls){
      assert.equal(call[0],state.bitmap||image);assert.deepEqual(call.slice(1),[12,9,31,19,0,0,50,17]);
    }
    assert.equal(ctx.filter,'blur(2.3px)');assert.equal(ctx.globalAlpha,.37);
    assert.equal(ctx.imageSmoothingEnabled,false,'direct projected draws restore smoothing');
    const raster=cache.cacheBeatHardware;raster.image.onload();
    await new Promise(setImmediate);
    assert(raster.ready);assert.equal(prepared.length,9,'functional atlas prepares each original-size frame once');
    assert.equal(!!raster.nativeFrames,failure==='none');
    const missing=cache.cacheSidewalk;missing.image.onerror();
    assert.equal(missing.image.src,entries.cacheSidewalk.path,'one pinned failure uses the bundled SVG');
    missing.image.onload();await new Promise(setImmediate);
    assert(missing.ready);assert.equal(prepared.length,10);
    w.BARCODE.PresentationAssets.preload();assert.equal(prepared.length,10,'re-entry reuses prepared fallback art');
  }
  console.log('PASS: one SVG preparation per load, warm/pause reuse, exact source rectangles, context preservation, raster routing and graceful bitmap rejection.');
}

async function gpuOriginalReadinessUnit(){
  let finishBitmap,decodeCalls=0,bitmapAttempts=0;
  class Image {
    constructor(){this.naturalWidth=256;this.naturalHeight=256;}
    decode(){decodeCalls++;return Promise.resolve();}
  }
  const w={Image,BARCODE:{},createImageBitmap(){
    bitmapAttempts++;return new Promise(resolve=>{finishBitmap=resolve;});
  }};
  vm.runInNewContext(inspected,{window:w});
  const {entries,cache}=w.bitmapReview,P=w.BARCODE.PresentationAssets,
    key='cacheSidewalk',state=cache[key],image=state.image;
  let readySources;
  const readiness=P.waitForGpuSources([key,key]).then(value=>{readySources=value;});
  image.onload();await new Promise(setImmediate);
  assert(readySources,'a pending SVG derivative cannot hold valid original readiness');
  await readiness;
  assert.equal(state.ready,true);assert.equal(state.bitmap,undefined);
  assert.equal(readySources.length,1);assert.equal(readySources[0].image,image);
  assert.equal(readySources[0].path,entries[key].path);
  assert.equal(bitmapAttempts,1);assert.equal(decodeCalls,0,'GPU warmup remains the sole decode owner');
  const nativeCalls=[],gpuCalls=[],native={imageSmoothingEnabled:true,save(){},restore(){},
    translate(){},scale(){},drawImage(...args){nativeCalls.push(args);}},
    gpu={...native,isGpuScene:true,drawImage(...args){gpuCalls.push(args);}};
  const draw={x:0,y:0,width:64,height:64};
  assert(P.draw(key,native,draw));assert.equal(nativeCalls.at(-1)[0],image,
    'native recovery can draw the valid original while its optional bitmap is pending');
  assert(P.draw(key,gpu,draw));assert.equal(gpuCalls.at(-1)[0],image);
  const bitmap={width:256,height:256};finishBitmap(bitmap);await new Promise(setImmediate);
  assert.equal(state.bitmap,bitmap);assert(P.draw(key,native,draw));assert.equal(nativeCalls.at(-1)[0],bitmap);
  assert(P.draw(key,gpu,draw));assert.equal(gpuCalls.at(-1)[0],image);
  assert.equal(bitmapAttempts,1);assert.equal(decodeCalls,0);

  const fallback=cache.cacheOuterGround;let fallbackResult;
  const fallbackWait=P.waitForGpuSources(['cacheOuterGround']).then(value=>{fallbackResult=value;});
  fallback.image.onerror();await new Promise(setImmediate);
  assert.equal(fallbackResult,undefined,'the first pinned failure still waits for its bundled original');
  assert.equal(fallback.image.src,entries.cacheOuterGround.path);
  fallback.image.onload();await fallbackWait;
  assert.equal(fallbackResult[0].image,fallback.image);assert.equal(fallback.ready,true);

  const invalid=cache.cacheJoinLTurn,failed=cache.cacheJoinRTurn;
  invalid.image.naturalWidth=0;invalid.image.onload();
  const invalidResult=await P.waitForGpuSources(['cacheJoinLTurn']);
  assert.equal(invalidResult.length,0);assert.equal(invalid.ready,false);
  const failedWait=P.waitForGpuSources(['cacheJoinRTurn']);
  failed.image.onerror();failed.image.onerror();
  assert.equal((await failedWait).length,0);assert.equal(failed.ready,false);
  assert.equal(decodeCalls,0);
  console.log('PASS: loaded-original GPU readiness, pending SVG derivative native fallback, sole warmup decode ownership and honest bundled/invalid-source handling.');
}

async function backgroundRasterUnit(){
  // A complete native-only preload still prepares SVG/native assets, but
  // must allocate no unused quarter-size world or decoration derivatives.
  {
    const prepared=[];
    class Image {constructor(){this.naturalWidth=1024;this.naturalHeight=512;}}
    const w={Image,BARCODE:{},createImageBitmap(image,...args){
      prepared.push({image,args});
      const options=typeof args[0]==='object'?args[0]:undefined;
      return Promise.resolve({width:options?.resizeWidth||(typeof args[0]==='number'?args[2]:image.naturalWidth),
        height:options?.resizeHeight||(typeof args[0]==='number'?args[3]:image.naturalHeight)});
    }};
    vm.runInNewContext(inspected,{window:w});
    const {entries,cache}=w.bitmapReview,P=w.BARCODE.PresentationAssets,ctx={};
    for(const state of Object.values(cache))state.image.onload();
    await new Promise(setImmediate);
    assert(prepared.length>0,'native/SVG preparation remains active');
    assert(Object.entries(entries).filter(([,entry])=>entry.path.endsWith('.svg'))
      .every(([key])=>cache[key].bitmap),'loaded SVG originals are still prepared');
    assert.equal(prepared.filter(call=>call.args[0]?.resizeWidth).length,0,
      'native preload performs ZERO quarter-size preparations');
    assert(Object.values(cache).every(state=>!state.rasterBitmap&&!state.rasterPending));
    for(const scale of [1,.5,0,-1,NaN,Infinity])P.setRasterDetail(ctx,scale);
    for(const scale of [1,0,-1,NaN,Infinity])P.setDecorationDetail(ctx,scale);
    P.preload();await new Promise(setImmediate);
    assert.equal(prepared.filter(call=>call.args[0]?.resizeWidth).length,0,
      'native/re-entry/invalid or non-selecting detail hints cannot start quarter preparation');
  }
  for(const failure of ['none','reject','throw','invalid']){
    const prepared=[],closed=[];
    class Image {constructor(){this.naturalWidth=2048;this.naturalHeight=1024;}}
    const w={Image,BARCODE:{},createImageBitmap(image,options){
      prepared.push({image,options});
      if(failure==='throw')throw Error('unsupported');
      if(failure==='reject')return Promise.reject(Error('unsupported'));
      return Promise.resolve({width:failure==='invalid'?0:(options?.resizeWidth||image.naturalWidth),
        height:options?.resizeHeight||image.naturalHeight,close(){closed.push(this);}});
    }};
    vm.runInNewContext(inspected,{window:w});
    const {entries,cache}=w.bitmapReview,assets=w.BARCODE.PresentationAssets;
    const key='cacheDistantCity',state=cache[key],image=state.image;
    image.onload();assert(state.ready,'native background art is available without a derivative');
    await new Promise(setImmediate);
    assert.equal(prepared.length,0,'preload retains the original native background only');
    const calls=[],ctx={imageSmoothingEnabled:true,save(){},restore(){},translate(){},scale(){},
      drawImage(...args){calls.push(args);}};
    const args={x:0,y:0,width:80,height:40,sourceRect:[12,8,100,40]};
    assets.draw(key,ctx,args);
    assert.equal(calls[0][0],image,'native foreground retains the original source');
    assert.equal(assets.setRasterDetail(ctx,.25),1);
    assert.equal(prepared.length,1,'the first selecting legacy request starts one derivative');
    assets.draw(key,ctx,args);
    assert.equal(calls[1][0],image,'a pending or failed derivative uses the original immediately');
    for(let i=0;i<25;i++)assets.setRasterDetail(ctx,.25);
    assert.equal(prepared.length,1,'repeated pending requests cannot duplicate preparation');
    await new Promise(setImmediate);
    assert.equal(!!state.rasterBitmap,failure==='none');assert.equal(state.rasterPending,false);
    assert.equal(closed.length,failure==='invalid'?1:0);
    for(let i=0;i<25;i++)assets.draw(key,ctx,args);
    assert.equal(prepared.length,1,'warm/paused draws never rebuild background derivatives');
    const call=calls[2];
    assert.equal(call[0],state.rasterBitmap||image);
    assert.deepEqual(call.slice(1),failure==='none'?
      [3,2,25,10,0,-40,80,40]:[12,8,100,40,0,-40,80,40]);
    assert.equal(assets.setRasterDetail(ctx,1),.25);
    assets.draw(key,ctx,args);assert.equal(calls.at(-1)[0],image);
    // A different first demand rescans ready entries. Settled successes and
    // reject/throw/invalid failures must never reserve or prepare them again.
    assets.setDecorationDetail(ctx,.5);assets.setRasterDetail(ctx,.25);
    await new Promise(setImmediate);assert.equal(prepared.length,1,
      'ready and failed derivatives are not retried on another demand scan');
    w.BARCODE.PresentationAssets.preload();assert.equal(prepared.length,1);
    const hud=cache.cacheDashBezel;hud.image.onload();await new Promise(setImmediate);
    assert.equal(prepared.length,2,'HUD preparation retains native resolution');
    assert.equal(!!hud.rasterBitmap,false,'HUD never uses a smaller background derivative');
    assert(entries[key].path.endsWith('.webp'));
  }
  // Reservation happens before asynchronous preparation, so simultaneous
  // large sheets cannot exceed the retained 32-megapixel working set.
  const prepared=[];
  class Image {constructor(){this.naturalWidth=8192;this.naturalHeight=4096;}}
  const w={Image,BARCODE:{},createImageBitmap(image,options){
    // Count the quarter pool separately from eligible whole native sources.
    if(!options)return Promise.resolve({width:image.naturalWidth,height:image.naturalHeight});
    prepared.push(options);return Promise.resolve({width:options.resizeWidth,height:options.resizeHeight});
  }};
  vm.runInNewContext(inspected,{window:w});
  const budgetCtx={},budgetAssets=w.BARCODE.PresentationAssets;
  budgetAssets.setRasterDetail(budgetCtx,.25);
  for(const [key,entry]of Object.entries(w.bitmapReview.entries)){
    if(entry.path.startsWith('assets/cache-road/world/')&&entry.path.endsWith('.webp'))
      w.bitmapReview.cache[key].image.onload();
  }
  assert(prepared.length>0&&prepared.length<=16);
  const reservedCount=prepared.length;
  budgetAssets.setDecorationDetail(budgetCtx,.5);
  assert.equal(prepared.length,reservedCount,'pending and budget-rejected entries cannot re-reserve on another scan');
  await new Promise(setImmediate);
  assert(Object.values(w.bitmapReview.cache).reduce((sum,state)=>
    sum+(state.rasterBitmap?state.rasterBitmap.width*state.rasterBitmap.height:0),0)<=32*1024*1024);
  budgetAssets.setRasterDetail(budgetCtx,1);budgetAssets.setRasterDetail(budgetCtx,.25);
  budgetAssets.preload();await new Promise(setImmediate);
  assert.equal(prepared.length,reservedCount,'settled/budget-rejected preparations remain one attempt each');
  // Smaller animated street sheets also need a stable decoded thumbnail.
  // The old one-megapixel cutoff missed signals, lamps and walking atlases.
  const smallPrepared=[];
  class SmallImage{constructor(){this.naturalWidth=1152;this.naturalHeight=576;}}
  const smallWindow={Image:SmallImage,BARCODE:{},createImageBitmap(image,options){
    smallPrepared.push(options);return Promise.resolve({width:options.resizeWidth,height:options.resizeHeight});}};
  vm.runInNewContext(inspected,{window:smallWindow});
  const smallState=smallWindow.bitmapReview.cache.cacheNewCrossingSignalR;
  smallState.image.onload();await new Promise(setImmediate);
  assert.equal(smallPrepared.length,0);
  const smallCalls=[],smallSampling=[],smallCtx={imageSmoothingEnabled:true,save(){},restore(){},translate(){},scale(){},drawImage(...args){smallCalls.push(args);smallSampling.push(this.imageSmoothingEnabled);}};
  const smallAssets=smallWindow.BARCODE.PresentationAssets;
  smallAssets.setRasterDetail(smallCtx,.25);
  await new Promise(setImmediate);
  assert.equal(smallPrepared.length,1);
  assert.equal(smallPrepared[0].resizeWidth,288);
  assert.equal(smallPrepared[0].resizeHeight,144);
  assert.equal(smallPrepared[0].resizeQuality,'high');
  smallAssets.draw('cacheNewCrossingSignalR',smallCtx,{width:80,height:40,frame:2,sourceRect:[12,8,100,40]});
  assert.equal(smallCalls[0][0],smallState.rasterBitmap);
  assert.equal(smallSampling[0],false,'reduced background uses its sampled source directly');
  assert.deepEqual(smallCalls[0].slice(1),[195,2,25,10,-40,-40,80,40]);
  smallAssets.setRasterDetail(smallCtx,1);
  smallAssets.draw('cacheNewCrossingSignalR',smallCtx,{width:80,height:40});
  assert.equal(smallCalls[1][0],smallState.image,'native lighting/signal detail retains the original sheet');
  assert.equal(smallSampling[1],true,'native background keeps its authored sampler');
  const diffuse=smallWindow.bitmapReview.cache.cacheSpeedMist;
  diffuse.image.onload();await new Promise(setImmediate);
  const diffuseCalls=[];
  smallCtx.drawImage=(...args)=>diffuseCalls.push(args);
  assert.equal(smallAssets.setDecorationDetail(smallCtx,1/6),1);
  smallAssets.draw('cacheSpeedMist',smallCtx,{width:80,height:40});
  assert.equal(diffuseCalls[0][0],diffuse.rasterBitmap,'only diffuse decoration can use a smaller source in native world coordinates');
  smallAssets.draw('cacheNewCrossingSignalR',smallCtx,{width:80,height:40});
  assert.equal(diffuseCalls[1][0],smallState.image,'decoration hint cannot coarsen normal foreground sources');
  assert.equal(smallAssets.setDecorationDetail(smallCtx,1),1/6);
  smallAssets.draw('cacheSpeedMist',smallCtx,{width:80,height:40});
  assert.equal(diffuseCalls[2][0],diffuse.image,'full-detail diffuse artwork retains the original source');
  // Request-before-load uses the same owner APIs. Decoration demand must
  // prepare only diffuse images until an actual quarter world request arrives.
  {
    const attempts=[];
    class Image{constructor(){this.naturalWidth=1152;this.naturalHeight=576;}}
    const w={Image,BARCODE:{},createImageBitmap(image,options){attempts.push({image,options});
      return Promise.resolve({width:options.resizeWidth,height:options.resizeHeight});}};
    vm.runInNewContext(inspected,{window:w});
    const {cache}=w.bitmapReview,P=w.BARCODE.PresentationAssets,ctx={imageSmoothingEnabled:true,
      save(){},restore(){},translate(){},scale(){},drawImage(){}};
    const signal=cache.cacheNewCrossingSignalR,mist=cache.cacheSpeedMist,city=cache.cacheDistantCity;
    assert.equal(P.setDecorationDetail(ctx,1/6),1);assert.equal(attempts.length,0);
    signal.image.onload();mist.image.onload();await new Promise(setImmediate);
    assert.equal(attempts.length,1);assert.equal(attempts[0].image,mist.image,
      'an outstanding decoration request prepares only diffuse art on load');
    assert(mist.rasterBitmap);assert(!signal.rasterBitmap);
    P.setRasterDetail(ctx,.5);assert.equal(attempts.length,1,
      'non-quarter world detail cannot request an unused background derivative');
    P.setRasterDetail(ctx,.25);await new Promise(setImmediate);
    assert.equal(attempts.length,2);assert.equal(attempts[1].image,signal.image);
    assert(signal.rasterBitmap,'world demand prepares an already loaded eligible sheet');
    P.setRasterDetail(ctx,1);P.setDecorationDetail(ctx,1);
    city.image.onload();await new Promise(setImmediate);
    assert.equal(attempts.length,3);assert.equal(attempts[2].image,city.image,
      'late loads honor prior legacy demand after context detail is restored');
    assert(city.rasterBitmap);P.setRasterDetail(ctx,.25);P.setDecorationDetail(ctx,.5);P.preload();
    await new Promise(setImmediate);assert.equal(attempts.length,3);
  }
  {
    class Image{constructor(){this.naturalWidth=2048;this.naturalHeight=1024;}}
    const w={Image,BARCODE:{}};vm.runInNewContext(inspected,{window:w});
    const {cache}=w.bitmapReview,P=w.BARCODE.PresentationAssets,city=cache.cacheDistantCity,calls=[];
    const ctx={imageSmoothingEnabled:true,save(){},restore(){},translate(){},scale(){},
      drawImage(...args){calls.push(args);}};
    P.setRasterDetail(ctx,.25);city.image.onload();P.draw('cacheDistantCity',ctx,{width:80,height:40});
    assert.equal(calls[0][0],city.image,'unsupported bitmap preparation preserves original-image rendering');
    assert(!city.rasterBitmap&&!city.rasterPending);
  }
  console.log('PASS: zero native quarter preparation; explicit/pre-load/diffuse-only demand; pending original fallback; unchanged reduced cel/crop/sampling; one attempt across pending/ready/failure/budget states.');
}

async function nativeRasterUnit(){
  for(const failure of ['none','reject','throw','invalid']){
    const prepared=[],closed=[];
    class Image{constructor(){this.naturalWidth=2048;this.naturalHeight=1024;}}
    const w={Image,BARCODE:{},createImageBitmap(image,...crop){
      prepared.push({image,crop});
      if(failure==='throw')throw Error('unsupported');
      if(failure==='reject')return Promise.reject(Error('unsupported'));
      return Promise.resolve({width:failure==='invalid'?0:(crop[2]||image.naturalWidth),
        height:crop[3]||image.naturalHeight,close(){closed.push(this);}});
    }};
    vm.runInNewContext(inspected,{window:w});
    const {cache}=w.bitmapReview,assets=w.BARCODE.PresentationAssets,state=cache.cacheCombatBike;
    state.image.onload();await new Promise(setImmediate);
    assert(state.ready);assert.equal(state.nativePending,false);
    assert.equal(prepared.length,8,'one immutable crop per native cel');
    assert.deepEqual(prepared.map(call=>call.crop),Array.from({length:8},(_,index)=>
      [index%4*512,Math.floor(index/4)*512,512,512]),'native preparation crops exact unscaled cels');
    assert.equal(!!state.nativeFrames,failure==='none');
    assert.equal(closed.length,failure==='invalid'?8:0);
    const calls=[],sampling=[],ctx={imageSmoothingEnabled:false,save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);sampling.push(this.imageSmoothingEnabled);}};
    assets.setRasterDetail(ctx,1/6);
    for(let repeat=0;repeat<25;repeat++)assets.draw('cacheCombatBike',ctx,{width:80,height:40,frame:3,sourceRect:[12,8,100,40]});
    assert.equal(prepared.length,8,'drawing and pause reuse the prepared native frame batch');
    assert(sampling.every(Boolean),'native combat keeps authored smoothing at every background detail');
    for(const call of calls){assert.equal(call[0],state.nativeFrames?.[3]||state.image);
      assert.deepEqual(call.slice(1),failure==='none'?[12,8,100,40,-40,-40,80,40]:[1548,8,100,40,-40,-40,80,40]);}
    assets.draw('cacheCombatBike',ctx,{width:80,height:40,frame:3,sourceRect:[500,0,40,60]});
    assert.equal(calls.at(-1)[0],state.image,'a cross-cel source crop retains the complete original source');
    assert.deepEqual(calls.at(-1).slice(1),[2036,0,40,60,-40,-40,80,40]);
    assets.draw('cacheCombatBike',ctx,{width:80,height:40,frame:3,sourceRect:[8,8,-16,16]});
    assert.equal(calls.at(-1)[0],state.image,'signed source dimensions retain complete-atlas semantics');
    assert.deepEqual(calls.at(-1).slice(1),[1544,8,-16,16,-40,-40,80,40]);
    assets.preload();assert.equal(prepared.length,8);
  }
  // A partial batch failure closes successful cels before releasing pixels.
  const closed=[],attempts=[];
  class Image{constructor(){this.naturalWidth=8192;this.naturalHeight=4096;}}
  const w={Image,BARCODE:{},createImageBitmap(image,...crop){
    attempts.push(crop);
    if(attempts.length===3)return Promise.reject(Error('one missing cel'));
    return Promise.resolve({width:crop[2]||image.naturalWidth,height:crop[3]||image.naturalHeight,close(){closed.push(this);}});}};
  vm.runInNewContext(inspected,{window:w});
  // This fixture tests a complete ordinary atlas after unused priorities have
  // terminally failed; its original exact-cap/atomic-close assertions remain.
  for(const key of ['cacheBlacktop','cacheGreenhouseWorkshop']){
    const image=w.bitmapReview.cache[key].image;image.onerror();image.onerror();
  }
  for(const key of ['cacheCombatBike','cacheCombatHostiles','cacheCar','cacheBeatHardware'])
    w.bitmapReview.cache[key].image.onload();
  await new Promise(setImmediate);
  assert.equal(attempts.length,8,'concurrent atlas reservation blocks other whole batches');
  assert.equal(closed.length,7,'partial failure closes every successful cel');
  assert.equal(!!w.bitmapReview.cache.cacheCombatBike.nativeFrames,false);
  // Start a fresh loaded asset after the failed reservation is released.
  const retry=w.bitmapReview.cache.cacheCarLeft;retry.image.onload();await new Promise(setImmediate);
  assert.equal(attempts.length,16);
  assert.equal(retry.nativeFrames.length,8);
  assert(Object.values(w.bitmapReview.cache).reduce((sum,state)=>sum+
    (state.nativeBitmap?state.nativeBitmap.width*state.nativeBitmap.height:0)+
    (state.nativeFrames||[]).reduce((pixels,bitmap)=>pixels+bitmap.width*bitmap.height,0)+
    (state.nativeWindows||[]).reduce((pixels,item)=>pixels+item.bitmap.width*item.bitmap.height,0),0)<=32*1024*1024);
  console.log('PASS: bounded original-size native frames, unchanged crop/registration, cross-cel fallback, atomic failures and concurrent reservations.');
}

async function nativeMappedDecodeUnit(){
  // Three sources mapped to recurring native decode stalls prepare whole originals;
  // unsupported, pending and budget-limited cases keep the original source.
  const keys=['cacheRepairShop','cacheMarketRFrontGap','cacheStreetBicycleRack'];
  const dims={cacheRepairShop:[1389,1132],cacheMarketRFrontGap:[1942,809],cacheStreetBicycleRack:[1526,1023]};
  const priorityDims={cacheBlacktop:[2172,724],cacheGreenhouseWorkshop:[1536,1024]};
  const reserved=Object.values(priorityDims).reduce((n,[w,h])=>n+w*h,0);
  const pixels=Object.values(dims).reduce((n,[w,h])=>n+w*h,0),cap=32*1024*1024;
  const flush=()=>new Promise(setImmediate);
  function fixture(mode='pending') {
    const images=[],calls=[],closed=[],pending=[];
    class Image {constructor(){this.naturalWidth=1024;this.naturalHeight=512;images.push(this);}}
    const prohibited=()=>{throw Error('new owner/resource operation prohibited');};
    const w={Image,BARCODE:{},requestAnimationFrame:prohibited,setTimeout:prohibited,setInterval:prohibited,
      HTMLCanvasElement:class {constructor(){prohibited();}},OffscreenCanvas:class {constructor(){prohibited();}}};
    if(mode!=='unavailable')w.createImageBitmap=(image,...args)=>{
      calls.push({image,args});
      if(mode==='throw')throw Error('factory unavailable');
      if(mode==='reject')return Promise.reject(Error('factory rejected'));
      const width=typeof args[0]==='number'?args[2]:image.naturalWidth;
      const height=typeof args[0]==='number'?args[3]:image.naturalHeight;
      const bitmap=Object.freeze({width:mode==='invalid'?0:width,height,close(){closed.push(this);}});
      if(mode==='pending')return new Promise(resolve=>pending.push(()=>resolve(bitmap)));
      return Promise.resolve(bitmap);
    };
    const propInspected=inspected.replace('  B.PresentationAssets = {',
      '  window.bitmapReview.nativeUsage=()=>({pixels:nativeRasterPixels,small:nativeSmallPixels});\n  B.PresentationAssets = {');
    assert.notEqual(propInspected,inspected);new vm.Script(propInspected).runInNewContext({window:w});
    const review=w.bitmapReview,P=w.BARCODE.PresentationAssets;
    function load(key,size=dims[key]){
      const state=review.cache[key];[state.image.naturalWidth,state.image.naturalHeight]=size;
      assert.equal(typeof state.image.onload,'function');state.image.onload();
      assert.equal(state.image.onload,null);assert.equal(state.image.onerror,null);return state;
    }
    return {w,P,review,images,calls,closed,pending,load};
  }
  function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
  function context(){
    const fields=['globalAlpha','filter','globalCompositeOperation','imageSmoothingEnabled','shadowBlur','shadowOffsetX','shadowOffsetY','shadowColor'];
    const stack=[],c={calls:[],matrix:[.91,.17,-.13,1.04,31,19],globalAlpha:.47,filter:'blur(2.3px)',
      globalCompositeOperation:'source-over',imageSmoothingEnabled:false,shadowBlur:0,shadowOffsetX:0,shadowOffsetY:0,shadowColor:'transparent'};
    c.snapshot=()=>({matrix:c.matrix.slice(),...Object.fromEntries(fields.map(k=>[k,c[k]]))});
    c.save=()=>stack.push(c.snapshot());c.restore=()=>Object.assign(c,stack.pop());
    c.translate=(x,y)=>{c.matrix=multiply(c.matrix,[1,0,0,1,x,y]);};
    c.scale=(x,y)=>{c.matrix=multiply(c.matrix,[x,0,0,y,0,0]);};
    c.drawImage=(...args)=>c.calls.push({args,at:c.snapshot()});return c;
  }
  function mappingProof(f,key,expectedImage){
    const ctx=context(),before=ctx.snapshot(),[w,h]=dims[key],state=f.review.cache[key];
    assert.equal(f.P.draw(key,ctx,{x:0,y:0,width:123}),true);
    assert.equal(ctx.calls[0].args[0],expectedImage);
    assert.deepEqual(ctx.calls[0].args.slice(1),[0,0,w,h,-61.5,-123*h/w,123,123*h/w]);
    assert.deepEqual(ctx.calls[0].at.matrix,before.matrix);assert.equal(ctx.calls[0].at.imageSmoothingEnabled,true);
    assert.equal(ctx.calls[0].at.globalAlpha,before.globalAlpha);assert.equal(ctx.calls[0].at.filter,before.filter);
    assert.deepEqual(ctx.snapshot(),before,'direct source draws restore caller sampler/transform/paint');
    const opts={x:43,y:91,width:90,height:48,frame:99,flip:true,sourceRect:[7,9,100,83]};
    assert.equal(f.P.draw(key,ctx,opts),true);const translated=ctx.calls[1];
    assert.equal(translated.args[0],expectedImage);
    assert.deepEqual(translated.args.slice(1),[7,9,100,83,-45,-48,90,48]);
    assert.deepEqual(translated.at.matrix,multiply(multiply(before.matrix,[1,0,0,1,43,91]),[-1,0,0,1,0,0]));
    assert.deepEqual(ctx.snapshot(),before,'translated/flipped draw restores caller context');
    assert.equal(translated.at.globalCompositeOperation,before.globalCompositeOperation);
    assert.equal(translated.at.globalAlpha,before.globalAlpha);assert.equal(translated.at.filter,before.filter);
    assert.equal(state.image.naturalWidth,w,'authoritative original remains intact');
    return {rects:ctx.calls.map(c=>c.args.slice(1)),transforms:ctx.calls.map(c=>c.at.matrix)};
  }
  function preparationsProof(f){
    for(const key of keys)f.load(key);
    const selected=f.calls.filter(call=>keys.some(key=>f.review.cache[key].image===call.image));
    assert.equal(selected.length,3,'each of the three mapped original sources prepares once');
    for(const call of selected)assert.equal(call.args.length,0,'whole original default factory: no crop/options/resize/color changes');
    for(const key of keys){
      const entry=f.review.entries[key];assert.deepEqual([entry.columns,entry.rows,entry.frames],[1,1,1]);
      assert.equal(entry.crop,undefined);assert.equal(entry.frameCrops,undefined);assert.equal(entry.smooth,true);
    }
    return selected;
  }
  const pending=fixture();
  assert.equal(pending.review.nativeUsage().pixels,reserved,'unloaded priorities already reserve their exact whole-source pixels');
  for(const key of keys){
    const ctx=context(),before=ctx.snapshot();
    assert.equal(pending.P.draw(key,ctx,{width:123}),false,'not-loaded source retains existing missing-art return');
    assert.equal(ctx.calls.length,0);assert.deepEqual(ctx.snapshot(),before);
  }
  preparationsProof(pending);
  assert.equal(pending.review.nativeUsage().pixels,pixels+reserved);assert.equal(pending.review.nativeUsage().small,0);
  const pendingMappings={};
  for(const key of keys){
    const state=pending.review.cache[key];assert.equal(state.nativePending,true);assert.equal(state.nativeBitmap,undefined);
    pendingMappings[key]=mappingProof(pending,key,state.image);
  }
  const imageCount=pending.images.length,callCount=pending.calls.length;pending.P.preload();
  assert.equal(pending.images.length,imageCount);assert.equal(pending.calls.length,callCount);
  pending.pending.forEach(resolve=>resolve());await flush();
  for(const key of keys){
    const state=pending.review.cache[key];assert.equal(state.nativePending,false);assert(state.nativeBitmap);
    assert.deepEqual(mappingProof(pending,key,state.nativeBitmap),pendingMappings[key],'prepared source preserves exact caller geometry');
    for(let repeat=0;repeat<12;repeat++)mappingProof(pending,key,state.nativeBitmap);
  }
  pending.P.preload();assert.equal(pending.calls.length,3,'draw/cached/restart reuse causes no new factory call');
  for(const key of ['cacheDistantCity','cacheNewWayfindingSign',
    'cacheStreetDeliveryVan','cacheNewBinsRecycling','cacheStreetBenchPlanters','cachePersonStudent'])pending.load(key,[1024,512]);
  await flush();assert.equal(pending.calls.length,3,'city, prior no-gain props and other decoded sources remain excluded');
  assert.equal(pending.review.nativeUsage().pixels,pixels+reserved);
  for(const [key,size]of Object.entries(priorityDims)){
    const state=pending.load(key,size),call=pending.calls.at(-1);
    assert.equal(call.image,state.image);assert.equal(call.args.length,0,'priorities use exactly the whole-original default factory');
    assert(state.ready&&state.nativePending,'priority preparation retains immediate original readiness');
    const ctx=context();pending.P.draw(key,ctx,{width:123,height:61});
    assert.equal(ctx.calls[0].args[0],state.image,'pending priority draws retain the original');
  }
  assert.equal(pending.calls.length,5);assert.equal(pending.review.nativeUsage().pixels,pixels+reserved);
  pending.pending.slice(3).forEach(resolve=>resolve());await flush();
  for(const key of Object.keys(priorityDims)){
    const ctx=context(),state=pending.review.cache[key];pending.P.draw(key,ctx,{width:123,height:61});
    assert.equal(ctx.calls[0].args[0],state.nativeBitmap);assert.equal(state.nativePending,false);
  }
  const warmCount=pending.calls.length;pending.P.preload();assert.equal(pending.calls.length,warmCount);
  for(const mode of ['unavailable','reject','throw','invalid']){
    const f=fixture(mode);for(const key of keys)f.load(key);
    for(const key of keys)mappingProof(f,key,f.review.cache[key].image);
    await flush();assert.equal(f.review.nativeUsage().pixels,reserved,'mapped failures release their allocations and retain unloaded priority slots');
    assert.equal(f.review.nativeUsage().small,0);
    assert.equal(f.closed.length,mode==='invalid'?3:0,'only returned malformed bitmaps close');
    for(const key of keys){const state=f.review.cache[key];assert.equal(state.nativeBitmap,undefined);mappingProof(f,key,state.image);}
    for(const [key,size]of Object.entries(priorityDims))f.load(key,size);
    await flush();assert.equal(f.review.nativeUsage().pixels,0,'failed priorities release their reserved slots exactly once');
    assert.equal(f.closed.length,mode==='invalid'?5:0,'all and only returned malformed backings close');
    const count=f.calls.length,images=f.images.length;f.P.preload();
    assert.equal(f.calls.length,count);assert.equal(f.images.length,images,'failure/re-entry does not recreate images or preparations');
    if(mode!=='unavailable'){
      f.load('cachePursuitRig',[4096,8192]);assert.equal(f.review.nativeUsage().pixels,cap,'released reservation permits a later exact-cap atlas');
      await flush();assert.equal(f.calls.length,count+8);assert.equal(f.review.nativeUsage().pixels,0);
    }

  }
  // Virtual original dimensions fill exactly the ordinary headroom while both
  // real priority slots remain reserved. The 4x2 atlas cels stay integral.
  const blocked=fixture(),availablePixels=cap-reserved;
  assert.equal(availablePixels%8,0);blocked.load('cachePursuitRig',[20,availablePixels/20]);
  assert.equal(blocked.review.nativeUsage().pixels,cap);
  for(const key of keys){blocked.load(key);mappingProof(blocked,key,blocked.review.cache[key].image);}
  await flush();assert.equal(blocked.calls.length,8,'budget decline starts no mapped-source factory call');
  assert.equal(blocked.review.nativeUsage().pixels,cap);assert.equal(blocked.review.nativeUsage().small,0);
  for(const key of keys){assert.equal(blocked.review.cache[key].nativeBitmap,undefined);assert.equal(blocked.review.cache[key].nativePending,undefined);}
  blocked.P.preload();assert.equal(blocked.calls.length,8);
  for(const [key,size]of Object.entries(priorityDims))blocked.load(key,size);
  assert.equal(blocked.calls.length,10,'priority slots remain usable at the combined exact cap');
  assert.equal(blocked.review.nativeUsage().pixels,cap);
  blocked.pending.forEach(resolve=>resolve());await flush();
  for(const key of Object.keys(priorityDims))assert(blocked.review.cache[key].nativeBitmap);
  console.log('PASS: three mapped default whole-source native sources, pending/original fallback, exact mapped/context-preserving draws, exclusion, reuse, failure close/release and shared-cap decline.');
}

async function nativePriorityUnit(){
  const cap=32*1024*1024,reserved=2172*724+1536*1024;
  const flush=()=>new Promise(setImmediate);
  function fixture(mode='pending'){
    const calls=[],closed=[],images=[];
    class Image {constructor(){this.naturalWidth=512;this.naturalHeight=512;images.push(this);}}
    const w={Image,BARCODE:{}};
    function bitmap(call,invalid=false){const frame=typeof call.args[0]==='number';
      const result={width:invalid?0:frame?call.args[2]:call.image.naturalWidth,
        height:frame?call.args[3]:call.image.naturalHeight,source:call.image,
        close(){closed.push(result);}};call.bitmap=result;return result;}
    w.createImageBitmap=(image,...args)=>{
      const call={image,args};calls.push(call);
      assert(!args.some(arg=>arg&&typeof arg==='object'),'no resampling/options factory argument');
      const usage=w.cachePriorityReview.usage();assert(usage.total<=cap&&usage.small<=1536*1024,'both bounds include pending and priority slots');
      if(mode==='throw')throw Error('factory unavailable');
      if(mode==='reject')return Promise.reject(Error('decode rejection'));
      if(mode==='invalid')return Promise.resolve(bitmap(call,true));
      if(mode==='partial')return args[0]===444?Promise.reject(Error('one cell failure')):Promise.resolve(bitmap(call));
      return new Promise((resolve,reject)=>{call.resolve=()=>resolve(bitmap(call));call.reject=reject;});
    };
    let inspected=source.replace('  const cache = {};','  const cache = {};window.cachePriorityReview={entries,cache};');
    inspected=inspected.replace('  B.PresentationAssets = {','  window.cachePriorityReview.usage=()=>({total:nativeRasterPixels,small:nativeSmallPixels,reserved:[...nativePriorityReservations.values()].reduce((sum,n)=>sum+n,0)});\n  B.PresentationAssets = {');
    vm.runInNewContext(inspected,{window:w});
    const review=w.cachePriorityReview,P=w.BARCODE.PresentationAssets;
    const keyFor=image=>Object.keys(review.cache).find(key=>review.cache[key].image===image);
    const load=(key,width,height)=>{const state=review.cache[key];state.image.naturalWidth=width;state.image.naturalHeight=height;state.image.onload();return state;};
    const settle=async()=>{for(const call of calls)if(call.resolve&&!call.settled){call.settled=true;call.resolve();}await flush();};
    const drawn=[];
    const ctx={globalAlpha:.42,filter:'none',imageSmoothingEnabled:false,
      save(){},restore(){},translate(){},scale(){},drawImage(...args){drawn.push(args);}};
    return {w,P,review,calls,closed,images,keyFor,load,settle,drawn,ctx};
  }
  async function priorityOrder(){
    const f=fixture();assert.equal(f.review.usage().total,reserved);
    const ordinary=f.load('cacheStreetBicycleRack',4096,7424);
    assert.equal(f.calls.length,1);
    const denied=f.load('cacheRepairShop',1024,1024);
    assert(denied.ready&&!denied.nativePending);assert.equal(f.calls.length,1,'ordinary copy cannot spend priority reservations');
    const black=f.load('cacheBlacktop',2172,724),green=f.load('cacheGreenhouseWorkshop',1536,1024);
    assert.equal(f.calls.length,3);assert.equal(f.review.usage().reserved,0);
    assert.equal(f.review.usage().total,4096*7424+reserved);assert(f.review.usage().total<=cap);
    for(const key of ['cacheBlacktop','cacheGreenhouseWorkshop','cacheRepairShop']){
      const before=f.calls.length;assert(f.P.draw(key,f.ctx,{width:200,height:80}));
      assert.equal(f.drawn.at(-1)[0],f.review.cache[key].image,'pending/denied source draws the original immediately');
      assert.equal(f.calls.length,before,'draw creates no bitmap');
    }
    assert(black.ready&&green.ready&&ordinary.ready,'pending preparation never blocks source readiness');
    for(const call of f.calls)assert.equal(call.args.length,0,'whole priorities keep the whole-original factory');
    await f.settle();
    const count=f.calls.length,imageCount=f.images.length;
    for(let n=0;n<80;n++)for(const key of ['cacheBlacktop','cacheGreenhouseWorkshop','cacheRepairShop'])f.P.draw(key,f.ctx,{width:130,height:40});
    assert.equal(f.calls.length,count,'warm and repeated draws perform zero factories');
    f.P.preload();assert.equal(f.images.length,imageCount,'preload reuses every loaded/pending Image');
    assert.equal(await f.P.prepareNativeAssets(['cacheBlacktop','cacheGreenhouseWorkshop']),0,'ready priorities cannot re-reserve or reprepare');
    const energy=f.load('cacheBeatEnergy',1500,1086);assert(energy.ready);
    const before=f.calls.length;assert.equal(await f.P.prepareNativeAssets([{key:'cacheBeatEnergy',frames:[4]}]),0);
    await flush();assert.equal(f.calls.length,before,'explicit deferred request obeys the same saturated cap');
    assert.equal(f.review.usage().total,4096*7424+reserved);
  }
  async function deferredAndCells(){
    const f=fixture();
    for(const [key,w,h]of [['cacheBeatEnergy',1500,1086],['cachePhraseStrip',512,400],['cacheConfirmedBar',512,256]])f.load(key,w,h);
    assert.equal(f.calls.length,0,'unused legacy sources allocate no native backing at preload');
    const timing=f.load('cacheBeatTiming',1776,1100);assert(timing.ready);assert.equal(f.calls.length,0,'cell factories are queued outside onload');
    await flush();assert.equal(f.calls.length,3,'only the actual road-ring cells 0/1/2 prefill');
    assert.deepEqual(f.calls.map(c=>Array.from(c.args)),[[0,0,444,550],[444,0,444,550],[888,0,444,550]]);
    const pending=f.calls.length;
    assert.equal(await f.P.prepareNativeAssets([{key:'cacheBeatTiming',frames:[0,1,2]}]),0);
    assert.equal(f.calls.length,pending,'overlapping pending request cannot reserve again');
    f.P.draw('cacheBeatTiming',f.ctx,{frame:2,width:100});assert.equal(f.drawn.at(-1)[0],timing.image);
    await f.settle();
    assert([0,1,2].every(i=>timing.nativeFrames[i]));
    assert([3,4,5,6,7].every(i=>!timing.nativeFrames[i]),'dormant cells retain original source fallback');
    assert([3,4,5,6,7].every(i=>!Object.hasOwn(timing.nativeFrames,i)),
      'unprepared cells are sparse holes, not assigned undefined inventory entries');
    assert.equal(timing.nativeFrames.reduce((pixels,bitmap)=>pixels+bitmap.width*bitmap.height,0),3*444*550);
    assert.equal(f.review.usage().total,reserved+3*444*550);
    const before=f.calls.length;
    const requested=f.P.prepareNativeAssets([{key:'cacheBeatTiming',frames:[3,7]},
      {key:'cacheBeatEnergy',frames:[4,5]},'cachePhraseStrip']);
    assert.equal(f.calls.length,before,'explicit API starts no synchronous factory in its caller');
    assert.equal(await requested,3);await flush();assert.equal(f.calls.length,before+5);
    assert.equal(f.review.usage().small,512*400);
    await f.settle();
    assert(timing.nativeFrames[3]&&timing.nativeFrames[7]&&!timing.nativeFrames[4]);
    const energy=f.review.cache.cacheBeatEnergy;
    assert(energy.nativeFrames[4]&&energy.nativeFrames[5]);
    f.P.draw('cacheBeatEnergy',f.ctx,{frame:4,sourceRect:[2,3,40,20],width:80,height:40});
    assert.equal(f.drawn.at(-1)[0],energy.nativeFrames[4]);
    assert.deepEqual(f.drawn.at(-1).slice(1,5),[2,3,40,20],'prepared-cell registration/source texels are unchanged');
    f.P.draw('cacheBeatTiming',f.ctx,{frame:4,width:90});
    assert.equal(f.drawn.at(-1)[0],timing.image,'unrequested cell selects original atlas with original registration');
    const count=f.calls.length,total=f.review.usage().total;
    assert.equal(await f.P.prepareNativeAssets([{key:'cacheBeatTiming',frames:[3,7]},
      {key:'cacheBeatEnergy',frames:[4,5]},'cachePhraseStrip']),0);
    for(const requests of [null,[{key:'cacheBeatTiming',frames:[]}],[{key:'cacheBeatTiming',frames:[8]}],
      [{key:'cacheBeatTiming',frames:[-1]}],['noSuchSource']])assert.equal(await f.P.prepareNativeAssets(requests),0);
    await flush();assert.equal(f.calls.length,count);assert.equal(f.review.usage().total,total,'duplicate/invalid requests preserve accounting');
  }
  async function failures(){
    for(const mode of ['throw','reject','invalid']){
      const f=fixture(mode),s=f.load('cacheBlacktop',2172,724);
      assert(s.ready);await flush();assert(!s.nativePending&&!s.nativeBitmap);
      assert.equal(f.review.usage().total,1536*1024,'failure releases only its own reservation');
      assert.equal(f.closed.length,mode==='invalid'?1:0,'invalid returned backing is closed');
      const count=f.calls.length;
      f.P.draw('cacheBlacktop',f.ctx,{width:90,height:20});assert.equal(f.drawn.at(-1)[0],s.image);
      assert.equal(await f.P.prepareNativeAssets(['cacheBlacktop']),0,'a failed whole-source attempt is not repeated');
      assert.equal(f.calls.length,count);
      f.load('cacheGreenhouseWorkshop',1536,1024);await flush();
      assert.equal(f.review.usage().total,0,'both unsuccessful priorities release their slots exactly once');
    }
    const f=fixture('partial');f.load('cacheBeatTiming',1776,1100);await flush();
    assert.equal(f.calls.length,3);assert.equal(f.closed.length,2,'failed cell batch closes all fulfilled backing siblings');
    assert(!f.review.cache.cacheBeatTiming.nativeFrames);
    assert.equal(f.review.usage().total,reserved,'failed cell batch releases its complete reserved allocation');
    assert.equal(await f.P.prepareNativeAssets([{key:'cacheBeatTiming',frames:[0,1,2]}]),0);
    const unsupported=fixture();delete unsupported.w.createImageBitmap;
    unsupported.load('cacheBlacktop',2172,724);unsupported.load('cacheGreenhouseWorkshop',1536,1024);
    assert.equal(unsupported.calls.length,0);assert.equal(unsupported.review.usage().total,0);
  }
  async function imageLifecycle(){
    const f=fixture(),black=f.review.cache.cacheBlacktop;
    black.image.onerror();assert.equal(black.image.src,f.review.entries.cacheBlacktop.path,'remote failure retains bundled source fallback');
    assert.equal(f.review.usage().reserved,reserved,'first fallback attempt keeps its priority slot');
    black.image.onerror();assert.equal(black.image.onload,null);assert.equal(black.image.onerror,null);
    assert.equal(f.review.usage().reserved,1536*1024,'terminal failure releases the stranded priority slot');
    const green=f.load('cacheGreenhouseWorkshop',0,0);assert(!green.ready,'invalid Image readiness follows original loader');
    assert.equal(f.review.usage().total,0,'invalid original source releases its unneeded priority slot');
    const imageCount=f.images.length;f.P.preload();assert.equal(f.images.length,imageCount);
  }
  await priorityOrder();console.log('PASS: priority load order, saturated cap, original/pending fallback, whole-source factories and warm reuse.');
  await deferredAndCells();console.log('PASS: unused eager suppression, exact Timing cells, explicit queued demand, registration and request guards.');
  await failures();console.log('PASS: priority factory failures, invalid backing closure, atomic cell rollback and no duplicate attempts.');
  await imageLifecycle();console.log('PASS: priority bundled fallback, terminal/invalid-image reservation cleanup and preload ownership.');
}

async function nativeSmallUnit(){
  for(const failure of ['none','reject','throw','invalid']){
    const prepared=[],closed=[];
    class Image{constructor(){this.naturalWidth=400;this.naturalHeight=290;}}
    const w={Image,BARCODE:{},createImageBitmap(image,...args){
      prepared.push({image,args});
      if(failure==='throw')throw Error('unsupported');
      if(failure==='reject')return Promise.reject(Error('unsupported'));
      return Promise.resolve({width:failure==='invalid'?0:args[2]||400,height:args[3]||290,close(){closed.push(this);}});
    }};
    vm.runInNewContext(inspected,{window:w});
    const keys=['cacheBrakeReflection','cacheDamagedExhaust','cachePhraseStrip','cacheConfirmedBar','cachePulseBurst'];
    const {cache}=w.bitmapReview,P=w.BARCODE.PresentationAssets;
    for(const key of keys)cache[key].image.onload();
    await P.prepareNativeAssets(['cachePhraseStrip','cacheConfirmedBar']);
    await new Promise(setImmediate);
    assert.equal(prepared.length,5);
    assert.deepEqual(prepared.find(call=>call.image===cache.cacheBrakeReflection.image).args,[0,0,194,290]);
    assert(prepared.filter(call=>call.image!==cache.cacheBrakeReflection.image).every(call=>call.args.length===0),
      'remaining small native sources are unscaled complete originals');
    assert.equal(closed.length,failure==='invalid'?5:0);
    for(const key of keys){
      const state=cache[key];assert(state.ready);assert.equal(state.nativePending,false);
      assert.equal(!!(state.nativeBitmap||state.nativeWindows),failure==='none');
    }
    const calls=[],ctx={globalAlpha:.37,filter:'hue-rotate(315deg)',imageSmoothingEnabled:true,
      save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}};
    P.setRasterDetail(ctx,1/6);
    for(let i=0;i<10;i++)P.draw('cacheBrakeReflection',ctx,
      {x:0,y:0,width:50,height:75,sourceRect:[0,0,192,290]});
    assert(calls.every(call=>call[0]===(cache.cacheBrakeReflection.nativeWindows?.[0].bitmap||cache.cacheBrakeReflection.image)));
    assert(calls.every(call=>JSON.stringify(call.slice(1))===JSON.stringify([0,0,192,290,-25,0,50,75])));
    assert.equal(ctx.filter,'hue-rotate(315deg)');assert.equal(ctx.globalAlpha,.37);
    assert(Object.values(cache).reduce((sum,state)=>sum+
      (state.nativeBitmap?state.nativeBitmap.width*state.nativeBitmap.height:0)+
      (state.nativeWindows||[]).reduce((n,item)=>n+item.bitmap.width*item.bitmap.height,0),0)<=1536*1024);
  }
  // Concurrent pending sources count before any preparation resolves. Fill
  // the small pool exactly, then confirm the next eligible crop falls back.
  {
    const prepared=[],pending=[];
    class Image{constructor(){this.naturalWidth=512;this.naturalHeight=512;}}
    const w={Image,BARCODE:{},createImageBitmap(image){prepared.push(image);
      return new Promise(resolve=>pending.push(()=>resolve({width:512,height:512})));}};
    vm.runInNewContext(inspected,{window:w});
    const {cache}=w.bitmapReview,P=w.BARCODE.PresentationAssets;
    const keys=['cacheDamagedExhaust','cachePhraseStrip','cacheConfirmedBar','cachePulsePad','cachePulseStrip','cachePulseBurst'];
    for(const key of keys)cache[key].image.onload();
    await P.prepareNativeAssets(['cachePhraseStrip','cacheConfirmedBar']);
    cache.cacheBrakeReflection.image.onload();
    assert.equal(prepared.length,6,'pending reservations cannot overbook the small pool');
    assert(!cache.cacheBrakeReflection.nativePending,'a crop beyond the pool retains original-image fallback');
    pending.forEach(resolve=>resolve());
    await new Promise(setImmediate);
    assert(keys.every(key=>cache[key].nativeBitmap));
    assert.equal(keys.reduce((sum,key)=>sum+cache[key].nativeBitmap.width*cache[key].nativeBitmap.height,0),1536*1024);
    assert(!cache.cacheBrakeReflection.nativeWindows);
  }
  console.log('PASS: bounded original-size small native sources/crops, concurrent reservations, unchanged filtered placement, reuse and failure fallback.');
}

async function nativeWindowUnit(){
  for(const failure of ['none','reject','throw','invalid']){
    const prepared=[],closed=[];
    class Image{constructor(){this.naturalWidth=2039;this.naturalHeight=771;}}
    const w={Image,BARCODE:{},createImageBitmap(image,...crop){
      prepared.push(crop);
      if(failure==='throw')throw Error('unsupported');
      if(failure==='reject')return Promise.reject(Error('unsupported'));
      return Promise.resolve({width:failure==='invalid'?0:crop[2],height:crop[3],close(){closed.push(this);}});
    }};
    vm.runInNewContext(inspected,{window:w});
    const {cache}=w.bitmapReview,P=w.BARCODE.PresentationAssets;
    cache.cacheMirror.image.naturalWidth=1536;cache.cacheMirror.image.naturalHeight=1024;
    cache.cacheBrakeReflection.image.naturalWidth=400;cache.cacheBrakeReflection.image.naturalHeight=290;
    cache.cacheDashBezel.image.onload();cache.cacheMirror.image.onload();cache.cacheBrakeReflection.image.onload();
    await new Promise(setImmediate);
    assert.equal(prepared.length,8);
    assert.deepEqual(prepared[0],[10,118,2022,516]);
    assert.deepEqual(prepared.slice(1,7),Array.from({length:6},(_,index)=>[index%3*512,Math.floor(index/3)*512+148,452,189]));
    assert.deepEqual(prepared[7],[0,0,194,290]);
    assert.equal(closed.length,failure==='invalid'?8:0);
    for(const key of ['cacheDashBezel','cacheMirror','cacheBrakeReflection']){
      assert(cache[key].ready);assert.equal(cache[key].nativePending,false);
      assert.equal(!!cache[key].nativeWindows,failure==='none');
    }
    const calls=[],ctx={imageSmoothingEnabled:true,filter:'none',save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}};
    P.setRasterDetail(ctx,1/6);
    P.draw('cacheDashBezel',ctx,{width:605,height:153,sourceRect:[12,120,2018,512]});
    assert.equal(calls.at(-1)[0],cache.cacheDashBezel.nativeWindows?.[0].bitmap||cache.cacheDashBezel.image);
    assert.deepEqual(calls.at(-1).slice(1),failure==='none'?[2,2,2018,512,0,0,605,153]:[12,120,2018,512,0,0,605,153]);
    P.draw('cacheMirror',ctx,{width:280,height:111,frame:4,sourceRect:[0,150,450,185]});
    assert.equal(calls.at(-1)[0],cache.cacheMirror.nativeWindows?.[4].bitmap||cache.cacheMirror.image);
    assert.deepEqual(calls.at(-1).slice(1),failure==='none'?[0,2,450,185,-140,-55.5,280,111]:[512,662,450,185,-140,-55.5,280,111]);
    P.draw('cacheMirror',ctx,{width:280,height:111,frame:4,sourceRect:[0,0,450,450]});
    assert.equal(calls.at(-1)[0],cache.cacheMirror.image,'outside-window crops retain the complete original atlas');
    assert.deepEqual(calls.at(-1).slice(1),[512,512,450,450,-140,-55.5,280,111]);
    P.draw('cacheBrakeReflection',ctx,{width:50,height:75,sourceRect:[0,0,192,290]});
    assert.equal(calls.at(-1)[0],cache.cacheBrakeReflection.nativeWindows?.[0].bitmap||cache.cacheBrakeReflection.image);
    assert.deepEqual(calls.at(-1).slice(1),[0,0,192,290,-25,0,50,75]);
    P.draw('cacheBrakeReflection',ctx,{width:50,height:75,sourceRect:[0,0,400,290]});
    assert.equal(calls.at(-1)[0],cache.cacheBrakeReflection.image,'unused reflection columns retain original fallback');
    assert.deepEqual(calls.at(-1).slice(1),[0,0,400,290,-25,0,50,75]);
    assert.equal(ctx.filter,'none');assert.equal(ctx.imageSmoothingEnabled,true);
    const before=prepared.length;P.preload();
    for(let i=0;i<10;i++)P.draw('cacheMirror',ctx,{width:280,height:111,frame:4,sourceRect:[0,150,450,185]});
    assert.equal(prepared.length,before,'drawing and pause reuse immutable native windows');
    assert(Object.values(cache).reduce((sum,state)=>sum+(state.nativeWindows||[]).reduce((n,item)=>n+item.bitmap.width*item.bitmap.height,0),0)<=32*1024*1024);
  }
  console.log('PASS: original-size bezel/face/brake windows, native crop/cel registration, complete-atlas fallback, atomic failures and reuse.');
}

async function nativeTintUnit(){
  for(const failure of ['none','fetch-reject','fetch-status','decode','bitmap-reject','bitmap-invalid','unsupported']){
    const images=[],prepared=[],blobs=[],revoked=[],closed=[],fetched=[];
    class Canvas{}
    class Image {
      constructor(){this.naturalWidth=400;this.naturalHeight=290;images.push(this);}
      get src(){return this.url;}
      set src(value){
        this.url=value;
        if(value.startsWith('blob:'))Promise.resolve().then(()=>
          failure==='decode'?this.onerror?.():this.onload?.());
      }
    }
    class Blob{constructor(parts,options){this.text=parts.join('');this.type=options.type;blobs.push(this);}}
    const w={Image,Blob,HTMLCanvasElement:Canvas,BARCODE:{},
      btoa:value=>{assert.equal(value.length,3);return 'AQID';},
      URL:{createObjectURL:()=> 'blob:reflection-tint',revokeObjectURL:url=>revoked.push(url)},
      fetch:url=>{fetched.push(url);
        if(failure==='fetch-reject')return Promise.reject(Error('network'));
        return Promise.resolve({ok:failure!=='fetch-status',arrayBuffer:()=>Promise.resolve(new Uint8Array([1,2,3]).buffer)});
      },
      createImageBitmap(image,...args){
        const tinted=image.src.startsWith('blob:');prepared.push({image,args,tinted});
        if(tinted&&failure==='bitmap-reject')return Promise.reject(Error('unsupported SVG'));
        return Promise.resolve({width:tinted&&failure==='bitmap-invalid'?0:args[2]||image.naturalWidth,
          height:args[3]||image.naturalHeight,close(){closed.push(this);}});
      }};
    if(failure==='unsupported')delete w.fetch;
    vm.runInNewContext(inspected,{window:w});
    const {cache}=w.bitmapReview,P=w.BARCODE.PresentationAssets,state=cache.cacheBrakeReflection;
    state.image.onload();
    await new Promise(setImmediate);
    const success=failure==='none',ctx={canvas:new Canvas(),filter:'none',globalAlpha:.37,
      shadowBlur:0,shadowOffsetX:0,shadowOffsetY:0,shadowColor:'rgba(0, 0, 0, 0)',
      imageSmoothingEnabled:true,save(){},restore(){},translate(){},scale(){},drawImage(...args){this.calls.push(args);},calls:[]};
    assert.equal(P.brakeTintReady(ctx),success);
    assert.equal(!!state.brakeTintPending,false);
    assert.equal(!!state.brakeTintBitmap,success);
    assert.equal(fetched.length,failure==='unsupported'?0:1);
    if(fetched.length)assert.equal(fetched[0],state.image.src);
    const hadBlob=!['fetch-reject','fetch-status','unsupported'].includes(failure);
    assert.equal(blobs.length,hadBlob?1:0);assert.equal(revoked.length,hadBlob?1:0);
    if(hadBlob){
      assert(blobs[0].text.includes('color-interpolation-filters="sRGB"'));
      assert(blobs[0].text.includes('type="hueRotate" values="315"'));
      assert(blobs[0].text.includes('width="400" height="290"'));
      assert(blobs[0].text.includes('data:image/webp;base64,AQID'));
      assert.equal(blobs[0].type,'image/svg+xml');
      const image=images.find(image=>image.src?.startsWith('blob:'));
      assert.equal(image.onload,null);assert.equal(image.onerror,null);
    }
    assert.equal(closed.length,failure==='bitmap-invalid'?1:0);
    P.setRasterDetail(ctx,1/6);
    P.draw('cacheBrakeReflection',ctx,{width:50,height:75,sourceRect:[0,0,192,290],tone:'hue315'});
    assert.equal(ctx.calls.at(-1)[0],state.brakeTintBitmap||state.nativeWindows[0].bitmap);
    assert.deepEqual(ctx.calls.at(-1).slice(1),[0,0,192,290,-25,0,50,75]);
    assert.equal(ctx.filter,'none');assert.equal(ctx.globalAlpha,.37);
    P.draw('cacheBrakeReflection',ctx,{width:50,height:75,sourceRect:[0,0,400,290],tone:'hue315'});
    assert.equal(ctx.calls.at(-1)[0],state.image,'outside-window tint requests keep the complete original source');
    for(const fields of [{canvas:{}},{shadowBlur:2},{shadowOffsetX:1},{shadowOffsetY:1},{shadowColor:'#ff0000'}])
      assert.equal(P.brakeTintReady({...ctx,...fields}),false,'native/embedded and shadow callers retain the original filter');
    const priorFetch=fetched.length,priorPrepared=prepared.length;P.preload();
    for(let i=0;i<10;i++)P.draw('cacheBrakeReflection',ctx,{sourceRect:[0,0,192,290],tone:'hue315'});
    assert.equal(fetched.length,priorFetch);assert.equal(prepared.length,priorPrepared);
    // Five full sources leave room for the last probe only when failed tint
    // preparation released its reservation. A ready tint keeps its pixels.
    for(const key of ['cacheDamagedExhaust','cachePhraseStrip','cacheConfirmedBar','cachePulsePad','cachePulseStrip']){
      cache[key].image.naturalWidth=512;cache[key].image.naturalHeight=512;cache[key].image.onload();
    }
    await P.prepareNativeAssets(['cachePhraseStrip','cacheConfirmedBar']);
    cache.cachePulseBurst.image.naturalWidth=512;cache.cachePulseBurst.image.naturalHeight=362;
    cache.cachePulseBurst.image.onload();
    await new Promise(setImmediate);
    assert.equal(!!cache.cachePulseBurst.nativeBitmap,!success,'ready/pending tint pixels share the small pool and failed preparations release them');
    const pixels=Object.values(cache).reduce((sum,item)=>sum+
      (item.nativeBitmap?item.nativeBitmap.width*item.nativeBitmap.height:0)+
      (item.nativeWindows||[]).reduce((n,part)=>n+part.bitmap.width*part.bitmap.height,0)+
      (item.brakeTintBitmap?item.brakeTintBitmap.width*item.brakeTintBitmap.height:0),0);
    assert(pixels<=1536*1024);
  }
  console.log('PASS: one bounded original-texel sRGB tint preparation, window routing, native/shadow fallback, URL cleanup, reservation release and draw/pause reuse.');
}

function budgetUnit(){
  const w={BARCODE:{}};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../src/game/cache-road-render-budget.js'),'utf8'),{window:w});
  const owner=w.BARCODE.CacheRoadRenderBudget,budget=owner.create();
  assert.equal(budget.scale,1,'each new run begins at full detail');
  for(let i=0;i<700;i++)owner.observe(budget,90);
  assert.equal(budget.scale,1,'sustained expensive draws must retain native artwork detail');
  assert.equal(budget.lastCostMs,90,'expensive draws remain visible in timing diagnostics');
  assert.equal(budget.slowFrames,700);
  const frozen=JSON.stringify(budget);
  for(let i=0;i<700;i++)owner.observe(budget,1,{paused:true});
  assert.equal(JSON.stringify(budget),frozen,'paused repeated paint cannot change quality');
  for(const cost of [NaN,Infinity,-1])owner.observe(budget,cost);
  assert.equal(JSON.stringify(budget),frozen,'invalid clocks cannot alter a budget');
  for(let i=0;i<600;i++)owner.observe(budget,1);
  assert.equal(budget.scale,1,'spare capacity never needs to restore lost artwork detail');
  assert.equal(budget.fastFrames,600);
  assert.equal(budget.slowFrames,0);
  for(let i=0;i<30;i++)owner.observe(budget,200);
  assert.equal(budget.scale,1,'even very slow draws cannot substitute an enlarged low-resolution world');
  const delayed=owner.create();
  for(let i=0;i<700;i++)owner.observe(delayed,12,{frameIntervalMs:34.1});
  assert.equal(delayed.scale,1,'sustained delayed display frames must retain native detail');
  assert.equal(delayed.lastCostMs,34.1,'display delay is observed even when draw submission is cheap');
  const delayedFrozen=JSON.stringify(delayed);
  owner.observe(delayed,12,{paused:true,frameIntervalMs:60});
  assert.equal(JSON.stringify(delayed),delayedFrozen,'paused display delay cannot reduce detail');
  for(const interval of [1000/30,NaN,Infinity,-1,200,250]){
    const ignored=owner.create();
    for(let i=0;i<3;i++)owner.observe(ignored,12,{frameIntervalMs:interval});
    assert.equal(ignored.scale,1,'healthy, invalid and background-gap intervals retain detail');
    assert.equal(ignored.lastCostMs,12,'invalid or background-gap display intervals cannot inflate diagnostics');
  }
  const fresh=owner.create();assert.equal(fresh.scale,1);
  assert.equal(fresh.lastCostMs,0,'a fresh run has independent timing diagnostics');
  assert.equal(budget.lastCostMs,200);
  console.log('PASS: native world detail through heavy draws and delayed display frames, queued cost diagnostics, pause freeze, clock fallback and fresh-run independence.');
}

function mirrorSourceUnit(){
  const road=fs.readFileSync(path.resolve(__dirname,'../src/game/cache-road-proof.js'),'utf8');
  const callStart=road.indexOf('      const nativeMirror=budgetEligible'),
    callEnd=road.indexOf('      ctx.fillStyle',callStart);
  assert(callStart>=0&&callEnd>callStart,'production mirror invocation is available');
  for(const failure of ['none','budget','context','canvas','pause','intro','fade']){
    class HTMLCanvasElement{}
    const ctx={canvas:failure==='canvas'?{}:new HTMLCanvasElement()},pixelBudget={};
    let invocation;
    vm.runInNewContext('function invoke(){'+road.slice(callStart,callEnd)+'};invoke.call(runtime);',{
      window:{HTMLCanvasElement},ctx,frameContext:failure==='context'?{}:ctx,
      budgetEligible:failure!=='budget',runtime:{status:failure==='pause'?'paused':'playing',renderBudget:pixelBudget},
      intro:failure==='intro'?{}:null,cinema:failure==='fade'?{hudAlpha:.5}:null,
      s:{},section:0,reduced:false,heightSample:()=>0,combatPose:null,crosswalkPose:null,
      drawRearview(...args){invocation=args;}
    });
    assert.equal(invocation[7],false,'production native reflection retains the original curved glass mask');
    assert.equal(invocation[8],failure==='none','opaque native transport remains independent of world downsampling');
    assert.equal(invocation[9],failure==='budget'?null:pixelBudget);
  }
  const start=road.indexOf('  function drawRearview('),end=road.indexOf('  // Every supplied stem',start);
  assert(start>=0&&end>start,'production mirror painter is available');
  for(const boundedClip of [false,true])for(const failure of [false,true]){
    let detail=.25,reflectionCalls=0,faceCalls=0;
    const pixelBudget={},ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},
      {get:(target,key)=>key in target?target[key]:()=>{}});
    const B={PresentationAssets:{
      setRasterDetail(context,value){assert.equal(context,ctx);const before=detail;detail=value;return before;},
      draw(key){assert.equal(key,'cacheMirror');faceCalls++;return true;}
    }},w={};
    vm.runInNewContext(road.slice(start,end)+';window.testMirror=drawRearview;',{
      window:w,B,LANDSCAPE:{height:()=>24},mirrorExpression:()=>0,mirrorOutline(){},
      drawRearRoad(...args){
        reflectionCalls++;assert.equal(detail,1,'clipped native reflections use original-size source artwork');
        assert.equal(args.at(-2),true,'native opaque backdrop optimization remains independent of detail');
        assert.equal(args.at(-1),pixelBudget);
        if(failure)throw Error('mirror draw failed');
      }
    });
    const draw=()=>w.testMirror(ctx,{},'#8fe3db',false,undefined,null,null,boundedClip,true,pixelBudget);
    if(failure)assert.throws(draw,/mirror draw failed/);else draw();
    assert.equal(reflectionCalls,1);assert.equal(faceCalls,failure?0:1);
    assert.equal(detail,.25,'reflection painting restores the caller hint even after failure');
  }
  console.log('PASS: production curved mirror glass, native opaque transport eligibility, original-size reflection sources and caller-hint restoration after failure.');
}

function worldCopyUnit(){
  const road=fs.readFileSync(path.resolve(__dirname,'../src/game/cache-road-proof.js'),'utf8');
  const start=road.indexOf('  function copySampledWorldPixels('),end=road.indexOf('  function clipLightBlend(',start);
  assert(start>=0&&end>start,'exercise the production sampled-world transport helper');
  const code=road.slice(start,end)+'\nwindow.copySampledWorldPixels=copySampledWorldPixels;window.copyOpaqueCanvasPixels=copyOpaqueCanvasPixels;';
  for(const failure of ['none','construct','read','draw','p3','alpha','native','missing','fractional','oversize','reference']){
    const calls=[],closed=[],data=new Uint8ClampedArray(320*180*4).fill(255),budget={};
    if(failure==='alpha')data[3]=254;
    class Canvas {constructor(){this.width=1920;this.height=1080;}}
    class VideoFrame {
      constructor(pixels,options){
        calls.push(['construct',pixels,options]);
        if(failure==='construct')throw Error('unsupported frame');
        this.pixels=pixels;
      }
      close(){closed.push(this);}
    }
    const w={HTMLCanvasElement:Canvas,VideoFrame:failure==='missing'?undefined:VideoFrame};
    vm.runInNewContext(code,{window:w});
    const canvas=failure==='native'?{}:new Canvas(),ctx={canvas,globalAlpha:.37,filter:'none',
      getContextAttributes(){return {colorSpace:failure==='p3'?'display-p3':'srgb'};},
      getImageData(...args){
        calls.push(['read',...args]);if(failure==='read')throw Error('readback unavailable');
        return {width:320,height:180,colorSpace:'srgb',data};
      },
      drawImage(...args){
        calls.push(['draw',...args]);if(failure==='draw'&&args[0]!==canvas)throw Error('unsupported source');
      }};
    const width=failure==='fractional'?320.5:failure==='oversize'?481:320;
    const used=w.copySampledWorldPixels(ctx,width,180,budget,failure!=='reference');
    assert.equal(used,failure==='none');assert.equal(ctx.globalAlpha,.37);assert.equal(ctx.filter,'none');
    const drawn=calls.filter(call=>call[0]==='draw'),last=drawn.at(-1);
    assert.deepEqual(last.slice(2),[0,0,width,180,0,0,1920,1080]);
    assert.equal(last[1]===canvas,failure!=='none');
    assert.equal(closed.length,failure==='none'||failure==='draw'?1:0,'every constructed source is closed once');
    if(failure==='none'){
      const created=calls.find(call=>call[0]==='construct');assert.equal(created[1],data);
      assert.deepEqual(JSON.parse(JSON.stringify(created[2])),{format:'RGBA',codedWidth:320,codedHeight:180,timestamp:0,
        colorSpace:{primaries:'bt709',transfer:'iec61966-2-1',matrix:'rgb',fullRange:true}});
      assert.deepEqual(JSON.parse(JSON.stringify(calls.find(call=>call[0]==='read').slice(1))),[0,0,320,180,{colorSpace:'srgb'}]);
    }
    if(['construct','read','draw'].includes(failure)){
      assert.equal(budget.pixelCopyUnavailable,true);
      const count=calls.filter(call=>call[0]==='read').length;
      w.copySampledWorldPixels(ctx,320,180,budget);
      assert.equal(calls.filter(call=>call[0]==='read').length,count,'an unavailable API is attempted once per presentation budget');
      assert.equal(calls.at(-1)[1],canvas);
    }else assert.equal(budget.pixelCopyUnavailable,undefined);
    if(['p3','native','missing','fractional','oversize','reference'].includes(failure))
      assert.equal(calls.filter(call=>call[0]==='read').length,0,'ineligible callers do not read pixels');
  }
  {
    class Canvas {constructor(){this.width=1920;this.height=1080;}}
    const calls=[],closed=[],data=new Uint8ClampedArray(714*141*4).fill(255);
    class VideoFrame {constructor(pixels,options){calls.push(['construct',pixels,options]);}close(){closed.push(this);}}
    const w={HTMLCanvasElement:Canvas,VideoFrame};vm.runInNewContext(code,{window:w});
    const ctx={canvas:new Canvas(),filter:'blur(2.3px)',globalAlpha:1,
      getContextAttributes(){return {colorSpace:'srgb'};},
      getImageData(...args){calls.push(['read',...args]);return {width:714,height:141,colorSpace:'srgb',data};},
      drawImage(...args){calls.push(['draw',...args]);}};
    assert(w.copyOpaqueCanvasPixels(ctx,626,0,714,141,626,0,714,141,{}));
    assert.deepEqual(JSON.parse(JSON.stringify(calls.find(call=>call[0]==='read').slice(1))),[626,0,714,141,{colorSpace:'srgb'}]);
    assert.deepEqual(calls.at(-1).slice(2),[0,0,714,141,626,0,714,141]);
    assert.equal(ctx.filter,'blur(2.3px)');assert.equal(ctx.globalAlpha,1);assert.equal(closed.length,1);
  }
  console.log('PASS: bounded opaque sRGB production transport, exact source/destination arguments, context preservation, source cleanup, original reference and unsupported/native/P3/alpha fallback.');
}

const frameReviewCount=screens=>screens.length/3;
async function browser(){
  const http=require('node:http'),os=require('node:os'),{spawn}=require('node:child_process'),{once}=require('node:events');
  const root=path.resolve(__dirname,'..'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'barcode-bitmap-'));
  const {prepared,stage,modules}=require('./render-cache-beat-visual-system.cjs');
  const definitions={window:{BARCODE:{}}};vm.runInNewContext(inspected,definitions);
  const entries=definitions.window.bitmapReview.entries;
  const scenes=['Approach','Ready-ONE','Perfect-Impact','Good','Miss','Reduced','Focused-Turn'].map(name=>{
    const r=prepared({manifest:source,entries,images:{}});
    return {name,state:JSON.parse(JSON.stringify(stage(r,name))),chapter:r.road.chapter};
  });
  const production=['src/engine/music-profiles.js','src/engine/music-transport.js',
    'src/engine/cache-road-proof-profile.js','src/game/cache-road-landscape.js',
    'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
    'src/game/cache-road-pursuit.js','src/game/cache-road-guidance.js',...modules,
    'src/game/cache-road-render-budget.js','src/game/cache-road-proof.js'];
  const chromePath=process.env.CHROME_BIN||'/usr/bin/google-chrome';
  let child,socket;
  const fixture=`<!doctype html><canvas id="gameCanvas" width="1920" height="1080"></canvas><script>
    window.bitmapAttempts=[];window.contextCalls=0;
    const originalContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(...args){
      if(++contextCalls>1)throw Error('extra display Canvas context');return originalContext.apply(this,args);
    };
    const descriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
    Object.defineProperty(HTMLImageElement.prototype,'src',{get:descriptor.get,set(value){
      if(value.startsWith('https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/'))
        value='/'+value.split('/').slice(6).join('/');
      descriptor.set.call(this,value);
    }});
    const bitmap=window.createImageBitmap.bind(window);
    window.createImageBitmap=(image,...args)=>{bitmapAttempts.push(image.src);return bitmap(image,...args);};
    window.BARCODE={Campaign:{register(){},syncTitleButton(){}},GamepadUI:{connected:false},
      CacheChapter:{recordIds:['r1','r2','r3','r4']},Preferences:{values:{reducedMotion:false,flashes:true}}};
    window.audioSystem={context:{currentTime:0,state:'running'},playCombatCue(){}};
    window.frameReviewScenes=${JSON.stringify(scenes)};
  </script><script src="/registry.js"></script>
  ${production.map(file=>'<script src="/'+file+'"></script>').join('')}`;
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}
    if(pathname==='/registry.js'){res.setHeader('Content-Type','text/javascript');res.end(inspected);return;}
    if(pathname==='/src/game/cache-road-proof.js') {
      let road=fs.readFileSync(path.join(root,'src/game/cache-road-proof.js'),'utf8');
      const copyMarker='  function clipLightBlend(ctx,bounds) {';
      assert(road.includes(copyMarker),'exercise the actual sampled-world helper in Chromium');
      road=road.replace(copyMarker,'  window.bitmapReview.copySampledWorldPixels=copySampledWorldPixels;window.bitmapReview.copyOpaqueCanvasPixels=copyOpaqueCanvasPixels;\n'+copyMarker);
      assert(road.includes('const compositeBlur=ctx.canvas?.width>0'));
      road=road.replace('const compositeBlur=ctx.canvas?.width>0',
        "const compositeBlur=window.bitmapReview.mode!=='vector'&&ctx.canvas?.width>0");
      const budgetMarker='const budgetEligible=!this.gpuRecoveryPainting&&!!budgetOwner';
      assert(road.includes(budgetMarker),'preserve the production native-recovery budget guard');
      road=road.replace(budgetMarker,
        "const budgetEligible=window.bitmapReview.mode==='adaptive'&&!window.bitmapReview.fullQuality&&!this.gpuRecoveryPainting&&!!budgetOwner");
      // Keep the actual production sampler in every representation. The old
      // adaptive-only low-quality mutation compared unlike painting and failed
      // baseline fidelity as well as the current build; it cannot judge caches.
      for(const [marker,label]of [["      const live=this.state,cinema=this.cinematicPose();","begin"],["      // One opaque landscape continues beneath every roadside location.","sky"],["      // Neighboring strips sample adjacent rows of one world-fixed material.","city"],["      const groundCrest=Array.from({length:65},(_,i)=>[i*30,cityCrestY(i*30)]);","world-preparation"],["      // Road shoulders and the paint share a single curved road projection.","terrain"],["      const roadFog=ctx.createLinearGradient(0,horizon,0,horizon+170);","asphalt"],["      // Phrase paint is a road marking, not a second translucent lane overlay.","street-objects"],["      const boss=s.combat?combatPose.boss:B.CacheRoadPursuit?.boss?.(s.pursuit,{progress});","beat-and-traffic"],["      ctx.restore(); // world camera","vehicles-and-fx"],["      // A compact VFD instrument cluster leaves the original mirror and","atmosphere"],["    const far = profile(progress-reach);","mirror-start"],["    if(compositeBlur) {","mirror-scene"],["    // Only reflected scenery gets softened.","mirror-blur"],["      drawRearview(ctx, s,","dashboard"]]) {
        assert(road.includes(marker),'phase marker '+label);
        road=road.replace(marker,"window.canvasCostMark?.("+JSON.stringify(label)+");\n"+marker);
      }
      res.setHeader('Content-Type','text/javascript');res.end(road);return;
    }
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.ttf')?'font/ttf':pathname.endsWith('.svg')?'image/svg+xml':pathname.endsWith('.webp')?'image/webp':'image/png');
    fs.createReadStream(file).pipe(res);
  });
  try{
    server.listen(0,'127.0.0.1');await once(server,'listening');
    const origin='http://127.0.0.1:'+server.address().port;
    child=spawn(chromePath,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run',
      '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
    const debug=await new Promise((resolve,reject)=>{
      let output='';const timeout=setTimeout(()=>reject(Error('Chromium startup timed out')),30000);
      child.stderr.on('data',chunk=>{output+=chunk;const m=output.match(/DevTools listening on (ws:\/\/\S+)/);
        if(m){clearTimeout(timeout);resolve(m[1]);}});child.once('error',reject);
    });
    const target=await(await fetch(new URL(debug).origin.replace('ws:','http:')+'/json/new',{method:'PUT'})).json();
    socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{
      socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    let serial=0;const pending=new Map();
    socket.addEventListener('message',event=>{const value=JSON.parse(event.data),p=pending.get(value.id);
      if(value.method==='Runtime.consoleAPICalled')for(const argument of value.params.args||[])
        if(typeof argument.value==='string'&&argument.value.startsWith('FRAME_COST '))console.log(argument.value);
      if(p){pending.delete(value.id);clearTimeout(p.timeout);value.error?p.reject(Error(JSON.stringify(value.error))):p.resolve(value.result);}});
    const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;
      const timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},180000);
      pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});
    await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:origin});
    const result=await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
      const started=performance.now();
      while(!window.bitmapReview||Object.values(bitmapReview.cache).some(state=>!state.ready||state.rasterPending||state.nativePending||state.brakeTintPending)){
        if(performance.now()-started>45000)throw Error('assets did not prepare');await new Promise(r=>setTimeout(r,25));
      }
      const {entries,cache}=bitmapReview,svg=Object.keys(entries).filter(key=>entries[key].path.endsWith('.svg'));
      if(svg.some(key=>!(cache[key].bitmap instanceof ImageBitmap)))throw Error('SVG bitmap preparation failed');
      if(bitmapAttempts.filter(src=>src.endsWith('.svg')).length!==svg.length)throw Error('SVG preparations were duplicated');
      const c=document.getElementById('gameCanvas'),ctx=c.getContext('2d',{willReadFrequently:false}),P=BARCODE.PresentationAssets;
      const beforeSVG=bitmapAttempts.filter(src=>src.endsWith('.svg')).length,pixels=[];
      for(let repeat=0;repeat<2;repeat++){
        ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.translate(42,57);ctx.rotate(.013);ctx.globalAlpha=.7;
        P.draw('cacheOuterGround',ctx,{x:0,y:0,width:1530,height:850});
        ctx.filter='blur(2.3px)';P.draw('cacheSidewalk',ctx,{x:170,y:550,width:250,height:87});
        ctx.filter='none';
        for(let digit=0;digit<10;digit++)P.draw('cacheDashDigits',ctx,{x:30+digit*58,y:80,width:36,height:55,
          sourceRect:[digit*64,0,64,100]});
        ctx.restore();pixels.push(Array.from(ctx.getImageData(0,0,c.width,c.height).data));
      }
      if(pixels[0].some((value,i)=>value!==pixels[1][i]))throw Error('paused pixels changed');
      for(let frame=0;frame<120;frame++)
        P.draw('cacheDashDigits',ctx,{x:10,y:10,width:36,height:55,sourceRect:[0,0,64,100]});
      P.preload();if(bitmapAttempts.filter(src=>src.endsWith('.svg')).length!==beforeSVG)throw Error('warm SVG draws or preload rebuilt the cache');
      if(contextCalls!==1)throw Error('display Canvas ownership changed');
      const font=await new FontFace('Oxanium',
        'url(/assets/studies/visual-overhaul/references/fonts/Oxanium.ttf)').load();
      document.fonts.add(font);window.renderer={canvas:c,ctx};
      const road=BARCODE.CacheRoadProof;
      if(!road)throw Error('Production road renderer did not load');
      road.active=true;road.status='playing';road.audioDegraded=false;
      road.selectMusicProfile();BARCODE.MusicTransport.start({sourceAnchorAudioSec:0,sourceOffsetTrackSec:0});
      const bitmaps=Object.fromEntries(svg.map(key=>[key,cache[key].bitmap]));
       const nativeBitmaps=Object.fromEntries(Object.entries(cache).filter(([,state])=>state.nativeBitmap||state.nativeFrames||state.nativeWindows||state.brakeTintBitmap)
         .map(([key,state])=>[key,{bitmap:state.nativeBitmap,frames:state.nativeFrames,windows:state.nativeWindows,tint:state.brakeTintBitmap}]));
      const median=values=>{const v=values.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)];};
      const rows=[],assetDraw=P.draw,bitmapFactory=window.createImageBitmap;
      const originalDrawImage=ctx.drawImage;let reflectionBlurs=0;
      const inspectDrawImage=function(source,...args){
        if((source===c||typeof VideoFrame==='function'&&source instanceof VideoFrame)&&this.filter==='blur(2.3px)')reflectionBlurs++;
        return originalDrawImage.call(this,source,...args);
      };
      const framePixels=new Map(),pixelComparisons=[],qualityComparisons=[],screens=[];
      let measuredGroups={};
      const inspectAssetDraw=(key,context,args)=>{
        const group=context.filter==='none'?'plain':'filtered';
        const began=performance.now(),ok=assetDraw(key,context,args),ms=performance.now()-began;
        measuredGroups[group]=(measuredGroups[group]||0)+ms;
        measuredGroups[key]=(measuredGroups[key]||0)+ms;
        return ok;
      };
      // Draw identical moving production states in both representations.
      // A one-pixel readback flushes queued raster work into elapsed time.
      // These are controlled rendering diagnostics, not device gameplay FPS.
      for(const scene of frameReviewScenes)for(const mode of ['vector','bitmap','adaptive']) {
        bitmapReview.mode=mode;
        window.createImageBitmap=mode==='vector'?undefined:bitmapFactory;
        for(const key of svg)cache[key].bitmap=mode==='vector'?undefined:bitmaps[key];
         for(const [key,value]of Object.entries(nativeBitmaps)){
           cache[key].nativeBitmap=mode==='adaptive'?value.bitmap:undefined;
           cache[key].nativeFrames=mode==='adaptive'?value.frames:undefined;
           cache[key].nativeWindows=mode==='adaptive'?value.windows:undefined;
           cache[key].brakeTintBitmap=mode==='adaptive'?value.tint:undefined;
         }
        road.chapter=structuredClone(scene.chapter);road.state=structuredClone(scene.state);
        BARCODE.Preferences.values.reducedMotion=scene.name==='Reduced';
        // Up to nine detail transitions require three slow draws apiece.
        // Retain startup costs, then measure a full settled 16-frame window.
        // Fidelity repaint happens after that window so it cannot perturb it.
        const samples=[],startupFrames=[],expectedState=structuredClone(scene.state);
        for(let frame=0;frame<46;frame++) {
          ctx.reset();ctx.imageSmoothingQuality='high';measuredGroups={};reflectionBlurs=0;
          const began=performance.now();
          road.draw(ctx);const submitted=performance.now();ctx.getImageData(0,0,1,1);
          if(mode==='adaptive'&&road.renderBudget.drawnScale!==1)throw Error('optimized production frames silently reduced native world detail');
          const elapsed=performance.now()-began;
          if(frame===45)console.log('FRAME_COST '+JSON.stringify({name:scene.name,mode,
            submitMs:submitted-began,flushMs:performance.now()-submitted}));
          if(ctx.imageSmoothingQuality!=='high')throw Error('road draw leaked its sampling quality');
          if(P.setRasterDetail(ctx,1)!==1)throw Error('road draw leaked its background raster hint');
          if(P.setDecorationDetail(ctx,1)!==1)throw Error('road draw leaked its decoration hint');
          if(frame>=30)samples.push(elapsed);
          else if(mode==='adaptive')startupFrames.push({frame,ms:elapsed,
            worldScale:road.renderBudget.drawnScale,worldPixelCopyUsed:!!road.renderBudget.worldPixelCopyUsed});
          if(frame===45) {
            const stateBefore=JSON.stringify(road.state);
            const displayedPixels=ctx.getImageData(0,0,c.width,c.height).data;
            screens.push({name:scene.name,mode,webp:c.toDataURL('image/webp',.9).split(',')[1]});
            let pixels=displayedPixels;
            // Inspect reflection/resources separately from production timing.
            // Per-draw wrappers allocate and query the native context hundreds
            // of times; that diagnostic work must not enter the frame budget.
            ctx.drawImage=inspectDrawImage;P.draw=inspectAssetDraw;
            reflectionBlurs=0;measuredGroups={};ctx.reset();ctx.imageSmoothingQuality='high';
            road.draw(ctx);ctx.getImageData(0,0,1,1);
            if(reflectionBlurs!==(mode==='vector'?0:1))throw Error('reflection blur was repeated or lost');
            if(JSON.stringify(road.state)!==stateBefore||ctx.imageSmoothingQuality!=='high')
              throw Error('instrumented inspection leaked gameplay or sampling state');
            console.log('FRAME_COST '+JSON.stringify({name:scene.name,mode,diagnosticOnly:true,
              groups:Object.fromEntries(Object.entries(measuredGroups).filter(([key,value])=>value>1))}));
            ctx.drawImage=originalDrawImage;P.draw=assetDraw;
            if(mode==='adaptive') {
              const reference=framePixels.get(scene.name+'-bitmap');
              let difference=0,hudDifference=0;
              for(let i=0;i<displayedPixels.length;i++)if(i%4!==3) {
                const delta=Math.abs(displayedPixels[i]-reference[i]);difference+=delta;
                if(i<1920*164*4)hudDifference+=delta;
              }
              qualityComparisons.push({name:scene.name,worldScale:road.renderBudget.drawnScale,
                meanRGB:difference/(1920*1080*3),nativeHUDMeanRGB:hudDifference/(1920*164*3)});
              // Fidelity is judged on the actual displayed native painting.
              // A separate full-quality repaint cannot conceal lost detail.
            }
            if(mode==='vector')framePixels.set(scene.name+'-vector',pixels);
            else {
              const previous=framePixels.get(scene.name+'-'+(mode==='adaptive'?'bitmap':'vector'));let total=0,max=0;
              for(let i=0;i<pixels.length;i++)if(i%4!==3) {
                const difference=Math.abs(pixels[i]-previous[i]);total+=difference;max=Math.max(max,difference);
              }
              pixelComparisons.push({name:scene.name,mode,meanRGB:total/(c.width*c.height*3),maxChannelDifference:max});
              if(mode==='bitmap')framePixels.set(scene.name+'-bitmap',pixels);
              else {framePixels.delete(scene.name+'-bitmap');framePixels.delete(scene.name+'-vector');}
            }
          }
          road.state.progress+=road.state.speed/60;road.state.elapsedMs+=1000/60;
          road.state.musicBeatFloat+=128/60/60;
          road.state.musicBar=Math.floor(road.state.musicBeatFloat/4);
          expectedState.progress+=expectedState.speed/60;expectedState.elapsedMs+=1000/60;
          expectedState.musicBeatFloat+=128/60/60;
          expectedState.musicBar=Math.floor(expectedState.musicBeatFloat/4);
          await new Promise(resolve=>setTimeout(resolve,0));
        }
        if(JSON.stringify(road.state)!==JSON.stringify(expectedState))
          throw Error('The measured moving window changed gameplay beyond fixture movement');
        const sorted=samples.slice().sort((a,b)=>a-b);
        rows.push({name:scene.name,mode,medianMs:median(samples),
          p95Ms:sorted[Math.ceil(sorted.length*.95)-1],frames:samples.length,
          warmupFrames:30,startupFrames:mode==='adaptive'?startupFrames:undefined,worldScale:mode==='adaptive'?road.renderBudget.drawnScale:1,includesRasterFlush:true,worldPixelCopyUsed:!!road.renderBudget?.worldPixelCopyUsed});
        console.log('FRAME_COST '+JSON.stringify(rows.at(-1)));
      }
      for(const key of svg)cache[key].bitmap=bitmaps[key];
       for(const [key,value]of Object.entries(nativeBitmaps)){
          cache[key].nativeBitmap=value.bitmap;cache[key].nativeFrames=value.frames;cache[key].nativeWindows=value.windows;cache[key].brakeTintBitmap=value.tint;
        }
      window.createImageBitmap=bitmapFactory;bitmapReview.mode='adaptive';
      const frameComparisons=frameReviewScenes.map(({name})=>{
        const previous=rows.find(row=>row.name===name&&row.mode==='bitmap');
        const after=rows.find(row=>row.name===name&&row.mode==='adaptive');
        return {name,beforeMs:previous.medianMs,afterMs:after.medianMs,p95Ms:after.p95Ms,
          ratio:after.medianMs/previous.medianMs};
      });
      const diagnostics=[];
      const skin=BARCODE.CacheRoadBeatSurface,scene=frameReviewScenes.find(s=>s.name==='Ready-ONE');
      for(const disableBeatArt of [false,true]) {
        BARCODE.CacheRoadBeatSurface=disableBeatArt?undefined:skin;
        road.chapter=structuredClone(scene.chapter);road.state=structuredClone(scene.state);
        const samples=[];
        for(let frame=0;frame<8;frame++) {
          ctx.reset();measuredGroups={};const started=performance.now();road.draw(ctx);
          const submitMs=performance.now()-started;ctx.getImageData(0,0,1,1);
          if(frame>1)samples.push({totalMs:performance.now()-started,submitMs,groups:{...measuredGroups}});
          road.state.progress+=road.state.speed/60;road.state.elapsedMs+=1000/60;
          await new Promise(resolve=>setTimeout(resolve,0));
        }
        const last=samples.at(-1);
        diagnostics.push({name:'isolated-beat-art',disableBeatArt,medianMs:median(samples.map(s=>s.totalMs)),
          medianSubmitMs:median(samples.map(s=>s.submitMs)),
          groups:Object.fromEntries(Object.entries(last.groups).filter(([key,value])=>value>1))});
        console.log('FRAME_COST '+JSON.stringify(diagnostics.at(-1)));
      }
      BARCODE.CacheRoadBeatSurface=skin;
      // Paused repeat paint retains both the chosen detail and exact pixels.
      window.isPaused=true;ctx.reset();road.draw(ctx);
      const pausedScale=road.renderBudget.scale,pausedImage=ctx.getImageData(0,0,c.width,c.height).data;
      for(let repeat=0;repeat<5;repeat++) {
        ctx.reset();road.draw(ctx);
        const current=ctx.getImageData(0,0,c.width,c.height).data;
        if(current.some((value,index)=>value!==pausedImage[index])||road.renderBudget.scale!==pausedScale)
          throw Error('paused world sampling or pixels changed');
      }
      window.isPaused=false;
      // Flush between production phases only in this diagnostic. Queued
      // Canvas work can otherwise be charged to a later, unrelated image.
      const phaseRows=[],methods=['fill','stroke','fillRect','strokeRect','fillText','strokeText','drawImage'];
      const originals=Object.fromEntries(methods.map(name=>[name,ctx[name]]));
      let methodCosts={},phaseStart=0;
      for(const name of methods)ctx[name]=function(...args){
        const start=performance.now(),result=originals[name].apply(this,args),cost=performance.now()-start;
        const group=name+(this.globalCompositeOperation==='screen'?':screen':'')+
          (name==='drawImage'&&args[0]===c?':self':'');
        const value=methodCosts[group]||(methodCosts[group]={calls:0,ms:0});
        value.calls++;value.ms+=cost;return result;
      };
      const costMark=phase=>{
        const submitted=performance.now();ctx.getImageData(0,0,1,1);
        const now=performance.now();
        if(phase!=='begin')phaseRows.push({phase,submitMs:submitted-phaseStart,
          flushMs:now-submitted,totalMs:now-phaseStart,methods:methodCosts});
        methodCosts={};phaseStart=now;
      };
      road.chapter=structuredClone(scene.chapter);road.state=structuredClone(scene.state);
      BARCODE.Preferences.values.reducedMotion=false;
      for(let warm=0;warm<26;warm++){
        ctx.reset();road.draw(ctx);ctx.getImageData(0,0,1,1);
        road.state.progress+=road.state.speed/60;road.state.elapsedMs+=1000/60;
        road.state.musicBeatFloat+=128/60/60;road.state.musicBar=Math.floor(road.state.musicBeatFloat/4);
      }
      window.canvasCostMark=costMark;
      for(let frame=0;frame<3;frame++) {
        ctx.reset();ctx.getImageData(0,0,1,1);
        road.draw(ctx);window.canvasCostMark('hud-complete');
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      window.canvasCostMark=undefined;
      for(const name of methods)ctx[name]=originals[name];
      console.log('FRAME_COST '+JSON.stringify({name:'production-phase-costs',phaseRows}));
      // Hold the late moving scene and isolate decorative animated atlases.
      // These diagnostic suppressions never run in production or gate fidelity.
      const animatedAtlasDimensions=Object.fromEntries(['cacheFly1','cacheFly3','cacheWindWhoosh'].map(key=>
        [key,{width:cache[key].image.naturalWidth,height:cache[key].image.naturalHeight}]));
      for(const omitted of [[],['cacheFly1','cacheFly3'],['cacheWindWhoosh']]) {
        const skipped=new Set(omitted);P.draw=(key,context,args)=>skipped.has(key)||assetDraw(key,context,args);
        road.chapter=structuredClone(scene.chapter);road.state=structuredClone(scene.state);
        BARCODE.Preferences.values.reducedMotion=false;
        const costs=[];
        for(let frame=0;frame<40;frame++) {
          ctx.reset();ctx.imageSmoothingQuality='high';const begin=performance.now();road.draw(ctx);
          ctx.getImageData(0,0,1,1);if(frame>=24)costs.push(performance.now()-begin);
          road.state.progress+=road.state.speed/60;road.state.elapsedMs+=1000/60;
          road.state.musicBeatFloat+=128/60/60;road.state.musicBar=Math.floor(road.state.musicBeatFloat/4);
          await new Promise(resolve=>setTimeout(resolve,0));
        }
        console.log('FRAME_COST '+JSON.stringify({name:'animated-atlas-isolation',omitted,
          medianMs:median(costs),worldScale:road.renderBudget.drawnScale,animatedAtlasDimensions}));
      }
      P.draw=assetDraw;
      const viewportChecks=[];ctx.drawImage=inspectDrawImage;
      for(const [width,height,scale]of [[960,540,.5],[2400,1350,1.25]]) {
        c.width=width;c.height=height;ctx.setTransform(scale,0,0,scale,7,11);
        reflectionBlurs=0;const before=ctx.getTransform(),stateBefore=JSON.stringify(road.state);
        road.draw(ctx);const after=ctx.getTransform();
        if(reflectionBlurs!==1||JSON.stringify(road.state)!==stateBefore)
          throw Error('scaled viewport lost reflection blur or changed gameplay');
        if(['a','b','c','d','e','f'].some(key=>before[key]!==after[key]))
          throw Error('reflection blur changed the caller viewport transform');
        viewportChecks.push({width,height,scale,reflectionBlurs,transformPreserved:true});
      }
      c.width=1920;c.height=1080;ctx.drawImage=originalDrawImage;
      const aggregateRatio=frameComparisons.reduce((sum,row)=>sum+row.afterMs,0)/
        frameComparisons.reduce((sum,row)=>sum+row.beforeMs,0);
      console.log('FRAME_COST '+JSON.stringify({aggregateRatio,frameComparisons}));
      const absoluteFrameBudgetMs=1000/30;
      const performancePass=frameComparisons.every(row=>row.ratio<=1.1&&row.afterMs<=absoluteFrameBudgetMs)&&aggregateRatio<.75;
      if(contextCalls!==1||bitmapAttempts.filter(src=>src.endsWith('.svg')).length!==beforeSVG)throw Error('Measured road draws rebuilt shared resources');
      // Outside every timing window, compare the actual prepared source
      // with the original live filter on transparent pixels, using this same
      // display context. Native texels must keep exact alpha; scaled sampling
      // allows one alpha level of renderer rounding and no missing painting.
      const tintSourceChecks=[];
      for(const [width,height,quality]of [[192,290,'low'],[50,75,'low'],[50,75,'high']]){
        ctx.reset();ctx.imageSmoothingQuality=quality;
        if(!P.brakeTintReady(ctx))throw Error('native browser did not prepare the reflection tint');
        const pixelWidth=Math.ceil(width),pixelHeight=Math.ceil(height),options={
          x:width/2,y:0,width,height,sourceRect:[0,0,192,290]};
        ctx.filter='hue-rotate(315deg)';P.draw('cacheBrakeReflection',ctx,options);
        const original=ctx.getImageData(0,0,pixelWidth,pixelHeight).data;
        ctx.clearRect(0,0,c.width,c.height);ctx.filter='none';
        P.draw('cacheBrakeReflection',ctx,{...options,tone:'hue315'});
        const prepared=ctx.getImageData(0,0,pixelWidth,pixelHeight).data;
        let rgb=0,alpha=0,maxAlpha=0,painted=0;
        for(let index=0;index<original.length;index++){
          const delta=Math.abs(original[index]-prepared[index]);
          if(index%4===3){alpha+=delta;maxAlpha=Math.max(maxAlpha,delta);if(prepared[index])painted++;}
          else rgb+=delta;
        }
        const pixels=pixelWidth*pixelHeight,row={width,height,quality,meanRGB:rgb/(pixels*3),
          meanAlpha:alpha/pixels,maxAlphaDifference:maxAlpha,paintedPixels:painted};
        if(!painted||row.meanRGB>=1||row.meanAlpha>=.05||maxAlpha>(width===192?0:1))
          throw Error('prepared tint changed the original source painting: '+JSON.stringify(row));
        tintSourceChecks.push(row);
      }
      const worldSourceChecks=[];
      for(const scenario of ['opaque','alpha','clipped-caller']){
        const paint=()=>{
          ctx.reset();
          const gradient=ctx.createLinearGradient(0,0,320,180);
          gradient.addColorStop(0,'#9b4f74');gradient.addColorStop(.37,'#1d7d99');gradient.addColorStop(1,'#dc805b');
          ctx.fillStyle=gradient;ctx.fillRect(0,0,320,180);
          ctx.fillStyle='#081321';ctx.fillRect(17,13,31,22);
          ctx.fillStyle='#fae986';ctx.fillRect(93,41,54,73);
          if(scenario==='alpha')ctx.clearRect(5,5,13,11);
          ctx.globalCompositeOperation='copy';ctx.imageSmoothingEnabled=false;
          if(scenario==='clipped-caller'){
            ctx.beginPath();ctx.rect(110,50,1400,900);ctx.clip();ctx.globalAlpha=.37;
          }
        };
        paint();bitmapReview.copySampledWorldPixels(ctx,320,180,{},false);
        const original=ctx.getImageData(0,0,c.width,c.height).data;
        paint();const budget={},used=bitmapReview.copySampledWorldPixels(ctx,320,180,budget);
        const candidate=ctx.getImageData(0,0,c.width,c.height).data;
        let changed=0,max=0;
        for(let index=0;index<original.length;index++){
          const delta=Math.abs(original[index]-candidate[index]);if(delta)changed++;max=Math.max(max,delta);
        }
        const row={scenario,used,changedComponents:changed,maxChannelDifference:max};
        if(changed||used!==(scenario!=='alpha')||budget.pixelCopyUnavailable)
          throw Error('sampled-world transport changed source/caller pixels: '+JSON.stringify(row));
        worldSourceChecks.push(row);
      }
      const mirrorSourceChecks=[];
      for(const scenario of ['opaque','alpha']){
        const paint=()=>{
          ctx.reset();
          const gradient=ctx.createLinearGradient(0,0,c.width,c.height);
          gradient.addColorStop(0,'#1d7d99');gradient.addColorStop(.42,'#9b4f74');gradient.addColorStop(1,'#dc805b');
          ctx.fillStyle=gradient;ctx.fillRect(0,0,c.width,c.height);
          ctx.fillStyle='#fae986';ctx.fillRect(720,45,63,34);
          if(scenario==='alpha')ctx.clearRect(650,30,7,13);
          ctx.beginPath();ctx.rect(638,12,690,117);ctx.clip();
          ctx.globalCompositeOperation='source-over';ctx.filter='blur(2.3px)';
        };
        paint();bitmapReview.copyOpaqueCanvasPixels(ctx,626,0,714,141,626,0,714,141,{},false);
        const original=ctx.getImageData(0,0,c.width,c.height).data;
        paint();const budget={},used=bitmapReview.copyOpaqueCanvasPixels(ctx,626,0,714,141,626,0,714,141,budget);
        const candidate=ctx.getImageData(0,0,c.width,c.height).data;
        let rgb=0,maxAlpha=0;
        for(let index=0;index<original.length;index++){
          const delta=Math.abs(original[index]-candidate[index]);
          if(index%4===3)maxAlpha=Math.max(maxAlpha,delta);else rgb+=delta;
        }
        const row={scenario,used,meanRGB:rgb/(c.width*c.height*3),maxAlphaDifference:maxAlpha};
        if(row.meanRGB>=.1||maxAlpha||used!==(scenario==='opaque')||budget.pixelCopyUnavailable)
          throw Error('cropped mirror source changed original blur/caller pixels: '+JSON.stringify(row));
        mirrorSourceChecks.push(row);
      }
      ctx.reset();
      return {passed:true,performancePass,aggregateRatio,frameComparisons,frameSamples:rows,pixelComparisons,screens,viewportChecks,tintSourceChecks,worldSourceChecks,mirrorSourceChecks,
        preparedSVGs:svg.length,qualityComparisons,absoluteFrameBudgetMs,reflectionBlursPerFrame:1,warmDraws:120,pausedPixels:true,displayContexts:contextCalls,
        preservedMirrorFilter:'blur(2.3px)',limitation:'Real Chromium loader/cache validation; owner device FPS remains unmeasured.'};
    })()`});
    if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
    assert(result.result.value?.passed);
    const {screens,...report}=result.result.value;
    report.nativeFallbackDiagnostic=nativeFallbackDiagnostic;
    report.performanceAssertionsEnforced=!nativeFallbackDiagnostic;
    report.performanceAcceptance=false;
    report.rendererContract='native fallback fixture';
    report.samplingContract='All representations retain unmodified production sampling. The previous adaptive-only low sampler failed baseline fidelity; this fixture repair makes no performance acceptance claim.';
    report.nativeTiming={mode:nativeFallbackDiagnostic?'diagnostic':'enforced',
      timingPass:report.performancePass,budgetMs:report.absoluteFrameBudgetMs,
      requiredAggregateRatioBelow:.75,maximumSceneRatio:1.1,performanceAcceptance:false};
    report.limitation+=' This native-only fixture excludes the GPU renderer and cannot accept standalone GPU performance.';
    console.log(JSON.stringify(report));
    console.log('NATIVE_FALLBACK_TIMING '+JSON.stringify(report.nativeTiming));
    for(const screen of screens.filter(screen=>
      screen.name==='Ready-ONE'&&screen.mode!=='vector'||
      screen.name==='Focused-Turn'&&screen.mode==='adaptive'))
      console.log('NATIVE_REVIEW_FRAME '+JSON.stringify(screen));
    if(process.env.BITMAP_FRAME_REPORT) {
      const directory=path.dirname(process.env.BITMAP_FRAME_REPORT);fs.mkdirSync(directory,{recursive:true});
      for(const screen of screens)fs.writeFileSync(path.join(directory,screen.name+'-'+screen.mode+'.webp'),
        Buffer.from(screen.webp,'base64'));
      fs.writeFileSync(process.env.BITMAP_FRAME_REPORT,JSON.stringify(report,null,2)+'\n');
    }
    // Keep a compact visual review in the job log as well as the artifact.
    // This is an offline diagnostic Canvas, independent of the display owner.
    const {createCanvas,loadImage}=require('@napi-rs/canvas');
    const sheet=createCanvas(1920,frameReviewCount(screens)*390),paint=sheet.getContext('2d');
    paint.fillStyle='#0b141b';paint.fillRect(0,0,sheet.width,sheet.height);
    for(let i=0;i<screens.length;i++) {
      const screen=screens[i],column=['vector','bitmap','adaptive'].indexOf(screen.mode),row=Math.floor(i/3);
      paint.fillStyle='#d4f4df';paint.font='16px sans-serif';
      paint.fillText(screen.name+' — '+['pre-180','PR180','adaptive world'][column],column*640+12,row*390+22);
      paint.drawImage(await loadImage(Buffer.from(screen.webp,'base64')),column*640,row*390+30,640,360);
    }
    const encoded=sheet.toBuffer('image/webp',80).toString('base64');
    for(let at=0;at<encoded.length;at+=24000)
      console.log('FRAME_REVIEW '+String(at/24000).padStart(4,'0')+' '+encoded.slice(at,at+24000));
    if(!nativeFallbackDiagnostic)
      assert(report.performancePass,'native world painting must cut PR180 frame/raster cost by 25 percent, avoid a scene regression, and fit the 30 Hz diagnostic frame budget');
    assert(report.pixelComparisons.every(row=>row.meanRGB<1),
      'one reflection blur and SVG preparation must preserve loaded production appearance within one mean RGB level');
  }finally{
    socket?.close();
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
    // Chromium can still write its profile after kill() returns. Await the
    // process and retry transient child-process locks before removing it.
    if(child&&child.exitCode===null&&child.signalCode===null) {
      const stopped=once(child,'close');
      child.kill();await stopped;
    }
    const tempRoot=path.resolve(os.tmpdir());
    if(path.dirname(path.resolve(profile))!==tempRoot||!path.basename(profile).startsWith('barcode-bitmap-'))
      throw Error('Refusing to remove a profile outside the test temporary directory');
    await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:20,retryDelay:100});
  }
}
(async()=>{await unit();await gpuOriginalReadinessUnit();await backgroundRasterUnit();await nativeRasterUnit();await nativeSmallUnit();await nativeWindowUnit();await nativeTintUnit();budgetUnit();mirrorSourceUnit();worldCopyUnit();await nativeMappedDecodeUnit();await nativePriorityUnit();if(process.argv.includes('--browser'))await browser();})().catch(e=>{console.error(e.stack);process.exitCode=1;});
