// Exercise meaningful face transitions using only the shared update clock.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const window = {BARCODE:{},FILE_MANIFEST:[]};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,
  '../src/game/cache-road-mirror.js'),'utf8'),{window});
const M = window.BARCODE.CacheRoadMirror;
const input = patch => ({status:'playing',integrity:3,timeMs:55000,
  boostMs:0,fullAdrenaline:false,pulseFlashMs:0,passFlashMs:0,cutFlashMs:0,...patch});
const advance = (s,ms,patch={}) => {
  for (let left=ms;left>0;left-=20) M.step(s,Math.min(left,20),input(patch));
};
const snapshot = s => JSON.stringify(s);

// Ordinary events at a rapidly changing boundary cannot cycle the atlas.
{
  const s=M.create(),frames=new Set();
  for(let i=0;i<1000;i++) {
    M.step(s,20,input({boostMs:i%2?200:0,threat:i%2===0}));
    frames.add(M.expression(s));
  }
  assert.deepEqual([...frames],[0]);
  advance(s,440,{threat:true});assert.equal(M.expression(s),0);
  advance(s,20,{threat:true});assert.equal(M.expression(s),1);
  advance(s,1000);assert.equal(M.expression(s),1,'dwell outlasts a disappearing warning');
  advance(s,2000);assert.equal(M.expression(s),0);
}

// Consecutive successful captures hold one focused expression, even though
// each existing HUD flash fades between caught beats.
{
  const s=M.create();let changes=0,last=M.expression(s);
  for(let elapsed=0;elapsed<20000;elapsed+=20) {
    const pulseFlashMs=Math.max(0,650-elapsed%1000);
    M.step(s,20,input({pulseFlashMs}));
    const face=M.expression(s);if(face!==last)changes++;last=face;
  }
  assert.equal(M.expression(s),1);assert.equal(changes,1);
  advance(s,4000);assert.equal(M.expression(s),0);
}

// Low signal uses a separate recovery threshold. An 8-second boundary wobble
// cannot flip alarm/calm; recovered verse time can deliberately clear alarm.
{
  const s=M.create();advance(s,500,{timeMs:7900});assert.equal(M.expression(s),5);
  for(let i=0;i<300;i++)M.step(s,20,input({timeMs:i%2?8050:7950}));
  assert.equal(M.expression(s),5);
  advance(s,3500,{timeMs:11000});assert.equal(M.expression(s),0);
  advance(s,500,{integrity:1});assert.equal(M.expression(s),5);
  advance(s,4000,{integrity:1,boostMs:1000,fullAdrenaline:true});
  assert.equal(M.expression(s),5,'urgency outranks confidence');
}

// Actual hits preempt every nonurgent dwell, show impact for a bounded time,
// and recover through focused before ordinary driving resumes.
{
  const s=M.create();advance(s,500,{boostMs:1000});assert.equal(M.expression(s),2);
  M.onHit(s);assert.equal(M.expression(s),4);
  advance(s,680);assert.equal(M.expression(s),4);
  advance(s,20);assert.equal(M.expression(s),1);
  advance(s,1200);assert.equal(M.expression(s),1);
  advance(s,1800);assert.equal(M.expression(s),0);
  M.step(s,20,input({stumbleMs:650}));assert.equal(M.expression(s),4);
  advance(s,700);assert.equal(M.expression(s),1,'a decaying stumble is one hit event');
  assert.equal(M.expression(s,{status:'failed'}),5);
  assert.equal(M.expression(s,{status:'clear'}),2);
}

// A pass earns a short reaction; a stream of passes cannot constantly restart
// it. Snapshot comparisons also guard the render and pause read contracts.
{
  const s=M.create();advance(s,500,{passKind:'NEAR MISS',passFlashMs:780});
  assert.equal(M.expression(s),3);
  const before=snapshot(s);
  for(let i=0;i<100;i++) {
    M.expression(s);M.expression(s,{status:'clear'});
    M.step(s,0,input({boostMs:1000,pulseFlashMs:650}));
  }
  assert.equal(snapshot(s),before,'pause and draw cannot consume or advance events');
  advance(s,2000);assert.equal(M.expression(s),3,'displayed reaction gets a full dwell');
  advance(s,1000);assert.equal(M.expression(s),0);
  M.step(s,20,input({passKind:'NEAR MISS',passFlashMs:780}));
  advance(s,500);assert.equal(M.expression(s),0,'reaction has a repeat cooldown');
  advance(s,2400);M.step(s,20,input({passKind:'CLOSE CUT',passFlashMs:780}));
  advance(s,500);assert.equal(M.expression(s),3,'a later earned pass may react again');
}

