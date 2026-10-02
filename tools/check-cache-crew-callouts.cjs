#!/usr/bin/env node
// Physical contact queue, native Canvas typography/registration and the real
// shared lifecycle. Arranged crossing addresses are focused regression
// fixtures, separate from the earned full-race/native browser gates.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const {combatRig}=require('./check-cache-combat-integration.cjs');
const copy=value=>JSON.parse(JSON.stringify(value));
GlobalFonts.registerFromPath('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf','Oxanium');
const window={BARCODE:{}};
for(const file of ['src/game/cache-road-crosswalks.js','src/game/cache-road-crew-callouts.js'])
  vm.runInNewContext(fs.readFileSync(file,'utf8'),{window});
const B=window.BARCODE,C=B.CacheRoadCrewCallouts;
const crossing=B.CacheRoadCrosswalks.create();
B.CacheRoadCrosswalks.commit(crossing,{beat:40,from:700});
Object.assign(crossing.crossings[0],{started:true,ageMs:4500});
const events=B.CacheRoadCrosswalks.step(crossing,200,
  {before:970,progress:1030,speed:110,previousLanePos:0,lanePos:3});
assert.equal(events.length,2,'the queue input is two actual physical contacts');
const economy={score:7500,integrity:3,lockEnergy:71,echoEnergy:100,timeMs:42000,
  captures:[{lane:1,endBeat:80}],combat:{ammo:3,cooldowns:{attack:750}},driveFeedback:{kind:'perfect'}};
const state=copy(economy);
assert(C.enqueue(state,events[0]));assert(C.enqueue(state,events[1]));
assert.equal(state.crosswalkToast.id,events[0].id);
assert.equal(state.crosswalkToast.speaker,'6 BIT');
assert.equal(state.crosswalkToast.remainingMs,3200);
assert.equal(state.crosswalkMessages.length,1);
assert.equal(state.crosswalkMessages[0].speaker,'DJ FLOPPYDISC');
assert.notEqual(state.crosswalkToast.message,state.crosswalkMessages[0].message);
assert.equal(C.enqueue(state,events[0]),false,'a repeated contact cannot queue or restart its reaction');
for(const [key,value] of Object.entries(economy))assert.deepEqual(copy(state[key]),value,
  `${key} cannot pay for a pedestrian hit or a crew reaction`);
for(const delta of [0,-1,NaN,Infinity]) {
  const before=copy(state);C.step(state,delta);assert.deepEqual(copy(state),before);
}
for(let index=0;index<31;index++)C.step(state,100);
assert.equal(state.crosswalkToast.id,events[0].id);
assert.equal(state.crosswalkToast.remainingMs,100);
C.step(state,150);
assert.equal(state.crosswalkToast.id,events[1].id,'the second contact gets a separate full reaction');
assert.equal(state.crosswalkToast.remainingMs,3150,'only the first reaction consumes the preceding hold');
for(let index=0;index<31;index++)C.step(state,100);
C.step(state,50);assert.equal(state.crosswalkToast,null);assert.equal(state.crosswalkMessages.length,0);
assert.equal(C.enqueue(state,events[1]),false,'an expired reaction also remains single-use');
for(const invalid of [null,{type:'damage',id:'invalid',hitCount:1},
  {type:'pedestrian-hit',hitCount:1},{type:'pedestrian-hit',id:'invalid',hitCount:0},
  {type:'pedestrian-hit',id:'invalid',hitCount:9}])assert.equal(C.enqueue(state,invalid),false);
assert.equal(C.lines.length,12);assert.equal(new Set(C.lines).size,12);
assert.equal(new Set(Array.from({length:8},(_,i)=>C.lineFor(i+1).message)).size,8);
assert.deepEqual(Array.from({length:8},(_,i)=>C.lineFor(i+1).frame),[0,1,2,0,1,2,0,1]);

const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),portraits=[],text=[];
const nativeText=ctx.fillText.bind(ctx);
ctx.fillText=function(message,x,y,...rest) {
  text.push({message,x,y,font:this.font,width:this.measureText(message).width});
  return nativeText(message,x,y,...rest);
};
B.PresentationAssets={draw(key,paint,args) {
  assert.equal(key,'cacheCrewCallouts');portraits.push(copy(args));
  // A bounded decoded-image stand-in records source selection; final asset
  // decoding and authored pixels are independently covered by asset gates.
  paint.fillStyle='#375067';paint.fillRect(args.x-args.width/2,args.y-args.height/2,args.width,args.height);
  return true;
}};
const bounds=C.bounds;
assert(bounds.x>480&&bounds.x+bounds.w<1470,'crew comms leave route, receipts and right guidance visible');
assert(bounds.y>159&&bounds.y+bounds.h<400,'crew comms remain below the mirror/capture rows and above the road horizon');
for(let count=1;count<=12;count++) {
  const shown={crosswalkToast:{id:`paint-${count}`,...C.lineFor(count),remainingMs:1600}};
  const before=copy(shown);text.length=0;ctx.globalAlpha=.41;const alpha=ctx.globalAlpha;
  const transform=ctx.getTransform();C.draw(ctx,shown);
  assert.deepEqual(copy(shown),before,'painting cannot age, rotate, consume or enqueue a callout');
  assert.deepEqual(ctx.getTransform(),transform,'the HUD painter restores the road-independent Canvas transform');
  assert.equal(ctx.globalAlpha,alpha,'the painter restores alpha');
  const dialogue=text.filter(item=>/bold (27|23)px/.test(item.font));
  assert(dialogue.length>=1&&dialogue.length<=2,'every complete authored line fits in at most two rows');
  assert.equal(dialogue.map(item=>item.message).join(' '),shown.crosswalkToast.message);
  assert(dialogue.every(item=>item.x>=bounds.x+135&&item.x+item.width<=bounds.x+bounds.w-12&&
    item.y>bounds.y+35&&item.y<bounds.y+bounds.h-15),'native text stays in the speech area without compression');
  assert.equal(portraits.at(-1).frame,(count-1)%3);
  assert.equal(portraits.at(-1).width,portraits.at(-1).height,'complete portraits retain square proportions');
}
B.PresentationAssets.draw=()=>false;
const fallback={crosswalkToast:{...C.lineFor(3),remainingMs:1000}};
assert(C.draw(ctx,fallback),'a missing portrait keeps the authored speaker and readable dialogue');
assert.equal(C.draw(ctx,{crosswalkToast:null}),null);

