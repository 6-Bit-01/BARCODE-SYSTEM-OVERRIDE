#!/usr/bin/env node
const fs = require('fs');

const audio = fs.readFileSync('src/engine/audio.js', 'utf8');
const tutorial = fs.readFileSync('src/game/tutorial.js', 'utf8');

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function blockFrom(source, start, end) {
  const startIndex = source.indexOf(start);
  assert(startIndex !== -1, `missing block start: ${start}`);
  const endIndex = source.indexOf(end, startIndex + start.length);
  assert(endIndex !== -1, `missing block end: ${end}`);
  return source.slice(startIndex, endIndex);
}

const gainRamp = blockFrom(audio, '  rampAdaptiveStemGain(', '  beginRuntimeAudioGeneration()');
assert(audio.includes('const ADAPTIVE_STEM_GAIN_RAMP_SEC = 0.18;'), 'adaptive stem transition must remain a short 180ms ramp');
assert(gainRamp.includes('cancelAndHoldAtTime') && gainRamp.includes('cancelScheduledValues') && gainRamp.includes('setValueAtTime'), 'stem ramp must safely replace an in-flight automation curve');
assert(gainRamp.includes('linearRampToValueAtTime(target, now + duration)'), 'stem gain must use Web Audio automation');
assert(gainRamp.includes('gainParam.value = target'), 'stem gain must retain a direct-assignment fallback for partial Web Audio implementations');
assert(gainRamp.includes('track.volume = target'), 'requested adaptive mix state must remain explicit');

const updateLayers = blockFrom(audio, '  updateLayers() {', '  determineActiveLayers() {');
assert((updateLayers.match(/rampAdaptiveStemGain/g) || []).length >= 2, 'cutscene mute and adaptive layer changes must both use the ramp helper');
assert(!/gain\.gain\.value\s*=/.test(updateLayers), 'adaptive update loop must not make abrupt gain assignments');
assert(!/\.source\.(?:start|stop)\s*\(/.test(updateLayers), 'adaptive gain changes must not restart synchronized sources');
const playLayer = blockFrom(audio, '  playLayer(layerName, volume = 0.5) {', '  stopLayer(layerName) {');
assert(playLayer.includes('layerGain.gain.value = 0;') && playLayer.includes('this.rampAdaptiveStemGain(track, volume);'), 'an emergency-started adaptive stem must fade in without changing its source start time');

const tutorialClass = tutorial.slice(tutorial.indexOf('window.TutorialSystem = class TutorialSystem'), tutorial.indexOf('// Create global tutorial system'));
assert((tutorialClass.match(/setTimeout\s*\(/g) || []).length === 1, 'all in-class tutorial delays must flow through the one owned scheduler');
assert((tutorialClass.match(/_scheduleTutorialTimer\s*\(/g) || []).length >= 8, 'enemy and transition delays must share the owned tutorial timer registry');

const scheduler = blockFrom(tutorial, '  _scheduleTutorialTimer(', '  cancelPendingTimers()');
assert(scheduler.includes('generation !== this._tutorialTimerGeneration'), 'chapter/tutorial generation must invalidate stale callbacks');
assert(scheduler.includes('!this.active'), 'debug skip/completion must invalidate stale callbacks');
assert(scheduler.includes('currentRuntimeGeneration !== runtimeGeneration'), 'runtime restart must invalidate callbacks from the prior run');

const startTutorial = blockFrom(tutorial, '  startTutorial() {', '  startChapter(chapter) {');
const startChapter = blockFrom(tutorial, '  startChapter(chapter) {', '  addDialogue(');
const completeTutorial = blockFrom(tutorial, '  completeTutorial() {', '  draw(ctx) {');
const activeSetter = blockFrom(tutorial, '  set active(value) {', '  startTutorial() {');
assert(startTutorial.includes('_cancelPendingTutorialTimers()'), 'tutorial restart must cancel old callbacks');
assert(startChapter.includes('_cancelPendingTutorialTimers()'), 'chapter changes must cancel old callbacks');
assert(completeTutorial.includes('_cancelPendingTutorialTimers()'), 'tutorial completion must cancel old callbacks');
assert(activeSetter.includes('_cancelPendingTutorialTimers()'), 'direct debug skip/reset deactivation must cancel old callbacks');

assert(tutorial.includes('this.finalMessageHoldTime = 10000;'), 'final tutorial message must retain its 10 second hold');
assert(tutorial.includes('/ 2000'), 'final tutorial message must retain its 2 second fade');
assert(tutorial.includes('handleSpacePress()') && tutorial.includes('this.advanceDialogue();'), 'tutorial must retain exclusive Space-driven dialogue advancement');

console.log('✅ Level 1 audio smoothing and tutorial timer ownership checks passed');
