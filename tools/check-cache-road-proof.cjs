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

async function realAudioSchedule() {
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
    audio.musicTracks[source.sourceId] = { buffer: { id: source.sourceId, duration: 187.5 }, volume: 0 };
  w.BARCODE.CacheRoadProof = { active: true, mixSnapshot: () => ({ lane: 0, locked: [], finalMix: false }) };
  assert(audio.startAllLayersSimultaneously().ok);
  assert.equal(starts.length, 4);
  assert(starts.every(s => s.time === 10.01 && s.offset === 0 && s.loop));
  ac.currentTime = 10.02; audio.updateLayers();
  assert.equal(audio.musicTracks['cache-bass'].volume, .28);
  w.BARCODE.CacheRoadProof.mixSnapshot = () => ({ lane: 2, locked: [0], finalMix: false });
  ac.currentTime = 10.2; audio.updateLayers();
  assert.equal(audio.musicTracks['cache-harmony'].volume, 0);
  ac.currentTime = 10.53; audio.updateLayers();
  assert.equal(audio.musicTracks['cache-harmony'].volume, .52);
  assert.equal(starts.length, 4, 'the real scheduler never restarts a muted part');

  const loading = new w.AudioSystem(), pending = [];
  loading.fetchMusicTrack = (name, url) => new Promise(resolve => pending.push({ name, url, resolve }));
  const allReady = loading.loadMusicTracks();
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(pending.map(item => item.name), ['cache-bass', 'cache-drums', 'cache-harmony', 'cache-fx'],
    'the four MP3 downloads start together before audio playback');
  pending.forEach(item => item.resolve());
  await allReady;
}

