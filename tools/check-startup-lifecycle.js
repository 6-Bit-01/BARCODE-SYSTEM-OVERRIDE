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
  const guardSet = body.indexOf('gameStartInProgress = true;');
  const firstTry = body.indexOf('try {');
  const firstAwait = body.indexOf('await ');
  const firstTitleHide = body.indexOf('window.titleScreen.hide();');
  if (guardSet === -1 || firstAwait === -1 || guardSet > firstAwait) {
    fail('startButton click handler must set its single-flight guard before the first await.');
  }
  if (firstTry === -1 || firstTry < guardSet) {
    fail('startButton click handler must begin recovery handling after setting its single-flight guard.');
  }
  const betweenGuardAndTry = body.slice(guardSet + 'gameStartInProgress = true;'.length, firstTry);
  if (/\bawait\b/.test(betweenGuardAndTry) || betweenGuardAndTry.includes('window.titleScreen.hide();')) {
    fail('startButton recovery handling must begin before title hiding and before the first await.');
  }
  if (firstTitleHide !== -1 && firstTry > firstTitleHide) {
    fail('title screen hiding must be protected by the start-button try/catch/finally.');
  }
  if (!body.includes('if (gameStartInProgress || gameInitialized)')) {
    fail('startButton click handler must ignore reentrant start attempts.');
  }
  const finallyIndex = body.indexOf('finally {');
  if (finallyIndex === -1) {
    fail('startButton click handler must use finally for cleanup.');
  } else {
    const finallyBody = body.slice(finallyIndex);
    if (!finallyBody.includes('gameStartInProgress = false;')) {
      fail('startButton click handler must reset its guard in finally.');
    }
    if (!finallyBody.includes('assetLoadingMonitor.cleanup();')) {
      fail('startButton click handler must clean up the asset monitor in finally.');
    }
  }
  const catchIndex = body.indexOf('catch (error) {');
  if (catchIndex === -1 || (finallyIndex !== -1 && catchIndex > finallyIndex)) {
    fail('startButton click handler must keep an error recovery catch before finally.');
  } else {
    const catchBody = body.slice(catchIndex, finallyIndex === -1 ? undefined : finallyIndex);
    for (const token of [
      'window.titleScreen.show();',
      "startOverlay.classList.remove('hidden');",
      "startOverlay.style.display = '';",
      "this.textContent = 'ERROR - RETRY';",
      'this.disabled = false;',
      "this.textContent = 'START SYSTEM';"
    ]) {
      if (!catchBody.includes(token)) {
        fail(`startButton failure recovery must include ${token}`);
      }
    }
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
