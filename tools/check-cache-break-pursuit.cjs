// Production pursuit state, real crossings and validated checkpoint recovery.
// Full production-input races and native drawings are separate integration gates.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const w={BARCODE:{},FILE_MANIFEST:[]};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/game/cache-road-pursuit.js'),'utf8'),{window:w});
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/game/cache-road-encounters.js'),'utf8'),{window:w});
const P=w.BARCODE.CacheRoadPursuit,C=w.BARCODE.CacheRoadEncounters;
const BAR_SEC=60/128*4,plain=value=>JSON.parse(JSON.stringify(value));
function drive({speed=52,difficultyId='standard',misses=0,power=null,ignore=false,changeGear=false}={}) {
  const state=P.create({version:3}),events=[],addresses=new Map(),locks=[];
  let progress=0,lane=1,missed=0,lastAttack=null,powered=false,wreckSeen=false;
  for(let ms=0;ms<100*BAR_SEC*1000;ms+=20) {
    const barFloat=ms/(BAR_SEC*1000),before=progress;
    const currentSpeed=changeGear&&barFloat>=81?30:speed;
    progress+=currentSpeed*.02;
    const actor=state.actor;
    if(actor?.id!==lastAttack) {lastAttack=actor?.id;powered=false;}
    const wantMiss=actor?.boss&&missed<misses;
    if(actor?.locked) {
      let target=actor.targetLane>=2?actor.targetLane-1:actor.targetLane+1;
      if(ignore&&actor.boss)target=actor.targetLane;
      else if(wantMiss)target=actor.targetLane+(actor.targetLane>=2?-.6:.6);
      else if(power&&actor.boss&&!powered)target=actor.targetLane;
      lane+=Math.max(-.05,Math.min(.05,target-lane));
    }
    const input={before,progress,dt:20,barFloat,lane,difficultyId};
    if(power&&actor?.boss&&!powered) {
      input.ramMs=power==='push'?1000:0;
      input.shield=power==='brace'?1:0;
      input.boostMs=power==='turbo'?1000:0;
    }
    const emitted=P.step(state,input);
    for(const event of emitted) {
      events.push({...event,barFloat,progress});
      if(event.type==='lock')locks.push({id:event.id,remaining:event.at-progress});
      if(event.type==='boss-miss')missed++;
      if(event.type==='boss-counter')powered=true;
    }
    const pose=P.pose(state,{progress});
    if(pose) {
      const locations=addresses.get(pose.id)||new Set();locations.add(pose.at);addresses.set(pose.id,locations);
    }
    const rig=P.boss(state,{progress});
    if(rig?.defeated&&rig.at<progress)wreckSeen=true;
  }
  return {state,events,addresses,locks,wreckSeen,progress};
}

