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
const loopSource = fs.readFileSync('src/core/loop.js','utf8');
const objectives = fs.readFileSync('src/game/objectives.js','utf8');
const updateCoordinator = fs.readFileSync('src/game/update-coordinator.js','utf8');
const indicatorSource = fs.readFileSync('src/engine/jammer-indicator.js','utf8');
const debugSource = fs.readFileSync('src/game/level-01-debug.js','utf8');
const uiSource = fs.readFileSync('src/game/ui-manager.js','utf8');
const playerSource = fs.readFileSync('src/game/player.js','utf8');
const indexSource = fs.readFileSync('index.html','utf8');
const spriteManifest = JSON.parse(fs.readFileSync('sprites-manifest.json','utf8'));
function must(text, re, msg) { assert(re.test(text), msg); }
function approximately(actual, expected, message, epsilon = 0.000001) { assert(Math.abs(actual - expected) <= epsilon, `${message}: expected ${expected}, received ${actual}`); }

const encounterBlocks = [...sectorSource.matchAll(/\{ id: 'encounter_\d'[^]*?enemies: \[([^]*?)\] \}/g)];
assert.strictEqual(encounterBlocks.length, 4, 'four authored encounter definitions');
const counts = encounterBlocks.map(m => (m[1].match(/type: '/g) || []).length);
assert.strictEqual(counts.reduce((a,b)=>a+b,0), 20, 'exactly 20 quota enemies');
assert.deepStrictEqual(counts, [4,5,5,6], 'encounter counts are 4/5/5/6');
must(sectorSource, /STAGE_SURFACES = Object\.freeze/, 'single stage surface data exists');
must(sectorSource, /ENCOUNTER_GATES = Object\.freeze/, 'single gate data exists');
must(sectorSource, /previousVisualFootY > surface\.y \|\| currentVisualFootY < surface\.y[^]*crossingT[^]*crossingX/, 'platform tunneling prevention resolves the horizontal visual-foot position at the vertical crossing');
must(sectorSource, /const footHalfWidth = 18;/, 'platform collision uses the narrow player foot probe');
must(playerSource, /static get VISUAL_FOOT_OFFSET_Y\(\) \{ return PLAYER_VISUAL_FOOT_OFFSET_Y; \}/, 'Player publishes the canonical visual-foot offset');
must(sectorSource, /const PLAYER_VISUAL_FOOT_OFFSET = window\.Player\.VISUAL_FOOT_OFFSET_Y;/, 'Level 1 platforms and boss presentation consume the player-owned visual-foot contract');
must(sectorSource, /player\.position\.y = landing\.surface\.y - PLAYER_VISUAL_FOOT_OFFSET;/, 'platform landing keeps art y separate from the player physics anchor');
must(sectorSource, /!landing \|\| crossingT < landing\.crossingT/, 'multi-surface descent resolves the earliest crossed ledge');
must(playerSource, /this\.speed = 300;/, 'Level 1 route contract uses the locked 300px\/s player speed');
must(playerSource, /const PLAYER_VERTICAL_TRAVERSAL_SCALE = 1\.3;/, 'Level 1 declares one proportional vertical traversal scale');
must(playerSource, /this\.jumpPower = 800 \* PLAYER_VERTICAL_TRAVERSAL_SCALE;/, 'Level 1 scales the single-jump impulse without changing its timing curve');
must(playerSource, /this\.jumpTime < 100[^]*gravity = 100 \* PLAYER_VERTICAL_TRAVERSAL_SCALE[^]*this\.jumpTime < 200[^]*gravity = 400 \* PLAYER_VERTICAL_TRAVERSAL_SCALE[^]*gravity = 2000 \* PLAYER_VERTICAL_TRAVERSAL_SCALE/s, 'Level 1 proportionally scales all three jump gravity phases');
must(playerSource, /const terminalVelocity = 1200 \* PLAYER_VERTICAL_TRAVERSAL_SCALE;/, 'Level 1 proportionally scales terminal fall speed');
must(enemies, /updateAuthoredEntrance\(deltaTime\)[^]*keepEntranceTargetSafe\(this\)[^]*const dx = this\._entranceTarget\.x - this\.position\.x;/, 'authored entrances revalidate their target against the live player position');
must(sectorSource, /isCompleted\(\) && typeof window\.tutorialSystem\.isActive === 'function' && !window\.tutorialSystem\.isActive\(\)/, 'mission requires completed and inactive tutorial');
must(sectorSource, /captureCinematicStart\(\)[^]*gameCamera\.centerX/, 'Jammer destruction captures gameCamera.centerX immediately');
must(sectorSource, /transitionToPan\(\)[^]*if \(!Number\.isFinite\(this\.panStartX\)\) this\.captureCinematicStart\(\)/, 'pan reuses captured start');
must(sectorSource, /getForegroundCoverageZoomFloor[^]*leftFloor[^]*rightFloor/, 'cinematic camera derives a locked-foreground coverage floor for both screen edges');
must(sectorSource, /updatePan\(delta\)[^]*Math\.max\(desiredZoom, getForegroundCoverageZoomFloor\(this\.cameraX\)\)/, 'pan couples camera motion to a seam-safe zoom floor');
must(sectorSource, /updateCameraReturn\(delta\)[^]*Math\.max\(desiredZoom, getForegroundCoverageZoomFloor\(this\.cameraX\)\)/, 'camera return keeps intermediate frames seam-safe');
must(sectorSource, /isBossCinematicActive\(\)/, 'boss cinematic exposes a semantic activity query for presentation owners');
must(loopSource, /getCinematicZoomOverride[^]*setCinematicZoomOverride/, 'game loop routes the authored cinematic zoom into the renderer override');
must(loopSource, /!hasCinematicZoom[^]*updateZoomFromPlayer/, 'automatic player zoom cannot overwrite an active cinematic zoom');
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
must(debugSource, /handleCanvasPointer\(event\) \{\s*if \(isBossCinematicActive\(\)\) return;/, 'hidden Level 1 debug controls cannot receive pointer actions during the boss cinematic');
must(debugSource, /drawOverlay\(ctx\) \{\s*if \(!ctx \|\| isBossCinematicActive\(\)\) return;/, 'Level 1 debug overlay stays hidden for the full boss cinematic');
must(indexSource, /R<\/span> - Rhythm Mode[^]*Down Arrow<\/span> - Beat Attack/, 'visible controls distinguish Rhythm Mode from the Down Arrow beat attack');
must(uiSource, /tutorialCompleted && !bossCinematicActive/, 'mission objectives hide during the boss cinematic and restore afterward');
must(uiSource, /!bossCinematicActive && window\.jammerIndicator/, 'Jammer guidance hides during the boss cinematic');
must(uiSource, /!bossCinematicActive && window\.DEBUG\?\.level1\?\.drawOverlay/, 'Level 1 DEV presentation hides during the boss cinematic');
must(uiSource, /WAVE \$\{cue\.wave\} \/ \$\{cue\.total\}/, 'authored encounter wave labels are presented');
must(uiSource, /CLEARED`/, 'encounter completion receives a restrained clear cue');

function createVectorClass() {
  return class Vector2D { constructor(x, y) { this.x = x; this.y = y; } multiply(n) { return new Vector2D(this.x * n, this.y * n); } add(v) { return new Vector2D(this.x + v.x, this.y + v.y); } };
}
function loadRealSector({ spriteLoadedInitially = false } = {}) {
  let spriteLoaded = spriteLoadedInitially;
  const sprite = { playCalls: [], updateCalls: 0, currentRef: null, isLoaded: () => spriteLoaded, play(name, loop) { this.playCalls.push({ name, loop }); this.currentRef = { currentFrame: 0, totalFrames: name === 'sector_1_boss_walk_walk' ? 41 : 48, isInterrupted: false }; return this.currentRef; }, update(dt) { this.updateCalls += 1; this.lastUpdate = dt; } };
  const jammerStatus = { revealed: false, destroyed: false, health: 16, position: { x: 3520, y: 750 } };
  const jammerEnvironment = {
    reset() { jammerStatus.revealed = false; jammerStatus.destroyed = false; jammerStatus.health = 16; },
    reveal(options = {}) { jammerStatus.revealed = true; jammerStatus.destroyed = false; jammerStatus.position = { ...(options.position || jammerStatus.position) }; return this.getStatus(); },
    getStatus() { return { ...jammerStatus, position: { ...jammerStatus.position } }; }
  };
  const window = {
    FILE_MANIFEST: [],
    BARCODE: { JammerEnvironment: jammerEnvironment },
    Player: { VISUAL_FOOT_OFFSET_Y: 72 },
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
    { id: 'signal-awning', x: 736, y: 492, w: 529, h: 8 },
    { id: 'cache-awning', x: 1534, y: 330, w: 278, h: 8 },
    { id: 'firewall-canopy', x: 1936, y: 358, w: 582, h: 8 },
    { id: 'relay-rooftop', x: 2580, y: 196, w: 574, h: 8 },
    { id: 'tower-rooftop', x: 3154, y: 275, w: 609, h: 8 },
    { id: 'tower-awning', x: 3292, y: 502, w: 402, h: 8 },
    { id: 'broadcast-awning', x: 3777, y: 502, w: 319, h: 8 }
  ], 'Level 1 platform rectangles stay calibrated to real awnings and rooftops');
  assert.strictEqual(window.Sector1Progression.PLAYER_VISUAL_FOOT_OFFSET, 72, 'Level 1 publishes the canonical visual-foot offset');
}
{
  const { window } = loadRealSector();
  const surfaces = new Map(window.Sector1Progression.STAGE_SURFACES.map(surface => [surface.id, surface]));
  const foreground = { sourceWidth: 1279, sourceHeight: 462, drawWidth: 4400, drawHeight: 1589, drawX: -152, drawY: -550 };
  const visualContracts = [
    { id: 'signal-awning', left: 258, right: 412, top: 303 },
    { id: 'cache-awning', left: 490, right: 571, top: 256 },
    { id: 'firewall-canopy', left: 607, right: 776, top: 264 },
    { id: 'relay-rooftop', left: 794, right: 961, top: 217 },
    { id: 'tower-rooftop', left: 961, right: 1138, top: 240 },
    { id: 'tower-awning', left: 1001, right: 1118, top: 306 },
    { id: 'broadcast-awning', left: 1142, right: 1278, top: 306 }
  ];
  const projectX = sourceX => sourceX * foreground.drawWidth / foreground.sourceWidth + foreground.drawX;
  const projectY = sourceY => sourceY * foreground.drawHeight / foreground.sourceHeight + foreground.drawY;
  visualContracts.forEach(contract => {
    const surface = surfaces.get(contract.id);
    assert(surface, `${contract.id} visual platform exists`);
    approximately(surface.x, projectX(contract.left), `${contract.id} starts on its foreground ledge`, 1);
    approximately(surface.x + surface.w, Math.min(4096, projectX(contract.right)), `${contract.id} ends on its foreground ledge or the world boundary`, 1);
    approximately(surface.y, projectY(contract.top), `${contract.id} feet line matches its foreground top edge`, 1);
  });
  const authoredSurfaces = [...surfaces.values()];
  const intentionalVerticalPairs = new Set(['tower-awning|tower-rooftop']);
  const observedVerticalPairs = new Set();
  for (let leftIndex = 0; leftIndex < authoredSurfaces.length; leftIndex++) {
    for (let rightIndex = leftIndex + 1; rightIndex < authoredSurfaces.length; rightIndex++) {
      const left = authoredSurfaces[leftIndex];
      const right = authoredSurfaces[rightIndex];
      const horizontalOverlap = Math.min(left.x + left.w, right.x + right.w) - Math.max(left.x, right.x);
      if (horizontalOverlap <= 0) continue;
      const pair = [left.id, right.id].sort().join('|');
      observedVerticalPairs.add(pair);
      assert(intentionalVerticalPairs.has(pair), `${pair} is not an approved real roof/awning pair`);
    }
  }
  assert.deepStrictEqual([...observedVerticalPairs].sort(), [...intentionalVerticalPairs].sort(), 'the tower roof and striped awning are the only vertically paired platforms');
  const towerRoof = surfaces.get('tower-rooftop');
  const towerAwning = surfaces.get('tower-awning');
  assert(towerAwning.x >= towerRoof.x && towerAwning.x + towerAwning.w <= towerRoof.x + towerRoof.w, 'striped awning is nested beneath its tower rooftop');
}
{
  const { window } = loadRealSector();
  const surfaces = new Map(window.Sector1Progression.STAGE_SURFACES.map(surface => [surface.id, surface]));
  const physics = { speed: 300, verticalScale: 1.3, jumpPower: 800 * 1.3, footHalfWidth: 18, frameMs: 16 };
  const supportedFrameStepsMs = [8, 16, 20, 24, 1000 / 30];

  function descendingCrossingTime(fromY, toY, frameMs = physics.frameMs) {
    // Simulate Player.position.y through the authored jump. Surface coordinates
    // are visible-foot lines, 72px below the historical physics anchor.
    let anchorY = fromY - window.Sector1Progression.PLAYER_VISUAL_FOOT_OFFSET;
    let velocityY = -physics.jumpPower;
    let jumpTime = 0;
    let elapsed = 0;
    for (let frame = 0; frame < 180; frame++) {
      const previousVisualFootY = anchorY + window.Sector1Progression.PLAYER_VISUAL_FOOT_OFFSET;
      jumpTime += frameMs;
      const gravity = (jumpTime < 100 ? 100 : jumpTime < 200 ? 400 : 2000) * physics.verticalScale;
      velocityY += gravity * (frameMs / 1000);
      anchorY += velocityY * (frameMs / 1000);
      const visualFootY = anchorY + window.Sector1Progression.PLAYER_VISUAL_FOOT_OFFSET;
      elapsed += frameMs;
      if (velocityY >= 0 && previousVisualFootY <= toY && visualFootY >= toY) return elapsed / 1000;
    }
    return null;
  }

  function groundReturnTime(verticalScale, frameMs) {
    let displacementY = 0;
    let velocityY = -800 * verticalScale;
    let jumpTime = 0;
    let elapsed = 0;
    for (let frame = 0; frame < 180; frame++) {
      const previousDisplacementY = displacementY;
      jumpTime += frameMs;
      const gravity = (jumpTime < 100 ? 100 : jumpTime < 200 ? 400 : 2000) * verticalScale;
      velocityY = Math.min(velocityY + gravity * (frameMs / 1000), 1200 * verticalScale);
      displacementY += velocityY * (frameMs / 1000);
      elapsed += frameMs;
      if (previousDisplacementY < 0 && displacementY >= 0) return elapsed;
    }
    return null;
  }

  function edgeProbeGap(from, to) {
    // Runtime landing accepts any overlap of the 36px foot probe. Model the
    // farthest supported takeoff and the first valid pixel of landing overlap.
    if (to.x >= from.x + from.w) return Math.max(0, to.x - (from.x + from.w) - physics.footHalfWidth * 2 + 2);
    if (from.x >= to.x + to.w) return Math.max(0, from.x - (to.x + to.w) - physics.footHalfWidth * 2 + 2);
    return 0;
  }

  function assertReachable(fromId, toId, routeName) {
    const from = surfaces.get(fromId);
    const to = surfaces.get(toId);
    assert(from && to, `${routeName}: authored endpoints exist`);
    const requiredTravel = edgeProbeGap(from, to);
    supportedFrameStepsMs.forEach(frameMs => {
      const airTime = descendingCrossingTime(from.y, to.y, frameMs);
      assert.notStrictEqual(airTime, null, `${routeName}: ${fromId} can reach ${toId}'s height with the locked single jump at ${frameMs}ms frames`);
      const availableTravel = physics.speed * airTime;
      const controlTolerance = physics.speed * frameMs / 1000 * 2;
      assert(requiredTravel + controlTolerance <= availableTravel, `${routeName}: ${fromId} -> ${toId} needs ${requiredTravel.toFixed(1)}px plus ${controlTolerance.toFixed(1)}px control tolerance but the locked jump covers ${availableTravel.toFixed(1)}px at ${frameMs}ms frames`);
    });
  }

  const mainRoute = [
    ['signal-awning', 'cache-awning'],
    ['cache-awning', 'firewall-canopy'],
    ['firewall-canopy', 'relay-rooftop'],
    ['relay-rooftop', 'tower-rooftop'],
    ['tower-rooftop', 'broadcast-awning']
  ];
  mainRoute.forEach(([from, to]) => {
    assertReachable(from, to, 'forward roof route');
    assertReachable(to, from, 'reverse roof route');
  });
  [
    ['tower-awning', 'tower-rooftop'],
    ['tower-awning', 'broadcast-awning']
  ].forEach(([from, to]) => {
    assertReachable(from, to, 'tower awning route');
    assertReachable(to, from, 'tower awning return route');
  });
  const groundVisualFoot = { id: 'ground', x: 0, y: 750 + window.Sector1Progression.PLAYER_VISUAL_FOOT_OFFSET, w: 4096 };
  supportedFrameStepsMs.forEach(frameMs => {
    assert.strictEqual(groundReturnTime(physics.verticalScale, frameMs), groundReturnTime(1, frameMs), `proportional vertical scaling preserves jump airtime at ${frameMs}ms frames`);
  });
  ['signal-awning', 'tower-awning', 'broadcast-awning'].forEach(id => {
    const target = surfaces.get(id);
    supportedFrameStepsMs.forEach(frameMs => {
      assert.notStrictEqual(descendingCrossingTime(groundVisualFoot.y, target.y, frameMs), null, `${id} is reachable from ground with the locked single jump at ${frameMs}ms frames`);
    });
  });
}
{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  const surface = window.Sector1Progression.STAGE_SURFACES[0];
  const visualFootOffset = window.Sector1Progression.PLAYER_VISUAL_FOOT_OFFSET;
  const makePlayer = (x, velocityY = 8) => ({
    position: { x, y: surface.y - visualFootOffset + 20 },
    velocity: { x: 0, y: velocityY },
    width: 180,
    grounded: false,
    getHitbox: () => ({ x: surface.x - 200, y: 0, width: 400, height: 100 })
  });
  const landing = makePlayer(surface.x + surface.w / 2);
  assert.strictEqual(p.applyPlayerStageCollision(landing, { previousFootY: surface.y - visualFootOffset - 20, currentFootY: surface.y - visualFootOffset + 20 }), true, 'descending player lands when the visual-foot probe crosses an authored ledge');
  assert.strictEqual(landing.position.y, surface.y - visualFootOffset, 'landing snaps the physics anchor so visible feet meet the authored ledge y');
  assert.strictEqual(landing.velocity.y, 0, 'landing clears downward velocity');
  assert.strictEqual(landing.grounded, true, 'landing marks the player grounded');

  const outside = makePlayer(surface.x - 18);
  assert.strictEqual(p.applyPlayerStageCollision(outside, { previousFootY: surface.y - visualFootOffset - 20, currentFootY: surface.y - visualFootOffset + 20 }), false, 'a broad visual hitbox cannot catch a ledge when the 36px foot probe is outside it');
  const edge = makePlayer(surface.x - 17);
  assert.strictEqual(p.applyPlayerStageCollision(edge, { previousFootY: surface.y - visualFootOffset - 20, currentFootY: surface.y - visualFootOffset + 20 }), true, 'one pixel of foot-probe overlap can land on the ledge edge');
  const rising = makePlayer(surface.x + 40, -8);
  assert.strictEqual(p.applyPlayerStageCollision(rising, { previousFootY: surface.y - visualFootOffset + 20, currentFootY: surface.y - visualFootOffset - 20 }), false, 'one-way ledges remain passable from below while rising');

  const enteringAfterCrossing = makePlayer(surface.x + 20);
  assert.strictEqual(p.applyPlayerStageCollision(enteringAfterCrossing, { previousFootY: surface.y - visualFootOffset - 10, currentFootY: surface.y - visualFootOffset + 20, previousX: surface.x - 40 }), false, 'moving onto a ledge only after passing its height cannot edge-snag');
  const leavingAfterCrossing = makePlayer(surface.x + surface.w + 40);
  assert.strictEqual(p.applyPlayerStageCollision(leavingAfterCrossing, { previousFootY: surface.y - visualFootOffset - 10, currentFootY: surface.y - visualFootOffset + 20, previousX: surface.x + surface.w - 10 }), true, 'moving off a ledge after crossing its height still records the valid landing');

  window.Sector1Progression.STAGE_SURFACES.forEach(authoredSurface => {
    const surfaceLanding = makePlayer(authoredSurface.x + authoredSurface.w / 2);
    surfaceLanding.position.y = authoredSurface.y - visualFootOffset + 20;
    assert.strictEqual(p.applyPlayerStageCollision(surfaceLanding, {
      previousFootY: authoredSurface.y - visualFootOffset - 20,
      currentFootY: authoredSurface.y - visualFootOffset + 20,
      previousX: authoredSurface.x + authoredSurface.w / 2
    }), true, `${authoredSurface.id} accepts a descending visible-foot crossing`);
    assert.strictEqual(surfaceLanding.position.y + visualFootOffset, authoredSurface.y, `${authoredSurface.id} settles the visible foot exactly on its authored pixel line`);
  });

  const relayRoof = window.Sector1Progression.STAGE_SURFACES.find(candidate => candidate.id === 'relay-rooftop');
  const seamFall = makePlayer(relayRoof.x + relayRoof.w);
  seamFall.position.y = 300 - visualFootOffset;
  assert.strictEqual(p.applyPlayerStageCollision(seamFall, {
    previousFootY: 150 - visualFootOffset,
    currentFootY: 300 - visualFootOffset,
    previousX: relayRoof.x + relayRoof.w
  }), true, 'a foot probe spanning an architectural seam still finds a valid landing');
  assert.strictEqual(seamFall.position.y + visualFootOffset, relayRoof.y, 'a seam-crossing fall lands on the earliest surface crossed');
}
{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  const fills = [];
  const strokes = [];
  const ctx = {
    save() {}, restore() {},
    fillRect(...args) { fills.push(args); },
    strokeRect(...args) { strokes.push(args); }
  };
  p.closedGateEncounterId = 'encounter_2';
  p.drawEncounterGates(ctx);
  assert.deepStrictEqual(fills, [[2110, 620, 34, 270]], 'only the currently closed encounter gate is filled');
  assert.deepStrictEqual(strokes, [[2110, 620, 34, 270]], 'only the currently closed encounter gate is outlined');
  p.closedGateEncounterId = null;
  p.drawEncounterGates(ctx);
  assert.strictEqual(fills.length, 1, 'open gates leave no translucent collision-looking rectangles behind');
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
  window.player.position.x = 2048;
  window.player.position.y = 700;
  window.renderer = { getZoomLevel: () => 1 };
  const p = new window.Sector1Progression(window.player);
  const bounds = p.getVisibleWorldBounds();
  const tutorialEnemy = p.spawnTutorialEnemy(0);
  const half = p.getSpawnBodyHalfWidth(tutorialEnemy.type);
  assert(tutorialEnemy.position.x + half <= bounds.left - 140 || tutorialEnemy.position.x - half >= bounds.right + 140, 'tutorial enemy is created fully beyond a horizontal camera edge');
  assert.strictEqual(tutorialEnemy.position.y, 750, 'tutorial enemy starts on the authored ground instead of dropping over the player');
  assert.strictEqual(tutorialEnemy._dropEdge, null, 'tutorial enemy does not use a legacy top-drop entrance');
  assert.strictEqual(tutorialEnemy._isTutorialEnemy, true, 'tutorial enemy is explicitly identified');
  assert.strictEqual(tutorialEnemy._sector1MissionEnemy, false, 'tutorial enemy is excluded from the 20-kill mission quota');
  assert.strictEqual(tutorialEnemy._jammerReinforcement, false, 'tutorial enemy is not mislabeled as a Jammer reinforcement');
  assert.strictEqual(window.enemyManager.enemies.includes(tutorialEnemy), true, 'tutorial enemy enters through the shared enemy manager');
  assert(Math.abs(tutorialEnemy._entranceTarget.x - window.player.position.x) >= 350 + half, 'tutorial entrance target starts outside the live player exclusion radius');
  p.missionStarted = true;
  p.missionDefeats = 5;
  p.onEnemyDefeated(999, tutorialEnemy);
  assert.strictEqual(p.missionDefeats, 5, 'defeating a tutorial enemy cannot advance mission progress');

  const movingPlayerEnemy = p.spawnMissionEnemy({ type: 'corrupted', x: 3000, y: 650 }, 'live-target', 2, { origin: { x: 900, y: 750, side: 'left' } });
  const initialTargetX = movingPlayerEnemy._entranceTarget.x;
  window.player.position.x = initialTargetX;
  p.keepEntranceTargetSafe(movingPlayerEnemy);
  const requiredClearance = 350 + p.getSpawnBodyHalfWidth(movingPlayerEnemy.type);
  assert.notStrictEqual(movingPlayerEnemy._entranceTarget.x, initialTargetX, 'entrance target moves when the player enters it after spawn');
  assert(Math.abs(movingPlayerEnemy._entranceTarget.x - window.player.position.x) >= requiredClearance, 'revalidated entrance target clears the player by the required live exclusion radius');
  assert(movingPlayerEnemy._entranceTarget.x < window.player.position.x, 'revalidated entrance remains on the enemy approach side instead of crossing through the player');

  window.player.position.x = 960;
  const edgeTutorialEnemy = p.spawnTutorialEnemy(0);
  assert(edgeTutorialEnemy.position.x > window.player.position.x, 'near the left world edge, tutorial spawn uses the available right offscreen edge');
  assert(edgeTutorialEnemy._entranceTarget.x > window.player.position.x + 350, 'near a world edge, the entrance target stays on its spawn side and cannot cross through the player');
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
  window.renderer = { zoomLevel: 0.735, getZoomLevel() { return this.zoomLevel; }, getCinematicZoomOverride() { return null; } };
  p.onJammerDestroyed();
  assert.strictEqual(p.cameraOverrideActive, true, 'camera override enabled immediately');
  assert.strictEqual(p.cameraX, 1475, 'camera captured at destruction center');
  assert.strictEqual(p.panStartX, 1475, 'pan start captured immediately');
  assert.strictEqual(p.cinematicStartZoom, 0.735, 'cinematic captures the exact effective pre-pan zoom');
  assert.strictEqual(p.getCinematicZoomOverride(), 0.735, 'freeze holds the exact captured zoom instead of allowing player auto-zoom drift');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(p.cinematicStartPlayerPosition)), { x: 900, y: 700 }, 'cinematic captures the exact player origin');
  assert.strictEqual(p.frozenPlayerPosition.x, 900, 'player x snapshot captured'); assert.strictEqual(p.frozenPlayerPosition.y, 700, 'player y snapshot captured');
  assert.strictEqual(window.player.velocity.x, 0); assert.strictEqual(window.player.velocity.y, 0);
  window.gameCamera.centerX = 2200; p.update(800); p.update(1);
  assert.strictEqual(p.state, 'camera_pan');
  assert.strictEqual(p.isBossCinematicActive(), true, 'semantic cinematic flag covers the active pan');
  assert.strictEqual(p.panStartX, 1475, 'transitionToPan reuses destruction-time snapshot');
  p.update(0); assert.strictEqual(p.cameraX, 1475, 'first pan frame equals previous gameplay camera center');
  window.player.position.x = 999; window.player.position.y = 999; window.player.velocity.y = 99; p.update(16);
  assert.strictEqual(window.player.position.x, 900, 'suppression freezes player x');
  assert.strictEqual(window.player.position.y, 700, 'suppression freezes player y');
  assert.strictEqual(window.player.velocity.y, 0, 'suppression stops vertical physics');

  const foregroundScreenEdges = () => ({
    left: 960 + p.getCinematicZoomOverride() * (-152 - p.cameraX),
    right: 960 + p.getCinematicZoomOverride() * (4248 - p.cameraX)
  });
  p.update(984);
  let edges = foregroundScreenEdges();
  assert(edges.left <= 0 && edges.right >= 1920, 'mid-pan zoom override keeps both locked-foreground edges beyond the viewport');
  p.update(1000);
  assert.strictEqual(p.state, 'boss_walk_in', 'the liked two-second pan still hands off to the boss walk-in');
  approximately(p.cameraX, 3136, 'boss reveal retains the authored far-right camera frame');
  assert(p.getCinematicZoomOverride() >= 0.92, 'wide boss reveal uses the seam-safe zoom floor');
  edges = foregroundScreenEdges();
  assert(edges.left <= 0 && edges.right >= 1920, 'wide boss reveal cannot expose the background behind the foreground edge');

  p.boss.x = 3480;
  p.updateBossWalk(0);
  assert.strictEqual(p.state, 'boss_close_up', 'boss reaching its mark begins the close-up before the flourish');
  approximately(960 + p.getCinematicZoomOverride() * (p.boss.x - p.cameraX), 1276.48, 'wide reveal frames the boss in the right third before the close-up');
  p.update(500);
  assert.strictEqual(p.state, 'boss_flourish', 'close-up completes into the flourish');
  approximately(p.getCinematicZoomOverride(), 1.08, 'close-up reaches the authored cinematic zoom');
  approximately(960 + p.getCinematicZoomOverride() * (p.boss.x - p.cameraX), 1331.52, 'close-up keeps the boss comfortably inside the right edge');
  p.update(3999);
  assert.strictEqual(p.state, 'boss_flourish', 'flourish keeps the complete one-shot animation on screen');
  p.update(1);
  assert.strictEqual(p.state, 'boss_hold', 'flourish advances only after all 48 frames at 12fps');
  p.update(250);
  assert.strictEqual(p.state, 'camera_return', 'pose hold completes into the camera return');

  p.update(800);
  edges = foregroundScreenEdges();
  assert(edges.left <= 0 && edges.right >= 1920, 'mid-return zoom floor keeps the locked foreground covering the viewport');
  const midReturnBossScreenX = 960 + p.getCinematicZoomOverride() * (p.boss.x - p.cameraX);
  assert(midReturnBossScreenX >= 1380 && midReturnBossScreenX <= 1540, 'boss carries with the returning camera on the right side of the frame');
  p.update(800);
  assert.strictEqual(p.state, 'boss_ready', 'return hands off to the non-combat boss-ready staging state');
  approximately(p.cameraX, 1475, 'return lands on the exact captured pre-pan camera center');
  approximately(p.getCinematicZoomOverride(), 0.735, 'return lands on the exact captured pre-pan zoom');
  approximately(960 + p.getCinematicZoomOverride() * (p.boss.x - p.cameraX), 1440, 'boss ends visible at the authored right-side screen position');
  assert.deepStrictEqual({ x: window.player.position.x, y: window.player.position.y }, { x: 900, y: 700 }, 'player returns to the exact captured arena position');
  assert.strictEqual(window.player.controlsDisabled, false, 'player controls release after the completed return');
  assert.strictEqual(p.cameraOverrideActive, false, 'camera ownership releases after the completed return');
  assert.strictEqual(p.isGameplaySuppressed(), false, 'boss_ready no longer permanently suppresses gameplay');
  assert.strictEqual(p.isBossCinematicActive(), false, 'semantic cinematic flag clears on boss_ready');
  assert.strictEqual(p.boss.canDealDamage, false, 'camera handoff does not falsely enable unwired boss damage');
  assert.strictEqual(p.boss.canReceiveDamage, false, 'camera handoff does not falsely enable unwired boss damage reception');
  p.update(0);
  assert.strictEqual(p.getCinematicZoomOverride(), null, 'cinematic zoom ownership releases one frame after exact restoration');
}
{
  const cameraScenarios = [
    { cameraX: 960, playerX: 420, zoom: 0.926 },
    { cameraX: 2048, playerX: 2048, zoom: 0.625 },
    { cameraX: 3136, playerX: 3670, zoom: 0.926 }
  ];

  for (const scenario of cameraScenarios) {
    const { window } = loadRealSector();
    window.player.position.x = scenario.playerX;
    window.player.position.y = 700;
    window.gameCamera = { centerX: scenario.cameraX };
    window.renderer = {
      getZoomLevel: () => scenario.zoom,
      getCinematicZoomOverride: () => null
    };
    const p = new window.Sector1Progression(window.player);
    p.state = 'jammer_active';
    p.missionStarted = true;
    p.onJammerDestroyed();
    p.update(800);
    p.update(1);
    p.update(2000);
    p.boss.x = window.Sector1Progression.CINEMATIC.bossStopX;
    p.updateBossWalk(0);
    p.update(500);
    p.update(4000);
    p.update(250);
    p.update(1600);

    assert.strictEqual(p.state, 'boss_ready', `camera return completes from ${scenario.cameraX}`);
    approximately(p.cameraX, scenario.cameraX, `camera center restores from ${scenario.cameraX}`);
    approximately(p.getCinematicZoomOverride(), scenario.zoom, `effective zoom restores from ${scenario.cameraX}`);
    approximately(960 + scenario.zoom * (p.boss.x - scenario.cameraX), 1440, `boss arrives in the original arena from ${scenario.cameraX}`);
    assert.strictEqual(window.player.position.x, scenario.playerX, `player position restores from ${scenario.cameraX}`);
    assert.strictEqual(window.player.controlsDisabled, false, `controls release from ${scenario.cameraX}`);
  }
}
{
  const { window } = loadRealSector();
  const p = new window.Sector1Progression(window.player);
  window.BARCODE.DEBUG_LEVEL_1_SESSION = true;
  window.tutorialSystem = { completed: false, active: true };
  p.state = 'boss_ready';
  p.cameraOverrideActive = true;
  p.cameraX = 3136;
  p.cinematicZoomOverride = 1.08;
  p.cinematicZoomReleasePending = true;
  p.frozenPlayerPosition = { x: 1, y: 2 };
  p.jammerDestroyedNotified = true;
  p.boss = { active: true };
  let clearedRendererOverrides = 0;
  window.renderer = { clearCinematicZoomOverride() { clearedRendererOverrides += 1; } };
  p.debugGotoEncounter(2);
  assert.strictEqual(p.state, 'encounter_2', 'debug encounter jump selects the requested encounter');
  assert.strictEqual(p.cameraOverrideActive, false, 'debug encounter jump releases a previous boss camera override');
  assert.strictEqual(p.frozenPlayerPosition, null, 'debug encounter jump clears a previous cinematic player lock');
  assert.strictEqual(p.getCinematicZoomOverride(), null, 'debug encounter jump clears the progression cinematic zoom');
  assert.strictEqual(p.cinematicZoomReleasePending, false, 'debug encounter jump clears a pending one-frame zoom release');
  assert.strictEqual(clearedRendererOverrides, 1, 'debug encounter jump immediately clears the renderer cinematic zoom');
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
  assert.strictEqual(p.getCinematicZoomOverride(), null, 'debug Jammer jump cannot retain a stale cinematic zoom');
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
  p.cameraX = 3000; p.cinematicStartCameraX = 1475; p.cinematicStartZoom = 0.735; p.cinematicZoomOverride = 0.92; p.startBossWalk();
  assert.strictEqual(p.boss.sprite, sprite, 'entrance uses same prepared sprite instance');
  const presentationFrames = [
    {
      state: 'walk', animation: 'sector_1_boss_walk_walk', sourceAnchorX: 100, sourceAnchorY: 253, expectedScale: 0.8,
      footRows: [253,250,248,246,242,241,244,244,243,241,244,247,250,254,254,251,247,246,244,244,245,245,241,241,244,249,251,253,252,250,248,243,241,243,245,244,243,247,248,251,253]
    },
    {
      state: 'flourish', animation: 'sector_1_boss_attack_attack', sourceAnchorX: 128, sourceAnchorY: 154,
      footRows: [126,126,125,120,119,117,118,118,119,119,119,119,119,119,119,119,119,119,116,115,117,120,120,120,120,120,120,120,120,120,154,154,148,146,130,119,119,119,119,119,119,120,124,125,126,126,126,126]
    },
    {
      state: 'idle', animation: 'sector_1_boss_idle_idle', sourceAnchorX: 128, sourceAnchorY: 178,
      footRows: [178,178,178,178,178,173,167,165,161,157,157,157,157,157,160,165,167,170,173,173,173,173,173,173,173,173,173,169,168,165,162,161,159,157,157,157,157,157,157,160,162,165,171,173,176,177,177,177]
    }
  ];
  const bossAnimations = spriteManifest.characters['sector_1_boss_sector1boss'].animations;
  for (const profile of presentationFrames) {
    const animationEntry = bossAnimations[profile.animation];
    assert(animationEntry.metadata?.anchor, `${profile.state} boss animation publishes its anchor through the Makko metadata schema`);
    assert.strictEqual(animationEntry.metadata.anchor.x, profile.sourceAnchorX, `${profile.state} boss metadata preserves the audited horizontal anchor`);
    assert.strictEqual(animationEntry.metadata.anchor.y, profile.sourceAnchorY, `${profile.state} boss metadata preserves the audited foot anchor`);
    assert.deepStrictEqual(animationEntry.metadata.anchor, animationEntry.anchor, `${profile.state} boss compatibility anchor cannot drift from Makko metadata`);
    p.boss.state = profile.state;
    p.boss.activeAnimation = profile.animation;
    for (let frameIndex = 0; frameIndex < profile.footRows.length; frameIndex++) {
      p.boss.animationRef = { currentFrame: frameIndex };
      const visual = p.getBossVisualBounds();
      if (profile.expectedScale !== undefined) approximately(visual.scale, profile.expectedScale, 'boss walk scale remains at the approved baseline');
      approximately(visual.scale * profile.sourceAnchorY, 253 * 0.8, `${profile.state} animation uses the normalized anchor height`);
      assert.strictEqual(visual.frameIndex, frameIndex, `${profile.state} frame index follows the Makko animation reference`);
      assert.strictEqual(visual.footRow, profile.footRows[frameIndex], `${profile.state} frame ${frameIndex} uses the audited visible-foot row`);
      approximately(visual.targetFootY, 822, `${profile.state} frame ${frameIndex} targets the authored sidewalk contact`);
      approximately(visual.visibleFootY, 822, `${profile.state} frame ${frameIndex} stays grounded without sprite-sheet wobble`);
      const makkoRenderedFootY = visual.anchorY - animationEntry.metadata.anchor.y * visual.scale + visual.footRow * visual.scale;
      approximately(makkoRenderedFootY, 822, `${profile.state} frame ${frameIndex} stays grounded after Makko scales its manifest anchor`);
    }
  }
  p.boss.state = 'walk';
  p.boss.activeAnimation = 'sector_1_boss_walk_walk';
  p.updateBossWalk(16); p.updateBossWalk(16);
  assert.deepStrictEqual(sprite.playCalls.map(c => c.name), ['sector_1_boss_walk_walk'], 'walk plays only once on transition');
  p.boss.x = 3480; p.updateBossWalk(16);
  assert(sprite.playCalls.map(c => c.name).includes('sector_1_boss_idle_idle'), 'close-up switches from walk to an idle presentation');
  const before = sprite.updateCalls; p.update(500);
  assert(sprite.updateCalls > before, 'close-up keeps the prepared boss sprite updating');
  assert(sprite.playCalls.map(c => c.name).includes('sector_1_boss_attack_attack'), 'flourish plays after the close-up reaches its mark');
  p.update(3999);
  assert.strictEqual(p.state, 'boss_flourish', 'prepared one-shot is not cut off before its final frame');
  p.update(1); p.update(250);
  assert.strictEqual(p.state, 'camera_return', 'animation sequence advances through flourish and hold into return');
  p.update(1600);
  assert.strictEqual(p.state, 'boss_ready', 'animation sequence finishes at boss_ready after returning');
  assert.strictEqual(sprite.playCalls.at(-1).name, 'sector_1_boss_idle_idle', 'idle plays when boss_ready begins');
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
  const canvasListeners = {};
  const canvas = {
    width: 1920,
    height: 1080,
    addEventListener(type, listener) { canvasListeners[type] = listener; },
    removeEventListener(type) { delete canvasListeners[type]; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1920, height: 1080 }; }
  };
  const drawnText = [];
  const ctx = {
    canvas,
    save() {}, restore() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
    fillRect() {}, strokeRect() {},
    fillText(value) { drawnText.push(String(value)); }
  };
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
      state: 'test', missionDefeats: 0,
      debugSkipTutorial() { routed += 1; return { ok: true, state: 'encounter_1', missionDefeats: 0 }; },
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
  window.DEBUG.level1.drawOverlay(ctx);
  assert(drawnText.includes('DEV ▲'), 'canvas debug launcher renders inside Makko/fullscreen instead of as a hidden DOM sibling');
  assert(drawnText.includes('Skip Tutorial'), 'unlocked canvas debug panel renders its action buttons');
  assert.strictEqual(typeof canvasListeners.pointerdown, 'function', 'drawing the debug launcher attaches a canvas-native pointer route');
  canvasListeners.pointerdown({ button: 0, currentTarget: canvas, clientX: 40, clientY: 767, preventDefault() {}, stopPropagation() {} });
  assert.strictEqual(routed, 1, 'clicking a canvas debug action invokes the real progression method');
  assert.strictEqual(window.DEBUG.level1.gotoJammer().ok, true, 'unlocked debug action routes to Sector1Progression');
  assert.strictEqual(routed, 2, 'direct and canvas debug actions each route exactly once');
  const makkoShortcut = { key: 'd', code: 'KeyD', shiftKey: true, ctrlKey: true, preventDefault() {}, stopPropagation() {} };
  listeners.keydown(makkoShortcut);
  drawnText.length = 0;
  window.DEBUG.level1.drawOverlay(ctx);
  assert(!drawnText.includes('Skip Tutorial'), 'Ctrl+Shift+D closes the canvas panel without disabling debug');
  listeners.keydown(makkoShortcut);
  drawnText.length = 0;
  window.DEBUG.level1.drawOverlay(ctx);
  assert(drawnText.includes('Skip Tutorial'), 'Ctrl+Shift+D reopens the canvas panel in Makko');
  listeners.keydown({ ...makkoShortcut, repeat: true });
  drawnText.length = 0;
  window.DEBUG.level1.drawOverlay(ctx);
  assert(drawnText.includes('Skip Tutorial'), 'held debug shortcuts cannot repeatedly flicker the Makko panel open and closed');
  assert(!/localStorage|sessionStorage|location|URLSearchParams/.test(debugSource), 'Level 1 debug does not persist or require URL parameters');
  assert.strictEqual((indexSource.match(/src\/game\/level-01-debug\.js/g) || []).length, 1, 'index loads Level 1 debug exactly once');
  assert(indexSource.indexOf('src/game/debug-commands.js') < indexSource.indexOf('src/game/level-01-debug.js'), 'Level 1 debug loads after canonical debug commands');
}
console.log('Level 1 mission static and real-module VM checks passed');
