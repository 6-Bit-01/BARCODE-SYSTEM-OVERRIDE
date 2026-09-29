// Production sound synthesis/ownership checks. This does not claim device
// speaker quality or game/music balance; the Chromium audition covers mixing.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const sandbox = {window:{},document:{readyState:'loading',addEventListener(){}},
  console:{log(){},warn(){},error(){}},setTimeout,clearTimeout,setInterval,clearInterval};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/engine/audio.js'),'utf8'),sandbox);
class Param {
  constructor(value=0){this.value=value;this.events=[];}
  setValueAtTime(value,time){this.value=value;this.events.push(['value',value,time]);}
  linearRampToValueAtTime(value,time){this.value=value;this.events.push(['linear',value,time]);}
  exponentialRampToValueAtTime(value,time){this.value=value;this.events.push(['exp',value,time]);}
  setTargetAtTime(value,time,duration){this.value=value;this.events.push(['target',value,time,duration]);}
  cancelScheduledValues(time){this.events=this.events.filter(e=>e[2]<time);}
  cancelAndHoldAtTime(time){this.events=[];this.events.push(['hold',this.value,time]);}
}
function context() {
  const nodes=[];
  const node=kind=>{const n={kind,frequency:new Param(),gain:new Param(),Q:new Param(),
    pan:new Param(),playbackRate:new Param(1),connect(){},disconnect(){this.disconnected=true;},
    start(time){this.started=time;},stop(time){this.stopped=time===undefined?ctx.currentTime:time;},
    setPeriodicWave(){}};nodes.push(n);return n;};
  const ctx={state:'running',currentTime:10,sampleRate:48000,nodes,
    createGain:()=>node('gain'),createOscillator:()=>node('oscillator'),
    createBufferSource:()=>node('source'),createStereoPanner:()=>node('pan'),
    createBiquadFilter:()=>node('filter'),createPeriodicWave:()=>({}),
    createBuffer(channels,length,rate){const data=new Float32Array(length);
      return {sampleRate:rate,duration:length/rate,length,getChannelData:()=>data};},
    async suspend(){this.state='suspended';},async resume(){this.state='running';}};
  return ctx;
}
const audio=new sandbox.window.AudioSystem(),ctx=audio.context=context();
audio.sfxGain=ctx.createGain();audio.musicGain=ctx.createGain();
const names=['Count','Ready','Perfect','Good','Crash','Brace','NearMiss','Shift','Lock','Turbo',
  'TurboReady','Echo','Push','Refill','Warning','Full','Queued','Miss','Empty'];
