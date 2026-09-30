// Dashboard values and presentation through the production Cache Road draw.
// Recorded Canvas calls verify semantics and bounded work, not visual quality.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {createRig,load}=require('./check-level-01-boss');
const {w,context}=createRig(),B=w.BARCODE;
B.Campaign={register(){},syncTitleButton(){}};
load(context,'src/engine/cache-road-proof-profile.js');
load(context,'src/game/cache-road-landscape.js');
load(context,'src/game/cache-road-guidance.js');
const marker='  B.Campaign.register(ID,';
const actionMarker='      const iconScale=padReady&&inPadLane&&!reduced?1+.28*nextCue.charge:1;';
const source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
assert(source.includes(marker),'the production registration hook exists');
assert(source.includes(actionMarker),'the production action-readout hook exists');
vm.runInContext(source.replace(actionMarker,actionMarker+`
      window.dashboardAction={previewPulse,nextPulse,nextCue,padVisible:!!padVisible,
        padReady:!!padReady,inPadLane:!!inPadLane,pressNow:!!pressNow,
        showingCatch,iconScale,nextButton};
`).replace(marker,`
  window.dashboardReview={newState,dashboardReadout,PULSES,pulseVisual,PULSE_ACTIONS};
  window.dashboardCalls=[];window.dashboardReadouts=[];window.dashboardDepth=0;
  const reviewReadout=dashboardReadout;
  dashboardReadout=function(s) {
    const result=reviewReadout(s);window.dashboardReadouts.push(result);return result;
  };
  const reviewDigits=hudDigits,reviewIcon=hudIcon,reviewSegments=hudSegments;
  const reviewBezel=dashboardBezel;
  const reviewCall=(kind,fn,args)=>{
    window.dashboardCalls.push({kind,args:args.slice(1)});window.dashboardDepth++;
    try{return fn(...args);}finally{window.dashboardDepth--;}
  };
  hudDigits=(...args)=>reviewCall('digits',reviewDigits,args);
  hudIcon=(...args)=>reviewCall('icon',reviewIcon,args);
  hudSegments=(...args)=>reviewCall('segments',reviewSegments,args);
  dashboardBezel=(...args)=>reviewCall('bezel',reviewBezel,args);
`+marker),context,{filename:'cache-road-proof.js [dashboard inspection]'});
const D=w.dashboardReview,road=B.CacheRoadProof;
const copy=value=>JSON.parse(JSON.stringify(value));
const make=overrides=>Object.assign(D.newState({progress:1200,musicBar:12}),overrides);
const read=overrides=>copy(D.dashboardReadout(make(overrides)));

// Speed is the existing fictional km/h scale converted to miles per hour.
for(const [speed,mph] of [[0,0],[36,116],[54,174],[61,197],[-5,0]])
  assert.equal(read({speed}).mph,mph,`speed ${speed} displays the converted MPH`);
assert.equal(read({speed:100*1.609344/5.2}).mph,100);
for(const gear of [0,1,2]) {
  assert.equal(read({gear}).gear,gear+1);
  assert.equal(read({gear}).queuedGear,null);
}
const shifting=make({gear:2,pendingGear:0,pendingGearBeat:52});
const beforeShift=copy(shifting),queued=D.dashboardReadout(shifting);
assert.equal(queued.gear,3,'a queued downshift does not replace the current gear');
assert.equal(queued.queuedGear,1,'zero-based first gear remains a visible queued gear');
assert.deepEqual(copy(shifting),beforeShift,'readout does not apply a queued shift');
for(const [timeMs,clock,lowTime] of [[55000,'00:55',false],
  [59999,'01:00',false],[8000,'00:08',false],[7999,'00:08',true],
  [1,'00:01',true],[0,'00:00',true],[-1,'00:00',true],
  [6000000,'99:59',false]]) {
  const value=read({timeMs});
  assert.equal(value.clock,clock);assert.equal(value.lowTime,lowTime);
}
for(const [integrity,expected] of [[-1,0],[0,0],[1,1],[2,2],[3,3],[4,3]])
  assert.equal(read({integrity}).integrity,expected);
