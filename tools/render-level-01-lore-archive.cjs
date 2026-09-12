// Optional native Canvas layout verification. No new game or CI dependency.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createCanvas, GlobalFonts } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const { createRig, load } = require('./check-level-01-boss');
const root = path.resolve(__dirname, '..');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'monospace');
const { w, context, calls } = createRig();
const values = new Map();
w.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
load(context, 'src/game/lore-collection.js'); load(context, 'src/game/pause-menu.js'); load(context, 'src/engine/lore.js');
const collection = new w.BARCODE.LoreCollection(); w.lostDataSystem.archive = collection;
const menu = w.BARCODE.PauseMenu;
const canvas = createCanvas(1920, 1080), ctx = canvas.getContext('2d');
w.document.getElementById = id => id === 'gameCanvas' ? canvas : null;
w.document.createElement = () => createCanvas(1920, 1080);
function render(name, draw) {
  ctx.resetTransform(); ctx.fillStyle = '#081321'; ctx.fillRect(0, 0, 1920, 1080);
  const labels = [];
  const proxy = new Proxy(ctx, {
    get(target, key) {
      if (key === 'fillText') return (text, x, y, ...args) => { labels.push({ text, x, y, width: target.measureText(text).width }); target.fillText(text, x, y, ...args); };
      const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, key, value) { Reflect.set(target, key, value, target); return true; }
  });
  draw(proxy);
  for (const label of labels) {
    if (label.x === 902) { assert(label.x + label.width <= 1500, `Reader overflow: ${label.text}`); assert(label.y <= 878, `Reader too tall: ${label.text}`); }
    if (menu.view === 'archive' && label.x === 440 && label.y >= 366 && label.y < 890) assert(label.x + label.width <= 850, `List/status overflow: ${label.text}`);
  }
  fs.writeFileSync(path.join(root, 'docs/source-pack/verification', name + '.png'), canvas.toBuffer('image/png'));
}
w.gameState.paused = true; menu.openArchive();
render('lore-archive-unrecovered', ctx => menu.draw(ctx));
for (const record of w.BARCODE.LoreRecords.level1) collection.collect(record.id);
for (let index = 0; index < 3; index++) {
  menu.selectArchive(index);
  render(`lore-archive-record-${index + 1}`, ctx => menu.draw(ctx));
}
menu.closeArchive(); render('lore-archive-pause', ctx => menu.draw(ctx));
w.gameState.paused = false;
const lore = new w.LoreSystem(); lore.displayLoreMessage('ignored', 'lore.l01.01'); lore.update(300);
render('lore-archive-pickup', ctx => lore.draw(ctx));
assert.deepStrictEqual(calls.errors, []);
console.log('Native Canvas: all three complete records, locked state, pause entry and collection card rendered; text bounds passed.');
