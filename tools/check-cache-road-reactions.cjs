// Exercise world-space consequences and musical recovery without a renderer.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const window = { BARCODE: {}, FILE_MANIFEST: [] };
vm.runInNewContext(fs.readFileSync(path.join(__dirname,
  '../src/game/cache-road-reactions.js'), 'utf8'), { window });
const R = window.BARCODE.CacheRoadReactions;
const plain = value => JSON.parse(JSON.stringify(value));
const state = patch => ({ progress: 100, elapsedMs: 4000, lanePos: 1,
  musicBeatFloat: 36.2, captures: [], queuedCaptures: [], ...patch });

// The same pose, including its identity and alpha, serves contact and both
// cameras. The actor never teleports on the frame where Push connects.
{
  const s = state(), actor = { id: 'freight-1', at: 100, lane: 1, kind: 'freight' };
  const original = plain(actor), before = R.pose(s, actor);
  const reaction = R.onHit(s, actor, { kind: 'push', baseLane: 1 });
  const first = R.pose(s, actor);
  assert.equal(first.at, before.at); assert.equal(first.lane, before.lane);
  assert.equal(first.alpha, 1); assert.equal(first.collidable, false);
  s.elapsedMs += 325;
  assert.equal(R.pose(s, actor).at, 140.5); assert.equal(R.pose(s, actor).lane, 1);
  assert.strictEqual(R.onHit(s, actor, { kind: 'push' }), reaction);
  assert.equal(reaction.startedAt, 4000, 'duplicate contact must not extend lifetime');
  s.elapsedMs += 325;
  assert.equal(R.pose(s, actor).at, 154); assert(R.pose(s, actor).alpha > 0);
  s.elapsedMs += 250;
  assert.equal(R.pose(s, actor).alpha, 0);
  assert.equal(R.pose(s, actor).collidable, false);
  assert.deepEqual(actor, original, 'announced world address stays immutable');
  assert.equal(first.id, actor.id, 'pose preserves identity when passed as a clearance actor');
}

// Existing hull separation is never consumed by a forward shove; the next
// vehicle remains active while the pushed vehicle resolves once and fades.
{
  const s = state();
  const actor = { at: 100, lane: 1, kind: 'van' };
  const next = { at: 160, lane: 1, kind: 'freight' };
  const adjacent = { at: 100, lane: 2, kind: 'shuttle' };
  R.onHit(s, actor, { kind: 'push', actors: [actor, next, adjacent] });
  for (let age = 0; age <= 1000; age += 10) {
    s.elapsedMs = 4000 + age;
    const p = R.pose(s, actor), n = R.pose(s, next), a = R.pose(s, adjacent);
    assert.equal(p.lane, 1); assert(n.at - p.at >= R.clearance);
    assert.equal(a.lane - p.lane, 1); assert.equal(n.collidable, true);
    assert.equal(p.collidable, false);
  }
  const edge = { at: 120, lane: 0, kind: 'audit' };
  R.onHit(s, edge, { kind: 'push', shoulderClear: true });
  s.elapsedMs += 650;
  assert.equal(R.pose(s, edge).lane, -.65);
  const blocked = { at: 130, lane: 3, kind: 'audit' };
  R.onHit(s, blocked, { kind: 'push', shoulderClear: false });
  s.elapsedMs += 650;
  assert.equal(R.pose(s, blocked).lane, 3, 'unreserved shoulder is never used');
  const crowded = { id: 'crowded', at: 300, lane: 2, kind: 'van' };
  R.onHit(s, crowded, { kind: 'push', actors: [
    { id: 'still-visible', at: 350, lane: 2, alpha: .5, collidable: false }
  ] });
  s.elapsedMs += 650;
  assert.equal(R.pose(s, crowded).at, 308, 'fading displaced traffic still reserves visible space');
}

// Brace gives the struck vehicle physical recoil while holding the lane.
// Neither a second frame nor a second camera can consume another defense.
{
  const s = state(), actor = { at: 100, lane: 2, kind: 'sweeper' };
  R.onHit(s, actor, { kind: 'brace', baseLane: 1.8 });
  assert.equal(s.reactionRecoilKind, 'brace'); assert.equal(s.reactionRecoilMs, 420);
  s.elapsedMs += 190;
  assert.equal(R.pose(s, actor, 2).at, 106);
  assert.equal(R.pose(s, actor, 2).lane, 1.8, 'recoil freezes actual contact lane');
  R.step(s, 190); assert.equal(s.reactionRecoilMs, 230);
  s.elapsedMs += 190; R.step(s, 190);
  assert.equal(R.pose(s, actor).at, 112); assert.equal(s.reactionRecoilMs, 40);
  s.progress = 833; R.step(s, 0);
  assert.equal(Object.keys(s.actorReactions).length, 0, 'prune only beyond rearview');
}

// A crash drops exactly one active part, preferring the struck lane even
// when another expires sooner. Other parts and already-earned queues live.
{
  const captures = [
    { lane: 0, startBeat: 8, endBeat: 40 }, { lane: 1, startBeat: 20, endBeat: 60 },
    { lane: 2, startBeat: 16, endBeat: 48 }, { lane: 3, startBeat: 24, endBeat: 80 }
  ];
  const queuedCaptures = [{ lane: 1, startBeat: 40, endBeat: 72 }];
  const s = state({ captures: plain(captures), queuedCaptures: plain(queuedCaptures), fullAdrenaline: true });
  assert.equal(R.recoverCapture(s), 1);
  assert.deepEqual(s.captures.map(c => c.lane), [0, 2, 3]);
  assert.deepEqual(s.queuedCaptures, queuedCaptures);
  assert.equal(s.fullAdrenaline, false); assert.equal(s.hitRecovery, true);
  assert.equal(s.lostCaptureLane, 1); assert.equal(s.lostCaptureMs, 900);
  s.musicBeatFloat = 37.19; R.step(s, 450); assert.equal(s.hitRecovery, true);
  s.musicBeatFloat = 37.2; R.step(s, 20); assert.equal(s.hitRecovery, false);
  assert.equal(s.hitRecoveryUntilBeat, null);
  // No part in the struck lane: choose earliest expiry, then numeric lane.
  s.captures = [{ lane: 3, endBeat: 50 }, { lane: 2, endBeat: 45 }, { lane: 0, endBeat: 45 }];
  assert.equal(R.recoverCapture(s), 0);
  assert.deepEqual(s.captures.map(c => c.lane), [3, 2]);
  s.captures = [];
  assert.equal(R.recoverCapture(s), null);
  assert.equal(s.lostCaptureMs, 0);
}

console.log('Cache road reactions: shared physical poses, clearance, one-shot contacts and one-part recovery passed.');
