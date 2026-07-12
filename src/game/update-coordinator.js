// Update coordination for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/update-coordinator.js',
  exports: ['updateGame'],
  dependencies: ['gameState', 'checkGameConditions', 'player', 'enemyManager', 'hackingSystem', 'rhythmSystem', 'renderer', 'particleSystem', 'spaceShipSystem', 'tutorialSystem', 'jammerIndicator', 'sector1Progression', 'objectivesSystem', 'loreSystem', 'lostDataSystem', 'audioSystem']
});

// Main update function called from game loop
window.updateGame = function(deltaTime) {
  if (!window.gameState.running || window.gameState.paused) return;
  
  const dt = deltaTime / 1000;
  window.gameState.gameTime += deltaTime;
  
  // Update player
  const hackingActive = window.hackingSystem && typeof window.hackingSystem.isActive === 'function' && window.hackingSystem.isActive();
  const rhythmActive = window.rhythmSystem && typeof window.rhythmSystem.isActive === 'function' && window.rhythmSystem.isActive();
  
  // CRITICAL FIX: Always update player animation even during rhythm/hacking modes
  if (window.player && typeof window.player.update === 'function') {
    try {
      const allowMovement = !hackingActive;
      window.player.update(deltaTime, allowMovement);
    } catch (error) {
      console.error('Error updating player:', error?.message || error);
    }
  }
  
  // Update enemies
  updateEnemies(deltaTime);
  
  // Update systems
  updateGameSystems(deltaTime, hackingActive, rhythmActive);
  
  // Update effects and visual systems
  updateVisualSystems(deltaTime);
  
  // Update sector progression
  updateSectorProgression(deltaTime);
  
  // Update objectives
  updateObjectives(deltaTime);
  
  // Update audio
  updateAudio(deltaTime);
  
  // Update tutorial
  updateTutorial(deltaTime);
  
  // Update lost data system (fragments)
  updateLostDataSystem(deltaTime);
  
  // Update lore system
  updateLoreSystem(deltaTime);
  
  // Check game conditions
  window.checkGameConditions();
};

// Update enemies with tutorial awareness
function updateEnemies(deltaTime) {
  const allowEnemiesInTutorial = window.tutorialSystem && 
    typeof window.tutorialSystem.isActive === 'function' && 
    window.tutorialSystem.isActive() && 
    window.tutorialSystem.storyChapter === 1;
    
  const isTutorialCompleted = window.tutorialSystem && 
    typeof window.tutorialSystem.isCompleted === 'function' && 
    window.tutorialSystem.isCompleted();
    
  const shouldUpdateEnemies = !window.tutorialSystem || 
    typeof window.tutorialSystem.isActive !== 'function' || 
    !window.tutorialSystem.isActive() || 
    isTutorialCompleted || 
    allowEnemiesInTutorial;
    
  if (shouldUpdateEnemies && window.enemyManager) {
    try {
      if (typeof window.enemyManager.update === 'function') {
        window.enemyManager.update(deltaTime, window.player);
      }
      
      // EnemyManager.update() owns enemy/enemy and enemy/player collision orchestration.
      // Rhythm attacks only called from input.js on actual down arrow presses
    } catch (error) {
      console.error('Error updating enemy manager:', error?.message || error);
    }
  }
}

// Update core game systems
function updateGameSystems(deltaTime, hackingActive, rhythmActive) {
  // Update hacking system
  if (window.hackingSystem && typeof window.hackingSystem.update === 'function' && 
      (!window.hackingSystem.isActive || typeof window.hackingSystem.isActive !== 'function' || window.hackingSystem.isActive())) {
    try {
      window.hackingSystem.update(deltaTime);
    } catch (error) {
      console.error('Error updating hacking system:', error?.message || error);
    }
  }
  
  // Update rhythm system regardless of visual visibility
  if (window.rhythmSystem && typeof window.rhythmSystem.update === 'function' && 
      (!window.rhythmSystem.isRunning || typeof window.rhythmSystem.isRunning !== 'function' || window.rhythmSystem.isRunning())) {
    try {
      window.rhythmSystem.update(deltaTime);
    } catch (error) {
      console.error('Error updating rhythm system:', error?.message || error);
    }
  }
  
  // Renderer state is updated once by src/core/loop.js after simulation.
}

