// Actual production-camera transitions and conservative native rendering work.
// Native timings diagnose host CPU cost; they are not device or Makko FPS.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createHash}=require('node:crypto');
const {performance}=require('node:perf_hooks');
const {createCanvas,loadImage,Path2D}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const root=path.resolve(__dirname,'..'),copy=value=>JSON.parse(JSON.stringify(value));
const source=fs.readFileSync(path.join(root,'src/game/cache-road-proof.js'),'utf8');
const manifest=fs.readFileSync(path.join(root,'src/engine/presentation-assets.js'),'utf8');
const marker='  const cache = {};',modules=['src/engine/cache-road-proof-profile.js',
  'src/game/cache-road-landscape.js','src/game/cache-road-guidance.js',
  'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
  'src/game/cache-road-pursuit.js','src/game/cache-road-boss-art.js',
  'src/game/cache-road-adrenaline.js',
  'src/game/cache-road-combat.js','src/game/cache-road-combat-art.js',
  'src/game/cache-road-crosswalks.js','src/game/cache-road-mirror.js',
  'src/game/cache-road-crew-callouts.js','src/game/cache-road-instruments.js',
  'src/game/cache-road-beat-feedback.js','src/game/cache-road-cinematics.js'];
const fingerprint=()=>Object.fromEntries(['src/game/cache-road-proof.js',
  'src/engine/presentation-assets.js',...modules,'tools/check-cache-camera-frame-time.cjs']
  .filter(file=>fs.existsSync(path.join(root,file))).map(file=>[file,
    createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
function rig(images,referenceMode=null) {
  const r=createRig(),{w,context}=r,B=w.BARCODE,trace=[];
  B.Campaign={register(){},syncTitleButton(){}};B.CacheChapter={recordIds:[]};
  for(const file of modules)if(fs.existsSync(path.join(root,file)))load(context,file);
  w.Path2D=Path2D;
  let code=source;
  if(referenceMode) {
    code=code.replace(/const quadInFrame = points =>[\s\S]+?;\n/,'const quadInFrame = points => true;\n');
    if(referenceMode==='unculled') {
      code=code.replace(/const inFrame = \(x,y,width,height,anchor=\.5,padding=0\) =>[\s\S]+?;\n/,
        'const inFrame = (x,y,width,height,anchor=.5,padding=0) => true;\n');
      code=code.replaceAll('if(x+width*.5<worldViewport.left||x-width*.5>worldViewport.right)return;','');
    } else {
    code=code.replace(/const inFrame = \(x,y,width,height,anchor=\.5,padding=0\) =>[\s\S]+?;\n/,
      'const inFrame = (x,y,width,height,anchor=.5,padding=0) => x+width*(1-anchor)+padding>=0 && x-width*anchor-padding<=1920 && y+padding>=0 && y-height-padding<=1080;\n');
    code=code.replaceAll('if(x+width*.5<worldViewport.left||x-width*.5>worldViewport.right)return;',
      'if(x+width*.5<0||x-width*.5>1920)return;');
    code=code.replace('if(!quadInFrame([[fi.x,fi.y],[fo.x,fo.y],[ni.x,ni.y],[no.x,no.y]]))return;',
      'if(Math.max(fi.x,fo.x,ni.x,no.x)<0||Math.min(fi.x,fo.x,ni.x,no.x)>1920||Math.min(fi.y,fo.y,ni.y,no.y)>1080)return;');
    }
    assert.notEqual(code,source,'reference retains original pre-camera culling and unculled street submissions');
  }
  code=code.replace('  B.Campaign.register(ID,',
    '  window.cameraFrameReview={newState,speedCamera,advanceCamera,cameraViewport,cameraPoint,CAMERA_PIVOT_Y};\n  B.Campaign.register(ID,');
  vm.runInContext(code,context);
  if(images) {
    w.Image=undefined;w.cameraImages=images;
    vm.runInContext(manifest.replace(marker,
      '  const cache=Object.fromEntries(Object.entries(window.cameraImages).map(([key,image])=>[key,{image,ready:true}]));'),context);
    const draw=B.PresentationAssets.draw;
    B.PresentationAssets.draw=function(key,ctx,args) {
      trace.push({key,filter:ctx.filter,...copy(args)});return draw(key,ctx,args);
    };
  }
  return {...r,review:w.cameraFrameReview,trace};
}
async function main() {
  const initialSources=fingerprint();
  const logic=rig(),{review:fx}=logic;
  const neutral={zoom:1,x:0,y:0,roll:0},states=[];
  for(const fps of [24,30,60,120])for(const steer of [-1,0,1]) {
    const state=Object.assign(fx.newState(),{speed:75,boostMs:500,steer,elapsedMs:84120,
      musicBeatFloat:390,passFlashMs:430,passSide:steer||1,stumbleMs:0});
    for(let frame=0;frame<fps;frame++)fx.advanceCamera(state,1000/fps);
    const before=JSON.stringify(state),live=copy(fx.speedCamera(state));
    assert.deepEqual(copy(fx.speedCamera(state,{playing:false,outroMs:0})),live,
      'earned clear keeps the live zoom, offset and roll on departure frame zero');
    assert.deepEqual(copy(fx.speedCamera(state,{playing:false,outroMs:1100})),neutral,
      'existing departure clock smoothly settles to the full horizon view');
    let previous=live,maxStep=0;
    for(let ms=1000/fps;ms<1100;ms+=1000/fps) {
      const pose=fx.speedCamera(state,{playing:false,outroMs:ms});
      const a=fx.cameraPoint(previous,200,0),b=fx.cameraPoint(pose,200,0);
      maxStep=Math.max(maxStep,Math.hypot(b.x-a.x,b.y-a.y));
      for(const key of ['zoom','x','y','roll'])assert(Math.abs(pose[key]-neutral[key])<=Math.abs(previous[key]-neutral[key])+1e-12);
      previous=pose;
    }
    assert(maxStep<24,'departure cannot produce the old several-hundred-pixel one-frame camera jump');
    assert.deepEqual(copy(fx.speedCamera(state,{playing:false,outroMs:0,reduced:true})),neutral);
    assert.deepEqual(copy(fx.speedCamera(state,{playing:false})),neutral,'ordinary result screens retain their historical full view');
    assert.equal(JSON.stringify(state),before,'camera observation never advances gameplay or presentation state');
    states.push({fps,steer,start:live,maxWorldPointStep:maxStep});
  }
  for(const camera of [{zoom:1,x:30,y:6,roll:.017},
    {zoom:1,x:-30,y:-6,roll:-.017},{zoom:1.335,x:42,y:14,roll:.02},neutral]) {
    const bounds=fx.cameraViewport(camera);
    for(const x of [0,1920])for(const y of [0,1080]) {
      const cos=Math.cos(camera.roll),sin=Math.sin(camera.roll),dx=x-960-camera.x,
        dy=y-fx.CAMERA_PIVOT_Y-camera.y;
      const wx=960+(dx*cos+dy*sin)/camera.zoom,
        wy=fx.CAMERA_PIVOT_Y+(-dx*sin+dy*cos)/camera.zoom;
      assert(wx>=bounds.left&&wx<=bounds.right&&wy>=bounds.top&&wy<=bounds.bottom,
        'inverse world bounds contain every actual viewport corner');
      const actual=fx.cameraPoint(camera,wx,wy);
      assert(Math.abs(actual.x-x)<1e-9&&Math.abs(actual.y-y)<1e-9,
        'inverse geometry agrees with the production forward camera transform');
    }
    assert(bounds.left<bounds.right&&bounds.top<bounds.bottom);
  }
  const definitions=createRig();definitions.w.Image=undefined;
  vm.runInContext(manifest.replace(marker,'  window.cameraEntries=entries;\n'+marker),definitions.context);
  const images=Object.fromEntries(await Promise.all(Object.entries(definitions.w.cameraEntries)
    .filter(([key])=>key.startsWith('cache')).map(async([key,entry])=>
      [key,await loadImage(path.join(root,entry.path))])));
  const candidate=rig(images),reference=rig(images,'previous'),unculled=rig(images,'unculled'),results=[];
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
  let clips=0;const clip=ctx.clip.bind(ctx);ctx.clip=(...args)=>{clips++;return clip(...args);};
  const poses=[{name:'full',speed:30,steer:0,reduced:false},
    {name:'focused-left',speed:75,steer:-1,reduced:false},
    {name:'focused-right',speed:75,steer:1,reduced:false},
    {name:'reduced',speed:75,steer:1,reduced:true}];
  for(const progress of [180,2680,5160,7620])for(const pose of poses) {
    const state=Object.assign(candidate.review.newState(),{progress,elapsedMs:84120,
      lane:1,lanePos:1.5,visualLane:1.5,speed:pose.speed,steer:pose.steer,gear:2,
      musicBar:64,musicBeatFloat:257.2,timeMs:55000});
    let fixture=null;
    if(progress>=2680&&pose.name.startsWith('focused')) {
      const B=candidate.w.BARCODE,C=B.CacheRoadEncounters,combat=B.CacheRoadCombat;
      state.encounters=C.create('overclocked',4);
      for(let bar=58;bar<=64;bar++)C.commit(state.encounters,
        {beat:bar*4,beatSec:60/128,from:progress-(64-bar)*4*60/128*pose.speed,
          v0:pose.speed,speed:pose.speed,gear:2},0);
      state.combat=combat.create({difficultyId:'overclocked'});
      for(let frame=0;frame<420;frame++)combat.step(state.combat,50,{
        progress:progress-420*pose.speed*.05+(frame+1)*pose.speed*.05,
        lanePos:1.5,speed:pose.speed,bar:64,syncCount:4,invulnerableMs:1e6,
        actors:C.hazards(state.encounters)});
      state.adrenaline=B.CacheRoadAdrenaline.create({value:85});
      state.captures=[0,1,2,3].map(lane=>({lane,startBeat:252,endBeat:272}));
      fixture={bar:64,chartVersion:4,civilianActors:C.hazards(state.encounters).length,
        combatActors:combat.pose(state.combat,{progress,lanePos:1.5,syncCount:4}).actors.length,
        stagedProductionController:true};
    }
    for(let frame=0;frame<60;frame++)candidate.review.advanceCamera(state,1000/60,{reduced:pose.reduced});
    const samples=[];
    for(const r of [reference,candidate,unculled]) {
      r.trace.length=0;clips=0;ctx.reset();ctx.fillStyle='#ff00ff';ctx.fillRect(0,0,1920,1080);
      const road=r.w.BARCODE.CacheRoadProof;road.active=true;road.status='playing';
      road.chapter={records:[],difficultyId:'standard',encounterVersion:4};road.state=copy(state);
      r.w.BARCODE.Preferences={values:{reducedMotion:pose.reduced}};
      const before=JSON.stringify(road.state),start=performance.now();road.draw(ctx);
      samples.push({ms:performance.now()-start,clips,images:r.trace.length,
        pixels:Buffer.from(ctx.getImageData(0,0,1920,1080).data)});
      assert.equal(JSON.stringify(road.state),before,'native draw cannot mutate simulation/camera state');
    }
    assert(samples[0].pixels.equals(samples[1].pixels),`conservative culling changed native pixels at ${progress}/${pose.name}`);
    assert(samples[2].pixels.equals(samples[1].pixels),`fully unculled production rendering changed native pixels at ${progress}/${pose.name}`);
    let cursor=0;
    for(const call of candidate.trace) {
      while(cursor<unculled.trace.length&&JSON.stringify(unculled.trace[cursor])!==JSON.stringify(call))cursor++;
      assert(cursor<unculled.trace.length,`retained asset/source/cel/blur/coordinates keep original painter order at ${progress}/${pose.name}: ${JSON.stringify(call)}`);cursor++;
    }
    results.push({progress,pose:pose.name,fixture,camera:copy(candidate.review.speedCamera(state,{reduced:pose.reduced})),
      referenceMs:samples[0].ms,candidateMs:samples[1].ms,referenceClips:samples[0].clips,
      candidateClips:samples[1].clips,referenceImages:samples[0].images,candidateImages:samples[1].images,
      exactPixels:true});
  }
  assert(results.some(row=>row.candidateClips<row.referenceClips&&row.candidateImages<row.referenceImages),
    'real out-of-view projected streets/terrain remove Canvas clips and image submissions');
  // A trailing near-neutral camera can expose pixels outside the old world
  // rectangle. Paint over a sentinel previous frame to reproduce stale edges.
  for(const cameraMotion of [{zoom:1,x:30,y:6,roll:.017},
    {zoom:1,x:-30,y:-6,roll:-.017}]) {
    const road=candidate.w.BARCODE.CacheRoadProof;
    road.state=Object.assign(candidate.review.newState(),{cameraMotion:{...cameraMotion,
      velocity:{zoom:0,x:0,y:0,roll:0}}});road.status='playing';
    candidate.w.BARCODE.Preferences={values:{reducedMotion:false}};
    ctx.reset();ctx.fillStyle='#ff00ff';ctx.fillRect(0,0,1920,1080);road.draw(ctx);
    for(const x of [0,1,1918,1919])for(const y of [180,360,700,1078,1079]) {
      const rgba=Array.from(ctx.getImageData(x,y,1,1).data);
      assert(!(rgba[0]===255&&rgba[1]===0&&rgba[2]===255),`camera left stale previous-frame pixels at ${x}/${y}`);
      assert.equal(rgba[3],255,'every exposed edge is covered by the current opaque world');
    }
  }
  assert.deepEqual(fingerprint(),initialSources,'all production and probe source bytes remain fixed across the native run');
  const report={sourceHashes:initialSources,transitions:states,rendering:results,
    limitation:'Fixed native production transforms and host CPU diagnostics, not device or Makko FPS.'};
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log('PASS: live-to-departure camera continuity at 24/30/60/120 Hz, neutral comfort, immutable clocks, opaque shifted-frame edges, exact native culling pixels/source order and bounded Canvas work reduction.');
  console.log(JSON.stringify(results));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
