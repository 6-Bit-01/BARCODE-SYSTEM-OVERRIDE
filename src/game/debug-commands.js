// Debug commands for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/debug-commands.js',
  exports: ['DEBUG', 'CHECK_JAMMER_STATUS', 'handleGameAction'],
  dependencies: ['enemyManager', 'tutorialSystem', 'gameState', 'hackingSystem', 'rhythmSystem', 'bootLoader', 'BARCODE.JammerEnvironment']
});

function jammerEnv() { return window.BARCODE && window.BARCODE.JammerEnvironment; }
function jammerStatus() { return jammerEnv() ? jammerEnv().getStatus() : null; }

window.DEBUG = {
  revealJammer(position) {
    if (!jammerEnv()) return '❌ Jammer environment unavailable';
    const status = jammerEnv().reveal({ position });
    console.log('📡 Environmental Jammer revealed:', status);
    return status;
  },
  triggerJammer(position) {
    if (!jammerEnv()) return '❌ Jammer environment unavailable';
    const status = jammerEnv().trigger({ position });
    console.log('📡 Environmental Jammer triggered:', status);
    return status;
  },
  resetJammer() {
    if (!jammerEnv()) return '❌ Jammer environment unavailable';
    const status = jammerEnv().reset();
    console.log('📡 Environmental Jammer reset:', status);
    return status;
  },
  checkJammer() {
    const status = jammerStatus();
    console.log('📡 Environmental Jammer status:', status);
    return status;
  },
  checkStatus() { return this.checkJammer(); },
  skipBootScreen() {
    if (window.bootLoader && typeof window.bootLoader.forceHide === 'function') {
      window.bootLoader.forceHide();
      window.bootLoader.setAudioLoaded(true);
      window.bootLoader.setSpritesLoaded(true);
      window.bootLoader.setAssetsLoaded(true);
      const startOverlay = document.getElementById('startOverlay');
      if (startOverlay) { startOverlay.style.display = 'flex'; startOverlay.style.opacity = '1'; }
      const soundPopup = document.getElementById('soundEnablePopup');
      if (soundPopup && soundPopup.parentNode) soundPopup.parentNode.removeChild(soundPopup);
      return '✅ Boot screen skipped - title screen ready';
    }
    return '❌ Failed to skip boot screen - boot loader not available';
  }
};

window.CHECK_JAMMER_STATUS = function() { return window.DEBUG.checkJammer(); };

window.handleGameAction = function(action) {
  switch (action) {
    case 'reveal_jammer': return window.DEBUG.revealJammer();
    case 'trigger_jammer': return window.DEBUG.triggerJammer();
    case 'reset_jammer': return window.DEBUG.resetJammer();
    case 'check_jammer': return window.DEBUG.checkJammer();
    case 'spawn_enemy':
      if (window.enemyManager && typeof window.enemyManager.spawnEnemy === 'function') { window.enemyManager.spawnEnemy(); return '✅ Enemy spawned'; }
      return '❌ Enemy manager unavailable';
    case 'toggle_rhythm':
      if (window.rhythmSystem && typeof window.rhythmSystem.toggle === 'function') return window.rhythmSystem.toggle();
      return '❌ Rhythm system unavailable';
    default:
      return `⚠️ Unknown debug action: ${action}`;
  }
};

console.log('🔧 Debug Commands: DEBUG.revealJammer(), DEBUG.triggerJammer(), DEBUG.resetJammer(), DEBUG.checkJammer()');
