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
      targetable: state.targetable,
      health: state.health,
      maxHealth: state.maxHealth,
      destroyed: state.destroyed,
      destructionNotified: state.destructionNotified,
      disposed: state.disposed,
      generation: state.generation,
      position: Object.freeze({ x: state.position.x, y: state.position.y }),
      hasSprite: !!state.sprite,
      spriteReady: !!state.spriteReady,
      spriteRequested: !!state.spriteRequested,
      spriteRequestCount: state.spriteRequestCount,
      hasAudio: !!state.audio,
      presentation: Object.freeze({ drawScale: state.presentation.drawScale, drawOffsetY: state.presentation.drawOffsetY })
    });
  }

  const state = {
    initialized: false,
    revealed: false,
    triggered: false,
    targetable: false,
    health: 16,
    maxHealth: 16,
    destroyed: false,
    destructionNotified: false,
    lastDamageSequence: null,
    disposed: false,
    generation: 0,
    position: { x: 3400, y: 750 },
    presentation: Object.freeze({ drawScale: 0.7, drawOffsetY: 190 }),
    sprite: null,
    spriteReady: false,
    spriteRequested: false,
    spriteRequestGeneration: -1,
    spriteRequestCount: 0,
    audio: null,
    destructionEffectStarted: false
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
    if (!state.spriteReady && state.sprite && state.sprite.isLoaded && state.sprite.isLoaded()) {
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
    state.targetable = true;
    state.destroyed = false;
    state.health = state.maxHealth;
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
  }

  function reset() {
    state.generation += 1;
    state.revealed = false;
    state.triggered = false;
    state.targetable = false;
    state.health = state.maxHealth;
    state.destroyed = false;
    state.destructionNotified = false;
    state.lastDamageSequence = null;
    state.destructionEffectStarted = false;
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

  function canReceiveRhythmDamage() { return state.initialized && state.revealed && state.targetable && !state.destroyed && !state.disposed; }

  function applyRhythmDamage(options) {
    options = options || {};
    if (!canReceiveRhythmDamage()) return { ok: false, reason: 'not-targetable', status: cloneStatus(state) };
    if (options.sequence !== undefined && state.lastDamageSequence === options.sequence) return { ok: false, reason: 'duplicate-sequence', status: cloneStatus(state) };
    if (!(options.timing === 'perfect' || options.timing === 'excellent')) return { ok: false, reason: 'bad-timing', status: cloneStatus(state) };
    state.lastDamageSequence = options.sequence;
    state.health = Math.max(0, state.health - 1);
    if (state.health === 0 && !state.destroyed) {
      state.destroyed = true;
      state.targetable = false;
      state.revealed = false;
      if (!state.destructionEffectStarted && window.particleSystem) {
        state.destructionEffectStarted = true;
        if (typeof window.particleSystem.impact === 'function') window.particleSystem.impact(state.position.x, state.position.y, '#ff00ff', 40);
        if (typeof window.particleSystem.spawnEffect === 'function') window.particleSystem.spawnEffect(state.position.x, state.position.y);
      }
      if (!state.destructionNotified) {
        state.destructionNotified = true;
        if (window.sector1Progression && typeof window.sector1Progression.onJammerDestroyed === 'function') window.sector1Progression.onJammerDestroyed();
      }
    }
    return { ok: true, damage: 1, destroyed: state.destroyed, status: cloneStatus(state) };
  }

  function draw(ctx) {
    if (!ctx || state.destroyed || !state.revealed || state.disposed) return;
    ctx.save();
    if (state.spriteReady && state.sprite && typeof state.sprite.draw === 'function') {
      const drawY = state.position.y + state.presentation.drawOffsetY;
      state.sprite.draw(ctx, state.position.x, drawY, { scale: state.presentation.drawScale, flipH: false });
    } else {
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      const fallbackY = state.position.y + state.presentation.drawOffsetY;
      const fallbackWidth = 90 * state.presentation.drawScale;
      const fallbackHeight = 120 * state.presentation.drawScale;
      ctx.strokeRect(state.position.x - fallbackWidth / 2, fallbackY - fallbackHeight, fallbackWidth, fallbackHeight);
      ctx.fillStyle = '#ff00ff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('BROADCAST JAMMER', state.position.x, fallbackY - fallbackHeight - 10);
    }
    if (state.targetable) {
      const barW = 140; const barH = 12; const hp = state.health / state.maxHealth; const barY = state.position.y + 65;
      ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(state.position.x - barW / 2, barY, barW, barH);
      ctx.fillStyle = '#ff00ff'; ctx.fillRect(state.position.x - barW / 2, barY, barW * hp, barH);
      ctx.strokeStyle = '#00ffff'; ctx.strokeRect(state.position.x - barW / 2, barY, barW, barH);
      ctx.fillStyle = '#ffffff'; ctx.font = '12px monospace'; ctx.textAlign = 'center'; ctx.fillText(`${state.health}/${state.maxHealth}`, state.position.x, barY - 4);
    }
    ctx.restore();
  }

  function getStatus() { return cloneStatus(state); }
  function getDiagnostics() { return cloneStatus(state); }
  function getPosition() { return state.revealed && !state.disposed ? { x: state.position.x, y: state.position.y } : null; }
  function getAimBounds() {
    if (!state.revealed || state.destroyed || state.disposed) return null;
    const scale = state.presentation.drawScale;
    const anchorY = state.position.y + state.presentation.drawOffsetY;
    return {
      x: state.position.x - 128 * scale,
      y: anchorY - 214 * scale,
      width: 256 * scale,
      height: 219 * scale
    };
  }

  namespace.JammerEnvironment = Object.freeze({ initialize, reveal, trigger, reset, dispose, update, draw, canReceiveRhythmDamage, applyRhythmDamage, getStatus, getDiagnostics, getPosition, getAimBounds });
})(window.BARCODE);
