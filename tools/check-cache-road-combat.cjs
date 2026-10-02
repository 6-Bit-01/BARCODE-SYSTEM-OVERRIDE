#!/usr/bin/env node
// The production owner is driven by physical time/positions and skill calls.
// No fixture writes enemy health, attacks, abilities or defeat into live state.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context={window:{BARCODE:{}}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/game/cache-road-combat.js'),'utf8'),context);
const C=context.window.BARCODE.CacheRoadCombat;
const plain=value=>JSON.parse(JSON.stringify(value));
function fixture({difficultyId='standard',speed=52,syncCount=0}={}) {
  const state=C.create({difficultyId,seed:27469});
  const input={progress:0,lanePos:2,speed,bar:0,syncCount,boosting:false,invulnerableMs:0};
  const events=[];let time=0;
  return {state,input,events,
    view:()=>C.pose(state,input),
    act(kind){const result=C.act(state,kind,input);events.push(...result.events);return result;},
    step(dt=50){time+=dt;input.progress+=input.speed*dt/1000;input.bar=Math.min(100,time/1875);
      const next=C.step(state,dt,input);events.push(...next);return next;},
    get time(){return time;}};
}
function until(r,predicate,label,limit=4000) {
  for(let i=0;i<limit;i++){if(predicate(r.view()))return;r.step();}
  assert.fail(`Timed out: ${label}`);
}
function steer(r,lane,dt=50) {
  const change=Math.min(Math.abs(lane-r.input.lanePos),dt/1000*2.8);
  r.input.lanePos+=Math.sign(lane-r.input.lanePos)*change;
}
function adjacent(lane){return lane>=1.5?Math.max(0,lane-1):Math.min(3,lane+1);}
function drive(r,{combat=true,guard=true}={}) {
  const view=r.view(),live=view.actors.filter(actor=>actor.phase!=='flee');
  const target=live.find(actor=>actor.boss)||live.sort((a,b)=>Math.abs(a.distance)-Math.abs(b.distance))[0];
  let wanted=target?adjacent(target.lane):1.5;
  const threat=live.find(actor=>(actor.warning||actor.locked)&&actor.distance<180)||
    view.projectiles.find(shot=>!shot.friendly&&shot.distance<180);
  if(threat)wanted=adjacent(threat.lockLane??threat.lane);
  steer(r,wanted);
  if(combat&&view.skills.attack.ready&&r.view().target)r.act('attack');
  if(combat&&guard&&threat&&Math.abs(r.input.lanePos-(threat.lockLane??threat.lane))<.6&&
      threat.distance<50&&view.skills.defend.ready)r.act('defend');
  r.step();
}

assert.equal(C.create().version,4);
for(const name of ['attack','defend','turbo','disrupt'])assert(C.pose(C.create()).skills[name].ready);
assert.equal(C.act(C.create(),'face-a').accepted,false,'face pieces are not combat skills');
assert.equal(C.act(C.create(),'attack').reason,'no-target');

let races=0,defeatedEscorts=0;
for(const difficultyId of ['relaxed','standard','overclocked'])for(const speed of [30,52,70]) {
  const r=fixture({difficultyId,speed});
  const warnings=new Map();
  let checkedDefeatSave=false;
  while(r.input.bar<100) {
    const count=r.events.length;
    drive(r);
    assert(r.state.enemies.length<=3&&r.state.projectiles.length<=6&&r.state.wrecks.length<=6);
    assert(r.state.ledger.length<=C.limits.ledger);
    assert.equal(new Set(r.state.ledger.map(item=>item.id)).size,r.state.ledger.length);
    for(const event of r.events.slice(count)) {
      if(['enemy-arrive','boss-arrive'].includes(event.type))
        assert(Math.abs(event.at-r.input.progress-230)<1e-6,'every spawn appears on the visible road with a full approach');
      if(event.type==='warning')warnings.set(event.id,{time:r.time,duration:event.warningMs});
      if(event.type==='lock') {
        const warning=warnings.get(event.id);assert(warning);
        assert(r.time-warning.time>=warning.duration,'commit never shortens the actual published tell');
      }
    }
    assert(Math.abs(r.state.stats.damageDealt-r.state.ledger.reduce((sum,item)=>sum+item.damage,0))<1e-5);
    if(r.state.defeated) {
      assert(r.state.enemies.every(enemy=>enemy.phase==='flee'));
      assert(!r.state.projectiles.some(shot=>!shot.friendly),'defeated rig cannot leave an undefendable runway attack');
      if(!checkedDefeatSave) {
        const runway=C.restore(C.snapshot(r.state),{progress:r.input.progress,bar:Math.floor(r.input.bar)});
        assert(runway);assert(runway.enemies.every(enemy=>enemy.phase==='flee'),
          'reloading the actual defeat marker must not re-arm surviving escorts');
        defeatedEscorts+=runway.enemies.length;
        const runwayInput={...r.input};const runwayEvents=[];
        for(let frame=0;frame<70;frame++) {
          runwayInput.progress+=runwayInput.speed*.05;
          runwayEvents.push(...C.step(runway,50,runwayInput));
        }
        assert(!runwayEvents.some(event=>['warning','lock','hit','enemy-shot'].includes(event.type)));
        checkedDefeatSave=true;
      }
    }
  }
  assert(r.state.defeated,`Zero-sync combat must beat ${difficultyId}/${speed}; ${JSON.stringify(r.view().boss)}`);
  assert.equal(r.view().boss.hp,0);assert.equal(r.view().boss.health,0);
  assert(r.events.some(event=>event.type==='enemy-hit'&&['strike','guard','shot'].includes(event.cause)));
  assert.equal(r.events.filter(event=>event.type==='boss-system-broken').length,3);
  assert.equal(r.events.filter(event=>event.type==='boss-defeated').length,1);
  assert(r.events.some(event=>event.type==='takedown'&&event.kind==='bike'&&event.rider));
  for(const kind of ['bike','rammer','escort','disruptor'])
    assert(r.events.some(event=>event.type==='enemy-arrive'&&event.kind===kind),`authored ${kind} escalation is actually used`);
  const save=plain(C.snapshot(r.state));
  const restored=C.restore(save,{progress:r.input.progress,bar:100});assert(restored);
  assert.equal(restored.boss.defeated,true);assert.deepEqual(plain(restored.ledger),save.ledger);
  races++;
}
assert(defeatedEscorts>0,'the real defeat reload probe includes actual surviving opponents');

