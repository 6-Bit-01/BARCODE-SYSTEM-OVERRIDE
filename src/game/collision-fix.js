// Collision fix patch for jammers - player can walk through them
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/collision-fix.js',
  exports: ['applyJammerCollisionFix'],
  dependencies: []
});

// Apply the jammer collision fix
window.applyJammerCollisionFix = function() {
  if (!window.enemyManager || !window.enemyManager.checkCollisions) {
    console.warn('Enemy manager not available for collision fix');
    return;
  }
  
  // Store original method
  const originalCheckCollisions = window.enemyManager.checkCollisions;
  
  // Replace with jammer-friendly version
  window.enemyManager.checkCollisions = function(player) {
      if (player.controlsDisabled || player.isStomping) return;
      
      const playerBox = player.getHitbox();
      
      this.enemies.forEach(enemy => {
          if (!enemy.active) return;
          
          // Skip ALL collision with jammers - player can walk through them
          if (enemy.type === 'jammer') {
              return; // No collision of any kind with jammers
          }
          
          const enemyBox = enemy.getHitbox();
          
          // Push player away from non-jammer enemies
          const dx = player.position.x - enemy.position.x;
          const dy = player.position.y - enemy.position.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 0 && dist < 60) {
              const push = (60 - dist) * 0.5;
              player.position.x += (dx/dist) * push;
              player.position.y += (dy/dist) * push * 0.5;
          }
          
          // Check for Stomp
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
          
          // Check for Damage
          if (this.simpleAABBcollision(playerBox, enemyBox)) {
              if (!player.invulnerableUntil || Date.now() > player.invulnerableUntil) {
                  if (!enemy.lastPlayerHitTime || Date.now() - enemy.lastPlayerHitTime > 1500) {
                      enemy.lastPlayerHitTime = Date.now();
                      player.takeDamageWithKnockback(enemy.damage, (dx/dist)*450, -300, enemy.position);
                  }
              }
          }
      });
  };
  
  console.log('✅ Jammer collision fix applied - player can now walk through jammers');
};

// Auto-apply the fix when dependencies are ready
function applyFixWhenReady() {
  if (window.enemyManager && window.enemyManager.checkCollisions) {
    window.applyJammerCollisionFix();
  } else {
    setTimeout(applyFixWhenReady, 100);
  }
}

// Apply immediately or wait for dependencies
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyFixWhenReady);
} else {
  applyFixWhenReady();
}