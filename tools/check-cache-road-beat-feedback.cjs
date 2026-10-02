// Native ground paint over real resolved song opportunities. Timing fixtures
// isolate presentation; they are not device FPS or player-acceptance evidence.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const {rig,pressAt}=require('./check-cache-drive-feedback.cjs');
const {load}=require('./check-level-01-boss');
const root=path.resolve(__dirname,'..');process.chdir(root);
const copy=value=>JSON.parse(JSON.stringify(value));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const sources=['src/game/cache-road-beat-feedback.js','src/game/cache-road-guidance.js',
  'src/game/cache-road-adrenaline.js','src/game/cache-road-proof.js','tools/check-cache-road-beat-feedback.cjs'];
const sourceHashes=Object.fromEntries(sources.map(file=>[file,hash(fs.readFileSync(file))]));
GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
function prepared(value=25) {
  const r=rig();load(r.context,'src/game/cache-road-adrenaline.js');
  load(r.context,'src/game/cache-road-beat-feedback.js');
  r.road.state.adrenaline=r.B.CacheRoadAdrenaline.create({value});
  return r;
}
const r=prepared(),H=r.B.CacheRoadBeatFeedback;
assert(pressAt(r,-69).accepted);assert.equal(r.road.state.beatFeedback,null,
  'an early accepted tap cannot start earned ground/meter paint before ONE');
assert.equal(r.road.state.adrenaline.value,25);
r.tick(r.pulse.target);const perfect=copy(r.road.state.beatFeedback),at=r.road.state.elapsedMs;
assert.deepEqual({quality:perfect.kind,delta:perfect.delta,value:perfect.value,chain:perfect.chain},
  {quality:'perfect',delta:20,value:45,chain:1});
assert.equal(perfect.pulseId,r.pulse.id);assert.equal(perfect.atMs,r.road.state.adrenaline.lastAtMs);
assert.equal(perfect.tier,'charged');assert(perfect.tierChanged);
assert.equal(r.road.catchPulse('road_a',r.pulse.target*60/128),false);
assert.deepEqual(copy(r.road.state.beatFeedback),perfect,'a rejected duplicate cannot restart the impact');
const g=prepared();assert(pressAt(g,150).accepted);
assert.equal(g.road.state.beatFeedback.kind,'good');assert.equal(g.road.state.beatFeedback.delta,15);
const capped=prepared(95);assert(pressAt(capped,0).accepted);
assert.equal(capped.road.state.beatFeedback.delta,5,'the receipt shows the actual capped gain');
assert.equal(capped.road.state.beatFeedback.value,100);
const miss=prepared(60);miss.tick(miss.pulse.target+.5);
assert.equal(miss.road.state.beatFeedback.kind,'miss');assert.equal(miss.road.state.beatFeedback.delta,0,
  'first-miss grace never invents an adrenaline penalty');
const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),texts=[],paintTexts=[];
const rawText=ctx.fillText.bind(ctx);ctx.fillText=(value,...args)=>{
  texts.push(String(value));paintTexts.push({value:String(value),x:args[0],y:args[1],
    width:Math.min(args[2]??Infinity,ctx.measureText(String(value)).width),
    size:Number(ctx.font.match(/([\d.]+)px/)?.[1]||12)});
  return rawText(value,...args);
};
const counters={paths:0,vertices:0,arcs:0};
for(const [name,key] of [['beginPath','paths'],['lineTo','vertices'],['arc','arcs']]) {
  const native=ctx[name].bind(ctx);ctx[name]=(...args)=>{counters[key]++;return native(...args);};
}
// This is the actual road projection at a straight presentation fixture.
const strikeDepth=Math.sqrt(.83*.83-119*.14/680),strikeY=400+strikeDepth*strikeDepth*680;
const projection={strikeDepth,strikeY,strikeDistance:(1-strikeDepth)*520-80,
  depth:d=>Math.max(0,Math.min(1.65,1-(d+80)/520)),roadY:t=>400+t*t*680,
  laneEdge:(lane,t)=>960-(82+534*t)+lane*(82+534*t)/2,
  laneX:(lane,t)=>960-(82+534*t)+(lane+.5)*(82+534*t)/2};
