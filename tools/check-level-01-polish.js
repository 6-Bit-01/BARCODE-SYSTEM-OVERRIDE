#!/usr/bin/env node
// Chunked polish acceptance against production owners. Canvas is a recording
// boundary here; actual host appearance/audio still require Makko acceptance.
const assert = require('assert');
const { createRig: createBaseRig, load } = require('./check-level-01-boss');
const copy = value => JSON.parse(JSON.stringify(value));

function createRig() {
  const rig = createBaseRig();
  load(rig.context, 'src/game/combat-fx.js');
  load(rig.context, 'src/engine/renderer.js');
  const drawing = makeContext();
  rig.w.renderer = new rig.w.Renderer({ width: 1920, height: 1080, getContext: () => drawing });
  return { ...rig, fx: rig.w.BARCODE.combatFX, drawing };
}
function makeContext() {
  const operations = [];
  const ctx = { operations, globalAlpha: 1 };
  for (const name of ['save', 'restore', 'translate', 'scale', 'rotate', 'beginPath', 'closePath', 'fill', 'stroke', 'moveTo', 'lineTo', 'arc', 'ellipse', 'fillRect', 'strokeRect', 'fillText', 'setLineDash', 'drawImage']) {
    ctx[name] = (...args) => operations.push([name, ...args]);
  }
  return ctx;
}

// At the same elapsed time, all display rates sample the same shake; weak
// hits do not shorten it, every offset is bounded, and pause/reset clear no
// gameplay state and create no extra timer.
const samples = [];
for (const fps of [30, 60, 120, 144]) {
  const { w, timers } = createRig();
  const renderer = w.renderer;
  const timerCount = timers.size;
  renderer.addScreenShake(4, 180);
  for (let i = 0; i < Math.floor(fps / 10); i++) renderer.update(1000 / fps);
  renderer.update(100 - Math.floor(fps / 10) * 1000 / fps);
  samples.push(copy(renderer.screenShake));
  renderer.addScreenShake(1, 70);
  assert.deepStrictEqual(copy(renderer.screenShake), samples.at(-1), 'small impact cannot replace stronger one');
  w.gameState.paused = true; renderer.update(1000);
  assert.deepStrictEqual(copy(renderer.screenShake), samples.at(-1), 'pause freezes shake');
  w.gameState.paused = false; renderer.update(80);
  assert.strictEqual(renderer.screenShake.duration, 0); assert.strictEqual(renderer.screenShake.x, 0); assert.strictEqual(renderer.screenShake.y, 0);
  renderer.addScreenShake(20, 1000);
  assert.strictEqual(renderer.screenShake.intensity, 6); assert.strictEqual(renderer.screenShake.duration, 300);
  for (let ms = 0; ms < 301; ms++) {
    renderer.update(1);
    assert(Math.abs(renderer.screenShake.x) <= 6 && Math.abs(renderer.screenShake.y) <= 6);
  }
  renderer.addScreenShake(4, 180); w.BARCODE.playerCombat.reset();
  assert.strictEqual(renderer.screenShake.duration, 0);
  w.BARCODE_RENDER_QUALITY.screenShake = false; renderer.addScreenShake(6, 300);
  assert.strictEqual(renderer.screenShake.duration, 0);
  assert.strictEqual(timers.size, timerCount);
}
for (const sample of samples) for (const key of ['x', 'y', 'duration', 'elapsedMs']) {
  assert(Math.abs(sample[key] - samples[0][key]) < 1e-8, 'shake uses elapsed time');
}
{
  const { w, context } = createRig();
  w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {};
  load(context, 'src/core/loop.js');
  w.updateGame = () => {}; w.renderGame = () => {}; w.lastTime = 0;
  w.renderer.addScreenShake(4, 180); w.gameLoop(40);
  assert.strictEqual(w.renderer.screenShake.elapsedMs, 40, 'actual RAF owner advances shake once');
}

