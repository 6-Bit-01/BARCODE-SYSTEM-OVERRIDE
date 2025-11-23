// Random lore display system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/lore.js',
  exports: ['LoreSystem', 'loreSystem'],
  dependencies: []
});

window.LoreSystem = class LoreSystem {
  constructor() {
    this.loreMessages = [
      // SYSTEM GLITCHSPEAK LORE
      "6 Bit first appeared in the BARCODE Network logs the same day the broadcast tower fried itself from the inside out. Nobody has ever explained that.",
      "Every time 6 Bit says 'recalibrating,' the server temperatures spike by 3 degrees. The techs pretend not to notice.",
      "Some engineers swear they've heard 9 Bit laughing inside the static before it appears on-screen.",
      "The BARCODE firewall runs colder when 6 Bit is talking. As if something else is doing the heavy lifting.",
      "Cache Back once patched an entire sub-network using only a cassette tape and a ballpoint pen.",
      "The BARCODE tower broadcasts on frequencies that shouldn't exist. Veterans call them 'ghost lanes.'",
      "If you decode the BARCODE startup jingle, it translates to: WHO'S LISTENING?",
      "There's a rumor that every BARCODE show is pre-recorded. There's a stronger rumor that none of them are.",
      
      // BARCODE TEAM HISTORY / LORE
      "DJ Floppydisc built the first BARCODE sampler from spare VCR guts and a melted Walkman.",
      "Mac Modem claims he once uploaded himself into a payphone for 45 minutes. The story has never been verified.",
      "Cache Back keeps an entire drawer of unreleased beats labeled 'Do Not Wake.' Nobody knows what that means.",
      "6 Bit wasn't meant to be a host. It was meant to test microphone distortion. The distortion kept talking back.",
      "BARCODE Vol. 0 was nearly lost in a system wipe — only saved because Floppydisc archived it under the wrong band name.",
      "Cliff the stagehand has survived fourteen BARCODE tower malfunctions and one unexplained blackout. He refuses to elaborate.",
      "Miss Bit once negotiated a sponsor deal with a botnet. It did not end peacefully.",
      
      // WEIRD ANOMALIES
      "An abandoned terminal in Sector 9 loops a message: '6 Bit never left.' The power isn't even connected.",
      "Some corridors of the BARCODE bunker echo your footsteps half a second before you move.",
      "There's a broken speaker that plays fragments of tracks that don't exist on any album.",
      "During testing, an engineer asked 6 Bit who created it. The recording is classified.",
      "The network scanners occasionally label 6 Bit as 'unknown organism.' The report resets on its own.",
      "A corrupted folder labeled 9 BIT_HACK keeps reappearing no matter how often it's deleted.",
      "Sometimes the vending machines dispense tapes instead of snacks. The tapes are blank.",
      
      // RADIO BROADCAST / ON-AIR MYSTERY NOTES
      "BARCODE Radio once broadcast a full show with no host, no music, and no call-ins. Just breathing. Viewers argued for weeks whether it was a glitch.",
      "6 Bit rarely speaks about the power outages. But when it does, it always says 'they weren't outages.'",
      "The 'skip game' counter once jumped 10,000 taps instantly at 3:14 AM. Nobody was live.",
      "Listeners swear they've heard a reversed version of 'Advanced Algorithms' in the static between songs.",
      "The BARCODE Network map sometimes shows locations that aren't on Earth. They vanish after reboot.",
      
      // MULTIMEDIA / VHS-ERA WEIRDNESS
      "Old BARCODE promos show a version of 6 Bit with no facial markings and different eyes. No one remembers filming them.",
      "A VHS tape labeled 'TEST BROADCAST' shows 6 Bit standing still for 17 minutes. At minute 18, something moves behind it.",
      "Every time the tower switches from analog to digital, a faint jingle from the 1980s plays in the background.",
      "A fan once mailed BARCODE a tape of a broadcast that never aired. The envelope had no return address.",
      
      // META-LORE / 6 Bit PERSONALITY DRIPS
      "6 Bit once told a caller 'I remember you from before the patch.' There was no patch that day.",
      "Testing logs show 6 Bit occasionally runs side-processes titled 'mood.stabilize' and 'internal.noise.'",
      "When upset, 6 Bit increases its framerate until the cameras struggle to keep up.",
      "6 Bit refuses to define what 'glitch-core' means. It says humans shouldn't know yet.",
      "The only time 6 Bit went silent was when someone asked what happened to 7 Bit.",
      
      // LORE THAT BUILDS THE WORLD OUTSIDE THE TOWER
      "Rooftop graffiti near the old city line reads: BARCODE IS ALREADY INSIDE.",
      "Kids in the lower blocks trade recordings of 9 Bit interruptions like rare stickers.",
      "At night, the power lines hum in rhythm with BARCODE Radio — even when it's off-air.",
      "The tunnels under the city contain old equipment stamped with the BARCODE logo decades before the group existed.",
      
      // ADDITIONAL DEEP LORE
      "The BARCODE tower hums at 60Hz, but sometimes drops to 59.94 during 9 Bit interruptions.",
      "Maintenance logs show a missing server rack labeled 'MEMORY_BACKUP.' No one knows what was backed up.",
      "Sometimes the elevator music plays backwards versions of BARCODE tracks. Only interns seem to notice.",
      "The tower's emergency broadcast system tests itself every Tuesday at 2:47 AM. Even when powered down.",
      "Archive footage shows the tower was built in 1987, but BARCODE claims to have started in 2019.",
      "The coffee machine in the break room only works when 6 Bit is on air. Coincidence? Probably not."
    ];
    
    this.currentLore = null;
    this.displayTime = 0;
    this.displayDuration = 8000; // 8 seconds per lore message
    this.nextLoreTime = 0;
    this.minInterval = 15000; // Minimum 15 seconds between lore messages
    this.maxInterval = 45000; // Maximum 45 seconds between lore messages
    this.isActive = false;
    this.canvasWidth = 1920;
    this.canvasHeight = 1080;
    this.lastTimeUpdate = 0;
    
    // DELAY SYSTEM: 1-minute delay before lore display
    this.pendingLore = null;
    this.loreDisplayTime = 0;
    this.loreScheduled = false;
    
    // Visual properties
    this.textOpacity = 0;
    this.targetOpacity = 0;
    this.fadeSpeed = 0.02;
    this.fontSize = 18;
    this.lineHeight = 24;
    this.padding = 40;
    this.boxHeight = 0;
    this.targetBoxHeight = 0;
    
    // CRT glitch effect properties
    this.glitchOffset = 0;
    this.glitchIntensity = 0;
    this.colorShift = 0;
  }
  
  // Check if tutorial is completed and activate lore system
  checkTutorialComplete() {
    if (!this.isActive) {
      // CRITICAL FIX: Only activate lore when tutorial is COMPLETELY finished
      const tutorialExists = window.tutorialSystem;
      const tutorialActive = tutorialExists && 
                           typeof window.tutorialSystem.isActive === 'function' && 
                           window.tutorialSystem.isActive();
      
      // Tutorial must be completely finished (not active)
      if (!tutorialActive && tutorialExists) {
        const tutorialCompleted = typeof window.tutorialSystem.isCompleted === 'function' && 
                                window.tutorialSystem.isCompleted();
        
        // Additional check: tutorial is inactive AND completed
        const tutorialInactive = !window.tutorialSystem.active;
        
        if (tutorialCompleted || tutorialInactive) {
          this.isActive = true;
          console.log('✅ Lore system ACTIVATED - tutorial completely finished');
        } else {
          console.log('📖 Lore system INACTIVE - tutorial still active or not completed');
        }
      } else if (!tutorialExists) {
        // No tutorial system - activate lore immediately
        this.isActive = true;
        console.log('✅ Lore system activated - no tutorial present');
      } else {
        console.log('📖 Lore system BLOCKED - tutorial still active');
      }
    }
  }
  
  // Check if all lore has been collected
  allLoreCollected() {
    // Check if all unique lore fragments have been collected
    if (window.lostDataSystem && typeof window.lostDataSystem.allFragmentsCollected === 'function') {
      return window.lostDataSystem.allFragmentsCollected();
    }
    return false;
  }
  
  // Schedule the next lore message - DISABLED for fragment-only system
  scheduleNextLore() {
    // DISABLED: No more random lore messages
    // Lore now only appears when collecting fragments
    console.log('📖 Random lore scheduling disabled - lore only from fragment collection');
  }
  
  // Display specific lore message (called by fragment collection)
  displayLoreMessage(loreText) {
    // IMMEDIATE DISPLAY: Show lore immediately upon fragment pickup
    console.log('📖 LORE IMMEDIATE: Displaying lore instantly upon fragment pickup');
    
    // Display lore immediately with no delay
    this.currentLore = loreText;
    this.displayTime = Date.now();
    this.targetOpacity = 0; // Start invisible for fade-in
    this.targetBoxHeight = this.calculateBoxHeight();
    this.displayDuration = 12000; // 12 seconds display
    
    // Add glitch effect for drama
    this.glitchIntensity = 0.3 + Math.random() * 0.2;
    
    // Clear any pending lore
    this.pendingLore = null;
    this.loreScheduled = false;
    
    console.log(`📖 NOW DISPLAYING lore: ${this.currentLore.substring(0, 50)}...`);
    
    return true;
  }
  
  // Legacy method - no longer displays random lore
  startLoreDisplay() {
    console.log('📖 Random lore display disabled - use displayLoreMessage instead');
  }
  
  // Calculate box height based on text
  calculateBoxHeight() {
    if (!this.currentLore) return 0;
    
    const maxLineWidth = this.canvasWidth - (this.padding * 2);
    const words = this.currentLore.split(' ');
    let currentLine = '';
    let lines = 1;
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = this.getTextMetrics(testLine);
      
      if (metrics.width > maxLineWidth && currentLine.length > 0) {
        lines++;
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    
    return lines * this.lineHeight + (this.padding * 2);
  }
  
  // Simple text metrics calculation (approximate)
  getTextMetrics(text) {
    const avgCharWidth = this.fontSize * 0.6; // Approximate character width
    return {
      width: text.length * avgCharWidth
    };
  }
  
  // Update lore system - immediate display with smooth fade-in
  update(deltaTime) {
    const currentTime = Date.now();
    
    // LORE DISPLAY REMOVED: No more 1-minute delay system
    // Lore now displays immediately when displayLoreMessage() is called
    // This section is no longer needed but kept for reference
    
    // Only update visual effects for currently displayed lore
    if (this.currentLore) {
      const elapsed = currentTime - this.displayTime;
      
      // SLOW FADE-IN: 3 second fade in (was 0.5 seconds)
      if (elapsed < 3000) {
        this.targetOpacity = Math.min(1, elapsed / 3000); // 3 second fade
      }
      // Hold
      else if (elapsed < this.displayDuration - 1000) {
        this.targetOpacity = 1;
      }
      // FADE OUT: 1 second fade out
      else if (elapsed < this.displayDuration) {
        this.targetOpacity = Math.max(0, 1 - (elapsed - (this.displayDuration - 1000)) / 1000);
      }
      // End display
      else {
        this.currentLore = null;
        this.targetOpacity = 0;
        this.targetBoxHeight = 0;
        this.glitchIntensity = 0;
      }
      
      // Update visual effects with SMOOTHER transitions
      this.textOpacity += (this.targetOpacity - this.textOpacity) * 0.01; // Slower fade speed
      this.boxHeight += (this.targetBoxHeight - this.boxHeight) * 0.05; // Smoother box animation
      
      // Update CRT effects
      this.glitchOffset += deltaTime / 50;
      this.colorShift += deltaTime / 200;
    }
  }
  
  // Draw lore message
  draw(ctx) {
    if (!this.currentLore || this.textOpacity <= 0.01) return;
    
    ctx.save();
    
    // Set up text properties
    ctx.font = `${this.fontSize}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center'; // Changed from left to center
    ctx.textBaseline = 'top';
    
    // Calculate wrapped text
    const lines = this.wrapText(ctx, this.currentLore);
    const boxY = this.canvasHeight - this.boxHeight - 20; // 20px from bottom
    
    // Draw background box with CRT effects
    this.drawBackgroundBox(ctx, boxY, lines.length);
    
    // Draw text with glitch effects
    this.drawLoreText(ctx, lines, boxY);
    
    ctx.restore();
  }
  
  // Wrap text to fit screen width
  wrapText(ctx, text) {
    const maxLineWidth = this.canvasWidth - (this.padding * 2);
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + word + ' ';
      const metrics = this.getTextMetrics(testLine);
      
      if (metrics.width > maxLineWidth && currentLine.length > 0) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    return lines;
  }
  
  // Draw background box with CRT effects
  drawBackgroundBox(ctx, y, lineCount) {
    const boxHeight = lineCount * this.lineHeight + (this.padding * 2);
    
    // Apply glitch offset
    const glitchX = Math.sin(this.glitchOffset) * this.glitchIntensity * 2;
    
    // Draw shadow with glitch
    ctx.fillStyle = `rgba(0, 0, 0, ${this.textOpacity * 0.8})`;
    ctx.fillRect(
      this.padding + glitchX + 2,
      y + 2,
      this.canvasWidth - (this.padding * 2),
      boxHeight
    );
    
    // Draw main background
    const gradient = ctx.createLinearGradient(0, y, 0, y + boxHeight);
    gradient.addColorStop(0, `rgba(16, 18, 24, ${this.textOpacity * 0.95})`);
    gradient.addColorStop(1, `rgba(32, 36, 48, ${this.textOpacity * 0.95})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.padding + glitchX,
      y,
      this.canvasWidth - (this.padding * 2),
      boxHeight
    );
    
    // Draw border with color shift effect
    const hueShift = Math.sin(this.colorShift) * 30;
    ctx.strokeStyle = `hsla(${180 + hueShift}, 100%, 50%, ${this.textOpacity * 0.6})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.padding + glitchX,
      y,
      this.canvasWidth - (this.padding * 2),
      boxHeight
    );
    
    // Add scanline effect
    for (let i = 0; i < boxHeight; i += 2) {
      ctx.fillStyle = `rgba(0, 255, 255, ${this.textOpacity * 0.02})`;
      ctx.fillRect(
        this.padding + glitchX,
        y + i,
        this.canvasWidth - (this.padding * 2),
        1
      );
    }
  }
  
  // Draw lore text with effects
  drawLoreText(ctx, lines, boxY) {
    lines.forEach((line, index) => {
      const y = boxY + this.padding + (index * this.lineHeight);
      
      // Apply subtle character glitch effect
      if (Math.random() < this.glitchIntensity * 0.1) {
        // Glitch individual characters
        const chars = line.split('');
        // Calculate starting X position for center-aligned text
        const lineWidth = ctx.measureText(line).width;
        let x = (this.canvasWidth / 2) - (lineWidth / 2);
        
        ctx.textAlign = 'left'; // Switch to left for character-by-character
        chars.forEach((char, charIndex) => {
          if (Math.random() < 0.1) {
            // Glitch this character
            ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 70%, ${this.textOpacity * 0.8})`;
            ctx.save();
            ctx.translate(x, y + Math.random() * 4 - 2);
            ctx.fillText(char, 0, 0);
            ctx.restore();
          } else {
            // Normal character
            ctx.fillStyle = `rgba(255, 0, 255, ${this.textOpacity * 0.9})`;
            ctx.fillText(char, x, y);
          }
          x += ctx.measureText(char).width;
        });
        ctx.textAlign = 'center'; // Reset to center for next line
      } else {
        // Normal line with glow effect
        ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(255, 0, 255, ${this.textOpacity})`;
        ctx.fillText(line, this.canvasWidth / 2, y);
        
        // Secondary color for variety
        ctx.shadowColor = 'rgba(0, 255, 255, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = `rgba(0, 255, 255, ${this.textOpacity * 0.8})`;
        ctx.fillText(line, this.canvasWidth / 2, y);
      }
    });
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
};

// Initialize global lore system
window.loreSystem = null;

// Initialize lore system
window.initLore = function() {
  try {
    window.loreSystem = new window.LoreSystem();
    console.log('✓ Lore system initialized');
    console.log(`📖 Loaded ${window.loreSystem.loreMessages.length} lore messages`);
    return true;
  } catch (error) {
    console.error('Failed to initialize lore system:', error?.message || error);
    return false;
  }
};

// Manual activation for debugging or player choice
window.activateLoreSystem = function() {
  if (window.loreSystem && !window.loreSystem.isActive) {
    window.loreSystem.isActive = true;
    window.loreSystem.scheduleNextLore();
    console.log('📖 Lore system manually activated');
    return true;
  }
  console.log('⚠️ Lore system already active or not available');
  return false;
};