// Session-only Level 1 diagnostics for Makko's embedded preview.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/level-01-debug.js',
  exports: ['DEBUG.level1'],
  dependencies: ['sector1Progression']
});

(function() {
  'use strict';

  window.BARCODE = window.BARCODE || {};
  window.DEBUG = window.DEBUG || {};
  window.BARCODE.DEBUG_LEVEL_1_SESSION = false;

  const overlayState = { enabled: false };
  const PANEL_ID = 'level-01-debug-panel';

  function isUnlocked() { return window.BARCODE.DEBUG_LEVEL_1_SESSION === true; }
  function progression() { return window.sector1Progression || window.initSector1Progression?.(window.player); }
  function disabled() { return { ok: false, reason: 'debug-disabled' }; }
  function call(method, ...args) {
    if (!isUnlocked()) return disabled();
    const owner = progression();
    return owner && typeof owner[method] === 'function' ? owner[method](...args) : { ok: false, reason: 'debug-method-unavailable', method };
  }

  function getZoom() {
    const value = window.renderer && typeof window.renderer.getZoomLevel === 'function' ? window.renderer.getZoomLevel() : window.renderer?.zoomLevel;
    return Math.max(0.1, Number.isFinite(value) ? value : 1);
  }

  function getCameraCenter() {
    if (window.gameCamera && Number.isFinite(window.gameCamera.centerX)) return window.gameCamera.centerX;
    const playerX = window.player?.position?.x || 960;
    return window.clamp ? window.clamp(playerX, 960, 3136) : Math.max(960, Math.min(3136, playerX));
  }

  function worldToScreen(point) {
    const zoom = getZoom();
    const cameraCenter = getCameraCenter();
    return {
      x: 960 + zoom * (point.x - cameraCenter),
      y: 425 + 250 * (1 - zoom) + zoom * (point.y - 425)
    };
  }

  function normalizeRect(rect) {
    if (!rect) return null;
    const x = Number.isFinite(rect.x) ? rect.x : rect.left;
    const y = Number.isFinite(rect.y) ? rect.y : rect.top;
    const width = Number.isFinite(rect.width) ? rect.width : Number.isFinite(rect.w) ? rect.w : rect.right - rect.left;
    const height = Number.isFinite(rect.height) ? rect.height : Number.isFinite(rect.h) ? rect.h : rect.bottom - rect.top;
    return [x, y, width, height].every(Number.isFinite) ? { x, y, width, height } : null;
  }

  function drawWorldRect(ctx, rect, color, label) {
    const normalized = normalizeRect(rect);
    if (!normalized) return;
    const topLeft = worldToScreen({ x: normalized.x, y: normalized.y });
    const bottomRight = worldToScreen({ x: normalized.x + normalized.width, y: normalized.y + normalized.height });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    if (label) {
      ctx.fillStyle = color;
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, topLeft.x + 3, topLeft.y - 3);
    }
  }

  function drawWorldPoint(ctx, point, color, label) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    const projected = worldToScreen(point);
    ctx.fillStyle = color;
    ctx.fillRect(projected.x - 4, projected.y - 4, 8, 8);
    if (label) {
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, projected.x + 7, projected.y - 5);
    }
  }

  function drawOverlay(ctx) {
    if (!isUnlocked() || !overlayState.enabled || !ctx) return;
    const owner = progression();
    ctx.save();

    const groundLeft = worldToScreen({ x: 0, y: 750 });
    const groundRight = worldToScreen({ x: 4096, y: 750 });
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(groundLeft.x, groundLeft.y);
    ctx.lineTo(groundRight.x, groundRight.y);
    ctx.stroke();

    (window.Sector1Progression?.STAGE_SURFACES || []).forEach(surface => drawWorldRect(ctx, surface, '#00ffff', surface.id));
    if (window.player?.getHitbox) drawWorldRect(ctx, window.player.getHitbox(), '#00ff66', 'player hitbox');
    if (window.player?.position) drawWorldPoint(ctx, window.player.position, '#ffff00', 'player foot');

    (window.enemyManager?.enemies || []).forEach((enemy, index) => {
      if (!enemy?.active) return;
      if (typeof enemy.getHitbox === 'function') drawWorldRect(ctx, enemy.getHitbox(), enemy.isSpawnProtected?.() ? '#ffffff' : '#ff9900', `${enemy.type} ${index}`);
      drawWorldPoint(ctx, enemy.position, '#ff00ff', 'foot');
      if (enemy._entranceTarget) drawWorldPoint(ctx, enemy._entranceTarget, '#00ff88', 'entrance target');
    });

    const jammerBounds = window.BARCODE?.JammerEnvironment?.getAimBounds?.();
    if (jammerBounds) drawWorldRect(ctx, jammerBounds, '#ff00ff', 'jammer aim bounds');
    const bossBounds = owner?.getBossVisualBounds?.();
    if (bossBounds) drawWorldRect(ctx, bossBounds, '#ff3300', 'boss visual bounds');
    if (owner?.lastSpawnPlan?.accepted) drawWorldPoint(ctx, owner.lastSpawnPlan.accepted, '#00ff88', 'last spawn');

    const zoom = getZoom();
    const center = getCameraCenter();
    const halfWidth = 960 / zoom;
    drawWorldRect(ctx, { x: center - halfWidth, y: 0, width: halfWidth * 2, height: 850 }, '#ffffff', `camera z=${zoom.toFixed(3)}`);

    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(14, 255, 390, 78);
    ctx.strokeStyle = '#00ffff';
    ctx.strokeRect(14, 255, 390, 78);
    ctx.font = '13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#00ffff';
    ctx.fillText('LEVEL 1 GEOMETRY OVERLAY', 24, 266);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`camera=${center.toFixed(1)} zoom=${zoom.toFixed(3)} state=${owner?.state || 'n/a'}`, 24, 286);
    ctx.fillText(`kills=${owner?.missionDefeats || 0}/20 pending=${owner?.pendingSpawns?.length || 0}`, 24, 305);
    ctx.restore();
  }

  function toggleOverlay() {
    if (!isUnlocked()) return disabled();
    overlayState.enabled = !overlayState.enabled;
    return { ok: true, enabled: overlayState.enabled };
  }

  window.DEBUG.level1 = Object.freeze({
    status: () => isUnlocked() ? progression()?.getDiagnostics?.() : disabled(),
    skipTutorial: () => call('debugSkipTutorial'),
    gotoEncounter: number => call('debugGotoEncounter', number),
    completeEncounter: () => call('debugCompleteEncounter'),
    gotoJammer: () => call('debugGotoJammer'),
    damageJammer: (amount = 1) => call('debugDamageJammer', amount),
    destroyJammer: () => call('debugDestroyJammer'),
    resetMission: () => call('debugResetMission'),
    toggleOverlay,
    drawOverlay
  });

  function makeButton(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.style.cssText = 'display:block;width:220px;margin:4px 0;padding:5px;background:#101522;color:#00ffff;border:1px solid #00ffff;font:12px monospace;text-align:left;cursor:pointer;';
    button.addEventListener('click', () => action());
    return button;
  }

  function ensurePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (panel || !document.body) return panel;
    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.cssText = 'display:none;position:fixed;right:12px;top:76px;z-index:2147483647;width:236px;max-height:calc(100vh - 100px);overflow:auto;padding:9px;background:rgba(0,5,14,.94);color:#fff;border:2px solid #00ffff;box-shadow:0 0 14px #00ffff;font:12px monospace;';
    const title = document.createElement('div');
    title.textContent = 'LEVEL 1 DEBUG — SESSION ONLY';
    title.style.cssText = 'margin-bottom:7px;color:#ff00ff;font-weight:bold;';
    panel.appendChild(title);
    panel.appendChild(makeButton('Skip Tutorial', () => window.DEBUG.level1.skipTutorial()));
    [1, 2, 3, 4].forEach(number => panel.appendChild(makeButton(`Go to Encounter ${number}`, () => window.DEBUG.level1.gotoEncounter(number))));
    panel.appendChild(makeButton('Complete Current Encounter', () => window.DEBUG.level1.completeEncounter()));
    panel.appendChild(makeButton('Go to Jammer / Set 20 Kills', () => window.DEBUG.level1.gotoJammer()));
    panel.appendChild(makeButton('Damage Jammer Once', () => window.DEBUG.level1.damageJammer(1)));
    panel.appendChild(makeButton('Destroy Jammer / Boss Intro', () => window.DEBUG.level1.destroyJammer()));
    panel.appendChild(makeButton('Toggle Geometry Overlay', () => window.DEBUG.level1.toggleOverlay()));
    panel.appendChild(makeButton('Reset Level 1 Mission', () => window.DEBUG.level1.resetMission()));
    document.body.appendChild(panel);
    return panel;
  }

  function setPanelVisible(visible) {
    const panel = ensurePanel();
    if (panel) panel.style.display = visible ? 'block' : 'none';
  }

  function unlockAndOpen() {
    window.BARCODE.DEBUG_LEVEL_1_SESSION = true;
    setPanelVisible(true);
  }

  window.addEventListener('keydown', event => {
    if (event.key !== 'F1') return;
    if (!isUnlocked()) {
      if (!event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      unlockAndOpen();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const panel = ensurePanel();
    setPanelVisible(!panel || panel.style.display === 'none');
  }, true);
})();
