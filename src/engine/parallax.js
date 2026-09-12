// Parallax background system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/parallax.js',
  exports: ['ParallaxBackground', 'parallaxBackground'],
  dependencies: ['Vector2D', 'clamp']
});

window.ParallaxBackground = class ParallaxBackground {
  constructor() {
    this.layers = [];
    this.cameraX = 960; // Default camera center
    this.cameraY = 540;
    // Display interiors on the locked 1279x462 foreground; final value is the
    // encounter that restores this part of the street. No replacement artwork.
    this.signalDisplays = [
      [96, 158, 69, 21, 0], [99, 273, 79, 13, 0], [270, 271, 74, 9, 0],
      [512, 159, 62, 67, 1], [488, 335, 53, 54, 1],
      [626, 215, 87, 32, 2], [632, 320, 124, 70, 2], [839, 240, 92, 16, 2],
      [1183, 185, 43, 60, 3], [1012, 350, 91, 41, 3], [1167, 344, 42, 46, 3]
    ];
  }
  
  // Add a parallax layer
  addLayer(options = {}) {
    const {
      image = null,
      imageUrl = '',
      x = 0,
      y = 0,
      width = 1920,
      height = 1080,
      scrollFactorX = 1.0, // 0 = no movement, 1 = moves with camera
      scrollFactorY = 1.0,
      opacity = 1.0,
      blendMode = 'source-over',
      repeatX = false, // Tile horizontally
      repeatY = false  // Tile vertically
    } = options;
    
    const layer = {
      image: image,
      imageUrl: imageUrl,
      x: x,
      y: y,
      width: width,
      height: height,
      scrollFactorX: scrollFactorX,
      scrollFactorY: scrollFactorY,
      opacity: opacity,
      blendMode: blendMode,
      repeatX: repeatX,
      repeatY: repeatY,
      loaded: false,
      imgElement: null
    };
    
    // Load image if URL provided
    if (imageUrl && !image) {
      this.loadImage(layer);
    } else if (image) {
      layer.loaded = true;
      layer.imgElement = image;
    }
    
    this.layers.push(layer);
    return layer;
  }
  
  // Load image for a layer
  loadImage(layer) {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle potential CORS issues
    
    img.onload = () => {
      layer.imgElement = img;
      layer.loaded = true;
      // Keep canvas dimensions for proper visibility
      console.log(`✓ Parallax layer loaded: ${layer.imageUrl}`);
      console.log(`Native image dimensions: ${img.width}x${img.height}`);
      console.log(`Canvas dimensions: ${layer.width}x${layer.height}`);
    };
    
    img.onerror = () => {
      console.error(`❌ Failed to load parallax layer: ${layer.imageUrl}`);
      layer.loaded = false;
      // Try loading without crossOrigin
      console.log('Retrying without crossOrigin...');
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        layer.imgElement = fallbackImg;
        layer.loaded = true;
        // Keep canvas dimensions for proper visibility
        console.log(`✓ Parallax layer loaded (fallback): ${layer.imageUrl} - canvas size: ${layer.width}x${layer.height}`);
      };
      fallbackImg.onerror = () => {
        console.error(`❌ Failed to load parallax layer (fallback): ${layer.imageUrl}`);
      };
      fallbackImg.src = layer.imageUrl;
    };
    
    img.src = layer.imageUrl;
  }
  
  // Update camera position (call this every frame)
  updateCamera(x, y) {
    this.cameraX = x;
    this.cameraY = y;
  }
  
  // Calculate parallax offset for a layer with side-scroller camera
  getParallaxOffset(layer) {
    const canvasWidth = 1920;
    const canvasHeight = 1080;
    
    // Calculate camera position for side-scroller
    // Camera follows player but stays within world bounds
    let cameraX = this.cameraX;
    let cameraY = this.cameraY;
    
    // Keep camera within world boundaries (4096px wide world)
    const worldWidth = 4096;
    const halfCanvas = canvasWidth / 2;
    
    // Camera follows player with smooth constraints
    cameraX = window.clamp?.(cameraX, halfCanvas, worldWidth - halfCanvas) || cameraX;
    
    // Calculate offset relative to world center (2048px)
    const worldCenterX = worldWidth / 2;
    const cameraDeltaX = cameraX - worldCenterX;
    
    // Apply parallax scroll factor
    const offsetX = cameraDeltaX * layer.scrollFactorX;
    const offsetY = 0; // No vertical scrolling
    
    return { x: offsetX, y: offsetY };
  }
  
  // Draw a single layer
  drawLayer(ctx, layer) {
    if (!layer.loaded) {
      if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log('Layer not loaded, skipping');
      return;
    }
    
    ctx.save();
    
    // Enable high-quality image smoothing for clarity
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Set opacity and blend mode
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    
    // Calculate parallax offset
    const offset = this.getParallaxOffset(layer);
    
    if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log('Drawing layer:', {
      loaded: layer.loaded,
      hasImage: !!layer.imgElement,
      repeatX: layer.repeatX,
      repeatY: layer.repeatY,
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      offsetX: offset.x,
      offsetY: offset.y
    });
    
    // Check if we have a fallback color (when image fails to load)
    if (layer.fallbackColor && !layer.imgElement) {
      // Draw fallback rectangle
      if (layer.repeatX) {
        // Draw tiled fallback
        this.drawTiledFallback(ctx, layer, offset);
      } else {
        // Draw single fallback rectangle
        const drawX = layer.x - offset.x;
        const drawY = layer.y - offset.y;
        ctx.fillStyle = layer.fallbackColor;
        ctx.fillRect(drawX, drawY, layer.width, layer.height);
      }
    } else if (layer.imgElement) {
      // Draw image
      if (layer.repeatX || layer.repeatY) {
        // Draw tiled pattern
        this.drawTiledLayer(ctx, layer, offset);
      } else {
        // Draw the image at native high resolution (4096x1479)
        ctx.save();
        // Set highest quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Draw at 4x size while maintaining quality
        ctx.save();
        // Set highest quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Draw at 30% smaller size (70% of 4x = 2.8x)
        ctx.save();
        // Set highest quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // Calculate new size: 1.075x of original (40% smaller than 1.792x)
        const newWidth = 4400;
        const newHeight = 1589;
        // Side-scroller camera: background moves opposite to camera
        const drawX = 1920/2 - newWidth/2 - offset.x; // Center background and apply camera offset
        const drawY = -550; // Moved up 50px
        ctx.drawImage(layer.imgElement, drawX, drawY, newWidth, newHeight);
        this.drawSignalLights(ctx, layer, drawX, drawY, newWidth, newHeight);
        ctx.restore();
        ctx.restore();
        ctx.restore();
      }
    }
    
    ctx.restore();
  }
  
  drawSignalLights(ctx, layer, x, y, width, height) {
    if (layer !== this.layers[1] || !layer.imgElement) return;
    const district = window.sector1Progression?.getDistrictSignalState?.();
    if (district?.active) { this.drawDistrictSignals(ctx, x, y, width, height, district); return; }
    if (window.sector1Progression?.isGameplaySuppressed?.()) return;
    const time = window.audioSystem?.context?.currentTime;
    const sample = Number.isFinite(time) ? window.BARCODE?.MusicTransport?.sample?.(time) : null;
    if (!sample?.running || !sample.grid || sample.profileId !== 'level-01.main') return;
    // Sign interiors measured in the approved 1279x462 foreground source.
    // Reuse the exact draw transform so camera motion cannot detach the light.
    const signs = [[99, 273, 79, 13], [270, 271, 74, 9], [626, 215, 87, 32],
      [839, 240, 92, 16], [1183, 185, 43, 60]];
    const sx = width / 1279, sy = height / 462;
    const fraction = sample.grid.beatFloat % 1;
    const pulse = Math.pow(1 - fraction, 3);
    const combatScale = window.sector1Progression?.isBossCombatLive?.() ? 0.35 : 1;
    ctx.save(); ctx.shadowBlur = 0;
    signs.forEach(([left, top, w, h], i) => {
      const screenX = x + left * sx;
      if (screenX + w * sx < -400 || screenX > 2320) return;
      const accent = i % 2 ? '204, 125, 255' : '113, 255, 229';
      ctx.fillStyle = `rgba(${accent}, ${(pulse * (window.rhythmSystem?.isActive?.() ? 0.38 : 0.12)) * combatScale})`;
      ctx.fillRect(screenX, y + top * sy, w * sx, h * sy);
    });
    ctx.restore();
  }

  drawDistrictSignals(ctx, x, y, width, height, district) {
    const sx = width / 1279, sy = height / 462;
    const time = window.audioSystem?.context?.currentTime;
    const sample = Number.isFinite(time) ? window.BARCODE?.MusicTransport?.sample?.(time) : null;
    const pulse = sample?.running && sample.grid && sample.profileId === 'level-01.main'
      ? Math.pow(1 - sample.grid.beatFloat % 1, 3) : 0;
    const quiet = window.sector1Progression?.isBossCombatLive?.() ? 0.55 : 1;
    const performing = !!window.rhythmSystem?.isActive?.();
    const kick = window.BARCODE?.combatFX?.sceneKick || 0;
    const energy = performing ? 0.2 + pulse * 0.7 + kick * 0.3 : pulse * 0.1;
    const restoredAt = worldX => district.restored ? 1 : district.wave
      ? Math.max(0, Math.min(1, (district.wave.radius - Math.abs(worldX - district.wave.originX)) / 200)) : 0;
    ctx.save();
    ctx.translate(x, y); ctx.scale(sx, sy); ctx.shadowBlur = 0;
    this.signalDisplays.forEach(([left, top, w, h, zone], index) => {
      if (x + (left + w) * sx < -400 || x + left * sx > 2320) return;
      const recovery = district.zones[zone].recovery;
      const restored = restoredAt(-152 + (left + w / 2) * 4400 / 1279);
      const interference = district.interference * (1 - recovery * 0.65) * (1 - restored);
      // Opaque art remains visible. Corruption is a few slow, localized broken
      // scan lines; clearing the encounter brings steady light underneath them.
      ctx.fillStyle = `rgba(4, 8, 29, ${0.22 * interference})`;
      ctx.fillRect(left, top, w, h);
      ctx.fillStyle = `rgba(113, 255, 229, ${(recovery * 0.14 + restored * 0.1 + energy * 0.24) * quiet})`;
      ctx.fillRect(left, top, w, h);
      if (performing || kick > 0) {
        // Small equalizer bars stay inside the real sign interiors. Attacks
        // brighten the scene briefly; the beat alone never implies damage.
        ctx.fillStyle = `rgba(${index % 2 ? '224,139,255' : '129,255,231'}, ${(0.24 + energy * 0.38) * quiet})`;
        for (let bar = 0; bar < 6; bar++) {
          const barHeight = Math.min(h * 0.62, (0.2 + energy * 0.7) * h * (0.35 + Math.abs(Math.sin(bar * 1.7 + index)) * 0.65));
          ctx.fillRect(left + 3 + bar * (w - 6) / 6, top + h - 2 - barHeight, Math.max(1, (w - 6) / 9), barHeight);
        }
        ctx.fillRect(left, top + h - 1.5, w, 1.5);
      }
      const scan = (district.elapsedMs / 180 + index * 7) % h;
      ctx.fillStyle = `rgba(214, 122, 246, ${0.22 * interference * quiet})`;
      for (let line = 0; line < 3 && interference > 0; line++) {
        const lineY = (scan + line * h / 3) % h;
        const lineX = left + (index * 11 + line * 13) % Math.max(1, w * 0.35);
        ctx.fillRect(lineX, top + lineY, w * 0.55, Math.min(1, h - lineY));
      }
      // A short recovery trace crosses each display, then settles. The final
      // wave lights these same displays in world order through the camera pan.
      const trace = Math.max(Math.sin(recovery * Math.PI), Math.sin(restored * Math.PI));
      if (trace > 0.001) {
        ctx.fillStyle = `rgba(176, 255, 239, ${trace * 0.55})`;
        ctx.fillRect(left, top + h - 2, w * Math.max(recovery, restored), 1.5);
      }
    });
    if (performing || kick > 0) {
      // Repeated curb segments make the musical reaction visible at full game
      // scale without tinting the whole screen or covering combat warnings.
      ctx.fillStyle = `rgba(109,255,229,${(0.15 + energy * 0.48) * quiet})`;
      for (let left = 8; left < 1279; left += 24) {
        if (x + (left + 15) * sx < -400 || x + left * sx > 2320) continue;
        ctx.fillRect(left, 412, 15, 1.2 + energy);
      }
    }
    // Travel along the existing curb. Only two bounded fronts are drawn; the
    // wave is scenery behind actors, hazards and HUD, never a screen flash.
    if (district.wave) {
      const origin = (district.wave.originX + 152) * 1279 / 4400;
      const radius = district.wave.radius * 1279 / 4400;
      for (const direction of [-1, 1]) {
        const front = origin + direction * radius;
        if (front < 0 || front > 1279) continue;
        for (let segment = 0; segment < 8; segment++) {
          const left = front - direction * segment * 8;
          ctx.fillStyle = `rgba(142, 255, 227, ${(1 - segment / 8) * 0.65})`;
          ctx.fillRect(Math.max(0, Math.min(1275, left)), 412, 4, 2);
        }
      }
    }
    ctx.restore();
  }

  // Draw tiled fallback (when image fails to load)
  drawTiledFallback(ctx, layer, offset) {
    const canvasWidth = 1920;
    const canvasHeight = 1080;
    
    // Calculate starting positions
    let startX = layer.x - offset.x;
    let startY = layer.y - offset.y;
    
    // Use layer dimensions
    let tileWidth = layer.width;
    let tileHeight = layer.height;
    
    // For ground-attached elements, position at bottom of screen
    if (layer.scrollFactorY <= 0.01) {
      startY = 1080 - tileHeight;
    } else {
      startY = startY - tileHeight;
    }
    
    if (layer.repeatX) {
      startX = startX % tileWidth;
      if (startX > 0) startX -= tileWidth;
    }
    
    if (layer.repeatY) {
      startY = startY % tileHeight;
      if (startY > 0) startY -= tileHeight;
    }
    
    // Draw tiles
    ctx.fillStyle = layer.fallbackColor;
    for (let y = startY; y < canvasHeight + tileHeight; y += tileHeight) {
      for (let x = startX; x < canvasWidth + tileWidth; x += tileWidth) {
        ctx.fillRect(x, y, tileWidth, tileHeight);
      }
    }
  }
  
  // Draw tiled/repeating layer
  drawTiledLayer(ctx, layer, offset) {
    const canvasWidth = 1920;
    const canvasHeight = 1080;
    
    // Calculate starting positions
    let startX = layer.x - offset.x;
    let startY = layer.y - offset.y;
    
    // Initialize tile dimensions as mutable variables
    let tileWidth, tileHeight;
    
    // Position from bottom - use NATIVE dimensions
    const imgHeight = layer.imgElement.height;
    tileHeight = layer.height;
    // Position the image to show the upper portion
    if (layer.scrollFactorY <= 0.01) {
      startY = -500; // Show upper portion of the image
    } else {
      startY = startY - tileHeight;
    }
    
    // If repeating, we need to draw enough tiles to cover the screen
    const imgWidth = layer.imgElement.width;
    
    // Use custom dimensions if specified, otherwise native image size
    tileWidth = layer.width || imgWidth;
    
    if (layer.repeatX) {
      // Wrap around for seamless tiling using tile dimensions
      startX = startX % tileWidth;
      if (startX > 0) startX -= tileWidth;
    }
    
    if (layer.repeatY) {
      // Wrap around for seamless tiling using tile dimensions
      startY = startY % tileHeight;
      if (startY > 0) startY -= tileHeight;
    }
    
    // Use NATIVE image dimensions - NO scaling
    tileWidth = imgWidth;
    tileHeight = imgHeight;
    
    for (let y = startY; y < canvasHeight + tileHeight; y += tileHeight) {
      for (let x = startX; x < canvasWidth + tileWidth; x += tileWidth) {
        // Draw at NATIVE size - no width/height parameters
        ctx.drawImage(layer.imgElement, x, y);
      }
    }
  }
  
  // Draw all layers (call this in your render loop)
  draw(ctx) {
    if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log('🔧 Parallax draw called with', this.layers.length, 'layers');
    // Draw layers in order (back to front)
    this.layers.forEach((layer, index) => {
      if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log('Drawing layer', index);
      this.drawLayer(ctx, layer);
    });
  }
  
  // Get layer by index
  getLayer(index) {
    return this.layers[index];
  }
  
  // Remove layer
  removeLayer(index) {
    if (index >= 0 && index < this.layers.length) {
      this.layers.splice(index, 1);
    }
  }
  
  // Clear all layers
  clear() {
    this.layers = [];
  }
  
  // Check if all layers are loaded
  isLoaded() {
    return this.layers.every(layer => layer.loaded);
  }
  
  // Get loading progress (0-1)
  getLoadingProgress() {
    if (this.layers.length === 0) return 1;
    const loaded = this.layers.filter(layer => layer.loaded).length;
    return loaded / this.layers.length;
  }
};

