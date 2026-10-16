#!/usr/bin/env node
'use strict';
// Exercise the shipping core through ordinary inputs. The fixture never edits
// health, enemy positions, encounter flags, checkpoint contents or clocks.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const forbidden=()=>{throw Error('Unexpected global owner in street combat');};
const context={window:{BARCODE:{}},setTimeout:forbidden,setInterval:forbidden,requestAnimationFrame:forbidden,
  document:{createElement:forbidden,addEventListener:forbidden},Audio:forbidden,AudioContext:forbidden};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/game/mac-street-combat.js'),'utf8'),context);
const C=context.window.BARCODE.MacStreetCombat;
const press=name=>({[name]:{pressed:true,held:true}}),plain=value=>JSON.parse(JSON.stringify(value));
const receipt={checks:[],route:null};
function check(name,body){body();receipt.checks.push(name);console.log('PASS '+name);}
function rig(){
  const game=C.create(),events=[],dt=1000/60;
  const r={game,events,view:()=>game.getSnapshot(),step(input={},delta=dt){
    const s=game.update(delta,input);events.push(...game.drainEvents());return s;},
    until(predicate,input={},limitMs=25000){for(let n=0;n<Math.ceil(limitMs/dt);n++){
      const s=r.view();if(predicate(s))return s;r.step(typeof input==='function'?input(s):input);
    }assert.fail('Timed out at '+JSON.stringify({zone:r.view().zone.index,wave:r.view().wave.index,status:r.view().status}));}};
  return r;
}
function tactical(r,s){
  const controls=r.game.getControlState(),p=s.player,input={};
  if(p.grapple||p.carry)return {};// Actual L release starts its committed throw.
  const foe=s.enemies.filter(e=>e.hp>0&&e.phase!=='dormant').sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  if(!foe){input.move_x=1;return input;}
  const dx=foe.x-p.x,direction=Math.sign(dx)||p.facing;
  input.move_x=Math.abs(dx)>58||p.facing!==direction?direction:0;
  input.move_y=Math.abs(foe.laneY-p.laneY)>8?Math.sign(foe.laneY-p.laneY):0;
  const incoming=s.projectiles.find(item=>(item.x-p.x)*item.facing<0&&Math.abs(item.x-p.x)<145&&Math.abs(item.laneY-p.laneY)<=item.laneReach+10);
  const warning=s.enemies.filter(e=>e.hp>0&&e.phase==='windup'&&Math.abs(e.attackLaneY-p.laneY)<45&&Math.abs(e.x-p.x)<330)
    .sort((a,b)=>(a.tellMs-a.phaseMs)-(b.tellMs-b.phaseMs))[0];
  const remaining=warning?warning.tellMs-warning.phaseMs:Infinity;
  if(incoming&&controls.jump.ready){input.jump={pressed:true,held:true};return input;}
  // A human stops committing a multi-hit combo before the Regent's long cleave,
  // then times the same final parry/jump edge. No encounter stats are modified.
  if(warning&&remaining<(warning.kind==='null_regent'?650:310)&&(warning.kind==='null_regent'||!p.attack&&!p.throwMs)){
    if(!warning.attackTell.guardable&&remaining<250&&controls.jump.ready)input.jump={pressed:true,held:true};
    else if(warning.attackTell.guardable&&remaining<105)input.guard={held:true};
    else if(!warning.attackTell.guardable&&!p.elevation)input.move_y=p.laneY>875?-1:1;
    input.move_x=0;return input;
  }
  if(controls.throw.ready&&controls.throw.targetType==='enemy'&&!r.lastThrow)input.throw={pressed:true,held:true};
  else if(controls.strike.ready&&!r.lastStrike&&Math.abs(dx)<=100&&Math.abs(foe.laneY-p.laneY)<=35)
    input.strike={pressed:true,held:true};
  r.lastThrow=!!input.throw;r.lastStrike=!!input.strike;return input;
}
check('brief impact pause freezes simulation and retains a fresh combo input',()=>{
  const r=rig();r.until(s=>s.enemies[0].phase==='windup',{move_x:1});r.step(press('strike'));
  r.until(s=>s.impact.remainingMs>0);
  const before=r.view();assert(before.impact.remainingMs<=C.constants.maxImpactPauseMs);
  r.step(press('strike'),1);
  assert.equal(r.view().elapsedMs,before.elapsedMs);assert.equal(r.view().player.x,before.player.x);
  r.game.handleInput({});
  r.until(s=>s.player.attack?.step===2);
  assert.equal(r.events.filter(event=>event.type==='strike'&&event.step===2).length,1);
  assert(r.view().elapsedMs>before.elapsedMs);
  r.until(s=>s.player.attack?.phase==='recovery');r.step(press('strike'));
  r.until(s=>s.enemies[0].launched);
  assert(r.events.some(event=>event.type==='launch'&&event.move==='finisher'));
  assert.equal(r.view().enemies[0].hp,0,'earned three-hit finisher launches the defeated scuttler');
});
let route;
check('earned route retains six districts, twelve waves, thirty foes and reachable relay',()=>{
  route=rig();let restored=false,seenAdvance=false,maxMelee=0,seenFlight=false,seenKnockdown=false;
  route.until(s=>s.desk.unlocked||s.status==='defeated',s=>{
    seenAdvance||=s.zone.state==='advance';
    seenFlight||=s.enemies.some(e=>e.launched&&e.elevation>0&&Number.isFinite(e.velocityZ));
    seenKnockdown||=s.enemies.some(e=>!e.launched&&e.knockdownMs>0&&e.elevation===0);
    if(s.zone.index<=2)maxMelee=Math.max(maxMelee,s.enemies.filter(e=>e.hp>0&&e.kind!=='bile_spitter'&&['windup','active'].includes(e.phase)).length);
    if(s.zone.index===2&&s.zone.cleared&&!restored){
      const dx=s.relay.x-s.player.x,dy=s.relay.laneY-s.player.laneY;
      if(route.game.getControlState().interactAvailable){assert(route.game.interact());restored=true;return {};}
      return {move_x:Math.abs(dx)>70?Math.sign(dx):0,move_y:Math.abs(dy)>15?Math.sign(dy):0};
    }
    return tactical(route,s);
  },480000);
  const s=route.view();assert.equal(s.status,'desk-ready',JSON.stringify({zone:s.zone.index,wave:s.wave.index,kills:s.kills,lastHits:route.events.filter(e=>e.type==='player-hit').slice(-4)}));assert.equal(s.kills,30);assert.equal(s.city.completedWaves,12);
  assert.equal(s.city.clearedZones.length,6);assert(restored);assert(s.relay.restored);assert(!route.game.interact());
  assert(seenAdvance,'second fights are earned farther down the first two streets');
  assert(seenFlight&&seenKnockdown,'real throws fly, land, and recover');assert.equal(maxMelee,1,'melee commits are coordinated');
  receipt.route={kills:s.kills,waves:s.city.completedWaves,districts:s.city.clearedZones.length,relayRestored:restored,elapsedMs:s.elapsedMs};
});
check('launched bodies damage each secondary victim or prop once per flight',()=>{
  const seen=new Set(),counts=new Map();let impacts=0;
  for(const event of route.events){
    if(event.type==='launch'){counts.set(event.id,(counts.get(event.id)||0)+1);}
    if(event.type==='body-impact'){
      impacts++;const key=event.id+':'+counts.get(event.id)+':'+event.targetId;
      assert(!seen.has(key),'one secondary hit per victim per flight');seen.add(key);assert(event.damage>0);
    }
  }
  assert(impacts>0,'public inputs produce an actual body collision');
  assert(route.events.some(event=>event.type==='prop-break'),'ordinary combat can break street props');
  receipt.bodyImpacts=impacts;receipt.propBreaks=route.events.filter(event=>event.type==='prop-break').length;
});
check('ordinary strikes break a crate and its health pickup waits for grounded proximity',()=>{
  const r=rig();r.until(s=>s.enemies[0].phase==='windup',{move_x:1});r.until(s=>s.player.hp<100);
  // Props now have a real footprint; strike the near edge while keeping outside
  // pickup radius even if an attacker causes an ordinary short knockback.
  r.until(s=>Math.abs(s.player.x-1020)<4&&Math.abs(s.player.laneY-832)<4,s=>({
    move_x:Math.abs(s.player.x-1020)>3?Math.sign(1020-s.player.x):0,
    move_y:Math.abs(s.player.laneY-832)>3?Math.sign(832-s.player.laneY):0,guard:{held:true}}));
  r.until(s=>s.props.find(prop=>prop.id==='alley-health-crate').broken,s=>
    r.game.getControlState().strike.ready&&!s.player.attack?press('strike'):{});
  assert(r.events.some(event=>event.type==='prop-break'&&event.id==='alley-health-crate'&&event.cause==='strike'));
  r.until(s=>!s.player.attack&&!s.player.hurtMs);
  const pickupId='alley-health-crate-health';assert(r.view().pickups.some(pickup=>pickup.id===pickupId));
  r.step(press('jump'));r.until(s=>s.player.elevation>30);
  r.until(s=>Math.abs(s.player.x-1140)<45,{move_x:1},1000);
  assert(r.view().player.elevation>0);assert(r.view().pickups.some(pickup=>pickup.id===pickupId));
  r.until(()=>r.events.some(event=>event.type==='pickup'&&event.id===pickupId),{},1500);
  assert(r.events.some(event=>event.type==='pickup'&&event.id===pickupId&&event.heal>0));
  assert(!r.view().pickups.some(pickup=>pickup.id===pickupId));
});
check('retry clears hit pause, flights and queued actions while restoring earned props',()=>{
  const r=rig();r.until(s=>s.enemies[0].phase==='windup',{move_x:1});r.step(press('throw'));
  r.until(s=>s.enemies.some(e=>e.launched));r.game.handleInput(press('strike'));
  const cp=plain(r.view().checkpoint),after=r.game.retry();
  assert.equal(after.impact.remainingMs,0);assert(after.enemies.every(e=>!e.launched&&!e.knockdownMs));
  assert.equal(after.player.attack,null);assert.equal(after.player.grapple,null);assert.equal(after.player.hp,100);
  assert.deepEqual(plain(after.props),cp.props.filter(prop=>prop.zoneId===after.zone.id));
  r.step();assert.equal(r.view().player.attack,null);assert.equal(r.events.filter(event=>event.type==='strike').length,0);
});
check('new presentation snapshots remain defensive and relay cannot restore remotely',()=>{
  const r=rig(),s=r.view();assert(!r.game.interact());
  s.props[0].hp=0;s.relay.restored=true;s.impact.remainingMs=999;
  const real=r.view();assert(real.props[0].hp>0);assert(!real.relay.restored);assert.equal(real.impact.remainingMs,0);
  assert.equal(C.zones.flatMap(zone=>zone.waves.flat()).length,30);
});
const outIndex=process.argv.indexOf('--out');if(outIndex>=0)fs.writeFileSync(path.resolve(process.argv[outIndex+1]),JSON.stringify(receipt,null,2)+'\n');
console.log('Mac street power: '+receipt.checks.length+' groups passed.');
