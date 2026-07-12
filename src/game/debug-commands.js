// Debug commands for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/debug-commands.js',
  exports: ['DEBUG', 'CHECK_JAMMER_STATUS', 'EMERGENCY_JAMMER_SPAWN', 'ULTIMATE_JAMMER_SPAWN', 'handleGameAction'],
  dependencies: ['sector1Progression', 'enemyManager', 'tutorialSystem', 'gameState', 'hackingSystem', 'rhythmSystem', 'bootLoader']
});

// DEBUG: Global debug commands for troubleshooting
window.DEBUG = {
  // Force spawn jammer immediately
  spawnJammer: function() {
    console.log('🔧 DEBUG: Force spawning jammer via DEBUG.spawnJammer()');
    if (window.sector1Progression && typeof window.sector1Progression.revealJammer === 'function') {
      window.sector1Progression.enemiesDefeated = 20;
      window.sector1Progression.revealJammer();
      return '✅ Jammer force-spawned successfully (set enemy count to 20)';
    } else {
      console.error('❌ Sector 1 progression not available');
      return '❌ Failed to spawn jammer - sector progression not available';
    }
  },
  
  // Simple jammer status check
  checkStatus: function() {
    if (!window.sector1Progression) {
      console.error('❌ Sector 1 progression not available');
      return null;
    }
    
    // Check for jammer enemy instead of broadcastJammer
    let jammerEnemy = null;
    if (window.enemyManager && window.enemyManager.enemies) {
      jammerEnemy = window.enemyManager.enemies.find(e => e.type === 'jammer' && e.active);
    }
    
    const status = {
      enemiesDefeated: window.sector1Progression.enemiesDefeated || 0,
      requiredEnemies: window.sector1Progression.requiredEnemyKills || 20,
      jammerRevealed: window.sector1Progression.jammerRevealed || false,
      jammerActive: !!jammerEnemy,
      jammerExists: !!jammerEnemy,
      jammerHealth: jammerEnemy ? jammerEnemy.health : 0
    };
    
    console.log('📡 Jammer Status:', status);
    return status;
  },
  
  // Check jammer status
  checkJammer: function() {
    if (!window.sector1Progression) {
      return '❌ Sector 1 progression not available';
    }
    
    // Check for jammer enemy instead of broadcastJammer
    let jammerEnemy = null;
    if (window.enemyManager && window.enemyManager.enemies) {
      jammerEnemy = window.enemyManager.enemies.find(e => e.type === 'jammer' && e.active);
    }
    
    const status = {
      revealed: window.sector1Progression.jammerRevealed,
      active: !!jammerEnemy,
      broadcastJammerExists: !!jammerEnemy,
      jammerActive: !!jammerEnemy,
      jammerPosition: jammerEnemy ? jammerEnemy.position : null,
      jammerHealth: jammerEnemy ? jammerEnemy.health : 0,
      enemiesDefeated: window.sector1Progression.enemiesDefeated || 0,
      requiredEnemies: window.sector1Progression.requiredEnemyKills || 20
    };
    
    console.log('📡 Jammer Status:', status);
    return status;
  },
  
  // Force destroy jammer
  destroyJammer: function() {
    if (!window.enemyManager || !window.enemyManager.enemies) {
      return '❌ No enemy manager available';
    }
    
    const jammerEnemy = window.enemyManager.enemies.find(e => e.type === 'jammer' && e.active);
    if (!jammerEnemy) {
      return '❌ No jammer to destroy';
    }
    
    jammerEnemy.takeDamage(1000, 'debug'); // Use debug source
    return '✅ Jammer destroyed';
  },
  
  // Test rhythm hit on jammer
  testRhythmHit: function() {
    if (!window.enemyManager || !window.enemyManager.enemies) {
      return '❌ No enemy manager available';
    }
    
    const jammerEnemy = window.enemyManager.enemies.find(e => e.type === 'jammer' && e.active);
    if (!jammerEnemy) {
      return '❌ No jammer to test rhythm hit on';
    }
    
    // Use the enemy's rhythm damage method
    jammerEnemy.takeDamage(1, 'rhythm');
    return '✅ Rhythm hit test successful';
  },
  
  // Skip boot screen immediately
  skipBootScreen: function() {
    console.log('🔧 DEBUG: Skipping boot screen immediately...');
    
    if (window.bootLoader && typeof window.bootLoader.forceHide === 'function') {
      // Force hide boot screen
      window.bootLoader.forceHide();
      console.log('✅ Boot screen skipped successfully');
      
      // Set assets as loaded to prevent loading issues
      window.bootLoader.setAudioLoaded(true);
      window.bootLoader.setSpritesLoaded(true);
      window.bootLoader.setAssetsLoaded(true);
      
      // Show title screen if not already visible
      const startOverlay = document.getElementById('startOverlay');
      if (startOverlay) {
        startOverlay.style.display = 'flex';
        startOverlay.style.opacity = '1';
        console.log('✅ Title screen shown immediately');
      }
      
      // Remove sound popup if it exists
      const soundPopup = document.getElementById('soundEnablePopup');
      if (soundPopup && soundPopup.parentNode) {
        soundPopup.parentNode.removeChild(soundPopup);
        console.log('✅ Sound popup removed');
      }
      
      return '✅ Boot screen skipped - title screen ready';
    } else {
      console.error('❌ Boot loader not available');
      return '❌ Failed to skip boot screen - boot loader not available';
    }
  }
};

