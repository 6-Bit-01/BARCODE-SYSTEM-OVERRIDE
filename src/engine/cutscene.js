// Cinematic intro cutscene system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/cutscene.js',
  exports: ['CutsceneSystem', 'cutsceneSystem'],
  dependencies: []
});

window.CutsceneSystem = class CutsceneSystem {
  constructor() {
    this.cutsceneImages = [
      { url: 'https://i.postimg.cc/28xQSmxK/SO1.png', loaded: false, element: null },
      { url: 'https://i.postimg.cc/bNRxw8RF/SO2.png', loaded: false, element: null },
      { url: 'https://i.postimg.cc/fTvcRZvC/SO3.png', loaded: false, element: null },
      { url: 'https://i.postimg.cc/dt92Vv9n/SO4.png', loaded: false, element: null },
      { url: 'https://i.postimg.cc/vHvrZMv3/SO5.png', loaded: false, element: null },
      { url: 'https://i.postimg.cc/Yqx6Ckx3/SO6.png', loaded: false, element: null },
      { url: 'https://i.postimg.cc/TYcV3Gcr/SO7.png', loaded: false, element: null },
      { url: 'https://i.postimg.cc/QxqQdsqQ/SO8.png', loaded: false, element: null },
      { url: 'https://i.postimg.cc/QxqQdsqQ/SO8.png', loaded: false, element: null }, // Duplicate image for Mac Modem
      { url: 'https://i.postimg.cc/QxqQdsqQ/SO8.png', loaded: false, element: null }, // Duplicate image for Cache Back
      { url: 'https://i.postimg.cc/65hrpwhV/SO10.png', loaded: false, element: null }
    ];
    
    this.currentImageIndex = 0;
    this.isActive = false;
    this.canSkip = true; // Enable input-based progression only
    this.imageDisplayTime = 2000; // 2 seconds per image (forced display time)
    this.fadeTime = 500; // 0.5 second fade transition
    this.currentImageStartTime = 0;
    this.cutsceneContainer = null;
    this.currentImageElement = null;
    this.onComplete = null;
    this.nextImageTimer = null;
    this.inputDisabled = false;
    this.inputDisableTimer = null;
    
    // Hold to skip system
    this.skipHoldTimer = null;
    this.skipHoldStartTime = 0;
    this.skipHoldDuration = 5000; // 5 seconds to hold
    this.isSkipHoldActive = false;
    this.skipHoldProgress = 0;
    this.skipHoldProgressInterval = null;
    
    // CRT effect properties
    this.glitchIntensity = 0;
    this.scanlineOffset = 0;
    this.colorShift = 0;
    
    // Subtitle text for each image
    this.subtitles = [
      "\"BARCODE Network… offline.\nSignal integrity at <span id='signal-integrity'>0</span>%.\"",
      "\"Unstable frequencies detected.\nUnknown interference rising…\"",
      "\"…hello?\nWhy is everything so loud?\"",
      "\"Memory blocks corrupted.\nSystems rebooting against my will—\"",
      "\"Warning. Unauthorized access.\nSomething is forcing the signal open…\"",
      "\"Control room integrity failing.\nBroadcast collapse imminent.\"",
      "\"If you're hearing this… something went wrong.\nThe tower isn't safe anymore.\"",
      "Mac Modem:\n\"The network's alive, 6.\nAnd it's scared.\"",
      "Cache Back:\n\"We locked memories inside the system.\nProtect them.\"",
      "Miss Bit:\n\"You're our last broadcast.\nDo not screw this up.\"",
      "\"…Alright.\nIf the system won't save itself—\nI will.\"",
      "6 Bit vs 9 Bit\nThe fate of the BARCODE Network hangs in the balance..."
    ];
  }
  
  // Preload all cutscene images
  async preloadImages() {
    console.log('🎬 Preloading cutscene images...');
    
    const loadPromises = this.cutsceneImages.map((imageData, index) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          imageData.loaded = true;
          imageData.element = img;
          console.log(`✅ Cutscene image SO${index + 1} loaded`);
          resolve();
        };
        
        img.onerror = () => {
          console.error(`❌ Failed to load cutscene image SO${index + 1}`);
          // Create fallback colored rectangle
          imageData.loaded = true;
          imageData.element = this.createFallbackImage(index);
          resolve();
        };
        
        img.src = imageData.url;
      });
    });
    
    try {
      await Promise.all(loadPromises);
      console.log('✅ All cutscene images preloaded');
      return true;
    } catch (error) {
      console.error('❌ Error preloading cutscene images:', error);
      return false;
    }
  }
  
  // Create fallback image if loading fails - 69% larger to match new size
  createFallbackImage(index) {
    // Use cached canvas to prevent repeated creation
    if (!window.cutsceneFallbackCanvas) {
      window.cutsceneFallbackCanvas = document.createElement('canvas');
      window.cutsceneFallbackCanvas.width = 1920;
      window.cutsceneFallbackCanvas.height = 1080;
    }
    
    const canvas = window.cutsceneFallbackCanvas;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas before reuse
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create gradient background based on index
    const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
    const hue = (index * 36) % 360;
    gradient.addColorStop(0, `hsl(${hue}, 70%, 20%)`);
    gradient.addColorStop(1, `hsl(${hue + 60}, 70%, 10%)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1920, 1080);
    
    // Add text
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 48px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.fillText(`SCENE ${index + 1}`, 960, 540);
    
    return canvas;
  }
  
  // Start the cutscene sequence
  async start() {
    if (this.isActive) return;
    
    console.log('🎬 Starting intro cutscene...');
    
    // Preload images first
    const preloaded = await this.preloadImages();
    if (!preloaded) {
      console.warn('⚠️ Some images failed to load, continuing with fallbacks');
    }
    
    // Stop any title screen music before starting cutscene music
    if (window.audioSystem && typeof window.audioSystem.stopTitleScreenMusic === 'function') {
      window.audioSystem.stopTitleScreenMusic();
      console.log('🎬 Stopped title screen music before cutscene');
    }
    
    // Start cutscene music
    if (window.audioSystem && typeof window.audioSystem.playCutsceneMusic === 'function') {
      window.audioSystem.playCutsceneMusic();
      console.log('🎬 Cutscene music started');
    } else {
      console.log('🎬 Cutscene music not available');
    }
    
    this.isActive = true;
    this.currentImageIndex = 0;
    this.createCutsceneContainer();
    
    // Start displaying images
    this.showNextImage();
    
    return new Promise((resolve) => {
      this.onComplete = resolve;
    });
  }
  
  // Create the cutscene overlay container
  createCutsceneContainer() {
    // Remove existing container if present
    if (this.cutsceneContainer) {
      this.cutsceneContainer.remove();
    }
    
    this.cutsceneContainer = document.createElement('div');
    this.cutsceneContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000;
      z-index: 9999;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    `;
    
    // Add CRT effect overlay
    const crtOverlay = document.createElement('div');
    crtOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 255, 255, 0.03) 0px,
        transparent 1px,
        transparent 2px,
        rgba(255, 0, 255, 0.03) 3px
      );
      pointer-events: none;
      z-index: 10;
    `;
    this.cutsceneContainer.appendChild(crtOverlay);
    
    // Image container - responsive sizing for fullscreen
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      width: 90vw;
      height: 90vh;
      max-width: 1440px;
      max-height: 1080px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    `;
    
    this.cutsceneContainer.appendChild(imageContainer);
    
    // Subtitle container
    const subtitleContainer = document.createElement('div');
    subtitleContainer.style.cssText = `
      position: absolute;
      bottom: 8vh;
      left: 50%;
      transform: translateX(-50%);
      max-width: 70vw;
      text-align: center;
      z-index: 20;
    `;
    
    this.cutsceneContainer.appendChild(subtitleContainer);
    
    // Skip instruction container with purple/black box
    const skipContainer = document.createElement('div');
    skipContainer.id = 'skip-container';
    skipContainer.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      border: 2px solid #ff00ff;
      box-shadow: 0 0 15px rgba(255, 0, 255, 0.6), inset 0 0 10px rgba(255, 0, 255, 0.1);
      padding: 12px 18px;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.9);
      font-family: 'Share Tech Mono', monospace;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
      z-index: 20;
      width: 200px;
    `;
    
    // Skip instruction text
    const skipText = document.createElement('div');
    skipText.id = 'skip-instruction';
    skipText.innerHTML = 'Press SPACE or CLICK to skip<br><span style="color: #ffaa00; font-size: 12px;">Hold S for 5s to skip all</span>';
    skipContainer.appendChild(skipText);
    
    // Skip hold progress bar - CENTERED INSIDE THE BOX
    const skipHoldBar = document.createElement('div');
    skipHoldBar.id = 'skip-hold-bar';
    skipHoldBar.style.cssText = `
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 8px;
      display: none;
    `;
    
    const skipHoldProgress = document.createElement('div');
    skipHoldProgress.id = 'skip-hold-progress';
    skipHoldProgress.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #ff6600, #ffaa00);
      transition: width 0.1s ease-out;
    `;
    
    skipHoldBar.appendChild(skipHoldProgress);
    skipContainer.appendChild(skipHoldBar);
    
    // Skip hold timer text - CENTERED INSIDE THE BOX
    const skipHoldTimer = document.createElement('div');
    skipHoldTimer.id = 'skip-hold-timer';
    skipHoldTimer.textContent = '';
    skipHoldTimer.style.cssText = `
      color: rgba(255, 255, 255, 0.7);
      font-family: 'Share Tech Mono', monospace;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: center;
      margin-top: 4px;
      display: none;
    `;
    skipContainer.appendChild(skipHoldTimer);
    
    this.cutsceneContainer.appendChild(skipContainer);
    
    // Progress indicator
    const progressIndicator = document.createElement('div');
    progressIndicator.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;
      z-index: 20;
    `;
    
    for (let i = 0; i < this.cutsceneImages.length; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
      `;
      dot.id = `progress-dot-${i}`;
      progressIndicator.appendChild(dot);
    }
    
    this.cutsceneContainer.appendChild(progressIndicator);
    
    // Add to document and ensure fullscreen visibility
    document.body.appendChild(this.cutsceneContainer);
    
    // Force container to front in fullscreen mode
    setTimeout(() => {
      if (this.cutsceneContainer) {
        this.cutsceneContainer.style.zIndex = '99999';
        // Force reflow to ensure visibility
        this.cutsceneContainer.style.display = 'flex';
        this.cutsceneContainer.offsetHeight; // Force reflow
        
        // Ensure fullscreen compatibility
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          console.log('Cutscene detected fullscreen mode - ensuring visibility');
          // Add fullscreen-specific styles
          this.cutsceneContainer.style.position = 'fixed';
          this.cutsceneContainer.style.top = '0';
          this.cutsceneContainer.style.left = '0';
          this.cutsceneContainer.style.width = '100%';
          this.cutsceneContainer.style.height = '100%';
        }
      }
    }, 10);
    
    // Add event listeners
    this.addEventListeners();
    
    // Start CRT effects
    this.startCRTEffects();
  }
  
  // Show the next image in sequence
  showNextImage() {
    console.log(`showNextImage called - active: ${this.isActive}, current index: ${this.currentImageIndex}, total: ${this.cutsceneImages.length}`);
    
    if (!this.isActive || this.currentImageIndex >= this.cutsceneImages.length) {
      console.log('Ending cutscene - reached end or inactive');
      this.endCutscene();
      return;
    }
    
    const imageData = this.cutsceneImages[this.currentImageIndex];
    const imageContainer = this.cutsceneContainer.querySelector('div');
    const subtitleContainer = this.cutsceneContainer.querySelector('div:nth-child(3)');
    
    // Remove previous image immediately (no fade out)
    if (this.currentImageElement) {
      if (this.currentImageElement.parentNode) {
        this.currentImageElement.parentNode.removeChild(this.currentImageElement);
      }
      this.currentImageElement = null;
    }
    
    // Clear any existing images in container
    const container = this.cutsceneContainer.querySelector('div');
    if (container) {
      container.innerHTML = '';
    }
    
    // Create new image element
    this.currentImageElement = document.createElement('img');
    this.currentImageElement.src = imageData.element.src || imageData.element.toDataURL();
    this.currentImageElement.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
      opacity: 0;
      transition: opacity ${this.fadeTime}ms ease-in;
      filter: contrast(1.1) saturate(1.2);
      max-width: 100%;
      max-height: 100%;
    `;
    
    // Add error handling for image loading
    this.currentImageElement.onerror = () => {
      console.error(`Failed to display cutscene image ${this.currentImageIndex}`);
      // Create fallback colored background
      this.currentImageElement.style.display = 'none';
      imageContainer.style.background = `linear-gradient(135deg, hsl(${this.currentImageIndex * 36}, 70%, 20%), hsl(${this.currentImageIndex * 36 + 60}, 70%, 10%))`;
      imageContainer.innerHTML = `<div style="color: #00ffff; font-family: 'Orbitron', monospace; font-size: 48px; text-shadow: 0 0 20px #00ffff;">SCENE ${this.currentImageIndex}</div>`;
    };
    
    imageContainer.appendChild(this.currentImageElement);
    
    // Add subtitle with black background and glowing purple border
    subtitleContainer.innerHTML = `
      <div style="
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #ff00ff;
        box-shadow: 0 0 20px rgba(255, 0, 255, 0.8), inset 0 0 20px rgba(255, 0, 255, 0.2);
        padding: 20px 30px;
        border-radius: 8px;
        display: inline-block;
        opacity: 0;
        transition: opacity ${this.fadeTime}ms ease-in;
      ">
        <div style="
          color: #00ffff;
          font-family: 'Share Tech Mono', monospace;
          font-size: 1.3vw;
          text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
          letter-spacing: 1px;
          line-height: 1.6;
          white-space: pre-line;
        ">${this.subtitles[this.currentImageIndex]}</div>
      </div>
    `;
    
    // Fade in new image and subtitle
    setTimeout(() => {
      if (this.currentImageElement) {
        this.currentImageElement.style.opacity = '1';
      }
      const subtitle = subtitleContainer.querySelector('div');
      if (subtitle) {
        subtitle.style.opacity = '1';
      }
      
      // Animate signal integrity on first image only
      if (this.currentImageIndex === 1) {
        this.animateSignalIntegrity();
      }
      
      // Update progress indicator
      this.updateProgressIndicator();
    }, 50);
    
    // Disable input for 2 seconds (forced display time)
    this.disableInputTemporarily(this.imageDisplayTime);
    
    this.currentImageStartTime = Date.now();
    this.currentImageIndex++;
    
    // Clear any existing timer
    if (this.nextImageTimer) {
      clearTimeout(this.nextImageTimer);
      this.nextImageTimer = null;
    }
    
    // Wait for player input after 2-second display time
    console.log('Image displayed - input disabled for 2 seconds, then player can advance');
  }
  
  // Update progress indicator dots
  updateProgressIndicator() {
    const currentIndex = this.currentImageIndex - 1;
    for (let i = 0; i < this.cutsceneImages.length; i++) {
      const dot = document.getElementById(`progress-dot-${i}`);
      if (dot) {
        if (i === currentIndex) {
          dot.style.background = '#00ffff';
          dot.style.boxShadow = '0 0 10px #00ffff';
        } else if (i < currentIndex) {
          dot.style.background = 'rgba(0, 255, 255, 0.5)';
        } else {
          dot.style.background = 'rgba(255, 255, 255, 0.2)';
        }
      }
    }
  }
  
  // Start CRT visual effects (DISABLED - causing shaking)
  startCRTEffects() {
    // Disabled - no more shaking or glitching
    console.log('CRT effects disabled - preventing image shaking');
  }
  
  // Add event listeners for skipping
  addEventListeners() {
    this.skipHandler = (e) => {
      if ((e.code === 'Space' || e.type === 'click') && !this.inputDisabled) {
        e.preventDefault();
        this.skipCutscene();
      }
    };
    
    // Hold S to skip handlers
    this.skipHoldStartHandler = (e) => {
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.startSkipHold();
      }
    };
    
    this.skipHoldEndHandler = (e) => {
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        this.endSkipHold();
      }
    };
    
    document.addEventListener('keydown', this.skipHandler);
    document.addEventListener('keydown', this.skipHoldStartHandler);
    document.addEventListener('keyup', this.skipHoldEndHandler);
    this.cutsceneContainer.addEventListener('click', this.skipHandler);
  }
  
  // Remove event listeners
  removeEventListeners() {
    if (this.skipHandler) {
      document.removeEventListener('keydown', this.skipHandler);
      document.removeEventListener('keydown', this.skipHoldStartHandler);
      document.removeEventListener('keyup', this.skipHoldEndHandler);
      if (this.cutsceneContainer) {
        this.cutsceneContainer.removeEventListener('click', this.skipHandler);
      }
    }
    
    // Clear skip hold timers
    this.endSkipHold();
  }
  
  // Skip the cutscene
  skipCutscene() {
    if (!this.canSkip || !this.isActive || this.inputDisabled) return;
    
    console.log('⏭️ Player pressed input - advancing to next image');
    // Don't end cutscene, just advance to next image
    this.showNextImage();
  }
  
  // Temporarily disable input for specified duration
  disableInputTemporarily(duration) {
    this.inputDisabled = true;
    
    // Clear any existing timer
    if (this.inputDisableTimer) {
      clearTimeout(this.inputDisableTimer);
    }
    
    this.inputDisableTimer = setTimeout(() => {
      this.inputDisabled = false;
      console.log('✅ Input re-enabled after temporary disable');
    }, duration);
    
    console.log(`⏸️ Input disabled for ${duration}ms`);
  }
  
  // Animate signal integrity from 0 to 26%
  animateSignalIntegrity() {
    const signalElement = document.getElementById('signal-integrity');
    if (!signalElement) {
      console.warn('Signal integrity element not found');
      return;
    }
    
    const startValue = 0;
    const endValue = 26;
    const duration = 1500; // 1.5 seconds to ramp up
    const startTime = Date.now();
    
    const updateSignal = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out animation (slows down as it approaches target)
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOutProgress);
      
      signalElement.textContent = currentValue;
      
      if (progress < 1) {
        requestAnimationFrame(updateSignal);
      } else {
        console.log('✅ Signal integrity animation complete: 26%');
      }
    };
    
    updateSignal();
    console.log('📊 Starting signal integrity animation: 0% → 26%');
  }
  
  // Start skip hold timer
  startSkipHold() {
    if (this.isSkipHoldActive) return; // Already holding
    
    console.log('⏹️ Starting skip hold - 5 seconds to skip all cutscene');
    
    this.isSkipHoldActive = true;
    this.skipHoldStartTime = Date.now();
    this.skipHoldProgress = 0;
    
    // Show skip hold UI elements
    const skipContainer = document.getElementById('skip-container');
    const skipHoldBar = document.getElementById('skip-hold-bar');
    const skipHoldTimer = document.getElementById('skip-hold-timer');
    const skipInstruction = document.getElementById('skip-instruction');
    
    if (skipContainer) {
      skipContainer.style.background = 'rgba(128, 0, 128, 0.9)';
      skipContainer.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.8), inset 0 0 15px rgba(255, 0, 255, 0.2)';
    }
    if (skipHoldBar) skipHoldBar.style.display = 'block';
    if (skipHoldTimer) skipHoldTimer.style.display = 'block';
    if (skipInstruction) {
      skipInstruction.innerHTML = '<span style="color: #ffaa00;">HOLDING S - ' + 
        '<span id="hold-time">5.0</span>s to skip all</span><br>' +
        '<span style="color: rgba(255, 255, 255, 0.8); font-size: 12px;">Press SPACE or CLICK to skip single</span>';
    }
    
    // Start progress update interval
    this.skipHoldProgressInterval = setInterval(() => {
      this.updateSkipHoldProgress();
    }, 50); // Update every 50ms for smooth progress
  }
  
  // End skip hold timer
  endSkipHold() {
    if (!this.isSkipHoldActive) return; // Not holding
    
    console.log('⏹️ Skip hold cancelled');
    
    this.isSkipHoldActive = false;
    
    // Clear progress interval
    if (this.skipHoldProgressInterval) {
      clearInterval(this.skipHoldProgressInterval);
      this.skipHoldProgressInterval = null;
    }
    
    // Hide skip hold UI elements
    const skipContainer = document.getElementById('skip-container');
    const skipHoldBar = document.getElementById('skip-hold-bar');
    const skipHoldTimer = document.getElementById('skip-hold-timer');
    const skipInstruction = document.getElementById('skip-instruction');
    
    if (skipContainer) {
      skipContainer.style.background = 'rgba(0, 0, 0, 0.85)';
      skipContainer.style.boxShadow = '0 0 15px rgba(255, 0, 255, 0.6), inset 0 0 10px rgba(255, 0, 255, 0.1)';
    }
    if (skipHoldBar) skipHoldBar.style.display = 'none';
    if (skipHoldTimer) skipHoldTimer.style.display = 'none';
    if (skipInstruction) {
      skipInstruction.innerHTML = 'Press SPACE or CLICK to skip<br><span style="color: #ffaa00; font-size: 12px;">Hold S for 5s to skip all</span>';
    }
    
    // Reset progress bar
    const skipHoldProgress = document.getElementById('skip-hold-progress');
    if (skipHoldProgress) {
      skipHoldProgress.style.width = '0%';
    }
  }
  
  // Update skip hold progress
  updateSkipHoldProgress() {
    if (!this.isSkipHoldActive) return;
    
    const elapsed = Date.now() - this.skipHoldStartTime;
    const progress = Math.min(elapsed / this.skipHoldDuration, 1.0);
    const remaining = Math.max(0, (this.skipHoldDuration - elapsed) / 1000);
    
    this.skipHoldProgress = progress;
    
    // Update progress bar
    const skipHoldProgress = document.getElementById('skip-hold-progress');
    if (skipHoldProgress) {
      skipHoldProgress.style.width = `${progress * 100}%`;
    }
    
    // Update timer text
    const holdTimeElement = document.getElementById('hold-time');
    if (holdTimeElement) {
      holdTimeElement.textContent = remaining.toFixed(1);
    }
    
    // Check if hold is complete
    if (progress >= 1.0) {
      console.log('⏭️ Skip hold complete - skipping all cutscene');
      this.endSkipHold(); // Clear the hold UI
      this.skipAllCutscene(); // Skip everything
    }
  }
  
  // Skip all cutscene immediately
  skipAllCutscene() {
    console.log('⏭️ SKIPPING ALL CUTSCENE - HOLD COMPLETE');
    
    // Clear any pending timer
    if (this.nextImageTimer) {
      clearTimeout(this.nextImageTimer);
      this.nextImageTimer = null;
    }
    
    // Reset to end state
    this.currentImageIndex = this.cutsceneImages.length;
    
    // End cutscene immediately
    this.endCutscene();
  }
  
  // End the cutscene and clean up
  endCutscene() {
    if (!this.isActive) return;
    
    console.log('🎬 Cutscene ended');
    
    // CRITICAL: DO NOT stop cutscene music immediately - keep it playing for smooth fade out
    console.log('🎬 Cutscene ended - keeping cutscene music playing for smooth fade out');
    
    // Clear any pending timer
    if (this.nextImageTimer) {
      clearTimeout(this.nextImageTimer);
      this.nextImageTimer = null;
    }
    
    // Clear skip hold timers
    this.endSkipHold();
    
    this.isActive = false;
    this.removeEventListeners();
    
    // Fade out and remove container
    if (this.cutsceneContainer) {
      this.cutsceneContainer.style.transition = 'opacity 0.5s ease-out';
      this.cutsceneContainer.style.opacity = '0';
      
      setTimeout(() => {
        if (this.cutsceneContainer && this.cutsceneContainer.parentNode) {
          this.cutsceneContainer.remove();
        }
        this.cutsceneContainer = null;
      }, 500);
    }
    
    // Call completion callback
    if (this.onComplete) {
      this.onComplete();
      this.onComplete = null;
    }
    
    // CRITICAL: Start fade out immediately when game begins - no delay
    // The cutscene music fades from 100% to 0% over exactly 4 seconds
    console.log('🎬 Cutscene complete - starting immediate 4-second fade out');
    
    // Store reference to prevent garbage collection and ensure music continues
    const audioSystem = window.audioSystem;
    
    if (!audioSystem || !audioSystem.cutsceneSource || !audioSystem.cutsceneGain) {
      console.log('🎬 Cutscene audio not available, skipping fade');
      // Start gameplay music immediately
      if (audioSystem && typeof audioSystem.startMusicSystem === 'function') {
        audioSystem.startMusicSystem();
      }
      if (window.rhythmSystem && typeof window.rhythmSystem.startBackgroundRhythm === 'function') {
        window.rhythmSystem.startBackgroundRhythm(146);
      }
      return;
    }
    
    console.log('🎬 Starting fade immediately - no delay');
    console.log('🎬 Current gain value:', audioSystem.cutsceneGain.gain.value);
    console.log('🎬 Source playback state:', audioSystem.cutsceneSource ? 'active' : 'null');
    
    // Start fade immediately (no setTimeout delay)
    console.log('🎬 Starting 4-second fade out for cutscene music');
    
    // Double-check that we still have the audio nodes
    if (!audioSystem.cutsceneGain) {
      console.log('🎬 Cutscene gain lost, cannot fade');
      // Start gameplay music immediately
      if (audioSystem && typeof audioSystem.startMusicSystem === 'function') {
        audioSystem.startMusicSystem();
      }
      if (window.rhythmSystem && typeof window.rhythmSystem.startBackgroundRhythm === 'function') {
        window.rhythmSystem.startBackgroundRhythm(146);
      }
      return;
    }
    
    const fadeStartTime = audioSystem.context.currentTime;
    const fadeDuration = 4; // Exactly 4 seconds
    const currentVolume = audioSystem.cutsceneGain.gain.value;
    
    // Ensure we start at full volume
    audioSystem.cutsceneGain.gain.value = currentVolume;
    
    console.log(`🎬 IMMEDIATE FADE START: Volume ${currentVolume.toFixed(3)} at time ${fadeStartTime.toFixed(3)}`);
    console.log(`🎬 Fading from 100% to 0% over exactly ${fadeDuration} seconds`);
    
    // Ensure the source is still playing and not being stopped
    if (audioSystem.cutsceneSource && currentVolume > 0.01) {
      console.log('🎬 Applying smooth exponential fade to gain node');
      
      // Use exponentialRampToValueAtTime for natural audio decay
      // Fade from current volume to 0.001 (near zero) over 4 seconds
      audioSystem.cutsceneGain.gain.exponentialRampToValueAtTime(0.001, fadeStartTime + fadeDuration);
      
      // Log fade progress
      const fadeCheckInterval = setInterval(() => {
        const currentTime = audioSystem.context.currentTime;
        const currentGain = audioSystem.cutsceneGain.gain.value;
        const elapsed = currentTime - fadeStartTime;
        
        if (elapsed < fadeDuration) {
          const percentageComplete = (elapsed / fadeDuration) * 100;
          console.log(`🎬 FADE PROGRESS: ${elapsed.toFixed(1)}/${fadeDuration}s (${percentageComplete.toFixed(0)}%), volume: ${currentGain.toFixed(4)}`);
        }
      }, 500);
      
      // Wait for fade to complete, then cleanup and start gameplay music
      setTimeout(() => {
        clearInterval(fadeCheckInterval);
        
        const finalVolume = audioSystem.cutsceneGain.gain.value;
        console.log(`🎬 FADE COMPLETE: Final volume ${finalVolume.toFixed(4)} at 100%`);
        console.log('🎬 Smooth 4-second fade out transition finished');
        
        // Stop the cutscene music
        if (typeof audioSystem.stopCutsceneMusic === 'function') {
          audioSystem.stopCutsceneMusic();
          console.log('🎬 Cutscene music stopped after smooth fade');
        }
        
        // CRITICAL: Start music system and rhythm system simultaneously after fade
        // This ensures all layers and beat counter start at exactly the same time
        if (typeof audioSystem.startMusicSystem === 'function') {
          console.log('🎬 Starting music system - tracks will restart from beginning');
          audioSystem.startMusicSystem();
          console.log('🎬 ALL MUSIC LAYERS RESTARTED FROM BEGINNING');
        }
        
        // CRITICAL: Start rhythm system background tracking after fade
        // This ensures beat tracking only begins when music restarts
        if (window.rhythmSystem && typeof window.rhythmSystem.startBackgroundRhythm === 'function') {
          console.log('🎬 Starting rhythm system background tracking with fresh music');
          window.rhythmSystem.startBackgroundRhythm(146);
          console.log('🎬 Rhythm beat tracking now active - synchronized with fresh music start');
        }
      }, fadeDuration * 1000);
    } else {
      console.log('🎬 Cutscene source not available or volume too low, skipping fade');
      
      // Start gameplay music immediately
      if (typeof audioSystem.startMusicSystem === 'function') {
        audioSystem.startMusicSystem();
      }
      if (window.rhythmSystem && typeof window.rhythmSystem.startBackgroundRhythm === 'function') {
        window.rhythmSystem.startBackgroundRhythm(146);
      }
    }
  }
  
  // Check if cutscene is active
  isPlaying() {
    return this.isActive;
  }
};

// Initialize global cutscene system
window.cutsceneSystem = null;

// Initialize cutscene system
window.initCutscene = function() {
  try {
    window.cutsceneSystem = new window.CutsceneSystem();
    console.log('✓ Cutscene system initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize cutscene system:', error?.message || error);
    return false;
  }
};