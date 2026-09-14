// Real production owners; only platform services are stubbed. Makko remains a review gate.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
const plain = v => JSON.parse(JSON.stringify(v));
function rig() {
  const r = createRig();
  const storage = new Map();
  r.w.localStorage = { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
  for (const file of ['src/game/combat-fx.js', 'src/game/lore-collection.js', 'src/game/level-01-stage-fx.js', 'src/engine/renderer.js']) load(r.context, file);
  r.w.renderer = Object.create(r.w.Renderer.prototype); r.w.renderer.clearScreenShake(); r.w.renderer.zoomLevel = 1;
  r.p.startMission();
  return { ...r, storage };
}
function enemy(w, dx, dy = 0, type = 'virus') {
  const e = new w.Enemy(w.player.position.x + dx, w.player.position.y + dy, type);
  e.position.x = w.player.position.x + dx; e.position.y = w.player.position.y + dy;
  e.health = 100; e.active = true; e.entranceComplete = true; return e;
}

// Cache Overpass uses the existing protected entrance owner for roof arrivals.
{
  const { w, p } = rig(); w.player.position.x = 1600;
  const e = p.spawnMissionEnemy({ type: 'virus', x: 1900, y: 650 }, 'encounter_2', 0);
  assert.strictEqual(e.position.y, 258); assert(e.isSpawnProtected());
  const destination = plain(e._entranceTarget);
  for (let i = 0; i < 600 && e._authoredEntranceActive; i++) e.updateAuthoredEntrance(16);
  assert(e.entranceComplete); assert.strictEqual(e.position.y, destination.y);
  assert.strictEqual(w.enemyManager.enemies.filter(enemy => enemy === e).length, 1);
  assert.strictEqual(p.missionDefeats, 0, 'staging cannot advance the quota');
}

// Thresholds change the actual target geometry; previews and damage agree.
for (const [combo, expectedPattern, expectedIndices] of [[0, 'pulse', [0]], [4, 'wave', [0, 1]], [9, 'discharge', [0, 1, 2, 3]]]) {
  const { w } = rig(), c = w.BARCODE.playerCombat;
  w.rhythmSystem.combo = combo;
  const list = [enemy(w, 200), enemy(w, 370), enemy(w, 480), enemy(w, 515), enemy(w, -480), enemy(w, 900)];
  w.enemyManager.enemies = list;
  const before = plain({ hp: list.map(e => e.health), combo, charges: w.BARCODE.signalAmpCharges, sequence: c.sequence });
  const preview = c.getTargetPreview();
  assert.deepStrictEqual(preview.map(e => list.indexOf(e.target)), expectedIndices);
  assert.deepStrictEqual(plain({ hp: list.map(e => e.health), combo: w.rhythmSystem.combo, charges: w.BARCODE.signalAmpCharges, sequence: c.sequence }), before);
  const hit = c.resolvePrimary({ now: 20000, timing: { available: true, timing: 'perfect' } });
  assert.strictEqual(hit.pattern, expectedPattern);
  assert.deepStrictEqual(plain(hit.targets.map(t => t.x)), plain(preview.map(t => t.target.position.x)));
  list.forEach((e, i) => assert.strictEqual(e.health, expectedIndices.includes(i) ? 97 : 100));
  assert(hit.targets.filter(t => t.via === 'chain').length <= 2);
  assert.strictEqual(new Set(hit.targets.map(t => t.x)).size, hit.targets.length);
}
{
  const { w } = rig(), c = w.BARCODE.playerCombat;
  w.rhythmSystem.combo = 4; w.player.facing = -1;
  const list = [enemy(w, -370), enemy(w, 370), enemy(w, -330, 130)]; w.enemyManager.enemies = list;
  assert.deepStrictEqual(c.getTargetPreview().map(t => list.indexOf(t.target)), [0], 'wave is forward and vertically bounded');
  w.BARCODE.signalAmpCharges = 3; w.rhythmSystem.combo = 9;
  list.push(enemy(w, -490), enemy(w, -515), enemy(w, -530));
  const hit = c.resolvePrimary({ now: 20000, timing: { available: true, timing: 'excellent' } });
  assert.strictEqual(w.BARCODE.signalAmpCharges, 2, 'one charge for the whole attack');
  assert(!hit.targets.some(t => t.x === list[5].position.x), 'Amp plus chains never exceed 520');
  const hp = list.map(e => e.health);
  c.resolvePrimary({ now: 20500, timing: { available: true, timing: 'miss' } });
  assert.deepStrictEqual(list.map(e => e.health), hp); assert.strictEqual(w.BARCODE.signalAmpCharges, 2);
  assert.strictEqual(c.getPattern(), 'pulse', 'miss drops the actual attack tier');
}

// Direction, elapsed-time decay, pause, bounded priority, optional camera motion.
for (const fps of [30, 60, 120, 144]) {
  const { w } = rig(), camera = w.renderer;
  camera.impact('hit', { direction: -1 }); camera.applyScreenShake(10); assert(camera.screenShake.x < 0);
  camera.clearScreenShake(); camera.impact('land'); camera.applyScreenShake(10); assert(camera.screenShake.y > 0);
  camera.impact('destruction'); camera.impact('hit'); assert.strictEqual(camera.screenShake.kind, 'destruction');
  const before = plain(camera.screenShake); w.isPaused = true; camera.applyScreenShake(100); assert.deepStrictEqual(plain(camera.screenShake), before); w.isPaused = false;
  for (let i = 0; i < fps; i++) { camera.applyScreenShake(1000 / fps); assert(Math.abs(camera.screenShake.x) <= 13 && Math.abs(camera.screenShake.y) <= 13); }
  assert.strictEqual(camera.screenShake.duration, 0);
  camera.impact('victory'); camera.applyScreenShake(200); assert(camera.getImpactZoom() > 1 && camera.getImpactZoom() <= 1.035);
  w.BARCODE_RENDER_QUALITY = { screenShake: false }; camera.applyScreenShake(0); camera.impact('stomp'); assert.strictEqual(camera.getImpactZoom(), 1); assert.strictEqual(camera.screenShake.duration, 0);
}

// Optional interactions use the action owner, save once, and preserve lore and
// concurrent-tab discoveries. Looking, repeated rendering or blocked input do not collect.
{
  const { w, p, context, storage } = rig(), stage = w.BARCODE.stageFX;
  p.state = 'encounter_2'; w.rhythmSystem.hide(); w.player.position.x = 1680; w.player.position.y = 258;
  stage.update(16); assert(stage.nearby); assert.strictEqual(storage.size, 0);
  load(context, 'src/core/action-input.js'); load(context, 'src/core/input.js');
  const input = new w.InputManager(); w.inputManager = input;
  input.actionInput.handleKeyDown('e'); input.actionInput.handleKeyUp('e'); input.routeActions(input.actionInput.update());
  assert(stage.archive().hasEgg('egg.l01.studio-rat')); assert(stage.message && stage.ratAge === 0);
  const revision = stage.archive().record.revision;
  for (let i = 0; i < 10; i++) input.routeActions(input.actionInput.update());
  assert.strictEqual(stage.archive().record.revision, revision);
  assert(stage.inspect().ok); assert.strictEqual(stage.message.line, 1); stage.inspect(); assert(!stage.message);
  stage.update(3601); stage.update(16); assert.strictEqual(stage.ratAge, null);
  assert.strictEqual(stage.findNearby(), null, 'saved Studio Cat event cannot be replayed');
  const other = new w.BARCODE.LoreCollection(); other.collect('lore.l01.02');
  stage.archive().collectEgg('egg.l01.cliff-maintenance');
  const restored = new w.BARCODE.LoreCollection(); assert(restored.has('lore.l01.02')); assert(restored.hasEgg('egg.l01.studio-rat')); assert(restored.hasEgg('egg.l01.cliff-maintenance'));
  assert.strictEqual(restored.getIds().length, 1, 'optional details never count as lore');
  assert(!restored.collectEgg('invented-ending'));
  const count = restored.record.revision;
  w.tutorialSystem.active = true; assert(!stage.inspect().ok); w.tutorialSystem.active = false;
  w.hackingSystem.active = true; assert(!stage.inspect().ok); w.hackingSystem.active = false;
  w.isPaused = true; assert(!stage.inspect().ok); w.isPaused = false;
  p.spawnedEncounterIds.add(p.state); assert(!stage.inspect().ok); p.spawnedEncounterIds.clear();
  w.player.grounded = false; assert(!stage.inspect().ok); w.player.grounded = true;
  assert.strictEqual(new w.BARCODE.LoreCollection().record.revision, count);
  let pads = [{ connected: true, axes: [0, 0], buttons: Array.from({ length: 16 }, (_, i) => ({ pressed: i === 4, value: i === 4 ? 1 : 0 })) }];
  w.navigator.getGamepads = () => pads; pads[0].buttons[4].pressed = false; pads[0].buttons[4].value = 0; input.actionInput.reset(); input.actionInput.update(); pads[0].buttons[4].pressed = true; pads[0].buttons[4].value = 1;
  let actions = input.actionInput.update(); assert(actions.inspect.pressed); assert(!actions.interact.pressed, 'LB inspection never triggers Y/H hacking');
  stage.react(1680, 1, 'stomp'); stage.event('clear', 1680); stage.update(100);
  const snapshot = plain({ events: stage.events, time: stage.timeMs, reactions: stage.reactions, kick: stage.captionKick });
  w.gameState.paused = true; stage.update(1000); assert.deepStrictEqual(plain({ events: stage.events, time: stage.timeMs, reactions: stage.reactions, kick: stage.captionKick }), snapshot); w.gameState.paused = false;
  w.BARCODE.playerCombat.reset(); assert(!stage.message && stage.events.length === 0 && stage.reactions.length === 0);
  assert(stage.archive().hasEgg('egg.l01.studio-rat'), 'reset preserves durable facts');
}

// Predictive target is fixed, notes approach it, and visual calibration cannot
// alter judgments. Effects finish after actors are removed and on victory frames.
{
  const { w, context } = rig();
  const time = 60 / 146 * 50; w.audioSystem.context.currentTime = time;
  const first = w.rhythmSystem.getPredictiveNotes(); assert(first.notes.some(n => Math.abs(n.x - 96) < 1e-6));
  const future = first.notes.find(n => n.index === 51); w.audioSystem.context.currentTime += 0.1;
  const moved = w.rhythmSystem.getPredictiveNotes().notes.find(n => n.index === 51); assert(moved.x < future.x);
  const judgment = plain(w.BARCODE.playerCombat.getTimingJudgment(time));
  w.BARCODE.Preferences = { values: { visualOffsetMs: 160 } }; w.rhythmSystem.getPredictiveNotes();
  assert.deepStrictEqual(plain(w.BARCODE.playerCombat.getTimingJudgment(time)), judgment);
  const fx = w.BARCODE.combatFX; fx.contact('virus', 900, 700, 1, true, true); w.enemyManager.enemies = [];
  fx.update(600); assert(fx.events.some(e => e.defeated)); fx.update(400); assert(!fx.events.length);
  fx.contact('firewall', 900, 700, 1, true, true); w.gameState.running = false; w.gameState.victory = true;
  for (let i = 0; i < 10; i++) w.updateGame(100); assert(!fx.events.length, 'terminal frame owner finishes final-hit debris');
  const stage = w.BARCODE.stageFX; stage.event('clear', 900); stage.update(100);
  load(context, 'src/game/ui-manager.js');
  const calls = [], ctx = new Proxy({}, { get: (o, k) => k === 'measureText' ? t => ({ width: String(t).length * 8 }) : o[k] || ((...a) => { calls.push([k, ...a]); }), set: (o, k, v) => (o[k] = v, true) });
  w.gameState.running = true; w.gameState.victory = false;
  const before = plain({ events: stage.events, reactions: stage.reactions, msg: stage.message, revision: stage.archive().record.revision });
  for (let i = 0; i < 10; i++) { stage.drawWorld(ctx); stage.drawHUD(ctx); w.rhythmSystem.drawCompactHUD(ctx); }
  assert.deepStrictEqual(plain({ events: stage.events, reactions: stage.reactions, msg: stage.message, revision: stage.archive().record.revision }), before, 'drawing is read only');
  assert(calls.some(c => c[0] === 'fillRect' && c[1] === 150.5 && c[2] === 235 && c[3] === 3 && c[4] === 68), 'fixed rhythm target in the approved HUD lane');
}
{
  const r = rig(), { w, p, context } = r; r.reachReady(); p.beginBossCombat();
  load(context, 'src/game/ui-manager.js');
  const texts = [], ctx = new Proxy({}, { get: (o, k) => k === 'measureText' ? t => ({ width: String(t).length * 8 }) : o[k] || ((...a) => { if (k === 'fillText') texts.push(a[0]); }), set: (o, k, v) => (o[k] = v, true) });
  w.gameState.score = 12480; w.rhythmSystem.runBestCombo = 23;
  p.completeLevel(); w.drawGameUI(ctx);
  assert(!texts.includes('SECTOR 1 COMPLETE'), 'final blow has 620ms of visible world before the result card');
  p.updateCompletionPresentation(620);
  assert.strictEqual(p.getCompletionReveal(), 0);
  assert(p.getCompletionPresentation().every(row => row.progress === 0), 'no count-up is spent behind the final impact');
  p.updateCompletionPresentation(120); texts.length = 0; w.drawGameUI(ctx);
  assert(texts.includes('SECTOR 1 COMPLETE')); assert.strictEqual(p.getCompletionReveal(), 0.5);
  assert(p.getCompletionPresentation().every(row => row.progress === 0), 'rows wait until the results card is fully visible');
  p.updateCompletionPresentation(120); assert.strictEqual(p.getCompletionReveal(), 1);
  assert(p.getCompletionPresentation().every(row => row.value === 0));
  p.updateCompletionPresentation(220);
  const counting = p.getCompletionPresentation();
  assert(counting[0].value > 0 && counting[0].value < 12480, 'score visibly counts up after the fade');
  assert.strictEqual(counting[1].progress, 0, 'later rows retain their stagger');
  w.isPaused = true; p.updateCompletionPresentation(5000);
  assert.deepStrictEqual(plain(p.getCompletionPresentation()), plain(counting), 'pause preserves the visible count-up');
  w.isPaused = false; p.updateCompletionPresentation(5000);
  assert(p.getCompletionPresentation().every(row => row.progress === 1 && row.value === row.finalValue), 'the clock includes the hold, fade and every complete row');
  assert.strictEqual(w.renderer.screenShake.kind, 'victory');
  assert(p.retryBossCheckpoint().ok); assert.strictEqual(w.BARCODE.stageFX.events.length, 0);
  assert.strictEqual(p.getCompletionReveal(), 0); assert.strictEqual(p.getCompletionPresentation(), null);
  w.BARCODE.stageFX.update(16); assert(!w.BARCODE.stageFX.events.some(e => e.kind === 'clear'), 'retry cannot replay four neighborhood clears');
}
console.log('Impact pass: attack tiers/preview parity, Amp bounds, directional cameras, protected roof arrivals, discovery input/save isolation, predictive timing and effect lifecycle passed.');
