// Off-screen jammer indicator system for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/jammer-indicator.js',
  exports: ['JammerIndicator', 'jammerIndicator'],
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
    if (!this.targetPosition) return false;
    
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
    if (!this.targetPosition) return;
    
    // Calculate angle from player to jammer
    const dx = this.targetPosition.x - playerX;
    const dy = this.targetPosition.y - playerY;
    this.angle = Math.atan2(dy, dx);
    
    // Calculate arrow position at screen edge
    // We want the arrow to point from screen edge toward the jammer
    
    // Calculate intersection with screen bounds
    const screenCenterX = 960;
    const screenCenterY = 540;
    
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
      this.indicatorPosition = closestPoint;
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
    if (this.alpha <= 0 || !this.active || !this.targetPosition) return;
    
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
  
  // Check if any jammer is off-screen
  static hasOffScreenJammer(jammers, playerX, playerY) {
    if (!jammers || jammers.length === 0) return false;
    
    return jammers.some(jammer => {
      if (!jammer || !jammer.active || !jammer.position) return false;
      
      // Check if jammer is on-screen
      const zoomLevel = window.renderer ? window.renderer.getZoomLevel() : 1.0;
      const visibleWidth = 1920 / zoomLevel;
      const visibleHeight = 850 / zoomLevel;
      
      const leftBound = playerX - visibleWidth / 2;
      const rightBound = playerX + visibleWidth / 2;
      const topBound = playerY - visibleHeight / 2;
      const bottomBound = playerY + visibleHeight / 2;
      
      const margin = 50;
      return !(
        jammer.position.x >= leftBound - margin &&
        jammer.position.x <= rightBound + margin &&
        jammer.position.y >= topBound - margin &&
        jammer.position.y <= bottomBound + margin
      );
    });
  }
  
  // Get the nearest off-screen jammer
  static getNearestOffScreenJammer(jammers, playerX, playerY) {
    if (!jammers || jammers.length === 0) return null;
    
    let nearestJammer = null;
    let minDistance = Infinity;
    
    jammers.forEach(jammer => {
      if (!jammer || !jammer.active || !jammer.position) return;
      
      const dist = window.distance(playerX, playerY, jammer.position.x, jammer.position.y);
      
      if (dist < minDistance) {
        // Check if this jammer is off-screen
        const zoomLevel = window.renderer ? window.renderer.getZoomLevel() : 1.0;
        const visibleWidth = 1920 / zoomLevel;
        const visibleHeight = 850 / zoomLevel;
        
        const leftBound = playerX - visibleWidth / 2;
        const rightBound = playerX + visibleWidth / 2;
        const topBound = playerY - visibleHeight / 2;
        const bottomBound = playerY + visibleHeight / 2;
        
        const margin = 50;
        const isOnScreen = (
          jammer.position.x >= leftBound - margin &&
          jammer.position.x <= rightBound + margin &&
          jammer.position.y >= topBound - margin &&
          jammer.position.y <= bottomBound + margin
        );
        
        if (!isOnScreen) {
          minDistance = dist;
          nearestJammer = jammer;
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
    window.jammerIndicator = new window.JammerIndicator();
    console.log('✅ Jammer indicator initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize jammer indicator:', error?.message || error);
    return false;
  }
};