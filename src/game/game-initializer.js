// Game initialization for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/game-initializer.js',
  exports: ['initAudio', 'initSprites', 'startGameInitialization'],
  dependencies: ['player', 'enemyManager', 'hackingSystem', 'rhythmSystem', 'objectivesSystem', 'tutorialSystem', 'sector1Progression', 'BroadcastJammerSystem', 'jammerIndicator', 'lostDataSystem', 'spaceShipSystem', 'loreSystem']
});

// Initialize audio system first
window.initAudio = async function() {
  console.log('=== INITIALIZING AUDIO SYSTEM ===');
  
  if (!window.audioSystem) {
    console.log('Creating audio system...');
    if (window.AudioContext || window.webkitAudioContext) {
      window.audioSystem = new window.AudioSystem();
      console.log('Audio system created successfully');
    } else {
      console.error('Web Audio API not supported');
      return;
    }
  }
  
  if (!window.audioSystem) {
    console.log('Audio system not available - waiting for initialization...');
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (window.audioSystem && window.audioSystem.isInitialized()) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    }).catch(error => {
      console.warn('Audio system initialization promise rejected:', error?.message || error);
    });
    
    if (!window.audioSystem || !window.audioSystem.isInitialized()) {
      console.log('Audio system failed to load after timeout');
      if (!window.audioSystem) {
        window.audioSystem = {
          isInitialized: () => false,
          musicTracks: {},
          updateVisualization: () => {},
          updateLayers: () => {}
        };
      }
      return;
    }
  }
  
  if (!window.audioSystem.musicTracks) {
    window.audioSystem.musicTracks = {};
    console.log('Created musicTracks object');
  }
  
  if (window.audioSystem.isInitialized()) {
    console.log('Audio system already initialized');
    return;
  }
  
  console.log('=== INITIALIZING AUDIO SYSTEM ===');
  
  try {
    await window.audioSystem.init();
    console.log('✓ Audio system initialized successfully');
    console.log('✓ Audio context state:', window.audioSystem.getContextState());
    console.log('✓ Master gain value:', window.audioSystem.masterGain?.gain?.value || 'undefined');
    console.log('✓ Music gain value:', window.audioSystem.musicGain?.gain?.value || 'undefined');
    console.log('✓ Available music tracks:', Object.keys(window.audioSystem.musicTracks));
    
  } catch (error) {
    console.log('⚠️ Audio system initialization failed:', error);
    console.error('Error details:', error?.stack || 'No stack available');
  }
};

// Initialize sprite system with MakkoEngine
window.initSprites = async function() {
  console.log('=== INITIALIZING SPRITE SYSTEM ===');
  
  try {
    if (!window.MakkoEngine) {
      console.warn('MakkoEngine not loaded - waiting...');
      await new Promise(resolve => setTimeout(resolve, 500)).catch(error => {
        console.warn('MakkoEngine loading promise rejected:', error?.message || error);
      });
      if (!window.MakkoEngine) {
        throw new Error('MakkoEngine not available after timeout');
      }
    }
    
    console.log('Loading sprites manifest...');
    
    // Create timeout promise for sprite loading
    const spriteTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sprite loading timeout')), 15000); // 15 second timeout
    });
    
    const spriteLoadPromise = window.MakkoEngine.init('sprites-manifest.json', {
      onProgress: (loaded, total) => {
        console.log(`Loading sprites: ${loaded}/${total}`);
      },
      onComplete: () => {
        console.log('✓ All sprites loaded successfully');
      },
      onError: (error) => {
        console.error('Sprite loading error:', error?.message || error?.toString() || 'Unknown error');
      }
    });
    
    try {
      // Race between sprite loading and timeout
      await Promise.race([spriteLoadPromise, spriteTimeoutPromise]);
    } catch (initError) {
      if (initError?.message && initError.message.includes('timeout')) {
        console.warn('⚠️ Sprite loading timeout - using fallback graphics');
        // Set up fallback graphics
        window.useFallbackGraphics = true;
        window.MakkoEngine = {
          isLoaded: () => false,
          sprite: () => null,
          has: () => false,
          getCharacters: () => [],
          init: async () => { throw new Error('MakkoEngine fallback - no real engine available'); }
        };
        return Promise.resolve(); // Continue with fallback graphics
      }
      throw initError;
    }
    
    console.log('✓ MakkoEngine initialized successfully');
    console.log('Available characters:', window.MakkoEngine.getCharacters());
    
    // Verify character availability
    const characters = ['6_bit_main', 'virus_virus', 'corrupted_corrupted', 'firewall_firewall'];
    characters.forEach(charName => {
      if (window.MakkoEngine.has(charName)) {
        console.log(`✓ ${charName} character found`);
        const animations = window.MakkoEngine.getAnimations(charName);
        console.log(`${charName} animations:`, animations);
      } else {
        console.error(`❌ ${charName} character not found in manifest`);
      }
    });
    
    window.useFallbackGraphics = false;
    
  } catch (error) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Only log as error if it's not a timeout
    if (!error?.message || !error.message.includes('timeout')) {
      console.error('❌ Failed to initialize MakkoEngine:', errorMessage);
      console.error('MakkoEngine error stack:', error?.stack || 'No stack available');
    }
    
    console.warn('Falling back to placeholder graphics');
    window.useFallbackGraphics = true;
    
    window.MakkoEngine = {
      isLoaded: () => false,
      sprite: () => null,
      has: () => false,
      getCharacters: () => [],
      init: async () => { throw new Error('MakkoEngine fallback - no real engine available'); }
    };
  }
  
  return Promise.resolve();
};

