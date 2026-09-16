#!/usr/bin/env node
// Guard the installed runtime assets, not just the existence of art studies.
// Uses actual production sprite/UI owners with host-boundary drawing stubs.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const { createRig, load } = require('./check-level-01-boss');
const { createSprite } = require('./makko-animation-fixture');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const json = file => JSON.parse(read(file));
const copy = value => JSON.parse(JSON.stringify(value));
const near = (actual, expected, why) => assert(Math.abs(actual - expected) < 1e-6, `${why}: ${actual} / ${expected}`);
const installed = json('sprites-manifest.json');
const original = json('assets/sprites-v3/original-manifest.json');
const calibration = json('assets/sprites-v3/calibration.json');
const retained = new Set(['sector_1_boss_walk_walk']);
const pins = new Set();

function webpSize(bytes) {
  assert.strictEqual(bytes.toString('ascii', 0, 4), 'RIFF');
  assert.strictEqual(bytes.toString('ascii', 8, 12), 'WEBP');
  assert.strictEqual(bytes.readUInt32LE(4) + 8, bytes.length, 'complete WebP RIFF payload');
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const kind = bytes.toString('ascii', offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4), at = offset + 8;
    assert(at + length <= bytes.length, 'complete WebP chunk');
    if (kind === 'VP8X') return [1 + bytes.readUIntLE(at + 4, 3), 1 + bytes.readUIntLE(at + 7, 3)];
    if (kind === 'VP8L') {
      assert.strictEqual(bytes[at], 0x2f);
      const bits = bytes.readUInt32LE(at + 1);
      return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    if (kind === 'VP8 ') return [bytes.readUInt16LE(at + 6) & 0x3fff, bytes.readUInt16LE(at + 8) & 0x3fff];
    offset = at + length + (length % 2);
  }
  throw new Error('Missing WebP image dimensions');
}

function localPinned(url, clip, extension) {
  const match = /^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/([a-f0-9]{40})\/(assets\/sprites-v3\/prepared\/[^/]+)$/.exec(url);
  assert(match, `${clip}: installed ${extension} must use an immutable production asset URL`);
  assert.strictEqual(match[2], `assets/sprites-v3/prepared/${clip}.${extension}`);
  pins.add(match[1]);
  assert(fs.statSync(path.join(root, match[2])).isFile(), `${clip}: bundled ${extension} exists`);
  return match[2];
}

