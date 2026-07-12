// Game loop system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/loop.js',
  exports: ['gameLoop', 'startGameLoop', 'pauseGame', 'resumeGame', 'stopGame'],
  dependencies: ['updateGame', 'renderGame', 'resetRenderContext']
});

// Frame timing and game state - ensure proper initialization
window.lastTime = window.lastTime || 0;
window.maxFPS = window.maxFPS || 60;
window.frameDelay = 1000 / window.maxFPS;
window.isPaused = window.isPaused || false;
window.isRunning = window.isRunning || false;
window.gameLoopRafHandle = window.gameLoopRafHandle || null;

// requestAnimationFrame ownership lives here only for active gameplay frames.
function scheduleNextGameplayFrame() {
  if (!window.isRunning || window.gameLoopRafHandle !== null) return;
  window.gameLoopRafHandle = requestAnimationFrame(window.gameLoop);
}

function cancelScheduledGameplayFrame() {
  if (window.gameLoopRafHandle !== null) {
    cancelAnimationFrame(window.gameLoopRafHandle);
    window.gameLoopRafHandle = null;
  }
}

function updateRendererState(deltaTime) {
  if (!window.renderer || typeof window.renderer.update !== 'function') return;

  try {
    if (window.player && typeof window.player.position === 'object' && typeof window.renderer.updateZoomFromPlayer === 'function') {
      window.renderer.updateZoomFromPlayer(window.player.position.x, window.player.position.y);
    }
    window.renderer.update(deltaTime);
  } catch (error) {
    console.error('Error in renderer update:', error?.message || error);
  }
}

// Main game loop with delta time
window.gameLoop = function(timestamp) {
  window.gameLoopRafHandle = null;

  if (!window.isRunning) return;

  if (window.isPaused) {
    scheduleNextGameplayFrame();
    return;
  }

  // Calculate delta time in milliseconds
  const deltaTime = timestamp - window.lastTime;

  // Cap at 60 fps - skip frame if running too fast
  if (deltaTime < window.frameDelay) {
    scheduleNextGameplayFrame();
    return;
  }

  // Cap delta time to prevent spiral of death (if tab was inactive)
  const cappedDelta = Math.min(deltaTime, 100); // Max 100ms (10fps minimum)

  // Update input state at start of frame
  if (window.inputManager) {
    window.inputManager.update();
  }

  // Update game logic using coordinator system
  if (window.updateGame) {
    try {
      window.updateGame(cappedDelta);
    } catch (error) {
      console.error('Error in game update:', error?.message || error);
    }
  }

  // Update renderer effects once per active gameplay frame.
  updateRendererState(cappedDelta);

  // Render frame using coordinator system with enhanced error handling
  if (window.renderGame) {
    try {
      window.renderGame();
    } catch (error) {
      console.error('Error in game render:', error?.message || error);
      console.error('Render error stack:', error?.stack || 'No stack available');
      
      // Attempt to recover from render errors
      try {
        // Reset render context cache if available
        if (window.resetRenderContext) {
          window.resetRenderContext();
        }
      } catch (recoveryError) {
        console.error('Failed to recover from render error:', recoveryError?.message || recoveryError);
      }
      
      // Continue game loop even if render fails
    }
  }

  window.lastTime = timestamp;
  // The next gameplay frame is scheduled from this single location.
  scheduleNextGameplayFrame();
};

// Start the game loop (renamed to avoid conflicts with main game controller)
window.startGameLoop = function() {
  window.isRunning = true;
  window.isPaused = false;
  window.lastTime = performance.now();
  scheduleNextGameplayFrame();
};

// Pause the game
window.pauseGame = function() {
  window.isPaused = true;
};

// Resume the game
window.resumeGame = function() {
  if (!window.isRunning) return;
  window.isPaused = false;
  window.lastTime = performance.now();
  scheduleNextGameplayFrame();
};

// Stop the game
window.stopGame = function() {
  window.isRunning = false;
  window.isPaused = false;
  cancelScheduledGameplayFrame();
};
