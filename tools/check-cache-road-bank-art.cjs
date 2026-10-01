// Check the source paintings as well as actual generation and both cameras.
// Source slope/contact expectations come from the agreed bank shape and real
// WebP alpha, independently of the renderer's selected flip/contact metadata.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const contextSources={
  cacheTransitNook:{file:'transit-service-nook.webp',side:1,w:1602,h:982,footU:.14,contact:725,outer:883},
  cacheUtilityCorner:{file:'utility-service-corner.webp',side:1,w:1585,h:992,footU:.14,contact:665,outer:871},
  cacheGreenhouseWorkshop:{file:'greenhouse-workshop.webp',side:1,w:1536,h:1024,footU:.14,contact:828,outer:905},
  cacheOutskirtsWorkshops:{file:'outskirts-workshops.webp',side:1,w:2022,h:778,footU:.14,contact:708,outer:745},
  cacheRepairShop:{file:'neighborhood-repair-shop.webp',side:1,w:1389,h:1132,footU:.14,contact:940,outer:1067},
  cacheVendorStall:{file:'street-vendor-people.webp',side:1,w:1391,h:1131,footU:.14,contact:959,outer:1026},
  // Its bank direction remains ambiguous. A measured center foundation
  // anchors it without changing the previously used source handedness.
  cacheOutskirtsHomes:{file:'outskirts-homes.webp',side:-1,w:2022,h:778,footU:.5,contact:698}
};
const contextSides=Object.fromEntries(Object.entries(contextSources).map(([key,source])=>[key,source.side]));
const legacySources={
  cachePlaceHouse:{file:'row-house.webp',kind:'house',side:-1,w:960,h:891,footU:.86,contact:612,outer:769},
  cachePlacePark:{file:'pocket-park.webp',kind:'park',side:-1,w:960,h:640,footU:.86,contact:463,outer:557}
};
async function checkSource(key,source,folder) {
  const image=await loadImage(`assets/cache-road/${folder}/${source.file}`);
  assert.equal(image.width,source.w);assert.equal(image.height,source.h);
  const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');
  ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,image.width,image.height).data;
  const alpha=(x,y)=>pixels[(y*image.width+x)*4+3];
  const bottom=u=>{
    const x=Math.round(u*(image.width-1));
    for(let y=image.height-1;y>=0;y--)if(alpha(x,y)>128)return y;
    return null;
  };
  const x=Math.round(source.footU*(image.width-1));
  assert.equal(bottom(source.footU),source.contact,`${key} keeps its measured opaque inner foot`);
  assert(alpha(x,source.contact)>128&&alpha(x,source.contact+1)<=128,
    `${key} contact is the opaque foundation boundary, not transparent bitmap padding`);
  if(source.outer!==undefined) {
    assert.equal(bottom(1-source.footU),source.outer,`${key} keeps its authored outer bank`);
    assert(source.outer>source.contact+30,
      `${key} descends toward its ${source.side<0?'left':'right'} native outer bank`);
  }
}
async function run() {
for(const [key,source]of Object.entries(contextSources))await checkSource(key,source,'world');
for(const [key,source]of Object.entries(legacySources))await checkSource(key,source,'roadside/places');
const {w,context}=createRig(),B=w.BARCODE;
B.Campaign={register(){},syncTitleButton(){}};
load(context,'src/engine/cache-road-proof-profile.js');
load(context,'src/game/cache-road-landscape.js');
vm.runInContext(fs.readFileSync('src/game/cache-road-proof.js','utf8').replace(
  '  B.Campaign.register(ID,',
  '  window.bankArtReview={PLACE_ART,PLACE_BANK_RULES,PLACE_SOURCE_SIDES,SIDE_VARIANTS,SIDE_PLACES,LANDSCAPE,SATELLITE_SCENES,SCENERY,newState};\n  B.Campaign.register(ID,'),context);
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
for(const [key,source]of Object.entries(legacySources)) {
  assert.equal(R.PLACE_SOURCE_SIDES[source.kind],source.side,`${key} uses its audited native bank`);
}
for(const [key,side]of Object.entries(contextSides)) {
  assert.equal(B.CacheRoadLandscape.SOURCE_FITS[key]?.sourceSide,side,
    `${key} has an explicit source bank independent of its current placement`);
  for(const bank of [-1,1])assert.equal(B.CacheRoadLandscape.sourceFlip(key,bank),bank!==side,
    `${key} preserves its source taper on the ${bank<0?'left':'right'} bank`);
}
for(const [key,source]of Object.entries(contextSources)) {
  const fit=B.CacheRoadLandscape.SOURCE_FITS[key];
  assert.equal(fit.footU,source.footU,`${key} stores the foot in unmirrored source coordinates`);
  assert.equal(fit.contactAt,source.contact,`${key} uses the measured opaque source contact`);
}
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
// Independent camera equations from the accepted world projection. Compare
// the real source's opaque inner pixel with projected terrain, rather than
// checking bitmap bottom against another bitmap-bottom value.
const path=at=>200*Math.sin(at/700)+90*Math.sin(at/295+.5);
const heading=at=>200/700*Math.cos(at/700)+90/295*Math.cos(at/295+.5);
const scale=t=>t/(1+.20*t);
const fixtures=new Map();
for(const item of R.SCENERY) {
  const art=item.place?artFor(item.place):item.plate?.art||item.scene?.art;
  if(art&&(art[0]in contextSides||art[0]in legacySources))
    fixtures.set(`${item.kind}:${art[0]}:${item.side}`,{item,art});
}
const seen=new Set();let contactChecks=0;
for(const {item,art}of fixtures.values())for(const view of ['main','rear'])
  for(const distance of [240,160]) {
    const progress=item.at+(view==='main'?-distance:distance);
    road.state=R.newState({progress,lane:1,lanePos:1,musicBar:24,integrity:3});
    road.active=true;road.audioDegraded=false;main=[];rear=[];ctx.reset();road.draw(ctx);
    const t=view==='main'?(525/620)*Math.pow(1-distance/1200,3.1):1-distance/440;
    const miniature=view==='main'?1:.095;
    const maxW=item.kind==='satellite'?Math.min(720,art[3]):art[3];
    const width=maxW*scale(t)*(item.place?.size||1)*miniature;
    const calls=(view==='main'?main:rear).filter(call=>call.key===art[0]&&
      Math.abs(call.width-width)<1e-7);
    // Some deep accents have already passed the outer frame at this depth.
    // The paired approach still must exercise every key in each camera.
    if(!calls.length)continue;
    for(const call of calls) {
      const sourceSide=contextSides[art[0]]??legacySources[art[0]].side;
      assert.equal(call.flip,item.side!==sourceSide,
        `${art[0]} keeps its independently audited source bank in ${view}`);
      seen.add(`${art[0]}:${view}`);observations++;
      const source=contextSources[art[0]];
      if(!source)continue;
      const footU=call.flip?1-source.footU:source.footU;
      const footX=call.x-call.width*.5+call.width*footU;
      const footY=call.y-call.height+source.contact*call.width/source.w;
      let center,half,roadY,radial;
      if(view==='main') {
        const ahead=(1-t)*520;
        center=960+(path(progress+ahead)-path(progress)-ahead*heading(progress))*.95;
        half=82+534*t;roadY=400+680*t*t;
        radial=(item.side*(footX-center)-half)/(.1+.9*t)-190*t;
      } else {
        center=638+475+(path(item.at)-path(progress)+distance*heading(progress))*.72;
        half=27+165*t;roadY=59+74*t*t;
        radial=(item.side*(footX-center)-half)/miniature/(.1+.9*t)-190*t;
      }
      const ground=roadY+t*miniature*R.LANDSCAPE.height(item.side,item.at,Math.max(220,radial));
      const bias=6*t*miniature;
      assert(Math.abs(footY-ground-bias)<1e-7,
        `${art[0]} ${view} opaque inner foot meets terrain at its own x (${footY-ground-bias})`);
      contactChecks++;
    }
  }
for(const key of [...Object.keys(contextSides),...Object.keys(legacySources)])
  for(const view of ['main','rear'])assert(seen.has(`${key}:${view}`),
    `${key} reaches an actual ${view} painter fixture`);
assert(contactChecks>=24,'fitted sources are checked through both cameras and multiple approach depths');
console.log(`Cache Road bank art passed: 9 real source feet and 8 bank slopes, explicit legacy/context banks, ${contactChecks} projected opaque-foot checks, ${observations} main/rear observations; strict substation, 48 core cards and existing clearance preserved.`);
}
run().catch(error=>{console.error(error);process.exitCode=1;});
