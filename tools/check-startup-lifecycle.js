const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const fail = (message) => {
  console.error(`startup lifecycle check failed: ${message}`);
  process.exitCode = 1;
};

const index = read('index.html');
const initializer = read('src/game/game-initializer.js');
const lifecycleDocs = read('docs/technical/SCRIPT_AND_GLOBAL_MAP.md') + '\n' + read('docs/technical/KNOWN_ISSUES.md');

const autoStartIndex = index.indexOf('window.autoStartDisabled = true;');
const mainNewIndex = index.indexOf('<script src="src/game/main-new.js"></script>');
if (autoStartIndex === -1 || mainNewIndex === -1 || autoStartIndex > mainNewIndex) {
  fail('window.autoStartDisabled must be set before src/game/main-new.js loads.');
}
if ((index.match(/window\.autoStartDisabled\s*=\s*true/g) || []).length !== 1) {
  fail('window.autoStartDisabled should have exactly one assignment in index.html.');
}

const startHandlerMatch = index.match(/document\.getElementById\('startButton'\)\.addEventListener\('click', async function\(\) \{([\s\S]*?)\n        \}\);/);
if (!startHandlerMatch) {
  fail('startButton click handler was not found in index.html.');
} else {
  if ((index.match(/document\.getElementById\('startButton'\)\.addEventListener\('click'/g) || []).length !== 1) {
    fail('index.html should register exactly one active startButton click handler.');
  }
  const body = startHandlerMatch[1];
  const fullscreen = body.indexOf('fullscreenManager.enter()');
  const lifecycleStart = body.indexOf('lifecycle.start');
  const lifecycleRetry = body.indexOf('lifecycle.retry');
  const firstAwait = body.indexOf('await ');
  if (!body.includes('RuntimeLifecycle') || lifecycleStart === -1 || lifecycleRetry === -1) {
    fail('startButton click handler must delegate first start and retry to RuntimeLifecycle.');
  }
  if (fullscreen === -1 || firstAwait === -1 || fullscreen > firstAwait) {
    fail('fullscreen request must stay synchronously in the start-button user gesture before the first await.');
  }
  for (const forbidden of ['window.initParallax', 'window.initSpaceShips', 'window.initLore', 'window.initLostData', 'window.initCutscene', 'window.startGameInitialization']) {
    if (body.includes(forbidden)) {
      fail(`startButton handler must not retain manual initialization call ${forbidden}.`);
    }
  }
  if (!body.includes('resetStartRetryPresentation();')) {
    fail('startButton retry path must reset stale failure presentation before lifecycle delegation.');
  }
}

const runtimeLifecycle = read('src/core/runtime-lifecycle.js');
for (const token of ['transitionInFlight', 'generation', 'restoreRetryUi', 'cleanupFailedGeneration', 'runInitializer']) {
  if (!runtimeLifecycle.includes(token)) {
    fail(`RuntimeLifecycle is missing startup lifecycle token ${token}.`);
  }
}

if (!index.includes('let assetLoadingMonitor = null;') || !index.includes('cleanupMonitor') || !index.includes('clearInterval(assetLoadingMonitor.audioInterval)') || !index.includes('clearInterval(assetLoadingMonitor.spriteInterval)') || !index.includes('clearTimeout(assetLoadingMonitor.fallbackTimeout)')) {
  fail('boot asset monitor must declare explicit cleanup for audio interval, sprite interval, and fallback timeout.');
}
if (!index.includes('if (assetLoadingMonitor)') || !index.includes('return assetLoadingMonitor;')) {
  fail('monitorAssetLoading must avoid duplicate active monitor sets.');
}

for (const token of ['initAudioInFlight', 'initSpritesInFlight', 'startGameInitializationInFlight', 'performInitAudio', 'performInitSprites', 'performStartGameInitialization']) {
  if (!initializer.includes(token)) {
    fail(`game initializer is missing single-flight token ${token}.`);
  }
}

for (const phrase of ['lifecycle owner', 'single-flight', 'Owner/Makko', 'static inspection']) {
  if (!lifecycleDocs.toLowerCase().includes(phrase.toLowerCase())) {
    fail(`lifecycle ownership documentation must mention ${phrase}.`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
console.log('startup lifecycle check passed.');
