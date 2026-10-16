// Independent sprite runtime contracts with decoded original atlas bytes.
'use strict';
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const { createCanvas, Image } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const copy = value => JSON.parse(JSON.stringify(value));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const source = fs.readFileSync(path.join(root, 'src/engine/standalone-sprites.js'), 'utf8');
const installed = read(process.env.STANDALONE_SPRITES_MANIFEST || path.join(root, 'sprites-manifest.json'));
const local = copy(installed), missing = [], assetPaths = [];
function localPath(url, clip, extension) {
  const value = String(url), parsed = new URL(value, 'http://localhost/');
  const asset = parsed.pathname.includes('/assets/') ? parsed.pathname.slice(parsed.pathname.indexOf('/assets/') + 1) : null;
  const candidates = [asset, value.startsWith('.') || !value.includes('://') ? value : null,
    `assets/sprites-v3/prepared/${clip}.${extension}`, `assets/standalone-sprites/${clip}.${extension}`,
    `assets/standalone/sprites/${clip}.${extension}`, `assets/standalone/${clip}.${extension}`].filter(Boolean);
  return candidates.find(file => fs.existsSync(path.resolve(root, file))) || null;
}
for (const [character, record] of Object.entries(local.characters)) for (const [name, entry] of Object.entries(record.animations)) {
  const image = localPath(entry.image, name, 'webp'), json = localPath(entry.json, name, 'json');
  if (!image || !json) { missing.push({ character, name, image: !!image, json: !!json }); delete record.animations[name]; }
  else { entry.image = image; entry.json = json; assetPaths.push(image, json); }
}
const assetHashes = () => Object.fromEntries(assetPaths.map(file => [file, hash(fs.readFileSync(path.resolve(root, file)))]));
function createEngine() {
  const requests = [], images = [], w = { BARCODE: {}, location: { href: 'http://localhost/index.html' },
    console, setTimeout() { throw new Error('Sprite engine must not own timers'); },
    requestAnimationFrame() { throw new Error('Sprite engine must not own RAF'); } };
  const route = url => {
    const file = path.resolve(root, '.' + new URL(String(url), w.location.href).pathname);
    assert(file.startsWith(root + path.sep), 'asset requests remain within repository'); return file;
  };
  w.fetch = async url => {
    requests.push(String(url));
    if (new URL(url, w.location.href).pathname === '/sprites-manifest.json') return { ok: true, json: async () => copy(local) };
    const file = route(url); return fs.existsSync(file) ? { ok: true, json: async () => read(file) } : { ok: false, status: 404 };
  };
  w.Image = class extends Image {
    set src(url) {
      images.push(String(url));
      const file = route(url);
      if (!fs.existsSync(file)) { queueMicrotask(() => this.onerror?.(new Error('Missing local image'))); return; }
      super.src = fs.readFileSync(file);
    }
  };
  const context = vm.createContext({ window: w, URL, console });
  vm.runInContext(source, context, { filename: 'src/engine/standalone-sprites.js' });
  return { w, context, engine: w.BARCODE.StandaloneSprites, requests, images };
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }
function pixels(canvas) { return Buffer.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data); }
function canvasState(ctx) { return { alpha: ctx.globalAlpha, transform: plain(ctx.getTransform()), filter: ctx.filter }; }
function oracleDraw(ctx, sprite, x, y, options = {}) {
  const sheet = sprite.currentSprite, data = sheet.metadata.frames[sheet.currentAnimation.frames[sheet.currentFrame]];
  const anchor = sheet.manifestMetadata.anchor || sheet.metadata.meta.anchor || { x: 0, y: 0 };
  const scale = (options.scale || 1) * (sheet.manifestMetadata.scale || 1);
  // The established Character contract subtracts the scaled anchor before
  // the atlas painter applies its transform. Keep that order at pixel precision.
  const anchorScale = sheet.manifestMetadata.anchor !== undefined ? scale : 1;
  const originX = x - anchor.x * anchorScale * (options.flipH ? -1 : 1);
  const originY = y - anchor.y * anchorScale * (options.flipV ? -1 : 1);
  ctx.save(); ctx.translate(originX, originY); ctx.scale(options.flipH ? -scale : scale, options.flipV ? -scale : scale);
  if (options.alpha !== undefined) ctx.globalAlpha *= options.alpha;
  ctx.drawImage(sheet.image, data.frame.x, data.frame.y, data.frame.w, data.frame.h,
    0, 0, data.frame.w, data.frame.h); ctx.restore();
}
async function run() {
  const before = assetHashes(), r = createEngine(), { engine } = r;
  assert.equal(r.w.MakkoEngine, engine); assert.equal(engine.isLoaded(), false);
  const progress = []; let completed = 0;
  const first = engine.init('sprites-manifest.json', { onProgress: (done, total) => progress.push([done, total]), onComplete: () => completed++ });
  const concurrent = engine.init('sprites-manifest.json'); assert.equal(first, concurrent, 'concurrent startup reuses one request');
  await first;
  const clips = Object.values(local.characters).reduce((count, character) => count + Object.keys(character.animations).length, 0);
  assert(clips >= 14, 'all fourteen available authored clips are exercised');
  assert.equal(progress.length, clips); assert(progress.every(([done, total], index) => done === index + 1 && total === clips));
  assert.equal(completed, 1); assert.equal(engine.isLoaded(), true); assert.deepEqual(plain(engine.getManifest()), local);
  const loadCount = r.requests.length + r.images.length; await engine.init('sprites-manifest.json');
  assert.equal(r.requests.length + r.images.length, loadCount, 'repeat startup performs no fetch or image decode');
  assert.equal(engine.sprite('unknown'), null);
  for (const [character, record] of Object.entries(local.characters)) {
    assert(engine.has(character)); assert.deepEqual(plain(engine.getAnimations(character)), Object.keys(record.animations));
    const sprite = engine.sprite(character); assert(sprite.isLoaded());
    for (const [name, entry] of Object.entries(record.animations)) {
      sprite.play(name); assert.equal(sprite.getCurrentAnimation(), name);
      assert(sprite.currentSprite.imagePath.endsWith(entry.image.replace(/^\.\//, '')));
      const actual = createCanvas(700, 650), expected = createCanvas(700, 650);
      for (const flipH of [false, true]) for (const frame of [0, Math.floor(sprite.currentSprite.currentAnimation.frames.length / 2)]) {
        sprite.play(name, true, frame);
        const a = actual.getContext('2d'), b = expected.getContext('2d'); a.reset(); b.reset();
        a.globalAlpha = b.globalAlpha = .71; a.setTransform(.97, .02, -.01, 1.03, 4, 2); b.setTransform(.97, .02, -.01, 1.03, 4, 2);
        const options = { scale: Math.min(400 / entry.dimensions.width, 440 / entry.dimensions.height), flipH, alpha: .73 };
        const state = canvasState(a); sprite.draw(a, 350, 550, options);
        assert.deepEqual(canvasState(a), state, 'draw restores inherited alpha/filter/transform');
        oracleDraw(b, sprite, 350, 550, options);
        assert.deepEqual(pixels(actual), pixels(expected), `${name} frame ${frame} facing ${flipH}: original crop/anchor pixels`);
      }
    }
  }
  const a = engine.sprite('6_bit_main'), b = engine.sprite('6_bit_main');
  a.play('6_bit_walk_walk'); b.play('6_bit_walk_walk');
  assert.equal(a.currentSprite.image, b.currentSprite.image, 'clones reuse original decoded atlas');
  assert.equal(a.currentSprite.metadata, b.currentSprite.metadata, 'clones share immutable metadata');
  a.update(127); assert.equal(a.currentSprite.currentFrame, 2); assert.equal(a.currentSprite.timeAccumulator, 2);
  assert.equal(b.currentSprite.currentFrame, 0); assert.equal(b.currentSprite.timeAccumulator, 0);
  a.pause(); a.update(900); assert.equal(a.currentSprite.timeAccumulator, 2); a.resume(); a.update(60.5); assert.equal(a.currentSprite.currentFrame, 3);
  let cycles = 0, interruptions = 0, finishes = 0;
  const runRef = a.play('6_bit_run_run', true).onCycle(() => cycles++).onInterrupt(() => interruptions++);
  assert.equal(runRef.totalFrames, 11); a.update(1201);
  assert.equal(cycles, 2); assert.equal(runRef.cycleCount, 2); assert.equal(runRef.currentFrame, 0); assert.equal(a.currentSprite.timeAccumulator, 1);
  assert.equal(runRef.elapsedTime, 1201); assert.equal(runRef.progress, 0);
  const jump = a.play('6_bit_jump_jump', false, 25).onComplete(() => finishes++);
  assert.equal(runRef.isInterrupted, true); assert.equal(interruptions, 1);
  a.update(166); assert.equal(jump.currentFrame, 26); assert.equal(a.currentSprite.playing, false); assert.equal(finishes, 1);
  a.update(1000); assert.equal(finishes, 1); jump.onComplete(() => finishes++); assert.equal(finishes, 2);
  assert.throws(() => { jump.currentFrame = 0; }, TypeError, 'animation reference frame is read-only');
  const speed = a.play('6_bit_walk_walk', true, 4, { speed: 2 }); a.update(33);
  assert.equal(speed.currentFrame, 5); assert.equal(a.currentSprite.timeAccumulator, 3.5);
  a.play('6_bit_run_run'); b.play('6_bit_run_run');
  vm.runInContext(fs.readFileSync(path.join(root, 'src/engine/sprite-playback.js'), 'utf8'), r.context);
  for (const delta of [17, 43, 211, 330]) r.w.BARCODE.SpritePlayback.update(a, delta);
  b.update(601); assert.equal(a.currentSprite.currentFrame, b.currentSprite.currentFrame);
  assert(Math.abs(a.currentSprite.timeAccumulator - b.currentSprite.timeAccumulator) < 1e-7, 'production SpritePlayback retains exact remainder');
  const box = a.getHitboxWorld(100, 200, { scale: .5, flipH: true });
  const size = a.getCurrentFrameSize(); assert.deepEqual(plain(box), { x: 100 - size.width / 4, y: 200 - size.height / 2, width: size.width / 2, height: size.height / 2 });
  // Exercise both public anchor schemas and non-unit manifest scale with the
  // actual decoded idle atlas, without changing its saved metadata or pixels.
  const idle = engine.sprite('6_bit_main'); idle.play('6_bit_idle_idle');
  for (const manifestAnchor of [true, false]) {
    const metadata = copy(idle.currentSprite.metadata); metadata.meta.anchor = { x: 160, y: 308 };
    const manifestMetadata = { scale: 1.7, hitbox: { x: -40, y: -120, width: 80, height: 120 } };
    if (manifestAnchor) manifestMetadata.anchor = { x: 160, y: 308 };
    const sheet = new engine.SpriteSheet({ image: idle.currentSprite.image, metadata, manifestMetadata });
    const actor = new engine.Character('anchor-boundary', new Map([['idle', sheet]])); actor.play('idle');
    assert.equal(actor.currentSprite.hasManifestAnchor(), manifestAnchor);
    for (const flipH of [false, true]) {
      const actual = createCanvas(600, 600), expected = createCanvas(600, 600), options = { scale: .8, flipH, flipV: true };
      actor.draw(actual.getContext('2d'), 300, 100, options); oracleDraw(expected.getContext('2d'), actor, 300, 100, options);
      assert.deepEqual(pixels(actual), pixels(expected), 'scaled manifest and unscaled legacy anchors retain native geometry');
      const world = actor.getHitboxWorld(300, 100, options), scale = .8 * (manifestAnchor ? 1.7 : 1);
      assert.deepEqual(plain(world), { x: 300 - 40 * scale, y: 100, width: 80 * scale, height: 120 * scale });
    }
  }
  // The actual Player owner must agree with the adapter's anchor path in both facings.
  const { createRig } = require('./check-level-01-boss'); const production = createRig();
  production.w.MakkoEngine = engine; production.w.useFallbackGraphics = false;
  await production.w.player.initSprite();
  const player = production.w.player; assert(player.spriteReady);
  for (const state of ['idle', 'walk', 'run', 'jump', 'rhythm']) for (const facing of [-1, 1]) {
    player.state = state; player.facing = facing; player.playAnimation(state, 3);
    const pose = player.getVisualAnchor(facing < 0);
    assert(Math.abs(pose.visibleFootY - pose.targetFootY) < 1e-8);
    assert(Number.isFinite(pose.visibleAnchorX));
    const actual = createCanvas(1400, 1000), expected = createCanvas(1400, 1000);
    player.sprite.draw(actual.getContext('2d'), pose.x, pose.y, { scale: pose.scale, flipH: facing < 0 });
    oracleDraw(expected.getContext('2d'), player.sprite, pose.x, pose.y, { scale: pose.scale, flipH: facing < 0 });
    assert.deepEqual(pixels(actual), pixels(expected), 'production Player foot/head compensation matches original atlas pixels');
  }
  const failure = createEngine(); let errors = 0;
  const bad = { characters: { missing: { animations: { absent: { image: 'absent.webp', json: 'absent.json' } } } } };
  await assert.rejects(failure.engine.init(bad, { onError: () => errors++ }), /Sprite (image|JSON) request failed/);
  assert.equal(failure.engine.isLoaded(), false); assert.equal(errors, 1); assert.equal(failure.engine.has('missing'), false);
  await failure.engine.init('sprites-manifest.json'); assert(failure.engine.isLoaded(), 'failed startup can retry with actual assets');
  assert.deepEqual(assetHashes(), before, 'all original atlas/JSON bytes remain unchanged');
  console.log(JSON.stringify({ passed: true, availableLocalClips: clips, missingLocalPairs: missing,
    pixelCases: clips * 4, playerContactCases: 10, exactRunCycleMs: 600, exactWalkFrameMs: 62.5,
    clonedPlayback: true, durationRemainder: true, frameOwnedPlayback: true, callbacks: true,
    alphaTransformRestore: true, anchorScaleBoundaryCases: 4, hitboxes: true, loadFailureAndRetry: true,
    limit: 'Native decoded-art/API proof; full browser startup, sound, physical controls and device frame pacing require integration.' }));
}
run().catch(error => { console.error(error.stack); process.exitCode = 1; });
