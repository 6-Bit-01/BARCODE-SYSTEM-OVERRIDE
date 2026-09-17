// Production collection, archive, presentation and input/lifecycle integration.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
const KEY = 'barcode.system-override.save.v1.default';
const plain = value => JSON.parse(JSON.stringify(value));
function storage() {
  const values = new Map();
  return { values, getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function screen() {
  const operations = [], ctx = { operations, measureText: text => ({ width: text.length * 12.6 }) };
  for (const name of ['save','restore','setTransform','drawImage','fillRect','strokeRect','fillText']) ctx[name] = (...args) => operations.push([name,...args]);
  return { width: 1920, height: 1080, style: {}, getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 80, top: 40, width: 960, height: 540 }) };
}
function rig(saved = storage()) {
  const r = createRig(), { w, context } = r;
  w.localStorage = saved; w.Image = class Image {};
  const canvas = screen();
  w.document.getElementById = id => id === 'gameCanvas' ? canvas : null;
  w.document.createElement = () => screen();
  for (const file of ['src/game/lore-collection.js','src/game/lost-data.js','src/engine/lore.js','src/game/pause-menu.js','src/core/action-input.js','src/core/input.js','src/core/runtime-lifecycle.js']) load(context,file);
  w.lostDataSystem = new w.LostDataSystem(); w.lostDataSystem.init(w.player);
  w.loreSystem = new w.LoreSystem(); w.inputManager = new w.InputManager();
  r.p.startMission();
  return { ...r, saved, canvas, menu: w.BARCODE.PauseMenu, lore: w.loreSystem, lost: w.lostDataSystem };
}
async function main() {
  {
    const r = rig(), { w, p, lost, lore, saved, menu, canvas, listeners, timers, calls } = r;
    const life = w.BARCODE.RuntimeLifecycle; const started = await life.start(); assert(started.ok, JSON.stringify({ started, errors: calls.errors }));
    const event = (key, repeat = false) => ({ key, repeat, preventDefault() {} });
    const down = (key, repeat) => listeners.keydown[0](event(key, repeat));
    const up = key => listeners.keyup[0](event(key));
    assert((await life.pause()).ok); down('l'); up('l'); menu.render();
    assert.strictEqual(menu.view, 'archive'); assert.strictEqual(menu.archiveState().count, 0);
    const labels = () => canvas.getContext().operations.filter(op => op[0] === 'fillText').map(op => op[1]);
    for (const record of w.BARCODE.LoreRecords.level1) {
      assert(!labels().includes(record.title), 'unrecovered titles stay hidden');
      assert(!labels().some(text => record.paragraphs.some(paragraph => text && paragraph.includes(text))), 'unrecovered prose stays hidden');
    }
    down('ArrowRight'); up('ArrowRight'); down('Enter'); up('Enter');
    assert.strictEqual(saved.values.size, 0, 'browsing locked entries cannot create a save');
    down('Escape'); assert(w.gameState.paused); assert.strictEqual(menu.view, 'settings');
    down('Escape', true); assert(w.gameState.paused, 'held Back cannot also resume'); up('Escape');
    await menu.resume();
    p.missionDefeats = 14; lost.update(1);
    for (const index of [2, 0, 1]) assert(lost.collectFragment(lost.fragments[index]));
    assert.strictEqual(lore.currentRecordId, 'lore.l01.03');
    assert.deepStrictEqual(plain(lore.pending.map(n => n.id)), ['lore.l01.01', 'lore.l01.02']);
    assert.strictEqual(lore.currentLore, w.BARCODE.LoreRecords.preview('lore.l01.03'));
    lore.update(300);
    assert((await life.pause()).ok); menu.openArchive();
    assert.strictEqual(menu.archiveIndex, 1, 'archive opens the latest collected record');
    const snapshot = () => plain({ time: w.gameState.gameTime, position: w.player.position, score: w.gameState.score,
      combo: w.rhythmSystem.combo, amp: w.BARCODE.signalAmpCharges, lore: lore.diagnostics(),
      stored: Array.from(saved.values), ids: lost.archive.getIds(), transport: w.BARCODE.MusicTransport.sample() });
    const before = snapshot(), timerCount = timers.size, musicStarts = calls.musicStarts;
    for (let index = 0; index < 3; index++) {
      menu.selectArchive(index); menu.draw(canvas.getContext());
      assert(labels().includes(w.BARCODE.LoreRecords.level1[index].title));
      lore.update(60000); w.updateGame(1000); w.inputManager.updatePausedInput();
    }
    for (let i = 0; i < 20; i++) menu.draw(canvas.getContext());
    assert.deepStrictEqual(snapshot(), before, 'reading/repainting cannot mutate saves, rewards, combat or paused clocks');
    assert.strictEqual(timers.size, timerCount); assert.strictEqual(calls.musicStarts, musicStarts);
    const point = (x, y) => ({ clientX: 80 + x / 2, clientY: 40 + y / 2, preventDefault() {} });
    listeners.mousedown[0](point(600, 414)); listeners.mouseup[0](point(600, 414));
    assert.strictEqual(menu.archiveIndex, 0, 'scaled pointer selects the first record');
    listeners.mousedown[0](point(600, 774)); listeners.mouseup[0](point(600, 774));
    assert.strictEqual(menu.view, 'settings'); assert(w.gameState.paused);
    listeners.mousedown[0](point(1200, 692)); listeners.mouseup[0](point(1200, 692));
    assert.strictEqual(menu.view, 'archive', 'normal menu archive button works');
    down(' '); await menu.resume(); down(' ', true); down('ArrowRight', true);
    w.inputManager.update(); assert(!w.inputManager.actionInput.pressed('jump')); assert(!w.inputManager.actionInput.held('move_right'));
    up(' '); up('ArrowRight');
    lore.update(11700); assert.strictEqual(lore.currentRecordId, 'lore.l01.01');
    lore.update(12000); assert.strictEqual(lore.currentRecordId, 'lore.l01.02');
    lore.update(12000); assert.strictEqual(lore.currentLore, null);
    assert.strictEqual(saved.getItem(KEY), before.stored.find(([key]) => key === KEY)[1]);
    lost.reset(); assert.strictEqual(lost.getProgress().collected, 0); assert.strictEqual(menu.archiveState().count, 3);
    assert.strictEqual(lore.pending.length, 0); assert.strictEqual(lore.currentLore, null);
    const reload = rig(saved);
    assert.strictEqual(reload.menu.archiveState().count, 3, 'persisted IDs display the newly authored records on reload');
    assert.deepStrictEqual(plain(reload.lost.archive.getIds()), plain(lost.archive.getIds()));
    assert.deepStrictEqual(calls.errors, []);
    assert.strictEqual(listeners.keydown.length, 1, 'archive adds no keyboard listeners');
    assert((await life.pause()).ok); menu.openArchive();
    w.audioSystem.resumeRuntimeAudio = async () => ({ ok: false });
    await menu.resume(); menu.draw(canvas.getContext());
    assert(w.gameState.paused); assert.strictEqual(menu.view, 'archive');
    assert(labels().some(text => text.includes('Could not resume audio.')), 'failed resume remains visible inside the archive');
  }
  {
    const saved = storage();
    saved.setItem(KEY, JSON.stringify({ schemaVersion: 1, slotId: 'default', revision: 7,
      progress: { lore: ['lore.l01.02'], items: ['retained'], results: {} }, settings: { music: 0.3 } }));
    const before = saved.getItem(KEY), { w, menu, lost, canvas } = rig(saved);
    w.gameState.paused = true; menu.sync(); menu.openArchive(); menu.draw(canvas.getContext());
    assert.strictEqual(menu.archiveState().count, 1); assert.strictEqual(menu.archiveIndex, 1);
    assert.strictEqual(menu.archiveState().records[1].title, 'The Other Side of Silence');
    assert.strictEqual(saved.getItem(KEY), before, 'existing PR36 saves require no rewrite or reward to read updated prose');
    w.BARCODE.Preferences.restoreDefaults(); lost.reset(); assert.strictEqual(saved.getItem(KEY), before, 'presentation defaults/restart cannot erase discoveries');
  }
  {
    const saved = storage(); saved.setItem = () => { throw new Error('blocked'); };
    const { w, p, lost, menu, canvas } = rig(saved); p.missionDefeats = 4; lost.update(1); lost.collectFragment(lost.fragments[0]);
    w.gameState.paused = true; menu.sync(); menu.openArchive(); menu.draw(canvas.getContext());
    assert.strictEqual(menu.archiveState().count, 1); assert.strictEqual(menu.archiveState().saved, false);
    assert(canvas.getContext().operations.some(op => op[0] === 'fillText' && op[1] === 'These records remain in this session.'));
  }
  console.log('Lore archive: authored content, existing-save unlocks, hidden entries, pure reading, input ownership, queued notices, pause/reload/reset and blocked storage passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
