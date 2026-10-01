// Production chapter/archive persistence against a controllable storage host.
// Road mechanics and hosted rendering are covered by their own integration gates.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'barcode.system-override.save.v1.default';
const copy = value => JSON.parse(JSON.stringify(value));
function storage() {
  return { data: new Map(), writes: [], fail: null,
    getItem(key) { if (this.fail === 'all') throw Error('offline'); return this.data.get(key) || null; },
    setItem(key, value) {
      if (this.fail === 'all' || this.fail === key) throw Error('quota');
      this.writes.push(key); this.data.set(key, value);
    },
    removeItem(key) { this.data.delete(key); }
  };
}
function rig(shared = storage()) {
  const w = { BARCODE: {}, localStorage: shared, FILE_MANIFEST: [] }, context = vm.createContext({ window: w, console });
  const load = name => vm.runInContext(fs.readFileSync(path.join(ROOT, name), 'utf8'), context, { filename: name });
  load('src/game/lore-collection.js');
  let archive = new w.BARCODE.LoreCollection();
  w.BARCODE.Campaign = { archive: () => archive, syncTitleButton() {} };
  load('src/game/cache-chapter.js');
  const chapter = w.BARCODE.CacheChapter;
  const road = { active: true, status: 'playing', chapter: chapter.create({ difficultyId: 'standard' }),
    state: { status: 'playing', gateOpen: false, musicBar: 0, score: 7654,
      pursuit: { defeated: false }, combat: { boss: { defeated: false } } },
    makeCheckpoint(id) { return { levelId: 'level-02', checkpointId: id,
      levelState: { proofVersion: 4, proof: copy(this.state), chapter: copy(this.chapter) } }; } };
  w.BARCODE.CacheRoadProof = road;
  return { w, chapter, road, storage: shared, get archive() { return archive; },
    reload() { archive = new w.BARCODE.LoreCollection(); return archive; },
    clear() { Object.assign(road.state, { status: 'clear', gateOpen: true, musicBar: 100,
      pursuit: { defeated: true }, combat: { boss: { defeated: true } } }); road.status = 'clear'; }
  };
}
function primaryWrites(r) { return r.storage.writes.filter(key => key === KEY).length; }

// An absent old chapter, a future schema and invalid receipt never become an
// authored run merely because an old proof checkpoint says road-clear.
{
  const r = rig(), fresh = copy(r.road.chapter);
  assert.notEqual(fresh.runId, r.chapter.create().runId);
  assert.equal(fresh.encounterVersion, 4, 'only fresh runs opt into the combat chase rules');
  for (const version of [1, 2, 3])
    assert.equal(r.chapter.normalize({ ...fresh, encounterVersion: version }).encounterVersion, version,
      'existing authored encounters keep their version');
  assert.equal(r.chapter.normalize({ ...fresh, encounterVersion: 5 }), null,
    'future encounter metadata cannot invent an eligible run');
  for (const invalid of [null, undefined, {}, { ...fresh, version: 2 }, { ...fresh, elapsedMs: -1 },
    { ...fresh, retries: Infinity }, { ...fresh, attempts: 1e11 }, { ...fresh, runId: 'level-one-run' },
    { ...fresh, perfect: 1 }, { ...fresh, records: ['lore.l01.01'] },
    { ...fresh, delivery: { version: 2 } }, { ...fresh, delivery: { version: 1, result: {} } }]) {
    assert.equal(r.chapter.normalize(invalid), null);
    r.road.chapter = r.chapter.normalize(invalid); r.clear();
    assert.equal(r.chapter.finish(r.road), null);
  }
  assert.equal(primaryWrites(r), 0);
  assert(!r.archive.record.progress.items.includes('stem.bass'));
  const normalized = r.chapter.normalize({ ...fresh, elapsedMs: 7.7, records: ['lore.l02.02', 'lore.l02.02'] });
  assert.equal(normalized.elapsedMs, 8); assert.deepEqual(copy(normalized.records), ['lore.l02.02']);
  normalized.records.push('lore.l02.03'); assert.deepEqual(fresh.records, []);
}

