// Compare the restored cars to archived production code, then exercise actual
// contact, camera projection and puzzle owners. No hosted-render/audio claim.
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const {createRig,load} = require('./check-level-01-boss');
function rig(legacy=false, seed=12345) {
  const r=createRig(), {w,p,context}=r;
  p.startMission();p.state='encounter_2';p.closedGateEncounterId=null;w.rhythmSystem.hideRhythmMode();
  load(context,'src/engine/traffic-sheets.js');
  if(legacy) vm.runInContext(fs.readFileSync(__dirname+'/fixtures/original-traffic-6e375.js','utf8'),context);
  else load(context,'src/engine/spaceships.js');
  vm.runInContext(`Math.random=(()=>{let s=${seed};return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};})()`,context);
  w.SpaceShipSystem.prototype.loadShipImages=function(){};
  const traffic=w.spaceShipSystem=new w.SpaceShipSystem();
  traffic.imagesLoaded=[true,true,true];traffic.shipImages=[{},{},{}];traffic.shipSheets=w.BARCODE.trafficSheets;
  return {...r,traffic};
}
const fields=['x','y','size','speed','depth','direction','shipType','opacity','flipH','rotation','bobOffset','bobAmount','animationSpeed'];
const shape=s=>Object.fromEntries(fields.map(f=>[f,s[f]]));
for(let seed=1;seed<=80;seed++) {
  const old=rig(true,seed), current=rig(false,seed);
  old.traffic.createForegroundShip();const a=old.traffic.ships[0],b=current.traffic.createForegroundShip();
  assert.deepStrictEqual(shape(b),shape(a),'every original foreground property matches');
  assert.strictEqual(Math.abs(b.speed)*60,4350);assert.strictEqual(b.size,690);
  assert(b.y>=-400&&b.y<=0);
  old.traffic.spawnShip=()=>{};current.traffic.spawnShip=()=>{};
  for(let frame=0;frame<60;frame++){old.traffic.update(1000/60);current.traffic.update(1000/60);}
  assert.strictEqual(b.x,a.x,'one second of original motion remains identical');
  assert.strictEqual(b.animationElapsedMs,a.animationElapsedMs);
}
for(const fps of [30,60,120]) {
  const {w,traffic}=rig();traffic.spawnShip=()=>{};
  const car=traffic.createForegroundShip(true),x=car.x;
  w.isPaused=true;traffic.update(9000);assert.strictEqual(car.launchInMs,3000);assert.strictEqual(car.x,x);w.isPaused=false;
  for(let i=0;i<fps*3;i++)traffic.update(1000/fps);
  if(!traffic.ships.length)traffic.update(.000001);
  assert(traffic.ships.includes(car),'original approach completes at three seconds');
  assert(Math.abs(car.x-x)<.001,'waiting does not move or rescale the car');
  w.hackingSystem.active=true;traffic.update(1000/fps);
  assert(Math.abs(car.x-x-car.speed*60/fps)<.001,'puzzle does not reset or slow traffic');
}
for(const direction of [-1,1]) for(const protection of [false,true]) {
  const {w,traffic}=rig();traffic.spawnShip=()=>{};
  const car=traffic.createForegroundShip();Object.assign(car,{direction,speed:72.5*direction,flipH:direction<0,y:-200});
  w.player.position.x=2300;
  const body=traffic.getHazardBody(car),playerBody=w.player.getHitbox();
  w.player.position.y+=body.y-playerBody.y;
  const projected=traffic.getTrafficPlayerBody();
  assert(Math.abs(projected.x-(w.player.getHitbox().x+960-2300))<.001,'player uses the original horizontal car render layer');
  car.x+=projected.x-body.x-direction*550;
  let hits=0;w.player.takeDamageWithKnockback=(damage,kx,ky,source)=>{hits++;assert.strictEqual(Math.sign(source.x-w.player.position.x),-direction,'damage cue names the approach side');return true;};w.hackingSystem.active=protection;
  traffic.update(250);assert.strictEqual(hits,protection?0:1,'swept hull catches a fast pass in both directions');
  w.hackingSystem.active=false;traffic.update(1);assert.strictEqual(hits,protection?0:1,'protected contact cannot become a delayed hit');
}
{
  const {w,p}=rig(),roof=p.getStageSurfaces().find(s=>s.id==='cache-crown');
  const enemy=new w.Enemy(roof.x+roof.w-45,roof.y-72,'firewall');
  Object.assign(enemy.position,{x:roof.x+roof.w-45,y:roof.y-72});
  Object.assign(enemy,{_sector1MissionEnemy:true,entranceComplete:true,supportedSurfaceId:roof.id,spawnProtectionDuration:0});
  w.enemyManager.enemies=[enemy];Object.assign(w.player.position,{x:enemy.position.x-10,y:roof.y-72});
  w.player.invulnerableUntil=Infinity;
  for(let i=0;i<180;i++) {
    w.enemyManager.simulationTimeMs=i*1000/60;enemy.update(1000/60,w.player,i*1000/60);w.enemyManager.checkCollisions(w.player);
    assert(enemy.position.x>=roof.x+45&&enemy.position.x<=roof.x+roof.w-45,'contact preserves guard support limits');
    assert.strictEqual(enemy.position.y,roof.y-72);
    assert(!w.enemyManager.simpleAABBcollision(w.player.getHitbox(),enemy.getHitbox()),'no repeated clamped overlap');
  }
}
for(const puzzleType of [1,2]) {
  const {w,p,context}=rig();load(context,'src/game/hacking.js');p.isGameplaySuppressed=()=>false;
  Object.assign(w.tutorialSystem,{active:true,completed:false,storyChapter:3});
  const h=w.hackingSystem=new w.HackingSystem();assert(h.start());h.puzzleType=puzzleType;
  h.update(h.bootDurationMs);h.update(h.displayTime);assert.strictEqual(h.phase,'answer');
  h.update(120000);assert(h.active&&h.getPresentation().untimed,'practice answer entry stays available');
  const duration=h.answerDurationMs;h.useKeypad();assert.strictEqual(h.answerDurationMs,duration,'input device cannot change the deadline');
  for(const digit of h.answer) {h.keypadIndex=h.getKeypad().findIndex(k=>k.key===digit);h.activateKeypad();}
  h.keypadIndex=11;h.activateKeypad();assert(!h.active&&h.resultFx.outcome==='success','both puzzles submit through the shared keypad');
}
// Three seconds before visible entry, at the real projected approach height.
// Full artwork bounds (not collision insets) end the cue on first appearance.
for (const fps of [30, 60, 120]) for (const direction of [-1, 1]) for (const zoom of [.625, 1, 1.2]) {
  const {w, traffic} = rig(); traffic.spawnShip = () => {};
  w.gameCamera.y = -600; w.BARCODE.sceneProjection = { matrix: { a: zoom, d: zoom, e: 960 * (1 - zoom), f: 675 * (1 - zoom) } };
  const car = traffic.createForegroundShip(true);
  Object.assign(car, { direction, speed: 72.5 * direction, flipH: direction < 0, x: direction > 0 ? -2370 : 4290, y: -200, bobAmount: 0 });
  let first = null, last = null, entry = null;
  const step = 1000 / fps;
  for (let i = 0; i < fps * 5; i++) {
    const warnings = traffic.getTrafficWarnings(), m = traffic.getTrafficProjection();
    const hull = traffic.getHazardBody(car, traffic.elapsedMs, false);
    const distance = direction > 0 ? -(hull.x + hull.width) * m.a - m.e : hull.x * m.a + m.e - 1920;
    if (distance <= 0 && entry === null) entry = traffic.elapsedMs;
    if (warnings.length) {
      if (first === null) first = traffic.elapsedMs;
      last = traffic.elapsedMs;
      assert.equal(warnings[0].side, direction > 0 ? 'left' : 'right');
      assert(Math.abs(warnings[0].y - ((hull.y + hull.height / 2) * zoom + m.f)) < .001, 'arrow matches real projected car height');
      assert(warnings[0].entryInMs <= 3000 + .001);
    } else if (first !== null && entry === null) assert.fail('warning disappeared before the car entered');
    if (entry !== null) { assert.equal(warnings.length, 0, 'cue ends when artwork first appears'); break; }
    traffic.update(step);
  }
  assert(first !== null && entry !== null);
  assert(Math.abs(entry - first - 3000) <= step + .01, 'warning lasts three seconds within one frame');
  assert(Math.abs(entry - last - step) < .01, 'no gap before first visible car frame');
}
{
  const {w, traffic} = rig(); traffic.spawnShip = () => {};
  w.gameCamera.y = -600; w.BARCODE.sceneProjection = { matrix: { a: 1, d: 1, e: 0, f: 0 } };
  const car = traffic.createForegroundShip(true); car.y = -200;
  traffic.update(1000); const before = traffic.getTrafficWarnings(); assert.equal(before.length, 1);
  w.gameState.paused = true; const clock = traffic.elapsedMs; traffic.update(9000);
  assert.equal(traffic.elapsedMs, clock); assert.equal(traffic.getTrafficWarnings()[0].entryInMs, before[0].entryInMs, 'pause freezes warning and arrival together'); w.gameState.paused = false;
  w.gameCamera.y -= 180; assert(Math.abs(traffic.getTrafficWarnings()[0].y - before[0].y - 180) < .001, 'arrow follows vertical camera');
  car.y = -5000; assert.equal(traffic.getTrafficWarnings().length, 0, 'off-view flight is not falsely warned at another height'); car.y = -200;
  let draws = [], scales = [], texts = [];
  const ctx = new Proxy({ drawImage(...args) { draws.push(args); }, scale(...args) { scales.push(args); }, fillText(text) { texts.push(text); } }, {get(target,key) { return target[key] || (() => {}); }});
  traffic.warningImage = {}; car.direction = 1; car.speed = 72.5; car.x = -2370;
  traffic.drawTrafficWarnings(ctx); assert.equal(draws.length, 2); assert.equal(scales.length, 0, 'left arrow uses authored direction');
  draws = []; car.direction = -1; car.speed = -72.5; car.x = 4290;
  traffic.drawTrafficWarnings(ctx); assert.equal(draws.length, 2); assert.deepStrictEqual(scales, [[-1,1]], 'only arrow is mirrored after readable label draw');
  traffic.warningImage = null; traffic.drawTrafficWarnings(ctx); assert(texts.includes('WATCH OUT'), 'asset failure retains warning');
  traffic.resetRuntime(); assert.equal(traffic.getTrafficWarnings().length, 0, 'reset clears pending warning');
}
console.log('Correction: 80 original car comparisons; exact speed/height/scale/bob; 30/60/120Hz approach/pause; projected swept contact/protection; roof contact; both untimed keypad practices and 18 three-second/height/direction warning trajectories passed.');
