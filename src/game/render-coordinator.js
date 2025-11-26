// Render coordination for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/render-coordinator.js',
  exports: ['renderGame', 'resetRenderContext'],
  dependencies: ['renderer', 'player', 'enemyManager', 'BroadcastJammerSystem', 'sector1Progression', 'lostDataSystem', 'spaceShipSystem', 'parallaxBackground', 'particleSystem', 'rhythmSystem', 'hackingSystem', 'tutorialSystem', 'objectivesSystem', 'loreSystem', 'jammerIndicator', 'drawGameUI', 'clamp']
});

// Cache canvas context to prevent repeated creation
let renderCanvas = null;
let renderContext = null;
let contextCreationAttempts = 0;
const MAX_CONTEXT_ATTEMPTS = 3;

// Main render function
window.renderGame = function() {
  // Check if renderer is available before use
  let rendererAvailable = window.renderer && typeof window.renderer === 'object' && window.renderer !== null && typeof window.renderer.clear === 'function';
  
  if (typeof rendererAvailable === 'undefined') {
    rendererAvailable = false;
  }
  
  // Use cached canvas context
  if (!renderCanvas) {
    renderCanvas = document.getElementById('gameCanvas');
    if (!renderCanvas) {
      console.warn('Canvas not found, skipping render frame');
      return;
    }
  }
  
  // Get context only once with retry limit
  if (!renderContext && contextCreationAttempts < MAX_CONTEXT_ATTEMPTS) {
    contextCreationAttempts++;
    try {
      renderContext = renderCanvas.getContext('2d');
      if (!renderContext) {
        console.error('Failed to get canvas context, attempt', contextCreationAttempts);
        contextCreationAttempts = MAX_CONTEXT_ATTEMPTS;
        return;
      }
    } catch (error) {
      console.error('Error getting canvas context:', error?.message || error);
      if (error.message && (
          error.message.includes('context creation limit') ||
          error.message.includes('Maximum number') ||
          error.message.includes('context limit')
      )) {
        console.error('🚫 Canvas context creation limit exceeded - possible infinite loop detected');
        contextCreationAttempts = MAX_CONTEXT_ATTEMPTS;
        return;
      }
      console.error('Canvas context error - stopping retry attempts to prevent infinite loop');
      contextCreationAttempts = MAX_CONTEXT_ATTEMPTS;
      return;
    }
  }
  
  if (!renderContext) {
    if (contextCreationAttempts >= MAX_CONTEXT_ATTEMPTS) {
      console.warn('Canvas context not available after multiple attempts, skipping render frame');
    }
    return;
  }
  
  var ctx = renderContext;
  
  // Ensure ctx is available before use
  if (!ctx) {
    console.warn('Canvas context not available, skipping render frame');
    return;
  }
  
  // Set global image rendering to high-quality smooth
  try {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  } catch (error) {
    // Some browsers may not support these settings
  }
  
  // Clear canvas directly with fallback
  try {
    ctx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
  } catch (error) {
    console.error('Error clearing canvas:', error?.message || error);
    return;
  }
  
  // Use renderer clear if available
  if (rendererAvailable) {
    try {
      window.renderer.clear();
    } catch (error) {
      console.error('Error in renderer.clear():', error?.message || error);
      rendererAvailable = false;
    }
  }
  
  // Additional safety check for ctx
  if (!ctx) {
    console.warn('Canvas context lost during render, skipping frame');
    return;
  }
  
  // Apply zoom transformation to game area only
  if (rendererAvailable && window.renderer && typeof window.renderer.zoomLevel === 'number') {
    ctx.save();
    
    const currentZoom = window.renderer.zoomLevel;
    const zoomAmount = 1.0 - currentZoom;
    const maxOffset = 100;
    const verticalOffset = (zoomAmount / 0.4) * maxOffset;
    
    const centerX = 1920 / 2;
    const centerY = 850 / 2;
    
    ctx.translate(centerX, centerY + verticalOffset);
    ctx.scale(currentZoom, currentZoom);
    ctx.translate(-centerX, -centerY);
    
    if (window.renderer.screenShake.x || window.renderer.screenShake.y) {
      ctx.translate(window.renderer.screenShake.x, window.renderer.screenShake.y);
    }
  }
  
  // Draw game elements first (within zoomed area)
  drawGameElements(ctx);
  
  // Restore context to remove zoom transformation before drawing UI
  if (rendererAvailable && window.renderer && typeof window.renderer.zoomLevel === 'number') {
    ctx.restore();
  }
  
  // Draw tutorial UI on top - NOT affected by zoom
  if (window.tutorialSystem && typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive()) {
    ctx.save();
    try {
      window.tutorialSystem.draw(ctx);
    } catch (error) {
      console.error('Error drawing tutorial system:', error?.message || error);
    }
    ctx.restore();
  }
  
  // Draw game UI elements - NOT affected by zoom
  if (typeof window.drawGameUI === 'function') {
    try {
      window.drawGameUI(ctx);
    } catch (error) {
      console.error('Error drawing UI:', error?.message || error);
    }
  }
  
  // Apply post-processing effects (if available)
  if (rendererAvailable) {
    try {
      if (window.renderer.applyPostEffects && typeof window.renderer.applyPostEffects === 'function') {
        window.renderer.applyPostEffects();
      }
    } catch (error) {
      console.error('Error in renderer post-processing:', error?.message || error?.toString() || 'Unknown error');
      rendererAvailable = false;
    }
  }
};

