// Native Canvas review of production owners, actual sheets and generated assets.
// The image/sprite boundary is adapted; this is not a live Makko capture.
const fs = require('fs'), path = require('path'), assert = require('assert');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const { createRig, load } = require('./check-level-01-boss');
const root = path.resolve(__dirname, '..'), cache = path.resolve(process.argv[2] || '../asset-review');
const output = path.join(root, 'docs/source-pack/verification/cat-chaos-assets.webp');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'monospace');
async function installArt(w, context) {
  const images = await Promise.all(['studio-cat', 'direction-arrow', 'boss-pulse'].map(n => loadImage(path.join(root, 'assets/presentation', n + '.webp'))));
  let index = 0;
  w.Image = class Image { constructor() {
    const im = images[index++];
    Object.defineProperty(im, 'src', { set() { queueMicrotask(() => im.onload?.()); } });
    return im;
  } };
  load(context, 'src/engine/presentation-assets.js'); await Promise.resolve();
  assert.strictEqual(index, 3);
}
async function main() {
  const { w, context, p, reachReady, calls } = createRig();
  await installArt(w, context);
  for (const file of ['src/game/combat-fx.js', 'src/game/level-01-stage-fx.js', 'src/engine/jammer-indicator.js']) load(context, file);
  const canvas = createCanvas(1920, 1450), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111827'; ctx.fillRect(0, 0, 1920, 1450);
  const text = (label, x, y, size = 22) => { ctx.fillStyle = '#eef5e1'; ctx.font = `bold ${size}px monospace`; ctx.textAlign = 'left'; ctx.fillText(label, x, y); };
  text('STUDIO RATS = CATS / FOUR-FRAME WALK', 35, 45);
  for (let i = 0; i < 4; i++) { w.BARCODE.stageFX.ratAge = i * 110; w.BARCODE.stageFX.drawRat(ctx, 120 + i * 180, 180); }
  text('REUSABLE DIRECTION MARKER / GAME SIZE', 940, 45);
  for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(1040 + i * 210, 137); ctx.rotate(i * Math.PI / 2); assert(w.BARCODE.PresentationAssets.draw('directionArrow', ctx, { width: 106 })); ctx.restore(); }
  const fg = await loadImage(path.join(cache, 'FG.png'));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'sprites-manifest.json')));
  const clips = Object.assign({}, ...Object.values(manifest.characters).map(c => c.animations));
  reachReady(); p.state = 'boss_combat'; p.boss.phase = 'sweep'; p.boss.spriteReady = true; p.boss.facing = 1;
  text('BOSS / PREVIOUS OUTLINE + NEW SIZE / FEET REMAIN GROUNDED', 35, 240);
  for (const [i, short] of ['idle', 'walk', 'attack'].entries()) {
    const name = `sector_1_boss_${short}_${short}`, image = await loadImage(path.join(cache, name + '.webp'));
    const data = JSON.parse(fs.readFileSync(path.join(cache, name + '.json'))), anchor = clips[name].anchor;
    const frame = Object.values(data.frames)[10].frame;
    p.boss.x = 320 + i * 640; p.boss.state = short === 'attack' ? 'flourish' : short; p.boss.activeAnimation = name; p.boss.animationRef = { currentFrame: 10 };
    p.boss.pulses = [{ originX: p.boss.x, radius: 218, hit: false }];
    p.boss.sprite = { currentSprite: { getAnchorPoint: () => anchor, hasManifestAnchor: () => true, getManifestScale: () => 1 }, draw(c, x, y, options) {
      c.save(); c.translate(x, y); c.scale(options.scale, options.scale); c.drawImage(image, frame.x, frame.y, frame.w, frame.h, -anchor.x, -anchor.y, frame.w, frame.h); c.restore();
    } };
    ctx.save(); ctx.beginPath(); ctx.rect(i * 640, 270, 640, 485); ctx.clip();
    ctx.drawImage(fg, i * 640 - 1350, 270 - 300, 2640, 700);
    ctx.translate(0, -110);
    const bounds = p.getBossVisualBounds();
    const oldScale = bounds.frameScale / (1.08 * (short === 'walk' ? 1.06 : 1));
    ctx.strokeStyle = '#7a8598'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
    ctx.strokeRect(p.boss.x -  (short === 'walk' ? 100 : 128) * oldScale, 822 - bounds.footRow * oldScale, frame.w * oldScale, frame.h * oldScale); ctx.setLineDash([]);
    p.drawBoss(ctx); ctx.restore();
    text(`${short.toUpperCase()} / ${short === 'walk' ? '+14.48%' : '+8%'}`, i * 640 + 30, 790);
  }
  text('SAME HIT / THREE DIFFERENT EVENT SEEDS / 90 ms AFTER CONTACT', 35, 860);
  const fx = w.BARCODE.combatFX; fx.randomState = 1234567;
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.beginPath(); ctx.rect(i * 640, 900, 640, 400); ctx.clip();
    ctx.drawImage(fg, i * 640 - 1350, 420, 2640, 1000);
    fx.reset(); fx.add({ kind: 'pulse', x: 320 + i * 640, y: 1110, radius: 250, perfect: true, duration: 340 });
    fx.contact('corrupted', 410 + i * 640, 1090, 1, true, true); fx.update(90);
    w.gameCamera.centerX = 960; fx.draw(ctx); ctx.restore();
  }
  text('PULSE / FOUR TEXTURE FRAMES / 64 x 56 HAZARD + STEADY LEADING EDGE', 35, 1350, 19);
  for (let i = 0; i < 4; i++) w.BARCODE.PresentationAssets.draw('bossPulse', ctx, { x: 1050 + i * 200, y: 1420, width: 64, height: 56, frame: i });
  assert.deepStrictEqual(calls.errors, []);
  fs.writeFileSync(output, canvas.toBuffer('image/webp')); console.log(output);
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { installArt };
