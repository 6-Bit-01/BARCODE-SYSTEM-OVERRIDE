// Production progression, enemy spawning and render cache; host services only
// are stubbed. This does not claim hosted Makko gameplay acceptance.
const assert = require('assert');
const fs = require('fs');
const { createRig, load } = require('./check-level-01-boss');

for (const fps of [30, 60, 120]) {
  const r = createRig(), { w, p } = r;
  r.reachReady(); p.beginBossCombat();
  for (const targetId of ['west-crown', 'cache-crown', 'firewall-roof', 'tower-crown', 'broadcast-crown', 'street']) {
    const target = targetId === 'street' ? { x: 600, y: 856, w: 100 } : p.getStageSurfaces().find(s => s.id === targetId);
    Object.assign(w.player.position, { x: target.x + target.w / 2, y: target.y - 72 });
    w.player.grounded = true; w.player.supportedSurfaceId = targetId === 'street' ? null : targetId;
    p.setBossCombatPhase('approach');
    let frames = 0, warnings = 0, previousJump = null;
    while ((p.boss.traversal || p.getBossSurface().id !== targetId) && frames++ < fps * 90) {
      r.tick(1000 / fps);
      const jump = p.boss.traversal;
      if (jump && jump !== previousJump) {
        warnings++; assert.strictEqual(jump.phase, 'warning', 'every leap announces its committed landing');
        assert(Math.abs(jump.x - jump.startX) <= 370, 'leaps cannot teleport across the level');
        previousJump = jump;
      }
      if (jump) {
        assert.strictEqual(p.boss.canReceiveDamage, false, 'airborne relocation is guarded');
        assert.strictEqual(p.boss.canDealDamage, false, 'landing itself is not an unannounced attack');
      }
    }
    assert(frames < fps * 90, `${fps}fps: boss reaches ${targetId}`);
    assert(warnings > 0, 'route used warned leaps');
    assert.strictEqual(p.boss.phase, 'recovery', 'each landing gives a counter window');
    assert.strictEqual(p.boss.canReceiveDamage, true);
    assert(Math.abs(p.boss.y + 72 - target.y) < 0.001, 'boss feet meet the authored support');
    if (target.w >= 400) assert(Math.abs(p.boss.x - w.player.position.x) >= 140, 'roomy roof landings leave space beside the player');
    if (targetId !== 'street') assert(p.getCameraY() < -100, 'boss combat camera follows the player above street level');
  }
  const before = { x: p.boss.x, y: p.boss.y, camera: p.cameraY };
  w.gameState.paused = true; r.tick(1000);
  assert.deepStrictEqual({ x: p.boss.x, y: p.boss.y, camera: p.cameraY }, before, 'pause stops pursuit and camera');
}

{
  const { w, p } = createRig(); p.startMission();
  load(w, 'src/game/combat-fx.js');
  for (const [id, surfaceId] of [['encounter_2', 'cache-awning'], ['encounter_4', 'tower-rooftop']]) {
    const def = w.Sector1Progression.ENCOUNTERS.find(e => e.id === id);
    p.state = id; p.spawnEncounter(def); p.updatePendingSpawns(1000);
    const drones = p.activeEncounterEnemies.filter(e => e.type === 'drone');
    assert.strictEqual(drones.length, 1, 'a real drone spawns in the first packet');
    const drone = drones[0], surface = p.getStageSurfaces().find(s => s.id === surfaceId);
    assert.strictEqual(drone._homeSurfaceId, surfaceId);
    assert.strictEqual(drone.position.y, surface.y - 182);
    w.gameCamera = { centerX: drone.position.x, y: 0 }; w.renderer.zoomLevel = 1;
    assert(w.BARCODE.combatFX.visible(drone.position.x, drone.position.y, 300), 'drone is visible from the street camera');
    let drawn = 0;
    w.BARCODE.PresentationAssets = { draw(key) { if (key === 'rooftopDrone') drawn++; return true; } };
    const ctx = new Proxy({}, { get: (o, k) => o[k] || (() => {}), set: (o, k, v) => (o[k] = v, true) });
    w.enemyManager.enemies = [drone]; w.enemyManager.draw(ctx);
    assert.strictEqual(drawn, 1, 'production enemy manager actually draws the new drone');
  }
  assert.strictEqual(p.requiredEnemyKills, 20, 'moving drones does not add mission quota');
}

