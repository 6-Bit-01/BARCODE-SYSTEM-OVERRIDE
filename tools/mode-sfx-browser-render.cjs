// Real Web Audio rendering of the production one-shots. The facade supplies
// scheduled game times to an offline context; buffers, routing and DSP are real.
module.exports=async function renderModeSFX(muted){
 const rate=22050,seconds=6,ctx=new OfflineAudioContext(2,rate*seconds,rate),audio=new AudioSystem();
 let time=0;audio.context=new Proxy(ctx,{get(target,key){if(key==='state')return 'running';if(key==='currentTime')return time;const v=target[key];return typeof v==='function'?v.bind(target):v;}});
 audio.sfxGain=ctx.createGain();audio.sfxGain.gain.value=muted?0:.7;audio.sfxGain.connect(ctx.destination);
 const schedule=[['hack-in',.15],['hack-guard',1.35],['hack-out',2.35],['rhythm-in',3.35],['rhythm-hit',4.55]],scheduled=[];
 for(const [kind,at] of schedule){time=at;if(!audio.playModeCue(kind))throw new Error('Cue rejected: '+kind);scheduled.push({kind,at});}
 const result=await ctx.startRendering(),windows=[];let peak=0;
 for(const [kind,at] of schedule){let sum=0;const data=result.getChannelData(0),start=Math.round(at*rate),end=Math.round((at+.9)*rate);for(let i=start;i<end;i++)sum+=data[i]*data[i];windows.push({kind,rms:Math.sqrt(sum/(end-start))});}
 const pcm=new ArrayBuffer(44+result.length*4),v=new DataView(pcm),str=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
 str(0,'RIFF');v.setUint32(4,pcm.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,2,true);
 v.setUint32(24,rate,true);v.setUint32(28,rate*4,true);v.setUint16(32,4,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,pcm.byteLength-44,true);
 for(let i=0;i<result.length;i++)for(let c=0;c<2;c++){const sample=result.getChannelData(c)[i];if(!Number.isFinite(sample))throw new Error('Non-finite PCM');peak=Math.max(peak,Math.abs(sample));v.setInt16(44+(i*2+c)*2,Math.max(-1,Math.min(1,sample))*32767,true);}
 const bytes=new Uint8Array(pcm);let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
 audio.stopCombatCues();return{muted,scheduled,peak,windows,cachedBuffers:Object.keys(audio.modeBuffers).length,remainingVoices:audio.combatVoices.size,pcm:btoa(binary)};
};
