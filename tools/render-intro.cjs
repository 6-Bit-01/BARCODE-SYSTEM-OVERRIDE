// Optional visual QA using the production CutsceneSystem -> IntroSequence path.
// Native Canvas is a local review tool, not a game/CI dependency.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const { openingRig } = require('./check-intro');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'monospace');
async function main() {
  const root = path.resolve(__dirname, '..');
  const { w, scene } = openingRig();
  for (const item of scene.cutsceneImages) {
    const file = path.join(root, item.url);
    assert(fs.existsSync(file), `Bundled opening art is missing: ${item.url}`);
    item.element = await loadImage(file); item.loaded = true;
  }
  const out = path.resolve(__dirname, '../docs/source-pack/verification'); fs.mkdirSync(out, { recursive: true });
  const canvas = createCanvas(1920, 1080), raw = canvas.getContext('2d'), labels = [];
  const ctx = new Proxy(raw, {
    get(target, key) {
      if (key === 'fillText') return (line, x, y) => {
        const width = target.measureText(line).width;
        assert(x >= 0 && x + width <= 1920 && y >= 0 && y <= 1056, `Page bounds: ${line}`);
        labels.push({ line, x, y, width }); target.fillText(line, x, y);
      };
      const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, key, value) { Reflect.set(target, key, value, target); return true; }
  });
  scene.introCanvas = { getContext: () => ctx }; scene.transcriptElement = {}; scene.isActive = true;
  const sheet = createCanvas(1920, 2160), sheetCtx = sheet.getContext('2d');
  for (let index = 0; index < w.BARCODE.IntroSequence.panels.length; index++) {
    labels.length = 0; scene.currentImageIndex = index; scene.showNextImage();
    scene.currentImageStartTime -= 1000; scene.drawCurrentPanel();
    assert(labels.filter(label => label.y >= 804 && label.y <= 936).every(label => label.y <= 876 && label.x + label.width <= (label.x < 960 ? 916 : 1800)), 'Dialogue must fit its own panel');
    fs.writeFileSync(path.join(out, `intro-${String(index + 1).padStart(2, '0')}.webp`), canvas.toBuffer('image/webp'));
    // Freeze each page; some native backends defer canvas-to-canvas copies.
    const snapshot = await loadImage(canvas.toBuffer('image/png'));
    sheetCtx.drawImage(snapshot, index % 2 * 960, Math.floor(index / 2) * 540, 960, 540);
  }
  fs.writeFileSync(path.join(out, 'intro-contact.webp'), sheet.toBuffer('image/webp'));
  scene.currentImageIndex = 6; scene.startSkipHold('keyboard'); scene.skipHoldProgress = 0.6;
  scene.drawCurrentPanel(); fs.writeFileSync(path.join(out, 'intro-skip.webp'), canvas.toBuffer('image/webp'));
  w.BARCODE_RENDER_QUALITY = { flashes: false }; scene.inspectCaption(); scene.drawCurrentPanel();
  fs.writeFileSync(path.join(out, 'intro-reduced-effects.webp'), canvas.toBuffer('image/webp'));
  console.log('Eight actual intro pages, hold progress and reduced-effects caption rendered; page/dialogue bounds passed. Native Canvas diagnostics, not Makko captures.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
