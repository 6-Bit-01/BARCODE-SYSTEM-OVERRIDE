// Loader lifecycle and production Chromium frame/raster comparisons.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../src/engine/presentation-assets.js'),'utf8');
const inspected=source.replace('  const cache = {};','  const cache = {};window.bitmapReview={entries,cache};');
const nativeBackgroundPlan={
  cacheDistantCity:[2079,756],cacheOutskirts:[2172,724],cacheMidCity:[2172,724],
  cacheStreetDeliveryVan:[1498,1016],cacheNewBinsRecycling:[1312,1199],
  cacheStreetBenchPlanters:[1546,1040],cacheNewWayfindingSign:[1152,576],
  cacheBlacktop:[2172,724],cachePlaceCapacitorExchange:[960,721],
  cacheUtilityCorner:[1585,992],cacheWalkerMarketWorkerTravel:[1024,768],
  cachePersonCrateCarrierTravel:[1604,768],cacheStreetBicycleRack:[1526,1023],
  cacheWalkerStudentTravel:[1024,768],cacheWalkerMechanicTravel:[1024,768]
};
const nativeBackgroundPixels=Object.values(nativeBackgroundPlan).reduce((sum,[w,h])=>sum+w*h,0);
const backgroundInspected=inspected.replace('  preload();',
  '  window.bitmapReview.background={plan:nativeBackgroundPlan,reservations:nativeBackgroundReservations,pixels:()=>rasterPixels,max:MAX_RASTER_PIXELS};\n  preload();');

async function nativeBackgroundUnit(){
  assert.equal(nativeBackgroundPixels,19072502);
  for(const failure of ['none','reject','throw','invalid','dimensions','missing','unsupported','unavailable']){
    const prepared=[],closed=[],images=[];let w;
    class Image {constructor(){
      if(!images.length)assert.equal(w.bitmapReview.background.pixels(),failure==='unsupported'?0:nativeBackgroundPixels,
        'all priority pixels are reserved before the first image is created');
      this.naturalWidth=2079;this.naturalHeight=756;images.push(this);
    }}
    w={Image,BARCODE:{},createImageBitmap(image,...args){
      prepared.push({image,args});
      const options=args[0];
      if(!options&&failure==='throw')throw Error('native decode unsupported');
      if(!options&&failure==='reject')return Promise.reject(Error('native decode rejected'));
      return Promise.resolve({width:!options&&failure==='invalid'?1:(options?.resizeWidth||image.naturalWidth),
        height:options?.resizeHeight||image.naturalHeight,close(){closed.push(this);}});
    }};
    if(failure==='unsupported')delete w.createImageBitmap;
    vm.runInNewContext(backgroundInspected,{window:w});
    const {cache,background}=w.bitmapReview,state=cache.cacheDistantCity,P=w.BARCODE.PresentationAssets;
    assert.deepEqual(JSON.parse(JSON.stringify(background.plan)),nativeBackgroundPlan);
    if(failure==='unavailable')delete w.createImageBitmap;
    if(failure==='dimensions')state.image.naturalWidth++;
    if(failure==='missing')state.image.naturalHeight=0;
    state.image.onload();
    if(failure==='none'||failure==='reject'||failure==='invalid')assert(state.nativeBackgroundPending,
      'full original sheet has its own asynchronous preparation state');
    const calls=[],ctx={imageSmoothingEnabled:false,filter:'blur(2.3px)',globalAlpha:.37,
      save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}};
    if(failure!=='missing'){
      P.draw('cacheDistantCity',ctx,{width:80,height:40,sourceRect:[12,8,100,40]});
      assert.equal(calls.at(-1)[0],state.image,'pending native preparation keeps original-image drawing');
    }
    await new Promise(setImmediate);
    assert.equal(!!state.nativeBackgroundBitmap,failure==='none');
    assert(!state.nativeBackgroundPending);
    assert.equal(prepared.filter(call=>!call.args.length).length,
      ['none','reject','throw','invalid'].includes(failure)?1:0,'one unresized native attempt or no unsupported attempt');
    assert.equal(closed.length,failure==='invalid'?1:0,'invalid native results are closed');
    assert.equal(background.reservations.get('cacheDistantCity')?.pixels||0,
      failure==='none'?2079*756:0,'failed/unsupported/decode-invalid slots release their full reservation');
    const before=prepared.length;P.preload();assert.equal(images.length,Object.keys(cache).length);
    if(failure!=='missing')for(let repeat=0;repeat<12;repeat++){
      P.draw('cacheDistantCity',ctx,{width:80,height:40,sourceRect:[12,8,100,40]});
      assert.equal(calls.at(-1)[0],state.nativeBackgroundBitmap||state.image);
      assert.deepEqual(calls.at(-1).slice(1),[12,8,100,40,0,-40,80,40]);
    }
    assert.equal(prepared.length,before,'warm/paused draw and preload cannot rebuild native backgrounds');
    assert.equal(ctx.imageSmoothingEnabled,false);assert.equal(ctx.filter,'blur(2.3px)');assert.equal(ctx.globalAlpha,.37);
    assert(background.pixels()<=background.max);
  }
  // Load unrelated giant thumbnails first. Their unresolved reservations
  // cannot consume the priority slots reserved before any image constructor.
  const pending=[],images=[];
  class Image {constructor(){this.naturalWidth=8192;this.naturalHeight=4096;images.push(this);}}
  const w={Image,BARCODE:{},createImageBitmap(image,...args){return new Promise((resolve,reject)=>
    pending.push({image,args,resolve,reject}));}};
  vm.runInNewContext(backgroundInspected,{window:w});
  const {cache,entries,background}=w.bitmapReview;
  for(const [key,entry]of Object.entries(entries))if(!nativeBackgroundPlan[key]&&
      /^assets\/cache-road\/(world|roadside)\//.test(entry.path)&&entry.path.endsWith('.webp')){
    cache[key].image.onload();assert(background.pixels()<=background.max);
  }
  const thumbnails=pending.filter(call=>call.args[0]?.resizeWidth);
  assert(thumbnails.length>0&&thumbnails.length<16,'overbudget thumbnails retain original art without an attempt');
  for(const [key,[width,height]]of Object.entries(nativeBackgroundPlan)){
    Object.assign(cache[key].image,{naturalWidth:width,naturalHeight:height});cache[key].image.onload();
    assert(cache[key].nativeBackgroundPending);assert(background.pixels()<=background.max);
  }
  assert.equal(pending.filter(call=>!call.args.length).length,15,'concurrent thumbnail work cannot starve any measured native slot');
  const retainedBefore=background.pixels();w.BARCODE.PresentationAssets.preload();assert.equal(background.pixels(),retainedBefore);
  for(const call of pending){const options=call.args[0];call.resolve({
    width:options?.resizeWidth||call.image.naturalWidth,height:options?.resizeHeight||call.image.naturalHeight});}
  await new Promise(setImmediate);
  assert(Object.keys(nativeBackgroundPlan).every(key=>cache[key].nativeBackgroundBitmap&&!cache[key].nativeBackgroundPending));
  const retained=Object.values(cache).reduce((sum,state)=>sum+
    (state.rasterBitmap?state.rasterBitmap.width*state.rasterBitmap.height:0)+
    (state.nativeBackgroundBitmap?state.nativeBackgroundBitmap.width*state.nativeBackgroundBitmap.height:0),0);
  assert.equal(retained,background.pixels());assert(retained<=32*1024*1024,'native and thumbnail retention share the unchanged 32 Mi-pixel pool');
  // Adversarial queued image errors after onload must release only once and
  // close the late immutable result rather than resurrecting a failed slot.
  let complete;const closed=[];
  const late={Image,BARCODE:{},createImageBitmap(image,options){if(options)return Promise.reject(Error('no thumbnail'));
    return new Promise(resolve=>{complete=resolve;});}};
  vm.runInNewContext(backgroundInspected,{window:late});
  const state=late.bitmapReview.cache.cacheDistantCity,error=state.image.onerror;
  Object.assign(state.image,{naturalWidth:2079,naturalHeight:756});state.image.onload();
  error();error();const released=late.bitmapReview.background.pixels();error();
  assert.equal(late.bitmapReview.background.pixels(),released,'duplicate failure cannot subtract retained pixels twice');
  complete({width:2079,height:756,close(){closed.push(this);}});await new Promise(setImmediate);
  assert.equal(closed.length,1);assert(!state.nativeBackgroundBitmap&&!state.nativeBackgroundPending);
  assert.equal(late.bitmapReview.background.reservations.get('cacheDistantCity').pixels,0);
  console.log('PASS: exact 15-sheet native priority plan, unresized one-time preparation, pending original fallback, unsupported/throw/reject/invalid/decode failures, bounded concurrent reservations and late-result cleanup.');
}

