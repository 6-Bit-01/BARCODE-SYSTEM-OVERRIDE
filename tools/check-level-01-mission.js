#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const sectorSource = fs.readFileSync('src/game/sector1-progression.js','utf8');
const jammerSource = fs.readFileSync('src/game/jammer-environment.js','utf8');
const combat = fs.readFileSync('src/game/player-combat.js','utf8');
const rhythm = fs.readFileSync('src/game/rhythm.js','utf8');
const enemies = fs.readFileSync('src/game/enemies.js','utf8');
const input = fs.readFileSync('src/core/input.js','utf8');
const gameState = fs.readFileSync('src/game/game-state.js','utf8');
const render = fs.readFileSync('src/game/render-coordinator.js','utf8');
const objectives = fs.readFileSync('src/game/objectives.js','utf8');
const updateCoordinator = fs.readFileSync('src/game/update-coordinator.js','utf8');
const indicatorSource = fs.readFileSync('src/engine/jammer-indicator.js','utf8');
const debugSource = fs.readFileSync('src/game/level-01-debug.js','utf8');
const indexSource = fs.readFileSync('index.html','utf8');
function must(text, re, msg) { assert(re.test(text), msg); }
function approximately(actual, expected, message, epsilon = 0.000001) { assert(Math.abs(actual - expected) <= epsilon, `${message}: expected ${expected}, received ${actual}`); }

