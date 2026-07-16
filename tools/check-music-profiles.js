const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
function fail(message) { console.error(`music profile check failed: ${message}`); process.exit(1); }
function assert(condition, message) { if (!condition) fail(message); }
function approx(actual, expected, message) { if (Math.abs(actual - expected) > 1e-9) fail(`${message}: expected ${expected}, got ${actual}`); }
function run(file, context) { vm.runInContext(read(file), context, { filename: file }); }

let nowMs = 0;
const context = vm.createContext({
  console,
  setTimeout() { return 0; },
  clearTimeout() {},
  document: { readyState: 'loading', addEventListener() {} },
  performance: { now: () => nowMs },
  window: {}
});
context.window.window = context.window;
context.window.randomRange = () => 0;
context.window.clamp = (value, min, max) => Math.max(min, Math.min(max, value));
run('src/engine/music-profiles.js', context);
run('src/engine/music-transport.js', context);
run('src/engine/level-01-music-profile.js', context);
run('src/game/rhythm.js', context);
const BARCODE = context.window.BARCODE;
const registry = BARCODE.MusicProfiles;
const transport = BARCODE.MusicTransport;
const level = registry.get('level-01.main');
const beat = 60 / 146;

function makeFixture(id, overrides = {}) {
  return Object.assign({
    profileId: id,
    levelId: 'fixture',
    runtimeRegistration: false,
    metadataStatus: 'verified',
    arrangement: { sources: [{ sourceId: `${id}.source`, assetId: `${id}.asset`, url: `fixture://${id}`, required: false, gain: 0.25, offsetSec: 0.125, nativeLoop: false, fallbackRole: 'optional-silence', playbackPolicy: 'fixture' }] },
    playback: { startTrackSec: 3, loop: null, endPolicy: 'fixture', legacyManualRestartSec: null },
    timeline: { mode: 'fixed-tempo', gridOriginTrackSec: 2, fixedGrid: { quarterBpm: 123, beatsPerBar: 5, beatUnit: 4 } },
    phrasePresentation: { barsPerPhrase: 3, beatCount: 15 },
    judgmentRules: [{ id: `${id}.attack`, target: 'quarter-note', windowsMs: { perfect: 25, excellent: 80 }, calibrationOffsetMs: 0 }]
  }, overrides);
}
function expectRegisterInvalid(profile, message) {
  let threw = false;
  try { registry.register(profile); } catch (_) { threw = true; }
  assert(threw, message);
}
function freshRhythm() {
  const rhythm = new context.window.RhythmSystem();
  rhythm.createMissEffect = () => { rhythm.missEffects = (rhythm.missEffects || 0) + 1; };
  rhythm.createHitEffect = () => {};
  rhythm.triggerPowerArc = () => {};
  rhythm.checkAttackWindow = () => false;
  rhythm.spawnAttackWindow = () => {};
  rhythm.createBeatEffect = () => {};
  rhythm.updateEffects = () => {};
  rhythm.updateAttackWindows = () => {};
  rhythm.updatePowerArcs = () => {};
  return rhythm;
}

assert(Object.isFrozen(level) && Object.isFrozen(level.arrangement.sources[0]), 'registered Level 1 profile must be deeply frozen');
assert(level.arrangement.sources.map(source => source.sourceId).join(',') === 'foundation,bass-layer,fx-layer', 'Level 1 source IDs changed');
assert(level.arrangement.sources.map(source => source.gain).join(',') === '0.8,0,0', 'Level 1 gains changed');
assert(level.arrangement.sources.every(source => source.nativeLoop), 'Level 1 native loop flags changed');
assert(level.arrangement.sources.map(source => source.fallbackRole).join(',') === 'required-or-degraded,synthetic-layer-fallback,synthetic-layer-fallback', 'Level 1 fallback roles changed');
assert(level.arrangement.sources[0].url.endsWith('/2133657a-6dbe-47c0-b4c3-4cb9849b3c58.mp3'), 'foundation URL changed');
assert(level.arrangement.sources[1].url.endsWith('/5089debd-8927-4409-88f1-785be8508686.mp3'), 'bass URL changed');
assert(level.arrangement.sources[2].url.endsWith('/1e86d080-84ac-45df-b591-5e433ae5ec8f.mp3'), 'fx URL changed');
assert(level.playback.legacyManualRestartSec === 211, '211s legacy manual restart missing');
assert(level.judgmentRules[0].id === 'level-01.attack' && level.judgmentRules[0].windowsMs.perfect === 60 && level.judgmentRules[0].windowsMs.excellent === 100, 'Level 1 judgment windows changed');
assert(level.legacyCompatibility.deadCompensationMsNotApplied === -20, '-20ms compensation must remain unapplied');

