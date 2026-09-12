#!/usr/bin/env node
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');

for (const fps of [30, 60, 120]) {
  const { w, context } = createRig();
  load(context, 'src/core/action-input.js'); load(context, 'src/core/input.js');
  w.inputManager = new w.InputManager(); w.player.allowMovement = true;
  const input = w.inputManager.actionInput;
  const x = w.player.position.x;
  input.handleKeyDown('arrowright'); input.handleKeyDown(' ');
  for (let i = 0; i < fps; i++) { w.inputManager.update(); w.player.update(1000 / fps); }
  assert.strictEqual(w.player.position.x, x, `${fps}: active stance prevents horizontal travel`);
  assert.strictEqual(w.player.grounded, true, 'jump cannot leave a planted stance');
  assert.strictEqual(w.player.jumpBufferTimerMs, 0, 'blocked jump cannot queue a surprise jump');
  input.handleKeyDown('r'); w.inputManager.update(); w.player.update(1000 / fps);
  assert.strictEqual(w.rhythmSystem.isActive(), false);
  assert(w.player.position.x > x, 'fresh R releases stance and held direction resumes immediately');
  input.handleKeyUp('r'); input.handleKeyUp(' '); w.inputManager.update();
  assert.strictEqual(w.player.jump(), true);
  assert.strictEqual(w.rhythmSystem.show().reason, 'land-to-enter', 'airborne entry cannot freeze a jump');
  w.player.stompRebound(1); const reboundX = w.player.position.x;
  for (let i = 0; i < fps / 5; i++) w.player.update(1000 / fps);
  assert(w.player.position.x > reboundX, 'forced rebound preserves horizontal separation');
}

{
  const { w, timers } = createRig();
  const player = w.player;
  let playing = null, starts = 0, ticks = 0;
  player.spriteReady = true;
  player.sprite = { getCurrentAnimation: () => playing, stop() {}, update() { ticks++; },
    play(name) { starts++; playing = name; return { currentFrame: 0, isInterrupted: false }; } };
  const timerCount = timers.size;
  player.updateState();
  for (let i = 0; i < 120; i++) player.updateSpriteAnimation(1000 / 60);
  assert.strictEqual(starts, 1, 'stationary performance clip plays continuously without restart');
  assert.strictEqual(ticks, 120); assert.strictEqual(timers.size, timerCount, 'animations create no delayed recovery timers');
  w.rhythmSystem.hide(); player.velocity.x = 300; player.updateState(); player.updateSpriteAnimation(16);
  const walkStarts = starts;
  for (let i = 0; i < 20; i++) player.playAnimation('walk');
  assert.strictEqual(starts, walkStarts, 'repeated walk requests preserve animation progress');
  player.allowMovement = true; player.jump(); player.updateState(); player.updateSpriteAnimation(16);
  assert.strictEqual(playing, '6_bit_jump_jump');
  player.grounded = true; player.velocity.x = 0; player.updateState(); player.updateSpriteAnimation(16);
  assert.strictEqual(playing, '6_bit_idle_idle');
  player.jump(); player.updateState(); player.updateSpriteAnimation(16);
  assert.strictEqual(playing, '6_bit_jump_jump'); assert.strictEqual(starts, walkStarts + 3);
}

{
  const { w, p, beat } = createRig(); p.startMission();
  const lift = p.signalLift;
  w.player.position.x = lift.x + lift.w / 2; w.player.position.y = lift.y - 72;
  w.player.grounded = true; w.player.supportedSurfaceId = lift.id; w.player.allowMovement = true;
  assert.strictEqual(beat().liftCharges, 1); assert.strictEqual(lift.chargeFxMs, 520);
  assert.strictEqual(beat().liftCharges, 2);
  const startY = w.player.position.y;
  p.updateSignalLift(100); assert(w.player.position.y < startY, 'lift carries the planted player normally');
  assert.strictEqual(w.rhythmSystem.isActive(), true);
  assert.strictEqual(w.player.getContactShadow().y, lift.y + 2, 'shadow follows moving lift contact');
  p.updateSignalLift(600); assert.strictEqual(lift.chargeFxMs, 0, 'charge effect expires on existing frame clock');
  p.resetSignalLift(); assert.strictEqual(p.signalLift.chargeFxMs, 0);
}

