const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const vm = require('node:vm');

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
const renderer = read('src/engine/renderer.js');
const index = read('index.html');
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
if (!/!window\.isRunning/.test(scheduleBody) || !/window\.gameLoopRafHandle !== null/.test(scheduleBody)) {
  fail('scheduleNextGameplayFrame must schedule only through the sole RAF handle while running.');
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
if (!pausedBranchMatch || !/updatePausedInput/.test(pausedBranchMatch[1]) || !/scheduleNextGameplayFrame/.test(pausedBranchMatch[1]) || !/return;/.test(pausedBranchMatch[1])) {
  fail('the paused gameLoop branch must poll input only, reschedule through the sole RAF owner, and return before simulation/render.');
}
if (count(update, /renderer\.update\s*\(/g) !== 0) {
  fail('renderer.update must not be duplicated inside update-coordinator.js.');
}
const postEffectsBody = functionBody(renderer, 'applyPostEffects()');
if (!postEffectsBody || /getImageData\s*\(/.test(postEffectsBody) || /putImageData\s*\(/.test(postEffectsBody)) {
  fail('Renderer.applyPostEffects must use a bounded composited overlay, not full-frame pixel readback.');
}
for (const api of ['setCinematicZoomOverride', 'getCinematicZoomOverride', 'clearCinematicZoomOverride']) {
  if (!renderer.includes(`${api}(`)) {
    fail(`renderer must expose the cinematic zoom ownership API: ${api}.`);
  }
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
const playerDrawBody = functionBody(player, '  drawSprite(ctx) {');
if (!player.includes('const PLAYER_VISUAL_FOOT_OFFSET_Y = 72;') ||
    !player.includes('PLAYER_ANIMATION_PRESENTATION') ||
    !player.includes('getMakkoRenderMetrics') ||
    !player.includes('visibleFootY: drawY - render.anchorOffsetY + footRow * render.frameScale')) {
  fail('player presentation must resolve audited source-frame feet to the canonical physics y + 72 visual contact line.');
}
if (!playerDrawBody || /\bdraw[XY]\s*[+-]=/.test(playerDrawBody) || !/getVisualAnchor\(shouldFlip\)/.test(playerDrawBody)) {
  fail('player drawing must use the frame-aware visual anchor without state-specific magic X/Y shifts.');
}
if (!player.includes('isBossCinematicActive')) {
  fail('player animation ownership must freeze a neutral pose during the boss cinematic.');
}
{
  const { createRig } = require('./check-level-01-boss');
  const { createSprite, playerClips } = require('./makko-animation-fixture');
  const { w, calls } = createRig();
  const actor = w.player;
  actor.spriteReady = true; actor.sprite = createSprite(playerClips);
  actor.state = 'idle'; actor.cinematicPoseActive = true;
  const position = { x:actor.position.x, y:actor.position.y };
  for (let i = 0; i < 30; i++) actor.updateSpriteAnimation(100);
  const neutralFrame = actor.animationRef.currentFrame, neutralRef = actor.animationRef;
  if (neutralFrame === 0 || actor.sprite.getCurrentAnimation() !== '6_bit_idle_idle' || calls.errors.length)
    fail('cinematic must animate the actual neutral idle through the shared owner without host errors.');
  if (actor.position.x !== position.x || actor.position.y !== position.y)
    fail('living cinematic idle must keep the frozen actor position.');
  actor.cinematicPoseActive = false; actor.updateSpriteAnimation(100);
  if (actor.animationRef !== neutralRef || actor.animationRef.currentFrame === neutralFrame)
    fail('normal animation must continue the same idle reference after the cinematic releases ownership.');
}
if (/this\.sprite\.(pause|resume)\(/.test(player)) {
  fail('cinematic pose ownership must not depend on optional Makko sprite pause/resume methods.');
}
if (!player.includes('this.contactSweep = { previousX') || !player.includes('width: 64, height: 142')) {
  fail('player collision must use a stable torso and a separate frame-owned foot sweep.');
}
if (player.includes('this.lastAnimLog') && !player.includes('if (window.BARCODE_DEBUG_FRAME_OWNERSHIP && (!this.lastAnimLog || Date.now() - this.lastAnimLog > 3000))')) {
  fail('player periodic animation diagnostic work must be disabled during normal play.');
}
for (const marker of ['Drawing ship ${ship.shipType + 1}']) {
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
// Design documents are reviewed against current owner decisions. This runtime
// ownership check deliberately does not require historical PR-plan prose: the
// former quota/Jammer/movement assertions contradicted later approved mechanics.
// Current enemy/environment ownership and time-boundary notes remain required;
// the old claim that the authored stage was a future PR no longer applies.
for (const phrase of [
  'single active enemy owner',
  'authoritative defeat event',
  'JammerEnvironment',
  'milliseconds at manager/API boundaries'
]) {
  if (!knownIssues.includes(phrase)) fail(`KNOWN_ISSUES.md must document active enemy ownership: ${phrase}`);
}

// Exercise the real acquisition owners, including an alternate scene that
// starts before Renderer. These check forwarding/reuse, not GPU availability.
{
  const contextRig = ({ unavailable = false } = {}) => {
    const calls = [], events = {}, timers = [];
    const makeCanvas = () => {
      const canvas = { id: 'gameCanvas', width: 1920, height: 1080 };
      const ctx = { canvas, save() {}, restore() {}, clearRect() {}, fillRect() {}, setTransform() {},
        translate() {}, scale() {}, getTransform: () => ({ a:1,b:0,c:0,d:1,e:0,f:0 }) };
      canvas.context = ctx;
      canvas.getContext = (type, options) => {
        calls.push({ canvas, type, options: options && JSON.parse(JSON.stringify(options)) });
        return unavailable ? null : ctx;
      };
      return canvas;
    };
    const rig = { calls, events, timers, makeCanvas, canvas: makeCanvas() };
    const w = { BARCODE: {}, console: { log() {}, warn() {}, error() {} },
      document: { readyState: 'loading', getElementById: () => rig.canvas,
        addEventListener: (name, callback) => { events[name] = callback; } },
      setTimeout: callback => { timers.push(callback); return timers.length; },
      requestAnimationFrame: () => { throw Error('Acquisition scheduled a frame'); },
      cancelAnimationFrame() {}, performance: { now: () => 0 } };
    w.window = w;
    rig.w = w; rig.context = vm.createContext(w);
    rig.load = file => vm.runInContext(read(file), rig.context, { filename:file });
    rig.acquire = () => vm.runInContext('getFrameContext()', rig.context);
    rig.assertCalls = expected => {
      assert.equal(calls.length, expected, 'shared context has one acquisition per actual owner/canvas');
      for (const call of calls) {
        assert.equal(call.type, '2d');
        assert.deepEqual(call.options, { willReadFrequently:false },
          'first acquisition explicitly selects draw-heavy behavior without overriding alpha/color defaults');
      }
      assert.equal(timers.length, 0, 'context policy creates no retry timer or frame owner');
    };
    return rig;
  };
  {
    const rig = contextRig();
    rig.load('src/engine/renderer.js'); rig.events.DOMContentLoaded();
    rig.load('src/core/loop.js');
    for (let i=0;i<30;i++) assert.strictEqual(rig.acquire(), rig.w.renderer.ctx);
    vm.runInContext('initializeRenderer()', rig.context);
    rig.assertCalls(1);
    const canvas = rig.makeCanvas(), renderer = new rig.w.Renderer(canvas);
    assert.strictEqual(renderer.ctx.canvas, canvas); rig.assertCalls(2);
    const injected = new rig.w.Renderer(canvas, renderer.ctx);
    assert.strictEqual(injected.ctx, renderer.ctx); rig.assertCalls(2);
  }
  {
    const rig = contextRig(); rig.load('src/core/loop.js');
    const first = rig.acquire();
    for (let i=0;i<30;i++) assert.strictEqual(rig.acquire(), first);
    rig.w.renderer = { canvas:rig.canvas, ctx:first };
    assert.strictEqual(rig.acquire(), first); rig.assertCalls(1);
    rig.canvas = rig.makeCanvas();
    const replacement = rig.acquire();
    assert.notStrictEqual(replacement, first);
    for (let i=0;i<30;i++) assert.strictEqual(rig.acquire(), replacement);
    rig.assertCalls(2);
  }
  {
    const rig = contextRig({ unavailable:true }); rig.load('src/core/loop.js');
    for (let i=0;i<30;i++) assert.equal(rig.acquire(), null);
    rig.assertCalls(1);
  }
  {
    const rig = contextRig({ unavailable:true }); rig.load('src/engine/renderer.js');
    rig.events.DOMContentLoaded(); vm.runInContext('initializeRenderer()', rig.context);
    assert.equal(rig.w.renderer.ctx, null); rig.assertCalls(1);
  }
  for (const rendererFirst of [false,true]) {
    const rig = contextRig();
    if (rendererFirst) { rig.load('src/engine/renderer.js'); rig.events.DOMContentLoaded(); }
    rig.load('src/game/render-coordinator.js');
    // World content is irrelevant to first-context ownership; run the real
    // coordinator acquisition/clear/reuse route with its scene body stubbed.
    vm.runInContext('drawGameElements = () => {};', rig.context);
    if (rendererFirst) rig.w.renderer.applyPostEffects = () => {};
    for (let i=0;i<30;i++) rig.w.renderGame();
    rig.assertCalls(1);
  }
  {
    const rig = contextRig();
    const renderPause = vm.runInContext('(function(){'+
      functionBody(read('src/game/pause-menu.js'), '    render() {')+'})',rig.context);
    const menu = { sync() {}, open:true, dirty:true, titleOpen:false,
      canvas:() => rig.canvas, draw() {} };
    renderPause.call(menu); rig.assertCalls(1);
    assert.equal(menu.dirty,false,'actual pause fallback finishes the existing dirty paint');
    rig.w.renderer = { canvas:rig.canvas, ctx:rig.canvas.context };
    for (let i=0;i<30;i++) { menu.dirty=true; renderPause.call(menu); }
    rig.assertCalls(1);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('frame ownership check passed.');

if (spaceships.includes('// Draw fallback ship (rectangle with details)')) fail('Vehicle art must never be replaced with a rectangle.');
