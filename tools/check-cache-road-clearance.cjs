// Actual production generator and live draw: legal forecourts, preserved
// modular seams, fixed street sockets, and the reported garage clearance.
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
  '  window.placementReview={LANDSCAPE,SIDE_PLACES,SATELLITE_SCENES,SCENERY,newState};\n  B.Campaign.register(ID,'),context);
const R=w.placementReview;
function inspect(layout){
  const report=layout.clearance;
  assert.equal(report.unresolved.length,0,'all fixed graph openings fit');
  assert.equal(report.collisions.length,0,'retained modular forecourts fit');
  assert(B.CacheRoadLandscape.FAMILIES.every(family=>[-1,1].every(side=>
    layout.plates.some(p=>p.family===family&&p.side===side))),
  'both banks retain every authored district family after illegal lots are rejected');
  const connected=new Set(report.seams.map(pair=>pair.slice().sort().join('|')));
  for(let i=0;i<report.contacts.length;i++)for(let j=i+1;j<report.contacts.length;j++) {
    const a=report.contacts[i],b=report.contacts[j];
    if(a.side!==b.side)continue;
    const touching=Math.abs(a.at-b.at)<a.halfAlong+b.halfAlong+18&&
      Math.abs(a.radial-b.radial)<a.halfDepth+b.halfDepth+18;
    if(!touching)continue;
    assert(connected.has([a.id,b.id].sort().join('|')),
      `unreserved ${a.kind}/${b.kind} frontage: ${a.id}/${b.id}`);
    assert(a.kind==='plate'&&b.kind==='plate'&&a.family===b.family&&
      a.radial===a.authoredRadial&&b.radial===b.authoredRadial&&
      a.authoredRadial===b.authoredRadial&&
      Math.abs(a.authoredAt-b.authoredAt)<=225&&
      Math.abs(a.at-b.at)>=Math.abs(a.authoredAt-b.authoredAt),
    'only an authored connected modular seam may retain its original overlap');
  }
  assert(report.changes.every(change=>change.from.radial===change.to.radial),
    'whole paintings are never pushed outward to conceal collisions');
  for(const plate of layout.plates) {
    assert.equal(plate.art[4],plate.radialBand);
    assert.equal(plate.art[4],plate.frontage.radial);
    const parcel=layout.parcels.find(p=>p.chunkId===plate.chunkId&&p.tier===plate.tier);
    assert(parcel,'every retained building has a real parcel');
    assert.equal(parcel.entrance.at,plate.at);
    assert.equal(layout.graph.nodes[parcel.entrance.node].at,plate.at);
  }
  const referenced=new Set(layout.parcels.map(p=>p.entrance.node));
  assert(layout.graph.nodes.every((node,i)=>node.id===i&&
    (node.type!=='parcel-entrance'||referenced.has(i))),
  'rejected parcels leave no phantom entrances or invalid graph IDs');
  assert(layout.graph.edges.every(e=>layout.graph.nodes[e.a]&&layout.graph.nodes[e.b]));
  for(const street of layout.streets)assert(layout.plates.some(p=>p.chunkId===street.chunkId&&
    p.key==='open'&&p.at===street.at&&p.art[8]?.socketU!==undefined),
  'each original graph mouth keeps its fitted open painting');
}
inspect(R.LANDSCAPE);
const productionKeys=new Set(R.LANDSCAPE.plates.filter(p=>p.key!=='accent').map(p=>p.art[0]));
assert.equal(productionKeys.size,48,'all authored modular source keys remain in the production route');
assert.equal(R.LANDSCAPE.pitch,180);assert.equal(R.LANDSCAPE.span,225);
assert.equal(R.LANDSCAPE.streets.length,25,'all production street mouths remain');
assert(R.LANDSCAPE.clearance.rejected.some(p=>p.id==='plate:1:10:middle'&&p.at===1905));
assert(R.LANDSCAPE.clearance.rejected.some(p=>p.id==='plate:1:10:rear'&&p.at===1979));
const garage=R.SIDE_PLACES.find(p=>p.side===1&&p.at===1840);
assert(garage&&garage.kind==='garage'&&garage.setback===41,
  'the owner-reported garage keeps its authored address and setback');
assert(!R.LANDSCAPE.plates.some(p=>p.side===1&&p.chunkId==='1:10'),
  'neither intersecting residential painting is spawned beside the garage');
const rejected=new Set(R.LANDSCAPE.clearance.rejected.map(p=>p.id));
assert(R.SCENERY.filter(a=>a.kind==='plate').every(a=>
  !rejected.has(`plate:${a.plate.chunkId}:${a.plate.tier}`)),
  'rejected building cards never enter the production scenery index');
// Exercise more than the default seed at both regular and fastest-gear route
// lengths; these are the playable landscape generator, not the older study.
const seeds=[0x6b4d,17,92381,2026,7777];let layouts=0,retained=0;
for(const seed of seeds)for(const end of [9840,15000]) {
  const layout=B.CacheRoadLandscape.create(seed,end,R.SIDE_PLACES);inspect(layout);
  assert.equal(JSON.stringify(layout),JSON.stringify(B.CacheRoadLandscape.create(seed,end,R.SIDE_PLACES)),
    'pause/retry reconstruction uses identical seeded contacts');
  layouts++;retained+=layout.plates.length;
}
// Actual world draw keeps the garage visible across the complete reported
// approach. Rejected cards cannot leak through a stale scenery index.
const road=B.CacheRoadProof,canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
let main=[],rear=[];
B.PresentationAssets={ready:()=>true,draw:(key,c,args)=>{
  (c.filter.includes('blur')?rear:main).push({key,...args});return true;
}};
for(const progress of [1450,1500,1550,1600,1650,1700,1750,1800]) {
  road.state=R.newState({progress,lane:1,lanePos:1,musicBar:24,integrity:3});
  road.active=true;road.audioDegraded=false;main=[];rear=[];ctx.reset();road.draw(ctx);
  assert(main.some(a=>a.key==='cachePlaceGarage'&&a.x>960&&a.x-a.width/2<1920&&
    a.y>400&&a.y<1080),'the featured garage stays visible through its approach');
}
assert(R.SATELLITE_SCENES.length>0);
for(const scene of R.SATELLITE_SCENES)assert(R.LANDSCAPE.clearance.contacts.some(c=>
  c.kind==='satellite'&&c.side===scene.side&&c.at===scene.at+43),
  'satellite reservations use their actual +43 world draw address');
console.log(`Cache Road placement passed: ${layouts} seeded routes, ${retained} retained cards audited; production ${R.LANDSCAPE.plates.length} cards, 48 keys, ${R.SATELLITE_SCENES.length} fitted satellites, clear garage approach.`);
