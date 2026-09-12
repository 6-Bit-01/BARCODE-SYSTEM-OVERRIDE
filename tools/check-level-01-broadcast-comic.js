#!/usr/bin/env node
// Production scene/progression methods. Host/Canvas are explicit boundaries.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
const copy = value => JSON.parse(JSON.stringify(value));
function rig() {
  const r = createRig();
  load(r.context, 'src/game/broadcast-comic.js');
  r.p.startMission(); r.w.rhythmSystem.hide();
  r.comic = r.w.BARCODE.BroadcastComic;
  return r;
}
function clearFirst(r) {
  const def = r.w.Sector1Progression.ENCOUNTERS[0];
  r.p.spawnEncounter(def);
  // The final packet has been defeated, as observed by the real progression.
  r.p.activeEncounterPacket = def.packets.length - 1;
  r.p.pendingSpawns = [];
  r.p.activeEncounterEnemies = def.enemies.map(() => ({ active: false, _defeatRecorded: true }));
  r.p.updateEncounter(0);
  assert.strictEqual(r.p.state, 'encounter_2');
  assert.strictEqual(r.p.closedGateEncounterId, null);
  assert.strictEqual(r.comic.queued, true);
}

{
  const r = rig(), { w, p, comic, timers, calls } = r;
  const before = { health: w.player.health, score: w.gameState.score, kills: p.missionDefeats,
    mode: w.rhythmSystem.isActive(), clock: copy(w.BARCODE.MusicTransport.getDiagnostics()), timers: timers.size };
  clearFirst(r);
  comic.update(1500); assert.strictEqual(comic.getView().speaker, '6 BIT');
  p.openEncounterGate('encounter_1'); assert.strictEqual(comic.elapsedMs, 1500, 'duplicate clear does not restart');
  const snapshot = copy(comic.getDiagnostics());
  const drawing = { globalAlpha: 1, measureText: text => ({ width: text.length * 14 }) };
  for (const method of ['save', 'restore', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'stroke', 'fill', 'translate', 'rotate', 'fillRect', 'strokeRect', 'fillText']) drawing[method] = () => {};
  comic.draw(drawing); comic.draw(drawing);
  assert.deepStrictEqual(copy(comic.getDiagnostics()), snapshot, 'drawing does not advance or trigger');
  comic.update(9000); assert.strictEqual(comic.getView().speaker, '6 BIT');
  comic.update(5000); assert.strictEqual(comic.played, true); assert.strictEqual(comic.getView(), null);
  assert.strictEqual(comic.queueFirstBlock('encounter_1'), false);
  assert.deepStrictEqual({ health: w.player.health, score: w.gameState.score, kills: p.missionDefeats,
    mode: w.rhythmSystem.isActive(), clock: copy(w.BARCODE.MusicTransport.getDiagnostics()), timers: timers.size }, before,
    'comic cannot award, damage, change rhythm/music, or create a timer');
  assert.strictEqual(w.player.controlsDisabled, false);
  p.reset(); assert.strictEqual(comic.queued, false); assert.strictEqual(comic.elapsedMs, 0);
  p.startMission(); clearFirst(r); assert.strictEqual(comic.played, false, 'new run permits scene');
  assert.deepStrictEqual(calls.errors, []);
}
{
  const r = rig();
  r.p.restoreEncounterSignal('encounter_1');
  assert.strictEqual(r.comic.queued, false, 'district restoration/retry is not a fresh gate-clear event');
  assert.strictEqual(r.comic.queueFirstBlock('encounter_2'), false);
  r.p.reset(); r.p.startMission(); clearFirst(r);
  r.comic.update(NaN); r.comic.update(-100); assert.strictEqual(r.comic.elapsedMs, 0);
}
for (const blocker of ['pause', 'death', 'stopped', 'tutorial', 'rhythm', 'hack', 'enemy', 'pending', 'encounter', 'pickup', 'actor', 'cinematic']) {
  const r = rig(), { w, p, comic } = r; clearFirst(r); comic.update(1600);
  const undo = {
    pause() { w.gameState.paused = true; return () => { w.gameState.paused = false; }; },
    death() { w.gameState.gameOver = true; return () => { w.gameState.gameOver = false; }; },
    stopped() { w.gameState.running = false; return () => { w.gameState.running = true; }; },
    tutorial() { w.tutorialSystem.active = true; return () => { w.tutorialSystem.active = false; }; },
    rhythm() { w.rhythmSystem.show(); return () => w.rhythmSystem.hide(); },
    hack() { w.hackingSystem = { isActive: () => true }; return () => { w.hackingSystem = null; }; },
    enemy() { w.enemyManager.enemies = [{ active: true }]; return () => { w.enemyManager.enemies = []; }; },
    pending() { p.pendingSpawns = [{}]; return () => { p.pendingSpawns = []; }; },
    encounter() { p.activeEncounterId = 'encounter_2'; return () => { p.activeEncounterId = null; }; },
    pickup() { w.gameState.collectionMessage = {}; return () => { w.gameState.collectionMessage = null; }; },
    actor() { w.BARCODE.sceneProjection = { worldToScreen: () => ({ x: 800, y: 400 }) }; return () => { delete w.BARCODE.sceneProjection; }; },
    cinematic() { p.state = 'camera_pan'; return () => { p.state = 'encounter_2'; }; }
  }[blocker]();
  comic.update(1000); assert.strictEqual(comic.elapsedMs, 1600, blocker + ' freezes reading time');
  assert.strictEqual(comic.getView(), null, blocker + ' hides overlay immediately');
  undo(); assert(comic.getView(), blocker + ' permits safe resume');
}
for (const fps of [30, 60, 120, 144]) {
  const r = rig(); clearFirst(r);
  for (let i = 0; i < fps * 8; i++) r.comic.update(1000 / fps);
  assert(Math.abs(r.comic.elapsedMs - 8000) < 1e-6);
  assert.strictEqual(r.comic.getView().speaker, 'SHEILA');
  r.w.BARCODE_RENDER_QUALITY = { flashes: false };
  assert.strictEqual(r.comic.getView().reduced, true);
}
// Verify the actual frame owner ticks once and pause cannot sneak time through.
{
  const r = rig(); clearFirst(r);
  r.w.player.position.x = 700; r.w.checkGameConditions = () => {};
  r.w.updateGame(20); assert.strictEqual(r.comic.elapsedMs, 20);
  r.w.gameState.paused = true; r.w.updateGame(800); assert.strictEqual(r.comic.elapsedMs, 20);
  assert.deepStrictEqual(r.calls.errors, []);
}
console.log('Broadcast comic: real gate-clear path, once/run, 30–144 Hz, pause/threat/input priority, pure draw and gameplay/music isolation passed.');
