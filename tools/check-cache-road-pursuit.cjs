// Fixed road commitments, finite warnings and the unobstructed delivery split.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const w = { BARCODE: {}, FILE_MANIFEST: [] };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/game/cache-road-pursuit.js'), 'utf8'), { window: w });
const pursuit = w.BARCODE.CacheRoadPursuit;
const BAR_SEC = 60 / 128 * 4;
function run({ speed = 52, difficultyId = 'standard', dodge = true, echo = false, actors = [], protectedPulses = [] } = {}) {
  const state = pursuit.create({ barFloat: 57.9 });
  const events = [], locks = [], poses = [];
  let progress = 0, lane = 1, currentEcho = null;
  for (let sec = 0; sec < 80; sec += .02) {
    const barFloat = 57.9 + sec / BAR_SEC;
    const before = progress;
    progress += speed * .02;
    if (state.actor?.locked && dodge) {
      const safeLane = state.actor.targetLane >= 2 ? state.actor.targetLane - 1 : state.actor.targetLane + 1;
      lane += Math.max(-.05, Math.min(.05, safeLane - lane));
    }
    if (state.actor?.locked && echo) { currentEcho = { lanePos: 0 }; lane = 3; }
    const emitted = pursuit.step(state, { before, progress, dt: 20, barFloat, lane,
      echo: currentEcho, difficultyId, actors, protectedPulses });
    for (const event of emitted) {
      events.push({ ...event, sec, barFloat, progress });
      if (event.type === 'lock') locks.push({ event, remaining: event.at - progress });
    }
    const pose = pursuit.pose(state, { progress });
    if (pose) poses.push({ ...pose, progress });
    if (barFloat >= 100) break;
  }
  return { state, events, locks, poses };
}

for (const difficultyId of ['relaxed', 'standard', 'overclocked']) {
  for (const speed of [30, 52, 70, 75]) {
    const result = run({ speed, difficultyId });
    assert.equal(result.events.filter(event => event.type === 'warning').length, 4, `${difficultyId}/${speed}: four readable waves`);
    assert.equal(result.events.filter(event => event.type === 'refill').length, 1, 'The lesson gets a single usable Echo');
    assert.equal(result.events.filter(event => event.type === 'stage' && event.stage === 'prepare-delivery').length, 1, 'The final split gets two bars of explicit preparation');
    assert.equal(result.events.filter(event => event.type === 'hit').length, 0, 'A one-lane dodge escapes every wave');
    assert(result.locks.every(lock => lock.remaining / 75 >= 1), `${difficultyId}/${speed}: at least 1 second after commit at maximum speed`);
    assert(result.events.filter(event => ['hit', 'deception', 'evaded'].includes(event.type)).every(event => event.barFloat < 92), 'No collision under the delivery gate');
    assert(result.poses.some(pose => pose.at < pose.progress && pose.crossed), 'The passed actor persists in mirror space');
    for (const wave of pursuit.waves) {
      const addresses = result.poses.filter(pose => pose.id === wave.id).map(pose => pose.at);
      assert.equal(new Set(addresses).size, 1, 'No gear or phase moves the revealed world address');
    }
  }
}

// A rival that is ignored remains a real obstacle. Warning/pads do not grant
// invisible invulnerability and it emits each physical impact exactly once.
{
  const result = run({ dodge: false });
  assert.equal(result.events.filter(event => event.type === 'hit').length, 4);
  assert.equal(new Set(result.events.filter(event => event.type === 'hit').map(event => event.id)).size, 4);
}

// Echo commits to a lane once; changing the live player's/decoy's lane cannot
// make the rival track them again. The same pose is used in both road views.
{
  const state = pursuit.create({ barFloat: 77 });
  let progress = 0, before = 0;
  const events = [];
  for (let i = 0; i < 100; i++) {
    before = progress; progress += 1.04;
    const echo = i >= 24 ? { lanePos: i < 27 ? 0 : 3 } : null;
    events.push(...pursuit.step(state, { progress, before, dt: 20, barFloat: 77 + i * .02 / BAR_SEC,
      lane: i < 24 ? 1 : 3, echo }));
  }
  assert.equal(events.filter(event => event.type === 'echo-lock').length, 1);
  assert.equal(state.actor.targetLane, 0);
  assert.equal(state.actor.lane, 0);
  const at = state.actor.at;
  const crossing = pursuit.step(state, { progress: at + 1, before: progress, dt: 20, barFloat: 79, lane: 3 });
  assert.equal(crossing.filter(event => event.type === 'deception').length, 1, 'A committed lure persists after the replay expires');
}

