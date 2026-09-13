// Exercise the actual opening, frontend inputs and runtime handoff. Only DOM,
// image loading, device input and the clock/audio boundary are supplied here.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
function openingRig({ contextBudget = Infinity, contextUnavailable = false, realTutorial = false, fullscreen = false } = {}) {
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
  const canvasCalls = [];
  function node(tag = 'div') {
    return Object.assign(events(), { tag, tagName: tag.toUpperCase(), style: {}, children: [], classList: { add() {}, remove() {} },
      setAttribute(name, value) { this[name] = value; },
      getContext(type) {
        canvasCalls.push({ node: this, type });
        if (canvasCalls.length > contextBudget) throw new Error('Canvas context creation limit exceeded - possible infinite loop detected');
        return contextUnavailable ? null : ctx;
      },
      appendChild(child) { this.children.push(child); child.parentNode = this; },
      remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this); this.parentNode = null; }
    });
  }
  const gameCanvas = node('canvas'); gameCanvas.id = 'gameCanvas';
  const documentElement = node('html'), body = node('body');
  documentElement.appendChild(body); body.appendChild(gameCanvas);
  w.document = Object.assign(events(), { readyState: 'loading', body, documentElement, createElement: node,
    getElementById: id => id === 'gameCanvas' ? gameCanvas : null, querySelector: () => null });
  let pendingFullscreen = null;
  if (fullscreen) {
    w.document.fullscreenEnabled = true;
    for (const element of [documentElement, body, gameCanvas]) {
      element.requestFullscreen = () => new Promise((resolve, reject) => { pendingFullscreen = { element, resolve, reject }; });
    }
    w.document.exitFullscreen = () => {
      w.document.fullscreenElement = null; w.document.dispatch('fullscreenchange'); return Promise.resolve();
    };
  }
  const finishFullscreen = (denied = false) => {
    assert(pendingFullscreen, 'a user gesture requested fullscreen');
    const { element, resolve, reject } = pendingFullscreen; pendingFullscreen = null;
    if (denied) { reject(Object.assign(new Error('Fullscreen denied'), { name: 'NotAllowedError' })); return; }
    w.document.fullscreenElement = element; w.document.dispatch('fullscreenchange'); resolve();
  };
  // DOM fixture checks ancestry only. Real layout/hit-testing is a separate
  // browser check; canvas fallback children cannot be visible game overlays.
  const assertPresented = element => {
    assert(element, 'presentation exists');
    const ancestors = [];
    for (let node = element; node; node = node.parentNode) ancestors.push(node);
    assert(ancestors.includes(documentElement), 'presentation is attached');
    assert(!ancestors.some(node => node.style.display === 'none'), 'presentation is not inside a hidden element');
    assert(!ancestors.slice(1).some(node => node.tag === 'canvas'), 'presentation is not canvas fallback content');
    if (w.document.fullscreenElement) assert(ancestors.includes(w.document.fullscreenElement), 'presentation is within the fullscreen tree');
  };
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
  for (const file of ['src/core/fullscreen.js', 'src/core/action-input.js', 'src/core/gamepad-ui.js', 'src/core/input.js', 'src/engine/intro-sequence.js', 'src/engine/cutscene.js', 'src/core/runtime-lifecycle.js']) load(context, file);
  if (realTutorial) {
    load(context, 'src/game/hacking.js'); w.hackingSystem = new w.HackingSystem();
    load(context, 'src/game/tutorial.js'); w.tutorialSystem = new w.TutorialSystem();
    const startTutorial = w.tutorialSystem.startTutorial.bind(w.tutorialSystem);
    w.tutorialSystem.startTutorial = () => { calls.tutorialStarts++; startTutorial(); };
  }
  w.inputManager = new w.InputManager(); w.initCutscene();
  const scene = w.cutsceneSystem;
  const key = (value, type = 'keydown', repeat = false) => w.document.dispatch(type, { key: value, repeat });
  return { ...rig, scene, pad, key, advance, images, windowEvents, gameCanvas, canvasCalls, finishFullscreen, assertPresented };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