// Validation rejects malformed and duplicate data.
expectRegisterInvalid(makeFixture('bad.duplicate-source', { arrangement: { sources: [makeFixture('x').arrangement.sources[0], makeFixture('x').arrangement.sources[0]] } }), 'duplicate source IDs must reject');
expectRegisterInvalid(makeFixture('bad.runtime', { runtimeRegistration: 'nope' }), 'runtimeRegistration must be boolean');
expectRegisterInvalid(makeFixture('bad.url-resolver', { arrangement: { sources: [{ sourceId: 's', assetId: 'a', url: 'u', resolverId: 'r', required: true, gain: 1, offsetSec: 0, nativeLoop: false, fallbackRole: 'f', playbackPolicy: 'p' }] } }), 'source url/resolver contract must reject');
expectRegisterInvalid(makeFixture('bad.windows', { judgmentRules: [{ id: 'r', target: 'quarter-note', windowsMs: { perfect: 90, excellent: 80 }, calibrationOffsetMs: 0 }] }), 'ordered judgment windows must reject');
expectRegisterInvalid(makeFixture('bad.grid', { timeline: { mode: 'fixed-tempo', gridOriginTrackSec: 0, fixedGrid: { quarterBpm: Infinity, beatsPerBar: 4, beatUnit: 4 } } }), 'non-finite grid must reject');
registry.register(makeFixture('fixture.duplicate-once'));
expectRegisterInvalid(makeFixture('fixture.duplicate-once'), 'duplicate profile registration must reject');

// Exact selection and no-profile degradation.
assert(registry.select('missing-profile') === null && registry.getActive() === null, 'unknown exact profile must clear active selection');
registry.select('level-01.main');
let loaded = transport.load('level-01.main');
assert(loaded.profileId === 'level-01.main' && !loaded.running, 'Level 1 should load stopped');
let start = transport.start({ sourceAnchorAudioSec: 10, sourceOffsetTrackSec: 0 });
const startGeneration = start.generation;
assert(start.running && start.sourceAnchorAudioSec === 10 && start.trackTimeSec === 0, 'exact playback anchor mismatch');
assert(transport.poll(10).events.length === 0, 'source anchor must not emit a beat event');
let duplicateStart = transport.start({ sourceAnchorAudioSec: 10, sourceOffsetTrackSec: 0 });
assert(duplicateStart.generation === startGeneration, 'repeated idempotent start advanced generation');

// Real ordering regression: applying same profile after start must preserve anchor and emit first boundary.
const rhythm = freshRhythm();
rhythm.applySelectedProfile();
let afterSameProfileApply = transport.sample(10);
assert(afterSameProfileApply.running && afterSameProfileApply.sourceAnchorAudioSec === 10 && afterSameProfileApply.generation === startGeneration, 'same-profile apply reset running transport');
let firstBoundary = transport.poll(10 + beat);
assert(firstBoundary.events.length === 1 && firstBoundary.events[0].beatIndex === 1, 'first expected Level 1 beat event missing after same-profile apply');
assert(transport.getLastSample().sourceAnchorAudioSec === 10, 'same-profile load lost last valid anchor sample');

// Level 1 first-boundary, establishment, phrase, judgment, and native wraps.
transport.load('level-01.main');
transport.coordinatedRestart(20);
let batchAtAnchor = transport.poll(20);
assert(batchAtAnchor.events.length === 0, 'no event should fire at source anchor');
let batchAtFirstBeat = transport.poll(20 + beat + 1e-9);
assert(batchAtFirstBeat.events.length === 1 && batchAtFirstBeat.events[0].beatIndex === 1, 'first event after one Level 1 beat failed');
let establishment = transport.poll(20 + beat * 32 + 1e-9);
assert(establishment.events.length === 16 && establishment.events[15].beatIndex === 32, 'bounded establishment catch-up must include beat 32');
let sample32 = transport.sample(20 + beat * 32 + 1e-9);
assert(sample32.grid.establishmentBeatCount === 32 && sample32.grid.phraseBeatCount === 16 && sample32.grid.beatInBar === 0, '32-beat/16-beat Level 1 presentation mismatch');
let wrapGeneration = sample32.generation;
transport.sample(20 + 300);
assert(transport.sample(20 + 301).generation === wrapGeneration, 'native source wrap/long sample advanced generation');
let perfect = transport.judgeInput('level-01.attack', 20 + 0.059);
let excellent = transport.judgeInput('level-01.attack', 20 + 0.090);
let miss = transport.judgeInput('level-01.attack', 20 + 0.120);
assert(perfect.timing === 'perfect' && excellent.timing === 'excellent' && miss.timing === 'miss', 'nearest-grid Level 1 judgment windows changed');
assert(transport.judgeInput('missing.rule', 20).available === false, 'named judgment lookup must not fall back to first rule');

