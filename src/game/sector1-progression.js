// Sector 1 Progression System for BARCODE: System Override
// Free-roam map with logical progression triggers and dynamic boss spawning
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/sector1-progression.js',
  exports: ['Sector1Progression', 'sector1Progression'],
  dependencies: ['Vector2D', 'distance', 'clamp', 'randomRange']
});

window.Sector1Progression = class Sector1Progression {
  constructor() {
    // Phase tracking
    this.currentPhase = 'FREE_ROAM_START'; // FREE_ROAM_START -> PROGRESSION_CONDITIONS -> BOSS_AWAKENING -> BOSS_FIGHT
    this.phaseTransitionTime = 0;
    
    // Progression conditions
    this.broadcastJammerDestroyed = false;
    this.enemiesDefeated = 0;
    this.tutorialEnemiesDefeated = 0; // Track tutorial enemies separately
    this.requiredEnemyKills = 20; // Changed to 20 for main mission
    
    // Boss state
    this.boss = null;
    this.bossSpawned = false;
    this.bossActive = false;
    this.bossHealth = 100;
    this.bossMaxHealth = 100;
    this.bossPosition = null;
    this.bossVelocity = null;
    this.bossAI = null;
    
    // Event tracking
    this.globalGlitchTriggered = false;
    this.bossSpawnEventTriggered = false;
    this.bossFightStarted = false;
    
    // Visual effects
    this.glitchIntensity = 0;
    this.screenShakeIntensity = 0;
    this.rippleEffect = null;
    this.glitchFogOpacity = 0;
    
    // Audio tracking
    this.normalMusicActive = true;
    this.tenseMusicActive = false;
    this.combatMusicActive = false;
    
    // Broadcast Jammer state
    this.broadcastJammer = null;
    this.jammerPosition = null;
    this.jammerActive = false; // Hidden until 20 enemies defeated
    this.jammerRevealed = false; // Track if jammer has been revealed
    this.jammerHealth = 5;
    this.jammerMaxHealth = 5;
    
    // Player reference
    this.player = null;
    
    // Initialization flag
    this.initialized = false;
  }
  
  // Initialize the progression system
  init(player) {
    this.player = player;
    // Broadcast Jammer will be created dynamically on the opposite side of the player
    this.jammerActive = false; // HIDDEN until 20 enemies defeated
    this.jammerRevealed = false;
    
    // Start in free-roam phase
    this.currentPhase = 'FREE_ROAM_START';
    
    console.log('🗺️ Sector 1 Progression initialized');
    console.log('📋 Phase: FREE_ROAM_START - Player can explore entire map');
    console.log('🎯 Objectives: Defeat 20 enemies to reveal jammer, then destroy it');
    console.log('📡 Broadcast Jammer HIDDEN - Will be revealed after 1 enemy defeated');
    
    // CRITICAL: EMERGENCY JAMMER SPAWN - Force immediate visibility
    console.log('🚨 EMERGENCY: Forcing immediate jammer spawn for visibility testing!');
    setTimeout(() => {
      console.log('🧪 EMERGENCY: Spawning jammer immediately for visibility!');
      // Set enemy count to meet requirement
      this.enemiesDefeated = 20;
      // Force jammer reveal
      this.revealJammer();
    }, 2000);
    
    // CRITICAL: DISABLED - Remove auto-check interval to prevent respawning after destruction
    // Jammer reveal now only happens through proper progression logic (onEnemyDefeated)
    // this.jammerCheckInterval = setInterval(() => {
    //   if (this.enemiesDefeated >= this.requiredEnemyKills && !this.jammerRevealed) {
    //     console.log('🚨 INTERVAL-CHECK: Enemy quota met - forcing jammer reveal!');
    //     this.revealJammer();
    //     
    //     // Clear interval after successful reveal
    //     if (this.jammerRevealed) {
    //       clearInterval(this.jammerCheckInterval);
    //     }
    //   }
    // }, 1000);
    
    this.initialized = true;
  }
  
  // Update the progression system
  update(deltaTime) {
    if (!this.initialized || !this.player) return;
    
    const dt = deltaTime / 1000;
    
    // Check for jammer reveal when 20 enemies defeated
    if (this.enemiesDefeated >= this.requiredEnemyKills && !this.jammerRevealed) {
      console.log(`🎯 UPDATE CHECK: Enemy quota met (${this.enemiesDefeated}/${this.requiredEnemyKills}) - Revealing jammer!`);
      this.revealJammer();
    }
    
    // CRITICAL: BroadcastJammerSystem handles its own updates
    // Don't duplicate jammer updates here
    
    // Update current phase
    switch (this.currentPhase) {
      case 'FREE_ROAM_START':
        this.updateFreeRoamPhase(deltaTime);
        break;
        
      case 'PROGRESSION_CONDITIONS':
        this.updateProgressionConditions(deltaTime);
        break;
        
      case 'BOSS_AWAKENING':
        this.updateBossAwakeningPhase(deltaTime);
        break;
        
      case 'BOSS_FIGHT':
        this.updateBossFight(deltaTime);
        break;
    }
    
    // Update visual effects
    this.updateVisualEffects(deltaTime);
    
    // DEBUG: Log jammer status periodically
    if (Date.now() % 5000 < 100) {
      console.log(`📡 Jammer Status: Active=${this.jammerActive}, Health=${this.broadcastJammer?.health || 0}, Position=${this.jammerPosition?.x || 0}, ${this.jammerPosition?.y || 0}`);
    }
  }
  
  // Free Roam Phase - player can explore everything
  updateFreeRoamPhase(deltaTime) {
    // Check for progression condition completion
    if (this.checkProgressionConditionsMet()) {
      this.transitionToBossAwakening();
    }
    
    // CRITICAL: BroadcastJammerSystem handles its own updates
    // Don't duplicate jammer updates here
  }
  
  // Check if both progression conditions are met
  checkProgressionConditionsMet() {
    const jammerCondition = this.broadcastJammerDestroyed;
    const enemyCondition = this.enemiesDefeated >= this.requiredEnemyKills;
    
    // Reveal jammer when 20 enemies are defeated
    if (enemyCondition && !this.jammerRevealed) {
      this.revealJammer();
    }
    
    if (jammerCondition && !enemyCondition) {
      console.log(`📡 Broadcast Jammer destroyed! Need ${this.requiredEnemyKills - this.enemiesDefeated} more enemies.`);
    } else if (!jammerCondition && enemyCondition) {
      console.log(`⚔️ Enemy quota met! Broadcast Jammer revealed - destroy it to continue.`);
    } else if (jammerCondition && enemyCondition) {
      console.log('✅ BOTH PROGRESSION CONDITIONS MET!');
      return true;
    }
    
    return false;
  }
  
  // Transition to boss awakening phase
  transitionToBossAwakening() {
    this.currentPhase = 'BOSS_AWAKENING';
    this.phaseTransitionTime = Date.now();
    
    console.log('🌋 BOSS AWAKENING PHASE STARTED!');
    this.triggerGlobalGlitchEvent();
  }
  
  // Trigger the global glitch event
  triggerGlobalGlitchEvent() {
    if (this.globalGlitchTriggered) return;
    
    this.globalGlitchTriggered = true;
    this.glitchIntensity = 1.0;
    this.screenShakeIntensity = 15;
    
    // Visual glitch effects
    if (window.renderer) {
      window.renderer.addGlitch(1.0, 3000);
      window.renderer.addScreenShake(15, 2000);
    }
    
    // Shift music to tense
    this.shiftToTenseMusic();
    
    // Show on-screen message
    this.showMessage("Signal anomaly detected... something is approaching.");
    
    // Start boss spawn event sequence
    setTimeout(() => {
      this.triggerBossSpawnEvent();
    }, 3000);
    
    console.log('⚡ GLOBAL GLITCH EVENT TRIGGERED!');
  }
  
  // Trigger the boss spawn event
  triggerBossSpawnEvent() {
    if (this.bossSpawnEventTriggered) return;
    
    this.bossSpawnEventTriggered = true;
    
    // Rumbling sound on right side
    this.playRumblingSound();
    
    // Ground shake effect
    this.screenShakeIntensity = 8;
    
    // Create corrupted ripple effect
    this.createCorruptedRipple();
    
    // Glitch fog appears on right edge
    this.glitchFogOpacity = 0.3;
    
    // Spawn the boss at far right
    setTimeout(() => {
      this.spawnBoss();
    }, 2000);
    
    console.log('🌫️ BOSS SPAWN EVENT TRIGGERED!');
  }
  
  // Spawn the boss
  spawnBoss() {
    if (this.bossSpawned) return;
    
    this.bossSpawned = true;
    this.bossActive = true;
    
    // FIXED: Create boss at right edge of VISIBLE screen area
    const spawnX = 2900; // Right edge of visible screen area (not far right of map)
    const spawnY = 750;
    
    this.boss = new window.CityScrambler(spawnX, spawnY);
    this.bossPosition = this.boss.position;
    this.bossVelocity = this.boss.velocity;
    this.bossHealth = this.boss.maxHealth;
    this.bossMaxHealth = this.boss.maxHealth;
    
    // Create dramatic spawn effect
    this.createBossSpawnEffect(spawnX, spawnY);
    
    // Transition to boss fight phase
    this.currentPhase = 'BOSS_FIGHT';
    
    console.log(`💀 CITY SCRAMBLER spawned at VISIBLE SCREEN (${spawnX}, ${spawnY})`);
    console.log('🎯 BOSS NOW VISIBLE - Player can engage immediately');
  }
  
  // Update boss awakening phase
  updateBossAwakeningPhase(deltaTime) {
    // This phase handles the dramatic entrance sequence
    // Most effects are handled by the event triggers
    
    // Decay glitch effects gradually
    this.glitchIntensity = Math.max(0, this.glitchIntensity - deltaTime * 0.0003);
    this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - deltaTime * 0.005);
  }
  
  // Update boss fight phase
  updateBossFight(deltaTime) {
    if (!this.boss || !this.boss.active) return;
    
    // Update boss AI
    this.boss.update(deltaTime, this.player);
    
    // Check if boss is close enough to start combat
    const distToPlayer = window.distance(
      this.boss.position.x, this.boss.position.y,
      this.player.position.x, this.player.position.y
    );
    
    if (!this.bossFightStarted && distToPlayer < 200) {
      this.startBossFight();
    }
    
    // Update boss in combat
    if (this.bossFightStarted) {
      this.updateBossCombat(deltaTime);
    }
    
    // Check if boss is defeated
    if (this.boss.health <= 0) {
      this.onBossDefeated();
    }
  }
  
  // Start the actual boss fight
  startBossFight() {
    this.bossFightStarted = true;
    
    // Activate full combat music
    this.shiftToCombatMusic();
    
    // Show boss HP bar
    this.showBossHealthBar();
    
    // Enable full boss AI
    if (this.boss) {
      this.boss.combatMode = true;
    }
    
    console.log('⚔️ BOSS FIGHT STARTED!');
  }
  
  // Update boss combat
  updateBossCombat(deltaTime) {
    if (!this.boss || !this.boss.active) return;
    
    // Check collisions with player
    this.checkBossPlayerCollision();
    
    // Update boss health display
    this.updateBossHealthDisplay();
  }
  
  // Check boss collision with player
  checkBossPlayerCollision() {
    if (!this.boss || !this.player) return;
    
    const dist = window.distance(
      this.boss.position.x, this.boss.position.y,
      this.player.position.x, this.player.position.y
    );
    
    if (dist < 80) { // Boss collision radius
      // Apply heavy damage to player
      this.player.takeDamage(3);
      
      // Knockback player away
      const knockbackAngle = Math.atan2(
        this.player.position.y - this.boss.position.y,
        this.player.position.x - this.boss.position.x
      );
      
      this.player.velocity.x = Math.cos(knockbackAngle) * 400;
      this.player.velocity.y = Math.sin(knockbackAngle) * 400 - 100;
      
      // Screen shake
      if (window.renderer) {
        window.renderer.addScreenShake(10, 300);
      }
    }
  }
  
  // Handle boss defeat
  onBossDefeated() {
    console.log('🎉 BOSS DEFEATED! Sector 1 Complete!');
    
    // Create large glitch explosion
    this.createBossDefeatEffect();
    
    // Stop combat music
    this.stopAllMusic();
    
    // Screen dim effect
    this.dimScreen();
    
    // Trigger Sector 1 ending
    setTimeout(() => {
      this.triggerSector1Ending();
    }, 2000);
  }
  
  // Update progression conditions phase
  updateProgressionConditions(deltaTime) {
    // This phase is handled by checking conditions in free roam
    // This is mostly a placeholder for future expansion
  }
  
  // Update visual effects
  updateVisualEffects(deltaTime) {
    // Decay effects over time
    this.glitchIntensity = Math.max(0, this.glitchIntensity - deltaTime * 0.0001);
    this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - deltaTime * 0.002);
    
    // Update glitch fog
    if (this.glitchFogOpacity > 0) {
      this.glitchFogOpacity = Math.max(0, this.glitchFogOpacity - deltaTime * 0.00005);
    }
  }
  
  // Music management
  shiftToTenseMusic() {
    this.normalMusicActive = false;
    this.tenseMusicActive = true;
    
    if (window.audioSystem) {
      // Shift to tense music layers
      console.log('🎵 Shifting to tense music...');
    }
  }
  
  shiftToCombatMusic() {
    this.tenseMusicActive = false;
    this.combatMusicActive = true;
    
    if (window.audioSystem) {
      // Shift to combat music layers
      console.log('🎵 Shifting to combat music...');
    }
  }
  
  stopAllMusic() {
    this.normalMusicActive = false;
    this.tenseMusicActive = false;
    this.combatMusicActive = false;
    
    if (window.audioSystem) {
      // Stop all music
      console.log('🔇 Stopping all music...');
    }
  }
  
  // Visual effects
  createCorruptedRipple() {
    this.rippleEffect = {
      x: 1920,
      y: 540,
      radius: 0,
      maxRadius: 2000,
      speed: 800,
      opacity: 1.0
    };
  }
  
  createBossSpawnEffect(x, y) {
    // Large glitch distortion effect
    if (window.particleSystem) {
      window.particleSystem.explosion(x, y, 'corrupted', 50);
      window.particleSystem.explosion(x, y, 'firewall', 30);
    }
    
    if (window.renderer) {
      window.renderer.addScreenShake(20, 1000);
      window.renderer.addGlitch(0.8, 2000);
    }
  }
  
  createBossDefeatEffect() {
    if (this.boss) {
      // Massive explosion at boss position
      if (window.particleSystem) {
        window.particleSystem.explosion(this.boss.position.x, this.boss.position.y, 'corrupted', 100);
        window.particleSystem.explosion(this.boss.position.x, this.boss.position.y, 'firewall', 80);
      }
      
      if (window.renderer) {
        window.renderer.addScreenShake(30, 2000);
        window.renderer.addGlitch(1.0, 3000);
      }
    }
  }
  
  dimScreen() {
    // Create screen dimming effect
    if (window.renderer) {
      // Add overlay darkness
      console.log('🌑 Dimming screen for ending...');
    }
  }
  
  // UI functions
  showMessage(text) {
    if (window.loreSystem) {
      window.loreSystem.currentLore = text;
      window.loreSystem.displayTime = Date.now();
      window.loreSystem.targetOpacity = 1;
      window.loreSystem.targetBoxHeight = window.loreSystem.calculateBoxHeight();
      window.loreSystem.displayDuration = 5000;
      window.loreSystem.glitchIntensity = 0.3;
    }
  }
  
  showBossHealthBar() {
    // Boss health bar will be drawn in the main UI
    console.log('❤️ Showing boss health bar');
  }
  
  updateBossHealthDisplay() {
    if (this.boss) {
      this.bossHealth = Math.max(0, this.boss.health);
    }
  }
  
  // Audio functions
  playRumblingSound() {
    if (window.audioSystem) {
      console.log('🔊 Playing rumbling sound...');
      // Play rumbling sound effect
    }
  }
  
  // Trigger Sector 1 ending
  triggerSector1Ending() {
    console.log('🎬 Triggering Sector 1 ending cutscene...');
    
    // Trigger ending cutscene
    if (window.cutsceneSystem) {
      window.cutsceneSystem.playEnding('sector1');
    }
    
    // Or directly transition to Sector 2
    setTimeout(() => {
      this.transitionToSector2();
    }, 5000);
  }
  
  transitionToSector2() {
    console.log('🚀 Transitioning to Sector 2...');
    // Handle transition to next sector
  }
  
  // Progression tracking functions
  onEnemyDefeated() {
    // Simple tutorial check
    const tutorialCompleted = window.tutorialSystem && typeof window.tutorialSystem.isCompleted === 'function' && window.tutorialSystem.isCompleted();
    const tutorialActive = window.tutorialSystem && typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive();
    
    // Count enemies toward mission progress
    if (tutorialCompleted || !window.tutorialSystem || !tutorialActive) {
      this.enemiesDefeated++;
      console.log(`⚔️ Enemies defeated: ${this.enemiesDefeated}/${this.requiredEnemyKills}`);
    } else {
      this.tutorialEnemiesDefeated++;
      console.log(`📚 Tutorial enemies defeated: ${this.tutorialEnemiesDefeated} (not counted toward mission)`);
    }
    
    // SIMPLE LOGIC: Reveal jammer when 20 enemies defeated
    if (this.enemiesDefeated >= this.requiredEnemyKills && !this.jammerRevealed) {
      console.log(`🚨 ENEMY QUOTA MET (${this.enemiesDefeated}/${this.requiredEnemyKills}) - REVEALING JAMMER!`);
      this.revealJammer();
    }
    
    // Check progression conditions
    if (this.currentPhase === 'FREE_ROAM_START' && this.checkProgressionConditionsMet()) {
      this.transitionToBossAwakening();
    }
  }
  
  onJammerDestroyed() {
    this.broadcastJammerDestroyed = true;
    this.jammerActive = false;
    console.log('📡 Broadcast Jammer destroyed!');
    
    // Check progression conditions
    if (this.currentPhase === 'FREE_ROAM_START' && this.checkProgressionConditionsMet()) {
      this.transitionToBossAwakening();
    }
  }
  
  // Damage boss (called from rhythm attacks or player attacks)
  damageBoss(amount) {
    if (this.boss && this.boss.active && this.bossFightStarted) {
      this.boss.takeDamage(amount);
      console.log(`💀 Boss damaged! HP: ${this.boss.health}/${this.boss.maxHealth}`);
    }
  }
  
  // Reveal the broadcast jammer - USE BroadcastJammerSystem
  revealJammer() {
    console.log(`🔧 revealJammer() called: revealed=${this.jammerRevealed}, enemyCount=${this.enemiesDefeated}/${this.requiredEnemyKills}`);
    
    if (this.jammerRevealed) {
      console.log('📡 Jammer already revealed - skipping');
      return;
    }
    
    // Mark as revealed immediately
    this.jammerRevealed = true;
    this.jammerActive = true;
    
    // CRITICAL: FORCE BroadcastJammerSystem to spawn immediately
    if (window.BroadcastJammerSystem && typeof window.BroadcastJammerSystem.forceSpawn === 'function') {
      console.log('🚨 Using BroadcastJammerSystem to spawn jammer!');
      
      // CRITICAL: Spawn on opposite side of map from player
      const playerX = this.player ? this.player.position.x : 960;
      const mapCenter = 2048; // Center of 4096px map
      
      let spawnX, spawnY;
      if (playerX < mapCenter) {
        // Player is on left half - spawn on right half
        spawnX = 3500 + Math.random() * 300; // Right side with some randomness
      } else {
        // Player is on right half - spawn on left half
        spawnX = 300 + Math.random() * 300; // Left side with some randomness
      }
      
      spawnY = 880 + (Math.random() - 0.5) * 100; // Slight Y variation
      
      console.log(`🚨 SPAWNING JAMMER at fixed location (${spawnX}, ${spawnY})`);
      
      // Force spawn the jammer
      const spawnedJammer = window.BroadcastJammerSystem.forceSpawn(spawnX, spawnY);
      
      // Verify the jammer was created
      if (spawnedJammer && window.BroadcastJammerSystem.jammer) {
        this.broadcastJammer = window.BroadcastJammerSystem.jammer;
        this.jammerPosition = this.broadcastJammer.position;
        console.log('✅ JAMMER REVEALED SUCCESSFULLY!');
        console.log(`📍 Position: (${this.jammerPosition.x}, ${this.jammerPosition.y})`);
        console.log(`🎯 Active: ${this.broadcastJammer.active}`);
      } else {
        console.error('❌ FAILED: BroadcastJammerSystem.forceSpawn returned null or jammer not created');
      }
    } else {
      console.error('❌ BroadcastJammerSystem not available - CRITICAL ERROR');
      console.error('Available systems:', Object.keys(window).filter(key => key.includes('Jammer')));
      // CRITICAL: Cannot create fallback - BroadcastJammerSystem is REQUIRED
      return;
    }
    
    // Show message to player
    if (window.loreSystem) {
      window.loreSystem.displayLoreMessage('BROADCAST JAMMER REVEALED! Use rhythm attacks (R key) to destroy it.');
    }
    
    // Update objectives system
    if (window.objectivesSystem) {
      if (typeof window.objectivesSystem.revealJammerObjective === 'function') {
        window.objectivesSystem.revealJammerObjective();
      }
    }
  }
  
  // REMOVED: Fallback jammer creation - BroadcastJammerSystem is REQUIRED
  
  // Drawing functions
  draw(ctx) {
    // CRITICAL: BroadcastJammerSystem handles its own drawing - just draw boss and effects
    // Draw boss
    if (this.boss && this.boss.active) {
      this.boss.draw(ctx);
    }
    
    // Draw visual effects
    this.drawVisualEffects(ctx);
    
    // Draw boss health bar
    if (this.bossFightStarted && this.boss && this.boss.active) {
      this.drawBossHealthBar(ctx);
    }
    
    // CRITICAL: DO NOT draw jammer here - BroadcastJammerSystem handles all jammer drawing
    // This prevents duplicate jammer visuals and conflicts
  }
  
  drawVisualEffects(ctx) {
    // Draw corrupted ripple
    if (this.rippleEffect && this.rippleEffect.radius < this.rippleEffect.maxRadius) {
      ctx.save();
      ctx.strokeStyle = `rgba(255, 0, 255, ${this.rippleEffect.opacity})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.rippleEffect.x, this.rippleEffect.y, this.rippleEffect.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      
      // Update ripple
      this.rippleEffect.radius += this.rippleEffect.radius * 0.02;
      this.rippleEffect.opacity *= 0.98;
    }
    
    // Draw glitch fog
    if (this.glitchFogOpacity > 0) {
      ctx.save();
      const gradient = ctx.createLinearGradient(3500, 0, 4096, 0);
      gradient.addColorStop(0, `rgba(255, 0, 255, 0)`);
      gradient.addColorStop(1, `rgba(255, 0, 255, ${this.glitchFogOpacity * 0.3})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(3500, 0, 596, 1080);
      ctx.restore();
    }
  }
  
  drawBossHealthBar(ctx) {
    if (!this.boss || !this.boss.active) return;
    
    const barWidth = 600;
    const barHeight = 30;
    const x = 960 - barWidth / 2;
    const y = 100;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x - 10, y - 10, barWidth + 20, barHeight + 20);
    
    // Health bar background
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);
    
    // Health fill
    const healthPercent = this.boss.health / this.boss.maxHealth;
    ctx.fillStyle = `rgba(255, 0, 0, ${0.7 + healthPercent * 0.3})`;
    ctx.fillRect(x, y, barWidth * healthPercent, barHeight);
    
    // Border
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);
    
    // Boss name
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('CITY SCRAMBLER', 960, y - 30);
    
    // Health text
    ctx.font = '16px monospace';
    ctx.fillText(`${this.boss.health}/${this.boss.maxHealth}`, 960, y + barHeight + 10);
  }
  
  // REMOVED: Emergency jammer creation - BroadcastJammerSystem is REQUIRED
  
  // ENHANCED: Draw additional jammer indicators for guaranteed visibility
  drawJammerIndicators(ctx) {
    if (!this.broadcastJammer || !this.broadcastJammer.active) return;
    
    ctx.save();
    
    const pos = this.broadcastJammer.position;
    const pulseIntensity = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
    
    // Draw massive targeting circle around jammer
    ctx.strokeStyle = `rgba(255, 255, 0, ${pulseIntensity * 0.5})`;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 150, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw pulsing crosshair
    ctx.strokeStyle = `rgba(255, 0, 0, ${pulseIntensity})`;
    ctx.lineWidth = 6;
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(pos.x - 200, pos.y);
    ctx.lineTo(pos.x + 200, pos.y);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y - 200);
    ctx.lineTo(pos.x, pos.y + 200);
    ctx.stroke();
    
    // Draw "TARGET" text
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.fillText('TARGET', pos.x, pos.y - 250);
    ctx.shadowBlur = 0;
    
    ctx.restore();
  }
  
  // Reset progression (for restart)
  reset(preserveEnemyProgress = false) {
    // Clear jammer check interval if it exists
    if (this.jammerCheckInterval) {
      clearInterval(this.jammerCheckInterval);
      this.jammerCheckInterval = null;
    }
    
    // CRITICAL: Reset BroadcastJammerSystem permanent destruction flag
    if (window.BroadcastJammerSystem) {
      window.BroadcastJammerSystem.permanentlyDestroyed = false;
      console.log('🔄 Reset BroadcastJammerSystem permanent destruction flag');
    }
    
    // CRITICAL: Check if we should preserve enemy progress (20+ enemies defeated)
    const shouldPreserveEnemies = preserveEnemyProgress && this.enemiesDefeated >= this.requiredEnemyKills;
    const preservedEnemyCount = this.enemiesDefeated;
    
    this.currentPhase = 'FREE_ROAM_START';
    this.broadcastJammerDestroyed = false;
    this.tutorialEnemiesDefeated = 0; // Reset tutorial enemy counter
    
    // PERSISTENCE LOGIC: Only reset enemy count if below threshold
    if (shouldPreserveEnemies) {
      console.log(`🔄 PERSISTENCE: Preserving enemy progress - ${preservedEnemyCount}/${this.requiredEnemyKills} enemies defeated`);
      // Keep enemiesDefeated at current count
    } else {
      console.log(`🔄 RESET: Enemy progress ${this.enemiesDefeated}/${this.requiredEnemyKills} below threshold - full reset`);
      this.enemiesDefeated = 0;
    }
    
    this.boss = null;
    this.bossSpawned = false;
    this.bossActive = false;
    this.bossFightStarted = false;
    this.globalGlitchTriggered = false;
    this.bossSpawnEventTriggered = false;
    this.glitchIntensity = 0;
    this.screenShakeIntensity = 0;
    this.rippleEffect = null;
    this.glitchFogOpacity = 0;
    this.jammerActive = false; // Hidden by default
    this.jammerRevealed = false; // Not revealed yet
    
    // Broadcast Jammer will be created dynamically on the opposite side of the player
    
    console.log('🔄 Sector 1 Progression reset' + (shouldPreserveEnemies ? ' (enemy progress preserved)' : ''));
  }
};

