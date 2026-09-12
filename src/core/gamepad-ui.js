// Contextual navigation, sampled by the existing title, intro and gameplay owners.
// No listeners, timers or animation loop belong to this module.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/core/gamepad-ui.js', exports: ['BARCODE.GamepadUI'], dependencies: [] });
(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  BARCODE.GamepadUI = {
    owner: null, previous: {}, blocked: new Set(), connected: false,
    read() {
      const pad = Array.from(navigator.getGamepads?.() || []).find(pad => pad?.connected !== false && pad?.mapping === 'standard');
      this.connected = !!pad;
      const held = {};
      for (let i = 0; i < 17; i++) held['b' + i] = !!pad?.buttons[i]?.pressed;
      held.up = held.b12 || (pad?.axes[1] || 0) < -0.55;
      held.down = held.b13 || (pad?.axes[1] || 0) > 0.55;
      held.left = held.b14 || (pad?.axes[0] || 0) < -0.55;
      held.right = held.b15 || (pad?.axes[0] || 0) > 0.55;
      return held;
    },
    reset() { this.previous = this.read(); this.blocked = new Set(Object.keys(this.previous).filter(key => this.previous[key])); },
    poll(owner) {
      const held = this.read(), changed = this.owner !== owner;
      if (changed) { this.blocked = new Set(Object.keys(held).filter(key => held[key])); this.owner = owner; }
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