let checked=0,peak=0,minRms=Infinity;
for(const rootBar of [0,21])for(const name of names)for(let action=0;action<4;action++){
  const settings=audio.roadCueSettings(`road${name}`,{trackTimeSec:rootBar*1.875,action,countBeat:4});
  const samples=audio.createRoadCueBuffer(settings).getChannelData(0);
  let square=0;
  for(const sample of samples){assert(Number.isFinite(sample));peak=Math.max(peak,Math.abs(sample));square+=sample*sample;}
  const rms=Math.sqrt(square/samples.length);minRms=Math.min(minRms,rms);
  assert.equal(samples[0],0);assert.equal(samples.at(-1),0);
  assert(rms>.009,`${name} has audible PCM energy`);checked++;
}
assert(peak<=.68002,'headroom is explicit before SFX bus gain');
let fBars=[];
for(let bar=0;bar<100;bar++)if(audio.roadCueSettings('roadPerfect',{trackTimeSec:bar*1.875}).noteRoot==='F')fBars.push(bar+1);
assert.deepEqual(fBars,[22,26,46,50,70,74,94,98]);
// Autocorrelation checks the synthesized count note against the measured song
// root, independent of the metadata's labels; adjacent semitones must fit worse.
for(const bar of [0,21]){
  const s=audio.roadCueSettings('roadCount',{trackTimeSec:bar*1.875,countBeat:4});
  const data=audio.createRoadCueBuffer(s).getChannelData(0);
  const correlate=hz=>{const lag=Math.round(32000/hz);let sum=0;
    for(let i=300;i<data.length-lag;i++)sum+=data[i]*data[i+lag];return sum;};
  assert(correlate(s.rootHz)>correlate(s.rootHz*2**(1/12))*1.07);
  assert(correlate(s.rootHz)>correlate(s.rootHz/2**(1/12))*1.07);
}
// Exact deadlines, horizon, cadence, legacy routing and priority reservations.
assert(audio.playCombatCue('roadCount',{audioTimeSec:10.3,countBeat:2}));
assert.equal(audio.lastSFXCue.audioTimeSec,10.3);
assert.equal([...audio.combatVoices][0].source.started,10.3);
assert.equal(audio.playRoadCue('roadCount',{audioTimeSec:10.31}),false);
assert(audio.playRoadCue('roadReady',{audioTimeSec:20}));assert.equal(audio.lastSFXCue.audioTimeSec,10.4);
audio.stopCombatCues();ctx.currentTime=11;
assert(audio.playCombatCue('damage'));assert.equal(audio.lastSFXCue.road,undefined);
assert.equal([...audio.combatVoices][0].source,undefined,'legacy effect remains oscillator based');
audio.stopCombatCues();
for(let i=0;i<12;i++){ctx.currentTime+=.5;assert(audio.playRoadCue('roadQueued'));}
assert.equal(audio.combatVoices.size,12);
ctx.currentTime+=.5;assert(audio.playRoadCue('roadCrash'));
assert.equal(audio.roadSFXStats.evicted,1);assert.equal(audio.combatVoices.size,12);
audio.stopCombatCues();
for(let i=0;i<12;i++){ctx.currentTime+=.5;assert(audio.playRoadCue('roadCrash'));}
ctx.currentTime+=.5;assert.equal(audio.playRoadCue('roadQueued'),false);
audio.stopCombatCues();
for(let n=0;n<names.length;n++)for(const bar of [0,21])for(let action=0;action<4;action++){
  ctx.currentTime+=1;audio.playRoadCue(`road${names[n]}`,{trackTimeSec:bar*1.875,action});
  for(const voice of audio.combatVoices)voice.dispose();
}
assert(audio.roadCueBuffers.size<=96,'PCM cache has a fixed memory bound');
const cacheBuilds=audio.roadSFXStats.cacheBuilds;
ctx.currentTime+=1;audio.playRoadCue('roadEmpty',{trackTimeSec:21*1.875,action:3});
assert.equal(audio.roadSFXStats.cacheBuilds,cacheBuilds,'repeated cue reuses PCM');
audio.stopCombatCues();
// Real engine state updates reuse their three source nodes and bounded Param
// automation; gear load reduces pitch and turbo restores revs without a restart.
assert(audio.updateRoadEngine({active:true,gear:1,speed:52,load:.3}));
const engine=audio.roadEngine,sourceCount=ctx.nodes.filter(n=>['oscillator','source'].includes(n.kind)).length;
for(let i=0;i<6000;i++){ctx.currentTime+=1/60;audio.updateRoadEngine({active:true,gear:1,speed:52,load:.3});}
assert.equal(audio.roadEngine,engine);
assert.equal(ctx.nodes.filter(n=>['oscillator','source'].includes(n.kind)).length,sourceCount);
assert(engine.pulse.frequency.events.length<=2,'parameter history is replaced at each refresh');
const cruise=engine.rpmHz;ctx.currentTime+=.1;
audio.updateRoadEngine({active:true,gear:1,speed:52,load:.3,shifting:1});assert(engine.rpmHz<cruise-20);
ctx.currentTime+=.1;audio.updateRoadEngine({active:true,gear:2,speed:78,boost:1});assert(engine.rpmHz>cruise+15);
audio.stopRoadEngine();assert.equal(audio.roadEngine,null);assert.equal(audio.roadEngineReleases.size,1);
assert(engine.sources.every(source=>source.stopped===ctx.currentTime+.025));
audio.updateRoadEngine({active:true,gear:0,speed:30});assert(engine.disposed);
assert.equal(audio.roadEngineReleases.size,0,'rapid restart retires its release tail');
audio.playRoadCue('roadCrash');
(async()=>{
  const result=await audio.pauseRuntimeAudio();assert(result.ok);
  assert.equal(audio.roadEngine,null);assert.equal(audio.roadEngineReleases.size,0);
  assert.equal(audio.combatVoices.size,0);assert.equal(audio.playRoadCue('roadCount'),false);
  await audio.resumeRuntimeAudio();assert.equal(audio.roadEngine,null,'resume waits for active gameplay');
  audio.updateRoadEngine({active:true,gear:0,speed:30});audio.stopRoadEngine();
  assert.equal(audio.roadEngineReleases.size,1);
  await audio.pauseRuntimeAudio();assert.equal(audio.roadEngineReleases.size,0,
    'pausing during a failure release cannot replay its tail after resume');
  console.log(JSON.stringify({pcmVariants:checked,peak,minRms,firstBeatRoots:{D:92,F:8},
    sourceClockDeadlines:true,voiceCap:12,cacheCap:96,engineUpdates:6000,engineSources:3,
    gearLoad:true,boostRev:true,releaseMs:25,pauseCleanup:true,legacyAudioPreserved:true}));
})().catch(error=>{console.error(error);process.exitCode=1;});
