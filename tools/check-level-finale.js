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
  const stage=w.BARCODE.stageFX;stage.reset(p);
  Object.assign(w.player.position,{x:stage.ratSpot.x,y:stage.ratSpot.y-72});w.player.grounded=true;w.gameCamera.centerX=stage.ratSpot.x;
  const e=enemy(w,stage.ratSpot.x+20,stage.ratSpot.y-72);if(target==='ally')e._hijackedUntilMs=100000;
  w.enemyManager.enemies=target==='none'?[]:[e];
  stage.update(16);assert(stage.inspect().ok);
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
  for(const y of [856,610,358,59]){lift.y=y;draws=[];p.drawSignalLift(ctx);const track=draws.filter(x=>x.name==='liftTrack').map(x=>x.y);if(expected)assert.deepStrictEqual(track,expected);expected=track;assert.equal(draws.at(-1).name,'liftCabin');assert.equal(draws.at(-1).y,y);}
  lift.y=856;p.chargeSignalLift();assert.equal(lift.charges,1);p.chargeSignalLift();p.updateSignalLift(100);
  assert(lift.y<856&&lift.driveTimeMs>0);assert.equal(w.player.position.y+72,lift.y);
  const clock=lift.driveTimeMs;w.gameState.paused=true;p.update(100);assert.equal(lift.driveTimeMs,clock);w.gameState.paused=false;
  lift.state='returning';p.updateSignalLift(40);assert.equal(lift.driveTimeMs,clock-40);
  p.resetSignalLift();assert.equal(p.signalLift.driveTimeMs,0);
  Object.assign(w.player.position,{x:2300,y:784});w.player.grounded=true;w.BARCODE.stageFX.reset(p);
  assert.equal(w.BARCODE.stageFX.findNearby()?.id,'egg.l01.cliff-maintenance');
}
console.log('Finale: boss body-edge rhythm on street/roofs, forgiving real contacts, locked difficulty/retry, per-level durable rewards, single-credit cat rescue, full fixed shaft and powered/reverse/pause lifecycle passed.');

