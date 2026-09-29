// Exercise the actual output-clock helper, timestamped input and road driver.
// The injected delay represents a device queue, not a song-grid offset.
const assert=require('node:assert/strict');
const {rig}=require('./check-cache-road-drive.cjs');
const {load}=require('./check-level-01-boss');
const beatSec=60/128;
function setup(delay=0,gear=1) {
  const r=rig({gear});load(r.context,'src/engine/audio.js');
  load(r.context,'src/core/action-input.js');
  const audio=r.w.audioSystem=new r.w.AudioSystem(),scheduled=[];
  let performanceNow=1000;
  r.w.performance.now=()=>performanceNow;
  audio.context={currentTime:delay,state:'running',baseLatency:0,outputLatency:delay,
    getOutputTimestamp(){return {contextTime:Math.max(0,this.currentTime-delay-.008),
      performanceTime:performanceNow-8};}};
  audio.playCombatCue=(kind,options={})=>scheduled.push({kind,...options});
  const at=beat=>{audio.context.currentTime=beat*beatSec+delay;
    performanceNow=1000+beat*beatSec*1000;};
  return {...r,audio,scheduled,at};
}
let arrivals=0,accepted=0;
for(const delay of [0,.02,.08,.15,.25])for(const gear of [0,1,2]) {
  const r=setup(delay,gear),s=r.road.state;
  for(let frame=0;frame<=32*64;frame++) {
    const beat=frame/64;r.at(beat);
    const pulse=r.inspect.PULSES.find(p=>s.pulseTargets[p.id]===beat&&!s.caughtPulses[p.id]);
    if(pulse) {
      assert.equal(beat%4,0);s.lanePos=s.lane=pulse.lane;
      const input=new r.B.ActionInput();
      const press=input.capturePress({timeStamp:r.w.performance.now()});
      assert(Math.abs(press.audioTimeSec-(beat*beatSec+delay))<1e-9);
      assert(Math.abs(press.audibleAudioTimeSec-beat*beatSec)<1e-9);
      assert(r.road.catchPulse(['road_a','road_b','road_x','road_y'][pulse.action],
        press.audioTimeSec,press.audibleAudioTimeSec));
      assert.equal(s.pulseTiming,'PERFECT');accepted++;
    }
    r.road.update(beatSec*1000/64);
    assert(Math.abs(s.musicBeatFloat-beat)<1e-8,`road follows heard music: delay=${delay}, gear=${gear}, beat=${beat}, actual=${s.musicBeatFloat}, transport=${JSON.stringify(r.B.MusicTransport.sample(r.audio.getOutputAudioTime()))}`);
    for(const p of r.inspect.PULSES)if(s.pulseTargets[p.id]===beat) {
      const cue=r.inspect.pulseVisual(p,s),t=1-(cue.d+80)/520;
      assert(Math.abs(400+680*t*t-(400+680*.83*.83-119*.14))<1e-7);
      assert.equal(r.inspect.shiftOffset(s,false),0);arrivals++;
    }
  }
  const ready=r.scheduled.filter(e=>e.kind==='roadReady');
  assert(ready.length>0);
  for(const event of ready)assert(Math.abs(event.audioTimeSec/(4*beatSec)-
    Math.round(event.audioTimeSec/(4*beatSec)))<1e-8,
    'predictable ready audio is scheduled on its original source downbeat');
  r.at(12);const input=new r.B.ActionInput();
  const delayed=input.capturePress({timeStamp:r.w.performance.now()-80});
  assert(Math.abs(delayed.audibleAudioTimeSec-(12*beatSec-.08))<1e-9,
    'processing an older keyboard event preserves its original heard time');
  for(const offset of [-90,90]) {
    const now=12*beatSec+offset/1000;
    const j=r.B.MusicTransport.judgeInput('road-pulse',now,offset);
    assert.equal(j.timing,'perfect');assert.equal(j.beatIndex,12);
  }
}
const r=setup(.15);r.at(10);const c=r.audio.context,raw=c.currentTime;
assert(Math.abs(r.audio.getOutputAudioTime()-10*beatSec)<1e-9);
for(const stamp of [{contextTime:0,performanceTime:0},
  {contextTime:NaN,performanceTime:1},{contextTime:999,performanceTime:1},
  {contextTime:1,performanceTime:1}]) {
  c.getOutputTimestamp=()=>stamp;
  assert(Math.abs(r.audio.getOutputAudioTime()-(raw-.15))<1e-9,
    'invalid/stale timestamp uses bounded latency estimate');
}
c.getOutputTimestamp=()=>{throw Error('unsupported');};
assert(Math.abs(r.audio.getOutputAudioTime()-(raw-.15))<1e-9);
delete c.getOutputTimestamp;delete c.outputLatency;
assert.equal(r.audio.getOutputAudioTime(),raw,'no output estimate retains legacy raw timestamp');
c.baseLatency=.01;c.outputLatency=.09;
assert(Math.abs(r.audio.getOutputAudioTime()-(raw-.1))<1e-9);
c.state='suspended';const paused=r.audio.getOutputAudioTime();
r.w.performance.now=()=>1e9;
assert.equal(r.audio.getOutputAudioTime(),paused,'suspension cannot extrapolate wall time');
// An output-delay change can hold presentation, but cannot rewind the world.
const hold=setup(0);hold.at(12);hold.road.update(16);
const before=hold.road.state.progress;
hold.audio.context.getOutputTimestamp=()=>({contextTime:0,performanceTime:0});
hold.audio.context.outputLatency=.2;hold.road.update(16);
assert.equal(hold.road.state.progress,before);
console.log(JSON.stringify({outputDelaysMs:[0,20,80,150,250],gears:3,
  physicalDownbeatArrivals:arrivals,perfectHeardBeatInputs:accepted,
  olderKeyboardEvents:true,manualCalibrationOnce:true,invalidTimestampFallbacks:true,
  pausedClock:true,noRoadRewind:true}));