async function nativeBackgroundArtUnit(){
  const {createCanvas,loadImage}=require('@napi-rs/canvas');
  const definitions={window:{BARCODE:{}}};vm.runInNewContext(inspected,definitions);
  let cases=0;
  for(const key of ['cacheDistantCity','cacheBlacktop','cacheStreetDeliveryVan','cacheNewWayfindingSign','cacheWalkerMarketWorkerTravel']){
    const entry=definitions.window.bitmapReview.entries[key],bytes=fs.readFileSync(path.resolve(__dirname,'..',entry.path));
    const image=await loadImage(bytes),decoded=await loadImage(bytes),[width,height]=nativeBackgroundPlan[key];
    assert.deepEqual([image.width,image.height],[width,height],'priority dimensions match unchanged original artwork');
    class Image {constructor(){this.naturalWidth=width;this.naturalHeight=height;this.image=image;}}
    const attempts=[],w={Image,BARCODE:{},createImageBitmap(input,...args){attempts.push(args);
      return Promise.resolve(args.length?{width:args[0].resizeWidth,height:args[0].resizeHeight}:decoded);}};
    vm.runInNewContext(backgroundInspected,{window:w});
    const state=w.bitmapReview.cache[key],P=w.BARCODE.PresentationAssets;state.image.onload();await new Promise(setImmediate);
    assert.equal(state.nativeBackgroundBitmap,decoded);assert.deepEqual(attempts[0],[],'full sheet is decoded without crop/resize/options');
    const canvas=createCanvas(384,224),ctx=canvas.getContext('2d'),originalDraw=ctx.drawImage.bind(ctx),draws=[];
    ctx.drawImage=function(input,...args){draws.push([input,...args]);return originalDraw(input.image||input,...args);};
    const fw=width/entry.columns,fh=height/entry.rows;
    for(const scenario of ['plain','alpha-transform','filtered-clip','flip']){
      const args={x:164,y:156,width:218,height:112,frame:entry.frames-1,
        sourceRect:[7,5,fw-16,fh-12],flip:scenario==='flip'};
      const paint=native=>{
        ctx.reset();ctx.clearRect(0,0,384,224);ctx.save();ctx.translate(11,7);ctx.rotate(.017);
        ctx.globalAlpha=scenario==='alpha-transform'?.37:1;
        ctx.filter=scenario==='filtered-clip'?'blur(2.3px)':'none';ctx.imageSmoothingEnabled=false;ctx.imageSmoothingQuality='high';
        ctx.beginPath();ctx.rect(23,17,303,184);ctx.clip();
        state.nativeBackgroundBitmap=native?decoded:undefined;
        const before=ctx.getTransform(),alpha=ctx.globalAlpha,filter=ctx.filter;
        assert(P.draw(key,ctx,args));
        assert.deepEqual(ctx.getTransform(),before);assert.equal(ctx.globalAlpha,alpha);assert.equal(ctx.filter,filter);
        assert.equal(ctx.imageSmoothingEnabled,false);assert.equal(P.rasterDetail(ctx),1);
        ctx.restore();return Buffer.from(ctx.getImageData(0,0,384,224).data);
      };
      const reference=paint(false),actual=paint(true);
      assert(actual.equals(reference),`${key}/${scenario} preserves exact loaded-art RGBA in the native Canvas contract model`);
      assert.equal(draws.at(-1)[0],decoded);assert.deepEqual(draws.at(-1).slice(1,5),
        [(entry.frames-1)%entry.columns*fw+7,Math.floor((entry.frames-1)/entry.columns)*fh+5,fw-16,fh-12]);
      cases++;
    }
    assert.equal(attempts.filter(args=>!args.length).length,1,'frames/filter/paused repaints reuse the full native sheet');
  }
  console.log(`PASS: ${cases} original-art native background crop/frame/anchor/flip/sampler/alpha/filter/clip/transform comparisons using independent full-size native decodes; actual ImageBitmap browser pixels remain a Chromium gate.`);
}
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

