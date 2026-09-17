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

assert(!/setTimeout\s*\(/.test(tutorial), 'tutorial uses no competing wall-clock spawn or transition callbacks');
const spawns = blockFrom(tutorial, '  updateCombatSpawns(delta) {', '  recordEnemyDefeat(enemy) {');
assert(spawns.includes('item.run !== this.runGeneration'), 'queued enemies belong to the current tutorial run');
assert(spawns.includes('this.spawnElapsedMs += delta'), 'entrances follow simulation time');
const startTutorial = blockFrom(tutorial, '  startTutorial() {', '  startChapter(chapter) {');
const startChapter = blockFrom(tutorial, '  startChapter(chapter) {', '  addDialogue(');
const completeTutorial = blockFrom(tutorial, '  completeTutorial() {', '  control(action) {');
const activeSetter = blockFrom(tutorial, '  set active(value) {', '  isActive()');
assert(startTutorial.includes('this.runGeneration++') && startTutorial.includes('this.startChapter(0)'), 'restart invalidates the previous run and resets the lesson queue');
assert(startChapter.includes('this.cancelPendingTimers()'), 'chapter changes cancel the spawn queue');
assert(completeTutorial.includes('this.active = false'), 'completion follows the common deactivation path');
assert(activeSetter.includes('this.cancelPendingTimers()'), 'direct debug skip/reset deactivation cancels pending spawns');

assert(tutorial.includes('this.finalMessageHoldTime = 10000;'), 'final tutorial message must retain its 10 second hold');
assert(tutorial.includes('/ 2000'), 'final tutorial message must retain its 2 second fade');
assert(tutorial.includes('handleSpacePress()') && tutorial.includes('this.advanceDialogue();'), 'tutorial must retain exclusive Space-driven dialogue advancement');

console.log('✅ Level 1 audio smoothing and tutorial simulation-clock ownership checks passed');
