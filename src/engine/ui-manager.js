// UI management system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/ui-manager.js',
  exports: ['uiManager', 'updateUI', 'drawGameUI'],
  dependencies: []
});

window.uiManager = {
  // UI state
  visible: {
    health: true,
    score: false,
    objectives: true,
    tutorial: false,
    rhythmUI: false,
    hackingUI: false
  },
  
  // Initialize UI
  init() {
    this.setupEventListeners();
    this.createElements();
  },
  
  // Setup event listeners
  setupEventListeners() {
    // Handle resize events
    window.addEventListener('resize', this.handleResize);
  },
  
  // Handle window resize
  handleResize() {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
      // Maintain aspect ratio
      const aspectRatio = 1920 / 1080;
      const maxWidth = window.innerWidth;
      const maxHeight = window.innerHeight;
      
      if (maxWidth / aspectRatio <= maxHeight) {
        canvas.width = maxWidth;
        canvas.height = maxWidth / aspectRatio;
      } else {
        canvas.width = maxHeight * aspectRatio;
        canvas.height = maxHeight;
      }
    }
  },
  
  // Create UI elements
  createElements() {
    // Create health display
    this.createHealthBar();
    
    // Create objectives panel
    this.createObjectivesPanel();
    
    // Create rhythm UI
    this.createRhythmUI();
    
    // Create hacking UI
    this.createHackingUI();
  },
  
  // Create health bar
  createHealthBar() {
    const healthContainer = document.querySelector('.health-bar');
    if (!healthContainer) return;
    
    // Clear existing segments
    healthContainer.innerHTML = '';
    
    // Create health segments
    for (let i = 0; i < 3; i++) {
      const segment = document.createElement('div');
      segment.className = 'health-segment';
      healthContainer.appendChild(segment);
    }
  },
  
  // Update UI display
  updateUI() {
    this.updateHealthBar();
    this.updateObjectives();
    this.updateRhythmUI();
    updateHackingUI();
    this.updateDebugInfo();
  },
  
  // Update health bar
  updateHealthBar() {
    if (!this.visible.health || !window.player) return;
    
    const healthSegments = document.querySelectorAll('.health-segment');
    healthSegments.forEach((segment, index) => {
      const isActive = index < window.player.health;
      segment.classList.toggle('empty', !isActive);
    });
  },
  
  // Update objectives display
  updateObjectives() {
    if (!this.visible.objectives) return;
    
    // Update objectives based on game state
    const objectivesContainer = document.querySelector('.objectives-panel');
    if (!objectivesContainer) return;
    
    let objectivesHTML = '<h3>MISSION OBJECTIVES</h3>';
    
    // Enemy defeat objective
    if (window.enemyManager) {
      const enemiesDefeated = window.enemyManager.getDefeatedCount();
      const enemiesRequired = 20;
      objectivesHTML += `<div>Defeat ${enemiesDefeated}/${enemiesRequired} enemies</div>`;
    }
    
    // Jammer objective
    if (window.sector1Progression && window.sector1Progression.broadcastJammerDestroyed) {
      objectivesHTML += '<div>Destroy the jammer (R key)</div>';
    }
    
    objectivesContainer.innerHTML = objectivesHTML;
  },
  
  // Update rhythm UI
  updateRhythmUI() {
    if (!this.visible.rhythmUI) return;
    
    const rhythmContainer = document.querySelector('.rhythm-panel');
    if (!rhythmContainer) return;
    
    let rhythmHTML = '';
    
    if (window.rhythmSystem && window.rhythmSystem.isActive()) {
      rhythmHTML = `
        <div class="rhythm-active">RHYTHM MODE ACTIVE</div>
      `;
    }
    
    rhythmContainer.innerHTML = rhythmHTML;
  },
  
  // Update hacking UI
  updateHackingUI() {
    if (!this.visible.hackingUI) return;
    
    const hackingContainer = document.querySelector('.hacking-panel');
    if (!hackingContainer) return;
    
    let hackingHTML = '';
    
    if (window.hackingSystem && window.hackingSystem.isActive()) {
      hackingHTML = `
        <div class="hacking-active">HACKING MODE ACTIVE</div>
      `;
    }
    
    hackingContainer.innerHTML = hackingHTML;
  },
  
  // Create rhythm UI
  createRhythmUI() {
    const rhythmContainer = document.querySelector('.rhythm-panel');
    if (!rhythmContainer) {
      // Create if doesn't exist
      const container = document.querySelector('.container');
      if (container) {
        const rhythmHTML = '<div class="rhythm-panel"></div>';
        container.insertAdjacentHTML('beforeend', rhythmHTML);
      }
    }
  },
  
  // Create hacking UI
  createHackingUI() {
    const hackingContainer = document.querySelector('.hacking-panel');
    if (!hackingContainer) {
      // Create if doesn't exist
      const container = document.querySelector('.container');
      if (container) {
        const hackingHTML = '<div class="hacking-panel"></div>';
        container.insertAdjacentHTML('beforeend', hackingHTML);
      }
    }
  },
  
  // Create objectives panel
  createObjectivesPanel() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    // Create objectives panel
    const objectivesHTML = '<div class="objectives-panel"></div>';
    container.insertAdjacentHTML('beforeend', objectivesHTML);
  },
  
  // Update debug info
  updateDebugInfo() {
    // Could add debug overlay
  },
  
  // Show/hide UI sections
  showSection(section) {
    if (this.visible[section] !== false) {
      this.visible[section] = true;
    }
  },
  
  hideSection(section) {
    if (this.visible[section] !== false) {
      this.visible[section] = false;
    }
  },
  
  // Handle game state changes
  onGameOver() {
    this.showGameOverScreen();
  },
  
  onVictory() {
    this.showVictoryScreen();
  },
  
  showGameOverScreen() {
    const gameOverScreen = document.querySelector('.game-over');
    if (!gameOverScreen) {
      this.createGameOverScreen();
    }
    gameOverScreen.classList.remove('hidden');
  },
  
  showVictoryScreen() {
    const victoryScreen = document.querySelector('.victory-screen');
    if (!victoryScreen) {
      this.createVictoryScreen();
    }
    victoryScreen.classList.remove('hidden');
  },
  
  createGameOverScreen() {
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    const gameOverHTML = `
      <div class="game-over screen">
        <h2>SYSTEM BREACH DETECTED</h2>
        <div class="game-score">FINAL SCORE: ${window.gameState?.score || 0}</div>
        <div class="game-restart">Press SPACE to restart</div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', gameOverHTML);
  },
  
  createVictoryScreen() {
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    const victoryHTML = `
      <div class="victory screen">
        <h2>MISSION COMPLETE</h2>
        <div class="victory-score">FINAL SCORE: ${window.gameState?.score || 0}</div>
        <div class="victory-restart">Press SPACE to continue</div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', victoryHTML);
  },
  
  // Clean up
  cleanup() {
    this.healthBar = null;
    this.objectivesPanel = null;
    this.rhythmPanel = null;
    this.hackingPanel = null;
  }
};