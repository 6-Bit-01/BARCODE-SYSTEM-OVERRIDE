// Production driving events retain their timing and feed the road-only sound kit.
const assert=require('node:assert/strict');
const {rig,tick}=require('./check-cache-road-drive.cjs');
const beatSec=60/128;
function setup() {
  const r=rig(),cues=[],engine=[],stumbles=[];let stops=0;
  Object.assign(r.w.audioSystem,{
    playCombatCue:(kind,options)=>{cues.push({kind,...options});return true;},
    updateRoadEngine:state=>engine.push(state),stopRoadEngine:()=>stops++,
    playRoadStumble:options=>stumbles.push(options)
  });
  return {...r,cues,engine,stumbles,stops:()=>stops};
}
{
  const r=setup();tick(r,0);
  tick(r,3.9,{move_up:{pressed:true}});
  assert.equal(r.road.state.gear,1,'gear request still waits for the committed boundary');
  assert(r.cues.some(c=>c.kind==='roadQueued'&&c.road));
  tick(r,4);
  const shift=r.cues.find(c=>c.kind==='lift');
  assert(shift&&shift.road&&shift.gear===2);
  assert.equal(shift.audioTimeSec,4*beatSec);
  assert.equal(shift.trackTimeSec,4*beatSec);
  tick(r,4.8);
  assert(r.engine.at(-1).shifting>.9,'engine unload follows the post-window shift pose');
  assert.equal(r.engine.at(-1).gear,2);
  r.road.state.boost=1;r.road.handleActions({road_turbo:{pressed:true}});
  tick(r,8);
  assert(r.cues.some(c=>c.kind==='roadTurbo'&&c.trackTimeSec===8*beatSec));
  assert.equal(r.engine.at(-1).boost,1);
  r.road.status='failed';r.road.update(16);
  assert(r.stops()>0,'no sustained engine after a result');
}
{
  const r=setup(),s=r.road.state,p=r.inspect.PULSES[0];
  s.pulseTargets={[p.id]:84};s.lanePos=0;
  // Bar 22 is a measured F-root chorus downbeat. All of its approach
  // sounds receive the same target song address, rather than today's bar.
  for(const beat of [81,82,83,84]) {
    r.w.audioSystem.context.currentTime=beat*beatSec-.08;
    r.road.updatePulses(r.B.MusicTransport.sample(r.w.audioSystem.context.currentTime));
  }
  assert.deepEqual(r.cues.map(c=>c.countBeat),[2,3,4,1]);
  assert(r.cues.every(c=>c.road&&c.trackTimeSec===84*beatSec&&c.action===0));
  r.cues.forEach((c,i)=>assert.equal(c.audioTimeSec,(81+i)*beatSec));
  r.w.audioSystem.context.currentTime=84*beatSec-.08;
  assert(r.road.catchPulse('road_a',r.w.audioSystem.context.currentTime));
  const caught=r.cues.at(-1);
  assert.equal(caught.kind,'roadGood');assert.equal(caught.action,0);
  assert.equal(caught.trackTimeSec,84*beatSec);
  assert.equal(caught.audioTimeSec,84*beatSec,'early confirmation preserves its exact deadline');
}
{
  const r=setup(),s=r.road.state;s.invulnerableMs=0;s.shield=1;
  r.road.hit('freight');assert.equal(r.cues.at(-1).kind,'land');
  s.ramMs=100;r.road.hit('van');assert.equal(r.cues.at(-1).kind,'roadPush');
  assert.equal(r.stumbles.length,0,'protected contact keeps the song playing');
  r.road.hit('freight');assert.equal(r.cues.at(-1).kind,'damage');
  assert.equal(r.cues.at(-1).material,'freight');
  assert.equal(r.stumbles[0].sound,false,'one layered crash replaces the extra legacy oscillator');
  s.invulnerableMs=0;r.road.cleanPass(false,-1);
  assert.equal(r.cues.at(-1).kind,'roadNearMiss');assert(r.cues.at(-1).pan<0);
  r.road.cleanPass(true,1);assert.equal(r.cues.at(-1).kind,'roadCutPass');
  assert(r.cues.at(-1).pan>0);
  s.integrity=1;s.invulnerableMs=0;r.road.hit('van');
  assert.equal(r.road.status,'failed');assert(r.stops()>0);
  const before=r.stops();r.road.dispose();assert(r.stops()>before);
}
console.log('Road sound routing: shared source deadlines, target-bar pitch metadata, directional passes, distinct protection/crash, three-gear engine and result cleanup passed.');
