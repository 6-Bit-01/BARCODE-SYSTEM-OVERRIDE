'use strict';
// Actual standalone adapter with one original atlas and deferred host loads.
// This proves suspend/reload ownership; it does not measure browser memory.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,Image}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/engine/standalone-sprites.js'),'utf8');
const imagePath='assets/sprites-v3/prepared/6_bit_idle_idle.webp',jsonPath='assets/sprites-v3/prepared/6_bit_idle_idle.json';
const metadata=JSON.parse(fs.readFileSync(path.join(root,jsonPath),'utf8'));
const installed=JSON.parse(fs.readFileSync(path.join(root,'sprites-manifest.json'),'utf8'));
const entry={...installed.characters['6_bit_main'].animations['6_bit_idle_idle'],image:imagePath,json:jsonPath};
const manifest={characters:{'6_bit_main':{animations:{'6_bit_idle_idle':entry}}}};
const clone=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes;});return {promise,resolve};};
const flush=async()=>{for(let n=0;n<12;n++)await Promise.resolve();};
const hosts={images:[],imageRequests:0,released:0,delayImage:false,deferredManifest:null};
class OriginalImage extends Image {
  set src(value){
    this.assignedSource=value;
    if(!value){hosts.released++;return;}
    hosts.imageRequests++;this.delayedLoad=hosts.delayImage;
    super.src=fs.readFileSync(path.join(root,imagePath));
  }
  get src(){return this.assignedSource||'';}
  removeAttribute(name){assert.equal(name,'src');this.src='';}
  constructor(){super();hosts.images.push(this);}
}
const w={BARCODE:{},location:{href:'http://localhost/index.html'},console,
  Image:OriginalImage,setTimeout(){throw Error('Adapter must not own timers');},
  requestAnimationFrame(){throw Error('Adapter must not own RAF');},
  fetch:async url=>{
    if(String(url).includes('delayed-manifest'))return hosts.deferredManifest.promise;
    return {ok:true,json:async()=>clone(String(url).endsWith('.json')&&String(url).includes('6_bit_idle')?metadata:manifest)};
  }};
const context=vm.createContext({window:w,URL,console});
vm.runInContext(source,context,{filename:'src/engine/standalone-sprites.js'});
const engine=w.BARCODE.StandaloneSprites;
function render(sprite){
  sprite.play('6_bit_idle_idle',true,3);
  const canvas=createCanvas(420,380);sprite.draw(canvas.getContext('2d'),210,340,{scale:.8,flipH:true,alpha:.71});
  return Buffer.from(canvas.getContext('2d').getImageData(0,0,420,380).data);
}
async function run(){
  await engine.init(manifest);const held=engine.sprite('6_bit_main'),before=render(held),original=held.currentSprite.image;
  assert(before.some(value=>value),'original decoded atlas is visibly painted');
  assert.equal(engine.suspend().releasedSources,1);assert.equal(original.src,'');
  assert.equal(original.onload,null);assert.equal(original.onerror,null);
  assert.equal(engine.isLoaded(),false);assert.equal(engine.sprite('6_bit_main'),null);
  assert.equal(held.isLoaded(),false,'inactive clones cannot treat released originals as ready');
  assert.equal(held.draw(createCanvas(10,10).getContext('2d'),0,0),false,'released clone does not draw');
  assert.equal(engine.suspend().releasedSources,0,'repeat suspension is idempotent');
  await engine.init(manifest);const restored=engine.sprite('6_bit_main');
  assert.notEqual(restored.animations.get('6_bit_idle_idle').image,original,'reload creates a fresh original source');
  assert.deepEqual(render(restored),before,'reload preserves original crop, anchor, alpha and facing pixels');
  const requests=hosts.imageRequests;await engine.init(manifest);assert.equal(hosts.imageRequests,requests,'ready init remains cached');

  engine.suspend();hosts.deferredManifest=deferred();let errors=0,completions=0;
  const old=engine.init('delayed-manifest.json',{onError:()=>errors++,onComplete:()=>completions++});
  const oldCancelled=assert.rejects(old,error=>error.name==='AbortError');engine.suspend();await oldCancelled;
  await engine.init(manifest);hosts.deferredManifest.resolve({ok:true,json:async()=>clone(manifest)});await flush();
  assert(engine.isLoaded());assert.equal(errors,0);assert.equal(completions,0,'cancelled manifest cannot publish callbacks or registry');
  assert.deepEqual(render(engine.sprite('6_bit_main')),before);

  engine.suspend();hosts.delayImage=true;
  // Hold the actual host onload callback after its original bytes are assigned.
  const NativeImage=w.Image;
  w.Image=class extends NativeImage {
    set onload(value){this.pendingOnload=value;}
    get onload(){return this.delayedLoad?null:this.pendingOnload;}
  };
  const pending=engine.init(manifest,{onError:()=>errors++,onComplete:()=>completions++});
  await flush();const pendingImage=hosts.images.at(-1),late=pendingImage.pendingOnload;
  assert.equal(typeof late,'function');const pendingCancelled=assert.rejects(pending,error=>error.name==='AbortError');
  engine.suspend();await pendingCancelled;assert.equal(pendingImage.src,'');
  hosts.delayImage=false;w.Image=NativeImage;await engine.init(manifest);late();await flush();
  assert(engine.isLoaded());assert.equal(errors,0);assert.equal(completions,0,'late image callback cannot revive suspended startup');
  assert.deepEqual(render(engine.sprite('6_bit_main')),before);
  engine.suspend();assert.equal(engine._sourceImages.size,0);assert.equal(engine._imageLoads.size,0);
  console.log(JSON.stringify({passed:true,originalPixelReload:true,sharedCloneReleased:true,
    manifestCancellation:true,imageCancellation:true,lateGenerationGuard:true,idempotentSuspension:true,
    performanceAcceptance:false,limitation:'Production adapter/source ownership proof; browser resident-memory reclamation remains integration evidence.'}));
}
run().catch(error=>{console.error(error.stack);process.exitCode=1;});
