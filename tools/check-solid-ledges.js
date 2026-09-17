// Exercise production integration and geometry; only host/AI inputs are supplied.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
const { createSprite, playerClips } = require('./makko-animation-fixture');
function rig() {
  const r = createRig(), { w, p } = r;
  p.startMission(); p.state = 'jammer_active'; p.closedGateEncounterId = null;
  w.rhythmSystem.hideRhythmMode(); w.enemyManager.enemies = [];
  const a = w.player; a.sprite = createSprite(playerClips); a.spriteReady = true;
  a.playAnimation('jump'); a.allowMovement = true; a.isJumpHeld = () => true;
  return r;
}
function overlaps(box, roof) {
  return box.x + box.width > roof.x + .01 && box.x < roof.x + roof.w - .01 &&
    box.y + box.height > roof.topY + .01 && box.y < roof.y - .01;
}
function actor(r, type) {
  if (type === 'player') return r.w.player;
  if (type === 'boss') { r.w.rhythmSystem.show(); r.reachReady(); r.p.beginBossCombat(); r.w.rhythmSystem.hideRhythmMode(); return r.p.boss; }
  const a = type === 'drone' ? new r.w.RooftopDrone(2500, 100, { x: 2300, w: 500 }) : new r.w.Enemy(2500, 784, type);
  a.entranceComplete = true; a._authoredEntranceActive = false; a.updateAI = () => {};
  r.w.enemyManager.enemies = [a]; return a;
}
function place(r, a, x, foot) {
  const pos = a.position || a; pos.x = x; pos.y = foot - (a.type === 'drone' ? 57 : 72);
  if (a.velocity) { a.velocity.x = 0; a.velocity.y = 0; }
}
for (const fps of [30,60,120]) {
  // The later explicit request makes awnings solid like the elevator. The
  // two circled small steps retain bonks; other steps/roofs stay one-way.
  const ids = ['signal-awning', 'cache-awning', 'firewall-canopy', 'tower-awning', 'broadcast-awning', 'cache-maintenance-step', 'firewall-low-step'];
  assert.deepStrictEqual(Array.from(rig().p.getSolidLedges(), s => s.id).sort(), ids.slice().sort(), 'five awnings plus the two circled step undersides');
  for (const id of ids) for (const facing of [-1,1]) {
    const r = rig(), { w, p } = r, a = w.player, ledge = p.getSolidLedges().find(s => s.id === id);
    a.state = 'jump'; a.facing = facing; a.grounded = false;
    place(r, a, ledge.x + ledge.w/2, 0);
    a.position.y += ledge.bottomY + 24 - a.getCeilingProbe().y;
    a.velocity.y = -920; let touched = false;
    for (let i=0;i<fps*.2;i++) {
      a.update(1000/fps,true);
      touched ||= a.headContactSurfaceId === id;
      if (a.headContactSurfaceId === id) assert(a.getCeilingProbe().y >= ledge.bottomY-.01, id+' cap stays below visible underside');
      assert.equal(a.health,3); assert(!a.controlsDisabled);
    }
    assert(touched, `${fps}Hz ${id} facing ${facing}: real upward motion bonks`);
  }
  for (const surface of rig().p.getStageSurfaces().filter(s => !ids.includes(s.id))) {
    const { w, p } = rig(), a = w.player;
    place({ w, p }, a, surface.x + surface.w / 2, 0);
    a.position.y += surface.y + 80 - a.getCeilingProbe().y;
    a.velocity.y = -920;
    a.ceilingMotion = { head: a.getCeilingProbe(), rising: true, allowed: true };
    a.position.y -= 82;
    const y = a.position.y;
    assert.strictEqual(p.applyPlayerHeadContact(a), false, `${surface.id}: unmarked underside permits ascent`);
    assert.strictEqual(a.position.y, y); assert.strictEqual(a.velocity.y, -920);
    assert(!a.headContactSurfaceId, 'no unmarked bonk cue');
  }
  for (const type of ['player','corrupted','firewall','virus','drone','boss']) for (const side of [-1,1]) {
    const r = rig(), a = actor(r,type), p = r.p, roof = p.getLiftRoof();
    place(r,a,roof.x + roof.w/2,roof.topY+120);
    const width = p.getRoofActorBounds(a).width;
    const pos = a.position || a;
    pos.x = side < 0 ? roof.x-width-80 : roof.x+roof.w+width+80;
    const motion = p.captureRoofActor(a);
    pos.x += -side*(roof.w+width*3+160); // Entire slab crossed in one interval.
    const hit = p.resolveLiftActor(a,motion);
    assert(hit && hit.axis === 'x', `${type}: fast side entry blocked`);
    assert(!overlaps(p.getRoofActorBounds(a),roof));
  }
  for (const type of ['player','corrupted','firewall','virus','drone','boss']) for (const state of ['moving','returning']) {
    const r = rig(), a = actor(r,type), {p,w}=r, lift=p.signalLift;
    lift.y=lift.prevY=600; lift.state=state;
    // The right side clears the newly solid Firewall canopy, even for the
    // widest actor. Awning handoffs are exercised separately below.
    let roof=p.getLiftRoof(); place(r,a,roof.x+roof.w*.9,roof.topY-20);
    const motion=p.captureRoofActor(a); (a.position||a).y+=30;
    assert(p.resolveLiftActor(a,motion)); assert.equal(a.supportedSurfaceId,roof.id);
    for(let i=0;i<fps;i++) {
      if(type==='player') a.update(1000/fps,true);
      else if(type==='boss') p.updateBossCombat(1000/fps);
      else a.update(1000/fps,w.player,i*1000/fps);
      p.updateSignalLift(1000/fps); roof=p.getLiftRoof();
      assert.equal(a.supportedSurfaceId,roof.id,`${fps}Hz ${type} ${state} keeps roof support`);
      assert(Math.abs(p.getRoofActorBounds(a).y+p.getRoofActorBounds(a).height-roof.topY)<.01,`${type}: exact carry once`);
      assert(!overlaps(p.getRoofActorBounds(a),roof));
    }
    const y=(a.position||a).y, liftY=lift.y;
    w.gameState.paused=true;p.updateSignalLift(1000);assert.equal((a.position||a).y,y);assert.equal(lift.y,liftY);
    w.gameState.paused=false;p.resetSignalLift();assert.equal(a.supportedSurfaceId,null);
  }
}
// Deliberate drops bypass the current support, including solid slabs, while
// lower supports and normal underside/side collisions remain in force.
for (const fps of [30,60,120]) {
  const surfaces=rig().p.getActorSurfaces();
  for (const surface of surfaces) {
    const r=rig(), {w,p}=r, a=w.player;
    let live=p.getActorSurfaces().find(s=>s.id===surface.id);
    if(surface.id.startsWith('signal-lift')) {p.signalLift.y=p.signalLift.prevY=700;live=p.getActorSurfaces().find(s=>s.id===surface.id);}
    const x=live.x+live.w/2;
    const top=p.getActorSurfaces().filter(s=>x>s.x&&x<s.x+s.w).sort((a,b)=>a.y-b.y)[0];
    place(r,a,x,top.y);a.grounded=true;a.supportedSurfaceId=top.id;a.isJumpHeld=()=>false;
    let tested=false;
    for(let drop=0;drop<12&&a.supportedSurfaceId;drop++) {
      const from=a.supportedSurfaceId;
      assert(a.dropThrough(),`${fps}Hz deliberate drop starts on ${from}`);
      for(let i=0;i<fps*3&&!a.grounded;i++){a.update(1000/fps,true);p.updateSignalLift(1000/fps);}
      assert.notEqual(a.supportedSurfaceId,from,`${fps}Hz ${from} does not recapture its drop`);
      assert(a.grounded,`${fps}Hz ${from} lands below`);
      if(from===live.id){tested=true;break;}
    }
    assert(tested,`${fps}Hz actual descent reaches and drops through ${live.id}`);
    assert.equal(a.health,3);
  }
}
console.log('Scoped solids: five awnings and two circled step undersides; all other undersides open; both facings; moving roof for six actor types at 30/60/120Hz; pause/reset and deliberate drops through every support passed.');

