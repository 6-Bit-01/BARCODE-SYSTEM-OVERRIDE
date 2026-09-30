#!/usr/bin/env node
// Complete production races driven through the real input/RAF path. This is a
// deterministic control study, not a human playtest or device/audio acceptance.
// Never writes road position, health, immunity, abilities, captures or score.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { completionRig } = require('./check-cache-completion-flow.cjs');
const { load } = require('./check-level-01-boss');
const copy = value => JSON.parse(JSON.stringify(value));
const round = (value, digits = 3) => Number(Number(value || 0).toFixed(digits));
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const DIFFICULTIES = ['relaxed', 'standard', 'overclocked'];
const ACTION_BUTTON = { road_a: 0, road_b: 1, road_x: 2, road_y: 3 };
const PROFILES = {
  practiced: { reactionMs: 180, decisionMs: 120, aimTolerance: .085, jitterMs: 42, missEvery: 0, mistake: false },
  recovering: { reactionMs: 300, decisionMs: 160, aimTolerance: .12, jitterMs: 88, missEvery: 5, mistake: true }
};
const SNAPSHOT_KEYS = ['id', 'at', 'distance', 'lane', 'kind', 'targetLane', 'collidable', 'action', 'target'];
const safeItem = item => Object.fromEntries(SNAPSHOT_KEYS.filter(key => item[key] !== undefined).map(key => [key, item[key]]));

async function raceRig(difficulty) {
  const r = completionRig();
  // Companion owners are loaded before entry; existing regression rigs can
  // still intentionally exercise their legacy route without this chart.
  for (const [name, file] of [['CacheRoadEncounters', 'src/game/cache-road-encounters.js'],
    ['CacheRoadReactions', 'src/game/cache-road-reactions.js'], ['CacheRoadPursuit', 'src/game/cache-road-pursuit.js']])
    if (!r.B[name] && fs.existsSync(path.resolve(__dirname, '..', file))) load(r.context, file);
  const saved = r.finish();
  saved.levelState.difficultyId = difficulty;
  saved.levelState.run.difficultyId = difficulty;
  await r.boot(saved); r.bridge.skipToReady(); await r.bridge.drive();
  assert.equal(r.road.chapter?.difficultyId, difficulty, 'fresh road inherits the selected campaign difficulty');
  assert.equal(r.road.state.invulnerableMs, 0, 'the balance rig starts without immunity');
  assert.equal(r.road.state.musicBar, 0);
  assert.equal(typeof r.road.encounterSnapshot, 'function', 'production must expose visible encounter observations');
  return r;
}

function instrument(r) {
  const events = [], pulses = new Map(), { road } = r;
  const event = (kind, detail = {}) => events.push({ kind, bar: round(road.state.musicBeatFloat / 4),
    elapsedMs: round(road.chapter.elapsedMs), lane: round(road.state.lanePos), integrity: road.state.integrity, ...detail });
  const hit = road.hit.bind(road);
  road.hit = function(...args) {
    const s = this.state, before = { integrity: s.integrity, ramMs: s.ramMs, shield: s.shield,
      captures: (s.captures || []).map(c => c.lane), queued: (s.queuedCaptures || []).map(c => c.lane) };
    const result = hit(...args);
    if (s.integrity < before.integrity) event('damage', { actor: args[0], capturesBefore: before.captures,
      capturesAfter: (s.captures || []).map(c => c.lane), queuedBefore: before.queued,
      queuedAfter: (s.queuedCaptures || []).map(c => c.lane) });
    else if (before.ramMs > 0 && s.ramMs <= 0) event('push', { actor: args[0] });
    else if (before.shield > 0 && s.shield < before.shield) event('brace', { actor: args[0] });
    return result;
  };
  const cleanPass = road.cleanPass.bind(road);
  road.cleanPass = function(...args) { const result = cleanPass(...args); event('near-pass', { cut: !!args[0] }); return result; };
  const catchPulse = road.catchPulse.bind(road);
  road.catchPulse = function(...args) {
    const result = catchPulse(...args);
    event(result ? 'capture' : 'missed-press', { action: args[0] }); return result;
  };
  const sendEcho = road.sendEcho.bind(road);
  road.sendEcho = function(...args) {
    const before = this.state.echoEnergy, result = sendEcho(...args);
    if (before >= 100 && this.state.echoEnergy < before) event('echo');
    return result;
  };
  return { events, pulses, event };
}

