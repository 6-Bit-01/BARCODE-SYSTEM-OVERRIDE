// Sector 1 authored Level 1 mission progression owner.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/sector1-progression.js', exports: ['Sector1Progression', 'sector1Progression', 'initSector1Progression'], dependencies: ['player', 'enemyManager', 'BARCODE.JammerEnvironment'] });

(function() {
  const WORLD_WIDTH = 4096;
  const CANVAS_WIDTH = 1920;
  const GROUND_Y = window.Player.GROUND_Y ?? 784;
  // The shared street plane places visible feet at 856, in the sidewalk center.
  // Stage surfaces store visible-foot Y; actor anchors stay 72px above them.
  const PLAYER_VISUAL_FOOT_OFFSET = window.Player.VISUAL_FOOT_OFFSET_Y;
  const CAMERA_MIN = CANVAS_WIDTH / 2;
  const CAMERA_MAX = WORLD_WIDTH - CANVAS_WIDTH / 2;
  const COMPLETION_PRESENTATION = Object.freeze({ holdMs: 620, fadeMs: 240, rowMs: 760, staggerMs: 220 });

  const STATES = Object.freeze({
    TUTORIAL: 'tutorial', ENCOUNTER_1: 'encounter_1', ENCOUNTER_2: 'encounter_2', ENCOUNTER_3: 'encounter_3', ENCOUNTER_4: 'encounter_4',
    JAMMER_ACTIVE: 'jammer_active', FREEZE: 'jammer_destroyed_freeze', ENEMY_PURGE: 'enemy_purge', CAMERA_PAN: 'camera_pan',
    BOSS_WALK_IN: 'boss_walk_in', BOSS_CLOSE_UP: 'boss_close_up', BOSS_FLOURISH: 'boss_flourish', BOSS_HOLD: 'boss_hold',
    CAMERA_RETURN: 'camera_return', BOSS_READY: 'boss_ready', BOSS_COMBAT: 'boss_combat', LEVEL_COMPLETE: 'level_complete'
  });

  const ENCOUNTERS = Object.freeze([
    { id: 'encounter_1', triggerX: 520, label: 'Signal Alley', activeCap: 3, packets: [[{ type: 'virus', x: 760, y: 650 }, { type: 'virus', x: 920, y: 650 }], [{ type: 'corrupted', x: 1080, y: 650 }, { type: 'virus', x: 1230, y: 650 }]], enemies: [{ type: 'virus', x: 760, y: 650 }, { type: 'virus', x: 920, y: 650 }, { type: 'corrupted', x: 1080, y: 650 }, { type: 'virus', x: 1230, y: 650 }] },
    { id: 'encounter_2', triggerX: 1280, label: 'Cache Overpass', activeCap: 3, packets: [[{ type: 'corrupted', x: 1440, y: 650 }, { type: 'virus', x: 1590, y: 650 }], [{ type: 'virus', x: 1740, y: 650, role: 'swooper' }, { type: 'corrupted', x: 1880, y: 650 }, { type: 'virus', x: 2020, y: 650 }]], enemies: [{ type: 'corrupted', x: 1440, y: 650 }, { type: 'virus', x: 1590, y: 650 }, { type: 'virus', x: 1740, y: 650, role: 'swooper' }, { type: 'corrupted', x: 1880, y: 650 }, { type: 'virus', x: 2020, y: 650 }] },
    { id: 'encounter_3', triggerX: 2140, label: 'Firewall Plaza', activeCap: 3, packets: [[{ type: 'firewall', x: 2300, y: 650 }, { type: 'virus', x: 2440, y: 650, role: 'swooper' }], [{ type: 'corrupted', x: 2600, y: 650 }, { type: 'virus', x: 2760, y: 650 }, { type: 'corrupted', x: 2900, y: 650 }]], enemies: [{ type: 'firewall', x: 2300, y: 650 }, { type: 'virus', x: 2440, y: 650, role: 'swooper' }, { type: 'corrupted', x: 2600, y: 650 }, { type: 'virus', x: 2760, y: 650 }, { type: 'corrupted', x: 2900, y: 650 }] },
    { id: 'encounter_4', triggerX: 3050, label: 'Broadcast Gate', activeCap: 4, packets: [[{ type: 'corrupted', x: 3180, y: 650 }, { type: 'virus', x: 3320, y: 650, role: 'swooper' }, { type: 'firewall', x: 3460, y: 650 }], [{ type: 'virus', x: 3600, y: 650 }, { type: 'corrupted', x: 3740, y: 650 }, { type: 'virus', x: 3880, y: 650, role: 'swooper' }]], enemies: [{ type: 'corrupted', x: 3180, y: 650 }, { type: 'virus', x: 3320, y: 650, role: 'swooper' }, { type: 'firewall', x: 3460, y: 650 }, { type: 'virus', x: 3600, y: 650 }, { type: 'corrupted', x: 3740, y: 650 }, { type: 'virus', x: 3880, y: 650, role: 'swooper' }] }
  ]);

  // Calibrated against the locked 1279x462 Level 1 foreground image using the
  // renderer's 4400x1589 draw at (-152, -550). Every collider follows a real
  // awning or rooftop; the tower intentionally exposes both its upper roof and
  // lower striped awning, while facade/window/door trim remains non-collidable.
  const STAGE_SURFACES = Object.freeze([
    { id: 'signal-awning', x: 736, y: 492, w: 529, h: 8 },
    { id: 'cache-awning', x: 1534, y: 330, w: 278, h: 8 },
    { id: 'firewall-canopy', x: 1936, y: 358, w: 582, h: 8 },
    { id: 'relay-rooftop', x: 2580, y: 196, w: 574, h: 8 },
    { id: 'tower-rooftop', x: 3154, y: 275, w: 609, h: 8 },
    { id: 'tower-awning', x: 3292, y: 502, w: 402, h: 8 },
    { id: 'broadcast-awning', x: 3777, y: 502, w: 319, h: 8 }
  ]);

  // Actual building crowns plus bolted access ledges. The tallest rise is
  // 276px, within the existing held single jump; every route has a drop back.
  const UPPER_SURFACES = Object.freeze([
    { id:'signal-street-step', x:1090, y:650, w:148, h:18 },
    { id:'cache-street-step', x:1385, y:632, w:156, h:18 },
    { id:'signal-roof', x:708, y:234, w:610, h:12, roof:true },
    { id:'west-service-step', x:520, y:20, w:156, h:16 },
    { id:'west-crown', x:118, y:-210, w:500, h:12, roof:true },
    { id:'cache-access', x:1540, y:98, w:174, h:16 },
    { id:'cache-crown', x:1355, y:-178, w:544, h:12, roof:true },
    { id:'firewall-roof', x:1920, y:50, w:600, h:12, roof:true },
    { id:'plaza-service-step', x:2230, y:592, w:160, h:18 },
    { id:'plaza-upper-step', x:2360, y:142, w:160, h:16 },
    { id:'relay-upper-step', x:3000, y:-20, w:156, h:16 },
    { id:'tower-service-step', x:3330, y:30, w:166, h:16 },
    { id:'tower-upper-step', x:3430, y:-174, w:166, h:16 },
    { id:'tower-crown', x:3210, y:-326, w:542, h:12, roof:true },
    { id:'broadcast-service-step', x:3820, y:260, w:166, h:16 },
    { id:'broadcast-upper-step', x:3880, y:38, w:166, h:16 },
    { id:'broadcast-crown', x:3785, y:-84, w:311, h:12, roof:true }
  ]);
  const ROOFTOP_GUARDS = Object.freeze({
    encounter_1: { index:2, surface:'signal-roof' },
    encounter_2: { index:3, surface:'cache-awning' },
    encounter_3: { index:2, surface:'relay-rooftop' },
    encounter_4: { index:2, surface:'tower-rooftop' }
  });

  const ENCOUNTER_GATES = Object.freeze([
    { id: 'gate_1', encounterId: 'encounter_1', x: 1320, y: -550, w: 58, h: GROUND_Y + 72 + 550, depthX: 74, depthY: -34, mountTop: -164 },
    { id: 'gate_2', encounterId: 'encounter_2', x: 2110, y: -550, w: 58, h: GROUND_Y + 72 + 550, depthX: 68, depthY: -34, mountTop: 64 },
    { id: 'gate_3', encounterId: 'encounter_3', x: 3000, y: -550, w: 58, h: GROUND_Y + 72 + 550, depthX: 80, depthY: -34, mountTop: -310 },
    { id: 'gate_4', encounterId: 'encounter_4', x: 4010, y: -550, w: 58, h: GROUND_Y + 72 + 550, depthX: 24, depthY: -34, mountTop: -68 }
  ]);

  const TRAVERSAL_PROPS = Object.freeze([
    { id: 'cache-maintenance-step', x: 1390, y: 410, w: 128, h: 14 },
    { id: 'tower-utility-unit', x: 3150, y: 650, w: 160, h: GROUND_Y + 72 - 650 }
  ]);
  const REPAIRS = Object.freeze([
    { id: 'repair.signal-awning', x: 1080, y: 450, surfaceY: 492 },
    { id: 'repair.tower-awning', x: 3620, y: -368, surfaceY: -326 }
  ]);

  function drawRepairCell(ctx, x, y, scale = 1) {
    // A compact medical capsule: the heart is legible without a text label.
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.lineWidth = 3; ctx.strokeStyle = '#070c14';
    const face = (points, fill) => { ctx.fillStyle = fill; ctx.beginPath(); points.forEach(([px,py],i) => i ? ctx.lineTo(px,py) : ctx.moveTo(px,py)); ctx.closePath(); ctx.fill(); ctx.stroke(); };
    face([[-25,-22],[-18,-29],[27,-29],[25,-22]], '#cce9d2');
    face([[25,-22],[32,-29],[32,23],[25,30]], '#347662');
    face([[-25,-22],[25,-22],[25,30],[-25,30]], '#163f3a');
    ctx.strokeStyle = '#a9ffdb'; ctx.lineWidth = 2; ctx.strokeRect(-22,-19,44,45);
    ctx.fillStyle = '#a9ffdb'; ctx.fillRect(-18,-15,36,33);
    ctx.fillStyle = '#edfff5';
    ctx.beginPath(); ctx.moveTo(0,14); ctx.bezierCurveTo(-33,-7,-11,-23,0,-10); ctx.bezierCurveTo(11,-23,33,-7,0,14); ctx.fill();
    ctx.strokeStyle = '#0b4335'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#e1d6ac'; ctx.fillRect(-14,22,8,3); ctx.fillRect(6,22,8,3);
    ctx.restore();
  }

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
    bossGroundY: GROUND_Y,
    bossSpeed: 140
  });
  const SPAWN = Object.freeze({
    offscreenPadding: 140,
    playerExclusionRadius: 350,
    protectionMs: 700,
    staggerMs: 350,
    entranceSpeed: 420,
    jammerReinforcementCap: 3,
    jammerCadenceMinMs: 2500,
    jammerCadenceMaxMs: 3500
  });
  // Rhythm-powered access from street level to the first authored awning.
  // Platform coordinates use the same visible-foot space as STAGE_SURFACES.
  const SIGNAL_LIFT = Object.freeze({
    id: 'signal-lift',
    x: 660,
    w: 132,
    h: 10,
    bottomY: GROUND_Y + PLAYER_VISUAL_FOOT_OFFSET,
    topY: 492,
    speed: 220,
    returnDelayMs: 900,
    requiredCharges: 2
  });
  const SIGNAL_AMP = Object.freeze({ id: 'signal-amp', x: 2868, y: 154, radius: 36, charges: 3, range: 430 });

  // Encounter tuning is intentionally local to Level 1. MusicTransport keeps
  // the rhythm judgment; this owner's hostile delta controls enemy actions.
  const BOSS_COMBAT = Object.freeze({
    maxHealth: 10, readyMs: 1800, approachSpeed: 180, approachRange: 230,
    telegraphMs: 1600, fastTelegraphMs: 1300, sweepMs: 700,
    recoveryMs: 3000, fastRecoveryMs: 2500, secondPulseMs: 410,
    pulseSpeed: 560, pulseRange: 1050, pulseWidth: 64, pulseHeight: 56,
    hitboxWidth: 110 * 1.08, hitboxHeight: 202.4 * 1.08
  });

  // Measured from the manifest-linked sheets (opaque alpha >= 128), September
  // 11 playtest repair. Scale the neutral BODY, not the transparent frame or
  // raised blade; retain authored breathing and limb motion within each clip.
  const BOSS_PRESENTATION = Object.freeze({
    targetBodyHeight: 253 * 0.8 * 1.08,
    walk: Object.freeze({
      width: 200, height: 256, anchorX: 100, anchorY: 253, bodyHeight: 253, visualScale: 1.06,
      footRows: Object.freeze([253, 252, 252, 253, 246, 244, 244, 245, 244, 245, 251, 252, 253, 253, 253, 253, 252, 253, 249, 245, 245, 245, 245, 246, 251, 253, 253, 253, 252, 252, 252, 249, 246, 245, 245, 245, 246, 252, 253, 252, 253])
    }),
    flourish: Object.freeze({
      width: 512, height: 310, anchorX: 256, anchorY: 308, bodyHeight: 250,
      footRows: Object.freeze(Array(48).fill(308))
    }),
    idle: Object.freeze({"width":416,"height":320,"anchorX":208,"anchorY":308,"footRows":[308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308,308],"bodyHeight":267.0})
  });

  function encounterSpecs(encounter) { return encounter && encounter.packets ? encounter.packets.flat() : (encounter?.enemies || []); }
  function totalQuota() { return ENCOUNTERS.reduce((sum, e) => sum + encounterSpecs(e).length, 0); }
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
    static get UPPER_SURFACES() { return UPPER_SURFACES; }
    static get TRAVERSAL_PROPS() { return TRAVERSAL_PROPS; }
    static get REPAIRS() { return REPAIRS; }
    static drawRepairCell(ctx, x, y, scale) { drawRepairCell(ctx, x, y, scale); }
    getStageSurfaces() { return this.missionStarted ? STAGE_SURFACES.concat(TRAVERSAL_PROPS, UPPER_SURFACES) : STAGE_SURFACES; }
    static get PLAYER_VISUAL_FOOT_OFFSET() { return PLAYER_VISUAL_FOOT_OFFSET; }
    static get ENCOUNTER_GATES() { return ENCOUNTER_GATES; }
    static get SIGNAL_LIFT() { return SIGNAL_LIFT; }
    static get SIGNAL_AMP() { return SIGNAL_AMP; }
    static get CINEMATIC() { return CINEMATIC; }
    static get STATES() { return STATES; }
    static get BOSS_COMBAT() { return BOSS_COMBAT; }
    isAuthoritativeMissionActive() { return this.state !== STATES.TUTORIAL && this.state !== STATES.LEVEL_COMPLETE; }
    shouldSuppressGenericSpawning() { return true; }
    isBossCinematicActive() { return [STATES.FREEZE, STATES.ENEMY_PURGE, STATES.CAMERA_PAN, STATES.BOSS_WALK_IN, STATES.BOSS_CLOSE_UP, STATES.BOSS_FLOURISH, STATES.BOSS_HOLD, STATES.CAMERA_RETURN].includes(this.state); }
    isGameplaySuppressed() { return this.isBossCinematicActive() || this.state === STATES.LEVEL_COMPLETE; }
    getCameraX(fallback) { return this.cameraOverrideActive ? clampCamera(this.cameraX) : fallback; }
    getCameraY() { return this.cameraY || 0; }
    getCinematicZoomOverride() { return Number.isFinite(this.cinematicZoomOverride) ? this.cinematicZoomOverride : null; }
    update(deltaTime = 0) {
      if (window.isPaused || window.gameState?.paused || window.gameState?.gameOver || window.gameState?.victory) return;
      this.player = this.player || window.player;
      this.pollPreparedAssets();
      this.updateDistrictSignal(deltaTime);
      const desiredY = this.missionStarted && !this.isGameplaySuppressed() && !this.isBossCombatLive?.()
        ? Math.max(-620, Math.min(0, (this.player?.position.y ?? GROUND_Y) - 400)) : 0;
      this.cameraY = (this.cameraY || 0) + (desiredY - (this.cameraY || 0)) * (1 - Math.exp(-Math.max(0, deltaTime) / 240));
      this.updateBarrierContacts(deltaTime);
      const tutorialDone = !!(window.tutorialSystem && typeof window.tutorialSystem.isCompleted === 'function' && window.tutorialSystem.isCompleted() && typeof window.tutorialSystem.isActive === 'function' && !window.tutorialSystem.isActive());
      if (this.state === STATES.TUTORIAL && tutorialDone && !this.missionStarted) {
        this.startMission();
      }
      if (this.state === STATES.TUTORIAL) this.applyGateCollision();
      // The lift is traversal, not a hostile system, so tactical focus must
      // never slow or freeze its carry motion.
      this.updateSignalLift(deltaTime);
      this.updateSignalAmp();
      this.updateRepairs(deltaTime);
      if (this.isGameplaySuppressed() && this.player) { this.player.supportedSurfaceId = null; this.player.controlsDisabled = true; if (this.frozenPlayerPosition) { this.player.position.x = this.frozenPlayerPosition.x; this.player.position.y = this.frozenPlayerPosition.y; } this.player.velocity.x = 0; this.player.velocity.y = 0; }
      const tacticalDeltaTime = window.BARCODE?.TacticalFocusClock?.scaleDelta?.(deltaTime) ?? deltaTime;
      if (/^encounter_/.test(this.state)) { this.applyGateCollision(); this.updateEncounter(tacticalDeltaTime); this.updatePendingSpawns(tacticalDeltaTime); }
      else if (this.state === STATES.JAMMER_ACTIVE) this.updateJammerReinforcements(tacticalDeltaTime);
      else if (this.state === STATES.FREEZE) this.advanceTimed(deltaTime, CINEMATIC.freezeMs, STATES.ENEMY_PURGE, () => this.purgeEnemies());
      else if (this.state === STATES.ENEMY_PURGE) this.transitionToPan();
      else if (this.state === STATES.CAMERA_PAN) this.updatePan(deltaTime);
      else if (this.state === STATES.BOSS_WALK_IN) this.updateBossWalk(deltaTime);
      else if (this.state === STATES.BOSS_CLOSE_UP) this.updateBossCloseUp(deltaTime);
      else if (this.state === STATES.BOSS_FLOURISH) this.updateBossFlourish(deltaTime);
      else if (this.state === STATES.BOSS_HOLD) this.updateBossHold(deltaTime);
      else if (this.state === STATES.CAMERA_RETURN) this.updateCameraReturn(deltaTime);
      else if (this.state === STATES.BOSS_READY) {
        this.updateBossSprite(deltaTime);
        if (this.cinematicZoomReleasePending) { this.cinematicZoomReleasePending = false; this.cinematicZoomOverride = null; }
        this.boss.phaseElapsedMs += tacticalDeltaTime;
        if (this.boss.phaseElapsedMs >= BOSS_COMBAT.readyMs) this.beginBossCombat();
      }
      else if (this.state === STATES.BOSS_COMBAT) this.updateBossCombat(tacticalDeltaTime);
    }
    startMission() { this.state = STATES.ENCOUNTER_1; this.missionStarted = true; this.missionDefeats = 0; this.resetDistrictSignal(); this.countedEnemies.clear(); this.spawnedEncounterIds.clear(); this.activeEncounterId = null; this.applyGateCollision(); this.resetSignalLift(); this.enemyManagerReset(); if (window.objectivesSystem?.setMissionDefeatObjective) window.objectivesSystem.setMissionDefeatObjective(0, this.requiredEnemyKills); }
    resetDistrictSignal() {
      this.districtSignal = { elapsedMs: 0, interference: 1,
        clearedAtMs: ENCOUNTERS.map(() => null), restoration: null };
    }
    restoreEncounterSignal(encounterId) {
      const index = ENCOUNTERS.findIndex(encounter => encounter.id === encounterId);
      if (index < 0 || this.districtSignal.clearedAtMs[index] !== null) return;
      this.districtSignal.clearedAtMs[index] = this.districtSignal.elapsedMs;
    }
    updateDistrictSignal(deltaTime) {
      if (!this.missionStarted && !this.jammerDestroyedNotified) return;
      const signal = this.districtSignal;
      // Presentation uses the existing, pause-gated frame delta. Hacking slows
      // hostile actions, not the district's recovery or the music transport.
      const delta = Math.max(0, Number.isFinite(deltaTime) ? deltaTime : 0);
      signal.elapsedMs += delta;
      const stage = window.BARCODE?.JammerEnvironment?.getStatus?.().stage?.index || 0;
      const target = 1 - Math.min(3, stage) / 4;
      signal.interference += Math.sign(target - signal.interference) *
        Math.min(Math.abs(target - signal.interference), delta / 1600);
    }
    getDistrictSignalState() {
      const signal = this.districtSignal;
      const restoration = signal.restoration;
      const elapsed = restoration ? signal.elapsedMs - restoration.startedAtMs : 0;
      const radius = elapsed * 1.4;
      const complete = !!restoration && radius >= restoration.distance + 200;
      return { active: this.missionStarted || this.jammerDestroyedNotified,
        elapsedMs: signal.elapsedMs, interference: complete ? 0 : signal.interference,
        zones: signal.clearedAtMs.map((time, index) => ({ id: ENCOUNTERS[index].id,
          cleared: time !== null, recovery: time === null ? 0 : smoothStep(Math.min(1, (signal.elapsedMs - time) / 900)) })),
        restored: complete,
        wave: restoration && !complete ? { originX: restoration.originX, radius } : null };
    }
    enemyManagerReset() { if (window.cancelInitialEnemySpawn) window.cancelInitialEnemySpawn(); if (window.enemyManager) window.enemyManager.clear(); if (window.gameState) { window.gameState.enemiesDefeated = 0; window.gameState.hasSpawnedInitialEnemies = true; } this.prepareAssetsForEncounter(0); }
    updateStragglerHint(delta) {
      if(this.lastHintDefeats!==this.missionDefeats){this.lastHintDefeats=this.missionDefeats;this.encounterIdleMs=0;}
      else this.encounterIdleMs=(this.encounterIdleMs||0)+Math.max(0,delta);
    }
    getStragglerHint() {
      const survivors=this.activeEncounterEnemies.filter(e=>e.active&&!e._defeatRecorded);
      if((this.encounterIdleMs||0)<12000||survivors.length!==1||this.pendingSpawns.length)return '';
      const target=survivors[0].position,hero=this.player.position;
      return 'LAST ENEMY '+(target.y<hero.y-140?'↑':target.y>hero.y+140?'↓':target.x<hero.x?'←':'→');
    }
    getEncounterStatus() {
      const index = ENCOUNTERS.findIndex(encounter => encounter.id === this.state);
      if (index < 0) return null;
      const encounter = ENCOUNTERS[index];
      const started = this.spawnedEncounterIds.has(encounter.id);
      const defeated = started ? this.activeEncounterEnemies.filter(enemy => !enemy.active || enemy._defeatRecorded).length : 0;
      const hints = [
        'Land on enemies or use R + Down on beat.',
        'Dodge the marked dive. Jump committed charges.',
        'Firewall braces, sweeps, then recovers. Counter at range.',
        'Read the windups. Mix stomps and rhythm during recovery.'
      ];
      return { label: encounter.label, number: index + 1, total: ENCOUNTERS.length,
        started, defeated, required: encounterSpecs(encounter).length, hint: hints[index], straggler: this.getStragglerHint() };
    }
    updateEncounter(deltaTime = 0) { const index = ENCOUNTERS.findIndex(e => e.id === this.state); const def = ENCOUNTERS[index]; if (!def) return; const px = this.player?.position?.x || 0; if (!this.spawnedEncounterIds.has(def.id) && px >= def.triggerX) this.spawnEncounter(def); if (this.activeEncounterId === def.id) this.updateEncounterPackets(def, deltaTime); this.updateStragglerHint(deltaTime); const noPendingSpawns = !this.pendingSpawns || this.pendingSpawns.length === 0; const allPacketsReleased = this.activeEncounterPacket >= ((def.packets?.length || 1) - 1); const allDefeated = this.activeEncounterEnemies.length === encounterSpecs(def).length && this.activeEncounterEnemies.every(e => !e.active || e._defeatRecorded); if (this.activeEncounterId === def.id && allPacketsReleased && noPendingSpawns && allDefeated) { this.openEncounterGate(def.id); if (index < ENCOUNTERS.length - 1) { this.state = ENCOUNTERS[index + 1].id; this.activeEncounterId = null; this.activeEncounterEnemies = []; this.closedGateEncounterId = null; this.prepareAssetsForEncounter(index + 1); } } }
    updateEncounterPackets(def, deltaTime = 0) { const packets = def.packets || [def.enemies || []]; if (this.activeEncounterPacket >= packets.length - 1) return; const survivors = this.activeEncounterEnemies.filter(e => e && e.active && !e._defeatRecorded).length; const noPendingSpawns = !this.pendingSpawns || this.pendingSpawns.length === 0; if (noPendingSpawns && survivors <= 1 && this.packetGraceMs === null) this.packetGraceMs = 900; if (this.packetGraceMs !== null) { this.packetGraceMs = Math.max(0, this.packetGraceMs - deltaTime); if (this.packetGraceMs <= 0) this.releaseNextPacket(def); } }
    spawnEncounter(def) { this.spawnedEncounterIds.add(def.id); this.activeEncounterId = def.id; this.closedGateEncounterId = def.id; this.activeEncounterEnemies = []; this.activeEncounterPacket = 0; this.packetGraceMs = null; const packets = def.packets || [def.enemies || []]; this.pendingSpawns = packets[0].map((spec, i) => ({ spec, encounterId: def.id, index: i, delayMs: i * SPAWN.staggerMs })); }
    releaseNextPacket(def) { const packets = def.packets || [def.enemies || []]; if (this.activeEncounterPacket >= packets.length - 1) return; this.activeEncounterPacket += 1; this.packetGraceMs = null; const priorCount = packets.slice(0, this.activeEncounterPacket).reduce((sum, packet) => sum + packet.length, 0); this.pendingSpawns = packets[this.activeEncounterPacket].map((spec, i) => ({ spec, encounterId: def.id, index: priorCount + i, delayMs: i * SPAWN.staggerMs })); }
    updatePendingSpawns(deltaTime) { if (!this.pendingSpawns || this.pendingSpawns.length === 0) return; const index = ENCOUNTERS.findIndex(e => e.id === this.state); const def = ENCOUNTERS[index]; const activeCount = this.activeEncounterEnemies.filter(e => e && e.active && !e._defeatRecorded).length; if (def?.activeCap && activeCount >= def.activeCap) return; this.pendingSpawns.forEach(pending => { pending.delayMs -= deltaTime; }); const ready = this.pendingSpawns.filter(pending => pending.delayMs <= 0).slice(0, Math.max(1, (def?.activeCap || 99) - activeCount)); this.pendingSpawns = this.pendingSpawns.filter(pending => !ready.includes(pending)); ready.forEach(pending => this.activeEncounterEnemies.push(this.spawnMissionEnemy(pending.spec, pending.encounterId, pending.index))); }
    getVisibleWorldBounds() { const playerX = this.player?.position?.x || CAMERA_MIN; const cameraX = this.cameraOverrideActive && Number.isFinite(this.cameraX) ? clampCamera(this.cameraX) : clampCamera(playerX); const rawZoom = window.renderer && typeof window.renderer.getZoomLevel === 'function' ? window.renderer.getZoomLevel() : window.renderer?.zoomLevel; const zoom = Math.max(0.1, Number.isFinite(rawZoom) ? rawZoom : 1); const halfWidth = CANVAS_WIDTH / (2 * zoom); return { left: Math.max(0, cameraX - halfWidth), right: Math.min(WORLD_WIDTH, cameraX + halfWidth), center: cameraX, zoom }; }
    getSpawnBodyHalfWidth(type) { if (type === 'firewall') return 135; if (type === 'corrupted') return 50; return 40; }
    planSpawn(spec = {}) { const bounds = this.getVisibleWorldBounds(); const bodyHalf = this.getSpawnBodyHalfWidth(spec.type); const playerX = this.player?.position?.x || bounds.center; const left = { x: Math.max(bodyHalf, bounds.left - SPAWN.offscreenPadding - bodyHalf), side: 'left' }; const right = { x: Math.min(WORLD_WIDTH - bodyHalf, bounds.right + SPAWN.offscreenPadding + bodyHalf), side: 'right' }; const outside = candidate => candidate.x + bodyHalf <= bounds.left - SPAWN.offscreenPadding || candidate.x - bodyHalf >= bounds.right + SPAWN.offscreenPadding; const farFromPlayer = candidate => Math.abs(candidate.x - playerX) >= SPAWN.playerExclusionRadius + bodyHalf; const candidates = [left, right].filter(outside).sort((a, b) => Math.abs(a.x - (spec.x || playerX)) - Math.abs(b.x - (spec.x || playerX))); const accepted = candidates.find(farFromPlayer) || candidates[0] || [left, right].sort((a, b) => Math.abs(b.x - playerX) - Math.abs(a.x - playerX))[0]; this.lastSpawnPlan = { bounds, candidates, accepted: { x: accepted.x, y: Number.isFinite(spec.y) ? spec.y : GROUND_Y, side: accepted.side }, playerX, exclusionRadius: SPAWN.playerExclusionRadius, bodyHalf }; return { x: accepted.x, y: Number.isFinite(spec.y) ? spec.y : GROUND_Y, side: accepted.side }; }
    planEntranceTarget(spec = {}, origin = {}, index = 0) { const bodyHalf = this.getSpawnBodyHalfWidth(spec.type); const playerX = this.player?.position?.x || CAMERA_MIN; const clearance = SPAWN.playerExclusionRadius + bodyHalf; const authoredX = Math.max(bodyHalf, Math.min(WORLD_WIDTH - bodyHalf, Number.isFinite(spec.x) ? spec.x : playerX)); const originSide = origin.side || (origin.x < playerX ? 'left' : 'right'); const side = originSide === 'left' ? -1 : 1; const authoredStaysOnApproachSide = side < 0 ? authoredX <= playerX - clearance : authoredX >= playerX + clearance; if (authoredStaysOnApproachSide) return { x: authoredX, y: Number.isFinite(spec.y) ? spec.y : GROUND_Y }; const spread = Math.min(180, Math.max(0, Number(index) || 0) * 45); let targetX = Math.max(bodyHalf, Math.min(WORLD_WIDTH - bodyHalf, playerX + side * (clearance + spread))); if (Math.abs(targetX - playerX) < clearance) targetX = Math.max(bodyHalf, Math.min(WORLD_WIDTH - bodyHalf, playerX - side * (clearance + spread))); return { x: targetX, y: Number.isFinite(spec.y) ? spec.y : GROUND_Y }; }
    spawnMissionEnemy(spec, encounterId, index, options = {}) {
      const guard = !options.jammerReinforcement && !options.tutorialEnemy && ROOFTOP_GUARDS[encounterId];
      const home = guard && guard.index === index ? this.getStageSurfaces().find(p => p.id === guard.surface) : null;
      if (home) spec = { ...spec, x: home.x + home.w * 0.5, y: home.y - PLAYER_VISUAL_FOOT_OFFSET };
      const targetY = home ? home.y - PLAYER_VISUAL_FOOT_OFFSET : spec.type === 'virus' && Number.isFinite(spec.y) ? spec.y : GROUND_Y; const origin = options.origin || this.planSpawn({ ...spec, y: targetY }); if (!options.origin && encounterId === 'encounter_2' && spec.type === 'virus') origin.y = 330 - PLAYER_VISUAL_FOOT_OFFSET; const target = this.planEntranceTarget({ ...spec, y: targetY }, origin, index); const enemy = new window.Enemy(origin.x, origin.y, spec.type); /* Enemy constructors have legacy entrance code that rewrites some origins, so restore the authoritative planned origin after construction. */ enemy.position.x = origin.x; enemy.position.y = origin.y; enemy.originalSpawnX = origin.x; enemy.originalSpawnY = origin.y; enemy._dropEdge = null; enemy._sector1MissionEnemy = !options.jammerReinforcement && !options.tutorialEnemy; enemy._jammerReinforcement = !!options.jammerReinforcement; enemy._isTutorialEnemy = !!options.tutorialEnemy; enemy._sector1EncounterId = encounterId; enemy._sector1Index = index; enemy._repairCarrier = enemy._sector1MissionEnemy && encounterId === 'encounter_2' && index === 0 && spec.type === 'corrupted'; enemy.role = spec.role || null; if (enemy.role === 'swooper') { enemy.swooperState = 'approach'; enemy._dropEdge = null; } if (home) { target.x = spec.x; target.y = spec.y; enemy.homeSurfaceId = home.id; } enemy._entranceTarget = target; enemy._authoredEntranceActive = true; enemy._authoredEntranceSpeed = SPAWN.entranceSpeed; enemy.entranceComplete = false; enemy.state = 'authored_entrance'; enemy.spawnTimeMs = 0; enemy.spawnProtectionDuration = SPAWN.protectionMs; enemy.velocity.x = enemy._entranceTarget.x >= origin.x ? SPAWN.entranceSpeed : -SPAWN.entranceSpeed; enemy.velocity.y = 0; if (window.enemyManager) window.enemyManager.enemies.push(enemy); return enemy; }
    spawnTutorialEnemy(index = 0) { this.player = this.player || window.player; if (!window.enemyManager || !window.Enemy) return null; const playerX = this.player?.position?.x || CAMERA_MIN; const side = Number(index) % 2 === 0 ? -1 : 1; const spec = { type: 'virus', x: playerX + side * (SPAWN.playerExclusionRadius + 120 + Number(index) * 45), y: GROUND_Y }; return this.spawnMissionEnemy(spec, 'tutorial', index, { tutorialEnemy: true }); }
    keepEntranceTargetSafe(enemy) {
      if (!enemy?._authoredEntranceActive || !enemy._entranceTarget || !this.player?.position) return;
      const bodyHalf = this.getSpawnBodyHalfWidth(enemy.type);
      const home = enemy.homeSurfaceId && this.getStageSurfaces().find(p => p.id === enemy.homeSurfaceId);
      if (home) {
        const left=home.x+bodyHalf+12,right=home.x+home.w-bodyHalf-12;
        if (Math.abs(enemy._entranceTarget.x-this.player.position.x)<bodyHalf+70 && Math.abs(enemy._entranceTarget.y-this.player.position.y)<180)
          enemy._entranceTarget.x=Math.abs(left-this.player.position.x)>Math.abs(right-this.player.position.x)?left:right;
        enemy._entranceTarget.y=home.y-PLAYER_VISUAL_FOOT_OFFSET;
        return;
      }
      const clearance=SPAWN.playerExclusionRadius+bodyHalf;
      if(Math.abs(enemy._entranceTarget.x-this.player.position.x)<clearance)
        enemy._entranceTarget=this.planEntranceTarget({x:enemy._entranceTarget.x,y:enemy._entranceTarget.y,type:enemy.type},{x:enemy.position.x,side:enemy.position.x<this.player.position.x?'left':'right'},enemy._sector1Index);
    }
    onEnemyDefeated(authoritativeTotal, enemy) { if (!this.missionStarted || !enemy || !enemy._sector1MissionEnemy || this.countedEnemies.has(enemy)) return; this.countedEnemies.add(enemy); this.missionDefeats = Math.min(this.requiredEnemyKills, this.missionDefeats + 1); if (window.gameState) window.gameState.enemiesDefeated = this.missionDefeats; if (window.objectivesSystem?.updateMissionDefeatProgress) window.objectivesSystem.updateMissionDefeatProgress(this.missionDefeats, this.requiredEnemyKills); if (this.missionDefeats === this.requiredEnemyKills && !this.jammerRevealed) this.revealJammer(); }
    chooseJammerPosition() {
      const px = this.player?.position?.x ?? 960;
      // Keep the entire attack position range clear of lift support. A player
      // on either lip must never power the lift while hitting the Jammer.
      const attackRange = window.BARCODE?.playerCombat?.range ?? 300;
      const clearance = attackRange + 18 + 96;
      const candidates = (px < WORLD_WIDTH / 2 ? [2350, 2900, 3520] : [1300, 1550, 1800])
        .filter(x => x < SIGNAL_LIFT.x - clearance || x > SIGNAL_LIFT.x + SIGNAL_LIFT.w + clearance);
      const x = candidates[Math.min(candidates.length - 1, Math.floor(Math.random() * candidates.length))];
      return { x, y: GROUND_Y };
    }
    revealJammer() { this.state = STATES.JAMMER_ACTIVE; this.nextJammerSpawnMs = 0; this.jammerReinforcementCount = 0; this.jammerRevealed = true; this.closedGateEncounterId = null; ENCOUNTERS.forEach(encounter => this.restoreEncounterSignal(encounter.id)); const position = this.chooseJammerPosition(); window.BARCODE?.JammerEnvironment?.reveal({ position }); if (window.objectivesSystem?.revealJammerObjective) window.objectivesSystem.revealJammerObjective(); this.prepareBossAssets(); }
    updateJammerReinforcements(deltaTime) { const environment = window.BARCODE?.JammerEnvironment; const status = environment?.getStatus?.(); if (!status || !status.revealed || status.destroyed) return; this.nextJammerSpawnMs = Number.isFinite(this.nextJammerSpawnMs) ? this.nextJammerSpawnMs - deltaTime : 0; const activeReinforcements = (window.enemyManager?.enemies || []).filter(enemy => enemy && enemy.active && (enemy._jammerReinforcement || !enemy._sector1MissionEnemy)); if (activeReinforcements.length >= SPAWN.jammerReinforcementCap || this.nextJammerSpawnMs > 0) return; const types = ['virus', 'corrupted', 'virus', 'firewall']; const type = types[this.jammerReinforcementCount % types.length]; this.jammerReinforcementCount += 1; const jammerX = status.position?.x || this.chooseJammerPosition().x; const targetX = Math.max(180, Math.min(WORLD_WIDTH - 180, jammerX + (jammerX < WORLD_WIDTH / 2 ? 240 : -240))); this.spawnMissionEnemy({ type, x: targetX, y: GROUND_Y }, 'jammer_reinforcement', this.jammerReinforcementCount, { jammerReinforcement: true }); this.nextJammerSpawnMs = SPAWN.jammerCadenceMinMs + Math.random() * (SPAWN.jammerCadenceMaxMs - SPAWN.jammerCadenceMinMs); }
    onJammerDestroyed() {
      this.nextJammerSpawnMs = Infinity;
      if (this.jammerDestroyedNotified) return;
      this.jammerDestroyedNotified = true;
      const originX = window.BARCODE?.JammerEnvironment?.getStatus?.().position?.x ?? this.player?.position?.x ?? 2048;
      this.districtSignal.restoration = { originX, startedAtMs: this.districtSignal.elapsedMs,
        distance: Math.max(originX + 152, 4248 - originX) };
      this.state = STATES.FREEZE;
      window.renderer?.impact?.('destruction');
      window.BARCODE?.stageFX?.event('destruction', originX, { duration: 1500 });
      window.BARCODE?.combatFX?.contact('firewall', originX, 660, 1, true, true);
      window.BARCODE?.combatFX?.contact('corrupted', originX, 700, -1, true, true);
      // End the combat mode at the destruction event, not at camera handoff.
      // hide() preserves the running music transport and background beat state.
      window.rhythmSystem?.hideRhythmMode?.();
      const player = this.player || window.player;
      if (player) { player.primaryAttackAnimationMs = 0; player.state = 'idle'; }
      this.captureCinematicStart();
      this.freezePlayerForCinematic();
      window.objectivesSystem?.completeJammerObjective?.();
      this.phaseElapsed = 0;
      this.cinematicStartedCount++;
    }
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
    updateBossSprite(delta) { this.prepareBossSprite(); if (this.boss?.spriteReady && this.boss.sprite?.update) { if (window.BARCODE?.SpritePlayback) window.BARCODE.SpritePlayback.update(this.boss.sprite, delta); else this.boss.sprite.update(delta); } }
    updateBossWalk(delta) { this.setBossAnimation('sector_1_boss_walk_walk', true); this.boss.x -= CINEMATIC.bossSpeed * (delta / 1000); this.updateBossSprite(delta); if (this.boss.x <= CINEMATIC.bossStopX) { this.boss.x = CINEMATIC.bossStopX; this.startBossCloseUp(); if (window.gameState) window.gameState.collectionMessage = { text: 'SIGNAL RESTORED. BOSS APPROACHING.', timer: 160 }; } }
    startBossCloseUp() { this.state = STATES.BOSS_CLOSE_UP; this.phaseElapsed = 0; this.closeUpStartZoom = this.cinematicZoomOverride; this.boss.state = 'idle'; this.setBossAnimation('sector_1_boss_idle_idle', true); }
    updateBossCloseUp(delta) { this.phaseElapsed += delta; const t = Math.min(1, this.phaseElapsed / CINEMATIC.closeUpMs); this.cinematicZoomOverride = lerp(this.closeUpStartZoom, this.cinematicCloseZoom, easeOutCubic(t)); this.updateBossSprite(delta); if (t >= 1) { this.cinematicZoomOverride = this.cinematicCloseZoom; this.startBossFlourish(); } }
    startBossFlourish() { this.state = STATES.BOSS_FLOURISH; this.phaseElapsed = 0; this.boss.state = 'flourish'; this.boss.flourishPlayed = true; this.setBossAnimation('sector_1_boss_attack_attack', false); }
    updateBossFlourish(delta) { this.updateBossSprite(delta); this.advanceTimed(delta, CINEMATIC.flourishMs, STATES.BOSS_HOLD, () => { this.boss.state = 'flourish'; }); }
    updateBossHold(delta) { this.updateBossSprite(delta); this.advanceTimed(delta, CINEMATIC.holdMs, STATES.CAMERA_RETURN, () => this.startCameraReturn()); }
    startCameraReturn() {
      this.state = STATES.CAMERA_RETURN;
      this.phaseElapsed = 0;
      this.returnStartCameraX = this.cameraX;
      this.returnStartZoom = this.cinematicZoomOverride;
      this.returnStartBossX = this.boss.x;
      this.boss.state = 'idle';
      this.setBossAnimation('sector_1_boss_idle_idle', true);
    }
    updateCameraReturn(delta) {
      this.phaseElapsed += delta;
      const t = Math.min(1, this.phaseElapsed / CINEMATIC.returnMs);
      const eased = smoothStep(t);
      this.cameraX = clampCamera(lerp(this.returnStartCameraX, this.cinematicStartCameraX, eased));
      const desiredZoom = lerp(this.returnStartZoom, this.cinematicStartZoom, eased);
      this.cinematicZoomOverride = t < 1 ? Math.max(desiredZoom, getForegroundCoverageZoomFloor(this.cameraX)) : this.cinematicStartZoom;
      // Camera motion never relocates a world actor. After handoff the normal
      // approach phase walks toward the player, even while outside the view.
      this.updateBossSprite(delta);
      if (t >= 1) {
        this.cameraX = this.cinematicStartCameraX;
        this.cinematicZoomOverride = this.cinematicStartZoom;
        this.enterBossReady();
      }
    }
    enterBossReady() {
      if (!this.boss) return false;
      this.state = STATES.BOSS_READY;
      Object.assign(this.boss, { state: 'idle', active: true, phase: 'ready', phaseElapsedMs: 0,
        health: BOSS_COMBAT.maxHealth, maxHealth: BOSS_COMBAT.maxHealth, facing: -1,
        canDealDamage: false, canReceiveDamage: false, cycle: 0, stompCycle: -1, stompArmed: true,
        phaseBeatWait: null, secondPulseBeatWait: null, latePhase: false,
        hitSequences: new Set(), pulses: [], pulseSequence: 0, hitFlashMs: 0, guardBounceMs: 0, defeated: false });
      this.setBossAnimation('sector_1_boss_idle_idle', true);
      this.bossReadyEmitted = true;
      this.cameraOverrideActive = false;
      this.frozenPlayerPosition = null;
      this.cinematicZoomReleasePending = true;
      if (this.player) {
        this.player.controlsDisabled = false;
        this.player.bossReboundMs = 0;
        this.player.bossReboundDirection = 0;
        if (this.player.velocity) { this.player.velocity.x = 0; this.player.velocity.y = 0; }
      }
      if (!this.bossCheckpoint) {
        const playerX = this.player?.position?.x ?? 960;
        this.bossCheckpoint = { playerX, bossX: this.boss.x,
          score: window.gameState?.score || 0, signalAmpCharges: window.BARCODE?.signalAmpCharges || 0 };
      }
      window.objectivesSystem?.setBossCombatObjective?.(this.boss.health, this.boss.maxHealth);
      return true;
    }
    beginBossCombat() {
      if (this.state !== STATES.BOSS_READY || !this.boss || this.boss.defeated) return false;
      this.state = STATES.BOSS_COMBAT;
      this.setBossCombatPhase('approach');
      return true;
    }
    isBossCombatLive() {
      return this.state === STATES.BOSS_COMBAT && !!this.boss?.active && !this.boss.defeated &&
        window.isRunning !== false && !window.isPaused && !window.gameState?.paused && !window.gameState?.gameOver &&
        !window.gameState?.victory && window.gameState?.running !== false && (this.player?.health ?? 1) > 0;
    }
    setBossCombatPhase(phase) {
      const boss = this.boss;
      if (!boss) return;
      boss.phase = phase;
      boss.phaseElapsedMs = 0;
      boss.phaseBeatWait = null;
      boss.canReceiveDamage = phase === 'recovery';
      boss.canDealDamage = phase === 'sweep' || boss.pulses.some(pulse => !pulse.hit);
      boss.state = phase === 'approach' ? 'walk' : phase === 'sweep' ? 'flourish' : 'idle';
      this.setBossAnimation(phase === 'approach' ? 'sector_1_boss_walk_walk' : phase === 'sweep' ? 'sector_1_boss_attack_attack' : 'sector_1_boss_idle_idle', phase !== 'sweep');
      if (phase === 'telegraph') {
        boss.cycle += 1;
        // Learn the double pulse before the final speed increase. The opening
        // cycle stays a demonstration even if development tools change health.
        boss.doublePulse = boss.cycle > 1 && boss.health <= 6;
        boss.latePhase = boss.cycle > 2 && boss.health <= 3;
        boss.secondPulseEmitted = false;
        boss.secondPulseBeatWait = null;
      }
      if (phase === 'sweep') this.emitBossPulse();
    }
    getBossMusicSample() {
      const time = window.audioSystem?.context?.currentTime;
      const sample = Number.isFinite(time) ? window.BARCODE?.MusicTransport?.sample?.(time) : null;
      return sample?.running && sample.grid && Number.isFinite(sample.grid.beatFloat) ? sample : null;
    }
    bossBoundaryReady(minimumMs, key = 'phaseBeatWait') {
      const sample = this.getBossMusicSample();
      // Silent/no-grid development hosts retain a finishable stomp encounter.
      // Live music always owns the boundary; no extra timer or beat scheduler.
      if (!sample) { this.boss[key] = null; return this.boss.phaseElapsedMs >= minimumMs; }
      const previous = this.boss[key];
      const beat = sample.grid.beatIndex;
      this.boss[key] = { generation: sample.generation, beat };
      const crossed = previous?.generation === sample.generation && beat > previous.beat;
      // Sampling a crossing (rather than waiting for an exact floating point
      // time) works at 30/60/120 FPS and cannot replay a backlog after a hitch.
      return this.boss.phaseElapsedMs >= minimumMs && (crossed || Math.abs(sample.grid.beatFloat - beat) < 0.000001);
    }
    emitBossPulse() {
      this.boss.pulses.push({ id: ++this.boss.pulseSequence, originX: this.boss.x,
        radius: 0, previousRadius: 0, hit: false });
      window.renderer?.impact?.('boss');
      window.BARCODE?.stageFX?.event('boss', this.boss.x, { duration: 650 });
    }
    updateBossCombat(deltaTime) {
      if (!this.isBossCombatLive()) return;
      const boss = this.boss;
      const delta = Math.max(0, deltaTime);
      if (this.player.grounded) boss.stompArmed = true;
      boss.phaseElapsedMs += delta;
      boss.hitFlashMs = Math.max(0, boss.hitFlashMs - delta);
      boss.guardBounceMs = Math.max(0, (boss.guardBounceMs || 0) - delta);
      if (boss.phase === 'approach') {
        const dx = this.player.position.x - boss.x;
        boss.facing = dx < 0 ? -1 : 1;
        if (Math.abs(dx) > BOSS_COMBAT.approachRange) {
          const distance = Math.min(Math.abs(dx) - BOSS_COMBAT.approachRange, BOSS_COMBAT.approachSpeed * delta / 1000);
          boss.x = clampWorldX(boss.x + boss.facing * distance);
        } else this.setBossCombatPhase('telegraph');
      } else if (boss.phase === 'telegraph') {
        const duration = boss.latePhase ? BOSS_COMBAT.fastTelegraphMs : BOSS_COMBAT.telegraphMs;
        if (this.bossBoundaryReady(duration)) this.setBossCombatPhase('sweep');
      } else if (boss.phase === 'sweep') {
        if (boss.doublePulse && !boss.secondPulseEmitted && this.bossBoundaryReady(BOSS_COMBAT.secondPulseMs, 'secondPulseBeatWait')) {
          boss.secondPulseEmitted = true;
          boss.lastPulseAtMs = boss.phaseElapsedMs;
          this.emitBossPulse();
        }
        const duration = boss.doublePulse ? (boss.lastPulseAtMs || 0) + BOSS_COMBAT.sweepMs : BOSS_COMBAT.sweepMs;
        if ((!boss.doublePulse || boss.secondPulseEmitted) && this.bossBoundaryReady(duration)) this.setBossCombatPhase('recovery');
      } else if (boss.phase === 'recovery') {
        const duration = boss.latePhase ? BOSS_COMBAT.fastRecoveryMs : BOSS_COMBAT.recoveryMs;
        if (this.bossBoundaryReady(duration)) this.setBossCombatPhase('approach');
      }
      this.updateBossPulses(delta);
      boss.canDealDamage = boss.phase === 'sweep' || boss.pulses.some(pulse => !pulse.hit);
      this.updateBossSprite(delta);
    }
    updateBossPulses(deltaTime) {
      const boss = this.boss;
      const player = this.player;
      const footY = player.position.y + PLAYER_VISUAL_FOOT_OFFSET;
      const ground = GROUND_Y + PLAYER_VISUAL_FOOT_OFFSET;
      boss.pulses.forEach(pulse => {
        pulse.previousRadius = pulse.radius;
        pulse.radius += BOSS_COMBAT.pulseSpeed * deltaTime / 1000;
        if (pulse.hit || footY < ground - BOSS_COMBAT.pulseHeight || footY > ground + 24) return;
        const distance = Math.abs(player.position.x - pulse.originX);
        const halfWidth = BOSS_COMBAT.pulseWidth / 2 + 24;
        // Swept annulus contact prevents a low-frame-rate pulse tunneling
        // through the player. The two directions share one damage latch.
        if (distance + halfWidth < pulse.previousRadius || distance - halfWidth > pulse.radius) return;
        pulse.hit = true;
        if (player.isDamageInvulnerable?.()) return;
        if (window.hackingSystem?.absorbGuardHit?.()) return;
        player.takeDamage?.(1, { x: pulse.originX, y: player.position.y });
      });
      boss.pulses = boss.pulses.filter(pulse => pulse.radius < BOSS_COMBAT.pulseRange);
    }
    getBossHitbox() {
      if (!this.boss?.active) return null;
      // A stable hull in visible-foot space; breathing animation never moves
      // the collision plane away from the locked sprite's sidewalk contact.
      return { x: this.boss.x - BOSS_COMBAT.hitboxWidth / 2,
        y: this.boss.y + PLAYER_VISUAL_FOOT_OFFSET - BOSS_COMBAT.hitboxHeight,
        width: BOSS_COMBAT.hitboxWidth, height: BOSS_COMBAT.hitboxHeight };
    }
    getBossRhythmTarget(player = this.player, range = 300) {
      if (!this.isBossCombatLive() || window.hackingSystem?.isActive?.()) return null;
      return { inRange: !!(player?.position && Number.isFinite(range) && range > 0 &&
        Math.hypot(player.position.x - this.boss.x, player.position.y - this.boss.y) <= range),
        guarded: !this.boss.canReceiveDamage || this.boss.phase !== 'recovery', bounds: this.getBossHitbox() };
    }
    applyBossRhythmDamage({ player = this.player, judgment, sequence, range = 300 } = {}) {
      if (!this.isBossCombatLive()) return { ok: false, reason: 'boss-inactive' };
      if (window.hackingSystem?.isActive?.()) return { ok: false, reason: 'hacking-active' };
      if (!judgment?.available || !['perfect', 'excellent'].includes(judgment.timing)) return { ok: false, reason: 'offbeat' };
      const target = this.getBossRhythmTarget(player, range);
      if (!target?.inRange) return { ok: false, reason: 'out-of-range' };
      if (target.guarded) return { ok: false, reason: 'boss-guarded' };
      if (sequence === undefined || sequence === null || this.boss.hitSequences.has(sequence)) return { ok: false, reason: 'duplicate-attack' };
      this.boss.hitSequences.add(sequence);
      return this.damageBoss('rhythm');
    }
    applyBossStomp(player, movement = {}) {
      if (!this.isBossCombatLive() || player !== this.player || player.allowMovement === false ||
        window.hackingSystem?.isActive?.() || player.velocity.y <= 0) return false;
      const box = this.getBossHitbox();
      const previousFootY = movement.previousFootY + PLAYER_VISUAL_FOOT_OFFSET;
      const currentFootY = movement.currentFootY + PLAYER_VISUAL_FOOT_OFFSET;
      if (!Number.isFinite(previousFootY) || !Number.isFinite(currentFootY) ||
        previousFootY > box.y || currentFootY < box.y || currentFootY <= previousFootY) return false;
      const t = (box.y - previousFootY) / (currentFootY - previousFootY);
      const previousX = Number.isFinite(movement.previousX) ? movement.previousX : player.position.x;
      const crossingX = previousX + (player.position.x - previousX) * t;
      if (crossingX + 18 <= box.x || crossingX - 18 >= box.x + box.width) return false;
      const canCounter = this.canStompCounter();
      this.boss.stompArmed = false;
      player.position.y = box.y - PLAYER_VISUAL_FOOT_OFFSET;
      player.supportedSurfaceId = null;
      // Resolve ties using the incoming side; near a world edge, send the
      // player toward open space. A short impulse clears the head before air
      // control resumes. Another stomp counter requires landing on a surface.
      let direction = Math.sign(crossingX - this.boss.x) || -this.boss.facing || -1;
      if (this.boss.x < 260) direction = 1;
      if (this.boss.x > WORLD_WIDTH - 260) direction = -1;
      player.stompRebound?.(direction);
      if (window.audioSystem?.playCombatCue) window.audioSystem.playCombatCue(canCounter ? 'stomp' : 'guard');
      else window.audioSystem?.playSound?.(canCounter ? 'kick' : 'hihat');
      if (canCounter) {
        window.particleSystem?.stompEffect?.(crossingX, box.y, null, player.facing || 1);
        this.boss.stompCycle = this.boss.cycle;
        this.damageBoss('stomp');
      } else {
        window.particleSystem?.impact?.(crossingX, box.y, '#ffbd70', 8);
        this.boss.guardBounceMs = 700;
      }
      return true;
    }
    damageBoss(source) {
      if (!this.isBossCombatLive() || !this.boss.canReceiveDamage) return { ok: false, reason: 'boss-guarded' };
      this.boss.health = Math.max(0, this.boss.health - 1);
      this.boss.hitFlashMs = 160;
      window.renderer?.addScreenShake?.(2, 80);
      window.particleSystem?.impact?.(this.boss.x, this.boss.y - 70, '#00ffff', 16);
      window.objectivesSystem?.setBossCombatObjective?.(this.boss.health, this.boss.maxHealth);
      const target = { type: 'boss', damage: 1, x: this.boss.x, y: this.boss.y, source };
      if (this.boss.health === 0) this.completeLevel();
      return { ok: true, target, health: this.boss.health };
    }
    completeLevel() {
      if (this.boss?.defeated || this.state === STATES.LEVEL_COMPLETE || !this.boss) return false;
      this.boss.health = 0;
      this.boss.defeated = true;
      this.boss.canDealDamage = false;
      this.boss.canReceiveDamage = false;
      this.boss.pulses = [];
      this.boss.phase = 'defeated';
      window.renderer?.impact?.('victory');
      window.BARCODE?.stageFX?.event('victory', this.boss.x, { duration: 1400 });
      window.BARCODE?.combatFX?.contact('firewall', this.boss.x, this.boss.y, -1, true, true);
      this.boss.state = 'idle';
      this.setBossAnimation('sector_1_boss_idle_idle', true);
      this.state = STATES.LEVEL_COMPLETE;
      this.levelCompletionCount += 1;
      if (this.player?.velocity) { this.player.velocity.x = 0; this.player.velocity.y = 0; }
      if (this.player) this.player.controlsDisabled = true;
      window.hackingSystem?.reset?.();
      window.inputManager?.resetActionEdges?.();
      window.objectivesSystem?.completeLevelObjective?.();
      this.completion = { elapsedMs: 0, score: window.gameState?.score || 0,
        bestCombo: window.rhythmSystem?.runBestCombo || 0,
        fragments: window.lostDataSystem?.getProgress?.().collected || 0,
        totalFragments: window.lostDataSystem?.maxTotalLore || 3 };
      if (window.gameState) { window.gameState.victory = true; window.gameState.gameOver = false; window.gameState.running = false; }
      return true;
    }
    updateCompletionPresentation(deltaTime = 0) {
      if (!this.completion || this.state !== STATES.LEVEL_COMPLETE || !window.gameState?.victory || window.isPaused || window.gameState?.paused) return;
      const { holdMs, fadeMs, rowMs, staggerMs } = COMPLETION_PRESENTATION;
      this.completion.elapsedMs = Math.min(holdMs + fadeMs + rowMs + 2 * staggerMs,
        this.completion.elapsedMs + Math.max(0, Number(deltaTime) || 0));
    }
    getCompletionReveal() {
      const { holdMs, fadeMs } = COMPLETION_PRESENTATION;
      return Math.max(0, Math.min(1, ((this.completion?.elapsedMs || 0) - holdMs) / fadeMs));
    }
    getCompletionPresentation() {
      if (!this.completion) return null;
      const result = this.completion;
      const { holdMs, fadeMs, rowMs, staggerMs } = COMPLETION_PRESENTATION;
      // Give every row its full count-up after the final-hit hold and card fade.
      const visibleMs = result.elapsedMs - holdMs - fadeMs;
      return ['score', 'bestCombo', 'fragments'].map((key, index) => {
        const progress = Math.max(0, Math.min(1, (visibleMs - index * staggerMs) / rowMs));
        return { key, value: Math.round(result[key] * (1 - Math.pow(1 - progress, 3))), finalValue: result[key], progress,
          total: key === 'fragments' ? result.totalFragments : null };
      });
    }
    canRetryBossCheckpoint() {
      const runtimeState = window.BARCODE?.RuntimeLifecycle?.getState?.();
      return !!(this.bossCheckpoint && this.boss && (window.gameState?.gameOver || window.gameState?.victory) &&
        (!runtimeState || runtimeState === 'running') && !window.isPaused && !window.gameState?.paused);
    }
    retryBossCheckpoint() {
      if (!this.canRetryBossCheckpoint()) return { ok: false, reason: 'checkpoint-unavailable' };
      const checkpoint = this.bossCheckpoint;
      this.completion = null;
      const player = this.player;
      if (!player) return { ok: false, reason: 'player-unavailable' };
      window.hackingSystem?.reset?.();
      window.enemyManager?.clear?.({ preserveDefeats: true });
      window.cancelInitialEnemySpawn?.();
      window.BARCODE?.playerCombat?.reset?.();
      window.inputManager?.resetActionEdges?.();
      // Reset feedback only. Do not stop, seek, or restart the music transport.
      window.rhythmSystem?.hideRhythmMode?.();
      window.rhythmSystem?.restart?.();
      Object.assign(player.position, { x: checkpoint.playerX, y: GROUND_Y });
      window.renderer?.resetFollowCamera?.(checkpoint.playerX);
      Object.assign(player.velocity, { x: 0, y: 0 });
      Object.assign(player, { health: player.maxHealth, grounded: true, controlsDisabled: false,
        allowMovement: true, isEntering: false, supportedSurfaceId: null,
        invulnerable: false, invulnerableUntil: 0, _enemyInvulnerableUntilMs: 0,
        primaryAttackAnimationMs: 0, afterimageMs: 0, coyoteTimerMs: 0, jumpBufferTimerMs: 0,
        jumpHeldMs: 0, jumpReleaseQueued: false, airInput: 0 });
      this.boss.x = checkpoint.bossX;
      this.boss.y = GROUND_Y;
      this.cinematicZoomOverride = null;
      this.cameraOverrideActive = false;
      this.frozenPlayerPosition = null;
      window.renderer?.clearCinematicZoomOverride?.();
      if (window.BARCODE) window.BARCODE.signalAmpCharges = checkpoint.signalAmpCharges;
      Object.assign(window.gameState, { running: true, gameOver: false, victory: false,
        paused: false, score: checkpoint.score, collectionMessage: null, lorePendingMessage: null });
      this.enterBossReady();
      return { ok: true, state: this.state };
    }
    getBossStatus() {
      const boss = this.boss;
      if (!boss) return null;
      return { phase: boss.phase || 'intro', phaseElapsedMs: boss.phaseElapsedMs || 0,
        health: boss.health ?? BOSS_COMBAT.maxHealth, maxHealth: boss.maxHealth || BOSS_COMBAT.maxHealth,
        cycle: boss.cycle || 0, doublePulse: !!boss.doublePulse, latePhase: !!boss.latePhase,
        stompArmed: !!boss.stompArmed, canStompCounter: this.canStompCounter(), defeated: !!boss.defeated,
        canDealDamage: !!boss.canDealDamage, canReceiveDamage: !!boss.canReceiveDamage,
        pulses: (boss.pulses || []).map(pulse => ({ ...pulse })), hitbox: this.getBossHitbox(),
        checkpointAvailable: !!this.bossCheckpoint, retryAvailable: this.canRetryBossCheckpoint() };
    }
    canStompCounter() { return !!(this.boss?.canReceiveDamage && this.boss.stompArmed && this.boss.stompCycle !== this.boss.cycle); }
    draw(ctx) { this.drawStageSurfaces(ctx); this.drawRepairRoute(ctx); this.drawEncounterGates(ctx); this.drawBoss(ctx); }
    drawStageSurfaces(ctx) { if (!ctx) return; this.drawSignalLift(ctx); this.drawSignalAmp(ctx); ctx.save(); STAGE_SURFACES.forEach(g => { ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 8; ctx.fillStyle = 'rgba(0,255,255,0.34)'; ctx.fillRect(g.x, g.y - 2, g.w, g.h); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(0,255,255,0.92)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + g.w, g.y); ctx.stroke(); }); ctx.restore(); }
    drawSignalLift(ctx) {
      if (!ctx || !this.signalLift || !this.isSignalLiftAvailable()) return;
      const lift = this.signalLift;
      const charged = lift.charges >= SIGNAL_LIFT.requiredCharges;
      const pulse = 0.72 + Math.sin((window.gameState?.gameTime || 0) / 150) * 0.12;
      ctx.save();
      // Rails make the platform read as a deliberate street elevator instead
      // of an unexplained floating collision bar.
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.42)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lift.x + 18, SIGNAL_LIFT.topY);
      ctx.lineTo(lift.x + 18, SIGNAL_LIFT.bottomY);
      ctx.moveTo(lift.x + lift.w - 18, SIGNAL_LIFT.topY);
      ctx.lineTo(lift.x + lift.w - 18, SIGNAL_LIFT.bottomY);
      ctx.stroke();
      ctx.shadowColor = charged ? '#ff00ff' : '#00ffff';
      ctx.shadowBlur = charged ? 18 : 10;
      ctx.fillStyle = charged ? `rgba(255, 0, 255, ${pulse})` : 'rgba(0, 24, 38, 0.94)';
      // lift.y is the authoritative contact line. Render the platform body
      // below it so the player's visible feet meet the top instead of sinking
      // into a graphic whose collision lived near its bottom edge.
      ctx.fillRect(lift.x, lift.y, lift.w, 14);
      ctx.strokeStyle = charged ? '#ffffff' : '#00ffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(lift.x, lift.y, lift.w, 14);
      ctx.shadowBlur = 0;
      for (let index = 0; index < SIGNAL_LIFT.requiredCharges; index += 1) {
        ctx.fillStyle = index < lift.charges ? '#ff00ff' : '#15394b';
        ctx.fillRect(lift.x + 10 + index * 15, lift.y + 4, 9, 5);
      }
      ctx.fillStyle = '#a8ffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('RHYTHM LIFT', lift.x + lift.w - 8, lift.y + 7);
      if (lift.chargeFxMs > 0) {
        const progress = 1 - lift.chargeFxMs / 520;
        const center = lift.x + lift.w / 2;
        ctx.strokeStyle = `rgba(124, 255, 226, ${1 - progress})`; ctx.lineWidth = 3;
        for (const side of [-1, 1]) {
          const startX = center + side * (16 + (1 - progress) * 65);
          ctx.beginPath(); ctx.moveTo(startX, lift.y - (1 - progress) * 80);
          ctx.lineTo(center + side * 12, lift.y + 7); ctx.stroke();
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * (1 - progress)})`;
        ctx.fillRect(lift.x, lift.y, lift.w, 14);
      }
      if (Math.abs((this.player?.position?.x ?? Infinity) - (lift.x + lift.w / 2)) < 220 && lift.y === SIGNAL_LIFT.bottomY) {
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`R + DOWN ON BEAT: POWER LIFT ${lift.charges}/${SIGNAL_LIFT.requiredCharges}`, lift.x + lift.w / 2, lift.y - 32);
      }
      ctx.restore();
    }
    drawSignalAmp(ctx) {
      if (!ctx || this.signalAmpCollected) return;
      const fx = window.BARCODE?.combatFX;
      if (fx && !fx.visible(SIGNAL_AMP.x, SIGNAL_AMP.y, 90)) return;
      const bob = Math.sin((fx?.timeMs || 0) / 280) * 4;
      ctx.save();
      ctx.fillStyle = 'rgba(213,127,255,0.16)';
      ctx.beginPath(); ctx.ellipse(SIGNAL_AMP.x, SIGNAL_AMP.y + 40, 36, 6, 0, 0, Math.PI * 2); ctx.fill();
      if (fx) fx.drawAmpIcon(ctx, SIGNAL_AMP.x, SIGNAL_AMP.y + bob);
      else { ctx.strokeStyle = '#efa0ff'; ctx.lineWidth = 3; ctx.strokeRect(SIGNAL_AMP.x - 22, SIGNAL_AMP.y - 22, 44, 44); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#0a1526'; ctx.fillRect(SIGNAL_AMP.x - 65, SIGNAL_AMP.y - 55, 130, 20);
      ctx.fillStyle = '#f4c1ff'; ctx.fillText('SIGNAL AMP', SIGNAL_AMP.x, SIGNAL_AMP.y - 45);
      if (Math.abs((this.player?.position.x ?? Infinity) - SIGNAL_AMP.x) < 230) {
        ctx.font = '12px monospace'; ctx.fillStyle = 'rgba(10,21,38,0.94)';
        ctx.fillRect(SIGNAL_AMP.x - 122, SIGNAL_AMP.y - 98, 244, 37);
        ctx.fillStyle = '#ffffff'; ctx.fillText('TOUCH TO COLLECT', SIGNAL_AMP.x, SIGNAL_AMP.y - 87);
        ctx.fillStyle = '#e9bfff'; ctx.fillText('3 RHYTHM HITS: LONGER REACH', SIGNAL_AMP.x, SIGNAL_AMP.y - 71);
      }
      ctx.restore();
    }
    getGatePresentation() {
      const closed = this.getCurrentGate();
      const time = this.districtSignal.elapsedMs;
      return ENCOUNTER_GATES.flatMap((gate, index) => {
        if (gate === closed) return [{ gate, progress: 0, opening: false }];
        const clearedAt = this.districtSignal.clearedAtMs[index];
        const age = clearedAt === null ? Infinity : Math.max(0, time - clearedAt);
        return age < 650 ? [{ gate, progress: age / 650, opening: true }] : [];
      });
    }
    touchBarrier(gate, y, kind) {
      const now = this.barrierContactClock || 0;
      this.barrierContacts = this.barrierContacts || [];
      const prior = this.barrierContacts.find(c => c.id === gate.id && c.kind === kind && now - c.started < 140);
      if (prior) return;
      this.barrierContacts.push({ id:gate.id, x:gate.x+gate.w/2, y, kind, started:now });
      if (this.barrierContacts.length > 12) this.barrierContacts.shift();
    }
    updateBarrierContacts(delta) {
      this.barrierContactClock = (this.barrierContactClock || 0) + Math.max(0, delta);
      this.barrierContacts = (this.barrierContacts || []).filter(c => this.barrierContactClock - c.started < 620);
      for (const { gate, opening } of this.getGatePresentation()) {
        if (opening) continue;
        for (const enemy of window.enemyManager?.enemies || []) {
          if (!enemy.active || !Number.isFinite(enemy._barrierPreviousX)) continue;
          if ((enemy._barrierPreviousX - gate.x) * (enemy.position.x - gate.x) <= 0 && enemy.position.x !== enemy._barrierPreviousX)
            this.touchBarrier(gate, enemy.getHitbox().y + enemy.getHitbox().height / 2, 'cross');
        }
      }
    }
    drawBarrierHardware(ctx, gate, power) {
      const x = gate.x + gate.w + gate.depthX, bottom = gate.y + gate.h + gate.depthY;
      // Short, weathered facade conduit and bolted emitters terminate on the
      // building. The light field can extend above the physical roof hardware.
      const bounds=this.getVisibleWorldBounds(); if(x<bounds.left-80||x>bounds.right+80)return;
      const top=gate.mountTop;
      ctx.fillStyle='#0a121c';ctx.fillRect(x-8,top,16,bottom-top+8);
      ctx.fillStyle='#445360';ctx.fillRect(x-5,top+3,10,bottom-top);
      ctx.fillStyle='#7a858b';ctx.fillRect(x-5,top+3,2,bottom-top);
      for(let y=bottom-54;y>top;y-=265){
        ctx.fillStyle='rgba(0,0,0,0.38)';ctx.fillRect(x-23,y-20,53,55);
        ctx.fillStyle='#101926';ctx.fillRect(x-24,y-25,48,52);
        ctx.fillStyle='#52616f';ctx.fillRect(x-21,y-22,42,46);
        ctx.fillStyle='#253341';ctx.fillRect(x-17,y-18,34,36);
        ctx.strokeStyle='#889098';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-19,y+20);ctx.lineTo(x-19,y-20);ctx.lineTo(x+18,y-20);ctx.stroke();
        ctx.fillStyle='#121c27';for(let i=0;i<3;i++)ctx.fillRect(x-13,y+7+i*4,26,2);
        ctx.fillStyle=power>0?`rgba(217,152,238,${0.3+power*0.65})`:'#354451';
        ctx.beginPath();ctx.arc(x,y-5,9,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=power>0?'#f0d1fd':'#516170';ctx.fillRect(x-2,y-11,4,12);
        ctx.fillStyle='#a3a3a0';for(const dx of [-19,19])for(const dy of [-19,21])ctx.fillRect(x+dx-1,y+dy-1,2,2);
        ctx.strokeStyle='#23323e';ctx.beginPath();ctx.moveTo(x+9,y-18);ctx.lineTo(x+16,y-14);ctx.moveTo(x-17,y+4);ctx.lineTo(x-13,y+2);ctx.stroke();
      }
      const y = gate.y + gate.h, dx=30, dy=-14;
      for (const bx of [gate.x-7,gate.x+gate.w-13]) {
        ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(bx-10,y-2,58,9);
        ctx.fillStyle='#18232c';ctx.fillRect(bx,y-14,26,16);
        ctx.fillStyle='#768687';ctx.beginPath();ctx.moveTo(bx,y-14);ctx.lineTo(bx+dx,y-14+dy);ctx.lineTo(bx+26+dx,y-14+dy);ctx.lineTo(bx+26,y-14);ctx.closePath();ctx.fill();
        ctx.fillStyle=power>0?'#b9d9ee':'#31414b';ctx.fillRect(bx+5,y-12,16,4);
      }
    }
    drawBarrierStress(ctx, gate) {
      ctx.save();
      for (const c of this.barrierContacts || []) {
        if (c.id !== gate.id) continue;
        const t = (this.barrierContactClock-c.started)/620;
        ctx.strokeStyle=c.kind==='cross'?`rgba(136,255,229,${1-t})`:`rgba(240,201,255,${1-t})`;ctx.lineWidth=2;
        const rx=12+t*56,ry=18+t*72;
        ctx.beginPath();ctx.ellipse(c.x,c.y,rx,ry,-0.38,0,Math.PI*2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(c.x-rx,c.y);ctx.quadraticCurveTo(c.x+rx*(c.kind==='cross'?0.8:0.45),c.y-ry*0.5,c.x+rx,c.y);ctx.stroke();
        if (c.kind==='cross') { ctx.beginPath();ctx.moveTo(c.x,c.y-ry);ctx.lineTo(c.x,c.y+ry);ctx.stroke(); }
      }
      ctx.restore();
    }
    drawEncounterGates(ctx) {
      if (!ctx) return;
      for (const gate of ENCOUNTER_GATES) if (!this.getGatePresentation().some(g => g.gate.id === gate.id)) this.drawBarrierHardware(ctx, gate, 0);
      const fx = window.BARCODE?.combatFX;
      const time = fx?.timeMs ?? this.districtSignal.elapsedMs;
      const animate = window.BARCODE_RENDER_QUALITY?.flashes !== false;
      for (const { gate, progress, opening } of this.getGatePresentation()) {
        const fade = 1 - progress;
        const height = gate.h * fade * fade;
        const top = gate.y + gate.h - height;
        const groundY = gate.y + gate.h;
        // The live road overlays the painted curb at y=890. Follow its visible
        // lip, then continue beyond the road's y=1080 edge without a front gap.
        // Project along the existing slab's depth, not straight down its pole.
        const curbTop = 888, curbBottom = 892, streetBottom = 1096;
        const curbDrop = curbBottom - curbTop;
        const projectX = rise => gate.x + gate.w - rise * 112 / 54;
        const nearX = projectX(streetBottom - groundY - curbDrop) - gate.w;
        const footprint = [
          [gate.x + gate.w + gate.depthX, groundY + gate.depthY, 0],
          [gate.x + gate.w, groundY, 0],
          [projectX(curbTop - groundY), curbTop, 0],
          [projectX(curbTop - groundY), curbBottom, curbDrop],
          [nearX + gate.w, streetBottom, curbDrop]
        ];
        const crown = footprint.map(([x, y, drop]) => [x, y - (gate.h + drop) * fade * fade]);
        const farX = footprint[0][0], farTop = crown[0][1];
        if (fx && !fx.visible((nearX + farX) / 2, (farTop + streetBottom) / 2,
          Math.max(farX - nearX, streetBottom - farTop) / 2 + 60)) continue;
        this.drawBarrierHardware(ctx, gate, fade);
        ctx.save(); ctx.globalAlpha = fade;
        // One continuous wall face spans the buildings, raised sidewalk,
        // vertical curb and lower road. Its opening sinks into that footprint.
        ctx.fillStyle = opening ? 'rgba(98,255,221,0.08)' : 'rgba(174,66,215,0.04)';
        ctx.beginPath(); crown.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        footprint.slice().reverse().forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.closePath(); ctx.fill();
        // A narrow top and near end retain the slab's visible thickness.
        ctx.fillStyle = opening ? 'rgba(98,255,221,0.14)' : 'rgba(219,128,246,0.07)';
        ctx.beginPath();
        crown.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        crown.slice().reverse().forEach(([x, y]) => ctx.lineTo(x - gate.w, y));
        ctx.closePath(); ctx.fill();
        const nearTop = crown[crown.length - 1][1];
        ctx.fillRect(nearX, nearTop, gate.w, streetBottom - nearTop);
        ctx.fillStyle = opening ? 'rgba(98,255,221,0.1)' : 'rgba(174,66,215,0.04)';
        ctx.fillRect(gate.x, top, gate.w, height);
        const flicker = animate ? 0.06 * Math.sin(time / 83) * Math.sin(time / 127) : 0;
        ctx.fillStyle = `rgba(${opening ? '137,255,224' : '232,129,255'},${0.18 + flicker})`;
        for (let bar = 0; bar < 7; bar++) {
          const left = gate.x + 3 + bar * 4;
          ctx.fillRect(left, top, bar % 3 ? 1.5 : 3, height);
        }
        ctx.fillStyle = '#a6ffe8'; ctx.fillRect(gate.x - 1, top, 2, height); ctx.fillRect(gate.x + gate.w - 1, top, 2, height);
        ctx.strokeStyle = opening ? '#c9fff1' : 'rgba(237,166,255,0.45)';
        ctx.lineWidth = 3;
        for (const edge of [crown, footprint]) {
          ctx.beginPath(); edge.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
          const end = edge[edge.length - 1]; ctx.lineTo(end[0] - gate.w, end[1]); ctx.stroke();
        }
        ctx.beginPath(); ctx.moveTo(nearX, nearTop); ctx.lineTo(nearX, streetBottom); ctx.stroke();
        // The second ground rail and lit curb face make the raised paving read.
        ctx.beginPath(); footprint.forEach(([x, y], i) => i ? ctx.lineTo(x - gate.w, y) : ctx.moveTo(x - gate.w, y)); ctx.stroke();
        ctx.fillStyle = opening ? 'rgba(137,255,224,0.22)' : 'rgba(232,129,255,0.22)';
        ctx.fillRect(footprint[2][0] - gate.w, curbTop, gate.w, curbDrop);
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(farX, footprint[0][1]); ctx.lineTo(farX, farTop); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(nearX + gate.w, nearTop); ctx.lineTo(nearX + gate.w, streetBottom); ctx.stroke();
        for (let lane = 1; lane < 5; lane++) {
          const laneT = lane / 5;
          ctx.beginPath();
          footprint.forEach(([x, y], i) => {
            const laneY = crown[i][1] + (y - crown[i][1]) * laneT;
            if (i) ctx.lineTo(x, laneY); else ctx.moveTo(x, laneY);
          });
          ctx.stroke();
        }
        ctx.fillStyle = opening ? '#c9fff1' : '#eda6ff';
        const scanY = top + (animate ? (time / 850) % 1 : 0.5) * Math.max(0, height - 3);
        ctx.fillRect(gate.x - 3, scanY, gate.w + 6, 3);
        this.drawBarrierStress(ctx, gate);
        if (opening) {
          // Dissolve the barcode outward as its field contracts to the base.
          for (let i = 0; i < 10; i++) {
            const side = i % 2 ? 1 : -1;
            ctx.fillRect(gate.x + gate.w / 2 + side * progress * (20 + i * 4), top - progress * (i % 3) * 18, i % 3 ? 2 : 4, 9 * fade);
          }
        }
        ctx.restore();
      }
    }
    updateSignalAmp() {
      const player = this.player || window.player;
      if (!player || this.signalAmpCollected || this.isGameplaySuppressed() || window.tutorialSystem?.isActive?.()) return;
      const box = player.getHitbox?.();
      // The Amp floats above the relay roof. Test the visible body, while
      // preserving roof access: it cannot be collected through the underside.
      if (!box || player.position.y + PLAYER_VISUAL_FOOT_OFFSET > 202) return;
      const x = Math.max(box.x, Math.min(SIGNAL_AMP.x, box.x + box.width));
      const y = Math.max(box.y, Math.min(SIGNAL_AMP.y, box.y + box.height));
      if (Math.hypot(x - SIGNAL_AMP.x, y - SIGNAL_AMP.y) <= SIGNAL_AMP.radius) this.giveSignalAmp();
    }

    resetRepairs() {
      this.repairs = REPAIRS.map(r => ({ ...r, collected: false }));
      this.repairTimeMs = 0; this.repairFeedback = null;
    }
    dropCarrierRepair(enemy) {
      if (!this.missionStarted || !enemy?._repairCarrier || enemy._repairDropped || enemy._purgedByCinematic || enemy.active || !(enemy.health <= 0)) return false;
      enemy._repairDropped = true;
      if (this.repairs.some(r => r.id === 'repair.cache-carrier')) return false;
      this.repairs.push({ id: 'repair.cache-carrier', x: Math.max(80, Math.min(WORLD_WIDTH - 80, enemy.position.x)),
        y: GROUND_Y + PLAYER_VISUAL_FOOT_OFFSET - 42, surfaceY: GROUND_Y + PLAYER_VISUAL_FOOT_OFFSET, collected: false });
      return true;
    }
    updateRepairs(ms) {
      if (!this.missionStarted || this.isGameplaySuppressed() || window.tutorialSystem?.isActive?.() || this.isBossCombatLive?.()) return;
      this.repairTimeMs += ms;
      if (this.repairFeedback) {
        this.repairFeedback.age += ms;
        if (this.repairFeedback.age >= 900) this.repairFeedback = null;
      }
      const player = this.player || window.player, box = player?.getHitbox?.();
      if (!box || player.health <= 0 || player.health >= player.maxHealth || window.hackingSystem?.isActive?.()) return;
      for (const cell of this.repairs) {
        if (cell.collected || player.position.y + PLAYER_VISUAL_FOOT_OFFSET > cell.surfaceY + 12) continue;
        const x = Math.max(box.x, Math.min(cell.x, box.x + box.width));
        const y = Math.max(box.y, Math.min(cell.y, box.y + box.height));
        if (Math.hypot(x - cell.x, y - cell.y) > 24) continue;
        const oldHealth = player.health;
        try { player.restoreHealth(1); } catch (error) { console.warn('Repair feedback unavailable', error); }
        // Commit the pickup according to the actual health transaction even
        // if an optional sound/particle callback fails after health changes.
        if (player.health > oldHealth) {
          cell.collected = true;
          this.repairFeedback = { x: cell.x, y: cell.y, age: 0 };
          if (player.health >= player.maxHealth) break;
        }
      }
    }
    drawRepairRoute(ctx) {
      if (!ctx || !this.missionStarted) return;
      ctx.save(); ctx.shadowBlur = 0;
      for (const prop of TRAVERSAL_PROPS.concat(UPPER_SURFACES)) {
        if (prop.roof) {
          ctx.fillStyle='#1b2733';ctx.fillRect(prop.x,prop.y,prop.w,8);
          ctx.fillStyle='#7b8b94';ctx.fillRect(prop.x+3,prop.y,prop.w-6,2);
          ctx.fillStyle='#354352';for(let x=prop.x+20;x<prop.x+prop.w-8;x+=67)ctx.fillRect(x,prop.y+3,18,2);
          continue;
        }
        const depthX = prop.h > 30 ? 38 : 22, depthY = -depthX * 54 / 112;
        const face = (points, color) => { ctx.fillStyle = color; ctx.strokeStyle = '#0b1017'; ctx.lineWidth = 3; ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill(); ctx.stroke(); };
        face([[prop.x,prop.y+prop.h],[prop.x+prop.w,prop.y+prop.h],[prop.x+prop.w+depthX+15,prop.y+prop.h+depthY+8],[prop.x+depthX,prop.y+prop.h+depthY]], 'rgba(0,0,0,0.4)');
        face([[prop.x+prop.w,prop.y],[prop.x+prop.w+depthX,prop.y+depthY],[prop.x+prop.w+depthX,prop.y+prop.h+depthY],[prop.x+prop.w,prop.y+prop.h]], '#18282f');
        face([[prop.x,prop.y],[prop.x+depthX,prop.y+depthY],[prop.x+prop.w+depthX,prop.y+depthY],[prop.x+prop.w,prop.y]], '#63797a');
        ctx.strokeStyle = '#8aa2a0'; ctx.lineWidth = 1;
        for (let x = prop.x + 22; x < prop.x + prop.w; x += 32) { ctx.beginPath(); ctx.moveTo(x,prop.y-2); ctx.lineTo(x+depthX-3,prop.y+depthY+3); ctx.stroke(); }
        ctx.fillStyle = '#0b1017'; ctx.fillRect(prop.x - 3, prop.y, prop.w + 6, prop.h);
        ctx.fillStyle = '#334046'; ctx.fillRect(prop.x + 4, prop.y + 6, prop.w - 8, prop.h - 6);
        ctx.fillStyle = '#172129'; ctx.fillRect(prop.x + prop.w - 12, prop.y + 5, 12, prop.h - 5);
        ctx.fillStyle = '#58686b'; ctx.fillRect(prop.x + 4, prop.y + 5, 4, prop.h - 9);
        ctx.strokeStyle = '#82938e'; ctx.lineWidth = 2; ctx.strokeRect(prop.x, prop.y, prop.w, prop.h);
        ctx.fillStyle = '#92a2a9'; ctx.fillRect(prop.x, prop.y - 2, prop.w, 3);
        ctx.fillStyle = '#90b6bb';
        for (let x = prop.x + 10; x < prop.x + prop.w - 6; x += 24) ctx.fillRect(x, prop.y + 7, 11, 3);
        if (prop.h > 30) {
          ctx.fillStyle = '#172129';
          for (let y = prop.y + 24; y < prop.y + prop.h - 12; y += 18) ctx.fillRect(prop.x + 16, y, prop.w - 32, 7);
          ctx.fillStyle = '#82938e';
          for (const x of [prop.x + 8, prop.x + prop.w - 8]) for (const y of [prop.y + 15, prop.y + prop.h - 10]) ctx.fillRect(x - 2, y - 2, 4, 4);
        } else {
          ctx.strokeStyle = '#7e9292'; ctx.lineWidth = 5;
          for (const x of [prop.x + 16, prop.x + prop.w - 16]) { ctx.beginPath(); ctx.moveTo(x, prop.y + 14); ctx.lineTo(x + 15, prop.y + 52); ctx.lineTo(x + 15, prop.y + 14); ctx.stroke(); }
        }
      }
      if (!this.isBossCinematicActive() && !this.isBossCombatLive?.() && this.state !== STATES.LEVEL_COMPLETE) {
        for (const cell of this.repairs) {
          if (cell.collected) continue;
          ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(cell.x - 20, cell.surfaceY - 2, 40, 4);
          drawRepairCell(ctx, cell.x, cell.y + Math.sin(this.repairTimeMs / 480 + cell.x) * 3, 1 + (window.BARCODE_RENDER_QUALITY?.flashes === false ? 0 : Math.max(0, Math.sin(this.repairTimeMs / 180)) * 0.04));

        }
      }
      if (this.repairFeedback) {
        const f = this.repairFeedback, t = f.age / 900;
        ctx.globalAlpha = 1 - t; ctx.fillStyle = '#c0ed55'; ctx.font = 'bold 23px Oxanium, monospace'; ctx.textAlign = 'center';
        drawRepairCell(ctx, f.x, f.y - 30 - t * 45, 0.55);
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.fillRect(f.x + Math.cos(a) * t * 66, f.y + Math.sin(a) * t * 46, 3, 9); }
      }
      ctx.restore();
    }
    giveSignalAmp() {
      this.signalAmpCollected = true;
      window.BARCODE = window.BARCODE || {};
      window.BARCODE.signalAmpCharges = SIGNAL_AMP.charges;
      window.BARCODE.combatFX?.ampChanged('pickup', SIGNAL_AMP.charges, this.player || window.player);
      if (window.audioSystem?.playCombatCue) window.audioSystem.playCombatCue('pickup');
      else window.audioSystem?.playSound?.('rhythmSuccess', 0.35);
      return { ok:true, charges: window.BARCODE.signalAmpCharges };
    }
    isSignalLiftAvailable() { return !!(this.missionStarted && this.state !== STATES.TUTORIAL); }
    isPlayerSupportedByLift(player = this.player || window.player) {
      if (!this.isSignalLiftAvailable() || !player || !this.signalLift || !player.grounded || player.supportedSurfaceId !== SIGNAL_LIFT.id) return false;
      const footY = player.position.y + PLAYER_VISUAL_FOOT_OFFSET;
      const footHalfWidth = 18;
      return player.position.x + footHalfWidth > this.signalLift.x &&
        player.position.x - footHalfWidth < this.signalLift.x + this.signalLift.w &&
        Math.abs(footY - this.signalLift.y) <= 4;
    }
    updateSignalLift(deltaTime = 0) {
      if (!this.signalLift) this.resetSignalLift();
      const lift = this.signalLift;
      lift.chargeFxMs = Math.max(0, (lift.chargeFxMs || 0) - deltaTime);
      lift.prevY = lift.y;
      const player = this.player || window.player;
      if (!this.isSignalLiftAvailable()) {
        if (player?.supportedSurfaceId === SIGNAL_LIFT.id) player.supportedSurfaceId = null;
        return;
      }
      if (this.isGameplaySuppressed()) return;
      let supported = this.isPlayerSupportedByLift(player);
      if (player?.supportedSurfaceId === SIGNAL_LIFT.id && !supported) player.supportedSurfaceId = null;
      if (lift.state === 'charged') lift.state = 'moving';
      if (lift.state === 'moving') lift.y = Math.max(SIGNAL_LIFT.topY, lift.y - SIGNAL_LIFT.speed * deltaTime / 1000);
      else if (lift.state === 'returning') lift.y = Math.min(SIGNAL_LIFT.bottomY, lift.y + SIGNAL_LIFT.speed * deltaTime / 1000);
      if (lift.state === 'moving' && lift.y <= SIGNAL_LIFT.topY) lift.state = 'dormant';
      if (lift.state === 'returning' && lift.y >= SIGNAL_LIFT.bottomY) {
        lift.state = 'dormant';
        lift.charges = 0;
      }
      if (!supported && lift.y <= SIGNAL_LIFT.topY + 1) {
        lift.returnTimerMs = (lift.returnTimerMs || SIGNAL_LIFT.returnDelayMs) - deltaTime;
        if (lift.returnTimerMs <= 0) lift.state = 'returning';
      } else {
        lift.returnTimerMs = SIGNAL_LIFT.returnDelayMs;
      }
      const dy = lift.y - lift.prevY;
      if (supported && dy && player) player.position.y += dy;
    }
    resetSignalLift() {
      this.signalLift = { ...SIGNAL_LIFT, y: SIGNAL_LIFT.bottomY, prevY: SIGNAL_LIFT.bottomY, state: 'dormant', charges: 0, chargeFxMs: 0, returnTimerMs: SIGNAL_LIFT.returnDelayMs };
      const player = this.player || window.player;
      if (player?.supportedSurfaceId === SIGNAL_LIFT.id) player.supportedSurfaceId = null;
    }
    chargeSignalLift() {
      if (!this.signalLift) this.resetSignalLift();
      if (!this.isSignalLiftAvailable()) return { ok: false, reason: 'unavailable' };
      const player = this.player || window.player;
      if (!this.isPlayerSupportedByLift(player)) return { ok: false, reason: 'not-supported' };
      this.signalLift.chargeFxMs = 520;
      this.signalLift.charges = Math.min(SIGNAL_LIFT.requiredCharges, this.signalLift.charges + 1);
      this.signalLift.state = this.signalLift.charges >= SIGNAL_LIFT.requiredCharges ? 'charged' : 'charging';
      return { ok: true, charges: this.signalLift.charges, state: this.signalLift.state };
    }
    getBossPresentationKey() { if (this.boss?.state === 'idle' || this.boss?.activeAnimation === 'sector_1_boss_idle_idle') return 'idle'; if (this.boss?.state === 'flourish' || this.boss?.activeAnimation === 'sector_1_boss_attack_attack') return 'flourish'; return 'walk'; }
    getBossRuntimeAnchorMetrics(frame, flipH = true) {
      const spriteSheet = this.boss?.sprite?.currentSprite || this.boss?.sprite?._currentSprite || null;
      const runtimeAnchor = spriteSheet?.getAnchorPoint?.();
      const hasAnchorX = Number.isFinite(runtimeAnchor?.x);
      const hasAnchorY = Number.isFinite(runtimeAnchor?.y);
      const sourceAnchorX = hasAnchorX ? runtimeAnchor.x : frame.anchorX;
      const sourceAnchorY = hasAnchorY ? runtimeAnchor.y : frame.anchorY;
      const usesScaledAnchor = !spriteSheet || ((hasAnchorX || hasAnchorY) &&
        (typeof spriteSheet.hasManifestAnchor === 'function' ? !!spriteSheet.hasManifestAnchor() : !!spriteSheet.manifestMetadata?.anchor));
      const reportedScale = spriteSheet?.getManifestScale?.() ?? spriteSheet?.manifestMetadata?.scale;
      const manifestScale = Number.isFinite(reportedScale) && reportedScale > 0 ? reportedScale : 1;
      const frameScale = BOSS_PRESENTATION.targetBodyHeight / frame.bodyHeight * (frame.visualScale || 1);
      // The sheet scale is already multiplied inside Makko: cancel it here.
      const drawScale = frameScale / manifestScale;
      const anchorMultiplier = usesScaledAnchor ? frameScale : 1;
      const anchorOffsetX = hasAnchorX || !spriteSheet ? sourceAnchorX * anchorMultiplier : 0;
      const anchorOffsetY = hasAnchorY || !spriteSheet ? sourceAnchorY * anchorMultiplier : 0;
      return { sourceAnchorX, sourceAnchorY, usesScaledAnchor, manifestScale, frameScale,
        drawScale, anchorOffsetX, anchorOffsetY, flipSignX: flipH ? -1 : 1 };
    }
    getBossVisualBounds(options = {}) {
      if (!this.boss) return null;
      const frame = BOSS_PRESENTATION[this.getBossPresentationKey()];
      const rawFrame = Number.isFinite(this.boss.animationRef?.currentFrame) ? this.boss.animationRef.currentFrame : 0;
      const frameIndex = Math.max(0, Math.trunc(rawFrame)) % frame.footRows.length;
      const footRow = frame.footRows[frameIndex];
      const targetFootY = this.boss.y + PLAYER_VISUAL_FOOT_OFFSET;
      const flipH = options.flipH ?? (this.boss.facing === undefined || this.boss.facing < 0);
      const metrics = this.getBossRuntimeAnchorMetrics(frame, flipH);
      // Invert both Makko anchor paths, including their mirrored X offset.
      const anchorX = this.boss.x + metrics.flipSignX * (metrics.anchorOffsetX - frame.anchorX * metrics.frameScale);
      const anchorY = targetFootY + metrics.anchorOffsetY - footRow * metrics.frameScale;
      return { x: this.boss.x - (flipH ? frame.width - frame.anchorX : frame.anchorX) * metrics.frameScale,
        y: targetFootY - footRow * metrics.frameScale,
        width: frame.width * metrics.frameScale, height: frame.height * metrics.frameScale,
        scale: metrics.drawScale, frameScale: metrics.frameScale, manifestScale: metrics.manifestScale,
        usesScaledAnchor: metrics.usesScaledAnchor, sourceAnchorX: metrics.sourceAnchorX, sourceAnchorY: metrics.sourceAnchorY,
        anchorX, anchorY, frameIndex, footRow, targetFootY,
        visibleFootY: anchorY - metrics.anchorOffsetY + footRow * metrics.frameScale };
    }
    drawBossPulse(ctx, pulse, direction, ground) {
      const center = pulse.originX + direction * pulse.radius;
      const age = pulse.radius / BOSS_COMBAT.pulseSpeed * 1000;
      const flicker = Math.sin(age / 110);
      const width = 104, height = 76;
      const artCenter = center - direction * (width - BOSS_COMBAT.pulseWidth) / 2;
      ctx.save();
      ctx.globalAlpha = pulse.hit ? 0.38 : 1;
      // Larger flame and wake trail behind the unchanged swept leading edge.
      ctx.save(); ctx.translate(artCenter - direction * 14, ground - 27); ctx.scale(1.55, 1);
      const glow = ctx.createRadialGradient?.(0, 0, 4, 0, 0, 52 + flicker * 3);
      if (glow?.addColorStop) {
        glow.addColorStop(0, 'rgba(255,163,51,0.35)');
        glow.addColorStop(0.4, 'rgba(255,82,22,0.15)');
        glow.addColorStop(1, 'rgba(255,45,18,0)');
        ctx.fillStyle = glow; ctx.fillRect(-56, -56, 112, 112);
      }
      ctx.restore();
      ctx.fillStyle = 'rgba(255,153,45,0.10)';
      ctx.beginPath(); ctx.ellipse(artCenter, ground - 4, 58, 7, 0, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const y = ground - 12 - i * 17;
        const tail = 86 + i * 12 + Math.sin(age / 130 + i) * 9;
        ctx.strokeStyle = i === 1 ? 'rgba(255,207,105,0.64)' : 'rgba(255,100,38,0.45)';
        ctx.lineWidth = 3 - i * 0.7;
        ctx.beginPath(); ctx.moveTo(center - direction * 18, y);
        ctx.quadraticCurveTo(center - direction * 52, y - flicker * 5, center - direction * tail, y + 6); ctx.stroke();
      }
      const phase = Math.floor(age / 75) % 6, frame = phase < 4 ? phase : 6 - phase;
      const drawn = window.BARCODE?.PresentationAssets?.draw('bossPulse', ctx, {
        x: artCenter, y: ground, width, height, frame, flip: direction < 0
      });
      if (!drawn) {
        ctx.fillStyle = '#ff6433';
        ctx.fillRect(center - BOSS_COMBAT.pulseWidth / 2, ground - BOSS_COMBAT.pulseHeight, BOSS_COMBAT.pulseWidth, BOSS_COMBAT.pulseHeight);
      }
      // The hot core still marks the actual damaging front and jump height.
      ctx.fillStyle = '#fff0bd';
      ctx.fillRect(center + (direction > 0 ? BOSS_COMBAT.pulseWidth / 2 - 4 : -BOSS_COMBAT.pulseWidth / 2),
        ground - BOSS_COMBAT.pulseHeight + 4, 4, BOSS_COMBAT.pulseHeight - 4);
      ctx.restore();
    }
    drawBoss(ctx) {
      if (!ctx || !this.boss?.active) return;
      const boss = this.boss;
      const visual = this.getBossVisualBounds();
      const ground = GROUND_Y + PLAYER_VISUAL_FOOT_OFFSET;
      ctx.save();
      if (this.state === STATES.BOSS_COMBAT) {
        if (boss.phase === 'telegraph') {
          const duration = boss.latePhase ? BOSS_COMBAT.fastTelegraphMs : BOSS_COMBAT.telegraphMs;
          const progress = Math.min(1, boss.phaseElapsedMs / duration);
          const width = BOSS_COMBAT.pulseRange * 2;
          ctx.fillStyle = 'rgba(255, 80, 30, 0.12)';
          ctx.fillRect(boss.x - width / 2, ground - BOSS_COMBAT.pulseHeight, width, BOSS_COMBAT.pulseHeight);
          ctx.strokeStyle = '#ff7844';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(boss.x - width / 2 * progress, ground - 2);
          ctx.lineTo(boss.x + width / 2 * progress, ground - 2);
          ctx.stroke();
        }
        (boss.pulses || []).forEach(pulse => {
          [-1, 1].forEach(direction => this.drawBossPulse(ctx, pulse, direction, ground));
        });
        if (boss.canReceiveDamage) { ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 24; }
        if (boss.hitFlashMs > 0) { ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 32; }
      }
      if (boss.defeated) ctx.globalAlpha = 0.35;
      if (boss.spriteReady && boss.sprite?.draw) boss.sprite.draw(ctx, visual.anchorX, visual.anchorY, { scale: visual.scale, flipH: boss.facing === undefined || boss.facing < 0 });
      else { ctx.fillStyle = '#ff3300'; ctx.fillRect(visual.x, visual.y, visual.width, visual.height); }
      ctx.shadowBlur = 0;
      if (this.state === STATES.BOSS_COMBAT) {
        const cue = boss.phase === 'telegraph' ? (boss.doublePulse ? 'TWO PULSES — JUMP' : 'GROUND PULSE — JUMP') :
          boss.canReceiveDamage ? (this.canStompCounter() ? 'COUNTER: RHYTHM / STOMP' : boss.stompCycle === boss.cycle ? 'COUNTER: RHYTHM — STOMP SPENT THIS CYCLE' : 'COUNTER: RHYTHM — LAND TO REARM STOMP') :
          boss.guardBounceMs > 0 ? 'GUARDED — LAND, THEN COUNTER' : 'SECTOR 1 BOSS';
        ctx.fillStyle = boss.canReceiveDamage ? '#00ffff' : '#ffffff';
        ctx.font = 'bold 17px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cue, boss.x, this.getBossHitbox().y - 26);
        if (boss.phase === 'telegraph' || boss.canReceiveDamage) {
          const sample = this.getBossMusicSample();
          const fraction = sample ? sample.grid.beatFloat % 1 : 0;
          ctx.fillStyle = 'rgba(0, 8, 16, 0.85)';
          ctx.fillRect(boss.x - 48, this.getBossHitbox().y - 17, 96, 6);
          ctx.fillStyle = boss.canReceiveDamage ? '#00ffff' : '#ffbd70';
          ctx.fillRect(boss.x - 48, this.getBossHitbox().y - 17, 96 * fraction, 6);
        }
      }
      ctx.restore();
    }
    isGateClosed(encounterId) { return this.closedGateEncounterId === encounterId; }
    openEncounterGate(encounterId) { if (this.closedGateEncounterId === encounterId) this.closedGateEncounterId = null; this.restoreEncounterSignal(encounterId); }
    getCurrentGate() {
      if (this.closedGateEncounterId) return ENCOUNTER_GATES.find(g => g.encounterId === this.closedGateEncounterId) || null;
      if (this.state === STATES.TUTORIAL) return ENCOUNTER_GATES[0];
      if (!this.spawnedEncounterIds.has(this.state)) return ENCOUNTER_GATES.find(g => g.encounterId === this.state) || null;
      return null;
    }
    applyGateCollision() { const gate = this.getCurrentGate(); const player = this.player || window.player; if (!gate || !player) return; const half = player.width ? player.width / 2 : 40; if (player.position.x + half > gate.x) { this.touchBarrier(gate, player.position.y - 5, 'push'); player.position.x = gate.x - half; if (player.velocity) player.velocity.x = Math.min(0, player.velocity.x || 0); } }
    applyPlayerStageCollision(player, movement = {}) {
      if (!player || !player.velocity || player.velocity.y < 0) return false;
      const previousAnchorY = Number.isFinite(movement.previousFootY) ? movement.previousFootY : player.position.y;
      const currentAnchorY = Number.isFinite(movement.currentFootY) ? movement.currentFootY : player.position.y;
      const previousVisualFootY = previousAnchorY + PLAYER_VISUAL_FOOT_OFFSET;
      const currentVisualFootY = currentAnchorY + PLAYER_VISUAL_FOOT_OFFSET;
      const previousX = Number.isFinite(movement.previousX) ? movement.previousX : player.position.x;
      const footHalfWidth = 18;
      const verticalTravel = currentVisualFootY - previousVisualFootY;
      let landing = null;
      const movingSurfaces = this.isSignalLiftAvailable() && this.signalLift ? [{
        id: SIGNAL_LIFT.id,
        x: this.signalLift.x,
        previousY: this.signalLift.prevY,
        y: this.signalLift.y,
        w: this.signalLift.w,
        h: this.signalLift.h,
        moving: true
      }] : [];
      // Static geometry intentionally wins at the top overlap so stepping
      // right transfers support from the lift to the signal awning.
      for (const surface of this.getStageSurfaces().concat(movingSurfaces)) {
        const surfacePrevY = Number.isFinite(surface.previousY) ? surface.previousY : surface.y;
        if (previousVisualFootY > surfacePrevY || currentVisualFootY < surface.y) continue;
        const crossingT = verticalTravel > 0 ? Math.max(0, Math.min(1, (surface.y - previousVisualFootY) / verticalTravel)) : 1;
        const crossingX = previousX + (player.position.x - previousX) * crossingT;
        const overlapsX = crossingX + footHalfWidth > surface.x && crossingX - footHalfWidth < surface.x + surface.w;
        if (overlapsX && (!landing || crossingT < landing.crossingT)) landing = { surface, crossingT };
      }
      if (!landing) return false;
      player.position.y = landing.surface.y - PLAYER_VISUAL_FOOT_OFFSET;
      player.velocity.y = 0;
      player.grounded = true;
      player.supportedSurfaceId = landing.surface.id;
      return true;
    }
    getPriorEncounterKills(number) { return [0, 0, 4, 9, 14][Math.max(1, Math.min(4, Number(number) || 1))] || 0; }
    debugPrepareMission() { if (!debugAllowed()) return debugDisabled(); this.reset(); if (window.enemyManager?.clear) window.enemyManager.clear(); if (window.objectivesSystem?.reset) window.objectivesSystem.reset(); if (window.tutorialSystem) { window.tutorialSystem.completed = true; window.tutorialSystem.active = false; } if (this.player) { this.player.controlsDisabled = false; if (this.player.velocity) { this.player.velocity.x = 0; this.player.velocity.y = 0; } } this.startMission(); return this.getDiagnostics(); }
    debugSkipTutorial() { return this.debugPrepareMission(); }
    debugClearEnemies() { if (!debugAllowed()) return debugDisabled(); if (window.enemyManager) { window.enemyManager.enemies.forEach(enemy => { if (enemy && (enemy._sector1MissionEnemy || enemy._jammerReinforcement)) { enemy.active = false; enemy._disposed = true; } }); window.enemyManager.enemies = window.enemyManager.enemies.filter(enemy => enemy && enemy.active); } this.activeEncounterEnemies = []; this.pendingSpawns = []; return this.getDiagnostics(); }
    debugCompleteEncounter() { if (!debugAllowed()) return debugDisabled(); const index = ENCOUNTERS.findIndex(encounter => encounter.id === this.state); if (index < 0) return { ok: false, reason: 'no-active-encounter', diagnostics: this.getDiagnostics() }; const completedTotal = ENCOUNTERS.slice(0, index + 1).reduce((sum, encounter) => sum + encounterSpecs(encounter).length, 0); this.debugClearEnemies(); this.debugSetMissionKills(completedTotal); this.openEncounterGate(this.state); this.activeEncounterId = null; this.closedGateEncounterId = null; if (completedTotal >= this.requiredEnemyKills) this.revealJammer(); else { this.state = ENCOUNTERS[index + 1].id; this.prepareAssetsForEncounter(index + 1); } return this.getDiagnostics(); }
    debugSetMissionKills(value) { if (!debugAllowed()) return debugDisabled(); this.missionStarted = true; this.missionDefeats = Math.max(0, Math.min(this.requiredEnemyKills, Number(value) || 0)); if (window.enemyManager) window.enemyManager.defeatedCount = this.missionDefeats; if (typeof window.syncEnemyDefeatProjections === 'function') window.syncEnemyDefeatProjections(this.missionDefeats); else if (window.gameState) window.gameState.enemiesDefeated = this.missionDefeats; if (window.objectivesSystem?.updateMissionDefeatProgress) window.objectivesSystem.updateMissionDefeatProgress(this.missionDefeats, this.requiredEnemyKills); return this.getDiagnostics(); }
    debugGotoEncounter(number) { if (!debugAllowed()) return debugDisabled(); const index = Math.max(1, Math.min(4, Number(number) || 1)); this.debugPrepareMission(); this.debugClearEnemies(); this.spawnedEncounterIds = new Set(ENCOUNTERS.slice(0, index - 1).map(encounter => encounter.id)); this.debugSetMissionKills(this.getPriorEncounterKills(index)); this.state = ENCOUNTERS[index - 1].id; this.activeEncounterId = null; this.closedGateEncounterId = null; if (this.player) { this.player.position.x = ENCOUNTERS[index - 1].triggerX + 10; this.player.position.y = GROUND_Y; this.player.velocity.x = 0; this.player.velocity.y = 0; } return this.getDiagnostics(); }
    debugGotoJammer() { if (!debugAllowed()) return debugDisabled(); this.debugPrepareMission(); this.debugClearEnemies(); this.spawnedEncounterIds = new Set(ENCOUNTERS.map(encounter => encounter.id)); this.debugSetMissionKills(this.requiredEnemyKills); this.revealJammer(); return this.getDiagnostics(); }
    debugDamageJammer(amount = 1) { if (!debugAllowed()) return debugDisabled(); if (!this.jammerRevealed) this.debugGotoJammer(); const environment = window.BARCODE?.JammerEnvironment; const status = environment?.getStatus?.(); const hits = Math.min(Math.max(1, Number(amount) || 1), Math.max(0, status?.health || 0)); let result = { ok: false, reason: 'jammer-unavailable' }; for (let i = 0; i < hits; i++) { this.debugDamageSequence += 1; result = environment.applyRhythmDamage({ timing: 'perfect', sequence: `level1-debug-${this.debugDamageSequence}` }); } return result; }
    debugDestroyJammer() { if (!debugAllowed()) return debugDisabled(); if (!this.jammerRevealed) this.debugGotoJammer(); const remaining = window.BARCODE?.JammerEnvironment?.getStatus?.().health || 0; if (remaining > 0) this.debugDamageJammer(remaining); return this.getDiagnostics(); }
    debugResetSignalLift() { if (!debugAllowed()) return debugDisabled(); if (!this.missionStarted) this.debugPrepareMission(); this.resetSignalLift(); if (this.player) { this.player.position.x = SIGNAL_LIFT.x + SIGNAL_LIFT.w / 2; this.player.position.y = SIGNAL_LIFT.bottomY - PLAYER_VISUAL_FOOT_OFFSET; this.player.velocity.x = 0; this.player.velocity.y = 0; this.player.grounded = true; this.player.supportedSurfaceId = null; } return this.getDiagnostics(); }
    debugChargeSignalLift() { if (!debugAllowed()) return debugDisabled(); return this.chargeSignalLift(); }
    debugGiveSignalAmp() { if (!debugAllowed()) return debugDisabled(); return this.giveSignalAmp(); }
    debugPlayBossIntro() { if (!debugAllowed()) return debugDisabled(); if (!this.jammerRevealed) this.debugGotoJammer(); this.captureCinematicStart(); this.transitionToPan(); return this.getDiagnostics(); }
    debugGotoBoss() {
      if (!debugAllowed()) return debugDisabled();
      if (window.gameState) Object.assign(window.gameState, { running: true, paused: false, gameOver: false, victory: false });
      this.debugGotoJammer();
      if (this.player) {
        Object.assign(this.player, { health: this.player.maxHealth, invulnerable: false,
          invulnerableUntil: 0, _enemyInvulnerableUntilMs: 0, isEntering: false,
          grounded: true, supportedSurfaceId: null, allowMovement: true,
          jumpBufferTimerMs: 0, coyoteTimerMs: 0, airInput: 0 });
        this.player.position.y = GROUND_Y;
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;
      }
      this.debugDamageJammer(16);
      this.purgeEnemies();
      this.prepareBossAssets();
      this.cameraX = clampCamera(this.player?.position?.x || 960);
      this.startBossWalk();
      this.boss.fallbackLocked = false;
      this.boss.x = clampWorldX((this.player?.position?.x || 960) + 440);
      if (Math.abs(this.boss.x - this.player.position.x) < 260) this.boss.x = clampWorldX(this.player.position.x - 440);
      this.boss.y = GROUND_Y;
      this.cinematicZoomOverride = null;
      this.enterBossReady();
      return this.getDiagnostics();
    }
    debugResetMission() { if (!debugAllowed()) return debugDisabled(); this.debugPrepareMission(); if (this.player) { this.player.position.x = 200; this.player.position.y = GROUND_Y; this.player.velocity.x = 0; this.player.velocity.y = 0; if (Number.isFinite(this.player.maxHealth)) this.player.health = this.player.maxHealth; } return this.getDiagnostics(); }
    prepareAssetsForEncounter(index) { const def = ENCOUNTERS[index]; if (!def) return; this.assetDiagnostics = this.assetDiagnostics || []; const types = [...new Set(encounterSpecs(def).map(e => e.type))]; types.forEach(type => this.requestSpriteOnce(`enemy:${type}`, type === 'firewall' ? 'firewall_firewall' : type === 'corrupted' ? 'corrupted_corrupted' : 'virus_virus')); if (index >= ENCOUNTERS.length - 1) this.prepareJammerAsset(); }
    prepareJammerAsset() { this.requestSpriteOnce('jammer', 'broadcast_jammer_broadcastjammer'); }
    requestSpriteOnce(key, spriteId, onReady) { this.preparedAssets = this.preparedAssets || {}; if (this.preparedAssets[key]) return this.preparedAssets[key].sprite || this.preparedAssets[key]; try { if (!window.MakkoEngine || typeof window.MakkoEngine.sprite !== 'function') { this.recordAssetDiagnostic(key, 'MakkoEngine unavailable'); return null; } const sprite = window.MakkoEngine.sprite(spriteId); const entry = { key, spriteId, sprite, onReady, generation: this.assetGeneration, ready: false, diagnosticRecorded: false }; this.preparedAssets[key] = entry; this.pollPreparedAsset(entry); return sprite; } catch (error) { this.recordAssetDiagnostic(key, error); return null; } }
    pollPreparedAssets() { if (!this.preparedAssets) return; Object.values(this.preparedAssets).forEach(entry => { if (entry && entry.sprite) this.pollPreparedAsset(entry); }); }
    pollPreparedAsset(entry) { if (!entry || entry.ready || entry.generation !== this.assetGeneration) return; try { if (!entry.sprite.isLoaded || entry.sprite.isLoaded()) { entry.ready = true; if (entry.onReady) entry.onReady(entry.sprite); } } catch (error) { if (!entry.diagnosticRecorded) { entry.diagnosticRecorded = true; this.recordAssetDiagnostic(entry.key, error); } } }
    recordAssetDiagnostic(key, error) { this.assetDiagnostics = this.assetDiagnostics || []; if (!this.assetDiagnostics.some(entry => entry.key === key)) this.assetDiagnostics.push({ key, message: String(error && error.message || error) }); }
    reset(options = {}) {
      this.cameraY = 0; this.barrierContacts = []; this.barrierContactClock = 0; this.encounterIdleMs = 0; this.lastHintDefeats = 0;
      this.resetRepairs();
      window.BARCODE?.stageFX?.reset(this);
      window.renderer?.resetFollowCamera?.(this.player?.position.x);
      this.resetDistrictSignal();
      this.missionStarted = false; this.missionDefeats = 0; this.enemiesDefeated = 0; this.jammerRevealed = false; this.jammerDestroyedNotified = false;
      this.cinematicStartedCount = 0; this.phaseElapsed = 0; this.cameraOverrideActive = false; this.cameraX = null;
      this.cinematicStartCameraX = null; this.cinematicStartPlayerPosition = null; this.cinematicStartZoom = null; this.cinematicWideZoom = null; this.cinematicCloseZoom = null;
      this.cinematicZoomOverride = null; this.cinematicZoomReleasePending = false; this.closeUpStartZoom = null; this.frozenPlayerPosition = null;
      this.panStartX = null; this.panTargetX = null; this.returnStartCameraX = null; this.returnStartZoom = null; this.returnStartBossX = null;
      this.bossCheckpoint = null; this.levelCompletionCount = 0;
      this.completion = null;
      if (!options.preserveDefeats && window.rhythmSystem) window.rhythmSystem.runBestCombo = 0;
      this.boss = null; this.bossReadyEmitted = false; this.assetGeneration = (this.assetGeneration || 0) + 1; this.preparedAssets = {}; this.preloadedBossSprite = null; this.bossAssetsRequested = false;
      this.countedEnemies = new Set(); this.spawnedEncounterIds = new Set(); this.activeEncounterId = null; this.activeEncounterEnemies = []; this.closedGateEncounterId = null; this.pendingSpawns = [];
      this.nextJammerSpawnMs = Infinity; this.jammerReinforcementCount = 0; this.debugDamageSequence = 0; this.lastSpawnPlan = null; this.resetSignalLift(); this.signalAmpCollected = false; if (window.BARCODE) window.BARCODE.signalAmpCharges = 0;
      this.state = options && options.preserveTutorial ? STATES.TUTORIAL : STATES.TUTORIAL;
      if (window.renderer && typeof window.renderer.clearCinematicZoomOverride === 'function') window.renderer.clearCinematicZoomOverride();
      if (window.BARCODE?.JammerEnvironment?.reset) window.BARCODE.JammerEnvironment.reset();
      if (window.lostDataSystem?.reset) window.lostDataSystem.reset();
      if (window.hackingSystem?.reset) window.hackingSystem.reset();
      if (this.player) this.player.controlsDisabled = false;
    }
    getDiagnostics() { const activeReinforcements = (window.enemyManager?.enemies || []).filter(enemy => enemy && enemy.active && enemy._jammerReinforcement).length; return { state: this.state, missionDefeats: this.missionDefeats, requiredEnemyKills: this.requiredEnemyKills, encounters: ENCOUNTERS, stageSurfaces: STAGE_SURFACES, signalLift: this.signalLift && { available: this.isSignalLiftAvailable(), x: this.signalLift.x, y: this.signalLift.y, state: this.signalLift.state, charges: this.signalLift.charges, requiredCharges: SIGNAL_LIFT.requiredCharges }, pendingSpawns: this.pendingSpawns.length, lastSpawnPlan: this.lastSpawnPlan, activeReinforcements, jammerRevealed: this.jammerRevealed, cinematicStartedCount: this.cinematicStartedCount, cameraX: this.cameraX, cinematic: { startCameraX: this.cinematicStartCameraX, startPlayerPosition: this.cinematicStartPlayerPosition, startZoom: this.cinematicStartZoom, zoomOverride: this.getCinematicZoomOverride(), cameraOverrideActive: this.cameraOverrideActive, returnStartBossX: this.returnStartBossX }, boss: this.boss && { x: this.boss.x, state: this.boss.state, flourishPlayed: this.boss.flourishPlayed, visual: this.getBossVisualBounds(), ...this.getBossStatus(), combatPending: this.isBossCinematicActive() }, levelCompletionCount: this.levelCompletionCount, bossReadyEmitted: this.bossReadyEmitted, assetDiagnostics: this.assetDiagnostics || [] }; }
  };
  window.initSector1Progression = function(player) { if (!window.sector1Progression) window.sector1Progression = new window.Sector1Progression(player); else window.sector1Progression.player = player || window.sector1Progression.player; return window.sector1Progression; };
})();
