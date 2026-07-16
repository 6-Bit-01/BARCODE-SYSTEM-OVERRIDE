const fs = require('fs');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function indexOfOrFail(text, needle, label) {
  const index = text.indexOf(needle);
  assert(index !== -1, `missing ${label || needle}`);
  return index;
}

function blockFrom(text, startNeedle, endNeedle) {
  const start = indexOfOrFail(text, startNeedle, startNeedle);
  const end = endNeedle ? text.indexOf(endNeedle, start) : text.length;
  assert(end !== -1, `missing end marker ${endNeedle}`);
  return text.slice(start, end);
}

(function profileRegistrationAndSelectionAreStaticAndExplicit() {
  const profile = read('src/engine/level-01-music-profile.js');
  assert(profile.includes("namespace.LEVEL_01_MUSIC_PROFILE_ID = 'level-01.main'"), 'Level 1 profile ID constant must be exact');
  assert(profile.includes("profileId: 'level-01.main'"), 'Level 1 profile must register exact profile ID');
  assert(profile.includes('namespace.ensureLevel01MusicProfileSelected = function ensureLevel01MusicProfileSelected()'), 'selection helper must exist');
  assert(profile.includes('registry.get(LEVEL_01_PROFILE_ID)'), 'helper must verify registration before selecting');
  assert(profile.includes('registry.select(LEVEL_01_PROFILE_ID)'), 'helper must select exact Level 1 ID');
  assert(profile.includes('selected.profileId !== LEVEL_01_PROFILE_ID'), 'helper must verify selected profile ID');
  assert(profile.includes("return { ok: false, reason: 'transport-unavailable'"), 'helper must fail if MusicTransport is unavailable');
  assert(profile.includes('transport.load(LEVEL_01_PROFILE_ID)'), 'helper must load exact Level 1 ID into MusicTransport');
  assert(profile.includes("Missing registration for level-01.main"), 'helper must emit actionable missing-registration diagnostic');
})();

(function profileScriptsPrecedeAudioInIndex() {
  const index = read('index.html');
  const order = ['src/engine/music-profiles.js', 'src/engine/music-transport.js', 'src/engine/level-01-music-profile.js', 'src/engine/audio.js'];
  const positions = order.map(item => indexOfOrFail(index, item, `${item} script`));
  positions.forEach((position, i) => {
    if (i > 0) assert(position > positions[i - 1], `${order[i]} must appear after ${order[i - 1]}`);
  });
})();

(function audioStartupRequiresProfileSourcesAndRunningTransport() {
  const audio = read('src/engine/audio.js');
  const startBlock = blockFrom(audio, '  startAllLayersSimultaneously() {', '  // ========================================');
  const missingProfile = indexOfOrFail(startBlock, "reason: 'missing-profile-selection'", 'missing-profile guard');
  const playbackAccess = indexOfOrFail(startBlock, 'profile.playback.startTrackSec', 'profile playback access');
  assert(missingProfile < playbackAccess, 'missing-profile guard must occur before profile.playback access');
  assert(startBlock.includes("reason: 'missing-required-source'"), 'missing required source must be controlled failure');
  assert(startBlock.includes("reason: 'transport-unavailable'"), 'missing MusicTransport must be controlled failure');
  assert(startBlock.includes("typeof transport.start !== 'function'"), 'MusicTransport.start function must be required');
  assert(startBlock.includes("transportResult.running !== true"), 'successful startup must require running transport');
  const transportStart = indexOfOrFail(startBlock, 'const transportResult = transport.start', 'transport startup');
  const layersStarted = indexOfOrFail(startBlock, 'this.layersStarted = true', 'layersStarted assignment');
  const loopDetection = indexOfOrFail(startBlock, 'this.startLoopDetection()', 'loop detection startup');
  const deferredLayerTimer = indexOfOrFail(startBlock, 'setTimeout(() => {\n      this.updateLayers()', 'deferred layer timer');
  assert(transportStart < layersStarted, 'layersStarted must be set only after transport start attempt');
  assert(startBlock.indexOf("transportResult.running !== true") < layersStarted, 'layersStarted must be after running transport check');
  assert(layersStarted < loopDetection, 'loop detection must start after successful layersStarted assignment');
  assert(layersStarted < deferredLayerTimer, 'deferred layer timer must start after successful layersStarted assignment');
  assert(startBlock.includes('track.source = null;\n          track.isPlaying = false;\n          track.gain = null;'), 'failed transport startup must clear created sources');

  const musicBlock = blockFrom(audio, '  startMusicSystem() {', '  // Play cutscene music');
  assert(musicBlock.includes("reason: 'missing-profile-selection'"), 'startMusicSystem must propagate missing-profile failure');
  assert(musicBlock.includes('return result;'), 'startMusicSystem must return synchronized startup result');
})();