async function backgroundRasterUnit(){
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
    image.onload();assert(state.ready,'background art is available while its derivative prepares');
    await new Promise(setImmediate);
    assert.equal(prepared.length,1);assert.equal(!!state.rasterBitmap,failure==='none');
    assert.equal(state.rasterPending,false);
    assert.equal(closed.length,failure==='invalid'?1:0);
    const calls=[],ctx={imageSmoothingEnabled:true,save(){},restore(){},translate(){},scale(){},
      drawImage(...args){calls.push(args);}};
    const args={x:0,y:0,width:80,height:40,sourceRect:[12,8,100,40]};
    assets.draw(key,ctx,args);
    assert.equal(calls[0][0],image,'native foreground retains the original source');
    assert.equal(assets.setRasterDetail(ctx,.25),1);
    for(let i=0;i<25;i++)assets.draw(key,ctx,args);
    assert.equal(prepared.length,1,'warm/paused draws never rebuild background derivatives');
    const call=calls[1];
    assert.equal(call[0],state.rasterBitmap||image);
    assert.deepEqual(call.slice(1),failure==='none'?
      [3,2,25,10,0,-40,80,40]:[12,8,100,40,0,-40,80,40]);
    assert.equal(assets.setRasterDetail(ctx,1),.25);
    assets.draw(key,ctx,args);assert.equal(calls.at(-1)[0],image);
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
    prepared.push(options);return Promise.resolve({width:options.resizeWidth,height:options.resizeHeight});
  }};
  vm.runInNewContext(inspected,{window:w});
  for(const [key,entry]of Object.entries(w.bitmapReview.entries)){
    if(entry.path.startsWith('assets/cache-road/world/')&&entry.path.endsWith('.webp'))
      w.bitmapReview.cache[key].image.onload();
  }
  await new Promise(setImmediate);
  assert(prepared.length>0&&prepared.length<=16);
  assert(Object.values(w.bitmapReview.cache).reduce((sum,state)=>
    sum+(state.rasterBitmap?state.rasterBitmap.width*state.rasterBitmap.height:0),0)<=32*1024*1024);
  // Smaller animated street sheets also need a stable decoded thumbnail.
  // The old one-megapixel cutoff missed signals, lamps and walking atlases.
  const smallPrepared=[];
  class SmallImage{constructor(){this.naturalWidth=1152;this.naturalHeight=576;}}
  const smallWindow={Image:SmallImage,BARCODE:{},createImageBitmap(image,options){
    smallPrepared.push(options);return Promise.resolve({width:options.resizeWidth,height:options.resizeHeight});}};
  vm.runInNewContext(inspected,{window:smallWindow});
  const smallState=smallWindow.bitmapReview.cache.cacheNewCrossingSignalR;
  smallState.image.onload();await new Promise(setImmediate);
  assert.equal(smallPrepared.length,1);
  assert.equal(smallPrepared[0].resizeWidth,288);
  assert.equal(smallPrepared[0].resizeHeight,144);
  assert.equal(smallPrepared[0].resizeQuality,'high');
  const smallCalls=[],smallSampling=[],smallCtx={imageSmoothingEnabled:true,save(){},restore(){},translate(){},scale(){},drawImage(...args){smallCalls.push(args);smallSampling.push(this.imageSmoothingEnabled);}};
  const smallAssets=smallWindow.BARCODE.PresentationAssets;
  smallAssets.setRasterDetail(smallCtx,.25);
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
  console.log('PASS: one bounded background derivative, source/crop geometry, original native routing, pause reuse, graceful failure and concurrent pixel reservations.');
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
    const prepared=[];
    class Image{constructor(){this.naturalWidth=512;this.naturalHeight=512;}}
    const w={Image,BARCODE:{},createImageBitmap(image){prepared.push(image);return Promise.resolve({width:512,height:512});}};
    vm.runInNewContext(inspected,{window:w});
    const {cache}=w.bitmapReview;
    const keys=['cacheDamagedExhaust','cachePhraseStrip','cacheConfirmedBar','cachePulsePad','cachePulseStrip','cachePulseBurst'];
    for(const key of keys)cache[key].image.onload();
    cache.cacheBrakeReflection.image.onload();
    assert.equal(prepared.length,6,'pending reservations cannot overbook the small pool');
    assert(!cache.cacheBrakeReflection.nativePending,'a crop beyond the pool retains original-image fallback');
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

function reflectionBlurCounterUnit(){
  const harness=fs.readFileSync(__filename,'utf8');
  const start=harness.indexOf('      const '+'inspectDrawImage=function(source,...args){');
  const end=harness.indexOf('      const '+'framePixels=',start);
  assert(start>=0&&end>start,'exercise the actual browser blur counter');
  class VideoFrame{}class OffscreenCanvas{}class Canvas{}
  const c=new Canvas(),offscreen=new OffscreenCanvas(),video=new VideoFrame(),image={};
  for(const missing of ['none','video','offscreen','both']){
    const submissions=[],w={},context={window:w,c,reflectionBlurs:0,
      VideoFrame:missing==='video'||missing==='both'?undefined:VideoFrame,
      OffscreenCanvas:missing==='offscreen'||missing==='both'?undefined:OffscreenCanvas,
      originalDrawImage(...args){submissions.push({context:this,args});return 'submitted';}};
    vm.runInNewContext(harness.slice(start,end)+'\nwindow.counter=inspectDrawImage;',context);
    const ctx={filter:'blur(2.3px)'},args=[0,0,714,141,626,0,714,141];
    for(const source of [c,offscreen,video,image,new Canvas()]){
      const before=context.reflectionBlurs;
      assert.equal(w.counter.call(ctx,source,...args),'submitted');
      const expected=source===c||source===offscreen&&!['offscreen','both'].includes(missing)||
        source===video&&!['video','both'].includes(missing);
      assert.equal(context.reflectionBlurs-before,expected?1:0,'only each supported reflection source contributes one blur');
      assert.equal(submissions.at(-1).context,ctx);assert.equal(submissions.at(-1).args[0],source);
      assert.deepEqual(submissions.at(-1).args.slice(1),args,'diagnostics preserve the original draw submission');
      assert.equal(ctx.filter,'blur(2.3px)');
    }
    ctx.filter='none';const before=context.reflectionBlurs;
    w.counter.call(ctx,c,...args);w.counter.call(ctx,offscreen,...args);w.counter.call(ctx,video,...args);
    assert.equal(context.reflectionBlurs,before,'unfiltered mirror resource draws never count as a blur');
  }
  console.log('PASS: actual browser blur counter recognizes main Canvas, OffscreenCanvas and VideoFrame exactly once, excludes unrelated/unfiltered sources, preserves draws and tolerates missing APIs.');
}

