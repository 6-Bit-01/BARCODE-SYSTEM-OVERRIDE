// Scripted native review of the production ending and its exact synthesized PCM.
// Local image delivery, Chapter/road persistence and the Web Audio host are boundaries.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const {once}=require('node:events');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let encoder;

async function main() {
  const out=path.resolve(process.argv.slice(2).find(arg=>arg!=='--stills-only')||path.join(root,'docs/source-pack/review-cache-ending'));
  fs.mkdirSync(out,{recursive:true});
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const saves=[],archive={status:'ready',record:{progress:{items:['stem.bass']}}};
  let saveState='saved',finishCalls=0;
  const road={active:true,status:'clear',chapter:{delivery:{ending:{version:1,page:0,cue:0,done:false}}},
    armResultControls(){finishCalls++;}};
  const w={BARCODE:{Campaign:{archive:()=>archive},CacheRoadProof:road,
    CacheChapter:{persist:value=>{saves.push({...value.chapter.delivery.ending});return saveState==='saved';},
      saveStatus:()=>saveState},
    Preferences:{values:{reducedMotion:false}},GamepadUI:{connected:false}},
    gameState:{paused:false},isPaused:false};
  const sandbox={window:w,document:{readyState:'loading',addEventListener(){}},
    console:{log(){},warn(){},error(){}},setTimeout(){throw Error('Unexpected review timer');},clearTimeout(){}};
  const context=vm.createContext(sandbox),productionSources={};
  for(const file of ['src/engine/audio.js','src/engine/cache-ending.js']) {
    const source=fs.readFileSync(path.join(root,file),'utf8');
    productionSources[file]=crypto.createHash('sha256').update(source).digest('hex');
    vm.runInContext(source,context,{filename:file});
  }
  const B=w.BARCODE,ending=B.CacheEnding;
  const images=await Promise.all(ending.panels.map(panel=>loadImage(path.join(root,panel.asset))));
  assert.equal(images.length,4);
  // Decode once. The native drawing receives the actual authored images;
  // this deliberately does not exercise the browser/network Image loader.
  ending.loadImages=()=>{ending.images=images.map(element=>({status:'ready',element}));};

  const events=[],sources=[];let cueName=null;
  const audioContext={currentTime:0,state:'running',sampleRate:32000,
    createBuffer(channels,length,rate) {
      assert.equal(channels,1);const samples=new Float32Array(length);
      return {length,sampleRate:rate,duration:length/rate,getChannelData:()=>samples};
    },
    createGain(){return {gain:{value:1},connect(destination){this.destination=destination;},disconnect(){}};},
    createBufferSource() {
      const source={connect(destination){this.destination=destination;},disconnect(){},
        start(at) {
          const event={kind:cueName,start:at,stop:at+this.buffer.duration,
            naturalEnd:at+this.buffer.duration,buffer:this.buffer,
            gain:this.destination.gain.value*this.destination.destination.gain.value};
          this.event=event;events.push(event);
        },
        stop(at=audioContext.currentTime){if(this.event)this.event.stop=Math.min(this.event.stop,at);}};
      sources.push(source);return source;
    }
  };
  const audio=w.audioSystem=new w.AudioSystem();audio.context=audioContext;
  audio.sfxGain=audioContext.createGain();audio.sfxGain.gain.value=.8;
  const play=audio.playCacheBridgeCue.bind(audio);
  audio.playCacheBridgeCue=name=>{cueName=name;try{return play(name);}finally{cueName=null;}};
  audio.stopRuntimeAudio=()=>audio.stopCacheBridgeAudio();
  const tickAudio=seconds=>{
    audioContext.currentTime=seconds;
    for(const source of sources)if(source.onended&&source.event?.naturalEnd<=seconds)source.onended();
  };

  const scene=createCanvas(1920,1080),ctx=scene.getContext('2d');
  const video=createCanvas(1280,720),videoCtx=video.getContext('2d');
  const contact=createCanvas(1920,1080),contactCtx=contact.getContext('2d');
  const textBounds=[],layoutChecks=[];let recordingBounds=false,currentTexts=[];
  const nativeText=ctx.fillText.bind(ctx);
  ctx.fillText=(value,x,y,...rest)=>{
    if(recordingBounds) {
      const metrics=ctx.measureText(String(value));
      const left=x-metrics.actualBoundingBoxLeft,right=x+metrics.actualBoundingBoxRight;
      const top=y-metrics.actualBoundingBoxAscent,bottom=y+metrics.actualBoundingBoxDescent;
      const transform=ctx.getTransform(),points=[[left,top],[right,top],[right,bottom],[left,bottom]]
        .map(([px,py])=>[transform.a*px+transform.c*py+transform.e,transform.b*px+transform.d*py+transform.f]);
      currentTexts.push({text:String(value),x,y,font:ctx.font,corners:points,
        bounds:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),
          Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]});
    }
    return nativeText(value,x,y,...rest);
  };
  const overlap=(a,b)=>Math.min(a[2],b[2])-Math.max(a[0],b[0])>.5&&
    Math.min(a[3],b[3])-Math.max(a[1],b[1])>.5;
  const inside=(a,b)=>a[0]>=b[0]-1&&a[1]>=b[1]-1&&a[2]<=b[2]+1&&a[3]<=b[3]+1;
  const monitorGlass={DELIVERED:[[235,190],[519,241],[514,472],[226,442]],
    UNVERIFIED:[[629,271],[823,312],[822,502],[626,483]]};
  const insideConvex=(point,polygon)=>{
    const signs=polygon.map((p,i)=>{const next=polygon[(i+1)%polygon.length];
      return (next[0]-p[0])*(point[1]-p[1])-(next[1]-p[1])*(point[0]-p[0]);});
    return signs.every(sign=>sign>=-1)||signs.every(sign=>sign<=1);
  };
  function inspectLayout(page,cue,reduced,transcript=false,variant='standard') {
    ending.page=page;ending.cue=cue;ending.cueElapsedMs=240;ending.transcriptOpen=transcript;
    B.Preferences.values.reducedMotion=reduced;currentTexts=[];recordingBounds=true;
    ctx.reset();ending.draw(ctx);recordingBounds=false;
    for(const entry of currentTexts) {
      assert(entry.bounds.every(Number.isFinite),'native text bounds are finite');
      assert(inside(entry.bounds,[0,0,1920,1080]),`Text escapes Canvas: ${entry.text}`);
      if(page===1&&monitorGlass[entry.text]) {
        const f=ending.frame,scale=Math.min(f.w/1860,f.h/845);
        const ox=f.x+(f.w-1860*scale)/2,oy=f.y+(f.h-845*scale)/2;
        for(const [x,y] of entry.corners)assert(insideConvex([(x-ox)/scale,(y-oy)/scale],monitorGlass[entry.text]),
          `Receiver stamp escapes measured painted glass: ${entry.text}`);
      }
      if(entry.y>=844&&entry.y<987) {
        const region=entry.x<996?[64,844,920,987]:[996,844,1852,987];
        assert(inside(entry.bounds,region),`Caption escapes its panel: ${entry.text}`);
      }
      if(entry.y>=1011) {
        const hit=Object.entries(ending.bounds).find(([name,[x,y,width,height]])=>
          entry.x===x+16&&entry.y===y+13);
        if(hit) {
          const [, [x,y,width,height]]=hit;
          assert(inside(entry.bounds,[x,y,x+width,y+height]),`Control label escapes ${hit[0]}`);
        } else assert(inside(entry.bounds,[650,1011,1225,1060]),
          `Skip control escapes its slot: ${entry.text}`);
      }
      if(transcript&&entry.y>=154&&entry.y<744)
        assert(inside(entry.bounds,[160,154,1760,744]),`Transcript text escapes panel: ${entry.text}`);
    }
    for(let i=0;i<currentTexts.length;i++)for(let j=i+1;j<currentTexts.length;j++) {
      const a=currentTexts[i],b=currentTexts[j];
      assert(!overlap(a.bounds,b.bounds),`Text overlaps on page ${page+1}: ${a.text} / ${b.text}`);
    }
    layoutChecks.push({page:page+1,cue,reducedMotion:reduced,transcript,variant,textCount:currentTexts.length});
    if(cue===2&&!transcript)textBounds.push({page:page+1,reducedMotion:reduced,variant,text:currentTexts});
    return currentTexts.map(entry=>({text:entry.text,bounds:entry.bounds}));
  }
  const contactTileHashes=[];
  ending.active=true;ending.loadImages();
  for(let page=0;page<4;page++) {
    for(let cue=0;cue<3;cue++) {
      const normal=inspectLayout(page,cue,false),reduced=inspectLayout(page,cue,true);
      assert.deepEqual(normal,reduced,'Reduced Motion keeps all captions and controls in place');
    }
    inspectLayout(page,2,false,true);inspectLayout(page,2,true,true);
    inspectLayout(page,2,false);
    fs.writeFileSync(path.join(out,`Ending-${String(page+1).padStart(2,'0')}.webp`),scene.toBuffer('image/webp',92));
    // Native drawImage can retain a live Canvas reference until encoding.
    // Snapshot each scaled tile so later scene draws cannot replace it.
    videoCtx.drawImage(scene,0,0,960,540);
    const tile=videoCtx.getImageData(0,0,960,540);
    contactCtx.putImageData(tile,(page%2)*960,Math.floor(page/2)*540);
    contactTileHashes.push(crypto.createHash('sha256').update(tile.data).digest('hex'));
  }
  assert.equal(new Set(contactTileHashes).size,4,'contact sheet retains four distinct scene snapshots');
  fs.writeFileSync(path.join(out,'Ending-Contact.webp'),contact.toBuffer('image/webp',94));
  for(let page=0;page<4;page++) {
    B.GamepadUI.connected=true;
    inspectLayout(page,2,false,false,'controller');
    inspectLayout(page,2,false,true,'controller-transcript');
    B.GamepadUI.connected=false;saveState='unavailable';
    inspectLayout(page,2,false,false,'save-warning');
    saveState='saved';
    ending.images=images.map(()=>({status:'unavailable',element:null}));
    inspectLayout(page,2,false,false,'missing-art');
    ending.loadImages();
  }
  ending.dispose({reset:true});events.length=0;sources.length=0;saves.length=0;
  B.Preferences.values.reducedMotion=false;
  if(process.argv.includes('--stills-only')) {
    console.log(`Ending still review passed: four distinct scenes, ${layoutChecks.length} native layout checks.`);
    return;
  }

  const fps=12,seconds=32,frameCount=fps*seconds;
  const silent=path.join(out,'Ending-Review-silent.tmp.mp4');
  encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba',
    '-video_size','1280x720','-framerate',String(fps),'-i','pipe:0','-an',
    '-c:v','libx264','-threads','2','-preset','medium','-crf','19','-pix_fmt','yuv420p',silent],
  {stdio:['pipe','ignore','pipe']});
  let encoderError='';encoder.stderr.on('data',data=>{encoderError+=data;});
  const completion=once(encoder,'close');
  audioContext.currentTime=0;ending.start();
  const cueTransitions=[];let previous='';
  for(let frame=0;frame<frameCount;frame++) {
    tickAudio(frame/fps);
    if(frame)ending.update(1000/fps);
    if(frame&&frame%(8*fps)===0) {
      assert.equal(ending.cue,2,'each auto-advance follows both real timed dialogue cues');
      assert(ending.page<3,'review never invokes Finish chapter');ending.advance();
    }
    assert.equal(ending.page,Math.floor(frame/(8*fps)));
    const cue=`${ending.page}:${ending.cue}`;
    if(cue!==previous){cueTransitions.push({page:ending.page+1,cue:ending.cue,at:frame/fps});previous=cue;}
    ctx.reset();ending.draw(ctx);videoCtx.drawImage(scene,0,0,1280,720);
    if(!encoder.stdin.write(Buffer.from(videoCtx.getImageData(0,0,1280,720).data)))
      await once(encoder.stdin,'drain');
    if(frame%(8*fps)===0)console.log(`Ending native review: page ${ending.page+1}/4`);
  }
  tickAudio(seconds);audio.stopCacheBridgeAudio();
  assert.equal(ending.page,3);assert.equal(ending.cue,2);assert(ending.active&&!ending.done);
  encoder.stdin.end();const [code,signal]=await completion;encoder=null;
  assert.equal(code,0,encoderError||`ffmpeg stopped: ${signal}`);

  const sampleRate=32000,mix=new Float32Array(sampleRate*seconds);
  for(const event of events) {
    assert.equal(event.buffer.sampleRate,sampleRate);
    const samples=event.buffer.getChannelData(0),offset=Math.round(event.start*sampleRate);
    const count=Math.min(samples.length,Math.max(0,Math.round((event.stop-event.start)*sampleRate)),mix.length-offset);
    for(let i=0;i<count;i++)mix[offset+i]+=samples[i]*event.gain;
  }
  let peak=0,squared=0;const pcm=Buffer.alloc(mix.length*2);
  for(let i=0;i<mix.length;i++) {
    peak=Math.max(peak,Math.abs(mix[i]));squared+=mix[i]*mix[i];
    assert(Math.abs(mix[i])<1,'preview PCM never clips');pcm.writeInt16LE(Math.round(mix[i]*32767),i*2);
  }
  assert(peak>.03&&events.length===2,'both real ending cues appear in the review');
  assert.deepEqual(events.map(event=>event.kind),['relay','tape']);
  assert.deepEqual(events.map(event=>event.start),[0,16]);
  assert.equal(cueTransitions.length,12,'all four title and eight dialogue cues appear');
  assert.equal(finishCalls,0,'review does not dismiss the final handoff');
  assert(saves.every(saved=>saved.done===false),'capture never marks chapter reading done');
  const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(pcm.length+36,4);
  header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);
  header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(sampleRate,24);
  header.writeUInt32LE(sampleRate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);
  header.write('data',36);header.writeUInt32LE(pcm.length,40);
  const wav=path.join(out,'Ending-Review.wav');fs.writeFileSync(wav,Buffer.concat([header,pcm]));
  const pauseSamples=Math.round(.3*sampleRate),leadSamples=Math.round(.2*sampleRate);
  const cueCounts=events.map(event=>Math.round((event.stop-event.start)*sampleRate));
  const cuePcm=Buffer.alloc((leadSamples+cueCounts.reduce((sum,count)=>sum+count+pauseSamples,0))*2);
  const cueSchedule=[];let cueOffset=leadSamples;
  events.forEach((event,index)=>{
    const sourceOffset=Math.round(event.start*sampleRate)*2,count=cueCounts[index];
    pcm.copy(cuePcm,cueOffset*2,sourceOffset,sourceOffset+count*2);
    cueSchedule.push({kind:event.kind,start:cueOffset/sampleRate,duration:count/sampleRate});
    cueOffset+=count+pauseSamples;
  });
  const cueHeader=Buffer.from(header);cueHeader.writeUInt32LE(cuePcm.length+36,4);cueHeader.writeUInt32LE(cuePcm.length,40);
  const audition=path.join(out,'Ending-Cues.wav');fs.writeFileSync(audition,Buffer.concat([cueHeader,cuePcm]));
  const movie=path.join(out,'Ending-Review.mp4');
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',silent,'-i',wav,'-map','0:v:0','-map','1:a:0',
    '-c:v','copy','-c:a','aac','-b:a','160k','-t',String(seconds),'-movflags','+faststart',movie]);
  fs.unlinkSync(silent);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',movie],{encoding:'utf8'}));
  const stream=probe.streams.find(item=>item.codec_type==='video');
  assert.equal(Number(stream.nb_frames),frameCount);assert.equal(Number(stream.duration),seconds);
  assert.equal(stream.width,1280);assert.equal(stream.height,720);
  const report={kind:'scripted native production draw with exact synthesized PCM; not Makko capture',
    seconds,fps,frames:frameCount,canvas:[1920,1080],video:[1280,720],contactSheet:[1920,1080],
    localImagesLoadedOnce:images.length,contextsCreated:3,contextsPerFrame:0,
    advance:'Every eight seconds, only after cue 2; final Ready remains active and Finish chapter is never invoked.',
    productionSources,
    hostBoundaries:['Native Canvas and locally decoded art replace browser/network image delivery.',
      'Road clear, earned Bass and chapter persistence are explicit host fixtures, not integration evidence.',
      'Web Audio nodes capture actual production-synthesized buffers and scheduling; no real-time device playback.',
      'Controller layout uses production default button labels; no physical controller is exercised.'],
    checkpointWrites:saves.length,finishCalls,
    images:ending.panels.map((panel,i)=>({path:panel.asset,sha256:hash(path.join(root,panel.asset)),width:images[i].width,height:images[i].height})),
    layout:{nativeTextMetrics:true,checks:layoutChecks,actualTextBounds:textBounds,overlaps:0,escapes:0,
      reducedMotionSameLayout:true,monitorLabelsInsideMeasuredGlass:true,monitorGlassSourcePixels:monitorGlass},
    cueTransitions,finalState:{...ending.serialize(),active:ending.active,done:ending.done},
    audio:{source:'Production AudioSystem.playCacheBridgeCue/createCacheBridgeBuffer/stopCacheBridgeAudio.',
      sampleRate,channels:1,sfxGain:.8,peak,rms:Math.sqrt(squared/mix.length),noSpeech:true,noSong:true,
      noRoadEngine:true,activeVoicesAfterStop:audio.combatVoices.size,
      cues:events.map(({kind,start,stop,naturalEnd,gain})=>({kind,start,stop,naturalEnd,gain})),
      audition:{path:'Ending-Cues.wav',seconds:cuePcm.length/(sampleRate*2),sha256:hash(audition),cues:cueSchedule,
        note:'The same exact PCM cue segments with only the long reading silence removed.'},
      pcmSha256:hash(wav),note:'WAV is exact scheduled PCM at the stated SFX gain; MP4 contains its AAC encoding.'},
    outputs:['Ending-Contact.webp',...Array.from({length:4},(_,i)=>`Ending-${String(i+1).padStart(2,'0')}.webp`),
      'Ending-Review.wav','Ending-Cues.wav','Ending-Review.mp4']};
  fs.writeFileSync(path.join(out,'Ending-Review.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Ending review passed: ${frameCount} frames, ${seconds}s, ${layoutChecks.length} native layout checks, ${events.length} exact PCM cues, final Ready retained.`);
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;}).finally(()=>{if(encoder)encoder.kill();});
