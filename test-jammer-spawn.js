// Test jammer spawn logic
console.log('🧪 Testing jammer spawn logic...');

// Wait for all dependencies to load
setTimeout(() => {
    if (window.enemyManager && typeof window.enemyManager.spawnJammerEnemy === 'function') {
        console.log('✅ spawnJammerEnemy method found on EnemyManager');
        
        // Test with player on left side
        const testPlayerLeft = { position: { x: 500, y: 750 } };
        const jammer1 = window.enemyManager.spawnJammerEnemy(testPlayerLeft);
        
        if (jammer1 && jammer1.position.x > 2000) {
            console.log('✅ Correctly spawned jammer on right side when player on left');
        } else {
            console.log('❌ Failed to spawn jammer on correct side');
        }
        
        // Clean up
        if (jammer1) {
            jammer1.active = false;
        }
        window.enemyManager.enemies = window.enemyManager.enemies.filter(e => e.active);
        
        // Test with player on right side
        const testPlayerRight = { position: { x: 3500, y: 750 } };
        const jammer2 = window.enemyManager.spawnJammerEnemy(testPlayerRight);
        
        if (jammer2 && jammer2.position.x < 2000) {
            console.log('✅ Correctly spawned jammer on left side when player on right');
        } else {
            console.log('❌ Failed to spawn jammer on correct side');
        }
        
        // Clean up
        if (jammer2) {
            jammer2.active = false;
        }
        window.enemyManager.enemies = window.enemyManager.enemies.filter(e => e.active);
        
        console.log('🧪 Jammer spawn logic test completed');
        
    } else {
        console.log('❌ spawnJammerEnemy method not found - jammer-spawn-logic.js may not have loaded');
    }
}, 2000);