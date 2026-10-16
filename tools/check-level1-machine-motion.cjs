#!/usr/bin/env node
// Exercise the actual Level 1 machinery/atmosphere owners through public asset
// boundaries. Native Canvas pixel review lives in the presentation check.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRig, load } = require('./check-level-01-boss');
const { createSprite } = require('./makko-animation-fixture');
const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/sprites-v3/prepared/broadcast_jammer_idle_idle.json')));
const near = (actual, expected) => assert(Math.abs(actual - expected) < 1e-5, `${actual} / ${expected}`);

function contextRecorder() {
  const operations = [], stack = [];
  const target = { globalAlpha: 1 };
  const ctx = new Proxy(target, {
    get(object, key) {
      if (key in object) return object[key];
      if (key === 'save') return () => stack.push({ ...object });
      if (key === 'restore') return () => Object.assign(object, stack.pop());
      return (...args) => operations.push([key, object.globalAlpha, object.fillStyle, ...args]);
    },
    set(object, key, value) { object[key] = value; return true; }
  });
  return { ctx, operations, stack };
}

function machineryRig() {
  const rig = createRig(), { w } = rig;
  const sprite = createSprite({ broadcast_jammer_idle_idle: 48 });
  let ready = true, requests = 0, plays = 0;
  const originalPlay = sprite.play.bind(sprite), paints = [], fallbacks = [];
  sprite.isLoaded = () => ready;
  sprite.play = (...args) => {
    plays++;
    const ref = originalPlay(...args);
    sprite.currentSprite.metadata.frames = Object.fromEntries(Object.values(metadata.frames).map((frame, index) => [String(index), frame]));
    sprite.currentSprite.getAnchorPoint = () => ({ x: 176, y: 340 });
    sprite.currentSprite.hasManifestAnchor = () => true;
    return ref;
  };
  sprite.draw = (_ctx, x, y, options) => paints.push({ x, y, ...options, frame: sprite.currentSprite.currentFrame });
  w.MakkoEngine.sprite = () => { requests++; return sprite; };
  w.BARCODE.PresentationAssets = { draw: (key, _ctx, args) => { fallbacks.push({ key, ...args }); return true; } };
  return { ...rig, sprite, paints, fallbacks, setReady: value => ready = value,
    requests: () => requests, plays: () => plays, env: w.BARCODE.JammerEnvironment };
}

for (const fps of [30, 60, 120, 144]) {
  const { env, sprite, paints, fallbacks, requests, plays, w } = machineryRig();
  const drawing = contextRecorder();
  env.reveal({ position: { x: 2000, y: 784 } });
  const bounds = JSON.stringify(env.getAimBounds());
  let remaining = 11000;
  while (remaining > 1e-7) {
    const delta = Math.min(remaining, 1000 / fps); env.update(delta); env.draw(drawing.ctx); remaining -= delta;
  }
  assert.equal(new Set(paints.map(p => p.frame)).size, 48, 'production draw reaches every native Jammer cel');
  assert.equal(sprite.currentSprite.currentFrame, Math.floor(11000 * 0.72 / 83) % 48, 'machinery cadence agrees across render rates');
  near(sprite.currentSprite.timeAccumulator, 11000 * 0.72 % 83);
  assert(paints.every(p => p.x === 2000 && p.y === 856 && p.scale === 0.4666666666666666 && p.flipH === false), 'prepared source anchors keep every native base bolted to the sidewalk');
  assert.equal(fallbacks.length, 0, 'loaded native clip takes priority over painted fallback');
  assert.equal(requests(), 1); assert.equal(plays(), 1);
  assert.equal(env.getStatus().health, 16); assert.equal(JSON.stringify(env.getAimBounds()), bounds, 'art does not change the target body');
  const status = JSON.stringify(env.getStatus()), frame = sprite.currentSprite.currentFrame;
  const accumulator = sprite.currentSprite.timeAccumulator;
  drawing.operations.length = 0; env.draw(drawing.ctx); const first = JSON.stringify(drawing.operations);
  drawing.operations.length = 0; env.draw(drawing.ctx);
  assert.equal(JSON.stringify(drawing.operations), first, 'repeated drawing is pure');
  assert.equal(JSON.stringify(env.getStatus()), status);
  for (const flag of ['isPaused', 'paused']) {
    if (flag === 'isPaused') w.isPaused = true; else w.gameState.paused = true;
    env.update(1000); drawing.operations.length = 0; env.draw(drawing.ctx);
    assert.equal(JSON.stringify(drawing.operations), first, 'direct pause keeps lamp/transmission phase');
    assert.equal(sprite.currentSprite.currentFrame, frame); near(sprite.currentSprite.timeAccumulator, accumulator);
    w.isPaused = false; w.gameState.paused = false;
  }
  for (const values of [{ reducedMotion: true }, { flashes: false }]) {
    w.BARCODE.Preferences = { values }; env.draw(drawing.ctx);
    drawing.operations.length = 0; env.draw(drawing.ctx); const still = JSON.stringify(drawing.operations);
    env.update(1000); drawing.operations.length = 0; env.draw(drawing.ctx);
    assert.equal(sprite.currentSprite.currentFrame, frame, 'comfort setting keeps a steady native cel');
    assert.equal(JSON.stringify(drawing.operations), still, 'comfort setting keeps localized power cues steady');
  }
  w.BARCODE.Preferences.values = {}; env.update(200);
  assert.notEqual(sprite.currentSprite.currentFrame, frame, 'same clip resumes without restarting');
  assert.equal(plays(), 1);
  assert.equal(drawing.stack.length, 0);
}

