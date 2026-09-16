// Exercise the real RAF -> update -> render path. Only host canvas/images and
// randomness are supplied; do not inject a hit or overwrite a car trajectory.
const assert = require('assert'), vm = require('vm');
const { createRig, load } = require('./check-level-01-boss');

for (const mode of ['training','mission','boss']) for (const fps of [30, 60, 120]) for (const seed of [1984, 1981]) {
  const training = mode === 'training', boss = mode === 'boss';
  const { w, p, context, calls, reachReady } = createRig();
  load(context, 'src/game/combat-fx.js');
  load(context, 'src/engine/particles.js');
  load(context, 'src/engine/traffic-sheets.js');
  load(context, 'src/engine/spaceships.js');
  load(context, 'src/engine/parallax.js');
  load(context, 'src/game/render-coordinator.js');
  load(context, 'src/core/loop.js');
  // The real asset loader is asynchronous; supply its completed image boundary.
  w.SpaceShipSystem.prototype.loadShipImages = function () {};
  const traffic = w.spaceShipSystem = new w.SpaceShipSystem();
  traffic.imagesLoaded = [true, true, true]; traffic.shipImages = [{}, {}, {}];
  traffic.shipSheets = w.BARCODE.trafficSheets;
  p.reset(); w.tutorialSystem.active = training; w.tutorialSystem.completed = !training;
  w.tutorialSystem.draw = () => {};
  if (!training) { p.startMission(); p.state = 'jammer_active'; }
  if (boss) {
    p.reset(); reachReady(); p.beginBossCombat();
    // Hold one real guard phase so this isolates car damage from boss attacks.
    Object.assign(p.boss, {x:520,y:-272,supportedSurfaceId:'west-crown',phase:'telegraph',phaseElapsedMs:-10000,canReceiveDamage:false});
    traffic.resetRuntime();
  }
  vm.runInContext(`Math.random=(()=>{let s=${seed};return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);})()`, context);
  w.rhythmSystem.hideRhythmMode();
  Object.assign(w.player.position, { x: 310, y: -272 });
  Object.assign(w.player, { grounded: true, supportedSurfaceId: 'west-crown', health: 3, invulnerableUntil: 0, controlsDisabled: false });
  Object.assign(w.player.velocity, { x: 0, y: 0 });
  let now = 10000, warnings = 0, frameWarnings = 0, images = 0, rain = [], matrix = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
  const stack = [], gradient = { addColorStop() {} };
  const ctx = new Proxy({
    globalAlpha: 1, getTransform: () => ({ ...matrix }),
    save() { stack.push({ ...matrix }); }, restore() { matrix = stack.pop(); },
    setTransform(a, b, c, d, e, f) { matrix = { a, b, c, d, e, f }; },
    translate(x, y) { matrix.e += x * matrix.a; matrix.f += y * matrix.d; },
    scale(x, y) { matrix.a *= x; matrix.d *= y; },
    createLinearGradient: () => gradient, createRadialGradient: () => gradient,
    measureText: text => ({ width: text.length * 8 }),
    drawImage() { images++; }, moveTo(x, y) { rain.push([x, y]); },
    fillText(text) { if (text === 'WATCH OUT') { warnings++; frameWarnings++; } }
  }, { get: (o, k) => o[k] ?? (() => {}) });
  const canvas = { width: 1920, height: 1080, getContext: () => ctx }; ctx.canvas = canvas;
  w.document.getElementById = id => id === 'gameCanvas' ? canvas : null;
  w.document.createElement = () => ({ getContext: () => ctx });
  Object.assign(w.renderer, { clear() {}, screenShake: { x: 0, y: 0 } });
  w.parallaxBackground = new w.ParallaxBackground();
  w.parallaxBackground.addLayer({ image: { width: 2048, height: 740 }, scrollFactorX: .5 });
  w.parallaxBackground.addLayer({ image: { width: 2048, height: 740 }, scrollFactorX: 1 });
  w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {};
  w.Date.now = () => now; w.lastTime = now; w.isRunning = true;
  let car, firstWarning, firstHit, beforeRain;
  for (let i = 0; i < fps * 4; i++) {
    now += 1000 / fps; frameWarnings = 0; rain = [];
    w.gameLoop(now);
    car ||= traffic.pendingForeground[0] || traffic.ships.find(s => s.isForeground);
    if (frameWarnings && firstWarning === undefined) firstWarning = i;
    if (w.player.health < 3 && firstHit === undefined) firstHit = i;
    if (i === fps) beforeRain = JSON.stringify(rain);
    if (i === fps * 2) assert.notEqual(JSON.stringify(rain), beforeRain, 'actual frame loop advances environment drawing');
  }
  assert(car, 'original random spawner launches a foreground car');
  assert(warnings > fps * 2, 'WATCH OUT is rendered through the live coordinator');
  assert.equal(w.player.health, 2, 'actual player loses exactly one health bar');
  if (boss) assert.equal(p.boss.health,9,'the same original car also hits the guarded boss once');
  assert(firstHit - firstWarning >= fps * 2.9, 'contact follows a readable approach warning');
  assert(p.cameraY < -600, 'roof camera follows in training and mission');
  assert(images > 0 && w.BARCODE.combatFX.timeMs > 3900);
  assert.equal(p.missionStarted, !training, 'training hazard does not start the mission');
  assert.equal(car.size, 690); assert.equal(Math.abs(car.speed), 72.5);
  assert(car.y >= -400 && car.y <= 0, 'original altitude preserved');
  assert.deepStrictEqual([...new Set(calls.errors)], []); assert.equal(stack.length, 0);
  w.gameState.paused = true;
  const clock = traffic.elapsedMs, fxClock = w.BARCODE.combatFX.timeMs;
  now += 100; w.gameLoop(now);
  assert.equal(traffic.elapsedMs, clock); assert.equal(w.BARCODE.combatFX.timeMs, fxClock);
}
console.log('Environment: 18 full frame-loop routes, natural left/right cars, training/mission/boss warnings, real player and guarded-boss damage, roof follow, visible environment clock and pause passed.');
