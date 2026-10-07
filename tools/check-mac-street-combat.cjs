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
// A tactical player uses the public inputs and actual telegraphs. No state edits,
// skips, health patches, fixture checkpoints or forced enemy defeat are used.
function combatInput(r,s){
  const controls=r.game.getControlState(),p=s.player,foe=nextEnemy(s),input={};
  if(!foe){input.move_x=1;return input;}
  const dx=foe.x-p.x,direction=Math.sign(dx)||p.facing;
  input.move_x=Math.abs(dx)>58||p.facing!==direction?direction:0;
  input.move_y=Math.abs(foe.laneY-p.laneY)>8?Math.sign(foe.laneY-p.laneY):0;
  const incoming=s.projectiles.find(item=>(item.x-p.x)*item.facing<0&&
    Math.abs(item.x-p.x)<145&&Math.abs(item.laneY-p.laneY)<=item.laneReach+10);
  const warning=s.enemies.filter(e=>e.hp>0&&e.phase==='windup'&&
    Math.abs(e.attackLaneY-p.laneY)<45&&Math.abs(e.x-p.x)<330)
    .sort((x,y)=>(x.tellMs-x.phaseMs)-(y.tellMs-y.phaseMs))[0];
  const remaining=warning?warning.tellMs-warning.phaseMs:Infinity;
  const expectedType={psion_lancer:'lunge',bile_spitter:'bile',rift_stalker:'rift-cross',shock_mantid:'ground-wave'}[foe.kind];
  const observe=r.observeFirstPatterns&&expectedType&&!r.events.some(e=>e.type==='enemy-attack'&&e.attackType===expectedType);
  if(observe)input.move_x=Math.abs(dx)>C.roles[foe.kind].distance-5||p.facing!==direction?direction:0;
  // Optional sturdy cars no longer wreck from incidental crowd contacts to
  // supply a free Barrier. Respect the Regent's real armored commitments.
  if(foe.kind==='null_regent'&&foe.phase==='active') {
    if(foe.attackSpec.guardable!==false)return {...input,move_x:0,guard:{held:true}};
    if(controls.jump.ready)return {...input,move_x:0,...press('jump')};
    return {...input,move_x:0,move_y:p.laneY>875?-1:1};
  }
  if(foe.kind==='null_regent'&&s.projectiles.some(item=>item.owner!=='player'&&Math.abs(item.x-p.x)<430&&Math.abs(item.laneY-p.laneY)<55)) {
    if(incoming&&controls.jump.ready)return {...input,...press('jump')};
    return {...input,move_x:0,guard:{held:true}};
  }
  if(incoming&&controls.jump.ready){input.jump={pressed:true,held:true};return input;}
  if(warning&&remaining<(warning.kind==='null_regent'?650:310)&&(warning.kind==='null_regent'||!p.attack&&!p.throwMs)){
    if(warning.attackTell.guardable===false&&remaining<250&&controls.jump.ready)
      input.jump={pressed:true,held:true};
    else if(warning.attackTell.guardable!==false&&remaining<105)input.guard={held:true};
    else if(warning.attackTell.guardable===false&&p.elevation===0)input.move_y=p.laneY>875?-1:1;
    input.move_x=0;return input;
  }
  if(observe)return input;// Earn each base commitment before attacking this role.
  if(controls.throw.ready&&controls.throw.targetType==='enemy'&&!r.lastThrow)input.throw={pressed:true,held:true};
  else if(controls.strike.ready&&!r.lastStrike&&Math.abs(dx)<=100&&Math.abs(foe.laneY-p.laneY)<=35) {
    // Run+Strike now deliberately commits a lunge. This ordinary-combat route
    // braces once to end incidental tap running, then uses its existing strike.
    if(p.running)input.guard={held:true};
    else input.strike={pressed:true,held:true};
  }
  r.lastThrow=!!input.throw;r.lastStrike=!!input.strike;
  return input;
}
function fight(r,limitMs=480000,predicate=s=>s.desk.unlocked||s.status==='defeated'){
  r.until(predicate,s=>combatInput(r,s),limitMs);return r.view();
}
check('isolated factory, defensive snapshots and bounded supplied delta', () => {
  const a = C.create(), b = C.create(), before = a.getSnapshot();
  assert.equal(before.player.x, 200); assert.equal(before.player.laneY, 880);
  assert.equal(before.enemies.length, 2); assert.equal(before.desk.unlocked, false);
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
  assert.equal(r.view().enemies[0].hp, 0, 'actual three strikes defeat the 42 HP scuttler');
  r.run(400); r.step(press('strike')); assert.equal(r.view().player.attack.step, 1);
});