(function cutsceneRhythmStartupIsGatedBySuccessfulTransport() {
  const cutscene = read('src/engine/cutscene.js');
  const helper = blockFrom(cutscene, 'function startGameplayMusicAndRhythm(audioSystem)', 'window.CutsceneSystem = class CutsceneSystem');
  assert(helper.includes('const result = audioSystem.startMusicSystem()'), 'cutscene helper must start through audio system');
  assert(helper.includes('if (!result || !result.ok)'), 'cutscene helper must stop on failed music startup');
  assert(helper.includes("result.transport && result.transport.status === 'ok' && result.transport.running"), 'fallback rhythm start must require running transport');
  assert(helper.includes('startBackgroundRhythmIfTransportRunning(result)'), 'primary rhythm start must use transport-gated audio helper');
})();

(function logsAndAssetsAreBoundedStatically() {
  const audio = read('src/engine/audio.js');
  assert(audio.includes('this.layerLogState.enemyCount !== enemyCount'), 'enemy-count log must be state-change-gated');
  assert(audio.includes('this.layerLogState.activeLayers !== activeLayerKey'), 'active-layer log must be state-change-gated');
  assert(audio.includes('getOrCreateAssetPromise(assetId, loader)'), 'audio asset loading must use promise cache helper');
  assert(audio.includes('if (this.assetLoadPromises[assetId]) return this.assetLoadPromises[assetId]'), 'audio asset loads must reuse in-flight promise');

  const ships = read('src/engine/spaceships.js');
  assert(ships.includes('loadSharedImageAsset(assetId, url)'), 'ship image loading must use shared promise helper');
  assert(ships.includes('if (window.BARCODE.assetLoadPromises[assetId]) return window.BARCODE.assetLoadPromises[assetId]'), 'ship image loads must reuse in-flight promise');
  assert(ships.includes('chooseShipTypeForSpawn()'), 'ship spawn must centralize ready/fallback selection');
  assert(ships.includes('return Math.floor(Math.random() * this.shipImages.length)'), 'ship fallback must still choose a valid fallback-rendered ship type');
  assert(ships.includes('// Draw fallback ship (rectangle with details)'), 'ship fallback drawing path must remain present');
  assert(!ships.includes('Ship spawn skipped until optional ship imagery is ready'), 'normal ship creation must not be skipped while GIFs load');
  assert(!ships.includes('Foreground ship spawn skipped until optional ship imagery is ready'), 'foreground ship creation must not be skipped while GIFs load');
})();

(function approvedLevelOneConstantsRemainUnchanged() {
  const profile = read('src/engine/level-01-music-profile.js');
  [
    '2133657a-6dbe-47c0-b4c3-4cb9849b3c58.mp3',
    '5089debd-8927-4409-88f1-785be8508686.mp3',
    '1e86d080-84ac-45df-b591-5e433ae5ec8f.mp3',
    'gain: 0.8',
    'gain: 0',
    'quarterBpm: 146',
    'beatsPerBar: 4',
    'beatUnit: 4',
    'establishmentBeatCount: 32',
    'perfect: 60',
    'excellent: 100',
    'legacyManualRestartSec: 211'
  ].forEach(snippet => assert(profile.includes(snippet), `approved Level 1 constant changed or missing: ${snippet}`));
})();

console.log('PASS static Makko music/rhythm hotfix checks');
