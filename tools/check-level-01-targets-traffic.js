const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createRig, load } = require('./check-level-01-boss');
const plain = value => JSON.parse(JSON.stringify(value));
function drawing() {
  const calls = [], ctx = { calls };
  for (const name of ['save','restore','beginPath','moveTo','lineTo','stroke','translate','scale','rotate','fillRect','fillText','drawImage']) ctx[name] = (...args) => calls.push([name, ...args]);
  return ctx;
}
for (const charges of [0, 1, 3]) for (const combo of [0, 4, 10]) {
  const { w, p } = createRig(); p.startMission(); w.rhythmSystem.show();
  w.rhythmSystem.combo = combo; w.BARCODE.signalAmpCharges = charges;
  const reach = w.rhythmSystem.getAuthoritativeDamageRadius({ nextSuccess: true });
  const enemies = [reach - 0.1, reach + 0.1, 429, 431].map(distance => {
    const enemy = new w.Enemy(w.player.position.x + distance, 784, 'corrupted');
    enemy.position.x = w.player.position.x + distance; enemy.position.y = 784; enemy.health = 100; enemy.active = true;
    return enemy;
  });
  w.enemyManager.enemies = enemies;
  const combat = w.BARCODE.playerCombat, ctx = drawing();
  const snapshot = () => plain({ charges: w.BARCODE.signalAmpCharges, combo: w.rhythmSystem.combo,
    combat: combat.diagnostics(), health: enemies.map(e => e.health), feedback: combat.feedback });
  const before = snapshot();
  const preview = combat.getTargetPreview();
  for (let i = 0; i < 60; i++) combat.drawTargetPreview(ctx, w.player);
  assert.deepStrictEqual(snapshot(), before, 'preview and repeated drawing cannot transact an attack');
  assert.strictEqual(preview.length, combo >= 10 ? 4 : combo === 4 ? (charges ? 4 : 2) : charges ? 3 : 1);
  assert.strictEqual(preview.filter(t => t.boosted).length, charges ? (combo >= 4 ? 3 : 2) : 0);
  const hit = combat.resolvePrimary({ now: 1000, timing: { available: true, timing: 'perfect' } });
  assert(hit.ok);
  assert.deepStrictEqual(plain(hit.targets.map(t => t.x)), plain(preview.map(t => t.target.position.x)), 'preview exactly matches next successful attack, including combo growth');
  assert.strictEqual(w.BARCODE.signalAmpCharges, Math.max(0, charges - 1));
  w.isPaused = true; assert.strictEqual(combat.getTargetPreview().length, 0); w.isPaused = false;
  w.hackingSystem.active = true; assert.strictEqual(combat.getTargetPreview().length, 0); w.hackingSystem.active = false;
  w.rhythmSystem.hide(); assert.strictEqual(combat.getTargetPreview().length, 0);
}
{
  const { w, p, reachReady, until, beat } = createRig();
  reachReady(); p.beginBossCombat(); w.enemyManager.enemies = [];
  w.player.position.x = p.boss.x - 100; w.player.position.y = p.boss.y; w.player.invulnerableUntil = Infinity;
  const combat = w.BARCODE.playerCombat;
  let preview = combat.getTargetPreview().find(t => t.kind === 'boss');
  assert(preview?.guarded); const health = p.boss.health;
  assert.strictEqual(beat().reason, 'boss-guarded'); assert.strictEqual(p.boss.health, health);
  until(() => p.boss.phase === 'recovery', 15000);
  w.player.position.x = p.boss.x - 100; w.player.position.y = p.boss.y;
  preview = combat.getTargetPreview().find(t => t.kind === 'boss');
  assert(preview && !preview.guarded); assert(beat().targets.some(t => t.type === 'boss'));
}
{
  const { w, p } = createRig(); p.startMission(); w.rhythmSystem.show(); w.enemyManager.enemies = []; w.BARCODE.signalAmpCharges = 3;
  const env = w.BARCODE.JammerEnvironment, combat = w.BARCODE.playerCombat;
  env.reveal({ position: { x: w.player.position.x + 310, y: w.player.position.y } });
  assert(!combat.getTargetPreview().some(t => t.kind === 'jammer'), 'Amp never extends environmental range');
  env.reveal({ position: { x: w.player.position.x + 299, y: w.player.position.y } });
  const preview = combat.getTargetPreview().find(t => t.kind === 'jammer');
  assert(preview); assert.deepStrictEqual(plain(preview.bounds), plain(env.getAimBounds()));
  env.dispose(); assert(!combat.getTargetPreview().some(t => t.kind === 'jammer'));
}

