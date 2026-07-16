// Mission Objectives System for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/objectives.js',
  exports: ['ObjectivesSystem', 'objectivesSystem', 'initObjectives'],
  dependencies: ['enemyManager', 'BARCODE.JammerEnvironment']
});

window.ObjectivesSystem = class ObjectivesSystem {
  constructor() {
    this.objectives = [];
    this.completedObjectives = new Set();
    this.objectiveUI = { visible: true, x: 30, y: 120, width: 600, height: 230 };
    this.active = true;
    this.allLoreRetrieved = false;
    this.loreRetrievedTime = 0;
    this.loreOverlayLocked = false;
    this.initializeMissionObjectives();
  }

  initializeMissionObjectives() {
    // Normal play no longer advertises the superseded kill-20 / destroy-Jammer gate.
    // The authored Level 1 stage PR will add final spatial/musical objectives.
    this.objectives = [{
      id: 'sandbox_training',
      title: 'Explore Dead Air District',
      description: 'Training and sandbox systems are active pending authored stage objectives.',
      priority: 'INFO',
      completed: false,
      visible: true,
      progress: 0,
      required: 0
    }];
  }

  update() {
    this.checkLoreCollectionStatus();
    this.checkCompletedObjectives();
  }

  revealBroadcastJammer(position) {
    if (!window.BARCODE || !window.BARCODE.JammerEnvironment) return false;
    window.BARCODE.JammerEnvironment.reveal({ position });
    if (window.sector1Progression && typeof window.sector1Progression.onJammerRevealed === 'function') {
      const status = window.BARCODE.JammerEnvironment.getStatus();
      window.sector1Progression.onJammerRevealed(status.position.x, status.position.y);
    }
    return true;
  }

  triggerBroadcastJammer(position) {
    if (!window.BARCODE || !window.BARCODE.JammerEnvironment) return false;
    window.BARCODE.JammerEnvironment.trigger({ position });
    return true;
  }

  checkLoreCollectionStatus() {
    let allLoreCollected = false;
    if (window.lostDataSystem && typeof window.lostDataSystem.getProgress === 'function') {
      const progress = window.lostDataSystem.getProgress();
      allLoreCollected = progress.collected >= progress.total && progress.total > 0;
    }
    if (allLoreCollected && !this.allLoreRetrieved) {
      this.allLoreRetrieved = true;
      this.loreRetrievedTime = Date.now();
      this.loreOverlayLocked = true;
    }
  }

  checkCompletedObjectives() {
    this.objectives.forEach(objective => {
      if (objective.completed && !this.completedObjectives.has(objective.id)) this.completedObjectives.add(objective.id);
    });
  }

  draw(ctx) {
    if (!this.objectiveUI.visible) return;
    ctx.save();
    const x = 1300; const y = 120; const w = 500; const h = 160;
    ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('MISSION OBJECTIVES', x + 15, y + 25);
    const defeated = window.enemyManager ? window.enemyManager.defeatedCount || 0 : 0;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff9900';
    ctx.fillText(`DEFEATS: ${defeated}`, x + w - 15, y + 25);
    ctx.textAlign = 'left';
    let yOffset = 60;
    this.objectives.forEach(obj => {
      if (!obj.visible) return;
      ctx.fillStyle = obj.completed ? '#00ff00' : '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${obj.completed ? '✓' : '›'} ${obj.title}`, x + 15, y + yOffset);
      ctx.fillStyle = '#cccccc';
      ctx.font = '12px monospace';
      ctx.fillText(obj.description, x + 30, y + yOffset + 20);
      yOffset += 50;
    });
    ctx.restore();
  }

  reset() {
    this.initializeMissionObjectives();
    if (window.BARCODE && window.BARCODE.JammerEnvironment) window.BARCODE.JammerEnvironment.reset();
  }

  onGameOver() {}
};

window.initObjectives = function() {
  try {
    if (window.objectivesSystem) return true;
    window.objectivesSystem = new window.ObjectivesSystem();
    console.log('✅ Objectives system initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize objectives system:', error?.message || error);
    return false;
  }
};
