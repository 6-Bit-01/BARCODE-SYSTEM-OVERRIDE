// Production owners, with only browser/device boundaries supplied by the rig.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
const plain = value => JSON.parse(JSON.stringify(value));
function controls(rig) {
  const { w, context } = rig;
  for (const file of ['src/game/pause-menu.js', 'src/core/action-input.js', 'src/core/gamepad-ui.js', 'src/core/input.js', 'src/engine/intro-sequence.js']) load(context, file);
  const pad = { mapping: 'standard', connected: true, buttons: Array.from({ length: 17 }, () => ({ pressed: false })), axes: [0, 0] };
  w.navigator.getGamepads = () => [null, pad]; // A valid pad need not occupy slot zero.
  w.inputManager = new w.InputManager();
  w.player.allowMovement = true; // The gameplay update normally projects this flag.
  const frame = () => w.gameState.paused ? w.inputManager.updatePausedInput() : w.inputManager.update();
  const tap = button => { pad.buttons[button].pressed = true; frame(); pad.buttons[button].pressed = false; frame(); };
  frame();
  return { pad, frame, tap };
}
async function main() {
  {
    const rig = createRig(), { w, p } = rig;
    controls(rig);
    const generation = w.BARCODE.MusicTransport.getDiagnostics().generation;
    p.update(16); assert(p.missionStarted, 'the completed tutorial hands directly to the mission');
    const enemies = w.enemyManager.enemies.length;
    p.update(16); assert.strictEqual(w.enemyManager.enemies.length, enemies, 'no duplicate mission entry');
    assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation, generation);

  }
  {
    const rig = createRig(), { w, context } = rig, { pad, frame, tap } = controls(rig);
    w.rhythmSystem.hideRhythmMode();
    tap(4); assert(w.rhythmSystem.isActive(), 'L1 binds the grounded R action'); tap(1); assert(!w.rhythmSystem.isActive());
    w.tutorialSystem.active = true; w.tutorialSystem.completed = false; w.tutorialSystem.storyChapter = 1;
    let advanced = 0; w.tutorialSystem.handleSpacePress = () => advanced++;
    frame(); tap(4); assert(!w.rhythmSystem.isActive(), 'L1 retains tutorial R lock');
    const y = w.player.position.y; tap(0); assert.strictEqual(advanced, 1); assert.strictEqual(w.player.position.y, y); assert(w.player.grounded, 'A advance cannot also jump');
    tap(5); assert(!w.player.grounded, 'RB provides the tutorial jump action');
    w.player.grounded = true; w.player.velocity.y = 0; w.tutorialSystem.active = false; frame();
    load(context, 'src/game/hacking.js'); w.hackingSystem = new w.HackingSystem();
    const hackTarget = new w.Enemy(1000, 784, 'virus');
    Object.assign(hackTarget.position, { x: 1000, y: 784 }); hackTarget.entranceComplete = true; hackTarget.spawnTimeMs = -10000; hackTarget.spawnProtectionDuration = 0;
    w.enemyManager.enemies = [hackTarget];
    for (const type of [1, 2]) {
      hackTarget._hijackedUntilMs = 0; hackTarget._hijackRebootUntilMs = 0;
      w.hackingSystem.reset(); w.hackingSystem.cooldownUntil = 0;
      assert(w.hackingSystem.start()); w.hackingSystem.puzzleType = type; frame();
      // Advance the real boot and display phases; enter the generated answer.
      w.hackingSystem.update(1000); w.hackingSystem.update(w.hackingSystem.displayTime);
      assert.strictEqual(w.hackingSystem.phase, 'answer');
      const answer = w.hackingSystem.currentPuzzle.answer;
      const select = key => {
        const index = w.hackingSystem.getKeypad().findIndex(k => k.key === key);
        while (Math.floor(w.hackingSystem.keypadIndex / 3) !== Math.floor(index / 3)) tap(w.hackingSystem.keypadIndex < index ? 13 : 12);
        while (w.hackingSystem.keypadIndex % 3 !== index % 3) tap(w.hackingSystem.keypadIndex % 3 < index % 3 ? 15 : 14);
        tap(0);
      };
      select(String(answer)[0]); tap(2); assert.strictEqual(w.hackingSystem.inputText, '', 'X erases');
      for (const digit of String(answer)) select(digit);
      assert.strictEqual(w.hackingSystem.inputText, String(answer));
      w.player.health = 1;
      const beforeHealth = w.player.health;
      select('Enter'); assert(!w.hackingSystem.active); assert.strictEqual(w.hackingSystem.resultFx.outcome, 'success');
      assert.strictEqual(w.player.health, beforeHealth, 'puzzles do not repair health');
      assert(w.enemyManager.isHijacked(hackTarget), 'each controller puzzle hijacks the locked enemy');
      assert.strictEqual(w.player.velocity.y, 0, 'terminal digits do not jump');
    }
    hackTarget._hijackedUntilMs = 0; hackTarget._hijackRebootUntilMs = 0;
    w.hackingSystem.cooldownUntil = 0; w.hackingSystem.start(); frame(); tap(1); assert(!w.hackingSystem.active, 'B cancels the terminal');
    // Frontend ownership consumes held buttons before gameplay resumes.
    w.inputManager.updateFrontend('intro'); pad.buttons[1].pressed = true;
    w.inputManager.updateFrontend('intro'); w.inputManager.resetActionEdges();
    frame(); assert(!w.rhythmSystem.isActive(), 'held intro skip cannot enter Rhythm Mode');
    pad.buttons[1].pressed = false; frame();
    w.navigator.getGamepads = () => []; frame(); assert.strictEqual(w.inputManager.gamepad, null, 'disconnect drops stale pad');
  }
  {
    const rig = createRig(), { w, context } = rig, { tap, frame } = controls(rig);
    load(context, 'src/core/runtime-lifecycle.js'); await w.BARCODE.RuntimeLifecycle.start(); frame();
    await w.BARCODE.RuntimeLifecycle.pause(); frame();
    const menu = w.BARCODE.PauseMenu; assert(menu.open); assert.strictEqual(menu.focus, 9);
    tap(12); assert.strictEqual(menu.focus, 8); tap(0); assert.strictEqual(menu.view, 'archive');
    tap(15); assert.strictEqual(menu.archiveIndex, 1); tap(1); assert.strictEqual(menu.view, 'settings');
    tap(12); tap(0); assert.strictEqual(menu.view, 'timing'); tap(15); assert.strictEqual(w.BARCODE.Preferences.values.inputOffsetMs, 5);
    tap(13); tap(14); assert.strictEqual(w.BARCODE.Preferences.values.visualOffsetMs, -5);
    tap(1); tap(1); await new Promise(resolve => setImmediate(resolve));
    assert(!w.gameState.paused, 'B resumes via the existing lifecycle');
    // Frontend dispatch uses the same release latch as gameplay.
    let starts = 0, next = 0, skips = 0;
    w.document.getElementById = id => id === 'startButton' ? { click() { starts++; } } : null;
    const pad = w.navigator.getGamepads()[1];
    w.inputManager.updateFrontend('title'); pad.buttons[0].pressed = true; w.inputManager.updateFrontend('title'); w.inputManager.updateFrontend('title'); assert.strictEqual(starts, 1);
    w.cutsceneSystem = { skipCutscene() { next++; }, startSkipHold() { skips++; }, endSkipHold() {} };
    w.inputManager.updateFrontend('intro'); assert.strictEqual(next, 0, 'held start cannot advance the intro');
    pad.buttons[0].pressed = false; w.inputManager.updateFrontend('intro'); pad.buttons[0].pressed = true; w.inputManager.updateFrontend('intro'); assert.strictEqual(next, 1);
    pad.buttons[1].pressed = true; w.inputManager.updateFrontend('intro'); assert.strictEqual(skips, 1);
  }
  {
    const { w, context } = createRig();
    const store = new Map(); w.localStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
    load(context, 'src/game/pause-menu.js');
    const prefs = w.BARCODE.Preferences, transport = w.BARCODE.MusicTransport;
    const rule = w.BARCODE.MusicProfiles.getActive().judgmentRules[0].id;
    const beatTime = 60 / 146 * 40;
    prefs.set('inputOffsetMs', 120); prefs.set('visualOffsetMs', -35);
    assert.strictEqual(transport.judgeInput(rule, beatTime + 0.12).timing, 'miss');
    assert.strictEqual(w.BARCODE.playerCombat.getTimingJudgment(beatTime + 0.12).timing, 'perfect', 'captured tap receives input offset once');
    const before = plain(transport.getDiagnostics());
    prefs.set('visualOffsetMs', 180);
    assert.strictEqual(w.BARCODE.playerCombat.getTimingJudgment(beatTime + 0.12).timing, 'perfect', 'visual offset cannot change scoring');
    assert.strictEqual(transport.getDiagnostics().generation, before.generation);
    load(context, 'src/game/pause-menu.js'); assert.strictEqual(w.BARCODE.Preferences.values.inputOffsetMs, 120); assert.strictEqual(w.BARCODE.Preferences.values.visualOffsetMs, 180);
    w.BARCODE.Preferences.restoreDefaults(); assert.strictEqual(w.BARCODE.Preferences.values.inputOffsetMs, 0); assert.strictEqual(w.BARCODE.Preferences.values.visualOffsetMs, 0);
  }
  {
    const { w, context } = createRig(); load(context, 'src/engine/renderer.js');
    const camera = Object.create(w.Renderer.prototype); w.renderer = camera; w.player.position.x = 1900; w.player.velocity.x = 0;
    camera.resetFollowCamera(1900); w.player.position.x = 1940; camera.updateFollowCamera(100); assert.strictEqual(camera.followCenterX, 1900, 'small movements remain inside dead zone');
    w.player.position.x = 2400; w.player.velocity.x = 400;
    for (let i = 0; i < 60; i++) camera.updateFollowCamera(16.6667);
    assert(camera.followCenterX > 2400 && camera.followCenterX < 2500, 'bounded lookahead settles beyond the player');
    const beforePosition = plain(w.player.position); w.sector1Progression.cameraOverrideActive = true; w.sector1Progression.cameraX = 1200;
    camera.updateFollowCamera(100); assert.strictEqual(camera.followCenterX, 1200); assert.deepStrictEqual(plain(w.player.position), beforePosition);
    w.sector1Progression.cameraOverrideActive = false; w.player.position.x = 4096; camera.updateFollowCamera(100); assert.strictEqual(camera.followCenterX, 3136);
    camera.resetFollowCamera(0); assert.strictEqual(camera.followCenterX, 960);
  }
  {
    for (const kind of ['swooper', 'mission', 'reinforcement']) {
      const { w } = createRig(); w.player.position.x = 2200;
      const manager = w.enemyManager;
      manager.enemies = [1000, 1100, 1200].map(x => {
        const enemy = new w.Enemy(x, 500, kind === 'swooper' ? 'virus' : 'corrupted');
        enemy.entranceComplete = true; enemy.active = true; enemy.state = 'patrol'; enemy._spawnProtectionUntilMs = 0;
        if (kind === 'swooper') { enemy.role = 'swooper'; enemy.swooperState = 'dive'; enemy.swooperTimerMs = 0; enemy.velocity.x = 360; enemy.velocity.y = 160; }
        else { enemy[kind === 'mission' ? '_sector1MissionEnemy' : '_jammerReinforcement'] = true; enemy.combatPattern = 'attack'; enemy.combatPatternMs = 0; enemy.combatDirection = 1; }
        return enemy;
      });
      manager.crowdCheckTimer = manager.crowdCheckInterval;
      let checked = 0;
      const original = manager.applyCrowdBehavior;
      manager.applyCrowdBehavior = function(group, player, dt) {
        const before = group.map(enemy => plain(enemy.velocity)); original.call(this, group, player, dt);
        assert.deepStrictEqual(group.map(enemy => plain(enemy.velocity)), before, kind + ' crowd cannot rewrite committed motion'); checked++;
      };
      manager.update(16, w.player); assert(checked > 0, kind + ' reproduction must reach crowd steering through the production manager');
    }
  }
  {
    const rig = createRig(), { p, w } = rig; rig.reachReady();
    p.boss.canReceiveDamage = true; p.boss.stompArmed = true; p.boss.stompCycle = p.boss.cycle;
    assert(!p.getBossStatus().canStompCounter, 'landing in a spent cycle does not restore the stomp cue');
    p.boss.cycle++; assert(p.getBossStatus().canStompCounter); p.boss.stompArmed = false; assert(!p.getBossStatus().canStompCounter);
    controls(rig); w.gameState.gameOver = true; w.gameState.running = false;
    w.inputManager.update();
    const pad = w.navigator.getGamepads()[1]; pad.buttons[0].pressed = true; w.inputManager.update();
    assert(!w.gameState.gameOver); assert.strictEqual(p.state, 'boss_ready', 'controller A uses the actual boss retry checkpoint');
  }
  // Approved controller settings: actual selectors, saved mappings and UI owner.
  {
    const rig = createRig(), { w, context } = rig, store = new Map();
    w.localStorage = { getItem: key => store.get(key), setItem: (key, value) => store.set(key, value) };
    const { pad, frame, tap } = controls(rig);
    pad.id = 'DualSense Wireless Controller (054c)'; pad.index = 1; w.rhythmSystem.hideRhythmMode(); frame();
    const settings = w.BARCODE.ControllerSettings, input = w.inputManager.actionInput, menu = w.BARCODE.PauseMenu;
    assert.equal(settings.button(0), '✕'); assert.equal(settings.prompt('rhythm_mode'), 'L1');
    pad.axes[0] = 0.19; frame(); assert(!input.held('move_right'));
    pad.axes[0] = 0.21; frame(); assert(input.held('move_right'));
    pad.axes[0] = 0.17; frame(); assert(input.held('move_right'), 'hysteresis prevents edge chatter');
    pad.axes[0] = 0.14; frame(); assert(!input.held('move_right'));
    pad.axes[0] = -0.21; frame(); assert(input.held('move_left'));
    pad.axes[0] = 0; frame();
    settings.setDeadzone(0.32); pad.axes[0] = 0.3; frame(); assert(!input.held('move_right'));
    pad.axes[0] = 0.34; frame(); assert(input.held('move_right')); pad.axes[0] = 0; frame();
    assert(settings.bind('jump', 2)); assert.equal(settings.bindings.primary, 0, 'conflicting assignment swaps actions');
    assert(!settings.bind('jump', 1)); assert(!settings.bind('jump', 9), 'back and pause stay available');
    w.player.grounded = true; pad.buttons[2].pressed = true; frame(); assert(!w.player.grounded, 'remapped jump reaches production player');
    frame(); assert(!input.pressed('jump'), 'held button does not repeat edges'); pad.buttons[2].pressed = false; frame();
    w.player.grounded = true; w.player.velocity.y = 0;
    pad.buttons[0].pressed = true; frame(); assert(input.pressed('primary')); assert(w.player.grounded, 'swapped attack cannot jump');
    pad.buttons[0].pressed = false; frame();
    settings.labels = 'xbox'; settings.vibration = false; settings.save(); assert.equal(settings.button(0), 'A');
    const saved = plain({ bindings: settings.bindings, deadzone: settings.deadzone, labels: settings.labels, vibration: settings.vibration });
    load(context, 'src/core/gamepad-ui.js'); frame();
    assert.deepStrictEqual(plain({ bindings: w.BARCODE.ControllerSettings.bindings, deadzone: w.BARCODE.ControllerSettings.deadzone, labels: w.BARCODE.ControllerSettings.labels, vibration: w.BARCODE.ControllerSettings.vibration }), saved);
    const c = w.BARCODE.ControllerSettings;
    load(context, 'src/core/runtime-lifecycle.js'); await w.BARCODE.RuntimeLifecycle.start(); frame(); await w.BARCODE.RuntimeLifecycle.pause(); frame();
    menu.view = 'controller';
    const originalElement = w.document.getElementById;
    w.document.getElementById = id => id === 'gameCanvas' ? { getBoundingClientRect: () => ({ left: 10, top: 20, width: 960, height: 540 }) } : originalElement?.(id);
    menu.pointer({ clientX: 10 + 1250 / 2, clientY: 20 + 370 / 2, preventDefault() {} }, 'down');
    assert.equal(c.deadzone, 0.3, 'scaled pointer selects the actual deadzone slider');
    w.document.getElementById = originalElement;
    menu.controllerFocus = 3;
    tap(0); assert.equal(menu.captureAction, 'jump'); assert(menu.captureReady, 'confirm release arms capture');
    pad.buttons[6].pressed = true; frame(); assert.equal(c.bindings.jump, 6); assert.equal(menu.captureAction, null);
    await menu.resume(); frame(); assert(!input.pressed('jump')); assert(!input.held('jump'), 'held capture button cannot leak into resumed play');
    pad.buttons[6].pressed = false; frame(); w.player.grounded = true; pad.buttons[6].pressed = true; frame(); assert(input.pressed('jump'), 'released and repressed remap produces a fresh edge');
    pad.buttons[6].pressed = false; frame();
    // Unknown mappings cannot silently be interpreted as standard buttons.
    const unknown = { ...pad, mapping: '', id: 'unmapped', index: 0, buttons: pad.buttons.map(() => ({ pressed: true })) };
    w.navigator.getGamepads = () => [unknown]; frame(); assert(w.BARCODE.GamepadUI.unsupported); assert.equal(w.inputManager.gamepad, null); assert(!input.held('jump'));
    const other = { ...pad, id: 'Second standard pad', index: 2, buttons: pad.buttons.map(() => ({ pressed: false })), axes: [1, 0] };
    w.navigator.getGamepads = () => [unknown, other]; frame(); assert(!input.held('move_right'), 'new device must release held movement');
    other.axes[0] = 0; frame(); other.axes[0] = 1; frame(); assert(input.held('move_right'));
    pad.axes[0] = -1; w.navigator.getGamepads = () => [pad, other]; frame(); assert(input.held('move_right') && !input.held('move_left'), 'current controller stays selected instead of merging devices');
    w.localStorage.setItem = () => { throw new Error('blocked'); }; c.setDeadzone(0.4); assert(!c.saved); assert.equal(c.deadzone, 0.4);
    w.localStorage.getItem = () => '{broken'; load(context, 'src/core/gamepad-ui.js'); assert.equal(w.BARCODE.ControllerSettings.deadzone, 0.2);
  }
  {
    const rig = createRig(), { w, context } = rig, { tap, frame } = controls(rig);
    load(context, 'src/core/runtime-lifecycle.js'); await w.BARCODE.RuntimeLifecycle.start(); frame();
    load(context, 'src/game/hacking.js'); w.hackingSystem = new w.HackingSystem();
    w.tutorialSystem.active = true; w.tutorialSystem.storyChapter = 3;
    assert(w.hackingSystem.start()); frame();
    const elapsed = w.hackingSystem.sessionElapsedMs;
    tap(9); await new Promise(resolve => setImmediate(resolve)); frame(); assert(w.gameState.paused && w.hackingSystem.active, 'Options pauses an active hack without cancelling');
    frame(); assert.equal(w.hackingSystem.sessionElapsedMs, elapsed, 'pause freezes the hack session');
    tap(9); await new Promise(resolve => setImmediate(resolve)); frame();
    assert(!w.gameState.paused && w.hackingSystem.active, 'Options resumes the same hack');
    tap(1); assert(!w.hackingSystem.active);
  }
  // Hack meter and start() use the same real gates, including the short recovery.
  {
    const rig = createRig(), { w, context } = rig; controls(rig);
    load(context, 'src/game/hacking.js'); const hack = w.hackingSystem = new w.HackingSystem();
    let now = 10000; w.Date.now = () => now;
    w.tutorialSystem.active = true; w.tutorialSystem.storyChapter = 1;
    assert.equal(hack.getAvailability().state, 'locked'); assert(!hack.start());
    w.tutorialSystem.storyChapter = 3; assert.equal(hack.getAvailability().state, 'ready'); assert(hack.start());
    assert.equal(hack.getAvailability().state, 'active'); hack.cancel();
    w.tutorialSystem.active = false; hack.reset();
    assert.equal(hack.getAvailability().state, 'no-target'); assert(!hack.start());
    const enemy = new w.Enemy(1000, 784, 'virus'); Object.assign(enemy.position, { x: 1000, y: 784 });
    enemy.entranceComplete = true; enemy.spawnProtectionDuration = 0; enemy.spawnTimeMs = -10000; w.enemyManager.enemies = [enemy];
    w.player.grounded = false; assert.equal(hack.getAvailability().state, 'airborne'); assert(!hack.start());
    w.player.grounded = true; assert.equal(hack.getAvailability().state, 'ready'); assert(hack.start()); hack.cancel();
    assert.equal(hack.getAvailability().state, 'recharging'); assert.equal(hack.getAvailability().charge, 0); assert(!hack.start());
    now += 5000; assert.equal(hack.getAvailability().remainingMs, 5000); assert.equal(hack.getAvailability().charge, 0.5);
    now += 5000; assert.equal(hack.getAvailability().state, 'ready'); assert.equal(hack.getAvailability().charge, 1); assert(hack.start());
    hack.successPuzzle(); assert.equal(hack.getAvailability().state, 'linked'); assert.equal(hack.getAvailability().allySeconds, 8);
    assert(hack.start(), 'linked action releases ally even while cooldown remains'); assert.equal(hack.getAvailability().state, 'recharging');
    w.enemyManager.simulationTimeMs += 1100; now += 10000; assert(hack.start()); enemy.active = false;
    hack.successPuzzle(); assert.equal(hack.getAvailability().remainingMs, 1500); now += 750; assert.equal(hack.getAvailability().charge, 0.5);
    now += 750; assert.equal(hack.getAvailability().state, 'no-target');
    w.gameState.paused = true; assert.equal(hack.getAvailability().state, 'unavailable'); assert(!hack.start()); w.gameState.paused = false;
    hack.reset(); assert.equal(hack.getAvailability().charge, 1); assert.equal(hack.getAvailability().remainingMs, 0);
    const drawn = [], ctx = new Proxy({ fillText: value => drawn.push(String(value)) }, { get: (o,k) => o[k] || (() => {}), set: (o,k,v) => (o[k]=v,true) });
    w.BARCODE.ComicHUD.hack(ctx, hack.getAvailability(), false); assert(drawn.includes('NO TARGET')); assert(drawn.includes('CHARGED · MOVE NEAR AN ENEMY'));
  }
  console.log('Stage B: direct tutorial handoff, controller ownership, both real hack puzzles, pause/archive/calibration, saved offsets, follow camera, crowd commitments and boss counter/retry passed.');
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
