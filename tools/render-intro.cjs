// Optional visual QA using the production CutsceneSystem -> IntroSequence path.
// Native Canvas is a local review tool, not a game/CI dependency.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const { openingRig } = require('./check-intro');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 'sans-serif');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 'sans-serif');
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
  scene.introCanvas = canvas; scene.introContext = ctx; scene.transcriptElement = {}; scene.isActive = true;
  const sheet = createCanvas(1920, 2160), sheetCtx = sheet.getContext('2d');
  for (let index = 0; index < w.BARCODE.IntroSequence.panels.length; index++) {
    labels.length = 0; scene.currentImageIndex = index; scene.showNextImage();
    scene.currentImageStartTime -= 1000; scene.drawCurrentPanel();
    const layouts = w.BARCODE.IntroSequence.getDialogueLayouts(ctx, index);
    for (const box of layouts) {
      assert(box.x >= 48 && box.y >= 140 && box.x + box.w <= 1872 && box.y + box.h <= 968, `Scene ${index + 1}: balloon outside image`);
      for (const [i, line] of box.lines.entries()) {
        const label = labels.find(label => label.line === line && label.x === box.x + 30 && label.y === box.y + 45 + i * 36);
        assert(label && label.x + label.width <= box.x + box.w - 28 && label.y + 36 <= box.y + box.h - 24, `Balloon text bounds: ${line}`);
      }
    }
    const [a, b] = layouts;
    assert(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `Scene ${index + 1}: overlapping dialogue`);
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
  // Render every rewritten tutorial line with real metrics, then collect a
  // small typography strip. No fixture world is passed off as a live capture.
  const { w: tutorialWindow } = openingRig({ realTutorial: true });
  const tutorial = tutorialWindow.tutorialSystem; tutorial.startTutorial();
  const comms = createCanvas(1920, 1320), commsCtx = comms.getContext('2d');
  let row = 0;
  for (let chapter = 0; chapter <= 4; chapter++) {
    tutorial.startChapter(chapter);
    for (let index = 0; index < tutorial.dialogue.length; index++) {
      labels.length = 0; ctx.fillStyle = '#090b15'; ctx.fillRect(0, 0, 1920, 1080);
      tutorial.currentDialogue = index;
      tutorial.currentText = tutorial.targetText = tutorial.dialogue[index].text;
      tutorial.characterIndex = tutorial.targetText.length; tutorial.update(0);
      tutorial.draw(ctx);
      const body = labels.filter(label => label.x === 56);
      assert(body.length > 0 && body.every(label => label.x + label.width <= 1836 && label.y <= 984), 'Tutorial copy clears its prompt and frame');
      if ((chapter === 0 && index < 2) || (chapter === 2 && index === 1) ||
          (chapter === 3 && index === 1) || (chapter === 4 && (index === 3 || index === tutorial.dialogue.length - 1))) {
        const snapshot = await loadImage(canvas.toBuffer('image/png'));
        commsCtx.drawImage(snapshot, 0, 860, 1920, 220, 0, row++ * 220, 1920, 220);
      }
    }
  }
  fs.writeFileSync(path.join(out, 'intro-tutorial-comms.webp'), comms.toBuffer('image/webp'));
  console.log('Eight scene-placed comic pages, hold progress and reduced-effects caption rendered; actual balloon, text and page bounds passed. Native Canvas diagnostics, not Makko captures.');
  console.log('All five tutorial chapters rendered with actual copy and measured text; comms strip saved.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