const encounterBlocks = [...sectorSource.matchAll(/\{ id: 'encounter_\d'[^]*?enemies: \[([^]*?)\] \}/g)];
assert.strictEqual(encounterBlocks.length, 4, 'four authored encounter definitions');
const counts = encounterBlocks.map(m => (m[1].match(/type: '/g) || []).length);
assert.strictEqual(counts.reduce((a,b)=>a+b,0), 20, 'exactly 20 quota enemies');
assert.deepStrictEqual(counts, [4,5,5,6], 'encounter counts are 4/5/5/6');
must(sectorSource, /STAGE_SURFACES = Object\.freeze/, 'single stage surface data exists');
must(sectorSource, /ENCOUNTER_GATES = Object\.freeze/, 'single gate data exists');
must(sectorSource, /previousFootY <= surface\.y && currentFootY >= surface\.y/, 'platform tunneling prevention uses previous/current feet');
must(sectorSource, /isCompleted\(\) && typeof window\.tutorialSystem\.isActive === 'function' && !window\.tutorialSystem\.isActive\(\)/, 'mission requires completed and inactive tutorial');
must(sectorSource, /captureCinematicStart\(\)[^]*gameCamera\.centerX/, 'Jammer destruction captures gameCamera.centerX immediately');
must(sectorSource, /transitionToPan\(\)[^]*if \(!Number\.isFinite\(this\.panStartX\)\) this\.captureCinematicStart\(\)/, 'pan reuses captured start');
must(sectorSource, /pollPreparedAssets/, 'async prepared asset polling exists');
must(sectorSource, /entry\.generation !== this\.assetGeneration/, 'asset polling is generation guarded');
must(sectorSource, /activeAnimation === animation/, 'boss animation play is guarded by active animation');
must(sectorSource, /const GROUND_Y = 750;/, 'Level 1 physics ground remains at the reverted baseline');
must(jammerSource, /state\.generation \+= 1;[^]*state\.revealed = false;[^]*state\.targetable = false;[^]*state\.health = state\.maxHealth;[^]*state\.destroyed = false;[^]*state\.lastDamageSequence = null/s, 'jammer reset always restores gameplay state');
must(jammerSource, /state\.destroyed \|\| !state\.revealed/, 'destroyed jammer sprite stops rendering');
must(combat, /jammerHit\.ok\) \? 'hit' : 'no-target'/, 'jammer-only hit reports hit');
must(rhythm, /timing === 'miss'[^]*playSound\('synthHit', 0\.3\)/, 'exact miss plays synthHit once');
must(enemies, /if \(suppressMissionSimulation\) return;\n    this\.simulationTimeMs \+= deltaTime;/, 'enemy sim time does not advance while suppressed');
must(enemies, /purgeForCinematic\(\)[^]*_defeatRecorded = true[^]*particleSystem[^]*this\.enemies = this\.enemies\.filter/s, 'purge starts visible effects and avoids defeat credit');
must(input, /tutorialSystem\.handleSpacePress/, 'tutorial Space ownership preserved');
must(input, /actions\.jump\.pressed/, 'jump action path preserved');
must(input, /resolvePrimary/, 'rhythm attack path preserved');
must(input, /hacking && typeof hacking\.start/, 'hacking path preserved');
must(enemies, /Intentional passive landing stomp/, 'passive stomp remains lethal');
must(gameState, /shouldSuppressGenericSpawning\(\)[^]*hasSpawnedInitialEnemies = true/s, 'generic initial spawn disabled under mission owner');
must(render, /centerX: cameraX/, 'renderer records camera center convention');
must(updateCoordinator, /progressionSuppressesGameplay[^]*allowMovement = !hackingActive && !progressionSuppressesGameplay/s, 'update coordinator disables player physics during cinematic suppression');
must(objectives, /visibleObjectives[^]*Math\.max\(160, 60 \+ visibleObjectives\.length \* 50\)/s, 'objective panel height grows for boss-ready row');

function createVectorClass() {
  return class Vector2D { constructor(x, y) { this.x = x; this.y = y; } multiply(n) { return new Vector2D(this.x * n, this.y * n); } add(v) { return new Vector2D(this.x + v.x, this.y + v.y); } };
}
function loadRealSector({ spriteLoadedInitially = false } = {}) {
  let spriteLoaded = spriteLoadedInitially;
  const sprite = { playCalls: [], updateCalls: 0, isLoaded: () => spriteLoaded, play(name, loop) { this.playCalls.push({ name, loop }); }, update(dt) { this.updateCalls += 1; this.lastUpdate = dt; } };
  const jammerStatus = { revealed: false, destroyed: false, health: 16, position: { x: 3520, y: 750 } };
  const jammerEnvironment = {
    reset() { jammerStatus.revealed = false; jammerStatus.destroyed = false; jammerStatus.health = 16; },
    reveal(options = {}) { jammerStatus.revealed = true; jammerStatus.destroyed = false; jammerStatus.position = { ...(options.position || jammerStatus.position) }; return this.getStatus(); },
    getStatus() { return { ...jammerStatus, position: { ...jammerStatus.position } }; }
  };
  const window = {
    FILE_MANIFEST: [],
    BARCODE: { JammerEnvironment: jammerEnvironment },
    Vector2D: createVectorClass(),
    clamp: (v,min,max)=>Math.max(min,Math.min(max,v)),
    gameState: { paused: false, enemiesDefeated: 0 },
    player: { position: { x: 900, y: 700 }, velocity: { x: 4, y: 9 }, width: 80, controlsDisabled: false },
    enemyManager: { clear(){ this.cleared = true; this.enemies = []; }, enemies: [], purgeForCinematic(){ this.purged = (this.purged || 0) + 1; } },
    objectivesSystem: { setMissionDefeatObjective(){}, completeJammerObjective(){}, revealJammerObjective(){}, setBossIntroObjective(){}, updateMissionDefeatProgress(){} },
    cancelInitialEnemySpawn(){ this.cancelled = true; },
    Enemy: function Enemy(x, y, type) { this.position = type === 'virus' ? { x, y } : { x: 4500, y: 250 }; this.velocity = { x: 0, y: 0 }; this.type = type; this.active = true; },
    MakkoEngine: { calls: 0, sprite(id) { this.calls += 1; sprite.id = id; return sprite; } }
  };
  const context = vm.createContext({ window, console });
  vm.runInContext(sectorSource, context, { filename: 'src/game/sector1-progression.js' });
  return { window, sprite, jammerStatus, setSpriteLoaded: value => { spriteLoaded = value; } };
}

{
  const { window } = loadRealSector();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(window.Sector1Progression.STAGE_SURFACES)), [
    { id: 'signal-awning', x: 650, y: 650, w: 430, h: 26 },
    { id: 'cache-bridge', x: 1390, y: 625, w: 520, h: 26 },
    { id: 'firewall-deck', x: 2230, y: 650, w: 620, h: 26 },
    { id: 'broadcast-ramp', x: 3150, y: 625, w: 620, h: 26 }
  ], 'authored Level 1 platform rectangles remain at the reverted baseline');
}

