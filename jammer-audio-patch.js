// Jammer audio patch for BARCODE: System Override
// This file adds the missing updateProximityAudio method to JammerEnemy

// Check if JammerEnemy exists and add the method
if (window.JammerEnemy && window.JammerEnemy.prototype) {
  window.JammerEnemy.prototype.updateProximityAudio = function(player) {
    if (!player || !window.audioSystem || !window.audioSystem.initialized) {
      return;
    }
    
    // Calculate distance to player
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate target volume based on distance (inverse square law approximation)
    let targetVolume = 0;
    if (distance <= this.maxDistance) {
      // Linear falloff from max volume at 0 distance to 0 at maxDistance
      const distanceRatio = Math.max(0, 1 - (distance / this.maxDistance));
      targetVolume = distanceRatio * this.baseVolume;
    }
    
    // Smooth volume transition
    if (!this.proximityVolume) this.proximityVolume = 0;
    const volumeStep = 0.02;
    if (Math.abs(targetVolume - this.proximityVolume) > volumeStep) {
      if (targetVolume > this.proximityVolume) {
        this.proximityVolume = Math.min(targetVolume, this.proximityVolume + volumeStep);
      } else {
        this.proximityVolume = Math.max(targetVolume, this.proximityVolume - volumeStep);
      }
    } else {
      this.proximityVolume = targetVolume;
    }
    
    // Initialize audio if not done yet
    if (!this.audioInitialized && this.proximityVolume > 0.01) {
      this.initializeJammerAudio();
    }
    
    // Update audio volume if audio is playing
    if (this.audioGainNode) {
      try {
        this.audioGainNode.gain.value = this.proximityVolume;
      } catch (error) {
        console.warn('Error updating jammer audio volume:', error?.message || error);
      }
    }
    
    // Start/stop audio based on volume
    if (this.proximityVolume > 0.01 && (!this.audioElement || this.audioElement.paused)) {
      this.startJammerAudio();
    } else if (this.proximityVolume <= 0.01 && this.audioElement && !this.audioElement.paused) {
      this.stopJammerAudio();
    }
  };
  
  window.JammerEnemy.prototype.initializeJammerAudio = function() {
    if (this.audioInitialized || !window.audioSystem) {
      return;
    }
    
    try {
      // Create gain node for volume control
      this.audioGainNode = window.audioSystem.context.createGain();
      this.audioGainNode.connect(window.audioSystem.sfxGain); // Connect to SFX gain
      this.audioGainNode.gain.value = 0; // Start silent
      
      this.audioInitialized = true;
      console.log('📡 Jammer audio system initialized');
    } catch (error) {
      console.error('Failed to initialize jammer audio:', error?.message || error);
    }
  };
  
  window.JammerEnemy.prototype.startJammerAudio = function() {
    if (!this.audioInitialized || !window.audioSystem) {
      return;
    }
    
    // Stop existing audio if any
    this.stopJammerAudio();
    
    try {
      // Create audio element for streaming
      this.audioElement = new Audio(this.audioUrl);
      this.audioElement.loop = true;
      this.audioElement.volume = 1; // We control volume through gain node
      
      // Create Web Audio API source from audio element
      const source = window.audioSystem.context.createMediaElementSource(this.audioElement);
      source.connect(this.audioGainNode);
      
      // Start playback
      this.audioElement.play().catch(error => {
        console.warn('Jammer audio autoplay failed:', error?.message || error);
        // Try to start on user interaction
        const startAudio = () => {
          if (this.audioElement) {
            this.audioElement.play().catch(e => console.warn('Jammer audio user interaction failed:', e));
          }
          document.removeEventListener('click', startAudio);
          document.removeEventListener('keydown', startAudio);
        };
        document.addEventListener('click', startAudio, { once: true });
        document.addEventListener('keydown', startAudio, { once: true });
      });
      
      console.log('📡 Jammer audio started');
    } catch (error) {
      console.error('Failed to start jammer audio:', error?.message || error);
    }
  };
  
  window.JammerEnemy.prototype.stopJammerAudio = function() {
    if (this.audioElement && !this.audioElement.paused) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        console.log('📡 Jammer audio stopped');
      } catch (error) {
        console.warn('Error stopping jammer audio:', error?.message || error);
      }
    }
  };
  
  console.log('✅ Jammer audio methods added to JammerEnemy prototype');
} else {
  console.warn('JammerEnemy class not found - audio patch not applied');
}