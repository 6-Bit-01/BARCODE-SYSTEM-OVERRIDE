// Tutorial and story system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/tutorial.js',
  exports: ['TutorialSystem', 'tutorialSystem'],
  dependencies: ['clamp', 'randomRange']
});

window.TutorialSystem = class TutorialSystem {
  constructor() {
    this.active = false;
    this.combatEnemiesPaused = false;
    this.enemyCountDisplay = 0;
    this.currentStep = 0;
    this.completed = false;
    this.dialogue = [];
    this.currentDialogue = 0;
    this.timer = 0;
    this.typingSpeed = 50;
    this.currentText = '';
    this.targetText = '';
    this.characterIndex = 0;
    this.readyToAdvance = false;
    
    // Story progress
    this.storyChapter = 0;
    this.hasShownIntro = false;
    
    // Tutorial objectives
    this.objectives = [];
    this.completedObjectives = new Set();
    
    // Final message timing and fade
    this.finalMessageHoldTime = 10000;
    this.finalMessageTimer = 0;
    this.finalMessageFadeStart = 0;
    this.finalMessageOpacity = 1.0;
    this.isFinalMessage = false;
  }
  
  startTutorial() {
    if (this.completed) return;
    
    this.active = true;
    this.currentStep = 0;
    this.currentDialogue = 0;
    this.dialogue = [];
    this.completedObjectives.clear();
    
    this.startChapter(0);
  }
  
  startChapter(chapter) {
    if (chapter > 4) {
      console.log('Tutorial complete - no more chapters to start');
      this.active = false;
      return;
    }
    
    this.storyChapter = chapter;
    this.dialogue = [];
    this.objectives = [];
    
    switch(chapter) {
      case 0:
        this.addDialogue('SYSTEM BOOTING...', 'system', 2000);
        this.addDialogue('Welcome back to the BARCODE Network, 6 Bit.', 'guide', 3000);
        this.addDialogue('The tower has suffered a catastrophic collapse.', 'guide', 3000);
        this.addDialogue('Its memories are corrupted, its frequencies unstable, and entire sectors have gone dark.', 'guide', 3000);
        this.addDialogue('The broadcast is waking up—but it\'s terrified, and it needs you to stabilize it.', 'guide', 3000);
        this.addDialogue('Before you can restore the lost data…', 'guide', 2000);
        this.addDialogue('You need to re-sync your abilities.', 'guide', 2000);
        
        this.addObjective('Use Arrow Keys to move around', 'movement');
        this.addObjective('Press Up Arrow to jump', 'jump');
        const movementDialogue = this.addDialogue('Try moving around with the Arrow Keys.', 'guide', 0);
        movementDialogue.requiresObjectives = ['movement', 'jump'];
        break;
        
      case 1:
        this.addDialogue('Unstable entities roam this sector—fragments of corrupted signal that manifest as hostile viruses.', 'guide', 2000);
        this.addDialogue('They react to movement, clean frequencies, and anything rebooting itself.', 'guide', 2000);
        this.addDialogue('Your signal strength is shown in the top-left. If it drops to zero, your connection will collapse.', 'guide', 2000);
        this.addDialogue('Your first line of defense is close-quarters combat.', 'guide', 2000);
        this.addDialogue('Press Down Arrow for your primary attack. Musical timing can improve it, but a normal attack always works.', 'guide', 2000);
        this.addObjective('Defeat 3 viruses with primary attacks', 'combat');
        
        this.spawnCombatEnemies();
        this.combatEnemiesPaused = true;
        console.log('Combat tutorial enemies paused at start');
        
        setTimeout(() => {
          if (this.combatEnemiesPaused) {
            console.log('Auto-bringing enemies to ground');
            this.bringEnemiesToGround();
          }
        }, 1500);
        
        const waitForObjectiveDialogue = this.addDialogue('Complete the task to continue...', 'guide', 0);
        waitForObjectiveDialogue.requiresObjectives = ['combat'];
        this._objectiveDialogueIndex = this.dialogue.length - 1;
        console.log('Set objective dialogue index:', this._objectiveDialogueIndex);
        break;
        
      case 2:
        console.log('=== STARTING RHYTHM CHAPTER ===');
        const rhythmDialogue1 = this.addDialogue('Impressive. But basic combat won\'t be enough.', 'guide', 0);
        rhythmDialogue1.requiresObjectives = ['combat'];
        
        this.addDialogue('As a hacker-rapper, your strength flows through rhythm.', 'guide', 3000);
        this.addDialogue('Press R if you want to show timing visualization; movement, jump, and primary attacks still work without it.', 'guide', 3000);
        this.addDialogue('Perfect timing can add up to 1.5× damage and excellent timing up to 1.25×, but misses still allow normal attacks.', 'guide', 3000);
        const rhythmCompleteDialogue = this.addDialogue('Timing is optional. Continue when ready.', 'guide', 0);
        rhythmCompleteDialogue.requiresObjectives = ['combat'];
        break;
        
      case 3:
        const hackDialogue1 = this.addDialogue('Some terminals can be hacked when you stand near them.', 'guide', 2000);
        hackDialogue1.requiresObjectives = ['combat'];
        
        this.addDialogue('Press H to interact with a visible terminal. No terminal is required in this tutorial route.', 'guide', 3000);
        this.addDialogue('Successful hacks restore 1 bar of signal strength when a valid terminal exists.', 'guide', 3000);
        
        const hackCompleteDialogue = this.addDialogue('No terminal target is required here. Continue when ready.', 'guide', 0);
        hackCompleteDialogue.requiresObjectives = ['combat'];
        break;
        
      case 4:
        console.log('=== STARTING FINAL CHAPTER (CHAPTER 4) ===');
        this.addDialogue('You now have all the tools you need, 6 Bit.', 'guide', 2000);
        this.addDialogue('Movement for survival. Rhythm for power. Hacking for control.', 'guide', 3000);
        this.addDialogue('Use them together to fight through the corrupted sectors.', 'guide', 3000);
        this.addDialogue('Your mission: Find 9 Bit and restore the BARCODE Network.', 'guide', 4000);
        this.addDialogue('The fate of the digital world is in your hands.', 'guide', 4000);
        this.addDialogue('Good luck, hacker-rapper.', 'guide', 0);
        this.addObjective('Practice movement, rhythm, and hacking in the sandbox', 'level_clear');
        
        // CRITICAL FIX: Complete tutorial immediately when final chapter starts
        // Chapter 4 has no objectives to complete, so we need to trigger completion manually
        console.log('🎯 FINAL CHAPTER STARTED - IMMEDIATELY COMPLETING TUTORIAL');
        this.completed = true;
        this.completeTutorial();
        this._startFinalMessageSequence();
        break;
    }
    
    if (this.dialogue.length > 0) {
      this.currentDialogue = 0;
      this.startNextDialogue();
    } else {
      console.warn('Chapter started with no dialogues:', chapter);
    }
  }
  
  addDialogue(text, speaker = 'guide', duration = 0) {
    const dialogue = {
      text: text,
      speaker: speaker,
      duration: duration,
      completed: false
    };
    this.dialogue.push(dialogue);
    return dialogue;
  }
  
  addObjective(text, id) {
    this.objectives.push({
      text: text,
      id: id,
      completed: false
    });
  }
  
  startNextDialogue() {
    if (this.dialogue.length === 0) {
      console.warn('startNextDialogue called but dialogue array is empty');
      return;
    }
    
    if (this.currentDialogue >= this.dialogue.length) {
      console.log('Dialogue index exceeded bounds, resetting to end of array');
      this.currentDialogue = this.dialogue.length - 1;
    }
    
    if (this.currentDialogue < 0 || this.currentDialogue >= this.dialogue.length) {
      console.warn('startNextDialogue called with invalid dialogue index:', this.currentDialogue);
      this.checkChapterComplete();
      return;
    }
    
    const dialogue = this.dialogue[this.currentDialogue];
    if (!dialogue) {
      console.warn('startNextDialogue: dialogue is undefined at index:', this.currentDialogue);
      this.checkChapterComplete();
      return;
    }
    
    if (dialogue.requiresObjectives && Array.isArray(dialogue.requiresObjectives)) {
      const allObjectivesComplete = dialogue.requiresObjectives.every(objId => 
        this.completedObjectives.has(objId)
      );
      
      if (allObjectivesComplete) {
        console.log('Objectives already complete for this dialogue, skipping ahead');
        this.advanceDialogue();
        return;
      }
    }
    
    this.targetText = dialogue.text;
    this.currentText = '';
    this.characterIndex = 0;
    this.readyToAdvance = false;
    this.timer = 0;
    this.typingSpeed = dialogue.speaker === 'system' ? 30 : 50;
    
    if (this.currentDialogue === this._objectiveDialogueIndex && this.storyChapter === 1) {
      console.log('Combat objective dialogue reached! Bringing enemies to ground.');
      this.bringEnemiesToGround();
    }
  }
  
  update(deltaTime) {
    try {
      if (!this.active) {
        console.warn('Tutorial update called but not active');
        return;
      }
      
      if (this.dialogue.length === 0) {
        this.active = false;
        return;
      }
      
      if (this.currentDialogue >= this.dialogue.length) {
        this.active = false;
        return;
      }
      
      this.timer += deltaTime;
      
      // Check combat objective during combat chapter
      if (window.enemyManager && this.storyChapter === 1) {
        const defeatedCount = window.enemyManager.defeatedCount || 0;
        const activeEnemies = window.enemyManager.getActiveEnemies?.()?.length || 0;
        
        // CRITICAL FIX: Track tutorial-specific enemies separately
        if (!this._tutorialEnemyCount) {
          this._tutorialEnemyCount = 0;
          this._tutorialEnemiesDefeated = 0;
        }
        
        // Count tutorial enemies (virus type spawned during tutorial)
        const tutorialEnemies = window.enemyManager.getActiveEnemies().filter(enemy => 
          enemy.type === 'virus' && enemy.position.x > 0 && enemy.position.x < 4096
        );
        
        if (this.combatEnemiesPaused && tutorialEnemies.length > 0) {
          const frozenEnemies = tutorialEnemies.filter(enemy => 
            enemy.state !== 'patrol' && enemy.state !== 'chase'
          );
          
          if (frozenEnemies.length > 0) {
            console.log(`🚨 DETECTED ${frozenEnemies.length} FROZEN VIRUSES - AUTO-FIXING!`);
            this.bringEnemiesToGround();
          }
        }
        
        // CRITICAL FIX: Only complete objective when 3 TUTORIAL enemies are defeated
        if (this._tutorialEnemiesDefeated >= 3 && !this.completedObjectives.has('combat')) {
          console.log('✅ TUTORIAL COMBAT COMPLETE: 3 tutorial enemies defeated! (Total defeated: ' + this._tutorialEnemiesDefeated + ')');
          console.log('📊 Tutorial objective completion - _tutorialEnemiesDefeated:', this._tutorialEnemiesDefeated, 'completedObjectives.has(combat):', this.completedObjectives.has('combat'));
          this.checkObjective('combat');
        }
      }
      
      // Check rhythm combo during rhythm chapter
      if (window.rhythmSystem && this.storyChapter === 2) {
        let currentCombo = 0;
        
        if (typeof window.rhythmSystem.getCombo === 'function') {
          currentCombo = window.rhythmSystem.getCombo();
        } else if (window.rhythmSystem.combo !== undefined) {
          currentCombo = window.rhythmSystem.combo;
        } else if (window.rhythmSystem.maxCombo !== undefined) {
          currentCombo = window.rhythmSystem.maxCombo;
        }
        
        if (currentCombo >= 5 && !this.completedObjectives.has('optional_timing_removed')) {
          console.log('🎵🎵🎵 RHYTHM COMBO DETECTED! Player achieved combo of', currentCombo);
          this.forceCompleteRhythmCombo();
          this.deactivateRhythmModeOnComboComplete();
        }
      }
      
      // Check hacking objectives during hacking chapter
      if (window.hackingSystem && this.storyChapter === 3) {
        const hackingActive = window.hackingSystem.isActive();
        const hackingComplete = window.hackingSystem.isComplete();
        
        if (hackingActive && !this.completedObjectives.has('terminal_interact_optional')) {
          console.log('🔐 HACKING STARTED - Player activated terminal!');
          this.checkObjective('terminal_interact_optional');
          // Check if we can auto-skip current dialogue
          this._checkAutoSkipCurrentDialogue();
        }
        
        if (hackingComplete && !this.completedObjectives.has('terminal_hack_optional') &&
            this.completedObjectives.has('terminal_interact_optional') && !window.hackingSystem._lastResultFailed) {
          console.log('🔐 HACKING COMPLETED SUCCESSFULLY - Player solved the puzzle!');
          this.checkObjective('terminal_hack_optional');
        }
      }
      
      if (this.characterIndex < this.targetText.length) {
        this.characterIndex += deltaTime / this.typingSpeed;
        this.currentText = this.targetText.substring(0, Math.floor(this.characterIndex));
      } else {
        this.currentText = this.targetText;
        this.readyToAdvance = true;
      }
      
      // Handle final message timing and fade
      if (this.isFinalMessage && this.completed) {
        this.finalMessageTimer += deltaTime;
        
        if (this.finalMessageTimer >= this.finalMessageHoldTime && this.finalMessageFadeStart === 0) {
          this.finalMessageFadeStart = this.finalMessageTimer;
          console.log('Starting final message fade-out');
        }
        
        if (this.finalMessageFadeStart > 0) {
          const fadeProgress = Math.min(1.0, (this.finalMessageTimer - this.finalMessageFadeStart) / 2000);
          this.finalMessageOpacity = Math.max(0.0, 1.0 - fadeProgress);
          
          if (this.finalMessageOpacity <= 0) {
            this.active = false;
            console.log('Tutorial final message fully faded out - tutorial deactivated');
          }
        }
      }
    } catch (error) {
      console.error('Error updating tutorial system:', error?.message || error);
    }
  }
  
  advanceDialogue() {
    if (this.dialogue.length === 0) {
      console.warn('advanceDialogue called but dialogue array is empty');
      return;
    }
    
    if (this.currentDialogue >= this.dialogue.length - 1) {
      console.log('At end of chapter, advancing to next chapter');
      if (this.storyChapter >= 4) {
        console.log('Tutorial complete - no more chapters to advance to');
        this.active = false;
        return;
      }
      this.currentDialogue = 0;
      this.startChapter(this.storyChapter + 1);
      return;
    }
    
    this.currentDialogue++;
    this.startNextDialogue();
  }
  
  checkChapterComplete() {
    console.log('=== checkChapterComplete called ===');
    
    if (this.storyChapter < 4) {
      const allObjectivesComplete = this.objectives.every(obj => obj.completed);
      console.log('All objectives complete?', allObjectivesComplete);
      
      if (allObjectivesComplete) {
        if (this.storyChapter >= 4) {
          console.log('Final chapter complete - tutorial finished');
          this.completeTutorial();
          return;
        }
        console.log('Chapter complete! Advancing to chapter:', this.storyChapter + 1);
        setTimeout(() => {
          this.startChapter(this.storyChapter + 1);
        }, 1000);
      }
    }
  }
  
  completeObjective(id) {
    if (!this.completedObjectives.has(id)) {
      this.completedObjectives.add(id);
      
      const objective = this.objectives.find(obj => obj.id === id);
      if (objective) {
        objective.completed = true;
        console.log('✓ Objective marked as completed in UI:', objective.text);
      }
      
      // AUTO-SKIP MECHANISM: Check if current dialogue should be auto-skipped
      this._checkAutoSkipCurrentDialogue();
      
      // Handle specific objective completions
      switch(id) {
        case 'combat':
          console.log('Combat objective completed!');
          
          const currentDialogue = this.dialogue[this.currentDialogue];
          if (currentDialogue && currentDialogue.text === 'Complete the task to continue...') {
            const combatObj = this.objectives.find(obj => obj.id === 'combat');
            if (combatObj) {
              combatObj.completed = true;
            }
            
            if (this._combatTimeout) {
              clearTimeout(this._combatTimeout);
            }
            
            // AUTO-SKIP: Immediately advance to next chapter
            console.log('⏩ AUTO-SKIP: Combat objective completed early - skipping to next chapter');
            setTimeout(() => {
              this.startChapter(2);
            }, 1000); // Brief pause for visual feedback
            return;
          }
          break;
          
        case 'optional_timing_removed':
          console.log('✓ RHYTHM_COMBO OBJECTIVE COMPLETED!');
          this.deactivateRhythmModeOnComboComplete();
          
          const currentRhythmDialogue = this.dialogue[this.currentDialogue];
          if (currentRhythmDialogue && currentRhythmDialogue.text === 'Complete the task to continue...') {
            // AUTO-SKIP: Check if rhythm_start is also completed
            setTimeout(() => {
              const hasRhythmStart = this.completedObjectives.has('rhythm_start');
              if (hasRhythmStart) {
                console.log('⏩ AUTO-SKIP: All rhythm objectives completed - advancing to hacking chapter');
                this.startChapter(3);
              } else {
                this.advanceDialogue();
              }
            }, 500);
            return;
          }
          break;
          
        case 'terminal_hack_optional':
          const currentHackDialogue = this.dialogue[this.currentDialogue];
          if (currentHackDialogue && currentHackDialogue.text === 'Complete the task to continue...') {
            // AUTO-SKIP: Check if terminal_interact_optional is also completed
            setTimeout(() => {
              const hasHackStart = this.completedObjectives.has('terminal_interact_optional');
              if (hasHackStart) {
                console.log('⏩ AUTO-SKIP: All hacking objectives completed - advancing to final chapter');
                this.startChapter(4);
              } else {
                this.addDialogue('System breached! You\'ve still got your skills.', 'guide', 0);
                setTimeout(() => {
                  this.advanceDialogue();
                }, 100);
              }
            }, 500);
            return;
          }
          break;
      }
    }
  }
  
  _startFinalMessageSequence() {
    this.isFinalMessage = true;
    this.finalMessageTimer = 0;
    this.finalMessageFadeStart = 0;
    this.finalMessageOpacity = 1.0;
    console.log('Starting final message sequence - holding for 10 seconds then fading');
  }
  
  completeTutorial() {
    this.completed = true;
    console.log('Tutorial marked as complete - final message sequence will handle fade-out');
    
    console.log('🎯 Ensuring original objectives system is active...');
    
    // CRITICAL: DO NOT activate post-tutorial objectives system
    // The main objectives system will handle all objectives after tutorial
    // This prevents conflicts and ensures objectives stay visible
    console.log('✅ Tutorial complete - main objectives system will handle all objectives');
    
    // Reset tutorial-only combat statistics so the sandbox defeat statistic starts at 0.
    if (window.enemyManager && typeof window.enemyManager.clear === 'function') {
      window.enemyManager.clear({ preserveDefeats: false });
    }
    if (typeof window.syncEnemyDefeatProjections === 'function') {
      window.syncEnemyDefeatProjections(0);
    } else {
      if (window.gameState) window.gameState.enemiesDefeated = 0;
      if (window.sector1Progression) window.sector1Progression.enemiesDefeated = 0;
    }
    if (window.sector1Progression) window.sector1Progression.tutorialEnemiesDefeated = 0;
    
    // CRITICAL FIX: Force objectives system to stay visible and permanently active
    if (window.objectivesSystem) {
      if (window.objectivesSystem.objectiveUI) {
        window.objectivesSystem.objectiveUI.visible = true;
      }
      window.objectivesSystem.active = true; // Ensure system is marked active
      console.log('✅ Objectives system forced permanently active after tutorial completion');
      
      // CRITICAL: Reset objectives to ensure they're properly initialized
      if (typeof window.objectivesSystem.reset === 'function') {
        window.objectivesSystem.reset();
        console.log('✅ Objectives system reset after tutorial completion');
      }
    }
    
    // CRITICAL: Set global flag to indicate objectives should be shown
    window.objectivesShownAfterTutorial = true;
    console.log('✅ Global objectives flag set - objectives will appear immediately');
    
    // Show on-screen message
    if (window.loreSystem) {
      window.loreSystem.displayLoreMessage('Explore Dead Air District.');
    }
  }
  
  draw(ctx) {
    if (!this.active) return;
    
    const boxY = 890;
    const boxHeight = 180;
    
    ctx.save();
    
    if (this.isFinalMessage && this.finalMessageOpacity < 1.0) {
      ctx.globalAlpha = this.finalMessageOpacity;
    }
    
    // Background
    ctx.fillStyle = 'rgba(0, 10, 20, 0.9)';
    ctx.fillRect(0, boxY, 1920, boxHeight);
    
    // Border
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, boxY, 1920, boxHeight);
    
    // Draw current dialogue
    if (this.dialogue.length === 0) {
      ctx.restore();
      return;
    }
    
    if (this.currentDialogue >= 0 && this.currentDialogue < this.dialogue.length) {
      const dialogue = this.dialogue[this.currentDialogue];
      if (!dialogue) {
        console.warn('draw: dialogue is undefined at index:', this.currentDialogue);
        ctx.restore();
        return;
      }
      
      // Speaker name
      let speakerColor = '#00ffff';
      let speakerName = 'UNKNOWN';
      
      switch(dialogue.speaker) {
        case 'guide':
          speakerColor = '#ff00ff';
          speakerName = 'BARCODE GUIDE';
          break;
        case 'system':
          speakerColor = '#00ffff';
          speakerName = 'SYSTEM';
          break;
      }
      
      ctx.fillStyle = speakerColor;
      ctx.font = 'bold 20px Orbitron';
      ctx.textAlign = 'left';
      ctx.fillText(speakerName, 50, boxY + 40);
      
      // Dialogue text
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px "Share Tech Mono"';
      ctx.textAlign = 'left';
      const lines = this.wrapText(this.currentText, 1820, ctx);
      lines.forEach((line, index) => {
        ctx.fillText(line, 50, boxY + 80 + (index * 25));
      });
      
      // Continue prompt
      if (this.currentText.length >= this.targetText.length) {
        const canAdvance = !dialogue.requiresObjectives || 
          (Array.isArray(dialogue.requiresObjectives) && dialogue.requiresObjectives.every(objId => this.completedObjectives.has(objId)));
        
        if (canAdvance) {
          ctx.fillStyle = '#00ffff';
          ctx.font = '16px Orbitron';
          ctx.textAlign = 'left';
          ctx.fillText('Press SPACE to continue...', 50, boxY + 150);
        } else {
          ctx.fillStyle = '#ff6666';
          ctx.font = '16px Orbitron';
          ctx.textAlign = 'left';
          ctx.fillText('Complete tasks to continue...', 50, boxY + 150);
        }
      }
    }
    
    // Draw tutorial objectives (only during tutorial, disappears after completion)
    if (this.objectives.length > 0 && !this.completed) {
      const objX = 1450;
      const objY = 50;
      const objWidth = 400;
      const objHeight = Math.min(1080, this.objectives.length * 30 + 120);
      
      ctx.fillStyle = 'rgba(0, 20, 40, 0.8)';
      ctx.fillRect(objX, objY, objWidth, objHeight);
      
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(objX, objY, objWidth, objHeight);
      
      ctx.font = '16px "Share Tech Mono"';
      ctx.textAlign = 'left';
      this.objectives.forEach((objective, index) => {
        const color = objective.completed ? '#00ff00' : '#ffffff';
        const prefix = objective.completed ? '✓ ' : '□ ';
        ctx.fillStyle = color;
        ctx.fillText(prefix + objective.text, objX + 20, objY + 50 + (index * 30));
      });
      
      // Show enemy counter during combat tutorial
      if (window.enemyManager && this.storyChapter === 1) {
        // CRITICAL FIX: Use tutorial-specific counter instead of global counter
        const defeatedCount = this._tutorialEnemiesDefeated || 0;
        const combatObjectiveCompleted = this.completedObjectives.has('combat');
        
        if (!combatObjectiveCompleted && defeatedCount < 3) {
          const barY = objY + 60 + (this.objectives.length * 25) + 10;
          const barHeight = 20;
          const progress = defeatedCount / 3;
          
          // Background
          ctx.fillStyle = '#333333';
          ctx.fillRect(objX + 20, barY, 150, barHeight);
          
          // Progress fill
          if (progress >= 1.0) {
            ctx.fillStyle = '#00ff00';
          } else if (progress >= 0.5) {
            ctx.fillStyle = '#ffff00';
          } else {
            ctx.fillStyle = '#ff9900';
          }
          
          const fillWidth = Math.min(150, 150 * progress);
          ctx.fillRect(objX + 20, barY, fillWidth, barHeight);
          
          // Border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(objX + 20, barY, 150, barHeight);
          
          // Text counter
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px Orbitron';
          ctx.textAlign = 'left';
          ctx.fillText(`${defeatedCount}/3`, objX + 180, barY + 15);
        }
      }
    }
    
    ctx.restore();
  }
  
  wrapText(text, maxWidth, ctx) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine.trim() !== '') {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }
  
  isActive() {
    return this.active;
  }
  
  handleSpacePress() {
    if (!this.active || !this.readyToAdvance) {
      return;
    }
    
    const currentDialogue = this.dialogue[this.currentDialogue];
    if (!currentDialogue) {
      return;
    }
    
    // Check if dialogue requires objectives to be completed
    if (currentDialogue.requiresObjectives && Array.isArray(currentDialogue.requiresObjectives)) {
      const allObjectivesComplete = currentDialogue.requiresObjectives.every(objId => 
        this.completedObjectives.has(objId)
      );
      
      if (!allObjectivesComplete) {
        console.log('Objectives not yet complete for this dialogue');
        return;
      }
    }
    
    this.advanceDialogue();
  }
  
  isCompleted() {
    return this.completed;
  }
  
  checkObjective(id) {
    if (this.active) {
      this.completeObjective(id);
    }
  }
  
  _checkAutoSkipCurrentDialogue() {
    // Check if current dialogue can be auto-skipped due to completed objectives
    if (this.currentDialogue < 0 || this.currentDialogue >= this.dialogue.length) {
      return;
    }
    
    const currentDialogue = this.dialogue[this.currentDialogue];
    if (!currentDialogue || !currentDialogue.requiresObjectives) {
      return;
    }
    
    // Check if all required objectives for this dialogue are now complete
    const allRequiredComplete = currentDialogue.requiresObjectives.every(objId => 
      this.completedObjectives.has(objId)
    );
    
    if (allRequiredComplete) {
      console.log('⏩ AUTO-SKIP: All objectives completed for current dialogue - auto-advancing');
      
      // Skip the typing animation and mark as ready to advance immediately
      this.currentText = this.targetText;
      this.characterIndex = this.targetText.length;
      this.readyToAdvance = true;
      
      // Auto-advance after brief delay for player to see completion
      setTimeout(() => {
        if (this.active && allRequiredComplete) {
          this.advanceDialogue();
        }
      }, 500);
    }
  }
  
  forceCompleteObjective(id) {
    console.log('Force completing objective:', id);
    this.completeObjective(id);
  }
  
  deactivateRhythmModeOnComboComplete() {
    console.log('🎵🎵🎵 DEACTIVATE RHYTHM MODE ON COMBO COMPLETE');
    
    let deactivationSuccess = false;
    
    if (window.rhythmSystem && typeof window.rhythmSystem.hide === 'function') {
      window.rhythmSystem.hide();
      deactivationSuccess = true;
    } else if (window.rhythmSystem && typeof window.rhythmSystem.hideRhythmMode === 'function') {
      window.rhythmSystem.hideRhythmMode();
      deactivationSuccess = true;
    }
    
    if (deactivationSuccess) {
      console.log('🎵 SUCCESS: Optional timing visualization deactivated');
      
      if (window.audioSystem && typeof window.audioSystem.playSound === 'function') {
        window.audioSystem.playSound('success', 0.5);
      }
    }
  }
  
  forceCompleteRhythmCombo() {
    console.log('🎵🎵🎵 FORCE COMPLETE RHYTHM COMBO');
    
    if (!this.completedObjectives.has('optional_timing_removed')) {
      this.completedObjectives.add('optional_timing_removed');
    }
    
    const rhythmObj = this.objectives.find(obj => obj.id === 'optional_timing_removed');
    if (rhythmObj && !rhythmObj.completed) {
      rhythmObj.completed = true;
    }
    
    this.checkObjective('optional_timing_removed');
  }
  
  spawnCombatEnemies() {
    if (!window.enemyManager) return;
    
    // Check current enemy count before spawning
    const currentEnemyCount = window.enemyManager.getActiveEnemies().length;
    const maxEnemies = 12;
    const enemiesToSpawn = Math.min(3, maxEnemies - currentEnemyCount);
    
    if (enemiesToSpawn <= 0) {
      console.log('Enemy limit reached, skipping spawn');
      return;
    }
    
    window.enemyManager.clear();
    
    // CRITICAL FIX: Reset tutorial enemy counters
    this._tutorialEnemyCount = 0;
    this._tutorialEnemiesDefeated = 0;
    
    const playerX = window.player?.position?.x || 960;
    const playerY = window.player?.position?.y || 750;
    
    // Spawn at least 800px away from player on random sides
    const spawnPositions = [];
    const minDistance = 800; // Minimum distance from player
    const maxDistance = 1500; // Maximum distance to keep enemies visible
    
    for (let i = 0; i < enemiesToSpawn; i++) {
      // Choose random side: left, right, or both
      const sides = ['left', 'right'];
      const chosenSide = sides[Math.floor(Math.random() * sides.length)];
      
      let xOffset, vx, spawnSide;
      
      if (chosenSide === 'left') {
        // Spawn on left side, at least 800px away
        xOffset = -window.randomRange(minDistance, Math.min(maxDistance, 1200));
        vx = 80; // Drift right toward player
        spawnSide = 'left';
      } else {
        // Spawn on right side, at least 800px away
        xOffset = window.randomRange(minDistance, Math.min(maxDistance, 1200));
        vx = -80; // Drift left toward player
        spawnSide = 'right';
      }
      
      const x = playerX + xOffset;
      const y = -100 - (i * 150); // Higher spawn point with more stagger
      
      // Ensure within world bounds (canvas is 1920 wide)
      const safeX = window.clamp(x, 50, 1870);
      
      // Verify minimum distance is maintained
      const actualDistance = Math.abs(safeX - playerX);
      const finalX = actualDistance >= minDistance ? safeX : 
                    (safeX < playerX ? playerX - minDistance : playerX + minDistance);
      
      spawnPositions.push({ 
        x: finalX, 
        y: y,
        vx: vx, // Directional drift toward player
        vy: 150, // Faster fall for more dramatic entrance
        edge: spawnSide === 'left' ? 'top-left' : 'top-right',
        side: spawnSide
      });
    }
    
    spawnPositions.forEach((pos, index) => {
      setTimeout(() => {
        // CRITICAL FIX: Force spawn virus type and mark as tutorial enemy
        const enemy = new window.Enemy(pos.x, pos.y, 'virus');
        enemy._isTutorialEnemy = true; // Mark as tutorial enemy
        enemy.entranceComplete = false; // Enable entrance animation
        enemy.state = 'entrance'; // Start in entrance state for dropping effect
        enemy.position.x = pos.x;
        enemy.position.y = pos.y;
        enemy.velocity.x = pos.vx;
        enemy.velocity.y = pos.vy;
        enemy.isOnGround = false; // Not on ground initially
        
        // Set entrance behavior for top drop
        enemy._dropEdge = 'top';
        
        // Create spawn particle effect using established system
        if (window.particleSystem) {
          console.log(`🌟 Creating virus spawn effect at (${pos.x.toFixed(0)}, ${pos.y.toFixed(0)})`);
          window.particleSystem.enemySpawnEffect(pos.x, pos.y, 'virus');
        }
        
        window.enemyManager.enemies.push(enemy);
        this._tutorialEnemyCount++;
        
        const distToPlayer = window.distance(pos.x, pos.y, playerX, playerY);
        console.log(`🎯 SPAWNED TUTORIAL enemy #${index + 1} at X:${pos.x.toFixed(0)} on ${pos.side} side`);
        console.log(`   Distance from player: ${distToPlayer.toFixed(0)}px (Min required: ${minDistance}px)`);
        console.log(`   Safe distance check: ${distToPlayer >= minDistance ? '✅ SAFE' : '⚠️ TOO CLOSE'}`);
      }, index * 1000); // Longer delay for better visual pacing
    });
  }
  
  bringEnemiesToGround() {
    console.log('🌟 Making combat enemies fall to ground level');
    
    if (window.enemyManager) {
      const enemies = window.enemyManager.getActiveEnemies();
      console.log(`Found ${enemies.length} enemies to bring to ground`);
      
      enemies.forEach((enemy, index) => {
        enemy.entranceComplete = true;
        enemy.state = 'patrol';
        enemy.stateTimer = 0;
        enemy.position.y = 750;
        enemy.velocity.y = 0;
        enemy.velocity.x = 0; // CRITICAL: Reset velocity to let AI control movement
        enemy.isOnGround = true;
        
        // CRITICAL FIX: Force sprite to correct animation state
        if (enemy.spriteReady && enemy.sprite) {
          enemy.playAnimation('idle');
        }
      });
      
      this.combatEnemiesPaused = false;
      
      setTimeout(() => {
        this.combatEnemiesPaused = false;
        console.log('🌟 Combat enemies unpaused - they should move now!');
      }, 100);
    }
  }
};

// Create global tutorial system
function createTutorialSystem() {
  if (window.randomRange && window.clamp) {
    window.tutorialSystem = new window.TutorialSystem();
  } else {
    console.warn('Tutorial system dependencies not ready, retrying...');
    setTimeout(createTutorialSystem, 100);
  }
}

// Initialize tutorial system when dependencies are loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createTutorialSystem);
} else {
  createTutorialSystem();
}