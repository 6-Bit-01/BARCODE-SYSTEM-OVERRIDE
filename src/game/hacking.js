// Terminal-Style Hacking System for BARCODE: System Override
// Features port puzzles (OPEN/CLOSED) and memorization challenges (3-5 digits)
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/hacking.js',
  exports: ['HackingSystem', 'hackingSystem'],
  dependencies: ['randomRange', 'clamp']
});

window.HackingSystem = class HackingSystem {
  constructor() {
    this.active = false;
    this.cooldownUntil = 0;
    this.guardHitsRemaining = 0;
    this.previousRhythmModeActive = false;
    this.suspendedRhythmMode = false;
    this._startTime = 0;
    this.puzzleReadyAt = 0;
    this.currentPuzzle = null;
    this.puzzleType = null;
    this.answer = null;
    this.inputText = '';
    this.displayTime = 0;
    this.maxDisplayTime = 2000; // 2 seconds max display
    this.puzzleComplete = false;
    this.puzzleTimeout = null;
    this.ownedTimeouts = new Set();
    this.runGeneration = 0;
    this.terminalLines = [];
    this.terminalHistory = [];
    this.cursorBlink = 0;
    
    // Tutorial integration
    this.tutorialMode = false;
    this.tutorialObjective = 'hack_start';
    this.tutorialCompleteObjective = 'hack_complete';
    
    // Track last result to prevent incorrect tutorial completion
    this._lastResultFailed = false;
    this.cooldownMs = 10000;
    this.overridePulseRadius = 520;
    
    console.log('Terminal Hacking System initialized');
  }
  
  trackTimeout(callback, delay) {
    const generation = this.runGeneration;
    const handle = setTimeout(() => {
      this.ownedTimeouts.delete(handle);
      if (generation === this.runGeneration) callback();
    }, delay);
    this.ownedTimeouts.add(handle);
    return handle;
  }

  clearOwnedTimeouts() {
    this.ownedTimeouts.forEach(handle => clearTimeout(handle));
    this.ownedTimeouts.clear();
    this.puzzleTimeout = null;
  }

  beginAnswerWindow() {
    if (!this.active || this.puzzleComplete || !this.currentPuzzle) return;
    if (this.puzzleTimeout) clearTimeout(this.puzzleTimeout);
    this.puzzleTimeout = null;
    this.puzzleReadyAt = Date.now();
    this._startTime = this.puzzleReadyAt;
    this.puzzleTimeout = this.trackTimeout(() => {
      if (this.active && !this.puzzleComplete) this.timeoutFailPuzzle();
    }, 4000);
  }

  restoreSuspendedRhythmMode() {
    const shouldRestore = !!(this.suspendedRhythmMode && this.previousRhythmModeActive);
    if (shouldRestore) {
      if (window.rhythmSystem?.showRhythmMode) window.rhythmSystem.showRhythmMode();
      else if (window.rhythmSystem?.show) window.rhythmSystem.show();
    }
    this.previousRhythmModeActive = false;
    this.suspendedRhythmMode = false;
    return shouldRestore;
  }

  getDiagnostics() {
    return { active: !!this.active, ownedTimeouts: this.ownedTimeouts.size, hasPuzzleTimeout: !!this.puzzleTimeout, runGeneration: this.runGeneration };
  }


  initializeTerminal() {
    this.terminalLines = ['> BARCODE NETWORK TERMINAL', '> SYNCING SIGNAL...', '> AUTH REQUIRED'];
  }

  generatePortPuzzle() {
    const port = 1000 + Math.floor(Math.random() * 9000);
    const open = Math.random() >= 0.5;
    this.currentPuzzle = { question: `PORT ${port}: ${open ? 'OPEN' : 'CLOSED'}`, answer: open ? 'OPEN' : 'CLOSED' };
    this.answer = this.currentPuzzle.answer;
    this.terminalLines.push(`> ${this.currentPuzzle.question}`);
    this.terminalLines.push('> TYPE OPEN OR CLOSED');
    return this.currentPuzzle;
  }

  generateMemoryPuzzle() {
    const code = String(100 + Math.floor(Math.random() * 900));
    this.currentPuzzle = { question: `CODE ${code}`, answer: code };
    this.answer = code;
    this.terminalLines.push(`> ${this.currentPuzzle.question}`);
    this.terminalLines.push('> REPEAT CODE');
    return this.currentPuzzle;
  }

  hidePuzzle() {
    if (!this.currentPuzzle) return;
    this.terminalLines.push('> INPUT WINDOW ACTIVE');
  }

  processInput(input) {
    if (!this.active) return;
    const value = String(input || '').toUpperCase();
    if (value === 'ENTER') return this.checkAnswer();
    if (value === 'BACKSPACE') { this.inputText = this.inputText.slice(0, -1); return; }
    if (value === 'H' && this.inputText.length === 0) return;
    if (/^[A-Z0-9]$/.test(value)) this.inputText += value;
    if (this.currentPuzzle && this.inputText.length >= String(this.currentPuzzle.answer).length) this.checkAnswer();
  }

  // Start hacking mode with a random puzzle
  start() {
    if (this.active) { console.log('Hacking already active, ignoring start request'); return; }
    const tutorialActive = window.tutorialSystem && typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive();
    if (!tutorialActive && Date.now() < this.cooldownUntil) { console.log('Hacking cooldown active'); return; }
    if (window.player && window.player.grounded === false) { console.log('Hacking requires ground/support'); return; }
    if (window.sector1Progression?.isGameplaySuppressed?.()) { console.log('Hacking suppressed by cinematic'); return; }

    console.log('=== INITIATING TERMINAL HACK ===');
    this.runGeneration++;
    this.clearOwnedTimeouts();
    this._lastResultFailed = false;
    this.active = true;
    this.inputText = '';
    this.puzzleComplete = false;
    this.feedback = null;
    this.currentPuzzle = null;
    this.terminalLines = [];
    this.terminalHistory = [];
    this.guardHitsRemaining = 1;
    this.puzzleReadyAt = 0;
    this._startTime = 0;
    this.suspendedRhythmMode = false;
    this.previousRhythmModeActive = !!(window.rhythmSystem?.isActive?.());
    if (this.previousRhythmModeActive) {
      if (window.rhythmSystem?.hideRhythmMode) window.rhythmSystem.hideRhythmMode();
      else if (window.rhythmSystem?.hide) window.rhythmSystem.hide();
      this.suspendedRhythmMode = true;
    }

    this.initializeTerminal();
    this.puzzleType = Math.floor(Math.random() * 2) + 1;
    this.displayTime = this.puzzleType === 2 ? 3000 : window.randomRange(1500, 2500);
    this.maxDisplayTime = this.displayTime + 500;

    this.trackTimeout(() => {
      if (!this.active || this.puzzleComplete) return;
      switch(this.puzzleType) {
        case 1: this.generatePortPuzzle(); break;
        case 2: this.generateMemoryPuzzle(); break;
      }
      if (this.puzzleType === 2) {
        this.puzzleReadyAt = 0;
        this._startTime = 0;
        this.trackTimeout(() => {
          if (!this.active || this.puzzleComplete) return;
          this.hidePuzzle();
          this.beginAnswerWindow();
        }, this.displayTime);
      } else {
        this.beginAnswerWindow();
      }
    }, 1000);

    if (window.tutorialSystem && typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive()) {
      this.tutorialMode = true;
      this.tutorialObjective = 'hack_start';
      this.tutorialCompleteObjective = 'hack_complete';
      console.log('Tutorial mode: hacking objective active');
    }
  }

  // Check if answer is correct
  checkAnswer() {
    if (!this.currentPuzzle || !this.currentPuzzle.answer) return;
    const isCorrect = this.inputText === this.currentPuzzle.answer;
    console.log('=== VERIFYING INPUT ===');
    console.log('User input:', this.inputText);
    console.log('Expected answer:', this.currentPuzzle.answer);
    console.log('Result:', isCorrect ? 'ACCEPTED' : 'REJECTED');
    if (isCorrect) this.successPuzzle(); else this.failPuzzle();
  }

  completeTutorialObjectivesOnSuccess() {
    if (!this.tutorialMode || !window.tutorialSystem) return;
    if (typeof window.tutorialSystem.checkObjective === 'function') {
      window.tutorialSystem.checkObjective('hack_start');
      window.tutorialSystem.checkObjective('hack_complete');
    }
    if (window.tutorialSystem.completedObjectives) {
      window.tutorialSystem.completedObjectives.add('hack_start');
      window.tutorialSystem.completedObjectives.add('hack_complete');
    }
    if (Array.isArray(window.tutorialSystem.objectives)) {
      window.tutorialSystem.objectives.forEach(obj => { if (obj.id === 'hack_start' || obj.id === 'hack_complete') obj.completed = true; });
    }
  }

  // Handle successful puzzle
  successPuzzle() {
    if (!this.active) return;
    this.puzzleComplete = true;
    this.active = false;
    this.runGeneration++;
    this.clearOwnedTimeouts();
    this.terminalLines = ['> ACCESS GRANTED', '> AUTHENTICATION SUCCESSFUL', '> NETWORK BREACH ACHIEVED', '> SIGNAL STRENGTH RESTORED', '> TERMINATING SESSION...'];
    console.log(`✓ Terminal hack successful! Answer: ${this.currentPuzzle?.answer}`);
    this._lastResultFailed = false;
    if (window.audioSystem) window.audioSystem.playSound('terminalBeep', 0.5);
    if (window.player && typeof window.player.restoreHealth === 'function') window.player.restoreHealth(1);
    this.completeTutorialObjectivesOnSuccess();
    this.finishTacticalFocus(true);
    this.tutorialMode = false;
    this.tutorialObjective = null;
    this.tutorialCompleteObjective = null;
    this.showSuccessFeedback();
  }

  finishTacticalFocus(success) {
    this.cooldownUntil = Date.now() + this.cooldownMs;
    this.guardHitsRemaining = 0;
    this._startTime = 0;
    this.puzzleReadyAt = 0;
    this.restoreSuspendedRhythmMode();
    if (success) this.emitOverridePulse();
  }

  absorbGuardHit() {
    if (!this.active || this.guardHitsRemaining <= 0) return false;
    this.guardHitsRemaining -= 1;
    this.feedback = { text: 'SIGNAL GUARD ABSORBED', type: 'success', timer: 45, opacity: 1 };
    return true;
  }

  emitOverridePulse() {
    const beatMs = window.rhythmSystem?.beatInterval || 500;
    const stunMs = beatMs * 4;
    const now = window.enemyManager?.simulationTimeMs || 0;
    const player = window.player;
    (window.enemyManager?.enemies || []).forEach(enemy => {
      if (!enemy || !enemy.active || enemy.type === 'broadcast_jammer' || enemy.type === 'boss' || enemy.canReceiveDamage === false) return;
      if (player?.position && enemy.position && window.distance && window.distance(player.position.x, player.position.y, enemy.position.x, enemy.position.y) > this.overridePulseRadius) return;
      enemy._stunnedUntilMs = now + stunMs;
    });
  }

  failPuzzle() {
    if (!this.active) return;
    this.puzzleComplete = true;
    this.active = false;
    this.runGeneration++;
    this.clearOwnedTimeouts();
    this.terminalLines = ['> ACCESS DENIED', '> AUTHENTICATION FAILED', '> NETWORK BREACH ATTEMPTED', '> INTRUSION DETECTED', '> TERMINATING SESSION...'];
    console.log(`✗ Terminal hack failed! Input: "${this.inputText}", Expected: "${this.currentPuzzle?.answer}"`);
    if (window.audioSystem) window.audioSystem.playSound('terminalBuzz', 0.3);
    this.finishTacticalFocus(false);
    this.showFailureFeedback();
    this._lastResultFailed = true;
  }

  cancel() {
    if (!this.active) return;
    this.active = false;
    this.puzzleComplete = true;
    this.runGeneration++;
    this.clearOwnedTimeouts();
    this.finishTacticalFocus(false);
    this.terminalLines = ['> SESSION CANCELLED BY USER', '> TERMINATING CONNECTION...', '> NETWORK ACCESS REVOKED'];
    console.log('Terminal hack cancelled by player');
    this._lastResultFailed = true;
  }

  showSuccessFeedback() {
    this.feedback = { type: 'success', text: 'ACCESS GRANTED', opacity: 1.0, timer: 60 };
  }

  // Show failure feedback
  showFailureFeedback() {
    this.feedback = {
      type: 'failure',
      text: 'ACCESS DENIED',
      opacity: 1.0,
      timer: 60
    };
  }
  
  // Handle timeout-specific failure
  timeoutFailPuzzle() {
    this.puzzleComplete = true;
    this.active = false;
    
    // Clear timeout
    this.runGeneration++;
    this.clearOwnedTimeouts();
    this.finishTacticalFocus(false);
    
    // Update terminal with timeout error message
    this.terminalLines = [
      '> SIGNAL TIMEOUT',
      '> CONNECTION LOST',
      '> TRY AGAIN',
      '> TERMINATING SESSION...'
    ];
    
    console.log('✗ Terminal hack timed out after 4 seconds');
    
    // Play terminal buzz sound
    if (window.audioSystem) {
      window.audioSystem.playSound('terminalBuzz', 0.3);
    }
    
    // Show timeout-specific failure feedback in red
    this.showTimeoutFeedback();
    
    // CRITICAL: DO NOT complete tutorial objectives on timeout
    console.log('🔐 HACK TIMED OUT - tutorial objectives NOT completed');
    if (this.tutorialMode && window.tutorialSystem) {
      console.log('🔐 Tutorial mode active but hack timed out - no objective completion');
    }
    
    // Mark last result as failed
    this._lastResultFailed = true;
  }
  
  // Show timeout-specific feedback
  showTimeoutFeedback() {
    // Create a global timeout message that will display on screen
    window.hackTimeoutMessage = {
      text: 'SIGNAL TIMEOUT - TRY AGAIN',
      timer: 120, // 2 seconds at 60fps
      opacity: 1.0
    };
  }
  
  // Update feedback and cursor
  update(deltaTime) {
    // Update feedback timer
    if (this.feedback && this.feedback.timer > 0) {
      this.feedback.timer--;
      this.feedback.opacity = this.feedback.timer / 60;
      
      if (this.feedback.timer <= 0) {
        this.feedback = null;
      }
    }
    
    // Update cursor blink
    this.cursorBlink = (this.cursorBlink + 1) % 60;
  }
  
  // Draw terminal interface
  draw(ctx) {
    // Draw feedback if it exists (even when inactive)
    if (this.feedback) {
      ctx.save();
      
      ctx.globalAlpha = this.feedback.opacity;
      if (this.feedback.type === 'success') {
        ctx.fillStyle = '#00ff00';
      } else if (this.feedback.type === 'timeout') {
        ctx.fillStyle = '#ff0000'; // Red for timeout message
      } else {
        ctx.fillStyle = '#ff0000'; // Red for regular failures
      }
      ctx.font = 'bold 48px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(this.feedback.text, 960, 540);
      
      ctx.restore();
      return; // Show feedback on top, don't draw terminal underneath
    }
    
    // Only draw terminal if system is active
    if (!this.active) return;
    
    ctx.save();
    
    // Terminal background - smaller window
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(400, 200, 1120, 440); // Smaller terminal window
    
    // Add subtle scanline effect
    ctx.fillStyle = 'rgba(0, 255, 0, 0.02)';
    for (let y = 200; y < 640; y += 2) {
      ctx.fillRect(400, y, 1120, 1);
    }
    
    // Terminal border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(400, 200, 1120, 440);
    
    // Terminal title
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('BARCODE NETWORK TERMINAL v3.7', 420, 230);
    
    // Terminal status
    const status = this.active ? 'CONNECTED' : 'DISCONNECTED';
    const statusColor = this.active ? '#00ff00' : '#ff0000';
    ctx.fillStyle = statusColor;
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`STATUS: ${status}`, 1500, 230);
    
    // Show timer when active
    if (this.active && this._startTime) {
      const elapsed = Date.now() - this._startTime;
      const remaining = Math.max(0, Math.ceil((4000 - elapsed) / 1000));
      ctx.fillStyle = remaining <= 3 ? '#ff0000' : '#ffff00';
      ctx.font = '12px monospace';
      ctx.fillText(`TIME: ${remaining}s`, 1500, 250);
    }
    
    // Terminal content area
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    
    const startY = 270;
    const lineHeight = 22;
    const maxLines = 12;
    
    // Draw terminal lines
    const linesToShow = Math.min(this.terminalLines.length, maxLines);
    for (let i = 0; i < linesToShow; i++) {
      const y = startY + (i * lineHeight);
      
      // Add subtle glow effect
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 2;
      
      // Special handling for port puzzles - color based on status
      if (this.currentPuzzle && this.currentPuzzle.type === 1 && this.currentPuzzle.ports) {
        // Check if this line contains port information
        const portMatch = this.terminalLines[i].match(/\s+(\d+)\.\s+PORT\s+(\d+):\s+(OPEN|CLOSED)/);
        if (portMatch) {
          const status = portMatch[3];
          if (status === 'OPEN') {
            ctx.fillStyle = '#00ff00'; // Green for OPEN
            ctx.font = 'bold 24px monospace'; // Larger font for ports
          } else {
            ctx.fillStyle = '#ff6600'; // Orange for CLOSED
            ctx.font = '20px monospace'; // Smaller font for closed ports
          }
        } else {
          ctx.fillStyle = '#00ff00';
          ctx.font = '16px monospace';
        }
      } else if (this.currentPuzzle && this.currentPuzzle.type === 2 && this.terminalLines[i].match(/^\s+\d+$/)) {
        // Memory code display - large and yellow
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 36px monospace'; // Very large for memory codes
      } else if (this.terminalLines[i].includes('ERROR') || this.terminalLines[i].includes('DENIED')) {
        ctx.fillStyle = '#ff0000';
        ctx.font = '16px monospace';
      } else if (this.terminalLines[i].includes('GRANTED') || this.terminalLines[i].includes('SUCCESS')) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px monospace';
      } else if (this.terminalLines[i].includes('MEMORIZE')) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 18px monospace';
      } else {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px monospace';
      }
      
      ctx.fillText(this.terminalLines[i], 420, y);
    }
    
    // Input area
    const inputY = startY + (maxLines * lineHeight) + 20;
    
    // Input prompt
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('> ', 420, inputY);
    
    // User input - larger font for better visibility
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(this.inputText, 450, inputY);
    
    // Cursor - larger for better visibility
    if (this.cursorBlink < 30) {
      ctx.fillStyle = '#00ff00';
      const cursorX = 450 + ctx.measureText(this.inputText).width;
      ctx.fillRect(cursorX, inputY - 20, 12, 28); // Larger cursor to match bigger font
    }
    
    // Controls help
    const helpY = inputY + 40;
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.globalAlpha = 0.7;
    ctx.fillText('[ENTER] Submit | [ESC] Cancel | [0-9] Input', 420, helpY);
    
    // Add random terminal artifacts for atmosphere
    if (Math.random() > 0.98) {
      const artifactX = Math.random() * 1920;
      const artifactY = Math.random() * 1080;
      const artifactChar = String.fromCharCode(33 + Math.floor(Math.random() * 94));
      
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.font = '12px monospace';
      ctx.fillText(artifactChar, artifactX, artifactY);
    }
    
    ctx.restore();
  }
  
  // Getters for game state
  isActive() { return this.active; }
  isComplete() { return this.puzzleComplete; }
  getCurrentType() { return this.puzzleType; }
  
  // Reset system
  reset() {
    console.log('=== TERMINAL SYSTEM RESET ===');
    
    this.active = false;
    this.cooldownUntil = 0;
    this.guardHitsRemaining = 0;
    this.restoreSuspendedRhythmMode();
    this._startTime = 0;
    this.puzzleReadyAt = 0;
    this.currentPuzzle = null;
    this.puzzleType = null;
    this.answer = null;
    this.inputText = '';
    this.puzzleComplete = false;
    this.feedback = null;
    this.terminalLines = [];
    this.terminalHistory = [];
    
    this.runGeneration++;
    this.clearOwnedTimeouts();
    
    this.tutorialMode = false;
    this.tutorialObjective = null;
    this.tutorialCompleteObjective = null;
    
    // Reset failure tracking
    this._lastResultFailed = false;
    
    console.log('Terminal hacking system reset complete');
  }
};

// Create global hacking system instance
function createHackingSystem() {
  if (window.hackingSystem) {
    return;
  }
  if (window.randomRange && window.clamp) {
    window.hackingSystem = new window.HackingSystem();
    console.log('Terminal Hacking System created');
  } else {
    console.warn('Hacking system dependencies not ready, retrying...');
    setTimeout(createHackingSystem, 100);
  }
}

// Initialize when dependencies are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createHackingSystem);
} else {
  createHackingSystem();
}
