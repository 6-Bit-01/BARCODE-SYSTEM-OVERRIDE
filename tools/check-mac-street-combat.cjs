#!/usr/bin/env node
// Exercise the actual pure owner by walking, fighting and fresh input. No test
// changes live health, enemy positions, encounter flags or simulation clocks.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const forbidden = () => { throw new Error('Combat must not create a global owner'); };
const context = {window: {BARCODE: {}}, setTimeout: forbidden, setInterval: forbidden,
  requestAnimationFrame: forbidden, document: {createElement: forbidden, addEventListener: forbidden},
  Audio: forbidden, AudioContext: forbidden};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/game/mac-street-combat.js'), 'utf8'), context);
const C = context.window.BARCODE.MacStreetCombat;
const plain = value => JSON.parse(JSON.stringify(value));
const press = name => ({[name]: {pressed: true, held: true}});
let groups = 0;
function check(name, body) { body(); groups++; console.log(`PASS ${name}`); }
function rig(hz = 60) {
  const game = C.create(), dt = 1000 / hz, events = [];
  let frames = 0;
  const r = {game, events, dt, view: () => game.getSnapshot(),
    step(input = {}, delta = dt) { frames++; const result = game.update(delta, input);
      events.push(...game.drainEvents()); return result; },
    run(ms, input = {}) { for (let n = 0; n < Math.round(ms / dt); n++) r.step(input); return r.view(); },
    until(predicate, input = {}, limitMs = 20000) {
      for (let n = 0; n < Math.ceil(limitMs / dt); n++) {
        if (predicate(r.view())) return r.view();
        r.step(typeof input === 'function' ? input(r.view()) : input);
      }
      assert.fail(`Timed out after ${limitMs} ms at ${JSON.stringify(r.view())}`);
    }, get frames() { return frames; }};
  return r;
}
function engage(r) {
  return r.until(s => s.enemies[0].phase === 'windup', {move_x: 1});
}
function near(r) {
  engage(r);
  r.until(() => r.game.getControlState().throw.ready, {move_x: 1}, 250);
  r.step();
}
function nextEnemy(s) {
  return s.enemies.filter(e => e.hp > 0 && e.phase !== 'dormant')
    .sort((a, b) => Math.abs(a.x - s.player.x) - Math.abs(b.x - s.player.x))[0];
}
// A simple tactical player drives the real route. Read telegraphs, approach on
// the ground plane, throw if close and press ordinary Strike only when ready.
function fight(r, limitMs = 80000) {
  let strikeWasHeld = false, throwWasHeld = false;
  r.until(s => s.desk.unlocked || s.status === 'defeated', s => {
    const controls = r.game.getControlState(), p = s.player, foe = nextEnemy(s);
    const input = {};
    if (!foe) input.move_x = 1;
    else {
      input.move_x = Math.abs(foe.x - p.x) > 64 ? Math.sign(foe.x - p.x) : 0;
      input.move_y = Math.abs(foe.laneY - p.laneY) > 8 ? Math.sign(foe.laneY - p.laneY) : 0;
      // One fresh action then a released frame, including queued combo presses.
      if (controls.throw.ready && !throwWasHeld) input.throw = {pressed: true, held: true};
      else if (controls.strike.ready && !strikeWasHeld &&
        Math.abs(foe.x - p.x) <= 100 && Math.abs(foe.laneY - p.laneY) <= 35)
        input.strike = {pressed: true, held: true};
      if (foe.phase === 'windup' && foe.tellMs - foe.phaseMs < 105 && !p.attack)
        input.guard = {held: true};
    }
    strikeWasHeld = !!input.strike; throwWasHeld = !!input.throw;
    return input;
  }, limitMs);
  return r.view();
}