// Regression: physical support was correct, but the later cabin image erased
// the lower half of roof enemies. Exercise both real render owners after motion.
for (const type of ['virus', 'corrupted', 'firewall', 'drone']) for (const state of ['moving', 'returning']) {
  const r = rig(), { w, p, context } = r, a = actor(r, type);
  load(context, 'src/game/render-coordinator.js');
  p.signalLift.y = p.signalLift.prevY = 600; p.signalLift.state = state;
  let roof = p.getLiftRoof(); place(r, a, roof.x + roof.w * .9, roof.topY);
  a.supportedSurfaceId = roof.id;
  const ground = new w.Enemy(2200, 784, 'corrupted');
  w.enemyManager.enemies.push(ground);
  const order = [], ctx = new Proxy({globalAlpha: 1, getTransform: () => ({a:1,b:0,c:0,d:1,e:0,f:0})},
    {get: (o, k) => o[k] ?? (() => {})});
  a.draw = () => order.push('rider'); ground.draw = () => order.push('ground');
  w.BARCODE.PresentationAssets = {draw: key => { if (key === 'liftCabin') order.push('lift'); return true; }};
  function checkOrder(expected, label) {
    order.length = 0; w.drawGameEntities(ctx);
    assert.deepStrictEqual(order, expected, type + ' ' + state + ': ' + label);
    assert.deepStrictEqual(r.calls.errors, []);
  }
  for (let frame = 0; frame < 60; frame++) {
    a.update(1000 / 60, w.player, frame * 1000 / 60); p.updateSignalLift(1000 / 60);
    checkOrder(['ground', 'lift', 'rider'], 'rider draws once over the moving deck');
  }
  roof = p.getLiftRoof(); a.supportedSurfaceId = null;
  place(r, a, roof.x + roof.w / 2, roof.topY - 40);
  for (const vy of [-500, 500]) {
    a.velocity.y = vy;
    checkOrder(['ground', 'lift', 'rider'], 'airborne approach/departure stays in front');
  }
  place(r, a, roof.x + roof.w / 2, p.signalLift.y);
  checkOrder(['ground', 'lift', 'rider'], 'cabin passenger draws on the floor like the player');
  place(r, a, roof.x + roof.w / 2, p.signalLift.y + 130);
  order.length = 0; w.drawGameEntities(ctx);
  assert(order.indexOf('rider') < order.indexOf('lift'), 'actor below the raised floor stays behind');
  place(r, a, roof.x + roof.w / 2, roof.topY);
  a.active = false; checkOrder(['ground', 'lift'], 'inactive rider is not redrawn');
  a.active = true;
  w.BARCODE.combatFX = {visible: x => x !== a.position.x, drawAmpIcon() {}};
  checkOrder(['ground', 'lift'], 'offscreen rider stays culled');
  delete w.BARCODE.combatFX;
  order.length = 0; w.enemyManager.draw(ctx);
  assert.equal(order.filter(x => x === 'rider').length, 1, 'unsplit manager draw remains complete');
  p.isSignalLiftAvailable = () => false;
  order.length = 0; w.drawGameEntities(ctx);
  assert.equal(order.filter(x => x === 'rider').length, 1, 'no missing or duplicate enemy without a lift');
}
console.log('Elevator roof depth: four enemy types, rising/returning rides, airborne transitions, below-roof depth, one draw per actor, inactive/culling and unavailable-lift cases passed.');