async function trafficRig(failAtlas = false) {
  const rig = createRig(), { w, context } = rig;
  const requested = [];
  w.Image = class Image {
    set src(url) { this.url = url; requested.push(url); this.width = 2560; this.height = 2304;
      if (failAtlas && url.endsWith('assets/traffic/ship-1.webp')) this.onerror(); else this.onload(); }
  };
  load(context, 'src/engine/traffic-sheets.js'); load(context, 'src/engine/spaceships.js');
  const ships = new w.SpaceShipSystem();
  await new Promise(setImmediate);
  return { ...rig, ships, requested };
}
async function runTraffic() {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/traffic/manifest.json')));
  assert.deepStrictEqual(manifest.map(s => s.frameCount), [81, 122, 122]);
  let decoded = 0;
  for (const sheet of manifest) {
    const bytes = fs.readFileSync(path.join(__dirname, '..', sheet.image));
    assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex'), sheet.atlasSHA256);
    assert.strictEqual(bytes.subarray(8, 12).toString(), 'WEBP');
    assert(sheet.atlasWidth <= 4096 && sheet.atlasHeight <= 4096);
    assert.strictEqual(sheet.durationMs, sheet.durationsMs.reduce((a, b) => a + b, 0));
    decoded += sheet.atlasWidth * sheet.atlasHeight * 4;
  }
  assert(decoded < 50 * 1024 * 1024, 'three shared atlases have a fixed decoded budget');
  for (const fps of [30, 60, 120, 144]) {
    const { w, ships, requested } = await trafficRig();
    assert.strictEqual(ships.getDiagnostics().animatedTypes, 3);
    assert.strictEqual(requested.length, 3, 'successful atlas loading does not download original GIFs too');
    ships.spawnShip = () => {}; // Keep only the explicitly positioned traffic subjects.
    ships.ships = [0, 1, 2].map(type => ({ shipType: type, x: 600, y: 80, size: 200, speed: 0, direction: 1, bobOffset: 0, bobAmount: 0, rotation: 0 }));
    for (let i = 0; i < fps; i++) ships.update(1000 / fps);
    assert.deepStrictEqual(ships.ships.map(s => ships.getAnimationFrame(s)), [25,25,25], 'all original frames advance at their authored 25 FPS');
    const before = plain(ships.ships), ctx = drawing();
    ships.ships.forEach(s => ships.drawShip(ctx, s));
    assert.deepStrictEqual(plain(ships.ships), before, 'drawing never advances animation');
    assert(ctx.calls.filter(c => c[0] === 'drawImage').every(c => c.length === 10), 'all three types crop a frame from the atlas');
    for (const s of ships.ships) {
      const sheet = ships.shipSheets[s.shipType];
      s.animationElapsedMs = sheet.durationMs - 1; assert.strictEqual(ships.getAnimationFrame(s), sheet.frameCount - 1);
      s.animationElapsedMs = sheet.durationMs; assert.strictEqual(ships.getAnimationFrame(s), 0);
    }
    const paused = plain(ships.ships); w.gameState.paused = true; ships.update(10000);
    assert.deepStrictEqual(plain(ships.ships), paused); w.gameState.paused = false;
    ships.resetRuntime(); assert.strictEqual(ships.ships.length, 0); assert.strictEqual(ships.elapsedMs, 0);
    ships.dispose(); ships.update(1000); assert.strictEqual(ships.elapsedMs, 0);
  }
  const fallback = await trafficRig(true);
  assert.strictEqual(fallback.ships.getDiagnostics().animatedTypes, 2);
  assert.strictEqual(fallback.ships.imagesLoaded[0], true, 'original art is retained when a derived sheet fails');
  assert(fallback.requested.includes('https://i.postimg.cc/xj3VcRP3/Ship1.gif'));
  console.log('Targets/traffic: pure preview matches real attacks, boss guard and environmental range; original frames, bounds, duration, pause/reset and asset fallback passed.');
}
runTraffic().catch(error => { console.error(error); process.exitCode = 1; });
