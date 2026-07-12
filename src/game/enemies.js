// Enemy system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/enemies.js',
  exports: ['Enemy', 'JammerEnemy', 'EnemyManager', 'enemyManager'],
  dependencies: ['Vector2D', 'distance', 'clamp', 'randomRange']
});

// ==========================================
// 1. BASE ENEMY CLASS (Moved to Top)
// ==========================================
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
    this.state = 'entrance'; 
    this.target = null;
    this.stateTimer = 0;
    this.animationTime = 0;
    
    // Entrance animation properties
    this.entrancePhase = 0;
    this.entranceComplete = (type === 'firewall'); // Firewalls start ready
    this.originalSpawnX = x;
    this.originalSpawnY = y;
    this._dropEdge = (type === 'virus') ? 'top' : null;
    
    // Firewall-specific properties
    this.shieldActive = false;
    this.preparingAttack = false;
    this.attackAnimationPlaying = false;
    this.attackAnimationDuration = 0;
    this.attackAnimationTimer = 0;
    this.aiState = 'walking'; 
    
    // Personality behavior properties
    this.personalityTimer = Math.random() * 1000;
    this.behaviorState = 'normal';
    this.behaviorTimer = 0;
    
    // Corrupted Behavior State (New "Stop and Stare")
    this._corruptedState = null; 
    this._corruptedTimer = 0;
    this._nextPauseTime = 0;
    
    // Virus Hover properties (New "Size Up")
    this.hoverState = 'none';
    this.hoverTimer = 0;
    this.hoverPosition = null;
    this._groupBehaviorTimer = 0;
    
    // Firewall lunge behavior
    this.lungeCooldown = 0;
    this.lungePreparationTime = 0;
    this.isLunging = false;
    this.proximityDetectionRadius = 400;
    this._idleAnimationTimer = 0;
    this._inFullIdle = false;
    
    // Enhanced firewall properties (only used when type === 'firewall')
    this.proximityAttackRange = 250;
    this.glideDistance = 80;
    this.glideDuration = 0.8;
    this.fullAttackDuration = 4.9;
    this.attackStartTime = 0;
    
    // MakkoEngine sprite properties
    this.sprite = null;
    this.spriteReady = false;
    this.currentAnimation = null;
    this.facing = 1; 
    
    // Movement variations
    this.phaseOffset = Math.random() * Math.PI * 2;
    this.movementSeed = Math.random() * 1000;
    
    // Collision cooldowns
    this.lastCollisionTime = 0;
    this.collisionCooldown = 200;
    this.recentlyCollidedWith = new Set();
    
    // Spawn protection
    this.spawnTime = Date.now();
    this.spawnProtectionDuration = 2000;
    
    // Initialize sprite
    if (['virus', 'corrupted', 'firewall', 'jammer'].includes(this.type)) {
      setTimeout(() => {
        this.initSprite();
      }, 100);
    }
    
    // Trigger entrance logic
    this.startEntrance();
    
    if (window.particleSystem) {
      window.particleSystem.enemySpawnEffect(this.position.x, this.position.y, this.type);
    }
  }

  setupByType() {
    switch(this.type) {
      case 'virus':
        this.width = 38;
        this.height = 37;
        this.speed = 150;
        this.damage = 1;
        this.color = '#9900ff';
        this.patrolRadius = 100;
        this.detectionRadius = 250;
        break;
      case 'corrupted':
        this.width = 64;
        this.height = 77;
        this.speed = 200; // Fast speed
        this.damage = 2;
        this.color = '#00ff88';
        this.patrolRadius = 80;
        this.detectionRadius = 350;
        break;
      case 'firewall':
        this.width = 140;
        this.height = 140;
        this.speed = 35;
        this.damage = 2;
        this.color = '#ff9900';
        this.patrolRadius = 100;
        this.detectionRadius = 450;
        this.attackAnimationDuration = 6000;
        this.lungeCooldown = 6000 + Math.random() * 4000;
        this.maxAttackDistance = 500;
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
      case 'firewall': return 12; 
      default: return 3;
    }
  }

  update(deltaTime, player) {
    if (!this.active) return;
    
    const dt = deltaTime / 1000;
    this.stateTimer += deltaTime;
    this.animationTime += deltaTime;
    
    // Track if enemy is on ground
    this.isOnGround = this.position.y >= 750;
    
    // Gravity
    if (this.position.y < 750) {
      if (this.type !== 'firewall' || this.position.y < 700) {
         this.velocity.y += 600 * dt;
      }
    }
    
    // Update AI - Traffic Controller
    this.updateAI(player, dt);
    
    // Update Animation
    if (this.spriteReady && this.sprite) {
      this.sprite.update(deltaTime);
      this.forceCorrectAnimationState();
    }
    
    // Physics Application
    this.position = this.position.add(this.velocity.multiply(dt));

    // Ground Clamping
    const worldLeft = this.width/2;
    const worldRight = 4096 - this.width/2;
    this.position.x = window.clamp(this.position.x, worldLeft, worldRight);

    if (this.position.y >= 750) {
      this.position.y = 750;
      if (this.type === 'firewall' || this.type === 'corrupted') {
          this.velocity.y = Math.min(0, this.velocity.y); 
      } else {
          this.velocity.y = 0;
      }
    }
    
    // Friction
    const tutorialMode = window.tutorialSystem && window.tutorialSystem.isActive();
    if (tutorialMode && this.type === 'virus') {
        this.velocity.x *= 0.98;
    } else if (this.type !== 'firewall') { 
        this.velocity.x *= 0.95;
    }
  }

  updateAI(player, dt) {
    // 1. Firewall Specific Logic
    if (this.type === 'firewall') {
        this.firewallPersonalityBehavior(dt, player);
        return;
    }

    // 2. Corrupted Specific Logic
    if (this.type === 'corrupted') {
        if (!this.entranceComplete) {
            this.corruptedEntrance(dt);
        } else {
            this.corruptedPersonalityBehavior(dt, player);
        }
        return;
    }

    // 3. Virus / Generic Logic
    if (this.type === 'virus') {
        if (!this.entranceComplete) {
            this.virusDropEntrance(dt);
        } else {
            const dist = window.distance(this.position.x, this.position.y, player.position.x, player.position.y);
            this.virusPersonalityBehavior(dt, player, dist);
        }
        return;
    }
  }

  startEntrance() {
    if (this.type === 'corrupted') {
        const corruptedSpawnX = 4500 + window.randomRange(-50, 0);
        this.position.x = corruptedSpawnX;
        this.position.y = window.randomRange(200, 700);
        this.velocity.x = -(80 + Math.random() * 40);
        this.velocity.y = 50 + Math.random() * 50;
        this.entranceComplete = false;
        this.entrancePhase = 'throwing';
    } else if (this.type === 'firewall') {
        // FIX: ALWAYS spawn from right (off-screen)
        this.position.x = 4500; 
        this.position.y = 750;
        this.velocity.x = -40; // Start moving left
        this.entranceComplete = true; // Firewalls always ready
        this.aiState = 'walking';
        
        // Initialize Firewall Behavior State
        this.behaviorState = 'normal';
        this.behaviorTimer = 0;
        this.lungeCooldown = 1000 + Math.random() * 3000;
        this.isLunging = false;
        this.proximityDetectionRadius = 400 + Math.random() * 300;
        
    } else if (this.type === 'virus') {
        if (this._dropEdge) {
            this.entranceComplete = false;
            this.state = 'entrance';
        } else {
            this.entranceComplete = true;
            this.state = 'patrol';
        }
    }
  }

  // --- BEHAVIOR SYSTEMS ---

  // 1. VIRUS BEHAVIOR (Hover + Swoop)
  virusDropEntrance(dt) {
    if (this._dropEdge === 'top') {
        this.velocity.y += 600 * dt;
    }
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    if (this.position.y >= 750) {
        this.position.y = 750;
        this.velocity.y = 0;
        this.entranceComplete = true;
        this.state = 'patrol';
        this.isOnGround = true;
        if (window.particleSystem) window.particleSystem.impact(this.position.x, this.position.y, '#9900ff', 15);
    }
  }

  virusPersonalityBehavior(dt, player, distToPlayer) {
    const angleToPlayer = Math.atan2(
      player.position.y - this.position.y,
      player.position.x - this.position.x
    );
    
    // Group Logic
    const nearbyViruses = window.enemyManager?.getActiveEnemies().filter(other => 
      other !== this && other.type === 'virus' && other.active &&
      window.distance(this.position.x, this.position.y, other.position.x, other.position.y) < 200
    ) || [];
    
    if (nearbyViruses.length > 0) {
      this._groupBehaviorTimer += dt;
      if (this._groupBehaviorTimer > (2000 + Math.random() * 1000)) {
        this._groupBehaviorTimer = 0;
        const groupAction = Math.random();
        if (groupAction < 0.4) {
          // Synchronized hop attack
          nearbyViruses.forEach(virus => {
            virus.velocity.y = -this.speed * 0.1;
            virus.velocity.x = Math.cos(angleToPlayer + (Math.random() - 0.5) * 0.5) * this.speed * 1.2;
          });
          this.velocity.y = -this.speed * 0.1;
          this.velocity.x = Math.cos(angleToPlayer) * this.speed * 1.2;
        } else if (groupAction < 0.7) {
          // Fan out formation
          const fanAngle = (Math.PI * 2) / (nearbyViruses.length + 1);
          nearbyViruses.forEach((virus, index) => {
            const targetAngle = angleToPlayer - Math.PI/4 + fanAngle * index;
            virus.velocity.x = Math.cos(targetAngle) * this.speed * 0.8;
          });
        }
      }
    }
    
    if (distToPlayer < 9999) {
      // Check if should enter hover mode
      if (distToPlayer < 250 && this.hoverState === 'none' && this.isOnGround) {
        this.hoverState = 'approach';
        this.hoverTimer = 0;
        this.hoverPosition = { x: this.position.x, y: this.position.y };
        console.log('🦘 Virus entering hover mode to size up player');
      }
      
      // Handle hover behavior
      if (this.hoverState !== 'none') {
        this.updateVirusHoverBehavior(dt, player);
      } else {
        // Normal approach
        const speedBoost = distToPlayer < 300 ? 2.5 : 1.5;
        this.velocity.x = Math.cos(angleToPlayer) * this.speed * speedBoost;
        
        // Flanking
        if (nearbyViruses.length > 2) {
          const flankAngle = angleToPlayer + (Math.random() > 0.5 ? Math.PI/3 : -Math.PI/3);
          this.velocity.x = Math.cos(flankAngle) * this.speed * 1.3;
        }
        
        // Hop attack with timing delay
        if (distToPlayer < 200 && this.isOnGround && Math.random() > 0.7) {
          if (!this._hopDelay) {
            this._hopDelay = 300 + Math.random() * 500; 
            this._hopTimer = 0;
          }
          this._hopTimer += dt;
          if (this._hopTimer >= this._hopDelay) {
            this.velocity.y = -this.speed * 0.09; 
            this.velocity.x = Math.cos(angleToPlayer) * this.speed * 1.1; 
            this._hopDelay = 800 + Math.random() * 1000; 
            this._hopTimer = 0;
          }
        }
      }
    }
  }

  updateVirusHoverBehavior(dt, player) {
    this.hoverTimer += dt;
    switch(this.hoverState) {
      case 'approach':
        const dx = this.hoverPosition.x - this.position.x;
        const dy = this.hoverPosition.y - this.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 10) {
          this.velocity.x = (dx / dist) * 100;
          this.velocity.y = (dy / dist) * 50;
        } else {
          this.hoverState = 'hovering';
          this.hoverTimer = 0;
        }
        break;
      case 'hovering':
        this.velocity.x *= 0.9; // Slow horizontal movement
        // Bounce up and down
        const bounceHeight = 30 + Math.sin(this.hoverTimer * 0.008) * 20;
        this.velocity.y = Math.sin(this.hoverTimer * 0.01) * 200 - bounceHeight;
        // Face the player
        const playerDx = player.position.x - this.position.x;
        this.facing = playerDx > 0 ? 1 : -1;
        // Exit hover after 2-3 seconds
        if (this.hoverTimer > 2.0 + Math.random() * 1.0) {
          this.hoverState = 'exit';
        }
        break;
      case 'exit':
        this.hoverState = 'none';
        this.velocity.y = -this.speed * 0.1; // Swooping hop exit
        break;
    }
  }

  // 2. CORRUPTED BEHAVIOR (New: Chase -> Stop & Stare -> Chase)
  corruptedEntrance(dt) {
    this.velocity.y += 800 * dt;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    if (this.position.y >= 750) {
      this.position.y = 750;
      this.velocity.y = 0;
      this.velocity.x = 0;
      this.entranceComplete = true; 
      if (window.particleSystem) window.particleSystem.impact(this.position.x, this.position.y, '#00ff88', 20);
      if (window.renderer?.addScreenShake) window.renderer.addScreenShake(4, 150);
    }
    
    if (this.position.x < -100 || this.position.x > 2020) {
      this.position.x = window.clamp(this.position.x, 100, 3996);
      this.velocity.x *= -0.5;
    }
  }

  corruptedPersonalityBehavior(dt, player) {
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const angleToPlayer = Math.atan2(dy, dx);
    
    // Initialize behavior state
    if (!this._corruptedState) {
        this._corruptedState = 'chase'; 
        this._corruptedTimer = 0;
        this._nextPauseTime = Date.now() + 1000 + Math.random() * 2000;
    }
    
    const currentTime = Date.now();
    
    if (this._corruptedState === 'chase') {
        // Chase the player
        const speed = this.speed * 1.2; // Fast pursuit
        this.velocity.x = Math.cos(angleToPlayer) * speed;
        
        // Randomly decide to stop and stare
        if (currentTime > this._nextPauseTime) {
            this._corruptedState = 'pause';
            this._corruptedTimer = Date.now(); // Start pause timer
            // Pause up to 1 second
            this._pauseDuration = 200 + Math.random() * 800; 
            this.velocity.x = 0; // Stop immediately
            
            // Force idle animation
            if (this.spriteReady && this.sprite) {
                this.playAnimation('idle');
            }
        }
    } else if (this._corruptedState === 'pause') {
        // Frozen in place - NO TWITCHING
        this.velocity.x = 0;
        this.velocity.y = 0; 
        
        // Resume chase after duration
        if (Date.now() - this._corruptedTimer > this._pauseDuration) {
            this._corruptedState = 'chase';
            this._nextPauseTime = currentTime + 1000 + Math.random() * 2000; // Schedule next pause
        }
    }
  }

  // 3. ENHANCED FIREWALL BEHAVIOR (Proximity Attack with Full Animation)
  firewallPersonalityBehavior(dt, player) {
    const distToPlayer = window.distance(this.position.x, this.position.y, player.position.x, player.position.y);
    const currentTime = Date.now();
    
    // Init
    if (!this._behaviorInit) {
      this._behaviorInit = true;
      this._nextIdlePause = currentTime + 2000 + Math.random() * 4000;
      this._idleChance = 0.003;
      this._aggressionLevel = 1.5;
      this._idleAnimationTimer = 0;
      this._fullIdleChance = 0.015;
      this._inFullIdle = false;
      this._fullIdleDuration = 0;
      console.log('🔥 Enhanced Firewall behavior initialized');
    }
    
    this._aggressionLevel = Math.min(2.0, this._aggressionLevel + 0.00003);
    
    // Attack Logic
    if (distToPlayer <= this.proximityAttackRange && !this.isLunging && this.lungeCooldown <= 0) {
      if (Math.random() < 0.9) {
        this.startProximityAttack(player);
        }
    }
    if (this.lungeCooldown > 0) this.lungeCooldown -= dt;
    
    // Idle Pause Logic
    if (currentTime >= this._nextIdlePause && this.behaviorState === 'normal') {
        this.behaviorState = 'idle_pause';
        this.behaviorTimer = 0;
        this._idlePauseDuration = 1000 + Math.random() * 1500;
        this._nextIdlePause = currentTime + 4000 + Math.random() * 3000;
    }
    
    switch(this.behaviorState) {
        case 'normal':
            const dx = player.position.x - this.position.x;
            const walkSpeed = (60 + Math.random() * 20) * this._aggressionLevel;
            this.velocity.x = (dx > 0 ? 1 : -1) * walkSpeed;
            this.position.x += this.velocity.x * dt;
            this.position.y = 750;
            this.facing = dx > 0 ? 1 : -1;
            
            if (this.spriteReady && this.sprite) {
                const anim = this.sprite.getCurrentAnimation();
                if (!anim || !anim.includes('walk')) this.playAnimation('walk');
            }
            break;
            
        case 'idle_pause':
            this.velocity.x = 0;
            this.behaviorTimer += dt;
            this._idleAnimationTimer += dt;
            
            // Occasional FULL Idle Animation (plays ~5s loop)
            if (!this._inFullIdle && this._idleAnimationTimer > 0.3 && Math.random() < this._fullIdleChance) {
                this._inFullIdle = true;
                const loopCount = 1 + Math.floor(Math.random() * 3); // 1-3 loops
                this._fullIdleDuration = loopCount * 5.17; // seconds
                this._idleAnimationTimer = 0;
                this._idleAnimationTimer = 0;
                console.log('🔥 Firewall entering full idle');
            }
            
            if (this._inFullIdle) {
                if (this._idleAnimationTimer > this._fullIdleDuration) {
                    this._inFullIdle = false;
                    this._idleAnimationTimer = 0;
                }
                // Force play idle
                if (this.spriteReady && this.sprite) {
                    const anim = this.sprite.getCurrentAnimation();
                    if (!anim || !anim.includes('idle')) this.playAnimation('idle');
                }
            } else {
                // Normal short idle
                if (this.spriteReady && this.sprite) {
                    const anim = this.sprite.getCurrentAnimation();
                    if (!anim || !anim.includes('idle')) this.playAnimation('idle');
                }
            }
            
            // Exit pause if done (and not forced in full idle)
            if (!this._inFullIdle && this.behaviorTimer > (this._idlePauseDuration / 1000)) {
                this.behaviorState = 'normal';
                this.behaviorTimer = 0;
            }
            break;
            
        case 'lunging':
            this.behaviorTimer += dt;
            // Drag
            // Enhanced glide physics
            if (this.behaviorTimer < this.glideDuration) {
              // Active gliding phase
              this.velocity.x *= 0.95; // Maintain forward momentum
            } else {
              // Post-glide deceleration
              this.velocity.x *= 0.85;
            }
            
            // Gravity during attack
            if (this.position.y < 750) {
              this.velocity.y += 400 * dt;
            } else {
              this.velocity.y = 0;
              this.position.y = 750;
            }
            
            if (this.spriteReady && this.sprite) {
                const anim = this.sprite.getCurrentAnimation();
              if (!anim || !anim.includes('attack')) {
                this.playAnimation('attack');
              }
            }
            
            // Check for full animation completion
            const attackElapsed = (Date.now() - this.attackStartTime) / 1000;
            if (attackElapsed > this.fullAttackDuration) {
                this.behaviorState = 'normal';
                this.behaviorTimer = 0;
                this.isLunging = false;
                this.lungeCooldown = 3000 + Math.random() * 2000;
                this.attackStartTime = 0;
                console.log('🔥 Enhanced Firewall proximity attack completed');
            }
            
            // Safety timeout
            if (this.behaviorTimer > 5.5) {
              console.log('🔥 Enhanced Firewall attack timeout - forcing exit');
              this.behaviorState = 'normal';
              this.behaviorTimer = 0;
              this.isLunging = false;
              this.lungeCooldown = 2000;
              this.attackStartTime = 0;
            }
            break;
    }
  }
  
  // Enhanced proximity attack with full animation and 80px glide
  startProximityAttack(player) {
    this.isLunging = true;
    this.behaviorState = 'lunging';
    this.behaviorTimer = 0;
    this.attackStartTime = Date.now();
    
    // Calculate direction to player
    const dx = player.position.x - this.position.x;
    const direction = dx > 0 ? 1 : -1;
    this.facing = direction;
    
    // Execute 80px glide
    const glideVelocity = this.glideDistance / this.glideDuration;
    this.velocity.x = glideVelocity * direction;
    this.velocity.y = -50; // Small hop during glide
    
    // Play full attack animation
    if (this.spriteReady && this.sprite) {
      this.playAnimation('attack');
    }
    
    // Enhanced visual effects
    if (window.particleSystem) {
      window.particleSystem.enemySpawnEffect(this.position.x, this.position.y - 30, 'firewall');
    }
    if (window.renderer?.addScreenShake) {
      window.renderer.addScreenShake(6, 200);
    }
    
    console.log('🔥 Enhanced Firewall proximity attack initiated - 80px glide with full 4.9s animation');
  }

  // --- ANIMATION CONTROLLER ---
  forceCorrectAnimationState() {
    // Firewall logic handles its own animation in firewallPersonalityBehavior
    if (this.type === 'firewall') return;
    
    if (!this.spriteReady || !this.sprite) return;
    
    const currentAnim = this.sprite.getCurrentAnimation();
    let target = 'idle';
    
    if (this.type === 'virus') {
      target = 'idle';
    } else if (this.type === 'corrupted') {
      target = Math.abs(this.velocity.x) > 2 ? 'walk' : 'idle';
      if (target === 'walk') this.facing = this.velocity.x > 0 ? 1 : -1;
    }
    
    const map = {
      'virus': { 'idle': 'virus_idle_idle' },
      'corrupted': { 'idle': 'corrupted_idle_idle', 'walk': 'corrupted_walk_walk' }
    };
    
    if (map[this.type]) {
      const fullName = map[this.type][target];
      if (!currentAnim || !currentAnim.includes(target)) {
        this.playAnimation(target);
      }
    }
  }
  
  playAnimation(name) {
    if (!this.spriteReady || !this.sprite) return;
    
    // Explicit Firewall Animation
    if (this.type === 'firewall') {
        const map = {
            'idle': 'firewall_idle_idle',
            'walk': 'firewall_walk_walk',
            'attack': 'firewall_attack_default'
        };
        const fullName = map[name] || name;
        const loop = name !== 'attack';
        this.sprite.play(fullName, loop);
        this.currentAnimation = fullName;
        return;
    }
    
    // Generic Animation - NO DELAY
    const map = {
      'virus': { 'idle': 'virus_idle_idle' },
      'corrupted': { 'idle': 'corrupted_idle_idle', 'walk': 'corrupted_walk_walk' }
    };
    
    const fullName = map[this.type][name] || name;
    const current = this.sprite.getCurrentAnimation();
    
    if (current === fullName && name !== 'idle') return;
    
    // FIX: Removed setTimeout delay that was causing race conditions
    const loop = !fullName.includes('attack');
    const speed = fullName.includes('attack') ? 1.2 : (name === 'idle' ? 1.25 : 1.0);
    this.sprite.play(fullName, loop, 0, { speed });
    this.currentAnimation = fullName;
  }
  
  drawSprite(ctx) {
    ctx.save();
    let drawY = this.position.y - 1 + 70;
    let scale = 0.8;
    
    if (this.type === 'corrupted') {
      drawY = this.position.y - 1 + 60;
      scale = 1.2;
    } else if (this.type === 'firewall') {
      drawY = this.position.y;
      scale = 2.0;
      if (this.currentAnimation === 'firewall_idle_idle') { scale *= 1.13; drawY -= 14; } 
      if (this.currentAnimation === 'firewall_attack_default') { scale *= 1.36; drawY -= 26; }
    }
    
    this.sprite.draw(ctx, this.position.x, drawY, {
      scale: scale,
      flipH: this.facing === -1
    });
    ctx.restore();
  }
  
  async initSprite() {
    try {
      const charMap = {
        'virus': 'virus_virus',
        'corrupted': 'corrupted_corrupted',
        'firewall': 'firewall_firewall'
      };
      
      if (!window.MakkoEngine?.isLoaded()) {
        setTimeout(() => this.initSprite(), 100);
        return;
      }
      
      this.sprite = window.MakkoEngine.sprite(charMap[this.type]);
      
      if (this.sprite && this.sprite.isLoaded()) {
        this.spriteReady = true;
        this.playAnimation('idle');
      } else {
        setTimeout(() => this.initSprite(), 100);
      }
    } catch (e) {
      console.error(`Sprite init failed for ${this.type}`);
      this.spriteReady = false;
    }
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    if (window.particleSystem) {
      let particleColor = this.type === 'corrupted' ? 'corrupted' : this.type;
      window.particleSystem.damageEffect(this.position.x, this.position.y - this.height/2, particleColor, 10);
    }
    
    if (this.health <= 0) {
      this.active = false;
      
      // Play defeat sound based on enemy type
      if (window.audioSystem) {
        if (this.type === 'virus') {
          window.audioSystem.playVirusDefeatSound();
        } else if (this.type === 'corrupted') {
          window.audioSystem.playEnemyDefeatSound('corrupted');
        } else if (this.type === 'firewall') {
          window.audioSystem.playEnemyDefeatSound('firewall');
        }
      }

      if (window.particleSystem) {
        let particleColor = this.type === 'corrupted' ? 'corrupted' : this.type;
        window.particleSystem.explosion(this.position.x, this.position.y - this.height/2, particleColor, 25);
      }
      
      if (window.gameState) {
        const points = this.getPointValue();
        window.gameState.score += points;
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
    if (['virus', 'corrupted', 'firewall', 'jammer'].includes(this.type) && this.spriteReady && this.sprite) {
      
      let drawScale = 0.8; 
      let drawOffset = 60;
      
      if (this.type === 'corrupted') {
        drawScale = 1.2;
        drawOffset = 80;
      } else if (this.type === 'firewall') {
        if (this.currentAnimation === 'firewall_idle_idle') {
          drawScale = 2.0 * 1.13; 
          drawOffset = 100 - 14; 
        } else if (this.currentAnimation === 'firewall_walk_walk') {
          drawScale = 2.0;
          drawOffset = 100 + 4;
        } else if (this.currentAnimation === 'firewall_attack_default') {
          drawScale = 2.0 * 1.3;
          drawOffset = 100 - 36;
        } else {
          drawScale = 2.0;
          drawOffset = 100;
        }
      }
      
      const worldHitbox = this.sprite.getHitboxWorld(this.position.x, this.position.y, {
        scale: drawScale,
        flipH: this.facing === -1
      });
      
      if (worldHitbox) {
        let marginReduction = 0.05;
        if (this.type === 'virus') marginReduction = 0.15;
        else if (this.type === 'corrupted') marginReduction = 0.12;
        else if (this.type === 'firewall') marginReduction = 0.08;
        
        const tightWidth = worldHitbox.width * (1 - marginReduction * 2);
        const tightHeight = worldHitbox.height * (1 - marginReduction * 2);
        
        return {
          x: worldHitbox.x + (worldHitbox.width - tightWidth) / 2,
          y: worldHitbox.y + (worldHitbox.height - tightHeight) / 2,
          width: tightWidth,
          height: tightHeight
        };
      }
    }
    
    let marginReduction = 0.05;
    let topExtension = 0;
    if (this.type === 'virus') {
      marginReduction = 0.08;
      topExtension = 15;
    }
    
    const tightWidth = this.width * (1 - marginReduction * 2);
    const tightHeight = this.height * (1 - marginReduction * 2);
    
    return {
      x: this.position.x - tightWidth/2,
      y: this.position.y - tightHeight - topExtension,
      width: tightWidth,
      height: tightHeight + topExtension
    };
  }
  
  getCollisionBox() {
    const hitbox = this.getHitbox();
    const collisionMargin = 0.05;
    const collisionWidth = hitbox.width * (1 - collisionMargin * 2);
    const collisionHeight = hitbox.height * (1 - collisionMargin * 2);
    
    return {
      x: hitbox.x + (hitbox.width - collisionWidth) / 2,
      y: hitbox.y + (hitbox.height - collisionHeight) / 2,
      width: collisionWidth,
      height: collisionHeight
    };
  }

  draw(ctx) {
    if (!this.active) return;
    if (!ctx) return;

    ctx.save();
    if (this.type === 'firewall' && this.alpha !== undefined) ctx.globalAlpha = this.alpha;
    
    if (['virus', 'corrupted', 'firewall', 'jammer'].includes(this.type) && this.spriteReady && this.sprite) {
      this.drawSprite(ctx);
      if (this.health < this.maxHealth) {
        let healthBarY = this.position.y - this.height + 50;
        if (this.type === 'firewall') healthBarY += 40;
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(this.position.x - this.width, healthBarY, this.width * 2 * (this.health / this.maxHealth), 4);
      }
    } else {
      const bodyY = this.position.y - this.height;
      const bodyX = this.position.x - this.width/2;
      ctx.fillStyle = this.color;
      // Don't draw pink squares for jammers
      if (this.type !== 'jammer') {
        ctx.fillRect(bodyX, bodyY, this.width, this.height);
      } else {
        // Show loading indicator for jammer instead
        ctx.fillStyle = '#ff00ff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('JAMMER LOADING...', this.position.x, this.position.y - this.height - 20);
        
        // Draw placeholder jammer indicator
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          this.position.x - this.width/2, 
          this.position.y - this.height, 
          this.width, 
          this.height
        );
      }
    }
    ctx.restore();
  }
  
  getDrawLayer() {
    if (this.type === 'virus') return 1;
    if (this.type === 'corrupted') return -1; // Render behind jammers
    if (this.type === 'firewall') return -1; // Render behind jammers
    if (this.type === 'jammer') return 0; // Render in front of corrupted/firewall but behind player/virus
    return 1;
  }
};