// The full render coordinator places the hero once on the same dynamic side
// of the cabin as enemies: ground walk-on, rising floor/roof, or underneath.
for(const position of ['ground','floor','roof','under','outside']) {
 const r=rig(),{w,p,context}=r;load(context,'src/game/render-coordinator.js');
 const lift=p.signalLift;lift.y=lift.prevY=position==='ground'?856:650;
 const roof=p.getLiftRoof(),x=position==='outside'?lift.x-180:lift.x+lift.w/2;
 const foot=position==='roof'?roof.topY:position==='floor'?lift.y:856;
 place(r,w.player,x,foot);
 const order=[];w.player.draw=()=>order.push('player');
 const drawLift=p.drawSignalLift.bind(p);p.drawSignalLift=(ctx,pass)=>{order.push('pass-'+pass);drawLift(ctx,pass);};
 w.BARCODE.PresentationAssets={draw:key=>{if(key==='liftCabin')order.push('lift');if(key==='liftTrack')order.push('drive');return true;}};
 const ctx=new Proxy({globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:t.length*10})},{get:(o,k)=>o[k]??(()=>{})});
 w.drawGameElements(ctx);assert.equal(order.filter(x=>x==='player').length,1);assert(order.includes('lift'));assert(order.indexOf('drive')<order.indexOf('player'),'the back drive stays behind every actor');
 assert.equal(order.indexOf('player')<order.indexOf('lift'),position==='under',position+' follows the moving floor');
 assert(order.indexOf('player')<order.indexOf('pass-front'),'front rails follow the player');
 assert.equal(order.filter(x=>x==='pass-front').length,1,'one front frame pass');
 assert.equal(order.filter(x=>x==='lift').length,2,'existing cabin is partitioned into back and front');
 assert.deepStrictEqual(r.calls.errors,[]);
}
console.log('Shared player/enemy lift depth: ground walk-on, floor/roof passengers, underpass and outside actor draw once.');

