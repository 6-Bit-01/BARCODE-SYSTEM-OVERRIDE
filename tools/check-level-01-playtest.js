// Consequential regression checks against the production movement/input owners.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
function rig() {
  const r=createRig(); r.p.startMission(); r.w.rhythmSystem.hideRhythmMode();
  r.p.state='jammer_active'; r.p.closedGateEncounterId=null;
  return r;
}
function actor(r,type,x,y=r.w.Player.GROUND_Y) {
  const e=new r.w.Enemy(x,y,type); Object.assign(e.position,{x,y});
  Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,_sector1MissionEnemy:true,spawnTimeMs:-10000,spawnProtectionDuration:0});
  e.velocity.x=e.velocity.y=0; r.w.enemyManager.enemies.push(e); return e;
}
for (const mode of ['recovery','hack','reboot','ally','wall']) {
  const r=rig(), {w,p}=r, m=w.enemyManager, hero=w.player;
  hero.position.x=1000; hero.position.y=w.Player.GROUND_Y;
  const e=actor(r,'firewall',1000);
  if(mode==='recovery') hero.invulnerableUntil=999999;
  if(mode==='hack') {load(r.context,'src/game/hacking.js');w.hackingSystem=new w.HackingSystem();w.hackingSystem.active=true;w.hackingSystem.guardHitsRemaining=1;}
  if(mode==='reboot') e._hijackRebootUntilMs=1000;
  if(mode==='ally') e._hijackedUntilMs=8000;
  if(mode==='wall') {p.state='encounter_1';p.closedGateEncounterId='encounter_1';hero.position.x=1277;e.position.x=1250;hero.invulnerableUntil=999999;}
  const health=hero.health; m.checkCollisions(hero);
  assert(!m.simpleAABBcollision(hero.getHitbox(),e.getHitbox()),`${mode}: no unresolved body overlap`);
  assert.strictEqual(hero.health,health,`${mode}: no surprise damage`);
  assert.strictEqual(hero.position.y,w.Player.GROUND_Y,`${mode}: cannot stand on enemy`);
}
for(const fps of [30,60,120]) {
  const r=rig(),e=actor(r,'firewall',1600); e._sector1MissionEnemy=false;
  r.w.player.position.x=500; e.proximityAttackRange=0; e._behaviorInit=true;e._nextIdlePause=Infinity;e._aggressionLevel=1.5;
  const start=e.position.x;
  for(let i=0;i<fps;i++)e.update(1000/fps,r.w.player);
  assert(Math.abs(start-e.position.x-105)<0.2,`${fps}Hz: Firewall integrates steady walk once`);
  assert.strictEqual(e.facing,-1,'leftward walking faces left');
  const prior=e.position.x;r.w.player.position.x=3000;e.update(1000/fps,r.w.player);
  assert(e.position.x>prior&&e.facing===1,'turn follows actual travel');
}
// Every new upward link is exercised by the real single-jump substeps.
const routes=[
  [1160,856,1160,'signal-street-step'],[1160,650,1160,'signal-awning'],[1160,492,1160,'signal-roof'],
  [730,234,600,'west-service-step'],[570,20,470,'west-crown'],
  [1460,856,1460,'cache-street-step'],[1450,632,1450,'cache-maintenance-step'],[1480,410,1620,'cache-awning'],
  [1620,330,1620,'cache-access'],[1620,98,1620,'cache-crown'],
  [2300,856,2300,'plaza-service-step'],[2320,592,2320,'firewall-canopy'],
  [2400,358,2430,'plaza-upper-step'],[2430,142,2400,'firewall-roof'],
  [3040,196,3070,'relay-upper-step'],[3220,856,3220,'tower-utility-unit'],
  [3280,650,3410,'tower-awning'],[3400,502,3400,'tower-rooftop'],[3400,275,3400,'tower-service-step'],
  [3400,30,3500,'tower-upper-step'],[3500,-174,3500,'tower-crown'],
  [3900,502,3900,'broadcast-service-step'],[3900,260,3940,'broadcast-upper-step'],[3940,38,3940,'broadcast-crown']
];
for(const fps of [30,60,120]) for(const [x,y,target,id] of routes) {
  const {w}=rig(),hero=w.player;
  Object.assign(hero.position,{x,y:y-72});hero.grounded=true;hero.allowMovement=true;hero.isJumpHeld=()=>true;assert(hero.jump(),id+' takes off');
  let landed=false;
  for(let i=0;i<fps*3;i++) {
    if(hero.position.x<target-6)hero.moveRight();else if(hero.position.x>target+6)hero.moveLeft();else hero.stopHorizontal();
    hero.update(1000/fps);
    if(hero.grounded){landed=hero.supportedSurfaceId===id;break;}
  }
  assert(landed,`${fps}Hz ${id}: actual landing ${hero.supportedSurfaceId} at ${hero.position.x},${hero.position.y+72}`);
}
for(const allied of [false,true]) {
  const r=rig(),e=actor(r,'firewall',3440,275-72); e.supportedSurfaceId='tower-rooftop';
  if(allied)e._hijackedUntilMs=8000;
  const target={position:{x:3700,y:275-72}};
  for(let i=0;i<120;i++)e.update(1000/60,target);
  assert.strictEqual(e.supportedSurfaceId,'tower-rooftop',`${allied?'ally':'hostile'} retains rooftop support`);
}
{
  const r=rig(),{w,p}=r;load(r.context,'src/game/hacking.js');w.hackingSystem=new w.HackingSystem();
  actor(r,'virus',1000); const h=w.hackingSystem;
  assert(h.start());h.useKeypad();h.puzzleType=2;h.update(1000);h.update(h.displayTime);
  assert(h.answerDurationMs>=12000,'navigation receives its own answer budget');
  w.document.getElementById=()=>({getBoundingClientRect:()=>({left:80,top:40,width:960,height:540})});
  for(const digit of h.currentPuzzle.answer) {const k=h.getKeypad().find(k=>k.key===digit);h.pointerInput({clientX:80+(k.x+30)/2,clientY:40+(k.y+30)/2});}
  const submit=h.getKeypad().find(k=>k.key==='Enter');h.pointerInput({clientX:80+(submit.x+30)/2,clientY:40+(submit.y+30)/2});
  assert.strictEqual(h.resultFx.outcome,'success','CSS-scaled touch/pointer keypad solves real puzzle');
  load(r.context,'src/engine/spaceships.js');w.SpaceShipSystem.prototype.loadShipImages=function(){};
  const traffic=w.spaceShipSystem=new w.SpaceShipSystem();h.active=false;
  assert(traffic.queueHazard());const car=traffic.hazards[0],before=w.player.health;
  for(let i=0;i<24;i++)traffic.updateHazards(100);
  assert.strictEqual(car.phase,'warning');assert.strictEqual(w.player.health,before);
  traffic.updateHazards(100);assert.strictEqual(car.phase,'moving');
  car.x=w.player.position.x-100;car.y=w.player.getHitbox().y+80;traffic.updateHazards(100);
  assert.strictEqual(w.player.health,before-1,'warned traffic damages exactly one bar');
  traffic.updateHazards(100);assert.strictEqual(w.player.health,before-1,'same car cannot chain damage');
  const x=car.x;w.isPaused=true;traffic.updateHazards(100);assert.strictEqual(car.x,x);w.isPaused=false;
  h.active=true;traffic.updateHazards(100);assert.strictEqual(car.x,x,'puzzle owns input without unavoidable traffic damage');
  h.active=false;traffic.updateHazards(100);assert.strictEqual(car.phase,'warning','traffic warns again after terminal releases controls');
  p.touchBarrier(w.Sector1Progression.ENCOUNTER_GATES[0],700,'push');assert(p.barrierContacts.length);
  p.reset();traffic.resetRuntime();assert.strictEqual(p.barrierContacts.length,0);assert.strictEqual(traffic.hazards.length,0);
}
console.log('Playtest pass: contact clearance, Firewall cadence, 72 production route jumps, rooftop AI, pointer hacking, traffic and reset passed.');