assert.deepStrictEqual(Object.keys(installed.characters).sort(), Object.keys(original.characters).sort(), 'character IDs preserved');
let count = 0, frameCount = 0;
for (const [character, record] of Object.entries(original.characters)) {
  const current = installed.characters[character].animations;
  assert.deepStrictEqual(Object.keys(current).sort(), Object.keys(record.animations).sort(), `${character}: action IDs preserved`);
  for (const [clip, baseline] of Object.entries(record.animations)) {
    const entry = current[clip];
    for (const key of (clip === '6_bit_walk_walk' ? ['animationLength'] : ['fps', 'frameCount', 'animationLength'])) assert.strictEqual(entry[key], baseline[key], `${clip}: ${key} preserved`);
    if (retained.has(clip)) {
      assert.deepStrictEqual(entry, baseline, `${clip}: retain complete original export until replacement bytes exist`);
      continue;
    }
    const cal = calibration[clip];
    assert(cal, `${clip}: production calibration exists`);
    if (clip === 'sector_1_boss_attack_attack') {
      assert.strictEqual(cal.clarityPolish?.version, 1, 'flourish clarity provenance exists');
      assert.strictEqual(cal.clarityPolish?.method, 'alpha-safe-lanczos-2x-rgb-unsharp');
      assert.strictEqual(cal.clarityPolish?.factor, 2);
      assert.deepStrictEqual(entry.anchor.normalized, baseline.anchor.normalized, 'flourish normalized anchor preserved');
      assert.strictEqual(entry.dimensions.width, baseline.dimensions.width * 2);
      assert.strictEqual(entry.dimensions.height, baseline.dimensions.height * 2);
      const source = json(`assets/sprites-v3/sources/${clip}.original.json`);
      const prepared = json(`assets/sprites-v3/prepared/${clip}.json`);
      assert.deepStrictEqual(Object.keys(prepared.frames), Object.keys(source.frames), 'all flourish pose keys/order retained');
      Object.entries(source.frames).forEach(([key, item]) => {
        assert.strictEqual(prepared.frames[key].duration, item.duration, `${key}: flourish frame duration retained`);
      });
    } else if (clip === '6_bit_walk_walk') {
      assert.strictEqual(cal.motionPolish?.method, 'complete-sixteen-pose-stride-no-frame-blending');
      assert.strictEqual(cal.motionPolish?.uniquePoses, 16);
      assert(cal.motionPolish.registeredWaistSpanPx < 1, 'registered walk body stays within one source pixel');
      assert.deepStrictEqual(cal.atlasFrameIndices, Array.from({ length: 64 }, (_, i) => i % 16));
      const walkFrames = Object.values(json(`assets/sprites-v3/prepared/${clip}.json`).frames);
      near(walkFrames.reduce((sum, f) => sum + f.duration, 0), 4000, 'walk retains its complete clip duration');
      walkFrames.forEach((f, i) => {
        assert.equal(f.duration, 62.5, 'even sixteen-pose stride pacing');
        assert.equal(entry.frameCount, 64); assert.equal(entry.fps, 16);
        near(f.duration, cal.motionPolish.frameDurationsMs[i % 16], 'all four strides share the same pacing');
      });
    } else {
      assert.strictEqual(cal.smoothing?.version, 1, `${clip}: temporal smoothing provenance exists`);
      assert.strictEqual(cal.smoothing?.method, 'premultiplied-rgba-temporal-3-tap', `${clip}: approved whole-frame smoothing method`);
      assert.deepStrictEqual(cal.smoothing?.weights, [0.09, 0.82, 0.09], `${clip}: restrained neighboring-frame blend`);
    }
    if (clip === '6_bit_idle_idle') {
      const sequence = [0, 0, ...Array.from({ length: 12 }, (_, i) => i + 1), 12, ...Array.from({ length: 11 }, (_, i) => 11 - i)];
      assert.deepStrictEqual(cal.loopPolish?.sequence, sequence, 'idle uses the saved coherent forward/return take');
      assert.deepStrictEqual(cal.registration.map(frame => frame.selectedSourceFrame), sequence, 'registration follows the repaired loop');
    }
    const metadata = json(localPinned(entry.json, clip, 'json'));
    const bytes = fs.readFileSync(path.join(root, localPinned(entry.image, clip, 'webp')));
    const dimensions = webpSize(bytes);
    assert.deepStrictEqual(dimensions, cal.atlasSize, `${clip}: real atlas dimensions`);
    assert.deepStrictEqual(dimensions, [metadata.meta.size.w, metadata.meta.size.h], `${clip}: metadata describes atlas`);
    assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex'), cal.sha256, `${clip}: calibrated atlas bytes`);
    assert.deepStrictEqual(entry.anchor, metadata.meta.anchor, `${clip}: manifest and sheet share anchor`);
    assert.deepStrictEqual(entry.metadata.anchor, entry.anchor);
    assert.strictEqual(entry.metadata.scale, 1);
    assert.strictEqual(metadata.meta.scale, 1);
    assert.strictEqual(entry.anchor.x, cal.anchorX); assert.strictEqual(entry.anchor.y, cal.anchorY);
    assert.deepStrictEqual(entry.dimensions, { width: cal.width, height: cal.height });
    const frames = Object.values(metadata.frames);
    assert.strictEqual(frames.length, entry.frameCount); assert.strictEqual(frames.length, cal.frames);
    assert.strictEqual(cal.footRows.length, frames.length); assert.strictEqual(cal.headRows.length, frames.length);
    frames.forEach((item, index) => {
      const f = item.frame;
      assert.deepStrictEqual([f.w, f.h], [cal.width, cal.height], `${clip} frame ${index}: cell size`);
      assert(f.x >= 0 && f.y >= 0 && f.x + f.w <= dimensions[0] && f.y + f.h <= dimensions[1], `${clip} frame ${index}: atlas bounds`);
      const cell = cal.atlasFrameIndices?.[index] ?? index;
      assert.strictEqual(f.x, cell % cal.columns * cal.width);
      assert.strictEqual(f.y, Math.floor(cell / cal.columns) * cal.height);
      assert(cal.headRows[index] >= 0 && cal.footRows[index] < f.h && cal.headRows[index] <= cal.footRows[index], `${clip} frame ${index}: silhouette calibration`);
    });
    count++; frameCount += frames.length;
  }
}
assert.strictEqual(count, 13, 'all recovered clips and the clarified flourish installed in the actual manifest');
assert.strictEqual(frameCount, 611, 'all recovered frames including 48 flourish poses installed');
assert.strictEqual(pins.size, 1, 'all recovered JSON and atlases share one immutable revision');

