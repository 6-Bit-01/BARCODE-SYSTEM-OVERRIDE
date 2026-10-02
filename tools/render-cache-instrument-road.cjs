// Native full-road presentation fixtures over actual combat/road models.
// Scene state is staged; actors advance through the real finite combat owner.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto');
const {createCanvas,loadImage,GlobalFonts,Path2D}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const root=path.resolve(__dirname,'..');process.chdir(root);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const copy=value=>JSON.parse(JSON.stringify(value));
const files=['src/core/gamepad-ui.js','src/engine/cache-road-proof-profile.js',
  'src/game/cache-road-landscape.js','src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
  'src/game/cache-road-pursuit.js','src/game/cache-road-boss-art.js','src/game/cache-road-adrenaline.js',
  'src/game/cache-road-combat.js','src/game/cache-road-combat-art.js','src/game/cache-road-crosswalks.js',
  'src/game/cache-road-mirror.js','src/game/cache-road-crew-callouts.js',
  'src/game/cache-road-instruments.js','src/game/cache-road-guidance.js','src/game/pause-menu.js'];
const sourceFiles=[...files,'src/game/cache-road-proof.js','src/engine/presentation-assets.js','index.html'];
async function main() {
  const out=path.resolve(process.argv[2]||path.join(root,'..','cache-instrument-review'));
  assert(!out.startsWith(root+path.sep),'Review captures belong outside the Git source tree');
  fs.mkdirSync(out,{recursive:true});
  const sourceHashes=Object.fromEntries(sourceFiles.map(file=>[file,hash(fs.readFileSync(file))]));
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const r=createRig(),{w,context,calls}=r,B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};w.Path2D=Path2D;
  for(const file of files)load(context,file);
  const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8'),marker='  const cache = {};';
  assert(manifest.includes(marker));w.Image=undefined;
  vm.runInContext(manifest.replace(marker,'  window.instrumentReviewEntries=entries;\n'+marker),context);
  const entries=Object.entries(w.instrumentReviewEntries).filter(([key])=>key.startsWith('cache'));
  w.instrumentReviewImages=Object.fromEntries(await Promise.all(entries.map(async([key,entry])=>
    [key,await loadImage(path.join(root,entry.path))])));
  const assetHashes=Object.fromEntries(entries.map(([key,entry])=>[key,{path:entry.path,sha256:hash(fs.readFileSync(entry.path))}]));
  vm.runInContext(manifest.replace(marker,
    '  const cache=Object.fromEntries(Object.entries(window.instrumentReviewImages).map(([key,image])=>[key,{image,ready:true}]));'),context);
  let source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
  const expose='  B.Campaign.register(ID,';assert(source.includes(expose));
  source=source.replace(expose,'  window.instrumentReviewState={newState,STRIKE_DISTANCE};\n'+expose);
  vm.runInContext(source,context,{filename:'src/game/cache-road-proof.js'});
  B.CacheChapter={recordIds:['r1','r2','r3','r4']};
  const road=B.CacheRoadProof,C=B.CacheRoadEncounters,K=B.CacheRoadCombat,A=B.CacheRoadAdrenaline;
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),evidence=[];
  const instrument=B.CacheRoadInstruments;let scope=null,scopedTexts=[],ownershipChecks=0;
  const rawFill=ctx.fillText;
  ctx.fillText=function(value,x,y,maxWidth) {
    if(scope) {
      const m=this.getTransform(),width=Math.min(maxWidth??Infinity,this.measureText(String(value)).width);
      const left=x-(this.textAlign==='center'?width/2:this.textAlign==='right'?width:0);
      const size=Number(this.font.match(/([\d.]+)px/)?.[1]||12)*m.a;
      scopedTexts.push({scope,value:String(value),x:left*m.a+y*m.c+m.e,
        y:x*m.b+y*m.d+m.f,width:width*m.a,size});
    }
    return rawFill.call(this,value,x,y,maxWidth);
  };
  function wrapped(name) {
    return function(drawCtx,...args) {
      const centerBefore=hash(drawCtx.getImageData(500,230,830,850).data),prior=scope;
      scope=name;const result=instrument[name](drawCtx,...args);scope=prior;
      assert.equal(hash(drawCtx.getImageData(500,230,830,850).data),centerBefore,
        `${name} cannot add a center-road overlay`);ownershipChecks++;return result;
    };
  }
  B.CacheRoadInstruments={...instrument,drawSkills:wrapped('drawSkills'),drawAdrenaline:wrapped('drawAdrenaline')};
  const specs=[{name:'Cold-Keyboard',initial:37,result:'misses',sync:1,controller:false},
    {name:'Charged-PlayStation',initial:40,result:'good',sync:3,controller:'playstation'},
    {name:'Rush-Xbox',initial:65,result:'perfect',sync:4,controller:'xbox'},
    {name:'Rush-Quiet',initial:65,result:'perfect',sync:4,controller:'playstation',quiet:true}];
  for(const spec of specs) {
    const progress=5000,speed=52,bar=64,beatSec=60/128;
    const s=Object.assign(w.instrumentReviewState.newState(),{progress,elapsedMs:21500,lane:1,lanePos:1.5,
      visualLane:1.5,speed,gear:1,timeMs:55000,musicBar:bar,musicBeatFloat:bar*4,
      opening:{held:true,sealed:true,turbo:true,echo:true},
      driveSections:[{beat:bar*4,beatSec,from:progress,v0:speed,speed,gear:1}]});
    road.state=s;road.active=true;road.status='playing';road.audioDegraded=false;
    road.chapter={records:[],difficultyId:'overclocked',encounterVersion:4};
    s.encounters=C.create('overclocked',4);
    for(let atBar=bar-6;atBar<=bar;atBar++)C.commit(s.encounters,{beat:atBar*4,beatSec,
      from:progress-(bar-atBar)*4*beatSec*speed,v0:speed,speed,gear:1},w.instrumentReviewState.STRIKE_DISTANCE);
    for(const pulse of C.pulses(s.encounters)) {s.pulseTargets[pulse.id]=pulse.target;s.pulsePlaces[pulse.id]=pulse.at;}
    s.captures=Array.from({length:spec.sync},(_,lane)=>({lane,startBeat:bar*4-4,endBeat:bar*4+16}));
    s.fullAdrenaline=spec.sync===4;
    s.adrenaline=A.create({value:spec.initial});
    if(spec.result==='misses') {
      A.resolve(s.adrenaline,{id:'native-miss-one',result:'miss',atMs:20000});
      A.resolve(s.adrenaline,{id:'native-miss-two',result:'miss',atMs:21100});
    } else A.resolve(s.adrenaline,{id:`native-${spec.result}`,result:spec.result,atMs:21100});
    s.lockEnergy=s.adrenaline.value;
    s.combat=K.create({difficultyId:'overclocked'});
    for(let frame=0;frame<420;frame++)K.step(s.combat,50,{progress:progress-420*speed*.05+(frame+1)*speed*.05,
      lanePos:s.lanePos,speed,bar,syncCount:spec.sync,adrenaline:s.adrenaline.value,invulnerableMs:1e6,
      actors:C.hazards(s.encounters)});
    const combatPose=K.pose(s.combat,{progress,lanePos:s.lanePos,syncCount:spec.sync,adrenaline:s.adrenaline.value});
    assert(combatPose.actors.length>=2,'full-road fixture must really contain multiple production opponents');
    B.GamepadUI.connected=!!spec.controller;B.ControllerSettings.labels=spec.controller||'auto';
    w.navigator.getGamepads=()=>spec.controller?[{mapping:'standard',id:spec.controller==='playstation'?'DualSense':'Xbox',
      index:0,connected:true,buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0]}]:[];
    B.Preferences.values.reducedMotion=!!spec.quiet;B.Preferences.values.flashes=!spec.quiet;
    w.BARCODE_RENDER_QUALITY={...(w.BARCODE_RENDER_QUALITY||{}),flashes:!spec.quiet};
    scopedTexts=[];ctx.reset();const before=JSON.stringify(s);road.draw(ctx);
    assert.equal(JSON.stringify(s),before,'full production drawing must not advance staged game state');
    for(const item of scopedTexts) {
      const box=item.scope==='drawSkills'?{x:1364,right:1880,y:100,bottom:172}:{x:28,right:482,y:238,bottom:316};
      assert(item.x>=box.x&&item.x+item.width<=box.right&&item.y-item.size*.6>=box.y&&item.y+item.size*.6<=box.bottom,
        `${spec.name} ${item.scope} clips ${item.value}: ${JSON.stringify(item)}`);
    }
    const skillsText=scopedTexts.filter(item=>item.scope==='drawSkills').map(item=>item.value);
    const expectedKeys=spec.controller==='playstation'?['R1','L1','R2','L2']:
      spec.controller==='xbox'?['RB','LB','RT','LT']:['F','SPACE','G','V'];
    for(const key of expectedKeys)assert(skillsText.includes(key),`${spec.name} maps the actual ${key} skill input`);
    assert(skillsText.includes(`×${combatPose.benefits.power.toFixed(2)}`),
      'full road HUD must use the actual combined sync/adrenaline combat power');
    const fullPixels=ctx.getImageData(0,0,1920,1080).data;
    const file=`Road-${spec.name}.png`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));
    const skillsCrop=createCanvas(562,175),kc=skillsCrop.getContext('2d');kc.drawImage(canvas,1338,0,562,175,0,0,562,175);
    fs.writeFileSync(path.join(out,`Skills-${spec.name}.png`),skillsCrop.toBuffer('image/png'));
    // Same quiet simulation timestamp must keep the entire production frame steady.
    ctx.reset();road.draw(ctx);assert.equal(hash(ctx.getImageData(0,0,1920,1080).data),hash(fullPixels),
      `${spec.name} repeated/paused frame is pixel-identical`);
    evidence.push({file,sha256:hash(fs.readFileSync(path.join(out,file))),
      tier:A.pose(s.adrenaline).tier,value:s.adrenaline.value,controller:spec.controller||'keyboard',
      reducedMotion:!!spec.quiet,flashes:!spec.quiet,syncCount:spec.sync,
      actors:copy(combatPose.actors),instrumentText:scopedTexts});
    if(spec.name==='Rush-Quiet') {
      w.isPaused=true;B.PauseMenu.sync();B.PauseMenu.draw(ctx);
      const pause='Road-Pause-PlayStation.png';fs.writeFileSync(path.join(out,pause),canvas.toBuffer('image/png'));
      evidence.push({file:pause,sha256:hash(fs.readFileSync(path.join(out,pause))),kind:'full-production-pause-menu',controller:'playstation'});
      w.isPaused=false;B.PauseMenu.sync();
    }
    console.log(JSON.stringify({file,tier:A.pose(s.adrenaline).tier,value:s.adrenaline.value,actors:combatPose.actors.length,
      instrumentTextBounds:true,roadCenterClear:true}));
  }
  assert.equal(calls.errors.length,0,`Native host errors: ${calls.errors.join('; ')}`);
  for(const [file,digest] of Object.entries(sourceHashes))assert.equal(hash(fs.readFileSync(file)),digest,`Source changed during review: ${file}`);
  fs.writeFileSync(path.join(out,'instrument-road-native-evidence.json'),JSON.stringify({kind:'native-full-production-road-fixtures',
    dimensions:{width:1920,height:1080},sourceHashes,assetHashes,ownershipChecks,frames:evidence,
    limits:'Full production road/UI/physical combat rendering over staged scene, capture and adrenaline states. Opponents originate from420realfinitecombatupdates; these are UI fixtures, not an earned playthrough, physical controller, Makko, audio or device-FPS acceptance.'},null,2)+'\n');
  console.log(JSON.stringify({out,frames:evidence.length,ownershipChecks,sourceFence:true}));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
