// Mission Objectives System for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/objectives.js',
  exports: ['ObjectivesSystem', 'objectivesSystem'],
  dependencies: []
});

window.ObjectivesSystem = class ObjectivesSystem {
  constructor() {
    this.objectives = [];
    this.completedObjectives = new Set();
    this.objectiveUI = {
      visible: true, // Always visible for testing
      x: 30,
      y: 120,
      width: 600, // Increased from 400 to 600 to fit longer text
      height: 230 // Increased height by 30px and moved progress bar down 10px
    };
    
    // CRITICAL: Add active property to prevent system from being disabled
    this.active = true;
    
    // Mission critical objectives
    this.initializeMissionObjectives();
    
    // Track if jammer has been spawned for completed objective
    this.jammerSpawnedForObjective = false;
    
    // All lore retrieved state - RESTORED for overlay notification
    this.allLoreRetrieved = false;
    this.loreRetrievedTime = 0;
    this.loreOverlayLocked = false; // Track if overlay should be permanently displayed
  }
  
  initializeMissionObjectives() {
    // Clear existing objectives
    this.objectives = [];
    
    // Add mission critical objectives
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
      visible: false // Hidden until 1 enemy is defeated
    });
    
    
    console.log('🎯 Mission objectives initialized:', this.objectives.length, 'objectives');
  }
  
  update(deltaTime) {
    // Update objective progress based on game state
    this.updateJammerObjective();
    this.updateEnemyObjective();
    this.checkLoreCollectionStatus();
    
    // Check for completed objectives
    this.checkCompletedObjectives();
  }
  
  updateJammerObjective() {
    const jammerObjective = this.objectives.find(obj => obj.id === 'destroy_jammer');
    if (!jammerObjective || jammerObjective.completed) return;
    
    // Check sector progression for jammer status
    if (window.sector1Progression && window.sector1Progression.broadcastJammerDestroyed) {
      jammerObjective.completed = true;
      this.completedObjectives.add('destroy_jammer');
      console.log('✅ Objective completed: Destroy Broadcast Jammer');
    }
  }
  
  updateEnemyObjective() {
    const enemyObjective = this.objectives.find(obj => obj.id === 'defeat_enemies');
    if (!enemyObjective) return;
    
    // Check if objective is completed and jammer hasn't been spawned yet
    if (enemyObjective.completed && !this.jammerSpawnedForObjective) {
      console.log('🚨 DETECTED: Objective completed but jammer not spawned - spawning now!');
      this.spawnBroadcastJammer();
      this.jammerSpawnedForObjective = true;
      this.revealJammerObjective();
      return;
    }
    
    // Return if already completed and jammer spawned
    if (enemyObjective.completed && this.jammerSpawnedForObjective) return;
    
    // Get enemy defeat count from sector progression system (excludes tutorial kills)
    let enemiesDefeated = 0;
    let requiredEnemies = 20;
    
    // ONLY use Sector 1 progression system - it properly separates tutorial from main game kills
    if (window.sector1Progression) {
      enemiesDefeated = window.sector1Progression.enemiesDefeated;
      requiredEnemies = window.sector1Progression.requiredEnemyKills || 20;
    } else {
      // If sector progression isn't available, don't count any enemies
      // This prevents tutorial enemies from being counted toward mission objectives
      enemiesDefeated = 0;
    }
    
    // Update the objective requirement and progress
    enemyObjective.required = requiredEnemies;
    enemyObjective.progress = enemiesDefeated;
    
    // Update description to always show current progress
    enemyObjective.description = `Progress: ${enemiesDefeated}/${requiredEnemies}`;
    
    // Check completion
    if (enemiesDefeated >= enemyObjective.required) {
      enemyObjective.completed = true;
      this.completedObjectives.add('defeat_enemies');
      console.log('✅ Objective completed: Defeat enemies - Jammer revealed!');
      
      // Spawn the broadcast jammer when objective is completed
      this.spawnBroadcastJammer();
      this.jammerSpawnedForObjective = true;
      
      // Reveal the jammer objective
      this.revealJammerObjective();
    }
  }
  
  checkLoreCollectionStatus() {
    // Check if all lore has been collected and trigger overlay notification
    let allLoreCollected = false;
    
    // DEBUG: Enhanced logging - REDUCED FREQUENCY to prevent spam
    if (Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - 100) / 5000)) { // Log every 5 seconds
      console.log('🔍 DEBUG: checkLoreCollectionStatus() called');
    }
    
    // Method 1: Check lost data system progress
    if (window.lostDataSystem) {
      const progress = window.lostDataSystem.getProgress();
      
      // REDUCED FREQUENCY: Only log detailed progress when it changes or every 5 seconds
      const lastProgress = this._lastLoreProgress || { collected: 0, total: 0 };
      if (progress.collected !== lastProgress.collected || progress.total !== lastProgress.total || Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - 100) / 5000)) {
        console.log(`📖 Lost Data System Progress:`, progress);
        this._lastLoreProgress = { collected: progress.collected, total: progress.total };
      }
      
      // CRITICAL FIX: Check if collected meets or exceeds total requirement
      allLoreCollected = progress.collected >= progress.total && progress.total > 0;
      
      // DEBUG: Only log when state changes or every 5 seconds
      const lastAllCollected = this._lastAllLoreCollected || false;
      if (allLoreCollected !== lastAllCollected || Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - 100) / 5000)) {
        console.log(`📖 Lore progress check: ${progress.collected}/${progress.total} - All collected: ${allLoreCollected}`);
        console.log(`📖 Current allLoreRetrieved state: ${this.allLoreRetrieved}`);
        this._lastAllLoreCollected = allLoreCollected;
      }
    }
    
    // Method 2: Check lore system fallback
    if (!allLoreCollected && window.loreSystem && typeof window.loreSystem.allLoreCollected === 'function') {
      const loreSystemCheck = window.loreSystem.allLoreCollected();
      if (loreSystemCheck !== allLoreCollected) {
        allLoreCollected = loreSystemCheck;
        console.log(`📖 Lore System fallback check: ${allLoreCollected}`);
      }
    }
    
    // DEBUG: Check trigger conditions - REDUCED FREQUENCY
    if (Math.floor(Date.now() / 5000) !== Math.floor((Date.now() - 100) / 5000)) {
      console.log(`🔍 DEBUG: allLoreCollected=${allLoreCollected}, !this.allLoreRetrieved=${!this.allLoreRetrieved}`);
    }
    
    // CRITICAL: Trigger overlay when all lore collected and not already triggered
    if (allLoreCollected && !this.allLoreRetrieved) {
      this.allLoreRetrieved = true;
      this.loreRetrievedTime = Date.now();
      this.loreOverlayLocked = true; // PERMANENTLY LOCK overlay on screen
      console.log('🔒 ALL LORE RETRIEVED - Overlay notification LOCKED on screen permanently');
      console.log('🎉 Player has collected all lore fragments - overlay will remain visible');
      
      // Create celebration effect
      if (window.particleSystem) {
        window.particleSystem.explosion(960, 540, '#00ff00', 50);
      }
      
      // Play success sound
      if (window.audioSystem) {
        window.audioSystem.playSound('synthHit', 0.5);
      }
      
      // CRITICAL: Force immediate redraw notification to any listening systems
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          console.log('🔄 Forced redraw requested for ALL LORE RETRIEVED overlay');
        });
      }
    }
  }
  
  checkCompletedObjectives() {
    // Check for newly completed objectives and trigger events
    this.objectives.forEach(objective => {
      if (objective.completed && !this.completedObjectives.has(objective.id)) {
        this.completedObjectives.add(objective.id);
        this.onObjectiveCompleted(objective);
      }
    });
  }
  
  revealJammerObjective() {
    const jammerObjective = this.objectives.find(obj => obj.id === 'destroy_jammer');
    if (jammerObjective && !jammerObjective.visible) {
      jammerObjective.visible = true;
      console.log('🎯 Jammer objective revealed: Broadcast Jammer can only be destroyed with rhythm attacks!');
      
      // Show message to player
      if (window.loreSystem) {
        window.loreSystem.displayLoreMessage('BROADCAST JAMMER LOCATED! The jammer can only be destroyed with rhythm attacks. Press R to activate rhythm combat.');
      }
      
      // Create visual effect for jammer reveal
      if (window.particleSystem) {
        // Create reveal effect at jammer position
        if (window.sector1Progression && window.sector1Progression.broadcastJammer) {
          const jammer = window.sector1Progression.broadcastJammer;
          window.particleSystem.spawnEffect(jammer.position.x, jammer.position.y);
        }
      }
    }
  }
  
  // Spawn broadcast jammer when "Defeat 20 enemies" objective is completed
  // ENHANCED: Single authoritative spawn method with robust error handling and state tracking
  spawnBroadcastJammer() {
    console.log('🚨 AUTHORIZED SPAWN: ObjectivesSystem spawning broadcast jammer - "Defeat 20 enemies" objective completed!');
    
    // CRITICAL: State validation - prevent duplicate spawns
    if (this.jammerSpawnedForObjective) {
      console.log('⚠️ SPAWN BLOCKED: Jammer already spawned for this objective completion');
      return false;
    }
    
    // CRITICAL: System validation - ensure BroadcastJammerSystem is available
    if (!window.BroadcastJammerSystem) {
      console.error('❌ SPAWN FAILED: BroadcastJammerSystem not available');
      // Fallback: Try to create emergency jammer
      return this.attemptEmergencyJammerSpawn();
    }
    
    // CRITICAL: Existing jammer validation - clean up any existing instances
    if (window.BroadcastJammerSystem.jammer) {
      console.log('🔄 CLEANUP: Existing jammer detected - cleaning up before spawn');
      
      // If existing jammer is active and not destroyed, log conflict
      if (window.BroadcastJammerSystem.jammer.active) {
        console.warn('⚠️ CONFLICT: Active jammer already exists - this should not happen');
      }
      
      // Clean up existing jammer
      window.BroadcastJammerSystem.jammer.active = false;
      window.BroadcastJammerSystem.jammer = null;
      window.broadcastJammer = null;
      console.log('🧹 Cleanup completed');
    }
    
    // CRITICAL: Calculate spawn position using enhanced algorithm
    const spawnPosition = this.calculateOptimalSpawnPosition();
    const { spawnX, spawnY, spawnReason } = spawnPosition;
    
    console.log(`📍 ENHANCED SPAWN POSITION: (${spawnX.toFixed(1)}, ${spawnY.toFixed(1)}) - ${spawnReason}`);
    
    // CRITICAL: Attempt spawn with comprehensive error handling
    let spawnAttempt = null;
    let spawnSuccess = false;
    
    try {
      // Primary spawn method
      if (typeof window.BroadcastJammerSystem.forceSpawn === 'function') {
        spawnAttempt = window.BroadcastJammerSystem.forceSpawn(spawnX, spawnY);
        
        // CRITICAL: Verify spawn success
        if (spawnAttempt && typeof spawnAttempt === 'object') {
          // Verify jammer has required properties
          if (typeof spawnAttempt.x === 'number' && typeof spawnAttempt.y === 'number' && typeof spawnAttempt.active === 'boolean') {
            spawnSuccess = true;
            console.log('✅ PRIMARY SPAWN SUCCESS: Jammer created with valid properties');
          } else {
            console.error('❌ SPAWN VALIDATION FAILED: Jammer missing required properties');
            spawnAttempt = null;
          }
        } else {
          console.error('❌ PRIMARY SPAWN FAILED: forceSpawn returned invalid result');
        }
      } else {
        console.error('❌ SPAWN METHOD NOT AVAILABLE: forceSpawn function not found');
      }
    } catch (error) {
      console.error('❌ SPAWN EXCEPTION:', error.message || error);
      spawnAttempt = null;
    }
    
    // CRITICAL: Fallback spawn if primary method fails
    if (!spawnSuccess) {
      console.log('🔄 ATTEMPTING FALLBACK SPAWN METHOD');
      spawnSuccess = this.attemptEmergencyJammerSpawn(spawnX, spawnY);
    }
    
    // CRITICAL: Post-spawn validation and system synchronization
    if (spawnSuccess) {
      // Update state tracking
      this.jammerSpawnedForObjective = true;
      
      // Verify jammer is properly registered
      const finalVerification = this.verifyJammerSpawn();
      
      if (finalVerification) {
        console.log('✅ AUTHORIZED SPAWN COMPLETE: Broadcast jammer successfully spawned and verified');
        console.log('🎯 Jammer status: ACTIVE and ready for rhythm attacks');
        
        // Create enhanced spawn effects
        this.createJammerSpawnEffects(spawnX, spawnY);
        
        // Show comprehensive spawn message
        this.showJammerSpawnNotification();
        
        // CRITICAL: Notify all relevant systems
        this.notifySystemsOfJammerSpawn(spawnX, spawnY);
        
        return true;
      } else {
        console.error('❌ SPAWN VERIFICATION FAILED: Jammer spawned but verification failed');
        return false;
      }
    } else {
      console.error('❌ COMPLETE SPAWN FAILURE: All spawn methods failed');
      return false;
    }
  }
  
  // Calculate optimal spawn position using enhanced algorithm
  calculateOptimalSpawnPosition() {
    // Get player position with fallbacks
    let playerX = 960; // Default center
    let playerY = 880; // Default ground level
    
    if (window.player && typeof window.player.position === 'object') {
      playerX = window.player.position.x || playerX;
      playerY = window.player.position.y || playerY;
    } else if (typeof window.player === 'object' && window.player.x !== undefined) {
      playerX = window.player.x;
      playerY = window.player.y;
    }
    
    // Enhanced spawn logic with multiple strategies
    const mapWidth = 4096;
    const mapCenter = mapWidth / 2;
    const safeMargin = 500; // Keep away from edges
    const minDistance = 800; // Minimum distance from player
    
    let spawnX, spawnY, spawnReason;
    
    // Strategy 1: Opposite side of player
    if (playerX < mapCenter) {
      spawnX = mapCenter + (mapCenter - safeMargin) * (0.7 + Math.random() * 0.3);
      spawnReason = 'Opposite side (right) of player';
    } else {
      spawnX = safeMargin + (mapCenter - safeMargin) * (0.3 + Math.random() * 0.4);
      spawnReason = 'Opposite side (left) of player';
    }
    
    // Strategy 2: Ensure minimum distance from player
    const distanceFromPlayer = Math.abs(spawnX - playerX);
    if (distanceFromPlayer < minDistance) {
      // Adjust to maintain minimum distance
      if (spawnX > playerX) {
        spawnX = playerX + minDistance + Math.random() * 200;
      } else {
        spawnX = Math.max(safeMargin, playerX - minDistance - Math.random() * 200);
      }
      spawnReason += ' (adjusted for minimum distance)';
    }
    
    // Strategy 3: Add Y variation for unpredictability
    spawnY = 880 + (Math.random() - 0.5) * 120; // More Y variation
    
    // Final bounds checking
    spawnX = Math.max(safeMargin, Math.min(mapWidth - safeMargin, spawnX));
    spawnY = Math.max(800, Math.min(950, spawnY));
    
    return { spawnX, spawnY, spawnReason };
  }
  
  // Emergency jammer spawn fallback method
  attemptEmergencyJammerSpawn(forcedX = null, forcedY = null) {
    console.log('🚨 EMERGENCY SPAWN: Attempting fallback jammer creation');
    
    try {
      // Calculate emergency spawn position
      const emergencyX = forcedX || (500 + Math.random() * 3000);
      const emergencyY = forcedY || (880 + (Math.random() - 0.5) * 100);
      
      // Create jammer directly as last resort
      if (typeof window.BroadcastJammer === 'function') {
        const emergencyJammer = new window.BroadcastJammer(emergencyX, emergencyY);
        
        // Register jammer manually
        window.BroadcastJammerSystem.jammer = emergencyJammer;
        window.broadcastJammer = emergencyJammer;
        
        console.log('✅ EMERGENCY SPAWN SUCCESS: Jammer created via direct constructor');
        return true;
      } else {
        console.error('❌ EMERGENCY SPAWN FAILED: BroadcastJammer constructor not available');
        return false;
      }
    } catch (error) {
      console.error('❌ EMERGENCY SPAWN EXCEPTION:', error.message || error);
      return false;
    }
  }
  
  // Verify jammer spawn was successful
  verifyJammerSpawn() {
    console.log('🔍 VERIFYING JAMMER SPAWN...');
    
    // Check BroadcastJammerSystem
    let systemJammer = null;
    if (window.BroadcastJammerSystem && window.BroadcastJammerSystem.jammer) {
      systemJammer = window.BroadcastJammerSystem.jammer;
    }
    
    // Check global alias
    let globalJammer = null;
    if (window.broadcastJammer) {
      globalJammer = window.broadcastJammer;
    }
    
    // Verify consistency
    if (!systemJammer && !globalJammer) {
      console.error('❌ VERIFICATION FAILED: No jammer found in any system');
      return false;
    }
    
    if (systemJammer !== globalJammer) {
      console.warn('⚠️ VERIFICATION WARNING: System and global jammer references differ - fixing');
      // Fix inconsistency
      if (systemJammer) {
        window.broadcastJammer = systemJammer;
      } else if (globalJammer) {
        window.BroadcastJammerSystem.jammer = globalJammer;
      }
    }
    
    // Use system jammer as authoritative
    const authoritativeJammer = systemJammer || globalJammer;
    
    // Verify jammer properties
    const requiredProperties = ['x', 'y', 'active', 'rhythmHitsRequired'];
    const missingProperties = requiredProperties.filter(prop => !(prop in authoritativeJammer));
    
    if (missingProperties.length > 0) {
      console.error(`❌ VERIFICATION FAILED: Jammer missing properties: ${missingProperties.join(', ')}`);
      return false;
    }
    
    // Verify jammer is active
    if (!authoritativeJammer.active) {
      console.warn('⚠️ VERIFICATION WARNING: Jammer is not active after spawn');
      // Try to activate jammer
      authoritativeJammer.active = true;
    }
    
    console.log('✅ VERIFICATION SUCCESS: Jammer properly spawned and registered');
    console.log(`📍 Final position: (${authoritativeJammer.x.toFixed(1)}, ${authoritativeJammer.y.toFixed(1)})`);
    console.log(`🎯 Active status: ${authoritativeJammer.active}`);
    console.log(`🎵 Rhythm hits required: ${authoritativeJammer.rhythmHitsRequired}`);
    
    return true;
  }
  
  // Create enhanced spawn effects
  createJammerSpawnEffects(x, y) {
    console.log('✨ Creating jammer spawn effects...');
    
    // Create main spawn explosion
    if (window.particleSystem && typeof window.particleSystem.explosion === 'function') {
      window.particleSystem.explosion(x, y, '#ff9900', 30);
      
      // Create secondary ring effect
      setTimeout(() => {
        if (window.particleSystem && typeof window.particleSystem.explosion === 'function') {
          window.particleSystem.explosion(x, y - 50, '#ffff00', 20);
        }
      }, 200);
    }
    
    // Play spawn sound
    if (window.audioSystem) {
      try {
        if (typeof window.audioSystem.playSound === 'function') {
          window.audioSystem.playSound('synthHit', 0.6);
        }
      } catch (error) {
        console.warn('⚠️ Could not play spawn sound:', error.message);
      }
    }
    
    // Screen shake effect if available
    if (window.renderer && typeof window.renderer.setScreenShake === 'function') {
      try {
        window.renderer.setScreenShake(5, 500);
      } catch (error) {
        console.warn('⚠️ Could not apply screen shake:', error.message);
      }
    }
  }
  
  // Show comprehensive jammer spawn notification
  showJammerSpawnNotification() {
    console.log('📢 Displaying jammer spawn notification...');
    
    const messages = [
      'BROADCAST JAMMER SPAWNED!',
      'Use rhythm attacks (R key) to destroy it.',
      'The jammer can only be destroyed with rhythm attacks!'
    ];
    
    // Display messages through multiple channels
    if (window.loreSystem && typeof window.loreSystem.displayLoreMessage === 'function') {
      messages.forEach((message, index) => {
        setTimeout(() => {
          try {
            window.loreSystem.displayLoreMessage(message);
          } catch (error) {
            console.warn('⚠️ Could not display lore message:', error.message);
          }
        }, index * 2000);
      });
    }
    
    // Console notification for debugging
    console.log('🎯 JAMMER SPAWN NOTIFICATION:');
    messages.forEach((message, index) => {
      console.log(`  ${index + 1}. ${message}`);
    });
  }
  
  // Notify all relevant systems of jammer spawn
  notifySystemsOfJammerSpawn(x, y) {
    console.log('📡 Notifying systems of jammer spawn...');
    
    // Notify sector progression system
    if (window.sector1Progression && typeof window.sector1Progression.onJammerSpawned === 'function') {
      try {
        window.sector1Progression.onJammerSpawned(x, y);
        console.log('✅ Notified sector progression system');
      } catch (error) {
        console.warn('⚠️ Could not notify sector progression system:', error.message);
      }
    }
    
    // Notify jammer indicator system
    if (window.jammerIndicatorSystem && typeof window.jammerIndicatorSystem.onJammerSpawned === 'function') {
      try {
        window.jammerIndicatorSystem.onJammerSpawned(x, y);
        console.log('✅ Notified jammer indicator system');
      } catch (error) {
        console.warn('⚠️ Could not notify jammer indicator system:', error.message);
      }
    }
    
    // Update jammer arrow system if available
    if (window.jammerArrowSystem && typeof window.jammerArrowSystem.updateJammerPosition === 'function') {
      try {
        window.jammerArrowSystem.updateJammerPosition(x, y);
        console.log('✅ Updated jammer arrow system');
      } catch (error) {
        console.warn('⚠️ Could not update jammer arrow system:', error.message);
      }
    }
    
    console.log('✅ System notifications completed');
  }
  
  onObjectiveCompleted(objective) {
    console.log(`🎯 Objective completed: ${objective.title}`);
    
    // Create completion effect
    if (window.particleSystem) {
      window.particleSystem.impact(960, 540, '#00ff00', 20);
    }
    
    // Play completion sound
    if (window.audioSystem) {
      // Play success sound effect
    }
  }
  
  draw(ctx) {
    // CRITICAL: Always draw the ALL LORE RETRIEVED overlay even when main objectives are disabled
    this.drawLoreRetrievedOverlay(ctx);
    
    // DISABLED: Remove the left-side mission objectives box to eliminate duplication
    // The right-side objectives box handles all objective display
    return; // Don't draw anything - prevents the duplicate left box
    
    ctx.save();
    
    // Draw objectives panel background
    const panel = this.objectiveUI;
    ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
    ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
    
    // ENLARGED: Increase panel width to fit longer text
    panel.width = 600; // Increased from 400 to 600
    
    // Draw panel border
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);
    
    // Draw "MISSION OBJECTIVES" header
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('MISSION OBJECTIVES', panel.x + 15, panel.y + 10);
    
    // SIMPLIFIED: Get enemy count and display in header (excludes tutorial kills)
    let enemiesDefeated = 0;
    let requiredEnemies = 20;
    
    // ONLY use Sector 1 progression system - it properly separates tutorial from main game kills
    if (window.sector1Progression) {
      enemiesDefeated = window.sector1Progression.enemiesDefeated || 0;
      requiredEnemies = window.sector1Progression.requiredEnemyKills || 20;
    } else {
      // If sector progression isn't available, don't count any enemies
      // This prevents tutorial enemies from being counted toward mission objectives
      enemiesDefeated = 0;
    }
    
    // Draw enemy count in top-right corner - ALWAYS visible
    ctx.fillStyle = enemiesDefeated >= requiredEnemies ? '#00ff00' : '#ff9900';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`ENEMIES: ${enemiesDefeated}/${requiredEnemies}`, panel.x + panel.width - 15, panel.y + 12);
    
    // Draw objectives
    let yOffset = 40;
    this.objectives.forEach(objective => {
      if (!objective.visible) return;
      
      // Set color based on completion status
      if (objective.completed) {
        ctx.fillStyle = '#00ff00'; // Green for completed
      } else if (objective.priority === 'HIGH') {
        ctx.fillStyle = '#ff9900'; // Orange for high priority
      } else {
        ctx.fillStyle = '#ffff00'; // Yellow for medium priority
      }
      
      // Draw objective title
      ctx.font = 'bold 14px monospace';
      const prefix = objective.completed ? '✓' : '›';
      ctx.fillText(`${prefix} ${objective.title}`, panel.x + 15, panel.y + yOffset);
      
      // Draw objective description with text wrapping
      ctx.font = '12px monospace';
      ctx.fillStyle = objective.completed ? '#00ff00' : '#cccccc';
      
      // Show progress for defeat_enemies objective
      let displayText = objective.description;
      if (objective.id === 'defeat_enemies') {
        displayText = `Progress: ${enemiesDefeated}/${requiredEnemies}`;
      } else if (objective.id === 'destroy_jammer') {
        // SHORTENED: Make jammer text much shorter to fit
        displayText = 'Use rhythm attacks (R key)';
      }
      
      // Wrap text to fit within panel width
      const maxWidth = panel.width - 60; // 30px padding on each side
      const wrappedLines = this.wrapText(displayText, maxWidth, ctx);
      
      wrappedLines.forEach((line, index) => {
        ctx.fillText(line, panel.x + 30, panel.y + yOffset + 18 + (index * 14));
        console.log(`DEBUG: Drawing line ${index}: '${line}' at x=${panel.x + 30}, y=${panel.y + yOffset + 18 + (index * 14)}`);
      });
      
      // Adjust yOffset based on number of wrapped lines
      yOffset += (wrappedLines.length - 1) * 14;
      
      yOffset += 45;
    });
    
    // ENHANCED: Always show enemy defeat counter at bottom of objectives panel
    // Get current enemy defeat count from multiple sources (reuse variables from above)
    // enemiesDefeated and requiredEnemies are already declared above
    
    // Draw enemy progress bar at bottom of objectives panel (moved down another 10px)
    const barY = panel.y + panel.height - 60;
    const barHeight = 20;
    const barWidth = panel.width - 60;
    const progress = Math.min(1.0, enemiesDefeated / requiredEnemies);
    
    // Progress bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(panel.x + 30, barY, barWidth, barHeight);
    
    // Progress fill with color gradient based on completion
    if (progress >= 1.0) {
      ctx.fillStyle = '#00ff00'; // Green when complete
    } else if (progress >= 0.5) {
      ctx.fillStyle = '#ffff00'; // Yellow when halfway
    } else {
      ctx.fillStyle = '#ff9900'; // Orange when starting
    }
    
    const fillWidth = barWidth * progress;
    ctx.fillRect(panel.x + 30, barY, fillWidth, barHeight);
    
    // Progress bar border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(panel.x + 30, barY, barWidth, barHeight);
    
    // Enemy counter text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`ENEMIES DEFEATED: ${enemiesDefeated}/${requiredEnemies}`, panel.x + panel.width/2, barY + barHeight/2);
    
    // Note: ALL LORE RETRIEVED overlay is now drawn at the start of draw() method
    // This ensures it's always visible even when main objectives panel is disabled
    
    ctx.restore();
  }
  
  // Public methods for external systems
  completeObjective(objectiveId) {
    const objective = this.objectives.find(obj => obj.id === objectiveId);
    if (objective && !objective.completed) {
      objective.completed = true;
      this.completedObjectives.add(objectiveId);
      this.onObjectiveCompleted(objective);
    }
  }
  
  getObjectiveStatus(objectiveId) {
    const objective = this.objectives.find(obj => obj.id === objectiveId);
    return objective ? {
      completed: objective.completed,
      progress: objective.progress || 0,
      required: objective.required || 1
    } : null;
  }
  
  getAllObjectives() {
    return this.objectives.map(obj => ({
      id: obj.id,
      title: obj.title,
      completed: obj.completed,
      priority: obj.priority
    }));
  }
  
  toggleVisibility() {
    this.objectiveUI.visible = !this.objectiveUI.visible;
  }
  
  drawLoreRetrievedOverlay(ctx) {
    // REMOVED: Right-side popup overlay - now shows as text under lore counter on left side
    // This method is disabled to prevent the right-side popup from appearing
    return; // Don't draw anything
  }
  
  // Helper method to draw rounded rectangles
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  wrapText(text, maxWidth, ctx) {
    console.log(`DEBUG wrapText: text='${text}', maxWidth=${maxWidth}`);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      console.log(`DEBUG: Testing line '${testLine}', width=${metrics.width}, maxWidth=${maxWidth}`);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
        console.log(`DEBUG: Wrapped to new line: '${currentLine}'`);
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine.trim() !== '') {
      lines.push(currentLine);
    }
    
    console.log(`DEBUG wrapText result: ${lines.length} lines:`, lines);
    return lines;
  }
  
  // Synchronization method to ensure both systems stay in sync
  synchronizeWithSectorProgression() {
    if (!window.sector1Progression) {
      return false;
    }
    
    const sectorEnemies = window.sector1Progression.enemiesDefeated;
    const sectorJammerDestroyed = window.sector1Progression.broadcastJammerDestroyed;
    const objectivesJammerFlag = this.jammerSpawnedForObjective;
    
    console.log('🔄 SYNCHRONIZATION CHECK:');
    console.log(`  Sector progression: enemies=${sectorEnemies}, jammerDestroyed=${sectorJammerDestroyed}`);
    console.log(`  Objectives system: jammerSpawnedForObjective=${objectivesJammerFlag}`);
    
    // Fix synchronization issues
    let fixed = false;
    
    // If jammer is destroyed in sector but objectives doesn't know
    if (sectorJammerDestroyed && !objectivesJammerFlag) {
      console.log('🔧 SYNC FIX: Jammer was destroyed but objectives flag not set - fixing...');
      this.jammerSpawnedForObjective = true;
      fixed = true;
    }
    
    // Update defeat enemies objective to match sector progression
    const defeatObjective = this.objectives.find(obj => obj.id === 'defeat_enemies');
    if (defeatObjective && defeatObjective.progress !== sectorEnemies) {
      console.log(`🔧 SYNC FIX: Updating enemy objective progress from ${defeatObjective.progress} to ${sectorEnemies}`);
      defeatObjective.progress = sectorEnemies;
      defeatObjective.completed = sectorEnemies >= defeatObjective.required;
      if (defeatObjective.completed) {
        this.completedObjectives.add('defeat_enemies');
      }
      fixed = true;
    }
    
    // Update jammer objective to match sector progression
    const jammerObjective = this.objectives.find(obj => obj.id === 'destroy_jammer');
    if (jammerObjective) {
      const shouldBeCompleted = sectorJammerDestroyed;
      const shouldBeVisible = sectorEnemies >= 20 || sectorJammerDestroyed;
      
      if (jammerObjective.completed !== shouldBeCompleted) {
        console.log(`🔧 SYNC FIX: Updating jammer objective completed from ${jammerObjective.completed} to ${shouldBeCompleted}`);
        jammerObjective.completed = shouldBeCompleted;
        if (shouldBeCompleted) {
          this.completedObjectives.add('destroy_jammer');
        }
        fixed = true;
      }
      
      if (jammerObjective.visible !== shouldBeVisible) {
        console.log(`🔧 SYNC FIX: Updating jammer objective visible from ${jammerObjective.visible} to ${shouldBeVisible}`);
        jammerObjective.visible = shouldBeVisible;
        fixed = true;
      }
    }
    
    if (fixed) {
      console.log('✅ Synchronization fixed - systems are now in sync');
    } else {
      console.log('✅ Systems already synchronized');
    }
    
    return fixed;
  }
  
  reset() {
    console.log('🔄 ObjectivesSystem reset called - performing enhanced state management...');
    
    // CRITICAL: Capture current state before reset for persistence logic
    const currentEnemyCount = window.sector1Progression ? window.sector1Progression.enemiesDefeated : 0;
    const requiredEnemies = 20;
    const shouldPreserveProgress = currentEnemyCount >= requiredEnemies;
    const jammerAlreadySpawned = this.jammerSpawnedForObjective;
    const jammerExists = window.BroadcastJammerSystem && window.BroadcastJammerSystem.jammer;
    const jammerActive = jammerExists && window.BroadcastJammerSystem.jammer.active;
    const jammerDestroyed = window.sector1Progression ? window.sector1Progression.broadcastJammerDestroyed : false;
    
    console.log(`🔄 RESET STATE CAPTURE:`);
    console.log(`  Enemy count: ${currentEnemyCount}/${requiredEnemies}`);
    console.log(`  Should preserve progress: ${shouldPreserveProgress}`);
    console.log(`  Jammer already spawned: ${jammerAlreadySpawned}`);
    console.log(`  Jammer exists: ${jammerExists}`);
    console.log(`  Jammer active: ${jammerActive}`);
    console.log(`  Jammer destroyed: ${jammerDestroyed}`);
    
    // Reset core objectives state
    this.completedObjectives.clear();
    this.allLoreRetrieved = false;
    this.loreRetrievedTime = 0;
    this.loreOverlayLocked = false;
    
    // CRITICAL: Enhanced jammer spawn state management
    if (shouldPreserveProgress && (jammerAlreadySpawned || jammerDestroyed)) {
      // PERSISTENCE: Keep jammer spawn flag if enemy quota met and jammer was spawned or destroyed
      console.log('🔄 PERSISTENCE: Preserving jammer spawn state - enemy quota met and jammer was spawned/destroyed');
      // Don't reset jammerSpawnedForObjective - this preserves the spawned state
      if (jammerDestroyed) {
        this.jammerSpawnedForObjective = true; // Ensure flag is set if jammer was destroyed
      }
    } else {
      // NORMAL RESET: Reset jammer spawn flag if conditions not met
      console.log('🔄 NORMAL RESET: Resetting jammer spawn state - conditions not met for persistence');
      this.jammerSpawnedForObjective = false;
    }
    
    // ALWAYS reinitialize objectives first
    this.initializeMissionObjectives();
    
    if (shouldPreserveProgress) {
      // ENHANCED PERSISTENCE: Restore the defeat_enemies objective as completed
      console.log(`🔄 ENHANCED PERSISTENCE: Restoring objective state for ${currentEnemyCount} enemy defeats`);
      
      // Restore the defeat_enemies objective state
      const defeatObjective = this.objectives.find(obj => obj.id === 'defeat_enemies');
      if (defeatObjective) {
        defeatObjective.completed = true;
        defeatObjective.progress = currentEnemyCount;
        defeatObjective.required = requiredEnemies;
        this.completedObjectives.add('defeat_enemies');
        console.log('✅ Defeat enemies objective restored as completed');
      }
      
      // ENHANCED: Handle jammer objective persistence
      const jammerObjective = this.objectives.find(obj => obj.id === 'destroy_jammer');
      if (jammerObjective) {
        if (window.sector1Progression && window.sector1Progression.broadcastJammerDestroyed) {
          // If jammer was destroyed, mark objective as completed
          jammerObjective.completed = true;
          jammerObjective.visible = true;
          this.completedObjectives.add('destroy_jammer');
          console.log('✅ Destroy jammer objective restored as completed (jammer was destroyed)');
        } else if (jammerAlreadySpawned && jammerActive) {
          // If jammer was spawned and is still active, reveal objective but don't mark complete
          jammerObjective.visible = true;
          console.log('✅ Destroy jammer objective revealed (jammer is active)');
        } else {
          // Otherwise hide objective until jammer spawns
          jammerObjective.visible = false;
          console.log('🔄 Destroy jammer objective hidden (jammer not yet spawned)');
        }
      }
      
      // ENHANCED: Handle sector progression state preservation
      if (window.sector1Progression) {
        const preserveEnemies = window.sector1Progression.enemiesDefeated;
        const preserveJammerDestroyed = window.sector1Progression.broadcastJammerDestroyed;
        
        // CRITICAL: Call sector progression reset with preservation flag
        window.sector1Progression.reset(true); // true = preserve enemy progress
        
        // Override specific values that need to be preserved
        window.sector1Progression.enemiesDefeated = preserveEnemies;
        window.sector1Progression.broadcastJammerDestroyed = preserveJammerDestroyed;
        window.sector1Progression.jammerRevealed = jammerActive || preserveJammerDestroyed; // Reveal if active or was destroyed
        window.sector1Progression.jammerActive = jammerActive && !preserveJammerDestroyed; // Active if jammer exists and not destroyed
        
        console.log(`🔄 Sector 1 progression state preserved and synchronized:`);
        console.log(`  Enemy defeats: ${preserveEnemies}`);
        console.log(`  Jammer destroyed: ${preserveJammerDestroyed}`);
        console.log(`  Jammer active: ${window.sector1Progression.jammerActive}`);
        console.log(`  Jammer revealed: ${window.sector1Progression.jammerRevealed}`);
      }
      
      // CRITICAL: Auto-spawn jammer if it was spawned before but doesn't exist now
      if (jammerAlreadySpawned && !jammerActive && !window.sector1Progression?.broadcastJammerDestroyed) {
        console.log('🔄 AUTO-SPAWN: Jammer was spawned before but missing - attempting to restore');
        
        // Attempt to restore jammer after a short delay to ensure all systems are ready
        setTimeout(() => {
          if (this.jammerSpawnedForObjective && !window.BroadcastJammerSystem?.jammer?.active) {
            console.log('🔄 RESTORING: Spawning jammer to restore previous game state');
            this.spawnBroadcastJammer();
          }
        }, 1000);
      }
    } else {
      // NORMAL RESET: Reset everything if less than 20 enemies defeated
      console.log(`🔄 NORMAL RESET: Enemy count ${currentEnemyCount}/${requiredEnemies} below requirement - full reset`);
      
      // Reset sector progression with no preservation
      if (window.sector1Progression) {
        window.sector1Progression.reset(false); // false = no preservation
        console.log('🔄 Sector 1 progression fully reset');
      }
      
      // CRITICAL: Clean up any existing jammer to prevent conflicts
      if (window.BroadcastJammerSystem && window.BroadcastJammerSystem.jammer) {
        console.log('🧹 CLEANUP: Removing existing jammer during full reset');
        window.BroadcastJammerSystem.jammer.active = false;
        window.BroadcastJammerSystem.jammer = null;
        window.broadcastJammer = null;
        
        // Reset permanent destruction flag to allow fresh spawn
        if (window.BroadcastJammerSystem.permanentlyDestroyed !== undefined) {
          window.BroadcastJammerSystem.permanentlyDestroyed = false;
        }
      }
    }
    
    // CRITICAL: Synchronize systems after reset to ensure consistency
    setTimeout(() => {
      if (window.sector1Progression) {
        this.synchronizeWithSectorProgression();
      }
    }, 100);
    
    console.log('✅ ObjectivesSystem reset completed with enhanced state management and synchronization');
  }
};

