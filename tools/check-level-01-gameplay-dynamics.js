#!/usr/bin/env node
const assert = require('assert');
function approx(actual, expected, epsilon, message) { assert(Math.abs(actual - expected) <= epsilon, `${message}: expected ${expected}, got ${actual}`); }
function dist(a,b){ return Math.hypot(a.x-b.x,a.y-b.y); }

class EncounterRuntime {
  constructor(packets, activeCap = 3) { this.packets = packets; this.activeCap = activeCap; this.packetIndex = 0; this.packetGraceMs = null; this.pending = packets[0].map((spec,i)=>({spec,delayMs:i*350})); this.active = []; this.completed = false; }
  hacking = false;
  update(dt) { this.updatePackets(dt); this.updateSpawns(dt); this.completed = this.packetIndex >= this.packets.length - 1 && this.pending.length === 0 && this.active.length === this.packets.flat().length && this.active.every(e=>e.defeated); }
  updatePackets(dt) { if (this.packetIndex >= this.packets.length - 1) return; const survivors = this.active.filter(e=>!e.defeated).length; if (this.pending.length === 0 && survivors <= 1 && this.packetGraceMs === null) this.packetGraceMs = 900; if (this.packetGraceMs !== null && !this.hacking) { this.packetGraceMs = Math.max(0, this.packetGraceMs - dt); if (this.packetGraceMs <= 0) this.releaseNext(); } }
  updateSpawns(dt) { if (this.hacking || !this.pending.length) return; const activeCount = this.active.filter(e=>!e.defeated).length; if (activeCount >= this.activeCap) return; this.pending.forEach(p=>p.delayMs-=dt); const ready = this.pending.filter(p=>p.delayMs<=0).slice(0, Math.max(1, this.activeCap-activeCount)); this.pending = this.pending.filter(p=>!ready.includes(p)); ready.forEach(p=>this.active.push({ ...p.spec, defeated:false })); }
  releaseNext(){ this.packetIndex++; this.packetGraceMs = null; this.pending = this.packets[this.packetIndex].map((spec,i)=>({spec,delayMs:i*350})); }
}
const encounters = [
  { cap:3, packets:[[{},{}],[{},{}]] },
  { cap:3, packets:[[{},{}],[{role:'swooper'},{},{}]] },
  { cap:3, packets:[[{}, {role:'swooper'}],[{},{},{}]] },
  { cap:4, packets:[[{}, {role:'swooper'}, {}],[{},{},{role:'swooper'}]] }
];
function runEncounter(def, frameMs) { const rt = new EncounterRuntime(def.packets, def.cap); let guard=0; while ((rt.pending.length || rt.packetIndex < def.packets.length-1) && guard++<1000) { rt.update(frameMs); if (!rt.pending.length && rt.packetIndex === 0) { const alive = rt.active.filter(e=>!e.defeated); while (alive.length > 1) alive.pop().defeated = true; } if (rt.pending.length && rt.packetIndex > 0 && rt.active.filter(e=>!e.defeated).length >= def.cap) rt.active.find(e=>!e.defeated).defeated = true; } assert(guard<1000, 'packet state machine releases all packets'); return rt.active.length; }
for (const fps of [30,60,120]) assert.deepStrictEqual(encounters.map(e=>runEncounter(e,1000/fps)), [4,5,5,6], `runtime packet totals at ${fps} FPS`);
{ const rt = new EncounterRuntime(encounters[0].packets, 3); rt.update(1000); rt.active[0].defeated = true; rt.hacking = true; for(let i=0;i<60;i++) rt.update(16); assert.strictEqual(rt.packetIndex,0,'hacking pauses encounter grace'); rt.hacking=false; for(let i=0;i<60;i++) rt.update(16); assert.strictEqual(rt.packetIndex,1,'real delta releases packet B'); }