// A full song-length stream of earned captures, chase warnings and passes
// remains a small set of sustained moods rather than a face for every flash.
{
  const s=M.create();let changes=0,last=M.expression(s);const seen=new Set([last]);
  for(let elapsed=0;elapsed<187500;elapsed+=20) {
    if(elapsed===75000)M.onHit(s,{stumbleMs:650});
    M.step(s,20,input({integrity:elapsed>=170000?1:3,
      boostMs:elapsed%14000<2500?2500-elapsed%14000:0,
      fullAdrenaline:elapsed>=45000&&elapsed<150000,
      threat:elapsed%5500<1100,pulseFlashMs:Math.max(0,650-elapsed%938),
      passKind:'NEAR MISS',passFlashMs:Math.max(0,780-elapsed%6000),
      stumbleMs:elapsed>=75000&&elapsed<75650?75650-elapsed:0}));
    const face=M.expression(s);seen.add(face);if(last!==face)changes++;last=face;
    assert(s.ageMs<=M.timing.dwellMs&&s.candidateMs<=M.timing.settleMs);
  }
  assert(changes<65,`busy song-length event stream changed face ${changes} times`);
  for(const face of [1,2,3,4,5])assert(seen.has(face),`meaningful atlas cell ${face} remains reachable`);
}
// Exercise the production blur caller, including its computed device-space crop.
// A capable native host would take the old readback/VideoFrame path, so these
// assertions distinguish the actual caller from an isolated helper fallback.
{
  const road=fs.readFileSync(path.join(__dirname,'../src/game/cache-road-proof.js'),'utf8');
  const helperStart=road.indexOf('  function copySampledWorldPixels('),
    helperEnd=road.indexOf('  function clipLightBlend(',helperStart),
    guardStart=road.indexOf('    const mirrorTransform=ctx.getTransform?.();'),
    guardEnd=road.indexOf("    ctx.save(); ctx.filter = 'blur(2.3px)';",guardStart),
    paintStart=road.indexOf('    if(compositeBlur) {',guardEnd),
    paintEnd=road.indexOf('    // Only reflected scenery gets softened.',paintStart);
  assert(helperStart>=0&&helperEnd>helperStart&&guardStart>=0&&guardEnd>guardStart&&
    paintStart>guardEnd&&paintEnd>paintStart,'test the actual mirror eligibility and blur call');
  const code=road.slice(helperStart,helperEnd)+'\nfunction paint(){'+
    road.slice(guardStart,guardEnd)+road.slice(paintStart,paintEnd)+'}\npaint();';
  const identity={a:1,b:0,c:0,d:1,e:0,f:0};
  for(const scenario of [
    {name:'native',opaque:true,matrix:identity,crop:[626,0,714,141],composite:'source-over'},
    {name:'fading',opaque:false,matrix:identity,crop:[626,0,714,141],composite:'copy'},
    {name:'scaled',opaque:true,matrix:{a:.5,b:0,c:0,d:.5,e:17,f:31},crop:[324,25,369,83],composite:'copy'},
    {name:'rotated',opaque:true,matrix:{a:.8,b:.2,c:-.2,d:.8,e:100,f:10},crop:[572,135,600,256],composite:'copy'},
    {name:'missing-video-frame',opaque:true,matrix:identity,crop:[626,0,714,141],composite:'source-over'},
    {name:'missing-transform',opaque:true,matrix:identity},
    {name:'non-browser-canvas',opaque:true,matrix:identity}
  ]) {
    const calls=[],stack=[],pixelBudget={};
    class Canvas {constructor(){this.width=1920;this.height=1080;}}
    class VideoFrame {
      constructor(){calls.push({kind:'frame'});}
      close(){calls.push({kind:'close'});}
    }
    const canvas=scenario.name==='non-browser-canvas'?{width:1920,height:1080}:new Canvas();
    const state=context=>({globalAlpha:context.globalAlpha,filter:context.filter,
      globalCompositeOperation:context.globalCompositeOperation,
      transform:{...context.transform},clip:context.clip,
      imageSmoothingEnabled:context.imageSmoothingEnabled,imageSmoothingQuality:context.imageSmoothingQuality});
    const ctx={canvas,globalAlpha:.37,filter:'contrast(1.08)',globalCompositeOperation:'lighter',
      transform:{...scenario.matrix},clip:'original-curved-glass',imageSmoothingEnabled:true,imageSmoothingQuality:'high',
      getTransform:scenario.name==='missing-transform'?undefined:function(){return {...this.transform};},
      save(){stack.push(state(this));},restore(){assert(stack.length);Object.assign(this,stack.pop());},
      setTransform(a,b,c,d,e,f){this.transform={a,b,c,d,e,f};},
      getContextAttributes(){calls.push({kind:'attributes'});return {colorSpace:'srgb'};},
      getImageData(sx,sy,width,height){
        calls.push({kind:'read'});
        return {width,height,colorSpace:'srgb',data:new Uint8ClampedArray(width*height*4).fill(255)};
      },
      drawImage(...args){calls.push({kind:'draw',args,state:state(this)});}};
    const before=state(ctx);
    vm.runInNewContext(code,{window:{HTMLCanvasElement:Canvas,
      VideoFrame:scenario.name==='missing-video-frame'?undefined:VideoFrame},
      ctx,pixelBudget,opaqueBackdrop:scenario.opaque,x:638,y:12,w:690,h:117,
      clamp:(value,min,max)=>Math.min(max,Math.max(min,value))});
    assert.deepEqual(calls.filter(call=>['attributes','read','frame','close'].includes(call.kind)),[],
      scenario.name+': mirror painting must never read back or allocate a VideoFrame');
    const draws=calls.filter(call=>call.kind==='draw');
    assert.equal(draws.length,scenario.crop?1:0,scenario.name+': exactly one supported composite blur');
    if(scenario.crop) {
      assert.equal(draws[0].args[0],canvas,'the existing display Canvas supplies the reflection');
      assert.deepEqual(draws[0].args.slice(1),[...scenario.crop,...scenario.crop],scenario.name+': bounded source/destination crop');
      assert.deepEqual(draws[0].state,{...before,globalAlpha:1,filter:'blur(2.3px)',
        globalCompositeOperation:scenario.composite,transform:identity},scenario.name+': original mask, sampler and composite semantics');
      assert.equal(pixelBudget.mirrorPixelCopyUsed,false,'transport telemetry records the direct self-copy');
    }else assert.equal(pixelBudget.mirrorPixelCopyUsed,undefined,'unsupported composite hosts retain their existing per-object path');
    assert.deepEqual(state(ctx),before,scenario.name+': restore caller alpha/filter/composite/transform/clip/sampler');
    assert.equal(stack.length,0,scenario.name+': balanced context ownership');
  }
}
console.log('PASS Cache mirror moods, event dwell, hit priority, hysteresis, pause purity and production readback-free cropped blur');
