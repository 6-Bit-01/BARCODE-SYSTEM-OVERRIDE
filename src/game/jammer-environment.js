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
      spriteReady: !!state.spriteReady,
      spriteRequested: !!state.spriteRequested,
      spriteRequestCount: state.spriteRequestCount,
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
    spriteRequested: false,
    spriteRequestGeneration: -1,
    spriteRequestCount: 0,
    audio: null
  };

  function pollSpriteReady() {
    if (state.disposed || !state.initialized) return;
    if (!window.MakkoEngine || !window.MakkoEngine.isLoaded || !window.MakkoEngine.isLoaded()) return;
    if (!state.spriteRequested) {
      state.spriteRequested = true;
      state.spriteRequestGeneration = state.generation;
      state.spriteRequestCount += 1;
      state.sprite = window.MakkoEngine.sprite('broadcast_jammer_broadcastjammer');
    }
    if (state.spriteRequestGeneration !== state.generation || state.disposed) return;
    if (state.sprite && state.sprite.isLoaded && state.sprite.isLoaded()) {
      state.spriteReady = true;
      if (state.sprite.play) state.sprite.play('broadcast_jammer_idle_idle', true);
    }
  }

  function initialize(options) {
    options = options || {};
    if (state.disposed) state.disposed = false;
    state.initialized = true;
    if (options.position) {
      state.position = { x: Number(options.position.x) || state.position.x, y: Number(options.position.y) || state.position.y };
    }
    pollSpriteReady();
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

  function invalidatePresentation() {
    state.sprite = null;
    state.spriteReady = false;
    state.spriteRequested = false;
    state.spriteRequestGeneration = -1;
    if (state.audio && typeof state.audio.pause === 'function') state.audio.pause();
    state.audio = null;
    if (window.jammerArrowIndicator && typeof window.jammerArrowIndicator.setTarget === 'function') window.jammerArrowIndicator.setTarget(null);
  }

  function reset() {
    if (!state.revealed && !state.triggered && !state.spriteRequested && !state.spriteReady) return cloneStatus(state);
    state.generation += 1;
    state.revealed = false;
    state.triggered = false;
    state.disposed = false;
    invalidatePresentation();
    return cloneStatus(state);
  }

  function dispose() {
    if (state.disposed && !state.initialized && !state.revealed && !state.triggered && !state.spriteRequested) return cloneStatus(state);
    reset();
    state.disposed = true;
    state.initialized = false;
    return cloneStatus(state);
  }

  function update(deltaTime) {
    if (!state.revealed || state.disposed) return cloneStatus(state);
    pollSpriteReady();
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