// Update visual and effects systems
function updateVisualSystems(deltaTime) {
  // Update particles
  if (window.particleSystem && typeof window.particleSystem.update === 'function') {
    try {
      window.particleSystem.update(deltaTime);
    } catch (error) {
      console.error('Error updating particle system:', error?.message || error);
    }
  }
  
  // Update space ships
  if (window.spaceShipSystem && typeof window.spaceShipSystem.update === 'function') {
    try {
      window.spaceShipSystem.update(deltaTime);
    } catch (error) {
      console.error('Error updating space ship system:', error?.message || error);
    }
  }
  
  // Jammer enemies are now handled through the regular EnemyManager
  // No separate jammer system update needed
  
  // Update jammer indicator system
  if (window.jammerIndicator && typeof window.jammerIndicator.update === 'function') {
    try {
      const playerX = window.player ? window.player.position.x : 960;
      const playerY = window.player ? window.player.position.y : 750;
      
      // Check for active jammer enemy
      let jammerPosition = null;
      
      if (window.enemyManager && window.enemyManager.enemies) {
        const jammerEnemy = window.enemyManager.enemies.find(e => e.type === 'jammer' && e.active);
        if (jammerEnemy) {
          jammerPosition = {
            x: jammerEnemy.position.x,
            y: jammerEnemy.position.y
          };
        }
      }
      
      window.jammerIndicator.update(deltaTime, jammerPosition, playerX, playerY);
    } catch (error) {
      console.error('Error updating jammer indicator:', error?.message || error);
    }
  }
}

// Update sector progression system
function updateSectorProgression(deltaTime) {
  if (window.sector1Progression) {
    try {
      window.sector1Progression.update(deltaTime);
      
      const tutorialCompleted = window.tutorialSystem && 
        typeof window.tutorialSystem.isCompleted === 'function' && 
        window.tutorialSystem.isCompleted();
      
      // NOTE: Removed redundant jammer reveal calls - objectives system handles this exclusively
      // The objectives system will handle jammer spawning when 20 enemies are defeated
    } catch (error) {
      console.error('Error updating Sector 1 progression:', error?.message || error);
    }
  }
}

// Update objectives system
function updateObjectives(deltaTime) {
  if (window.objectivesSystem && typeof window.objectivesSystem.update === 'function') {
    try {
      window.objectivesSystem.update(deltaTime);
    } catch (error) {
      console.error('Error updating objectives system:', error?.message || error);
    }
  }
}

// Update lore system
function updateLoreSystem(deltaTime) {
  const tutorialActive = window.tutorialSystem && 
                       typeof window.tutorialSystem.isActive === 'function' && 
                       window.tutorialSystem.isActive();
  
  const tutorialCompleted = window.tutorialSystem && 
                          typeof window.tutorialSystem.isCompleted === 'function' && 
                          window.tutorialSystem.isCompleted();
  
  if (!tutorialActive && (tutorialCompleted || !window.tutorialSystem) && window.loreSystem && typeof window.loreSystem.update === 'function') {
    try {
      window.loreSystem.update(deltaTime);
    } catch (error) {
      console.error('Error updating lore system:', error?.message || error);
    }
  }
}

// Update audio system
function updateAudio(deltaTime) {
  if (window.audioSystem && typeof window.audioSystem.isInitialized === 'function' && window.audioSystem.isInitialized()) {
    try {
      if (typeof window.audioSystem.updateVisualization === 'function') {
        window.audioSystem.updateVisualization();
      }
      if (typeof window.audioSystem.updateLayers === 'function') {
        window.audioSystem.updateLayers();
      }
      
      if (typeof window.audioSystem.updateEnemyProximitySounds === 'function') {
        const playerX = window.player ? window.player.position.x : 960;
        const playerY = window.player ? window.player.position.y : 750;
        const enemies = window.enemyManager ? window.enemyManager.getActiveEnemies() : [];
        window.audioSystem.updateEnemyProximitySounds(playerX, playerY, enemies);
      }
    } catch (error) {
      console.error('Error updating audio system:', error?.message || error);
    }
  }
}

// Update tutorial system
function updateTutorial(deltaTime) {
  if (window.tutorialSystem && typeof window.tutorialSystem.update === 'function' && 
      typeof window.tutorialSystem.active === 'boolean' && window.tutorialSystem.active) {
    try {
      window.tutorialSystem.update(deltaTime);
    } catch (error) {
      console.error('Error updating tutorial system:', error?.message || error);
      if (window.tutorialSystem && typeof window.tutorialSystem.complete === 'function') {
        window.tutorialSystem.complete();
      }
    }
  }
}

// Update lost data system (fragments)
function updateLostDataSystem(deltaTime) {
  if (window.lostDataSystem && typeof window.lostDataSystem.update === 'function') {
    try {
      window.lostDataSystem.update(deltaTime);
    } catch (error) {
      console.error('Error updating lost data system:', error?.message || error);
    }
  }
}