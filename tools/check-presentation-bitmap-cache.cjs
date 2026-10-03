// Loader lifecycle and production Chromium frame/raster comparisons.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
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
  owner.observe(budget,90);owner.observe(budget,90);
  assert.equal(budget.scale,1,'one or two cold/impact frames cannot reduce detail');
  owner.observe(budget,90);assert.equal(budget.scale,.4,'sustained slow paint lowers only world sampling');
  const frozen=JSON.stringify(budget);
  for(let i=0;i<700;i++)owner.observe(budget,1,{paused:true});
  assert.equal(JSON.stringify(budget),frozen,'paused repeated paint cannot change quality');
  for(const cost of [NaN,Infinity,-1])owner.observe(budget,cost);
  assert.equal(JSON.stringify(budget),frozen,'invalid clocks cannot alter a budget');
  for(let i=0;i<599;i++)owner.observe(budget,1);
  assert.equal(budget.scale,.4,'detail recovery needs sustained spare capacity');
  owner.observe(budget,1);assert.equal(budget.scale,.5);
  for(let i=0;i<30;i++)owner.observe(budget,200);
  assert.equal(budget.scale,1/6,'background sampling stops at a finite floor with native interactive paint');
  const delayed=owner.create();
  owner.observe(delayed,12,{frameIntervalMs:34.1});
  owner.observe(delayed,12,{frameIntervalMs:34.1});
  assert.equal(delayed.scale,1,'two missed display frames retain cold/impact tolerance');
  owner.observe(delayed,12,{frameIntervalMs:34.1});
  assert(delayed.scale<1,'sustained missed 30 Hz intervals include queued raster cost');
  assert.equal(delayed.lastCostMs,34.1,'display delay is observed even when draw submission is cheap');
  const delayedFrozen=JSON.stringify(delayed);
  owner.observe(delayed,12,{paused:true,frameIntervalMs:60});
  assert.equal(JSON.stringify(delayed),delayedFrozen,'paused display delay cannot reduce detail');
  for(const interval of [1000/30,NaN,Infinity,-1,200,250]){
    const ignored=owner.create();
    for(let i=0;i<3;i++)owner.observe(ignored,12,{frameIntervalMs:interval});
    assert.equal(ignored.scale,1,'healthy, invalid and background-gap intervals retain detail');
  }
  const fresh=owner.create();assert.equal(fresh.scale,1);
  assert.equal(budget.scale,1/6,'a fresh run has independent presentation state');
  console.log('PASS: bounded adaptive world quality, queued display cost, cold/impact tolerance, pause freeze, clock fallback, recovery hysteresis and fresh-run independence.');
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
      while(!window.bitmapReview||Object.values(bitmapReview.cache).some(state=>!state.ready||state.rasterPending||state.nativePending||state.brakeTintPending)){
        if(performance.now()-started>45000)throw Error('assets did not prepare');await new Promise(r=>setTimeout(r,25));
      }
      const {entries,cache}=bitmapReview,svg=Object.keys(entries).filter(key=>entries[key].path.endsWith('.svg'));
      if(svg.some(key=>!(cache[key].bitmap instanceof ImageBitmap)))throw Error('SVG bitmap preparation failed');
      if(bitmapAttempts.filter(src=>src.endsWith('.svg')).length!==svg.length)throw Error('SVG preparations were duplicated');
      const c=document.getElementById('gameCanvas'),ctx=c.getContext('2d'),P=BARCODE.PresentationAssets;
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
              // Verify unchanged native geometry/art at full quality as well
              // as reviewing the actual adaptive output saved above.
              bitmapReview.fullQuality=true;ctx.reset();road.draw(ctx);
              pixels=ctx.getImageData(0,0,c.width,c.height).data;
              bitmapReview.fullQuality=false;
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
    assert(report.performancePass,'adaptive world painting must cut PR180 frame/raster cost by 25 percent, avoid a scene regression, and fit the 30 Hz diagnostic frame budget');
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
(async()=>{await unit();await backgroundRasterUnit();await nativeRasterUnit();await nativeSmallUnit();await nativeWindowUnit();await nativeTintUnit();budgetUnit();worldCopyUnit();if(process.argv.includes('--browser'))await browser();})().catch(e=>{console.error(e.stack);process.exitCode=1;});
