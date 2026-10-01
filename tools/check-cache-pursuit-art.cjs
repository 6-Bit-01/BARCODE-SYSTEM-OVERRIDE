// Production helper/cache coverage plus native PNG/WebP alpha measurements.
// This is an art integrity check and scripted native contact sheet, not a playtest.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const crypto = require('node:crypto');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const ROOT = path.resolve(__dirname, '..');
const assetSource = fs.readFileSync(path.join(ROOT, 'src/engine/presentation-assets.js'), 'utf8');
const helperSource = fs.readFileSync(path.join(ROOT, 'src/game/cache-road-boss-art.js'), 'utf8');
const metadata = JSON.parse(fs.readFileSync(path.join(ROOT,
  'assets/cache-road/pursuit/atlas-metadata.json'), 'utf8'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const paths = ['assets/cache-road/pursuit/pursuit-rig-atlas.webp',
  'assets/cache-road/pursuit/pursuit-impact-atlas.webp'];
const poses = [
  { health: 3, phase: '', frame: 0, label: 'Intact · health 3' },
  { health: 3, phase: 'scan', frame: 1, label: 'Scanner sweep · health 3' },
  { health: 2, phase: '', frame: 2, label: 'Scanner broken · health 2' },
  { health: 2, phase: 'ram', frame: 3, label: 'Armor ram · health 2' },
  { health: 1, phase: 'armor-break', frame: 4, label: 'Armor stripped · health 1' },
  { health: 1, phase: '', frame: 5, label: 'Core exposed · health 1' },
  { health: 1, phase: 'core-hit', frame: 6, label: 'Core struck · health 1' },
  { health: 0, phase: '', frame: 7, label: 'Rig defeated · health 0' }
];

function fixture(cache) {
  const window = { BARCODE: {}, FILE_MANIFEST: [], testCache: cache };
  const images = [];
  if (!cache) window.Image = class Image {
    constructor() { this.requests = []; images.push(this); }
    set src(url) { this.requests.push(url); }
  };
  const context = vm.createContext({ window });
  // Expose private registration metadata for independent source/anchor checks.
  // Native fixtures inject already-decoded images; production draw is unchanged.
  vm.runInContext(assetSource.replace('  const cache = {};',
    '  window.artDefinitions = entries;\n  const cache = window.testCache || {};'), context);
  vm.runInContext(helperSource, context);
  return { window, images, definitions: window.artDefinitions,
    assets: window.BARCODE.PresentationAssets, helper: window.BARCODE.CacheRoadBossArt };
}

function recordingContext() {
  const operations = [], stack = [];
  const ctx = { globalAlpha: .8, imageSmoothingEnabled: false,
    save() { stack.push({ globalAlpha: this.globalAlpha,
      imageSmoothingEnabled: this.imageSmoothingEnabled }); operations.push(['save']); },
    restore() { assert(stack.length, 'no extra Canvas restore'); Object.assign(this, stack.pop());
      operations.push(['restore']); },
    translate(...args) { operations.push(['translate', ...args]); },
    rotate(...args) { operations.push(['rotate', ...args]); },
    drawImage(image, ...args) { operations.push(['drawImage', image, ...args]); } };
  return { ctx, operations, stack };
}

function cachedDrawCoverage() {
  const rig = fixture(), { helper, assets, definitions, images } = rig;
  assert.deepEqual(Array.from(Object.keys(definitions).filter(key => /^cachePursuit/.test(key))),
    ['cachePursuitRig', 'cachePursuitImpact']);
  assert.equal(definitions.cachePursuitRig.columns, 4);
  assert.equal(definitions.cachePursuitRig.rows, 2);
  assert.equal(definitions.cachePursuitRig.frames, 8);
  assert.equal(definitions.cachePursuitRig.ax, .5);
  assert.equal(definitions.cachePursuitRig.ay, 473 / 512,
    'registered contact equals the first row below measured opaque tire pixels');
  assert.equal(definitions.cachePursuitImpact.columns, 3);
  assert.equal(definitions.cachePursuitImpact.rows, 2);
  assert.equal(definitions.cachePursuitImpact.frames, 6);
  assert.equal(definitions.cachePursuitImpact.ax, .5);
  assert.equal(definitions.cachePursuitImpact.ay, .5);
  const pursuitImages = paths.map(local => images.find(image => image.requests[0].endsWith(local)));
  assert(pursuitImages.every(Boolean), 'the shared loader requests both production atlas paths');
  const { ctx, operations, stack } = recordingContext();
  assert.equal(helper.drawRig(ctx, { x: 200, y: 300 }), false,
    'unloaded rig reports absence without substituting false geometry');
  assert.equal(helper.drawImpact(ctx, { x: 200, y: 300 }), false);
  assert.equal(ctx.globalAlpha, .8);
  assert.equal(stack.length, 0);
  for (let i = 0; i < pursuitImages.length; i++) {
    const image = pursuitImages[i], sizes = metadata.assets[i].size;
    image.naturalWidth = sizes[0]; image.naturalHeight = sizes[1]; image.onload();
  }
  for (const pose of poses) {
    operations.length = 0;
    const options = Object.freeze({ x: 200, y: 300, width: 256, height: 256,
      elapsedMs: 2345, alpha: .5, ...pose });
    const before = JSON.stringify(options);
    assert.equal(helper.frameFor(options), pose.frame);
    assert.equal(helper.drawRig(ctx, options), true);
    const draw = operations.find(op => op[0] === 'drawImage');
    assert.deepEqual(draw.slice(2), [pose.frame % 4 * 512, Math.floor(pose.frame / 4) * 512,
      512, 512, -128, -236.5, 256, 256],
      'each full damage pose keeps the same source cell size and physical tire anchor');
    assert(operations.some(op => op[0] === 'translate' && op[1] === 200 && op[2] === 300));
    assert.equal(ctx.globalAlpha, .8, 'rig alpha restores caller state');
    assert.equal(ctx.imageSmoothingEnabled, false);
    assert.equal(stack.length, 0);
    assert.equal(JSON.stringify(options), before, 'rendering cannot alter caller simulation data');
  }
  for (const phase of ['scan', 'scanning', 'warning', 'lock']) {
    assert.equal(helper.frameFor({ health: 3, phase }), 1);
    assert.equal(helper.frameFor({ health: 3, phase, reduced: true }), 0);
  }
  for (const phase of ['ram', 'charge', 'attack']) {
    assert.equal(helper.frameFor({ health: 2, phase }), 3);
    assert.equal(helper.frameFor({ health: 2, phase, reduced: true }), 2);
  }
  for (const phase of ['hit', 'core-hit', 'counter-hit']) {
    assert.equal(helper.frameFor({ health: 1, phase }), 6);
    assert.equal(helper.frameFor({ health: 1, phase, reduced: true }), 5);
  }
  assert.equal(helper.frameFor({ health: 0, phase: 'scan', reduced: true }), 7,
    'defeat never reactivates scanner art');
  for (const [kind, frame] of Object.entries({ sparks: 0, impact: 0, armor: 1,
    'armor-break': 1, debris: 2, skid: 3, exhaust: 4, core: 5, burst: 5 })) {
    operations.length = 0;
    assert.equal(helper.drawImpact(ctx, { x: 100, y: 240, width: 100, kind, progress: .25 }), true);
    const draw = operations.find(op => op[0] === 'drawImage');
    assert.deepEqual(draw.slice(2, 6), [frame % 3 * 512, Math.floor(frame / 3) * 512, 512, 512]);
    assert(draw.slice(2).every(Number.isFinite), 'all effect coordinates remain finite');
    assert.equal(ctx.globalAlpha, .8);
    assert.equal(stack.length, 0);
    operations.length = 0;
    assert.equal(helper.drawImpact(ctx, { kind, reduced: true }), false);
    assert.equal(operations.length, 0, 'Reduced Motion submits no moving or flashing impact draw');
  }
  for (const bad of [{ width: 0 }, { width: -1 }, { height: NaN }, { x: Infinity }]) {
    operations.length = 0;
    assert.equal(helper.drawRig(ctx, bad), false);
    assert.equal(operations.length, 0, 'invalid dimensions never reach Canvas');
  }
  operations.length = 0;
  assert.equal(helper.drawImpact(ctx, { kind: 'not-a-real-effect' }), false);
  assert.equal(operations.length, 0);
  const missing = fixture();
  for (const local of paths) {
    const image = missing.images.find(item => item.requests[0].endsWith(local));
    image.onerror(); assert.equal(image.requests[1], local);
    image.onerror(); assert.equal(image.onload, null); assert.equal(image.onerror, null);
  }
  const count = missing.images.length;
  for (let i = 0; i < 20; i++) missing.assets.preload();
  assert.equal(missing.images.length, count, 'failed atlases cannot cause a request loop');
  assert.equal(missing.helper.drawRig(ctx), false);
  assert.equal(missing.helper.drawImpact(ctx), false);
  return rig;
}

async function pixels(file) {
  const image = await loadImage(path.join(ROOT, file));
  const canvas = createCanvas(image.width, image.height), ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, image.width, image.height).data;
  const alpha = new Uint8Array(image.width * image.height);
  for (let i = 0; i < alpha.length; i++) alpha[i] = data[i * 4 + 3];
  return { image, alpha, data, width: image.width, height: image.height };
}

async function nativeAlphaCoverage() {
  const decoded = [];
  for (const asset of metadata.assets) {
    const sourceBytes = fs.readFileSync(path.join(ROOT, asset.generatedOriginal));
    const runtimeBytes = fs.readFileSync(path.join(ROOT, asset.runtime));
    assert.equal(sourceBytes.length, asset.bytes.source);
    assert.equal(runtimeBytes.length, asset.bytes.runtime);
    assert.equal(hash(sourceBytes), asset.sha256.source, 'generated PNG provenance is intact');
    assert.equal(hash(runtimeBytes), asset.sha256.runtime, 'runtime WebP matches its reviewed bytes');
    const source = await pixels(asset.generatedOriginal), runtime = await pixels(asset.runtime);
    assert.deepEqual([runtime.width, runtime.height], asset.size);
    const expected = new Uint8Array(runtime.alpha.length);
    if (asset.sourceExtraction) {
      for (const cell of asset.sourceExtraction) {
        const [sx, sy, sw, sh] = cell.sourceRect;
        const dx = cell.frame % 4 * 512 + cell.insert[0];
        const dy = Math.floor(cell.frame / 4) * 512 + cell.insert[1];
        for (let y = 0; y < sh; y++) expected.set(
          source.alpha.subarray((sy + y) * source.width + sx, (sy + y) * source.width + sx + sw),
          (dy + y) * runtime.width + dx);
      }
    } else expected.set(source.alpha);
    assert.deepEqual(runtime.alpha, expected,
      'native decoded PNG alpha survives exact extraction/repacking and WebP encoding');
    assert(runtime.alpha.some(a => a === 0), 'the sprite has genuine fully transparent background');
    assert(runtime.alpha.some(a => a > 0 && a < 200), 'painted soft effects and antialias alpha are retained');
    assert(runtime.alpha.some(a => a >= 200), 'solid mechanical pixels remain readable');
    const cellHashes = new Set();
    for (const cell of asset.cells) {
      const [sx, sy, sw, sh] = cell.sourceRect, bytes = Buffer.alloc(sw * sh * 4);
      let body = 0;
      for (let y = 0; y < sh; y++) {
        bytes.set(runtime.data.subarray(((sy + y) * runtime.width + sx) * 4,
          ((sy + y) * runtime.width + sx + sw) * 4), y * sw * 4);
        for (let x = 0; x < sw; x++) if (runtime.alpha[(sy + y) * runtime.width + sx + x] >= 200) body++;
      }
      assert(body > 3000, 'each registered cell contains substantial actual painted art');
      cellHashes.add(hash(bytes));
      if (asset.asset === 'pursuit-rig-atlas') {
        for (const [left, right] of [[80, 150], [352, 432]]) {
          let last = -1;
          for (let y = 390; y < 512; y++) for (let x = left; x < right; x++)
            if (runtime.alpha[(sy + y) * runtime.width + sx + x] >= 200) last = y;
          assert.equal(last, 472,
            'both independently measured opaque tire feet share a contact across all eight damage states');
        }
      }
    }
    assert.equal(cellHashes.size, asset.frames, 'damage/effect cells are distinct complete paintings');
    decoded.push(runtime.image);
  }
  return decoded;
}

function contactSheet(images, output) {
  const cache = { cachePursuitRig: { image: images[0], ready: true },
    cachePursuitImpact: { image: images[1], ready: true } };
  const native = fixture(cache), canvas = createCanvas(1280, 920), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b141b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#d8f4df'; ctx.font = 'bold 25px sans-serif';
  ctx.fillText('CACHE ROAD — PAINTED PURSUIT RIG', 26, 36);
  ctx.font = '15px sans-serif'; ctx.fillStyle = '#9eb5af';
  ctx.fillText('Native production helper • Eight damage/action poses • One fixed tire-contact anchor', 26, 62);
  for (let i = 0; i < poses.length; i++) {
    const col = i % 4, row = Math.floor(i / 4), x = col * 320, y = 80 + row * 400;
    ctx.fillStyle = (row + col) % 2 ? '#15232b' : '#1b2830'; ctx.fillRect(x + 8, y, 304, 390);
    ctx.fillStyle = '#9db4ac'; ctx.font = '15px sans-serif'; ctx.fillText(poses[i].label, x + 20, y + 26);
    ctx.strokeStyle = '#426e63'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(x + 28, y + 346); ctx.lineTo(x + 292, y + 346); ctx.stroke();
    assert(native.helper.drawRig(ctx, { x: x + 160, y: y + 346,
      width: 320, height: 320, ...poses[i] }));
    ctx.font = '12px sans-serif'; ctx.fillStyle = '#77988c';
    ctx.fillText('CONTACT', x + 20, y + 372);
  }
  const effects = ['sparks', 'armor', 'debris', 'skid', 'exhaust', 'core'];
  for (let i = 0; i < effects.length; i++) {
    native.helper.drawImpact(ctx, { x: 58 + i * 200, y: 890,
      width: 90, height: 90, kind: effects[i], progress: 0 });
    ctx.fillStyle = '#9eb5af'; ctx.font = '13px sans-serif';
    ctx.fillText(effects[i], 105 + i * 200, 896);
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, canvas.toBuffer('image/png'));
}

async function main() {
  cachedDrawCoverage();
  const decoded = await nativeAlphaCoverage();
  if (process.argv[2]) contactSheet(decoded, path.resolve(process.argv[2]));
  console.log('Cache pursuit art passed: 8 complete rig poses, 6 painted effects, production cache/anchors, native PNG→WebP alpha integrity, 16 actual tire contacts, Reduced Motion, missing-art request bounds and Canvas state restoration.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
