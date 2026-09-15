#!/usr/bin/env node
// Production input/lifecycle/settings/results checks; browser drawing, storage
// and audio hardware are explicit boundaries, not claims of Makko acceptance.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
const copy = value => JSON.parse(JSON.stringify(value));
function canvas() {
  const operations = [], ctx = { operations };
  for (const method of ['save', 'restore', 'setTransform', 'drawImage', 'fillRect', 'strokeRect', 'fillText']) ctx[method] = (...args) => operations.push([method, ...args]);
  return { width: 1920, height: 1080, style: {}, getContext: () => ctx, getBoundingClientRect: () => ({ left: 80, top: 40, width: 960, height: 540 }) };
}
async function main() {
  {
    const { w, context, listeners, calls, timers } = createRig();
    const screen = canvas(), store = new Map();
    w.document.getElementById = id => id === 'gameCanvas' ? screen : null;
    w.document.createElement = () => canvas();
    w.localStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
    for (const file of ['src/game/pause-menu.js', 'src/core/action-input.js', 'src/core/input.js', 'src/core/runtime-lifecycle.js']) load(context, file);
    w.inputManager = new w.InputManager();
    const menu = w.BARCODE.PauseMenu, prefs = w.BARCODE.Preferences, lifecycle = w.BARCODE.RuntimeLifecycle;
    const started = await lifecycle.start(); assert(started.ok, JSON.stringify(started));
    const event = (key, repeat = false) => ({ key, repeat, preventDefault() {}, shiftKey: false });
    const down = (key, repeat) => listeners.keydown[0](event(key, repeat));
    const up = key => listeners.keyup[0](event(key));
    const timerCount = timers.size;
    const musicStarts = calls.musicStarts;
    down('ArrowRight'); w.inputManager.update();
    const paused = await lifecycle.pause(); assert(paused.ok, JSON.stringify(paused));
    const before = copy({ position: w.player.position, time: w.gameState.gameTime, combo: w.rhythmSystem.combo, transport: w.BARCODE.MusicTransport.sample() });
    const generation = w.BARCODE.MusicTransport.getDiagnostics().generation;
    menu.render();
    assert(menu.open); assert.strictEqual(menu.focus, 7);
    const drawCount = screen.getContext().operations.length;
    menu.render(); assert.strictEqual(screen.getContext().operations.length, drawCount, 'unchanged paused screen is not redrawn');
    down('ArrowDown'); up('ArrowDown'); // Defaults row.
    down('Tab'); up('Tab'); // Music row.
    down('ArrowLeft'); up('ArrowLeft'); assert.strictEqual(prefs.values.music, 0.95);
    down('Tab'); up('Tab'); down('ArrowLeft'); up('ArrowLeft'); assert.strictEqual(prefs.values.sfx, 0.95);
    down('Tab'); up('Tab'); down('Enter'); up('Enter'); assert.strictEqual(prefs.values.screenShake, false);
    const point = (x, y) => ({ clientX: 80 + x / 2, clientY: 40 + y / 2, preventDefault() {} });
    listeners.mousedown[0](point(1355, 391));
    listeners.mousemove[0](point(1260, 391)); listeners.mouseup[0](point(1260, 391));
    assert.strictEqual(prefs.values.music, 0, 'pointer slider respects actual CSS-scaled canvas bounds and permits mute');
    listeners.mousedown[0](point(1200, 551)); listeners.mouseup[0](point(1200, 551));
    assert.strictEqual(prefs.values.flashes, false);
    let spaces = 0; w.tutorialSystem.active = true; w.tutorialSystem.handleSpacePress = () => spaces++;
    down(' '); up(' '); down('r'); up('r'); down('h'); up('h');
    assert.strictEqual(spaces, 0, 'pause owns tutorial Space as well as gameplay keys');
    w.updateGame(1000); w.inputManager.updatePausedInput(); menu.render();
    assert.deepStrictEqual(copy({ position: w.player.position, time: w.gameState.gameTime, combo: w.rhythmSystem.combo, transport: w.BARCODE.MusicTransport.sample() }), before);
    // Held menu jump cannot leak through the resume transition, including repeats.
    menu.focus = 0; down(' '); await menu.resume();
    down(' ', true); w.inputManager.update(); assert(!w.inputManager.actionInput.pressed('jump'));
    assert(!w.inputManager.actionInput.held('move_right'), 'held pre-pause movement is released');
    up(' '); up('ArrowRight');
    assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation, generation + 1, 'exactly one normal transport resume');
    assert.strictEqual(calls.musicStarts, musicStarts, 'menu does not start another music source');
    assert.strictEqual(timers.size, timerCount, 'menu adds no timers');
    assert.strictEqual(listeners.keydown.length, 1, 'menu uses the existing input listener');
    const saved = copy(prefs.values); load(context, 'src/game/pause-menu.js');
    assert.deepStrictEqual(copy(w.BARCODE.Preferences.values), saved, 'preferences survive module reload');
    w.localStorage.setItem = () => { throw new Error('blocked'); };
    w.BARCODE.Preferences.set('sfx', 0.4); assert.strictEqual(w.BARCODE.Preferences.values.sfx, 0.4); assert.strictEqual(w.BARCODE.Preferences.saved, false);
    w.localStorage.getItem = () => '{bad'; load(context, 'src/game/pause-menu.js'); assert.strictEqual(w.BARCODE.Preferences.values.music, 1);
    w.BARCODE.Preferences.set('music', NaN); assert.strictEqual(w.BARCODE.Preferences.values.music, 1);
    assert.deepStrictEqual(calls.errors, []);
  }
  {
    const { w, context } = createRig(); load(context, 'src/core/action-input.js');
    const pad = { buttons: Array.from({ length: 16 }, () => ({ pressed: false })), axes: [1] };
    pad.buttons[0].pressed = true; w.navigator.getGamepads = () => [pad];
    const input = new w.BARCODE.ActionInput(); input.reset();
    assert(!input.update().jump.pressed); assert(!input.state.move_right.held, 'held gamepad actions require release after menu/reset');
    pad.axes[0] = 0; pad.buttons[0].pressed = false; input.update();
    pad.buttons[0].pressed = true; assert(input.update().jump.pressed, 'fresh gamepad input works');
  }
  {
    const { w, context } = createRig(); const docListeners = {};
    w.document.addEventListener = (type, callback) => (docListeners[type] ||= []).push(callback);
    load(context, 'src/game/pause-menu.js'); load(context, 'src/engine/audio.js');
    const audio = new w.AudioSystem(); w.audioSystem = audio;
    for (const name of ['musicVolumeGain', 'musicGain', 'sfxGain', 'rhythmGain']) audio[name] = { gain: { value: 1 } };
    audio.musicGain.gain.value = 0.8;
    w.BARCODE.Preferences.set('music', 0.25); w.BARCODE.Preferences.set('sfx', 0);
    assert.strictEqual(audio.musicVolumeGain.gain.value, 0.25); assert.strictEqual(audio.musicGain.gain.value, 0.8, 'user volume preserves the existing stem mix');
    assert.strictEqual(audio.sfxGain.gain.value, 0); assert.strictEqual(audio.rhythmGain.gain.value, 0);
    let resumes = 0;
    audio.context = { state: 'suspended', resume: async () => { resumes++; } };
    docListeners.DOMContentLoaded[0]();
    w.gameState.paused = true; await docListeners.mousedown[0](); await docListeners.keydown[0]();
    assert.strictEqual(resumes, 0, 'ordinary menu gestures cannot wake paused audio');
    w.gameState.paused = false; await docListeners.mousedown[0](); assert.strictEqual(resumes, 1, 'unpaused autoplay recovery remains available');
  }
  {
    const rig = createRig(), { w, p, context } = rig;
    load(context, 'src/game/combat-fx.js');
    load(context, 'src/game/lore-collection.js'); load(context, 'src/game/lost-data.js');
    const lost = new w.LostDataSystem(); w.lostDataSystem = lost; lost.player = w.player;
    rig.reachReady();
    w.rhythmSystem.combo = 23; w.rhythmSystem.hide(); w.rhythmSystem.show();
    assert.strictEqual(w.rhythmSystem.runBestCombo, 23, 'best combo spans Rhythm Mode entries');
    const scoreBefore = w.gameState.score;
    const fragment = { active: true, loreId: 'lore.l01.03', position: { x: 3100, y: 250 } };
    lost.collectFragment(fragment); assert.strictEqual(w.gameState.score, scoreBefore + 500);
    w.gameState.gameOver = true; w.gameState.running = false;
    assert(p.retryBossCheckpoint().ok);
    assert.strictEqual(w.rhythmSystem.runBestCombo, 23); assert.strictEqual(lost.getProgress().collected, 1);
    assert.strictEqual(w.gameState.score, scoreBefore + 500, 'post-checkpoint fragment points survive retry exactly once');
    assert(p.completeLevel()); assert(!p.completeLevel());
    const summary = copy(p.completion);
    assert.strictEqual(summary.bestCombo, 23); assert.strictEqual(summary.fragments, 1); assert.strictEqual(summary.score, scoreBefore + 500);
    w.gameState.score += 999; w.rhythmSystem.runBestCombo = 90;
    assert.strictEqual(p.getCompletionPresentation()[0].finalValue, summary.score, 'display reads the completed-run snapshot');
    w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {}; load(context, 'src/core/loop.js');
    w.renderGame = () => {}; w.lastTime = 0; w.gameLoop(100);
    assert.strictEqual(p.completion.elapsedMs, 100, 'actual RAF advances results after gameplay stops');
    w.gameState.paused = true; p.updateCompletionPresentation(500); assert.strictEqual(p.completion.elapsedMs, 100);
    w.gameState.paused = false; p.updateCompletionPresentation(5000);
    assert.deepStrictEqual(copy(p.getCompletionPresentation().map(r => r.value)), [summary.score, 23, 1]);
    assert(p.retryBossCheckpoint().ok); assert.strictEqual(p.completion, null);
    p.reset(); w.initGameState(); assert.strictEqual(lost.getProgress().collected, 0); assert.strictEqual(w.rhythmSystem.runBestCombo, 0); assert.strictEqual(w.gameState.score, 0);
  }
  console.log('Polish chunk 3: pause input/pointer ownership, persistence, audio pause, completed-run totals and retry/reset passed.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