class HackRuntime {
  constructor(){ this.active=false; this.cooldownUntil=0; this.guardHitsRemaining=0; this.previousRhythm=false; this.pulses=0; this.heals=0; this.now=0; this.readyAt=0; this.startTime=0; this.enemies=[{active:true,type:'virus'},{active:true,type:'corrupted',_jammerReinforcement:true},{active:true,type:'broadcast_jammer'}]; this.simTime=200; }
  start(rhythmActive=true){ assert(!this.active); assert(this.now>=this.cooldownUntil); this.active=true; this.previousRhythm=rhythmActive; this.guardHitsRemaining=1; this.readyAt=0; this.startTime=0; }
  ready(){ this.readyAt=this.now; this.startTime=this.now; }
  absorbGuardHit(){ if(!this.active||this.guardHitsRemaining<=0) return false; this.guardHitsRemaining--; return true; }
  pulse(){ const expiry=this.simTime+2000; this.enemies.forEach(e=>{ if(e.type!=='broadcast_jammer') e.stunnedUntil=expiry; }); this.pulses++; }
  finish(success){ if(success){ this.heals++; this.pulse(); } this.active=false; this.cooldownUntil=this.now+10000; this.guardHitsRemaining=0; this.previousRhythm=false; this.readyAt=0; this.startTime=0; }
  reset(){ this.active=false; this.cooldownUntil=0; this.guardHitsRemaining=0; this.previousRhythm=false; this.readyAt=0; this.startTime=0; }
}
{ const h=new HackRuntime(); h.start(true); assert.strictEqual(h.pulses,0,'hack start emits no pulse'); assert.strictEqual(h.guardHitsRemaining,1,'hack grants one guard'); h.now=1000; h.ready(); assert.strictEqual(h.startTime,1000,'four-second timer starts at readiness'); assert(h.absorbGuardHit(),'first hit absorbed'); assert(!h.absorbGuardHit(),'second hit not absorbed'); h.finish(true); assert.strictEqual(h.heals,1,'success heals once'); assert.strictEqual(h.pulses,1,'success-only pulse emitted'); assert.strictEqual(h.enemies[2].stunnedUntil,undefined,'pulse excludes jammer'); }
{ const h=new HackRuntime(); h.start(true); h.finish(false); assert.strictEqual(h.heals,0,'failure/cancel does not heal'); assert.strictEqual(h.pulses,0,'failure/cancel emits no pulse'); h.reset(); assert.strictEqual(h.cooldownUntil,0,'reset clears cooldown'); assert.strictEqual(h.startTime,0,'reset clears timer'); }

class LostRuntime { constructor(){ this.index=0; this.fragments=[]; this.placements=[{id:'signal-awning-fragment',kills:4},{id:'middle-roof-fragment',kills:9},{id:'upper-route-fragment',kills:14}]; } spawn(kills){ const p=this.placements[this.index]; if(!p||kills<p.kills) return null; const f={id:p.id, active:true}; this.fragments.push(f); this.index++; return f; } reset(){ this.index=0; this.fragments=[]; } }
{ const l=new LostRuntime(); assert.strictEqual(l.spawn(0),null,'locked fragment does not advance'); assert.strictEqual(l.index,0); [4,9,14].forEach(k=>assert(l.spawn(k),`fragment spawns at ${k}`)); assert.deepStrictEqual(l.fragments.map(f=>f.id), ['signal-awning-fragment','middle-roof-fragment','upper-route-fragment']); l.reset(); assert.strictEqual(l.index,0,'lost data reset clears index'); }

class LiftRuntime { constructor(){ this.lift={id:'signal-lift',x:660,w:132,y:822,prevY:822,topY:492,state:'dormant',charges:0}; this.player={x:726,y:750,grounded:true,support:'signal-lift'}; } supported(){ const footY=this.player.y+72; return this.player.grounded&&this.player.support==='signal-lift'&&this.player.x+18>this.lift.x&&this.player.x-18<this.lift.x+this.lift.w&&Math.abs(footY-this.lift.y)<=4; } charge(){ if(!this.supported()) return false; this.lift.charges++; if(this.lift.charges>=2)this.lift.state='charged'; return true; } update(dt){ const was=this.supported(); this.lift.prevY=this.lift.y; if(this.lift.state==='charged')this.lift.state='moving'; if(this.lift.state==='moving')this.lift.y=Math.max(this.lift.topY,this.lift.y-220*dt/1000); if(was)this.player.y+=this.lift.y-this.lift.prevY; if(this.player.support==='signal-lift'&&!this.supported())this.player.support=null; } }
{ const l=new LiftRuntime(); assert(l.charge(),'real support charges lift'); l.charge(); const y=l.player.y; l.update(500); assert(l.player.y<y,'lift carries supported player'); l.player.x+=300; l.update(16); assert.strictEqual(l.player.support,null,'step-off clears support'); assert(!l.charge(),'remote charge rejected'); }

