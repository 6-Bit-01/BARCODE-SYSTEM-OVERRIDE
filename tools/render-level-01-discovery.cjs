// Optional native Canvas diagnostic; @napi-rs/canvas is not a game or CI dependency.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()] }));
const root = path.resolve(__dirname, '..');
const { createRig, load } = require(path.join(root, 'tools/check-level-01-boss'));
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 'monospace');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 'monospace');
async function main() {
  const canvas = createCanvas(1600, 1300), ctx = canvas.getContext('2d');
  const rig = createRig(), { w, p, context, calls } = rig;
  const label = (text, x, y, color = '#b5c8d9', size = 18) => {
    ctx.save(); ctx.fillStyle = color; ctx.font = `${size}px monospace`; ctx.textAlign = 'left'; ctx.fillText(text, x, y); ctx.restore();
  };
  ctx.fillStyle = '#07111e'; ctx.fillRect(0, 0, 1600, 1300);
  label('DISCOVERY PASS / PRODUCTION DRAWING DIAGNOSTIC', 30, 38, '#e0ffff', 25);
  label('Native Canvas · fixture positions and body guides · not a live Makko screenshot', 30, 70);
  load(context, 'src/engine/traffic-sheets.js'); load(context, 'src/engine/spaceships.js');
  const traffic = Object.create(w.SpaceShipSystem.prototype);
  traffic.shipSheets = w.BARCODE.trafficSheets;
  traffic.shipImages = await Promise.all(traffic.shipSheets.map(sheet => loadImage(path.join(root, sheet.image))));
  traffic.imagesLoaded = [true, true, true]; traffic.elapsedMs = 0;
  for (let type = 0; type < 3; type++) for (let col = 0; col < 3; col++) {
    const x = col * 533, y = 106 + type * 178;
    ctx.fillStyle = type % 2 ? '#0c1b2b' : '#0a1725'; ctx.fillRect(x + 10, y, 513, 166);
    const ms = [0, 1600, traffic.shipSheets[type].durationMs - 1][col];
    label(`SHIP ${type + 1} / FRAME ${Math.min(traffic.shipSheets[type].frameCount - 1, Math.floor(ms / 40)) + 1}`, x + 25, y + 26);
    traffic.drawShip(ctx, { shipType: type, x: x + 267, y: y + 112, size: 410,
      bobOffset: 0, bobAmount: 0, rotation: 0, flipH: false, animationElapsedMs: ms });
  }
  label('NEXT SUCCESSFUL RHYTHM HIT / NORMAL AND AMP REACH', 30, 676, '#e0ffff', 21);
  p.startMission(); w.rhythmSystem.show(); w.BARCODE.signalAmpCharges = 3;
  w.rhythmSystem.combo = 0;
  w.enemyManager.enemies = [180, 370].map(distance => {
    const e = new w.Enemy(w.player.position.x + distance, 750, 'corrupted');
    e.position.x = w.player.position.x + distance; e.position.y = 750; e.active = true;
    return e;
  });
  ctx.save(); ctx.translate(-650, 116);
  for (const [index, subject] of [w.player, ...w.enemyManager.enemies].entries()) {
    const b = subject.getHitbox(); ctx.fillStyle = index ? '#432547' : '#173f48';
    ctx.fillRect(b.x, b.y, b.width, b.height);
  }
  w.BARCODE.playerCombat.drawTargetPreview(ctx, w.player); ctx.restore();
  label('6 BIT', 210, 958); label('NORMAL', 390, 958); label('AMP EXTENSION', 540, 958, '#e6a1ff');
  rig.reachReady(); p.beginBossCombat(); w.enemyManager.enemies = [];
  w.player.position.x = p.boss.x - 100; w.player.position.y = p.boss.y;
  function bossPreview(x, caption) {
    const b = p.getBossHitbox();
    ctx.save(); ctx.translate(x - b.x, 746 - b.y);
    ctx.fillStyle = '#394350'; ctx.fillRect(b.x, b.y, b.width, b.height);
    w.BARCODE.playerCombat.drawTargetPreview(ctx, w.player); ctx.restore();
    label(caption, x - 5, 958);
  }
  bossPreview(1030, 'GUARDED PHASE');
  w.player.invulnerableUntil = Infinity;
  rig.until(() => p.boss.phase === 'recovery', 'diagnostic recovery');
  w.player.position.x = p.boss.x - 100; w.player.position.y = p.boss.y;
  bossPreview(1350, 'COUNTER WINDOW');
  load(context, 'src/game/combat-fx.js');
  w.BARCODE.combatFX.visible = () => true;
  p.signalAmpCollected = false; w.player.position.x = w.Sector1Progression.SIGNAL_AMP.x - 120;
  label('ROOFTOP PICKUP / CONTACT PROMPT AND CHARGE HUD', 30, 1020, '#e0ffff', 21);
  ctx.save(); ctx.translate(500 - 2868, 1187 - 154);
  ctx.fillStyle = '#24445a'; ctx.fillRect(2700, 196, 330, 8);
  p.drawSignalAmp(ctx); ctx.restore();
  w.BARCODE.signalAmpCharges = 3; w.BARCODE.combatFX.ampChanged('pickup', 3, w.player);
  ctx.save(); ctx.translate(-560, 1020); w.BARCODE.combatFX.drawAmpHUD(ctx); ctx.restore();
  label('Body guides show target alignment only; existing game sprites remain unchanged.', 30, 1275);
  assert.deepStrictEqual(calls.errors, []);
  fs.writeFileSync(path.join(root, 'docs/source-pack/verification/discovery-traffic-targets.png'), canvas.toBuffer('image/png'));
  console.log('Production atlas cropping, target brackets, boss phase cues and Amp drawing completed without Canvas errors.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
