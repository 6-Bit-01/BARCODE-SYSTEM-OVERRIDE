// Deterministic song chart, safe musical corridors and bounded save ownership.
// Complete input-driven road races are a separate integration gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const w = { BARCODE: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/game/cache-road-encounters.js'), 'utf8'), { window: w });
const C = w.BARCODE.CacheRoadEncounters, plain = value => JSON.parse(JSON.stringify(value));
const beatSec = 60 / 128;
const STRIKE = (1 - Math.sqrt(.83 ** 2 - 119 * .14 / 680)) * 520 - 80;
function endpoint(s) {
  // Independent integration in seconds: accelerate with smoothstep for .75
  // beats, then hold speed for the remaining 3.25 beats.
  return s.from + (s.v0 + s.speed) / 2 * .75 * s.beatSec + s.speed * 3.25 * s.beatSec;
}
function runChart(difficulty, gear, varied = false) {
  let chart = C.create(difficulty), from = 0, previousSpeed = [30, 52, 70][gear];
  let issued = 0;
  for (let bar = 0; bar < 100; bar++) {
    const speed = varied ? [30, 75, 52, 68, 70][Math.floor(bar / 3) % 5] : [30, 52, 70][gear];
    const section = { beat: bar * 4, beatSec, from, v0: previousSpeed, speed, gear };
    const before = plain(chart), result = C.commit(chart, section, STRIKE);
    if (result.row) {
      assert.equal(result.row.at - section.from, 440, 'traffic appears only at the far reveal boundary');
      const sweptLanes = new Set(result.row.actors.flatMap(actor => {
        assert.equal(actor.encounter, true);
        if (actor.mergeLane !== undefined) {
          assert.equal(Math.abs(actor.mergeLane - actor.lane), 1, 'traffic merges only one lane');
          assert(actor.warningDistance > actor.mergeDistance, 'merging is preceded by a visible warning');
        }
        return actor.mergeLane === undefined ? [actor.lane] : [actor.lane, actor.mergeLane];
      }));
      assert(sweptLanes.size <= 2, 'every row leaves two open lanes including the complete merge path');
      assert(bar < 50 || (bar > 62 && bar < 69), 'Echo lesson and final pursuit have reserved road');
    }
    if (result.pulse) {
      const p = result.pulse, prior = before.pulses.at(-1);
      assert.equal(p.target, (bar + 1) * 4, 'targets own the next first beat');
      assert(Math.abs(p.at - endpoint(section) - STRIKE) < 1e-8,
        'paint is registered to the committed endpoint and rear tire contact');
      assert(Math.abs(p.lane - (prior?.lane ?? 1)) <= 1, 'no two/three-lane scramble between cues');
      for (const actor of C.hazards(chart).filter(h => h.at >= from - 18 && h.at <= p.at + 36)) {
        const lanes = actor.mergeLane === undefined ? [actor.lane] : [actor.lane, actor.mergeLane];
        assert(!lanes.includes(p.lane), 'musical lane is clear throughout its approach and exit');
      }
      issued++;
    }
    const frozen = JSON.stringify(chart);
    C.commit(chart, { ...section, speed: 75, from: from + 30 }, STRIKE);
    assert.equal(JSON.stringify(chart), frozen, 'recommitting cannot move paint, traffic or a deadline');
    assert.deepEqual(plain(chart.rows.slice(0, before.rows.length)), before.rows, 'existing actors do not shift');
    assert.deepEqual(plain(chart.pulses.slice(0, before.pulses.length)), before.pulses, 'existing pulse paint does not shift');
    if (bar === 36 || bar === 76) {
      const saved = plain(C.snapshot(chart)), restored = C.restore(saved, difficulty);
      assert(restored, 'mid-race committed chart restores');
      assert.deepEqual(plain(restored), saved, 'all materialized world addresses survive restore');
      saved.lastLane = 99;
      assert.notEqual(restored.lastLane, 99, 'snapshot does not alias live state');
      chart = restored;
    }
    from = endpoint(section); previousSpeed = speed;
  }
  assert(issued >= 45 && issued <= 64, 'all gears get a substantial playable musical route');
  assert.equal(chart.committedBars.length, 100);
  assert(!chart.pulses.some(item => item.bar >= 90 && item.bar < 96),
    'the slowest gear completes its final Echo gate before any new cue can lure it away');
  assert.deepEqual(plain(chart.pulses.filter(item => item.bar >= 96).map(item => item.bar)), [96, 98],
    'two reward cues return after the delivery gate has cleared in every gear');
  assert(C.restore(C.snapshot(chart), difficulty), 'complete chart remains bounded and restorable');
  return { difficulty, gear: gear + 1, actors: C.hazards(chart).length, pulses: issued, chart };
}
const results = [];
for (const difficulty of ['relaxed', 'standard', 'overclocked']) {
  for (const gear of [0, 1, 2]) results.push(runChart(difficulty, gear));
  runChart(difficulty, 1, true);
}
for (const bar of [4, 28, 52, 76, 92]) assert.equal(C.act(bar).startBar, bar);
assert.equal(C.act(20).chorus, true); assert.equal(C.act(28).chorus, false);
assert.equal(C.act(100).id, 'complete');
for (const gear of [1, 2, 3]) {
  const counts = results.filter(item => item.gear === gear).map(item => item.actors);
  assert(counts[0] < counts[1] && counts[1] < counts[2], 'difficulty changes actual civilian traffic');
}
assert(C.difficulty('relaxed').maxIntegrity > C.difficulty('standard').maxIntegrity);
assert(C.difficulty('relaxed').recoveryMs > C.difficulty('standard').recoveryMs);
assert(C.difficulty('standard').recoveryMs > C.difficulty('overclocked').recoveryMs);
assert.equal(C.difficulty('invalid').id, 'standard');
assert.equal(C.difficulty('toString').id, 'standard', 'prototype keys cannot masquerade as difficulty IDs');
// Legacy/future proof metadata never silently opts into a chart. Invalid
// saved data is rejected, rather than moving previously promised contacts.
for (const invalid of [undefined, null, {}, { version: 2 }, { version: 4, progress: 1700 }])
  assert.equal(C.restore(invalid), null);
