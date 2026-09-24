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
  load(context, 'src/core/action-input.js');
  const B = w.BARCODE, profile = B.MusicProfiles.select('level-02.proof');
  const road = B.CacheRoadProof, C = B.Campaign;
  const pad = { connected: true, mapping: 'standard', axes: [0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  const priorPads = w.navigator.getGamepads;
  w.navigator.getGamepads = () => [pad];
  const input = new B.ActionInput();
  for (const [index, action] of [[0,'road_a'],[1,'road_b'],[2,'road_x'],
    [3,'road_y'],[4,'road_turbo'],[5,'road_echo']]) {
    input.update({ gameplayActive: true });
    pad.buttons[index].pressed = true;
    assert.equal(input.update({ gameplayActive: true })[action].pressed, true,
      `road-only input maps standard controller button ${index}`);
    assert.equal(input.update({ gameplayActive: true })[action].pressed, false,
      'holding a button cannot repeat a pulse');
    pad.buttons[index].pressed = false;
  }
  pad.axes[1] = -.8;
  assert.equal(input.update({ gameplayActive: true }).move_up.held, true);
  pad.axes[1] = .8;
  assert.equal(input.update({ gameplayActive: true }).move_down.held, true);
  pad.axes[1] = 0;
  input.handleKeyDown({ key: 'k' });
  assert.equal(input.update({ gameplayActive: true }).road_a.pressed, true,
    'keyboard face diamond has its own edge input');
  assert.equal(input.update({ gameplayActive: true, paused: true }).road_a.pressed, false,
    'road pulses cannot trigger through pause');
  input.dispose(); w.navigator.getGamepads = priorPads;
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
    'earned parts rise quickly and trail smoothly');
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
  assert.equal(mirrorFrame({ pulseFlashMs: 500 }), 1);
  assert.equal(mirrorFrame({ boostMs: 600 }), 2);
  assert.equal(mirrorFrame({ cutFlashMs: 500 }), 3);
  assert.equal(mirrorFrame({ stumbleMs: 650, integrity: 1 }), 4,
    'a hit overrides low signal during the collision');
  assert(roadArt.some(entry => entry.key === 'cacheCarHit'), 'collision uses its jolt pose');
  assert.equal(mirrorFrame({ integrity: 1 }), 5);
  mirrorFrame({ progress: 60 });
  assert.deepEqual(openingRects, [[875, 82]], 'the opening panel remains compact');
  road.state = liveState; B.PresentationAssets = oldArt;
  assert.match(road.openingCue()[0], /PULSES ARE SAFE/,
    'the first prompt distinguishes safe music pickups from traffic');
  assert.equal(profile.judgmentRules[0].id, 'road-pulse');
  const beatSec = 60 / 128;
  const face = (key, beat, lane, speed = 54, offset = 0) => {
    road.state.lane = road.state.lanePos = road.state.visualLane = lane;
    road.state.speed = speed;
    audio.context.currentTime = beat * beatSec + offset;
    road.handleActions({ [key]: { pressed: true, presses: [{ audioTimeSec: audio.context.currentTime }] } });
    road.update(100);
  };
  audio.context.currentTime = 3 * beatSec - .25;
  road.state.lane = road.state.lanePos = 1; road.update(100);
  assert.equal(road.state.captures.length, 0, 'holding a lane without a timed pulse earns no music');
  face('road_a', 3, 1);
  assert.deepEqual(copy(road.state.captures.map(c => [c.lane,c.startBeat,c.endBeat])), [[1,3,19]],
    'a real face-button press in the marked lane catches four bars on the song beat');
  assert.equal(road.state.surgeMs > 0, true, 'A pulse gives a short speed surge');
  assert.equal(road.mixSnapshot().bonusVocal, false, 'a single part does not signal crew vocals');
  const firstScore = road.state.score;
  face('road_a', 3, 1);
  assert.equal(road.state.score, firstScore, 'one pulse cannot be paid twice by a repeated press');
  face('road_x', 5, 1);
  assert.equal(road.state.shield, 0, 'a button press in the wrong lane is harmless');
  face('road_x', 5, 0, 54, .22);
  assert.equal(road.state.captures.length, 1, 'a late press outside the window earns no part');
  face('road_x', 5, 0);
  assert.equal(road.state.shield, 1, 'X provides one defensive brace');
  assert.equal(road.state.captures.find(c => c.lane === 0).endBeat, 37,
    'consecutive face-button catches extend the second part to eight bars');
  const echoBefore = road.state.echoEnergy;
  face('road_y', 7, 1, 30);
  assert(road.state.echoEnergy >= Math.min(100, echoBefore + 65),
    'a slow Y catch combines its refill with the deliberate slow-speed bonus');
  face('road_b', 9, 2, 63);
  assert(road.state.ramMs > 0 && road.state.score > firstScore + 100,
    'B arms a traffic push and fast pulses score more');
  face('road_a', 11, 3, 63);
  assert.equal(road.state.captures.length, 4, 'the repeatable first phrase can reach all four parts');
  assert.equal(road.state.peakStack, 4);
  assert.equal(road.state.fullAdrenalineCount, 1);
  assert.equal(road.mixSnapshot().bonusVocal, true, 'the future vocal gate follows four live parts');
  assert(B.musicDirector.apply(audio));
  assert.equal(B.musicDirector.getVolume('cache-undercurrent'), .62,
    'the fourth earned stem is present in the actual director mix');
  road.state.speed = 54; road.handleActions({ move_up: { held: true } }); road.update(100);
  assert(road.state.speed > 54, 'up throttle changes road speed');
  road.handleActions({ move_down: { held: true } }); road.update(100);
  assert(road.state.speed < 57, 'down braking lowers speed');
  const integrityBefore = road.state.integrity;
  road.hit('van');
  assert.equal(road.state.integrity, integrityBefore, 'PUSH consumes an impact offensively');
  assert.equal(road.state.ramMs, 0);
  road.hit('van');
  assert.equal(road.state.integrity, integrityBefore, 'BRACE consumes one later impact');
  assert.equal(road.state.shield, 0);
  const busBeforeHit = busEvents.length;
  road.hit('van');
  const hitBusEvents = busEvents.slice(busBeforeHit);
  assert.equal(road.state.captures.length, 0);
  assert.equal(road.state.fullAdrenaline, false);
  assert.equal(road.state.hitRecovery, true);
  assert.equal(road.state.stumbleMs, 650);
  assert(hitBusEvents.some(event => event.v === 0), 'an unprotected hit drops the music bus');
  const recoveredAt = hitBusEvents.find(event => event.v === .8)?.at;
  assert(Number.isFinite(recoveredAt), 'the bus recovers after the stumble');
  const recoveredBeat = B.MusicTransport.sample(recoveredAt).grid.beatFloat;
  assert(Math.abs(recoveredBeat - Math.round(recoveredBeat)) < .001,
    'the bus returns on the unchanged song beat');
  assert(B.musicDirector.apply(audio));
  assert.equal(B.musicDirector.getVolume('cache-pressure'), .60, 'the drum clock survives the hit');
  assert.equal(B.musicDirector.getVolume('cache-drive'), 0, 'the music part drops out, rather than merely getting quieter');
  const recoveryScore = road.state.score, recoveryEcho = road.state.echoEnergy;
  road.cleanPass(false);
  assert.equal(road.state.score, recoveryScore, 'invulnerability cannot report a clean traffic pass');
  assert.equal(road.state.echoEnergy, recoveryEcho);
  face('road_x', 13, 2);
  assert.equal(road.state.captures.length, 1, 'a safe pulse gives a quick way back after a hit');
  // A lane-centered adjacent pass counts despite small natural steering drift.
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
  assert.equal(road.state.captures.length, 0, 'traffic proximity alone does not catch a music pulse');
  // Drive the opening route with ordinary steering and the real road update;
  // teleporting lane state alone would hide an impossible chart.
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  const route = [[3,1,'road_a'],[5,0,'road_x'],[7,1,'road_y'],
    [9,2,'road_b'],[11,3,'road_a']];
  let routeIndex = 0;
  for (let frame = 1; frame <= 112; frame++) {
    audio.context.currentTime = frame * .05;
    const next = route[routeIndex], goal = next?.[1] ?? 3;
    const steer = goal - road.state.lanePos;
    const actions = { move_left: { held: steer < -.10 },
      move_right: { held: steer > .10 } };
    if (next && Math.abs(audio.context.currentTime - next[0] * beatSec) <= .024) {
      actions[next[2]] = { pressed: true, presses: [{ audioTimeSec: audio.context.currentTime }] };
      routeIndex++;
    }
    road.handleActions(actions); road.update(50);
  }
  assert.equal(routeIndex, route.length, 'all authored prompts arrived on the same music clock');
  assert.equal(road.state.integrity, 3, 'the opening rhythm route also clears actual traffic');
  assert.equal(road.state.peakStack, 4, 'steering between real safe pulses can reach full adrenaline');
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
  assert.match(road.openingCue()[1], /SPACE/);
  road.handleActions({ road_turbo: { pressed: true } });
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
  B.ControllerSettings = { button(i) { return { 4: 'L1', 5: 'R1' }[i]; } };
  assert.match(road.openingCue()[1], /R1/,
    'the road prompt respects a connected controller binding');
  B.ControllerSettings = oldSettings; B.GamepadUI = oldGamepad;
  road.handleActions({ road_echo: { pressed: true } });
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
  console.log('Cache Road: safe timed four-face pulses, four-part route, speed and ability rewards, protected and unprotected traffic, full song, final Echo and old saves passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