// A late Echo cannot yank a physical car across three lanes at contact.
{
  const state = pursuit.create({ barFloat: 77 });
  pursuit.step(state, { progress: 0, before: 0, dt: 100, barFloat: 77, lane: 1 });
  for (let i = 1; i <= 6; i++) pursuit.step(state, { progress: i * 6, before: (i - 1) * 6, dt: 100, barFloat: 77.1, lane: 1 });
  const at = state.actor.at;
  const events = pursuit.step(state, { progress: at - 30, before: 36, dt: 20, barFloat: 78, lane: 3, echo: { lanePos: 0 } });
  assert(!events.some(event => event.type === 'echo-lock'));
  assert.equal(state.actor.targetLane, 1);
}

// Pulse reservation and a clear adjacent lane are explicit lock inputs.
{
  const state = pursuit.create({ barFloat: 77 });
  const input = { progress: 0, before: 0, dt: 100, barFloat: 77, lane: 1,
    protectedAt: 155, protectedLane: 1, actors: [{ at: 160, lane: 0 }] };
  for (let i = 0; i < 5; i++) pursuit.step(state, input);
  assert.equal(state.actor.targetLane, 2);
  assert(state.actor.locked);
  const blocked = pursuit.create({ barFloat: 77 });
  const events = [];
  for (let i = 0; i < 5; i++) events.push(...pursuit.step(blocked, { ...input,
    actors: [0, 1, 2, 3].map(lane => ({ at: 155, lane })) }));
  assert(events.some(event => event.type === 'disengage'));
  assert(blocked.actor.aborted);
}

// A pad committed after the lane lock still owns its announced safe paint.
// The rival concedes without sliding either world contact to a new address.
{
  const state = pursuit.create({ barFloat: 77 });
  const input = { progress: 0, before: 0, dt: 100, barFloat: 77, lane: 1 };
  for (let i = 0; i < 5; i++) pursuit.step(state, input);
  const { at, lane } = state.actor;
  const events = pursuit.step(state, { ...input, protectedPulses: [{ at, lane: 1 }] });
  assert(events.some(event => event.type === 'disengage' && event.reason === 'new-pulse-corridor'));
  assert.equal(state.actor.at, at);
  assert.equal(state.actor.lane, lane);
  assert(state.actor.aborted);
}

// Restoring within a wave skips its expired warning; the next full wave still
// works. Delivery restoration contains no surprise pursuit or repeated refill.
{
  const resumed = pursuit.create({ barFloat: 78 });
  assert.equal(pursuit.step(resumed, { barFloat: 78, progress: 5000, before: 5000, dt: 20, lane: 1 }).length, 0);
  assert.equal(pursuit.pose(resumed), null);
  assert(pursuit.step(resumed, { barFloat: 83, progress: 5300, before: 5300, dt: 20, lane: 1 }).some(event => event.type === 'warning'));
  const delivered = pursuit.create({ barFloat: 94 });
  assert.equal(pursuit.step(delivered, { barFloat: 94, progress: 6000, before: 6000, dt: 20 }).length, 0);
  assert.equal(delivered.phase, 'delivery');
  const stale = pursuit.create();
  for (let i = 0; i < 10; i++) assert(!pursuit.step(stale, { barFloat: 90, progress: 6000, before: 6000, dt: 20 }).some(event => event.type === 'warning'));
}

// The final split has a real visible audit car taking the replay. Its target
// commits once, both cameras use that same physical pose, and it never adds
// damage or a second deception score to the gate's existing resolution.
for (const difficultyId of ['relaxed', 'standard', 'overclocked']) for (const speed of [30, 52, 70, 75]) {
  const state = pursuit.create({ barFloat: 92 }), events = [], addresses = new Set();
  let progress = 0;
  for (let ms = 0; ms < 8000; ms += 20) {
    const before = progress; progress += speed * .02;
    events.push(...pursuit.step(state, { before, progress, dt: 20,
      barFloat: 92 + ms / (BAR_SEC * 1000), difficultyId, gateAt: 150,
      lane: 3, echo: ms >= 200 ? { lanePos: ms < 500 ? 0 : 3 } : null }));
    const pose = pursuit.pose(state, { progress });
    if (pose) {
      addresses.add(pose.at);
      if (ms >= 600) assert.equal(pose.lane, 0, 'The final rival visibly stays with the left replay');
    }
  }
  assert.equal(events.filter(event => event.type === 'echo-lock').length, 1);
  assert.equal(events.filter(event => event.type === 'delivery-pass').length, 1);
  assert.equal(events.filter(event => ['hit', 'deception'].includes(event.type)).length, 0);
  assert.equal(addresses.size, 1);
  const resumed = pursuit.create({ barFloat: 95 });
  pursuit.step(resumed, { before: 200, progress: 200, barFloat: 95, dt: 20, gateAt: 150 });
  assert.equal(pursuit.pose(resumed, { progress: 200 }), null, 'A passed gate cannot recreate its audit car on resume');
}
console.log('Cache road pursuit: four staged fixed-address attacks, every-gear warnings, committed Echo, clear corridors and delivery runway passed.');
