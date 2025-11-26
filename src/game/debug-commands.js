// Debug commands for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/debug-commands.js',
  exports: ['DEBUG', 'CHECK_JAMMER_STATUS'],
  dependencies: ['sector1Progression', 'BroadcastJammerSystem', 'enemyManager']
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
    
    const status = {
      enemiesDefeated: window.sector1Progression.enemiesDefeated || 0,
      requiredEnemies: window.sector1Progression.requiredEnemyKills || 20,
      jammerRevealed: window.sector1Progression.jammerRevealed || false,
      jammerActive: window.sector1Progression.jammerActive || false,
      jammerExists: !!window.sector1Progression.broadcastJammer,
      jammerHealth: window.sector1Progression.broadcastJammer?.health || 0
    };
    
    console.log('📡 Jammer Status:', status);
    return status;
  },
  
  // Check jammer status
  checkJammer: function() {
    if (!window.sector1Progression) {
      return '❌ Sector 1 progression not available';
    }
    
    const status = {
      revealed: window.sector1Progression.jammerRevealed,
      active: window.sector1Progression.jammerActive,
      broadcastJammerExists: !!window.sector1Progression.broadcastJammer,
      jammerActive: window.sector1Progression.broadcastJammer?.active || false,
      jammerPosition: window.sector1Progression.broadcastJammer?.position || null,
      jammerHealth: window.sector1Progression.broadcastJammer?.health || 0,
      enemiesDefeated: window.sector1Progression.enemiesDefeated || 0,
      requiredEnemies: window.sector1Progression.requiredEnemyKills || 20
    };
    
    console.log('📡 Jammer Status:', status);
    return status;
  },
  
  // Force destroy jammer
  destroyJammer: function() {
    if (!window.sector1Progression || !window.sector1Progression.broadcastJammer) {
      return '❌ No jammer to destroy';
    }
    
    window.sector1Progression.broadcastJammer.destroy();
    return '✅ Jammer destroyed';
  },
  
  // Test rhythm hit on jammer
  testRhythmHit: function() {
    if (!window.BroadcastJammerSystem || !window.BroadcastJammerSystem.jammer) {
      return '❌ No jammer to test rhythm hit on';
    }
    
    if (typeof window.BroadcastJammerSystem.onRhythmHit === 'function') {
      window.BroadcastJammerSystem.onRhythmHit();
      return '✅ Rhythm hit test successful';
    } else {
      return '❌ Jammer does not have onRhythmHit method';
    }
  }
};

// Enhanced jammer status command
window.CHECK_JAMMER_STATUS = function() {
  if (!window.sector1Progression) {
    console.error('❌ Sector 1 progression not available');
    return;
  }
  
  const status = {
    enemiesDefeated: window.sector1Progression.enemiesDefeated || 0,
    requiredEnemies: window.sector1Progression.requiredEnemyKills || 20,
    jammerRevealed: window.sector1Progression.jammerRevealed || false,
    jammerActive: window.sector1Progression.jammerActive || false,
    jammerExists: !!window.sector1Progression.broadcastJammer,
    jammerHealth: window.sector1Progression.broadcastJammer?.health || 0,
    jammerPosition: window.sector1Progression.broadcastJammer?.position || null,
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

// CLEAN jammer debug commands
window.DEBUG.spawnCleanJammer = function() {
  console.log('🔧 DEBUG: Force spawning CLEAN jammer');
  if (window.BroadcastJammerSystem && typeof window.BroadcastJammerSystem.forceSpawn === 'function') {
    window.BroadcastJammerSystem.forceSpawn(2800, 750);
    console.log('✅ CLEAN jammer force-spawned successfully');
    return '✅ CLEAN jammer force-spawned successfully';
  } else {
    console.error('❌ Broadcast jammer system not available');
    return '❌ Failed to spawn clean jammer - broadcast system not available';
  }
};

window.DEBUG.checkCleanJammer = function() {
  if (window.BroadcastJammerSystem && typeof window.BroadcastJammerSystem.getStatus === 'function') {
    const status = window.BroadcastJammerSystem.getStatus();
    console.log('📡 CLEAN jammer status:', status);
    return status;
  } else {
    console.error('❌ Broadcast jammer system not available');
    return null;
  }
};

// Legacy debug commands (redirect to clean system)
window.DEBUG.spawnJammer = window.DEBUG.spawnCleanJammer;
window.DEBUG.checkJammer = window.DEBUG.checkCleanJammer;

// CLEAN JAMMER EMERGENCY SPAWN
window.EMERGENCY_JAMMER_SPAWN = function() {
  console.log('🚨 EMERGENCY JAMMER SPAWN - Using clean broadcast system!');
  if (window.BroadcastJammerSystem && typeof window.BroadcastJammerSystem.forceSpawn === 'function') {
    return window.BroadcastJammerSystem.forceSpawn(2800, 750);
  } else {
    console.error('❌ Broadcast jammer system not available');
    return null;
  }
};

window.ULTIMATE_JAMMER_SPAWN = window.EMERGENCY_JAMMER_SPAWN; // Alias for compatibility

window.DEBUG.destroyJammer = function() {
  if (!window.sector1Progression || !window.sector1Progression.broadcastJammer) {
    return '❌ No jammer to destroy';
  }
  
  window.sector1Progression.broadcastJammer.destroy();
  return '✅ Jammer destroyed';
};

window.DEBUG.testRhythmHit = function() {
  if (!window.BroadcastJammerSystem || !window.BroadcastJammerSystem.jammer) {
    return '❌ No jammer to test rhythm hit on';
  }
  
  if (typeof window.BroadcastJammerSystem.onRhythmHit === 'function') {
    window.BroadcastJammerSystem.onRhythmHit();
    console.log('✅ Rhythm hit test successful');
    return '✅ Rhythm hit test successful';
  } else {
    return '❌ Jammer does not have onRhythmHit method';
  }
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
          for (let i = 0; i < 3; i++) {
            window.enemyManager.spawnEnemy();
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
        console.log('Restart conditions met, calling startGame');
        console.log('🎵 CRITICAL: Game restart - rhythm system will preserve beat timing');
        window.startGame();
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

// Make debug commands available globally
window.DEBUG = window.DEBUG || {};