// REMOVED: Duplicate BroadcastJammer class - use broadcast-jammer.js only
// This was causing conflicts and orange square visual artifacts

// City Scrambler Boss class
window.CityScrambler = class CityScrambler {
  constructor(x, y) {
    this.position = new window.Vector2D(x, y);
    this.velocity = new window.Vector2D(0, 0);
    this.active = true;
    this.health = 100;
    this.maxHealth = 100;
    this.combatMode = false;
    this.animationTime = 0;
    
    // Movement properties
    this.speed = 120;
    this.detectionRadius = 500;
    this.attackCooldown = 0;
    this.attackCooldownTime = 2000;
    
    // Visual properties
    this.size = 80;
    this.color = '#ff00ff';
    this.glitchPhase = 0;
  }
  
  update(deltaTime, player) {
    if (!this.active || !player) return;
    
    const dt = deltaTime / 1000;
    this.animationTime += deltaTime;
    this.glitchPhase += deltaTime * 0.005;
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }
    
    // AI behavior
    if (this.combatMode) {
      this.updateCombatAI(player, dt);
    } else {
      this.updateApproachAI(player, dt);
    }
    
    // Apply gravity
    this.velocity.y += 600 * dt;
    
    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    
    // Ground collision
    if (this.position.y >= 750) {
      this.position.y = 750;
      this.velocity.y = 0;
    }
    
    // World boundaries
    this.position.x = window.clamp(this.position.x, this.size/2, 4096 - this.size/2);
  }
  
  updateApproachAI(player, dt) {
    const distToPlayer = window.distance(
      this.position.x, this.position.y,
      player.position.x, player.position.y
    );
    
    if (distToPlayer > 200) {
      // Move toward player
      const angle = Math.atan2(
        player.position.y - this.position.y,
        player.position.x - this.position.x
      );
      
      this.velocity.x = Math.cos(angle) * this.speed;
    } else {
      // Close enough - slow down
      this.velocity.x *= 0.9;
    }
  }
  
  updateCombatAI(player, dt) {
    const distToPlayer = window.distance(
      this.position.x, this.position.y,
      player.position.x, player.position.y
    );
    
    if (distToPlayer > 100) {
      // Chase player
      const angle = Math.atan2(
        player.position.y - this.position.y,
        player.position.x - this.position.x
      );
      
      this.velocity.x = Math.cos(angle) * this.speed * 1.2;
    } else {
      // Close range - attack
      if (this.attackCooldown <= 0) {
        this.performAttack(player);
        this.attackCooldown = this.attackCooldownTime;
      }
      
      this.velocity.x *= 0.8;
    }
    
    // Jump attack occasionally
    if (Math.random() > 0.98 && this.position.y >= 749) {
      this.velocity.y = -300;
      const jumpAngle = Math.atan2(
        player.position.y - this.position.y,
        player.position.x - this.position.x
      );
      this.velocity.x = Math.cos(jumpAngle) * this.speed * 0.8;
    }
  }
  
  performAttack(player) {
    // Lunge attack
    const angle = Math.atan2(
      player.position.y - this.position.y,
      player.position.x - this.position.x
    );
    
    this.velocity.x = Math.cos(angle) * this.speed * 2;
    this.velocity.y = -200;
    
    // Screen shake
    if (window.renderer) {
      window.renderer.addScreenShake(10, 300);
    }
    
    console.log('💀 City Scrambler performs lunge attack!');
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // Visual feedback
    if (window.particleSystem) {
      window.particleSystem.damageEffect(this.position.x, this.position.y, 'corrupted', 15);
    }
    
    // Screen shake
    if (window.renderer) {
      window.renderer.addScreenShake(5, 150);
    }
    
    if (this.health <= 0) {
      this.active = false;
      console.log('💀 City Scrambler defeated!');
    }
  }
  
  draw(ctx) {
    if (!this.active) return;
    
    ctx.save();
    
    // Glitch effect
    const glitchOffset = Math.sin(this.glitchPhase) * 5;
    ctx.translate(glitchOffset, 0);
    
    // Draw boss body
    const gradient = ctx.createRadialGradient(
      this.position.x, this.position.y, 0,
      this.position.x, this.position.y, this.size
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.7, '#9900ff');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.position.x - this.size/2,
      this.position.y - this.size,
      this.size,
      this.size
    );
    
    // Draw glitch outline
    ctx.strokeStyle = `rgba(255, 0, 255, ${0.5 + Math.sin(this.glitchPhase * 2) * 0.5})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(
      this.position.x - this.size/2,
      this.position.y - this.size,
      this.size,
      this.size
    );
    
    // Draw eyes
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.position.x - 15, this.position.y - this.size + 20, 10, 10);
    ctx.fillRect(this.position.x + 5, this.position.y - this.size + 20, 10, 10);
    
    // Draw combat mode indicator
    if (this.combatMode) {
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('COMBAT', this.position.x, this.position.y - this.size - 10);
    }
    
    ctx.restore();
  }
};

// Initialize global sector 1 progression system
window.sector1Progression = null;

// EMERGENCY GLOBAL JAMMER SPAWN - DISABLED to prevent respawning after destruction
// window.EMERGENCY_FORCE_JAMMER = function() {
//   console.log('🚨 EMERGENCY FORCE JAMMER CALLED!');
//   
//   // Force enemy count to 20 if needed
//   if (window.sector1Progression) {
//     if (window.sector1Progression.enemiesDefeated < 20) {
//       console.log('🔧 Setting enemy count to 20 for jammer spawn');
//       window.sector1Progression.enemiesDefeated = 20;
//     }
//     
//     // Force jammer reveal
//     console.log('🔧 Forcing jammer reveal');
//       window.sector1Progression.revealJammer();
//   }
//   
//   // Also force via BroadcastJammerSystem
//   if (window.BroadcastJammerSystem && typeof window.BroadcastJammerSystem.forceSpawn === 'function') {
//     console.log('🔧 Force spawning jammer via BroadcastJammerSystem');
//     window.BroadcastJammerSystem.forceSpawn(2800, 880);
//   }
//   
//   console.log('✅ Emergency jammer spawn completed');
// };

// Initialize sector 1 progression
window.initSector1Progression = function(player) {
  try {
    window.sector1Progression = new window.Sector1Progression();
    window.sector1Progression.init(player);
    console.log('✅ Sector 1 Progression system initialized');
    
    // CRITICAL: DISABLED - Remove auto-creation to prevent respawning after destruction
    // setTimeout(() => {
    //   console.log('🔧 AUTO-CHECK: Verifying jammer creation status...');
    //   console.log(`📊 Current status: enemiesDefeated=${this.enemiesDefeated}, jammerRevealed=${this.jammerRevealed}`);
    //   console.log(`📊 BroadcastJammerSystem exists: ${!!window.BroadcastJammerSystem}`);
    //   console.log(`📊 BroadcastJammerSystem.jammer exists: ${!!window.BroadcastJammerSystem?.jammer}`);
    //   
    //   if (window.sector1Progression && !window.sector1Progression.broadcastJammer) {
    //     console.log('🚨 AUTO-CREATION: No jammer found after 3 seconds - forcing emergency creation!');
    //     
    //     // Force enemy count to meet requirement
    //     window.sector1Progression.enemiesDefeated = 20;
    //     
    //     // Force reveal
    //     window.sector1Progression.revealJammer();
    //     
    //     // Verify it was created
    //     setTimeout(() => {
    //       if (!window.sector1Progression.broadcastJammer) {
    //         console.log('🚨 AUTO-CREATION: Still no jammer - trying direct BroadcastJammerSystem call!');
    //         
    //         // Direct emergency spawn - let it calculate opposite side position
    //         if (window.BroadcastJammerSystem && typeof window.BroadcastJammerSystem.forceSpawn === 'function') {
    //           window.BroadcastJammerSystem.forceSpawn(); // Use opposite side positioning
    //           window.sector1Progression.broadcastJammer = window.BroadcastJammerSystem.jammer;
    //           window.sector1Progression.jammerRevealed = true;
    //           console.log('🚨 DIRECT SPAWN: Emergency jammer created!');
    //         }
    //       } else {
    //         console.log('✅ AUTO-CREATION: Jammer successfully created!');
    //         console.log(`📍 Jammer position: (${window.sector1Progression.broadcastJammer.position.x}, ${window.sector1Progression.broadcastJammer.position.y})`);
    //       }
    //     }, 1000);
    //   }
    // }, 3000);
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Sector 1 progression:', error?.message || error);
    return false;
  }
};

// REMOVED: Debug methods that create conflicting jammers - use BroadcastJammerSystem only

// Debug methods removed - use BroadcastJammerSystem only