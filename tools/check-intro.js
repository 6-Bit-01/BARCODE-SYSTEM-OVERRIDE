// Exercise the actual opening, frontend inputs and runtime handoff. Only DOM,
// image loading, device input and the clock/audio boundary are supplied here.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
function openingRig() {
  const rig = createRig(), { w, context, timers, calls } = rig;
  const events = () => ({ listeners: new Map(),
    addEventListener(type, fn) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(fn); },
    removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); },
    dispatch(type, extras = {}) {
      const event = { type, key: '', repeat: false, preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; }, ...extras };
      for (const fn of [...(this.listeners.get(type) || [])]) fn(event);
      return event;
    }
  });
  const ctx = new Proxy({ measureText: text => ({ width: text.length * 17 }) }, { get: (target, key) => target[key] || (() => {}) });
  function node(tag = 'div') {
    return Object.assign(events(), { tag, style: {}, children: [], classList: { add() {}, remove() {} },
      setAttribute(name, value) { this[name] = value; }, getContext: () => ctx,
      appendChild(child) { this.children.push(child); child.parentNode = this; },
      remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; }
    });
  }
  const gameCanvas = node('canvas'); gameCanvas.id = 'gameCanvas';
  w.document = Object.assign(events(), { readyState: 'loading', body: node(), createElement: node,
    getElementById: id => id === 'gameCanvas' ? gameCanvas : null, querySelector: () => null });
  const windowEvents = events();
  w.addEventListener = windowEvents.addEventListener.bind(windowEvents);
  w.removeEventListener = windowEvents.removeEventListener.bind(windowEvents);
  const images = [];
  w.Image = class { constructor() { images.push(this); } set src(value) { this.url = value; } };
  let intervalId = 100000;
  w.setInterval = (fn, ms) => { const id = ++intervalId; timers.set(id, { fn, at: w.Date.now() + ms, interval: ms }); return id; };
  w.clearInterval = id => timers.delete(id);
  function advance(ms) {
    for (let elapsed = 0; elapsed < ms;) {
      const step = Math.min(50, ms - elapsed); elapsed += step; rig.tick(step);
      for (const [id, timer] of [...timers]) {
        if (!timers.has(id) || timer.at > w.Date.now()) continue;
        if (timer.interval) timer.at += timer.interval; else timers.delete(id);
        timer.fn();
      }
    }
  }
  const pad = { connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  w.navigator.getGamepads = () => [pad];
  calls.introStarts = 0; calls.introStops = 0; calls.backgroundStarts = 0; calls.tutorialStarts = 0; calls.fades = [];
  w.audioSystem.playCutsceneMusic = () => {
    calls.introStarts++;
    w.audioSystem.cutsceneSource = {};
    w.audioSystem.cutsceneGain = { gain: { value: 1, exponentialRampToValueAtTime(value, time) { calls.fades.push({ value, time }); } } };
  };
  w.audioSystem.stopCutsceneMusic = () => { calls.introStops++; w.audioSystem.cutsceneSource = null; };
  w.audioSystem.startMusicSystem = () => { calls.musicStarts++; return { ok: true, transport: { status: 'ok', running: true } }; };
  w.audioSystem.startBackgroundRhythmIfTransportRunning = () => { calls.backgroundStarts++; };
  w.tutorialSystem.active = true; w.tutorialSystem.completed = false;
  w.tutorialSystem.startTutorial = () => { calls.tutorialStarts++; };
  for (const file of ['src/core/action-input.js', 'src/core/gamepad-ui.js', 'src/core/input.js', 'src/engine/intro-sequence.js', 'src/engine/cutscene.js', 'src/core/runtime-lifecycle.js']) load(context, file);
  w.inputManager = new w.InputManager(); w.initCutscene();
  const scene = w.cutsceneSystem;
  const key = (value, type = 'keydown', repeat = false) => w.document.dispatch(type, { key: value, repeat });
  return { ...rig, scene, pad, key, advance, images, windowEvents, gameCanvas };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
async function main() {
  {
    const { w, p, calls, scene, key, advance, gameCanvas } = openingRig();
    const started = w.BARCODE.RuntimeLifecycle.start(); await settle();
    assert(scene.isPlaying()); assert.strictEqual(gameCanvas.style.display, 'none');
    assert.strictEqual(calls.loopStarts, 0); assert.strictEqual(calls.tutorialStarts, 0); assert(!p.missionStarted);
    assert.strictEqual(scene.start(), scene.startPromise, 'repeated start joins the same opening');
    assert.strictEqual(calls.introStarts, 1);
    const pressed = key('s'); assert(pressed.prevented && pressed.stopped);
    advance(2500); key('s', 'keydown', true);
    assert.strictEqual(scene.skipHoldProgress, 0.5, 'S survives controller polling and keyboard repeat');
    advance(2450); assert(scene.isPlaying()); advance(50); await started;
    assert(!scene.isPlaying()); assert.strictEqual(calls.tutorialStarts, 1); assert.strictEqual(calls.loopStarts, 1);
    assert.strictEqual(gameCanvas.style.display, 'block'); assert(!p.missionStarted);
    assert.strictEqual(calls.fades.length, 1); assert.strictEqual(calls.musicStarts, 0);
    advance(3950); assert.strictEqual(calls.musicStarts, 0); advance(50);
    assert.strictEqual(calls.musicStarts, 1); assert.strictEqual(calls.introStops, 1); assert.strictEqual(calls.backgroundStarts, 1);
    scene.skipAllCutscene(); advance(1000); assert.strictEqual(calls.musicStarts, 1, 'completion cannot duplicate audio startup');
    w.tutorialSystem.active = false; w.tutorialSystem.completed = true; p.update(16);
    assert(p.missionStarted, 'no second story scene between tutorial and mission');
    assert.deepStrictEqual(calls.errors, []);
  }
  {
    const { w, scene, key, advance, pad, windowEvents } = openingRig();
    scene.start(); advance(100);
    key('s'); advance(2000); key('s', 'keyup'); advance(4000); assert(scene.isPlaying());
    key('s'); advance(1000); pad.buttons[1].pressed = true; advance(50);
    key('s', 'keyup'); advance(4950); assert(scene.isPlaying(), 'B must complete its own five seconds');
    advance(50); assert(!scene.isPlaying()); scene.destroy();
    scene.start(); advance(100); key('s'); advance(1000);
    w.navigator.getGamepads = () => []; advance(3000);
    assert(scene.isSkipHoldActive, 'pad disconnect cannot cancel keyboard');
    windowEvents.dispatch('blur'); advance(6000); assert(scene.isPlaying(), 'focus loss cancels unattended hold');
    key('s'); advance(1000); w.document.hidden = true; w.document.dispatch('visibilitychange'); advance(6000);
    assert(scene.isPlaying()); scene.destroy();
  }
  {
    const { w, scene, pad, advance, key, calls } = openingRig();
    scene.start(); advance(300);
    pad.buttons[0].pressed = true; advance(50); assert.strictEqual(scene.currentImageIndex, 2);
    advance(1000); assert.strictEqual(scene.currentImageIndex, 2, 'held A advances once');
    pad.buttons[0].pressed = false; advance(50);
    const seen = [w.BARCODE.IntroSequence.panels[0].beat];
    while (scene.isPlaying()) {
      const index = scene.currentImageIndex - 1;
      seen.push(w.BARCODE.IntroSequence.panels[index].beat);
      if (index === 5) {
        pad.buttons[14].pressed = true; advance(50); pad.buttons[14].pressed = false; advance(50);
        assert(w.BARCODE.IntroSequence.inspectedGutter);
      }
      advance(300); key(' ', 'keydown', true); assert.strictEqual(scene.currentImageIndex - 1, index);
      key(' ');
    }
    assert.deepStrictEqual([...new Set(seen)], ['O1', 'O2', 'O3', 'O4', 'O5']);
    assert.strictEqual(scene.currentImageIndex, 8, 'all eight captions are reachable with no orphan slide');
    assert(w.BARCODE.IntroSequence.inspectedGutter, 'caption setup remains available for the results callback');
    assert.strictEqual(calls.fades.length, 1);
    scene.destroy(); scene.start(); assert(!w.BARCODE.IntroSequence.inspectedGutter, 'fresh opening clears run discovery'); scene.destroy();
  }
  {
    const { w, scene, images, advance, calls } = openingRig();
    const started = w.BARCODE.RuntimeLifecycle.start(); await settle();
    const lateLoads = images.map(image => image.onload);
    await w.BARCODE.RuntimeLifecycle.stop('intro-cancel');
    const result = await started;
    assert.strictEqual(result.status, 'stale-start');
    for (const complete of lateLoads) complete(); advance(15000);
    assert.strictEqual(calls.tutorialStarts, 0); assert.strictEqual(calls.loopStarts, 0); assert.strictEqual(calls.musicStarts, 0);
    const diagnostic = scene.getDiagnostics();
    assert(!diagnostic.active && !diagnostic.hasContainer && !diagnostic.listenersAttached);
    assert.strictEqual(diagnostic.timeouts, 0); assert.strictEqual(diagnostic.intervals, 0); assert.strictEqual(diagnostic.imageLoads, 0);
  }
  console.log('Intro: eight-page opening before tutorial, keyboard/controller hold ownership, release/focus/disconnect, repeat latch, caption discovery, audio handoff and cancellation passed.');
}
if (require.main === module) {
  const timeout = setTimeout(() => { console.error('Intro check did not settle its lifecycle promise.'); process.exit(1); }, 3000);
  main().then(() => clearTimeout(timeout), error => { clearTimeout(timeout); console.error(error); process.exitCode = 1; });
}
module.exports = { openingRig };
