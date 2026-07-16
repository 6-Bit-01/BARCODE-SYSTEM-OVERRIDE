const fs = require('fs');
const vm = require('vm');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeContext() {
  const logs = [];
  const timers = [];
  const ctx = {
    window: {},
    console: { log: (...args) => logs.push(['log', args]), warn: (...args) => logs.push(['warn', args]), error: (...args) => logs.push(['error', args]) },
    setTimeout: fn => { timers.push(fn); return timers.length; },
    clearTimeout: () => {},
    setInterval: fn => { timers.push(fn); return timers.length; },
    clearInterval: () => {},
    Date,
    Promise,
    Error,
    Math,
    Image: function Image() {},
    document: { readyState: 'complete', addEventListener(){}, getElementById(){ return { addEventListener(){} }; } }
  };
  ctx.window = ctx;
  ctx.window.BARCODE = {};
  vm.createContext(ctx);
  return { ctx, logs, timers };
}

function run(ctx, file) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
}

function loadProfileStack() {
  const env = makeContext();
  run(env.ctx, 'src/engine/music-profiles.js');
  run(env.ctx, 'src/engine/music-transport.js');
  run(env.ctx, 'src/engine/level-01-music-profile.js');
  return env;
}

(function profileSelectionIsExplicit() {
  const { ctx } = loadProfileStack();
  assert(ctx.BARCODE.MusicProfiles.get('level-01.main'), 'level-01.main must be registered');
  const result = ctx.BARCODE.ensureLevel01MusicProfileSelected();
  assert(result.ok, 'initializer must select Level 1 profile');
  assert(ctx.BARCODE.MusicProfiles.getActive().profileId === 'level-01.main', 'active profile must be exact Level 1 ID');
  assert(ctx.BARCODE.MusicTransport.getProfileId() === 'level-01.main', 'transport must load exact Level 1 ID');
})();

(function missingRegistrationIsControlled() {
  const env = makeContext();
  run(env.ctx, 'src/engine/music-profiles.js');
  run(env.ctx, 'src/engine/music-transport.js');
  env.ctx.BARCODE.LEVEL_01_MUSIC_PROFILE_ID = 'level-01.main';
  const code = fs.readFileSync('src/engine/level-01-music-profile.js', 'utf8');
  assert(code.includes('Missing registration for level-01.main'), 'initializer must emit actionable missing-registration error');
})();

(function audioNullProfileDoesNotStart() {
  const { ctx, timers } = loadProfileStack();
  ctx.BARCODE.MusicProfiles.select(null);
  run(ctx, 'src/engine/audio.js');
  let transportStarted = false;
  ctx.BARCODE.MusicTransport.start = () => { transportStarted = true; return { status: 'ok', running: true }; };
  const audio = new ctx.AudioSystem();
  audio.initialized = true;
  audio.context = { currentTime: 10, createBufferSource: () => ({ connect(){}, start(){}, stop(){} }), createGain: () => ({ gain: { value: 0, linearRampToValueAtTime(){} }, connect(){} }) };
  audio.musicGain = { };
  timers.length = 0;
  const result = audio.startAllLayersSimultaneously();
  assert(result && result.ok === false && result.reason === 'missing-profile-selection', 'null profile should return controlled failure');
  assert(audio.layersStarted === false, 'null profile must not set layersStarted');
  assert(!transportStarted, 'null profile must not start transport');
  assert(timers.length === 0, 'null profile must not start timers');
})();

(function validProfileStartsOneGeneration() {
  const { ctx } = loadProfileStack();
  ctx.BARCODE.ensureLevel01MusicProfileSelected();
  run(ctx, 'src/engine/audio.js');
  const starts = [];
  const audio = new ctx.AudioSystem();
  audio.initialized = true;
  audio.context = { currentTime: 5, createBufferSource: () => ({ connect(){}, start(t,o){ starts.push([t,o]); }, stop(){} }), createGain: () => ({ gain: { value: 0, linearRampToValueAtTime(){} }, connect(){} }) };
  audio.musicGain = { };
  audio.musicTracks = { foundation: { buffer: { duration: 212 } }, 'bass-layer': { buffer: { duration: 210 } }, 'fx-layer': { buffer: { duration: 212 } } };
  const before = ctx.BARCODE.MusicTransport.sample(5).generation;
  const result = audio.startAllLayersSimultaneously();
  const after = ctx.BARCODE.MusicTransport.sample(5.01).generation;
  assert(result.ok && result.scheduledCount === 3, 'valid profile must schedule all three Level 1 sources');
  assert(after === before + 1, 'valid profile should start one synchronized transport generation');
})();

(function sourceConstantsRemainUnchanged() {
  const text = fs.readFileSync('src/engine/level-01-music-profile.js', 'utf8');
  ['quarterBpm: 146', 'beatsPerBar: 4', 'beatUnit: 4', 'establishmentBeatCount: 32', 'perfect: 60', 'excellent: 100', 'legacyManualRestartSec: 211', 'gain: 0.8', 'gain: 0'].forEach(snippet => assert(text.includes(snippet), `missing unchanged constant ${snippet}`));
  ['2133657a-6dbe-47c0-b4c3-4cb9849b3c58.mp3', '5089debd-8927-4409-88f1-785be8508686.mp3', '1e86d080-84ac-45df-b591-5e433ae5ec8f.mp3'].forEach(url => assert(text.includes(url), `missing unchanged URL ${url}`));
})();

(function staticRuntimeOrderingAndLoggingGuards() {
  const index = fs.readFileSync('index.html', 'utf8');
  const order = ['src/engine/music-profiles.js', 'src/engine/music-transport.js', 'src/engine/level-01-music-profile.js', 'src/engine/audio.js'];
  const positions = order.map(item => index.indexOf(item));
  assert(positions.every(pos => pos >= 0), 'three runtime profile files and audio.js must exist in script order');
  assert(positions.every((pos, i) => i === 0 || pos > positions[i - 1]), 'runtime script order must put profile stack before audio.js');
  const audio = fs.readFileSync('src/engine/audio.js', 'utf8');
  assert(audio.includes('this.layerLogState.enemyCount !== enemyCount'), 'enemy count logging must be change-gated');
  assert(audio.includes('this.layerLogState.activeLayers !== activeLayerKey'), 'active layer logging must be change-gated');
  assert(audio.includes('getOrCreateAssetPromise'), 'audio asset loads must cache in-flight promises');
  const ships = fs.readFileSync('src/engine/spaceships.js', 'utf8');
  assert(ships.includes('loadSharedImageAsset'), 'ship image loads must cache in-flight promises');
})();

console.log('PASS Makko music/rhythm hotfix regression checks');
