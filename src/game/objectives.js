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
      title: 'Defeat 1 enemy',
      description: 'Eliminate 20 hostile entities',
      priority: 'HIGH',
      completed: false,
      visible: true,
      progress: 0,
      required: 1
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
    if (!enemyObjective || enemyObjective.completed) return;
    
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
    } else {
      console.log('⚠️ Lost Data System not available');
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
  
  reset() {
    this.completedObjectives.clear();
    // Reset lore retrieved state
    this.allLoreRetrieved = false;
    this.loreRetrievedTime = 0;
    this.loreOverlayLocked = false; // Reset overlay lock status
    
    // CRITICAL: Check enemy count before resetting - persistence logic
    const currentEnemyCount = window.sector1Progression ? window.sector1Progression.enemiesDefeated : 0;
    const requiredEnemies = 20;
    
    if (currentEnemyCount >= requiredEnemies) {
      // PERSISTENCE: Don't reset enemy counter if 20+ enemies were defeated
      console.log(`🔄 PERSISTENCE: Enemy count ${currentEnemyCount}/${requiredEnemies} meets requirement - keeping progress`);
      
      // Keep the defeat_enemies objective completed but reset everything else
      const defeatObjective = this.objectives.find(obj => obj.id === 'defeat_enemies');
      if (defeatObjective) {
        defeatObjective.completed = true;
        defeatObjective.progress = currentEnemyCount;
        defeatObjective.required = requiredEnemies;
        this.completedObjectives.add('defeat_enemies');
      }
      
      // Reset sector progression but keep enemy count
      if (window.sector1Progression) {
        const preserveEnemies = window.sector1Progression.enemiesDefeated; // Preserve enemy count
        window.sector1Progression.tutorialEnemiesDefeated = 0;
        window.sector1Progression.broadcastJammerDestroyed = false;
        window.sector1Progression.jammerRevealed = false;
        window.sector1Progression.jammerActive = false;
        window.sector1Progression.enemiesDefeated = preserveEnemies; // Restore enemy count
        console.log(`🔄 Sector 1 progression reset but preserved ${preserveEnemies} enemy defeats`);
      }
    } else {
      // NORMAL RESET: Reset everything if less than 20 enemies defeated
      console.log(`🔄 NORMAL RESET: Enemy count ${currentEnemyCount}/${requiredEnemies} below requirement - full reset`);
      
      // Reset sector progression enemy counter if available
      if (window.sector1Progression) {
        window.sector1Progression.enemiesDefeated = 0;
        window.sector1Progression.tutorialEnemiesDefeated = 0;
        window.sector1Progression.broadcastJammerDestroyed = false;
        window.sector1Progression.jammerRevealed = false;
        window.sector1Progression.jammerActive = false;
        console.log('🔄 Sector 1 progression counters fully reset');
      }
    }
    
    this.initializeMissionObjectives();
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
    console.error('❌ Objectives system not available');
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
  } else {
    console.log('❌ Lost Data System not available');
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

// CRITICAL: Auto-initialize objectives system when this script loads
console.log('🎯 Objectives script loaded - auto-initializing...');
if (typeof window.initObjectives === 'function') {
  window.initObjectives();
} else {
  console.error('🎯 initObjectives function not available');
}