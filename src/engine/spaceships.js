// Flying space ships system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/spaceships.js',
  exports: ['SpaceShipSystem', 'spaceShipSystem', 'initSpaceShips'],
  dependencies: ['Vector2D', 'clamp']
});

window.BARCODE = window.BARCODE || {};
window.BARCODE.assetLoadPromises = window.BARCODE.assetLoadPromises || {};
window.BARCODE.assetLoadDiagnostics = window.BARCODE.assetLoadDiagnostics || {};

function loadSharedImageAsset(assetId, url) {
  if (window.BARCODE.assetLoadPromises[assetId]) return window.BARCODE.assetLoadPromises[assetId];
  const started = Date.now();
  window.BARCODE.assetLoadPromises[assetId] = new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!window.BARCODE.assetLoadDiagnostics[assetId]) {
        window.BARCODE.assetLoadDiagnostics[assetId] = true;
        console.log(`[asset-load] ${assetId} loaded in ${Date.now() - started}ms`);
      }
      resolve(img);
    };
    img.onerror = () => {
      delete window.BARCODE.assetLoadPromises[assetId];
      if (!window.BARCODE.assetLoadDiagnostics[assetId]) {
        window.BARCODE.assetLoadDiagnostics[assetId] = true;
        console.warn(`[asset-load] ${assetId} failed in ${Date.now() - started}ms`);
      }
      reject(new Error(`Failed to load ${assetId}`));
    };
    img.src = url;
  });
  return window.BARCODE.assetLoadPromises[assetId];
}

