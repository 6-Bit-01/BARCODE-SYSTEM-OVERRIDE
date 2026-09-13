// Optional native Canvas visual QA. Uses unchanged foreground and sprite sheets
// downloaded from the production manifest. This is not a live Makko capture.
const fs = require('fs'), path = require('path'), assert = require('assert');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const { createRig, load } = require('./check-level-01-boss');
const root = path.resolve(__dirname, '..'), assets = path.resolve(process.argv[2] || '');
const foregroundPath = process.argv[3];
const out = path.join(root, 'docs/source-pack/verification');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'sans-serif');
async function main() {
  assert(foregroundPath, 'Supply the asset cache and the unchanged foreground PNG.');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'sprites-manifest.json')));
  const clips = Object.assign({}, ...Object.values(manifest.characters).map(c => c.animations));
  const sheets = {};
  for (const name of ['6_bit_idle_idle', '6_bit_r__h_mode_rhmode', 'virus_idle_idle', 'corrupted_idle_idle', 'firewall_idle_idle']) {
    sheets[name] = { image: await loadImage(path.join(assets, name + '.webp')), data: JSON.parse(fs.readFileSync(path.join(assets, name + '.json'))), config: clips[name] };
  }
  const foreground = await loadImage(foregroundPath), canvas = createCanvas(1920, 1080), ctx = canvas.getContext('2d');
  const targetMatrices = [], strokeRect = ctx.strokeRect.bind(ctx);
  ctx.strokeRect = (...args) => { if (args[0] === 81 && args[1] === 153) targetMatrices.push(ctx.getTransform()); strokeRect(...args); };
  const { w, p, context, calls } = createRig();
  const store = new Map(); w.localStorage = { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) };
  w.Image = class Image {};
  w.document.getElementById = id => id === 'gameCanvas' ? canvas : null;
  w.document.createElement = () => createCanvas(64, 64);
  for (const file of ['src/game/lore-collection.js', 'src/game/combat-fx.js', 'src/engine/renderer.js', 'src/engine/parallax.js', 'src/game/level-01-stage-fx.js', 'src/game/render-coordinator.js', 'src/game/ui-manager.js']) load(context, file);
  w.renderer = new w.Renderer(canvas); w.renderer.zoomLevel = 0.9; w.renderer.postEffects = false;
  w.parallaxBackground = new w.ParallaxBackground();
  w.parallaxBackground.addLayer({ image: foreground, scrollFactorX: 0.5 }); // Below layer is concealed by the opaque existing foreground.
  w.parallaxBackground.addLayer({ image: foreground, scrollFactorX: 1 });
  function sprite(name, frame = 0) {
    const sheet = sheets[name], anchor = sheet.config.anchor;
    return { currentSprite: { getAnchorPoint: () => anchor, hasManifestAnchor: () => true, getManifestScale: () => 1 },
      isLoaded: () => true, getHitboxWorld: () => null, getCurrentAnimation: () => name,
      play(next, loop, start = frame) { if (sheets[next]) name = next; frame = start; return { get currentFrame() { return frame; }, totalFrames: 48 }; },
      update() {}, stop() {},
      draw(ctx, x, y, options = {}) {
        const s = sheets[name] || sheet, frames = Object.values(s.data.frames), f = frames[frame % frames.length].frame;
        const scale = options.scale || 1, a = s.config.anchor;
        ctx.save(); ctx.globalAlpha *= options.alpha ?? 1; ctx.translate(x, y); ctx.scale(options.flipH ? -scale : scale, scale);
        ctx.drawImage(s.image, f.x, f.y, f.w, f.h, -a.x, -a.y, f.w, f.h); ctx.restore();
      }
    };
  }
  function playerAt(x, y = 750, playing = true) {
    Object.assign(w.player, { spriteReady: true, isEntering: false, grounded: true, controlsDisabled: false, facing: 1 });
    w.player.position.x = x; w.player.position.y = y; w.player.state = playing ? 'rhythm' : 'idle';
    w.player.sprite = sprite(playing ? '6_bit_r__h_mode_rhmode' : '6_bit_idle_idle', 3);
    w.player.animationRef = { currentFrame: 3 }; w.player.velocity.x = 0; w.player.velocity.y = 0;
    w.renderer.resetFollowCamera(x);
  }
  function setup(combo = 0, x = 1820) {
    p.reset(); p.startMission(); p.state = 'encounter_2'; p.activeEncounterId = 'encounter_2'; p.spawnedEncounterIds.add(p.state);
    p.closedGateEncounterId = p.state; p.missionDefeats = 7; p.districtSignal.elapsedMs = 12000; p.districtSignal.clearedAtMs[0] = 11000;
    w.BARCODE.playerCombat.reset(); w.gameState.score = 12480; w.gameState.running = true; w.gameState.victory = false; w.gameState.gameTime = 12000;
    playerAt(x); w.rhythmSystem.show(); w.rhythmSystem.combo = combo;
    w.audioSystem.context.currentTime = 40.16 * 60 / 146;
    w.lostDataSystem.getProgress = () => ({ collected: 2, total: 3, saved: true });
    w.enemyManager.enemies = [['virus', 190], ['corrupted', 375], ['firewall', 480]].map(([type, offset]) => {
      const e = new w.Enemy(x + offset, 750, type); e.position.x = x + offset; e.position.y = 750;
      Object.assign(e, { active: true, entranceComplete: true, spriteReady: true, health: 100, _sector1MissionEnemy: true, _sector1EncounterId: p.state,
        _authoredEntranceActive: false, combatPattern: 'brace', combatPatternMs: 380, committedDirection: -1, facing: -1 });
      e.currentAnimation = type + '_idle_idle'; e.sprite = sprite(e.currentAnimation); e.animationRef = { currentFrame: 0 }; return e;
    });
    p.activeEncounterEnemies = w.enemyManager.enemies;
    w.BARCODE.stageFX.reset(p, { resume: true }); w.BARCODE.stageFX.update(16);
  }
  const frames = [];
  function capture(label, filename) {
    w.renderGame(); assert.deepStrictEqual(calls.errors, [], label + ': production drawing must complete');
    const copy = createCanvas(1920, 1080); copy.getContext('2d').drawImage(canvas, 0, 0); frames.push({ label, canvas: copy });
    if (filename) fs.writeFileSync(path.join(out, filename + '.webp'), canvas.toBuffer('image/webp'));
  }
  for (const [combo, label] of [[0, 'PULSE / DIRECT HIT'], [4, 'COMBO 5 / FORWARD WAVE'], [9, 'COMBO 10 / CHAIN DISCHARGE']]) {
    setup(combo); w.BARCODE.playerCombat.lastAttackAt = -Infinity;
    const hit = w.BARCODE.playerCombat.resolvePrimary({ now: 20000 + combo * 1000, timing: { available: true, timing: 'perfect' } }); assert(hit.ok);
    w.BARCODE.combatFX.update(95); w.renderer.applyScreenShake(25); w.BARCODE.stageFX.update(95);
    capture(label, combo === 9 ? 'impact-pass-combat' : null);
  }
  setup(0, 865); p.state = 'encounter_2'; p.activeEncounterId = null; p.spawnedEncounterIds.delete('encounter_2'); w.enemyManager.enemies = [];
  w.rhythmSystem.hide(); playerAt(865, 420, false); w.BARCODE.stageFX.update(16); assert(w.BARCODE.stageFX.inspect().ok); capture('CLIFF / ROOFTOP INSPECTION', 'impact-pass-discovery');
  playerAt(590, 750, false); w.BARCODE.stageFX.message = null; w.BARCODE.stageFX.update(16); assert(w.BARCODE.stageFX.inspect().ok); w.BARCODE.stageFX.update(1500); capture('STUDIO RAT / OUTSIDE THE PANEL');
  setup(9, 2100); w.enemyManager.enemies = []; w.renderGame(); w.BARCODE.JammerEnvironment.reveal({ position: { x: 2250, y: 750 } });
  for (let i = 0; i < 16; i++) w.BARCODE.JammerEnvironment.applyRhythmDamage({ amount: 1, timing: 'perfect', sequence: i + 1 });
  assert(w.BARCODE.JammerEnvironment.getStatus().destroyed); w.BARCODE.combatFX.update(180); w.BARCODE.stageFX.update(180); w.renderer.applyScreenShake(180);
  p.updateDistrictSignal(500); capture('JAMMER / BREAKUP AND STREET RECOVERY');
  const sheet = createCanvas(1920, 1770), sc = sheet.getContext('2d'); sc.fillStyle = '#070e1b'; sc.fillRect(0, 0, 1920, 1770);
  frames.forEach(({ label, canvas }, i) => {
    const x = i % 2 * 960, y = Math.floor(i / 2) * 590;
    sc.fillStyle = '#e6ecf2'; sc.font = 'bold 19px monospace'; sc.fillText(label, x + 20, y + 32);
    sc.drawImage(canvas, x, y + 46, 960, 540);
  });
  fs.writeFileSync(path.join(out, 'impact-pass-contact-sheet.webp'), sheet.toBuffer('image/webp'));
  assert(targetMatrices.length >= 3);
  assert(targetMatrices.every(m => m.a === 1 && m.d === 1 && m.e === 0 && m.f === 0), 'actual render restores world shake/zoom before the fixed timing target');
  console.log('Six production Canvas scenes rendered using unchanged foreground/sprite assets; no drawing errors. Fixture timing and Makko sprite adapter, not live gameplay.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
