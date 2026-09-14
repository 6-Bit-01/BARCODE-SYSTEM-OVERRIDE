// Production asset cache, FX lifecycle and consumers; host image decoding is stubbed.
const assert = require('assert'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { createRig, load } = require('./check-level-01-boss');
const root = path.resolve(__dirname, '..');
const { w, context, p, reachReady } = createRig();
const images = [];
w.Image = class Image {
  constructor() { this.requests = []; images.push(this); }
  set src(value) { this.requests.push(value); }
};
load(context, 'src/engine/presentation-assets.js');
const art = w.BARCODE.PresentationAssets;
for (let i = 0; i < 20; i++) art.preload();
assert.strictEqual(images.length, 4, 'restarts/preload reuse four images');
assert(images.every(im => /^https:\/\/raw\.githubusercontent\.com\/.+\/[a-f0-9]{40}\//.test(im.requests[0])), 'assets use a published immutable revision');
const ops = [];
const ctx = new Proxy({}, { get(target, key) { return target[key] ?? ((...args) => ops.push([key, ...args])); }, set(target, key, value) { target[key] = value; ops.push(['set', key, value]); return true; } });
assert.strictEqual(art.draw('studioCat', ctx), false, 'not-yet-loaded assets use the caller fallback');
images[0].onerror(); assert.strictEqual(images[0].requests[1], 'assets/presentation/studio-cat.webp');
images[0].naturalWidth = images[0].naturalHeight = 512; images[0].onload();
assert.strictEqual(images[0].onerror, null);
art.draw('studioCat', ctx, { x: 60, y: 80, width: 128, frame: 7, flip: true });
assert.deepStrictEqual(ops.find(op => op[0] === 'drawImage').slice(2), [256, 256, 256, 256, -64, -120, 128, 128]);
assert(ops.some(op => op[0] === 'scale' && op[1] === -1));
images[1].onerror(); images[1].onerror();
assert.strictEqual(images[1].requests.length, 2); assert.strictEqual(images[1].onerror, null);
art.preload(); assert.strictEqual(images.length, 4, 'failed assets do not retry forever');
images[2].naturalWidth = images[2].naturalHeight = 512; images[2].onload();
ops.length = 0; art.draw('bossPulse', ctx, { y: 822, width: 64, height: 56, frame: 2 });
assert.deepStrictEqual(ops.find(op => op[0] === 'drawImage').slice(2), [10, 351, 236, 145, -32, -56, 64, 56], 'pulse fills the dangerous height and retains the ground anchor');

for (const asset of JSON.parse(fs.readFileSync(path.join(root, 'assets/presentation/manifest.json'))).assets) {
  const bytes = fs.readFileSync(path.join(root, asset.path));
  assert.strictEqual(bytes.length, asset.bytes);
  assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex'), asset.sha256);
}

load(context, 'src/game/combat-fx.js');
const fx = w.BARCODE.combatFX;
fx.randomState = 1234567; // Fixed fixture seed; live events select their own seeds.
const draws = [];
for (let i = 0; i < 5; i++) {
  fx.reset(); fx.contact('corrupted', 900, 700, 1, true, true); fx.update(90);
  ops.length = 0; fx.draw(ctx); const first = JSON.stringify(ops);
  const state = JSON.stringify([fx.events, fx.randomState]);
  ops.length = 0; fx.draw(ctx);
  assert.strictEqual(JSON.stringify(ops), first, 'same event and age draw the same silhouette');
  assert.strictEqual(JSON.stringify([fx.events, fx.randomState]), state, 'rendering never consumes randomness or simulation state');
  draws.push(first);
  w.isPaused = true; fx.update(200); w.isPaused = false;
  assert.strictEqual(JSON.stringify([fx.events, fx.randomState]), state, 'pause preserves the FX');
}
assert.strictEqual(new Set(draws).size, 5, 'repeated identical hits have different fragment layouts');
for (let i = 0; i < 140; i++) fx.contact('virus', 900, 700);
assert.strictEqual(fx.events.length, 96); fx.update(1200); assert.strictEqual(fx.events.length, 0);
fx.contact('firewall', 900, 700); fx.reset(); assert.strictEqual(fx.events.length, 0);

// The live boss owner requests mirrored frames inside the existing hazard bounds.
reachReady(); p.state = 'boss_combat'; p.boss.phase = 'sweep';
p.boss.pulses = [{ originX: p.boss.x, radius: 120, hit: false }];
const requests = []; w.BARCODE.PresentationAssets = { draw(key, _ctx, options) { requests.push({ key, ...options }); return true; } };
p.drawBoss(ctx);
assert.strictEqual(requests.length, 2); assert(requests.every(r => r.key === 'bossPulse' && r.width === 64 && r.height === 56 && r.y === 822));
assert.deepStrictEqual(requests.map(r => r.flip), [true, false]);
assert.strictEqual(requests[1].x - requests[0].x, 240);
load(context, 'src/game/level-01-stage-fx.js');
const stage = w.BARCODE.stageFX; requests.length = 0; stage.drawRat(ctx, 590, 822);
assert.strictEqual(requests[0].key, 'studioCat');
assert.strictEqual(w.BARCODE.Level01StageFX.DETAILS[0].id, 'egg.l01.studio-rat', 'owner terminology correction preserves saved facts');
stage.ratAge = 220; stage.drawRat(ctx, 590, 822); assert.strictEqual(requests[1].frame, 2);
load(context, 'src/engine/jammer-indicator.js'); requests.length = 0; new w.JammerIndicator().drawArrow(ctx);
assert.strictEqual(requests[0].key, 'directionArrow');
console.log('Presentation asset loading, hashes, shared consumers, varied FX and lifecycle checks passed');
