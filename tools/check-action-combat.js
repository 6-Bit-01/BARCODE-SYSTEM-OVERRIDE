#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
function assert(cond, msg) { if (!cond) { console.error(`❌ ${msg}`); process.exit(1); } }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function createSandbox(extra = {}) {
  const listeners = { keydown: [], keyup: [], mousemove: [], mousedown: [], mouseup: [], gamepadconnected: [], gamepaddisconnected: [] };
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    Date,
    Math,
    setTimeout(fn) { return 1; },
    clearTimeout() {},
    performance: { now: () => 1000 },
    navigator: { getGamepads: () => [] },
    document: { readyState: 'loading', addEventListener(type, fn) { listeners[type] = listeners[type] || []; listeners[type].push(fn); }, getElementById: () => null, querySelector: () => null },
    window: null,
    ...extra
  };
  sandbox.window = sandbox;
  sandbox.window.FILE_MANIFEST = [];
  sandbox.window.addEventListener = (type, fn) => { listeners[type] = listeners[type] || []; listeners[type].push(fn); };
  sandbox.window.removeEventListener = (type, fn) => { listeners[type] = (listeners[type] || []).filter(item => item !== fn); };
  sandbox.__listeners = listeners;
  sandbox.window.distance = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
  vm.createContext(sandbox);
  return sandbox;
}
function load(sandbox, file) { vm.runInContext(read(file), sandbox, { filename: file }); }
function keyEvent(key, repeat = false) { return { key, repeat, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {} }; }

const staticFiles = {
  action: read('src/core/action-input.js'), input: read('src/core/input.js'), combat: read('src/game/player-combat.js'), rhythm: read('src/game/rhythm.js'), enemy: read('src/game/enemies.js'), player: read('src/game/player.js'), tutorial: read('src/game/tutorial.js'), debug: read('src/game/debug-commands.js'), loop: read('src/core/loop.js'), runtime: read('src/core/runtime-lifecycle.js')
};
assert(staticFiles.action.includes('BARCODE.ActionInput'), 'ActionInput exists');
assert(staticFiles.input.includes('new window.BARCODE.ActionInput({ attach: false })'), 'InputManager owns the single low-level keyboard listener and embeds ActionInput unattached');
assert(!/new window\.BARCODE\.ActionInput\(\)(?![\s\S]*attach: false)/.test(staticFiles.input), 'ActionInput is not independently attached by InputManager');
assert(staticFiles.loop.includes('updatePausedInput') && !/setInterval\(/.test(staticFiles.loop + staticFiles.action + staticFiles.input), 'Paused input uses existing RAF owner without intervals');
assert(!/isReady\(/.test(staticFiles.combat), 'PlayerCombat does not call nonexistent MusicTransport.isReady()');
assert(!/handleInput\('feedback-only'\)/.test(staticFiles.combat), 'PlayerCombat does not judge rhythm input a second time');
assert(staticFiles.rhythm.includes('applyResolvedAttackFeedback'), 'RhythmSystem exposes feedback-only resolved judgment hook');
assert(!/enemyManager\.checkPlayerAttacks/.test(staticFiles.rhythm) && !/damageBoss\(|takeDamage\(/.test(staticFiles.rhythm), 'RhythmSystem does not apply damage');
assert(!/takeDamage\(999\)|isStompPos|Check for Stomp/.test(staticFiles.enemy), 'No stomp-position instant-kill path remains');
assert(!/checkObjective\('combat'\)/.test(staticFiles.input), 'Primary press path does not complete tutorial combat');
assert(!/this\.state === 'rhythm'[\s\S]{0,180}velocity\.[xy]\s\*=/.test(staticFiles.player), 'Rhythm visualization state does not apply movement friction');
assert(!/rhythmActive\)[\s\S]{0,80}this\.state = 'rhythm'/.test(staticFiles.player), 'Player.updateState does not select rhythm merely because visualization is active');
assert(!/rhythm-active/.test(staticFiles.debug), 'Jump route does not reject rhythm visualization');
assert(staticFiles.runtime.includes('resetActionEdges') && staticFiles.runtime.includes('playerCombat.reset'), 'Runtime resets semantic input and combat state');

// Behavioral pause/resume and dialogue fixtures through InputManager + ActionInput.
{
  const s = createSandbox();
  let pauseToggles = 0;
  s.window.BARCODE = { RuntimeLifecycle: { togglePause() { pauseToggles++; } } };
  s.window.gameState = { running: true, paused: false, gameOver: false };
  s.window.isRunning = true;
  s.window.isPaused = false;
  load(s, 'src/core/action-input.js');
  load(s, 'src/core/input.js');
  const manager = new s.window.InputManager();
  assert((s.__listeners.keydown || []).length === 1, 'InputManager is the only keydown listener owner');
  assert(manager.actionInput.diagnostics().listenerCount === 0, 'ActionInput has no independent DOM listeners');
  manager.actionInput.handleKeyDown(keyEvent('p'));
  manager.update();
  assert(pauseToggles === 1, 'Keyboard P pauses once');
  manager.updatePausedInput();
  assert(pauseToggles === 1, 'Held P does not repeatedly toggle while paused');
  manager.actionInput.handleKeyUp(keyEvent('p'));
  manager.updatePausedInput();
  manager.actionInput.handleKeyDown(keyEvent('p'));
  manager.updatePausedInput();
  assert(pauseToggles === 2, 'Keyboard P resumes while paused');
  manager.resetActionEdges();
  let pad = { axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false })) };
  s.navigator.getGamepads = () => [pad];
  pad.buttons[9].pressed = true;
  manager.updatePausedInput();
  assert(pauseToggles === 3, 'Gamepad Start/button 9 toggles pause/resume');
  manager.updatePausedInput();
  assert(pauseToggles === 3, 'Held gamepad Start does not repeat');
}

