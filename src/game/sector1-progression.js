// Sector 1 Progression System
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/sector1-progression.js', exports: ['Sector1Progression', 'sector1Progression', 'initSector1Progression'], dependencies: ['player', 'enemyManager'] });

window.Sector1Progression = class Sector1Progression {
  constructor(player) {
    this.player = player;
    this.enemiesDefeated = 0; // projection of EnemyManager's authoritative run count
    this.jammerRevealed = false;
    this.jammerTriggered = false;
    this.sectorComplete = false;
    this.completionMessageShown = false;
  }

  update() {}

  onEnemyDefeated(authoritativeTotal) {
    this.enemiesDefeated = Number.isFinite(authoritativeTotal) ? authoritativeTotal : (window.enemyManager ? window.enemyManager.defeatedCount || 0 : this.enemiesDefeated);
    console.log(`📊 Sector 1 defeat projection: ${this.enemiesDefeated}`);
  }

  onJammerRevealed(x, y) {
    this.jammerRevealed = true;
    console.log(`📡 Environmental Jammer revealed at ${x}, ${y}`);
  }

  revealJammer(position) {
    this.jammerRevealed = true;
    if (window.BARCODE && window.BARCODE.JammerEnvironment) window.BARCODE.JammerEnvironment.reveal({ position });
  }

  triggerJammer(position) {
    this.jammerTriggered = true;
    if (window.BARCODE && window.BARCODE.JammerEnvironment) window.BARCODE.JammerEnvironment.trigger({ position });
  }

  reset(preserveDefeats = false) {
    if (!preserveDefeats) this.enemiesDefeated = window.enemyManager ? window.enemyManager.defeatedCount || 0 : 0;
    this.jammerRevealed = false;
    this.jammerTriggered = false;
    this.sectorComplete = false;
    this.completionMessageShown = false;
  }
};

window.initSector1Progression = function(player) {
  if (!window.sector1Progression) window.sector1Progression = new window.Sector1Progression(player);
  return window.sector1Progression;
};
