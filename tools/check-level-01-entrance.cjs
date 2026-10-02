#!/usr/bin/env node
// Exercise the real player/lifecycle/input owners; the canonical sprite's
// animation boundary and browser services are supplied by existing fixtures.
const assert = require('node:assert/strict');
const { createRig, load } = require('./check-level-01-boss');
const { createSprite, playerClips } = require('./makko-animation-fixture');
const copy = value => JSON.parse(JSON.stringify(value));
const near = (a, b, message) => assert(Math.abs(a - b) < 1e-7, `${message}: ${a} / ${b}`);

function rig() {
  const result = createRig(), { w, context } = result;
  load(context, 'src/engine/renderer.js');
  w.renderer = new w.Renderer({ width: 1920, height: 1080, getContext: () => ({}) });
  w.renderer.resetFollowCamera(200);
  w.rhythmSystem.hideRhythmMode();
  w.player = new w.Player(200, w.Player.GROUND_Y);
  w.sector1Progression.player = w.player;
  w.player.sprite = createSprite(playerClips);
  w.player.spriteReady = true;
  w.player.allowMovement = true;
  w.player.grounded = true;
  return result;
}

// The constructor is safe for boot and restored player creation. At every
// supported zoom the complete frame starts offscreen, then advances at normal
// walk speed without the world-boundary clamp pulling it into view.
for (const zoom of [1, 0.735, 0.625]) for (const fps of [30, 60, 120, 144]) {
  const { w, calls, timers } = rig(), p = w.player;
  assert.equal(p.isEntering, false, 'construction never starts a hidden entrance clock');
  near(p.position.x, 200, 'constructor retains normal spawn');
  w.renderer.zoomLevel = zoom;
  const pending = timers.size, particles = w.particleSystem.particles.length;
  p.startEntranceAnimation();
  const rightExtent = (288 - 144) * (71 / 99);
  assert(960 + (p.position.x + rightExtent - 960) * zoom < 0,
    `${fps} Hz / zoom ${zoom}: the whole canonical frame is outside the left edge`);
  const start = p.position.x, duration = p.entranceDuration;
  const walkRef = p.animationRef, frames = new Set();
  for (let elapsed = 0; elapsed < 500 - 1e-7;) {
    const delta = Math.min(1000 / fps, 500 - elapsed);
    p.update(delta); elapsed += delta;
    frames.add(p.animationRef.currentFrame);
    assert.equal(p.animationRef, walkRef, 'entrance preserves the existing walk owner');
    assert.equal(p.state, 'walk'); assert.equal(p.grounded, true);
    assert.equal(p.position.y, w.Player.GROUND_Y);
    assert.equal(p.velocity.x, p.speed);
    assert.equal(p.getVisualAnchor().visibleFootY, w.Player.GROUND_Y + 72);
  }
  near(p.position.x, start + 150, 'half a second advances 150 world units at every display rate');
  assert(frames.size >= 5, 'visible entrance uses a cycling whole-body walk');
  const frozen = copy({ position: p.position, elapsed: p.entranceElapsedMs, animation: p.animationTime,
    frame: p.animationRef.currentFrame, velocity: p.velocity });
  w.isPaused = true; p.update(5000); p.updateEntranceAnimation(5000);
  assert.deepEqual(copy({ position: p.position, elapsed: p.entranceElapsedMs, animation: p.animationTime,
    frame: p.animationRef.currentFrame, velocity: p.velocity }), frozen, 'pause freezes motion and gait');
  w.isPaused = false;
  w.BARCODE.LevelDifficulty = { open: true }; p.update(5000); p.updateEntranceAnimation(5000);
  assert.deepEqual(copy({ position: p.position, elapsed: p.entranceElapsedMs, animation: p.animationTime,
    frame: p.animationRef.currentFrame, velocity: p.velocity }), frozen, 'difficulty reading freezes entrance');
  w.BARCODE.LevelDifficulty.open = false;
  assert.equal(p.takeDamage(1), false, 'entrance cannot accept contact damage');
  assert.equal(p.health, p.maxHealth);
  p.moveLeft(); p.stopHorizontal(); assert.equal(p.jump(), false);
  near(p.position.x, frozen.position.x, 'commands cannot interrupt authored position');
  assert.equal(p.velocity.x, p.speed);
  p.update(duration - 500 - 1);
  assert.equal(p.isEntering, true, 'no early final-position pop');
  near(p.position.x, 199.7, 'last millisecond is still a normal walking step');
  p.update(1);
  assert.equal(p.isEntering, false); assert.equal(p.controlsDisabled, false);
  near(p.position.x, 200, 'complete entrance returns exactly to normal spawn');
  assert.equal(p.state, 'idle'); assert.equal(p.velocity.x, 0);
  p.moveRight(); p.update(100);
  near(p.position.x, 230, 'normal playable movement resumes with original speed');
  assert.equal(timers.size, pending, 'entrance owns no independent timeout');
  assert.equal(w.particleSystem.particles.length, particles, 'walk does not create teleport blasts');
  assert.deepEqual(calls.errors, []);
}