{
  const { w, context, p } = createRig();
  load(context, 'src/game/hacking.js'); w.hackingSystem = new w.HackingSystem();
  const h = w.hackingSystem;
  const generation = w.BARCODE.MusicTransport.getDiagnostics().generation;
  assert(h.start()); assert(!w.rhythmSystem.isActive());
  h.puzzleType = 2; h.update(h.bootDurationMs);
  const answer = h.currentPuzzle.answer; h.update(h.displayTime);
  assert.strictEqual(h.currentPuzzle.display, null, 'memorization answer is hidden during input');
  w.player.health = 2;
  answer.split('').forEach(key => h.processInput(key)); h.processInput('Enter');
  assert.strictEqual(w.player.health, 3); assert(w.rhythmSystem.isActive(), 'success restores a previously active grounded stance');
  assert.strictEqual(h.resultFx.outcome, 'success'); h.update(1000); assert.strictEqual(h.resultFx, null);
  assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation, generation);
  h.cooldownUntil = 0; assert(h.start());
  w.player.takeDamage(1);
  assert(!h.active && !w.rhythmSystem.isActive(), 'damage cancels a hack without restoring the suspended stance');
  h.cooldownUntil = 0; w.rhythmSystem.show(); h.start();
  p.onJammerDestroyed(); h.cancel();
  assert(!w.rhythmSystem.isActive(), 'late hack completion cannot override cinematic mode suppression');
  h.reset(); assert.strictEqual(h.resultFx, null);
}

