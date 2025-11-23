// Post-tutorial objectives system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/post-tutorial-objectives.js',
  exports: ['PostTutorialObjectives', 'postTutorialObjectives'],
  dependencies: []
});

window.PostTutorialObjectives = class PostTutorialObjectives {
  constructor() {
    this.active = false;
    this.objectives = [];
    this.completedObjectives = new Set();
    this.displayTimer = 0;
    this.initialDisplayDuration = 15000; // 15 seconds initial display (increased from 8000)
    this.hasBeenShown = false;
    
    // Define main mission objectives
    this.mainObjectives = [
      { id: 'eliminate_enemies', text: 'Eliminate 20 hostile entities', completed: false },
      { id: 'destroy_jammer', text: 'Destroy the Broadcast Jammer', completed: false, hidden: true },
      { id: 'confront_source', text: 'Confront the source of corruption', completed: false, hidden: true }
    ];
  }
  
  activate() {
    // DISABLED: Never activate post-tutorial objectives - use main objectives system only
    console.log('🎯 Post-tutorial objectives activation DISABLED - using main objectives system only');
    
    // CRITICAL: Ensure main objectives system is active when this is called
    if (window.objectivesSystem) {
      window.objectivesSystem.active = true;
      if (window.objectivesSystem.objectiveUI) {
        window.objectivesSystem.objectiveUI.visible = true;
      }
      console.log('✅ Main objectives system force-activated from post-tutorial system');
    }
    
    return;
    
    if (this.active) {
      console.log('Post-tutorial objectives already active');
      return;
    }
    
    this.active = true;
    this.hasBeenShown = true;
    this.objectives = [...this.mainObjectives];
    this.displayTimer = 0;
    console.log('🎯 Post-tutorial objectives activated - main objectives should remain visible');
    
    // CRITICAL: Ensure the main objectives system stays visible
    if (window.objectivesSystem) {
      if (window.objectivesSystem.objectiveUI) {
        window.objectivesSystem.objectiveUI.visible = true;
      }
      console.log('✅ Main objectives system confirmed visible');
    }
  }
  
  update(deltaTime) {
    if (!this.active) return;
    
    this.displayTimer += deltaTime;
    
    // Auto-hide after initial display duration - DISABLED: Keep objectives visible
    // if (this.displayTimer > this.initialDisplayDuration) {
    //   this.active = false;
    //   console.log('🎯 Post-tutorial objectives auto-hidden after initial display');
    // }
    
    // Update objective completion status
    this.updateObjectiveStatus();
  }
  
  updateObjectiveStatus() {
    // Check enemy elimination progress
    if (window.enemyManager) {
      const defeatedCount = window.enemyManager.defeatedCount || 0;
      const eliminateObj = this.objectives.find(obj => obj.id === 'eliminate_enemies');
      
      if (eliminateObj && !eliminateObj.completed && defeatedCount >= 20) {
        eliminateObj.completed = true;
        this.completedObjectives.add('eliminate_enemies');
        console.log('🎯 Enemy elimination objective completed!');
        
        // Reveal jammer objective
        const jammerObj = this.objectives.find(obj => obj.id === 'destroy_jammer');
        if (jammerObj) {
          jammerObj.hidden = false;
          
          // Check if jammer is already revealed/destroyed
          if (window.sector1Progression && window.sector1Progression.jammerRevealed) {
            jammerObj.completed = window.sector1Progression.jammerDestroyed || false;
            if (jammerObj.completed) {
              this.completedObjectives.add('destroy_jammer');
            }
          }
        }
      }
    }
    
    // Check jammer status
    if (window.sector1Progression) {
      const jammerObj = this.objectives.find(obj => obj.id === 'destroy_jammer');
      if (jammerObj && !jammerObj.hidden && window.sector1Progression.jammerDestroyed && !jammerObj.completed) {
        jammerObj.completed = true;
        this.completedObjectives.add('destroy_jammer');
        console.log('🎯 Broadcast Jammer objective completed!');
        
        // Reveal final objective
        const confrontObj = this.objectives.find(obj => obj.id === 'confront_source');
        if (confrontObj) {
          confrontObj.hidden = false;
        }
      }
    }
  }
  
  draw(ctx) {
    // DISABLED: Never draw post-tutorial objectives - removed left-side box completely
    return;
  }
  
  toggle() {
    if (this.hasBeenShown) {
      this.active = !this.active;
      if (this.active) {
        this.displayTimer = 0; // Reset timer when manually shown
        console.log('🎯 Post-tutorial objectives manually toggled on');
      } else {
        console.log('🎯 Post-tutorial objectives manually toggled off');
      }
    }
  }
  
  forceShow() {
    if (!this.hasBeenShown) {
      this.activate();
    } else {
      this.active = true;
      this.displayTimer = 0;
    }
    console.log('🎯 Post-tutorial objectives force shown');
  }
  
  forceHide() {
    this.active = false;
    console.log('🎯 Post-tutorial objectives force hidden');
  }
  
  getObjectiveProgress() {
    const total = this.objectives.filter(obj => !obj.hidden).length;
    const completed = this.objectives.filter(obj => !obj.hidden && obj.completed).length;
    return { completed, total, progress: total > 0 ? completed / total : 0 };
  }
  
  wrapText(text, maxWidth, ctx) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine.trim() !== '') {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
  isObjectiveCompleted(id) {
    const objective = this.objectives.find(obj => obj.id === id);
    return objective ? objective.completed : false;
  }
};

// Create global post-tutorial objectives system
window.postTutorialObjectives = new window.PostTutorialObjectives();

// Handle TAB key for toggling objectives - DISABLED
// window.addEventListener('keydown', (e) => {
//   if (e.key === 'Tab' && window.postTutorialObjectives.hasBeenShown) {
//     e.preventDefault();
//     window.postTutorialObjectives.toggle();
//   }
// });

console.log('🎯 Post-tutorial objectives system loaded');