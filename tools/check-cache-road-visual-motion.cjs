// Observe the production car draw, rather than a parallel animation model.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createRig,load}=require('./check-level-01-boss');

function setup(source=fs.readFileSync('src/game/cache-road-proof.js','utf8')) {
  const {w,context}=createRig(),B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};
  load(context,'src/engine/cache-road-proof-profile.js');
  load(context,'src/game/cache-road-landscape.js');
  vm.runInContext(source.replace('  const road = B.CacheRoadProof = {',
    '  window.visualMotionTest={shiftPose,shiftOffset,drawVehicle,CAR_DEPTH};\n  const road = B.CacheRoadProof = {'),context);
  return {w,inspect:w.visualMotionTest};
}

function observeVehicle(r,options={}) {
  const art=[],transforms=[],treads=[];
  const ctx=new Proxy({globalAlpha:1}, {get(target,key){
    if(key in target)return target[key];
    if(key==='translate'||key==='rotate')return (...args)=>transforms.push([key,...args]);
    if(key==='fillRect')return (...args)=>treads.push(args);
    return ()=>{};
  }});
  r.w.BARCODE.PresentationAssets={ready:()=>true,
    draw(key,context,args){if(key.startsWith('cacheCar'))art.push({key,...args});return true;}};
  r.inspect.drawVehicle(ctx,500,800,164,119,'cache',options);
  return {art,transforms,treads};
}

function run() {
  const r=setup(),beatSec=60/128;
  const s={shiftStartBeat:4,musicBeatFloat:0,driveSections:[{beat:4,beatSec}]};
  let checkedWindows=0,minDepth=1,maxDepth=0;
  for(let i=0;i<=1600;i++) {
    s.musicBeatFloat=i/100;
    const pose=r.inspect.shiftPose(s,false);
    minDepth=Math.min(minDepth,pose.depth);maxDepth=Math.max(maxDepth,pose.depth);
    const nearOne=Math.abs(s.musicBeatFloat-Math.round(s.musicBeatFloat/4)*4)*beatSec<=.13;
    if(nearOne) {
      assert.equal(pose.depth,.83,'whole car stays at its contact plane through the press window');
      assert.equal(pose.scale,1,'whole car stays at normal size through the press window');
      assert.equal(pose.offset,0);checkedWindows++;
    }
    const reduced=r.inspect.shiftPose(s,true);
    assert.equal(reduced.depth,.83);assert.equal(reduced.scale,1);
  }
  assert(minDepth<.775,'a gear launch visibly moves the complete car farther away');
  assert(maxDepth>.85,'the load visibly brings the complete car closer');
  const ordinary=[];
  for(const phase of [0,12,29,56,83,115,177]) {
    const draw=observeVehicle(r,{phase});
    assert.equal(draw.art.length,1,'regular Cache is drawn as one complete chassis');
    assert.equal(draw.art[0].frame,0,'ordinary paint does not redraw the chassis each animation tick');
    assert(draw.transforms.filter(item=>item[0]==='rotate').every(item=>item[1]===0),
      'normal driving adds no artificial car roll');
    const moves=draw.transforms.filter(item=>item[0]==='translate').slice(1);
    assert(moves.every(item=>item[1]===0&&item[2]===0),
      'normal driving adds no artificial chassis bounce');
    ordinary.push(draw);
  }
  assert.notDeepEqual(ordinary[0].treads,ordinary[3].treads,
    'stable chassis preserves moving tire tread detail');
  for(const steer of [-1,1]) {
    const turns=[0,25,57,98].map(phase=>observeVehicle(r,{steer,phase}));
    assert(turns.every(item=>item.art.length===1&&item.art[0].frame===0),
      'turning has a stable complete painted chassis too');
    assert.deepEqual(turns[0].transforms,turns[3].transforms,
      'turning does not add periodic frame-to-frame chassis transforms');
  }
  const impacts=[];
  for(let frame=0;frame<8;frame++) {
    const draw=observeVehicle(r,{hit:650-frame*82});
    assert.equal(draw.art.length,1,'impact never draws duplicate body/wheel cels');
    assert.equal(draw.art[0].key,'cacheCarHit');
    impacts.push(draw.art[0].frame);
  }
  assert.deepEqual(impacts,[0,1,2,3,4,5,6,7]);
  const a=observeVehicle(r,{phase:0,reduced:true}),b=observeVehicle(r,{phase:77,reduced:true});
  assert.deepEqual(a,b,'Reduced Motion holds both car paint and wheel tread animation');
  console.log(JSON.stringify({downbeatWindowSamples:checkedWindows,
    depthRange:[minDepth,maxDepth],stableChassisPhases:ordinary.length,
    animatedTreads:true,oneShotImpactFrames:impacts.length,reducedMotion:true}));
}
if(require.main===module)run();
module.exports={setup,run};
