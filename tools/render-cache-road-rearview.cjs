// Focused before/after mirror capture through the actual production helper.
// No replacement atlas painter or invented front-facing vehicle imagery.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync,spawn}=require('node:child_process');
const {once}=require('node:events');
const {performance}=require('node:perf_hooks');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{
  paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const {createRig,load}=require('./check-level-01-boss');

async function main() {
  const out=path.resolve(process.argv[2]||'docs/source-pack/review-cache-clearance-rearview');
  const base=process.argv[3]||'ac9f70c162d45b3e85d8c60c273dad205c0417ed';
  fs.mkdirSync(out,{recursive:true});
  GlobalFonts.registerFromPath(path.resolve('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8');
  const definitionRig=createRig();definitionRig.w.Image=undefined;
  vm.runInContext(manifest.replace('  const cache = {};','  window.entries=entries;\n  const cache = {};'),definitionRig.context);
  const images=Object.fromEntries(await Promise.all(Object.entries(definitionRig.w.entries)
    .filter(([key])=>key.startsWith('cache')).map(async([key,entry])=>
      [key,await loadImage(path.resolve(entry.path))])));
  function rig(revision) {
    const {w,context}=createRig();w.BARCODE.Campaign={register(){},syncTitleButton(){}};
    load(context,'src/engine/cache-road-proof-profile.js');
    const source=file=>revision?execFileSync('git',['show',`${revision}:${file}`],{encoding:'utf8'}):fs.readFileSync(file,'utf8');
    vm.runInContext(source('src/game/cache-road-landscape.js'),context);
    vm.runInContext(source('src/game/cache-road-proof.js').replace('  B.Campaign.register(ID,',
      '  window.rearviewReview={drawRearview,newState};\n  B.Campaign.register(ID,'),context);
    w.Image=undefined;w.images=images;
    vm.runInContext(manifest.replace('  const cache = {};',
      '  const cache=Object.fromEntries(Object.entries(window.images).map(([key,image])=>[key,{image,ready:true}]));'),context);
    const draw=w.BARCODE.PresentationAssets.draw;
    const review=w.rearviewReview;review.submissions=0;
    w.BARCODE.PresentationAssets.draw=(...args)=>{review.submissions++;return draw(...args);};
    return review;
  }
  const before=rig(base),after=rig(),native=createCanvas(1920,160),nc=native.getContext('2d');
  const canvas=createCanvas(1280,480),ctx=canvas.getContext('2d');
  const fps=24,segmentSeconds=4,starts=[185,705,1120,1820];
  const timings=[[],[]],submissions=[[],[]];
  const encoder=spawn('/usr/bin/ffmpeg',['-y','-loglevel','error','-f','rawvideo',
    '-pix_fmt','rgba','-s','1280x480','-r',String(fps),'-i','pipe:0','-an',
    '-c:v','libx264','-threads','2','-preset','veryfast','-crf','20',
    '-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'Rearview-Before-After.mp4')],
    {stdio:['pipe','ignore','pipe']});
  let errors='';encoder.stderr.on('data',chunk=>errors+=chunk);
  for(let f=0;f<starts.length*segmentSeconds*fps;f++) {
    const chapter=Math.floor(f/(segmentSeconds*fps)),seconds=f/fps;
    const progress=starts[chapter]+seconds%segmentSeconds*54;
    ctx.fillStyle='#101f2b';ctx.fillRect(0,0,1280,480);
    ctx.fillStyle='#f1e0b7';ctx.font='21px Oxanium';
    ctx.fillText('Rearview • actual scenery and passing vehicle sprites',28,28);
    ctx.fillStyle='#afc5cd';ctx.font='13px Oxanium';
    ctx.fillText('Same blur: 2.3px • production renderer • existing rear-authored vehicle art • no new front-view paintings',28,50);
    for(const [index,render] of [before,after].entries()) {
      const s={...render.newState(),progress,elapsedMs:seconds*1000,integrity:3,
        timeMs:55000,musicBar:20,musicBeatFloat:80+seconds/(60/128),audits:[],streetMotion:{}};
      nc.setTransform(1,0,0,1,0,0);nc.clearRect(0,0,1920,160);
      render.submissions=0;const started=performance.now();
      render.drawRearview(nc,s,'#8fe3db',false);
      if(f>=fps){timings[index].push(performance.now()-started);submissions[index].push(render.submissions);}
      const y=83+index*194;
      ctx.fillStyle=index?'#bdebd6':'#bdc6d1';ctx.font='15px Oxanium';
      ctx.fillText(index?'UPDATED':'BEFORE',28,y+10);
      ctx.drawImage(native,631,5,704,132,148,y-6,1090,204);
    }
    if(f===Math.round(fps*9.5))fs.writeFileSync(path.join(out,'Rearview-Before-After.webp'),canvas.toBuffer('image/webp',94));
    if(!encoder.stdin.write(Buffer.from(ctx.getImageData(0,0,1280,480).data)))await once(encoder.stdin,'drain');
  }
  encoder.stdin.end();const [code]=await once(encoder,'close');if(code)throw Error(errors);
  const summary=values=>({samples:values.length,mean:values.reduce((a,b)=>a+b,0)/values.length,
    p95:[...values].sort((a,b)=>a-b)[Math.floor(values.length*.95)]});
  fs.writeFileSync(path.join(out,'Rearview-Review.json'),JSON.stringify({base,fps,
    seconds:starts.length*segmentSeconds,worldStarts:starts,speed:54,blur:'2.3px',
    nativeMirrorDrawMs:{before:summary(timings[0]),after:summary(timings[1])},
    assetSubmissions:{before:summary(submissions[0]),after:summary(submissions[1])},
    source:'Actual drawRearview, production atlas metadata and PNG/WebP/SVG assets.',
    limitation:'Traffic uses existing rear-authored sprites; no front-view art is present. Native timings vary with machine load and are not Makko/device FPS. This is not Makko/device footage.'},null,2)+'\n');
  console.log(path.join(out,'Rearview-Before-After.mp4'));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
