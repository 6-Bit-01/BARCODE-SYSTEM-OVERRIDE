// Optional native Canvas QA; no added runtime or CI dependency. Supply a folder
// containing the existing SO6.png, SO8.png and SO10.png prologue assets.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const { createRig, load } = require('./check-level-01-boss');
const root = path.resolve(__dirname, '..');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'monospace');
async function main() {
  const assetDir = process.argv[2];
  if (!assetDir) throw new Error('Pass the local folder of existing prologue assets.');
  const { w, p, context, calls } = createRig();
  for (const file of ['src/game/pause-menu.js', 'src/game/combat-fx.js', 'src/core/gamepad-ui.js', 'src/game/render-coordinator.js', 'src/game/ui-manager.js']) load(context, file);
  w.BARCODE.combatFX = new w.BARCODE.CombatFX();
  w.objectivesSystem = new w.ObjectivesSystem();
  w.cutsceneSystem = { cutsceneImages: [] };
  for (const [index, name] of [[5, 'SO6'], [7, 'SO8'], [10, 'SO10']]) w.cutsceneSystem.cutsceneImages[index] = { element: await loadImage(path.join(assetDir, name + '.png')) };
  const canvas = createCanvas(1920, 1080), raw = canvas.getContext('2d');
  const labels = [];
  const ctx = new Proxy(raw, {
    get(target, key) {
      if (key === 'fillText') return (text, x, y, maxWidth) => {
        const width = Math.min(target.measureText(text).width, maxWidth || Infinity);
        const left = x - (target.textAlign === 'right' ? width : target.textAlign === 'center' ? width / 2 : 0);
        assert(left >= 0 && left + width <= 1920, `Horizontal overflow: ${text}`);
        assert(y >= 0 && y <= 1080, `Vertical overflow: ${text}`);
        labels.push({ text, x, y, width }); target.fillText(text, x, y, maxWidth);
      }
      const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, key, value) { Reflect.set(target, key, value, target); return true; }
  });
  const reset = () => { labels.length = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#091321'; ctx.fillRect(0, 0, 1920, 1080); };
  const save = name => fs.writeFileSync(path.join(root, 'docs/source-pack/verification', name + '.webp'), canvas.toBuffer('image/webp'));
  p.startMission(); w.player.position.x = 1150; w.player.position.y = 750; w.player.allowMovement = true;
  w.lostDataSystem.getProgress = () => ({ collected: 2, total: 3, saved: true });
  w.gameState.score = 12480; w.BARCODE.signalAmpCharges = 2; w.rhythmSystem.show(); w.rhythmSystem.combo = 6; w.rhythmSystem.arcGrowthLevel = 2;
  reset(); w.drawGameElements(ctx); w.drawGameUI(ctx); save('stage-b-hud');
  w.BARCODE.GamepadUI.connected = true; w.gameState.paused = true;
  const menu = w.BARCODE.PauseMenu; menu.open = true; menu.view = 'timing';
  reset(); menu.draw(ctx);
  assert(labels.filter(label => label.x === 464).every(label => label.x + label.width < 1110), 'timing explanations must clear sliders'); save('stage-b-calibration');
  menu.view = 'settings'; reset(); menu.draw(ctx); save('stage-b-pause');
  w.gameState.paused = false; load(context, 'src/game/hacking.js'); w.hackingSystem = new w.HackingSystem(); w.hackingSystem.start(); w.hackingSystem.update(1000); w.hackingSystem.update(w.hackingSystem.displayTime);
  reset(); w.hackingSystem.draw(ctx);
  assert(labels.filter(label => label.y >= 566).every(label => label.x + label.width <= 1434), 'controller terminal legend must fit'); save('stage-b-controller-hack');
  assert.deepStrictEqual(calls.errors, []);
  console.log('Native Canvas: consolidated HUD, timing, pause and controller terminal rendered; text bounds passed. These are diagnostics, not Makko screenshots.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
