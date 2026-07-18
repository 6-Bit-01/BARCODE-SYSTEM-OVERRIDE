#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function read(f) { return fs.readFileSync(f, 'utf8'); }
function ctx(search = '') {
  const listeners = {};
  const body = { appendChild(){}, children: [] };
  const document = { body, getElementById(id) { return id === 'gameCanvas' ? { width: 1920, height: 1080 } : null; }, createElement() { return { style: {}, append(){}, appendChild(){}, set textContent(v){ this._text = v; }, get textContent(){ return this._text; } }; }, addEventListener(type, fn) { listeners[type] = fn; } };
  const window = { FILE_MANIFEST: [], BARCODE: {}, location: { search }, document, addEventListener(type, fn) { listeners[type] = fn; }, console, setTimeout(){}, clearTimeout(){}, Math };
  window.window = window; window.globalThis = window;
  return vm.createContext({ window, document, console, URLSearchParams, Math, setTimeout(){}, clearTimeout(){} });
}
function run(context, file) { vm.runInContext(read(file), context, { filename: file }); }
function mockCanvas() {
  const calls = [];
  const fn = name => function(...args) { calls.push({ name, args }); return undefined; };
  return { calls, save:fn('save'), restore:fn('restore'), fillRect:fn('fillRect'), strokeRect:fn('strokeRect'), clearRect:fn('clearRect'), beginPath:fn('beginPath'), moveTo:fn('moveTo'), lineTo:fn('lineTo'), closePath:fn('closePath'), fill:fn('fill'), stroke:fn('stroke'), arc:fn('arc'), translate:fn('translate'), rotate:fn('rotate'), scale:fn('scale'), fillText:fn('fillText'), createLinearGradient(){ return { addColorStop(){} }; }, measureText(text){ return { width: String(text).length * 8 }; } };
}

// UI runtime: drawGameUI must execute with minimal mocks and no missing helper ReferenceError.
{
  const c = ctx();
  const w = c.window;
  Object.assign(w, { gameState: { score: 10, collectionMessage: null, gameOver: false, paused: false }, player: { health: 3, maxHealth: 3 }, renderer: { drawHealthBar(){}, drawGlowText(){} }, tutorialSystem: { isCompleted: () => true, isActive: () => false }, objectivesSystem: { getVisibleObjectives: () => [] }, lostDataSystem: { getProgress: () => ({ collected: 0, total: 3 }) }, rhythmSystem: { isActive: () => false }, hackingSystem: { isActive: () => false }, loreSystem: { messages: [] } });
  run(c, 'src/game/ui-manager.js');
  assert.strictEqual(typeof w.drawGameUI, 'function');
  assert.doesNotThrow(() => w.drawGameUI(mockCanvas()), 'drawGameUI should not throw missing helper errors');
}

// Real script order: DEBUG.level1 survives debug-commands and is gated by ?debugLevel1=1 only.
{
  const c = ctx('?debugLevel1=1'); const w = c.window;
  w.BARCODE.JammerEnvironment = { getStatus: () => ({ health: 16, revealed: false }), reset(){}, reveal(){ return {}; }, applyRhythmDamage(){ return { ok: true }; } };
  w.enemyManager = { enemies: [], clear(){} }; w.player = { position: { x: 960, y: 890 }, velocity: { x: 0, y: 0 } }; w.gameState = { enemiesDefeated: 0 };
  run(c, 'src/game/level-01-layout.js'); run(c, 'src/game/sector1-progression.js'); run(c, 'src/game/debug-commands.js'); run(c, 'src/game/level-01-debug.js');
  assert(w.DEBUG && w.DEBUG.level1, 'DEBUG.level1 survives actual script order');
  assert.strictEqual(typeof w.DEBUG.revealJammer, 'function', 'legacy DEBUG helpers preserved');
  assert.strictEqual(w.DEBUG.level1.gotoEncounter(3).missionDefeats, 9, 'debug encounter 3 reconciles prior kills');
}
{
  const c = ctx(''); const w = c.window;
  run(c, 'src/game/debug-commands.js'); run(c, 'src/game/level-01-debug.js');
  assert(!w.DEBUG.level1, 'normal build exposes no usable DEBUG.level1 cheats');
  assert.strictEqual(w.BARCODE.DEBUG_LEVEL_1_ENABLED, false, 'normal build debug flag false');
}

// Numeric camera/foreground mapping and projection.
{
  const c = ctx(); const w = c.window;
  run(c, 'src/game/level-01-layout.js');
  assert.strictEqual(w.BARCODE.Level01Camera.foregroundDrawX(960), 0);
  assert.strictEqual(w.BARCODE.Level01Camera.foregroundDrawX(2048), -1088);
  assert.strictEqual(w.BARCODE.Level01Camera.foregroundDrawX(3136), -2176);
  assert.strictEqual(w.BARCODE.Level01Camera.visibleWorldBounds(960, 1).left, 0);
  assert.strictEqual(w.BARCODE.Level01Camera.visibleWorldBounds(3136, 1).right, 4096);
  assert.strictEqual(w.BARCODE.Level01Camera.worldToScreen({ x: 2048, y: 890 }, { cameraCenter: 2048, zoom: 1 }).x, 960);
}

