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
  {
    const { w, menu, lost, canvas, saved } = rig(), B = w.BARCODE;
    const event = key => ({ key, repeat: false, preventDefault() {} });
    const tap = key => { menu.keyDown(event(key)); menu.keyUp(event(key)); };
    const labels = () => canvas.getContext().operations.filter(op => op[0] === 'fillText').map(op => op[1]);
    const point = (x, y) => ({ clientX: 80 + x / 2, clientY: 40 + y / 2, preventDefault() {} });
    w.gameState.paused = true; menu.openArchive();
    assert.deepStrictEqual(plain(menu.archiveChapters()), [1], 'unavailable chapters do not add empty tabs');
    B.CacheRoadProof = { active: true, status: 'playing' }; menu.openArchive();
    assert.strictEqual(menu.archiveLevel, 2, 'driving opens the current chapter archive');
    assert.strictEqual(menu.archiveState().records.length, 4);
    menu.draw(canvas.getContext());
    assert(labels().includes('RECORD 04  /  UNRECOVERED'));
    assert(labels().includes('RECORD 07  /  UNRECOVERED'));
    for (const record of B.LoreRecords.level2) {
      assert(!labels().includes(record.title), 'unrecovered Level 2 titles stay hidden');
      assert(!labels().some(text => record.paragraphs.some(paragraph => text && paragraph.includes(text))), 'unrecovered Level 2 prose stays hidden');
    }
    menu.selectArchive(0); tap('ArrowUp');
    assert.strictEqual(menu.archiveFocus, 7, 'chapter tabs join the keyboard focus order');
    tap('ArrowLeft'); assert.strictEqual(menu.archiveLevel, 1); assert.strictEqual(menu.archiveFocus, 5);
    tap('ArrowRight'); assert.strictEqual(menu.archiveLevel, 2); assert.strictEqual(menu.archiveFocus, 7);
    assert.strictEqual(saved.values.size, 0, 'reading either chapter cannot write a save');
    menu.pointer(point(500, 310), 'down'); assert.strictEqual(menu.archiveLevel, 1);
    menu.pointer(point(730, 310), 'down'); assert.strictEqual(menu.archiveLevel, 2);
    menu.pointer(point(600, 630), 'down'); assert.strictEqual(menu.archiveIndex, 3, 'scaled pointer reaches the fourth record');
    menu.pointer(point(600, 774), 'down'); assert.strictEqual(menu.view, 'settings', 'four records leave the Back button clear');
    for (const record of B.LoreRecords.level2) assert(lost.archive.collect(record.id));
    lost.lastCollectedLoreId = 'lore.l02.03'; menu.openArchive();
    assert.strictEqual(menu.archiveIndex, 2); assert.strictEqual(menu.archiveState().count, 4);
    const before = saved.getItem(KEY);
    for (let index = 0; index < 4; index++) {
      canvas.getContext().operations.length = 0; menu.selectArchive(index); menu.draw(canvas.getContext());
      assert(labels().includes(B.LoreRecords.level2[index].title));
      const rectangles = canvas.getContext().operations.filter(op => op[0] === 'fillRect' && op[1] === 420 && op[2] >= 356 && op[2] < 690);
      assert.strictEqual(rectangles.length, 4);
      assert(rectangles.every(op => op[2] + op[4] < 690), 'all four record rows fit above notices');
    }
    const pressed = {};
    B.GamepadUI = { poll: owner => { assert.strictEqual(owner, 'pause'); return { pressed, held: {}, changed: false }; } };
    menu.selectArchive(0); pressed.up = true; w.inputManager.routeGamepadUI(); delete pressed.up;
    pressed.left = true; w.inputManager.routeGamepadUI(); delete pressed.left;
    assert.strictEqual(menu.archiveLevel, 1, 'existing controller routing can select a chapter tab');
    pressed.right = true; w.inputManager.routeGamepadUI(); delete pressed.right;
    assert.strictEqual(menu.archiveLevel, 2);
    pressed.b0 = true; w.inputManager.routeGamepadUI(); delete pressed.b0;
    assert.strictEqual(menu.archiveLevel, 2, 'controller confirm keeps the selected chapter');
    assert.strictEqual(saved.getItem(KEY), before, 'chapter switching and reading preserve save bytes');
    B.CacheRoadProof.active = false; B.CacheEnding = { active: true }; menu.openArchive();
    assert.strictEqual(menu.archiveLevel, 2, 'ending opens the same four records');
    B.CacheEnding.active = false; menu.openArchive(); assert.strictEqual(menu.archiveLevel, 1, 'outside Cache, Level 1 remains the default');
    const restored = rig(saved); restored.w.gameState.paused = true; restored.menu.openArchive();
    assert.deepStrictEqual(plain(restored.menu.archiveChapters()), [1, 2], 'collected records keep their chapter available after reload');
    restored.menu.changeArchiveChapter(2); assert.strictEqual(restored.menu.archiveState().count, 4);
  }
  {
    const saved = storage(); saved.setItem = () => { throw new Error('blocked'); };
    const { w, menu, lost, canvas } = rig(saved);
    lost.archive.collect('lore.l02.04'); w.gameState.paused = true; menu.openArchive(); menu.changeArchiveChapter(2); menu.draw(canvas.getContext());
    assert.strictEqual(menu.archiveState().count, 1); assert.strictEqual(menu.archiveState().saved, false);
    assert.strictEqual(menu.archiveState().records[0], null);
    assert.strictEqual(menu.archiveState().records[3].id, 'lore.l02.04');
    assert(canvas.getContext().operations.some(op => op[0] === 'fillText' && op[1] === 'These records remain in this session.'));
  }
  {
    const { w, menu, canvas } = rig(); let exits = 0;
    const road = w.BARCODE.CacheRoadProof = { active: true, status: 'playing', chapter: null, exit() { exits++; } };
    const drawLabels = () => { canvas.getContext().operations.length = 0; menu.draw(canvas.getContext());
      return canvas.getContext().operations.filter(op => op[0] === 'fillText').map(op => op[1]); };
    w.gameState.paused = true; menu.sync();
    let labels = drawLabels(); assert(labels.includes('PROTOTYPE CHANNEL 02')); assert(labels.includes('Exit preview'));
    road.chapter = { runId: 'cache-current', difficultyId: 'overclocked' }; labels = drawLabels();
    assert(labels.includes('CACHE LINE')); assert(labels.includes('CHAPTER 02 / OVERCLOCKED / CHECKPOINTS'));
    assert(labels.includes('Return to bridge')); assert(!labels.includes('PROTOTYPE CHANNEL 02'));
    menu.focus = 7; menu.activate();
    assert.strictEqual(exits, 1, 'authored return retains the established saved-road exit action');
    assert.strictEqual(road.chapter.runId, 'cache-current', 'pause return does not create a new race');
  }
  console.log('Lore archive: both chapters, four optional Cache records, hidden entries, keyboard/controller/pointer tabs, pure reading, reload and honest storage status passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
