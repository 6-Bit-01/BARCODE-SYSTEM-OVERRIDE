// Optional real Canvas layout inspection; no additional game/CI dependency.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const { createRig, load } = require('./check-level-01-boss');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'monospace');
async function main() {
  const artPath = process.argv[2];
  if (!artPath) throw new Error('Provide the existing foreground PNG path. No replacement artwork is generated.');
  const foreground = await loadImage(artPath);
  const r = createRig(), { w, p, context } = r;
  load(context, 'src/game/broadcast-comic.js');
  p.startMission(); p.state = 'encounter_2'; w.rhythmSystem.hide();
  p.openEncounterGate('encounter_1');
  const canvas = createCanvas(1920, 1080), ctx = canvas.getContext('2d');
  const contact = createCanvas(1280, 1534), cc = contact.getContext('2d');
  cc.fillStyle = '#081214'; cc.fillRect(0, 0, 1280, 1534);
  cc.fillStyle = '#d7f4df'; cc.font = 'bold 24px monospace'; cc.fillText('SIGNAL ALLEY / PRODUCTION SCENE DRAWING', 30, 40);
  cc.fillStyle = '#adc4bb'; cc.font = '17px monospace'; cc.fillText('Existing street art; supplied clear state; not a Makko capture.', 30, 70);
  let time = 0;
  const times = [1500, 5100, 7400, 10500];
  for (const [index, target] of times.entries()) {
    w.BARCODE.BroadcastComic.update(target - time); time = target;
    ctx.fillStyle = '#09131f'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.drawImage(foreground, 0, 385, 1920, 695);
    w.BARCODE.BroadcastComic.draw(ctx);
    const view = w.BARCODE.BroadcastComic.getView(); assert(view);
    ctx.font = '24px monospace';
    assert(ctx.measureText(view.text).width < 2 * (1040 - 65), 'authored line fits at most two rows');
    const y = 98 + index * 350;
    cc.drawImage(canvas, 230, 202, 1460, 760, 28, y, 644, 335);
    cc.fillStyle = view.color; cc.font = 'bold 23px monospace'; cc.fillText(`${index + 1}. ${view.speaker}`, 700, y + 55);
    cc.fillStyle = '#edf5e9'; cc.font = '20px monospace';
    const words = view.text.split(' '); let line = '', row = 0;
    for (const word of words) {
      if (line && cc.measureText(line + ' ' + word).width > 535) { cc.fillText(line, 700, y + 101 + row++ * 29); line = word; }
      else line = line ? line + ' ' + word : word;
    }
    cc.fillText(line, 700, y + 101 + row * 29);
    cc.fillStyle = '#adc4bb'; cc.font = '17px monospace';
    cc.fillText(index === 2 ? 'Stamp and frame corner detach.' : index === 3 ? 'Real gate already open; movement stays live.' : 'Clock yields whenever gameplay needs attention.', 700, y + 255);
  }
  assert.deepStrictEqual(r.calls.errors, []);
  const output = path.resolve(__dirname, '../docs/source-pack/verification/comic-broadcast-scene.webp');
  fs.writeFileSync(output, contact.toBuffer('image/webp', 92));
  console.log(output);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