const index = read('index.html');
const scripts = [...index.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(match => match[1]);
for (const file of ['src/game/comic-hud.js', 'src/game/player.js', 'src/game/enemies.js', 'src/game/jammer-environment.js', 'src/game/sector1-progression.js', 'src/game/ui-manager.js']) {
  assert.strictEqual(scripts.filter(value => value === file).length, 1, `${file}: installed exactly once in live graph`);
}
for (const file of ['src/game/ui-manager.js', 'src/game/rhythm.js', 'src/game/combat-fx.js']) {
  assert(scripts.indexOf('src/game/comic-hud.js') < scripts.indexOf(file), `ComicHUD precedes ${file}`);
}
for (const file of ['index.html', 'sprites-manifest.json', ...scripts.filter(file => !/^https?:/.test(file) && fs.existsSync(path.join(root, file)))]) {
  assert(!read(file).includes('MODEL_ART_REVISION'), `${file}: no unresolved runtime asset revision`);
}
assert(scripts.includes('src/game/game-initializer.js'), 'model sprite loading is checked in the active startup module');
assert(!scripts.includes('src/game/main.js'), 'the legacy startup module is inactive');

const { w, context } = createRig();
const player = w.player;
const clips = Object.fromEntries(Object.entries(installed.characters['6_bit_main'].animations).map(([name, entry]) => [name, entry.frameCount]));
player.sprite = createSprite(clips); player.spriteReady = true;
let drawn;
player.sprite.draw = (ctx, x, y, options) => { drawn = { x, y, ...options }; };
player.sprite.currentSprite = {
  getAnchorPoint: () => installed.characters['6_bit_main'].animations[player.sprite.getCurrentAnimation()].anchor,
  hasManifestAnchor: () => true, getManifestScale: () => 1
};
player.drawWindEffects = () => {};
player.afterimageMs = 0;
const ctx = { save() {}, restore() {} };
const body = copy(player.getHitbox());
for (const [state, clip] of Object.entries({ idle: '6_bit_idle_idle', walk: '6_bit_walk_walk', jump: '6_bit_jump_jump', rhythm: '6_bit_r__h_mode_rhmode' })) {
  player.state = state; player.landingPoseActive = false;
  for (const facing of [-1, 1]) for (const frame of [0, clips[clip] - 1]) {
    player.facing = facing; player.playAnimation(state, frame); player.drawSprite(ctx);
    const cal = calibration[clip], profile = player.getAnimationPresentation();
    assert.strictEqual(player.sprite.getCurrentAnimation(), clip, `${state}: production action selects installed clip`);
    assert.strictEqual(drawn.flipH, facing === -1, `${state}: right-facing production artwork mirrors only to face left`);
    near(drawn.scale, cal.scale, `${state}: calibrated draw scale`);
    assert.strictEqual(profile.anchorX, cal.anchorX); assert.strictEqual(profile.anchorY, cal.anchorY);
    near(drawn.y - cal.anchorY * drawn.scale + cal.footRows[frame] * drawn.scale, player.position.y + 72, `${state}: grounded visual contact`);
    near(drawn.x, player.position.x, `${state}: centered source anchor`);
    assert.deepStrictEqual(copy(player.getHitbox()), body, `${state}: fixed gameplay body preserved`);
  }
}

// Exercise the production UI delegations with the actual ComicHUD renderer.
load(context, 'src/game/ui-manager.js');
const text = [];
const drawing = new Proxy({ fillText(value) { text.push(String(value)); } }, {
  get(target, key) { return target[key] ?? (() => {}); },
  set(target, key, value) { target[key] = value; return true; }
});
w.drawBasicUI(drawing); w.drawObjectives(drawing);
assert(text.includes('6 BIT'), 'live basic UI draws illustrated HUD fallback portrait label');
assert(text.includes('Objectives') && text.includes('EXPLORE THE DISTRICT'), 'live objective UI reaches ComicHUD with its heading and current action');

async function checkSpriteStartup() {
  // Model Makko's host-owned root manifest and preloaded registry separately.
  // These cases execute the actual initializer, including its single-flight path.
  async function scenario(initialManifest, expectedLoads) {
    let manifest = initialManifest && copy(initialManifest), loads = 0, rebinds = 0;
    let release;
    const ready = new Promise(resolve => { release = resolve; });
    const timers = new Set();
    const engine = {
      isLoaded: () => !!manifest,
      getManifest: () => manifest,
      getCharacters: () => Object.keys(manifest.characters),
      has: name => !!manifest.characters[name],
      getAnimations: name => Object.keys(manifest.characters[name].animations),
      async init(url) {
        loads++;
        const match = /^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/[a-f0-9]{40}\/sprites-manifest\.json$/.exec(url);
        assert(match, 'active startup must bypass the host-generated relative manifest');
        await ready;
        manifest = copy(installed);
      }
    };
    const win = { MakkoEngine: engine, player: {
      sprite: 'pre-start clone',
      async initSprite() { rebinds++; this.sprite = manifest.characters['6_bit_main']; }
    } };
    const context = vm.createContext({ window: win, console: { log() {}, warn() {}, error() {} },
      setTimeout(fn, ms) { const id = setTimeout(fn, ms); timers.add(id); return id; },
      clearTimeout(id) { timers.delete(id); clearTimeout(id); }
    });
    vm.runInContext(read('src/game/game-initializer.js'), context);
    const first = win.initSprites(), second = win.initSprites();
    if (expectedLoads) assert.strictEqual(first, second, 'concurrent startup joins one registry replacement');
    release();
    await Promise.all([first, second]);
    assert.strictEqual(loads, expectedLoads, 'only the current artwork registry may be reused');
    assert.strictEqual(win.useFallbackGraphics, expectedLoads ? false : undefined);
    assert.strictEqual(timers.size, 0, 'completed sprite loading clears its timeout');
    assert.strictEqual(win.MakkoEngine, engine, 'the native Makko registry is retained');
    if (expectedLoads) {
      assert.strictEqual(rebinds, 1, 'the player created before Start is rebound once');
      assert.deepStrictEqual(win.player.sprite, installed.characters['6_bit_main']);
    }
    await win.initSprites();
    assert.strictEqual(loads, expectedLoads, 'repeat startup does not download the current registry again');
  }
  await scenario(null, 1);
  await scenario(original, 1);
  const mixed = copy(installed);
  mixed.characters.firewall_firewall = copy(original.characters.firewall_firewall);
  await scenario(mixed, 1);
  const oldFlourish = copy(installed);
  oldFlourish.characters.sector_1_boss_sector1boss.animations.sector_1_boss_attack_attack =
    copy(original.characters.sector_1_boss_sector1boss.animations.sector_1_boss_attack_attack);
  await scenario(oldFlourish, 1);
  const oldWalk = copy(installed);
  for (const key of ['image', 'json']) oldWalk.characters['6_bit_main'].animations['6_bit_walk_walk'][key] = installed.characters['6_bit_main'].animations['6_bit_walk_walk'][key].replace(/\/[a-f0-9]{40}\//, '/39410b034c9444861f8f30836e31f9ec252d92fe/');
  await scenario(oldWalk, 1);
  await scenario(installed, 0);
}

checkSpriteStartup().then(() => {
  console.log('Model art: 13 clips / 611 frames, atlas bounds, grounded poses, idle loop, clarified flourish, live ComicHUD and active startup verified (cold, preloaded old, mixed, old flourish, cached current, player rebind and concurrent calls).');
}).catch(error => { console.error(error); process.exitCode = 1; });
