const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const fail = (message) => {
  console.error(`frame ownership check failed: ${message}`);
  process.exitCode = 1;
};
const count = (source, pattern) => (source.match(pattern) || []).length;
const functionBody = (source, name) => {
  const marker = source.indexOf(name);
  if (marker === -1) return '';
  const open = source.indexOf('{', marker);
  if (open === -1) return '';
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return '';
};

const loop = read('src/core/loop.js');
const update = read('src/game/update-coordinator.js');
const title = read('src/engine/title-screen.js');
const parallax = read('src/engine/parallax.js');
const player = read('src/game/player.js');
const spaceships = read('src/engine/spaceships.js');
const index = read('index.html');
const design = read('docs/design/LEVEL_01_VERTICAL_SLICE.md');
const enemies = read('src/game/enemies.js');
const knownIssues = read('docs/technical/KNOWN_ISSUES.md');

const enemiesScriptIndex = index.indexOf('<script src="src/game/enemies.js"></script>');
if (enemiesScriptIndex === -1 || index.includes('jammer-fix-patch.js') || index.includes('src/game/' + 'jammer-spawn-logic.js') || index.includes('src/game/' + 'collision-fix.js')) {
  fail('index.html must load canonical enemies.js and must not load late enemy patch scripts.');
}

const scheduleBody = functionBody(loop, 'function scheduleNextGameplayFrame()');
const pauseBody = functionBody(loop, 'window.' + 'pauseGame = function()');
const resumeBody = functionBody(loop, 'window.' + 'resumeGame = function()');
const startBody = functionBody(loop, 'window.' + 'startGameLoop = function()');
const stopBody = functionBody(loop, 'window.' + 'stopGame = function()');
const gameLoopBody = functionBody(loop, 'window.' + 'gameLoop = function(timestamp)');