for(const difficultyId of ['relaxed','standard','overclocked'])for(const speed of [30,52,70,75]) {
  const result=drive({difficultyId,speed});
  assert.equal(result.events.filter(e=>e.type==='warning').length,4,'Scouts escalate through four earlier acts');
  assert.equal(result.events.filter(e=>e.type==='boss-arrive').length,1,'One continuous rig arrives');
  assert.equal(result.events.filter(e=>e.type==='boss-counter').length,3,'Three successful committed attacks break three systems');
  assert(result.events.filter(e=>e.type==='boss-counter').every(e=>e.kind==='dodge'&&e.reason==='committed-attack-overload'),
    'A resource-free victory comes from actual committed attack overloads');
  assert.equal(result.events.filter(e=>e.type==='hit').length,0,'A reachable one-lane dodge survives the entire pursuit');
  assert.equal(result.events.filter(e=>e.type==='boss-defeated').length,1);
  assert(result.events.find(e=>e.type==='boss-defeated').barFloat<100,'The slowest gear defeats the rig before the unchanged song ends');
  assert(result.locks.every(lock=>lock.remaining/75>=1),'Every commitment leaves at least one second at maximum speed');
  assert(result.wreckSeen,'The defeated world chassis passes behind Cache rather than vanishing in front');
  for(const locations of result.addresses.values())assert.equal(locations.size,1,'Speed and phase changes never move a published strike');
  assert.equal(result.state.boss.health,0);assert.equal(result.state.defeated,true);
  assert(result.state.boss.systems.every(system=>system.broken));
  const snapshot=P.snapshot(result.state),restored=P.restore(snapshot,{barFloat:100,progress:result.progress});
  assert(restored,'A genuinely defeated rig survives validated restoration');
  assert.equal(restored.boss.rigAt,result.state.boss.rigAt,'Wreck pose stays in world space on restore');
  assert.equal(restored.boss.health,0);assert.equal(restored.defeated,true);
  snapshot.boss.systems[0].broken=false;
  assert(restored.boss.systems[0].broken,'Saved fields do not alias the live state');
}
for(const speed of [30,52,70]) {
  const recovering=drive({speed,misses:2,changeGear:true});
  assert.equal(recovering.events.filter(e=>e.type==='boss-miss').length,2,'Two narrow non-damaging misses retain later opportunities');
  assert.equal(recovering.events.filter(e=>e.type==='boss-defeated').length,1,'Later counters recover after a real first-gear speed change');
  assert(recovering.events.find(e=>e.type==='boss-defeated').barFloat<100);
}
for(const power of ['push','brace','turbo']) {
  const result=drive({power});
  const counter=result.events.find(e=>e.type==='boss-counter');
  assert.equal(counter.kind,power,'Existing protection/attack states counter on physical contact');
  assert.equal(counter.consumePush,power==='push');assert.equal(counter.consumeShield,power==='brace');
  assert.equal(result.events.filter(e=>e.type==='boss-defeated').length,1);
  assert.equal(result.events.filter(e=>e.type==='boss-hit').length,0,'A powered contact never also awards an unprotected hit');
}
{
  const ignored=drive({ignore:true});
  assert.equal(ignored.state.boss.health,3);assert.equal(ignored.state.defeated,false);
  assert.equal(ignored.events.filter(e=>e.type==='hit'&&e.boss).length,6,'Ignoring all six warnings is six real impacts');
  assert.equal(ignored.events.filter(e=>e.type==='boss-hit').length,6);
  assert.equal(ignored.events.filter(e=>e.type==='boss-defeated').length,0,'Song completion cannot fabricate a defeated boss');
}
{
  const state=P.create({version:3,barFloat:75.9});
  let progress=0,lane=1;const events=[];
  for(let i=0;i<400;i++) {
    const before=progress;progress+=52*.02;
    const actor=state.actor;
    if(actor?.locked)lane+=Math.max(-.05,Math.min(.05,3-lane));
    const echo=actor?.locked?{lanePos:i<80?0:3}:null;
    events.push(...P.step(state,{before,progress,lane,dt:20,barFloat:75.9+i*.02/BAR_SEC,echo}));
    if(events.some(event=>event.type==='boss-counter'))break;
  }
  assert.equal(events.filter(e=>e.type==='echo-lock').length,1,'A replay commits the scanner once');
  assert.equal(events.find(e=>e.type==='boss-counter').kind,'echo');
  assert.equal(state.actor.targetLane,0,'A moving replay cannot retrack the announced lane');
}
{
  const state=P.create({version:3,barFloat:76});
  P.step(state,{before:0,progress:0,lane:1,dt:100,barFloat:76});
  for(let i=1;i<=6;i++)P.step(state,{before:(i-1)*5.2,progress:i*5.2,lane:1,dt:100,barFloat:76+i*.1/BAR_SEC});
  assert(state.actor.locked);
  const saved=P.snapshot(state),resumed=P.restore(saved,{barFloat:76.8,progress:40});
  assert(resumed);assert.equal(resumed.actor,null,'Restoration does not reintroduce a hidden half-finished strike');
  assert.equal(P.step(resumed,{before:40,progress:40,lane:1,dt:20,barFloat:76.8}).filter(e=>e.type==='boss-warning').length,0);
  assert(P.step(resumed,{before:40,progress:40,lane:1,dt:20,barFloat:80}).some(e=>e.type==='boss-warning'),
    'The next opportunity owns its full visible warning');
  for(const mutate of [
    raw=>raw.version=4,raw=>raw.boss.health=0,raw=>raw.boss.defeated=true,
    raw=>raw.boss.counters=3,raw=>raw.boss.systems[0].broken=true,
    raw=>raw.announced.push(raw.announced[0]),raw=>raw.boss.rigAt=Infinity,
    raw=>raw.boss.attempts=6,raw=>raw.boss.lastCounter={id:'rig-strike-5',kind:'dodge',system:'scanner',bar:100}
  ]) {const bad=plain(saved);mutate(bad);assert.equal(P.restore(bad),null,'Forged or malformed boss completion is rejected');}
}