{
  const s = createSandbox();
  let jumped = 0;
  let advanced = 0;
  s.window.BARCODE = { RuntimeLifecycle: { togglePause() {} } };
  s.window.gameState = { running: true, paused: false, gameOver: false };
  s.window.player = { jump() { jumped++; return true; }, moveLeft(){}, moveRight(){}, stopHorizontal(){} };
  s.window.handleGameAction = action => action === 'jump' ? { ok: s.window.player.jump() } : { ok: false };
  load(s, 'src/core/action-input.js');
  load(s, 'src/core/input.js');
  const manager = new s.window.InputManager();
  s.window.tutorialSystem = { isActive: () => true, canAdvanceDialogueWithInput: () => true, handleSpacePress() { advanced++; }, checkObjective() {} };
  s.__listeners.keydown[0](keyEvent(' '));
  manager.update();
  assert(advanced === 1 && jumped === 0, 'Space advances completed dialogue once and does not jump');
  s.__listeners.keydown[0](keyEvent(' ', true));
  manager.update();
  assert(advanced === 1 && jumped === 0, 'Held/repeated Space does not advance or jump after consumed dialogue press');
  s.__listeners.keyup[0](keyEvent(' '));
  manager.update();
  s.window.tutorialSystem.canAdvanceDialogueWithInput = () => false;
  s.__listeners.keydown[0](keyEvent(' '));
  manager.update();
  assert(jumped === 1, 'Space can jump during incomplete movement/objective gate');
  manager.update();
  assert(jumped === 1, 'Held Space jump remains edge-triggered');
}

// Tutorial canAdvanceDialogueWithInput truth table.
{
  const s = createSandbox();
  load(s, 'src/game/tutorial.js');
  const t = new s.window.TutorialSystem();
  t.active = true; t.readyToAdvance = true; t.dialogue = [{ text: 'gate', requiresObjectives: ['movement'] }]; t.currentDialogue = 0;
  assert(!t.canAdvanceDialogueWithInput(), 'Tutorial gate with incomplete objective cannot advance');
  t.completedObjectives.add('movement');
  assert(t.canAdvanceDialogueWithInput(), 'Tutorial gate with completed objective can advance');
}