{
  const { w } = rig(), p = w.player;
  Object.assign(p, { invulnerable: true, invulnerableUntil: 1e9, controlsDisabledUntil: 1e9,
    _enemyInvulnerableUntilMs: 1e9, impactHoldMs: 500, afterimageMs: 200,
    primaryAttackAnimationMs: 180, cinematicPoseActive: true, hudReaction: { kind: 'hurt', remainingMs: 750 } });
  p.startEntranceAnimation();
  assert.equal(p.invulnerable, false); assert.equal(p.invulnerableUntil, 0);
  assert.equal(p.controlsDisabledUntil, 0); assert.equal(p._enemyInvulnerableUntilMs, 0);
  assert.equal(p.impactHoldMs + p.afterimageMs + p.primaryAttackAnimationMs, 0);
  assert.equal(p.hudReaction, null); assert.equal(p.cinematicPoseActive, false);
  assert.equal(p.controlsDisabled, true); assert.equal(p.isDamageInvulnerable(), true);
}

// Input still permits pause while preventing fake tutorial movement/jump
// credit, premature Rhythm Mode, attacks and hacks during the authored walk.
{
  const { w, context } = rig();
  load(context, 'src/core/action-input.js'); load(context, 'src/core/input.js');
  let pauses = 0, modes = 0, attacks = 0, hacks = 0, credit = 0;
  w.BARCODE.RuntimeLifecycle = { togglePause() { pauses++; } };
  w.rhythmSystem.showRhythmMode = () => { modes++; return { ok: true }; };
  w.BARCODE.playerCombat.resolvePrimary = () => { attacks++; return { ok: true }; };
  w.hackingSystem.start = () => { hacks++; };
  Object.assign(w.tutorialSystem, { active: true, storyChapter: 3, checkObjective() { credit++; } });
  const manager = new w.InputManager(); w.inputManager = manager;
  w.player.startEntranceAnimation();
  const actions = { pause: { pressed: true }, rhythm_mode: { pressed: true }, move_right: { held: true },
    move_left: { held: false }, move_down: { held: false }, jump: { pressed: true },
    primary: { pressed: true }, interact: { pressed: true }, inspect: { pressed: true } };
  manager.routeActions(actions);
  assert.equal(pauses, 1); assert.equal(modes + attacks + hacks + credit, 0);
  assert.equal(manager.hasTrackedMovement, false); assert.equal(manager.hasTrackedJump, false);
  assert.equal(manager.acceptsGameplay(), false);
  w.player.update(w.player.entranceDuration);
  assert.equal(manager.acceptsGameplay(), true);
  manager.routeActions({ ...actions, pause: { pressed: false }, rhythm_mode: { pressed: false },
    primary: { pressed: false }, interact: { pressed: false }, jump: { pressed: false }, inspect: { pressed: false } });
  assert.equal(manager.hasTrackedMovement, true, 'only real post-entrance input earns tutorial movement');
  assert.equal(credit, 1); assert.equal(w.player.velocity.x, w.player.speed);
}