// Fresh charts retain fixed next-ONE musical promises and round-trip their
// complete materialized source tree across every gear/difficulty.
const chartResults=[];
for(const difficultyId of ['relaxed','standard','overclocked'])for(const speed of [30,52,70]) {
  const chart=C.create(difficultyId,3);let progress=0;
  for(let bar=0;bar<100;bar++) {
    const section={beat:bar*4,beatSec:60/128,from:progress,v0:speed,speed};
    const {pulse}=C.commit(chart,section,-40);
    if(pulse)assert.equal(pulse.target,(bar+1)*4);
    const before=JSON.stringify(chart);
    C.commit(chart,{...section,from:progress+20,speed:75},-40);
    assert.equal(JSON.stringify(chart),before,'Recommit cannot retime a revealed road target');
    progress+=speed*BAR_SEC;
  }
  assert(chart.pulses.some(p=>p.bar===90)&&chart.pulses.some(p=>p.bar===92)&&chart.pulses.some(p=>p.bar===94),
    'The boss fight retains musical and earned-power opportunities where the old exit was silent');
  assert(chart.pulses.some(p=>p.bar===96)&&chart.pulses.some(p=>p.bar===98),'The breakaway keeps the final musical accents');
  assert(!chart.rows.some(row=>row.bar>68),'Civilian reveals clear the slow-gear boss approach');
  assert.deepEqual(plain(C.restore(C.snapshot(chart),difficultyId)),plain(chart));
  chartResults.push({difficultyId,speed,rows:chart.rows.length,pulses:chart.pulses.length});
}
assert.equal(C.create().version,3,'Explicit replay/fresh charts use the overhaul version');
assert.equal(C.act(76,3).id,'pursuit');assert.equal(C.act(92,3).id,'pursuit');
assert.equal(C.act(96,3).id,'delivery');assert.equal(C.act(100,3).id,'complete');
// Exercise the real road/transport boundary, not just the new chart's version
// marker. Fresh v3 must retain the v2 timing window and reactive drum/backbone
// behavior rather than falling through to proof-era branches.
const {rig:feedbackRig,pressAt}=require('./check-cache-drive-feedback.cjs');
const {load}=require('./check-level-01-boss');
let migrationTimingCases=0;
for(const offset of [-181,-180,-150,-70,0,70,150,180,181]) {
  const r=feedbackRig(3),result=pressAt(r,offset);
  assert.equal(result.accepted,Math.abs(offset)<=180,`v3 actual judgment ${offset}ms`);
  const cue=r.inspect.pulseVisual(r.pulse,r.road.state,60/128);
  assert.equal(cue.window,Math.abs(offset)<=180,`v3 painted/tire window ${offset}ms`);
  assert.equal(cue.strike,cue.window,'The visible PRESS period matches the accepted v3 input');
  if(result.accepted&&offset<0) {
    assert.equal(r.road.chapter.connected,0,'Early v3 awards wait for their original ONE');
    r.tick(r.pulse.target);assert.equal(r.road.chapter.connected,1);
  }
  migrationTimingCases++;
}
{
  const r=feedbackRig(3),{road,w,B}=r,audio=w.audioSystem;
  assert(pressAt(r,0).accepted);r.tick(r.pulse.target+.2);
  assert.equal(road.state.captures.length,1,'A real v3 catch earned a live musical part');
  load(r.context,'src/engine/music-director.js');
  audio.layersStarted=true;audio.isLooping=false;
  audio.getActiveMusicProfile=()=>B.MusicProfiles.getActive();
  audio.musicTracks={};
  for(const source of B.MusicProfiles.getActive().arrangement.sources)
    audio.musicTracks[source.sourceId]={isPlaying:true,volume:0,gain:{gain:{value:0}}};
  audio.rampAdaptiveStemGain=(track,volume)=>{track.volume=volume;track.gain.gain.value=volume;};
  let wholeBusStumbles=0;audio.playRoadStumble=()=>{wholeBusStumbles++;};
  assert(B.musicDirector.apply(audio));
  assert.equal(B.musicDirector.getVolume('cache-pressure'),.6);
  const generation=B.MusicTransport.sample(audio.context.currentTime).generation;
  const integrity=road.state.integrity;
  road.state.invulnerableMs=0;road.state.ramMs=0;road.state.shield=0;road.state.boostMs=0;
  road.hit('van');
  assert.equal(road.state.integrity,integrity-1,'The migration probe takes genuine unprotected damage');
  assert.equal(road.state.gear,0,'The repair first-gear rule remains active during the overhaul');
  assert.equal(road.state.captures.length,0,'Damage removes the actual earned live part');
  assert.equal(wholeBusStumbles,0,'Version 3 never reintroduces the old whole-music-bus dropout');
  assert.equal(road.mixSnapshot().reactivityVersion,2,'Version 3 explicitly retains reactive arrangement');
  assert(B.musicDirector.apply(audio));
  assert.equal(B.musicDirector.getVolume('cache-pressure'),.6,'The real director keeps the drum backbone after a wreck');
  assert.equal(B.musicDirector.getVolume('cache-drive'),.03,'The reactive quiet support bed survives the lost part');
  assert.equal(B.MusicTransport.sample(audio.context.currentTime).generation,generation,'A wreck does not restart aligned sources');
}
console.log('Version 3 migration boundaries passed:',{migrationTimingCases,reactiveDrumHold:true});
console.log('Break the Pursuit passed: resource-free/empowered counters, missed-opportunity recovery, every-gear fixed threats, world wreck, safe checkpoints and charts.',chartResults);
