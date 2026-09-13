// Cinematic intro cutscene system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/cutscene.js',
  exports: ['CutsceneSystem', 'cutsceneSystem'],
  dependencies: ['BARCODE.IntroSequence']
});


function startGameplayMusicAndRhythm(audioSystem) {
  if (!audioSystem || typeof audioSystem.startMusicSystem !== 'function') return { ok: false, reason: 'missing-audio-system' };
  const result = audioSystem.startMusicSystem();
  if (!result || !result.ok) {
    console.error(`[cutscene] Gameplay music/rhythm startup did not complete: ${result && result.reason || 'unknown'}`);
    return result || { ok: false, reason: 'unknown-start-failure' };
  }
  if (typeof audioSystem.startBackgroundRhythmIfTransportRunning === 'function') {
    audioSystem.startBackgroundRhythmIfTransportRunning(result);
  } else if (window.rhythmSystem && typeof window.rhythmSystem.startBackgroundRhythm === 'function' && result.transport && result.transport.status === 'ok' && result.transport.running) {
    window.rhythmSystem.startBackgroundRhythm();
  }
  return result;
}

window.CutsceneSystem = class CutsceneSystem {
  constructor() {
    // Makko imports can omit the repository's binary paths. The pinned public
    // copy and bundled fallback contain the same approved artwork.
    this.cutsceneImages = window.BARCODE.IntroSequence.panels.map(panel => ({
      url: panel.asset, sources: [panel.hostedAsset, panel.asset],
      loaded: false, element: null, status: 'loading', source: null
    }));
    

    this.currentImageIndex = 0;
    this.isActive = false;
    this.canSkip = true;
    this.imageDisplayTime = 250; // Debounce a transition; reading pace belongs to the player.
    this.cutsceneContainer = null;
    this.introCanvas = null;
    this.introContext = null;
    this.transcriptElement = null;
    this.onComplete = null;
    this.inputDisabled = false;
    this.cutsceneGeneration = 0;
    this.ownedTimeouts = new Set();
    this.ownedIntervals = new Set();
    this.pendingImageLoads = new Set();
    this.skipHolds = new Map();
    this.skipHoldDuration = 5000;
    this.isSkipHoldActive = false;
    this.skipHoldProgress = 0;
  }

  trackTimeout(callback, delay) {
    const generation = this.cutsceneGeneration;
    const handle = setTimeout(() => {
      this.ownedTimeouts.delete(handle);
      if (generation === this.cutsceneGeneration) callback();
    }, delay);
    this.ownedTimeouts.add(handle);
    return handle;
  }

  trackInterval(callback, delay) {
    const generation = this.cutsceneGeneration;
    const handle = setInterval(() => {
      if (generation !== this.cutsceneGeneration) {
        clearInterval(handle); this.ownedIntervals.delete(handle); return;
      }
      callback();
    }, delay);
    this.ownedIntervals.add(handle);
    return handle;
  }

  clearOwnedCallbacks() {
    this.ownedTimeouts.forEach(handle => clearTimeout(handle));
    this.ownedIntervals.forEach(handle => clearInterval(handle));
    this.ownedTimeouts.clear(); this.ownedIntervals.clear();
    this.nextImageTimer = null; this.inputDisableTimer = null;
    this.containerRemovalTimer = null; this.fadeCompletionTimer = null;
    this.titleMusicUnblockTimer = null; this.fadeCheckInterval = null;
    this.controllerPoll = null;
  }

  cancelImageLoads() {
    for (const cancel of [...this.pendingImageLoads]) cancel();
  }

  // Missing/slow art cannot prevent reading or skipping the opening. Late
  // image callbacks cannot revive a destroyed scene or overwrite a new run.
  preloadImages() {
    return Promise.all(this.cutsceneImages.map(imageData => {
      if (imageData.loaded && imageData.element) return Promise.resolve();
      return new Promise(resolve => {
        let img = null, timeout = null, attempt = 0, settled = false;
        imageData.status = 'loading'; imageData.source = null;
        const detach = () => {
          if (timeout !== null) { clearTimeout(timeout); this.ownedTimeouts.delete(timeout); timeout = null; }
          if (img) { img.onload = null; img.onerror = null; }
        };
        const finish = (loaded, cancelled = false) => {
          if (settled) return; settled = true;
          detach();
          this.pendingImageLoads.delete(cancel);
          imageData.status = loaded ? 'ready' : cancelled ? 'cancelled' : 'unavailable';
          if (loaded) { imageData.loaded = true; imageData.element = img; imageData.source = imageData.sources[attempt - 1]; }
          else if (img) img.src = '';
          resolve();
        };
        const cancel = () => finish(false, true);
        const nextSource = () => {
          if (settled) return;
          detach();
          if (img) img.src = '';
          const source = imageData.sources[attempt++];
          if (!source) { finish(false); return; }
          // Each candidate is attempted once, including on timeout. Late
          // callbacks from a replaced image cannot settle another attempt.
          const current = img = new Image();
          current.crossOrigin = 'anonymous';
          current.onload = () => { if (!settled && img === current) finish(true); };
          current.onerror = () => { if (!settled && img === current) nextSource(); };
          timeout = this.trackTimeout(nextSource, 8000);
          current.src = source;
        };
        this.pendingImageLoads.add(cancel);
        nextSource();
      });
    }));
  }

  start() {
    if (this.isActive) return this.startPromise;
    this.cutsceneGeneration++;
    this.cancelImageLoads(); this.clearOwnedCallbacks(); this.endSkipHold();
    const generation = this.cutsceneGeneration;
    this.isActive = true; this.currentImageIndex = 0;
    window.BARCODE.IntroSequence.reset();
    window.inputManager?.resetActionEdges?.();
    this.startPromise = new Promise(resolve => { this.onComplete = resolve; });
    const audio = window.audioSystem;
    audio?.stopTitleScreenMusic?.();
    if (audio?.titleScreenSource) { try { audio.titleScreenSource.stop(); } catch (_) {} }
    if (audio?.titleScreenGain) audio.titleScreenGain.gain.value = 0;
    window.titleScreenMusicBlocked = true;
    audio?.playCutsceneMusic?.();
    this.createCutsceneContainer();
    this.showNextImage();
    this.preloadImages().then(() => {
      if (generation === this.cutsceneGeneration && this.isActive) this.drawCurrentPanel();
    });
    return this.startPromise;
  }

  createCutsceneContainer() {
    this.cutsceneContainer?.remove();
    const container = this.cutsceneContainer = document.createElement('div');
    container.id = 'barcode-intro';
    container.style.cssText = 'position:fixed;inset:0;background:#080b19;z-index:99999;display:flex;align-items:center;justify-content:center;overflow:hidden;';
    container.setAttribute('role', 'dialog'); container.setAttribute('aria-label', 'BARCODE opening transmission');
    const canvas = this.introCanvas = document.createElement('canvas');
    canvas.width = 1920; canvas.height = 1080;
    canvas.style.cssText = 'display:block;width:min(100vw,177.777778vh);height:min(100vh,56.25vw);object-fit:contain;';
    canvas.setAttribute('aria-hidden', 'true');
    // Acquire once per canvas, never from the 20 Hz paint/input poll. Some
    // hosts guard getContext calls even when a browser would return a cache.
    this.introContext = null;
    try { this.introContext = canvas.getContext('2d'); }
    catch (error) { console.warn('[intro] Canvas unavailable; using the readable transcript.', error?.message || error); }
    container.appendChild(canvas);
    const transcript = this.transcriptElement = document.createElement('div');
    transcript.setAttribute('aria-live', 'polite');
    transcript.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);';
    container.appendChild(transcript);
    const help = document.createElement('div');
    help.textContent = 'Space, Enter or click: next panel. Hold S or controller B for five seconds to skip the intro. Release to cancel. Left Arrow or D-pad Left inspects the displaced recovery caption.';
    help.style.cssText = transcript.style.cssText; container.appendChild(help);
    if (!this.introContext) {
      canvas.style.display = 'none';
      container.style.flexDirection = 'column';
      transcript.style.cssText = 'max-width:900px;padding:32px;color:#f0eadc;font:24px/1.6 sans-serif;';
      help.style.cssText = 'max-width:900px;padding:24px;color:#95ffe0;font:18px/1.6 monospace;';
    }
    // FullscreenManager owns the document root, so this stable DOM host stays
    // visible before/after fullscreen settles and through exit/re-entry. Never
    // put the overlay in the hidden game canvas's fallback-content subtree.
    document.body.appendChild(container);
    this.addEventListeners();
  }

  showNextImage() {
    if (!this.isActive) return;
    const panels = window.BARCODE.IntroSequence.panels;
    if (this.currentImageIndex >= panels.length) { this.endCutscene(); return; }
    const index = this.currentImageIndex++;
    this.currentImageStartTime = Date.now();
    this.transcriptElement.textContent = window.BARCODE.IntroSequence.transcript(index);
    this.disableInputTemporarily(this.imageDisplayTime);
    this.drawCurrentPanel();
  }

  drawCurrentPanel() {
    if (!this.isActive || !this.introCanvas) return;
    window.BARCODE.IntroSequence.draw(this.introContext, {
      index: this.currentImageIndex - 1, elapsedMs: Date.now() - this.currentImageStartTime,
      images: this.cutsceneImages, pad: !!window.BARCODE.GamepadUI?.connected,
      skipProgress: this.skipHoldProgress, holding: this.isSkipHoldActive
    });
  }

  inspectCaption() {
    if (!this.isActive) return false;
    const inspected = window.BARCODE.IntroSequence.inspect(this.currentImageIndex - 1);
    if (inspected) this.drawCurrentPanel();
    return inspected;
  }

  addEventListeners() {
    // One existing cutscene-owned poll drives controls, hold progress and the
    // restrained caption movement. No additional animation loop is installed.
    this.controllerPoll = this.trackInterval(() => {
      window.inputManager?.updateFrontend?.('intro');
      this.updateSkipHoldProgress(); this.drawCurrentPanel();
    }, 50);
    this.skipHandler = e => {
      const key = e.key?.toLowerCase();
      if (![' ', 'enter', 's', 'arrowleft'].includes(key) && e.type !== 'click') return;
      e.preventDefault(); e.stopPropagation?.();
      if (e.repeat) return;
      if (key === 's') this.startSkipHold('keyboard');
      else if (key === 'arrowleft') this.inspectCaption();
      else this.skipCutscene();
    };
    this.skipHoldEndHandler = e => { if (e.key?.toLowerCase() === 's') { e.preventDefault(); this.endSkipHold('keyboard'); } };
    this.blurHandler = () => this.endSkipHold();
    this.visibilityHandler = () => { if (document.hidden) this.endSkipHold(); };
    document.addEventListener('keydown', this.skipHandler);
    document.addEventListener('keyup', this.skipHoldEndHandler);
    document.addEventListener('visibilitychange', this.visibilityHandler);
    window.addEventListener('blur', this.blurHandler);
    this.cutsceneContainer.addEventListener('click', this.skipHandler);
  }

  removeEventListeners() {
    if (this.controllerPoll) { clearInterval(this.controllerPoll); this.ownedIntervals.delete(this.controllerPoll); this.controllerPoll = null; }
    if (this.skipHandler) {
      document.removeEventListener('keydown', this.skipHandler);
      document.removeEventListener('keyup', this.skipHoldEndHandler);
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      window.removeEventListener('blur', this.blurHandler);
      this.cutsceneContainer?.removeEventListener('click', this.skipHandler);
    }
    this.skipHandler = null; this.skipHoldEndHandler = null;
    this.visibilityHandler = null; this.blurHandler = null;
    this.endSkipHold();
  }

  skipCutscene() {
    if (this.canSkip && this.isActive && !this.inputDisabled) this.showNextImage();
  }

  disableInputTemporarily(duration) {
    this.inputDisabled = true;
    if (this.inputDisableTimer) { clearTimeout(this.inputDisableTimer); this.ownedTimeouts.delete(this.inputDisableTimer); }
    this.inputDisableTimer = this.trackTimeout(() => { this.inputDisabled = false; this.inputDisableTimer = null; }, duration);
  }

  // Each physical input owns its own continuous hold. A controller release or
  // disconnect must never cancel keyboard S (the PR39 regression).
  startSkipHold(source = 'keyboard') {
    if (!this.isActive || this.skipHolds.has(source)) return;
    this.skipHolds.set(source, Date.now()); this.isSkipHoldActive = true;
    this.updateSkipHoldProgress(); this.drawCurrentPanel();
  }

  endSkipHold(source = null) {
    if (source) this.skipHolds.delete(source); else this.skipHolds.clear();
    this.isSkipHoldActive = this.skipHolds.size > 0;
    if (!this.isSkipHoldActive) this.skipHoldProgress = 0;
  }

  updateSkipHoldProgress() {
    if (!this.isActive || !this.isSkipHoldActive) return;
    const started = Math.min(...this.skipHolds.values());
    this.skipHoldProgress = Math.min(1, (Date.now() - started) / this.skipHoldDuration);
    if (this.skipHoldProgress >= 1) { this.endSkipHold(); this.skipAllCutscene(); }
  }

  skipAllCutscene() {
    if (!this.isActive) return;
    this.currentImageIndex = window.BARCODE.IntroSequence.panels.length;
    this.endCutscene();
  }

  // End the cutscene and clean up
  endCutscene() {
    if (!this.isActive) return;
    
    console.log('🎬 Cutscene ended - starting game audio transition');
    
    // CRITICAL: DO NOT stop cutscene music immediately - keep it playing for smooth fade out
    console.log('🎬 Keeping cutscene music playing for smooth fade out');
    
    // Clear any pending timer
    if (this.nextImageTimer) {
      clearTimeout(this.nextImageTimer);
      this.nextImageTimer = null;
    }
    
    // Clear skip hold timers
    this.endSkipHold();
    
    this.isActive = false;
    this.cancelImageLoads();
    this.removeEventListeners();
    window.inputManager?.resetActionEdges?.();
    
    // Fade out and remove container
    if (this.cutsceneContainer) {
      this.cutsceneContainer.style.transition = 'opacity 0.5s ease-out';
      this.cutsceneContainer.style.opacity = '0';
      
      const removalContainer = this.cutsceneContainer;
      this.containerRemovalTimer = this.trackTimeout(() => {
        if (this.cutsceneContainer === removalContainer && removalContainer && removalContainer.parentNode) {
          removalContainer.remove();
          this.cutsceneContainer = null;
          this.introCanvas = null; this.introContext = null; this.transcriptElement = null;
        }
      }, 500);
    }
    
    // Call completion callback
    if (this.onComplete) {
      this.onComplete();
      this.onComplete = null;
    }
    
    // CRITICAL: Start fade out immediately when game begins - no delay
    // The cutscene music fades from 100% to 0% over exactly 4 seconds
    console.log('🎬 Cutscene complete - starting immediate 4-second fade out');
    
    // Store reference to prevent garbage collection and ensure music continues
    const audioSystem = window.audioSystem;
    
    if (!audioSystem || !audioSystem.cutsceneSource || !audioSystem.cutsceneGain) {
      console.log('🎬 Cutscene audio not available, skipping fade');
      // Start gameplay music immediately
      startGameplayMusicAndRhythm(audioSystem);
      return;
    }
    
    console.log('🎬 Starting fade immediately - no delay');
    console.log('🎬 Current gain value:', audioSystem.cutsceneGain.gain.value);
    console.log('🎬 Source playback state:', audioSystem.cutsceneSource ? 'active' : 'null');
    
    // Start fade immediately (no setTimeout delay)
    console.log('🎬 Starting 4-second fade out for cutscene music');
    
    // Double-check that we still have the audio nodes
    if (!audioSystem.cutsceneGain) {
      console.log('🎬 Cutscene gain lost, cannot fade');
      // Start gameplay music immediately
      startGameplayMusicAndRhythm(audioSystem);
      return;
    }
    
    const fadeStartTime = audioSystem.context.currentTime;
    const fadeDuration = 4; // Exactly 4 seconds
    const currentVolume = audioSystem.cutsceneGain.gain.value;
    
    // Ensure we start at full volume
    audioSystem.cutsceneGain.gain.value = currentVolume;
    
    console.log(`🎬 IMMEDIATE FADE START: Volume ${currentVolume.toFixed(3)} at time ${fadeStartTime.toFixed(3)}`);
    console.log(`🎬 Fading from 100% to 0% over exactly ${fadeDuration} seconds`);
    
    // Ensure the source is still playing and not being stopped
    if (audioSystem.cutsceneSource && currentVolume > 0.01) {
      console.log('🎬 Applying smooth exponential fade to gain node');
      
      // Use exponentialRampToValueAtTime for natural audio decay
      // Fade from current volume to 0.001 (near zero) over 4 seconds
      audioSystem.cutsceneGain.gain.exponentialRampToValueAtTime(0.001, fadeStartTime + fadeDuration);
      
      // Log fade progress
      this.fadeCheckInterval = this.trackInterval(() => {
        const currentTime = audioSystem.context.currentTime;
        const currentGain = audioSystem.cutsceneGain.gain.value;
        const elapsed = currentTime - fadeStartTime;
        
        if (elapsed < fadeDuration) {
          const percentageComplete = (elapsed / fadeDuration) * 100;
          console.log(`🎬 FADE PROGRESS: ${elapsed.toFixed(1)}/${fadeDuration}s (${percentageComplete.toFixed(0)}%), volume: ${currentGain.toFixed(4)}`);
        }
      }, 500);
      
      // Wait for fade to complete, then cleanup and start gameplay music
      this.fadeCompletionTimer = this.trackTimeout(() => {
        if (this.fadeCheckInterval) { clearInterval(this.fadeCheckInterval); this.ownedIntervals.delete(this.fadeCheckInterval); this.fadeCheckInterval = null; }
        
        const finalVolume = audioSystem.cutsceneGain.gain.value;
        console.log(`🎬 FADE COMPLETE: Final volume ${finalVolume.toFixed(4)} at 100%`);
        console.log('🎬 Smooth 4-second fade out transition finished');
        
        // Stop the cutscene music
        if (typeof audioSystem.stopCutsceneMusic === 'function') {
          audioSystem.stopCutsceneMusic();
          console.log('🎬 Cutscene music stopped after smooth fade');
        }
        
        // CRITICAL: Start music system and rhythm system simultaneously after fade
        // This ensures all layers and beat counter start at exactly the same time
        console.log('🎬 Starting music system - tracks will restart from beginning');
        const startupResult = startGameplayMusicAndRhythm(audioSystem);
        if (startupResult && startupResult.ok) {
          console.log('🎬 ALL MUSIC LAYERS RESTARTED FROM BEGINNING');
          console.log('🎬 Rhythm beat tracking now active - synchronized with fresh music start');
        }
        
        // CRITICAL: Clear the title screen music block AFTER game music starts
        // This prevents any race conditions where title music could restart
        this.titleMusicUnblockTimer = this.trackTimeout(() => {
          window.titleScreenMusicBlocked = false;
          console.log('🎬 titleScreenMusicBlocked cleared - game music now active');
        }, 1000);
      }, fadeDuration * 1000);
    } else {
      console.log('🎬 Cutscene source not available or volume too low, skipping fade');
      
      // Start gameplay music immediately
      startGameplayMusicAndRhythm(audioSystem);
    }
  }
  

  isPlaying() { return this.isActive; }

  getDiagnostics() {
    return { active: this.isActive, generation: this.cutsceneGeneration,
      panel: this.currentImageIndex, panelCount: window.BARCODE.IntroSequence.panels.length,
      timeouts: this.ownedTimeouts.size, intervals: this.ownedIntervals.size,
      imageLoads: this.pendingImageLoads.size, listenersAttached: !!this.skipHandler,
      hasContext: !!this.introContext,
      assets: this.cutsceneImages.map(image => ({ path: image.url, status: image.status, source: image.source })),
      hasContainer: !!this.cutsceneContainer, skipSources: [...this.skipHolds.keys()] };
  }

  destroy() {
    this.cutsceneGeneration++; this.isActive = false;
    this.removeEventListeners(); this.cancelImageLoads(); this.clearOwnedCallbacks();
    this.cutsceneContainer?.remove();
    this.cutsceneContainer = null; this.introCanvas = null; this.introContext = null; this.transcriptElement = null;
    if (this.onComplete) this.onComplete({ cancelled: true });
    this.onComplete = null;
  }
};

// Initialize global cutscene system
window.cutsceneSystem = null;

// Initialize cutscene system
window.initCutscene = function() {
  try {
    if (window.cutsceneSystem) {
      return true;
    }
    window.cutsceneSystem = new window.CutsceneSystem();
    console.log('✓ Cutscene system initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize cutscene system:', error?.message || error);
    return false;
  }
};
