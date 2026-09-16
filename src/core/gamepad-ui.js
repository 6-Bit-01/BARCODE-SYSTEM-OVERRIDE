// Shared controller selection, saved bindings and contextual navigation.
// Sampled by existing input owners; no listeners, timers or frame loop.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/core/gamepad-ui.js', exports: ['BARCODE.GamepadUI', 'BARCODE.ControllerSettings'], dependencies: [] });
(function() {
  const B = window.BARCODE = window.BARCODE || {};
  const defaults = { jump: 0, primary: 2, interact: 3, rhythm_mode: 4, inspect: 5 };
  const allowed = [0, 2, 3, 4, 5, 6, 7, 10, 11];
  const storageKey = 'barcode.controller.v1';
  const settings = B.ControllerSettings = {
    bindings: { ...defaults }, deadzone: 0.2, labels: 'auto', vibration: true, saved: true,
    load() {
      try {
        const data = JSON.parse(window.localStorage?.getItem(storageKey) || '{}');
        if (Number.isFinite(data.deadzone)) this.deadzone = Math.max(0.1, Math.min(0.5, data.deadzone));
        if (['auto', 'playstation', 'xbox'].includes(data.labels)) this.labels = data.labels;
        if (typeof data.vibration === 'boolean') this.vibration = data.vibration;
        const values = Object.keys(defaults).map(key => data.bindings?.[key]);
        if (values.every(value => allowed.includes(value)) && new Set(values).size === values.length) this.bindings = Object.fromEntries(Object.keys(defaults).map(key => [key, data.bindings[key]]));
      } catch (_) { /* Corrupt or unavailable storage never prevents play. */ }
    },
    save() {
      try {
        if (!window.localStorage) throw new Error('unavailable');
        window.localStorage.setItem(storageKey, JSON.stringify({ bindings: this.bindings, deadzone: this.deadzone, labels: this.labels, vibration: this.vibration })); this.saved = true;
      } catch (_) { this.saved = false; }
      B.GamepadUI?.reset(); window.inputManager?.actionInput?.reset();
    },
    bind(action, button) {
      if (!(action in defaults) || !allowed.includes(button)) return false;
      const conflict = Object.keys(defaults).find(key => key !== action && this.bindings[key] === button);
      if (conflict) this.bindings[conflict] = this.bindings[action];
      this.bindings[action] = button; this.save(); return true;
    },
    setDeadzone(value) { if (Number.isFinite(value)) { this.deadzone = Math.round(Math.max(0.1, Math.min(0.5, value)) * 100) / 100; this.save(); } },
    restore() { this.bindings = { ...defaults }; this.deadzone = 0.2; this.labels = 'auto'; this.vibration = true; this.save(); },
    button(index) {
      const ps = this.labels === 'playstation' || (this.labels === 'auto' && /dualsense|dualshock|playstation|sony|054c/i.test(B.GamepadUI?.pad?.id || ''));
      const names = ps ? ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Create', 'Options', 'L3', 'R3'] : ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Start', 'LS', 'RS'];
      return names[index] || 'D-pad';
    },
    prompt(action, keyboard) { return B.GamepadUI?.connected ? this.button(this.bindings[action]) : keyboard; },
    menuHelp() { return `D-pad: Select / Adjust   ${this.button(0)}: Choose   ${this.button(1)}: Back   ${this.button(9)}: Resume`; }
  };
  settings.load();
  B.GamepadUI = {
    owner: null, previous: {}, blocked: new Set(), connected: false, pad: null, unsupported: false, axes: [0, 0], deviceChanged: false,
    selectPad() {
      const pads = Array.from(navigator.getGamepads?.() || []).filter(p => p && p.connected !== false);
      const selected = pads.find(p => p.mapping === 'standard' && this.pad && p.index === this.pad.index && p.id === this.pad.id) || pads.find(p => p.mapping === 'standard') || null;
      const changed = !!selected !== !!this.pad || !!selected && (selected.index !== this.pad?.index || selected.id !== this.pad?.id);
      this.unsupported = !selected && pads.length > 0;
      if (changed) { this.deviceChanged = true; this.axes = [0, 0]; this.previous = {}; }
      this.pad = selected; this.connected = !!selected; return selected;
    },
    axis(index) {
      const value = this.pad?.axes[index] || 0, old = this.axes[index] || 0;
      const threshold = old && Math.sign(value) === old ? Math.max(0.05, settings.deadzone - 0.05) : settings.deadzone;
      return this.axes[index] = Math.abs(value) > threshold ? Math.sign(value) : 0;
    },
    read() {
      const pad = this.selectPad(), held = {};
      for (let i = 0; i < 17; i++) held['b' + i] = !!pad?.buttons[i]?.pressed;
      const x = this.axis(0), y = this.axis(1);
      held.up = held.b12 || y < 0; held.down = held.b13 || y > 0;
      held.left = held.b14 || x < 0; held.right = held.b15 || x > 0;
      return held;
    },
    reset() { this.previous = this.read(); this.blocked = new Set(Object.keys(this.previous).filter(key => this.previous[key])); },
    poll(owner) {
      const held = this.read(), changed = this.owner !== owner || this.deviceChanged;
      if (changed) { this.blocked = new Set(Object.keys(held).filter(key => held[key])); this.owner = owner; this.deviceChanged = false; }
      const pressed = {};
      for (const key of Object.keys(held)) {
        if (!held[key]) this.blocked.delete(key);
        pressed[key] = held[key] && !this.previous[key] && !this.blocked.has(key);
      }
      this.previous = held;
      return { pressed, held, changed, connected: this.connected };
    }
  };
})();
