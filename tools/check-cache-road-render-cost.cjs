// Exact native main/mirror comparison and bounded production render-work checks.
// These are fixed production-camera diagnostics, not owner/device FPS evidence.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {performance}=require('node:perf_hooks');
const {createCanvas,loadImage,Path2D}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const root=path.resolve(__dirname,'..'),copy=value=>JSON.parse(JSON.stringify(value));
const source=fs.readFileSync(path.join(root,'src/game/cache-road-proof.js'),'utf8');
const manifest=fs.readFileSync(path.join(root,'src/engine/presentation-assets.js'),'utf8');
const marker='  const cache = {};';
async function main() {
  const definitions=createRig();definitions.w.Image=undefined;
  vm.runInContext(manifest.replace(marker,'  window.costEntries=entries;\n'+marker),definitions.context);
  const images=Object.fromEntries(await Promise.all(Object.entries(definitions.w.costEntries)
    .filter(([key])=>key.startsWith('cache')).map(async([key,entry])=>
      [key,await loadImage(path.join(root,entry.path))])));
  function rig(direct=false,factory=true) {
    const r=createRig(),{w,context}=r,B=w.BARCODE,created=[],trace=[];
    B.Campaign={register(){},syncTitleButton(){}};
    B.CacheChapter={recordIds:['lore.l02.01','lore.l02.02','lore.l02.03','lore.l02.04']};
    for(const file of ['src/engine/cache-road-proof-profile.js','src/game/cache-road-landscape.js',
      'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
      'src/game/cache-road-pursuit.js','src/game/cache-road-boss-art.js',
      'src/game/cache-road-combat.js','src/game/cache-road-combat-art.js',
      'src/game/cache-road-crosswalks.js','src/game/cache-road-mirror.js'])load(context,file);
    if(factory)w.Path2D=function(){const path=new Path2D();created.push(path);return path;};
    let code=direct?source.replace('.filter(candidate=>mirrorSceneryInGlass(candidate,x,y,w,h))','')
      .replace('if(terrainBelowCrest) {','if(false) {')
      .replace('if(tintedReflection&&!ctx.shadowBlur&&!ctx.shadowOffsetX&&!ctx.shadowOffsetY) {','if(false) {')
      .replace('if(!unfilteredLightBounds)return;','return;'):source;
    // The original baseline traverses the complete crest for each slab;
    // otherwise the new safe rectangular shortcut also changes the control.
    assert(!direct||code!==source,'comparison disables only off-glass scenery culling');
    code=code.replace('  B.Campaign.register(ID,',
      '  window.costReview={newState,drawRearview,drawCrosswalkPerson,LANDSCAPE};\n  B.Campaign.register(ID,');
    vm.runInContext(code,context);
    w.Image=undefined;w.costImages=images;
    vm.runInContext(manifest.replace(marker,
      '  const cache=Object.fromEntries(Object.entries(window.costImages).map(([key,image])=>[key,{image,ready:true}]));'),context);
    const native=B.PresentationAssets.draw;
    B.PresentationAssets.draw=function(key,c,args){
      trace.push({key,filter:c.filter,...copy(args)});return native(key,c,args);
    };
    const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),commands={lineTo:0};
    const lineTo=ctx.lineTo.bind(ctx);
    ctx.lineTo=(...args)=>{commands.lineTo++;return lineTo(...args);};
    return {...r,created,trace,canvas,ctx,commands,review:w.costReview};
  }
  const old=rig(true,false),now=rig(),fallback=rig(false,false),results=[];
  for(const progress of [180,2680,5160,7620])for(const reduced of [false,true]) {
    const state=Object.assign(now.review.newState(),{progress,elapsedMs:5471,lanePos:1.5,
      visualLane:1.5,musicBar:64,musicBeatFloat:257.2,captures:[],speed:70,gear:2,timeMs:55000});
    for(const r of [old,now,fallback]) {
      r.ctx.reset();r.ctx.fillStyle='#26364a';r.ctx.fillRect(0,0,1920,1080);r.trace.length=0;r.commands.lineTo=0;
      const pose=copy(state),before=JSON.stringify(pose),start=performance.now();
      const road=r.w.BARCODE.CacheRoadProof;road.state=pose;road.active=true;road.status='playing';
      road.chapter={records:[],difficultyId:'standard',encounterVersion:4};
      r.w.BARCODE.Preferences={values:{reducedMotion:reduced}};road.draw(r.ctx);
      r.ms=performance.now()-start;
      assert.equal(JSON.stringify(pose),before,'mirror observation cannot mutate road state');
    }
    let index=0;
    for(const call of now.trace) {
      while(index<old.trace.length&&JSON.stringify(old.trace[index])!==JSON.stringify(call))index++;
      assert(index<old.trace.length,'culling preserves each retained source/cel/blur/projection in original painter order');index++;
    }
    assert.deepEqual(now.trace.filter(call=>call.filter==='none'),old.trace.filter(call=>call.filter==='none'),
      'the full main camera retains every original image submission');
    const reference=Buffer.from(old.ctx.getImageData(0,0,1920,1080).data);
    const candidate=Buffer.from(now.ctx.getImageData(0,0,1920,1080).data);
    const unavailable=Buffer.from(fallback.ctx.getImageData(0,0,1920,1080).data);
    assert(unavailable.equals(reference),'hosts without Path2D retain the exact native frame');
    let changed=0,total=0,max=0;
    for(let i=0;i<reference.length;i++) {
      const delta=Math.abs(reference[i]-candidate[i]);
      if(delta)changed++;total+=delta;max=Math.max(max,delta);
    }
    results.push({progress,reduced,referenceMs:old.ms,candidateMs:now.ms,
      changedComponents:changed,meanComponentDelta:total/reference.length,maxComponentDelta:max,
      images:now.trace.length,referenceImages:old.trace.length,
      canvasLineCalls:now.commands.lineTo,referenceCanvasLineCalls:old.commands.lineTo,
      filteredImages:now.trace.filter(call=>call.filter!=='none').length,
      referenceFilteredImages:old.trace.filter(call=>call.filter!=='none').length});
    assert(candidate.equals(reference),`production pixels changed at ${progress}/${reduced}: ${JSON.stringify(results.at(-1))}`);
    assert(now.commands.lineTo<old.commands.lineTo-500,
      'the native path removes over 500 redundant Canvas vertex submissions per frame');
  }
  assert.equal(now.created.length,results.length,'one native crest path is constructed per actual draw');
  assert(results.some(sample=>sample.filteredImages<sample.referenceFilteredImages),
    'off-glass culling removes genuinely redundant filtered image submissions');
  // The physical contact clock selects both camera cels. Hit age can animate
  // impact paint/throw, but cannot restart any pedestrian walking sequence.
  for(const side of ['left','right'])for(const walkingMs of [211,651,1471]) {
    const frames=[];
    for(const hitAgeMs of [0,200,800,2400,16000]) {
      now.trace.length=0;
      now.review.drawCrosswalkPerson(now.ctx,{side,phase:'hit',walkingMs,hitAgeMs,hitSide:1},
        {x:250,y:290,height:90,reduced:false});
      const body=now.trace.find(call=>call.key===(side==='left'?
        'cachePersonCrateCarrierTravel':'cachePersonHandheldPlayerTravel'));
      assert(body);frames.push(body.frame);
    }
    assert.equal(new Set(frames).size,1,'all later impact ages preserve the contact cel in either view');
    assert.equal(frames[0],Math.floor(walkingMs/210)%(side==='left'?8:4));
  }
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({
    measurements:results,crestPaths:now.created.length,
    limitation:'Native fixed-camera production rendering; no owner/device/Makko FPS claim.'},null,2)+'\n');
  console.log('PASS: exact native main/reflected pixels and retained source order, original blur, one crest path per frame, host fallback, redundant filtered submissions removed and permanently held struck pedestrian cels.');
  console.log(JSON.stringify(results));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