// A descending floor squashes real enemies once, including a carrier; the
// flattened pose persists after EnemyManager removes the defeated actor.
for (const fps of [30,60,120]) for (const type of ['corrupted','firewall','virus','drone']) {
  const r=rig(),{w,p}=r,a=actor(r,type),lift=p.signalLift;
  place(r,a,lift.x+lift.w/2,856); a.health=a.maxHealth;
  lift.y=lift.prevY=550;lift.state='returning';
  const points=w.gameState.score,defeats=w.enemyManager.defeatedCount;
  let drops=0;p.dropCarrierRepair=enemy=>{assert.equal(enemy,a);drops++;};
  for(let i=0;i<fps*2;i++)p.updateSignalLift(1000/fps);
  assert(!a.active,`${fps}Hz ${type} crushed`);
  assert.equal(p.liftSquashes.length,1);assert.equal(p.liftSquashes[0].actor,a);
  assert.equal(w.enemyManager.defeatedCount,defeats+1);assert.equal(drops,1);
  assert.equal(w.gameState.score,points+a.getPointValue());
  assert.equal(w.enemyManager.recordDefeat(a),false,'no duplicate defeat/repair');
  const scales=[],ctx=new Proxy({globalAlpha:1},{get:(o,k)=>o[k]??((...args)=>{if(k==='scale')scales.push(args);}),set:(o,k,v)=>(o[k]=v,true)});
  a.spriteReady=true;a.sprite={};let draws=0;a.drawSprite=()=>draws++;
  w.BARCODE.PresentationAssets={draw:()=>draws++};p.drawLiftSquashes(ctx);
  assert(scales.some(([x,y])=>x>1.8&&y<.09),'visible wide, flat pancake');assert.equal(draws,1);
  const age=p.liftSquashes[0].ageMs;w.gameState.paused=true;p.updateSignalLift(2000);assert.equal(p.liftSquashes[0].ageMs,age);
  w.gameState.paused=false;p.updateSignalLift(3300);assert.equal(p.liftSquashes.length,0,'bounded visual lifetime');
  p.resetSignalLift();assert.equal(p.liftSquashes.length,0);assert.deepEqual(r.calls.errors,[]);
}
for(const scenario of ['stationary','ascending','beside','floor-rider','roof-rider','cinematic','paused']){
  const r=rig(),{p,w}=r,a=actor(r,'corrupted'),lift=p.signalLift;
  lift.y=lift.prevY=700;lift.state=scenario==='ascending'?'moving':scenario==='stationary'?'dormant':'returning';
  place(r,a,scenario==='beside'?lift.x-120:lift.x+lift.w/2,856);
  if(scenario==='floor-rider'){place(r,a,lift.x+lift.w/2,lift.y);a.supportedSurfaceId=lift.id;}
  if(scenario==='roof-rider'){place(r,a,lift.x+lift.w*.75,p.getLiftRoof().topY);a.supportedSurfaceId='signal-lift-roof';}
  if(scenario==='paused')w.gameState.paused=true;
  if(scenario==='cinematic')p.state='camera_pan';
  p.updateSignalLift(1000);assert(a.active,scenario+' must not crush');assert.equal(p.liftSquashes.length,0);
}
{
  const r=rig(),a=actor(r,'corrupted'),{p}=r;place(r,a,p.signalLift.x+140,856);
  p.signalLift.y=p.signalLift.prevY=500;p.signalLift.state='returning';p.updateSignalLift(2000);
  assert(!a.active,'a frame hitch cannot tunnel the falling floor through an enemy');
}
console.log('Elevator squash: four enemy types at 30/60/120Hz, visible compressed sprites, single score/defeat/repair, pause/expiry/reset, hitch sweep, safe riders/sides/rising/stopped/cinematic cases passed.');
