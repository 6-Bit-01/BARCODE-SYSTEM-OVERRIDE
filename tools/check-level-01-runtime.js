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
  return { calls, save:fn('save'), restore:fn('restore'), fillRect:fn('fillRect'), strokeRect:fn('strokeRect'), clearRect:fn('clearRect'), beginPath:fn('beginPath'), moveTo:fn('moveTo'), lineTo:fn('lineTo'), closePath:fn('closePath'), fill:fn('fill'), stroke:fn('stroke'), arc:fn('arc'), translate:fn('translate'), rotate:fn('rotate'), scale:fn('scale'), fillText:fn('fillText'), drawImage:fn('drawImage'), createLinearGradient(){ return { addColorStop(){} }; }, measureText(text){ return { width: String(text).length * 8 }; } };
}

// UI runtime: drawGameUI must execute with minimal mocks and no missing helper ReferenceError.
{
  const c = ctx();
  const w = c.window;
  Object.assign(w, { gameState: { score: 10, collectionMessage: null, gameOver: false, paused: false }, player: { health: 3, maxHealth: 3 }, renderer: { drawHealthBar(){}, drawGlowText(){} }, tutorialSystem: { isCompleted: () => true, isActive: () => false }, objectivesSystem: { getVisibleObjectives: () => [] }, lostDataSystem: { getProgress: () => ({ collected: 0, total: 3 }) }, rhythmSystem: { isActive: () => false }, hackingSystem: { isActive: () => false }, loreSystem: { messages: [] } });
  run(c, 'src/game/ui-manager.js');
  assert.strictEqual(typeof w.drawGameUI, 'function');
  const canvas = mockCanvas();
  assert.doesNotThrow(() => w.drawGameUI(canvas), 'drawGameUI should not throw missing helper errors');
  assert(canvas.calls.some(c => c.name === 'fillRect' && c.args[0] === 30 && c.args[1] === 30 && c.args[2] === 340), 'health panel background is preserved');
  assert(canvas.calls.some(c => c.name === 'fillRect' && c.args[0] === 760 && c.args[1] === 30 && c.args[2] === 400), 'level progress panel background is preserved');
  const scoreTexts = canvas.calls.filter(c => c.name === 'fillText' && String(c.args[0]).includes('SCORE:'));
  assert.strictEqual(scoreTexts.length, 0, 'renderer-owned score is not duplicated by fallback when renderer is present');
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
  const complete = w.DEBUG.level1.completeEncounters();
  assert.strictEqual(complete.state, 'jammer_active', 'completeEncounters enters Jammer reveal path');
}
{
  const c = ctx(''); const w = c.window;
  run(c, 'src/game/debug-commands.js'); run(c, 'src/game/level-01-debug.js');
  assert(!w.DEBUG.level1, 'normal build exposes no usable DEBUG.level1 cheats');
  assert.strictEqual(w.BARCODE.DEBUG_LEVEL_1_ENABLED, false, 'normal build debug flag false');
  assert.strictEqual(JSON.stringify(w.DEBUG.revealJammer()), JSON.stringify({ ok: false, action: 'revealJammer', reason: 'debug-disabled' }));
  assert.strictEqual(JSON.stringify(w.handleGameAction('spawn_enemy')), JSON.stringify({ ok: false, action: 'spawn_enemy', reason: 'debug-disabled' }));
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
  assert.strictEqual(w.BARCODE.Level01Camera.worldToScreen({ x: 2048, y: 890 }, { cameraCenter: 2048, zoom: 1 }).y, 890);
  assert.strictEqual(w.BARCODE.Level01Camera.worldToScreen({ x: 2048, y: 890 }, { cameraCenter: 2048, zoom: 0.8 }).y, 425 + 50 + (890 - 425) * 0.8);
  assert.strictEqual(w.BARCODE.Level01Camera.worldToScreen({ x: 2048, y: 890 }, { cameraCenter: 2048, zoom: 0.625 }).y, 425 + 93.75 + (890 - 425) * 0.625);
  assert(Math.abs(w.BARCODE.LEVEL_01_LAYOUT.FOREGROUND.footPlaneRatio - 400 / 462) < 1e-12);
}

// Behavioral parallax layer draw: foreground uses 1:1 camera mapping; background keeps scrollFactor parallax.
{
  const c = ctx(); const w = c.window;
  w.Image = function(){}; w.clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  run(c, 'src/game/level-01-layout.js'); run(c, 'src/engine/parallax.js');
  const bg = new w.ParallaxBackground();
  const background = bg.addLayer({ image: { width: 1279, height: 462 }, role: 'background', scrollFactorX: 0.5, x: 0, y: -100, width: 4096, height: 1479 });
  const foreground = bg.addLayer({ image: { width: 1279, height: 462 }, role: 'foreground', scrollFactorX: 1, x: 0, y: -200, width: 4096, height: 1479 });
  bg.updateCamera(2048, 890);
  const canvas = mockCanvas();
  bg.drawLayer(canvas, background); bg.drawLayer(canvas, foreground);
  const draws = canvas.calls.filter(call => call.name === 'drawImage');
  assert.strictEqual(draws[0].args[1], 0, 'background uses half-rate parallax at world center');
  assert.strictEqual(draws[1].args[1], -1088, 'foreground uses exact 960-cameraCenterX mapping');
  assert(Math.abs(draws[1].args[2] - (890 - 1479 * (400 / 462))) < 1e-9, 'foreground foot plane aligns to ground');
}

