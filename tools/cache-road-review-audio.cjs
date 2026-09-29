// Replay the production drive's recorded cue calls and stem ramps through
// real Web Audio. The game simulation itself lives in the render tool.
module.exports = async function renderRoadAudio(trace) {
  const rate=22050,seconds=trace.seconds;
  const context=new OfflineAudioContext(2,Math.ceil(rate*seconds),rate);
  const audio=new AudioSystem();
  let clock=0;
  audio.context=new Proxy(context,{get(target,key) {
    if(key==='state')return 'running';
    if(key==='currentTime')return clock;
    const value=target[key];
    return typeof value==='function'?value.bind(target):value;
  }});
  audio.sfxGain=context.createGain();audio.sfxGain.connect(context.destination);
  const music=context.createGain();music.gain.value=.8;music.connect(context.destination);
  const events=trace.audioEvents.map(event=>({...event,type:'cue',time:event.calledAt}));
  for(const event of trace.mixEvents||[])events.push({...event,type:'mix',time:event.at});
  for(const event of trace.engineEvents||[])if(event.at<seconds-.08)
    events.push({...event,type:'engine',time:event.at});
  // Fade only at the finite review clip edge; the live game owns its lifecycle.
  if(trace.engineEvents?.length)events.push({type:'engine',active:false,time:seconds-.08});
  for(const id of new Set((trace.mixEvents||[]).map(event=>event.sourceId))) {
    const response=await fetch(`/assets/audio/${id}.mp3`);
    if(!response.ok)throw Error(`Review audio missing: ${id}`);
    const buffer=await context.decodeAudioData(await response.arrayBuffer());
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=buffer;gain.gain.value=0;source.connect(gain);gain.connect(music);
    source.start(0);audio.musicTracks[id]={gain,volume:0};
  }
  const groups=new Map(),scheduled=[];
  for(const event of events.sort((a,b)=>a.time-b.time)) {
    const quantum=Math.max(0,Math.floor(event.time*rate/128));
    if(quantum*128>=context.length)continue;
    if(!groups.has(quantum))groups.set(quantum,[]);
    groups.get(quantum).push(event);
  }
  const waits=[];
  for(const [quantum,batch] of groups) {
    waits.push(context.suspend(quantum*128/rate).then(()=>{
      for(const event of batch) {
        clock=event.time;
        if(event.type==='mix')audio.rampAdaptiveStemGain(
          audio.musicTracks[event.sourceId],event.volume,event.duration);
        else if(event.type==='engine') {
          audio.updateRoadEngine(event);
        } else {
          const ok=audio.playCombatCue(event.kind,{...event.options,audioTimeSec:event.at});
          scheduled.push({kind:event.kind,requested:event.at,ok,
            actual:audio.lastSFXCue?.audioTimeSec});
        }
      }
      return context.resume();
    }));
  }
  const buffer=await context.startRendering();await Promise.all(waits);
  const pcm=new ArrayBuffer(44+buffer.length*4),view=new DataView(pcm);
  const str=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));};
  str(0,'RIFF');view.setUint32(4,pcm.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,2,true);
  view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);view.setUint16(32,4,true);
  view.setUint16(34,16,true);str(36,'data');view.setUint32(40,pcm.byteLength-44,true);
  let peak=0,energy=0;
  for(let i=0;i<buffer.length;i++)for(let channel=0;channel<2;channel++) {
    const sample=buffer.getChannelData(channel)[i];
    if(!Number.isFinite(sample))throw Error('Non-finite road audio');
    peak=Math.max(peak,Math.abs(sample));energy+=sample*sample;
    view.setInt16(44+(i*2+channel)*2,Math.max(-1,Math.min(1,sample))*32767,true);
  }
  audio.stopRoadEngine?.();
  audio.stopCombatCues();
  const bytes=new Uint8Array(pcm);let binary='';
  for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  return {peak,rms:Math.sqrt(energy/(buffer.length*2)),scheduled,
    remainingVoices:audio.combatVoices?.size||0,engineStopped:!audio.roadEngine,pcm:btoa(binary)};
};
