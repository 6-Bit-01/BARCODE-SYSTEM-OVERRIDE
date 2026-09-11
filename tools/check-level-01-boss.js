#!/usr/bin/env node
// Focused production-module integration checks. Browser/audio/asset services are
// supplied at their boundaries; boss, combat, movement and timing code run intact.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const root = path.resolve(__dirname, '..');
const load = (context, file) => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
const copy = value => JSON.parse(JSON.stringify(value));

function createRig() {
  let now = 10000;
  let timerId = 0;
  const timers = new Map();
  const listeners = {};
  const calls = { musicStarts: 0, audioStops: 0, fullInitializations: 0, loopStarts: 0, errors: [] };
  const w = {
    console: { log() {}, info() {}, warn() {}, error(...args) { calls.errors.push(args.join(' ')); } },
    Date: class extends Date { static now() { return now; } },
    performance: { now: () => now },
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, at: now + ms }); return id; },
    clearTimeout(id) { timers.delete(id); }, setInterval() { return ++timerId; }, clearInterval() {},
    document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; }, querySelector() { return null; } },
    navigator: { getGamepads: () => [] },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, removeEventListener() {},
    FILE_MANIFEST: [], BARCODE: {}, useFallbackGraphics: true,
    distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    randomRange: (min, max) => (min + max) / 2,
    Vector2D: class Vector2D {
      constructor(x, y) { this.x = x; this.y = y; }
      add(value) { return new w.Vector2D(this.x + value.x, this.y + value.y); }
      multiply(value) { return new w.Vector2D(this.x * value, this.y * value); }
    },
    gameCamera: { centerX: 1475 },
    renderer: { zoomLevel: 0.735, getZoomLevel() { return this.zoomLevel; }, getCinematicZoomOverride() { return null; }, clearCinematicZoomOverride() {}, addScreenShake() {}, addGlitch() {} },
    MakkoEngine: { isLoaded: () => true, sprite() { return { isLoaded: () => true, play: () => ({ currentFrame: 0, totalFrames: 48 }), update() {} }; } },
    Particle: class Particle {},
    particleSystem: { particles: [], impact() {}, damageEffect() {}, spawnEffect() {}, enemySpawnEffect() {} },
    tutorialSystem: { active: false, completed: true, isActive() { return this.active; }, isCompleted() { return this.completed; }, checkObjective() {} },
    hackingSystem: { active: false, isActive() { return this.active; }, reset() { this.active = false; }, cancel() { this.active = false; } },
    lostDataSystem: { collected: ['level-01.fragment-1'], reset() {}, fragments: [] },
    startGameLoop() { calls.loopStarts++; }, stopGame() {}, pauseGame() {}, resumeGame() {},
    async startGameInitialization() { calls.fullInitializations++; }
  };
  w.window = w;
  const context = vm.createContext(w);
  load(context, 'src/engine/music-profiles.js');
  load(context, 'src/engine/level-01-music-profile.js');
  load(context, 'src/engine/music-transport.js');
  w.BARCODE.ensureLevel01MusicProfileSelected();
  w.BARCODE.MusicTransport.start({ sourceAnchorAudioSec: 0, sourceOffsetTrackSec: 0 });
  w.audioSystem = {
    context: { currentTime: 60 / 146 * 40 },
    isInitialized: () => false,
    playRhythmAttack() {}, playSound() {}, playPlayerDamageSound() {}, stopTitleScreenMusic() {},
    stopRuntimeAudio() { calls.audioStops++; },
    async prepareRestartAudio() { return { ok: true }; },
    startRuntimeGameplayMusic() { calls.musicStarts++; return { ok: true }; },
    async pauseRuntimeAudio() { w.BARCODE.MusicTransport.pause(this.context.currentTime); return { ok: true }; },
    async resumeRuntimeAudio() { w.BARCODE.MusicTransport.resume(this.context.currentTime); return { ok: true }; }
  };
  load(context, 'src/game/player.js');
  load(context, 'src/game/enemies.js');
  load(context, 'src/game/game-state.js');
  load(context, 'src/game/objectives.js');
  load(context, 'src/game/jammer-environment.js');
  load(context, 'src/game/rhythm.js');
  load(context, 'src/game/sector1-progression.js');
  load(context, 'src/game/player-combat.js');
  load(context, 'src/game/update-coordinator.js');
  w.player = new w.Player(900, 750);
  w.player.isEntering = false;
  w.player.grounded = true;
  w.enemyManager = new w.EnemyManager();
  w.rhythmSystem = new w.RhythmSystem();
  w.rhythmSystem.running = true;
  w.rhythmSystem.trackStarted = true;
  w.rhythmSystem.currentTempoBeat = 33;
  w.rhythmSystem.tempoEstablished = true;
  w.gameState.running = true;
  w.isRunning = true;
  w.sector1Progression = new w.Sector1Progression(w.player);
  w.rhythmSystem.show();
  w.rhythmSystem.update(1); // Establish the transport's first boundary sample.
  const p = w.sector1Progression;
  function tick(ms = 25) { now += ms; p.update(ms); }
  function until(predicate, label, limitMs = 30000) {
    for (let elapsed = 0; !predicate() && elapsed < limitMs; elapsed += 25) tick();
    assert(predicate(), `${label}; progression=${p.state}, boss=${p.boss && p.boss.phase}`);
  }
  function beat(timing = 'perfect') {
    now += 500;
    const beatSeconds = 60 / 146;
    w.audioSystem.context.currentTime = Math.ceil(w.audioSystem.context.currentTime / beatSeconds + 1) * beatSeconds + (timing === 'miss' ? beatSeconds / 2 : timing === 'excellent' ? 0.08 : 0);
    return w.BARCODE.playerCombat.resolvePrimary({ now });
  }
  function reachReady() {
    p.startMission();
    // Defeat credit enters through the real manager and progression owners.
    for (let i = 0; i < p.requiredEnemyKills; i++) {
      w.enemyManager.recordDefeat({ active: false, _sector1MissionEnemy: true, type: 'virus' });
    }
    assert.strictEqual(p.state, 'jammer_active');
    const jammer = w.BARCODE.JammerEnvironment;
    w.player.position.x = jammer.getStatus().position.x - 150;
    w.gameCamera.centerX = w.clamp(w.player.position.x, 960, 3136);
    for (let i = 0; i < 16; i++) {
      const hit = beat();
      assert(hit.targets.some(target => target.type === 'broadcast_jammer'));
      assert.strictEqual(hit.reason, 'hit', 'Jammer-only successful rhythm attack reports a hit');
    }
    assert.strictEqual(p.state, 'jammer_destroyed_freeze');
    until(() => p.state === 'boss_ready', 'destruction cinematic reaches boss-ready');
    return p.boss;
  }
  return { w, p, context, calls, listeners, timers, tick, until, beat, reachReady };
}

