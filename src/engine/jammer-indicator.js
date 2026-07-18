// Unified off-screen environmental Broadcast Jammer indicator.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/jammer-indicator.js', exports: ['JammerIndicator', 'jammerIndicator', 'initJammerIndicator'], dependencies: ['renderer', 'BARCODE.JammerEnvironment'] });

(function() {
  'use strict';
  window.JammerIndicator = class JammerIndicator {
    constructor() { this.visible = false; this.drawCount = 0; this.lastProjection = null; }
    getCameraCenter(fallbackX) { return window.sector1Progression?.getCameraX ? window.sector1Progression.getCameraX(fallbackX) : (window.gameCamera?.centerX || fallbackX || 960); }
    getProjection() {
      const env = window.BARCODE && window.BARCODE.JammerEnvironment;
      const status = env && env.getStatus ? env.getStatus() : null;
      if (!status || !status.revealed || status.destroyed) return null;
      const bounds = env.getAimBounds ? env.getAimBounds() : { x: status.position.x - 45, y: status.position.y - 120, width: 90, height: 120 };
      const canvas = document.getElementById('gameCanvas') || { width: 1920, height: 1080 };
      const zoom = window.renderer && typeof window.renderer.getZoomLevel === 'function' ? window.renderer.getZoomLevel() : (window.renderer && window.renderer.zoomLevel) || 1;
      const playerX = window.player?.position?.x || status.position.x;
      const cameraX = this.getCameraCenter(playerX);
      const screenX = canvas.width / 2 + (bounds.x + bounds.width / 2 - cameraX) * zoom;
      const screenY = canvas.height / 2 + (bounds.y + bounds.height / 2 - ((window.BARCODE?.LEVEL_01_LAYOUT?.VIEWPORT?.height || 1080) / 2)) * zoom;
      const left = canvas.width / 2 + (bounds.x - cameraX) * zoom;
      const right = canvas.width / 2 + (bounds.x + bounds.width - cameraX) * zoom;
      const top = canvas.height / 2 + (bounds.y - ((window.BARCODE?.LEVEL_01_LAYOUT?.VIEWPORT?.height || 1080) / 2)) * zoom;
      const bottom = canvas.height / 2 + (bounds.y + bounds.height - ((window.BARCODE?.LEVEL_01_LAYOUT?.VIEWPORT?.height || 1080) / 2)) * zoom;
      const onscreen = right >= 0 && left <= canvas.width && bottom >= 0 && top <= canvas.height;
      return { screenX, screenY, onscreen, canvas, cameraX, zoom, bounds };
    }
    update() { const p = this.getProjection(); this.lastProjection = p; this.visible = !!(p && !p.onscreen); return this.visible; }
    draw(ctx) {
      const p = this.getProjection(); this.lastProjection = p; this.visible = !!(p && !p.onscreen);
      if (!ctx || !this.visible) return;
      this.drawCount += 1;
      const safe = { left: 90, right: p.canvas.width - 90, top: 130, bottom: p.canvas.height - 90 };
      const cx = p.canvas.width / 2; const cy = p.canvas.height / 2;
      const angle = Math.atan2(p.screenY - cy, p.screenX - cx);
      const x = Math.max(safe.left, Math.min(safe.right, cx + Math.cos(angle) * (p.canvas.width / 2 - 140)));
      const y = Math.max(safe.top, Math.min(safe.bottom, cy + Math.sin(angle) * (p.canvas.height / 2 - 170)));
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = '#ff00ff'; ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(-18, -16); ctx.lineTo(-10, 0); ctx.lineTo(-18, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.rotate(-angle); ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText('JAMMER', 0, 34); ctx.restore();
    }
    reset() { this.visible = false; this.drawCount = 0; this.lastProjection = null; }
    static hasOffScreenJammer() { const temp = new window.JammerIndicator(); return temp.update(); }
    static getNearestOffScreenJammer() { const env = window.BARCODE && window.BARCODE.JammerEnvironment; const pos = env?.getPosition?.(); return window.JammerIndicator.hasOffScreenJammer() ? { position: pos, environmental: true, active: true } : null; }
  };
  window.jammerIndicator = null;
  window.initJammerIndicator = function() { if (!window.jammerIndicator) window.jammerIndicator = new window.JammerIndicator(); return true; };
})();
