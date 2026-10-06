#!/usr/bin/env node
'use strict';
// Real Mac wrapper, combat/story, shared lifecycle/frame/input and touch owners.
// The DOM, image decoding, Canvas operations and audio device are host stubs;
// health, encounters, choices and action routing are never imitated or patched.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));
class EventTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, handler) { const list = this.listeners.get(type) || []; list.push(handler); this.listeners.set(type, list); }
  removeEventListener(type, handler) { this.listeners.set(type, (this.listeners.get(type) || []).filter(h => h !== handler)); }
  dispatchEvent(event) {
    event.target ||= this; event.currentTarget = this;
    event.preventDefault ||= () => { event.defaultPrevented = true; };
    event.stopPropagation ||= () => { event.propagationStopped = true; };
    for (const handler of [...this.listeners.get(event.type) || []]) handler.call(this, event);
    if (event.bubbles && !event.propagationStopped) this.parentNode?.dispatchEvent(event);
    return !event.defaultPrevented;
  }
}
class Element extends EventTarget {
  constructor(tag, doc) {
    super(); this.tagName = tag.toUpperCase(); this.ownerDocument = doc; this.children = [];
    this.style = {setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; }};
    this.dataset = {}; this.attributes = {}; this.className = ''; this.hidden = false; this.disabled = false;
    this.captured = new Set();
    this.classList = {add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter(n => !names.includes(n)).join(' '); },
      contains: name => this.className.split(/\s+/).includes(name),
      toggle: (name, force) => { const wanted = force ?? !this.classList.contains(name); wanted ? this.classList.add(name) : this.classList.remove(name); return wanted; }};
  }
  get textContent() { return (this._text || '') + this.children.map(c => c.textContent).join(''); }
  set textContent(value) { this._text = String(value); for (const c of this.children) c.parentNode = null; this.children = []; }
  appendChild(child) { child.parentNode?.removeChild?.(child); child.parentNode = this; this.children.push(child); return child; }
  append(...children) { children.forEach(c => this.appendChild(c)); }
  removeChild(child) { this.children = this.children.filter(c => c !== child); child.parentNode = null; return child; }
  remove() { this.parentNode?.removeChild(this); }
  setAttribute(key, value) { this.attributes[key] = String(value); if (key === 'id') this.id = String(value);
    if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; }
  getAttribute(key) { return key === 'id' ? this.id ?? null : key.startsWith('data-')
    ? this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ?? null : this.attributes[key] ?? null; }
  matches(selector) { if (selector.startsWith('#')) return this.id === selector.slice(1); if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    const attr = selector.match(/^\[([\w-]+)\]$/); return attr ? this.getAttribute(attr[1]) !== null : this.tagName.toLowerCase() === selector; }
  closest(selector) { return this.matches(selector) ? this : this.parentNode?.closest?.(selector) || null; }
  contains(child) { return child === this || this.children.some(c => c.contains(child)); }
  querySelectorAll(selector) { return this.children.flatMap(c => [...(c.matches(selector) ? [c] : []), ...c.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  setPointerCapture(id) { this.captured.add(id); }
  releasePointerCapture(id) { this.captured.delete(id); }
  hasPointerCapture(id) { return this.captured.has(id); }
  focus() { this.ownerDocument.activeElement = this; }
  click() { if (!this.disabled) this.dispatchEvent({type: 'click', bubbles: true, detail: 0}); }
  getBoundingClientRect() { return {left: 20, top: 600, width: 140, height: 140, right: 160, bottom: 740}; }
}
function rig({touch = false, initAudio} = {}) {
  const work = {raf: 0, timers: 0, intervals: 0, canvases: 0, writes: [], profiles: [], audio: []};
  let now = 1000, nextRaf = 0; const scheduled = new Map(), pads = [];
  const doc = new EventTarget(); doc.readyState = 'loading'; doc.hidden = false;
  const ctx = canvas => new Proxy({canvas, measureText: text => ({width: String(text).length * 12}),
    getTransform: () => ({a: 1, b: 0, c: 0, d: 1, e: 0, f: 0})}, {get(obj, key) { return key in obj ? obj[key] : () => {}; }});
  doc.createElement = tag => { const e = new Element(tag, doc); if (tag === 'canvas') { work.canvases++; e.getContext = () => e.context ||= ctx(e); } return e; };
  doc.documentElement = doc.createElement('html'); doc.body = doc.createElement('body'); doc.body.parentNode = doc;
  doc.documentElement.appendChild(doc.body);
  doc.getElementById = id => doc.documentElement.querySelector('#' + id);
  doc.querySelector = s => doc.documentElement.querySelector(s); doc.querySelectorAll = s => doc.documentElement.querySelectorAll(s);
  for (const id of ['startOverlay', 'loadingIndicator', 'startButton', 'continueButton', 'settingsButton', 'gameCanvas']) {
    const e = doc.createElement(id === 'gameCanvas' ? 'canvas' : id.endsWith('Button') ? 'button' : 'div');
    e.id = id; if (id === 'continueButton') e.hidden = true; if (id === 'gameCanvas') { e.width = 1920; e.height = 1080; } doc.body.appendChild(e);
  }
  const win = new EventTarget();
  Object.assign(win, {document: doc, console, Math, Date, Map, Set, URLSearchParams,
    location: {search: '?preview=mac-firstslice'}, innerWidth: 390, innerHeight: 844,
    performance: {now: () => now}, navigator: {maxTouchPoints: touch ? 5 : 0, getGamepads: () => pads},
    matchMedia: query => ({matches: touch && /coarse|hover:\s*none/.test(query), addEventListener() {}, removeEventListener() {}}),
    localStorage: {getItem() { return null; }, setItem(key, value) { work.writes.push([key, value]); }, removeItem(key) { work.writes.push([key, null]); }},
    gameState: {running: false, paused: false, gameOver: false, victory: false}, isRunning: false, isPaused: false,
    requestAnimationFrame(callback) { work.raf++; const handle = ++nextRaf; scheduled.set(handle, callback); return handle; },
    cancelAnimationFrame(handle) { scheduled.delete(handle); },
    setTimeout() { work.timers++; throw Error('Unexpected timer owner in preview integration'); }, clearTimeout() {},
    setInterval() { work.intervals++; throw Error('Unexpected interval owner in preview integration'); }, clearInterval() {},
    Image: class {async decode() {
      const data = fs.readFileSync(path.join(root, this.src));
      if (data.subarray(1, 4).toString() === 'PNG') {
        this.width = data.readUInt32BE(16); this.height = data.readUInt32BE(20); return;
      }
      assert.equal(data.toString('ascii',8,12),'WEBP');
      for (let offset=12; offset+8<=data.length;) {
        const kind=data.toString('ascii',offset,offset+4),size=data.readUInt32LE(offset+4),start=offset+8;
        if(kind==='VP8X'){this.width=1+data.readUIntLE(start+4,3);this.height=1+data.readUIntLE(start+7,3);return;}
        if(kind==='VP8L'){const bits=data.readUInt32LE(start+1);this.width=1+(bits&0x3fff);this.height=1+((bits>>>14)&0x3fff);return;}
        if(kind==='VP8 '){this.width=data.readUInt16LE(start+6)&0x3fff;this.height=data.readUInt16LE(start+8)&0x3fff;return;}
        offset=start+size+(size&1);
      }
      assert.fail('Native image dimensions unavailable: '+this.src);
    }},
    fetch: async url => ({ok: true, json: async () => JSON.parse(fs.readFileSync(path.join(root, url), 'utf8').replace(/^\uFEFF/, ''))}),
    titleScreen: {hide() {}, show() {}},
    initAudio: initAudio || (async () => { work.audio.push('init'); }),
    audioSystem: {context: {currentTime: 2}, layersStarted: false,
      getOutputAudioTime: t => t, getContextState: () => 'running',
      stopRuntimeAudio() { this.layersStarted = false; work.audio.push('stop'); return {ok: true}; },
      prepareActiveMusicProfile: async () => ({ok: true}),
      startRuntimeGameplayMusic() { this.layersStarted = true; work.audio.push('start'); return {ok: true}; },
      pauseRuntimeAudio: async () => ({ok: true}), resumeRuntimeAudio: async () => ({ok: true}),
      playSound: name => work.audio.push(name), updateLayers() {}, setMusicVolume() {}, setSFXVolume() {}, setRhythmVolume() {}},
    player: {setRunHeld() {}}});
  win.window = win; doc.defaultView = win; doc.parentNode = win;
  const context = vm.createContext(win), load = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
  load('src/core/gamepad-ui.js'); load('src/core/action-input.js'); load('src/core/input.js');
  const B = win.BARCODE;
  B.MusicProfiles = {select(id) { work.profiles.push(['select', id]); return {id}; }};
  B.MusicTransport = {load(id) { work.profiles.push(['load', id]); return {status: 'ok'}; }, getDiagnostics: () => ({})};
  B.Campaign = {resetSession() { assert.fail('Private preview must not initialize a campaign'); }, syncTitleButton() {}};
  B.LoreRecords = {catalog: [], getCatalog: () => [], chapters: () => []};
  load('src/game/pause-menu.js'); load('src/core/runtime-lifecycle.js'); load('src/core/loop.js');
  load('src/game/mac-street-combat.js'); load('src/game/mac-street-story.js'); load('src/game/mac-combat-preview.js');
  const manager = win.inputManager = new win.InputManager();
  doc.readyState = 'complete'; load('src/core/touch-controls.js');
  const globalListeners = () => [...win.listeners.values(), ...doc.listeners.values()].reduce((sum, items) => sum + items.length, 0);
  const key = (type, value, repeat = false) => win.dispatchEvent({type, key: value, repeat, timeStamp: now});
  const pointer = (element, type, id, x = 90, y = 670) => element.dispatchEvent({type, pointerId: id, pointerType: 'touch', clientX: x, clientY: y,
    button: 0, buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1, timeStamp: now, bubbles: true});
  const r = {w: win, doc, B, manager, work, pads, scheduled, key, pointer, globalListeners,
    async start() { const result = await B.RuntimeLifecycle.start({privatePreview: 'mac-firstslice'}); assert(result.ok, JSON.stringify(result)); return result; },
    frame(dt = 1000 / 60) {
      const handle = win.gameLoopRafHandle; assert(scheduled.has(handle), 'existing gameplay owner has the next frame');
      const callback = scheduled.get(handle); scheduled.delete(handle); now += dt; callback(now);
      assert(scheduled.size <= 1, 'at most one gameplay RAF'); return B.MacCombatPreview.getSnapshot();
    },
    run(ms) { for (let n = 0; n < Math.round(ms / (1000 / 60)); n++) r.frame(); return B.MacCombatPreview.getSnapshot(); },
    until(predicate, input, limit = 6000) { for (let n = 0; n < limit; n++) { const s = B.MacCombatPreview.getSnapshot(); if (predicate(s)) return s;
      input?.(s); r.frame(); } assert.fail('Timed out: ' + JSON.stringify(B.MacCombatPreview.getSnapshot())); },
    button(id) { B.TouchControls.sync(); const node = B.TouchControls.buttons.get(id)?.node; assert(node, 'visible direct button ' + id); return node; },
    pad() { if (!pads[0]) { pads[0] = {id: 'Xbox test controller', index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({length: 17}, () => ({pressed: false, value: 0}))}; r.frame(); } return pads[0]; }};
  return r;
}
const settle = async () => { for (let n = 0; n < 12; n++) await Promise.resolve(); };
const pressKey = (r, key) => { r.key('keydown', key); r.frame(); r.key('keyup', key); };
async function fightRoute(r) {
  const actionInput = r.manager.actionInput;
  let strikeHeld = false, throwHeld = false;
  const areas = new Set(), waves = new Set(), bossPhases = new Set();
  for (let frame = 0; frame < 30000; frame++) {
    const s = r.B.MacCombatPreview.getSnapshot();
    if (s.combat.desk.unlocked || s.status === 'failed') {
      assert.deepEqual([...areas], [1, 2, 3, 4, 5, 6]);
      assert.equal(waves.size, 12); assert(bossPhases.has(2) && bossPhases.has(3));
      return s;
    }
    const state = s.combat, p = state.player, c = r.B.MacCombatPreview.getControlState();
    areas.add(state.zone.index); waves.add(`${state.zone.index}:${state.wave.index}`);
    if (state.boss) bossPhases.add(state.boss.phase);
    const foe = state.enemies.filter(e => e.hp > 0 && e.phase !== 'dormant')
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    actionInput.releaseVirtualOwner('route');
    const hold = name => actionInput.setVirtualAction(name, 'route', true, {timeStamp: r.w.performance.now()});
    if (!foe) hold('move_right');
    else {
      const direction = Math.sign(foe.x - p.x) || p.facing;
      if (Math.abs(foe.x - p.x) > 58 || p.facing !== direction) hold(direction > 0 ? 'move_right' : 'move_left');
      if (Math.abs(foe.laneY - p.laneY) > 8) hold(foe.laneY > p.laneY ? 'move_down' : 'move_up');
      let strike = false, throwing = false;
      const incoming = state.projectiles.find(item => (item.x-p.x)*item.facing < 0 && Math.abs(item.x-p.x)<145 && Math.abs(item.laneY-p.laneY)<=item.laneReach+10);
      const warning = state.enemies.filter(e => e.hp > 0 && e.phase === 'windup' && Math.abs(e.attackLaneY-p.laneY)<45 && Math.abs(e.x-p.x)<330)
        .sort((a,b)=>(a.tellMs-a.phaseMs)-(b.tellMs-b.phaseMs))[0];
      const remaining = warning ? warning.tellMs-warning.phaseMs : Infinity;
      if (incoming && c.jump.ready) hold('jump');
      else if (warning && remaining < 310 && !p.attack && !p.throwMs) {
        actionInput.releaseVirtualOwner('route');
        if (warning.attackTell.guardable === false && remaining < 250 && c.jump.ready) hold('jump');
        else if (warning.attackTell.guardable !== false && remaining < 105) hold('road_defend');
        else if (warning.attackTell.guardable === false && p.elevation === 0) hold(p.laneY > 875 ? 'move_up' : 'move_down');
      } else if (c.throw.ready && !throwHeld) { hold('road_disrupt'); throwing = true; }
      else if (c.strike.ready && !strikeHeld && Math.abs(foe.x - p.x) <= 100 && Math.abs(foe.laneY - p.laneY) <= 35) { hold('road_attack'); strike = true; }
      strikeHeld = strike; throwHeld = throwing;
    }
    r.frame(); if (frame % 90 === 0) await settle();
  }
  assert.fail('City route timed out: ' + JSON.stringify(r.B.MacCombatPreview.getSnapshot()));
}
let groups = 0;
async function check(name, body) { await body(); groups++; console.log('PASS Mac integration ' + name); }
async function run() {
  await check('private lifecycle start/exit owns one frame and restores custom source bindings', async () => {
    const r = rig(), input = r.manager.actionInput;
    input.remap('jump', ['z', 'arrowup']); input.remap('road_attack', ['q']); const original = plain(input.keyboardBindings), listeners = r.globalListeners();
    await r.start(); assert(r.B.MacCombatPreview.requested()); assert.equal(r.B.RuntimeLifecycle.getState(), 'running');
    assert.equal(r.scheduled.size, 1); assert.deepEqual(plain(input.keyboardBindings.jump), [' ']);
    assert.equal(r.work.canvases, 1, 'Mac prepare/enter creates no canvas'); assert.equal(r.work.timers, 0); assert.equal(r.work.intervals, 0);
    r.run(200); assert.equal(r.globalListeners(), listeners);
    await r.B.MacCombatPreview.exit(); assert.equal(r.scheduled.size, 0); assert.equal(r.B.RuntimeLifecycle.getState(), 'idle');
    assert.equal(r.B.MacCombatPreview.active, false); assert.deepEqual(plain(input.keyboardBindings), original);
    assert.deepEqual(r.work.writes, []); assert.equal(r.doc.getElementById('startOverlay').classList.contains('hidden'), false);
  });
  await check('eight-scene intro retains its Kave choice and reader presses cannot leak into Jump', async () => {
    const r = rig(); await r.start(); const mac = r.B.MacCombatPreview, initial = mac.story.snapshot();
    pressKey(r, ' '); assert.equal(mac.story.snapshot().sceneId, initial.sceneId); assert(mac.story.snapshot().revealed);
    r.key('keydown', ' ', true); r.frame(); r.key('keyup', ' '); assert.equal(mac.story.snapshot().lineIndex, initial.lineIndex);
    pressKey(r, ' '); assert.equal(mac.story.snapshot().lineIndex, 1); assert.equal(mac.combat.getSnapshot().player.elevation, 0);
    const scenes = new Set([initial.sceneId]), choices = new Set();
    for (let n = 0; n < 65 && mac.phase === 'intro'; n++) {
      const s = mac.story.snapshot(); scenes.add(s.sceneId);
      if (s.choice) {
        choices.add(s.choice.id); assert.equal(s.choice.id, 'delivery-question');
        pressKey(r, '2'); assert.equal(mac.story.snapshot().selections['delivery-question'], 'what-got-blocked');
        continue;
      }
      pressKey(r, ' '); assert.equal(mac.combat.getSnapshot().player.elevation, 0);
    }
    assert.equal(scenes.size, 8); assert.deepEqual([...choices], ['delivery-question']);
    assert.equal(mac.phase, 'street'); assert.equal(mac.story, null);
    r.frame(); assert.equal(mac.combat.getSnapshot().player.elevation, 0); assert.equal(r.work.audio.filter(x => x === 'start').length, 1);
    await mac.exit();
  });
  await check('W/Up move lanes, Space jumps independently and ordinary J strikes', async () => {
    const r = rig(); await r.start(); r.manager.touchCommand('mac:skip'); const p = () => r.B.MacCombatPreview.combat.getSnapshot().player;
    const initial = p().laneY; r.key('keydown', 'w'); r.run(150); r.key('keyup', 'w');
    assert(p().laneY < initial); assert.equal(p().elevation, 0); const lane = p().laneY;
    r.key('keydown', 'ArrowUp'); r.run(150); r.key('keyup', 'ArrowUp'); assert(p().laneY < lane); assert.equal(p().elevation, 0);
    pressKey(r, ' '); assert(p().elevation > 0); r.run(800); pressKey(r, 'j'); assert.equal(p().attack.step, 1);
    await r.B.MacCombatPreview.exit(); assert(r.manager.actionInput.keyboardBindings.jump.includes('w'));
  });
  await check('optional opening choice has explicit keyboard and remapped controller Continue without selecting an answer', async () => {
    const r = rig(); await r.start(); const mac = r.B.MacCombatPreview;
    for (let n=0;n<30&&!mac.story.snapshot().choice;n++) pressKey(r,' ');
    assert.equal(mac.story.snapshot().choice.id,'delivery-question'); pressKey(r,' ');
    assert.equal(mac.story.snapshot().choice,null); assert.deepEqual(plain(mac.story.snapshot().selections),{});
    assert.equal(mac.combat.getSnapshot().player.elevation,0); await mac.exit();
    await r.start();
    for (let n=0;n<30&&!mac.story.snapshot().choice;n++) pressKey(r,' ');
    const settings=r.B.ControllerSettings,pad=r.pad(); settings.bind('inspect',3);
    pad.buttons[3].pressed=true; r.frame(); pad.buttons[3].pressed=false; r.frame();
    assert.equal(mac.story.snapshot().choice,null); assert.deepEqual(plain(mac.story.snapshot().selections),{});
    assert.equal(mac.combat.getSnapshot().player.elevation,0); await mac.exit();
  });
  await check('Mac controller diagonals work while the original deliberate drop filter remains', async () => {
    const r = rig(); await r.start(); r.manager.touchCommand('mac:skip'); const pad = r.pad();
    pad.axes = [.85, .85]; const before = r.B.MacCombatPreview.combat.getSnapshot().player; r.run(200);
    const after = r.B.MacCombatPreview.combat.getSnapshot().player;
    assert(after.x > before.x && after.laneY > before.laneY); assert.equal(after.elevation, 0);
    pad.axes = [0, 0]; r.frame(); pad.buttons[13].pressed = pad.buttons[15].pressed = true; r.frame();
    assert(r.manager.actionInput.held('move_down') && r.manager.actionInput.held('move_right'));
    await r.B.MacCombatPreview.exit();
    assert.equal(r.manager.actionInput.gamepadHeld('move_down', [pad]), false, '6 Bit diagonal D-pad is not a drop');
    pad.buttons[13].pressed = pad.buttons[15].pressed = false; pad.axes = [.85, .85];
    assert.equal(r.manager.actionInput.gamepadHeld('move_down', [pad]), false, '6 Bit diagonal stick is not a drop');
    pad.axes = [0, .85]; assert.equal(r.manager.actionInput.gamepadHeld('move_down', [pad]), true);
  });
  await check('real touch two-axis joystick and independent action fingers survive release/cancel/pause', async () => {
    const r = rig({touch: true}); await r.start(); const next = r.button('mac:next');
    r.pointer(next, 'pointerdown', 9); r.pointer(next, 'pointerup', 9);
    assert(r.B.MacCombatPreview.story.snapshot().revealed);
    r.manager.touchCommand('mac:skip'); const t = r.B.TouchControls; t.sync(); assert.equal(t.context.name, 'mac');
    assert.equal(t.buttons.has('ui:more'), false, 'combat actions are direct');
    r.pointer(t.joystick, 'pointerdown', 1); r.pointer(t.joystick, 'pointermove', 1, 130, 640);
    r.pointer(r.button('road_defend'), 'pointerdown', 2); r.pointer(r.button('road_attack'), 'pointerdown', 3);
    r.frame(); const a = r.manager.actionInput;
    assert(a.held('move_up') && a.held('move_right') && a.held('road_defend') && a.held('road_attack'));
    assert(r.B.MacCombatPreview.combat.getSnapshot().player.attack);
    r.pointer(r.button('road_attack'), 'pointerup', 3); r.frame(); assert(!a.held('road_attack'));
    assert(a.held('road_defend') && a.held('move_up') && a.held('move_right'));
    r.pointer(r.button('road_defend'), 'pointercancel', 2); r.frame(); assert(!a.held('road_defend') && a.held('move_right'));
    await r.manager.touchCommand('pause'); r.frame(); assert.equal(t.pointers.size, 0); assert.equal(a.virtualOwners.size, 0);
    const frozen = plain(r.B.MacCombatPreview.combat.getSnapshot()); r.run(200); assert.deepEqual(plain(r.B.MacCombatPreview.combat.getSnapshot()), frozen);
    await r.B.RuntimeLifecycle.resume(); r.frame(); assert(!a.held('move_up') && !a.held('move_right') && !a.held('road_attack'));
    await r.B.MacCombatPreview.exit(); r.manager.updateFrontend('title');
    assert.equal(t.pointers.size, 0); assert.equal(t.context.name, 'title'); assert.deepEqual(r.work.writes, []);
  });
  await check('pause freezes story, skip is blocked while paused and shared menu exits preview', async () => {
    const r = rig({touch: true}); await r.start(); const mac = r.B.MacCombatPreview;
    await r.manager.touchCommand('pause'); r.frame(); const frozen = plain(mac.story.snapshot());
    assert.equal(r.manager.touchCommand('mac:skip'), false); r.run(200); assert.deepEqual(plain(mac.story.snapshot()), frozen);
    await r.B.RuntimeLifecycle.resume(); r.frame(); assert(r.manager.touchCommand('mac:skip'));
    await r.B.RuntimeLifecycle.pause(); r.frame(); r.B.PauseMenu.focus = 7; r.B.PauseMenu.activate(); await settle();
    assert.equal(r.B.RuntimeLifecycle.getState(), 'idle'); assert.equal(mac.active, false); assert.equal(r.scheduled.size, 0); assert.deepEqual(r.work.writes, []);
  });
  await check('Mac controller menu remaps actual actions and rendered help follows custom buttons', async () => {
    const r = rig(); await r.start(); r.manager.touchCommand('mac:skip'); r.pad();
    await r.B.RuntimeLifecycle.pause(); r.frame(); const menu = r.B.PauseMenu, settings = r.B.ControllerSettings;
    assert.deepEqual(plain(menu.controllerControls()).map(row => row[0]), ['jump', 'road_attack', 'road_defend', 'road_disrupt', 'inspect']);
    menu.view = 'controller'; menu.controllerFocus = 4; menu.activateController();
    assert.equal(menu.captureAction, 'road_attack');
    menu.captureController({held: {}, pressed: {}}); assert(menu.captureReady);
    menu.captureController({held: {b7: true}, pressed: {b7: true}});
    assert.equal(settings.bindings.road_attack, 7); assert.equal(settings.bindings.road_defend, 5);
    assert.equal(menu.captureAction, null);
    settings.bind('jump', 2); settings.bind('inspect', 3);
    menu.view = 'settings'; const words = [], canvas = r.doc.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    ctx.fillText = text => words.push(String(text)); menu.draw(ctx);
    for (const [action, label] of [['jump', 'Jump'], ['road_attack', 'Strike'], ['road_defend', 'Guard'], ['road_disrupt', 'Throw'], ['inspect', 'Talk']])
      assert(words.some(line => line.includes(`${settings.prompt(action)}: ${label}`)), 'actual rendered custom prompt ' + action);
    assert(!words.some(line => /RHYTHM MODE HOLDS|R or Escape exits|Beat attack|LEVEL RULES/.test(line)), 'Mac help must not describe Level1 mechanics');
    menu.view = 'controller'; menu.controllerFocus = 3 + menu.controllerControls().length; menu.activateController();
    for (const action of ['jump', 'road_attack', 'road_defend', 'road_disrupt', 'inspect'])
      assert.equal(settings.bindings[action], r.manager.actionInput.gamepadBindings[action][0].button, 'Reset actual Mac action ' + action);
    assert(r.work.writes.length > 0); assert(r.work.writes.every(([key]) => key === 'barcode.controller.v1'), 'Only explicit controller preference edits persist');
    await r.B.MacCombatPreview.exit();
  });
  await check('real route desk/choice/clear/retry never awards or persists campaign completion', async () => {
    const r = rig({touch: true}); await r.start(); r.manager.touchCommand('mac:skip'); const end = await fightRoute(r);
    assert.equal(end.combat.kills, 30); assert.equal(end.combat.city.completedWaves, 12);
    assert.equal(end.combat.city.clearedZones.length, 6); assert.equal(end.combat.status, 'desk-ready'); assert.equal(end.status, 'playing');
    r.manager.actionInput.releaseVirtualOwner('route');
    r.key('keydown', 'd'); r.until(s => Math.abs(s.combat.player.x - s.combat.desk.x) < 170); r.key('keyup', 'd'); r.frame();
    const talk = r.button('inspect'); r.pointer(talk, 'pointerdown', 7); r.pointer(talk, 'pointerup', 7); r.frame();
    assert.equal(r.B.MacCombatPreview.phase, 'desk'); assert.equal(r.B.MacCombatPreview.story.snapshot().sceneId, 'review-desk');
    for (let n = 0; n < 12 && !r.B.MacCombatPreview.story.snapshot().choice; n++) r.manager.touchCommand('mac:next');
    assert.equal(r.B.MacCombatPreview.story.snapshot().choice.id, 'desk-question'); r.manager.touchCommand('mac:choice:0');
    assert.equal(r.B.MacCombatPreview.story.snapshot().selections['desk-question'], 'ask-people');
    r.manager.touchCommand('mac:skip'); r.frame(); assert.equal(r.B.MacCombatPreview.status, 'clear');
    assert.equal(r.w.gameState.victory, false); assert.equal(r.w.gameState.gameOver, false); assert.deepEqual(r.work.writes, []);
    assert(r.manager.touchCommand('mac:retry')); r.frame(); assert.equal(r.B.MacCombatPreview.status, 'playing');
    await settle(); r.frame(); await settle(); r.frame();
    const loadedZones = r.B.MacCombatPreview.cityArt.zones.filter(zone => r.B.MacCombatPreview.assets.has(zone.background));
    assert.deepEqual(loadedZones.map(zone => zone.id), ['service-alley','night-market']);
    assert.equal(r.B.MacCombatPreview.combat.getSnapshot().kills, 0); assert.equal(r.B.MacCombatPreview.combat.getSnapshot().player.x, 200);
    assert.equal(r.B.MacCombatPreview.phase, 'street'); assert.equal(r.B.MacCombatPreview.story, null); assert.deepEqual(r.work.writes, []);
    await r.manager.touchCommand('mac:exit'); assert.equal(r.scheduled.size, 0);
  });
  await check('earned defeat accepts controller Start pause, fresh retry and title commands', async () => {
    const r = rig(); await r.start(); r.manager.touchCommand('mac:skip');
    r.key('keydown', 'd'); r.until(s => s.combat.enemies[0].phase === 'windup'); r.key('keyup', 'd');
    r.until(s => s.status === 'failed', s => {
      const p = s.combat.player, foe = s.combat.enemies[0];
      if (Math.abs(foe.x - p.x) > 70) r.key('keydown', 'd'); else r.key('keyup', 'd');
    });
    r.key('keyup', 'd'); const pad = r.pad(); pad.buttons[9].pressed = true; r.frame(); await settle();
    assert.equal(r.B.RuntimeLifecycle.getState(), 'paused', 'controller Start remains available on Mac results');
    pad.buttons[9].pressed = false; r.frame(); await r.B.RuntimeLifecycle.resume(); r.frame();
    pad.buttons[0].pressed = true; r.frame(); assert.equal(r.B.MacCombatPreview.status, 'playing');
    assert.equal(r.B.MacCombatPreview.combat.getSnapshot().player.hp, 100); r.frame();
    assert.equal(r.B.MacCombatPreview.combat.getSnapshot().player.elevation, 0, 'held retry A cannot become a jump');
    pad.buttons[0].pressed = false; r.frame(); await r.B.MacCombatPreview.exit(); assert.deepEqual(r.work.writes, []);
  });
  await check('cancelled asynchronous entry cannot mutate profile/audio/controls after title return', async () => {
    let releaseInit; const init = new Promise(resolve => { releaseInit = resolve; });
    const r = rig({initAudio: () => init}), original = plain(r.manager.actionInput.keyboardBindings);
    const starting = r.B.RuntimeLifecycle.start({privatePreview: 'mac-firstslice'});
    for (let n = 0; n < 60 && !r.B.MacCombatPreview.active; n++) await Promise.resolve();
    assert(r.B.MacCombatPreview.active, 'reached real async audio preparation');
    await r.B.RuntimeLifecycle.stop('cancel-private-preview', {stopMusic: true}); await starting;
    const stopped = {profiles: plain(r.work.profiles), audio: plain(r.work.audio)};
    releaseInit(); await settle();
    assert.deepEqual(plain(r.work.profiles), stopped.profiles, 'stale entry cannot load a Mac profile after cancellation');
    assert.deepEqual(plain(r.work.audio), stopped.audio, 'stale entry cannot stop title audio');
    assert.deepEqual(plain(r.manager.actionInput.keyboardBindings), original); assert.equal(r.B.MacCombatPreview.active, false);
    assert.equal(r.scheduled.size, 0); assert.deepEqual(r.work.writes, []);
  });
  console.log(`Mac street integration: ${groups} groups passed (stubbed device/art/Canvas; real owners and gameplay route).`);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