// Award requires the actual completed-road boundary; optional discoveries do
// not influence it. One promotion contains checkpoint, result and rewards.
{
  const r = rig();
  Object.assign(r.road.chapter, { elapsedMs: 192050, damageTaken: 3, retries: 2,
    attempts: 23, accurate: 18, perfect: 11, connected: 18, bestCombo: 5 });
  for (const patch of [{ gateOpen: true, musicBar: 99 }, { gateOpen: false, musicBar: 100 },
    { combat: { boss: { defeated: false } } }, { combat: null }]) {
    r.clear(); Object.assign(r.road.state, patch); assert.equal(r.chapter.finish(), null);
  }
  r.clear(); r.road.active = false; assert.equal(r.chapter.finish(), null); r.road.active = true;
  const result = r.chapter.finish(), frozen = copy(result);
  assert(result && Object.isFrozen(result)); assert.equal(primaryWrites(r), 1);
  assert.equal(result.score, 7654); assert.equal(result.bonus, 0); assert.equal(result.discoveries, 0);
  for (const key of ['elapsedMs', 'damageTaken', 'retries', 'attempts', 'accurate', 'perfect', 'connected', 'bestCombo'])
    assert.equal(result[key], r.road.chapter[key]);
  const disk = JSON.parse(r.storage.data.get(KEY));
  assert.equal(disk.schemaVersion, 1); assert.equal(disk.slotId, 'default');
  assert.equal(disk.current.checkpointId, 'road-clear'); assert.equal(disk.current.levelState.proofVersion, 4);
  assert.equal(disk.current.levelState.chapter.delivery.result.runId, result.runId);
  assert(disk.progress.completedLevels.includes('level-02')); assert(disk.progress.items.includes('stem.bass'));
  assert(disk.progress.unlockedLevels.includes('level-03')); assert.deepEqual(disk.progress.lore, []);
  assert.deepEqual(disk.progress.results['level-02'].standard.latest, frozen);
  r.road.state.score += 9000; assert.equal(r.chapter.finish(), result); assert.equal(primaryWrites(r), 1);
  assert.deepEqual(copy(result), frozen); assert.equal(r.chapter.saveStatus(), 'saved');
  r.road.chapter.delivery.ending = { version: 1, page: 3, cue: 2, done: true };
  assert(r.chapter.persist()); assert.equal(primaryWrites(r), 2);
  r.reload(); r.road.chapter = r.chapter.normalize(r.archive.record.current.levelState.chapter);
  assert.equal(r.chapter.saveStatus(), 'saved');
  assert.deepEqual(copy(r.chapter.finish()), frozen); assert.equal(primaryWrites(r), 2);
  assert.equal(r.road.chapter.delivery.ending.done, true);
  const badReceipt = copy(r.road.chapter); badReceipt.delivery.result.score = -10;
  assert.equal(r.chapter.normalize(badReceipt), null);
  const ending = copy(r.road.chapter); ending.delivery.ending = { version: 1, page: 99, cue: -3, done: 1 };
  assert.deepEqual(copy(r.chapter.normalize(ending).delivery.ending), { version: 1, page: 3, cue: 0, done: false });
}

// Already-saved pursuit runs retain their own earned-boss gate. The new
// combat completion flag cannot substitute for an undefeated version-3 rig.
{
  const r = rig();
  r.road.chapter = r.chapter.normalize({ ...copy(r.road.chapter), encounterVersion: 3 });
  for (const pursuit of [{ defeated: false }, null]) {
    r.clear(); r.road.state.pursuit = pursuit;
    assert.equal(r.chapter.finish(), null);
  }
  assert.equal(primaryWrites(r), 0);
  r.clear(); r.road.state.combat = null;
  assert(r.chapter.finish(), 'a genuinely completed historical pursuit still awards its receipt');
  assert.equal(primaryWrites(r), 1);
}

