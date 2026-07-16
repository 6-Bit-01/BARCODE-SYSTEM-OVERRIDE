// Game state management for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/game-state.js',
  exports: ['gameState', 'initGameState', 'checkGameConditions'],
  dependencies: ['Vector2D']
});

// Game state management
window.gameState = {
  running: false,
  paused: false,
  gameOver: false,
  victory: false,
  level: 1,
  maxLevel: 5,
  score: 0,
  gameTime: 0,
  hasSpawnedInitialEnemies: false,
  enemiesDefeated: 0,
  enemiesPerLevel: 10,
  collectionMessage: null,
  lorePendingMessage: null,
  // Progress tracking for reset system
  progressSaved: false,
  savedEnemiesDefeated: 0,
  savedScore: 0,
  requiredForProgress: 20
};

window.initialEnemySpawnHandle = null;
window.initialEnemySpawnGeneration = 0;

window.cancelInitialEnemySpawn = function() {
  window.initialEnemySpawnGeneration++;
  if (window.initialEnemySpawnHandle) {
    clearTimeout(window.initialEnemySpawnHandle);
    window.initialEnemySpawnHandle = null;
  }
};

window.getInitialEnemySpawnDiagnostics = function() {
  return { pending: !!window.initialEnemySpawnHandle, generation: window.initialEnemySpawnGeneration };
};

window.resetRuntimeTerminalFlags = function() {
  if (!window.gameState) return;
  window.gameState.gameOver = false;
  window.gameState.victory = false;
  window.gameState.running = true;
  window.gameState.paused = false;
};

// Initialize game state
window.initGameState = function() {
  try {
    // Ensure gameState exists
    if (!window.gameState) {
      window.gameState = {};
    }
    
    window.gameState.running = true;
    window.gameState.paused = false;
    window.gameState.gameOver = false;
    window.gameState.victory = false;
    window.gameState.level = 1;
    window.gameState.score = 0;
    window.gameState.gameTime = 0;
    window.gameState.hasSpawnedInitialEnemies = false;
    window.gameState.enemiesDefeated = 0;
    window.gameState.collectionMessage = null;
    window.gameState.lorePendingMessage = null;
    
    // Initialize progress tracking
    window.gameState.progressSaved = false;
    window.gameState.savedEnemiesDefeated = 0;
    window.gameState.savedScore = 0;
    window.gameState.requiredForProgress = 20;
    
    console.log('✓ Game state initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing game state:', error?.message || error?.toString() || 'Unknown error');
    console.error('Game state init error stack:', error?.stack || 'No stack available');
    throw new Error(`Game state initialization failed: ${error?.message || 'Unknown error'}`);
  }
};

// Get total enemies defeated across all systems
function getTotalEnemiesDefeated() {
  let total = window.gameState.enemiesDefeated || 0;
  
  // Add enemy manager defeated count
  if (window.enemyManager && window.enemyManager.defeatedCount) {
    total += window.enemyManager.defeatedCount;
  }
  
  // Add sector 1 progression defeated count
  if (window.sector1Progression && window.sector1Progression.enemiesDefeated) {
    total += window.sector1Progression.enemiesDefeated;
  }
  
  return total;
}

// Save progress when player has 20+ enemies defeated
function saveProgress() {
  const totalDefeated = getTotalEnemiesDefeated();
  
  window.gameState.progressSaved = true;
  window.gameState.savedEnemiesDefeated = totalDefeated;
  window.gameState.savedScore = window.gameState.score;
  
  // Save to sector 1 progression
  if (window.sector1Progression) {
    window.sector1Progression.savedProgress = {
      enemiesDefeated: window.sector1Progression.enemiesDefeated,
      broadcastJammerDestroyed: window.sector1Progression.broadcastJammerDestroyed,
      jammerRevealed: window.sector1Progression.jammerRevealed
    };
  }
  
  console.log(`💾 Progress saved: ${totalDefeated} enemies defeated, score: ${window.gameState.score}`);
}

