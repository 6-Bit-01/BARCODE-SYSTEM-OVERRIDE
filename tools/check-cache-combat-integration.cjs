#!/usr/bin/env node
// Fresh v4 combat through the production Campaign, ActionInput and shared RAF.
// Audio/Canvas/storage are controlled hosts. No progress, immunity, health,
// sync, resources, captures, enemy damage or victory facts are injected.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { completionRig } = require('./check-cache-completion-flow.cjs');
const { Driver, instrument, PROFILES } = require('./check-cache-road-races.cjs');
const { load } = require('./check-level-01-boss');
const root = path.resolve(__dirname, '..');
const copy = value => JSON.parse(JSON.stringify(value));
const flush = async () => { for (let i = 0; i < 24; i++) await Promise.resolve(); };
const DIFFICULTIES = ['relaxed', 'standard', 'overclocked'];
const BUTTONS = { attack: 5, turbo: 4, defend: 7, disrupt: 6 };
const MUSIC_LEVELS = { drive: .19, flow: .55, breakaway: .50, undercurrent: .62 };
const OWNERS = ['src/game/cache-road-encounters.js', 'src/game/cache-road-reactions.js',
  'src/game/cache-road-pursuit.js', 'src/game/cache-road-combat.js'];
const SOURCES = [...OWNERS, 'src/game/cache-road-proof.js', 'src/game/cache-chapter.js',
  'src/core/action-input.js', 'src/core/gamepad-ui.js', 'src/core/input.js', 'src/core/loop.js',
  'src/core/runtime-lifecycle.js', 'src/engine/cache-road-proof-profile.js',
  'src/engine/music-transport.js', 'src/engine/music-director.js',
  'tools/check-cache-road-races.cjs', 'tools/check-cache-completion-flow.cjs',
  'tools/check-cache-combat-integration.cjs'];
