// Low-level input adapter for BARCODE: System Override. Gameplay actions are owned by BARCODE.ActionInput.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/core/input.js', exports: ['InputManager', 'inputManager'], dependencies: ['BARCODE.ActionInput', 'BARCODE.PlayerCombat'] });

window.InputManager = class InputManager {
  constructor() {
    this.keys = {};
    this.pressedKeys = new Set();
    this.releasedKeys = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, pressed: false };
    this.gamepad = null;
    this.vibrationEnabled = true;
    this.hasTrackedMovement = false;
    this.hasTrackedJump = false;
    this.actionInput = window.BARCODE && window.BARCODE.ActionInput ? new window.BARCODE.ActionInput({ attach: false }) : null;
    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = true;
      this.pressedKeys.add(key);

      if (window.hackingSystem && window.hackingSystem.isActive && window.hackingSystem.isActive()) {
        if (typeof window.hackingSystem.processInput === 'function') window.hackingSystem.processInput(e.key);
      }
      if (e.shiftKey && e.key === 'F') { e.preventDefault(); if (window.fullscreenManager) window.fullscreenManager.toggle(); return; }
      if (e.key === ' ' && window.gameState && window.gameState.gameOver) {
        e.preventDefault();
        if (window.BARCODE && window.BARCODE.RuntimeLifecycle) window.BARCODE.RuntimeLifecycle.restart({ source: 'game-over-space' });
        this.resetActionEdges();
        return;
      }
      if (e.key === ' ' && window.tutorialSystem && typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive()) {
        e.preventDefault();
        if (!e.repeat && typeof window.tutorialSystem.handleSpacePress === 'function') window.tutorialSystem.handleSpacePress();
        this.resetActionEdges();
        return;
      }
      if (this.actionInput) this.actionInput.handleKeyDown(e);
      if (e.key === 'Escape' || e.key === 'ESC') {
        e.preventDefault();
        if (window.rhythmSystem && window.rhythmSystem.isActive && window.rhythmSystem.isActive()) {
          if (typeof window.rhythmSystem.hideRhythmMode === 'function') window.rhythmSystem.hideRhythmMode();
          else if (typeof window.rhythmSystem.hide === 'function') window.rhythmSystem.hide();
        }
      }
      if (window.DEBUG_KEYBOARD_ENABLED === true) this.handleDebugKey(e);
    });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; this.releasedKeys.add(e.key.toLowerCase()); if (this.actionInput) this.actionInput.handleKeyUp(e); });
    window.addEventListener('mousemove', (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    window.addEventListener('mousedown', () => { this.mouse.pressed = true; this.mouse.clicked = true; });
    window.addEventListener('mouseup', () => { this.mouse.pressed = false; });
    window.addEventListener('gamepadconnected', (e) => { this.gamepad = e.gamepad; });
    window.addEventListener('gamepaddisconnected', () => { this.gamepad = null; });
  }

  handleDebugKey(e) {
    const key = e.key.toLowerCase();
    if (key === 't' && window.handleGameAction) window.handleGameAction('skip_tutorial');
    if (key === 'l' && window.lostDataSystem && typeof window.lostDataSystem.forceSpawnFragment === 'function') window.lostDataSystem.forceSpawnFragment();
    if (key === 'c' && window.tutorialSystem && window.tutorialSystem.checkObjective) window.tutorialSystem.checkObjective('emergency_combat');
  }

  isKey(key) { return this.keys[key.toLowerCase()] || false; }
  isKeyPressed(key) { return this.pressedKeys.has(key.toLowerCase()); }
  isKeyReleased(key) { return this.releasedKeys.has(key.toLowerCase()); }
  getMovement() { const state = this.actionInput ? this.actionInput.state : {}; return { x: (state.move_right && state.move_right.held ? 1 : 0) - (state.move_left && state.move_left.held ? 1 : 0), y: 0 }; }
  updateGamepad() { const gamepads = navigator.getGamepads ? navigator.getGamepads() : []; this.gamepad = gamepads[0] || this.gamepad; }
  isGamepadButton(buttonIndex) { return this.gamepad && this.gamepad.buttons[buttonIndex] && this.gamepad.buttons[buttonIndex].pressed; }
  getGamepadMovement() { return this.getMovement(); }
  vibrate(intensity = 0.5, duration = 100) { if (this.vibrationEnabled && this.gamepad && this.gamepad.vibrationActuator) this.gamepad.vibrationActuator.playEffect('dual-rumble', { startDelay: 0, duration, weakMagnitude: intensity, strongMagnitude: intensity }); }

  update(options = {}) {
    this.updateGamepad();
    const actions = this.actionInput ? this.actionInput.update(options.context || {}) : null;
    if (actions) this.routeActions(actions, options);
    this.pressedKeys.clear();
    this.releasedKeys.clear();
    this.mouse.clicked = false;
  }

  updatePausedInput() {
    this.update({ inputOnly: true, context: { paused: true } });
  }

  resetActionEdges() {
    this.pressedKeys.clear();
    this.releasedKeys.clear();
    this.keys = {};
    if (this.actionInput && typeof this.actionInput.reset === 'function') this.actionInput.reset();
  }

  routeActions(actions, options = {}) {
    if (actions.pause.pressed && window.BARCODE && window.BARCODE.RuntimeLifecycle) window.BARCODE.RuntimeLifecycle.togglePause();
    if (actions.rhythm_mode && actions.rhythm_mode.pressed && window.rhythmSystem) {
      if (window.rhythmSystem.isActive && window.rhythmSystem.isActive()) {
        if (window.rhythmSystem.hideRhythmMode) window.rhythmSystem.hideRhythmMode(); else if (window.rhythmSystem.hide) window.rhythmSystem.hide();
      } else {
        const activation = window.rhythmSystem.showRhythmMode ? window.rhythmSystem.showRhythmMode() : (window.rhythmSystem.show ? window.rhythmSystem.show() : { ok: false, reason: 'unavailable' });
        const active = window.rhythmSystem.isActive && window.rhythmSystem.isActive();
        if (activation && activation.ok && active && window.tutorialSystem && window.tutorialSystem.isActive && window.tutorialSystem.isActive() && window.tutorialSystem.checkObjective) window.tutorialSystem.checkObjective('rhythm_start');
      }
    }
    if (options.inputOnly || !this.acceptsGameplay()) return;
    if (window.player) {
      if (actions.move_left.held) window.player.moveLeft();
      else if (actions.move_right.held) window.player.moveRight();
      else window.player.stopHorizontal();
      if ((actions.move_left.held || actions.move_right.held) && window.tutorialSystem && window.tutorialSystem.isActive && window.tutorialSystem.isActive() && !this.hasTrackedMovement) { this.hasTrackedMovement = true; window.tutorialSystem.checkObjective && window.tutorialSystem.checkObjective('movement'); }
      if (actions.jump.pressed) { const r = window.handleGameAction ? window.handleGameAction('jump') : { ok: window.player.jump() }; if (r && r.ok && window.tutorialSystem && window.tutorialSystem.checkObjective && !this.hasTrackedJump) { this.hasTrackedJump = true; window.tutorialSystem.checkObjective('jump'); } }
    }
    if (actions.primary.pressed && window.BARCODE && window.BARCODE.playerCombat) { const result = window.BARCODE.playerCombat.resolvePrimary({ player: window.player, enemyManager: window.enemyManager }); if (result.ok && result.targets.length) this.vibrate(0.35, 80); }
    if (actions.interact.pressed) this.routeInteract();
  }

  routeInteract() {
    if (window.rhythmSystem && typeof window.rhythmSystem.isActive === 'function' && window.rhythmSystem.isActive()) return { ok: false, action: 'interact', reason: 'rhythm-active' };
    if (window.player && window.player.grounded === false) return { ok: false, action: 'interact', reason: 'airborne' };
    const hacking = window.hackingSystem;
    if (hacking && typeof hacking.isActive === 'function' && hacking.isActive()) {
      if (typeof hacking.processInput === 'function') hacking.processInput('h');
      return { ok: true, action: 'interact', reason: 'hacking-active' };
    }
    if (hacking && typeof hacking.start === 'function') {
      hacking.start();
      const active = typeof hacking.isActive === 'function' ? hacking.isActive() : !!hacking.active;
      if (active && window.tutorialSystem && window.tutorialSystem.isActive && window.tutorialSystem.isActive() && window.tutorialSystem.checkObjective) window.tutorialSystem.checkObjective('hack_start');
      return { ok: !!active, action: 'interact', reason: active ? 'hack-started' : 'hack-not-started' };
    }
    return { ok: false, action: 'interact', reason: 'hacking-unavailable' };
  }
  acceptsGameplay() { if (window.sector1Progression && window.sector1Progression.isGameplaySuppressed && window.sector1Progression.isGameplaySuppressed()) return false; return !(window.isPaused || window.isRunning === false || (window.gameState && (window.gameState.paused || window.gameState.gameOver || window.gameState.victory || window.gameState.running === false)) || (window.hackingSystem && window.hackingSystem.isActive && window.hackingSystem.isActive())); }
};

function createInputManager() { if (document && document.addEventListener) window.inputManager = new window.InputManager(); else setTimeout(createInputManager, 100); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createInputManager); else createInputManager();