{
  const { w, context } = createRig();
  load(context, 'src/engine/parallax.js');
  const bg = new w.ParallaxBackground(); const layer = { imgElement: {} }; bg.layers = [{}, layer];
  const rects = []; const ctx = { save() {}, restore() {}, fillRect(...r) { rects.push(r); } };
  const before = w.BARCODE.MusicTransport.getDiagnostics();
  bg.drawSignalLights(ctx, layer, 0, 0, 1279, 462);
  assert.strictEqual(rects.length, 5); assert.deepStrictEqual(rects[0], [99, 273, 79, 13]);
  rects.length = 0; bg.drawSignalLights(ctx, layer, 100, -50, 2558, 924);
  assert.deepStrictEqual(rects[0], [298, 496, 158, 26], 'lights follow the foreground image transform exactly');
  assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation, before.generation);
  assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().listenerCount, before.listenerCount, 'light rendering owns no clock listeners');
}
{
  const { w, p, tick, beat, until, context, timers } = createRig();
  w.audioSystem.playVirusDefeatSound = () => {};
  w.audioSystem.playEnemyDefeatSound = () => {};
  w.particleSystem.explosion = () => {};
  p.startMission();
  const music = w.BARCODE.MusicTransport.getDiagnostics();
  const timerCount = timers.size;
  for (const [index, encounter] of w.Sector1Progression.ENCOUNTERS.entries()) {
    w.player.position.x = encounter.triggerX;
    for (let elapsed = 0; p.state === encounter.id && elapsed < 10000; elapsed += 100) {
      tick(100);
      for (const enemy of w.enemyManager.enemies) {
        if (!enemy.active) continue;
        enemy.active = false;
        w.enemyManager.recordDefeat(enemy);
      }
    }
    assert.notStrictEqual(p.state, encounter.id, 'real encounter packets clear');
    assert(p.getGatePresentation().some(view => view.gate.encounterId === encounter.id && view.opening), 'each real encounter clear starts its gate collapse, including final Jammer reveal');
    assert.deepStrictEqual(Array.from(p.getDistrictSignalState().zones, zone => zone.cleared),
      [0, 1, 2, 3].map(zone => zone <= index), 'only the completed part of the district stabilizes');
  }
  assert.strictEqual(p.missionDefeats, 20, 'restoration does not change mission credit');
  assert.strictEqual(p.state, 'jammer_active', 'the final defeat restores Broadcast Gate even with immediate Jammer reveal');
  const clearedAt = Array.from(p.districtSignal.clearedAtMs);
  p.openEncounterGate('encounter_1'); tick(1000);
  assert.deepStrictEqual(Array.from(p.districtSignal.clearedAtMs), clearedAt, 'repeated gate callbacks cannot replay the local effect');
  const jammer = w.BARCODE.JammerEnvironment;
  w.player.position.x = jammer.getStatus().position.x - 150;
  for (let stage = 0; stage < 4; stage++) {
    tick(450);
    assert.strictEqual(p.getDistrictSignalState().interference, 1 - stage / 4, 'each four-hit Jammer stage settles to less interference');
    for (let hit = 0; hit < 4; hit++) beat();
  }
  assert.strictEqual(jammer.getStatus().health, 0);
  assert(!w.rhythmSystem.isActive(), 'the restoration payoff preserves Jammer mode exit');
  const origin = p.getDistrictSignalState().wave.originX;
  assert.strictEqual(origin, jammer.getStatus().position.x, 'wave starts at the actual randomized Jammer');
  tick(300);
  const wave = JSON.stringify(p.getDistrictSignalState().wave);
  w.gameState.paused = true; tick(1200);
  assert.strictEqual(JSON.stringify(p.getDistrictSignalState().wave), wave, 'pause freezes the wave');
  w.gameState.paused = false;
  p.onJammerDestroyed();
  assert.strictEqual(JSON.stringify(p.getDistrictSignalState().wave), wave, 'duplicate destruction never restarts the wave');
  until(() => p.state === 'boss_ready', 'district restoration accompanies the existing cinematic');
  assert(p.getDistrictSignalState().restored);
  assert.strictEqual(p.getDistrictSignalState().wave, null, 'bounded wave finishes before boss combat');
  assert.strictEqual(p.getDistrictSignalState().interference, 0);
  w.gameState.gameOver = true;
  assert(p.retryBossCheckpoint().ok);
  assert(p.getDistrictSignalState().restored, 'boss retry keeps the district restored');
  assert.strictEqual(p.getDistrictSignalState().wave, null, 'retry does not replay restoration');

  load(context, 'src/engine/parallax.js');
  const bg = new w.ParallaxBackground(), layer = { imgElement: {} }; bg.layers = [{}, layer];
  const operations = [], paints = [];
  const ctx = { save() {}, restore() {}, translate(...v) { operations.push(['translate', ...v]); },
    scale(...v) { operations.push(['scale', ...v]); }, fillRect(...v) { paints.push([this.fillStyle, ...v]); } };
  bg.drawSignalLights(ctx, layer, -380, -550, 4400, 1589);
  assert.deepStrictEqual(operations, [['translate', -380, -550], ['scale', 4400 / 1279, 1589 / 462]],
    'district lighting inherits the same foreground translation and scale as the art');
  assert(paints.length > 0 && paints.length <= bg.signalDisplays.length * 2, 'restored displays have steady light with no animated interference');
  assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation, music.generation);
  assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().listenerCount, music.listenerCount);
  assert.strictEqual(timers.size, timerCount, 'district restoration adds no timers');
  p.reset();
  assert(!p.getDistrictSignalState().active);
  p.startMission();
  assert(p.getDistrictSignalState().zones.every(zone => !zone.cleared));
  assert.strictEqual(p.getDistrictSignalState().interference, 1, 'full restart restores the original corrupted district');
  assert.strictEqual(p.getDistrictSignalState().wave, null);
}
console.log('Level 1 animation, stance, hack, effects and district-restoration checks passed');