function reachRecovery(rig) {
  const { w, p, until } = rig;
  // Keeping the fixture invulnerable here lets this helper advance authentic
  // attack phases without losing the player before the assertion under test.
  const protection = w.player.invulnerableUntil;
  w.player.invulnerableUntil = Infinity;
  w.player.position.x = p.boss.x - 150;
  w.player.position.y = 750;
  until(() => p.state === 'boss_combat' && p.boss.phase === 'recovery', 'boss opens its counter window');
  w.player.invulnerableUntil = protection;
  w.rhythmSystem.show();
}

async function main() {
  {
    const rig = createRig();
    const { p, w, until, beat } = rig;
    assert.strictEqual(p.retryBossCheckpoint().ok, false, 'a new session cannot invent a boss checkpoint');
    assert.strictEqual(p.applyBossRhythmDamage({ judgment: { available: true, timing: 'perfect' }, sequence: 1 }).ok, false, 'boss damage is unavailable before the intro');
    rig.reachReady();
    assert.strictEqual(p.missionDefeats, 20, 'the real mission count remains 20 after the cinematic');
    assert.strictEqual(w.BARCODE.JammerEnvironment.getStatus().destroyed, true, 'the actual 16-hit Jammer stays destroyed');
    assert.strictEqual(p.boss.canDealDamage, false, 'ready grace cannot damage the player');
    assert.strictEqual(p.boss.canReceiveDamage, false, 'ready grace cannot receive damage');
    const health = p.boss.health;
    w.player.position.x = p.boss.x - 150;
    beat();
    assert.strictEqual(p.boss.health, health, 'a perfect attack during the intro handoff does not hit');
    until(() => p.state === 'boss_combat' && p.boss.phase === 'telegraph', 'ready handoff enters live boss combat');
    const playerHealth = w.player.health;
    const phaseTime = p.boss.phaseElapsedMs;
    rig.tick(100);
    assert.strictEqual(w.player.health, playerHealth, 'the visible first telegraph is harmless');
    assert(p.boss.phaseElapsedMs > phaseTime, 'live telegraph advances on simulation time');
    assert.strictEqual(p.boss.pulses.length, 0, 'no shockwave fires before the telegraph finishes');
    beat();
    assert.strictEqual(p.boss.health, health, 'a successful beat cannot bypass the guarded phase');
    assert.deepStrictEqual(rig.calls.errors, [], 'production modules report no errors during the entire mission handoff');
  }

  {
    const rig = createRig();
    const { w, p, beat } = rig;
    rig.reachReady(); reachRecovery(rig);
    const health = p.boss.health;
    beat('miss');
    assert.strictEqual(p.boss.health, health, 'an offbeat attack causes no boss damage');
    w.rhythmSystem.hideRhythmMode(); beat();
    assert.strictEqual(p.boss.health, health, 'Down with Rhythm Mode hidden causes no boss damage');
    w.rhythmSystem.show();
    assert.strictEqual(p.applyBossRhythmDamage({ judgment: { available: false, timing: 'perfect' }, sequence: 999 }).ok, false, 'an unavailable timing sample cannot hit');
    const hit = beat();
    assert(hit.targets.some(target => target.type === 'boss' && target.damage === 1), 'PlayerCombat reports the boss target from a real transport-perfect attack');
    assert.strictEqual(hit.reason, 'hit', 'boss-only rhythm attack reports a hit');
    assert.strictEqual(p.boss.health, health - 1, 'a perfect attack subtracts exactly one boss health');
    assert.strictEqual(p.applyBossRhythmDamage({ judgment: hit.timing, sequence: hit.sequence }).ok, false, 'the same attack sequence cannot hit twice');
    const excellent = beat('excellent');
    assert.strictEqual(excellent.timing.timing, 'excellent', 'the production transport resolves the wider timing window');
    assert.strictEqual(p.boss.health, health - 2, 'an excellent attack subtracts exactly one boss health');
    assert.strictEqual(p.applyBossRhythmDamage({ judgment: hit.timing, sequence: hit.sequence }).ok, false, 'a nonconsecutive sequence replay cannot hit again');
    w.player.position.x = p.boss.x - 700; beat();
    assert.strictEqual(p.boss.health, health - 2, 'a correct beat outside boss range causes no damage');
    w.BARCODE.signalAmpCharges = 3;
    w.player.position.x = p.boss.x - 350; beat();
    assert.strictEqual(p.boss.health, health - 2, 'the normal-enemy Signal Amp cannot extend boss attack range');
    assert.strictEqual(w.BARCODE.signalAmpCharges, 3, 'an out-of-range boss never consumes a normal-enemy amp charge');
    w.player.position.x = p.boss.x - 150; beat();
    assert.strictEqual(p.boss.health, health - 3);
    assert.strictEqual(w.BARCODE.signalAmpCharges, 3, 'an in-range boss hit preserves normal-enemy amp charges');
    assert.deepStrictEqual(rig.calls.errors, []);
  }

  {
    const rig = createRig();
    const { w, p, tick } = rig;
    rig.reachReady(); reachRecovery(rig);
    const phase = p.boss.phase;
    const elapsed = p.boss.phaseElapsedMs;
    const pulses = copy(p.boss.pulses);
    w.gameState.paused = true; tick(400);
    assert.strictEqual(p.boss.phaseElapsedMs, elapsed, 'paused boss timing remains frozen');
    assert.deepStrictEqual(copy(p.boss.pulses), pulses, 'paused shockwaves remain frozen');
    w.gameState.paused = false;
    w.hackingSystem.active = true; tick(250);
    assert.strictEqual(p.boss.phase, phase);
    assert.strictEqual(p.boss.phaseElapsedMs - elapsed, 100, 'hacking applies the existing 0.4 hostile-time scale once');
    const health = p.boss.health;
    assert.strictEqual(p.applyBossRhythmDamage({ judgment: { available: true, timing: 'perfect' }, sequence: 1000 }).ok, false, 'hacking does not permit a simultaneous rhythm attack');
    assert.strictEqual(p.boss.health, health);
    const generation = w.BARCODE.MusicTransport.getDiagnostics().generation;
    const beatCount = w.rhythmSystem.globalBeatCount;
    w.audioSystem.context.currentTime += 1;
    w.rhythmSystem.update(1000);
    assert(w.rhythmSystem.globalBeatCount > beatCount, 'background rhythm processes the unscaled music clock during focus');
    assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation, generation, 'hacking never restarts the music transport');
    w.hackingSystem.active = false;
  }

  {
    const rig = createRig();
    const { w, p, until, tick } = rig;
    rig.reachReady();
    w.player.position.x = p.boss.x - 150;
    until(() => p.boss.phase === 'sweep', 'the first warning emits a ground pulse');
    assert.strictEqual(p.boss.pulses.length, 1, 'opening attack emits one ground pulse');
    const health = w.player.health;
    tick(700);
    assert.strictEqual(w.player.health, health - 1, 'a swept low-frame-rate pulse cannot tunnel through a grounded player');
    assert.strictEqual(w.rhythmSystem.isActive(), false, 'actual player damage exits Rhythm Mode');
    assert.strictEqual(w.rhythmSystem.running, true, 'actual player damage leaves background rhythm running');
    w.player.invulnerableUntil = 0;
    w.player.position.x = p.boss.pulses[0].originX + p.boss.pulses[0].radius + 10;
    tick(25);
    assert.strictEqual(w.player.health, health - 1, 'one pulse cannot deal a second hit even after invulnerability ends');

    const airborne = createRig();
    airborne.reachReady();
    airborne.w.player.position.x = airborne.p.boss.x - 150;
    airborne.w.player.position.y = 560;
    airborne.until(() => airborne.p.boss.phase === 'recovery', 'a jumping player can wait out the pulse');
    assert.strictEqual(airborne.w.player.health, airborne.w.player.maxHealth, 'jump height clears the shockwave without damage');
  }

  {
    const rig = createRig();
    const { w, p } = rig;
    rig.reachReady(); reachRecovery(rig);
    const hitbox = p.getBossHitbox();
    const footOffset = w.Player.VISUAL_FOOT_OFFSET_Y;
    const health = p.boss.health;
    w.player.allowMovement = true;
    w.player.position.x = p.boss.x;
    w.player.position.y = hitbox.y - footOffset + 20;
    w.player.velocity.y = -200;
    const movement = { previousFootY: hitbox.y - footOffset - 20, currentFootY: hitbox.y - footOffset + 20, previousX: p.boss.x };
    assert.strictEqual(p.applyBossStomp(w.player, movement), false, 'rising contact is never a stomp');
    w.player.velocity.y = 200;
    const missMovement = { ...movement, previousX: hitbox.x - 200 };
    w.player.position.x = hitbox.x - 100;
    assert.strictEqual(p.applyBossStomp(w.player, missMovement), false, 'a descent outside the hull cannot stomp');
    w.player.position.x = p.boss.x;
    w.player.position.y = hitbox.y - footOffset - 5;
    w.player.velocity.y = 400;
    w.player.velocity.x = 0;
    w.player.grounded = false;
    w.player.update(50, true);
    assert.strictEqual(p.boss.health, health - 1, 'one valid boss stomp costs one health');
    assert(w.player.velocity.y < 0 && !w.player.grounded, 'the production player receives its ordinary stomp rebound');
    assert.strictEqual(w.player.position.y + footOffset, hitbox.y, 'the rebound begins at the visible boss top');
    w.player.velocity.y = 200;
    assert.strictEqual(p.applyBossStomp(w.player, movement), false, 'a repeated collision in the same recovery cannot damage twice');
    assert.strictEqual(p.boss.health, health - 1);
  }

  {
    const rig = createRig();
    const { w, p, beat, until, tick } = rig;
    rig.reachReady(); reachRecovery(rig);
    const initialHealth = p.boss.health;
    for (let hit = 0; hit < initialHealth; hit++) {
      if (p.boss.phase !== 'recovery') reachRecovery(rig);
      w.player.position.x = p.boss.x - 150;
      w.rhythmSystem.show();
      const result = beat();
      assert(result.targets.some(target => target.type === 'boss'), `counter ${hit + 1} lands through PlayerCombat`);
      if (p.state !== 'level_complete') tick(500);
    }
    assert.strictEqual(p.boss.health, 0, 'all successful counters exhaust boss health');
    assert.strictEqual(p.state, 'level_complete', 'defeating the boss reaches a real Level 1 endpoint');
    assert.strictEqual(w.gameState.victory, true);
    assert.strictEqual(w.gameState.gameOver, false);
    assert.strictEqual(p.levelCompletionCount, 1, 'the completion event occurs once');
    assert.strictEqual(p.completeLevel(), false, 'a second completion call cannot emit victory twice');
    assert.strictEqual(p.levelCompletionCount, 1);
    assert.strictEqual(p.boss.canDealDamage, false);
    assert.strictEqual(p.boss.canReceiveDamage, false);
    assert.strictEqual(p.boss.pulses.length, 0, 'victory removes all hostile pulses');
    const victorySnapshot = copy(p.getBossStatus());
    const health = w.player.health;
    beat(); tick(10000);
    assert.strictEqual(w.player.health, health, 'no hostile damage occurs after victory');
    assert.deepStrictEqual(copy(p.getBossStatus()), victorySnapshot, 'post-victory updates cannot advance the defeated encounter');
    assert.strictEqual(p.retryBossCheckpoint().ok, true, 'victory supports a boss rematch');
    assert.strictEqual(p.boss.health, initialHealth);
    assert.strictEqual(w.gameState.victory, false);
    until(() => p.boss.phase === 'telegraph', 'rematch enters its normal opening pattern');
    assert.strictEqual(p.boss.doublePulse, false, 'rematch does not retain the defeated phase-two pattern');
  }

  {
    const rig = createRig();
    const { w, p, context, listeners, calls, tick } = rig;
    load(context, 'src/core/runtime-lifecycle.js');
    const lifecycle = w.BARCODE.RuntimeLifecycle;
    assert.strictEqual((await lifecycle.start()).ok, true, 'real lifecycle starts the run');
    w.player.isEntering = false;
    w.player.position.y = 750;
    w.rhythmSystem.show();
    w.gameState.score = 150;
    rig.reachReady(); reachRecovery(rig);
    const checkpoint = copy(p.bossCheckpoint);
    const collected = copy(w.lostDataSystem.collected);
    const transport = copy(w.BARCODE.MusicTransport.getDiagnostics());
    const runtime = copy(lifecycle.getSnapshot());
    const initializationCount = calls.fullInitializations;
    const loopCount = calls.loopStarts;
    load(context, 'src/core/action-input.js');
    load(context, 'src/core/input.js');
    w.inputManager = new w.InputManager();
    const down = (key, extra = {}) => listeners.keydown[0]({ key, repeat: false, shiftKey: false, preventDefault() {}, ...extra });
    w.player.health = 0;
    w.player.position.x = 250;
    w.player.controlsDisabled = true;
    w.gameState.score = 999;
    w.checkGameConditions();
    assert.strictEqual(w.gameState.gameOver, true, 'real death check enters game over');
    const phaseTime = p.boss.phaseElapsedMs;
    tick(3000);
    assert.strictEqual(p.boss.phaseElapsedMs, phaseTime, 'dead players cannot advance the boss');
    down(' ', { repeat: true });
    assert.strictEqual(w.gameState.gameOver, true, 'held Space cannot repeatedly retry');
    down(' ');
    assert.strictEqual(w.gameState.gameOver, false, 'Space returns directly to the legitimate boss checkpoint');
    assert.strictEqual(w.gameState.running, true);
    assert.strictEqual(w.isRunning, true);
    assert.strictEqual(lifecycle.getState(), 'running');
    assert.strictEqual(lifecycle.getSnapshot().generation, runtime.generation, 'boss retry preserves lifecycle generation');
    assert.strictEqual(w.player.health, w.player.maxHealth);
    assert.strictEqual(w.player.position.x, checkpoint.playerX);
    assert.strictEqual(w.player.position.y, 750, 'retry restores a safe street-level starting position');
    assert.strictEqual(w.player.grounded, true);
    assert.strictEqual(w.player.controlsDisabled, false);
    assert.strictEqual(w.gameState.score, checkpoint.score);
    assert.strictEqual(p.boss.x, checkpoint.bossX);
    assert.strictEqual(p.boss.health, p.boss.maxHealth);
    assert.strictEqual(p.boss.pulses.length, 0);
    assert.strictEqual(p.boss.hitSequences.size, 0);
    assert.strictEqual(p.missionDefeats, 20);
    assert.strictEqual(w.enemyManager.defeatedCount, 20, 'retry does not duplicate or lose completed encounter credit');
    assert.strictEqual(w.enemyManager.enemies.length, 0);
    assert.strictEqual(w.BARCODE.JammerEnvironment.getStatus().destroyed, true, 'retry does not recreate the Jammer');
    assert.deepStrictEqual(copy(w.lostDataSystem.collected), collected, 'retry preserves collected lore');
    assert.strictEqual(p.cameraOverrideActive, false, 'retry releases cinematic camera ownership');
    assert.strictEqual(p.frozenPlayerPosition, null);
    assert.deepStrictEqual(copy(w.BARCODE.MusicTransport.getDiagnostics()), transport, 'retry preserves the transport generation and audio position');
    assert.strictEqual(w.rhythmSystem.running, true);
    assert.strictEqual(w.rhythmSystem.trackStarted, true);
    assert.strictEqual(w.BARCODE.playerCombat.sequence, 0, 'retry clears prior attack transactions');
    assert.strictEqual(calls.fullInitializations, initializationCount, 'boss retry does not run the full initializer');
    assert.strictEqual(calls.loopStarts, loopCount, 'boss retry does not create another gameplay loop');
    assert.strictEqual(calls.musicStarts, 0, 'boss retry does not restart gameplay music');
    assert.strictEqual(w.inputManager.terminalKeyLatched, ' ', 'retry consumes Space until its physical release');
    w.player.health = 0;
    w.checkGameConditions();
    listeners.blur[0](); // Space was released outside the game window: no keyup arrives.
    assert.strictEqual(w.inputManager.terminalKeyLatched, null, 'focus loss releases a retry key whose keyup may be lost');
    down(' ');
    assert.strictEqual(w.gameState.gameOver, false, 'returning focus permits the next real Space press to retry');
    assert.strictEqual(p.boss.health, p.boss.maxHealth);
    const oldGeneration = p.assetGeneration;
    assert.strictEqual((await lifecycle.restart({ source: 'boss-test-full-restart' })).ok, true);
    assert.strictEqual(p.boss, null, 'full restart releases the old boss');
    assert.strictEqual(p.bossCheckpoint, null, 'full restart clears the old boss checkpoint');
    assert.strictEqual(p.levelCompletionCount, 0);
    assert(p.assetGeneration > oldGeneration, 'full restart invalidates previous asset callbacks');
    assert.strictEqual(p.retryBossCheckpoint().ok, false, 'a cleared boss checkpoint cannot be reused');
    assert.strictEqual(calls.fullInitializations, initializationCount + 1);
    assert.strictEqual(calls.loopStarts, loopCount + 1, 'full restart starts exactly one new loop');
    assert.strictEqual(listeners.keydown.length, 1, 'retry and restart do not duplicate input listeners');
    assert.strictEqual((await lifecycle.stop('boss-test-stop')).ok, true);
    assert.strictEqual(w.isRunning, false);
    assert.strictEqual(p.applyBossRhythmDamage({ judgment: { available: true, timing: 'perfect' }, sequence: 1 }).ok, false, 'a stopped runtime cannot damage the boss');
    assert.deepStrictEqual(calls.errors, [], 'real boss retry/restart lifecycle reports no integration errors');
  }

  {
    const rig = createRig();
    const { w, p, context, listeners } = rig;
    load(context, 'src/core/runtime-lifecycle.js');
    const lifecycle = w.BARCODE.RuntimeLifecycle;
    await lifecycle.start();
    w.player.isEntering = false;
    w.rhythmSystem.show();
    rig.reachReady(); reachRecovery(rig);
    p.completeLevel();
    load(context, 'src/core/action-input.js');
    load(context, 'src/core/input.js');
    w.inputManager = new w.InputManager();
    listeners.keydown[0]({ key: 'p', repeat: false, shiftKey: false, preventDefault() {} });
    w.inputManager.update();
    assert.strictEqual(lifecycle.getSnapshot().transitionInFlight, false, 'terminal keyboard input cannot initiate pause');
    // A lifecycle caller (or an already-pending transition) must also preserve
    // the terminal simulation boundary independently of keyboard suppression.
    await lifecycle.pause();
    await lifecycle.resume();
    assert.strictEqual(w.gameState.victory, true);
    assert.strictEqual(w.gameState.running, false, 'lifecycle resume cannot restart simulation behind the victory screen');
    const elapsed = w.gameState.gameTime;
    w.updateGame(25);
    assert.strictEqual(w.gameState.gameTime, elapsed, 'the production coordinator stays idle after terminal resume');
    assert.strictEqual(p.canRetryBossCheckpoint(), true, 'terminal lifecycle projection leaves the legitimate rematch usable');
    assert.strictEqual(p.retryBossCheckpoint().ok, true);
    w.player.health = 0;
    w.checkGameConditions();
    lifecycle.projectCompatibility();
    assert.strictEqual(w.gameState.running, false, 'lifecycle projection preserves the death boundary as well');
    assert.deepStrictEqual(rig.calls.errors, []);
  }

  console.log('Level 1 boss production-module checks passed');
}
main().catch(error => { console.error(error.stack || error); process.exit(1); });
