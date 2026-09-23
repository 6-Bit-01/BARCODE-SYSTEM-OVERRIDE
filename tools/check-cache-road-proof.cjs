// Production adapter, director, transport and campaign contracts. Browser audio
// output and Makko feel still require the owner's listening/play review.
const assert = require('assert');
const fs = require('fs');
const { createRig, load } = require('./check-level-01-boss');
const copy = value => JSON.parse(JSON.stringify(value));

function level1Intermission() {
  return { levelId: 'level-01', checkpointId: 'intermission', levelState: {
    difficultyId: 'standard', run: { levelId: 'level-01', runId: 'road-parent', recoveryMode: 'checkpoints',
      elapsedMs: 120000, damageTaken: 1, retries: 0, attempts: 18, accurate: 14, perfect: 8,
      connected: 9, connectedPerfect: 5, completed: true },
    score: 2400, bestCombo: 8, health: 3, playerX: 3500,
    fragments: ['lore.l01.01'], skyCaches: [], ampCharges: 1,
    boss: { bossX: 3480, playerX: 3500, score: 2400, skyCaches: [] }, result: { score: 2400 }
  } };
}

function realAudioSchedule() {
  const { w, context } = createRig();
  load(context, 'src/engine/cache-road-proof-profile.js');
  load(context, 'src/engine/music-director.js');
  load(context, 'src/engine/audio.js');
  const profile = w.BARCODE.MusicProfiles.select('level-02.proof');
  w.BARCODE.MusicTransport.load(profile.profileId);
  const starts = [];
  const param = value => ({ value, cancelAndHoldAtTime() {}, setValueAtTime(v) { this.value = v; },
    linearRampToValueAtTime(v) { this.value = v; } });
  const node = () => ({ gain: param(1), connect() {}, disconnect() {} });
  const ac = { currentTime: 10, createGain: node, createBufferSource() {
    return { connect() {}, start(time, offset) { starts.push({ time, offset, loop: this.loop, buffer: this.buffer }); }, stop() {} };
  } };
  const audio = w.audioSystem = new w.AudioSystem();
  Object.assign(audio, { initialized: true, context: ac, musicGain: node() });
  for (const source of profile.arrangement.sources)
    audio.musicTracks[source.sourceId] = { buffer: { id: source.sourceId, duration: 16 }, volume: 0 };
  w.BARCODE.CacheRoadProof = { active: true, mixSnapshot: () => ({ lane: 0, locked: [], finalMix: false }) };
  assert(audio.startAllLayersSimultaneously().ok);
  assert.equal(starts.length, 5);
  assert(starts.every(s => s.time === 10.01 && s.offset === 0 && s.loop));
  ac.currentTime = 10.02; audio.updateLayers();
  assert.equal(audio.musicTracks['cache-bass'].volume, .43);
  w.BARCODE.CacheRoadProof.mixSnapshot = () => ({ lane: 2, locked: [0], finalMix: false });
  ac.currentTime = 10.2; audio.updateLayers();
  assert.equal(audio.musicTracks['cache-harmony'].volume, 0);
  ac.currentTime = 10.53; audio.updateLayers();
  assert.equal(audio.musicTracks['cache-harmony'].volume, .32);
  assert.equal(starts.length, 5, 'the real scheduler never restarts a muted part');
}

