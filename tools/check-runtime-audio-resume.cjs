#!/usr/bin/env node
'use strict';
// Production audio, transport, lifecycle, pause menu and the sole gameplay RAF.
// Only the browser clock/device/DOM and the scene body are host fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const flush = async () => { for (let n = 0; n < 20; n++) await Promise.resolve(); };

function fixture() {
  let now = 1000, next = 0;
  const timers = new Map(), raf = new Map(), requests = [], listeners = new Map();
  const calls = { updates: [], beatStarts: 0, titleShows: 0, pausedInput: 0 };
  const draw = new Proxy({ measureText: text => ({ width: text.length * 10 }) }, { get: (obj, key) => obj[key] || (() => {}) });
  const element = () => { const classes = new Set(); return { width: 1920, height: 1080, style: {},
    classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name) },
    getContext: () => draw, focus() {}, setAttribute() {}, addEventListener() {} }; };
  const elements = Object.fromEntries(['startOverlay', 'startButton', 'loadingIndicator', 'gameCanvas'].map(id => [id, element()]));
  const document = { readyState: 'loading', addEventListener(type, fn) {
    const list = listeners.get(type) || []; list.push(fn); listeners.set(type, list); }, getElementById: id => elements[id] || null,
    createElement: element, body: { appendChild() {} } };
  const context = { state: 'running', currentTime: 8, suspends: 0,
    async suspend() { this.suspends++; this.state = 'suspended'; },
    resume() { return new Promise((resolve, reject) => requests.push({
      resolve: () => { this.state = 'running'; resolve(); }, reject
    })); } };
  const window = { document, gameState: {}, BARCODE: {}, performance: { now: () => now },
    localStorage: { getItem: () => null },
    inputManager: { resetActionEdges() {}, update() {}, updatePausedInput() { calls.pausedInput++; } },
    titleScreen: { hide() {}, show() { calls.titleShows++; } } };
  const sandbox = { window, document, performance: window.performance,
    console: { log() {}, warn() {}, error() {} },
    setTimeout(fn, ms) { const id = ++next; timers.set(id, { fn, at: now + ms }); return id; },
    clearTimeout: id => timers.delete(id),
    setInterval() { throw new Error('unexpected interval owner'); }, clearInterval() {},
    requestAnimationFrame(fn) { const id = ++next; raf.set(id, fn); return id; },
    cancelAnimationFrame: id => raf.delete(id) };
  Object.assign(window, { setTimeout: sandbox.setTimeout, clearTimeout: sandbox.clearTimeout,
    requestAnimationFrame: sandbox.requestAnimationFrame, cancelAnimationFrame: sandbox.cancelAnimationFrame });
  vm.createContext(sandbox);
  for (const file of ['src/engine/music-profiles.js', 'src/engine/level-01-music-profile.js',
    'src/engine/music-transport.js', 'src/engine/audio.js', 'src/core/loop.js',
    'src/core/runtime-lifecycle.js', 'src/game/pause-menu.js'])
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
  const B = window.BARCODE, audio = window.audioSystem = new window.AudioSystem();
  audio.context = context;
  const beatStart = audio.startLayerBeatSync.bind(audio);
  audio.startLayerBeatSync = () => { calls.beatStarts++; return beatStart(); };
  B.MacCombatPreview = { active: false, phase: 'street', prepare() {},
    enter() { this.active = true; audio.layersStarted = true;
      B.MusicTransport.load('level-01.main'); B.MusicTransport.start({ sourceAnchorAudioSec: context.currentTime }); },
    dispose() { this.active = false; }, syncDialogueReadout() {}, draw() {},
    update(dt) { calls.updates.push(dt); } };
  return { window, B, audio, context, calls, requests, timers, raf, elements,
    async startPaused() { assert((await B.RuntimeLifecycle.start({ privatePreview: 'mac-firstslice' })).ok);
      assert((await B.RuntimeLifecycle.pause('fixture-pause')).ok); B.PauseMenu.sync(); assert.equal(raf.size, 1); },
    advance(ms) { now += ms;
      for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.fn(); } },
    installGestures() { vm.runInContext('setupAudioContextResume()', sandbox);
      // Consume the two existing bootstrap probes while deliberately paused.
      this.advance(2000); assert.equal(requests.length, 0); },
    gesture(type) { return Promise.all((listeners.get(type) || []).map(fn => fn())); },
    frame(ms = 16) { assert.equal(raf.size, 1, 'the existing owner has exactly one frame');
      now += ms; const [id, fn] = [...raf][0]; raf.delete(id); fn(now); },
    press(key) { B.PauseMenu.keyDown({ key, preventDefault() {} }); B.PauseMenu.keyUp({ key }); } };
}

