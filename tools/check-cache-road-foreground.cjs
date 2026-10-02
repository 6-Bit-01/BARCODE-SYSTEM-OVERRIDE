// Production Canvas projection: passed cars and grounded scenery must cross
// the viewport edge before culling. No gameplay update or collision is changed.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
function setup() {
  const {w,context}=createRig(),B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};
  load(context,'src/engine/cache-road-proof-profile.js');
  load(context,'src/game/cache-road-landscape.js');
  load(context,'src/game/cache-road-reactions.js');
  const source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
  vm.runInContext(source.replace('  B.Campaign.register(ID,',
    '  window.foregroundEntities={newState,HAZARDS,STREET_ITEMS,SERVICE_LAMPS,SCENERY,STRIKE_DISTANCE,shiftPose};\n  B.Campaign.register(ID,')
    .replace('for(const item of worldPaint)item.draw();',
      'for(const item of worldPaint){window.foregroundArea=item.area;item.draw();}window.foregroundArea=null;'),context);
  const entities=w.foregroundEntities,road=B.CacheRoadProof;
  road.active=true;road.status='playing';road.audioDegraded=false;
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
  let images=[];
  B.PresentationAssets={ready:()=>true,draw(key,c,args){
    assert([args.x,args.y,args.width,args.height].every(Number.isFinite),'finite sprite geometry');
    const m=c.getTransform();
    if(c.filter.includes('blur'))return true;
    const anchor=key==='cachePylon'?(args.flip?.72:.28):.5;
    const corners=[[-anchor*args.width,0],[(1-anchor)*args.width,0],
      [-anchor*args.width,-args.height],[(1-anchor)*args.width,-args.height]]
      .map(([dx,dy])=>({x:m.a*(args.x+dx)+m.c*(args.y+dy)+m.e,
        y:m.b*(args.x+dx)+m.d*(args.y+dy)+m.f}));
    const bounds={left:Math.min(...corners.map(p=>p.x)),right:Math.max(...corners.map(p=>p.x)),
      top:Math.min(...corners.map(p=>p.y)),bottom:Math.max(...corners.map(p=>p.y))};
    images.push({key,...args,bounds,alpha:c.globalAlpha,area:w.foregroundArea});return true;
  }};
  function draw(progress,extra={}) {
    road.state=Object.assign(entities.newState({progress,lane:3,musicBar:24}),extra);
    const before=JSON.stringify(road.state);images=[];ctx.reset();road.draw(ctx);
    assert.equal(JSON.stringify(road.state),before,'foreground rendering cannot change gameplay state');
    return images;
  }
  return {w,B,road,entities,draw,ctx};
}
function run() {
  const r=setup(),original=[...r.entities.HAZARDS];let trafficFrames=0,edgeFrames=0;
  const kinds={van:'cacheCourier',freight:'cacheFreight',block:'cacheBarricade',
    sweeper:'cacheSweeper',trike:'cacheTrike',audit:'cacheAudit',shuttle:'cacheShuttle'};
  // Fixed world actors use the exact production projection, paints and
  // suspension. A broad draw bound may retain invisible work briefly; it
  // must never delete a visible silhouette at the old contact/distance cap.
  for(const [kind,key] of Object.entries(kinds))for(const lane of [0,1,2,3]) {
    r.entities.HAZARDS.splice(0,r.entities.HAZARDS.length,{at:500,lane,kind});
    let lastBottom=-Infinity,lastVisible=null,wasDrawn=false;
    for(const d of [40,0,-1,-45,-80,-100,-120,-140,-160,-180,-200,-220,-250,-365]) {
      const sprites=r.draw(500-d).filter(a=>a.key===key);
      trafficFrames++;
      if(d>=-100)assert(sprites.length,`${kind} lane ${lane} survives its old foreground cutoff at ${d}`);
      if(!sprites.length) {
        if(wasDrawn)assert(lastVisible===null,
          `${kind} must finish moving beyond the frame before its draw disappears`);
        continue;
      }
      wasDrawn=true;
      const top=Math.min(...sprites.map(a=>a.bounds.top));
      const bottom=Math.max(...sprites.map(a=>a.bounds.bottom));
      assert(bottom>lastBottom,`${kind} continues down the screen instead of freezing at depth 1`);
      lastBottom=bottom;
      lastVisible=sprites.find(a=>a.bounds.top<1080&&a.bounds.right>0&&a.bounds.left<1920)||null;
      if(bottom>1080&&top<1080)edgeFrames++;
    }
    assert.equal(lastVisible,null,`${kind} fully leaves the foreground`);
  }
  // Turning into a just-passed lane must put the nearer complete traffic
  // sprite in front of Cache. Use actual production shift depth, not d=0.
  let occlusionFrames=0;
  r.B.Preferences={values:{reducedMotion:false}};
  for(const reduced of [false,true])for(const age of [0,.6,1.8]) {
    r.B.Preferences.values.reducedMotion=reduced;
    for(const d of [60,20,0,-10,-30]) {
      r.entities.HAZARDS.splice(0,r.entities.HAZARDS.length,{at:500,lane:2,kind:'van'});
      const art=r.draw(500-d,{visualLane:1.65,lanePos:1.65,musicBeatFloat:4+age,
        shiftStartBeat:4,driveSections:[{beat:4,beatSec:60/128,from:500-d-age*52*60/128,v0:52,speed:52,gear:1}]});
      const cacheIndex=art.findIndex(a=>a.key==='cacheCar');
      const trafficIndexes=art.map((a,i)=>a.key==='cacheCourier'?i:-1).filter(i=>i>=0);
      assert(cacheIndex>=0&&trafficIndexes.length,'both complete vehicle sprites are present');
      const carPose=r.entities.shiftPose(r.road.state,reduced);
      const nearer=1-(d+80)/520>carPose.depth;
      assert(trafficIndexes.every(i=>nearer?i>cacheIndex:i<cacheIndex),
        'all traffic chassis/wheel draws use the same correct side of the current Cache ground depth');
      assert(Math.max(...trafficIndexes)<art.findIndex(a=>a.key==='cacheDashBezel'),
        'foreground traffic remains below the dashboard layer');
      occlusionFrames++;
    }
  }
  r.B.Preferences.values.reducedMotion=false;
  r.entities.HAZARDS.splice(0,r.entities.HAZARDS.length,
    {at:470,lane:1,kind:'freight'},{at:490,lane:2,kind:'van'});
  const convoy=r.draw(500),keys=convoy.map(a=>a.key);
  assert(keys.indexOf('cacheCourier')>keys.indexOf('cacheCar')&&
    keys.indexOf('cacheFreight')>keys.lastIndexOf('cacheCourier'),
    'passed vehicles are sorted from farther to nearer after Cache');
  // Production native draws of arranged combat addresses: owner-local
  // feedback must remain visible above its chassis while a nearer road body
  // can still occlude it. These paint fixtures are not played-race evidence.
  const combatRig=setup(),paint=[],c=combatRig.ctx;
  let poseReads=0;
  const pose={actors:[{id:'paint-bike',kind:'bike',at:500,lane:1,phase:'committed',lockLane:1,hp:2,maxHp:2}],
    wrecks:[],projectiles:[{at:500,lane:1,kind:'shot',friendly:false}],
    target:{at:500,lane:1},boss:{at:500,lane:2,phase:'recover',health:2,hp:8,maxHp:12},
    skills:{attack:{},turbo:{},defend:{},disrupt:{}},syncCount:0,benefits:{power:1,ammoMs:6000}};
  const record=name=>{if(!c.filter.includes('blur'))paint.push(name);};
  combatRig.B.CacheRoadCombat={pose(){poseReads++;return pose;}};
  combatRig.B.CacheRoadCombatArt={drawBody(){record('combatBody');return true;},
    drawFX(_ctx,args){record(args.frame===1?'projectile':'hitFX');return true;}};
  combatRig.B.CacheRoadBossArt={drawRig(){record('rigBody');return true;},
    drawImpact(){record('rigImpact');return true;}};
  const assetDraw=combatRig.B.PresentationAssets.draw;
  combatRig.B.PresentationAssets.draw=function(key,...args){
    if(key==='cacheCar')record('Cache');
    if(key==='cacheCourier')record('nearerTraffic');
    return assetDraw.call(this,key,...args);
  };
  for(const [method,styles] of [['strokeRect',{'#ff9d8a':'lock','#ecffd2':'target','#ffb08d':'projectileLock'}],
    ['fillRect',{'#ffb39b':'hp'}]]) {
    const native=c[method];c[method]=function(...args){
      const name=styles[method==='strokeRect'?this.strokeStyle:this.fillStyle];
      if(name)record(name);return native.apply(this,args);
    };
  }
  combatRig.entities.HAZARDS.splice(0,combatRig.entities.HAZARDS.length,{at:460,lane:1,kind:'van'});
  let combatPaintFrames=0;
  for(const reduced of [false,true])for(const d of [60,-30]) {
    combatRig.B.Preferences={values:{reducedMotion:reduced}};
    paint.length=0;poseReads=0;
    combatRig.draw(500-d,{combat:{defendMs:0},elapsedMs:100,
      bossImpact:{id:'rig',atMs:50,systemIndex:0},
      combatFx:[{at:500,lane:1,atMs:50,duration:1000,type:'hit'}]});
    assert.equal(poseReads,1,'front, mirror, rig and HUD reuse one combat observation');
    const index=name=>{const i=paint.indexOf(name);assert(i>=0,`${name} is painted`);return i;};
    for(const feedback of ['lock','hp','projectile','projectileLock','hitFX','target']) {
      assert(index('combatBody')<index(feedback),`${feedback} remains above its own hostile chassis`);
      assert(d>0?index(feedback)<index('Cache'):index(feedback)>index('Cache'),
        `${feedback} stays on the owner's side of Cache`);
      assert(index(feedback)<index('nearerTraffic'),`${feedback} remains behind nearer traffic`);
    }
    assert(index('rigBody')<index('rigImpact'),'rig impact remains above the rig chassis');
    assert(d>0?index('rigImpact')<index('Cache'):index('rigImpact')>index('Cache'),
      'rig impact stays on the rig side of Cache');
    assert(index('rigImpact')<index('nearerTraffic'),'nearer traffic occludes rig feedback');
    combatPaintFrames++;
  }
  r.entities.HAZARDS.splice(0,r.entities.HAZARDS.length,...original);
  let padFrames=0;
  for(const d of [0,-30,-65,-90]) {
    const progress=500-d;
    const musicBeatFloat=4+(progress-(500-r.entities.STRIKE_DISTANCE))/(52*60/128);
    const art=r.draw(progress,{musicBeatFloat,pulseTargets:{'0/0/0':4},pulsePlaces:{'0/0/0':500}});
    assert(art.some(a=>a.key==='cachePulsePad'),
      'committed musical road paint continues behind the timing line until it exits the screen');
    padFrames++;
  }
  assert(!r.draw(616,{musicBeatFloat:14,pulseTargets:{'0/0/0':4},pulsePlaces:{'0/0/0':500}})
    .some(a=>a.key==='cachePulsePad'),'passed pad stops only beyond the bottom edge');
  // Whole real source cards/props remain after their contact passes. Tall
  // lamps continue even when the foot is below the viewport, on either bank.
  const records=[];
  for(let progress=0;progress<=2000;progress+=10) {
    for(const art of r.draw(progress)) {
      if(!art.area||!['life','satellite','cluster','plate','place','pylon'].includes(art.area.kind))continue;
      const t=(525/620)*Math.pow(Math.max(0,(1200-(art.area.at-progress))/1200),3.1);
      if(art.area.at>=progress||art.bounds.top>=1080||art.bounds.right<=0||art.bounds.left>=1920)continue;
      records.push({key:art.key,kind:art.area.kind,at:art.area.at,side:art.area.side??art.area.scene?.side,progress,depth:t,bounds:art.bounds});
    }
  }
  assert(records.some(row=>row.kind==='life'),'grounded roadside props/people remain until they reach the outer edge after passing');
  assert(records.some(row=>row.kind==='pylon'&&row.bounds.bottom>1080),
    'tall lamps remain when their foot is below the frame but their head is visible');
  assert(new Set(records.map(row=>row.side)).size===2,'both banks retain partially visible foreground objects');
  assert(fs.readFileSync('src/game/cache-road-proof.js','utf8').includes("ctx.filter = 'blur(2.3px)'"),
    'rearview blur stays exact');
  const report={trafficKinds:Object.keys(kinds).length,lanes:4,trafficFrames,padFrames,occlusionFrames,combatPaintFrames,partlyBelowScreenFrames:edgeFrames,
    continuedRoadsideFrames:records.length,roadsideExamples:records.filter(row=>row.kind==='life').slice(0,8),
    pureRendering:true,mirrorBlur:'2.3px'};
  console.log(JSON.stringify(report));return report;
}
if(require.main===module)run();
module.exports={setup,run};
