// Production lamp layout, source-lens registration and real world draw order.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const {w,context}=createRig(),B=w.BARCODE;
B.Campaign={register(){},syncTitleButton(){}};
load(context,'src/engine/cache-road-proof-profile.js');
load(context,'src/game/cache-road-landscape.js');
w.lampCalls=[];
const source=fs.readFileSync('src/game/cache-road-proof.js','utf8')
  .replace('  function drawLampLight(ctx,key,args,pass) {',
    '  function drawLampLight(ctx,key,args,pass) {if(LAMP_LIGHTS[key])window.lampCalls.push({key,args,pass,mirror:ctx.filter.includes("blur")});')
  .replace('      for(const item of worldPaint)item.draw();',
    '      window.lampCalls.push({pass:"worldQueue"});for(const item of worldPaint)item.draw();')
  .replace('  B.Campaign.register(ID,',
    '  window.lampReview={SERVICE_LAMPS,SERVICE_LAMP_SPACING,SERVICE_LAMP_HEIGHT,SERVICE_LAMP_WIDTH,LAMP_LIGHTS,lampLightGeometry,drawLampLight,STREET_ITEMS,LANDSCAPE,newState};\n  B.Campaign.register(ID,');
vm.runInContext(source,context);
const L=w.lampReview,road=B.CacheRoadProof;
assert.equal(L.SERVICE_LAMP_HEIGHT,260);
assert.equal(L.SERVICE_LAMP_WIDTH/214,L.SERVICE_LAMP_HEIGHT/400,
  'the complete service light scales uniformly to 65%');
assert.equal(L.SERVICE_LAMP_SPACING,308);
for(const side of [-1,1]) {
  const fixtures=L.SERVICE_LAMPS.filter(l=>l.side===side).sort((a,b)=>a.at-b.at);
  assert(fixtures.length>25&&fixtures.length<54);
  assert(fixtures.every((lamp,i)=>!i||lamp.at-fixtures[i-1].at>=308),
    'same-side service lamps stay at least 308 world units apart');
  for(const lamp of fixtures) {
    assert(!L.LANDSCAPE.streets.some(street=>street.side===side&&
      Math.abs(street.at-lamp.at)<street.halfWidth+28),'lamp bases leave street mouths clear');
    assert(!L.STREET_ITEMS.some(r=>r.scene.side===side&&L.LAMP_LIGHTS[r.item.key]&&
      Math.abs(r.at-lamp.at)<180),'service lamps cannot crowd decorative corner lamps');
    assert(!L.SERVICE_LAMPS.some(other=>other.side!==side&&other.at===lamp.at),
      'the road has no synchronized opposite service-lamp pairs');
  }
}
for(const key of Object.keys(L.LAMP_LIGHTS)) {
  const args={x:300,y:400,width:139.1,height:260,lampGround:x=>400+(x-300)*.1};
  const points=L.lampLightGeometry(key,args);
  const mirrored=L.lampLightGeometry(key,{...args,flip:true});
  assert(points.every((point,i)=>point.y<point.groundY&&
    point.lensRadius<point.poolRadius&&Math.abs(point.x+mirrored[i].x-600)<1e-9&&
    point.groundY===args.lampGround(point.x)),
  'each transparent ray starts at its reflected painted lens and lands on local terrain');
}
// A real Canvas confirms that the ground ellipse has a soft edge and that
// missing sprite delivery does not leave disembodied light behind.
const c=createCanvas(500,500),ctx=c.getContext('2d');
B.PresentationAssets={ready:()=>true,draw:()=>true};
const args={x:120,y:390,width:139.1,height:260};
L.drawLampLight(ctx,'cacheNewLampL',args,'pool');
const point=L.lampLightGeometry('cacheNewLampL',args)[0];
const alpha=(x,y)=>ctx.getImageData(Math.round(x),Math.round(y),1,1).data[3];
assert(alpha(point.x,point.groundY)>alpha(point.x+point.poolRadius*.7,point.groundY));
assert.equal(alpha(point.x+point.poolRadius+2,point.groundY),0);
ctx.clearRect(0,0,500,500);B.PresentationAssets.ready=()=>false;
L.drawLampLight(ctx,'cacheNewLampL',args,'pool');
assert.equal(alpha(point.x,point.groundY),0);
B.PresentationAssets.ready=()=>true;
const world=createCanvas(1920,1080),worldCtx=world.getContext('2d');
const seen=new Set();
for(const progress of [0,140,310,620,1050,1650,2450,4600,7900,9400,13700]) {
  road.state=L.newState({progress,lane:1,lanePos:1,musicBar:8,integrity:3});
  road.active=true;road.audioDegraded=false;w.lampCalls.length=0;
  worldCtx.reset();road.draw(worldCtx);
  const boundary=w.lampCalls.findIndex(call=>call.pass==='worldQueue');
  assert(boundary>=0);
  const main=w.lampCalls.filter(call=>!call.mirror&&call.pass!=='worldQueue');
  for(const call of main) {
    seen.add(call.key);
    assert(call.pass==='pool'?w.lampCalls.indexOf(call)<boundary:w.lampCalls.indexOf(call)>boundary,
      'main ground light precedes all foreground actors; beams share their lamp depth');
  }
  const rear=w.lampCalls.filter(call=>call.mirror);
  if(rear.length) {
    const firstBeam=rear.findIndex(call=>call.pass==='beam');
    assert(rear.every((call,i)=>call.pass!=='pool'||i<firstBeam),
      'mirror pools precede the mirror actor queue');
    if(L.SERVICE_LAMPS.some(l=>l.at<progress&&l.at>progress-440))assert(rear.some(call=>call.key==='cachePylon'&&call.pass==='beam'),
      'service lamps use the same real world addresses in the rearview');
  }
}
assert.deepEqual([...seen].sort(),Object.keys(L.LAMP_LIGHTS).sort(),
  'production main views exercise all three lamp paintings and lighting routes');
console.log(`Cache Road lamps passed: ${L.SERVICE_LAMPS.length} spaced service fixtures, 3 lens contracts, grounded main/mirror light.`);
