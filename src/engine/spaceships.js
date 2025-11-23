// Flying space ships system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/spaceships.js',
  exports: ['SpaceShipSystem', 'spaceShipSystem'],
  dependencies: ['Vector2D', 'clamp']
});

window.SpaceShipSystem = class SpaceShipSystem {
  constructor() {
    this.ships = [];
    this.shipImages = [null, null, null]; // Array for multiple ship types
    this.imagesLoaded = [false, false, false];
    this.lastSpawnTime = 0;
    this.spawnInterval = 4000; // Spawn ships every 4 seconds (more reasonable rate)
    this.canvasWidth = 1920;
    this.canvasHeight = 1080;
    
    // Load ship GIFs
    this.loadShipImages();
  }
  
  // Load multiple ship images directly (simplified approach)
  loadShipImages() {
    const shipUrls = [
      'https://i.postimg.cc/xj3VcRP3/Ship1.gif',
      'https://i.postimg.cc/T1LNxnfz/Ship2.gif',
      'https://i.postimg.cc/1zM9TVmz/Ship3.gif'
    ];
    
    shipUrls.forEach((url, index) => {
      // Load directly as image (most reliable approach)
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.shipImages[index] = img;
        this.imagesLoaded[index] = true;
        console.log(`✓ Space ship ${index + 1} loaded successfully`);
        console.log(`Ship ${index + 1} dimensions: ${img.width}x${img.height}`);
      };
      
      img.onerror = () => {
        console.warn(`⚠️ Failed to load space ship ${index + 1}, using fallback`);
        this.shipImages[index] = null;
        this.imagesLoaded[index] = false;
      };
      
      img.src = url;
    });
  }
  
  // Create fallback ship (rectangle)
  createFallbackShip() {
    this.imageLoaded = true;
    console.log('Using fallback ship rendering');
  }
  
  // Spawn a new space ship
  spawnShip() {
    const currentTime = Date.now();
    
    // Check if it's time to spawn a new ship
    if (currentTime - this.lastSpawnTime < this.spawnInterval) {
      return;
    }
    
    // CRITICAL: Occasionally spawn a foreground ship (15% chance)
    const isForegroundShip = Math.random() < 0.15; // 15% chance
    
    // Play whoosh sound 3 seconds BEFORE spawning foreground ship
    if (isForegroundShip) {
      setTimeout(() => {
        if (window.audioSystem && window.audioSystem.isInitialized && window.audioSystem.playRandomWhoosh) {
          try {
            window.audioSystem.playRandomWhoosh();
            console.log('🚀 WHOOSH SOUND: Playing 3 seconds BEFORE foreground ship spawns!');
          } catch (error) {
            console.error('Error playing pre-spawn whoosh sound:', error?.message || error);
          }
        } else {
          console.log('🚀 Pre-spawn whoosh skipped - audio system not ready:', {
            hasAudio: !!window.audioSystem,
            isInitialized: window.audioSystem?.isInitialized,
            hasMethod: !!window.audioSystem?.playRandomWhoosh
          });
        }
      }, 0); // Play whoosh sound immediately
      
      // Actually spawn the ship after 3 seconds
      setTimeout(() => {
        this.createForegroundShip();
      }, 3000);
      
      this.lastSpawnTime = currentTime;
      return;
    }
    
    if (isForegroundShip) {
      // Foreground ship - let the createForegroundShip method handle it
      return; // Don't create normal ship for foreground ships
    }
    
    // Normal ship - standard depth range between BG and FG
    const depth = Math.random() * 0.8 + 0.1; // Between 0.1 and 0.9
    const sizeMultiplier = 1.0;
    const speedMultiplier = 1.0;
    
    // CRITICAL FIX: Make ships much larger and more visible
    const baseSize = 120; // Double the base size
    
    // Apply size multiplier
    const sizeVariation = baseSize * (0.5 + depth * 1.5) * sizeMultiplier;
    
    // Speed based on depth (25% faster now)
    const baseSpeed = 6.25; // Increased from 5 to 6.25 (25% faster)
    const speed = baseSpeed * (0.5 + depth * 2) * speedMultiplier; // Apply speed multiplier
    
    // Random direction (left to right or right to left)
    const direction = Math.random() < 0.5 ? 1 : -1; // 1 = right, -1 = left
    
    // CRITICAL FIX: Extend spawn edges much further to prevent abrupt appearances
    let startX, startY;
    const baseSpawnDistance = sizeVariation * 3; // Base 3x ship size
    const edgeExtension = 300; // Additional 300px extension
    const totalSpawnDistance = baseSpawnDistance + edgeExtension; // Total spawn distance
    
    if (direction === 1) {
      // Left to right - start far left off screen with extra extension
      startX = -totalSpawnDistance;
    } else {
      // Right to left - start far right off screen with extra extension
      startX = this.canvasWidth + totalSpawnDistance;
    }
    
    // CRITICAL FIX: Limit spawn to top half only with more randomness
    const spawnHeight = 400; // Larger range but limited to top half
    const baseHeight = -400; // Start higher to ensure top half only
    startY = Math.random() * spawnHeight + baseHeight; // Between -400 and 0 pixels from top (top half only)
    
    const ship = {
      x: startX,
      y: startY,
      size: sizeVariation,
      speed: speed * direction,
      depth: depth,
      direction: direction,
      opacity: 1.0, // CRITICAL FIX: Remove all transparency - fully opaque
      shipType: Math.floor(Math.random() * 3), // Randomly choose ship 0, 1, or 2
      isForeground: false, // Normal ships are not foreground
      animationFrame: 0,
      animationSpeed: 0.1 + depth * 0.1, // Faster animation for closer ships
      lastAnimationUpdate: Date.now(),
      rotation: 0, // Keep ships upright
      flipH: direction === -1, // CRITICAL FIX: Flip horizontally when going right-to-left
      bobOffset: Math.random() * Math.PI * 2, // Random bobbing phase
      bobAmount: 5 + Math.random() * 10 // Random bobbing amount
    };
    
    this.ships.push(ship);
    this.lastSpawnTime = currentTime;
    
    const shipTypeText = isForegroundShip ? 'FOREGROUND' : 'Normal';
    console.log(`🚀 Spawned ${shipTypeText} ship ${ship.shipType + 1}: size=${sizeVariation.toFixed(1)}, speed=${Math.abs(speed).toFixed(1)}, depth=${depth.toFixed(2)}, direction=${direction === 1 ? '→' : '←'}, startX=${startX.toFixed(1)}`);
  }
  
  // Update all ships
  update(deltaTime) {
    const dt = deltaTime / 1000;
    const currentTime = Date.now();
    
    // Spawn new ships periodically
    this.spawnShip();
    
    // Update existing ships
    this.ships = this.ships.filter(ship => {
      // Move ship
      ship.x += ship.speed * dt * 60; // 60fps normalization
      
      // Gentle bobbing motion
      const bobPhase = currentTime / 1000 + ship.bobOffset;
      const bobY = Math.sin(bobPhase * 2) * ship.bobAmount;
      
      // Update animation frame - no longer needed for GIF images
      // GIFs animate automatically, so we don't need to manually update frames
      ship.lastAnimationUpdate = currentTime;
      
      // CRITICAL FIX: Match despawn boundaries with spawn distances for seamless transitions
      const baseDespawnDistance = ship.size * 3; // Base 3x ship size
      const edgeExtension = 300; // Same 300px extension as spawn
      const totalDespawnDistance = baseDespawnDistance + edgeExtension;
      
      if (ship.direction === 1) {
        return ship.x < this.canvasWidth + totalDespawnDistance; // Left to right - match spawn distance
      } else {
        return ship.x > -totalDespawnDistance; // Right to left - match spawn distance
      }
    });
  }
  
  // Create a foreground ship (larger, faster, appears in front)
  createForegroundShip() {
    // Foreground ship properties - much larger and faster
    const depth = 1.2; // Beyond normal range (will render in front of FG)
    const sizeMultiplier = 2.5; // 2.5x larger than normal
    const speedMultiplier = 4.0; // 4x faster than normal (even faster)
    
    // CRITICAL FIX: Make ships much larger and more visible
    const baseSize = 120; // Double the base size
    
    // Apply multipliers for foreground ships
    const sizeVariation = baseSize * (0.5 + depth * 1.5) * sizeMultiplier;
    
    // Speed based on depth (25% faster now)
    const baseSpeed = 6.25; // Increased from 5 to 6.25 (25% faster)
    const speed = baseSpeed * (0.5 + depth * 2) * speedMultiplier;
    
    // Random direction (left to right or right to left)
    const direction = Math.random() < 0.5 ? 1 : -1; // 1 = right, -1 = left
    
    // CRITICAL FIX: Extend spawn edges much further to prevent abrupt appearances
    let startX, startY;
    const baseSpawnDistance = sizeVariation * 3; // Base 3x ship size
    const edgeExtension = 300; // Additional 300px extension
    const totalSpawnDistance = baseSpawnDistance + edgeExtension;
    
    if (direction === 1) {
      // Left to right - start far left off screen
      startX = -totalSpawnDistance;
    } else {
      // Right to left - start far right off screen
      startX = this.canvasWidth + totalSpawnDistance;
    }
    
    // CRITICAL FIX: Limit spawn to top half only with more randomness
    const spawnHeight = 400;
    const baseHeight = -400;
    startY = Math.random() * spawnHeight + baseHeight;
    
    const ship = {
      x: startX,
      y: startY,
      size: sizeVariation,
      speed: speed * direction,
      depth: depth,
      direction: direction,
      opacity: 1.0,
      shipType: Math.floor(Math.random() * 3), // Randomly choose ship 0, 1, or 2
      isForeground: true, // Track if this is a foreground ship
      animationFrame: 0,
      animationSpeed: 0.1 + depth * 0.1,
      lastAnimationUpdate: Date.now(),
      rotation: 0,
      flipH: direction === -1,
      bobOffset: Math.random() * Math.PI * 2,
      bobAmount: 5 + Math.random() * 10
    };
    
    this.ships.push(ship);
    console.log(`🚀 SPAWNING FOREGROUND SHIP ${ship.shipType + 1}: size=${sizeVariation.toFixed(1)}, speed=${Math.abs(speed).toFixed(1)}, direction=${direction === 1 ? '→' : '←'}, startX=${startX.toFixed(1)}`);
  }
  
  // Draw a single ship
  drawShip(ctx, ship) {
    ctx.save();
    
    // CRITICAL FIX: Remove opacity setting - ships are fully opaque
    // ctx.globalAlpha = ship.opacity; // Removed transparency
    
    // Move to ship position
    const bobY = Math.sin(Date.now() / 1000 + ship.bobOffset) * ship.bobAmount;
    ctx.translate(ship.x, ship.y + bobY);
    
    // Apply horizontal flip for right-to-left ships
    if (ship.flipH) {
      ctx.scale(-1, 1);
    }
    
    // Rotate to face direction
    ctx.rotate(ship.rotation);
    
    // Debug rectangles removed - ships are working properly
    
    // Get the correct ship image based on ship type
    const shipData = this.shipImages[ship.shipType];
    const imageLoaded = this.imagesLoaded[ship.shipType];
    
    if (imageLoaded && shipData) {
      // Always treat as image (video approach removed)
      const shipImage = shipData;
      
      // Special handling for Ship3 (shipType 2) - flip horizontally and make it less tall
      if (ship.shipType === 2) {
        const width = ship.size;
        const height = ship.size * 0.35; // Make it 65% shorter (30% shorter than current)
        ctx.save();
        ctx.scale(-1, 1); // Flip horizontally
        
        // Canvas, video, or regular image - just draw the whole thing
        ctx.drawImage(
          shipImage,
          -width / 2,
          -height / 2,
          width,
          height
        );
        ctx.restore();
      } else {
        // Normal drawing for Ship1 and Ship2
        // Canvas, video, or regular image - just draw the whole thing
        ctx.drawImage(
          shipImage,
          -ship.size / 2,
          -ship.size / 2,
          ship.size,
          ship.size
        );
      }
      console.log(`🚀 Drawing ship ${ship.shipType + 1} with GIF at (${ship.x.toFixed(1)}, ${ship.y.toFixed(1)}) size ${ship.size.toFixed(1)}`);
    } else {
      // Draw fallback ship (rectangle with details)
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(-ship.size / 2, -ship.size / 4, ship.size, ship.size / 2);
      
      // Cockpit
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(-ship.size / 4, -ship.size / 8, ship.size / 2, ship.size / 4);
      
      // Engine glow
      if (ship.direction === 1) {
        // Left engine glow
        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.fillRect(-ship.size / 2 - 5, -ship.size / 8, 5, ship.size / 4);
      } else {
        // Right engine glow
        ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.fillRect(ship.size / 2, -ship.size / 8, 5, ship.size / 4);
      }
      console.log(`🚀 Drawing fallback ship at (${ship.x.toFixed(1)}, ${ship.y.toFixed(1)}) size ${ship.size.toFixed(1)}`);
    }
    
    ctx.restore();
  }
  
  // Draw normal ships (between BG and FG layers)
  drawNormalShips(ctx) {
    const normalShips = this.ships.filter(ship => !ship.isForeground);
    
    // Always draw debug info to see if system is working
    if (!this.lastDebugLog || Date.now() - this.lastDebugLog > 1000) {
      const foregroundCount = this.ships.filter(ship => ship.isForeground).length;
      console.log(`🚀 Space Ship System Status:`);
      console.log(`  - Normal ships: ${normalShips.length}`);
      console.log(`  - Foreground ships: ${foregroundCount}`);
      console.log(`  - Images loaded: ${this.imagesLoaded.filter(loaded => loaded).length}/${this.imagesLoaded.length}`);
      if (normalShips.length > 0) {
        console.log(`  - First ship: x=${normalShips[0].x.toFixed(1)}, y=${normalShips[0].y.toFixed(1)}, size=${normalShips[0].size.toFixed(1)}`);
      }
      this.lastDebugLog = Date.now();
    }
    
    if (normalShips.length === 0) {
      return;
    }
    
    // Sort normal ships by depth (back to front)
    const sortedShips = [...normalShips].sort((a, b) => a.depth - b.depth);
    
    // Draw each normal ship
    sortedShips.forEach(ship => {
      this.drawShip(ctx, ship);
    });
  }
  
  // Draw foreground ships (in front of FG layer)
  drawForegroundShips(ctx) {
    const foregroundShips = this.ships.filter(ship => ship.isForeground);
    
    if (foregroundShips.length === 0) {
      return;
    }
    
    // Sort foreground ships by depth
    const sortedShips = [...foregroundShips].sort((a, b) => a.depth - b.depth);
    
    // Draw each foreground ship
    sortedShips.forEach(ship => {
      this.drawShip(ctx, ship);
    });
  }
  
  // Legacy draw method for compatibility
  draw(ctx) {
    this.drawNormalShips(ctx);
  }
  
  // Clear all ships
  clear() {
    this.ships = [];
    console.log('🚀 All space ships cleared');
  }
  
  // Get ship count
  getShipCount() {
    return this.ships.length;
  }
  
  // Check if system is ready
  isReady() {
    return this.imagesLoaded.some(loaded => loaded); // Ready if at least one ship image is loaded
  }
};

// Initialize global space ship system
window.spaceShipSystem = null;

// Initialize space ship system
window.initSpaceShips = function() {
  try {
    window.spaceShipSystem = new window.SpaceShipSystem();
    console.log('✓ Space ship system initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize space ship system:', error?.message || error);
    return false;
  }
};