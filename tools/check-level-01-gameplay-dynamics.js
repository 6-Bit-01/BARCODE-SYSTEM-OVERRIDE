#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function approx(actual, expected, epsilon, message) {
  assert(Math.abs(actual - expected) <= epsilon, `${message}: expected ${expected}, got ${actual}`);
}

function createHarness() {
  let now = 100000;
  let timerId = 1;
  const timers = new Map();
  const context = {
    console: { log() {}, warn() {}, error() {} },
    Math,
    Date: { now: () => now },
    setTimeout(callback, delay) { const handle = { id: timerId++, callback, delay }; timers.set(handle, handle); return handle; },
    clearTimeout(handle) { timers.delete(handle); },
    window: null,
    global: null,
    document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; }, createElement() { return { style: {}, classList: { add() {}, remove() {} }, appendChild() {}, remove() {}, addEventListener() {} }; }, body: { appendChild() {} } }
  };
  context.window = context;
  context.global = context;
  context.Image = class Image { constructor() { this.complete = true; this.width = 32; this.height = 32; } set src(value) { this._src = value; } get src() { return this._src; } };
  context.Vector2D = class Vector2D { constructor(x = 0, y = 0) { this.x = x; this.y = y; } add(v) { return new context.Vector2D(this.x + v.x, this.y + v.y); } multiply(s) { return new context.Vector2D(this.x * s, this.y * s); } };
  context.clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  context.distance = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
  context.randomRange = (min, max) => (min + max) / 2;
  context.Particle = class Particle {};
  context.particleSystem = { particles: [], impact() {}, trail() {}, jumpEffect() {}, landingEffect() {}, dataFragmentEffect() {}, healEffect() {}, enemySpawnEffect() {} };
  context.audioSystem = { playSound() {}, isInitialized: () => false, context: { currentTime: 0 } };
  context.renderer = { getZoomLevel: () => 1, clearCinematicZoomOverride() {}, addScreenShake() {} };
  context.gameState = { paused: false, enemiesDefeated: 0, hasSpawnedInitialEnemies: true };
  context.objectivesSystem = { setMissionDefeatObjective() {}, updateMissionDefeatProgress() {}, revealJammerObjective() {}, completeJammerObjective() {}, reset() {} };
  context.tutorialSystem = { active: false, completed: true, storyChapter: 0, combatEnemiesPaused: false, isActive() { return this.active; }, isCompleted() { return this.completed; }, checkObjective() {}, completedObjectives: new Set(), objectives: [] };
  context.MakkoEngine = { sprite() { return { isLoaded: () => false, play() {}, stop() {}, draw() {}, currentSprite: null, _currentSprite: null }; } };
  context.BARCODE = { MusicTransport: {}, MusicProfiles: { getActive: () => ({ judgmentRules: [] }) }, JammerEnvironment: { status: { revealed: false, destroyed: false, health: 16, position: null }, reveal({ position }) { this.status = { revealed: true, destroyed: false, health: 16, position }; }, getStatus() { return this.status; }, reset() { this.status = { revealed: false, destroyed: false, health: 16, position: null }; }, canReceiveRhythmDamage: () => true, applyRhythmDamage(args = {}) { this.status.health = Math.max(0, this.status.health - (args.amount || 1)); if (this.status.health === 0) this.status.destroyed = true; return { ok: true }; } } };
  context.advanceClock = ms => { now += ms; };
  context.flushTimers = () => Array.from(timers.values()).forEach(handle => { if (timers.has(handle)) { timers.delete(handle); handle.callback(); } });
  context.runDueTimers = minDelay => Array.from(timers.values()).filter(t => t.delay <= minDelay).forEach(handle => { if (timers.has(handle)) { timers.delete(handle); now += handle.delay; handle.callback(); } });

  for (const file of ['src/game/player.js', 'src/game/enemies.js', 'src/game/hacking.js', 'src/game/lost-data.js', 'src/game/rhythm.js', 'src/game/player-combat.js', 'src/game/sector1-progression.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  return context;
}

function defeatEnemy(progression, enemy) {
  if (!enemy || enemy._defeatRecorded) return;
  enemy.active = false; enemy.health = 0;
  progression.onEnemyDefeated(progression.missionDefeats + 1, enemy);
  enemy._defeatRecorded = true;
}
function defeatAllButOne(progression) {
  const alive = progression.activeEncounterEnemies.filter(enemy => enemy.active && !enemy._defeatRecorded);
  while (alive.length > 1) defeatEnemy(progression, alive.pop());
}
function defeatAll(progression) { progression.activeEncounterEnemies.forEach(enemy => defeatEnemy(progression, enemy)); }

function testEncountersAndClockPauses() {
  for (const fps of [30, 60, 120]) {
    const w = createHarness();
    w.player = { position: { x: 600, y: 750 }, velocity: { x: 0, y: 0 }, grounded: true, controlsDisabled: false };
    w.enemyManager = { enemies: [], clear() { this.enemies = []; } };
    const p = new w.Sector1Progression(w.player);
    w.sector1Progression = p;
    p.startMission();
    const totals = [];
    for (const encounter of p.getDiagnostics().encounters) {
      w.player.position.x = encounter.triggerX + 5;
      let guard = 0;
      while (p.state === encounter.id && guard++ < 2000) {
        p.update(1000 / fps);
        if (!p.pendingSpawns.length && p.activeEncounterPacket === 0) defeatAllButOne(p);
        if (p.pendingSpawns.length && p.activeEncounterPacket > 0 && p.activeEncounterEnemies.filter(e => e.active && !e._defeatRecorded).length >= encounter.activeCap) defeatAllButOne(p);
        if (!p.pendingSpawns.length && p.activeEncounterPacket > 0 && p.activeEncounterEnemies.length === encounter.packets.flat().length) defeatAll(p);
      }
      assert(guard < 2000, `${encounter.id} completes naturally at ${fps} FPS`);
      totals.push(p.activeEncounterEnemies.length || encounter.packets.flat().length);
      p.activeEncounterEnemies = [];
    }
    assert.deepStrictEqual(totals, [4, 5, 5, 6], `runtime totals at ${fps} FPS`);
  }

  const w = createHarness();
  w.player = { position: { x: 600, y: 750 }, velocity: { x: 0, y: 0 }, grounded: true };
  w.enemyManager = { enemies: [], clear() { this.enemies = []; } };
  w.hackingSystem = { isActive: () => true };
  const p = new w.Sector1Progression(w.player); w.sector1Progression = p; p.startMission(); p.update(1000);
  defeatAllButOne(p); p.update(5000);
  assert.strictEqual(p.activeEncounterPacket, 0, 'active hacking pauses packet grace');
  p.revealJammer(); p.nextJammerSpawnMs = 100;
  p.updateJammerReinforcements(1000);
  assert.strictEqual(p.nextJammerSpawnMs, 100, 'active hacking pauses jammer reinforcement clock');
}

function testHackingLifecycle() {
  const w = createHarness();
  let hides = 0, shows = 0, pulses = 0;
  w.player = new w.Player(1000, 750); w.player.grounded = true; w.player.health = 2; w.player.maxHealth = 3;
  w.enemyManager = { simulationTimeMs: 2000, enemies: [ { active: true, type: 'virus', position: { x: 1030, y: 750 } }, { active: true, type: 'corrupted', _jammerReinforcement: true, position: { x: 1200, y: 750 } }, { active: true, type: 'virus', position: { x: 3000, y: 750 } }, { active: true, type: 'broadcast_jammer', position: { x: 1020, y: 750 } }, { active: true, type: 'boss', position: { x: 1010, y: 750 } } ] };
  w.rhythmSystem = { beatInterval: 375, active: true, isActive() { return this.active; }, hideRhythmMode() { hides++; this.active = false; }, showRhythmMode() { shows++; this.active = true; } };
  const hack = new w.HackingSystem(); w.hackingSystem = hack;
  assert.strictEqual(hides, 0, 'constructor does not alter rhythm mode');
  const originalPulse = hack.emitOverridePulse.bind(hack); hack.emitOverridePulse = () => { pulses++; originalPulse(); };
  hack.start();
  assert.strictEqual(hides, 1, 'start suspends active rhythm once');
  assert.strictEqual(pulses, 0, 'hack start emits no pulse');
  assert.strictEqual(hack.guardHitsRemaining, 1, 'start grants one guard hit');
  assert(hack.absorbGuardHit(), 'first hostile hit is absorbed');
  assert(!hack.absorbGuardHit(), 'second hostile hit is not absorbed');
  w.runDueTimers(1000);
  assert(hack.currentPuzzle, 'puzzle is generated before answer timer starts');
  assert.strictEqual(hack._startTime, hack.puzzleReadyAt, 'four-second timer starts at readiness');
  const answer = hack.currentPuzzle.answer; hack.inputText = answer; hack.checkAnswer();
  assert.strictEqual(w.player.health, 3, 'success restores exactly one capped health bar');
  assert.strictEqual(pulses, 1, 'success emits exactly one pulse');
  assert.strictEqual(shows, 1, 'previous Rhythm Mode restored once');
  assert.strictEqual(hack.guardHitsRemaining, 0, 'success clears guard');
  assert.strictEqual(w.enemyManager.enemies[0]._stunnedUntilMs, 3500, 'pulse lasts four rhythm beats on simulation clock');
  assert.strictEqual(w.enemyManager.enemies[1]._stunnedUntilMs, 3500, 'pulse affects nearby jammer reinforcements');
  assert.strictEqual(w.enemyManager.enemies[2]._stunnedUntilMs, undefined, 'local pulse does not stun distant enemies');
  assert.strictEqual(w.enemyManager.enemies[3]._stunnedUntilMs, undefined, 'pulse excludes jammer');
  assert.strictEqual(w.enemyManager.enemies[4]._stunnedUntilMs, undefined, 'pulse excludes boss');

  w.advanceClock(10001);
  w.rhythmSystem.active = false;
  const failHack = new w.HackingSystem(); w.hackingSystem = failHack; let failPulses = 0; failHack.emitOverridePulse = () => { failPulses++; };
  failHack.start(); w.runDueTimers(1000); failHack.inputText = 'WRONG'; failHack.checkAnswer();
  assert.strictEqual(failPulses, 0, 'failure emits no pulse');
  assert.strictEqual(shows, 1, 'inactive pre-hack rhythm is not restored');
  w.advanceClock(10001); failHack.start(); failHack.cancel(); assert.strictEqual(failPulses, 0, 'cancel emits no pulse');
  failHack.reset(); const diag = failHack.getDiagnostics(); assert.strictEqual(diag.active, false, 'reset clears active hacking'); assert.strictEqual(diag.ownedTimeouts, 0, 'reset leaves no owned hacking timers'); assert.strictEqual(diag.hasPuzzleTimeout, false, 'reset clears puzzle timeout');
}

function testLostDataLiftMovementSwooperAmpAndEnemyClock() {
  const w = createHarness();
  w.player = new w.Player(700, 750); w.player.grounded = true;
  w.enemyManager = { enemies: [], clear() { this.enemies = []; } };
  const p = new w.Sector1Progression(w.player); w.sector1Progression = p;
  const lost = new w.LostDataSystem(); w.lostDataSystem = lost; lost.player = w.player;
  for (const [before, at] of [[3, 4], [8, 9], [13, 14]]) { p.missionDefeats = before; assert.strictEqual(lost.spawnFragment(), null, `next lost data locked at ${before} kills`); p.missionDefeats = at; assert(lost.spawnFragment(), `lost data spawns at ${at} kills`); }
  assert.strictEqual(JSON.stringify(lost.fragments.map(f => f.authoredPlacementId)), JSON.stringify(['signal-awning-fragment', 'middle-roof-fragment', 'upper-route-fragment']), 'authored Lost Data placements spawn in order');

  p.resetSignalLift(); w.player.position.x = p.signalLift.x + p.signalLift.w / 2; w.player.position.y = p.signalLift.bottomY - w.Player.VISUAL_FOOT_OFFSET_Y; w.player.velocity.x = 0; w.player.velocity.y = 0; w.player.grounded = true; w.player.supportedSurfaceId = p.signalLift.id; assert(p.chargeSignalLift().ok, 'supported player can charge lift'); p.chargeSignalLift(); const carriedY = w.player.position.y; p.updateSignalLift(500); assert(w.player.position.y < carriedY, 'lift carries supported player'); w.player.position.x += 500; p.updateSignalLift(16); assert.strictEqual(w.player.supportedSurfaceId, null, 'lift support clears immediately after step-off'); assert.strictEqual(p.chargeSignalLift().ok, false, 'remote player cannot charge lift');

  const swooper = new w.Enemy(500, 700, 'virus'); swooper.role = 'swooper'; swooper.entranceComplete = true; swooper.swooperState = 'approach'; w.enemyManager.enemies = [swooper]; const playerRef = { position: { x: 900, y: 750 } };
  for (let i = 0; i < 40 && swooper.swooperState === 'approach'; i++) swooper.updateSwooperBehavior(1 / 60, playerRef);
  assert.strictEqual(swooper.swooperState, 'telegraph', 'production swooper telegraphs');
  for (let i = 0; i < 50 && swooper.swooperState === 'telegraph'; i++) swooper.updateSwooperBehavior(1 / 60, playerRef);
  assert.strictEqual(swooper.swooperState, 'dive', 'production swooper dives');
  for (let i = 0; i < 50 && swooper.swooperState === 'dive'; i++) swooper.updateSwooperBehavior(1 / 60, playerRef);
  assert.strictEqual(swooper.swooperState, 'recovery', 'production swooper recovers');

  w.BARCODE.signalAmpCharges = 3;
  w.rhythmSystem = { getAuthoritativeDamageRadius: () => 250 };
  const combat = new w.BARCODE.PlayerCombat();
  const normal = { active: true, type: 'virus', position: { x: w.player.position.x + 420, y: w.player.position.y }, takeDamage(d) { this.damage = d; } };
  const jammer = { active: true, type: 'broadcast_jammer', position: { x: w.player.position.x + 420, y: w.player.position.y }, takeDamage(d) { this.damage = d; } };
  assert.deepStrictEqual(combat.findTargets(w.player, { enemies: [normal, jammer] }, { timing: 'perfect' }), [normal], 'Signal Amp targets normal enemies but excludes jammer');
  assert.strictEqual(w.BARCODE.signalAmpCharges, 2, 'Signal Amp charge consumed by successful normal hit');
  assert.strictEqual(combat.findTargets(w.player, { enemies: [normal] }, { timing: 'miss' }).length, 0, 'miss does not use Signal Amp range');
  assert.strictEqual(w.BARCODE.signalAmpCharges, 2, 'miss does not consume Signal Amp charge');

  const manager = new w.EnemyManager(); manager.enemies = [{ active: true, type: 'virus', position: { x: 1000, y: 750 }, velocity: { x: 0, y: 0 }, _stunnedUntilMs: 100, update(dt, player, sim) { this.lastDt = dt; this.lastSim = sim; }, getHitbox: () => ({ x: 0, y: 0, width: 0, height: 0 }) }];
  w.hackingSystem = { isActive: () => true };
  manager.update(1000, { controlsDisabled: false, getHitbox: () => ({ x: 9999, y: 9999, width: 1, height: 1 }), position: { x: 9999, y: 9999 }, velocity: { y: 0 } });
  assert.strictEqual(manager.enemies[0].lastDt, 250, 'enemy behavior uses slowed hostile delta during hacking');
  assert.strictEqual(manager.enemies[0].lastSim, 250, 'enemy attack timers use hostile simulation clock');
  assert.strictEqual(manager.simulationTimeMs, 1000, 'authoritative simulation clock remains real time for stun expiry');
}

function testProductionPlayerMovement() {
  function makePlayer(w) { const p = new w.Player(1000, 740); p.isEntering = false; p.allowMovement = true; p.grounded = false; p.coyoteTimerMs = 0; p.velocity.y = 600; p.spriteReady = false; w.player = p; return p; }
  let w = createHarness(); w.inputManager = { actionInput: { state: { jump: { held: true } } }, isKey: () => false };
  let p = makePlayer(w); assert.strictEqual(p.jump(), false, 'airborne jump stores buffer and does not double jump'); assert(p.jumpBufferTimerMs > 0, 'jump buffer stored'); p.update(40); assert(!p.grounded && p.velocity.y < 0, 'landing consumes jump buffer exactly once and immediately jumps'); const consumed = p.jumpBufferTimerMs; p.update(16); assert.strictEqual(consumed, 0, 'jump buffer consumed once');
  w = createHarness(); w.inputManager = { actionInput: { state: { jump: { held: true } } }, isKey: () => false }; p = makePlayer(w); p.jump(); p.update(200); assert(p.grounded, 'expired buffer lands without jumping');
  w = createHarness(); w.inputManager = { actionInput: { state: { jump: { held: true } } }, isKey: () => false }; p = new w.Player(1000, 750); p.isEntering = false; p.allowMovement = true; p.grounded = false; p.coyoteTimerMs = 80; assert(p.jump(), 'coyote jump works inside window'); p = new w.Player(1000, 750); p.isEntering = false; p.allowMovement = true; p.grounded = false; p.coyoteTimerMs = 0; assert.strictEqual(p.jump(), false, 'coyote jump fails outside window');
  function apex(heldProvider) { const h = createHarness(); h.inputManager = heldProvider; const q = new h.Player(1000, 750); q.isEntering = false; q.allowMovement = true; q.grounded = true; q.jump(); let minY = q.position.y; for (let i = 0; i < 90; i++) { q.update(1000 / 60); minY = Math.min(minY, q.position.y); } return 750 - minY; }
  const keyboardTap = apex({ actionInput: { state: { jump: { held: false } } }, isKey: key => key === 'arrowup' ? false : false });
  const gamepadHold = apex({ actionInput: { state: { jump: { held: true } } }, isKey: () => false });
  assert(gamepadHold > keyboardTap + 120, 'gamepad and keyboard action-state release drive variable jump height');
  const reaches = [];
  for (const fps of [30, 60, 120]) { const h = createHarness(); h.inputManager = { actionInput: { state: { jump: { held: true } } }, isKey: () => false }; const q = new h.Player(1000, 750); q.isEntering = false; q.allowMovement = true; q.grounded = true; q.moveRight(); q.jump(); for (let i = 0; i < fps; i++) q.update(1000 / fps); reaches.push(q.position.x); }
  approx(Math.max(...reaches) - Math.min(...reaches), 0, 30, 'production horizontal air control is frame-stable at 30/60/120 FPS');
}

testEncountersAndClockPauses();
testHackingLifecycle();
testLostDataLiftMovementSwooperAmpAndEnemyClock();
testProductionPlayerMovement();
console.log('✅ Level 1 production gameplay dynamics checks passed');
