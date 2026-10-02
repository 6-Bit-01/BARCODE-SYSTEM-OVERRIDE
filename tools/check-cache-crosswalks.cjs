#!/usr/bin/env node
// Physical crosswalk controller probes, separate from the road's played-input
// integration review. No fixture awards score or edits another owner.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const window={BARCODE:{}};
vm.runInNewContext(fs.readFileSync('src/game/cache-road-crosswalks.js','utf8'),{window});
const C=window.BARCODE.CacheRoadCrosswalks,copy=value=>JSON.parse(JSON.stringify(value));
const state=C.create(),sections=C.sites.map((bar,index)=>({beat:bar*4,from:700+index*2000,
  beatSec:60/128,v0:32,speed:52}));
assert.deepEqual([...C.sites],[10,30,50,70]);
for(const section of sections) {
  const view=C.commit(state,section),at=view.at;
  assert.equal(at,section.from+300);
  view.at+=1000;section.from+=1000;section.speed=110;
  assert.equal(state.crossings.at(-1).at,at,'later gear/section/view changes cannot relocate a revealed crossing');
  assert.equal(C.commit(state,section),null,'each authored site commits once');
}
assert.equal(C.commit(state,{beat:44,from:1234}),null);
assert.equal(C.commit(state,{beat:41,from:1234}),null);
assert.equal(state.crossings.length,4);assert.equal(state.committedBars.length,4);
const resources=Object.freeze({score:7300,integrity:3,syncCount:4,ammo:2,cooldown:800});
const events=[];let progress=0;
while(progress<7600) {
  const before=progress;progress+=52*.05;
  events.push(...C.step(state,50,Object.freeze({...resources,before,progress,speed:52,
    lanePos:1.5,previousLanePos:1.5,bar:70})));
}
assert.equal(events.length,8,'both people at all four physical crossings can be contacted');
assert.equal(state.hitCount,8);
assert.equal(new Set(events.map(event=>event.id)).size,8,'each body emits exactly one contact');
assert.equal(new Set(events.map(event=>event.message)).size,8,'every contact has a different shame message');
assert.deepEqual(events.map(event=>event.hitCount),[1,2,3,4,5,6,7,8]);
assert(events.every(event=>event.type==='pedestrian-hit'&&!('points'in event)&&!('damage'in event)&&!('reward'in event)));
assert.deepEqual(resources,{score:7300,integrity:3,syncCount:4,ammo:2,cooldown:800});
assert(!('score'in state)&&!('integrity'in state)&&!('ammo'in state),'crosswalk owner holds no gameplay economy');
const painted=JSON.stringify(state);for(let index=0;index<30;index++)C.pose(state,{progress:7000});
assert.equal(JSON.stringify(state),painted,'paint reads cannot age or hit pedestrians');
function fixture() {const s=C.create();C.commit(s,{beat:40,from:700});return s;}
const frozen=fixture(),zeroBefore=JSON.stringify(frozen);
assert.equal(C.step(frozen,0,{before:810,progress:830,speed:32,lanePos:0,bar:11}).length,0);
assert.equal(JSON.stringify(frozen),zeroBefore,'a zero-time frame cannot start a crossing or advance its trajectory/bar');
assert.equal(C.step(frozen,-20,{before:810,progress:830,speed:32,lanePos:0,bar:11}).length,0);
assert.equal(JSON.stringify(frozen),zeroBefore,'clamped zero-time input keeps the entire controller frozen');
const waiting=fixture();C.step(waiting,250,{before:0,progress:10,speed:32,lanePos:0});
assert.equal(waiting.crossings[0].started,false);assert.equal(waiting.crossings[0].ageMs,0);
assert(C.pose(waiting,{progress:700}).people.every(person=>person.phase==='waiting'));
C.step(waiting,250,{before:810,progress:830,speed:32,lanePos:0});
assert.equal(waiting.crossings[0].started,true);
assert(Math.abs(waiting.crossings[0].ageMs-75)<1e-9,'walking starts at the actual 5.5-second approach boundary');
assert.equal(C.pose(waiting,{progress:830}).people[1].phase,'waiting','second pedestrian retains its 600ms delay');
const miss=fixture();let position=700,misses=[];
while(position<1100) {const before=position;position+=2.6;
  misses.push(...C.step(miss,50,{before,progress:position,speed:52,lanePos:0}));}
