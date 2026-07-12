const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const fail = (message) => {
  console.error(`frame ownership check failed: ${message}`);
  process.exitCode = 1;
};
const count = (source, pattern) => (source.match(pattern) || []).length;

const loop = read('src/core/loop.js');
const update = read('src/game/update-coordinator.js');
const title = read('src/engine/title-screen.js');
const parallax = read('src/engine/parallax.js');
const player = read('src/game/player.js');
const index = read('index.html');
const design = read('docs/design/LEVEL_01_VERTICAL_SLICE.md');

if (!loop.includes('window.gameLoopRafHandle') || !loop.includes('function scheduleNextGameplayFrame()') || !loop.includes('function cancelScheduledGameplayFrame()')) {
  fail('src/core/loop.js must explicitly own gameplay RAF scheduling and cancellation.');
}
if (count(loop, /requestAnimationFrame\(/g) !== 1) {
  fail('src/core/loop.js should have exactly one requestAnimationFrame call site.');
}
if (count(loop, /cancelAnimationFrame\(/g) !== 1) {
  fail('src/core/loop.js should have exactly one cancelAnimationFrame call site.');
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

if (process.exitCode) process.exit(process.exitCode);
console.log('frame ownership check passed.');