async function pendingResume(r) {
  r.press('Enter');
  const result = r.B.RuntimeLifecycle.resume('join-native-menu-resume');
  await flush();
  assert.equal(r.B.PauseMenu.resumePending, true);
  assert.equal(r.B.RuntimeLifecycle.getSnapshot().transitionInFlight, true);
  assert.equal(r.audio.runtimeTimeouts.size, 1, 'one audio-owned deadline, no gameplay timer');
  assert.equal(r.raf.size, 1);
  return { result };
}

async function expireMac(r) {
  const pending = await pendingResume(r);
  r.advance(999); await flush();
  assert.equal(r.B.RuntimeLifecycle.getState(), 'paused'); assert.equal(r.B.PauseMenu.resumePending, true);
  r.advance(1); await flush();
  assert.equal(r.B.RuntimeLifecycle.getState(), 'running', 'never-resolving device cannot keep Mac paused');
  assert.equal(r.B.PauseMenu.resumePending, false, 'native menu controls are no longer locked');
  assert.equal(r.B.PauseMenu.open, false);
  assert.equal(r.B.RuntimeLifecycle.getSnapshot().transitionInFlight, false);
  assert.equal(r.audio.runtimeTimeouts.size, 0);
  assert.equal(r.timers.size, 0);
  assert.equal(r.window.isPaused, false);
  assert.equal(r.B.MusicTransport.getDiagnostics().running, false, 'silent combat does not invent an audio clock');
  const result = await pending.result;
  assert.equal(result.ok, true); assert.equal(result.audioDegraded, true);
  assert.equal(result.diagnostic.reason, 'resume-deferred');
  assert.equal(r.audio.getRuntimeDiagnostics().runtimeAudioResumeDeferred, true);
  r.frame(); assert.equal(r.calls.updates.at(-1), 16, 'resume resets paused frame time through its existing owner');
  assert.equal(r.raf.size, 1);
}