const turboCases=[
  [{queuedTurbo:true,boostMs:900,boost:1},'queued',1],
  [{boostMs:900,boost:1},'active',1],
  [{boost:1,draftMs:300},'ready',1],
  [{boost:0,draftMs:300},'draft',.5],
  [{boost:0,draftMs:800},'draft',1],
  [{boost:0,nearMisses:1},'charge',.5],
  [{boost:0,nearMisses:0},'charge',0]
];
for(const [state,mode,value] of turboCases) {
  const actual=read(state);assert.equal(actual.turboMode,mode);
  assert.equal(actual.turboValue,value);
}
const echo={lanePos:0,ageMs:1000,durationMs:4000,path:[],sampleIndex:0,sampleMs:0};
for(const [state,mode,value] of [[{echoEnergy:25},'charge',.25],
  [{echoEnergy:100},'ready',1],[{echoEnergy:120},'ready',1],
  [{echo,echoEnergy:0},'active',.75]]) {
  const actual=read(state);assert.equal(actual.echoMode,mode);
  assert.equal(actual.echoValue,value);
}
B.GamepadUI={connected:false};
B.ControllerSettings={button:index=>({4:'LB',5:'RB'})[index]};
assert.equal(read({}).turboButton,'SPACE');assert.equal(read({}).echoButton,'H');
B.GamepadUI.connected=true;
assert.equal(read({}).turboButton,'LB');assert.equal(read({}).echoButton,'RB');
B.ControllerSettings.button=()=>undefined;
assert.equal(read({}).turboButton,'SPACE');assert.equal(read({}).echoButton,'H');
B.GamepadUI.connected=false;

let text=[],assets=[],rects=[],actionAssets=[],helperOperations=0,dashboardArtReady=true;
const stack=[],gradient={addColorStop(){}};
const ctx=new Proxy({canvas:{width:1920,height:1080},globalAlpha:1,filter:'none',
  save(){stack.push({filter:this.filter,globalAlpha:this.globalAlpha,
    fillStyle:this.fillStyle,textAlign:this.textAlign,font:this.font});},
  restore(){assert(stack.length,'Canvas restore has a matching save');Object.assign(this,stack.pop());},
  createLinearGradient(){return gradient;},createRadialGradient(){return gradient;},
  measureText(value){return {width:String(value).length*10};},
  fillRect(x,y,width,height){if(y<=164)rects.push({x,y,width,height,color:this.fillStyle});},
  fillText(value,x,y,maxWidth){text.push({text:String(value),x,y,maxWidth,
    color:this.fillStyle,filter:this.filter});}
},{get(target,key){
  const value=key in target?target[key]:()=>{};
  if(typeof value!=='function')return value;
  return function(...args){if(w.dashboardDepth)helperOperations++;return value.apply(this,args);};
}});
B.PresentationAssets={ready:()=>true,draw(key,target,args={}) {
  if(key.startsWith('cachePulse')&&args.x>=1338&&args.y<=164)
    actionAssets.push({key,...copy(args)});
  if(key.startsWith('cacheDash')) {
    for(const name of ['x','y','width','height'])assert(Number.isFinite(args[name]),`${key} ${name} is finite`);
    assert(args.width>0&&args.height>0,'dashboard art has a positive extent');
    assert(!args.sourceRect||args.sourceRect.every(Number.isFinite));
    assets.push({key,...copy(args)});
  }
  return key.startsWith('cacheDash')?dashboardArtReady:true;
}};
B.Preferences??={values:{}};B.Preferences.values??={};
road.active=true;road.status='playing';road.audioDegraded=false;
let draws=0,maxOperations=0,maxSubmissions=0;
function render(overrides={},reduced=false) {
  road.state=make(overrides);B.Preferences.values.reducedMotion=reduced;
  const before=copy(road.state);text=[];assets=[];rects=[];actionAssets=[];helperOperations=0;
  w.dashboardCalls.length=0;w.dashboardReadouts.length=0;
  road.draw(ctx);draws++;
  assert.deepEqual(copy(road.state),before,'a production dashboard draw does not mutate gameplay');
  assert.equal(stack.length,0,'production draw restores Canvas scopes');
  assert.equal(w.dashboardReadouts.length,1,'the production HUD consumes one readout');
  assert(w.dashboardCalls.some(call=>call.kind==='digits'),'production HUD paints atlas digits');
  assert(helperOperations<600,'dashboard helper work stays bounded independently of world length');
  assert(assets.length<100,'the static dashboard uses a bounded number of image submissions');
  maxOperations=Math.max(maxOperations,helperOperations);
  maxSubmissions=Math.max(maxSubmissions,assets.length);
  return {model:copy(w.dashboardReadouts[0]),calls:copy(w.dashboardCalls),
    action:copy(w.dashboardAction),rects:copy(rects),actionAssets:copy(actionAssets),
    text:copy(text.filter(item=>item.y<=164&&item.filter!=='blur(2.3px)')),
    assets:copy(assets)};
}
const normal=render({speed:54,gear:2,pendingGear:0});
assert.equal(normal.model.mph,174);assert.equal(normal.model.gear,3);
assert.equal(normal.model.queuedGear,1);
assert(normal.calls.some(call=>call.kind==='digits'&&String(call.args[0])==='174'));
assert(normal.calls.some(call=>call.kind==='digits'&&String(call.args[0])==='00:55'));
assert(normal.text.some(item=>item.text==='MPH'),'the rendered speed unit is MPH');
assert(!normal.text.some(item=>/KM\/H/.test(item.text)),'the old km/h label is absent');
assert(normal.rects.some(rect=>rect.x===0&&rect.y===0&&rect.width===1920&&rect.height===164),
  'the dashboard retains the 164-pixel top mask');