// Exercise actual jump integration and animation against the moving cabin.
// The complete illustrated roof is solid; static ledges now bonk as well.
const { createSprite, playerClips } = require('./makko-animation-fixture');
function liftRig() {
  const r = rig(), {w,p} = r;
  p.startMission(); p.state='encounter_3'; p.closedGateEncounterId=null; p.spawnedEncounterIds.add(p.state);
  w.rhythmSystem.hideRhythmMode(); w.enemyManager.enemies=[];
  w.player.sprite=createSprite(playerClips); w.player.spriteReady=true; w.player.playAnimation('idle');
  w.player.allowMovement=true; w.player.isJumpHeld=()=>true;
  return r;
}
for (const fps of [30,60,120]) {
  for (const facing of [-1,1]) for (const scenario of ['inside','left-post','right-post','clear-right','upper-route']) {
    const {w,p}=liftRig(), actor=w.player, lift=p.signalLift;
    const x=scenario==='inside'?lift.x+lift.w/2:scenario==='left-post'?lift.x+8:scenario==='right-post'?lift.x+lift.w-8:scenario==='clear-right'?lift.x+lift.w+100:1100;
    Object.assign(actor.position,{x,y:scenario==='upper-route'?492-72:784});
    actor.grounded=true; actor.supportedSurfaceId=scenario==='inside'?lift.id:null;
    actor.facing=facing;
    const health=actor.health; let contacts=0, rise=0; const start=actor.position.y;
    assert(actor.jump());
    for(let i=0;i<fps*.65;i++) {
      const before=actor.liftHeadContact;
      actor.update(1000/fps,true); p.updateSignalLift(1000/fps);
      if(actor.liftHeadContact&&!before)contacts++;
      rise=Math.max(rise,start-actor.position.y);
      if(actor.liftHeadContact)assert(actor.getCeilingProbe().y>=p.getLiftRoof().y-0.001,'cap meets the real underside without clipping');
      assert.equal(actor.health,health,'head contact cannot deal damage');
      assert.equal(actor.controlsDisabled,false,'head contact cannot stun');
    }
    assert.equal(contacts,['inside','left-post','right-post'].includes(scenario)?1:0,`${fps}fps ${scenario}: the entire roof catches an upward cap`);
    assert(scenario==='clear-right'?rise>240:rise<100,`${fps}fps ${scenario}: visible overhead surfaces bonk; clear jumps retain height (${rise})`);
    assert.equal(w.gameState.gameOver,false);
  }
  // Carrying the standing player is not a jump; changing cabin position must
  // not bump them. The floor must meet the actual roof, not the lower canopy.
  const {w,p}=liftRig(), actor=w.player, lift=p.signalLift;
  Object.assign(actor.position,{x:lift.x+lift.w/2,y:784});actor.grounded=true;actor.supportedSurfaceId=lift.id;
  p.chargeSignalLift();p.chargeSignalLift();
  for(let i=0;i<fps*4;i++){actor.update(1000/fps,true);p.updateSignalLift(1000/fps);assert(!actor.liftHeadContact);}
  const destination=p.getStageSurfaces().find(s=>s.id==='firewall-roof');
  assert.equal(lift.y,destination.y);assert(Math.abs(actor.position.y+72-destination.y)<0.001,'lift floor aligns with actual rooftop');
  assert.equal(actor.supportedSurfaceId,destination.id,'standing passenger transfers onto rooftop');
  // Real grounded movement, with no jump, carries the rider left out of the
  // cabin; returning carriage must not pull them down through the roof.
  for(let i=0;i<fps*.6;i++){actor.moveLeft();actor.update(1000/fps,true);p.updateSignalLift(1000/fps);assert(actor.grounded);assert.equal(actor.supportedSurfaceId,destination.id);}
  assert(actor.position.x<lift.x-18,'passenger walks completely out of the cabin');
  assert.equal(actor.position.y+72,destination.y);
  for(const state of ['moving','returning']) {
    const {w,p}=liftRig(), actor=w.player, lift=p.signalLift;
    lift.y=lift.prevY=700;lift.state=state;
    Object.assign(actor.position,{x:lift.x+lift.w/2,y:700-72});actor.grounded=true;actor.supportedSurfaceId=lift.id;
    actor.jump();let contact=false;
    for(let i=0;i<fps*.5;i++){actor.update(1000/fps,true);p.updateSignalLift(1000/fps);contact ||= !!actor.liftHeadContact;}
    assert(contact,`${fps}fps moving roof ${state}: relative sweep catches the cap`);
    assert.equal(actor.health,3);assert(!actor.controlsDisabled);
  }
}
{
  const {w,p}=liftRig(), actor=w.player, lift=p.signalLift, roof=p.getLiftRoof();
  Object.assign(actor.position,{x:lift.x+lift.w/2,y:roof.topY-72-12});actor.grounded=false;actor.velocity.y=200;
  actor.update(100,true);p.updateSignalLift(100);
  assert.equal(actor.supportedSurfaceId,roof.id,'visible solid roof also supports a landing from above');
  lift.state='moving';p.updateSignalLift(100);
  assert(Math.abs(actor.position.y+72-p.getLiftRoof().topY)<0.001,'roof rider moves with the same carriage');
  assert.equal(p.chargeSignalLift().ok,false,'roof landing does not power the cabin');
  p.resetSignalLift();assert.equal(actor.supportedSurfaceId,null);
}
{
  const {w,p}=liftRig(), lift=p.signalLift;
  Object.assign(w.player.position,{x:lift.x+lift.w/2,y:784});w.player.grounded=true;
  p.updateSignalLift(16);assert(lift.promptVisible,'approach produces a brief HUD prompt');
  p.updateSignalLift(1900);assert(lift.promptVisible);
  const age=lift.promptAgeMs;w.gameState.paused=true;p.update(1000);assert.equal(lift.promptAgeMs,age);w.gameState.paused=false;
  p.updateSignalLift(510);assert(!lift.promptVisible,'prompt fades and expires while still aboard');
  p.updateSignalLift(5000);assert(!lift.promptVisible,'standing nearby cannot keep flashing the text');
  w.player.position.x=lift.x-400;p.updateSignalLift(1300);
  w.player.position.x=lift.x+lift.w/2;p.updateSignalLift(16);assert(lift.promptVisible,'a later approach can show the instruction again');
  w.player.position.y=-300;p.updateSignalLift(1300);assert(!lift.promptVisible,'matching X on a remote rooftop is not an approach');
  const words=[];const ctx=new Proxy({globalAlpha:1,fillText:t=>words.push(t)},{get:(o,k)=>o[k]??(()=>{})});
  p.drawSignalLift(ctx);assert.equal(words.length,0,'elevator artwork has no permanent label');
  w.player.position.y=784;p.updateSignalLift(16);p.drawLiftPrompt(ctx);assert(words.includes('RHYTHM LIFT'),'instruction belongs to the HUD pass');
  p.resetSignalLift();assert(!p.signalLift.promptVisible&&p.signalLift.promptArmed,'restart clears prompt and contact effects');
}
console.log('Lift clearance: 30/60/120Hz real jumps, visible cap contact, safe edge passes, preserved roof route, no damage/stun, roof landing/carry, brief altitude-aware HUD prompt and pause/reset passed.');

