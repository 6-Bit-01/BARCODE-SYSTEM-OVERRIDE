// Deterministic song chart, safe musical corridors and bounded save ownership.
// Complete input-driven road races are a separate integration gate.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const w = { BARCODE: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/game/cache-road-pursuit.js'), 'utf8'), { window: w });
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/game/cache-road-encounters.js'), 'utf8'), { window: w });
const C = w.BARCODE.CacheRoadEncounters, plain = value => JSON.parse(JSON.stringify(value));
const beatSec = 60 / 128;
const STRIKE = (1 - Math.sqrt(.83 ** 2 - 119 * .14 / 680)) * 520 - 80;
function endpoint(s) {
  // Independent integration in seconds: accelerate with smoothstep for .75
  // beats, then hold speed for the remaining 3.25 beats.
  return s.from + (s.v0 + s.speed) / 2 * .75 * s.beatSec + s.speed * 3.25 * s.beatSec;
}
function runChart(difficulty, gear, varied = false, version = 2) {
  let chart = C.create(difficulty, version), from = 0, previousSpeed = [30, 52, 70][gear];
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
      if (version === 1) assert(bar < 50 || (bar > 62 && bar < 69), 'legacy chart retains its original empty lesson/pursuit intervals');
      else {
        assert(bar >= 4 && bar <= 84, 'fresh traffic clears before the final delivery split');
        const free = [0, 1, 2, 3].filter(lane => !sweptLanes.has(lane));
        assert(free.some(lane => free.includes(lane + 1)), 'a pursuer can use one open lane while its adjacent escape stays free');
        const previous = before.rows.at(-1);
        if (previous) {
          const occupied = new Set(previous.actors.flatMap(actor => C.occupiedLanes(actor)));
          assert(free.some(lane => !occupied.has(lane)), 'successive civilian rows share a reachable free corridor');
        }
      }
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
  return { version, difficulty, gear: gear + 1, actors: C.hazards(chart).length, pulses: issued, chart };
}
const results = [];
for (const difficulty of ['relaxed', 'standard', 'overclocked']) {
  for (const gear of [0, 1, 2]) results.push(runChart(difficulty, gear));
  runChart(difficulty, 1, true);
}
const legacy = [];
for (const difficulty of ['relaxed', 'standard', 'overclocked']) {
  for (const gear of [0, 1, 2]) legacy.push(runChart(difficulty, gear, false, 1));
  runChart(difficulty, 1, true, 1);
}
// Exact v1 snapshots from the merged pre-change production module (8f0f435).
// This protects already-saved playthroughs from an accidental live retune.
const legacyHashes = {
  "relaxed/1": "b192c6a509bcfe287aba1172f4786f41840524f5391d454d70bcfe2fcd1edb74",
  "relaxed/2": "25a43813bcf2962234e31842450a92f1c6cec4e1c5a8621e2c6922d2403d8ea4",
  "relaxed/3": "928335afb292578be1409adb6c78c1458777fca5cbe77df410c46dffca4064e1",
  "standard/1": "8741e572aff47c75fa7ab8fbc860cd60dcbda95e9acdface2720c3032fe87900",
  "standard/2": "b47b15337de486d9a3c4aa425a5c05c2f05be7e73d0cab1b2531265ec5364554",
  "standard/3": "0b4afa4cb251c7f8ac59349d62e9046ca709dbabc046850ac8baa476140ce81d",
  "overclocked/1": "f6322493636883d26c69c806abc299978e80eeb2b70ea63a98a774c71e16d341",
  "overclocked/2": "5dc1f232a210736890a43a5a33c4bc97b4f51a07bf59d80bdd276c3defa24816",
  "overclocked/3": "f41da29b41c1f1b3e5ee0eddbec8f1dc0c8781ceaf63793f0b9e26a9b36f5a18"
};
for (const result of legacy) {
  const hash = require('node:crypto').createHash('sha256').update(JSON.stringify(C.snapshot(result.chart))).digest('hex');
  assert.equal(hash, legacyHashes[`${result.difficulty}/${result.gear}`], 'version1 layout remains byte-identical to the pre-change chart');
}
for (const result of results) {
  const { chart } = result;
  for(const lane of [0,1,2,3]) {
    const offers=chart.pulses.filter(pulse=>pulse.lane===lane);
    assert(offers.length>=4, `lane ${lane}: every musical part remains reachable repeatedly at every difficulty/gear`);
    assert(offers.some(pulse=>pulse.bar>=28&&pulse.bar<52)&&offers.some(pulse=>pulse.bar>=52&&pulse.bar<90),
      `lane ${lane}: access cannot disappear after the first act or return only at the finish`);
  }
  assert(chart.rows.some(row => row.actors.some(actor => actor.kind === 'trike' && actor.mergeLane !== undefined)),
    'every fresh run retains an actual warned one-lane cut');
  assert(chart.rows.some(row => row.bar >= 52 && row.bar <= 62), 'surveillance has visible civilian traffic');
  assert(chart.rows.some(row => row.bar >= 76 && row.bar <= 84), 'pursuit remains a drive through traffic');
  const gaps = chart.rows.slice(1).map((row, i) => row.bar - chart.rows[i].bar);
  assert(Math.max(...gaps) <= 4, 'active acts never have the old 16-bar traffic blackout');
  const prior = legacy.find(item => item.difficulty === result.difficulty && item.gear === result.gear);
  assert(result.actors > prior.actors, 'every fresh difficulty and gear has more actual traffic than its legacy chart');
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
for (const invalid of [undefined, null, {}, { version: 3 }, { version: 4, progress: 1700 }])
  assert.equal(C.restore(invalid), null);
const valid = C.snapshot(results[0].chart);
for (const mutate of [
  raw => { raw.version = 3; },
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
// Protect the REAL pursuit schedule before its opponent is visible. Even
// a later gear change can only move through the bounded 30..75 speed range;
// the reserved row still carries one civilian rather than an empty highway.
for (const wave of w.BARCODE.CacheRoadPursuit.waves) for (const speed of [30,52,70,75]) {
  const chart=C.create('overclocked'), section={beat:(wave.bar-4)*4,beatSec,from:1000,v0:speed,speed};
  const row=C.ensure(chart,section);
  assert(row&&row.actors.length===1&&row.actors[0].lane===0,
    `${wave.id}: prospective pursuit contact keeps three open lanes across future gears`);
}
// A future civilian row must concede already announced paint and a locked
// rival's escape; the existing world contacts never get edited to make room.
const liveReservationSection = { beat: 16, beatSec, from: 400, v0: 52, speed: 52 };
const committedAt = liveReservationSection.from + C.revealDistance;
const liveReserved = C.create('overclocked');
const clearRow = C.ensure(liveReserved, liveReservationSection, null, {
  protectedActors: [{ at: committedAt, lane: 0, targetLane: 0, locked: true, crossed: false }]
});
assert.equal(clearRow, null, 'a pair in the rival lane and its only adjacent escape is omitted before reveal');
assert.equal(liveReserved.rows.length, 0, 'an unsafe new row never materializes');
const knownPaint = C.create('overclocked');
knownPaint.pulses.push({ at: committedAt, lane: 0 });
const paintedRow = C.ensure(knownPaint, liveReservationSection);
assert(paintedRow && paintedRow.actors.every(actor => !C.occupiedLanes(actor).includes(0)),
  'published musical lane owns its contact before later traffic');
assert.equal(C.supportedVersion(1), true);assert.equal(C.supportedVersion(2), true);
assert.equal(C.supportedVersion(3), false);
assert.equal(C.restore(C.snapshot(legacy[0].chart)).version, 1, 'legacy saves never silently adopt new density');
console.log('Cache encounter chart passed:', results.map(({ chart, ...result }) => result));
