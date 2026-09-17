// Real traversal/player owners: a parked rider must not hold the lift forever.
const assert = require('assert');
const {createRig} = require('./check-level-01-boss');
function setup() {
  const r=createRig(), {w,p}=r;
  p.startMission(); p.state='jammer_active'; p.closedGateEncounterId=null;
  w.enemyManager.enemies=[]; w.rhythmSystem.hideRhythmMode();
  const lift=p.signalLift, player=w.player;
  // Right side of the cabin remains clear of the fixed rooftop at the stop.
  Object.assign(player.position,{x:2630,y:lift.y-72});
  player.grounded=true; player.supportedSurfaceId=lift.id;
  return r;
}
for (const fps of [30,60,120]) for (const occupied of [false,true]) {
  const {w,p}=setup(), lift=p.signalLift, dt=1000/fps;
  assert(p.chargeSignalLift().ok); assert.equal(lift.charges,1);
  p.updateSignalLift(dt); assert.equal(lift.y,856,'one beat does not launch');
  assert(p.chargeSignalLift().ok);
  if(!occupied) { w.player.position.x=100; w.player.supportedSurfaceId=null; }
  for(let frame=0;frame<fps*5-1;frame++) {
    if(occupied) w.player.update(dt,true);
    p.updateSignalLift(dt);
    assert.notEqual(lift.state,'returning','no descent before five seconds');
  }
  assert.equal(lift.y,59,'existing ascent reaches the same rooftop');
  if(occupied) assert.equal(w.player.supportedSurfaceId,lift.id);
  p.updateSignalLift(dt); assert.equal(lift.state,'returning','return starts at five seconds even with a rider');
  p.updateSignalLift(dt); assert(lift.y>59,'descent actually moves');
  if(occupied) assert(Math.abs(w.player.position.y+72-lift.y)<.001,'descending floor carries its rider');
}
{
  const {w,p}=setup(), lift=p.signalLift;
  p.chargeSignalLift(); p.chargeSignalLift(); p.updateSignalLift(4900);
  // The production landing solver hands this side of the cabin to the roof.
  Object.assign(w.player.position,{x:2450,y:59-72});
  w.player.supportedSurfaceId='firewall-roof'; w.player.grounded=true;
  assert(p.chargeSignalLift().ok,'a rider can recharge at the shared rooftop seam');
  p.updateSignalLift(4999); assert.notEqual(lift.state,'returning');
  w.gameState.paused=true; p.updateSignalLift(10000);
  assert.equal(lift.returnTimerMs,1,'pause consumes no charge');
  w.gameState.paused=false; p.updateSignalLift(1); assert.equal(lift.state,'returning');
  // One fresh charge can restore power during return; initial startup is two.
  Object.assign(w.player.position,{x:2630,y:lift.y-72});w.player.supportedSurfaceId=lift.id;
  p.updateSignalLift(100);const y=lift.y;
  assert(p.chargeSignalLift().ok);p.updateSignalLift(50);assert(lift.y<y);
  const remaining=lift.returnTimerMs;w.player.position.x=100;
  assert.equal(p.chargeSignalLift().ok,false);assert.equal(lift.returnTimerMs,remaining,'a remote beat cannot renew lift power');
  p.resetSignalLift();assert.equal(p.signalLift.y,856);assert.equal(p.signalLift.charges,0);
}
{
  const {p}=setup();p.chargeSignalLift();p.updateSignalLift(5000);
  assert.equal(p.signalLift.charges,0,'an unused first charge also expires');
  assert.equal(p.signalLift.state,'dormant');
  p.chargeSignalLift();p.chargeSignalLift();p.updateSignalLift(5250);
  assert.equal(p.signalLift.y,114,'a long frame moves down only after the five-second deadline');
}
console.log('Lift charge timeout: occupied/empty 30/60/120Hz rides, five-second expiry, roof-seam renewal, return reversal, pause/reset, remote rejection and long-frame deadline passed.');
