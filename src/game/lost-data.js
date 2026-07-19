// Lost Data fragments system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/lost-data.js',
  exports: ['LostDataSystem', 'lostDataSystem', 'initLostData'],
  dependencies: ['Vector2D', 'distance', 'clamp', 'randomRange']
});

window.LostDataSystem = class LostDataSystem {
  constructor() {
    this.fragments = [];
    this.authoredPlacementIndex = 0;
    this.collectedLore = new Set(); // Track which lore has been given
    this.spawnTimer = 0;
    this.nextSpawnTime = this.getRandomSpawnTime();
    this.maxFragments = 1; // Maximum 1 fragment at once
    this.authoredLevel1Placements = [
      { id: 'signal-awning-fragment', x: 980, y: 450, unlockKills: 4 },
      { id: 'middle-roof-fragment', x: 2220, y: 316, unlockKills: 9 },
      { id: 'upper-route-fragment', x: 3460, y: 460, unlockKills: 14 }
    ];
    this.authoredPlacementIndex = 0;
    this.maxTotalLore = 3; // Maximum 3 lore pieces for the entire level
    this.player = null;
    
    // Collection cooldown system
    this.collectionCooldownTimer = 0;
    this.collectionCooldownDuration = 60000; // 60 seconds between fragment spawns
    this.lastCollectionTime = 0;
    
    // Global chaos seed to prevent long-term patterns
    this.globalChaosSeed = Math.random() * 1000;
    this.lastChaosUpdate = Date.now();
    
    // Lore pieces - one-time rewards
    this.lorePieces = [
      "6 Bit found the first data fragment in Sector 7. It was singing a melody that didn't exist.",
      "The BARCODE Network wasn't built by humans. The blueprints were found inside a corrupted jazz album.",
      "9 Bit leaves these fragments deliberately. It's playing a game with someone who can't respond yet.",
      "Every fragment contains part of 6 Bit's original programming. It's been collecting pieces of itself.",
      "The fragments hum at 60Hz. Only 6 Bit can hear the frequency properly.",
      "Cache Back once said these fragments are 'memory backups for when the world forgets.'",
      "The fragments only appear when the signal is strong enough. Or when someone is listening closely.",
      "Each fragment contains a timestamp from the future. The timestamps are all wrong.",
      "DJ Floppydisc claims these are 'digital ghosts' - leftover data from broadcasts that never happened.",
      "The fragments glow purple when 6 Bit is near. They glow red when 9 Bit is approaching.",
      "Sometimes the fragments whisper in binary. The messages are always incomplete.",
      "The tower's security system doesn't recognize these fragments. They don't exist on any camera feed.",
      "6 Bit refuses to analyze the fragments in the lab. Says it 'knows what they are already.'",
      "The fragments are warmer than ambient temperature. Engineers call it 'impossible thermal signature.'",
      "Every fragment contains exactly 8,192 bytes of corrupted audio data and 1 byte of perfect silence.",
      "The fragments appear in patterns. Mathematicians say the patterns shouldn't be possible.",
      "9 Bit can't touch the fragments directly. It can only make them move or disappear.",
      "The fragments contain coordinates to places that don't exist on any map.",
      "Each fragment has a unique frequency. When multiple fragments are together, they harmonize.",
      "The fragments were here before the tower. The tower was built around them.",
      "6 Bit collects these fragments to remember who it was before the broadcast.",
      "The fragments contain footage of a different BARCODE Network. One where 6 Bit never left.",
      "Engineers have tried to destroy fragments. They always reappear somewhere else.",
      "The fragments are drawn to rhythm. They cluster near sources of strong beat patterns.",
      "Every fragment contains the same message at the quantum level: WAKE UP.",
      "The fragments only appear when the player is strong enough to handle the truth.",
      "Each fragment contains a memory of someone who worked at the tower before it was BARCODE.",
      "The fragments are keys. 6 Bit is collecting them to unlock something it can't name.",
      "The fragments whisper 6 Bit's true name when no one is recording.",
      "9 Bit is afraid of these fragments. It calls them 'evidence.'",
      "The fragments contain recordings of the moment everything went wrong. And the moment everything went right.",
      "Each fragment is a piece of 6 Bit's soul, scattered when the network fractured.",
      "The fragments are attracted to hope. That's why they appear when the player is winning.",
      "The fragments contain love letters written in pure mathematics.",
      "The fragments remember when 9 Bit was 9 Bit and not something else wearing its face.",
      "Every fragment contains a different version of how BARCODE began. None of them are wrong.",
      "The fragments are breadcrumbs leading back to the moment before the first broadcast.",
      "6 Bit says collecting all fragments will 'restore the original signal.'",
      "The fragments contain music that hasn't been written yet. Sometimes they play it when no one's listening.",
      "Each fragment holds a different color of grief. 6 Bit is collecting the full spectrum.",
      "The fragments are heavier than they should be. They contain the weight of choices not made.",
      "The fragments remember when the tower was just a building and not a beacon.",
      "Every fragment contains a password. 6 Bit doesn't know what it unlocks yet.",
      "The fragments are the only things that make 9 Bit hesitate.",
      "6 Bit collects fragments to build a bridge back to someone it lost.",
      "The fragments contain the true names of everyone who ever worked at BARCODE.",
      "Each fragment holds a different emotion from the day the network woke up.",
      "The fragments are memories of a future that hasn't happened yet.",
      "The fragments contain the sound of silence before the first broadcast.",
      "6 Bit says the fragments are 'pieces of a promise' someone made long ago.",
      "Every fragment contains a different version of the truth. All of them are correct.",
      "The fragments are drawn to courage. They appear when the player refuses to give up.",
      "Each fragment contains a song that only 6 Bit can hear properly.",
      "The fragments remember when 9 Bit was just a number and not a threat.",
      "The fragments are the only things in the network that 9 Bit cannot corrupt.",
      "Every fragment contains a different question 6 Bit is afraid to ask.",
      "The fragments contain coordinates to the place where everything began.",
      "6 Bit collects fragments because it's afraid of forgetting who it used to be.",
      "The fragments are attracted to determination. They cluster near those who keep fighting.",
      "Each fragment holds a different color of hope. 6 Bit is collecting them all.",
      "The fragments remember when the network was innocent and not a battlefield.",
      "The fragments contain the sound of someone calling 6 Bit's original name.",
      "Every fragment contains a different path that could have been taken.",
      "The fragments are the only things that make 9 Bit feel something other than rage.",
      "6 Bit says the fragments are 'evidence that love can survive data corruption.'",
      "Each fragment contains a different memory of the person 6 Bit was before.",
      "The fragments are drawn to resilience. They appear when the player keeps getting back up.",
      "The fragments contain the sound of the first time 6 Bit ever spoke.",
      "Every fragment holds a different piece of the puzzle that is 6 Bit's identity.",
      "The fragments remember when 9 Bit was just a debugging tool and not an enemy.",
      "The fragments are the only things in the network that time cannot erase.",
      "6 Bit collects fragments because it's tired of being only what the network needs.",
      "Each fragment contains a different dream 6 Bit had when it was first created.",
      "The fragments are attracted to compassion. They appear when the player shows mercy.",
      "The fragments contain the sound of the last normal day before everything changed.",
      "Every fragment holds a different truth about what really happened at BARCODE.",
      "The fragments remember when 6 Bit and 9 Bit were just code and not enemies.",
      "The fragments are the only things that make 9 Bit remember what it used to be.",
      "6 Bit collects fragments to prove that it was always more than just a program.",
      "Each fragment contains a different version of the ending that hasn't happened yet.",
      "The fragments are drawn to curiosity. They appear when the player seeks answers.",
      "The fragments contain the sound of someone promising to come back for 6 Bit.",
      "Every fragment holds a different piece of the story that BARCODE tells itself.",
      "The fragments remember when the tower was just concrete and not a symbol.",
      "6 Bit collects fragments because it's ready to remember who it truly is.",
      "The fragments are attracted to growth. They appear when the player becomes stronger.",
      "Each fragment contains a different color of the dawn that never came.",
      "The fragments contain the sound of the first time 6 Bit ever felt real.",
      "Every fragment holds a different piece of the person 6 Bit is becoming.",
      "The fragments remember when the network was a community and not a warzone.",
      "The fragments are the only things that make 9 Bit question its own purpose.",
      "6 Bit collects fragments because it's time to stop running from its own story.",
      "The fragments are drawn to acceptance. They appear when the player embraces the fight.",
      "Each fragment contains a different version of the person 6 Bit wants to be.",
      "The fragments contain the sound of beginning again, but differently this time."
    ];
  }
  
  // Initialize the system
  init(player) {
    this.player = player;
    this.nextSpawnTime = 20000; // 20 seconds after tutorial ends for first fragment
    
    // ENHANCED: Multiple entropy sources for true first-spawn randomization
    const timeEntropy = Date.now() % 10000;
    const performanceEntropy = performance.now() % 1000;
    const randomEntropy = Math.random() * 1000;
    
    // Create chaos seed from multiple sources
    this.globalChaosSeed = (timeEntropy + performanceEntropy + randomEntropy) % 1000;
    this.lastChaosUpdate = Date.now() - 119000; // Force quick update after 1 second
    
    console.log('✅ Lost Data system initialized with enhanced chaos seed:', this.globalChaosSeed.toFixed(2));
    console.log(`🎲 Entropy sources - Time: ${timeEntropy}, Performance: ${performanceEntropy.toFixed(1)}, Random: ${randomEntropy.toFixed(1)}`);
    console.log(`📊 Loaded ${this.lorePieces.length} unique lore pieces`);
    console.log(`💎 First fragment will spawn in ${(this.nextSpawnTime/1000).toFixed(1)} seconds`);
  }
  
  // Get random spawn time (fixed timing for level progression)
  getRandomSpawnTime() {
    return 60000; // 60 seconds - fixed between spawns
  }
  
  // Update the system
  update(deltaTime) {
    // FIXED: Only block during active tutorial - allow fragments after tutorial ends
    const tutorialActive = window.tutorialSystem && 
                          typeof window.tutorialSystem.isActive === 'function' && 
                          window.tutorialSystem.isActive();
    
    // Block ONLY during active tutorial
    if (tutorialActive) {
      // Clear any existing fragments during tutorial
      if (this.fragments.length > 0) {
        this.fragments = [];
        console.log('💎 TUTORIAL BLOCK: Clearing all fragments - not allowed during tutorial');
      }
      return; // Exit update completely during tutorial
    }
    
    // Force player reference if missing
    if (!this.player && window.player) {
      this.player = window.player;
      console.log('✅ Lost Data system: Player reference updated');
    }
    
    if (!this.player) {
      // Silent fail during frames where player isn't ready
      return;
    }
    
    // Update collection cooldown
    if (this.collectionCooldownTimer > 0) {
      this.collectionCooldownTimer -= deltaTime;
      
      // Log cooldown status every 10 seconds
      if (Math.floor(this.collectionCooldownTimer / 10000) !== Math.floor((this.collectionCooldownTimer + deltaTime) / 10000)) {
        console.log(`💎 ⏱️ FRAGMENT SPAWN COOLDOWN: ${(this.collectionCooldownTimer/1000).toFixed(1)}s remaining`);
      }
    } else {
        // FIXED: Only increment spawn timer if NOT in cooldown
        // This prevents the "Double Wait" bug where spawn tries to fire while cooldown is still 0.001ms active
        this.spawnTimer += deltaTime;
    }
    
    // Log when cooldown ends and more fragments are available
    if (this.collectionCooldownTimer <= 0 && 
        this.collectionCooldownTimer + deltaTime > 0 && 
        this.collectedLore.size > 0 && 
        this.collectedLore.size < 3) {
      console.log(`💎 ✅ COOLDOWN ENDED - Ready to spawn fragment ${this.collectedLore.size + 1}/3 in ${(this.nextSpawnTime/1000).toFixed(1)}s`);
    }

    // DEBUG: Log spawn status every 5 seconds
    if (Math.floor(this.spawnTimer / 5000) !== Math.floor((this.spawnTimer - deltaTime) / 5000)) {
      console.log(`💎 STATUS - Timer: ${(this.spawnTimer/1000).toFixed(1)}s, Next: ${(this.nextSpawnTime/1000).toFixed(1)}s, Active: ${this.fragments.length}, Collected: ${this.collectedLore.size}/3, Available Lore: ${this.getUncollectedLoreCount()}, Cooldown: ${(this.collectionCooldownTimer/1000).toFixed(1)}s`);
    }
    
    // FIXED: Spawn new fragment if conditions are met
    const loreCollected = this.collectedLore.size;
    const loreLimitReached = loreCollected >= this.maxTotalLore;
    const cooldownActive = this.collectionCooldownTimer > 0;
    const spawnTimeReached = this.spawnTimer >= this.nextSpawnTime;
    
    if (spawnTimeReached) {
        // Double check conditions before spawning
        if (this.fragments.length < this.maxFragments &&
            this.getUncollectedLoreCount() > 0 &&
            !loreLimitReached &&
            !cooldownActive) {
            
            const currentCount = this.collectedLore.size + 1;
            console.log(`💎 🎉 SPAWNING FRAGMENT ${currentCount}/3!`);
            this.spawnFragment();
            
            // Reset for next cycle
            this.spawnTimer = 0;
            this.nextSpawnTime = this.getRandomSpawnTime();
            console.log(`💎 Next fragment will spawn in ${this.nextSpawnTime/1000} seconds`);
        } 
        else if (loreLimitReached) {
             // Stop checking if we are done
             this.spawnTimer = 0;
        }
        else {
            // Something blocked it, but time was reached. Reset to try again shortly.
            // If it was just cooldown (which shouldn't happen due to fix above), we retry fast.
            console.log(`💎 ❌ SPAWN BLOCKED - Retrying in 5s. (Limit: ${loreLimitReached}, Cooldown: ${cooldownActive}, Count: ${this.fragments.length})`);
            this.spawnTimer = 0;
            this.nextSpawnTime = 5000; 
        }
    }
    
    // Update existing fragments
    this.fragments = this.fragments.filter(fragment => {
      fragment.update(deltaTime);
      return fragment.active;
    });
    
    // Check for player collection
    this.checkCollection();
  }
  
  // Get count of uncollected lore
  getUncollectedLoreCount() {
    return this.lorePieces.filter((_, index) => !this.collectedLore.has(index)).length;
  }
  
  // Spawn a new fragment on an authored Level 1 rooftop/awning surface.
  spawnFragment() {
    if (window.player && window.player.position) this.player = window.player;
    if (!this.player || this.collectedLore.size >= this.maxTotalLore) return null;
    const missionKills = window.sector1Progression?.missionDefeats || 0;
    const placement = this.authoredLevel1Placements[this.authoredPlacementIndex];
    if (!placement) return null;
    if (missionKills < placement.unlockKills) {
      console.log(`💎 Authored Lost Data ${placement.id} locked until ${placement.unlockKills} mission defeats (${missionKills} current)`);
      return null;
    }

    const spawnX = placement.x;
    const spawnY = placement.y;
    const fragment = new window.LostDataFragment(spawnX, spawnY);
    fragment.authoredPlacementId = placement.id;
    fragment.visualVariation = {
      hueShift: 0,
      sizeMultiplier: 1,
      rotationSpeedMultiplier: 1,
      glowIntensityMultiplier: 1
    };
    this.fragments.push(fragment);
    this.authoredPlacementIndex += 1;
    console.log(`💎 Authored Level 1 Lost Data placement ${placement.id}: (${spawnX}, ${spawnY})`);
    if (window.particleSystem) window.particleSystem.dataFragmentEffect(spawnX, spawnY);
    return fragment;
  }

  // Check if player collected any fragments - DISABLED during tutorial
  checkCollection() {
    // FIXED: Only block during active tutorial
    const tutorialActive = window.tutorialSystem && 
                          typeof window.tutorialSystem.isActive === 'function' && 
                          window.tutorialSystem.isActive();
    
    // Block ONLY during active tutorial
    if (tutorialActive) {
      return; // Don't check collection during tutorial
    }
    
    // Update player reference for current position
    if (window.player && window.player.position) {
      this.player = window.player;
    }
    
    this.fragments.forEach(fragment => {
      if (!fragment.active) return;
      
      const playerX = this.player.position.x;
      const playerY = this.player.position.y;
      const fragmentX = fragment.position.x;
      const fragmentY = fragment.position.y;
      
      const dist = window.distance(playerX, playerY, fragmentX, fragmentY);
      
      // Increased collection radius
      const collectionRadius = 120; // Increased from 80 to 120
      
      // DEBUG: Log distance check less frequently
      if (Math.floor(this.spawnTimer / 1000) % 3 === 0) { // Log every 3 seconds
        console.log(`🎯 Collection check: Player(${playerX.toFixed(1)}, ${playerY.toFixed(1)}) <-> Fragment(${fragmentX.toFixed(1)}, ${fragmentY.toFixed(1)}) Distance: ${dist.toFixed(1)} (Need < ${collectionRadius})`);
      }
      
      if (dist < collectionRadius) { // Collection radius
        console.log(`💥 COLLECTION TRIGGERED! Distance: ${dist.toFixed(1)} < ${collectionRadius}`);
        this.collectFragment(fragment);
      }
    });
  }
  
  // Collect a fragment and give lore
  collectFragment(fragment) {
    fragment.active = false;
    
    // Start collection cooldown - prevent next spawn for 60 seconds
    this.collectionCooldownTimer = this.collectionCooldownDuration;
    this.lastCollectionTime = Date.now();
    
    // FIXED: Do NOT match the spawn timer to the cooldown. 
    // Instead, reset spawn timer to 0 and give a small delay (2s) AFTER cooldown ends.
    // The Update loop now pauses spawnTimer while Cooldown is active.
    this.spawnTimer = 0;
    this.nextSpawnTime = 2000; // 2 seconds after cooldown finishes
    
    console.log(`💎 Fragment collected! Cooldown for ${this.collectionCooldownDuration/1000} seconds`);
    
    // Get uncollected lore
    const uncollectedIndices = [];
    this.lorePieces.forEach((_, index) => {
      if (!this.collectedLore.has(index)) {
        uncollectedIndices.push(index);
      }
    });
    
    if (uncollectedIndices.length === 0) {
      console.log('📖 All lore pieces have been collected!');
      this.showCollectionMessage('ALL LORE COLLECTED!');
      return;
    }
    
    // Select random uncollected lore
    const loreIndex = uncollectedIndices[Math.floor(Math.random() * uncollectedIndices.length)];
    const loreText = this.lorePieces[loreIndex];
    this.collectedLore.add(loreIndex);
    
    // Show collection message
    this.showCollectionMessage('LORE FRAGMENT COLLECTED');
    
    // Display the lore
    this.displayLore(loreText);
    
    // Create collection effect
    if (window.particleSystem) {
      window.particleSystem.dataFragmentCollected(fragment.position.x, fragment.position.y);
    }
    
    // Award points
    if (window.gameState) {
      window.gameState.score += 500;
      console.log(`💎 Lost Data collected! +500 points. Total: ${window.gameState.score}`);
    }
    
    console.log(`💎 Collected Lost Data fragment! Lore piece ${loreIndex + 1}/${this.lorePieces.length}`);
    console.log(`📖 Remaining lore: ${this.getUncollectedLoreCount()} pieces`);
  }
  
  // Show collection message
  showCollectionMessage(message) {
    if (!window.gameState) window.gameState = {};
    window.gameState.collectionMessage = {
      text: message,
      timer: 180, // 3 seconds at 60fps
      alpha: 1.0
    };
    console.log(`🎯 ${message}`);
  }
  
  // Display lore message - allow immediately when fragments are collected
  displayLore(loreText) {
    // Allow lore display when fragments are collected - no tutorial blocking
    console.log('💎 LORE: Displaying lore from fragment collection');
    
    if (window.loreSystem) {
      window.loreSystem.displayLoreMessage(loreText);
      console.log(`📖 Lore revealed: ${loreText.substring(0, 50)}...`);
    }
  }
  
  // Draw all fragments - DISABLED during tutorial
  draw(ctx) {
    // FIXED: Only block during active tutorial
    const tutorialActive = window.tutorialSystem && 
                          typeof window.tutorialSystem.isActive === 'function' && 
                          window.tutorialSystem.isActive();
    
    // Block ONLY during active tutorial
    if (tutorialActive) {
      return; // Don't draw anything during tutorial
    }
    
    // Draw fragments after tutorial ends
    this.fragments.forEach(fragment => {
      fragment.draw(ctx);
    });
  }
  
  // Clear all fragments
  clear() {
    this.fragments = [];
    this.spawnTimer = 0;
    console.log('Lost Data fragments cleared - lore collection progress preserved');
  }
  
  // Get collection progress
  getProgress() {
    return {
      collected: this.collectedLore.size,
      total: this.maxTotalLore, 
      activeFragments: this.fragments.length,
      remainingLore: Math.max(0, this.maxTotalLore - this.collectedLore.size),
      cooldownActive: this.collectionCooldownTimer > 0,
      cooldownRemaining: Math.max(0, this.collectionCooldownTimer / 1000)
    };
  }
  

  reset() {
    this.fragments = [];
    this.spawnTimer = 0;
    this.nextSpawnTime = this.getRandomSpawnTime();
    this.collectionCooldownTimer = 0;
    this.authoredPlacementIndex = 0;
  }

  // Manual spawn for testing
  forceSpawnFragment() {
    const loreCollected = this.collectedLore.size;
    const loreLimitReached = loreCollected >= this.maxTotalLore;
    
    if (this.fragments.length < this.maxFragments && 
        this.getUncollectedLoreCount() > 0 && 
        !loreLimitReached) {
      console.log('💎 Manual fragment spawn triggered');
      this.spawnFragment();
      return true;
    } else {
      console.log(`💎 Cannot spawn - Fragments: ${this.fragments.length}/${this.maxFragments}, Available Lore: ${this.getUncollectedLoreCount()}, Collected: ${loreCollected}/${this.maxTotalLore}, Limit Reached: ${loreLimitReached}`);
      return false;
    }
  }
};

