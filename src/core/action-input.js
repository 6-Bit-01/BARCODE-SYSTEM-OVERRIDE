// Semantic action input boundary for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/action-input.js',
  exports: ['BARCODE.ActionInput'],
  dependencies: []
});

(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const ACTIONS = ['move_left', 'move_right', 'jump', 'primary', 'interact', 'pause', 'rhythm_mode'];
  const EDGE_ACTIONS = new Set(['jump', 'primary', 'interact', 'pause', 'rhythm_mode']);
  const DEFAULT_KEYBOARD = {
    move_left: ['arrowleft', 'a'],
    move_right: ['arrowright', 'd'],
    jump: [' ', 'arrowup', 'w'],
    primary: ['arrowdown'],
    interact: ['h'],
    pause: ['p'],
    rhythm_mode: ['r']
  };
  const DEFAULT_GAMEPAD = {
    move_left: [{ axis: 0, dir: -1 }, { button: 14 }],
    move_right: [{ axis: 0, dir: 1 }, { button: 15 }],
    jump: [{ button: 0 }, { button: 5 }],
    primary: [{ button: 2 }],
    interact: [{ button: 3 }],
    pause: [{ button: 9 }],
    rhythm_mode: [{ button: 1 }]
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function keyName(eventOrKey) { return String(eventOrKey && eventOrKey.key !== undefined ? eventOrKey.key : eventOrKey).toLowerCase(); }
  function stateTemplate() { const out = {}; ACTIONS.forEach(action => out[action] = { held: false, pressed: false, released: false, suppressed: false }); return out; }

  class ActionInput {
    constructor(options = {}) {
      this.keyboardBindings = clone(options.keyboardBindings || DEFAULT_KEYBOARD);
      this.gamepadBindings = clone(options.gamepadBindings || DEFAULT_GAMEPAD);
      this.keysHeld = new Set();
      this.previousHeld = {};
      this.pendingPresses = {};
      this.state = stateTemplate();
      this.listenerCount = 0;
      this.disposed = false;
      this.suppression = { gameplayActive: true, paused: false, gameOver: false, cutscene: false, dialogue: false, stopped: false };
      this._keydown = e => this.handleKeyDown(e);
      this._keyup = e => this.handleKeyUp(e);
      if (options.attach === true) this.attach();
    }
    attach() { if (this.attached || !window.addEventListener) return; window.addEventListener('keydown', this._keydown); window.addEventListener('keyup', this._keyup); this.attached = true; this.listenerCount = 2; }
    dispose() { if (this.attached && window.removeEventListener) { window.removeEventListener('keydown', this._keydown); window.removeEventListener('keyup', this._keyup); } this.attached = false; this.listenerCount = 0; this.disposed = true; this.reset(); }
    reset() {
      this.keysHeld.clear(); this.previousHeld = {}; this.pendingPresses = {}; this.state = stateTemplate();
      this.blockGamepadUntilRelease();
    }
    blockGamepadUntilRelease() {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      this.gamepadReleaseRequired = new Set(ACTIONS.filter(action => this.gamepadHeld(action, pads)));
    }
    remap(action, bindings) { if (!ACTIONS.includes(action)) throw new Error(`Unknown action: ${action}`); this.keyboardBindings[action] = bindings.map(k => String(k).toLowerCase()); }
    capturePress(event) {
      const monotonicNow = window.performance?.now?.() ?? 0;
      const ageMs = Number.isFinite(event?.timeStamp) && event.timeStamp <= monotonicNow && monotonicNow - event.timeStamp < 1000
        ? monotonicNow - event.timeStamp : 0;
      const audioNow = window.audioSystem?.context?.currentTime;
      return { wallTimeMs: Date.now() - ageMs,
        audioTimeSec: Number.isFinite(audioNow) ? Math.max(0, audioNow - ageMs / 1000) : null };
    }
    handleKeyDown(event) {
      const key = keyName(event);
      if (this.isMappedKey(key) && event.preventDefault) event.preventDefault();
      if (this.keysHeld.has(key) || event?.repeat === true) return;
      for (const action of EDGE_ACTIONS) {
        if (!(this.keyboardBindings[action] || []).includes(key) || this.keyboardHeld(action)) continue;
        const queue = this.pendingPresses[action] ||= [];
        if (queue.length < 16) queue.push(this.capturePress(event));
      }
      this.keysHeld.add(key);
    }
    handleKeyUp(event) { const key = keyName(event); if (this.isMappedKey(key) && event.preventDefault) event.preventDefault(); this.keysHeld.delete(key); }
    isMappedKey(key) { return Object.values(this.keyboardBindings).some(list => list.includes(key)); }
    update(context = {}) {
      this.suppression = this.computeSuppression(context);
      const held = {};
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      ACTIONS.forEach(action => {
        const padHeld = this.gamepadHeld(action, pads);
        if (!padHeld) this.gamepadReleaseRequired?.delete(action);
        held[action] = this.keyboardHeld(action) || (padHeld && !this.gamepadReleaseRequired?.has(action));
      });
      this.state = stateTemplate();
      ACTIONS.forEach(action => {
        const wasHeld = !!this.previousHeld[action];
        const nowHeld = !!held[action];
        const suppressed = this.isSuppressed(action);
        const queued = this.pendingPresses[action] || [];
        const events = queued.length ? queued : nowHeld && !wasHeld ? [this.capturePress(null)] : [];
        this.state[action] = { held: suppressed ? false : nowHeld, pressed: !suppressed && events.length > 0,
          released: !suppressed && !nowHeld && (wasHeld || queued.length > 0), suppressed,
          presses: suppressed ? [] : events };
      });
      this.previousHeld = held;
      this.pendingPresses = {};
      return this.state;
    }
    keyboardHeld(action) { return (this.keyboardBindings[action] || []).some(key => this.keysHeld.has(key)); }
    gamepadHeld(action, pads = []) {
      return pads.some(pad => (this.gamepadBindings[action] || []).some(binding => {
        if (binding.button !== undefined) return !!(pad.buttons[binding.button] && pad.buttons[binding.button].pressed);
        if (binding.axis !== undefined) { const v = pad.axes[binding.axis] || 0; return binding.dir < 0 ? v < -0.25 : v > 0.25; }
        return false;
      }));
    }
    computeSuppression(context) {
      const runtimeState = BARCODE.RuntimeLifecycle && BARCODE.RuntimeLifecycle.getState ? BARCODE.RuntimeLifecycle.getState() : null;
      const gameState = window.gameState || {};
      const tutorial = window.tutorialSystem;
      return {
        gameplayActive: context.gameplayActive !== undefined ? !!context.gameplayActive : !(window.isRunning === false || gameState.running === false),
        paused: !!(context.paused || window.isPaused || gameState.paused || runtimeState === 'paused'),
        stopped: !!(context.stopped || runtimeState === 'stopped'),
        gameOver: !!(context.gameOver || gameState.gameOver),
        cutscene: !!(context.cutscene || window.cutsceneSystem?.isActive),
        dialogue: !!context.dialogue
      };
    }
    isSuppressed(action) {
      if (action === 'pause') return this.suppression.stopped || this.suppression.gameOver || this.suppression.cutscene || !this.suppression.gameplayActive;
      return this.suppression.paused || this.suppression.stopped || this.suppression.gameOver || this.suppression.cutscene || this.suppression.dialogue || !this.suppression.gameplayActive;
    }
    pressed(action) { return !!(this.state[action] && this.state[action].pressed); }
    held(action) { return !!(this.state[action] && this.state[action].held); }
    released(action) { return !!(this.state[action] && this.state[action].released); }
    diagnostics() { return { state: clone(this.state), keysHeld: Array.from(this.keysHeld), keyboardBindings: clone(this.keyboardBindings), gamepadBindings: clone(this.gamepadBindings), suppression: clone(this.suppression), listenerCount: this.listenerCount }; }
  }
  ActionInput.ACTIONS = ACTIONS;
  ActionInput.DEFAULT_KEYBOARD = DEFAULT_KEYBOARD;
  ActionInput.DEFAULT_GAMEPAD = DEFAULT_GAMEPAD;
  BARCODE.ActionInput = ActionInput;
})();
