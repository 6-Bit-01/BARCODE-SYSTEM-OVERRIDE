// Production catches, capture lifecycle and director gains; audio services
// are observed at their boundary. Real decoding/rendering remains in Chromium.
const assert = require('node:assert/strict');
const { rig } = require('./check-cache-road-reaction-integration.cjs');
const { load } = require('./check-level-01-boss');
const plain = value => JSON.parse(JSON.stringify(value));
const beatSec = 60 / 128;
function setup(version = 2) {
  const r = rig(), { road, w, B } = r;
  road.chapter.encounterVersion = version;
  Object.assign(road.chapter, { attempts: 0, accurate: 0, perfect: 0, connected: 0, bestCombo: 0 });
  load(r.context, 'src/engine/music-director.js');
  const profile = B.MusicProfiles.get('level-02.proof'), ramps = [], cues = [];
  const audio = w.audioSystem;
  Object.assign(audio, { layersStarted: true, isLooping: false, musicTracks: {},
    getActiveMusicProfile: () => profile,
    rampAdaptiveStemGain(track, volume, duration) {
      ramps.push({ sourceId: track.sourceId, at: audio.context.currentTime, volume, duration });
      track.volume = volume;
    }, playCombatCue: (kind, options) => cues.push({ kind, calledAt: audio.context.currentTime, ...options }) });
  for (const source of profile.arrangement.sources)
    audio.musicTracks[source.sourceId] = { sourceId: source.sourceId, volume: 0, gain: {}, isPlaying: true };
  function tick(beat) {
    audio.context.currentTime = beat * beatSec;
    road.state.elapsedMs = beat * beatSec * 1000;
    road.resolvePulseAwards(beat);
    road.updateCaptures(B.MusicTransport.sample(audio.context.currentTime));
    B.musicDirector.apply(audio);
  }
  const volume = role => audio.musicTracks[`cache-${role}`].volume;
  function pulse(lane, action, beat, order = 0, run = 'audition') {
    const value = { id: `${run}/${order}`, lane, action, target: beat, at: 100,
      run, order, bar: beat / 4 - 1, encounter: true };
    road.state.encounters.pulses.push(value);
    road.state.pulseTargets[value.id] = beat;
    road.state.pulsePlaces[value.id] = value.at;
    return value;
  }
  function catchAt(value, beat = value.target) {
    audio.context.currentTime = beat * beatSec;
    road.state.lanePos = value.lane;
    return road.catchPulse(['road_a', 'road_b', 'road_x', 'road_y'][value.action],
      audio.context.currentTime, audio.context.currentTime);
  }
  return { ...r, audio, profile, ramps, cues, tick, volume, pulse, catchAt };
}

