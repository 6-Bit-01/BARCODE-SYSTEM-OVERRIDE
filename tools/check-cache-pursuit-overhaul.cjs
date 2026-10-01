#!/usr/bin/env node
// Production-input showdown, failure/retry and actual earned-state persistence.
// Canvas/audio/storage are controlled hosts. No gameplay state is injected.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { raceRig, instrument, Driver, runRace, PROFILES } = require('./check-cache-road-races.cjs');
const { completionRig } = require('./check-cache-completion-flow.cjs');
const { load } = require('./check-level-01-boss');
const clone = value => JSON.parse(JSON.stringify(value));
const flush = async () => { for (let i = 0; i < 24; i++) await Promise.resolve(); };
const root = path.resolve(__dirname, '..');
const SOURCES = ['src/game/cache-road-proof.js', 'src/game/cache-road-encounters.js',
  'src/game/cache-road-pursuit.js', 'src/game/cache-road-reactions.js', 'src/game/cache-chapter.js',
  'src/core/action-input.js', 'src/core/loop.js', 'src/engine/music-transport.js',
  'tools/check-cache-road-races.cjs', 'tools/check-cache-pursuit-overhaul.cjs'];
const hashes = () => Object.fromEntries(SOURCES.map(file => [file,
  crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));

function counters(result) {
  return result.events.filter(event => event.kind === 'boss-health' && event.previousHealth !== null)
    .map(event => ({ health: event.health, ...event.lastCounter }));
}
function assertEarnedClear(result) {
  assert.equal(result.encounterVersion, 3, 'the retained pursuit fixture uses its production version-3 rules');
  assert.equal(result.status, 'clear');
  assert.equal(result.finalBar, 100, 'delivery still finishes the complete source recording');
  assert(result.boss?.defeated && result.boss.health === 0 && result.boss.counters === 3,
    'completion requires three actual counters that break all rig systems');
  assert.equal(result.gateAt, null, 'the old physical Echo exit is absent from a fresh race');
  assert.equal(result.gateOpen, true);
  assert.deepEqual(result.boss.systems.map(system => [system.id, system.broken]),
    [['scanner', true], ['ram', true], ['emitter', true]]);
  assert(result.captured > 5, 'the driver earns its arrangement and resources through real pulse input');
  assert.equal(result.mix.drumMinimum, .60, 'drums remain the live musical backbone');
}

async function checkResourceFreeBoss() {
  const results = [];
  for (const [difficulty, gear] of [['relaxed', 0], ['standard', 1], ['overclocked', 2]]) {
    const { result } = await runRace({ difficulty, gear, noEcho: true, noTurbo: true, bossDodgeOnly: true });
    assertEarnedClear(result);
    assert.equal(result.echoUses, 0, 'no compulsory Echo is hidden in the new finale');
    assert.equal(result.turboUses, 0, 'ordinary steering can finish without Turbo');
    assert.equal(counters(result).length, 3);
    assert(counters(result).every(counter => counter.kind === 'dodge'),
      'each rig system is broken by an actual clean committed-lane dodge');
    assert(result.events.every(event => event.kind !== 'capture' || event.bar < 72),
      'the showdown is winnable while withholding every face-button action');
    results.push(result);
    console.log(`Overhaul no-resource showdown: ${difficulty}, gear ${gear + 1}, three earned dodge counters, clear.`);
  }
  return results;
}

async function checkMissedChances() {
  const options = { difficulty: 'standard', gear: 1, noEcho: true, noTurbo: true, bossDodgeOnly: true };
  const { result: recovered } = await runRace({ ...options, missBossAttacks: 2 });
  assertEarnedClear(recovered);
  const firstCounter = counters(recovered)[0];
  assert(firstCounter.bar > 84 && recovered.boss.attempts >= 5,
    'two missed opportunities leave enough later attacks to break the whole rig');
  assert.equal(recovered.boss.hits, 0, 'a marginal dodge can miss the counter without a forced wreck');
  const { result: retried } = await runRace({ ...options, missBossAttacks: 6, retryLimit: 1 });
  assertEarnedClear(retried);
  assert.equal(retried.retries, 1);
  assert(retried.failures.some(failure => failure.message === 'PURSUIT HELD THE ORIGINAL'),
    'ignoring every counter really fails the mission and retries its production checkpoint');
  console.log('Overhaul missed chances: two misses recover; six misses fail and a real checkpoint retry clears.');
  return [recovered, retried];
}

async function checkEarnedAbilities() {
  const results = [];
  for (const options of [{ gear: 1, seekPush: true },
    { gear: 1, seekBrace: true, preferBossBrace: true, noTurbo: true },
    { gear: 2, seekTurbo: true }]) {
    const { result } = await runRace({ difficulty: 'standard', ...options });
    assertEarnedClear(result); results.push(result);
  }
  assert(results[0].pushContacts > 0, 'an earned Push clears actual physical traffic');
  assert(results[1].braceContacts > 0, 'an earned Brace absorbs actual physical traffic');
  assert(counters(results[1]).some(counter => counter.kind === 'brace'),
    'a genuinely earned shield can break a rig system through a committed contact');
  assert(results[2].turboUses > 0 && results[2].events.some(event => event.kind === 'turbo-active'),
    'earned Turbo goes through its real next-bar queue and physical boost');
  assert(results.some(result => result.echoUses > 0 && result.echoDeceptions > 0),
    'a real earned Echo visibly changes a committed pursuit attack');
  for (const result of results) assert(result.events.some(event => event.kind === 'earned-action'),
    'resource activation is attributed to genuine action awards');
  console.log('Overhaul earned abilities: physical Push, Brace, queued Turbo, Echo deception and Brace boss counter.');
  return results;
}

async function checkMidBossPersistence() {
  let r = await raceRig('standard');
  assert.equal(r.road.chapter.encounterVersion, 3);
  let observed = instrument(r), driver = new Driver(r, PROFILES.practiced, 1, observed,
    { noEcho: true, noTurbo: true, bossDodgeOnly: true });
  r.road.draw = () => {};
  let saved, before, frames = 0;
  for (; frames < 10000 && r.road.status === 'playing'; frames++) {
    driver.step(); r.step(20, 50);
    const view = r.road.encounterSnapshot();
    if (view.boss?.counters === 2 && view.pursuit?.boss && view.pursuit.locked && !view.pursuit.crossed) {
      before = clone(view.boss); saved = r.road.makeCheckpoint('road-verse-4'); break;
    }
  }
  assert(saved && before.health === 1, 'two systems are genuinely broken before saving the next partial attack');
  assert(r.road.validate(saved), 'production accepts its actual midboss checkpoint');
  assert.equal(saved.levelState.proof.pursuit.boss.counters, 2);
  const forgedGate = clone(saved); forgedGate.levelState.proof.gateOpen = true;
  assert.equal(r.road.validate(forgedGate), false, 'a gate flag cannot substitute for an undefeated rig');
  const futureRules = clone(saved); futureRules.levelState.chapter.encounterVersion = 5;
  assert.equal(r.road.validate(futureRules), false, 'an unsupported rules version is rejected');
  const futurePursuit = clone(saved); futurePursuit.levelState.proof.pursuit.version = 4;
  assert.equal(r.road.validate(futurePursuit), false, 'an unsupported rig-state version is rejected');
  const forgedDamage = clone(saved); forgedDamage.levelState.proof.pursuit.boss.health = 0;
  assert.equal(r.road.validate(forgedDamage), false, 'counter, system and health facts must agree');
  assert(r.C.archive().checkpoint(saved));
  const storage = r.storage;
  await r.B.RuntimeLifecycle.stop('earned-midboss-save-reload');
  r = completionRig(storage, { encounterVersion: 3 });
  for (const file of ['src/game/cache-road-encounters.js', 'src/game/cache-road-reactions.js',
    'src/game/cache-road-pursuit.js']) load(r.context, file);
  await r.boot(saved);
  r.road.draw = () => {};
  const restored = r.road.encounterSnapshot();
  assert.equal(restored.boss.counters, 2); assert.equal(restored.boss.health, 1);
  assert.deepEqual(clone(restored.boss.systems), before.systems);
  assert.equal(restored.boss.lastCounter.id, before.lastCounter.id);
  assert.equal(restored.pursuit, null, 'restoring drops the half-finished attack instead of blindsiding the driver');
  assert.equal(r.road.state.echo, null, 'no new replay is created on restore');
  const pauseState = clone({ proof: r.road.makeCheckpoint('road-verse-4'), camera: r.road.state.cameraMotion });
  r.tap('p'); r.input(); await flush(); assert(r.w.isPaused);
  r.step(1200, 50);
  assert.deepEqual(clone({ proof: r.road.makeCheckpoint('road-verse-4'), camera: r.road.state.cameraMotion }), pauseState,
    'pause holds rig counters, physical progress, song and camera together');
  r.tap('p'); r.input(); await flush(); assert(!r.w.isPaused);
  observed = instrument(r); driver = new Driver(r, PROFILES.practiced, 1, observed,
    { noEcho: true, noTurbo: true, bossDodgeOnly: true });
  let warnings = [], previousWarning;
  for (; frames < 16000 && r.road.status === 'playing'; frames++) {
    driver.step(); r.step(20, 50);
    const view = r.road.encounterSnapshot();
    if (view.pursuit?.warning && view.pursuit.id !== previousWarning) {
      warnings.push({ id: view.pursuit.id, distance: view.pursuit.at - r.road.state.progress,
        locked: view.pursuit.locked }); previousWarning = view.pursuit.id;
    }
  }
  assert.equal(r.road.status, 'clear');
  const final = r.road.encounterSnapshot().boss;
  assert(final.defeated && final.health === 0 && final.counters === 3,
    'reload requires exactly one new earned counter, without repeating the old two');
  assert.notEqual(final.lastCounter.id, before.lastCounter.id);
  assert(warnings.length && warnings[0].distance >= 160 && !warnings[0].locked,
    'the next resumed attack gets its complete visible runway');
  assert(r.road.chapter.delivery && r.C.archive().record.progress.items.includes('stem.bass'),
    'an actually defeated rig finishes and saves the authored chapter reward');
  console.log('Overhaul midboss persistence: two earned breaks survive reload; partial strike drops; one new counter completes.');
  return { before, restored: clone(restored.boss), final: clone(final), warnings, savedBar: saved.levelState.proof.musicBar,
    rejected: ['forged-gate', 'future-encounter-rules', 'future-pursuit-rules', 'forged-health'], pausedMs: 1200 };
}

async function main() {
  const sources = hashes();
  const resourceFree = await checkResourceFreeBoss(), missedChances = await checkMissedChances();
  const earnedAbilities = await checkEarnedAbilities();
  const persistence = await checkMidBossPersistence();
  assert.deepEqual(hashes(), sources, 'production and validation source remain frozen throughout the study');
  const receipt = { passed: true, sources, sourcesStable: true, resourceFree, missedChances, earnedAbilities, persistence,
    evidence: 'Production ActionInput + shared RAF + road/music/campaign owners, with actual delayed gamepad controls and earned counters.',
    limits: 'Canvas/audio/storage hosts are controlled. No health, immunity, position, resource, capture or boss-hit state is injected. Not a human playtest or Makko/controller/audio acceptance.' };
  if (process.argv.includes('--write')) {
    const out = path.join(root, 'docs/source-pack/review-cache-pursuit-overhaul'); fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'pursuit-overhaul-checks.json'), JSON.stringify(receipt, null, 2) + '\n');
  }
  console.log('Cache pursuit overhaul passed: eight complete production-input races and actual midboss save/reload.');
  return receipt;
}
module.exports = { checkResourceFreeBoss, checkMissedChances, checkEarnedAbilities, checkMidBossPersistence, main };
if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
