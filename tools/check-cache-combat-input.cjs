#!/usr/bin/env node
// Exercise the real shared input owners; this fixture adds no road mechanics.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));
const storageKey = 'barcode.controller.v1';
const roadActions = ['road_attack', 'road_turbo', 'road_defend', 'road_disrupt'];
const levelActions = ['jump', 'primary', 'interact', 'rhythm_mode', 'inspect'];

function rig(saved) {
  const listeners = {}, store = new Map(), routed = [];
  if (saved) store.set(storageKey, JSON.stringify(saved));
  const pad = { index: 0, id: 'DualSense standard fixture', mapping: 'standard', connected: true,
    axes: [0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
  const w = { console, Date, Math, performance: { now: () => 1000 },
    navigator: { getGamepads: () => [pad] },
    localStorage: { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) },
    document: { readyState: 'loading', addEventListener() {} },
    addEventListener(type, handler) { (listeners[type] ||= []).push(handler); },
    removeEventListener() {}, gameState: { running: true, paused: false, gameOver: false },
    isRunning: true, isPaused: false, audioSystem: { context: { currentTime: 2 } } };
  w.window = w;
  const context = vm.createContext(w);
  function load(relative) { vm.runInContext(fs.readFileSync(path.join(root, relative), 'utf8'), context, { filename: relative }); }
  load('src/core/gamepad-ui.js'); load('src/core/action-input.js'); load('src/core/input.js');
  const B = w.BARCODE;
  B.CacheRoadProof = { active: true, status: 'playing', introMs: null,
    keyDown() { return false; }, handleActions(actions) { routed.push(plain(actions)); } };
  const manager = w.inputManager = new w.InputManager();
  function frame(options) { manager.update(options); return manager.actionInput.state; }
  function button(index, pressed, value = pressed ? 1 : 0) { pad.buttons[index] = { pressed, value }; }
  function key(type, key, repeat = false) { for (const fn of listeners[type] || []) fn({ key, repeat, timeStamp: 1000, preventDefault() {} }); }
  frame();
  return { w, B, pad, manager, listeners, store, routed, load, frame, button, key };
}

// All face pieces can arrive while all four skills are held: no chord replaces
// or consumes a face input, and holding a trigger does not generate repeats.
{
  const r = rig();
  for (let i = 0; i < 8; i++) r.button(i, true);
  let state = r.frame();
  for (const action of ['road_a', 'road_b', 'road_x', 'road_y', ...roadActions, 'road_echo']) {
    assert(state[action].pressed && state[action].held, `${action} retains an independent edge`);
    assert.equal(state[action].presses.length, 1);
  }
  assert.equal(r.routed.length, 2, 'one shared route per update');
  state = r.frame();
  for (const action of roadActions) assert(!state[action].pressed && state[action].held, 'held skills do not repeat');
  for (let i = 0; i < 8; i++) r.button(i, false);
  state = r.frame();
  for (const action of roadActions) assert(state[action].released && !state[action].held, 'release has one edge');
  state = r.frame();
  for (const action of roadActions) assert(!state[action].released, 'release does not repeat');
  assert.equal(r.listeners.keydown.length, 1); assert.equal(r.listeners.keyup.length, 1);
  assert.equal(r.manager.actionInput.listenerCount, 0, 'InputManager remains the keyboard owner');
}

// Standard analog triggers share one threshold with UI polling and respect
// release-to-arm across the actual shared owner's pause/reset boundary.
{
  const r = rig();
  r.button(7, false, 0.49); assert(!r.frame().road_defend.held);
  r.button(7, false, 0.5); assert(r.frame().road_defend.pressed);
  assert(r.B.GamepadUI.read().b7, 'UI observes the same analog trigger');
  r.button(7, false, 0.95); assert(!r.frame().road_defend.pressed);
  r.w.isPaused = true; r.w.gameState.paused = true;
  r.manager.updatePausedInput();
  assert(!r.manager.actionInput.held('road_defend'));
  r.manager.resetActionEdges();
  r.w.isPaused = false; r.w.gameState.paused = false;
  let state = r.frame();
  assert(!state.road_defend.held && !state.road_defend.pressed, 'held trigger stays blocked after resume');
  r.button(7, false, 0.49); r.frame();
  r.button(7, false, 0.75); assert(r.frame().road_defend.pressed, 'fresh trigger edge rearms');
  r.button(7, false, 0.2); assert(r.frame().road_defend.released);
  r.button(6, false, 0.75); assert(r.frame().road_disrupt.pressed);
  r.button(6, false, 0.2); assert(r.frame().road_disrupt.released);
}

// Keyboard defaults leave the piece diamond, legacy Echo and Turbo available.
// A tap wholly between frames retains both its press sample and release edge.
{
  const r = rig();
  const bindings = [['f', 'road_attack'], ['g', 'road_defend'], ['v', 'road_disrupt'],
    [' ', 'road_turbo'], ['h', 'road_echo'], ['k', 'road_a'], ['l', 'road_b'], ['j', 'road_x'], ['i', 'road_y']];
  for (const [key] of bindings) r.key('keydown', key);
  let state = r.frame();
  for (const [, action] of bindings) assert(state[action].pressed && state[action].held, action);
  r.key('keydown', 'f', true); assert(!r.frame().road_attack.pressed);
  for (const [key] of bindings) r.key('keyup', key);
  state = r.frame(); for (const [, action] of bindings) assert(state[action].released, action);
  r.key('keydown', 'g'); r.key('keyup', 'g'); state = r.frame();
  assert(state.road_defend.pressed && state.road_defend.released && !state.road_defend.held);
  assert.equal(state.road_defend.presses[0].audioTimeSec, 2);
  r.manager.actionInput.remap('road_attack', ['u']);
  r.key('keydown', 'f'); assert(!r.frame().road_attack.pressed); r.key('keyup', 'f');
  r.key('keydown', 'u'); assert(r.frame().road_attack.pressed); r.key('keyup', 'u'); r.frame();
}

// Road remaps swap only road skills and cannot steal face pieces or Level 1.
{
  const r = rig(), settings = r.B.ControllerSettings;
  const before = Object.fromEntries(levelActions.map(a => [a, settings.bindings[a]]));
  assert(settings.bind('road_attack', 7));
  assert.equal(settings.bindings.road_attack, 7); assert.equal(settings.bindings.road_defend, 5);
  assert.deepEqual(Object.fromEntries(levelActions.map(a => [a, settings.bindings[a]])), before);
  assert(!settings.bind('road_disrupt', 0)); assert(!settings.bind('road_turbo', 1)); assert(!settings.bind('road_defend', 9));
  assert.deepEqual(plain(settings.allowedButtons('road_attack')), [4, 5, 6, 7]);
  r.button(7, true); let state = r.frame(); assert(state.road_attack.pressed && !state.road_defend.pressed);
  r.button(7, false); r.frame(); r.button(5, true); state = r.frame();
  assert(state.road_defend.pressed && state.road_echo.pressed, 'legacy Echo remains R1 independent of new remaps');
  assert.equal(settings.prompt('road_defend', 'G'), 'R1');
  const roads = Object.fromEntries(roadActions.map(a => [a, settings.bindings[a]]));
  assert(settings.bind('inspect', 6));
  assert.deepEqual(Object.fromEntries(roadActions.map(a => [a, settings.bindings[a]])), roads, 'Level 1 remaps cannot move road skills');
  r.B.CacheRoadProof.active = false; r.button(5, false); r.button(6, false); r.frame();
  let inspected = 0; r.B.stageFX = { inspect() { inspected++; } };
  r.button(6, true); r.frame(); assert.equal(inspected, 1, 'existing Level 1 inspect remains routed');
}

// v1/v2 records gain the new defaults; v3 preserves explicit mappings and
// old preferences. Corrupt/newer road layouts cannot reset good Level 1 data.
{
  const legacy = { jump: 0, primary: 2, interact: 3, rhythm_mode: 4, inspect: 5 };
  const preferences = { deadzone: 0.32, labels: 'xbox', vibration: false };
  for (const version of [undefined, 2]) {
    const r = rig({ ...preferences, layoutVersion: version, bindings: legacy });
    const c = r.B.ControllerSettings;
    assert.equal(c.bindings.primary, version === 2 ? 2 : 0);
    assert.deepEqual(roadActions.map(a => c.bindings[a]), [5, 4, 7, 6]);
    assert.equal(c.deadzone, 0.32); assert.equal(c.labels, 'xbox'); assert(!c.vibration);
    c.bind('road_attack', 6);
    const saved = plain(c.bindings); assert.equal(JSON.parse(r.store.get(storageKey)).layoutVersion, 3);
    r.load('src/core/gamepad-ui.js'); assert.deepEqual(plain(r.B.ControllerSettings.bindings), saved);
  }
  for (const version of [3, 99]) {
    const r = rig({ ...preferences, layoutVersion: version, bindings: { ...legacy,
      road_attack: 0, road_turbo: 4, road_defend: 7, road_disrupt: 6 } });
    assert.equal(r.B.ControllerSettings.bindings.primary, 2);
    assert.deepEqual(roadActions.map(a => r.B.ControllerSettings.bindings[a]), [5, 4, 7, 6]);
  }
  const r = rig({ ...preferences, layoutVersion: 3, bindings: { ...legacy,
    road_attack: 6, road_turbo: 7, road_defend: 4, road_disrupt: 5 } });
  assert.deepEqual(roadActions.map(a => r.B.ControllerSettings.bindings[a]), [6, 7, 4, 5]);
  assert.equal(r.B.ControllerSettings.bindings.primary, 2, 'explicit Square mapping survives version3');
  r.B.ControllerSettings.restore(); assert.deepEqual(roadActions.map(a => r.B.ControllerSettings.bindings[a]), [5, 4, 7, 6]);
}

console.log('PASS: combat controls, simultaneous face inputs, trigger edges/pause release, isolated remaps and controller preference migration');
