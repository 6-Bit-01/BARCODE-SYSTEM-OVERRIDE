const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
// Compare an immutable pre-fix revision with the current production renderer.
// Optional first argument chooses another Git revision for the BEFORE column.
const root=path.resolve(__dirname,'..');
const beforeRef=process.argv[2]||'5115b9afa4fb07a39fb8b23b2ac626e72f9a2916';
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const {createRig,load}=require(path.join(root,'tools/check-level-01-boss'));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
async function main(){
  const out=path.join(root,'docs/source-pack/review-cache-encounters');
  const registry=fs.readFileSync(path.join(root,'src/engine/presentation-assets.js'),'utf8');
  const defs=createRig();defs.w.Image=undefined;
  vm.runInContext(registry.replace('  const cache = {};','  window.entries=entries;\n  const cache = {};'),defs.context);
  const images=Object.fromEntries(await Promise.all(Object.entries(defs.w.entries).filter(([key])=>key.startsWith('cache'))
    .map(async([key,entry])=>[key,await loadImage(path.join(root,entry.path))])));
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const beforeRevision=execFileSync('git',['rev-parse',beforeRef],{cwd:root,encoding:'utf8'}).trim();
  const before=execFileSync('git',['show',`${beforeRevision}:src/game/cache-road-proof.js`],{cwd:root,encoding:'utf8'});
  const after=fs.readFileSync(path.join(root,'src/game/cache-road-proof.js'),'utf8');
  function rig(source){
    const {w,context}=createRig(),B=w.BARCODE;B.Campaign={register(){},syncTitleButton(){}};
    for(const file of ['src/engine/cache-road-proof-profile.js','src/game/cache-road-landscape.js',
      'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js','src/game/cache-road-pursuit.js'])load(context,file);
    source=source.replace('  const road = B.CacheRoadProof = {',
      '  window.braceReview={newState};\n  const road = B.CacheRoadProof = {')
      .replace("    const artKey = kind === 'cache'", "    if(kind==='cache')window.reviewCar={x,y,w,h};\n    const artKey = kind === 'cache'");
    vm.runInContext(source,context);w.Image=undefined;w.nativeImages=images;
    vm.runInContext(registry.replace('  const cache = {};',
      '  const cache=Object.fromEntries(Object.entries(window.nativeImages).map(([key,image])=>[key,{image,ready:true}]));'),context);
    B.Preferences={values:{reducedMotion:false}};B.GamepadUI={connected:false};
    const road=B.CacheRoadProof;road.active=true;road.status='playing';
    road.chapter={encounterVersion:1,difficultyId:'standard',records:[],damageTaken:0,elapsedMs:60000};
    return{w,B,road};
  }
  const rigs=[rig(before),rig(after)],scene=createCanvas(1920,1080),ctx=scene.getContext('2d');
  const records=[];
  for(const mode of ['held','impact','shift','reduced']){
    const sheet=createCanvas(1120,1110),sc=sheet.getContext('2d');
    sc.fillStyle='#07121c';sc.fillRect(0,0,1120,1110);
    for(let pose=0;pose<3;pose++)for(let version=0;version<2;version++){
      const r=rigs[version],steer=[-.8,0,.8][pose],reduced=mode==='reduced';
      const s=r.road.state=r.w.braceReview.newState({progress:3100,lane:1,lanePos:1.5,musicBar:32});
      r.road.configureEncounters();
      Object.assign(s,{elapsedMs:60000,lanePos:1.5,visualLane:1.5,steer,speed:52,gear:1,
        musicBeatFloat:128,shield:mode==='impact'||reduced?0:1,
        defenseKind:'BRACE',defenseFlashMs:mode==='impact'||reduced?450:0});
      if(mode==='shift')Object.assign(s,{musicBeatFloat:129.6,shiftStartBeat:128,
        driveSections:[{beat:128,from:3100,beatSec:60/128,v0:30,speed:70,gear:2}]});
      if(mode==='impact')Object.assign(s,{reactionRecoilMs:300,reactionRecoilSide:1});
      r.B.Preferences.values.reducedMotion=reduced;
      ctx.reset();r.road.draw(ctx);
      const car={...r.w.reviewCar};
      const tile=createCanvas(560,320),tc=tile.getContext('2d');
      tc.drawImage(scene,car.x-280,car.y-210,560,320,0,0,560,320);
      // Copy pixels, avoiding retained live-canvas references between poses.
      sc.putImageData(tc.getImageData(0,0,560,320),version*560,pose*370+42);
      sc.fillStyle=version?'#a5f4da':'#e8b5ac';sc.font='19px Oxanium';
      sc.fillText(`${version?'AFTER':'BEFORE'} / ${mode.toUpperCase()} / ${['LEFT','CENTER','RIGHT'][pose]}`,version*560+15,pose*370+28);
      records.push({mode,steer,reducedMotion:reduced,version:version?'after':'before',car});
    }
    fs.writeFileSync(path.join(out,`Brace-${mode}-before-after.webp`),sheet.toBuffer('image/webp',94));
    console.log(`Brace depth review: ${mode}`);
  }
  const files=['held','impact','shift','reduced'].map(mode=>`Brace-${mode}-before-after.webp`);
  const report={kind:'staged-native-brace-depth-comparison',beforeRevision,
    sourceHashes:{before:sha(before),after:sha(after),registry:sha(registry),renderer:sha(fs.readFileSync(__filename))},
    limitation:'Identical staged production states with native Canvas and original authored assets. Not a played race or a physical-device claim.',
    art:'Original brace-halo.webp is unchanged; only production draw placement and depth order differ.',records,
    files:files.map(file=>({file,sha256:sha(fs.readFileSync(path.join(out,file)))}))};
  fs.writeFileSync(path.join(out,'Brace-Depth-Review.json'),JSON.stringify(report,null,2)+'\n');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
