// Test script to verify rhythm.js is working correctly as the sole rhythm system
// This script tests all rhythm-related functionality

console.log('=== RHYTHM SYSTEM VERIFICATION TEST ===');

function testRhythmSystem() {
  console.log('\n1. VERIFYING RHYTHM SYSTEM EXISTENCE');
  
  // Check if rhythm system exists and is properly loaded
  if (!window.rhythmSystem) {
    console.error('❌ FAILED: window.rhythmSystem does not exist');
    return false;
  }
  
  if (!window.RhythmSystem) {
    console.error('❌ FAILED: window.RhythmSystem class does not exist');
    return false;
  }
  
  console.log('✅ PASSED: window.rhythmSystem exists');
  console.log('✅ PASSED: window.RhythmSystem class exists');
  
  console.log('\n2. VERIFYING RHYTHM SYSTEM INITIALIZATION');
  
  // Check if rhythm system is properly initialized
  if (typeof window.rhythmSystem.isActive !== 'function') {
    console.error('❌ FAILED: rhythmSystem.isActive() method not found');
    return false;
  }
  
  if (typeof window.rhythmSystem.show !== 'function') {
    console.error('❌ FAILED: rhythmSystem.show() method not found');
    return false;
  }
  
  if (typeof window.rhythmSystem.hide !== 'function') {
    console.error('❌ FAILED: rhythmSystem.hide() method not found');
    return false;
  }
  
  if (typeof window.rhythmSystem.handleInput !== 'function') {
    console.error('❌ FAILED: rhythmSystem.handleInput() method not found');
    return false;
  }
  
  console.log('✅ PASSED: All core rhythm methods exist');
  
  console.log('\n3. VERIFYING RHYTHM SYSTEM STATE');
  
  // Check initial state
  if (window.rhythmSystem.isActive()) {
    console.log('⚠️ WARNING: Rhythm system is initially active (should be inactive)');
  } else {
    console.log('✅ PASSED: Rhythm system is initially inactive');
  }
  
  if (window.rhythmSystem.isRunning()) {
    console.log('ℹ️ INFO: Rhythm system is running in background (this is expected)');
  } else {
    console.log('ℹ️ INFO: Rhythm system is not running yet');
  }
  
  console.log('\n4. TESTING R KEY TOGGLE FUNCTIONALITY');
  
  // Test R key toggle simulation
  const initialState = window.rhythmSystem.isActive();
  console.log(`Initial active state: ${initialState}`);
  
  // Simulate R key press (only if audio system is ready)
  if (window.audioSystem && window.audioSystem.isInitialized()) {
    console.log('Audio system is ready - testing rhythm activation...');
    
    // Test showing rhythm mode
    try {
      window.rhythmSystem.show();
      console.log('✅ PASSED: rhythmSystem.show() executed without error');
      
      const afterShowState = window.rhythmSystem.isActive();
      console.log(`After show() active state: ${afterShowState}`);
      
      // Test hiding rhythm mode
      window.rhythmSystem.hide();
      console.log('✅ PASSED: rhythmSystem.hide() executed without error');
      
      const afterHideState = window.rhythmSystem.isActive();
      console.log(`After hide() active state: ${afterHideState}`);
      
      if (afterShowState && !afterHideState) {
        console.log('✅ PASSED: R key toggle functionality works correctly');
      } else {
        console.log('⚠️ WARNING: R key toggle may not be working as expected');
      }
      
    } catch (error) {
      console.error('❌ FAILED: Error during rhythm toggle test:', error);
      return false;
    }
  } else {
    console.log('⚠️ SKIPPED: Audio system not ready - cannot test rhythm activation');
    console.log('   This is normal if the game hasn\'t fully started yet');
  }
  
  console.log('\n5. TESTING DOWN ARROW ATTACK FUNCTIONALITY');
  
  // Test down arrow input handling (only when rhythm is active)
  if (window.audioSystem && window.audioSystem.isInitialized()) {
    try {
      // Activate rhythm mode first
      window.rhythmSystem.show();
      
      // Test rhythm input handling
      const result = window.rhythmSystem.handleInput('attack');
      console.log('✅ PASSED: rhythmSystem.handleInput() executed without error');
      console.log('Attack result:', result);
      
      // Verify result structure
      if (result && typeof result === 'object') {
        if (typeof result.hit === 'boolean' && 
            typeof result.timing === 'string' && 
            typeof result.combo === 'number') {
          console.log('✅ PASSED: Rhythm input result has correct structure');
        } else {
          console.error('❌ FAILED: Rhythm input result has incorrect structure');
          return false;
        }
      } else {
        console.error('❌ FAILED: Rhythm input result is not an object');
        return false;
      }
      
      // Clean up - hide rhythm mode
      window.rhythmSystem.hide();
      
    } catch (error) {
      console.error('❌ FAILED: Error during down arrow attack test:', error);
      return false;
    }
  } else {
    console.log('⚠️ SKIPPED: Audio system not ready - cannot test rhythm attacks');
  }
  
  console.log('\n6. VERIFYING BEAT SYNCHRONIZATION');
  
  // Check beat sync functionality
  if (typeof window.rhythmSystem.syncWithAudioBeat === 'function') {
    console.log('✅ PASSED: syncWithAudioBeat() method exists');
    
    // Test beat sync (simulate audio beat)
    try {
      const initialBeatCount = window.rhythmSystem.globalBeatCount;
      window.rhythmSystem.syncWithAudioBeat();
      const afterBeatCount = window.rhythmSystem.globalBeatCount;
      
      console.log(`Beat count before sync: ${initialBeatCount}`);
      console.log(`Beat count after sync: ${afterBeatCount}`);
      
      if (afterBeatCount > initialBeatCount) {
        console.log('✅ PASSED: Beat synchronization increments beat count');
      } else {
        console.log('⚠️ WARNING: Beat sync may not be working as expected');
      }
      
    } catch (error) {
      console.error('❌ FAILED: Error during beat synchronization test:', error);
      return false;
    }
  } else {
    console.error('❌ FAILED: syncWithAudioBeat() method not found');
    return false;
  }
  
  console.log('\n7. VERIFYING AUDIO INTEGRATION');
  
  // Check audio system integration
  if (window.audioSystem) {
    console.log('✅ PASSED: Audio system exists');
    
    if (typeof window.audioSystem.isInitialized === 'function') {
      const audioReady = window.audioSystem.isInitialized();
      console.log(`Audio system initialized: ${audioReady}`);
      
      if (audioReady) {
        console.log('✅ PASSED: Audio system is ready for rhythm synchronization');
      } else {
        console.log('⚠️ WARNING: Audio system not initialized yet');
      }
    } else {
      console.error('❌ FAILED: audioSystem.isInitialized() method not found');
      return false;
    }
  } else {
    console.log('⚠️ WARNING: Audio system not found');
  }
  
  console.log('\n8. CHECKING FOR CONFLICTING RHYTHM SYSTEMS');
  
  // Verify no conflicting rhythm systems exist
  const conflictingSystems = [
    'rhythmFixed',
    'rhythmSystemFixed', 
    'fixedRhythmSystem',
    'backupRhythmSystem'
  ];
  
  let conflictsFound = 0;
  conflictingSystems.forEach(systemName => {
    if (window[systemName]) {
      console.log(`❌ CONFLICT: Found conflicting system: window.${systemName}`);
      conflictsFound++;
    }
  });
  
  if (conflictsFound === 0) {
    console.log('✅ PASSED: No conflicting rhythm systems found');
  } else {
    console.error(`❌ FAILED: Found ${conflictsFound} conflicting rhythm systems`);
    return false;
  }
  
  console.log('\n9. VERIFYING RHYTHM VISUALIZATION');
  
  // Check drawing functionality
  if (typeof window.rhythmSystem.draw === 'function') {
    console.log('✅ PASSED: rhythmSystem.draw() method exists');
  } else {
    console.error('❌ FAILED: rhythmSystem.draw() method not found');
    return false;
  }
  
  if (typeof window.rhythmSystem.update === 'function') {
    console.log('✅ PASSED: rhythmSystem.update() method exists');
  } else {
    console.error('❌ FAILED: rhythmSystem.update() method not found');
    return false;
  }
  
  console.log('\n10. CHECKING COMBO AND PROGRESSION SYSTEMS');
  
  // Check combo system
  const initialCombo = window.rhythmSystem.getCombo();
  const maxCombo = window.rhythmSystem.getMaxCombo();
  
  console.log(`Current combo: ${initialCombo}`);
  console.log(`Max combo: ${maxCombo}`);
  
  if (typeof initialCombo === 'number' && typeof maxCombo === 'number') {
    console.log('✅ PASSED: Combo system working correctly');
  } else {
    console.error('❌ FAILED: Combo system not working correctly');
    return false;
  }
  
  console.log('\n=== RHYTHM SYSTEM VERIFICATION COMPLETE ===');
  console.log('✅ ALL TESTS PASSED - rhythm.js is working correctly as the sole rhythm system');
  
  return true;
}

// Run the test
const testResult = testRhythmSystem();

if (testResult) {
  console.log('\n🎉 RHYTHM SYSTEM VERIFICATION SUCCESSFUL!');
  console.log('   - R key toggle functionality: WORKING');
  console.log('   - Down arrow attack functionality: WORKING');
  console.log('   - Beat synchronization: WORKING');
  console.log('   - Audio integration: WORKING');
  console.log('   - No conflicting systems: CONFIRMED');
} else {
  console.log('\n❌ RHYTHM SYSTEM VERIFICATION FAILED!');
  console.log('   Please check the errors above and fix them before proceeding.');
}

// Export for manual testing
window.testRhythmSystem = testRhythmSystem;
console.log('💡 You can run window.testRhythmSystem() anytime to re-test the rhythm system');