// Focused presentation/input boundaries. Full races separately use only actual
// controls; these small fixtures position a car to isolate timing and feedback.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createCanvas } = require('@napi-rs/canvas');
const { createRig, load } = require('./check-level-01-boss');
const BEAT_SEC = 60 / 128;
const ACTIONS = ['road_a', 'road_b', 'road_x', 'road_y'];
const plain = value => JSON.parse(JSON.stringify(value));

function rig(version = 2) {
  const r = createRig(), { w, context } = r, B = w.BARCODE;
  B.Campaign = { register() {}, syncTitleButton() {} };
  for (const file of ['src/engine/cache-road-proof-profile.js', 'src/game/cache-road-landscape.js',
    'src/game/cache-road-encounters.js', 'src/game/cache-road-reactions.js', 'src/game/cache-road-pursuit.js',
    'src/game/cache-road-guidance.js']) load(context, file);
  let source = fs.readFileSync('src/game/cache-road-proof.js', 'utf8');
  source = source.replace('  const road = B.CacheRoadProof = {',
    '  window.feedbackInspect = { newState, pulseVisual };\n  const road = B.CacheRoadProof = {');
  vm.runInContext(source, context);
  const road = B.CacheRoadProof;
  road.active = true; road.status = 'playing'; road.state = w.feedbackInspect.newState();
  road.chapter = { version: 1, encounterVersion: version, difficultyId: 'standard',
    damageTaken: 0, elapsedMs: 0, attempts: 0, accurate: 0, perfect: 0, connected: 0, bestCombo: 0, records: [] };
  road.configureEncounters();
  road.selectMusicProfile(); B.MusicTransport.start({ sourceAnchorAudioSec: 0, sourceOffsetTrackSec: 0 });
  const cues = []; w.audioSystem.playCombatCue = (kind, options) => { cues.push({ kind, options }); return true; };
  const tick = beat => {
    w.audioSystem.context.currentTime = beat * BEAT_SEC;
    road.state.invulnerableMs = 100000; road.state.timeMs = 100000;
    road.update(20);
  };
  // Commit the first real chart pad through production road updates.
  for (let beat = 0; !road.pulses().length && beat < 40; beat += .25) tick(beat);
  const pulse = road.pulses()[0]; assert(pulse, 'the chart actually announces an action');
  road.state.lane = road.state.lanePos = pulse.lane;
  return { ...r, B, road, cues, pulse, tick, inspect: w.feedbackInspect };
}
function pressAt(r, offsetMs, { wrongButton = false, wrongLane = false } = {}) {
  const { road, pulse, w } = r, time = pulse.target * BEAT_SEC + offsetMs / 1000;
  r.tick(time / BEAT_SEC);
  if (wrongLane) road.state.lane = road.state.lanePos = (pulse.lane + 1) % 4;
  const action = ACTIONS[(pulse.action + (wrongButton ? 1 : 0)) % 4];
  const accepted = road.catchPulse(action, time, time);
  return { accepted, feedback: plain(road.state.driveFeedback || null), time };
}
function visibleText(ctx) {
  const texts = [], fill = ctx.fillText.bind(ctx);
  ctx.fillText = (value, ...args) => { texts.push(String(value)); fill(value, ...args); };
  return texts;
}
function run() {
  let timingCases = 0;
  for (const version of [1, 2]) {
    const limit = version === 2 ? 180 : 130;
    for (const offset of [-limit - 1, -limit + (version === 1 ? .001 : 0), -150, -69.999, 0, 69.999, 150, limit - (version === 1 ? .001 : 0), limit + 1]) {
      const r = rig(version), { accepted } = pressAt(r, offset);
      assert.equal(accepted, Math.abs(offset) <= limit, `v${version} ${offset} ms acceptance`);
      const cue = r.inspect.pulseVisual(r.pulse, r.road.state, BEAT_SEC);
      assert.equal(cue.window, Math.abs(offset) <= limit, `v${version} ${offset} ms visible hit window`);
      if (version === 2) assert.equal(cue.strike, cue.window, 'the target shines for both accepted halves');
      if (accepted) {
        // An early success reserves one award and resolves on the actual ONE.
        if (offset < 0) { assert.equal(r.road.chapter.connected, 0); r.tick(r.pulse.target); }
        assert.equal(r.road.chapter.accurate, 1);
        assert.equal(r.road.chapter.connected, 1);
        assert.equal(r.road.chapter.perfect, Math.abs(offset) <= 70 ? 1 : 0);
        assert.equal(r.road.catchPulse(ACTIONS[r.pulse.action], r.pulse.target * BEAT_SEC), false,
          'a held/repeated input cannot award the same physical pad twice');
        if (version === 2) {
          const feedback = r.road.state.driveFeedback;
          assert.equal(feedback.kind, Math.abs(offset) <= 70 ? 'perfect' : 'good');
          assert(feedback.expiresMs - feedback.atMs >= 1000, 'a successful hit remains readable');
          assert(r.cues.some(c => c.kind === (Math.abs(offset) <= 70 ? 'roadPerfect' : 'roadGood')));
        }
      } else {
        assert.equal(r.road.chapter.accurate, 0);
        assert.equal(r.road.state.captures.length + r.road.state.queuedCaptures.length, 0);
        if (version === 2) assert.equal(r.road.state.driveFeedback.kind, offset < 0 ? 'early' : 'late');
      }
      timingCases++;
    }
  }
  for (const [options, expected] of [[{ wrongButton: true }, 'button'], [{ wrongLane: true }, 'lane']]) {
    const r = rig(), { accepted, feedback } = pressAt(r, 0, options);
    assert.equal(accepted, false); assert.equal(feedback.kind, expected);
    assert.equal(r.road.chapter.accurate, 0);
    assert(feedback.expiresMs - feedback.atMs >= 800);
    r.road.state.lane = r.road.state.lanePos = r.pulse.lane;
    assert.equal(r.road.catchPulse(ACTIONS[r.pulse.action], r.pulse.target * BEAT_SEC), true,
      'a wrong button/lane does not consume the cue or block a corrected on-time input');
    assert.equal(r.road.state.driveFeedback.kind, 'perfect');
  }
  {
    const r = rig(); r.tick(r.pulse.target + .5);
    assert.equal(r.road.state.driveFeedback.kind, 'miss', 'an unpressed cue reports its actual expiry');
    const feedback = plain(r.road.state.driveFeedback);
    r.tick(r.pulse.target + .6);
    assert.deepEqual(plain(r.road.state.driveFeedback), feedback, 'miss detection does not restart its notice every update');
    assert.equal(r.road.state.captures.length, 0);
  }
  const r = rig(), guidance = r.B.CacheRoadGuidance;
  assert.equal(new Set(guidance.badges.slice(0, 4).map(b => b.shape)).size, 4);
  assert.equal(new Set(guidance.badges.map(b => b.color)).size, 6);
  assert.deepEqual(plain(guidance.badges.map(b => b.key)), ['K', 'L', 'J', 'I', 'SPACE', 'H']);
  r.B.GamepadUI = { connected: false };
  assert.deepEqual(plain(guidance.badges.map((_, index) => guidance.label(index))), ['K', 'L', 'J', 'I', 'SPACE', 'H']);
  r.B.GamepadUI.connected = true;
  r.B.ControllerSettings = { button: index => ['A', 'B', 'X', 'Y', 'LB', 'RB'][index] };
  assert.deepEqual(plain(guidance.badges.map((_, index) => guidance.label(index))), ['A', 'B', 'X', 'Y', 'LB', 'RB']);
  const ctx = createCanvas(1920, 1080).getContext('2d'), texts = visibleText(ctx);
  for (let index = 0; index < 6; index++) {
    const box = guidance.drawButton(ctx, { index, x: 150 + index * 230, y: 100, size: 90, active: true });
    assert(box.x >= 0 && box.y >= 0 && box.x + box.w <= 1920 && box.y + box.h <= 1080);
  }
  for (const offset of [-180, 0, 180]) {
    r.tick(r.pulse.target + offset / 1000 / BEAT_SEC);
    const nextCue = r.inspect.pulseVisual(r.pulse, r.road.state, BEAT_SEC);
    assert.equal(guidance.lesson(r.road, { nextPulse: r.pulse, nextCue }).active, true,
      `the guidance says press throughout ${offset} ms of the accepted window`);
    texts.length = 0; guidance.draw(ctx, r.road, { nextPulse: r.pulse, nextCue, reduced: true });
    assert(texts.includes('PRESS NOW'), 'Reduced Motion retains explicit timing guidance');
  }
  for (const [kind, text] of [['perfect', 'PERFECT'], ['good', 'ON BEAT'], ['early', 'TOO EARLY'],
    ['late', 'TOO LATE'], ['button', 'WRONG BUTTON'], ['lane', 'CHANGE LANE'], ['miss', 'MISSED'], ['record', 'RECORD SAVED']]) {
    r.road.state.driveFeedback = { kind, action: 0, lane: 0, atMs: r.road.state.elapsedMs,
      expiresMs: r.road.state.elapsedMs + 1000 };
    texts.length = 0; guidance.draw(ctx, r.road, { reduced: true });
    assert(texts.includes(text), `${kind} produces a distinct visible result`);
    r.road.state.elapsedMs += 1001; texts.length = 0; guidance.draw(ctx, r.road, { reduced: true });
    assert(!texts.includes(text), `${kind} receipt expires without leaving a permanent overlay`);
  }
  // The driving surface communicates through lane/route drawings and brief
  // outcomes. Full explanation remains available in Pause rather than being
  // repeated across live mission, lesson and receipt panels.
  r.road.state.driveFeedback = null; r.road.state.mixFeedback = null;
  r.road.state.musicBeatFloat = 20; r.road.state.gateAt = null;
  texts.length = 0; guidance.draw(ctx, r.road, { nextPulse: r.pulse,
    nextCue: { ready: true, window: false, remaining: 2 }, reduced: true });
  assert(texts.includes('DELIVER'));
  assert(texts.every(text => text.trim().split(/\s+/).length <= 2), 'live guidance uses brief labels, not instruction sentences');
  assert(texts.length <= 4, 'an ordinary pad does not stack repeated lesson or mission text');
  r.B.GamepadUI.connected = false;
  r.road.state.opening.held = false;
  for (const nextPulse of [null, { ...r.pulse, action: 2 }]) {
    const options = { nextPulse, nextCue: { ready: false, window: false, remaining: 5 }, reduced: true };
    assert.equal(guidance.lesson(r.road, options).steer, true, 'unannounced/early pads teach steering only');
    texts.length = 0; guidance.draw(ctx, r.road, options);
    assert(!texts.some(text => ['K', 'J', 'L', 'I', '1', 'PRESS NOW'].includes(text)),
      'generic steering never invents an action button or ONE press target');
  }
  for (const [kind, musicKind, expected] of [['perfect', 'join', 'PERFECT'], ['perfect', 'lost', 'PART OUT'],
    ['button', 'join', 'WRONG BUTTON'], ['record', 'join', 'RECORD SAVED']]) {
    const atMs = r.road.state.elapsedMs;
    r.road.state.driveFeedback = { kind, action: 0, lane: 0, atMs, expiresMs: atMs + 1000 };
    r.road.state.mixFeedback = { kind: musicKind, lane: 0, holdBars: 3,
      atMs: musicKind === 'lost' ? atMs + 1 : atMs - 1, expiresMs: atMs + 1000 };
    texts.length = 0; guidance.draw(ctx, r.road, { reduced: true });
    assert(texts.includes(expected), 'compact receipts retain outcome ownership and chronology');
    assert(!texts.some(text => /BARS|CAPTURED|Wait for|Match the|Optional record/.test(text)),
      'music glyphs replace the receipt subtitle without restoring prose');
  }
  r.road.state.driveFeedback = null; r.road.state.mixFeedback = null;
  r.road.state.musicBeatFloat = 370; r.road.state.gateAt = r.road.state.progress + 150;
  texts.length = 0; guidance.draw(ctx, r.road, { reduced: true });
  for (const text of ['1', '2', 'ECHO', 'EXIT']) assert(texts.includes(text), 'both ordered exit steps remain explicit');
  const exitState = { progress: 1000, lanePos: 0, echoEnergy: 100, gateAt: null,
    echo: null, rivalDistractedMs: 0 };
  assert.equal(guidance.exitCue(exitState).send, false, 'bar 90 preparation cannot light a premature Echo');
  assert.equal(guidance.exitCue({ ...exitState, gateAt: 1220 }).send, false, 'six-second replay is not prompted seven seconds out in gear 1');
  assert.equal(guidance.exitCue({ ...exitState, gateAt: 1150 }).send, true, 'the authored five-second left-lane split lights Echo');
  assert.equal(guidance.exitCue({ ...exitState, gateAt: 1150, lanePos: 3 }).send, false, 'driver must first line up left');
  const validEcho = { lanePos: 0, durationMs: 6000, ageMs: 1000 };
  const activeExit = { ...exitState, gateAt: 1100, echo: validEcho, rivalDistractedMs: 5000 };
  assert.equal(guidance.exitCue(activeExit).exit, true);
  assert.equal(guidance.exitCue(activeExit).split, false, 'sending does not claim the original has exited');
  assert.equal(guidance.exitCue({ ...activeExit, lanePos: 3 }).split, true);
  const wrongEcho = guidance.exitCue({ ...activeExit, echo: { ...validEcho, lanePos: 3 } });
  assert.equal(wrongEcho.echoLane, 3, 'the visual replay preserves its actual lane');
  assert.equal(wrongEcho.exit, false, 'right-side Echo cannot satisfy the far-right split');
  assert.equal(guidance.exitCue({ ...activeExit, echo: { ...validEcho, ageMs: 5900 } }).exit, false,
    'a nearly expired replay cannot light a physically unreachable exit');
  texts.length = 0; guidance.drawHelp(ctx, r.road);
  assert(texts.includes('EXIT: ECHO LEFT / ORIGINAL FAR RIGHT'));
  assert(texts.some(text => /Optional record: hold its lane/.test(text)), 'Pause retains the written collection explanation');
  r.road.state.gateAt = null;
  const goals = [];
  for (const bar of [0, 28, 52, 76, 90]) {
    r.road.state.musicBeatFloat = bar * 4;
    goals.push(guidance.objective(r.road).title);
  }
  assert.equal(new Set(goals).size, 5, 'the live objective follows all five meaningful route stages');
  r.road.state.gateAt = r.road.state.progress + 100;
  assert.match(guidance.objective(r.road).instruction, /HOLD LEFT.*SEND ECHO.*EXIT RIGHT/);
  r.road.state.echo = {};
  assert.match(guidance.objective(r.road).instruction, /FAR-RIGHT/);
  r.road.state.gateOpen = true;
  assert.match(guidance.objective(r.road).instruction, /EXIT CLEAR/);
  console.log(JSON.stringify({ timingCases, failureKinds: 5, outcomeReceipts: 8, distinctFaceShapes: 4,
    inputLabels: ['keyboard', 'controller'], routeStages: 5, reducedMotionPressWindow: true, conciseLiveLabels: true, receiptChronologyCases: 4, exitReadinessCases: 9 }));
}
module.exports = { rig, pressAt, run };
if (require.main === module) run();
