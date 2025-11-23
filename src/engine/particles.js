// Enhanced particle effects system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/particles.js',
  exports: ['ParticleSystem', 'particleSystem'],
  dependencies: ['Vector2D', 'randomRange']
});

// Individual particle class with shape support
window.Particle = class Particle {
  constructor(x, y, vx, vy, color, size, lifetime, shape = 'circle', rotation = 0, growAndDissipate = false) {
    this.position = new window.Vector2D(x, y);
    this.velocity = new window.Vector2D(vx, vy);
    this.color = color;
    this.size = size;
    this.originalSize = size; // Store original size for growth
    this.lifetime = lifetime;
    this.age = 0;
    this.alpha = 1;
    this.shape = shape; // 'circle', 'triangle', 'square', 'star'
    this.rotation = rotation;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2; // Random rotation speed
    this.growAndDissipate = growAndDissipate; // For smoke/dust effect
  }

  update(deltaTime) {
    const dt = deltaTime / 1000;
    this.age += deltaTime;
    
    // Update position
    this.position = this.position.add(this.velocity.multiply(dt));
    
    // Apply ground level mask - destroy particles that go below or touch ground (890px)
    if (this.position.y >= 885) { // More aggressive - destroy 5px before ground
      return false; // Particle should be destroyed
    }
    
    // Update rotation
    this.rotation += this.rotationSpeed * deltaTime / 1000;
    
    // Update alpha based on age
    this.alpha = Math.max(0, 1 - (this.age / this.lifetime));
    
    // Grow and dissipate effect for smoke/dust
    if (this.growAndDissipate) {
      const progress = this.age / this.lifetime;
      this.size = this.originalSize * (1 + progress * 3); // Grow to 4x original size
    } else {
      // Normal size fade
      this.size *= 0.98;
    }
    
    // Apply gravity to heavy particles (orange/firewall colors)
    if (this.color === '#ff8800' || this.color === '#ff6600' || this.color === '#ff9900' || this.color === '#ffaa00') {
      this.velocity.y += 500 * dt;
    }
    
    return this.age < this.lifetime && this.alpha > 0.01 && this.size > 0.5;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = this.size * 0.5;
    
    // Translate to particle position and rotate
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    
    switch(this.shape) {
      case 'triangle':
        this.drawTriangle(ctx);
        break;
      case 'square':
        this.drawSquare(ctx);
        break;
      case 'star':
        this.drawStar(ctx);
        break;
      case 'circle':
      default:
        this.drawCircle(ctx);
        break;
    }
    
    ctx.restore();
  }

  drawCircle(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0, this.size), 0, Math.PI * 2);
    ctx.fill();
  }

  drawTriangle(ctx) {
    const size = Math.max(0, this.size);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.866, size * 0.5);
    ctx.lineTo(size * 0.866, size * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  drawSquare(ctx) {
    const size = Math.max(0, this.size);
    ctx.fillRect(-size, -size, size * 2, size * 2);
  }

  drawStar(ctx) {
    const size = Math.max(0, this.size);
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.5;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / spikes;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
  }
};