function mirrorSurfaceUnit(){
  const road=fs.readFileSync(path.resolve(__dirname,'../src/game/cache-road-proof.js'),'utf8');
  const start=road.indexOf('  function copyBoundedMirrorPixels('),end=road.indexOf('  function clipLightBlend(',start);
  assert(start>=0&&end>start,'exercise the production bounded mirror surface helper');
  const code=road.slice(start,end)+'\nwindow.copyBoundedMirrorPixels=copyBoundedMirrorPixels;';
  for(const failure of ['none','construct','context','copy','draw','metadata','lost','lost-copy','p3','native','missing','fractional','oversize','bounds','reference']){
    const calls=[],budget={},stack=[],allocated=[];
    class Canvas {constructor(){this.width=1920;this.height=1080;}}
    const copy={filter:'blur(9px)',globalAlpha:.23,globalCompositeOperation:'source-in',imageSmoothingEnabled:true,
      matrix:[.5,0,0,.5,7,11],getContextAttributes(){return {alpha:true,colorSpace:failure==='metadata'?'display-p3':'srgb'};},
      isContextLost(){return failure==='lost'||failure==='lost-copy'&&calls.some(call=>call[0]==='copy');},
      save(){stack.push([this.filter,this.globalAlpha,this.globalCompositeOperation,this.imageSmoothingEnabled,this.matrix]);},
      restore(){[this.filter,this.globalAlpha,this.globalCompositeOperation,this.imageSmoothingEnabled,this.matrix]=stack.pop();},
      setTransform(...args){this.matrix=args;},
      getImageData(){throw Error('mirror surface must not read pixels');},
      drawImage(...args){calls.push(['copy',...args,{alpha:this.globalAlpha,filter:this.filter,
        composite:this.globalCompositeOperation,smoothing:this.imageSmoothingEnabled,matrix:this.matrix}]);
        if(failure==='copy')throw Error('copy unavailable');}};
    class OffscreenCanvas {
      constructor(width,height){
        calls.push(['construct',width,height]);if(failure==='construct')throw Error('surface unavailable');
        this.width=width;this.height=height;allocated.push(this);
      }
      getContext(kind,options){calls.push(['context',kind,options]);return failure==='context'?null:copy;}
    }
    const w={HTMLCanvasElement:Canvas,OffscreenCanvas:failure==='missing'?undefined:OffscreenCanvas,
      VideoFrame:class{constructor(){throw Error('mirror surface must not construct VideoFrame');}}};
    vm.runInNewContext(code,{window:w});
    const canvas=failure==='native'?{}:new Canvas(),ctx={canvas,filter:'blur(2.3px)',globalAlpha:.37,
      globalCompositeOperation:'copy',getContextAttributes(){return {colorSpace:failure==='p3'?'display-p3':'srgb'};},
      getImageData(){throw Error('mirror surface must not read display pixels');},
      drawImage(...args){calls.push(['draw',...args]);if(failure==='draw'&&args[0]!==canvas)throw Error('unsupported frame');}};
    const sx=failure==='bounds'?1910:626,width=failure==='fractional'?714.5:failure==='oversize'?1920:714;
    const used=w.copyBoundedMirrorPixels(ctx,sx,0,width,141,sx,0,width,141,budget,failure!=='reference');
    assert.equal(used,failure==='none');
    assert.equal(ctx.filter,'blur(2.3px)');assert.equal(ctx.globalAlpha,.37);assert.equal(ctx.globalCompositeOperation,'copy');
    const constructed=calls.find(call=>call[0]==='construct'),drawn=calls.filter(call=>call[0]==='draw');
    if(constructed){
      assert.deepEqual(constructed.slice(1),[714,141],'surface allocation has one fixed native bounded footprint');
      if(failure!=='construct')assert.deepEqual(JSON.parse(JSON.stringify(calls.find(call=>call[0]==='context').slice(1))),
        ['2d',{alpha:true,colorSpace:'srgb'}]);
    }
    assert.equal(stack.length,0,'private surface state is restored even when copying throws');
    assert.equal(copy.filter,'blur(9px)');assert.equal(copy.globalAlpha,.23);
    assert.equal(copy.globalCompositeOperation,'source-in');assert.equal(copy.imageSmoothingEnabled,true);
    assert.deepEqual(copy.matrix,[.5,0,0,.5,7,11]);
    const copied=calls.find(call=>call[0]==='copy');
    if(copied){
      assert.equal(copied[1],canvas);assert.deepEqual(copied.slice(2,-1),[626,0,714,141,0,0,714,141]);
      assert.deepEqual(JSON.parse(JSON.stringify(copied.at(-1))),{alpha:1,filter:'none',composite:'copy',smoothing:false,matrix:[1,0,0,1,0,0]});
    }
    assert.deepEqual(drawn.at(-1).slice(2),used?[0,0,width,141,sx,0,width,141]:[sx,0,width,141,sx,0,width,141]);
    assert.equal(drawn.at(-1)[1]===canvas,!used,'unsupported callers retain the original direct source');
    if(['construct','context','copy','draw','metadata','lost','lost-copy'].includes(failure)){
      assert.equal(budget.mirrorSurfaceUnavailable,true);
      assert(!budget.mirrorSurface,'failed private resources are released');
      for(const surface of allocated){assert.equal(surface.width,0);assert.equal(surface.height,0);}
      if(failure==='lost')assert(!copied,'already-lost contexts never attempt a silent no-op copy');
      if(failure==='lost-copy')assert.equal(drawn.length,1,'context loss during copy never paints a transparent private surface');
      const count=calls.filter(call=>call[0]==='construct').length;
      w.copyBoundedMirrorPixels(ctx,626,0,714,141,626,0,714,141,budget);
      assert.equal(calls.filter(call=>call[0]==='construct').length,count,'failed surface APIs are attempted once');
    }else assert.equal(budget.mirrorSurfaceUnavailable,undefined);
    if(used){
      assert.equal(budget.mirrorSurface.canvas.width,714);assert.equal(budget.mirrorSurface.canvas.height,141);
      w.copyBoundedMirrorPixels(ctx,626,0,714,141,626,0,714,141,budget);
      assert.equal(calls.filter(call=>call[0]==='construct').length,1,'warm frames reuse the same bounded surface');
      assert.equal(calls.filter(call=>call[0]==='context').length,1,'warm frames reuse its one private context');
    }
  }
  console.log('PASS: one fixed714x141 native mirror surface/context, neutral exact-crop copy, zero readbacks/VideoFrames, warm reuse, private state restoration, initial/during-copy silent context-loss fallback and zero-sized failure cleanup.');
}

