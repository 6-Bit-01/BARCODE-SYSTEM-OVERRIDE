#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const layoutSource = fs.readFileSync('src/game/level-01-layout.js','utf8');
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
function must(text, re, msg) { assert(re.test(text), msg); }

const encounterBlocks = [...layoutSource.matchAll(/\{ id: 'encounter_\d'[^]*?enemies: \[([^]*?)\] \}/g)];
assert.strictEqual(encounterBlocks.length, 4, 'four authored encounter definitions');
const counts = encounterBlocks.map(m => (m[1].match(/type: '/g) || []).length);
assert.strictEqual(counts.reduce((a,b)=>a+b,0), 20, 'exactly 20 quota enemies');
assert.deepStrictEqual(counts, [4,5,5,6], 'encounter counts are 4/5/5/6');
must(layoutSource, /const STAGE_SURFACES = Object\.freeze/, 'single stage surface data exists');
must(layoutSource, /const ENCOUNTER_GATES = Object\.freeze/, 'single gate data exists');
must(sectorSource, /previousFootY <= surface\.y && currentFootY >= surface\.y/, 'platform tunneling prevention uses previous/current feet');
must(layoutSource, /WORLD_WIDTH = 4096/, 'world width centralized in layout');
must(layoutSource, /GROUND_Y = 890/, 'ground street line centralized in layout');
must(layoutSource, /targetHeight: 192/, 'player target height centralized');
must(layoutSource, /targetHeight: 260/, 'boss target height centralized');
must(layoutSource, /playerExclusionRadius: 350/, 'spawn exclusion radius centralized');
must(sectorSource, /shouldSuppressGenericSpawning\(\) \{ return this\.missionStarted \|\| this\.state === STATES\.TUTORIAL; \}/, 'legacy generic spawner remains suppressed while Level 1 progression owns gameplay');
must(sectorSource, /updateJammerReinforcements/, 'controlled jammer reinforcements exist');
must(sectorSource, /planSpawn/, 'safe spawn planner exists');
must(sectorSource, /debugGotoJammer/, 'progression-owned debug goto jammer exists');
must(sectorSource, /isCompleted\(\) && typeof window\.tutorialSystem\.isActive === 'function' && !window\.tutorialSystem\.isActive\(\)/, 'mission requires completed and inactive tutorial');
must(sectorSource, /captureCinematicStart\(\)[^]*gameCamera\.centerX/, 'Jammer destruction captures gameCamera.centerX immediately');
must(sectorSource, /transitionToPan\(\)[^]*if \(!Number\.isFinite\(this\.panStartX\)\) this\.captureCinematicStart\(\)/, 'pan reuses captured start');
must(sectorSource, /pollPreparedAssets/, 'async prepared asset polling exists');
must(sectorSource, /entry\.generation !== this\.assetGeneration/, 'asset polling is generation guarded');
must(sectorSource, /activeAnimation === animation/, 'boss animation play is guarded by active animation');
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
  const window = { FILE_MANIFEST: [], BARCODE: { JammerEnvironment: { reset(){}, reveal(){ this.revealed = true; } } }, Vector2D: createVectorClass(), clamp: (v,min,max)=>Math.max(min,Math.min(max,v)), gameState: { paused: false, enemiesDefeated: 0 }, player: { position: { x: 900, y: 700 }, velocity: { x: 4, y: 9 }, width: 80, controlsDisabled: false }, enemyManager: { clear(){ this.cleared = true; }, enemies: [], purgeForCinematic(){ this.purged = (this.purged || 0) + 1; } }, objectivesSystem: { setMissionDefeatObjective(){}, completeJammerObjective(){}, revealJammerObjective(){}, setBossIntroObjective(){} }, cancelInitialEnemySpawn(){ this.cancelled = true; }, Enemy: function Enemy(x, y, type) { this.position = { x, y }; this.velocity = { x: 0, y: 0 }; this.type = type; this.active = true; }, MakkoEngine: { calls: 0, sprite(id) { this.calls += 1; sprite.id = id; return sprite; } } };
  const context = vm.createContext({ window, console });
  vm.runInContext(layoutSource, context, { filename: 'src/game/level-01-layout.js' });
  vm.runInContext(sectorSource, context, { filename: 'src/game/sector1-progression.js' });
  return { window, sprite, setSpriteLoaded: value => { spriteLoaded = value; } };
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
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  p.startMission();
  window.player.position.x = 10;
  let spawn = p.planSpawn({ type: 'corrupted', y: window.BARCODE.LEVEL_01_LAYOUT.GROUND_Y });
  assert(spawn.x > 960, 'left-edge camera spawns from safe right side');
  window.player.position.x = 2048;
  spawn = p.planSpawn({ type: 'firewall', y: window.BARCODE.LEVEL_01_LAYOUT.GROUND_Y });
  assert(Math.abs(spawn.x - window.player.position.x) >= 350, 'center spawn respects player exclusion radius');
  window.player.position.x = 4080;
  spawn = p.planSpawn({ type: 'virus', y: window.BARCODE.LEVEL_01_LAYOUT.GROUND_Y });
  assert(spawn.x < 3200, 'right-edge camera spawns from safe left side');
}
{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  p.debugGotoJammer();
  assert.strictEqual(p.state, 'jammer_active', 'debug goto jammer sets jammer active');
  assert.strictEqual(p.missionDefeats, 20, 'debug goto jammer synchronizes 20/20');
  assert.strictEqual(p.shouldSuppressGenericSpawning(), true, 'legacy generic spawner remains suppressed during controlled reinforcements');
  window.BARCODE.JammerEnvironment.getStatus = () => ({ revealed: true, destroyed: false, position: { x: 3520, y: window.BARCODE.LEVEL_01_LAYOUT.GROUND_Y } });
  p.updateJammerReinforcements(5000);
  assert.strictEqual(window.enemyManager.enemies.filter(e => e._jammerReinforcement).length, 1, 'jammer reinforcement spawns through planner');
  assert.strictEqual(p.missionDefeats, 20, 'reinforcements do not increase mission quota');
}
{
  const { window } = loadRealSector();
  const bossStates = ['walk', 'flourish', 'idle'];
  const heights = bossStates.map(state => window.BARCODE.Level01Presentation.bossTransform({ x: 0, y: 890, state }).height);
  heights.forEach(h => assert(Math.abs(h - 260) <= 8, 'boss apparent height within about 3%'));
}
console.log('Level 1 mission static and real-module VM checks passed');
