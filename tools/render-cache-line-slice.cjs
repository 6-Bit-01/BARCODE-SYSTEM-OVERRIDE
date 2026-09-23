// Native raster captures of the production Level 2 proof drawing.
// These are layout evidence, not hosted Makko or audio feel validation.
const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]
}));
const { createRig, load } = require('./check-level-01-boss');
const out = path.resolve(process.argv[2] || 'docs/source-pack/review-cache-road-stack');
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
const saved = { levelId: 'level-02', checkpointId: 'road-start', levelState: { proofVersion: 4,
  returnTo: parent, proof: { progress: 0, lane: 1, lanePos: 1, musicBar: 0,
    speed: 34, timeMs: 55000,
    lockEnergy: 100, echoEnergy: 65, integrity: 3, score: 0, peakStack: 1, cleanBars: 0 } } };
const road = w.BARCODE.CacheRoadProof;
if (!road.restore(saved)) throw Error('Road fixture did not restore.');
const canvas = createCanvas(1920, 1080), ctx = canvas.getContext('2d');
function capture(name) {
  road.draw(ctx);
  fs.writeFileSync(path.join(out, `${name}.webp`), canvas.toBuffer('image/webp', 45));
}
road.state.progress = 650; road.state.musicBar = 6;
road.state.lanePos = road.state.visualLane = road.state.lane = 2;
road.state.musicBeatFloat = 25;
road.state.captures = [{ lane: 0, startBeat: 23, endBeat: 39, sealed: true },
  { lane: 1, startBeat: 24, endBeat: 32, sealed: false }];
road.state.score = 900; road.state.peakStack = 2;
road.state.messageMs = 0; road.state.speed = 54;
capture('01-rainline');
road.state.progress = 3750; road.state.musicBar = 36;
road.state.musicBeatFloat = 145;
road.state.captures = [{ lane: 0, startBeat: 142, endBeat: 158, sealed: true },
  { lane: 1, startBeat: 144, endBeat: 152, sealed: false },
  { lane: 2, startBeat: 145, endBeat: 153, sealed: false }];
road.state.score = 9300; road.state.peakStack = 3;
road.state.echoEnergy = 100;
road.state.rivalWarning = false; road.state.messageMs = 0; road.state.speed = 54;
capture('02-service-loop');
road.state.progress = 9700; road.state.musicBar = 94; road.state.gateAt = 9780;
road.state.lanePos = road.state.visualLane = road.state.lane = 3;
road.state.musicBeatFloat = 377;
road.state.echo = { lanePos: 1, ageMs: 600 }; road.state.rivalLane = road.state.rivalTarget = 1;
road.state.rivalWarning = true; road.state.nextRivalAt = 9790;
road.state.captures = [0, 1, 2, 3].map((lane, index) => ({ lane,
  startBeat: 374 + index, endBeat: 382 + index * 2, sealed: index < 2 }));
road.state.score = 25800; road.state.peakStack = 4;
road.state.echoEnergy = 0; road.state.messageMs = 0; road.state.speed = 64;
capture('03-echo-split');
road.status = road.state.status = 'clear'; road.state.progress = 10100; road.state.musicBar = 100;
road.state.captures = []; road.state.musicBeatFloat = 400;
road.state.rivalWarning = false; road.state.echo = null; road.state.messageMs = 0;
capture('04-delivered');
road.status = road.state.status = 'failed'; road.state.progress = 9782; road.state.musicBar = 95;
road.state.gateOpen = false; road.state.gateFailure = 'wrong-lane';
road.state.lanePos = road.state.visualLane = road.state.lane = 0;
capture('05-exit-missed');
road.status = road.state.status = 'playing'; road.state.gateFailure = null;
road.state.musicBar = 36; road.state.musicBeatFloat = 145;
road.state.progress = 3750; road.state.stumbleMs = 530; road.state.invulnerableMs = 900;
road.state.message = 'VAN HIT // STACK BROKEN • SIGNAL STUMBLE'; road.state.messageMs = 1200;
capture('06-stumble');
console.log(`Six Cache Road stack review frames rendered to ${out}`);