check('moving Strike commits a directional step attack rather than sliding a jab',()=>{
  const r=rig();engage(r);const start=r.view().player.x,hp=r.view().enemies[0].hp;
  r.step({move_x:1,...press('strike')});
  const first=r.view().player.attack;assert.equal(first.kind,'step-strike');
  assert.equal(first.facing,1);assert.equal(first.timing.windupMs,110);
  r.run(130,{move_x:-1,strike:{held:true}});
  const p=r.view().player;
  assert(p.x>start+25,'committed forward root motion is actual world movement');
  assert.equal(p.facing,1,'opposite input cannot twist a committed attack');
  assert.equal(p.attack.kind,'step-strike');assert(p.attack.rootShift>25);
  assert.equal(r.view().enemies[0].hp,hp-15);
  assert(r.events.some(e=>e.type==='enemy-hit'&&e.cause==='step-strike'));
  assert(p.attack.phaseProgress>=0&&p.attack.phaseProgress<=1);
  r.run(700,{strike:{held:true}});assert.equal(r.events.filter(e=>e.type==='strike').length,1);
});

check('running Strike commits a bounded grounded kick with launch instead of a step punch',()=>{
  const r=rig();engage(r);r.step({move_x:1,run:{held:true}});
  assert(r.view().player.running);assert.equal(r.game.getControlState().strike.label,'Run Kick');
  const hp=r.view().enemies[0].hp,start=r.view().player.x;
  r.step({move_x:1,run:{held:true},...press('strike')});
  const attack=r.view().player.attack;assert.equal(attack.kind,'running-kick');assert(attack.running&&!attack.airborne);
  assert.equal(r.view().player.animation.action,'running-kick');
  assert.equal(r.game.getControlState().strike.label,'Run Kick','committed kick keeps its label through recovery');
  assert.deepEqual(plain(attack.timing),{windupMs:85,activeMs:145,recoveryMs:245});
  r.run(150,{move_x:-1,strike:{held:true}});const contact=r.view();
  assert(contact.player.x>start+60&&contact.player.elevation===0);assert.equal(contact.player.facing,1);
  assert.equal(contact.enemies[0].hp,hp-24);assert(contact.enemies[0].launched);
  assert(r.events.some(e=>e.type==='launch'&&e.cause==='running-kick'));
  assert(r.events.some(e=>e.type==='running-kick'));
  r.until(s=>s.player.attack?.phase==='recovery',{strike:{held:true}});
  assert(r.view().player.attack.rootShift<=125+1e-6);assert(r.view().player.attack.rootShift>100);
  assert(!r.game.getControlState().strike.ready,'committed run kick cannot buffer a jab chain');
  r.run(700,{strike:{held:true}});assert.equal(r.events.filter(e=>e.type==='strike').length,1);assert.equal(r.view().player.comboNext,1);
});

check('Jump plus Strike performs a real aerial kick above the ground-punch limit',()=>{
  const r=rig();engage(r);const hp=r.view().enemies[0].hp;
  r.step(press('jump'));r.run(80);
  assert.equal(r.game.getControlState().strike.label,'Air Kick');
  r.step(press('strike'));assert.equal(r.view().player.attack.kind,'air-kick');
  r.run(100);
  assert(r.view().player.elevation>C.constants.hitHeight,'the kick lands while actually airborne');
  assert.equal(r.view().enemies[0].hp,hp-18);
  assert(r.events.some(e=>e.type==='enemy-hit'&&e.cause==='air-kick'));
  assert.equal(r.view().player.attack.airborne,true);
  r.run(800,{strike:{held:true}});
  assert.equal(r.events.filter(e=>e.type==='strike').length,1);assert.equal(r.view().player.comboNext,1);
  const together=rig();together.step({move_x:1,run:{held:true},...press('jump'),...press('strike')});
  assert.equal(together.view().player.attack.kind,'air-kick','simultaneous inputs use the same accessible attack');
});

check('lane dodge preserves locked tells and lane-separated strikes miss', () => {
  const r = rig(); const s = engage(r), locked = s.enemies[0].attackLaneY;
  r.run(450, {move_y: -1});
  assert.equal(r.view().enemies[0].attackLaneY, locked);
  assert(r.view().player.laneY < locked - 60);
  r.step(press('strike')); r.run(350);
  assert.equal(r.view().player.hp, 100, 'dodge avoids the telegraphed attack');
  assert.equal(r.view().enemies[0].hp, 42, 'x range alone never hits another lane');
});

