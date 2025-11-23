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
      console.log('Layer not loaded, skipping');
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
    
    console.log('Drawing layer:', {
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
        ctx.restore();
        ctx.restore();
        ctx.restore();
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
    console.log('🔧 Parallax draw called with', this.layers.length, 'layers');
    // Draw layers in order (back to front)
    this.layers.forEach((layer, index) => {
      console.log('Drawing layer', index);
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