// Reset progress when player dies before 20 enemies defeated
function resetProgress() {
  console.log('🔄 Resetting all progress...');
  
  // Reset game state progress
  window.gameState.progressSaved = false;
  window.gameState.savedEnemiesDefeated = 0;
  window.gameState.savedScore = 0;
  window.gameState.enemiesDefeated = 0;
  window.gameState.score = 0;
  window.gameState.hasSpawnedInitialEnemies = false;
  
  // Reset enemy manager
  if (window.enemyManager) {
    window.enemyManager.defeatedCount = 0;
    window.enemyManager.enemies = [];
    window.enemyManager.spawnFlowState = 'building';
    window.enemyManager.flowTimer = 0;
    window.enemyManager.enemySpawnWaves = 0;
  }
  
  // Reset sector 1 progression
  if (window.sector1Progression) {
    window.sector1Progression.enemiesDefeated = 0;
    window.sector1Progression.broadcastJammerDestroyed = false;
    window.sector1Progression.jammerRevealed = false;
    window.sector1Progression.savedProgress = null;
    window.sector1Progression.boss = null;
  }
  
  // Clear all enemies
  if (window.enemyManager) {
    window.enemyManager.clear();
  }
  
  // Reset objectives system
  if (window.objectivesSystem) {
    if (typeof window.objectivesSystem.reset === 'function') {
      window.objectivesSystem.reset();
    }
  }
  
  // Clear jammers
  if (window.jammerArrowIndicator) {
    window.jammerArrowIndicator.setTarget(null);
  }
  
  console.log('🔄 All progress has been reset');
}

// Restore saved progress when starting new game
window.restoreProgress = function() {
  if (!window.gameState.progressSaved) {
    console.log('📂 No saved progress to restore');
    return false;
  }
  
  console.log('📂 Restoring saved progress...');
  
  // Restore game state
  window.gameState.enemiesDefeated = window.gameState.savedEnemiesDefeated;
  window.gameState.score = window.gameState.savedScore;
  
  // Restore sector 1 progression
  if (window.sector1Progression && window.sector1Progression.savedProgress) {
    const saved = window.sector1Progression.savedProgress;
    window.sector1Progression.enemiesDefeated = saved.enemiesDefeated || 0;
    window.sector1Progression.broadcastJammerDestroyed = saved.broadcastJammerDestroyed || false;
    window.sector1Progression.jammerRevealed = saved.jammerRevealed || false;
  }
  
  console.log(`📂 Progress restored: ${window.gameState.enemiesDefeated} enemies, score: ${window.gameState.score}`);
  return true;
};