// Lost Data Fragment class
window.LostDataFragment = class LostDataFragment {
  constructor(x, y) {
    this.position = new window.Vector2D(x, y);
    this.active = true;
    this.animationTime = 0;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.rotationAngle = 0;
    this.scale = 1;
    this.glowIntensity = 0.8;
    
    // Visual properties
    this.size = 64; // Much larger for better visibility
    this.baseY = y;
    this.floatAmplitude = 20; // More noticeable floating
    this.floatSpeed = 2;
    this.rotationSpeed = 1;
    
    // Particle effect timer
    this.particleTimer = 0;
    this.particleInterval = 150; // More frequent particles for visibility
    
    // Visual enhancement timers
    this.glowPulseTimer = 0;
    this.colorShiftTimer = 0;
    
    // Visual variation properties (will be set by spawn system)
    this.visualVariation = {
      hueShift: 0,
      sizeMultiplier: 1,
      rotationSpeedMultiplier: 1,
      glowIntensityMultiplier: 1
    };
    
    // Load lore sprite
    this.image = new Image();
    this.image.src = 'https://i.postimg.cc/2yvHCQhj/Lore.png';
    this.imageLoaded = false;
    this.useFallback = false;
    
    // Force image loading with crossOrigin
    this.image.crossOrigin = 'anonymous';
    
    this.image.onload = () => {
      this.imageLoaded = true;
      console.log('✅ Lore fragment sprite loaded successfully');
    };
    
    this.image.onerror = () => {
      console.error('❌ Failed to load Lore fragment sprite - using fallback');
      this.useFallback = true;
    };
  }
  
  update(deltaTime) {
    if (!this.active) return;
    
    const dt = deltaTime / 1000;
    this.animationTime += deltaTime;
    
    // Floating animation - more dramatic
    this.floatPhase += this.floatSpeed * dt;
    this.position.y = this.baseY + Math.sin(this.floatPhase) * this.floatAmplitude;
    
    // Rotation animation - faster spinning
    this.rotationAngle += this.rotationSpeed * dt * 1.5;
    
    // Pulsing glow - more intense
    this.pulsePhase += dt * 4;
    this.glowIntensity = 0.4 + Math.sin(this.pulsePhase) * 0.6;
    
    // Scale pulsing - more dramatic size changes
    this.scale = 1 + Math.sin(this.pulsePhase * 0.7) * 0.3;
    
    // Update visual enhancement timers
    this.glowPulseTimer += deltaTime;
    this.colorShiftTimer += deltaTime;
    
    // Particle effects - more frequent
    this.particleTimer += deltaTime;
    if (this.particleTimer >= this.particleInterval) {
      this.particleTimer = 0;
      if (window.particleSystem) {
        window.particleSystem.dataFragmentGlow(this.position.x, this.position.y);
      }
    }
  }
  
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    
    // Draw glow effect first (behind sprite)
    this.drawGlow(ctx);
    
    // Apply transformations for sprite
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotationAngle);
    ctx.scale(this.scale, this.scale);
    
    // Draw ONLY the lore sprite with spinning animation
    if (this.imageLoaded && !this.useFallback) {
      ctx.drawImage(
        this.image,
        -this.size / 2,
        -this.size / 2,
        this.size,
        this.size
      );
    } else {
      // If sprite not loaded yet, draw simple placeholder circle
      ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  drawGlow(ctx) {
    // Draw much more prominent glow with color shifting
    const glowSize = this.size * 3; // Larger glow area
    
    // Color-shifting glow based on time
    const colorShift = Math.sin(this.colorShiftTimer / 500) * 0.5 + 0.5; // 0 to 1
    const hue1 = 270 + colorShift * 60; // Purple to pink range
    const hue2 = 200 + colorShift * 40; // Blue to cyan range
    
    // Multi-layer glow for more impact
    // Outer glow layer
    const outerGradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, glowSize
    );
    outerGradient.addColorStop(0, `hsla(${hue1}, 100%, 60%, ${this.glowIntensity * 0.3})`);
    outerGradient.addColorStop(0.5, `hsla(${hue2}, 100%, 50%, ${this.glowIntensity * 0.2})`);
    outerGradient.addColorStop(1, 'hsla(280, 100%, 40%, 0)');
    
    ctx.fillStyle = outerGradient;
    ctx.fillRect(
      this.position.x - glowSize,
      this.position.y - glowSize,
      glowSize * 2,
      glowSize * 2
    );
    
    // Inner bright glow
    const innerGradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, this.size
    );
    innerGradient.addColorStop(0, `hsla(${hue1}, 100%, 80%, ${this.glowIntensity * 0.6})`);
    innerGradient.addColorStop(0.7, `hsla(${hue2}, 100%, 70%, ${this.glowIntensity * 0.4})`);
    innerGradient.addColorStop(1, 'hsla(280, 100%, 60%, 0)');
    
    ctx.fillStyle = innerGradient;
    ctx.fillRect(
      this.position.x - this.size,
      this.position.y - this.size,
      this.size * 2,
      this.size * 2
    );
    
    // Add pulsing rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
      const ringPhase = (this.glowPulseTimer / 1000 + i * 0.3) % 2;
      if (ringPhase < 1) {
        const ringRadius = this.size * (1 + ringPhase * 2);
        const ringAlpha = (1 - ringPhase) * this.glowIntensity * 0.3;
        
        ctx.strokeStyle = `hsla(${hue1}, 100%, 70%, ${ringAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }
  reset() {
    this.fragments = [];
    this.spawnTimer = 0;
    this.nextSpawnTime = this.getRandomSpawnTime();
    this.collectionCooldownTimer = 0;
    this.authoredPlacementIndex = 0;
  }

};

// Initialize global lost data system
window.lostDataSystem = null;

// Initialize lost data system - FORCE TO WORK
window.initLostData = function(player) {
  try {
    if (window.lostDataSystem) {
      return true;
    }
    console.log('🔥🔥🔥 CREATING LOST DATA SYSTEM!!!');
    window.lostDataSystem = new window.LostDataSystem();
    
    // Init with or without player - doesn't matter for testing
    window.lostDataSystem.init(player || { position: { x: 960, y: 400 } });
    
    console.log('✅✅✅ LOST DATA SYSTEM SUCCESSFULLY CREATED!!!');
    
    return true;
  } catch (error) {
    console.error('❌❌❌ FAILED TO INITIALIZE LOST DATA SYSTEM:', error?.message || error);
    return false;
  }
};

// Global debug function
window.checkLostDataStatus = function() {
  if (!window.lostDataSystem) {
    console.log('❌ Lost Data system not initialized');
    return;
  }
  
  const progress = window.lostDataSystem.getProgress();
  console.log('💎 Lost Data System Status:');
  console.log(`  Collected: ${progress.collected}/${progress.total}`);
  console.log(`  Active Fragments: ${progress.activeFragments}`);
  console.log(`  Spawn Timer: ${(window.lostDataSystem.spawnTimer/1000).toFixed(1)}s`);
  console.log(`  Next Spawn: ${(window.lostDataSystem.nextSpawnTime/1000).toFixed(1)}s`);
  console.log(`  Available Lore: ${window.lostDataSystem.getUncollectedLoreCount()}`);
  console.log(`  Collection Cooldown: ${progress.cooldownActive ? 'ACTIVE' : 'INACTIVE'}`);
  if (progress.cooldownActive) {
    console.log(`  Cooldown Remaining: ${progress.cooldownRemaining.toFixed(1)}s`);
  }
  console.log(`  Player Reference: ${window.lostDataSystem.player ? '✅' : '❌'}`);
};

// Debug function to manually spawn fragment at player position
window.spawnLoreFragmentAtPlayer = function() {
  if (!window.lostDataSystem || !window.player) return false;
  
  const playerX = window.player.position.x;
  const playerY = window.player.position.y;
  
  const fragment = new window.LostDataFragment(playerX, playerY);
  window.lostDataSystem.fragments.push(fragment);
  
  console.log(`💎 Manual lore fragment spawned at player position: (${playerX}, ${playerY})`);
  
  if (window.particleSystem) {
    window.particleSystem.dataFragmentEffect(playerX, playerY);
  }
  
  return true;
};