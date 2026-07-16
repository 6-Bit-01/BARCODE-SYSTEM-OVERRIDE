#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = msg => { console.error(`❌ ${msg}`); process.exit(1); };
const assert = (cond, msg) => { if (!cond) fail(msg); };
const lifecycle = read('src/core/runtime-lifecycle.js');
const index = read('index.html');
const input = read('src/core/input.js');
const loop = read('src/core/loop.js');
const mainNew = read('src/game/main-new.js');
const transport = read('src/engine/music-transport.js');
const audio = read('src/engine/audio.js');
assert(lifecycle.includes('namespace.RuntimeLifecycle'), 'RuntimeLifecycle must exist under window.BARCODE namespace');
for (const state of ['idle','starting','running','paused','stopping','failed']) assert(lifecycle.includes(`'${state}'`), `missing lifecycle state ${state}`);
assert(lifecycle.includes('ALLOWED_TRANSITIONS') && lifecycle.includes("idle: Object.freeze(['starting'])"), 'explicit allowed transition table required');
assert(/transitionInFlight/.test(lifecycle) && /generation/.test(lifecycle) && /runGeneration/.test(lifecycle), 'one in-flight transition and generation guard required');
assert(/function runInitializer/.test(lifecycle) && /startGameInitialization/.test(lifecycle) && /restart/.test(lifecycle), 'start/retry/restart must share one initializer');
assert((index.match(/startButton'\)\.addEventListener\('click'/g) || []).length === 1, 'exactly one start-button click listener expected');
const clickBody = index.slice(index.indexOf("startButton').addEventListener('click'"), index.indexOf('// Add keyboard support'));
assert(clickBody.includes('fullscreenManager.enter()') && clickBody.indexOf('fullscreenManager.enter()') < clickBody.indexOf('lifecycle.start'), 'fullscreen request must remain in user gesture before lifecycle start');
assert(clickBody.includes('RuntimeLifecycle') && !clickBody.includes('initParallax') && !clickBody.includes('startGameInitialization'), 'start-button handler must be thin and delegate to RuntimeLifecycle');
assert(lifecycle.includes('restoreRetryUi') && lifecycle.includes('INITIALIZATION FAILED'), 'failed startup must restore retry UI');
assert(input.includes('RuntimeLifecycle.restart') && input.includes('RuntimeLifecycle.togglePause'), 'pause/restart input must route to loaded lifecycle owner');
assert(!index.includes('src/game/main.js'), 'src/game/main.js must not be newly loaded');
assert(mainNew.includes('RuntimeLifecycle.start') && mainNew.includes('RuntimeLifecycle.restart') && !/requestAnimationFrame\s*\(/.test(mainNew), 'legacy wrappers must not contain competing initialization or RAF');
assert(!/requestAnimationFrame\s*\(/.test(lifecycle), 'lifecycle module must not call requestAnimationFrame');
assert((loop.match(/requestAnimationFrame\s*\(/g) || []).length === 1, 'loop.js remains sole gameplay RAF owner');
assert(lifecycle.includes('pauseGame()') && lifecycle.includes('resumeGame()'), 'pause cancels frame and resume resets loop timing through loop owner');
assert(audio.includes('pauseRuntimeAudio') && audio.includes('resumeRuntimeAudio') && audio.includes('stopRuntimeAudio'), 'Audio runtime pause/resume/stop hooks required');
assert(transport.includes('function pause(audioTimeSec)') && transport.includes('function resume(audioTimeSec)') && transport.includes('function stop()'), 'MusicTransport pause/resume/stop hooks required');
assert(!/Date\.now\s*\(/.test(transport) && !/setTimeout\s*\(/.test(transport) && !/requestAnimationFrame\s*\(/.test(transport), 'MusicTransport must not use wall-clock/timer/RAF authority');
assert(lifecycle.includes('stopOwnedResources') && lifecycle.includes('cleanupFailedGeneration'), 'stop/failure cleanup paths required');
for (const file of ['src/engine/parallax.js','src/engine/spaceships.js','src/engine/lore.js','src/game/lost-data.js','src/game/objectives.js','src/game/sector1-progression.js','src/engine/jammer-indicator.js','src/engine/cutscene.js','src/game/hacking.js']) {
  assert(read(file).includes('idempotent lifecycle init') || read(file).includes('destroy()'), `${file} must document idempotent/dispose init behavior`);
}
for (const file of fs.readdirSync(path.join(root, 'tools')).filter(f => f.endsWith('.js') && f !== 'check-runtime-lifecycle.js')) {
  const src = read(`tools/${file}`);
  assert(!/require\(['"]\.\.\/src\//.test(src) && !/eval\s*\(/.test(src) && !/jsdom/i.test(src), `${file} must not execute browser runtime code`);
}
assert(read('tools/check-music-profiles.js').includes('level-01.main'), 'PR #5 music profile guard remains present');
assert(read('tools/check-makko-hotfix.js').includes('transport.start'), 'PR #6 Makko hotfix guard remains present');
assert(read('src/engine/level-01-music-profile.js').includes('quarterBpm: 146') && read('src/engine/level-01-music-profile.js').includes('legacyManualRestartSec: 211'), 'Level 1 music constants remain present');
console.log('✅ runtime lifecycle static checks passed');