// Actual damage transactions alone notify; immunity, restored health, and
// rejected enemy contact cannot invent a lost segment or direction.
{
  const { w, fx, drawing } = createRig();
  const player = w.player;
  assert(player.takeDamageWithKnockback(1, -200, -100, { x: player.position.x + 40, y: player.position.y }));
  assert.strictEqual(fx.damageFeedback.from, 3); assert.strictEqual(fx.damageFeedback.to, 2);
  assert.strictEqual(fx.damageFeedback.direction, 1);
  assert.strictEqual(w.renderer.screenShake.intensity, 4);
  const before = copy(fx.damageFeedback);
  assert(!player.takeDamage(1));
  assert.deepStrictEqual(copy(fx.damageFeedback), before);
  fx.drawDamageHUD(drawing, player, 50, 50, 300, 30);
  assert(drawing.operations.some(op => JSON.stringify(op) === JSON.stringify(['strokeRect', 252, 52, 98, 26])), 'only the lost rightmost health segment is marked');
  player.health = player.maxHealth; drawing.operations.length = 0;
  fx.drawDamageHUD(drawing, player, 50, 50, 300, 30);
  assert(!drawing.operations.some(op => op[0] === 'strokeRect'), 'healed segments are not highlighted as lost');
  fx.update(950); assert.strictEqual(fx.damageFeedback, null);
  player.invulnerableUntil = 0; player.takeDamage(2);
  assert.strictEqual(fx.damageFeedback.direction, 0, 'unknown source does not guess a direction');
  assert.strictEqual(fx.damageFeedback.from - fx.damageFeedback.to, 2);
  w.BARCODE.playerCombat.reset(); assert.strictEqual(fx.damageFeedback, null);
}

// Warnings read actual AI commitments: walking behind a braced enemy cannot
// rotate its arrow. Swoopers retain their warning-time aim through release.
for (const type of ['corrupted', 'firewall']) {
  const { w, drawing } = createRig();
  const e = new w.Enemy(1000, 750, type);
  e.position.x = 1000; e.position.y = 750; e.entranceComplete = true; e._sector1MissionEnemy = true;
  w.player.position.x = 1200; w.player.position.y = 750;
  e.updateAuthoredCombatPattern(0.8, w.player);
  assert.strictEqual(e.getCombatCue().phase, 'brace'); assert.strictEqual(e.getCombatCue().direction, 1);
  w.player.position.x = 800; e.updateAuthoredCombatPattern(0.1, w.player);
  assert.strictEqual(e.getCombatCue().direction, 1);
  const state = copy(e);
  e.drawCombatCue(drawing); e.drawCombatCue(drawing);
  assert.deepStrictEqual(copy(e), state, 'drawing never advances attacks');
  assert(drawing.operations.some(op => op[0] === 'lineTo' && op[1] > 1000 && op[2] === 827), 'ground arrow points right at the committed contact plane');
  e.updateAuthoredCombatPattern(1, w.player);
  assert.strictEqual(e.getCombatCue().phase, 'attack'); assert(e.velocity.x > 0);
  e.active = false; assert.strictEqual(e.getCombatCue(), null);
}
{
  const { w, drawing } = createRig();
  const e = new w.Enemy(680, 702, 'virus');
  Object.assign(e, { role: 'swooper', entranceComplete: true, _sector1MissionEnemy: true, swooperState: 'approach', swooperTimerMs: 450 });
  e.position.x = 680; e.position.y = 702; w.player.position.x = 900;
  e.updateSwooperBehavior(0.01, w.player);
  assert.strictEqual(e.getCombatCue().phase, 'telegraph');
  const aim = copy(e.getCombatCue().aim);
  w.player.position.x = 1300; e.drawCombatCue(drawing);
  assert(drawing.operations.some(op => op[0] === 'lineTo' && op[1] === aim.x && op[2] === aim.y));
  e.updateSwooperBehavior(0.7, w.player);
  assert.strictEqual(e.getCombatCue().phase, 'dive'); assert.deepStrictEqual(copy(e.getCombatCue().aim), aim);
}

