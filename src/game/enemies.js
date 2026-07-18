// Enemy system for BARCODE: System Override
// Gameplay simulation timers in this file use milliseconds at manager/API boundaries and seconds only in local per-frame integration variables named dt.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/enemies.js',
  exports: ['Enemy', 'EnemyManager', 'enemyManager'],
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
    this.baseSpeed = this.speed;

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
    this.attackAnimationDurationSeconds = 0;
    this.attackAnimationTimerSeconds = 0;
    this.aiState = 'walking';

    // Personality behavior properties
    this.personalityTimer = Math.random() * 1000;
    this.behaviorState = 'normal';
    this.behaviorTimerSeconds = 0;

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
    this.lungeCooldownSeconds = 0;
    this.lungePreparationTimeSeconds = 0;
    this.isLunging = false;
    this.proximityDetectionRadius = 400;
    this._idleAnimationTimer = 0;
    this._inFullIdle = false;

    // Enhanced firewall properties (only used when type === 'firewall')
    this.proximityAttackRange = 250;
    this.glideDistance = 80;
    this.glideDurationSeconds = 0.8;
    this.fullAttackDurationSeconds = 4.9;
    this.attackStartTimeMs = 0;

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

    // Spawn protection and simulation-time state (milliseconds).
    this.simulationTimeMs = 0;
    this.spawnTimeMs = 0;
    this.spawnProtectionDuration = 2000;
    this.lastPlayerHitTimeMs = -Infinity;
    this._disposed = false;
    this._generation = 0;
    this._spriteRequested = false;
    this._spriteId = null;
    this._spritePolls = 0;

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
        this.attackAnimationDurationSeconds = 6;
        this.lungeCooldownSeconds = 6 + Math.random() * 4;
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

  updateAuthoredEntrance(deltaTime) {
    if (!this._authoredEntranceActive || !this._entranceTarget) return false;
    if (window.sector1Progression && typeof window.sector1Progression.keepEntranceTargetSafe === 'function') {
      window.sector1Progression.keepEntranceTargetSafe(this);
    }
    const dt = deltaTime / 1000;
    const dx = this._entranceTarget.x - this.position.x;
    const dy = this._entranceTarget.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = Math.max(1, this._authoredEntranceSpeed || 420);
    const step = speed * dt;

    this.state = 'authored_entrance';
    this.entranceComplete = false;
    if (this.type === 'firewall' && this.spriteReady && this.currentAnimation !== 'firewall_walk_walk') this.playAnimation('walk');

    if (distance <= Math.max(4, step)) {
      this.position.x = this._entranceTarget.x;
      this.position.y = this._entranceTarget.y;
      this.velocity.x = 0;
      this.velocity.y = 0;
      this._authoredEntranceActive = false;
      this.entranceComplete = true;
      this.state = 'patrol';
      this.spawnTimeMs = this.simulationTimeMs;
      this.isOnGround = this.position.y >= 750;
      if (this.type === 'firewall' && this.spriteReady) this.playAnimation('idle');
    } else {
      this.velocity.x = (dx / distance) * speed;
      this.velocity.y = (dy / distance) * speed;
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
    }
    return true;
  }

  update(deltaTime, player, simulationTimeMs) {
    if (!this.active || this._disposed) return;
    this.simulationTimeMs = Number.isFinite(simulationTimeMs) ? simulationTimeMs : (this.simulationTimeMs + deltaTime);
    this.pollSpriteReady();

    const dt = deltaTime / 1000;
    this.stateTimer += deltaTime;
    this.animationTime += deltaTime;

    // Authored Level 1 entrances own their integration until the actor reaches its stage target.
    if (this.updateAuthoredEntrance(deltaTime)) {
      if (this.spriteReady && this.sprite) {
        this.sprite.update(deltaTime);
        this.forceCorrectAnimationState();
      }
      return;
    }

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
        this.behaviorTimerSeconds = 0;
        this.lungeCooldownSeconds = 1 + Math.random() * 3;
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
        this._nextPauseTime = this.simulationTimeMs + 1000 + Math.random() * 2000;
    }

    const currentTime = this.simulationTimeMs;

    if (this._corruptedState === 'chase') {
        // Chase the player
        const speed = this.speed * 1.2; // Fast pursuit
        this.velocity.x = Math.cos(angleToPlayer) * speed;

        // Randomly decide to stop and stare
        if (currentTime > this._nextPauseTime) {
            this._corruptedState = 'pause';
            this._corruptedTimer = this.simulationTimeMs; // Start pause timer
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
        if (this.simulationTimeMs - this._corruptedTimer > this._pauseDuration) {
            this._corruptedState = 'chase';
            this._nextPauseTime = currentTime + 1000 + Math.random() * 2000; // Schedule next pause
        }
    }
  }

  // 3. ENHANCED FIREWALL BEHAVIOR (Proximity Attack with Full Animation)
  firewallPersonalityBehavior(dt, player) {
    const distToPlayer = window.distance(this.position.x, this.position.y, player.position.x, player.position.y);
    const currentTime = this.simulationTimeMs;

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
    if (distToPlayer <= this.proximityAttackRange && !this.isLunging && this.lungeCooldownSeconds <= 0) {
      if (Math.random() < 0.9) {
        this.startProximityAttack(player);
        }
    }
    if (this.lungeCooldownSeconds > 0) this.lungeCooldownSeconds = Math.max(0, this.lungeCooldownSeconds - dt);

    // Idle Pause Logic
    if (currentTime >= this._nextIdlePause && this.behaviorState === 'normal') {
        this.behaviorState = 'idle_pause';
        this.behaviorTimerSeconds = 0;
        this._idlePauseDurationSeconds = 1 + Math.random() * 1.5;
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
            this.behaviorTimerSeconds += dt;
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
            if (!this._inFullIdle && this.behaviorTimerSeconds > this._idlePauseDurationSeconds) {
                this.behaviorState = 'normal';
                this.behaviorTimerSeconds = 0;
            }
            break;

        case 'lunging':
            this.behaviorTimerSeconds += dt;
            // Drag
            // Enhanced glide physics
            if (this.behaviorTimerSeconds < this.glideDurationSeconds) {
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
            const attackElapsed = this.behaviorTimerSeconds;
            if (attackElapsed > this.fullAttackDurationSeconds) {
                this.behaviorState = 'normal';
                this.behaviorTimerSeconds = 0;
                this.isLunging = false;
                this.lungeCooldownSeconds = 3 + Math.random() * 2;
                this.attackStartTimeMs = 0;
                console.log('🔥 Enhanced Firewall proximity attack completed');
            }

            // Safety timeout
            if (this.behaviorTimerSeconds > 5.5) {
              console.log('🔥 Enhanced Firewall attack timeout - forcing exit');
              this.behaviorState = 'normal';
              this.behaviorTimerSeconds = 0;
              this.isLunging = false;
              this.lungeCooldownSeconds = 2;
              this.attackStartTimeMs = 0;
            }
            break;
    }
  }

  // Enhanced proximity attack with full animation and 80px glide
  startProximityAttack(player) {
    this.isLunging = true;
    this.behaviorState = 'lunging';
    this.behaviorTimerSeconds = 0;
    this.attackStartTimeMs = this.simulationTimeMs;

    // Calculate direction to player
    const dx = player.position.x - this.position.x;
    const direction = dx > 0 ? 1 : -1;
    this.facing = direction;

    // Execute 80px glide
    const glideVelocity = this.glideDistance / this.glideDurationSeconds;
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

  isSpawnProtected() {
    if (!this._sector1MissionEnemy && !this._jammerReinforcement) return false;
    return !!this._authoredEntranceActive || !this.entranceComplete || ((this.simulationTimeMs || 0) - (this.spawnTimeMs || 0) < (this.spawnProtectionDuration || 0));
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

  initSprite() {
    if (this._disposed || this._spriteRequested) return;
    this._spriteRequested = true;
    this.pollSpriteReady();
  }

  pollSpriteReady() {
    if (this._disposed || this.spriteReady || !['virus', 'corrupted', 'firewall'].includes(this.type)) return;
    const charMap = {
      'virus': 'virus_virus',
      'corrupted': 'corrupted_corrupted',
      'firewall': 'firewall_firewall'
    };
    if (!window.MakkoEngine || !window.MakkoEngine.isLoaded || !window.MakkoEngine.isLoaded()) return;
    if (!this.sprite) {
      this._spriteId = charMap[this.type];
      this.sprite = window.MakkoEngine.sprite(this._spriteId);
      this._spritePolls += 1;
    }
    if (this.sprite && this.sprite.isLoaded && this.sprite.isLoaded() && !this._disposed) {
      this.spriteReady = true;
      this.playAnimation('idle');
    }
  }

  takeDamage(amount) {
    if (!this.active || this._defeatRecorded) return false;
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

      if (window.gameState && !this._scoreApplied) {
        const points = this.getPointValue();
        window.gameState.score += points;
        this._scoreApplied = true;
      }
      return true;
    }
    return false;
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
    if (['virus', 'corrupted', 'firewall'].includes(this.type) && this.spriteReady && this.sprite) {

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

    if (['virus', 'corrupted', 'firewall'].includes(this.type) && this.spriteReady && this.sprite) {
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
      ctx.fillRect(bodyX, bodyY, this.width, this.height);
    }
    ctx.restore();
  }

  getDrawLayer() {
    if (this.type === 'virus') return 1;
    if (this.type === 'corrupted') return -1;
    if (this.type === 'firewall') return -1;
    return 1;
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
    this.simulationTimeMs = 0;
  }

  update(deltaTime, player) {
    if (!player) return;

    const progression = window.sector1Progression;
    const suppressMissionSimulation = progression && progression.isGameplaySuppressed && progression.isGameplaySuppressed();
    if (suppressMissionSimulation) return;
    this.simulationTimeMs += deltaTime;

    this.updateSpawnFlow(deltaTime);
    this.updateSpawnZones(deltaTime);

    const tutorial = window.tutorialSystem;
    const tutorialWaiting = tutorial && tutorial.isActive() && tutorial.storyChapter === 1 && tutorial.combatEnemiesPaused;

    // Update Enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, player, this.simulationTimeMs);

      // Tutorial Freeze Logic
      if (enemy.type === 'virus' && tutorialWaiting && enemy.active) {
        if (enemy.state !== 'patrol') enemy.state = 'patrol';
        if (enemy.position.y > 750) enemy.position.y = 750;
        const playerRef = window.player;
        if (playerRef && enemy.entranceComplete) {
           enemy.velocity.x = Math.sin(this.simulationTimeMs / 1000 + enemy.phaseOffset) * 20;
        }
      }
    });

    this.checkEnemyCollisions();
    this.checkCollisions(player);

    // Clean up dead enemies; the manager is the authoritative defeat owner.
    const newlyDefeated = this.enemies.filter(e => !e.active && e.health <= 0 && !e._defeatRecorded);
    newlyDefeated.forEach(enemy => this.recordDefeat(enemy));
    this.enemies = this.enemies.filter(e => e.active);
    this.activeFirewallCount = this.enemies.filter(e => e.type === 'firewall').length;

    // ENHANCED Spacing Check
    if (!this.hasAdequateSpacing(player)) return;

    const missionSuppressesGenericSpawning = window.sector1Progression && window.sector1Progression.shouldSuppressGenericSpawning && window.sector1Progression.shouldSuppressGenericSpawning();
    const isMainGame = !tutorial || !tutorial.isActive();
    if (isMainGame && !missionSuppressesGenericSpawning && this.shouldSpawnEnemy(this.enemies.length)) {
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
                const e1CX = box1.x + box1.width/2;
                const e1CY = box1.y + box1.height/2;
                const e2CX = box2.x + box2.width/2;
                const e2CY = box2.y + box2.height/2;

                const dx = e2CX - e1CX;
                const dy = e2CY - e1CY;
                let dist = Math.sqrt(dx*dx + dy*dy);
                let nx = dx / dist;
                let ny = dy / dist;
                if (!Number.isFinite(dist) || dist === 0) {
                    dist = 0.0001;
                    nx = (i <= j) ? 1 : -1;
                    ny = 0;
                }

                let minSep = 40, sepForce = 0.8;
                if (e1.type === e2.type) {
                    minSep = e1.type === 'firewall' ? 160 : 55;
                    sepForce = 1.0;
                }

                if (dist < minSep) {
                    const force = (minSep - dist) * sepForce;
                    const pushX = nx * force;
                    const pushY = ny * force * 0.4;

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
      if (player.controlsDisabled) return;

      const playerBox = player.getHitbox();

      this.enemies.forEach(enemy => {
          if (!enemy.active) return;
          const enemyBox = enemy.getHitbox();
          const spawnProtected = typeof enemy.isSpawnProtected === 'function' && enemy.isSpawnProtected();

          // Push player away
          const dx = player.position.x - enemy.position.x;
          const dy = player.position.y - enemy.position.y;
          let dist = Math.sqrt(dx*dx + dy*dy);
          let nx = dx / dist;
          let ny = dy / dist;
          if (!Number.isFinite(dist) || dist === 0) { dist = 0.0001; nx = 1; ny = 0; }
          if (!spawnProtected && dist < 60) {
              const push = (60 - dist) * 0.5;
              player.position.x += nx * push;
              player.position.y += ny * push * 0.5;
          }

          // Intentional passive landing stomp: top-half descending collision defeats once and bounces player.
          {
            const playerBottom = playerBox.y + playerBox.height;
            const enemyTop = enemyBox.y;
            const enemyTopHalf = enemyBox.y + enemyBox.height/2;
            const isStompPos = playerBottom > enemyTop && playerBottom < enemyTopHalf;
            const isMovingDown = player.velocity.y >= -100;

            if (isStompPos && isMovingDown && this.simpleAABBcollision(playerBox, enemyBox)) {
                enemy.takeDamage(999);
                player.velocity.y = -550;
                player.velocity.x = nx * 300;
                if (window.particleSystem) window.particleSystem.impact(enemy.position.x, enemy.position.y, '#00ffff', 20);
                player._enemyInvulnerableUntilMs = this.simulationTimeMs + 400;
                return;
              }
          }

          // Entrance protection blocks contact/push damage only; the approved passive stomp remains lethal.
          if (spawnProtected) return;

          // Check for Damage
          if (this.simpleAABBcollision(playerBox, enemyBox)) {
              if (!player._enemyInvulnerableUntilMs || this.simulationTimeMs > player._enemyInvulnerableUntilMs) {
                  if (!Number.isFinite(enemy.lastPlayerHitTimeMs) || this.simulationTimeMs - enemy.lastPlayerHitTimeMs > 1500) {
                      enemy.lastPlayerHitTimeMs = this.simulationTimeMs;
                      player.takeDamageWithKnockback(enemy.damage, nx * 450, -300, enemy.position);
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
          this.lastFirewallSpawnTime = this.simulationTimeMs;
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

  checkPlayerAttacks(player, attackTransaction = null) {
    // Deprecated compatibility shim: BARCODE.PlayerCombat is the only production damage owner.
    if (attackTransaction && attackTransaction.__fromPlayerCombat === true && window.BARCODE && window.BARCODE.playerCombat) {
      return window.BARCODE.playerCombat.resolvePrimary({ player, enemyManager: this, timing: attackTransaction.timing });
    }
    return { ok: false, action: 'primary', reason: 'combat-owned-by-player-combat', targets: [] };
  }

  // Restored Crowd Mechanics methods
  updateCrowdMechanics(deltaTime, player) {
    this.crowdCheckTimer += deltaTime;
    if (this.crowdCheckTimer >= this.crowdCheckInterval) {
      this.crowdCheckTimer = 0;
      this.detectCrowds();
    }

    // Apply crowd behaviors
    this.enemies.forEach(enemy => {
      if (enemy._crowdBurstTimer) {
        enemy._crowdBurstTimer = Math.max(0, enemy._crowdBurstTimer - deltaTime);
        if (enemy._crowdBurstTimer === 0) enemy._crowdBurstMultiplier = 1;
      }
    });
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

      const time = this.simulationTimeMs / 1000;
      const phaseShift = (index / group.length) * Math.PI * 2;

      if (distToPlayer < 400) {
        const angleToPlayer = Math.atan2(player.position.y - groupCenter.y, player.position.x - groupCenter.x);
        const spreadAngle = angleToPlayer + Math.sin(time + phaseShift) * 0.3;

        if (enemy.type === 'virus') {
          enemy.velocity.x = Math.cos(spreadAngle) * enemy.speed * (enemy._crowdSpeed || 1) * (enemy._crowdBurstMultiplier || 1) * 1.3;
          if (Math.sin(time * 2 + phaseShift) > 0.8 && enemy.isOnGround) {
            enemy.velocity.y = -enemy.speed * 0.15;
          }
        } else if (enemy.type === 'corrupted') {
          enemy.velocity.x = Math.cos(spreadAngle) * enemy.speed * (enemy._crowdSpeed || 1) * (enemy._crowdBurstMultiplier || 1) * 1.2;
        }

        if (enemy._crowdAggression && Math.random() < 0.01 * enemy._crowdAggression) {
          enemy._crowdBurstTimer = 2000;
          enemy._crowdBurstMultiplier = 1.2;
        }
      } else {
        const formationAngle = Math.atan2(enemy.position.y - groupCenter.y, enemy.position.x - groupCenter.x);
        const orbitSpeed = 0.5;

        enemy.velocity.x = Math.cos(formationAngle + Math.PI/2) * enemy.speed * orbitSpeed;
        enemy.velocity.y = Math.sin(formationAngle + Math.PI/2) * enemy.speed * orbitSpeed * 0.3;
      }
    });
  }

  recordDefeat(enemy) {
    if (!enemy || enemy._defeatRecorded) return false;
    enemy._defeatRecorded = true;
    const countsTowardDefeatProjection = !enemy._jammerReinforcement;
    if (countsTowardDefeatProjection) {
      this.defeatedCount += 1;
      if (window.gameState) window.gameState.enemiesDefeated = this.defeatedCount;
      if (window.sector1Progression && typeof window.sector1Progression.onEnemyDefeated === 'function') window.sector1Progression.onEnemyDefeated(this.defeatedCount, enemy);
    }
    if (enemy._isTutorialEnemy && window.tutorialSystem && window.tutorialSystem.isActive && window.tutorialSystem.isActive() && window.tutorialSystem.storyChapter === 1) {
      window.tutorialSystem._tutorialEnemiesDefeated = (window.tutorialSystem._tutorialEnemiesDefeated || 0) + 1;
      if (window.tutorialSystem._tutorialEnemiesDefeated >= 3) window.tutorialSystem.checkObjective('combat');
    }
    return true;
  }

  purgeForCinematic() {
    if (this._cinematicPurgeComplete) return false;
    this._cinematicPurgeComplete = true;
    const activeEnemies = this.enemies.filter(e => e && e.active && !e._purgedByCinematic);
    if (activeEnemies.length && window.audioSystem && typeof window.audioSystem.playSound === 'function') window.audioSystem.playSound('synthHit', 0.2);
    activeEnemies.forEach(e => {
      e.velocity.x = 0; e.velocity.y = 0; e._purgedByCinematic = true; e._defeatRecorded = true;
      if (window.particleSystem) {
        if (typeof window.particleSystem.impact === 'function') window.particleSystem.impact(e.position.x, e.position.y, '#ff00ff', 28);
        if (typeof window.particleSystem.enemyDeathEffect === 'function') window.particleSystem.enemyDeathEffect(e.position.x, e.position.y, e.type);
      }
      e.active = false; e._disposed = true; e._generation = (e._generation || 0) + 1;
    });
    this.enemies = this.enemies.filter(e => !e._purgedByCinematic && e.active);
    this.crowdGroups = [];
    this.activeFirewallCount = 0;
    return activeEnemies.length > 0;
  }

  getDiagnostics() {
    return { activeEnemies: this.getActiveEnemies().length, totalEnemies: this.enemies.length, defeatedCount: this.defeatedCount, crowdGroups: this.crowdGroups.length, simulationTimeMs: this.simulationTimeMs, pendingSpritePolls: this.enemies.filter(e => e._spriteRequested && !e.spriteReady && !e._disposed).length };
  }

  reset(options = {}) { this.clear(options); }

  dispose(options = {}) { this.clear(options); this._disposed = true; }

  clear(options = {}) {
    this.enemies.forEach(e => { e.active = false; e._disposed = true; e._generation = (e._generation || 0) + 1; e._crowdBurstTimer = 0; e._crowdBurstMultiplier = 1; });
    this.enemies = [];
    if (!options.preserveDefeats) this.defeatedCount = 0;
    this.spawnTimer = 0;
    this.spawnFlowState = 'building';
    this.crowdGroups = [];
    this._cinematicPurgeComplete = false;
    if (!options.preserveDefeats) this.simulationTimeMs = 0;
    if (typeof window.syncEnemyDefeatProjections === 'function') window.syncEnemyDefeatProjections(this.defeatedCount);
    console.log('✓ Enemy Manager cleared');
  }
};

// Global Initialization
function createEnemyManager() {
  if (window.Vector2D && window.distance && window.clamp && window.randomRange) {
    if (!window.enemyManager) {
      window.enemyManager = new window.EnemyManager();
      console.log("✅ Enemy Manager Initialized");
    }
    return window.enemyManager;
  } else {
    console.warn('Enemy manager dependencies not ready; script order should load math utilities before enemies.');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createEnemyManager);
} else {
  createEnemyManager();
}
