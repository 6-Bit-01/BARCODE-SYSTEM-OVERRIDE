// Tests the production bridge PCM and audio ownership without running a song.
// Optional --write-review exports those exact synthesized buffers, not a device
// recording or an excerpt of the supplied soundtrack.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sandbox={window:{},document:{readyState:'loading',addEventListener(){}},
  console:{log(){},warn(){},error(){}},setTimeout(){throw Error('bridge started a timer');},clearTimeout(){}};
vm.runInNewContext(fs.readFileSync(path.join(root,'src/engine/audio.js'),'utf8'),sandbox);
const contract=JSON.parse(fs.readFileSync(path.join(root,'docs/technical/music-sync-baseline.json')));
for(const [name,digest]of Object.entries(contract.methods))assert.equal(crypto.createHash('sha256')
  .update(sandbox.window.AudioSystem.prototype[name].toString()).digest('hex'),digest,
  `${name}: protected source/sync method must remain identical`);
const nodes=[],param=()=>({value:1}),node=kind=>{const n={kind,gain:param(),connections:[],
  connect(other){this.connections.push(other);},disconnect(){this.disconnected=true;},
  start(at){this.at=at;},stop(){this.stopped=true;}};nodes.push(n);return n;};
const ctx={currentTime:1,state:'running',sampleRate:48000,
  createGain:()=>node('gain'),createBufferSource:()=>node('source'),
  createBuffer(channels,length,rate){const data=new Float32Array(length);
    return {duration:length/rate,length,sampleRate:rate,getChannelData:()=>data};},
  async suspend(){this.state='suspended';},async resume(){this.state='running';}};
const audio=new sandbox.window.AudioSystem();audio.context=ctx;audio.sfxGain=ctx.createGain();
audio.sfxGain.gain.value=.8;
const names=['relay','original','clean','tape','ignition'],buffers=new Map(),metrics={};
for(const name of names){
  const buffer=audio.createCacheBridgeBuffer(name),data=buffer.getChannelData(0);
  let peak=0,squared=0;
  for(const value of data){assert(Number.isFinite(value));peak=Math.max(peak,Math.abs(value));squared+=value*value;}
  assert(buffer.duration<=2);assert.equal(data[0],0);assert.equal(data.at(-1),0);
  assert(peak<.66&&peak>.05);assert(Math.sqrt(squared/data.length)>.02);
  buffers.set(name,buffer);metrics[name]={duration:buffer.duration,peak,rms:Math.sqrt(squared/data.length)};
}
const original=buffers.get('original').getChannelData(0),clean=buffers.get('clean').getChannelData(0);
const slotSeconds=60/128/2,removed=[1,3,6];let identical=0,silentRemoved=0;
for(let i=0;i<original.length;i++){
  const slot=Math.floor(i/32000/slotSeconds);
  if(removed.includes(slot)){assert.equal(clean[i],0);if(original[i]!==0)silentRemoved++;}
  else{assert.equal(clean[i],original[i],'surviving motif notes are exactly level/timing matched');identical++;}
}
assert(silentRemoved>17000,'three removed notes produce actual gaps, not a global volume reduction');
for(const name of names){
  assert(audio.playCacheBridgeCue(name));assert.equal(audio.combatVoices.size,1);
  const voice=[...audio.combatVoices][0];assert(voice.bridge);assert.equal(voice.source.loop,false);
  assert.equal(voice.source.at,ctx.currentTime);assert.equal(voice.gain.connections[0],audio.sfxGain);
  assert.equal(audio.lastSFXCue.synthesized,true);ctx.currentTime+=.05;
}
assert.equal(audio.cacheBridgeBuffers.size,5);assert.equal(audio.roadEngine,undefined);
assert.equal(audio.layersStarted,false);assert.equal(Object.keys(audio.musicTracks).length,0);
const cache=audio.cacheBridgeBuffers.get('original');
audio.playCacheBridgeCue('original');assert.equal(audio.cacheBridgeBuffers.get('original'),cache);
audio.sfxGain.gain.value=0;audio.playCacheBridgeCue('clean');
assert.equal([...audio.combatVoices][0].gain.connections[0].gain.value,0,'SFX mute applies through shared bus');
audio.stopCacheBridgeAudio();assert.equal(audio.combatVoices.size,0);
assert.equal(audio.playCacheBridgeCue('unknown'),false);assert.equal(audio.cacheBridgeBuffers.size,5);
audio.sfxGain.gain.value=.8;audio.playCacheBridgeCue('tape');
const ended=[...audio.combatVoices][0];ended.source.onended();
assert.equal(audio.combatVoices.size,0);assert(ended.source.disconnected&&ended.gain.disconnected);
(async()=>{
  audio.playCacheBridgeCue('original');const result=await audio.pauseRuntimeAudio();assert(result.ok);
  assert.equal(audio.combatVoices.size,0);assert.equal(audio.playCacheBridgeCue('clean'),false);
  await audio.resumeRuntimeAudio();assert.equal(audio.combatVoices.size,0,'resume does not restart a motif');
  audio.playCacheBridgeCue('ignition');audio.stopCombatCues();assert.equal(audio.combatVoices.size,0);
  const summary={kind:'original-synthesized-cues',notSongExcerpts:true,noSpeech:true,metrics,
    motif:{bpm:128,palette:'D/A octaves',retainedSamplesIdentical:identical,removedNonzeroSamples:silentRemoved,
      removedEighthSlotsOneBased:[2,4,7]},maxDurationSec:1.94,cacheEntries:5,maxBridgeVoices:1,
    naturalEndCleanup:true,pageExitCleanup:true,pauseCleanup:true,noAutoResume:true,
    sharedSfxMute:true,noMusicSources:true,noEngine:true,protectedSyncHashes:true};
  if(process.argv.includes('--write-review')){
    const dir=path.join(root,'docs/source-pack/review-cache-bridge');fs.mkdirSync(dir,{recursive:true});
    let cursor=0;const order=names.map(name=>{const buffer=buffers.get(name),start=cursor;
      cursor+=buffer.duration+.4;return {name,start,duration:buffer.duration,gain:name==='ignition'?.55:.60};});
    const count=Math.ceil(cursor*32000),pcm=Buffer.alloc(count*2);
    for(const cue of order){const data=buffers.get(cue.name).getChannelData(0),offset=Math.round(cue.start*32000);
      for(let i=0;i<data.length;i++)pcm.writeInt16LE(Math.round(data[i]*cue.gain*.8*32767),(offset+i)*2);}
    const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(pcm.length+36,4);header.write('WAVE',8);
    header.write('fmt ',12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);
    header.writeUInt32LE(32000,24);header.writeUInt32LE(64000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);
    header.write('data',36);header.writeUInt32LE(pcm.length,40);
    fs.writeFileSync(path.join(dir,'Bridge-Cues.wav'),Buffer.concat([header,pcm]));
    fs.writeFileSync(path.join(dir,'Bridge-Audio-Checks.json'),JSON.stringify({...summary,audition:{
      note:'Exact production synthesized PCM at SFX gain 0.8. No original song, speech, engine loop or device recording.',
      seconds:count/32000,order}},null,2)+'\n');
  }
  console.log(JSON.stringify(summary));
})().catch(error=>{console.error(error);process.exitCode=1;});
