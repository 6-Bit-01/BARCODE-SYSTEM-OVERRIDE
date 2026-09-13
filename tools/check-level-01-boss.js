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
    MakkoEngine: { isLoaded: () => true, sprite() { let animation = null; return { isLoaded: () => true, play(name) { animation = name; return { currentFrame: 0, totalFrames: 48 }; }, getCurrentAnimation: () => animation, getHitboxWorld: () => null, update() {}, stop() {} }; } },
    Particle: class Particle {},
    particleSystem: { particles: [], trail() {}, impact() {}, damageEffect() {}, spawnEffect() {}, enemySpawnEffect() {}, landingEffect() {}, jumpEffect() {} },
    tutorialSystem: { active: false, completed: true, isActive() { return this.active; }, isCompleted() { return this.completed; }, checkObjective() {} },
    hackingSystem: { active: false, isActive() { return this.active; }, reset() { this.active = false; }, cancel() { this.active = false; } },
    lostDataSystem: { collected: ['level-01.fragment-1'], reset() {}, fragments: [] },
    startGameLoop() { calls.loopStarts++; }, stopGame() {}, pauseGame() {}, resumeGame() {},
    async startGameInitialization() { calls.fullInitializations++; }
  };
  w.window = w;
  const context = vm.createContext(w);
  load(context, 'src/game/lore-records.js');
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
  function tick(ms = 25) { now += ms; if (!w.gameState.paused && !w.isPaused) w.audioSystem.context.currentTime += ms / 1000; p.update(ms); }
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
    assert.strictEqual(w.rhythmSystem.isActive(), false, 'the real final Jammer attack immediately ends Rhythm Mode');
    assert.strictEqual(w.player.primaryAttackAnimationMs, 0, 'the final attack pose cannot bleed into boss handoff');
    assert.strictEqual(w.rhythmSystem.running, true, 'destruction leaves background rhythm running');
    assert.strictEqual(w.rhythmSystem.trackStarted, true, 'destruction preserves track readiness');
    const beatsBefore = w.rhythmSystem.globalBeatCount;
    const generationBefore = w.BARCODE.MusicTransport.getDiagnostics().generation;
    const seen = new Set();
    for (let elapsed = 0; p.state !== 'boss_ready' && elapsed < 30000; elapsed += 25) {
      seen.add(p.state);
      assert.strictEqual(w.rhythmSystem.showRhythmMode().reason, 'progression-suppressed', 'R cannot reactivate during any cinematic phase');
      tick();
      w.rhythmSystem.update(25);
    }
    assert.strictEqual(p.state, 'boss_ready', 'destruction cinematic reaches boss-ready');
    assert.strictEqual(seen.size, 8, 'all eight cinematic phases were checked');
    assert(w.rhythmSystem.globalBeatCount > beatsBefore, 'background beats advance throughout the cinematic');
    assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation, generationBefore, 'cinematic never restarts the music transport');
    assert.strictEqual(w.rhythmSystem.isActive(), false, 'camera handoff does not restore Rhythm Mode');
    assert.strictEqual(w.player.controlsDisabled, false, 'boss handoff restores normal controls');
    assert.strictEqual(w.rhythmSystem.showRhythmMode().ok, true, 'a fresh R activation works at boss-ready');
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
    const { w, p, beat } = createRig();
    const combat = w.BARCODE.playerCombat;
    beat('miss');
    assert.match(combat.getFeedback().text, /EARLY|LATE/, 'timing failure explains timing rather than target contact');
    beat();
    assert.match(combat.getFeedback().text, /MOVE CLOSER/, 'perfect timing without a target never claims damage');
    const enemy = new w.Enemy(1000, 750, 'firewall');
    enemy.position.x = w.player.position.x + 100;
    enemy.position.y = w.player.position.y;
    enemy.health = 100;
    w.enemyManager.enemies = [enemy];
    beat();
    assert.strictEqual(enemy.health, 97);
    assert.match(combat.getFeedback().text, /3 DAMAGE/, 'real enemy contact reports the attack damage');
    const before = combat.getFeedback();
    w.gameState.paused = true;
    combat.resolvePrimary();
    assert.deepStrictEqual(combat.getFeedback(), before, 'paused input cannot replace feedback or advance its game-clock lifetime');
    w.gameState.paused = false;
    w.gameState.gameTime += 1001;
    assert.strictEqual(combat.getFeedback(), null, 'feedback expires without another timer');
    p.startMission();
    const lift = w.Sector1Progression.SIGNAL_LIFT;
    w.player.position.x = lift.x + lift.w / 2;
    w.player.position.y = 750;
    w.player.grounded = true;
    w.player.supportedSurfaceId = lift.id;
    beat();
    assert.match(combat.getFeedback().text, /LIFT CHARGED 1\/2/, 'a traversal hit explains lift charging instead of claiming an empty attack');
    combat.reset();
    assert.strictEqual(combat.getFeedback(), null, 'retry/reset cannot retain feedback from the last run');
  }

  {
    const { w } = createRig();
    for (const [type, animations, margin] of [
      ['virus', ['virus_idle_idle'], 0.15],
      ['corrupted', ['corrupted_idle_idle', 'corrupted_walk_walk'], 0.12],
      ['firewall', ['firewall_idle_idle', 'firewall_walk_walk', 'firewall_attack_default'], 0.08]
    ]) {
      for (const animation of animations) for (const facing of [-1, 1]) {
        const enemy = new w.Enemy(1500, 750, type);
        enemy.position.x = 1500;
        enemy.position.y = 750;
        enemy.facing = facing;
        enemy.currentAnimation = animation;
        enemy.spriteReady = true;
        let drawn, queried;
        enemy.sprite = {
          draw(ctx, x, y, options) { drawn = { x, y, ...options }; },
          getHitboxWorld(x, y, options) {
            queried = { x, y, ...options };
            return { x: x - 50 * options.scale, y: y - 100 * options.scale,
              width: 100 * options.scale, height: 100 * options.scale };
          }
        };
        enemy.drawSprite({ save() {}, restore() {} });
        const box = enemy.getVisualBounds();
        assert.deepStrictEqual(queried, drawn, `${type}/${animation}/${facing}: visual diagnostics use the exact rendered sprite transform`);
        assert(Math.abs(box.width - 100 * drawn.scale * (1 - margin * 2)) < 1e-8, 'existing contact margin is preserved');
        assert(Math.abs((box.y + box.height / 2) - (drawn.y - 50 * drawn.scale)) < 1e-8, 'tightened hitbox stays centered on the visible body');
      }
    }
  }

  {
    const { w, p } = createRig();
    const env = w.BARCODE.JammerEnvironment;
    env.reveal({ position: { x: 1550, y: 750 } });
    const stages = [env.getStatus().stage.index];
    let hits = 0;
    w.particleSystem.impact = () => { hits++; };
    for (let i = 1; i <= 16; i++) {
      env.applyRhythmDamage({ timing: 'perfect', sequence: i });
      if (i % 4 === 0) stages.push(env.getStatus().stage.index);
      const health = env.getStatus().health;
      env.applyRhythmDamage({ timing: 'perfect', sequence: i });
      assert.strictEqual(env.getStatus().health, health, 'feedback cannot turn a duplicate input into another Jammer hit');
    }
    assert.deepStrictEqual(stages, [0, 1, 2, 3, 4], 'all sixteen hits advance through four visible stages into restoration');
    assert.strictEqual(hits, 4, 'three intermediate impacts plus the existing destruction impact fire once each');
    assert.strictEqual(p.cinematicStartedCount, 1);
    env.reset();
    assert.strictEqual(env.getStatus().stage.index, 0, 'reset clears the previous run’s Jammer presentation stage');
  }

  {
    const { w, p } = createRig();
    p.startMission();
    const objectives = new w.ObjectivesSystem();
    objectives.setMissionDefeatObjective(0, 20);
    const texts = [];
    const ctx = { save() {}, restore() {}, fillRect() {}, strokeRect() {}, fillText(text) { texts.push(text); } };
    objectives.draw(ctx);
    assert(texts.some(text => String(text).includes('MOVE RIGHT')), 'between encounters the mission tells the player where to go');
    p.spawnEncounter(w.Sector1Progression.ENCOUNTERS[0]);
    p.activeEncounterEnemies = [{ active: false }, { active: true }];
    texts.length = 0;
    objectives.draw(ctx);
    assert(texts.some(text => String(text).includes('Signal Alley: 1/4 cleared')), 'mission distinguishes defeated actors from unreleased packets');
    assert(texts.some(text => String(text).includes('Land on enemies')), 'each active encounter offers its matching play hint');
    p.state = 'jammer_active';
    objectives.revealJammerObjective();
    w.BARCODE.JammerEnvironment.reveal({ position: { x: 1550, y: 750 } });
    w.BARCODE.JammerEnvironment.applyRhythmDamage({ timing: 'perfect', sequence: 1 });
    texts.length = 0;
    objectives.draw(ctx);
    assert(texts.some(text => String(text).includes('15/16 integrity')), 'the active objective follows actual Jammer health');
    assert(!texts.some(text => String(text).includes('Defeat 20 enemies')), 'completed objectives remain recorded but stop covering the active fight');
    assert(objectives.objectives.find(o => o.id === 'defeat_20_enemies').completed);
  }

  {
    const { w, p } = createRig();
    w.tutorialSystem.active = true;
    w.tutorialSystem.completed = false;
    const gate = w.Sector1Progression.ENCOUNTER_GATES[0];
    assert.strictEqual(p.getCurrentGate().id, gate.id, 'opening boundary exists before the tutorial ends');
    for (const y of [750, 200]) {
      w.player.position.x = gate.x - w.player.width / 2 - 5;
      w.player.position.y = y;
      w.player.velocity.x = 300;
      w.player.update(250, true);
      assert(w.player.position.x + w.player.width / 2 <= gate.x, 'ground and airborne movement cannot pass the tutorial boundary');
    }
    w.player.position.x = 4000; // An old saved/test position must not strand the mission.
    w.tutorialSystem.active = false;
    w.tutorialSystem.completed = true;
    p.update(16);
    assert.strictEqual(p.state, 'encounter_1');
    assert(w.player.position.x + w.player.width / 2 <= gate.x, 'tutorial handoff repairs an already-past-gate position');
    assert.strictEqual(p.missionDefeats, 0, 'boundary correction cannot award mission credit');
    p.state = 'jammer_active';
    p.closedGateEncounterId = null;
    w.player.position.x = 3500;
    p.applyGateCollision();
    assert.strictEqual(w.player.position.x, 3500, 'the full map opens after encounters');
    p.reset();
    assert.strictEqual(p.getCurrentGate().id, gate.id, 'restart restores the opening boundary');
  }

  {
    const { w, p, beat, context } = createRig();
    p.startMission();
    const lift = w.Sector1Progression.SIGNAL_LIFT;
    const positions = new Set();
    // Exercise every authored slot, including both ends of random selection.
    for (const px of [200, 2047, 2048, 3900]) {
      for (const value of [0, 0.34, 0.67, 0.999999]) {
        vm.runInContext(`Math.random = () => ${value}`, context);
        w.player.position.x = px;
        p.revealJammer();
        const jammer = w.BARCODE.JammerEnvironment.getStatus().position;
        positions.add(jammer.x);
        assert.strictEqual(jammer.x < 2048, px >= 2048, 'Jammer stays in the opposite map half');
        for (const playerX of [lift.x - 17, lift.x + lift.w + 17]) {
          w.player.position.x = playerX;
          w.player.position.y = 750;
          w.player.grounded = true;
          w.player.supportedSurfaceId = lift.id;
          p.resetSignalLift();
          w.player.supportedSurfaceId = lift.id;
          const hit = beat();
          assert(!hit.targets.some(t => t.type === 'broadcast_jammer'), 'a beat on either lift lip cannot also hit the Jammer');
          assert.strictEqual(w.BARCODE.JammerEnvironment.getStatus().health, 16);
        }
      }
    }
    assert.strictEqual(positions.size, 6, 'every safe random slot was exercised');
  }
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
    const stompBursts = [];
    w.particleSystem.stompEffect = (...args) => stompBursts.push(args);
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
    assert.strictEqual(stompBursts.length, 1, 'a successful cyan stomp emits the dedicated heavy burst');
    assert.strictEqual(stompBursts[0][1], hitbox.y, 'the stomp burst stays at the boss head contact');
    w.player.velocity.y = 200;
    assert.strictEqual(p.applyBossStomp(w.player, movement), true, 'a repeated landing bounces safely even after the cycle counter was spent');
    assert.strictEqual(p.boss.health, health - 1);
    assert.strictEqual(stompBursts.length, 1, 'a guarded repeat keeps its smaller guard effect');
  }

  {
    const rig = createRig();
    const { w, p, tick } = rig;
    rig.reachReady();
    w.player.position.x = 1300;
    p.boss.x = 3480;
    p.beginBossCombat();
    const cameraX = p.cameraX;
    tick(1000);
    assert.strictEqual(p.boss.x, 3300, 'offscreen boss walks exactly 180 world pixels per second toward the player');
    assert.strictEqual(p.boss.facing, -1);
    assert.strictEqual(p.cameraX, cameraX, 'boss pursuit does not drive the released cinematic camera');
    assert.strictEqual(p.boss.phase, 'approach');
    assert.strictEqual(p.boss.pulses.length, 0, 'offscreen approach does not launch an unannounced attack');
  }

  {
    for (const phase of ['approach', 'telegraph', 'sweep', 'recovery']) {
      for (const health of [1, 3]) {
        const rig = createRig();
        const { w, p } = rig;
        rig.reachReady();
        p.beginBossCombat();
        p.setBossCombatPhase(phase);
        w.player.health = health;
        w.player.position.x = p.boss.x;
        w.player.position.y = p.getBossHitbox().y - w.Player.VISUAL_FOOT_OFFSET_Y - 5;
        w.player.velocity.x = 0;
        w.player.velocity.y = 400;
        w.player.grounded = false;
        const bossHealth = p.boss.health;
        w.player.update(50, true);
        p.update(50);
        assert.strictEqual(w.player.health, health, `${phase}: a top landing never drains player health`);
        assert(w.player.velocity.y < 0, `${phase}: guarded and vulnerable tops both rebound`);
        assert.strictEqual(p.boss.health, bossHealth - (phase === 'recovery' ? 1 : 0), 'only the cyan window takes stomp damage');
        assert.deepStrictEqual(rig.calls.errors, []);
      }
    }
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


  // The owner reproduced a zero-input boss-head loop. Exercise the real
  // player's integration, landing/rearm and boss phases across frame rates.
  for (const fps of [30, 60, 120]) {
    const rig = createRig();
    const { w, p, tick } = rig;
    rig.reachReady(); reachRecovery(rig);
    const health = p.boss.health;
    const generation = w.BARCODE.MusicTransport.getDiagnostics().generation;
    const box = p.getBossHitbox();
    w.player.position.x = p.boss.x;
    w.player.position.y = box.y - w.Player.VISUAL_FOOT_OFFSET_Y - 2;
    w.player.velocity.x = 0; w.player.velocity.y = 400;
    w.player.grounded = false; w.player.airInput = 0;
    w.player.invulnerableUntil = 1e9; // Isolate the exploit from pulse deaths.
    w.player.update(1000 / fps, true);
    assert.strictEqual(p.boss.health, health - 1, 'first valid counter stomp still deals damage');
    const departureX = w.player.position.x;
    for (let i = 0; i < fps * 8; i++) {
      w.player.update(1000 / fps, true); tick(1000 / fps);
      if (i === Math.ceil(fps * 0.3)) assert(Math.abs(w.player.position.x - departureX) > 85, `${fps} FPS rebound clears the head with no input`);
    }
    assert.strictEqual(p.boss.health, health - 1, `${fps} FPS: hands-off bouncing cannot damage another cycle`);
    assert(w.player.grounded && p.boss.stompArmed, 'a real floor landing rearms the next intentional stomp');
    assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation, generation, 'impact/rebound never restarts the music');
    assert.deepStrictEqual(rig.calls.errors, []);
  }

  {
    const rig = createRig(); const { w, p } = rig;
    rig.reachReady(); p.beginBossCombat(); p.setBossCombatPhase('recovery');
    const hitbox = p.getBossHitbox(); const offset = w.Player.VISUAL_FOOT_OFFSET_Y;
    const land = () => {
      w.player.grounded = false; w.player.velocity.y = 200; w.player.position.x = p.boss.x;
      return p.applyBossStomp(w.player, { previousX: p.boss.x, previousFootY: hitbox.y - offset - 10, currentFootY: hitbox.y - offset + 10 });
    };
    land(); const health = p.boss.health;
    p.setBossCombatPhase('telegraph'); p.setBossCombatPhase('recovery'); land();
    assert.strictEqual(p.boss.health, health, 'a new cyan cycle alone does not rearm a hovering stomp');
    for (const [x, direction] of [[160, 1], [3936, -1]]) {
      p.boss.x = x; land();
      assert.strictEqual(w.player.bossReboundDirection, direction, 'wall-adjacent rebound always aims into playable space');
    }
    w.gameState.gameOver = true;
    assert(p.retryBossCheckpoint().ok);
    assert.strictEqual(w.player.bossReboundMs, 0, 'retry clears any unfinished horizontal impulse');
    assert.strictEqual(p.boss.stompArmed, true);
  }

  for (const fps of [30, 60, 120]) {
    const rig = createRig(); const { w, p, tick } = rig;
    rig.reachReady(); p.beginBossCombat();
    w.player.position.x = p.boss.x - 150; w.player.invulnerableUntil = 1e9;
    const openings = [];
    for (let i = 0; i < fps * 24; i++) {
      const before = p.boss.phase;
      tick(1000 / fps);
      if (before !== p.boss.phase && ['sweep', 'recovery'].includes(p.boss.phase)) {
        const sample = p.getBossMusicSample();
        const fraction = sample.grid.beatFloat % 1;
        assert(fraction * sample.grid.beatDurationSec <= 1 / fps + 0.00001, 'attack and counter opening follow a real transport boundary');
        if (p.boss.phase === 'recovery') openings.push(w.audioSystem.context.currentTime);
      }
    }
    assert(openings.length >= 2, 'musical phases keep advancing without a second scheduler');
    p.boss.health = 6; p.setBossCombatPhase('telegraph');
    assert(p.boss.doublePulse && !p.boss.latePhase, 'double pulse arrives while retaining the generous warning/recovery');
    p.boss.health = 3; p.setBossCombatPhase('telegraph');
    assert(p.boss.latePhase, 'only the last three health enable the faster warning/recovery');
    p.setBossCombatPhase('sweep');
    const pulseCount = p.boss.pulseSequence;
    for (let i = 0; i < fps * 3 && p.boss.phase === 'sweep'; i++) tick(1000 / fps);
    assert.strictEqual(p.boss.pulseSequence, pulseCount + 1, 'double attack emits exactly one additional pulse');
    assert.strictEqual(p.boss.phase, 'recovery', 'double pulse still earns a counter opening');
    const t = w.BARCODE.MusicTransport;
    p.setBossCombatPhase('telegraph'); tick(200);
    t.pause(w.audioSystem.context.currentTime); t.resume(w.audioSystem.context.currentTime);
    rig.until(() => p.boss.phase === 'recovery', 'transport generation changes do not strand the fight');
  }

  {
    const { w, p, beat } = createRig();
    const combat = w.BARCODE.playerCombat;
    const generation = w.BARCODE.MusicTransport.getDiagnostics().generation;
    w.player.takeDamageWithKnockback(1, 20, -20);
    assert.match(combat.getFeedback().text, /RHYTHM MODE LOST/);
    assert.strictEqual(w.rhythmSystem.running, true);
    assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation, generation);
    const texts = [];
    const ctx = { save() {}, restore() {}, fillRect() {}, beginPath() {}, ellipse() {}, stroke() {}, fillText(t) { texts.push(t); } };
    combat.drawPlayerTimingCue(ctx, w.player);
    assert(texts.includes('PRESS R — RHYTHM OFF'), 'mode loss has an immediate player-local cue');
    w.rhythmSystem.show(); texts.length = 0; combat.drawPlayerTimingCue(ctx, w.player);
    assert(!texts.includes('DOWN: BEAT · R: EXIT'), 'active timing is consolidated in the compact HUD');
    Object.assign(ctx, { strokeRect() {}, translate() {}, rotate() {} });
    w.rhythmSystem.drawCompactHUD(ctx);
    assert(texts.includes('DOWN / HIT THE TARGET'), 'active controls stay visible beside the predictive target');
    const seconds = p.getBossMusicSample().grid.beatDurationSec;
    const rule = w.BARCODE.MusicProfiles.getActive().judgmentRules[0].id;
    const early = w.BARCODE.MusicTransport.judgeInput(rule, seconds * 60 - 0.15);
    const late = w.BARCODE.MusicTransport.judgeInput(rule, seconds * 60 + 0.15);
    assert(early.signedOffsetMs < 0 && late.signedOffsetMs > 0, 'early/late derives from the same authoritative grid');
    combat.reset(); w.rhythmSystem.hideRhythmMode(); texts.length = 0;
    combat.drawPlayerTimingCue(ctx, w.player);
    assert.strictEqual(texts.length, 0, 'reset removes the previous attempt’s mode-loss cue');
  }

  for (const type of ['corrupted', 'firewall']) {
    const { w, calls } = createRig();
    const enemy = new w.Enemy(1400, 750, type);
    enemy.position.x = 1400; enemy.position.y = 750; enemy.entranceComplete = true;
    enemy._sector1MissionEnemy = true; enemy.spriteReady = false;
    w.player.position.x = 1600;
    for (let i = 0; i < 60 && enemy.combatPattern !== 'brace'; i++) enemy.update(1000 / 60, w.player);
    assert.strictEqual(enemy.combatPattern, 'brace');
    const x = enemy.position.x; const direction = enemy.committedDirection;
    w.player.position.x = enemy.position.x - 200; // Dodge behind during warning.
    enemy.update(300, w.player);
    assert.strictEqual(enemy.position.x, x, 'warning is a real stationary interval');
    for (let i = 0; i < 90 && enemy.combatPattern !== 'attack'; i++) enemy.update(1000 / 60, w.player);
    assert.strictEqual(enemy.combatPattern, 'attack');
    assert.strictEqual(Math.sign(enemy.velocity.x), direction, 'committed attack does not retarget the dodging player');
    for (let i = 0; i < 60 && enemy.combatPattern !== 'recovery'; i++) enemy.update(1000 / 60, w.player);
    assert.strictEqual(enemy.combatPattern, 'recovery');
    enemy.update(200, w.player); assert.strictEqual(enemy.velocity.x, 0, 'recovery creates a usable stationary counter opportunity');
    const texts = [];
    enemy.drawCombatCue({ save() {}, restore() {}, beginPath() {}, arc() {}, stroke() {}, fillRect() {}, fillText(t) { texts.push(t); } });
    assert(texts.includes('RECOVERING'));
    assert.deepStrictEqual(calls.errors, []);
  }

  {
    const { w } = createRig();
    const e = new w.Enemy(500, 700, 'virus');
    e.position.x = 500; e.position.y = 700; e.entranceComplete = true;
    e.role = 'swooper'; e.swooperState = 'approach'; e._sector1MissionEnemy = true;
    w.enemyManager.enemies = [e]; w.player.position.x = 900;
    for (let i = 0; i < 60 && e.swooperState !== 'telegraph'; i++) e.updateSwooperBehavior(1 / 60, w.player);
    assert.strictEqual(e.swooperAim.x, 900);
    w.player.position.x = 200;
    for (let i = 0; i < 60 && e.swooperState !== 'dive'; i++) e.updateSwooperBehavior(1 / 60, w.player);
    assert.strictEqual(e.swooperState, 'dive');
    assert.strictEqual(e.swooperDiveDirection, 1, 'swooper follows its advertised lane instead of snapping to the new player location');
  }

  for (const fps of [30, 60, 120]) {
    const rig = createRig(); const { w, p, tick } = rig;
    rig.reachReady(); p.beginBossCombat();
    p.boss.health = 6; p.boss.cycle = 1; p.setBossCombatPhase('telegraph');
    w.player.position.x = p.boss.x - 230; w.player.position.y = 750;
    w.player.grounded = true; w.player.allowMovement = true; w.player.invulnerableUntil = 0;
    w.inputManager = { actionInput: { state: { jump: { held: true } } }, isKey: () => false };
    rig.until(() => p.boss.phase === 'sweep', 'double pulse begins');
    w.rhythmSystem.hideRhythmMode(); // Exit the planted stance before evading.
    assert(w.player.jump(), 'ordinary single jump begins without an assist');
    for (let i = 0; i < fps * 2; i++) { w.player.update(1000 / fps, true); tick(1000 / fps); }
    assert.strictEqual(w.player.health, 3, `${fps} FPS: a normal held jump clears the double pulse without invulnerability`);
    assert.strictEqual(p.boss.health, 6, 'jumping the wave did not secretly stomp the boss');
    assert.deepStrictEqual(rig.calls.errors, []);
  }

  console.log('Level 1 boss production-module checks passed');
}
module.exports = { createRig, load };
if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exit(1); });