// Draw game elements with camera transform
function drawGameElements(ctx) {
  // Draw fallback background first
  drawBackground(ctx);
  
  // Set up side-scroller camera
  const playerX = window.player ? window.player.position.x : 960;
  const canvasWidth = 1920;
  const worldWidth = 4096;
  const halfCanvas = canvasWidth / 2;
  
  let cameraX = playerX;
  cameraX = window.clamp?.(cameraX, halfCanvas, worldWidth - halfCanvas) || cameraX;
  const cameraOffsetX = 960 - cameraX;
  
  // Draw parallax background layer (BG)
  drawParallaxBackground(ctx, cameraX);
  
  // Draw space ships (between BG and FG layers)
  drawSpaceShips(ctx);
  
  // Draw parallax foreground layer (FG)
  drawParallaxForeground(ctx);
  
  // Apply camera transform to all game objects
  ctx.save();
  ctx.translate(cameraOffsetX, 0);
  
  // Draw smoke particles BEHIND ground layer
  drawSmokeParticles(ctx);
  
  // Draw ground
  drawGround(ctx);
  
  // Draw remaining particle effects on top
  drawOtherParticles(ctx);
  
  // Draw game entities
  drawGameEntities(ctx);
  
  // Draw rhythm effects behind player
  drawRhythmEffectsBehindPlayer(ctx);
  
  // Draw player
  drawPlayer(ctx);
  
  // Restore camera transform
  ctx.restore();
  
  // Draw foreground space ships
  drawForegroundSpaceShips(ctx);
}

// Draw background elements
function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
  gradient.addColorStop(0, '#0a0514');
  gradient.addColorStop(1, '#1a0a2a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1920, 1080);
  
  // Grid pattern
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1920; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1080);
    ctx.stroke();
  }
  for (let y = 0; y < 1080; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1920, y);
    ctx.stroke();
  }
}

// Draw parallax layers
function drawParallaxBackground(ctx, cameraX) {
  if (window.parallaxBackground) {
    const groundY = 890;
    window.parallaxBackground.updateCamera(cameraX, groundY);
    
    try {
      const bgLayer = window.parallaxBackground.getLayer(0);
      if (bgLayer) {
        window.parallaxBackground.drawLayer(ctx, bgLayer);
      }
    } catch (error) {
      console.error('Error drawing parallax background layer:', error);
    }
  }
}

function drawParallaxForeground(ctx) {
  if (window.parallaxBackground) {
    try {
      const fgLayer = window.parallaxBackground.getLayer(1);
      if (fgLayer) {
        window.parallaxBackground.drawLayer(ctx, fgLayer);
      }
    } catch (error) {
      console.error('Error drawing parallax foreground layer:', error);
    }
  }
}

// Draw space ships
function drawSpaceShips(ctx) {
  if (window.spaceShipSystem && typeof window.spaceShipSystem.drawNormalShips === 'function') {
    try {
      window.spaceShipSystem.drawNormalShips(ctx);
    } catch (error) {
      console.error('Error drawing normal space ships:', error?.message || error);
    }
  }
}

function drawForegroundSpaceShips(ctx) {
  if (window.spaceShipSystem && typeof window.spaceShipSystem.drawForegroundShips === 'function') {
    try {
      window.spaceShipSystem.drawForegroundShips(ctx);
    } catch (error) {
      console.error('Error drawing foreground space ships:', error?.message || error);
    }
  }
}