// Initialize global objectives system
window.objectivesSystem = null;

// DEBUG: Global command to manually trigger ALL LORE RETRIEVED overlay
window.DEBUG_ALL_LORE_RETRIEVED = function() {
  console.log('🔧 DEBUG: Manually triggering ALL LORE RETRIEVED overlay');
  if (window.objectivesSystem) {
    window.objectivesSystem.allLoreRetrieved = true;
    window.objectivesSystem.loreRetrievedTime = Date.now();
    window.objectivesSystem.loreOverlayLocked = true;
    console.log('✅ ALL LORE RETRIEVED overlay triggered manually');
    
    // Create celebration effect
    if (window.particleSystem) {
      window.particleSystem.explosion(960, 540, '#00ff00', 50);
    }
    
    // Play success sound
    if (window.audioSystem) {
      window.audioSystem.playSound('synthHit', 0.5);
    }
    
    return '✅ ALL LORE RETRIEVED overlay triggered - should now be visible!';
  } else {
    return '❌ Objectives system not available';
  }
};

// DEBUG: Additional command to test lore collection progress
window.DEBUG_LORE_STATUS = function() {
  console.log('🔧 DEBUG: Checking lore collection status...');
  
  if (window.lostDataSystem) {
    const progress = window.lostDataSystem.getProgress();
    console.log('💎 Lost Data System:');
    console.log(`  Collected: ${progress.collected}/${progress.total}`);
    console.log(`  Remaining: ${progress.remainingLore}`);
    console.log(`  All collected: ${progress.collected >= progress.total && progress.total > 0}`);
  }
  
  if (window.objectivesSystem) {
    console.log('🎯 Objectives System:');
    console.log(`  allLoreRetrieved: ${window.objectivesSystem.allLoreRetrieved}`);
    console.log(`  loreOverlayLocked: ${window.objectivesSystem.loreOverlayLocked}`);
    console.log(`  loreRetrievedTime: ${window.objectivesSystem.loreRetrievedTime}`);
  } else {
    console.log('❌ Objectives System not available');
  }
  
  if (window.loreSystem) {
    console.log('📖 Lore System:');
    console.log(`  isActive: ${window.loreSystem.isActive}`);
    console.log(`  currentLore: ${window.loreSystem.currentLore ? 'Active' : 'None'}`);
  } else {
    console.log('❌ Lore System not available');
  }
};

