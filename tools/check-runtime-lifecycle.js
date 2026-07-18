#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = msg => { console.error(`❌ ${msg}`); process.exit(1); };
const assert = (cond, msg) => { if (!cond) fail(msg); };
const blockFrom = (src, start, end) => {
  const i = src.indexOf(start);
  assert(i !== -1, `missing block start ${start}`);
  const j = end ? src.indexOf(end, i + start.length) : -1;
  return j === -1 ? src.slice(i) : src.slice(i, j);
};

const lifecycle = read('src/core/runtime-lifecycle.js');
const index = read('index.html');
const input = read('src/core/input.js');
const loop = read('src/core/loop.js');
const mainNew = read('src/game/main-new.js');
const transport = read('src/engine/music-transport.js');
const audio = read('src/engine/audio.js');
const cutscene = read('src/engine/cutscene.js');
const spaceships = read('src/engine/spaceships.js');
const hacking = read('src/game/hacking.js');
const gameState = read('src/game/game-state.js');
const rhythm = read('src/game/rhythm.js');

assert(lifecycle.includes('namespace.RuntimeLifecycle'), 'RuntimeLifecycle must exist under window.BARCODE namespace');
for (const state of ['idle','starting','running','paused','stopping','failed']) assert(lifecycle.includes(`'${state}'`), `missing lifecycle state ${state}`);
assert(lifecycle.includes('ALLOWED_TRANSITIONS') && lifecycle.includes("idle: Object.freeze(['starting'])"), 'explicit allowed transition table required');
assert(/transitionInFlight/.test(lifecycle) && /generation/.test(lifecycle) && /runGeneration/.test(lifecycle), 'one in-flight transition and generation guard required');
assert(/function runInitializer/.test(lifecycle) && /startGameInitialization/.test(lifecycle) && /restart/.test(lifecycle), 'start/retry/restart must share one initializer');
assert((index.match(/startButton'\)\.addEventListener\('click'/g) || []).length === 1, 'exactly one start-button click listener expected');
const clickBody = index.slice(index.indexOf("startButton').addEventListener('click'"), index.indexOf('// Add keyboard support'));
assert(clickBody.includes('fullscreenManager.enter()') && clickBody.indexOf('fullscreenManager.enter()') < clickBody.indexOf('lifecycle.start'), 'fullscreen request must remain in user gesture before lifecycle start');
assert(clickBody.includes('RuntimeLifecycle') && !clickBody.includes('initParallax') && !clickBody.includes('startGameInitialization'), 'start-button handler must be thin and delegate to RuntimeLifecycle');
assert(!index.includes('let gameInitialized') && !index.includes('let gameStartInProgress') && !index.includes('let titleScreenMusicBlocked'), 'obsolete split lifecycle flags must be removed from index.html');
assert(index.includes('window.BARCODE.AssetMonitor') && lifecycle.includes('namespace.AssetMonitor.cleanup'), 'asset monitor cleanup must reference the real registered monitor');
assert(input.includes('RuntimeLifecycle.restart') && input.includes('RuntimeLifecycle.togglePause') && read('src/core/action-input.js').includes("EDGE_ACTIONS") && read('src/core/action-input.js').includes("pause"), 'pause/restart input must route to lifecycle and semantic edge state ignores held P repeats');
assert(!index.includes('src/game/main.js'), 'src/game/main.js must not be newly loaded');
assert(mainNew.includes("state === 'running' || state === 'paused'") && mainNew.includes('lifecycle.retry()') && mainNew.includes('lifecycle.start'), 'startNewGame compatibility must be state-aware');
assert(!/requestAnimationFrame\s*\(/.test(lifecycle), 'lifecycle module must not call requestAnimationFrame');
assert((loop.match(/requestAnimationFrame\s*\(/g) || []).length === 1, 'loop.js remains sole gameplay RAF owner');

const transportResume = blockFrom(transport, 'function resume(audioTimeSec)', 'function coordinatedRestart');
assert(transportResume.includes('sourceAnchorAudioSec = audioTimeSec;'), 'MusicTransport resume must anchor resumed segment at current audio time');
assert(!transportResume.includes('sourceAnchorAudioSec = audioTimeSec - sourceOffsetTrackSec'), 'MusicTransport resume must not subtract frozen offset from anchor');
const transportPause = blockFrom(transport, 'function pause(audioTimeSec)', 'function resume(audioTimeSec)');
assert(transportPause.includes('sourceOffsetTrackSec = frozenTrackTimeSec'), 'MusicTransport pause must freeze current track time into sourceOffsetTrackSec');

const lifecyclePause = blockFrom(lifecycle, 'function pause(reason)', 'function resume(reason)');
assert(lifecyclePause.indexOf('pauseRuntimeAudio') !== -1 && lifecyclePause.indexOf('pauseRuntimeAudio') < lifecyclePause.indexOf('pauseGame()'), 'RuntimeLifecycle pause must not cancel gameplay before audio pause succeeds');
assert(lifecyclePause.includes('audio-pause-failed-rolled-back') && lifecyclePause.includes('projectCompatibility()'), 'pause failure must return a coherent rolled-back state');
assert(lifecyclePause.includes("transitionInFlight = { kind: 'pause'"), 'pause requests must be guarded against overlap');
const audioPause = blockFrom(audio, 'async pauseRuntimeAudio()', 'async resumeRuntimeAudio()');
assert(audioPause.includes('pause-failed-rolled-back') && audioPause.includes('transport.resume') && audioPause.includes('wasBeatSyncActive'), 'Audio pause must roll back partial transport/beat changes on failure');

const lifecycleRestart = blockFrom(lifecycle, 'function restart(options)', 'function pause(reason)');
assert(lifecycleRestart.includes('prepareRestartAudio') && lifecycleRestart.includes('stopMusic: true'), 'restart must prepare/resume audio and stop old music sources');
assert(lifecycle.includes('startRuntimeGameplayMusic'), 'restart initializer must restart gameplay music/rhythm under lifecycle ownership');
assert(audio.includes('prepareRestartAudio') && audio.includes('startRuntimeGameplayMusic'), 'AudioSystem restart policy hooks must exist');
assert(audio.includes('runtimeAudioGeneration') && audio.includes('scheduleRuntimeTimeout') && audio.includes('clearRuntimeTimeouts') && audio.includes('ownedRuntimeTimeouts'), 'AudioSystem must expose/cancel run-owned timeout generation');

for (const token of ['containerRemovalTimer', 'fadeCompletionTimer', 'titleMusicUnblockTimer', 'fadeCheckInterval', 'trackTimeout', 'trackInterval', 'clearOwnedCallbacks']) {
  assert(cutscene.includes(token), `cutscene must track ${token}`);
}
assert(cutscene.includes('this.cutsceneGeneration++') && cutscene.includes('generation === this.cutsceneGeneration'), 'cutscene callbacks must be generation guarded');
assert(cutscene.includes('startGameplayMusicAndRhythm(audioSystem)') && cutscene.includes('fadeCompletionTimer = this.trackTimeout'), 'fade completion music start must be tracked');

assert(spaceships.includes('pendingSpawnTimeouts') && spaceships.includes('trackSpawnTimeout') && spaceships.includes('dispose()') && spaceships.includes('getDiagnostics()'), 'SpaceShipSystem must track and dispose delayed foreground spawns');
assert(hacking.includes('ownedTimeouts') && hacking.includes('trackTimeout') && hacking.includes('clearOwnedTimeouts') && hacking.includes('getDiagnostics()'), 'HackingSystem must track/reset delayed callbacks');
assert(gameState.includes('resetRuntimeTerminalFlags') && gameState.includes('gameState.gameOver = false') && gameState.includes('gameState.victory = false'), 'game-over restart must clear terminal game flags without resetting saved progress');
assert(gameState.includes('cancelInitialEnemySpawn') && gameState.includes('initialEnemySpawnGeneration') && gameState.includes('spawnGeneration !== window.initialEnemySpawnGeneration'), 'initial enemy spawn timeout must be generation/cancel guarded');
assert(lifecycle.includes('resetRuntimeTerminalFlags') && lifecycle.includes('cancelInitialEnemySpawn'), 'RuntimeLifecycle must own game-over flag reset and initial-spawn invalidation');
assert(rhythm.includes('resetForFreshRuntimeRestart') && audio.includes('resetForFreshRuntimeRestart'), 'fresh music restart must explicitly reset/re-anchor rhythm background state');
const startRuntimeMusic = blockFrom(audio, 'startRuntimeGameplayMusic()', 'stopRuntimeAudio(options)');
const ensureBeatSync = blockFrom(audio, 'ensureLayerBeatSyncForTransport(startResult)', 'startRuntimeGameplayMusic()');
assert(startRuntimeMusic.includes('resetForFreshRuntimeRestart') && startRuntimeMusic.includes('ensureLayerBeatSyncForTransport(result)') && startRuntimeMusic.includes('beat-sync-not-armed'), 'fresh restart music path must explicitly require beat-sync arming after rhythm reset');
assert(ensureBeatSync.includes('startResult.transport.running !== true') && ensureBeatSync.includes('this.startLayerBeatSync()') && ensureBeatSync.includes('beatSyncActive: !!this.beatSyncActive'), 'fresh restart beat-sync helper must require a running transport and arm layer beat sync idempotently');
assert(!/idempotent lifecycle init/.test(spaceships + hacking + cutscene), 'validators must not accept idempotent marker comments as cleanup proof');

const diag = blockFrom(lifecycle, 'function getDiagnostics()', 'namespace.RuntimeLifecycle');
assert(diag.includes('cutsceneSystem.isPlaying()') || diag.includes('cutsceneSystem.isPlaying && window.cutsceneSystem.isPlaying()'), 'diagnostics must call cutscene isPlaying() instead of treating method object as boolean');
assert(!diag.includes('titleScreen.isVisible'), 'diagnostics must not reference nonexistent titleScreen.isVisible');
assert(!diag.includes('ownedCounts: { cleanups: cleanupRegistry.length }'), 'diagnostics must not expose meaningless cleanup registry counts');
assert(diag.includes('gameLoopRafHandle') && diag.includes('musicTransport') && audio.includes('activeMusicSources') && diag.includes('assetMonitor') && diag.includes('initialEnemySpawn') && diag.includes('gameOver') && diag.includes('victory') && diag.includes('rhythm'), 'diagnostics must expose concrete resource state');
assert(audio.includes('titleScreenMusic && this.titleScreenMusic.source') && !audio.includes('titleSourceActive: !!this.titleSource'), 'Audio diagnostics must report real titleScreenMusic source state');

for (const file of fs.readdirSync(path.join(root, 'tools')).filter(f => f.endsWith('.js') && f !== 'check-runtime-lifecycle.js' && f !== 'check-action-combat.js' && f !== 'check-level-01-mission.js')) {
  const src = read(`tools/${file}`);
  assert(!/require\(['"]vm['"]\)/.test(src) && !/vm\.runInContext|vm\.runInNewContext|vm\.createContext/.test(src) && !/new Function\s*\(/.test(src) && !/eval\s*\(/.test(src) && !/jsdom/i.test(src) && !/require\(['"]\.\.\/src\//.test(src) && !/import\s+.*['"]\.\.\/src\//.test(src), `${file} must not execute browser runtime code`);
}
assert(read('tools/check-music-profiles.js').includes('level-01.main'), 'PR #5 music profile guard remains present');
assert(read('tools/check-makko-hotfix.js').includes('transport.start'), 'PR #6 Makko hotfix guard remains present');
assert(read('src/engine/level-01-music-profile.js').includes('quarterBpm: 146') && read('src/engine/level-01-music-profile.js').includes('legacyManualRestartSec: 211'), 'Level 1 music constants remain present');
console.log('✅ runtime lifecycle static checks passed');
