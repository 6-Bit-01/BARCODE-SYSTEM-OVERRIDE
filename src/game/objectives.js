// Mission Objectives System for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/objectives.js',
  exports: ['ObjectivesSystem', 'objectivesSystem', 'initObjectives'],
  dependencies: []
});

window.ObjectivesSystem = class ObjectivesSystem {
  constructor() {
    this.objectives = [];
    this.completedObjectives = new Set();
    this.objectiveUI = {
      visible: true,
      x: 30,
      y: 120,
      width: 600,
      height: 230
    };
    
    this.active = true;
    this.jammerSpawnedForObjective = false;
    this.allLoreRetrieved = false;
    this.loreRetrievedTime = 0;
    this.loreOverlayLocked = false;
    this._lastSpawnAttempt = 0;
    
    // Initialize objectives
    this.initializeMissionObjectives();
  }
  
  initializeMissionObjectives() {
    this.objectives = [];
    
    this.objectives.push({
      id: 'defeat_enemies',
      title: 'Defeat 20 enemies',
      description: 'Eliminate 20 hostile entities',
      priority: 'HIGH',
      completed: false,
      visible: true,
      progress: 0,
      required: 20
    });
    
    this.objectives.push({
      id: 'destroy_jammer',
      title: 'Find and destroy Broadcast Jammer',
      description: 'Locate and destroy the jammer',
      priority: 'HIGH',
      completed: false,
      visible: false // Hidden until revealed by 20 kills
    });
    
    console.log('🎯 Mission objectives initialized - Waiting for 20 kills to spawn jammer');
  }
  
  update(deltaTime) {
    this.updateJammerObjective();
    this.updateEnemyObjective();
    this.checkLoreCollectionStatus();
    this.checkCompletedObjectives();
    
    // Watchdog: Ensure jammer exists if we think it should
    this.ensureJammerExistence();
  }
  
  ensureJammerExistence() {
    const enemyObj = this.objectives.find(obj => obj.id === 'defeat_enemies');
    const jammerObj = this.objectives.find(obj => obj.id === 'destroy_jammer');
    
    // If enemy objective is done (20 kills) AND jammer is NOT destroyed
    if (enemyObj && enemyObj.completed && jammerObj && !jammerObj.completed) {
      // Check for active jammer enemy in the enemy manager
      const hasActiveJammer = window.enemyManager && 
                              window.enemyManager.enemies && 
                              window.enemyManager.enemies.some(e => e.type === 'jammer' && e.active);
      
      // If missing, force it back
      if (!hasActiveJammer) {
        if (Date.now() - this._lastSpawnAttempt > 2000) {
          console.log('🚨 WATCHDOG: 20 kills met but Jammer missing! Forcing spawn.');
          this.spawnBroadcastJammer();
          this._lastSpawnAttempt = Date.now();
        }
      }
    }
  }
  
  updateJammerObjective() {
    const jammerObjective = this.objectives.find(obj => obj.id === 'destroy_jammer');
    if (!jammerObjective || jammerObjective.completed) return;
    
    // Check if jammer enemy has been destroyed (no active jammer enemies)
    const jammerEnemyExists = window.enemyManager && 
                             window.enemyManager.enemies && 
                             window.enemyManager.enemies.some(e => e.type === 'jammer' && e.active);
    
    // If jammer was spawned before but no longer exists, consider it destroyed
    if (this.jammerSpawnedForObjective && !jammerEnemyExists) {
      jammerObjective.completed = true;
      this.completedObjectives.add('destroy_jammer');
      console.log('✅ Objective completed: Destroy Broadcast Jammer');
      
      // Update sector1 progression if available
      if (window.sector1Progression) {
        window.sector1Progression.broadcastJammerDestroyed = true;
      }
    }
  }
  
  updateEnemyObjective() {
    const enemyObjective = this.objectives.find(obj => obj.id === 'defeat_enemies');
    if (!enemyObjective) return;
    
    // Check if already completed but jammer needs spawning (e.g. from save load)
    if (enemyObjective.completed && !this.jammerSpawnedForObjective) {
        console.log('🚨 Objective already complete - Spawning Jammer now.');
        this.spawnBroadcastJammer();
        return;
    }
    
    if (enemyObjective.completed) return;
    
    let enemiesDefeated = 0;
    if (window.sector1Progression) {
      enemiesDefeated = window.sector1Progression.enemiesDefeated;
    } else if (window.enemyManager) {
      enemiesDefeated = window.enemyManager.defeatedCount;
    }
    
    enemyObjective.progress = enemiesDefeated;
    enemyObjective.description = `Progress: ${enemiesDefeated}/${enemyObjective.required}`;
    
    // TRIGGER CONDITION: 20 Kills Reached
    if (enemiesDefeated >= enemyObjective.required) {
      enemyObjective.completed = true;
      this.completedObjectives.add('defeat_enemies');
      console.log('✅ Objective completed: Defeat enemies! Spawning Jammer...');
      console.log(`🎯 20 ENEMIES DEFEATED - Triggering automatic jammer spawn (8 health, exactly 8 rhythm hits needed)`);
      
      this.spawnBroadcastJammer();
    }
  }
  
  spawnBroadcastJammer() {
    console.log('🚨 SPAWN REQUEST: Spawning broadcast jammer...');
    
    if (!window.enemyManager) {
      console.error('❌ EnemyManager not available');
      return false;
    }
    
    // Ensure enemy manager array exists
    if (!window.enemyManager.enemies) {
      window.enemyManager.enemies = [];
      console.log('🔧 Initialized enemy manager enemies array');
    }
    
    // 1. GLOBAL DUPLICATE PREVENTION - Check if jammer enemy already exists anywhere
    const existingJammer = window.enemyManager.enemies.find(e => e.type === 'jammer' && e.active);
    if (existingJammer) {
      console.log('⚠️ Jammer enemy already active. Skipping duplicate spawn.');
      this.jammerSpawnedForObjective = true;
      this.revealJammerObjective();
      return true;
    }
    
    // 2. ADDITIONAL SAFETY: Remove any inactive jammer enemies
    window.enemyManager.enemies = window.enemyManager.enemies.filter(e => e.type !== 'jammer' || e.active);
    
    // 3. COOLDOWN CHECK - Prevent rapid duplicate spawns
    if (Date.now() - this._lastSpawnAttempt < 3000) {
      console.log('⚠️ Jammer spawn attempted too recently. Skipping.');
      return false;
    }
    
    // 2. Get player position for opposite-side spawning
    const player = window.player || { position: { x: 960 } };
    
    console.log(`🚨 Spawning jammer opposite player at x=${player.position.x}`);
    
    // 3. Random opposite-side spawning
    const worldWidth = 4096;
    const playerX = player.position.x || 960;
    
    // Determine opposite side
    const targetSide = playerX < worldWidth / 2 ? 'right' : 'left';
    
    // Random position on opposite side
    let spawnX;
    if (targetSide === 'right') {
      // Spawn on right side (3000-3900 range)
      spawnX = 3000 + Math.random() * 900;
    } else {
      // Spawn on left side (200-1100 range)
      spawnX = 200 + Math.random() * 900;
    }
    
    const spawnY = 750;
    
    console.log(`🚨 Direct spawn at: (${spawnX}, ${spawnY})`);
    
    let jammer;
    try {
      jammer = new window.JammerEnemy(spawnX, spawnY);
      if (jammer) {
        window.enemyManager.enemies.push(jammer);
        console.log('✅ Jammer created and added to enemy manager');
      }
    } catch (error) {
      console.error('❌ Failed to create jammer:', error);
      return false;
    }
    
    if (jammer) {
      this.jammerSpawnedForObjective = true;
      this.revealJammerObjective();
      
      // Record successful spawn time for cooldown
      this._lastSpawnAttempt = Date.now();
      
      if (window.sector1Progression && typeof window.sector1Progression.onJammerSpawned === 'function') {
        window.sector1Progression.onJammerSpawned(jammer.position.x, jammer.position.y);
      }
      if (window.loreSystem) {
        window.loreSystem.displayLoreMessage('BROADCAST JAMMER DETECTED! DESTROY IT!');
      }
      if (window.particleSystem) {
        window.particleSystem.explosion(jammer.position.x, jammer.position.y, '#ff9900', 30);
      }
      console.log(`✅ Jammer spawned successfully at (${jammer.position.x}, ${jammer.position.y})`);
      return true;
    } 
    
    console.error('❌ Failed to spawn jammer');
    return false;
  }
  
  revealJammerObjective() {
    const jammerObjective = this.objectives.find(obj => obj.id === 'destroy_jammer');
    if (jammerObjective) {
      jammerObjective.visible = true;
    }
  }
  
  calculateOptimalSpawnPosition() {
    return { spawnX: 2500, spawnY: 750 };
  }
  
  checkLoreCollectionStatus() {
    let allLoreCollected = false;
    if (window.lostDataSystem) {
      const progress = window.lostDataSystem.getProgress();
      allLoreCollected = progress.collected >= progress.total && progress.total > 0;
    }
    if (allLoreCollected && !this.allLoreRetrieved) {
      this.allLoreRetrieved = true;
      this.loreRetrievedTime = Date.now();
      this.loreOverlayLocked = true;
    }
  }
  
  checkCompletedObjectives() {
    this.objectives.forEach(objective => {
      if (objective.completed && !this.completedObjectives.has(objective.id)) {
        this.completedObjectives.add(objective.id);
      }
    });
  }
  
  draw(ctx) {
    if (!this.objectiveUI.visible) return;
    
    ctx.save();
    const x = 1300; const y = 120; const w = 500; const h = 200;
    
    ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MISSION OBJECTIVES', x + 15, y + 25);
    
    let enemiesDefeated = 0;
    if (window.sector1Progression) enemiesDefeated = window.sector1Progression.enemiesDefeated;
    else if (window.enemyManager) enemiesDefeated = window.enemyManager.defeatedCount;
    
    ctx.textAlign = 'right';
    ctx.fillStyle = enemiesDefeated >= 20 ? '#00ff00' : '#ff9900';
    ctx.fillText(`ENEMIES: ${enemiesDefeated}/20`, x + w - 15, y + 25);
    
    let yOffset = 60;
    this.objectives.forEach(obj => {
      if (!obj.visible) return;
      ctx.fillStyle = obj.completed ? '#00ff00' : '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${obj.completed ? '✓' : '›'} ${obj.title}`, x + 15, y + yOffset);
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px monospace';
      ctx.fillText(obj.description, x + 30, y + yOffset + 20);
      yOffset += 50;
    });
    ctx.restore();
  }
  
  reset() {
    console.log('🔄 Objectives Reset');
    this.jammerSpawnedForObjective = false;
    
    // Remove any existing jammer enemies
    if (window.enemyManager && window.enemyManager.enemies) {
      window.enemyManager.enemies = window.enemyManager.enemies.filter(e => e.type !== 'jammer');
    }
    
    // Reset sector1 progression if available
    if (window.sector1Progression) {
      window.sector1Progression.broadcastJammerDestroyed = false;
    }
    
    // PRESERVE completed objectives on game over - don't clear them
    // this.completedObjectives.clear(); // REMOVED - Keep completed objectives
    this.initializeMissionObjectives();
    
    // Restore completed state after re-initializing
    this.completedObjectives.forEach(objId => {
      const obj = this.objectives.find(o => o.id === objId);
      if (obj) {
        obj.completed = true;
        obj.visible = true;
      }
    });
  }
  
  // New method to handle game over specifically
  onGameOver() {
    console.log('💀 Game Over - Preserving completed objectives');
    // Nothing to do - completed objectives are already preserved in completedObjectives Set
    // The draw method will show completed objectives with green checkmarks
  }
};

// Initialize objectives system
window.initObjectives = function() {
  try {
    if (window.objectivesSystem) {
      return true;
    }
    window.objectivesSystem = new window.ObjectivesSystem();
    console.log('✅ Objectives system initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize objectives system:', error?.message || error);
    return false;
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initObjectives);
} else {
  window.initObjectives();
}