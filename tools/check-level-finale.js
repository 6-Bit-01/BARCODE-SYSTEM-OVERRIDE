// Production combat, input, save and traversal owners; host services only are
// supplied. Native artwork and owner Makko playtesting are separate gates.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
function rig() {
  const r = createRig(), storage = new Map();
  r.w.localStorage = { getItem: k => storage.get(k) || null, setItem: (k,v) => storage.set(k,v) };
  for (const file of ['src/game/lore-collection.js','src/game/level-difficulty.js','src/game/combat-fx.js','src/game/level-01-stage-fx.js']) load(r.context,file);
  r.w.lostDataSystem.archive = new r.w.BARCODE.LoreCollection();
  return {...r,storage};
}
function enemy(w, x=1700, y=258) {
  const e = new w.Enemy(x,y,'virus');
  Object.assign(e.position,{x,y}); Object.assign(e,{entranceComplete:true,spawnProtectionDuration:0,spawnTimeMs:-10000,_sector1MissionEnemy:true});
  return e;
}
// The pulse visibly reaches the boss body while its center lies outside the
// radius. Both street and roof attacks use the actual rhythm transaction.
for (const y of [784,286,-272]) {
  const r=rig(),{w,p}=r; r.reachReady(); p.beginBossCombat();
  Object.assign(p.boss,{x:2700,y,phase:'recovery',canReceiveDamage:true});
  Object.assign(w.player.position,{x:2400,y}); w.player.grounded=true; w.rhythmSystem.show();
  assert(p.getBossRhythmTarget(w.player,260).inRange);
  assert(!p.getBossRhythmTarget(w.player,200).inRange);
  const result=r.beat(); assert(result.targets.some(t=>t.type==='boss'),'body-edge rhythm hit'); assert.equal(p.boss.health,9);
  p.boss.phase='telegraph'; p.boss.canReceiveDamage=false;
  r.beat(); assert.equal(p.boss.health,9,'musical guard remains meaningful');
}
// A descending edge catch is forgiving; upward body contact is never a stomp.
for (const descending of [true,false]) {
  const {w}=rig(); w.sector1Progression=null; w.rhythmSystem.hide();
  const e=enemy(w,1000,784); w.enemyManager.enemies=[e]; const box=e.getStompBox();
  const x=box.x-23; Object.assign(w.player.position,{x,y:box.y+12-72});
  w.player.velocity.y=descending?100:-100;
  w.player.contactSweep={previousX:x,currentX:x,previousFootY:box.y+8,currentFootY:box.y+12};
  w.enemyManager.checkCollisions(w.player);
  assert.equal(e.active,!descending); if(descending)assert.equal(w.player.health,3);
}
// Brief shallow overlap clears the body safely; sustained pressure and deep
// overlap still hurt. Every pass separates the original, stable hulls.
for (const depth of [3,14]) {
  const {w}=rig(); w.sector1Progression=null; w.rhythmSystem.hide();
  const e=enemy(w,1000,784); w.enemyManager.enemies=[e];
  const place=()=>{const pb=w.player.getHitbox(),eb=e.getHitbox();w.player.position.x+=eb.x-(pb.x+pb.width)+depth;};
  place(); w.enemyManager.checkCollisions(w.player);
  assert.equal(w.player.health,depth===3?3:2);
  assert(!w.enemyManager.simpleAABBcollision(w.player.getHitbox(),e.getHitbox()));
  if(depth===3){for(let i=1;i<=7;i++){w.enemyManager.hostileSimulationTimeMs=i*16;place();w.enemyManager.checkCollisions(w.player);}assert.equal(w.player.health,2,'sustained edge pressure is not invulnerability');}
}
// Selection consumes held keys, changes real health/hostile time and stays
// locked through boss retry. New genres own independent profiles and values.
{
  const r=rig(),{w,p,context,listeners}=r,d=w.BARCODE.LevelDifficulty;
  load(context,'src/core/action-input.js');load(context,'src/core/input.js');w.inputManager=new w.InputManager();
  d.beginLevel();d.select(0);const event={key:' ',preventDefault(){}};
  listeners.keydown.forEach(fn=>fn(event));assert(d.locked&&!d.open);assert.equal(w.player.maxHealth,4);
  listeners.keydown.forEach(fn=>fn({...event,repeat:true}));w.inputManager.update();assert(!w.inputManager.actionInput.state.jump?.pressed);
  listeners.keyup.forEach(fn=>fn(event));assert(!d.select(2));assert(!d.confirm());
  assert.equal(d.getHostileScale(),.86);r.reachReady();p.beginBossCombat();
  w.player.health=0;w.gameState.gameOver=true;w.gameState.running=false;
  assert(p.retryBossCheckpoint().ok);assert(d.locked&&!d.open);assert.equal(w.player.health,4);
  assert(d.registerLevel('level-02',{title:'NEXT LEVEL',choices:[1,2,3].map(n=>({id:'genre-'+n,label:'Genre '+n,description:'Different rules.',value:n*4,health:3,hostileScale:1}))}));
  assert(!d.registerLevel('level-01',d.profile()),'cannot rewrite active profile');
  d.beginLevel('level-02');d.select(2);d.confirm();d.complete();
  assert.equal(w.lostDataSystem.archive.getRewardFacts().challengeValue,12);
}
// Save merges retain all discoveries, one best completion per level and the
// old cat fact. Upgrading the event does not award a duplicate Studio Rat.
{
  const {w,storage}=rig(),A=w.BARCODE.LoreCollection,a=new A(),b=new A();
  a.collectEgg('egg.l01.studio-rat');assert(!a.hasStudioRatEvent('level-01'));
  a.completeStudioRatEvent('level-01');assert(!a.completeStudioRatEvent('level-01'));
  a.recordLevelChallenge('level-01','standard',2);b.recordLevelChallenge('level-02','hard',8);b.collect('lore.l01.01');
  a.recordLevelChallenge('level-01','hard',3);assert(!a.recordLevelChallenge('level-01','relaxed',1));
  for(let i=2;i<=7;i++)a.completeStudioRatEvent('level-0'+i);
  const saved=new A(),facts=saved.getRewardFacts();assert.equal(facts.challengeValue,11);assert.equal(facts.studioRats.length,7);assert.equal(facts.lore.length,1);
  assert.equal(saved.record.progress.completedLevels.length,2);
  const key='barcode.system-override.save.v1.default',raw=JSON.parse(storage.get(key));raw.progress.levelChallenges.bad=null;raw.progress.levelChallenges['level-03']={value:'3'};storage.set(key,JSON.stringify(raw));
  assert.equal(new A().getRewardFacts().challengeValue,11,'invalid new facts cannot break loading or add rewards');
}
// The boss allowance counts actual exposure, not frame count. A brief graze
// escapes; a proper overlap hits once even if that car already hit the player.
for(const fps of [30,60,120]) {
  const r=rig(),{w,p,context}=r;r.reachReady();p.beginBossCombat();
  load(context,'src/engine/traffic-sheets.js');load(context,'src/engine/spaceships.js');
  w.SpaceShipSystem.prototype.loadShipImages=function(){};
  const t=w.spaceShipSystem=new w.SpaceShipSystem();t.imagesLoaded=[true,true,true];
  const ship=t.createForegroundShip();const hull=t.getHazardBody(ship);
  p.boss.canReceiveDamage=false;p.boss.phase='telegraph';ship.hit=true;
  const body={x:hull.x+30,y:hull.y+10,width:50,height:80};
  for(let age=0;age<34;){const dt=Math.min(1000/fps,34-age);t.checkBossTrafficContact(ship,hull,body,body,dt);age+=dt;}
  assert.equal(p.boss.health,10,'34 ms graze escapes');
  const away={...body,y:hull.y-300};t.checkBossTrafficContact(ship,hull,away,away,16);assert.equal(ship.bossExposureMs,0);
  for(let age=0;age<100;age+=1000/fps)t.checkBossTrafficContact(ship,hull,body,body,1000/fps);
  assert.equal(p.boss.health,9);assert(ship.bossHit,'independent boss hit latch');
  t.checkBossTrafficContact(ship,hull,body,body,1000);assert.equal(p.boss.health,9);
  w.player.health=0;w.gameState.gameOver=true;w.gameState.running=false;p.retryBossCheckpoint();
  assert.equal(t.ships.length,0);assert.equal(t.pendingForeground.length,0,'retry restarts warned approaches');
}
// Real enemy defeat once, no ally theft, and a border gag in a cleared room.
for(const target of ['enemy','ally','none']) {
  const {w,p}=rig();p.startMission();p.state='encounter_2';p.closedGateEncounterId=null;
  Object.assign(w.player.position,{x:1680,y:258});w.player.grounded=true;w.gameCamera.centerX=1680;
  const e=enemy(w);if(target==='ally')e._hijackedUntilMs=100000;
  w.enemyManager.enemies=target==='none'?[]:[e];
  const stage=w.BARCODE.stageFX;stage.reset(p);stage.update(16);assert(stage.inspect().ok);
  const before=p.missionDefeats;w.gameState.paused=true;stage.update(2000);assert.equal(stage.ratAge,0);w.gameState.paused=false;
  stage.update(1700);assert.equal(p.missionDefeats,before+(target==='enemy'?1:0));
  if(target!=='enemy')assert(!stage.ratEvent.victim);
  stage.update(100);if(!e.active)w.enemyManager.recordDefeat(e);assert.equal(p.missionDefeats,before+(target==='enemy'?1:0),'drag cannot double-credit defeat');
  stage.update(4500);assert.equal(stage.ratEvent,null);stage.inspect();stage.inspect();assert.equal(stage.findNearby(),null);
  stage.reset(p);assert.equal(stage.ratAge,null);assert(stage.archive().hasStudioRatEvent('level-01'));
}
// Fixed shaft extents at every stop, cabin over track, centered foot plane,
// two beats, powered/reverse motion, pause and reset use the traversal owner.
{
  const {w,p}=rig();p.startMission();p.state='encounter_2';const lift=p.signalLift;
  Object.assign(w.player.position,{x:lift.x+lift.w/2,y:lift.y-72});w.player.supportedSurfaceId=lift.id;w.player.grounded=true;
  let draws=[];w.BARCODE.PresentationAssets={draw:(name,ctx,options)=>{draws.push({name,...options});return true;}};
  const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})});let expected;
  for(const y of [856,610,358]){lift.y=y;draws=[];p.drawSignalLift(ctx);const track=draws.filter(x=>x.name==='liftTrack').map(x=>x.y);if(expected)assert.deepStrictEqual(track,expected);expected=track;assert.equal(draws.at(-1).name,'liftCabin');assert.equal(draws.at(-1).y,y);}
  lift.y=856;p.chargeSignalLift();assert.equal(lift.charges,1);p.chargeSignalLift();p.updateSignalLift(100);
  assert(lift.y<856&&lift.driveTimeMs>0);assert.equal(w.player.position.y+72,lift.y);
  const clock=lift.driveTimeMs;w.gameState.paused=true;p.update(100);assert.equal(lift.driveTimeMs,clock);w.gameState.paused=false;
  lift.state='returning';p.updateSignalLift(40);assert.equal(lift.driveTimeMs,clock-40);
  p.resetSignalLift();assert.equal(p.signalLift.driveTimeMs,0);
  Object.assign(w.player.position,{x:2366,y:784});w.player.grounded=true;w.BARCODE.stageFX.reset(p);
  assert.equal(w.BARCODE.stageFX.findNearby()?.id,'egg.l01.cliff-maintenance');
}
console.log('Finale: boss body-edge rhythm on street/roofs, forgiving real contacts, locked difficulty/retry, per-level durable rewards, single-credit cat rescue, full fixed shaft and powered/reverse/pause lifecycle passed.');
