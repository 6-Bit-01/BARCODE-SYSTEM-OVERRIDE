// Player character controller for 6 Bit - MakkoEngine Integration
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/player.js',
  exports: ['Player', 'player'],
  dependencies: ['Vector2D', 'clamp', 'distance']
});

// These foot rows are untrimmed source-frame coordinates (all four source
// sheets use a 96px-tall canvas). They retain the approved sprite sizes while
// anchoring the lowest visible foot pixel to one canonical presentation line
// on every frame. Player.position.y is the historical physics anchor, always
// 72px above the visible foot-contact line. Keep that world-space contract
// separate from Makko's source-frame anchor compensation below.
const PLAYER_VISUAL_FOOT_OFFSET_Y = 72;
// The real sidewalk-to-awning rise is taller than the legacy physics-space
// gap. Scale every vertical jump term together so the route gains height while
// preserving the established takeoff/apex/landing timing.
const PLAYER_VERTICAL_TRAVERSAL_SCALE = 1.3;
const PLAYER_ANIMATION_PRESENTATION = Object.freeze({
  idle: Object.freeze({
    animation: '6_bit_idle_idle',
    scale: 2,
    anchorX: 43,
    anchorY: 95,
    footRows: Object.freeze([
      95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
      95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95
    ])
  }),
  walk: Object.freeze({
    animation: '6_bit_walk_walk',
    scale: 2 * (71 / 66),
    anchorX: 33,
    anchorY: 94,
    footRows: Object.freeze([
      94, 93, 93, 93, 94, 95, 94, 94, 95, 95, 95, 94,
      94, 94, 94, 94, 94, 94, 93, 93, 93, 94, 94, 93,
      93, 93, 93, 93, 93, 95, 94, 95, 95, 95, 94, 94,
      94, 94, 94, 93, 93, 94, 95, 95, 95, 95, 95, 95
    ])
  }),
  jump: Object.freeze({
    animation: '6_bit_jump_jump',
    scale: 2 * (49 / 41),
    anchorX: 21,
    anchorY: 95,
    footRows: Object.freeze([
      94, 94, 94, 94, 91, 86, 76, 73, 68, 68, 69, 74, 82, 84,
      89, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 93
    ])
  }),
  rhythm: Object.freeze({
    animation: '6_bit_r__h_mode_rhmode',
    scale: 2 * (60 / 51),
    anchorX: 26,
    anchorY: 95,
    footRows: Object.freeze([
      95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
      95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
      95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95,
      95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95, 95
    ])
  })
});

