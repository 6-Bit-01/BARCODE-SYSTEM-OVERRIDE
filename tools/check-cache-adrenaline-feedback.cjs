// Earned road receipts and the actual instrument painter share one clock.
// Native fixture pixels establish paint/state contracts, not device feel/FPS.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),copy=value=>JSON.parse(JSON.stringify(value));
const sources=['src/game/cache-road-adrenaline.js','src/game/cache-road-beat-feedback.js',
  'src/game/cache-road-instruments.js'];
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const sourceHashes=Object.fromEntries(sources.map(file=>[file,sha(fs.readFileSync(path.join(root,file)))]));
GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
const w={BARCODE:{}};const context=vm.createContext({window:w,console});
for(const file of sources)vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
const {CacheRoadAdrenaline:A,CacheRoadInstruments:I}=w.BARCODE;
const canvas=createCanvas(500,105),ctx=canvas.getContext('2d');
const paintText=[],fillText=ctx.fillText.bind(ctx);ctx.fillText=(value,...args)=>{paintText.push(String(value));fillText(value,...args);};
let commands=0;
for(const name of ['fillRect','strokeRect','lineTo','arc','stroke','fill']) {
  const native=ctx[name].bind(ctx);ctx[name]=(...args)=>{commands++;return native(...args);};
}
function earned(value,quality='perfect',action=2) {
  const adrenaline=A.create({value}),result=A.resolve(adrenaline,{id:`earned-${value}-${quality}`,result:quality,atMs:2000});
  return {elapsedMs:2000,adrenaline,beatFeedback:{kind:quality,action,lane:2,
    atMs:2000,expiresMs:3200,delta:result.delta,value:result.value,tier:result.tier,
    tierChanged:result.tierChanged,chain:adrenaline.chain}};
}
function paint(state,age,{reduced=false}={}) {
  state.elapsedMs=2000+age;ctx.reset();ctx.clearRect(0,0,canvas.width,canvas.height);
  paintText.length=0;commands=0;const before=JSON.stringify(state);
  I.drawAdrenaline(ctx,state,{x:25,y:16,reduced});
  assert.equal(JSON.stringify(state),before,'actual receipt paint cannot award, spend, advance or rewrite state');
  assert(commands<180,'meter payoff stays bounded to20 cells,2 thresholds and3 impact strokes');
  return {data:Buffer.from(ctx.getImageData(0,0,canvas.width,canvas.height).data),
    texts:[...paintText],commands,pose:copy(I.rewardPose(state,{reduced}))};
}
const state=earned(55),frames=[0,60,150,300,560,950].map(age=>({age,...paint(state,age)}));
assert(frames.every(frame=>frame.pose.paired),'real matching ground receipt pairs with the meter');
assert.equal(frames[0].pose.before,55);assert.equal(frames[0].pose.after,75);
assert.equal(frames[0].pose.head,.55);assert.equal(frames.at(-1).pose.head,.75);
for(let i=1;i<frames.length;i++)assert(frames[i].pose.head>=frames[i-1].pose.head,
  'the lead mark sweeps once from the actual previous charge to the actual earned charge');
assert(frames.every(frame=>frame.texts.includes('75')&&frame.texts.includes('+20')&&frame.texts.includes('RUSH')),
  'the numeric charge/tier/true gain are visible throughout the visual sweep');
assert(frames[0].pose.tierChanged,'the production55→75 gain genuinely crosses the Rush threshold');
assert.notEqual(sha(frames[0].data),sha(frames[3].data),'the positive impact has visible shared-clock progression');
assert.deepEqual(paint(state,300).data,paint(state,300).data,'paused simulation time yields identical native pixels');
const reducedA=paint(state,100,{reduced:true}),reducedB=paint(state,600,{reduced:true});
assert.deepEqual(reducedA.data,reducedB.data,'Reduced Motion holds a readable fixed receipt');
w.BARCODE_RENDER_QUALITY={flashes:false};
assert.deepEqual(paint(state,100).data,paint(state,600).data,'Flashes Off also holds the charge receipt steady');
w.BARCODE_RENDER_QUALITY={flashes:true};
assert(!paint(state,1200).texts.includes('+20'),'the receipt expires exactly on its existing1200ms clock');
const clamped=earned(95),clampedPaint=paint(clamped,160);
assert.equal(clampedPaint.pose.before,95);assert.equal(clampedPaint.pose.after,100);
assert(clampedPaint.texts.includes('+5')&&!clampedPaint.texts.includes('+20'),
  'a capped gain shows the actual5 charge rather than advertising unavailable20');