// Check win/lose conditions
window.checkGameConditions = function() {
  // Update collection message timer
  if (window.gameState.collectionMessage && window.gameState.collectionMessage.timer > 0) {
    window.gameState.collectionMessage.timer--;
    if (window.gameState.collectionMessage.timer <= 0) {
      window.gameState.collectionMessage = null;
    }
  }
  
  // Update lore pending message timer
  if (window.gameState.lorePendingMessage && window.gameState.lorePendingMessage.timer > 0) {
    window.gameState.lorePendingMessage.timer--;
    if (window.gameState.lorePendingMessage.timer <= 0) {
      window.gameState.lorePendingMessage = null;
    }
  }
  
  // Check if player is dead
  if (window.player.health <= 0) {
    // During tutorial, respawn player instead of game over
    if (window.tutorialSystem && typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive()) {
      respawnPlayerInTutorial();
    } else {
      // Check progress before game over
      const totalEnemiesDefeated = getTotalEnemiesDefeated();
      
      if (totalEnemiesDefeated < window.gameState.requiredForProgress) {
        // Reset progress if player dies before defeating 20 enemies
        resetProgress();
        console.log(`💀 Player died with only ${totalEnemiesDefeated}/${window.gameState.requiredForProgress} enemies defeated - PROGRESS RESET`);
      } else {
        // Save progress if player has 20+ enemies defeated
        saveProgress();
        console.log(`💀 Player died with ${totalEnemiesDefeated}/${window.gameState.requiredForProgress} enemies defeated - PROGRESS SAVED`);
      }
      
      // Normal game over outside tutorial
      window.gameState.gameOver = true;
      window.gameState.running = false;
      if (window.renderer && typeof window.renderer.addScreenShake === 'function') {
        window.renderer.addScreenShake(20, 1000);
      }
      if (window.renderer && typeof window.renderer.addGlitch === 'function') {
        window.renderer.addGlitch(1.0, 2000);
      }
    }
  }
  
  // Spawn initial enemies when tutorial is completed or if tutorial doesn't exist
  if (!window.gameState.hasSpawnedInitialEnemies) {
    const shouldSpawn = !window.tutorialSystem || 
      typeof window.tutorialSystem.isActive !== 'function' || 
      !window.tutorialSystem.isActive() || 
      window.tutorialSystem && typeof window.tutorialSystem.isCompleted === 'function' && window.tutorialSystem.isCompleted();
      
    if (shouldSpawn && window.enemyManager) {
      console.log('Tutorial completed or not active - spawning initial enemies');
      window.gameState.hasSpawnedInitialEnemies = true;
      // Spawn initial wave of enemies with firewall limit
      window.cancelInitialEnemySpawn();
      const spawnGeneration = window.initialEnemySpawnGeneration;
      window.initialEnemySpawnHandle = setTimeout(() => {
        window.initialEnemySpawnHandle = null;
        if (spawnGeneration !== window.initialEnemySpawnGeneration || !window.gameState || window.gameState.gameOver || !window.gameState.running) {
          return;
        }
        let firewallSpawned = false;
        for (let i = 0; i < 3; i++) {
          // Check current firewall count before spawning
          const currentFirewallCount = window.enemyManager.enemies.filter(e => e.type === 'firewall' && e.active).length;
          
          // If we already have a firewall, temporarily force non-firewall type
          if (currentFirewallCount >= 1 || firewallSpawned) {
            // Force spawn virus or corrupted (skip firewall)
            const types = ['virus', 'corrupted'];
            const type = types[Math.floor(Math.random() * types.length)];
            
            let x, y = 200;
            if (type === 'virus') {
              x = -50 + Math.random() * 100;
              y = -50 + Math.random() * 50;
            } else {
              x = Math.random() > 0.5 ? 100 : 3900;
            }
            
            const enemy = new window.Enemy(x, y, type);
            if (type === 'virus') {
              enemy._dropEdge = 'top';
              enemy.entranceComplete = false;
              enemy.state = 'entrance';
              enemy.velocity.x = 50 + Math.random() * 30;
              enemy.velocity.y = 120 + Math.random() * 30;
              enemy.isOnGround = false;
            }
            window.enemyManager.enemies.push(enemy);
          } else {
            // Allow normal spawn (could be firewall)
            window.enemyManager.spawnEnemy();
            if (window.enemyManager.enemies.some(e => e.type === 'firewall' && e.active)) {
              firewallSpawned = true;
            }
          }
        }
      }, 1000);
    }
  }
};

// Respawn player in tutorial
function respawnPlayerInTutorial() {
  // Reset player position and health - spawn from left side with entrance
  window.player.health = window.player.maxHealth;
  window.player.position = new window.Vector2D(200, 810);
  window.player.velocity = new window.Vector2D(0, 0);
  
  // Trigger entrance animation for tutorial respawn
  if (typeof window.player.startEntranceAnimation === 'function') {
    window.player.startEntranceAnimation();
  }
  
  // Add brief invulnerability
  window.player.invulnerable = true;
  setTimeout(() => {
    if (window.player) {
      window.player.invulnerable = false;
    }
  }, 2000); // 2 seconds of invulnerability
  
  // Show respawn message
  if (window.renderer && typeof window.renderer.addScreenShake === 'function') {
    window.renderer.addScreenShake(10, 500);
  }
  if (window.tutorialSystem && window.tutorialSystem.isCompleted() && !window.gameState.hasSpawnedInitialEnemies) {
    window.gameState.hasSpawnedInitialEnemies = true;
    // Spawn initial enemies after tutorial completes - no firewalls in tutorial
    for (let i = 0; i < 3; i++) {
      window.enemyManager.spawnEnemy();
    }
  }
}