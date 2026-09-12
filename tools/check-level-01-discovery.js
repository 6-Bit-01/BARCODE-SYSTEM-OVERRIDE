// Production collection/storage and actual player geometry at the roof surface.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
const KEY = 'barcode.system-override.save.v1.default';
const plain = value => JSON.parse(JSON.stringify(value));
function storage(values = new Map()) {
  return { values, getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function rig(saved = storage()) {
  const r = createRig(), { w, p, context } = r;
  w.localStorage = saved;
  w.Image = class Image {};
  w.particleSystem.dataFragmentEffect = () => {};
  w.particleSystem.dataFragmentGlow = () => {};
  w.particleSystem.dataFragmentCollected = () => {};
  const messages = []; w.loreSystem = { displayLoreMessage: text => messages.push(text) };
  load(context, 'src/game/lore-collection.js'); load(context, 'src/game/lost-data.js');
  const lost = w.lostDataSystem = new w.LostDataSystem(); lost.init(w.player); p.startMission();
  return { ...r, lost, saved, messages };
}
for (const fps of [30, 60, 120, 144]) {
  const { w, p, lost, saved, messages } = rig();
  const initial = w.gameState.score;
  for (const [kills, count] of [[0, 0], [4, 1], [9, 2], [14, 3], [20, 3]]) {
    p.missionDefeats = kills; lost.update(1000 / fps);
    assert.strictEqual(lost.getProgress().activeFragments, count, 'all records unlock with progression within a fast run');
  }
  for (const index of [2, 0, 1]) {
    const record = lost.authoredLevel1Placements[index];
    w.player.position.x = record.x;
    w.player.position.y = record.surfaceY + 20 - w.Player.VISUAL_FOOT_OFFSET_Y;
    const before = lost.collectedLore.size; lost.update(1000 / fps);
    assert.strictEqual(lost.collectedLore.size, before, 'no collecting through a rooftop underside');
    w.player.position.y = record.surfaceY - w.Player.VISUAL_FOOT_OFFSET_Y;
    lost.update(1000 / fps);
    assert(lost.collectedLore.has(record.loreId), 'body contact on the roof collects the actual record');
    lost.update(1000 / fps); assert.strictEqual(lost.collectedLore.size, before + 1);
    assert(messages.at(-1).startsWith(`ARCHIVE 0${index + 1}`), 'out-of-order exploration retains record identity');
  }
  assert.strictEqual(w.gameState.score, initial + 1500);
  assert.strictEqual(messages.length, 3);
  const complete = JSON.parse(saved.getItem(KEY));
  assert.strictEqual(new Set(complete.progress.lore).size, 3);
  assert.strictEqual(complete.revision, 3);
  lost.reset(); assert.strictEqual(lost.collectedLore.size, 0);
  assert.strictEqual(lost.archive.getIds().length, 3, 'level replay retains campaign discoveries');
  const reloaded = rig(saved);
  assert.strictEqual(reloaded.lost.archive.getIds().length, 3, 'reload retains unique IDs');
  assert.strictEqual(reloaded.lost.archive.collect('lore.l01.01'), false);
  assert.strictEqual(JSON.parse(saved.getItem(KEY)).revision, 3, 'repeated records never inflate or rewrite progress');
  assert.strictEqual(reloaded.lost.archive.collect('lore.l01.04'), false, 'only authored IDs count');
}
{
  const { w, p, lost } = rig(); p.missionDefeats = 20;
  w.gameState.paused = true; lost.update(10000); assert.strictEqual(lost.fragments.length, 0);
  w.gameState.paused = false; lost.update(1); assert.strictEqual(lost.fragments.length, 3);
  const fragment = lost.fragments[0];
  w.gameState.victory = true;
  assert.strictEqual(lost.collectFragment(fragment), false, 'completion cannot grant late passive discoveries');
  w.gameState.victory = false;
  assert.strictEqual(lost.collectFragment({ active: true, loreId: 'unknown' }), false);
}
for (const fps of [30, 60, 120, 144]) {
  const { w, p } = rig(); const amp = w.Sector1Progression.SIGNAL_AMP;
  w.player.position.x = amp.x; w.player.position.y = 220 - w.Player.VISUAL_FOOT_OFFSET_Y;
  p.updateSignalAmp(); assert.strictEqual(w.BARCODE.signalAmpCharges, 0);
  w.player.position.y = 196 - w.Player.VISUAL_FOOT_OFFSET_Y;
  w.player.position.x = amp.x + 72;
  p.updateSignalAmp(); assert.strictEqual(w.BARCODE.signalAmpCharges, 0, 'outside physical contact does not collect');
  w.player.position.x = amp.x + 30;
  p.update(1000 / fps); assert.strictEqual(w.BARCODE.signalAmpCharges, 3, 'walking across the real roof collects Amp');
  w.BARCODE.signalAmpCharges = 2; p.updateSignalAmp(); assert.strictEqual(w.BARCODE.signalAmpCharges, 2, 'no repeated pickup');
}
{
  const saved = storage(); const a = rig(saved).lost.archive, b = rig(saved).lost.archive;
  a.collect('lore.l01.01'); b.collect('lore.l01.02');
  assert.deepStrictEqual(JSON.parse(saved.getItem(KEY)).progress.lore.sort(), ['lore.l01.01', 'lore.l01.02'], 'sequential writes from two tabs merge unique facts');
  const snapshot = JSON.parse(saved.getItem(KEY)); snapshot.progress.items = ['owned-item']; snapshot.settings = { music: 0.3 };
  saved.setItem(KEY, JSON.stringify(snapshot)); a.collect('lore.l01.03');
  assert.deepStrictEqual(JSON.parse(saved.getItem(KEY)).settings, { music: 0.3 });
  assert.deepStrictEqual(JSON.parse(saved.getItem(KEY)).progress.items, ['owned-item']);
  const valid = saved.getItem(KEY); saved.setItem(KEY + '.backup', valid); saved.setItem(KEY, '{broken');
  const recovered = rig(saved).lost.archive; assert.strictEqual(recovered.getIds().length, 3);
  assert(recovered.save()); assert.strictEqual(saved.getItem(KEY + '.damaged'), '{broken');
  saved.removeItem(KEY);
  const missingMain = rig(saved).lost.archive;
  assert.strictEqual(missingMain.getIds().length, 3, 'missing canonical save recovers the last complete backup');
  assert(missingMain.save()); assert.strictEqual(JSON.parse(saved.getItem(KEY)).progress.lore.length, 3);
  saved.setItem(KEY, JSON.stringify({ schemaVersion: 99 }));
  const future = rig(saved).lost.archive; future.collect('lore.l01.01');
  assert.strictEqual(saved.getItem(KEY), JSON.stringify({ schemaVersion: 99 }), 'future save is never overwritten');
}
{
  const saved = storage(); saved.setItem = () => { throw new Error('quota'); };
  const { w, p, lost, context, calls } = rig(saved); p.missionDefeats = 4;
  const fragment = lost.spawnFragment(); const score = w.gameState.score;
  assert(lost.collectFragment(fragment)); assert.strictEqual(w.gameState.score, score + 500);
  assert.strictEqual(lost.getProgress().saved, false, 'failed persistence is reported while play continues');
  assert.deepStrictEqual(plain(lost.archive.getIds()), ['lore.l01.01'], 'session facts survive a storage failure');
  load(context, 'src/game/ui-manager.js');
  const labels = [];
  const ctx = new Proxy({ fillText: text => labels.push(text) }, {
    get(target, key) { return key in target ? target[key] : () => {}; }
  });
  w.drawBasicUI(ctx);
  assert(labels.includes('ARCHIVE SAVE UNAVAILABLE — KEEP TAB OPEN'), 'the active gameplay HUD reports failed persistence');
  assert.deepStrictEqual(calls.errors, []);
}
console.log('Discovery: fast progression, all three authored records, roof contact, persistence, retries, duplicate IDs and save recovery passed.');
