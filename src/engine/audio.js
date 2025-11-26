// Audio system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/audio.js',
  exports: ['AudioSystem', 'audioSystem'],
  dependencies: []
});

window.AudioSystem = class AudioSystem {
  constructor() {
    this.context = null;
    this.masterGain = null;
    this.rhythmGain = null;
    this.sfxGain = null;
    this.initialized = false;
    
    // Title screen music retry tracking
    this.titleMusicRetryCount = 0;
    this.maxTitleMusicRetries = 5;
    
    // Audio buffers
    this.sounds = {};
    
    // Music system - simultaneous layers
    this.musicTracks = {};
    this.currentMusicTrack = null;
    this.musicGain = null;
    this.musicContext = { state: 'exploration' }; // exploration, combat, rhythm, tutorial
    this.crossfadeInterval = null;
    this.layersStarted = false; // Track if all layers are playing simultaneously
    
    // Music loop system
    this.loopStartTime = 0; // When current loop started
    this.loopDuration = 60; // Default 60 second loop duration (will be updated from actual track lengths)
    this.loopCheckInterval = null;
    this.isLooping = false; // Track if we're currently restarting the loop
    
    // Rhythm beat generation
    this.beatScheduler = null;
    this.nextBeatTime = 0;
    this.beatInterval = 0;
    this.currentBeat = 0;
    this.beatSyncActive = false;
    this.syncBeatCount = 0; // Track sync calls for logging
    this.firstBeatTime = null; // Fixed reference point for precise timing
    
    // Audio visualization
    this.analyser = null;
    this.dataArray = null;
    this.visualizationData = { bass: 0, mid: 0, high: 0 };
    
    // Enemy proximity sound system
    this.enemySounds = {};
    this.enemySoundGainNodes = {};
    
    // Cutscene music system
    this.cutsceneMusic = null;
    this.cutsceneSource = null;
    this.cutsceneGain = null;
  }

  async init() {
    // Prevent duplicate initialization
    if (this.initialized) {
      console.log('Audio system already initialized, skipping duplicate init');
      return;
    }
    
    try {
      // Create audio context
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      
      if (!window.AudioContext && !window.webkitAudioContext) {
        console.log('Web Audio API not supported in this browser');
        this.initialized = false;
        return;
      }
      
      this.context = new AudioContext();
      console.log('Audio context created:', this.context.state);
      console.log('Audio context sample rate:', this.context.sampleRate);
      
      // Create gain nodes
      this.masterGain = this.context.createGain();
      this.rhythmGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      
      // Create analyser for visualization
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      
      // Resume audio context if suspended (browser policy)
      if (this.context.state === 'suspended') {
        console.log('Audio context suspended, attempting resume...');
        try {
          const resumeResult = await this.context.resume();
          console.log('Audio context resume result:', resumeResult);
        } catch (resumeError) {
          // Handle specific permission errors gracefully
          if (resumeError.name === 'NotAllowedError' || resumeError.message.includes('permission')) {
            console.log('AudioContext permission denied - audio will start on user interaction');
          } else {
            console.warn('Audio context resume failed:', resumeError?.message || resumeError);
          }
          // Continue with suspended context - some browsers require user interaction
        }
      }
      
      // Connect nodes
      this.masterGain.connect(this.context.destination);
      this.rhythmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      
      // Set initial music volume
      this.musicGain.gain.value = 0.8; // Higher volume for audible background music
      
      // Generate synthetic sounds
      await this.generateSounds();
      
      // Load external sound effects
      await this.loadSoundEffects();
      
      // Load rhythm success sounds
      await this.loadRhythmSuccessSounds();
      
      // Load player damage sound
      await this.loadPlayerDamageSound();
      
      // Load enemy sounds
      await this.loadEnemySounds();
      
      // Debug whoosh sound loading
      console.log('🚀 Whoosh sounds status after loading:', {
        whoosh1: !!this.sounds['whoosh1'],
        whoosh2: !!this.sounds['whoosh2'],
        availableSounds: Object.keys(this.sounds).filter(key => key.includes('whoosh'))
      });
      
      // Load title screen music
      console.log('🎵 Loading title screen music...');
      await this.loadTitleScreenMusic();
      console.log('🎵 Title screen music load completed, status:', !!this.titleScreenMusic, 'isLoaded:', this.titleScreenMusic?.isLoaded);
      
      // Load cutscene music
      await this.loadCutsceneMusic();
      
      // Load music tracks
      await this.loadMusicTracks();
      
      // CRITICAL: Force create ALL fallback tracks first, then start layers
      console.log('Creating fallback tracks for all missing audio...');
      const requiredTracks = ['foundation', 'bass-layer', 'fx-layer'];
      
      for (const trackName of requiredTracks) {
        if (!this.musicTracks[trackName]) {
          console.log(`Creating fallback for ${trackName}`);
          try {
            const fallback = this.createFallbackMusic(trackName);
            if (fallback) {
              this.musicTracks[trackName] = fallback;
              console.log(`✓ Created fallback for ${trackName}`);
            } else {
              console.error(`Failed to create fallback for ${trackName}`);
            }
          } catch (error) {
            console.error(`Error creating fallback for ${trackName}:`, error?.message || error?.toString() || 'Unknown error');
          }
        }
      }
      
      // NOW start all tracks after ensuring fallbacks exist
      console.log('All tracks available, starting layers...');
      console.log('Available tracks:', Object.keys(this.musicTracks));
      
      // CRITICAL: Do NOT start music during initialization - wait for game start after cutscenes
      if (this.musicTracks['foundation']) {
        console.log('Music tracks loaded - waiting for game start after cutscenes');
        
        // CRITICAL: Do NOT start rhythm system yet - wait for game start
        setTimeout(() => {
          console.log('🎵 Music system waiting - will start after cutscenes complete');
          console.log('🎵 Rhythm system also waiting - will start simultaneously with music');
        }, 200);
      } else {
        console.error('CRITICAL: Foundation track still not available after fallback creation');
      }
      
      this.initialized = true;
      console.log('Audio system initialized');
      
    } catch (error) {
        console.log('Audio initialization failed:', error);
      this.initialized = false;
    }
  }

  // Generate synthetic sounds using Web Audio API oscillators
  async generateSounds() {
    // Kick drum (bass hit)
    this.sounds.kick = this.createKickSound();
    
    // Snare drum (sharp hit)
    this.sounds.snare = this.createSnareSound();
    
    // Hi-hat (short metallic)
    this.sounds.hihat = this.createHihatSound();
    
    // Synth hit (for rhythm attacks)
    this.sounds.synthHit = this.createSynthHitSound();
    
    // Success sound (for perfect timing)
    this.sounds.success = this.createSuccessSound();
    
    // Terminal sounds for hacking
    this.sounds.terminalBeep = this.createTerminalBeepSound();
    this.sounds.terminalBuzz = this.createTerminalBuzzSound();
  }

  createKickSound() {
    const duration = 0.15;
    return () => {
      const now = this.context.currentTime;
      
      // Main kick oscillator
      const kick = this.context.createOscillator();
      kick.frequency.setValueAtTime(150, now);
      kick.frequency.exponentialRampToValueAtTime(0.01, now + duration);
      
      // Kick envelope
      const kickEnvelope = this.context.createGain();
      kickEnvelope.gain.setValueAtTime(0.8, now);
      kickEnvelope.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      // Connect and play
      kick.connect(kickEnvelope);
      kickEnvelope.connect(this.rhythmGain);
      kick.start(now);
      kick.stop(now + duration);
      
      return now + duration;
    };
  }

  createSnareSound() {
    return () => {
      const now = this.context.currentTime;
      const duration = 0.1;
      
      // Noise component
      const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.context.createBufferSource();
      noise.buffer = noiseBuffer;
      
      // Noise filter
      const noiseFilter = this.context.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 3000;
      
      // Noise envelope
      const noiseEnvelope = this.context.createGain();
      noiseEnvelope.gain.setValueAtTime(0.5, now);
      noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      // Tone component
      const tone = this.context.createOscillator();
      tone.frequency.value = 200;
      
      // Tone envelope
      const toneEnvelope = this.context.createGain();
      toneEnvelope.gain.setValueAtTime(0.3, now);
      toneEnvelope.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.5);
      
      // Connect and play
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseEnvelope);
      noiseEnvelope.connect(this.rhythmGain);
      
      tone.connect(toneEnvelope);
      toneEnvelope.connect(this.rhythmGain);
      
      noise.start(now);
      tone.start(now);
      noise.stop(now + duration);
      tone.stop(now + duration);
      
      return now + duration;
    };
  }

  createHihatSound() {
    return () => {
      const now = this.context.currentTime;
      const duration = 0.05;
      
      // Noise buffer
      const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.context.createBufferSource();
      noise.buffer = noiseBuffer;
      
      // High-pass filter for metallic sound
      const filter = this.context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 8000;
      
      // Envelope
      const envelope = this.context.createGain();
      envelope.gain.setValueAtTime(0.2, now);
      envelope.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      // Connect and play
      noise.connect(filter);
      filter.connect(envelope);
      envelope.connect(this.rhythmGain);
      
      noise.start(now);
      noise.stop(now + duration);
      
      return now + duration;
    };
  }

  createSynthHitSound() {
    return () => {
      const now = this.context.currentTime;
      const duration = 0.2;
      
      // Create chord for richer sound
      const frequencies = [440, 554.37, 659.25]; // A major chord
      
      frequencies.forEach(freq => {
        const osc = this.context.createOscillator();
        osc.frequency.value = freq;
        osc.type = 'sawtooth';
        
        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.1, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        // Filter for synthetic sound
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.frequency.exponentialRampToValueAtTime(200, now + duration);
        
        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + duration);
      });
      
      return now + duration;
    };
  }

  createSuccessSound() {
    return () => {
      const now = this.context.currentTime;
      const duration = 0.3;
      
      // Rising arpeggio for success
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const osc = this.context.createOscillator();
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        const envelope = this.context.createGain();
        const startTime = now + (i * 0.05);
        envelope.gain.setValueAtTime(0, startTime);
        envelope.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        envelope.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        
        osc.connect(envelope);
        envelope.connect(this.sfxGain);
        
        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
      
      return now + duration;
    };
  }

  // Terminal beep sound for successful hacks
  createTerminalBeepSound() {
    return () => {
      const now = this.context.currentTime;
      const duration = 0.15;
      
      // Main beep oscillator - clean sine wave
      const beep = this.context.createOscillator();
      beep.frequency.value = 1000; // 1kHz - classic terminal beep frequency
      beep.type = 'sine';
      
      // Beep envelope
      const beepEnvelope = this.context.createGain();
      beepEnvelope.gain.setValueAtTime(0.3, now);
      beepEnvelope.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      // Add a quick chirp at the start for character
      const chirp = this.context.createOscillator();
      chirp.frequency.setValueAtTime(800, now);
      chirp.frequency.exponentialRampToValueAtTime(1200, now + 0.02);
      chirp.type = 'sine';
      
      const chirpEnvelope = this.context.createGain();
      chirpEnvelope.gain.setValueAtTime(0.2, now);
      chirpEnvelope.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
      
      // Connect and play
      beep.connect(beepEnvelope);
      beepEnvelope.connect(this.sfxGain);
      
      chirp.connect(chirpEnvelope);
      chirpEnvelope.connect(this.sfxGain);
      
      beep.start(now);
      chirp.start(now);
      beep.stop(now + duration);
      chirp.stop(now + 0.02);
      
      return now + duration;
    };
  }

  // Terminal buzz sound for failed hacks
  createTerminalBuzzSound() {
    return () => {
      const now = this.context.currentTime;
      const duration = 0.3;
      
      // Create low frequency buzz
      const buzz = this.context.createOscillator();
      buzz.frequency.value = 120; // Low frequency for buzz
      buzz.type = 'sawtooth';
      
      // Buzz envelope - quick attack, longer decay
      const buzzEnvelope = this.context.createGain();
      buzzEnvelope.gain.setValueAtTime(0.2, now);
      buzzEnvelope.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      // Add some noise for harshness
      const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() - 0.5) * 0.3;
      }
      
      const noise = this.context.createBufferSource();
      noise.buffer = noiseBuffer;
      
      // Low-pass filter for muffled sound
      const noiseFilter = this.context.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 500;
      
      const noiseEnvelope = this.context.createGain();
      noiseEnvelope.gain.setValueAtTime(0.15, now);
      noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, now + duration);
      
      // Connect and play
      buzz.connect(buzzEnvelope);
      buzzEnvelope.connect(this.sfxGain);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseEnvelope);
      noiseEnvelope.connect(this.sfxGain);
      
      buzz.start(now);
      noise.start(now);
      buzz.stop(now + duration);
      noise.stop(now + duration);
      
      return now + duration;
    };
  }

  // Play a sound effect
  playSound(soundName, volume = 1.0) {
    if (!this.initialized || !this.sounds[soundName]) return;
    
    try {
      this.sounds[soundName]();
    } catch (error) {
      console.error('Error playing sound:', soundName, error?.message || error?.toString() || 'Unknown error');
    }
  }
  
  // Play random whoosh sound for ships flying past
  playRandomWhoosh() {
    const whooshSounds = ['whoosh1', 'whoosh2'];
    
    // Check which whoosh sounds are actually available
    const availableWhooshSounds = whooshSounds.filter(sound => this.sounds[sound]);
    
    if (availableWhooshSounds.length === 0) {
      console.warn('🚀 No whoosh sounds available - using fallback');
      // Play a synthetic whoosh as fallback
      this.playSound('synthHit'); // Use existing synth hit as fallback
      return;
    }
    
    const randomWhoosh = availableWhooshSounds[Math.floor(Math.random() * availableWhooshSounds.length)];
    
    try {
      this.sounds[randomWhoosh]();
      console.log(`🚀 Playing ${randomWhoosh} for passing ship (available: [${availableWhooshSounds.join(', ')}])`);
    } catch (error) {
      console.error('Error playing whoosh sound:', randomWhoosh, error?.message || error?.toString() || 'Unknown error');
      // Try fallback sound
      this.playSound('synthHit');
    }
  }

  // Start rhythm beat track
  startRhythm(bpm = 32) {
    if (!this.initialized) return;
    
    // Stop any existing rhythm to prevent duplicates
    this.stopRhythm();
    
    // CRITICAL: Use ONLY layer beat sync for rhythm mode
    // Beat scheduler conflicts with layer sync and causes duplicate beat calls
    console.log('🎵 Using ONLY layer beat sync for rhythm mode (preventing duplicates)');
    this.startLayerBeatSync();
    
    // Optional: Only start beat scheduler if no layers (fallback mode)
    if (!this.layersStarted) {
      this.beatInterval = 60 / bpm; // seconds
      this.currentBeat = 0;
      this.nextBeatTime = this.context.currentTime + 0.1; // Small delay
      
      // Resume audio context if suspended (browser policy)
      if (this.context.state === 'suspended') {
        this.context.resume();
      }
      
      this.scheduleBeats();
      console.log(`Rhythm beat scheduler started at ${bpm} BPM`);
    } else {
      console.log('Layers active - using layer beat sync instead of scheduler');
    }
  }

  // Stop rhythm beat track
  stopRhythm() {
    if (this.beatScheduler) {
      clearTimeout(this.beatScheduler);
    }
    this.beatScheduler = null;
    this.currentBeat = 0;
  }
  
  // Stop loop detection system
  stopLoopDetection() {
    if (this.loopCheckInterval) {
      clearInterval(this.loopCheckInterval);
      this.loopCheckInterval = null;
    }
    this.isLooping = false;
    console.log('🎵 Loop detection system stopped');
  }

  // Schedule beat patterns
  scheduleBeats() {
    if (!this.initialized) return;
    
    // Don't run automatic beat scheduler when layers are active
    // Layers provide their own rhythm/melody content
    // CRITICAL: Skip beat scheduler when layers are active
    // Layer beat sync provides the timing for rhythm system
    // Beat scheduler would create duplicate sync calls
    
    // CRITICAL: Only run beat scheduler if layers are NOT active
    // When layers are active, layer beat sync handles all timing
    if (!this.layersStarted) {
      // Schedule beats up to 2 seconds ahead
      while (this.nextBeatTime < this.context.currentTime + 2) {
        this.scheduleBeat(this.nextBeatTime, this.currentBeat);
        this.nextBeatTime += this.beatInterval / 4; // 16th notes
        this.currentBeat++;
      }
      
      // Continue scheduling
      this.beatScheduler = setTimeout(() => this.scheduleBeats(), 100);
    } else {
      console.log('🎵 Skipping beat scheduler - layer beat sync is active');
    }
  }

  // Schedule individual beat
  scheduleBeat(time, beat) {
    const beatInMeasure = beat % 16;
    
    // ALWAYS sync with rhythm system if it exists and is running - regardless of visual state
    if (window.rhythmSystem && window.rhythmSystem.isRunning()) {
      console.log('🎵 Audio beat - syncing with rhythm system');
      // Don't play automatic beats during rhythm mode - let user input drive the sound
      // Only sync rhythm system for beat timing
      
      // CRITICAL: Always call syncWithAudioBeat - it handles tempo establishment internally
      setTimeout(() => {
        if (window.rhythmSystem) {
          window.rhythmSystem.syncWithAudioBeat();
        }
      }, (time - this.context.currentTime) * 1000);
    } else {
      console.log('🎵 Audio beat - rhythm system not running, no sync');
      // Default beat patterns: kick on 1, 5, 9, 13; snare on 5, 13; hihats on others
      if (beatInMeasure === 0 || beatInMeasure === 4 || beatInMeasure === 8 || beatInMeasure === 12) {
        // Kick drum
        setTimeout(() => this.playSound('kick'), (time - this.context.currentTime) * 1000);
      }
      
      if (beatInMeasure === 4 || beatInMeasure === 12) {
        // Snare drum  
        setTimeout(() => this.playSound('snare'), (time - this.context.currentTime) * 1000);
      }
      
      if (beatInMeasure % 2 === 1) {
        // Hi-hats on off-beats
        setTimeout(() => this.playSound('hihat'), (time - this.context.currentTime) * 1000);
      }
    }
  }

  // Play rhythm attack sound
  playRhythmAttack(timing = 'good') {
    if (timing === 'excellent' || timing === 'perfect') {
      this.playSuccessRhythmSound();
    } else {
      this.playSound('synthHit');
    }
  }

  // Update visualization data
  updateVisualization() {
    if (!this.analyser || !this.dataArray) return;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate frequency bands
    const bassEnd = Math.floor(this.dataArray.length * 0.1);
    const midEnd = Math.floor(this.dataArray.length * 0.5);
    
    let bass = 0, mid = 0, high = 0;
    
    // Bass frequencies
    for (let i = 0; i < bassEnd; i++) {
      bass += this.dataArray[i];
    }
    bass = bass / bassEnd / 255;
    
    // Mid frequencies
    for (let i = bassEnd; i < midEnd; i++) {
      mid += this.dataArray[i];
    }
    mid = mid / (midEnd - bassEnd) / 255;
    
    // High frequencies
    for (let i = midEnd; i < this.dataArray.length; i++) {
      high += this.dataArray[i];
    }
    high = high / (this.dataArray.length - midEnd) / 255;
    
    this.visualizationData = { bass, mid, high };
  }

  // Get visualization data
  getVisualizationData() {
    return this.visualizationData;
  }

  // Set master volume
  setMasterVolume(volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Set rhythm volume
  setRhythmVolume(volume) {
    if (this.rhythmGain) {
      this.rhythmGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Set SFX volume
  setSFXVolume(volume) {
    if (this.sfxGain) {
      this.sfxGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Load external sound effects (whoosh sounds)
  async loadSoundEffects() {
    // WHOOSH SOUND URLs - Updated with actual working URLs
    const whooshUrls = {
      'whoosh1': [
        'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/4e510bfa-7c4c-4cd5-be98-99669e092b21.mp3',
        'https://api.makko.ai/storage/v1/object/public/audio-assets/whoosh1.mp3',
        '/assets/sounds/whoosh1.mp3'
      ],
      'whoosh2': [
        'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/c5fe25ff-72fd-4a40-a30d-70c1a148920a.mp3',
        'https://api.makko.ai/storage/v1/object/public/audio-assets/whoosh2.mp3',
        '/assets/sounds/whoosh2.mp3'
      ]
    };
    
    console.log('🚀 ATTEMPTING TO LOAD WHOOSH SOUNDS FROM THESE URLS:');
    console.log('whoosh1 URLs:', whooshUrls['whoosh1']);
    console.log('whoosh2 URLs:', whooshUrls['whoosh2']);
    
    for (const [name, urlArray] of Object.entries(whooshUrls)) {
      let soundLoaded = false;
      
      // Try each possible URL for this sound
      for (let i = 0; i < urlArray.length; i++) {
        const url = urlArray[i];
        
        try {
          console.log(`Attempting to load ${name} from URL ${i + 1}/${urlArray.length}: ${url}`);
          
          // Try to load the remote sound
          const response = await fetch(url, { method: 'HEAD' });
          
          if (response.ok) {
            // If HEAD request succeeds, do a full GET for actual data
            const fullResponse = await fetch(url);
            const arrayBuffer = await fullResponse.arrayBuffer();
            
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            
            this.sounds[name] = () => {
              const now = this.context.currentTime;
              const source = this.context.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(this.sfxGain);
              source.start(now);
              return now + audioBuffer.duration;
            };
            
            console.log(`✓ Loaded sound effect ${name} from: ${url}`);
            soundLoaded = true;
            break; // Success, stop trying other URLs
          } else {
            console.log(`Sound effect ${name} not available at ${url} (HTTP ${response.status})`);
          }
        } catch (error) {
          console.log(`Network error loading sound effect ${name} from ${url}:`, error?.message || 'Network error');
        }
      }
      
      // If all URLs failed, create a synthetic fallback
      if (!soundLoaded) {
        console.log(`All URLs failed for ${name}, creating fallback`);
        try {
          this.sounds[name] = this.createWhooshFallback();
          console.log(`✓ Created fallback for sound effect ${name}`);
        } catch (fallbackError) {
          console.error(`Failed to create fallback for ${name}:`, fallbackError?.message || fallbackError?.toString() || 'Unknown error');
        }
      }
    }
  }
  
  // Load enemy-specific sounds
  async loadEnemySounds() {
    const enemySoundUrls = {
      'virus': 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/a26e3d15-d122-4895-81ce-03370b49794f.mp3',
      'corrupted': 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/498c6110-78b1-4452-a6c2-1f4e979e1c5a.mp3',
      'firewall': 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/dc031dbb-5af2-4a78-a93e-f60aff8bb6e6.mp3'
    };
    
    console.log('🦠 Loading enemy sounds...');
    
    for (const [enemyType, url] of Object.entries(enemySoundUrls)) {
      try {
        console.log(`Loading ${enemyType} sound from: ${url}`);
        
        const response = await fetch(url, { method: 'HEAD' });
        
        if (response.ok) {
          const fullResponse = await fetch(url);
          const arrayBuffer = await fullResponse.arrayBuffer();
          
          const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
          
          // Create individual gain node for this enemy type
          const enemyGain = this.context.createGain();
          enemyGain.connect(this.sfxGain);
          enemyGain.gain.value = 0; // Start silent
          
          this.enemySounds[enemyType] = {
            buffer: audioBuffer,
            gainNode: enemyGain,
            sources: [] // Track active sources for this enemy type
          };
          
          console.log(`✓ Loaded enemy sound: ${enemyType}`);
        } else {
          console.log(`Enemy sound ${enemyType} not available (HTTP ${response.status}), creating fallback`);
          this.createEnemySoundFallback(enemyType);
        }
      } catch (error) {
        console.log(`Error loading enemy sound ${enemyType}:`, error?.message || 'Network error');
        this.createEnemySoundFallback(enemyType);
      }
    }
  }
  
  // Create fallback sound for enemy type
  createEnemySoundFallback(enemyType) {
    console.log(`Creating fallback sound for ${enemyType}`);
    
    // Create synthetic enemy sound based on type
    this.enemySounds[enemyType] = {
      oscillator: null,
      gainNode: this.context.createGain(),
      sources: []
    };
    
    this.enemySounds[enemyType].gainNode.connect(this.sfxGain);
    this.enemySounds[enemyType].gainNode.gain.value = 0; // Start silent
    
    // Create different synthetic sounds for different enemy types
    switch(enemyType) {
      case 'virus':
        // Create pulsing electronic sound for virus
        this.enemySounds[enemyType].createSource = () => {
          const osc = this.context.createOscillator();
          const gain = this.context.createGain();
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, this.context.currentTime);
          osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);
          
          gain.gain.setValueAtTime(0, this.context.currentTime);
          gain.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
          
          osc.connect(gain);
          gain.connect(this.enemySounds[enemyType].gainNode);
          
          osc.start();
          osc.stop(this.context.currentTime + 0.3);
          
          return osc;
        };
        break;
        
      case 'corrupted':
        // Create glitchy digital sound for corrupted enemies
        this.enemySounds[enemyType].createSource = () => {
          const osc1 = this.context.createOscillator();
          const osc2 = this.context.createOscillator();
          const gain = this.context.createGain();
          
          osc1.type = 'square';
          osc1.frequency.setValueAtTime(300, this.context.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 0.2);
          
          osc2.type = 'sawtooth';
          osc2.frequency.setValueAtTime(200, this.context.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.25);
          
          gain.gain.setValueAtTime(0, this.context.currentTime);
          gain.gain.linearRampToValueAtTime(0.15, this.context.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.4);
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.enemySounds[enemyType].gainNode);
          
          osc1.start();
          osc2.start();
          osc1.stop(this.context.currentTime + 0.4);
          osc2.stop(this.context.currentTime + 0.4);
          
          return { osc1, osc2 };
        };
        break;
        
      case 'firewall':
        // Create heavy humming sound for firewall enemies
        this.enemySounds[enemyType].createSource = () => {
          const osc1 = this.context.createOscillator();
          const osc2 = this.context.createOscillator();
          const gain = this.context.createGain();
          
          // Low frequency hum for heavy presence
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(80, this.context.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(60, this.context.currentTime + 0.5);
          
          // Higher frequency harmonic for intensity
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(160, this.context.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(120, this.context.currentTime + 0.4);
          
          gain.gain.setValueAtTime(0, this.context.currentTime);
          gain.gain.linearRampToValueAtTime(0.25, this.context.currentTime + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.6);
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.enemySounds[enemyType].gainNode);
          
          osc1.start();
          osc2.start();
          osc1.stop(this.context.currentTime + 0.6);
          osc2.stop(this.context.currentTime + 0.6);
          
          return { osc1, osc2 };
        };
        break;
        
      default:
        // Generic enemy sound
        this.enemySounds[enemyType].createSource = () => {
          const osc = this.context.createOscillator();
          const gain = this.context.createGain();
          
          osc.type = 'square';
          osc.frequency.value = 200;
          
          gain.gain.setValueAtTime(0.1, this.context.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
          
          osc.connect(gain);
          gain.connect(this.enemySounds[enemyType].gainNode);
          
          osc.start();
          osc.stop(this.context.currentTime + 0.2);
          
          return osc;
        };
    }
  }
  
  // Update enemy proximity sounds (call this every frame)
  updateEnemyProximitySounds(playerX, playerY, enemies) {
    if (!this.initialized) return;
    
    const currentTime = this.context.currentTime;
    
    // DEBUG: Log enemy types being checked
    const enemyTypes = enemies.map(e => e.type).filter((v, i, a) => a.indexOf(v) === i);
    if (enemyTypes.includes('firewall') && Date.now() % 2000 < 100) {
      console.log('🔥 Firewall proximity sound check:', enemyTypes, 'firewall sounds available:', !!this.enemySounds['firewall']);
    }
    
    // Group enemies by type and find closest for each type
    const enemiesByType = {};
    
    enemies.forEach(enemy => {
      if (!enemy.active) return;
      
      const enemyType = enemy.type;
      if (!this.enemySounds[enemyType]) return; // Skip if no sound for this type
      
      // Calculate distance to player
      const dx = enemy.position.x - playerX;
      const dy = enemy.position.y - playerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if enemy is on screen (assuming 1920x1080 viewport)
      const camX = playerX; // Assuming camera follows player
      const camY = playerY;
      const screenWidth = 1920;
      const screenHeight = 1080;
      
      const onScreen = (
        enemy.position.x >= camX - screenWidth/2 - 100 &&
        enemy.position.x <= camX + screenWidth/2 + 100 &&
        enemy.position.y >= camY - screenHeight/2 - 100 &&
        enemy.position.y <= camY + screenHeight/2 + 100
      );
      
      if (!enemiesByType[enemyType] || distance < enemiesByType[enemyType].distance) {
        enemiesByType[enemyType] = {
          distance: distance,
          onScreen: onScreen,
          enemy: enemy
        };
      }
    });
    
    // Update volume for each enemy type based on closest enemy
    for (const [enemyType, closestInfo] of Object.entries(enemiesByType)) {
      const soundData = this.enemySounds[enemyType];
      if (!soundData) continue;
      
      let targetVolume = 0;
      
      if (closestInfo.onScreen) {
        // Calculate volume based on distance (closer = louder)
        const maxDistance = 800; // Maximum audible distance
        const minDistance = 50; // Minimum distance for max volume
        
        if (closestInfo.distance <= maxDistance) {
          // Inverse square law with linear falloff for simplicity
          const distanceRatio = Math.max(0, (maxDistance - closestInfo.distance) / (maxDistance - minDistance));
          targetVolume = distanceRatio * 0.8; // Max 80% volume
        }
      }
      
      // Smooth volume transition
      const currentVolume = soundData.gainNode.gain.value;
      const volumeStep = 0.05; // Smooth transition speed
      
      if (Math.abs(targetVolume - currentVolume) > volumeStep) {
        if (targetVolume > currentVolume) {
          soundData.gainNode.gain.value = Math.min(targetVolume, currentVolume + volumeStep);
        } else {
          soundData.gainNode.gain.value = Math.max(targetVolume, currentVolume - volumeStep);
        }
      } else {
        soundData.gainNode.gain.value = targetVolume;
      }
      
      // Play sound effect when volume increases (enemy getting closer)
      if (targetVolume > 0.1 && currentVolume < 0.1) {
        this.playEnemySound(enemyType);
      }
    }
    
    // Fade out enemy types that no longer have enemies nearby
    for (const enemyType of Object.keys(this.enemySounds)) {
      if (!enemiesByType[enemyType]) {
        const soundData = this.enemySounds[enemyType];
        if (soundData && soundData.gainNode.gain.value > 0) {
          // Fade out
          soundData.gainNode.gain.value = Math.max(0, soundData.gainNode.gain.value - 0.02);
        }
      }
    }
  }
  
  // Play enemy sound effect
  playEnemySound(enemyType) {
    const soundData = this.enemySounds[enemyType];
    if (!soundData) return;
    
    try {
      if (soundData.buffer) {
        // Use actual audio buffer
        const source = this.context.createBufferSource();
        source.buffer = soundData.buffer;
        source.connect(soundData.gainNode);
        source.start();
        
        // Clean up after sound finishes
        source.onended = () => {
          const index = soundData.sources.indexOf(source);
          if (index > -1) {
            soundData.sources.splice(index, 1);
          }
        };
        
        soundData.sources.push(source);
      } else if (soundData.createSource) {
        // Use synthetic fallback
        const source = soundData.createSource();
        soundData.sources.push(source);
      }
    } catch (error) {
      console.error(`Error playing enemy sound ${enemyType}:`, error?.message || error);
    }
  }
  
  // Load rhythm success sounds
  async loadRhythmSuccessSounds() {
    const rhythmSuccessUrls = [
      {
        name: 'rhythmSuccess1',
        url: 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/aab8fc0a-ac9b-47f5-9170-e38e4d15e39a.wav'
      },
      {
        name: 'rhythmSuccess2',
        url: 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/3a9cb68b-091e-4133-9d05-f936a780c605.wav'
      },
      {
        name: 'rhythmSuccess3',
        url: 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/9c2ff06d-30bf-4e03-a7c2-5cc3636413bf.wav'
      }
    ];
    
    console.log('🎵 Loading rhythm success sounds...');
    
    // Array to store successfully loaded success sounds
    this.rhythmSuccessSounds = [];
    
    for (const soundData of rhythmSuccessUrls) {
      try {
        console.log(`Attempting to load ${soundData.name} from: ${soundData.url}`);
        
        const response = await fetch(soundData.url, { method: 'HEAD' });
        
        if (response.ok) {
          const fullResponse = await fetch(soundData.url);
          const arrayBuffer = await fullResponse.arrayBuffer();
          
          const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
          
          // Create sound function for this success sound
          this.sounds[soundData.name] = () => {
            const now = this.context.currentTime;
            const source = this.context.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.sfxGain);
            source.start(now);
            return now + audioBuffer.duration;
          };
          
          // Add to success sounds array for random selection
          this.rhythmSuccessSounds.push(soundData.name);
          
          console.log(`✓ Loaded ${soundData.name}`);
        } else {
          console.log(`${soundData.name} not available (HTTP ${response.status})`);
        }
      } catch (error) {
        console.log(`Error loading ${soundData.name}:`, error?.message || 'Network error');
      }
    }
    
    // If no rhythm success sounds loaded, create fallback
    if (this.rhythmSuccessSounds.length === 0) {
      console.log('No rhythm success sounds loaded, using fallback');
      this.sounds.rhythmSuccess = this.createSuccessSound();
      this.rhythmSuccessSounds = ['rhythmSuccess'];
    } else {
      console.log(`✓ Loaded ${this.rhythmSuccessSounds.length} rhythm success sounds: [${this.rhythmSuccessSounds.join(', ')}]`);
    }
  }
  
  // Play rhythm success sound
  playSuccessRhythmSound() {
    // Check if we have rhythm success sounds loaded
    if (this.rhythmSuccessSounds && this.rhythmSuccessSounds.length > 0) {
      try {
        // Select a random rhythm success sound
        const randomSound = this.rhythmSuccessSounds[Math.floor(Math.random() * this.rhythmSuccessSounds.length)];
        
        if (this.sounds[randomSound]) {
          // Play with 10% reduced volume by creating a temporary gain node
          const now = this.context.currentTime;
          const tempGain = this.context.createGain();
          tempGain.gain.value = 0.9; // 10% volume reduction
          
          // Create source from the sound function
          const soundFunction = this.sounds[randomSound];
          soundFunction(); // This creates and connects to sfxGain
          
          // Reduce sfxGain temporarily for 10% volume reduction
          const originalSFXVolume = this.sfxGain.gain.value;
          this.sfxGain.gain.value = originalSFXVolume * 0.9;
          
          // Restore original volume after a short delay
          setTimeout(() => {
            if (this.sfxGain && originalSFXVolume !== undefined) {
              this.sfxGain.gain.value = originalSFXVolume;
            }
          }, 500);
          
          console.log(`🎵 Playing random rhythm success sound with 10% reduced volume: ${randomSound}`);
        } else {
          console.warn(`Selected rhythm sound ${randomSound} not found, using fallback`);
          this.playSound('success');
        }
      } catch (error) {
        console.error('Error playing rhythm success sound:', error?.message || error);
        // Fallback to regular success sound
        this.playSound('success');
      }
    } else {
      // Fallback to regular success sound if no rhythm sounds loaded
      console.log('No rhythm success sounds available, using fallback');
      this.playSound('success');
    }
  }
  
  // Load player damage sound
  async loadPlayerDamageSound() {
    const playerDamageUrl = 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/8d792d94-17c5-43c2-a3b0-b1e1dcf5bff0.wav';
    
    console.log('💥 Loading player damage sound...');
    
    try {
      console.log(`Attempting to load player damage sound from: ${playerDamageUrl}`);
      
      const response = await fetch(playerDamageUrl, { method: 'HEAD' });
      
      if (response.ok) {
        const fullResponse = await fetch(playerDamageUrl);
        const arrayBuffer = await fullResponse.arrayBuffer();
        
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        
        this.sounds.playerDamage = () => {
          const now = this.context.currentTime;
          const source = this.context.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.sfxGain);
          source.start(now);
          return now + audioBuffer.duration;
        };
        
        console.log('✓ Loaded player damage sound');
      } else {
        console.log(`Player damage sound not available (HTTP ${response.status}), creating fallback`);
        this.sounds.playerDamage = this.createPlayerDamageFallback();
      }
    } catch (error) {
      console.log(`Error loading player damage sound:`, error?.message || 'Network error');
      this.sounds.playerDamage = this.createPlayerDamageFallback();
    }
  }
  
  // Create fallback player damage sound
  createPlayerDamageFallback() {
    return () => {
      const now = this.context.currentTime;
      const duration = 0.3;
      
      // Create harsh digital damage sound
      const osc1 = this.context.createOscillator();
      const osc2 = this.context.createOscillator();
      const noise = this.context.createBufferSource();
      
      // Create noise buffer
      const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() - 0.5) * 0.5;
      }
      noise.buffer = noiseBuffer;
      
      // Oscillator 1 - low frequency hit
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(100, now);
      osc1.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      
      // Oscillator 2 - harsh distortion
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(200, now);
      osc2.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      
      // Envelope for harsh impact
      const envelope = this.context.createGain();
      envelope.gain.setValueAtTime(0.6, now); // Loud initial hit
      envelope.gain.exponentialRampToValueAtTime(0.01, now + duration); // Quick fade out
      
      // Filter for digital harshness
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      filter.Q.value = 5;
      
      // Connect nodes
      osc1.connect(filter);
      osc2.connect(filter);
      noise.connect(filter);
      filter.connect(envelope);
      envelope.connect(this.sfxGain);
      
      // Play sound
      osc1.start(now);
      osc2.start(now);
      noise.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
      noise.stop(now + duration);
      
      return now + duration;
    };
  }
  
  // Play player damage sound
  playPlayerDamageSound() {
    if (this.sounds.playerDamage) {
      try {
        this.sounds.playerDamage();
        console.log('💥 Playing player damage sound');
      } catch (error) {
        console.error('Error playing player damage sound:', error?.message || error);
        // Fallback to terminal buzz sound
        this.playSound('terminalBuzz');
      }
    } else {
      // Fallback to terminal buzz sound
      this.playSound('terminalBuzz');
    }
  }
  
  // Create synthetic whoosh sound fallback
  createWhooshFallback() {
    return () => {
      const now = this.context.currentTime;
      const duration = 0.8; // 800ms whoosh
      
      // Create white noise for whoosh effect
      const bufferSize = this.context.sampleRate * duration;
      const noiseBuffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = (Math.random() - 0.5) * 2;
      }
      
      // Create noise source
      const noiseSource = this.context.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      
      // Create filter for whoosh character
      const filter = this.context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 2;
      
      // Create envelope for whoosh shape
      const envelope = this.context.createGain();
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.4, now + 0.1); // Quick attack
      envelope.gain.exponentialRampToValueAtTime(0.3, now + 0.4); // Slight dip
      envelope.gain.exponentialRampToValueAtTime(0.01, now + duration); // Fade out
      
      // Connect nodes
      noiseSource.connect(filter);
      filter.connect(envelope);
      envelope.connect(this.sfxGain);
      
      // Play sound
      noiseSource.start(now);
      noiseSource.stop(now + duration);
      
      return now + duration;
    };
  }

  // Load title screen music
  async loadTitleScreenMusic() {
    const titleScreenUrl = 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/21dd0b0c-3f5f-4d57-92a8-dc8b7b01be03.mp3';
    
    console.log('🎵 Loading title screen music...');
    console.log(`🎵 Attempting to load title screen music from: ${titleScreenUrl}`);
    
    // Create timeout with proper Promise.race pattern
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Audio loading timeout')), 10000);
    });
    
    try {
      // Race between fetch and timeout
      await Promise.race([this.fetchTitleScreenMusic(titleScreenUrl), timeoutPromise]);
    } catch (error) {
      // Handle timeout gracefully
      if (error?.message && error.message.includes('timeout')) {
        console.log('⚠️ Title screen music loading timeout - will proceed without it');
        this.titleScreenMusic = null;
      } else {
        console.error('❌ Error loading title screen music:', error?.message || error?.toString() || 'Unknown error');
        console.error('❌ Error details:', error);
        this.titleScreenMusic = null;
      }
    }
  }
  
  // Helper method for fetching title screen music
  async fetchTitleScreenMusic(titleScreenUrl) {
    // First try HEAD request to check availability
    console.log('🎵 Step 1: Checking title screen music URL availability with HEAD request...');
    const response = await fetch(titleScreenUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log('🎵 Step 2: Title screen music URL available, fetching full audio data...');
      const fullResponse = await fetch(titleScreenUrl);
      
      if (!fullResponse.ok) {
        throw new Error(`Full fetch failed with status: ${fullResponse.status}`);
      }
      
      console.log('🎵 Step 3: Converting title screen music to array buffer...');
      const arrayBuffer = await fullResponse.arrayBuffer();
      
      console.log(`🎵 Step 4: Decoding title screen music audio data (${arrayBuffer.byteLength} bytes)...`);
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      console.log(`🎵 Step 5: Title screen music audio decoded successfully - duration: ${audioBuffer.duration.toFixed(2)}s`);
      
      this.titleScreenMusic = {
        buffer: audioBuffer,
        source: null,
        gain: null,
        isLoaded: true
      };
      
      console.log('✅ Title screen music loaded successfully!');
      console.log('✅ Duration:', audioBuffer.duration.toFixed(2), 'seconds');
      console.log('✅ Sample rate:', audioBuffer.sampleRate, 'Hz');
      console.log('✅ Channels:', audioBuffer.numberOfChannels);
    } else {
      console.error(`❌ Title screen music not available (HTTP ${response.status})`);
      console.error(`❌ Response headers:`, response.headers);
      this.titleScreenMusic = null;
    }
  }
  
  // Play title screen music
  playTitleScreenMusic() {
    console.log('🎵 playTitleScreenMusic called - boot sequence complete');
    console.log('🎵 Audio system status check:');
    console.log('  - initialized:', this.initialized);
    console.log('  - context exists:', !!this.context);
    console.log('  - context state:', this.context?.state || 'no context');
    console.log('  - titleScreenMusic exists:', !!this.titleScreenMusic);
    console.log('  - titleScreenMusic.isLoaded:', this.titleScreenMusic?.isLoaded);
    
    // CRITICAL FIX: Be more permissive with checks - the boot loader timing can be tight
    // Allow playback even if some checks are borderline, as long as we have the essentials
    
    // Check if context exists and is usable
    if (!this.context) {
      console.log('🎵 Audio context not available - cannot play title music');
      return;
    }
    
    // Resume context if needed
    if (this.context.state === 'suspended') {
      console.log('🎵 Resuming audio context for title music...');
      this.context.resume().then(() => {
        console.log('🎵 Audio context resumed, retrying title music play...');
        setTimeout(() => this.playTitleScreenMusic(), 100);
      }).catch(error => {
        console.error('🎵 Failed to resume audio context:', error?.message || error);
      });
      return;
    }
    
    // Check if title music is loaded - be more permissive here
    if (!this.titleScreenMusic || !this.titleScreenMusic.isLoaded) {
      console.log('🎵 Title screen music not loaded - will retry in 2000ms');
      console.log('🎵 titleScreenMusic object:', this.titleScreenMusic);
      // CRITICAL FIX: Auto-retry with longer delay instead of giving up
      setTimeout(() => this.playTitleScreenMusic(), 2000);
      return;
    }
    
    console.log('🎵 All checks passed - starting title screen music after boot sequence complete');
    
    try {
      // Stop any existing music first
      this.stopTitleScreenMusic();
      
      // Create gain and source
      this.titleScreenMusic.gain = this.context.createGain();
      this.titleScreenMusic.gain.gain.value = 0.8;
      
      this.titleScreenMusic.source = this.context.createBufferSource();
      this.titleScreenMusic.source.buffer = this.titleScreenMusic.buffer;
      this.titleScreenMusic.source.loop = true;
      
      // Connect and play
      this.titleScreenMusic.source.connect(this.titleScreenMusic.gain);
      this.titleScreenMusic.gain.connect(this.masterGain);
      this.titleScreenMusic.source.start(0);
      
      console.log('🎵 Title screen music started successfully after boot!');
      console.log('🎵 Music source:', !!this.titleScreenMusic.source);
      console.log('🎵 Music gain:', !!this.titleScreenMusic.gain);
      console.log('🎵 Music gain value:', this.titleScreenMusic.gain.gain.value);
    } catch (error) {
      console.error('🎵 Error playing title screen music:', error?.message || error);
      console.error('🎵 Error stack:', error?.stack || 'No stack available');
      // CRITICAL FIX: Retry on error with longer delay instead of giving up
      setTimeout(() => this.playTitleScreenMusic(), 2000);
    }
  }
  
  // Helper method for fetching cutscene music
  async fetchCutsceneMusic(cutsceneUrl) {
    // First try HEAD request to check availability
    console.log('🎬 Step 1: Checking URL availability with HEAD request...');
    const response = await fetch(cutsceneUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log('🎬 Step 2: URL available, fetching full audio data...');
      const fullResponse = await fetch(cutsceneUrl);
      
      if (!fullResponse.ok) {
        throw new Error(`Full fetch failed with status: ${fullResponse.status}`);
      }
      
      console.log('🎬 Step 3: Converting to array buffer...');
      const arrayBuffer = await fullResponse.arrayBuffer();
      
      console.log(`🎬 Step 4: Decoding audio data (${arrayBuffer.byteLength} bytes)...`);
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      console.log(`🎬 Step 5: Audio decoded successfully - duration: ${audioBuffer.duration.toFixed(2)}s`);
      
      this.cutsceneMusic = {
        buffer: audioBuffer,
        isLoaded: true
      };
      
      console.log('✅ Cutscene music loaded successfully!');
      console.log('✅ Duration:', audioBuffer.duration.toFixed(2), 'seconds');
      console.log('✅ Sample rate:', audioBuffer.sampleRate, 'Hz');
      console.log('✅ Channels:', audioBuffer.numberOfChannels);
    } else {
      console.error(`❌ Cutscene music not available (HTTP ${response.status})`);
      console.error(`❌ Response headers:`, response.headers);
      this.cutsceneMusic = null;
    }
  }
  
  // Stop title screen music
  stopTitleScreenMusic() {
    if (this.titleScreenMusic && this.titleScreenMusic.source) {
      try {
        this.titleScreenMusic.source.stop();
        this.titleScreenMusic.source = null;
        this.titleScreenMusic.gain = null;
      } catch (error) {
        console.log('Error stopping title screen music:', error);
      }
    }
    
    console.log('🎵 Title screen music stopped');
  }
  
  // Load cutscene music
  async loadCutsceneMusic() {
    const cutsceneUrl = 'https://api.makko.ai/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/ad312365-af12-4019-a3f5-6ef3841ba959.mp3';
    
    console.log('🎬 Loading cutscene music...');
    console.log(`🎬 Attempting to load from: ${cutsceneUrl}`);
    
    // Create timeout with proper Promise.race pattern
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cutscene audio loading timeout')), 10000);
    });
    
    try {
      // Race between fetch and timeout
      await Promise.race([this.fetchCutsceneMusic(cutsceneUrl), timeoutPromise]);
    } catch (error) {
      // Handle timeout gracefully
      if (error?.message && error.message.includes('timeout')) {
        console.log('⚠️ Cutscene music loading timeout - will proceed without it');
        this.cutsceneMusic = null;
      } else {
        console.error('❌ Error loading cutscene music:', error?.message || error?.toString() || 'Unknown error');
        console.error('❌ Error details:', error);
        this.cutsceneMusic = null;
      }
    }
  }
  
  // Load music tracks
  async loadMusicTracks() {
    const trackUrls = {
      'foundation': 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/2133657a-6dbe-47c0-b4c3-4cb9849b3c58.mp3',
      'bass-layer': 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/5089debd-8927-4409-88f1-785be8508686.mp3',
      'fx-layer': 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/1e86d080-84ac-45df-b591-5e433ae5ec8f.mp3'
    };
    
    for (const [name, url] of Object.entries(trackUrls)) {
      let trackLoaded = false;
      
      // Create timeout for each track
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Music track ${name} loading timeout`)), 8000);
      });
      
      try {
        // Race between fetch and timeout
        await Promise.race([this.fetchMusicTrack(name, url), timeoutPromise]);
        trackLoaded = true;
      } catch (error) {
        // Handle timeout gracefully
        if (error?.message && error.message.includes('timeout')) {
          console.log(`⚠️ Music track ${name} loading timeout - creating fallback`);
        } else {
          // Network or fetch error - create fallback immediately
          console.log(`Network error loading track ${name}, creating fallback:`, error?.message || 'Network error');
        }
      }
      
      // If remote loading failed, always create fallback
      if (!trackLoaded) {
        try {
          const fallback = this.createFallbackMusic(name);
          if (fallback) {
            this.musicTracks[name] = fallback;
            console.log(`✓ Created fallback for track ${name}`);
          } else {
            console.error(`Failed to create fallback for track ${name}`);
          }
        } catch (fallbackError) {
          console.error(`Critical error creating fallback for ${name}:`, fallbackError?.message || fallbackError?.toString() || 'Unknown error');
        }
      }
    }
  }
  
  // Helper method for fetching individual music tracks
  async fetchMusicTrack(name, url) {
    // Try to load the remote track with proper error handling
    const response = await fetch(url, { method: 'HEAD' });
    
    if (response.ok) {
      // If HEAD request succeeds, do a full GET for actual data
      const fullResponse = await fetch(url);
      const arrayBuffer = await fullResponse.arrayBuffer();
      
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      
      this.musicTracks[name] = {
        buffer: audioBuffer,
        source: null,
        startTime: 0,
        pauseTime: 0,
        isPlaying: false,
        volume: 1.0,
        gain: null,
        isFallback: false
      };
      
      console.log(`✓ Loaded music track: ${name}`);
    } else {
      // HEAD request failed - throw error to trigger fallback
      throw new Error(`Remote track ${name} not available (HTTP ${response.status})`);
    }
  }
  
  // Create synthetic fallback music for missing files
  createFallbackMusic(trackName) {
    const duration = trackName === 'fx-layer' ? 30 : 60; // Shorter for FX layer
    
    // Ensure context exists and system is initialized
    if (!this.context) {
      console.error('Audio context not available for fallback music');
      return null;
    }
    
    try {
      const sampleRate = this.context.sampleRate;
      
      // Create audio buffer with error handling
      const buffer = this.context.createBuffer(2, sampleRate * duration, sampleRate);
      
      // Generate different patterns for each track
      for (let channel = 0; channel < 2; channel++) {
        const channelData = buffer.getChannelData(channel);
        
        for (let i = 0; i < channelData.length; i++) {
          const t = i / sampleRate;
          let sample = 0;
          
          switch(trackName) {
            case 'foundation':
              // Ambient synth pads for foundation layer
              sample = (
                Math.sin(2 * Math.PI * 110 * t) * 0.1 + // Bass
                Math.sin(2 * Math.PI * 220 * t) * 0.05 + // Mid
                Math.sin(2 * Math.PI * 440 * t) * 0.03 // High
              ) * Math.sin(2 * Math.PI * 0.5 * t) * 0.3; // Slow modulation
              break;
              
            case 'bass-layer':
              // Driving beat pattern for bass layer
              const beatFreq = t % 2 < 1 ? 80 : 120; // Alternating bass
              sample = (
                Math.sin(2 * Math.PI * beatFreq * t) * 0.15 +
                Math.sin(2 * Math.PI * 440 * t) * 0.1 +
                Math.random() * 0.02 // Noise texture
              ) * 0.4;
              break;
              
            case 'fx-layer':
              // Atmospheric FX layer without drums to avoid conflicts
              sample = (
                Math.sin(2 * Math.PI * 440 * t) * 0.1 * Math.sin(2 * Math.PI * 0.25 * t) + // Modulated synth
                Math.sin(2 * Math.PI * 880 * t) * 0.05 + // Higher harmony
                Math.random() * 0.01 // Subtle noise texture
              ) * 0.2;
              break;
              
            default:
              // Default ambient pattern for unknown tracks
              sample = Math.sin(2 * Math.PI * 220 * t) * 0.1 * Math.sin(2 * Math.PI * 0.3 * t);
              break;
          }
          
          // Apply gentle limiting to prevent clipping
          channelData[i] = Math.max(-1, Math.min(1, sample));
        }
      }
      
      return {
        buffer: buffer,
        source: null,
        startTime: 0,
        pauseTime: 0,
        isPlaying: false,
        volume: 1.0,
        gain: null,
        isFallback: true,
        duration: duration
      };
      
    } catch (error) {
      console.error(`Failed to create fallback buffer for ${trackName}:`, error?.message || error?.toString() || 'Unknown error');
      return null;
    }
  }
  
  // Start foundation layer (now starts all layers simultaneously)
  startFoundationLayer() {
    console.log('startFoundationLayer called - starting all layers simultaneously');
    this.startAllLayersSimultaneously();
  }
  
  // Start all layers simultaneously and control via muting
  startAllLayers() {
    console.log('Audio: startAllLayers() called, using synchronized restart');
    
    if (!this.initialized) {
      console.log('Audio: Skipping startAllLayers - not initialized');
      return;
    }
    
    // Use improved synchronized method
    this.startAllLayersSimultaneously();
  }
  
  // Start all layers simultaneously
  startAllLayersSimultaneously() {
    if (!this.initialized) {
      console.log('Audio system not initialized - cannot start layers');
      return;
    }
    
    // Prevent duplicate simultaneous starts
    if (this.layersStarted) {
      console.log('Layers already started simultaneously');
      return;
    }
    
    // CRITICAL: Start loop detection when music starts
    this.startLoopDetection();
    
    const layerNames = ['foundation', 'bass-layer', 'fx-layer'];
    
    // Find the shortest buffer length to use as sync reference
    let shortestDuration = Infinity;
    layerNames.forEach(layerName => {
      const track = this.musicTracks[layerName];
      if (track && track.buffer) {
        shortestDuration = Math.min(shortestDuration, track.buffer.duration);
      }
    });
    
    // PERFECT SYNC: Clean restart with exact synchronization
    
    // Stop all existing sources first
    layerNames.forEach(layerName => {
      const track = this.musicTracks[layerName];
      if (track && track.source) {
        try {
          track.source.stop();
          track.source = null;
          track.isPlaying = false;
          track.gain = null;
        } catch (error) {
          console.log(`Error stopping source for ${layerName}:`, error);
        }
      }
    });
    
    // Get exact start time for perfect sync
    const syncTime = this.context.currentTime + 0.01; // 10ms preparation
    
    console.log('Creating perfectly synchronized layers...');
    console.log(`Sync time: ${syncTime}`);
    
    // Create all sources and start them at exactly the same time
    layerNames.forEach(layerName => {
      const track = this.musicTracks[layerName];
      if (!track || !track.buffer) {
        console.log(`Track ${layerName} not available`);
        return;
      }
      
      // Create new source
      const source = this.context.createBufferSource();
      source.buffer = track.buffer;
      source.loop = true;
      
      // Create gain
      const layerGain = this.context.createGain();
      
      // Set appropriate volume
      let targetVolume = 0;
      switch(layerName) {
        case 'foundation':
          targetVolume = 0.8;
          break;
        case 'bass-layer':
          targetVolume = 0; // Silent initially
          break;
        case 'fx-layer':
          targetVolume = 0; // Silent initially
          break;
      }
      
      layerGain.gain.value = targetVolume;
      
      // Connect nodes
      source.connect(layerGain);
      layerGain.connect(this.musicGain);
      
      // Start at exact sync time
      source.start(syncTime, 0);
      
      // Update track info
      track.source = source;
      track.startTime = syncTime;
      track.gain = layerGain;
      track.isPlaying = true;
      track.volume = targetVolume;
      
      console.log(`Perfect sync start: ${layerName} at ${syncTime} with volume ${targetVolume}`);
    });
    
    this.layersStarted = true;
    
    // Initialize layer system after sync
    setTimeout(() => {
      this.updateLayers();
      console.log('Layer system activated after perfect synchronization');
    }, 100);
  }
  
  // ========================================
  // MUSIC LOOP DETECTION SYSTEM
  // ========================================
  
  // Start automatic loop detection
  startLoopDetection() {
    // Clear any existing loop check
    if (this.loopCheckInterval) {
      clearInterval(this.loopCheckInterval);
    }
    
    // Calculate actual loop duration from track lengths
    this.calculateLoopDuration();
    
    // Start loop timer
    this.loopStartTime = this.context.currentTime;
    this.isLooping = false;
    
    console.log('🎵 Starting loop detection system');
    console.log(`🎵 Loop duration: ${this.loopDuration}s`);
    console.log(`🎵 Loop start time: ${this.loopStartTime}s`);
    
    // Check for loop completion every 500ms for more precise timing
    this.loopCheckInterval = setInterval(() => {
      this.checkLoopCompletion();
    }, 500);
  }
  
  // Calculate actual loop duration - use fixed 3 minutes and 31 seconds
  calculateLoopDuration() {
    // CRITICAL FIX: Use fixed duration of 3 minutes and 31 seconds (211 seconds)
    // This prevents premature restarts and ensures consistent timing
    const targetLoopDuration = 3 * 60 + 31; // 3 minutes and 31 seconds = 211 seconds
    
    let durationDetails = [];
    
    const layerNames = ['foundation', 'bass-layer', 'fx-layer'];
    layerNames.forEach(layerName => {
      const track = this.musicTracks[layerName];
      if (track && track.buffer && track.buffer.duration) {
        const duration = track.buffer.duration;
        console.log(`🎵 Track ${layerName} duration: ${duration.toFixed(3)}s`);
        durationDetails.push(`${layerName}: ${duration.toFixed(3)}s`);
      } else {
        console.log(`🎵 Track ${layerName}: No duration available`);
      }
    });
    
    // CRITICAL FIX: Use FIXED duration of 3 minutes and 31 seconds
    // This prevents random restarts and ensures music plays for the full intended duration
    this.loopDuration = targetLoopDuration;
    console.log(`🎵 LOOP DURATION DETAILS:`);
    console.log(`🎵 All track durations: [${durationDetails.join(', ')}]`);
    console.log(`🎵 Using FIXED duration: ${this.loopDuration}s (3 minutes and 31 seconds) for loop timing`);
    console.log(`🎵 Tracks will restart exactly every 3 minutes and 31 seconds`);
    console.log(`🎵 ENHANCED: Automatic music layers and rhythm beat counter reset every 3:31`);
  }
  
  // Check if current loop is complete and restart if needed
  checkLoopCompletion() {
    if (this.isLooping) {
      return; // Already in process of looping
    }
    
    // CRITICAL: Don't check loops if no layers are playing
    if (!this.layersStarted || !this.musicTracks['foundation'] || !this.musicTracks['foundation'].isPlaying) {
      return; // No active music to loop
    }
    
    // CRITICAL FIX: Only restart when tracks have ACTUALLY completed their full duration
    // No more premature restarts - wait for natural loop completion
    const currentTime = this.context.currentTime;
    const elapsedSinceLoopStart = currentTime - this.loopStartTime;
    
    // CRITICAL: Only trigger restart when we've reached OR EXCEEDED the actual loop duration
    // This ensures tracks play through completely before restarting
    const shouldLoop = elapsedSinceLoopStart >= this.loopDuration;
    
    // Enhanced logging for 3:31 reset tracking
    const timeRemaining = Math.max(0, this.loopDuration - elapsedSinceLoopStart);
    if (timeRemaining > 0 && timeRemaining <= 10) {
      // Log countdown when less than 10 seconds remaining
      console.log(`🎵 3:31 LOOP COUNTDOWN: ${timeRemaining.toFixed(1)}s remaining until automatic reset`);
    }
    
    if (shouldLoop) {
      console.log(`🎵 3:31 LOOP TRIGGERED: ${elapsedSinceLoopStart.toFixed(2)}s elapsed (target: ${this.loopDuration.toFixed(1)}s)`);
      console.log('🎵 AUTOMATIC RESET: Music layers and rhythm beat counter will restart now');
      console.log('🎵 All tracks have completed full 3 minutes and 31 seconds - restarting ALL tracks simultaneously');
      this.restartMusicLoop();
    }
  }
  
  // Enhanced seamless loop restart for 3:31 automatic reset
  restartMusicLoop() {
    if (this.isLooping) {
      return; // Prevent duplicate restarts
    }
    
    this.isLooping = true;
    console.log('🎵 === 3:31 AUTOMATIC LOOP RESTART ===');
    console.log('🎵 Music layers and rhythm beat counter synchronized reset');
    
    // Step 1: Prepare and reset rhythm system beat counter immediately
    if (window.rhythmSystem) {
      console.log('🎵 Step 1: Preparing rhythm system for 3:31 loop restart');
      
      // Prepare rhythm system for the upcoming loop restart
      window.rhythmSystem.prepareForLoopRestart();
      console.log('🎵 Step 1a: Rhythm system prepared for loop restart');
      
      // Reset beat counter for seamless loop
      window.rhythmSystem.resetBeatCounter();
      console.log('🎵 Step 1b: Rhythm beat counter reset for seamless loop');
    }
    
    // Step 2: Pause all layers for 1 second
    const layerNames = ['foundation', 'bass-layer', 'fx-layer'];
    
    // Fade out layers gradually
    layerNames.forEach(layerName => {
      const track = this.musicTracks[layerName];
      if (track && track.gain) {
        // Fade to 0 over 200ms
        track.gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);
      }
    });
    
    // Step 3: After fade, stop all layers and wait 1 second
    setTimeout(() => {
      layerNames.forEach(layerName => {
        const track = this.musicTracks[layerName];
        if (track && track.source) {
          try {
            track.source.stop();
            track.source = null;
            track.isPlaying = false;
            track.gain = null;
          } catch (error) {
            console.log(`Error stopping ${layerName}:`, error);
          }
        }
      });
      
      this.layersStarted = false;
      
      // Step 4: Wait 1 second, then restart all layers
      setTimeout(() => {
        console.log('🎵 Step 4: Restarting all layers simultaneously');
        
        const restartTime = this.context.currentTime + 0.01;
        
        // Restart all layers at the same time
        layerNames.forEach(layerName => {
          const track = this.musicTracks[layerName];
          if (!track || !track.buffer) {
            return;
          }
          
          const source = this.context.createBufferSource();
          source.buffer = track.buffer;
          source.loop = true;
          
          const layerGain = this.context.createGain();
          const targetVolume = this.getCurrentLayerVolume(layerName);
          
          // Fade in from 0 to target volume
          layerGain.gain.value = 0;
          layerGain.gain.linearRampToValueAtTime(targetVolume, this.context.currentTime + 0.3);
          
          source.connect(layerGain);
          layerGain.connect(this.musicGain);
          source.start(restartTime, 0);
          
          track.source = source;
          track.startTime = restartTime;
          track.gain = layerGain;
          track.isPlaying = true;
          track.volume = targetVolume;
        });
        
        this.layersStarted = true;
        this.loopStartTime = restartTime;
        
        // Step 5: Restart rhythm system completely for fresh 3:31 loop
        if (window.rhythmSystem && window.rhythmSystem.isRunning()) {
          console.log('🎵 Step 5: Restarting rhythm system for fresh 3:31 loop');
          
          // Restart rhythm system for new loop
          window.rhythmSystem.restartForLoop();
          console.log('🎵 Step 5a: Rhythm system restarted for new loop');
          
          // Restart beat sync with fresh timing
          this.beatSyncActive = true;
          this.syncBeatCount = 0;
          this.firstBeatTime = null;
          this.scheduleNextBeatSync();
          console.log('🎵 Step 5b: Beat sync restarted with fresh timing');
        }
        
        this.isLooping = false;
        console.log('🎵 === SEAMLESS LOOP RESTART COMPLETE ===');
      });
    });
  }
  
  // Get current volume for a layer based on active state
  getCurrentLayerVolume(layerName) {
    const activeLayers = this.determineActiveLayers();
    const shouldBeActive = activeLayers.includes(layerName);
    
    if (shouldBeActive) {
      return this.getLayerVolume(layerName);
    } else {
      return 0;
    }
  }
  
  // Play individual layer (for emergency fallback - prefers simultaneous start)
  playLayer(layerName, volume = 0.5) {
    if (!this.initialized) {
      console.log('Audio system not initialized - cannot play layer');
      return;
    }
    
    if (!this.context) {
      console.log('Audio context not available');
      return;
    }
    
    const track = this.musicTracks[layerName];
    if (!track) {
      console.log(`Music layer not available: ${layerName}`);
      return;
    }
    
    if (!track.buffer) {
      console.log(`Track ${layerName} has no audio buffer`);
      return;
    }
    
    // Don't restart if already playing at same volume
    if (track.source && track.isPlaying && track.gain && Math.abs(track.volume - volume) < 0.01) {
      console.log(`Audio: ${layerName} already playing at correct volume ${volume}`);
      return;
    }
    
    // If already playing but volume changed, just update volume
    if (track.source && track.isPlaying && track.gain) {
      console.log(`Audio: ${layerName} volume update - current: ${track.volume}, target: ${volume}`);
      track.gain.gain.value = volume;
      track.volume = volume;
      return;
    }
    
    // For synchronization: try to sync with existing layers if they're playing
    let startTime = this.context.currentTime;
    
    // If other layers are already playing, try to sync this layer with them
    if (this.layersStarted) {
      const foundationTrack = this.musicTracks['foundation'];
      if (foundationTrack && foundationTrack.isPlaying && foundationTrack.startTime) {
        // Calculate offset to sync with foundation layer
        const elapsed = (this.context.currentTime - foundationTrack.startTime) % foundationTrack.buffer.duration;
        startTime = foundationTrack.startTime + elapsed;
        console.log(`Syncing ${layerName} with foundation layer at offset ${elapsed}`);
      }
    }
    
    // Stop existing source if any
    if (track.source) {
      try {
        track.source.stop();
      } catch (error) {
        console.log('Error stopping existing source:', error);
      }
      track.source = null;
      track.isPlaying = false;
      track.gain = null; // Clear gain node when stopping
    }
    
    // Create new source
    const source = this.context.createBufferSource();
    source.buffer = track.buffer;
    source.loop = true;
    
    // Create individual gain for this layer
    const layerGain = this.context.createGain();
    layerGain.gain.value = volume;
    
    // Connect layer gain to music gain
    source.connect(layerGain);
    layerGain.connect(this.musicGain);
    
    try {
      source.start(startTime, 0); // Start at calculated time, offset 0
      console.log(`Started music layer: ${layerName} at volume ${volume}, synced to time ${startTime}`);
    } catch (error) {
      console.error(`Failed to start music layer ${layerName}:`, error?.message || error?.toString() || 'Unknown error');
      return;
    }
    
    // Store layer info
    track.source = source;
    track.startTime = startTime;
    track.pauseTime = 0;
    track.isPlaying = true;
    track.gain = layerGain;
    track.volume = volume;
  }
  
  // Stop individual layer
  stopLayer(layerName) {
    const track = this.musicTracks[layerName];
    if (track && track.source) {
      const pauseTime = this.context.currentTime - track.startTime;
      track.pauseTime = pauseTime % track.buffer.duration;
      
      track.source.stop();
      track.source = null;
      track.isPlaying = false;
      track.gain = null; // Clear gain node when stopping
      
      console.log(`Stopped music layer: ${layerName}`);
    }
  }
  
  // Layer management based on game state
  updateLayers() {
    if (!this.initialized || !this.layersStarted) {
      return;
    }
    
    // CRITICAL: Pause music during cutscenes
    if (window.cutsceneSystem && typeof window.cutsceneSystem.isPlaying === 'function' && window.cutsceneSystem.isPlaying()) {
      // Mute all layers during cutscene
      const layerNames = ['foundation', 'bass-layer', 'fx-layer'];
      layerNames.forEach(layerName => {
        const track = this.musicTracks[layerName];
        if (track && track.gain) {
          track.gain.gain.value = 0;
          track.volume = 0;
        }
      });
      return;
    }
    
    const activeLayers = this.determineActiveLayers();
    const availableLayers = Object.keys(this.musicTracks);
    
    // Debug logging to track bass layer issue
    const bassTrack = this.musicTracks['bass-layer'];
    if (bassTrack) {
      console.log('Bass Layer Debug - isPlaying:', bassTrack.isPlaying, 'hasGain:', !!bassTrack.gain, 'currentVolume:', bassTrack.volume, 'gainValue:', bassTrack.gain?.gain?.value);
    }
    
    // Update volumes instead of starting/stopping tracks (since they're already synchronized)
    availableLayers.forEach(layerName => {
      const shouldBeActive = activeLayers.includes(layerName);
      const track = this.musicTracks[layerName];
      
      if (!track || !track.isPlaying || !track.gain) {
        // Try to start layer if it doesn't exist
        if (layerName === 'bass-layer' && shouldBeActive) {
          console.log('Bass layer missing - attempting to start it');
          this.playLayer(layerName, this.getLayerVolume(layerName));
        }
        return;
      }
      
      const targetVolume = shouldBeActive ? this.getLayerVolume(layerName) : 0;
      
      // Only update if volume needs to change
      if (Math.abs(track.volume - targetVolume) > 0.01) {
        console.log(`Updating ${layerName} volume from ${track.volume} to ${targetVolume}`);
        track.gain.gain.value = targetVolume;
        track.volume = targetVolume;
        
        // Verify change stuck
        if (layerName === 'bass-layer') {
          setTimeout(() => {
            console.log('Bass layer verification - after update:', track.volume, 'gain value:', track.gain.gain.value);
          }, 50);
        }
      }
    });
  }
  
  // Determine which layers should be active
  determineActiveLayers() {
    const layers = ['foundation']; // Foundation always plays
    
    // Enemy detection - add bass layer if enemies present
    if (window.enemyManager) {
      const enemyCount = window.enemyManager.getActiveEnemies().length;
      console.log('Enemy detection - count:', enemyCount);
      
      if (enemyCount > 0) {
        layers.push('bass-layer');
        console.log('Adding bass-layer due to enemies');
      }
    }
    
    // Rhythm mode - add FX layer for rhythm intensity
    if (window.rhythmSystem && window.rhythmSystem.isActive()) {
      layers.push('fx-layer');
      console.log('Adding fx-layer for rhythm mode');
    }
    
    // Hacking mode - add FX layer for hacking atmosphere
    if (window.hackingSystem && window.hackingSystem.isActive()) {
      layers.push('fx-layer');
      console.log('Adding fx-layer for hacking mode');
    }
    
    console.log('Final active layers:', layers);
    return layers;
  }
  
  // Get appropriate volume for layer based on context
  getLayerVolume(layerName) {
    switch(layerName) {
      case 'foundation':
        return 0.4; // Foundation at lower volume as backbone
      case 'bass-layer':
        return 0.6; // Bass more prominent
      case 'fx-layer':
        return 0.8; // FX layer most prominent during rhythm
      default:
        return 0.5;
    }
  }
  
  // Update music based on game state
  updateMusicState(gameState) {
    this.updateLayers(); // Use new layered system instead of old track switching
  }
  
  // Update volume for existing layer
  updateLayerVolume(layerName, volume) {
    const track = this.musicTracks[layerName];
    if (!track) {
      console.log(`Cannot update volume for missing track: ${layerName}`);
      return;
    }
    
    // If track has no gain node, try to start it first
    if (!track.gain) {
      console.log(`Track ${layerName} has no gain node, attempting to start layer`);
      this.playLayer(layerName, volume);
      return;
    }
    
    if (!track.isPlaying) {
      console.log(`Track ${layerName} is not playing, attempting to start`);
      this.playLayer(layerName, volume);
      return;
    }
    
    track.gain.gain.value = volume;
    track.volume = volume;
  }
  
  // Set layer volume (alias for updateLayerVolume)
  setLayerVolume(layerName, volume) {
    const track = this.musicTracks[layerName];
    if (!track) {
      console.log(`Cannot set volume for missing track: ${layerName}`);
      return;
    }
    
    // If track has no gain node, try to start it first
    if (!track.gain) {
      console.log(`Track ${layerName} has no gain node, attempting to start layer`);
      this.playLayer(layerName, volume);
      return;
    }
    
    if (!track.isPlaying) {
      console.log(`Track ${layerName} is not playing, attempting to start`);
      this.playLayer(layerName, volume);
      return;
    }
    
    track.gain.gain.value = volume;
    track.volume = volume;
  }
  
  // Determine appropriate music state
  determineMusicState(gameState) {
    // Check highest priority states first
    if (window.rhythmSystem && window.rhythmSystem.isActive()) {
      return 'rhythm';
    }
    
    if (window.hackingSystem && window.hackingSystem.isActive()) {
      return 'tutorial'; // Use tutorial music for hacking too
    }
    
    if (window.tutorialSystem && typeof window.tutorialSystem.isActive === 'function' && window.tutorialSystem.isActive()) {
      return 'tutorial';
    }
    
    // Check combat state
    if (window.enemyManager) {
      const enemyCount = window.enemyManager.getActiveEnemies().length;
      const player = window.player;
      const inDanger = player && player.health < player.maxHealth * 0.5;
      
      if (enemyCount > 0 && (inDanger || enemyCount > 2)) {
        return 'combat';
      }
    }
    
    return 'exploration';
  }
  
  // Switch to appropriate track based on state
  switchToAppropriateTrack() {
    const trackMap = {
      'exploration': 'main-theme',
      'combat': 'combat-theme',
      'rhythm': 'rhythm-theme',
      'tutorial': 'main-theme' // Use main theme for tutorial/hacking
    };
    
    const targetTrack = trackMap[this.musicContext.state];
    
    if (targetTrack) {
      this.playMusicTrack(targetTrack, true);
    }
  }
  
  // Set music volume
  setMusicVolume(volume) {
    if (this.musicGain) {
      this.musicGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  
  // Get current music state
  getMusicState() {
    return this.musicContext.state;
  }
  
  // Start music system (called after cutscenes complete)
  startMusicSystem() {
    if (!this.initialized) {
      console.log('Audio system not initialized - cannot start music');
      return;
    }
    
    // CRITICAL: Always restart tracks when startMusicSystem() is called
    // This ensures tracks restart from the beginning after cutscenes
    console.log('🎵 FORCING MUSIC RESTART - stopping existing layers and restarting from beginning');
    
    // Stop cutscene music when gameplay starts
    this.stopCutsceneMusic();
    
    // Force stop all existing layers first
    const layerNames = ['foundation', 'bass-layer', 'fx-layer'];
    layerNames.forEach(layerName => {
      const track = this.musicTracks[layerName];
      if (track && track.source) {
        try {
          track.source.stop();
          track.source = null;
          track.isPlaying = false;
          track.gain = null;
          console.log(`🎵 Force stopped existing layer: ${layerName}`);
        } catch (error) {
          console.log(`Error stopping ${layerName}:`, error);
        }
      }
    });
    
    // Reset layersStarted to force fresh restart
    this.layersStarted = false;
    
    // Reset loop timing to start fresh
    this.loopStartTime = this.context.currentTime;
    
    console.log('🎵 Starting music system with FRESH RESTART from beginning');
    this.startAllLayersSimultaneously();
  }
  
  // Play cutscene music
  playCutsceneMusic() {
    console.log('🎬 playCutsceneMusic called - checking conditions...');
    console.log('🎬 initialized:', this.initialized);
    console.log('🎬 cutsceneMusic exists:', !!this.cutsceneMusic);
    console.log('🎬 cutsceneMusic.isLoaded:', this.cutsceneMusic?.isLoaded);
    
    if (!this.initialized) {
      console.log('🎬 Cannot play cutscene music - audio system not initialized');
      return;
    }
    
    if (!this.cutsceneMusic) {
      console.log('🎬 Cannot play cutscene music - cutsceneMusic is null');
      return;
    }
    
    if (!this.cutsceneMusic.isLoaded) {
      console.log('🎬 Cannot play cutscene music - cutsceneMusic not loaded');
      return;
    }
    
    console.log('🎬 All checks passed - playing cutscene music');
    
    // Stop any existing cutscene music
    this.stopCutsceneMusic();
    
    // Create gain node for cutscene music
    this.cutsceneGain = this.context.createGain();
    this.cutsceneGain.gain.value = 0.6; // Moderate volume for cutscenes
    
    // Create and connect source
    this.cutsceneSource = this.context.createBufferSource();
    this.cutsceneSource.buffer = this.cutsceneMusic.buffer;
    this.cutsceneSource.loop = true;
    
    // Connect to master gain (bypass music gain since it's muted during cutscenes)
    this.cutsceneSource.connect(this.cutsceneGain);
    this.cutsceneGain.connect(this.masterGain);
    
    // Start playing
    this.cutsceneSource.start(0);
    
    console.log('🎬 Playing cutscene music');
  }
  
  // Stop cutscene music
  stopCutsceneMusic() {
    if (this.cutsceneSource) {
      try {
        this.cutsceneSource.stop();
        this.cutsceneSource = null;
      } catch (error) {
        console.log('Error stopping cutscene music:', error);
      }
    }
    
    if (this.cutsceneGain) {
      this.cutsceneGain.disconnect();
      this.cutsceneGain = null;
    }
    
    console.log('🎬 Cutscene music stopped');
  }
  
  // Slowly fade out cutscene music from current volume
  slowFadeOutCutsceneMusic(fadeDuration = 12) {
    if (!this.cutsceneGain || !this.initialized) {
      console.log('🎬 Cannot fade - cutscene gain not available or system not initialized');
      return Promise.resolve();
    }
    
    const currentTime = this.context.currentTime;
    const currentVolume = this.cutsceneGain.gain.value;
    
    console.log(`🎬 Starting VERY SLOW fade out from ${currentVolume.toFixed(3)} to 0 over ${fadeDuration} seconds`);
    console.log(`🎬 Extended fade duration for intro music - more cinematic transition`);
    
    // Use exponential ramp for natural audio decay (very gradual)
    // Extended from 8s to 12s for smoother, more cinematic transition
    this.cutsceneGain.gain.exponentialRampToValueAtTime(0.001, currentTime + fadeDuration); // 0.001 instead of 0 to avoid audio issues
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Set to exactly 0 after the ramp completes
        if (this.cutsceneGain) {
          this.cutsceneGain.gain.value = 0;
        }
        console.log('🎬 VERY SLOW fade out complete - 12 second cinematic transition finished');
        resolve();
      }, fadeDuration * 1000);
    });
  }
  
  // Start layer beat sync for rhythm system
  startLayerBeatSync() {
    if (this.layerBeatSyncInterval) {
      clearInterval(this.layerBeatSyncInterval);
    }
    
    // CRITICAL FIX: Use Web Audio API precise timing instead of setInterval to prevent drift
    // 146 BPM = 146/60 = 2.4333 beats per second = 1/2.4333 = 0.411 seconds per beat
    const beatIntervalSeconds = 60 / 146; // 0.41096 seconds - PRECISE
    
    console.log(`🎵 Starting PRECISE beat sync: ${beatIntervalSeconds * 1000}ms intervals (146 BPM)`);
    
    // CRITICAL: Activate beat sync flag
    this.beatSyncActive = true;
    
    // CRITICAL: Use Web Audio API's precise timing instead of setInterval
    // setInterval accumulates timing errors that cause UI drift
    this.scheduleNextBeatSync();
  }
  
  // CRITICAL FIX: More precise beat sync scheduling
  scheduleNextBeatSync() {
    if (!this.context || !window.rhythmSystem || !window.rhythmSystem.isRunning() || !this.beatSyncActive) {
      return;
    }
    
    const beatIntervalSeconds = 60 / 146; // 0.41096 seconds - PRECISE
    const currentTime = this.context.currentTime;
    
    // CRITICAL FIX: Use EXACT timing alignment to prevent any drift
    // Schedule the next beat at PRECISE intervals from a fixed reference point
    if (!this.firstBeatTime) {
      this.firstBeatTime = currentTime;
    }
    
    // Calculate beats elapsed since first beat
    const beatsElapsed = Math.floor((currentTime - this.firstBeatTime) / beatIntervalSeconds);
    const nextBeatTime = this.firstBeatTime + ((beatsElapsed + 1) * beatIntervalSeconds);
    
    // Calculate exact delay until next beat
    const delaySeconds = nextBeatTime - currentTime;
    const delayMs = Math.max(1, delaySeconds * 1000); // Minimum 1ms to prevent issues
    
    // Reduced logging for performance - only log every 16 beats
    if (this.syncBeatCount % 16 === 0) {
      console.log(`🎵 PRECISE SYNC: Beat ${this.syncBeatCount} scheduled in ${delayMs.toFixed(1)}ms`);
    }
    
    this.syncBeatCount++;
    
    // Schedule the sync call using setTimeout for the next beat
    setTimeout(() => {
      if (window.rhythmSystem && window.rhythmSystem.isRunning() && this.beatSyncActive) {
        window.rhythmSystem.syncWithAudioBeat();
        // Recursively schedule the next beat
        this.scheduleNextBeatSync();
      }
    }, delayMs);
  }
  
  // Stop layer beat sync
  stopLayerBeatSync() {
    // Clear interval if exists (legacy support)
    if (this.layerBeatSyncInterval) {
      clearInterval(this.layerBeatSyncInterval);
      this.layerBeatSyncInterval = null;
    }
    
    // CRITICAL: Cancel the recursive scheduling
    this.beatSyncActive = false;
    this.syncBeatCount = 0; // Reset counter
    console.log('Stopped layer beat sync');
  }
  
  // Check if initialized
  isInitialized() {
    return this.initialized;
  }

  // Get audio context state
  getContextState() {
    return this.context ? this.context.state : 'unavailable';
  }
};

// Create global audio system - wait for dependencies to be ready
function createAudioSystem() {
  // Prevent duplicate initialization
  if (window.audioSystem) {
    console.log('Audio system already exists, skipping duplicate creation');
    return;
  }
  
  if (window.AudioContext || window.webkitAudioContext) {
    window.audioSystem = new window.AudioSystem();
    console.log('Audio system created');
  } else {
    console.log('Web Audio API not available, audio system disabled');
  }
}

// Resume audio context on user interaction (fixes browser restrictions)
function setupAudioContextResume() {
  const resumeAudio = async () => {
    if (!window.audioSystem || !window.audioSystem.context) {
      return;
    }
    
    const context = window.audioSystem.context;
    
    // Check if context is suspended and resume it
    if (context.state === 'suspended') {
      try {
        await context.resume();
        console.log('✓ AudioContext resumed successfully by user interaction');
        
        // CRITICAL: DO NOT start music layers here - wait for cutscene to complete
        // Music will start via startMusicSystem() after cutscene intro
        console.log('🎵 AudioContext resumed - music will start after cutscene intro');
        
      } catch (error) {
        // Handle permission errors gracefully
        if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
          console.log('AudioContext permission denied - audio will start on user interaction');
          return;
        }
        console.error('Failed to resume AudioContext:', error?.message || error);
      }
    } else {
      console.log('AudioContext already running, state:', context.state);
      
      // CRITICAL: DO NOT start music layers automatically
      // Music will start via startMusicSystem() after cutscene intro
      console.log('🎵 AudioContext running - music will start after cutscene intro');
    }
  };
  
  // Add multiple listeners to ensure audio starts
  const gameCanvas = document.getElementById('gameCanvas');
  if (gameCanvas) {
    gameCanvas.addEventListener('click', resumeAudio, { once: false });
    gameCanvas.addEventListener('mousedown', resumeAudio, { once: false });
    console.log('Added AudioContext resume handlers to game canvas');
  }
  
  // Add to document with multiple events
  document.addEventListener('click', resumeAudio, { once: false });
  document.addEventListener('keydown', resumeAudio, { once: false });
  document.addEventListener('mousedown', resumeAudio, { once: false });
  document.addEventListener('touchstart', resumeAudio, { once: false });
  
  // Also try to resume immediately after a short delay
  setTimeout(resumeAudio, 1000);
  setTimeout(resumeAudio, 2000);
  
  console.log('Multiple AudioContext resume handlers added - music will start after cutscene');
}

// Initialize audio system when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    createAudioSystem();
    setupAudioContextResume();
  });
} else {
  createAudioSystem();
  setupAudioContextResume();
}