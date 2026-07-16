// Off-screen jammer indicator system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/jammer-indicator.js',
  exports: ['JammerIndicator', 'jammerIndicator', 'initJammerIndicator'],
  dependencies: ['Vector2D', 'distance', 'clamp']
});

window.JammerIndicator = class JammerIndicator {
  constructor() {
    this.active = false;
    this.targetPosition = null;
    this.indicatorPosition = { x: 960, y: 540 }; // Center of screen
    this.angle = 0;
    this.distance = 0;
    this.pulsePhase = 0;
    this.alpha = 0;
    this.arrowSize = 40;
    this.indicatorColor = '#0099ff';
    this.glowColor = '#00aaff';
    
    // Animation properties
    this.animationTime = 0;
    this.fadeInTime = 500; // 0.5 seconds fade in
    this.fadeOutTime = 300; // 0.3 seconds fade out
    this.lastToggleTime = 0;
    
    // Edge detection margins - keep arrow away from screen edges
    this.edgeMargin = 60;
    this.safeArea = {
      left: this.edgeMargin,
      right: 1920 - this.edgeMargin,
      top: this.edgeMargin + 50, // Extra space for UI at top
      bottom: 1080 - this.edgeMargin - 150 // Extra space for UI at bottom
    };
  }
  
  update(deltaTime, jammerPosition, playerX, playerY) {
    // Enhanced parameter validation
    if (!deltaTime || deltaTime < 0) return;
    if (!playerX || !playerY) {
      playerX = playerX || 960;
      playerY = playerY || 750;
    }
    
    const dt = deltaTime / 1000;
    this.animationTime += deltaTime;
    
    // Check if jammer exists and is active
    if (!jammerPosition || !jammerPosition.x || !jammerPosition.y) {
      this.hide();
      return;
    }
    
    this.targetPosition = jammerPosition;
    
    // Calculate distance from player to jammer
    const worldDist = window.distance(playerX, playerY, jammerPosition.x, jammerPosition.y);
    this.distance = worldDist;
    
    // Calculate if jammer is on-screen (considering zoom)
    const isOnScreen = this.isJammerOnScreen(playerX, playerY);
    
    if (isOnScreen) {
      this.hide();
    } else {
      this.show();
      this.calculateArrowPosition(playerX, playerY);
    }
    
    // Update animation
    this.pulsePhase += dt * 3; // 3 pulses per second
    this.updateAlpha();
  }
  
  isJammerOnScreen(playerX, playerY) {
    // Enhanced input validation
    if (!this.targetPosition || !playerX || !playerY) return false;
    
    // Get current zoom level from renderer if available
    const zoomLevel = window.renderer ? window.renderer.getZoomLevel() : 1.0;
    
    // Calculate visible world bounds with zoom
    const visibleWidth = 1920 / zoomLevel;
    const visibleHeight = 850 / zoomLevel; // Only game area, not UI
    
    const leftBound = playerX - visibleWidth / 2;
    const rightBound = playerX + visibleWidth / 2;
    const topBound = playerY - visibleHeight / 2;
    const bottomBound = playerY + visibleHeight / 2;
    
    // Check if jammer is within visible bounds (with some margin)
    const margin = 50; // 50px margin
    return (
      this.targetPosition.x >= leftBound - margin &&
      this.targetPosition.x <= rightBound + margin &&
      this.targetPosition.y >= topBound - margin &&
      this.targetPosition.y <= bottomBound + margin
    );
  }
  
  calculateArrowPosition(playerX, playerY) {
    // Enhanced input validation
    if (!this.targetPosition || !playerX || !playerY) return;
    
    // Calculate angle from player to jammer
    const dx = this.targetPosition.x - playerX;
    const dy = this.targetPosition.y - playerY;
    this.angle = Math.atan2(dy, dx);
    
    // Calculate camera position for side-scrolling
    const canvasWidth = 1920;
    const worldWidth = 4096;
    const halfCanvas = canvasWidth / 2;
    
    let cameraX = playerX;
    cameraX = window.clamp?.(cameraX, halfCanvas, worldWidth - halfCanvas) || playerX;
    const cameraOffsetX = 960 - cameraX;
    
    // Convert world position to screen position
    const playerScreenX = 960; // Player is always centered horizontally
    const playerScreenY = playerY;
    
    // Calculate arrow position at screen edge relative to camera
    const screenCenterX = playerScreenX;
    const screenCenterY = playerScreenY;
    
    // Create direction vector
    const dirX = Math.cos(this.angle);
    const dirY = Math.sin(this.angle);
    
    // Find intersection with screen boundaries
    let closestPoint = null;
    let minDistance = Infinity;
    
    // Check intersection with each screen edge
    const edges = [
      { start: { x: this.safeArea.left, y: this.safeArea.top }, end: { x: this.safeArea.right, y: this.safeArea.top }, normal: { x: 0, y: -1 } }, // Top
      { start: { x: this.safeArea.right, y: this.safeArea.top }, end: { x: this.safeArea.right, y: this.safeArea.bottom }, normal: { x: 1, y: 0 } }, // Right
      { start: { x: this.safeArea.right, y: this.safeArea.bottom }, end: { x: this.safeArea.left, y: this.safeArea.bottom }, normal: { x: 0, y: 1 } }, // Bottom
      { start: { x: this.safeArea.left, y: this.safeArea.bottom }, end: { x: this.safeArea.left, y: this.safeArea.top }, normal: { x: -1, y: 0 } } // Left
    ];
    
    edges.forEach(edge => {
      const intersection = this.lineIntersection(
        screenCenterX, screenCenterY,
        screenCenterX + dirX * 2000, screenCenterY + dirY * 2000,
        edge.start.x, edge.start.y,
        edge.end.x, edge.end.y
      );
      
      if (intersection) {
        const dist = window.distance(screenCenterX, screenCenterY, intersection.x, intersection.y);
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = intersection;
        }
      }
    });
    
    if (closestPoint) {
      // Convert screen position back to world position
      this.indicatorPosition = {
        x: closestPoint.x - cameraOffsetX,
        y: closestPoint.y
      };
    }
  }
  
  lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.0001) return null;
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
    
    return null;
  }
  
  placeArrowAtNearestEdge() {
    // Fallback method if line intersection fails
    const angle = this.angle;
    const centerX = 960;
    const centerY = 540;
    
    // Determine which edge the arrow should be on based on angle
    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    // Calculate position on the edge based on angle for more precise placement
    if (normalizedAngle >= -Math.PI/4 && normalizedAngle < Math.PI/4) {
      // Right side (0 degrees ± 45 degrees)
      const yOffset = Math.tan(normalizedAngle) * (this.safeArea.right - centerX);
      this.indicatorPosition = { 
        x: this.safeArea.right, 
        y: window.clamp(centerY + yOffset, this.safeArea.top, this.safeArea.bottom) 
      };
    } else if (normalizedAngle >= Math.PI/4 && normalizedAngle < 3*Math.PI/4) {
      // Bottom side (90 degrees ± 45 degrees)
      const xOffset = Math.tan(normalizedAngle - Math.PI/2) * (this.safeArea.bottom - centerY);
      this.indicatorPosition = { 
        x: window.clamp(centerX + xOffset, this.safeArea.left, this.safeArea.right), 
        y: this.safeArea.bottom 
      };
    } else if (normalizedAngle >= 3*Math.PI/4 && normalizedAngle < 5*Math.PI/4) {
      // Left side (180 degrees ± 45 degrees)
      const yOffset = Math.tan(normalizedAngle - Math.PI) * (centerX - this.safeArea.left);
      this.indicatorPosition = { 
        x: this.safeArea.left, 
        y: window.clamp(centerY + yOffset, this.safeArea.top, this.safeArea.bottom) 
      };
    } else {
      // Top side (270 degrees ± 45 degrees)
      const xOffset = Math.tan(normalizedAngle - 3*Math.PI/2) * (centerY - this.safeArea.top);
      this.indicatorPosition = { 
        x: window.clamp(centerX + xOffset, this.safeArea.left, this.safeArea.right), 
        y: this.safeArea.top 
      };
    }
  }
  
  show() {
    if (!this.active) {
      this.active = true;
      this.lastToggleTime = this.animationTime;
    }
  }
  
  hide() {
    if (this.active) {
      this.active = false;
      this.lastToggleTime = this.animationTime;
    }
  }
  
  updateAlpha() {
    const timeSinceToggle = this.animationTime - this.lastToggleTime;
    
    if (this.active) {
      // Fade in
      if (timeSinceToggle < this.fadeInTime) {
        this.alpha = timeSinceToggle / this.fadeInTime;
      } else {
        this.alpha = 1.0;
      }
    } else {
      // Fade out
      if (timeSinceToggle < this.fadeOutTime) {
        this.alpha = 1.0 - (timeSinceToggle / this.fadeOutTime);
      } else {
        this.alpha = 0;
      }
    }
    
    // Add pulse effect when active
    if (this.active && this.alpha > 0) {
      const pulseIntensity = Math.sin(this.pulsePhase) * 0.3 + 0.7;
      this.alpha *= pulseIntensity;
    }
  }
  
  draw(ctx) {
    // Enhanced error handling with null/undefined checks
    if (!ctx || this.alpha <= 0 || !this.active || !this.targetPosition) return;
    
    ctx.save();
    
    // Set global alpha
    ctx.globalAlpha = this.alpha;
    
    // Draw arrow at calculated position
    ctx.translate(this.indicatorPosition.x, this.indicatorPosition.y);
    ctx.rotate(this.angle);
    
    // Draw glow effect
    this.drawGlow(ctx);
    
    // Draw arrow shape
    this.drawArrow(ctx);
    
    // Draw distance text
    this.drawDistanceText(ctx);
    
    ctx.restore();
  }
  
  drawGlow(ctx) {
    // Create radial gradient for glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.arrowSize * 2);
    gradient.addColorStop(0, this.glowColor + '40'); // Center with transparency
    gradient.addColorStop(0.5, this.glowColor + '20');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.arrowSize * 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawArrow(ctx) {
    const size = this.arrowSize;
    
    // Arrow shape pointing right (direction handled by rotation)
    ctx.fillStyle = this.indicatorColor;
    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    // Arrow head
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.5, -size * 0.5);
    ctx.lineTo(-size * 0.2, 0);
    ctx.lineTo(-size * 0.5, size * 0.5);
    ctx.closePath();
    
    // Fill with gradient
    const fillGradient = ctx.createLinearGradient(-size, 0, size, 0);
    fillGradient.addColorStop(0, this.indicatorColor + '80');
    fillGradient.addColorStop(1, this.indicatorColor);
    ctx.fillStyle = fillGradient;
    ctx.fill();
    
    // Draw outline
    ctx.stroke();
    
    // Add pulsing center dot
    const dotSize = 4 + Math.sin(this.pulsePhase * 2) * 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawDistanceText(ctx) {
    // Draw distance below arrow
    const distanceText = this.formatDistance(this.distance);
    
    ctx.save();
    ctx.rotate(-this.angle); // Counter-rotate to keep text upright
    
    // Text background for better readability
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const textMetrics = ctx.measureText(distanceText);
    const padding = 6;
    const bgHeight = 20;
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(
      -textMetrics.width / 2 - padding,
      this.arrowSize + 10,
      textMetrics.width + padding * 2,
      bgHeight
    );
    
    // Draw border
    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      -textMetrics.width / 2 - padding,
      this.arrowSize + 10,
      textMetrics.width + padding * 2,
      bgHeight
    );
    
    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(distanceText, 0, this.arrowSize + 14);
    
    ctx.restore();
  }
  
  formatDistance(distance) {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }
  
  // Check if any jammer enemy is off-screen
  static hasOffScreenJammer(enemies, playerX, playerY) {
    // Enhanced parameter validation
    if (!enemies || enemies.length === 0) return false;
    if (!playerX || !playerY) {
      playerX = playerX || 960;
      playerY = playerY || 750;
    }
    
    // Filter for jammer enemies and check if any are off-screen
    return enemies.some(enemy => {
      if (!enemy || !enemy.active || enemy.type !== 'jammer' || !enemy.position) return false;
      
      // Check if jammer enemy is on-screen
      const zoomLevel = window.renderer ? window.renderer.getZoomLevel() : 1.0;
      const visibleWidth = 1920 / zoomLevel;
      const visibleHeight = 850 / zoomLevel;
      
      const leftBound = playerX - visibleWidth / 2;
      const rightBound = playerX + visibleWidth / 2;
      const topBound = playerY - visibleHeight / 2;
      const bottomBound = playerY + visibleHeight / 2;
      
      const margin = 50;
      return !(
        enemy.position.x >= leftBound - margin &&
        enemy.position.x <= rightBound + margin &&
        enemy.position.y >= topBound - margin &&
        enemy.position.y <= bottomBound + margin
      );
    });
  }
  
  // Get the nearest off-screen jammer enemy
  static getNearestOffScreenJammer(enemies, playerX, playerY) {
    // Enhanced parameter validation
    if (!enemies || enemies.length === 0) return null;
    if (!playerX || !playerY) {
      playerX = playerX || 960;
      playerY = playerY || 750;
    }
    
    let nearestJammer = null;
    let minDistance = Infinity;
    
    enemies.forEach(enemy => {
      if (!enemy || !enemy.active || enemy.type !== 'jammer' || !enemy.position) return;
      
      const dist = window.distance(playerX, playerY, enemy.position.x, enemy.position.y);
      
      if (dist < minDistance) {
        // Check if this jammer enemy is off-screen
        const zoomLevel = window.renderer ? window.renderer.getZoomLevel() : 1.0;
        const visibleWidth = 1920 / zoomLevel;
        const visibleHeight = 850 / zoomLevel;
        
        const leftBound = playerX - visibleWidth / 2;
        const rightBound = playerX + visibleWidth / 2;
        const topBound = playerY - visibleHeight / 2;
        const bottomBound = playerY + visibleHeight / 2;
        
        const margin = 50;
        const isOnScreen = (
          enemy.position.x >= leftBound - margin &&
          enemy.position.x <= rightBound + margin &&
          enemy.position.y >= topBound - margin &&
          enemy.position.y <= bottomBound + margin
        );
        
        if (!isOnScreen) {
          minDistance = dist;
          nearestJammer = enemy;
        }
      }
    });
    
    return nearestJammer;
  }
};

// Initialize global jammer indicator
window.jammerIndicator = null;

// Initialize jammer indicator
window.initJammerIndicator = function() {
  try {
    if (window.jammerIndicator) {
      return true; // idempotent lifecycle init: retain the live instance
    }
    window.jammerIndicator = new window.JammerIndicator();
    console.log('✅ Jammer indicator initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize jammer indicator:', error?.message || error);
    return false;
  }
};