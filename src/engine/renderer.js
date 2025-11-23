// Renderer system for BARCODE: System Override with CRT effects
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/renderer.js',
  exports: ['Renderer', 'renderer'],
  dependencies: ['Vector2D', 'clamp']
});

window.Renderer = class Renderer {
  constructor(canvas) {
    if (!canvas) {
      throw new Error('Canvas is required for Renderer');
    }
    
    this.canvas = canvas;
    
    // Only get context once and cache it with enhanced error handling
    try {
      this.ctx = canvas.getContext('2d');
      if (!this.ctx) {
        // Check if browser might be hitting context limits
        const testCanvas = document.createElement('canvas');
        const testContext = testCanvas.getContext('2d');
        if (!testContext) {
          throw new Error('Browser has reached canvas context limit - please refresh the page');
        } else {
          throw new Error('Failed to get 2D context from canvas - canvas may be corrupted');
        }
      }
    } catch (error) {
      console.error('Renderer context creation failed:', error?.message || error?.toString() || 'Unknown error');
      throw new Error(`Failed to initialize renderer: ${error.message}`);
    }
    
    this.width = canvas.width;
    this.height = canvas.height;
    this.postEffects = true;
    this.screenShake = { x: 0, y: 0, intensity: 0, duration: 0 };
    
    // CRT effect properties
    this.scanlineOffset = 0;
    this.glitchIntensity = 0;
    this.chromaticAberration = 0;
    
    // Camera zoom system
    this.zoomLevel = 1.0; // Current zoom level (1.0 = normal, 0.625 = 37.5% zoomed out)
    this.targetZoomLevel = 1.0;
    this.zoomSpeed = 0.05; // Much smoother zoom transition speed (reduced from 0.1)
  }

  // Clear canvas with dark background
  clear() {
    // Set image rendering to high-quality smooth for clear graphics
    try {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    } catch (error) {
      // Some browsers may not support these settings
    }
    
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // Apply screen shake effect
  applyScreenShake() {
    if (this.screenShake.duration > 0) {
      // Use fallback if randomRange is not available
      if (typeof window.randomRange === 'function') {
        this.screenShake.x = window.randomRange(-this.screenShake.intensity, this.screenShake.intensity);
        this.screenShake.y = window.randomRange(-this.screenShake.intensity, this.screenShake.intensity);
      } else {
        // Fallback to Math.random
        const range = this.screenShake.intensity;
        this.screenShake.x = (Math.random() * 2 - 1) * range;
        this.screenShake.y = (Math.random() * 2 - 1) * range;
      }
      this.screenShake.duration -= 16; // ~60fps
    } else {
      this.screenShake.x = 0;
      this.screenShake.y = 0;
    }
  }

  // Trigger screen shake
  addScreenShake(intensity, duration) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
  }

  // Get transformed context with effects
  getTransformedContext() {
    this.ctx.save();
    
    // Apply screen shake only (zoom handled in main render)
    this.ctx.translate(this.screenShake.x, this.screenShake.y);
    
    return this.ctx;
  }

  // Restore context state
  restoreContext() {
    this.ctx.restore();
  }

  // Draw with chromatic aberration effect
  drawWithChromatic(drawCallback, x, y, options = {}) {
    if (!this.postEffects || this.chromaticAberration === 0) {
      drawCallback(x, y, options);
      return;
    }

    // Red channel offset
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    this.ctx.translate(-this.chromaticAberration, 0);
    drawCallback(x, y, options);
    this.ctx.restore();

    // Green channel (normal)
    drawCallback(x, y, options);

    // Blue channel offset
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    this.ctx.translate(this.chromaticAberration, 0);
    drawCallback(x, y, options);
    this.ctx.restore();
  }

  // Apply post-processing effects
  applyPostEffects() {
    if (!this.postEffects) return;
    
    // Validate context and canvas
    if (!this.ctx || !this.canvas) {
      return;
    }

    // Check if canvas is tainted before attempting getImageData
    if (this.isCanvasTainted()) {
      // Disable post effects for tainted canvas to prevent cross-origin errors
      this.postEffects = false;
      return;
    }

    let imageData;
    try {
      imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    } catch (error) {
      // Disable post effects permanently on first failure to prevent repeated errors
      this.postEffects = false;
      return;
    }
    
    if (!imageData || !imageData.data) {
      console.warn('Invalid image data for post effects');
      return;
    }
    
    const data = imageData.data;

    // Apply scanline effect
    this.scanlineOffset = (this.scanlineOffset + 1) % 4;
    
    for (let y = 0; y < this.height; y++) {
      // Scanlines
      if (y % 4 !== this.scanlineOffset) {
        const scanlineAlpha = 0.9;
        for (let x = 0; x < this.width; x++) {
          const index = (y * this.width + x) * 4;
          data[index] *= scanlineAlpha;     // R
          data[index + 1] *= scanlineAlpha; // G
          data[index + 2] *= scanlineAlpha; // B
        }
      }
      
      // VHS distortion effect - much reduced frequency
      const distortion = Math.sin(y * 0.02) * 1;
      if (Math.random() > 0.995) { // Much less frequent
        const glitchLine = y * this.width * 4;
        const glitchIntensity = 0.3 + Math.random() * 0.7;
        for (let x = 0; x < this.width * 4; x += 4) {
          if (glitchLine + x < data.length - 3) {
            data[glitchLine + x] = Math.floor(data[glitchLine + x] * glitchIntensity);
            data[glitchLine + x + 1] = Math.floor(data[glitchLine + x + 1] * glitchIntensity);
            data[glitchLine + x + 2] = Math.floor(data[glitchLine + x + 2] * glitchIntensity);
          }
        }
      }
    }

    // Color channel separation for glitch effect - much reduced
    if (this.glitchIntensity > 0.5 && Math.random() > 0.95) {
      // Use fallback if randomRange is not available
      let offset;
      if (typeof window.randomRange === 'function') {
        offset = Math.floor(window.randomRange(1, 3)); // Smaller offset
      } else {
        offset = Math.floor(Math.random() * 3) + 1; // Fallback: 1-3
      }
      for (let i = 0; i < data.length - 12; i += 4) {
        if (Math.random() > 0.8) {
          data[i] = Math.min(255, data[i] + offset * 10); // Red channel shift
          data[i + 2] = Math.max(0, data[i + 2] - offset * 10); // Blue channel shift
        }
      }
    }

    try {
      this.ctx.putImageData(imageData, 0, 0);
    } catch (error) {
      // Silently handle putImageData errors to prevent console spam
    }
  }

  // Draw text with glow effect
  drawGlowText(text, x, y, options = {}) {
    const {
      font = 'Orbitron',
      size = 24,
      color = '#00ffff',
      glowColor = '#00ffff',
      glowSize = 10,
      align = 'center',
      baseline = 'middle'
    } = options;

    this.ctx.save();
    this.ctx.font = `bold ${size}px ${font}`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    // Draw glow
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = glowSize;
    this.ctx.fillStyle = glowColor;
    this.ctx.fillText(text, x, y);

    // Draw main text
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);

    this.ctx.restore();
  }

  // Draw neon rectangle
  drawNeonRect(x, y, width, height, options = {}) {
    const {
      color = '#ff00ff',
      glowColor = '#ff00ff',
      glowSize = 20,
      filled = false,
      fillColor = 'rgba(255, 0, 255, 0.1)'
    } = options;

    this.ctx.save();

    // Draw glow
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = glowSize;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2;

    if (options.filled) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fillRect(x, y, width, height);
    }

    this.ctx.strokeRect(x, y, width, height);

    this.ctx.restore();
  }

  // Draw health bar with segments
  drawHealthBar(x, y, width, height, currentHealth, maxHealth) {
    const segmentWidth = width / maxHealth;
    const segmentGap = 2;

    for (let i = 0; i < maxHealth; i++) {
      const segmentX = x + (i * segmentWidth) + segmentGap;
      const segmentY = y + segmentGap;
      const segmentHeight = height - (segmentGap * 2);

      if (i < currentHealth) {
        // Active segment with gradient
        const gradient = this.ctx.createLinearGradient(
          segmentX, segmentY, 
          segmentX + segmentWidth - segmentGap, segmentY
        );
        gradient.addColorStop(0, '#ff00ff');
        gradient.addColorStop(1, '#00ffff');
        
        // Fill with gradient first
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(segmentX, segmentY, segmentWidth - segmentGap, segmentHeight);
        
        // Draw neon outline only (no fill)
        this.ctx.save();
        this.ctx.shadowColor = '#00ffff';
        this.ctx.shadowBlur = 5;
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(segmentX, segmentY, segmentWidth - segmentGap, segmentHeight);
        this.ctx.restore();
      } else {
        // Empty segment
        this.ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
        this.ctx.fillRect(segmentX, segmentY, segmentWidth - segmentGap, segmentHeight);
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        this.ctx.strokeRect(segmentX, segmentY, segmentWidth - segmentGap, segmentHeight);
      }
    }
  }

  // Update effect properties
  update(deltaTime) {
    try {
      // Gradually reduce glitch effect
      if (this.glitchIntensity > 0) {
        this.glitchIntensity = Math.max(0, this.glitchIntensity - deltaTime * 0.001);
      }

      // Gradually reduce chromatic aberration
      if (this.chromaticAberration > 0) {
        this.chromaticAberration = Math.max(0, this.chromaticAberration - deltaTime * 0.01);
      }
      
      // Smooth zoom level transitions
      if (Math.abs(this.zoomLevel - this.targetZoomLevel) > 0.001) {
        this.zoomLevel += (this.targetZoomLevel - this.zoomLevel) * this.zoomSpeed;
      }
    } catch (error) {
      console.error('Error updating renderer:', error?.message || error);
    }
  }

  // Check if canvas is tainted by cross-origin data
  isCanvasTainted() {
    try {
      // Try a small getImageData operation to test if canvas is tainted
      // Use 1x1 pixel to minimize performance impact
      this.ctx.getImageData(0, 0, 1, 1);
      return false; // If no error, canvas is not tainted
    } catch (error) {
      return true; // If error occurs, canvas is tainted
    }
  }

  // Reset post effects state (can be called after canvas is cleaned)
  resetPostEffects() {
    // Re-enable post effects if canvas might be clean
    if (!this.isCanvasTainted()) {
      this.postEffects = true;
    }
  }

  // Trigger glitch effect
  addGlitch(intensity, duration) {
    this.glitchIntensity = intensity;
    this.chromaticAberration = intensity * 2;
    
    // Auto-reduce after duration
    setTimeout(() => {
      this.glitchIntensity *= 0.5;
      this.chromaticAberration *= 0.5;
    }, duration);
  }
  
  // Update camera zoom based on player position
  updateZoomFromPlayer(playerX, playerY) {
    // For side-scroller, we want zoom based on player's position in the FOREGROUND image
    // The FG image is 4096px wide, and we want maximum zoom when player is at center of FG (2048px)
    const fgCenter = 2048; // Center of the 4096px wide foreground image
    const fgHalfWidth = 2048; // Half width of FG image
    
    // Calculate distance from FG center (not screen center)
    const distanceFromFGCenter = Math.abs(playerX - fgCenter);
    
    // Create a center deadzone where no zoom happens
    const centerDeadzone = 400; // 400px deadzone in center (200px each side)
    
    // Calculate effective distance only outside the deadzone
    const effectiveDistance = Math.max(0, distanceFromFGCenter - centerDeadzone);
    
    // Calculate the remaining usable distance after deadzone
    const usableDistance = fgHalfWidth - centerDeadzone;
    
    // Normalize distance from edge of deadzone to world edges
    const normalizedDistance = Math.min(effectiveDistance / usableDistance, 1.0);
    
    // Apply smooth easing for the edge zones only
    // Use cubic ease for natural transition from deadzone to edges
    const easedDistance = 1.0 - Math.pow(1.0 - normalizedDistance, 3); // Cubic ease-in
    
    // Calculate zoom level with deadzone
    // In deadzone (0): 0.625 zoom (37.5% zoomed out - increased by 25%)
    // At world edges (1): 1.0 zoom (normal)
    const zoomRange = 0.375; // Range from normal to max zoom out (increased from 0.3)
    this.targetZoomLevel = 0.625 + easedDistance * zoomRange;
    
    // Clamp between 0.625 (37.5% zoomed out) and 1.0 (normal)
    this.targetZoomLevel = Math.max(0.625, Math.min(1.0, this.targetZoomLevel));
  }
  
  // Get current zoom level
  getZoomLevel() {
    return this.zoomLevel;
  }
  
  // Set zoom level manually
  setZoomLevel(level) {
    this.targetZoomLevel = Math.max(0.625, Math.min(1.0, level));
  }
};