// Enhanced jammer status command
window.CHECK_JAMMER_STATUS = function() {
  if (!window.sector1Progression) {
    console.error('❌ Sector 1 progression not available');
    return;
  }
  
  // Check for jammer enemy instead of broadcastJammer
  let jammerEnemy = null;
  if (window.enemyManager && window.enemyManager.enemies) {
    jammerEnemy = window.enemyManager.enemies.find(e => e.type === 'jammer' && e.active);
  }
  
  const status = {
    enemiesDefeated: window.sector1Progression.enemiesDefeated || 0,
    requiredEnemies: window.sector1Progression.requiredEnemyKills || 20,
    jammerRevealed: window.sector1Progression.jammerRevealed || false,
    jammerActive: !!jammerEnemy,
    jammerExists: !!jammerEnemy,
    jammerHealth: jammerEnemy ? jammerEnemy.health : 0,
    jammerPosition: jammerEnemy ? jammerEnemy.position : null,
    tutorialActive: window.tutorialSystem && typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive(),
    tutorialCompleted: window.tutorialSystem && typeof window.tutorialSystem.isCompleted === 'function' && window.tutorialSystem.isCompleted()
  };
  
  console.log('📡 COMPLETE JAMMER STATUS:');
  console.log('  Enemies defeated:', `${status.enemiesDefeated}/${status.requiredEnemies}`);
  console.log('  Jammer revealed:', status.jammerRevealed);
  console.log('  Jammer active:', status.jammerActive);
  console.log('  Jammer exists:', status.jammerExists);
  console.log('  Jammer health:', status.jammerHealth);
  console.log('  Tutorial active:', status.tutorialActive);
  console.log('  Tutorial completed:', status.tutorialCompleted);
  
  if (status.jammerExists) {
    console.log('  Jammer position:', `(${status.jammerPosition?.x || 0}, ${status.jammerPosition?.y || 0})`);
  }
  
  return status;
};

// Jammer debug commands (using sector1Progression system)
window.DEBUG.spawnJammer = function() {
  console.log('🔧 DEBUG: Force spawning jammer');
  if (window.sector1Progression && typeof window.sector1Progression.revealJammer === 'function') {
    window.sector1Progression.enemiesDefeated = 20;
    window.sector1Progression.revealJammer();
    console.log('✅ Jammer force-spawned successfully');
    return '✅ Jammer force-spawned successfully';
  } else {
    console.error('❌ Sector 1 progression not available');
    return '❌ Failed to spawn jammer - sector progression not available';
  }
};

// CLEAN JAMMER EMERGENCY SPAWN (now declared above with proper fallback)
// EMERGENCY_JAMMER_SPAWN and ULTIMATE_JAMMER_SPAWN are now declared at the bottom of the file

window.DEBUG.destroyJammer = function() {
  if (!window.enemyManager || !window.enemyManager.enemies) {
    return '❌ No enemy manager available';
  }
  
  const jammerEnemy = window.enemyManager.enemies.find(e => e.type === 'jammer' && e.active);
  if (!jammerEnemy) {
    return '❌ No jammer to destroy';
  }
  
  jammerEnemy.takeDamage(1000, 'debug'); // Use debug source
  return '✅ Jammer destroyed';
};

