#!/usr/bin/env node
// Selected native draws from one genuine production-input combat race.
// No combat/road state is staged. Capture cadence is not device/game FPS.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');
const { once } = require('node:events');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { createRig, load } = require('./check-level-01-boss');
const { runCombatRace, assertClear, hashes } = require('./check-cache-combat-integration.cjs');
const root = path.resolve(__dirname, '..');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const copy = value => JSON.parse(JSON.stringify(value));
const round = n => Number(Number(n).toFixed(3));
const FPS = 6, WIDTH = 1280, HEIGHT = 756;
const WINDOWS = [{ name: 'Early bike skirmish', fromBar: 6, toBar: 10 },
  { name: 'Mixed chase', fromBar: 28, toBar: 31 }];
const LABEL = process.env.CACHE_COMBAT_REVIEW_LABEL || 'MECHANICS PROTOTYPE / existing traffic art';
let encoder;

async function main() {
  const output = path.resolve(process.argv[2] || path.join(root, '..', 'combat-native-review'));
  assert(!output.startsWith(root + path.sep), 'Review output and intermediate frames belong outside the source repository.');
  fs.mkdirSync(output, { recursive: true });
  const registryFile = 'src/engine/presentation-assets.js';
  const registry = fs.readFileSync(path.join(root, registryFile), 'utf8');
  const cacheMarker = '  const cache = {};';
  assert(registry.includes(cacheMarker), 'PresentationAssets cache boundary must match the native host adapter');
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const visualOwners = [...new Set(['src/game/cache-road-guidance.js',
    ...Array.from(index.matchAll(/<script\s+src="(src\/game\/cache-road-[^"]*art[^"/]*\.js)"/g), m => m[1])])];
  const sourceFiles = [...new Set([...Object.keys(hashes()), registryFile, 'index.html',
    'src/core/gamepad-ui.js', 'src/game/cache-road-guidance.js',
    'src/game/cache-road-landscape.js', ...visualOwners,
    'tools/render-cache-combat-review.cjs'])];
  const sourceHashes = Object.fromEntries(sourceFiles.map(file => [file, hash(path.join(root, file))]));
  const defs = createRig(); defs.w.Image = undefined;
  vm.runInContext(registry.replace(cacheMarker, '  window.reviewEntries=entries;\n' + cacheMarker), defs.context);
  const entries = Object.fromEntries(Object.entries(defs.w.reviewEntries).filter(([key]) => key.startsWith('cache')));
  const images = Object.fromEntries(await Promise.all(Object.entries(entries).map(async ([key, entry]) =>
    [key, await loadImage(path.join(root, entry.path))])));
  const assets = Object.fromEntries(Object.entries(entries).map(([key, entry]) => [key, {
    path: entry.path, sha256: hash(path.join(root, entry.path)),
    width: images[key].naturalWidth, height: images[key].naturalHeight,
    columns: entry.columns, rows: entry.rows, frames: entry.frames } ]));
  GlobalFonts.registerFromPath(path.join(root, 'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'), 'Oxanium');
  const scene = createCanvas(1920, 1080), context = scene.getContext('2d');
  const video = createCanvas(WIDTH, HEIGHT), vctx = video.getContext('2d');
  const videoPath = path.join(output, 'Combat-Mechanics-Preview.mp4');
  encoder = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'rawvideo', '-pixel_format', 'rgba', '-video_size', `${WIDTH}x${HEIGHT}`,
    '-framerate', String(FPS), '-i', 'pipe:0', '-an', '-c:v', 'libx264',
    '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', videoPath],
  { stdio: ['pipe', 'ignore', 'pipe'] });
  let encoderErrors = ''; encoder.stderr.on('data', data => encoderErrors += data.toString());
  const encoded = once(encoder, 'close');
  const windows = copy(WINDOWS), frameEvidence = [], events = [], stills = [], drawn = {};
  const opened = new Set(), selectedStills = new Set();
  let installed = false, nextSampleMs = -Infinity, previousHp = null, eventCursor = 0;
  let submissions = [];
  function openWindow(name, bar, durationMs) {
    if (opened.has(name)) return;
    opened.add(name);
    windows.push({ name, fromBar: bar, toBar: Math.min(100, bar + durationMs / 1875), trigger: 'earned live observation' });
  }
  const run = await runCombatRace({ difficulty: 'standard', gear: 1, profile: 'practiced',
    async onFrame(r, observed, driver, inputFrame) {
      if (!installed) {
        for (const file of visualOwners) load(r.context, file);
        r.w.Image = undefined; r.w.nativeCombatReviewImages = images;
        vm.runInContext(registry.replace(cacheMarker,
          '  const cache=Object.fromEntries(Object.entries(window.nativeCombatReviewImages).map(([key,image])=>[key,{image,ready:true}]));'), r.context);
        const drawAsset = r.B.PresentationAssets.draw;
        r.B.PresentationAssets.draw = function(key, ctx, args = {}) {
          const ready = drawAsset.call(this, key, ctx, args);
          if (ready) {
            drawn[key] = (drawn[key] || 0) + 1;
            if (/Pursuit|Combat|Trike|Sweeper|Audit|Rival/i.test(key)) submissions.push({ key,
              frame: args.frame || 0, filter: ctx.filter || 'none' });
          }
          return ready;
        };
        installed = true;
      }
      const state = r.road.state, bar = state.musicBeatFloat / 4;
      const combat = r.road.encounterSnapshot().combat;
      const newEvents = observed.events.slice(eventCursor); eventCursor = observed.events.length;
      for (const event of newEvents.filter(e => e.kind === 'combat-event')) {
        events.push(copy(event));
        if (event.type === 'takedown' && event.actorKind === 'bike') openWindow('Actual bike takedown', bar, 2500);
        if (event.type === 'takedown' && event.id === 'rig') openWindow('Actual rig defeat and wreck pass', bar, 5000);
      }
      if (combat.boss && previousHp === null) openWindow('Rig approach', bar, 2000);
      if (combat.boss && previousHp !== null && combat.boss.hp < previousHp)
        openWindow('Actual rig damage', bar, 3500);
      previousHp = combat.boss?.hp ?? null;
      const active = windows.filter(window => bar >= window.fromBar && bar < window.toBar);
      if (!active.length || state.elapsedMs + 1e-7 < nextSampleMs) return;
      // Keep a fixed capture phase within each selected window. Restart after
      // an edited-out gap, rather than accumulating the 20ms input quantization
      // into an accidental speed-up of the exported sequence.
      if (state.elapsedMs - nextSampleMs > 1000 / FPS) nextSampleMs = state.elapsedMs;
      nextSampleMs += 1000 / FPS;
      submissions = []; context.reset(); r.drawRoad(context);
      vctx.reset(); vctx.drawImage(scene, 0, 0, WIDTH, 720);
      vctx.fillStyle = '#071b27'; vctx.fillRect(0, 720, WIDTH, HEIGHT - 720);
      vctx.font = '16px Oxanium, monospace'; vctx.fillStyle = '#d7ffe6';
      vctx.fillText(`${LABEL} · ${active.map(x => x.name).join(' / ')} · bar ${bar.toFixed(2)} · silent / captured at 6 fps`, 14, 744, WIDTH - 28);
      const frame = { frame: frameEvidence.length, inputFrame, elapsedMs: round(state.elapsedMs), bar: round(bar),
        windows: active.map(window => window.name), progress: round(state.progress),
        lane: round(state.lanePos), gear: state.gear + 1, speed: round(state.speed), integrity: state.integrity,
        camera: copy(state.cameraMotion), syncCount: combat.syncCount, boss: copy(combat.boss),
        actors: copy(combat.actors), wrecks: copy(combat.wrecks), projectiles: copy(combat.projectiles),
        skills: copy(combat.skills), driverInputs: copy(driver.lastCombatPress), artSubmissions: copy(submissions) };
      frameEvidence.push(frame);
      const stillName = active.find(window => !selectedStills.has(window.name));
      if (stillName) {
        selectedStills.add(stillName.name);
        const file = `Still-${String(stills.length + 1).padStart(2, '0')}.png`;
        fs.writeFileSync(path.join(output, file), video.toBuffer('image/png'));
        stills.push({ file, frame: frame.frame, window: stillName.name, sha256: hash(path.join(output, file)) });
      }
      const pixels = vctx.getImageData(0, 0, WIDTH, HEIGHT).data;
      if (!encoder.stdin.write(Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength))) await once(encoder.stdin, 'drain');
    } });
  encoder.stdin.end(); const [exitCode] = await encoded; assert.equal(exitCode, 0, encoderErrors);
  assertClear(run.result);
  assert(frameEvidence.length > 30, 'the montage must contain played motion');
  assert(opened.has('Actual bike takedown'), 'a real bike takedown must be observed');
  assert(opened.has('Actual rig damage') && opened.has('Actual rig defeat and wreck pass'), 'earned boss damage and defeat must be observed');
  for (const [file, digest] of Object.entries(sourceHashes)) assert.equal(hash(path.join(root, file)), digest, `Source changed during capture: ${file}`);
  for (const asset of Object.values(assets)) assert.equal(hash(path.join(root, asset.path)), asset.sha256, `Artwork changed during capture: ${asset.path}`);
  const captured = frameEvidence.filter(frame => frame.windows.includes('Actual rig defeat and wreck pass'));
  const wreckPassed = captured.some(frame => frame.wrecks.some(wreck => wreck.id === 'rig' && wreck.at < frame.progress));
  const report = { kind: 'native-input-driven-edited-combat-control-study', label: LABEL,
    recordedAtUtc: new Date().toISOString(), sourceFramesPerSecond: FPS, width: WIDTH, height: HEIGHT,
    frames: frameEvidence.length, durationSeconds: frameEvidence.length / FPS, windows,
    audio: 'silent; production audio clock is a controlled host; no listening acceptance',
    policy: 'One complete production Campaign + ActionInput + shared RAF combat race. Native images replace network delivery only. No road position, health, immunity, skills, sync, captures, score, enemy HP or camera state is assigned. Selected noncontiguous windows are edited together without interpolation; fixed six-fps samples snap to the real 20ms input-update clock, with each captured timestamp recorded.',
    limitations: 'Deterministic input controller and native Canvas host. This mechanics prototype uses existing production traffic/rig art until the separately approved combat assets are installed. Six-fps sampling is a capture limit, not measured game FPS. Not a human, Makko, physical-controller, audio, comfort or device-performance acceptance.',
    sourceHashes, sourcesStable: true, assets, drawnAssets: drawn, stills, frameEvidence,
    race: { difficulty: run.result.difficulty, gear: run.result.gear, profile: run.result.profile,
      encounterVersion: run.result.encounterVersion, status: run.result.status, finalBar: run.result.finalBar,
      damageTaken: run.result.damageTaken, accurate: run.result.accurate, attempts: run.result.attempts,
      combat: run.result.combat, bossChanges: run.result.bossChanges },
    combatEvents: events, actualRigWreckPassedInCapturedFrames: wreckPassed,
    artifact: path.basename(videoPath), videoSha256: hash(videoPath), videoBytes: fs.statSync(videoPath).size,
    checkoutRevision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() };
  fs.writeFileSync(path.join(output, 'Combat-Mechanics-Preview.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ output, frames: report.frames, seconds: report.durationSeconds,
    stills: stills.length, race: report.race.status, wreckPassed, videoBytes: report.videoBytes }));
}
main().catch(error => { encoder?.stdin.destroy(); encoder?.kill(); console.error(error.stack || error); process.exitCode = 1; });