check('isolated factory, defensive snapshots and bounded supplied delta', () => {
  const a = C.create(), b = C.create(), before = a.getSnapshot();
  assert.equal(before.player.x, 200); assert.equal(before.player.laneY, 880);
  assert.equal(before.enemies.length, 3); assert.equal(before.desk.unlocked, false);
  before.player.hp = 0; before.enemies[0].hp = 0;
  assert.equal(a.getSnapshot().player.hp, 100);
  a.update(NaN, {move_x: 1}); a.update(-100); assert.equal(a.getSnapshot().elapsedMs, 0);
  a.update(100000); b.update(100, {move_x: 1});
  assert.deepEqual(plain(a.getSnapshot()), plain(b.getSnapshot()));
  assert.equal(a.getSnapshot().elapsedMs <= 100 + 1e-6, true);
  a.update(100, {move_x: 99, move_y: -99});
  const p = a.getSnapshot().player;
  assert(p.x < 250 && p.laneY >= C.constants.laneMin);
});

check('ground-plane movement, single jump and sub-step input retention', () => {
  const r = rig(120), start = r.view().player;
  r.game.handleInput(press('jump')); r.step(undefined, 1);
  assert.equal(r.view().player.elevation, 0);
  // update without a sample preserves the queued fresh press across tiny delta.
  r.game.update(8); r.events.push(...r.game.drainEvents());
  assert(r.view().player.elevation > 0);
  r.run(150, {move_y: -1, ...press('jump')});
  assert.equal(r.events.filter(e => e.type === 'jump').length, 1, 'no double jump');
  assert(r.view().player.laneY < start.laneY && r.view().player.elevation > 0);
  r.run(700); assert.equal(r.view().player.elevation, 0); assert(r.view().player.grounded);
  r.run(2000, {move_y: -1}); assert.equal(r.view().player.laneY, 780);
  r.run(2000, {move_y: 1}); assert.equal(r.view().player.laneY, 970);
});

check('ordinary facing strike commits once and held input does not repeat', () => {
  const r = rig(); engage(r);
  const original = r.view().enemies[0].hp;
  r.step(press('strike')); assert.equal(r.view().player.attack.phase, 'windup');
  assert.equal(r.view().enemies[0].hp, original);
  const startX = r.view().player.x;
  r.run(80, {move_x: 1, strike: {held: true}});
  assert(r.view().player.x - startX < 8, 'attack movement has commitment');
  r.run(900, {strike: {held: true}});
  assert.equal(r.events.filter(e => e.type === 'strike').length, 1);
  assert.equal(r.events.filter(e => e.type === 'enemy-hit').length, 1);
  assert.equal(r.view().enemies[0].hp, original - 12);
  assert(!r.events.some(e => /rhythm|beat/.test(e.type)), 'ordinary Strike needs no beat');
});

check('three-step combo queues only during recovery and then resets', () => {
  const r = rig(); engage(r); r.step(press('strike'));
  r.step(press('strike'));
  r.until(s => s.player.attack?.phase === 'recovery');
  assert.equal(r.view().player.queuedStrike, false, 'windup presses do not erase commitment');
  r.step(press('strike'));
  r.until(s => s.player.attack?.step === 2);
  r.until(s => s.player.attack?.phase === 'recovery'); r.step(press('strike'));
  r.until(s => s.player.attack?.step === 3); r.until(s => !s.player.attack);
  assert.deepEqual(r.events.filter(e => e.type === 'strike').map(e => e.step), [1, 2, 3]);
  assert.equal(r.view().enemies[0].hp, 8, 'actual three strikes deal 12+14+20');
  r.run(400); r.step(press('strike')); assert.equal(r.view().player.attack.step, 1);
});

check('lane dodge preserves locked tells and lane-separated strikes miss', () => {
  const r = rig(); const s = engage(r), locked = s.enemies[0].attackLaneY;
  r.run(450, {move_y: -1});
  assert.equal(r.view().enemies[0].attackLaneY, locked);
  assert(r.view().player.laneY < locked - 60);
  r.step(press('strike')); r.run(350);
  assert.equal(r.view().player.hp, 100, 'dodge avoids the telegraphed attack');
  assert.equal(r.view().enemies[0].hp, 54, 'x range alone never hits another lane');
});

check('facing controls both ordinary attack and explicit frontal guard', () => {
  const r = rig(); engage(r); r.step({move_x: -1});
  r.step(press('strike')); r.run(350);
  assert.equal(r.view().enemies[0].hp, 54, 'a backwards punch does not auto-target');
  r.run(1000, {guard: {held: true}});
  assert(r.view().player.hp < 100, 'guard is explicit and directional');
});

