// Native Canvas captures from the production preview draw owner. Browser and
// Makko audio rendering still require a hosted review.
const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES] }));
const { createRig, load } = require('./check-level-01-boss');
const out = path.resolve(process.argv[2] || 'docs/source-pack/review-broadcast-slum');
fs.mkdirSync(out, { recursive: true });
GlobalFonts.registerFromPath(path.resolve('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'), 'Oxanium');
const { w, context } = createRig();
w.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
load(context, 'src/game/lore-collection.js');
load(context, 'src/game/pause-menu.js');
load(context, 'src/game/campaign-services.js');
load(context, 'src/engine/broadcast-slum-proof-profile.js');
load(context, 'src/game/broadcast-slum-proof.js');
let debugShortcut;
w.addEventListener = (type, listener) => { if (type === 'keydown') debugShortcut = listener; };
load(context, 'src/game/level-03-debug.js');
for (const id of ['slum-carrier', 'slum-pressure']) (w.audioSystem.musicTracks ||= {})[id] = { buffer: { duration: 16 * 60 / 108 }, isFallback: false };
const proof = w.BARCODE.RunAndGunProof;
const parent = { levelId: 'level-01', checkpointId: 'intermission', levelState: { difficultyId: 'standard',
  run: { levelId: 'level-01', runId: 'native-capture', elapsedMs: 0, damageTaken: 0, retries: 0,
    attempts: 0, accurate: 0, perfect: 0, connected: 0, connectedPerfect: 0 },
  score: 0, bestCombo: 0, health: 4, playerX: 3500, fragments: [], skyCaches: [], ampCharges: 0,
  boss: { bossX: 3480, playerX: 3500, score: 0, skyCaches: [] }, result: { score: 0 } } };
const saved = { levelId: 'level-03', checkpointId: 'proof-start', levelState: { previewVersion: 1, returnTo: parent,
  proof: { playerX: 830, health: 4, elapsedMs: 45000, kills: 1, relays: [5, 7] } } };
if (!proof.restore(saved)) throw Error('Preview fixture did not restore.');
const canvas = createCanvas(1920, 1080), ctx = canvas.getContext('2d');
function capture(name) { proof.draw(ctx); fs.writeFileSync(path.join(out, `${name}.png`), canvas.toBuffer('image/png')); }
capture('01-approach');
proof.state.player.x = 1140; proof.state.player.y = 675 - 76;
proof.state.player.scatterMs = 7000; proof.state.pickups[0].active = false;
proof.state.cameraX = 730; proof.state.messageMs = 0;
capture('02-roof-node');
proof.state.player.x = 1410; proof.state.player.y = 798 - 76;
proof.state.cameraX = 1030; proof.state.warning = true;
capture('03-phrase-warning');
proof.state.player.x = 1300; proof.state.player.y = 675 - 76; proof.state.cameraX = 980;
proof.state.nodes[0] = 0; proof.state.relays[0] = 2;
proof.state.counter = { index: 0, warningMs: 700, lockMs: 380, fired: false, roofY: 675 - 76 + 34 };
proof.state.enemies.push({ kind: 'runner', x: 930, y: 798 - 64, health: 2, spawnMs: 550 });
proof.state.warning = false;
capture('04-counter-surge');
proof.state.player.x = 4640; proof.state.cameraX = 3600; proof.state.relays = [0, 0];
proof.state.nodes = [0, 0]; proof.state.pickups.forEach(pickup => { pickup.active = false; });
proof.state.counter = null; proof.state.enemies.forEach(enemy => { enemy.health = 0; });
proof.state.boss.active = proof.state.boss.defeated = true;
proof.state.boss.feeds = [0, 0]; proof.state.boss.health = 0;
proof.status = proof.state.status = 'clear';
capture('05-clear-return');
proof.status = proof.state.status = 'playing';
proof.state.player.x = 2300; proof.state.cameraX = 1920;
proof.state.relays = [0, 7]; proof.state.nodes = [0, 4];
proof.state.pickups[1].active = true; proof.state.warning = false;
proof.draw(ctx); w.BARCODE.PauseMenu.draw(ctx);
fs.writeFileSync(path.join(out, '06-pause-exit.png'), canvas.toBuffer('image/png'));
debugShortcut({ key: 'F1', shiftKey: true, preventDefault() {}, stopPropagation() {} });
proof.draw(ctx); w.DEBUG.level3.drawOverlay(ctx);
fs.writeFileSync(path.join(out, '07-dev-menu.png'), canvas.toBuffer('image/png'));
proof.status = proof.state.status = 'playing';
proof.state.player.x = 3910; proof.state.player.y = 798 - 76; proof.state.cameraX = 3500;
proof.state.relays = [0, 0]; proof.state.nodes = [0, 0];
proof.state.boss.active = true; proof.state.boss.defeated = false;
proof.state.boss.health = 12; proof.state.boss.feeds = [4, 4];
proof.state.boss.warningMs = 800; proof.state.boss.attack = 'sweep';
proof.state.enemies.forEach(enemy => { enemy.health = 0; });
proof.state.messageMs = 0;
capture('08-transmitter-feeds');
proof.state.boss.feeds = [0, 0]; proof.state.boss.health = 5; proof.state.boss.phase = 2;
proof.state.boss.attack = 'beam'; proof.state.boss.beamX = 3940;
proof.state.boss.warningMs = 700;
capture('09-transmitter-phase-2');
proof.state.boss.warningMs = 0; proof.state.boss.beamMs = 340;
proof.state.boss.coreOpenMs = 1200;
capture('10-transmitter-counter-window');
proof.state.boss.beamMs = proof.state.boss.coreOpenMs = 0;
proof.state.player.x = 2530; proof.state.cameraX = 2240;
proof.state.relays = [0, 7]; proof.state.nodes = [0, 4];
proof.state.boss.active = false;
proof.state.enemies.find(enemy => enemy.kind === 'bulwark').health = 5;
proof.state.enemies.find(enemy => enemy.kind === 'drone').health = 3;
capture('11-shield-interceptor');
console.log(`Eleven production preview screens rendered to ${out}`);