async function main() {
  for (const timing of ['before-intro', 'after-intro', 'denied']) {
    const { w, scene, advance, key, calls, gameCanvas, finishFullscreen, assertPresented } = openingRig({ fullscreen: true, realTutorial: true });
    const requested = w.fullscreenManager.enter().catch(error => error);
    if (timing === 'before-intro') finishFullscreen();
    const started = w.BARCODE.RuntimeLifecycle.start(); await settle();
    assert.strictEqual(gameCanvas.style.display, 'none');
    if (timing !== 'before-intro') finishFullscreen(timing === 'denied');
    await requested;
    assertPresented(scene.cutsceneContainer);
    assertPresented(scene.introCanvas);
    advance(300);
    scene.cutsceneContainer.dispatch('click'); assert.strictEqual(scene.currentImageIndex, 2);
    await w.fullscreenManager.exit(); assertPresented(scene.cutsceneContainer);
    const reentered = w.fullscreenManager.enter(); finishFullscreen(); await reentered;
    assertPresented(scene.cutsceneContainer);
    advance(300); key('Enter'); assert.strictEqual(scene.currentImageIndex, 3);
    key('s'); advance(5000); await started; advance(500);
    assertPresented(gameCanvas);
    assert.strictEqual(w.tutorialSystem.storyChapter, 0);
    assert(w.tutorialSystem.targetText.includes('Still with you'));
    assert.strictEqual(calls.tutorialStarts, 1); assert.strictEqual(calls.loopStarts, 1);
    assert.strictEqual(scene.cutsceneContainer, null, 'intro is removed after handoff');
    await w.BARCODE.RuntimeLifecycle.stop('fullscreen-check');
    assert.deepStrictEqual(calls.errors, []);
  }
  {
    // A restrictive host boundary exposes the former 20-per-second context
    // requests. It is a supplied guard, not a claim to emulate Makko itself.
    const { scene, advance, canvasCalls, images, key, calls } = openingRig({ contextBudget: 1 });
    scene.start();
    assert.strictEqual(images.length, 8);
    assert(images.every(image => image.url.startsWith('https://raw.githubusercontent.com/')));
    const abandonedLoads = images.map(image => image.onload);
    for (const image of [...images]) image.onerror(); // Public origin blocked: use repository paths.
    assert.strictEqual(images.length, 16);
    assert(images.slice(8).every(image => image.url.startsWith('assets/intro/')));
    for (const complete of abandonedLoads) complete();
    assert(scene.cutsceneImages.every(image => !image.loaded), 'stale public requests cannot settle bundled attempts');
    for (const image of images.slice(8)) image.onload();
    advance(120000); // Enough reading time to hit the reported failure many times before this repair.
    assert.strictEqual(canvasCalls.length, 1, 'painting and image completion reuse one acquired context');
    assert(scene.getDiagnostics().assets.every(image => image.status === 'ready' && image.source.startsWith('assets/intro/')));
    assert.strictEqual(scene.pendingImageLoads.size, 0); assert.strictEqual(images.length, 16);
    key('s'); advance(5000); assert(!scene.isPlaying()); scene.destroy();
    assert.deepStrictEqual(calls.errors, []);
  }
  {
    const { scene, advance, images, key, canvasCalls } = openingRig({ contextBudget: 1, contextUnavailable: true });
    scene.start(); advance(17000);
    assert.strictEqual(images.length, 16, 'each timed-out source gets one bounded attempt');
    assert(scene.getDiagnostics().assets.every(image => image.status === 'unavailable'));
    assert.strictEqual(scene.pendingImageLoads.size, 0);
    assert(scene.transcriptElement.textContent.includes('Leave the room noise in.'));
    key('Enter'); advance(300); assert.strictEqual(scene.currentImageIndex, 2);
    key('s'); advance(5000); assert(!scene.isPlaying());
    assert.strictEqual(canvasCalls.length, 1, 'a rejected context is not retried by the paint poll'); scene.destroy();
  }
  for (const skip of [false, true]) {
    const { w, p, scene, key, advance, calls } = openingRig({ realTutorial: true });
    const started = w.BARCODE.RuntimeLifecycle.start(); await settle();
    if (skip) { key('s'); advance(5000); }
    else while (scene.isPlaying()) { advance(300); key('Enter'); }
    await started;
    const tutorial = w.tutorialSystem;
    assert.strictEqual(calls.tutorialStarts, 1); assert.strictEqual(tutorial.storyChapter, 0);
    assert.strictEqual(tutorial.dialogue[0].speaker, 'cache');
    assert(tutorial.targetText.includes('Still with you'), 'the street answers the final open-channel line');
    assert(tutorial.dialogue.some(line => /Dead Air District/.test(line.text) && /jammed/.test(line.text)), 'skip players receive the local situation too');
    assert(!p.missionStarted, 'intro completion cannot bypass the playable tutorial');
    assert.deepStrictEqual(Array.from(tutorial.objectives, objective => objective.id), ['movement', 'jump']);
    const expectedObjectives = [['movement', 'jump'], ['combat'], ['rhythm_start', 'rhythm_combo'], ['hack_start', 'hack_complete']];
    for (let chapter = 0; chapter < 4; chapter++) {
      assert.strictEqual(tutorial.storyChapter, chapter);
      assert.deepStrictEqual(Array.from(tutorial.objectives, objective => objective.id), expectedObjectives[chapter]);
      assert(tutorial.dialogue.every(line => ['6bit', 'cache', 'dj', 'mac'].includes(line.speaker)));
      while (tutorial.currentDialogue < tutorial.dialogue.length - 1) {
        const before = tutorial.currentDialogue;
        tutorial.update(tutorial.targetText.length * tutorial.typingSpeed + 1); tutorial.handleSpacePress();
        assert.deepStrictEqual(calls.errors, []);
        assert(tutorial.currentDialogue > before, `Chapter ${chapter}, dialogue ${before} did not advance: ${tutorial.targetText}`);
      }
      tutorial.update(tutorial.targetText.length * tutorial.typingSpeed + 1);
      tutorial.handleSpacePress(); assert.strictEqual(tutorial.storyChapter, chapter, 'unfinished tasks keep the chapter closed');
      for (const objective of expectedObjectives[chapter]) tutorial.completeObjective(objective);
      advance(1000);
      assert.strictEqual(tutorial.storyChapter, chapter + 1, 'authored copy does not control objective completion');
      p.update(16); assert(!p.missionStarted);
    }
    assert.strictEqual(tutorial.storyChapter, 4);
    assert(tutorial.dialogue.some(line => /Twenty corrupted signals/.test(line.text)));
    assert(tutorial.dialogue.some(line => /Broadcast Jammer/.test(line.text)));
    while (tutorial.currentDialogue < tutorial.dialogue.length - 1) {
      const before = tutorial.currentDialogue;
      tutorial.update(tutorial.targetText.length * tutorial.typingSpeed + 1); tutorial.handleSpacePress();
      assert(tutorial.currentDialogue > before, `Final chapter dialogue ${before} did not advance`);
    }
    tutorial.update(tutorial.targetText.length * tutorial.typingSpeed + 1);
    tutorial.update(10000); p.update(16); assert(!p.missionStarted, 'the final crew line owns its full hold and fade');
    tutorial.update(2000); p.update(16);
    assert(p.missionStarted); assert.strictEqual(p.missionDefeats, 0, 'training kills never populate mission progress');
    scene.destroy();
  }
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
  console.log('Intro: fullscreen before/after startup, denied/exit/re-entry visibility, eight pages, keyboard/controller holds, release/focus/disconnect, caption discovery, tutorial/mission/audio handoff and cancellation passed.');
}
if (require.main === module) {
  const timeout = setTimeout(() => { console.error('Intro check did not settle its lifecycle promise.'); process.exit(1); }, 3000);
  main().then(() => clearTimeout(timeout), error => { clearTimeout(timeout); console.error(error); process.exitCode = 1; });
}
module.exports = { openingRig };