// New initialization function that starts from button
window.startGameInitialization = async function() {
  console.log('=== INITIALIZING GAME SYSTEMS ===');
  
  // Enable debug hitbox visualization
  window.DEBUG_HITBOXES = true;
  console.log('✓ Debug hitboxes enabled');
  
  try {
    // Initialize sprites first
    console.log('Loading sprites...');
    await window.initSprites();
    console.log('✓ Sprite initialization complete');
    
    // Initialize space ship system
    console.log('Initializing space ship system...');
    window.initSpaceShips();
    console.log('✓ Space ship system initialized');
    
    // Initialize lore system
    console.log('Initializing lore system...');
    window.initLore();
    console.log('✓ Lore system initialized');
    
    // Initialize Broadcast Jammer System
    console.log('Initializing Broadcast Jammer System...');
    if (window.BroadcastJammerSystem && typeof window.BroadcastJammerSystem.init === 'function') {
      window.BroadcastJammerSystem.init();
      console.log('✓ Broadcast Jammer System initialized successfully');
    } else {
      console.warn('⚠️ Broadcast Jammer System not available');
    }
    
    // Initialize jammer indicator system
    console.log('Initializing jammer indicator system...');
    if (typeof window.initJammerIndicator === 'function') {
      const jammerIndicatorInitialized = window.initJammerIndicator();
      if (jammerIndicatorInitialized) {
        console.log('✓ Jammer indicator system initialized successfully');
      } else {
        console.warn('⚠️ Jammer indicator system initialization failed');
      }
    } else {
      console.warn('⚠️ initJammerIndicator function not found');
    }
    
    // FORCE INIT LOST DATA SYSTEM REGARDLESS OF PLAYER
    console.log('🔥 FORCE INITIALIZING LOST DATA SYSTEM...');
    try {
      window.initLostData(window.player || null);
      console.log('✅ Lost data system FORCE initialized');
    } catch (error) {
      console.error('FAILED TO FORCE INIT LOST DATA:', error);
    }
    
    // Initialize Sector 1 progression system
    console.log('Initializing Sector 1 progression system...');
    if (window.player && typeof window.initSector1Progression === 'function') {
      window.initSector1Progression(window.player);
      console.log('✓ Sector 1 progression system initialized');
    } else {
      console.warn('Player not available for Sector 1 progression initialization');
    }
    
    // Initialize objectives system
    console.log('Initializing objectives system...');
    if (typeof window.initObjectives === 'function') {
      window.initObjectives();
      console.log('✓ Objectives system initialized');
      
      if (window.objectivesSystem) {
        if (window.objectivesSystem.objectiveUI) {
          window.objectivesSystem.objectiveUI.visible = true;
        }
        window.objectivesSystem.active = true;
        console.log('✅ Objectives system forced visible on initialization');
      }
    }
    
    // Initialize audio system
    console.log('Initializing audio system...');
    await window.initAudio();
    console.log('✓ Audio initialization complete');
    
    console.log('✓ All systems initialized successfully');
    
  } catch (error) {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    console.error('❌ Initialization failed:', errorMessage);
    console.error('Initialization error stack:', error?.stack || 'No stack available');
    console.error('Error type:', typeof error);
    console.error('Error object:', error);
    
    // Re-throw with more descriptive message
    throw new Error(`Game initialization failed: ${errorMessage}`);
  }
};