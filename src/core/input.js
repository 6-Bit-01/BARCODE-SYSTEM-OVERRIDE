// Input handling system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/core/input.js',
  exports: ['InputManager', 'inputManager'],
  dependencies: []
});

// Centralized input manager for keyboard and mouse
window.InputManager = class InputManager {
  constructor() {
    this.keys = {};
    this.pressedKeys = new Set();
    this.releasedKeys = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, pressed: false };
    this.gamepad = null;
    this.vibrationEnabled = true;
    this.hasTrackedMovement = false; // Track if movement objective was completed
    this.hasTrackedJump = false; // Track if jump objective was completed
    
    this.init();
  }

  init() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      
      // GAME OVER KEY RESTRICTION: Only allow Space, Shift+F, and Esc
      if (window.gameState && window.gameState.gameOver) {
        // Only allow specific keys during game over
        const allowedKeys = [' ', 'f', 'escape'];
        if (!allowedKeys.includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          return; // Block the key
        }
      }
      
      this.keys[key] = true;
      this.pressedKeys.add(key);
      
      // Handle hacking terminal input
      if (window.hackingSystem && window.hackingSystem.isActive()) {
        if (typeof window.hackingSystem.processInput === 'function') {
          window.hackingSystem.processInput(e.key);
        }
      }
      
      // Fullscreen toggle - clean new system
      if (e.shiftKey && e.key === 'F') {
        e.preventDefault();
        window.fullscreenManager.toggle();
      }
      
      // Game actions
      if (e.key === ' ') {
        e.preventDefault();
        
        // Check for game over restart first (highest priority)
        if (window.gameState && window.gameState.gameOver) {
          console.log('Restart detected - game over:', window.gameState.gameOver);
          if (window.handleGameAction) {
            console.log('Calling handleGameAction restart');
            window.handleGameAction('restart');
            return;
          } else {
            console.warn('handleGameAction not available');
          }
        }
        
        // Handle tutorial dialogue second
        if (window.tutorialSystem) {
          if (typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive()) {
            console.log('Space pressed - tutorial is active, calling handleSpacePress');
            if (typeof window.tutorialSystem.handleSpacePress === 'function') {
              console.log('Space pressed - calling handleSpacePress');
              window.tutorialSystem.handleSpacePress();
              return; // CRITICAL: Always return after handling tutorial space press
            }
          }
        }
        
        // Normal game actions last
        if (window.handleGameAction) {
          window.handleGameAction('jump');
          // Track jump objective when actually jumping
          if (window.tutorialSystem && window.tutorialSystem.isActive() && !this.hasTrackedJump) {
            this.hasTrackedJump = true;
            if (typeof window.tutorialSystem.checkObjective === 'function') {
              window.tutorialSystem.checkObjective('jump');
            }
          }
        }
      }
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Use Down Arrow for rhythm attacks - ONLY if rhythm system is active
        if (window.rhythmSystem && window.rhythmSystem.isActive()) {
          // CRITICAL: Only trigger on initial key press, not holds
          // Check if this is a repeat key event (hold) - ignore if so
          if (e.repeat) {
            console.log('🎵 Down Arrow held down - ignoring repeat');
            return; // Ignore held key repeats
          }
          
          console.log('🎵 Down Arrow pressed (initial press) - checking rhythm timing');
          const result = window.rhythmSystem.handleInput('attack');
          console.log('🎵 Rhythm result:', result);
          
          // Only apply damage if it was actually a hit (respect timing windows)
          if (result && result.hit) {
            console.log('🎵 SUCCESSFUL rhythm hit - applying damage');
            // Apply rhythm damage to enemies
            if (window.enemyManager) {
              window.enemyManager.checkPlayerAttacks(window.player, result);
            }
          } else {
            console.log('🎵 MISSED rhythm timing - no damage applied');
          }
        } else {
          console.log('🎵 Down Arrow pressed but rhythm system not active');
        }
      }
      
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        
        // Check for mutual exclusivity: prevent rhythm mode during hack mode
        if (window.hackingSystem && window.hackingSystem.isActive && window.hackingSystem.isActive()) {
          console.log('Cannot activate rhythm mode during hack mode');
          return;
        }
        
        // SIMPLE: Direct animation control
        if (window.player) {
          if (window.rhythmSystem && window.rhythmSystem.isActive && window.rhythmSystem.isActive()) {
            // Turn OFF rhythm mode
            console.log('Turning OFF rhythm mode');
            if (typeof window.rhythmSystem.hideRhythmMode === 'function') {
              window.rhythmSystem.hideRhythmMode();
            } else if (typeof window.rhythmSystem.hide === 'function') {
              window.rhythmSystem.hide();
            }
          } else {
            // CRITICAL FIX: Disable rhythm mode during jumps
            if (window.player && !window.player.grounded) {
              console.log('Cannot activate rhythm mode during jump');
              return; // Prevent rhythm mode activation while jumping
            }
            
            // Turn ON rhythm mode
            console.log('Turning ON rhythm mode');
            
            // CRITICAL FIX: Check if rhythm system is ready for activation
            if (window.rhythmSystem && !window.rhythmSystem.trackStarted) {
              console.log('🚫 Rhythm mode not ready - audio system still starting');
              return; // Block activation if audio hasn't started
            }
            
            if (window.rhythmSystem && window.rhythmSystem.currentTempoBeat === 0) {
              console.log('🚫 Rhythm mode not ready - waiting for first beat');
              return; // Block activation until first beat is counted
            }
            
            // CRITICAL FIX: Clear player velocity to prevent gliding when entering rhythm mode
            if (window.player) {
              window.player.velocity.x = 0; // Stop horizontal movement immediately
              console.log('🛑 Cleared player horizontal velocity to prevent gliding');
            }
            
            // CRITICAL: Track rhythm_start objective for tutorial
            if (window.tutorialSystem && window.tutorialSystem.isActive()) {
              // Only track if we're in rhythm chapter and objective not complete
              const isRhythmChapter = window.tutorialSystem.storyChapter === 2;
              const hasRhythmStart = window.tutorialSystem.completedObjectives && 
                                   window.tutorialSystem.completedObjectives.has('rhythm_start');
              
              if (isRhythmChapter && !hasRhythmStart) {
                console.log('R PRESSED - RHYTHM_START OBJECTIVE TRACKING');
                if (typeof window.tutorialSystem.checkObjective === 'function') {
                  window.tutorialSystem.checkObjective('rhythm_start');
                  
                  // Fallback: Force add to completed set if checkObjective fails
                  setTimeout(() => {
                    if (!window.tutorialSystem.completedObjectives.has('rhythm_start')) {
                      console.log('FALLBACK: Forcing rhythm_start objective completion');
                      window.tutorialSystem.completedObjectives.add('rhythm_start');
                      const rhythmObj = window.tutorialSystem.objectives.find(obj => obj.id === 'rhythm_start');
                      if (rhythmObj) {
                        rhythmObj.completed = true;
                      }
                    }
                  }, 100);
                }
              }
            }
            
            if (window.rhythmSystem) {
              if (typeof window.rhythmSystem.showRhythmMode === 'function') {
                window.rhythmSystem.showRhythmMode();
              } else if (typeof window.rhythmSystem.show === 'function') {
                window.rhythmSystem.show();
              }
            }
            // CRITICAL: Force rhythm animation with delay to ensure sprite is ready
            setTimeout(() => {
              console.log('🎵 DELAYED RHYTHM ANIMATION FORCE');
              window.player.state = 'rhythm';
              window.player.playAnimation('rhythm');
            }, 200); // 200ms delay to ensure system is ready
          }
        }
      }
      
      if (e.key === 'Escape' || e.key === 'ESC') {
        e.preventDefault();
        // Hide rhythm mode with Escape key (doesn't stop background rhythm)
        if (window.rhythmSystem && window.rhythmSystem.isActive()) {
          if (typeof window.rhythmSystem.hideRhythmMode === 'function') {
            window.rhythmSystem.hideRhythmMode();
          } else if (typeof window.rhythmSystem.hide === 'function') {
            window.rhythmSystem.hide();
          }
        }
      }
      
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        // Use Up Arrow for tutorial jump tracking (as mentioned in tutorial text)
        if (window.tutorialSystem && window.tutorialSystem.isActive() && !this.hasTrackedJump) {
          this.hasTrackedJump = true;
          if (typeof window.tutorialSystem.checkObjective === 'function') {
            window.tutorialSystem.checkObjective('jump');
          }
          // Also trigger the actual jump
          window.player.jump();
        }
      }
      
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        
        // Check for mutual exclusivity: prevent hack mode during rhythm mode
        if (window.rhythmSystem && window.rhythmSystem.isActive && window.rhythmSystem.isActive()) {
          console.log('Cannot activate hack mode during rhythm mode');
          return;
        }
        
        // CRITICAL FIX: Disable hack mode during jumps
        if (window.player && !window.player.grounded) {
          console.log('Cannot activate hack mode during jump');
          return; // Prevent hack mode activation while jumping
        }
        
        // CRITICAL: Always track tutorial objective for hack activation - IMMEDIATE
        // This must happen regardless of timing, speed, or system state
        if (window.tutorialSystem && window.tutorialSystem.isActive()) {
          // Only track if we're in hacking chapter and objective not complete
          const isHackingChapter = window.tutorialSystem.storyChapter === 3;
          const hasHackStart = window.tutorialSystem.completedObjectives && 
                               window.tutorialSystem.completedObjectives.has('hack_start');
          
          if (isHackingChapter && !hasHackStart) {
            console.log('H PRESSED - IMMEDIATE HACK_START OBJECTIVE TRACKING');
            console.log('Tutorial chapter:', window.tutorialSystem.storyChapter);
            console.log('Has hack_start objective:', hasHackStart);
            console.log('Hacking system active:', window.hackingSystem ? window.hackingSystem.isActive() : 'undefined');
            
            // CRITICAL: Force immediate objective tracking
            if (typeof window.tutorialSystem.checkObjective === 'function') {
              console.log('CALLING checkObjective IMMEDIATELY');
              window.tutorialSystem.checkObjective('hack_start');
              
              // Fallback: Force add to completed set if checkObjective fails
              setTimeout(() => {
                if (!window.tutorialSystem.completedObjectives.has('hack_start')) {
                  console.log('FALLBACK: Forcing hack_start objective completion');
                  window.tutorialSystem.completedObjectives.add('hack_start');
                  const hackObj = window.tutorialSystem.objectives.find(obj => obj.id === 'hack_start');
                  if (hackObj) {
                    hackObj.completed = true;
                  }
                }
              }, 100);
            }
          }
        }
        
        if (window.hackingSystem && window.hackingSystem.isActive()) {
          // H closes the hacking terminal
          if (typeof window.hackingSystem.processInput === 'function') {
            window.hackingSystem.processInput('H');
          }
        } else {
          // CRITICAL: Direct hacking system call for tutorial
          if (window.hackingSystem && typeof window.hackingSystem.start === 'function') {
            console.log('🔐 DIRECT HACKING SYSTEM START CALLED');
            window.hackingSystem.start();
          } else if (window.handleGameAction) {
            console.log('🔐 FALLBACK: handleGameAction hack');
            window.handleGameAction('hack');
          }
        }
      }
      
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (window.handleGameAction) {
          window.handleGameAction('pause');
        }
      }
      
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        // Emergency tutorial bypass for combat objective
        if (window.tutorialSystem && window.tutorialSystem.isActive() && window.tutorialSystem.storyChapter === 1) {
          if (!window.tutorialSystem.completedObjectives.has('combat')) {
            console.log('EMERGENCY: Skipping combat objective via C key');
            window.tutorialSystem.checkObjective('emergency_combat');
          }
        }
      }
      
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        // Skip entire tutorial and start spawning enemies
        if (window.tutorialSystem && window.tutorialSystem.isActive()) {
          console.log('T pressed - skipping entire tutorial');
          if (window.handleGameAction) {
            window.handleGameAction('skip_tutorial');
          }
        }
      }
      
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        // Manual lore system activation for testing
        if (window.activateLoreSystem) {
          const activated = window.activateLoreSystem();
          if (activated) {
            console.log('📖 Lore system manually activated with L key');
          }
        }
        
        // Also spawn a data fragment for testing
        if (window.lostDataSystem && typeof window.lostDataSystem.forceSpawnFragment === 'function') {
          const spawned = window.lostDataSystem.forceSpawnFragment();
          if (spawned) {
            console.log('💎 Data fragment manually spawned with L key');
          }
        }
      }
      
      if (e.key === 'Shift') {
        e.preventDefault();
        if (window.handleGameAction) {
          window.handleGameAction('dash');
        }
      }
      
      // 'B' key functionality removed - bass layer should activate automatically based on game state
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.releasedKeys.add(e.key.toLowerCase());
    });

    // Mouse events
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      this.mouse.pressed = true;
      this.mouse.clicked = true;
    });

    window.addEventListener('mouseup', (e) => {
      this.mouse.pressed = false;
    });

    // Gamepad support
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepad = e.gamepad;
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      this.gamepad = null;
    });
  }

  // Check if key is currently held down
  isKey(key) {
    return this.keys[key.toLowerCase()] || false;
  }

  // Check if key was just pressed this frame
  isKeyPressed(key) {
    return this.pressedKeys.has(key.toLowerCase());
  }

  // Check if key was just released this frame
  isKeyReleased(key) {
    return this.releasedKeys.has(key.toLowerCase());
  }

  // Movement input (8-directional)
  getMovement() {
    let dx = 0;
    let dy = 0;

    // Arrow keys or WASD
    if (this.isKey('arrowleft') || this.isKey('a')) dx -= 1;
    if (this.isKey('arrowright') || this.isKey('d')) dx += 1;
    if (this.isKey('arrowup') || this.isKey('w')) dy -= 1;
    if (this.isKey('arrowdown') || this.isKey('s')) dy += 1;

    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707; // 1/sqrt(2)
      dy *= 0.707;
    }

    return { x: dx, y: dy };
  }

  // Gamepad input
  updateGamepad() {
    if (!this.gamepad) return;

    const gamepads = navigator.getGamepads();
    this.gamepad = gamepads[0];
  }

  isGamepadButton(buttonIndex) {
    return this.gamepad && this.gamepad.buttons[buttonIndex] && 
           this.gamepad.buttons[buttonIndex].pressed;
  }

  getGamepadMovement() {
    if (!this.gamepad) return { x: 0, y: 0 };

    const leftStickX = this.gamepad.axes[0];
    const leftStickY = this.gamepad.axes[1];
    const deadzone = 0.2;

    let dx = 0;
    let dy = 0;

    if (Math.abs(leftStickX) > deadzone) {
      dx = leftStickX;
    }
    if (Math.abs(leftStickY) > deadzone) {
      dy = leftStickY;
    }

    return { x: dx, y: dy };
  }

  // Haptic feedback
  vibrate(intensity = 0.5, duration = 100) {
    if (!this.vibrationEnabled || !this.gamepad || !this.gamepad.vibrationActuator) {
      return;
    }

    try {
      this.gamepad.vibrationActuator.playEffect('dual-rumble', {
        startDelay: 0,
        duration: duration,
        weakMagnitude: intensity,
        strongMagnitude: intensity
      });
    } catch (error) {
      console.warn('Vibration not supported:', error);
    }
  }

  // Fullscreen functionality moved to dedicated fullscreen manager
  // Use window.fullscreenManager.toggle() instead

  // Call this at the beginning of each frame
  update() {
    // Clear one-frame events
    this.pressedKeys.clear();
    this.releasedKeys.clear();
    this.mouse.clicked = false;

    // Update gamepad state
    this.updateGamepad();
    
    // Handle continuous input (allow movement during tutorial)
    if (window.player && window.gameState && window.gameState.running && 
        (!window.hackingSystem || typeof window.hackingSystem.isActive !== 'function' || !window.hackingSystem.isActive()) && 
        (!window.rhythmSystem || typeof window.rhythmSystem.isActive !== 'function' || !window.rhythmSystem.isActive())) {
      const movement = this.getMovement();
      
      // Track movement tutorial objective (only when actually moving)
      if (window.tutorialSystem && window.tutorialSystem.isActive()) {
        // Track movement (left/right)
        if ((movement.x !== 0) && !this.hasTrackedMovement) {
          this.hasTrackedMovement = true;
          if (typeof window.tutorialSystem.checkObjective === 'function') {
            window.tutorialSystem.checkObjective('movement');
          }
        }
        
        // Jump objective tracked when actually jumping (above)
      }
      
      // Check if player controls are disabled (after collision)
      const controlsDisabled = window.player && 
                           window.player.controlsDisabled && 
                           window.player.controlsDisabledUntil && 
                           Date.now() < window.player.controlsDisabledUntil;
      
      // Allow movement only if controls aren't disabled
      if (!controlsDisabled) {
        if (movement.x < 0) {
          window.player.moveLeft();
        } else if (movement.x > 0) {
          window.player.moveRight();
        } else {
          window.player.stopHorizontal();
        }
        
        if (movement.y < 0) {
          window.player.jump();
        }
      }
    }
  }
};

// Create global input manager instance - wait for DOM to be ready
function createInputManager() {
  if (document && document.addEventListener) {
    window.inputManager = new window.InputManager();
  } else {
    console.warn('DOM not ready for input manager, retrying...');
    setTimeout(createInputManager, 100);
  }
}

// Initialize input manager when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createInputManager);
} else {
  createInputManager();
}