// Enhanced particle system manager
window.ParticleSystem = class ParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 500;
    console.log('✅ ParticleSystem initialized with enhanced features');
  }

  update(deltaTime) {
    try {
      // Update all particles and remove dead ones
      this.particles = this.particles.filter(particle => particle.update(deltaTime));
      
      // Limit particle count
      if (this.particles.length > this.maxParticles) {
        this.particles = this.particles.slice(-this.maxParticles);
      }
    } catch (error) {
      console.error('Error updating particle system:', error?.message || error);
    }
  }

  draw(ctx) {
    try {
      // Only draw particles that are above ground level (890px)
      const visibleParticles = this.particles.filter(particle => particle.position.y <= 890);
      const hiddenParticles = this.particles.filter(particle => particle.position.y > 890);
      
      // Debug logging to verify masking is working
      if (hiddenParticles.length > 0) {
        console.log(`🎭 Particle mask: hiding ${hiddenParticles.length} particles below ground, showing ${visibleParticles.length} above ground`);
      }
      
      visibleParticles.forEach(particle => particle.draw(ctx));
    } catch (error) {
      console.error('Error drawing particle system:', error?.message || error);
    }
  }

  // Get enemy-specific colors (simplified per user request)
  getEnemyColors(enemyType) {
    switch(enemyType) {
      case 'virus':
        return ['#ffffff']; // White
      case 'corrupted':
        return ['#00ff88']; // PURE green  
      case 'firewall':
        return ['#ff9900']; // PURE orange
      default:
        return ['#ffffff']; // White for player
    }
  }

  // Get random shape with bias - ENSURE TRIANGLES APPEAR
  getRandomShape(enemyType) {
    const shapes = ['circle', 'triangle', 'square', 'star'];
    const weights = enemyType === 'virus' ? [0.2, 0.6, 0.1, 0.1] :  // EVEN MORE triangles for virus (60%)
                  enemyType === 'corrupted' ? [0.2, 0.2, 0.4, 0.2] :  // More squares for corrupted
                  enemyType === 'firewall' ? [0.4, 0.3, 0.2, 0.1] :  // More circles for firewall
                  [0.25, 0.25, 0.25, 0.25]; // Equal chance for player
    
    const rand = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < shapes.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        return shapes[i];
      }
    }
    return 'triangle'; // Default to triangle to ensure they appear
  }

  // Enemy-specific spawn effects
  enemySpawnEffect(x, y, enemyType) {
    console.log(`🌟 Creating spawn effect for ${enemyType} at (${x}, ${y})`);
    const colors = this.getEnemyColors(enemyType);
    const particleCount = enemyType === 'firewall' ? 25 : enemyType === 'corrupted' ? 20 : 15;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = window.randomRange(100, 300);
      const color = colors[0]; // Use primary color
      const shape = this.getRandomShape(enemyType);
      
      this.particles.push(new window.Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 100, // Upward burst
        color,
        window.randomRange(3, 8),
        window.randomRange(600, 1000),
        shape,
        Math.random() * Math.PI * 2
      ));
    }
  }

  // Enhanced explosion effect with enemy-specific colors
  explosion(x, y, enemyType = null, count = 20) {
    const colors = enemyType ? this.getEnemyColors(enemyType) : ['#ff6600'];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = window.randomRange(100, 300);
      const color = colors[0];
      const shape = enemyType ? this.getRandomShape(enemyType) : 'circle';
      
      this.particles.push(new window.Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        window.randomRange(3, 8),
        window.randomRange(500, 1000),
        shape,
        Math.random() * Math.PI * 2
      ));
    }
  }

  // Enhanced impact effect
  impact(x, y, enemyType = null, count = 10) {
    const colors = enemyType ? this.getEnemyColors(enemyType) : ['#00ffff'];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = window.randomRange(50, 150);
      const color = colors[0];
      const shape = enemyType ? this.getRandomShape(enemyType) : 'circle';
      
      this.particles.push(new window.Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 50, // Slight upward bias
        color,
        window.randomRange(2, 5),
        window.randomRange(300, 600),
        shape,
        Math.random() * Math.PI * 2
      ));
    }
  }

  // Jump effect - larger smoke puff
  jumpEffect(x, y, enemyType = null) {
    const colors = enemyType ? this.getEnemyColors(enemyType) : ['#cccccc'];
    
    for (let i = 0; i < 8; i++) {
      const color = colors[0];
      
      this.particles.push(new window.Particle(
        x, y,
        window.randomRange(-25, 25),
        window.randomRange(-40, -15),
        color,
        window.randomRange(5, 8),
        window.randomRange(400, 600),
        'circle',
        Math.random() * Math.PI * 2,
        true // growAndDissipate for smoke effect
      ));
    }
  }

  // Landing effect - larger smoke puff
  landingEffect(x, y, enemyType = null) {
    const colors = enemyType ? this.getEnemyColors(enemyType) : ['#cccccc'];
    
    // Force spawn position to be above ground level
    const spawnY = Math.min(y, 885); // Never spawn below 885px (5px above ground)
    
    for (let i = 0; i < 10; i++) {
      const color = colors[0];
      
      this.particles.push(new window.Particle(
        x, spawnY,
        window.randomRange(-130, 130), // 20px wider than previous (-110,110) → (-130,130)
        Math.max(-25, window.randomRange(-25, -5)), // Force upward velocity to prevent falling
        color,
        window.randomRange(6, 10),
        window.randomRange(500, 800),
        'circle',
        Math.random() * Math.PI * 2,
        true // growAndDissipate for smoke effect
      ));
    }
  }

  // Enhanced stomp effect
  stompEffect(x, y, enemyType = null, facing = 1) {
    const colors = enemyType ? this.getEnemyColors(enemyType) : ['#ff6600'];
    const particleCount = 16;
    
    // Move origin 20px in front of player based on facing direction
    const offsetX = facing * 20;
    
    // Stomp particles - increased by 80px total (240-290 → 320-370)
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = window.randomRange(320, 370); // Increased by 20px more
      const color = colors[0];
      const shape = enemyType ? this.getRandomShape(enemyType) : 'square';
      
      this.particles.push(new window.Particle(
        x + offsetX, y, // Move based on facing direction
        Math.cos(angle) * speed,
        Math.sin(angle) * speed * 0.4, // Gentle outward spread
        color,
        window.randomRange(4, 8),
        window.randomRange(300, 500),
        shape,
        Math.random() * Math.PI * 2
      ));
    }
    
    // Add landing smoke particles behind stomp effects
    const smokeColors = enemyType ? this.getEnemyColors(enemyType) : ['#cccccc'];
    const smokeParticleCount = 12;
    
    // Position smoke 30px toward front of the player from stomp origin
    const smokeOffsetX = x + facing * 10; // 30px toward front (was 40px behind, now 10px in front)
    
    for (let i = 0; i < smokeParticleCount; i++) {
      const smokeColor = smokeColors[0];
      
      this.particles.push(new window.Particle(
        smokeOffsetX, Math.min(y + 20, 880), // Force smoke to spawn above ground
        window.randomRange(-80, 80), // Wider horizontal spread
        Math.max(-50, window.randomRange(-50, -10)), // Force upward velocity only
        smokeColor,
        window.randomRange(8, 14), // Much shorter smoke particles (42-48 → 8-14)
        window.randomRange(600, 900), // Longer lasting smoke
        'circle',
        Math.random() * Math.PI * 2,
        true // growAndDissipate for natural smoke effect
      ));
    }
  }

  // Trail effect for movement - WHITE smoke/dust for player
  trail(x, y, enemyType = null, count = 3) {
    const isPlayer = !enemyType; // Player trails have no enemyType
    const colors = isPlayer ? ['#ffffff'] : (enemyType ? this.getEnemyColors(enemyType) : ['#ff00ff']);
    
    for (let i = 0; i < count; i++) {
      const color = colors[0];
      const shape = isPlayer ? 'circle' : (enemyType ? this.getRandomShape(enemyType) : 'circle');
      
      // For player: create smoke/dust particles that grow and dissipate
      this.particles.push(new window.Particle(
        x, y,
        window.randomRange(-30, 30),
        window.randomRange(-30, 30),
        color,
        window.randomRange(3, 6), // Slightly larger for smoke effect
        window.randomRange(400, 600), // Longer lifetime for smoke
        shape,
        Math.random() * Math.PI * 2,
        isPlayer // growAndDissipate flag for player smoke/dust
      ));
    }
  }

  // Damage effect - RED for player damage, YELLOW for knockback, enemy colors for enemies
  damageEffect(x, y, enemyType = null, count = 15) {
    const isPlayerDamage = !enemyType; // Player damage when no enemyType specified
    const isKnockback = enemyType === 'knockback'; // Special knockback type
    const colors = isPlayerDamage ? ['#ff0000'] : // RED for player damage
                    (isKnockback ? ['#ffff00'] : // Yellow for knockback
                    (enemyType ? this.getEnemyColors(enemyType) : ['#ff0000'])); // Default to RED for player damage
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = window.randomRange(80, 180);
      const color = colors[0];
      const shape = enemyType ? this.getRandomShape(enemyType) : 'triangle';
      
      this.particles.push(new window.Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        window.randomRange(2, 6),
        window.randomRange(400, 800),
        shape,
        Math.random() * Math.PI * 2
      ));
    }
  }

  // Rhythm attack effect with mixed shapes
  rhythmAttackEffect(x, y) {
    const shapes = ['circle', 'triangle', 'star'];
    const colors = ['#ff00ff', '#00ffff', '#ffff00'];
    
    for (let ring = 0; ring < 3; ring++) {
      setTimeout(() => {
        const particleCount = 16;
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const speed = 150 + (ring * 50);
          const color = colors[ring];
          const shape = shapes[ring % shapes.length];
          
          this.particles.push(new window.Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            window.randomRange(3, 6),
            window.randomRange(600, 1000),
            shape,
            Math.random() * Math.PI * 2
          ));
        }
      }, ring * 100);
    }
  }

  // Heal effect with floating particles
  healEffect(x, y, color = '#00ff00') {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      const speed = window.randomRange(30, 80);
      const shape = ['star', 'circle'][Math.floor(Math.random() * 2)];
      
      this.particles.push(new window.Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 30, // Upward bias
        color,
        window.randomRange(2, 4),
        window.randomRange(400, 700),
        shape,
        Math.random() * Math.PI * 2
      ));
    }
  }

  // Clear all particles
  clear() {
    console.log(`🧹 Clearing ${this.particles.length} particles`);
    this.particles = [];
  }
  
  // LOST DATA FRAGMENT PARTICLE EFFECTS
  
  // Data fragment spawn effect
  dataFragmentEffect(x, y) {
    console.log(`💎 Creating data fragment spawn effect at (${x}, ${y})`);
    const colors = ['#9333ea', '#3b82f6', '#a855f7']; // Purple, blue, violet
    
    // Create crystalline spawn effect
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = window.randomRange(100, 200);
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      this.particles.push(new window.Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 50,
        color,
        window.randomRange(2, 5),
        window.randomRange(800, 1200),
        'star',
        Math.random() * Math.PI * 2
      ));
    }
    
    // Add central glow
    for (let i = 0; i < 8; i++) {
      this.particles.push(new window.Particle(
        x, y,
        window.randomRange(-20, 20),
        window.randomRange(-20, 20),
        '#ffffff',
        window.randomRange(3, 6),
        window.randomRange(600, 900),
        'circle',
        Math.random() * Math.PI * 2
      ));
    }
  }
  
  // Data fragment collected effect
  dataFragmentCollected(x, y) {
    console.log(`💫 Creating data fragment collection effect at (${x}, ${y})`);
    const colors = ['#fbbf24', '#f59e0b', '#f97316']; // Golden colors
    
    // Create explosive collection effect
    for (let i = 0; i < 25; i++) {
      const angle = (Math.PI * 2 * i) / 25;
      const speed = window.randomRange(150, 300);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = ['star', 'circle', 'triangle'][Math.floor(Math.random() * 3)];
      
      this.particles.push(new window.Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        window.randomRange(3, 7),
        window.randomRange(800, 1400),
        shape,
        Math.random() * Math.PI * 2
      ));
    }
    
    // Add spiral effect
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const spiralSpeed = 100 + (i * 10);
      
      this.particles.push(new window.Particle(
        x, y,
        Math.cos(angle) * spiralSpeed,
        Math.sin(angle) * spiralSpeed,
        '#ffffff',
        window.randomRange(2, 4),
        window.randomRange(1000, 1500),
        'star',
        Math.random() * Math.PI * 2
      ));
    }
  }
  
  // Data fragment ambient glow effect
  dataFragmentGlow(x, y) {
    const colors = ['#9333ea', '#3b82f6', '#a855f7'];
    
    // Create gentle floating particles around fragment
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = window.randomRange(10, 30);
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance;
      
      this.particles.push(new window.Particle(
        px, py,
        window.randomRange(-10, 10),
        window.randomRange(-20, 10),
        colors[Math.floor(Math.random() * colors.length)],
        window.randomRange(1, 3),
        window.randomRange(400, 600),
        'circle',
        Math.random() * Math.PI * 2
      ));
    }
  }
  
  // Rhythm hit effect for jammer attacks
  rhythmHit(x, y) {
    console.log(`🎵 Creating rhythm hit effect at (${x}, ${y})`);
    const colors = ['#00ff00', '#00ffff', '#ffff00']; // Green, cyan, yellow for rhythm hits
    
    // Create impact burst
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = window.randomRange(80, 150);
      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = ['circle', 'star', 'triangle'][Math.floor(Math.random() * 3)];
      
      this.particles.push(new window.Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        window.randomRange(2, 5),
        window.randomRange(300, 600),
        shape,
        Math.random() * Math.PI * 2
      ));
    }
    
    // Add central flash
    for (let i = 0; i < 6; i++) {
      this.particles.push(new window.Particle(
        x, y,
        window.randomRange(-30, 30),
        window.randomRange(-30, 30),
        '#ffffff',
        window.randomRange(3, 6),
        window.randomRange(200, 400),
        'star',
        Math.random() * Math.PI * 2
      ));
    }
  }
  
  // Spawn effect for new jammers
  spawnEffect(x, y) {
    console.log(`📡 Creating jammer spawn effect at (${x}, ${y})`);
    const colors = ['#ff6600', '#ff9900', '#ffaa00']; // Orange colors for jammer
    
    // Create spiral spawn effect
    for (let ring = 0; ring < 2; ring++) {
      setTimeout(() => {
        const particleCount = 16;
        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 * i) / particleCount;
          const speed = 100 + (ring * 50);
          const color = colors[ring % colors.length];
          
          this.particles.push(new window.Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color,
            window.randomRange(3, 6),
            window.randomRange(600, 900),
            'star',
            Math.random() * Math.PI * 2
          ));
        }
      }, ring * 100);
    }
  }
};

// Create global particle system - wait for dependencies to be ready
function createParticleSystem() {
  if (window.Vector2D && window.randomRange) {
    window.particleSystem = new window.ParticleSystem();
    console.log('✅ Global particle system created successfully');
    
    // Simple test - create a few particles to verify it's working
    setTimeout(() => {
      if (window.particleSystem) {
        console.log('🧪 Creating test particles...');
        window.particleSystem.explosion(960, 400, 'virus', 3); // Test purple triangles
      }
    }, 1000);
  } else {
    console.warn('Particle system dependencies not ready, retrying...');
    setTimeout(createParticleSystem, 100);
  }
}

// Initialize particle system when dependencies are loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createParticleSystem);
} else {
  createParticleSystem();
}