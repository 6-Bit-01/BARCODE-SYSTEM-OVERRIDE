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
    this.currentPuzzle = null;
    this.puzzleType = null;
    this.answer = null;
    this.inputText = '';
    this.displayTime = 0;
    this.maxDisplayTime = 2000; // 2 seconds max display
    this.puzzleComplete = false;
    this.puzzleTimeout = null;
    this.terminalLines = [];
    this.terminalHistory = [];
    this.cursorBlink = 0;
    
    // Tutorial integration
    this.tutorialMode = false;
    this.tutorialObjective = 'hack_start';
    this.tutorialCompleteObjective = 'hack_complete';
    
    // Track last result to prevent incorrect tutorial completion
    this._lastResultFailed = false;
    
    console.log('Terminal Hacking System initialized');
  }
  
  // Start hacking mode with a random puzzle
  start() {
    if (this.active) {
      console.log('Hacking already active, ignoring start request');
      return;
    }
    
    console.log('=== INITIATING TERMINAL HACK ===');
    
    // Clear any existing timeout first
    if (this.puzzleTimeout) {
      clearTimeout(this.puzzleTimeout);
      this.puzzleTimeout = null;
    }
    
    // Reset failure tracking for new attempt
    this._lastResultFailed = false;
    
    // Reset all state variables
    this.active = true;
    this.inputText = '';
    this.puzzleComplete = false;
    this.feedback = null;
    this.currentPuzzle = null;
    this.terminalLines = [];
    this.terminalHistory = [];
    
    // Initialize terminal with boot sequence
    this.initializeTerminal();
    
    // Randomly select puzzle type (1 or 2)
    this.puzzleType = Math.floor(Math.random() * 2) + 1;
    
    console.log(`Starting puzzle type ${this.puzzleType}`);
    
    // Generate puzzle based on type
    setTimeout(() => {
      switch(this.puzzleType) {
        case 1:
          this.generatePortPuzzle();
          break;
        case 2:
          this.generateMemoryPuzzle();
          break;
      }
    }, 1000);
    
    // Display time will be set per puzzle type
    this.displayTime = this.puzzleType === 2 ? 3000 : window.randomRange(1500, 2500);
    this.maxDisplayTime = this.displayTime + 500;
    
    setTimeout(() => {
      if (this.active && !this.puzzleComplete) {
        this.hidePuzzle();
      }
    }, this.displayTime);
    
    // Record start time for timeout tracking
    this._startTime = Date.now();
    
    // Auto-fail after 8 seconds if not solved
    this.puzzleTimeout = setTimeout(() => {
      if (this.active && !this.puzzleComplete) {
        this.timeoutFailPuzzle();
      }
    }, 8000);
    
    // Check tutorial objectives
    if (window.tutorialSystem && typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive()) {
      this.tutorialMode = true;
      this.tutorialObjective = 'hack_start';
      this.tutorialCompleteObjective = 'hack_complete';
      console.log('Tutorial mode: hacking objective active');
    }
  }
  
  // Initialize terminal with boot sequence
  initializeTerminal() {
    this.terminalLines = [
      '> INITIATING BARCODE NETWORK ACCESS...',
      '> AUTHENTICATING USER: 6_BIT',
      '> SCANNING NETWORK VULNERABILITIES...',
      '> ESTABLISHING SECURE CONNECTION...',
      '> ACCESS GRANTED - LOADING PUZZLE MATRIX...'
    ];
    
    this.terminalHistory = [...this.terminalLines];
  }
  
  // Puzzle Type 1: Port Status (OPEN/CLOSED) - Exactly 3 options
  generatePortPuzzle() {
    // Generate exactly 3 different port numbers
    const ports = [];
    const usedNumbers = new Set();
    
    for (let i = 0; i < 3; i++) {
      let portNum;
      do {
        const range = Math.floor(Math.random() * 4);
        switch(range) {
          case 0: portNum = Math.floor(window.randomRange(20, 100)); break;    // Standard ports
          case 1: portNum = Math.floor(window.randomRange(1024, 5000)); break; // User ports
          case 2: portNum = Math.floor(window.randomRange(8000, 9000)); break; // Alternative ports
          case 3: portNum = Math.floor(window.randomRange(49152, 65535)); break; // Dynamic ports
        }
      } while (usedNumbers.has(portNum));
      
      usedNumbers.add(portNum);
      ports.push({
        number: portNum,
        status: 'CLOSED'
      });
    }
    
    // Choose exactly 1 port to be OPEN
    const openIndex = Math.floor(Math.random() * 3);
    ports[openIndex].status = 'OPEN';
    
    // Create terminal display with clear formatting
    const portDisplay = ports.map((p, i) => {
      const status = p.status === 'OPEN' ? 'OPEN' : 'CLOSED';
      const color = p.status === 'OPEN' ? '#00ff00' : '#ff6600';
      return `PORT ${p.number}: ${status}`;
    }).join('\n');
    
    this.terminalLines.push('> SCAN RESULTS:');
    this.terminalLines.push('');
    
    // Add each port as a separate line with clear coloring in draw method
    ports.forEach((p, i) => {
      const status = p.status === 'OPEN' ? 'OPEN' : 'CLOSED';
      this.terminalLines.push(`  ${i + 1}. PORT ${p.number}: ${status}`);
    });
    
    this.terminalLines.push('');
    this.terminalLines.push('> WHICH PORT IS OPEN?');
    
    this.currentPuzzle = {
      type: 1,
      display: portDisplay,
      answer: ports[openIndex].number.toString(),
      ports: ports,
      openIndex: openIndex,
      displayTime: this.displayTime
    };
    
    console.log(`Port Puzzle: ${ports[openIndex].number} is OPEN, answer: ${this.currentPuzzle.answer}`);
  }
  
  // Puzzle Type 2: Memory Sequence (3-5 digits) - 3 second display
  generateMemoryPuzzle() {
    const codeLength = Math.floor(window.randomRange(3, 6)); // 3-5 digits
    let code = '';
    for (let i = 0; i < codeLength; i++) {
      code += Math.floor(window.randomRange(0, 10)).toString();
    }
    
    this.terminalLines.push('> MEMORY SEQUENCE TRANSMITTED:');
    this.terminalLines.push('');
    this.terminalLines.push(`     ${code}`); // Centered and spaced for visibility
    this.terminalLines.push('');
    this.terminalLines.push('> MEMORIZE CODE - 3 SECONDS');
    
    this.currentPuzzle = {
      type: 2,
      display: code,
      answer: code,
      displayTime: 3000 // Fixed 3 seconds
    };
    
    // Override display time to 3 seconds for memory puzzles
    this.displayTime = 3000;
    this.maxDisplayTime = 3500;
    
    console.log(`Memory Puzzle: ${codeLength}-digit code: ${code} (display for 3 seconds)`);
  }
  
  // Hide puzzle display after timeout
  hidePuzzle() {
    if (this.currentPuzzle) {
      this.currentPuzzle.hidden = true;
      
      // Update terminal to show puzzle is hidden
      if (this.puzzleType === 1) {
        this.terminalLines = [
          '> PORT SCAN HIDDEN',
          '> MEMORY RETENTION REQUIRED',
          '> WHICH PORT WAS OPEN?',
          '> INPUT PORT NUMBER:'
        ];
      } else {
        this.terminalLines = [
          '> MEMORY SEQUENCE HIDDEN',
          '> MEMORY RETENTION REQUIRED',
          '> WHAT WAS THE CODE?',
          '> INPUT MEMORY SEQUENCE:'
        ];
      }
      
      console.log('Puzzle hidden - player must answer from memory');
    }
  }
  
  // Process keyboard input
  processInput(key) {
    if (!this.active || this.puzzleComplete) return;
    
    // Handle Enter key
    if (key === 'Enter') {
      this.checkAnswer();
      return;
    }
    
    // Handle Backspace
    if (key === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
      return;
    }
    
    // Handle Escape to cancel
    if (key === 'Escape') {
      this.cancel();
      return;
    }
    
    // Only accept digits for input
    if (key.length === 1 && /[0-9]/.test(key)) {
      this.inputText += key;
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
    
    if (isCorrect) {
      this.successPuzzle();
    } else {
      this.failPuzzle();
    }
  }
  
  // Handle successful puzzle
  successPuzzle() {
    this.puzzleComplete = true;
    this.active = false;
    
    // Clear timeout
    if (this.puzzleTimeout) {
      clearTimeout(this.puzzleTimeout);
      this.puzzleTimeout = null;
    }
    
    // Update terminal with success message
    this.terminalLines = [
      '> ACCESS GRANTED',
      '> AUTHENTICATION SUCCESSFUL',
      '> NETWORK BREACH ACHIEVED',
      '> SIGNAL STRENGTH RESTORED',
      '> TERMINATING SESSION...'
    ];
    
    console.log(`✓ Terminal hack successful! Answer: ${this.currentPuzzle.answer}`);
    
    // Mark last result as successful
    this._lastResultFailed = false;
    
    // Play terminal success beep
    if (window.audioSystem) {
      window.audioSystem.playSound('terminalBeep', 0.5);
    }
    
    // Restore 1 health bar for successful hack
    if (window.player && typeof window.player.restoreHealth === 'function') {
      const wasHealthRestored = window.player.restoreHealth(1);
      if (wasHealthRestored) {
        console.log('✓ Signal strength restored by 1 bar for successful hack');
      }
    }
    
    // Tutorial completion check
    if (this.tutorialMode && window.tutorialSystem) {
      console.log('🔐 HACKING PUZZLE SOLVED - checking tutorial objectives');
      console.log('🔐 Tutorial system active:', window.tutorialSystem.isActive());
      console.log('🔐 Current chapter:', window.tutorialSystem.storyChapter);
      console.log('🔐 Completed objectives before:', Array.from(window.tutorialSystem.completedObjectives));
      
      // CRITICAL: Complete hack_start objective first
      if (this.tutorialObjective === 'hack_start') {
        console.log('🔐 === COMPLETING hack_start OBJECTIVE ===');
        
        if (typeof window.tutorialSystem.checkObjective === 'function') {
          console.log('🔐 Calling checkObjective for hack_start');
          window.tutorialSystem.checkObjective('hack_start');
        }
        
        // MULTIPLE FALLBACKS - ensure completion
        setTimeout(() => {
          console.log('🔐 FALLBACK 1: Checking hack_start completion status');
          if (!window.tutorialSystem.completedObjectives.has('hack_start')) {
            console.log('🔐 FALLBACK 1: Adding hack_start to completed set');
            window.tutorialSystem.completedObjectives.add('hack_start');
          }
          
          const hackStartObj = window.tutorialSystem.objectives.find(obj => obj.id === 'hack_start');
          if (hackStartObj && !hackStartObj.completed) {
            console.log('🔐 FALLBACK 1: Marking hack_start as completed in array');
            hackStartObj.completed = true;
          }
          
          console.log('🔐 FALLBACK 1: hack_start completion status:', window.tutorialSystem.completedObjectives.has('hack_start'));
        }, 100);
        
        setTimeout(() => {
          console.log('🔐 FALLBACK 2: Double-checking hack_start completion');
          if (!window.tutorialSystem.completedObjectives.has('hack_start')) {
            console.log('🔐 FALLBACK 2: Final forced completion of hack_start');
            window.tutorialSystem.completedObjectives.add('hack_start');
            const finalHackStartObj = window.tutorialSystem.objectives.find(obj => obj.id === 'hack_start');
            if (finalHackStartObj) {
              finalHackStartObj.completed = true;
            }
          }
        }, 500);
      }
      
      // CRITICAL: Complete hack_complete objective ONLY ON SUCCESS
      if (this.tutorialCompleteObjective === 'hack_complete') {
        console.log('🔐 === COMPLETING hack_complete OBJECTIVE (SUCCESSFUL HACK) ===');
        console.log('🔐 This should only be called for successful hacks!');
        
        if (typeof window.tutorialSystem.checkObjective === 'function') {
          console.log('🔐 Calling checkObjective for hack_complete (SUCCESS)');
          window.tutorialSystem.checkObjective('hack_complete');
        }
        
        // MULTIPLE FALLBACKS - ensure completion
        setTimeout(() => {
          console.log('🔐 FALLBACK 1: Checking hack_complete completion status (SUCCESS)');
          if (!window.tutorialSystem.completedObjectives.has('hack_complete')) {
            console.log('🔐 FALLBACK 1: Adding hack_complete to completed set (SUCCESS)');
            window.tutorialSystem.completedObjectives.add('hack_complete');
          }
          
          const hackCompleteObj = window.tutorialSystem.objectives.find(obj => obj.id === 'hack_complete');
          if (hackCompleteObj && !hackCompleteObj.completed) {
            console.log('🔐 FALLBACK 1: Marking hack_complete as completed in array (SUCCESS)');
            hackCompleteObj.completed = true;
          }
          
          console.log('🔐 FALLBACK 1: hack_complete completion status (SUCCESS):', window.tutorialSystem.completedObjectives.has('hack_complete'));
        }, 150);
        
        setTimeout(() => {
          console.log('🔐 FALLBACK 2: Double-checking hack_complete completion (SUCCESS)');
          if (!window.tutorialSystem.completedObjectives.has('hack_complete')) {
            console.log('🔐 FALLBACK 2: Final forced completion of hack_complete (SUCCESS)');
            window.tutorialSystem.completedObjectives.add('hack_complete');
            const finalHackCompleteObj = window.tutorialSystem.objectives.find(obj => obj.id === 'hack_complete');
            if (finalHackCompleteObj) {
              finalHackCompleteObj.completed = true;
            }
          }
        }, 600);
      }
      
      // CRITICAL: Log final status
      setTimeout(() => {
        console.log('🔐 FINAL STATUS - Completed objectives after hack:', Array.from(window.tutorialSystem.completedObjectives));
        console.log('🔐 FINAL STATUS - Objective array states:', window.tutorialSystem.objectives.map(obj => ({id: obj.id, text: obj.text, completed: obj.completed})));
      }, 1000);
      
      this.tutorialMode = false;
      this.tutorialObjective = null;
      this.tutorialCompleteObjective = null;
    }
    
    // Show success feedback
    this.showSuccessFeedback();
  }
  
  // Handle failed puzzle
  failPuzzle() {
    this.puzzleComplete = true;
    this.active = false;
    
    // Clear timeout
    if (this.puzzleTimeout) {
      clearTimeout(this.puzzleTimeout);
      this.puzzleTimeout = null;
    }
    
    // Update terminal with failure message
    this.terminalLines = [
      '> ACCESS DENIED',
      '> AUTHENTICATION FAILED',
      '> NETWORK BREACH ATTEMPTED',
      '> INTRUCTION DETECTED',
      '> TERMINATING SESSION...'
    ];
    
    console.log(`✗ Terminal hack failed! Input: "${this.inputText}", Expected: "${this.currentPuzzle.answer}"`);
    
    // Play terminal buzz sound
    if (window.audioSystem) {
      window.audioSystem.playSound('terminalBuzz', 0.3);
    }
    
    // Show failure feedback
    this.showFailureFeedback();
    
    // CRITICAL: DO NOT complete tutorial objectives on failure
    console.log('🔐 HACK FAILED - tutorial objectives NOT completed');
    if (this.tutorialMode && window.tutorialSystem) {
      console.log('🔐 Tutorial mode active but hack failed - no objective completion');
    }
    
    // Mark last result as failed
    this._lastResultFailed = true;
  }
  
  // Cancel hacking mode
  cancel() {
    this.active = false;
    this.puzzleComplete = true;
    
    // Clear timeout
    if (this.puzzleTimeout) {
      clearTimeout(this.puzzleTimeout);
      this.puzzleTimeout = null;
    }
    
    // Update terminal with cancel message
    this.terminalLines = [
      '> SESSION CANCELLED BY USER',
      '> TERMINATING CONNECTION...',
      '> NETWORK ACCESS REVOKED'
    ];
    
    console.log('Terminal hack cancelled by player');
    
    // CRITICAL: DO NOT complete tutorial objectives on cancel
    if (this.tutorialMode && window.tutorialSystem) {
      console.log('🔐 Tutorial mode active but hack cancelled - no objective completion');
    }
    
    // Mark last result as failed
    this._lastResultFailed = true;
  }
  
  // Show success feedback
  showSuccessFeedback() {
    this.feedback = {
      type: 'success',
      text: 'ACCESS GRANTED',
      opacity: 1.0,
      timer: 60
    };
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
    if (this.puzzleTimeout) {
      clearTimeout(this.puzzleTimeout);
      this.puzzleTimeout = null;
    }
    
    // Update terminal with timeout error message
    this.terminalLines = [
      '> SIGNAL TIMEOUT',
      '> CONNECTION LOST',
      '> TRY AGAIN',
      '> TERMINATING SESSION...'
    ];
    
    console.log('✗ Terminal hack timed out after 8 seconds');
    
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
      const remaining = Math.max(0, Math.ceil((8000 - elapsed) / 1000));
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
    this.currentPuzzle = null;
    this.puzzleType = null;
    this.answer = null;
    this.inputText = '';
    this.puzzleComplete = false;
    this.feedback = null;
    this.terminalLines = [];
    this.terminalHistory = [];
    
    if (this.puzzleTimeout) {
      clearTimeout(this.puzzleTimeout);
      this.puzzleTimeout = null;
    }
    
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