// Exercise production integration and geometry; only host/AI inputs are supplied.
const assert = require('assert');
const { createRig } = require('./check-level-01-boss');
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
  const ids = rig().p.getSolidLedges().filter(s => !s.alwaysPresent).map(s => s.id);
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
    let roof=p.getLiftRoof(); place(r,a,roof.x+roof.w*.72,roof.topY-20);
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
{
  const r=rig(),a=r.w.player,roof=r.p.getLiftRoof();
  place(r,a,roof.x+roof.w/2,roof.topY);a.grounded=true;a.supportedSurfaceId=roof.id;
  assert.equal(a.dropThrough(),false,'a hard elevator roof cannot be dropped through');
  const ledge=r.p.getStageSurfaces().find(s=>s.id==='signal-awning');
  place(r,a,ledge.x+100,ledge.y);a.grounded=true;a.supportedSurfaceId=ledge.id;
  assert(a.dropThrough(),'existing deliberate Down+Jump remains on ordinary ledges');
}
console.log('Solid ledges: all visible undersides, both facings, fast roof side crossings, all six actor types carried up/down at 30/60/120Hz, pause/reset and hard-roof drop protection passed.');

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