function draw(receipt,age,{reduced=false,flashes=true}={}) {
  ctx.reset();ctx.clearRect(0,0,1920,1080);texts.length=0;
  for(const key of Object.keys(counters))counters[key]=0;
  r.w.BARCODE_RENDER_QUALITY={flashes};
  const s={...r.road.state,beatFeedback:copy(receipt),elapsedMs:receipt.atMs+age},before=JSON.stringify(s);
  assert(H.drawReceipt(ctx,s,{projection,reduced,road:r.road}));
  assert.equal(JSON.stringify(s),before,'ground animation cannot advance/spend/reward any state');
  assert.equal(ctx.filter,'none');assert.equal(ctx.shadowBlur,0);
  assert(counters.paths<=20&&counters.vertices<=75&&counters.arcs<=2,
    'a maximum perfect impact remains bounded to small native geometry');
  return {data:Buffer.from(ctx.getImageData(0,0,1920,1080).data),texts:[...texts],counters:copy(counters)};
}
const p80=draw(perfect,80),p360=draw(perfect,360),good=draw(g.road.state.beatFeedback,80);
assert(p80.texts.includes('PERFECT'));assert(p80.texts.includes('+20 ADRENALINE'));
assert(good.texts.includes('ON BEAT'));assert(good.texts.includes('+15 ADRENALINE'));
assert.notEqual(hash(p80.data),hash(p360.data),'impact resolves into a sustained receipt on the shared clock');
assert.notEqual(hash(p80.data),hash(good.data),'good and perfect have distinct visible landings');
assert.deepEqual(p80.data,draw(perfect,80).data,'paused/repeated time has identical production pixels');
assert.deepEqual(draw(perfect,100,{reduced:true}).data,draw(perfect,600,{reduced:true}).data,
  'Reduced Motion retains readable fixed success paint');
assert.deepEqual(draw(perfect,100,{flashes:false}).data,draw(perfect,600,{flashes:false}).data,
  'Flashes Off also retains a steady bounded receipt');
assert(draw(capped.road.state.beatFeedback,80).texts.includes('+5 ADRENALINE'));
const missed=draw(miss.road.state.beatFeedback,80);assert(missed.texts.includes('MISSED'));
assert(missed.texts.includes('NEXT ONE'));assert.equal(missed.counters.arcs,0);
// Each road action keeps its actual preferred keyboard/controller label,
// and the four painted badge silhouettes remain visibly distinguishable.
const originalInput=r.w.inputManager,originalUI=r.B.GamepadUI,originalSettings=r.B.ControllerSettings;
r.w.inputManager={actionInput:{keyboardBindings:{road_a:['z'],road_b:['x'],road_x:['c'],road_y:['n']}}};
const labelCases=[['remapped-keyboard',false,['Z','X','C','N']],
  ['xbox',true,['A','B','X','Y']],['playstation',true,['✕','○','□','△']]];
const badgePixels=[];
for(const [family,connected,expected] of labelCases) {
  r.B.GamepadUI={connected};r.B.ControllerSettings={button:index=>expected[index]};
  assert.deepEqual(Array.from({length:4},(_,index)=>r.B.CacheRoadGuidance.label(index,r.road)),expected,
    `${family} reads every actual preference-mapped face action`);
  const hashes=[];
  for(let action=0;action<4;action++) {
    ctx.reset();ctx.clearRect(0,0,1920,1080);texts.length=0;
    const state={...r.road.state,beatFeedback:null,lanePos:1},pulse={...r.pulse,lane:1,action};
    H.drawTarget(ctx,state,{nextPulse:pulse,nextCue:{ready:true,window:true,charge:1,count:1},
      projection,reduced:true,road:{...r.road,state}});
    H.drawPad(ctx,state,pulse,{d:30,ready:true,window:true,charge:1,remaining:0},
      {projection,reduced:true,road:{...r.road,state}});
    hashes.push(hash(ctx.getImageData(0,0,1920,1080).data));
    if(family!=='playstation')assert(texts.includes(expected[action]));
  }
  assert.equal(new Set(hashes).size,4,`${family} has four distinct native road symbols`);
  badgePixels.push({family,distinct:4});
}
r.w.inputManager=originalInput;r.B.GamepadUI=originalUI;r.B.ControllerSettings=originalSettings;
// Sample the actual native final countdown socket, using the production cue
// pose for a preceding bar's ONE and this pad's true acceptance window.
function countdownFrame(beat) {
  ctx.reset();ctx.clearRect(0,0,1920,1080);texts.length=0;r.w.BARCODE_RENDER_QUALITY={flashes:true};
  const state={...r.road.state,beatFeedback:null,lanePos:r.pulse.lane,musicBeatFloat:beat};
  const cue=r.inspect.pulseVisual(r.pulse,state),before=JSON.stringify(state);
  assert(cue.ready);H.drawTarget(ctx,state,{nextPulse:r.pulse,nextCue:cue,
    projection,reduced:true,road:{...r.road,state}});
  assert.equal(JSON.stringify(state),before);
  const x=projection.laneX(r.pulse.lane,projection.strikeDepth);
  return {cue,texts:[...texts],socket(index) {
    return Array.from(ctx.getImageData(Math.round(x+(index-1.5)*35+8),
      Math.round(projection.strikeY+28),1,1).data);
  }};
}
const precedingONE=countdownFrame(r.pulse.target-3.7);
assert.equal(precedingONE.cue.count,1);assert.equal(precedingONE.cue.window,false);
assert(precedingONE.texts.includes('ON ONE'));assert(!precedingONE.texts.includes('PRESS'));
assert.deepEqual(precedingONE.socket(3),[24,52,64,255],
  'the preceding bar ONE leaves the final destination socket dark in actual native paint');