// ==========================================
// 2. JAMMER ENEMY CLASS (Moved Below Base)
// ==========================================
// Jammer Enemy class - stationary enemy with rhythm damage only
window.JammerEnemy = class JammerEnemy extends window.Enemy {
  constructor(x, y) {
    // Call parent constructor with 'jammer' type
    super(x, y, 'jammer');
    
    // Override jammer-specific properties
    this.setupJammerProperties();
    
    // Initialize sprite
    setTimeout(() => {
      this.initSprite();
    }, 100);
  }
  
  setupJammerProperties() {
    // Jammer-specific stats
    this.width = 256;
    this.height = 219;
    this.speed = 0; // Stationary
    this.damage = 0; // No contact damage
    this.color = '#ff00ff';
    this.health = 16; // Doubled from 8 to 16 health
    this.maxHealth = 16;
    
    // Jammer is always ready (no entrance animation)
    this.entranceComplete = true;
    this.state = 'active';
    
    // Visual properties
    this.drawScale = 0.7;  // Reduced from 0.9 (additional 20% smaller)
    this.drawOffset = 190;  // 320px lower (closer to ground, moved up 80px total)
    
    // Audio properties
    this.audioElement = null;
    this.baseVolume = 0.3;
    this.maxDistance = 800; // Maximum hearing distance
    this.audioUrl = 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/9db7167d-8742-41cd-aae1-1206e230970c.mp3';
    this.audioInitialized = false;
  }
  
  // Override setupByType to handle jammer type
  setupByType() {
    if (this.type === 'jammer') {
      // Properties already set in setupJammerProperties()
      return;
    }
    // Call parent setup for other types
    super.setupByType();
  }
  
  // Override getMaxHealth for jammer
  getMaxHealth() {
    if (this.type === 'jammer') return 16;
    return super.getMaxHealth();
  }
  
  // Override updateAI - jammer does nothing (stationary)
  updateAI(player, dt) {
    if (this.type === 'jammer') {
      // Jammer is stationary - no AI behavior
      this.velocity.x = 0;
      this.velocity.y = 0;
      return;
    }
    // Call parent AI for other types
    super.updateAI(player, dt);
  }
  
  // Override update to make jammer completely immovable
  update(deltaTime, player) {
    if (this.type === 'jammer') {
      // Jammer never moves - completely stationary
      this.velocity.x = 0;
      this.velocity.y = 0;
      
      // Only update sprite animation
      if (this.spriteReady && this.sprite) {
        this.sprite.update(deltaTime);
      }
      
      // Update proximity-based audio
      if (this.updateProximityAudio) {
        this.updateProximityAudio(player);
      }
      return;
    }
    // Call parent update for other types
    super.update(deltaTime, player);
  }
  
  // Override takeDamage - only rhythm damage allowed
  takeDamage(amount, source = 'rhythm') {
    if (this.type === 'jammer') {
      // Only allow rhythm damage
      if (source !== 'rhythm') {
        console.log('Jammer only takes rhythm damage!');
        return;
      }
      
      this.health -= amount;
      console.log(`📡 Jammer took ${amount} damage! Health: ${this.health}/${this.maxHealth}`);
      
      if (window.particleSystem) {
        window.particleSystem.damageEffect(this.position.x, this.position.y - this.height/2, 'jammer', 15);
      }
      
      if (this.health <= 0) {
        this.active = false;
        if (window.particleSystem) {
          window.particleSystem.explosion(this.position.x, this.position.y - this.height/2, 'jammer', 40);
        }
        if (window.gameState) {
          window.gameState.score += 500; // High point value for jammer
        }
        
        // Enhanced electronic explosion effects
        if (window.particleSystem) {
          // Main explosion
          window.particleSystem.explosion(this.position.x, this.position.y - this.height/2, 'jammer', 60);
          
          // Electronic particle burst
          for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 300 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            if (window.particleSystem.createParticle) {
              window.particleSystem.createParticle(
                this.position.x, 
                this.position.y - this.height/2, 
                vx, vy, 
                '#ff00ff', 
                1500 + Math.random() * 500,
                4 + Math.random() * 4
              );
            }
          }
          
          // Digital fragment particles
          for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 150;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 100;
            
            if (window.particleSystem.createParticle) {
              window.particleSystem.createParticle(
                this.position.x, 
                this.position.y - this.height/2, 
                vx, vy, 
                '#00ffff', 
                2000 + Math.random() * 1000,
                2 + Math.random() * 2
              );
            }
          }
        }
        
        // Screen effects
        if (window.renderer) {
          if (window.renderer.addScreenShake) {
            window.renderer.addScreenShake(15, 800);
          }
          if (window.renderer.addGlitch) {
            window.renderer.addGlitch(0.8, 1200);
          }
        }
        
        // Stop jammer audio if it's playing
        if (this.audioElement) {
          this.audioElement.pause();
          this.audioElement = null;
        }
        
        // Remove jammer from arrow tracking
        if (window.jammerArrowIndicator) {
          window.jammerArrowIndicator.setTarget(null);
        }
        
        console.log('📡💥 Broadcast Jammer destroyed with electronic explosion!');
      }
      return;
    }
    // Call parent takeDamage for other types
    super.takeDamage(amount);
  }
  
  // Override sprite initialization for jammer
  async initSprite() {
    if (this.type === 'jammer') {
      try {
        if (!window.MakkoEngine?.isLoaded()) {
          setTimeout(() => this.initSprite(), 100);
          return;
        }
        
        this.sprite = window.MakkoEngine.sprite('broadcast_jammer_broadcastjammer');
        
        if (this.sprite && this.sprite.isLoaded()) {
          this.spriteReady = true;
          this.playAnimation('idle');
        } else {
          setTimeout(() => this.initSprite(), 100);
        }
      } catch (e) {
        console.error('Jammer sprite init failed:', e);
        this.spriteReady = false;
      }
      return;
    }
    // Call parent initSprite for other types
    super.initSprite();
  }
  
  // Override animation playing for jammer
  playAnimation(name) {
    if (this.type === 'jammer') {
      if (!this.spriteReady || !this.sprite) return;
      
      const animMap = {
        'idle': 'broadcast_jammer_idle_idle'
      };
      
      const fullName = animMap[name] || name;
      const current = this.sprite.getCurrentAnimation();
      
      if (current === fullName) return;
      
      this.sprite.play(fullName, true); // Jammer always loops idle
      this.currentAnimation = fullName;
      return;
    }
    // Call parent playAnimation for other types
    super.playAnimation(name);
  }
  
  // Override drawing for jammer
  drawSprite(ctx) {
    if (this.type === 'jammer') {
      ctx.save();
      const drawY = this.position.y + this.drawOffset;
      
      this.sprite.draw(ctx, this.position.x, drawY, {
        scale: this.drawScale,
        flipH: this.facing === -1
      });
      
      // Draw health bar if damaged
      if (this.health < this.maxHealth) {
        const healthBarY = this.position.y - this.height + 100;
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(this.position.x - this.width/2, healthBarY, this.width * (this.health / this.maxHealth), 6);
        
        // Health bar border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.position.x - this.width/2, healthBarY, this.width, 6);
      }
      
      ctx.restore();
      return;
    }
    // Call parent drawSprite for other types
    super.drawSprite(ctx);
  }
  
  // Override hitbox for jammer
  getHitbox() {
    if (this.type === 'jammer' && this.spriteReady && this.sprite) {
      const worldHitbox = this.sprite.getHitboxWorld(this.position.x, this.position.y, {
        scale: this.drawScale,
        flipH: this.facing === -1
      });
      
      if (worldHitbox) {
        // Tighten hitbox for better gameplay
        const marginReduction = 0.1;
        const tightWidth = worldHitbox.width * (1 - marginReduction * 2);
        const tightHeight = worldHitbox.height * (1 - marginReduction * 2);
        
        return {
          x: worldHitbox.x + (worldHitbox.width - tightWidth) / 2,
          y: worldHitbox.y + (worldHitbox.height - tightHeight) / 2,
          width: tightWidth,
          height: tightHeight
        };
      }
    }
    
    // Fallback hitbox
    return {
      x: this.position.x - this.width/2,
      y: this.position.y - this.height,
      width: this.width,
      height: this.height
    };
  }
  
  // Override point value for jammer
  getPointValue() {
    if (this.type === 'jammer') return 500;
    return super.getPointValue();
  }
  
  // Override draw layer for jammer (render behind other enemies)
  getDrawLayer() {
    if (this.type === 'jammer') return 0; // Render in front of corrupted/firewall but behind player/virus
    return super.getDrawLayer();
  }
};

