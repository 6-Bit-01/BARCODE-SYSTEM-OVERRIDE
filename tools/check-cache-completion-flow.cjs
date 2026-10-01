// Real Campaign, road, ending, controls, shared RAF and lifecycle owners.
// Audio/Canvas/storage are test hosts; collision immunity isolates completion
// and persistence from driving difficulty, which the road gates test separately.
const assert = require('node:assert/strict');
const { bridgeRig } = require('./check-cache-bridge.cjs');
const { load } = require('./check-level-01-boss');
const copy = value => JSON.parse(JSON.stringify(value));
const flush = async () => { for (let i = 0; i < 24; i++) await Promise.resolve(); };

function completionRig(storage) {
  const r = bridgeRig(storage);
  // bridgeRig loads the shared visual owners before either reading surface.
  assert(r.B.CacheSceneLayouts && r.B.CacheSceneEffects && r.B.ComicDialogue);
  for (const file of ['src/game/cache-chapter.js', 'src/engine/cache-ending.js',
    'src/game/lore-records.js', 'src/game/pause-menu.js']) load(r.context, file);
  r.B.PauseMenu.snapshot = {}; r.B.PauseMenu.snapshotContext = { drawImage() {} };
  return { ...r, ending: r.B.CacheEnding, chapter: r.B.CacheChapter };
}
async function start(r) {
  await r.boot(); r.bridge.skipToReady(); await r.bridge.drive();
  assert(r.road.chapter && !r.road.chapter.delivery);
  assert.equal(r.roadStarts(),0,'fresh race music waits through the opening');
  assert(r.road.finishIntro());
  assert.equal(r.road.state.musicBar, 0); assert.equal(r.roadStarts(), 1);
}
function driveToClear(r, collect = false, carried = null) {
  const { road, pad } = r, zones = [[12, 20, 0], [36, 44, 2], [60, 68, 1], [84, 90, 3]];
  road.state.invulnerableMs = 1000000;
  let sent = false;
  for (let frame = 0; frame < 1900 && road.status === 'playing'; frame++) {
    const s = road.state, bar = s.musicBeatFloat / 4;
    const zone = collect && zones.find(([begin, end]) => bar >= begin - 2 && bar < end);
    let target = zone ? zone[2] : 1.5;
    if (bar >= 90) target = sent ? 3 : 0;
    if (s.gateAt !== null && !sent) {
      assert(s.lanePos < .38, 'steering reaches the actual Echo launch lane');
      road.sendEcho(); assert(s.echo); sent = true; target = 3;
    }
    pad.axes[0] = Math.abs(target - s.lanePos) > .06 ? Math.sign(target - s.lanePos) : 0;
    if (carried && bar >= 99.8) {
      if (carried === 'keyboard') r.key('Enter', true, r.w.inputManager.resultKeysHeld.has('enter'));
      else pad.buttons[0].pressed = true;
    }
    r.step(100, 10);
  }
  pad.axes[0] = 0;
  assert(sent && road.state.gateOpen, 'the actual final Echo/split opens the gate');
  assert.equal(road.status, 'clear'); assert(road.state.musicBar >= 100);
  assert(r.ending.active, 'earned clear automatically opens the authored ending');
  return copy(r.C.readResume());
}