// Real pickup and combat calls drive Amp notifications. Misses and empty
// beats spend nothing; each successful ordinary-target transaction spends one.
{
  const { w, p, fx, beat, reachReady, drawing } = createRig();
  const amp = w.Sector1Progression.SIGNAL_AMP;
  const sounds = []; w.audioSystem.playCombatCue = kind => sounds.push(kind);
  w.player.position.x = amp.x; w.player.position.y = 196 - 72;
  p.updateSignalAmp(); p.updateSignalAmp();
  assert.strictEqual(w.BARCODE.signalAmpCharges, 3); assert.strictEqual(sounds.filter(s => s === 'pickup').length, 1);
  assert.strictEqual(fx.ampNotice.kind, 'pickup');
  beat('miss'); beat(); assert.strictEqual(w.BARCODE.signalAmpCharges, 3);
  const enemy = new w.Enemy(amp.x + 380, w.player.position.y, 'corrupted');
  enemy.position.x = amp.x + 380; enemy.position.y = w.player.position.y; enemy.health = 100;
  w.enemyManager.enemies = [enemy];
  for (let left = 2; left >= 0; left--) {
    assert(beat().targets.length > 0); assert.strictEqual(w.BARCODE.signalAmpCharges, left);
  }
  assert.strictEqual(fx.ampNotice.kind, 'empty'); assert(fx.events.some(e => e.kind === 'amp-empty'));
  assert(!beat().targets.length, 'normal range resumes after final charge');
  const state = copy(fx); fx.draw(drawing); fx.drawAmpHUD(drawing); p.drawSignalAmp(drawing);
  assert.deepStrictEqual(copy(fx), state); assert.strictEqual(w.BARCODE.signalAmpCharges, 0);
  w.gameState.paused = true; fx.update(1000); assert.deepStrictEqual(copy(fx), state);
  w.gameState.paused = false; fx.update(2400); assert.strictEqual(fx.ampNotice, null);
  p.giveSignalAmp(); w.player.position.y = 750; reachReady();
  assert.strictEqual(p.bossCheckpoint.signalAmpCharges, 3);
  w.BARCODE.signalAmpCharges = 0; w.gameState.gameOver = true;
  assert(p.retryBossCheckpoint().ok); assert.strictEqual(w.BARCODE.signalAmpCharges, 3);
  assert.strictEqual(fx.ampNotice, null, 'retry restores charge display without replaying pickup');
  p.reset(); w.BARCODE.playerCombat.reset();
  assert.strictEqual(w.BARCODE.signalAmpCharges, 0); assert.strictEqual(p.signalAmpCollected, false);
  assert.strictEqual(fx.events.length, 0);
}
console.log('Polish chunk 1: elapsed shake, accepted damage HUD, committed warnings and Amp pickup/use/pause/retry/reset passed.');

// Gate collapse is a view of the already-completed unlock, never a delayed
// collider. Repeated callbacks, pause, offscreen drawing and reset are inert.
{
  const { w, p, fx, drawing } = createRig();
  p.startMission(); p.spawnEncounter(w.Sector1Progression.ENCOUNTERS[0]);
  const gate = p.getCurrentGate();
  assert.strictEqual(p.getGatePresentation()[0].opening, false);
  p.openEncounterGate('encounter_1');
  assert.strictEqual(p.getCurrentGate(), null, 'collision opens immediately');
  const openedAt = p.districtSignal.clearedAtMs[0];
  p.updateDistrictSignal(325); p.openEncounterGate('encounter_1');
  assert.strictEqual(p.districtSignal.clearedAtMs[0], openedAt);
  assert.strictEqual(p.getGatePresentation()[0].progress, 0.5);
  const state = copy(p.getGatePresentation());
  p.drawEncounterGates(drawing); p.drawEncounterGates(drawing);
  assert.deepStrictEqual(copy(p.getGatePresentation()), state, 'draw never updates collapse');
  assert(drawing.operations.some(op => op[0] === 'fillRect' && op[1] === gate.x && op[4] === gate.h * 0.25));
  w.isPaused = true; p.update(1000); fx.update(1000);
  assert.deepStrictEqual(copy(p.getGatePresentation()), state);
  w.isPaused = false; p.updateDistrictSignal(325); assert.strictEqual(p.getGatePresentation().length, 0);
  p.reset(); assert.strictEqual(p.getGatePresentation()[0].opening, false);
  w.gameCamera.centerX = 20000; drawing.operations.length = 0; p.drawEncounterGates(drawing);
  assert.strictEqual(drawing.operations.length, 0, 'offscreen gates are culled');
}