// Global context cache to prevent recreation
let cachedCanvas = null;
let cachedContext = null;
let rendererInitialized = false;
let rendererInitializationAttempts = 0;
const MAX_RENDERER_INIT_ATTEMPTS = 10;

// Ensure renderer variable exists before initialization
if (typeof window.renderer === 'undefined') {
  window.renderer = null;
}

// Initialize renderer with proper context caching
function initializeRenderer() {
  if (rendererInitialized) {
    return; // Already initialized
  }
  
  rendererInitializationAttempts++;
  
  if (rendererInitializationAttempts > MAX_RENDERER_INIT_ATTEMPTS) {
    console.error('🚫 Renderer initialization failed after maximum attempts - creating fallback to prevent infinite loop');
    createFallbackRenderer();
    return;
  }
  
  try {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.warn(`Canvas not found, retrying... (attempt ${rendererInitializationAttempts}/${MAX_RENDERER_INIT_ATTEMPTS})`);
      setTimeout(initializeRenderer, 100);
      return;
    }
    
    // Cache canvas reference
    if (!cachedCanvas) {
      cachedCanvas = canvas;
    }
    
    // Get context only once
    if (!cachedContext) {
      try {
        cachedContext = canvas.getContext('2d');
        if (!cachedContext) {
          console.error('Failed to get 2D context from canvas');
          // Check for context limit specifically
          const testCanvas = document.createElement('canvas');
          const testContext = testCanvas.getContext('2d');
          if (!testContext) {
            console.error('🚫 Canvas context creation limit exceeded - possible infinite loop detected');
            // CRITICAL: Stop trying to prevent infinite loop
            createFallbackRenderer();
            return;
          } else {
            // CRITICAL: Don't retry if context creation failed - use fallback
            console.error('Canvas context creation failed - using fallback renderer');
            createFallbackRenderer();
            return;
          }
        }
      } catch (contextError) {
        console.error('Error getting canvas context:', contextError?.message || contextError?.toString() || 'Unknown error');
        // CRITICAL: Check for any context-related error and stop retrying
        if (contextError.message && (
            contextError.message.includes('context creation limit') ||
            contextError.message.includes('Maximum number') ||
            contextError.message.includes('context limit')
        )) {
          console.error('🚫 Canvas context creation limit exceeded - possible infinite loop detected');
          createFallbackRenderer();
          return;
        }
        // CRITICAL: For any other context errors, also use fallback to prevent loops
        console.error('Canvas context error - using fallback renderer to prevent infinite loop');
        createFallbackRenderer();
        return;
      }
    }
    
    // Create renderer instance
    try {
      window.renderer = new window.Renderer(canvas);
      rendererInitialized = true;
      console.log('Renderer initialized successfully');
    } catch (rendererError) {
      console.error('Error creating renderer instance:', rendererError?.message || rendererError?.toString() || 'Unknown error');
      createFallbackRenderer();
    }
    
  } catch (error) {
    console.error('Error during renderer initialization:', error?.message || error?.toString() || 'Unknown error');
    // CRITICAL: Don't retry on general errors - use fallback to prevent loops
    createFallbackRenderer();
  }
}