// An old save must not remove the cat from later runs. Exercise every random
// slot against production support geometry, plus actual inspection and save.
{
  const {w,p,context}=rig();p.startMission();p.state='encounter_2';p.closedGateEncounterId=null;
  const stage=w.BARCODE.stageFX, archive=stage.archive();archive.completeStudioRatEvent('level-01');
  const revision=archive.record.revision, positions=new Set();w.enemyManager.enemies=[];
  w.Math=Object.create(Math);
  for(let i=0;i<6;i++){
    w.Math.random=()=>(i+.5)/6;
    stage.reset(p);const spot=stage.ratSpot;positions.add(spot.x+','+spot.y);
    const support=p.getStageSurfaces().find(s=>s.id===spot.surfaceId);
    assert(support&&support.y===spot.y&&spot.x-60>support.x&&spot.x+60<support.x+support.w,'random perch has solid support and edge clearance');
    Object.assign(w.player.position,{x:spot.x,y:spot.y-72});w.player.grounded=true;w.gameCamera.centerX=spot.x;
    stage.update(16);assert.equal(stage.findNearby()?.id,'egg.l01.studio-rat','saved discovery cannot hide this run\'s cat');
    const drawings=[];w.BARCODE.PresentationAssets={draw:(name,ctx,options)=>{drawings.push(name);return true;}};
    const ctx=new Proxy({},{get:(o,k)=>o[k]??(()=>{})});stage.drawWorld(ctx);assert(drawings.includes('studioCatEvent'));
    stage.reset(p,{resume:true});assert.strictEqual(stage.ratSpot,spot,'checkpoint keeps selected spot');
    assert(stage.inspect().ok);assert(stage.ratEvent);assert(stage.ratRunConsumed);
    assert.equal(archive.record.revision,revision,'reappearing cat never duplicates persistent discovery credit');
    stage.update(6300);stage.message=null;assert.equal(stage.findNearby(),null,'one encounter per run');
    stage.reset(p,{resume:true});assert.strictEqual(stage.ratSpot,spot);assert(stage.ratRunConsumed,'retry cannot farm the same event');
    stage.reset(p);assert(!stage.ratRunConsumed,'fresh level makes the cat available again');
  }
  assert.equal(positions.size,6,'random selection covers the six safe perches');
}
// The actual mission drone starts and patrols in open air beyond the steps.
// Its full descending stomp lane remains clear at both patrol endpoints.
for(const fps of [30,60,120])for(const side of ['left','right']){
  const {w,p}=liftRig();p.state='encounter_4';p.spawnedEncounterIds.add(p.state);
  const drone=p.spawnMissionEnemy({type:'virus',x:3450},'encounter_4',1);
  drone.spawnProtectionDuration=0;drone.spawnTimeMs=-10000;
  assert(drone.position.x>=drone.home.left&&drone.position.x<=drone.home.right,'spawn agrees with patrol lane');
  const obstacles=p.getStageSurfaces().filter(s=>s.y<drone.getStompBox().y&&s.y>drone.getStompBox().y-300);
  for(let i=0;i<fps*5;i++){
    drone.update(1000/fps,null,10000+i*1000/fps);
    assert(obstacles.every(s=>drone.position.x+60<s.x||drone.position.x-60>s.x+s.w),'body and stomp approach clear the visible overhead steps');
  }
  drone.position.x=drone.home[side];
  Object.assign(w.player.position,{x:drone.position.x,y:drone.getStompBox().y-72-100});
  w.player.grounded=false;w.player.supportedSurfaceId=null;w.player.velocity.y=150;
  for(let i=0;i<fps&&drone.active;i++){
    w.player.update(1000/fps,true);w.enemyManager.checkCollisions(w.player);
  }
  assert(!drone.active,`${fps}fps ${side}: descending player stomps the real mission drone without a platform interception`);
  assert(w.player.velocity.y<0,'stomp gives the normal rebound');assert.equal(w.player.health,3);
}
console.log('Level run repair: saved Studio Rat returns at six supported random perches, checkpoint stability/no duplicate credit, actual rooftop walk-off and clear drone patrol/stomps at 30/60/120Hz passed.');
