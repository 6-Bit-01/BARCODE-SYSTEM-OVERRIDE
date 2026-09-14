#!/usr/bin/env node
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');

function rig() {
  const r = createRig();
  r.p.startMission(); r.w.rhythmSystem.hideRhythmMode();
  load(r.context, 'src/game/combat-fx.js');
  load(r.context, 'src/game/hacking.js');
  r.w.hackingSystem = new r.w.HackingSystem();
  return r;
}
function actor(r, type, x, y = 750) {
  const e = new r.w.Enemy(x, y, type);
  Object.assign(e.position, { x, y });
  Object.assign(e, { entranceComplete: true, _authoredEntranceActive: false, _sector1MissionEnemy: true,
    spawnTimeMs: -10000, spawnProtectionDuration: 0, simulationTimeMs: 0 });
  e.velocity.x = 0; e.velocity.y = 0;
  r.w.enemyManager.enemies.push(e);
  return e;
}
function solve(h) {
  h.puzzleType = 1; h.update(h.bootDurationMs); h.update(h.displayTime);
  for (const key of h.currentPuzzle.answer) h.processInput(key);
  h.processInput('Enter');
}

// Both production puzzle outcomes and allegiance changes, with the same locked
// actor retained through the puzzle. No healing, invisible stun or late retarget.
{
  const r = rig(), { w, p } = r, h = w.hackingSystem, m = w.enemyManager;
  const target = actor(r, 'corrupted', 1000), other = actor(r, 'virus', 1150);
  w.player.health = 1;
  assert(h.start()); assert.strictEqual(h.hijackTarget, target);
  assert.strictEqual(w.BARCODE.TacticalFocusClock.getScale(), 0.4);
  assert(!m.isHijacked(target)); solve(h);
  assert(m.isHijacked(target)); assert(!m.isHijacked(other));
  assert.strictEqual(w.player.health, 1); assert.strictEqual(target._hijackedUntilMs, 8000);
  assert.strictEqual(p.missionDefeats, 0, 'conversion itself awards no defeat');
  assert.strictEqual(w.BARCODE.TacticalFocusClock.getScale(), 1);
  assert(!w.BARCODE.playerCombat.getAttackPlan(w.player, m).targets.includes(target), 'rhythm cannot hit ally');
  const hp = w.player.health;
  w.player.position.x = target.position.x; m.checkCollisions(w.player);
  assert.strictEqual(w.player.health, hp, 'ally cannot damage player by contact');
  w.player.contactSweep = { previousFootY: 650, currentFootY: 830, previousX: 1000, currentX: 1000 };
  w.player.velocity.y = 100; m.checkCollisions(w.player);
  assert(target.active, 'ordinary stomp skips ally');
  assert(h.start(), 'H can release early despite puzzle cooldown');
  assert(!h.active && !m.isHijacked(target) && m.isRebooting(target));
}
{
  const r = rig(), { w } = r, h = w.hackingSystem, m = w.enemyManager;
  const target = actor(r, 'virus', 1000), other = actor(r, 'virus', 1100);
  assert(h.start()); target.takeDamage(999); solve(h);
  assert.strictEqual(h.resultFx.outcome, 'target-lost'); assert(!m.isHijacked(other)); assert(!h.active);
  m.enemies = []; h.cooldownUntil = 0;
  assert(!h.start()); assert.strictEqual(h.feedback.text, 'NO HIJACK TARGET');
  assert.strictEqual(w.BARCODE.TacticalFocusClock.getScale(), 1);
  m.enemies = [target]; target.active = true; target._defeatRecorded = false; target.type = 'boss';
  assert(!m.findHijackTarget()); assert(!m.hijackEnemy(target));
  target.type = 'broadcast_jammer'; assert(!m.findHijackTarget());
  target.type = 'virus'; target._authoredEntranceActive = true; assert(!m.findHijackTarget());
  target._authoredEntranceActive = false; target.position.x = 2600; assert(!m.findHijackTarget());
}
{
  const r = rig(), { w } = r, h = w.hackingSystem;
  const target = actor(r, 'virus', 1000);
  assert(h.start()); h.puzzleType = 1; h.update(1000); h.update(h.displayTime); h.processInput('0'); h.processInput('Enter');
  assert(!w.enemyManager.isHijacked(target)); assert.strictEqual(h.resultFx.outcome, 'failure');
  h.cooldownUntil = 0; assert(h.start()); h.cancel(); assert(!w.enemyManager.isHijacked(target));
  h.cooldownUntil = 0; assert(h.start()); h.update(12000); assert.strictEqual(h.resultFx.outcome, 'timeout');
  h.cooldownUntil = 0; assert(h.start()); h.reset(); assert.strictEqual(h.hijackTarget, null);
}