{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  window.tutorialSystem = { isCompleted: () => false, isActive: () => true };
  p.update(16); assert.strictEqual(p.state, 'tutorial', 'completed=false active=true does not start');
  window.tutorialSystem = { isCompleted: () => true, isActive: () => true };
  p.update(16); assert.strictEqual(p.state, 'tutorial', 'completed=true active=true still does not start');
  window.tutorialSystem = { isCompleted: () => true, isActive: () => false };
  p.update(16); assert.strictEqual(p.state, 'encounter_1', 'completed=true active=false starts mission');
  p.update(16); assert.strictEqual(p.missionStarted, true, 'mission transition remains idempotent');
}
{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  for (const center of [960, 2048, 3136]) {
    for (const zoom of [1, 0.8, 0.625]) {
      window.player.position.x = center;
      window.gameCamera = { centerX: center === 960 ? 3136 : 960 };
      window.renderer = { getZoomLevel: () => zoom };
      const bounds = p.getVisibleWorldBounds();
      assert.strictEqual(bounds.center, center, 'normal gameplay spawn planning follows the clamped player camera center');
      for (const type of ['virus', 'corrupted', 'firewall']) {
        const origin = p.planSpawn({ type, x: center, y: 650 });
        const half = p.getSpawnBodyHalfWidth(type);
        assert(origin.x + half <= bounds.left - 140 || origin.x - half >= bounds.right + 140, `${type} spawn is fully outside the camera at center=${center}, zoom=${zoom}`);
        assert(Math.abs(origin.x - center) >= 350 + half, `${type} spawn respects the player exclusion radius at center=${center}, zoom=${zoom}`);
        assert(origin.x >= half && origin.x <= 4096 - half, `${type} spawn remains inside world bounds at center=${center}, zoom=${zoom}`);
      }
    }
  }

  for (const type of ['corrupted', 'firewall']) {
    const origin = { x: 3333, y: 650 };
    const enemy = p.spawnMissionEnemy({ type, x: 3000, y: 650 }, 'restore-origin', 0, { origin });
    assert.deepStrictEqual({ x: enemy.position.x, y: enemy.position.y }, origin, `${type} constructor rewrite cannot replace the authored spawn origin`);
    assert.deepStrictEqual({ x: enemy.originalSpawnX, y: enemy.originalSpawnY }, origin, `${type} original spawn metadata uses the authored origin`);
    assert.strictEqual(enemy._entranceTarget.y, 750, `${type} enters on the physics ground instead of air-walking at the authored Virus height`);
  }
  const virus = p.spawnMissionEnemy({ type: 'virus', x: 3000, y: 650 }, 'virus-height', 0, { origin: { x:3333, y:650 } });
  assert.strictEqual(virus._entranceTarget.y, 650, 'Virus preserves its authored airborne entrance height');
}
{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  p.startMission();
  const first = window.Sector1Progression.ENCOUNTERS[0];
  p.spawnEncounter(first);
  assert.strictEqual(p.pendingSpawns.length, 4, 'encounter 1 queues all four authored actors');
  assert.strictEqual(p.activeEncounterEnemies.length, 0, 'queued encounter has no actors before its first stagger tick');
  p.updateEncounter();
  assert.strictEqual(p.state, 'encounter_1', 'an encounter cannot complete while its spawn queue is pending');
  p.updatePendingSpawns(0);
  assert.strictEqual(p.activeEncounterEnemies.length, 1, 'the first encounter actor spawns immediately');
  assert.strictEqual(p.pendingSpawns.length, 3, 'the remaining encounter actors stay staggered');
  p.activeEncounterEnemies[0].active = false;
  p.activeEncounterEnemies[0]._defeatRecorded = true;
  p.updateEncounter();
  assert.strictEqual(p.state, 'encounter_1', 'defeating the first actor cannot skip pending encounter spawns');
  p.updatePendingSpawns(1050);
  assert.strictEqual(p.activeEncounterEnemies.length, 4, 'all authored actors enter after the full stagger window');
  p.activeEncounterEnemies.forEach(enemy => { enemy.active = false; enemy._defeatRecorded = true; });
  p.updateEncounter();
  assert.strictEqual(p.state, 'encounter_2', 'the gate opens only after the complete encounter queue is defeated');
}
{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  p.missionStarted = true;
  p.missionDefeats = 20;
  window.gameCamera = { centerX: 960 };
  window.renderer = { getZoomLevel: () => 1 };
  p.revealJammer();
  p.updateJammerReinforcements(0);
  assert.strictEqual(window.enemyManager.enemies.filter(enemy => enemy._jammerReinforcement).length, 1, 'Jammer phase starts one reinforcement after reveal');
  assert(p.nextJammerSpawnMs >= 3000 && p.nextJammerSpawnMs <= 4500, 'Jammer reinforcement cadence is bounded');
  p.updateJammerReinforcements(0);
  assert.strictEqual(window.enemyManager.enemies.filter(enemy => enemy._jammerReinforcement).length, 1, 'Jammer cadence prevents an immediate second reinforcement');
  for (let i = 0; i < 8; i++) p.updateJammerReinforcements(5000);
  const reinforcements = window.enemyManager.enemies.filter(enemy => enemy.active && enemy._jammerReinforcement);
  assert.strictEqual(reinforcements.length, 4, 'Jammer reinforcements are capped at four active actors');
  assert(reinforcements.every(enemy => enemy._sector1MissionEnemy === false), 'Jammer reinforcements never become mission-quota enemies');
  p.onEnemyDefeated(999, reinforcements[0]);
  assert.strictEqual(p.missionDefeats, 20, 'Jammer reinforcements cannot advance the 20-kill mission quota');
}
{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  p.state = 'jammer_active'; p.missionStarted = true; window.gameCamera = { x: 515, centerX: 1475 };
  p.onJammerDestroyed();
  assert.strictEqual(p.cameraOverrideActive, true, 'camera override enabled immediately');
  assert.strictEqual(p.cameraX, 1475, 'camera captured at destruction center');
  assert.strictEqual(p.panStartX, 1475, 'pan start captured immediately');
  assert.strictEqual(p.frozenPlayerPosition.x, 900, 'player x snapshot captured'); assert.strictEqual(p.frozenPlayerPosition.y, 700, 'player y snapshot captured');
  assert.strictEqual(window.player.velocity.x, 0); assert.strictEqual(window.player.velocity.y, 0);
  window.gameCamera.centerX = 2200; p.update(800); p.update(1);
  assert.strictEqual(p.state, 'camera_pan');
  assert.strictEqual(p.panStartX, 1475, 'transitionToPan reuses destruction-time snapshot');
  p.update(0); assert.strictEqual(p.cameraX, 1475, 'first pan frame equals previous gameplay camera center');
  window.player.position.x = 999; window.player.position.y = 999; window.player.velocity.y = 99; p.update(16);
  assert.strictEqual(window.player.position.x, 900, 'suppression freezes player x');
  assert.strictEqual(window.player.position.y, 700, 'suppression freezes player y');
  assert.strictEqual(window.player.velocity.y, 0, 'suppression stops vertical physics');
}
{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  window.BARCODE.DEBUG_LEVEL_1_SESSION = true;
  window.tutorialSystem = { completed: false, active: true };
  p.state = 'boss_ready';
  p.cameraOverrideActive = true;
  p.cameraX = 3136;
  p.frozenPlayerPosition = { x: 1, y: 2 };
  p.jammerDestroyedNotified = true;
  p.boss = { active: true };
  p.debugGotoEncounter(2);
  assert.strictEqual(p.state, 'encounter_2', 'debug encounter jump selects the requested encounter');
  assert.strictEqual(p.cameraOverrideActive, false, 'debug encounter jump releases a previous boss camera override');
  assert.strictEqual(p.frozenPlayerPosition, null, 'debug encounter jump clears a previous cinematic player lock');
  assert.strictEqual(p.jammerDestroyedNotified, false, 'debug encounter jump resets the Jammer destruction latch');
  assert.strictEqual(p.boss, null, 'debug encounter jump removes the previous boss presentation');
  p.debugCompleteEncounter();
  assert.strictEqual(p.state, 'encounter_3', 'debug encounter completion advances instead of leaving a closed empty gate');
  assert.strictEqual(p.missionDefeats, 9, 'debug encounter completion applies the authored cumulative quota');
  assert.strictEqual(window.enemyManager.defeatedCount, 9, 'debug encounter completion keeps the defeat projection in sync');
  p.debugGotoEncounter(4);
  p.debugCompleteEncounter();
  assert.strictEqual(p.state, 'jammer_active', 'completing the final debug encounter reveals the real Jammer phase');
  assert.strictEqual(p.missionDefeats, 20, 'final debug encounter completion reaches the authoritative 20-kill gate');
  p.jammerDestroyedNotified = true;
  p.cameraOverrideActive = true;
  p.debugGotoJammer();
  assert.strictEqual(p.state, 'jammer_active', 'debug Jammer jump remains reusable after a prior cinematic');
  assert.strictEqual(p.jammerDestroyedNotified, false, 'debug Jammer jump rearms the boss-intro destruction latch');
  assert.strictEqual(p.cameraOverrideActive, false, 'debug Jammer jump starts from the normal player camera');
}
{
  const { window, sprite, setSpriteLoaded } = loadRealSector({ spriteLoadedInitially: false });
  const p = new window.Sector1Progression(window.player);
  p.prepareBossAssets();
  assert.strictEqual(window.MakkoEngine.calls, 1, 'boss sprite requested once');
  assert.strictEqual(p.preloadedBossSprite, null, 'not assigned before async readiness');
  p.pollPreparedAssets(); assert.strictEqual(window.MakkoEngine.calls, 1, 'polling does not create another sprite');
  setSpriteLoaded(true); p.pollPreparedAssets();
  assert.strictEqual(p.preloadedBossSprite, sprite, 'async-loaded boss sprite becomes preloaded');
  p.cameraX = 3000; p.startBossWalk();
  assert.strictEqual(p.boss.sprite, sprite, 'entrance uses same prepared sprite instance');
  const presentationFrames = [
    { state: 'walk', animation: 'sector_1_boss_walk_walk', sourceAnchorY: 253, expectedScale: 0.8 },
    { state: 'flourish', animation: 'sector_1_boss_attack_attack', sourceAnchorY: 154 },
    { state: 'idle', animation: 'sector_1_boss_idle_idle', sourceAnchorY: 178 }
  ];
  for (const frame of presentationFrames) {
    p.boss.state = frame.state;
    p.boss.activeAnimation = frame.animation;
    const visual = p.getBossVisualBounds();
    if (frame.expectedScale !== undefined) approximately(visual.scale, frame.expectedScale, 'boss walk scale remains at the reverted baseline');
    approximately(visual.scale * frame.sourceAnchorY, 253 * 0.8, `${frame.state} animation uses the normalized anchor height`);
    assert.strictEqual(visual.anchorY, p.boss.y + 110, `${frame.state} animation preserves the reverted +110 ground presentation offset`);
    assert.strictEqual(visual.anchorY, 860, `${frame.state} animation remains anchored at y=860 when boss.y=750`);
  }
  p.boss.state = 'walk';
  p.boss.activeAnimation = 'sector_1_boss_walk_walk';
  p.updateBossWalk(16); p.updateBossWalk(16);
  assert.deepStrictEqual(sprite.playCalls.map(c => c.name), ['sector_1_boss_walk_walk'], 'walk plays only once on transition');
  p.boss.x = 3600; p.updateBossWalk(16);
  assert(sprite.playCalls.map(c => c.name).includes('sector_1_boss_attack_attack'), 'flourish plays on transition');
  const before = sprite.updateCalls; p.update(100); p.update(100);
  assert(sprite.updateCalls > before, 'flourish sprite receives update calls');
  p.update(1000);
  assert(sprite.playCalls.map(c => c.name).includes('sector_1_boss_idle_idle'), 'idle plays when boss_ready begins');
}
{
  const window = {
    FILE_MANIFEST: [],
    BARCODE: {},
    renderer: { zoomLevel: 0.625, getZoomLevel() { return this.zoomLevel; } },
    gameCamera: { centerX: 3136 },
    clamp: (value, min, max) => Math.max(min, Math.min(max, value))
  };
  const context = vm.createContext({ window, console });
  vm.runInContext(jammerSource, context, { filename: 'src/game/jammer-environment.js' });
  vm.runInContext(indicatorSource, context, { filename: 'src/engine/jammer-indicator.js' });
  window.BARCODE.JammerEnvironment.reveal({ position: { x: 3520, y: 750 } });
  const bounds = window.BARCODE.JammerEnvironment.getAimBounds();
  const indicator = new window.JammerIndicator();
  const projected = indicator.worldToScreen({ x: 3520, y: 750 }, 3136, 0.625);
  approximately(projected.x, 1200, 'Jammer world x projects through the renderer camera convention');
  approximately(projected.y, 721.875, 'Jammer world y projects through the renderer zoom offset');
  indicator.update(500, bounds, 3136, 750);
  assert.strictEqual(indicator.active, false, 'indicator hides when the Jammer presentation bounds are visible');
  window.gameCamera.centerX = 960;
  indicator.update(500, bounds, 960, 750);
  assert.strictEqual(indicator.active, true, 'indicator activates when the Jammer presentation bounds are offscreen');
  approximately(indicator.indicatorPosition.x, 1840, 'offscreen Jammer indicator lands on the right safe edge');
  assert(indicator.indicatorPosition.y >= 180 && indicator.indicatorPosition.y <= 770, 'offscreen Jammer indicator remains inside the vertical safe area');
}
{
  const listeners = {};
  const elements = new Map();
  const body = { appendChild(element) { if (element.id) elements.set(element.id, element); } };
  const document = {
    body,
    getElementById(id) { return elements.get(id) || null; },
    createElement() { return { id: '', style: {}, children: [], appendChild(child) { this.children.push(child); }, addEventListener() {} }; }
  };
  let routed = 0;
  const window = {
    FILE_MANIFEST: [],
    BARCODE: {},
    DEBUG: {},
    document,
    sector1Progression: {
      debugGotoJammer() { routed += 1; return { ok: true }; },
      getDiagnostics() { return { state: 'test' }; }
    },
    addEventListener(type, listener) { listeners[type] = listener; }
  };
  const context = vm.createContext({ window, document, console });
  vm.runInContext(debugSource, context, { filename: 'src/game/level-01-debug.js' });
  assert.strictEqual(window.BARCODE.DEBUG_LEVEL_1_SESSION, false, 'Level 1 debug starts disabled every session');
  assert.strictEqual(window.DEBUG.level1.gotoJammer().reason, 'debug-disabled', 'debug actions are rejected before session unlock');
  const event = shiftKey => ({ key: 'F1', shiftKey, preventDefault() {}, stopPropagation() {} });
  listeners.keydown(event(false));
  assert.strictEqual(window.BARCODE.DEBUG_LEVEL_1_SESSION, false, 'F1 alone cannot unlock Level 1 debug');
  listeners.keydown(event(true));
  assert.strictEqual(window.BARCODE.DEBUG_LEVEL_1_SESSION, true, 'Shift+F1 unlocks Level 1 debug for the current session');
  assert.strictEqual(window.DEBUG.level1.gotoJammer().ok, true, 'unlocked debug action routes to Sector1Progression');
  assert.strictEqual(routed, 1, 'debug action routes exactly once');
  assert(!/localStorage|sessionStorage|location|URLSearchParams/.test(debugSource), 'Level 1 debug does not persist or require URL parameters');
  assert.strictEqual((indexSource.match(/src\/game\/level-01-debug\.js/g) || []).length, 1, 'index loads Level 1 debug exactly once');
  assert(indexSource.indexOf('src/game/debug-commands.js') < indexSource.indexOf('src/game/level-01-debug.js'), 'Level 1 debug loads after canonical debug commands');
}
console.log('Level 1 mission static and real-module VM checks passed');
