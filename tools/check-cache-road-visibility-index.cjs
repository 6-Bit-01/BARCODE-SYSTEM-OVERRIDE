// Production layout indices must preserve every source object, painter order,
// strict mouth intersection and projected draw argument in both cameras.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {createCanvas}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
// CI needs no Git history. An explicit baseline revision additionally audits
// the checkpoint renderer with only the indexed queries/sampler substituted.
const BASE=process.env.CACHE_INDEX_BASELINE;
const fromBase=file=>execFileSync('git',['show',`${BASE}:${file}`],{encoding:'utf8'});
const landscapeSource=fs.readFileSync('src/game/cache-road-landscape.js','utf8');
const baseRoad=BASE?fromBase('src/game/cache-road-proof.js'):
  fs.readFileSync('src/game/cache-road-proof.js','utf8');
function scannedLayout(source) {
  const before='const streetRange=addressIndex(streets),streetPartRange=addressIndex(streetParts);';
  assert(source.includes(before));
  source=source.replace(before,`const streetRange=(near,far)=>streets.filter(record=>record.at>=near&&record.at<=far),
      streetPartRange=(near,far)=>streetParts.filter(record=>record.at>=near&&record.at<=far);`);
  source=source.replace('const courtRange=addressIndex(courts);',
    'const courtRange=(near,far)=>courts.filter(record=>record.at>=near&&record.at<=far);');
  source=source.replace('const sides=new Map();let entries=0,calls=0,hits=0,computations=0;',
    'maxEntries=0;const sides=new Map();let entries=0,calls=0,hits=0,computations=0;');
  return source;
}
function indexedRoad(source) {
  const changes=[
    ['for(const street of LANDSCAPE.streets) {\n      if(street.at>=progress',
      'for(const street of LANDSCAPE.streetRange(progress-reach,progress)) {\n      if(street.at>=progress'],
    ['const visibleStreetParts=(LANDSCAPE.streetParts||[]).filter(part=>{',
      'const visibleStreetParts=LANDSCAPE.streetPartRange(progress+bankNearDistance,progress+864).filter(part=>{'],
    [`const visibleCourts=(LANDSCAPE.streets||[]).map(street=>({
        side:street.side,at:street.nodes[2].at,family:street.family
      })).filter(court=>{`,
      'const visibleCourts=LANDSCAPE.courtRange(progress+bankNearDistance,progress+864).filter(court=>{'],
    [`const mouths=LANDSCAPE.streets.filter(street=>street.side===side &&
            at<street.at+street.halfWidth &&
            at+62>street.at-street.halfWidth);`,
      'const mouths=LANDSCAPE.streetMouthRange(at,at+62,side);'],
    ['const s = this.state, progress = s.progress;',
      'const s = this.state, progress = s.progress;\n      const heightSample=LANDSCAPE.createFrameHeightSampler();window.indexHeightSample=heightSample;'],
    ['function drawRearRoad(ctx, s, x, y, w, h, accent, reduced) {',
      'function drawRearRoad(ctx, s, x, y, w, h, accent, reduced, heightSample) {'],
    ['function drawRearview(ctx, s, accent, reduced) {',
      'function drawRearview(ctx, s, accent, reduced, heightSample) {'],
    ['drawRearRoad(ctx,s,x,y,w,h,accent,reduced);',
      'drawRearRoad(ctx,s,x,y,w,h,accent,reduced,heightSample);'],
    ["drawRearview(ctx, s, ['#f6adbb', '#f3b276', '#d2a4f9', '#9aefce'][section], reduced);",
      "drawRearview(ctx, s, ['#f6adbb', '#f3b276', '#d2a4f9', '#9aefce'][section], reduced,heightSample);"]
  ];
  for(const [before,after] of changes) {
    assert(source.includes(before),'the comparison patch targets actual checkpoint production code');
    source=source.replace(before,after);
  }
  source=source.replaceAll('LANDSCAPE.height?.(', 'heightSample(');
  return source;
}
function rig(source,layout=landscapeSource) {
  const r=createRig(),{w,context}=r,B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};
  for(const file of ['src/core/gamepad-ui.js','src/engine/cache-road-proof-profile.js',
    'src/game/cache-road-guidance.js','src/game/cache-road-pursuit.js',
    'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
    'src/game/cache-road-boss-art.js'])if(fs.existsSync(file))load(context,file);
  vm.runInContext(layout.replace('return Object.freeze(sample);',
    'window.indexHeightSample=sample;return Object.freeze(sample);'),context);
  vm.runInContext(source.replace('  B.Campaign.register(ID,',
    '  window.indexReview={LANDSCAPE,SIDE_PLACES,newState};\n  B.Campaign.register(ID,'),context);
  return r;
}
const reference=rig(baseRoad,BASE?fromBase('src/game/cache-road-landscape.js'):scannedLayout(landscapeSource));
const candidate=rig(BASE?indexedRoad(baseRoad):baseRoad);
const R=candidate.w.indexReview;
assert.equal(JSON.stringify(R.LANDSCAPE),JSON.stringify(reference.w.indexReview.LANDSCAPE),
  'indices do not change serialized world geometry, contacts, parcel graph or asset inventory');
