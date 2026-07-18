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
    { id: 'signal-awning', x: 650, y: 790, w: 430, h: 26 },
    { id: 'cache-bridge', x: 1390, y: 765, w: 520, h: 26 },
    { id: 'firewall-deck', x: 2230, y: 790, w: 620, h: 26 },
    { id: 'broadcast-ramp', x: 3150, y: 765, w: 620, h: 26 }
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
    player: Object.freeze({ targetHeight: 192, bodyWidth: 70, bodyHeight: 156, manifest: Object.freeze({ width: 128, height: 128 }) }),
    enemies: Object.freeze({
      virus: Object.freeze({ targetHeight: 74, bodyWidth: 42, bodyHeight: 50, manifest: Object.freeze({ width: 64, height: 64 }) }),
      corrupted: Object.freeze({ targetHeight: 122, bodyWidth: 70, bodyHeight: 92, manifest: Object.freeze({ width: 96, height: 96 }) }),
      firewall: Object.freeze({ targetHeight: 176, bodyWidth: 132, bodyHeight: 142, manifest: Object.freeze({ width: 160, height: 160 }) })
    }),
    jammer: Object.freeze({ targetHeight: 168, bodyWidth: 118, bodyHeight: 150, manifest: Object.freeze({ width: 120, height: 160 }), damageRange: 520 }),
    boss: Object.freeze({ targetHeight: 260, manifests: Object.freeze({ walk: Object.freeze({ width: 200, height: 256 }), idle: Object.freeze({ width: 256, height: 179 }), flourish: Object.freeze({ width: 256, height: 155 }), attack: Object.freeze({ width: 256, height: 155 }) }) })
  });

  const SPAWN = Object.freeze({ offscreenPadding: 140, playerExclusionRadius: 350, recentSpawnRadius: 180, protectionMs: 700, staggerMs: 350, jammerReinforcementCap: 4, jammerCadenceMinMs: 3000, jammerCadenceMaxMs: 4500 });
  const CINEMATIC = Object.freeze({ freezeMs: 800, panMs: 2000, flourishMs: 900, bossFrameX: 3136, bossStopX: 3650, bossGroundY: GROUND_Y, bossSpeed: 140 });

  function transform(foot, manifest, targetHeight, facing) {
    const scale = targetHeight / manifest.height;
    const width = manifest.width * scale;
    const height = manifest.height * scale;
    return Object.freeze({ x: foot.x - width / 2, y: foot.y - height, width, height, scale, flipH: facing < 0, foot: Object.freeze({ x: foot.x, y: foot.y }) });
  }
  function body(foot, width, height) { return Object.freeze({ x: foot.x - width / 2, y: foot.y - height, w: width, h: height, left: foot.x - width / 2, right: foot.x + width / 2, top: foot.y - height, bottom: foot.y }); }
  function playerTransform(player) { return transform(player.position, PRESENTATION.player.manifest, PRESENTATION.player.targetHeight, player.facing || 1); }
  function playerBody(player) { return body(player.position, PRESENTATION.player.bodyWidth, PRESENTATION.player.bodyHeight); }
  function enemyTransform(enemy) { const p = PRESENTATION.enemies[enemy.type] || PRESENTATION.enemies.virus; return transform(enemy.position, p.manifest, p.targetHeight, enemy.facing || 1); }
  function enemyBody(enemy) { const p = PRESENTATION.enemies[enemy.type] || PRESENTATION.enemies.virus; return body(enemy.position, p.bodyWidth, p.bodyHeight); }
  function jammerBounds(position) { return transform(position, PRESENTATION.jammer.manifest, PRESENTATION.jammer.targetHeight, 1); }
  function bossTransform(boss) { const key = boss && boss.state === 'idle' ? 'idle' : boss && boss.state === 'flourish' ? 'flourish' : 'walk'; return transform({ x: boss.x, y: boss.y }, PRESENTATION.boss.manifests[key], PRESENTATION.boss.targetHeight, -1); }

  namespace.LEVEL_01_LAYOUT = Object.freeze({ WORLD_WIDTH, VIEWPORT, GROUND_Y, STAGE_SURFACES, ENCOUNTER_GATES, ENCOUNTERS, PRESENTATION, SPAWN, CINEMATIC, JAMMER_CANDIDATES: Object.freeze([{ x: 620, y: GROUND_Y }, { x: 3520, y: GROUND_Y }]) });
  namespace.Level01Presentation = Object.freeze({ transform, body, playerTransform, playerBody, enemyTransform, enemyBody, jammerBounds, bossTransform });
})(window.BARCODE);
