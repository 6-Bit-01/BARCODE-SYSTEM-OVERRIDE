#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
let perfMs = 0;
const sandbox = {
  window: {},
  console,
  performance: { now: () => perfMs }
};
sandbox.window.window = sandbox.window;
sandbox.window.console = console;
sandbox.window.performance = sandbox.performance;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(root, 'src/engine/music-clock.js'), 'utf8'), sandbox, { filename: 'music-clock.js' });
const MusicClock = sandbox.window.MusicClock;

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); }
  catch (error) { console.error(`✗ ${name}`); throw error; }
}

function fakeContext(t = 0) { return { currentTime: t }; }

test('exact anchor produces beat zero and phase zero', () => {
  const ctx = fakeContext(10);
  const clock = new MusicClock({ bpm: 146 });
  clock.start({ context: ctx, anchorTime: 10 });
  const s = clock.sample();
  assert.equal(s.absoluteBeatIndex, 0);
  assert.equal(s.beatPhase, 0);
});

test('half a beat produces phase 0.5', () => {
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  clock.start({ context: ctx, anchorTime: 0 });
  ctx.currentTime = clock.beatDuration / 2;
  assert(Math.abs(clock.sample().beatPhase - 0.5) < 1e-9);
});

test('correct beat/bar/phrase boundaries', () => {
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  clock.start({ context: ctx, anchorTime: 0 });
  ctx.currentTime = clock.beatDuration * 17;
  const s = clock.sample();
  assert.equal(s.absoluteBeatIndex, 17);
  assert.equal(s.beatWithinBar, 1);
  assert.equal(s.barWithinPhrase, 0);
  assert.equal(s.absoluteBarIndex, 4);
  assert.equal(s.phraseIndex, 1);
});

test('frame hitch crossing several beats emits each boundary once', () => {
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  const beats = [], bars = [], phrases = [];
  clock.on('beat', e => beats.push(e.beat));
  clock.on('bar', e => bars.push(e.bar));
  clock.on('phrase', e => phrases.push(e.phrase));
  clock.start({ context: ctx, anchorTime: 0 });
  ctx.currentTime = clock.beatDuration * 5;
  clock.sample();
  assert.deepEqual(beats, [0,1,2,3,4,5]);
  assert.deepEqual(bars, [0,1]);
  assert.deepEqual(phrases, [0]);
});

test('repeated sampling does not duplicate events', () => {
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  let count = 0;
  clock.on('beat', () => count++);
  clock.start({ context: ctx, anchorTime: 0 });
  ctx.currentTime = clock.beatDuration * 2;
  clock.sample(); clock.sample(); clock.sample();
  assert.equal(count, 3);
});

test('reanchor invalidates the previous epoch', () => {
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  clock.start({ context: ctx, anchorTime: 0 });
  const before = clock.getSnapshot().epoch;
  clock.reanchor({ context: ctx, anchorTime: 4 });
  assert.notEqual(clock.getSnapshot().epoch, before);
  assert.equal(clock.getSnapshot().anchorTime, 4);
});

test('stop prevents further events', () => {
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  let count = 0;
  clock.on('beat', () => count++);
  clock.start({ context: ctx, anchorTime: 0 });
  clock.stop();
  ctx.currentTime = 99;
  clock.sample();
  assert.equal(count, 0);
});

test('early and late inputs produce signed offsets', () => {
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  clock.start({ context: ctx, anchorTime: 0 });
  ctx.currentTime = clock.beatDuration - 0.050;
  assert(clock.judgeNearestBeat().signedOffsetMs < 0);
  ctx.currentTime = clock.beatDuration + 0.050;
  assert(clock.judgeNearestBeat().signedOffsetMs > 0);
});

test('perfect excellent miss thresholds are 60/100 ms', () => {
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  clock.start({ context: ctx, anchorTime: 0 });
  ctx.currentTime = 0.060; assert.equal(clock.judgeNearestBeat().timing, 'perfect');
  ctx.currentTime = 0.080; assert.equal(clock.judgeNearestBeat().timing, 'excellent');
  ctx.currentTime = 0.101; assert.equal(clock.judgeNearestBeat().timing, 'miss');
});

test('audio mode and fallback mode cannot run simultaneously', () => {
  perfMs = 1000;
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  clock.startFallback();
  assert.equal(clock.getSnapshot().mode, 'fallback');
  clock.reanchor({ context: ctx, anchorTime: 0 });
  assert.notEqual(clock.getSnapshot().mode, 'fallback');
});

test('large hitch emits resync instead of flooding', () => {
  const ctx = fakeContext(0);
  const clock = new MusicClock({ bpm: 146 });
  let beats = 0, resync = 0;
  clock.on('beat', () => beats++);
  clock.on('resync', () => resync++);
  clock.start({ context: ctx, anchorTime: 0 });
  clock.sample();
  ctx.currentTime = clock.beatDuration * 1000;
  clock.sample();
  assert.equal(resync, 1);
  assert.equal(beats, 1);
});

const musicClockSource = fs.readFileSync(path.join(root, 'src/engine/music-clock.js'), 'utf8');
const audioSource = fs.readFileSync(path.join(root, 'src/engine/audio.js'), 'utf8');
const rhythmSource = fs.readFileSync(path.join(root, 'src/game/rhythm.js'), 'utf8');

test('no timer scheduler exists inside music-clock.js', () => {
  assert(!/setTimeout|setInterval|Date\.now/.test(musicClockSource));
});

test('audio.js no longer recursively schedules rhythm beats', () => {
  assert(!/syncWithAudioBeat\s*\(\)/.test(audioSource));
  assert(!/firstBeatTime|beatScheduler/.test(audioSource));
});

test('rhythm.js uses music clock for input judgment', () => {
  assert(/musicClock\.judgeNearestBeat/.test(rhythmSource));
});

test('R-overlay visibility does not own clock start/stop', () => {
  const showBody = rhythmSource.match(/show\(\) \{([\s\S]*?)\n  \}/)[1];
  const hideBody = rhythmSource.match(/hide\(\) \{([\s\S]*?)\n  \}/)[1];
  assert(!/musicClock\.(start|stop|reanchor)/.test(showBody));
  assert(!/musicClock\.(start|stop|reanchor)/.test(hideBody));
});

console.log('Music clock validation passed.');