async function checkFreshEnding() {
  const r = completionRig(); await start(r);
  const runId = r.road.chapter.runId, l1result = copy(r.C.archive().record.progress.results['level-01']);
  const saved = driveToClear(r, false, 'keyboard');
  assert.equal(saved.levelState.chapter.runId, runId);
  assert.equal(saved.levelState.chapter.delivery.result.discoveries, 0);
  assert.equal(saved.levelState.chapter.delivery.result.bonus, 0);
  assert(r.C.archive().record.progress.items.includes('stem.bass'));
  assert(r.C.archive().record.progress.completedLevels.includes('level-02'));
  assert(r.C.archive().record.progress.unlockedLevels.includes('level-03'));
  assert.deepEqual(copy(r.C.archive().record.progress.results['level-01']), l1result);
  assert.deepEqual(copy(r.C.archive().getIds()), [], 'zero optional records still earns the complete chapter');
  const receipt = copy(r.road.chapter.delivery.result), updates = r.observed.roadUpdates;
  const time = r.road.chapter.elapsedMs, starts = r.roadStarts(), sceneTime = r.ending.sceneElapsedMs;
  r.key('Enter', true, true); assert.equal(r.ending.cue, 0, 'held driving confirm cannot skip the ending title');
  r.key('Enter', false); r.tap('Enter'); assert.equal(r.ending.cue, 1);
  r.tap('t'); assert(r.ending.transcriptOpen);
  r.step(6000); assert.equal(r.ending.cue, 1, 'transcript holds authored cue timing');
  assert.equal(r.observed.roadUpdates, updates); assert.equal(r.observed.worldUpdates, 0);
  assert.equal(r.road.chapter.elapsedMs, time); assert.equal(r.roadStarts(), starts);
  assert.equal(r.ending.sceneElapsedMs, sceneTime, 'transcript holds the ending effects on the real shared RAF');
  assert(!r.B.MusicTransport.getDiagnostics().running);
  assert.deepEqual(copy(r.road.chapter.delivery.result), receipt);
  r.tap('t'); r.tap('p'); await flush(); assert(r.w.isPaused);
  const position = copy(r.ending.serialize()), pausedSceneTime = r.ending.sceneElapsedMs; r.step(2000);
  assert.equal(r.ending.sceneElapsedMs, pausedSceneTime, 'pause holds ending effects on the real lifecycle');
  assert.deepEqual(copy(r.ending.serialize()), position);
  r.tap('p'); await flush(); assert(!r.w.isPaused && r.ending.active);
  assert(!r.B.MusicTransport.getDiagnostics().running, 'resume keeps the finished recording silent');
  r.ending.setCue(2, 1);
  const readingSave = copy(r.C.readResume());
  await r.B.RuntimeLifecycle.stop('completion-fixture-reload');
  assert(!r.ending.active && !r.road.active);
  const reopened = completionRig(r.storage); await reopened.boot(readingSave);
  assert(reopened.ending.active); assert.equal(reopened.ending.page, 2); assert.equal(reopened.ending.cue, 1);
  assert.equal(reopened.roadStarts(), 0); assert(!reopened.B.MusicTransport.getDiagnostics().running);
  assert.deepEqual(copy(reopened.road.chapter.delivery.result), receipt);
  assert.equal(reopened.chapter.saveStatus(), 'saved');
  reopened.ending.skipToReady(); reopened.key('Enter', true);
  assert(!reopened.ending.active && reopened.road.active);
  assert(reopened.road.chapter.delivery.ending.done);
  reopened.key('Enter', true, true); reopened.input();
  assert.equal(reopened.road.status, 'clear', 'finish press and held repeat cannot start a replay');
  assert.equal(reopened.roadStarts(), 0);
  reopened.key('Enter', false);
  assert.equal(reopened.road.state.score, receipt.score);
  reopened.step(20); reopened.tap('Enter');
  assert(reopened.ending.active && reopened.ending.page === 0 && reopened.ending.cue === 0,
    'fresh result confirmation deliberately replays the ending');
  assert.deepEqual(copy(reopened.road.chapter.delivery.result), receipt);
  reopened.tap('Escape'); assert(!reopened.ending.active && reopened.road.status === 'clear');
  reopened.tap('p'); await flush(); assert(reopened.w.isPaused);
  reopened.tap('l'); assert.equal(reopened.B.PauseMenu.view, 'archive');
  reopened.tap('Enter'); await flush();
  assert(reopened.w.isPaused && !reopened.ending.active && reopened.road.status === 'clear',
    'paused archive owns Enter before the underlying completed-road buttons');
  reopened.tap('p'); await flush(); assert(!reopened.w.isPaused);
  assert(!reopened.B.MusicTransport.getDiagnostics().running);
  return { source: reopened, saved: copy(reopened.C.readResume()), receipt };
}

