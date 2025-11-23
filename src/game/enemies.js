// Enemy system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/enemies.js',
  exports: ['Enemy', 'EnemyManager', 'enemyManager'],
  dependencies: ['Vector2D', 'distance', 'clamp', 'randomRange']
});

// Base Enemy class
window.Enemy = class Enemy {
  constructor(x, y, type = 'virus') {
    this.position = new window.Vector2D(x, y);
    this.velocity = new window.Vector2D(0, 0);
    this.type = type;
    this.health = this.getMaxHealth();
    this.maxHealth = this.health;
    this.active = true;
    
    // Type-specific properties
    this.setupByType();
    
    // AI state
    this.state = 'entrance'; // Start with entrance state
    this.target = null;
    this.stateTimer = 0;
    this.animationTime = 0;
    
    // Entrance animation properties
    this.entrancePhase = 0;
    this.entranceComplete = true; // Firewalls have no entrance phase - start immediately
    this.originalSpawnX = x;
    this.originalSpawnY = y;
    
    // Firewall-specific properties
    this.shieldActive = false;
    this.preparingAttack = false;
    this.attackAnimationPlaying = false;
    this.attackAnimationDuration = 0;
    this.attackAnimationTimer = 0;
    
    // Enhanced animation properties
    this.idlePauseTimer = 0;
    this.idlePauseDuration = 0;
    this.idlePauseChance = 0.002; // 0.2% chance per frame to pause
    this.isIdlePaused = false;
    this.lastAnimationState = 'idle';
    this.animationTransitionCooldown = 0;
    
    // MakkoEngine sprite properties for virus enemies
    this.sprite = null;
    this.spriteReady = false;
    this.currentAnimation = null;
    this.facing = 1; // 1 for right, -1 for left
    
    // Individual movement phase offsets for independent behavior
    this.phaseOffset = Math.random() * Math.PI * 2; // Random phase offset
    this.movementSeed = Math.random() * 1000; // Random seed for movement patterns
    this.personalityTimer = Math.random() * 1000; // Randomized timing offset
    
    // Enemy interaction cooldowns
    this.lastCollisionTime = 0;
    this.collisionCooldown = 200; // 0.2 seconds for smoother collision response
    this.recentlyCollidedWith = new Set(); // Track recent collision partners
    
    // Spawn protection
    this.spawnTime = Date.now(); // Track when enemy was spawned
    this.spawnProtectionDuration = 2000; // 2 seconds of protection - knockback but no damage
    
    // Initialize sprite if this is a virus, corrupted, or firewall enemy
    if (this.type === 'virus' || this.type === 'corrupted' || this.type === 'firewall') {
      // CRITICAL: Delay sprite initialization to prevent loading race conditions
      setTimeout(() => {
        this.initSprite();
      }, 100); // 100ms delay
    }
    
    // Trigger entrance animation
    this.startEntrance();
    
    // Create spawn particle effect for each enemy type
    if (window.particleSystem) {
      console.log(`🌟 Creating ${this.type} spawn effect at (${this.position.x}, ${this.position.y})`);
      window.particleSystem.enemySpawnEffect(this.position.x, this.position.y, this.type);
    }
  }

  setupByType() {
    switch(this.type) {
      case 'virus':
        // Reduced dimensions by 60% from original virus_virus sprite (96x93)
        this.width = 38;  // 96 * 0.4 = 38.4 (rounded)
        this.height = 37; // 93 * 0.4 = 37.2 (rounded)
        this.speed = 150;
        this.damage = 1;
        this.color = '#9900ff';
        this.patrolRadius = 100;
        this.detectionRadius = 300;
        break;
        
      case 'corrupted':
        // Use corrupted_corrupted sprite dimensions (80x96) with scale adjustment
        this.width = 64;  // 80 * 0.8 = 64 (scaled to fit game)
        this.height = 77; // 96 * 0.8 = 76.8 (rounded)
        this.speed = 200; // Significantly increased speed to pass through firewall enemies
        this.damage = 2;
        this.color = '#00ff88'; // FIXED: Pure green for corrupted enemies
        this.patrolRadius = 80;
        this.detectionRadius = 400; // Increased detection range
        break;
        
      case 'firewall':
        // Use firewall_firewall sprite dimensions (96x93 idle, 68x96 walk, 96x67 attack) with scale adjustment
        this.width = 120; // Make significantly larger
        this.height = 120; // Make significantly larger
        this.speed = 25; // Slow walk left (was 3, now 25 for better visibility)
        this.damage = 1;
        this.color = '#ff9900';
        this.patrolRadius = 100;
        this.detectionRadius = 300;
        
        // Set attack animation duration based on sprite data (4.917 seconds at 12 fps = 59 frames)
        // ENHANCED: Extended duration for better attack visibility
        this.attackAnimationDuration = 6000; // milliseconds (extended from 4917 to 6000 for longer attacks)
        break;
        
      default:
        this.width = 40;
        this.height = 40;
        this.speed = 100;
        this.damage = 1;
        this.color = '#00ff66';
    }
  }

  getMaxHealth() {
    switch(this.type) {
      case 'virus': return 2;
      case 'corrupted': return 4;
      case 'firewall': return 6;
      default: return 3;
    }
  }

  // Coordinated jump mechanics for virus enemies
  performCoordinatedJump() {
    if (this.type !== 'virus' || !this.isOnGround) return;
    
    // Check for nearby enemies on the ground
    const nearbyEnemies = window.enemyManager?.getActiveEnemies().filter(other => 
      other !== this && 
      other.type === 'virus' && 
      other.isOnGround &&
      window.distance(this.position.x, this.position.y, other.position.x, other.position.y) < 100
    ) || [];
    
    if (nearbyEnemies.length > 0) {
      // Calculate jump arc over the nearest enemy
      const targetEnemy = nearbyEnemies[0];
      const dx = targetEnemy.position.x - this.position.x;
      const distance = Math.abs(dx);
      
      if (distance > 30) { // Only jump if there's meaningful distance
        // Higher jump for clearing enemies
        this.velocity.y = -this.speed * 0.08; // Higher jump
        
        // Horizontal velocity to arc over the target
        const jumpSpeed = Math.abs(dx) * 0.004; // Proportional to distance
        this.velocity.x = dx > 0 ? jumpSpeed : -jumpSpeed;
        
        // Mark this as a coordinated jump for visual effects
        this.isCoordinatedJump = true;
        this.jumpTarget = targetEnemy;
        
        // Make the grounded enemy move slightly to create space
        const moveDirection = dx > 0 ? -1 : 1; // Move opposite to jumper
        targetEnemy.velocity.x = moveDirection * this.speed * 0.15; // Subtle movement
        
        console.log(`Virus coordinated jump: ${this.position.x.toFixed(0)} -> over ${targetEnemy.position.x.toFixed(0)}`);
      } else {
        // Normal jump if too close to another enemy
        this.velocity.y = -this.speed * 0.06;
      }
    } else {
      // Normal jump when no enemies nearby
      this.velocity.y = -this.speed * 0.06;
    }
  }

  update(deltaTime, player) {
    if (!this.active) return;
    
    const dt = deltaTime / 1000;
    this.stateTimer += deltaTime;
    this.animationTime += deltaTime;
    
    // Track if enemy is on ground for jump prevention
    this.isOnGround = this.position.y >= 750;
    
    // Simple gravity for viruses that skip entrance
    if (this.type === 'virus' && this.position.y < 750) {
      this.velocity.y += 600 * dt;
      this.position.y += this.velocity.y * dt;
      
      if (this.position.y >= 750) {
        this.position.y = 750;
        this.velocity.y = 0;
        console.log('Virus landed on ground');
      }
    }
    
    // DEBUG: Log update calls for virus enemies
    if (this.type === 'virus' && Date.now() % 4000 < 100) {
      console.log(`Virus UPDATE: active=${this.active}, state=${this.state}, entranceComplete=${this.entranceComplete}, pos(${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)})`);
    }
    
    // AI behavior
    this.updateAI(player, dt);
    
    // Update sprite animation for virus, corrupted, and firewall enemies
    if ((this.type === 'virus' || this.type === 'corrupted' || this.type === 'firewall') && this.spriteReady && this.sprite) {
      this.updateSpriteAnimation(deltaTime);
      
      // CRITICAL: Emergency animation check - ensure animation is always playing
      const currentAnim = this.sprite.getCurrentAnimation();
      if (!currentAnim) {
        console.log(`🚨 EMERGENCY: ${this.type} enemy has no animation - forcing idle`);
        this.playAnimation('idle');
        
        // Force current animation state
        if (this.type === 'virus') {
          this.currentAnimation = 'virus_idle_idle';
        } else if (this.type === 'corrupted') {
          this.currentAnimation = 'corrupted_idle_idle';
        } else if (this.type === 'firewall') {
          this.currentAnimation = 'firewall_idle_idle';
        }
      }
    }
    
    // Apply stronger gravity to all enemies (especially firewalls)
    if (this.type === 'firewall') {
      this.velocity.y += 1200 * dt; // Double gravity for firewalls
    } else if (this.type === 'corrupted') {
      this.velocity.y += 800 * dt; // Stronger gravity for corrupted to prevent floating
    } else {
      this.velocity.y += 600 * dt;
    }
    
    // Update position
    this.position = this.position.add(this.velocity.multiply(dt));
    
    // Aggressive ground collision for firewalls - prevent any upward momentum
    if (this.type === 'firewall') {
      // Never allow firewalls above ground level
      if (this.position.y > 750) {
        this.position.y = 750;
        this.velocity.y = Math.min(0, this.velocity.y * 0.1); // Crush upward momentum
      }
      
      // Emergency ground clamp - force back down if floating
      if (this.position.y < 750) {
        this.position.y = 750;
        this.velocity.y = 0;
      }
    } else {
      // Normal ground collision for other enemies - ENHANCED for corrupted
      if (this.position.y >= 750) {
        this.position.y = 750;
        this.velocity.y = 0;
        
        // CRITICAL: Force corrupted enemies to stay grounded
        if (this.type === 'corrupted') {
          this.velocity.y = 0; // Double-ensure no upward velocity
          this.position.y = 750; // Force exact ground position
        }
      }
    }
    
    // Side-scroller world boundaries (4096px wide world)
    const worldLeft = this.width/2;
    const worldRight = 4096 - this.width/2;
    this.position.x = window.clamp(this.position.x, worldLeft, worldRight);
    
    // Final safety check - force firewalls to ground level
    if (this.type === 'firewall' && this.position.y < 750) {
      this.position.y = 750;
      this.velocity.y = 0;
    }
    
    // Reduced friction for tutorial enemies to keep movement
    const tutorialMode = window.tutorialSystem && window.tutorialSystem.isActive();
    if (tutorialMode && this.type === 'virus') {
      this.velocity.x *= 0.98; // Much less friction for tutorial viruses
    } else {
      this.velocity.x *= 0.95; // Normal friction
    }
    
    // DEBUG: Log final position for virus enemies
    if (this.type === 'virus' && Date.now() % 6000 < 100) {
      console.log(`Virus FINAL: pos(${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)}) vel(${this.velocity.x.toFixed(1)}, ${this.velocity.y.toFixed(1)})`);
    }
    
    // CRITICAL: Final safety check - force corrupted enemies to ground
    if (this.type === 'corrupted' && this.position.y < 750) {
      console.log('🔧 CORRUPTED GROUND CLAMP: Forcing corrupted enemy to ground level');
      this.position.y = 750;
      this.velocity.y = 0;
      this.velocity.x *= 0.8; // Reduce horizontal momentum when forced down
    }
  }

  updateAI(player, dt) {
    const distToPlayer = window.distance(
      this.position.x, this.position.y,
      player.position.x, player.position.y
    );
    
    // DEBUG: Log AI state for virus enemies
    if (this.type === 'virus' && Date.now() % 3000 < 100) {
      console.log(`Virus AI: state=${this.state}, entranceComplete=${this.entranceComplete}, distToPlayer=${distToPlayer.toFixed(0)}, detectionRadius=${this.detectionRadius}`);
    }
    
    // SIMPLIFIED: No emergency checks needed - float/drop system is reliable
    
    // SIMPLIFIED STATE MACHINE - no entrance state for viruses
    if (this.type === 'virus') {
      // Virus: Skip entrance, go straight to patrol/chase
      switch(this.state) {
        case 'patrol':
          this.patrol(dt);
          // GLOBAL PURSUIT: Immediately chase when player detected
          if (distToPlayer <= 9999) { // Always detect player
            this.state = 'chase';
            this.target = player;
            this.stateTimer = 0;
          }
          break;
          
        case 'chase':
          if (distToPlayer > this.detectionRadius * 1.5) {
            this.state = 'patrol';
            this.target = null;
          } else {
            this.chase(player, dt);
          }
          break;
      }
    } else {
      // Other enemies keep normal state machine
      switch(this.state) {
        case 'entrance':
          this.entrance(dt);
          if (this.entranceComplete) {
            this.state = 'patrol';
            this.stateTimer = 0;
          }
          break;
          
        case 'patrol':
          this.patrol(dt);
          // GLOBAL PURSUIT: Immediately chase when player detected
          if (distToPlayer <= 9999) { // Always detect player
            this.state = 'chase';
            this.target = player;
            this.stateTimer = 0;
          }
          break;
          
        case 'chase':
          if (distToPlayer > this.detectionRadius * 1.5) {
            this.state = 'patrol';
            this.target = null;
          } else {
            this.chase(player, dt);
          }
          break;
      }
    }
  }

  // Start entrance animation
  startEntrance() {
    switch(this.type) {
      case 'virus':
        // DYNAMIC VIRUS SPAWN AROUND PLAYER: Spawn from all sides for better distribution
        const playerX = window.gameState?.player?.position?.x || 960;
        const playerY = window.gameState?.player?.position?.y || 750;
        
        // ENHANCED: Viruses can spawn from all 4 sides plus middle areas for variety
        const spawnSides = ['left', 'right', 'top', 'bottom', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
        const spawnSide = spawnSides[Math.floor(Math.random() * spawnSides.length)];
        
        // Calculate spawn position based on chosen side
        let virusSpawnX, virusSpawnY;
        
        switch (spawnSide) {
          case 'left':
            virusSpawnX = playerX - 600 - Math.random() * 300; // 600-900px left of player
            virusSpawnY = playerY + window.randomRange(-150, 150); // Vertical variation
            break;
          case 'right':
            virusSpawnX = playerX + 600 + Math.random() * 300; // 600-900px right of player
            virusSpawnY = playerY + window.randomRange(-150, 150); // Vertical variation
            break;
          case 'top':
            virusSpawnX = playerX + window.randomRange(-400, 400); // Horizontal spread
            virusSpawnY = playerY - 500 - Math.random() * 150; // Further above player
            break;
          case 'bottom':
            virusSpawnX = playerX + window.randomRange(-400, 400); // Horizontal spread
            virusSpawnY = playerY + 250 + Math.random() * 150; // Further below player area
            break;
          case 'top-left':
            virusSpawnX = playerX - 500 - Math.random() * 200;
            virusSpawnY = playerY - 400 - Math.random() * 100;
            break;
          case 'top-right':
            virusSpawnX = playerX + 500 + Math.random() * 200;
            virusSpawnY = playerY - 400 - Math.random() * 100;
            break;
          case 'bottom-left':
            virusSpawnX = playerX - 500 - Math.random() * 200;
            virusSpawnY = playerY + 200 + Math.random() * 100;
            break;
          case 'bottom-right':
            virusSpawnX = playerX + 500 + Math.random() * 200;
            virusSpawnY = playerY + 200 + Math.random() * 100;
            break;
        }
        
        // Ensure spawn is off-screen but not too far
        virusSpawnX = window.clamp(virusSpawnX, 100, 3896);
        virusSpawnY = window.clamp(virusSpawnY, 200, 850);
        
        // Never spawn directly above player
        if (Math.abs(virusSpawnX - playerX) < 100) {
          virusSpawnX = playerX + (virusSpawnX < playerX ? -200 : 200);
        }
        
        this.position.x = virusSpawnX;
        this.position.y = virusSpawnY;
        this.velocity.x = 0;
        this.velocity.y = 0;
        
        // Start above ground for dramatic fall
        this.position.y = -50;
        
        // Skip complex entrance - go straight to patrol with fall
        this.entranceComplete = true;
        this.state = 'patrol';
        console.log(`Virus: Dynamic spawn at (${this.position.x.toFixed(0)}, -50) on ${spawnSide} side`);
        break;
        
      case 'corrupted':
        // CORRUPTED SPAWN FROM RIGHT EDGE ONLY: Never spawn in middle of screen
        const corruptedPlayerX = window.gameState?.player?.position?.x || 960;
        
        // ALWAYS spawn from far right edge - no exceptions - MOVED 200PX TO RIGHT
        let corruptedSpawnX, corruptedSpawnY;
        
        // FIXED: Always spawn from far right edge (not middle) - MOVED 200PX MORE TO RIGHT
        corruptedSpawnX = 4500 + window.randomRange(-50, 0); // Far right edge with small variation (200px further right from 4300)
        
        // Full vertical range but away from player
        corruptedSpawnY = window.randomRange(200, 700); // Slightly tighter vertical range
        
        console.log(`Corrupted SPAWNING FROM RIGHT EDGE ONLY at (${corruptedSpawnX.toFixed(0)}, ${corruptedSpawnY.toFixed(0)})`);
        
        // Use exact edge position - no safe position searching that could move enemy inland
        this.position.x = corruptedSpawnX;
        this.position.y = corruptedSpawnY;
        
        // Always throw toward left/center from right edge
        this.velocity.x = -(80 + Math.random() * 40); // Always throw left from right edge
        this.velocity.y = 50 + Math.random() * 50; // Gentle downward momentum
        
        this.entrancePhase = 'throwing';
        this.entranceComplete = false; // Ensure entrance animation runs
        console.log(`Corrupted entrance: Thrown from right edge (${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)})`);
        break;
        
      case 'firewall':
        // FIREWALL: Spawn to the right, off-screen, pursue player with lunging attacks - MOVED 200PX TO RIGHT
        this.position.x = 5120; // Spawn 3200px to the right of visible screen (1920px + 3200px) - MOVED 200PX RIGHT
        this.position.y = 750; // Start at ground level
        this.velocity.x = 0; // Will be set by pursuit AI
        this.velocity.y = 0;
        this.entrancePhase = 'pursuing'; // Pursuing state
        
        // CRITICAL: Initialize all AI state variables properly
        this.aiState = 'walking'; // walking -> preparing_lunge -> lunging -> recovering
        this.aiStateTimer = 0;
        
        // INDIVIDUAL TIMING OFFSETS to prevent synchronized attacks
        this.lungeCooldown = 2000 + Math.random() * 2000; // 2-4 seconds with randomization
        this.nextLungeTime = 1500 + Math.random() * 3000; // First lunge 1.5-4.5 seconds (more randomization)
        this.minAttackDistance = 200; // CRITICAL: Reduced minimum attack distance for more frequent attacks
        this.maxAttackDistance = 400; // CRITICAL: Reduced maximum attack distance for better engagement
        this.baseAttackInterval = 4000 + Math.random() * 4000; // 4-8 seconds base interval
        this.lungeDirection = 1; // Will be calculated dynamically based on player position
        
        // Attack animation properties
        this.attackAnimationDuration = 6000; // milliseconds
        this.attackAnimationTimer = 0;
        this.attackAnimationPlaying = false;
        
        // CRITICAL FIX: Set entranceComplete to true so firewall AI starts immediately
        this.entranceComplete = true;
        this.state = 'chase'; // Set to chase so AI actively pursues player
        
        console.log('🔥 FIREWALL SPAWNED: AI initialized - walking state, ready to pursue and lunge');
        break;
    }
    
    // Create entrance effect - DISABLED to prevent random particles
    // this.createEntranceEffect();
  }
  
  // Update entrance animation
  entrance(dt) {
    switch(this.type) {
      case 'virus':
        this.virusEntrance(dt);
        break;
      case 'corrupted':
        this.corruptedEntrance(dt);
        break;
      case 'firewall':
        this.firewallEntrance(dt);
        break;
    }
  }
  
  // Virus entrance: Simple fall from above
  virusEntrance(dt) {
    // Simple gravity fall - that's it
    this.velocity.y += 800 * dt; // Gravity
    this.position.y += this.velocity.y * dt;
    
    // Check if reached ground
    if (this.position.y >= 750) {
      this.position.y = 750;
      this.velocity.y = 0;
      this.entranceComplete = true;
      console.log('Virus landed - ready to patrol');
      
      // Small impact effect
      if (window.particleSystem) {
        window.particleSystem.impact(this.position.x, this.position.y, '#9900ff', 10);
      }
    }
  }
  
  // Corrupted entrance: Thrown from side with controlled physics
  corruptedEntrance(dt) {
    this.entrancePhase = 'throwing';
    
    // Apply physics for thrown entrance
    this.velocity.y += 800 * dt; // Gravity
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    // Green particle trail during fall
    if (Math.random() > 0.6 && window.particleSystem) {
      window.particleSystem.damageEffect(
        this.position.x + (Math.random() - 0.5) * 15,
        this.position.y,
        'corrupted', 2
      );
    }
    
    // Check if reached ground level
    if (this.position.y >= 750) {
      this.position.y = 750;
      this.velocity.y = 0;
      this.velocity.x *= 0.3; // Reduce horizontal momentum but keep some
      this.originalSpawnY = 750;
      
      // Create green ground impact particles at exact landing position
      if (window.particleSystem) {
        window.particleSystem.impact(this.position.x, this.position.y, '#00ff88', 20);
        console.log(`💚 Corrupted ground impact at (${this.position.x}, ${this.position.y})`);
      }
      
      // Screen shake for landing
      if (window.renderer && typeof window.renderer.addScreenShake === 'function') {
        window.renderer.addScreenShake(4, 150);
      }
      
      this.entranceComplete = true;
      console.log('Corrupted entrance complete - ready to patrol');
    }
    
    // Emergency boundaries
    if (this.position.x < -100 || this.position.x > 2020) {
      this.position.x = window.clamp(this.position.x, 100, 3996);
      this.velocity.x *= -0.5;
    }
  }
  
  // Simplified Firewall behavior: Walk left, occasionally lunge
  firewallEntrance(dt) {
    this.aiStateTimer += dt;
    
    // DEBUG: Log AI state changes for debugging
    if (Date.now() % 2000 < 50) { // Log every 2 seconds
      const distToPlayer = window.distance(
        this.position.x, this.position.y,
        window.player?.position?.x || 960,
        window.player?.position?.y || 750
      );
      console.log(`🔥 Firewall AI: state=${this.aiState}, cooldown=${this.lungeCooldown.toFixed(0)}, distToPlayer=${distToPlayer.toFixed(0)}, pos(${this.position.x.toFixed(0)}, ${this.position.y.toFixed(0)})`);
    }
    
    switch(this.aiState) {
      case 'walking':
        // PURSUE PLAYER instead of walking left
        const distToPlayer = window.distance(
          this.position.x, this.position.y,
          window.player?.position?.x || 960,
          window.player?.position?.y || 750
        );
        
        // Calculate direction to player
        const walkDx = (window.player?.position?.x || 960) - this.position.x;
        const walkDy = (window.player?.position?.y || 750) - this.position.y;
        const angleToPlayer = Math.atan2(walkDy, walkDx);
        
        // Move toward player at slow pursuit speed
        const pursuitSpeed = 80; // Much faster for visible movement (doubled from 40)
        this.velocity.x = Math.cos(angleToPlayer) * pursuitSpeed;
        
        // Update position
        this.position.x += this.velocity.x * dt;
        this.position.y = 750; // Keep on ground
        
        // Subtle breathing effect
        this.position.y += Math.sin(Date.now() * 0.002) * 2;
        
        // Check if it's time to prepare a lunge
        this.lungeCooldown -= dt;
        if (this.lungeCooldown <= 0) {
          // Lunge when player is close (400px range for better engagement)
          if (distToPlayer < 400) {
            this.aiState = 'preparing_lunge';
            this.aiStateTimer = 0;
            this.lungeChargeTime = 800; // 0.8 second charge
            
            // Calculate lunge direction toward player
            const dx = (window.player?.position?.x || 960) - this.position.x;
            const dy = (window.player?.position?.y || 750) - this.position.y;
            const angleToPlayer = Math.atan2(dy, dx);
            this.lungeDirection = Math.cos(angleToPlayer) > 0 ? 1 : -1;
            
            console.log(`🔥 Firewall preparing lunge toward player (distance: ${distToPlayer.toFixed(0)}px)`);
          } else {
            // Player too far, keep pursuing
            this.aiState = 'walking';
            this.lungeCooldown = 2000; // Longer cooldown when pursuing
          }
        }
        break;
        
      case 'preparing_lunge':
        // Charge up animation for lunge attack
        this.aiStateTimer += dt;
        
        // Stop moving during charge
        this.velocity.x = 0;
        
        // Visual charging effect
        this.position.y = 750 + Math.sin(Date.now() * 0.008) * 5; // Intensified breathing
        
        // Screen shake during charge
        if (this.aiStateTimer % 80 < 40 && window.renderer && typeof window.renderer.addScreenShake === 'function') {
          window.renderer.addScreenShake(2, 60);
        }
        
        // CRITICAL: Force attack animation immediately when preparing lunge
        if (!this.attackAnimationPlaying && this.spriteReady && this.sprite) {
          this.playAnimation('attack');
          this.attackAnimationPlaying = true;
          this.attackAnimationTimer = this.attackAnimationDuration;
          console.log('🔥 Firewall FORCED attack animation during PREPARE phase');
        }
        
        // Charging particles
        if (Math.random() > 0.7 && window.particleSystem) {
          window.particleSystem.damageEffect(
            this.position.x + 20,
            this.position.y - 20,
            'firewall',
            2
          );
        }
        
        // Calculate angle to player for lunge
        const lungeCalcDx = (window.player?.position?.x || 960) - this.position.x;
        const lungeCalcDy = (window.player?.position?.y || 750) - this.position.y;
        const lungeAngleToPlayer = Math.atan2(lungeCalcDy, lungeCalcDy);
        
        // Execute lunge after charge time
        if (this.aiStateTimer >= this.lungeChargeTime) {
          this.aiState = 'lunging';
          this.aiStateTimer = 0;
          
          // Execute lunge toward player with reduced range
          const lungeForce = 96; // Further reduced from 144 for much less glide (33% total reduction) 300 for shorter range
          this.velocity.x = Math.cos(lungeAngleToPlayer) * lungeForce; // Lunge toward player
          this.velocity.y = -120; // Increased from -80 to -120 for less horizontal glide (more upward arc)
          
          // Strong screen shake for lunge
          if (window.renderer && typeof window.renderer.addScreenShake === 'function') {
            window.renderer.addScreenShake(8, 300);
          }
          
          // Enhanced lunge particles
          if (window.particleSystem) {
            for (let i = 0; i < 8; i++) {
              window.particleSystem.damageEffect(
                this.position.x + 30 + (Math.random() - 0.5) * 40,
                this.position.y + Math.random() * 40,
                'firewall',
                4
              );
            }
          }
          
          console.log(`Firewall executing powerful lunge attack toward player (velocity: ${this.velocity.x.toFixed(1)}, ${this.velocity.y.toFixed(1)})`);
        }
        break;
        
      case 'lunging':
        // Execute lunge movement
        this.aiStateTimer += dt;
        
        // CRITICAL: Ensure attack animation continues during lunge
        if (this.attackAnimationPlaying && this.spriteReady && this.sprite) {
          // Check if current animation is still attack
          const currentAnim = this.sprite.getCurrentAnimation();
          if (!currentAnim || !currentAnim.includes('attack')) {
            // Force restart attack animation if it was interrupted
            this.playAnimation('attack');
            console.log('🔥 Firewall attack animation RESTARTED during lunge');
          }
        }
        
        // Apply lunge physics
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        
        // Apply gravity
        this.velocity.y += 800 * dt;
        
        // Slow down horizontal velocity more aggressively
        this.velocity.x *= 0.85; // Reduced from 0.92 for quicker deceleration
        
        // Ground collision
        if (this.position.y >= 750) {
          this.position.y = 750;
          this.velocity.y = 0;
          
          // Impact particles when landing
          if (Math.abs(this.velocity.x) > 50 && window.particleSystem) {
            for (let i = 0; i < 6; i++) {
              window.particleSystem.impact(
                this.position.x + (Math.random() - 0.5) * 60,
                755,
                'firewall',
                3
              );
            }
          }
        }
        
        // End lunge when velocity is low or time is up - lower threshold
        if (Math.abs(this.velocity.x) < 10 || this.aiStateTimer > 1200) { // Reduced velocity threshold from 15 to 10, time from 1500 to 1200
          console.log('🔥 Firewall lunge ending - transitioning to recovery');
          this.aiState = 'recovering';
          this.aiStateTimer = 0;
          this.velocity.x = 0;
          this.velocity.y = 0;
          
          // Return to idle animation when lunge ends
          if (this.spriteReady && this.sprite) {
            this.playAnimation('idle');
            this.attackAnimationPlaying = false; // Reset attack state
            this.shieldActive = false;
            this.preparingAttack = false;
          }
        }
        break;
        
      case 'recovering':
        // Recovery state: Brief pause before walking again
        this.position.y = 750 + Math.sin(Date.now() * 0.002) * 3; // Calm breathing
        
        // Keep firewall in bounds
        this.position.x = Math.max(100, Math.min(2900, this.position.x));
        
        // Recovery particles
        if (Math.random() > 0.9 && window.particleSystem && this.aiStateTimer < 400) {
          window.particleSystem.impact(
            this.position.x + (Math.random() - 0.5) * 40,
            755,
            'firewall',
            1
          );
        }
        
        // Return to pursuing after recovery
        if (this.aiStateTimer > 1200) { // 1.2 second recovery
          console.log('🔥 Firewall recovery complete - returning to walking pursuit');
          this.aiState = 'walking';
          this.aiStateTimer = 0;
          this.velocity.x = 0; // Will be set by pursuit logic
          this.lungeCooldown = 4000 + Math.random() * 2000; // 4-6 seconds until next lunge (longer cooldown)
        }
        break;
    }
  }
  
  // Create particle effects for corrupted enemies (green particles)
  createGlitchParticles(type) {
    if (window.particleSystem && this.type === 'corrupted') {
      // Create green glitch particles
      for (let i = 0; i < 3; i++) {
        const particleX = this.position.x + (Math.random() - 0.5) * 20;
        const particleY = this.position.y - this.height/2 + (Math.random() - 0.5) * 20;
        window.particleSystem.damageEffect(particleX, particleY, '#00ff88', 2);
      }
    }
  }
  
  // Create teleport trail effect
  createTeleportTrail(oldX, oldY, newX, newY) {
    if (window.particleSystem && this.type === 'corrupted') {
      // Create green teleport trail particles
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const trailX = oldX + (newX - oldX) * t;
        const trailY = oldY + (newY - oldY) * t;
        window.particleSystem.damageEffect(trailX, trailY, '#00ff88', 2);
      }
    }
  }
  
  // Create entrance effects - DISABLED to prevent random particles
  createEntranceEffect() {
    // DISABLED: Entrance effects were causing random particle spam
    // No spawn particles for any enemy type
  }

  patrol(dt) {
    // Enhanced patrol with player pursuit for all enemy types
    const player = window.player;
    if (!player) {
      // Fallback basic patrol if no player
      this.basicPatrol(dt);
      return;
    }
    
    const distToPlayer = window.distance(
      this.position.x, this.position.y,
      player.position.x, player.position.y
    );
    
    // GLOBAL PURSUIT: All enemies pursue player regardless of distance
    switch(this.type) {
      case 'virus':
        // Virus: Global pursuit with jumping - always pursue player
        const virusPursuitRange = 9999; // Global pursuit - always pursue player
        if (distToPlayer < virusPursuitRange) {
          // Pursue player actively
          const angleToPlayer = Math.atan2(
            player.position.y - this.position.y,
            player.position.x - this.position.x
          );
          
          // Speed increases when closer to player
          const speedBoost = distToPlayer < 300 ? 2.5 : 1.5; // Further increased speed for better movement
          this.velocity.x = Math.cos(angleToPlayer) * this.speed * speedBoost;
          
          // Jump attack when close
          if (distToPlayer < 150 && this.isOnGround && Math.random() > 0.6) {
            this.velocity.y = -this.speed * 0.08;
            this.velocity.x = Math.cos(angleToPlayer) * this.speed * 1.2;
          }
        } else {
          // GLOBAL PURSUIT: Always pursue player even at extreme distances
          const angleToPlayer = Math.atan2(
            player.position.y - this.position.y,
            player.position.x - this.position.x
          );
          this.velocity.x = Math.cos(angleToPlayer) * this.speed * 1.2; // Always pursue with speed boost
        }
        break;
        
      case 'corrupted':
        // Corrupted: Global pursuit with occasional teleports
        const corruptedPursuitRange = 9999; // Global pursuit - always pursue player
        if (distToPlayer < corruptedPursuitRange) {
          // Smooth pursuit
          const angleToPlayer = Math.atan2(
            player.position.y - this.position.y,
            player.position.x - this.position.x
          );
          this.velocity.x = Math.cos(angleToPlayer) * this.speed * 1.1; // Increased pursuit speed
          
          // Rare teleport attack when close
          if (distToPlayer < 200 && Math.random() > 0.98) {
            const teleportX = player.position.x + (Math.random() - 0.5) * 200;
            const teleportY = player.position.y + (Math.random() - 0.5) * 100;
            
            // Create teleport effect
            if (window.particleSystem) {
              window.particleSystem.damageEffect(this.position.x, this.position.y, '#00ff88', 15);
              window.particleSystem.damageEffect(teleportX, teleportY, '#00ff88', 15);
            }
            
            this.position.x = window.clamp(teleportX, this.width/2, 4096 - this.width/2);
            this.position.y = window.clamp(teleportY, 100, 850);
          }
        } else {
          // GLOBAL PURSUIT: Always pursue player even at extreme distances
          const angleToPlayer = Math.atan2(
            player.position.y - this.position.y,
            player.position.x - this.position.x
          );
          this.velocity.x = Math.cos(angleToPlayer) * this.speed * 1.3; // Always pursue with speed boost
        }
        break;
        
      case 'firewall':
        // FIREWALL AI: CRITICAL - Always use dedicated firewall AI system
        
        // Always pursue player - use dedicated AI
        this.firewallAI(dt * 1000, player);
        break;
    }
  }
  
  // Basic patrol behavior for when player is far away
  basicPatrol(dt) {
    switch(this.type) {
      case 'virus':
        // RESTORED: Individual virus movement with phase offsets for independent behavior
        const moveTimer = Date.now() / 1000 + this.phaseOffset; // Each virus has different phase offset
        const tutorialMode = window.tutorialSystem && window.tutorialSystem.isActive();
        
        // Individual speed multiplier based on virus personality
        const speedMultiplier = tutorialMode ? 1.2 + Math.sin(this.movementSeed) * 0.3 : 0.8 + Math.sin(this.movementSeed) * 0.2;
        
        // Basic back-and-forth movement with individual phase
        const sineValue = Math.sin(moveTimer + this.personalityTimer / 1000);
        if (sineValue > 0) {
          this.velocity.x = this.speed * speedMultiplier;
        } else {
          this.velocity.x = -this.speed * speedMultiplier;
        }
        
        // Individual jump timing
        const jumpFrequency = 0.95 + Math.sin(this.movementSeed * 2) * 0.04; // 91% to 99% chance
        if (this.isOnGround && Math.random() > jumpFrequency) {
          this.performCoordinatedJump();
        }
        
        // Add individual movement variation
        const variationMultiplier = 0.15 + Math.sin(this.movementSeed * 3) * 0.1;
        this.velocity.x += Math.sin(moveTimer * 2 + this.phaseOffset) * this.speed * variationMultiplier;
        break;
        
      case 'corrupted':
        // Corrupted: Smooth, predictable movement - reduced glitchiness
        const smoothTime = (Date.now() + this.movementSeed) / 2000; // Slower cycle (2s for smoother movement)
        const movementPhase = Math.floor(smoothTime % 3); // Simplified 3-phase cycle
        
        switch(movementPhase) {
          case 0: // Phase 1: Smooth patrol
            // Gentle side-to-side movement without erratic sine waves
            const patrolDirection = Math.sin(smoothTime * 0.5 + this.phaseOffset) * 0.5 + 0.5;
            if (patrolDirection > 0.5) {
              this.velocity.x = this.speed * 0.4; // Gentle right movement
            } else {
              this.velocity.x = -this.speed * 0.4; // Gentle left movement
            }
            // DISABLED: Corrupted enemies should not hop/jump at all
            // if (this.isOnGround && Math.random() > 0.99) {
            //   this.velocity.y = -this.speed * 0.06;
            // }
            break;
            
          case 1: // Phase 2: DISABLED teleportation - only smooth movement
            // DISABLED: Corrupted enemies should not teleport during patrol
            // if (this.stateTimer > 3000 && Math.random() > 0.99) { // Even stricter conditions - almost never
            //   const teleportDistance = 60 + Math.random() * 30; // Shorter distance
            //   const teleportAngle = Math.atan2(
            //     (window.player?.position?.y || 750) - this.position.y,
            //     (window.player?.position?.x || 960) - this.position.x
            //   ) + (Math.random() - 0.5) * Math.PI / 3; // Teleport somewhat toward player
            //   
            //   const oldX = this.position.x;
            //   const oldY = this.position.y;
            //   
            //   let newX = oldX + Math.cos(teleportAngle) * teleportDistance;
            //   let newY = oldY + Math.sin(teleportAngle) * teleportDistance * 0.3;
            //   
            //   // Keep within world bounds
            //   newX = window.clamp(newX, this.width/2, 4096 - this.width/2);
            //   newY = window.clamp(newY, 100, 850);
            //   
            //   // Teleport effect with particles
            //   this.createTeleportTrail(oldX, oldY, newX, newY);
            //   
            //   // Smooth teleport to new position
            //   this.position.x = newX;
            //   this.position.y = newY;
            //   this.velocity.x = 0;
            //   this.velocity.y = 0;
            //   
            //   this.stateTimer = 0; // Reset timer after teleport
            //   console.log('Corrupted smooth teleport!');
            // }
            
            // Always move smoothly instead of teleporting
            this.velocity.x = Math.sin(smoothTime * 0.3 + this.phaseOffset) * this.speed * 0.3;
            break;
            
          case 2: // Phase 3: Gentle pursuit
            // Move smoothly toward general area without aggressive bursts
            if (window.player) {
              const playerAngle = Math.atan2(
                window.player.position.y - this.position.y,
                window.player.position.x - this.position.x
              );
              this.velocity.x = Math.cos(playerAngle) * this.speed * 0.5; // Gentle pursuit
            } else {
              // Default gentle movement if no player
              this.velocity.x = Math.sin(smoothTime * 0.4 + this.phaseOffset) * this.speed * 0.3;
            }
            break;
        }
        break;
        
      case 'firewall':
        // FIREWALL: Run the dedicated AI state machine for lunging attacks
        if (this.aiState) {
          this.firewallEntrance(dt);
        } else {
          // Initialize AI state if not set
          this.aiState = 'walking';
          this.aiStateTimer = 0;
          this.lungeCooldown = 2000;
          this.firewallEntrance(dt);
        }
        break;
    }
  }

  // DEDICATED FIREWALL AI METHOD - Complete state machine for lunging attacks
  firewallAI(deltaTimeMs, player) {
    // Convert deltaTime to seconds for consistent timing
    const dt = deltaTimeMs / 1000;
    // CRITICAL: Initialize AI state if missing
    if (!this.aiState) {
      console.log('🔧 Firewall AI state missing - initializing to walking');
      this.aiState = 'walking';
      this.aiStateTimer = 0;
      
      // INDIVIDUALIZED timing for firewalls without initialized timing
      if (!this.baseAttackInterval) {
        this.baseAttackInterval = 4000 + Math.random() * 4000; // 4-8 seconds base interval
      }
      if (!this.lungeCooldown) {
        this.lungeCooldown = this.baseAttackInterval + Math.random() * 2000;
      }
    }
    
    // CRITICAL: Always ensure distToPlayer is available before calling updateFirewallAI
    const safeDistToPlayer = window.distance(
      this.position.x, this.position.y,
      player.position.x, player.position.y
    );
    
    // ALWAYS update AI state machine - this is the PRIMARY AI driver
    this.updateFirewallAI(dt, player);
  }
  
  // CORE FIREWALL AI STATE MACHINE
  updateFirewallAI(dt, player) {
    this.aiStateTimer += dt * 1000; // Convert to milliseconds for timers
    
    // CRITICAL: Always calculate distToPlayer first before any usage
    const distToPlayer = window.distance(
      this.position.x, this.position.y,
      player.position.x, player.position.y
    );
    
    // DEBUG: Log AI state every 2 seconds
    if (Date.now() % 2000 < 50) {
      console.log(`🔥 Firewall AI State: ${this.aiState}, dist: ${distToPlayer.toFixed(0)}, cooldown: ${this.lungeCooldown.toFixed(0)}`);
    }
    
    switch(this.aiState) {
      case 'walking':
        this.handleWalkingState(dt, player, distToPlayer);
        break;
      case 'preparing_lunge':
        this.handlePreparingLungeState(dt, player, distToPlayer);
        break;
      case 'lunging':
        this.handleLungingState(dt, player, distToPlayer);
        break;
      case 'recovering':
        this.handleRecoveringState(dt, player, distToPlayer);
        break;
      default:
        // Emergency fallback - use default distance if somehow not calculated
        const fallbackDist = distToPlayer || 999;
        console.log('🔧 Firewall AI in unknown state - resetting to walking');
        this.aiState = 'walking';
        this.aiStateTimer = 0;
        this.lungeCooldown = 2000;
        break;
    }
  }
  
  // WALKING STATE: Pursue player and prepare for lunge
  handleWalkingState(dt, player, distToPlayer) {
    // CRITICAL: Always ensure walk animation when in walking state
    if (this.aiState === 'walking' && this.spriteReady && this.sprite) {
      const currentAnim = this.sprite.getCurrentAnimation();
      if (!currentAnim || !currentAnim.includes('walk')) {
        this.sprite.stop();
        setTimeout(() => {
          if (this.spriteReady && this.sprite && this.aiState === 'walking') {
            this.playAnimation('walk');
            this.currentAnimation = 'firewall_walk_walk';
            console.log('🔥 Firewall WALK state: walk animation FORCED');
          }
        }, 50);
      }
    }
    
    // DISABLED: Remove idle pauses completely - firewall should always pursue
    this.isIdlePaused = false;
    
    // SIMPLIFIED: Direct pursuit without excessive checks
    const angleToPlayer = Math.atan2(
      player.position.y - this.position.y,
      player.position.x - this.position.x
    );
    
    const pursuitSpeed = 80; // Steady pursuit speed
    this.velocity.x = Math.cos(angleToPlayer) * pursuitSpeed;
    
    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.y = 750; // Keep on ground
    
    // CRITICAL: Update facing direction based on movement BEFORE checking for lunge
    this.facing = this.velocity.x > 0 ? 1 : -1;
    
    // CRITICAL: Force walk animation when actually moving
    if (Math.abs(this.velocity.x) > 5 && this.spriteReady && this.sprite) {
      const currentAnim = this.sprite.getCurrentAnimation();
      if (!currentAnim || !currentAnim.includes('walk')) {
        this.sprite.stop();
        setTimeout(() => {
          if (this.spriteReady && this.sprite && this.aiState === 'walking') {
            this.playAnimation('walk');
            this.currentAnimation = 'firewall_walk_walk';
            console.log('🔥 Firewall walk animation FORCED during actual movement');
          }
        }, 50);
      }
    }
    
    // Subtle breathing effect
    this.position.y += Math.sin(Date.now() * 0.002) * 2;
    
    // CRITICAL: Ensure sprite animation is updated for walking state
    if (this.spriteReady && this.sprite) {
      // Force walk animation during ANY movement or pursuit
      const currentAnim = this.sprite.getCurrentAnimation();
      if (!currentAnim || !currentAnim.includes('walk')) {
        this.sprite.stop(); // Stop current animation first
        setTimeout(() => {
          if (this.spriteReady && this.sprite) {
            this.playAnimation('walk');
            this.currentAnimation = 'firewall_walk_walk';
            console.log('🔥 Firewall walking animation FORCED during pursuit');
          }
        }, 50);
      }
    }
    
    // ENHANCED: Check if should prepare lunge with FIXED distance logic
    this.lungeCooldown -= dt * 1000;
    
    // CRITICAL: Force walk animation whenever moving in walking state
    if (Math.abs(this.velocity.x) > 5 && this.spriteReady && this.sprite) {
      const currentAnim = this.sprite.getCurrentAnimation();
      if (!currentAnim || !currentAnim.includes('walk')) {
        this.sprite.stop();
        setTimeout(() => {
          if (this.spriteReady && this.sprite && this.aiState === 'walking') {
            this.playAnimation('walk');
            this.currentAnimation = 'firewall_walk_walk';
            console.log('🔥 Firewall walk animation FORCED during movement');
          }
        }, 50);
      }
    }
    
    if (this.lungeCooldown <= 0 && distToPlayer <= this.maxAttackDistance && distToPlayer >= this.minAttackDistance) {
      // Attack if player is within attack range (between min and max distance)
      this.transitionToPreparingLunge(player, distToPlayer);
      console.log(`🔥 Firewall initiating attack - player at ${distToPlayer.toFixed(0)}px (range: ${this.minAttackDistance}-${this.maxAttackDistance})`);
    }
  }
  
  // PREPARING LUNGE STATE: Charge up before attack
  handlePreparingLungeState(dt, player, distToPlayer) {
    // Stop moving during charge
    this.velocity.x = 0;
    
    // CRITICAL FIX: Update facing direction based on player position when preparing lunge
    const dx = player.position.x - this.position.x;
    this.facing = dx > 0 ? 1 : -1; // Face toward player
    
    // CRITICAL: Force velocity to match facing direction to prevent gliding
    this.velocity.x = 0; // Ensure no horizontal drift when preparing
    
    // Visual charging effect
    this.position.y = 750 + Math.sin(Date.now() * 0.008) * 5;
    
    // Screen shake during charge
    if (this.aiStateTimer % 80 < 40 && window.renderer?.addScreenShake) {
      window.renderer.addScreenShake(2, 60);
    }
    
    // CRITICAL: Force attack animation
    this.forceAttackAnimation();
    
    // Charging particles
    if (Math.random() > 0.7 && window.particleSystem) {
      window.particleSystem.damageEffect(
        this.position.x + 20,
        this.position.y - 20,
        'firewall',
        2
      );
    }
    
    // Execute lunge after charge time
    if (this.aiStateTimer >= 800) { // 0.8 second charge
      this.transitionToLunging(player, distToPlayer);
    }
  }
  
  // LUNGING STATE: Execute the lunge attack
  handleLungingState(dt, player, distToPlayer) {
    // CRITICAL: Maintain attack animation
    this.maintainAttackAnimation();
    
    // CRITICAL: Ensure facing direction matches movement direction during entire lunge
    if (this.velocity.x > 0) {
      this.facing = 1; // Face right when moving right
    } else if (this.velocity.x < 0) {
      this.facing = -1; // Face left when moving left
    }
    
    // Apply lunge physics
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    // Apply gravity
    this.velocity.y += 800 * dt;
    
    // CRITICAL FIX: Much more aggressive horizontal deceleration to prevent sliding
    this.velocity.x *= 0.65; // Reduced from 0.85 to 0.65 - stops sliding much faster
    
    // Ground collision
    if (this.position.y >= 750) {
      this.position.y = 750;
      this.velocity.y = 0;
      
      // Impact particles
      if (Math.abs(this.velocity.x) > 50 && window.particleSystem) {
        for (let i = 0; i < 6; i++) {
          window.particleSystem.impact(
            this.position.x + (Math.random() - 0.5) * 60,
            755,
            'firewall',
            3
          );
        }
      }
    }
    
    // End lunge when velocity is low or time is up
    if (Math.abs(this.velocity.x) < 10 || this.aiStateTimer > 1200) {
      this.transitionToRecovering();
    }
  }
  
  // RECOVERING STATE: Brief pause before next action
  handleRecoveringState(dt, player, distToPlayer) {
    // Calm breathing effect
    this.position.y = 750 + Math.sin(Date.now() * 0.002) * 3;
    
    // CRITICAL FIX: Force position lock during recovery to prevent any sliding
    // Firewall should be completely stationary during recovery
    this.position.x += 0; // No horizontal movement
    this.velocity.x = 0; // Force zero velocity
    
    // Keep firewall in bounds
    this.position.x = Math.max(100, Math.min(2900, this.position.x));
    
    // Recovery particles
    if (Math.random() > 0.9 && window.particleSystem && this.aiStateTimer < 400) {
      window.particleSystem.impact(
        this.position.x + (Math.random() - 0.5) * 40,
        755,
        'firewall',
        1
      );
    }
    
    // Return to walking after recovery - shorter recovery
    if (this.aiStateTimer > 1200) {
      this.transitionToWalking();
    }
  }
  
  // STATE TRANSITION METHODS
  
  transitionToPreparingLunge(player, distToPlayer) {
    this.aiState = 'preparing_lunge';
    this.aiStateTimer = 0;
    
    // Calculate lunge direction
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const angleToPlayer = Math.atan2(dy, dx);
    this.lungeDirection = Math.cos(angleToPlayer) > 0 ? 1 : -1;
    
    console.log(`🔥 Firewall preparing lunge (distance: ${distToPlayer.toFixed(0)}px)`);
  }
  
  transitionToLunging(player, distToPlayer) {
    this.aiState = 'lunging';
    this.aiStateTimer = 0;
    
    // Calculate angle to player
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const angleToPlayer = Math.atan2(dy, dx);
    
    // CRITICAL FIX: Execute lunge in the direction the firewall is FACING, not just toward player
    // This ensures right-facing firewalls lunge right, left-facing firewalls lunge left
    const lungeDirection = this.facing; // Use current facing direction (1 for right, -1 for left)
    const lungeForce = 96; // Consistent lunge force
    
    // Apply lunge velocity in facing direction with slight vertical component
    this.velocity.x = lungeDirection * lungeForce; // Use facing direction, not angle to player
    this.velocity.y = -100;
    
    // CRITICAL: Immediately update facing to match movement direction
    this.facing = lungeDirection;
    
    // Strong screen shake
    if (window.renderer?.addScreenShake) {
      window.renderer.addScreenShake(8, 300);
    }
    
    // Enhanced lunge particles
    if (window.particleSystem) {
      for (let i = 0; i < 8; i++) {
        window.particleSystem.damageEffect(
          this.position.x + 30 + (Math.random() - 0.5) * 40,
          this.position.y + Math.random() * 40,
          'firewall',
          4
        );
      }
    }
    
    console.log(`🔥 Firewall executing lunge attack! Direction: ${lungeDirection > 0 ? 'RIGHT' : 'LEFT'}, Facing: ${this.facing > 0 ? 'RIGHT' : 'LEFT'}`);
  }
  
  transitionToRecovering() {
    console.log('🔥 Firewall lunge ending - transitioning to recovery');
    this.aiState = 'recovering';
    this.aiStateTimer = 0;
    
    // CRITICAL FIX: Force immediate stop to prevent any post-attack sliding
    this.velocity.x = 0; // Complete horizontal stop
    this.velocity.y = 0; // Complete vertical stop
    
    // ENHANCED: Force position stabilization to prevent drift
    this.position.x += 0; // No movement
    
    // ENHANCED: Set animation transition cooldown to prevent glitches
    this.animationTransitionCooldown = 500; // 500ms cooldown
    this.lastAnimationState = 'attack';
    
    // Return to idle animation with enhanced transition
    this.returnToIdleAnimation();
  }
  
  transitionToWalking() {
    console.log('🔥 Firewall recovery complete - returning to walking');
    this.aiState = 'walking';
    this.aiStateTimer = 0;
    this.velocity.x = 0;
    
    // CRITICAL: Force walk animation immediately when transitioning to walking
    if (this.spriteReady && this.sprite) {
      this.playAnimation('walk');
      this.currentAnimation = 'firewall_walk_walk';
      console.log('🔥 Firewall walk animation FORCED on transition to walking');
    }
    
    // INDIVIDUALIZED timing to prevent synchronized attacks
    this.lungeCooldown = this.baseAttackInterval + Math.random() * 2000; // Use base interval with randomization
    console.log(`🔥 Firewall next lunge in ${this.lungeCooldown.toFixed(0)}ms (individualized timing)`);
  }
  
  // ANIMATION CONTROL METHODS
  
  // ENHANCED: Handle occasional idle pauses during walking
  updateIdlePauseBehavior(dt) {
    // Don't pause if already paused or in certain states
    if (this.isIdlePaused || this.aiState === 'preparing_lunge' || this.aiState === 'lunging' || this.aiState === 'recovering') {
      return;
    }
    
    // CRITICAL: REDUCED idle pause chance - firewall should walk more, pause less
    this.idlePauseChance = 0.002; // Reduced from 0.008 to 0.002 (0.2% chance per frame)
    
    // Random chance to pause for idle animation
    if (Math.random() < this.idlePauseChance) {
      this.isIdlePaused = true;
      this.idlePauseDuration = 1200 + Math.random() * 1800; // 1.2-3.0 second pause
      this.idlePauseTimer = this.idlePauseDuration;
      
      // CRITICAL: Force immediate stop and idle animation
      this.velocity.x = 0;
      if (this.spriteReady && this.sprite) {
        this.sprite.stop();
        setTimeout(() => {
          if (this.spriteReady && this.sprite && this.isIdlePaused) {
            this.playAnimation('idle');
            this.currentAnimation = 'firewall_idle_idle';
            console.log('🔥 Firewall RANDOM IDLE PAUSE with clean animation start');
          }
        }, 50);
      }
      
      console.log(`🔥 Firewall RANDOM IDLE PAUSE for ${this.idlePauseDuration.toFixed(0)}ms`);
    }
  }
  
  forceAttackAnimation() {
    if (!this.attackAnimationPlaying && this.spriteReady && this.sprite) {
      this.playAnimation('attack');
      this.attackAnimationPlaying = true;
      this.attackAnimationTimer = this.attackAnimationDuration;
      console.log('🔥 Firewall FORCED attack animation');
    }
  }
  
  maintainAttackAnimation() {
    if (this.attackAnimationPlaying && this.spriteReady && this.sprite) {
      const currentAnim = this.sprite.getCurrentAnimation();
      if (!currentAnim || !currentAnim.includes('attack')) {
        this.playAnimation('attack');
        console.log('🔥 Firewall attack animation MAINTAINED during lunge');
      }
    }
  }
  
  returnToIdleAnimation() {
    if (this.spriteReady && this.sprite) {
      // IMMEDIATE: Stop current animation and force idle
      this.sprite.stop();
      
      // CRITICAL: Force immediate idle animation without delay
      this.playAnimation('idle');
      this.attackAnimationPlaying = false;
      this.shieldActive = false;
      this.preparing = false;
      this.lastAnimationState = 'idle';
      this.currentAnimation = 'firewall_idle_idle';
      
      // CRITICAL: Set extended animation lock to prevent premature changes
      this.animationTransitionCooldown = 800; // 800ms lock for stable idle
      
      console.log('🔥 Firewall IMMEDIATE return to idle animation with 800ms lock');
    }
  }
  
  // ENHANCED: Handle occasional idle pauses when player is at medium distance only
  updateIdlePauseBehavior(dt, distToPlayer) {
    // Only consider idle pauses when player is at medium distance (300-500px)
    const isMediumDistance = distToPlayer >= 300 && distToPlayer <= 500;
    
    if (!isMediumDistance) {
      // Never pause when player is close or far
      return;
    }
    
    // Rare chance to start idle pause when at medium distance
    if (!this.isIdlePaused && Math.random() < 0.002) { // 0.2% chance per frame
      this.isIdlePaused = true;
      this.idlePauseTimer = 1500 + Math.random() * 1500; // 1.5-3 seconds pause
      this.idlePauseDuration = this.idlePauseTimer;
      
      // Force idle animation during pause
      if (this.spriteReady && this.sprite) {
        this.playAnimation('idle');
        this.currentAnimation = 'firewall_idle_idle';
        console.log('🔥 Firewall starting rare idle pause at medium distance');
      }
    }
  }
  
  chase(target, dt) {
    const dx = target.position.x - this.position.x;
    const dy = target.position.y - this.position.y;
    const chaseDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (chaseDistance > 0) {
      switch(this.type) {
        case 'virus':
          // Virus: Smooth pursuit - simplified movement to prevent glitching
          if (this.velocity.y < 0) {
            // When jumping, maintain current horizontal direction smoothly
            this.velocity.x *= 0.9; // Gentle deceleration, not abrupt stop
          } else {
            // Smooth pursuit toward player without erratic movement
            const smoothAngle = Math.atan2(dy, dx);
            this.velocity.x = Math.cos(smoothAngle) * this.speed * 0.8; // Reduced speed for smoother movement
          }
          
          // Small hop attacks - maintain direction during jump
          if (dy < -30 && chaseDistance < 200 && this.isOnGround) {
            this.velocity.y = -8; // Further reduced from 20 to 8 (60% total reduction from original 50)
            // Keep horizontal momentum during jump - don't set to 0
          }
          break;
          
        case 'corrupted':
          // Corrupted: Smooth pursuit with rare teleports
          const corruptedChaseTime = Date.now();
          
          // Smooth pursuit toward player without aggressive behavior
          const approachAngle = Math.atan2(dy, dx);
          const targetVelocityX = Math.cos(approachAngle) * this.speed * 0.6; // Reduced speed for smoother movement
          
          // CRITICAL: Update facing direction based on TARGET movement
          this.facing = targetVelocityX > 0 ? 1 : -1;
          
          this.velocity.x = targetVelocityX;
          
          // DISABLED: Corrupted enemies should not teleport during chase
          // if (chaseDistance > 120 && Math.random() > 0.99) { // Even stricter conditions - almost never
          //   const teleportAngle = approachAngle + (Math.random() - 0.5) * Math.PI / 6; // Smaller angle variation
          //   const teleportDist = Math.min(80, chaseDistance * 0.4); // Shorter distance
          //   
          //   const oldX = this.position.x;
          //   const oldY = this.position.y;
          //   const newX = this.position.x + Math.cos(teleportAngle) * teleportDist;
          //   const newY = this.position.y + Math.sin(teleportAngle) * teleportDist * 0.2;
          //   
          //   // Keep within bounds
          //   this.position.x = window.clamp(newX, this.width/2, 1920 - this.width/2);
          //   this.position.y = window.clamp(newY, 100, 850);
          //   
          //   this.createTeleportTrail(oldX, oldY, this.position.x, this.position.y);
          //   this.velocity.x = 0;
          //   this.velocity.y = 0;
          //   console.log('Corrupted rare teleport attack!');
          // }
          
          // DISABLED: Corrupted enemies should not jump
          // if (this.isOnGround && Math.random() > 0.97) {
          //   this.velocity.y = -this.speed * 0.08; // Reduced hop height
          //   console.log('Corrupted rare hop!');
          // }
          
          // Fewer glitch particles (much less frequent)
          if (Math.random() > 0.98) {
            this.createGlitchParticles();
          }
          break;
          
        case 'firewall':
          // FIREWALL CHASE: Use pursuit AI system - ALWAYS run AI
          // CRITICAL FIX: Force firewall AI to run regardless of entrance state
          if (!this.aiState) {
            // Initialize AI state if missing
            console.log('🔧 Firewall AI state missing - initializing now');
            this.aiState = 'walking';
            this.aiStateTimer = 0;
            this.lungeCooldown = 2000;
          }
          this.firewallAI(dt * 1000, player);
          break;
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
    
    // Damage particles - ENABLED for all enemies including corrupted
    if (window.particleSystem) {
      let particleColor = this.type;
      if (this.type === 'corrupted') {
        particleColor = 'corrupted'; // Will use green color
      }
      window.particleSystem.damageEffect(this.position.x, this.position.y - this.height/2, particleColor, 10);
    }
    
    if (this.health <= 0) {
      this.active = false;
      
      // Death explosion - ENABLED for all enemies including corrupted
      if (window.particleSystem) {
        let particleColor = this.type;
        if (this.type === 'corrupted') {
          particleColor = 'corrupted'; // Will use green color
        }
        window.particleSystem.explosion(this.position.x, this.position.y - this.height/2, particleColor, 25);
      }
      
      // FIXED: Remove health restoration - killing enemies should NOT restore player health
      // Health restoration only happens through hacking puzzles, not enemy kills
      
      // Award points when enemy is defeated
      if (window.gameState) {
        const points = this.getPointValue();
        window.gameState.score += points;
        // Reduce logging frequency for performance
        if (Date.now() % 1000 < 100) { // Log every second
          console.log(`Enemy defeated! +${points} points. Total: ${window.gameState.score}`);
        }
      }
    }
  }
  
  getPointValue() {
    switch(this.type) {
      case 'virus': return 100;
      case 'corrupted': return 200;
      case 'firewall': return 300;
      default: return 100;
    }
  }

  getHitbox() {
    // TIGHT hitbox that matches actual sprite dimensions with animation-specific adjustments
    if ((this.type === 'virus' || this.type === 'corrupted' || this.type === 'firewall') && this.spriteReady && this.sprite) {
      // DISABLE sprite hitbox for viruses to force manual calculation
      const spriteHitbox = this.sprite.getHitbox();
      if (spriteHitbox && this.type !== 'virus') {
        // Get appropriate scale based on enemy type and current animation
        let drawScale = 0.8; // Default scale
        let drawOffset = 60; // Default offset
        
        if (this.type === 'corrupted') {
          drawScale = 1.2; // Corrupted scale
          drawOffset = 80;
        } else if (this.type === 'firewall') {
          // Animation-specific scaling for firewall
          if (this.currentAnimation === 'firewall_idle_idle') {
            drawScale = 2.0 * 1.13;
            drawOffset = 100 - 14; // Match drawSprite idle positioning
          } else if (this.currentAnimation === 'firewall_walk_walk') {
            drawScale = 2.0;
            drawOffset = 100 + 4; // Match drawSprite walk positioning
          } else if (this.currentAnimation === 'firewall_attack_default') {
            drawScale = 2.0 * 1.3;
            drawOffset = 100 - 36; // Match drawSprite attack positioning
          } else {
            drawScale = 2.0;
            drawOffset = 100;
          }
        }
        
        // Convert sprite's anchor-relative hitbox to world space with correct scale
        const worldHitbox = this.sprite.getHitboxWorld(this.position.x, this.position.y, {
          scale: drawScale,
          flipH: this.facing === -1
        });
        
        if (worldHitbox) {
          // Apply TIGHT margins - only cut 5% from each side for precision
          const marginReduction = 0.05;
          const tightWidth = worldHitbox.width * (1 - marginReduction * 2);
          const tightHeight = worldHitbox.height * (1 - marginReduction * 2);
          
          return {
            x: worldHitbox.x + (worldHitbox.width - tightWidth) / 2,
            y: worldHitbox.y + (worldHitbox.height - tightHeight) / 2,
            width: tightWidth,
            height: tightHeight
          };
        }
        
        // Fallback: Use sprite dimensions directly with tight margins
        let spriteWidth, spriteHeight, yOffset;
        
        // Use exact sprite dimensions from manifest
        if (this.type === 'virus') {
          // virus_virus: 96x93px with 0.4x scale = 38.4x37.2px
          spriteWidth = 96 * drawScale;
          spriteHeight = 93 * drawScale;
          yOffset = drawOffset - 240; // RAISED: Move hitbox top up 200px total (much higher position for better stomping) - RAISED 40px MORE FROM EXISTING (20px toward front)
          
          // EXTEND HITBOX: Add 20px to the front of virus for better collision
          // Front is determined by facing direction
          if (this.facing === 1) {
            // Facing right - extend hitbox to the right
            return {
              x: this.position.x - tightWidth/2,        // Keep left edge same
              y: this.position.y - tightHeight + yOffset, // Adjusted offset to match sprite
              width: tightWidth + 20,                    // EXTEND: Add 20px to width
              height: tightHeight                   // Tight height with 3% margins
            };
          } else {
            // Facing left - extend hitbox to the left
            return {
              x: this.position.x - tightWidth/2 - 20, // EXTEND: Move left edge left by 20px
              y: this.position.y - tightHeight + yOffset, // Adjusted offset to match sprite
              width: tightWidth + 20,                    // EXTEND: Add 20px to width
              height: tightHeight                   // Tight height with 3% margins
            };
          }
        } else if (this.type === 'corrupted') {
          // Use current animation dimensions
          if (this.currentAnimation === 'corrupted_walk_walk') {
            spriteWidth = 74 * drawScale; // 74px for walk
            spriteHeight = 96 * drawScale;
          } else {
            spriteWidth = 80 * drawScale; // 80px for idle
            spriteHeight = 96 * drawScale;
          }
          yOffset = drawOffset;
        } else if (this.type === 'firewall') {
          // Use current animation dimensions
          if (this.currentAnimation === 'firewall_walk_walk') {
            spriteWidth = 68 * drawScale; // 68px for walk
            spriteHeight = 96 * drawScale;
          } else if (this.currentAnimation === 'firewall_attack_default') {
            spriteWidth = (96 - 20) * drawScale; // 96px for attack, reduced by 20px width
            spriteHeight = 67 * drawScale; // 67px for attack
          } else {
            spriteWidth = 96 * drawScale; // 96px for idle
            spriteHeight = 93 * drawScale; // 93px for idle
          }
          yOffset = drawOffset;
        }
        
        // Apply TIGHT margins - only cut 3% from each side for precision
        const marginReduction = 0.03;
        const tightWidth = spriteWidth * (1 - marginReduction * 2);
        const tightHeight = spriteHeight * (1 - marginReduction * 2);
        
        return {
          x: this.position.x - tightWidth/2,        // Center with tight margins
          y: this.position.y - tightHeight + yOffset, // Adjusted offset to match sprite
          width: tightWidth,                    // Tight width with 3% margins
          height: tightHeight                   // Tight height with 3% margins
        };
      }
    }
    
    // Default hitbox for non-sprite enemies
    return {
      x: this.position.x - this.width/2,     // Center horizontally
      y: this.position.y - this.height,      // Top of enemy body
      width: this.width,
      height: this.height
    };
  }
  
  // Debug method to visualize hitbox
  drawHitbox(ctx) {
    const hitbox = this.getHitbox();
    ctx.save();
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    
    // Draw center point
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(this.position.x - 2, this.position.y - 2, 4, 4);
    ctx.restore();
    
    // DEBUG: Draw hitbox for visualization
    if (window.DEBUG_HITBOXES) {
      this.drawHitbox(ctx);
    }
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    
    // Hide firewall sprite when below ground during emergence
    if (this.type === 'firewall' && this.state === 'entrance' && this.position.y > 750) {
      ctx.restore();
      return; // Don't draw sprite when below ground
    }
    
    // Apply alpha transparency for firewall entrance
    if (this.type === 'firewall' && this.alpha !== undefined && this.alpha < 1) {
      ctx.globalAlpha = this.alpha;
    }
    
    // Draw entrance effects BEFORE sprite to prevent appearing underneath
    if (this.state === 'entrance' && this.type === 'corrupted') {
      this.drawEntranceEffects(ctx);
    }
    
      // Draw sprite for virus, corrupted, and firewall enemies, fallback to rectangle for others
    if ((this.type === 'virus' || this.type === 'corrupted' || this.type === 'firewall') && this.spriteReady && this.sprite) {
      this.drawSprite(ctx);
      
      // Draw corrupted-specific visual effects (overlay on sprite)
      if (this.type === 'corrupted') {
        this.drawCorruptedEffects(ctx);
      }
      
      // Draw firewall-specific visual effects (overlay on sprite)
      if (this.type === 'firewall') {
        this.drawFirewallEffects(ctx);
      }
      // Draw health bar for sprite enemies (positioned with offset)
      if (this.health < this.maxHealth) {
        let healthBarY = this.position.y - this.height + 60 - 10; // Default offset for virus
        if (this.type === 'corrupted') {
          healthBarY = this.position.y - this.height + 80 - 10; // Adjusted offset for corrupted (lowered by 20px more)
        } else if (this.type === 'firewall') {
          healthBarY = this.position.y - this.height + 100 - 10; // Firewall offset (higher due to larger sprite)
        }
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(
          this.position.x - this.width,
          healthBarY,
          this.width * 2 * (this.health / this.maxHealth),
          4
        );
      }
    } else {
      // CRITICAL: Don't draw fallback rectangles for corrupted and firewall enemies
      // These enemies should wait for sprites to load, not show placeholder graphics
      if (this.type !== 'corrupted' && this.type !== 'firewall') {
        // Draw enemy body - position is at bottom center (only for non-sprite enemies)
        const bodyY = this.position.y - this.height; // Top of enemy body
        const bodyX = this.position.x - this.width/2; // Left edge of enemy body
        
        const gradient = ctx.createRadialGradient(
          this.position.x, bodyY + this.height/2, 0,
          this.position.x, bodyY + this.height/2, this.width/2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          bodyX,
          bodyY,
          this.width,
          this.height
        );
        
        // Draw glow based on health
        const healthRatio = this.health / this.maxHealth;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10 + (healthRatio * 10);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          this.position.x - this.width/2,
          this.position.y - this.height,
          this.width,
          this.height
        );
      }
    }
    
    // Draw health bar (only for non-virus enemies)
    if (this.health < this.maxHealth && this.type !== 'virus') {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.fillRect(
        this.position.x - this.width/2,
        this.position.y - this.height - 10,
        this.width * (this.health / this.maxHealth),
        4
      );
    }
    
    
    ctx.restore();
  }
  
  // Draw entrance-specific visual effects
  drawEntranceEffects(ctx) {
    switch(this.type) {
      case 'virus':
        // Falling corruption trail - reduced visual intensity
        if (this.entrancePhase === 'falling') {
          // Draw falling streaks - fewer and more subtle
          ctx.strokeStyle = 'rgba(0, 170, 255, 0.15)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 1; i++) {
            ctx.beginPath();
            ctx.moveTo(
              this.position.x + (Math.random() - 0.5) * 10,
              this.position.y - 30
            );
            ctx.lineTo(
              this.position.x + (Math.random() - 0.5) * 5,
              this.position.y
            );
            ctx.stroke();
          }
        }
        break;
        
      case 'corrupted':
        // Ground burst effect - DISABLED to prevent random circles
        // if (this.entrancePhase === 'bursting') {
        //   // Draw expanding ring from ground
        //   const burstRadius = Math.max(0, (850 - this.position.y) * 0.5);
        //   ctx.strokeStyle = 'rgba(255, 153, 0, 0.4)';
        //   ctx.lineWidth = 2;
        //   ctx.beginPath();
        //   ctx.arc(this.position.x, 850, burstRadius, 0, Math.PI * 2);
        //   ctx.stroke();
        // }
        break;
        
      case 'firewall':
        // Materialization grid effect - DISABLED to prevent random circles
        // if (this.entrancePhase === 'materializing') {
        //   // Draw rotating digital grid
        //   const time = Date.now() / 1000;
        //   ctx.strokeStyle = `rgba(102, 0, 255, ${this.alpha * 0.3})`;
        //   ctx.lineWidth = 1;
        //   
        //   // Draw hexagonal pattern
        //   for (let i = 0; i < 6; i++) {
        //     const angle = (Math.PI * 2 * i) / 6 + time;
        //     const x1 = this.position.x + Math.cos(angle) * 30;
        //     const y1 = this.position.y - 40 + Math.sin(angle) * 30;
        //     const x2 = this.position.x + Math.cos(angle + Math.PI / 3) * 30;
        //     const y2 = this.position.y - 40 + Math.sin(angle + Math.PI / 3) * 30;
        //     
        //     ctx.beginPath();
        //     ctx.moveTo(x1, y1);
        //     ctx.lineTo(x2, y2);
        //     ctx.stroke();
        //   }
        // }
        break;
    }
  }
  
  // Draw corrupted-specific visual effects (subtle glitch and distortion)
  drawCorruptedEffects(ctx) {
    const currentTime = Date.now();
    
    // Only show glitch effects during teleport phase, not constantly
    if (this.state === 'patrol') {
      const glitchCycle = Math.floor(((currentTime + this.movementSeed) / 1200) % 4); // Individual 4-phase cycle
      
      // Only during teleport phase (phase 1) and much less frequent
      if (glitchCycle === 1 && Math.random() > 0.9) { // Much less frequent - only 10% chance
        ctx.save();
        ctx.globalAlpha = 0.15; // Even more subtle
        
        // Single subtle glitch line at body center, not head
        const glitchY = this.position.y - this.height/4 + (Math.random() - 0.5) * 20; // Body center, not head
        const glitchWidth = 10 + Math.random() * 8; // Smaller width
        const glitchX = this.position.x - glitchWidth/2;
        
        ctx.fillStyle = '#ff9900';
        ctx.fillRect(glitchX, glitchY, glitchWidth, 1);
        
        ctx.restore();
      }
    }
  }
  
  // Draw firewall-specific visual effects
  drawFirewallEffects(ctx) {
    const currentTime = Date.now();
    
    // Draw earth displacement effect during emergence
    if (this.state === 'entrance' && this.entrancePhase === 'emerging') {
      this.drawEarthDisplacement(ctx);
    }
    
    // Removed cycle indicators text display for cleaner visual
  }
  
  // Custom earth displacement effect for firewall emergence
  drawEarthDisplacement(ctx) {
    const groundY = 750;
    const emergenceProgress = Math.min(1.0, this.stateTimer / 1500); // 0 to 1 over 1.5 seconds
    
    ctx.save();
    
    // Draw dirt/earth particles being displaced upward
    const particleCount = Math.floor(emergenceProgress * 8);
    for (let i = 0; i < particleCount; i++) {
      const offsetX = (Math.random() - 0.5) * 120; // Spread around firewall
      const offsetY = -Math.random() * 40 * emergenceProgress; // Rise up as firewall emerges
      const size = 2 + Math.random() * 3;
      
      // Earth colors
      const colors = ['#8B4513', '#A0522D', '#808080', '#696969'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8 * (1 - emergenceProgress * 0.3); // Fade as emergence completes
      
      // Draw small earth particles
      ctx.fillRect(
        this.position.x + offsetX,
        groundY + offsetY,
        size,
        size
      );
    }
    
    // Draw final impact burst when emergence completes
    if (emergenceProgress >= 0.9 && this.stateTimer < 1600) {
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const distance = 40 + Math.random() * 30;
        const impactX = this.position.x + Math.cos(angle) * distance;
        const impactY = groundY + Math.sin(angle) * distance * 0.3 + 60; // Lowered 60px closer to sprite feet
        const size = 3 + Math.random() * 2;
        
        const colors = ['#8B4513', '#808080'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        
        ctx.fillRect(impactX - size/2, impactY - size/2, size, size);
      }
    }
    
    ctx.restore();
  }
  
  // Initialize MakkoEngine sprite for virus, corrupted, and firewall enemies
  async initSprite() {
    try {
      let characterName;
      if (this.type === 'virus') {
        characterName = 'virus_virus';
      } else if (this.type === 'corrupted') {
        characterName = 'corrupted_corrupted';
      } else if (this.type === 'firewall') {
        characterName = 'firewall_firewall';
      }
      console.log(`Initializing ${characterName} character...`);
      
      // Check if we should use fallback graphics
      if (window.useFallbackGraphics) {
        console.log(`Using fallback graphics for ${characterName} - MakkoEngine not available`);
        this.spriteReady = false;
        this.sprite = null;
        return;
      }
      
      // Wait for MakkoEngine to be available
      if (!window.MakkoEngine) {
        console.log('MakkoEngine not available - will retry...');
        setTimeout(() => this.initSprite(), 100);
        return;
      }
      
      // Wait for engine to be loaded
      if (!window.MakkoEngine.isLoaded()) {
        console.log('MakkoEngine still loading - will retry...');
        setTimeout(() => this.initSprite(), 100);
        return;
      }
      
      // Get the appropriate character
      this.sprite = window.MakkoEngine.sprite(characterName);
      
      if (!this.sprite) {
        console.error(`❌ ${characterName} character not found in manifest`);
        
        // CRITICAL: Try fallback for corrupted enemies to ensure they still appear
        if (this.type === 'corrupted') {
          console.log('🔧 Corrupted sprite failed - using fallback visible rendering');
          this.spriteReady = false;
          this.sprite = null;
          return;
        }
        
        return;
      }
      
      // Wait for character to be loaded
      if (!this.sprite.isLoaded()) {
        console.log(`${characterName} still loading - will retry...`);
        setTimeout(() => this.initSprite(), 100);
        return;
      }
      
      console.log(`✓ ${characterName} character loaded successfully`);
      const animations = this.sprite.getAvailableAnimations();
      console.log('Available animations:', animations);
      
      this.spriteReady = true;
      this.currentAnimation = null;
      
      // CRITICAL: IMMEDIATELY start idle animation and force state
      this.playAnimation('idle');
      
      // CRITICAL: Force initialize animation state for all enemy types
      if (this.type === 'virus') {
        this.currentAnimation = 'virus_idle_idle';
        console.log('🦠 Virus idle animation forced initialized IMMEDIATELY');
      } else if (this.type === 'corrupted') {
        this.currentAnimation = 'corrupted_idle_idle';
        console.log('💚 Corrupted idle animation forced initialized IMMEDIATELY');
      } else if (this.type === 'firewall') {
        this.currentAnimation = 'firewall_idle_idle';
        console.log('🔥 Firewall idle animation forced initialized IMMEDIATELY');
      }
      
      console.log(`✅ IMMEDIATE idle animation started for ${this.type} enemy`);
      
      // CRITICAL: For corrupted enemies, force fallback rendering if sprite fails
      if (this.type === 'corrupted' && (!this.spriteReady || !this.sprite)) {
        console.log('🔧 Corrupted sprite failed - using fallback rendering');
        this.spriteReady = false;
        this.sprite = null;
      }
      
    } catch (error) {
      console.error(`Error initializing ${this.type} sprite:`, error?.message || error);
      this.spriteReady = false;
      this.sprite = null;
      
      // CRITICAL: For corrupted enemies, ensure fallback rendering
      if (this.type === 'corrupted') {
        console.log('🔧 Corrupted sprite initialization failed - ensuring visible fallback');
        this.spriteReady = false;
        this.sprite = null;
      }
    }
  }
  
  // Update sprite animation based on movement state
  updateSpriteAnimation(deltaTime) {
    if (!this.spriteReady || !this.sprite) {
      return;
    }
    
    try {
      // CRITICAL: Update sprite FIRST with delta time
      this.sprite.update(deltaTime);
      
      // CRITICAL: Force animation state check and correction for ALL enemy types
      this.forceCorrectAnimationState();
      
    } catch (error) {
      console.error(`Error updating ${this.type} sprite animation:`, error?.message || error);
    }
  }
  
  // CRITICAL: Force correct animation state for all enemy types
  forceCorrectAnimationState() {
    if (!this.spriteReady || !this.sprite) {
      return;
    }
    
    const currentAnim = this.sprite.getCurrentAnimation();
    let targetAnimation = 'idle';
    
    // DETERMINE TARGET ANIMATION based on enemy type and state
    if (this.type === 'virus') {
      // VIRUS: ALWAYS play idle animation (only animation available)
      targetAnimation = 'idle';
      
      // CRITICAL: Force virus idle if not playing
      if (!currentAnim || !currentAnim.includes('virus_idle')) {
        this.playAnimation('idle');
        this.currentAnimation = 'virus_idle_idle';
        console.log('🦠 Virus forcing idle animation to play');
      }
      
    } else if (this.type === 'corrupted') {
      // CORRUPTED: Walk when moving, idle when stationary
      if (Math.abs(this.velocity.x) > 2) {
        targetAnimation = 'walk';
        this.facing = this.velocity.x > 0 ? 1 : -1;
      } else {
        targetAnimation = 'idle';
      }
      
      // CRITICAL: Force corrupted animation state
      const targetFullAnim = targetAnimation === 'walk' ? 'corrupted_walk_walk' : 'corrupted_idle_idle';
      if (!currentAnim || !currentAnim.includes(targetAnimation)) {
        this.playAnimation(targetAnimation);
        this.currentAnimation = targetFullAnim;
        console.log(`💚 Corrupted forcing ${targetAnimation} animation to play`);
      }
      
    } else if (this.type === 'firewall') {
      // FIREWALL: Complex state machine with attack animations
      if (this.attackAnimationPlaying || this.shieldActive || this.preparingAttack || 
          this.aiState === 'preparing_lunge' || this.aiState === 'lunging') {
        targetAnimation = 'attack';
      } else if (this.isIdlePaused) {
        targetAnimation = 'idle';
      } else if (Math.abs(this.velocity.x) > 1 || this.aiState === 'walking') {
        targetAnimation = 'walk';
        this.facing = this.velocity.x > 0 ? 1 : -1;
      } else {
        targetAnimation = 'idle';
      }
      
      // CRITICAL: Force firewall animation state
      const targetFullAnim = targetAnimation === 'walk' ? 'firewall_walk_walk' : 
                              targetAnimation === 'attack' ? 'firewall_attack_default' : 'firewall_idle_idle';
      
      if (!currentAnim || !currentAnim.includes(targetAnimation)) {
        this.playAnimation(targetAnimation);
        this.currentAnimation = targetFullAnim;
        console.log(`🔥 Firewall forcing ${targetAnimation} animation to play`);
        
        // Set animation timer for attacks
        if (targetAnimation === 'attack') {
          this.attackAnimationPlaying = true;
          this.attackAnimationTimer = this.attackAnimationDuration;
        }
      }
    }
  }
  
  // Helper method to get full animation name
  getFullAnimationName(animationName) {
    let animationMap = {};
    
    if (this.type === 'virus') {
      animationMap = {
        'idle': 'virus_idle_idle'
      };
    } else if (this.type === 'corrupted') {
      animationMap = {
        'idle': 'corrupted_idle_idle',
        'walk': 'corrupted_walk_walk'
      };
    } else if (this.type === 'firewall') {
      animationMap = {
        'idle': 'firewall_idle_idle',
        'walk': 'firewall_walk_walk',
        'attack': 'firewall_attack_default'
      };
    }
    
    return animationMap[animationName] || animationName;
  }
  
  // Play a specific animation
  playAnimation(animationName) {
    if (!this.spriteReady || !this.sprite) {
      // Silently handle fallback mode without excessive logging
      if (!window.useFallbackGraphics) {
        console.log(`❌ Cannot play animation ${animationName}: ${this.type} sprite not ready`);
      }
      return;
    }
    
    try {
      // Map animation names to character animations
      let animationMap = {};
      
      if (this.type === 'virus') {
        animationMap = {
          'idle': 'virus_idle_idle'
        };
      } else if (this.type === 'corrupted') {
        animationMap = {
          'idle': 'corrupted_idle_idle',
          'walk': 'corrupted_walk_walk'
        };
      } else if (this.type === 'firewall') {
        animationMap = {
          'idle': 'firewall_idle_idle',
          'walk': 'firewall_walk_walk',
          'attack': 'firewall_attack_default'
        };
      }
      
      const fullAnimationName = animationMap[animationName] || animationName;
      
      // Avoid restarting the same animation (except idle which should be safe to restart)
      const currentSpriteAnim = this.sprite.getCurrentAnimation();
      if (currentSpriteAnim === fullAnimationName && animationName !== 'idle') {
        return;
      }
      
      console.log(`👾 PLAYING: ${fullAnimationName} for ${this.type} enemy`);
      
      // Determine if animation should loop (attack animations should not loop)
      const shouldLoop = !fullAnimationName.includes('attack');
      
      // Play the animation with appropriate looping
      let animRef;
      try {
        // Speed up attack animations by 20%, idle animations by 25%
        let playbackSpeed = 1.0;
        if (fullAnimationName.includes('attack')) {
          playbackSpeed = 1.2;
        } else if (fullAnimationName.includes('idle')) {
          playbackSpeed = 1.25; // 25% faster idle animation
        }
        const animOptions = shouldLoop ? { speed: playbackSpeed } : { speed: playbackSpeed };
        animRef = this.sprite.play(fullAnimationName, shouldLoop, 0, animOptions);
        this.currentAnimation = fullAnimationName;
        this._currentAnimationRef = animRef; // Store reference for completion tracking
        console.log(`✅ Successfully started ${this.type} animation: ${fullAnimationName} (loop: ${shouldLoop})`);
      } catch (playError) {
        console.error(`Error playing ${this.type} animation ${fullAnimationName}:`, playError?.message || playError);
        return;
      }
      
      // Set up completion callback for attack animations
      if (!shouldLoop && animRef && typeof animRef.onComplete === 'function') {
        animRef.onComplete(() => {
          console.log(`🔥 Attack animation completed for ${this.type} enemy`);
          // Reset attack state when animation completes
          if (this.type === 'firewall') {
            console.log('🔥 Firewall attack animation completed - returning to idle');
            this.attackAnimationPlaying = false;
            this.shieldActive = false;
            this.preparingAttack = false;
            this.attackAnimationTimer = 0;
            // CRITICAL: Force immediate return to idle animation
            this.playAnimation('idle');
          }
        });
      }
      
    } catch (error) {
      console.error(`Error playing ${this.type} animation:`, error?.message || error);
    }
  }
  
  // Get current animation reference for completion tracking
  getCurrentAnimationReference() {
    return this._currentAnimationRef || null;
  }
  
  // Draw sprite-based enemy
  drawSprite(ctx) {
    ctx.save();
    
    // Draw sprite with proper positioning and orientation
    // Position is the anchor point (character's feet)
    let drawY = this.position.y - 1 + 70; // Default offset for virus (lowered 30px) - RAISED 20px
    let spriteScale = 0.8; // Default scale for virus
    
    // Adjust positioning and scale for different character types
    if (this.type === 'corrupted') {
      drawY = this.position.y - 1 + 60; // Corrupted enemy positioning
      spriteScale = 1.2; // Larger scale for corrupted
    } else if (this.type === 'firewall') {
      drawY = this.position.y - 1 + 100 - 100; // Firewall offset raised 100px (higher on screen)
      spriteScale = 2.0; // Double the size (200% scale)
      
      // Make idle animation bigger and raise 4px
      if (this.currentAnimation === 'firewall_idle_idle') {
        spriteScale = 2.0 * 1.13; // Apply double size + idle boost
        drawY = this.position.y - 1 + 100 - 100 - 14; // Raise 14px more for idle (4px higher than before)
      }
      
      // Make walk animation bigger and lower 4px
      if (this.currentAnimation === 'firewall_walk_walk') {
        spriteScale = 2.0; // Apply double size to walk
        drawY = this.position.y - 1 + 100 - 100 + 4; // Lower 4px from base position
      }
      
      // Make attack animation bigger - LOWERED BY 5px TOWARD GROUND
      if (this.currentAnimation === 'firewall_attack_default') {
        spriteScale = 2.0 * 1.36; // Increased from 1.28 to 1.36 (8px bigger total)
        drawY = this.position.y - 1 + 100 - 100 - 26; // Lowered 5px toward ground (moved DOWN 5px from -31 to -26)
      }
    }
    
    // Handle directional flipping
    const shouldFlip = this.facing === -1; // Flip when facing left
    
    // Adjust sprite position for firewall
    let spriteDrawX = this.position.x;
    if (this.type === 'firewall') {
      // No offset - use normal position
      spriteDrawX = this.position.x;
    }
    
    // Draw sprite with appropriate scale and flipping
    this.sprite.draw(ctx, spriteDrawX, drawY, {
      scale: spriteScale,
      flipH: shouldFlip,
      flipV: false,
      alpha: 1.0,
      debug: false // Set to true to see hitbox/anchor
    });
    
    ctx.restore();
  }
};

// Enemy Manager
window.EnemyManager = class EnemyManager {
  constructor() {
    this.enemies = [];
    this.minEnemies = 2; // Minimum enemies on screen
    this.maxEnemies = 12; // Maximum enemies on screen - INCREASED from 5 to 12
    this.spawnTimer = 0;
    this.nextSpawnTime = this.getRandomSpawnTime(); // Random spawn interval
    this.defeatedCount = 0;
    this.disabledUntil = 0;
    
    // Enhanced spawning system
    this.spawnLocations = this.generateSpawnLocations();
    this.lastSpawnPosition = null;
    this.spawnAvoidanceRadius = 150; // Avoid spawning within 150px of last spawn
    
    // ENHANCED SPAWN REGULATION SYSTEM
    this.lastFirewallSpawnTime = 0;
    this.firewallSpawnCooldown = 3000; // 3 seconds between firewall spawns (reduced from 8000)
    this.activeFirewallCount = 0;
    
    // Spawn flow regulation
    this.spawnFlowState = 'building'; // 'building', 'peak', 'sustaining', 'recovery'
    this.flowTimer = 0;
    this.enemySpawnWaves = 0; // Track waves for intensity scaling
    this.baseSpawnRate = 1.0; // Multiplier for spawn frequency
    this.difficultyScaling = 1.0;
    
    // Enemy timing coordination
    this.lastSpawnTime = 0;
    this.spawnInterval = 3000; // Base interval between spawns
    this.consecutiveSpawns = 0;
    this.maxConsecutiveSpawns = 2; // Prevent too many at once
    
    // Spawn position coordination
    this.spawnZones = ['left', 'right', 'both'];
    this.currentSpawnZone = 'right';
    this.zoneRotationTimer = 0;
    this.zoneRotationInterval = 15000; // Rotate spawn zones every 15 seconds
    
    // Enemy type coordination
    this.enemyTypePattern = [];
    this.patternIndex = 0;
    this.generateEnemyPattern();
  }

  update(deltaTime, player) {
    try {
      const previousActiveCount = this.getActiveEnemies().length;
      const previousDefeated = this.defeatedCount;
      
      // Update spawn flow regulation
      this.updateSpawnFlow(deltaTime);
      
      // Update spawn zone rotation
      this.updateSpawnZones(deltaTime);
      
      // Check if tutorial is pausing enemies during combat tutorial
      const tutorial = window.tutorialSystem;
      const tutorialWaiting = tutorial && 
        tutorial.isActive() && 
        tutorial.storyChapter === 1 &&
        tutorial.combatEnemiesPaused === true;
      
      // DEBUG: Log tutorial state for virus debugging
      if (Date.now() % 3000 < 100) {
        console.log(`ENEMY MANAGER: tutorialActive=${tutorial?.isActive?.()}, chapter=${tutorial?.storyChapter}, combatPaused=${tutorial?.combatEnemiesPaused}, tutorialWaiting=${tutorialWaiting}`);
      }
      
      // Debug: Simplified logging to avoid circular reference errors
      if (Date.now() % 5000 < 100) { // Log every 5 seconds
        console.log('Enemy update - tutorialActive:', tutorial?.isActive?.(), 'chapter:', tutorial?.storyChapter, 'shouldUpdate:', !tutorialWaiting);
      }
    
    // ROOT CAUSE FIX: Completely separate virus handling to prevent freezing
    // Update ALL enemies normally first
    this.enemies.forEach(enemy => {
      // DEBUG: Log virus enemy state for debugging
      if (enemy.type === 'virus' && Date.now() % 2000 < 100) {
        console.log(`VIRUS UPDATE CHECK: type=${enemy.type}, state=${enemy.state}, entranceComplete=${enemy.entranceComplete}, active=${enemy.active}`);
      }
      
      // ALWAYS call enemy.update() - never skip updates completely
      // The update() method will handle tutorial freezing internally
      enemy.update(deltaTime, player);
      
      // POST-UPDATE: If tutorial is pausing, force virus to patrol state to prevent freezing
      if (enemy.type === 'virus' && tutorialWaiting && enemy.active) {
        // Force virus back to patrol state if it gets stuck
        if (enemy.state !== 'patrol') {
          console.log(`🔧 FORCE RECOVERY: Virus state reset from ${enemy.state} to patrol`);
          enemy.state = 'patrol';
          enemy.stateTimer = 0;
          enemy.target = null;
        }
        
        // Ensure virus is properly positioned on ground
        if (enemy.position.y > 750) {
          enemy.position.y = 750;
          enemy.velocity.y = 0;
        }
        
        // Minimal movement during pause to keep system alive
        enemy.velocity.x = Math.sin(Date.now() / 1000 + enemy.phaseOffset) * 10;
      }
      
      // SIMPLIFIED: No manager emergency checks - float/drop system handles everything
    });
    
    // Enhanced enemy-to-enemy interactions
    this.checkEnemyCollisions();
    this.updateEnemyBehaviors(player);
    
    // Check for newly defeated enemies and track defeats
    const currentActiveCount = this.getActiveEnemies().length;
    const newlyDefeated = this.enemies.filter(enemy => !enemy.active && enemy.health <= 0);
    if (newlyDefeated.length > 0) {
      const justDefeated = newlyDefeated.length;
      this.defeatedCount += justDefeated;
      
      // Track defeats for main game progress
      if (!window.tutorialSystem || typeof window.tutorialSystem.isActive !== 'function' || !window.tutorialSystem.isActive()) {
        window.gameState.enemiesDefeated = this.defeatedCount;
        
        // CRITICAL FIX: Always notify Sector 1 progression system of individual enemy defeats
        if (window.sector1Progression && typeof window.sector1Progression.onEnemyDefeated === 'function') {
          // Call onEnemyDefeated for EACH enemy that was just defeated
          newlyDefeated.forEach(() => {
            window.sector1Progression.onEnemyDefeated();
          });
          
          // CRITICAL: Immediately check jammer conditions after enemy defeat
          if (window.sector1Progression.enemiesDefeated >= window.sector1Progression.requiredEnemyKills && !window.sector1Progression.jammerRevealed) {
            console.log(`🚨 AUTO-TRIGGER: Enemy count reached ${window.sector1Progression.enemiesDefeated}/${window.sector1Progression.requiredEnemyKills} - forcing jammer reveal NOW!`);
            window.sector1Progression.revealJammer();
          }
        }
      }
      
      console.log(`Defeated ${justDefeated} enemies. Total: ${this.defeatedCount}/3`);
      console.log('Tutorial system exists:', !!tutorial);
      const tutorialActive = tutorial && typeof tutorial.isActive === 'function' && tutorial.isActive();
      console.log('Tutorial active:', tutorialActive);
      console.log('Combat objective completed:', tutorial?.completedObjectives?.has('combat'));
      
      // Complete tutorial objective when 3 defeated
      if (this.defeatedCount >= 3) {
        console.log('Combat objective complete! Triggering tutorial...');
        if (tutorial && tutorial.isActive()) {
          console.log('Calling tutorial.checkObjective...');
          tutorial.checkObjective('combat');
        } else {
          console.log('Tutorial not active or missing!');
        }
      }
    }
    
      // Clean up inactive enemies and update firewall count
      const beforeCount = this.enemies.length;
      this.enemies = this.enemies.filter(enemy => enemy.active);
      
      // Update firewall count if any firewalls were removed
      const afterCount = this.enemies.length;
      if (beforeCount !== afterCount) {
        // Recount active firewalls
        this.activeFirewallCount = this.enemies.filter(e => e.active && e.type === 'firewall').length;
        if (this.activeFirewallCount < 3) {
          console.log(`Firewall count updated to ${this.activeFirewallCount} after cleanup`);
        }
      }
      
      // Enhanced dynamic spawning system - more aggressive spawning for better gameplay
      const isMainGame = !tutorial || typeof tutorial.isActive !== 'function' || !tutorial.isActive();
      const isTutorialCompleted = tutorial && typeof tutorial.isCompleted === 'function' && tutorial.isCompleted();
      const activeEnemies = this.getActiveEnemies().length;
      
      // ENHANCED SPAWN SYSTEM: Flow-regulated spawning
      if ((isMainGame || isTutorialCompleted) && this.shouldSpawnEnemy(activeEnemies)) {
        this.spawnTimer += deltaTime;
        const adjustedSpawnTime = this.nextSpawnTime / this.baseSpawnRate;
        
        if (this.spawnTimer >= adjustedSpawnTime) {
          console.log(`Flow spawning enemy - state: ${this.spawnFlowState}, wave: ${this.enemySpawnWaves}, active: ${activeEnemies}`);
          this.spawnFlowEnemy(player);
          this.spawnTimer = 0;
          this.nextSpawnTime = this.getFlowSpawnTime();
        }
      }
    } catch (error) {
      console.error('Error in enemy manager update:', error?.message || error);
    }
  }

  spawnEnemy() {
    const types = ['virus', 'corrupted', 'firewall'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    console.log(`Spawning ${type} enemy with MakkoEngine sprite support`);
    
    // Find valid spawn position away from existing enemies AND player
    let x, y, attempts = 0;
    const minDistance = 200; // Keep enemies apart
    const playerSafeDistance = 300; // Keep away from player
    
    do {
      // Spawn at random position on screen edges with player avoidance
      const side = Math.floor(Math.random() * 4);
      const playerY = player?.position?.y || 750;
      const spawnPlayerX = player?.position?.x || 960;
      
      switch(side) {
        case 0: // Top - NEVER spawn above player
          // Always force to bottom - never spawn from top when player exists
          x = window.randomRange(200, 3896);
          y = 910; // Always bottom
          break;
        case 1: // Right - Don't spawn above player
          x = 3996;
          y = window.randomRange(Math.max(playerY, 750), 850); // Never above player
          break;
        case 2: // Bottom - Safe zone
          x = window.randomRange(200, 3896);
          y = 910;
          break;
        case 3: // Left - Don't spawn above player
          x = 100;
          y = window.randomRange(Math.max(playerY, 750), 850); // Never above player
          break;
      }
      
      // Additional safety check: ensure not spawning too close to player horizontally
      if (Math.abs(x - spawnPlayerX) < playerSafeDistance) {
        // Adjust X position away from player
        if (x < spawnPlayerX) {
          x = Math.max(50, spawnPlayerX - playerSafeDistance - 100);
        } else {
          x = Math.min(4046, spawnPlayerX + playerSafeDistance + 100);
        }
      }
      
      attempts++;
    } while (attempts < 15 && (this.isTooCloseToExistingEnemies(x, y, minDistance) || this.isTooCloseToPlayer(x, y, player)));
    
    this.enemies.push(new window.Enemy(x, y, type));
  }
  
  isTooCloseToExistingEnemies(x, y, minDistance) {
    return this.enemies.some(enemy => {
      const dist = window.distance(x, y, enemy.position.x, enemy.position.y);
      return dist < minDistance;
    });
  }
  
  isTooCloseToPlayer(x, y, player) {
    const distToPlayer = window.distance(x, y, player.position.x, player.position.y);
    // Don't spawn above player at all
    const abovePlayer = y < player.position.y;
    // Don't spawn too close horizontally
    const tooCloseHorizontally = Math.abs(x - player.position.x) < 250;
    return distToPlayer < 300 || abovePlayer || tooCloseHorizontally;
  }

  // Comprehensive enemy-to-enemy collision detection - prevents all pass-through scenarios
  checkEnemyCollisions() {
    try {
      const activeEnemies = this.enemies.filter(enemy => enemy.active);
      const currentTime = Date.now();
      
      // Clean up old collision records
      activeEnemies.forEach(enemy => {
        if (currentTime - enemy.lastCollisionTime > 300) {
          enemy.recentlyCollidedWith.clear();
        }
      });
      
      // Check all unique enemy pairs for collisions
      for (let i = 0; i < activeEnemies.length; i++) {
        for (let j = i + 1; j < activeEnemies.length; j++) {
          const enemy1 = activeEnemies[i];
          const enemy2 = activeEnemies[j];
          
          // Skip if recently collided (prevents jittering)
          const enemy1Id = `${enemy1.type}_${Math.floor(enemy1.movementSeed)}`;
          const enemy2Id = `${enemy2.type}_${Math.floor(enemy2.movementSeed)}`;
          
          if (enemy1.recentlyCollidedWith.has(enemy2Id) || enemy2.recentlyCollidedWith.has(enemy1Id)) {
            continue;
          }
          
          // Get precise hitboxes for accurate collision detection
          const hitbox1 = enemy1.getHitbox();
          const hitbox2 = enemy2.getHitbox();
          
          // Check current distance between enemy centers
          const centerDist = window.distance(
            enemy1.position.x, enemy1.position.y,
            enemy2.position.x, enemy2.position.y
          );
          
          // Calculate required separation distance based on enemy types
          const requiredSeparation = this.getRequiredSeparation(enemy1.type, enemy2.type, hitbox1, hitbox2);
          
          // FIREWALL HIT BEHAVIOR: Firewall hits virus enemies but corrupted PASS THROUGH
          let isFirewallVirusCollision = false;
          let isFirewallCorruptedCollision = false;
          
          if (enemy1.type === 'firewall' && enemy2.type === 'virus') {
            isFirewallVirusCollision = true;
          } else if (enemy2.type === 'firewall' && enemy1.type === 'virus') {
            isFirewallVirusCollision = true;
          } else if (enemy1.type === 'firewall' && enemy2.type === 'corrupted') {
            isFirewallCorruptedCollision = true;
          } else if (enemy2.type === 'firewall' && enemy1.type === 'corrupted') {
            isFirewallCorruptedCollision = true;
          }
          
          if (isFirewallCorruptedCollision) {
            // CORRUPTED ENEMIES ALWAYS PASS THROUGH FIREWALLS - NO COLLISION EFFECTS
            console.log(`🔥 Corrupted enemy passing through firewall - no collision applied`);
            
            // Apply gentle pass-through assist to ensure corrupted doesn't get stuck
            const corrupted = enemy1.type === 'corrupted' ? enemy1 : enemy2;
            const firewall = enemy1.type === 'firewall' ? enemy1 : enemy2;
            
            // Only assist if corrupted seems stuck (very low velocity)
            if (Math.abs(corrupted.velocity.x) < 50) {
              const dx = corrupted.position.x - firewall.position.x;
              const dy = corrupted.position.y - firewall.position.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              if (dist > 0) {
                // Give corrupted gentle push through firewall
                const assistForce = 300;
                corrupted.velocity.x = (dx / dist) * assistForce;
                corrupted.velocity.y = (dy / dist) * assistForce * 0.2;
                
                console.log(`🔥 Assisting corrupted through firewall (low velocity detected)`);
              }
            }
            
          } else if (isFirewallVirusCollision) {
            // VIRUS enemies get hit by firewall (normal collision behavior)
            const firewall = enemy1.type === 'firewall' ? enemy1 : enemy2;
            const virus = enemy1.type === 'firewall' ? enemy2 : enemy1;
            
            // Calculate knockback direction from firewall to virus
            const knockbackDirX = virus.position.x - firewall.position.x;
            const knockbackDirY = virus.position.y - firewall.position.y;
            const knockbackDist = Math.sqrt(knockbackDirX * knockbackDirX + knockbackDirY * knockbackDirY);
            
            // Only hit if very close
            if (knockbackDist > 0 && knockbackDist < 80) {
              const knockbackForce = 200;
              const knockbackX = (knockbackDirX / knockbackDist) * knockbackForce;
              const knockbackY = (knockbackDirY / knockbackDist) * knockbackForce * 0.2;
              
              virus.velocity.x = knockbackX;
              virus.velocity.y = knockbackY - 80;
              virus.position.x += knockbackX * 0.05;
              virus.position.y += knockbackY * 0.05 - 10;
              
              // Visual effect
              if (window.particleSystem) {
                window.particleSystem.impact(
                  virus.position.x, 
                  virus.position.y, 
                  virus.color, 
                  3
                );
              }
              
              console.log(`🔥 Firewall hit virus (${knockbackDist.toFixed(1)}px)!`);
            }
          } else {
            // Regular collision handling
            if (this.simpleAABBcollision(hitbox1, hitbox2)) {
              // Enemies are overlapping - strong separation
              this.applyStrongSeparation(enemy1, enemy2);
              
              // Record collision
              enemy1.lastCollisionTime = currentTime;
              enemy2.lastCollisionTime = currentTime;
              enemy1.recentlyCollidedWith.add(enemy2Id);
              enemy2.recentlyCollidedWith.add(enemy1Id);
              
            } else if (centerDist < requiredSeparation) {
              // Enemies too close - preventive separation
              this.applyGentleSeparation(enemy1, enemy2, centerDist, requiredSeparation);
              
              // Record proximity check with shorter cooldown
              enemy1.lastCollisionTime = currentTime - 100;
              enemy2.lastCollisionTime = currentTime - 100;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking enemy collisions:', error?.message || error);
    }
  }
  
  // Get required separation distance based on enemy type combination
  getRequiredSeparation(type1, type2, hitbox1, hitbox2) {
    // CRITICAL FIX: Corrupted enemies should ALWAYS be able to pass through firewall enemies
    const isCorruptedFirewallCombo = 
      (type1 === 'corrupted' && type2 === 'firewall') ||
      (type1 === 'firewall' && type2 === 'corrupted');
    
    if (isCorruptedFirewallCombo) {
      return -50; // NEGATIVE separation: actively force corrupted to pass through firewall
    }
    
    // Base separation: half sum of hitbox dimensions + buffer
    let baseSeparation = (hitbox1.width + hitbox2.width) / 2 + 15;
    
    // Type-specific adjustments
    const typeCombo = `${type1}_${type2}`;
    
    switch(typeCombo) {
      case 'virus_virus':
        return baseSeparation + 10; // Virus-virus need space to jump
      case 'virus_corrupted':
      case 'corrupted_virus':
        return baseSeparation + 15; // Mixed types need moderate space
      case 'virus_firewall':
      case 'firewall_virus':
        return baseSeparation + 25; // Virus needs space from big firewall
      case 'corrupted_corrupted':
        return baseSeparation + 12; // Corrupted need space for teleports
      case 'firewall_firewall':
        return baseSeparation + 30; // Firewalls need most space (but only 1 spawns)
      default:
        return baseSeparation;
    }
  }
  
  // Apply strong separation for overlapping enemies - FIXED for corrupted-firewall interactions
  applyStrongSeparation(enemy1, enemy2) {
    // CRITICAL FIX: Corrupted enemies should ALWAYS pass through firewall enemies
    const isCorruptedFirewallInteraction = 
      (enemy1.type === 'corrupted' && enemy2.type === 'firewall') ||
      (enemy1.type === 'firewall' && enemy2.type === 'corrupted');
    
    if (isCorruptedFirewallInteraction) {
      // ALWAYS make corrupted pass through firewall regardless of situation
      const corrupted = enemy1.type === 'corrupted' ? enemy1 : enemy2;
      const firewall = enemy1.type === 'firewall' ? enemy1 : enemy2;
      
      // Calculate direction from firewall to corrupted
      const dx = corrupted.position.x - firewall.position.x;
      const dy = corrupted.position.y - firewall.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        // ALWAYS push corrupted completely through firewall to the other side
        const totalPushDistance = firewall.width + corrupted.width + 20; // Ensure complete passage
        const pushX = (dx / dist) * totalPushDistance;
        const pushY = (dy / dist) * totalPushDistance * 0.2; // Minimal vertical push
        
        // IMMEDIATE: Force corrupted position to opposite side of firewall
        corrupted.position.x = firewall.position.x + pushX;
        corrupted.position.y = firewall.position.y + pushY;
        
        // VELOCITY: Give corrupted strong momentum away from firewall
        const escapeForce = 800; // Very strong escape force
        corrupted.velocity.x = (dx / dist) * escapeForce;
        corrupted.velocity.y = (dy / dist) * escapeForce * 0.3;
        
        // ENSURE: Always give corrupted minimum horizontal velocity to prevent sticking
        if (Math.abs(corrupted.velocity.x) < 200) {
          const escapeDirection = corrupted.position.x > firewall.position.x ? 1 : -1;
          corrupted.velocity.x = escapeDirection * 300;
        }
        
        console.log(`🔥 CORRUPTED PASS-THROUGH: Forced through firewall (distance: ${dist.toFixed(1)}px)`);
      }
      
      return; // Skip all normal collision logic for corrupted-firewall
    }
    const dx = enemy2.position.x - enemy1.position.x;
    const dy = enemy2.position.y - enemy1.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) {
      // Enemies at exact same position - emergency separation
      const angle = Math.random() * Math.PI * 2;
      const separationForce = 50;
      
      enemy1.position.x -= Math.cos(angle) * separationForce;
      enemy1.position.y -= Math.sin(angle) * separationForce * 0.3;
      enemy2.position.x += Math.cos(angle) * separationForce;
      enemy2.position.y += Math.sin(angle) * separationForce * 0.3;
      
      // Set opposite velocities
      enemy1.velocity.x = -Math.cos(angle) * separationForce;
      enemy1.velocity.y = -Math.sin(angle) * separationForce * 0.5;
      enemy2.velocity.x = Math.cos(angle) * separationForce;
      enemy2.velocity.y = Math.sin(angle) * separationForce * 0.5;
      
      return;
    }
    
    // Get required separation for this enemy type combination
    const hitbox1 = enemy1.getHitbox();
    const hitbox2 = enemy2.getHitbox();
    const requiredSeparation = this.getRequiredSeparation(enemy1.type, enemy2.type, hitbox1, hitbox2);
    
    if (dist < requiredSeparation) {
      const pushForce = (requiredSeparation - dist) * 0.8; // Strong force
      const pushX = (dx / dist) * pushForce;
      const pushY = (dy / dist) * pushForce;
      
      // Apply position correction
      enemy1.position.x -= pushX;
      enemy1.position.y -= pushY * 0.4;
      enemy2.position.x += pushX;
      enemy2.position.y += pushY * 0.4;
      
      // Apply velocity correction
      const velocityMultiplier = Math.min(1.0, pushForce / 30); // Cap velocity change
      
      enemy1.velocity.x -= pushX * velocityMultiplier * 0.3;
      enemy1.velocity.y -= pushY * velocityMultiplier * 0.1;
      enemy2.velocity.x += pushX * velocityMultiplier * 0.3;
      enemy2.velocity.y += pushY * velocityMultiplier * 0.1;
      
      // Stop enemies from moving toward each other
      if (Math.sign(enemy1.velocity.x) === Math.sign(dx)) {
        enemy1.velocity.x *= 0.3;
      }
      if (Math.sign(enemy2.velocity.x) === Math.sign(-dx)) {
        enemy2.velocity.x *= 0.3;
      }
    }
  }
  
  // Apply gentle separation for enemies that are too close
  applyGentleSeparation(enemy1, enemy2, currentDist, requiredDist) {
    const dx = enemy2.position.x - enemy1.position.x;
    const dy = enemy2.position.y - enemy1.position.y;
    
    if (currentDist === 0) return;
    
    const pushForce = (requiredDist - currentDist) * 0.3; // Gentle force
    const pushX = (dx / currentDist) * pushForce;
    const pushY = (dy / currentDist) * pushForce;
    
    // Apply gentle position adjustment
    enemy1.position.x -= pushX * 0.5;
    enemy1.position.y -= pushY * 0.2;
    enemy2.position.x += pushX * 0.5;
    enemy2.position.y += pushY * 0.2;
    
    // Apply gentle velocity adjustment
    enemy1.velocity.x -= pushX * 0.1;
    enemy1.velocity.y -= pushY * 0.05;
    enemy2.velocity.x += pushX * 0.1;
    enemy2.velocity.y += pushY * 0.05;
  }
  
  // Enhanced enemy separation - prevents overlapping and walking behind each other
  simpleSeparation(enemy1, enemy2) {
    const dx = enemy2.position.x - enemy1.position.x;
    const dy = enemy2.position.y - enemy1.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Get each enemy's actual hitbox to determine minimum separation distance
    const hitbox1 = enemy1.getHitbox();
    const hitbox2 = enemy2.getHitbox();
    
    // Calculate minimum distance needed to prevent hitbox overlap
    const minSeparationX = (hitbox1.width + hitbox2.width) / 2 + 10; // 10px buffer
    const minSeparationY = (hitbox1.height + hitbox2.height) / 2 + 5; // 5px vertical buffer
    const minSeparation = Math.max(minSeparationX, minSeparationY, 60); // Minimum 60px separation
    
    if (dist < minSeparation && dist > 0) {
      // Stronger separation force when enemies are too close
      const pushForce = (minSeparation - dist) * 0.5; // Increased from 0.3 to 0.5
      const pushX = (dx / dist) * pushForce;
      const pushY = (dy / dist) * pushForce;
      
      // Position adjustment - prevent enemies from occupying same space
      enemy1.position.x -= pushX;
      enemy1.position.y -= pushY * 0.3; // Slight vertical adjustment
      enemy2.position.x += pushX;
      enemy2.position.y += pushY * 0.3;
      
      // Velocity adjustment - prevent enemies from moving toward each other
      enemy1.velocity.x -= pushX * 0.1; // Increased from 0.05
      enemy1.velocity.y -= pushY * 0.03; // Slight vertical dampening
      enemy2.velocity.x += pushX * 0.1;
      enemy2.velocity.y += pushY * 0.03;
      
      // If enemies are overlapping significantly, apply stronger separation
      if (dist < minSeparation * 0.5) {
        const emergencyForce = (minSeparation * 0.5 - dist) * 0.8;
        const emergencyX = (dx / dist) * emergencyForce;
        const emergencyY = (dy / dist) * emergencyForce;
        
        enemy1.position.x -= emergencyX;
        enemy1.position.y -= emergencyY * 0.5;
        enemy2.position.x += emergencyX;
        enemy2.position.y += emergencyY * 0.5;
        
        // Stop enemies from moving toward each other
        if (Math.sign(enemy1.velocity.x) === Math.sign(dx)) {
          enemy1.velocity.x *= 0.2;
        }
        if (Math.sign(enemy2.velocity.x) === Math.sign(-dx)) {
          enemy2.velocity.x *= 0.2;
        }
      }
    }
  }
  
  // Enhanced enemy separation to prevent passing through (for extreme cases only)
  separateEnemies(enemy1, enemy2) {
    // Calculate centers
    const center1x = enemy1.position.x;
    const center1y = enemy1.position.y - enemy1.height / 2;
    const center2x = enemy2.position.x;
    const center2y = enemy2.position.y - enemy2.height / 2;
    
    // Calculate direction vector
    const dx = center2x - center1x;
    const dy = center2y - center1y;
    const separationDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (separationDistance === 0) {
      // Enemies at exact same position - gentle separation
      const pushAngle1 = Math.random() * Math.PI * 2;
      const pushAngle2 = pushAngle1 + Math.PI;
      const pushForce = 25; // Reduced force
      
      enemy1.velocity.x = Math.cos(pushAngle1) * pushForce;
      enemy1.velocity.y = Math.sin(pushAngle1) * pushForce * 0.3 - 50; // Reduced jump
      enemy2.velocity.x = Math.cos(pushAngle2) * pushForce;
      enemy2.velocity.y = Math.sin(pushAngle2) * pushForce * 0.3 - 50;
      
      // Immediate position separation
      enemy1.position.x += Math.cos(pushAngle1) * 20;
      enemy1.position.y += Math.sin(pushAngle1) * 10;
      enemy2.position.x += Math.cos(pushAngle2) * 20;
      enemy2.position.y += Math.sin(pushAngle2) * 10;
      return;
    }
    
    // Normalize direction
    const normalX = dx / separationDistance;
    const normalY = dy / separationDistance;
    
    // Minimal separation - just enough to prevent overlap
    const combinedWidth = (enemy1.width + enemy2.width) / 2;
    const minSeparation = combinedWidth * 0.6; // Reduced buffer
    
    if (separationDistance < minSeparation) {
      const overlapAmount = minSeparation - separationDistance;
      
      // Very gentle separation force
      const forceMultiplier = 0.3; // Much gentler
      const separationForce = overlapAmount * forceMultiplier;
      
      // Get enemy masses for realistic physics
      const mass1 = this.getEnemyMass(enemy1.type);
      const mass2 = this.getEnemyMass(enemy2.type);
      const totalMass = mass1 + mass2;
      const massRatio1 = mass2 / totalMass;
      const massRatio2 = mass1 / totalMass;
      
      // Gentle position-based separation
      const positionForce = Math.min(overlapAmount * 0.4, 30);
      enemy1.position.x -= normalX * positionForce * massRatio1;
      enemy1.position.y -= normalY * positionForce * massRatio1 * 0.2;
      enemy2.position.x += normalX * positionForce * massRatio2;
      enemy2.position.y += normalY * positionForce * massRatio2 * 0.2;
      
      // Very gentle velocity-based separation
      enemy1.velocity.x -= normalX * separationForce * massRatio1 * 0.5;
      enemy1.velocity.y -= normalY * separationForce * massRatio1 * 0.1;
      enemy2.velocity.x += normalX * separationForce * massRatio2 * 0.5;
      enemy2.velocity.y += normalY * separationForce * massRatio2 * 0.1;
      
      // No particle effects or aggressive behaviors - just gentle separation
    }
  }
  
  // Gentle separation for performance optimization (many enemies)
  gentleSeparation(enemy1, enemy2) {
    const dx = enemy2.position.x - enemy1.position.x;
    const dy = enemy2.position.y - enemy1.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 80 && dist > 0) {
      const pushForce = (80 - dist) * 0.2; // Much gentler push
      const pushX = (dx / dist) * pushForce;
      const pushY = (dy / dist) * pushForce;
      
      enemy1.position.x -= pushX;
      enemy1.position.y -= pushY * 0.2; // Minimal vertical adjustment
      enemy2.position.x += pushX;
      enemy2.position.y += pushY * 0.2;
      
      // Very gentle velocity adjustment
      enemy1.velocity.x -= pushX * 0.05;
      enemy1.velocity.y -= pushY * 0.02;
      enemy2.velocity.x += pushX * 0.05;
      enemy2.velocity.y += pushY * 0.02;
    }
  }
  
  // Handle special enemy-to-enemy interactions - DISABLED aggressive behaviors
  handleSpecialInteractions(enemy1, enemy2, normalX, normalY) {
    // DISABLED: Remove all aggressive enemy-to-enemy interactions
    // Enemies should focus on the player, not fight each other
    
    // Only minimal shield activation for firewalls, no aggressive behaviors
    if (enemy1.type === 'firewall' || enemy2.type === 'firewall') {
      const firewall = enemy1.type === 'firewall' ? enemy1 : enemy2;
      
      // Very brief shield activation only
      if (Math.random() > 0.8) { // Rarely
        firewall.shieldActive = true;
        setTimeout(() => {
          if (firewall && firewall.active) {
            firewall.shieldActive = false;
          }
        }, 100); // Very brief
      }
    }
    
    // No virus scattering, no corrupted dodging, no repulsion fields
    // Enemies should peacefully coexist and focus on the player
  }
  
  // Get collision particle color based on enemy types
  getCollisionColor(type1, type2) {
    if (type1 === 'firewall' || type2 === 'firewall') return '#ff9900';
    if (type1 === 'virus' && type2 === 'virus') return '#00ccff';
    if (type1 === 'corrupted' || type2 === 'corrupted') return '#ff9900';
    return '#ff9900'; // Default
  }
  
  // Get enemy mass for physics calculations
  getEnemyMass(type) {
    switch(type) {
      case 'virus': return 1.0;     // Light
      case 'corrupted': return 2.0;  // Heavy
      case 'firewall': return 3.0;    // Heaviest
      default: return 1.0;
    }
  }
  
  // Generate random spawn locations around screen
  generateSpawnLocations() {
    const locations = [];
    
    // Top edge positions (spread across wider world)
    for (let i = 0; i < 8; i++) {
      locations.push({ x: 200 + i * 460, y: 50, edge: 'top' });
    }
    
    // Bottom edge positions (spread across wider world)
    for (let i = 0; i < 8; i++) {
      locations.push({ x: 200 + i * 460, y: 910, edge: 'bottom' });
    }
    
    // Left edge positions
    for (let i = 0; i < 4; i++) {
      locations.push({ x: 50, y: 200 + i * 150, edge: 'left' });
    }
    
    // Right edge positions (at world edge)
    for (let i = 0; i < 4; i++) {
      locations.push({ x: 4046, y: 200 + i * 150, edge: 'right' });
    }
    
    return locations;
  }
  
  // Get random spawn time between 1-3 seconds
  getRandomSpawnTime() {
    return 1000 + Math.random() * 2000; // 1000-3000ms
  }
  
  // ENHANCED SPAWN FLOW REGULATION METHODS
  
  // Update spawn flow state based on gameplay
  updateSpawnFlow(deltaTime) {
    this.flowTimer += deltaTime;
    const activeCount = this.getActiveEnemies().length;
    
    // Flow state machine for dynamic difficulty
    switch(this.spawnFlowState) {
      case 'building':
        // Build up enemy count gradually
        this.baseSpawnRate = Math.min(2.0, 1.0 + (this.flowTimer / 20000)); // Increase over 20 seconds
        if (activeCount >= this.maxEnemies - 1) {
          this.spawnFlowState = 'peak';
          this.flowTimer = 0;
          console.log('⚡ Spawn flow: BUILDING → PEAK');
        }
        break;
        
      case 'peak':
        // High intensity period
        this.baseSpawnRate = 2.0;
        this.difficultyScaling = Math.min(2.0, 1.0 + (this.enemySpawnWaves * 0.1));
        
        if (this.flowTimer > 10000) { // Peak for 10 seconds
          this.spawnFlowState = 'sustaining';
          this.flowTimer = 0;
          console.log('⚡ Spawn flow: PEAK → SUSTAINING');
        }
        break;
        
      case 'sustaining':
        // Maintain pressure
        this.baseSpawnRate = 1.5;
        if (this.defeatedCount > this.enemySpawnWaves * 3 + 2) {
          this.spawnFlowState = 'recovery';
          this.flowTimer = 0;
          this.enemySpawnWaves++;
          console.log(`⚡ Spawn flow: SUSTAINING → RECOVERY (Wave ${this.enemySpawnWaves + 1})`);
        }
        break;
        
      case 'recovery':
        // Give player breathing room
        this.baseSpawnRate = 0.8;
        if (this.flowTimer > 8000) { // Recovery for 8 seconds
          this.spawnFlowState = 'building';
          this.flowTimer = 0;
          this.generateEnemyPattern(); // New pattern for next wave
          console.log('⚡ Spawn flow: RECOVERY → BUILDING');
        }
        break;
    }
  }
  
  // Update spawn zone rotation for variety
  updateSpawnZones(deltaTime) {
    this.zoneRotationTimer += deltaTime;
    
    if (this.zoneRotationTimer >= this.zoneRotationInterval) {
      this.zoneRotationTimer = 0;
      
      // Rotate to next zone
      const zones = ['left', 'right', 'both', 'center', 'opposite'];
      const currentIndex = zones.indexOf(this.currentSpawnZone);
      this.currentSpawnZone = zones[(currentIndex + 1) % zones.length];
      
      console.log(`🔄 Spawn zone rotated to: ${this.currentSpawnZone}`);
    }
  }
  
  // Generate enemy type patterns for coordinated spawning
  generateEnemyPattern() {
    this.enemyTypePattern = [];
    
    // Create patterns based on wave number
    const wavePattern = this.enemySpawnWaves % 4;
    
    switch(wavePattern) {
      case 0: // Virus focused
        this.enemyTypePattern = ['virus', 'virus', 'corrupted'];
        break;
      case 1: // Balanced
        this.enemyTypePattern = ['virus', 'corrupted', 'virus', 'firewall'];
        break;
      case 2: // Corrupted focused
        this.enemyTypePattern = ['corrupted', 'corrupted', 'virus', 'corrupted'];
        break;
      case 3: // Mixed with firewall
        this.enemyTypePattern = ['virus', 'firewall', 'corrupted', 'virus', 'corrupted'];
        break;
    }
    
    this.patternIndex = 0;
    console.log(`📋 Generated enemy pattern for wave ${this.enemySpawnWaves + 1}:`, this.enemyTypePattern);
  }
  
  // Determine if enemy should spawn based on flow state
  shouldSpawnEnemy(activeCount) {
    // Basic spawn conditions
    if (activeCount >= this.maxEnemies) return false;
    
    // Flow state specific conditions
    switch(this.spawnFlowState) {
      case 'building':
        return activeCount < this.minEnemies;
      case 'peak':
        return activeCount < this.maxEnemies && this.consecutiveSpawns < this.maxConsecutiveSpawns;
      case 'sustaining':
        return activeCount < this.maxEnemies - 1;
      case 'recovery':
        return activeCount < Math.max(1, this.minEnemies - 1);
      default:
        return false;
    }
  }
  
  // Get flow-adjusted spawn time
  getFlowSpawnTime() {
    let baseTime = this.getRandomSpawnTime();
    
    // Adjust based on flow state
    switch(this.spawnFlowState) {
      case 'building':
        baseTime *= 1.2; // Slower during building
        break;
      case 'peak':
        baseTime *= 0.6; // Faster during peak
        break;
      case 'sustaining':
        baseTime *= 0.8; // Moderate during sustaining
        break;
      case 'recovery':
        baseTime *= 1.5; // Much slower during recovery
        break;
    }
    
    return Math.max(1000, baseTime); // Minimum 1 second between spawns
  }
  
  // Enhanced flow-based enemy spawning
  spawnFlowEnemy(player) {
    if (this.enemies.length >= this.maxEnemies) return;
    
    // Get enemy type from pattern or fallback
    let type;
    if (this.enemyTypePattern.length > 0 && this.patternIndex < this.enemyTypePattern.length) {
      type = this.enemyTypePattern[this.patternIndex];
      this.patternIndex++;
    } else {
      // Fallback to random type (INCLUDE FIREWALLS)
      const types = ['virus', 'corrupted', 'firewall'];
      type = types[Math.floor(Math.random() * types.length)];
    }
    
    // Apply difficulty scaling to enemy properties
    const enemy = this.createFlowEnemy(player, type);
    
    if (enemy) {
      this.enemies.push(enemy);
      this.consecutiveSpawns++;
      this.lastSpawnTime = Date.now();
      
      // Reset consecutive spawns after a delay
      setTimeout(() => {
        this.consecutiveSpawns = Math.max(0, this.consecutiveSpawns - 1);
      }, 5000);
      
      console.log(`🌊 Flow spawned ${type} enemy (zone: ${this.currentSpawnZone}, state: ${this.spawnFlowState})`);
    }
  }
  
  // Create enemy with flow-based positioning and properties
  createFlowEnemy(player, type) {
    const spawnLocation = this.getFlowSpawnLocation(player, type);
    const enemy = new window.Enemy(spawnLocation.x, spawnLocation.y, type);
    
    // Apply difficulty scaling to enemy properties
    if (this.spawnFlowState === 'peak') {
      // Make enemies more aggressive during peak
      enemy.speed *= 1.2;
      enemy.detectionRadius *= 1.3;
    } else if (this.spawnFlowState === 'building') {
      // Slightly boost enemies during building phase
      enemy.speed *= 1.1;
    }
    
    return enemy;
  }
  
  // Get flow-based spawn location
  getFlowSpawnLocation(player, enemyType) {
    const playerX = player.position.x;
    const playerY = player.position.y;
    let flowSpawnX, flowSpawnY;
    
    switch(this.currentSpawnZone) {
      case 'left':
        flowSpawnX = window.randomRange(50, 300);
        flowSpawnY = window.randomRange(200, 700);
        break;
        
      case 'right':
        flowSpawnX = window.randomRange(3646, 3896);
        flowSpawnY = window.randomRange(200, 700);
        break;
        
      case 'both':
        // Spawn from both sides alternately
        if (Math.random() < 0.5) {
          flowSpawnX = window.randomRange(50, 300);
        } else {
          flowSpawnX = window.randomRange(3646, 3896);
        }
        flowSpawnY = window.randomRange(200, 700);
        break;
        
      case 'center':
        // Spawn from top/bottom center
        flowSpawnX = playerX + (Math.random() - 0.5) * 400;
        flowSpawnY = Math.random() < 0.5 ? 150 : 850;
        break;
        
      case 'opposite':
        // Spawn opposite side from player
        if (playerX < 2048) {
          flowSpawnX = window.randomRange(3646, 3896);
        } else {
          flowSpawnX = window.randomRange(50, 300);
        }
        flowSpawnY = window.randomRange(200, 700);
        break;
        
      default:
        flowSpawnX = window.randomRange(3646, 3896);
        flowSpawnY = window.randomRange(200, 700);
    }
    
    // Ensure spawn position is away from existing enemies
    let attempts = 0;
    while (this.isTooCloseToExistingEnemies(flowSpawnX, flowSpawnY, 100) && attempts < 10) {
      flowSpawnX += (Math.random() - 0.5) * 100;
      flowSpawnY += (Math.random() - 0.5) * 50;
      attempts++;
    }
    
    return { x: flowSpawnX, y: flowSpawnY };
  }
  
  // Spawn random enemy at smart location
  spawnRandomEnemy(player) {
    if (this.enemies.length >= this.maxEnemies) return;
    
    // Check population limits for virus and corrupted (max 3 each)
    const activeVirusCount = this.enemies.filter(e => e.active && e.type === 'virus').length;
    const activeCorruptedCount = this.enemies.filter(e => e.active && e.type === 'corrupted').length;
    
    // DEBUG: Log current population counts
    console.log(`Population check - Virus: ${activeVirusCount}/3, Corrupted: ${activeCorruptedCount}/3, Firewall: ${this.activeFirewallCount}/1`);
    
    // FIREWALL SPAWN CONTROL: Allow more firewalls
    const currentTime = Date.now();
    
    // FIREWALL RULE: Allow multiple firewalls now
    if (this.activeFirewallCount >= 3) {
      console.log('Firewall spawn blocked: 3 firewalls already on screen - will spawn other enemy types');
    }
    
    const canSpawnFirewall = currentTime - this.lastFirewallSpawnTime > this.firewallSpawnCooldown;
    
    let type;
    // ENHANCED FIREWALL RULE: Allow up to 3 firewalls
    if (this.activeFirewallCount >= 3) {
      console.log('Firewall spawn blocked: 3 firewalls already exists (limit reached)');
      // Only spawn virus or corrupted if firewall limit reached
      const availableTypes = [];
      if (activeVirusCount < 3) availableTypes.push('virus');
      if (activeCorruptedCount < 3) availableTypes.push('corrupted');
      
      if (availableTypes.length === 0) {
        console.log('Population limits reached - no virus or corrupted can spawn');
        return; // Can't spawn anything
      }
      
      type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      console.log(`Firewall limit reached - spawning ${type} instead (Virus: ${activeVirusCount}/3, Corrupted: ${activeCorruptedCount}/3)`);
    } else {
      // Less than 3 firewalls exist - can spawn more
      const rand = Math.random();
      if (rand < 0.25) { // 25% chance for firewall (increased from 15%)
        type = 'firewall';
        this.lastFirewallSpawnTime = currentTime;
        console.log('Spawning firewall (25% chance, firewall limit not reached)');
      } else {
        // Choose virus or corrupted based on population limits - IMPROVED CHANCES
        const availableTypes = [];
        if (activeVirusCount < 3) availableTypes.push('virus');
        if (activeCorruptedCount < 3) availableTypes.push('corrupted');
        
        if (availableTypes.length === 0) {
          console.log('Population limits reached - no virus or corrupted can spawn');
          return; // Can't spawn any more virus or corrupted
        }
        
        // IMPROVED: Give corrupted equal chance with virus (was random, now balanced)
        if (availableTypes.length === 2) {
          // Both virus and corrupted available - 50/50 chance
          type = Math.random() < 0.5 ? 'virus' : 'corrupted';
          console.log(`Both types available - chose ${type}`);
        } else {
          // Only one type available
          type = availableTypes[0];
          console.log(`Only ${type} available - spawning ${type}`);
        }
      }
    }
    
    // Get safe spawn location away from player and other enemies
    const safeLocation = this.findSafeSpawnLocation(player);
    
    const enemy = new window.Enemy(safeLocation.x, safeLocation.y, type);
    this.enemies.push(enemy);
    
    // Update firewall count if needed (allow up to 3)
    if (type === 'firewall') {
      this.activeFirewallCount++; // Increment firewall count
      console.log(`Firewall count incremented to ${this.activeFirewallCount} (max 3 allowed)`);
    }
    
    // Update last spawn position for avoidance
    this.lastSpawnPosition = { x: safeLocation.x, y: safeLocation.y };
    
    console.log(`Spawned ${type} enemy at (${safeLocation.x}, ${safeLocation.y}) - Virus: ${activeVirusCount}/3, Corrupted: ${activeCorruptedCount}/3`);
  }
  
  // Find safe spawn location away from player and other enemies
  findSafeSpawnLocation(player) {
    const playerSafeRadius = 250; // Increased safe radius
    const enemySafeRadius = 120;
    
    // ALWAYS use edge-only spawning for corrupted and firewall enemies
    // Filter locations to ONLY include edges
    const edgeOnlyLocations = this.spawnLocations.filter(loc => {
      return loc.edge === 'left' || loc.edge === 'right' || loc.edge === 'top' || loc.edge === 'bottom';
    });
    
    // Filter edge locations that are safe from player
    const safeFromPlayer = edgeOnlyLocations.filter(loc => {
      const distToPlayer = window.distance(loc.x, loc.y, player.position.x, player.position.y);
      // STRICT: Don't spawn above player at all
      const notAbovePlayer = loc.y >= player.position.y; // No tolerance
      // Additional safety: Don't spawn too close horizontally
      const notTooCloseHorizontally = Math.abs(loc.x - player.position.x) > playerSafeRadius;
      return distToPlayer > playerSafeRadius && notAbovePlayer && notTooCloseHorizontally;
    });
    
    // Filter locations that are safe from other enemies
    let safeFromEnemies = safeFromPlayer.filter(loc => {
      return !this.isTooCloseToExistingEnemies(loc.x, loc.y, enemySafeRadius);
    });
    
    // If no locations are safe from enemies, at least use player-safe edge locations
    if (safeFromEnemies.length === 0) {
      safeFromEnemies = safeFromPlayer;
    }
    
    // Avoid spawning in same area as last spawn
    if (this.lastSpawnPosition) {
      safeFromEnemies = safeFromEnemies.filter(loc => {
        const distToLastSpawn = window.distance(loc.x, loc.y, this.lastSpawnPosition.x, this.lastSpawnPosition.y);
        return distToLastSpawn > this.spawnAvoidanceRadius;
      });
    }
    
    // Fallback to any edge location if all filters fail
    if (safeFromEnemies.length === 0) {
      safeFromEnemies = edgeOnlyLocations;
    }
    
    // Pick random safe edge location
    const location = safeFromEnemies[Math.floor(Math.random() * safeFromEnemies.length)];
    
    // Add minimal randomness to exact position (less than before to stay on edges)
    const randomOffset = 15; // Reduced offset to ensure enemies stay on edges
    return {
      x: location.x + (Math.random() - 0.5) * randomOffset * 2,
      y: location.y + (Math.random() - 0.5) * randomOffset * 2
    };
  }
  
  // Update enemy behaviors for more dynamic interactions
  updateEnemyBehaviors(player) {
    const activeEnemies = this.getActiveEnemies();
    
    activeEnemies.forEach(enemy => {
      // Enhanced AI based on enemy count and types
      const nearbyEnemies = activeEnemies.filter(other => 
        other !== enemy && window.distance(enemy.position.x, enemy.position.y, other.position.x, other.position.y) < 300
      );
      
      // Dynamic behavior based on nearby allies
      if (nearbyEnemies.length > 0) {
        this.applyGroupBehavior(enemy, nearbyEnemies, player);
      }
      
      // Prevent edge camping
      this.preventEdgeCamping(enemy);
    });
  }
  
  // Apply group behaviors for coordinated attacks
  applyGroupBehavior(enemy, nearbyEnemies, player) {
    // Calculate distance to player for group behaviors
    const playerDistance = window.distance(enemy.position.x, enemy.position.y, player.position.x, player.position.y);
    
    // Coordinate attacks based on enemy type
    switch(enemy.type) {
      case 'virus':
        // Viruses become more aggressive in groups
        if (nearbyEnemies.filter(e => e.type === 'virus').length >= 2) {
          // Enhanced speed when grouped
          enemy.speed = Math.min(enemy.speed * 1.3, 200);
          
          // Circle around player with other viruses
          if (playerDistance < 400 && Math.random() > 0.7) {
            const angle = Math.atan2(player.position.y - enemy.position.y, player.position.x - enemy.position.x);
            const offsetAngle = angle + (Math.random() - 0.5) * Math.PI / 2;
            enemy.velocity.x = Math.cos(offsetAngle) * enemy.speed * 0.5;
            enemy.velocity.y = Math.sin(offsetAngle) * enemy.speed * 0.5 - 25;
          }
        }
        break;
        
      case 'corrupted':
        // DISABLED: Corrupted enemies should not coordinate teleports
        // const corruptedAllies = nearbyEnemies.filter(e => e.type === 'corrupted');
        // if (corruptedAllies.length >= 2 && Math.random() > 0.9) { // Even less frequent
        //   // Teleport to flank player
        //   const teleportAngle = Math.atan2(player.position.y - enemy.position.y, player.position.x - enemy.position.x) + (Math.random() - 0.5) * Math.PI;
        //   const teleportDist = 150 + Math.random() * 100;
        //   
        //   const newX = player.position.x + Math.cos(teleportAngle) * teleportDist;
        //   const newY = player.position.y + Math.sin(teleportAngle) * teleportDist;
        //   
        //   // DISABLED: Remove green teleport particles for corruptor group behavior
        //   
        //   enemy.position.x = window.clamp(newX, enemy.width/2, 1920 - enemy.width/2);
        //   enemy.position.y = window.clamp(newY, 100, 850);
        //   enemy.velocity.x = 0;
        //   enemy.velocity.y = 0;
        //   
        //   // DISABLED: Remove green arrival particles for corruptor group behavior
        // }
        break;
        
      case 'firewall':
        // Firewalls become defensive shields for allies
        if (nearbyEnemies.length >= 2 && Math.random() > 0.6) {
          enemy.shieldActive = true;
          
          // Position between allies and player
          const alliesCenter = nearbyEnemies.reduce((acc, ally) => ({
            x: acc.x + ally.position.x / nearbyEnemies.length,
            y: acc.y + ally.position.y / nearbyEnemies.length
          }), { x: 0, y: 0 });
          
          const toAllies = Math.atan2(alliesCenter.y - enemy.position.y, alliesCenter.x - enemy.position.x);
          enemy.velocity.x = Math.cos(toAllies) * enemy.speed * 0.3;
        }
        break;
    }
  }
  
  // Prevent enemies from camping at screen edges
  preventEdgeCamping(enemy) {
    const edgeBuffer = 150;
    const pushForce = 50;
    
    // Check each edge and apply push force
    if (enemy.position.x < edgeBuffer) {
      enemy.velocity.x += pushForce;
      if (enemy.isOnGround && Math.random() > 0.7) {
        enemy.velocity.y = -20; // Reduced jump height to escape edge (60% reduction from 50)
      }
    }
    
    if (enemy.position.x > 1920 - edgeBuffer) {
      enemy.velocity.x -= pushForce;
      if (enemy.isOnGround && Math.random() > 0.7) {
        enemy.velocity.y = -50; // Reduced jump height to escape edge
      }
    }
    
    if (enemy.position.y < edgeBuffer) {
      enemy.velocity.y += pushForce;
    }
    
    if (enemy.position.y > 830 - edgeBuffer) {
      enemy.velocity.y -= Math.min(pushForce, Math.abs(enemy.velocity.y) * 0.5);
    }
  }
  
  checkCollisions(player) {
    try {
      const currentTime = Date.now();
      const playerHitbox = player.getHitbox();
      
      this.enemies.forEach(enemy => {
        if (!enemy.active) return;
        
        const enemyHitbox = enemy.getHitbox();
        
        // Enhanced stomp detection - STOMP ALWAYS WORKS regardless of invulnerability
        const playerBottom = playerHitbox.y + playerHitbox.height;
        const enemyTop = enemyHitbox.y;
        const playerHitCenterX = playerHitbox.x + playerHitbox.width / 2;
        const enemyHitCenterX = enemyHitbox.x + enemyHitbox.width / 2;
        
        // STOMP ATTACK: Check if player is jumping down on enemy - PRIORITY OVERRIDE
        if (player.velocity.y > 0 && // Player moving down
            playerBottom >= enemyTop - 10 && // Player feet approaching enemy top (more generous)
            playerBottom <= enemyTop + 30 && // More generous boundary
            Math.abs(playerHitCenterX - enemyHitCenterX) < enemyHitbox.width * 0.9 && // Very generous horizontal
            Math.abs(playerHitbox.y + playerHitbox.height - enemyTop) < 50) { // Distance check
          
          // REGULAR STOMP: Single target damage only
          console.log('STOMP ATTACK! Player stomping on', enemy.type, '- INSTANT KILL');
          enemy.takeDamage(999); // Instant kill
          
          // Create stomp effect at target
          if (window.particleSystem) {
            window.particleSystem.impact(enemy.position.x, enemy.position.y - enemy.height/2, '#00ffff', 20);
            window.particleSystem.explosion(enemy.position.x, enemy.position.y - enemy.height/2, enemy.color, 15);
          }
          
          // REGULAR BOUNCE MECHANIC - Fixed bounce for single target
          let bounceForce = 400;
          
          // UP-BOOST MECHANIC: Check if player is holding UP arrow for enhanced bounce
          const inputSystem = window.inputSystem || window;
          const isHoldingUp = inputSystem.keys && inputSystem.keys['ArrowUp'];
          
          if (isHoldingUp) {
            // Enhanced bounce when holding UP - 60% more boost
            bounceForce = 640; // 400 * 1.6 = 640
            console.log('⬆️ UP-BOOST STOMP! Enhanced bounce force:', bounceForce);
            
            // Create enhanced visual effect for up-boost
            if (window.particleSystem) {
              // Extra particle burst for up-boost
              for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 * i) / 8;
                const speed = 200 + Math.random() * 100;
                const particleX = enemy.position.x + Math.cos(angle) * 20;
                const particleY = enemy.position.y - enemy.height/2 + Math.sin(angle) * 20;
                window.particleSystem.impact(particleX, particleY, '#00ffff', 5);
              }
            }
            
            // Enhanced screen shake for up-boost
            if (window.renderer && typeof window.renderer.addScreenShake === 'function') {
              window.renderer.addScreenShake(12, 400); // Stronger shake
            }
          }
          
          player.velocity.y = -bounceForce; // Upward bounce
          
          // Add horizontal bonus based on enemy type
          let horizontalBonus = 0;
          if (enemy.type === 'virus') {
            horizontalBonus = 50;
          } else if (enemy.type === 'corrupted') {
            horizontalBonus = 80;
          } else if (enemy.type === 'firewall') {
            horizontalBonus = 120;
          }
          
          player.velocity.x += player.facing * horizontalBonus;
          
          const boostIndicator = isHoldingUp ? ' (UP-BOOST!)' : '';
          console.log(`💥 STOMP! Bounce force: ${bounceForce}, Horizontal bonus: ${horizontalBonus}${boostIndicator}`);
          
          // Screen shake for stomp
          if (window.renderer && typeof window.renderer.addScreenShake === 'function') {
            window.renderer.addScreenShake(8, 300);
          }
          
          return; // Stomp successful - no damage to player
        }
        
        // General collision check for damage - RESPECT invulnerability
        // Check if player is invulnerable from recent damage
        const isInvulnerable = player.invulnerableUntil && currentTime < player.invulnerableUntil;
        
        if (this.simpleAABBcollision(playerHitbox, enemyHitbox)) {
          // Check if enemy is within spawn protection period
          const timeSinceSpawn = currentTime - enemy.spawnTime;
          const isProtected = timeSinceSpawn < enemy.spawnProtectionDuration;
          
          if (isProtected) {
            console.log('Player collision with protected', enemy.type, '- knockback only, no damage');
            
            // YELLOW knockback particles for protected enemies
            if (window.particleSystem) {
              window.particleSystem.damageEffect(
                player.position.x,
                player.position.y,
                'knockback', // Special type for yellow knockback particles
                8
              );
            }
            
            // Apply knockback but no damage
            const playerPosCenterX = player.position.x;
            const playerPosCenterY = player.position.y;
            const enemyPosCenterX = enemy.position.x;
            const enemyPosCenterY = enemy.position.y;
            
            const dx = playerPosCenterX - enemyPosCenterX;
            const dy = playerPosCenterY - enemyPosCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const knockbackX = distance > 0 ? (dx / distance) : 0;
            const knockbackY = distance > 0 ? (dy / distance) : -1;
            
            const knockbackForce = 20;
            
            // Apply knockback to player
            player.position.x += knockbackX * knockbackForce;
            player.position.y += knockbackY * knockbackForce;
            
            // Reduced knockback velocity for protected enemies
            player.velocity.x = knockbackX * 200;
            player.velocity.y = Math.max(-150, knockbackY * 100 - 50);
            
            // Disable controls briefly
            player.controlsDisabled = true;
            player.controlsDisabledUntil = Date.now() + 300;
            
            // Visual effect for protected collision
            if (window.particleSystem) {
              window.particleSystem.impact(
                player.position.x,
                player.position.y,
                '#ffff00', 8  // Yellow particles for protected collision
              );
            }
            
            return; // Skip damage
          } else if (!isInvulnerable) {
            console.log('Player collision with', enemy.type, '- player takes damage only');
            player.takeDamage(enemy.damage);
          } else {
            console.log('Player collision with', enemy.type, '- invulnerable, no damage but collision physics apply');
          }
          
          // Calculate precise knockback direction based on collision side
          
          // Calculate direction from enemy to player
          const playerPosCenterX = player.position.x;
          const playerPosCenterY = player.position.y;
          const enemyPosCenterX = enemy.position.x;
          const enemyPosCenterY = enemy.position.y;
          
          const dx = playerPosCenterX - enemyPosCenterX;
          const dy = playerPosCenterY - enemyPosCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Normalize to get direction vector
          const knockbackX = distance > 0 ? (dx / distance) : 0;
          const knockbackY = distance > 0 ? (dy / distance) : -1;
          
          const knockbackForce = 20;
          
          // Apply precise knockback to player - RHYTHM MODE FIX
          player.position.x += knockbackX * knockbackForce;
          player.position.y += knockbackY * knockbackForce;
          
          // Check if player is in rhythm mode - if so, reduce knockback to prevent gliding
          const isRhythmMode = window.rhythmSystem && window.rhythmSystem.isActive();
          if (isRhythmMode) {
            // Much weaker knockback in rhythm mode - position-based only, no velocity
            player.velocity.x = knockbackX * 50; // Much less velocity (50 vs 350)
            player.velocity.y = Math.max(-150, knockbackY * 50 - 50); // Reduced vertical
            
            // Apply friction immediately in rhythm mode to stop gliding
            setTimeout(() => {
              if (player && player.velocity) {
                player.velocity.x *= 0.3; // Heavy friction in rhythm mode
                player.velocity.y *= 0.3;
              }
            }, 100);
          } else {
            // Normal knockback for non-rhythm mode
            player.velocity.x = knockbackX * 350; // Strong horizontal knockback
            player.velocity.y = Math.max(-300, knockbackY * 200 - 100); // Bounce up more than away
          }
          
          // Disable player controls for 0.5 seconds
          player.controlsDisabled = true;
          player.controlsDisabledUntil = Date.now() + 500;
          
          // Collision effect
          if (window.particleSystem) {
            window.particleSystem.impact(
              player.position.x,
              player.position.y,
              '#ff0000', 12
            );
            // RED damage particles for player damage
            window.particleSystem.damageEffect(
              player.position.x,
              player.position.y,
              null, // null enemyType = player damage = RED
              12
            );
          }
        }
      });
    } catch (error) {
      console.error('Error checking enemy collisions:', error?.message || error);
    }
  }
  
  // Simple AABB collision function
  simpleAABBcollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }
  
  // Check if player lands on enemies (jump attack) - simplified
  checkPlayerAttacks(player, rhythmResult = null) {
    try {
      // Rhythm attacks are handled separately - this is just for jump attacks
      // Jump attacks are now handled in checkCollisions for simplicity
      
      // Process rhythm attack if provided
      if (rhythmResult && rhythmResult.hit) {
        // Rhythm attacks damage all nearby enemies
        this.enemies.forEach(enemy => {
          if (!enemy.active) return;
          
          const dist = window.distance?.(
            player.position.x, player.position.y,
            enemy.position.x, enemy.position.y
          );
          
          // Damage enemies within rhythm attack range
          if (dist !== undefined && dist < 300) {
            const damage = rhythmResult.timing === 'perfect' ? 3 : 2;
            enemy.takeDamage(damage);
            console.log(`Rhythm attack hit ${enemy.type} for ${damage} damage`);
          }
        });
      }
    } catch (error) {
      console.error('Error checking player attacks:', error?.message || error);
    }
  }

  draw(ctx) {
    try {
      this.enemies.forEach(enemy => {
        enemy.draw(ctx);
      });
    } catch (error) {
      console.error('Error drawing enemies:', error?.message || error);
    }
  }

  getActiveEnemies() {
    return this.enemies.filter(enemy => enemy.active);
  }

  getDefeatedCount() {
    return this.defeatedCount;
  }

  clear() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.defeatedCount = 0; // Reset defeat counter for tutorial
    this.disabledUntil = 0; // Reset enemy disable timer
    
    // Reset wave tracking
    this.waveInProgress = false;
    this.enemiesInCurrentWave = 0;
    this.enemiesSpawnedInWave = 0;
    this.waveSpawnStartTime = 0;
    
    // Reset firewall tracking
    this.lastFirewallSpawnTime = 0;
    this.activeFirewallCount = 0;
    
    console.log('Enemy manager cleared - reset defeat count to 0');
  }
  
  // Temporarily disable enemies (for hacking rewards)
  disableEnemies(duration = 3000) {
    this.disabledUntil = performance.now() + duration;
    console.log(`Enemies disabled for ${duration}ms`);
  }
  
  spawnControlledWave() {
    // Don't start new wave if current wave is still spawning
    if (this.waveInProgress) {
      console.log('Wave already in progress - skipping spawn');
      return;
    }
    
    // Spawn controlled waves with staggered timing (3+ seconds between each)
    const waveSize = Math.min(3, window.gameState.enemiesPerLevel - window.gameState.enemiesDefeated);
    const types = ['virus', 'corrupted', 'firewall'];
    
    // Track wave state
    this.waveInProgress = true;
    this.enemiesInCurrentWave = waveSize;
    this.enemiesSpawnedInWave = 0;
    this.waveSpawnStartTime = Date.now();
    
    console.log(`Starting staggered wave: ${waveSize} enemies over ${waveSize * 3} seconds`);
    
    for (let i = 0; i < waveSize; i++) {
      // Schedule each enemy to spawn with delay
      const spawnDelay = i * 3000; // 3 seconds between each enemy
      
      setTimeout(() => {
        // Get current player position for spawn avoidance
        const player = window.gameState?.player || { position: { x: 960, y: 750 } };
        const playerSafeRadius = 150; // Keep this distance away from player
        
        // Spawn enemies at random positions in different zones
        const spawnZones = [
          { xMin: 200, xMax: 600, y: 810 },     // Left zone
          { xMin: 700, xMax: 1200, y: 810 },    // Center zone
          { xMin: 1300, xMax: 1700, y: 810 }    // Right zone
        ];
        
        let validSpawnFound = false;
        let attempts = 0;
        let randomX, finalZone;
        
        // Try to find a valid spawn position away from player
        while (!validSpawnFound && attempts < 20) {
          const zone = spawnZones[(i + attempts) % spawnZones.length];
          randomX = window.randomRange(zone.xMin, zone.xMax);
          
          // Check distance from player
          const distToPlayer = window.distance(randomX, zone.y, player.position.x, player.position.y);
          
          if (distToPlayer > playerSafeRadius) {
            // Also check distance from other enemies
            const tooCloseToEnemies = this.isTooCloseToExistingEnemies(randomX, zone.y, 120);
            
            if (!tooCloseToEnemies) {
              validSpawnFound = true;
              finalZone = zone;
            }
          }
          
          attempts++;
        }
        
        // Fallback: if no valid position found, use a guaranteed safe position
        if (!validSpawnFound) {
          const fallbackZones = [
            { x: 300, y: 810 },   // Left fallback
            { x: 1620, y: 810 }   // Right fallback
          ];
          const fallback = fallbackZones[i % fallbackZones.length];
          randomX = fallback.x;
          finalZone = fallback;
          console.log(`Using fallback spawn position for enemy ${i + 1}`);
        }
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        const enemy = new window.Enemy(randomX, finalZone.y, type);
        this.enemies.push(enemy);
        this.enemiesSpawnedInWave++;
        
        console.log(`Enemy ${i + 1}/${waveSize} (${type}) spawned at safe position (${randomX}, ${finalZone.y}) with ${spawnDelay}ms delay`);
        
        // Check if wave is complete
        if (this.enemiesSpawnedInWave >= this.enemiesInCurrentWave) {
          this.waveInProgress = false;
          console.log('Staggered wave spawning complete');
        }
      }, spawnDelay);
    }
  }
  
  spawnEnemyAt(x, y) {
    const types = ['virus']; // Tutorial uses basic viruses only
    const type = types[0];
    
    // Find safe spawn position away from existing enemies
    const safePosition = this.findSafeSpawnPositionForTutorial(x, y);
    
    console.log(`Tutorial: Spawning ${type} enemy at safe position (${safePosition.x}, ${safePosition.y})`);
    const enemy = new window.Enemy(safePosition.x, safePosition.y, type);
    this.enemies.push(enemy);
  }
  
  // Find safe spawn position specifically for tutorial to prevent overlapping
  findSafeSpawnPositionForTutorial(requestedX, requestedY) {
    const minDistance = 80; // Minimum distance between enemies
    let safeX = requestedX;
    let safeY = requestedY;
    let attempts = 0;
    
    // Check if requested position is safe
    let isSafe = !this.isTooCloseToExistingEnemies(requestedX, requestedY, minDistance);
    
    // If not safe, find nearby safe position
    while (!isSafe && attempts < 20) {
      // Try positions in a spiral pattern around the requested position
      const angle = (attempts * 0.5) * (Math.PI * 2 / 8); // 8 directions
      const distance = 20 + attempts * 10; // Increasing radius
      
      safeX = requestedX + Math.cos(angle) * distance;
      safeY = requestedY + Math.sin(angle) * distance;
      
      // Keep within screen bounds
      safeX = window.clamp(safeX, 100, 3996);
      safeY = window.clamp(safeY, 100, 850);
      
      isSafe = !this.isTooCloseToExistingEnemies(safeX, safeY, minDistance);
      attempts++;
    }
    
    // If still not safe after 20 attempts, use a fallback position
    if (!isSafe) {
      const fallbackPositions = [
        { x: 300, y: 810 },
        { x: 600, y: 810 },
        { x: 960, y: 810 },
        { x: 1320, y: 810 },
        { x: 1620, y: 810 }
      ];
      
      // Find the first fallback position that's safe
      for (const fallback of fallbackPositions) {
        if (!this.isTooCloseToExistingEnemies(fallback.x, fallback.y, minDistance)) {
          safeX = fallback.x;
          safeY = fallback.y;
          break;
        }
      }
    }
    
    return { x: safeX, y: safeY };
  }
  
  // Find safe spawn position for corrupted enemies to prevent overlapping
  findSafeSpawnPositionForCorrupted(requestedX, requestedY) {
    const minDistance = 120; // Larger minimum distance for corrupted (they're bigger)
    let safeX = requestedX;
    let safeY = requestedY;
    let attempts = 0;
    
    // Check if requested position is safe
    let isSafe = !this.isTooCloseToExistingEnemies(requestedX, requestedY, minDistance);
    
    // If not safe, find nearby safe position
    while (!isSafe && attempts < 30) {
      // Try positions in a wider spiral pattern for corrupted enemies
      const angle = (attempts * 0.3) * (Math.PI * 2 / 12); // 12 directions
      const distance = 30 + attempts * 15; // Larger radius for bigger enemies
      
      safeX = requestedX + Math.cos(angle) * distance;
      safeY = requestedY + Math.sin(angle) * distance * 0.5; // Less vertical variation
      
      // Keep within screen bounds with more padding for corrupted
      safeX = window.clamp(safeX, 150, 3946);
      safeY = window.clamp(safeY, 150, 800);
      
      isSafe = !this.isTooCloseToExistingEnemies(safeX, safeY, minDistance);
      attempts++;
    }
    
    // If still not safe after 30 attempts, use a fallback position
    if (!isSafe) {
      const fallbackPositions = [
        { x: 300, y: 400 },
        { x: 600, y: 400 },
        { x: 960, y: 400 },
        { x: 1320, y: 400 },
        { x: 1620, y: 400 }
      ];
      
      // Find the first fallback position that's safe
      for (const fallback of fallbackPositions) {
        if (!this.isTooCloseToExistingEnemies(fallback.x, fallback.y, minDistance)) {
          safeX = fallback.x;
          safeY = fallback.y;
          break;
        }
      }
    }
    
    return { x: safeX, y: safeY };
  }
};

// Create global enemy manager - wait for dependencies to be ready
function createEnemyManager() {
  if (window.Vector2D && window.distance && window.clamp && window.randomRange) {
    window.enemyManager = new window.EnemyManager();
  } else {
    console.warn('Enemy manager dependencies not ready, retrying...');
    setTimeout(createEnemyManager, 100);
  }
}

// Initialize enemy manager when dependencies are loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createEnemyManager);
} else {
  createEnemyManager();
}