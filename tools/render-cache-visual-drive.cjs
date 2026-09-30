#!/usr/bin/env node
// Production Canvas review. Staged UI/projection fixtures are explicitly
// separated from the independently input-driven full-race observation.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const repo=path.resolve(__dirname,'..');process.chdir(repo);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const {runRace}=require('./check-cache-road-races.cjs');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const round=n=>Math.round(n*1000)/1000;

async function main(){
  const sources=['src/game/cache-road-guidance.js','src/game/cache-road-proof.js',
    'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
    'src/game/cache-road-pursuit.js','src/game/cache-road-landscape.js',
    'src/engine/cache-road-proof-profile.js','src/engine/presentation-assets.js',
    'tools/render-cache-visual-drive.cjs','tools/check-cache-road-races.cjs'];
  const sourceHashes=Object.fromEntries(sources.map(file=>[file,hash(file)]));
  GlobalFonts.registerFromPath('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf','Oxanium');
  const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8'),defs=createRig();
  defs.w.Image=undefined;
  vm.runInContext(manifest.replace('  const cache = {};','  window.entries=entries;\n  const cache = {};'),defs.context);
  const entries=defs.w.entries;
  const images=Object.fromEntries(await Promise.all(Object.entries(entries)
    .filter(([key])=>key.startsWith('cache'))
    .map(async([key,e])=>[key,await loadImage(path.join(repo,e.path))])));
  function installAssets(r){
    r.w.Image=undefined;r.w.nativeVisualReviewImages=images;
    vm.runInContext(manifest.replace('  const cache = {};',
      '  const cache=Object.fromEntries(Object.entries(window.nativeVisualReviewImages).map(([key,image])=>[key,{image,ready:true}]));'),r.context);
  }
  const r=createRig(),{w,context}=r,B=w.BARCODE;B.Campaign={register(){},syncTitleButton(){}};
  for(const file of ['src/core/gamepad-ui.js','src/engine/cache-road-proof-profile.js',
    'src/game/cache-road-landscape.js','src/game/cache-road-guidance.js'])load(context,file);
  vm.runInContext(fs.readFileSync('src/game/cache-road-proof.js','utf8').replace(
    '  B.Campaign.register(ID,','  window.visualDriveReview={newState};\n  B.Campaign.register(ID,'),context);
  installAssets(r);B.CacheChapter={recordIds:['r1','r2','r3','r4']};
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
  const out=path.resolve(process.argv[2]||'docs/source-pack/review-cache-visual-drive');
  fs.mkdirSync(out,{recursive:true});
  const road=B.CacheRoadProof;
  function fixture(extra={}){
    const s=Object.assign(w.visualDriveReview.newState(),{progress:130,elapsedMs:1000,
      lane:0,lanePos:0,visualLane:0,speed:52,gear:1,timeMs:55000,integrity:3,
      musicBar:0,musicBeatFloat:3.8,pendingGear:null,echoEnergy:77,nearMisses:1,
      captures:[],queuedCaptures:[],pulseTargets:{'0/0/0':4},pulsePlaces:{'0/0/0':146.469},
      audits:[],streetMotion:{},driveSections:[{beat:0,beatSec:60/128,from:52,v0:52,speed:52,gear:1}]},extra);
    B.GamepadUI.connected=!!extra.controller;B.ControllerSettings.labels=extra.labels||'auto';
    road.state=s;road.active=true;road.status='playing';road.audioDegraded=false;
    road.chapter={records:[],difficultyId:'standard',encounterVersion:2};return s;
  }
  const fixtures=[],sequence=[];
  const sheet=createCanvas(1280,1050),sc=sheet.getContext('2d');
  sc.fillStyle='#071b27';sc.fillRect(0,0,sheet.width,sheet.height);
  sc.font='18px Oxanium';sc.fillStyle='#c1eadf';
  sc.fillText('PRODUCTION RENDERER / staged visual fixtures',16,26);
  const cases=[['keyboard-pad',{}],['playstation-miss',{controller:true,labels:'playstation',
    driveFeedback:{kind:'button',action:0,lane:0,expiresMs:2000}}],
    ['capture',{musicBeatFloat:4,driveFeedback:{kind:'perfect',action:0,lane:0,expiresMs:2000},
      mixFeedback:{kind:'join',lane:0,holdBars:3,expiresMs:2200},pulseFlashAction:0,
      pulseFlashLane:0,pulseFlashMs:600,pulseTiming:'PERFECT'}],
    ['echo-exit',{progress:9800,gateAt:9900,musicBeatFloat:370,musicBar:92,lanePos:0,echoEnergy:100}]];
  for(const [name,extra] of cases){
    const s=fixture(extra);
    if(name==='capture'){
      s.caughtPulses['0/0/0']=true;
      s.pulseHoldBars=B.MusicProfiles.get('level-02.proof').laneMix.reactive.captureBars;
      s.mixFeedback.holdBars=s.pulseHoldBars;
    }
    ctx.reset();road.draw(ctx);
    const i=fixtures.length,x=i%2*640,y=42+Math.floor(i/2)*391;
    sc.fillStyle='#c1eadf';sc.font='16px Oxanium';sc.fillText(name,x+12,y+19);
    sc.drawImage(canvas,x,y+27,640,360);
    const file=`Fixture-${name}.webp`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/webp',90));
    fixtures.push({file,kind:'staged-ui-state',controller:extra.labels||'keyboard',sha256:hash(path.join(out,file))});
  }

  // The player is deliberately between lanes in this projection-only view
  // to expose whether the now-nearer courier correctly paints in front.
  fixture({progress:295,lane:2,lanePos:1.65,visualLane:1.65,musicBeatFloat:20,musicBar:5,
    pulseTargets:{},pulsePlaces:{}});
  ctx.reset();road.draw(ctx);
  fs.writeFileSync(path.join(out,'Fixture-passed-depth.webp'),canvas.toBuffer('image/webp',90));
  fixtures.push({file:'Fixture-passed-depth.webp',kind:'staged-passed-depth-state',
    progress:295,courierDistance:-20,playerLane:1.65,
    sha256:hash(path.join(out,'Fixture-passed-depth.webp'))});

  // Fixed world traffic, unchanged source artwork and a smoothly advancing
  // camera isolate foreground projection. This is not a collision/race test.
  const fps=24,frames=192,from=245,to=755,primaryAt=275;
  const videoPath=path.join(out,'Foreground-Pass.mp4');
  const encoder=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe',
    '-vcodec','png','-r',String(fps),'-i','pipe:0','-an','-vf','scale=1280:754',
    '-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart',videoPath],
    {stdio:['pipe','ignore','pipe']});
  let encoderError='';encoder.stderr.on('data',data=>encoderError+=String(data));
  const encoded=once(encoder,'close');
  const video=createCanvas(1920,1130),vc=video.getContext('2d');
  const drawAsset=B.PresentationAssets.draw;
  let projected=[],roadsideProjected=[];
  B.PresentationAssets.draw=function(key,c,args){
    if(['cacheCourier','cacheNewLampL','cacheNewCrossingSignalL'].includes(key)&&!String(c.filter).includes('blur')){
      const t=c.getTransform(),e=entries[key],x=args.x-args.width*e.ax,y=args.y-args.height*e.ay;
      const pts=[[x,y],[x+args.width,y],[x,y+args.height],[x+args.width,y+args.height]]
        .map(([px,py])=>({x:t.a*px+t.c*py+t.e,y:t.b*px+t.d*py+t.f}));
      const bounds={left:Math.min(...pts.map(p=>p.x)),right:Math.max(...pts.map(p=>p.x)),
        top:Math.min(...pts.map(p=>p.y)),bottom:Math.max(...pts.map(p=>p.y))};
      if(key==='cacheCourier')projected.push(bounds);
      else roadsideProjected.push({key,...Object.fromEntries(Object.entries(bounds).map(([field,value])=>[field,round(value)]))});
    }
    return drawAsset.call(this,key,c,args);
  };
  const keyFrames=[0,18,48,72];
  for(let i=0;i<frames;i++){
    const progress=from+(to-from)*i/(frames-1),elapsedMs=1000+i*1000/fps;
    fixture({progress,elapsedMs,lane:2,lanePos:1.65,visualLane:1.65,speed:70,gear:2,
      musicBeatFloat:20+i/fps*128/60,musicBar:5+Math.floor(i/fps*128/60/4),
      pulseTargets:{},pulsePlaces:{},driveSections:[{beat:0,beatSec:60/128,from:70,v0:70,speed:70,gear:2}]});
    projected=[];roadsideProjected=[];ctx.reset();road.draw(ctx);
    const bounds=projected.length?{left:Math.min(...projected.map(p=>p.left)),
      right:Math.max(...projected.map(p=>p.right)),top:Math.min(...projected.map(p=>p.top)),
      bottom:Math.max(...projected.map(p=>p.bottom))}:null;
    sequence.push({frame:i,timeSec:round(i/fps),progress:round(progress),
      courierDistance:round(primaryAt-progress),roadsideBounds:roadsideProjected,courierBounds:bounds&&Object.fromEntries(Object.entries(bounds).map(([key,value])=>[key,round(value)]))});
    vc.drawImage(canvas,0,0);vc.fillStyle='#071b27';vc.fillRect(0,1080,1920,50);
    vc.fillStyle='#c1eadf';vc.font='21px Oxanium';
    vc.fillText(`STAGED PROJECTION FIXTURE  /  fixed traffic + scenery  /  camera ${progress.toFixed(0)}  /  van distance ${(primaryAt-progress).toFixed(0)}`,24,1113);
    if(!encoder.stdin.write(video.toBuffer('image/png')))await once(encoder.stdin,'drain');
    const keyIndex=keyFrames.indexOf(i);
    if(keyIndex>=0){
      const x=keyIndex*320,y=842;
      sc.fillStyle='#c1eadf';sc.font='14px Oxanium';
      sc.fillText(`VAN d=${(primaryAt-progress).toFixed(0)}`,x+10,y+16);
      sc.drawImage(canvas,x,y+23,320,180);
    }
  }
  encoder.stdin.end();const [exitCode]=await encoded;
  assert.equal(exitCode,0,encoderError);
  B.PresentationAssets.draw=drawAsset;
  fs.writeFileSync(path.join(out,'Visual-Drive-Review.webp'),sheet.toBuffer('image/webp',91));

  let actualFrame=null;
  const race=await runRace({difficulty:'standard',gear:1,profile:'practiced',
    async onReady(raceRig){
      if(!raceRig.B.CacheRoadGuidance)load(raceRig.context,'src/game/cache-road-guidance.js');
      installAssets(raceRig);
    },async onFrame(raceRig){
      const s=raceRig.road.state;
      if(actualFrame||s.musicBar<18||!s.driveFeedback||
        !['good','perfect'].includes(s.driveFeedback.kind)||s.elapsedMs>=s.driveFeedback.expiresMs)return;
      ctx.reset();raceRig.drawRoad(ctx);
      const file='Race-Capture.webp';fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/webp',90));
      actualFrame={file,kind:'actual-production-input-race-state',bar:s.musicBeatFloat/4,
        elapsedMs:s.elapsedMs,lane:s.lanePos,integrity:s.integrity,sha256:hash(path.join(out,file))};
    }});
  assert(actualFrame,'a real input-driven capture frame was observed');
  for(const [file,digest] of Object.entries(sourceHashes))assert.equal(hash(file),digest,`Source changed during render: ${file}`);
  const report={kind:'native-production-visual-drive-review',dimensions:{width:1920,height:1080},
    sourceHashes,fixtures,actualFrame,
    motion:{file:path.basename(videoPath),kind:'staged-projection-fixture',fps,frames,
      durationSec:frames/fps,from,to,playerLane:1.65,primaryActor:{kind:'van',at:primaryAt,lane:2},
      sha256:hash(videoPath),sequence},
    race:{status:race.result.status,encounterVersion:race.result.encounterVersion,
      gear:race.result.gear,difficulty:race.result.difficulty,profile:race.result.profile,
      finalBar:race.result.finalBar,captured:race.result.captured,damageTaken:race.result.damageTaken,gateOpen:race.result.gateOpen},
    limitations:'The four UI images, passed-depth still and foreground movie stage state over the unchanged production draw path and authored art. The movie advances the camera past fixed world traffic/scenery; it does not run input, collision or audio. Race-Capture.webp is independently observed during a complete production-input-driven Standard / Gear 2 run. Native Canvas simulates host boundaries. No human, browser, Makko, physical-controller or audio acceptance is claimed.'};
  fs.writeFileSync(path.join(out,'Visual-Drive-Review.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(out,'README.md'),'# Visual driving and foreground exit review\n\n'+report.limitations+'\n\n'+
    '`Visual-Drive-Review.webp` groups four presentation fixtures and four sequential pass views. The `Fixture-` files preserve full 1920 × 1080 detail; `Fixture-passed-depth.webp` isolates the nearer courier overlapping the lane-changing player. '+
    '`Foreground-Pass.mp4` is an eight-second silent projection fixture: the ordinary courier at world address 275 and the left lamp/crossing signal at addresses 305/387 move from ahead of the camera through their near view toward the screen edges; the player is held between lanes 2/3 to expose front-to-back sprite order as the van passes. Existing barricades, traffic and roadside objects share the same production scene. '+
    '`Race-Capture.webp` is a separately labeled real input-driven race observation. '+
    '`Visual-Drive-Review.json` records source hashes, video frames and measured production courier image bounds (including body/wheel submissions), plus left lamp/crossing-signal submissions. '+
    'Rebuild with `node tools/render-cache-visual-drive.cjs`; it requires local authored assets, @napi-rs/canvas and ffmpeg. Source hashes reject edits made during rendering.\n');
  console.log(JSON.stringify({out,fixtures:fixtures.length,video:report.motion.file,actualFrame:actualFrame.file,race:report.race}));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