let queries=0,selectedParts=0,scannedParts=0;
const serialize=value=>JSON.stringify(value);
for(const seed of [0x6b4d,17,92381])for(const end of [9840,15000]) {
  const layout=candidate.w.BARCODE.CacheRoadLandscape.create(seed,end,R.SIDE_PLACES);
  const courts=layout.streets.map(street=>({side:street.side,
    at:street.nodes[2].at,family:street.family}));
  for(let progress=-420;progress<=end+440;progress+=137)for(const span of [0,62,440,1284]) {
    const near=progress,far=progress+span;
    const expectedParts=layout.streetParts.filter(part=>part.at>=near&&part.at<=far);
    const parts=layout.streetPartRange(near,far);
    assert.equal(parts.length,expectedParts.length);
    parts.forEach((part,i)=>assert.strictEqual(part,expectedParts[i],
      'part queries reuse source objects in the original painter order'));
    assert.equal(serialize(layout.streetRange(near,far)),
      serialize(layout.streets.filter(street=>street.at>=near&&street.at<=far)));
    assert.equal(serialize(layout.courtRange(near,far)),
      serialize(courts.filter(court=>court.at>=near&&court.at<=far)),
      'court visibility uses court addresses, not mouth addresses');
    for(const side of [-1,1,undefined])assert.equal(
      serialize(layout.streetMouthRange(near,far,side)),
      serialize(layout.streets.filter(street=>(side===undefined||street.side===side)&&
        near<street.at+street.halfWidth&&far>street.at-street.halfWidth)));
    queries++;selectedParts+=parts.length;scannedParts+=layout.streetParts.length;
  }
  for(const street of layout.streets)for(const delta of [-1e-6,0,1e-6]) {
    const at=street.at+delta;
    assert.equal(serialize(layout.streetRange(at,at)),
      serialize(layout.streets.filter(s=>s.at===at)),'inclusive exact address endpoints');
    const start=street.at+street.halfWidth+delta,end=start+62;
    assert.equal(serialize(layout.streetMouthRange(start,end,street.side)),
      serialize(layout.streets.filter(s=>s.side===street.side&&
        start<s.at+s.halfWidth&&end>s.at-s.halfWidth)),
      'touching a mouth edge alone does not cut away parapet art');
  }
  for(const method of ['streetRange','streetPartRange','courtRange']) {
    assert.equal(layout[method](1,0).length,0);
    assert.equal(layout[method](NaN,0).length,0);
  }
}
// The index captures the immutable address only during generation. A query
// does not revisit every offscreen record; observe production object reads.
let addressReads=0;
for(const part of R.LANDSCAPE.streetParts) {
  const at=part.at;Object.defineProperty(part,'at',{get(){addressReads++;return at;},enumerable:true});
}
R.LANDSCAPE.streetPartRange(1000,1100);
assert.equal(addressReads,0,'query does not scan offscreen street addresses');
R.LANDSCAPE.streetParts.filter(part=>part.at>=1000&&part.at<=1100);
assert(addressReads>=R.LANDSCAPE.streetParts.length);
assert(selectedParts<scannedParts/5,'normal visible queries return a bounded fraction of all street segments');

for(const budget of [0,1,16,1024]) {
  const sample=R.LANDSCAPE.createFrameHeightSampler(budget);
  for(const side of [-1,1])for(let at=-400;at<16000;at+=73)
    for(const radial of [220,310.75,700,2500]) {
      const expected=R.LANDSCAPE.height(side,at,radial);
      assert.equal(sample(side,at,radial),expected);
      assert.equal(sample(side,at,radial),expected,'repeated exact coordinates preserve bit-for-bit height');
    }
  assert(sample.getStats().entries<=budget,'geometry memo cannot outgrow its explicit frame budget');
  assert.equal(sample.getStats().hits,budget,'stored coordinates are reused once in this sweep');
  assert.equal(sample(NaN,1,220),R.LANDSCAPE.height(NaN,1,220));
}
for(const bad of [-1,1.5,Infinity,4097])
  assert.throws(()=>R.LANDSCAPE.createFrameHeightSampler(bad),/budget/);
