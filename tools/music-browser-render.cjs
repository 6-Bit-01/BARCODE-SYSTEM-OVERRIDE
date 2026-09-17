// Browser-side production graph renderer. Input boundaries are controlled;
// AudioSystem, MusicDirector, transport, Web Audio DSP and automation are real.
module.exports = async function renderMusic(enabled, assets) {
  const rate=22050, seconds=28, B=window.BARCODE;
  const context=new OfflineAudioContext(2,rate*seconds,rate);
  let rhythm=false,hack=false;
  window.gameState={running:true,paused:false,victory:false}; window.isPaused=false;
  window.player={position:{x:500,y:784}};
  window.enemyManager={getActiveEnemies:()=>[{active:true,position:{x:650,y:784}}]};
  window.rhythmSystem={isActive:()=>rhythm,combo:0};
  window.hackingSystem={isActive:()=>hack};window.sector1Progression=null;
  B.Preferences={values:{dynamicMusic:enabled}};
  B.musicDirector.reset(); B.ensureLevel01MusicProfileSelected();
  const audio=window.audioSystem=new AudioSystem();
  audio.context=context; audio.initialized=true;audio.musicGain=context.createGain();
  audio.musicGain.gain.value=.8;audio.musicGain.connect(context.destination);
  const nodes=new Map(), starts=[];
  const createSource=context.createBufferSource.bind(context);
  context.createBufferSource=()=>{
    const node=createSource(),start=node.start.bind(node);
    node.start=(at,offset)=>{starts.push({at,offset,rate:node.playbackRate.value,loop:node.loop});return start(at,offset);};
    return node;
  };
  const createGain=context.createGain.bind(context);
  context.createGain=()=>{
    const node=createGain(),connect=node.connect.bind(node),disconnect=node.disconnect.bind(node),edges=new Set();
    nodes.set(node,edges);
    node.connect=(to,...rest)=>{edges.add(to);return connect(to,...rest);};
    node.disconnect=(to,...rest)=>{if(to)edges.delete(to);else edges.clear();return to?disconnect(to,...rest):disconnect();};
    return node;
  };
  const ids=['foundation','bass-layer','fx-layer'];
  for(const [index,id] of ids.entries()){
    let buffer;
    if(assets){
      const raw=Uint8Array.from(atob(assets[id]),c=>c.charCodeAt(0));
      const original=await context.decodeAudioData(raw.buffer);
      buffer=context.createBuffer(2,rate*(seconds+1),rate);
      // Identical, beat-aligned excerpt for both renders; runtime offsets stay 0.
      const offset=Math.round(24*4*60/146*rate);
      for(let channel=0;channel<2;channel++)buffer.getChannelData(channel).set(original.getChannelData(Math.min(channel,original.numberOfChannels-1)).subarray(offset,offset+buffer.length));
    }else{
      buffer=context.createBuffer(2,rate*(seconds+1),rate);
      for(let channel=0;channel<2;channel++){
        const data=buffer.getChannelData(channel);
        for(let i=0;i<data.length;i++){
          const t=i/rate,phase=(t%(60/146))/(60/146);
          data[i]=index===0?.28*Math.sin(2*Math.PI*110*t)*Math.exp(-phase*9):index===1?.24*Math.sin(2*Math.PI*937*t)+.12*Math.sin(2*Math.PI*1800*t):.45*Math.sin(2*Math.PI*49*t);
        }
      }
    }
    audio.musicTracks[id]={buffer,volume:0};
  }
  if(!audio.startAllLayersSimultaneously().ok)throw new Error('Music startup failed');
  // Offline rendering owns its advancement; suppress wall-clock host callbacks.
  audio.clearRuntimeTimeouts();clearInterval(audio.loopCheckInterval);audio.loopCheckInterval=null;
  const snapshots=[];
  const waits=[];
  for(let frame=0;frame<seconds*20;frame++){
    waits.push(context.suspend(frame/20).then(()=>{
      const t=context.currentTime; rhythm=t>=7; hack=t>=14 && t<21;
      audio.updateLayers();
      if(frame%10===1){
        const d=B.musicDirector,graph=d.graph;
        snapshots.push({time:t,state:d.state,gains:Object.fromEntries(ids.map(id=>[id,audio.musicTracks[id].gain.gain.value])),
          filterHz:graph?.filter.frequency.value??null,
          colourSource:ids.find(id=>audio.musicTracks[id].gain===graph?.gain)||null,
          foundationDirect:nodes.get(audio.musicTracks.foundation.gain).has(audio.musicGain),
          subBassDirect:nodes.get(audio.musicTracks['fx-layer'].gain).has(audio.musicGain)});
      }
      return context.resume();
    }));
  }
  const rendered=await context.startRendering();await Promise.all(waits);
  let peak=0,clipped=0;const windows={};
  for(const [name,start,end] of [['combat',1,6],['rhythm',8,13],['hack',15,20],['return',22,27]]){
    let sum=0,count=0;
    for(let c=0;c<2;c++){const data=rendered.getChannelData(c);for(let i=start*rate;i<end*rate;i++){sum+=data[i]*data[i];count++;}}
    windows[name]={rms:Math.sqrt(sum/count)};
  }
  // Float WAV preserves headroom measurements; preview encoding happens later.
  const pcm=new ArrayBuffer(44+rendered.length*2*4),view=new DataView(pcm);
  const str=(offset,s)=>{for(let i=0;i<s.length;i++)view.setUint8(offset+i,s.charCodeAt(i));};
  str(0,'RIFF');view.setUint32(4,pcm.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');
  view.setUint32(16,16,true);view.setUint16(20,3,true);view.setUint16(22,2,true);
  view.setUint32(24,rate,true);view.setUint32(28,rate*8,true);view.setUint16(32,8,true);view.setUint16(34,32,true);
  str(36,'data');view.setUint32(40,pcm.byteLength-44,true);
  for(let i=0;i<rendered.length;i++)for(let c=0;c<2;c++){
    const value=rendered.getChannelData(c)[i];peak=Math.max(peak,Math.abs(value));if(Math.abs(value)>1)clipped++;
    view.setFloat32(44+(i*2+c)*4,value,true);
  }
  const bytes=new Uint8Array(pcm);let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
  audio.stopRuntimeAudio();
  return {enabled,starts,snapshots,peak,clipped,windows,pcm:btoa(binary)};
};
