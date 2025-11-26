// Game state management focused on player control
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/game-manager.js',
  exports: ['gameManager', 'updatePlayerMovement', 'handlePlayerInput'],
  dependencies: ['player']
});

window.gameManager = {
  // Player input handling
  updatePlayerMovement(deltaTime) {
    if (!window.player || !window.inputManager) return;
    
    const dt = deltaTime / 1000;
    
    // Handle continuous movement
    const movement = window.inputManager.getMovement();
    
    // Apply movement with proper state checks
    if (window.player.state !== 'rhythm' && window.player.state !== 'hack') {
      if (movement.x < 0) {
        window.player.moveLeft();
      } else if (movement.x > 0) {
        window.player.moveRight();
      } else {
        window.player.stopHorizontal();
      }
    }
    
    // Handle jump input
    if (window.inputManager.isKeyPressed('space')) {
      window.player.jump();
    }
  },
  
  // Handle player input
  handlePlayerInput() {
    // Rhythm mode toggle
    if (window.inputManager.isKeyPressed('r')) {
      if (window.player.state === 'rhythm') {
        if (window.rhythmSystem && window.rhythmSystem.hide) {
          window.rhythmSystem.hide();
        }
      } else {
        if (window.rhythmSystem && window.rhythmSystem.show) {
          window.rhythmSystem.show();
        }
      }
    }
    
    // Hack mode toggle
    if (window.inputManager.isKeyPressed('h')) {
      if (window.hackingSystem && window.hackingSystem.isActive()) {
        window.hackingSystem.cancel();
      } else {
        if (window.hackingSystem && window.hackingSystem.start) {
          window.hackingSystem.start();
        }
      }
    }
  },
  
  // Update player state transitions
  updatePlayerState() {
    if (!window.player) return;
    
    const wasState = window.player.state;
    
    // Check for rhythm mode
    const rhythmActive = window.rhythmSystem?.isActive();
    
    // Check for hack mode
    const hackActive = window.hackingSystem?.isActive();
    
    // State machine: Rhythm > Hack > Jump > Walk > Idle
    if (rhythmActive) {
      window.player.state = 'rhythm';
    } else if (hackActive) {
      window.player.state = 'hack';
    } else if (!window.player.grounded || window.inputManager.isKey('arrowup')) {
      window.player.state = 'jump';
    } else if (Math.abs(window.player.velocity.x) > 5) {
      window.player.state = 'walk';
    } else {
      window.player.state = 'idle';
    }
    
    // Log state changes (reduced logging)
    if (wasState !== window.player.state) {
      console.log(`Player state: ${wasState} → ${window.player.state}`);
    }
  }
  
  // Handle player damage
  handlePlayerDamage() {
    if (!window.player) return;
    
    // Check invulnerability
    const currentTime = Date.now();
    if (window.player.invulnerableUntil && currentTime < window.player.invulnerableUntil) {
      return;
    }
    
    // Take damage
    window.player.takeDamage(1);
    
    // Set invulnerability period
    window.player.invulnerableUntil = currentTime + 2000;
  },
  
  // Handle player death
  handlePlayerDeath() {
    if (!window.gameManager) return;
    
    window.gameManager.handleGameOver();
    this.respawnPlayer();
  },
  
  // Respawn player at start position
  respawnPlayer() {
    if (!window.player) return;
    
    // Reset position and health
    window.player.health = window.player.maxHealth;
    window.player.position = new window.Vector2D(200, 850);
    window.player.velocity = new window.Vector2D(0, 0);
    
    // Trigger entrance animation
    if (typeof window.player.startEntranceAnimation === 'function') {
      window.player.startEntranceAnimation();
    }
    
    // Brief invulnerability
    window.player.invulnerableUntil = Date.now() + 2000;
  },
  
  // Handle player abilities
  handlePlayerAbilities() {
    // Dash ability
    if (window.player.canDash && window.inputManager.isKeyPressed('shift')) {
      window.player.dash();
    }
    
    // Special attacks
    if (window.inputManager.isKeyPressed('down')) {
      this.handleRhythmAttack();
    }
  },
  
  // Handle rhythm attacks
  handleRhythmAttack() {
    if (!window.rhythmSystem || !window.rhythmSystem.isActive()) return;
    
    // Execute rhythm attack
    const result = window.rhythmSystem.handleInput('attack');
    
    if (result && result.hit) {
      console.log('Rhythm hit! Timing:', result.timing);
    }
  },
  
  // Check player special abilities
  checkPlayerAbilities() {
    // Can player dash?
    window.player.canDash = window.player.dashCooldown <= 0;
    
    // Can player fast-fall?
    const isFastFalling = window.player.velocity.y > 0 && window.inputManager && window.inputManager.isKey('arrowdown');
    
    // Special moves
    if (window.player.isSpecialMoveActive()) {
      // Handle special abilities
    }
  },
  
  // Update player special moves
  updatePlayerSpecialMoves(deltaTime) {
    if (!window.player || !window.player.isSpecialMoveActive()) return;
    
    const dt = deltaTime / 1000;
    
    // Handle double jump
    if (window.player.canDoubleJump && window.inputManager.isKeyPressed('space') && window.player.jumpCount === 1) {
      window.player.performDoubleJump();
    }
    
    // Handle wall slide
    if (window.player.isWallSliding()) {
      this.updateWallSlide(deltaTime);
    }
    
    // Update fast-fall
    if (window.player.isFastFalling()) {
      this.updateFastFall(deltaTime);
    }
  },
  
  // Handle wall sliding
  updateWallSlide(deltaTime) {
    const player = window.player;
    if (!player || !player.onWall()) return;
    
    // Apply friction
    player.velocity.x *= 0.85;
    
    // Maintain wall contact
    this.maintainWallContact();
    
    // Release wall slide
    if (window.inputManager.isKeyReleased('arrow') || !window.inputManager.isKey('arrow')) {
      player.wallStickiness *= 0.8;
      if (player.wallStickiness < 0.1) {
        player.onWall = false;
      }
    }
  },
  
  // Maintain wall contact
  maintainWallSlideContact() {
    const player = window.player;
    if (!player || !player.onWall()) return;
    
    const wallRight = window.getWallRight();
    const wallLeft = window.getWallLeft();
    
    // Check wall contacts
    if (player.position.x + player.width >= wallRight - 5) {
      player.onWall = true;
      player.position.x = wallRight - player.width - 5;
      player.velocity.x = 0;
      player.wallStickiness = 1.0;
    } else if (player.position.x <= wallLeft + 5) {
      player.onWall = true;
      player.position.x = wallLeft + 5;
      player.velocity.x = 0;
      player.wallStickiness = 1.0;
    } else {
      player.onWall = false;
      player.wallStickiness = 0;
    }
  },
  
  // Handle fast-fall
  updateFastFall(deltaTime) {
    const player = window.player;
    if (!player) return;
    
    const isFastFalling = player.velocity.y > 0 && window.inputManager && window.inputManager.isKey('arrowdown');
    
    if (isFastFalling) {
      // Increased gravity
      player.velocity.y += 2000 * (deltaTime / 1000);
      
      // Increase max fall speed
      const terminalVelocity = 1800;
      player.velocity.y = Math.min(player.velocity.y, terminalVelocity);
      
      // Create wind effects
      this.createWindEffects();
    }
  },
  
  // Create wind effects for fast-fall
  createWindEffects() {
    const player = window.player;
    if (!player) return;
    
    // Add wind particles
    for (let i = 0; i < 3; i++) {
      const windX = (Math.random() - 0.5) * 40;
      const windY = -Math.random() * 20 - 40;
      
      player.windEffects.push({
        x: player.position.x + windX,
        y: player.position.y + windY,
        vx: (Math.random() - 0.5) * 50,
        vy: Math.random() * 20 - 10,
        life: 1.0,
        color: '#00ffff'
      });
    }
    
    player.windEffects = player.windEffects.filter(effect => effect.life > 0);
  },
  
  // Update wind effects
  updateWindEffects(deltaTime) {
    const player = window.player;
    if (!player || !player.windEffects.length) return;
    
    const dt = deltaTime / 1000;
    
    player.windEffects = player.windEffects.filter(effect => {
      // Update position
      effect.x += effect.vx * dt;
      effect.y += effect.vy * dt;
      
      // Update life
      effect.life -= dt * 0.5;
      
      // Update size
      effect.size *= 1 + dt * 0.2;
      
      return effect.life > 0;
    });
  },
  
  // Handle double jump
  performDoubleJump() {
    const player = window.player;
    if (!player || !player.canDoubleJump || player.jumpCount !== 1) return;
    
    // Second jump
    player.velocity.y = -player.jumpPower * 1.2;
    player.jumpCount++;
    player.canDoubleJump = false;
    
    // Double jump particles
    if (window.particleSystem) {
      window.particleSystem.jumpEffect(player.position.x, player.position.y);
    }
  }
};