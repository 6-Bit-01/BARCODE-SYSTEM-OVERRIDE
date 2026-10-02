#!/usr/bin/env node
// Production input, lifecycle and road owners. Native review decodes the
// canonical bundled atlas at the image boundary, with no additional renderer.
// This is controlled integration evidence, not owner/device/audio acceptance.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process'), { once } = require('node:events');
const { completionRig } = require('./check-cache-completion-flow.cjs');
const { runCombatRace } = require('./check-cache-combat-integration.cjs');
const { load } = require('./check-level-01-boss');
const root = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const flush = async () => { for (let i = 0; i < 24; i++) await Promise.resolve(); };
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const OWNERS = ['src/game/cache-road-adrenaline.js', 'src/game/cache-road-encounters.js',
  'src/game/cache-road-reactions.js', 'src/game/cache-road-pursuit.js',
  'src/game/cache-road-combat.js', 'src/game/cache-road-combat-art.js',
  'src/game/cache-road-boss-art.js', 'src/game/cache-road-crosswalks.js',
  'src/game/cache-road-mirror.js', 'src/game/cache-road-crew-callouts.js',
  'src/game/cache-road-instruments.js', 'src/game/cache-road-guidance.js',
  'src/game/cache-road-cinematics.js'];
const SOURCES = [...OWNERS, 'index.html', 'src/game/cache-road-proof.js', 'src/game/cache-chapter.js',
  'src/core/input.js', 'src/core/loop.js', 'src/core/runtime-lifecycle.js',
  'src/engine/presentation-assets.js', 'tools/check-cache-road-cinematics.cjs'];