check('facing controls both ordinary attack and explicit frontal guard', () => {
  const r = rig(); engage(r); r.step({move_x: -1});
  r.step(press('strike')); r.run(350);
  assert.equal(r.view().enemies[0].hp, 42, 'a backwards punch does not auto-target');
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
  r.step({move_x:1,run:{held:true},...press('strike')});assert.equal(r.view().player.attack.kind,'counter');r.run(150);
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
  assert.equal(id, 'service-alley-w1-0-chitin_scuttler'); const hp = r.view().enemies[0].hp;
  r.step(press('throw')); assert.equal(r.view().player.mode, 'grab-hold');
  assert.equal(r.view().enemies[0].hp,hp,'grab is visibly committed before it deals damage');
  assert.equal(r.view().player.grapple.phase,'hold');assert.equal(r.view().enemies[0].phase,'grappled');
  assert(Math.abs(r.view().enemies[0].animation.motion.vx)>0,'grab reports its actual pulling motion');
  const committedX=r.view().player.x;
  r.run(100,{move_x:-1,throw:{held:true}});
  assert(r.view().player.x<committedX&&r.view().player.x>committedX-20,'holding walks slowly and retains committed facing');
  assert.equal(r.view().player.facing,1);assert.equal(r.view().enemies[0].hp,hp,'holding itself does not deal damage');
  r.step();assert(r.view().player.grapple.released);assert.equal(r.view().player.mode,'throw');
  const releasedX=r.view().player.x;r.run(100,{move_x:-1});assert.equal(r.view().player.x,releasedX,'actual throw release has immobile commitment');
  assert.equal(r.view().enemies[0].hp,hp,'damage waits140ms after release');
  r.until(()=>r.events.some(e=>e.type==='throw-release'),{},100);
  assert.equal(r.view().enemies[0].hp, hp - 28);
  assert(r.events.some(e=>e.type==='throw-release'&&e.damage===28));
  assert.equal(r.game.getControlState().throw.ready, false);
  r.run(1000);
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


check('six physical city areas and six wholly new mechanical alien archetypes',()=>{
  assert.equal(C.zones.length,6);assert.equal(C.constants.worldWidth,20400);
  assert.equal(new Set(C.zones.map(z=>z.id)).size,6);
  const kinds=Object.keys(C.roles),normal=kinds.filter(k=>!C.roles[k].boss);
  assert.equal(normal.length,6);assert.equal(kinds.filter(k=>C.roles[k].boss).length,1);
  assert(!kinds.some(k=>/bruiser|enforcer|corrupted|firewall/i.test(k)));
  assert.equal(new Set(normal.map(k=>C.roles[k].attackType)).size,6);
  assert(normal.some(k=>C.roles[k].bloodColor==='green')&&normal.some(k=>C.roles[k].bloodColor==='purple'));
  assert.equal(C.roles.null_regent.bloodColor,'purple');
  const signatures=new Set();
  for(const [index,z]of C.zones.entries()){
    assert.equal(z.startX,index*3400);assert.equal(z.endX,(index+1)*3400);
    assert(z.waves.length>=2&&z.arrival&&z.exit);
    const signature=z.waves.map(w=>w.join(',')).join('|');
    assert(!signatures.has(signature));signatures.add(signature);
    assert.notDeepEqual(plain(z.waves[0]),plain(z.waves[1]));
    for(const w of z.waves){assert(w.length<=C.constants.maxEnemies);for(const kind of w)assert(C.roles[kind]);}
  }
  assert.equal(C.zones.flatMap(z=>z.waves.flat()).length,30);
});

const route=rig();
check('first wave is earned; room bounds cannot be bypassed by simply walking',()=>{
  route.run(18000,{move_x:1,move_y:-1,guard:{held:true}});
  assert.equal(route.view().zone.index,1);assert.equal(route.view().wave.index,1);
  assert.equal(route.view().kills,0);assert.equal(route.view().desk.unlocked,false);
  assert(route.view().player.x<=route.view().arena.gateX);
  route.game.retry();route.events.length=0;route.lastThrow=false;route.lastStrike=false;
});

check('two waves clear first area, then walking its exit earns the next area',()=>{
  fight(route,100000,s=>s.zone.state==='zone-clear'||s.status==='defeated');
  assert.notEqual(route.view().status,'defeated');
  assert.equal(route.view().kills,5);assert.equal(route.view().city.completedWaves,2);
  assert.equal(route.view().zone.index,1);assert.equal(route.view().zone.walkToExit,true);
  const x=route.view().player.x;route.run(2000);
  assert.equal(route.view().zone.index,1);assert.equal(route.view().player.x,x,'clear does not teleport');
  route.until(s=>s.zone.index===2,{move_x:1},20000);
  assert.equal(route.view().player.x>=C.zones[1].entryX,true);
  assert.equal(route.view().wave.index,1);
});

check('checkpoint retry restores the current earned wave rather than wiping the city',()=>{
  const checkpoint=route.view().checkpoint,zone=route.view().zone.index;
  route.until(s=>s.status==='defeated',s=>{
    const foe=nextEnemy(s);return foe?{move_x:Math.abs(foe.x-s.player.x)>65?Math.sign(foe.x-s.player.x):0,
      move_y:Math.abs(foe.laneY-s.player.laneY)>5?Math.sign(foe.laneY-s.player.laneY):0}:{move_x:1};
  },90000);
  assert.equal(route.view().player.hp,0);assert(route.game.getControlState().retry.ready);
  const frozen=route.view().player.x;
  route.run(1000,{move_x:1,...press('strike'),...press('jump')});assert.equal(route.view().player.x,frozen);
  const restored=route.game.retry();
  assert.equal(restored.player.hp,100);assert.equal(restored.zone.index,zone);
  assert.equal(restored.kills,checkpoint.kills);assert.equal(restored.city.completedWaves,checkpoint.completedWaves);
  assert.deepEqual(restored.city.clearedZones,checkpoint.clearedZones);
  assert.equal(restored.player.x,checkpoint.x);assert.equal(restored.player.elevation,0);
  assert.equal(restored.projectiles.length,0);assert.equal(restored.hitFx.length,0);
  assert(restored.enemies.every(e=>e.hp===e.maxHp));assert.equal(route.game.drainEvents().length,0);
  route.lastThrow=false;route.lastStrike=false;
});

check('full earned six-area route clears 12 waves and one three-phase boss',()=>{
  route.observeFirstPatterns=true;
  fight(route);
  assert.equal(route.view().status,'desk-ready','tactical ordinary controls can finish the complete route');
  const s=route.view();assert.equal(s.kills,30);assert.equal(s.city.completedWaves,12);
  assert.equal(s.zone.index,6);assert.equal(s.arena.index,6);assert.equal(s.city.clearedZones.length,6);
  assert.equal(s.city.complete,true);assert(s.boss.defeated);assert.equal(s.boss.phase,3);
  assert.equal(s.desk.x,20100);assert.equal(s.desk.entrance,'review-studio');
  const phases=route.events.filter(e=>e.type==='boss-phase').map(e=>e.phase);
  assert.deepEqual(phases,[2,3]);
  assert(!route.events.some(e=>/award|save|lore|completion|drums/i.test(e.type)));
  assert.equal(route.events.filter(e=>e.type==='desk-unlocked').length,1);
  route.until(s=>s.player.x>=20100,{move_x:1},20000);route.run(1000);
  assert.equal(route.events.filter(e=>e.type==='desk-unlocked').length,1);
});

check('every actual enemy tell is locked and fulfilled before damage; distinct attacks occur',()=>{
  const warnings=new Map(),types=new Set();
  for(const e of route.events){
    if(e.type==='enemy-tell'){warnings.set(e.id,e);assert(e.tellMs>=480);}
    if(e.type==='enemy-attack'){
      const tell=warnings.get(e.id);assert(tell,e.id);
      assert(e.atMs-tell.atMs+1e-6>=tell.tellMs,'AI never shortens the published warning');
      assert.equal(e.attackType,tell.attackType);types.add(e.attackType);
    }
  }
  assert(types.has('bile')&&types.has('ground-wave')&&types.has('rift-cross')&&types.has('lunge'));
  assert(route.events.some(e=>e.type==='enemy-projectile'));
  assert(route.events.some(e=>e.type==='shield-broken'));
  assert(route.events.some(e=>e.type==='enemy-hit'&&e.bloodColor==='green'));
  assert(route.events.some(e=>e.type==='enemy-hit'&&e.bloodColor==='purple'));
});

check('boss phases perform different locked attacks and a real jump evades its ground wave',()=>{
  const r=rig();
  fight(r,480000,s=>!!s.boss||s.status==='defeated');
  assert.notEqual(r.view().status,'defeated');assert.equal(r.view().kills,29);
  assert.equal(r.view().boss.phase,1);assert.equal(r.view().desk.unlocked,false);
  function observe(required){
    const start=r.events.length,seen=new Set();
    r.until(s=>{
      for(const event of r.events.slice(start))
        if(event.type==='enemy-attack'&&event.kind==='null_regent')seen.add(event.attackType);
      return required.every(type=>seen.has(type))||s.status==='defeated';
    },s=>{
      const p=s.player,e=s.enemies[0],controls=r.game.getControlState();
      const dx=e.x-p.x,direction=Math.sign(dx)||p.facing;
      const input={move_x:Math.abs(dx)>70||p.facing!==direction?direction:0,
        move_y:Math.abs(e.laneY-p.laneY)>6?Math.sign(e.laneY-p.laneY):0};
      if(e.phase==='windup'){
        const remaining=e.tellMs-e.phaseMs;
        input.move_x=0;input.move_y=0;
        if(e.attackTell.guardable===false&&remaining<250&&controls.jump.ready)
          input.jump={pressed:true,held:true};
        else if(e.attackTell.guardable!==false&&remaining<105)input.guard={held:true};
      }else if(e.phase==='active'&&e.attackSpec.guardable!==false)input.guard={held:true};
      // The projectile remains guarded during its flight, after its owner's animation.
      if(s.projectiles.some(item=>item.guardable&&(item.x-p.x)*item.facing<0&&Math.abs(item.laneY-p.laneY)<35))
        input.guard={held:true};
      return input;
    },25000);
    assert.notEqual(r.view().status,'defeated');
    assert(required.every(type=>seen.has(type)));
  }
  observe(['cleave']);
  fight(r,30000,s=>s.boss.phase===2||s.status==='defeated');
  assert.equal(r.view().boss.phase,2);observe(['charge','fan','cleave']);
  fight(r,30000,s=>s.boss.phase===3||s.status==='defeated');
  assert.equal(r.view().boss.phase,3);observe(['ground-wave','fan','charge','cleave']);
  // Finish the actual outgoing pulse so this is collision evidence, not just a jump edge.
  r.run(1200);
  assert(r.events.some(e=>e.type==='projectile-evaded'&&e.kind==='null_regent'&&
    e.attackType==='ground-wave'&&e.elevation>C.constants.hitHeight));
  const tells=new Map();
  for(const event of r.events){
    if(event.type==='enemy-tell'&&event.kind==='null_regent')tells.set(event.id,event);
    if(event.type==='enemy-attack'&&event.kind==='null_regent'){
      const tell=tells.get(event.id);assert(event.atMs-tell.atMs+1e-6>=tell.tellMs);
      assert.equal(tell.attackType,event.attackType);
      if(event.attackType==='ground-wave')assert.equal(tell.guardable,false);
    }
  }
});

check('animation, hit feedback, boss tell and bounded effects are renderable snapshots',()=>{
  const r=rig();engage(r);
  let s=r.view(),e=s.enemies[0];
  assert.equal(e.animation.action,'tell');assert.equal(e.animation.frame,3);
  assert.equal(e.animation.facing,e.facing);assert.equal(e.attackTell.type,'jab');
  assert.equal(e.attackTell.laneY,e.attackLaneY);assert.equal(e.attackTell.guardable,true);
  r.step(press('strike'));r.run(110);s=r.view();e=s.enemies[0];
  assert(e.hitFeedback&&e.hitFeedback.damage===12&&e.hitFeedback.bloodColor==='green');
  assert.equal(e.animation.action,'hurt');assert.equal(e.animation.frame,6);
  const copy=s.enemies[0];copy.animation.ageMs=99999;copy.bloodColor='red';
  assert.notEqual(r.view().enemies[0].animation.ageMs,99999);
  assert.equal(r.view().enemies[0].bloodColor,'green');
  const beforeMotion=r.view().player.animation.motion.stridePhase;r.run(60,{move_y:1});
  assert.notEqual(r.view().player.animation.motion.stridePhase,beforeMotion,'stride is driven by actual travel');
  const particles=r.view().hitFx.find(fx=>fx.bloodColor==='green');assert(particles);
  const particleX=particles.particles[0].x;particles.particles[0].x=999999;
  assert.equal(r.view().hitFx.find(fx=>fx.id===particles.id).particles[0].x,particleX,'blood snapshots cannot mutate combat');
  for(const sample of [r.view(),route.view()]){
    assert(sample.enemies.length<=C.constants.maxEnemies);
    assert(sample.projectiles.length<=C.constants.maxProjectiles);
    assert(sample.hitFx.length<=C.constants.maxHitFx);
    for(const enemy of sample.enemies){assert(Number.isFinite(enemy.ageMs));assert(Number.isFinite(enemy.animation.frame));}
  }
});

check('all six aliens execute two different physical tactics through public play',()=>{
  const r=rig(),evidence={};
  const order=['chitin_scuttler','psion_lancer','prism_guard','bile_spitter','rift_stalker','shock_mantid'];
  for(const kind of order){
    fight(r,480000,s=>s.enemies.some(e=>e.kind===kind&&e.hp>0&&e.phase!=='dormant')||s.status==='defeated');
    assert.notEqual(r.view().status,'defeated');
    const required=Array.from(C.tactics[kind]),start=r.events.length,samples=[];
    r.until(s=>{
      const e=s.enemies.find(item=>item.kind===kind&&item.hp>0);
      if(e)samples.push({phase:e.phase,age:e.phaseMs,type:e.attackSpec?.attackType,x:e.x,
        origin:e.attackOriginX,facing:e.attackFacing,elevation:e.elevation,spec:e.attackSpec,
        projectiles:s.projectiles.filter(item=>item.ownerId===e.id).map(item=>({kind:item.kind,laneY:item.laneY}))});
      const performed=new Set(r.events.slice(start).filter(event=>event.type==='enemy-attack'&&event.kind===kind).map(event=>event.attackType));
      return s.status==='defeated'||required.every(type=>performed.has(type))&&e?.phase==='recovery'&&e.phaseMs>420;
    },s=>{
      const p=s.player,e=s.enemies.find(item=>item.kind===kind&&item.hp>0);
      if(!e)return {};
      const dx=e.x-p.x,direction=Math.sign(dx)||p.facing;
      const input={move_x:Math.abs(dx)>105||p.facing!==direction?direction:0,
        move_y:Math.abs(e.laneY-p.laneY)>6?Math.sign(e.laneY-p.laneY):0};
      if(['windup','active'].includes(e.phase)){
        input.move_x=0;// Observe the commitment from its earned spacing, without chasing into its muzzle.
        const reach=e.attackSpec.laneReach??C.constants.laneReach;
        input.move_y=Math.abs(p.laneY-e.attackLaneY)<=reach+32
          ?Math.abs(C.constants.laneMin-e.attackLaneY)>Math.abs(C.constants.laneMax-e.attackLaneY)?-1:1:0;
      }
      const incoming=s.projectiles.some(item=>(item.x-p.x)*item.facing<0&&Math.abs(item.x-p.x)<145&&Math.abs(item.laneY-p.laneY)<=item.laneReach+10);
      if(incoming&&r.game.getControlState().jump.ready)input.jump={pressed:true,held:true};
      return input;
    },24000);
    assert.notEqual(r.view().status,'defeated',kind+' observation uses actual lane dodges');
    const events=r.events.slice(start).filter(e=>e.kind===kind);
    for(const type of required)assert(events.some(e=>e.type==='enemy-attack'&&e.attackType===type),kind+' actually attacks with '+type);
    evidence[kind]={samples,events};
  }
  const sc=evidence.chitin_scuttler.samples;
  assert(sc.some(s=>s.type==='rush-jab'&&s.phase==='windup'&&(s.x-s.origin)*s.facing< -8),'scuttler physically feints backward');
  assert(sc.some(s=>s.type==='rush-jab'&&s.phase==='active'&&(s.x-s.origin)*s.facing>35),'rush advances through world space');
  const lancer=evidence.psion_lancer.samples;
  assert(lancer.some(s=>s.type==='lunge'&&s.phase==='active'&&Math.abs(s.x-s.origin)>60));
  assert(lancer.some(s=>s.type==='lancer-sweep'&&s.phase==='active'&&s.spec.laneReach>=65&&s.spec.reach>=145));
  const spitter=evidence.bile_spitter.samples;
  assert(spitter.some(s=>s.type==='bile'&&s.projectiles.filter(p=>p.kind==='bile').length===1));
  assert(spitter.some(s=>s.type==='bile-spread'&&new Set(s.projectiles.filter(p=>p.kind==='bile-spread').map(p=>p.laneY)).size===3),'spread creates three actual lane bolts');
  assert(spitter.some(s=>s.phase==='recovery'&&(s.x-s.origin)*s.facing< -12),'spitter physically recoils');
  const guard=evidence.prism_guard.samples;
  assert(guard.some(s=>s.type==='shield-bash'&&s.phase==='active'&&Math.abs(s.x-s.origin)>8));
  assert(guard.some(s=>s.type==='shield-heavy'&&s.phase==='active'&&!s.spec.guardable&&s.spec.damage>14));
  const stalker=evidence.rift_stalker.samples;
  assert(stalker.some(s=>s.type==='rift-cross'&&s.phase==='active'&&Math.abs(s.x-s.origin)>60));
  assert(stalker.some(s=>s.type==='retreat-slash'&&s.phase==='active'&&(s.x-s.origin)*s.facing< -20));
  assert(stalker.some(s=>s.type==='retreat-slash'&&s.phase==='active'&&(s.x-s.origin)*s.facing>35),'backstep returns with a committed slash');
  const mantid=evidence.shock_mantid.samples;
  assert(mantid.some(s=>s.type==='ground-wave'&&s.projectiles.some(p=>p.kind==='ground-wave')));
  assert(mantid.some(s=>s.type==='mantid-leap'&&s.phase==='active'&&s.elevation>70&&Math.abs(s.x-s.origin)>45));
  assert(mantid.some(s=>s.type==='mantid-leap'&&s.spec.canJump===false&&s.spec.guardable),'air-reaching leap honestly tells guard/lane dodge');
});

check('actual alien damage emits colored moving blood; Mac damage emits red blood only',()=>{
  const r=rig();engage(r);assert.equal(r.view().hitFx.length,0,'approach/contact never invents blood');
  r.step(press('strike'));r.run(110);
  const green=r.view().hitFx.find(fx=>fx.bloodColor==='green');assert(green);
  assert.equal(green.bloodHex,'#78ea68');assert.equal(green.particles.length,8);
  const before=green.particles[0];r.run(80);
  const moved=r.view().hitFx.find(fx=>fx.id===green.id).particles[0];
  assert(moved.x!==before.x&&moved.elevation!==before.elevation,'blood follows real deterministic ballistic motion');
  r.until(s=>s.player.hp<100,{},12000);
  const red=r.view().hitFx.find(fx=>fx.bloodColor==='red');assert(red);assert.equal(red.particles.length,8);
  assert.equal(red.bloodHex,'#f04455');assert.equal(r.view().player.hitFeedback.bloodColor,'red');
  assert(r.events.some(e=>e.type==='player-hit'&&e.bloodColor==='red'));
  const purpleRig=rig();
  fight(purpleRig,20000,s=>s.hitFx.some(fx=>fx.bloodColor==='purple')||s.status==='defeated');
  assert.notEqual(purpleRig.view().status,'defeated');
  const purple=purpleRig.view().hitFx.find(fx=>fx.bloodColor==='purple');assert(purple);
  assert.equal(purple.bloodHex,'#b374ed');assert.equal(purple.particles.length,8);
  const guarded=rig();engage(guarded);guarded.run(1000,{guard:{held:true}});
  assert.equal(guarded.view().player.hp,100);
  assert(!guarded.events.some(e=>e.type==='player-hit'));
  assert(!guarded.view().hitFx.some(fx=>fx.bloodColor==='red'),'blocks and parries do not pretend to bleed');
  for(const fx of r.view().hitFx)for(const particle of fx.particles){
    assert(Number.isFinite(particle.x)&&Number.isFinite(particle.laneY)&&particle.elevation>=0);
  }
});

check('actual stride direction and stationary age survive stops, hurt and defensive reads',()=>{
  const r=rig(120),motion=()=>r.view().player.animation.motion;
  const fresh=motion();assert.equal(fresh.wasMoving,false);assert.equal(fresh.strideRatio,0);
  assert.equal(fresh.settleAgeMs,0);
  assert.deepEqual(plain(fresh.feet),{front:{x:25,y:0},rear:{x:-23,y:0}});
  assert(r.view().enemies.every(e=>!e.animation.motion.wasMoving));
  r.run(100);assert.equal(motion().settleAgeMs,0,'never-moving actors have no invented stop');
  r.run(100,{move_x:1});assert.equal(motion().strideRatio,1);assert(motion().wasMoving);
  r.run(50,{move_x:-1,guard:{held:true}});
  assert.equal(r.view().player.facing,-1,'guard retains the existing facing-follow-input behavior');
  assert.equal(motion().strideRatio,1,'reduced guard mobility records its actual local direction');
  r.run(50,{move_x:-1});assert.equal(r.view().player.facing,-1);
  assert.equal(motion().strideRatio,1,'normal reversal follows the new local forward axis');
  r.run(50,{move_x:1,move_y:1});
  const diagonal=motion(),expected=diagonal.vx*r.view().player.facing/Math.hypot(diagonal.vx,diagonal.laneVelocity*.75);
  assert(Math.abs(diagonal.strideRatio-expected)<1e-12&&diagonal.strideRatio<1);
  const phase=diagonal.stridePhase,ratio=diagonal.strideRatio;
  r.step();assert.equal(motion().settleAgeMs,0,'first actual stationary tick is the stop origin');
  r.run(100);assert(Math.abs(motion().settleAgeMs-100)<1e-8);
  assert.equal(motion().stridePhase,phase);assert.equal(motion().strideRatio,ratio);
  const snapshot=r.view();snapshot.player.animation.motion.strideRatio=999;
  snapshot.player.animation.motion.settleAgeMs=-999;snapshot.player.animation.motion.wasMoving=false;
  const frontX=motion().feet.front.x;snapshot.player.animation.motion.feet.front.x=999;
  assert.equal(motion().feet.front.x,frontX,'rendered foot targets are defensive snapshots');
  assert.equal(motion().strideRatio,ratio);assert(motion().wasMoving);assert(motion().settleAgeMs>=100-1e-8);
  r.run(50,{move_y:-1});assert.equal(motion().strideRatio,0,'lane-only stepping is real travel with zero horizontal ratio');
  assert.equal(motion().settleAgeMs,0);assert(motion().wasMoving);
  const lanePhase=motion().stridePhase;r.step();r.step();
  assert.equal(motion().stridePhase,lanePhase);assert(Math.abs(motion().settleAgeMs-r.dt)<1e-8);

  const hurt=rig(120);engage(hurt);
  assert(hurt.view().enemies.some(e=>e.animation.motion.wasMoving),'approaching aliens report actual movement');
  hurt.until(s=>s.player.hp<100,{},12000);
  hurt.until(s=>Math.abs(s.player.animation.motion.vx)>.01,{},100);
  let hm=hurt.view().player.animation.motion;
  assert(hm.wasMoving&&hm.strideRatio<0,'actual knockback records a backward local stride');
  assert.equal(hm.settleAgeMs,0);
  hurt.until(s=>s.player.animation.motion.speed<=.01,{},500);
  hm=hurt.view().player.animation.motion;assert.equal(hm.settleAgeMs,0);
  hurt.run(50);assert(Math.abs(hurt.view().player.animation.motion.settleAgeMs-50)<1e-8);
  const reset=hurt.game.retry();
  assert.equal(reset.player.animation.motion.wasMoving,false);assert.equal(reset.player.animation.motion.strideRatio,0);
  assert.equal(reset.player.animation.motion.settleAgeMs,0);
  assert.deepEqual(plain(reset.player.animation.motion.feet),{front:{x:25,y:0},rear:{x:-23,y:0}});
  assert(reset.enemies.every(e=>!e.animation.motion.wasMoving&&e.animation.motion.settleAgeMs===0));
});

check('resume and real reversal capture the previous fixed motion sample at multiple phases',()=>{
  for(const duration of [50,100,175,225])for(const direction of [{move_x:1},{move_y:1},{move_x:1,move_y:-1}]){
    const r=rig(120),read=()=>r.view().player.animation.motion;
    const initial=read();assert.equal(initial.moveAgeMs,0);assert.equal(initial.fromMoving,false);
    assert.equal(initial.fromStopAgeMs,240,'never-moved source is the neutral pose');
    r.game.handleInput(direction);assert.deepEqual(plain(read()),plain(initial),'input setters do not invent a motion transition');
    r.game.update(r.dt);r.events.push(...r.game.drainEvents());
    assert.equal(read().moveAgeMs,0);assert.equal(read().fromMoving,false);assert.equal(read().fromStopAgeMs,240);
    assert.deepEqual(plain(read().feet),plain(initial.feet),'start begins at the actual standing targets');
    r.run(duration,direction);assert(read().moveAgeMs>0);
    const forward=read(),back=Object.fromEntries(Object.entries(direction).map(([key,value])=>[key,-value]));
    r.step(back);let changed=read();
    assert.equal(changed.moveAgeMs,0);assert.equal(changed.fromMoving,true);
    assert.equal(changed.fromStridePhase,forward.stridePhase);assert.equal(changed.fromStrideRatio,forward.strideRatio);
    assert.deepEqual(plain(changed.feet),plain(forward.feet),'reversal begins at current blended targets');
    r.step(back);assert(Math.abs(read().moveAgeMs-r.dt)<1e-8);
    const lastMove=read();r.step();assert.equal(read().settleAgeMs,0);
    assert.deepEqual(plain(read().feet),plain(lastMove.feet),'first stop retains exact targets even within a start blend');
    r.run(50);const stopped=read();assert.equal(stopped.stridePhase,lastMove.stridePhase);
    r.step(direction);changed=read();
    assert.equal(changed.moveAgeMs,0);assert.equal(changed.fromMoving,false);
    assert.equal(changed.fromStopAgeMs,stopped.settleAgeMs);
    assert.equal(changed.fromStridePhase,stopped.stridePhase);assert.equal(changed.fromStrideRatio,stopped.strideRatio);
    assert.deepEqual(plain(changed.feet),plain(stopped.feet),'interrupted settle resumes from its current two vectors');
    const copy=r.view();copy.player.animation.motion.fromStridePhase=999;copy.player.animation.motion.fromStopAgeMs=-999;
    assert.equal(read().fromStridePhase,stopped.stridePhase);assert.equal(read().fromStopAgeMs,stopped.settleAgeMs);
    r.step();r.run(275);const settled=read();r.step(direction);
    assert.equal(read().moveAgeMs,0);assert.equal(read().fromMoving,false);
    assert.equal(read().fromStopAgeMs,settled.settleAgeMs);assert(read().fromStopAgeMs>240);
    assert.deepEqual(plain(read().feet),plain(settled.feet),'fully settled resume retains standing targets');
    const reset=r.game.retry().player.animation.motion;
    assert.equal(reset.moveAgeMs,0);assert.equal(reset.fromMoving,false);assert.equal(reset.fromStopAgeMs,240);
    assert.equal(reset.fromStridePhase,0);assert.equal(reset.fromStrideRatio,0);
    assert.deepEqual(plain(reset.feet),{front:{x:25,y:0},rear:{x:-23,y:0}});
    for(const side of ['front','rear'])assert(Number.isFinite(changed.feet[side].x)&&Number.isFinite(changed.feet[side].y));
  }
  const interrupted=rig(120);
  for(let n=0;n<180;n++){
    const before=interrupted.view().player.animation.motion;
    interrupted.step(n%6<3?{move_x:n%12<6?1:-1,move_y:n%12<6?1:-1}:{});
    const now=interrupted.view().player.animation.motion;
    if(now.moveAgeMs===0&&now.speed>.01||now.settleAgeMs===0&&now.speed<=.01)
      assert.deepEqual(plain(now.feet),plain(before.feet),'arbitrary repeated interrupts preserve the immediate previous targets');
    assert.deepEqual(Object.keys(now.feet).sort(),['front','rear']);
    for(const p of Object.values(now.feet))assert(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Math.abs(p.x)<=33.01&&p.y<=1e-7&&p.y>=-13.01,'repeated interrupts never accumulate foot lift');
  }
});

check('identical 30/60/120 Hz input schedules produce identical city combat states',()=>{
  const results=[];
  for(const hz of [30,60,120]){
    const r=rig(hz),framesPerGroup=hz/30;
    for(let i=0;i<hz*12;i++){
      const group=Math.floor(i/framesPerGroup);
      const input={move_x:group<51?1:group>=195&&group<216?-1:0,
        move_y:group>=66&&group<81?-1:group>=150&&group<165?1:0};
      for(const [name,tick]of [['jump',40],['strike',65],['guard',110],['throw',200]])
        if(group===tick)input[name]={held:true,pressed:i%(hz/30)===0};
      r.step(input);
    }
    results.push({snapshot:plain(r.view()),events:r.events});
  }
  assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);
});

check('held-event backlog and effects stay bounded without an external clock or save owner',()=>{
  const game=C.create();
  for(let n=0;n<1000;n++)game.update(100,n%8===0?press('jump'):{});
  assert(game.drainEvents().length<=C.constants.maxEvents);
  assert(game.getSnapshot().hitFx.length<=C.constants.maxHitFx);
  route.run(1000);assert.equal(route.view().hitFx.length,0);
  const fresh=C.create().getSnapshot();assert.equal(fresh.kills,0);assert.equal(fresh.zone.index,1);
});
console.log('Mac city combat: '+groups+' meaningful groups passed (pure simulation; rendering, physical controls and feel remain host checks).');
