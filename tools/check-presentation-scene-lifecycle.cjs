// Actual PA scene-lifetime contracts under explicit image/bitmap host stubs.
// This checks ownership and readiness, not browser pixels or memory acceptance.
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {levelSourceDescriptors}=require('./lib/cache-road-gpu-fixture.cjs');
const bytes=fs.readFileSync(path.resolve(__dirname,'../src/engine/presentation-assets.js'));
const checks=[];
function check(name,run){checks.push({name,run});}
async function settle(){for(let n=0;n<20;n++)await Promise.resolve();}
function fixture({standalone=false}={}){
  const images=[],calls=[],closed=[],revoked=[],removed=[],fetches=[];
  class Image{
    constructor(){this.naturalWidth=1024;this.naturalHeight=1024;this.url='';images.push(this);}
    set src(value){this.url=value;}
    get src(){return this.url;}
    removeAttribute(name){assert.equal(name,'src');removed.push(this);this.url='';this.naturalWidth=0;this.naturalHeight=0;}
    load(width=1024,height=1024){this.naturalWidth=width;this.naturalHeight=height;this.onload?.();}
  }
  class Canvas{}
  class Blob{constructor(parts){this.parts=parts;}}
  const window={BARCODE:standalone?{StandaloneSprites:{}}:{},Image,HTMLCanvasElement:Canvas,Blob,
    AbortController,btoa:value=>Buffer.from(value,'binary').toString('base64'),
    URL:{createObjectURL:()=> 'blob:tint-'+images.length,revokeObjectURL:url=>revoked.push(url)},
    fetch:(url,options)=>{fetches.push({url,options});return Promise.resolve({ok:true,arrayBuffer:()=>Promise.resolve(new Uint8Array([1,2,3]).buffer)});},
    createImageBitmap(image,...args){
      let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});
      const size=args.length&&typeof args[0]==='object'?[args[0].resizeWidth,args[0].resizeHeight]:
        args.length>=4?[args[2],args[3]]:[image.naturalWidth,image.naturalHeight];
      const call={image,args,resolve,reject,width:size[0],height:size[1]};calls.push(call);return promise;
    }};
  const source=bytes.toString().replace('  B.PresentationAssets = {','  B._testPA={cache,entries,nativePriorityReservations};\n  B.PresentationAssets = {');
  assert.notEqual(source,bytes.toString(),'actual PA API exposure must match');
  vm.runInNewContext(source,{window});
  const test=window.BARCODE._testPA,api=window.BARCODE.PresentationAssets;
  function bitmap(call){return {width:call.width,height:call.height,close(){closed.push(this);}};}
  function resolveAll(){for(const call of calls)if(!call.settled){call.settled=true;call.bitmap=bitmap(call);call.resolve(call.bitmap);}}
  function loadAll(){for(const state of Object.values(test.cache))if(state.image.onload)state.image.load();}
  return {window,api,...test,images,calls,closed,revoked,removed,fetches,resolveAll,loadAll,bitmap};
}
check('embedded eager catalog and standalone Level 1 startup retain their intended scopes',()=>{
  const eager=fixture(),standalone=fixture({standalone:true});
  assert.equal(eager.images.length,256);assert.equal(eager.api.diagnostics().sceneScoped,false);
  assert.equal(standalone.images.length,28);assert(Object.keys(standalone.cache).every(key=>!key.startsWith('cache')));
  assert.equal(standalone.api.diagnostics().registeredSources,256);
  assert.equal(standalone.api.diagnostics().nativeRasterPixels,0);
});
check('scene release detaches originals, settles loading and blocks late handlers before safe reload',async()=>{
  const f=fixture();f.api.selectScene(['cacheCar'],{nativeKeys:[]});
  const state=f.cache.cacheCar,image=state.image,onload=image.onload,onerror=image.onerror;
  const waiting=f.api.waitForGpuSources(['cacheCar']);
  f.api.releaseScene();assert.equal((await waiting).length,0);
  assert.equal(image.src,'');assert.equal(image.onload,null);assert.equal(image.onerror,null);
  assert.equal(state.image,null);assert.equal(f.api.diagnostics().cachedSources,0);
  onload();onerror();assert.equal(image.src,'');assert.equal(f.api.diagnostics().cachedSources,0);
  f.api.selectScene(['cacheCar'],{nativeKeys:[]});const replacement=f.cache.cacheCar.image;
  assert.notEqual(replacement,image);onload();assert.equal(f.api.ready('cacheCar'),false);
  replacement.load(1280,640);assert.equal((await f.api.waitForGpuSources(['cacheCar']))[0].image,replacement);
  const count=f.images.length;f.api.selectScene(['cacheCar'],{nativeKeys:[]});
  assert.equal(f.images.length,count);assert.equal(f.cache.cacheCar.image,replacement);
});
check('completed native windows, frames, whole sources, SVG and reduced backings all close and release budgets',async()=>{
  const f=fixture(),keys=['cacheMirror','cacheCar','cacheDamagedExhaust','cacheBlacktop','cacheGreenhouseWorkshop','cacheDashDigits'];
  f.api.selectScene(keys);
  f.cache.cacheMirror.image.load(1536,1024);f.cache.cacheCar.image.load(1280,640);
  f.cache.cacheDamagedExhaust.image.load(600,600);f.cache.cacheBlacktop.image.load(2172,724);
  f.cache.cacheGreenhouseWorkshop.image.load(1536,1024);f.cache.cacheDashDigits.image.load(1100,130);
  await settle();f.resolveAll();await settle();
  f.api.setRasterDetail({},.25);f.resolveAll();await settle();
  assert.equal(f.cache.cacheMirror.nativeWindows.length,6);assert.equal(f.cache.cacheCar.nativeFrames.length,8);
  assert(f.cache.cacheDamagedExhaust.nativeBitmap);assert(f.cache.cacheBlacktop.nativeBitmap);
  assert(f.cache.cacheDashDigits.bitmap);assert(f.cache.cacheGreenhouseWorkshop.rasterBitmap);
  const prepared=f.calls.length;assert(prepared>10);
  f.api.releaseScene();assert.equal(f.closed.length,prepared);assert.equal(new Set(f.closed).size,prepared);
  assert.equal(f.api.diagnostics().nativeRasterPixels,0);assert.equal(f.api.diagnostics().nativeSmallPixels,0);
  assert.equal(f.api.diagnostics().rasterPixels,0);assert.equal(f.api.diagnostics().cachedSources,0);
});
check('pending factories cannot repopulate released sources or charge their reservations twice',async()=>{
  const f=fixture();f.api.selectScene(['cacheMirror','cacheDamagedExhaust','cacheDashDigits']);
  f.cache.cacheMirror.image.load(1536,1024);f.cache.cacheDamagedExhaust.image.load(600,600);
  f.cache.cacheDashDigits.image.load(1100,130);await settle();
  const prepared=f.calls.length;assert(prepared>=8);
  f.api.releaseScene();assert.equal(f.api.diagnostics().nativeRasterPixels,0);
  f.resolveAll();await settle();assert.equal(f.closed.length,prepared);
  assert.equal(f.api.diagnostics().nativeRasterPixels,0);assert.equal(f.api.diagnostics().nativeSmallPixels,0);
  assert.equal(f.api.diagnostics().cachedSources,0);
});
check('changing derivative permission retains originals and old completions cannot overwrite renewed preparation',async()=>{
  const f=fixture();f.api.selectScene(['cacheMirror']);
  const state=f.cache.cacheMirror,image=state.image;image.load(1536,1024);await settle();
  const older=f.calls.slice();assert.equal(older.length,6);
  f.api.selectScene(['cacheMirror'],{nativeKeys:[]});assert.equal(f.cache.cacheMirror.image,image);
  assert.equal(f.api.diagnostics().nativeRasterPixels,0);assert.equal(f.api.ready('cacheMirror'),true);
  f.api.selectScene(['cacheMirror']);await settle();const newer=f.calls.slice(older.length);assert.equal(newer.length,6);
  const reserved=f.api.diagnostics().nativeRasterPixels;
  for(const call of older){call.settled=true;call.resolve(f.bitmap(call));}await settle();
  assert.equal(f.closed.length,6);assert.equal(state.nativePending,true);
  assert.equal(f.api.diagnostics().nativeRasterPixels,reserved);assert.equal(state.nativeWindows,undefined);
  f.resolveAll();await settle();assert.equal(state.nativePending,false);assert.equal(state.nativeWindows.length,6);
  f.api.releaseScene();assert.equal(f.api.diagnostics().nativeRasterPixels,0);
});
check('GPU-only originals create no native derivatives and retain exact descriptor/draw identity',async()=>{
  const f=fixture(),keys=['cacheDashDigits','cacheCar','cacheBlacktop'];
  f.api.selectScene(keys,{nativeKeys:[]});f.loadAll();await settle();f.api.setRasterDetail({},.25);
  assert.equal(f.calls.length,0);
  const sources=await f.api.waitForGpuSources(keys);assert.equal(sources.length,3);
  const ctx={isGpuScene:true,imageSmoothingEnabled:true,drawImage(...args){this.args=args;}};
  f.api.draw('cacheCar',ctx,{x:0,y:0,width:96});assert.equal(ctx.args[0],f.cache.cacheCar.image);
  assert.equal(sources.find(source=>source.key==='cacheCar').image,ctx.args[0]);
  assert.equal(f.api.diagnostics().nativeRasterPixels,0);assert.equal(f.api.diagnostics().rasterPixels,0);
});
check('road selection awaits every primary original, loads no valid-animation planted fallbacks, and leaves GPU-only copies suppressed',async()=>{
  const f=fixture({standalone:true}),gpuKeys=levelSourceDescriptors().map(source=>source.key),pending=f.api.selectRoadScene(gpuKeys);
  assert.equal(Object.keys(f.cache).length,197);assert.equal(f.cache.cachePersonCrateCarrier,undefined);
  f.loadAll();const result=await pending;
  assert.equal(result.cancelled,false);assert.equal(result.keys.length,197);assert.equal(result.missingKeys.length,0);
  assert.equal(result.fallbackKeys.length,0);assert.equal(f.api.diagnostics().readySources,197);
  assert(f.cache.cacheCar.ready&&f.cache.cacheDashBezel.ready&&f.cache.cacheMirror.ready);
  assert(!f.calls.some(call=>call.image===f.cache.cacheOuterGround.image));
  assert(!f.calls.some(call=>call.image===f.cache.cacheBlacktop.image));
  const level1=f.api.selectLevel1Scene();assert.equal(Object.keys(f.cache).length,28);f.loadAll();
  assert.equal((await level1).length,28);assert(Object.keys(f.cache).every(key=>!key.startsWith('cache')));
  f.resolveAll();await settle();assert.equal(f.api.diagnostics().nativeRasterPixels,0);
});
check('only an exhausted animation activates its original planted fallback and preserves honest failure metadata',async()=>{
  const f=fixture({standalone:true}),gpuKeys=levelSourceDescriptors().map(source=>source.key),pending=f.api.selectRoadScene(gpuKeys);
  const failed=f.cache.cachePersonCrateCarrierTravel,image=failed.image;image.onerror();
  assert.equal(image.src,f.entries.cachePersonCrateCarrierTravel.path);image.onerror();
  for(const state of Object.values(f.cache))if(state!==failed&&state.image.onload)state.image.load();
  await settle();assert(f.cache.cachePersonCrateCarrier);assert.equal(Object.keys(f.cache).length,198);
  assert.equal(f.cache.cachePersonSkateboarder,undefined);f.cache.cachePersonCrateCarrier.image.load();
  const result=await pending;assert.deepEqual(Array.from(result.fallbackKeys),['cachePersonCrateCarrier']);
  assert.deepEqual(Array.from(result.missingKeys),['cachePersonCrateCarrierTravel']);
  assert.equal(f.api.ready('cachePersonCrateCarrier'),true);
  assert(!f.api.gpuSources(gpuKeys).some(source=>source.key==='cachePersonCrateCarrierTravel'));
});
check('a newer scene cancels pending road selection without reintroducing late fallbacks',async()=>{
  const f=fixture({standalone:true}),pending=f.api.selectRoadScene(levelSourceDescriptors().map(source=>source.key));
  const old=f.cache.cachePersonCrateCarrierTravel.image,callback=old.onerror;
  const level1=f.api.selectLevel1Scene();f.loadAll();assert.equal((await level1).length,28);
  assert.equal((await pending).cancelled,true);callback();await settle();
  assert.equal(Object.keys(f.cache).length,28);assert.equal(f.cache.cachePersonCrateCarrier,undefined);
});
check('scoped tint cancellation aborts optional fetch, closes late bitmaps and revokes its owned URL once',async()=>{
  const f=fixture();f.api.selectScene(['cacheBrakeReflection']);
  f.cache.cacheBrakeReflection.image.load(400,290);await settle();
  const tinted=f.images.find(image=>image.src.startsWith('blob:'));assert(tinted);tinted.load(400,290);await settle();
  const count=f.calls.length;assert.equal(count,2);const callback=tinted.onload;
  f.api.releaseScene();assert.equal(f.fetches[0].options.signal.aborted,true);
  assert.equal(tinted.src,'');assert.equal(f.revoked.length,1);
  assert.equal(f.api.diagnostics().nativeSmallPixels,0);f.resolveAll();await settle();
  assert.equal(f.closed.length,count);assert.equal(f.revoked.length,1);
  callback();await settle();assert.equal(f.revoked.length,1);assert.equal(f.api.diagnostics().nativeRasterPixels,0);
});
(async()=>{
  const groups=[];
  for(const test of checks){try{await test.run();groups.push(test.name);}catch(error){error.message='PA scene contract "'+test.name+'": '+error.message;throw error;}}
  const result={passed:true,groups,groupCount:groups.length,sourceSHA256:crypto.createHash('sha256').update(bytes).digest('hex'),
    browserRun:false,pixelAcceptance:false,memoryAcceptance:false};
  if(process.env.PA_SCENE_RECEIPT){const destination=path.resolve(process.env.PA_SCENE_RECEIPT);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n');}
  console.log('Presentation scene lifecycle: '+groups.length+' passed (VM; browser memory checked separately).');
})().catch(error=>{console.error(error);process.exitCode=1;});