// Hitch, listeners, and event identity.
let listenerCount = 0;
const unsubscribe = transport.onBoundary('beat', () => { listenerCount++; });
assert(transport.getListenerCount() === 1, 'listener count should be stable after subscription');
transport.poll(20 + beat * 40);
assert(listenerCount === 8, 'bounded hitch listener event count mismatch');
unsubscribe();
assert(transport.getListenerCount() === 0, 'listener unsubscribe failed');
transport.poll(20 + beat * 48);
assert(listenerCount === 8, 'unsubscribed listener still fired');
const rhythmEvents = freshRhythm();
rhythmEvents.running = true;
rhythmEvents.processTransportBeatEvent({ type: 'beat', profileId: 'level-01.main', generation: transport.sample(20).generation, beatIndex: 100 });
assert(rhythmEvents.globalBeatCount === 1, 'one unique event should advance once');
rhythmEvents.processTransportBeatEvent({ type: 'beat', profileId: 'level-01.main', generation: transport.sample(20).generation, beatIndex: 100 });
assert(rhythmEvents.globalBeatCount === 1, 'duplicate event should not advance twice');
[101, 102, 103].forEach(index => rhythmEvents.processTransportBeatEvent({ type: 'beat', profileId: 'level-01.main', generation: transport.sample(20).generation, beatIndex: index }));
assert(rhythmEvents.globalBeatCount === 4, 'hitch batch unique beats should each advance');
transport.coordinatedRestart(200);
const newGeneration = transport.sample(200).generation;
rhythmEvents.processTransportBeatEvent({ type: 'beat', profileId: 'level-01.main', generation: newGeneration - 1, beatIndex: 1 });
assert(rhythmEvents.globalBeatCount === 4, 'stale event from old generation was processed');
rhythmEvents.processTransportBeatEvent({ type: 'beat', profileId: 'level-01.main', generation: newGeneration, beatIndex: 1 });
assert(rhythmEvents.globalBeatCount === 5, 'new generation first boundary should process');

// Stop/restart semantics.
let beforeStop = transport.sample(200).generation;
let stopped = transport.stop();
assert(!stopped.running && stopped.generation === beforeStop + 1, 'first stop should advance generation and stop');
let stoppedAgain = transport.stop();
assert(stoppedAgain.generation === stopped.generation, 'repeated stop must be idempotent');
assert(transport.judgeInput('level-01.attack', 201).available === false, 'stopped transport judgment must be unavailable');
assert(transport.poll(201).events.length === 0, 'stopped transport must not emit beat events');
let restarted = transport.start({ sourceAnchorAudioSec: 300, sourceOffsetTrackSec: 0 });
assert(restarted.running && restarted.generation === stopped.generation + 1, 'restart after stop generation mismatch');
let restartAgain = transport.coordinatedRestart(400);
assert(restartAgain.generation === restarted.generation + 1, 'coordinated restart generation mismatch');

// Different fixed profiles, meter/beat-unit formula, grid origin, phrase, loop/restart policy.
registry.register(makeFixture('fixture.fast-five'));
transport.load('fixture.fast-five');
transport.start({ sourceAnchorAudioSec: 50, sourceOffsetTrackSec: 3 });
let fixtureSample = transport.sample(52);
approx(fixtureSample.grid.beatDurationSec, 60 / 123, 'synthetic BPM beat duration');
assert(fixtureSample.grid.beatsPerBar === 5 && fixtureSample.grid.phraseBeatCount === 15, 'synthetic meter/phrase inherited Level 1 constants');
assert(fixtureSample.grid.beatIndex === Math.floor((5 - 2) / (60 / 123)), 'synthetic grid origin/start offset mismatch');
registry.register(makeFixture('fixture.eighths', { timeline: { mode: 'fixed-tempo', gridOriginTrackSec: 0, fixedGrid: { quarterBpm: 120, beatsPerBar: 7, beatUnit: 8 } }, phrasePresentation: { barsPerPhrase: 2, beatCount: 14 }, playback: { startTrackSec: 0, loop: { loopStartSec: 1, loopEndSec: 9 }, endPolicy: 'fixture-loop', legacyManualRestartSec: 17 } }));
transport.load('fixture.eighths');
transport.start({ sourceAnchorAudioSec: 0, sourceOffsetTrackSec: 0 });
let eighth = transport.sample(0.25);
approx(eighth.grid.beatDurationSec, 0.25, 'beatUnit 8 must use eighth-note grid duration at quarter BPM');
assert(eighth.grid.beatIndex === 1 && eighth.grid.beatsPerBar === 7 && eighth.grid.phraseBeatCount === 14, 'non-4 meter/phrase behaved like Level 1');
assert(registry.get('fixture.eighths').playback.loop.loopEndSec === 9 && registry.get('fixture.eighths').playback.legacyManualRestartSec === 17, 'synthetic loop/restart config not preserved');
let changed = transport.load('fixture.fast-five');
assert(!changed.running && changed.profileId === 'fixture.fast-five', 'different-profile load must invalidate previous session');
let cleared = transport.load('does-not-exist');
assert(cleared.status === 'no-profile' && transport.sample(9).status === 'no-profile', 'unknown profile did not clear previous state');