for(const [state,mode,value] of turboCases) {
  const frame=render(state);assert.equal(frame.model.turboMode,mode);
  assert(frame.calls.some(call=>call.kind==='segments'&&call.args[0]===1392&&
    call.args[3]===8&&call.args[4]===value),'the rendered Turbo gauge reports the actual readiness');
}
for(const integrity of [0,1,2,3]) {
  const frame=render({integrity});assert.equal(frame.model.integrity,integrity);
  const lamps=frame.rects.filter(rect=>rect.y===68&&rect.width===16&&rect.height===36);
  assert.equal(lamps.length,3,'the production cluster always draws three integrity lamps');
  assert.equal(lamps.filter(lamp=>lamp.color!=='#19343b').length,integrity,
    'only remaining integrity lamps are lit');
}
const lowTime=render({timeMs:7999});assert.equal(lowTime.model.lowTime,true);
assert(lowTime.calls.some(call=>call.kind==='digits'&&call.args[0]==='00:08'&&call.args[4]===2),
  'low time uses the warning row of the actual digit atlas');
const activeEcho=render({echo,echoEnergy:0});assert.equal(activeEcho.model.echoMode,'active');
assert(activeEcho.calls.some(call=>call.kind==='segments'&&call.args[0]===1628&&
  call.args[4]===.75),'the active Echo gauge reports remaining Echo duration');

// Commit one real authored action to a known downbeat. No input or update
// is simulated here: the HUD must describe the unchanged musical target.
const pulse=D.PULSES[0],progress=pulse.at-120;
const announced={progress,lane:pulse.lane,lanePos:pulse.lane,visualLane:pulse.lane,
  musicBeatFloat:29,musicBar:7,pulseTargets:{[pulse.id]:32},
  pulsePlaces:{[pulse.id]:progress+80}};
const preview=render({progress,musicBeatFloat:28,musicBar:7});
assert(preview.action.previewPulse,'an uncommitted future action is previewed');
assert(!preview.action.nextCue&&!preview.action.pressNow,
  'previewing an action does not invent a committed strike deadline');
const early=render({...announced,musicBeatFloat:27});
assert(!early.action.padReady&&!early.action.pressNow);
assert.equal(early.action.nextCue.remaining,5);
for(const [beat,count] of [[29,2],[30,3],[31,4]]) {
  const frame=render({...announced,musicBeatFloat:beat});
  assert.equal(frame.action.nextCue.count,count);
  assert(frame.action.padReady&&!frame.action.pressNow,
    'the lead-in never tells the driver to press on beat four');
  assert(frame.text.some(item=>/BEAT 1|HIT ON 1/.test(item.text)),
    'the visible lead-in identifies beat ONE');
}
assert(render({...announced,musicBeatFloat:31.85}).action.pressNow,
  'the accepted early half of the judgment window shows the press cue');
assert(!render({...announced,musicBeatFloat:31.6}).action.pressNow,
  'a tap before the accepted early window is not visually invited');
for(const beat of [32,32.2]) {
  const frame=render({...announced,musicBeatFloat:beat});
  assert(frame.action.pressNow&&frame.action.nextCue.count===1);
  assert(frame.text.some(item=>/PRESS/.test(item.text)),'beat ONE has a visible press cue');
}
assert(!render({...announced,musicBeatFloat:32.4}).action.pressNow,
  'the press cue expires after the 130 ms judgment window');
const wrongLane=render({...announced,musicBeatFloat:32,lanePos:(pulse.lane+1)%4});
assert(!wrongLane.action.pressNow);
assert(wrongLane.text.some(item=>/ENTER LANE/.test(item.text)));
const caught=render({...announced,musicBeatFloat:32,pulseFlashMs:410,
  pulseFlashAction:pulse.action,pulseFlashLane:pulse.lane,pulseTiming:'PERFECT',pulseCombo:2});
