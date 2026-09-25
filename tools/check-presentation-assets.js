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
assert.strictEqual(images.length, 59, 'restarts reuse Cache traffic, individual places, road, sky, ship and mirror art');
assert(images.every(im => /^https:\/\/raw\.githubusercontent\.com\/.+\/[a-f0-9]{40}\//.test(im.requests[0])), 'assets use published immutable revisions');
const cacheRoadRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/37db98387b8791655e3ff352d6bc6d61cb0b574b/';
assert.equal(images.filter(im => im.requests[0].startsWith(cacheRoadRoot)).length,19,
  'Cache Road art loads from the merged published revision when Makko omits local binaries');
const cacheWorldRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/41edca02367b9f1f3af429d14df3d378ca46c9b4/';
assert.equal(images.filter(im => im.requests[0].startsWith(cacheWorldRoot)).length,4,
  'the four illustrated traffic vehicles retain their published asset revision');
const cachePlacesRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/6868a002c8ee10b8067b45aa78f3dfbeaa628396/';
assert.equal(images.filter(im => im.requests[0].startsWith(cachePlacesRoot)).length,10,
  'ten authored individual places load from their exact published revision');
assert(!images.some(im => /\/(market-block|relay-depot|service-frontage|market-left-perspective|market-right-perspective|depot-left-perspective|depot-right-perspective|frontage-left-perspective|frontage-right-perspective)\.webp$/.test(im.requests[0])),
  'the previous horizontal and long diagonal paintings are not requested');
const catImage=images.find(im=>im.requests[0].endsWith('/assets/presentation/studio-cat.webp'));
const arrowImage=images.find(im=>im.requests[0].endsWith('/assets/presentation/direction-arrow.webp'));
const pulseImage=images.find(im=>im.requests[0].endsWith('/assets/presentation/boss-pulse.webp'));
const mirrorImage=images.find(im=>im.requests[0] === cacheRoadRoot+'assets/cache-road/hud/cache-back-mirror-expressions.webp');
assert(mirrorImage, 'completed mirror art has a published URL');
mirrorImage.onerror();
assert.strictEqual(mirrorImage.requests[1], 'assets/cache-road/hud/cache-back-mirror-expressions.webp',
  'a checked-out local asset remains the fallback');
const ops = [];
const ctx = new Proxy({}, { get(target, key) { return target[key] ?? ((...args) => ops.push([key, ...args])); }, set(target, key, value) { target[key] = value; ops.push(['set', key, value]); return true; } });
assert.strictEqual(art.draw('studioCat', ctx), false, 'not-yet-loaded assets use the caller fallback');
catImage.onerror(); assert.strictEqual(catImage.requests[1], 'assets/presentation/studio-cat.webp');
catImage.naturalWidth = catImage.naturalHeight = 512; catImage.onload();
assert.strictEqual(catImage.onerror, null);
art.draw('studioCat', ctx, { x: 60, y: 80, width: 128, frame: 7, flip: true });
assert.deepStrictEqual(ops.find(op => op[0] === 'drawImage').slice(2), [256, 256, 256, 256, -64, -120, 128, 128]);
assert(ops.some(op => op[0] === 'scale' && op[1] === -1));
mirrorImage.naturalWidth = 1536; mirrorImage.naturalHeight = 1024; mirrorImage.onload();
ops.length = 0; art.draw('cacheMirror', ctx, { x: 753, y: 70, width: 250, height: 111,
  sourceRect: [0, 150, 402, 185], frame: 4 });
assert.deepStrictEqual(ops.find(op => op[0] === 'drawImage').slice(2),
  [512, 662, 402, 185, -125, -55.5, 250, 111],
  'collision eyes come from the second row inside the same mirror crop');
arrowImage.onerror(); arrowImage.onerror();
assert.strictEqual(arrowImage.requests.length, 2); assert.strictEqual(arrowImage.onerror, null);
art.preload(); assert.strictEqual(images.length, 59, 'failed assets do not retry forever');
pulseImage.naturalWidth = pulseImage.naturalHeight = 512; pulseImage.onload();
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

// The live boss owner extends the flame behind the existing damaging front.
reachReady(); p.state = 'boss_combat'; p.boss.phase = 'sweep';
p.boss.pulses = [{ originX: p.boss.x, radius: 120, hit: false }];
const requests = []; w.BARCODE.PresentationAssets = { draw(key, _ctx, options) { requests.push({ key, ...options }); return true; } };
const combatBeforeDrawing = JSON.stringify(p.boss.pulses);
p.drawBoss(ctx);
assert.strictEqual(requests.length, 2); assert(requests.every(r => r.key === 'bossPulse' && r.width === 104 && r.height === 76 && r.y === 856));
assert.deepStrictEqual(requests.map(r => r.flip), [true, false]);
assert.strictEqual(requests[0].x - requests[0].width / 2, p.boss.x - 120 - 32, 'left flame keeps the original leading edge');
assert.strictEqual(requests[1].x + requests[1].width / 2, p.boss.x + 120 + 32, 'right flame keeps the original leading edge');
assert.strictEqual(JSON.stringify(p.boss.pulses), combatBeforeDrawing, 'presentation cannot advance or mutate attack state');
assert.strictEqual(w.Sector1Progression.BOSS_COMBAT.pulseWidth, 64);
assert.strictEqual(w.Sector1Progression.BOSS_COMBAT.pulseHeight, 56);
assert.strictEqual(w.Sector1Progression.BOSS_COMBAT.pulseSpeed, 560);
assert.strictEqual(w.Sector1Progression.BOSS_COMBAT.secondPulseMs, 410);
load(context, 'src/game/level-01-stage-fx.js');
const stage = w.BARCODE.stageFX; requests.length = 0; stage.drawRat(ctx, 1680, 330);
assert.strictEqual(requests[0].key, 'studioCat');
assert.strictEqual(w.BARCODE.Level01StageFX.DETAILS[0].id, 'egg.l01.studio-rat', 'owner terminology correction preserves saved facts');
stage.ratAge = 220; stage.drawRat(ctx, 1680, 330); assert.strictEqual(requests[1].frame, 2);
load(context, 'src/engine/jammer-indicator.js'); requests.length = 0; new w.JammerIndicator().drawArrow(ctx);
assert.strictEqual(requests[0].key, 'directionArrow');
console.log('Presentation asset loading, hashes, shared consumers, varied FX and lifecycle checks passed');
