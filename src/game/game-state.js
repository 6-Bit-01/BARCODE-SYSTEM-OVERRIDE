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
  lorePendingMessage: null
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
    window.gameState.level = 1;
    window.gameState.score = 0;
    window.gameState.gameTime = 0;
    window.gameState.hasSpawnedInitialEnemies = false;
    window.gameState.enemiesDefeated = 0;
    window.gameState.collectionMessage = null;
    window.gameState.lorePendingMessage = null;
    
    console.log('✓ Game state initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing game state:', error?.message || error?.toString() || 'Unknown error');
    console.error('Game state init error stack:', error?.stack || 'No stack available');
    throw new Error(`Game state initialization failed: ${error?.message || 'Unknown error'}`);
  }
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
      // Spawn initial wave of enemies
      setTimeout(() => {
        for (let i = 0; i < 3; i++) {
          window.enemyManager.spawnEnemy();
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
    // Spawn initial enemies after tutorial completes
    for (let i = 0; i < 3; i++) {
      window.enemyManager.spawnEnemy();
    }
  }
}