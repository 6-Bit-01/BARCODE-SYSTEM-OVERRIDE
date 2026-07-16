// Environmental Broadcast Jammer owner for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/jammer-environment.js',
  exports: ['BARCODE.JammerEnvironment'],
  dependencies: ['MakkoEngine']
});

window.BARCODE = window.BARCODE || {};

(function(namespace) {
  'use strict';

  function cloneStatus(state) {
    return Object.freeze({
      initialized: state.initialized,
      revealed: state.revealed,
      triggered: state.triggered,
      disposed: state.disposed,
      generation: state.generation,
      position: Object.freeze({ x: state.position.x, y: state.position.y }),
      hasSprite: !!state.sprite,
      hasAudio: !!state.audio
    });
  }

  const state = {
    initialized: false,
    revealed: false,
    triggered: false,
    disposed: false,
    generation: 0,
    position: { x: 3400, y: 750 },
    sprite: null,
    spriteReady: false,
    audio: null
  };

  function initSprite() {
    if (!window.MakkoEngine || !window.MakkoEngine.isLoaded || !window.MakkoEngine.isLoaded()) return;
    if (state.spriteReady) return;
    state.sprite = window.MakkoEngine.sprite('broadcast_jammer_broadcastjammer');
    if (state.sprite && state.sprite.isLoaded && state.sprite.isLoaded()) {
      state.spriteReady = true;
      if (state.sprite.play) state.sprite.play('broadcast_jammer_idle_idle', true);
    }
  }

  function initialize(options) {
    options = options || {};
    state.disposed = false;
    state.initialized = true;
    if (options.position) {
      state.position = { x: Number(options.position.x) || state.position.x, y: Number(options.position.y) || state.position.y };
    }
    initSprite();
    return cloneStatus(state);
  }

  function reveal(options) {
    initialize(options);
    state.revealed = true;
    if (window.jammerArrowIndicator && typeof window.jammerArrowIndicator.setTarget === 'function') {
      window.jammerArrowIndicator.setTarget({ position: state.position, active: true, environmental: true });
    }
    return cloneStatus(state);
  }

  function trigger(options) {
    reveal(options);
    state.triggered = true;
    return cloneStatus(state);
  }

  function reset() {
    state.generation += 1;
    state.revealed = false;
    state.triggered = false;
    state.disposed = false;
    if (state.audio && typeof state.audio.pause === 'function') state.audio.pause();
    if (window.jammerArrowIndicator && typeof window.jammerArrowIndicator.setTarget === 'function') window.jammerArrowIndicator.setTarget(null);
    return cloneStatus(state);
  }

  function dispose() {
    reset();
    state.disposed = true;
    state.initialized = false;
    state.sprite = null;
    state.spriteReady = false;
    state.audio = null;
    return cloneStatus(state);
  }

  function update(deltaTime) {
    if (!state.revealed || state.disposed) return cloneStatus(state);
    if (!state.spriteReady) initSprite();
    if (state.spriteReady && state.sprite && typeof state.sprite.update === 'function') state.sprite.update(deltaTime);
    return cloneStatus(state);
  }

  function draw(ctx) {
    if (!ctx || !state.revealed || state.disposed) return;
    ctx.save();
    if (state.spriteReady && state.sprite && typeof state.sprite.draw === 'function') {
      state.sprite.draw(ctx, state.position.x, state.position.y + 20, { scale: 1, flipH: false });
    } else {
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(state.position.x - 45, state.position.y - 120, 90, 120);
      ctx.fillStyle = '#ff00ff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BROADCAST JAMMER', state.position.x, state.position.y - 130);
    }
    ctx.restore();
  }

  function getStatus() { return cloneStatus(state); }
  function getDiagnostics() { return cloneStatus(state); }
  function getPosition() { return state.revealed && !state.disposed ? { x: state.position.x, y: state.position.y } : null; }

  namespace.JammerEnvironment = Object.freeze({ initialize, reveal, trigger, reset, dispose, update, draw, getStatus, getDiagnostics, getPosition });
})(window.BARCODE);
