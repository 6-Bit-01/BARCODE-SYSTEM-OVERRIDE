// Diagnostic only: time production Cache Road Canvas drawing at fixed camera addresses.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {performance}=require('node:perf_hooks');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {createRig}=require('./check-level-01-boss');
const repo=path.resolve(__dirname,'..');
process.chdir(repo);
const revision=process.env.PROFILE_REVISION;
const sourceFor=file=>revision?execFileSync('git',['show',`${revision}:${file}`],{encoding:'utf8'}):
  fs.readFileSync(file,'utf8');
const hasSource=file=>{
  if(!revision)return fs.existsSync(file);
  try {execFileSync('git',['cat-file','-e',`${revision}:${file}`],{stdio:'ignore'});return true;}
  catch{return false;}
};

async function main(){
  const manifest=sourceFor('src/engine/presentation-assets.js');
  const marker='  const cache = {};';
  const defs=createRig();defs.w.Image=undefined;
  vm.runInContext(manifest.replace(marker,'  window.profileEntries=entries;\n'+marker),defs.context);
  const entries=defs.w.profileEntries;
  const images=Object.fromEntries(await Promise.all(Object.entries(entries)
    .filter(([key])=>key.startsWith('cache'))
    .map(async([key,e])=>[key,await loadImage(path.join(repo,e.path))])));
  const r=createRig(),{w,context}=r,B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};
  for(const file of ['src/core/gamepad-ui.js','src/engine/cache-road-proof-profile.js',
    'src/game/cache-road-landscape.js','src/game/cache-road-guidance.js',
    'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
    'src/game/cache-road-pursuit.js','src/game/cache-road-boss-art.js'])
    if(hasSource(file))vm.runInContext(sourceFor(file),context,{filename:file});
  let source=sourceFor('src/game/cache-road-proof.js');
  const terrainStep=process.env.PROFILE_TERRAIN_STEP;
  if(terrainStep!==undefined) {
    const step=Number(terrainStep),period=Number(source.match(/const grainPeriod=(\d+)/)?.[1]);
    if(!Number.isInteger(step)||step<=0||!period||period%step!==0)
      throw Error('PROFILE_TERRAIN_STEP must be a positive integer divisor of the grain period');
    const slab=/const layerStep=[^;]+;/;
    if(!slab.test(source))throw Error('Missing diagnostic slab interval');
    source=source.replace(slab,`const layerStep=${step};`);
  }
  source=source.replace('  B.Campaign.register(ID,',
    '  window.profileNewState=newState;window.profileStrikeDistance=STRIKE_DISTANCE;\n  B.Campaign.register(ID,');
  source=source.replace(/const heightSample=([^;]+);/,
    'const heightSample=$1;window.profileFrameHeight=heightSample;');
  const rearviewCall=source.match(/drawRearview\(ctx, s, \['#f6adbb'[^\n]+\);/)?.[0];
  if(!rearviewCall)throw Error('Missing rearview call');
  for(const [label,call] of [['rearview',rearviewCall],
    ['worldPaint','for(const item of worldPaint)item.draw();']]){
    if(!source.includes(call))throw Error('Missing '+label);
    source=source.replace(call,`window.profileMark('${label}',true);${call}window.profileMark('${label}',false);`);
  }
  // The indexed renderer changes the query, not the stage boundary. Keep
  // one measurement point across both the checkpoint and candidate sources.
  const terrainAnchor='const visibleStreetParts=';
  for(const [label,anchor] of [['terrain',terrainAnchor],
    ['sidewalk','// Side decks track the same bend as the lane geometry.'],
    ['road','// Adjacent slices read adjacent texels from horizon to car.'],
    ['world','for(const drawPool of lampPools)drawPool();'],
    ['paint','// Phrase paint is a road marking, not a second translucent lane overlay.'],
    ['hud',"ctx.fillStyle = '#e4ede5'; ctx.font = 'bold 18px Oxanium, monospace';"]]){
    if(!source.includes(anchor))throw Error('Missing stage '+label);
    source=source.replace(anchor,`window.profileStage('${label}');\n      ${anchor}`);
  }
  let events={};w.profileStage=label=>{const now=performance.now();
    if(events.stageStart)events['stage-'+events.stage]=(events['stage-'+events.stage]||0)+now-events.stageStart;
    events.stage=label;events.stageStart=now;};
  w.profileMark=(label,start)=>{
    if(start)events[label+'Start']=performance.now();
    else events[label]=(events[label]||0)+performance.now()-events[label+'Start'];
  };
  vm.runInContext(source,context);
  w.Image=undefined;w.profileImages=images;
  vm.runInContext(manifest.replace(marker,
    '  const cache=Object.fromEntries(Object.entries(window.profileImages).map(([key,image])=>[key,{image,ready:true}]));'),context);
  B.CacheChapter={recordIds:['r1','r2','r3','r4']};
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),road=B.CacheRoadProof;
  const positions=process.env.PROFILE_POSITIONS?
    process.env.PROFILE_POSITIONS.split(',').map(Number):
    process.env.PROFILE_SEAMS ? [75,76,77,78,79,80,153,154,155,156,157,158] :
    [0,130,300,1000,5000];
  if(!positions.length||positions.some(at=>!Number.isFinite(at)))
    throw Error('PROFILE_POSITIONS must contain finite world addresses');
  const requestedFrames=process.env.PROFILE_FRAMES===undefined?null:Number(process.env.PROFILE_FRAMES);
  if(requestedFrames!==null&&(!Number.isInteger(requestedFrames)||requestedFrames<3||requestedFrames>600))
    throw Error('PROFILE_FRAMES must be an integer between 3 and 600');
  const speed=process.env.PROFILE_SPEED===undefined?52:Number(process.env.PROFILE_SPEED);
  if(!Number.isFinite(speed)||speed<=0||speed>75)
    throw Error('PROFILE_SPEED must be positive and at most 75 world units/second');
  const scenario=process.env.PROFILE_SCENARIO||'road';
  if(!['road','traffic','boss'].includes(scenario))
    throw Error('PROFILE_SCENARIO must be road, traffic or boss');
  if(scenario==='boss'&&!B.CacheRoadEncounters?.supportedVersion(3))
    throw Error('The selected revision has no version-3 boss showdown');
  let drawCalls=0,filteredDrawCalls=0,clips=0;
  const drawImage=ctx.drawImage,clip=ctx.clip;
  ctx.drawImage=function(...args) {drawCalls++;if(this.filter!=='none')filteredDrawCalls++;
    return drawImage.apply(this,args);};
  ctx.clip=function(...args) {clips++;return clip.apply(this,args);};
  for(const progress of positions){
    const musicBar=scenario==='boss'?76:scenario==='traffic'?64:Math.floor(progress/100);
    const state=Object.assign(w.profileNewState(),{progress,elapsedMs:1000,
      lane:0,lanePos:0,visualLane:0,speed,gear:1,timeMs:55000,
      musicBar,musicBeatFloat:scenario==='road'?progress/25:musicBar*4,
      driveSections:[{beat:0,beatSec:60/128,from:0,v0:speed,speed,gear:1}]});
    road.state=state;road.active=true;road.status='playing';
    road.chapter={records:[],difficultyId:'standard',encounterVersion:2};
    let fixture=null;
    if(scenario!=='road') {
      const C=B.CacheRoadEncounters,P=B.CacheRoadPursuit,beatSec=60/128;
      if(!C||!P)throw Error('The selected revision lacks encounter/pursuit production modules');
      const version=C.supportedVersion(3)?3:2;
      road.chapter={records:[],difficultyId:'overclocked',encounterVersion:version};
      state.encounters=C.create('overclocked',version);
      for(let bar=Math.max(4,musicBar-6);bar<=musicBar;bar++) {
        const section={beat:bar*4,beatSec,from:Math.max(0,progress-(musicBar-bar)*4*beatSec*speed),
          v0:speed,speed,gear:1};
        C.commit(state.encounters,section,w.profileStrikeDistance);
      }
      for(const pulse of C.pulses(state.encounters)) {
        state.pulseTargets[pulse.id]=pulse.target;state.pulsePlaces[pulse.id]=pulse.at;
      }
      // Concurrent presentation flags are staged diagnostics, not an earned
      // playthrough or a claim that every effect occurs simultaneously.
      state.boostMs=500;state.braceMs=500;state.passFlashMs=500;
      state.passSide=1;state.pulseFlashMs=240;state.cutFlashMs=180;
      state.captures=[0,1,2,3].map(lane=>({lane,startBeat:musicBar*4-4,endBeat:musicBar*4+16}));
      if(scenario==='boss') {
        state.lane=state.lanePos=state.visualLane=1;
        state.pursuit=P.create({version:3,barFloat:75.9});
        for(let i=0;i<6;i++)P.step(state.pursuit,{before:progress,progress,
          barFloat:76,dt:100,lane:1,difficultyId:'overclocked',actors:[],protectedPulses:[]});
        const actor=P.pose(state.pursuit,{progress}),boss=P.boss(state.pursuit,{progress});
        if(!actor?.boss||!actor.locked||!boss)throw Error('Failed to stage a production locked boss attack');
        fixture={bar:76,attack:actor.attackKind,locked:actor.locked,rigHealth:boss.health,
          attackActors:1,rigBodies:1,stagedPresentationFlags:true};
      } else fixture={bar:musicBar,chartVersion:version,
        committedBars:state.encounters.committedBars.slice(),
        civilianActors:C.hazards(state.encounters).length,stagedPresentationFlags:true};
    }
    const samples=[];
    const frames=requestedFrames??(process.env.PROFILE_SEAMS?3:12);
    for(let i=0;i<frames;i++){
      events={};drawCalls=0;filteredDrawCalls=0;clips=0;
      ctx.reset();const start=performance.now();road.draw(ctx);
      w.profileStage('done');
      const geometry=w.profileFrameHeight?.getStats?.()||null;
      samples.push({total:performance.now()-start,drawCalls,filteredDrawCalls,clips,geometry,
        rearview:events.rearview||0,worldPaint:events.worldPaint||0,
        terrain:events['stage-terrain']||0,sidewalk:events['stage-sidewalk']||0,
        road:events['stage-road']||0,world:events['stage-world']||0,paint:events['stage-paint']||0});
      if(i===2&&process.env.PROFILE_CAPTURE)
        fs.writeFileSync(`${process.env.PROFILE_CAPTURE}-${progress}.png`,canvas.toBuffer('image/png'));
      state.elapsedMs+=16.67;state.progress+=speed/60;state.musicBeatFloat+=.0355;
    }
    const median=key=>{const values=samples.slice(frames===3?0:2).map(s=>s[key]).sort((a,b)=>a-b);
      return Math.round((values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2*100)/100;};
    const warm=samples.slice(frames===3?0:2).map(s=>s.total).sort((a,b)=>a-b);
    const p95=warm[Math.min(warm.length-1,Math.ceil(warm.length*.95)-1)];
    process.stdout.write(JSON.stringify({revision:revision||'HEAD',scenario,fixture,
      terrainStepOverride:terrainStep===undefined?null:Number(terrainStep),progress,totalMs:median('total'),rearviewMs:median('rearview'),worldPaintMs:median('worldPaint'),
      terrainMs:median('terrain'),sidewalkMs:median('sidewalk'),roadMs:median('road'),worldMs:median('world'),paintMs:median('paint'),
      // "paint" also includes traffic, the car, rearview and HUD after that
      // stage marker. It is not the cost of road markings alone.
      samples:frames,warmupFrames:frames===3?0:2,speed,
      firstDrawMs:Math.round(samples[0].total*100)/100,warmP95Ms:Math.round(p95*100)/100,
      drawCalls:median('drawCalls'),filteredDrawCalls:median('filteredDrawCalls'),clips:median('clips'),
      geometry:samples.at(-1).geometry,
      maxMs:Math.round(Math.max(...samples.map(s=>s.total))*100)/100})+'\n');
  }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
