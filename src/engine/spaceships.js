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
    this.shipImages = [null, null, null]; // Array for multiple ship types
    this.shipSheets = [null, null, null];
    this.elapsedMs = 0;
    this.hazards = []; this.hazardWaitMs = 6000; this.hazardSerial = 0;
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
    this.lastSpawnTime = 0;
    this.disposed = false;
    this.elapsedMs = 0;
    this.hazards = []; this.hazardWaitMs = 6000; this.hazardSerial = 0;
  }

  dispose() {
    this.disposed = true;
    this.hazards = [];
    this.clearPendingSpawnTimeouts();
    this.ships = [];
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
      const loading = sheet ? loadSharedImageAsset(`image.level-01.ship-${index + 1}.atlas.${sheet.atlasSHA256}`, 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/6e3751ba1561d8694e0bdc9a623e74ac6a45624d/' + sheet.image)
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
    if (!this.getReadyShipTypes().length) return;

    // Check if it's time to spawn a new ship
    if (currentTime - this.lastSpawnTime < this.spawnInterval) {
      return;
    }

    // CRITICAL: Occasionally spawn a foreground ship (15% chance)
    const isForegroundShip = false; // Foreground scheduling uses the world-space warning clock below. // 15% chance

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

  // Create a foreground ship (larger, faster, appears in front)
  createForegroundShip() {
    if(this.hazards.length || !this.getReadyShipTypes().length)return null;
    const player=window.player;if(!player)return null;
    const lanes=[770,408,164,-258,-410];
    const foot=player.position.y+(window.Player?.VISUAL_FOOT_OFFSET_Y||72);
    const y=lanes.reduce((best,lane)=>Math.abs(lane-(foot-85))<Math.abs(best-(foot-85))?lane:best,lanes[0]);
    const shipType=this.chooseShipTypeForSpawn();
    const direction=++this.hazardSerial%2?1:-1;
    const ship={shipType,direction,flipH:direction<0,rotation:0,bobOffset:0,bobAmount:0,animationElapsedMs:0,
      size:shipType===2?680:390,phase:'warning',remainingMs:2800,y,x:direction>0?-800:4896,hit:false,isForeground:true};
    this.hazards.push(ship);
    window.audioSystem?.playRandomWhoosh?.();
    return ship;
  }

  updateHazards(delta) {
    const progression=window.sector1Progression;
    if(!progression?.missionStarted||progression.isGameplaySuppressed?.()||progression.isBossCombatLive?.()||window.gameState?.gameOver||window.gameState?.victory){this.hazards=[];return;}
    // A stationary puzzle cannot demand a dodge. Resume with a fresh approach.
    if(window.hackingSystem?.isActive?.()) {this.hazardSuspended=true;return;}
    if(this.hazardSuspended){this.hazardSuspended=false;for(const h of this.hazards){h.phase='warning';h.remainingMs=2800;h.x=h.direction>0?-800:4896;h.hit=false;}}
    this.hazardWaitMs-=delta;
    if(!this.hazards.length&&this.hazardWaitMs<=0){this.createForegroundShip();this.hazardWaitMs=14000;}
    for(const h of this.hazards){
      if(h.phase==='warning'){
        h.remainingMs-=delta;
        if(h.remainingMs<=0){h.phase='pass';const camera=window.gameCamera?.centerX??960;h.x=h.direction>0?Math.max(-800,camera-960-h.size):Math.min(4896,camera+960+h.size);}
        continue;
      }
      const before=this.getHazardBody(h);h.x+=h.direction*540*delta/1000;h.animationElapsedMs+=delta;
      const body=this.getHazardBody(h),player=window.player;
      const swept={x:Math.min(before.x,body.x),y:body.y,width:body.width+Math.abs(body.x-before.x),height:body.height};
      if(!h.hit&&player&&window.enemyManager?.simpleAABBcollision(swept,player.getHitbox())){
        h.hit=true;player.takeDamageWithKnockback(1,h.direction*320,-240,{x:h.x,y:h.y});
      }
    }
    this.hazards=this.hazards.filter(h=>h.phase==='warning'||(h.direction>0?h.x<4896:h.x>-800));
  }

  getHazardBody(ship) {
    // Original source trim works for both the bundled atlas and loaded GIF.
    const sheet=this.shipSheets[ship.shipType]||window.BARCODE?.trafficSheets?.[ship.shipType];
    const width=ship.size,height=ship.shipType===2?ship.size*.35:ship.size;
    const trim=sheet?.trim||{x:0,y:0,width:1,height:1};
    const sw=sheet?.sourceWidth||1,sh=sheet?.sourceHeight||1;
    const sign=(ship.flipH?-1:1)*(ship.shipType===2?-1:1);
    const cx=(-width/2+(trim.x+trim.width/2)/sw*width)*sign;
    const cy=-height/2+(trim.y+trim.height/2)/sh*height;
    const bw=trim.width/sw*width*.74,bh=trim.height/sh*height*.62;
    return {x:ship.x+cx-bw/2,y:ship.y+cy-bh/2,width:bw,height:bh};
  }

  drawHazards(ctx) {
    if(this.hazardSuspended)return;
    for(const h of this.hazards){
      if(h.phase==='pass'){this.drawShip(ctx,h);continue;}
      const camera=window.gameCamera?.centerX??960;
      const left=Math.max(0,camera-890),right=Math.min(4096,camera+890);
      const edge=h.direction>0?left:right;
      ctx.save();ctx.strokeStyle='#ffc278';ctx.fillStyle='#ffc278';ctx.lineWidth=3;
      ctx.setLineDash([12,18]);ctx.globalAlpha=.35;ctx.beginPath();ctx.moveTo(left,h.y);ctx.lineTo(right,h.y);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=.9;
      for(let i=0;i<3;i++){const x=edge+h.direction*(24+i*24);ctx.beginPath();ctx.moveTo(x-h.direction*10,h.y-20);ctx.lineTo(x+h.direction*7,h.y);ctx.lineTo(x-h.direction*10,h.y+20);ctx.stroke();}
      // Icon + direction/lane only; no extra text panel covering gameplay.
      ctx.beginPath();ctx.moveTo(edge,h.y-62);ctx.lineTo(edge-16,h.y-35);ctx.lineTo(edge+16,h.y-35);ctx.closePath();ctx.fill();
      ctx.fillStyle='#17191c';ctx.fillRect(edge-2,h.y-54,4,10);ctx.fillRect(edge-2,h.y-41,4,3);ctx.restore();
    }
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
    this.ships = []; this.hazards = [];
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