if (!loop.includes('window.gameLoopRafHandle') || !scheduleBody || !loop.includes('function cancelScheduledGameplayFrame()')) {
  fail('src/core/loop.js must explicitly own gameplay RAF scheduling and cancellation.');
}
if (count(loop, /requestAnimationFrame\(/g) !== 1) {
  fail('src/core/loop.js should have exactly one requestAnimationFrame call site.');
}
if (count(loop, /cancelAnimationFrame\(/g) !== 1) {
  fail('src/core/loop.js should have exactly one cancelAnimationFrame call site.');
}
if (!/window\.isPaused/.test(scheduleBody)) {
  fail('scheduleNextGameplayFrame must not schedule while paused.');
}
if (!/window\.isRunning\s*&&\s*!window\.isPaused/.test(startBody) || !/return;/.test(startBody)) {
  fail('startGameLoop must be a no-op when already running and unpaused.');
}
if (!/cancelScheduledGameplayFrame\(\)/.test(startBody) || !/window\.lastTime\s*=\s*performance\.now\(\)/.test(startBody)) {
  fail('startGameLoop must clear stale RAF state and reset timing before scheduling.');
}
if (!/window\.isPaused\s*=\s*true/.test(pauseBody) || !/cancelScheduledGameplayFrame\(\)/.test(pauseBody)) {
  fail('pauseGame must set paused and cancel the scheduled gameplay RAF.');
}
if (!/!window\.isRunning\s*\|\|\s*!window\.isPaused/.test(resumeBody) || !/cancelScheduledGameplayFrame\(\)/.test(resumeBody) || !/scheduleNextGameplayFrame\(\)/.test(resumeBody)) {
  fail('resumeGame must only resume from paused running state and schedule through the sole scheduler.');
}
if (!/cancelScheduledGameplayFrame\(\)/.test(stopBody) || !/window\.lastTime\s*=\s*0/.test(stopBody)) {
  fail('stopGame must cancel stale RAF handles and reset timing.');
}
const pausedBranchMatch = gameLoopBody.match(/if \(window\.isPaused\) \{([\s\S]*?)\n  \}/);
if (!pausedBranchMatch || /scheduleNextGameplayFrame/.test(pausedBranchMatch[1]) || !/return;/.test(pausedBranchMatch[1])) {
  fail('the paused gameLoop branch must return without scheduling another frame.');
}
if (count(update, /renderer\.update\s*\(/g) !== 0) {
  fail('renderer.update must not be duplicated inside update-coordinator.js.');
}
if (count(loop, /renderer\.update\s*\(/g) !== 1) {
  fail('src/core/loop.js must be the single active renderer.update orchestration site.');
}
if (count(update, /enemyManager\.checkCollisions\s*\(/g) !== 0) {
  fail('update-coordinator.js must not call enemyManager.checkCollisions after EnemyManager.update.');
}
const managerSection = enemies.slice(enemies.indexOf('window.' + 'EnemyManager = class EnemyManager'));
const managerUpdateBody = functionBody(managerSection, 'update(deltaTime, player)');
if (!managerUpdateBody || count(managerUpdateBody, /this\.checkCollisions\s*\(\s*player\s*\)/g) !== 1) {
  fail('the canonical enemies.js EnemyManager.update must invoke player collision orchestration exactly once.');
}
if (!update.includes('EnemyManager.update() owns enemy/enemy and enemy/player collision orchestration')) {
  fail('collision orchestration ownership should be documented at the removed duplicate call site.');
}
if (!title.includes('this.animationFrameHandle') || !title.includes('cancelAnimationFrame(this.animationFrameHandle)') || !title.includes('this.hideTimeoutHandle') || !title.includes('this.hideGeneration')) {
  fail('title-screen.js must explicitly own RAF cancellation and stale hide timeout prevention.');
}
if (count(title, /requestAnimationFrame\(/g) !== 1 || count(title, /cancelAnimationFrame\(/g) !== 1) {
  fail('title-screen.js should have one RAF request and one RAF cancellation site.');
}
if (!title.includes('this.scanlineElement') || !title.includes('dataset.titleScanline')) {
  fail('title scanline effect must reuse a bounded scanline element.');
}
for (const [name, source] of [['parallax', parallax], ['player', player], ['index', index]]) {
  if (/console\.log\((?:`|')?(?:🔧 Parallax draw called|Drawing layer|🎬 Animation Status|Game state:)/.test(source) && !source.includes('BARCODE_DEBUG_FRAME_OWNERSHIP')) {
    fail(`${name} high-frequency diagnostics must be gated behind BARCODE_DEBUG_FRAME_OWNERSHIP.`);
  }
}
for (const marker of [
  'Idle animation moved up 30px',
  'Walk animation moved up 11px',
  'Rhythm animation moved up 30px',
  'Rhythm animation scaled:',
  'Walk animation scaled:',
  'Jump animation scaled:'
]) {
  const line = player.split(/\r?\n/).find((entry) => entry.includes(marker));
  if (!line || !line.includes('BARCODE_DEBUG_FRAME_OWNERSHIP')) {
    fail(`player draw-loop diagnostic must be explicitly debug-gated: ${marker}`);
  }
}
if (!player.includes('if (window.BARCODE_DEBUG_FRAME_OWNERSHIP && (!this.lastAnimLog || Date.now() - this.lastAnimLog > 3000))')) {
  fail('player periodic animation diagnostic work must be disabled during normal play.');
}
for (const marker of ['Drawing ship ${ship.shipType + 1} with GIF', 'Drawing fallback ship at']) {
  const line = spaceships.split(/\r?\n/).find((entry) => entry.includes(marker));
  if (!line || !line.includes('BARCODE_DEBUG_FRAME_OWNERSHIP')) {
    fail(`spaceship draw-loop diagnostic must be explicitly debug-gated: ${marker}`);
  }
}
if (!spaceships.includes('if (window.BARCODE_DEBUG_FRAME_OWNERSHIP && (!this.lastDebugLog || Date.now() - this.lastDebugLog > 1000))')) {
  fail('spaceship recurring status work must be disabled during normal play.');
}
if (index.includes('gameStateDebugInterval = setInterval') && (!index.includes("window.addEventListener('beforeunload'") || !index.includes('clearInterval(window.gameStateDebugInterval)'))) {
  fail('debug gameStateDebugInterval must have explicit beforeunload cleanup.');
}
for (const phrase of [
  'Level 1 is centered on 6 Bit',
  'There is no kill-quota gate',
  'There is no jammer-destruction gate',
  'The jammer is not an enemy',
  'PR-004 — authoritative beat clock',
  'PR-008 — new boss and complete vertical slice'
]) {
  if (!design.includes(phrase)) fail(`Level 1 design contract is missing: ${phrase}`);
}
if (/without adding double-jump, slide, or a functional dash/.test(design)) {
  fail('design contract must not forbid unapproved movement options.');
}
if (!design.includes('existing movement kit—including dash, stomp, and fast-fall') || !design.includes('does not pre-approve or forbid additional movement options')) {
  fail('design contract must direct PR-005 to evaluate existing movement without pre-approving or forbidding options.');
}
for (const phrase of [
  'single active enemy owner',
  'authoritative defeat event',
  'JammerEnvironment',
  'milliseconds at manager/API boundaries',
  'authored Level 1 stage PR'
]) {
  if (!knownIssues.includes(phrase)) fail(`KNOWN_ISSUES.md must document active enemy physics debt: ${phrase}`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log('frame ownership check passed.');