// Draw particles
function drawSmokeParticles(ctx) {
  if (window.particleSystem) {
    ctx.save();
    const smokeParticles = window.particleSystem.particles.filter(p => p.growAndDissipate === true);
    smokeParticles.forEach(particle => particle.draw(ctx));
    ctx.restore();
  }
}

function drawOtherParticles(ctx) {
  if (window.particleSystem) {
    ctx.save();
    const otherParticles = window.particleSystem.particles.filter(p => p.growAndDissipate !== true);
    otherParticles.forEach(particle => particle.draw(ctx));
    ctx.restore();
  }
}

// Draw ground
function drawGround(ctx) {
  const groundY = 890;
  
  const playerX = window.player ? window.player.position.x : 960;
  const canvasWidth = 1920;
  const worldWidth = 4096;
  const halfCanvas = canvasWidth / 2;
  
  let cameraX = playerX;
  cameraX = window.clamp?.(cameraX, halfCanvas, worldWidth - halfCanvas) || cameraX;
  
  const groundStartX = -2000;
  const groundEndX = worldWidth + 2000;
  const screenWidth = groundEndX - groundStartX;
  
  const groundGradient = ctx.createLinearGradient(0, groundY, 0, 1080);
  groundGradient.addColorStop(0, '#2a0a4a');
  groundGradient.addColorStop(0.5, '#1a053a');
  groundGradient.addColorStop(1, '#0a022a');
  
  ctx.fillStyle = groundGradient;
  ctx.fillRect(groundStartX, groundY, screenWidth, 1080 - groundY);
  
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(groundStartX, groundY);
  ctx.lineTo(groundEndX, groundY);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
  const patternStart = Math.floor(groundStartX / 100) * 100;
  for (let x = patternStart; x < groundEndX; x += 100) {
    ctx.fillRect(x, groundY + 10, 80, 5);
  }
}

// Draw game entities
function drawGameEntities(ctx) {
  // Draw enemies
  if (window.enemyManager && typeof window.enemyManager.draw === 'function') {
    try {
      window.enemyManager.draw(ctx);
    } catch (error) {
      console.error('Error drawing enemies:', error?.message || error);
    }
  }
  
  // Draw Broadcast Jammer System - INTEGRATED: Draw jammer spawned by ObjectivesSystem
  if (window.BroadcastJammerSystem && typeof window.BroadcastJammerSystem.draw === 'function') {
    try {
      window.BroadcastJammerSystem.draw(ctx);
    } catch (error) {
      console.error('Error drawing Broadcast Jammer System:', error?.message || error);
    }
  }
  
  // Draw sector progression elements
  if (window.sector1Progression) {
    try {
      window.sector1Progression.draw(ctx);
    } catch (error) {
      console.error('Error drawing Sector 1 progression:', error?.message || error);
    }
  }
  
  // Draw lost data fragments
  if (window.lostDataSystem && typeof window.lostDataSystem.draw === 'function') {
    try {
      window.lostDataSystem.draw(ctx);
    } catch (error) {
      console.error('Error drawing lost data system:', error?.message || error);
    }
  }
}

// Draw rhythm effects behind player
function drawRhythmEffectsBehindPlayer(ctx) {
  if (window.rhythmSystem && typeof window.rhythmSystem.isActive === 'function' && window.rhythmSystem.isActive()) {
    try {
      const playerX = window.player ? window.player.position.x : 960;
      const playerY = window.player ? window.player.position.y : 500;
      
      ctx.save();
      
      if (typeof window.rhythmSystem.drawElectricalArcs === 'function') {
        window.rhythmSystem.drawElectricalArcs(ctx, playerX, playerY);
      }
      
      ctx.restore();
    } catch (error) {
      console.error('Error drawing rhythm effects:', error?.message || error);
    }
  }
}

// Draw player
function drawPlayer(ctx) {
  if (window.player && typeof window.player.draw === 'function') {
    try {
      const currentTime = Date.now();
      const isPlayerInvulnerable = (
        (window.player.invulnerableUntil && currentTime < window.player.invulnerableUntil) ||
        (window.player.fastFallInvincibleUntil && currentTime < window.player.fastFallInvincibleUntil)
      );
      
      if (isPlayerInvulnerable) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
      }
      
      window.player.draw(ctx);
      
      if (isPlayerInvulnerable) {
        ctx.restore();
      }
    } catch (error) {
      console.error('Error drawing player:', error?.message || error);
    }
  }
}

// Reset render context cache for error recovery
window.resetRenderContext = function() {
  console.log('Resetting render context cache');
  renderCanvas = null;
  renderContext = null;
  contextCreationAttempts = 0;
};