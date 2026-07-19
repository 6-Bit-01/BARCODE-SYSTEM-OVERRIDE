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
    this.phase = 'idle';
    this.phaseElapsedMs = 0;
    this.sessionElapsedMs = 0;
    this.bootDurationMs = 1000;
    this.answerDurationMs = 4000;
    this.hardMaxSessionMs = 12000;
    this.cooldownUntil = 0;
    this.cooldownMs = 10000;
    this.guardHitsRemaining = 0;
    this.previousRhythmModeActive = false;
    this.suspendedRhythmMode = false;
    this._startTime = 0;
    this.puzzleReadyAt = 0;
    this.currentPuzzle = null;
    this.puzzleType = null;
    this.answer = null;
    this.inputText = '';
    this.displayTime = 2000;
    this.maxDisplayTime = 2500;
    this.puzzleComplete = false;
    // Kept for lifecycle diagnostics. A hack session deliberately owns no
    // browser timers; every phase advances from update(deltaTime).
    this.puzzleTimeout = null;
    this.ownedTimeouts = new Set();
    this.runGeneration = 0;
    this.terminalLines = [];
    this.terminalHistory = [];
    this.cursorBlink = 0;
    this.feedback = null;
    this.tutorialMode = false;
    this.tutorialObjective = 'hack_start';
    this.tutorialCompleteObjective = 'hack_complete';
    this._lastResultFailed = false;
    this.overridePulseRadius = 520;
    console.log('Terminal Hacking System initialized');
  }

  // Compatibility helpers for the runtime lifecycle audit. Session phases do
  // not call trackTimeout; creation retries outside a session remain external.
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

  safeInvoke(label, callback) {
    try {
      return callback();
    } catch (error) {
      console.warn(`[hacking] ${label} failed:`, error?.message || error);
      return undefined;
    }
  }

  restoreSuspendedRhythmMode() {
    const shouldRestore = !!(this.suspendedRhythmMode && this.previousRhythmModeActive);
    try {
      if (shouldRestore) {
        if (window.rhythmSystem?.showRhythmMode) window.rhythmSystem.showRhythmMode();
        else if (window.rhythmSystem?.show) window.rhythmSystem.show();
      }
    } catch (error) {
      console.warn('[hacking] Rhythm Mode restoration failed:', error?.message || error);
    } finally {
      // These flags are session ownership. They must never survive cleanup,
      // even if a collaborator throws while being restored.
      this.previousRhythmModeActive = false;
      this.suspendedRhythmMode = false;
    }
    return shouldRestore;
  }

  getDiagnostics() {
    return {
      active: !!this.active,
      phase: this.phase,
      sessionElapsedMs: this.sessionElapsedMs,
      ownedTimeouts: this.ownedTimeouts.size,
      hasPuzzleTimeout: !!this.puzzleTimeout,
      runGeneration: this.runGeneration
    };
  }

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

  generatePortPuzzle() {
    const ranges = [[20, 99], [1024, 4999], [8000, 8999], [49152, 65535]];
    const startRange = Math.floor(Math.random() * ranges.length);
    const ports = ranges.slice(0, 3).map((unused, index) => {
      const range = ranges[(startRange + index) % ranges.length];
      const number = Math.max(range[0], Math.min(range[1], Math.floor(window.randomRange(range[0], range[1] + 1))));
      return { number, status: 'CLOSED' };
    });
    const openIndex = Math.floor(Math.random() * ports.length);
    ports[openIndex].status = 'OPEN';

    this.terminalLines.push('> SCAN RESULTS:', '');
    ports.forEach((port, index) => this.terminalLines.push(`  ${index + 1}. PORT ${port.number}: ${port.status}`));
    this.terminalLines.push('', '> WHICH PORT IS OPEN?');

    this.currentPuzzle = {
      type: 1,
      display: ports.map(port => `PORT ${port.number}: ${port.status}`).join('\n'),
      answer: String(ports[openIndex].number),
      ports,
      openIndex,
      hidden: false,
      displayTime: this.displayTime
    };
    this.answer = this.currentPuzzle.answer;
    return this.currentPuzzle;
  }

  generateMemoryPuzzle() {
    const codeLength = Math.max(3, Math.min(5, Math.floor(window.randomRange(3, 6))));
    let code = '';
    for (let index = 0; index < codeLength; index++) {
      code += String(Math.max(0, Math.min(9, Math.floor(window.randomRange(0, 10)))));
    }
    this.displayTime = 3000;
    this.maxDisplayTime = 3500;
    this.terminalLines.push('> MEMORY SEQUENCE TRANSMITTED:', '', `     ${code}`, '', '> MEMORIZE CODE - 3 SECONDS');
    this.currentPuzzle = { type: 2, display: code, answer: code, hidden: false, displayTime: this.displayTime };
    this.answer = code;
    return this.currentPuzzle;
  }

  hidePuzzle() {
    if (!this.currentPuzzle) return false;
    this.currentPuzzle.hidden = true;
    this.currentPuzzle.display = null;
    this.terminalLines = this.puzzleType === 1
      ? ['> PORT SCAN HIDDEN', '> MEMORY RETENTION REQUIRED', '> WHICH PORT WAS OPEN?', '> INPUT PORT NUMBER:']
      : ['> MEMORY SEQUENCE HIDDEN', '> MEMORY RETENTION REQUIRED', '> WHAT WAS THE CODE?', '> INPUT MEMORY SEQUENCE:'];
    return true;
  }

  beginAnswerWindow(readyAt = this.sessionElapsedMs) {
    if (!this.active || this.puzzleComplete || !this.currentPuzzle) return false;
    this.hidePuzzle();
    this.phase = 'answer';
    this.phaseElapsedMs = 0;
    this.puzzleReadyAt = readyAt;
    this._startTime = readyAt;
    return true;
  }

  processInput(key) {
    if (!this.active || this.puzzleComplete) return false;
    const value = String(key || '');
    if (value === 'Escape' || value === 'ESC') {
      this.cancel();
      return true;
    }
    // The display is part of the puzzle. It cannot also be an input buffer.
    if (this.phase !== 'answer') return false;
    if (value === 'Enter') {
      this.checkAnswer();
      return true;
    }
    if (value === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
      return true;
    }
    if (value.length === 1 && /[0-9]/.test(value)) {
      const maxLength = String(this.currentPuzzle?.answer || '').length;
      if (!maxLength || this.inputText.length < maxLength) this.inputText += value;
      return true;
    }
    return false;
  }

  start() {
    if (this.active) return false;
    const tutorialActive = !!(window.tutorialSystem?.isActive?.());
    if (tutorialActive && Number(window.tutorialSystem.storyChapter) < 3) {
      console.log('Hacking remains locked until tutorial chapter 3');
      return false;
    }
    if (!tutorialActive && Date.now() < this.cooldownUntil) return false;
    if (window.player && window.player.grounded === false) return false;
    if (window.sector1Progression?.isGameplaySuppressed?.()) return false;

    this.runGeneration++;
    this.clearOwnedTimeouts();
    this.active = true;
    this.phase = 'boot';
    this.phaseElapsedMs = 0;
    this.sessionElapsedMs = 0;
    this._startTime = 0;
    this.puzzleReadyAt = 0;
    this.inputText = '';
    this.puzzleComplete = false;
    this.feedback = null;
    this.currentPuzzle = null;
    this.answer = null;
    this.guardHitsRemaining = 1;
    this._lastResultFailed = false;
    this.puzzleType = Math.floor(Math.random() * 2) + 1;
    this.displayTime = this.puzzleType === 2 ? 3000 : window.randomRange(1500, 2500);
    this.maxDisplayTime = this.displayTime + 500;
    this.initializeTerminal();

    this.previousRhythmModeActive = !!window.rhythmSystem?.isActive?.();
    this.suspendedRhythmMode = this.previousRhythmModeActive;
    if (this.previousRhythmModeActive) {
      this.safeInvoke('Rhythm Mode suspension', () => {
        if (window.rhythmSystem?.hideRhythmMode) window.rhythmSystem.hideRhythmMode();
        else if (window.rhythmSystem?.hide) window.rhythmSystem.hide();
      });
    }

    this.tutorialMode = tutorialActive;
    this.tutorialObjective = 'hack_start';
    this.tutorialCompleteObjective = 'hack_complete';
    return true;
  }

  update(deltaTime) {
    const delta = Math.max(0, Number.isFinite(deltaTime) ? deltaTime : 0);
    if (this.feedback) {
      this.feedback.timer -= delta / (1000 / 60);
      this.feedback.opacity = Math.max(0, Math.min(1, this.feedback.timer / 60));
      if (this.feedback.timer <= 0.001) this.feedback = null;
    }
    this.cursorBlink = (this.cursorBlink + delta / (1000 / 60)) % 60;
    if (!this.active) return;

    this.sessionElapsedMs += delta;
    if (this.sessionElapsedMs >= this.hardMaxSessionMs) {
      this.timeoutFailPuzzle('watchdog');
      return;
    }

    let remaining = delta;
    let transitions = 0;
    while (this.active && transitions++ < 4) {
      if (this.phase === 'boot') {
        const needed = Math.max(0, this.bootDurationMs - this.phaseElapsedMs);
        if (remaining < needed) { this.phaseElapsedMs += remaining; break; }
        remaining -= needed;
        this.phaseElapsedMs = 0;
        if (this.puzzleType === 1) this.generatePortPuzzle();
        else this.generateMemoryPuzzle();
        this.phase = 'display';
        if (remaining === 0) break;
        continue;
      }
      if (this.phase === 'display') {
        const needed = Math.max(0, this.displayTime - this.phaseElapsedMs);
        if (remaining < needed) { this.phaseElapsedMs += remaining; break; }
        remaining -= needed;
        const readyAt = this.sessionElapsedMs - remaining;
        this.beginAnswerWindow(readyAt);
        if (remaining === 0) break;
        continue;
      }
      if (this.phase === 'answer') {
        const needed = Math.max(0, this.answerDurationMs - this.phaseElapsedMs);
        if (remaining < needed) { this.phaseElapsedMs += remaining; break; }
        this.phaseElapsedMs += needed;
        this.timeoutFailPuzzle('answer');
        break;
      }
      // Unknown/corrupt phases are left to the hard watchdog, which guarantees
      // that a malformed state cannot freeze the game indefinitely.
      break;
    }
  }

  checkAnswer() {
    if (!this.active || this.phase !== 'answer' || !this.currentPuzzle?.answer) return false;
    if (this.inputText === this.currentPuzzle.answer) this.successPuzzle();
    else this.failPuzzle();
    return true;
  }

  completeTutorialObjectivesOnSuccess(tutorialSession = this.tutorialMode) {
    if (!tutorialSession || !window.tutorialSystem) return;
    if (typeof window.tutorialSystem.checkObjective === 'function') {
      window.tutorialSystem.checkObjective('hack_start');
      window.tutorialSystem.checkObjective('hack_complete');
    }
    window.tutorialSystem.completedObjectives?.add('hack_start');
    window.tutorialSystem.completedObjectives?.add('hack_complete');
    if (Array.isArray(window.tutorialSystem.objectives)) {
      window.tutorialSystem.objectives.forEach(objective => {
        if (objective.id === 'hack_start' || objective.id === 'hack_complete') objective.completed = true;
      });
    }
  }

  finishSession(outcome, terminalLines) {
    if (!this.active) return null;
    const tutorialSession = this.tutorialMode;

    // Mandatory cleanup happens before any collaborator is called. This is the
    // freeze-proof boundary: input ownership is released even if audio, health,
    // tutorial, Rhythm Mode, or pulse code throws.
    this.active = false;
    this.phase = 'result';
    this.phaseElapsedMs = 0;
    this.puzzleComplete = true;
    this.guardHitsRemaining = 0;
    this._startTime = 0;
    this.puzzleReadyAt = 0;
    this._lastResultFailed = outcome !== 'success';
    this.terminalLines = terminalLines;
    this.cooldownUntil = Date.now() + this.cooldownMs;
    this.runGeneration++;
    this.clearOwnedTimeouts();
    this.tutorialMode = false;
    this.tutorialObjective = null;
    this.tutorialCompleteObjective = null;

    this.restoreSuspendedRhythmMode();
    return { outcome, tutorialSession };
  }

  successPuzzle() {
    const result = this.finishSession('success', [
      '> ACCESS GRANTED', '> AUTHENTICATION SUCCESSFUL', '> NETWORK BREACH ACHIEVED',
      '> SIGNAL STRENGTH RESTORED', '> TERMINATING SESSION...'
    ]);
    if (!result) return false;
    this.safeInvoke('success audio', () => window.audioSystem?.playSound?.('terminalBeep', 0.5));
    this.safeInvoke('health restore', () => window.player?.restoreHealth?.(1));
    this.safeInvoke('tutorial completion', () => this.completeTutorialObjectivesOnSuccess(result.tutorialSession));
    this.safeInvoke('override pulse', () => this.emitOverridePulse());
    this.showSuccessFeedback();
    return true;
  }

  failPuzzle() {
    const result = this.finishSession('failure', [
      '> ACCESS DENIED', '> AUTHENTICATION FAILED', '> NETWORK BREACH ATTEMPTED',
      '> INTRUSION DETECTED', '> TERMINATING SESSION...'
    ]);
    if (!result) return false;
    this.safeInvoke('failure audio', () => window.audioSystem?.playSound?.('terminalBuzz', 0.3));
    this.showFailureFeedback();
    return true;
  }

  cancel() {
    return !!this.finishSession('cancel', [
      '> SESSION CANCELLED BY USER', '> TERMINATING CONNECTION...', '> NETWORK ACCESS REVOKED'
    ]);
  }

  timeoutFailPuzzle(reason = 'answer') {
    const result = this.finishSession('timeout', [
      '> SIGNAL TIMEOUT', '> CONNECTION LOST', '> TRY AGAIN', '> TERMINATING SESSION...'
    ]);
    if (!result) return false;
    this.safeInvoke('timeout audio', () => window.audioSystem?.playSound?.('terminalBuzz', 0.3));
    this.showTimeoutFeedback();
    console.log(`Terminal hack timed out (${reason})`);
    return true;
  }

  absorbGuardHit() {
    if (!this.active || this.guardHitsRemaining <= 0) return false;
    this.guardHitsRemaining--;
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
      if (player?.position && enemy.position && window.distance &&
          window.distance(player.position.x, player.position.y, enemy.position.x, enemy.position.y) > this.overridePulseRadius) return;
      enemy._stunnedUntilMs = now + stunMs;
    });
  }

  finishTacticalFocus(success) {
    this.cooldownUntil = Date.now() + this.cooldownMs;
    this.guardHitsRemaining = 0;
    this._startTime = 0;
    this.puzzleReadyAt = 0;
    this.restoreSuspendedRhythmMode();
    if (success) this.safeInvoke('override pulse', () => this.emitOverridePulse());
  }

  showSuccessFeedback() { this.feedback = { type: 'success', text: 'ACCESS GRANTED', opacity: 1, timer: 60 }; }
  showFailureFeedback() { this.feedback = { type: 'failure', text: 'ACCESS DENIED', opacity: 1, timer: 60 }; }
  showTimeoutFeedback() {
    window.hackTimeoutMessage = { text: 'SIGNAL TIMEOUT - TRY AGAIN', timer: 120, opacity: 1 };
  }

  draw(ctx) {
    if (this.feedback) {
      ctx.save();
      ctx.globalAlpha = this.feedback.opacity;
      ctx.fillStyle = this.feedback.type === 'success' ? '#00ff00' : '#ff0000';
      ctx.font = 'bold 48px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText(this.feedback.text, 960, 540);
      ctx.restore();
      return;
    }
    if (!this.active) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(400, 200, 1120, 440);
    ctx.fillStyle = 'rgba(0, 255, 0, 0.02)';
    for (let y = 200; y < 640; y += 2) ctx.fillRect(400, y, 1120, 1);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(400, 200, 1120, 440);
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('BARCODE NETWORK TERMINAL v3.7', 420, 230);
    ctx.font = '14px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('STATUS: CONNECTED', 1500, 230);
    if (this.phase === 'answer') {
      const remaining = Math.max(0, Math.ceil((this.answerDurationMs - this.phaseElapsedMs) / 1000));
      ctx.fillStyle = remaining <= 3 ? '#ff0000' : '#ffff00';
      ctx.font = '12px monospace';
      ctx.fillText(`TIME: ${remaining}s`, 1500, 250);
    }

    ctx.textAlign = 'left';
    const startY = 270;
    const lineHeight = 22;
    const maxLines = 12;
    this.terminalLines.slice(0, maxLines).forEach((line, index) => {
      const portMatch = line.match(/\s+(\d+)\.\s+PORT\s+(\d+):\s+(OPEN|CLOSED)/);
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 2;
      if (portMatch?.[3] === 'OPEN') {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 25px monospace';
      } else if (portMatch?.[3] === 'CLOSED') {
        ctx.fillStyle = '#ff6600';
        ctx.font = '21px monospace';
      } else if (this.currentPuzzle?.type === 2 && !this.currentPuzzle.hidden && line.trim() === this.currentPuzzle.answer) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 38px monospace';
      } else if (line.includes('ERROR') || line.includes('DENIED')) {
        ctx.fillStyle = '#ff0000';
        ctx.font = '16px monospace';
      } else if (line.includes('MEMORIZE')) {
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 18px monospace';
      } else {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px monospace';
      }
      ctx.fillText(line, 420, startY + index * lineHeight);
    });

    const inputY = startY + maxLines * lineHeight + 20;
    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(this.phase === 'answer' ? '> ' : '> SECURE INPUT PENDING...', 420, inputY);
    if (this.phase === 'answer') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(this.inputText, 450, inputY);
      if (this.cursorBlink < 30) {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(450 + ctx.measureText(this.inputText).width, inputY - 20, 12, 28);
      }
    }
    ctx.fillStyle = '#00ff00';
    ctx.font = '12px monospace';
    ctx.globalAlpha = 0.7;
    ctx.fillText('[ENTER] Submit | [ESC] Cancel | [0-9] Input', 420, inputY + 40);
    ctx.restore();
  }

  isActive() { return this.active; }
  isComplete() { return this.puzzleComplete; }
  getCurrentType() { return this.puzzleType; }

  reset() {
    const shouldRestore = this.active || this.suspendedRhythmMode;
    this.active = false;
    this.phase = 'idle';
    this.phaseElapsedMs = 0;
    this.sessionElapsedMs = 0;
    this.cooldownUntil = 0;
    this.guardHitsRemaining = 0;
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
    this._lastResultFailed = false;
    if (shouldRestore) this.restoreSuspendedRhythmMode();
    else {
      this.previousRhythmModeActive = false;
      this.suspendedRhythmMode = false;
    }
  }
};

function createHackingSystem() {
  if (window.hackingSystem) return;
  if (window.randomRange && window.clamp) {
    window.hackingSystem = new window.HackingSystem();
    console.log('Terminal Hacking System created');
  } else {
    console.warn('Hacking system dependencies not ready, retrying...');
    setTimeout(createHackingSystem, 100);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', createHackingSystem);
else createHackingSystem();
