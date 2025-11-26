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
    
    // MakkoEngine sprite properties
    this.sprite = null;
    this.spriteReady = false;
    this.currentAnimation = null;
    this.facing = 1; // 1 for right, -1 for left
    
    // Movement variations
    this.phaseOffset = Math.random() * Math.PI * 2;
    this.movementSeed = Math.random() * 1000;
    this.personalityTimer = Math.random() * 1000;
    
    // Collision cooldowns
    this.lastCollisionTime = 0;
    this.collisionCooldown = 200;
    this.recentlyCollidedWith = new Set();
    
    // Spawn protection
    this.spawnTime = Date.now();
    this.spawnProtectionDuration = 2000;
    
    // Initialize sprite
    if (['virus', 'corrupted', 'firewall'].includes(this.type)) {
      setTimeout(() => {
        this.initSprite();
      }, 100);
    }
    
    // Trigger entrance animation
    this.startEntrance();
    
    if (window.particleSystem) {
      console.log(`🌟 Creating ${this.type} spawn effect at (${this.position.x}, ${this.position.y})`);
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
        this.detectionRadius = 300;
        break;
        
      case 'corrupted':
        this.width = 64;
        this.height = 77;
        this.speed = 200;
        this.damage = 2;
        this.color = '#00ff88';
        this.patrolRadius = 80;
        this.detectionRadius = 400;
        break;
        
      case 'firewall':
        this.width = 120;
        this.height = 120;
        this.speed = 25;
        this.damage = 1;
        this.color = '#ff9900';
        this.patrolRadius = 100;
        this.detectionRadius = 300;
        this.attackAnimationDuration = 6000;
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

  performCoordinatedJump() {
    if (this.type !== 'virus' || !this.isOnGround) return;
    
    const nearbyEnemies = window.enemyManager?.getActiveEnemies().filter(other => 
      other !== this && 
      other.type === 'virus' && 
      other.isOnGround &&
      window.distance(this.position.x, this.position.y, other.position.x, other.position.y) < 100
    ) || [];
    
    if (nearbyEnemies.length > 0) {
      const targetEnemy = nearbyEnemies[0];
      const dx = targetEnemy.position.x - this.position.x;
      const distance = Math.abs(dx);
      
      if (distance > 30) {
        this.velocity.y = -this.speed * 0.08;
        const jumpSpeed = Math.abs(dx) * 0.004;
        this.velocity.x = dx > 0 ? jumpSpeed : -jumpSpeed;
        this.isCoordinatedJump = true;
        this.jumpTarget = targetEnemy;
        
        const moveDirection = dx > 0 ? -1 : 1;
        targetEnemy.velocity.x = moveDirection * this.speed * 0.15;
      } else {
        this.velocity.y = -this.speed * 0.06;
      }
    } else {
      this.velocity.y = -this.speed * 0.06;
    }
  }

  update(deltaTime, player) {
    if (!this.active) return;
    
    const dt = deltaTime / 1000;
    this.stateTimer += deltaTime;
    this.animationTime += deltaTime;
    
    // Track if enemy is on ground
    this.isOnGround = this.position.y >= 750;
    
    // Gravity for falling viruses
    if (this.type === 'virus' && this.position.y < 750) {
      this.velocity.y += 600 * dt;
      this.position.y += this.velocity.y * dt;
      if (this.position.y >= 750) {
        this.position.y = 750;
        this.velocity.y = 0;
      }
    }
    
    // Update AI
    this.updateAI(player, dt);
    
    // Update sprite animation
    if (['virus', 'corrupted', 'firewall'].includes(this.type) && this.spriteReady && this.sprite) {
      this.updateSpriteAnimation(deltaTime);
      
      // Emergency animation check
      const currentAnim = this.sprite.getCurrentAnimation();
      if (!currentAnim) {
        this.playAnimation('idle');
      }
    }
    
    // Physics Application
    let gravity = 600;
    if (this.type === 'firewall') gravity = 1200;
    else if (this.type === 'corrupted') gravity = 800;

    this.velocity.y += gravity * dt;
    this.position = this.position.add(this.velocity.multiply(dt));

    // Ground Clamping & World Boundaries
    const worldLeft = this.width/2;
    const worldRight = 4096 - this.width/2;
    this.position.x = window.clamp(this.position.x, worldLeft, worldRight);

    if (this.position.y >= 750) {
      this.position.y = 750;
      // Firewalls and Corrupted get stricter ground clamping to prevent floating/bouncing
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
    } else {
      this.velocity.x *= 0.95;
    }
  }

  updateAI(player, dt) {
    const distToPlayer = window.distance(
      this.position.x, this.position.y,
      player.position.x, player.position.y
    );
    
    // Virus AI with proper state transitions
    if (this.type === 'virus') {
      switch(this.state) {
        case 'entrance':
          // Handle entrance animation
          if (this._dropEdge) {
            this.virusDropEntrance(dt);
          } else {
            // No drop edge set, immediately transition to patrol
            console.log(`🦠 Virus has no drop edge - forcing transition to patrol`);
            this.state = 'patrol';
            this.entranceComplete = true;
          }
          break;
          
        case 'patrol':
          // Debug state every few seconds
          if (Math.floor(this.stateTimer / 1000) % 3 === 0 && this.stateTimer % 1000 < 16) {
            console.log(`🦠 Virus PATROL state - position: (${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}), velocity: (${this.velocity.x.toFixed(1)}, ${this.velocity.y.toFixed(1)})`);
          }
          
          this.patrol(dt);
          
          // Transition to chase if player is nearby
          if (distToPlayer <= 9999) {
            console.log(`🦠 Virus transitioning from PATROL to CHASE - player distance: ${distToPlayer.toFixed(1)}`);
            this.state = 'chase';
            this.target = player;
            this.stateTimer = 0;
          }
          break;
          
        case 'chase':
          // Debug chase state
          if (Math.floor(this.stateTimer / 1000) % 3 === 0 && this.stateTimer % 1000 < 16) {
            console.log(`🦠 Virus CHASE state - player distance: ${distToPlayer.toFixed(1)}, velocity: (${this.velocity.x.toFixed(1)}, ${this.velocity.y.toFixed(1)})`);
          }
          
          if (distToPlayer > this.detectionRadius * 1.5) {
            console.log(`🦠 Virus transitioning from CHASE to PATROL - player too far: ${distToPlayer.toFixed(1)}`);
            this.state = 'patrol';
            this.target = null;
          } else {
            this.chase(player, dt);
          }
          break;
          
        default:
          console.warn(`🦠 Virus in unknown state: ${this.state} - forcing to patrol`);
          this.state = 'patrol';
          this.entranceComplete = true;
          break;
      }
    } else {
      // Standard State Machine
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
          if (distToPlayer <= 9999) {
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

  startEntrance() {
    switch(this.type) {
      case 'virus':
        // Handle dropping from screen edges
        if (this._dropEdge) {
          this.entranceComplete = false;
          this.state = 'entrance';
          console.log(`🦠 Virus starting entrance from ${this._dropEdge} edge at position (${this.position.x}, ${this.position.y})`);
        } else {
          // Normal spawn behavior - start in patrol immediately
          this.entranceComplete = true;
          this.state = 'patrol';
          console.log(`🦠 Virus starting normal patrol at position (${this.position.x}, ${this.position.y})`);
        }
        break;
        
      case 'corrupted':
        const corruptedSpawnX = 4500 + window.randomRange(-50, 0);
        const corruptedSpawnY = window.randomRange(200, 700);
        
        this.position.x = corruptedSpawnX;
        this.position.y = corruptedSpawnY;
        
        this.velocity.x = -(80 + Math.random() * 40);
        this.velocity.y = 50 + Math.random() * 50;
        
        this.entrancePhase = 'throwing';
        this.entranceComplete = false;
        break;
        
      case 'firewall':
        this.position.x = 5120;
        this.position.y = 750;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.entrancePhase = 'pursuing';
        
        this.aiState = 'walking';
        this.aiStateTimer = 0;
        
        this.lungeCooldown = 2000 + Math.random() * 2000;
        this.nextLungeTime = 1500 + Math.random() * 3000;
        this.minAttackDistance = 200;
        this.maxAttackDistance = 400;
        this.baseAttackInterval = 4000 + Math.random() * 4000;
        this.lungeDirection = 1;
        
        this.attackAnimationDuration = 6000;
        this.attackAnimationTimer = 0;
        this.attackAnimationPlaying = false;
        
        this.entranceComplete = true;
        this.state = 'chase';
        break;
    }
  }
  
  entrance(dt) {
    switch(this.type) {
      case 'virus':
        this.virusDropEntrance(dt);
        break;
      case 'corrupted':
        this.corruptedEntrance(dt);
        break;
      case 'firewall':
        this.firewallEntrance(dt);
        break;
    }
  }
  
  corruptedEntrance(dt) {
    this.entrancePhase = 'throwing';
    this.velocity.y += 800 * dt;
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    if (this.position.y >= 750) {
      this.position.y = 750;
      this.velocity.y = 0;
      this.velocity.x *= 0.3;
      this.originalSpawnY = 750;
      
      if (window.particleSystem) {
        window.particleSystem.impact(this.position.x, this.position.y, '#00ff88', 20);
      }
      
      if (window.renderer?.addScreenShake) {
        window.renderer.addScreenShake(4, 150);
      }
      
      this.entranceComplete = true;
    }
    
    if (this.position.x < -100 || this.position.x > 2020) {
      this.position.x = window.clamp(this.position.x, 100, 3996);
      this.velocity.x *= -0.5;
    }
  }
  
  virusDropEntrance(dt) {
    // Apply gravity for vertical drops
    if (this._dropEdge === 'top' || this._dropEdge === 'bottom') {
      this.velocity.y += 600 * dt;
    }
    
    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    // Check if enemy has reached ground level or reasonable stop point
    let reachedTarget = false;
    
    switch(this._dropEdge) {
      case 'top':
        reachedTarget = this.position.y >= 750;
        break;
      case 'bottom':
        // Jumping up enemies - stop when velocity becomes negative
        reachedTarget = this.velocity.y <= 0;
        break;
      case 'left':
      case 'right':
        // Horizontal movement - stop when close to player area or slow enough
        const playerX = window.player?.position?.x || 960;
        const distToPlayer = Math.abs(this.position.x - playerX);
        reachedTarget = distToPlayer < 400 || Math.abs(this.velocity.x) < 50;
        break;
    }
    
    if (reachedTarget) {
      // Clamp to valid positions
      this.position.y = 750;
      this.velocity.y = 0;
      this.velocity.x *= 0.5;
      
      // Create landing effect
      if (window.particleSystem) {
        window.particleSystem.impact(this.position.x, this.position.y, '#9900ff', 15);
      }
      
      if (window.renderer?.addScreenShake) {
        window.renderer.addScreenShake(2, 100);
      }
      
      // CRITICAL FIX: Force state transition to patrol
      this.entranceComplete = true;
      this.state = 'patrol';
      this.isOnGround = true;
      
      console.log(`🦠 Virus completed entrance from ${this._dropEdge} edge - transitioning to PATROL state`);
      console.log(`🦠 Virus final position: (${this.position.x}, ${this.position.y}), state: ${this.state}, entranceComplete: ${this.entranceComplete}`);
    }
    
    // Boundary protection
    this.position.x = window.clamp(this.position.x, 50, 4046);
    this.position.y = window.clamp(this.position.y, 50, 850);
  }
  
  firewallEntrance(dt) {
    // Firewall "Entrance" is actually just its AI loop running
    this.aiStateTimer += dt;
    
    switch(this.aiState) {
      case 'walking':
        const distToPlayer = window.distance(
          this.position.x, this.position.y,
          window.player?.position?.x || 960,
          window.player?.position?.y || 750
        );
        
        // Walk toward player
        const walkDx = (window.player?.position?.x || 960) - this.position.x;
        const angleToPlayer = Math.atan2((window.player?.position?.y || 750) - this.position.y, walkDx);
        
        this.velocity.x = Math.cos(angleToPlayer) * 80;
        this.position.x += this.velocity.x * dt;
        this.position.y = 750;
        
        this.lungeCooldown -= dt;
        if (this.lungeCooldown <= 0) {
          if (distToPlayer < 400) {
            this.aiState = 'preparing_lunge';
            this.aiStateTimer = 0;
            this.lungeChargeTime = 800;
            
            // Set lunge direction
            this.lungeDirection = walkDx > 0 ? 1 : -1;
          } else {
            this.aiState = 'walking';
            this.lungeCooldown = 2000;
          }
        }
        break;
        
      case 'preparing_lunge':
        this.aiStateTimer += dt;
        this.velocity.x = 0;
        this.position.y = 750 + Math.sin(Date.now() * 0.008) * 5;
        
        if (this.aiStateTimer % 80 < 40 && window.renderer?.addScreenShake) {
          window.renderer.addScreenShake(2, 60);
        }
        
        if (!this.attackAnimationPlaying && this.spriteReady && this.sprite) {
          this.playAnimation('attack');
          this.attackAnimationPlaying = true;
          this.attackAnimationTimer = this.attackAnimationDuration;
        }
        
        if (this.aiStateTimer >= this.lungeChargeTime) {
          this.aiState = 'lunging';
          this.aiStateTimer = 0;
          
          // Lunge execution
          const lungeForce = 96;
          const lungeDx = (window.player?.position?.x || 960) - this.position.x;
          const lungeDy = (window.player?.position?.y || 750) - this.position.y;
          const lungeAngle = Math.atan2(lungeDy, lungeDx);
          
          this.velocity.x = Math.cos(lungeAngle) * lungeForce;
          this.velocity.y = -120;
          
          if (window.renderer?.addScreenShake) {
            window.renderer.addScreenShake(8, 300);
          }
        }
        break;
        
      case 'lunging':
        this.aiStateTimer += dt;
        
        if (this.attackAnimationPlaying && this.spriteReady && this.sprite) {
          const currentAnim = this.sprite.getCurrentAnimation();
          if (!currentAnim || !currentAnim.includes('attack')) {
            this.playAnimation('attack');
          }
        }
        
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.velocity.y += 800 * dt;
        this.velocity.x *= 0.85;
        
        if (this.position.y >= 750) {
          this.position.y = 750;
          this.velocity.y = 0;
        }
        
        if (Math.abs(this.velocity.x) < 10 || this.aiStateTimer > 1200) {
          this.aiState = 'recovering';
          this.aiStateTimer = 0;
          this.velocity.x = 0;
          this.velocity.y = 0;
          
          if (this.spriteReady && this.sprite) {
            this.playAnimation('idle');
            this.attackAnimationPlaying = false;
            this.shieldActive = false;
            this.preparingAttack = false;
          }
        }
        break;
        
      case 'recovering':
        this.position.y = 750 + Math.sin(Date.now() * 0.002) * 3;
        this.position.x = Math.max(100, Math.min(2900, this.position.x));
        
        if (this.aiStateTimer > 1200) {
          this.aiState = 'walking';
          this.aiStateTimer = 0;
          this.velocity.x = 0;
          this.lungeCooldown = 4000 + Math.random() * 2000;
        }
        break;
    }
  }
  
  createGlitchParticles(type) {
    if (window.particleSystem && this.type === 'corrupted') {
      for (let i = 0; i < 3; i++) {
        const particleX = this.position.x + (Math.random() - 0.5) * 20;
        const particleY = this.position.y - this.height/2 + (Math.random() - 0.5) * 20;
        window.particleSystem.damageEffect(particleX, particleY, '#00ff88', 2);
      }
    }
  }

  patrol(dt) {
    const player = window.player;
    if (!player) {
      this.basicPatrol(dt);
      return;
    }
    
    const distToPlayer = window.distance(
      this.position.x, this.position.y,
      player.position.x, player.position.y
    );
    
    // Global Pursuit Logic
    switch(this.type) {
      case 'virus':
        const angleToPlayer = Math.atan2(
          player.position.y - this.position.y,
          player.position.x - this.position.x
        );
        
        if (distToPlayer < 9999) {
          const speedBoost = distToPlayer < 300 ? 2.5 : 1.5;
          this.velocity.x = Math.cos(angleToPlayer) * this.speed * speedBoost;
          
          // Jump attack
          if (distToPlayer < 150 && this.isOnGround && Math.random() > 0.6) {
            this.velocity.y = -this.speed * 0.08;
            this.velocity.x = Math.cos(angleToPlayer) * this.speed * 1.2;
          }
        }
        break;
        
      case 'corrupted':
        const corruptedAngle = Math.atan2(
          player.position.y - this.position.y,
          player.position.x - this.position.x
        );
        
        // CRITICAL FIX: Remove teleport ability - make corrupted enemies anxious
        // Randomly stop and play idle animations
        const currentTime = Date.now();
        
        // Initialize anxiety timers if not set
        if (!this._anxiousPauseEnd) {
          this._anxiousPauseEnd = 0;
          this._nextAnxiousPause = currentTime + 500 + Math.random() * 2000; // Next pause in 0.5-2.5s
        }
        
        // Check if it's time to start an anxious pause
        if (currentTime >= this._nextAnxiousPause && this._anxiousPauseEnd === 0) {
          // Start anxious pause
          this._anxiousPauseEnd = currentTime + 300 + Math.random() * 700; // Pause for 0.3-1.0s
          console.log('😰 Corrupted enemy starting anxious pause');
        }
        
        if (currentTime >= this._nextAnxiousPause && currentTime < this._anxiousPauseEnd) {
          // Currently in anxious pause - stop movement
          this.velocity.x = 0;
          this.velocity.y = 0;
          
          // Add visual trembling during anxiety
          const tremorAmount = 2 + Math.sin(currentTime * 0.02) * 1;
          this.position.x += (Math.random() - 0.5) * tremorAmount;
          this.position.y += (Math.random() - 0.5) * tremorAmount * 0.5;
          
          // Force idle animation during pause
          if (this.spriteReady && this.sprite) {
            const currentAnim = this.sprite.getCurrentAnimation();
            if (!currentAnim || !currentAnim.includes('idle')) {
              this.playAnimation('idle');
            }
          }
          
          // Create occasional anxiety particles (green tremor)
          if (Math.random() < 0.03) { // 3% chance per frame during anxiety
            if (window.particleSystem) {
              const tremorX = this.position.x + (Math.random() - 0.5) * 40;
              const tremorY = this.position.y - 30 + (Math.random() - 0.5) * 20;
              window.particleSystem.damageEffect(tremorX, tremorY, '#00ff88', 3);
            }
          }
        } else if (currentTime >= this._anxiousPauseEnd && this._anxiousPauseEnd > 0) {
          // Resume movement after pause - add nervous energy burst
          const nervousSpeed = this.speed * 1.1 + Math.random() * 50; // Sometimes move faster due to anxiety
          this.velocity.x = Math.cos(corruptedAngle) * nervousSpeed;
          
          // Schedule next anxious pause
          this._anxiousPauseEnd = 0;
          this._nextAnxiousPause = currentTime + 1000 + Math.random() * 3000; // Next pause in 1-4s
          
          console.log('😰 Corrupted enemy resuming movement with nervous energy');
          
          // Resume walk animation
          if (this.spriteReady && this.sprite) {
            const currentAnim = this.sprite.getCurrentAnimation();
            if (!currentAnim || currentAnim.includes('idle')) {
              this.playAnimation('walk');
            }
          }
          
          // Create burst of anxiety particles when resuming
          if (Math.random() < 0.5) { // 50% chance when resuming
            if (window.particleSystem) {
              for (let i = 0; i < 5; i++) {
                const burstX = this.position.x + (Math.random() - 0.5) * 30;
                const burstY = this.position.y - 20 + (Math.random() - 0.5) * 15;
                window.particleSystem.damageEffect(burstX, burstY, '#00ff88', 2);
              }
            }
          }
        } else {
          // Normal movement when not anxious
          this.velocity.x = Math.cos(corruptedAngle) * this.speed * 1.1;
        }
        break;
        
      case 'firewall':
        this.firewallAI(dt * 1000, player);
        break;
    }
  }
  
  basicPatrol(dt) {
    // Fallback patrol when no player
    const moveTimer = Date.now() / 1000 + this.phaseOffset;
    this.velocity.x = Math.sin(moveTimer) * this.speed;
  }

  firewallAI(deltaTimeMs, player) {
    const dt = deltaTimeMs / 1000;
    if (!this.aiState) {
      this.aiState = 'walking';
      this.aiStateTimer = 0;
      this.baseAttackInterval = 4000 + Math.random() * 4000;
      this.lungeCooldown = this.baseAttackInterval;
    }
    
    // Delegate to the entrance method which contains the full state machine
    this.firewallEntrance(dt);
  }

  chase(target, dt) {
    // Wrapper for updateAI logic
    this.patrol(dt);
  }

  takeDamage(amount) {
    this.health -= amount;
    
    if (window.particleSystem) {
      let particleColor = this.type === 'corrupted' ? 'corrupted' : this.type;
      window.particleSystem.damageEffect(this.position.x, this.position.y - this.height/2, particleColor, 10);
    }
    
    if (this.health <= 0) {
      this.active = false;
      
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
    // 1. Sprite-based Hitbox
    if (['virus', 'corrupted', 'firewall'].includes(this.type) && this.spriteReady && this.sprite) {
      
      // Custom scale/offset logic based on type & animation
      let drawScale = 0.8; 
      let drawOffset = 60;
      
      if (this.type === 'corrupted') {
        drawScale = 1.2;
        drawOffset = 80;
      } else if (this.type === 'firewall') {
        // Dynamic firewall hitbox sizing
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
      
      // Get hitbox from engine
      const worldHitbox = this.sprite.getHitboxWorld(this.position.x, this.position.y, {
        scale: drawScale,
        flipH: this.facing === -1
      });
      
      if (worldHitbox) {
        // Apply strict margins
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
      
      // Fallback Calculation if engine returns null
      let spriteWidth = 96 * drawScale;
      let spriteHeight = 93 * drawScale;
      let yOffset = drawOffset;

      if (this.type === 'virus') {
         spriteWidth = 96 * drawScale;
         spriteHeight = 93 * drawScale;
         yOffset = drawOffset - 240;
         
         // Extended front hitbox for virus
         const tightWidth = spriteWidth * 0.94;
         const tightHeight = spriteHeight * 0.94;
         const extraX = this.facing === 1 ? 0 : -20;
         
         return {
            x: this.position.x - tightWidth/2 + extraX,
            y: this.position.y - tightHeight + yOffset,
            width: tightWidth + 20,
            height: tightHeight
         };
      }
    }
    
    // 2. Default Rectangle Hitbox
    return {
      x: this.position.x - this.width/2,
      y: this.position.y - this.height,
      width: this.width,
      height: this.height
    };
  }

  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    
    if (this.type === 'firewall' && this.alpha !== undefined) {
      ctx.globalAlpha = this.alpha;
    }
    
    if (['virus', 'corrupted', 'firewall'].includes(this.type) && this.spriteReady && this.sprite) {
      this.drawSprite(ctx);
      
      // Draw Health Bar
      if (this.health < this.maxHealth) {
        let healthBarY = this.position.y - this.height + 50;
        if (this.type === 'firewall') healthBarY += 40;
        
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.fillRect(
          this.position.x - this.width,
          healthBarY,
          this.width * 2 * (this.health / this.maxHealth),
          4
        );
      }
    } else {
      // Fallback drawing for non-sprite or failed loads
      if (this.type !== 'corrupted' && this.type !== 'firewall') {
        const bodyY = this.position.y - this.height;
        const bodyX = this.position.x - this.width/2;
        
        ctx.fillStyle = this.color;
        ctx.fillRect(bodyX, bodyY, this.width, this.height);
      }
    }
    
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
  
  updateSpriteAnimation(deltaTime) {
    if (!this.spriteReady || !this.sprite) return;
    
    this.sprite.update(deltaTime);
    this.forceCorrectAnimationState();
  }
  
  forceCorrectAnimationState() {
    if (!this.spriteReady || !this.sprite) return;
    
    const currentAnim = this.sprite.getCurrentAnimation();
    let target = 'idle';
    
    if (this.type === 'virus') {
      target = 'idle';
    } else if (this.type === 'corrupted') {
      target = Math.abs(this.velocity.x) > 2 ? 'walk' : 'idle';
      if (target === 'walk') this.facing = this.velocity.x > 0 ? 1 : -1;
    } else if (this.type === 'firewall') {
      if (this.attackAnimationPlaying || this.aiState === 'lunging') target = 'attack';
      else if (Math.abs(this.velocity.x) > 1) {
        target = 'walk';
        this.facing = this.velocity.x > 0 ? 1 : -1;
      }
    }
    
    // Map to full names
    const map = {
      'virus': { 'idle': 'virus_idle_idle' },
      'corrupted': { 'idle': 'corrupted_idle_idle', 'walk': 'corrupted_walk_walk' },
      'firewall': { 'idle': 'firewall_idle_idle', 'walk': 'firewall_walk_walk', 'attack': 'firewall_attack_default' }
    };
    
    const fullName = map[this.type][target];
    if (!currentAnim || !currentAnim.includes(target)) {
      this.playAnimation(target);
      this.currentAnimation = fullName;
    }
  }
  
  playAnimation(name) {
    if (!this.spriteReady || !this.sprite) return;
    
    const map = {
      'virus': { 'idle': 'virus_idle_idle' },
      'corrupted': { 'idle': 'corrupted_idle_idle', 'walk': 'corrupted_walk_walk' },
      'firewall': { 'idle': 'firewall_idle_idle', 'walk': 'firewall_walk_walk', 'attack': 'firewall_attack_default' }
    };
    
    const fullName = map[this.type][name] || name;
    const current = this.sprite.getCurrentAnimation();
    
    if (current === fullName && name !== 'idle') return;
    
    const loop = !fullName.includes('attack');
    const speed = fullName.includes('attack') ? 1.2 : (name === 'idle' ? 1.25 : 1.0);
    
    const animRef = this.sprite.play(fullName, loop, 0, { speed });
    this.currentAnimation = fullName;
    
    if (!loop && animRef?.onComplete) {
      animRef.onComplete(() => {
        if (this.type === 'firewall') {
          this.attackAnimationPlaying = false;
          this.playAnimation('idle');
        }
      });
    }
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
};

// Enemy Manager
window.EnemyManager = class EnemyManager {
  constructor() {
    this.enemies = [];
    this.minEnemies = 2;
    this.maxEnemies = 12;
    this.spawnTimer = 0;
    this.nextSpawnTime = 1500;
    this.defeatedCount = 0;
    
    this.spawnLocations = this.generateSpawnLocations();
    this.lastSpawnPosition = null;
    this.spawnAvoidanceRadius = 150;
    
    this.lastFirewallSpawnTime = 0;
    this.firewallSpawnCooldown = 3000;
    this.activeFirewallCount = 0;
    
    this.spawnFlowState = 'building';
    this.flowTimer = 0;
    this.enemySpawnWaves = 0;
    this.baseSpawnRate = 1.0;
    
    this.currentSpawnZone = 'right';
    this.zoneRotationTimer = 0;
    this.zoneRotationInterval = 15000;
  }

  update(deltaTime, player) {
    this.updateSpawnFlow(deltaTime);
    this.updateSpawnZones(deltaTime);
    
    const tutorial = window.tutorialSystem;
    const tutorialWaiting = tutorial && tutorial.isActive() && tutorial.storyChapter === 1 && tutorial.combatEnemiesPaused;

    // Update Enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, player);
      
      // Tutorial Freeze Logic (Virus specific)
      if (enemy.type === 'virus' && tutorialWaiting && enemy.active) {
        if (enemy.state !== 'patrol') enemy.state = 'patrol';
        if (enemy.position.y > 750) enemy.position.y = 750;
        
        // CRITICAL FIX: Give tutorial viruses proper movement in patrol state
        // Use small but meaningful velocity for patrol movement, not just idle wobble
        const player = window.player;
        if (player && enemy.entranceComplete) {
          const distToPlayer = window.distance(
            enemy.position.x, enemy.position.y,
            player.position.x, player.position.y
          );
          
          // Tutorial viruses should actively patrol and chase the player
          if (distToPlayer < 9999) {
            const angleToPlayer = Math.atan2(
              player.position.y - enemy.position.y,
              player.position.x - enemy.position.x
            );
            
            // Slower but deliberate movement for tutorial
            const tutorialSpeed = enemy.speed * 0.4; // 40% speed for tutorial
            enemy.velocity.x = Math.cos(angleToPlayer) * tutorialSpeed;
            
            // Occasional jump attacks during tutorial
            if (distToPlayer < 200 && enemy.isOnGround && Math.random() > 0.95) {
              enemy.velocity.y = -enemy.speed * 0.06; // Small jump
              enemy.velocity.x = Math.cos(angleToPlayer) * tutorialSpeed * 1.5;
            }
          } else {
            // Idle wobble when player is far
            enemy.velocity.x = Math.sin(Date.now() / 1000 + enemy.phaseOffset) * 10;
          }
        } else {
          // Fallback to idle wobble if no player
          enemy.velocity.x = Math.sin(Date.now() / 1000 + enemy.phaseOffset) * 10;
        }
      }
    });
    
    this.checkEnemyCollisions();
    this.checkCollisions(player);
    
    // Clean up dead enemies
    const newlyDefeated = this.enemies.filter(e => !e.active && e.health <= 0);
    if (newlyDefeated.length > 0) {
        this.defeatedCount += newlyDefeated.length;
        
        // CRITICAL FIX: Track tutorial enemy defeats separately
        const tutorialDefeated = newlyDefeated.filter(e => e._isTutorialEnemy === true);
        if (tutorialDefeated.length > 0 && tutorial?.isActive() && tutorial.storyChapter === 1) {
            tutorial._tutorialEnemiesDefeated = (tutorial._tutorialEnemiesDefeated || 0) + tutorialDefeated.length;
            console.log(`📚 Tutorial enemies defeated: ${tutorial._tutorialEnemiesDefeated}/3`);
        }
        
        if (window.sector1Progression?.onEnemyDefeated) {
             newlyDefeated.forEach(() => window.sector1Progression.onEnemyDefeated());
        }
        if (tutorial?.isActive()) {
            tutorial.checkObjective('combat');
        }
    }
    
    this.enemies = this.enemies.filter(e => e.active);
    this.activeFirewallCount = this.enemies.filter(e => e.type === 'firewall').length;
    
    // Spawning Logic
    const isMainGame = !tutorial || !tutorial.isActive();
    if (isMainGame && this.shouldSpawnEnemy(this.enemies.length)) {
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= (this.nextSpawnTime / this.baseSpawnRate)) {
            this.spawnFlowEnemy(player);
            this.spawnTimer = 0;
            this.nextSpawnTime = this.getFlowSpawnTime();
        }
    }
  }

  checkEnemyCollisions() {
    const active = this.enemies;
    for (let i = 0; i < active.length; i++) {
        for (let j = i + 1; j < active.length; j++) {
            const e1 = active[i];
            const e2 = active[j];
            
            // Corrupted/Firewall Pass-through
            if ((e1.type === 'corrupted' && e2.type === 'firewall') || (e1.type === 'firewall' && e2.type === 'corrupted')) {
                continue; // Allow pass through
            }
            
            // Standard Separation
            const dx = e2.position.x - e1.position.x;
            const dy = e2.position.y - e1.position.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const minSep = (e1.width + e2.width) / 2;
            
            if (dist < minSep && dist > 0) {
                const force = (minSep - dist) * 0.5;
                const pushX = (dx / dist) * force;
                
                e1.position.x -= pushX;
                e2.position.x += pushX;
            }
        }
    }
  }

  checkCollisions(player) {
      if (player.controlsDisabled) return;
      
      const playerBox = player.getHitbox();
      this.enemies.forEach(enemy => {
          const enemyBox = enemy.getHitbox();
          
          // Stomp Detection
          const isStomp = player.velocity.y > 0 && 
                         (playerBox.y + playerBox.height) < (enemyBox.y + enemyBox.height/2) &&
                         this.simpleAABBcollision(playerBox, enemyBox);
                         
          if (isStomp) {
              enemy.takeDamage(999);
              player.velocity.y = -400; // Bounce
              if (window.particleSystem) window.particleSystem.impact(enemy.position.x, enemy.position.y, '#00ffff', 20);
          } else if (this.simpleAABBcollision(playerBox, enemyBox)) {
              // Player hit logic
              if (!player.invulnerableUntil || Date.now() > player.invulnerableUntil) {
                 // Calculate directional knockback based on enemy position
                 const dx = player.position.x - enemy.position.x;
                 const dy = player.position.y - enemy.position.y;
                 const distance = Math.sqrt(dx * dx + dy * dy);
                 
                 // Normalize direction vector and apply knockback force
                 const knockbackForce = 400;
                 const knockbackUp = -250; // Upward bounce
                 
                 const knockbackX = (dx / distance) * knockbackForce;
                 const knockbackY = knockbackUp;
                 
                 // Apply enhanced knockback to player and pass enemy position for facing
                 player.takeDamageWithKnockback(enemy.damage, knockbackX, knockbackY, enemy.position);
              }
          }
      });
  }

  simpleAABBcollision(r1, r2) {
      return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
             r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
  }

  // Spawning Helpers
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
  
  getFlowSpawnTime() {
      let time = 1000 + Math.random() * 2000;
      if (this.spawnFlowState === 'peak') time *= 0.6;
      if (this.spawnFlowState === 'recovery') time *= 1.5;
      return Math.max(1000, time);
  }
  
  spawnFlowEnemy(player) {
      if (this.enemies.length >= this.maxEnemies) return;
      
      const types = ['virus', 'corrupted', 'firewall'];
      let type = types[Math.floor(Math.random() * types.length)];
      
      if (type === 'firewall' && this.activeFirewallCount >= 3) type = 'corrupted';
      
      let x, y;
      
      // Special spawning for virus enemies - drop from above-left of player (post-tutorial only)
      if (type === 'virus') {
        const tutorial = window.tutorialSystem;
        const isTutorialActive = tutorial && tutorial.isActive();
        
        if (!isTutorialActive) {
          // After tutorial: always spawn from left side (off-screen)
          const xOffset = window.randomRange(-800, -400); // Further left for off-screen feel
          x = player.position.x + xOffset;
          y = -50 - Math.random() * 200; // Above screen with height variation
          
          // Clamp to world bounds but ensure left of player and off-screen
          x = window.clamp(x, -200, player.position.x - 300); // Allow spawning off left edge
          y = window.clamp(y, -250, -50);
        } else {
          // During tutorial: spawn from both sides (handled by tutorial system)
          const xOffset = window.randomRange(-600, -200);
          x = player.position.x + xOffset;
          y = -50 - Math.random() * 200;
          x = window.clamp(x, 100, player.position.x - 150);
          y = window.clamp(y, -250, -50);
        }
      } else {
        // Normal spawning for corrupted and firewall
        x = 100;
        if (this.currentSpawnZone === 'right') x = 3900;
        else if (this.currentSpawnZone === 'center') x = player.position.x + (Math.random() > 0.5 ? 400 : -400);
        else if (this.currentSpawnZone === 'both') x = Math.random() > 0.5 ? 100 : 3900;
        
        // Safe checks for non-virus types
        if (Math.abs(x - player.position.x) < 300) x = player.position.x + 400;
        y = 200;
      }
      
      const enemy = new window.Enemy(x, y, type);
      
      // Special setup for virus drop behavior
      if (type === 'virus') {
        enemy._dropEdge = 'top'; // Enable drop entrance behavior
        enemy.entranceComplete = false;
        enemy.state = 'entrance';
        enemy.velocity.x = 50; // Gentle drift right toward player
        enemy.velocity.y = 120; // Fall speed
        enemy.isOnGround = false;
      }
      
      this.enemies.push(enemy);
  }

  getActiveEnemies() { return this.enemies; }
  draw(ctx) { this.enemies.forEach(e => e.draw(ctx)); }
  
  // Spawn enemy at random position
  spawnEnemy() {
    if (this.enemies.length >= this.maxEnemies) return;
    
    const types = ['virus', 'corrupted', 'firewall'];
    let type = types[Math.floor(Math.random() * types.length)];
    
    if (type === 'firewall' && this.activeFirewallCount >= 1) {
      type = 'corrupted'; // Limit firewall spawns
    }
    
    const playerX = window.player?.position?.x || 960;
    let x, y;
    
    // Special spawning for virus enemies - check tutorial state
    if (type === 'virus') {
      const tutorial = window.tutorialSystem;
      const isTutorialActive = tutorial && tutorial.isActive();
      
      if (!isTutorialActive) {
        // After tutorial: always spawn from left side (off-screen)
        const xOffset = window.randomRange(-800, -400); // Further left for off-screen feel
        x = playerX + xOffset;
        y = -50 - Math.random() * 200; // Above screen with height variation
        
        // Clamp to world bounds but ensure left of player and off-screen
        x = window.clamp(x, -200, playerX - 300); // Allow spawning off left edge
        y = window.clamp(y, -250, -50);
      } else {
        // During tutorial: spawn from both sides (handled by tutorial system)
        const xOffset = window.randomRange(-600, -200);
        x = playerX + xOffset;
        y = -50 - Math.random() * 200;
        x = window.clamp(x, 100, playerX - 300);
        y = window.clamp(y, -250, -50);
      }
    } else {
      // Normal spawning for corrupted and firewall
      x = 100;
      if (this.currentSpawnZone === 'right') x = 3900;
      else if (this.currentSpawnZone === 'center') {
        x = playerX + (Math.random() > 0.5 ? 400 : -400);
      } else if (this.currentSpawnZone === 'both') {
        x = Math.random() > 0.5 ? 100 : 3900;
      }
      
      // Ensure minimum distance from player for non-virus types
      if (window.player && Math.abs(x - window.player.position.x) < 300) {
        x = window.player.position.x + (x > window.player.position.x ? 400 : -400);
      }
      
      // Clamp to world bounds
      x = Math.max(100, Math.min(3900, x));
      y = 200;
    }
    
    const enemy = new window.Enemy(x, y, type);
    
    // Special setup for virus drop behavior
    if (type === 'virus') {
      enemy._dropEdge = 'top'; // Enable drop entrance behavior
      enemy.entranceComplete = false;
      enemy.state = 'entrance';
      enemy.velocity.x = 50; // Gentle drift right toward player
      enemy.velocity.y = 120; // Fall speed
      enemy.isOnGround = false;
    }
    
    this.enemies.push(enemy);
  }
  
  // Spawn enemy at specific position
  spawnEnemyAt(x, y) {
    if (this.enemies.length >= this.maxEnemies) return;
    
    const types = ['virus', 'corrupted']; // Only spawn basic types at specific positions
    const type = types[Math.floor(Math.random() * types.length)];
    
    const enemy = new window.Enemy(x, y, type);
    
    // Special setup for virus drop behavior (if spawning virus at custom position)
    if (type === 'virus' && y < 500) {
      const tutorial = window.tutorialSystem;
      const isTutorialActive = tutorial && tutorial.isActive();
      const playerX = window.player?.position?.x || 960;
      
      enemy._dropEdge = 'top'; // Enable drop entrance behavior
      enemy.entranceComplete = false;
      enemy.state = 'entrance';
      
      if (!isTutorialActive) {
        // After tutorial: always drift right (from left side)
        enemy.velocity.x = 50; // Gentle drift right toward player
      } else {
        // During tutorial: could drift either way based on spawn position
        enemy.velocity.x = x > playerX ? -50 : 50; // Drift toward player
      }
      
      enemy.velocity.y = 120; // Fall speed
      enemy.isOnGround = false;
    }
    
    this.enemies.push(enemy);
  }
  
  // Check player rhythm attacks
  checkPlayerAttacks(player, rhythmResult = null) {
    if (!player || !player.rhythmActive) return;
    
    const attackRadius = 300;
    const playerX = player.position.x;
    const playerY = player.position.y;
    
    this.enemies.forEach(enemy => {
      if (!enemy.active) return;
      
      const dist = window.distance(playerX, playerY, enemy.position.x, enemy.position.y);
      
      if (dist <= attackRadius) {
        // Apply damage based on rhythm result or default damage
        const damage = rhythmResult && rhythmResult.damage ? rhythmResult.damage : 1;
        enemy.takeDamage(damage);
        
        // Create hit effect
        if (window.particleSystem) {
          window.particleSystem.impact(enemy.position.x, enemy.position.y, '#00ffff', 15);
        }
      }
    });
  }
  
  clear() {
    this.enemies = [];
    this.defeatedCount = 0;
    this.spawnTimer = 0;
    this.nextSpawnTime = 1500;
    this.lastFirewallSpawnTime = 0;
    this.activeFirewallCount = 0;
    this.spawnFlowState = 'building';
    this.flowTimer = 0;
    this.enemySpawnWaves = 0;
    this.currentSpawnZone = 'right';
    this.zoneRotationTimer = 0;
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