const valid = C.snapshot(results[0].chart);
for (const mutate of [
  raw => { raw.version = 2; },
  raw => { raw.rows[0].actors[0].lane = 8; },
  raw => { raw.rows[0].actors[0].at++; },
  raw => { raw.pulses[0].target++; },
  raw => { raw.pulses[0].at = Infinity; },
  raw => { raw.pulses[0].id = 'old-proof/pulse'; },
  raw => { raw.committedBars.push(100); },
  raw => { raw.committedBars.push(raw.committedBars[0]); },
  raw => { raw.rows.push(...Array(100).fill(raw.rows[0])); }
]) {
  const bad = plain(valid); mutate(bad); assert.equal(C.restore(bad), null);
}
assert.equal(C.restore(valid, 'overclocked'), null, 'difficulty cannot change beneath a saved chart');
const late = C.create('standard');
C.commit(late, { beat: 16, beatSec, from: 400, v0: 52, speed: 52 }, STRIKE, { allowPulse: false });
assert.equal(C.hazards(late).length, 1, 'a late update still materializes its deterministic traffic');
assert.equal(C.pulses(late).length, 0, 'a late update does not invent a shortened rhythm announcement');
assert.equal(C.commit(late, { beat: 16, beatSec, from: 400, v0: 52, speed: 52 }, STRIKE).pulse, null);
// A locked pursuit lane is protected before a new cue is announced; the
// complete turn can intentionally leave a quiet beat rather than a scramble.
const reservationSection = { beat: 16, beatSec, from: 400, v0: 52, speed: 52 };
const reservationAt = endpoint(reservationSection) + STRIKE;
const reserved = C.commit(C.create(), reservationSection, STRIKE, {
  protectedActors: [{ at: reservationAt, lane: 2, targetLane: 2, locked: true, crossed: false }]
}).pulse;
assert(reserved && reserved.lane !== 2, 'a committed rival lane takes precedence over an unannounced pad');
assert.equal(C.commit(C.create(), reservationSection, STRIKE, {
  protectedActors: [{ at: reservationAt, lane: 0, targetLane: 2, locked: true, crossed: false }]
}).pulse, null, 'a full nearby turn gets a quiet musical beat');
assert.equal(C.commit(C.create(), reservationSection, STRIKE, {
  protectedActors: [{ at: reservationAt, lane: 2, targetLane: 2, locked: true, crossed: true }]
}).pulse.lane, 2, 'passed rivals no longer reserve lanes');
assert.equal(C.commit(C.create(), reservationSection, STRIKE, {
  reservedPursuit: { at: reservationAt, lane: 2 }
}).pulse.lane, reserved.lane, 'the pose shortcut uses the same reserved corridor');
console.log('Cache encounter chart passed:', results.map(({ chart, ...result }) => result));