// Driving around the same threats without combat never self-damages a boss.
const passive=fixture();
while(passive.input.bar<100)drive(passive,{combat:false});
assert.equal(passive.state.defeated,false);assert.equal(passive.view().boss.hp,12);
assert.equal(passive.state.stats.damageDealt,0);
assert(passive.events.some(event=>event.type==='evaded'));
assert(!passive.events.some(event=>event.type==='enemy-hit'||event.type==='boss-system-broken'));

// A contact is one physical commitment, not damage on every overlapping frame.
function contactFixture() {
  const r=fixture({speed:30});
  until(r,view=>view.actors.some(actor=>actor.kind==='bike'&&actor.locked&&actor.distance<38),
    'first visible committed bike');
  return r;
}
const unguarded=contactFixture();let hitEvents=[];
for(let frame=0;frame<22;frame++)hitEvents.push(...unguarded.step());
assert.equal(hitEvents.filter(event=>event.type==='hit').length,1);
assert(hitEvents.find(event=>event.type==='hit').combat);
assert.equal(unguarded.state.stats.damageDealt,0,'accepted player damage does not damage its attacker');

const guarded=contactFixture(),beforeGuard=guarded.state.stats.damageDealt;
assert(guarded.act('defend').accepted);
assert.equal(guarded.state.stats.damageDealt,beforeGuard,'guard activation alone has no attack');
const guardEvents=[];for(let frame=0;frame<22;frame++)guardEvents.push(...guarded.step());
assert.equal(guardEvents.filter(event=>event.type==='hit').length,0);
assert(guardEvents.some(event=>event.type==='enemy-hit'&&event.cause==='guard'));
assert.equal(guarded.state.stats.blocks,1);assert.equal(guarded.state.defendMs,0);
assert.equal(guarded.act('defend').reason,'recharging');

const pendingTurbo=contactFixture();assert(pendingTurbo.act('turbo').accepted);
assert.equal(pendingTurbo.state.boosting,false);
const pendingEvents=[];for(let frame=0;frame<22;frame++)pendingEvents.push(...pendingTurbo.step());
assert(pendingEvents.some(event=>event.type==='hit'),'next-ONE Turbo request has no immediate immunity');
assert.equal(pendingTurbo.state.stats.damageDealt,0,'queued Turbo has no immediate contact attack');
const physicalTurbo=contactFixture();assert(physicalTurbo.act('turbo').accepted);
physicalTurbo.input.boosting=true;const turboEvents=[];
for(let frame=0;frame<22;frame++)turboEvents.push(...physicalTurbo.step());
assert(!turboEvents.some(event=>event.type==='hit'));
assert(turboEvents.some(event=>event.type==='enemy-hit'&&event.cause==='turbo'));

const disrupt=contactFixture(),damageBefore=disrupt.state.stats.damageDealt;
assert(disrupt.act('disrupt').accepted);
assert.equal(disrupt.state.stats.damageDealt,damageBefore,'disruption creates an opening, not free damage');
assert(disrupt.view().actors.some(actor=>actor.vulnerable));
assert.equal(disrupt.act('disrupt').reason,'recharging');

