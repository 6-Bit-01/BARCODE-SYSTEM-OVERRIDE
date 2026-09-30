#!/usr/bin/env node
// Native draw of actual input-driven race highlights; staged reactions are
// separate, explicitly named fixtures. No browser/device-performance claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const {once}=require('node:events');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const {createRig}=require('./check-level-01-boss');
const {runRace}=require('./check-cache-road-races.cjs');
const root=path.resolve(__dirname,'..');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const clone=value=>JSON.parse(JSON.stringify(value));
const fps=25,sampleRate=32000;
const segments=[{name:'City-escape',start:21,duration:5,stillOffset:2.6},
  {name:'Freight-corridor',start:60,duration:5},
  {name:'Audit-echo',start:108,duration:5},
  {name:'Final-interception',start:155.5,duration:5},
  {name:'Delivery-split',start:172.5,duration:5}];
let encoder;
const deliveryCompression=Object.freeze({codec:'libx264',preset:'slow',crf:26,
  maxrateKbps:2600,bufsizeKbps:5200,audio:'copy',maximumBytes:10*1024*1024});
function compressReview(video) {
  const compressed=video.replace(/\.mp4$/,'.delivery.tmp.mp4');
  execFileSync('ffmpeg',['-y','-v','error','-i',video,'-map','0:v:0','-map','0:a:0',
    '-c:v',deliveryCompression.codec,'-preset',deliveryCompression.preset,
    '-crf',String(deliveryCompression.crf),'-maxrate',`${deliveryCompression.maxrateKbps}k`,
    '-bufsize',`${deliveryCompression.bufsizeKbps}k`,'-pix_fmt','yuv420p',
    '-c:a','copy','-movflags','+faststart',compressed]);
  assert(fs.statSync(compressed).size<=deliveryCompression.maximumBytes,
    'compressed review must fit the publication transport limit');
  fs.renameSync(compressed,video);
  return {...deliveryCompression};
}
async function main() {
  const out=path.resolve(process.argv[2]||path.join(root,'docs/source-pack/review-cache-encounters'));
  fs.mkdirSync(out,{recursive:true});
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const registry=fs.readFileSync(path.join(root,'src/engine/presentation-assets.js'),'utf8');
  const defs=createRig();defs.w.Image=undefined;
  vm.runInContext(registry.replace('  const cache = {};','  window.entries=entries;\n  const cache = {};'),defs.context);
  const images=Object.fromEntries(await Promise.all(Object.entries(defs.w.entries)
    .filter(([key])=>key.startsWith('cache')).map(async([key,entry])=>[key,await loadImage(path.join(root,entry.path))])));
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
  const scaled=createCanvas(1280,720),sctx=scaled.getContext('2d');
  const selected=[],stills=[],seen=new Set();let fixture=null;
  const silent=path.join(out,'Encounter-Review-silent.tmp.mp4');
  encoder=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pixel_format','rgba',
    '-video_size','1280x720','-framerate',String(fps),'-i','pipe:0','-an',
    '-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p',silent]);
  let errors='';encoder.stderr.on('data',chunk=>errors+=chunk);
  const done=once(encoder,'close');
  const sourceFiles=['src/game/cache-road-proof.js','src/game/cache-road-encounters.js',
    'src/game/cache-road-reactions.js','src/game/cache-road-pursuit.js','src/engine/presentation-assets.js',
    'tools/check-cache-road-races.cjs','tools/render-cache-encounter-review.cjs'];
  const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,hash(path.join(root,file))]));
  const gains={pressure:.60,drive:.10,flow:0,breakaway:0,undercurrent:0};
  const ramps=Object.fromEntries(Object.entries(gains).map(([role,value])=>
    [role,{from:value,to:value,start:0,duration:0}]));
  const run=await runRace({difficulty:'standard',gear:1,profile:'practiced',seekPush:true,
    async onReady(r) {
      r.w.Image=undefined;r.w.nativeReviewImages=images;
      vm.runInContext(registry.replace('  const cache = {};',
        '  const cache=Object.fromEntries(Object.entries(window.nativeReviewImages).map(([key,image])=>[key,{image,ready:true}]));'),r.context);
      r.B.Preferences.values.reducedMotion=false;
    },
    async onFrame(r,frame) {
      const s=r.road.state,time=s.musicBeatFloat*60/128;
      const profile=r.B.MusicProfiles.get('level-02.proof'),mix=profile.laneMix;
      const roles=new Set(s.captures.filter(c=>c.startBeat<=s.musicBeatFloat&&c.endBeat>s.musicBeatFloat)
        .map(c=>mix.laneRoles[c.lane]));
      const half=s.musicBar<4?'intro':(s.musicBar-4)%24<8?'verseA':(s.musicBar-4)%24<16?'verseB':'chorus';
      for(const role of Object.keys(gains)) {
        const ramp=ramps[role],amount=ramp.duration?Math.max(0,Math.min(1,(time-ramp.start)/ramp.duration)):1;
        gains[role]=ramp.from+(ramp.to-ramp.from)*amount;
        const target=role==='pressure'?mix.levels[role]:roles.has(role)?mix.levels[role]:
          s.hitRecovery?0:role==='drive'?mix.idle.drive:role==='flow'&&half!=='intro'?mix.idle.flow:0;
        // Match the production requested-volume threshold and its held,
        // linear Web Audio ramp, sampled at the actual played 20ms state.
        if(Math.abs(target-ramp.to)>.005)ramps[role]={from:gains[role],to:target,start:time,
          duration:target>ramp.to?mix.captureFadeSec:mix.releaseFadeSec};
      }
      if(!fixture&&time>=60)fixture={state:clone(s),chapter:clone(r.road.chapter)};
      if(frame%2!==1)return;
      const segment=segments.find(item=>time>=item.start&&time<item.start+item.duration);
      if(!segment)return;
      ctx.reset();r.drawRoad(ctx);sctx.reset();sctx.drawImage(canvas,0,0,1280,720);
      if(!encoder.stdin.write(Buffer.from(sctx.getImageData(0,0,1280,720).data)))await once(encoder.stdin,'drain');
      selected.push({time,segment:segment.name,gains:{...gains},bar:s.musicBeatFloat/4,
        integrity:s.integrity,captures:s.captures.map(c=>c.lane),pursuit:r.road.encounterSnapshot().pursuit});
      if(!seen.has(segment.name)&&time>=segment.start+(segment.stillOffset??1)) {
        const file=`${segment.name}.webp`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/webp',92));
        stills.push({file,kind:'actual-input-driven-state',trackTime:time,bar:s.musicBeatFloat/4,
          sha256:hash(path.join(out,file))});seen.add(segment.name);console.log(`Native encounter review: ${segment.name}`);
      }
    }});
  // Instrumented road.hit still writes to run.result.events during the
  // staged fixtures below. Snapshot the completed race before those calls.
  const raceResult=clone(run.result);
  encoder.stdin.end();const [code,signal]=await done;encoder=null;
  assert.equal(code,0,errors||`ffmpeg stopped: ${signal}`);
  assert.equal(run.result.status,'clear','review race completes using actual controls');
  assert(run.result.pushContacts>0,'the review includes genuinely earned Push contacts');
  assert.equal(selected.length,625,'five exact 5s excerpts at 25fps');
  const roles=['drive','pressure','flow','breakaway','undercurrent'];
  const decoded=Object.fromEntries(roles.map(role=>{
    const pcm=execFileSync('ffmpeg',['-v','error','-i',path.join(root,`assets/audio/cache-${role}.mp3`),
      '-f','f32le','-ac','1','-ar',String(sampleRate),'pipe:1'],{maxBuffer:40*1024*1024});
    return [role,new Float32Array(pcm.buffer.slice(pcm.byteOffset,pcm.byteOffset+pcm.byteLength))];
  }));
  const perFrame=sampleRate/fps,mix=new Float32Array(selected.length*perFrame);let peak=0;
  for(let f=0;f<selected.length;f++) {
    const observation=selected[f],from=Math.round(observation.time*sampleRate);
    const segmentEdge=f===0||selected[f-1].segment!==observation.segment;
    const segmentEnd=f===selected.length-1||selected[f+1].segment!==observation.segment;
    const nextGains=segmentEnd?observation.gains:selected[f+1].gains;
    for(let n=0;n<perFrame;n++) {
      let sample=0;for(const role of roles) {
        const gain=observation.gains[role]+(nextGains[role]-observation.gains[role])*n/perFrame;
        sample+=(decoded[role][Math.max(0,from+n)]||0)*gain;
      }
      const edge=segmentEdge?Math.min(1,n/(sampleRate*.008)):segmentEnd?Math.min(1,(perFrame-1-n)/(sampleRate*.008)):1;
      mix[f*perFrame+n]=sample*edge;peak=Math.max(peak,Math.abs(sample*edge));
    }
  }
  const master=Math.min(.8,.93/(peak||1)),pcm=Buffer.alloc(mix.length*2);
  for(let n=0;n<mix.length;n++)pcm.writeInt16LE(Math.round(mix[n]*master*32767),n*2);
  const raw=path.join(out,'Encounter-Music.tmp.pcm'),video=path.join(out,'Encounter-Review.mp4');
  fs.writeFileSync(raw,pcm);
  execFileSync('ffmpeg',['-y','-v','error','-i',silent,'-f','s16le','-ar',String(sampleRate),'-ac','1','-i',raw,
    '-c:v','copy','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',video]);
  fs.rmSync(raw);fs.rmSync(silent);
  const compression=compressReview(video);
  // Separate coverage fixtures deliberately stage impact while preserving
  // the production reaction, draw and asset owners. They are not race frames.
  const r=run.rig;
  for(const kind of ['push','brace']) {
    r.road.state=clone(fixture.state);r.road.chapter=clone(fixture.chapter);r.road.status='playing';
    const s=r.road.state,h=r.road.hazards().find(h=>h.at>=s.progress&&h.kind==='freight')||
      r.road.hazards().find(h=>h.at>=s.progress);
    assert(h,'freight fixture has a real authored actor');
    s.progress=h.at;s.lanePos=s.lane=s.visualLane=h.lane;s.invulnerableMs=s.boostMs=0;
    s.ramMs=kind==='push'?1500:0;s.shield=kind==='brace'?1:0;
    r.road.hit(h.kind,h);const contactState=clone(s);s.elapsedMs+=150;s.defenseFlashMs=450;
    r.B.CacheRoadReactions.step(s,150);
    ctx.reset();r.drawRoad(ctx);
    const file=`Staged-${kind}-contact.webp`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/webp',92));
    stills.push({file,kind:'staged-production-impact-fixture',ability:kind,ageMs:150,
      actor:clone(h),pose:clone(r.B.CacheRoadReactions.pose(s,h)),sha256:hash(path.join(out,file))});
    const strip=createCanvas(1920,410),stripCtx=strip.getContext('2d');
    const phases=kind==='push'?[0,250,550]:[0,150,380],poses=[];
    stripCtx.fillStyle='#07111d';stripCtx.fillRect(0,0,1920,410);
    for(let i=0;i<phases.length;i++) {
      const age=phases[i];r.road.state=clone(contactState);
      const frameState=r.road.state;frameState.elapsedMs+=age;frameState.defenseFlashMs=Math.max(0,600-age);
      r.B.CacheRoadReactions.step(frameState,age);ctx.reset();r.drawRoad(ctx);
      // A native crop of the production road, not a repainted asset.
      stripCtx.drawImage(canvas,200,560,1080,510,i*640,50,640,302);
      stripCtx.font='22px Oxanium';stripCtx.fillStyle='#d9f6ef';
      stripCtx.fillText(`STAGED ${kind.toUpperCase()} / ${age?`+${age} MS`:'CONTACT'}`,i*640+20,30);
      const pose=clone(r.B.CacheRoadReactions.pose(frameState,h));poses.push({ageMs:age,pose});
      stripCtx.font='18px Oxanium';stripCtx.fillStyle='#8ebbbd';
      stripCtx.fillText(`Forward displacement ${(pose.at-h.at).toFixed(1)} / collision resolved once`,i*640+20,385);
    }
    const stripFile=`Staged-${kind}-response-strip.webp`;
    fs.writeFileSync(path.join(out,stripFile),strip.toBuffer('image/webp',93));
    stills.push({file:stripFile,kind:'staged-production-impact-sequence',ability:kind,poses,
      sha256:hash(path.join(out,stripFile))});
  }
  const stagedFixtureEvents=clone(run.result.events.slice(raceResult.events.length));
  const report={kind:'native-production-encounter-review',sourceHashes,dimensions:{width:1280,height:720},
    framesPerSecond:fps,frames:selected.length,durationSeconds:selected.length/fps,segments,stills,
    race:raceResult,stagedFixtureEvents,
    video:{file:path.basename(video),sha256:hash(video),bytes:fs.statSync(video).size,compression},
    audio:{kind:'offline-five-stem-music-reconstruction',sampleRate,masterGain:master,peakBeforeMaster:peak,
      limitation:'Uses actual race captures and profile fade targets. Engine/SFX and browser Web Audio automation are not captured.'},
    limitation:'Actual gamepad-input-driven production race with native Canvas and local decoded art. Audio/storage/browser host boundaries are simulated. The two named staged impacts are separate coverage fixtures. Not a human playtest, Makko acceptance or device-performance measurement.'};
  fs.writeFileSync(path.join(out,'Encounter-Review.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(out,'README.md'),'# Cache encounter native review\n\n'+report.limitation+'\n\n'+
    '`Encounter-Review.mp4` contains five chronological 5-second excerpts from one complete Standard / Gear 2 practiced-controller race that deliberately spends earned Push charges on visible traffic. The first excerpt includes a real earned Push contact. The five matching stills are actual frames. The `Staged-` contact stills and response strips separately arrange one real traffic contact for clear effect and displacement inspection.\n\n'+
    'The soundtrack reconstructs the supplied five aligned stems from the played captures and production mix settings. It excludes engine and SFX; browser sound and latency remain separate gates. Exact source hashes, race results and artifact hashes are in `Encounter-Review.json`.\n\n'+
    'Delivery compression uses x264 slow / CRF 26 with a 2.6 Mbps ceiling. It preserves 1280×720, all 625 frames, and the existing AAC audio while keeping the review below 10 MiB. Full-resolution stills remain unchanged.\n');
  console.log(`Native review complete: ${video}; ${selected.length} frames; ${run.result.captured} captures; ${run.result.damageTaken} damage.`);
}
if(require.main===module)main().catch(error=>{encoder?.kill('SIGKILL');console.error(error);process.exitCode=1;});
module.exports={compressReview};
