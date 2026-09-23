// Native raster captures of the production Level 2 proof drawing.
// These are layout evidence, not hosted Makko or audio feel validation.
const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]
}));
const { createRig, load } = require('./check-level-01-boss');
const out = path.resolve(process.argv[2] || 'docs/source-pack/review-cache-line');
fs.mkdirSync(out, { recursive: true });
GlobalFonts.registerFromPath(path.resolve('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'), 'Oxanium');
const { w, context } = createRig();
w.localStorage = { getItem() { return null; }, setItem() {} };
load(context, 'src/game/lore-collection.js');
w.lostDataSystem.archive = new w.BARCODE.LoreCollection();
load(context, 'src/game/campaign-services.js');
load(context, 'src/engine/cache-road-proof-profile.js');
load(context, 'src/game/cache-road-proof.js');
w.audioSystem.musicTracks = Object.fromEntries(w.BARCODE.MusicProfiles.get('level-02.proof').arrangement.sources.map(source =>
  [source.sourceId, { buffer: { duration: 187.5 }, isFallback: false }]));
const parent = { levelId: 'level-01', checkpointId: 'intermission', levelState: {
  difficultyId: 'standard', run: { levelId: 'level-01', runId: 'road-native', recoveryMode: 'checkpoints',
    elapsedMs: 120000, damageTaken: 0, retries: 0, attempts: 1, accurate: 1, perfect: 1,
    connected: 1, connectedPerfect: 1, completed: true },
  score: 2400, bestCombo: 2, health: 3, playerX: 3500, fragments: [], skyCaches: [], ampCharges: 1,
  boss: { bossX: 3480, playerX: 3500, score: 2400, skyCaches: [] }, result: { score: 2400 }
} };
const saved = { levelId: 'level-02', checkpointId: 'road-start', levelState: { proofVersion: 3,
  returnTo: parent, proof: { progress: 0, lane: 1, lanePos: 1, musicBar: 0,
    speed: 34, timeMs: 55000,
    lockEnergy: 65, echoEnergy: 65, integrity: 3, locked: [] } } };
const road = w.BARCODE.CacheRoadProof;
if (!road.restore(saved)) throw Error('Road fixture did not restore.');
const canvas = createCanvas(1920, 1080), ctx = canvas.getContext('2d');
function capture(name) {
  road.draw(ctx);
  fs.writeFileSync(path.join(out, `${name}.webp`), canvas.toBuffer('image/webp', 45));
}
road.state.progress = 650; road.state.musicBar = 6;
road.state.lanePos = road.state.visualLane = road.state.lane = 2;
road.state.locked = [0]; road.state.messageMs = 0; road.state.speed = 54;
capture('01-rainline');
road.state.progress = 3750; road.state.musicBar = 36;
road.state.locked = [0, 1]; road.state.echoEnergy = 100;
road.state.rivalWarning = false; road.state.messageMs = 0; road.state.speed = 54;
capture('02-service-loop');
road.state.progress = 9700; road.state.musicBar = 94; road.state.gateAt = 9780;
road.state.lanePos = road.state.visualLane = road.state.lane = 3;
road.state.echo = { lanePos: 1, ageMs: 600 }; road.state.rivalLane = road.state.rivalTarget = 1;
road.state.rivalWarning = true; road.state.nextRivalAt = 9790;
road.state.locked = [0, 1, 2]; road.state.echoEnergy = 0; road.state.messageMs = 0; road.state.speed = 64;
capture('03-echo-split');
road.status = road.state.status = 'clear'; road.state.progress = 10100; road.state.musicBar = 100;
road.state.rivalWarning = false; road.state.echo = null; road.state.messageMs = 0;
capture('04-delivered');
road.status = road.state.status = 'failed'; road.state.progress = 9782; road.state.musicBar = 95;
road.state.gateOpen = false; road.state.gateFailure = 'wrong-lane';
road.state.lanePos = road.state.visualLane = road.state.lane = 0;
capture('05-exit-missed');
console.log(`Five Cache Line review frames rendered to ${out}`);
