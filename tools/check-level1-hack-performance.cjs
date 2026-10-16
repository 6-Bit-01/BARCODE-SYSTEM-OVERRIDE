#!/usr/bin/env node
// Real enemy/hack owners and prepared RGBA cels at the native Canvas boundary.
// Raster operation budgets are deterministic; optional wall time is diagnostic,
// not a hosted Makko/device FPS assertion.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), { performance } = require('node:perf_hooks');
const root = path.resolve(__dirname, '..');
const { createCanvas, loadImage } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || root, root]
}));
const { createRig, load } = require('./check-level-01-boss');
const { createSprite } = require('./makko-animation-fixture');
const profile = process.argv.includes('--profile');
const beforeIndex = process.argv.indexOf('--profile-before');
const beforeSource = beforeIndex >= 0 ? fs.readFileSync(process.argv[beforeIndex + 1], 'utf8') : null;
const clips = {};
const snapshot = (w, m) => JSON.stringify({ simulation: m.simulationTimeMs, hostile: m.hostileSimulationTimeMs,
  enemies: m.enemies.map(e => ({ position: e.position, velocity: e.velocity, health: e.health,
    animation: e.currentAnimation, frame: e.animationRef?.currentFrame, time: e.animationTime })),
  trails: [...m.hackTrails].map(([e, trail]) => ({ index: m.enemies.indexOf(e), ...trail })),
  phase: w.hackingSystem.phase, phaseTime: w.hackingSystem.phaseElapsedMs,
  sessionTime: w.hackingSystem.sessionElapsedMs });
