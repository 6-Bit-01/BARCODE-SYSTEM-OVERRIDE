// Sector 1 Progression System
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/sector1-progression.js',
  exports: ['Sector1Progression', 'sector1Progression', 'initSector1Progression'],
  dependencies: ['Vector2D', 'distance', 'clamp', 'randomRange']
});

window.Sector1Progression = class Sector1Progression {
  constructor() {
    this.broadcastJammerDestroyed = false;
    this.enemiesDefeated = 0;
    this.requiredEnemyKills = 20;
    this.jammerRevealed = false;
    this.boss = null;
    this.player = null;
    this.initialized = false;
  }
  
  init(player) {
    this.player = player;
    this.initialized = true;
  }
  
  update(deltaTime) {
    if (!this.initialized) return;
    if (this.broadcastJammerDestroyed && this.enemiesDefeated >= this.requiredEnemyKills) {
        // Transition logic
    }
    if (this.boss && this.boss.active) {
        this.boss.update(deltaTime, this.player);
    }
  }
  
  onJammerSpawned(x, y) {
    console.log(`📡 SectorProgression notified of jammer spawn at ${x}, ${y}`);
    this.jammerRevealed = true;
  }
  
  revealJammer() {
    console.log('📡 Reveal jammer called - DELEGATING to objectives system');
    if (!this.jammerRevealed) {
      this.jammerRevealed = true;
      
      // DELEGATE to objectives system - let it handle jammer spawning
      if (window.objectivesSystem && typeof window.objectivesSystem.spawnBroadcastJammer === 'function') {
        console.log('📡 Delegating jammer spawn to objectives system');
        window.objectivesSystem.spawnBroadcastJammer();
      } else {
        console.error('❌ Objectives system not available for jammer spawning');
      }
    } else {
      console.log('📡 Jammer already revealed, skipping spawn');
    }
  }

  onEnemyDefeated() {
    this.enemiesDefeated++;
    console.log(`📊 Sector 1 Progress: ${this.enemiesDefeated}/${this.requiredEnemyKills} enemies defeated`);
  }
  
  onJammerDestroyed() {
    this.broadcastJammerDestroyed = true;
    console.log('📡 Broadcast Jammer destroyed - sector progression updated');
  }
  
  draw(ctx) {
    if (this.boss && this.boss.active) this.boss.draw(ctx);
  }
  
  reset(preserve = false) {
    if (!preserve) {
        this.enemiesDefeated = 0;
        this.broadcastJammerDestroyed = false;
    }
    this.boss = null;
  }
};

window.initSector1Progression = function(player) {
  window.sector1Progression = new window.Sector1Progression();
  window.sector1Progression.init(player);
};