assert(caught.action.showingCatch);
assert(caught.text.some(item=>/CAPTURED|PERFECT/.test(item.text)));
assert(caught.text.some(item=>/\+16B\b/.test(item.text)),'a chained catch reports its actual duration');
B.GamepadUI.connected=true;
B.ControllerSettings.button=index=>({4:'LB',5:'RB'})[index]||`FACE${index}`;
const controller=render(announced),face=D.PULSE_ACTIONS[pulse.action];
assert.equal(controller.action.nextButton,`FACE${face.button}`);
for(const label of ['LB','RB',`FACE${face.button}`])
  assert(controller.text.some(item=>item.text===label),`${label} is actually painted`);
B.ControllerSettings.button=()=>undefined;
const missingMapping=render(announced);
for(const label of ['SPACE','H',face.keyboard])
  assert(missingMapping.text.some(item=>item.text===label),`${label} remains readable without a controller mapping`);
B.GamepadUI.connected=false;

// Reduced Motion holds decorative action growth/cels while keeping the
// live warning, numeric values and beat-ONE guidance available.
const reducedA=render({...announced,musicBeatFloat:31.8,elapsedMs:0},true);
const reducedB=render({...announced,musicBeatFloat:31.8,elapsedMs:1800},true);
assert.equal(reducedA.action.iconScale,1);assert.equal(reducedB.action.iconScale,1);
assert.deepEqual(reducedA.calls,reducedB.calls,'Reduced Motion does not advance dashboard glyphs or gauges');
assert.deepEqual(reducedA.assets,reducedB.assets,'static dashboard image submissions do not animate');
assert.deepEqual(reducedA.actionAssets,reducedB.actionAssets,'Reduced Motion holds the displayed action cel');
assert(render({...announced,musicBeatFloat:32},true).action.pressNow,
  'Reduced Motion retains state-driven strike guidance');
const reducedCatch=render({...announced,pulseFlashMs:410,pulseFlashAction:pulse.action},true);
assert(reducedCatch.actionAssets.some(asset=>asset.key!=='cachePulseBurst'&&asset.frame===0));
assert(!reducedCatch.actionAssets.some(asset=>asset.key==='cachePulseBurst'),
  'Reduced Motion suppresses the decorative catch burst');

const phrase={lane:1,startBeat:32,endBeat:64,order:0};
const lanes=render({musicBeatFloat:52.2,captures:[phrase],queuedCaptures:[{...phrase,lane:2,startBeat:56}]});
assert(lanes.calls.some(call=>call.kind==='digits'&&call.args[0]===3&&call.args[3]===20),
  'lane expiry rounds remaining musical bars upward');
assert(lanes.text.some(item=>/NEXT/.test(item.text)),'a queued lane capture remains distinct');
const refreshing=render({musicBeatFloat:52.2,captures:[phrase],
  queuedCaptures:[{...phrase,startBeat:56,endBeat:88}]});
assert(refreshing.calls.some(call=>call.kind==='digits'&&call.args[0]===3&&call.args[3]===20)&&
  refreshing.text.some(item=>item.text==='NEXT'),
  'a queued refresh keeps both the existing lane expiry and pending indicator');
const expires=render({musicBeatFloat:64,captures:[phrase]});
assert(expires.calls.some(call=>call.kind==='digits'&&call.args[0]===0&&call.args[3]===20),
  'the draw reports zero remaining bars without altering the capture');
const exitState={progress:2290,gateAt:2430,echoEnergy:100};
const directionText=item=>item.text.replace(/\s+/g,' ');
assert(render(exitState).text.some(item=>directionText(item)==='H ECHO LEFT | ORIGINAL RIGHT'),
  'the final exit names the keyboard Echo control and both required directions');
B.GamepadUI.connected=true;B.ControllerSettings.button=index=>index===5?'RB':'LB';
assert(render(exitState).text.some(item=>directionText(item)==='RB ECHO LEFT | ORIGINAL RIGHT'),
  'the final exit uses the mapped Echo control');
assert(render({...exitState,echo,echoEnergy:0}).text.some(item=>directionText(item)==='ECHO LEFT | ORIGINAL RIGHT'),
  'an active Echo keeps split-direction guidance without requesting another activation');
B.GamepadUI.connected=false;
dashboardArtReady=false;
const fallback=render({speed:54});
assert.equal(fallback.text.filter(item=>item.x>=50&&item.x<210&&
  item.y>100&&item.y<120&&/^\d$/.test(item.text)).map(item=>item.text).join(''),'174',
  'image-loading fallback keeps the actual speed readable');

console.log(`Cache Road dashboard passed: MPH, current/queued gears, clock warning, three integrity lamps, Turbo/Echo, controls, beat-ONE action phases, lane expiry and Reduced Motion; ${draws} production draws, at most ${maxOperations} helper operations/${maxSubmissions} static asset submissions, no gameplay mutation.`);