// The driver knows the road's controls and the shown final-exit instructions.
// It sees only the production snapshot's announced pads, visible actors and
// pursuit tell. Observation delay/replanning/timing error are explicit. It
// never reads chart entries that have not appeared or searches a future run.
class Driver {
  constructor(r, profile, gear, observed, options = {}) {
    this.r = r; this.profile = profile; this.gear = gear; this.observed = observed; this.options = options;
    this.frames = []; this.seen = new Map(); this.pressed = new Set(); this.omitted = new Set();
    this.target = 1; this.nextDecision = 0; this.lastEcho = -10000; this.lastTurbo = -10000;
    this.finalEcho = false; this.mistakeChosen = false; this.mistake = null; this.sequence = 0; this.mistakeTries = 0; this.mistakeActors = new Set();
    this.lastPursuitStage = null; this.nextGearRequest = 200; this.ramTarget = null;
  }
  snapshot() {
    const raw = this.r.road.encounterSnapshot(), s = this.r.road.state;
    return { atMs: s.elapsedMs, progress: s.progress, lane: s.lanePos,
      hazards: (raw.hazards || []).map(safeItem), pulses: (raw.pulses || []).map(safeItem),
      pursuit: raw.pursuit ? copy(raw.pursuit) : null, cue: raw.cue ? copy(raw.cue) : null, gate: raw.gate ? copy(raw.gate) : null };
  }
  step() {
    const { r, profile: p } = this, { road, pad } = r, s = road.state, now = s.elapsedMs;
    for (const button of pad.buttons) button.pressed = false;
    pad.axes[1] = 0;
    const fresh = this.snapshot(); this.frames.push(fresh);
    const due = now - p.reactionMs;
    while (this.frames.length > 1 && this.frames[1].atMs <= due) this.frames.shift();
    const view = this.frames[0];
    // Extrapolate only the player's displacement since observation, just as
    // an approaching object continues moving while a person reacts to it.
    const hazards = view.hazards.map(h => ({ ...h, distance: h.at - s.progress }))
      .filter(h => h.collidable !== false && h.distance > -1 && h.distance < 440);
    const pulses = view.pulses.filter(q => Number.isFinite(q.target) && q.target >= s.musicBeatFloat - .4)
      .sort((a, b) => a.target - b.target);
    for (const q of fresh.pulses) { const offer = `${road.chapter.retries}:${q.id}`; if (!this.observed.pulses.has(offer)) this.observed.pulses.set(offer, copy(q)); }
    for (const q of pulses) if (!this.seen.has(q.id)) {
      const index = ++this.sequence;
      const jitter = Math.sin(index * 2.3999632297 + this.gear * .37) * p.jitterMs;
      this.seen.set(q.id, { ...q, jitter, index });
      if (p.missEvery && index % p.missEvery === 0) this.omitted.add(q.id);
    }
    const pulse = pulses.find(q => !this.pressed.has(q.id) && !this.omitted.has(q.id));
    const targetBeat = pulse?.target;
    const pulseSec = Number.isFinite(targetBeat) ? (targetBeat - s.musicBeatFloat) * 60 / 128 : Infinity;
    const pursuit = view.pursuit;
    const stage = pursuit?.stage || pursuit?.phase || null;
    if (stage && stage !== this.lastPursuitStage) {
      this.observed.event('pursuit-stage', { stage }); this.lastPursuitStage = stage;
    }

    for (const change of this.options.gearSchedule || []) if (s.musicBeatFloat / 4 >= change.bar) this.gear = change.gear;
    // Initial gear selection is a real input, then holds that gear. A test
    // never initializes a faster/slower physical state behind the controls.
    if (s.gear !== this.gear && s.pendingGear == null && now >= this.nextGearRequest) {
      pad.buttons[this.gear > s.gear ? 12 : 13].pressed = true; this.nextGearRequest = now + 250;
    }

    // A repeatable recovery probe is an openly intentional driving mistake:
    // choose a visible convoy actor and stay in its lane until the contact.
    // It changes controls only, and resumes the same policy after one impact.
    const damageCount = this.observed.events.filter(e => e.kind === 'damage').length;
    if (damageCount >= (this.options.earlyHits || 1)) this.mistakeChosen = true;
    const earlyProbe = this.options.earlyHits > 0 && !this.mistakeChosen && s.musicBar < 28;
    const ordinaryProbe = p.mistake && s.musicBar >= 30 && s.musicBar < 68 && (s.captures || []).length >= 2;
    if ((earlyProbe || ordinaryProbe) && !this.mistakeChosen && !this.mistake && this.mistakeTries < 8 &&
        !s.ramMs && !s.boostMs && !s.invulnerableMs) {
      const h = hazards.find(h => !this.mistakeActors.has(h.id) && !['audit', 'block'].includes(h.kind) && h.distance / Math.max(s.speed, 30) > 1.1 &&
        h.distance / Math.max(s.speed, 30) < 2.7);
      if (h) { this.mistake = h; this.mistakeTries++; this.mistakeActors.add(h.id); this.observed.event('intentional-lane-error', { actor: h.kind, id: h.id }); }
    }
    if (this.mistake && (s.progress > this.mistake.at + 1 || s.stumbleMs > 0)) this.mistake = null;

    if (now >= this.nextDecision) {
      this.nextDecision = now + p.decisionMs;
      let desired = pulse && pulseSec < 2.4 ? pulse.lane : this.target;
      if (this.mistake) desired = this.mistake.targetLane ?? this.mistake.lane;
      else {
        const candidates = [0, 1, 2, 3];
        const score = lane => {
          let cost = Math.abs(lane - desired) * (pulse && pulseSec < 2.4 ? 3 : .4) + Math.abs(lane - this.target) * .3;
          for (const h of hazards) {
            const time = h.distance / Math.max(26, s.speed);
            if (time > 3.0 || time < -.03) continue;
            const atLane = s.lanePos + clamp(lane - s.lanePos, -2.1 * Math.max(0, time), 2.1 * Math.max(0, time));
            const other = Number.isFinite(h.targetLane) ? h.targetLane : h.lane;
            const gap = Math.abs(other - atLane), width = ['freight', 'shuttle', 'sweeper'].includes(h.kind) ? .67 : .59;
            if (gap < width) cost += (s.shield || s.ramMs > time * 1000 || s.boostMs > time * 1000 ? 2 : 32) * (1 + (3 - time) / 2);
          }
          // A visible rival lock is another announced contact to steer past.
          const warning = pursuit?.warning ?? s.rivalWarning;
          const rivalLane = pursuit?.lockLane ?? pursuit?.targetLane ?? pursuit?.lane ?? s.rivalLane;
          const rivalDistance = pursuit ? pursuit.at - s.progress : s.nextRivalAt - s.progress;
          if (warning && rivalDistance > 0 && rivalDistance / Math.max(s.speed, 30) < 2.6 &&
              Math.abs(lane - rivalLane) < .72) cost += 22;
          return cost;
        };
        desired = candidates.sort((a, b) => score(a) - score(b))[0];
      }
      this.target = clamp(desired, 0, 3);
    }

    if (this.ramTarget && (s.ramMs <= 0 || s.progress > this.ramTarget.at + 1)) this.ramTarget = null;
    if (this.options.seekPush && !this.ramTarget && s.musicBar < 74 && s.ramMs > 1500) {
      const actor = hazards.find(h => h.kind !== 'audit' && h.kind !== 'block' &&
        h.distance / Math.max(s.speed, 30) > Math.abs(h.lane - s.lanePos) / 2.0 + .3 &&
        h.distance / Math.max(s.speed, 30) < s.ramMs / 1000 - .35);
      if (actor) { this.ramTarget = actor; this.observed.event('push-route-input', { id: actor.id, actor: actor.kind }); }
    }
    if (this.ramTarget) this.target = this.ramTarget.targetLane ?? this.ramTarget.lane;
    const cue = view.cue;
    if (!this.mistake && Array.isArray(cue) && /PREPARE|SPLIT|DELIVERY/.test(cue[0]) && s.gateAt == null) this.target = 0;
    const final = view.gate?.at != null && !view.gate.open;
    if (final && this.options.failFirstExit && !road.chapter.retries) {
      this.target = 3; // Explicit missed final Echo; exercise the real failure/retry route.
    } else if (final) {
      // At the visible final split: put a decoy on the left, move to the
      // right delivery lane. Do not inspect unpublished pursuit schedules.
      if (!this.finalEcho && !s.echo) {
        this.target = 0;
        if (s.lanePos <= .35 && s.echoEnergy >= 100) {
          pad.buttons[5].pressed = true; this.finalEcho = true; this.lastEcho = now;
          this.observed.event('final-echo-input');
        }
      } else this.target = 3;
    } else if (s.echoEnergy >= 100 && now - this.lastEcho > 3500) {
      const audit = hazards.find(h => h.kind === 'audit' && h.distance / Math.max(s.speed, 30) < 3.8);
      const pursuitWarning = pursuit?.warning ?? s.rivalWarning;
      if (audit || pursuitWarning) {
        pad.buttons[5].pressed = true; this.lastEcho = now;
        this.target = s.lanePos < 1.5 ? 3 : 0;
      }
    }
    // Turbo is a deliberate response to close traffic, with no pulse due
    // during its immediate input. Its actual acceleration remains bar-owned.
    if (!final && !earlyProbe && !this.mistake && !this.ramTarget && s.boost > 0 && !s.queuedTurbo && now - this.lastTurbo > 6500 &&
        pulseSec > .4 && hazards.some(h => h.distance / Math.max(s.speed, 30) < 1.4 && Math.abs(h.lane - s.lanePos) < .7)) {
      pad.buttons[4].pressed = true; this.lastTurbo = now; this.observed.event('turbo-input');
    }
    if (!this.mistake && !this.ramTarget && pulse && !this.omitted.has(pulse.id)) {
      const record = this.seen.get(pulse.id), targetSec = record.target * 60 / 128 + record.jitter / 1000;
      const heardSec = s.musicBeatFloat * 60 / 128;
      if (heardSec >= targetSec && heardSec < targetSec + .07) {
        const action = typeof pulse.action === 'string' ? pulse.action : ['road_a', 'road_b', 'road_x', 'road_y'][pulse.action];
        if (ACTION_BUTTON[action] !== undefined && !(p.mistake && !this.mistakeChosen && s.musicBar >= 30 && action === 'road_x') &&
            !(earlyProbe && ['road_b', 'road_x'].includes(action))) pad.buttons[ACTION_BUTTON[action]].pressed = true;
        this.pressed.add(pulse.id);
      }
    }
    if (this.options.failFirstExit && !road.chapter.retries && s.musicBar >= 90) pad.buttons[5].pressed = false;
    pad.axes[0] = Math.abs(this.target - s.lanePos) > p.aimTolerance ? Math.sign(this.target - s.lanePos) : 0;
  }
  resetAfterRetry() {
    this.frames = []; this.nextDecision = 0; this.finalEcho = false; this.mistake = null;
    this.pressed.clear(); this.seen.clear(); this.omitted.clear(); this.nextGearRequest = 200; this.target = this.r.road.state.lanePos;
  }
}