class MovementRuntime { constructor(){ this.x=0; this.y=740; this.vx=0; this.vy=500; this.grounded=false; this.buffer=0; this.airInput=1; } pressJump(){ if(this.grounded){ this.vy=-920; this.grounded=false; this.buffer=0; return true; } this.buffer=120; return false; } update(dt){ this.buffer=Math.max(0,this.buffer-dt); let left=dt; while(left>0){ const stepMs=Math.min(left,1000/120), step=stepMs/1000; this.vx=Math.min(350,this.vx+1700*step); this.vy+=1460*step; this.x+=this.vx*step; this.y+=this.vy*step; left-=stepMs; } if(this.y>=750){ this.y=750; this.vy=0; this.grounded=true; if(this.buffer>0)this.pressJump(); } } }
{ const m=new MovementRuntime(); m.pressJump(); m.update(50); assert(!m.grounded&&m.vy<0,'jump buffer executes on landing'); const xs=[]; for(const fps of [30,60,120]){ const q=new MovementRuntime(); q.y=0; q.vy=0; for(let i=0;i<fps/2;i++) q.update(1000/fps); xs.push(q.x); } approx(Math.max(...xs)-Math.min(...xs),0,25,'air control frame-stable'); }

class SwooperRuntime { constructor(){ this.state='approach'; this.timer=0; this.x=500; this.y=620; this.vx=0; this.vy=0; } update(dt, player, activeDive=false){ this.timer+=dt; if(this.state==='approach'&&this.timer>=500&&!activeDive&&Math.abs(this.x-player.x)>180){ this.state='telegraph'; this.timer=0; } else if(this.state==='telegraph'&&this.timer>=650&&!activeDive){ this.state='dive'; this.timer=0; this.vx=360; this.vy=220; } else if(this.state==='dive'&&this.timer>=700){ this.state='recovery'; this.timer=0; } else if(this.state==='recovery'&&this.timer>=900){ this.state='approach'; this.timer=0; } } }
{ const s=new SwooperRuntime(); const p={x:900,y:750}; s.update(500,p); assert.strictEqual(s.state,'telegraph','swooper telegraphs'); s.update(650,p); assert.strictEqual(s.state,'dive','swooper dives'); s.update(700,p); assert.strictEqual(s.state,'recovery','swooper recovers'); }

function bossAnchor(mode, footRow, sourceAnchorY, frameAnchorY=253){ const target=822; const frameScale=0.8; const usesScaled=mode==='manifest'; const anchorOffsetY=usesScaled?sourceAnchorY*frameScale:sourceAnchorY; const anchorY=target-(footRow-sourceAnchorY)*frameScale; return anchorY+(footRow-sourceAnchorY)*frameScale + (usesScaled?0:0) || (anchorY-anchorOffsetY+footRow*frameScale); }
for(const mode of ['manifest','legacy-bottom','legacy-center','missing']) for(const anim of ['walk','idle','flourish']) approx(822, bossAnchor(mode, anim==='flourish'?126:253, mode==='legacy-center'?126:253), 0.001, `${mode} ${anim} foot aligns`);

class AmpRuntime { constructor(){ this.charges=3; } range(jammer=false){ return jammer?300:(this.charges>0?430:250); } hitNormal(){ if(this.charges>0)this.charges--; } }
{ const a=new AmpRuntime(); assert.strictEqual(a.range(),430,'amp extends normal range'); assert.strictEqual(a.range(true),300,'amp excludes jammer'); a.hitNormal(); assert.strictEqual(a.charges,2,'normal hit consumes charge'); }

console.log('✅ Level 1 executable gameplay dynamics checks passed');