for(const [remaining,index] of [[3,0],[2,1],[1,2]]) {
  const countdown=countdownFrame(r.pulse.target-remaining);
  assert.notDeepEqual(countdown.socket(index),[24,52,64,255],
    'each actual preceding 2/3/4 countdown still selects its colored socket');
  assert.deepEqual(countdown.socket(3),[24,52,64,255]);
}
const actualONE=countdownFrame(r.pulse.target);
assert(actualONE.cue.window);assert(actualONE.texts.includes('PRESS'));
assert.deepEqual(actualONE.socket(3),[244,255,220,255],
  'only the actual accepted pad window lights the final ONE socket in paper ink');
// A fresh-v4 production chart can announce another pad on the next 128 BPM
// bar, including the same lane. Real road updates commit both addresses;
// the previous pad is actually judged/awarded, never supplied as a fake win.
function consecutiveRig(sameLane,offsetMs) {
  const c=prepared();load(c.context,'src/game/cache-road-combat.js');
  c.B.CacheChapter={recordIds:['r1','r2','r3','r4']};c.road.chapter.encounterVersion=4;
  c.road.state=c.inspect.newState();assert(c.road.configureEncounters());
  c.road.selectMusicProfile();c.B.MusicTransport.start({sourceAnchorAudioSec:0,sourceOffsetTrackSec:0});
  for(let bar=0;bar<90;bar++) {
    c.tick(bar*4);
    const prior=c.road.pulses().find(pulse=>pulse.target===bar*4);
    const next=c.road.pulses().find(pulse=>pulse.target===bar*4+4);
    if(!prior||!next||(prior.lane===next.lane)!==sameLane)continue;
    c.tick(prior.target+offsetMs/(60/128*1000));
    // Isolate this timing fixture's physical lane as the original focused
    // judgment gate does. Chart, deadline, gain and receipt stay production.
    c.road.state.lane=c.road.state.lanePos=prior.lane;
    const pressTime=prior.target*60/128+offsetMs/1000;
    assert(c.road.catchPulse(['road_a','road_b','road_x','road_y'][prior.action],pressTime,pressTime));
    const earned=copy(c.road.state.beatFeedback);
    assert.equal(earned.pulseId,prior.id);assert.equal(earned.kind,offsetMs===0?'perfect':'good');
    assert.equal(earned.delta,c.road.state.adrenaline.lastDelta);
    assert.equal(next.target-prior.target,4);assert.equal(4*60/128*1000,1875);
    return {c,prior,next,earned,pressBeat:prior.target+offsetMs/(60/128*1000)};
  }
  assert.fail('Actual current-v4 chart must contain this consecutive-lane fixture');
}
const consecutive=[];
function compareNextTarget(fixture,{age,reduced=false,flashes=true,windowLane=null}={}) {
  const {c,next,earned}=fixture,helper=c.B.CacheRoadBeatFeedback;
  c.w.BARCODE_RENDER_QUALITY={flashes};let productionFrame=null;
  c.B.CacheRoadBeatFeedback={...helper,drawTarget(drawCtx,state,args) {
    productionFrame=args;return helper.drawTarget(drawCtx,state,args);
  }};
  ctx.reset();const beforeProduction=JSON.stringify(c.road.state);c.road.draw(ctx);
  assert.equal(JSON.stringify(c.road.state),beforeProduction);
  c.B.CacheRoadBeatFeedback=helper;
  assert.equal(productionFrame.nextPulse.id,next.id,'real road rendering selects the consecutive next pad');
  assert(productionFrame.nextCue.ready);
  const state=windowLane===null?c.road.state:{...c.road.state,lanePos:windowLane,musicBeatFloat:next.target};
  const cue=windowLane===null?productionFrame.nextCue:c.inspect.pulseVisual(next,state);
  const p=productionFrame.projection,x=p.laneX(next.lane,p.strikeDepth);
  const args={nextPulse:next,nextCue:cue,projection:p,reduced,road:c.road};
  ctx.reset();ctx.clearRect(0,0,1920,1080);texts.length=0;paintTexts.length=0;
  helper.drawTarget(ctx,{...state,beatFeedback:null},args);
  const expectedTexts=[...texts],instruction=paintTexts.find(item=>['PRESS','CHANGE LANE','ON ONE'].includes(item.value));
  assert(instruction);const halfWidth=Math.max(72,Math.ceil(instruction.width/2)+3);
  const rect={x:Math.floor(x-halfWidth),y:Math.floor(p.strikeY+13),w:halfWidth*2+1,h:136};
  const reference=Buffer.from(ctx.getImageData(rect.x,rect.y,rect.w,rect.h).data);
  ctx.reset();ctx.clearRect(0,0,1920,1080);texts.length=0;paintTexts.length=0;
  const untouched=JSON.stringify(state);helper.drawTarget(ctx,state,args);
  const targetTexts=[...texts],targetPixels=Buffer.from(ctx.getImageData(rect.x,rect.y,rect.w,rect.h).data);
  assert.deepEqual(targetTexts,expectedTexts,'earned success never suppresses any next mapped label/countdown/instruction');
  assert.deepEqual(targetPixels,reference,'earned paint never changes the next target timing ink');
  assert(helper.drawReceipt(ctx,state,args));
  assert.deepEqual(Buffer.from(ctx.getImageData(rect.x,rect.y,rect.w,rect.h).data),reference,
    'same-lane compact ticket and adjacent-lane impact leave the entire measured next target untouched');
  assert.equal(JSON.stringify(state),untouched);
  assert(texts.includes(earned.kind==='perfect'?'PERFECT':'ON BEAT'));
  assert(texts.includes(next.lane===earned.lane?`+${earned.delta}`:`+${earned.delta} ADRENALINE`));
  if(windowLane!==null)assert(targetTexts.includes(windowLane===next.lane?'PRESS':'CHANGE LANE'));
  consecutive.push({sameLane:next.lane===earned.lane,quality:earned.kind,age,reduced,flashes,
    priorId:fixture.prior.id,nextId:next.id,instruction:instruction.value,
    measuredInstructionWidth:instruction.width,protectedHalfWidth:halfWidth});
}
for(const [sameLane,offsetMs] of [[false,150],[true,0]]) {
  const fixture=consecutiveRig(sameLane,offsetMs),{c,earned}=fixture;
  for(const age of [0,400,1000]) {
    while(c.road.state.elapsedMs-earned.atMs<age)
      c.tick(fixture.pressBeat+(c.road.state.elapsedMs-earned.atMs+20)/(60/128*1000));
    assert.equal(c.road.state.elapsedMs-earned.atMs,age);
    for(const options of [{reduced:false,flashes:true},{reduced:true,flashes:true},{reduced:false,flashes:false}])
      compareNextTarget(fixture,{age,...options});
  }
  // Explicit presentation stress cases use the real next address while
  // holding the earned receipt age. They cover the widest instruction ink,
  // including a required lane change and the in-lane accepted PRESS cue.
  for(const lanePos of [(fixture.next.lane+1)%4,fixture.next.lane])
    compareNextTarget(fixture,{age:1000,reduced:false,windowLane:lanePos});
}
assert.equal(H.feedbackPose({...r.road.state,elapsedMs:at+1200}),null,'the receipt expires once at1200ms');
// Drawing restores the exact inherited transform and opacity, including a
// parent cinematic HUD fade on the existing main context.
ctx.reset();ctx.translate(11,17);ctx.globalAlpha=.37;ctx.lineWidth=7;
const parent={matrix:copy(ctx.getTransform()),alpha:ctx.globalAlpha,lineWidth:ctx.lineWidth};
H.drawReceipt(ctx,{...r.road.state,elapsedMs:at+80},{projection,road:r.road});
assert.deepEqual({matrix:copy(ctx.getTransform()),alpha:ctx.globalAlpha,lineWidth:ctx.lineWidth},parent);
// The real road draw dispatches all three production paint stages and does
// not mutate any physical position, song address or reward data.
const used={target:0,pad:0,receipt:0};r.B.CacheRoadBeatFeedback={...H};
for(const [name,key] of [['drawTarget','target'],['drawPad','pad'],['drawReceipt','receipt']])
  r.B.CacheRoadBeatFeedback[name]=(...args)=>{used[key]++;return H[name](...args);};