async function run() {
  realAudioSchedule();
  const { w, context } = createRig(), store = new Map();
  w.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) };
  w.inputManager = { resetActionEdges() {} };
  const button = { hidden: true, disabled: true, textContent: '' };
  w.document.getElementById = id => id === 'continueButton' ? button : null;
  load(context, 'src/game/lore-collection.js');
  const archive = w.lostDataSystem.archive = new w.BARCODE.LoreCollection();
  load(context, 'src/game/campaign-services.js');
  load(context, 'src/engine/cache-road-proof-profile.js');
  load(context, 'src/engine/broadcast-slum-proof-profile.js');
  load(context, 'src/engine/music-director.js');
  load(context, 'src/game/cache-road-proof.js');
  load(context, 'src/game/broadcast-slum-proof.js');
  const C = w.BARCODE.Campaign, road = w.BARCODE.CacheRoadProof;
  const profile = w.BARCODE.MusicProfiles.get('level-02.proof');
  assert.equal(profile.timeline.fixedGrid.quarterBpm, 120);
  assert.deepEqual(copy(profile.arrangement.sources.map(s => s.mixRole)), ['bed', 'bass', 'break', 'harmony', 'lead']);
  const pcm = [];
  for (const source of profile.arrangement.sources) {
    const bytes = fs.readFileSync(source.url);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.readUInt32LE(24), 22050);
    assert.equal(bytes.readUInt32LE(40), 352800 * 2, 'every part has the same exact 8-bar length');
    pcm.push(bytes.subarray(44));
  }
  assert(pcm.every(part => part.some(byte => byte !== 0)), 'all five parts have content');
  assert(!pcm[1].equals(pcm[2]) && !pcm[2].equals(pcm[3]), 'lanes have distinct waveforms');
  assert(C.validateLevel01Checkpoint(level1Intermission()));
  archive.record.progress.completedLevels.push('level-01');
  archive.record.progress.items.push('stem.voice');
  const parent = level1Intermission();
  parent.levelState.previewCheckpoint = { checkpointId: 'proof-start', previewVersion: 2,
    proof: { playerX: 180, health: 4, elapsedMs: 0, kills: 0, relays: [5, 7] } };
  archive.checkpoint(parent);
  assert(C.adapters.has('level-03'), 'the old Level 3 save adapter remains registered');
  C.intermission = true;
  w.gameState.victory = true;
  w.audioSystem.prepareActiveMusicProfile = async () => ({ ok: true });
  let stops = 0, starts = 0;
  w.audioSystem.stopRuntimeAudio = () => { stops++; w.BARCODE.MusicTransport.stop(); w.BARCODE.musicDirector.reset(); };
  w.audioSystem.musicTracks = Object.fromEntries(profile.arrangement.sources.map(source =>
    [source.sourceId, { buffer: { duration: 16 }, isFallback: false,
      gain: { gain: { value: source.gain } }, volume: source.gain, isPlaying: true }]));
  w.audioSystem.layersStarted = true;
  w.audioSystem.isLooping = false;
  w.audioSystem.getActiveMusicProfile = () => w.BARCODE.MusicProfiles.getActive();
  w.audioSystem.rampAdaptiveStemGain = (track, gain) => { track.volume = gain; track.gain.gain.value = gain; };
  w.audioSystem.startRuntimeGameplayMusic = () => {
    starts++;
    const t = w.BARCODE.MusicTransport.start({ sourceAnchorAudioSec: 0, sourceOffsetTrackSec: 0 });
    return { ok: t.status === 'ok' && t.running };
  };
  w.audioSystem.context.currentTime = 0.01;
  let exitOptions;
  w.BARCODE.RuntimeLifecycle = { async restart(options) { exitOptions = options; road.dispose(); return { ok: true }; } };
  assert((await road.enter()).ok);
  assert.equal(stops, 1); assert.equal(starts, 1);
  assert.equal(C.intermission, false);
  assert.equal(C.run, null);
  assert.equal(archive.record.current.levelId, 'level-02');
  assert.equal(button.textContent, 'CONTINUE PROTOTYPE — C / Y');
  assert.equal(w.BARCODE.MusicProfiles.getActive().profileId, 'level-02.proof');
  load(context, 'src/core/action-input.js'); load(context, 'src/core/input.js');
  const input = w.inputManager = new w.InputManager();
  const actions = (overrides = {}) => ({ pause: { pressed: false }, move_left: {}, move_right: {}, inspect: {}, jump: {}, ...overrides });
  const director = w.BARCODE.musicDirector, mix = () => {
    assert(director.apply(w.audioSystem)); return copy(director.diagnostics().volumes);
  };
  const volume = id => w.audioSystem.musicTracks[`cache-${id}`].volume;
  mix();
  assert.equal(volume('bed'), .19); assert.equal(volume('break'), .48);
  assert.equal(volume('bass'), 0);
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [1]);
  input.routeActions(actions({ move_right: { pressed: true, held: true } }));
  assert.equal(road.state.lane, 2, 'steering is immediate');
  mix(); assert.equal(volume('harmony'), 0, 'the queued part waits for the beat');
  w.audioSystem.context.currentTime = 0.51; mix();
  assert.equal(volume('harmony'), .32); assert.equal(volume('break'), .48);
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [1, 2]);
  input.routeActions(actions({ move_right: { pressed: true, held: true } }));
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [2, 3], 'third held part replaces oldest');
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [2], 'tap again releases the current lane');
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [2, 3]);
  w.audioSystem.context.currentTime = 1.01; mix();
  assert.equal(volume('break'), 0); assert(volume('harmony') > 0 && volume('lead') > 0);
  assert.equal(starts, 1, 'mixing does not restart a song');
  road.state.progress = 188;
  road.state.lane = 1; road.update(100);
  assert.equal(road.state.integrity, 2, 'traffic collides with the occupied lane');
  road.state.progress = 847; road.update(150);
  assert.equal(archive.record.current.checkpointId, 'road-cache');
  assert(road.restore(C.readResume()));
  assert.equal(road.state.progress, 850);
  road.state.lane = 0; road.state.progress = 2058; road.update(100);
  assert.equal(road.state.progress, 1910, 'clean copy route loops back');
  road.state.lane = 3; road.state.progress = 2058; road.update(100);
  assert.equal(archive.record.current.checkpointId, 'road-gate');
  road.state.progress = 2219; road.update(100);
  w.audioSystem.context.currentTime = 1.51; mix();
  assert(['bass', 'break', 'harmony', 'lead'].every(role => volume(role) > 0),
    'delivery payoff combines all four compatible parts');
  road.state.progress = 2458; road.update(100);
  assert.equal(road.status, 'clear');
  assert.equal(archive.record.current.checkpointId, 'road-clear');
  assert.deepEqual(copy(archive.record.progress.items), ['stem.voice']);
  assert(!archive.record.progress.completedLevels.includes('level-02'));
  assert(await road.exit());
  assert.equal(exitOptions.resume.levelId, 'level-01');
  assert.equal(exitOptions.resume.checkpointId, 'intermission');
  assert.equal(C.readResume().levelState.cacheRoadCheckpoint.checkpointId, 'road-clear');
  assert.deepEqual(copy(C.readResume().levelState.previewCheckpoint), parent.levelState.previewCheckpoint,
    'the old Level 3 checkpoint remains independent after the road trip');
  assert(C.validateLevel01Checkpoint(C.readResume()));
  assert.equal(archive.record.progress.items.includes('stem.bass'), false);
  const legacyLevel3 = { levelId: 'level-03', checkpointId: 'proof-start', levelState: {
    previewVersion: 2, returnTo: parent, proof: parent.levelState.previewCheckpoint.proof } };
  archive.checkpoint(legacyLevel3);
  assert.equal(C.readResume().levelId, 'level-03', 'an existing Level 3 title checkpoint still validates');
  // The lifecycle switches profiles when Continue opens the road, and restores
  // Level 1 audio/Voice without duplicating its completion award on exit.
  const saved = { levelId: 'level-02', checkpointId: 'road-cache', levelState: {
    proofVersion: 1, returnTo: level1Intermission(),
    proof: { progress: 850, lane: 2, locked: [1], integrity: 2 } } };
  archive.checkpoint(saved);
  w.initSector1Progression = () => { w.sector1Progression = {
    reset() {}, restoreCampaignCheckpoint() { w.gameState.victory = true; return true; }
  }; };
  w.initObjectives = () => {};
  w.audioSystem.prepareRestartAudio = async () => ({ ok: true });
  const selected = [];
  w.audioSystem.startRuntimeGameplayMusic = () => {
    selected.push(w.BARCODE.MusicProfiles.getActive().profileId);
    const result = w.BARCODE.MusicTransport.start({ sourceAnchorAudioSec: w.audioSystem.context.currentTime });
    return { ok: result.status === 'ok' && result.running };
  };
  load(context, 'src/core/runtime-lifecycle.js');
  assert((await w.BARCODE.RuntimeLifecycle.start({ resume: saved })).ok);
  assert(road.active); assert.equal(road.state.progress, 850);
  assert((await w.BARCODE.RuntimeLifecycle.pause('road-pause')).ok);
  assert((await w.BARCODE.RuntimeLifecycle.resume('road-resume')).ok);
  assert(await road.exit());
  assert.deepEqual(selected, ['level-02.proof', 'level-01.main']);
  assert.equal(C.intermission, true);
  assert.equal(w.gameState.victory, true);
  assert.equal(C.readResume().levelState.cacheRoadCheckpoint.checkpointId, 'road-cache');
  assert.equal(archive.record.progress.items.includes('stem.bass'), false);
  console.log('Cache road: aligned parts, lane locks and beat changes, hazards/gate, checkpoint, lifecycle pause/return and no Bass award passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
