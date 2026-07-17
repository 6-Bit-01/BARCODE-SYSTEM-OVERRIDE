// Test jammer spawn fix
console.log('🧪 Testing jammer spawn fix...');

// Wait for game systems to load
setTimeout(() => {
  console.log('🎮 Force spawning jammer for testing...');
  
  if (window.DEBUG && window.DEBUG.spawnJammer) {
    const result = window.DEBUG.spawnJammer();
    console.log('Spawn result:', result);
  } else {
    console.error('❌ DEBUG.spawnJammer not available');
  }
  
  // Check status after spawn
  setTimeout(() => {
    if (window.CHECK_JAMMER_STATUS) {
      const status = window.CHECK_JAMMER_STATUS();
      console.log('Jammer status:', status);
    }
  }, 1000);
  
}, 2000);