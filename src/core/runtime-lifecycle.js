// Runtime lifecycle owner for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/runtime-lifecycle.js',
  exports: ['BARCODE.RuntimeLifecycle'],
  dependencies: ['startGameInitialization', 'startGameLoop', 'pauseGame', 'resumeGame', 'stopGame', 'AudioSystem', 'BARCODE.MusicTransport']
});

window.BARCODE = window.BARCODE || {};

(function(namespace) {
  'use strict';

  const STATES = Object.freeze({ IDLE: 'idle', STARTING: 'starting', RUNNING: 'running', PAUSED: 'paused', STOPPING: 'stopping', FAILED: 'failed' });
  const ALLOWED_TRANSITIONS = Object.freeze({
    idle: Object.freeze(['starting']),
    starting: Object.freeze(['running', 'failed']),
    running: Object.freeze(['paused', 'stopping']),
    paused: Object.freeze(['running', 'stopping']),
    failed: Object.freeze(['starting', 'stopping']),
    stopping: Object.freeze(['idle'])
  });

  let state = STATES.IDLE;
  let generation = 0;
  let transitionInFlight = null;
  let lastFailure = null;
  const cleanupRegistry = [];

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function serializeError(error) { return { message: error && error.message || String(error), name: error && error.name || 'Error', stack: error && error.stack || null }; }

  function canTransition(from, to) { return (ALLOWED_TRANSITIONS[from] || []).includes(to); }

  function projectCompatibility() {
    const running = state === STATES.RUNNING;
    const paused = state === STATES.PAUSED;
    window.isRunning = running || paused;
    window.isPaused = paused;
    if (window.gameState) {
      window.gameState.running = running;
      window.gameState.paused = paused;
    }
  }

  function transition(to, reason) {
    if (!canTransition(state, to)) return { ok: false, status: 'invalid-transition', from: state, to, generation, reason };
    const from = state;
    state = to;
    if (to === STATES.STARTING || to === STATES.STOPPING || to === STATES.FAILED) generation++;
    projectCompatibility();
    return { ok: true, status: 'transitioned', from, to, state, generation, reason };
  }

  function getSnapshot() { return Object.freeze(clone({ state, generation, transitionInFlight: !!transitionInFlight, lastFailure })); }
  function getState() { return state; }

  function restoreRetryUi() {
    if (window.titleScreen && typeof window.titleScreen.show === 'function') window.titleScreen.show();
    const overlay = document.getElementById('startOverlay');
    if (overlay) { overlay.classList.remove('hidden'); overlay.style.display = ''; overlay.style.opacity = ''; }
    const button = document.getElementById('startButton');
    if (button) { button.disabled = false; button.textContent = 'START SYSTEM'; }
    const loading = document.getElementById('loadingIndicator');
    if (loading) { loading.textContent = 'INITIALIZATION FAILED'; loading.style.color = '#ff0000'; loading.classList.add('visible'); }
  }

  function resetRetryUi() {
    const loading = document.getElementById('loadingIndicator');
    if (loading) { loading.textContent = 'INITIALIZING SYSTEM...'; loading.style.color = ''; loading.classList.remove('visible'); }
    const button = document.getElementById('startButton');
    if (button) { button.disabled = false; button.textContent = 'START SYSTEM'; }
  }

  function initRuntimeSystems() {
    if (typeof window.initParallax === 'function') window.initParallax();
    if (typeof window.initSpaceShips === 'function') window.initSpaceShips();
    if (typeof window.initLore === 'function') window.initLore();
    if (typeof window.initLostData === 'function') window.initLostData(window.player || null);
    if (typeof window.initCutscene === 'function') window.initCutscene();
    if (typeof window.initJammerIndicator === 'function') window.initJammerIndicator();
    if (window.player && typeof window.initSector1Progression === 'function') window.initSector1Progression(window.player);
    if (typeof window.initObjectives === 'function') window.initObjectives();
  }

  function resetRunState(options) {
    options = options || {};
    if (typeof window.initGameState === 'function' && !options.preserveProgress) window.initGameState();
    if (window.inputManager) { window.inputManager.hasTrackedMovement = false; window.inputManager.hasTrackedJump = false; }
    if (window.player) {
      window.player.health = window.player.maxHealth;
      window.player.position = new window.Vector2D(200, 500);
      window.player.velocity = new window.Vector2D(0, 0);
      if (typeof window.player.startEntranceAnimation === 'function') window.player.startEntranceAnimation();
    }
    if (window.enemyManager && typeof window.enemyManager.clear === 'function') window.enemyManager.clear();
    if (window.objectivesSystem) {
      if (typeof window.objectivesSystem.reset === 'function') window.objectivesSystem.reset();
      if (window.objectivesSystem.objectiveUI) window.objectivesSystem.objectiveUI.visible = true;
      window.objectivesSystem.active = true;
    }
    if (window.sector1Progression && typeof window.sector1Progression.reset === 'function') {
      const currentEnemyCount = window.sector1Progression.enemiesDefeated || 0;
      window.sector1Progression.reset(currentEnemyCount >= 20);
    }
    if (window.hackingSystem && typeof window.hackingSystem.reset === 'function') window.hackingSystem.reset();
  }

  async function runInitializer(options) {
    options = options || {};
    if (!options.restart) resetRetryUi();
    if (!options.restart && window.titleScreen && typeof window.titleScreen.hide === 'function') window.titleScreen.hide();
    const loading = document.getElementById('loadingIndicator');
    if (loading && !options.restart) loading.classList.add('visible');
    const button = document.getElementById('startButton');
    if (button && !options.restart) { button.disabled = true; button.textContent = 'INITIALIZING...'; }

    if (typeof window.startGameInitialization === 'function') await window.startGameInitialization({ restart: !!options.restart });
    if (window.audioSystem && typeof window.audioSystem.stopTitleScreenMusic === 'function') window.audioSystem.stopTitleScreenMusic();
    window.titleScreenMusicBlocked = true;
    initRuntimeSystems();

    if (!options.restart) {
      const overlay = document.getElementById('startOverlay');
      if (overlay) overlay.classList.add('hidden');
      const canvas = document.getElementById('gameCanvas');
      if (canvas) canvas.style.display = 'none';
      if (window.cutsceneSystem && typeof window.cutsceneSystem.start === 'function') await window.cutsceneSystem.start();
      if (canvas) canvas.style.display = 'block';
      const topbar = document.querySelector('.topbar');
      const hint = document.querySelector('.hint');
      if (topbar) topbar.style.display = 'flex';
      if (hint) hint.style.display = 'block';
      if (window.tutorialSystem && typeof window.tutorialSystem.startTutorial === 'function') window.tutorialSystem.startTutorial();
      if (loading) loading.classList.remove('visible');
    }

    resetRunState({ preserveProgress: !!options.restart });
    if (typeof window.startGameLoop === 'function') window.startGameLoop();
    return { ok: true, status: 'started', state, generation };
  }

  function joinOrReject(kind, equivalent) {
    if (!transitionInFlight) return null;
    if (transitionInFlight.kind === equivalent) return transitionInFlight.promise;
    return Promise.resolve({ ok: false, status: 'transition-in-flight', requested: kind, active: transitionInFlight.kind, state, generation });
  }

  function start(options) {
    options = options || {};
    const joined = options.internal ? null : joinOrReject('start', 'start');
    if (joined) return joined;
    if (state === STATES.RUNNING || state === STATES.PAUSED) return Promise.resolve({ ok: true, status: 'already-started', state, generation });
    const t = transition(state === STATES.FAILED ? STATES.STOPPING : STATES.STARTING, 'start');
    if (!t.ok && state !== STATES.FAILED) return Promise.resolve(t);
    let runGeneration = generation;
    const promise = (async function() {
      try {
        if (state === STATES.STOPPING) transition(STATES.IDLE, 'failed-cleanup-before-retry');
        if (state === STATES.IDLE) transition(STATES.STARTING, 'start');
        runGeneration = generation;
        if (transitionInFlight) transitionInFlight.generation = runGeneration;
        await runInitializer(options);
        if (generation !== runGeneration || state !== STATES.STARTING) return { ok: false, status: 'stale-start', state, generation };
        return transition(STATES.RUNNING, 'start-complete');
      } catch (error) {
        if (generation === runGeneration && state === STATES.STARTING) {
          lastFailure = serializeError(error);
          cleanupFailedGeneration();
          transition(STATES.FAILED, 'start-failed');
          restoreRetryUi();
        }
        return { ok: false, status: 'failed', state, generation, diagnostic: lastFailure };
      } finally { transitionInFlight = null; }
    })();
    transitionInFlight = { kind: 'start', generation: runGeneration, promise };
    return promise;
  }

  function cleanupFailedGeneration() { stopOwnedResources({ failed: true, stopMusic: true }); }

  function retry() { return start({ retry: true }); }

  function restart(options) {
    options = Object.assign({}, options, { restart: true });
    const joined = joinOrReject('restart', 'restart');
    if (joined) return joined;
    if (state !== STATES.RUNNING && state !== STATES.PAUSED) return Promise.resolve({ ok: false, status: 'invalid-restart-state', state, generation });
    const promise = (async function() {
      const stopResult = await stop('restart', { restart: true, stopMusic: false });
      if (!stopResult.ok) return stopResult;
      options.internal = true;
      return start(options);
    })().finally(() => { transitionInFlight = null; });
    transitionInFlight = { kind: 'restart', generation, promise };
    return promise;
  }

  async function pause(reason) {
    if (state === STATES.PAUSED) return { ok: true, status: 'already-paused', state, generation };
    if (state !== STATES.RUNNING) return { ok: false, status: 'invalid-pause-state', state, generation };
    if (typeof window.pauseGame === 'function') window.pauseGame();
    try {
      if (window.audioSystem && typeof window.audioSystem.pauseRuntimeAudio === 'function') await window.audioSystem.pauseRuntimeAudio();
    } catch (error) { return { ok: false, status: 'audio-pause-failed', state, generation, diagnostic: serializeError(error) }; }
    return transition(STATES.PAUSED, reason || 'pause');
  }

  async function resume(reason) {
    if (state === STATES.RUNNING) return { ok: true, status: 'already-running', state, generation };
    if (state !== STATES.PAUSED) return { ok: false, status: 'invalid-resume-state', state, generation };
    try {
      if (window.audioSystem && typeof window.audioSystem.resumeRuntimeAudio === 'function') await window.audioSystem.resumeRuntimeAudio();
    } catch (error) { return { ok: false, status: 'audio-resume-failed', state, generation, diagnostic: serializeError(error) }; }
    const result = transition(STATES.RUNNING, reason || 'resume');
    if (result.ok && typeof window.resumeGame === 'function') window.resumeGame();
    return result;
  }

  function togglePause() { return state === STATES.PAUSED ? resume('toggle') : pause('toggle'); }

  function stopOwnedResources(options) {
    options = options || {};
    if (typeof window.stopGame === 'function') window.stopGame();
    if (window.assetLoadingMonitor && typeof window.assetLoadingMonitor.cleanup === 'function') window.assetLoadingMonitor.cleanup();
    if (window.cutsceneSystem && typeof window.cutsceneSystem.destroy === 'function') window.cutsceneSystem.destroy();
    if (window.rhythmSystem && typeof window.rhythmSystem.hideRhythmMode === 'function') window.rhythmSystem.hideRhythmMode();
    if (window.hackingSystem && typeof window.hackingSystem.reset === 'function') window.hackingSystem.reset();
    if (window.audioSystem && typeof window.audioSystem.stopRuntimeAudio === 'function') window.audioSystem.stopRuntimeAudio({ stopMusic: options.stopMusic !== false });
    cleanupRegistry.splice(0).forEach(cleanup => { try { cleanup(); } catch (error) {} });
    if (window.particleSystem && Array.isArray(window.particleSystem.particles)) window.particleSystem.particles.length = 0;
    projectCompatibility();
  }

  async function stop(reason, options) {
    options = options || {};
    if (state === STATES.IDLE) return { ok: true, status: 'already-idle', state, generation };
    if (!canTransition(state, STATES.STOPPING)) return { ok: false, status: 'invalid-stop-state', state, generation };
    transition(STATES.STOPPING, reason || 'stop');
    stopOwnedResources(options);
    return transition(STATES.IDLE, reason || 'stop-complete');
  }

  function getDiagnostics() {
    const transport = namespace.MusicTransport && typeof namespace.MusicTransport.getDiagnostics === 'function' ? namespace.MusicTransport.getDiagnostics() : null;
    return Object.freeze(clone({
      lifecycle: getSnapshot(),
      gameplayLoop: { running: !!window.isRunning, paused: !!window.isPaused, rafScheduled: window.gameLoopRafHandle !== null },
      musicTransport: transport,
      audioContextState: window.audioSystem && typeof window.audioSystem.getContextState === 'function' ? window.audioSystem.getContextState() : 'unavailable',
      ownedCounts: { cleanups: cleanupRegistry.length },
      active: { title: !!(window.titleScreen && window.titleScreen.isVisible), cutscene: !!(window.cutsceneSystem && window.cutsceneSystem.isPlaying), rhythm: !!(window.rhythmSystem && window.rhythmSystem.isActive && window.rhythmSystem.isActive()), gameplayMusic: !!(window.audioSystem && window.audioSystem.layersStarted) },
      instances: { parallax: window.parallaxBackground ? 1 : 0, spaceships: window.spaceShipSystem ? 1 : 0, lore: window.loreSystem ? 1 : 0, lostData: window.lostDataSystem ? 1 : 0, objectives: window.objectivesSystem ? 1 : 0, tutorial: window.tutorialSystem ? 1 : 0, hacking: window.hackingSystem ? 1 : 0, sectorProgression: window.sector1Progression ? 1 : 0, jammerIndicator: window.jammerIndicator ? 1 : 0 }
    }));
  }

  namespace.RuntimeLifecycle = Object.freeze({ STATES, ALLOWED_TRANSITIONS, getState, getSnapshot, start, retry, restart, pause, resume, togglePause, stop, getDiagnostics, projectCompatibility });
})(window.BARCODE);