window.DEBUG.testRhythmHit = function() {
  if (!window.enemyManager || !window.enemyManager.enemies) {
    return '❌ No enemy manager available';
  }
  
  const jammerEnemy = window.enemyManager.enemies.find(e => e.type === 'jammer' && e.active);
  if (!jammerEnemy) {
    return '❌ No jammer to test rhythm hit on';
  }
  
  // Use the enemy's rhythm damage method
  jammerEnemy.takeDamage(1, 'rhythm');
  console.log('✅ Rhythm hit test successful');
  return '✅ Rhythm hit test successful';
};

// Handle special game actions
window.handleGameAction = function(action) {
  switch(action) {
    case 'skip_tutorial':
      if (window.tutorialSystem && typeof window.tutorialSystem.completeTutorial === 'function') {
        console.log('Skipping tutorial - enabling enemy spawning');
        window.tutorialSystem.completeTutorial();
        window.tutorialSystem.active = false;
      }
      if (!window.gameState.hasSpawnedInitialEnemies && window.enemyManager) {
        console.log('Force spawning enemies after tutorial skip');
        window.gameState.hasSpawnedInitialEnemies = true;
        setTimeout(() => {
          let firewallSpawned = false;
          for (let i = 0; i < 3; i++) {
            // Check current firewall count before spawning
            const currentFirewallCount = window.enemyManager.enemies.filter(e => e.type === 'firewall' && e.active).length;
            
            // If we already have a firewall, force non-firewall type
            if (currentFirewallCount >= 1 || firewallSpawned) {
              const types = ['virus', 'corrupted'];
              const type = types[Math.floor(Math.random() * types.length)];
              
              let x, y = 200;
              if (type === 'virus') {
                x = -50 + Math.random() * 100;
                y = -50 + Math.random() * 50;
              } else {
                x = Math.random() > 0.5 ? 100 : 3900;
              }
              
              const enemy = new window.Enemy(x, y, type);
              if (type === 'virus') {
                enemy._dropEdge = 'top';
                enemy.entranceComplete = false;
                enemy.state = 'entrance';
                enemy.velocity.x = 50 + Math.random() * 30;
                enemy.velocity.y = 120 + Math.random() * 30;
                enemy.isOnGround = false;
              }
              window.enemyManager.enemies.push(enemy);
            } else {
              window.enemyManager.spawnEnemy();
              if (window.enemyManager.enemies.some(e => e.type === 'firewall' && e.active)) {
                firewallSpawned = true;
              }
            }
          }
        }, 500);
      }
      break;
      
    case 'force_objectives':
      console.log('🎯 DEBUG: Forcing objectives to appear!');
      window.objectivesShownAfterTutorial = true;
      if (window.tutorialSystem) {
        window.tutorialSystem.completed = true;
        window.tutorialSystem.active = false;
      }
      break;
      
    case 'spawn_jammer':
      console.log('🔧 DEBUG: Force spawning jammer immediately!');
      if (window.sector1Progression && typeof window.sector1Progression.revealJammer === 'function') {
        window.sector1Progression.revealJammer();
        console.log('✅ Jammer force-spawned via debug command');
      } else {
        console.error('❌ Sector 1 progression not available');
      }
      break;
      
    case 'hack':
      if ((!window.hackingSystem || typeof window.hackingSystem.isActive !== 'function' || !window.hackingSystem.isActive()) && 
          (!window.rhythmSystem || typeof window.rhythmSystem.isActive !== 'function' || !window.rhythmSystem.isActive())) {
        if (typeof window.hackingSystem.start === 'function') {
          window.hackingSystem.start();
        }
        if (window.tutorialSystem && window.tutorialSystem.isActive()) {
          if (typeof window.tutorialSystem.checkObjective === 'function') {
            window.tutorialSystem.checkObjective('hack_start');
          }
        }
      }
      break;
      
    case 'rhythm':
      if ((!window.hackingSystem || typeof window.hackingSystem.isActive !== 'function' || !window.hackingSystem.isActive()) && 
          (!window.rhythmSystem || typeof window.rhythmSystem.isActive !== 'function' || !window.rhythmSystem.isActive())) {
        if (typeof window.rhythmSystem.show === 'function') {
          window.rhythmSystem.show();
          console.log('🎵 CRITICAL: Rhythm mode activated - preserving continuous beat timing');
        } else if (typeof window.rhythmSystem.showRhythmMode === 'function') {
          window.rhythmSystem.showRhythmMode(146 + window.gameState.level * 5);
        }
        if (window.tutorialSystem && window.tutorialSystem.isActive()) {
          if (typeof window.tutorialSystem.checkObjective === 'function') {
            window.tutorialSystem.checkObjective('rhythm_start');
          }
        }
      }
      break;
      
    case 'dash':
      if ((!window.hackingSystem || typeof window.hackingSystem.isActive !== 'function' || !window.hackingSystem.isActive()) && 
          (!window.rhythmSystem || typeof window.rhythmSystem.isActive !== 'function' || !window.rhythmSystem.isActive())) {
        window.player.dash();
      }
      break;
      
    case 'jump':
      if ((!window.hackingSystem || typeof window.hackingSystem.isActive !== 'function' || !window.hackingSystem.isActive()) && 
          (!window.rhythmSystem || typeof window.rhythmSystem.isActive !== 'function' || !window.rhythmSystem.isActive())) {
        window.player.jump();
      }
      break;
      
    case 'pause':
      if (window.gameState.running && !window.gameState.gameOver) {
        window.gameState.paused = !window.gameState.paused;
      }
      break;
      
    case 'restart':
      console.log('handleGameAction restart - gameOver:', window.gameState.gameOver, 'victory:', window.gameState.victory);
      if (window.gameState.gameOver || window.gameState.victory) {
        console.log('Restart conditions met - respawning player only');
        
        // Only respawn player, don't reset the world
        if (window.gameState.gameOver) {
          // Game over: just respawn player, preserve everything else
          if (window.player) {
            window.player.health = window.player.maxHealth;
            window.player.position = new window.Vector2D(200, 500);
            window.player.velocity = new window.Vector2D(0, 0);
            
            // Start entrance animation
            if (typeof window.player.startEntranceAnimation === 'function') {
              window.player.startEntranceAnimation();
            }
          }
          
          // Reset game over state but keep everything else
          window.gameState.gameOver = false;
          window.gameState.running = true;
          
          console.log('✅ Player respawned - world state preserved');
        } else if (window.gameState.victory) {
          // Victory: full restart
          console.log('🎵 CRITICAL: Victory restart - rhythm system will preserve beat timing');
          window.startGame();
        }
      } else {
        console.log('Restart conditions not met');
      }
      break;
  }
};

