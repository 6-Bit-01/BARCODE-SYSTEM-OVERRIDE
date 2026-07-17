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

  const GEOMETRY = Object.freeze([
    { x: 640, y: 820, w: 560, h: 24, label: 'SIGNAL ALLEY' }, { x: 1380, y: 790, w: 620, h: 24, label: 'CACHE OVERPASS' },
    { x: 2220, y: 815, w: 720, h: 24, label: 'FIREWALL PLAZA' }, { x: 3120, y: 785, w: 780, h: 24, label: 'BROADCAST GATE' }
  ]);

  const CINEMATIC = Object.freeze({ freezeMs: 800, panMs: 2000, flourishMs: 900, bossFrameX: 3136, bossStopX: 3650, bossGroundY: 750, bossSpeed: 140 });

  function totalQuota() { return ENCOUNTERS.reduce((sum, e) => sum + e.enemies.length, 0); }
  function clampCamera(x) { return window.clamp ? window.clamp(x, CAMERA_MIN, CAMERA_MAX) : Math.max(CAMERA_MIN, Math.min(CAMERA_MAX, x)); }

  window.Sector1Progression = class Sector1Progression {
    constructor(player) { this.player = player || null; this.requiredEnemyKills = totalQuota(); this.reset(); this.state = STATES.TUTORIAL; }
    static get ENCOUNTERS() { return ENCOUNTERS; }
    static get GEOMETRY() { return GEOMETRY; }
    static get CINEMATIC() { return CINEMATIC; }
    static get STATES() { return STATES; }
    isAuthoritativeMissionActive() { return this.state !== STATES.TUTORIAL && this.state !== STATES.BOSS_READY; }
    shouldSuppressGenericSpawning() { return true; }
    isGameplaySuppressed() { return [STATES.FREEZE, STATES.ENEMY_PURGE, STATES.CAMERA_PAN, STATES.BOSS_WALK_IN, STATES.BOSS_FLOURISH, STATES.BOSS_READY].includes(this.state); }
    getCameraX(fallback) { return this.cameraOverrideActive ? clampCamera(this.cameraX) : fallback; }
    update(deltaTime = 0) {
      if (window.gameState && window.gameState.paused) return;
      this.player = this.player || window.player;
      const tutorialDone = !window.tutorialSystem || (window.tutorialSystem.isCompleted && window.tutorialSystem.isCompleted()) || (window.tutorialSystem.isActive && !window.tutorialSystem.isActive());
      if (this.state === STATES.TUTORIAL && tutorialDone) this.startMission();
      if (this.isGameplaySuppressed() && this.player) { this.player.controlsDisabled = true; this.player.velocity.x = 0; }
      if (/^encounter_/.test(this.state)) this.updateEncounter();
      else if (this.state === STATES.FREEZE) this.advanceTimed(deltaTime, CINEMATIC.freezeMs, STATES.ENEMY_PURGE, () => this.purgeEnemies());
      else if (this.state === STATES.ENEMY_PURGE) this.transitionToPan();
      else if (this.state === STATES.CAMERA_PAN) this.updatePan(deltaTime);
      else if (this.state === STATES.BOSS_WALK_IN) this.updateBossWalk(deltaTime);
      else if (this.state === STATES.BOSS_FLOURISH) this.advanceTimed(deltaTime, CINEMATIC.flourishMs, STATES.BOSS_READY, () => this.enterBossReady());
    }
    startMission() { this.state = STATES.ENCOUNTER_1; this.missionStarted = true; this.missionDefeats = 0; this.countedEnemies.clear(); this.spawnedEncounterIds.clear(); this.activeEncounterId = null; this.enemyManagerReset(); if (window.objectivesSystem?.setMissionDefeatObjective) window.objectivesSystem.setMissionDefeatObjective(0, this.requiredEnemyKills); }
    enemyManagerReset() { if (window.cancelInitialEnemySpawn) window.cancelInitialEnemySpawn(); if (window.enemyManager) window.enemyManager.clear(); if (window.gameState) { window.gameState.enemiesDefeated = 0; window.gameState.hasSpawnedInitialEnemies = true; } }
    updateEncounter() { const index = ENCOUNTERS.findIndex(e => e.id === this.state); const def = ENCOUNTERS[index]; if (!def) return; const px = this.player?.position?.x || 0; if (!this.spawnedEncounterIds.has(def.id) && px >= def.triggerX) this.spawnEncounter(def); if (this.activeEncounterId === def.id && this.activeEncounterEnemies.every(e => !e.active || e._defeatRecorded)) { if (index < ENCOUNTERS.length - 1) { this.state = ENCOUNTERS[index + 1].id; this.activeEncounterId = null; this.activeEncounterEnemies = []; } } }
    spawnEncounter(def) { this.spawnedEncounterIds.add(def.id); this.activeEncounterId = def.id; this.activeEncounterEnemies = def.enemies.map((spec, i) => this.spawnMissionEnemy(spec, def.id, i)); }
    spawnMissionEnemy(spec, encounterId, index) { const enemy = new window.Enemy(spec.x, spec.y, spec.type); enemy._sector1MissionEnemy = true; enemy._sector1EncounterId = encounterId; enemy._sector1Index = index; enemy.entranceComplete = true; enemy.state = 'patrol'; enemy.isOnGround = true; if (window.enemyManager) window.enemyManager.enemies.push(enemy); return enemy; }
    onEnemyDefeated(authoritativeTotal, enemy) { if (!this.missionStarted || !enemy || !enemy._sector1MissionEnemy || this.countedEnemies.has(enemy)) return; this.countedEnemies.add(enemy); this.missionDefeats = Math.min(this.requiredEnemyKills, this.missionDefeats + 1); if (window.gameState) window.gameState.enemiesDefeated = this.missionDefeats; if (window.objectivesSystem?.updateMissionDefeatProgress) window.objectivesSystem.updateMissionDefeatProgress(this.missionDefeats, this.requiredEnemyKills); if (this.missionDefeats === this.requiredEnemyKills && !this.jammerRevealed) this.revealJammer(); }
    chooseJammerPosition() { const px = this.player?.position?.x || 960; const x = px < WORLD_WIDTH / 2 ? 3520 : 620; return { x, y: GROUND_Y }; }
    revealJammer() { this.state = STATES.JAMMER_ACTIVE; this.jammerRevealed = true; const position = this.chooseJammerPosition(); window.BARCODE?.JammerEnvironment?.reveal({ position }); if (window.objectivesSystem?.revealJammerObjective) window.objectivesSystem.revealJammerObjective(); }
    onJammerDestroyed() { if (this.jammerDestroyedNotified) return; this.jammerDestroyedNotified = true; if (window.objectivesSystem?.completeJammerObjective) window.objectivesSystem.completeJammerObjective(); this.state = STATES.FREEZE; this.phaseElapsed = 0; this.cinematicStartedCount++; }
    advanceTimed(delta, duration, next, callback) { this.phaseElapsed += delta; if (this.phaseElapsed >= duration) { this.state = next; this.phaseElapsed = 0; if (callback) callback(); } }
    purgeEnemies() { if (window.enemyManager?.purgeForCinematic) window.enemyManager.purgeForCinematic(); else if (window.enemyManager) window.enemyManager.enemies = []; }
    transitionToPan() { this.state = STATES.CAMERA_PAN; this.phaseElapsed = 0; const playerX = this.player?.position?.x || CAMERA_MIN; this.panStartX = clampCamera(window.gameCamera?.x || playerX); this.panTargetX = clampCamera(CINEMATIC.bossFrameX); this.cameraX = this.panStartX; this.cameraOverrideActive = true; }
    updatePan(delta) { this.phaseElapsed += delta; const t = Math.min(1, this.phaseElapsed / CINEMATIC.panMs); const eased = t * t * (3 - 2 * t); this.cameraX = clampCamera(this.panStartX + (this.panTargetX - this.panStartX) * eased); if (t >= 1) this.startBossWalk(); }
    startBossWalk() { this.state = STATES.BOSS_WALK_IN; this.boss = { x: this.cameraX + CANVAS_WIDTH / 2 + 180, y: CINEMATIC.bossGroundY, state: 'walk', active: true, sprite: null, spriteReady: false, flourishPlayed: false, canDealDamage: false, canReceiveDamage: false }; this.prepareBossSprite('sector_1_boss_walk_walk', true); }
    prepareBossSprite(animation, loop) { if (!this.boss) return; if (!this.boss.sprite && window.MakkoEngine?.sprite) this.boss.sprite = window.MakkoEngine.sprite('sector_1_boss_sector1boss'); if (this.boss.sprite?.isLoaded?.()) { this.boss.spriteReady = true; if (this.boss.sprite.play) this.boss.sprite.play(animation, loop); } }
    updateBossWalk(delta) { this.prepareBossSprite('sector_1_boss_walk_walk', true); this.boss.x -= CINEMATIC.bossSpeed * (delta / 1000); if (this.boss.spriteReady && this.boss.sprite.update) this.boss.sprite.update(delta); if (this.boss.x <= CINEMATIC.bossStopX) { this.boss.x = CINEMATIC.bossStopX; this.state = STATES.BOSS_FLOURISH; this.phaseElapsed = 0; this.boss.state = 'flourish'; this.boss.flourishPlayed = true; this.prepareBossSprite('sector_1_boss_attack_attack', false); if (window.gameState) window.gameState.collectionMessage = { text: 'SIGNAL RESTORED. BOSS APPROACHING.', timer: 160 }; } }
    enterBossReady() { this.boss.state = 'idle'; this.prepareBossSprite('sector_1_boss_idle_idle', true); this.bossReadyEmitted = true; if (window.objectivesSystem?.setBossIntroObjective) window.objectivesSystem.setBossIntroObjective(); }
    draw(ctx) { this.drawGeometry(ctx); this.drawBoss(ctx); }
    drawGeometry(ctx) { if (!ctx) return; ctx.save(); GEOMETRY.forEach(g => { ctx.fillStyle = 'rgba(0,255,255,0.18)'; ctx.fillRect(g.x, g.y, g.w, g.h); ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 3; ctx.strokeRect(g.x, g.y, g.w, g.h); ctx.fillStyle = '#ff00ff'; ctx.font = '14px monospace'; ctx.fillText(g.label, g.x + 12, g.y - 8); }); ctx.restore(); }
    drawBoss(ctx) { if (!ctx || !this.boss?.active) return; ctx.save(); if (this.boss.spriteReady && this.boss.sprite?.draw) this.boss.sprite.draw(ctx, this.boss.x, this.boss.y + 110, { scale: 0.8, flipH: true }); else { ctx.fillStyle = '#ff3300'; ctx.fillRect(this.boss.x - 70, this.boss.y - 150, 140, 150); ctx.fillStyle = '#fff'; ctx.fillText('SECTOR 1 BOSS', this.boss.x - 60, this.boss.y - 170); } ctx.restore(); }
    reset(options = {}) { this.missionStarted = false; this.missionDefeats = 0; this.enemiesDefeated = 0; this.jammerRevealed = false; this.jammerDestroyedNotified = false; this.cinematicStartedCount = 0; this.phaseElapsed = 0; this.cameraOverrideActive = false; this.cameraX = null; this.panStartX = null; this.panTargetX = null; this.boss = null; this.bossReadyEmitted = false; this.countedEnemies = new Set(); this.spawnedEncounterIds = new Set(); this.activeEncounterId = null; this.activeEncounterEnemies = []; this.state = options && options.preserveTutorial ? STATES.TUTORIAL : STATES.TUTORIAL; if (window.BARCODE?.JammerEnvironment?.reset) window.BARCODE.JammerEnvironment.reset(); if (this.player) this.player.controlsDisabled = false; }
    getDiagnostics() { return { state: this.state, missionDefeats: this.missionDefeats, requiredEnemyKills: this.requiredEnemyKills, encounters: ENCOUNTERS, jammerRevealed: this.jammerRevealed, cinematicStartedCount: this.cinematicStartedCount, cameraX: this.cameraX, boss: this.boss && { x: this.boss.x, state: this.boss.state, flourishPlayed: this.boss.flourishPlayed, canDealDamage: false, canReceiveDamage: false }, bossReadyEmitted: this.bossReadyEmitted }; }
  };
  window.initSector1Progression = function(player) { if (!window.sector1Progression) window.sector1Progression = new window.Sector1Progression(player); else window.sector1Progression.player = player || window.sector1Progression.player; return window.sector1Progression; };
})();