// Optional records are one-time archive IDs, yet a new attempt can show its
// own collection. Failed writes retain session discoveries and one receipt.
{
  const r = rig(); r.storage.fail = 'all';
  assert(r.chapter.collect('lore.l02.01')); assert(!r.chapter.collect('lore.l02.01'));
  assert(!r.chapter.collect('lore.l01.01'));
  assert.equal(r.archive.status, 'unavailable'); assert(r.archive.has('lore.l02.01'));
  assert.deepEqual(copy(r.road.chapter.records), ['lore.l02.01']);
  r.clear(); const result = copy(r.chapter.finish());
  assert.equal(r.chapter.saveStatus(), 'unavailable'); assert.equal(primaryWrites(r), 0);
  assert(r.archive.record.progress.items.includes('stem.bass'), 'session facts survive unavailable storage');
  assert.equal(r.chapter.collect('lore.l02.02'), false, 'ending cannot collect new records');
  r.storage.fail = null; assert(r.chapter.persist()); assert.equal(primaryWrites(r), 1);
  const disk = JSON.parse(r.storage.data.get(KEY));
  assert.deepEqual(disk.progress.lore, ['lore.l02.01']);
  assert.deepEqual(disk.current.levelState.chapter.delivery.result, result);
  assert.equal(disk.progress.items.filter(id => id === 'stem.bass').length, 1);
  assert.equal(disk.progress.completedLevels.filter(id => id === 'level-02').length, 1);
  r.reload(); r.road.chapter = r.chapter.create(); r.road.status = 'playing';
  assert(r.chapter.collect('lore.l02.01'), 'fresh run sees its own collection');
  assert.equal(r.archive.getIds().filter(id => id === 'lore.l02.01').length, 1);
}

// A failed primary promotion exposes neither half of the completion on
// reload; retry writes the same result and preserves facts from another tab.
{
  const r = rig(); r.archive.collect('lore.l01.01');
  const prior = r.storage.data.get(KEY), writes = primaryWrites(r);
  r.clear(); r.storage.fail = KEY; const result = copy(r.chapter.finish());
  assert.equal(r.storage.data.get(KEY), prior); assert.equal(primaryWrites(r), writes);
  const second = rig(r.storage); assert(!second.archive.record.progress.items.includes('stem.bass'));
  r.storage.fail = null; second.archive.collect('lore.l01.02'); second.archive.collectEgg('egg.l01.cliff-maintenance');
  assert(r.chapter.persist());
  const disk = JSON.parse(r.storage.data.get(KEY));
  assert(disk.progress.lore.includes('lore.l01.01') && disk.progress.lore.includes('lore.l01.02'));
  assert(disk.progress.easterEggs.includes('egg.l01.cliff-maintenance'));
  assert.deepEqual(disk.progress.results['level-02'].standard.latest, result);
  assert.deepEqual(disk.current.levelState.chapter.delivery.result, result);
}

// New checkpoint option is optional and checked before session mutations.
// Future save formats remain untouched, including when changed by another tab.
{
  const r = rig(); r.clear(); const result = r.chapter.finish();
  const current = copy(r.archive.record.current);
  assert(r.archive.completeCampaignLevel('level-01', 'standard', result, 'stem.voice', 'level-02'));
  assert.deepEqual(copy(r.archive.record.current), current, 'old caller does not change checkpoint');
  const before = JSON.stringify(r.archive.record);
  assert(!r.archive.completeCampaignLevel('level-03', 'standard', result, 'stem.drums', 'level-04',
    { checkpoint: { levelId: 'level-02', checkpointId: 'wrong', levelState: {} } }));
  assert.equal(JSON.stringify(r.archive.record), before);
  assert(!r.archive.completeCampaignLevel('level-03', 'standard', result, 'stem.drums', 'level-04',
    { loreIds: ['unknown.future.record'] })); assert.equal(JSON.stringify(r.archive.record), before);
  const future = JSON.stringify({ schemaVersion: 88, slotId: 'default', valuableFutureData: [1, 2, 3] });
  r.storage.data.set(KEY, future); assert(!r.chapter.persist());
  assert.equal(r.chapter.saveStatus(), 'incompatible'); assert.equal(r.storage.data.get(KEY), future);
  const futureRig = rig(r.storage); futureRig.clear(); assert(futureRig.chapter.finish());
  assert.equal(futureRig.chapter.saveStatus(), 'incompatible'); assert.equal(r.storage.data.get(KEY), future);
}
console.log('Cache chapter: atomic completion, stable receipts, 4 optional IDs, failed-save retry, reload, legacy and future-save boundaries passed.');
