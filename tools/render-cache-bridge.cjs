// Scripted native review of the production bridge and its exact synthesized PCM.
// Local image delivery, Campaign persistence and the Web Audio host are boundaries.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const {once}=require('node:events');
const {inspectDialogue,inspectEffects}=require('./lib/check-cache-scene-layout.cjs');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
let encoder;

async function main() {
  const out=path.resolve(process.argv.slice(2).find(arg=>arg!=='--stills-only')||path.join(root,'docs/source-pack/review-cache-bridge'));
  fs.mkdirSync(out,{recursive:true});
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf','monospace');
  GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf','monospace');
  GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','sans-serif');
  GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','sans-serif');
  const saves=[],w={BARCODE:{Campaign:{archive:()=>({status:'ready'}),
    saveBridgeCheckpoint:state=>{saves.push({...state});return true;}},
    Preferences:{values:{reducedMotion:false}},GamepadUI:{connected:false}},
    gameState:{paused:false},isPaused:false};
  const sandbox={window:w,document:{readyState:'loading',addEventListener(){}},
    console:{log(){},warn(){},error(){}},setTimeout(){throw Error('Unexpected review timer');},clearTimeout(){}};
  const context=vm.createContext(sandbox),productionSources={};
  for(const file of ['src/engine/audio.js','src/engine/intro-sequence.js','src/engine/cache-scene-layouts.js','src/engine/cache-scene-effects.js','src/engine/comic-dialogue.js','src/engine/cache-bridge.js']) {
    const source=fs.readFileSync(path.join(root,file),'utf8');
    productionSources[file]=crypto.createHash('sha256').update(source).digest('hex');
    vm.runInContext(source,context,{filename:file});
  }
  const B=w.BARCODE,bridge=B.CacheBridge;
  const images=await Promise.all(bridge.panels.map(panel=>loadImage(path.join(root,panel.asset))));
  assert.equal(images.length,8);
  // Decode once. The native drawing receives the actual authored images;
  // this deliberately does not exercise the browser/network Image loader.
  bridge.loadImages=()=>{bridge.images=images.map(element=>({status:'ready',element}));};

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
  const contact=createCanvas(1920,2160),contactCtx=contact.getContext('2d');
  const textBounds=[],layoutChecks=[],effectChecks=[];let recordingBounds=false,currentTexts=[];
  const nativeText=ctx.fillText.bind(ctx);
  ctx.fillText=(value,x,y,...rest)=>{
    if(recordingBounds) {
      const metrics=ctx.measureText(String(value));
      const left=x-metrics.actualBoundingBoxLeft,right=x+metrics.actualBoundingBoxRight;
      const top=y-metrics.actualBoundingBoxAscent,bottom=y+metrics.actualBoundingBoxDescent;
      currentTexts.push({text:String(value),x,y,font:ctx.font,bounds:[left,top,right,bottom]});
    }
    return nativeText(value,x,y,...rest);
  };
  const overlap=(a,b)=>Math.min(a[2],b[2])-Math.max(a[0],b[0])>.5&&
    Math.min(a[3],b[3])-Math.max(a[1],b[1])>.5;
  const inside=(a,b)=>a[0]>=b[0]-1&&a[1]>=b[1]-1&&a[2]<=b[2]+1&&a[3]<=b[3]+1;
  function inspectLayout(page,cue,reduced,transcript=false) {
    bridge.page=page;bridge.cue=cue;bridge.cueElapsedMs=240;bridge.sceneElapsedMs=6000;bridge.transcriptOpen=transcript;
    B.Preferences.values.reducedMotion=reduced;currentTexts=[];recordingBounds=true;
    ctx.reset();bridge.draw(ctx);recordingBounds=false;
    for(const entry of currentTexts) {
      assert(entry.bounds.every(Number.isFinite),'native text bounds are finite');
      assert(inside(entry.bounds,[0,0,1920,1080]),`Text escapes Canvas: ${entry.text}`);
      if(entry.y>=1011) {
        const hit=Object.entries(bridge.bounds).find(([name,[x,y,width,height]])=>
          entry.x===x+16&&entry.y===y+13&&(name!=='architecture'||page===7));
        if(hit) {
          const [, [x,y,width,height]]=hit;
          assert(inside(entry.bounds,[x,y,x+width,y+height]),`Control label escapes ${hit[0]}`);
        } else assert(inside(entry.bounds,page===7?[1018,1011,1275,1060]:[730,1011,1260,1060]),
          `Skip control escapes its slot: ${entry.text}`);
      }
      if(transcript&&entry.y>=154&&entry.y<744)
        assert(inside(entry.bounds,[160,154,1760,744]),`Transcript text escapes panel: ${entry.text}`);
    }
    const dialogue=inspectDialogue({scene:bridge,B,chapter:'bridge',ctx,texts:currentTexts});
    for(let i=0;i<currentTexts.length;i++)for(let j=i+1;j<currentTexts.length;j++) {
      const a=currentTexts[i],b=currentTexts[j];
      assert(!overlap(a.bounds,b.bounds),`Text overlaps on page ${page+1}: ${a.text} / ${b.text}`);
    }
    layoutChecks.push({page:page+1,cue,reducedMotion:reduced,transcript,textCount:currentTexts.length,dialogue});
    if(cue===2&&!transcript)textBounds.push({page:page+1,reducedMotion:reduced,text:currentTexts});
    return currentTexts.map(entry=>({text:entry.text,bounds:entry.bounds}));
  }
  const contactTileHashes=[];
  bridge.active=true;bridge.loadImages();
  for(let page=0;page<8;page++) {
    for(let cue=0;cue<3;cue++) {
      const normal=inspectLayout(page,cue,false),reduced=inspectLayout(page,cue,true);
      assert.deepEqual(normal,reduced,'Reduced Motion keeps all captions and controls in place');
    }
    inspectLayout(page,2,false,true);inspectLayout(page,2,true,true);
    effectChecks.push(inspectEffects({scene:bridge,B,chapter:'bridge',ctx,
      hashPixels:()=>crypto.createHash('sha256').update(ctx.getImageData(0,0,1920,1080).data).digest('hex')}));
    inspectLayout(page,2,false);
    fs.writeFileSync(path.join(out,`Bridge-${String(page+1).padStart(2,'0')}.webp`),scene.toBuffer('image/webp',92));
    // Native drawImage can retain a live Canvas reference until encoding.
    // Snapshot each scaled tile so later scene draws cannot replace it.
    videoCtx.drawImage(scene,0,0,960,540);
    const tile=videoCtx.getImageData(0,0,960,540);
    contactCtx.putImageData(tile,(page%2)*960,Math.floor(page/2)*540);
    contactTileHashes.push(crypto.createHash('sha256').update(tile.data).digest('hex'));
  }
  assert.equal(new Set(contactTileHashes).size,8,'contact sheet retains eight distinct scene snapshots');
  fs.writeFileSync(path.join(out,'Bridge-Contact.webp'),contact.toBuffer('image/webp',94));
  bridge.dispose({reset:true});events.length=0;sources.length=0;saves.length=0;
  B.Preferences.values.reducedMotion=false;
  if(process.argv.includes('--stills-only')) {
    const outputs=['Bridge-Contact.webp',...Array.from({length:8},(_,i)=>`Bridge-${String(i+1).padStart(2,'0')}.webp`)];
    const report={passed:true,kind:'native production still-layout and sampled scene-motion review',mode:'stills-only',
      chapter:'bridge',canvas:[1920,1080],contactSheet:[1920,2160],
      openingFormat:{frame:B.IntroSequence.format.frame,palette:B.IntroSequence.format.palette,fonts:B.IntroSequence.format.fonts},
      productionSources,reviewSources:Object.fromEntries(['tools/render-cache-bridge.cjs','tools/lib/check-cache-scene-layout.cjs']
        .map(file=>[file,hash(path.join(root,file))])),
      counts:{scenes:images.length,distinctContactTiles:new Set(contactTileHashes).size,
        nativeLayoutChecks:layoutChecks.length,nativeTextBoundsChecks:layoutChecks.reduce((n,check)=>n+check.textCount,0),
        sampledSceneMotionChecks:effectChecks.length},
      images:bridge.panels.map((panel,i)=>({path:panel.asset,bytes:fs.statSync(path.join(root,panel.asset)).size,
        sha256:hash(path.join(root,panel.asset)),width:images[i].width,height:images[i].height})),
      protectedArt:{balloonsClear:true,pointersClear:true,
        regions:B.CacheSceneLayouts.bridge.map((page,i)=>({page:i+1,labels:page.protected.map(region=>region.label)}))},
      layout:{actualNativeTextMetrics:true,dialogueInsideBody:true,speakerTabsFit:true,outerBoundsFit:true,
        controlsSeparated:true,overlaps:0,escapes:0,reducedMotionSameLayout:true,
        checks:layoutChecks.map(({dialogue,...check})=>({...check,balloonsChecked:dialogue.balloons.length,
          protectedRegionsChecked:dialogue.protected.length}))},
      motion:{sampledNativePixels:true,checks:effectChecks},
      artifacts:outputs.map(file=>({path:file,bytes:fs.statSync(path.join(out,file)).size,sha256:hash(path.join(out,file))})),
      hostLimits:['Native Canvas and locally decoded art replace browser/network delivery; no hosted browser or Makko acceptance.',
        'Campaign, road and persistence are fixture boundaries; no played race or physical controller is exercised.',
        'Motion proof compares sampled production pixels and Canvas state; no real-time FPS or device performance is measured.',
        'No audio render, listening check or movie is generated by --stills-only; older Review.mp4/Review.json remain historical prior-layout evidence.']};
    fs.writeFileSync(path.join(out,'Bridge-Stills-Review.json'),JSON.stringify(report,null,2)+'\n');
    console.log(`Bridge still review passed: eight distinct scenes, ${layoutChecks.length} native layout checks.`);
    return;
  }

  const fps=12,seconds=64,frameCount=fps*seconds;
  const silent=path.join(out,'Bridge-Review-silent.tmp.mp4');
  encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba',
    '-video_size','1280x720','-framerate',String(fps),'-i','pipe:0','-an',
    '-c:v','libx264','-threads','2','-preset','medium','-crf','26','-maxrate','1100k','-bufsize','2200k','-pix_fmt','yuv420p',silent],
  {stdio:['pipe','ignore','pipe']});
  let encoderError='';encoder.stderr.on('data',data=>{encoderError+=data;});
  const completion=once(encoder,'close');
  audioContext.currentTime=0;bridge.start();
  const cueTransitions=[];let previous='';
  for(let frame=0;frame<frameCount;frame++) {
    tickAudio(frame/fps);
    if(frame)bridge.update(1000/fps);
    if(frame&&frame%(8*fps)===0) {
      assert.equal(bridge.cue,2,'each auto-advance follows both real timed dialogue cues');
      assert(bridge.page<7,'review never invokes Drive');bridge.advance();
    }
    assert.equal(bridge.page,Math.floor(frame/(8*fps)));
    const cue=`${bridge.page}:${bridge.cue}`;
    if(cue!==previous){cueTransitions.push({page:bridge.page+1,cue:bridge.cue,at:frame/fps});previous=cue;}
    ctx.reset();bridge.draw(ctx);videoCtx.drawImage(scene,0,0,1280,720);
    if(!encoder.stdin.write(Buffer.from(videoCtx.getImageData(0,0,1280,720).data)))
      await once(encoder.stdin,'drain');
    if(frame%(8*fps)===0)console.log(`Bridge native review: page ${bridge.page+1}/8`);
  }
  tickAudio(seconds);audio.stopCacheBridgeAudio();
  assert.equal(bridge.page,7);assert.equal(bridge.cue,2);assert(bridge.active&&!bridge.pending);
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
  assert(peak>.03&&events.length===5,'all five real bridge cues appear in the review');
  const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(pcm.length+36,4);
  header.write('WAVE',8);header.write('fmt ',12);header.writeUInt32LE(16,16);
  header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(sampleRate,24);
  header.writeUInt32LE(sampleRate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);
  header.write('data',36);header.writeUInt32LE(pcm.length,40);
  const wav=path.join(out,'Bridge-Review.wav');fs.writeFileSync(wav,Buffer.concat([header,pcm]));
  const movie=path.join(out,'Bridge-Review.mp4');
  execFileSync('ffmpeg',['-y','-loglevel','error','-i',silent,'-i',wav,'-map','0:v:0','-map','1:a:0',
    '-c:v','copy','-c:a','aac','-b:a','160k','-t',String(seconds),'-movflags','+faststart',movie]);
  fs.unlinkSync(silent);
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',movie],{encoding:'utf8'}));
  const stream=probe.streams.find(item=>item.codec_type==='video');
  assert.equal(Number(stream.nb_frames),frameCount);assert.equal(Number(stream.duration),seconds);
  assert.equal(stream.width,1280);assert.equal(stream.height,720);
  assert(fs.statSync(movie).size<=10*1024*1024,'review MP4 fits connector transport limit');
  execFileSync('ffmpeg',['-v','error','-i',movie,'-f','null','-']);
  const report={kind:'scripted native production draw with exact synthesized PCM; not Makko capture',
    seconds,fps,frames:frameCount,canvas:[1920,1080],video:[1280,720],contactSheet:[1920,2160],
    localImagesLoadedOnce:images.length,contextsCreated:3,contextsPerFrame:0,
    advance:'Every eight seconds, only after cue 2; final Ready remains active and Drive is never invoked.',
    productionSources,reviewSources:Object.fromEntries(['tools/render-cache-bridge.cjs','tools/lib/check-cache-scene-layout.cjs'].map(file=>[file,hash(path.join(root,file))])),
    effectChecks,deliveryEncoding:{codec:'libx264',preset:'medium',crf:26,maxrate:'1100k',maxBytes:10*1024*1024},
    images:bridge.panels.map((panel,i)=>({path:panel.asset,sha256:hash(path.join(root,panel.asset)),width:images[i].width,height:images[i].height})),
    layout:{nativeTextMetrics:true,protectedArtClear:true,pointersClear:true,speakerTabsFit:true,checks:layoutChecks,actualTextBounds:textBounds,overlaps:0,escapes:0,reducedMotionSameLayout:true},
    cueTransitions,finalState:{...bridge.serialize(),active:bridge.active,pending:bridge.pending},
    audio:{source:'Production AudioSystem.playCacheBridgeCue/createCacheBridgeBuffer/stopCacheBridgeAudio.',
      sampleRate,channels:1,sfxGain:.8,peak,rms:Math.sqrt(squared/mix.length),noSpeech:true,noSong:true,
      noRoadEngine:true,activeVoicesAfterStop:audio.combatVoices.size,
      cues:events.map(({kind,start,stop,naturalEnd,gain})=>({kind,start,stop,naturalEnd,gain})),
      pcmSha256:hash(wav),note:'WAV is exact scheduled PCM at the stated SFX gain; MP4 contains its AAC encoding.'},
    outputs:['Bridge-Contact.webp',...Array.from({length:8},(_,i)=>`Bridge-${String(i+1).padStart(2,'0')}.webp`),
      'Bridge-Review.wav','Bridge-Review.mp4']};
  report.artifacts=report.outputs.map(file=>({path:file,bytes:fs.statSync(path.join(out,file)).size,sha256:hash(path.join(out,file))}));
  fs.writeFileSync(path.join(out,'Bridge-Review.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`Bridge review passed: ${frameCount} frames, ${seconds}s, ${layoutChecks.length} native layout checks, ${events.length} exact PCM cues, final Ready retained.`);
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;}).finally(()=>{if(encoder)encoder.kill();});
