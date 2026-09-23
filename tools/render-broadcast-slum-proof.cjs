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
proof.state.player.x = 1410; proof.state.player.y = 798 - 76;
proof.state.cameraX = 755; proof.state.warning = true; proof.state.messageMs = 0;
capture('02-phrase-warning');
proof.state.player.x = 4640; proof.state.cameraX = 2880; proof.state.relays = [0, 0];
proof.status = proof.state.status = 'clear';
capture('03-clear-return');
proof.status = proof.state.status = 'playing';
proof.state.player.x = 2300; proof.state.cameraX = 1580;
proof.state.relays = [0, 7]; proof.state.warning = false;
proof.draw(ctx); w.BARCODE.PauseMenu.draw(ctx);
fs.writeFileSync(path.join(out, '04-pause-exit.png'), canvas.toBuffer('image/png'));
console.log(`Four production preview screens rendered to ${out}`);