async function runRace({ difficulty = 'standard', gear = 1, profile = 'practiced', retryLimit = 0, onReady, onFrame, gearSchedule = [], failFirstExit = false, seekPush = false, earlyHits = 0 } = {}) {
  const r = await raceRig(difficulty), observed = instrument(r);
  // Rendering is a host boundary in this balance study. Preserve the real
  // renderer for native review callbacks without drawing 9,375 mock frames.
  r.drawRoad = r.road.draw.bind(r.road); r.road.draw = () => {};
  const initialTimerMs = r.road.state.timeMs;
  const driver = new Driver(r, PROFILES[profile], gear, observed, { gearSchedule, failFirstExit, seekPush, earlyHits });
  if (onReady) await onReady(r);
  let minimumIntegrity = r.road.state.integrity, frames = 0, retries = 0, maxStack = 0;
  const checkpoints = [], failures = [], gearFrames = [0, 0, 0];
  let lastCheckpoint = r.C.readResume()?.checkpointId;
  const originalRun = r.road.chapter.runId; let observedDeceptions = 0, lastDeceptions = 0;
  for (; frames < 24000; frames++) {
    if (r.road.status !== 'playing') {
      if (r.road.status === 'clear' || retries >= retryLimit) break;
      failures.push({ bar: round(r.road.state.musicBeatFloat / 4), checkpoint: lastCheckpoint,
        gateFailure: r.road.state.gateFailure, message: r.road.state.message });
      for (const button of r.pad.buttons) button.pressed = false; r.pad.axes = [0, 0]; r.input();
      assert(r.road.retry(), 'retry uses the production checkpoint route'); retries++;
      assert.equal(r.road.chapter.runId, originalRun, 'checkpoint retry keeps the actual authored run');
      lastDeceptions = 0; driver.resetAfterRetry(); continue;
    }
    driver.step(); r.step(20, 50);
    if (onFrame) await onFrame(r, frames);
    const s = r.road.state;
    minimumIntegrity = Math.min(minimumIntegrity, s.integrity); gearFrames[s.gear]++;
    if (s.echoDeceptions > lastDeceptions) { observedDeceptions += s.echoDeceptions - lastDeceptions; observed.event('echo-deception'); }
    lastDeceptions = s.echoDeceptions;
    maxStack = Math.max(maxStack, new Set([...(s.captures || []), ...(s.queuedCaptures || [])].map(c => c.lane)).size);
    const checkpoint = r.C.archive().record.current?.checkpointId;
    if (checkpoint !== lastCheckpoint) { checkpoints.push({ id: checkpoint, bar: round(s.musicBeatFloat / 4), integrity: s.integrity }); lastCheckpoint = checkpoint; }
  }
  const s = r.road.state, chapter = r.road.chapter;
  const damage = observed.events.filter(e => e.kind === 'damage');
  const recoveries = damage.map(hit => {
    const next = observed.events.find(e => e.kind === 'capture' && e.elapsedMs > hit.elapsedMs);
    return { bar: hit.bar, retained: hit.capturesAfter.length + hit.queuedAfter.length,
      previous: hit.capturesBefore.length + hit.queuedBefore.length,
      nextCaptureMs: next ? round(next.elapsedMs - hit.elapsedMs) : null };
  });
  const result = { difficulty, gear: gear + 1, profile, gearSchedule, failFirstExit, seekPush, earlyHits, initialTimerMs, status: r.road.status, finalBar: round(s.musicBeatFloat / 4),
    elapsedMs: round(chapter.elapsedMs), distance: round(s.progress), score: s.score,
    integrity: s.integrity, minimumIntegrity, gearFrames, damageTaken: chapter.damageTaken, retries,
    attempts: chapter.attempts, captured: chapter.accurate, perfect: chapter.perfect, announced: observed.pulses.size,
    omittedInputs: driver.omitted.size, bestCombo: chapter.bestCombo, maxCapturedParts: maxStack,
    nearPasses: observed.events.filter(e => e.kind === 'near-pass').length,
    echoUses: observed.events.filter(e => e.kind === 'echo').length, echoDeceptions: observedDeceptions,
    turboUses: observed.events.filter(e => e.kind === 'turbo-input').length,
    pushContacts: observed.events.filter(e => e.kind === 'push').length,
    braceContacts: observed.events.filter(e => e.kind === 'brace').length,
    gateOpen: s.gateOpen, gateFailure: s.gateFailure, finalMessage: s.message,
    checkpoints, failures, recoveries, events: observed.events };
  for (const button of r.pad.buttons) button.pressed = false;
  return { result, rig: r, driver };
}