check('fresh parry opens one counter; holding guard cannot renew it', () => {
  const r = rig(); engage(r);
  r.until(s => s.enemies[0].phaseMs >= s.enemies[0].tellMs - 80);
  r.step({guard: {held: true}}); r.run(130, {guard: {held: true}});
  assert.equal(r.events.filter(e => e.type === 'parry').length, 1);
  assert.equal(r.view().player.hp, 100); assert(r.view().player.counterMs > 0);
  assert.equal(r.game.getControlState().strike.label, 'Counter');
  r.step(press('strike')); r.run(150);
  assert(r.events.some(e => e.type === 'enemy-hit' && e.cause === 'counter' && e.damage === 22));
  assert.equal(r.view().player.counterMs, 0);
  const held = rig(); engage(held); held.step({guard: {held: true}});
  held.run(1000, {guard: {pressed: true, held: true}});
  assert.equal(held.events.filter(e => e.type === 'parry').length, 0);
  assert(held.events.some(e => e.type === 'block'));
  assert.equal(held.view().player.hp, 100); assert.equal(held.view().player.parryMs, 0);
});

check('contextual nearby throw has commitment, cooldown and one held activation', () => {
  const r = rig(); assert.equal(r.game.getControlState().throw.enabled, false);
  r.step(press('throw')); r.run(100); assert.equal(r.events.filter(e => e.type === 'throw').length, 0);
  near(r); const id = r.game.getControlState().throw.targetId;
  assert.equal(id, 'street-duel'); const hp = r.view().enemies[0].hp;
  r.step(press('throw')); assert.equal(r.view().player.mode, 'throw');
  assert.equal(r.view().enemies[0].hp, hp - 28);
  assert.equal(r.game.getControlState().throw.ready, false);
  r.run(1000, {throw: {held: true}});
  assert.equal(r.events.filter(e => e.type === 'throw').length, 1);
  assert(r.view().enemies[0].x > r.view().player.x + 100, 'throw creates room');
});

check('only active attacks cause damage, with recovery and invulnerability', () => {
  const r = rig(); engage(r);
  r.run(300); assert.equal(r.view().player.hp, 100, 'near contact during tell is harmless');
  r.until(s => s.player.hp < 100); const hp = r.view().player.hp;
  assert(r.view().player.invulnerableMs > 650); assert(r.view().player.hurtMs > 0);
  r.run(300); assert.equal(r.view().player.hp, hp);
  assert.equal(r.view().player.hurtMs, 0, 'control returns before invulnerability ends');
  assert.equal(r.events.filter(e => e.type === 'player-hit').length, 1);
  const tell = r.events.find(e => e.type === 'enemy-tell');
  const active = r.events.find(e => e.type === 'enemy-attack');
  assert(active.atMs - tell.atMs + 1e-6 >= tell.tellMs, 'published tell is never shortened');
});

check('finite duel plus bruiser/enforcer arena unlocks only the local desk', () => {
  const r = rig(); const end = fight(r);
  assert.equal(end.status, 'desk-ready'); assert.equal(end.kills, 3);
  assert.equal(end.arena.index, 2); assert.equal(end.desk.unlocked, true); assert.equal(end.desk.x, 3000);
  assert.equal(r.events.filter(e => e.type === 'enemy-arrive').length, 3);
  assert.equal(r.events.filter(e => e.type === 'desk-unlocked').length, 1);
  assert(!r.events.some(e => /award|save|lore|chapter|completion|drums/i.test(e.type)));
  r.until(s => s.player.x >= 3000, {move_x: 1}); r.run(1000);
  assert.equal(r.events.filter(e => e.type === 'desk-unlocked').length, 1);
  assert(r.view().hitFx.length <= 12); assert.equal(r.view().enemies.length, 3);
  const warnings = new Map();
  for (const e of r.events) {
    if (e.type === 'enemy-tell') warnings.set(e.id, e);
    if (e.type === 'enemy-attack') {
      assert(warnings.has(e.id)); assert(e.atMs - warnings.get(e.id).atMs + 1e-6 >= warnings.get(e.id).tellMs);
    }
  }
});