async function run() {
  await realAudioSchedule();
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
  assert.equal(profile.timeline.fixedGrid.quarterBpm, 128);
  assert.deepEqual(copy(profile.arrangement.sources.map(s => s.mixRole)), ['bass', 'drums', 'harmony', 'fx']);
  const encodedParts = [];
  for (const source of profile.arrangement.sources) {
    const bytes = fs.readFileSync(source.url);
    assert(source.url.endsWith('.mp3'));
    assert.equal(bytes.toString('ascii', 0, 3), 'ID3');
    assert(bytes.length > 3000000 && bytes.length < 4000000,
      'the converted MP3 is small enough for a web load');
    encodedParts.push(bytes);
  }
  assert(encodedParts.every(part => part.some(byte => byte !== 0)), 'all four parts have content');
  assert(!encodedParts[0].equals(encodedParts[1]) && !encodedParts[1].equals(encodedParts[2]) &&
    !encodedParts[2].equals(encodedParts[3]), 'lanes have distinct audio');
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
    [source.sourceId, { buffer: { duration: 187.5 }, isFallback: false,
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
  const actions = (overrides = {}) => ({ pause: { pressed: false }, move_left: {}, move_right: {},
    move_down: {}, inspect: {}, interact: {}, jump: {}, ...overrides });
  const director = w.BARCODE.musicDirector, mix = () => {
    assert(director.apply(w.audioSystem)); return copy(director.diagnostics().volumes);
  };
  const volume = id => w.audioSystem.musicTracks[`cache-${id}`].volume;
  mix();
  assert.equal(volume('drums'), .62); assert.equal(volume('fx'), 0);
  assert.equal(volume('bass'), 0);
  for (let i = 0; i < 10; i++) road.update(100);
  const cruise = road.state.progress;
  assert(road.state.speed >= 53 && cruise > 50,
    'the revised opening reaches a brisk cruise within one second');
  input.routeActions(actions({ jump: { pressed: true } }));
  for (let i = 0; i < 10; i++) road.update(100);
  assert(road.state.speed >= 70 && road.state.progress - cruise > cruise + 10,
    'turbo covers meaningfully more road than the opening cruise');
  road.state.progress = 0; road.state.speed = 54; road.state.boostMs = 0;
  road.state.invulnerableMs = 0; road.state.timeMs = 37000;
  road.state.lockEnergy = road.state.echoEnergy = 65;
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [1]);
  assert.equal(road.state.lockEnergy, 5, 'a lock spends earned charge');
  input.routeActions(actions({ move_right: { pressed: true, held: true } }));
  for (let i = 0; i < 5; i++) road.update(100);
  assert(road.state.lanePos > 1.8 && road.state.lanePos < 2.5,
    'steering is continuous across the band rather than snapping');
  assert.equal(road.state.lane, 2);
  mix(); assert.equal(volume('harmony'), 0, 'the queued part waits for the beat');
  w.audioSystem.context.currentTime = 0.51; mix();
  assert.equal(volume('harmony'), .52); assert.equal(volume('drums'), .62);
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [1], 'unearned repeated locks do not fill the whole song');
  road.state.lockEnergy = 100;
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [1, 2]);
  input.routeActions(actions({ move_right: { pressed: true, held: true } }));
  for (let i = 0; i < 5; i++) road.update(100);
  assert.equal(road.state.lane, 3);
  road.state.lockEnergy = 100;
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [1, 2, 3], 'three parts can be carried into a fourth band');
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [1, 2], 'tap again releases the current band');
  road.state.lockEnergy = 100;
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [1, 2, 3]);
  road.state.lanePos = 0; road.state.lane = 0; road.state.lockEnergy = 100;
  input.routeActions(actions({ inspect: { pressed: true } }));
  assert.deepEqual(copy(road.state.locked), [2, 3, 0], 'a fourth lock replaces the oldest');
  w.audioSystem.context.currentTime = 1.01; mix();
  assert.equal(volume('drums'), 0); assert(volume('harmony') > 0 && volume('fx') > 0);
  assert.equal(starts, 1, 'mixing does not restart a song');
  road.state.progress = 80; road.state.lanePos = 1.5; road.state.lane = 2;
  road.state.speed = 41; road.state.braking = true; road.update(100);
  assert(road.state.speed < 41 && road.state.progress > 80, 'braking sheds speed without stopping the race');
  road.state.braking = false;
  road.state.progress = 188;
  road.state.lanePos = 1; road.state.lane = 1; road.state.speed = 44; road.state.steer = 0;
  road.update(100);
  assert.equal(road.state.integrity, 2, 'freight collisions cost integrity');
  assert(road.state.speed < 44, 'collision also costs speed');
  road.state.progress = 847; road.state.speed = 44; road.update(100);
  assert.equal(archive.record.current.checkpointId, 'road-cache');
  assert(road.restore(C.readResume()));
  assert.equal(road.state.progress, 850);
  assert.equal(C.readResume().levelState.proofVersion, 2);
  const malformed = copy(C.readResume());
  malformed.levelState.proof.lanePos = 8;
  assert(!road.validate(malformed), 'bad lateral checkpoint values cannot enter the runtime');
  road.state.timeMs = 25; road.update(100);
  assert.equal(road.status, 'failed', 'an expired transmission window ends the stretch');
  assert(road.retry());
  assert.equal(road.state.progress, 850);
  assert(road.state.timeMs >= 30000 && road.state.echoEnergy === 100,
    'a nearby retry restores time and guarantees a chance to learn Echo');
  road.state.progress = 1698; road.update(100);
  assert.equal(C.readResume().checkpointId, 'road-fork');
  road.state.progress = 1701; road.state.nextRivalAt = 1800;
  road.state.lanePos = 1; road.state.lane = 1; road.state.rivalLane = 1;
  road.update(100);
  assert(road.state.rivalWarning);
  assert(Math.abs(road.state.rivalTarget - 1) < 0.1);
  road.state.lanePos = 3; road.state.lane = 3;
  road.update(100);
  assert(Math.abs(road.state.rivalTarget - 1) < 0.1,
    'a warned rival commits to a line, allowing a real dodge');
  road.state.progress = 1798; road.update(100);
  assert.equal(road.state.integrity, 3, 'leaving the warned line avoids the rival');
  road.state.progress = 1830; road.state.nextRivalAt = 1930;
  road.state.lanePos = 3; road.state.lane = 3; road.state.echoEnergy = 100;
  road.state.trace = [{ steer: 0, duration: 1800 }];
  road.update(100);
  input.routeActions(actions({ interact: { pressed: true } }));
  road.state.lanePos = 1; road.state.lane = 1;
  road.update(100);
  assert(road.state.rivalEchoCommitted, 'a fresh Echo redirects a committed rival');
  road.state.progress = 1928; road.update(100);
  assert.equal(road.state.echoDeceptions, 1, 'the physical split fools one attack');
  assert.equal(road.state.integrity, 3);
  road.state.lanePos = 0; road.state.lane = 0; road.state.progress = 2058; road.update(100);
  assert.equal(road.status, 'failed', 'missing the original exit stops the drive');
  assert.equal(road.state.gateFailure, 'wrong-lane');
  assert(road.state.progress >= 2058, 'a missed exit never teleports the car backward');
  const missedAt = road.state.progress;
  road.update(100);
  assert.equal(road.state.progress, missedAt, 'the road waits for an explicit retry');
  assert.equal(C.readResume().checkpointId, 'road-fork', 'the nearby marker remains saved');
  assert(road.keyDown({ key: 'Enter', preventDefault() {} }));
  assert.equal(road.status, 'playing');
  assert.equal(road.state.progress, 1700, 'retry is the only deliberate return to the marker');
  assert.equal(road.state.echoEnergy, 100, 'retry replenishes Echo');
  road.state.progress = 2058; road.state.lanePos = 3; road.state.lane = 3;
  road.state.echo = null; road.update(100);
  assert.equal(road.state.gateFailure, 'no-echo', 'the result explains a missing or expired Echo');
  assert(road.retry());
  road.state.progress = 1841; road.state.lanePos = 1; road.state.lane = 1;
  road.state.trace = [{ steer: 0, duration: 1800 }];
  input.routeActions(actions({ interact: { pressed: true } }));
  assert.equal(road.state.echo.durationMs, 6000, 'the final cue has time for a real split');
  assert.equal(road.state.echoEnergy, 0);
  road.state.lanePos = 3; road.state.lane = 3; road.state.steer = 0; road.state.speed = 54;
  while (road.state.progress < 2060 && road.status === 'playing') road.update(100);
  assert.equal(archive.record.current.checkpointId, 'road-gate');
  assert.equal(road.state.gateOpen, true, 'divergent Echo opens the original route');
  assert(road.state.echo && road.state.echo.ageMs < 6000,
    'an Echo sent when the exit cue appears survives the drive to the scanner');
  road.state.locked = []; road.state.lanePos = 3; road.state.lane = 3;
  road.state.progress = 2219; road.update(100);
  w.audioSystem.context.currentTime = 1.51; mix();
  assert.equal(volume('bass'), 0, 'the finish does not force a full mix');
  road.state.locked = [0, 1, 2]; w.audioSystem.context.currentTime = 2.01; mix();
  assert(['bass', 'drums', 'harmony', 'fx'].every(role => volume(role) > 0),
    'a skilled driver can combine all four parts');
  road.state.progress = 2458; road.update(100);
  assert.equal(road.status, 'clear');
  assert.equal(archive.record.current.checkpointId, 'road-clear');
  assert.deepEqual(copy(archive.record.progress.items), ['stem.voice']);
  assert(!archive.record.progress.completedLevels.includes('level-02'));
  assert(await road.exit());
  assert.equal(exitOptions.resume.levelId, 'level-01');
  assert.equal(exitOptions.resume.checkpointId, 'intermission');
  assert.equal(C.readResume().levelState.cacheRoadCheckpoint.checkpointId, 'road-clear');
  assert.equal(C.readResume().levelState.cacheRoadCheckpoint.proofVersion, 2);
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
  assert(road.validate(saved), 'the first lane-music proof saves remain loadable');
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
  console.log('Cache road: driving/brake, earned mix locks, Echo gate, traffic, aligned parts, checkpoint, lifecycle and no Bass award passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
