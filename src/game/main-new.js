// Main game controller for BARCODE: System Override (Refactored)
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/main-new.js',
  exports: ['update', 'render', 'startGame', 'initGame', 'startNewGame'],
  dependencies: ['gameState', 'initGameState', 'checkGameConditions', 'updateGame', 'renderGame', 'resetRenderContext', 'startGameInitialization', 'player', 'enemyManager', 'objectivesSystem']
});

// Initialize game - Enhanced with error handling
window.startGame = function() {
  try {
    console.log('🎮 Game started - press Shift+F to toggle fullscreen');
    
    // Ensure game state exists
    if (!window.gameState) {
      console.warn('Game state not found, creating it');
      window.gameState = {};
    }
  
  window.gameState.running = true;
  window.gameState.paused = false;
  window.gameState.gameOver = false;
  window.gameState.level = 1;
  window.gameState.score = 0;
  window.gameState.gameTime = 0;
  
  // Reset tutorial tracking
  if (window.inputManager) {
    window.inputManager.hasTrackedMovement = false;
    window.inputManager.hasTrackedJump = false;
  }
  
  // Reset player position and health
  if (window.player) {
    window.player.health = window.player.maxHealth;
    window.player.position = new window.Vector2D(200, 500);
    window.player.velocity = new window.Vector2D(0, 0);
    
    // Trigger entrance animation on restart
    if (typeof window.player.startEntranceAnimation === 'function') {
      window.player.startEntranceAnimation();
    }
  }
  
  // Reset enemy manager
  if (window.enemyManager) {
    window.enemyManager.clear();
  }
  
  // Reset objectives system
  if (window.objectivesSystem) {
    window.objectivesSystem.reset();
    if (window.objectivesSystem.objectiveUI) {
      window.objectivesSystem.objectiveUI.visible = true;
    }
    window.objectivesSystem.active = true;
  }
  
  // Reset other systems
  if (window.sector1Progression && typeof window.sector1Progression.reset === 'function') {
    const currentEnemyCount = window.sector1Progression.enemiesDefeated || 0;
    const shouldPreserveProgress = currentEnemyCount >= 20;
    window.sector1Progression.reset(shouldPreserveProgress);
  }
  
  if (window.hackingSystem && typeof window.hackingSystem.reset === 'function') {
    window.hackingSystem.reset();
  }
  
  if (window.rhythmSystem && typeof window.rhythmSystem.restart === 'function') {
    window.rhythmSystem.restart();
  }
  
  // Start game loop
  if (!window.isRunning) {
    window.isRunning = true;
    window.isPaused = false;
    requestAnimationFrame(window.gameLoop);
  }
  
    console.log('✓ BARCODE: System Override started successfully');
  } catch (error) {
    console.error('❌ Error starting game:', error?.message || error?.toString() || 'Unknown error');
    console.error('Start game error stack:', error?.stack || 'No stack available');
    throw new Error(`Game start failed: ${error?.message || 'Unknown error'}`);
  }
};

// Initialize game when ready - Only define ONCE
window.initGame = function() {
  try {
    if (window.autoStartDisabled) {
      console.log('🛑 Auto-start disabled - waiting for start button');
      return;
    }
    
    console.log('=== AUTO INITIALIZING GAME (LEGACY MODE) ===');
    
    // Start game initialization sequence
    if (typeof window.startGameInitialization === 'function') {
      window.startGameInitialization();
    } else {
      console.error('❌ startGameInitialization function not available');
      throw new Error('startGameInitialization function is not available');
    }
  } catch (error) {
    console.error('❌ Error in initGame:', error?.message || error?.toString() || 'Unknown error');
    console.error('initGame error stack:', error?.stack || 'No stack available');
    throw error;
  }
};

// New initialization function that starts from button
window.startNewGame = async function() {
  console.log('=== STARTING NEW GAME ===');
  
  try {
    // Initialize all game systems
    await window.startGameInitialization();
    
    // Initialize game state
    window.initGameState();
    
    // Start the game
    window.startGame();
    
  } catch (error) {
    console.error('❌ Failed to start new game:', error);
  }
};

// Main update function - delegates to update coordinator
window.update = window.updateGame;

// Main render function - delegates to render coordinator  
window.render = window.renderGame;

// Global error handlers
window.addEventListener('error', function(event) {
  if (event.message && event.message.includes('Cannot read properties of undefined (reading \'clear\')')) {
    return false;
  }
  
  console.error('GlobalErrorHandler:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  return false;
});

window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message) {
    if (event.reason.message.includes('permission') || 
        event.reason.message.includes('Permission') ||
        event.reason.message.includes('fullscreen') ||
        event.reason.message.includes('Fullscreen')) {
      console.log('Expected permission/fullscreen rejection:', event.reason.message);
      event.preventDefault();
      return false;
    }
  }
  
  console.error('[GlobalErrorHandler] Unhandled promise rejection:', {
    reason: event.reason,
    stack: event.reason?.stack || 'No stack available',
    type: typeof event.reason
  });
  
  event.preventDefault();
  return false;
});

// Only auto-initialize if not disabled
if (!window.autoStartDisabled) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(window.initGame, 100);
    });
  } else {
    setTimeout(window.initGame, 100);
  }
} else {
  console.log('🛑 Auto-initialization disabled - waiting for start button');
}