function sourceHashes() {
  return Object.fromEntries(SOURCES.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
}

async function freshRig(version = 4, { storage, keyboard = false } = {}) {
  const r = completionRig(storage, { encounterVersion: version });
  for (const file of OWNERS) load(r.context, file);
  if (version === 4) {
    // Historical completion fixtures override the chapter factory. Reload
    // its production implementation for the real current fresh default.
    load(r.context, 'src/game/cache-chapter.js'); r.chapter = r.B.CacheChapter;
  }
  if (keyboard) r.w.navigator.getGamepads = () => [];
  await r.boot(); r.bridge.skipToReady(); assert((await r.bridge.drive()).ok);
  assert.equal(r.road.chapter.encounterVersion, version);
  r.drawRoad = r.road.draw.bind(r.road); r.road.draw = () => {};
  return r;
}
function gameplayFacts(r) {
  return {
    state: copy(r.road.state), chapter: copy(r.road.chapter),
    checkpoint: copy(r.C.readResume()), progress: copy(r.C.archive().record.progress)
  };
}

async function checkOpening(receipt) {
  const r = await freshRig(), { road, B } = r, C = B.CacheRoadCinematics;
  assert.deepEqual(copy(C.durations), { opening: 7600, handoff: 1400, outro: 3800 });
  assert.equal(road.introMs, 0); assert.equal(r.roadStarts(), 0);
  const facts = gameplayFacts(r), poses = [];
  for (const ms of [0, 1200, 2500, 4000, 4800, 6000, 7500]) {
    if (ms > road.introMs) r.step(ms - road.introMs, 100);
    assert.deepEqual(gameplayFacts(r), facts,
      'the cinematic clock cannot fabricate chart progress, saves, damage or rewards');
    assert.equal(r.roadStarts(), 0);
    const pose = copy(road.cinematicPose());
    assert.equal(pose.kind, 'opening');
    assert(Number.isFinite(pose.progressOffset) && Number.isFinite(pose.car.lane));
    assert.deepEqual(copy(road.cinematicPose()), pose, 'observing a cinematic pose is pure');
    r.drawRoad(r.w.renderer.ctx);
    assert.deepEqual(gameplayFacts(r), facts, 'production cinematic drawing preserves all gameplay facts');
    poses.push({ ms, ...pose });
  }
  assert.equal(poses[0].progressOffset, -300);
  assert(poses.at(-1).progressOffset > poses[0].progressOffset);
  assert(poses[0].hudAlpha === 0 && poses.at(-1).hudAlpha > .9,
    'the real HUD fades into the opening before control handoff');
  assert(poses.some(pose => pose.actors.length >= 2), 'two staged pursuers become visible');
  assert(poses.some(pose => pose.actors.some(actor => actor.phase === 'crash' || actor.phase === 'wreck' ||
    actor.phase === 'offroad' || actor.phase === 'sideswipe')),
    'the opening includes an actual rendered sideswipe, not only a caption');
  r.step(100, 100);
  assert.equal(road.introMs, null); assert.equal(r.roadStarts(), 1);
  assert.equal(road.state.musicBar, 0); assert.equal(road.state.musicBeatFloat, 0);
  assert.equal(road.state.progress, 0, 'finishIntro starts from the authentic original chart origin');
  assert.equal(road.handoffMs, 0);
  const handoff = copy(road.cinematicPose());
  assert.equal(handoff.kind, 'handoff'); assert.equal(handoff.controlRatio, 0);
  assert(handoff.actors.length > 0, 'the remaining pursuer continues through handoff');
  const modelStart = copy(C.pose('opening', C.durations.opening));
  const modelHandoff = copy(C.pose('handoff', 0));
  for (const key of ['lane', 'depth', 'scale'])
    assert(Math.abs(modelStart.car[key] - modelHandoff.car[key]) < 1e-6,
      'the gameplay transition preserves the actual car presentation: ' + key);
  for (const kind of ['opening', 'handoff', 'outro']) {
    const duration = C.durations[kind];
    for (const ms of [0, duration * .5, duration]) {
      const quiet = copy(C.pose(kind, ms, { reducedMotion: true }));
      assert(Number.isFinite(quiet.car.lane) && Number.isFinite(quiet.progressOffset));
      assert.deepEqual(copy(C.pose(kind, ms, { reducedMotion: true })), quiet);
    }
    assert.equal(C.pose(kind, duration).complete, true, kind + ' has a finite exact endpoint');
  }
  receipt.checks.push({ name: 'fresh-opening', poses, chartFrozen: true, savesFrozen: true,
    musicAtOriginalOrigin: true, handoffContinuous: true, comfortFinite: true });
  await B.RuntimeLifecycle.stop('cinematic-opening-check');
}

async function checkControls(receipt) {
  for (const source of ['keyboard', 'controller']) {
    const r = await freshRig(4, { keyboard: source === 'keyboard' }), { road, B, pad, w } = r;
    r.step(2200, 100); const beforeIntro = road.introMs, facts = gameplayFacts(r);
    if (source === 'keyboard') r.tap('p');
    else { pad.buttons[9].pressed = true; r.input(); }
    await flush(); assert(w.isPaused, source + ': the real input owner pauses the opening');
    r.step(10000, 100);
    assert.equal(road.introMs, beforeIntro); assert.deepEqual(gameplayFacts(r), facts);
    assert.equal(road.finishIntro(), false, 'a direct skip cannot bypass Pause');
    assert.equal(r.roadStarts(), 0);
    if (source === 'keyboard') r.tap('Enter');
    else { pad.buttons[9].pressed = false; r.input(); pad.buttons[0].pressed = true; r.input(); }
    await flush(); assert(!w.isPaused); assert.equal(road.introMs, beforeIntro);
    r.input(); r.step(50, 100); assert.notEqual(road.introMs, null,
      'the carried Pause confirmation cannot also skip the road cinematic');
    if (source === 'keyboard') r.tap('Enter');
    else { pad.buttons[0].pressed = false; r.input(); pad.buttons[0].pressed = true; r.input(); }
    assert.equal(road.introMs, null); assert.equal(r.roadStarts(), 1);
    assert.equal(road.finishIntro(), false); assert.equal(r.roadStarts(), 1);
    if (source === 'controller') { pad.buttons[0].pressed = false; r.input(); }
    await B.RuntimeLifecycle.stop('cinematic-' + source + '-pause-skip');
  }
  const r = await freshRig(), { road, pad, B } = r;
  // These are real held skill buttons, carried across the opening, rather
  // than test calls directly into the action owner.
  for (const index of [4, 5, 6, 7]) pad.buttons[index].pressed = true;
  r.input(); assert(road.finishIntro()); r.step(1500, 100);
  assert.equal(road.handoffMs, null);
  assert.equal(road.state.adrenaline.stats.turbos, 0);
  assert.equal(road.state.adrenaline.stats.disrupts, 0);
  assert.equal(road.state.queuedTurbo, false, 'carried shoulder presses cannot queue a hidden Turbo');
  for (const index of [4, 5, 6, 7]) pad.buttons[index].pressed = false;
  r.input(); r.step(20, 50); pad.buttons[4].pressed = true; r.step(20, 50);
  assert.equal(road.state.adrenaline.stats.turbos, 1,
    'released and freshly pressed Turbo works after the real handoff');
  receipt.checks.push({ name: 'input-ownership', keyboardPauseSkip: true, controllerPauseSkip: true,
    carriedResumeRejected: true, launchOnce: true, carriedSkillsRejected: true, freshSkillAccepted: true });
  await B.RuntimeLifecycle.stop('cinematic-held-skills-check');
  const steering = await freshRig();
  assert(steering.road.finishIntro()); steering.input();
  let before = steering.road.state.lanePos;
  steering.pad.axes[0] = 1; steering.step(100, 100);
  const earlyDistance = steering.road.state.lanePos - before;
  steering.pad.axes[0] = 0; steering.step(1300, 100);
  assert.equal(steering.road.handoffMs, null);
  before = steering.road.state.lanePos;
  steering.pad.axes[0] = 1; steering.step(100, 100);
  const fullDistance = steering.road.state.lanePos - before;
  assert(earlyDistance >= 0 && fullDistance > earlyDistance * 3 && fullDistance > .04,
    'actual held steering smoothly gains authority through the handoff');
  assert(steering.road.state.musicBeatFloat > 0, 'the authentic music clock runs during steering handoff');
  receipt.checks.push({ name: 'production-steering-handoff', earlyDistance, fullDistance, musicRuns: true });
  await steering.B.RuntimeLifecycle.stop('cinematic-steering-handoff-check');
}

async function checkLegacy(receipt) {
  const versions = [];
  for (const version of [1, 2, 3]) {
    const r = await freshRig(version), { road, B } = r;
    assert.equal(road.cinematicPose(), null, 'historical version ' + version + ' keeps its original presentation');
    r.step(4190, 100); assert.notEqual(road.introMs, null); assert.equal(r.roadStarts(), 0);
    r.step(10, 100); assert.equal(road.introMs, null); assert.equal(road.handoffMs, null);
    assert.equal(r.roadStarts(), 1); assert.equal(road.state.musicBar, 0);
    versions.push(version); await B.RuntimeLifecycle.stop('cinematic-legacy-' + version);
  }
  receipt.checks.push({ name: 'historical-launch', versions, originalDurationMs: 4200, handoffAdded: false });
}

async function checkEarnedOutro(receipt) {
  let carried = false;
  const run = await runCombatRace({ difficulty: 'standard', gear: 1,
    onFrame(r) {
      if (r.road.state.musicBar % 20 === 0 && r.road.state.musicBeatFloat % 80 < .05)
        console.log(JSON.stringify({ cinematicRaceBar: r.road.state.musicBar,
          status: r.road.status, integrity: r.road.state.integrity }));
      if (!carried && r.road.state.musicBeatFloat >= 399.2) {
        r.key('Enter', true); carried = true;
      }
    } });
  const { r, result } = run, { road, B } = r;
  assert(carried && result.status === 'clear' && Math.abs(result.finalBar - 100) < 1e-8,
    'the actual full-song race earns clear: ' + JSON.stringify({ carried, status: result.status,
      finalBar: result.finalBar, frames: result.frames, damageTaken: result.damageTaken,
      boss: result.combat.boss, message: result.finalMessage }));
  assert(result.combat.boss?.defeated && result.combat.boss.hp === 0);
  assert(road.chapter.delivery?.result, 'true physical clear commits its immutable result before the outro');
  assert.equal(road.outroMs, 0); assert(!r.ending.active);
  assert.equal(road.cinematicPose().kind, 'outro');
  const earned = copy(road.chapter.delivery.result), saved = copy(r.C.readResume());
  assert(r.C.archive().record.progress.items.includes('stem.bass'));
  assert(r.C.archive().record.progress.completedLevels.includes('level-02'));
  assert(r.C.archive().record.progress.unlockedLevels.includes('level-03'));
  assert.deepEqual(saved.levelState.chapter.delivery.result, earned);
  assert.equal(B.MusicTransport.getDiagnostics().running, false);
  const earnedState = copy(road.state), earnedChapter = copy(road.chapter);
  r.key('Enter', true, true); r.input(); r.step(500, 100);
  assert.equal(road.outroMs, 500); assert(!r.ending.active,
    'a carried gameplay confirmation does not skip the outro');
  r.tap('p'); await flush(); assert(r.w.isPaused); const at = road.outroMs;
  r.step(9000, 100); assert.equal(road.outroMs, at);
  assert.equal(road.finishOutro(), false, 'direct outro skip respects Pause');
  r.tap('p'); await flush(); assert(!r.w.isPaused);
  const frozen = { state: earnedState, chapter: earnedChapter, checkpoint: saved,
    progress: copy(r.C.archive().record.progress) };
  assert.deepEqual(gameplayFacts(r), frozen, 'outro and Pause preserve every earned gameplay fact');
  run.nativeEarned = { state: earnedState, chapter: earnedChapter, saved };
  r.step(B.CacheRoadCinematics.durations.outro - at, 100);
  assert.equal(road.outroMs, null); assert(r.ending.active);
  assert.equal(r.ending.page, 0); assert.equal(r.ending.cue, 0,
    'the held driving confirmation cannot consume the delivery ending title');
  assert.deepEqual(copy(road.chapter.delivery.result), earned);
  assert.equal(road.finishOutro(), false, 'the transient outro can finish only once');
  r.key('Enter', false); r.tap(' '); assert.equal(r.ending.cue, 1,
    'a fresh reading input works after the final presentation handoff');
  const reopened = completionRig(r.storage, { encounterVersion: 4 });
  for (const file of OWNERS) load(reopened.context, file);
  load(reopened.context, 'src/game/cache-chapter.js');
  await reopened.boot(saved);
  assert.equal(reopened.road.outroMs, null); assert(reopened.ending.active);
  assert.equal(reopened.roadStarts(), 0);
  assert.deepEqual(copy(reopened.road.chapter.delivery.result), earned,
    'loading an earned clear resumes the ending without replaying or re-awarding the transient outro');
  await reopened.B.RuntimeLifecycle.stop('cinematic-earned-reload');
  receipt.checks.push({ name: 'earned-outro', actualRaceFrames: result.frames, actualBar: result.finalBar,
    bossDefeated: true, atomicResultBeforeOutro: true, atomicBassBeforeOutro: true,
    carriedConfirmRejected: true, pauseFrozen: true, naturalExitMs: 3800,
    endingFreshRelease: true, reloadSkipsTransientOutro: true, musicStopped: true,
    earnedResult: earned });
  return run;
}

async function nativeReview(out, earnedRun) {
  const { createCanvas, loadImage, GlobalFonts, Path2D } = require(require.resolve('@napi-rs/canvas', {
    paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || root, root]
  }));
  fs.mkdirSync(out, { recursive: true });
  GlobalFonts.registerFromPath(path.join(root, 'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'), 'Oxanium');
  const manifest = fs.readFileSync(path.join(root, 'src/engine/presentation-assets.js'), 'utf8');
  const r = await freshRig(), { w, context, B, road } = r;
  w.Image = undefined;
  vm.runInContext(manifest.replace('  const cache = {};',
    '  window.cinematicReviewEntries=entries;\n  const cache = {};'), context);
  const entries = Object.entries(w.cinematicReviewEntries).filter(([key]) => key.startsWith('cache'));
  const initialAssetHashes = {};
  const imageDecodeBoundaryAdaptations = [];
  w.cinematicReviewImages = Object.fromEntries(await Promise.all(entries.map(async ([key, entry]) => {
    // Decode the exact same bytes that receive this initial fingerprint;
    // a later pathname read cannot silently change the capture's source.
    const bytes = fs.readFileSync(path.join(root, entry.path));
    initialAssetHashes[key] = { path: entry.path, sha256: hash(bytes) };
    let image;
    try { image = await loadImage(bytes); }
    catch (error) {
      const pngMagic = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
      if (!bytes.subarray(0, 8).equals(pngMagic) || error.message !== 'Invalid SVG image') throw error;
      // Local NAPI buffer sniffing can mistake C2PA-bearing PNGs for SVG.
      // Decode the same initially fingerprinted bytes through a .png path;
      // no runtime asset is converted, stripped, substituted or changed.
      const snapshots = path.join(out, 'native-png-snapshots');
      fs.mkdirSync(snapshots, { recursive: true });
      const snapshot = path.join(snapshots, `${initialAssetHashes[key].sha256}.png`);
      fs.writeFileSync(snapshot, bytes);
      assert.equal(hash(fs.readFileSync(snapshot)), initialAssetHashes[key].sha256);
      image = await loadImage(snapshot);
      assert.equal(hash(fs.readFileSync(snapshot)), initialAssetHashes[key].sha256,
        'native PNG pathname decoding preserves the exact initially hashed asset bytes');
      imageDecodeBoundaryAdaptations.push({ key, path: entry.path, snapshot,
        sha256: initialAssetHashes[key].sha256, bytes: bytes.length,
        width: image.width, height: image.height, beforeAfterBytesMatch: true,
        reason: 'Local NAPI PNG buffer reported Invalid SVG image; identical .png snapshot decoded.' });
    }
    return [key, image];
  })));
  vm.runInContext(manifest.replace('  const cache = {};',
    '  const cache=Object.fromEntries(Object.entries(window.cinematicReviewImages).map(([key,image])=>[key,{image,ready:true}]));'), context);
  w.Path2D = Path2D;
  const createElement = w.document.createElement?.bind(w.document);
  let productionCanvasAllocations = 0;
  w.document.createElement = tag => {
    if (tag !== 'canvas') return createElement?.(tag);
    productionCanvasAllocations++; return createCanvas(1920, 1080);
  };
  const native = B.PresentationAssets.draw, trace = [];
  B.PresentationAssets.draw = function(key, ctx, args) {
    trace.push({ key, ...copy(args) }); return native(key, ctx, args);
  };
  const canvas = createCanvas(1920, 1080), ctx = canvas.getContext('2d');
  w.renderer.canvas = canvas; w.renderer.ctx = ctx;
  const nativeText = ctx.fillText.bind(ctx), textTrace = [], rectangleTrace = [];
  ctx.fillText = function(value, ...args) {
    textTrace.push({ text: String(value), alpha: ctx.globalAlpha, args: [...args] });
    return nativeText(value, ...args);
  };
  for (const method of ['strokeRect', 'fillRect']) {
    const nativeRect = ctx[method].bind(ctx);
    ctx[method] = function(...args) {
      rectangleTrace.push({ method, style: String(method === 'strokeRect' ? ctx.strokeStyle : ctx.fillStyle),
        alpha: ctx.globalAlpha, args: [...args] });
      return nativeRect(...args);
    };
  }
  const hudCalls = [];
  const actualInstruments = B.CacheRoadInstruments;
  // Preserve the frozen production owner; substitute only an observation
  // boundary which delegates every method to its exact implementation.
  B.CacheRoadInstruments = { ...actualInstruments };
  for (const method of ['drawSkills', 'drawAdrenaline']) {
    const owner = actualInstruments[method];
    assert.equal(typeof owner, 'function', 'the actual native instrument owner must load');
    B.CacheRoadInstruments[method] = function(...args) {
      hudCalls.push(method); return owner(...args);
    };
  }
  const film = createCanvas(960, 540), fc = film.getContext('2d');
  const captures = [], files = [], movies = [], frameEvidence = [];
  const gameplay = () => JSON.stringify({ state: road.state, chapter: road.chapter });
  function draw(kind, ms, still = false) {
    trace.length = 0; textTrace.length = 0; rectangleTrace.length = 0; hudCalls.length = 0;
    const before = gameplay();
    r.drawRoad(ctx); assert.equal(gameplay(), before, 'native drawing is a pure cinematic observer');
    assert.equal(ctx.globalAlpha, 1, 'cinematic HUD alpha is restored on the shared main context');
    const pixels = Buffer.from(ctx.getImageData(0, 0, 1920, 1080).data);
    const pose = copy(road.cinematicPose());
    if (kind === 'opening' && ms === 0) {
      assert.equal(pose.hudAlpha, 0);
      assert.equal(hudCalls.length, 0, 'the initial opening submits no combat skill or adrenaline HUD');
      assert(!trace.some(call => /^cacheDash/.test(call.key) || call.key === 'cacheMirror'),
        'the initial opening submits neither dashboard artwork nor rearview HUD');
      assert(!textTrace.some(call => call.text === '1'),
        'the initial opening draws no fixed timing ONE label');
    }
    const outroFeedbackArtwork = new Set(['cacheBraceHalo', 'cachePushArc', 'cacheEchoRibbons',
      'cachePulseBurst', 'cacheCombatFX', 'cachePursuitImpact', 'cacheImpactGrit', 'cacheSpeedMist']);
    if (kind === 'outro') {
      assert(!trace.some(call => outroFeedbackArtwork.has(call.key)),
        'the physically earned outro draws no carried status halo, pulse-success, projectile or skill artwork');
      assert(!rectangleTrace.some(call =>
        (call.method === 'strokeRect' && call.style.toLowerCase() === '#ecffd2') ||
        (call.method === 'fillRect' && call.style.toLowerCase() === '#ffb39b')),
        'the earned outro suppresses actual targeting reticles and enemy HP paint');
      assert(!textTrace.some(call => ['WINDUP', 'LOCKED', 'DEFEND COUNTER', 'DEFEND BLOCK',
        'GUARD READY', 'SYNC IMPACT', 'TURBO READY', 'DRAFT / TURBO'].includes(call.text)),
        'the earned outro suppresses combat warning and skill-feedback receipts');
    }
    const carCalls = trace.filter(call => /^cacheCar(?:Left|Right|Hit)?$/.test(call.key));
    assert(carCalls.length > 0 || (kind === 'outro' && pose.car.scale * 164 <= 1),
      'actual canonical Cache artwork remains present until it reaches the road horizon');
    for (const call of trace) for (const key of ['x', 'y', 'width', 'height', 'frame'])
      if (key in call) assert(Number.isFinite(call[key]), 'all native atlas placements are finite');
    if (still) {
      const filename = `${kind}-${String(Math.round(ms)).padStart(4, '0')}ms.webp`;
      fs.writeFileSync(path.join(out, filename), canvas.toBuffer('image/webp'));
      files.push(filename); captures.push({ kind, ms, filename });
      frameEvidence.push({ kind, ms, pose, pixelHash: hash(pixels),
        hudDrawCalls: [...hudCalls], timingOneLabels: textTrace.filter(call => call.text === '1'),
        outroFeedbackArtwork: trace.filter(call => outroFeedbackArtwork.has(call.key)),
        canonicalCarCalls: carCalls, stagedVehicleCalls: trace.filter(call =>
          ['cacheCombatHostiles', 'cacheCombatBike', 'cacheCombatBikeCrash', 'cacheRival', 'cacheAudit'].includes(call.key)) });
    }
    fc.reset(); fc.drawImage(canvas, 0, 0, 960, 540);
    return Buffer.from(fc.getImageData(0, 0, 960, 540).data);
  }
  async function movie(kind, duration, initialize) {
    initialize?.(); const fps = 24, filename = `${kind}-in-world.mp4`;
    const encoder = spawn('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba',
      '-s', '960x540', '-r', String(fps), '-i', 'pipe:0', '-an', '-c:v', 'libx264', '-threads', '2',
      '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, filename)],
      { stdio: ['pipe', 'ignore', 'pipe'] });
    let errors = ''; encoder.stderr.on('data', chunk => { errors += chunk; });
    const n = Math.ceil(duration * fps / 1000);
    const selected = new Set([0, Math.floor(n * .2), Math.floor(n * .4), Math.floor(n * .6),
      Math.floor(n * .8), n - 1]);
    for (let frame = 0; frame < n; frame++) {
      const ms = frame / fps * 1000;
      if (frame) r.step(1000 / fps, fps);
      const pixels = draw(kind, ms, selected.has(frame));
      if (!encoder.stdin.write(pixels)) await once(encoder.stdin, 'drain');
      if (frame % 48 === 0) console.log(JSON.stringify({ nativeCinematic: kind, frame, total: n }));
    }
    encoder.stdin.end(); const [code] = await once(encoder, 'close'); assert.equal(code, 0, errors);
    movies.push(filename); files.push(filename);
  }
  await movie('opening', B.CacheRoadCinematics.durations.opening + B.CacheRoadCinematics.durations.handoff);
  // This is the exact actual clear generated above. Reusing its immutable
  // snapshot renders the transient exit; it does not inject victory into a
  // gameplay simulation or stand in for the true-clear integration test.
  await movie('outro', B.CacheRoadCinematics.durations.outro, () => {
    road.state = copy(earnedRun.nativeEarned.state); road.chapter = copy(earnedRun.nativeEarned.chapter);
    road.status = 'clear'; road.introMs = null; road.handoffMs = null; road.outroMs = 0;
    B.CacheEnding.dispose(); w.isPaused = false;
  });
  const contactPages = [];
  for (const kind of ['opening', 'outro']) {
    const selected = captures.filter(capture => capture.kind === kind);
    const page = createCanvas(1920, Math.ceil(selected.length / 2) * 594), pc = page.getContext('2d');
    pc.fillStyle = '#142331'; pc.fillRect(0, 0, page.width, page.height);
    for (let i = 0; i < selected.length; i++) {
      const capture = selected[i], x = (i % 2) * 960, y = Math.floor(i / 2) * 594;
      pc.drawImage(await loadImage(path.join(out, capture.filename)), x, y + 40, 960, 540);
      pc.fillStyle = '#e8efde'; pc.font = '23px Oxanium';
      pc.fillText(`${kind.toUpperCase()} / ${(capture.ms / 1000).toFixed(2)} s`, x + 20, y + 29);
    }
    const filename = `${kind}-contact-page.webp`; fs.writeFileSync(path.join(out, filename), page.toBuffer('image/webp'));
    contactPages.push(filename); files.push(filename);
  }
  const first = frameEvidence.filter(frame => frame.kind === 'opening');
  assert(new Set(first.map(frame => frame.pixelHash)).size === first.length,
    'production opening frames contain distinct native moving road/vehicle paint');
  const handedOff = first.find(frame => frame.pose.kind === 'handoff');
  assert(handedOff && handedOff.hudDrawCalls.includes('drawSkills') &&
    handedOff.hudDrawCalls.includes('drawAdrenaline'),
    'after handoff the actual combat skill and adrenaline HUD owners visibly run');
  assert(handedOff.timingOneLabels.length > 0,
    'the ordinary timing ONE label returns after cinematic handoff');
  assert(first.some(frame => frame.stagedVehicleCalls.some(call => call.key === 'cacheCombatHostiles')),
    'staged cinematic foes use their actual registered combat atlas owner, not legacy vehicle fallbacks');
  const ending = frameEvidence.filter(frame => frame.kind === 'outro');
  assert(new Set(ending.map(frame => frame.pixelHash)).size === ending.length);
  const lastVisible = ending.findLast(frame => frame.pose.car.scale > .001 && frame.canonicalCarCalls.length);
  const lastCar = lastVisible.canonicalCarCalls.at(-1), firstCar = ending[0].canonicalCarCalls.at(-1);
  assert(lastCar.width < firstCar.width * .45,
    'the actual canonical vehicle visibly recedes into the production road horizon');
  assert(ending.at(-1).pose.car.scale < .001, 'the final departure reaches the road horizon');
  assert.equal(productionCanvasAllocations, 0,
    'the production opening and outro reuse the main Canvas/context without allocating a new one');
  const nativeReceipt = { scope: 'Exact decoded canonical raster atlas; production road.draw at 1920×1080; silent native clips at 960×540 / 24 FPS.',
    limits: 'Boundary-adapted native Canvas. Outro imagery replays the physically earned clear snapshot; no hosted Makko, audio/listening, physical controller or device FPS claim.',
    captures: frameEvidence, movies, contactPages, productionCanvasAllocations,
    earnedOutroStatus: Object.fromEntries(['shield', 'ramMs', 'boostMs', 'defenseFlashMs', 'pulseFlashMs',
      'stumbleMs', 'invulnerableMs'].map(key => [key, earnedRun.nativeEarned.state[key]])),
    assetHashes: initialAssetHashes, imageDecodeBoundaryAdaptations,
    fileHashes: Object.fromEntries(files.map(file => [file, hash(fs.readFileSync(path.join(out, file)))])) };
  fs.writeFileSync(path.join(out, 'native-cinematic-review.json'), JSON.stringify(nativeReceipt, null, 2) + '\n');
  await B.RuntimeLifecycle.stop('cinematic-native-review');
  return nativeReceipt;
}

