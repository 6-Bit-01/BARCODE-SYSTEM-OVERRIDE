// Authoritative Level 1 spatial layout and presentation model.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/level-01-layout.js',
  exports: ['BARCODE.LEVEL_01_LAYOUT', 'BARCODE.Level01Presentation'],
  dependencies: []
});

window.BARCODE = window.BARCODE || {};
(function(namespace) {
  'use strict';

  const WORLD_WIDTH = 4096;
  const VIEWPORT = Object.freeze({ width: 1920, height: 1080 });
  const GROUND_Y = 890;

  const STAGE_SURFACES = Object.freeze([
    { id: 'signal-awning', x: 650, y: 650, w: 430, h: 26 },
    { id: 'cache-bridge', x: 1390, y: 625, w: 520, h: 26 },
    { id: 'firewall-deck', x: 2230, y: 650, w: 620, h: 26 },
    { id: 'broadcast-ramp', x: 3150, y: 625, w: 620, h: 26 }
  ]);

  const ENCOUNTER_GATES = Object.freeze([
    { id: 'gate_1', encounterId: 'encounter_1', x: 1320, y: 620, w: 34, h: GROUND_Y - 620 },
    { id: 'gate_2', encounterId: 'encounter_2', x: 2110, y: 620, w: 34, h: GROUND_Y - 620 },
    { id: 'gate_3', encounterId: 'encounter_3', x: 3000, y: 620, w: 34, h: GROUND_Y - 620 },
    { id: 'gate_4', encounterId: 'encounter_4', x: 4010, y: 620, w: 34, h: GROUND_Y - 620 }
  ]);

  const ENCOUNTERS = Object.freeze([
    { id: 'encounter_1', triggerX: 520, label: 'Signal Alley', enemies: [{ type: 'virus', x: 760, y: GROUND_Y }, { type: 'virus', x: 920, y: GROUND_Y }, { type: 'corrupted', x: 1080, y: GROUND_Y }, { type: 'virus', x: 1230, y: GROUND_Y }] },
    { id: 'encounter_2', triggerX: 1280, label: 'Cache Overpass', enemies: [{ type: 'virus', x: 1440, y: GROUND_Y }, { type: 'corrupted', x: 1590, y: GROUND_Y }, { type: 'virus', x: 1740, y: GROUND_Y }, { type: 'corrupted', x: 1880, y: GROUND_Y }, { type: 'virus', x: 2020, y: GROUND_Y }] },
    { id: 'encounter_3', triggerX: 2140, label: 'Firewall Plaza', enemies: [{ type: 'corrupted', x: 2300, y: GROUND_Y }, { type: 'virus', x: 2440, y: GROUND_Y }, { type: 'firewall', x: 2600, y: GROUND_Y }, { type: 'virus', x: 2760, y: GROUND_Y }, { type: 'corrupted', x: 2900, y: GROUND_Y }] },
    { id: 'encounter_4', triggerX: 3050, label: 'Broadcast Gate', enemies: [{ type: 'virus', x: 3180, y: GROUND_Y }, { type: 'corrupted', x: 3320, y: GROUND_Y }, { type: 'virus', x: 3460, y: GROUND_Y }, { type: 'firewall', x: 3600, y: GROUND_Y }, { type: 'corrupted', x: 3740, y: GROUND_Y }, { type: 'virus', x: 3880, y: GROUND_Y }] }
  ]);

  const PRESENTATION = Object.freeze({
    player: Object.freeze({ targetHeight: 192, bodyWidth: 70, bodyHeight: 156, manifests: Object.freeze({
      idle: Object.freeze({ width: 86, height: 96, anchorX: 43, anchorY: 95 }),
      jump: Object.freeze({ width: 41, height: 96, anchorX: 21, anchorY: 95 }),
      walk: Object.freeze({ width: 66, height: 96, anchorX: 33, anchorY: 94 }),
      rhythm: Object.freeze({ width: 51, height: 96, anchorX: 26, anchorY: 95 })
    }) }),
    enemies: Object.freeze({
      virus: Object.freeze({ targetHeight: 74, bodyWidth: 42, bodyHeight: 50, manifests: Object.freeze({ idle: Object.freeze({ width: 96, height: 93, anchorX: 48, anchorY: 92 }), default: Object.freeze({ width: 96, height: 93, anchorX: 48, anchorY: 92 }) }) }),
      corrupted: Object.freeze({ targetHeight: 122, bodyWidth: 70, bodyHeight: 92, manifests: Object.freeze({ idle: Object.freeze({ width: 80, height: 96, anchorX: 40, anchorY: 84 }), walk: Object.freeze({ width: 74, height: 96, anchorX: 37, anchorY: 95 }), default: Object.freeze({ width: 80, height: 96, anchorX: 40, anchorY: 84 }) }) }),
      firewall: Object.freeze({ targetHeight: 176, bodyWidth: 132, bodyHeight: 142, manifests: Object.freeze({ idle: Object.freeze({ width: 96, height: 93, anchorX: 48, anchorY: 92 }), walk: Object.freeze({ width: 68, height: 96, anchorX: 34, anchorY: 95 }), attack: Object.freeze({ width: 96, height: 67, anchorX: 48, anchorY: 66 }), default: Object.freeze({ width: 96, height: 93, anchorX: 48, anchorY: 92 }) }) })
    }),
    jammer: Object.freeze({ targetHeight: 168, bodyWidth: 118, bodyHeight: 150, manifest: Object.freeze({ width: 256, height: 219, anchorX: 128, anchorY: 214 }), damageRange: 520 }),
    boss: Object.freeze({ targetHeight: 260, manifests: Object.freeze({ walk: Object.freeze({ width: 200, height: 256, anchorX: 100, anchorY: 253 }), idle: Object.freeze({ width: 256, height: 179, anchorX: 128, anchorY: 178 }), flourish: Object.freeze({ width: 256, height: 155, anchorX: 128, anchorY: 154 }), attack: Object.freeze({ width: 256, height: 155, anchorX: 128, anchorY: 154 }) }) })
  });

  const FOREGROUND = Object.freeze({ nativeWidth: 1279, nativeHeight: 462, renderedWidth: WORLD_WIDTH, renderedHeight: 1479, footPlaneNativeY: 400, footPlaneRatio: 400 / 462 });

  const SPAWN = Object.freeze({ offscreenPadding: 140, playerExclusionRadius: 350, recentSpawnRadius: 180, protectionMs: 700, staggerMs: 350, jammerReinforcementCap: 4, jammerCadenceMinMs: 3000, jammerCadenceMaxMs: 4500 });
  const CINEMATIC = Object.freeze({ freezeMs: 800, panMs: 2000, flourishMs: 900, bossFrameX: 3136, bossStopX: 3650, bossGroundY: GROUND_Y, bossSpeed: 140 });

  function transform(foot, manifest, targetHeight, facing) {
    const anchorY = Number.isFinite(manifest.anchorY) ? manifest.anchorY : manifest.height;
    const anchorX = Number.isFinite(manifest.anchorX) ? manifest.anchorX : manifest.width / 2;
    const scale = targetHeight / anchorY;
    const width = manifest.width * scale;
    const height = manifest.height * scale;
    const x = foot.x - anchorX * scale;
    const y = foot.y - anchorY * scale;
    return Object.freeze({ x, y, width, height, scale, flipH: facing < 0, foot: Object.freeze({ x: foot.x, y: foot.y }), anchorX: anchorX * scale, anchorY: anchorY * scale, source: manifest });
  }
  function body(foot, width, height) { return Object.freeze({ x: foot.x - width / 2, y: foot.y - height, w: width, h: height, left: foot.x - width / 2, right: foot.x + width / 2, top: foot.y - height, bottom: foot.y }); }
  function playerManifestKey(player) { return player && player.state === 'walk' ? 'walk' : player && player.state === 'jump' ? 'jump' : player && player.state === 'rhythm' ? 'rhythm' : 'idle'; }
  function enemyManifestKey(enemy) { const anim = enemy && (enemy.currentAnimation || enemy.state || ''); if (/attack/.test(anim)) return 'attack'; if (/walk|patrol|chase|normal/.test(anim)) return 'walk'; return 'idle'; }
  function playerTransform(player) { const manifest = PRESENTATION.player.manifests[playerManifestKey(player)] || PRESENTATION.player.manifests.idle; return transform(player.position, manifest, PRESENTATION.player.targetHeight, player.facing || 1); }
  function playerBody(player) { return body(player.position, PRESENTATION.player.bodyWidth, PRESENTATION.player.bodyHeight); }
  function enemyTransform(enemy) { const p = PRESENTATION.enemies[enemy.type] || PRESENTATION.enemies.virus; const manifest = p.manifests[enemyManifestKey(enemy)] || p.manifests.default || p.manifests.idle; return transform(enemy.position, manifest, p.targetHeight, enemy.facing || 1); }
  function enemyBody(enemy) { const p = PRESENTATION.enemies[enemy.type] || PRESENTATION.enemies.virus; return body(enemy.position, p.bodyWidth, p.bodyHeight); }
  function jammerBounds(position) { return transform(position, PRESENTATION.jammer.manifest, PRESENTATION.jammer.targetHeight, 1); }
  function bossTransform(boss) { const key = boss && boss.state === 'idle' ? 'idle' : boss && boss.state === 'flourish' ? 'flourish' : 'walk'; return transform({ x: boss.x, y: boss.y }, PRESENTATION.boss.manifests[key], PRESENTATION.boss.targetHeight, -1); }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function getZoom() { return window.renderer && typeof window.renderer.getZoomLevel === 'function' ? window.renderer.getZoomLevel() : (window.renderer && Number.isFinite(window.renderer.zoomLevel) ? window.renderer.zoomLevel : 1); }
  function getCameraCenter(fallbackPlayer) {
    const min = VIEWPORT.width / 2;
    const max = WORLD_WIDTH - VIEWPORT.width / 2;
    if (window.sector1Progression && window.sector1Progression.cameraOverrideActive && Number.isFinite(window.sector1Progression.cameraX)) return clamp(window.sector1Progression.cameraX, min, max);
    if (window.gameCamera && Number.isFinite(window.gameCamera.centerX)) return clamp(window.gameCamera.centerX, min, max);
    const playerX = fallbackPlayer && fallbackPlayer.position ? fallbackPlayer.position.x : (window.player && window.player.position ? window.player.position.x : min);
    return clamp(playerX, min, max);
  }
  function foregroundDrawX(cameraCenter) { const min = VIEWPORT.width / 2; const max = WORLD_WIDTH - VIEWPORT.width / 2; const center = Number.isFinite(cameraCenter) ? clamp(cameraCenter, min, max) : getCameraCenter(); return VIEWPORT.width / 2 - center; }
  const RENDER_TRANSFORM = Object.freeze({ centerX: VIEWPORT.width / 2, centerY: 850 / 2, verticalOffsetScale: 100 / 0.4 });
  function zoomVerticalOffset(zoom) { return (1 - zoom) * RENDER_TRANSFORM.verticalOffsetScale; }
  function visibleWorldBounds(cameraCenter, zoom) { const z = Math.max(0.1, Number.isFinite(zoom) ? zoom : getZoom()); const min = VIEWPORT.width / 2; const max = WORLD_WIDTH - VIEWPORT.width / 2; const center = Number.isFinite(cameraCenter) ? clamp(cameraCenter, min, max) : getCameraCenter(); const halfX = VIEWPORT.width / 2 / z; const top = RENDER_TRANSFORM.centerY - (RENDER_TRANSFORM.centerY + zoomVerticalOffset(z)) / z; const bottom = top + VIEWPORT.height / z; return Object.freeze({ left: Math.max(0, center - halfX), right: Math.min(WORLD_WIDTH, center + halfX), top, bottom, center, zoom: z }); }
  function worldToScreen(point, options) { options = options || {}; const z = Math.max(0.1, Number.isFinite(options.zoom) ? options.zoom : getZoom()); const min = VIEWPORT.width / 2; const max = WORLD_WIDTH - VIEWPORT.width / 2; const center = Number.isFinite(options.cameraCenter) ? clamp(options.cameraCenter, min, max) : getCameraCenter(); return Object.freeze({ x: RENDER_TRANSFORM.centerX + (point.x - center) * z, y: RENDER_TRANSFORM.centerY + zoomVerticalOffset(z) + (point.y - RENDER_TRANSFORM.centerY) * z, cameraCenter: center, zoom: z }); }

  namespace.LEVEL_01_LAYOUT = Object.freeze({ WORLD_WIDTH, VIEWPORT, GROUND_Y, STAGE_SURFACES, ENCOUNTER_GATES, ENCOUNTERS, PRESENTATION, FOREGROUND, SPAWN, CINEMATIC, RENDER_TRANSFORM, JAMMER_CANDIDATES: Object.freeze([{ x: 620, y: GROUND_Y }, { x: 3520, y: GROUND_Y }]) });
  namespace.Level01Presentation = Object.freeze({ transform, body, playerTransform, playerBody, enemyTransform, enemyBody, jammerBounds, bossTransform, playerManifestKey, enemyManifestKey });
  namespace.Level01Camera = Object.freeze({ getCameraCenter, foregroundDrawX, visibleWorldBounds, worldToScreen, zoomVerticalOffset, getZoom });
})(window.BARCODE);
