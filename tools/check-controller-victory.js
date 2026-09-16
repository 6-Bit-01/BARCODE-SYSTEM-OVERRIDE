#!/usr/bin/env node
// Run production input, player, boss and RAF owners; only browser/device services
// are supplied by the existing rig. Physical controller/Makko feel is owner QA.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');

function controls(rig) {
  const { w, context, listeners } = rig;
  for (const file of ['src/core/action-input.js', 'src/core/gamepad-ui.js', 'src/core/input.js']) load(context, file);
  const pad = { index: 1, id: 'DualSense test boundary', mapping: 'standard', connected: true,
    buttons: Array.from({ length: 17 }, () => ({ pressed: false })), axes: [0, 0] };
  w.navigator.getGamepads = () => [null, pad];
  w.inputManager = new w.InputManager();
  w.player.allowMovement = true;
  const frame = () => w.inputManager.update();
  const key = (name, held, repeat = false) => listeners[held ? 'keydown' : 'keyup'].forEach(fn => fn({ key: name, repeat, preventDefault() {} }));
  frame();
  return { pad, frame, key };
}

// Light downward drift and diagonal walking must still jump. A deliberate
// downward cone, pure D-pad down, and the remapped jump retain one-level descent.
for (const jump of [0, 5]) for (const [x, y, buttons, drops] of [
  [0, 0.22, [], false], [0.9, 0.3, [], false], [0, 0.69, [], false],
  [0.85, 0.8, [], false], [-0.85, 0.8, [], false],
  [0, 0.7, [], true], [0.4, 0.85, [], true], [-0.4, 0.85, [], true],
  [0, 0, [13], true], [0, 0, [13, 14], false], [0, 0, [13, 15], false],
  [0, 0, [12, 13], false]
]) {
  const rig = createRig(), { w, p } = rig, { pad, frame } = controls(rig);
  p.startMission(); p.closedGateEncounterId = null; p.getCurrentGate = () => null;
  w.rhythmSystem.hideRhythmMode();
  w.BARCODE.ControllerSettings.bind('jump', jump);
  const roof = p.getStageSurfaces().find(s => s.id === 'tower-rooftop');
  Object.assign(w.player.position, { x: 3500, y: roof.y - w.Player.VISUAL_FOOT_OFFSET_Y });
  Object.assign(w.player, { grounded: true, supportedSurfaceId: roof.id, controlsDisabled: false });
  w.player.velocity.y = 0; frame();
  pad.axes = [x, y]; for (const b of buttons) pad.buttons[b].pressed = true;
  pad.buttons[jump].pressed = true; frame();
  assert.strictEqual(w.player.dropSurfaceId === roof.id, drops, `axes ${x}/${y}, D-pad ${buttons}, jump ${jump}`);
  assert(drops ? w.player.velocity.y > 0 : w.player.velocity.y < 0, 'rejected drop input performs the normal jump');
}

for (const hz of [30, 60, 120]) for (const surface of ['street', 'tower-rooftop']) for (const device of ['pad', 'keyboard']) {
  const rig = createRig(), { w, p, context, calls } = rig;
  rig.reachReady();
  const { pad, frame, key } = controls(rig);
  const roof = p.getStageSurfaces().find(s => s.id === surface);
  const y = roof ? roof.y - w.Player.VISUAL_FOOT_OFFSET_Y : w.Player.GROUND_Y;
  Object.assign(w.player.position, { x: roof ? roof.x + 70 : 1600, y });
  w.player.supportedSurfaceId = roof?.id || null;
  p.state = 'boss_combat'; Object.assign(p.boss, { health: 1, canReceiveDamage: true, y });
  const hold = held => device === 'pad' ? pad.buttons[0].pressed = held : key('Enter', held);
  const restart = held => device === 'pad' ? pad.buttons[2].pressed = held : key(' ', held);
  hold(true); frame();
  assert(p.damageBoss('rhythm').ok); assert(w.gameState.victory);
  const position = JSON.stringify(w.player.position), score = w.gameState.score;
  w.requestAnimationFrame = () => 1; w.cancelAnimationFrame = () => {}; w.renderGame = () => {};
  load(context, 'src/core/loop.js'); w.lastTime = 0;
  let clock = 0;
  const raf = () => { clock += 1000 / hz; w.gameLoop(clock); };
  const won = () => {
    assert(w.gameState.victory, `${surface}/${device}/${hz}: victory cannot rematch from fight input`);
    assert.strictEqual(p.boss.health, 0); assert.strictEqual(JSON.stringify(w.player.position), position);
    assert.strictEqual(w.gameState.score, score); assert.strictEqual(p.levelCompletionCount, 1);
  };
  // Include fresh presses after the ownership handoff: the old code reset the
  // boss/player on the first such Cross/Enter, before the card was visible.
  for (let i = 0; i < hz; i++) { hold(i % 2 === 0); raf(); won(); }
  hold(true); restart(true);
  for (let i = 0; i < hz * 3; i++) { if (device === 'keyboard') key('Enter', true, true); raf(); won(); }
  assert(!p.areCompletionControlsReady(), 'held result controls cannot arm after the card finishes');
  hold(false); restart(false);
  for (let i = 0; i < Math.floor(hz * 0.1); i++) raf();
  assert(!p.areCompletionControlsReady(), 'a momentary release is insufficient');
  w.gameState.paused = true; p.updateCompletionPresentation(5000);
  assert(!p.areCompletionControlsReady(), 'pause does not advance readiness');
  w.gameState.paused = false;
  for (let i = 0; i < Math.ceil(hz * 0.3); i++) raf();
  assert(p.areCompletionControlsReady()); won();
  hold(true); frame();
  assert(!w.gameState.victory); assert.strictEqual(p.boss.health, p.boss.maxHealth);
  assert.strictEqual(w.player.position.y, w.Player.GROUND_Y, 'only an intentional rematch returns to street');
  assert.strictEqual(p.completion, null); assert.deepStrictEqual(calls.errors, []);
}

// Full restart still works once armed, and loss retry has no victory delay.
for (const device of ['pad', 'keyboard']) {
  const rig = createRig(), { w, p } = rig; rig.reachReady();
  const { pad, frame, key } = controls(rig);
  let restarts = 0; w.BARCODE.RuntimeLifecycle = { restart() { restarts++; } };
  p.completeLevel(); frame();
  if (device === 'pad') pad.buttons[2].pressed = true; else key(' ', true);
  frame(); assert.strictEqual(restarts, 0);
  if (device === 'pad') pad.buttons[2].pressed = false; else key(' ', false);
  frame(); for (let i = 0; i < 30; i++) p.updateCompletionPresentation(100);
  assert(p.areCompletionControlsReady());
  if (device === 'pad') pad.buttons[2].pressed = true; else key(' ', true);
  frame(); assert.strictEqual(restarts, 1);
  p.retryBossCheckpoint(); w.gameState.gameOver = true; w.gameState.running = false;
  frame();
  if (device === 'pad') { pad.buttons[2].pressed = false; pad.buttons[0].pressed = true; }
  else { key(' ', false); key(' ', true); }
  frame(); assert(!w.gameState.gameOver, 'loss retry remains immediately available');
}
console.log('Controller drop cone, street/rooftop victory input protection at 30/60/120 Hz, intentional rematch/restart and loss retry passed');
