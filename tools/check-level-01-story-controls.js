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
    tap(1); assert(w.rhythmSystem.isActive(), 'B binds the grounded R action'); tap(1); assert(!w.rhythmSystem.isActive());
    w.tutorialSystem.active = true; w.tutorialSystem.completed = false; w.tutorialSystem.storyChapter = 1;
    let advanced = 0; w.tutorialSystem.handleSpacePress = () => advanced++;
    frame(); tap(1); assert(!w.rhythmSystem.isActive(), 'B retains tutorial R lock');
    const y = w.player.position.y; tap(0); assert.strictEqual(advanced, 1); assert.strictEqual(w.player.position.y, y); assert(w.player.grounded, 'A advance cannot also jump');
    tap(5); assert(!w.player.grounded, 'RB provides the tutorial jump action');
    w.player.grounded = true; w.player.velocity.y = 0; w.tutorialSystem.active = false; frame();
    load(context, 'src/game/hacking.js'); w.hackingSystem = new w.HackingSystem();
    for (const type of [1, 2]) {
      w.hackingSystem.reset(); w.hackingSystem.cooldownUntil = 0;
      assert(w.hackingSystem.start()); w.hackingSystem.puzzleType = type; frame();
      // Advance the real boot and display phases; enter the generated answer.
      w.hackingSystem.update(1000); w.hackingSystem.update(w.hackingSystem.displayTime);
      assert.strictEqual(w.hackingSystem.phase, 'answer');
      const answer = w.hackingSystem.currentPuzzle.answer;
      const digitButtons = { '0': 5, '1': 0, '2': 13, '3': 1, '4': 14, '5': 4, '6': 15, '7': 2, '8': 12, '9': 3 };
      tap(digitButtons[String(answer)[0]]); tap(8); assert.strictEqual(w.hackingSystem.inputText, '', 'View erases');
      for (const digit of String(answer)) tap(digitButtons[digit]);
      assert.strictEqual(w.hackingSystem.inputText, String(answer));
      w.player.health = 1;
      const beforeHealth = w.player.health;
      tap(9); assert(!w.hackingSystem.active); assert.strictEqual(w.hackingSystem.resultFx.outcome, 'success');
      assert.strictEqual(w.player.health, Math.min(w.player.maxHealth, beforeHealth + 1), 'each puzzle repairs exactly one health bar');
      assert.strictEqual(w.player.velocity.y, 0, 'terminal digits do not jump');
    }
    w.hackingSystem.cooldownUntil = 0; w.hackingSystem.start(); frame(); tap(11); assert(!w.hackingSystem.active, 'R3 cancels the terminal');
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
    const menu = w.BARCODE.PauseMenu; assert(menu.open); assert.strictEqual(menu.focus, 7);
    tap(12); assert.strictEqual(menu.focus, 6); tap(0); assert.strictEqual(menu.view, 'archive');
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
  console.log('Stage B: direct tutorial handoff, controller ownership, both real hack puzzles, pause/archive/calibration, saved offsets, follow camera, crowd commitments and boss counter/retry passed.');
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