async function main() {
  // The implementation-specific assertions are deliberately kept beside
  // the production hooks below rather than introducing a duplicate clock.
  assert(fs.existsSync(path.join(root, OWNERS.at(-1))), 'the cinematic owner is required');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert(index.indexOf('src/game/cache-road-cinematics.js') >= 0 &&
    index.indexOf('src/game/cache-road-cinematics.js') < index.indexOf('src/game/cache-road-proof.js'),
    'the actual application loads the cinematic pose owner before its road consumer');
  const receipt = { gate: 'cache-road-in-world-cinematics', passed: false,
    scope: 'Actual Campaign, ActionInput, shared RAF, chapter/save and native production road rendering.',
    limits: 'Boundary-hosted image/audio/storage; not hosted Makko, listening, physical controller, human balance or device FPS acceptance.',
    checks: [], native: null, sourceHashes: sourceHashes() };
  await checkOpening(receipt);
  console.log('PASS cinematic opening: production scene clock, frozen gameplay/save facts and original beat-zero handoff.');
  await checkControls(receipt);
  console.log('PASS cinematic controls: real Pause, release-armed skips/skills and smoothly blended steering.');
  await checkLegacy(receipt);
  console.log('PASS cinematic compatibility: historical versions 1–3 keep their 4.2-second launch.');
  const run = await checkEarnedOutro(receipt);
  const nativeArg = process.argv.find(arg => arg.startsWith('--native='));
  if (nativeArg) receipt.native = await nativeReview(path.resolve(nativeArg.slice(9)), run);
  assert.deepEqual(sourceHashes(), receipt.sourceHashes,
    'all initially fingerprinted source bytes remain unchanged through the final run');
  receipt.sourceStableThroughoutRun = true;
  receipt.assetsMatchFinalRuntimeBytes = receipt.native ? Object.values(receipt.native.assetHashes).every(asset =>
    hash(fs.readFileSync(path.join(root, asset.path))) === asset.sha256) : null;
  if (receipt.native) assert.equal(receipt.assetsMatchFinalRuntimeBytes, true,
    'all initially decoded native asset bytes match the final runtime files');
  receipt.passed = true;
  const outputArg = process.argv.find(arg => arg.startsWith('--output='));
  if (outputArg) fs.writeFileSync(path.resolve(outputArg.slice(9)), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt));
}

module.exports = { freshRig, gameplayFacts, sourceHashes, checkOpening, checkControls, checkLegacy, checkEarnedOutro };
if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
