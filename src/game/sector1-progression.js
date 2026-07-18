// Sector 1 authored Level 1 mission progression owner.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/sector1-progression.js', exports: ['Sector1Progression', 'sector1Progression', 'initSector1Progression'], dependencies: ['player', 'enemyManager', 'BARCODE.JammerEnvironment'] });

(function() {
  const WORLD_WIDTH = 4096;
  const CANVAS_WIDTH = 1920;
  const GROUND_Y = 750;
  // Player.position.y and boss.y already represent the authored foot-contact
  // line (physics ground 750 -> foreground sidewalk 750). Per-frame sprite
  // compensation resolves to that line without a second world-space offset.
  const PLAYER_VISUAL_FOOT_OFFSET = 0;
  const CAMERA_MIN = CANVAS_WIDTH / 2;
  const CAMERA_MAX = WORLD_WIDTH - CANVAS_WIDTH / 2;

  const STATES = Object.freeze({
    TUTORIAL: 'tutorial', ENCOUNTER_1: 'encounter_1', ENCOUNTER_2: 'encounter_2', ENCOUNTER_3: 'encounter_3', ENCOUNTER_4: 'encounter_4',
    JAMMER_ACTIVE: 'jammer_active', FREEZE: 'jammer_destroyed_freeze', ENEMY_PURGE: 'enemy_purge', CAMERA_PAN: 'camera_pan',
    BOSS_WALK_IN: 'boss_walk_in', BOSS_CLOSE_UP: 'boss_close_up', BOSS_FLOURISH: 'boss_flourish', BOSS_HOLD: 'boss_hold',
    CAMERA_RETURN: 'camera_return', BOSS_READY: 'boss_ready'
  });

  const ENCOUNTERS = Object.freeze([
    { id: 'encounter_1', triggerX: 520, label: 'Signal Alley', enemies: [{ type: 'virus', x: 760, y: 650 }, { type: 'virus', x: 920, y: 650 }, { type: 'corrupted', x: 1080, y: 650 }, { type: 'virus', x: 1230, y: 650 }] },
    { id: 'encounter_2', triggerX: 1280, label: 'Cache Overpass', enemies: [{ type: 'virus', x: 1440, y: 650 }, { type: 'corrupted', x: 1590, y: 650 }, { type: 'virus', x: 1740, y: 650 }, { type: 'corrupted', x: 1880, y: 650 }, { type: 'virus', x: 2020, y: 650 }] },
    { id: 'encounter_3', triggerX: 2140, label: 'Firewall Plaza', enemies: [{ type: 'corrupted', x: 2300, y: 650 }, { type: 'virus', x: 2440, y: 650 }, { type: 'firewall', x: 2600, y: 650 }, { type: 'virus', x: 2760, y: 650 }, { type: 'corrupted', x: 2900, y: 650 }] },
    { id: 'encounter_4', triggerX: 3050, label: 'Broadcast Gate', enemies: [{ type: 'virus', x: 3180, y: 650 }, { type: 'corrupted', x: 3320, y: 650 }, { type: 'virus', x: 3460, y: 650 }, { type: 'firewall', x: 3600, y: 650 }, { type: 'corrupted', x: 3740, y: 650 }, { type: 'virus', x: 3880, y: 650 }] }
  ]);

  // Calibrated against the locked 1279x462 Level 1 foreground image using the
  // renderer's 4400x1589 draw at (-152, -550). The added storefront/sign steps
  // use visible architectural top edges to connect the existing roof route
  // without placing walkable surfaces inside the HUD or above the viewport.
  const STAGE_SURFACES = Object.freeze([
    { id: 'signal-storefront', x: 752, y: 578, w: 485, h: 8 },
    { id: 'signal-awning', x: 701, y: 492, w: 561, h: 8 },
    { id: 'cache-bridge', x: 1492, y: 337, w: 337, h: 8 },
    { id: 'firewall-storefront', x: 1964, y: 781, w: 375, h: 8 },
    { id: 'firewall-deck', x: 2002, y: 506, w: 513, h: 8 },
    { id: 'firewall-sign', x: 2645, y: 413, w: 492, h: 8 },
    { id: 'broadcast-storefront', x: 3305, y: 643, w: 440, h: 8 },
    { id: 'broadcast-ramp', x: 3295, y: 506, w: 461, h: 8 }
  ]);

  const ENCOUNTER_GATES = Object.freeze([
    { id: 'gate_1', encounterId: 'encounter_1', x: 1320, y: 620, w: 34, h: 270 },
    { id: 'gate_2', encounterId: 'encounter_2', x: 2110, y: 620, w: 34, h: 270 },
    { id: 'gate_3', encounterId: 'encounter_3', x: 3000, y: 620, w: 34, h: 270 },
    { id: 'gate_4', encounterId: 'encounter_4', x: 4010, y: 620, w: 34, h: 270 }
  ]);

  const CINEMATIC = Object.freeze({
    freezeMs: 800,
    panMs: 2000,
    closeUpMs: 500,
    flourishMs: 4000,
    holdMs: 250,
    returnMs: 1600,
    wideZoomFloor: 0.92,
    closeZoom: 1.08,
    bossFrameX: 3136,
    bossStopX: 3480,
    bossArenaScreenX: 1440,
    bossGroundY: 750,
    bossSpeed: 140
  });
  const SPAWN = Object.freeze({
    offscreenPadding: 140,
    playerExclusionRadius: 350,
    protectionMs: 700,
    staggerMs: 350,
    entranceSpeed: 420,
    jammerReinforcementCap: 4,
    jammerCadenceMinMs: 3000,
    jammerCadenceMaxMs: 4500
  });
  const BOSS_PRESENTATION = Object.freeze({
    targetAnchorHeight: 253 * 0.8,
    walk: Object.freeze({
      width: 200,
      height: 256,
      anchorX: 100,
      anchorY: 253,
      footRows: Object.freeze([
        253, 250, 248, 246, 242, 241, 244, 244, 243, 241, 244, 247, 250, 254,
        254, 251, 247, 246, 244, 244, 245, 245, 241, 241, 244, 249, 251, 253,
        252, 250, 248, 243, 241, 243, 245, 244, 243, 247, 248, 251, 253
      ])
    }),
    flourish: Object.freeze({
      width: 256,
      height: 155,
      anchorX: 128,
      anchorY: 154,
      footRows: Object.freeze([
        126, 126, 125, 120, 119, 117, 118, 118, 119, 119, 119, 119, 119, 119,
        119, 119, 119, 119, 116, 115, 117, 120, 120, 120, 120, 120, 120, 120,
        120, 120, 154, 154, 148, 146, 130, 119, 119, 119, 119, 119, 119, 120,
        124, 125, 126, 126, 126, 126
      ])
    }),
    idle: Object.freeze({
      width: 256,
      height: 179,
      anchorX: 128,
      anchorY: 178,
      footRows: Object.freeze([
        178, 178, 178, 178, 178, 173, 167, 165, 161, 157, 157, 157, 157, 157,
        160, 165, 167, 170, 173, 173, 173, 173, 173, 173, 173, 173, 173, 169,
        168, 165, 162, 161, 159, 157, 157, 157, 157, 157, 157, 160, 162, 165,
        171, 173, 176, 177, 177, 177
      ])
    })
  });

  function totalQuota() { return ENCOUNTERS.reduce((sum, e) => sum + e.enemies.length, 0); }
  function clampCamera(x) { return window.clamp ? window.clamp(x, CAMERA_MIN, CAMERA_MAX) : Math.max(CAMERA_MIN, Math.min(CAMERA_MAX, x)); }
  function clampWorldX(x) { return Math.max(160, Math.min(WORLD_WIDTH - 160, x)); }
  function lerp(from, to, amount) { return from + (to - from) * amount; }
  function smoothStep(t) { return t * t * (3 - 2 * t); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  // The locked foreground is rendered 4400px wide around the 1920px canvas.
  // Keep both image edges beyond the viewport throughout an overridden camera move.
  function getForegroundCoverageZoomFloor(cameraX) {
    const leftFloor = (CANVAS_WIDTH / 2) / Math.max(1, cameraX + 152);
    const rightFloor = (CANVAS_WIDTH / 2) / Math.max(1, 4248 - cameraX);
    return Math.min(1.2, Math.max(leftFloor, rightFloor) + 0.02);
  }
  function debugAllowed() { return !!(window.BARCODE && window.BARCODE.DEBUG_LEVEL_1_SESSION === true); }
  function debugDisabled() { return { ok: false, reason: 'debug-disabled' }; }

  window.Sector1Progression = class Sector1Progression {
    constructor(player) { this.player = player || null; this.requiredEnemyKills = totalQuota(); this.reset(); this.state = STATES.TUTORIAL; }
    static get ENCOUNTERS() { return ENCOUNTERS; }
    static get GEOMETRY() { return STAGE_SURFACES; }
    static get STAGE_SURFACES() { return STAGE_SURFACES; }
    static get PLAYER_VISUAL_FOOT_OFFSET() { return PLAYER_VISUAL_FOOT_OFFSET; }
    static get ENCOUNTER_GATES() { return ENCOUNTER_GATES; }
    static get CINEMATIC() { return CINEMATIC; }
    static get STATES() { return STATES; }
    isAuthoritativeMissionActive() { return this.state !== STATES.TUTORIAL && this.state !== STATES.BOSS_READY; }
    shouldSuppressGenericSpawning() { return true; }
    isBossCinematicActive() { return [STATES.FREEZE, STATES.ENEMY_PURGE, STATES.CAMERA_PAN, STATES.BOSS_WALK_IN, STATES.BOSS_CLOSE_UP, STATES.BOSS_FLOURISH, STATES.BOSS_HOLD, STATES.CAMERA_RETURN].includes(this.state); }
    isGameplaySuppressed() { return this.isBossCinematicActive(); }
    getCameraX(fallback) { return this.cameraOverrideActive ? clampCamera(this.cameraX) : fallback; }
    getCinematicZoomOverride() { return Number.isFinite(this.cinematicZoomOverride) ? this.cinematicZoomOverride : null; }
    update(deltaTime = 0) {
      if (window.gameState && window.gameState.paused) return;
      this.player = this.player || window.player;
      this.pollPreparedAssets();
      const tutorialDone = !!(window.tutorialSystem && typeof window.tutorialSystem.isCompleted === 'function' && window.tutorialSystem.isCompleted() && typeof window.tutorialSystem.isActive === 'function' && !window.tutorialSystem.isActive());
      if (this.state === STATES.TUTORIAL && tutorialDone && !this.missionStarted) this.startMission();
      if (this.isGameplaySuppressed() && this.player) { this.player.controlsDisabled = true; if (this.frozenPlayerPosition) { this.player.position.x = this.frozenPlayerPosition.x; this.player.position.y = this.frozenPlayerPosition.y; } this.player.velocity.x = 0; this.player.velocity.y = 0; }
      if (/^encounter_/.test(this.state)) { this.applyGateCollision(); this.updateEncounter(); this.updatePendingSpawns(deltaTime); }
      else if (this.state === STATES.JAMMER_ACTIVE) this.updateJammerReinforcements(deltaTime);
      else if (this.state === STATES.FREEZE) this.advanceTimed(deltaTime, CINEMATIC.freezeMs, STATES.ENEMY_PURGE, () => this.purgeEnemies());
      else if (this.state === STATES.ENEMY_PURGE) this.transitionToPan();
      else if (this.state === STATES.CAMERA_PAN) this.updatePan(deltaTime);
      else if (this.state === STATES.BOSS_WALK_IN) this.updateBossWalk(deltaTime);
      else if (this.state === STATES.BOSS_CLOSE_UP) this.updateBossCloseUp(deltaTime);
      else if (this.state === STATES.BOSS_FLOURISH) this.updateBossFlourish(deltaTime);
      else if (this.state === STATES.BOSS_HOLD) this.updateBossHold(deltaTime);
      else if (this.state === STATES.CAMERA_RETURN) this.updateCameraReturn(deltaTime);
      else if (this.state === STATES.BOSS_READY) { this.updateBossSprite(deltaTime); if (this.cinematicZoomReleasePending) { this.cinematicZoomReleasePending = false; this.cinematicZoomOverride = null; } }
    }
    startMission() { this.state = STATES.ENCOUNTER_1; this.missionStarted = true; this.missionDefeats = 0; this.countedEnemies.clear(); this.spawnedEncounterIds.clear(); this.activeEncounterId = null; this.enemyManagerReset(); if (window.objectivesSystem?.setMissionDefeatObjective) window.objectivesSystem.setMissionDefeatObjective(0, this.requiredEnemyKills); }
    enemyManagerReset() { if (window.cancelInitialEnemySpawn) window.cancelInitialEnemySpawn(); if (window.enemyManager) window.enemyManager.clear(); if (window.gameState) { window.gameState.enemiesDefeated = 0; window.gameState.hasSpawnedInitialEnemies = true; } this.prepareAssetsForEncounter(0); }
    updateEncounter() { const index = ENCOUNTERS.findIndex(e => e.id === this.state); const def = ENCOUNTERS[index]; if (!def) return; const px = this.player?.position?.x || 0; if (!this.spawnedEncounterIds.has(def.id) && px >= def.triggerX) this.spawnEncounter(def); const noPendingSpawns = !this.pendingSpawns || this.pendingSpawns.length === 0; if (this.activeEncounterId === def.id && noPendingSpawns && this.activeEncounterEnemies.length > 0 && this.activeEncounterEnemies.every(e => !e.active || e._defeatRecorded)) { this.openEncounterGate(def.id); if (index < ENCOUNTERS.length - 1) { this.state = ENCOUNTERS[index + 1].id; this.activeEncounterId = null; this.activeEncounterEnemies = []; this.closedGateEncounterId = null; this.prepareAssetsForEncounter(index + 1); } } }
    spawnEncounter(def) { this.spawnedEncounterIds.add(def.id); this.activeEncounterId = def.id; this.closedGateEncounterId = def.id; this.activeEncounterEnemies = []; this.pendingSpawns = def.enemies.map((spec, i) => ({ spec, encounterId: def.id, index: i, delayMs: i * SPAWN.staggerMs })); }
    updatePendingSpawns(deltaTime) { if (!this.pendingSpawns || this.pendingSpawns.length === 0) return; this.pendingSpawns.forEach(pending => { pending.delayMs -= deltaTime; }); const ready = this.pendingSpawns.filter(pending => pending.delayMs <= 0); this.pendingSpawns = this.pendingSpawns.filter(pending => pending.delayMs > 0); ready.forEach(pending => this.activeEncounterEnemies.push(this.spawnMissionEnemy(pending.spec, pending.encounterId, pending.index))); }
    getVisibleWorldBounds() { const playerX = this.player?.position?.x || CAMERA_MIN; const cameraX = this.cameraOverrideActive && Number.isFinite(this.cameraX) ? clampCamera(this.cameraX) : clampCamera(playerX); const rawZoom = window.renderer && typeof window.renderer.getZoomLevel === 'function' ? window.renderer.getZoomLevel() : window.renderer?.zoomLevel; const zoom = Math.max(0.1, Number.isFinite(rawZoom) ? rawZoom : 1); const halfWidth = CANVAS_WIDTH / (2 * zoom); return { left: Math.max(0, cameraX - halfWidth), right: Math.min(WORLD_WIDTH, cameraX + halfWidth), center: cameraX, zoom }; }
    getSpawnBodyHalfWidth(type) { if (type === 'firewall') return 135; if (type === 'corrupted') return 50; return 40; }
    planSpawn(spec = {}) { const bounds = this.getVisibleWorldBounds(); const bodyHalf = this.getSpawnBodyHalfWidth(spec.type); const playerX = this.player?.position?.x || bounds.center; const left = { x: Math.max(bodyHalf, bounds.left - SPAWN.offscreenPadding - bodyHalf), side: 'left' }; const right = { x: Math.min(WORLD_WIDTH - bodyHalf, bounds.right + SPAWN.offscreenPadding + bodyHalf), side: 'right' }; const outside = candidate => candidate.x + bodyHalf <= bounds.left - SPAWN.offscreenPadding || candidate.x - bodyHalf >= bounds.right + SPAWN.offscreenPadding; const farFromPlayer = candidate => Math.abs(candidate.x - playerX) >= SPAWN.playerExclusionRadius + bodyHalf; const candidates = [left, right].filter(outside).sort((a, b) => Math.abs(a.x - (spec.x || playerX)) - Math.abs(b.x - (spec.x || playerX))); const accepted = candidates.find(farFromPlayer) || candidates[0] || [left, right].sort((a, b) => Math.abs(b.x - playerX) - Math.abs(a.x - playerX))[0]; this.lastSpawnPlan = { bounds, candidates, accepted: { x: accepted.x, y: Number.isFinite(spec.y) ? spec.y : GROUND_Y, side: accepted.side }, playerX, exclusionRadius: SPAWN.playerExclusionRadius, bodyHalf }; return { x: accepted.x, y: Number.isFinite(spec.y) ? spec.y : GROUND_Y, side: accepted.side }; }
    planEntranceTarget(spec = {}, origin = {}, index = 0) { const bodyHalf = this.getSpawnBodyHalfWidth(spec.type); const playerX = this.player?.position?.x || CAMERA_MIN; const clearance = SPAWN.playerExclusionRadius + bodyHalf; const authoredX = Math.max(bodyHalf, Math.min(WORLD_WIDTH - bodyHalf, Number.isFinite(spec.x) ? spec.x : playerX)); const originSide = origin.side || (origin.x < playerX ? 'left' : 'right'); const side = originSide === 'left' ? -1 : 1; const authoredStaysOnApproachSide = side < 0 ? authoredX <= playerX - clearance : authoredX >= playerX + clearance; if (authoredStaysOnApproachSide) return { x: authoredX, y: Number.isFinite(spec.y) ? spec.y : GROUND_Y }; const spread = Math.min(180, Math.max(0, Number(index) || 0) * 45); let targetX = Math.max(bodyHalf, Math.min(WORLD_WIDTH - bodyHalf, playerX + side * (clearance + spread))); if (Math.abs(targetX - playerX) < clearance) targetX = Math.max(bodyHalf, Math.min(WORLD_WIDTH - bodyHalf, playerX - side * (clearance + spread))); return { x: targetX, y: Number.isFinite(spec.y) ? spec.y : GROUND_Y }; }
    spawnMissionEnemy(spec, encounterId, index, options = {}) { const targetY = spec.type === 'virus' && Number.isFinite(spec.y) ? spec.y : GROUND_Y; const origin = options.origin || this.planSpawn({ ...spec, y: targetY }); const target = this.planEntranceTarget({ ...spec, y: targetY }, origin, index); const enemy = new window.Enemy(origin.x, origin.y, spec.type); /* Enemy constructors have legacy entrance code that rewrites some origins, so restore the authoritative planned origin after construction. */ enemy.position.x = origin.x; enemy.position.y = origin.y; enemy.originalSpawnX = origin.x; enemy.originalSpawnY = origin.y; enemy._dropEdge = null; enemy._sector1MissionEnemy = !options.jammerReinforcement && !options.tutorialEnemy; enemy._jammerReinforcement = !!options.jammerReinforcement; enemy._isTutorialEnemy = !!options.tutorialEnemy; enemy._sector1EncounterId = encounterId; enemy._sector1Index = index; enemy._entranceTarget = target; enemy._authoredEntranceActive = true; enemy._authoredEntranceSpeed = SPAWN.entranceSpeed; enemy.entranceComplete = false; enemy.state = 'authored_entrance'; enemy.spawnTimeMs = 0; enemy.spawnProtectionDuration = SPAWN.protectionMs; enemy.velocity.x = enemy._entranceTarget.x >= origin.x ? SPAWN.entranceSpeed : -SPAWN.entranceSpeed; enemy.velocity.y = 0; if (window.enemyManager) window.enemyManager.enemies.push(enemy); return enemy; }
    spawnTutorialEnemy(index = 0) { this.player = this.player || window.player; if (!window.enemyManager || !window.Enemy) return null; const playerX = this.player?.position?.x || CAMERA_MIN; const side = Number(index) % 2 === 0 ? -1 : 1; const spec = { type: 'virus', x: playerX + side * (SPAWN.playerExclusionRadius + 120 + Number(index) * 45), y: GROUND_Y }; return this.spawnMissionEnemy(spec, 'tutorial', index, { tutorialEnemy: true }); }
    keepEntranceTargetSafe(enemy) { if (!enemy?._authoredEntranceActive || !enemy._entranceTarget || !this.player?.position) return; const bodyHalf = this.getSpawnBodyHalfWidth(enemy.type); const playerX = this.player.position.x; const clearance = SPAWN.playerExclusionRadius + bodyHalf; const side = enemy.position.x < playerX ? -1 : 1; const targetStaysOnApproachSide = side < 0 ? enemy._entranceTarget.x <= playerX - clearance : enemy._entranceTarget.x >= playerX + clearance; if (targetStaysOnApproachSide) return; const spread = Math.min(180, Math.max(0, Number(enemy._sector1Index) || 0) * 45); let targetX = Math.max(bodyHalf, Math.min(WORLD_WIDTH - bodyHalf, playerX + side * (clearance + spread))); if (Math.abs(targetX - playerX) < clearance) targetX = Math.max(bodyHalf, Math.min(WORLD_WIDTH - bodyHalf, playerX - side * (clearance + spread))); enemy._entranceTarget.x = targetX; }
    onEnemyDefeated(authoritativeTotal, enemy) { if (!this.missionStarted || !enemy || !enemy._sector1MissionEnemy || this.countedEnemies.has(enemy)) return; this.countedEnemies.add(enemy); this.missionDefeats = Math.min(this.requiredEnemyKills, this.missionDefeats + 1); if (window.gameState) window.gameState.enemiesDefeated = this.missionDefeats; if (window.objectivesSystem?.updateMissionDefeatProgress) window.objectivesSystem.updateMissionDefeatProgress(this.missionDefeats, this.requiredEnemyKills); if (this.missionDefeats === this.requiredEnemyKills && !this.jammerRevealed) this.revealJammer(); }
    chooseJammerPosition() { const px = this.player?.position?.x || 960; const x = px < WORLD_WIDTH / 2 ? 3520 : 620; return { x, y: GROUND_Y }; }
    revealJammer() { this.state = STATES.JAMMER_ACTIVE; this.nextJammerSpawnMs = 0; this.jammerReinforcementCount = 0; this.jammerRevealed = true; this.closedGateEncounterId = null; const position = this.chooseJammerPosition(); window.BARCODE?.JammerEnvironment?.reveal({ position }); if (window.objectivesSystem?.revealJammerObjective) window.objectivesSystem.revealJammerObjective(); this.prepareBossAssets(); }
    updateJammerReinforcements(deltaTime) { const environment = window.BARCODE?.JammerEnvironment; const status = environment?.getStatus?.(); if (!status || !status.revealed || status.destroyed) return; this.nextJammerSpawnMs = Number.isFinite(this.nextJammerSpawnMs) ? this.nextJammerSpawnMs - deltaTime : 0; const activeReinforcements = (window.enemyManager?.enemies || []).filter(enemy => enemy && enemy.active && enemy._jammerReinforcement); if (activeReinforcements.length >= SPAWN.jammerReinforcementCap || this.nextJammerSpawnMs > 0) return; const types = ['virus', 'corrupted', 'virus', 'firewall']; const type = types[this.jammerReinforcementCount % types.length]; this.jammerReinforcementCount += 1; const jammerX = status.position?.x || this.chooseJammerPosition().x; const targetX = Math.max(180, Math.min(WORLD_WIDTH - 180, jammerX + (jammerX < WORLD_WIDTH / 2 ? 240 : -240))); this.spawnMissionEnemy({ type, x: targetX, y: GROUND_Y }, 'jammer_reinforcement', this.jammerReinforcementCount, { jammerReinforcement: true }); this.nextJammerSpawnMs = SPAWN.jammerCadenceMinMs + Math.random() * (SPAWN.jammerCadenceMaxMs - SPAWN.jammerCadenceMinMs); }
    onJammerDestroyed() { this.nextJammerSpawnMs = Infinity; if (this.jammerDestroyedNotified) return; this.jammerDestroyedNotified = true; this.captureCinematicStart(); this.freezePlayerForCinematic(); if (window.objectivesSystem?.completeJammerObjective) window.objectivesSystem.completeJammerObjective(); this.state = STATES.FREEZE; this.phaseElapsed = 0; this.cinematicStartedCount++; }
    getCurrentRendererZoom() { const renderer = window.renderer; const override = renderer && typeof renderer.getCinematicZoomOverride === 'function' ? renderer.getCinematicZoomOverride() : null; const current = Number.isFinite(override) ? override : (renderer && typeof renderer.getZoomLevel === 'function' ? renderer.getZoomLevel() : renderer?.zoomLevel); return Math.max(0.1, Number.isFinite(current) ? current : 1); }
    captureCinematicStart() { const player = this.player || window.player; const playerX = Number.isFinite(player?.position?.x) ? player.position.x : CAMERA_MIN; const playerY = Number.isFinite(player?.position?.y) ? player.position.y : GROUND_Y; this.cinematicStartCameraX = clampCamera((window.gameCamera && Number.isFinite(window.gameCamera.centerX)) ? window.gameCamera.centerX : playerX); this.cinematicStartPlayerPosition = { x: playerX, y: playerY }; this.cinematicStartZoom = this.getCurrentRendererZoom(); this.cinematicWideZoom = Math.max(CINEMATIC.wideZoomFloor, Math.min(1, this.cinematicStartZoom)); this.cinematicCloseZoom = Math.max(CINEMATIC.closeZoom, this.cinematicWideZoom); this.cinematicZoomOverride = this.cinematicStartZoom; this.cinematicZoomReleasePending = false; this.panStartX = this.cinematicStartCameraX; this.cameraX = this.cinematicStartCameraX; this.cameraOverrideActive = true; }
    freezePlayerForCinematic() { const player = this.player || window.player; if (!player) return; const captured = this.cinematicStartPlayerPosition || { x: player.position.x, y: player.position.y }; this.frozenPlayerPosition = { x: captured.x, y: captured.y }; if (player.velocity) { player.velocity.x = 0; player.velocity.y = 0; } player.controlsDisabled = true; }
    advanceTimed(delta, duration, next, callback) { this.phaseElapsed += delta; if (this.phaseElapsed >= duration) { this.state = next; this.phaseElapsed = 0; if (callback) callback(); } }
    purgeEnemies() { if (window.enemyManager?.purgeForCinematic) window.enemyManager.purgeForCinematic(); else if (window.enemyManager) window.enemyManager.enemies = []; }
    transitionToPan() { this.state = STATES.CAMERA_PAN; this.phaseElapsed = 0; if (!Number.isFinite(this.panStartX)) this.captureCinematicStart(); this.panTargetX = clampCamera(CINEMATIC.bossFrameX); this.cameraX = this.panStartX; this.cinematicZoomOverride = this.cinematicStartZoom; this.cameraOverrideActive = true; }
    updatePan(delta) { this.phaseElapsed += delta; const t = Math.min(1, this.phaseElapsed / CINEMATIC.panMs); const eased = smoothStep(t); this.cameraX = clampCamera(lerp(this.panStartX, this.panTargetX, eased)); const desiredZoom = lerp(this.cinematicStartZoom, this.cinematicWideZoom, eased); this.cinematicZoomOverride = Math.max(desiredZoom, getForegroundCoverageZoomFloor(this.cameraX)); if (t >= 1) { this.cameraX = this.panTargetX; this.cinematicZoomOverride = Math.max(this.cinematicWideZoom, getForegroundCoverageZoomFloor(this.cameraX)); this.startBossWalk(); } }
    startBossWalk() { this.state = STATES.BOSS_WALK_IN; this.phaseElapsed = 0; this.boss = { x: this.cameraX + CANVAS_WIDTH / 2 + 180, y: CINEMATIC.bossGroundY, state: 'walk', active: true, sprite: this.preloadedBossSprite || null, spriteReady: false, fallbackLocked: !this.preloadedBossSprite, activeAnimation: null, playedAnimation: null, animationRef: null, flourishPlayed: false, canDealDamage: false, canReceiveDamage: false }; this.setBossAnimation('sector_1_boss_walk_walk', true); }
    prepareBossAssets() { if (this.bossAssetsRequested) return; this.bossAssetsRequested = true; this.requestSpriteOnce('boss', 'sector_1_boss_sector1boss', sprite => { this.preloadedBossSprite = sprite; this.preparedBossAnimations = ['sector_1_boss_walk_walk', 'sector_1_boss_attack_attack', 'sector_1_boss_idle_idle']; }); }
    prepareBossSprite() { if (!this.boss) return; if (!this.boss.sprite && this.preloadedBossSprite && !this.boss.fallbackLocked) this.boss.sprite = this.preloadedBossSprite; if (this.boss.sprite?.isLoaded?.()) { this.boss.spriteReady = true; if (this.boss.activeAnimation && this.boss.playedAnimation !== this.boss.activeAnimation && this.boss.sprite.play) { this.boss.animationRef = this.boss.sprite.play(this.boss.activeAnimation, this.boss.activeAnimation !== 'sector_1_boss_attack_attack') || null; this.boss.playedAnimation = this.boss.activeAnimation; } } }
    setBossAnimation(animation, loop) { this.prepareBossSprite(); if (!this.boss || this.boss.activeAnimation === animation) return this.boss?.animationRef || null; this.boss.activeAnimation = animation; this.boss.animationRef = null; if (this.boss.spriteReady && this.boss.sprite?.play) { this.boss.animationRef = this.boss.sprite.play(animation, loop) || null; this.boss.playedAnimation = animation; } return this.boss.animationRef; }
    updateBossSprite(delta) { this.prepareBossSprite(); if (this.boss?.spriteReady && this.boss.sprite?.update) this.boss.sprite.update(delta); }
    updateBossWalk(delta) { this.setBossAnimation('sector_1_boss_walk_walk', true); this.boss.x -= CINEMATIC.bossSpeed * (delta / 1000); this.updateBossSprite(delta); if (this.boss.x <= CINEMATIC.bossStopX) { this.boss.x = CINEMATIC.bossStopX; this.startBossCloseUp(); if (window.gameState) window.gameState.collectionMessage = { text: 'SIGNAL RESTORED. BOSS APPROACHING.', timer: 160 }; } }
    startBossCloseUp() { this.state = STATES.BOSS_CLOSE_UP; this.phaseElapsed = 0; this.closeUpStartZoom = this.cinematicZoomOverride; this.boss.state = 'idle'; this.setBossAnimation('sector_1_boss_idle_idle', true); }
    updateBossCloseUp(delta) { this.phaseElapsed += delta; const t = Math.min(1, this.phaseElapsed / CINEMATIC.closeUpMs); this.cinematicZoomOverride = lerp(this.closeUpStartZoom, this.cinematicCloseZoom, easeOutCubic(t)); this.updateBossSprite(delta); if (t >= 1) { this.cinematicZoomOverride = this.cinematicCloseZoom; this.startBossFlourish(); } }
    startBossFlourish() { this.state = STATES.BOSS_FLOURISH; this.phaseElapsed = 0; this.boss.state = 'flourish'; this.boss.flourishPlayed = true; this.setBossAnimation('sector_1_boss_attack_attack', false); }
    updateBossFlourish(delta) { this.updateBossSprite(delta); this.advanceTimed(delta, CINEMATIC.flourishMs, STATES.BOSS_HOLD, () => { this.boss.state = 'flourish'; }); }
    updateBossHold(delta) { this.updateBossSprite(delta); this.advanceTimed(delta, CINEMATIC.holdMs, STATES.CAMERA_RETURN, () => this.startCameraReturn()); }
    getBossArenaTargetX() { const zoom = Math.max(0.1, this.cinematicStartZoom || 1); return clampWorldX(this.cinematicStartCameraX + (CINEMATIC.bossArenaScreenX - CANVAS_WIDTH / 2) / zoom); }
    startCameraReturn() { this.state = STATES.CAMERA_RETURN; this.phaseElapsed = 0; this.returnStartCameraX = this.cameraX; this.returnStartZoom = this.cinematicZoomOverride; this.returnStartBossX = this.boss.x; this.returnBossTargetX = this.getBossArenaTargetX(); this.boss.state = 'walk'; this.setBossAnimation('sector_1_boss_walk_walk', true); }
    updateCameraReturn(delta) { this.phaseElapsed += delta; const t = Math.min(1, this.phaseElapsed / CINEMATIC.returnMs); const eased = smoothStep(t); this.cameraX = clampCamera(lerp(this.returnStartCameraX, this.cinematicStartCameraX, eased)); const desiredZoom = lerp(this.returnStartZoom, this.cinematicStartZoom, eased); this.cinematicZoomOverride = t < 1 ? Math.max(desiredZoom, getForegroundCoverageZoomFloor(this.cameraX)) : this.cinematicStartZoom; this.boss.x = lerp(this.returnStartBossX, this.returnBossTargetX, eased); this.updateBossSprite(delta); if (t >= 1) { this.cameraX = this.cinematicStartCameraX; this.cinematicZoomOverride = this.cinematicStartZoom; this.boss.x = this.returnBossTargetX; this.enterBossReady(); } }
    enterBossReady() { this.state = STATES.BOSS_READY; this.boss.state = 'idle'; this.boss.canDealDamage = false; this.boss.canReceiveDamage = false; this.setBossAnimation('sector_1_boss_idle_idle', true); this.bossReadyEmitted = true; this.cameraOverrideActive = false; this.frozenPlayerPosition = null; this.cinematicZoomReleasePending = true; if (this.player) { this.player.controlsDisabled = false; if (this.player.velocity) { this.player.velocity.x = 0; this.player.velocity.y = 0; } } /* Boss combat is intentionally not enabled until a later authoritative PlayerCombat/EnemyManager pass. */ if (window.objectivesSystem?.setBossIntroObjective) window.objectivesSystem.setBossIntroObjective(); }
    draw(ctx) { this.drawStageSurfaces(ctx); this.drawEncounterGates(ctx); this.drawBoss(ctx); }
    drawStageSurfaces(ctx) { if (!ctx) return; ctx.save(); STAGE_SURFACES.forEach(g => { ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 8; ctx.fillStyle = 'rgba(0,255,255,0.34)'; ctx.fillRect(g.x, g.y - 2, g.w, g.h); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(0,255,255,0.92)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + g.w, g.y); ctx.stroke(); }); ctx.restore(); }
    drawEncounterGates(ctx) { if (!ctx) return; const gate = this.getCurrentGate(); if (!gate) return; ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = 'rgba(255,0,255,0.55)'; ctx.fillRect(gate.x, gate.y, gate.w, gate.h); ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 3; ctx.strokeRect(gate.x, gate.y, gate.w, gate.h); ctx.restore(); }
    getBossPresentationKey() { if (this.boss?.state === 'idle' || this.boss?.activeAnimation === 'sector_1_boss_idle_idle') return 'idle'; if (this.boss?.state === 'flourish' || this.boss?.activeAnimation === 'sector_1_boss_attack_attack') return 'flourish'; return 'walk'; }
    getBossVisualBounds() { if (!this.boss) return null; const frame = BOSS_PRESENTATION[this.getBossPresentationKey()]; const scale = BOSS_PRESENTATION.targetAnchorHeight / frame.anchorY; const rawFrame = Number.isFinite(this.boss.animationRef?.currentFrame) ? this.boss.animationRef.currentFrame : 0; const frameIndex = Math.max(0, Math.trunc(rawFrame)) % frame.footRows.length; const footRow = frame.footRows[frameIndex] ?? frame.anchorY; const targetFootY = this.boss.y + PLAYER_VISUAL_FOOT_OFFSET; const anchorY = targetFootY + (frame.anchorY - footRow) * scale; return { x: this.boss.x - frame.anchorX * scale, y: anchorY - frame.anchorY * scale, width: frame.width * scale, height: frame.height * scale, scale, anchorX: this.boss.x, anchorY, frameIndex, footRow, targetFootY, visibleFootY: anchorY + (footRow - frame.anchorY) * scale }; }
    drawBoss(ctx) { if (!ctx || !this.boss?.active) return; const visual = this.getBossVisualBounds(); ctx.save(); if (this.boss.spriteReady && this.boss.sprite?.draw) this.boss.sprite.draw(ctx, visual.anchorX, visual.anchorY, { scale: visual.scale, flipH: true }); else { ctx.fillStyle = '#ff3300'; ctx.fillRect(visual.x, visual.y, visual.width, visual.height); ctx.fillStyle = '#fff'; ctx.fillText('SECTOR 1 BOSS', visual.x, visual.y - 20); } ctx.restore(); }
    isGateClosed(encounterId) { return this.closedGateEncounterId === encounterId; }
    openEncounterGate(encounterId) { if (this.closedGateEncounterId === encounterId) this.closedGateEncounterId = null; }
    getCurrentGate() { return ENCOUNTER_GATES.find(g => g.encounterId === this.closedGateEncounterId) || null; }
    applyGateCollision() { const gate = this.getCurrentGate(); const player = this.player || window.player; if (!gate || !player) return; const half = player.width ? player.width / 2 : 40; if (player.position.x + half > gate.x && player.position.x < gate.x + gate.w) { player.position.x = gate.x - half; if (player.velocity) player.velocity.x = Math.min(0, player.velocity.x || 0); } }
    applyPlayerStageCollision(player, movement = {}) { if (!player || !player.velocity || player.velocity.y < 0) return false; const previousAnchorY = Number.isFinite(movement.previousFootY) ? movement.previousFootY : player.position.y; const currentAnchorY = Number.isFinite(movement.currentFootY) ? movement.currentFootY : player.position.y; const previousVisualFootY = previousAnchorY + PLAYER_VISUAL_FOOT_OFFSET; const currentVisualFootY = currentAnchorY + PLAYER_VISUAL_FOOT_OFFSET; const previousX = Number.isFinite(movement.previousX) ? movement.previousX : player.position.x; const footHalfWidth = 18; const verticalTravel = currentVisualFootY - previousVisualFootY; let landing = null; for (const surface of STAGE_SURFACES) { if (previousVisualFootY > surface.y || currentVisualFootY < surface.y) continue; const crossingT = verticalTravel > 0 ? Math.max(0, Math.min(1, (surface.y - previousVisualFootY) / verticalTravel)) : 1; const crossingX = previousX + (player.position.x - previousX) * crossingT; const overlapsX = crossingX + footHalfWidth > surface.x && crossingX - footHalfWidth < surface.x + surface.w; if (overlapsX && (!landing || crossingT < landing.crossingT)) landing = { surface, crossingT }; } if (!landing) return false; player.position.y = landing.surface.y - PLAYER_VISUAL_FOOT_OFFSET; player.velocity.y = 0; player.grounded = true; return true; }
    getPriorEncounterKills(number) { return [0, 0, 4, 9, 14][Math.max(1, Math.min(4, Number(number) || 1))] || 0; }
    debugPrepareMission() { if (!debugAllowed()) return debugDisabled(); this.reset(); if (window.enemyManager?.clear) window.enemyManager.clear(); if (window.objectivesSystem?.reset) window.objectivesSystem.reset(); if (window.tutorialSystem) { window.tutorialSystem.completed = true; window.tutorialSystem.active = false; } if (this.player) { this.player.controlsDisabled = false; if (this.player.velocity) { this.player.velocity.x = 0; this.player.velocity.y = 0; } } this.startMission(); return this.getDiagnostics(); }
    debugSkipTutorial() { return this.debugPrepareMission(); }
    debugClearEnemies() { if (!debugAllowed()) return debugDisabled(); if (window.enemyManager) { window.enemyManager.enemies.forEach(enemy => { if (enemy && (enemy._sector1MissionEnemy || enemy._jammerReinforcement)) { enemy.active = false; enemy._disposed = true; } }); window.enemyManager.enemies = window.enemyManager.enemies.filter(enemy => enemy && enemy.active); } this.activeEncounterEnemies = []; this.pendingSpawns = []; return this.getDiagnostics(); }
    debugCompleteEncounter() { if (!debugAllowed()) return debugDisabled(); const index = ENCOUNTERS.findIndex(encounter => encounter.id === this.state); if (index < 0) return { ok: false, reason: 'no-active-encounter', diagnostics: this.getDiagnostics() }; const completedTotal = ENCOUNTERS.slice(0, index + 1).reduce((sum, encounter) => sum + encounter.enemies.length, 0); this.debugClearEnemies(); this.debugSetMissionKills(completedTotal); this.openEncounterGate(this.state); this.activeEncounterId = null; this.closedGateEncounterId = null; if (completedTotal >= this.requiredEnemyKills) this.revealJammer(); else { this.state = ENCOUNTERS[index + 1].id; this.prepareAssetsForEncounter(index + 1); } return this.getDiagnostics(); }
    debugSetMissionKills(value) { if (!debugAllowed()) return debugDisabled(); this.missionStarted = true; this.missionDefeats = Math.max(0, Math.min(this.requiredEnemyKills, Number(value) || 0)); if (window.enemyManager) window.enemyManager.defeatedCount = this.missionDefeats; if (typeof window.syncEnemyDefeatProjections === 'function') window.syncEnemyDefeatProjections(this.missionDefeats); else if (window.gameState) window.gameState.enemiesDefeated = this.missionDefeats; if (window.objectivesSystem?.updateMissionDefeatProgress) window.objectivesSystem.updateMissionDefeatProgress(this.missionDefeats, this.requiredEnemyKills); return this.getDiagnostics(); }
    debugGotoEncounter(number) { if (!debugAllowed()) return debugDisabled(); const index = Math.max(1, Math.min(4, Number(number) || 1)); this.debugPrepareMission(); this.debugClearEnemies(); this.spawnedEncounterIds = new Set(ENCOUNTERS.slice(0, index - 1).map(encounter => encounter.id)); this.debugSetMissionKills(this.getPriorEncounterKills(index)); this.state = ENCOUNTERS[index - 1].id; this.activeEncounterId = null; this.closedGateEncounterId = null; if (this.player) { this.player.position.x = ENCOUNTERS[index - 1].triggerX + 10; this.player.position.y = GROUND_Y; this.player.velocity.x = 0; this.player.velocity.y = 0; } return this.getDiagnostics(); }
    debugGotoJammer() { if (!debugAllowed()) return debugDisabled(); this.debugPrepareMission(); this.debugClearEnemies(); this.spawnedEncounterIds = new Set(ENCOUNTERS.map(encounter => encounter.id)); this.debugSetMissionKills(this.requiredEnemyKills); this.revealJammer(); return this.getDiagnostics(); }
    debugDamageJammer(amount = 1) { if (!debugAllowed()) return debugDisabled(); if (!this.jammerRevealed) this.debugGotoJammer(); const environment = window.BARCODE?.JammerEnvironment; const status = environment?.getStatus?.(); const hits = Math.min(Math.max(1, Number(amount) || 1), Math.max(0, status?.health || 0)); let result = { ok: false, reason: 'jammer-unavailable' }; for (let i = 0; i < hits; i++) { this.debugDamageSequence += 1; result = environment.applyRhythmDamage({ timing: 'perfect', sequence: `level1-debug-${this.debugDamageSequence}` }); } return result; }
    debugDestroyJammer() { if (!debugAllowed()) return debugDisabled(); if (!this.jammerRevealed) this.debugGotoJammer(); const remaining = window.BARCODE?.JammerEnvironment?.getStatus?.().health || 0; if (remaining > 0) this.debugDamageJammer(remaining); return this.getDiagnostics(); }
    debugResetMission() { if (!debugAllowed()) return debugDisabled(); this.debugPrepareMission(); if (this.player) { this.player.position.x = 200; this.player.position.y = GROUND_Y; this.player.velocity.x = 0; this.player.velocity.y = 0; if (Number.isFinite(this.player.maxHealth)) this.player.health = this.player.maxHealth; } return this.getDiagnostics(); }
    prepareAssetsForEncounter(index) { const def = ENCOUNTERS[index]; if (!def) return; this.assetDiagnostics = this.assetDiagnostics || []; const types = [...new Set(def.enemies.map(e => e.type))]; types.forEach(type => this.requestSpriteOnce(`enemy:${type}`, type === 'firewall' ? 'firewall_firewall' : type === 'corrupted' ? 'corrupted_corrupted' : 'virus_virus')); if (index >= ENCOUNTERS.length - 1) this.prepareJammerAsset(); }
    prepareJammerAsset() { this.requestSpriteOnce('jammer', 'broadcast_jammer_broadcastjammer'); }
    requestSpriteOnce(key, spriteId, onReady) { this.preparedAssets = this.preparedAssets || {}; if (this.preparedAssets[key]) return this.preparedAssets[key].sprite || this.preparedAssets[key]; try { if (!window.MakkoEngine || typeof window.MakkoEngine.sprite !== 'function') { this.recordAssetDiagnostic(key, 'MakkoEngine unavailable'); return null; } const sprite = window.MakkoEngine.sprite(spriteId); const entry = { key, spriteId, sprite, onReady, generation: this.assetGeneration, ready: false, diagnosticRecorded: false }; this.preparedAssets[key] = entry; this.pollPreparedAsset(entry); return sprite; } catch (error) { this.recordAssetDiagnostic(key, error); return null; } }
    pollPreparedAssets() { if (!this.preparedAssets) return; Object.values(this.preparedAssets).forEach(entry => { if (entry && entry.sprite) this.pollPreparedAsset(entry); }); }
    pollPreparedAsset(entry) { if (!entry || entry.ready || entry.generation !== this.assetGeneration) return; try { if (!entry.sprite.isLoaded || entry.sprite.isLoaded()) { entry.ready = true; if (entry.onReady) entry.onReady(entry.sprite); } } catch (error) { if (!entry.diagnosticRecorded) { entry.diagnosticRecorded = true; this.recordAssetDiagnostic(entry.key, error); } } }
    recordAssetDiagnostic(key, error) { this.assetDiagnostics = this.assetDiagnostics || []; if (!this.assetDiagnostics.some(entry => entry.key === key)) this.assetDiagnostics.push({ key, message: String(error && error.message || error) }); }
    reset(options = {}) {
      this.missionStarted = false; this.missionDefeats = 0; this.enemiesDefeated = 0; this.jammerRevealed = false; this.jammerDestroyedNotified = false;
      this.cinematicStartedCount = 0; this.phaseElapsed = 0; this.cameraOverrideActive = false; this.cameraX = null;
      this.cinematicStartCameraX = null; this.cinematicStartPlayerPosition = null; this.cinematicStartZoom = null; this.cinematicWideZoom = null; this.cinematicCloseZoom = null;
      this.cinematicZoomOverride = null; this.cinematicZoomReleasePending = false; this.closeUpStartZoom = null; this.frozenPlayerPosition = null;
      this.panStartX = null; this.panTargetX = null; this.returnStartCameraX = null; this.returnStartZoom = null; this.returnStartBossX = null; this.returnBossTargetX = null;
      this.boss = null; this.bossReadyEmitted = false; this.assetGeneration = (this.assetGeneration || 0) + 1; this.preparedAssets = {}; this.preloadedBossSprite = null; this.bossAssetsRequested = false;
      this.countedEnemies = new Set(); this.spawnedEncounterIds = new Set(); this.activeEncounterId = null; this.activeEncounterEnemies = []; this.closedGateEncounterId = null; this.pendingSpawns = [];
      this.nextJammerSpawnMs = Infinity; this.jammerReinforcementCount = 0; this.debugDamageSequence = 0; this.lastSpawnPlan = null;
      this.state = options && options.preserveTutorial ? STATES.TUTORIAL : STATES.TUTORIAL;
      if (window.renderer && typeof window.renderer.clearCinematicZoomOverride === 'function') window.renderer.clearCinematicZoomOverride();
      if (window.BARCODE?.JammerEnvironment?.reset) window.BARCODE.JammerEnvironment.reset();
      if (this.player) this.player.controlsDisabled = false;
    }
    getDiagnostics() { const activeReinforcements = (window.enemyManager?.enemies || []).filter(enemy => enemy && enemy.active && enemy._jammerReinforcement).length; return { state: this.state, missionDefeats: this.missionDefeats, requiredEnemyKills: this.requiredEnemyKills, encounters: ENCOUNTERS, stageSurfaces: STAGE_SURFACES, pendingSpawns: this.pendingSpawns.length, lastSpawnPlan: this.lastSpawnPlan, activeReinforcements, jammerRevealed: this.jammerRevealed, cinematicStartedCount: this.cinematicStartedCount, cameraX: this.cameraX, cinematic: { startCameraX: this.cinematicStartCameraX, startPlayerPosition: this.cinematicStartPlayerPosition, startZoom: this.cinematicStartZoom, zoomOverride: this.getCinematicZoomOverride(), cameraOverrideActive: this.cameraOverrideActive, returnBossTargetX: this.returnBossTargetX }, boss: this.boss && { x: this.boss.x, state: this.boss.state, flourishPlayed: this.boss.flourishPlayed, visual: this.getBossVisualBounds(), canDealDamage: false, canReceiveDamage: false, combatPending: true }, bossReadyEmitted: this.bossReadyEmitted, assetDiagnostics: this.assetDiagnostics || [] }; }
  };
  window.initSector1Progression = function(player) { if (!window.sector1Progression) window.sector1Progression = new window.Sector1Progression(player); else window.sector1Progression.player = player || window.sector1Progression.player; return window.sector1Progression; };
})();