const hashes = () => Object.fromEntries(SOURCES.map(file => [file,
  crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));

function loadOwners(r) { for (const file of OWNERS) load(r.context, file); }
async function combatRig(difficulty = 'standard', storage, saved) {
  const r = completionRig(storage, { encounterVersion: 4 }); loadOwners(r);
  // completionRig deliberately overrides fresh versions for historical
  // fixtures. Reload the actual chapter owner so this gate also catches a
  // mistaken production fresh default instead of supplying version four.
  load(r.context, 'src/game/cache-chapter.js'); r.chapter = r.B.CacheChapter;
  assert(r.B.CacheRoadCombat, 'the production combat owner must load before road entry');
  if (!saved) {
    saved = r.finish(); saved.levelState.difficultyId = difficulty;
    saved.levelState.run.difficultyId = difficulty;
    await r.boot(saved); r.bridge.skipToReady(); assert((await r.bridge.drive()).ok);
    assert(r.road.finishIntro());
    assert.equal(r.road.state.invulnerableMs, 0, 'fresh validation never begins with immunity');
    assert.equal(r.road.state.musicBar, 0);
    // The real opening release-arms its next input owner. Poll a released
    // pad before beginning the driving controls, as the full race does.
    r.input(); r.step(20, 50);
  } else await r.boot(saved);
  assert.equal(r.road.chapter.encounterVersion, 4);
  assert.equal(r.road.chapter.difficultyId, difficulty);
  assert(r.road.encounterSnapshot().combat, 'the driver sees the same visible combat presentation as the player');
  if (!r.B.musicDirector) load(r.context, 'src/engine/music-director.js');
  r.audio.layersStarted = true; r.audio.isLooping = false;
  r.audio.getActiveMusicProfile = () => r.B.MusicProfiles.getActive();
  for (const source of r.B.MusicProfiles.getActive().arrangement.sources)
    Object.assign(r.audio.musicTracks[source.sourceId], { isPlaying: true, volume: 0,
      gain: { gain: { value: 0 } } });
  r.audio.rampAdaptiveStemGain = (track, volume) => { track.volume = volume; track.gain.gain.value = volume; };
  r.audio.updateLayers = () => r.B.musicDirector.apply(r.audio);
  r.drawRoad = r.road.draw.bind(r.road); r.road.draw = () => {};
  return r;
}

function observeCombat(r) {
  const observed = instrument(r), combat = r.B.CacheRoadCombat;
  const award = r.road.awardPulse.bind(r.road);
  r.road.awardPulse = function(pulse, judgment, ...rest) {
    const beforeScore = this.state.score, result = award(pulse, judgment, ...rest);
    const capture = [...this.state.captures, ...this.state.queuedCaptures].find(item => item.lane === pulse.lane);
    const audibleNow = r.audio.getOutputAudioTime?.() ?? r.audio.context.currentTime;
    const awardClock = r.B.MusicTransport.sample(audibleNow);
    observed.event('music-award', { id: pulse.id, action: pulse.action, musicLane: pulse.lane,
      targetBeat: judgment.beatIndex, awardedBeat: awardClock.grid?.beatFloat,
      visibleBeat: this.state.musicBeatFloat,
      holdBars: this.state.pulseHoldBars, capture: copy(capture),
      scoreBefore: beforeScore, scoreAfter: this.state.score });
    return result;
  };
  const hit = r.road.hit.bind(r.road);
  r.road.hit = function(...args) {
    const integrity = this.state.integrity, result = hit(...args);
    if (this.state.integrity < integrity) observed.event('wreck-recovery', {
      gear: this.state.gear, queuedRecovery: this.state.queuedRecovery,
      recoveryBeat: this.state.recoveryBeat, actor: args[0] });
    return result;
  };
  for (const method of ['act', 'step']) {
    const original = combat[method].bind(combat);
    combat[method] = function(...args) {
      const before = r.road.encounterSnapshot().combat;
      const result = original(...args);
      if (method === 'act') observed.event('combat-input', { skill: args.find(arg => typeof arg === 'string'),
        accepted: result?.accepted === true, reason: result?.reason || null,
        syncBefore: before?.syncCount ?? null });
      for (const event of Array.isArray(result) ? result : result?.events || []) {
        const { kind: actorKind, ...detail } = copy(event);
        observed.event('combat-event', { ...detail, actorKind, sourceMethod: method });
      }
      return result;
    };
  }
  return observed;
}

class CombatDriver extends Driver {
  constructor(r, profile, gear, observed, options = {}) {
    super(r, profile, gear, observed, { ...options, noEcho: true, noTurbo: true });
    this.combatOptions = options; this.lastCombatPress = {};
  }
  snapshot() {
    const view = super.snapshot(), raw = this.r.road.encounterSnapshot();
    // The new owner supplies combat targets. Retired exit prose cannot steer
    // this driver into the old left-Echo/right-delivery choreography.
    return { ...view, combat: copy(raw.combat), pursuit: null, cue: null };
  }
  step() {
    super.step();
    const { road, pad } = this.r, s = road.state, view = this.frames[0];
    const combat = view?.combat; if (!combat) return;
    const actors = (combat.actors || []).map(actor => ({ ...actor, distance: actor.at - s.progress }));
    const near = actors.filter(actor => actor.hp > 0 && actor.distance >= -65 && actor.distance <= 300);
    const pulse = [...this.seen.values()].filter(item => !this.pressed.has(item.id) && !this.omitted.has(item.id) &&
      item.target >= s.musicBeatFloat - .6).sort((a, b) => a.target - b.target)[0];
    const pulseSoon = pulse && (pulse.target - s.musicBeatFloat) * 60 / 128 < 1.0;
    const threats = near.filter(actor => (actor.warning || actor.locked) &&
      Math.abs((actor.lockLane ?? actor.lane) - s.lanePos) < .65);
    const incoming = (combat.projectiles || []).filter(projectile => !projectile.friendly &&
      projectile.at - s.progress > 0 && projectile.at - s.progress < 180 && Math.abs(projectile.lane - s.lanePos) < .65);
    const target = near.filter(actor => actor.vulnerable || !actor.warning)
      .sort((a, b) => Number(b.boss) - Number(a.boss) || Math.abs(a.distance) - Math.abs(b.distance))[0];
    if (!this.mistake && !pulseSoon && target && !threats.length) this.target = target.lane;
    if (!this.mistake && (threats.length || incoming.length)) {
      const dangerLanes = [...threats.map(actor => actor.lockLane ?? actor.lane), ...incoming.map(projectile => projectile.lane)];
      this.target = [0, 1, 2, 3].filter(lane => dangerLanes.every(danger => Math.abs(lane - danger) >= .9))
        .sort((a, b) => Math.abs(a - s.lanePos) - Math.abs(b - s.lanePos))[0] ?? this.target;
    }
    const skills = combat.skills || {};
    const press = skill => {
      if (!skills[skill]?.ready || s.elapsedMs - (this.lastCombatPress[skill] ?? -10000) < 150) return;
      pad.buttons[BUTTONS[skill]].pressed = true; this.lastCombatPress[skill] = s.elapsedMs;
      this.observed.event('combat-driver-input', { skill });
    };
    if (!this.combatOptions.noCombat && !this.mistake) {
      if (near.some(actor => Math.abs(actor.lane - s.lanePos) <= 1.02 && actor.distance < 260)) press('attack');
      if (threats.some(actor => actor.locked && actor.distance < 100) || incoming.length) press('defend');
      if (near.some(actor => actor.warning && actor.distance < 170)) press('disrupt');
      if (!pulseSoon && !s.queuedTurbo && !s.boostMs && s.musicBar < 92 &&
          near.some(actor => actor.distance > 40 && actor.distance < 220)) press('turbo');
    }
    if (this.combatOptions.wrongFace) for (const index of [0, 1, 2, 3]) if (pad.buttons[index].pressed) {
      pad.buttons[index].pressed = false; pad.buttons[(index + 1) % 4].pressed = true; break;
    }
    pad.axes[0] = Math.abs(this.target - s.lanePos) > this.profile.aimTolerance ? Math.sign(this.target - s.lanePos) : 0;
  }
}

async function runCombatRace({ difficulty = 'standard', gear = 1, profile = 'practiced',
  maxBar = 100, onFrame, ...options } = {}) {
  const r = await combatRig(difficulty), observed = observeCombat(r);
  const driver = new CombatDriver(r, PROFILES[profile], gear, observed, options);
  let frames = 0, drumMinimum = Infinity, minimumIntegrity = r.road.state.integrity;
  const gearFrames = [0, 0, 0], bossChanges = [], announced = new Map();
  const musicRoles = Object.fromEntries(Object.keys(MUSIC_LEVELS).map(role =>
    [role, { minimum: Infinity, maximum: 0, capturedFrames: 0 }]));
  let previousHp = null;
  for (; frames < 16000 && r.road.status === 'playing' && r.road.state.musicBeatFloat / 4 < maxBar; frames++) {
    for (const pulse of r.road.encounterSnapshot().pulses) {
      const place = { id: pulse.id, target: pulse.target, at: pulse.at };
      assert.equal(pulse.target % 4, 0, 'each visible pad continues to name beat ONE');
      if (announced.has(pulse.id)) assert.deepEqual(place, announced.get(pulse.id),
        'gear, combat acceleration, camera and wreck cannot relocate an already announced pad');
      else announced.set(pulse.id, place);
    }
    driver.step(); r.step(20, 50);
    const s = r.road.state, combat = r.road.encounterSnapshot().combat;
    assert.equal(r.road.mixSnapshot().reactivityVersion, 2, 'fresh combat keeps the existing reactive music contract');
    const activeRoles = new Set(r.B.musicDirector.state?.roles || []);
    for (const [role, gain] of Object.entries(musicRoles)) {
      const level = r.B.musicDirector.getVolume(`cache-${role}`);
      if (Number.isFinite(level)) { gain.minimum = Math.min(gain.minimum, level); gain.maximum = Math.max(gain.maximum, level); }
      if (activeRoles.has(role)) {
        gain.capturedFrames++;
        assert.equal(level, MUSIC_LEVELS[role], `${role}: a captured part reaches its preserved actual mix gain`);
      }
    }
    gearFrames[s.gear]++; minimumIntegrity = Math.min(minimumIntegrity, s.integrity);
    drumMinimum = Math.min(drumMinimum, r.B.musicDirector.getVolume('cache-pressure') ?? Infinity);
    if (combat.boss && combat.boss.hp !== previousHp) {
      bossChanges.push({ bar: s.musicBeatFloat / 4, previousHp, ...copy(combat.boss) }); previousHp = combat.boss.hp;
    }
    if (onFrame) await onFrame(r, observed, driver, frames);
  }
  const s = r.road.state, chapter = r.road.chapter, combat = copy(r.road.encounterSnapshot().combat);
  const damage = observed.events.filter(event => event.kind === 'damage');
  const result = { difficulty, gear: gear + 1, profile, ...options, encounterVersion: chapter.encounterVersion,
    status: r.road.status, finalBar: s.musicBeatFloat / 4, frames, gearFrames,
    integrity: s.integrity, minimumIntegrity, damageTaken: chapter.damageTaken, drumMinimum, musicRoles,
    accurate: chapter.accurate, attempts: chapter.attempts, connected: chapter.connected,
    combat, bossChanges, announced: [...announced.values()], events: observed.events,
    recoveries: damage.map(hit => ({ ...hit, nextCaptureMs: observed.events.find(event =>
      event.kind === 'capture' && event.elapsedMs > hit.elapsedMs)?.elapsedMs - hit.elapsedMs })) };
  return { r, observed, driver, result };
}

function assertClear(result) {
  assert.equal(result.encounterVersion, 4);
  assert.equal(result.status, 'clear', `${result.difficulty}, gear ${result.gear}: complete source recording clears`);
  assert(Math.abs(result.finalBar - 100) < 1e-8, 'the complete 100-bar recording finishes on its audio clock');
  assert(result.combat.boss?.defeated && result.combat.boss.hp === 0,
    'actual weapon damage defeats the rig before delivery');
  assert(result.events.some(event => event.kind === 'combat-event' && event.type === 'enemy-hit'),
    'the complete race contains physically earned enemy damage');
  assert(result.events.some(event => event.kind === 'combat-event' && event.type === 'takedown'),
    'the complete race contains an earned takedown');
  assert.equal(result.drumMinimum, .60, 'combat and recovery retain the aligned drum backbone');
  const awards = result.events.filter(event => event.kind === 'music-award');
  assert.equal(new Set(awards.map(event => event.id)).size, awards.length,
    'each physical pad awards its musical capture exactly once');
  for (const event of awards) {
    assert(event.awardedBeat >= event.targetBeat - .001, 'an early input waits until the source ONE for its reward');
    assert([3, 6].includes(event.holdBars), 'reactive music preserves its three/six-bar capture spans');
    assert(event.capture, 'each awarded musical pad creates or renews a real lane capture');
    assert.equal(event.capture.lane, event.musicLane, 'the lane selects the captured music part independently of face action');
    assert(event.capture.endBeat >= Math.min(400, event.targetBeat + event.holdBars * 4),
      'the actual capture retains its advertised hold');
  }
  for (const event of result.events.filter(event => event.kind === 'capture' && Number.isFinite(event.timingOffsetMs)))
    assert(Math.abs(event.timingOffsetMs) <= 180.00001, 'face-button captures retain the actual 180ms window');
  for (let i = 1; i < result.bossChanges.length; i++) if (result.bossChanges[i].hp < result.bossChanges[i - 1].hp)
    assert(result.events.some(event => event.kind === 'combat-event' && event.type === 'enemy-hit' &&
      event.id === result.bossChanges[i].id && ['strike', 'shot', 'turbo', 'guard', 'chain'].includes(event.cause) &&
      Math.abs(event.bar - result.bossChanges[i].bar) < .1),
    'each boss HP loss is attributed to a real weapon, contact, guard or physical chain hit');
}

async function checkZeroSyncControls() {
  const receipts = [];
  for (const [skill, button] of Object.entries(BUTTONS)) {
    const r = await combatRig(), observed = observeCombat(r), before = copy(r.road.encounterSnapshot().combat);
    assert.equal(before.syncCount, 0);
    assert(before.skills[skill].ready, `${skill} is available before a single musical capture`);
    if (skill === 'attack') {
      // An empty road is correctly not a weapon target. Steer toward an
      // actually visible opponent while withholding every music input.
      for (let frame = 0; frame < 1200 && !r.road.encounterSnapshot().combat.target; frame++) {
        const visible = r.road.encounterSnapshot().combat.actors.find(actor => actor.hp > 0);
        r.pad.axes[0] = visible && Math.abs(visible.lane - r.road.state.lanePos) > .06 ?
          Math.sign(visible.lane - r.road.state.lanePos) : 0;
        r.step(20, 50);
      }
      assert(r.road.encounterSnapshot().combat.target, 'Attack acquires a physically reachable visible opponent');
      assert.equal(r.road.encounterSnapshot().combat.syncCount, 0);
    }
    r.pad.buttons[button].pressed = true; r.step(20, 50);
    const accepted = observed.events.filter(event => event.kind === 'combat-input' && event.accepted);
    assert.equal(accepted.length, 1, `${skill}: its mapped production edge reaches exactly one combat action`);
    assert.equal(accepted[0].skill, skill); assert.equal(accepted[0].syncBefore, 0);
    r.step(skill === 'attack' ? 1000 : 120, 50);
    assert.equal(observed.events.filter(event => event.kind === 'combat-input' && event.accepted).length, 1,
      `${skill}: a held controller button cannot auto-repeat an edge action`);
    assert.equal(observed.events.filter(event => event.kind === 'combat-input').length, 1,
      `${skill}: holding a button does not flood the combat owner with rejected repeats`);
    assert.equal(r.road.chapter.accurate, 0, 'shoulder/trigger skills cannot impersonate a face-button music hit');
    if (skill === 'turbo') {
      assert(r.road.state.queuedTurbo && !r.road.state.boostMs, 'zero-sync Turbo still waits for the next ONE');
      r.pad.buttons[button].pressed = false;
      while (r.road.state.musicBeatFloat < 4.1) r.step(20, 50);
      assert(r.road.state.boostMs > 0, 'the actual queued Turbo launches on its audio-owned bar');
    }
    receipts.push({ skill, button, accepted: copy(accepted[0]), after: copy(r.road.encounterSnapshot().combat.skills[skill]) });
  }
  return receipts;
}

async function checkNineRaces() {
  const results = [];
  for (const difficulty of DIFFICULTIES) for (const gear of [0, 1, 2]) {
    const { result } = await runCombatRace({ difficulty, gear }); assertClear(result);
    assert(result.accurate > 5, 'combat keeps the independent musical arrangement earnable');
    assert.deepEqual([...new Set(result.events.filter(event => event.kind === 'capture').map(event => event.action))].sort(),
      ['road_a', 'road_b', 'road_x', 'road_y'], 'all four mapped face buttons still capture real announced music pads');
    assert(result.gearFrames[gear] > 8500, 'the requested gear actually owns the full race');
    assert(Object.values(result.musicRoles).every(role => role.capturedFrames > 0 && role.maximum > role.minimum),
      'all four captured music parts genuinely enter and leave the live mix');
    results.push(result); console.log(`Combat production race: ${difficulty}, gear ${gear + 1}, clear.`);
  }
  return results;
}

async function checkDamageRecovery() {
  const { result } = await runCombatRace({ difficulty: 'standard', gear: 1, profile: 'recovering' });
  assertClear(result);
  assert(result.damageTaken >= 1 && result.recoveries.some(hit =>
    hit.capturesBefore.length + hit.queuedBefore.length > 1 &&
    hit.capturesAfter.length + hit.queuedAfter.length === hit.capturesBefore.length + hit.queuedBefore.length - 1 &&
    Number.isFinite(hit.nextCaptureMs) && hit.nextCaptureMs > 0),
  'a genuine unprotected contact loses exactly one music part and later real input recaptures it');
  assert(result.events.filter(event => event.kind === 'wreck-recovery').every(event =>
    event.gear === 0 && event.queuedRecovery && event.recoveryBeat % 4 === 0),
  'actual wrecks select first gear and queue physical recovery on the next ONE');
  return result;
}

async function checkMusicNegatives() {
  const results = [];
  for (const options of [{ timingBiasMs: -240 }, { timingBiasMs: 240 }, { wrongFace: true }]) {
    const { result } = await runCombatRace({ ...options, maxBar: 28 });
    assert(result.status === 'playing' && result.finalBar >= 28, 'each failed-music probe actually runs the complete 28-bar introduction');
    assert.equal(result.accurate, 0, 'wrong-button and out-of-window production input never captures a music part');
    assert(result.events.some(event => event.kind === 'missed-press' &&
      event.feedback === (options.wrongFace ? 'button' : options.timingBiasMs < 0 ? 'early' : 'late')),
    'the production owner explains the actual failed press');
    assert(result.events.some(event => event.kind === 'combat-input' && event.accepted && event.syncBefore === 0),
      'combat remains usable while every musical attempt fails and sync stays zero');
    assert.equal(result.drumMinimum, .60);
    results.push(result);
  }
  for (const timingBiasMs of [-175, 150]) {
    const { result } = await runCombatRace({ timingBiasMs, maxBar: 28 });
    const accepted = result.events.filter(event => event.kind === 'capture');
    assert(accepted.some(event => Math.abs(event.timingOffsetMs) > 130 && Math.abs(event.timingOffsetMs) <= 180),
      'fresh v4 accepts genuine production presses in each expanded half of the retained 180ms window');
    assert(accepted.every(event => Math.abs(event.timingOffsetMs) <= 180.00001));
    results.push(result);
  }
  return results;
}

async function checkCombatPersistence() {
  let r = await combatRig(), observed = observeCombat(r),
    driver = new CombatDriver(r, PROFILES.practiced, 1, observed);
  let saved, before, frames = 0;
  for (; frames < 12000 && r.road.status === 'playing'; frames++) {
    driver.step(); r.step(20, 50);
    const combat = r.road.encounterSnapshot().combat;
    if (combat.boss && combat.boss.hp > 0 && combat.boss.hp <= combat.boss.maxHp - 3) {
      before = copy(combat); saved = r.road.makeCheckpoint('road-verse-4'); break;
    }
  }
  assert(saved && before.boss.hp > 0, 'a midboss checkpoint is taken only after real weapon damage');
  assert(r.road.validate(saved), 'the current owner accepts its actually earned combat checkpoint');
  const persisted = copy(saved.levelState.proof.combat), runId = r.road.chapter.runId;
  assert(persisted && Array.isArray(persisted.ledger), 'combat saves retain the actual damage/takedown ledger');
  const rejected = [];
  for (const [name, mutate] of [
    ['forged-gate', candidate => { candidate.levelState.proof.gateOpen = true; }],
    ['future-chapter', candidate => { candidate.levelState.chapter.encounterVersion = 5; }],
    ['future-combat', candidate => { candidate.levelState.proof.combat.version += 100; }],
    ['forged-boss-health', candidate => { candidate.levelState.proof.combat.boss.hp = 0; }],
    ['forged-ledger-damage', candidate => { candidate.levelState.proof.combat.ledger[0].damage += 1; }]
  ]) {
    const candidate = copy(saved); mutate(candidate);
    assert.equal(r.road.validate(candidate), false, `${name}: impossible combat facts are rejected before restoration`);
    rejected.push(name);
  }
  const paused = copy({ checkpoint: r.road.makeCheckpoint('road-verse-4'),
    progress: r.road.state.progress, beat: r.road.state.musicBeatFloat,
    captures: r.road.state.captures, queued: r.road.state.queuedCaptures,
    pending: r.road.state.pendingPulseAwards, camera: r.road.state.cameraMotion,
    combat: r.road.encounterSnapshot().combat });
  r.tap('p'); r.input(); await flush(); assert(r.w.isPaused);
  r.step(1200, 50);
  assert.deepEqual(copy({ checkpoint: r.road.makeCheckpoint('road-verse-4'),
    progress: r.road.state.progress, beat: r.road.state.musicBeatFloat,
    captures: r.road.state.captures, queued: r.road.state.queuedCaptures,
    pending: r.road.state.pendingPulseAwards, camera: r.road.state.cameraMotion,
    combat: r.road.encounterSnapshot().combat }), paused,
  'shared lifecycle Pause freezes physical progress, audible beat, music awards, camera and combat together');
  r.tap('p'); r.input(); await flush(); assert(!r.w.isPaused);
  assert(r.C.archive().checkpoint(saved)); const storage = r.storage;
  await r.B.RuntimeLifecycle.stop('earned-combat-midboss-reload');
  r = await combatRig('standard', storage, saved);
  assert.equal(r.road.chapter.runId, runId);
  const restored = copy(r.road.encounterSnapshot().combat);
  assert.equal(restored.boss.hp, before.boss.hp, 'reload preserves actual boss damage');
  assert.deepEqual(copy(r.road.makeCheckpoint('road-verse-4').levelState.proof.combat.ledger), persisted.ledger,
    'reload preserves exact earned takedown/damage attribution');
  assert((restored.projectiles || []).length === 0 && (restored.actors || []).every(actor => !actor.locked),
    'restoration drops partial projectiles and re-arms complete visible threats');
  const expired = r.road.pulses().filter(pulse => pulse.target <= saved.levelState.proof.musicBar * 4);
  assert(expired.every(pulse => r.road.state.caughtPulses[pulse.id]),
    'no pulse on or before the saved marker is awarded again');
  observed = observeCombat(r); driver = new CombatDriver(r, PROFILES.practiced, 1, observed);
  for (let frame = 0; frame < 12000 && r.road.status === 'playing'; frame++) {
    driver.step(); r.step(20, 50);
  }
  const final = copy(r.road.encounterSnapshot().combat);
  assert.equal(r.road.status, 'clear'); assert(final.boss.defeated && final.boss.hp === 0);
  const finalLedger = copy(r.road.makeCheckpoint('road-verse-4').levelState.proof.combat.ledger);
  assert.equal(new Set(finalLedger.map(entry => entry.id)).size, finalLedger.length,
    'a resumed run never duplicates an enemy ledger entry');
  assert(finalLedger.every(entry => entry.hp + entry.damage === entry.maxHp),
    'actual post-reload damage and remaining HP remain mutually consistent');
  assert(r.road.chapter.delivery && r.C.archive().record.progress.items.includes('stem.bass') &&
    r.C.archive().record.progress.completedLevels.includes('level-02'),
  'the earned defeated rig completes and persists the authored campaign reward');
  return { savedBar: saved.levelState.proof.musicBar, before, restored, final,
    ledger: finalLedger, rejected, pausedMs: 1200 };
}

async function checkPassiveCannotWin() {
  const { result } = await runCombatRace({ noCombat: true });
  assert(result.combat.boss?.arrived, 'ordinary delayed steering actually reaches the enforcement rig');
  assert.equal(result.combat.boss.hp, 12, 'dodging and musical captures cannot fabricate rig damage');
  assert.equal(result.combat.boss.defeated, false);
  assert.equal(result.status, 'failed', 'an undefeated rig prevents delivery through the real mission owner');
  assert(result.events.every(event => event.kind !== 'combat-input'), 'this control route withholds every combat action');
  return result;
}

async function main() {
  const sources = hashes(), zeroSync = await checkZeroSyncControls(), races = await checkNineRaces();
  const recovery = await checkDamageRecovery(), musicNegatives = await checkMusicNegatives();
  const persistence = await checkCombatPersistence(), passive = await checkPassiveCannotWin();
  assert.deepEqual(hashes(), sources, 'production and validation source remain frozen throughout the combat study');
  const receipt = { passed: true, sources, sourcesStable: true, zeroSync, races, recovery, musicNegatives, persistence, passive,
    evidence: 'Production Campaign + ActionInput + shared RAF, actual delayed visible observations, native button edges and physically earned damage.',
    limits: 'Controlled Canvas/audio/storage hosts; no gameplay state injection. Not Makko, physical-controller, listening, human success rate or frame-pacing acceptance.' };
  if (process.argv.includes('--write')) {
    const out = path.join(root, 'docs/source-pack/review-cache-combat-chase'); fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'combat-integration.json'), JSON.stringify(receipt, null, 2) + '\n');
  }
  console.log('Cache combat integration passed: zero-sync controls, nine complete difficulty/gear races, real recovery, rejected music presses and earned combat persistence.');
  return receipt;
}
module.exports = { combatRig, observeCombat, CombatDriver, runCombatRace, assertClear,
  checkZeroSyncControls, checkNineRaces, checkDamageRecovery, checkMusicNegatives,
  checkCombatPersistence, checkPassiveCannotWin, hashes, main };
if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
