#!/usr/bin/env node
// Controller-only physical collision fixtures and ordinary full-length passive
// driving. Arranged contact coordinates are not owner playtest evidence.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={BARCODE:{}};
vm.runInNewContext(fs.readFileSync('src/game/cache-road-combat.js','utf8'),{window});
const C=window.BARCODE.CacheRoadCombat,plain=value=>JSON.parse(JSON.stringify(value));

function earnedBikeWreck() {
  const state=C.create(),input={progress:0,lanePos:1.5,speed:30,bar:0,syncCount:4};
  let ms=0;
  for(let frame=0;frame<600;frame++) {
    ms+=50;input.progress+=1.5;input.bar=ms/1875;
    const first=C.pose(state,input).actors.find(actor=>actor.kind==='bike');
    if(first)input.lanePos=first.lane;
    C.step(state,50,input);
    if(C.pose(state,input).target?.attackMode==='strike') {
      const hit=C.act(state,'attack',input);
      if(hit.events.some(event=>event.type==='takedown'&&event.kind==='bike'))return {state,input};
    }
  }
  assert.fail('production Attack did not create the bike wreck');
}
const earned=earnedBikeWreck();
function contactFixture({age=2100,from=60,to=-40,laneOffset=0,fromLaneOffset=laneOffset}={}) {
  const state=plain(earned.state),wreck=state.wrecks.find(wreck=>wreck.kind==='bike');
  wreck.ageMs=age;wreck.riderSplatAtMs=null;
  const lane=wreck.lane+(wreck.lane>=1.5?-.34:.34);
  const input={...earned.input,progress:wreck.at-to,lanePos:Math.max(0,Math.min(3,lane+laneOffset)),bar:state.lastBar};
  state.lastProgress=wreck.at-from;state.lastLanePos=Math.max(0,Math.min(3,lane+fromLaneOffset));
  return {state,wreck,input,lane};
}
for(const options of [
  {age:1700}, // Car clears the body while it is still in the air.
  {age:1850,from:10,to:-40}, // The tire interval ends before it lands.
  {laneOffset:.8}, // Same longitudinal address, visibly different lane.
  {from:-30,to:-40} // A grounded body already behind the car.
]) {
  const r=contactFixture(options),before=plain(r.state.stats);
  const events=C.step(r.state,100,r.input);
  assert(!events.some(event=>event.type==='rider-splatter'),JSON.stringify(options));
  assert.equal(r.wreck.riderSplatAtMs,null);
  assert.deepEqual(plain(r.state.stats),before,'a miss cannot change rewards or combat damage');
}
const landed=contactFixture(),before=plain(landed.state.stats),ledger=plain(landed.state.ledger);
landed.input.boosting=true;
const first=C.step(landed.state,100,landed.input);
assert.equal(first.filter(event=>event.type==='rider-splatter').length,1,'Turbo cannot skip a swept ground contact');
assert.equal(first.find(event=>event.type==='rider-splatter').lane,landed.lane);
assert(landed.wreck.riderSplatAtMs>=1900&&landed.wreck.riderSplatAtMs<=landed.wreck.ageMs);
assert.deepEqual(plain(landed.state.stats),before,'splattering creates no takedown, damage or player-hit credit');
assert.deepEqual(plain(landed.state.ledger),ledger);
assert(C.pose(landed.state,landed.input).wrecks.find(wreck=>wreck.id===landed.wreck.id).splattered);
const later=[];
for(let frame=0;frame<10;frame++)later.push(...C.step(landed.state,50,landed.input));
assert(!later.some(event=>event.type==='rider-splatter'),'one body emits only one splat');
const diagonal=contactFixture({laneOffset:-.8,fromLaneOffset:.8});
assert.equal(C.step(diagonal.state,100,diagonal.input).filter(event=>event.type==='rider-splatter').length,1,
  'lateral sweep catches real mid-step contact even when both endpoint lanes miss');

const save=plain(C.snapshot(landed.state));
const restored=C.restore(save,{progress:save.lastProgress,bar:Math.floor(save.lastBar)});
assert(restored,'real earned damage and cosmetic splat checkpoint restore');
assert(C.pose(restored).wrecks.some(wreck=>wreck.splattered));
const old=plain(save);delete old.lastLanePos;
for(const wreck of old.wrecks)delete wreck.riderSplatAtMs;
const migrated=C.restore(old,{progress:old.lastProgress,bar:Math.floor(old.lastBar)});
assert(migrated,'v4 checkpoints without new presentation fields remain loadable');
assert(migrated.wrecks.every(wreck=>wreck.riderSplatAtMs===null));
const legacyContact=contactFixture({from:10,to:7});
legacyContact.wreck.lane=1;legacyContact.state.trackedLane=1.5;
legacyContact.state.lastLanePos=0;
const legacySave=plain(C.snapshot(legacyContact.state));delete legacySave.lastLanePos;
const physicalLegacy=C.restore(legacySave,{progress:legacySave.lastProgress,bar:Math.floor(legacySave.lastBar)});
assert(physicalLegacy);
assert(!C.step(physicalLegacy,100,{...legacyContact.input,progress:legacySave.lastProgress+3,lanePos:0})
  .some(event=>event.type==='rider-splatter'),
  'missing physical lane cannot create a sweep from the historical tracked lane');