// No-grid profile remains valid playback and distinct from missing profile.
registry.register({ profileId: 'fixture.no-grid', levelId: 'fixture', runtimeRegistration: false, metadataStatus: 'verified', arrangement: { sources: [{ sourceId: 'free', assetId: 'free.asset', url: 'fixture://free', required: false, gain: 1, offsetSec: 0, nativeLoop: false, fallbackRole: 'optional-silence', playbackPolicy: 'fixture' }] }, playback: { startTrackSec: 0, loop: null, endPolicy: 'fixture', legacyManualRestartSec: null }, timeline: { mode: 'none' }, judgmentRules: [] });
registry.select('fixture.no-grid');
transport.load('fixture.no-grid');
transport.start({ sourceAnchorAudioSec: 1, sourceOffsetTrackSec: 0 });
const noGridRhythm = freshRhythm();
noGridRhythm.applySelectedProfile();
let noGrid = transport.sample(2.5);
assert(noGrid.profileId === 'fixture.no-grid' && noGrid.running && noGrid.trackTimeSec === 1.5 && noGrid.grid === null, 'valid no-grid playback was cleared or fabricated grid data');
assert(transport.judgeInput('anything', 2.5).available === false && transport.poll(3).events.length === 0, 'no-grid profile fabricated judgment/events');
noGridRhythm.applySelectedProfile('missing-no-grid');
assert(transport.sample(4).status === 'no-profile', 'missing profile must remain distinct from valid no-grid profile');

// Active gameplay judgment uses transport/audio time, not performance.now timing.
registry.select('level-01.main');
transport.load('level-01.main');
transport.start({ sourceAnchorAudioSec: 1000, sourceOffsetTrackSec: 0 });
const inputRhythm = freshRhythm();
inputRhythm.applySelectedProfile();
inputRhythm.active = true;
inputRhythm.running = true;
inputRhythm.trackStarted = true;
context.window.audioSystem = { context: { currentTime: 1000 + 0.059 }, playSound() {}, playRhythmAttack() {} };
nowMs = 123456;
let inputPerfect = inputRhythm.handleInput('attack');
assert(inputPerfect.hit === true && inputPerfect.timing === 'perfect', 'gameplay input did not use transport perfect judgment');
inputRhythm.lastInputTime = 0;
context.window.audioSystem.context.currentTime = 1000 + 0.120;
nowMs = 999999;
let inputMiss = inputRhythm.handleInput('attack');
assert(inputMiss.hit === false && inputMiss.timing === 'miss' && inputRhythm.missEffects > 0, 'gameplay input did not use transport miss/unavailable behavior');
transport.stop();
inputRhythm.lastInputTime = 0;
context.window.audioSystem.context.currentTime = 1001;
let unavailable = inputRhythm.handleInput('attack');
assert(unavailable.hit === false && unavailable.timing === 'miss', 'stopped transport must produce miss/unavailable gameplay behavior');

// Implementation semantic checks for no extra musical timers/RAF/Date.now and active judgment path.
const transportSource = read('src/engine/music-transport.js');
assert(!/setTimeout\s*\(|setInterval\s*\(|requestAnimationFrame\s*\(|Date\.now\s*\(/.test(transportSource), 'transport must not own timers, RAF, or Date.now musical authority');
const rhythmSource = read('src/game/rhythm.js');
const handleInputBody = rhythmSource.slice(rhythmSource.indexOf('  handleInput('), rhythmSource.indexOf('  // Calculate timing accuracy', rhythmSource.indexOf('  handleInput(')));
assert(handleInputBody.includes('MusicTransport') && handleInputBody.includes('judgeInput'), 'active handleInput must call MusicTransport.judgeInput');
assert(!/distanceToNearestBeat|timeSinceLastBeat|timeToNextBeat/.test(handleInputBody), 'active handleInput must not compute gameplay judgment from wall-clock beat distance');
const audioSource = read('src/engine/audio.js');
assert(!/scheduleNextBeatSync\(\);/.test(audioSource), 'audio layer must not invoke recursive scheduler');
assert(!/requestAnimationFrame\s*\(/.test(transportSource), 'transport must not own a second RAF');
console.log('music profile/transport checks passed');
