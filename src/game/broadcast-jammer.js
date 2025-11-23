// CLEAN BROADCAST JAMMER SYSTEM - Single unified implementation
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/broadcast-jammer.js',
  exports: ['BroadcastJammer', 'broadcastJammerSystem'],
  dependencies: ['Vector2D', 'distance']
});

// Simple, reliable broadcast jammer
window.BroadcastJammer = class BroadcastJammer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.active = true;
    this.health = 8;
    this.maxHealth = 8;
    this.animationTime = 0;
    this.pulsePhase = 0;
    this.size = 100;
    
    // Rhythm requirements
    this.rhythmHits = 0;
    this.rhythmHitsRequired = 8;
    
    // Shake effect when attacked
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    
    // Electrical fizzle effects for destruction
    this.destructionEffects = []; // Array to store electrical effect particles
    this.fizzleIntensity = 0; // Overall fizzle intensity
    this.fizzleDecay = 0.95; // How quickly fizzle fades
    
    // Jammer sprite - use actual jammer image
    this.spriteImage = new Image();
    this.spriteLoaded = false;
    this.spriteImage.crossOrigin = 'anonymous';
    
    // Set up image load handler
    this.spriteImage.onload = () => {
      this.spriteLoaded = true;
      console.log('✅ Jammer sprite loaded successfully');
    };
    
    // Set up error handler
    this.spriteImage.onerror = () => {
      console.error('❌ Failed to load jammer sprite, using fallback');
      this.spriteLoaded = false;
    };
    
    // Load the actual jammer sprite
    this.spriteImage.src = 'https://i.postimg.cc/RhfPv7K0/Jammer.png';
    
    console.log(`📡 Broadcast Jammer created at (${x}, ${y})`);
  }
  
  update(deltaTime) {
    if (!this.active) {
      // CRITICAL: Still update fizzle effects when inactive (destroyed)
      this.updateFizzleEffects(deltaTime);
      return;
    }
    
    this.animationTime += deltaTime;
    this.pulsePhase += deltaTime * 0.003;
    
    // Update shake effect
    this.shakeIntensity *= this.shakeDecay;
    if (this.shakeIntensity < 0.1) {
      this.shakeIntensity = 0;
    }
  }
  
  takeDamage(amount) {
    // Broadcast jammers can only be destroyed by rhythm attacks
    // Regular damage has no effect
    if (!this.active) return;
    
    console.log('📡 Regular attacks have no effect on broadcast jammer - use rhythm attacks!');
  }
  
  onRhythmHit() {
    if (!this.active) return;
    
    this.rhythmHits++;
    console.log(`📡 Jammer rhythm hit: ${this.rhythmHits}/${this.rhythmHitsRequired}`);
    
    // Add shake effect when hit
    this.shakeIntensity = 15;
    
    // Create hit effect
    if (window.particleSystem) {
      window.particleSystem.explosion(this.x, this.y, '#ff9900');
    }
    
    if (this.rhythmHits >= this.rhythmHitsRequired) {
      this.destroy();
    }
  }
  
  destroy() {
    this.active = false;
    console.log('💥 Broadcast Jammer destroyed!');
    
    // CRITICAL: Start electrical fizzle effects
    this.startFizzleEffects();
    
    // Create destruction effect
    if (window.particleSystem) {
      window.particleSystem.explosion(this.x, this.y, '#ff0000');
    }
    
    // Notify progression system
    if (window.sector1Progression && typeof window.sector1Progression.onJammerDestroyed === 'function') {
      window.sector1Progression.onJammerDestroyed();
    }
  }
  
  // Start electrical fizzle effects when destroyed
  startFizzleEffects() {
    console.log('⚡ Starting electrical fizzle effects for jammer destruction');
    
    // Set maximum fizzle intensity
    this.fizzleIntensity = 1.0;
    
    // Create multiple electrical arcs that will fizzle out
    const numArcs = 15 + Math.floor(Math.random() * 10); // 15-25 arcs
    const spriteWidth = 150;
    const spriteHeight = 210;
    
    for (let i = 0; i < numArcs; i++) {
      const arc = {
        // Start from random points within sprite bounds
        startX: this.x + (Math.random() - 0.5) * spriteWidth,
        startY: this.y - spriteHeight + Math.random() * spriteHeight,
        
        // End points extend beyond sprite bounds
        endX: this.x + (Math.random() - 0.5) * spriteWidth * 2,
        endY: this.y - spriteHeight + Math.random() * spriteHeight * 2,
        
        // Arc properties
        intensity: 0.7 + Math.random() * 0.3,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.02, // Random decay rates
        
        // Electrical properties
        segments: [],
        color: Math.random() > 0.5 ? '#ffffff' : '#ffff00', // White or yellow
        thickness: 1 + Math.random() * 3,
        
        // Animation properties
        flickerSpeed: 0.05 + Math.random() * 0.1,
        flickerPhase: Math.random() * Math.PI * 2
      };
      
      // Generate jagged segments for the arc
      const numSegments = 4 + Math.floor(Math.random() * 4);
      for (let j = 0; j <= numSegments; j++) {
        const t = j / numSegments;
        const baseX = arc.startX + (arc.endX - arc.startX) * t;
        const baseY = arc.startY + (arc.endY - arc.startY) * t;
        
        // Add perpendicular displacement for jagged effect
        const perpX = -(arc.endY - arc.startY) / (Math.hypot(arc.endX - arc.startX, arc.endY - arc.startY) + 0.001);
        const perpY = (arc.endX - arc.startX) / (Math.hypot(arc.endX - arc.startX, arc.endY - arc.startY) + 0.001);
        
        const displacement = (Math.random() - 0.5) * 30;
        arc.segments.push({
          x: baseX + perpX * displacement,
          y: baseY + perpY * displacement
        });
      }
      
      this.destructionEffects.push(arc);
    }
    
    console.log(`⚡ Created ${numArcs} electrical fizzle arcs`);
  }
  
  // Update electrical fizzle effects
  updateFizzleEffects(deltaTime) {
    if (this.destructionEffects.length === 0) return;
    
    const dt = deltaTime / 1000;
    
    // Update overall fizzle intensity
    this.fizzleIntensity *= this.fizzleDecay;
    
    // Update each electrical arc
    this.destructionEffects = this.destructionEffects.filter(arc => {
      // Decay arc life
      arc.life -= arc.decay * dt * 60;
      
      // Update flicker
      arc.flickerPhase += arc.flickerSpeed * dt * 60;
      
      // Keep arc if still alive
      return arc.life > 0;
    });
    
    // Add occasional new small sparks during fizzle
    if (this.fizzleIntensity > 0.3 && Math.random() < this.fizzleIntensity * 0.1) {
      this.addSparkEffect();
    }
  }
  
  // Add small spark effect during fizzle
  addSparkEffect() {
    const spriteWidth = 150;
    const spriteHeight = 210;
    
    const spark = {
      startX: this.x + (Math.random() - 0.5) * spriteWidth,
      startY: this.y - spriteHeight + Math.random() * spriteHeight,
      endX: this.x + (Math.random() - 0.5) * spriteWidth * 1.5,
      endY: this.y - spriteHeight + Math.random() * spriteHeight * 1.5,
      intensity: 0.5 + Math.random() * 0.5,
      life: 0.5,
      decay: 0.05,
      color: Math.random() > 0.5 ? '#ffffff' : '#ffff00',
      thickness: 1 + Math.random() * 2,
      segments: [{x: 0, y: 0}, {x: 0, y: 0}], // Simple line
      flickerSpeed: 0.1,
      flickerPhase: 0
    };
    
    // Set simple line segments
    spark.segments[0] = {x: spark.startX, y: spark.startY};
    spark.segments[1] = {x: spark.endX, y: spark.endY};
    
    this.destructionEffects.push(spark);
  }
  
  draw(ctx) {
    if (!ctx) return;
    
    ctx.save();
    
    // CRITICAL: Draw fizzle effects even when inactive (destroyed)
    if (!this.active && this.destructionEffects.length > 0) {
      this.drawFizzleEffects(ctx);
      ctx.restore();
      return; // Only draw fizzle effects when destroyed
    }
    
    if (!this.active) {
      ctx.restore();
      return; // Don't draw anything else if inactive and no effects
    }
    
    // Apply shake effect
    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      ctx.translate(shakeX, shakeY);
    }
    
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.2;
    const glowIntensity = 0.8 + Math.sin(this.pulsePhase * 2) * 0.2;
    
    // REMOVED: Blue glow rectangle was causing visual artifacts
    // Using only circular glow effects instead
    
    // Draw jammer sprite with proper dimensions (reduced by 30px)
    const spriteWidth = 150;
    const spriteHeight = 210;
    
    if (this.spriteLoaded && this.spriteImage.complete) {
      ctx.drawImage(
        this.spriteImage,
        this.x - spriteWidth/2,
        this.y - spriteHeight,
        spriteWidth,
        spriteHeight
      );
    } else {
      // BRIGHT RED placeholder to confirm changes loaded
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(
        this.x - 60,
        this.y - 100,
        120,
        120
      );
      
      // Jammer label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('UPDATED!', this.x, this.y);
    }
    
    // Draw health bar if has taken damage
    if (this.rhythmHits > 0) {
      const healthBarWidth = 80;
      const healthBarHeight = 8;
      const healthBarX = this.x - healthBarWidth / 2;
      const healthBarY = this.y - spriteHeight - 20;
      
      // Background
      ctx.fillStyle = '#333333';
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      
      // Health fill (missing hits)
      const damageTaken = this.rhythmHits;
      const healthRemaining = this.rhythmHitsRequired - damageTaken;
      const healthPercentage = healthRemaining / this.rhythmHitsRequired;
      const fillWidth = healthBarWidth * healthPercentage;
      
      // Color based on health remaining
      if (healthPercentage > 0.6) {
        ctx.fillStyle = '#00ff00'; // Green
      } else if (healthPercentage > 0.3) {
        ctx.fillStyle = '#ffff00'; // Yellow
      } else {
        ctx.fillStyle = '#ff0000'; // Red
      }
      
      ctx.fillRect(healthBarX, healthBarY, fillWidth, healthBarHeight);
      
      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    }
    
    ctx.restore();
  }
  
  // Draw electrical fizzle effects
  drawFizzleEffects(ctx) {
    if (this.destructionEffects.length === 0) return;
    
    // Draw each electrical arc
    this.destructionEffects.forEach(arc => {
      // Calculate flicker intensity
      const flicker = Math.sin(arc.flickerPhase) * 0.3 + 0.7;
      const totalIntensity = arc.intensity * arc.life * this.fizzleIntensity * flicker;
      
      if (totalIntensity <= 0.01) return; // Skip if too faint
      
      ctx.save();
      
      // Set arc appearance with glow effect
      ctx.strokeStyle = arc.color + Math.floor(totalIntensity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = arc.thickness * totalIntensity;
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
      
      // Add glow for white arcs
      if (arc.color === '#ffffff') {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10 * totalIntensity;
      } else {
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 15 * totalIntensity;
      }
      
      // Draw the jagged electrical arc
      ctx.beginPath();
      arc.segments.forEach((segment, index) => {
        if (index === 0) {
          ctx.moveTo(segment.x, segment.y);
        } else {
          ctx.lineTo(segment.x, segment.y);
        }
      });
      ctx.stroke();
      
      // Draw bright core for stronger arcs
      if (totalIntensity > 0.5) {
        ctx.strokeStyle = '#ffffff' + Math.floor(totalIntensity * 200).toString(16).padStart(2, '0');
        ctx.lineWidth = arc.thickness * 0.5 * totalIntensity;
        ctx.shadowBlur = 5 * totalIntensity;
        
        ctx.beginPath();
        arc.segments.forEach((segment, index) => {
          if (index === 0) {
            ctx.moveTo(segment.x, segment.y);
          } else {
            ctx.lineTo(segment.x, segment.y);
          }
        });
        ctx.stroke();
      }
      
      ctx.restore();
    });
    
    // Draw central electrical burst at origin point
    if (this.fizzleIntensity > 0.5) {
      ctx.save();
      
      const burstIntensity = this.fizzleIntensity * 0.8;
      const coreSize = 5 + Math.sin(Date.now() * 0.02) * 3;
      
      // White core
      ctx.fillStyle = `rgba(255, 255, 255, ${burstIntensity})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 20 * burstIntensity;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 105, Math.max(0, coreSize), 0, Math.PI * 2);
      ctx.fill();
      
      // Yellow outer glow
      ctx.fillStyle = `rgba(255, 255, 0, ${burstIntensity * 0.6})`;
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 30 * burstIntensity;
      ctx.beginPath();
      ctx.arc(this.x, this.y - 105, Math.max(0, coreSize * 2), 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }
  
  // Get position as object for compatibility
  get position() {
    return { x: this.x, y: this.y };
  }
  
  // Get jammer hitbox for collision detection - DISABLED
  // Broadcast jammer only takes damage from rhythm attacks within attack range
  getHitbox() {
    // Return tiny hitbox that doesn't affect gameplay
    // Rhythm damage is handled by distance-based collision in rhythm system
    return {
      x: this.x - 1,
      y: this.y - 1,
      width: 2,
      height: 2
    };
  }
  
  // Check if point is within jammer hitbox - DISABLED
  // Broadcast jammer only takes damage from rhythm attacks within attack range
  containsPoint(x, y) {
    // Always return false - jammer damage handled by rhythm system distance check
    return false;
  }
};

// Global broadcast jammer system
window.BroadcastJammerSystem = {
  jammer: null,
  autoSpawnTimer: 0,
  autoSpawnInterval: 1000, // 1 second
  permanentlyDestroyed: false, // CRITICAL: Prevent respawning after destruction
  
  // Initialize system
  init() {
    console.log('📡 Broadcast Jammer System initialized');
    console.log('📡 Jammer will spawn when player meets progression requirements');
  },
  
  // Update system
  update(deltaTime) {
    // CRITICAL: Update jammer even when inactive to show fizzle effects
    if (this.jammer) {
      this.jammer.update(deltaTime);
    }
    
    // CRITICAL: DISABLED - No auto-spawning to prevent respawning after destruction
    // Only spawn jammer when explicitly requested by sector1Progression system
  },
  
  // Check if jammer should spawn
  shouldSpawnJammer() {
    // CRITICAL: Never respawn if permanently destroyed
    if (this.permanentlyDestroyed) {
      console.log('📡 Jammer permanently destroyed - will not respawn');
      return false;
    }
    
    // CRITICAL: DISABLED - No automatic spawning
    // Only spawn jammer when explicitly requested by sector1Progression system
    return false;
  },
  
  // Force spawn jammer
  forceSpawn(x = null, y = null) {
    // Clean up existing jammer
    if (this.jammer) {
      this.jammer.active = false;
      this.jammer = null;
    }
    
    // Calculate spawn position if not provided - completely random
    if (x === null || y === null) {
      x = 500 + Math.random() * 3000; // Random X across the map (500-3500)
      y = 880 + 0; // Original height (880) - only 10px lower than before
    }
    
    console.log(`🚨 FORCING JAMMER SPAWN on opposite side of map at (${x.toFixed(1)}, ${y.toFixed(1)})`);
    
    // Create new jammer
    this.jammer = new window.BroadcastJammer(x, y);

    // ✅ keep global alias in sync
    window.broadcastJammer = this.jammer;
    
    console.log('✅ JAMMER SPAWNED SUCCESSFULLY!');
    console.log(`📍 Position: (${x}, ${y})`);
    console.log('🎯 Status: ACTIVE and ready for rhythm attacks');
    console.log('🎵 Rhythm hits required:', this.jammer.rhythmHitsRequired);
    
    return this.jammer;
  },
  
  // Draw jammer
  draw(ctx) {
    // CRITICAL: Draw jammer even when destroyed to show fizzle effects
    if (this.jammer && (this.jammer.active || this.jammer.destructionEffects.length > 0)) {
      this.jammer.draw(ctx);
    }
  },
  
  // Handle rhythm hits
  onRhythmHit() {
    if (this.jammer && this.jammer.active) {
      this.jammer.onRhythmHit();
    }
  },
  
  // Get jammer status
  getStatus() {
    return {
      exists: !!this.jammer,
      active: (this.jammer && this.jammer.active) || false,
      health: (this.jammer && this.jammer.health) || 0,
      rhythmHits: (this.jammer && this.jammer.rhythmHits) || 0,
      position: this.jammer ? this.jammer.position : null
    };
  },
  
  // Destroy jammer
  destroy() {
    if (this.jammer) {
      this.jammer.destroy();
      this.jammer = null;

      // ✅ keep alias in sync
      window.broadcastJammer = null;

      // CRITICAL: Mark as permanently destroyed to prevent respawning
      this.permanentlyDestroyed = true;

      console.log('💥 Broadcast jammer PERMANENTLY destroyed - will not respawn');
    }
  },
  
  // Check if jammer is visible on screen
  isJammerVisible(playerX, playerY, screenWidth = 1920, screenHeight = 850) {
    if (!this.jammer || !this.jammer.active) return false;
    
    const leftBound = playerX - screenWidth / 2;
    const rightBound = playerX + screenWidth / 2;
    const topBound = playerY - screenHeight / 2;
    const bottomBound = playerY + screenHeight / 2;
    
    return (
      this.jammer.x >= leftBound &&
      this.jammer.x <= rightBound &&
      this.jammer.y >= topBound &&
      this.jammer.y <= bottomBound
    );
  },
  
  // Get distance to jammer
  getDistanceToJammer(playerX, playerY) {
    if (!this.jammer || !this.jammer.active) return Infinity;
    
    return Math.sqrt(
      Math.pow(this.jammer.x - playerX, 2) +
      Math.pow(this.jammer.y - playerY, 2)
    );
  }
};

// Create global references for compatibility
window.broadcastJammerSystem = window.BroadcastJammerSystem;

// ✅ IMPORTANT: do NOT snapshot jammer on load.
window.broadcastJammer = null;

// Auto-initialize the system when loaded
if (typeof window !== 'undefined') {
  window.BroadcastJammerSystem.init();
  console.log('📡 Broadcast Jammer System auto-initialized on load');
  
  // CRITICAL: IMMEDIATE SPAWN FOR VISIBILITY TESTING
  setTimeout(() => {
    console.log('🚨 IMMEDIATE SPAWN: Force spawning jammer at visible position!');
    // Use random spawning instead of fixed position
    const randomX = 500 + Math.random() * 3000;
    window.BroadcastJammerSystem.forceSpawn(randomX, 880); // Random position, original height
  }, 500);
  
  // Emergency debug helpers
  window.JAMMER_DEBUG = {
    EMERGENCY_SPAWN: function() {
      // CRITICAL: Respect permanent destruction flag
      if (window.BroadcastJammerSystem.permanentlyDestroyed) {
        console.log('🚫 EMERGENCY SPAWN BLOCKED: Jammer permanently destroyed');
        return null;
      }
      
      console.log('🚨 EMERGENCY JAMMER SPAWN ACTIVATED!');
      // Use random spawning for emergency spawn too
      const randomX = 500 + Math.random() * 3000;
      return window.BroadcastJammerSystem.forceSpawn(randomX, 880);
    },
    CHECK_STATUS: function() {
      return window.BroadcastJammerSystem.getStatus();
    },
    FORCE_DESTROY: function() {
      return window.BroadcastJammerSystem.destroy();
    },
    RESET_DESTROY_FLAG: function() {
      window.BroadcastJammerSystem.permanentlyDestroyed = false;
      console.log('🔄 EMERGENCY: Reset permanent destruction flag');
      return '🔄 Reset destruction flag - jammer can spawn again';
    }
  };
  console.log('🔧 Emergency jammer debug commands loaded: JAMMER_DEBUG.EMERGENCY_SPAWN()');
}

console.log('📡 CLEAN BROADCAST JAMMER SYSTEM LOADED');
console.log('Available commands:');
console.log('  BroadcastJammerSystem.forceSpawn(x, y) - Force spawn jammer');
console.log('  BroadcastJammerSystem.getStatus() - Check jammer status');
console.log('  BroadcastJammerSystem.destroy() - Destroy jammer');