assert.equal(misses.length,0,'a clear lane genuinely misses the walking people');
const sweep=fixture();Object.assign(sweep.crossings[0],{started:true,ageMs:4500});
const swept=C.step(sweep,200,{before:970,progress:1030,speed:110,previousLanePos:0,lanePos:3});
assert.equal(swept.length,2,'a fast world/lane sweep cannot tunnel through either physical body');
const after=C.pose(sweep,{progress:1030});
assert(after.people.every(person=>person.phase==='hit'&&person.hitAgeMs>=0));
const hitLanes=after.people.map(person=>person.lane);
const hitWalkingTimes=after.people.map(person=>person.walkingMs);
assert.equal(C.step(sweep,200,{before:970,progress:1030,speed:110,previousLanePos:0,lanePos:3}).length,0);
assert.deepEqual(C.pose(sweep,{progress:1030}).people.map(person=>person.lane),hitLanes,'hit bodies stop walking at their contact addresses');
assert.deepEqual(C.pose(sweep,{progress:1030}).people.map(person=>person.walkingMs),hitWalkingTimes,
  'hit bodies keep the exact contact walking clock instead of cycling sprite cels');
for(let index=0;index<30;index++)C.step(sweep,250,{before:1030,progress:1030,speed:52,lanePos:3});
assert.deepEqual(C.pose(sweep,{progress:1030}).people.map(person=>person.walkingMs),hitWalkingTimes,
  'settled hit bodies retain the same walking cels as their impact');
const timedMiss=fixture();Object.assign(timedMiss.crossings[0],{started:true,ageMs:4500});
assert.equal(C.step(timedMiss,200,{before:995,progress:1045,speed:110,previousLanePos:0,lanePos:1.5}).length,0,
  'separate longitudinal and lateral overlaps do not create a collision at different frame times');
const rewind=C.snapshot(sweep,{progress:930});
assert.equal(rewind.crossings[0].at,900);
assert.equal(rewind.crossings[0].at-rewind.lastProgress,sweep.crossings[0].at-sweep.lastProgress);
assert(C.restore(rewind,{progress:930,bar:10}),'checkpoint preserves contact ledger through physical rewind');
assert.equal(C.snapshot(sweep,{progress:700}),null,'arbitrary large checkpoint relocations are rejected');
const restored=C.restore(rewind,{progress:930,bar:10});
assert.equal(C.step(restored,200,{before:890,progress:950,speed:110,lanePos:1.5}).length,0,
  'restoring an already hit body cannot repeat its message');
for(const change of [
  s=>s.hitCount++,s=>s.crossings[0].id='crosswalk-11',s=>s.crossings[0].bar=11,
  s=>s.crossings.push(copy(s.crossings[0])),s=>s.crossings[0].at=NaN,
  s=>s.crossings[0].started=false,s=>s.crossings[0].hitTimes[0]=null,
  s=>s.crossings[0].hitSides[0]=0,s=>s.crossings[0].hitTimes[0]=0,
  s=>s.committedBars.push(30),s=>s.crossings[0].ageMs=30001
]) {const forged=copy(rewind);change(forged);assert.equal(C.restore(forged,{progress:930,bar:10}),null,'forged crosswalk saves are rejected');}
const legacy=C.create({progress:4000,bar:50});
for(const bar of C.sites)C.commit(legacy,{beat:bar*4,from:4000});
assert.deepEqual([...legacy.crossings.map(item=>item.bar)],[70],'old-v4 saves create only future crossings');
assert(C.restore(C.snapshot(legacy),{progress:4000,bar:70}));
assert.equal(C.restore(rewind,{progress:931,bar:10}),null);
console.log('PASS: exactly four immutable crosswalks, eight single physical contacts/messages, no economy changes, delayed curb walks, continuous two-axis sweep, frozen hit bodies, checkpoint rewind and bounded forged-save rejection');