for(const mutate of [
  raw=>{raw.lastLanePos=4;},raw=>{raw.wrecks[0].riderSplatAtMs='yes';},
  raw=>{raw.wrecks[0].riderSplatAtMs=1899;},
  raw=>{raw.wrecks[0].riderSplatAtMs=raw.wrecks[0].ageMs+1;}
]) {
  const forged=plain(save);mutate(forged);
  assert.equal(C.restore(forged,{progress:forged.lastProgress,bar:Math.floor(forged.lastBar)}),null);
}

const metrics=[];
for(const difficultyId of ['relaxed','standard','overclocked'])for(const speed of [30,52,70]) {
  const state=C.create({difficultyId}),input={progress:0,lanePos:1.5,speed,bar:0,syncCount:0};
  let trioMs=0,overlapMs=0,emptyEscapeMs=0;
  for(let ms=50;ms<=187500;ms+=50) {
    input.progress+=speed*.05;input.bar=ms/1875;C.step(state,50,input);
    const live=state.enemies.filter(enemy=>enemy.phase!=='flee'&&enemy.hp>0);
    assert(live.filter(enemy=>['windup','attack'].includes(enemy.phase)).length+
      Number(state.projectiles.some(projectile=>!projectile.friendly))<=1,
      'one active warning/chassis commitment/projectile at a time');
    const near=live.filter(enemy=>enemy.at-input.progress>=-25&&enemy.at-input.progress<=115);
    if(near.length>=3)trioMs+=50;
    if(live.some((enemy,index)=>live.slice(index+1).some(other=>Math.abs(enemy.at-other.at)<45&&Math.abs(enemy.lane-other.lane)<.72)))overlapMs+=50;
    if(![0,1,2,3].some(lane=>near.every(enemy=>Math.abs(enemy.lane-lane)>=.7)))emptyEscapeMs+=50;
  }
  // Original controller: all-three-near 31.55–58.65s, same-lane pair overlap
  // 93.5–133s across these exact nine ordinary-driving runs.
  assert(trioMs<2000,`${difficultyId}/${speed}: triple crowd ${trioMs}ms`);
  assert(overlapMs<25000,`${difficultyId}/${speed}: same-lane overlap ${overlapMs}ms`);
  assert.equal(emptyEscapeMs,0,'the staged combat bodies always leave a steerable lane');
  metrics.push({difficultyId,speed,trioMs,overlapMs,emptyEscapeMs});
}
// An authored three-lane convoy leaves one route. Combat must wait farther
// ahead instead of taking that fourth lane; the announced pad also stays put.
const convoy=C.create(),convoyInput={progress:0,lanePos:3,speed:52,bar:0,syncCount:0};
let arrivals=0;
for(let ms=50;ms<=60000;ms+=50) {
  convoyInput.progress+=2.6;convoyInput.bar=ms/1875;
  convoyInput.actors=[0,1,2].map(lane=>({id:`civilian-${lane}`,lane,at:convoyInput.progress+70}));
  convoyInput.protectedPulses=[{id:'announced-pad',lane:3,at:convoyInput.progress+210}];
  const beforeActors=plain(convoyInput.actors),beforePads=plain(convoyInput.protectedPulses);
  arrivals+=C.step(convoy,50,convoyInput).filter(event=>event.type==='enemy-arrive').length;
  assert.deepEqual(plain(convoyInput.actors),beforeActors,'combat cannot move civilian addresses');
  assert.deepEqual(plain(convoyInput.protectedPulses),beforePads,'combat cannot move revealed pads');
  const near=convoy.enemies.filter(enemy=>enemy.phase!=='flee'&&enemy.at-convoyInput.progress<=115);
  assert(near.every(enemy=>Math.abs(enemy.lane-3)>=.7),'combat leaves the convoy escape route clear');
}
assert(arrivals>=3,'the clearance test uses live repeated arrivals, not an empty road');
console.log('Cache combat spacing/riders passed:',JSON.stringify(metrics));