function nativeSprite(counts) {
  const s = createSprite(counts), originalPlay = s.play;
  s.isLoaded = () => true; s.getHitboxWorld = () => null;
  s.play = function(name, ...args) {
    const ref = originalPlay.call(s, name, ...args), c = clips[name];
    s.currentSprite.metadata.frames = Object.fromEntries(c.frames.map((f, i) => [String(i), f]));
    s.currentSprite.getAnchorPoint = () => c.anchor;
    s.currentSprite.hasManifestAnchor = () => true; s.currentSprite.getManifestScale = () => 1;
    return ref;
  };
  s.draw = function(ctx, x, y, options = {}) {
    const c = clips[s.getCurrentAnimation()], f = c.frames[s.currentSprite.currentFrame].frame;
    ctx.save(); ctx.translate(x, y); ctx.scale(options.flipH ? -options.scale : options.scale, options.scale);
    ctx.drawImage(c.image, f.x, f.y, f.w, f.h, -c.anchor.x, -c.anchor.y, f.w, f.h); ctx.restore();
  };
  return s;
}
function rig(count, source) {
  const r = createRig(), { w, context, p } = r;
  if (source) vm.runInContext('{\n' + source + '\n}', context, { filename: 'baseline-enemies.js' });
  p.startMission(); p.state = 'jammer_active'; p.closedGateEncounterId = null;
  w.enemyManager = new w.EnemyManager(); w.rhythmSystem.hideRhythmMode();
  load(context, 'src/game/combat-fx.js'); load(context, 'src/game/hacking.js');
  w.hackingSystem = new w.HackingSystem();
  w.BARCODE.Preferences = { values: { reducedMotion: false, flashes: true } };
  const counts = Object.fromEntries(Object.entries(clips).map(([name, c]) => [name, c.frames.length]));
  w.MakkoEngine.sprite = () => nativeSprite(counts);
  w.player.isEntering = false; w.player.grounded = true; w.player.position.x = 900;
  w.enemyManager.enemies = Array.from({ length: count }, (_, i) => {
    const e = new w.Enemy(980 + i * 62, 784, ['virus', 'corrupted', 'firewall'][i % 3]);
    Object.assign(e.position, { x: 980 + i * 62, y: 784 });
    Object.assign(e, { entranceComplete: true, state: 'patrol', spawnTimeMs: -10000,
      spawnProtectionDuration: 0, _sector1MissionEnemy: true, _authoredEntranceActive: false });
    e.initSprite();
    assert(e.spriteReady && e.sprite, 'real prepared cel boundary is ready');
    e.velocity.x = 0; e.velocity.y = 0; return e;
  });
  // Populate the legal worst-case five moving samples. Sampling remains the
  // production update owner's job; render cannot expire or append samples.
  assert(w.hackingSystem.start(), 'the production grounded-target route starts a real hack session');
  assert.equal(w.hackingSystem.hijackTarget, w.enemyManager.enemies[0], 'the first legal nearby enemy remains the locked target');
  for (const e of w.enemyManager.enemies) w.enemyManager.hackTrails.set(e, { elapsedMs: 40,
    samples: Array.from({ length: 5 }, (_, i) => ({ x: e.position.x - (5 - i) * 11,
      y: e.position.y - (5 - i) * 2, ageMs: 600 - i * 120 })) });
  return r;
}
function countedContext(native) {
  const stats = { images: 0, strokes: 0, saves: 0 };
  const context = new Proxy(native, { get(target, key) {
    const value = Reflect.get(target, key);
    if (typeof value !== 'function') return value;
    return (...args) => {
      if (key === 'drawImage') stats.images++;
      if (key === 'stroke') stats.strokes++;
      if (key === 'save') stats.saves++;
      return value.apply(target, args);
    };
  }, set(target, key, value) { Reflect.set(target, key, value); return true; } });
  return { context, stats };
}
function measure(count, source) {
  const { w, timers } = rig(count, source), m = w.enemyManager;
  const canvas = createCanvas(1920, 1080), native = canvas.getContext('2d');
  const { context: ctx, stats } = countedContext(native);
  // Match production's hack scene filter; this makes full-cel duplication
  // materially more costly than its unfiltered operation count alone suggests.
  ctx.filter = w.BARCODE.combatFX.sceneFilter();
  const before = snapshot(w, m);
  m.draw(ctx);
  const perFrame = { ...stats };
  assert.equal(snapshot(w, m), before, 'native enemy draw preserves all clocks, positions, HP, cels and trail history');
  assert.equal(timers.size, 0, 'hack presentation introduces no timer owner');
  assert(native.getImageData(850, 550, 950, 360).data.some((v, i) => i % 4 === 3 && v > 0),
    'actual prepared enemy cels and trails produce visible RGBA pixels');
  if (!source) {
    assert(perFrame.images >= count, 'every active enemy retains its canonical body');
    assert(perFrame.images <= count * 2, 'at most one decorative body echo per enemy');
    assert.equal(perFrame.strokes, count * 3 + 2, 'three time ribbons per enemy and the locked-target brackets stay visible');
    m.draw(ctx); assert.equal(stats.images, perFrame.images * 2, 'repeated draws have stable finite cost');
    assert.equal(snapshot(w, m), before, 'repeated draw remains pure');
    for (const preference of [{ reducedMotion: true }, { flashes: false }, { reducedFlashes: true }]) {
      Object.assign(w.BARCODE.Preferences.values, { reducedMotion: false, flashes: true, reducedFlashes: false }, preference);
      const imageStart = stats.images, strokeStart = stats.strokes;
      m.draw(ctx);
      assert.equal(stats.images - imageStart, count, 'quiet preferences keep every body and disable decorative echoes');
      assert.equal(stats.strokes - strokeStart, 2, 'quiet preferences keep semantic target brackets');
    }
    Object.assign(w.BARCODE.Preferences.values, { reducedMotion: false, flashes: true, reducedFlashes: false });
    const savedX = m.enemies[0].position.x;
    m.enemies[0].position.x = 10000;
    const culledStart = stats.images;
    m.draw(ctx);
    assert.equal(stats.images - culledStart, (count - 1) * 2, 'an offscreen enemy adds no body or echo raster work');
    m.enemies[0].position.x = savedX;
    const history = m.hackTrails.get(m.enemies[0]);
    const savedSamples = history.samples;
    history.samples = history.samples.map(s => ({ ...s, x: savedX, y: m.enemies[0].position.y }));
    const idleStart = stats.images;
    m.draw(ctx);
    assert.equal(stats.images - idleStart, count * 2 - 1, 'stationary history keeps the live body without a redundant echo');
    history.samples = savedSamples;
    w.hackingSystem.active = false;
    Object.assign(w.BARCODE.Preferences.values, { reducedMotion: false, flashes: true, reducedFlashes: false });
    m.updateHackTrails(16); assert.equal(m.hackTrails.size, 0, 'leaving hack clears history');
  }
  let msPerFrame;
  if (profile) {
    w.hackingSystem.active = true;
    Object.assign(w.BARCODE.Preferences.values, { reducedMotion: false, flashes: true, reducedFlashes: false });
    for (const e of m.enemies) if (!m.hackTrails.has(e)) m.hackTrails.set(e, { elapsedMs: 40,
      samples: Array.from({ length: 5 }, (_, i) => ({ x: e.position.x - (5-i)*11, y:e.position.y, ageMs:600-i*120 })) });
    for (let i = 0; i < 3; i++) { native.clearRect(0, 0, 1920, 1080); m.draw(ctx); }
    const times = [];
    for (let sample = 0; sample < 3; sample++) {
      const start = performance.now();
      for (let i = 0; i < 4; i++) { native.clearRect(0, 0, 1920, 1080); m.draw(ctx); }
      times.push((performance.now() - start) / 4);
    }
    msPerFrame = times.sort((a, b) => a - b)[1];
  }
  return { count, perFrame, ...(profile ? { diagnosticNativeMsPerFrame: Number(msPerFrame.toFixed(3)) } : {}) };
}
function checkSharedUpdates(hz) {
  const { w, timers } = rig(4), m = w.enemyManager, h = w.hackingSystem;
  const enemies = [...m.enemies], startX = enemies.map(e => e.position.x);
  let expectedHostileMs = 0;
  for (let i = 0; i < hz; i++) {
    expectedHostileMs += w.BARCODE.TacticalFocusClock.scaleDelta(1000 / hz);
    m.update(1000 / hz, w.player); h.update(1000 / hz);
  }
  assert(Math.abs(m.simulationTimeMs - 1000) < 1e-7, 'the manager keeps the full shared simulation clock');
  assert(Math.abs(m.hostileSimulationTimeMs - expectedHostileMs) < 1e-7, 'all enemies keep the actual pulsing hostile delta');
  assert(enemies.some((e, i) => Math.abs(e.position.x - startX[i]) > 3), 'production AI and hostile movement continue during hack');
  assert.equal(m.enemies.length, 4, 'performance correction neither removes nor skips required enemies');
  assert.equal(h.active, true, 'drawing optimization keeps the real session active');
  assert(Math.abs(h.sessionElapsedMs - 1000) < 1e-7, 'terminal phases keep their full-speed session clock');
  for (const [enemy, trail] of m.hackTrails) {
    assert(enemies.includes(enemy), 'trail records belong to existing enemies');
    assert(trail.samples.length <= 5, 'update-owned history remains bounded');
    assert(trail.samples.every(s => s.ageMs < 700), 'expired samples are retired by update');
  }
  const paused = snapshot(w, m); w.gameState.paused = true;
  m.update(1000, w.player);
  assert.equal(snapshot(w, m), paused, 'paused manager preserves all enemy/trail clocks and state');
  w.gameState.paused = false;
  h.cancel({ restoreRhythm: false });
  assert.equal(m.hackTrails.size, 0, 'real cancel clears trail ownership');
  assert.equal(w.BARCODE.TacticalFocusClock.getScale(), 1, 'cancel restores the ordinary hostile clock');
  h.reset(); m.clear(); assert.equal(m.hackTrails.size, 0, 'reset leaves no history references');
  assert.equal(timers.size, 0, 'updates, cancel and reset introduce no timers');
}
async function main() {
  for (const file of fs.readdirSync(path.join(root, 'assets/sprites-v3/prepared')).filter(f => /^(virus|corrupted|firewall).*\.json$/.test(f))) {
    const name = file.slice(0, -5), meta = JSON.parse(fs.readFileSync(path.join(root, 'assets/sprites-v3/prepared', file)));
    const frames = Object.values(meta.frames);
    clips[name] = { frames, image: await loadImage(path.join(root, 'assets/sprites-v3/prepared', name + '.webp')),
      anchor: meta.meta.anchor || { x: frames[0].frame.w / 2, y: frames[0].frame.h } };
  }
  const results = [1, 4, 8, 12].map(count => measure(count, beforeSource));
  if (!beforeSource) for (const hz of [30, 60, 120, 144]) checkSharedUpdates(hz);
  console.log(JSON.stringify({ boundary: 'Native Canvas with production hack filter, exact prepared cels and public sprite fixture',
    limits: 'Diagnostic local CPU timing only; no hosted Makko or device FPS claim',
    scope: beforeSource ? 'pre-change source diagnostic' : 'current production gate', results }, null, 2));
  if (!beforeSource) console.log('PASS: 1/4/8/12 canonical bodies, bounded echoes/ribbons, pure/culling/quiet draws; 30/60/120/144 Hz AI/session clocks, pause, cancel and reset.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