window.Player = class Player {
  static get VISUAL_FOOT_OFFSET_Y() { return PLAYER_VISUAL_FOOT_OFFSET_Y; }

  constructor(x, y) {
    this.position = new window.Vector2D(x, y);
    
    // Entrance effect system
    this.isEntering = false;
    this.entranceStartTime = 0;
    this.entranceDuration = 1500; // 1.5 seconds for entrance animation
    this.entranceStartX = x;
    this.entranceTargetX = 960; // Target position in middle
    this.velocity = new window.Vector2D(0, 0);
    this.width = 86;  // Based on sprite dimensions
    this.height = 96; // Based on sprite dimensions
    this.speed = 300; // pixels per second
    this.jumpPower = 800 * PLAYER_VERTICAL_TRAVERSAL_SCALE;
    this.jumpTime = 0;
    this.maxJumpTime = 200; // Max jump duration in ms
    this.health = 3;
    this.maxHealth = 3;
    this.grounded = false;
    this.facing = 1; // 1 for right, -1 for left
    
    // Animation states
    this.state = 'idle';
    this.animationTime = 0;
    
    // Jump animation tracking
    this.wasJumping = false; // Track if player was jumping in previous frame
    this.jumpAnimationStarted = false; // Track if jump animation was started for current jump
    
    // MakkoEngine sprite character
    this.sprite = null;
    this.currentAnimation = null;
    this.animationRef = null;
    this.spriteReady = false;
    
    // Initialize sprite character
    this.initSprite();
    
    // Trigger entrance animation if starting from left side
    if (x < 400) {
      this.startEntranceAnimation();
    }
    
    this.invulnerable = false;
    
    // Control disable system (for collision knockback)
    this.controlsDisabled = false;
    this.controlsDisabledUntil = 0;
    
    // Damage invulnerability system
    this.invulnerableUntil = 0;
    
    // Wind effects (legacy visual helper; inactive)
    this.windEffects = [];
    this.lastWindEffectTime = 0;
    
    // Electrical arc system for rhythm mode
    this.electricalArcs = [];
    this.lastArcTime = 0;
    this.arcPulsePhase = 0;
    this.arcActive = false;
    this.primaryAttackAnimationMs = 0;
    this.cinematicPoseActive = false;
  }

  update(deltaTime, allowMovement = true) {
    try {
      
      // Store movement permission flag
      this.allowMovement = allowMovement;
      
      const dt = deltaTime / 1000; // Convert to seconds
      const previousFootY = this.position.y;
      const previousX = this.position.x;
      
      // Update entrance animation
      this.updateEntranceAnimation(deltaTime);
      
      // Apply gravity with variable rates (only if movement is allowed)
      if (!this.grounded && this.allowMovement) {
        // Track jump time for variable gravity
        this.jumpTime += deltaTime;
        
        let gravity = 0;
        if (this.jumpTime < 100) {
          // Ultra-fast ascent phase - almost no gravity
          gravity = 100 * PLAYER_VERTICAL_TRAVERSAL_SCALE;
        } else if (this.jumpTime < 200) {
          // Minimal float phase - light gravity
          gravity = 400 * PLAYER_VERTICAL_TRAVERSAL_SCALE;
        } else {
          // Very quick descent - heavy gravity
          gravity = 2000 * PLAYER_VERTICAL_TRAVERSAL_SCALE;
        }
        
        this.velocity.y += gravity * dt;
        
        const terminalVelocity = 1200 * PLAYER_VERTICAL_TRAVERSAL_SCALE;
        this.velocity.y = Math.min(this.velocity.y, terminalVelocity);
      } else {
        this.jumpTime = 0; // Reset jump time when grounded
      }
      
      if (this.primaryAttackAnimationMs > 0) {
        this.primaryAttackAnimationMs = Math.max(0, this.primaryAttackAnimationMs - deltaTime);
      }
      
      // Update position only if movement is allowed
      if (this.allowMovement) {
        this.position = this.position.add?.(this.velocity.multiply?.(dt) || this.position);
      }
      
      let landedOnStageSurface = false;
      if (window.sector1Progression && typeof window.sector1Progression.applyPlayerStageCollision === 'function') {
        landedOnStageSurface = window.sector1Progression.applyPlayerStageCollision(this, { previousFootY, currentFootY: this.position.y, previousX });
      }

      // Ground collision (character feet at ground line y=750 - raised up
      const wasGrounded = this.grounded;
      if (this.position.y >= 750) {
        this.position.y = 750;
        this.velocity.y = 0;
        this.grounded = true;
        
        // CRITICAL FIX: Reset jump animation tracking when landing
        // This ensures next jump will restart animation from beginning
        if (!wasGrounded) {
          this.jumpAnimationStarted = false;
          console.log('🏁 Landed - jump animation tracking reset for next jump');
        }
        
        // Landing particles moved way down
        if (!wasGrounded && window.particleSystem) {
          // Move landing smoke 10px toward front of player
          const landingX = this.position.x + this.facing * 10;
          window.particleSystem.landingEffect(landingX, this.getVisualAnchor().targetFootY, null);
        }
      } else if (!landedOnStageSurface) {
        this.grounded = false;
      }
      
      // Side-scroller world boundaries (background is 4096px wide)
      const worldLeft = this.width/2;
      const worldRight = 4096 - this.width/2;
      this.position.x = window.clamp?.(this.position.x, worldLeft, worldRight) || this.position.x;
      this.position.y = window.clamp?.(this.position.y, 0, 1080 - this.height/2) || this.position.y;
      
      // Update animation
      this.animationTime += deltaTime;
      this.updateState();
      
      // Update sprite animation with proper deltaTime
      this.updateSpriteAnimation(deltaTime);
      
      // Update wind effects
      this.updateWindEffects(deltaTime);
      
      // Update electrical arcs during rhythm mode
      this.updateElectricalArcs(deltaTime);
      
    } catch (error) {
      console.error('Error updating player:', error?.message || error);
    }
  }

  updateState() {
    const oldState = this.state;
    
    const rhythmSystemExists = !!window.rhythmSystem;
    const hasIsActive = rhythmSystemExists && typeof window.rhythmSystem.isActive === 'function';
    const rhythmActive = hasIsActive && window.rhythmSystem.isActive();
    const bossCinematicActive = !!(
      window.sector1Progression &&
      typeof window.sector1Progression.isBossCinematicActive === 'function' &&
      window.sector1Progression.isBossCinematicActive()
    );
    this.cinematicPoseActive = bossCinematicActive;

    // Check if up key is held for continuous jump animation
    const upKeyHeld = window.inputManager && window.inputManager.isKey('arrowup');
    
    // Detect new jump (was grounded, now airborne)
    const justStartedJumping = this.wasJumping === false && !this.grounded;
    if (justStartedJumping) {
      this.jumpAnimationStarted = false; // Force animation restart on new jump
      if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log('🦘 Character just left ground - jump animation will restart');
    }
    
    // The cinematic owns presentation only. Rhythm Mode itself remains active,
    // so its approved timing and combat state resume after the camera returns.
    if (bossCinematicActive) {
      this.state = 'idle';
    // Priority order: Rhythm Mode/transient attack > Jump (if up held) > Walk > Idle
    } else if (rhythmActive || this.primaryAttackAnimationMs > 0) {
      this.state = 'rhythm';
    } else if (!this.grounded || upKeyHeld) {
      this.state = 'jump'; // Stay in jump state if up key is held (even when grounded)
    } else if (Math.abs(this.velocity.x) > 5) {
      this.state = 'walk';
    } else {
      this.state = 'idle';
    }
    
    // Update jump tracking
    this.wasJumping = !this.grounded;
    
    // Debug state changes (reduced logging)
    if (oldState !== this.state) {
      if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log(`🔄 Player state: ${oldState} → ${this.state} (upHeld: ${upKeyHeld}, newJump: ${justStartedJumping})`);
    }
  }


  startPrimaryAttackAnimation(durationMs = 180) {
    this.primaryAttackAnimationMs = Math.max(this.primaryAttackAnimationMs || 0, durationMs);
    this.state = 'rhythm';
    if (typeof this.playAnimation === 'function') this.playAnimation('rhythm');
  }

  getAnimationPresentation(state = this.state) {
    return PLAYER_ANIMATION_PRESENTATION[state] || PLAYER_ANIMATION_PRESENTATION.idle;
  }

  getMakkoRenderMetrics(presentation = this.getAnimationPresentation(), flipH = false) {
    // Makko has two anchor paths. A manifest anchor is multiplied by the final
    // frame scale before Character.draw subtracts it. Its legacy fallback
    // subtracts the source anchor unscaled even though the frame pixels still
    // scale. Read the active sheet so the inverse positioning below matches
    // the path the runtime will actually use instead of assuming one schema.
    const spriteSheet = this.sprite?.currentSprite || this.sprite?._currentSprite || null;
    const runtimeAnchor = typeof spriteSheet?.getAnchorPoint === 'function'
      ? spriteSheet.getAnchorPoint()
      : null;
    const hasRuntimeAnchorX = Number.isFinite(runtimeAnchor?.x);
    const hasRuntimeAnchorY = Number.isFinite(runtimeAnchor?.y);
    const hasRuntimeAnchor = hasRuntimeAnchorX || hasRuntimeAnchorY;
    const sourceAnchorX = hasRuntimeAnchorX
      ? runtimeAnchor.x
      : presentation.anchorX;
    const sourceAnchorY = hasRuntimeAnchorY
      ? runtimeAnchor.y
      : presentation.anchorY;

    let usesScaledAnchor = true;
    if (spriteSheet) {
      if (!hasRuntimeAnchor) {
        usesScaledAnchor = false;
      } else if (typeof spriteSheet.hasManifestAnchor === 'function') {
        usesScaledAnchor = !!spriteSheet.hasManifestAnchor();
      } else if (spriteSheet.manifestMetadata) {
        usesScaledAnchor = !!spriteSheet.manifestMetadata.anchor;
      } else {
        usesScaledAnchor = false;
      }
    }

    const reportedManifestScale = typeof spriteSheet?.getManifestScale === 'function'
      ? spriteSheet.getManifestScale()
      : spriteSheet?.manifestMetadata?.scale;
    const manifestScale = Number.isFinite(reportedManifestScale) && reportedManifestScale > 0
      ? reportedManifestScale
      : 1;
    const frameScale = presentation.scale * manifestScale;
    const anchorMultiplier = usesScaledAnchor ? frameScale : 1;
    const anchorOffsetX = spriteSheet && !hasRuntimeAnchorX ? 0 : sourceAnchorX * anchorMultiplier;
    const anchorOffsetY = spriteSheet && !hasRuntimeAnchorY ? 0 : sourceAnchorY * anchorMultiplier;

    return {
      sourceAnchorX,
      sourceAnchorY,
      hasRuntimeAnchor,
      hasRuntimeAnchorX,
      hasRuntimeAnchorY,
      usesScaledAnchor,
      manifestScale,
      frameScale,
      flipSignX: flipH ? -1 : 1,
      anchorOffsetX,
      anchorOffsetY
    };
  }

  getVisualAnchor(flipH = false) {
    const presentation = this.getAnimationPresentation();
    const frameCount = presentation.footRows.length;
    const rawFrame = Number.isFinite(this.animationRef?.currentFrame) ? this.animationRef.currentFrame : 0;
    const frameIndex = frameCount > 0 ? Math.max(0, Math.trunc(rawFrame)) % frameCount : 0;
    const footRow = presentation.footRows[frameIndex] ?? presentation.anchorY;
    const targetFootY = this.position.y + PLAYER_VISUAL_FOOT_OFFSET_Y;
    const render = this.getMakkoRenderMetrics(presentation, flipH);
    // Character.draw ultimately renders the visible foot at:
    // inputY - anchorOffsetY + footRow * frameScale. Solve that expression
    // backwards so both Makko anchor paths land on the same physics target.
    const drawY = targetFootY + render.anchorOffsetY - footRow * render.frameScale;
    // The same legacy mismatch affects X and is mirrored when flipH is active.
    // Keep the source anchor column on position.x in either facing direction.
    const drawX = this.position.x + render.flipSignX * (
      render.anchorOffsetX - render.sourceAnchorX * render.frameScale
    );

    return {
      x: drawX,
      y: drawY,
      scale: presentation.scale,
      anchorX: render.sourceAnchorX,
      anchorY: render.sourceAnchorY,
      footRow,
      frameIndex,
      targetFootY,
      manifestScale: render.manifestScale,
      frameScale: render.frameScale,
      usesScaledAnchor: render.usesScaledAnchor,
      flipSignX: render.flipSignX,
      anchorOffsetX: render.anchorOffsetX,
      anchorOffsetY: render.anchorOffsetY,
      visibleAnchorX: drawX + render.flipSignX * (
        render.sourceAnchorX * render.frameScale - render.anchorOffsetX
      ),
      visibleFootY: drawY - render.anchorOffsetY + footRow * render.frameScale
    };
  }

  // Initialize sprite character with MakkoEngine
  async initSprite() {
    try {
      console.log('Initializing 6_bit_main character...');
      
      // Check if we should use fallback graphics
      if (window.useFallbackGraphics) {
        console.log('Using fallback graphics - MakkoEngine not available');
        this.spriteReady = false;
        this.sprite = null;
        return;
      }
      
      // Wait for MakkoEngine to be available
      if (!window.MakkoEngine) {
        console.log('MakkoEngine not available - waiting...');
        setTimeout(() => this.initSprite(), 100);
        return;
      }
      
      // Wait for engine to be loaded
      if (!window.MakkoEngine.isLoaded()) {
        console.log('MakkoEngine still loading - waiting...');
        setTimeout(() => this.initSprite(), 100);
        return;
      }
      
      // Get the 6_bit_main character
      this.sprite = window.MakkoEngine.sprite('6_bit_main');
      
      if (!this.sprite) {
        console.error('❌ 6_bit_main character not found in manifest');
        this.spriteReady = false;
        return;
      }
      
      // Wait for character to be loaded
      if (!this.sprite.isLoaded()) {
        console.log('6_bit_main still loading - waiting...');
        setTimeout(() => this.initSprite(), 100);
        return;
      }
      
      console.log('✓ 6_bit_main character loaded successfully');
      const animations = this.sprite.getAvailableAnimations();
      console.log('Available animations:', animations);
      
      this.spriteReady = true;
      this.currentAnimation = null;
      
      // Start with idle animation
      this.playAnimation('idle');
      console.log('✓ Initial idle animation started');
      
    } catch (error) {
      console.error('Error initializing sprite:', error?.message || error);
      this.spriteReady = false;
      this.sprite = null;
    }
  }

  // Update sprite animation based on current state
  updateSpriteAnimation(deltaTime) {
    if (!this.spriteReady || !this.sprite) {
      return;
    }
    
    try {
      // A Jammer-destruction cinematic always presents a clean, frozen neutral
      // pose instead of preserving a random attack frame. No RhythmSystem state
      // is stopped or reset here.
      // Makko animation time in this project advances only through update().
      // Withholding that call freezes the selected neutral frame without
      // depending on optional sprite pause/resume methods.
      if (!this.cinematicPoseActive) this.sprite.update(deltaTime);
      
      // Check if we need to play different animation based on state
      const expectedAnimation = PLAYER_ANIMATION_PRESENTATION[this.state]?.animation;
      
      // CRITICAL FIX: Only change animation if current animation is actually different
      // AND only if the sprite is stuck or not playing the right animation
      const spriteCurrentAnim = this.sprite.getCurrentAnimation();
      const needsAnimationChange = (
        expectedAnimation && 
        this.currentAnimation !== expectedAnimation
      );
      
      // CRITICAL FIX: Additional check for stuck animations (rhythm mode specific)
      const isRhythmStuck = (
        this.state === 'rhythm' && 
        spriteCurrentAnim === '6_bit_r__h_mode_rhmode' && 
        this.animationRef && 
        !this.animationRef.isInterrupted && 
        this.animationRef.currentFrame === 0 && 
        this.animationRef.elapsedTime > 500 // Stuck on first frame for more than 500ms
      );
      
      // CRITICAL FIX: For jump animations, restart when character leaves ground
      const shouldRestartJump = (
        this.state === 'jump' && 
        expectedAnimation === '6_bit_jump_jump' &&
        !this.jumpAnimationStarted &&
        this.wasJumping === false && !this.grounded // Just left ground
      );
      
      if (needsAnimationChange || isRhythmStuck || shouldRestartJump) {
        if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log(`🔄 Animation change needed: state=${this.state}, current=${this.currentAnimation}, expected=${expectedAnimation}, stuck=${isRhythmStuck}, restartJump=${shouldRestartJump}`);
        this.playAnimation(this.state);
      }

      // DEBUG: Log animation status periodically
      if (window.BARCODE_DEBUG_FRAME_OWNERSHIP && (!this.lastAnimLog || Date.now() - this.lastAnimLog > 3000)) {
        const isPlaying = this.sprite ? this.sprite.playing : 'null';
        const frameInfo = this.animationRef ? `frame=${this.animationRef.currentFrame}/${this.animationRef.totalFrames}` : 'no-ref';
        if (window.BARCODE_DEBUG_FRAME_OWNERSHIP) console.log(`🎬 Animation Status: state=${this.state}, current=${this.currentAnimation}, spriteCurrent=${spriteCurrentAnim}, playing=${isPlaying}, ${frameInfo}`);
        this.lastAnimLog = Date.now();
      }
      
    } catch (error) {
      console.error('Error updating sprite animation:', error?.message || error);
    }
  }

  // Play a specific animation
  playAnimation(animationName) {
    if (!this.spriteReady || !this.sprite) {
      // Silently handle fallback mode without excessive logging
      if (!window.useFallbackGraphics) {
        console.log(`❌ Cannot play animation ${animationName}: sprite not ready`);
      }
      return;
    }
    
    try {
      // Map animation names if needed
      const fullAnimationName = PLAYER_ANIMATION_PRESENTATION[animationName]?.animation || animationName;
      
      // CRITICAL FIX: Force animation restart when transitioning from rhythm/hack mode or after damage
      // This prevents walk animations from getting stuck
      const currentSpriteAnim = this.sprite.getCurrentAnimation();
      const shouldRestartJump = animationName === 'jump' && !this.jumpAnimationStarted;
      
      // Special case: For jump animations, allow restart when just leaving ground
      const isJumpRestartAllowed = (
        animationName === 'jump' && 
        shouldRestartJump &&
        this.wasJumping === false && !this.grounded
      );
      
      // CRITICAL FIX: Always restart walk animation to prevent getting stuck
      const shouldForceRestart = (
        animationName === 'walk' || 
        (currentSpriteAnim === '6_bit_walk_walk' && animationName !== 'walk')
      );
      
      if (currentSpriteAnim === fullAnimationName && this.animationRef && !this.animationRef.isInterrupted && !shouldRestartJump && !isJumpRestartAllowed && !shouldForceRestart) {
        // Animation is already playing correctly - don't restart it
        console.log(`🎬 SKIPPING: ${fullAnimationName} already playing`);
        return;
      }
      
      // Mark jump animation as started
      if (animationName === 'jump') {
        this.jumpAnimationStarted = true;
      }
      
      console.log(`🎬 PLAYING: ${fullAnimationName} (state: ${this.state})`);
      
      // CRITICAL FIX: Jump animation should loop while jumping, but restart when character leaves ground
      const shouldLoop = true; // All animations loop, jump restart handled separately
      
      // CRITICAL: Always stop current animation before playing new one
      // This ensures rhythm animation doesn't get stuck on first frame
      this.sprite.stop();
      
      try {
        this.animationRef = this.sprite.play(fullAnimationName, shouldLoop);
        this.currentAnimation = fullAnimationName;
      } catch (playError) {
        console.error(`Error playing animation ${fullAnimationName}:`, playError?.message || playError);
        return;
      }
      
      // CRITICAL FIX: For rhythm animations, add extra validation and recovery
      if (animationName === 'rhythm' && this.animationRef) {
        // Set up stuck animation detection and recovery
        this.animationRef.onCycle(() => {
          console.log('🔄 Rhythm animation completed a cycle - playing properly');
        });
        
        // Emergency recovery: if still stuck after 1 second, force restart
        setTimeout(() => {
          if (this.animationRef && this.animationRef.currentFrame === 0 && this.state === 'rhythm') {
            console.warn('⚠️ Rhythm animation stuck detected - forcing restart');
            this.sprite.stop();
            this.animationRef = this.sprite.play(fullAnimationName, shouldLoop);
          }
        }, 1000);
      }
      
      // All animations now loop - no onComplete handling needed
      
      console.log(`✅ Animation ${fullAnimationName} started successfully`);
      
    } catch (error) {
      console.error('Error playing animation:', error?.message || error);
    }
  }

  moveLeft() {
    if (this.state === 'rhythm' || this.isEntering || !this.allowMovement) {
      return;
    }
    
    this.facing = -1; // Face left
    this.velocity.x = -this.speed;
    {
      
      // White smoke/dust trail particles behind player
      if (window.particleSystem && this.grounded) {
        // Position particles 8px behind player and 12px toward front (offset from -20 to -8)
        const trailX = this.position.x - this.facing * 8; // 8px behind player (12px toward front)
        const trailY = this.getVisualAnchor().targetFootY;
        window.particleSystem.trail(trailX, trailY, null, 2);
      }
    }
  }

  moveRight() {
    if (this.state === 'rhythm' || this.isEntering || !this.allowMovement) {
      return;
    }
    
    this.facing = 1; // Face right
    this.velocity.x = this.speed;
    {
      
      // White smoke/dust trail particles behind player
      if (window.particleSystem && this.grounded) {
        // Position particles behind player based on facing direction
        const trailX = this.position.x - this.facing * 20; // 20px behind player
        const trailY = this.getVisualAnchor().targetFootY;
        window.particleSystem.trail(trailX, trailY, null, 2);
      }
    }
  }

  stopHorizontal() {
    if (this.state === 'rhythm' || this.isEntering || !this.allowMovement) {
      return;
    }
    
    this.velocity.x = 0;
    // Keep facing direction - don't change when stopping
  }

  jump() {
    if (this.state === 'rhythm' || this.isEntering || !this.allowMovement) {
      return false;
    }
    
    if (this.grounded) {
      this.velocity.y = -this.jumpPower;
      this.grounded = false;
      this.jumpTime = 0; // Reset jump timer
      
      // CRITICAL FIX: Always reset jump animation tracking for new jump
      // This ensures the animation restarts every time jump() is called
      this.jumpAnimationStarted = false;
      
      // CRITICAL FIX: Force animation restart immediately when jumping
      if (this.spriteReady && this.sprite) {
        console.log('🦘 Force restarting jump animation on jump()');
        this.sprite.stop();
        this.currentAnimation = null; // Force restart
        this.animationRef = null;
      }
      
      // Jump particles moved way down and toward front
      if (window.particleSystem) {
        // Move particles 12px toward front of player (same as movement trail)
        const jumpX = this.position.x + this.facing * 12;
        window.particleSystem.jumpEffect(jumpX, this.getVisualAnchor().targetFootY, null);
      }
      return true;
    }
    return false;
  }

  dash() {
    // Dash ability removed - no longer available, but the action route is intentionally recognized.
    return false;
  }

  // Perform rhythm attack
  rhythmAttack() {
    console.log('🎵 rhythmAttack() called - forcing rhythm animation');
    this.playAnimation('rhythm');
  }
  
  // CRITICAL FIX: Force animation reset to prevent stuck walk animations
  forceAnimationReset() {
    console.log('🔄 Forcing animation state reset');
    
    // Clear current animation to force fresh start
    this.currentAnimation = null;
    if (this.sprite) {
      this.sprite.stop();
    }
    this.animationRef = null;
    
    // Reset jump animation tracking
    this.jumpAnimationStarted = false;
    
    // Force immediate state update to determine correct animation
    this.updateState();
    
    // Play the correct animation for the current state
    if (this.state && this.spriteReady) {
      this.playAnimation(this.state);
    }
  }
  
  // DEBUG: Force rhythm animation for testing
  forceRhythmAnimation() {
    console.log('🔧 DEBUG: forceRhythmAnimation() called');
    this.state = 'rhythm';
    this.playAnimation('rhythm');
  }

  takeDamage(amount) {
    // Check if player is currently invulnerable from recent damage
    const currentTime = Date.now();
    if (this.invulnerableUntil && currentTime < this.invulnerableUntil) {
      return; // No damage while invulnerable
    }
    
    this.health = Math.max(0, this.health - amount);
    
    // CRITICAL: Play player damage sound
    if (window.audioSystem && typeof window.audioSystem.playPlayerDamageSound === 'function') {
      window.audioSystem.playPlayerDamageSound();
      console.log('💥 Playing player damage sound');
    }
    
    // CRITICAL: Create damage particles
    if (window.particleSystem && typeof window.particleSystem.damageEffect === 'function') {
      window.particleSystem.damageEffect(this.position.x, this.position.y - 50, null, 15);
      console.log('💥 Creating player damage particles');
    }
    
    // CRITICAL: Deactivate rhythm mode when hit
    if (window.rhythmSystem && window.rhythmSystem.isActive()) {
      console.log('💥 Player hit - deactivating rhythm mode');
      window.rhythmSystem.hide();
      window.rhythmSystem.stop();
    }
    
    // CRITICAL: Deactivate hack mode when hit
    if (window.hackingSystem && window.hackingSystem.isActive()) {
      console.log('💥 Player hit - deactivating hack mode');
      window.hackingSystem.cancel();
    }
    
    // CRITICAL FIX: Force animation state reset after taking damage
    // This prevents walk animations from getting stuck when hit while holding arrow keys
    this.forceAnimationReset();
    
    // Play hurt animation if available
    // this.playAnimation('hurt'); // Not in current sprite set
    
    // Set invulnerability for 2 seconds after taking damage
    this.invulnerableUntil = currentTime + 2000;
    
    // Also set the old invulnerable flag for visual effects
    this.invulnerable = true;
    setTimeout(() => {
      if (this) {
        this.invulnerable = false;
      }
    }, 2000); // 2 seconds of invulnerability for visual effects
  }
  
  takeDamageWithKnockback(amount, knockbackX, knockbackY, enemyPosition = null) {
    // Check if player is currently invulnerable from recent damage
    const currentTime = Date.now();
    if (this.invulnerableUntil && currentTime < this.invulnerableUntil) {
      return; // No damage while invulnerable
    }
    
    this.health = Math.max(0, this.health - amount);
    
    // Apply directional knockback
    this.velocity.x = knockbackX;
    this.velocity.y = knockbackY;
    
    // CRITICAL FIX: Face the enemy that damaged you, not the knockback direction
    if (enemyPosition) {
      // Face toward the enemy that hit you
      const dx = enemyPosition.x - this.position.x;
      this.facing = dx > 0 ? 1 : -1;
      console.log(`👊 Player hit by enemy at (${enemyPosition.x.toFixed(0)}, ${enemyPosition.y.toFixed(0)}) - facing enemy (${this.facing === 1 ? 'right' : 'left'})`);
    } else {
      // Fallback: use knockback direction if no enemy position
      if (knockbackX > 0) {
        this.facing = 1; // Knocked right, face right
      } else if (knockbackX < 0) {
        this.facing = -1; // Knocked left, face left
      }
    }
    
    // CRITICAL: Play player damage sound
    if (window.audioSystem && typeof window.audioSystem.playPlayerDamageSound === 'function') {
      window.audioSystem.playPlayerDamageSound();
      console.log('💥 Playing player damage sound with knockback');
    }
    
    // CRITICAL: Create enhanced damage particles for knockback
    if (window.particleSystem && typeof window.particleSystem.damageEffect === 'function') {
      // Create damage particles at impact point
      window.particleSystem.damageEffect(this.position.x, this.position.y - 50, null, 15);
      
      // Create directional knockback particles
      const particleCount = 8;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const speed = 100 + Math.random() * 100;
        const particleX = this.position.x + Math.cos(angle) * 20;
        const particleY = this.position.y - 50 + Math.sin(angle) * 20;
        
        if (window.particleSystem.particles) {
          window.particleSystem.particles.push(new window.Particle(
            particleX,
            particleY,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 50, // Upward bias
            '#ff6600', // Orange color for knockback
            3 + Math.random() * 3,
            500 + Math.random() * 300,
            'circle'
          ));
        }
      }
      console.log('💥 Creating enhanced knockback particles');
    }
    
    // CRITICAL: Deactivate rhythm mode when hit
    if (window.rhythmSystem && window.rhythmSystem.isActive()) {
      console.log('💥 Player hit - deactivating rhythm mode');
      window.rhythmSystem.hide();
      window.rhythmSystem.stop();
    }
    
    // CRITICAL: Deactivate hack mode when hit
    if (window.hackingSystem && window.hackingSystem.isActive()) {
      console.log('💥 Player hit - deactivating hack mode');
      window.hackingSystem.cancel();
    }
    
    // CRITICAL FIX: Force animation state reset after taking damage with knockback
    // This prevents walk animations from getting stuck when hit while holding arrow keys
    this.forceAnimationReset();
    
    // Disable controls briefly during knockback
    this.controlsDisabled = true;
    this.controlsDisabledUntil = currentTime + 400;
    
    setTimeout(() => {
      if (this) {
        this.controlsDisabled = false;
      }
    }, 400);
    
    // Set invulnerability for 2 seconds after taking damage
    this.invulnerableUntil = currentTime + 2000;
    
    // Also set the old invulnerable flag for visual effects
    this.invulnerable = true;
    setTimeout(() => {
      if (this) {
        this.invulnerable = false;
      }
    }, 2000); // 2 seconds of invulnerability for visual effects
    
    console.log(`💥 Player took ${amount} damage with knockback: (${knockbackX.toFixed(0)}, ${knockbackY.toFixed(0)})`);
  }

  // Create wind effect particles for fast-fall
  createWindEffect() {
    // Calculate sprite bottom position (feet)
    const spriteBottom = this.position.y;
    
    // Create wind particles in tornado spiral pattern
    const particleCount = 3;
    
    for (let i = 0; i < particleCount; i++) {
      // Tornado spiral angles - flowing upward in a spiral
      const spiralAngle = (Date.now() / 200 + i * Math.PI * 2 / 3) % (Math.PI * 2); // Rotating spiral
      const tornadoRadius = 20 + Math.random() * 15; // Radius from center
      
      // Start from feet position in circular pattern
      const startX = this.position.x + Math.cos(spiralAngle) * tornadoRadius;
      const startY = spriteBottom;
      
      // Upward spiral velocity
      const upwardSpeed = -200 - Math.random() * 100; // Strong upward force
      const spiralSpeed = 150 + Math.random() * 50; // Spiral rotation speed
      
      this.windEffects.push({
        x: startX,
        y: startY,
        vx: Math.cos(spiralAngle + Math.PI/2) * spiralSpeed, // Tangential velocity for spiral
        vy: upwardSpeed, // Strong upward velocity
        life: 1.0,
        decay: 0.012, // Slower decay for longer-lasting effect
        size: 6 + Math.random() * 3,
        color: 'rgba(150, 200, 255, 0.6)', // Light blue wind color
        spiralAngle: spiralAngle, // Track spiral position
        tornadoRadius: tornadoRadius // Track radius for spiral motion
      });
    }
  }
  
  // Update wind effects
  updateWindEffects(deltaTime) {
    const dt = deltaTime / 1000;
    const currentTime = Date.now();
    
    this.windEffects = this.windEffects.filter(particle => {
      // Update spiral angle for tornado effect
      particle.spiralAngle = (particle.spiralAngle + dt * 4) % (Math.PI * 2); // Faster rotation
      
      // Calculate distance traveled upward from spawn point
      const upwardDistance = this.position.y - particle.y;
      
      // Tornado shape: start narrow at feet, expand dramatically as it rises
      // Use exponential expansion for classic tornado shape
      const expansionFactor = 1 + (upwardDistance / 50); // Expand more as it gets higher
      const currentRadius = particle.tornadoRadius * expansionFactor;
      
      // Calculate spiral position with expanding radius
      const centerX = this.position.x;
      particle.x = centerX + Math.cos(particle.spiralAngle) * currentRadius;
      particle.y = particle.y + particle.vy * dt; // Upward movement
      
      // Add chaotic wobble for more realistic tornado effect
      const wobbleAmount = expansionFactor * 5; // More wobble as it expands
      const wobbleX = Math.sin(currentTime / 50 + particle.spiralAngle * 3) * wobbleAmount;
      const wobbleY = Math.cos(currentTime / 70 + particle.spiralAngle * 2) * wobbleAmount * 0.3;
      particle.x += wobbleX;
      particle.y += wobbleY;
      
      // Accelerate expansion as particle rises (dissipation effect)
      particle.vx += Math.cos(particle.spiralAngle) * 100 * dt; // Outward acceleration
      
      particle.life -= particle.decay;
      
      // Rapid fade out as tornado expands and dissipates
      particle.opacity = particle.life * 0.6 * Math.max(0.2, 1 - expansionFactor * 0.15);
      
      // Particles grow smaller as they dissipate
      particle.currentSize = particle.size * Math.max(0.3, 1 - expansionFactor * 0.1);
      
      return particle.life > 0 && particle.y > -200; // Remove when far off-screen
    });
  }
  
  // Update electrical arcs during rhythm mode
  updateElectricalArcs(deltaTime) {
    const dt = deltaTime / 1000;
    const currentTime = Date.now();
    
    // Check if rhythm mode is active
    const rhythmActive = window.rhythmSystem && window.rhythmSystem.isActive();
    
    if (rhythmActive) {
      // Activate electrical arcs during rhythm mode
      if (!this.arcActive) {
        this.arcActive = true;
        console.log('⚡ Electrical arcs activated for rhythm mode');
      }
      
      // Update pulse phase
      this.arcPulsePhase += dt * 3; // Pulse speed
      
      // Generate new arcs based on beat timing
      if (window.rhythmSystem && window.rhythmSystem.lastBeatTime > 0) {
        const timeSinceBeat = currentTime - window.rhythmSystem.lastBeatTime;
        const beatInterval = window.rhythmSystem.beatInterval;
        
        // Create arcs on beat and during attack windows - more erratic timing
        if (timeSinceBeat < 50 || (window.rhythmSystem.attackWindows && window.rhythmSystem.attackWindows.active)) {
          // Much more erratic arc generation during beats
          const beatInterval = 15 + Math.random() * 25; // 15-40ms random interval
          if (currentTime - this.lastArcTime > beatInterval) {
            // Sometimes create multiple bursts for extra chaos
            const burstCount = Math.random() < 0.3 ? 2 : 1;
            for (let i = 0; i < burstCount; i++) {
              this.createElectricalArc();
            }
            this.lastArcTime = currentTime;
          }
        } else {
          // Much more erratic normal arc generation
          const normalInterval = 50 + Math.random() * 100; // 50-150ms random interval
          if (currentTime - this.lastArcTime > normalInterval) {
            this.createElectricalArc();
            this.lastArcTime = currentTime;
          }
        }
      }
    } else {
      // Deactivate arcs when not in rhythm mode
      if (this.arcActive) {
        this.arcActive = false;
        console.log('⚡ Electrical arcs deactivated');
      }
    }
    
    // Update existing arcs
    this.electricalArcs = this.electricalArcs.filter(arc => {
      // Update arc animation
      arc.life -= dt * 2; // Arcs fade over 0.5 seconds
      arc.phase += dt * 8; // Fast electrical animation
      
      // Calculate arc intensity based on beat timing
      if (rhythmActive && window.rhythmSystem && window.rhythmSystem.lastBeatTime > 0) {
        const timeSinceBeat = currentTime - window.rhythmSystem.lastBeatTime;
        arc.beatIntensity = Math.max(0, 1 - (timeSinceBeat / 200)); // Pulse on beat
      } else {
        arc.beatIntensity = 0;
      }
      
      return arc.life > 0;
    });
  }
  
  // Create electrical arc
  createElectricalArc() {
    // Attack radius matches rhythm mode attack range (300 pixels from enemies.js)
    const attackRadius = 300;
    const numArcs = 8 + Math.floor(Math.random() * 8); // 8-16 arcs per burst (more erratic)
    
    for (let i = 0; i < numArcs; i++) {
      // Much more erratic arc generation
      const angle = Math.random() * Math.PI * 2;
      const arcLength = attackRadius * (0.3 + Math.random() * 1.2); // Much more varied arc length (30% to 150%)
      
      // Add extreme randomness to starting points
      const startOffset = 10 + Math.random() * 40; // Random start distance from body
      const startX = this.position.x + Math.cos(angle) * startOffset + (Math.random() - 0.5) * 30;
      const startY = this.position.y - 50 + Math.sin(angle) * startOffset + (Math.random() - 0.5) * 30;
      
      // Add randomness to end points
      const endWobble = (Math.random() - 0.5) * 60;
      const endX = this.position.x + Math.cos(angle) * arcLength + endWobble;
      const endY = this.position.y - 50 + Math.sin(angle) * arcLength + endWobble;
      
      // Create wildly erratic lightning bolt path
      const segments = [];
      const numSegments = 3 + Math.floor(Math.random() * 8); // 3-10 segments for more chaos
      
      for (let j = 0; j <= numSegments; j++) {
        const t = j / numSegments;
        const baseX = startX + (endX - startX) * t;
        const baseY = startY + (endY - startY) * t;
        
        // Much more chaotic offset calculations
        let offsetX = 0, offsetY = 0;
        if (j > 0 && j < numSegments) {
          const chaosFactor = 20 + Math.random() * 60; // Much larger offsets
          offsetX = (Math.random() - 0.5) * chaosFactor;
          offsetY = (Math.random() - 0.5) * chaosFactor;
          
          // Add directional bias for more natural lightning
          const lightningAngle = Math.atan2(endY - startY, endX - startX);
          offsetX += Math.cos(lightningAngle + Math.PI/2) * offsetY * 0.3;
          offsetY += Math.sin(lightningAngle + Math.PI/2) * offsetX * 0.3;
        }
        
        segments.push({
          x: baseX + offsetX,
          y: baseY + offsetY
        });
      }
      
      this.electricalArcs.push({
        segments: segments,
        life: 0.5 + Math.random() * 1.0, // More varied lifespans
        phase: Math.random() * Math.PI * 2,
        beatIntensity: 1.0,
        thickness: 1 + Math.random() * 4, // Much more varied thickness (1-5)
        color: this.getArcColor(),
        flickerSpeed: 0.5 + Math.random() * 2 // Add flicker variation
      });
    }
  }
  
  // Get electrical arc color (varies with intensity)
  getArcColor() {
    const colors = [
      { r: 100, g: 150, b: 255 }, // Light blue
      { r: 150, g: 200, b: 255 }, // Bright blue
      { r: 200, g: 220, b: 255 }, // Very light blue
      { r: 50, g: 100, b: 255 }   // Deep blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Draw electrical arcs
  drawElectricalArcs(ctx) {
    if (!this.arcActive || this.electricalArcs.length === 0) {
      return;
    }
    
    ctx.save();
    
    this.electricalArcs.forEach(arc => {
      // Much more erratic opacity with flicker
      const flicker = Math.sin(Date.now() * arc.flickerSpeed / 100) * 0.3;
      const opacity = arc.life * 0.8 * (0.7 + flicker);
      const pulseFactor = 0.5 + Math.sin(arc.phase * 3) * 0.5; // Faster, more erratic pulsing
      const beatBoost = 1 + arc.beatIntensity * 0.5; // Brighter on beats
      
      // Draw main arc segments
      ctx.strokeStyle = `rgba(${arc.color.r}, ${arc.color.g}, ${arc.color.b}, ${opacity})`;
      ctx.lineWidth = arc.thickness * pulseFactor * beatBoost;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      arc.segments.forEach((segment, index) => {
        if (index === 0) {
          ctx.moveTo(segment.x, segment.y);
        } else {
          ctx.lineTo(segment.x, segment.y);
        }
      });
      ctx.stroke();
      
      // Draw glow effect
      ctx.strokeStyle = `rgba(${arc.color.r}, ${arc.color.g}, ${arc.color.b}, ${opacity * 0.3})`;
      ctx.lineWidth = arc.thickness * 3 * pulseFactor * beatBoost;
      ctx.stroke();
      
      // Draw bright core
      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
      ctx.lineWidth = arc.thickness * 0.5 * pulseFactor;
      ctx.stroke();
      
      // Draw much more erratic electrical particles
      arc.segments.forEach((segment, index) => {
        if (index > 0 && Math.random() < 0.6) { // More frequent particles
          const particleSize = 0.5 + Math.random() * 4; // More varied size
          const particleOpacity = opacity * pulseFactor * (0.5 + Math.random() * 0.5);
          
          ctx.fillStyle = `rgba(${arc.color.r}, ${arc.color.g}, ${arc.color.b}, ${particleOpacity})`;
          ctx.beginPath();
          ctx.arc(segment.x, segment.y, Math.max(0, particleSize), 0, Math.PI * 2);
          ctx.fill();
          
          // Particle glow
          ctx.fillStyle = `rgba(255, 255, 255, ${particleOpacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(segment.x, segment.y, Math.max(0, particleSize * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      });
    });
    
    ctx.restore();
  }

  // Get appropriate alpha value based on invincibility type
  getInvincibilityAlpha() {
    const currentTime = Date.now();
    
    // Check for damage invulnerability (fast flashing)
    if (this.invulnerableUntil && currentTime < this.invulnerableUntil) {
      return 0.5 + Math.sin(Date.now() * 0.02) * 0.4; // Fast flash
    }
    
    return 1.0; // Fully visible when not invincible
  }

  // Restore health by specified amount (up to max health)
  restoreHealth(amount) {
    const oldHealth = this.health;
    this.health = Math.min(this.maxHealth, this.health + amount);
    
    if (this.health > oldHealth) {
      console.log(`Health restored: ${oldHealth} → ${this.health} (+${this.health - oldHealth})`);
      
      // Create healing particles
      if (window.particleSystem) {
        window.particleSystem.healEffect(this.position.x, this.position.y - this.height/2);
      }
      
      // Play healing sound
      if (window.audioSystem) {
        window.audioSystem.playSound('powerup', 0.5);
      }
    }
    
    return this.health > oldHealth; // Return true if health was actually restored
  }
  
  // Update rhythm pulse effect
  updateRhythmPulse(deltaTime) {
    if (!this.rhythmPulse.active) {
      this.rhythmPulse.radius = 0;
      this.rhythmPulse.particles = [];
      return;
    }
    
    const dt = deltaTime / 1000;
    const currentTime = Date.now();
    
    // Update pulse phase for morphing effect
    this.rhythmPulse.phase += dt * this.rhythmPulse.morphSpeed;
    
    // Update color phase for color morphing
    this.rhythmPulse.colorPhase += dt * 3;
    
    // Morph radius with smooth sine wave variations
    const morphFactor = Math.sin(this.rhythmPulse.phase) * 0.3 + 1; // 0.7 to 1.3 multiplier
    let beatPulse = 0;
    
    // Add beat synchronization if rhythm system is available
    if (window.rhythmSystem && window.rhythmSystem.isRunning()) {
      const timeSinceBeat = currentTime - window.rhythmSystem.lastBeatTime;
      
      if (timeSinceBeat < 100) {
        // Pulse on beat
        beatPulse = Math.cos((timeSinceBeat / 100) * Math.PI) * 0.2;
      }
    }
    
    // Smooth radius transition with morphing and beat pulse
    const targetRadius = this.rhythmPulse.targetRadius * (morphFactor + beatPulse);
    this.rhythmPulse.radius += (targetRadius - this.rhythmPulse.radius) * 0.1;
    
    // Generate pulse particles
    if (Math.random() < 0.3) { // 30% chance per frame
      this.createRhythmPulseParticle();
    }
    
    // Update pulse particles
    this.updateRhythmPulseParticles(deltaTime);
  }
  
  // Create a particle for the rhythm pulse effect
  createRhythmPulseParticle() {
    const angle = Math.random() * Math.PI * 2;
    const startRadius = this.rhythmPulse.radius * 0.8;
    
    const particle = {
      x: this.position.x + Math.cos(angle) * startRadius,
      y: this.position.y + Math.sin(angle) * startRadius,
      angle: angle,
      radius: startRadius,
      targetRadius: this.rhythmPulse.radius * 1.2,
      size: Math.random() * 3 + 2,
      life: 1.0,
      decay: 0.015,
      speed: Math.random() * 50 + 30,
      opacity: 0.8,
      colorPhase: Math.random() * Math.PI * 2
    };
    
    this.rhythmPulse.particles.push(particle);
  }
  
  // Update rhythm pulse particles
  updateRhythmPulseParticles(deltaTime) {
    const dt = deltaTime / 1000;
    
    this.rhythmPulse.particles = this.rhythmPulse.particles.filter(particle => {
      // Move outward in spiral pattern
      particle.angle += dt * 2;
      particle.radius += particle.speed * dt;
      particle.life -= particle.decay;
      particle.opacity = particle.life * 0.6;
      
      // Update position
      particle.x = this.position.x + Math.cos(particle.angle) * particle.radius;
      particle.y = this.position.y + Math.sin(particle.angle) * particle.radius;
      
      return particle.life > 0 && particle.radius < this.rhythmPulse.radius * 1.5;
    });
  }
  
  // Draw the rhythm pulse effect
  drawRhythmPulse(ctx) {
    if (!this.rhythmPulse.active || this.rhythmPulse.radius < 10) {
      return;
    }
    
    ctx.save();
    
    // Calculate morphing colors
    const color1 = {
      r: Math.floor(Math.sin(this.rhythmPulse.colorPhase) * 127 + 128),
      g: Math.floor(Math.sin(this.rhythmPulse.colorPhase + Math.PI * 2/3) * 127 + 128),
      b: Math.floor(Math.sin(this.rhythmPulse.colorPhase + Math.PI * 4/3) * 127 + 128)
    };
    
    const color2 = {
      r: Math.floor(Math.sin(this.rhythmPulse.colorPhase + Math.PI) * 127 + 128),
      g: Math.floor(Math.sin(this.rhythmPulse.colorPhase + Math.PI * 5/3) * 127 + 128),
      b: Math.floor(Math.sin(this.rhythmPulse.colorPhase + Math.PI * 7/3) * 127 + 128)
    };
    
    // Draw morphing pulse rings
    for (let i = 0; i < 3; i++) {
      const ringPhase = this.rhythmPulse.phase + i * Math.PI / 3;
      const morphFactor = Math.sin(ringPhase) * 0.2 + 1;
      const ringRadius = this.rhythmPulse.radius * (1 - i * 0.2) * morphFactor;
      const opacity = (0.3 - i * 0.1) * (0.7 + Math.sin(this.rhythmPulse.phase * 2 + i) * 0.3);
      
      // Create gradient for each ring
      const gradient = ctx.createRadialGradient(
        this.position.x, this.position.y, ringRadius * 0.8,
        this.position.x, this.position.y, ringRadius
      );
      
      gradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${opacity * 0.5})`);
      gradient.addColorStop(0.5, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${opacity})`);
      gradient.addColorStop(1, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0)`);
      
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3 - i;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Draw center glow
    const centerGradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, this.rhythmPulse.radius * 0.3
    );
    
    centerGradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0.4)`);
    centerGradient.addColorStop(0.5, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0.2)`);
    centerGradient.addColorStop(1, `rgba(${color1.r}, ${color1.g}, ${color1.b}, 0)`);
    
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.rhythmPulse.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw pulse particles
    this.rhythmPulse.particles.forEach(particle => {
      const particleColor = {
        r: Math.floor(Math.sin(particle.colorPhase) * 127 + 128),
        g: Math.floor(Math.sin(particle.colorPhase + Math.PI * 2/3) * 127 + 128),
        b: Math.floor(Math.sin(particle.colorPhase + Math.PI * 4/3) * 127 + 128)
      };
      
      ctx.fillStyle = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${particle.opacity})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0, particle.size), 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow to particles
      ctx.shadowColor = `rgba(${particleColor.r}, ${particleColor.g}, ${particleColor.b}, ${particle.opacity})`;
      ctx.shadowBlur = particle.size * 2;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    
    ctx.restore();
  }

  getHitbox() {
    // Keep the established combat hull unchanged. Stage landing uses its own
    // narrow visual-foot probe, so presentation alignment cannot alter stomp
    // or enemy-contact timing.
    let spriteWidth, spriteHeight, yOffset;
    
    // Use exact sprite dimensions from manifest with current scale
    switch(this.state) {
      case 'idle':
        spriteWidth = 86 * 2;    // 86px * 2x scale = 172px
        spriteHeight = 96 * 2;   // 96px * 2x scale = 192px
        yOffset = 4;
        break;
      case 'walk':
        spriteWidth = 66 * 2;    // 66px * 2x scale = 132px  
        spriteHeight = 96 * 2;   // 96px * 2x scale = 192px
        yOffset = -11;
        break;
      case 'jump':
        spriteWidth = 41 * 2;    // 41px * 2x scale = 82px
        spriteHeight = 96 * 2;   // 96px * 2x scale = 192px
        yOffset = 0;
        break;
      case 'rhythm':
        spriteWidth = 51 * 2;    // 51px * 2x scale = 102px
        spriteHeight = 96 * 2;   // 96px * 2x scale = 192px
        yOffset = -30;
        break;
      default:
        // Fallback to idle dimensions
        spriteWidth = 86 * 2;
        spriteHeight = 96 * 2;
        yOffset = 4;
    }
    
    // Apply tight margins - only cut 5% from each side for precision
    const marginReduction = 0.05; // 5% margin
    const hitboxWidth = spriteWidth * (1 - marginReduction * 2);
    const hitboxHeight = spriteHeight * (1 - marginReduction * 2);
    
    const spriteTop = this.position.y - spriteHeight - 1 + yOffset;
    
    return {
      x: this.position.x - hitboxWidth/2,   // Center horizontally with tight margins
      y: spriteTop + 60,
      width: hitboxWidth,                  // Tight width with 5% margins
      height: hitboxHeight
    };
  }
  
  // Debug method to visualize hitbox
  drawHitbox(ctx) {
    const hitbox = this.getHitbox();
    ctx.save();
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
    
    // Draw center point
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(this.position.x - 2, this.position.y - 2, 4, 4);
    ctx.restore();
    
    // DEBUG: Draw hitbox for visualization
    if (window.DEBUG_HITBOXES) {
      this.drawHitbox(ctx);
    }
  }

  draw(ctx) {
    try {
      if (this.spriteReady && this.sprite) {
        // Draw sprite-based character
        this.drawSprite(ctx);
      } else {
        // Draw placeholder while loading
        this.drawLoadingPlaceholder(ctx);
      }
    } catch (error) {
      console.error('Error drawing player:', error?.message || error);
      this.drawLoadingPlaceholder(ctx);
    }
  }

  // Draw sprite-based character
  drawSprite(ctx) {
    ctx.save();

    // Handle directional flipping for animations
    let shouldFlip = false;
    
    if (this.state === 'walk') {
      // Walk animation faces left by default, so flip when walking right
      shouldFlip = this.facing === 1;
    } else if (this.state === 'idle' || this.state === 'jump') {
      // Idle and jump should face the direction of movement
      shouldFlip = this.facing === -1;
    } else if (this.state === 'rhythm') {
      // CRITICAL FIX: Rhythm animation should face same direction as idle animation
      // Use same logic as idle: flip when facing left
      shouldFlip = this.facing === -1;
    }

    const visualAnchor = this.getVisualAnchor(shouldFlip);
    const drawY = visualAnchor.y;
    const drawX = visualAnchor.x;
    
    this.sprite.draw(ctx, drawX, drawY, {
      scale: visualAnchor.scale,
      flipH: shouldFlip, // Animation-specific flipping logic
      flipV: false,
      alpha: this.getInvincibilityAlpha(), // Dynamic alpha based on invincibility type
      debug: false // Set to true to see hitbox/anchor
    });
    
    // Draw wind effects (behind character)
    this.drawWindEffects(ctx);
    
    ctx.restore();
  }
  
  // Draw wind effects
  drawWindEffects(ctx) {
    ctx.save();
    
    // Sort particles by Y position so higher particles draw behind lower ones
    const sortedParticles = [...this.windEffects].sort((a, b) => b.y - a.y);
    
    sortedParticles.forEach(particle => {
      const opacity = particle.opacity || 0.6;
      const currentSize = particle.currentSize || particle.size;
      
      // Draw expanding diagonal streaks for tornado effect
      const streakLength = 8 + (this.position.y - particle.y) * 0.1; // Longer streaks as it rises
      const angle = particle.spiralAngle + Math.PI / 2; // Perpendicular to spiral
      const endX = particle.x + Math.cos(angle) * streakLength;
      const endY = particle.y + Math.sin(angle) * streakLength * 0.3; // Diagonal streak
      
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = particle.color.replace('0.6', opacity * 0.3);
      ctx.lineWidth = Math.max(0.5, currentSize * 0.15);
      ctx.stroke();
      
      // Draw main tornado particle
      ctx.fillStyle = particle.color.replace('0.6', opacity);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0, currentSize * 0.5), 0, Math.PI * 2);
      ctx.fill();
      
      // Draw dissipation trail - multiple fading particles spreading outward
      const trailCount = Math.floor(4 - (1 - opacity) * 2); // Fewer trails as it dissipates
      for (let i = 1; i <= trailCount; i++) {
        const trailDistance = i * 6;
        const trailAngle = particle.spiralAngle + i * 0.8;
        const trailX = particle.x + Math.cos(trailAngle) * trailDistance;
        const trailY = particle.y + Math.sin(trailAngle) * trailDistance * 0.5 + i * 3;
        const trailOpacity = opacity * (1 - i * 0.25);
        const trailSize = currentSize * (1 - i * 0.15);
        
        if (trailOpacity > 0.05) {
          ctx.fillStyle = particle.color.replace('0.6', trailOpacity);
          ctx.beginPath();
          ctx.arc(trailX, trailY, Math.max(0.5, trailSize * 0.4), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    
    ctx.restore();
  }
  
  // Update jump trail smoke
  updateJumpTrail(deltaTime) {
    if (!this.jumpTrailActive) {
      return;
    }
    
    const currentTime = Date.now();
    
    // Create smoke particles at intervals during jump
    if (currentTime - this.lastJumpTrailTime > 80) { // Create smoke every 80ms
      this.createJumpTrailSmoke();
      this.lastJumpTrailTime = currentTime;
    }
    
    // Update existing smoke particles
    const dt = deltaTime / 1000;
    this.jumpTrailParticles = this.jumpTrailParticles.filter(particle => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.life -= dt * 2; // Fade over 0.5 seconds
      particle.size = particle.originalSize * (1 + (1 - particle.life) * 2); // Grow as it fades
      
      return particle.life > 0;
    });
  }
  
  // Create smoke particle for jump trail
  createJumpTrailSmoke() {
    // Position smoke slightly behind and below player
    const offsetX = (Math.random() - 0.5) * 20; // Random spread
    const offsetY = Math.random() * 15; // Slightly below player
    
    this.jumpTrailParticles.push({
      x: this.position.x + offsetX,
      y: this.position.y + offsetY,
      vx: (Math.random() - 0.5) * 30, // Gentle horizontal drift
      vy: Math.random() * 20 + 10, // Gentle downward drift
      size: Math.random() * 3 + 2,
      originalSize: Math.random() * 3 + 2,
      life: 1.0,
      color: '#cccccc' // Gray smoke color
    });
  }
  
  // Draw jump trail smoke
  drawJumpTrail(ctx) {
    if (this.jumpTrailParticles.length === 0) {
      return;
    }
    
    ctx.save();
    
    this.jumpTrailParticles.forEach(particle => {
      const opacity = particle.life * 0.6;
      
      // Draw smoke particle with grow effect
      ctx.fillStyle = `rgba(204, 204, 204, ${opacity})`; // Convert #cccccc to rgba
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0, particle.size), 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle glow
      ctx.shadowColor = 'rgba(204, 204, 204, 0.3)';
      ctx.shadowBlur = particle.size * 0.5;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    
    ctx.restore();
  }
  
  // Draw loading placeholder
  drawLoadingPlaceholder(ctx) {
    ctx.save();
    const visualFootY = this.getVisualAnchor().targetFootY;
    const placeholderWidth = PLAYER_ANIMATION_PRESENTATION.idle.scale * 86;
    const placeholderHeight = PLAYER_ANIMATION_PRESENTATION.idle.scale * 96;
    
    // Flip character based on facing direction
    if (this.facing === -1) {
      ctx.translate(this.position.x, 0);
      ctx.scale(-1, 1);
      ctx.translate(-this.position.x, 0);
    }
    
    // Draw loading placeholder
    const gradient = ctx.createLinearGradient(
      this.position.x - placeholderWidth / 2, visualFootY - placeholderHeight,
      this.position.x + placeholderWidth / 2, visualFootY
    );
    
    gradient.addColorStop(0, '#666666');
    gradient.addColorStop(1, '#999999');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.position.x - placeholderWidth / 2,
      visualFootY - placeholderHeight,
      placeholderWidth,
      placeholderHeight
    );
    
    // Draw loading text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LOADING', this.position.x, visualFootY - placeholderHeight / 2);
    
    ctx.restore();
  }
  
  // Start entrance animation from left side
  startEntranceAnimation() {
    console.log('🚀 Starting entrance animation from left side');
    this.isEntering = true;
    this.entranceStartTime = Date.now();
    this.position.x = this.entranceStartX; // Start from left side
    this.facing = 1; // Face right during entrance
    
    // Create initial yellow particle blast
    this.createEntranceBlast();
  }
  
  // Update entrance animation
  updateEntranceAnimation(deltaTime) {
    if (!this.isEntering) return;
    
    const currentTime = Date.now();
    const elapsed = currentTime - this.entranceStartTime;
    const progress = Math.min(elapsed / this.entranceDuration, 1);
    
    // Smooth ease-out animation
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    
    // Move player from left to center
    this.position.x = this.entranceStartX + (this.entranceTargetX - this.entranceStartX) * easeProgress;
    
    // Create yellow particle trail during entrance
    if (Math.random() < 0.8) { // 80% chance per frame
      this.createEntranceParticle();
    }
    
    // Create periodic particle bursts
    if (elapsed % 200 < deltaTime) { // Every 200ms
      this.createEntranceBurst();
    }
    
    // End entrance animation
    if (progress >= 1) {
      this.isEntering = false;
      console.log('✅ Entrance animation completed');
      
      // Create final explosion effect
      this.createEntranceExplosion();
    }
  }
  
  // Create initial yellow particle blast
  createEntranceBlast() {
    if (!window.particleSystem) return;
    
    console.log('💥 Creating entrance black and green blast');
    
    // Create large black and green explosion at entrance point
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 200 + Math.random() * 200;
      const size = 4 + Math.random() * 6;
      
      window.particleSystem.particles.push(new window.Particle(
        this.position.x,
        this.position.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 100, // Upward bias
        Math.random() < 0.5 ? '#000000' : '#00ff00', // Black and green
        size,
        800 + Math.random() * 400,
        'triangle', // Triangle shape
        Math.random() * Math.PI * 2
      ));
    }
    
    // Add additional black and green sparks
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 300;
      
      window.particleSystem.particles.push(new window.Particle(
        this.position.x,
        this.position.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 50,
        Math.random() < 0.5 ? '#ffffff' : '#00ff00', // White and green
        2 + Math.random() * 3,
        600 + Math.random() * 300,
        'triangle',
        Math.random() * Math.PI * 2
      ));
    }
  }
  
  // Create entrance particle trail
  createEntranceParticle() {
    if (!window.particleSystem) return;
    
    // Create small black and green trailing particles
    window.particleSystem.particles.push(new window.Particle(
      this.position.x - 20, // Behind player
      this.position.y + (Math.random() - 0.5) * 40,
      -50 - Math.random() * 100, // Backward velocity
      (Math.random() - 0.5) * 50,
      Math.random() < 0.5 ? '#ffffff' : '#00ff00', // White and green
      2 + Math.random() * 3,
      300 + Math.random() * 200,
      'circle',
      Math.random() * Math.PI * 2
    ));
  }
  
  // Create periodic entrance burst
  createEntranceBurst() {
    if (!window.particleSystem) return;
    
    // Create small burst effect
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 50 + Math.random() * 100;
      
      window.particleSystem.particles.push(new window.Particle(
        this.position.x,
        this.position.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        Math.random() < 0.5 ? '#ffffff' : '#00ff00', // White and green
        3 + Math.random() * 2,
        200 + Math.random() * 200,
        'triangle',
        Math.random() * Math.PI * 2
      ));
    }
  }

  // Create final entrance explosion
  createEntranceExplosion() {
    if (!window.particleSystem || !Array.isArray(window.particleSystem.particles) || !window.Particle) return;
    console.log('🎆 Creating final entrance explosion');
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40;
      const speed = 150 + Math.random() * 250;
      const size = 3 + Math.random() * 5;
      window.particleSystem.particles.push(new window.Particle(this.position.x, this.position.y, Math.cos(angle) * speed, Math.sin(angle) * speed - 80, Math.random() < 0.5 ? '#ffffff' : '#00ff00', size, 1000 + Math.random() * 500, 'triangle', Math.random() * Math.PI * 2));
    }
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const speed = 200;
      window.particleSystem.particles.push(new window.Particle(this.position.x, this.position.y, Math.cos(angle) * speed, Math.sin(angle) * speed, Math.random() < 0.5 ? '#ffffff' : '#00ff00', 4, 800, 'triangle', angle));
    }
  }

};

// Create player instance - wait for dependencies to be ready
function createPlayer() {
  if (window.Vector2D && window.clamp && window.distance) {
    // Start player from left side for entrance animation
    window.player = new window.Player(200, 850);
    console.log('✓ Player created with MakkoEngine support - starting entrance from left');
  } else {
    console.warn('Player dependencies not ready, retrying...');
    setTimeout(createPlayer, 100);
  }
}

// Initialize player when dependencies are loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPlayer);
} else {
  createPlayer();
}