// The production person painter puts blood under the whole authored body at
// its saved ground point. Main road and mirror call this same function.
const rig=createRig(),P=rig.w.BARCODE;
P.Campaign={register(){},syncTitleButton(){}};
load(rig.context,'src/engine/cache-road-proof-profile.js');load(rig.context,'src/game/cache-road-landscape.js');
const source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
vm.runInContext(source.replace('  B.Campaign.register(ID,',
  '  window.crewPaintReview={newState,drawCrosswalkPerson};\n  B.Campaign.register(ID,'),rig.context);
const painted=[];
P.CacheRoadCombatArt={drawBlood(_ctx,args){painted.push({type:'blood',args:copy(args),transform:copy(_ctx.getTransform())});return true;}};
P.PresentationAssets={draw(key,_ctx,args){painted.push({type:'person',key,args:copy(args)});return true;}};
for(const reduced of [false,true])for(const flashes of [false,true])for(const side of ['left','right']) {
  rig.w.BARCODE_RENDER_QUALITY={flashes};painted.length=0;
  const person={id:`cw-10-${side}`,side,phase:'hit',hitAgeMs:120,hitSide:1,walkingMs:4200};
  const before=copy(person);
  rig.w.crewPaintReview.drawCrosswalkPerson(ctx,person,{x:601,y:804,height:150,reduced});
  assert.deepEqual(painted.map(item=>item.type),['blood','person']);
  assert.deepEqual(copy(person),before,'draw cannot change the contact age or physical person');
  assert.equal(painted[0].args.x,601);assert.equal(painted[0].args.y,804);
  assert.equal(painted[0].args.reduced,reduced);assert.equal(painted[0].args.flashes,flashes);
  assert.equal(painted[0].args.ageMs,120);
  assert.equal(painted[0].transform.e,0);assert.equal(painted[0].transform.f,0,
    'blood registration precedes airborne/grounded body transforms');
}
painted.length=0;
rig.w.crewPaintReview.drawCrosswalkPerson(ctx,{side:'left',phase:'walking'},
  {x:601,y:804,height:150,reduced:false});
assert.deepEqual(painted.map(item=>item.type),['person'],'a walking person cannot produce blood');
const oldState=rig.w.crewPaintReview.newState({musicBar:30,progress:3000});
assert.equal(oldState.crosswalkToast,null);assert.equal(oldState.crosswalkMessages.length,0);

async function sharedLifecycle() {
  const r=await combatRig(),s=r.road.state,callouts=r.B.CacheRoadCrewCallouts;
  assert(callouts,'the real road/input/shared RAF harness includes the new production owner');
  for(const event of events)callouts.enqueue(s,event);
  r.step(100,10);assert.equal(s.crosswalkToast.remainingMs,3100,
    'the existing road update, rather than drawing or another timer, ages comms');
  const checkpoint=r.road.makeCheckpoint('road-start');
  for(const key of ['crosswalkToast','crosswalkMessages','crosswalkCalloutIds'])
    assert(!Object.hasOwn(checkpoint.levelState.proof,key),'crew presentation stays outside every compatible save');
  await r.B.RuntimeLifecycle.pause('crew-callout-regression');
  const paused={toast:copy(s.crosswalkToast),queue:copy(s.crosswalkMessages),ids:copy(s.crosswalkCalloutIds)};
  r.step(4500,60);
  assert.deepEqual({toast:copy(s.crosswalkToast),queue:copy(s.crosswalkMessages),ids:copy(s.crosswalkCalloutIds)},paused,
    'real lifecycle pause preserves the active speaker and all queued contacts');
  await r.B.RuntimeLifecycle.resume('crew-callout-regression');r.input();r.step(100,10);
  assert.equal(s.crosswalkToast.remainingMs,3000,'resume continues the original hold');
  r.road.dispose();
}
sharedLifecycle().then(()=>console.log('PASS: three canonical crew slots, twelve authored insults, separate 3.2-second physical-contact queue, no economy/save changes, pause-safe shared update, native two-row text/safe HUD bounds, draw purity and ground-registered pedestrian blood.'))
  .catch(error=>{console.error(error.stack||error);process.exitCode=1;});
