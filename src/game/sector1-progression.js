// Sector 1 authored Level 1 mission progression owner.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/sector1-progression.js', exports: ['Sector1Progression', 'sector1Progression', 'initSector1Progression'], dependencies: ['player', 'enemyManager', 'BARCODE.JammerEnvironment'] });

(function() {
  const WORLD_WIDTH = 4096;
  const CANVAS_WIDTH = 1920;
  const GROUND_Y = 750;
  const CAMERA_MIN = CANVAS_WIDTH / 2;
  const CAMERA_MAX = WORLD_WIDTH - CANVAS_WIDTH / 2;

  const STATES = Object.freeze({
    TUTORIAL: 'tutorial', ENCOUNTER_1: 'encounter_1', ENCOUNTER_2: 'encounter_2', ENCOUNTER_3: 'encounter_3', ENCOUNTER_4: 'encounter_4',
    JAMMER_ACTIVE: 'jammer_active', FREEZE: 'jammer_destroyed_freeze', ENEMY_PURGE: 'enemy_purge', CAMERA_PAN: 'camera_pan',
    BOSS_WALK_IN: 'boss_walk_in', BOSS_FLOURISH: 'boss_flourish', BOSS_READY: 'boss_ready'
  });

  const ENCOUNTERS = Object.freeze([
    { id: 'encounter_1', triggerX: 520, label: 'Signal Alley', enemies: [{ type: 'virus', x: 760, y: 650 }, { type: 'virus', x: 920, y: 650 }, { type: 'corrupted', x: 1080, y: 650 }, { type: 'virus', x: 1230, y: 650 }] },
    { id: 'encounter_2', triggerX: 1280, label: 'Cache Overpass', enemies: [{ type: 'virus', x: 1440, y: 650 }, { type: 'corrupted', x: 1590, y: 650 }, { type: 'virus', x: 1740, y: 650 }, { type: 'corrupted', x: 1880, y: 650 }, { type: 'virus', x: 2020, y: 650 }] },
    { id: 'encounter_3', triggerX: 2140, label: 'Firewall Plaza', enemies: [{ type: 'corrupted', x: 2300, y: 650 }, { type: 'virus', x: 2440, y: 650 }, { type: 'firewall', x: 2600, y: 650 }, { type: 'virus', x: 2760, y: 650 }, { type: 'corrupted', x: 2900, y: 650 }] },
    { id: 'encounter_4', triggerX: 3050, label: 'Broadcast Gate', enemies: [{ type: 'virus', x: 3180, y: 650 }, { type: 'corrupted', x: 3320, y: 650 }, { type: 'virus', x: 3460, y: 650 }, { type: 'firewall', x: 3600, y: 650 }, { type: 'corrupted', x: 3740, y: 650 }, { type: 'virus', x: 3880, y: 650 }] }
  ]);

  const STAGE_SURFACES = Object.freeze([
    { id: 'signal-awning', x: 650, y: 650, w: 430, h: 26 },
    { id: 'cache-bridge', x: 1390, y: 625, w: 520, h: 26 },
    { id: 'firewall-deck', x: 2230, y: 650, w: 620, h: 26 },
    { id: 'broadcast-ramp', x: 3150, y: 625, w: 620, h: 26 }
  ]);

  const ENCOUNTER_GATES = Object.freeze([
    { id: 'gate_1', encounterId: 'encounter_1', x: 1320, y: 620, w: 34, h: 270 },
    { id: 'gate_2', encounterId: 'encounter_2', x: 2110, y: 620, w: 34, h: 270 },
    { id: 'gate_3', encounterId: 'encounter_3', x: 3000, y: 620, w: 34, h: 270 },
    { id: 'gate_4', encounterId: 'encounter_4', x: 4010, y: 620, w: 34, h: 270 }
  ]);

  const CINEMATIC = Object.freeze({ freezeMs: 800, panMs: 2000, flourishMs: 900, bossFrameX: 3136, bossStopX: 3650, bossGroundY: 750, bossSpeed: 140 });

  function totalQuota() { return ENCOUNTERS.reduce((sum, e) => sum + e.enemies.length, 0); }
  function clampCamera(x) { return window.clamp ? window.clamp(x, CAMERA_MIN, CAMERA_MAX) : Math.max(CAMERA_MIN, Math.min(CAMERA_MAX, x)); }

  window.Sector1Progression = class Sector1Progression {
    constructor(player) { this.player = player || null; this.requiredEnemyKills = totalQuota(); this.reset(); this.state = STATES.TUTORIAL; }
    static get ENCOUNTERS() { return ENCOUNTERS; }
    static get GEOMETRY() { return STAGE_SURFACES; }
    static get STAGE_SURFACES() { return STAGE_SURFACES; }
    static get ENCOUNTER_GATES() { return ENCOUNTER_GATES; }
    static get CINEMATIC() { return CINEMATIC; }
    static get STATES() { return STATES; }
    isAuthoritativeMissionActive() { return this.state !== STATES.TUTORIAL && this.state !== STATES.BOSS_READY; }
    shouldSuppressGenericSpawning() { return true; }
    isGameplaySuppressed() { return [STATES.FREEZE, STATES.ENEMY_PURGE, STATES.CAMERA_PAN, STATES.BOSS_WALK_IN, STATES.BOSS_FLOURISH, STATES.BOSS_READY].includes(this.state); }
    getCameraX(fallback) { return this.cameraOverrideActive ? clampCamera(this.cameraX) : fallback; }
    update(deltaTime = 0) {
      if (window.gameState && window.gameState.paused) return;
      this.player = this.player || window.player;
      const tutorialDone = !!(window.tutorialSystem && typeof window.tutorialSystem.isCompleted === 'function' && window.tutorialSystem.isCompleted());
      if (this.state === STATES.TUTORIAL && tutorialDone && !this.missionStarted) this.startMission();
      if (this.isGameplaySuppressed() && this.player) { this.player.controlsDisabled = true; this.player.velocity.x = 0; }
      if (/^encounter_/.test(this.state)) { this.applyGateCollision(); this.updateEncounter(); }
      else if (this.state === STATES.FREEZE) this.advanceTimed(deltaTime, CINEMATIC.freezeMs, STATES.ENEMY_PURGE, () => this.purgeEnemies());
      else if (this.state === STATES.ENEMY_PURGE) this.transitionToPan();
      else if (this.state === STATES.CAMERA_PAN) this.updatePan(deltaTime);
      else if (this.state === STATES.BOSS_WALK_IN) this.updateBossWalk(deltaTime);
      else if (this.state === STATES.BOSS_FLOURISH) { this.updateBossSprite(deltaTime); this.advanceTimed(deltaTime, CINEMATIC.flourishMs, STATES.BOSS_READY, () => this.enterBossReady()); }
      else if (this.state === STATES.BOSS_READY) this.updateBossSprite(deltaTime);
    }
    startMission() { this.state = STATES.ENCOUNTER_1; this.missionStarted = true; this.missionDefeats = 0; this.countedEnemies.clear(); this.spawnedEncounterIds.clear(); this.activeEncounterId = null; this.enemyManagerReset(); if (window.objectivesSystem?.setMissionDefeatObjective) window.objectivesSystem.setMissionDefeatObjective(0, this.requiredEnemyKills); }
    enemyManagerReset() { if (window.cancelInitialEnemySpawn) window.cancelInitialEnemySpawn(); if (window.enemyManager) window.enemyManager.clear(); if (window.gameState) { window.gameState.enemiesDefeated = 0; window.gameState.hasSpawnedInitialEnemies = true; } this.prepareAssetsForEncounter(0); }
    updateEncounter() { const index = ENCOUNTERS.findIndex(e => e.id === this.state); const def = ENCOUNTERS[index]; if (!def) return; const px = this.player?.position?.x || 0; if (!this.spawnedEncounterIds.has(def.id) && px >= def.triggerX) this.spawnEncounter(def); if (this.activeEncounterId === def.id && this.activeEncounterEnemies.every(e => !e.active || e._defeatRecorded)) { this.openEncounterGate(def.id); if (index < ENCOUNTERS.length - 1) { this.state = ENCOUNTERS[index + 1].id; this.activeEncounterId = null; this.activeEncounterEnemies = []; this.closedGateEncounterId = null; this.prepareAssetsForEncounter(index + 1); } } }
    spawnEncounter(def) { this.spawnedEncounterIds.add(def.id); this.activeEncounterId = def.id; this.closedGateEncounterId = def.id; this.activeEncounterEnemies = def.enemies.map((spec, i) => this.spawnMissionEnemy(spec, def.id, i)); }
    spawnMissionEnemy(spec, encounterId, index) { const enemy = new window.Enemy(spec.x, spec.y, spec.type); enemy._sector1MissionEnemy = true; enemy._sector1EncounterId = encounterId; enemy._sector1Index = index; enemy.entranceComplete = true; enemy.state = 'patrol'; enemy.isOnGround = true; if (window.enemyManager) window.enemyManager.enemies.push(enemy); return enemy; }
    onEnemyDefeated(authoritativeTotal, enemy) { if (!this.missionStarted || !enemy || !enemy._sector1MissionEnemy || this.countedEnemies.has(enemy)) return; this.countedEnemies.add(enemy); this.missionDefeats = Math.min(this.requiredEnemyKills, this.missionDefeats + 1); if (window.gameState) window.gameState.enemiesDefeated = this.missionDefeats; if (window.objectivesSystem?.updateMissionDefeatProgress) window.objectivesSystem.updateMissionDefeatProgress(this.missionDefeats, this.requiredEnemyKills); if (this.missionDefeats === this.requiredEnemyKills && !this.jammerRevealed) this.revealJammer(); }
    chooseJammerPosition() { const px = this.player?.position?.x || 960; const x = px < WORLD_WIDTH / 2 ? 3520 : 620; return { x, y: GROUND_Y }; }
    revealJammer() { this.state = STATES.JAMMER_ACTIVE; this.jammerRevealed = true; this.closedGateEncounterId = null; const position = this.chooseJammerPosition(); window.BARCODE?.JammerEnvironment?.reveal({ position }); if (window.objectivesSystem?.revealJammerObjective) window.objectivesSystem.revealJammerObjective(); this.prepareBossAssets(); }
    onJammerDestroyed() { if (this.jammerDestroyedNotified) return; this.jammerDestroyedNotified = true; if (window.objectivesSystem?.completeJammerObjective) window.objectivesSystem.completeJammerObjective(); this.state = STATES.FREEZE; this.phaseElapsed = 0; this.cinematicStartedCount++; }
    advanceTimed(delta, duration, next, callback) { this.phaseElapsed += delta; if (this.phaseElapsed >= duration) { this.state = next; this.phaseElapsed = 0; if (callback) callback(); } }
    purgeEnemies() { if (window.enemyManager?.purgeForCinematic) window.enemyManager.purgeForCinematic(); else if (window.enemyManager) window.enemyManager.enemies = []; }
    transitionToPan() { this.state = STATES.CAMERA_PAN; this.phaseElapsed = 0; const playerX = this.player?.position?.x || CAMERA_MIN; this.panStartX = clampCamera((window.gameCamera && Number.isFinite(window.gameCamera.centerX)) ? window.gameCamera.centerX : playerX); this.panTargetX = clampCamera(CINEMATIC.bossFrameX); this.cameraX = this.panStartX; this.cameraOverrideActive = true; }
    updatePan(delta) { this.phaseElapsed += delta; const t = Math.min(1, this.phaseElapsed / CINEMATIC.panMs); const eased = t * t * (3 - 2 * t); this.cameraX = clampCamera(this.panStartX + (this.panTargetX - this.panStartX) * eased); if (t >= 1) this.startBossWalk(); }
    startBossWalk() { this.state = STATES.BOSS_WALK_IN; this.boss = { x: this.cameraX + CANVAS_WIDTH / 2 + 180, y: CINEMATIC.bossGroundY, state: 'walk', active: true, sprite: this.preloadedBossSprite || null, spriteReady: false, fallbackLocked: !this.preloadedBossSprite, activeAnimation: null, playedAnimation: null, flourishPlayed: false, canDealDamage: false, canReceiveDamage: false }; this.setBossAnimation('sector_1_boss_walk_walk', true); }
    prepareBossAssets() { if (this.bossAssetsRequested) return; this.bossAssetsRequested = true; this.requestSpriteOnce('boss', 'sector_1_boss_sector1boss', sprite => { this.preloadedBossSprite = sprite; this.preparedBossAnimations = ['sector_1_boss_walk_walk', 'sector_1_boss_attack_attack', 'sector_1_boss_idle_idle']; }); }
    prepareBossSprite() { if (!this.boss) return; if (!this.boss.sprite && this.preloadedBossSprite && !this.boss.fallbackLocked) this.boss.sprite = this.preloadedBossSprite; if (this.boss.sprite?.isLoaded?.()) { this.boss.spriteReady = true; if (this.boss.activeAnimation && this.boss.playedAnimation !== this.boss.activeAnimation && this.boss.sprite.play) { this.boss.sprite.play(this.boss.activeAnimation, this.boss.activeAnimation !== 'sector_1_boss_attack_attack'); this.boss.playedAnimation = this.boss.activeAnimation; } } }
    setBossAnimation(animation, loop) { this.prepareBossSprite(); if (!this.boss || this.boss.activeAnimation === animation) return; this.boss.activeAnimation = animation; if (this.boss.spriteReady && this.boss.sprite?.play) { this.boss.sprite.play(animation, loop); this.boss.playedAnimation = animation; } }
    updateBossSprite(delta) { this.prepareBossSprite(); if (this.boss?.spriteReady && this.boss.sprite?.update) this.boss.sprite.update(delta); }
    updateBossWalk(delta) { this.setBossAnimation('sector_1_boss_walk_walk', true); this.boss.x -= CINEMATIC.bossSpeed * (delta / 1000); this.updateBossSprite(delta); if (this.boss.x <= CINEMATIC.bossStopX) { this.boss.x = CINEMATIC.bossStopX; this.state = STATES.BOSS_FLOURISH; this.phaseElapsed = 0; this.boss.state = 'flourish'; this.boss.flourishPlayed = true; this.setBossAnimation('sector_1_boss_attack_attack', false); if (window.gameState) window.gameState.collectionMessage = { text: 'SIGNAL RESTORED. BOSS APPROACHING.', timer: 160 }; } }
    enterBossReady() { this.boss.state = 'idle'; this.setBossAnimation('sector_1_boss_idle_idle', true); this.bossReadyEmitted = true; if (window.objectivesSystem?.setBossIntroObjective) window.objectivesSystem.setBossIntroObjective(); }
    draw(ctx) { this.drawStageSurfaces(ctx); this.drawEncounterGates(ctx); this.drawBoss(ctx); }
    drawStageSurfaces(ctx) { if (!ctx) return; ctx.save(); STAGE_SURFACES.forEach(g => { const grad = ctx.createLinearGradient(g.x, g.y, g.x, g.y + g.h); grad.addColorStop(0, 'rgba(0,255,255,0.55)'); grad.addColorStop(1, 'rgba(18,20,60,0.95)'); ctx.fillStyle = grad; ctx.fillRect(g.x, g.y, g.w, g.h); ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.strokeRect(g.x, g.y, g.w, g.h); }); ctx.restore(); }
    drawEncounterGates(ctx) { if (!ctx) return; ctx.save(); ENCOUNTER_GATES.forEach(g => { const closed = this.isGateClosed(g.encounterId); ctx.globalAlpha = closed ? 0.9 : 0.25; ctx.fillStyle = closed ? 'rgba(255,0,255,0.55)' : 'rgba(0,255,255,0.18)'; ctx.fillRect(g.x, g.y, g.w, g.h); ctx.strokeStyle = closed ? '#ff00ff' : '#00ffff'; ctx.lineWidth = 3; ctx.strokeRect(g.x, g.y, g.w, g.h); }); ctx.restore(); }
    drawBoss(ctx) { if (!ctx || !this.boss?.active) return; ctx.save(); if (this.boss.spriteReady && this.boss.sprite?.draw) this.boss.sprite.draw(ctx, this.boss.x, this.boss.y + 110, { scale: 0.8, flipH: true }); else { ctx.fillStyle = '#ff3300'; ctx.fillRect(this.boss.x - 70, this.boss.y - 150, 140, 150); ctx.fillStyle = '#fff'; ctx.fillText('SECTOR 1 BOSS', this.boss.x - 60, this.boss.y - 170); } ctx.restore(); }
    isGateClosed(encounterId) { return this.closedGateEncounterId === encounterId; }
    openEncounterGate(encounterId) { if (this.closedGateEncounterId === encounterId) this.closedGateEncounterId = null; }
    getCurrentGate() { return ENCOUNTER_GATES.find(g => g.encounterId === this.closedGateEncounterId) || null; }
    applyGateCollision() { const gate = this.getCurrentGate(); const player = this.player || window.player; if (!gate || !player) return; const half = player.width ? player.width / 2 : 40; if (player.position.x + half > gate.x && player.position.x < gate.x + gate.w) { player.position.x = gate.x - half; if (player.velocity) player.velocity.x = Math.min(0, player.velocity.x || 0); } }
    applyPlayerStageCollision(player, movement = {}) { if (!player || !player.velocity || player.velocity.y < 0) return false; const previousFootY = Number.isFinite(movement.previousFootY) ? movement.previousFootY : player.position.y; const currentFootY = Number.isFinite(movement.currentFootY) ? movement.currentFootY : player.position.y; const x = player.position.x; for (const surface of STAGE_SURFACES) { const withinX = x >= surface.x && x <= surface.x + surface.w; if (withinX && previousFootY <= surface.y && currentFootY >= surface.y) { player.position.y = surface.y; player.velocity.y = 0; player.grounded = true; return true; } } return false; }
    prepareAssetsForEncounter(index) { const def = ENCOUNTERS[index]; if (!def) return; this.assetDiagnostics = this.assetDiagnostics || []; const types = [...new Set(def.enemies.map(e => e.type))]; types.forEach(type => this.requestSpriteOnce(`enemy:${type}`, type === 'firewall' ? 'firewall_firewall' : type === 'corrupted' ? 'corrupted_corrupted' : 'virus_virus')); if (index >= ENCOUNTERS.length - 1) this.prepareJammerAsset(); }
    prepareJammerAsset() { this.requestSpriteOnce('jammer', 'broadcast_jammer_broadcastjammer'); }
    requestSpriteOnce(key, spriteId, onReady) { this.preparedAssets = this.preparedAssets || {}; if (this.preparedAssets[key]) return this.preparedAssets[key]; try { if (!window.MakkoEngine || typeof window.MakkoEngine.sprite !== 'function') { this.recordAssetDiagnostic(key, 'MakkoEngine unavailable'); return null; } const sprite = window.MakkoEngine.sprite(spriteId); this.preparedAssets[key] = sprite || true; if (sprite && (!sprite.isLoaded || sprite.isLoaded()) && onReady) onReady(sprite); return sprite; } catch (error) { this.recordAssetDiagnostic(key, error); return null; } }
    recordAssetDiagnostic(key, error) { this.assetDiagnostics = this.assetDiagnostics || []; if (!this.assetDiagnostics.some(entry => entry.key === key)) this.assetDiagnostics.push({ key, message: String(error && error.message || error) }); }
    reset(options = {}) { this.missionStarted = false; this.missionDefeats = 0; this.enemiesDefeated = 0; this.jammerRevealed = false; this.jammerDestroyedNotified = false; this.cinematicStartedCount = 0; this.phaseElapsed = 0; this.cameraOverrideActive = false; this.cameraX = null; this.panStartX = null; this.panTargetX = null; this.boss = null; this.bossReadyEmitted = false; this.countedEnemies = new Set(); this.spawnedEncounterIds = new Set(); this.activeEncounterId = null; this.activeEncounterEnemies = []; this.state = options && options.preserveTutorial ? STATES.TUTORIAL : STATES.TUTORIAL; if (window.BARCODE?.JammerEnvironment?.reset) window.BARCODE.JammerEnvironment.reset(); if (this.player) this.player.controlsDisabled = false; }
    getDiagnostics() { return { state: this.state, missionDefeats: this.missionDefeats, requiredEnemyKills: this.requiredEnemyKills, encounters: ENCOUNTERS, jammerRevealed: this.jammerRevealed, cinematicStartedCount: this.cinematicStartedCount, cameraX: this.cameraX, boss: this.boss && { x: this.boss.x, state: this.boss.state, flourishPlayed: this.boss.flourishPlayed, canDealDamage: false, canReceiveDamage: false }, bossReadyEmitted: this.bossReadyEmitted, assetDiagnostics: this.assetDiagnostics || [] }; }
  };
  window.initSector1Progression = function(player) { if (!window.sector1Progression) window.sector1Progression = new window.Sector1Progression(player); else window.sector1Progression.player = player || window.sector1Progression.player; return window.sector1Progression; };
})();