function run() {
  for (const version of [1, 2]) {
    const r = setup(version), s = r.road.state;
    r.tick(0);
    assert.equal(r.road.mixSnapshot().reactivityVersion, version);
    assert.equal(r.volume('pressure'), .60);
    assert.equal(r.volume('drive'), version === 2 ? .03 : .10);
    assert.equal(r.volume('flow'), version === 2 ? .045 : 0);
    assert.equal(r.volume('breakaway'), 0);
    const p = r.pulse(0, 0, 4);
    assert(r.catchAt(p, 4 - .08 / beatSec));
    assert.equal(s.captures.length, 0, 'early input does not add a part before its downbeat');
    assert(s.mixFeedback == null, 'early input does not announce an audible entrance');
    r.tick(3.99); assert.equal(r.volume('drive'), version === 2 ? .03 : .10);
    r.tick(4);
    assert.equal(r.volume('drive'), .19);
    assert.equal(s.captures[0].endBeat, version === 2 ? 16 : 36);
    if (version === 2) {
      assert.deepEqual(plain(s.mixFeedback), { kind: 'join', lane: 0, atMs: 1875,
        expiresMs: 3175, label: 'DRIVE', endBeat: 16, holdBars: 3 });
      assert.equal(s.mixChanges, 1);
    } else assert(s.mixFeedback == null, 'legacy presentation retains its existing behavior');
    // A fresh, on-time consecutive catch extends the same live source.
    const next = r.pulse(0, 0, 8, 1);
    assert(r.catchAt(next)); r.tick(8);
    assert.equal(s.captures[0].endBeat, version === 2 ? 32 : 72);
    assert.equal(r.volume('drive'), .19);
    if (version === 2) {
      assert.equal(s.mixFeedback.kind, 'extend'); assert.equal(s.mixFeedback.holdBars, 6);
      assert.equal(s.mixChanges, 1, 'extending one source is not a new musical entrance');
    }
    r.tick(version === 2 ? 32 : 72);
    assert.equal(r.volume('drive'), version === 2 ? .03 : .10);
    assert.equal(r.volume('flow'), version === 2 ? .045 : .18);
    if (version === 2) {
      assert.equal(s.mixFeedback.kind, 'lost'); assert.equal(s.mixFeedback.lane, 0);
      assert.equal(s.mixChanges, 2);
      assert(r.ramps.some(event => event.volume === .19 && event.duration === .11));
      assert(r.ramps.some(event => event.volume === .03 && event.duration === .30));
    } else {
      assert(r.ramps.some(event => event.volume === .19 && event.duration === .22));
      assert(r.ramps.some(event => event.volume === .10 && event.duration === .38));
    }
    const count = r.ramps.length;
    r.w.isPaused = true; s.captures = [{ lane: 2, startBeat: 0, endBeat: 400 }];
    r.B.musicDirector.apply(r.audio);
    assert.equal(r.ramps.length, count, 'paused arrangement schedules no gain change');
  }
  {
    const r = setup(), s = r.road.state;
    r.tick(16);
    for (let lane = 0; lane < 4; lane++) {
      const p = r.pulse(lane, 3, 20 + lane * 4, lane);
      assert(r.catchAt(p)); r.tick(p.target);
    }
    // The first three-bar catch expires before the fourth arrives. A later
    // return can still create the full chorus stack without a permanent lock.
    assert.equal(s.captures.length, 3);
    const p = r.pulse(0, 3, 36, 4); assert(r.catchAt(p)); r.tick(36);
    assert.equal(s.captures.length, 4); assert.equal(s.fullAdrenaline, true);
    assert.deepEqual(['drive', 'flow', 'breakaway', 'undercurrent'].map(r.volume), [.19, .55, .50, .62]);
    const held = plain(s.captures.map(c => c.lane)), broken = 2;
    s.lanePos = broken; s.shield = 0; s.ramMs = 0; s.boostMs = 0; s.invulnerableMs = 0;
    let stumbles = 0; r.audio.playRoadStumble = () => stumbles++;
    r.road.hit('van'); r.tick(36.05);
    assert.equal(stumbles, 0, 'v2 damage does not silence drums or the retained arrangement');
    assert.deepEqual(plain(s.captures.map(c => c.lane)), held.filter(lane => lane !== broken));
    assert.equal(r.volume('pressure'), .60);
    assert.equal(r.volume('drive'), .19); assert.equal(r.volume('flow'), .55);
    assert.equal(r.volume('breakaway'), 0); assert.equal(r.volume('undercurrent'), .62);
    assert.equal(s.mixFeedback.kind, 'lost'); assert.equal(s.mixFeedback.lane, broken);
    assert.equal(s.fullAdrenaline, false);
    assert(r.cues.some(cue => cue.kind === 'damage'), 'the real collision still produces impact audio');
    const feedback = s.mixFeedback;
    r.tick(36.1); assert.equal(s.mixFeedback, feedback, 'receipt is not restarted every frame');
  }
  console.log('Cache music reactivity: early/downbeat entrance, 3/6-bar build/release, extension, damage continuity, pause and exact legacy mix passed.');
}
if (require.main === module) run();
// A labeled audition of real catch/expiry/damage events, separate from the
// full-race driver. The browser replays these exact production gain ramps
// against the five decoded owner recordings using OfflineAudioContext.
function auditionTrace() {
  const r = setup(), events = [], seconds = 56.25;
  const offers = [8, 16, 24, 32, 84, 88, 92, 96, 100].map((beat, order) =>
    r.pulse(order % 4, 3, beat, order < 4 ? order : order - 4,
      order < 4 ? 'music-audition-verse' : 'music-audition-chorus'));
  for (let step = 0; step <= 120 * 8; step++) {
    const beat = step / 8, offer = offers.find(item => item.target === beat);
    if (offer) {
      assert(r.catchAt(offer));
      events.push({ beat, time: beat * beatSec, kind: 'catch', lane: offer.lane });
    }
    r.tick(beat);
    if (beat === 101) {
      const s = r.road.state;
      s.lanePos = 2; s.shield = 0; s.ramMs = 0; s.boostMs = 0; s.invulnerableMs = 0;
      r.road.hit('van'); r.tick(beat);
      events.push({ beat, time: beat * beatSec, kind: 'crash', lane: 2 });
    }
  }
  return { seconds, title: 'Scripted production music-control audition; not a complete race',
    events, mixEvents: r.ramps,
    audioEvents: r.cues.map(({ kind, calledAt, ...options }) =>
      ({ kind, calledAt, at: options.audioTimeSec ?? calledAt, options })) };
}
module.exports = { setup, run, auditionTrace };