check('charging enforcer commits to a visible lane and can be evaded', () => {
  const r = rig();
  // Clear the duel through earned ordinary hits, then walk into arena two.
  r.until(s => s.enemies[0].hp === 0, s => {
    const p = s.player, e = s.enemies[0], c = r.game.getControlState();
    return {move_x: Math.abs(e.x - p.x) > 65 ? Math.sign(e.x - p.x) : 0,
      ...(c.strike.ready ? press('strike') : {})};
  });
  r.until(s => s.arena.index === 2, {move_x: 1});
  r.until(s => s.enemies[2].phase === 'windup', s => {
    // Stay on the opposite lane from the bruiser until enforcer chooses its tell.
    const e = s.enemies[2]; return {move_x: Math.abs(e.x - s.player.x) > 250 ? 1 : 0,
      move_y: s.player.laneY < 940 ? 1 : 0};
  });
  const before = r.view(), lane = before.enemies[2].attackLaneY;
  r.run(650, {move_y: lane > 875 ? -1 : 1});
  assert.equal(r.view().enemies[2].attackLaneY, lane);
  const hp = r.view().player.hp;
  r.until(s => s.enemies[2].phase === 'active');
  const firstX = r.view().enemies[2].x;
  r.run(250);
  assert.notEqual(r.view().enemies[2].x, firstX, 'enforcer actually charges');
  assert(!r.events.slice(-20).some(e => e.type === 'player-hit' && e.id === 'street-enforcer'));
  assert(r.view().player.hp >= hp - 12, 'other bruiser damage does not disguise a charge hit');
});

check('defeat is finite, rejects actions and retry resets transient state', () => {
  const r = rig(); engage(r);
  r.until(s => s.status === 'defeated', s => ({move_x: Math.abs(s.enemies[0].x - s.player.x) > 70 ? 1 : 0}), 60000);
  assert.equal(r.view().player.hp, 0); assert.equal(r.game.getControlState().retry.ready, true);
  const x = r.view().player.x, count = r.events.length;
  r.run(1000, {move_x: 1, ...press('strike'), ...press('jump')});
  assert.equal(r.view().player.x, x); assert.equal(r.events.length, count);
  assert.deepEqual(plain(r.game.retry()), plain(C.create().getSnapshot()));
  assert.equal(r.game.drainEvents().length, 0);
});

check('identical 30/60/120 Hz input schedules produce identical combat states', () => {
  const results = [];
  for (const hz of [30, 60, 120]) {
    const r = rig(hz), framesPerGroup = hz / 30;
    // Inputs change only at common 30 Hz boundaries, with edges on one frame.
    for (let i = 0; i < hz * 12; i++) {
      const group = Math.floor(i / framesPerGroup);
      const input = {move_x: group < 51 ? 1 : group >= 195 && group < 216 ? -1 : 0,
        move_y: group >= 66 && group < 81 ? -1 : group >= 150 && group < 165 ? 1 : 0};
      for (const [name, tick] of [['jump', 40], ['strike', 65], ['guard', 110], ['throw', 200]]) {
        if (group === tick) input[name] = {held: true, pressed: i % (hz / 30) === 0};
      }
      r.step(input);
    }
    results.push({snapshot: plain(r.view()), events: r.events});
  }
  assert.deepEqual(results[0], results[1]); assert.deepEqual(results[1], results[2]);
});

check('held-event backlog and effects stay bounded without an external clock', () => {
  const game = C.create();
  for (let n = 0; n < 1000; n++) game.update(100, n % 8 === 0 ? press('jump') : {});
  assert(game.drainEvents().length <= C.constants.maxEvents);
  assert(game.getSnapshot().hitFx.length <= C.constants.maxHitFx);
  const r = rig(); fight(r); r.run(1000);
  assert.equal(r.view().hitFx.length, 0);
});

console.log(`Mac street combat: ${groups} meaningful groups passed (pure simulation; rendering, physical controls and feel remain host checks).`);