function createFallbackRenderer() {
  console.log('Creating fallback renderer to prevent crashes and infinite loops');
  window.renderer = {
    clear: () => {
      // Minimal canvas clearing for fallback
      if (cachedCanvas && cachedContext) {
        try {
          cachedContext.clearRect(0, 0, cachedCanvas.width, cachedCanvas.height);
        } catch (error) {
          // Silent fail to prevent error spam
        }
      }
    },
    applyScreenShake: () => {},
    getTransformedContext: () => {
      // Return a safe context-like object
      if (cachedContext) {
        try {
          cachedContext.save();
          return cachedContext;
        } catch (error) {
          return { save: () => {}, restore: () => {} };
        }
      }
      return { save: () => {}, restore: () => {} };
    },
    restoreContext: () => {
      if (cachedContext) {
        try {
          cachedContext.restore();
        } catch (error) {
          // Silent fail
        }
      }
    },
    applyPostEffects: () => {},
    drawHealthBar: () => {},
    drawGlowText: () => {},
    update: () => {},
    addScreenShake: () => {},
    addGlitch: () => {},
    width: 1920,
    height: 1080,
    ctx: cachedContext || null,
    canvas: cachedCanvas || null,
    postEffects: false
  };
  rendererInitialized = true;
}

// Initialize renderer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRenderer);
} else {
  initializeRenderer();
}