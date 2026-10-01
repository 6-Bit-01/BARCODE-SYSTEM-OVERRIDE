// Production road/Campaign/lifecycle persistence for the new encounter rules.
// Collision immunity isolates save geometry; check-cache-road-races owns the
// separate complete-race difficulty runs without that isolation.
const assert = require('node:assert/strict');
const { bridgeRig } = require('./check-cache-bridge.cjs');
const { load } = require('./check-level-01-boss');
const { Driver, PROFILES } = require('./check-cache-road-races.cjs');
const copy = value => JSON.parse(JSON.stringify(value));
const BEAT_SEC = 60 / 128;
const STRIKE = (1 - Math.sqrt(.83 ** 2 - 119 * .14 / 680)) * 520 - 80;
function saveRig(storage) {
  const r = bridgeRig(storage);
  for (const file of ['src/game/cache-road-encounters.js', 'src/game/cache-road-reactions.js',
    'src/game/cache-road-pursuit.js', 'src/game/cache-chapter.js']) load(r.context, file);
  r.anchor = () => { r.audioAnchor = r.audio.context.currentTime; r.beatAnchor = r.road.state.musicBar * 4; };
  return r;
}
async function fresh(difficulty = 'standard', version = 2) {
  const r = saveRig(), before = r.finish();
  before.levelState.difficultyId = difficulty;
  if (version === 1) {
    // Construct a pre-existing v1 run through the same entry/save owner.
    const create = r.B.CacheChapter.create.bind(r.B.CacheChapter);
    r.B.CacheChapter.create = options => ({ ...create(options), encounterVersion: 1 });
  }
  await r.boot(before); r.bridge.skipToReady();
  assert((await r.bridge.drive()).ok);
  assert(r.road.finishIntro());
  assert.equal(r.road.chapter.encounterVersion, version);
  assert.equal(r.road.state.encounters.version, version);
  assert.equal(r.road.chapter.difficultyId, difficulty);
  assert(r.road.state.encounters, 'fresh bridge entry owns an encounter chart');
  r.anchor(); return r;
}
function tick(r, beat, actions = {}) {
  r.audio.context.currentTime = r.audioAnchor + (beat - r.beatAnchor) * BEAT_SEC;
  r.road.state.invulnerableMs = 1000000;
  r.road.handleActions(actions); r.road.update(1000 / 60);
  assert.equal(r.road.status, 'playing');
}
function queue(r, mode) {
  const road = r.road, s = road.state;
  if (mode === 'gear-up') road.handleActions({ move_up: { pressed: true } });
  else if (mode === 'gear-down') road.handleActions({ move_down: { pressed: true } });
  else if (mode.startsWith('turbo')) road.handleActions({ road_turbo: { pressed: true } });
  else if (mode.startsWith('surge')) {
    // An earned SURGE queues this exact road state. Its earning/input rules
    // are covered by the pulse and reaction gates; this case owns persistence.
    s.queuedSurge = true; s.surgeBeat = road.nextShiftBeat();
  } else if (mode === 'recovery-start') {
    s.invulnerableMs = 0; s.shield = 0; s.ramMs = 0; road.hit('van');
    assert.equal(s.queuedRecovery, true);
  }
}
async function transition(mode) {
  const r = await fresh();
  tick(r, 0);
  for (let beat = .125; beat < 112; beat += .125) {
    tick(r, beat);
    if (beat === (mode.endsWith('-end') ? 107.5 : 111.5)) queue(r, mode);
  }
  tick(r, 112.125);
  const saved = copy(r.C.readResume()), p = saved.levelState.proof;
  assert.equal(saved.checkpointId, 'road-verse-2', 'the real verse crossing owns the save');
  assert.equal(p.musicBar, 28); assert(r.road.validate(saved));
  assert.equal(p.driveSection.beat, 112);
  assert.equal(p.driveSection.from, p.progress);
  assert.notEqual(p.driveSection.v0, p.driveSection.speed, `${mode} actually exercises a transition`);
  const pulse = p.encounters.pulses.find(item => item.target === 116);
  assert(pulse, 'the transition section already announced its next ONE');
  const retained = copy(p.encounters);
  const reopened = saveRig(r.storage); await reopened.boot(saved); reopened.anchor();
  assert.equal(reopened.road.chapter.runId, r.road.chapter.runId);
  assert.deepEqual(copy(reopened.road.state.encounters), retained);
  assert.deepEqual(copy(reopened.road.state.driveSections[0]), p.driveSection);
  assert.equal(reopened.road.state.progress, p.progress);
  const expired = reopened.road.pulses().filter(item => item.target <= p.musicBar * 4);
  assert(expired.length && expired.every(item => reopened.road.state.caughtPulses[item.id]),
    'resume cannot re-award a pulse exactly on or before its marker');
  for (const beat of [112.25, 112.5, 113, 114.5, 115.99, 116]) {
    tick(r, beat); tick(reopened, beat);
    assert(Math.abs(reopened.road.state.progress - r.road.state.progress) < 1e-8,
      `${mode}: resumed committed movement equals uninterrupted movement at beat ${beat}`);
    assert.equal(reopened.road.state.pulsePlaces[pulse.id], pulse.at, 'restoration never relocates paint');
    assert.equal(reopened.road.state.pulseTargets[pulse.id], 116, 'restoration never re-times ONE');
  }
  assert(Math.abs(pulse.at - reopened.road.state.progress - STRIKE) < 1e-8,
    `${mode}: announced pad still reaches the rear tire contact exactly on ONE`);
  const nextSave = reopened.road.makeCheckpoint('road-verse-2');
  assert(reopened.road.validate(nextSave), 'a resumed run can emit another valid authored checkpoint');
  return { r, reopened, saved };
}
async function malformed(saved) {
  const r = saveRig();
  for (const mutate of [
    candidate => { candidate.levelState.chapter.encounterVersion = 3; },
    candidate => { candidate.levelState.proof.encounters.version = 3; },
    candidate => { candidate.levelState.chapter.encounterVersion = 1; },
    candidate => { candidate.levelState.proof.encounters.version = 1; },
    candidate => { delete candidate.levelState.proof.encounters; },
    candidate => { candidate.levelState.proof.encounters.rows[0].actors[0].at++; },
    candidate => { candidate.levelState.proof.encounters.pulses[0].target++; },
    candidate => { delete candidate.levelState.proof.driveSection; },
    candidate => { candidate.levelState.proof.driveSection.v0 = 75; },
    candidate => { candidate.levelState.proof.driveSection.from++; },
    candidate => { candidate.levelState.proof.driveSection.beat -= 4; },
    candidate => { candidate.levelState.proof.driveSection.speed = 0; },
    candidate => { candidate.levelState.proof.driveSection.gear = 7; }
  ]) {
    const bad = copy(saved); mutate(bad);
    assert.equal(r.road.validate(bad), false, 'malformed chart/trajectory is rejected before entry');
    assert.equal(r.road.restore(bad), false);
    assert.equal(r.road.active, false, 'invalid restoration cannot create a live partial road');
  }
}
async function legacy(saved) {
  for (const authored of [true, false]) {
    const old = copy(saved);
    if (authored) delete old.levelState.chapter.encounterVersion;
    else delete old.levelState.chapter;
    delete old.levelState.proof.encounters; delete old.levelState.proof.driveSection;
    const r = saveRig(); await r.boot(old); r.anchor();
    assert.equal(r.road.state.encounters, undefined);
    assert.equal(r.road.chapter?.encounterVersion, undefined);
    assert.equal(!!r.road.chapter, authored, 'existing authored/legacy reward eligibility is preserved');
    tick(r, 112.25);
    const again = r.road.makeCheckpoint('road-verse-2');
    assert.equal(again.levelState.proof.encounters, undefined);
    assert.equal(again.levelState.chapter?.encounterVersion, undefined,
      'saving an existing checkpoint cannot silently re-chart it');
    r.road.status = r.road.state.status = 'failed';
    assert(r.road.retry());
    assert.equal(r.road.state.encounters, undefined);
    assert.equal(r.road.chapter?.encounterVersion, undefined,
      'a checkpoint retry keeps the old authored or legacy encounter rules');
  }
}
async function versionOneResume() {
  const r = await fresh('standard', 1);
  tick(r, 0);
  for (let beat=.125;beat<=112.125;beat+=.125)tick(r,beat);
  const saved = copy(r.C.readResume());
  assert.equal(saved.levelState.chapter.encounterVersion, 1);
  assert.equal(saved.levelState.proof.encounters.version, 1);
  const reopened = saveRig(r.storage); await reopened.boot(saved); reopened.anchor();
  assert.deepEqual(copy(reopened.road.state.encounters), saved.levelState.proof.encounters);
  tick(reopened,112.25);
  const again = reopened.road.makeCheckpoint('road-verse-2');
  assert.equal(again.levelState.chapter.encounterVersion, 1);
  assert.equal(again.levelState.proof.encounters.version, 1);
  reopened.road.status = reopened.road.state.status = 'failed';
  assert(reopened.road.retry());
  assert.equal(reopened.road.chapter.encounterVersion,1);
  assert.equal(reopened.road.state.encounters.version,1,'retry never silently upgrades old encounters');
}
async function nested(source) {
  const { r, saved } = source, expected = saved.levelState.proof.encounters;
  assert(await r.road.exit());
  const parent = copy(r.C.readResume());
  assert.equal(parent.levelId, 'level-01');
  assert.equal(parent.levelState.cacheRoadCheckpoint.chapter.encounterVersion, 2);
  assert.deepEqual(parent.levelState.cacheRoadCheckpoint.proof.encounters, expected);
  r.bridge.skipToReady(); assert((await r.bridge.drive()).ok);
  assert.equal(r.road.chapter.runId, saved.levelState.chapter.runId);
  assert.deepEqual(copy(r.road.state.encounters), expected, 'nested road re-entry restores the same fixed world');
  assert.equal(r.road.state.musicBar, 28);
  assert.equal(r.road.state.progress, saved.levelState.proof.progress);
}
async function retries() {
  for (const [difficulty, maxIntegrity] of [['relaxed', 4], ['standard', 3], ['overclocked', 3]]) {
    const r = await fresh(difficulty), runId = r.road.chapter.runId;
    assert.equal(r.road.state.integrity, maxIntegrity, 'fresh entry uses the selected road difficulty');
    tick(r, 0);
    r.road.state.integrity = 0; r.road.state.status = 'failed'; r.road.status = 'failed';
    assert(r.road.retry());
    assert.equal(r.road.chapter.runId, runId);
    assert.equal(r.road.chapter.retries, 1);
    assert.equal(r.road.chapter.difficultyId, difficulty);
    assert.equal(r.road.state.encounters.difficultyId, difficulty);
    assert.equal(r.road.state.integrity, maxIntegrity, 'retry restores the selected maximum, including relaxed four');
    assert(r.road.validate(r.C.readResume()));
  }
}
async function earnedGateReloads() {
  // This regression is a complete input-driven route to each earned exit,
  // without immunity or state injection. Only the expensive mock draw is
  // suppressed, matching the separate full-race balance harness.
  for (const gear of [0, 1, 2]) {
    const r = await fresh(); r.road.draw = () => {};
    const observed = { events: [], pulses: new Map(),
      event(kind, details = {}) { this.events.push({ kind, ...details }); } };
    const driver = new Driver(r, PROFILES.practiced, gear, observed);
    for (let frame = 0; frame < 10000 && r.road.status === 'playing' && !r.road.state.gateOpen; frame++) {
      driver.step(); r.step(20, 50);
    }
    assert.equal(r.road.status, 'playing');
    assert.equal(r.road.state.gear, gear);
    assert(r.road.state.gateOpen, 'normal input actually earns the Echo exit before reload');
    const saved = copy(r.C.readResume());
    assert.equal(saved.checkpointId, 'road-gate');
    assert(saved.levelState.proof.progress < saved.levelState.proof.gateAt,
      'the fixed-bar checkpoint deliberately resumes before the already-earned gate');
    assert(!r.C.archive().record.progress.items.includes('stem.bass'));
    const reopened = saveRig(r.storage); await reopened.boot(saved); reopened.road.draw = () => {};
    assert.equal(reopened.road.state.echo, null, 'reload does not invent another decoy');
    for (let frame = 0; frame < 800 && reopened.road.status === 'playing'; frame++) {
      reopened.step(20, 50);
      assert(!reopened.road.state.pursuit?.actor?.delivery,
        'an already-earned exit does not recreate an audit opponent during resume');
    }
    assert.equal(reopened.road.status, 'clear', `gear ${gear + 1}: earned gate resumes through the actual ending`);
    assert.equal(reopened.road.state.gateFailure, null, 'an opened gate never demands a second Echo');
    assert(reopened.road.chapter.delivery, 'normal bar100 completion creates the authored receipt');
    assert(reopened.C.archive().record.progress.items.includes('stem.bass'));
    assert(reopened.C.archive().record.progress.completedLevels.includes('level-02'));
  }
}
async function main() {
  const modes = ['gear-up', 'gear-down', 'turbo-start', 'turbo-end', 'surge-start', 'surge-end', 'recovery-start'];
  let first;
  for (const mode of modes) { const result = await transition(mode); first ||= result; }
  await malformed(first.saved); await legacy(first.saved);
  await versionOneResume(); await nested(first); await retries(); await earnedGateReloads();
  console.log(`Cache encounter save: ${modes.length} real verse-transition checkpoints retained physical ONE, with bounded restore, nested re-entry, unchanged old rules, difficulty-aware retries and three earned-gate reloads through Bass completion.`);
}
module.exports = { saveRig, fresh, tick };
if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
