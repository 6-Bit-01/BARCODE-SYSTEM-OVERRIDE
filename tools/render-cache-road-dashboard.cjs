// Actual HUD/road renderer with deterministic review states, never baked values.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
async function main() {
  const out=path.resolve(process.argv[2]||'docs/source-pack/review-cache-digital-dashboard');
  fs.mkdirSync(out,{recursive:true});
  GlobalFonts.registerFromPath(path.resolve('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8');
  const defs=createRig();defs.w.Image=undefined;
  vm.runInContext(manifest.replace('  const cache = {};','  window.entries=entries;\n  const cache = {};'),defs.context);
  const images=Object.fromEntries(await Promise.all(Object.entries(defs.w.entries)
    .filter(([key])=>key.startsWith('cache')).map(async([key,entry])=>
      [key,await loadImage(path.resolve(entry.path))])));
  function rig(revision) {
    const {w,context}=createRig();const B=w.BARCODE;
    B.Campaign={register(){},syncTitleButton(){}};
    load(context,'src/engine/cache-road-proof-profile.js');
    const source=file=>revision?execFileSync('git',['show',`${revision}:${file}`],{encoding:'utf8'}):fs.readFileSync(file,'utf8');
    vm.runInContext(source('src/game/cache-road-landscape.js'),context);
    vm.runInContext(source('src/game/cache-road-proof.js').replace('  B.Campaign.register(ID,',
      '  window.dashboardReview={newState};\n  B.Campaign.register(ID,'),context);
    w.Image=undefined;w.images=images;
    vm.runInContext(manifest.replace('  const cache = {};',
      '  const cache=Object.fromEntries(Object.entries(window.images).map(([key,image])=>[key,{image,ready:true}]));'),context);
    const native=createCanvas(1920,1080),ctx=native.getContext('2d');
    let inHud=false,words=[];
    const fill=ctx.fillRect.bind(ctx),text=ctx.fillText.bind(ctx);
    ctx.fillRect=(x,y,width,height)=>{if(x===0&&y===0&&width===1920&&height===164)inHud=true;return fill(x,y,width,height);};
    ctx.fillText=(value,x,y,...rest)=>{if(inHud&&y>=0&&y<=164)words.push(String(value));return text(value,x,y,...rest);};
    return {B,native,draw(config) {
      const s=Object.assign(w.dashboardReview.newState(),{progress:1500,elapsedMs:5400,
        lane:1,lanePos:1,visualLane:1,speed:52,gear:1,timeMs:55000,integrity:3,
        musicBar:24,musicBeatFloat:96,pendingGear:null,echoEnergy:77,nearMisses:1,
        captures:[],queuedCaptures:[],pulseTargets:{},audits:[],streetMotion:{}},config);
      if(s.opening)s.opening.sealed=true;
      if(Object.keys(s.pulseTargets).length) {
        s.pulsePlaces={'0/0/0':146.469,'0/0/1':322.469};
        const beat=Math.floor(s.musicBeatFloat/4)*4;
        s.driveSections=[{beat,beatSec:60/128,from:s.progress-(s.musicBeatFloat-beat)*22,
          v0:22/(60/128),speed:22/(60/128)}];
      }
      B.GamepadUI={connected:!!config.controller};
      B.ControllerSettings={button:i=>['A','B','X','Y','RB','LB'][i]};
      B.Preferences={values:{reducedMotion:!!config.reduced}};
      const road=B.CacheRoadProof;road.state=s;road.active=true;road.status='playing';road.audioDegraded=false;
      ctx.reset();inHud=false;words=[];road.draw(ctx);
      return {labels:words.slice(),textWords:words.join(' ').split(/\s+/).filter(t=>/[a-z]/i.test(t)).length};
    }};
  }
  const base='37717ca56188dbc708596a6d4cbb8e0aa320f27b',before=rig(base),after=rig();
  const states=[
    ['Cruise · live MPH / gear / time',{}],
    ['Queued gear + Turbo · controller bindings',{pendingGear:2,queuedTurbo:true,boost:1,controller:true,echoEnergy:100,shield:1,ramMs:1100,captures:[{lane:0,startBeat:80,endBeat:112},{lane:2,startBeat:80,endBeat:116}],queuedCaptures:[{lane:1,startBeat:100,endBeat:132}]}],
    ['Low time + damage · distinct warning color',{timeMs:6500,integrity:1,gear:0,speed:30,echoEnergy:18,draftMs:250}],
    ['Action lead-in · target lane + beat ONE',{progress:130,musicBeatFloat:2,musicBar:0,lane:0,lanePos:0,visualLane:0,pulseTargets:{'0/0/0':4}}],
    ['Press on ONE · mapped button',{progress:130,musicBeatFloat:4,musicBar:1,lane:0,lanePos:0,visualLane:0,pulseTargets:{'0/0/0':4},controller:true}],
    ['Caught action · Reduced Motion',{progress:130,pulseFlashMs:400,pulseFlashAction:2,pulseCombo:2,reduced:true}],
    ['Final exit · actionable guidance',{progress:9800,gateAt:9900,echoEnergy:100,gear:2,speed:70,controller:true}],
  ];
  const sheet=createCanvas(1280,states.length*142+22),sc=sheet.getContext('2d');
  sc.fillStyle='#0b151c';sc.fillRect(0,0,sheet.width,sheet.height);
  const report={base,source:'Actual production Canvas draws with deterministic review states; no input-driven gameplay claim.',states:[]};
  for(const [index,[label,config]] of states.entries()) {
    const metrics=after.draw(config);const y=index*142+22;
    sc.fillStyle='#bcebd5';sc.font='16px Oxanium';sc.fillText(label,16,y);
    sc.drawImage(after.native,0,0,1920,164,0,y+10,1280,109.333);
    report.states.push({label,...metrics});
    if(index===0) {
      const full=createCanvas(1280,720);full.getContext('2d').drawImage(after.native,0,0,1280,720);
      fs.writeFileSync(path.join(out,'Dashboard-Drive.webp'),full.toBuffer('image/webp',94));
    }
  }
  fs.writeFileSync(path.join(out,'Dashboard-States.webp'),sheet.toBuffer('image/webp',95));
  const comparison=createCanvas(1280,335),cc=comparison.getContext('2d');
  cc.fillStyle='#0b151c';cc.fillRect(0,0,1280,335);cc.fillStyle='#f3dca5';cc.font='20px Oxanium';
  cc.fillText('Cache Road · 1980s digital instruments',18,27);
  for(const [i,render] of [before,after].entries()) {
    const metrics=render.draw(states[0][1]);report[i?'after':'before']=metrics;
    cc.fillStyle=i?'#bcebd5':'#b9c7cd';cc.font='15px Oxanium';cc.fillText(i?'UPDATED':'BEFORE',18,58+i*139);
    cc.drawImage(render.native,0,0,1920,164,0,66+i*139,1280,109.333);
  }
  fs.writeFileSync(path.join(out,'Dashboard-Before-After.webp'),comparison.toBuffer('image/webp',95));
  fs.writeFileSync(path.join(out,'Dashboard-Review.json'),JSON.stringify(report,null,2)+'\n');
  console.log(path.join(out,'Dashboard-States.webp'));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