async function nativeMirrorCanvasUnit(){
  const {createCanvas,Path2D}=require('@napi-rs/canvas');
  const {createRig,load}=require('./check-level-01-boss');
  const {nativeAssets}=require('./render-cache-beat-visual-system.cjs');
  const root=path.resolve(__dirname,'..'),assets=await nativeAssets();
  const road=fs.readFileSync(path.join(root,'src/game/cache-road-proof.js'),'utf8');
  const r=createRig(),{w,context}=r,B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};
  for(const file of ['src/engine/cache-road-proof-profile.js','src/game/cache-road-landscape.js',
    'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
    'src/game/cache-road-pursuit.js','src/game/cache-road-boss-art.js',
    'src/game/cache-road-combat.js','src/game/cache-road-combat-art.js',
    'src/game/cache-road-crosswalks.js','src/game/cache-road-mirror.js','src/game/cache-road-cinematics.js'])load(context,file);
  w.Path2D=Path2D;w.Image=undefined;w.mirrorNativeImages=assets.images;
  vm.runInContext(assets.manifest.replace('  const cache = {};',
    '  const cache=Object.fromEntries(Object.entries(window.mirrorNativeImages).map(([key,image])=>[key,{image,ready:true}]));'),context);
  assert(road.includes('  B.Campaign.register(ID,'));
  vm.runInContext(road.replace('  B.Campaign.register(ID,',
    '  window.nativeMirrorReview={newState,drawRearview};\n  B.Campaign.register(ID,'),context);
  const canvases=[createCanvas(1920,1080),createCanvas(1920,1080)];
  w.HTMLCanvasElement=canvases[0].constructor;
  let reads=0,frames=0,privateContexts=0,cases=0;
  const surfaces=[],candidateBudget={};
  // Native Canvas has no OffscreenCanvas API. This model supplies its actual
  // native drawing surface; real OffscreenCanvas fidelity is checked in Chromium.
  w.VideoFrame=class{constructor(){frames++;throw Error('mirror surface must not construct VideoFrame');}};
  w.OffscreenCanvas=class{
    constructor(width,height){
      assert.equal(width,714);assert.equal(height,141);
      let raster=createCanvas(width,height),surfaceWidth=width,surfaceHeight=height;
      // Native Canvas maps dimension0 to a default size. OffscreenCanvas permits
      // zero; this contract model releases its raster at that browser boundary.
      const surface={
        get width(){return surfaceWidth;},set width(value){surfaceWidth=value;if(!value)raster=null;},
        get height(){return surfaceHeight;},set height(value){surfaceHeight=value;if(!value)raster=null;},
        get image(){return raster;},
        getContext(kind,options){
          privateContexts++;assert.equal(kind,'2d');assert.deepEqual(JSON.parse(JSON.stringify(options)),{alpha:true,colorSpace:'srgb'});
          const ctx=raster.getContext(kind);ctx.getContextAttributes=()=>({alpha:true,colorSpace:'srgb'});
          ctx.getImageData=()=>{reads++;throw Error('mirror surface must not read pixels');};return ctx;
        }
      };
      surfaces.push(surface);return surface;
    }
  };
  const contexts=canvases.map(canvas=>{
    const ctx=canvas.getContext('2d'),read=ctx.getImageData.bind(ctx),draw=ctx.drawImage.bind(ctx),selfCopies=[];
    ctx.getContextAttributes=()=>({colorSpace:'srgb'});
    ctx.getImageData=()=>{reads++;throw Error('Native rearview must not read the display canvas');};
    ctx.drawImage=(...args)=>{
      if(args[0]===canvas||surfaces.includes(args[0])){
        selfCopies.push({args:args.slice(1),surface:surfaces.includes(args[0]),
          filter:ctx.filter,composite:ctx.globalCompositeOperation});
        if(surfaces.includes(args[0]))args[0]=args[0].image;
      }
      return draw(...args);
    };
    return {ctx,read,selfCopies};
  });
  for(const progress of [180,7620])for(const reduced of [false,true])
    for(const caller of ['native','paused','fade','transformed']){
      const pose=Object.assign(w.nativeMirrorReview.newState(),{progress,elapsedMs:5471,lanePos:1.5,
        visualLane:1.5,musicBar:64,musicBeatFloat:257.2,captures:[],speed:70,gear:2,timeMs:55000});
      const stateBefore=JSON.stringify(pose),budgets=[];
      for(let index=0;index<contexts.length;index++){
        const {ctx,selfCopies}=contexts[index];ctx.reset();selfCopies.length=0;
        ctx.fillStyle='#26364a';ctx.fillRect(0,0,1920,1080);
        if(caller==='transformed')ctx.setTransform(.75,0,0,.75,120,10);
        ctx.globalAlpha=.73;
        const before={alpha:ctx.globalAlpha,filter:ctx.filter,composite:ctx.globalCompositeOperation,
          transform:JSON.stringify(ctx.getTransform())};
        const callerCtx=caller==='fade'?B.CacheRoadCinematics.withHUDAlpha(ctx,.4):ctx;
        const budget=index===0?null:candidateBudget;budgets.push(budget);
        // Null budget executes the original direct-canvas reference branch.
        // The candidate receives the same retained bounded surface owner.
        w.nativeMirrorReview.drawRearview(callerCtx,pose,'#8fe3db',reduced,undefined,null,null,
          false,caller==='native',budget);
        assert.equal(JSON.stringify(pose),stateBefore,'native reflection painting preserves gameplay');
        assert.deepEqual({alpha:ctx.globalAlpha,filter:ctx.filter,composite:ctx.globalCompositeOperation,
          transform:JSON.stringify(ctx.getTransform())},before,'native reflection restores caller state');
        assert.equal(selfCopies.length,1,'each completed reflection has one original canvas copy');
        assert.equal(selfCopies[0].filter,'blur(2.3px)','the original glass blur is retained');
        assert.equal(selfCopies[0].composite,caller==='native'?'source-over':'copy');
        if(caller==='native')assert.deepEqual(selfCopies[0].args,index===0?
          [626,0,714,141,626,0,714,141]:[0,0,714,141,626,0,714,141]);
      }
      assert.equal(reads,0,'even eligible native rearview frames never invoke getImageData');
      assert.equal(frames,0,'native mirrors never construct VideoFrame');
      assert.equal(budgets[1].mirrorPixelCopyUsed,caller!=='transformed');
      assert.equal(budgets[1].pixelCopyUnavailable,undefined,'readback is absent, not caught as a failure');
      assert.equal(budgets[1].mirrorSurfaceUnavailable,undefined,'supported surface does not fall back');
      const originalCopy=contexts[0].selfCopies[0],candidateCopy=contexts[1].selfCopies[0];
      assert.equal(candidateCopy.filter,originalCopy.filter);assert.equal(candidateCopy.composite,originalCopy.composite);
      assert.equal(candidateCopy.surface,caller!=='transformed');
      assert.deepEqual(candidateCopy.args,caller!=='transformed'?[0,0,714,141,626,0,714,141]:originalCopy.args,
        'native-size active/paused/fade callers use bounded coordinates while transformed callers retain direct-copy coordinates');
      const reference=Buffer.from(contexts[0].read(0,0,1920,1080).data);
      const candidate=Buffer.from(contexts[1].read(0,0,1920,1080).data);
      assert(candidate.equals(reference),`original native reflected pixels changed at ${progress}/${reduced}/${caller}`);
      cases++;
    }
  assert.equal(frames,0);assert.equal(surfaces.length,1);assert.equal(privateContexts,1);
  const owner=B.CacheRoadProof,surface=candidateBudget.mirrorSurface;
  assert.equal(typeof owner.dispose,'function','exercise the actual production road lifecycle owner');
  let audioStops=0,endingStops=0;
  w.audioSystem={...w.audioSystem,stopRoadEngine(){audioStops++;}};
  B.CacheEnding={dispose(){endingStops++;}};
  owner.renderBudget=candidateBudget;owner.renderBudgetState={};owner.active=true;owner.pending=true;
  const generation=owner.entryGeneration||0;
  owner.state=w.nativeMirrorReview.newState();owner.chapter={};owner.oldHint=null;
  const displayStates=contexts.map(({ctx})=>({alpha:ctx.globalAlpha,filter:ctx.filter,
    composite:ctx.globalCompositeOperation,transform:JSON.stringify(ctx.getTransform())}));
  owner.dispose();
  assert.equal(surface.canvas.width,0);assert.equal(surface.canvas.height,0);
  assert.equal(surface.canvas.image,null,'zero-sized contract surfaces release their actual native raster');
  assert.equal(candidateBudget.mirrorSurface,null);assert.equal(owner.renderBudget,null);
  assert.equal(owner.renderBudgetState,null);assert.equal(owner.active,false);assert.equal(owner.pending,false);
  assert.equal(owner.entryGeneration,generation+1);
  assert.equal(owner.state,null);assert.equal(owner.chapter,null);
  assert.equal(audioStops,1);assert.equal(endingStops,1);
  assert.deepEqual(contexts.map(({ctx})=>({alpha:ctx.globalAlpha,filter:ctx.filter,
    composite:ctx.globalCompositeOperation,transform:JSON.stringify(ctx.getTransform())})),displayStates,
    'disposing a private mirror resource never changes either display context');
  owner.dispose();assert.equal(owner.renderBudget,null);assert.equal(owner.renderBudgetState,null);
  assert.equal(privateContexts,1);assert.equal(reads,0);assert.equal(frames,0);
  console.log(`PASS: ${cases} loaded-art native mirror comparisons using one bounded OffscreenCanvas contract model, zero display readbacks/VideoFrames, original curved glass/crop/blur/blend, paused/fade surface reuse, transformed fallback and pure gameplay/context state; actual OffscreenCanvas pixels remain a Chromium gate.`);
  console.log('PASS: actual production road.dispose releases and zero-sizes the retained mirror surface, clears its budget/state references, preserves existing audio/ending cleanup and display contexts, and supports repeated disposal.');
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
    window.bitmapAttempts=[];window.bitmapCalls=[];window.contextCalls=0;
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
    window.createImageBitmap=(image,...args)=>{bitmapAttempts.push(image.src);
      bitmapCalls.push({src:image.src,width:image.naturalWidth,height:image.naturalHeight,args});return bitmap(image,...args);};
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
      road=road.replace(copyMarker,'  window.bitmapReview.copySampledWorldPixels=copySampledWorldPixels;window.bitmapReview.copyOpaqueCanvasPixels=copyOpaqueCanvasPixels;window.bitmapReview.copyBoundedMirrorPixels=copyBoundedMirrorPixels;window.bitmapReview.drawRearview=drawRearview;window.bitmapReview.mirrorOutline=mirrorOutline;\n'+copyMarker);
      assert(road.includes('const compositeBlur=ctx.canvas?.width>0'));
      road=road.replace('const compositeBlur=ctx.canvas?.width>0',
        "const compositeBlur=window.bitmapReview.mode!=='vector'&&ctx.canvas?.width>0");
      assert(road.includes('const budgetEligible=!!budgetOwner'));
      road=road.replace('const budgetEligible=!!budgetOwner',
        "const budgetEligible=window.bitmapReview.mode==='adaptive'&&!window.bitmapReview.fullQuality&&!!budgetOwner");
      assert(road.includes("ctx.imageSmoothingQuality='low';"));
      road=road.replace("ctx.imageSmoothingQuality='low';",
        "if(window.bitmapReview.mode==='adaptive')ctx.imageSmoothingQuality='low';");
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
      while(!window.bitmapReview||Object.values(bitmapReview.cache).some(state=>!state.ready||state.rasterPending||state.nativePending||state.nativeBackgroundPending||state.brakeTintPending)){
        if(performance.now()-started>45000)throw Error('assets did not prepare');await new Promise(r=>setTimeout(r,25));
      }
      const {entries,cache}=bitmapReview,svg=Object.keys(entries).filter(key=>entries[key].path.endsWith('.svg'));
      if(svg.some(key=>!(cache[key].bitmap instanceof ImageBitmap)))throw Error('SVG bitmap preparation failed');
      if(bitmapAttempts.filter(src=>src.endsWith('.svg')).length!==svg.length)throw Error('SVG preparations were duplicated');
      // Keep the normal accelerated backend while diagnostic readbacks drain
      // draws. Production native driving never requests those pixel reads.
      const c=document.getElementById('gameCanvas'),ctx=c.getContext('2d',{willReadFrequently:false}),P=BARCODE.PresentationAssets;
      const beforeSVG=bitmapAttempts.filter(src=>src.endsWith('.svg')).length,pixels=[];
      const expectedBackgroundPlan=${JSON.stringify(nativeBackgroundPlan)},nativeBackgroundChecks=[];
      // Compare actual Chromium ImageBitmaps with their original HTML images
      // at unchanged native source coordinates, including transparent artwork.
      const backgroundAttempts=bitmapCalls.length,backgroundDrawImage=ctx.drawImage;
      try{
        for(const [key,[width,height]]of Object.entries(expectedBackgroundPlan)){
          const state=cache[key],entry=entries[key],prepared=state.nativeBackgroundBitmap;
          if(!(prepared instanceof ImageBitmap)||prepared.width!==width||prepared.height!==height||
              state.image.naturalWidth!==width||state.image.naturalHeight!==height)
            throw Error('Native background dimensions/preparation failed '+key);
          if(bitmapCalls.filter(call=>call.src.endsWith('/'+entry.path)&&!call.args.length).length!==1)
            throw Error('Native background preparation resized, duplicated or omitted '+key);
          const fw=width/entry.columns,fh=height/entry.rows;
          try{
            for(const scenario of ['plain','alpha-flip','filtered-transform','signed-crop']){
              const frame=scenario==='plain'?entry.frames-1:entry.frames+1;
              const args={x:216,y:180,width:228,height:124,frame,flip:scenario==='alpha-flip',
                sourceRect:scenario==='signed-crop'?[fw-3,5,-fw+16,fh-12]:[7,5,fw-16,fh-12]};
              let submitted;
              ctx.drawImage=function(image,...crop){submitted={image,crop};return backgroundDrawImage.call(this,image,...crop);};
              const paint=native=>{
                ctx.reset();ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.translate(11,7);ctx.rotate(.017);
                ctx.globalAlpha=scenario==='alpha-flip'?.37:1;
                ctx.filter=scenario==='filtered-transform'?'blur(2.3px)':'none';ctx.imageSmoothingEnabled=false;ctx.imageSmoothingQuality='high';
                ctx.beginPath();ctx.rect(23,17,403,204);ctx.clip();
                state.nativeBackgroundBitmap=native?prepared:undefined;
                const before=ctx.getTransform(),alpha=ctx.globalAlpha,filter=ctx.filter;
                if(!P.draw(key,ctx,args))throw Error('Native background draw failed '+key);
                if(JSON.stringify(ctx.getTransform())!==JSON.stringify(before)||ctx.globalAlpha!==alpha||ctx.filter!==filter||
                    ctx.imageSmoothingEnabled!==false||ctx.imageSmoothingQuality!=='high'||P.rasterDetail(ctx)!==1)
                  throw Error('Native background leaked caller state '+key+'/'+scenario);
                if(submitted.image!==(native?prepared:state.image))throw Error('Native background selected an incorrect source '+key);
                const index=Math.max(0,Math.floor(frame))%entry.frames;
                const crop=[index%entry.columns*fw+args.sourceRect[0],Math.floor(index/entry.columns)*fh+args.sourceRect[1],...args.sourceRect.slice(2)];
                if(JSON.stringify(submitted.crop.slice(0,4))!==JSON.stringify(crop))throw Error('Native background altered crop/cel addresses '+key);
                ctx.restore();return ctx.getImageData(0,0,512,224).data;
              };
              const reference=paint(false),actual=paint(true);let difference=0,maxChannelDifference=0,maxAlphaDifference=0;
              for(let i=0;i<actual.length;i++){const delta=Math.abs(actual[i]-reference[i]);
                if(i%4===3)maxAlphaDifference=Math.max(maxAlphaDifference,delta);
                else {difference+=delta;maxChannelDifference=Math.max(maxChannelDifference,delta);}}
              const meanRGB=difference/(actual.length/4*3);
              if(meanRGB>=.1||maxAlphaDifference!==0)throw Error('Native background fidelity failed '+key+'/'+scenario+' '+meanRGB+'/'+maxAlphaDifference);
              nativeBackgroundChecks.push({key,scenario,width,height,meanRGB,maxChannelDifference,maxAlphaDifference});
            }
          }finally{state.nativeBackgroundBitmap=prepared;}
        }
      }finally{ctx.drawImage=backgroundDrawImage;ctx.reset();}
      if(bitmapCalls.length!==backgroundAttempts)throw Error('Native background draws rebuilt the cache');
      const backgroundInventory=Object.entries(cache).filter(([,state])=>state.nativeBackgroundBitmap||state.rasterBitmap)
        .map(([key,state])=>({key,nativePixels:state.nativeBackgroundBitmap?state.nativeBackgroundBitmap.width*state.nativeBackgroundBitmap.height:0,
          quarterPixels:state.rasterBitmap?state.rasterBitmap.width*state.rasterBitmap.height:0}));
      const backgroundRetainedPixels=backgroundInventory.reduce((sum,item)=>sum+item.nativePixels+item.quarterPixels,0);
      if(backgroundRetainedPixels>32*1024*1024)throw Error('Shared background bitmap retention exceeded its existing pixel bound');
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
       const nativeBitmaps=Object.fromEntries(Object.entries(cache).filter(([,state])=>state.nativeBitmap||state.nativeFrames||state.nativeWindows||state.nativeBackgroundBitmap||state.brakeTintBitmap)
         .map(([key,state])=>[key,{bitmap:state.nativeBitmap,frames:state.nativeFrames,windows:state.nativeWindows,background:state.nativeBackgroundBitmap,tint:state.brakeTintBitmap}]));
      const median=values=>{const v=values.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)];};
      const rows=[],assetDraw=P.draw,bitmapFactory=window.createImageBitmap;
      const originalDrawImage=ctx.drawImage;let reflectionBlurs=0;
      const inspectDrawImage=function(source,...args){
        if((source===c||typeof VideoFrame==='function'&&source instanceof VideoFrame||
          typeof OffscreenCanvas==='function'&&source instanceof OffscreenCanvas)&&this.filter==='blur(2.3px)')reflectionBlurs++;
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
           cache[key].nativeBackgroundBitmap=mode==='adaptive'?value.background:undefined;
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
          cache[key].nativeBitmap=value.bitmap;cache[key].nativeFrames=value.frames;cache[key].nativeWindows=value.windows;cache[key].nativeBackgroundBitmap=value.background;cache[key].brakeTintBitmap=value.tint;
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
      const mirrorSurfaceChecks=[];
      const readPixels=ctx.getImageData.bind(ctx),OriginalOffscreenCanvas=window.OffscreenCanvas,
        OriginalVideoFrame=window.VideoFrame,surfaceBudget={};
      let surfaceReads=0,surfaceConstructed=0,surfaceContexts=0,surfaceFrames=0;
      // Pixel reads occur only after each completed draw through the saved
      // native method; the actual production helper cannot read either surface.
      ctx.getImageData=()=>{surfaceReads++;throw Error('production mirror surface read the display');};
      window.VideoFrame=class{constructor(){surfaceFrames++;throw Error('mirror surface created a VideoFrame');}};
      window.OffscreenCanvas=class{
        constructor(width,height){
          if(width!==714||height!==141)throw Error('mirror surface exceeded its fixed native bound');
          surfaceConstructed++;
          const canvas=new OriginalOffscreenCanvas(width,height),getContext=canvas.getContext.bind(canvas);
          canvas.getContext=(kind,options)=>{
            surfaceContexts++;
            if(kind!=='2d'||options.alpha!==true||options.colorSpace!=='srgb')
              throw Error('mirror surface changed alpha/color space');
            const privateContext=getContext(kind,options);
            privateContext.getImageData=()=>{surfaceReads++;throw Error('production mirror surface read private pixels');};
            return privateContext;
          };
          return canvas;
        }
      };
      const compareSurface=(scenario,paint,draw,expectedUsed)=>{
        paint();draw(null);
        const original=readPixels(0,0,c.width,c.height).data;
        paint();const budget=surfaceBudget;draw(budget);
        const candidate=readPixels(0,0,c.width,c.height).data;
        let rgb=0,maxAlpha=0;
        for(let index=0;index<original.length;index++){
          const delta=Math.abs(original[index]-candidate[index]);
          if(index%4===3)maxAlpha=Math.max(maxAlpha,delta);else rgb+=delta;
        }
        const row={scenario,used:budget.mirrorPixelCopyUsed,meanRGB:rgb/(c.width*c.height*3),
          maxAlphaDifference:maxAlpha,constructed:surfaceConstructed,privateContexts:surfaceContexts,
          readbacks:surfaceReads,videoFrames:surfaceFrames,surfaceWidth:budget.mirrorSurface?.canvas.width,
          surfaceHeight:budget.mirrorSurface?.canvas.height};
        if(row.meanRGB>=.1||maxAlpha||row.used!==expectedUsed||surfaceReads||surfaceFrames||
          surfaceConstructed!==1||surfaceContexts!==1||budget.mirrorSurfaceUnavailable||
          row.surfaceWidth!==714||row.surfaceHeight!==141)
          throw Error('bounded mirror surface changed original curved mirror/alpha/caller pixels: '+JSON.stringify(row));
        mirrorSurfaceChecks.push(row);
      };
      try{
        for(const scenario of ['opaque','alpha']){
          const paint=()=>{
            ctx.reset();const gradient=ctx.createLinearGradient(0,0,c.width,c.height);
            gradient.addColorStop(0,'#1d7d99');gradient.addColorStop(.42,'#9b4f74');gradient.addColorStop(1,'#dc805b');
            ctx.fillStyle=gradient;ctx.fillRect(0,0,c.width,c.height);
            ctx.fillStyle='#fae986';ctx.fillRect(720,45,63,34);
            if(scenario==='alpha')ctx.clearRect(650,30,7,13);
            bitmapReview.mirrorOutline(ctx,638,12,690,117);ctx.clip();
            ctx.globalCompositeOperation='source-over';ctx.filter='blur(2.3px)';
          };
          compareSurface('curved-'+scenario,paint,budget=>{
            if(budget)budget.mirrorPixelCopyUsed=bitmapReview.copyBoundedMirrorPixels(ctx,
              626,0,714,141,626,0,714,141,budget,true);
            else ctx.drawImage(c,626,0,714,141,626,0,714,141);
          },true);
        }
        const state=frameReviewScenes.find(scene=>scene.name==='Focused-Turn').state;
        const stateBefore=JSON.stringify(state);
        for(const caller of ['native','paused','fade','transformed']){
          let callerContext,before;
          const paint=()=>{
            ctx.reset();ctx.fillStyle='#26364a';ctx.fillRect(0,0,c.width,c.height);
            if(caller==='transformed')ctx.setTransform(.75,0,0,.75,120,10);
            ctx.globalAlpha=.73;
            before=JSON.stringify({alpha:ctx.globalAlpha,filter:ctx.filter,composite:ctx.globalCompositeOperation,
              matrix:[ctx.getTransform().a,ctx.getTransform().b,ctx.getTransform().c,ctx.getTransform().d,ctx.getTransform().e,ctx.getTransform().f]});
            callerContext=caller==='fade'?BARCODE.CacheRoadCinematics.withHUDAlpha(ctx,.4):ctx;
          };
          compareSurface('loaded-art-'+caller,paint,budget=>{
            bitmapReview.drawRearview(callerContext,state,'#8fe3db',false,undefined,null,null,
              false,caller==='native',budget);
            const after=JSON.stringify({alpha:ctx.globalAlpha,filter:ctx.filter,composite:ctx.globalCompositeOperation,
              matrix:[ctx.getTransform().a,ctx.getTransform().b,ctx.getTransform().c,ctx.getTransform().d,ctx.getTransform().e,ctx.getTransform().f]});
            if(after!==before||JSON.stringify(state)!==stateBefore)
              throw Error('bounded mirror reflection mutated caller state or gameplay');
          },caller!=='transformed');
        }
        if(surfaceConstructed!==1||surfaceContexts!==1||surfaceFrames||surfaceReads)
          throw Error('bounded mirror surface allocation/reuse changed');
      }finally{
        ctx.getImageData=readPixels;window.VideoFrame=OriginalVideoFrame;window.OffscreenCanvas=OriginalOffscreenCanvas;
      }
      ctx.reset();
      return {passed:true,performancePass,aggregateRatio,frameComparisons,frameSamples:rows,pixelComparisons,screens,viewportChecks,tintSourceChecks,worldSourceChecks,mirrorSourceChecks,mirrorSurfaceChecks,nativeBackgroundChecks,backgroundInventory,backgroundRetainedPixels,
        preparedSVGs:svg.length,qualityComparisons,absoluteFrameBudgetMs,reflectionBlursPerFrame:1,warmDraws:120,pausedPixels:true,displayContexts:contextCalls,
        preservedMirrorFilter:'blur(2.3px)',limitation:'Real Chromium loader/cache validation; owner device FPS remains unmeasured.'};
    })()`});
    if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
    assert(result.result.value?.passed);
    const {screens,...report}=result.result.value;
    console.log(JSON.stringify(report));
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
(async()=>{await unit();await backgroundRasterUnit();await nativeBackgroundUnit();await nativeBackgroundArtUnit();await nativeRasterUnit();await nativeSmallUnit();await nativeWindowUnit();await nativeTintUnit();budgetUnit();mirrorSourceUnit();worldCopyUnit();reflectionBlurCounterUnit();mirrorSurfaceUnit();await nativeMirrorCanvasUnit();if(process.argv.includes('--browser'))await browser();})().catch(e=>{console.error(e.stack);process.exitCode=1;});