// Scenery samples musical phase and actual combo, while atmospheric detail
// uses the pause-gated frame clock. Warm caches are reused and have fixed size.
{
  const { w, p, fx, context, drawing, timers } = createRig();
  load(context, 'src/engine/parallax.js');
  let created = 0;
  w.document.createElement = () => {
    created++;
    return { getContext: () => ({ createRadialGradient: () => ({ addColorStop() {} }), fillRect() {} }) };
  };
  const bg = new w.ParallaxBackground(), layer = { imgElement: {} }; bg.layers = [{}, layer];
  p.startMission(); const before = w.BARCODE.MusicTransport.getDiagnostics(); const timerCount = timers.size;
  const beat = 60 / 146;
  w.audioSystem.context.currentTime = 40 * beat; fx.update(16);
  const down = bg.getSceneMusic(); assert(down.downbeat > 0.99);
  w.audioSystem.context.currentTime = 41 * beat; fx.update(16);
  assert.strictEqual(bg.getSceneMusic().downbeat, 0);
  const patterns = [0, 1, 2, 3].map(index => Array.from({ length: 8 }, (_, bar) => bg.equalizerLevel(index, bar, 41.3, 0.343)));
  assert.strictEqual(new Set(patterns.map(p => JSON.stringify(p))).size, 4, 'four distinct display patterns');
  assert(patterns.flat().every(n => n >= 0 && n <= 0.75));
  const baseEnergy = bg.getSceneMusic().energy;
  w.rhythmSystem.combo = 10; assert(bg.getSceneMusic().energy > baseEnergy); assert.strictEqual(bg.getSceneMusic().combo, 1);
  fx.update(2000); bg.drawAtmosphere(drawing, layer, -152, -550, 4400, 1589);
  assert.strictEqual(created, 3);
  assert(drawing.operations.filter(op => op[0] === 'drawImage').length <= 14, 'fixed atmosphere budget');
  const ventX = -152 + bg.atmosphereVents[0][0] * 4400 / 1279;
  w.enemyManager.enemies = [{ active: true, position: { x: ventX, y: 750 }, combatPattern: 'brace' }];
  assert.strictEqual(bg.atmosphereQuietAt(bg.atmosphereVents[0][0]), 0.25, 'windup area reduces steam');
  w.enemyManager.enemies = [];
  const frozen = copy(bg.getSceneMusic()); const paints = makeContext(); bg.drawAtmosphere(paints, layer, -152, -550, 4400, 1589);
  w.gameState.paused = true; w.BARCODE.MusicTransport.pause(w.audioSystem.context.currentTime); w.audioSystem.context.currentTime += 20; fx.update(20000);
  assert.deepStrictEqual(copy(bg.getSceneMusic()), frozen);
  const pausedPaints = makeContext(); bg.drawAtmosphere(pausedPaints, layer, -152, -550, 4400, 1589);
  assert.deepStrictEqual(pausedPaints.operations, paints.operations, 'pause redraw preserves atmosphere');
  assert.strictEqual(created, 3, 'redrawing never allocates more glow textures');
  drawing.operations.length = 0; bg.drawAtmosphere(drawing, layer, 20000, -550, 4400, 1589);
  assert(!drawing.operations.some(op => ['drawImage', 'fillRect', 'stroke'].includes(op[0])), 'offscreen atmosphere is culled');
  w.gameState.paused = false; w.BARCODE.MusicTransport.resume(w.audioSystem.context.currentTime);
  w.rhythmSystem.hideRhythmMode(); fx.update(16); assert.strictEqual(bg.getSceneMusic().performing, false);
  assert(bg.getSceneMusic().beatFloat > 0, 'the hidden rhythm clock still runs');
  assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().listenerCount, before.listenerCount);
  assert.strictEqual(timers.size, timerCount, 'new scenery creates no timers');
}
{
  const { w, p, context, reachReady } = createRig();
  load(context, 'src/engine/parallax.js'); const bg = new w.ParallaxBackground();
  assert.strictEqual(bg.getSceneMusic().quiet, 1);
  reachReady(); p.beginBossCombat();
  assert.strictEqual(bg.getSceneMusic().quiet, 0.4, 'actual boss handoff reduces scenery');
}