// Real sprite dimensions produce stable target heights.
{
  const c = ctx(); const w = c.window;
  run(c, 'src/game/level-01-layout.js');
  const L = w.BARCODE.LEVEL_01_LAYOUT.PRESENTATION;
  assert.strictEqual(JSON.stringify(L.player.manifests.idle), JSON.stringify({ width: 86, height: 96 }));
  assert.strictEqual(JSON.stringify(L.enemies.virus.manifests.idle), JSON.stringify({ width: 96, height: 93 }));
  assert.strictEqual(JSON.stringify(L.enemies.firewall.manifests.attack), JSON.stringify({ width: 96, height: 67 }));
  assert.strictEqual(JSON.stringify(L.jammer.manifest), JSON.stringify({ width: 256, height: 219 }));
  for (const state of ['idle','jump','walk','rhythm']) assert.strictEqual(Math.round(w.BARCODE.Level01Presentation.playerTransform({ state, position: { x: 0, y: 890 }, facing: 1 }).height), 192);
  for (const state of ['walk','flourish','idle']) assert(Math.abs(w.BARCODE.Level01Presentation.bossTransform({ x: 0, y: 890, state }).height - 260) <= 0.001);
}

// Progression-owned spawning: generic suppressed in Jammer phase, cap applies to total active enemies, safe edge spawns are offscreen.
{
  const c = ctx(); const w = c.window;
  run(c, 'src/game/level-01-layout.js');
  w.clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  w.player = { position: { x: 10, y: 890 }, velocity: { x: 0, y: 0 } };
  w.renderer = { getZoomLevel: () => 1 };
  w.gameCamera = { centerX: 960 };
  w.gameState = { enemiesDefeated: 20, hasSpawnedInitialEnemies: true };
  w.Enemy = function(x,y,type) { this.position = { x, y }; this.velocity = { x: 0, y: 0 }; this.type = type; this.active = true; this.speed = 150; };
  w.enemyManager = { enemies: [], clear(){ this.enemies = []; }, getActiveEnemies(){ return this.enemies.filter(e => e.active); } };
  w.BARCODE.JammerEnvironment = { reset(){}, reveal(){}, getStatus: () => ({ revealed: true, destroyed: false, position: { x: 3520, y: 890 } }) };
  run(c, 'src/game/sector1-progression.js');
  const p = new w.Sector1Progression(w.player); p.startMission(); p.state = 'jammer_active';
  assert.strictEqual(p.shouldSuppressGenericSpawning(), true, 'legacy generic spawner suppressed during Jammer phase');
  const spawn = p.planSpawn({ type: 'virus', y: 890 });
  const bounds = p.getVisibleWorldBounds();
  assert(spawn.x - 21 >= bounds.right + w.BARCODE.LEVEL_01_LAYOUT.SPAWN.offscreenPadding, 'left-edge spawn is fully offscreen plus padding');
  w.enemyManager.enemies = [{ active: true }, { active: true }, { active: true }, { active: true }];
  p.nextJammerSpawnMs = 0; p.updateJammerReinforcements(5000);
  assert.strictEqual(w.enemyManager.enemies.length, 4, 'Jammer cap counts all active normal enemies');
}

// Entrance/protection on mature simulation clock and no firewall double integration.
{
  const c = ctx(); const w = c.window;
  run(c, 'src/game/level-01-layout.js');
  w.Vector2D = class { constructor(x,y){ this.x=x; this.y=y; } multiply(n){ return new w.Vector2D(this.x*n,this.y*n); } add(v){ return new w.Vector2D(this.x+v.x,this.y+v.y); } };
  w.distance = (a,b,c,d)=>Math.hypot(a-c,b-d); w.clamp = (v,min,max)=>Math.max(min,Math.min(max,v)); w.randomRange = (a,b)=>a;
  w.enemyManager = { getActiveEnemies: () => [] };
  run(c, 'src/game/enemies.js');
  const e = new w.Enemy(2100, 890, 'virus'); e._entranceTarget = { x: 1000, y: 890 }; e._authoredEntranceActive = true; e.entranceComplete = false; e.simulationTimeMs = 5000;
  e.update(16, { position: { x: 900, y: 890 } }, 5000);
  assert.strictEqual(e.entranceComplete, false, 'authored entrance remains in progress');
  assert(e.isSpawnProtected(), 'entering enemy remains protected on mature clock');
  const f = new w.Enemy(1000, 890, 'firewall'); f.entranceComplete = true; f.behaviorState = 'normal'; f.speed = 35; f.update(1000, { position: { x: 2000, y: 890 } }, 6000);
  assert(f.position.x < 1125, 'firewall movement integrates once, not AI plus shared physics');
}

console.log('Level 1 runtime behavioral checks passed');
