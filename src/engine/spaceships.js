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
    this.warningImage = null;
    this.elapsedMs = 0;
    this.pendingForeground = [];
    this.previousPlayerBody = null;
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
    this.pendingForeground = [];
    this.previousPlayerBody = null;
  }

  dispose() {
    this.disposed = true;
    this.pendingForeground = [];
    this.clearPendingSpawnTimeouts();
    this.ships = [];
  }

  getDiagnostics() {
    return { activeShips: this.ships.length, pendingSpawnTimeouts: this.pendingSpawnTimeouts.size, disposed: !!this.disposed,
      animatedTypes: this.shipSheets.filter(Boolean).length };
  }

  // Load multiple ship images directly (simplified approach)
  loadShipImages() {
    loadSharedImageAsset('image.level-01.watch-out.27c23b7', 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/27c23b7042a903006f79683f01518f9b5eec49fb/assets/traffic-warning/watch-out.webp')
      .then(image => { if (!this.disposed) this.warningImage = image; }).catch(() => {});
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
        console.log('[asset-load] Space ship imagery not ready; waiting for existing car artwork');
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
    const isForegroundShip = Math.random() < 0.15; // 15% chance

    // Play whoosh sound 3 seconds BEFORE spawning foreground ship
    if (isForegroundShip) {
      {
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
      } // Original pre-spawn whoosh, with no timer surviving a pause/reset.

      // Actually spawn the ship after 3 seconds
      this.createForegroundShip(true);

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
    const beforeTime = this.elapsedMs;
    this.elapsedMs += elapsed;
    const playerBody = this.getTrafficPlayerBody();
    const previousPlayer = this.previousPlayerBody || playerBody;
    this.previousPlayerBody = playerBody;

    // Preserve the original three-second approach while freezing it on pause.
    const arriving = [];
    this.pendingForeground = this.pendingForeground.filter(ship => {
      ship.launchInMs -= elapsed;
      if (ship.launchInMs > 0) return true;
      ship.firstDeltaMs = Math.max(0, -ship.launchInMs);
      ship.launchInMs = 0;
      arriving.push(ship);
      return false;
    });
    this.ships.push(...arriving);

    // Spawn new ships periodically
    this.spawnShip();

    // Update existing ships
    this.ships = this.ships.filter(ship => {
      const beforeBody = ship.isForeground ? this.getHazardBody(ship, beforeTime) : null;
      const motionMs = ship.firstDeltaMs ?? elapsed;
      delete ship.firstDeltaMs;
      // Move ship
      ship.x += ship.speed * (motionMs / 1000) * 60; // Original 60fps normalization

      // Gentle bobbing motion
      ship.animationElapsedMs = (ship.animationElapsedMs || 0) + motionMs;
      if (beforeBody) this.checkTrafficContact(ship, beforeBody, previousPlayer, playerBody);

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
  createForegroundShip(queued = false) {
    if (!this.getReadyShipTypes().length) return null;
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

    ship.hit = false;
    if (queued) { ship.launchInMs = 3000; this.pendingForeground.push(ship); }
    else this.ships.push(ship);
    console.log(`🚀 SPAWNING FOREGROUND SHIP ${ship.shipType + 1}: size=${sizeVariation.toFixed(1)}, speed=${Math.abs(speed).toFixed(1)}, direction=${direction === 1 ? '→' : '←'}, startX=${startX.toFixed(1)}`);
    return ship;
  }

  getTrafficPlayerBody() {
    const player = window.player, body = player?.getHitbox?.();
    if (!body) return null;
    let cameraX = window.renderer?.getFollowCameraX?.(player.position.x) ?? player.position.x;
    cameraX = Math.max(960, Math.min(3136, cameraX));
    cameraX = window.sector1Progression?.getCameraX?.(cameraX) ?? cameraX;
    // Cars retain their original horizontal render layer. Only the new vertical
    // camera follows their original world altitude; its translation cancels here.
    return { ...body, x: body.x + 960 - cameraX };
  }

  getHazardBody(ship, time = this.elapsedMs, inset = true) {
    const sheet = this.shipSheets[ship.shipType] || window.BARCODE?.trafficSheets?.[ship.shipType];
    const width = ship.size, height = ship.shipType === 2 ? width * .35 : width;
    const trim = sheet?.trim || { x: 0, y: 0, width: 1, height: 1 };
    const sw = sheet?.sourceWidth || 1, sh = sheet?.sourceHeight || 1;
    const sign = (ship.flipH ? -1 : 1) * (ship.shipType === 2 ? -1 : 1);
    const cx = (-width / 2 + (trim.x + trim.width / 2) / sw * width) * sign;
    const cy = -height / 2 + (trim.y + trim.height / 2) / sh * height;
    // Inset the opaque trim to exclude exhaust and the tapered nose corners.
    const bw = trim.width / sw * width * (inset ? .74 : 1), bh = trim.height / sh * height * (inset ? .62 : 1);
    const bob = Math.sin(time / 1000 + ship.bobOffset) * ship.bobAmount;
    return { x: ship.x + cx - bw / 2, y: ship.y + bob + cy - bh / 2, width: bw, height: bh };
  }

  trafficDamageEnabled() {
    const p = window.sector1Progression;
    return !!(p?.missionStarted && !p.isGameplaySuppressed?.() && !p.isBossCombatLive?.() &&
      !window.tutorialSystem?.isActive?.() && !window.gameState?.gameOver && !window.gameState?.victory);
  }

  sweptContact(a, endA, b, endB) {
    if (!b || !endB) return false;
    let enter = 0, leave = 1;
    for (const [axis, size] of [['x', 'width'], ['y', 'height']]) {
      const motion = endA[axis] - a[axis] - (endB[axis] - b[axis]);
      if (Math.abs(motion) < .00001) {
        if (a[axis] + a[size] <= b[axis] || a[axis] >= b[axis] + b[size]) return false;
      } else {
        const t1 = (b[axis] - a[axis] - a[size]) / motion;
        const t2 = (b[axis] + b[size] - a[axis]) / motion;
        enter = Math.max(enter, Math.min(t1, t2));
        leave = Math.min(leave, Math.max(t1, t2));
      }
    }
    return enter <= leave;
  }

  checkTrafficContact(ship, before, previousPlayer, playerBody) {
    if (ship.hit || !this.trafficDamageEnabled() || !this.imagesLoaded[ship.shipType]) return;
    if (!this.sweptContact(before, this.getHazardBody(ship), previousPlayer, playerBody)) return;
    // Consume contact even under protection: the same car cannot punish the
    // player for exiting a puzzle or losing invulnerability inside its body.
    ship.hit = true;
    const player = window.player;
    if (window.hackingSystem?.isActive?.() || player?.controlsDisabled || player?.isDamageInvulnerable?.()) return;
    player?.takeDamageWithKnockback?.(1, ship.direction * 320, -240, { x: player.position.x - ship.direction * 100, y: ship.y });
  }

  getTrafficProjection() {
    // The actual scene matrix includes zoom, impact zoom and shake. Cars share
    // vertical camera movement but deliberately not the actors' horizontal pan.
    const zoom = window.renderer?.getZoomLevel?.() || window.renderer?.zoomLevel || 1;
    const m = window.BARCODE.sceneProjection?.matrix || { a: zoom, d: zoom, e: 960 * (1 - zoom), f: 675 * (1 - zoom) };
    const cameraY = window.gameCamera?.y ?? window.sector1Progression?.getCameraY?.() ?? 0;
    return { a: m.a, d: m.d, e: m.e, f: m.f - cameraY * m.d };
  }

  getTrafficWarnings() {
    if (!this.trafficDamageEnabled()) return [];
    const m = this.getTrafficProjection(), warnings = [];
    for (const ship of this.pendingForeground.concat(this.ships.filter(s => s.isForeground))) {
      // Visibility follows the complete opaque artwork, not the inset damage box.
      const hull = this.getHazardBody(ship, this.elapsedMs, false);
      const body = { x: hull.x * m.a + m.e, y: hull.y * m.d + m.f, width: hull.width * m.a, height: hull.height * m.d };
      const distance = ship.direction > 0 ? -body.x - body.width : body.x - 1920;
      if (distance <= 0) continue; // The leading artwork has appeared: remove cue.
      const entryInMs = Math.max(0, ship.launchInMs || 0) + distance / (Math.abs(ship.speed) * 0.06 * m.a);
      if (entryInMs > 3000 || body.y + body.height <= 0 || body.y >= 1080) continue;
      // Center on the actual car altitude. For a partly clipped car, point into
      // its visible hull slice; never relocate a high car to a generic HUD row.
      const centerY = body.y + body.height / 2;
      const y = centerY >= 0 && centerY <= 1080 ? centerY : (Math.max(0, body.y) + Math.min(1080, body.y + body.height)) / 2;
      warnings.push({ ship, side: ship.direction > 0 ? 'left' : 'right', y, body, entryInMs });
    }
    return warnings;
  }

  drawTrafficWarnings(ctx) {
    const warnings = this.getTrafficWarnings();
    for (const warning of warnings) {
      const left = warning.side === 'left', arrowX = left ? 48 : 1872;
      const plateX = left ? 96 : 1584;
      // Keep the label clear of health/rhythm and objectives; only its label
      // may shift. The arrow itself stays precisely on the car's flight line.
      const hudBottom = left ? (window.rhythmSystem?.isActive?.() ? 550 : 370) : 356;
      const plateY = Math.max(hudBottom, Math.min(998, warning.y - 37));
      ctx.save();
      // This pass runs in screen coordinates after the normal HUD. Alpha never
      // reaches zero: the warning remains readable between its red flashes.
      ctx.globalAlpha = Math.floor(this.elapsedMs / 250) % 2 ? 0.48 : 1;
      if (Math.abs(plateY + 37 - warning.y) > 1) {
        const joinX = left ? 90 : 1830;
        ctx.strokeStyle = '#ff3444'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(left ? 84 : 1836, warning.y); ctx.lineTo(joinX, warning.y);
        ctx.lineTo(joinX, plateY + 37); ctx.lineTo(left ? plateX : plateX + 240, plateY + 37); ctx.stroke();
      }
      if (this.warningImage) {
        ctx.drawImage(this.warningImage, 0, 0, 768, 235, plateX, plateY, 240, 74);
        ctx.translate(arrowX, warning.y); if (!left) ctx.scale(-1, 1);
        ctx.drawImage(this.warningImage, 0, 240, 384, 155, -38, -16, 76, 32);
      } else {
        // A failed optional image fetch must not remove the safety information.
        ctx.fillStyle = '#b30b1a'; ctx.fillRect(plateX, plateY, 240, 74);
        ctx.strokeStyle = '#ff4b58'; ctx.lineWidth = 3; ctx.strokeRect(plateX, plateY, 240, 74);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('WATCH OUT', plateX + 120, plateY + 37);
        ctx.fillStyle = '#ff2838'; const direction = left ? -1 : 1;
        ctx.beginPath(); ctx.moveTo(arrowX + direction * 32, warning.y);
        ctx.lineTo(arrowX - direction * 22, warning.y - 16); ctx.lineTo(arrowX - direction * 22, warning.y + 16); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
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
    this.ships = [];
    this.pendingForeground = [];
    this.previousPlayerBody = null;
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