// A late loading SDK cannot draw early or allocate another sprite per frame.
{
  const { env, paints, fallbacks, setReady, requests, plays } = machineryRig();
  const { ctx } = contextRecorder(); setReady(false); env.reveal();
  for (let i = 0; i < 60; i++) { env.update(100); env.draw(ctx); }
  assert.equal(paints.length, 0); assert.equal(requests(), 1); assert.equal(plays(), 0);
  assert.equal(new Set(fallbacks.map(p => p.frame)).size, 48, 'bounded fallback retains the authored loop');
  assert(fallbacks.every(p => p.y === 856 && p.width === 352 * 0.4666666666666666));
  setReady(true); env.update(100); env.draw(ctx);
  assert.equal(plays(), 1); assert.equal(paints.length, 1);
  env.dispose(); const painted = paints.length; env.update(1000); env.draw(ctx);
  assert.equal(paints.length, painted, 'disposed owner cannot keep painting');
}

// Atmospheric motion has bounded, independently paced local accents while
// buildings/terrain retain their original transforms and texture cache.
{
  const { w, context, timers } = createRig(); load(context, 'src/engine/parallax.js');
  const bg = new w.ParallaxBackground(), layer = { imgElement: {} };
  bg.layers = [{}, layer]; w.renderer.zoomLevel = 1;
  const textures = { steam: { id: 'steam' }, mint: { id: 'mint' }, purple: { id: 'purple' } };
  bg.atmosphereSprites = textures; w.BARCODE.combatFX = { timeMs: 0 };
  const { ctx, operations, stack } = contextRecorder(), timerCount = timers.size;
  const paint = time => {
    w.BARCODE.combatFX.timeMs = time; operations.length = 0;
    bg.drawAtmosphere(ctx, layer, 0, 0, 1279, 462); return JSON.stringify(operations);
  };
  assert.notEqual(paint(900), paint(2100), 'real signs/rain/steam/puddles visibly advance the existing clock');
  assert(operations.filter(p => p[0] === 'drawImage').length <= 14, 'existing texture draw budget stays bounded');
  assert.equal(operations.filter(p => p[0] === 'ellipse').length, 10, 'exactly two finite rain rings per authored neon spill');
  assert.equal(paint(2100), paint(2100), 'drawing samples phase without mutating owners');
  w.BARCODE.Preferences = { values: { reducedMotion: true } };
  assert.equal(paint(900), paint(2100), 'Reduced Motion keeps atmospheric geometry steady');
  assert.equal(operations.filter(p => p[0] === 'ellipse').length, 0);
  assert.equal(bg.shouldPlaySkyAnimation(), false, 'Reduced Motion pauses the existing skyline video');
  w.BARCODE.Preferences.values = { flashes: false };
  assert.equal(paint(900), paint(2100), 'Flashes Off keeps atmosphere and reflected light steady');
  assert.equal(bg.shouldPlaySkyAnimation(), false);
  assert.equal(bg.getSceneMusic().beatFloat, 0, 'Flashes Off keeps sign patterns steady');
  assert.equal(bg.atmosphereSprites, textures); assert.equal(timers.size, timerCount); assert.equal(stack.length, 0);
  operations.length = 0; bg.drawAtmosphere(ctx, layer, 20000, 0, 1279, 462);
  assert.equal(operations.length, 0, 'offscreen accents retain culling');
}
console.log('Level 1 machinery motion: 48 native Jammer cels, variable frame pacing, bolted anchors, pause/purity, bounded late-load fallback, distinct atmospheric cadence/budgets and comfort settings passed.');
