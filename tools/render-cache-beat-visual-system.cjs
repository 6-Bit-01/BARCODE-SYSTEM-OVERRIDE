// Fast current-production native review with original raster assets. Review
// poses advance the real chart/judgment, then hold explicitly staged paint ages.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createCanvas,loadImage,GlobalFonts,Path2D}=require('@napi-rs/canvas');
const {rig,pressAt}=require('./check-cache-drive-feedback.cjs');
const {createRig,load}=require('./check-level-01-boss');
const root=path.resolve(__dirname,'..');process.chdir(root);
const copy=value=>JSON.parse(JSON.stringify(value));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const modules=['src/game/cache-road-boss-art.js','src/game/cache-road-adrenaline.js',
  'src/game/cache-road-combat.js','src/game/cache-road-combat-art.js',
  'src/game/cache-road-crosswalks.js','src/game/cache-road-mirror.js',
  'src/game/cache-road-crew-callouts.js','src/game/cache-road-instruments.js',
  'src/game/cache-road-beat-surface.js','src/game/cache-road-beat-feedback.js',
  'src/game/cache-road-cinematics.js'];
async function nativeAssets() {
  const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8');
  const defs=createRig();defs.w.Image=undefined;
  vm.runInContext(manifest.replace('  const cache = {};','  window.beatEntries=entries;\n  const cache = {};'),defs.context);
  assert(defs.w.beatEntries,'the actual shared registry exposes current definitions');
  const entries=defs.w.beatEntries;
  const images=Object.fromEntries(await Promise.all(Object.entries(entries)
    .filter(([key])=>key.startsWith('cache')).map(async([key,e])=>
      [key,await loadImage(path.join(root,e.path))])));
  return {manifest,entries,images};
}
function prepared(assets) {
  const r=rig(4),{w,B,road,context}=r;w.Path2D=Path2D;
  for(const file of modules)if(fs.existsSync(file))load(context,file);
  B.CacheChapter={recordIds:['r1','r2','r3','r4'],collect(){return false;}};
  road.state=r.inspect.newState();road.configureEncounters();road.selectMusicProfile();
  B.MusicTransport.start({sourceAnchorAudioSec:0,sourceOffsetTrackSec:0});
  for(let beat=0;!road.pulses().length&&beat<50;beat+=.25)r.tick(beat);
  r.pulse=road.pulses()[0];assert(r.pulse,'the production chart announces a pad');
  road.state.lane=road.state.lanePos=road.state.visualLane=r.pulse.lane;
  w.Image=undefined;w.beatNativeImages=assets.images;
  vm.runInContext(assets.manifest.replace('  const cache = {};',
    '  const cache=Object.fromEntries(Object.entries(window.beatNativeImages).map(([key,image])=>[key,{image,ready:true}]));'),context);
  B.Preferences={values:{reducedMotion:false,flashes:true}};
  B.GamepadUI={connected:false};
  return r;
}
function stage(r,name) {
  const {B,road,pulse}=r;
  if(name==='Approach')r.tick(pulse.target-2.4);
  else if(name==='Ready-ONE'||name==='Focused-Turn')r.tick(pulse.target);
  else if(name==='Miss')r.tick(pulse.target+.5);
  else assert(pressAt(r,name==='Good'?150:0).accepted,'the review receipt is actually earned');
  const s=road.state;
  if(s.opening)s.opening.sealed=true;
  s.opening=null;s.handoffMs=0;s.roadIntroMs=0;
  if(s.beatFeedback&&['Perfect-Impact','Perfect-Release','Good','Reduced'].includes(name))
    s.elapsedMs=s.beatFeedback.atMs+(name==='Perfect-Release'?360:80);
  if(name==='Reduced')B.Preferences.values.reducedMotion=true;
  if(name==='Focused-Turn') {
    s.speed=75;s.steer=.8;
    // The same production trailing camera state used by the live renderer.
    s.cameraMotion={zoom:1.19,x:24,y:8,roll:.01,velocity:{zoom:0,x:0,y:0,roll:0}};
  }
  return s;
}
function atlasRegistration(assets) {
  const r=prepared(assets),S=r.B.CacheRoadBeatSurface;
  assert(S,'the current projection module is loaded');
  const sheet=createCanvas(1024,7*220+42),sc=sheet.getContext('2d');
  sc.fillStyle='#071b27';sc.fillRect(0,0,sheet.width,sheet.height);
  sc.fillStyle='#d4f4df';sc.font='18px Oxanium';sc.fillText('28 runtime atlas states / current production texture projection',15,27);
  const native=createCanvas(256,180),ctx=native.getContext('2d'),records=[];
  let row=0;
  for(const key of ['cacheBeatHardware','cacheBeatEnergy','cacheBeatTiming']) {
    const entry=assets.entries[key];if(!entry)continue;
    for(let frame=0;frame<entry.frames;frame++) {
      ctx.reset();ctx.clearRect(0,0,256,180);
      if(key==='cacheBeatEnergy'&&frame<8) {
        assert(S.paintQuad(ctx,key,[[25,171],[231,171],[190,33],[65,33]],{frame}));
      } else {
        const short=key==='cacheBeatTiming'&&frame>=4;
        assert(S.paintSprite(ctx,key,{x:128,y:95,width:short?220:155,
          height:short?(frame===7?45:66):155,frame}));
      }
      const data=Buffer.from(ctx.getImageData(0,0,256,180).data);
      const col=frame%4,y=42+(row+Math.floor(frame/4))*220;
      sc.fillStyle='#17313d';sc.fillRect(col*256+4,y+29,248,179);
      sc.drawImage(native,col*256,y+27);
      sc.fillStyle='#d4f4df';sc.font='14px Oxanium';
      sc.fillText(`${key.replace('cacheBeat','')} / ${frame}`,col*256+12,y+19);
      records.push({key,frame,pixelHash:sha(data),opaquePixels:Array.from(data)
        .filter((value,index)=>index%4===3&&value>96).length});
    }
    row+=entry.rows;
  }
  return {sheet,records};
}
async function main() {
  const out=path.resolve(process.argv[2]||path.join(root,'..','beat-native-review'));
  fs.mkdirSync(out,{recursive:true});
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const assets=await nativeAssets(),canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
  const registration=atlasRegistration(assets);
  if(registration.records.length) {
    fs.writeFileSync(path.join(out,'Atlas-Registration.png'),registration.sheet.toBuffer('image/png'));
    fs.writeFileSync(path.join(out,'Atlas-Registration.json'),JSON.stringify(registration.records,null,2)+'\n');
  }
  const names=['Approach','Ready-ONE','Perfect-Impact','Perfect-Release','Good','Miss','Reduced','Focused-Turn'];
  const sheet=createCanvas(1280,8*392/2+40),sc=sheet.getContext('2d'),records=[];
  sc.fillStyle='#081822';sc.fillRect(0,0,sheet.width,sheet.height);
  sc.fillStyle='#d4f4df';sc.font='19px Oxanium';sc.fillText('Current production / original art / staged review ages',18,28);
  for(const [index,name] of names.entries()) {
    const r=prepared(assets),s=stage(r,name),trace=[];
    const original=r.B.PresentationAssets.draw;
    r.B.PresentationAssets.draw=(key,c,args)=>{trace.push({key,...copy(args),filter:c.filter});return original(key,c,args);};
    ctx.reset();const before=JSON.stringify(s);r.road.draw(ctx);
    assert.equal(JSON.stringify(s),before,'native inspection preserves gameplay and paint state');
    const file=name+'.png',data=canvas.toBuffer('image/png');fs.writeFileSync(path.join(out,file),data);
    const x=index%2*640,y=40+Math.floor(index/2)*392;
    sc.fillStyle='#d4f4df';sc.font='16px Oxanium';sc.fillText(name,x+15,y+22);
    sc.drawImage(canvas,x,y+30,640,360);
    records.push({name,file,sha256:sha(data),pulse:copy(r.pulse),beat:s.musicBeatFloat,
      progress:s.progress,receipt:copy(s.beatFeedback),reduced:!!r.B.Preferences.values.reducedMotion,
      authoredBeatCalls:trace.filter(call=>call.key.startsWith('cacheBeat')),
      images:trace.length,originalRearviewBlur:trace.some(call=>call.filter==='blur(2.3px)')});
  }
  fs.writeFileSync(path.join(out,'Production-Beat-Review.png'),sheet.toBuffer('image/png'));
  const sourceFiles=['src/engine/presentation-assets.js','src/game/cache-road-proof.js',...modules]
    .filter(file=>fs.existsSync(file));
  fs.writeFileSync(path.join(out,'Production-Beat-Review.json'),JSON.stringify({
    limitation:'Native current-production Canvas stills with original raster assets. Chart and judgments are real; receipt ages and focused camera pose are staged. No human controller, browser, Makko/device FPS or audio acceptance claim.',
    sourceHashes:Object.fromEntries(sourceFiles.map(file=>[file,sha(fs.readFileSync(file))])),
    loadedAssets:Object.keys(assets.images).length,atlasRegistration:registration.records,records},null,2)+'\n');
  console.log(path.join(out,'Production-Beat-Review.png'));
}
module.exports={nativeAssets,prepared,stage,modules,atlasRegistration};
if(require.main===module)main().catch(error=>{console.error(error.stack);process.exitCode=1;});
