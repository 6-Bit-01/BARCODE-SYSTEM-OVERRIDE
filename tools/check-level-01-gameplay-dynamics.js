#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

function approx(actual, expected, epsilon, message) {
  assert(Math.abs(actual - expected) <= epsilon, `${message}: expected ${expected}, got ${actual}`);
}

function createHarness() {
  let now = 100000;
  let timerId = 1;
  const timers = new Map();
  const context = {
    console: { log() {}, warn() {}, error() {} },
    Math,
    Date: { now: () => now },
    setTimeout(callback, delay) { const handle = { id: timerId++, callback, delay }; timers.set(handle, handle); return handle; },
    clearTimeout(handle) { timers.delete(handle); },
    window: null,
    global: null,
    document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; }, createElement() { return { style: {}, classList: { add() {}, remove() {} }, appendChild() {}, remove() {}, addEventListener() {} }; }, body: { appendChild() {} } }
  };
  context.window = context;
  context.global = context;
  context.Image = class Image { constructor() { this.complete = true; this.width = 32; this.height = 32; } set src(value) { this._src = value; } get src() { return this._src; } };
  context.Vector2D = class Vector2D { constructor(x = 0, y = 0) { this.x = x; this.y = y; } add(v) { return new context.Vector2D(this.x + v.x, this.y + v.y); } multiply(s) { return new context.Vector2D(this.x * s, this.y * s); } };
  context.clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  context.distance = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
  context.randomRange = (min, max) => (min + max) / 2;
  context.Particle = class Particle {};
  context.particleSystem = { particles: [], impact() {}, trail() {}, jumpEffect() {}, landingEffect() {}, dataFragmentEffect() {}, healEffect() {}, enemySpawnEffect() {} };
  context.audioSystem = { playSound() {}, isInitialized: () => false, context: { currentTime: 0 } };
  context.renderer = { getZoomLevel: () => 1, clearCinematicZoomOverride() {}, addScreenShake() {} };
  context.gameState = { paused: false, enemiesDefeated: 0, hasSpawnedInitialEnemies: true };
  context.objectivesSystem = { setMissionDefeatObjective() {}, updateMissionDefeatProgress() {}, revealJammerObjective() {}, completeJammerObjective() {}, reset() {} };
  context.tutorialSystem = { active: false, completed: true, storyChapter: 0, combatEnemiesPaused: false, isActive() { return this.active; }, isCompleted() { return this.completed; }, checkObjective() {}, completedObjectives: new Set(), objectives: [] };
  context.MakkoEngine = { sprite() { return { isLoaded: () => false, play() {}, stop() {}, draw() {}, currentSprite: null, _currentSprite: null }; } };
  context.BARCODE = { MusicTransport: {}, MusicProfiles: { getActive: () => ({ judgmentRules: [] }) }, JammerEnvironment: { status: { revealed: false, destroyed: false, health: 16, position: null }, reveal({ position }) { this.status = { revealed: true, destroyed: false, health: 16, position }; }, getStatus() { return this.status; }, reset() { this.status = { revealed: false, destroyed: false, health: 16, position: null }; }, canReceiveRhythmDamage: () => true, applyRhythmDamage(args = {}) { this.status.health = Math.max(0, this.status.health - (args.amount || 1)); if (this.status.health === 0) this.status.destroyed = true; return { ok: true }; } } };
  context.__timers = timers;
  context.advanceClock = ms => { now += ms; };
  context.flushTimers = () => Array.from(timers.values()).forEach(handle => { if (timers.has(handle)) { timers.delete(handle); handle.callback(); } });
  context.runDueTimers = minDelay => Array.from(timers.values()).filter(t => t.delay <= minDelay).forEach(handle => { if (timers.has(handle)) { timers.delete(handle); now += handle.delay; handle.callback(); } });
  context.runNextTimer = () => {
    const handle = Array.from(timers.values()).sort((a, b) => a.delay - b.delay)[0];
    if (!handle) return false;
    timers.delete(handle);
    now += handle.delay;
    handle.callback();
    return true;
  };

  for (const file of ['src/game/player.js', 'src/game/enemies.js', 'src/game/hacking.js', 'src/game/lost-data.js', 'src/game/rhythm.js', 'src/game/player-combat.js', 'src/game/sector1-progression.js', 'src/game/update-coordinator.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  return context;
}

function createCanvasSpy() {
  const calls = [];
  const saved = [];
  return {
    calls,
    canvas: { width: 1920, height: 1080 },
    fillStyle: '#000000', strokeStyle: '#000000', font: '10px sans-serif', textAlign: 'left',
    globalAlpha: 1, shadowBlur: 0, shadowColor: '#000000', lineWidth: 1,
    save() { saved.push({ fillStyle: this.fillStyle, strokeStyle: this.strokeStyle, font: this.font, textAlign: this.textAlign, globalAlpha: this.globalAlpha, shadowBlur: this.shadowBlur, shadowColor: this.shadowColor, lineWidth: this.lineWidth }); },
    restore() { Object.assign(this, saved.pop() || {}); },
    fillRect() {}, strokeRect() {},
    fillText(text, x, y) { calls.push({ text: String(text), x, y, fillStyle: this.fillStyle, font: this.font, globalAlpha: this.globalAlpha }); },
    measureText(text) { return { width: String(text).length * 14 }; }
  };
}

function defeatEnemy(progression, enemy) {
  if (!enemy || enemy._defeatRecorded) return;
  enemy.active = false; enemy.health = 0;
  progression.onEnemyDefeated(progression.missionDefeats + 1, enemy);
  enemy._defeatRecorded = true;
}
function defeatAllButOne(progression) {
  const alive = progression.activeEncounterEnemies.filter(enemy => enemy.active && !enemy._defeatRecorded);
  while (alive.length > 1) defeatEnemy(progression, alive.pop());
}
function defeatAll(progression) { progression.activeEncounterEnemies.forEach(enemy => defeatEnemy(progression, enemy)); }

function testEncountersAndTacticalFocusClock() {
  for (const fps of [30, 60, 120]) {
    const w = createHarness();
    w.player = { position: { x: 600, y: 750 }, velocity: { x: 0, y: 0 }, grounded: true, controlsDisabled: false };
    w.enemyManager = { enemies: [], clear() { this.enemies = []; } };
    const p = new w.Sector1Progression(w.player);
    w.sector1Progression = p;
    p.startMission();
    const totals = [];
    for (const encounter of p.getDiagnostics().encounters) {
      w.player.position.x = encounter.triggerX + 5;
      let guard = 0;
      while (p.state === encounter.id && guard++ < 2000) {
        p.update(1000 / fps);
        if (!p.pendingSpawns.length && p.activeEncounterPacket === 0) defeatAllButOne(p);
        if (p.pendingSpawns.length && p.activeEncounterPacket > 0 && p.activeEncounterEnemies.filter(e => e.active && !e._defeatRecorded).length >= encounter.activeCap) defeatAllButOne(p);
        if (!p.pendingSpawns.length && p.activeEncounterPacket > 0 && p.activeEncounterEnemies.length === encounter.packets.flat().length) defeatAll(p);
      }
      assert(guard < 2000, `${encounter.id} completes naturally at ${fps} FPS`);
      totals.push(p.activeEncounterEnemies.length || encounter.packets.flat().length);
      p.activeEncounterEnemies = [];
    }
    assert.deepStrictEqual(totals, [4, 5, 5, 6], `runtime totals at ${fps} FPS`);
  }

  const w = createHarness();
  w.player = { position: { x: 600, y: 750 }, velocity: { x: 0, y: 0 }, grounded: true };
  w.enemyManager = { enemies: [], clear() { this.enemies = []; } };
  w.hackingSystem = { isActive: () => true };
  const p = new w.Sector1Progression(w.player); w.sector1Progression = p; p.startMission(); p.update(1000);
  defeatAllButOne(p); p.update(1000);
  assert.strictEqual(p.activeEncounterPacket, 0, 'tactical focus does not release a packet at full-speed cadence');
  assert.strictEqual(p.packetGraceMs, 500, 'packet grace advances at the shared 40% hostile scale');
  p.update(1250);
  assert.strictEqual(p.activeEncounterPacket, 1, 'packet grace continues and eventually releases during tactical focus');
  p.revealJammer(); p.nextJammerSpawnMs = 500;
  p.update(1000);
  assert.strictEqual(p.nextJammerSpawnMs, 100, 'jammer reinforcement clock advances at the shared 40% hostile scale');
}

function testHackingLifecycle() {
  const w = createHarness();
  let hides = 0, shows = 0, pulses = 0;
  w.player = new w.Player(1000, 750); w.player.grounded = true; w.player.health = 2; w.player.maxHealth = 3;
  w.enemyManager = { simulationTimeMs: 2000, enemies: [ { active: true, type: 'virus', position: { x: 1030, y: 750 } }, { active: true, type: 'corrupted', _jammerReinforcement: true, position: { x: 1200, y: 750 } }, { active: true, type: 'virus', position: { x: 3000, y: 750 } }, { active: true, type: 'broadcast_jammer', position: { x: 1020, y: 750 } }, { active: true, type: 'boss', position: { x: 1010, y: 750 } } ] };
  w.rhythmSystem = { beatInterval: 375, active: true, isActive() { return this.active; }, hideRhythmMode() { hides++; this.active = false; }, showRhythmMode() { shows++; this.active = true; } };
  const hack = new w.HackingSystem(); w.hackingSystem = hack;
  assert.strictEqual(hides, 0, 'constructor does not alter rhythm mode');
  const originalPulse = hack.emitOverridePulse.bind(hack); hack.emitOverridePulse = () => { pulses++; originalPulse(); };
  hack.start();
  assert.strictEqual(hides, 1, 'start suspends active rhythm once');
  assert.strictEqual(pulses, 0, 'hack start emits no pulse');
  assert.strictEqual(hack.guardHitsRemaining, 1, 'start grants one guard hit');
  assert(hack.absorbGuardHit(), 'first hostile hit is absorbed');
  assert(!hack.absorbGuardHit(), 'second hostile hit is not absorbed');
  assert.strictEqual(hack.phase, 'boot', 'hack begins in deterministic boot phase');
  assert.strictEqual(hack.getDiagnostics().ownedTimeouts, 0, 'boot phase owns no browser timers');
  hack.update(hack.bootDurationMs);
  assert(hack.currentPuzzle, 'puzzle is generated by the simulation update');
  assert.strictEqual(hack.phase, 'display', 'puzzle enters authored display phase');
  assert.strictEqual(hack._startTime, 0, 'answer timer does not start while answer is visible');
  hack.update(hack.displayTime);
  assert.strictEqual(hack.phase, 'answer', 'display transitions to answer phase');
  assert.strictEqual(hack.currentPuzzle.hidden, true, 'answer is hidden before input is accepted');
  assert.strictEqual(hack._startTime, hack.puzzleReadyAt, 'four-second timer starts at readiness');
  const answer = hack.currentPuzzle.answer;
  answer.split('').forEach(key => hack.processInput(key));
  hack.processInput('Enter');
  assert.strictEqual(w.player.health, 3, 'success restores exactly one capped health bar');
  assert.strictEqual(pulses, 1, 'success emits exactly one pulse');
  assert.strictEqual(shows, 1, 'previous Rhythm Mode restored once');
  assert.strictEqual(hack.guardHitsRemaining, 0, 'success clears guard');
  assert.strictEqual(w.enemyManager.enemies[0]._stunnedUntilMs, 3500, 'pulse lasts four rhythm beats on simulation clock');
  assert.strictEqual(w.enemyManager.enemies[1]._stunnedUntilMs, 3500, 'pulse affects nearby jammer reinforcements');
  assert.strictEqual(w.enemyManager.enemies[2]._stunnedUntilMs, undefined, 'local pulse does not stun distant enemies');
  assert.strictEqual(w.enemyManager.enemies[3]._stunnedUntilMs, undefined, 'pulse excludes jammer');
  assert.strictEqual(w.enemyManager.enemies[4]._stunnedUntilMs, undefined, 'pulse excludes boss');

  w.advanceClock(10001);
  w.rhythmSystem.active = false;
  const failHack = new w.HackingSystem(); w.hackingSystem = failHack; let failPulses = 0; failHack.emitOverridePulse = () => { failPulses++; };
  failHack.start(); failHack.update(failHack.bootDurationMs); failHack.update(failHack.displayTime); failHack.processInput('0'); failHack.processInput('Enter');
  assert.strictEqual(failPulses, 0, 'failure emits no pulse');
  assert.strictEqual(shows, 1, 'inactive pre-hack rhythm is not restored');
  w.advanceClock(10001); failHack.start(); failHack.cancel(); assert.strictEqual(failPulses, 0, 'cancel emits no pulse');
  failHack.reset(); const diag = failHack.getDiagnostics(); assert.strictEqual(diag.active, false, 'reset clears active hacking'); assert.strictEqual(diag.ownedTimeouts, 0, 'reset leaves no owned hacking timers'); assert.strictEqual(diag.hasPuzzleTimeout, false, 'reset clears puzzle timeout');
}



function testHackingMemoryTimingAndRhythmRestore() {
  const w = createHarness();
  w.player = new w.Player(1000, 750); w.player.grounded = true; w.player.health = 2; w.player.maxHealth = 3;
  let shows = 0, hides = 0;
  w.rhythmSystem = { active: true, isActive() { return this.active; }, hideRhythmMode() { hides++; this.active = false; }, showRhythmMode() { shows++; this.active = true; } };
  w.Math = Object.create(Math); w.Math.random = () => 0.75;
  const hack = new w.HackingSystem(); w.hackingSystem = hack;
  hack.start();
  hack.update(hack.bootDurationMs);
  assert.strictEqual(hack.puzzleType, 2, 'fixture starts a memory puzzle');
  assert(hack.currentPuzzle, 'memory puzzle is generated after deterministic terminal startup');
  assert.strictEqual(hack._startTime, 0, 'memory answer clock has not started during memorization');
  assert.strictEqual(hack.puzzleTimeout, null, 'memory puzzle owns no answer timeout during memorization');
  assert.strictEqual(hack.active, true, 'memory puzzle cannot timeout during memorization');
  hack.update(hack.displayTime);
  assert(hack.terminalLines.includes('> MEMORY SEQUENCE HIDDEN'), 'memory puzzle hides before input window opens');
  assert.strictEqual(hack._startTime, hack.sessionElapsedMs, 'memory answer clock starts only after hiding');
  assert.strictEqual(hack.__unused, undefined, 'fixture sanity');
  assert.strictEqual(hack.getDiagnostics().ownedTimeouts, 0, 'answer phase owns no browser timeout');
  hack.update(3999); assert.strictEqual(hack.active, true, 'memory retains almost the full four-second answer window after hiding');
  hack.update(1);
  assert.strictEqual(shows, 1, 'timeout restores suspended Rhythm Mode once');
  hack.reset(); hack.reset();
  assert.strictEqual(shows, 1, 'repeated reset is idempotent after timeout restoration');

  function finish(method, activeBefore = true) {
    const h = new w.HackingSystem(); w.hackingSystem = h; w.rhythmSystem.active = activeBefore; h.start(); h.update(h.bootDurationMs); h.update(h.displayTime);
    const before = shows;
    if (method === 'success') { h.currentPuzzle.answer.split('').forEach(key => h.processInput(key)); h.processInput('Enter'); }
    else if (method === 'failure') { h.processInput('0'); h.processInput('Enter'); }
    else if (method === 'cancel') h.cancel();
    else if (method === 'reset') h.reset();
    return shows - before;
  }
  w.advanceClock(20000); assert.strictEqual(finish('reset', true), 1, 'reset restores Rhythm Mode suspended by this session');
  w.advanceClock(20000); assert.strictEqual(finish('reset', false), 0, 'reset never enables Rhythm Mode from normal mode');
  w.advanceClock(20000); assert.strictEqual(finish('cancel', true), 1, 'cancel restores suspended Rhythm Mode');
  w.advanceClock(20000); assert.strictEqual(finish('failure', true), 1, 'failure restores suspended Rhythm Mode');
  w.advanceClock(20000); assert.strictEqual(finish('success', true), 1, 'success restores suspended Rhythm Mode');
}

function testHackingPresentationInputAndRecovery() {
  const w = createHarness();
  w.player = new w.Player(1000, 750); w.player.grounded = true;
  w.rhythmSystem = { active: false, isActive() { return this.active; }, hideRhythmMode() { this.active = false; }, showRhythmMode() { this.active = true; } };
  w.tutorialSystem.active = true;
  w.tutorialSystem.completed = false;
  w.tutorialSystem.storyChapter = 2;

  const locked = new w.HackingSystem(); w.hackingSystem = locked;
  assert.strictEqual(locked.start(), false, 'H is blocked before the tutorial introduces hacking');
  assert.strictEqual(locked.active, false, 'blocked tutorial hack does not enter tactical focus');

  w.tutorialSystem.storyChapter = 3;
  const portHack = new w.HackingSystem(); w.hackingSystem = portHack;
  assert.strictEqual(portHack.start(), true, 'H becomes available in the hacking tutorial chapter');
  portHack.puzzleType = 1;
  portHack.update(portHack.bootDurationMs);
  assert.strictEqual(portHack.currentPuzzle.type, 1, 'fixture selects the three-port puzzle');
  assert.strictEqual(portHack.currentPuzzle.ports.length, 3, 'port puzzle displays exactly three ports');
  assert.strictEqual(portHack.currentPuzzle.ports.filter(port => port.status === 'OPEN').length, 1, 'port scan has exactly one OPEN answer');

  const portCanvas = createCanvasSpy();
  portHack.draw(portCanvas);
  const openLine = portCanvas.calls.find(call => /PORT\s+\d+:\s+OPEN/.test(call.text));
  const closedLine = portCanvas.calls.find(call => /PORT\s+\d+:\s+CLOSED/.test(call.text));
  assert(openLine && openLine.fillStyle === '#00ff00' && /25px/.test(openLine.font), 'OPEN port restores the original large bright-green treatment');
  assert(closedLine && closedLine.fillStyle === '#ff6600' && /21px/.test(closedLine.font), 'CLOSED ports restore the original large orange treatment');

  const answer = portHack.currentPuzzle.answer;
  assert.strictEqual(portHack.processInput(answer[0]), false, 'visible answer cannot be pre-filled during display phase');
  assert.strictEqual(portHack.inputText, '', 'display-phase key does not leak into terminal input');
  portHack.update(portHack.displayTime);
  answer.split('').forEach(key => portHack.processInput(key));
  assert.strictEqual(portHack.active, true, 'typing a complete answer does not auto-submit');
  assert.strictEqual(portHack.inputText, answer, 'complete answer remains editable until Enter');
  portHack.processInput('Enter');
  assert.strictEqual(portHack.active, false, 'Enter explicitly submits the complete answer');
  const resultCanvas = createCanvasSpy();
  portHack.draw(resultCanvas);
  assert(resultCanvas.calls.some(call => call.text === 'ACCESS GRANTED'), 'completed hack feedback remains visible after terminal input ownership ends');
  w.updateGameSystems(1000, false, false);
  assert.strictEqual(portHack.feedback, null, 'production coordinator retires post-session feedback instead of covering gameplay forever');

  const memoryHarness = createHarness();
  memoryHarness.player = new memoryHarness.Player(1000, 750); memoryHarness.player.grounded = true;
  memoryHarness.rhythmSystem = w.rhythmSystem;
  const memoryHack = new memoryHarness.HackingSystem(); memoryHarness.hackingSystem = memoryHack;
  memoryHack.start(); memoryHack.puzzleType = 2; memoryHack.update(memoryHack.bootDurationMs);
  assert(memoryHack.currentPuzzle.answer.length >= 3 && memoryHack.currentPuzzle.answer.length <= 5, 'memory puzzle keeps its authored 3-5 digit length');
  const code = memoryHack.currentPuzzle.answer;
  const memoryCanvas = createCanvasSpy();
  memoryHack.draw(memoryCanvas);
  const codeLine = memoryCanvas.calls.find(call => call.text.trim() === code);
  assert(codeLine && codeLine.fillStyle === '#ffff00' && /38px/.test(codeLine.font), 'memory code is large and yellow');
  memoryHack.update(memoryHack.displayTime);
  assert(!memoryHack.terminalLines.some(line => line.includes(code)), 'memory answer is genuinely removed when the input window opens');

  const guardHack = new memoryHarness.HackingSystem(); memoryHarness.hackingSystem = guardHack;
  guardHack.start();
  assert.strictEqual(guardHack.absorbGuardHit(), true, 'active hack guard absorbs one hostile hit');
  assert(guardHack.feedback, 'guard absorption creates visible feedback');
  guardHack.update(750);
  assert.strictEqual(guardHack.feedback, null, 'guard feedback clears instead of permanently covering the terminal');
  assert.strictEqual(guardHack.active, true, 'clearing guard feedback leaves the hack session active');

  const cancelHack = new memoryHarness.HackingSystem(); memoryHarness.hackingSystem = cancelHack;
  memoryHarness.advanceClock(10001);
  cancelHack.start();
  assert.strictEqual(cancelHack.processInput('Escape'), true, 'Escape is accepted during terminal boot');
  assert.strictEqual(cancelHack.active, false, 'Escape always exits the hack session');

  const watchdogHack = new memoryHarness.HackingSystem(); memoryHarness.hackingSystem = watchdogHack;
  memoryHarness.advanceClock(10001);
  watchdogHack.start();
  watchdogHack.phase = 'malformed';
  watchdogHack.update(watchdogHack.hardMaxSessionMs);
  assert.strictEqual(watchdogHack.active, false, 'hard watchdog recovers a malformed phase instead of freezing forever');
  assert.strictEqual(watchdogHack._lastResultFailed, true, 'watchdog recovery is recorded as a failed session');

  const throwingHarness = createHarness();
  throwingHarness.player = new throwingHarness.Player(1000, 750);
  throwingHarness.player.grounded = true;
  throwingHarness.player.restoreHealth = () => { throw new Error('health unavailable'); };
  throwingHarness.audioSystem.playSound = () => { throw new Error('audio unavailable'); };
  throwingHarness.tutorialSystem.active = true;
  throwingHarness.tutorialSystem.completed = false;
  throwingHarness.tutorialSystem.storyChapter = 3;
  throwingHarness.tutorialSystem.checkObjective = () => { throw new Error('tutorial unavailable'); };
  throwingHarness.rhythmSystem = {
    active: true,
    isActive() { return this.active; },
    hideRhythmMode() { this.active = false; },
    showRhythmMode() { throw new Error('rhythm unavailable'); }
  };
  const resilientHack = new throwingHarness.HackingSystem();
  throwingHarness.hackingSystem = resilientHack;
  resilientHack.emitOverridePulse = () => { throw new Error('pulse unavailable'); };
  resilientHack.start();
  resilientHack.update(resilientHack.bootDurationMs);
  resilientHack.update(resilientHack.displayTime);
  resilientHack.currentPuzzle.answer.split('').forEach(key => resilientHack.processInput(key));
  resilientHack.processInput('Enter');
  assert.strictEqual(resilientHack.active, false, 'throwing success collaborators cannot leave hacking active');
  assert.strictEqual(resilientHack.phase, 'result', 'throwing success collaborators still reach terminal result cleanup');
  assert.strictEqual(resilientHack.suspendedRhythmMode, false, 'Rhythm restoration ownership clears even when its callback throws');

  throwingHarness.advanceClock(10001);
  throwingHarness.tutorialSystem.active = false;
  const resilientTimeout = new throwingHarness.HackingSystem();
  throwingHarness.hackingSystem = resilientTimeout;
  resilientTimeout.start();
  resilientTimeout.update(resilientTimeout.bootDurationMs + resilientTimeout.displayTime + resilientTimeout.answerDurationMs);
  assert.strictEqual(resilientTimeout.active, false, 'throwing timeout audio cannot strand the terminal session');
  assert.strictEqual(resilientTimeout._lastResultFailed, true, 'throwing timeout audio still records failure');
}

function testHackEscapeKeyOwnership() {
  const listeners = {};
  let actionKeyDowns = 0;
  let rhythmHides = 0;
  let rhythmRestores = 0;
  const document = { readyState: 'complete', addEventListener() {} };
  const window = {
    FILE_MANIFEST: [],
    BARCODE: {
      ActionInput: class ActionInput {
        constructor() { this.state = {}; }
        handleKeyDown() { actionKeyDowns += 1; }
        handleKeyUp() {}
        reset() {}
        update() { return null; }
      }
    },
    document,
    addEventListener(type, listener) { listeners[type] = listener; },
    rhythmSystem: {
      active: true,
      isActive() { return this.active; },
      hideRhythmMode() { rhythmHides += 1; this.active = false; }
    },
    hackingSystem: {
      active: true,
      isActive() { return this.active; },
      processInput(key) {
        if (key === 'Escape') {
          this.active = false;
          window.rhythmSystem.active = true;
          rhythmRestores += 1;
        }
      }
    }
  };
  const context = vm.createContext({ window, document, console, navigator: { getGamepads: () => [] } });
  vm.runInContext(fs.readFileSync(path.join(root, 'src/core/input.js'), 'utf8'), context, { filename: 'src/core/input.js' });
  const event = repeat => ({ key: 'Escape', repeat, shiftKey: false, preventDefault() {} });
  listeners.keydown(event(false));
  listeners.keydown(event(true));
  assert.strictEqual(rhythmRestores, 1, 'first Escape cancels hacking and restores the suspended Rhythm Mode once');
  assert.strictEqual(rhythmHides, 0, 'held Escape repeat cannot immediately hide the restored Rhythm Mode');
  assert.strictEqual(actionKeyDowns, 0, 'held Escape repeat cannot leak into ActionInput after cancellation');
  listeners.keyup({ key: 'Escape' });
  listeners.keydown(event(false));
  assert.strictEqual(rhythmHides, 1, 'a fresh Escape press after keyup retains normal Rhythm Mode behavior');
}

function testLostDataMovementSwooperAmpAndEnemyClock() {
  const w = createHarness();
  w.player = new w.Player(700, 750); w.player.grounded = true;
  w.enemyManager = { enemies: [], clear() { this.enemies = []; } };
  const p = new w.Sector1Progression(w.player); w.sector1Progression = p;
  assert.strictEqual(typeof p.chargeSignalLift, 'undefined', 'unfinished Signal Lift has no production charge API');
  assert.strictEqual(typeof p.updateSignalLift, 'undefined', 'unfinished Signal Lift has no production update path');
  assert(!w.Sector1Progression.STAGE_SURFACES.some(surface => surface.id === 'signal-lift'), 'unfinished Signal Lift is not a stage collider');
  const lost = new w.LostDataSystem(); w.lostDataSystem = lost; lost.player = w.player;
  for (const [before, at] of [[3, 4], [8, 9], [13, 14]]) { p.missionDefeats = before; assert.strictEqual(lost.spawnFragment(), null, `next lost data locked at ${before} kills`); p.missionDefeats = at; assert(lost.spawnFragment(), `lost data spawns at ${at} kills`); }
  assert.strictEqual(JSON.stringify(lost.fragments.map(f => f.authoredPlacementId)), JSON.stringify(['signal-awning-fragment', 'middle-roof-fragment', 'upper-route-fragment']), 'authored Lost Data placements spawn in order');

  const swooper = new w.Enemy(500, 700, 'virus'); swooper.role = 'swooper'; swooper.entranceComplete = true; swooper.swooperState = 'approach'; w.enemyManager.enemies = [swooper]; const playerRef = { position: { x: 900, y: 750 } };
  for (let i = 0; i < 40 && swooper.swooperState === 'approach'; i++) swooper.updateSwooperBehavior(1 / 60, playerRef);
  assert.strictEqual(swooper.swooperState, 'telegraph', 'production swooper telegraphs');
  for (let i = 0; i < 50 && swooper.swooperState === 'telegraph'; i++) swooper.updateSwooperBehavior(1 / 60, playerRef);
  assert.strictEqual(swooper.swooperState, 'dive', 'production swooper dives');
  for (let i = 0; i < 50 && swooper.swooperState === 'dive'; i++) swooper.updateSwooperBehavior(1 / 60, playerRef);
  assert.strictEqual(swooper.swooperState, 'recovery', 'production swooper recovers');

  w.BARCODE.signalAmpCharges = 3;
  w.rhythmSystem = { getAuthoritativeDamageRadius: () => 250 };
  const combat = new w.BARCODE.PlayerCombat();
  const normal = { active: true, type: 'virus', position: { x: w.player.position.x + 420, y: w.player.position.y }, takeDamage(d) { this.damage = d; } };
  const jammer = { active: true, type: 'broadcast_jammer', position: { x: w.player.position.x + 420, y: w.player.position.y }, takeDamage(d) { this.damage = d; } };
  assert.deepStrictEqual(combat.findTargets(w.player, { enemies: [normal, jammer] }, { timing: 'perfect' }), [normal], 'Signal Amp targets normal enemies but excludes jammer');
  assert.strictEqual(w.BARCODE.signalAmpCharges, 2, 'Signal Amp charge consumed by successful normal hit');
  assert.strictEqual(combat.findTargets(w.player, { enemies: [normal] }, { timing: 'miss' }).length, 0, 'miss does not use Signal Amp range');
  assert.strictEqual(w.BARCODE.signalAmpCharges, 2, 'miss does not consume Signal Amp charge');

  const manager = new w.EnemyManager(); manager.enemies = [{ active: true, type: 'virus', position: { x: 1000, y: 750 }, velocity: { x: 0, y: 0 }, _stunnedUntilMs: 100, update(dt, player, sim) { this.lastDt = dt; this.lastSim = sim; }, getHitbox: () => ({ x: 0, y: 0, width: 0, height: 0 }) }];
  w.hackingSystem = { isActive: () => true };
  manager.update(1000, { controlsDisabled: false, getHitbox: () => ({ x: 9999, y: 9999, width: 1, height: 1 }), position: { x: 9999, y: 9999 }, velocity: { y: 0 } });
  assert.strictEqual(manager.enemies[0].lastDt, 400, 'enemy behavior uses the shared 40% hostile delta during hacking');
  assert.strictEqual(manager.enemies[0].lastSim, 400, 'enemy attack timers use the shared hostile simulation clock');
  assert.strictEqual(manager.simulationTimeMs, 1000, 'authoritative simulation clock remains real time for stun expiry');
  assert.strictEqual(w.BARCODE.TacticalFocusClock.getScale(), 0.4, 'shared tactical clock exposes the visible 40% hostile scale');
  const renderSource = fs.readFileSync(path.join(root, 'src/game/render-coordinator.js'), 'utf8');
  assert(renderSource.includes('TACTICAL FOCUS //'), 'render path includes a restrained on-screen tactical focus cue');

  const contactManager = new w.EnemyManager();
  let contactHits = 0;
  const contactEnemy = { active: true, type: 'virus', damage: 1, position: { x: 1000, y: 750 }, velocity: { x: 0, y: 0 }, lastPlayerHitTimeMs: -Infinity, update() {}, isSpawnProtected: () => false, getHitbox: () => ({ x: 980, y: 730, width: 40, height: 40 }) };
  contactManager.enemies = [contactEnemy];
  w.hackingSystem = { isActive: () => true, absorbGuardHit: () => false };
  const contactPlayer = { controlsDisabled: false, position: { x: 1000, y: 750 }, velocity: { y: -200 }, getHitbox: () => ({ x: 990, y: 740, width: 20, height: 20 }), takeDamageWithKnockback() { contactHits++; } };
  contactManager.update(16, contactPlayer);
  assert.strictEqual(contactHits, 1, 'initial contact damage lands during tactical focus');
  contactManager.update(1500, contactPlayer);
  assert.strictEqual(contactHits, 1, 'contact damage cannot repeat after only 1.5 seconds of normal time during tactical focus');
  for (let i = 0; i < 5; i++) contactManager.update(1000, contactPlayer);
  assert.strictEqual(contactHits, 2, 'contact damage repeats after sufficient slowed hostile time');
}


function testProductionPlayerMovement() {
  function makePlayer(w) { const p = new w.Player(1000, 740); p.isEntering = false; p.allowMovement = true; p.grounded = false; p.coyoteTimerMs = 0; p.velocity.y = 600; p.spriteReady = false; w.player = p; return p; }
  let w = createHarness(); w.inputManager = { actionInput: { state: { jump: { held: true } } }, isKey: () => false };
  let p = makePlayer(w); assert.strictEqual(p.jump(), false, 'airborne jump stores buffer and does not double jump'); assert(p.jumpBufferTimerMs > 0, 'jump buffer stored'); p.update(40); assert(!p.grounded && p.velocity.y < 0, 'landing consumes jump buffer exactly once and immediately jumps'); const consumed = p.jumpBufferTimerMs; p.update(16); assert.strictEqual(consumed, 0, 'jump buffer consumed once');
  w = createHarness(); w.inputManager = { actionInput: { state: { jump: { held: true } } }, isKey: () => false }; p = makePlayer(w); p.jump(); p.update(200); assert(p.grounded, 'expired buffer lands without jumping');
  w = createHarness(); w.inputManager = { actionInput: { state: { jump: { held: true } } }, isKey: () => false }; p = new w.Player(1000, 750); p.isEntering = false; p.allowMovement = true; p.grounded = false; p.coyoteTimerMs = 80; assert(p.jump(), 'coyote jump works inside window'); p = new w.Player(1000, 750); p.isEntering = false; p.allowMovement = true; p.grounded = false; p.coyoteTimerMs = 0; assert.strictEqual(p.jump(), false, 'coyote jump fails outside window');
  function apex(heldProvider) { const h = createHarness(); h.inputManager = heldProvider; const q = new h.Player(1000, 750); q.isEntering = false; q.allowMovement = true; q.grounded = true; q.jump(); let minY = q.position.y; for (let i = 0; i < 90; i++) { q.update(1000 / 60); minY = Math.min(minY, q.position.y); } return 750 - minY; }
  const keyboardTap = apex({ actionInput: { state: { jump: { held: false } } }, isKey: key => key === 'arrowup' ? false : false });
  const gamepadHold = apex({ actionInput: { state: { jump: { held: true } } }, isKey: () => false });
  assert(gamepadHold > keyboardTap + 120, 'gamepad and keyboard action-state release drive variable jump height');
  const reaches = [];
  for (const fps of [30, 60, 120]) { const h = createHarness(); h.inputManager = { actionInput: { state: { jump: { held: true } } }, isKey: () => false }; const q = new h.Player(1000, 750); q.isEntering = false; q.allowMovement = true; q.grounded = true; q.moveRight(); q.jump(); for (let i = 0; i < fps; i++) q.update(1000 / fps); reaches.push(q.position.x); }
  approx(Math.max(...reaches) - Math.min(...reaches), 0, 30, 'production horizontal air control is frame-stable at 30/60/120 FPS');
}

testEncountersAndTacticalFocusClock();
testHackingLifecycle();
testHackingMemoryTimingAndRhythmRestore();
testHackingPresentationInputAndRecovery();
testHackEscapeKeyOwnership();
testLostDataMovementSwooperAmpAndEnemyClock();
testProductionPlayerMovement();
console.log('✅ Level 1 production gameplay dynamics checks passed');