// PlayerCombat timing behavior with fake transport, including synthetic profile rule IDs.
{
  const s = createSandbox();
  load(s, 'src/game/player-combat.js');
  s.window.gameState = { running: true };
  s.window.player = { position: { x: 0, y: 0 }, startPrimaryAttackAnimation() { this.attackStarted = true; } };
  const enemy = () => ({ active: true, position: { x: 10, y: 0 }, damage: [], takeDamage(d) { this.damage.push(d); } });
  const run = (timing, profile) => {
    const e = enemy();
    let calls = 0;
    s.window.enemyManager = { enemies: [e] };
    s.window.audioSystem = { context: { currentTime: 12 } };
    s.window.BARCODE.MusicProfiles = { getActive: () => profile || { judgmentRules: [{ id: 'synthetic.attack', target: 'quarter-note' }] } };
    s.window.BARCODE.MusicTransport = { judgeInput(ruleId, audioTimeSec) { calls++; assert(ruleId !== 'level-01.attack' || (profile && profile.judgmentRules[0].id === 'level-01.attack'), 'Synthetic profile does not inherit Level 1 rule id'); return timing; } };
    const combat = new s.window.BARCODE.PlayerCombat({ cooldownMs: 0, baseDamage: 4, range: 100 });
    const result = combat.resolvePrimary({ player: s.window.player, enemyManager: s.window.enemyManager });
    assert(calls <= 1, 'Judgment is calculated at most once per press');
    return { result, e };
  };
  assert(run({ available: true, timing: 'perfect' }).result.resolvedDamage === 6, 'Perfect resolves to 1.5x damage');
  assert(run({ available: true, timing: 'excellent' }).result.resolvedDamage === 5, 'Excellent resolves to 1.25x damage');
  assert(run({ available: true, timing: 'miss' }).result.resolvedDamage === 4, 'Miss resolves to base damage');
  assert(run({ available: false, timing: 'unavailable' }).result.resolvedDamage === 4, 'Unavailable resolves to base damage');
  assert(run({ available: false, timing: 'stopped' }).result.resolvedDamage === 4, 'Stopped transport resolves to base damage');
  const noGrid = run({ available: false, timing: 'unavailable' }, { judgmentRules: [] });
  assert(noGrid.result.resolvedDamage === 4, 'No-grid/no-rule profile resolves to base damage');
  const synthetic = run({ available: true, timing: 'perfect' }, { judgmentRules: [{ id: 'other-level.primary', target: 'quarter-note' }] });
  assert(synthetic.result.resolvedDamage === 6, 'Differently timed synthetic profile can resolve perfect without Level 1 constants');
}

// Runtime reset fixtures: stale held primary and combat cooldown are cleared.
{
  const s = createSandbox();
  load(s, 'src/core/action-input.js');
  load(s, 'src/game/player-combat.js');
  const input = new s.window.BARCODE.ActionInput({ attach: false });
  input.handleKeyDown(keyEvent('ArrowDown'));
  input.update();
  assert(input.pressed('primary'), 'Fixture primary starts pressed');
  input.reset();
  assert(!input.pressed('primary') && !input.held('primary'), 'ActionInput reset clears stale held/pressed state');
  const combat = new s.window.BARCODE.PlayerCombat({ cooldownMs: 1000 });
  combat.lastAttackAt = 999; combat.sequence = 8; combat.reset();
  assert(combat.lastAttackAt === -Infinity && combat.sequence === 0, 'PlayerCombat reset clears cooldown and sequence');
}

// Tutorial combat fixture mirrors authoritative defeat counter behavior.
{
  const s = createSandbox();
  load(s, 'src/game/tutorial.js');
  const t = new s.window.TutorialSystem();
  t.active = true; t.storyChapter = 1; t.objectives = [{ id: 'combat', completed: false }]; t.completedObjectives = new Set();
  let completions = 0;
  const original = t.checkObjective.bind(t);
  t.checkObjective = id => { if (id === 'combat' && !t.completedObjectives.has('combat')) completions++; return original(id); };
  assert(!t.completedObjectives.has('combat'), 'One primary press fixture starts incomplete');
  t._tutorialEnemiesDefeated = 1; assert(!t.completedObjectives.has('combat'), 'One hit/defeat does not complete combat');
  t._tutorialEnemiesDefeated = 2; assert(!t.completedObjectives.has('combat'), 'Two tutorial defeats do not complete combat');
  t._tutorialEnemiesDefeated = 3; t.checkObjective('combat'); t.checkObjective('combat');
  assert(t.completedObjectives.has('combat') && completions === 1, 'Three tutorial defeats complete combat exactly once');
}

console.log('PASS action/combat semantic contract behavior checks');