async function checkRecordsAndRetry() {
  const r = completionRig(); await start(r);
  const saved = driveToClear(r, true, 'controller');
  assert.deepEqual(copy(r.road.chapter.records), copy(r.chapter.recordIds));
  assert.deepEqual(copy(r.C.archive().getIds()), copy(r.chapter.recordIds));
  assert.equal(saved.levelState.chapter.delivery.result.discoveries, 4);
  r.input(); assert.equal(r.B.GamepadUI.owner, 'ending');
  assert.equal(r.ending.cue, 0, 'held driving controller confirm cannot skip the title');
  r.pad.buttons[0].pressed = false; r.input(); r.pad.buttons[0].pressed = true; r.input();
  assert.equal(r.ending.cue, 1); r.pad.buttons[0].pressed = false; r.input();
  const previousRun = r.road.chapter.runId, facts = copy(r.C.archive().record.progress);
  r.tap('Escape'); assert(!r.ending.active && r.road.status === 'clear');
  r.step(20); r.tap('Enter'); assert(r.ending.active); assert.equal(r.ending.cue, 1);
  r.ending.skipToReady(); r.pad.buttons[0].pressed = true; r.input();
  // Opening a reading session release-arms the pad; release it once first.
  if (r.ending.active) { r.pad.buttons[0].pressed = false; r.input(); r.pad.buttons[0].pressed = true; r.input(); }
  assert(!r.ending.active); for (let i = 0; i < 4; i++) r.input();
  assert.equal(r.road.status, 'clear', 'finishing with A cannot replay on the next controller poll');
  r.pad.buttons[0].pressed = false; r.input();
  r.step(20); r.pad.buttons[2].pressed = true; r.input(); r.pad.buttons[2].pressed = false; r.input();
  assert.equal(r.road.status, 'playing'); assert.notEqual(r.road.chapter.runId, previousRun);
  assert.equal(r.road.chapter.elapsedMs, 0); assert.deepEqual(copy(r.road.chapter.records), []);
  assert.deepEqual(copy(r.C.archive().record.progress), facts, 'full replay does not duplicate earned facts');
  const newRun = r.road.chapter.runId;
  r.road.state.invulnerableMs = 100000; r.step(500);
  r.road.state.invulnerableMs = 0; r.road.hit('roadblock');
  assert.equal(r.road.chapter.damageTaken, 1);
  r.road.state.timeMs = 1; r.step(20); assert.equal(r.road.status, 'failed');
  const elapsed = r.road.chapter.elapsedMs;
  assert.equal(r.C.readResume().levelState.chapter.damageTaken, 1);
  assert(r.road.retry()); assert.equal(r.road.chapter.runId, newRun);
  assert.equal(r.road.chapter.retries, 1); assert.equal(r.road.chapter.damageTaken, 1);
  assert.equal(r.road.chapter.elapsedMs, elapsed);
  assert.equal(r.C.readResume().levelState.chapter.retries, 1);
}

async function checkLegacy(saved) {
  const old = copy(saved); delete old.levelState.chapter;
  const r = completionRig(); r.finish(); await r.boot(old);
  assert.equal(r.road.status, 'clear'); assert.equal(r.road.chapter, null); assert(!r.ending.active);
  assert(!r.C.archive().record.progress.items.includes('stem.bass'));
  assert(!r.C.archive().record.progress.completedLevels.includes('level-02'));
  r.step(1500); assert.equal(r.roadStarts(), 0);
  const returnTo = copy(old.levelState.returnTo);
  returnTo.levelState.cacheRoadCheckpoint = { checkpointId: old.checkpointId,
    proofVersion: old.levelState.proofVersion, proof: old.levelState.proof };
  const nested = completionRig(); nested.finish(); await nested.boot(returnTo);
  nested.bridge.skipToReady(); await nested.bridge.drive();
  assert.equal(nested.road.status, 'clear'); assert.equal(nested.road.chapter, null);
  assert(!nested.ending.active); assert.equal(nested.roadStarts(), 0);
  assert(!nested.C.archive().record.progress.items.includes('stem.bass'));
  assert(nested.road.retry()); assert(nested.road.chapter && !nested.road.chapter.delivery);
  assert.equal(nested.road.state.musicBar, 0, 'only actual full replay upgrades a legacy clear');
}

async function main() {
  const { saved } = await checkFreshEnding();
  await checkRecordsAndRetry(); await checkLegacy(saved);
  console.log('Cache completion flow: full-song Echo clears, zero/all four records, shared-loop ending ownership, saved ending lifecycle, held keys/pad, pause/transcript, stable retry stats and legacy boundaries passed.');
}
module.exports = { completionRig, driveToClear, checkFreshEnding, checkRecordsAndRetry, checkLegacy };
if (require.main === module) main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
