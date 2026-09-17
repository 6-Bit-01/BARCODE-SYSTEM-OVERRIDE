// Full production rides, including the middle/left overlap missed by earlier
// right-edge-only charge checks. AI intent is held still; physics stays live.
const assert = require('assert');
const {createRig} = require('./check-level-01-boss');
const {createSprite, playerClips} = require('./makko-animation-fixture');
function rig() {
  const r=createRig(), {w,p}=r;
  p.startMission();p.state='jammer_active';p.closedGateEncounterId=null;
  w.enemyManager.enemies=[];w.rhythmSystem.hideRhythmMode();
  w.player.sprite=createSprite(playerClips);w.player.spriteReady=true;w.player.playAnimation('idle');
  w.player.isJumpHeld=()=>true;
  return r;
}
function place(r,a,x,foot,id) {
  const pos=a.position||a;pos.x=x;pos.y=foot-(a.type==='drone'?57:72);
  if(a.velocity){a.velocity.x=0;a.velocity.y=0;}
  a.supportedSurfaceId=id;a.grounded=a.isOnGround=true;
}
function tick(r,a,dt) {
  if(a===r.w.player)a.update(dt,true);
  else if(a===r.p.boss)r.p.updateBossCombat(dt);
  else a.update(dt,r.w.player,0);
  r.p.updateSignalLift(dt);
}
let rides=0;
for(const fps of [30,60,120]) for(const type of ['player','corrupted','firewall','virus','drone','boss']) {
  for(const deck of type==='drone'?['roof']:['floor','roof']) for(const fraction of [.2,.5,.8]) {
    const r=rig(),{w,p}=r;let a=w.player;
    if(type==='boss') {
      w.rhythmSystem.show();r.reachReady();p.beginBossCombat();w.rhythmSystem.hideRhythmMode();
      a=p.boss;a.phase='recovery';a.phaseElapsedMs=-100000;
    } else if(type!=='player') {
      a=type==='drone'?new w.RooftopDrone(2500,100,{x:2300,w:500}):new w.Enemy(2500,784,type);
      a.entranceComplete=true;a._authoredEntranceActive=false;a.updateAI=()=>{};
      if(type==='drone')a._hijackIdle=true;
      w.enemyManager.enemies=[a];
    }
    const lift=p.signalLift;
    place(r,w.player,lift.x+lift.w/2,lift.y,lift.id);p.chargeSignalLift();p.chargeSignalLift();
    if(a!==w.player)place(r,w.player,100,856,null);
    const roof=p.getLiftRoof(),surface=deck==='floor'?lift:roof,x=surface.x+surface.w*fraction,id=surface.id;
    place(r,a,x,deck==='floor'?lift.y:roof.topY,id);
    const dt=1000/fps;
    for(let i=0;i<fps*9;i++) {
      tick(r,a,dt);const b=p.getRoofActorBounds(a),y=deck==='floor'?lift.y:p.getLiftRoof().topY;
      const label=`${fps}Hz ${type} ${deck} ${fraction}, frame ${i}`;
      assert.equal(a.supportedSurfaceId,id,label+' keeps support through both stops');
      assert(Math.abs(b.y+b.height-y)<.001,label+' carries exactly once');
      assert(Math.abs((a.position||a).x-x)<.001,label+' has no sideways ejection');
    }
    assert.equal(lift.y,856);assert.equal(lift.charges,0);
    p.resetSignalLift();assert.equal(a.liftTransitSurfaceId,null);rides++;
    assert.deepEqual(r.calls.errors,[]);
  }
}
for(const fps of [30,60,120]) {
  const r=rig(),{w,p}=r,a=w.player,lift=p.signalLift,dt=1000/fps;
  place(r,a,2450,lift.y,lift.id);p.chargeSignalLift();p.chargeSignalLift();
  for(let i=0;i<fps*4;i++)tick(r,a,dt);
  for(let i=0;i<fps*.6;i++){a.moveLeft();tick(r,a,dt);}
  a.stopHorizontal();assert(a.position.x<lift.x);assert.equal(a.supportedSurfaceId,'firewall-roof');
  const foot=a.position.y+72,x=a.position.x;
  for(let i=0;i<fps*5;i++)tick(r,a,dt);
  assert.equal(a.position.y+72,foot,'walking out leaves the player on the rooftop');
  assert.equal(a.position.x,x,'returning cabin does not grab a departed rider');
  assert.equal(a.liftTransitSurfaceId,null);
  // Walk back aboard from the left rooftop while both support planes align.
  lift.y=lift.prevY=59;lift.state='dormant';lift.charges=2;lift.returnTimerMs=1000;
  place(r,a,lift.x-40,59,'firewall-roof');
  for(let i=0;i<fps*.6;i++){a.moveRight();tick(r,a,dt);}
  a.stopHorizontal();assert.equal(a.supportedSurfaceId,lift.id,'roof-to-cabin boarding is explicit at its edge');
  const boardedX=a.position.x;
  for(let i=0;i<fps*2;i++){tick(r,a,dt);assert.equal(a.supportedSurfaceId,lift.id);assert.equal(a.position.x,boardedX);}
  // Jump and land inside a descending cabin while it crosses the canopy.
  lift.y=lift.prevY=550;lift.state='returning';
  place(r,a,2450,lift.y,lift.id);p.getLiftTransitSurface(a);assert(a.jump());
  let airborne=false,landed=false;
  for(let i=0;i<fps;i++){tick(r,a,dt);airborne||=!a.grounded;landed||=airborne&&a.grounded;assert.equal(a.position.x,2450);}
  assert(landed,'a cabin jump returns to its descending deck');assert.equal(a.supportedSurfaceId,lift.id);
  // Trying to exit into the canopy side waits at the cabin edge, instead of
  // resolving a whole facade-width overlap with a sudden sideways shove.
  lift.y=lift.prevY=500;lift.state='returning';place(r,a,lift.x+14,lift.y,lift.id);
  for(let i=0;i<fps*.25;i++){
    const x=a.position.x;a.moveLeft();tick(r,a,dt);
    assert(a.position.x<=x+.001,'blocked exit never ejects to the right');
    assert(a.position.x>=lift.x,'blocked exit stays within the carriage');
    assert.equal(a.supportedSurfaceId,lift.id);
  }
  a.stopHorizontal();
  // Explicit dropping releases the carriage and still lands on a real ledge.
  lift.y=lift.prevY=260;lift.state='dormant';lift.charges=2;lift.returnTimerMs=5000;
  place(r,a,2450,lift.y,lift.id);p.getLiftTransitSurface(a);assert(a.dropThrough());
  for(let i=0;i<fps*2&&!a.grounded;i++)tick(r,a,dt);
  assert.equal(a.supportedSurfaceId,'firewall-canopy');assert.equal(a.liftTransitSurfaceId,null);
}
{
  const {w,p}=rig();
  assert(!p.getStageSurfaces().some(s=>s.id==='firewall-low-step'),'removed platform has no invisible collider');
  assert(!p.getSolidLedges().some(s=>s.id==='firewall-low-step'),'removed underside cannot bonk');
  assert.equal(w.Sector1Progression.PLATFORM_MOUNTS['firewall-high-step'].frame,1,'reclaimed gold deck replaces a repeated upper design');
}
// Keep real AI active for exits. The original ride checks intentionally held
// intent still and therefore could not detect the elevator's ledge guard trap.
function pursuer(r,type,x,foot,support) {
  const a=new r.w.Enemy(x,foot-72,type);
  Object.assign(a,{entranceComplete:true,_authoredEntranceActive:false,
    _sector1MissionEnemy:true,combatPattern:'approach',combatPatternMs:0});
  place(r,a,x,foot,support);r.w.enemyManager.enemies=[a];return a;
}
let exits=0;
for(const fps of [30,60,120]) for(const type of ['firewall','corrupted','virus']) {
  for(const direction of [-1,1]) for(const start of ['inside','outside','returning']) {
    const r=rig(),{w,p}=r,lift=p.signalLift,dt=1000/fps;
    const center=lift.x+lift.w/2;
    if(start==='returning'){lift.y=lift.prevY=600;lift.state='returning';}
    const x=start==='outside' ? (direction>0?lift.x-70:lift.x+lift.w+70) : center;
    const a=pursuer(r,type,x,lift.y,start==='outside'?null:lift.id);
    place(r,w.player,center+direction*900,856,null);
    let boarded=start!=='outside',departed=false,previousX=x;
    for(let i=0;i<fps*8;i++) {
      a.update(dt,w.player,i*dt);p.updateSignalLift(dt);
      boarded ||= a.supportedSurfaceId===lift.id;
      assert(Math.abs(a.position.x-previousX)<24,'active AI never teleports at the cabin edge');
      previousX=a.position.x;
      if(direction>0?a.position.x>lift.x+lift.w+30:a.position.x<lift.x-30){departed=true;break;}
    }
    assert(boarded,`${type} ${start} ${direction} actually boarded`);
    assert(departed,`${fps}Hz ${type} ${start} exits toward player ${direction}`);
    assert.notEqual(a.supportedSurfaceId,lift.id);assert.equal(a.liftTransitSurfaceId,null);
    assert.deepEqual(r.calls.errors,[]);exits++;
  }
  // At the top stop, use the level rooftop on the left; keep the open right
  // edge protected. Walking back aboard must acquire support normally.
  const r=rig(),{w,p}=r,lift=p.signalLift,dt=1000/fps;
  lift.y=lift.prevY=59;lift.state='dormant';lift.charges=2;lift.returnTimerMs=5000;
  const a=pursuer(r,type,lift.x+60,59,lift.id);place(r,w.player,1900,59,null);
  for(let i=0;i<fps*3;i++){
    a.update(dt,w.player,i*dt);p.updateSignalLift(dt);
    assert(Math.abs(a.position.y+72-59)<.001,
      `${fps}Hz ${type} rooftop frame ${i}: foot ${a.position.y+72}, x ${a.position.x}, support ${a.supportedSurfaceId}`);
    if(a.position.x<lift.x-30&&a.supportedSurfaceId==='firewall-roof')break;
  }
  assert(a.position.x<lift.x);assert.equal(a.supportedSurfaceId,'firewall-roof');
  place(r,a,lift.x-55,59,'firewall-roof');place(r,w.player,lift.x+lift.w+900,59,null);
  a.combatPattern='approach';a.combatPatternMs=0;a.hoverState='none';lift.returnTimerMs=5000;
  for(let i=0;i<fps*3;i++){a.update(dt,w.player,i*dt);p.updateSignalLift(dt);}
  assert.equal(a.supportedSurfaceId,lift.id,'active pursuer boards from the level rooftop');
  assert(a.position.x<=lift.x+lift.w-40,'unconnected right edge remains protected');
  assert(Math.abs(a.position.y+72-59)<.001);
}
// Exercise the manager, crowd separation and actual pursuit together.
for(const direction of [-1,1]) {
  const r=rig(),{w,p}=r,lift=p.signalLift,center=lift.x+lift.w/2,dt=1000/60;
  const crowd=['firewall','corrupted'].map((type,i)=>pursuer(r,type,center-35+i*70,856,lift.id));
  w.enemyManager.enemies=crowd;place(r,w.player,center+direction*1000,856,null);
  for(let i=0;i<360;i++){w.enemyManager.update(dt,w.player);p.updateSignalLift(dt);}
  assert(crowd.every(a=>direction>0?a.position.x>lift.x+lift.w:a.position.x<lift.x),
    'the enemy manager does not bunch active pursuers inside the grounded cabin');
  assert.deepEqual(r.calls.errors,[]);
}
// A stationary/recovering player can push an intruder out onto the street;
// contact resolution must not snap it back into the cabin or move the player.
for(const direction of [-1,1]) {
  const r=rig(),{w,p}=r,lift=p.signalLift;
  const x=direction>0?lift.x+lift.w-12:lift.x+12;
  const a=pursuer(r,'firewall',x,856,lift.id);
  place(r,w.player,x-direction*45,856,lift.id);w.player.controlsDisabled=true;
  const px=w.player.position.x;
  w.enemyManager.separatePlayerContact(w.player,a,-direction);
  assert((a.position.x-x)*direction>0,'intruder separates toward the open street');
  assert.equal(w.player.position.x,px,'stationary player is not displaced by a false cabin edge');
  assert(!w.enemyManager.simpleAABBcollision(w.player.getHitbox(),a.getHitbox()));
}
console.log(`Lift riders: ${rides} full rides, ${exits} active-AI exits at 30/60/120Hz, rooftop departure/reboarding, exposed-edge protection and crowd pursuit passed; existing jump/drop/removal coverage passed.`);
