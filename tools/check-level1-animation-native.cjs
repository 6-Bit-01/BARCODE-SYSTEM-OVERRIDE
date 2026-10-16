#!/usr/bin/env node
// Production Level 1 update/draw owners with decoded production RGBA artwork.
// Makko's public sprite boundary and native Canvas replace browser transport;
// this is not hosted Makko, controller, audio or device-performance acceptance.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const crypto = require('node:crypto'), { spawn } = require('node:child_process'), { once } = require('node:events');
const root = path.resolve(__dirname, '..');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || root, root]
}));
const { createRig, load } = require('./check-level-01-boss');
const { createSprite } = require('./makko-animation-fixture');
const { installArt } = require('./render-cat-chaos.cjs');
const out = process.argv[2] && path.resolve(process.argv[2]);
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const clone = value => JSON.parse(JSON.stringify(value));
const metrics = { scope: 'Production native Canvas / exact bundled RGBA cels / public Makko animation boundary',
  limits: 'Adapted image/sprite boundary; no hosted Makko, browser networking, audio, physical controller or device FPS claim.',
  modelClips: [], owners: [], entrance: [], sourceHashes: {} };
const canvas = createCanvas(640, 420), ctx = canvas.getContext('2d');
const review = createCanvas(1600, 5040), reviewCtx = review.getContext('2d');
reviewCtx.fillStyle = '#172435'; reviewCtx.fillRect(0, 0, review.width, review.height);
GlobalFonts.registerFromPath(path.join(root, 'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'), 'Oxanium');
let reviewIndex = 0;
function raster(draw, cx = 320, cy = 420) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, 640, 420);
  ctx.save(); ctx.translate(320 - cx, 370 - cy); draw(ctx); ctx.restore();
  return Buffer.from(ctx.getImageData(0, 0, 640, 420).data);
}
function change(a, b) {
  let count = 0, minX = 640, minY = 420, maxX = -1, maxY = -1;
  for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2] || a[i+3] !== b[i+3]) {
    const p = i / 4, x = p % 640, y = Math.floor(p / 640); count++;
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return { changedPixels: count, bounds: count ? { x: minX, y: minY, width: maxX-minX+1, height: maxY-minY+1 } : null };
}
function panel(label) {
  if (!out || reviewIndex >= 56) return;
  const x = reviewIndex % 4 * 400, y = Math.floor(reviewIndex / 4) * 360; reviewIndex++;
  reviewCtx.drawImage(canvas, 0, 0, 640, 420, x, y + 32, 400, 263);
  reviewCtx.fillStyle = '#efe8d4'; reviewCtx.font = '16px Oxanium'; reviewCtx.textAlign = 'left';
  reviewCtx.fillText(label, x + 12, y + 22, 380);
}
function changing(label, draw, advance, cx, cy, snapshot) {
  const beforeState = snapshot?.(), a = raster(draw, cx, cy);
  const repeat = raster(draw, cx, cy);
  assert(a.equals(repeat), label + ': repeated draw does not advance pixels');
  if (snapshot) assert.deepEqual(snapshot(), beforeState, label + ': draw preserves simulation state');
  advance(); const b = raster(draw, cx, cy), delta = change(a, b);
  assert(delta.changedPixels >= 16, label + ': live production draw has visible local pixel variation (' + delta.changedPixels + ' changed pixels)');
  const afterState = snapshot?.(); assert(b.equals(raster(draw, cx, cy)), label + ': after-frame repeat is pure');
  if (snapshot) assert.deepEqual(snapshot(), afterState, label + ': after-frame draw preserves simulation state');
  metrics.owners.push({ label, ...delta }); panel(label); return delta;
}
function actorState(actor) {
  return { position: clone(actor.position), velocity: clone(actor.velocity), state: actor.state,
    frame: actor.animationRef?.currentFrame, animation: actor.currentAnimation,
    time: actor.animationTime, elapsed: actor.sprite?.currentSprite?.timeAccumulator };
}
async function main() {
  const rig = createRig(), { w, p, context, calls } = rig;
  await installArt(w, context);
  const clips = {};
  for (const file of fs.readdirSync(path.join(root, 'assets/sprites-v3/prepared')).filter(f => f.endsWith('.json'))) {
    const name = file.slice(0, -5), meta = JSON.parse(fs.readFileSync(path.join(root, 'assets/sprites-v3/prepared', file)));
    const image = await loadImage(path.join(root, 'assets/sprites-v3/prepared', name + '.webp'));
    const frames = Object.values(meta.frames), distinct = new Set();
    const cel = createCanvas(frames[0].frame.w, frames[0].frame.h), cc = cel.getContext('2d');
    for (const entry of frames) {
      const f = entry.frame; cc.clearRect(0, 0, cel.width, cel.height); cc.drawImage(image, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
      distinct.add(hash(cc.getImageData(0, 0, cel.width, cel.height).data));
    }
    assert(distinct.size > 1, name + ': native source cels contain real animation');
    clips[name] = { meta, image, frames };
    metrics.modelClips.push({ clip: name, frames: frames.length, distinctRasterCels: distinct.size });
  }
  assert.equal(metrics.modelClips.length, 13, 'all thirteen prepared model clips covered');
  const makeSprite = () => {
    const s = createSprite(Object.fromEntries(Object.entries(clips).map(([name, c]) => [name, c.frames.length]))), play = s.play;
    s.isLoaded = () => true; s.getAvailableAnimations = () => Object.keys(clips); s.getHitboxWorld = () => null;
    s.play = function(name, ...args) {
      const ref = play.call(s, name, ...args), c = clips[name], sheet = s.currentSprite;
      sheet.metadata.frames = Object.fromEntries(c.frames.map((f, i) => [String(i), f]));
      const a = c.meta.meta.anchor || { x: c.frames[0].frame.w / 2, y: c.frames[0].frame.h };
      sheet.getAnchorPoint = () => a; sheet.hasManifestAnchor = () => true; sheet.getManifestScale = () => 1;
      return ref;
    };
    s.draw = (c, x, y, options = {}) => {
      const data = clips[s.getCurrentAnimation()]; if (!data) return;
      const f = data.frames[s.currentSprite.currentFrame].frame, a = s.currentSprite.getAnchorPoint(), scale = options.scale ?? 1;
      c.save(); c.globalAlpha *= options.alpha ?? 1; c.translate(x, y); c.scale(options.flipH ? -scale : scale, scale);
      c.drawImage(data.image, f.x, f.y, f.w, f.h, -a.x, -a.y, f.w, f.h); c.restore();
    }; return s;
  };
  const spriteRegistry = new Map();
  w.MakkoEngine.sprite = id => { const sprite = makeSprite(); spriteRegistry.set(id, sprite); return sprite; };
  w.player.sprite = makeSprite(); w.player.spriteReady = true;
  w.BARCODE.Preferences = { values: { reducedMotion: false, flashes: true } };
  for (const file of ['src/game/combat-fx.js', 'src/game/level-01-stage-fx.js', 'src/engine/traffic-sheets.js', 'src/engine/spaceships.js']) load(context, file);
  const fx = w.BARCODE.combatFX, stage = w.BARCODE.stageFX;
  w.renderer.zoomLevel = 1; w.renderer.getFollowCameraX = x => x; w.gameCamera = { centerX: 960, y: 0 };
  w.rhythmSystem.hideRhythmMode(); w.player.isEntering = false; w.player.health = w.player.maxHealth;

  // The actual entrance update owns both travel and the walking clip. No
  // translated fake actor or draw-driven motion is used for this review.
  w.player.startEntranceAnimation({ targetX: 200 });
  const entranceCanvas = createCanvas(1920, 1080), ec = entranceCanvas.getContext('2d');
  const times = [0, 200, 450, 750, 1000, 1065], draws = [];
  let previous = 0, previousX = -Infinity;
  for (const ms of times) {
    w.player.update(ms - previous, true); previous = ms;
    assert(w.player.position.x >= previousX, 'entrance moves monotonically from the left edge'); previousX = w.player.position.x;
    assert.equal(w.player.position.y + 72, 856, 'entrance uses canonical ground feet');
    assert.equal(w.player.grounded, true, 'entrance remains on the street');
    const before = actorState(w.player); ec.clearRect(0, 0, 1920, 1080); w.player.drawSprite(ec);
    assert.deepEqual(actorState(w.player), before, 'entrance draw is simulation-pure');
    const pixels = ec.getImageData(0, 0, 1920, 1080).data; let visible = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) visible++;
    if (ms === 0) assert.equal(visible, 0, 'entire first walk cel begins outside the left viewport');
    if (ms >= 450) assert(visible > 1000, 'character walks visibly into screen');
    metrics.entrance.push({ ms, x: w.player.position.x, footY: 856, frame: w.player.animationRef.currentFrame, visiblePixels: visible });
    if (out) { draws.push(entranceCanvas.toBuffer('image/png')); fs.writeFileSync(path.join(out, 'entrance-' + ms + '.png'), draws.at(-1)); }
  }
  assert.equal(w.player.position.x, 200, 'entrance lands at the original playable X');
  assert.equal(w.player.isEntering, false); assert.equal(w.player.controlsDisabled, false); assert.equal(w.player.state, 'idle');
  w.player.startEntranceAnimation({ targetX: 200 }); w.player.update(200, true);
  const heldEntrance = actorState(w.player); w.isPaused = true; w.updateGame(500);
  assert.deepEqual(actorState(w.player), heldEntrance, 'pause freezes entrance travel and gait'); w.isPaused = false;
  w.player.cancelEntranceAnimation(); w.player.position.x = 960;
  for (const state of ['idle', 'walk', 'rhythm']) {
    w.player.state = state; w.player.velocity.x = state === 'walk' ? w.player.speed : 0; w.player.playAnimation(state);
    changing('6 Bit ' + state, c => w.player.drawSprite(c), () => w.player.updateSpriteAnimation(460), 960, 856, () => actorState(w.player));
    const a = w.player.getVisualAnchor(); assert(Math.abs(a.visibleFootY - 856) < 1e-6 && Math.abs(a.visibleAnchorX - 960) < 1e-6, '6 Bit canonical native anchors preserved');
  }
  assert(w.player.getAnimationPlaybackRate('rhythm') > w.player.getAnimationPlaybackRate('idle'), 'rhythm gestures have a faster cadence than neutral breathing');
  const enemies = [];
  for (const [type, state, velocity] of [['virus','idle',0], ['corrupted','idle',0], ['corrupted','walk',155], ['firewall','idle',0], ['firewall','walk',85]]) {
    const e = new w.Enemy(960, 784, type); e.position.x = 960; e.position.y = 784;
    e.sprite = makeSprite(); e.spriteReady = true; e.entranceComplete = true; e.velocity.x = velocity; e.playAnimation(state);
    changing(type + ' ' + state, c => e.drawSprite(c), () => { e.animationTime += 460; e.updateSpritePlayback(460); }, 960, 856, () => actorState(e)); enemies.push(e);
  }
  assert(enemies[0].getAnimationPlaybackRate() > enemies[3].getAnimationPlaybackRate(), 'virus signal changes faster than the heavy Firewall neutral stance');
  p.boss = { x: 960, y: 784, active: true, state: 'idle', sprite: makeSprite(), spriteReady: true, activeAnimation: null, facing: 1 };
  p.state = 'boss_ready'; p.setBossAnimation('sector_1_boss_idle_idle', true);
  changing('boss live neutral', c => p.drawBoss(c), () => p.updateBossSprite(460), 960, 856, () => ({ x: p.boss.x, y: p.boss.y, frame: p.boss.animationRef.currentFrame }));
  const jammer = w.BARCODE.JammerEnvironment;
  jammer.reset(); jammer.initialize({ position: { x: 960, y: 784 } }); jammer.reveal();
  changing('Jammer full native clip', c => jammer.draw(c), () => jammer.update(550), 960, 856, () => clone(jammer.getStatus()));
  const sampled = new Set(), jammerSprite = spriteRegistry.get('broadcast_jammer_broadcastjammer');
  for (let i = 0; i < 48; i++) { jammer.update(83 / .72); sampled.add(jammerSprite.currentSprite.currentFrame); }
  assert.equal(sampled.size, 48, 'real Jammer owner visits all 48 native cels'); metrics.jammerFramesSampled = sampled.size;
  const drone = new w.RooftopDrone(960, 680, { x: 800, y: 760, w: 320 });
  drone.dronePhase = 'warning'; drone.dronePhaseMs = 200; drone.animationTime = 0;
  changing('drone held warning / live jets', c => drone.draw(c), () => drone.updateFlight(190, null, 190), 960, 750,
    () => ({ phase: drone.dronePhase, phaseMs: drone.dronePhaseMs, time: drone.animationTime, x: drone.position.x, y: drone.position.y }));
  assert.equal(drone.dronePhase, 'warning', 'animated rotor/jet does not change the held combat phase');

  // The emotional sheet remains a state selector. Animation must change
  // pixels while retaining each selected expression and the fixed HUD clip.
  const hudCases = [ ['calm', 3, null, false, 0], ['hurt', 3, 'hurt', false, 0], ['combo', 3, null, true, 5],
    ['combat', 3, null, true, 0], ['low health', 1, null, false, 0], ['relief', 3, 'relief', false, 0] ];
  for (const [i, [label, health, reaction, active, combo]] of hudCases.entries()) {
    const player = { health, maxHealth: 3, hudReaction: reaction && { kind: reaction } }, rhythm = { isActive: () => active, combo };
    w.gameState.gameTime = 0; const frame = w.BARCODE.ComicHUD.portraitFrame(player, rhythm); assert.equal(frame, i);
    const draw = c => { c.save(); c.translate(250, 200); w.BARCODE.ComicHUD.basic(c, { player, rhythm, progress: { collected: 0, total: 3 }, score: 0 }); c.restore(); };
    const delta = changing('HUD ' + label, draw, () => { w.gameState.gameTime = 700; }, 320, 420);
    assert.equal(w.BARCODE.ComicHUD.portraitFrame(player, rhythm), frame, 'motion preserves selected HUD emotion');
    assert(delta.bounds.width < 145 && delta.bounds.height < 160, 'motion stays in the fixed HUD portrait region');
  }
  const calm = { health: 3, maxHealth: 3 }, quiet = { isActive: () => false, combo: 0 };
  w.gameState.gameTime = 4140; assert(w.BARCODE.ComicHUD.portraitMotion(calm, quiet).blink > .9);
  raster(c => w.BARCODE.ComicHUD.basic(c, { player: calm, rhythm: quiet, progress: {}, score: 0 }), 320, 420); panel('HUD neutral blink (authored eye crop)');

  loadTraffic: {
    w.SpaceShipSystem.prototype.loadShipImages = function() {};
    const traffic = new w.SpaceShipSystem(); traffic.resetRuntime(); traffic.spawnShip = () => {};
    for (let type = 0; type < 3; type++) {
      traffic.shipImages[type] = await loadImage(path.join(root, 'assets/traffic/ship-' + (type + 1) + '.webp'));
      traffic.imagesLoaded[type] = true; traffic.shipSheets[type] = w.BARCODE.trafficSheets[type];
    }
    const reached = [];
    for (let type = 0; type < 3; type++) {
      const ship = { shipType: type, x: 960, y: 500, size: 320, depth: .8, alpha: 1, bobOffset: 0, bobAmount: 0, animationElapsedMs: 0, speed: 0, rotation: 0, foreground: false };
      traffic.ships = [ship]; traffic.foregroundShips = [];
      changing('flying traffic ' + (type + 1), c => traffic.drawShip(c, ship), () => traffic.update(1000), 960, 520,
        () => ({ elapsed: traffic.elapsedMs, ship: clone(ship) }));
      reached.push(traffic.getAnimationFrame(ship));
    }
    assert.equal(new Set(reached).size, 3, 'three ship types actually reach distinct native frames on the same delta'); metrics.trafficFramesAfter1s = reached;
    w.spaceShipSystem = traffic;
  }

  // Individually review permanent hardware at its actual physical location.
  // Full construction variants and powered/off states may never be cycled.
  p.boss = null; p.missionStarted = true; p.state = 'encounters'; w.enemyManager.enemies = [];
  p.resetSignalLift(); p.resetRepairs(); fx.timeMs = 0; stage.reset(p); stage.timeMs = 0;
  const originalDraw = w.BARCODE.PresentationAssets.draw, drawsSeen = [];
  w.BARCODE.PresentationAssets = { ...w.BARCODE.PresentationAssets, draw(key, c, options) { drawsSeen.push({ key, frame: options.frame || 0 }); return originalDraw(key, c, options); } };
  const props = w.Sector1Progression.TRAVERSAL_PROPS;
  for (const prop of props) {
    w.gameCamera.centerX = prop.x; const start = drawsSeen.length;
    changing('hardware ' + prop.id, c => prop.asset ? p.drawTraversalProps(c, true) : p.drawPlatformHardware(c, prop),
      () => fx.update(470), prop.x + prop.w / 2, prop.y + prop.h / 2,
      () => ({ prop: clone(prop), lift: clone(p.signalLift), repairs: clone(p.repairs), time: fx.timeMs }));
    const selections = drawsSeen.slice(start).filter(d => /platform(Facades|Side)/.test(d.key));
    if (selections.length) assert.equal(new Set(selections.map(d => d.key + ':' + d.frame)).size, 1, 'construction variant stays fixed: ' + prop.id);
  }
  w.gameCamera.centerX = p.signalLift.x;
  changing('lift standby hardware', c => p.drawSignalLift(c), () => fx.update(470), p.signalLift.x + p.signalLift.w / 2, p.signalLift.y - 140, () => ({ lift: clone(p.signalLift), time: fx.timeMs }));
  for (const gate of w.Sector1Progression.ENCOUNTER_GATES) for (const cleared of [false, true]) {
    const box = p.getGateHardwareLayout(gate), start = drawsSeen.length;
    const x = box.left + box.width / 2, y = box.top + box.height, scale = Math.min(1, 350 / box.height);
    // Tall rail assemblies span several screens vertically. This overview
    // fits the complete production draw instead of cropping out its tracer.
    changing(gate.id + (cleared ? ' cleared diagnostics' : ' powered diagnostics'), c => {
      c.save(); c.translate(x, y); c.scale(scale, scale); c.translate(-x, -y); p.drawBarrierHardware(c, gate, cleared, cleared ? 1 : 0); c.restore();
    }, () => fx.update(470), x, y, () => ({ geometry: clone(p.getGateGeometry(gate)), time: fx.timeMs }));
    assert.equal(new Set(drawsSeen.slice(start).filter(d => d.key === box.key).map(d => d.frame)).size, 1, 'gate power-state art does not cycle');
  }
  w.gameCamera.centerX = 2200;
  changing('sky-cache receiver', c => p.drawSkyCaches(c), () => fx.update(470), 1700, -169, () => ({ collected: [...(p.skyCaches || [])], time: fx.timeMs }));
  changing('Signal Amp pickup', c => p.drawSignalAmp(c), () => fx.update(470), w.Sector1Progression.SIGNAL_AMP.x, w.Sector1Progression.SIGNAL_AMP.y, () => ({ collected: p.signalAmpCollected, time: fx.timeMs }));
  const repair = p.repairs[0]; w.gameCamera.centerX = repair.x;
  changing('repair pickup', c => p.drawRepairRoute(c), () => p.updateRepairs(470), repair.x, repair.y, () => ({ repairs: clone(p.repairs), time: p.repairTimeMs }));
  for (const detail of stage.details) {
    w.gameCamera.centerX = detail.x;
    changing(detail.id, c => stage.drawWorld(c), () => stage.update(detail.id.includes('studio-rat') ? 4700 : 470), detail.x, detail.y,
      () => ({ time: stage.timeMs, details: clone(stage.details), ratAge: stage.ratAge, consumed: stage.ratRunConsumed }));
  }
  stage.ratAge = 0;
  changing('cat four-frame run', c => stage.drawRat(c, 960, 856), () => { stage.ratAge += 230; }, 960, 856,
    () => ({ age: stage.ratAge, time: stage.timeMs })); stage.ratAge = null;
  const detail = stage.details[0]; w.gameCamera.centerX = detail.x;
  stage.startRatEvent(detail);
  const catFrames = new Set(), catStart = drawsSeen.length;
  changing('cat authored pounce / drag', c => stage.drawRatEvent(c), () => stage.update(1250), detail.x + 50, detail.y,
    () => ({ time: stage.timeMs, age: stage.ratAge, event: clone(stage.ratEvent) }));
  for (const age of [0,270,540,810,1050,1200,1350,1500,1650,1820,1990,2160]) {
    // Prepared timeline samples are explicitly staged for state coverage;
    // the preceding comparison exercises its actual update owner.
    stage.ratAge = age; raster(c => stage.drawRatEvent(c), detail.x + 50, detail.y);
  }
  drawsSeen.slice(catStart).filter(d => d.key === 'studioCatEvent').forEach(d => catFrames.add(d.frame));
  assert.equal(catFrames.size, 12, 'all twelve authored cat event poses reach the production draw'); metrics.catEventFrames = [...catFrames].sort((a,b) => a-b);
  stage.ratAge = null; stage.ratEvent = null;

  load(context, 'src/engine/parallax.js');
  w.document.createElement = () => createCanvas(128, 128);
  const background = new w.ParallaxBackground(), city = await loadImage(path.join(root, 'assets/world-v3/buildings.webp'));
  background.layers = [{}, { imgElement: city }];
  changing('distant skyline lights / steam', c => background.drawSkylineLife(c, 0, 0, 2048, 740),
    () => fx.update(1200), 1024, 520, () => ({ cameraX: background.cameraX, cameraY: background.cameraY, time: fx.timeMs }));
  changing('city signs / rain / spills / vents', c => {
    c.drawImage(city, 0, 0, 1279, 462); background.drawAtmosphere(c, background.layers[1], 0, 0, 1279, 462);
  }, () => fx.update(1200), 640, 280, () => ({ cameraX: background.cameraX, cameraY: background.cameraY, time: fx.timeMs }));

  const clockState = () => ({ game: w.gameState.gameTime, player: actorState(w.player), combat: fx.timeMs, stage: stage.timeMs,
    repairs: p.repairTimeMs, lift: clone(p.signalLift), jammer: clone(jammer.getStatus()), traffic: w.spaceShipSystem.elapsedMs });
  const clockBefore = clockState(); w.isPaused = true; w.updateGame(900); assert.deepEqual(clockState(), clockBefore, 'shared pause freezes every sampled presentation clock');
  w.isPaused = false;
  for (const preferences of [{ reducedMotion: true, flashes: true }, { reducedMotion: false, flashes: false }]) {
    w.BARCODE.Preferences.values = preferences;
    assert.deepEqual(clone(w.BARCODE.ComicHUD.portraitMotion(calm, quiet)), { x: 0, angle: 0, scaleY: 1, blink: 0 });
    const before = raster(c => jammer.draw(c), 960, 856); jammer.update(600);
    assert(before.equals(raster(c => jammer.draw(c), 960, 856)), 'reduced-motion/flashes-off Jammer remains steady');
    assert.equal(p.getSceneryAnimationTime(), 0, 'optional scenery motion respects comfort setting');
    const cityBefore = raster(c => background.drawAtmosphere(c, background.layers[1], 0, 0, 1279, 462), 640, 280);
    fx.update(600);
    assert(cityBefore.equals(raster(c => background.drawAtmosphere(c, background.layers[1], 0, 0, 1279, 462), 640, 280)), 'quiet background stays fixed on its existing clock');
  }
  assert.deepEqual(calls.errors, [], 'production draw/update owners reported no errors');
  metrics.passed = true;
  for (const file of ['src/game/player.js','src/game/enemies.js','src/game/jammer-environment.js','src/game/comic-hud.js',
    'src/game/sector1-progression.js','src/game/level-01-stage-fx.js','src/game/combat-fx.js','src/engine/spaceships.js','src/engine/parallax.js']) {
    if (fs.existsSync(path.join(root, file))) metrics.sourceHashes[file] = hash(fs.readFileSync(path.join(root, file)));
  }
  if (out) {
    fs.writeFileSync(path.join(out, 'animation-contact-sheet.webp'), review.toBuffer('image/webp', 90));
    for (let page = 0; page < Math.ceil(reviewIndex / 20); page++) {
      const sheet = createCanvas(1600, 1800), sc = sheet.getContext('2d');
      sc.drawImage(review, 0, page * 1800, 1600, 1800, 0, 0, 1600, 1800);
      fs.writeFileSync(path.join(out, 'animation-contact-sheet-' + (page + 1) + '.webp'), sheet.toBuffer('image/webp', 90));
    }
    fs.writeFileSync(path.join(out, 'animation-native-evidence.json'), JSON.stringify(metrics, null, 2) + '\n');
    // A short silent review uses the exact entrance owner and cels over the
    // actual first-screen city art. No hosted-play/audio claim is made.
    const far = await loadImage(path.join(root, 'assets/world-v3/far-background.webp'));
    const preview = createCanvas(960, 540), pc = preview.getContext('2d');
    const movie = spawn('ffmpeg', ['-loglevel','error','-y','-f','image2pipe','-framerate','24','-vcodec','mjpeg','-i','pipe:0','-an',
      '-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out, 'left-edge-walk-in.mp4')], { stdio: ['pipe','ignore','pipe'] });
    let errors = ''; movie.stderr.on('data', bytes => errors += bytes);
    w.BARCODE.Preferences.values = { reducedMotion: false, flashes: true }; w.player.startEntranceAnimation({ targetX: 200 });
    for (let i = 0; i < 48; i++) {
      if (i) w.player.update(1000 / 24, true);
      ec.clearRect(0, 0, 1920, 1080); ec.drawImage(far, 0, 0, 1920, 1080); ec.drawImage(city, -152, -550, 4400, 1589);
      w.player.drawSprite(ec); pc.drawImage(entranceCanvas, 0, 0, 960, 540);
      if (!movie.stdin.write(preview.toBuffer('image/jpeg', 88))) await once(movie.stdin, 'drain');
    }
    movie.stdin.end(); const [exit] = await once(movie, 'close'); assert.equal(exit, 0, 'native entrance preview: ' + errors);
  }
  console.log('Level 1 native animation: 13 complete prepared clips, genuine left-edge walk-in, differentiated actors/HUD/traffic, stable animated prop variants, pause and draw purity passed.');
}
if (out) fs.mkdirSync(out, { recursive: true });
main().catch(error => {
  if (out) {
    fs.writeFileSync(path.join(out, 'animation-native-progress.json'), JSON.stringify({ passed: false, error: error.message, ...metrics }, null, 2) + '\n');
    fs.writeFileSync(path.join(out, 'animation-contact-progress.webp'), review.toBuffer('image/webp', 90));
  }
  console.error(error); process.exitCode = 1;
});
