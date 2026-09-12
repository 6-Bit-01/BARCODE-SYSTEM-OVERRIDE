// Saved presentation preferences and pause UI. Input and RAF remain owned by
// InputManager and RuntimeLifecycle; this module installs no event handlers.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/pause-menu.js', exports: ['BARCODE.Preferences', 'BARCODE.PauseMenu'], dependencies: [] });
(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const defaults = Object.freeze({ music: 1, sfx: 1, screenShake: true, flashes: true, crtPostEffects: true });
  const storageKey = 'barcode.presentation.v1';
  const preferences = BARCODE.Preferences = {
    values: { ...defaults }, saved: true,
    load() {
      try {
        const data = JSON.parse(window.localStorage?.getItem(storageKey) || '{}');
        for (const key of Object.keys(defaults)) {
          if (typeof defaults[key] === 'boolean' && typeof data?.[key] === 'boolean') this.values[key] = data[key];
          if (typeof defaults[key] === 'number' && Number.isFinite(data?.[key])) this.values[key] = Math.max(0, Math.min(1, data[key]));
        }
      } catch (_) { /* A blocked/corrupt store never prevents playing. */ }
      this.apply();
    },
    apply(audio = window.audioSystem) {
      window.BARCODE_RENDER_QUALITY = window.BARCODE_RENDER_QUALITY || {};
      for (const key of ['screenShake', 'flashes', 'crtPostEffects']) window.BARCODE_RENDER_QUALITY[key] = this.values[key];
      if (window.renderer) {
        window.renderer.postEffects = this.values.crtPostEffects;
        if (!this.values.screenShake) window.renderer.clearScreenShake?.();
        if (!this.values.flashes) { window.renderer.glitchIntensity = 0; window.renderer.chromaticAberration = 0; }
      }
      audio?.setMusicVolume?.(this.values.music);
      audio?.setSFXVolume?.(this.values.sfx);
      audio?.setRhythmVolume?.(this.values.sfx);
    },
    save() {
      try {
        if (!window.localStorage) throw new Error('storage unavailable');
        window.localStorage.setItem(storageKey, JSON.stringify(this.values)); this.saved = true;
      } catch (_) { this.saved = false; }
    },
    set(key, value) {
      if (!(key in defaults) || typeof value !== typeof defaults[key]) return;
      if (typeof value === 'number') { if (!Number.isFinite(value)) return; value = Math.round(Math.max(0, Math.min(1, value)) * 100) / 100; }
      this.values[key] = value; this.apply(); this.save();
    },
    restoreDefaults() { this.values = { ...defaults }; this.apply(); this.save(); }
  };
  const rows = [
    ['music', 'Music'], ['sfx', 'SFX'], ['screenShake', 'Screen shake'],
    ['flashes', 'Flash accents'], ['crtPostEffects', 'CRT effect'],
    ['resume', 'Resume game'], ['defaults', 'Reset settings']
  ];
  const menu = BARCODE.PauseMenu = {
    open: false, dirty: false, focus: 0, drag: null, heldKeys: new Set(), snapshot: null, resumePending: false, message: '',
    isPaused() { return !!(window.isPaused || window.gameState?.paused); },
    sync() {
      const paused = this.isPaused();
      if (paused === this.open) return;
      this.open = paused; this.drag = null; this.dirty = paused; this.message = '';
      window.inputManager?.resetActionEdges?.();
      if (paused) {
        this.focus = 5;
        const canvas = document.getElementById('gameCanvas');
        if (canvas && document.createElement) {
          this.snapshot ||= document.createElement('canvas');
          this.snapshot.width = canvas.width; this.snapshot.height = canvas.height;
          this.snapshot.getContext('2d')?.drawImage(canvas, 0, 0);
        }
      }
    },
    async resume() {
      if (this.resumePending || !this.isPaused()) return;
      this.resumePending = true;
      try {
        const result = await BARCODE.RuntimeLifecycle?.resume('pause-menu');
        if (!result?.ok) this.message = 'Could not resume audio. Press Resume to retry.';
      } catch (_) { this.message = 'Could not resume. Press Resume to retry.'; }
      this.resumePending = false; this.sync(); this.dirty = true;
    },
    activate(direction = 1) {
      const key = rows[this.focus][0];
      if (key === 'resume') { this.resume(); return; }
      if (key === 'defaults') preferences.restoreDefaults();
      else if (typeof defaults[key] === 'boolean') preferences.set(key, !preferences.values[key]);
      else preferences.set(key, preferences.values[key] + direction * 0.05);
      this.dirty = true;
    },
    keyDown(event) {
      this.sync();
      const key = event.key.toLowerCase();
      if (!this.open) return this.heldKeys.has(key);
      this.heldKeys.add(key); event.preventDefault?.();
      if (key === 'p' || key === 'escape') { if (!event.repeat) this.resume(); }
      else if (key === 'arrowdown' || key === 'arrowup' || key === 'tab') {
        const direction = key === 'arrowup' || (key === 'tab' && event.shiftKey) ? -1 : 1;
        this.focus = (this.focus + direction + rows.length) % rows.length; this.dirty = true;
      } else if (key === 'arrowleft' || key === 'arrowright') {
        if (this.focus < 2) this.activate(key === 'arrowleft' ? -1 : 1);
      } else if ((key === 'enter' || key === ' ') && !event.repeat) this.activate();
      return true;
    },
    keyUp(event) { this.heldKeys.delete(event.key.toLowerCase()); },
    pointer(event, phase) {
      this.sync();
      if (!this.open) return false;
      event.preventDefault?.();
      if (phase === 'up') { this.drag = null; return true; }
      const canvas = document.getElementById('gameCanvas'), rect = canvas?.getBoundingClientRect?.();
      if (!rect?.width || !rect?.height) return true;
      const x = (event.clientX - rect.left) * 1920 / rect.width, y = (event.clientY - rect.top) * 1080 / rect.height;
      if (phase === 'down') {
        const index = Math.floor((y - 365) / 68);
        if (x < 1020 || x > 1500 || index < 0 || index >= rows.length || y > 365 + index * 68 + 52) return true;
        this.focus = index; this.dirty = true;
        if (index < 2) this.drag = index; else this.activate();
      }
      if (this.drag !== null) { preferences.set(rows[this.drag][0], (x - 1260) / 190); this.dirty = true; }
      return true;
    },
    render() {
      this.sync();
      if (!this.open || !this.dirty) return;
      const canvas = document.getElementById('gameCanvas'), ctx = canvas?.getContext('2d');
      if (!ctx) return;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (this.snapshot) ctx.drawImage(this.snapshot, 0, 0); else { ctx.fillStyle = '#081321'; ctx.fillRect(0, 0, 1920, 1080); }
      this.draw(ctx); ctx.restore(); this.dirty = false;
    },
    draw(ctx) {
      ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(2,8,18,0.8)'; ctx.fillRect(0, 0, 1920, 1080);
      ctx.fillStyle = '#0a1827'; ctx.fillRect(380, 180, 1160, 765);
      ctx.strokeStyle = '#74f7d2'; ctx.lineWidth = 2; ctx.strokeRect(380, 180, 1160, 765);
      const text = (value, x, y, size = 22, color = '#d4dfec') => { ctx.font = `${size}px monospace`; ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(value, x, y); };
      text('PAUSED', 440, 250, 46, '#a0ffe4');
      text('Take a breath. Keep your signal.', 440, 307, 22);
      text('CONTROLS', 440, 392, 24, '#cfa2ff');
      ['A / D or Left / Right: Move', 'Space / W / Up: Jump', 'R: Enter Rhythm Mode', 'Down: Attack on the beat', 'H: Hack when unlocked', 'P: Pause'].forEach((line, i) => text(line, 440, 448 + i * 46, 21));
      text('RHYTHM MODE HOLDS YOUR STANCE', 440, 772, 20, '#a0ffe4');
      text('R or Escape exits so you can move.', 440, 810, 20);
      rows.forEach(([key, label], index) => {
        const y = 365 + index * 68, selected = index === this.focus;
        ctx.fillStyle = selected ? '#16394b' : '#0d2032'; ctx.fillRect(1020, y, 480, 52);
        if (selected) { ctx.strokeStyle = '#94ffe3'; ctx.strokeRect(1020, y, 480, 52); }
        text(label, 1038, y + 26, 20);
        if (index < 2) {
          ctx.fillStyle = '#334358'; ctx.fillRect(1260, y + 22, 190, 8);
          ctx.fillStyle = '#94ffe3'; ctx.fillRect(1260, y + 22, 190 * preferences.values[key], 8);
          ctx.fillRect(1257 + 190 * preferences.values[key], y + 15, 6, 22);
          text(`${Math.round(preferences.values[key] * 100)}`, 1460, y + 26, 17);
        } else if (index < 5) text(preferences.values[key] ? 'ON' : 'OFF', 1438, y + 26, 20, preferences.values[key] ? '#94ffe3' : '#b3a1c7');
      });
      text(this.message || (preferences.saved ? 'Settings save automatically.' : 'Settings apply now; saving is unavailable here.'), 440, 874, 19, '#cfa2ff');
      text('Tab / Up / Down: Select   Left / Right: Adjust   Enter: Choose   P / Esc: Resume', 440, 914, 18);
      ctx.restore();
    }
  };
  preferences.load();
})();