console.log('🔧 DEBUG commands available:');
console.log('  DEBUG_ALL_LORE_RETRIEVED() - Manually trigger ALL LORE RETRIEVED overlay');
console.log('  DEBUG_LORE_STATUS() - Check lore collection status');

console.log('🔧 DEBUG command available: DEBUG_ALL_LORE_RETRIEVED() - Manually trigger ALL LORE RETRIEVED overlay');

// Initialize objectives system
window.initObjectives = function() {
  try {
    console.log('🎯 Initializing objectives system...');
    window.objectivesSystem = new window.ObjectivesSystem();
    console.log('✅ Objectives system initialized successfully');
    console.log('🎯 Objectives system active:', window.objectivesSystem.active);
    console.log('🎯 Objectives system visible:', window.objectivesSystem.objectiveUI?.visible || 'undefined');
    console.log('🎯 Objectives count:', window.objectivesSystem.objectives.length);
    return true;
  } catch (error) {
    console.error('Failed to initialize objectives system:', error?.message || error);
    return false;
  }
};

// ENHANCED: Debug commands for jammer spawning system
window.DEBUG_JAMMER_SPAWNING = {
  // Get comprehensive jammer spawn status
  getStatus: function() {
    if (!window.objectivesSystem) {
      return '❌ Objectives system not available';
    }
    
    const status = {
      objectivesSystem: {
        jammerSpawnedForObjective: window.objectivesSystem.jammerSpawnedForObjective,
        active: window.objectivesSystem.active
      },
      broadcastJammerSystem: {
        exists: !!window.BroadcastJammerSystem,
        jammer: !!window.BroadcastJammerSystem?.jammer,
        jammerActive: window.BroadcastJammerSystem?.jammer?.active || false,
        permanentlyDestroyed: window.BroadcastJammerSystem?.permanentlyDestroyed || false
      },
      globalAlias: {
        exists: !!window.broadcastJammer,
        active: window.broadcastJammer?.active || false
      },
      sectorProgression: {
        enemiesDefeated: window.sector1Progression?.enemiesDefeated || 0,
        requiredEnemyKills: window.sector1Progression?.requiredEnemyKills || 20,
        broadcastJammerDestroyed: window.sector1Progression?.broadcastJammerDestroyed || false,
        jammerRevealed: window.sector1Progression?.jammerRevealed || false,
        jammerActive: window.sector1Progression?.jammerActive || false
      },
      objectives: {
        defeatEnemies: window.objectivesSystem.getObjectiveStatus('defeat_enemies'),
        destroyJammer: window.objectivesSystem.getObjectiveStatus('destroy_jammer')
      }
    };
    
    console.log('🔍 COMPREHENSIVE JAMMER SPAWN STATUS:');
    console.table(status);
    
    // Check for inconsistencies
    const issues = [];
    
    if (status.broadcastJammerSystem.jammer && !status.globalAlias.exists) {
      issues.push('⚠️ Jammer exists in system but global alias is missing');
    }
    
    if (status.globalAlias.exists && !status.broadcastJammerSystem.jammer) {
      issues.push('⚠️ Global alias exists but system jammer is missing');
    }
    
    if (status.objectivesSystem.jammerSpawnedForObjective && !status.broadcastJammerSystem.jammer) {
      issues.push('⚠️ Jammer marked as spawned but no jammer found in system');
    }
    
    if (status.broadcastJammerSystem.permanentlyDestroyed && status.broadcastJammerSystem.jammerActive) {
      issues.push('⚠️ Jammer marked as permanently destroyed but still active');
    }
    
    if (issues.length > 0) {
      console.log('🚨 ISSUES DETECTED:');
      issues.forEach(issue => console.log(issue));
    } else {
      console.log('✅ No consistency issues detected');
    }
    
    return status;
  },
  
  // Force trigger jammer spawn for testing
  forceSpawn: function() {
    if (!window.objectivesSystem) {
      return false;
    }
    
    console.log('🔧 DEBUG: Force triggering jammer spawn...');
    
    // Mark enemy objective as completed
    const defeatObjective = window.objectivesSystem.objectives.find(obj => obj.id === 'defeat_enemies');
    if (defeatObjective) {
      defeatObjective.completed = true;
      defeatObjective.progress = 20;
      defeatObjective.required = 20;
      window.objectivesSystem.completedObjectives.add('defeat_enemies');
      console.log('✅ Marked defeat enemies objective as completed');
    }
    
    // Simulate enemy count in sector progression
    if (window.sector1Progression) {
      window.sector1Progression.enemiesDefeated = 20;
      console.log('✅ Set sector progression enemy count to 20');
    }
    
    // Trigger spawn
    const spawnResult = window.objectivesSystem.spawnBroadcastJammer();
    console.log('🔧 Force spawn result:', spawnResult);
    
    return spawnResult;
  },
  
  // Reset jammer spawning state
  resetState: function() {
    if (!window.objectivesSystem) {
      console.error('❌ Objectives system not available');
      return false;
    }
    
    console.log('🔧 DEBUG: Resetting jammer spawning state...');
    
    window.objectivesSystem.jammerSpawnedForObjective = false;
    
    if (window.BroadcastJammerSystem) {
      window.BroadcastJammerSystem.permanentlyDestroyed = false;
      if (window.BroadcastJammerSystem.jammer) {
        window.BroadcastJammerSystem.jammer.active = false;
        window.BroadcastJammerSystem.jammer = null;
      }
    }
    
    window.broadcastJammer = null;
    
    console.log('✅ Jammer spawning state reset');
    return true;
  },
  
  // Test emergency spawn method
  testEmergencySpawn: function() {
    if (!window.objectivesSystem) {
      console.error('❌ Objectives system not available');
      return false;
    }
    
    console.log('🔧 DEBUG: Testing emergency spawn method...');
    
    const testResult = window.objectivesSystem.attemptEmergencyJammerSpawn(2000, 880);
    console.log('🔧 Emergency spawn test result:', testResult);
    
    return testResult;
  },
  
  // Test spawn position calculation
  testSpawnPosition: function() {
    if (!window.objectivesSystem) {
      return null;
    }
    
    console.log('🔧 DEBUG: Testing spawn position calculation...');
    
    const position = window.objectivesSystem.calculateOptimalSpawnPosition();
    console.log('🔧 Calculated spawn position:', position);
    
    return position;
  },
  
  // Test jammer verification
  testVerification: function() {
    if (!window.objectivesSystem) {
      console.error('❌ Objectives system not available');
      return false;
    }
    
    console.log('🔧 DEBUG: Testing jammer verification...');
    
    const verificationResult = window.objectivesSystem.verifyJammerSpawn();
    console.log('🔧 Verification result:', verificationResult);
    
    return verificationResult;
  }
};