console.log('🔧 DEBUG commands available:');
console.log('  DEBUG.spawnJammer() - Force jammer spawn immediately');
console.log('  DEBUG.checkJammer() - Check jammer status and conditions');
console.log('  DEBUG.destroyJammer() - Destroy current jammer');
console.log('  DEBUG.testRhythmHit() - Test rhythm hit on jammer');
console.log('  DEBUG.skipBootScreen() - Skip boot screen immediately');
console.log('  T key - Skip boot screen (when active) or tutorial');

// Make debug commands available globally
window.DEBUG = window.DEBUG || {};

// Additional essential helper functions for modular system
window.DEBUG_HITBOXES = window.DEBUG_HITBOXES || false; // Enable/disable hitbox visualization

// Essential utility function for emergency jammer spawning
window.EMERGENCY_JAMMER_SPAWN = window.EMERGENCY_JAMMER_SPAWN || function() {
  console.log('🚨 EMERGENCY JAMMER SPAWN - Using jammer system!');
  if (window.sector1Progression && typeof window.sector1Progression.revealJammer === 'function') {
    window.sector1Progression.enemiesDefeated = 20;
    window.sector1Progression.revealJammer();
    return '✅ Emergency jammer spawned successfully';
  } else {
    console.error('❌ Sector 1 progression not available');
    return null;
  }
};

// Alias for compatibility
window.ULTIMATE_JAMMER_SPAWN = window.ULTIMATE_JAMMER_SPAWN || window.EMERGENCY_JAMMER_SPAWN;