// Boot system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/boot.js',
  exports: ['bootSystem', 'initGame'],
  dependencies: []
});

// Global boot system coordinates game initialization
window.bootSystem = {
  initialized: false,
  systems: new Map(),
  initQueue: [],
  
  // Register a system for initialization
  register(name, initFunction) {
    this.systems.set(name, {
      init: initFunction,
      initialized: false,
      priority: 0
    });
  },
  
  // Initialize all registered systems in dependency order
  async initAll() {
    if (this.initialized) {
      console.log('Boot system already initialized');
      return;
    }
    
    console.log('=== INITIALIZING GAME SYSTEMS ===');
    
    // Sort by priority
    const sortedSystems = Array.from(this.systems.entries())
      .sort(([,a], [,b]) => a.priority - b.priority);
    
    // Initialize each system
    for (const [name, system] of sortedSystems) {
      try {
        console.log(`Initializing ${name}...`);
        await system.init();
        system.initialized = true;
      } catch (error) {
        console.error(`Failed to initialize ${name}:`, error?.message || error);
      }
    }
    
    this.initialized = true;
    console.log('=== ALL SYSTEMS INITIALIZED ===');
  }
  
  // Queue system for deferred initialization
  queueInit(name, initFunction, priority = 0) {
    this.initQueue.push({ name, initFunction, priority });
    this.systems.set(name, {
      init: initFunction,
      initialized: false,
      priority
    });
  }
  
  // Start deferred initialization
  start() {
    if (this.initQueue.length > 0) {
      this.initAll();
    }
  }
};

// Global game initialization entry point
window.initGame = function() {
  console.log('Starting game initialization...');
  
  // Register core systems
  window.bootSystem.register('audio', async () => {
    if (window.audioSystem && typeof window.audioSystem.init === 'function') {
      console.log('🎵 Boot system: Initializing audio...');
      try {
        await window.audioSystem.init();
        console.log('🎵 Boot system: Audio initialization complete');
        
        // Wait a moment for title screen music to finish loading
        console.log('🎵 Boot system: Waiting for title screen music to finish loading...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Notify boot loader that audio is loaded
        if (window.bootLoader && typeof window.bootLoader.setAudioLoaded === 'function') {
          window.bootLoader.setAudioLoaded(true);
          console.log('🎵 Boot system: Notified boot loader that audio is loaded');
        }
        
        return Promise.resolve();
      } catch (error) {
        console.error('🎵 Boot system: Audio initialization failed:', error?.message || error);
        // Still notify that audio attempted to load - don't block boot sequence
        if (window.bootLoader && typeof window.bootLoader.setAudioLoaded === 'function') {
          window.bootLoader.setAudioLoaded(true); // Mark as attempted
        }
        return Promise.resolve();
      }
    }
    
    // Notify boot loader even if no audio system
    if (window.bootLoader && typeof window.bootLoader.setAudioLoaded === 'function') {
      window.bootLoader.setAudioLoaded(true);
    }
    
    return Promise.resolve();
  });
  
  window.bootSystem.register('sprites', async () => {
    if (window.MakkoEngine && typeof window.MakkoEngine.init === 'function') {
      console.log('🎮 Boot system: Loading sprites...');
      
      // Create timeout promise for sprite loading
      const spriteTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sprite loading timeout')), 15000); // 15 second timeout
      });
      
      const spriteLoadPromise = window.MakkoEngine.init('sprites-manifest.json').catch(error => {
        // Handle non-timeout errors
        if (!error?.message || !error.message.includes('timeout')) {
          console.error('Sprite loading error:', error?.message || error?.toString() || 'Unknown error');
        }
        throw error;
      });
      
      try {
        // Race between sprite loading and timeout
        await Promise.race([spriteLoadPromise, spriteTimeoutPromise]);
        console.log('🎮 Boot system: Sprites loaded successfully');
        
        // Notify boot loader that sprites are loaded
        if (window.bootLoader && typeof window.bootLoader.setSpritesLoaded === 'function') {
          window.bootLoader.setSpritesLoaded(true);
          console.log('🎮 Boot system: Notified boot loader that sprites are loaded');
        }
        
        return Promise.resolve();
      } catch (error) {
        if (error?.message && error.message.includes('timeout')) {
          console.warn('⚠️ Sprite loading timeout - proceeding with fallback graphics');
        } else {
          console.warn('Sprite loading failed - proceeding with fallback graphics:', error?.message || error?.toString() || 'Unknown error');
        }
        
        // Still notify that sprites attempted to load
        if (window.bootLoader && typeof window.bootLoader.setSpritesLoaded === 'function') {
          window.bootLoader.setSpritesLoaded(true); // Mark as attempted
        }
        
        return Promise.resolve(); // Continue without sprites
      }
    }
    
    // Notify boot loader even if no sprites to load
    if (window.bootLoader && typeof window.bootLoader.setSpritesLoaded === 'function') {
      window.bootLoader.setSpritesLoaded(true);
    }
    
    return Promise.resolve();
  });
  
  window.bootSystem.register('renderer', () => {
    if (window.renderer && typeof window.renderer === 'object') {
      window.renderer.postEffects = true;
      return Promise.resolve();
    }
    return Promise.resolve();
  });
  
  window.bootSystem.register('game', () => {
    if (typeof window.initGameState === 'function') {
      return window.initGameState();
    }
    return Promise.resolve();
  });
  
  // Start the boot sequence
  window.bootSystem.start();
};

// Global game state initialization
window.initGameState = function() {
  window.gameState = {
    running: false,
    paused: false,
    gameOver: false,
    level: 1,
    score: 0,
    gameTime: 0
  };
  
  // Reset player position
  if (window.player) {
    window.player.health = window.player.maxHealth;
    window.player.position = new window.Vector2D(200, 500);
    window.player.velocity = new window.Vector2D(0, 0);
  }
  
  // Clear enemy manager
  if (window.enemyManager) {
    window.enemyManager.clear();
  }
  
  // Reset objectives system
  if (window.objectivesSystem) {
    window.objectivesSystem.reset();
  }
  
  // Start the game
  window.startGame();
};