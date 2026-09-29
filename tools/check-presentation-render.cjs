// Optional native Canvas equivalence/performance review. The ordinary
// dependency-free asset check remains part of npm test; this review requires
// @napi-rs/canvas from the installed runtime. It is not device FPS acceptance.
// Usage: node tools/check-presentation-render.cjs [--baseline <git revision>]
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {performance}=require('node:perf_hooks');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{
  paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]
}));
const sourcePath='src/engine/presentation-assets.js';
const source=fs.readFileSync(sourcePath,'utf8');
function renderer(code,images={}) {
  const w={__images:images};
  vm.runInNewContext(code.replace('  const cache = {};',
    '  const cache = Object.fromEntries(Object.entries(window.__images).map(([key,image])=>[key,{image,ready:true}]));')
    .replace('  B.PresentationAssets = {','  window.__entries=entries;\n  B.PresentationAssets = {'),
  {window:w});
  return {draw:w.BARCODE.PresentationAssets.draw,entries:w.__entries};
}
// Straightforward reference using the original public draw contract. It
// deliberately takes a Canvas state copy so the optimized path can be
// checked against an independently composed transform and crop operation.
function reference(entries,images,key,ctx,args={}) {
  const entry=entries[key],image=images[key];
  const {x=0,y=0,width=96,frame=0,flip=false,sourceRect=null}=args;
  const frameW=image.naturalWidth/entry.columns,frameH=image.naturalHeight/entry.rows;
  const index=Math.max(0,Math.floor(frame))%entry.frames;
  const [sx,sy,sw,sh]=sourceRect||entry.crop||[0,0,frameW,frameH];
  const height=args.height??width*sh/sw;
  ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);
  ctx.imageSmoothingEnabled=!!entry.smooth;
  ctx.drawImage(image,index%entry.columns*frameW+sx,
    Math.floor(index/entry.columns)*frameH+sy,sw,sh,
    -width*entry.ax,-height*entry.ay,width,height);
  ctx.restore();return true;
}
function callerState(ctx,mode,origin) {
  ctx.fillStyle='#143245';ctx.fillRect(0,0,400,300);
  ctx.setTransform(1,.12,-.07,1,origin?200:11,origin?210:13);
  ctx.beginPath();ctx.rect(origin?-150:4,origin?-150:6,350,240);ctx.clip();
  ctx.globalAlpha=.72;ctx.globalCompositeOperation='screen';
  ctx.imageSmoothingEnabled=mode%2===0;
  ctx.filter=mode===2?'blur(1px)':'none';
  ctx.shadowColor='#00332480';ctx.shadowBlur=mode===3?3:0;
}
function snapshot(ctx) {
  const t=ctx.getTransform();
  return {matrix:[t.a,t.b,t.c,t.d,t.e,t.f],alpha:ctx.globalAlpha,
    blend:ctx.globalCompositeOperation,smoothing:ctx.imageSmoothingEnabled,
    filter:ctx.filter,shadow:ctx.shadowBlur,fill:ctx.fillStyle};
}
async function main() {
  const keys=['cacheCar','cacheSweeper','cacheMirror','cacheNewLampL',
    'cacheWalkerCourierTravel','cacheBlacktop','cacheWorkshopLFrontGap','bossPulse'];
  const entries=renderer(source).entries,images={};
  for(const key of keys)images[key]=await loadImage(entries[key].path);
  const current=renderer(source,images);
  let scenarios=0,differingBytes=0,maxChannelDelta=0;
  for(const key of keys)for(const origin of [true,false])for(let mode=0;mode<4;mode++) {
    const args={x:origin?0:157.375,y:origin?0:194.625,width:112.5,height:86.25,
      frame:mode*3+.8,flip:mode===1};
    if(key==='cacheBlacktop')args.sourceRect=[3,240,2170,20];
    if(key==='cacheMirror')args.sourceRect=[0,150,402,185];
    const a=createCanvas(400,300),b=createCanvas(400,300);
    const ac=a.getContext('2d'),bc=b.getContext('2d');
    callerState(ac,mode,origin);callerState(bc,mode,origin);
    const before=snapshot(ac);
    current.draw(key,ac,args);reference(entries,images,key,bc,args);
    assert.deepEqual(snapshot(ac),before,key+' preserves caller state');
    // A following fill exercises the unchanged clip and composite state.
    ac.fillRect(-40,216,490,70);bc.fillRect(-40,216,490,70);
    const actual=ac.getImageData(0,0,400,300).data;
    const expected=bc.getImageData(0,0,400,300).data;
    let changed=0;
    for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i]) {
      changed++;maxChannelDelta=Math.max(maxChannelDelta,Math.abs(actual[i]-expected[i]));
    }
    differingBytes+=changed;scenarios++;
    assert.equal(changed,0,key+' mode '+mode+' origin '+origin+' matches reference pixels exactly');
  }
  const report={scenarios,differingBytes,maxChannelDelta,
    contextStatePreserved:true,limit:'Native Canvas microbenchmark; not Makko/browser FPS.'};
  const baselineIndex=process.argv.indexOf('--baseline');
  if(baselineIndex>=0) {
    const revision=process.argv[baselineIndex+1];
    assert(revision,'--baseline needs a git revision');
    const baseline=renderer(execFileSync('git',['show',revision+':'+sourcePath],
      {encoding:'utf8'}),images);
    const scenarios=keys.flatMap((key,index)=>Array.from({length:8},(_,frame)=>({
      key,args:{x:0,y:0,
        width:key==='cacheBlacktop'?384:42+index*6,
        height:key==='cacheBlacktop'?8:38+index*5,frame,
        sourceRect:key==='cacheBlacktop'?[0,240,2172,20]:null}
    })));
    const rounds=14,drawsPerRound=1024,times={before:[],after:[]};
    const canvas=createCanvas(400,300),ctx=canvas.getContext('2d');
    ctx.setTransform(.95,.02,-.04,.9,110,130);
    const run=draw=>{
      const start=performance.now();
      for(let i=0;i<drawsPerRound;i++) {
        const item=scenarios[i%scenarios.length];draw(item.key,ctx,item.args);
      }
      return performance.now()-start;
    };
    run(baseline.draw);run(current.draw);
    for(let i=0;i<rounds;i++)for(const name of i%2?['after','before']:['before','after']) {
      ctx.clearRect(-200,-200,800,700);
      times[name].push(run(name==='before'?baseline.draw:current.draw));
    }
    const median=values=>{const a=values.slice().sort((a,b)=>a-b);return(a[6]+a[7])/2;};
    const before=median(times.before),after=median(times.after);
    report.benchmark={revision,scope:'Origin-aligned projected texture draw path',rounds,drawsPerRound,beforeMedianMs:before,
      afterMedianMs:after,changePercent:100*(after-before)/before,times};
  }
  console.log(JSON.stringify(report,null,2));
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