const full=earned(100),fullPaint=paint(full,160);
assert(fullPaint.texts.includes('MAX')&&!fullPaint.texts.some(value=>/^\+\d+$/.test(value)),
  'a perfect at full charge celebrates MAX without a false gain');
const good=earned(25,'good',2),goodPaint=paint(good,160);
assert.equal(goodPaint.pose.color,'#77ddff','a matching ground receipt shares its actual mapped action color');
assert(goodPaint.texts.includes('GOOD')&&goodPaint.texts.includes('CHAIN ×1'));
const spent=earned(55);A.spend(spent.adrenaline,'turbo',{atMs:2160});
const spendPaint=paint(spent,260);
assert.equal(spendPaint.pose.paired,false,'a spend rejects the stale positive ground receipt');
assert.equal(spendPaint.pose.earned,false);assert(spendPaint.texts.includes('-10')&&spendPaint.texts.includes('TURBO'));
const missed=earned(55);A.resolve(missed.adrenaline,{id:'miss-after-earned',result:'miss',atMs:2160});
const missPaint=paint(missed,260);assert.equal(missPaint.pose.paired,false);
assert.equal(missPaint.pose.earned,false);assert(missPaint.texts.includes('MISS'));
assert(!missPaint.texts.some(value=>/^[-+]\d+$/.test(value)),'grace miss paints no false charge loss');
const restored=earned(55);restored.adrenaline=A.restore(A.snapshot(restored.adrenaline));
const restoredPaint=paint(restored,0);assert(!restoredPaint.pose.paired&&!restoredPaint.pose.earned,
  'checkpoint resume cannot revive a prior earned receipt');
const output=process.argv[2]?path.resolve(process.argv[2]):null;
if(output) {
  assert(!output.startsWith(root+path.sep),'native review artifacts belong outside the source tree');fs.mkdirSync(output,{recursive:true});
  const sheet=createCanvas(1000,635),sc=sheet.getContext('2d');sc.fillStyle='#071521';sc.fillRect(0,0,sheet.width,sheet.height);
  const review=[...frames.map(frame=>({label:`PERFECT / ${frame.age}ms`,state:earned(55),age:frame.age})),
    {label:'QUIET / held receipt',state:earned(55),age:160,reduced:true},
    {label:'GOOD / mapped X / actual +15',state:earned(25,'good',2),age:160},
    {label:'CAPPED / actual +5',state:earned(95),age:160},
    {label:'FULL / MAX / no false gain',state:earned(100),age:160}];
  for(let i=0;i<review.length;i++) {
    const item=review[i],x=(i%2)*500,y=Math.floor(i/2)*124;
    sc.font='bold 14px Oxanium';sc.fillStyle='#c3dad1';sc.fillText(item.label,x+26,y+22);
    paint(item.state,item.age,{reduced:!!item.reduced});sc.drawImage(canvas,x,y+27);
  }
  fs.writeFileSync(path.join(output,'Cache-Adrenaline-Earned-Sequence.webp'),sheet.toBuffer('image/webp',95));
  fs.writeFileSync(path.join(output,'adrenaline-feedback-native-evidence.json'),JSON.stringify({
    kind:'native-production-adrenaline-feedback',sourceHashes,gain:{before:55,after:75,delta:20},
    frameAges:frames.map(frame=>frame.age),quietSteady:true,paintPure:true,maxPaintCommands:Math.max(...frames.map(frame=>frame.commands)),
    limits:'Real production economy, ground receipt pose and native meter painter over staged receipts. No device FPS, human feel, browser or listening acceptance is claimed.'},null,2)+'\n');
}
for(const [file,hash] of Object.entries(sourceHashes))assert.equal(sha(fs.readFileSync(path.join(root,file))),hash,
  `source changed during native review: ${file}`);
console.log(JSON.stringify({gate:'adrenaline-earned-feedback',passed:true,receiptPaired:true,
  actualChargeAlwaysVisible:true,clampedGain:5,fullChargeReceipt:'MAX',quietSteady:true,pausedPixels:true,
  staleSpendMissResumeRejected:true,maxPaintCommands:Math.max(...frames.map(frame=>frame.commands)),output}));
