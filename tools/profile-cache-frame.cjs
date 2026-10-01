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

async function main(){
  const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8');
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
    'src/game/cache-road-landscape.js','src/game/cache-road-guidance.js'])
    vm.runInContext(sourceFor(file),context,{filename:file});
  let source=sourceFor('src/game/cache-road-proof.js');
  source=source.replace('  B.Campaign.register(ID,','  window.profileNewState=newState;\n  B.Campaign.register(ID,');
  for(const [label,call] of [['rearview',"drawRearview(ctx, s, ['#f6adbb', '#f3b276', '#d2a4f9', '#9aefce'][section], reduced);"],
    ['worldPaint','for(const item of worldPaint)item.draw();']]){
    if(!source.includes(call))throw Error('Missing '+label);
    source=source.replace(call,`window.profileMark('${label}',true);${call}window.profileMark('${label}',false);`);
  }
  for(const [label,anchor] of [['terrain','const visibleStreetParts=(LANDSCAPE.streetParts||[]).filter(part=>{'],
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
  const positions=process.env.PROFILE_SEAMS ? [69,70,71,72,73,74,141,142,143,144] :
    [0,130,300,1000,5000];
  for(const progress of positions){
    const state=Object.assign(w.profileNewState(),{progress,elapsedMs:1000,
      lane:0,lanePos:0,visualLane:0,speed:52,gear:1,timeMs:55000,
      musicBar:Math.floor(progress/100),musicBeatFloat:progress/25,
      driveSections:[{beat:0,beatSec:60/128,from:0,v0:52,speed:52,gear:1}]});
    road.state=state;road.active=true;road.status='playing';
    road.chapter={records:[],difficultyId:'standard',encounterVersion:2};
    const samples=[];
    const frames=process.env.PROFILE_SEAMS?3:12;
    for(let i=0;i<frames;i++){
      events={};ctx.reset();const start=performance.now();road.draw(ctx);
      w.profileStage('done');
      samples.push({total:performance.now()-start,rearview:events.rearview||0,worldPaint:events.worldPaint||0,
        terrain:events['stage-terrain']||0,sidewalk:events['stage-sidewalk']||0,
        road:events['stage-road']||0,world:events['stage-world']||0,paint:events['stage-paint']||0});
      if(i===2&&process.env.PROFILE_CAPTURE)
        fs.writeFileSync(`${process.env.PROFILE_CAPTURE}-${progress}.png`,canvas.toBuffer('image/png'));
      state.elapsedMs+=16.67;state.progress+=.87;state.musicBeatFloat+=.0355;
    }
    const median=key=>{const values=samples.slice(frames===3?0:2).map(s=>s[key]).sort((a,b)=>a-b);
      return Math.round((values[Math.floor((values.length-1)/2)]+values[Math.floor(values.length/2)])/2*100)/100;};
    process.stdout.write(JSON.stringify({revision:revision||'HEAD',progress,totalMs:median('total'),rearviewMs:median('rearview'),worldPaintMs:median('worldPaint'),
      terrainMs:median('terrain'),sidewalkMs:median('sidewalk'),roadMs:median('road'),worldMs:median('world'),paintMs:median('paint'),
      maxMs:Math.round(Math.max(...samples.map(s=>s.total))*100)/100})+'\n');
  }
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
