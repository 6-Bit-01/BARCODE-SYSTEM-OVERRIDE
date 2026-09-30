// The owner-reported long fenced substation is a left-only source. Exercise
// its actual generation and both production cameras, not filename guesses.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const {w,context}=createRig(),B=w.BARCODE;
B.Campaign={register(){},syncTitleButton(){}};
load(context,'src/engine/cache-road-proof-profile.js');
load(context,'src/game/cache-road-landscape.js');
vm.runInContext(fs.readFileSync('src/game/cache-road-proof.js','utf8').replace(
  '  B.Campaign.register(ID,',
  '  window.bankArtReview={PLACE_ART,PLACE_BANK_RULES,SIDE_VARIANTS,SIDE_PLACES,LANDSCAPE,SATELLITE_SCENES,SCENERY,newState};\n  B.Campaign.register(ID,'),context);
const R=w.bankArtReview,key='cachePlaceSubstation';
assert.equal(R.PLACE_BANK_RULES[key].side,-1);
assert.equal(R.PLACE_BANK_RULES[key].flip,false);
const artFor=place=>R.SIDE_VARIANTS[place.variant]?.art||R.PLACE_ART[place.kind];
const base=R.SIDE_PLACES.filter(place=>artFor(place)?.[0]===key);
assert.deepEqual(Array.from(base,p=>p.at).sort((a,b)=>a-b),[1811,10667,11936]);
assert(base.every(place=>place.side===-1),'the fenced source is generated only on the left');
for(const item of R.SCENERY) {
  const art=item.place?artFor(item.place):item.plate?.art||item.scene?.art;
  const rule=R.PLACE_BANK_RULES[art?.[0]];
  assert(!rule||item.side===rule.side,'all scenery routes respect source bank restrictions');
}
const corrected=[2939,3913,12944].map(at=>R.SIDE_PLACES.find(p=>p.side===1&&p.at===at));
for(const place of corrected) {
  assert(place&&place.kind==='substation');
  const variant=R.SIDE_VARIANTS[place.variant];
  assert.equal(variant.side,1);assert.equal(variant.kind,place.kind);
  assert.equal(artFor(place)[0],'cachePlaceCapacitorExchange');
  assert.equal(place.frontageHalfAlong,50*680/700*place.size,
    'replacement art keeps the original conservative lot reservation');
}
assert.equal(corrected[0].setback,39,'the reported site retains its original depth');
assert.equal(R.LANDSCAPE.plates.length,139,'no surrounding building is added or removed');
assert.equal(new Set(R.LANDSCAPE.plates.filter(p=>p.key!=='accent').map(p=>p.art[0])).size,48);
assert.equal(R.LANDSCAPE.streets.length,25,'all existing street sockets remain');
assert.equal(R.SATELLITE_SCENES.length,17,'contextual frontages are unchanged');
const road=B.CacheRoadProof,canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
let main=[],rear=[];
B.PresentationAssets={ready:()=>true,draw:(asset,c,args)=>{
  (c.filter.includes('blur')?rear:main).push({key:asset,...args});return true;
}};
let observations=0;
for(const place of [...base,...corrected])for(const view of ['main','rear']) {
  const progress=place.at+(view==='main'?-240:240);
  road.state=R.newState({progress,lane:1,lanePos:1,musicBar:24,integrity:3});
  road.active=true;road.audioDegraded=false;main=[];rear=[];ctx.reset();road.draw(ctx);
  const expected=artFor(place)[0],calls=view==='main'?main:rear;
  const painted=calls.filter(call=>call.key===expected);
  assert(painted.length,`${expected} reaches the actual ${view} draw at ${place.at}`);
  assert(painted.every(call=>call.flip===(place.side>0)),
    'left source remains unmirrored; approved right replacement keeps its authored orientation');
  if(view==='main')assert(painted.every(call=>place.side<0?call.x<960:call.x>960));
  assert(main.filter(call=>call.key===key).every(call=>call.x<960&&!call.flip),
    'no right-bank or mirrored legacy substation leaks into the main camera');
  observations+=painted.length;
}
console.log(`Cache Road bank art passed: left-only fenced substation, 3 compatible right replacements, ${observations} main/rear observations; 48 core cards and existing clearance preserved.`);
