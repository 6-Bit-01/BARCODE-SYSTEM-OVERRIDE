// Full 100-bar Cache Road contract using the production profile, director,
// transport, save adapter and road update. Audible quality needs owner review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { createRig, load } = require('./check-level-01-boss');
const copy = value => JSON.parse(JSON.stringify(value));

function parentSave() {
  return { levelId: 'level-01', checkpointId: 'intermission', levelState: {
    difficultyId: 'standard', run: { levelId: 'level-01', runId: 'road-parent', recoveryMode: 'checkpoints',
      elapsedMs: 120000, damageTaken: 1, retries: 0, attempts: 18, accurate: 14, perfect: 8,
      connected: 9, connectedPerfect: 5, completed: true },
    score: 2400, bestCombo: 8, health: 3, playerX: 3500,
    fragments: [], skyCaches: [], ampCharges: 1,
    boss: { bossX: 3480, playerX: 3500, score: 2400, skyCaches: [] }, result: { score: 2400 }
  } };
}

async function run() {
  const { w, context } = createRig();
  load(context, 'src/game/lore-collection.js');
  w.lostDataSystem.archive = new w.BARCODE.LoreCollection();
  load(context, 'src/game/campaign-services.js');
  load(context, 'src/engine/cache-road-proof-profile.js');
  load(context, 'src/engine/music-director.js');
  load(context, 'src/engine/audio.js');
  load(context, 'src/game/cache-road-proof.js');
  const B = w.BARCODE, profile = B.MusicProfiles.select('level-02.proof');
  const road = B.CacheRoadProof, C = B.Campaign;
  assert(profile && B.MusicTransport.load(profile.profileId).status === 'ok');
  assert.deepEqual(copy(profile.arrangement.sources.map(s => s.mixRole)),
    ['drive', 'pressure', 'flow', 'breakaway', 'undercurrent']);
  assert.deepEqual(copy(profile.laneMix.laneRoles), ['drive', 'flow', 'breakaway', 'undercurrent']);
  assert.equal(profile.laneMix.backboneRole, 'pressure');
  for (const part of profile.arrangement.sources) {
    const bytes = fs.readFileSync(part.url);
    assert(bytes.length > 3000000 && bytes.toString('ascii', 0, 3) === 'ID3', part.url);
    assert(part.required && part.backupUrl.includes('b0b26df3ca3289a24163f6b198072ea0de1429af'));
  }
  const audio = new w.AudioSystem(), starts = [], ramps = [], busEvents = [];
  const param = value => ({ value, cancelAndHoldAtTime() {}, cancelScheduledValues() {},
    setValueAtTime(v, at) { this.value = v; busEvents.push({ v, at }); },
    linearRampToValueAtTime(v, at) { this.value = v; busEvents.push({ v, at }); } });
  audio.context = { currentTime: 0, state: 'running', createGain() { return { gain: param(1), connect() {}, disconnect() {} }; },
    createBufferSource() { return { connect() {}, start(at, offset) { starts.push({ at, offset }); }, stop() {} }; } };
  audio.musicGain = audio.context.createGain(); audio.initialized = true;
  audio.rampAdaptiveStemGain = (track, volume, duration) => {
    ramps.push({ role: track.role, at: audio.context.currentTime, volume, duration });
    track.volume = volume; track.gain.gain.value = volume;
  };
  for (const part of profile.arrangement.sources)
    audio.musicTracks[part.sourceId] = { role: part.mixRole, buffer: { duration: 187.5 }, volume: 0 };
  w.audioSystem = audio;
  road.active = true; road.state = { lane: 1, lanePos: 1, captures: [], musicBar: 0 };
  assert(audio.startAllLayersSimultaneously().ok);
  assert.equal(starts.length, 5);
  assert.equal(new Set(starts.map(s => `${s.at}/${s.offset}`)).size, 1);
  const volume = role => audio.musicTracks[`cache-${role}`].volume;
  const tick = (bar, lane, captures = []) => {
    road.state.lane = lane; road.state.captures = captures;
    audio.context.currentTime = .01 + bar * 1.875;
    assert(B.musicDirector.apply(audio));
  };
  tick(0, 1);
  assert(volume('pressure') === .60 && volume('drive') === .10);
  assert(volume('flow') === 0 && volume('breakaway') === 0 && volume('undercurrent') === 0);
  tick(4, 1);
  assert(volume('flow') === .18 && volume('pressure') === .60);
  tick(4.5, 1, [{ lane: 1, startBeat: 16, endBeat: 32 }]);
  assert.equal(volume('flow'), .55, 'aligned phrase becomes audible when it begins');
  tick(4.6, 3, [{ lane: 1, startBeat: 16, endBeat: 32 }]);
  assert.equal(volume('flow'), .55, 'changing lanes carries the committed phrase');
  tick(8, 3);
  assert.equal(volume('flow'), .18, 'expired phrase returns to the steady bed');
  road.state.previewLane = 0; road.state.previewBeat = 1;
  tick(.2, 0); assert.equal(volume('drive'), .10, 'preview waits for a beat');
  tick(.3, 0); assert.equal(volume('drive'), .19, 'held lane previews without a seal');
  road.state.previewLane = null; road.state.previewBeat = null;
  tick(.4, 3); assert.equal(volume('drive'), .10, 'preview leaves with the lane');
  tick(8, 2, [{ lane: 2, startBeat: 32, endBeat: 48 },
    { lane: 3, startBeat: 32, endBeat: 48 }]);
  assert.equal(volume('breakaway'), .50, 'soft Breakaway verse A is selectable');
  assert.equal(volume('undercurrent'), .62, 'recorded Undercurrent verse A is not masked');
  tick(12.5, 2, [{ lane: 2, startBeat: 48, endBeat: 64, sealed: true },
    { lane: 3, startBeat: 48, endBeat: 64 }]);
  assert.equal(volume('breakaway'), .50);
  assert.equal(volume('undercurrent'), .62);
  tick(20, 3, [0, 1, 2, 3].map(lane => ({ lane, startBeat: 80, endBeat: 96 })));
  assert(volume('undercurrent') === .62 && volume('flow') === .55 &&
    volume('drive') === .19 && volume('pressure') === .60,
  'four caught parts stack over steady Pressure');
  for (const [bar, half] of [[28, 'verseA'], [36, 'verseB'], [44, 'chorus'],
    [52, 'verseA'], [76, 'verseA'], [92, 'chorus'], [99, 'chorus']]) {
    tick(bar, 1);
    assert.equal(B.musicDirector.state.half, half, `bar ${bar + 1}`);
    assert(volume('pressure') === .60 && volume('drive') === .10);
  }
  assert(ramps.some(r => r.duration === .22) && ramps.some(r => r.duration === .38),
    'phrases and previews rise quickly and trail smoothly');
  assert.equal(starts.length, 5, 'arrangement never restarts a playing stem');

  const archive = w.lostDataSystem.archive;
  archive.record.progress.completedLevels.push('level-01');
  archive.record.progress.items.push('stem.voice');
  archive.checkpoint(parentSave()); C.intermission = true;
  w.audioSystem.prepareActiveMusicProfile = async () => ({ ok: true });
  w.audioSystem.stopRuntimeAudio = () => { B.MusicTransport.stop(); B.musicDirector.reset(); };
  w.audioSystem.startRuntimeGameplayMusic = () => {
    const result = B.MusicTransport.start({ sourceAnchorAudioSec: audio.context.currentTime,
      sourceOffsetTrackSec: road.startOffsetSec() });
    return { ok: result.status === 'ok' && result.running };
  };
  w.inputManager = { resetActionEdges() {} };
  w.BARCODE.RuntimeLifecycle = { async restart() { road.dispose(); return { ok: true }; } };
  w.audioSystem.musicTracks = Object.fromEntries(profile.arrangement.sources.map(s =>
    [s.sourceId, { buffer: { duration: 187.5 }, isFallback: false }]));
  road.active = false; road.state = null;
  audio.context.currentTime = 0;
  assert((await road.enter()).ok);
  assert.equal(C.readResume().levelState.proofVersion, 4);
  const roadStart = copy(C.readResume());
  const liveState = road.state, oldArt = B.PresentationAssets;
  const mirrorFrames = [], roadArt = [], openingRects = [];
  B.PresentationAssets = { ready(key) { return key.startsWith('cache'); },
    draw(key, _ctx, options) {
    if (key === 'cacheMirror') mirrorFrames.push({ frame: options.frame,
      sourceRect: options.sourceRect, x: options.x, y: options.y });
    else roadArt.push({ key, ...options });
    return true;
  } };
  const paint = { addColorStop() {} };
  const drawCtx = new Proxy({ createLinearGradient: () => paint,
    createRadialGradient: () => paint,
    fillRect(x, y, width, height) {
      if (x === 30 && y === 176 && width > 100) openingRects.push([width, height]);
    } }, { get(target, key) { return key in target ? target[key] : () => {}; },
    set(target, key, value) { target[key] = value; return true; } });
  const mirrorFrame = overrides => {
    road.state = { ...liveState, progress: 395, integrity: 3, timeMs: 55000,
      stumbleMs: 0, boostMs: 0, zoneEndBeat: -1, pendingCapture: null,
      candidateHold: 0, cutFlashMs: 0, messageMs: 0, rivalWarning: false,
      ...overrides };
    mirrorFrames.length = 0; roadArt.length = 0; openingRects.length = 0; road.draw(drawCtx);
    assert.equal(mirrorFrames.length, 1, 'one expression is drawn inside the shared rearview');
    assert.deepEqual(Array.from(mirrorFrames[0].sourceRect), [0, 150, 450, 185]);
    assert.equal(mirrorFrames[0].x, 833, 'the completed face sits inside the driver side');
    return mirrorFrames[0].frame;
  };
  assert.equal(mirrorFrame({}), 0);
  assert(roadArt.some(entry => entry.key === 'cacheDistantCity') &&
    roadArt.some(entry => entry.key === 'cacheSkyline') &&
    roadArt.some(entry => entry.key === 'cacheMidCity') &&
    roadArt.some(entry => entry.key === 'cacheParapet') &&
    roadArt.some(entry => entry.key === 'cachePylon') &&
    roadArt.some(entry => entry.key === 'cacheFly1') &&
    roadArt.some(entry => entry.key === 'cacheFly3') &&
    roadArt.some(entry => entry.key === 'cacheBlacktop') &&
    roadArt.some(entry => entry.key === 'cacheCar'),
  'three city depths, roadside art, flying traffic, road and car share the live draw');
  assert.deepEqual(openingRects, [], 'the objective disappears between actionable lessons');
  mirrorFrame({ steer: -1 });
  assert(roadArt.some(entry => entry.key === 'cacheCarRight'), 'left steering uses the corrected visible turn');
  mirrorFrame({ steer: 1 });
  assert(roadArt.some(entry => entry.key === 'cacheCarLeft'), 'right steering uses the corrected visible turn');
  assert.equal(mirrorFrame({ pendingCapture: { lane: 1, startBeat: 8 } }), 1);
  assert.equal(mirrorFrame({ boostMs: 600 }), 2);
  assert.equal(mirrorFrame({ cutFlashMs: 500 }), 3);
  assert.equal(mirrorFrame({ stumbleMs: 650, integrity: 1 }), 4,
    'a hit overrides low signal during the collision');
  assert(roadArt.some(entry => entry.key === 'cacheCarHit'), 'collision uses its jolt pose');
  assert.equal(mirrorFrame({ integrity: 1 }), 5);
  mirrorFrame({ progress: 60 });
  assert.deepEqual(openingRects, [[875, 82]], 'the opening panel remains compact');
  road.state = liveState; B.PresentationAssets = oldArt;
  assert.match(road.openingCue()[0], /HOLD A LANE/,
    'the opening gives a driving instruction without stopping play');
  audio.context.currentTime = 2 * 1.875 + .1; // intro bar 3
  road.state.lane = road.state.lanePos = 2;
  road.update(100);
  const unspent = road.state.lockEnergy;
  audio.context.currentTime += .25; road.update(100);
  assert(road.state.candidateHold > .45 && road.state.candidateHold < .55,
    'the lane legend fills during the half-second hold');
  audio.context.currentTime += .30; road.update(100);
  assert.deepEqual(copy(road.state.pendingCapture), { lane: 2, startBeat: 12, endBeat: 16 },
    'the softer recorded part is chosen for the next bar without traffic');
  assert.match(road.openingCue()[1], /Press E/,
    'the hold lesson gives way to the E/RB lesson once the music choice works');
  assert.equal(road.state.captures.length, 0, 'the part waits for the visible bar boundary');
  assert.equal(road.state.lockEnergy, unspent, 'choosing music does not spend Zone');
  road.state.lane = road.state.lanePos = 3;
  audio.context.currentTime += .1; road.update(100);
  audio.context.currentTime += .55; road.update(100);
  assert.equal(road.state.pendingCapture.lane, 3, 'the last hold in a bar replaces its choice');
  road.cleanPass(true);
  assert.equal(road.state.queuedCaptures.length, 0,
    'a tight traffic pass rewards driving without secretly adding a music part');
  assert.equal(road.state.captures.length, 0);
  road.state.lane = road.state.lanePos = 0;
  audio.context.currentTime += .1; road.update(100);
  assert.equal(road.state.pendingCapture.lane, 3, 'dodging does not cancel the choice');
  audio.context.currentTime = 3 * 1.875 + .01; road.update(100);
  assert.deepEqual(copy(road.state.captures.map(({ lane, startBeat, endBeat }) =>
    ({ lane, startBeat, endBeat }))), [{ lane: 3, startBeat: 12, endBeat: 16 }]);
  assert.equal(road.state.peakStack, 1, 'three visits in one bar add only one part');
  road.state.lane = road.state.lanePos = 2;
  audio.context.currentTime += .1; road.update(100);
  audio.context.currentTime += .55; road.update(100);
  assert.deepEqual(copy(road.state.pendingCapture), { lane: 2, startBeat: 16, endBeat: 32 });
  road.state.boostMs = 1000;
  road.cleanPass(false);
  assert.equal(road.state.captures.length, 1, 'Turbo traffic does not change the chosen part');
  road.state.boostMs = 0;
  audio.context.currentTime = 4 * 1.875 + .01; road.update(100);
  assert.deepEqual(copy(road.state.captures.map(c => c.lane)), [2],
    'the verse starts with the deliberate last-bar choice; the intro part expires');
  assert.equal(road.state.pendingCapture, null,
    'crossing the bar line does not immediately choose the same lane again');
  road.state.lane = road.state.lanePos = 0;
  audio.context.currentTime += .1; road.update(100);
  assert.equal(road.state.pendingCapture, null,
    'dodging just after the beat cannot silently extend the last-bar choice');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  audio.context.currentTime = 2 * 1.875 + .1;
  road.state.lane = road.state.lanePos = 1;
  road.update(100);
  const zoneBeforeFlow = road.state.lockEnergy;
  audio.context.currentTime += .55; road.update(100);
  assert.deepEqual(copy(road.state.pendingCapture), { lane: 1, startBeat: 12, endBeat: 16 },
    'a hold chooses Flow for the next intro bar');
  assert.equal(road.state.queuedCaptures.length, 0);
  assert.equal(road.state.lockEnergy, zoneBeforeFlow, 'a hold does not spend Zone');
  for (let i = 0; i < 5; i++) {
    audio.context.currentTime += .05;
    road.handleActions({ inspect: { pressed: true } }); road.update(50);
  }
  assert.equal(road.state.opening.sealed, true);
  assert.doesNotMatch(road.openingCue()[1], /Press E/,
    'the E/RB instruction leaves when a part is actually sealed');
  assert.equal(road.state.lockEnergy, zoneBeforeFlow, 'RB does not spend Zone');
  assert.equal(road.state.queuedCaptures.length, 1, 'RB cannot duplicate a queued phrase');
  audio.context.currentTime += 1; road.update(100);
  assert.equal(road.state.queuedCaptures[0].endBeat, 32,
    'a long hold cannot silently extend the button to more sections');
  road.update(100);
  assert.equal(road.state.captures.length, 1,
    'RB immediately stamps the current intro remainder too');
  audio.context.currentTime = 4 * 1.875 + .01;
  road.update(100);
  assert.equal(road.state.captures[0].startBeat, 16);
  assert.equal(road.state.captures[0].endBeat, 32);
  assert.equal(road.state.peakStack, 1);
  audio.context.currentTime += .23;
  road.handleActions({ inspect: { pressed: true } }); road.update(100);
  assert.equal(road.state.captures[0].endBeat, 32, 'RB keeps the current recorded bars');
  assert.deepEqual(copy(road.state.queuedCaptures.map(({ lane, startBeat, endBeat }) =>
    ({ lane, startBeat, endBeat }))), [{ lane: 1, startBeat: 32, endBeat: 48 }],
    'RB immediately queues the next aligned four bars as well');
  audio.context.currentTime = 8 * 1.875 + .01; road.update(100);
  assert.equal(road.state.captures[0].startBeat, 32);
  assert.equal(road.state.queuedCaptures.length, 0);
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.musicBar = 24; road.state.scoredThrough = 23;
  road.state.lane = road.state.lanePos = 2;
  audio.context.currentTime = 24 * 1.875 + .1;
  road.handleActions({ inspect: { pressed: true } });
  assert.equal(road.state.captures[0].endBeat, 112, 'RB still catches a recorded chorus remainder');
  assert.equal(road.state.queuedCaptures.length, 1,
    'the next verse A Breakaway passage is quiet but recorded');
  assert.equal(road.state.message, 'BREAKAWAY // NOW + NEXT 4 SEALED',
    'RB confirms both the current and upcoming recorded bars');
  road.state.lane = road.state.lanePos = 3;
  road.handleActions({ inspect: { pressed: true } });
  assert.equal(road.state.queuedCaptures.length, 1,
    'a second RB in the same four bars cannot stamp another lane');
  assert.equal(road.state.message, 'E/RB // READY NEXT 4 BARS');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.lockEnergy = 0;
  road.state.musicBar = 20; road.state.scoredThrough = 19;
  audio.context.currentTime = 20 * 1.875 + .15;
  for (let lane = 0; lane < 4; lane++) {
    road.state.lane = road.state.lanePos = lane;
    road.handleActions({ inspect: { pressed: true } });
  }
  assert.equal(road.state.captures.length, 1, 'RB stamps one lane per four-bar section');
  assert.equal(road.state.queuedCaptures.length, 1, 'the button alone cannot build four parts');
  assert.equal(road.state.peakStack, 1);
  assert.equal(road.state.lockEnergy, 0, 'RB does not spend Zone');
  const stacked = copy(road.state.queuedCaptures);
  for (let tap = 0; tap < 10; tap++) road.handleActions({ inspect: { pressed: true } });
  assert.deepEqual(copy(road.state.queuedCaptures), stacked, 'repeated RB in one lane is idempotent');
  audio.context.currentTime = 24 * 1.875 + .01; road.update(100);
  assert.equal(road.state.captures.length, 1, 'the button carries one part across the boundary');
  assert.equal(road.state.zoneEndBeat, -1, 'a few clean bars alone do not trigger Zone');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  // Isolate the music grid from collisions here; real traffic and steering
  // are exercised below. Every selection is made before its next downbeat.
  road.state.musicBar = 20; road.state.scoredThrough = 19;
  road.state.invulnerableMs = 10000; road.state.lockEnergy = 0;
  road.state.lane = road.state.lanePos = 2;
  audio.context.currentTime = 20 * 1.875 + .05;
  road.handleActions({ inspect: { pressed: true } });
  for (const [bar, lane, expected] of [[20, 3, 2], [21, 0, 3], [22, 1, 4]]) {
    road.state.lane = road.state.lanePos = lane;
    audio.context.currentTime = bar * 1.875 + .1; road.update(100);
    audio.context.currentTime += .55; road.update(100);
    assert.equal(road.state.pendingCapture.lane, lane);
    assert.equal(road.state.pendingCapture.startBeat, (bar + 1) * 4);
    if (bar === 20) {
      for (let tap = 0; tap < 8; tap++) road.handleActions({ inspect: { pressed: true } });
      assert.equal(road.state.captures.length, 1, 'RB spam does not add parts');
    }
    road.state.lane = road.state.lanePos = 2; // dodge after choosing
    audio.context.currentTime = (bar + 1) * 1.875 + .01; road.update(100);
    assert.equal(road.state.captures.length, expected,
      'one new choice joins on its bar boundary and survives the dodge');
    assert.equal(road.state.peakStack, expected);
  }
  assert.equal(road.state.lockEnergy, 3, 'only the three completed clean bars charged Zone');
  audio.context.currentTime = 24 * 1.875 + .01; road.update(100);
  assert.equal(road.state.captures.length, 1, 'the brief four-part stack ends at the section edge');
  assert.equal(road.state.captures[0].lane, 2, 'the one RB carry remains into the next section');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.musicBar = 22; road.state.scoredThrough = 21;
  road.state.invulnerableMs = 10000;
  road.state.lane = road.state.lanePos = 2;
  audio.context.currentTime = 22 * 1.875 + .1; road.update(100);
  audio.context.currentTime += .55; road.update(100);
  assert.deepEqual(copy(road.state.pendingCapture), { lane: 2, startBeat: 92, endBeat: 96 });
  audio.context.currentTime = 23 * 1.875 + .01; road.update(100);
  assert.equal(road.state.captures[0].endBeat, 96);
  assert.equal(road.state.pendingCapture, null, 'the new bar starts a fresh hold timer');
  road.state.lane = road.state.lanePos = 0;
  audio.context.currentTime += .1; road.update(100);
  audio.context.currentTime = 24 * 1.875 + .01; road.update(100);
  assert.equal(road.state.captures.length, 0,
    'a last-bar choice expires at the section edge if the player dodges after the beat');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.lockEnergy = 0;
  road.state.progress = 130; road.state.lane = road.state.lanePos = road.state.visualLane = 1;
  road.state.musicBar = 10; road.state.musicBeatFloat = 40; road.state.scoredThrough = 9;
  road.state.speed = 54;
  const beforeCut = road.state.score;
  let cutAt = null;
  for (let frame = 0; frame < 50; frame++) {
    audio.context.currentTime = 10 * 1.875 + .05 + frame * .05;
    const steer = road.state.progress >= 166 && road.state.lanePos > .18;
    road.handleActions({ move_left: { held: steer } });
    road.update(50);
    if (road.state.cutStreak && cutAt === null) cutAt = Number(audio.context.currentTime.toFixed(2));
  }
  assert(cutAt !== null, 'a close steering escape still rewards actual driving');
  assert(road.state.score >= beforeCut + 150, 'cutline scores above a passive adjacent pass');
  assert.equal(road.state.queuedCaptures.length, 0, 'a cut does not secretly carry a part');
  assert(road.state.lockEnergy >= 60, 'the cut still charges Zone for the next phrase');
  assert.equal(road.state.pendingCapture.startBeat, 48,
    'a held lane in the last bar visibly schedules the next section');
  const windowBeforeZone = road.state.timeMs;
  road.state.invulnerableMs = 10000;
  audio.context.currentTime = 12 * 1.875 + .01; road.update(100);
  assert.equal(road.state.zoneEndBeat, 64, 'Zone starts at the aligned four-bar boundary');
  assert.equal(road.state.captures.length, 1, 'the choice, not the cut, starts the part');
  assert(road.state.timeMs > windowBeforeZone + 1300, 'Zone returns time to the driving window');
  assert(road.state.speed > 54, 'the Zone section accelerates the car');
  assert(road.state.lockEnergy < 60, 'one entry spends the Zone reward only once');
  road.state.invulnerableMs = 0; road.state.boostMs = 0;
  const busBeforeHit = busEvents.length;
  road.hit('van');
  const hitBusEvents = busEvents.slice(busBeforeHit);
  assert.equal(road.state.captures.length, 0);
  assert.equal(road.state.pendingCapture, null, 'a hit erases the upcoming choice too');
  assert.equal(road.state.hitRecovery, true);
  assert.equal(road.state.stumbleMs, 650);
  assert.equal(road.state.messageMs, 0, 'traffic hit cannot show a popup');
  assert.equal(road.state.zoneEndBeat, -1, 'the hit interrupts Zone');
  assert(hitBusEvents.some(event => event.v === 0), 'the miss briefly drops the music bus to silence');
  const recoveredAt = hitBusEvents.find(event => event.v === .8)?.at;
  assert(Number.isFinite(recoveredAt), 'music bus recovers after the stumble');
  const recoveredBeat = B.MusicTransport.sample(recoveredAt).grid.beatFloat;
  assert(Math.abs(recoveredBeat - Math.round(recoveredBeat)) < .001,
    'the bus returns on the unchanged song beat');
  assert(B.musicDirector.apply(audio));
  assert.equal(B.musicDirector.getVolume('cache-pressure'), .60,
    'the drum clock survives the hit');
  assert.equal(B.musicDirector.getVolume('cache-drive'), 0,
    'the former bed does not disguise the lost stack');
  assert.equal(B.musicDirector.getVolume('cache-flow'), 0);
  const recoveryScore = road.state.score, recoveryZone = road.state.lockEnergy;
  road.cleanPass(false);
  assert.equal(road.state.score, recoveryScore,
    'a pass during hit invulnerability is not reported as clean');
  assert.equal(road.state.lockEnergy, recoveryZone);
  // A lane-centered adjacent pass should count even with natural steering
  // drift; one lane plus 0.2 away from the traffic remains a close pass.
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 185; road.state.speed = 54;
  road.state.lane = 2; road.state.lanePos = 2.2;
  const nearScore = road.state.score;
  audio.context.currentTime = .1; road.handleActions({}); road.update(100);
  assert.equal(road.state.integrity, 3);
  assert(road.state.score >= nearScore + 25 && road.state.nearMisses === 1,
    'an adjacent pass with 0.2 lane steering drift counts and is reported');
  assert.match(road.state.message, /NEAR MISS/);
  assert.equal(road.state.captures.length, 0, 'a near miss is a driving bonus, not a music gate');
  // A three-lane gate leaves a visible open route, but camping in one of its
  // blocked lanes still costs integrity. Both cases use production collision.
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 970; road.state.lanePos = road.state.lane = 0;
  road.state.speed = 54; road.state.invulnerableMs = 0;
  audio.context.currentTime = 20; road.handleActions({}); road.update(100);
  assert.equal(road.state.integrity, 3, 'gate at 975 leaves lane zero open');
  road.state.progress = 970; road.state.lanePos = road.state.lane = 1;
  road.state.speed = 54; road.state.invulnerableMs = 0;
  road.state.nearMisses = 1; road.state.boost = 0;
  const gateScore = road.state.score, gateEcho = road.state.echoEnergy;
  const gateZone = road.state.lockEnergy;
  audio.context.currentTime += .1; road.handleActions({}); road.update(100);
  assert.equal(road.state.integrity, 2, 'the paired traffic blocks lane one');
  assert.equal(road.state.score, gateScore, 'the neighboring gate vehicle pays no pass after contact');
  assert.equal(road.state.echoEnergy, gateEcho);
  assert.equal(road.state.lockEnergy, gateZone);
  assert.equal(road.state.nearMisses, 0);
  assert.equal(road.state.boost, 0, 'a gate collision cannot grant Turbo from a prior near miss');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 970; road.state.lanePos = road.state.lane = 2;
  road.state.speed = 54; road.state.invulnerableMs = 0;
  road.state.musicBar = 10; road.state.scoredThrough = 9;
  road.state.boost = 0;
  const secondGateScore = road.state.score;
  audio.context.currentTime = 20; road.handleActions({}); road.update(100);
  assert.equal(road.state.integrity, 2, 'lane two collides with the paired gate');
  assert.equal(road.state.score, secondGateScore,
    'an earlier neighbor is not rewarded before a later vehicle at the same crossing hits');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  for (let frame = 1; frame <= 300 && road.status === 'playing'; frame++) {
    audio.context.currentTime = frame / 10;
    road.handleActions({ inspect: { pressed: true } }); road.update(100);
  }
  assert.equal(road.status, 'failed', 'camping a lane cannot survive the authored traffic');
  assert(road.state.musicBar <= 12 && road.state.peakStack < 4,
    'RB spam and passive camping cannot build a four-lane multiplier');
  audio.context.currentTime = 0; assert(road.retry());
  road.state.progress = 980; road.state.lane = road.state.lanePos = 0;
  road.state.echoEnergy = 100;
  road.sendEcho();
  audio.context.currentTime = 18.2;
  road.handleActions({ move_right: { held: true } }); road.update(100);
  assert.equal(road.state.audits[1135], 0,
    'Echo draws the approaching audit into its lane before the driver splits away');
  assert.equal(road.state.echoEnergy, 0, 'the decoy is a charged tactical choice');
  road.state.progress = 500; road.state.boost = 1;
  assert.match(road.openingCue()[1], /Press SPACE/);
  road.handleActions({ jump: { pressed: true } });
  assert.equal(road.state.boostMs, 1250);
  assert.doesNotMatch(road.openingCue()[1], /Press SPACE/,
    'the Turbo prompt leaves after the real input spends the burst');
  // The first marker is a repeatable road lesson: it saves a ready Echo, and
  // the audit follows the actual decoy before the driver leaves that lane.
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 845; road.state.lane = road.state.lanePos = road.state.visualLane = 0;
  road.state.speed = 54; road.state.echoEnergy = 0;
  audio.context.currentTime = 19;
  road.handleActions({}); road.update(100);
  assert(road.state.progress >= 850 && road.state.echoEnergy === 100);
  const firstMarker = copy(C.readResume());
  assert.equal(firstMarker.checkpointId, 'road-cache');
  assert(road.validate(firstMarker), 'the first authored road marker must reload from Continue');
  assert.equal(firstMarker.levelState.proof.echoEnergy, 100);
  assert.match(road.openingCue()[1], /Press H/);
  const oldSettings = B.ControllerSettings, oldGamepad = B.GamepadUI;
  B.GamepadUI = { connected: true };
  B.ControllerSettings = { prompt(action) { return { inspect: 'R1', jump: 'CROSS', interact: 'TRIANGLE' }[action]; } };
  assert.match(road.openingCue()[1], /TRIANGLE/,
    'the road prompt respects a connected controller binding');
  B.ControllerSettings = oldSettings; B.GamepadUI = oldGamepad;
  road.handleActions({ interact: { pressed: true } });
  assert.equal(road.state.echo.durationMs, 6000);
  assert.doesNotMatch(road.openingCue()[1], /Press H/);
  for (let frame = 0; frame < 27 && road.state.progress < 978; frame++) {
    audio.context.currentTime += .1;
    road.handleActions({ move_left: { held: true } }); road.update(100);
  }
  assert.equal(road.state.integrity, 3, 'holding the left gap passes the three-wide block');
  assert.equal(road.state.audits[1135], 0,
    'the audit commits to the Echo from the reachable first marker');
  assert.match(road.openingCue()[0], /FOLLOWED YOUR ECHO/);
  for (let frame = 0; frame < 30 && road.state.progress < 1137; frame++) {
    audio.context.currentTime += .1;
    road.handleActions({ move_right: { held: road.state.lanePos < 1.15 } }); road.update(100);
  }
  assert.equal(road.state.integrity, 3, 'leaving the Echo lane safely clears the first audit');
  assert(road.restore(firstMarker));
  assert.equal(road.state.echoEnergy, 100, 'Continue restores the first Echo opportunity');
  assert.match(road.openingCue()[1], /Press H/);
  road.state.progress = 1710;
  assert.equal(road.openingCue(), null, 'opening instructions end after the first stretch');
  archive.checkpoint(roadStart);
  road.status = road.state.status = 'failed';
  audio.context.currentTime = 0;
  assert(road.retry());
  road.state.invulnerableMs = 1000000;
  const visited = new Set(); let sent = false, minLane = 3, maxLane = 0;
  let verseFourSave, firstForkSave;
  for (let frame = 1; frame <= 1880 && road.status === 'playing'; frame++) {
    audio.context.currentTime = frame / 10;
    road.handleActions({ move_left: { held: frame < 36 },
      move_right: { held: frame >= 36 && frame < 86 || sent && road.state.lanePos < 2.95 } });
    road.update(100);
    minLane = Math.min(minLane, road.state.lanePos);
    maxLane = Math.max(maxLane, road.state.lanePos);
    if (!firstForkSave && road.state.progress >= 1700 && road.state.progress < 1710)
      firstForkSave = copy(C.readResume());
    if (road.state.musicBar === 28 || road.state.musicBar === 52 || road.state.musicBar === 76)
      visited.add(road.state.musicBar);
    if (road.state.musicBar === 76 && !verseFourSave) verseFourSave = copy(C.readResume());
    if (road.state.gateAt != null && !sent && road.state.progress >= road.state.gateAt - 200) {
      road.state.lanePos = road.state.lane = 0; road.state.trace = [{ steer: 0, duration: 1500 }];
      road.sendEcho(); road.state.lanePos = road.state.lane = 3; sent = true;
    }
  }
  assert.deepEqual([...visited], [28, 52, 76], 'the road spans all four verses and choruses');
  assert.equal(firstForkSave.checkpointId, 'road-fork');
  assert(road.validate(firstForkSave), 'the second road marker also remains a valid Continue save');
  assert(minLane < .1 && maxLane > 2.8, 'real steering traverses both sides while music continues');
  assert(sent && road.state.gateOpen, `the final chorus offers a reachable Echo exit: ${JSON.stringify({ sent, progress: road.state.progress, gateAt: road.state.gateAt, gateFailure: road.state.gateFailure, bar: road.state.musicBar, status: road.status })}`);
  assert.equal(road.status, 'clear', 'the run finishes when the complete recording ends');
  assert.equal(C.readResume().checkpointId, 'road-clear');
  assert(!archive.record.progress.completedLevels.includes('level-02'));
  assert.deepEqual(copy(archive.record.progress.items), ['stem.voice']);
  assert.equal(verseFourSave.checkpointId, 'road-verse-4');
  assert(verseFourSave.levelState.proof.score > 0, 'a checkpoint preserves the earned score');
  archive.checkpoint(verseFourSave);
  assert(road.restore(verseFourSave));
  assert.equal(road.state.score, verseFourSave.levelState.proof.score);
  assert.equal(road.state.captures.length, 0, 'phrase locks restart cleanly at a checkpoint');
  assert.equal(road.startOffsetSec(), 76 * 1.875);
  road.status = road.state.status = 'failed';
  assert(road.retry());
  assert.equal(B.MusicTransport.sample(audio.context.currentTime).sourceOffsetTrackSec, 76 * 1.875,
    'retry seeks all parts and the clock together to the verse checkpoint');

  const legacy = { levelId: 'level-02', checkpointId: 'road-cache', levelState: {
    proofVersion: 2, returnTo: parentSave(), proof: { progress: 850, lane: 1,
      lanePos: 1, locked: [1, 2, 3], integrity: 2, speed: 54,
      timeMs: 30000, lockEnergy: 10, echoEnergy: 50 } } };
  assert(road.validate(legacy));
  assert(road.restore(legacy));
  assert.deepEqual(copy(road.state.captures), []);
  assert.equal(road.state.lockEnergy, 100, 'indefinite old locks refund into the bar-seal meter');
  assert.equal(road.state.musicBar, 8);
  assert.equal(road.startOffsetSec(), 15);
  const v1 = copy(legacy);
  v1.levelState.proofVersion = 1;
  v1.levelState.proof.locked = [0, 1];
  assert(road.validate(v1) && road.restore(v1));
  assert.equal(road.state.lockEnergy, 100);
  const v3 = copy(verseFourSave);
  v3.levelState.proofVersion = 3;
  v3.levelState.proof.locked = [0, 2];
  delete v3.levelState.proof.score;
  delete v3.levelState.proof.peakStack;
  delete v3.levelState.proof.cleanBars;
  assert(road.validate(v3) && road.restore(v3));
  assert.equal(road.state.lockEnergy, 100);
  assert.equal(road.state.score, 0);
  console.log(`Cache Road: authored lane/RB/Turbo/Echo road cues, ready first audit, visible one-per-bar choice, one RB per four bars, short x4, close cut ${cutAt}s → Zone speed/time, traffic, full song, final Echo and old saves passed.`);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
