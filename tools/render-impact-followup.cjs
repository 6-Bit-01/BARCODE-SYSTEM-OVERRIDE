// Optional native Canvas UI diagnostic; production UI and clocks, explicit host
// stubs. No game dependency and no claim of Makko playback or audio verification.
const fs = require('fs'), path = require('path'), assert = require('assert');
const { createCanvas, GlobalFonts } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]
}));
const { createRig, load } = require('./check-level-01-boss');
const root = path.resolve(__dirname, '..');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'monospace');
const { w, p, context, calls, reachReady } = createRig();
load(context, 'src/game/ui-manager.js');
load(context, 'src/game/hacking.js');
w.hackingSystem = new w.HackingSystem();
const canvas = createCanvas(1920, 1080), ctx = canvas.getContext('2d');
const sheet = createCanvas(1280, 1640), sc = sheet.getContext('2d');
sc.fillStyle = '#081321'; sc.fillRect(0, 0, sheet.width, sheet.height);
function label(text, x, y) {
  sc.fillStyle = '#eee6d4'; sc.font = 'bold 20px monospace'; sc.fillText(text, x, y);
}
function draw() {
  ctx.resetTransform(); ctx.fillStyle = '#081321'; ctx.fillRect(0, 0, 1920, 1080);
  w.drawGameUI(ctx);
}
w.player.health = 2;
w.hackingSystem.resultFx = { outcome: 'success', elapsedMs: 900 };
draw();
label('REPAIR / HEALTH BAR AT NATIVE SIZE', 30, 30);
sc.drawImage(canvas, 0, 0, 500, 300, 10, 45, 500, 300);
label('Packets land inside the health fill.', 555, 104);
label('Highlight follows the bar edges.', 555, 139);
label('Production UI diagnostic; host stubs.', 555, 206);
w.hackingSystem.reset();
reachReady(); p.beginBossCombat();
w.gameState.score = 12480; w.rhythmSystem.runBestCombo = 23;
p.completeLevel();
let previous = 0;
for (const [index, [elapsed, title]] of [
  [860, 'RESULTS / FULLY VISIBLE; COUNT-UP STARTS AT ZERO'],
  [1080, 'RESULTS / SCORE COUNTING; LATER ROWS WAIT'],
  [2060, 'RESULTS / EVERY ROW COMPLETE']
].entries()) {
  p.updateCompletionPresentation(elapsed - previous); previous = elapsed;
  draw();
  const y = 390 + index * 425;
  label(title, 30, y);
  sc.drawImage(canvas, 380, 255, 1160, 590, 280, y + 16, 720, 366);
}
assert.deepStrictEqual(calls.errors, [], 'Production UI draws without errors');
fs.writeFileSync(path.join(root, 'docs/source-pack/verification/impact-pass-hud-results.webp'), sheet.toBuffer('image/webp'));
console.log('Production repair HUD and three results-clock states rendered; Makko acceptance remains pending.');