console.log('🔧 Enhanced jammer spawning debug commands loaded:');
console.log('  DEBUG_JAMMER_SPAWNING.getStatus() - Get comprehensive jammer spawn status');
console.log('  DEBUG_JAMMER_SPAWNING.forceSpawn() - Force trigger jammer spawn for testing');
console.log('  DEBUG_JAMMER_SPAWNING.resetState() - Reset jammer spawning state');
console.log('  DEBUG_JAMMER_SPAWNING.testEmergencySpawn() - Test emergency spawn method');
console.log('  DEBUG_JAMMER_SPAWNING.testSpawnPosition() - Test spawn position calculation');
console.log('  DEBUG_JAMMER_SPAWNING.testVerification() - Test jammer verification');

// ENHANCED: Debug commands for persistence and reset logic
window.DEBUG_PERSISTENCE = {
  // Test persistence logic by simulating different scenarios
  testPersistence: function(enemyCount, jammerDestroyed = false) {
    console.log(`🔧 DEBUG: Testing persistence with enemies=${enemyCount}, jammerDestroyed=${jammerDestroyed}`);
    
    if (!window.objectivesSystem || !window.sector1Progression) {
      console.error('❌ Required systems not available');
      return false;
    }
    
    // Set up test state
    window.sector1Progression.enemiesDefeated = enemyCount;
    window.sector1Progression.broadcastJammerDestroyed = jammerDestroyed;
    
    if (jammerDestroyed) {
      window.objectivesSystem.jammerSpawnedForObjective = true;
    }
    
    console.log('🔧 Test state set, calling reset()...');
    
    // Test reset
    window.objectivesSystem.reset();
    
    // Check results
    const result = {
      enemiesPreserved: window.sector1Progression.enemiesDefeated === enemyCount && enemyCount >= 20,
      jammerFlagPreserved: window.objectivesSystem.jammerSpawnedForObjective === (jammerDestroyed || enemyCount >= 20),
      jammerDestroyedPreserved: window.sector1Progression.broadcastJammerDestroyed === jammerDestroyed
    };
    
    console.log('🔧 Persistence test results:', result);
    return result;
  },
  
  // Test synchronization between systems
  testSynchronization: function() {
    console.log('🔧 DEBUG: Testing system synchronization...');
    
    if (!window.objectivesSystem) {
      console.error('❌ Objectives system not available');
      return false;
    }
    
    const syncResult = window.objectivesSystem.synchronizeWithSectorProgression();
    console.log(`🔧 Synchronization result: ${syncResult ? 'Fixed issues' : 'No issues found'}`);
    return syncResult;
  },
  
  // Force manual synchronization
  forceSync: function() {
    console.log('🔧 DEBUG: Forcing manual synchronization...');
    
    if (!window.objectivesSystem) {
      console.error('❌ Objectives system not available');
      return false;
    }
    
    return window.objectivesSystem.synchronizeWithSectorProgression();
  },
  
  // Show current persistence state
  showState: function() {
    console.log('🔧 DEBUG: Current persistence state:');
    
    if (window.sector1Progression) {
      console.log('  Sector1Progression:');
      console.log(`    enemiesDefeated: ${window.sector1Progression.enemiesDefeated}`);
      console.log(`    tutorialEnemiesDefeated: ${window.sector1Progression.tutorialEnemiesDefeated}`);
      console.log(`    broadcastJammerDestroyed: ${window.sector1Progression.broadcastJammerDestroyed}`);
      console.log(`    currentPhase: ${window.sector1Progression.currentPhase}`);
    } else {
      console.log('  Sector1Progression: Not available');
    }
    
    if (window.objectivesSystem) {
      console.log('  ObjectivesSystem:');
      console.log(`    jammerSpawnedForObjective: ${window.objectivesSystem.jammerSpawnedForObjective}`);
      const defeatStatus = window.objectivesSystem.getObjectiveStatus('defeat_enemies');
      const jammerStatus = window.objectivesSystem.getObjectiveStatus('destroy_jammer');
      console.log(`    defeat_enemies objective:`, defeatStatus);
      console.log(`    destroy_jammer objective:`, jammerStatus);
    } else {
      console.log('  ObjectivesSystem: Not available');
    }
    
    if (window.BroadcastJammerSystem) {
      console.log('  BroadcastJammerSystem:');
      console.log(`    jammer exists: ${!!window.BroadcastJammerSystem.jammer}`);
      console.log(`    jammer active: ${window.BroadcastJammerSystem.jammer?.active || false}`);
      console.log(`    permanentlyDestroyed: ${window.BroadcastJammerSystem.permanentlyDestroyed || false}`);
    } else {
      console.log('  BroadcastJammerSystem: Not available');
    }
  },
  
  // Simulate game over scenario
  simulateGameOver: function() {
    console.log('🔧 DEBUG: Simulating game over scenario...');
    
    if (!window.objectivesSystem) {
      console.error('❌ Objectives system not available');
      return false;
    }
    
    // Show state before reset
    console.log('🔧 State before game over:');
    this.showState();
    
    // Simulate game over reset
    window.objectivesSystem.reset();
    
    // Show state after reset
    console.log('🔧 State after game over:');
    this.showState();
    
    return true;
  }
};

console.log('🔧 Enhanced persistence debug commands loaded:');
console.log('  DEBUG_PERSISTENCE.testPersistence(enemyCount, jammerDestroyed) - Test persistence logic');
console.log('  DEBUG_PERSISTENCE.testSynchronization() - Test system synchronization');
console.log('  DEBUG_PERSISTENCE.forceSync() - Force manual synchronization');
console.log('  DEBUG_PERSISTENCE.showState() - Show current persistence state');
console.log('  DEBUG_PERSISTENCE.simulateGameOver() - Simulate game over scenario');

// CRITICAL: Auto-initialize objectives system when this script loads
console.log('🎯 Objectives script loaded - auto-initializing...');
if (typeof window.initObjectives === 'function') {
  window.initObjectives();
} else {
  console.error('🎯 initObjectives function not available');
}