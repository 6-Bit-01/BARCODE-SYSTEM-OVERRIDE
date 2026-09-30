// Native review fixtures through the real road, chapter and presentation asset
// owners. These stills are deterministic draw evidence, not a played race.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
async function main() {
  const out=path.resolve(process.argv[2]||'docs/source-pack/review-cache-ending');
  fs.mkdirSync(out,{recursive:true});
  GlobalFonts.registerFromPath(path.resolve('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8');
  const defs=createRig();defs.w.Image=undefined;
  vm.runInContext(manifest.replace('  const cache = {};','  window.entries=entries;\n  const cache = {};'),defs.context);
  const images=Object.fromEntries(await Promise.all(Object.entries(defs.w.entries)
    .filter(([key])=>key.startsWith('cache')).map(async([key,entry])=>[key,await loadImage(path.resolve(entry.path))])));
  const {w,context}=createRig(),B=w.BARCODE;
  const storage=new Map();
  w.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
  load(context,'src/game/lore-collection.js');
  const archive=new B.LoreCollection();w.lostDataSystem.archive=archive;
  load(context,'src/game/campaign-services.js');
  load(context,'src/engine/cache-road-proof-profile.js');
  load(context,'src/game/cache-chapter.js');
  load(context,'src/game/cache-road-landscape.js');
  const source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
  vm.runInContext(source.replace('  B.Campaign.register(ID,','  window.recordReview={newState};\n  B.Campaign.register(ID,'),context);
  w.Image=undefined;w.images=images;
  vm.runInContext(manifest.replace('  const cache = {};',
    '  const cache=Object.fromEntries(Object.entries(window.images).map(([key,image])=>[key,{image,ready:true}]));'),context);
  B.GamepadUI={connected:false};B.Preferences={values:{reducedMotion:true}};
  w.inputManager={resetActionEdges(){}};
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),texts=[];
  const fillText=ctx.fillText.bind(ctx);
  ctx.fillText=(value,x,y,...rest)=>{texts.push({text:String(value),x,y,maxWidth:rest[0]??null});return fillText(value,x,y,...rest);};
  const road=B.CacheRoadProof;
  const parent={levelId:'level-01',checkpointId:'intermission',levelState:{
    difficultyId:'standard',run:{levelId:'level-01',runId:'native-review-parent',recoveryMode:'checkpoints',
      elapsedMs:120000,damageTaken:1,retries:0,attempts:18,accurate:14,perfect:8,connected:9,connectedPerfect:5,completed:true},
    score:2400,bestCombo:8,health:3,playerX:3500,fragments:[],skyCaches:[],ampCharges:1,
    boss:{bossX:3480,playerX:3500,score:2400,skyCaches:[]},result:{score:2400}}};
  road.returnTo=parent;road.active=true;road.status='playing';road.audioDegraded=false;
  road.chapter=B.CacheChapter.create({difficultyId:'standard'});road.chapter.runId='cache-native-review';
  road.state=Object.assign(w.recordReview.newState(),{progress:1140,elapsedMs:22500,
    lane:0,lanePos:0,visualLane:0,speed:52,gear:1,timeMs:49000,integrity:3,
    musicBar:12,musicBeatFloat:48,pendingGear:null,echoEnergy:100,nearMisses:1,
    captures:[{lane:2,startBeat:40,endBeat:72}],queuedCaptures:[],pulseTargets:{},audits:[],streetMotion:{}});
  road.state.opening.sealed=true;road.state.opening.held=true;
  road.state.recordSigns[0]=road.state.progress+150;
  road.updateRecords(400);
  const report={kind:'native-production-road-draw',dimensions:{width:1920,height:1080},
    sourceHash:crypto.createHash('sha256').update(source).digest('hex'),
    limitation:'Deterministic renderer fixtures with approved art and a Map-backed localStorage boundary; not a real-time playthrough or device performance claim.',frames:[]};
  function save(name,fixture) {
    ctx.reset();texts.length=0;road.draw(ctx);
    const file=path.join(out,name);fs.writeFileSync(file,canvas.toBuffer('image/png'));
    report.frames.push({file:name,fixture,texts:texts.map(item=>({...item})),
      sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
    console.log(file);
  }
  save('record-lane-dwell.png',{bar:12,lane:0,record:0,continuousDwellMs:400,requiredDwellMs:650,
    opportunity:road.recordOpportunity(),signWorldAddress:road.state.recordSigns[0]});
  Object.assign(road.chapter,{elapsedMs:203200,damageTaken:1,retries:1,attempts:38,accurate:31,perfect:24,connected:31,bestCombo:8,
    records:[...B.CacheChapter.recordIds]});
  Object.assign(road.state,{progress:9780,musicBar:100,musicBeatFloat:400,status:'clear',gateOpen:true,
    score:12840,integrity:2,timeMs:18000,recordFlashMs:0,recordHoldMs:0});
  road.status='clear';B.CacheChapter.finish(road);
  road.chapter.delivery.ending={version:1,page:3,cue:2,done:true};
  B.CacheChapter.persist(road);road.armResultControls();
  save('chapter-results.png',{result:road.chapter.delivery.result,buttons:road.resultButtons(),saveStatus:B.CacheChapter.saveStatus(road)});
  fs.writeFileSync(path.join(out,'Record-Review.json'),JSON.stringify(report,null,2)+'\n');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