async function lifecycleChecks() {
  // A previously completed tutorial cannot write a rejected negative-x
  // objective checkpoint while the fresh actor is still entering the stage.
  {
    const { w } = rig(), checkpoints = [];
    w.BARCODE.Campaign = { tick() {}, begin() {}, checkpoint(id) {
      checkpoints.push({ id, x: w.player.position.x }); return true;
    } };
    w.player.startEntranceAnimation();
    w.sector1Progression.update(16);
    assert.equal(w.sector1Progression.missionStarted, false);
    assert.deepEqual(checkpoints, [], 'no mission/checkpoint snapshot while outside the world');
    w.player.update(w.player.entranceDuration);
    w.sector1Progression.update(16);
    assert.equal(w.sector1Progression.missionStarted, true);
    assert(checkpoints.length >= 1 && checkpoints.every(item => item.x === 200),
      'tutorial-complete handoff keeps every initial checkpoint at the normal safe spawn');
  }
  // Both the completed and skipped comic meet at the same fresh start owner.
  for (const comic of ['complete', 'skip']) {
    const { w, context } = rig(); let requests = 0, comicCalls = 0;
    const actualStart = w.player.startEntranceAnimation.bind(w.player);
    w.player.startEntranceAnimation = options => { requests++; return actualStart(options); };
    w.cutsceneSystem = { async start() { comicCalls++; }, destroy() {} };
    w.tutorialSystem.startTutorial = () => {};
    w.BARCODE.LevelDifficulty = { open: false, beginLevel() { this.open = true; }, stop() { this.open = false; } };
    w.BARCODE.Campaign = { resetSession() {} };
    load(context, 'src/core/runtime-lifecycle.js');
    assert.equal((await w.BARCODE.RuntimeLifecycle.start({ source: comic })).ok, true);
    assert.equal(comicCalls, 1); assert.equal(requests, 1);
    assert.equal(w.player.isEntering, true); assert.equal(w.renderer.zoomLevel, 1);
    const startX = w.player.position.x; w.player.update(10000);
    assert.equal(w.player.position.x, startX, 'difficulty selection cannot consume the entrance');
    w.BARCODE.LevelDifficulty.open = false;
    w.player.update(w.player.entranceDuration);
    assert.equal(w.player.position.x, 200); assert.equal(w.player.isEntering, false);
    assert.equal((await w.BARCODE.RuntimeLifecycle.restart()).ok, true);
    assert.equal(requests, 2, 'an explicit full-level restart earns a fresh entrance');
    assert.equal(comicCalls, 1, 'restart retains existing skip-comic behavior');
  }
  for (const levelId of ['level-01', 'level-02', 'level-03']) {
    const { w, context } = rig(); let requests = 0, restores = 0;
    w.player.startEntranceAnimation = () => { requests++; };
    w.cutsceneSystem = { start() { throw new Error('resume must not rerun comic'); }, destroy() {} };
    w.BARCODE.LevelDifficulty = { beginLevel() { throw new Error('resume must not reopen difficulty'); } };
    w.BARCODE.Campaign = { resetSession() {}, restore() {
      restores++; w.player.position.x = 1350; w.player.isEntering = false; return true;
    } };
    if (levelId !== 'level-01') {
      const proof = { selectMusicProfile() { return { ok: true }; } };
      w.BARCODE[levelId === 'level-02' ? 'CacheRoadProof' : 'RunAndGunProof'] = proof;
      w.audioSystem.prepareActiveMusicProfile = async () => ({ ok: true });
    }
    load(context, 'src/core/runtime-lifecycle.js');
    assert.equal((await w.BARCODE.RuntimeLifecycle.start({ resume: { levelId, checkpointId: 'saved' } })).ok, true);
    assert.equal(restores, 1); assert.equal(requests, 0, `${levelId} checkpoint resume never requests entrance`);
    assert.equal(w.player.position.x, 1350); assert.equal(w.player.isEntering, false);
  }
  // Tutorial death returns to its ordinary safe street spawn without the
  // fresh-level procession, then keeps the original invulnerability policy.
  {
    const { w } = rig(); let requests = 0;
    w.player.startEntranceAnimation = () => { requests++; };
    w.player.health = 0; w.tutorialSystem.active = true;
    w.checkGameConditions();
    assert.equal(requests, 0); assert.equal(w.player.isEntering, false);
    assert.equal(w.player.health, w.player.maxHealth);
    assert.equal(w.player.position.x, 200); assert.equal(w.player.position.y, w.Player.GROUND_Y);
  }
  console.log('Level 1 entrance passed: true left-edge walk at 30/60/120/144 Hz, grounded gait, pause/difficulty, input credit, fresh/restart and checkpoint/respawn ownership.');
}
lifecycleChecks().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