// ==========================================
// 3. ENEMY MANAGER
// ==========================================
window.EnemyManager = class EnemyManager {
  constructor() {
    this.enemies = [];
    this.minEnemies = 2;
    this.maxEnemies = 8;
    this.spawnTimer = 0;
    this.nextSpawnTime = 800 + Math.random() * 1200;
    this.defeatedCount = 0;
    
    this.spawnLocations = this.generateSpawnLocations();
    this.lastSpawnPosition = null;
    this.spawnAvoidanceRadius = 150;
    
    this.lastFirewallSpawnTime = 0;
    this.firewallSpawnCooldown = 4000;
    this.activeFirewallCount = 0;
    
    this.spawnFlowState = 'building';
    this.flowTimer = 0;
    this.enemySpawnWaves = 0;
    this.baseSpawnRate = 1.0;
    
    this.currentSpawnZone = 'right';
    this.zoneRotationTimer = 0;
    this.zoneRotationInterval = 15000;

    // Crowd mechanics system (Restored from previous version to prevent crash)
    this.crowdGroups = [];
    this.crowdCheckTimer = 0;
    this.crowdCheckInterval = 500;
  }

  update(deltaTime, player) {
    if (!player) return;

    this.updateSpawnFlow(deltaTime);
    this.updateSpawnZones(deltaTime);
    
    const tutorial = window.tutorialSystem;
    const tutorialWaiting = tutorial && tutorial.isActive() && tutorial.storyChapter === 1 && tutorial.combatEnemiesPaused;

    // Update Enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, player);
      
      // Tutorial Freeze Logic
      if (enemy.type === 'virus' && tutorialWaiting && enemy.active) {
        if (enemy.state !== 'patrol') enemy.state = 'patrol';
        if (enemy.position.y > 750) enemy.position.y = 750;
        const playerRef = window.player;
        if (playerRef && enemy.entranceComplete) {
           enemy.velocity.x = Math.sin(Date.now() / 1000 + enemy.phaseOffset) * 20;
        }
      }
    });
    
    this.checkEnemyCollisions();
    this.checkCollisions(player);
    
    // Clean up dead enemies
    const newlyDefeated = this.enemies.filter(e => !e.active && e.health <= 0);
    
    if (newlyDefeated.length > 0) {
        this.defeatedCount += newlyDefeated.length;
        
        if (window.sector1Progression && typeof window.sector1Progression.onEnemyDefeated === 'function') {
             newlyDefeated.forEach(() => window.sector1Progression.onEnemyDefeated());
        }
        
        // Jammer spawning is now handled exclusively by objectives.js
             if (window.objectivesSystem && typeof window.objectivesSystem.spawnBroadcastJammer === 'function') {
                 // window.objectivesSystem.spawnBroadcastJammer(); // Removed - handled by objectives.js
             }
        }
        
        const tutorialDefeated = newlyDefeated.filter(e => e._isTutorialEnemy === true);
        if (tutorialDefeated.length > 0 && tutorial?.isActive() && tutorial.storyChapter === 1) {
            tutorial._tutorialEnemiesDefeated = (tutorial._tutorialEnemiesDefeated || 0) + tutorialDefeated.length;
            if (tutorial._tutorialEnemiesDefeated >= 3) {
                tutorial.checkObjective('combat');
            }
        }
    
    
    this.enemies = this.enemies.filter(e => e.active);
    this.activeFirewallCount = this.enemies.filter(e => e.type === 'firewall').length;
    
    // ENHANCED Spacing Check
    if (!this.hasAdequateSpacing(player)) return;
    
    const isMainGame = !tutorial || !tutorial.isActive();
    if (isMainGame && this.shouldSpawnEnemy(this.enemies.length)) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.nextSpawnTime) {
            this.spawnFlowEnemy(player);
            this.spawnTimer = 0;
            this.nextSpawnTime = 1000 + Math.random() * 2000;
        }
    }

    // Update crowd mechanics
    this.updateCrowdMechanics(deltaTime, player);
  }

  checkEnemyCollisions() {
    const active = this.enemies;
    for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
            const e1 = active[i];
            const e2 = active[j];
            const box1 = e1.getCollisionBox();
            const box2 = e2.getCollisionBox();
            
            if (this.simpleAABBcollision(box1, box2)) {
                // Skip collision if either enemy is a jammer (jammers are immovable)
                if (e1.type === 'jammer' || e2.type === 'jammer') {
                    return;
                }
                const e1CX = box1.x + box1.width/2;
                const e1CY = box1.y + box1.height/2;
                const e2CX = box2.x + box2.width/2;
                const e2CY = box2.y + box2.height/2;
                
                const dx = e2CX - e1CX;
                const dy = e2CY - e1CY;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                let minSep = 40, sepForce = 0.8;
                if (e1.type === e2.type) {
                    minSep = e1.type === 'firewall' ? 160 : 55;
                    sepForce = 1.0;
                }
                
                if (dist < minSep && dist > 0) {
                    const force = (minSep - dist) * sepForce;
                    const pushX = (dx/dist) * force;
                    const pushY = (dy/dist) * force * 0.4;
                    
                    e1.position.x -= pushX;
                    e1.position.y -= pushY;
                    e2.position.x += pushX;
                    e2.position.y += pushY;
                    
                    e1.velocity.x *= 0.7;
                    e2.velocity.x *= 0.7;
                }
            }
        }
    }
  }

  checkCollisions(player) {
      if (player.controlsDisabled || player.isStomping) return;
      
      const playerBox = player.getHitbox();
      
      this.enemies.forEach(enemy => {
          if (!enemy.active) return;
          const enemyBox = enemy.getHitbox();
          
          // Push player away
          const dx = player.position.x - enemy.position.x;
          const dy = player.position.y - enemy.position.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 0 && dist < 60) {
              const push = (60 - dist) * 0.5;
              player.position.x += (dx/dist) * push;
              player.position.y += (dy/dist) * push * 0.5;
          }
          
          // Check for Stomp (skip jammers - they only take rhythm damage)
          if (enemy.type !== 'jammer') {
            const playerBottom = playerBox.y + playerBox.height;
            const enemyTop = enemyBox.y;
            const enemyTopHalf = enemyBox.y + enemyBox.height/2;
            const isStompPos = playerBottom > enemyTop && playerBottom < enemyTopHalf;
            const isMovingDown = player.velocity.y >= -100;
            
            if (isStompPos && isMovingDown && this.simpleAABBcollision(playerBox, enemyBox)) {
                enemy.takeDamage(999);
                player.velocity.y = -550;
                player.velocity.x = (dx/dist) * 300;
                if (window.particleSystem) window.particleSystem.impact(enemy.position.x, enemy.position.y, '#00ffff', 20);
                player.invulnerableUntil = Date.now() + 400;
                return;
            }
          }
          
          // Check for Damage (skip jammers - they deal no contact damage)
          if (enemy.type !== 'jammer' && this.simpleAABBcollision(playerBox, enemyBox)) {
              if (!player.invulnerableUntil || Date.now() > player.invulnerableUntil) {
                  if (!enemy.lastPlayerHitTime || Date.now() - enemy.lastPlayerHitTime > 1500) {
                      enemy.lastPlayerHitTime = Date.now();
                      player.takeDamageWithKnockback(enemy.damage, (dx/dist)*450, -300, enemy.position);
                  }
              }
          }
      });
  }

  simpleAABBcollision(r1, r2) {
      return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
             r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
  }

  hasAdequateSpacing(player) {
    const pX = player?.position?.x || 960;
    let tooClose = 0;
    this.enemies.forEach(e => {
        if (e.active && window.distance(e.position.x, e.position.y, pX, 750) < 400) tooClose++;
    });
    return tooClose < 2;
  }

  generateSpawnLocations() {
      const locs = [];
      for(let i=0; i<4; i++) locs.push({x: 50, y: 200+i*150, edge: 'left'});
      for(let i=0; i<4; i++) locs.push({x: 4046, y: 200+i*150, edge: 'right'});
      return locs;
  }
  
  updateSpawnFlow(dt) {
      this.flowTimer += dt;
      const count = this.enemies.length;
      if (this.spawnFlowState === 'building' && count >= this.maxEnemies -1) {
          this.spawnFlowState = 'peak';
          this.flowTimer = 0;
      } else if (this.spawnFlowState === 'peak' && this.flowTimer > 10000) {
          this.spawnFlowState = 'sustaining';
          this.flowTimer = 0;
      } else if (this.spawnFlowState === 'sustaining' && this.defeatedCount > this.enemySpawnWaves * 3 + 2) {
          this.spawnFlowState = 'recovery';
          this.flowTimer = 0;
      } else if (this.spawnFlowState === 'recovery' && this.flowTimer > 8000) {
          this.spawnFlowState = 'building';
          this.flowTimer = 0;
          this.enemySpawnWaves++;
      }
  }
  
  updateSpawnZones(dt) {
      this.zoneRotationTimer += dt;
      if (this.zoneRotationTimer > this.zoneRotationInterval) {
          const zones = ['left', 'right', 'both', 'center'];
          this.currentSpawnZone = zones[Math.floor(Math.random() * zones.length)];
          this.zoneRotationTimer = 0;
      }
  }
  
  shouldSpawnEnemy(count) {
      if (count >= this.maxEnemies) return false;
      if (this.spawnFlowState === 'recovery') return count < 2;
      return true;
  }
  
  spawnFlowEnemy(player) {
      if (this.enemies.length >= this.maxEnemies) return;
      
      const types = ['virus', 'corrupted', 'firewall'];
      let type = types[Math.floor(Math.random() * types.length)];
      
      // Enhanced firewall spawning - all firewalls now use enhanced behavior
      if (type === 'firewall') {
        if (this.activeFirewallCount >= 1) { // Only 1 firewall at a time
          type = 'corrupted';
        } else {
          this.lastFirewallSpawnTime = Date.now();
          console.log('🔥 Spawning enhanced firewall with built-in proximity attack system');
        }
      }
      
      let x, y = 200;
      if (type === 'virus') {
          x = -50; // Always spawn from left, off-screen
          y = -50;
      } else {
          if (type === 'firewall') x = 4500;
          else x = Math.random() > 0.5 ? 100 : 3900;
          
          if (Math.abs(x - player.position.x) < 600) {
              x = player.position.x + (x > player.position.x ? 600 : -600);
          }
      }
      
      const enemy = new window.Enemy(x, y, type);
      if (type === 'virus') {
        enemy._dropEdge = 'top';
        enemy.entranceComplete = false;
        enemy.state = 'entrance';
        enemy.velocity.x = 50 + Math.random() * 30; // Randomize to prevent overlap
        enemy.velocity.y = 120 + Math.random() * 30;
        enemy.isOnGround = false;
      }
      this.enemies.push(enemy);
  }

  getActiveEnemies() { return this.enemies; }
  draw(ctx) { 
    const sorted = [...this.enemies].sort((a, b) => a.getDrawLayer() - b.getDrawLayer());
    sorted.forEach(e => e.draw(ctx)); 
  }
  
  spawnEnemy() { this.spawnFlowEnemy(window.player || {position:{x:960,y:750}}); }
  
  spawnEnemyAt(x, y) {
    if (this.enemies.length >= this.maxEnemies) return;
    const types = ['virus', 'corrupted'];
    const type = types[Math.floor(Math.random() * types.length)];
    const enemy = new window.Enemy(x, y, type);
    if (type === 'virus' && y < 500) {
        enemy._dropEdge = 'top';
        enemy.entranceComplete = false;
        enemy.state = 'entrance';
        enemy.velocity.y = 120;
        enemy.isOnGround = false;
    }
    this.enemies.push(enemy);
  }
  
  checkPlayerAttacks(player, rhythmResult = null) {
    if (!player || !window.rhythmSystem || !window.rhythmSystem.isActive()) return;
    let attackRadius = window.rhythmSystem.getDamageRadius ? window.rhythmSystem.getDamageRadius() : 300;
    
    this.enemies.forEach(enemy => {
      if (!enemy.active) return;
      const dist = window.distance(player.position.x, player.position.y, enemy.position.x, enemy.position.y);
      if (dist <= attackRadius) {
        let damage = 1;
        if (rhythmResult) {
          if (rhythmResult.timing === 'perfect') damage = 3;
          else if (rhythmResult.timing === 'excellent') damage = 2;
        }
        if (window.rhythmSystem.combo > 0) damage = Math.floor(damage * (1 + window.rhythmSystem.combo * 0.1));
        // Pass 'rhythm' source for jammer damage validation
        if (enemy.type === 'jammer') {
          // Jammers always take exactly 1 damage per hit (no combo multiplier, no timing bonuses)
          enemy.takeDamage(1, 'rhythm');
        } else {
          enemy.takeDamage(damage);
        }
        if (window.particleSystem) window.particleSystem.impact(enemy.position.x, enemy.position.y, '#00ffff', 20);
      }
    });
  }

  // Restored Crowd Mechanics methods
  updateCrowdMechanics(deltaTime, player) {
    this.crowdCheckTimer += deltaTime;
    if (this.crowdCheckTimer >= this.crowdCheckInterval) {
      this.crowdCheckTimer = 0;
      this.detectCrowds();
    }
    
    // Apply crowd behaviors
    this.crowdGroups.forEach(group => {
      this.applyCrowdBehavior(group, player, deltaTime);
    });
  }
  
  detectCrowds() {
    this.crowdGroups = [];
    const activeEnemies = this.enemies.filter(e => e.active && e.entranceComplete);
    const processed = new Set();
    
    activeEnemies.forEach(enemy => {
      if (processed.has(enemy)) return;
      
      const group = this.findNearbyEnemies(enemy, activeEnemies, 120); 
      if (group.length >= 3) { 
        this.crowdGroups.push(group);
        group.forEach(e => processed.add(e));
        this.applyCrowdEffects(group);
      }
    });
  }
  
  findNearbyEnemies(centerEnemy, allEnemies, radius) {
    const group = [centerEnemy];
    allEnemies.forEach(enemy => {
      if (enemy === centerEnemy) return;
      const dist = window.distance(centerEnemy.position.x, centerEnemy.position.y, enemy.position.x, enemy.position.y);
      if (dist <= radius) {
        group.push(enemy);
      }
    });
    return group;
  }
  
  applyCrowdEffects(group) {
    group.forEach(enemy => {
      enemy._inCrowd = true;
      enemy._crowdSize = group.length;
      
      if (group.length >= 5) {
        enemy._crowdSpeed = 0.7; 
        enemy._crowdAggression = 1.5; 
      } else if (group.length >= 3) {
        enemy._crowdSpeed = 0.85;
        enemy._crowdAggression = 1.2;
      }
      
      if (window.particleSystem && Math.random() < 0.1) {
        // visual indicator removed to reduce noise, logic remains
      }
    });
  }
  
  applyCrowdBehavior(group, player, deltaTime) {
    if (group.length < 3) return;
    
    const groupCenter = {
      x: group.reduce((sum, e) => sum + e.position.x, 0) / group.length,
      y: group.reduce((sum, e) => sum + e.position.y, 0) / group.length
    };
    
    const distToPlayer = window.distance(groupCenter.x, groupCenter.y, player.position.x, player.position.y);
    
    group.forEach((enemy, index) => {
      if (!enemy._inCrowd) return;
      
      const time = Date.now() / 1000;
      const phaseShift = (index / group.length) * Math.PI * 2;
      
      if (distToPlayer < 400) {
        const angleToPlayer = Math.atan2(player.position.y - groupCenter.y, player.position.x - groupCenter.x);
        const spreadAngle = angleToPlayer + Math.sin(time + phaseShift) * 0.3;
        
        if (enemy.type === 'virus') {
          enemy.velocity.x = Math.cos(spreadAngle) * enemy.speed * (enemy._crowdSpeed || 1) * 1.3;
          if (Math.sin(time * 2 + phaseShift) > 0.8 && enemy.isOnGround) {
            enemy.velocity.y = -enemy.speed * 0.15;
          }
        } else if (enemy.type === 'corrupted') {
          enemy.velocity.x = Math.cos(spreadAngle) * enemy.speed * (enemy._crowdSpeed || 1) * 1.2;
        }
        
        if (enemy._crowdAggression && Math.random() < 0.01 * enemy._crowdAggression) {
          enemy.speed *= 1.2;
          setTimeout(() => { if (enemy.speed) enemy.speed /= 1.2; }, 2000);
        }
      } else {
        const formationAngle = Math.atan2(enemy.position.y - groupCenter.y, enemy.position.x - groupCenter.x);
        const orbitSpeed = 0.5;
        
        enemy.velocity.x = Math.cos(formationAngle + Math.PI/2) * enemy.speed * orbitSpeed;
        enemy.velocity.y = Math.sin(formationAngle + Math.PI/2) * enemy.speed * orbitSpeed * 0.3;
      }
    });
  }
  
  clear() {
    this.enemies = [];
    this.defeatedCount = 0;
    this.spawnTimer = 0;
    this.spawnFlowState = 'building';
    this.crowdGroups = [];
    console.log('✓ Enemy Manager cleared');
  }
};

// Global Initialization
function createEnemyManager() {
  if (window.Vector2D && window.distance && window.clamp && window.randomRange) {
    window.enemyManager = new window.EnemyManager();
    console.log("✅ Enemy Manager Initialized");
  } else {
    console.warn('Enemy manager dependencies not ready, retrying...');
    setTimeout(createEnemyManager, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createEnemyManager);
} else {
  createEnemyManager();
}