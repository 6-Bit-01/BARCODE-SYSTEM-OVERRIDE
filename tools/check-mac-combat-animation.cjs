#!/usr/bin/env node
'use strict';
// Independent native-art math checks. Sampler fixtures and natural public-input
// movement never write running health/positions. This does not certify artwork
// quality or physical play feel. An optional third argument writes a receipt.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const source=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const out=process.argv[3]?path.resolve(process.argv[3]):null;
if(out)fs.mkdirSync(out,{recursive:true});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const artManifestFile=path.join(source,'assets/mac-combat-rigs/mac-combat-art-v1.json');
const artManifest=fs.existsSync(artManifestFile)?JSON.parse(fs.readFileSync(artManifestFile,'utf8')):null;
const animationFile=path.join(source,'src/game/mac-combat-animation.js'),rigFile=path.join(source,'assets/mac-combat-rigs/mac-modem-v2-rig.json');
const code=fs.readFileSync(animationFile,'utf8'),rig=JSON.parse(fs.readFileSync(rigFile,'utf8'));
const image=fs.readFileSync(path.join(source,rig.sourceImage));
const forbidden=()=>{throw Error('Animation created a time/input/loop/DOM/audio/save owner');};
const context={window:{BARCODE:{}},setTimeout:forbidden,setInterval:forbidden,requestAnimationFrame:forbidden,
 Date:class{constructor(){forbidden();}static now(){forbidden();}},performance:{now:forbidden},
 document:new Proxy({},{get:forbidden}),localStorage:new Proxy({},{get:forbidden}),Audio:forbidden,AudioContext:forbidden};
vm.runInNewContext(code,context,{filename:animationFile});
vm.runInNewContext(fs.readFileSync(path.join(source,'src/game/mac-street-combat.js'),'utf8'),context);
const A=context.window.BARCODE.MacCombatAnimation,C=context.window.BARCODE.MacStreetCombat,g=A.geometry(rig);
const point=(x,y)=>({x,y}),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const chain={front_upper_arm:['front_shoulder','front_elbow'],front_forearm:['front_elbow','front_wrist'],
 rear_upper_arm:['rear_shoulder','rear_elbow'],rear_forearm:['rear_elbow','rear_wrist'],
 front_thigh:['front_hip','front_knee'],front_shin:['front_knee','front_ankle'],
 rear_thigh:['rear_hip','rear_knee'],rear_shin:['rear_knee','rear_ankle']};
const models={};
const activeRigs=artManifest?artManifest.actors.map(actor=>actor.rig):fs.readdirSync(path.join(source,'assets/mac-combat-rigs')).filter(name=>name.endsWith('-rig.json')).map(name=>'assets/mac-combat-rigs/'+name);
for(const file of activeRigs){
 const bytes=fs.readFileSync(path.join(source,file)),registration=JSON.parse(bytes);
 const png=fs.readFileSync(path.join(source,registration.sourceImage)),parts=Object.fromEntries(registration.parts.map(p=>[p.id,p]));
 const scale=260/registration.pixelScale.standingVisibleHeight,chains={...chain};
 for(const side of ['a','b'])if(parts['extra_upper_arm_'+side]){
  chains['extra_upper_arm_'+side]=['extra_shoulder_'+side,'extra_elbow_'+side];
  chains['extra_forearm_'+side]=['extra_elbow_'+side,'extra_wrist_'+side];
 }
 models[registration.actor]={rig:registration,image:png,parts,scale,chain:chains,g:A.geometry(registration),
  lengths:Object.fromEntries(Object.keys(chains).map(id=>[id,dist(parts[id].pivot,parts[id].distal)*scale])),
  rigSHA256:hash(bytes),imageSHA256:hash(png)};
}
const model=kind=>models[kind]||models.mac;
const receipt={kind:'independent-native-articulated-combat-math',sourceRoot:source,
 checkerSHA256:hash(fs.readFileSync(__filename)),
 inputs:{animation:hash(code),combat:hash(fs.readFileSync(path.join(source,'src/game/mac-street-combat.js'))),rig:hash(fs.readFileSync(rigFile)),image:hash(image),artManifest:artManifest?hash(fs.readFileSync(artManifestFile)):null},
 scope:'Sampler fixtures and actual native source anchor/draw transforms; no live game state writes. Geometry/continuity proof is distinct from visual or owner acceptance.',
 registrations:Object.fromEntries(Object.entries(models).map(([kind,m])=>[kind,{rigSHA256:m.rigSHA256,imageSHA256:m.imageSHA256,parts:m.rig.parts.length}])),
 groups:[],metrics:{},status:'running',startedAt:new Date().toISOString()};
