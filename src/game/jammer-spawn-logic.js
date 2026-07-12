// Jammer spawn logic for EnemyManager
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/jammer-spawn-logic.js',
  exports: ['addJammerSpawnLogic'],
  dependencies: ['Vector2D', 'distance', 'clamp', 'randomRange']
});

// Add jammer spawn logic to EnemyManager
window.addJammerSpawnLogic = function() {
  if (!window.EnemyManager || !window.enemyManager) {
    console.warn('EnemyManager not available for jammer spawn logic');
    return;
  }

  // Add spawnJammerEnemy method to EnemyManager prototype
  window.EnemyManager.prototype.spawnJammerEnemy = function(player) {
    console.log('📡 spawnJammerEnemy called - creating jammer...');
    
    // Ensure enemies array exists
    if (!this.enemies) {
      this.enemies = [];
      console.log('🔧 Initialized enemy manager enemies array');
    }
    
    // Calculate opposite-side spawn position from player
    const worldWidth = 4096;
    const playerX = player?.position?.x || 960;
    
    // Player in left half, spawn on right side (and vice versa)
    let spawnX;
    if (playerX < worldWidth / 2) {
      // Player in left half, spawn on right side
      spawnX = worldWidth - 200; // 200px from right edge
    } else {
      // Player in right half, spawn on left side
      spawnX = 200; // 200px from left edge
    }
    
    // MOVED UP: Changed from 1050 to 990 (60px higher)
    const spawnY = 990; 
    
    console.log(`📡 Spawning jammer on opposite side: player at ${playerX}, jammer at ${spawnX}`);
    
    let jammer;
    try {
      jammer = new window.JammerEnemy(spawnX, spawnY);
      if (jammer) {
        this.enemies.push(jammer);
        
        // Initialize proximity audio after a short delay
        setTimeout(() => {
          if (jammer.initProximityAudio) {
            jammer.initProximityAudio();
          }
        }, 1500);
        
        // Set jammer as arrow target
        if (window.jammerArrowIndicator) {
          window.jammerArrowIndicator.setTarget(jammer);
        }
        
        console.log('✅ Jammer created with audio and arrow tracking');
      }
    } catch (error) {
      console.error('❌ Failed to create jammer in spawnJammerEnemy:', error);
      return null;
    }
    
    return jammer;
  };

  // NOTE: Removed jammer from random spawn types - jammers should ONLY be spawned by objectives system
  // Modify spawnFlowEnemy to handle jammer type
  const originalSpawnFlowEnemy = window.EnemyManager.prototype.spawnFlowEnemy;
  window.EnemyManager.prototype.spawnFlowEnemy = function(player) {
    if (this.enemies.length >= this.maxEnemies) return;
    
    // Jammers are spawned ONLY by objectives system, never randomly
    const types = ['virus', 'corrupted', 'firewall'];
    let type = types[Math.floor(Math.random() * types.length)];
    
    // Continue with original logic for other types
    const typesWithoutJammer = ['virus', 'corrupted', 'firewall'];
    type = typesWithoutJammer[Math.floor(Math.random() * typesWithoutJammer.length)];
    
    // Enhanced firewall spawning - all firewalls now use enhanced behavior
    if (type === 'firewall') {
      if (this.activeFirewallCount >= 2) { // Only limit count, not cooldown
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
      enemy.velocity.x = 50;
      enemy.velocity.y = 120;
      enemy.isOnGround = false;
    }
    this.enemies.push(enemy);
  };

  console.log('✅ Jammer spawn logic added to EnemyManager');
};

// Auto-initialize when dependencies are ready
function initializeJammerSpawnLogic() {
  if (window.EnemyManager && window.JammerEnemy) {
    window.addJammerSpawnLogic();
  } else {
    setTimeout(initializeJammerSpawnLogic, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeJammerSpawnLogic);
} else {
  initializeJammerSpawnLogic();
}