// Real weapon charges deplete/recharge; melee remains usable with an empty gun.
const weapon=fixture();until(weapon,view=>view.actors.length,'visible first opponent');
const enemy=weapon.view().actors[0];weapon.input.lanePos=enemy.lane;
assert.equal(weapon.view().target.attackMode,'shot');
assert(weapon.act('attack').accepted);assert.equal(weapon.state.ammo,1);
assert.equal(weapon.act('attack').reason,'recharging');
until(weapon,()=>!weapon.state.projectiles.some(p=>p.friendly),'first shot resolves');
until(weapon,view=>view.skills.attack.ready,'attack recharge');
assert(weapon.act('attack').accepted);assert.equal(weapon.state.ammo,0);
until(weapon,()=>weapon.state.ammo===1,'independent weapon recharge');
assert(weapon.events.some(event=>event.type==='enemy-hit'&&event.cause==='shot'));

// Full synchronization strengthens real combat and lowers the published footprint.
const zero=contactFixture(),full=contactFixture();full.input.syncCount=4;
for(const r of [zero,full]) {
  steer(r,adjacent(r.view().actors[0].lane),400);
  until(r,view=>view.target?.attackMode==='strike','physical adjacent strike range');
}
const zeroDamage=zero.act('attack').events.find(event=>event.type==='enemy-hit').damage;
const fullDamage=full.act('attack').events.find(event=>event.type==='enemy-hit').damage;
assert(fullDamage>zeroDamage);assert(full.view().footprint<zero.view().footprint);

// Genuine mid-boss damage survives a whole-bar checkpoint without transplanting
// health into a fresh run or restoring a half-finished projectile/attack.
const mid=fixture();
while(!(mid.view().boss?.hp>0&&mid.view().boss.hp<12)&&mid.input.bar<96)drive(mid);
assert(mid.view().boss?.hp>0&&mid.view().boss.hp<12);
const actualProgress=mid.input.progress,anchor=actualProgress-mid.input.speed*(mid.input.bar%1)*1.875;
const liveBefore=plain(mid.state),saved=plain(C.snapshot(mid.state,{progress:anchor}));
assert.deepEqual(plain(mid.state),liveBefore,'checkpoint export does not mutate simulation');
assert.equal(saved.lastProgress,anchor);
for(const actor of saved.enemies) {
  const original=liveBefore.enemies.find(item=>item.id===actor.id);
  assert(Math.abs((actor.at-anchor)-(original.at-actualProgress))<1e-7);
}
const restored=C.restore(saved,{progress:anchor,bar:Math.floor(mid.input.bar)});
assert(restored);assert.equal(restored.boss.hp,mid.state.boss.hp);
assert.deepEqual(plain(restored.ledger),saved.ledger);
assert(restored.enemies.every(actor=>actor.phase==='approach'&&actor.rearmMs===1400));
const resumedInput={...mid.input,progress:anchor,bar:Math.floor(mid.input.bar)};
const resumedEvents=[];for(let i=0;i<20;i++) {
  resumedInput.progress+=resumedInput.speed*.05;
  resumedEvents.push(...C.step(restored,50,resumedInput));
}
assert(!resumedEvents.some(event=>event.type==='hit'||event.type==='lock'),
  'reload cannot deliver a saved half-attack before a full new warning');
for(const forge of [
  raw=>{raw.version=5;},raw=>{raw.boss.hp=0;raw.boss.defeated=true;},
  raw=>{raw.ledger[0].damage+=1;},raw=>{raw.stats.takedowns+=1;},
  raw=>{raw.ledger.push({...raw.ledger[0]});},raw=>{raw.enemies[0].at=Infinity;},
  raw=>{raw.projectiles.push({id:'hidden-shot'});},raw=>{raw.cooldowns.attack=-1;},
  raw=>{raw.boss.systems.reverse();},raw=>{raw.defeated=true;}
  ,raw=>{raw.stats.attacks=0;raw.stats.blocks=0;raw.stats.turbos=0;raw.stats.shots=0;}
]){const raw=plain(saved);forge(raw);assert.equal(C.restore(raw,{progress:anchor,bar:Math.floor(mid.input.bar)}),null);}
assert.equal(C.restore(saved,{progress:anchor+5,bar:Math.floor(mid.input.bar)}),null);

// Killed bodies and bike riders use the original physical world coordinate,
// slow down, pass into the rear and are bounded rather than disappearing at hit.
const wreckRace=fixture();while(!wreckRace.view().wrecks.length)drive(wreckRace);
const wreck=plain(wreckRace.view().wrecks[0]),id=wreck.id;
for(let i=0;i<30;i++)drive(wreckRace);
const later=wreckRace.view().wrecks.find(item=>item.id===id);assert(later);
assert(later.at>wreck.at&&later.at-wreck.at<13);
assert(later.distance<wreck.distance);assert.equal(later.phase,'wreck');
assert(wreckRace.state.wrecks.length<=6);

console.log(`Cache combat: ${races} zero-sync gear/difficulty victories; passive dodge cannot win; real guard/Turbo/weapon damage, bounded physical wrecks, fractional safe checkpoints and forged-save rejection passed.`);