function check(name,fn){try{fn();receipt.groups.push({name,status:'passed'});console.log('PASS '+name);}catch(error){receipt.groups.push({name,status:'failed',message:String(error)});console.log('FAIL '+name+': '+error.message);}}
function actor(kind='mac',motion={},extra={}){return {kind,hp:100,facing:1,elevation:0,ageMs:0,animAgeMs:0,
 animation:{action:'idle',ageMs:0,motion:{vx:0,laneVelocity:0,speed:0,stridePhase:0,phaseProgress:0,...motion}},...extra};}
const sample=(value,player=value.kind==='mac',height=260)=>A.sample(value,{player,geometry:model(value.kind).g,height});
function multiply(a,b){return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
function transform(m,p){return point(m[0]*p.x+m[2]*p.y+m[4],m[1]*p.x+m[3]*p.y+m[5]);}
function drawRecords(pose,x=0,feet=0,facing=1,height=260){const native=model(pose.kind),rig=native.rig;let m=[1,0,0,1,0,0],stack=[],rows=[],alpha=1;
 const ctx={save(){stack.push({m:[...m],alpha});},restore(){const saved=stack.pop();m=saved.m;alpha=saved.alpha;},
  translate(x,y){m=multiply(m,[1,0,0,1,x,y]);},scale(x,y){m=multiply(m,[x,0,0,y,0,0]);},rotate(t){m=multiply(m,[Math.cos(t),Math.sin(t),-Math.sin(t),Math.cos(t),0,0]);},
  get globalAlpha(){return alpha;},set globalAlpha(v){alpha=v;},
  drawImage(_image,sx,sy,sw,sh,dx,dy,dw,dh){const part=rig.parts.find(p=>p.source.x===sx&&p.source.y===sy&&p.source.width===sw&&p.source.height===sh);
   assert(part,'Every actual draw uses a measured native source crop');
   const map=p=>transform(m,point(dx+p.x*dw/sw,dy+p.y*dh/sh));
   const b=part.visibleBounds;
   rows.push({id:part.id,proximal:map(part.pivot),distal:part.distal?map(part.distal):null,
    visible:b?[map(point(b.x,b.y)),map(point(b.x+b.width,b.y)),map(point(b.x+b.width,b.y+b.height)),map(point(b.x,b.y+b.height))]:[],
    ground:part.anchors?.ground_contact?map(part.anchors.ground_contact):null,alpha,crop:{x:sx,y:sy,width:sw,height:sh}});}};
 A.draw(ctx,{registration:rig,image:{nativeWidth:rig.sourceDimensions.width,nativeHeight:rig.sourceDimensions.height}},pose,x,feet,height,facing);
 assert.equal(stack.length,0,'Draw restores every native context transform');return rows;}
function shoeContacts(pose,x=0,feet=0,facing=1,height=260){return Object.fromEntries(drawRecords(pose,x,feet,facing,height).filter(r=>r.ground).map(r=>[r.id,r.ground]));}
function difference(a,b,ids=Object.keys(a.joints)){return Math.max(...ids.map(id=>dist(a.joints[id],b.joints[id])));}
function finitePose(pose){for(const [id,p]of Object.entries(pose.joints))assert(Number.isFinite(p.x)&&Number.isFinite(p.y),'Finite joint '+id);assert(pose.alpha>=0&&pose.alpha<=1);}
function nativeLengths(pose){const m=model(pose.kind);for(const [id,[a,b]]of Object.entries(m.chain))assert(Math.abs(dist(pose.joints[a],pose.joints[b])-m.lengths[id])<1e-5,'Measured native bone length retained: '+pose.kind+'/'+id);}
function macAttack(kind,elapsed){const rule=[...C.strikes,...Object.values(C.attacks)].find(r=>r.kind===kind);assert(rule,kind);
 const phase=elapsed<rule.windupMs?'windup':elapsed<rule.windupMs+rule.activeMs?'active':'recovery';
 return actor('mac',{}, {attack:{kind,step:kind==='cross'?2:kind==='finisher'?3:1,elapsedMs:elapsed,timing:rule,phase}});}
function enemyAttack(kind,type,phase,progress){const value=actor(kind,{attackType:type,phaseProgress:progress});value.animation.action=phase;return value;}
check('module has no time, loop, input, asset, audio or save owner',()=>{
 assert(!/\b(?:requestAnimationFrame|setInterval|setTimeout|Date\.now|performance\.now|addEventListener|localStorage|new\s+(?:Image|Audio|AudioContext))\s*\(/.test(code));
 const before=Object.keys(context.window).sort();for(let n=0;n<50;n++)sample(actor());assert.deepEqual(Object.keys(context.window).sort(),before);
});
check('native dimensions, SHA, crops and attachment anchors agree',()=>{
 assert(artManifest,'The selected native artwork manifest must exist');
 assert.equal(artManifest.actors.length,8);assert.equal(artManifest.files.length,17);
 assert.equal(new Set(artManifest.files).size,17);
 for(const item of artManifest.actors){
  assert.equal(hash(fs.readFileSync(path.join(source,item.image))),item.imageSHA256);
  assert.equal(hash(fs.readFileSync(path.join(source,item.rig))),item.rigSHA256);
  assert(artManifest.files.includes(item.image)&&artManifest.files.includes(item.rig));
 }
 assert.equal(Object.keys(models).length,8,'Mac plus all seven actual alien rigs must be registered');
 for(const kind of ['mac',...Object.keys(C.roles)]){
 const m=models[kind];assert(m,'Actual native rig required for '+kind);
 const {rig,image,parts}=m;
 assert.equal(rig.parts.length,kind==='null_regent'?21:15);
 assert.equal(image.readUInt32BE(16),rig.sourceDimensions.width);assert.equal(image.readUInt32BE(20),rig.sourceDimensions.height);assert.equal(hash(image),rig.sourceSHA256);
 for(const p of rig.parts){const s=p.source;assert(s.x>=0&&s.y>=0&&s.x+s.width<=rig.sourceDimensions.width&&s.y+s.height<=rig.sourceDimensions.height);}
 for(const [id,owner]of [['neck','torso'],['front_shoulder','torso'],['rear_shoulder','torso'],['front_hip','pelvis'],['rear_hip','pelvis']]){
  const part=parts[owner],anchor=part.anchors[id];assert(anchor);
  const rest=rig.restSkeleton[id],origin=rig.restSkeleton.hip;
  assert(dist(point(origin.x+anchor.x-part.pivot.x,origin.y+anchor.y-part.pivot.y),rest)<.01,'Native attachment '+id);
 }
 }
});
check('all sampled limbs retain their native length and actual draw endpoints',()=>{
 const poses=[sample(actor()),sample(actor('mac',{}, {guarding:true})),sample(actor('mac',{}, {elevation:95}))];
 for(const kind of ['jab','cross','finisher','step-strike','air-kick','counter'])for(let t=0;t<=420;t+=15)poses.push(sample(macAttack(kind,t)));
 for(const kind of Object.keys(C.tactics))for(const type of C.tactics[kind])for(const phase of ['tell','attack','recover'])for(const progress of [0,.25,.5,.75,1])poses.push(sample(enemyAttack(kind,type,phase,progress),false));
 let maxError=0;
 for(const pose of poses){finitePose(pose);nativeLengths(pose);
  for(const facing of [-1,1])for(const row of drawRecords(pose,123,880,facing))if(model(pose.kind).chain[row.id]){
   const [a,b]=model(pose.kind).chain[row.id],world=p=>point(123+facing*p.x,880+p.y);
   const error=Math.max(dist(row.proximal,world(pose.joints[a])),dist(row.distal,world(pose.joints[b])));maxError=Math.max(maxError,error);
   assert(error<1e-5,'Actual native painted endpoint attaches to solved joint '+row.id);
  }
 }
 receipt.metrics.sampledPoses=poses.length;receipt.metrics.maximumNativeEndpointError=maxError;
});
check('grounded walking soles contact the native floor without clamped hovering',()=>{
 let maxHover=0,maxPenetration=0;const rows=[];
 for(const kind of Object.keys(models)){
 let hover=0,penetration=0;
 for(const phase of Array.from({length:120},(_,n)=>n/120)){
  const p=sample(actor(kind,{vx:260,speed:260,stridePhase:phase}));
  nativeLengths(p);
  const contacts=shoeContacts(p);
  for(const [id,t]of [['front_shoe',phase],['rear_shoe',(phase+.5)%1]])if(t<.6){
   hover=Math.max(hover,-contacts[id].y);penetration=Math.max(penetration,contacts[id].y);
  }
 }
 rows.push({kind,hover,penetration});maxHover=Math.max(maxHover,hover);maxPenetration=Math.max(maxPenetration,penetration);
 }
 receipt.metrics.nativeFloorContactByRole=rows;
 receipt.metrics.maximumPlantedSoleHover=maxHover;receipt.metrics.maximumPlantedSolePenetration=maxPenetration;
 assert(maxHover<2&&maxPenetration<2,'Native planted contact error '+JSON.stringify({maxHover,maxPenetration}));
});
check('forward, backwards and diagonal stance shoes remain planted in world space',()=>{
 const cases=[{vx:260,vy:0,facing:1},{vx:-260,vy:0,facing:-1},{vx:90,vy:0,facing:-1},{vx:-90,vy:0,facing:1},{vx:180,vy:120,facing:1}];
 const results=[];
 for(const kind of Object.keys(models))for(const row of cases){const travel=Math.hypot(row.vx,row.vy*.75),positions=[];
  for(const phase of [.1,.2,.3,.4,.5]){const distance=110*phase,time=distance/travel;
   const p=sample(actor(kind,{vx:row.vx,laneVelocity:row.vy,speed:Math.hypot(row.vx,row.vy),stridePhase:phase},{facing:row.facing}));
   positions.push(shoeContacts(p,row.vx*time,row.vy*time,row.facing).front_shoe.x);
  }
  const drift=Math.max(...positions)-Math.min(...positions);results.push({kind,...row,drift});
 }
 receipt.metrics.worldPlantedDrift=results;assert(results.every(row=>row.drift<2),'World shoe drift '+JSON.stringify(results));
 const bossRows=[];
 for(const input of [{move_x:1},{move_x:-1},{move_x:1,move_y:1}]){
  const game=C.create(),contacts=[];
  for(let n=0;n<50;n++){
   const player=game.update(C.constants.stepMs,input).player,motion=player.animation.motion;
   if(motion.stridePhase>.56)break;
   if(motion.stridePhase<.25||motion.moveAgeMs<100)continue;
   const value=actor('null_regent',motion,{facing:player.facing}),pose=sample(value,false,335);
   nativeLengths(pose);const sole=shoeContacts(pose,player.x,player.laneY,player.facing,335).front_shoe;
   contacts.push({x:sole.x,hover:player.laneY-sole.y});
  }
  assert(contacts.length>=8,'Actual supplied gait provides a boss stance interval');
  const drift=Math.max(...contacts.map(p=>p.x))-Math.min(...contacts.map(p=>p.x));
  const maximumContactError=Math.max(...contacts.map(p=>Math.abs(p.hover)));
  bossRows.push({input,height:335,drift,maximumContactError});
  assert(drift<2&&maximumContactError<2,'Native335px boss respects actual world travel instead of scaling shoe slide');
 }
 receipt.metrics.actualBossHeightWorldPlant=bossRows;
});
check('lane-only movement produces stepping instead of an idle slide',()=>{
 const a=sample(actor('mac',{vx:0,laneVelocity:180,speed:180,stridePhase:.2}));
 const b=sample(actor('mac',{vx:0,laneVelocity:180,speed:180,stridePhase:.75}));
 assert(a.walking&&b.walking,'Lane travel is marked as walking');
 assert(difference(a,b,['front_knee','rear_knee','front_ankle','rear_ankle'])>3,'Lane movement visibly alternates feet');
});
check('actual fixed-step stops retain direction and settle one foot with grounded support',()=>{
 const rows=[],dt=C.constants.stepMs;
 receipt.metrics.actualStopTraces=rows;
 for(const input of [{move_x:1},{move_y:1},{move_x:1,move_y:-1}])for(const travelMs of [50,100,175,225]){
  const game=C.create();let before;
  for(let n=0;n<Math.round(travelMs/dt);n++)before=game.update(dt,input).player;
  const last=before.animation.motion,startPose=sample(before),stopped=game.update(dt,{}).player;
  assert.equal(stopped.animation.motion.settleAgeMs,0);
  assert.equal(stopped.animation.motion.stridePhase,last.stridePhase);
  assert.equal(stopped.animation.motion.strideRatio,last.strideRatio);
  assert(stopped.animation.motion.wasMoving);
  const stopJump=difference(startPose,sample(stopped),['front_ankle','rear_ankle']);
  let supportError=0,stepJump=0,previous=sample(stopped),movingFeet=[];
  for(let n=0;n<=Math.ceil(240/dt);n++){
   const p=n===0?stopped:game.update(dt,{}).player,pose=sample(p),contacts=shoeContacts(pose);
   nativeLengths(pose);finitePose(pose);
   supportError=Math.max(supportError,Math.min(Math.abs(contacts.front_shoe.y),Math.abs(contacts.rear_shoe.y)));
   stepJump=Math.max(stepJump,difference(previous,pose,['front_ankle','rear_ankle']));
   if(n>0)movingFeet.push({age:p.animation.motion.settleAgeMs,front:dist(previous.joints.front_ankle,pose.joints.front_ankle),rear:dist(previous.joints.rear_ankle,pose.joints.rear_ankle)});
   previous=pose;
  }
  const final=game.getSnapshot().player,neutral=sample(actor('mac',{}, {ageMs:final.ageMs,animAgeMs:final.animAgeMs}));
  const neutralFootError=difference(previous,neutral,['front_ankle','rear_ankle']);
  rows.push({input,travelMs,phase:last.stridePhase,ratio:last.strideRatio,stopJump,supportError,stepJump,neutralFootError});
  assert(stopJump<2,'First stationary tick must preserve the actual walk targets: '+JSON.stringify(rows.at(-1)));
  assert(supportError<2,'At least one actual painted sole supports each stop stage');
  assert(stepJump<8,'Sequential settling moves smoothly across real120Hz ticks');
  assert(neutralFootError<2,'Both feet reach the standing stance after240ms');
  assert(movingFeet.every(s=>s.front<1||s.rear<1),'Each settling tick keeps one foot still');
 }
});
check('public-input starts, resumed strides and facing reversals do not snap the planted shoes',()=>{
 const rows=[],game=C.create(),dt=C.constants.stepMs;
 receipt.metrics.actualMovementHandoffs=rows;
 const transition=(name,input)=>{
  const before=game.getSnapshot().player,after=game.update(dt,input).player;
  const a=sample(before),b=sample(after),ids=['front_ankle','rear_ankle'];
  const jump=difference(a,b,ids);rows.push({name,jump,before:before.animation.motion,after:after.animation.motion});
  assert(jump<8,'Foot handoff '+name+' jumps '+jump.toFixed(2)+'px in one fixed tick');
 };
 transition('initial walk',{move_x:1});
 for(let n=0;n<20;n++)game.update(dt,{move_x:1});
 transition('direct reversal',{move_x:-1});
 for(let n=0;n<32;n++)game.update(dt,{});
 transition('resume after settled stop',{move_x:1});
 for(let n=0;n<4;n++)game.update(dt,{});
 transition('resume during foot settle',{move_x:1,move_y:1});
});
check('active native fists and kicking shoe provide measured contact extents',()=>{
 const rows=[],box=points=>({left:Math.min(...points.map(p=>p.x)),right:Math.max(...points.map(p=>p.x)),top:Math.min(...points.map(p=>p.y)),bottom:Math.max(...points.map(p=>p.y))});
 const intersects=(a,b)=>a.left<=b.right&&a.right>=b.left&&a.top<=b.bottom&&a.bottom>=b.top;
 for(const kind of ['jab','cross','finisher','step-strike','air-kick','counter']){
  const rule=[...C.strikes,...Object.values(C.attacks)].find(r=>r.kind===kind),value=macAttack(kind,rule.windupMs+rule.activeMs*.75);
  if(kind==='air-kick')value.elevation=95;
  const pose=sample(value),contactIds=kind==='air-kick'?['front_shoe']:kind==='cross'?['rear_fist']:['front_fist'];
  const visible=drawRecords(pose,0,-(value.elevation||0)).filter(row=>contactIds.includes(row.id)).flatMap(row=>row.visible);
  assert(visible.length,'Actual native contact silhouette is registered for '+kind);
  const contact=box(visible),targets=[];
  for(const role of Object.keys(C.roles).filter(role=>models[role])){
   const targetHeight=role==='null_regent'?335:260,targetPose=sample(actor(role),false,targetHeight);
   const body=drawRecords(targetPose,rule.reach,0,-1,targetHeight).filter(row=>['head','torso','pelvis'].includes(row.id));
   const bodyBoxes=body.map(row=>({part:row.id,...box(row.visible)}));let overlapsAtAnyActiveSample=false;
   for(let n=0;n<=20;n++){
    const attack=macAttack(kind,rule.windupMs+rule.activeMs*n/20);
    if(kind==='air-kick')attack.elevation=95;
    const contactPoints=drawRecords(sample(attack),0,-(attack.elevation||0)).filter(row=>contactIds.includes(row.id)).flatMap(row=>row.visible);
    if(bodyBoxes.some(b=>intersects(box(contactPoints),b)))overlapsAtAnyActiveSample=true;
   }
   targets.push({role,bodyBoxes:body.map(row=>({part:row.id,...box(row.visible)})),
    overlapsAtThisActiveSample:body.some(row=>intersects(contact,box(row.visible))),overlapsAtAnyActiveSample});
  }
  rows.push({kind,ruleReach:rule.reach,paintedForwardExtent:Math.max(...visible.map(p=>p.x)),
   paintedVerticalMin:Math.min(...visible.map(p=>p.y)),paintedVerticalMax:Math.max(...visible.map(p=>p.y)),targets});
 }
 receipt.metrics.nativeMacContactExtents=rows;
 // These AABB silhouette benchmarks do not assume a collision body is its feet
 // and do not certify exact alpha contact or every dynamic target pose.
 assert(rows.every(row=>Number.isFinite(row.paintedForwardExtent)&&row.paintedForwardExtent>30));
 receipt.metrics.nativeContactWarnings=rows.flatMap(row=>row.targets.filter(target=>!target.overlapsAtAnyActiveSample)
  .map(target=>({attack:row.kind,role:target.role,ruleReach:row.ruleReach,reason:'No native contact/body AABB overlap across21 active samples at maximum hit range'})));
 if(receipt.metrics.nativeContactWarnings.length)console.log('CONTACT_REVIEW '+JSON.stringify(receipt.metrics.nativeContactWarnings));
});
check('Mac windup, impact, recovery and neutral handoff are continuous',()=>{
 const results=[],epsilon=.0001,neutral=sample(actor());
 for(const kind of ['jab','cross','finisher','step-strike','air-kick','counter']){
  const rule=[...C.strikes,...Object.values(C.attacks)].find(r=>r.kind===kind),end=rule.windupMs+rule.activeMs+rule.recoveryMs;
  const baseline=kind==='air-kick'?sample(actor('mac',{}, {elevation:95})):neutral;
  const attackAt=t=>{const value=macAttack(kind,t);if(kind==='air-kick')value.elevation=95;return sample(value);};
  const start=attackAt(0),last=attackAt(end);
  results.push({kind,boundary:'enter',jointJump:difference(baseline,start),fistJump:Math.abs(baseline.fistFrontAngle-start.fistFrontAngle)});
  for(const t of [rule.windupMs,rule.windupMs+rule.activeMs])results.push({kind,boundary:t,jointJump:difference(attackAt(t-epsilon),attackAt(t+epsilon)),fistJump:Math.abs(attackAt(t-epsilon).fistFrontAngle-attackAt(t+epsilon).fistFrontAngle)});
  results.push({kind,boundary:'settle',jointJump:difference(last,baseline),fistJump:Math.abs(last.fistFrontAngle-baseline.fistFrontAngle)});
 }
 receipt.metrics.macAttackBoundaries=results;
 assert(results.every(row=>row.jointJump<1&&row.fistJump<.02),'Mac boundary jumps '+JSON.stringify(results.filter(row=>row.jointJump>=1||row.fistJump>=.02)));
});
check('the real420ms grab/release/settle timeline has no pose snaps',()=>{
 const poseAt=t=>sample(actor('mac',{},t<0||t>=420?{}:{grapple:{elapsedMs:t,progress:t/420,phase:t<140?'grab':t<280?'release':'recover'}}));
 const points=[0,90,140,260,280,420],rows=[];
 for(const t of points){const a=poseAt(t-.0001),b=poseAt(t+.0001);
  rows.push({atMs:t,jointJump:difference(a,b),leanJump:Math.abs(a.lean-b.lean)});}
 receipt.metrics.throwBoundaries=rows;
 assert(rows.every(row=>row.jointJump<1&&row.leanJump<.02),'Throw snaps '+JSON.stringify(rows.filter(row=>row.jointJump>=1||row.leanJump>=.02)));
});
check('six enemy families and their two tactics have distinct articulated preparations',()=>{
 const ids=['hip','neck','front_wrist','rear_wrist','front_elbow','rear_elbow'],phases=['tell','attack','recover'],progresses=[.25,.5,.75],results=[];
 for(const kind of Object.keys(C.tactics).filter(kind=>kind!=='null_regent')){
  const [a,b]=C.tactics[kind];let separation=0;
  for(const phase of phases)for(const progress of progresses)separation=Math.max(separation,difference(sample(enemyAttack(kind,a,phase,progress),false),sample(enemyAttack(kind,b,phase,progress),false),ids));
  results.push({kind,tactics:[a,b],separation});
 }
 receipt.metrics.tacticPoseSeparation=results;assert(results.every(row=>row.separation>3),'Identical or imperceptible tactic paths '+JSON.stringify(results));
});
check('boss cleave, charge, fan and ground wave use distinct upper-body paths',()=>{
 const types=C.tactics.null_regent,ids=['hip','neck','front_wrist','rear_wrist','extra_wrist_a','extra_wrist_b'],rows=[];
 for(let a=0;a<types.length;a++)for(let b=a+1;b<types.length;b++){
  let separation=0;for(const phase of ['tell','attack'])for(const progress of [.25,.5,.75])separation=Math.max(separation,difference(sample(enemyAttack('null_regent',types[a],phase,progress),false),sample(enemyAttack('null_regent',types[b],phase,progress),false),ids));
  rows.push({types:[types[a],types[b]],separation});
 }
 receipt.metrics.bossPoseSeparation=rows;assert(rows.every(row=>row.separation>3),'Boss attacks share identical upper-body paths '+JSON.stringify(rows));
});
check('hurt and defeat stay finite with native limbs and bounded fade',()=>{
 for(const kind of ['mac',...Object.keys(C.tactics)])for(let age=0;age<=800;age+=5){
  for(const dying of [false,true]){const value=actor(kind,{}, {hp:dying?0:100,hurtMs:dying?0:220});
   value.animation.action=dying?'defeat':'hurt';value.animation.ageMs=age;
   const p=sample(value,kind==='mac');finitePose(p);nativeLengths(p);drawRecords(p);}
 }
});
receipt.status=receipt.groups.every(g=>g.status==='passed')?'passed':'failed';receipt.finishedAt=new Date().toISOString();
if(out)fs.writeFileSync(path.join(out,'animation-math-receipt.json'),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({status:receipt.status,groups:receipt.groups.length,failed:receipt.groups.filter(g=>g.status==='failed').map(g=>g.name)}));
if(receipt.status!=='passed')process.exitCode=1;