(async () => {
  let checked = 0;
  {
    const r = fixture(); await r.startPaused();
    const pending = await pendingResume(r);
    r.requests[0].resolve(); await flush();
    assert((await pending.result).ok); assert.equal(r.B.RuntimeLifecycle.getState(), 'running');
    assert.equal(r.audio.runtimeTimeouts.size, 0); assert.equal(r.timers.size, 0);
    assert.equal(r.B.PauseMenu.resumePending, false); assert.equal(r.calls.beatStarts, 1);
    assert.equal(r.B.MusicTransport.getDiagnostics().running, true); r.frame();
    assert.equal(r.calls.updates.at(-1), 16); checked++;
  }
  {
    const r = fixture(); await r.startPaused(); await expireMac(r);
    r.requests[0].resolve(); await flush();
    assert.equal(r.B.RuntimeLifecycle.getState(), 'running');
    assert.equal(r.B.MusicTransport.getDiagnostics().running, true);
    assert.equal(r.calls.beatStarts, 1); assert.equal(r.audio.runtimeAudioResume, null);
    assert.equal(r.audio.lastRuntimeAudioResume.reason, 'resumed'); checked++;
  }
  for (const action of ['pause', 'stop', 'title']) {
    const r = fixture(); await r.startPaused(); await expireMac(r);
    const result = action === 'title' ? await r.B.RuntimeLifecycle.returnToTitle({ source: 'fixture-title' }) :
      await r.B.RuntimeLifecycle[action]('fixture-' + action);
    assert(result.ok); r.requests[0].resolve(); await flush();
    assert.equal(r.B.RuntimeLifecycle.getState(), action === 'pause' ? 'paused' : 'idle');
    assert.equal(r.B.MusicTransport.getDiagnostics().running, false, `${action} cancels late transport recovery`);
    assert.equal(r.calls.beatStarts, 0, `${action} cancels late beat sync`);
    assert.equal(r.audio.runtimeAudioResume, null); assert.equal(r.timers.size, 0);
    assert.equal(r.raf.size, action === 'pause' ? 1 : 0);
    if (action === 'pause') assert.equal(r.context.state, 'suspended', 'late device activation respects the newer pause');
    if (action === 'title') { assert.equal(r.calls.titleShows, 1); assert.equal(r.elements.startOverlay.classList.contains('hidden'), false); }
    checked++;
  }
  for (const action of ['pause', 'stop', 'title']) {
    const r = fixture(); await r.startPaused(); const pending = await pendingResume(r);
    const result = action === 'title' ? await r.B.RuntimeLifecycle.returnToTitle({ source: 'fixture-pending-title' }) :
      await r.B.RuntimeLifecycle[action]('fixture-pending-' + action);
    assert(result.ok); await flush();
    assert.equal(r.B.PauseMenu.resumePending, false, `${action} releases pending controls immediately`);
    assert.equal(r.B.RuntimeLifecycle.getSnapshot().transitionInFlight, false);
    assert.equal(r.audio.runtimeTimeouts.size, 0); assert.equal(r.timers.size, 0);
    assert.equal((await pending.result).ok, false);
    r.requests[0].resolve(); await flush();
    assert.equal(r.B.RuntimeLifecycle.getState(), action === 'pause' ? 'paused' : 'idle');
    assert.equal(r.B.MusicTransport.getDiagnostics().running, false); assert.equal(r.calls.beatStarts, 0); checked++;
  }
  {
    const r = fixture(); await r.startPaused(); const pending = await pendingResume(r);
    r.advance(1000);
    assert((await r.B.RuntimeLifecycle.pause('fixture-pause-at-deadline')).ok);
    await flush();
    assert.equal((await pending.result).ok, false);
    assert.equal(r.B.RuntimeLifecycle.getState(), 'paused', 'pause wins even after audio deadline receipt has settled');
    assert.equal(r.B.PauseMenu.resumePending, false);
    r.requests[0].resolve(); await flush();
    assert.equal(r.B.MusicTransport.getDiagnostics().running, false); assert.equal(r.calls.beatStarts, 0);
    assert.equal(r.raf.size, 1); checked++;
  }
  {
    const r = fixture(); await r.startPaused(); const pending = await pendingResume(r);
    r.B.MacCombatPreview.active = false; r.advance(1000); await flush();
    assert.equal(r.B.RuntimeLifecycle.getState(), 'paused', 'degraded permission must still belong to Mac when accepted');
    assert.equal((await pending.result).diagnostic.reason, 'resume-requires-audio');
    assert.equal(r.B.PauseMenu.resumePending, false); assert.equal(r.audio.runtimeAudioResume, null);
    r.requests[0].resolve(); await flush();
    assert.equal(r.B.MusicTransport.getDiagnostics().running, false); assert.equal(r.calls.beatStarts, 0); checked++;
  }
  {
    const r = fixture(); await r.startPaused(); r.B.MacCombatPreview.active = false;
    const pending = await pendingResume(r); r.advance(1000); await flush();
    assert.equal(r.B.RuntimeLifecycle.getState(), 'paused', 'beat-dependent genres retain a fair frozen clock');
    assert.equal(r.B.PauseMenu.resumePending, false); assert.equal(r.B.RuntimeLifecycle.getSnapshot().transitionInFlight, false);
    assert.equal((await pending.result).diagnostic.reason, 'resume-timeout');
    const focus = r.B.PauseMenu.focus; r.press('ArrowUp'); assert.notEqual(r.B.PauseMenu.focus, focus, 'deadline restores usable menu input');
    r.B.PauseMenu.focus = focus; const retry = await pendingResume(r);
    r.requests[0].resolve(); await flush();
    assert.equal(r.context.state, 'running', 'stale completion cannot suspend a newer active resume');
    assert.equal(r.calls.beatStarts, 0);
    r.requests[1].resolve(); await flush(); assert((await retry.result).ok);
    assert.equal(r.B.RuntimeLifecycle.getState(), 'running'); assert.equal(r.calls.beatStarts, 1);
    assert.equal(r.audio.runtimeTimeouts.size, 0); assert.equal(r.raf.size, 1); checked++;
  }
  {
    const r = fixture(); await r.startPaused(); const pending = await pendingResume(r);
    await r.B.RuntimeLifecycle.stop('fixture-stop'); await flush(); await pending.result;
    assert((await r.B.RuntimeLifecycle.start({ privatePreview: 'mac-firstslice' })).ok);
    const generation = r.B.RuntimeLifecycle.getSnapshot().generation;
    const transportGeneration = r.B.MusicTransport.getDiagnostics().generation;
    r.requests[0].resolve(); await flush();
    assert.equal(r.B.RuntimeLifecycle.getState(), 'running');
    assert.equal(r.B.RuntimeLifecycle.getSnapshot().generation, generation);
    assert.equal(r.B.MusicTransport.getDiagnostics().generation, transportGeneration, 'old audio receipt cannot alter a fresh session');
    assert.equal(r.calls.beatStarts, 0); assert.equal(r.raf.size, 1); checked++;
  }
  {
    const r = fixture(); await r.startPaused(); r.installGestures(); await expireMac(r);
    const gesture = r.gesture('keydown'); await flush();
    assert.equal(r.requests.length, 2, 'fresh native gesture retries the delayed device through the audio owner');
    assert.equal(r.audio.runtimeTimeouts.size, 1);
    assert((await r.B.RuntimeLifecycle.pause('fixture-pause-after-gesture')).ok);
    await gesture; r.requests[1].resolve(); r.requests[0].resolve(); await flush();
    assert.equal(r.context.state, 'suspended'); assert.equal(r.B.RuntimeLifecycle.getState(), 'paused');
    assert.equal(r.B.MusicTransport.getDiagnostics().running, false); assert.equal(r.calls.beatStarts, 0);
    assert.equal(r.timers.size, 0); assert.equal(r.raf.size, 1); checked++;
  }
  {
    const r = fixture(); await r.startPaused(); r.installGestures(); await expireMac(r);
    const gesture = r.gesture('keydown'); await flush();
    r.requests[1].resolve(); await gesture; await flush();
    assert.equal(r.B.MusicTransport.getDiagnostics().running, true); assert.equal(r.calls.beatStarts, 1);
    r.requests[0].resolve(); await flush();
    assert.equal(r.calls.beatStarts, 1, 'original timed-out native promise cannot start beat sync twice');
    assert.equal(r.timers.size, 0); assert.equal(r.raf.size, 1); checked++;
  }
  {
    const r = fixture(); await r.startPaused(); r.installGestures();
    r.context.resume = async function() { this.state = 'running'; };
    assert((await r.B.RuntimeLifecycle.resume('fixture-immediate-resume')).ok);
    r.B.MacCombatPreview.active = false; r.context.state = 'suspended';
    r.context.resume = function() { return new Promise(resolve => r.requests.push({ resolve: () => { this.state = 'running'; resolve(); } })); };
    const gesture = r.gesture('keydown'); await flush();
    assert((await r.B.RuntimeLifecycle.pause('fixture-legacy-gesture-pause')).ok);
    r.requests[0].resolve(); await gesture; await flush();
    assert.equal(r.context.state, 'suspended', 'legacy context-only gesture also respects a newer pause');
    assert.equal(r.B.MusicTransport.getDiagnostics().running, false); assert.equal(r.calls.beatStarts, 1); checked++;
  }
  {
    const r = fixture(); await r.startPaused(); const pending = await pendingResume(r);
    r.requests[0].reject(new Error('audio permission denied')); await flush();
    assert.equal((await pending.result).audioDegraded, true);
    assert.equal(r.B.RuntimeLifecycle.getState(), 'running'); assert.equal(r.B.PauseMenu.resumePending, false);
    assert.equal(r.timers.size, 0); assert.equal(r.calls.beatStarts, 0); checked++;
  }
  console.log(`PASS bounded runtime audio resume (${checked} production owner scenarios)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