// A real collected fragment awards once and starts one visual flight. Camera,
// zoom and shake affect its origin; its destination is the existing HUD box.
{
  const { w, p, fx, context, drawing, timers } = createRig();
  w.Image = class Image {};
  load(context, 'src/game/lore-collection.js'); load(context, 'src/game/lost-data.js'); load(context, 'src/game/render-coordinator.js');
  const lost = new w.LostDataSystem(); w.lostDataSystem = lost; lost.player = w.player;
  w.particleSystem.dataFragmentEffect = () => {}; w.particleSystem.dataFragmentGlow = () => {};
  let collectedSounds = 0, loreMessages = 0;
  w.audioSystem.playCombatCue = () => collectedSounds++;
  w.loreSystem = { displayLoreMessage() { loreMessages++; } };
  p.missionDefeats = 4; const fragment = lost.spawnFragment();
  const timerCount = timers.size, initialScore = w.gameState.score;
  assert(lost.collectFragment(fragment)); assert(!lost.collectFragment(fragment));
  assert.strictEqual(w.gameState.score, initialScore + 500); assert.strictEqual(lost.collectedLore.size, 1);
  assert.strictEqual(loreMessages, 1); assert.strictEqual(collectedSounds, 1);
  assert.strictEqual(lost.getProgress().cooldownActive, false);
  assert(lost.collectedLore.has('lore.l01.01'), 'pickup preserves its stable identity');
  const flight = fx.events.find(e => e.kind === 'data-flight'); assert(flight);
  assert.strictEqual(fx.events.filter(e => e.kind === 'data-flight').length, 1);
  const projection = w.BARCODE.sceneProjection;
  for (const zoom of [0.6, 0.82, 1.08]) {
    w.gameCamera.centerX = 1530; projection.capture({}, zoom, { x: 3, y: -2 });
    const point = projection.worldToScreen(fragment.position);
    assert(Math.abs(point.x - (960 + zoom * (fragment.position.x - 1530 + 3))) < 1e-8);
    assert(Math.abs(point.y - (425 + 250 * (1 - zoom) + zoom * (fragment.position.y - 425 - 2))) < 1e-8);
    assert.deepStrictEqual(copy(fx.fragmentFlightPose(flight, p => projection.worldToScreen(p))).x, point.x);
  }
  // A captured Canvas matrix takes precedence over the diagnostic fallback.
  projection.capture({ getTransform: () => ({ a: 0.7, b: 0, c: 0, d: 0.7, e: 280, f: 205 }) });
  assert.strictEqual(projection.worldToScreen({ x: 1530, y: 100 }).x, 0.7 * 960 + 280);
  fx.update(320); assert.strictEqual(fx.fragmentFlightPose(flight, p => projection.worldToScreen(p)).assembly, 1);
  const before = copy(fx); fx.drawFragmentFlights(drawing); assert.deepStrictEqual(copy(fx), before);
  w.gameState.paused = true; fx.update(1000); assert.deepStrictEqual(copy(fx), before);
  w.gameState.paused = false; fx.update(760);
  const arrival = fx.fragmentFlightPose(flight, p => projection.worldToScreen(p));
  assert.strictEqual(arrival.x, 200); assert(Math.abs(arrival.y - 115) < 1e-8);
  assert.strictEqual(w.gameState.score, initialScore + 500, 'arrival never awards again');
  fx.update(320); assert(!fx.events.some(e => e.kind === 'data-flight'));
  fx.dataCollected(fragment); w.BARCODE.playerCombat.reset(); assert.strictEqual(fx.events.length, 0);
  assert.strictEqual(timers.size, timerCount);
}
console.log('Polish chunk 2: gate unlock/collapse, music/scenery clocks, atmosphere budgets and actual collection/projection passed.');