{
  const { w, p } = createRig(); p.startMission();
  const points = [['west-crown', 300], ['cache-crown', 1700], ['broadcast-crown', 3990]];
  const score = w.gameState.score;
  for (const [id, x] of points) {
    const surface = p.getStageSurfaces().find(s => s.id === id);
    Object.assign(w.player.position, { x, y: surface.y - 72 }); w.player.grounded = true;
    w.player.supportedSurfaceId = null; p.updateSkyCaches(16);
    assert(!p.skyCaches.has(id.split('-')[0]), 'cache cannot be collected through a building');
    w.player.supportedSurfaceId = id; p.updateSkyCaches(16);
    const after = w.gameState.score; p.updateSkyCaches(16); assert.strictEqual(w.gameState.score, after, 'cache reward is one-time');
  }
  assert.strictEqual(p.skyCaches.size, 3); assert.strictEqual(w.gameState.score - score, 1500);
  assert.strictEqual(w.BARCODE.signalAmpCharges, 3, 'three caches grant capped existing Amp charges');
  p.reset(); assert.strictEqual(p.skyCaches.size, 0, 'fresh run resets the optional route');
}

{
  const r = createRig(), { w, p } = r; r.reachReady(); p.beginBossCombat();
  p.boss.supportedSurfaceId = 'signal-roof'; p.boss.x = 1050; p.boss.y = 254 - 72;
  p.emitBossPulse(); const pulse = p.boss.pulses[0];
  assert.strictEqual(pulse.groundY, 254); assert.strictEqual(pulse.left, 704); assert.strictEqual(pulse.right, 1322);
  let hits = 0; w.player.takeDamage = () => hits++;
  w.player.position.x = 1150; w.player.position.y = 784; p.updateBossPulses(200);
  assert.strictEqual(hits, 0, 'rooftop pulse cannot hit the street below');
  pulse.radius = 0; pulse.hit = false; w.player.position.y = 254 - 72; p.updateBossPulses(200);
  assert.strictEqual(hits, 1, 'rooftop pulse hits the actual platform plane');
  w.player.health = 0; w.gameState.gameOver = true;
  assert(p.retryBossCheckpoint().ok); assert.strictEqual(p.boss.traversal, null);
  assert.strictEqual(p.boss.supportedSurfaceId, null); assert.strictEqual(p.cameraY, 0);
}

{
  const { w, p } = createRig();
  p.boss = { x: 900, y: 784, state: 'flourish', activeAnimation: 'sector_1_boss_attack_attack', facing: 1 };
  const frames = new Set(); p.state = 'boss_flourish';
  for (let t = 0; t < 4000; t += 50) { p.phaseElapsed = t; frames.add(p.getBossFlourishFrame()); }
  assert.strictEqual(frames.size, 12, 'all twelve authored flourish poses play inside the existing entrance duration');
  let call; w.BARCODE.PresentationAssets = { draw(key, ctx, options) { call = { key, options }; return true; } };
  assert(p.drawBossAuthoredPose({})); assert.strictEqual(call.key, 'bossFlourish');
  assert.strictEqual(call.options.y, 856, 'crisp art shares the boss foot plane');
  const meta = JSON.parse(fs.readFileSync('assets/upper-route/registration.json'));
  assert.strictEqual(meta.leap.length, 8); assert.strictEqual(meta.flourish.length, 12);
  for (const pose of meta.leap.concat(meta.flourish)) assert.strictEqual(pose.footY, 480);
}
console.log('Upper route: 30/60/120Hz climb/descent, camera, pause, first-wave drone rendering, caches, roof pulses, checkpoint and authored pose checks passed.');