// The real AI receives the opposing actor. Ordinary attacks and damage owners
// handle the resulting fight; each killed actor earns score/mission credit once.
for (const type of ['virus', 'corrupted', 'firewall']) {
  const r = rig(), { w, p } = r, m = w.enemyManager;
  const ally = actor(r, type, 1100), hostile = actor(r, 'virus', 1080);
  w.player.position.x = 1500;
  assert(m.hijackEnemy(ally));
  assert.strictEqual(m.getCombatTarget(ally, w.player), hostile);
  assert.strictEqual(m.getCombatTarget(hostile, w.player), ally);
  ally.update(20, m.getCombatTarget(ally, w.player), 20);
  assert(ally.velocity.x <= 0, 'ally approaches hostile instead of player to its right');
  ally.position.x = 1100; hostile.position.x = 1080; ally.combatPattern = 'attack';
  m.checkEnemyCollisions(); assert(!hostile.active, 'existing ordinary contact produces ally attack damage');
  const score = w.gameState.score;
  assert(m.recordDefeat(hostile)); assert(!m.recordDefeat(hostile));
  assert.strictEqual(p.missionDefeats, 1); assert.strictEqual(w.gameState.score, score);
  assert(ally.active && m.isHijacked(ally));
}
for (const fps of [30, 60, 120, 144]) {
  const r = rig(), { w } = r, m = w.enemyManager, ally = actor(r, 'virus', 1100);
  assert(m.hijackEnemy(ally));
  w.gameState.paused = true; m.update(6000, w.player); assert.strictEqual(m.simulationTimeMs, 0);
  w.gameState.paused = false;
  for (let i = 0; i < fps * 7; i++) m.update(1000 / fps, w.player);
  assert(m.isHijacked(ally));
  m.update(1001, w.player); assert(!m.isHijacked(ally) && m.isRebooting(ally));
  const hp = w.player.health; w.player.position.x = ally.position.x; m.checkCollisions(w.player);
  assert.strictEqual(w.player.health, hp, 'expiry has one second of harmless reboot');
  m.update(1001, w.player); assert(!m.isRebooting(ally));
  m.clear(); assert(!m.getHijackedEnemy());
}

for (const type of ['virus', 'corrupted', 'firewall']) {
  const r = rig(), { w } = r, m = w.enemyManager;
  const ally = actor(r, type, 1100), hostile = actor(r, 'virus', 1300);
  w.player.position.x = 700;
  assert(m.hijackEnemy(ally));
  for (let ms = 0; ms < 7900 && hostile.active && ally.active; ms += 20) m.update(20, w.player);
  assert(hostile.health < hostile.maxHealth, `${type}'s unmodified AI lands a hijacked attack before expiry`);
}

// Real pickup transactions, floor ownership, carrier death and repeat/reset.
{
  const r = rig(), { w, p } = r;
  const cell = p.repairs[0];
  Object.assign(w.player.position, { x: cell.x, y: cell.surfaceY - 72 });
  w.player.health = 3; p.updateRepairs(16); assert(!cell.collected, 'full health leaves cell');
  w.player.health = 1; w.player.position.y = cell.surfaceY + 50; p.updateRepairs(16); assert(!cell.collected, 'cannot collect through roof');
  w.player.position.y = cell.surfaceY - 72; p.updateRepairs(16); assert(cell.collected); assert.strictEqual(w.player.health, 2);
  p.updateRepairs(16); assert.strictEqual(w.player.health, 2);
  const carrier = p.spawnMissionEnemy({ type: 'corrupted', x: 1440, y: 750 }, 'encounter_2', 0, { origin: { x: 1440, y: 750 } });
  assert(carrier._repairCarrier); assert(!p.dropCarrierRepair(carrier));
  carrier.takeDamage(999); w.enemyManager.recordDefeat(carrier); w.enemyManager.recordDefeat(carrier);
  assert.strictEqual(p.repairs.filter(x => x.id === 'repair.cache-carrier').length, 1);
  p.reset(); assert.strictEqual(p.repairs.length, 2); assert(p.repairs.every(x => !x.collected));
}

// Traverse the added supports with the actual Player substeps and swept stage
// collision, including stop-on-landing and closed-gate containment.
for (const fps of [30, 60, 120]) {
  function jumpRoute(startX, footY, targetX, id, jump = true) {
    const r = rig(), { w, p } = r, player = w.player;
    p.state = 'jammer_active'; p.closedGateEncounterId = null;
    Object.assign(player.position, { x: startX, y: footY - 72 }); player.grounded = true; player.allowMovement = true;
    player.isJumpHeld = () => true; if (jump) player.jump();
    let landed = false, airborne = jump;
    for (let i = 0; i < fps * 3; i++) {
      if (player.position.x < targetX - 7) player.moveRight(); else if (player.position.x > targetX + 7) player.moveLeft(); else player.stopHorizontal();
      player.update(1000 / fps);
      if (!player.grounded) airborne = true;
      if (player.grounded && airborne) { landed = player.supportedSurfaceId === id; break; }
    }
    assert(landed, `production jump reaches ${id} at ${fps} Hz (x=${player.position.x}, surface=${player.supportedSurfaceId})`);
  }
  jumpRoute(1230, 492, 1450, 'cache-maintenance-step');
  jumpRoute(1480, 410, 1620, 'cache-awning');
  jumpRoute(3010, 822, 3225, 'tower-utility-unit');
  jumpRoute(3280, 650, 3420, 'tower-awning');
  jumpRoute(1600, 330, 1450, 'cache-maintenance-step');
  jumpRoute(1420, 410, 1220, 'signal-awning');
  jumpRoute(3360, 502, 3225, 'tower-utility-unit', false);
  jumpRoute(3200, 650, 3000, null);
}
{
  const { w, p } = rig(); p.state = 'encounter_1'; p.closedGateEncounterId = 'encounter_1';
  w.player.position.x = 1500; p.applyGateCollision();
  assert(w.player.position.x + w.player.width / 2 <= 1320);
}
console.log('Enemy hijack, repair transactions and production rooftop traversal checks passed');