// Initialize global parallax background
window.parallaxBackground = null;

// Initialize parallax system
window.initParallax = function() {
  try {
    if (window.parallaxBackground) {
      return true;
    }
    window.parallaxBackground = new window.ParallaxBackground();
    
    // Add background layer (backmost) - slower parallax for depth
    const backgroundLayer = window.parallaxBackground.addLayer({
      imageUrl: 'https://i.postimg.cc/4yJ2CdJK/BG.png',
      scrollFactorX: 0.5, // Slower parallax for background depth
      scrollFactorY: 0, // No vertical movement
      opacity: 1.0, // Full opacity
      repeatX: false, // No tiling
      repeatY: false,
      x: 0, // Start from left edge
      y: -100, // Position for background layer
      width: 4096,
      height: 1479
    });
    
    // Add foreground layer (frontmost) - side-scroller camera follows player
    const foregroundLayer = window.parallaxBackground.addLayer({
      imageUrl: 'https://i.postimg.cc/gJT4gs1Q/FG.png',
      scrollFactorX: 1.0, // Full parallax scrolling for side-scroller camera
      scrollFactorY: 0, // No vertical movement
      opacity: 1.0, // Full opacity
      repeatX: false, // No tiling
      repeatY: false,
      x: 0, // Start from left edge
      y: -200, // Show upper portion
      width: 4096,
      height: 1479
    });
    
    console.log('✓ Parallax background initialized with 2 layers (BG + FG)');
    
    // Test if images load
    setTimeout(() => {
      console.log('Background image loading check - loaded:', backgroundLayer.loaded, 'hasImage:', !!backgroundLayer.imgElement);
      console.log('Foreground image loading check - loaded:', foregroundLayer.loaded, 'hasImage:', !!foregroundLayer.imgElement);
      
      if (!backgroundLayer.loaded) {
        console.error('❌ Background image failed to load completely');
        backgroundLayer.fallbackColor = '#1a0a2a'; // Dark purple fallback
        backgroundLayer.loaded = true;
      }
      
      if (!foregroundLayer.loaded) {
        console.error('❌ Foreground image failed to load completely');
        foregroundLayer.fallbackColor = '#2a0a4a'; // Lighter purple fallback
        foregroundLayer.loaded = true;
      }
    }, 3000);
    
    return true;
    
  } catch (error) {
    console.error('Failed to initialize parallax background:', error?.message || error?.toString() || 'Unknown error');
    return false;
  }
};