const first=R.LANDSCAPE.createFrameHeightSampler(),second=R.LANDSCAPE.createFrameHeightSampler();
first(-1,850,310.75);assert.equal(second.getStats().entries,0,'each frame starts with an empty independent memo');

function capture(r,progress,speed,bossFixture=false) {
  const {w}=r,B=w.BARCODE,road=B.CacheRoadProof;
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),trace=[];
  B.PresentationAssets={ready:()=>true,draw:(key,c,args)=>{
    const values=Object.fromEntries(Object.entries(args).map(([name,value])=>
      [name,typeof value==='function'?[value(0),value(1920)]:value]));
    trace.push({key,filter:c.filter,...values});return true;
  }};
  road.state=Object.assign(w.indexReview.newState(),{progress,speed,gear:1,
    lane:1.5,lanePos:1.5,visualLane:1.5,elapsedMs:1900,musicBar:24,
    musicBeatFloat:97,driveSections:[{beat:0,beatSec:60/128,from:0,v0:speed,speed,gear:1}]});
  road.active=true;road.status='playing';road.chapter={records:[],difficultyId:'standard',encounterVersion:2};
  if(bossFixture) {
    const P=B.CacheRoadPursuit,C=B.CacheRoadEncounters;
    assert(P&&C&&B.CacheRoadBossArt,'peak rendering uses the registered production rig art and simulation');
    const s=road.state;s.musicBar=76;s.musicBeatFloat=304;
    road.chapter.encounterVersion=3;road.chapter.difficultyId='overclocked';
    s.encounters=C.create('overclocked',3);
    s.pursuit=P.create({version:3,barFloat:75.9});
    for(let i=0;i<6;i++)P.step(s.pursuit,{before:progress,progress,barFloat:76,
      dt:100,lane:1,difficultyId:'overclocked',actors:[],protectedPulses:[]});
    assert(P.pose(s.pursuit,{progress})?.locked&&P.boss(s.pursuit,{progress})?.health===3);
    s.boostMs=500;s.braceMs=500;s.passFlashMs=500;s.passSide=1;
    s.pulseFlashMs=240;s.cutFlashMs=180;
  }
  road.draw(ctx);
  if(bossFixture)assert(trace.some(draw=>draw.key==='cachePursuitRig'),
    'a peak fixture includes actual main/rear boss atlas submissions');
  return {trace:serialize(trace),pixels:Buffer.from(ctx.getImageData(0,0,1920,1080).data),
    height:w.indexHeightSample?.getStats()};
}
let frames=0,heightCalls=0,heightHits=0;
for(const progress of [0,75,78,130,300,1000,1500,1840,3913,5000,8500,9840])
  for(const speed of [30,70]) {
    const old=capture(reference,progress,speed),now=capture(candidate,progress,speed);
    assert.equal(now.trace,old.trace,'main/rear image submissions and argument order stay exact');
    assert(now.pixels.equals(old.pixels),
      'native production vector/HUD output is pixel-identical with image submissions traced');
    assert(now.height.entries<=1024);heightCalls+=now.height.calls;heightHits+=now.height.hits;
    frames++;
  }
// The same rendering equivalence holds with one actual committed attack and
// the persistent rig body. Effect timers here are presentation fixtures,
// not evidence that the player earned these resources or a human playtest.
if(!BASE)for(const progress of [5000,9000]) {
  const old=capture(reference,progress,70,true),now=capture(candidate,progress,70,true);
  assert.equal(now.trace,old.trace);
  assert(now.pixels.equals(old.pixels));
  assert(now.height.entries<=1024);heightCalls+=now.height.calls;heightHits+=now.height.hits;frames++;
}
assert(heightHits>heightCalls*.35,'real main/rear draw reuses a meaningful share of exact terrain samples');
console.log(`Cache visibility indices passed: ${queries} multi-seed range queries; ${frames} main/rear production frames; identical geometry, source objects/order, image submissions and native vector/HUD pixels. ${selectedParts}/${scannedParts} street candidates returned versus full scans; ${heightHits}/${heightCalls} exact height samples reused. This checks indexed rendering equivalence, not Makko FPS.`);