// Real sprite dimensions produce stable target heights.
{
  const c = ctx(); const w = c.window;
  run(c, 'src/game/level-01-layout.js');
  const L = w.BARCODE.LEVEL_01_LAYOUT.PRESENTATION;
  assert.deepStrictEqual({ width: L.player.manifests.idle.width, height: L.player.manifests.idle.height, anchorX: L.player.manifests.idle.anchorX, anchorY: L.player.manifests.idle.anchorY }, { width: 86, height: 96, anchorX: 43, anchorY: 95 });
  assert.deepStrictEqual({ width: L.enemies.virus.manifests.idle.width, height: L.enemies.virus.manifests.idle.height, anchorX: L.enemies.virus.manifests.idle.anchorX, anchorY: L.enemies.virus.manifests.idle.anchorY }, { width: 96, height: 93, anchorX: 48, anchorY: 92 });
  assert.deepStrictEqual({ width: L.enemies.firewall.manifests.attack.width, height: L.enemies.firewall.manifests.attack.height, anchorX: L.enemies.firewall.manifests.attack.anchorX, anchorY: L.enemies.firewall.manifests.attack.anchorY }, { width: 96, height: 67, anchorX: 48, anchorY: 66 });
  assert.deepStrictEqual({ width: L.jammer.manifest.width, height: L.jammer.manifest.height, anchorX: L.jammer.manifest.anchorX, anchorY: L.jammer.manifest.anchorY }, { width: 256, height: 219, anchorX: 128, anchorY: 214 });
  for (const state of ['idle','jump','walk','rhythm']) assert.strictEqual(Math.round(w.BARCODE.Level01Presentation.playerTransform({ state, position: { x: 0, y: 890 }, facing: 1 }).anchorY), 192);
  const corruptedIdle = w.BARCODE.Level01Presentation.enemyTransform({ type: 'corrupted', currentAnimation: 'idle', position: { x: 500, y: 890 }, facing: 1 });
  const corruptedWalk = w.BARCODE.Level01Presentation.enemyTransform({ type: 'corrupted', currentAnimation: 'walk', position: { x: 500, y: 890 }, facing: 1 });
  assert.strictEqual(corruptedIdle.y + corruptedIdle.anchorY, 890, 'corrupted idle foot anchor remains fixed');
  assert.strictEqual(corruptedWalk.y + corruptedWalk.anchorY, 890, 'corrupted walk foot anchor remains fixed');
  const firewallAttack = w.BARCODE.Level01Presentation.enemyTransform({ type: 'firewall', currentAnimation: 'attack', position: { x: 800, y: 890 }, facing: 1 });
  const firewallWalk = w.BARCODE.Level01Presentation.enemyTransform({ type: 'firewall', currentAnimation: 'walk', position: { x: 800, y: 890 }, facing: 1 });
  assert.strictEqual(Math.round(firewallAttack.anchorY), 176);
  assert.strictEqual(Math.round(firewallWalk.anchorY), 176);
  for (const state of ['walk','flourish','idle']) assert(Math.abs(w.BARCODE.Level01Presentation.bossTransform({ x: 0, y: 890, state }).anchorY - 260) <= 0.001);
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


// Render order: platform geometry must draw before Jammer, enemies, boss/progression actors, and player.
{
  const c = ctx(); const w = c.window; const order = [];
  const canvasCtx = mockCanvas();
  c.document.getElementById = () => ({ width: 1920, height: 1080, getContext: () => canvasCtx });
  w.renderer = { clear(){ order.push('clear'); }, zoomLevel: 1, screenShake: { x: 0, y: 0 }, applyPostEffects(){} };
  w.clamp = (v,min,max)=>Math.max(min,Math.min(max,v));
  w.player = { position: { x: 960, y: 890 }, draw(){ order.push('player'); } };
  w.parallaxBackground = { updateCamera(){}, getLayer(){ return null; } };
  w.spaceShipSystem = { drawNormalShips(){}, drawForegroundShips(){} };
  w.particleSystem = { particles: [] };
  w.enemyManager = { draw(){ order.push('enemies'); } };
  w.sector1Progression = { getCameraX:x=>x, drawWorldGeometry(){ order.push('platforms'); }, drawActors(){ order.push('boss'); } };
  w.BARCODE = { LEVEL_01_LAYOUT: { WORLD_WIDTH: 4096, GROUND_Y: 890 }, JammerEnvironment: { draw(){ order.push('jammer'); } } };
  w.tutorialSystem = { isActive: () => false };
  w.drawGameUI = () => order.push('ui');
  w.jammerIndicator = { draw: () => order.push('arrow') };
  run(c, 'src/game/render-coordinator.js');
  w.renderGame();
  assert(order.indexOf('platforms') < order.indexOf('jammer'), 'platforms draw before Jammer');
  assert(order.indexOf('platforms') < order.indexOf('enemies'), 'platforms draw before enemies');
  assert(order.indexOf('enemies') < order.indexOf('boss'), 'enemies draw before boss/progression actors');
  assert(order.indexOf('boss') < order.indexOf('player'), 'boss/progression actors draw before player');
  assert(order.indexOf('ui') < order.indexOf('arrow'), 'Jammer arrow remains in restored UI pass after HUD');
}

console.log('Level 1 runtime behavioral checks passed');