ctx.reset();const snapshot=JSON.stringify(r.road.state);r.road.draw(ctx);
assert.equal(JSON.stringify(r.road.state),snapshot);assert(used.target&&used.pad&&used.receipt);
const outArg=process.argv.find(arg=>arg.startsWith('--output='));
if(outArg) {
  const out=path.resolve(outArg.slice(9));assert(!out.startsWith(root+path.sep));fs.mkdirSync(out,{recursive:true});
  const sheet=createCanvas(1440,960),sc=sheet.getContext('2d');sc.fillStyle='#10202d';sc.fillRect(0,0,1440,960);
  const fixtures=[['Perfect-Impact',perfect,80,{}],['Perfect-Sustain',perfect,360,{}],
    ['Good',g.road.state.beatFeedback,80,{}],['Capped-Gain',capped.road.state.beatFeedback,80,{}],
    ['Miss',miss.road.state.beatFeedback,80,{}],['Quiet',perfect,360,{reduced:true}]];
  for(let i=0;i<fixtures.length;i++) {
    const [name,receipt,age,options]=fixtures[i];draw(receipt,age,options);
    // Tight crop keeps the actual native road-plane response readable.
    const x=i%2*720,y=Math.floor(i/2)*320;
    sc.fillStyle='#dbf4df';sc.font='18px Oxanium';sc.fillText(name,x+18,y+25);
    sc.drawImage(canvas,350,755,1250,305,x,y+40,720,176);
    fs.writeFileSync(path.join(out,name+'.png'),canvas.toBuffer('image/png'));
  }
  fs.writeFileSync(path.join(out,'Ground-Feedback.png'),sheet.toBuffer('image/png'));
  const roadCanvas=createCanvas(1920,1080),rc=roadCanvas.getContext('2d');
  const roadBefore=JSON.stringify(r.road.state);r.road.draw(rc);assert.equal(JSON.stringify(r.road.state),roadBefore);
  fs.writeFileSync(path.join(out,'Production-Road.png'),roadCanvas.toBuffer('image/png'));
  fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify({passed:true,sourceHashes,
    labels:p80.texts,perfectWork:p80.counters,goodWork:good.counters,missWork:missed.counters,
    badgePixels,consecutive,precedingONEQuiet:true,trueONEPress:true,used,limits:'Native presentation fixtures on actual earned production pad receipts; controlled host and staged review time. Consecutive current-v4 chart updates and judgments are production, with physical lanes isolated; accepted-window overlap cases additionally hold receipt age as a presentation stress fixture. No human, physical-controller, browser or device frame-pacing acceptance.'},null,2)+'\n');
}
for(const [file,digest] of Object.entries(sourceHashes))assert.equal(hash(fs.readFileSync(file)),digest);
console.log(JSON.stringify({gate:'cache-road-ground-beat-feedback',passed:true,
  earnedEarlyOnONE:true,actualCappedGain:true,duplicateReceiptStable:true,distinctJudgments:true,
  quietStable:true,pausedStable:true,precedingONEQuiet:true,trueONEPress:true,
  consecutiveNextCueFrames:consecutive.length,mappedBadges:badgePixels,
  realRoadDispatch:used,perfectWork:p80.counters}));