function report(results) {
  const policy = { framesPerSecond: 50, simulation: 'production ActionInput + RAF + road + music transport; mocked canvas/audio/storage boundaries',
    restrictions: 'No position/health/immunity/ability/capture/score writes. Only gamepad controls. No hidden chart lookup.',
    practiced: PROFILES.practiced, recovering: PROFILES.recovering,
    caveat: 'Deterministic controller study; these are not human success rates, browser sound judgments, or Makko/device acceptance.' };
  const early = results.find(r => r.earlyHits === 2);
  const tunedFrom = { issue: 'Initial timer exhausted before the first checkpoint despite remaining integrity',
    before: { initialTimerMs: 55000, difficulty: 'standard', gear: 2, earlyHits: 2,
      hitBars: [8.213, 10.635], status: 'failed', finalBar: 27.413, elapsedMs: 51400,
      integrity: 1, reason: 'TRANSMISSION WINDOW CLOSED' },
    change: 'Fresh authored runs and road-start retries receive 60000 ms; later verse checkpoints remain 55000 ms.',
    after: early ? { initialTimerMs: early.initialTimerMs, status: early.status,
      finalBar: early.finalBar, elapsedMs: early.elapsedMs, integrity: early.integrity,
      hitBars: early.events.filter(e => e.kind === 'damage').map(e => e.bar), retries: early.retries } : null };
  return { schemaVersion: 1, policy, tunedFrom, completed: results.filter(r => r.status === 'clear').length,
    runs: results.length, results };
}
function markdown(data) {
  return '# Cache Line full-race balance study\n\n' + data.policy.caveat + '\n\n' +
    'The controller uses delayed production-visible observations and actual gamepad input. All road travel, captures, collisions, abilities, gate checks and checkpoint retries run through production code at 50 updates/second. No immunity or gameplay state is injected. Gears 1 and 3 engage using the normal first-bar queued gear input. The recovering profile skips every fifth offered action, has more timing error, and skips Brace before deliberately staying in visible convoy lanes until one unprotected contact probes recovery.\n\n' +
    '| Driver | Difficulty | Gear | Result | Bar | Hits | Retries | Captures | Best chain | Push / Brace | Echo | Integrity |\n' +
    '| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |\n' +
    data.results.map(r => `| ${r.profile}${r.gearSchedule.length ? ' + gear changes' : r.failFirstExit ? ' + missed exit' : r.seekPush ? ' + ram route' : r.earlyHits ? ' + two early hits' : ''} | ${r.difficulty} | ${r.gear} | ${r.status} | ${r.finalBar} | ${r.damageTaken} | ${r.retries} | ${r.captured}/${r.announced} | ${r.bestCombo} | ${r.pushContacts} / ${r.braceContacts} | ${r.echoUses} | ${r.integrity} |`).join('\n') + '\n\n' +
    `Completed: ${data.completed}/${data.runs}. Exact events, failures, checkpoints and recovery durations are in the companion JSON.\n\n` +
    (data.tunedFrom?.after ? 'The early-contact probe found a timer-only failure: with the original 55-second start, two real hits at bars 8.213 and 10.635 left one integrity but exhausted the timer at bar 27.413, before the first checkpoint. The fresh authored start was increased to 60 seconds. Identical inputs now complete all 100 bars with one integrity and no retry. Later verse timers and legacy runs remain unchanged.\n\n' : '') +
    'Recovery samples below include an actual unprotected collision. Time to the next capture includes further timing mistakes, skipped inputs and driving around traffic; it is not a forced recovery delay.\n\n' +
    '| Difficulty | Gear | Hit bar | Parts before → retained | Next capture |\n| --- | ---: | ---: | ---: | ---: |\n' +
    data.results.filter(r => r.profile === 'recovering').flatMap(r => r.recoveries.map(hit =>
      `| ${r.difficulty} | ${r.gear} | ${hit.bar} | ${hit.previous} → ${hit.retained} | ${hit.nextCaptureMs === null ? 'none' : `${round(hit.nextCaptureMs / 1000, 2)} s`} |`)).join('\n') +
    '\n\nReproduce with `node tools/check-cache-road-races.cjs --write`. The default check runs the same races without rewriting artifacts. `--profile=practiced --difficulty=standard --gear=3` isolates one run. `--observe` reports failed routes without asserting full completion, for tuning.\n';
}
async function main() {
  const args = process.argv.slice(2), results = [];
  const requested = name => args.find(a => a.startsWith(`--${name}=`))?.split('=')[1];
  for (const profile of requested('profile') ? [requested('profile')] : Object.keys(PROFILES))
    for (const difficulty of requested('difficulty') ? [requested('difficulty')] : DIFFICULTIES)
      for (const gear of requested('gear') ? [Number(requested('gear')) - 1] : [0, 1, 2]) {
        const { result } = await runRace({ difficulty, gear, profile, retryLimit: profile === 'recovering' ? 3 : 0 });
        results.push(result); console.log(JSON.stringify({ ...result, checkpoints: result.checkpoints.length, events: result.events.length, recoveries: result.recoveries }));
      }
  if (!requested('profile') && !requested('difficulty') && !requested('gear')) {
    for (const options of [{ difficulty: 'standard', gear: 1, profile: 'practiced', gearSchedule: [{ bar: 24, gear: 0 }, { bar: 48, gear: 2 }, { bar: 80, gear: 1 }] },
      { difficulty: 'standard', gear: 2, profile: 'practiced', failFirstExit: true, retryLimit: 1 },
      { difficulty: 'standard', gear: 1, profile: 'practiced', seekPush: true },
      { difficulty: 'standard', gear: 1, profile: 'practiced', earlyHits: 2 }]) {
      const { result } = await runRace(options); results.push(result); console.log(JSON.stringify({ ...result, events: result.events.length }));
    }
  }
  const data = report(results);
  if (args.includes('--write')) {
    const out = path.resolve(__dirname, '../docs/source-pack/review-cache-encounters'); fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'full-race-balance.json'), JSON.stringify(data, null, 2) + '\n');
    fs.writeFileSync(path.join(out, 'full-race-balance.md'), markdown(data));
  }
  if (!args.includes('--observe')) {
    for (const result of results.filter(r => r.profile === 'practiced')) {
      assert.equal(result.status, 'clear', `${result.difficulty} gear ${result.gear}: practiced driver must complete a full race`);
      if (!result.gearSchedule.length && !result.failFirstExit) assert(result.echoDeceptions > 0, 'each full race visibly deceives the pursuit');
      if (!result.gearSchedule.length) assert(result.gearFrames[result.gear - 1] > 9000, 'the requested gear actually owns the race');
      if (result.earlyHits) assert(result.events.filter(e => e.kind === 'damage' && e.bar < 28).length >= result.earlyHits, 'two early unprotected contacts exercise the first-checkpoint timer budget');
      if (result.seekPush) assert(result.pushContacts > 0, 'earned Push has a real visible traffic route and contact');
      if (result.failFirstExit) assert.equal(result.retries, 1, 'the missed final Echo uses one genuine checkpoint retry');
    }
    const recovering = results.filter(r => r.profile === 'recovering');
    if (recovering.length === 9) assert(recovering.every(r => r.damageTaken >= 1 && r.recoveries.some(hit => hit.nextCaptureMs !== null && hit.previous > 1 && hit.retained === hit.previous - 1)), 'all nine recovery races must include real damage and a later capture');
  }
}
module.exports = { raceRig, Driver, runRace, report, markdown, PROFILES };
if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
