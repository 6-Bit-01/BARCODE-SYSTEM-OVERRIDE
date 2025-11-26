// Boot Loader System - Terminal-style initialization screen
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/boot-loader.js',
  exports: ['BootLoader', 'bootLoader'],
  dependencies: []
});

window.BootLoader = class BootLoader {
  constructor() {
    this.element = null;
    this.isActive = false;
    this.loadingSteps = [];
    this.currentStep = 0;
    this.assetsLoaded = false;
    this.audioLoaded = false;
    this.spritesLoaded = false;
  }

  createBootScreen() {
    // Create terminal-style loading overlay
    this.element = document.createElement('div');
    this.element.id = 'bootLoader';
    this.element.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: #000000 !important;
      color: #00ff00 !important;
      font-family: 'Share Tech Mono', 'Courier New', monospace !important;
      font-size: 14px !important;
      z-index: 3000 !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: flex-start !important;
      align-items: flex-start !important;
      padding: 40px !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      line-height: 1.4 !important;
    `;

    // Terminal header
    const header = document.createElement('div');
    header.innerHTML = `
      <div style="color: #00ff00; margin-bottom: 20px;">
        <div style="color: #00ffff; font-weight: bold; font-size: 16px;">BARCODE: SYSTEM OVERRIDE v1.0</div>
        <div style="color: #00ff00; font-size: 12px; opacity: 0.8;">BOOT SEQUENCE INITIATED</div>
        <div style="color: #00ff00; font-size: 10px; opacity: 0.6;">====================</div>
      </div>
    `;
    this.element.appendChild(header);

    // Terminal output area
    this.terminalOutput = document.createElement('div');
    this.terminalOutput.id = 'terminalOutput';
    this.terminalOutput.style.cssText = `
      flex: 1;
      width: 100%;
      max-width: 800px;
      overflow-y: hidden;
      font-size: 12px;
      line-height: 1.6;
    `;
    this.element.appendChild(this.terminalOutput);

    // Add to body
    document.body.appendChild(this.element);
    this.isActive = true;

    // Initialize loading steps
    this.initializeLoadingSteps();
  }

  initializeLoadingSteps() {
    this.loadingSteps = [
      { text: 'Initializing kernel...', type: 'system' },
      { text: 'Loading system modules...', type: 'system' },
      { text: 'Mounting file systems...', type: 'system' },
      { text: 'Establishing network protocols...', type: 'network' },
      { text: 'Initializing audio subsystem...', type: 'audio', check: () => this.audioLoaded },
      { text: 'Loading sprite assets...', type: 'sprites', check: () => this.spritesLoaded },
      { text: 'Calibrating rendering pipeline...', type: 'graphics' },
      { text: 'Synchronizing game state...', type: 'system' },
      { text: 'Boot sequence complete.', type: 'success' }
    ];
  }

  async startBootSequence() {
    if (!this.element) {
      this.createBootScreen();
    }

    // Clear any existing output
    this.terminalOutput.innerHTML = '';

    // Type out boot steps with realistic timing
    for (let i = 0; i < this.loadingSteps.length; i++) {
      const step = this.loadingSteps[i];
      await this.typeLine(`> ${step.text}`, step.type);
      
      // Wait for async assets to load if this step requires it
      if (step.check) {
        await this.waitForAssetLoad(step.check, step.type);
        await this.typeLine(`  ✓ Complete`, 'success');
      } else {
        // Simulate processing time (faster boot)
        await this.delay(Math.random() * 400 + 100);
      }
      
      // Add some random code/output between major steps
      if (i < this.loadingSteps.length - 1 && Math.random() > 0.6) {
        await this.addRandomCodeOutput();
      }
    }

    // Final success message (faster)
    await this.delay(200);
    await this.typeLine('\n> System ready. Loading interface...', 'success');
    
    // Transition to title screen (faster)
    await this.delay(500);
    this.transitionToTitleScreen();
  }

  async typeLine(text, type = 'normal') {
    const line = document.createElement('div');
    line.style.marginBottom = '2px';
    
    // Set color based on type
    const colors = {
      normal: '#00ff00',
      system: '#00ffff',
      network: '#ffff00',
      audio: '#ff00ff',
      sprites: '#00ffaa',
      graphics: '#ff8800',
      success: '#00ff00',
      warning: '#ffaa00',
      error: '#ff0000'
    };
    
    line.style.color = colors[type] || colors.normal;
    this.terminalOutput.appendChild(line);

    // Typing effect
    for (let i = 0; i < text.length; i++) {
      line.textContent += text[i];
      
      // Auto-scroll to bottom
      this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
      
      // Vary typing speed for realism (faster)
      const delay = Math.random() > 0.9 ? 50 : (Math.random() * 15 + 5);
      await this.delay(delay);
    }
  }

  async addRandomCodeOutput() {
    const codeSnippets = [
      '  [OK] Memory allocation: 64MB',
      '  [OK] CPU threads: 8 active',
      '  [OK] Display buffer: 1920x1080',
      '  [OK] Audio buffer: 44100Hz',
      '  [OK] Network latency: 12ms',
      '  [OK] Cache hit rate: 94.2%',
      '  [OK] Render pipeline: DirectX 11',
      '  [OK] Physics engine: Box2D v2.3',
      '  [OK] Shader compiler: GLSL 4.5',
      '  [OK] Texture compression: DXT5',
      '  [INFO] Loading asset package...',
      '  [INFO] Decompressing audio files...',
      '  [INFO] Optimizing sprite sheets...',
      '  [INFO] Calculating collision meshes...',
      '  [WARN] High memory usage detected',
      '  [INFO] Garbage collection scheduled',
      '  [OK] Particle system initialized',
      '  [OK] Pathfinding grid generated'
    ];

    const snippet = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
    await this.typeLine(snippet, 'normal');
  }

  async waitForAssetLoad(checkFunction, assetType) {
    const maxWaitTime = 15000; // 15 seconds max wait
    const checkInterval = 100;
    let elapsed = 0;

    while (!checkFunction() && elapsed < maxWaitTime) {
      await this.delay(checkInterval);
      elapsed += checkInterval;

      // Show progress dots every second
      if (elapsed % 1000 === 0) {
        const dots = '.'.repeat(Math.floor(elapsed / 1000) % 4);
        const lastLine = this.terminalOutput.lastElementChild;
        if (lastLine && !lastLine.textContent.includes('✓')) {
          const baseText = lastLine.textContent.replace(/\.*$/, '');
          lastLine.textContent = baseText + dots;
        }
      }
    }

    if (!checkFunction()) {
      // Timeout - show warning but continue gracefully
      await this.typeLine(`  ⚠ Timeout loading ${assetType} - using fallback`, 'warning');
    }
  }

  transitionToTitleScreen() {
    // Fade out terminal
    this.element.style.transition = 'opacity 1s ease-out';
    this.element.style.opacity = '0';

    setTimeout(() => {
      // Remove boot screen
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.isActive = false;

      // Show title screen
      const startOverlay = document.getElementById('startOverlay');
      if (startOverlay) {
        startOverlay.style.display = 'flex';
        startOverlay.style.opacity = '0';
        
        // Fade in title screen
        setTimeout(() => {
          startOverlay.style.transition = 'opacity 1.5s ease-in';
          startOverlay.style.opacity = '1';
          
          // CRITICAL: Start title screen music with robust initialization logic
          console.log('🎵 Boot loader completed - starting title screen music...');
          
          // Start title screen music immediately when title screen appears
          setTimeout(() => {
            const startTitleScreenMusic = () => {
              console.log('🎵 Attempting to start title screen music...');
              
              if (!window.audioSystem) {
                console.warn('⚠️ Audio system not available - creating it now');
                if (window.AudioContext || window.webkitAudioContext) {
                  window.audioSystem = new window.AudioSystem();
                }
              }
              
              if (!window.audioSystem) {
                console.error('❌ Cannot create audio system - Web Audio API not supported');
                return;
              }
              
              // Initialize audio system if needed (no delays for faster boot)
              if (!window.audioSystem.isInitialized()) {
                console.log('🎵 Initializing audio system...');
                window.audioSystem.init().then(() => {
                  console.log('🎵 Audio system initialized, playing title music immediately...');
                  playTitleMusic(); // Remove delay for immediate playback
                }).catch(error => {
                  console.error('❌ Audio initialization failed:', error);
                  playTitleMusic(); // Try immediately even if failed
                });
              } else {
                playTitleMusic();
              }
              
              function playTitleMusic() {
                if (!window.audioSystem || !window.audioSystem.titleScreenMusic) {
                  console.log('🎵 Title screen music not loaded yet, trying to load it...');
                  if (window.audioSystem && typeof window.audioSystem.loadTitleScreenMusic === 'function') {
                    window.audioSystem.loadTitleScreenMusic().then(() => {
                      setTimeout(playTitleMusic, 1000);
                    }).catch(() => {
                      setTimeout(playTitleMusic, 2000);
                    });
                  }
                  return;
                }
                
                if (!window.audioSystem.titleScreenMusic.isLoaded) {
                  console.log('🎵 Title screen music still loading, trying to load now...');
                  if (window.audioSystem && typeof window.audioSystem.loadTitleScreenMusic === 'function') {
                    window.audioSystem.loadTitleScreenMusic().then(() => {
                      console.log('🎵 Title music loaded, playing immediately...');
                      playTitleMusic();
                    }).catch(() => {
                      console.log('🎵 Failed to load title music, trying anyway...');
                      playTitleMusic();
                    });
                  } else {
                    playTitleMusic(); // Try anyway
                  }
                  return;
                }
                
                try {
                  console.log('🎵 All checks passed - playing title screen music!');
                  window.audioSystem.playTitleScreenMusic();
                  console.log('🎵 Title screen music should now be playing!');
                } catch (error) {
                  console.error('❌ Failed to play title screen music:', error?.message || error);
                  // Try one more time after user interaction
                  document.addEventListener('click', function playOnClick() {
                    console.log('🎵 User interaction detected - retrying title music...');
                    try {
                      if (window.audioSystem && window.audioSystem.playTitleScreenMusic) {
                        window.audioSystem.playTitleScreenMusic();
                        document.removeEventListener('click', playOnClick);
                      }
                    } catch (e) {
                      console.error('Still failed:', e?.message || e);
                    }
                  }, { once: true });
                }
              }
            };
            
            startTitleScreenMusic();
          }, 100); // Reduced delay for immediate music start
        }, 100);
      }
    }, 1000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Asset loading status setters
  setAudioLoaded(loaded = true) {
    this.audioLoaded = loaded;
  }

  setSpritesLoaded(loaded = true) {
    this.spritesLoaded = loaded;
  }

  setAssetsLoaded(loaded = true) {
    this.assetsLoaded = loaded;
  }

  isActive() {
    return this.isActive;
  }

  // Force hide boot screen (for emergency cases)
  forceHide() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.isActive = false;
    
    // Show title screen immediately
    const startOverlay = document.getElementById('startOverlay');
    if (startOverlay) {
      startOverlay.style.display = 'flex';
      startOverlay.style.opacity = '1';
    }
  }
};

// Create global boot loader instance
window.bootLoader = new window.BootLoader();