window.SpaceShipSystem = class SpaceShipSystem {
  constructor() {
    this.ships = [];
    this.hazards = []; this.nextHazardMs = 6000; this.hazardSerial = 0;
    this.shipImages = [null, null, null]; // Array for multiple ship types
    this.shipSheets = [null, null, null];
    this.elapsedMs = 0;
    this.imagesLoaded = [false, false, false];
    this.lastSpawnTime = 0;
    this.spawnInterval = 4000; // Spawn ships every 4 seconds (more reasonable rate)
    this.canvasWidth = 1920;
    this.canvasHeight = 1080;
    this.shipAssetStateKey = '';
    this.pendingSpawnTimeouts = new Set();
    this.disposed = false;

    // Load ship GIFs
    this.loadShipImages();
  }

  trackSpawnTimeout(callback, delay) {
    const handle = setTimeout(() => {
      this.pendingSpawnTimeouts.delete(handle);
      if (!this.disposed) callback();
    }, delay);
    this.pendingSpawnTimeouts.add(handle);
    return handle;
  }

  clearPendingSpawnTimeouts() {
    this.pendingSpawnTimeouts.forEach(handle => clearTimeout(handle));
    this.pendingSpawnTimeouts.clear();
  }

  resetRuntime() {
    this.clearPendingSpawnTimeouts();
    this.ships = [];
    this.hazards = []; this.nextHazardMs = 6000; this.hazardSerial = 0;
    this.lastSpawnTime = 0;
    this.disposed = false;
    this.elapsedMs = 0;
  }

  dispose() {
    this.disposed = true;
    this.clearPendingSpawnTimeouts();
    this.ships = [];
    this.hazards = []; this.nextHazardMs = 6000; this.hazardSerial = 0;
  }

  getDiagnostics() {
    return { activeShips: this.ships.length, pendingSpawnTimeouts: this.pendingSpawnTimeouts.size, disposed: !!this.disposed,
      animatedTypes: this.shipSheets.filter(Boolean).length };
  }

  // Load multiple ship images directly (simplified approach)
  loadShipImages() {
    const shipUrls = [
      'https://i.postimg.cc/xj3VcRP3/Ship1.gif',
      'https://i.postimg.cc/T1LNxnfz/Ship2.gif',
      'https://i.postimg.cc/1zM9TVmz/Ship3.gif'
    ];

    shipUrls.forEach((url, index) => {
      const sheet = window.BARCODE.trafficSheets?.[index];
      const loadOriginal = () => loadSharedImageAsset(`image.level-01.ship-${index + 1}`, url).then(image => ({ image, sheet: null }));
      const loading = sheet ? loadSharedImageAsset(`image.level-01.ship-${index + 1}.atlas.${sheet.atlasSHA256}`, sheet.image)
        .then(image => ({ image, sheet })).catch(loadOriginal) : loadOriginal();
      loading.then(({ image: img, sheet: loadedSheet }) => {
        if (this.disposed) return;
        this.shipImages[index] = img;
        this.shipSheets[index] = loadedSheet;
        this.imagesLoaded[index] = true;
        console.log(`✓ Space ship ${index + 1} loaded successfully`);
        console.log(`Ship ${index + 1} dimensions: ${img.width}x${img.height}`);
      }).catch(() => {
        console.warn(`⚠️ Failed to load space ship ${index + 1}, using fallback`);
        this.shipImages[index] = null;
        this.imagesLoaded[index] = false;
      });
    });
  }

  getReadyShipTypes() {
    return this.imagesLoaded.map((loaded, index) => loaded ? index : null).filter(index => index !== null);
  }

  chooseShipTypeForSpawn() {
    const readyShipTypes = this.getReadyShipTypes();
    const stateKey = readyShipTypes.join('|') || 'fallback';
    if (this.shipAssetStateKey !== stateKey) {
      this.shipAssetStateKey = stateKey;
      if (readyShipTypes.length) {
        console.log(`[asset-load] Space ship imagery ready for types: ${readyShipTypes.map(index => index + 1).join(', ')}`);
      } else {
        console.log('[asset-load] Space ship imagery not ready; using fallback rectangle rendering');
      }
    }
    if (readyShipTypes.length) {
      return readyShipTypes[Math.floor(Math.random() * readyShipTypes.length)];
    }
    return Math.floor(Math.random() * this.shipImages.length);
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
    const isForegroundShip = false; // Playable foreground traffic is owned by updateHazards.

    // Play whoosh sound 3 seconds BEFORE spawning foreground ship
    if (isForegroundShip) {
      this.trackSpawnTimeout(() => {
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
      this.trackSpawnTimeout(() => {
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

    const selectedShipType = this.chooseShipTypeForSpawn();

    const ship = {
      x: startX,
      y: startY,
      size: sizeVariation,
      speed: speed * direction,
      depth: depth,
      direction: direction,
      opacity: 1.0, // CRITICAL FIX: Remove all transparency - fully opaque
      shipType: selectedShipType, // Choose from ready optional imagery only
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
    if (this.disposed || window.isPaused || window.gameState?.paused) return;
    const elapsed = Math.max(0, Number(deltaTime) || 0);
    const dt = elapsed / 1000;
    this.elapsedMs += elapsed;
    this.updateHazards(elapsed);

    // Spawn new ships periodically
    this.spawnShip();

    // Update existing ships
    this.ships = this.ships.filter(ship => {
      // Move ship
      ship.x += ship.speed * dt * 60; // 60fps normalization

      // Gentle bobbing motion
      ship.animationElapsedMs = (ship.animationElapsedMs || 0) + elapsed;

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

  queueHazard() {
    const progression = window.sector1Progression, player = window.player;
    if (!progression?.missionStarted || !player || this.hazards.length) return false;
    const lanes = [-260, 10, 280, 580, 754];
    const body = player.getHitbox();
    const y = lanes.reduce((best, lane) => Math.abs(lane-body.y-body.height/2) < Math.abs(best-body.y-body.height/2) ? lane : best, lanes[0]);
    const direction = this.hazardSerial++ % 2 ? -1 : 1;
    const sheet = this.shipSheets[(this.hazardSerial-1)%3];
    const height = sheet ? 220 * sheet.frameHeight / sheet.frameWidth : 82;
    const bounds = progression.getVisibleWorldBounds();
    this.hazards.push({ x: direction > 0 ? bounds.left-220 : bounds.right+220, y, direction,
      phase:'warning', remainingMs:2500, speed:520, width:220, height,
      shipType:(this.hazardSerial-1)%3, animationElapsedMs:0, hit:false });
    window.audioSystem?.playCombatCue?.('warning');
    return true;
  }

  updateHazards(delta) {
    const progression = window.sector1Progression, player = window.player;
    if (!progression?.missionStarted || progression.isGameplaySuppressed?.() || progression.isBossCombatLive?.() ||
        window.gameState?.gameOver || window.gameState?.victory) { this.hazards = []; return; }
    if (!player || window.isPaused || window.gameState?.paused) return;
    const terminal = window.hackingSystem?.isActive?.() || window.tutorialSystem?.isActive?.();
    if (terminal) { for (const h of this.hazards) h.suspended = true; return; }
    const dt = Math.min(100, Math.max(0, delta));
    if (!this.hazards.length) {
      this.nextHazardMs -= dt;
      if (this.nextHazardMs <= 0) { this.queueHazard(); this.nextHazardMs = 8500; }
    }
    const p = player.getHitbox();
    for (const h of this.hazards) {
      if (h.suspended) { h.suspended = false; h.phase = 'warning'; h.remainingMs = Math.max(h.remainingMs, 2000); }
      h.animationElapsedMs += dt;
      if (h.phase === 'warning') {
        h.remainingMs -= dt;
        if (h.remainingMs <= 0) { h.phase = 'moving'; window.audioSystem?.playRandomWhoosh?.(); }
        continue;
      }
      const previousX = h.x;
      h.x += h.direction * h.speed * dt / 1000;
      // An inset solid hull avoids damage from transparent margins/exhaust.
      const left = Math.min(previousX,h.x)-h.width*0.4, right = Math.max(previousX,h.x)+h.width*0.4;
      const top = h.y-h.height*0.27, bottom = h.y+h.height*0.27;
      if (!h.hit && p.x < right && p.x+p.width > left && p.y < bottom && p.y+p.height > top && !player.isDamageInvulnerable?.()) {
        const accepted = player.takeDamageWithKnockback(1,h.direction*380,-240,{ x:h.x,y:h.y });
        if (accepted !== false) { h.hit=true; window.inputManager?.vibrate?.(0.35,100); }
      }
    }
    this.hazards = this.hazards.filter(h => h.phase==='warning' || h.x > -500 && h.x < 4596);
  }

  drawHazards(ctx) {
    if (!this.hazards?.length) return;
    const bounds=window.sector1Progression?.getVisibleWorldBounds?.() || {left:0,right:1920};
    ctx.save(); ctx.shadowBlur=0;
    for (const h of this.hazards) {
      if (h.phase==='warning') {
        const alpha=window.BARCODE_RENDER_QUALITY?.flashes===false?0.65:0.6+0.15*Math.sin(h.remainingMs/220);
        ctx.strokeStyle=`rgba(255,192,89,${alpha})`;ctx.lineWidth=2;ctx.setLineDash([18,16]);
        for (const y of [h.y-h.height/2,h.y+h.height/2]) {ctx.beginPath();ctx.moveTo(bounds.left,y);ctx.lineTo(bounds.right,y);ctx.stroke();}
        ctx.setLineDash([]);
        const x=h.direction>0?bounds.left+120:bounds.right-120;
        ctx.fillStyle='#0b1420';ctx.fillRect(x-73,h.y-33,146,66);
        ctx.strokeStyle='#ffcf70';ctx.lineWidth=4;
        for(let i=0;i<3;i++){const ax=x+(i-1)*28;ctx.beginPath();ctx.moveTo(ax-h.direction*9,h.y-17);ctx.lineTo(ax+h.direction*9,h.y);ctx.lineTo(ax-h.direction*9,h.y+17);ctx.stroke();}
        ctx.fillStyle='#ffcf70';ctx.font='bold 17px Oxanium,monospace';ctx.textAlign='center';ctx.fillText('TRAFFIC',x,h.y-46);
        continue;
      }
      ctx.save();ctx.translate(h.x,h.y);ctx.scale(h.direction,1);
      const sheet=this.shipSheets[h.shipType], image=this.shipImages[h.shipType];
      if(sheet && image && this.imagesLoaded[h.shipType]) {
        const frame=this.getAnimationFrame(h);
        ctx.drawImage(image,frame%sheet.columns*sheet.frameWidth,Math.floor(frame/sheet.columns)*sheet.frameHeight,sheet.frameWidth,sheet.frameHeight,-h.width/2,-h.height/2,h.width,h.height);
      } else {
        ctx.fillStyle='#263c52';ctx.beginPath();ctx.moveTo(-110,20);ctx.lineTo(-94,-20);ctx.lineTo(48,-28);ctx.lineTo(110,8);ctx.lineTo(92,30);ctx.closePath();ctx.fill();
        ctx.fillStyle='#a4e2e0';ctx.fillRect(-28,-18,55,14);ctx.fillStyle='#f5d37a';ctx.fillRect(87,10,19,5);
      }
      ctx.restore();
    }
    ctx.restore();
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

    const selectedShipType = this.chooseShipTypeForSpawn();

    const ship = {
      x: startX,
      y: startY,
      size: sizeVariation,
      speed: speed * direction,
      depth: depth,
      direction: direction,
      opacity: 1.0,
      shipType: selectedShipType, // Choose from ready optional imagery only
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
  getAnimationFrame(ship) {
    const sheet = this.shipSheets[ship.shipType];
    if (!sheet) return 0;
    const time = (Math.max(0, ship.animationElapsedMs || 0) + 0.000001) % sheet.durationMs;
    let end = 0;
    for (let frame = 0; frame < sheet.frameCount; frame++) {
      end += sheet.durationsMs[frame];
      if (time < end) return frame;
    }
    return 0;
  }
  drawShipImage(ctx, ship, image, width, height) {
    const sheet = this.shipSheets[ship.shipType];
    if (!sheet) { ctx.drawImage(image, -width / 2, -height / 2, width, height); return; }
    const frame = this.getAnimationFrame(ship), trim = sheet.trim;
    ctx.drawImage(image, frame % sheet.columns * sheet.frameWidth, Math.floor(frame / sheet.columns) * sheet.frameHeight,
      sheet.frameWidth, sheet.frameHeight,
      -width / 2 + trim.x / sheet.sourceWidth * width, -height / 2 + trim.y / sheet.sourceHeight * height,
      trim.width / sheet.sourceWidth * width, trim.height / sheet.sourceHeight * height);
  }
  drawShip(ctx, ship) {
    ctx.save();

    // CRITICAL FIX: Remove opacity setting - ships are fully opaque
    // ctx.globalAlpha = ship.opacity; // Removed transparency

    // Move to ship position
    const bobY = Math.sin(this.elapsedMs / 1000 + ship.bobOffset) * ship.bobAmount;
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
        this.drawShipImage(ctx, ship, shipImage, width, height);
        ctx.restore();
      } else {
        // Normal drawing for Ship1 and Ship2
        // Canvas, video, or regular image - just draw the whole thing
        this.drawShipImage(ctx, ship, shipImage, ship.size, ship.size);
      }
      if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log(`🚀 Drawing ship ${ship.shipType + 1} frame ${this.getAnimationFrame(ship)}`);
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
      if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log(`🚀 Drawing fallback ship at (${ship.x.toFixed(1)}, ${ship.y.toFixed(1)}) size ${ship.size.toFixed(1)}`);
    }

    ctx.restore();
  }

  // Draw normal ships (between BG and FG layers)
  drawNormalShips(ctx) {
    const normalShips = this.ships.filter(ship => !ship.isForeground);

    // Optional recurring ship diagnostics. Disabled during normal play.
    if (window.BARCODE_DEBUG_FRAME_OWNERSHIP && (!this.lastDebugLog || Date.now() - this.lastDebugLog > 1000)) {
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
    if (window.spaceShipSystem) {
      if (typeof window.spaceShipSystem.resetRuntime === 'function') window.spaceShipSystem.resetRuntime();
      return true;
    }
    window.spaceShipSystem = new window.SpaceShipSystem();
    console.log('✓ Space ship system initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize space ship system:', error?.message || error);
    return false;
  }
};
