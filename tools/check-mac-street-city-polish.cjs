#!/usr/bin/env node
'use strict';
// Play the shipping simulation through public controls. This harness neither
// mutates combat state nor substitutes AI, damage, clocks or checkpoints.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const forbidden=()=>{throw Error('City polish introduced a second global owner');};
const context={window:{BARCODE:{}},requestAnimationFrame:forbidden,setTimeout:forbidden,setInterval:forbidden,
  document:{createElement:forbidden,addEventListener:forbidden},Audio:forbidden,AudioContext:forbidden};
const coreBytes=fs.readFileSync(path.join(__dirname,'../src/game/mac-street-combat.js'));
vm.runInNewContext(coreBytes.toString('utf8'),context);
const C=context.window.BARCODE.MacStreetCombat,dt=1000/60,press=name=>({[name]:{pressed:true,held:true}});
const plain=value=>JSON.parse(JSON.stringify(value)),receipt={checks:[],route:null,samples:{}};
const snapshotIndex=process.argv.indexOf('--snapshot-out'),snapshotNames=new Set();
const snapshots={source:'src/game/mac-street-combat.js',sourceSha256:crypto.createHash('sha256').update(coreBytes).digest('hex'),
  scope:'Earned public-input production simulation snapshots; native draw diagnostics, not hardware playback or physical input proof.',cases:[]};
function recordSnapshot(name,snapshot,expected){
  if(snapshotIndex<0||snapshotNames.has(name))return;
  snapshotNames.add(name);snapshots.cases.push({name,expected,snapshot:plain(snapshot)});
}
function check(name,body){body();receipt.checks.push(name);console.log('PASS '+name);}
function rig(){
  const game=C.create(),events=[];
  const r={game,events,view:()=>game.getSnapshot(),step(input={}){
    const result=game.update(dt,input);events.push(...game.drainEvents());return result;},
    until(predicate,input={},limitMs=25000){for(let n=0;n<Math.ceil(limitMs/dt);n++){
      const s=r.view();if(predicate(s))return s;r.step(typeof input==='function'?input(s):input);
    }const s=r.view();assert.fail('Public play timed out: '+JSON.stringify({zone:s.zone.index,wave:s.wave.index,status:s.status,
      player:{x:s.player.x,laneY:s.player.laneY,hp:s.player.hp},enemies:s.enemies.map(e=>({kind:e.kind,x:e.x,laneY:e.laneY,phase:e.phase}))}));}};
  return r;
}
function fighting(r,s){
  const p=s.player,controls=r.game.getControlState(),input={};
  if(p.grapple||p.carry)return {};
  const foe=s.enemies.filter(e=>e.hp>0&&e.phase!=='dormant').sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  if(!foe)return {move_x:1};
  const dx=foe.x-p.x,direction=Math.sign(dx)||p.facing;
  input.move_x=Math.abs(dx)>58||p.facing!==direction?direction:0;
  input.move_y=Math.abs(foe.laneY-p.laneY)>8?Math.sign(foe.laneY-p.laneY):0;
  const incoming=s.projectiles.find(item=>item.owner!=='player'&&(item.x-p.x)*item.facing<0&&
    Math.abs(item.x-p.x)<145&&Math.abs(item.laneY-p.laneY)<=item.laneReach+10);
  const warning=s.enemies.filter(e=>e.hp>0&&e.phase==='windup'&&Math.abs(e.attackLaneY-p.laneY)<45&&Math.abs(e.x-p.x)<330)
    .sort((a,b)=>(a.tellMs-a.phaseMs)-(b.tellMs-b.phaseMs))[0];
  const remaining=warning?warning.tellMs-warning.phaseMs:Infinity;
  if(foe.kind==='null_regent'&&foe.phase==='active'){
    if(foe.attackSpec.guardable!==false)return {...input,move_x:0,guard:{held:true}};
    if(controls.jump.ready)return {...input,move_x:0,...press('jump')};
    return {...input,move_x:0,move_y:p.laneY>875?-1:1};
  }
  if(foe.kind==='null_regent'&&s.projectiles.some(item=>item.owner!=='player'&&Math.abs(item.x-p.x)<430&&Math.abs(item.laneY-p.laneY)<55)){
    if(incoming&&controls.jump.ready)return {...input,...press('jump')};
    return {...input,move_x:0,guard:{held:true}};
  }
  if(incoming&&controls.jump.ready)return {...input,...press('jump')};
  if(warning&&remaining<(warning.kind==='null_regent'?650:310)&&(warning.kind==='null_regent'||!p.attack&&!p.throwMs)){
    if(!warning.attackTell.guardable&&remaining<250&&controls.jump.ready)input.jump={pressed:true,held:true};
    else if(warning.attackTell.guardable&&remaining<105)input.guard={held:true};
    else if(!warning.attackTell.guardable&&!p.elevation)input.move_y=p.laneY>875?-1:1;
    input.move_x=0;return input;
  }
  if(foe.kind!=='null_regent'&&controls.throw.ready&&controls.throw.targetType==='enemy'&&!r.lastThrow)input.throw={pressed:true,held:true};
  else if(controls.strike.ready&&!r.lastStrike&&Math.abs(dx)<=100&&Math.abs(foe.laneY-p.laneY)<=35){
    if(p.running)input.guard={held:true};else input.strike={pressed:true,held:true};
  }
  r.lastThrow=!!input.throw;r.lastStrike=!!input.strike;return input;
}
check('all twelve authored encounters describe different actual city combinations',()=>{
  assert.equal(C.encounters.length,6);const names=new Set();
  for(const pair of C.encounters){assert.equal(pair.length,2);for(const item of pair){
    assert(item.name&&item.objective.length>35);assert(!names.has(item.name));names.add(item.name);assert(Object.isFrozen(item));}}
  const s=C.create().getSnapshot();s.zone.encounter.objective='test corruption';
  assert.notEqual(C.create().getSnapshot().zone.encounter.objective,'test corruption');
  assert.equal(Object.keys(C.weapons).length,8);assert.equal(C.constants.totalEnemies,30);
});
check('interruptions remove the old tell, allow a reachable combo, and publish a complete new warning',()=>{
  const r=rig();r.until(s=>s.enemies[0].phase==='windup',{move_x:1});
  const initial=r.view().enemies[0].attackTell;r.step(press('strike'));
  r.until(s=>s.enemies[0].phase==='stunned');const interrupted=r.view();
  assert.equal(interrupted.enemies[0].attackTell,null);assert(r.events.some(e=>e.type==='enemy-interrupted'));
  const recovered=r.until(s=>s.enemies[0].phase==='approach'),rearmAt=recovered.enemies[0].nextTellAtMs;
  assert(rearmAt>=recovered.elapsedMs+C.constants.interruptedRearmMs-dt-1e-6);
  r.until(s=>s.enemies[0].phase==='windup');const next=r.view().enemies[0];
  assert(r.view().elapsedMs+1e-6>=rearmAt);
  assert(next.attackTell.response);assert.equal(next.attackTell.durationMs,initial.durationMs);
  const ready=r.events.filter(e=>e.type==='enemy-tell'&&e.id===next.id).at(-1);
  r.until(()=>r.events.some(e=>e.type==='enemy-attack'&&e.id===next.id&&e.atMs>ready.atMs));
  const fired=r.events.find(e=>e.type==='enemy-attack'&&e.id===next.id&&e.atMs>ready.atMs);
  assert(fired.atMs-ready.atMs+1e-6>=ready.tellMs);
  assert.equal(fired.attackType,ready.attackType);
});
check('a destroyed street fixture really interrupts nearby aliens once and never harms Mac',()=>{
  const r=rig(),fixtureId='alley-streetlight';
  // Run toward the fixture while both aliens pursue, then strike its near edge.
  r.until(s=>s.player.x>=2655&&Math.abs(s.player.laneY-795)<5,s=>({move_x:s.player.x<2655?1:0,
    move_y:Math.abs(s.player.laneY-795)>3?Math.sign(795-s.player.laneY):0,run:{held:true}}),15000);
  r.until(s=>s.enemies.some(e=>e.hp>0&&Math.abs(e.x-2740)<=C.constants.fixtureDischargeRange&&Math.abs(e.laneY-795)<=95),{},20000);
  let before,after,discharge;
  r.until(s=>{
    discharge=r.events.find(e=>e.type==='fixture-discharge'&&e.id===fixtureId);if(discharge){after=s;return true;}return false;
  },s=>{
    before=s;
    const controls=r.game.getControlState();
    if(controls.strike.ready&&!s.player.attack)return {move_x:s.player.facing===1?0:1,...press('strike')};
    return {};
  },6000);
  assert(discharge.enemyIds.length>0,'the enemy-only pulse hits real pursuing enemies');
  assert.equal(after.player.hp,before.player.hp,'the actual discharge substep never damages Mac');
  const damage=r.events.filter(e=>e.type==='enemy-hit'&&e.cause==='fixture-discharge');
  assert.equal(damage.length,discharge.enemyIds.length);assert(damage.every(e=>e.damage===12));
  assert(after.hitFx.some(f=>f.kind==='prop-break'&&f.discharge&&f.radius===235));
  for(let n=0;n<90;n++)r.step();
  assert.equal(r.events.filter(e=>e.type==='fixture-discharge'&&e.id===fixtureId).length,1);
  assert.equal(r.events.filter(e=>e.type==='enemy-hit'&&e.cause==='fixture-discharge').length,damage.length);
  const retry=r.game.retry();assert(!retry.props.find(prop=>prop.id===fixtureId).broken);
  assert(!retry.hitFx.some(f=>f.discharge));assert(retry.enemies.every(e=>e.nextTellAtMs===0&&!e.punishUntilMs));
  receipt.fixture={id:fixtureId,enemyIds:discharge.enemyIds,damageEvents:damage.length,enemyOnly:true,once:true};
  receipt.samples.fixture=after;
  recordSnapshot('fixture-discharge',after,{fixtureId,kind:'prop-break',discharge:true,radius:235,enemyIds:discharge.enemyIds});
});
let route;
check('public play earns six separated second fights, fair mixed pressure and the three-phase boss',()=>{
  route=rig();const advances=new Set(),waves=new Set(),tactics=new Set();let maxMelee=0,mixedPressure=false,recoveryHit=false,phaseLocked=false;
  for(let frame=0;frame<Math.ceil(480000/dt);frame++){
    const s=route.view();if(s.desk.unlocked||s.status==='defeated')break;
    const telling=s.enemies.find(e=>e.hp>0&&e.phase==='windup');
    if(telling)recordSnapshot('district-'+s.zone.index+'-tell',s,{zoneId:s.zone.id,enemyId:telling.id,action:'tell',
      attackType:telling.attackTell.type,response:telling.attackTell.response,warning:true});
    const melee=s.enemies.filter(e=>e.hp>0&&e.kind!=='bile_spitter'&&e.attackSpec?.attackType!=='ground-wave'&&['windup','active'].includes(e.phase));
    maxMelee=Math.max(maxMelee,melee.length);
    mixedPressure||=melee.length>0&&s.enemies.some(e=>e.hp>0&&['windup','active'].includes(e.phase)&&
      (e.kind==='bile_spitter'||e.attackSpec?.attackType==='ground-wave'));
    for(const e of s.enemies)if(e.hp>0)tactics.add(e.kind+':'+e.tactic);
    if(s.zone.state==='advance'){
      advances.add(s.zone.id);assert(s.enemies.every(e=>e.phase==='dormant'));
      if(!receipt.samples.advance)receipt.samples.advance=s;
    }
    if(s.zone.state==='combat'&&s.wave.index===2){waves.add(s.zone.id);assert(s.checkpoint.x>=s.zone.encounter.advanceX-1e-6);}
    const before=route.events.length,boss=s.enemies.find(e=>e.kind==='null_regent'),deadline=boss?.punishUntilMs;
    const locked=plain(boss?.attackTell||null);let input=fighting(route,s);
    const latestBossTell=boss?route.events.findLast(e=>e.type==='enemy-tell'&&e.id===boss.id):null;
    if(locked&&[2,3].includes(boss.bossPhase)&&latestBossTell?.bossPhase===boss.bossPhase)
      recordSnapshot('boss-phase-'+boss.bossPhase+'-tell',s,{bossPhase:boss.bossPhase,phaseName:s.boss.phaseName,
        enemyId:boss.id,window:'warning',action:'tell',attackType:locked.type,response:locked.response});
    const threshold=boss?.bossPhase===1?200:boss?.bossPhase===2?100:0;
    const nearThreshold=threshold&&boss.hp>threshold&&boss.hp<=threshold+20;
    if(boss&&!route.events.some(e=>e.type==='boss-exposed'&&e.durationMs>=1250)&&['windup','active'].includes(boss.phase))
      input={move_x:s.player.facing===(Math.sign(boss.x-s.player.x)||s.player.facing)?0:Math.sign(boss.x-s.player.x),guard:{held:true}};
    else if(nearThreshold&&!locked&&boss.phase!=='active')input={};
    // The optional visual receipt observes a fresh phase-three commitment
    // before finishing its already-earned punish window. This is an ordinary
    // held block, not a health patch, forced phase or second simulated route.
    if(snapshotIndex>=0&&boss?.bossPhase===3&&!snapshotNames.has('boss-phase-3-tell'))
      input={move_x:s.player.facing===(Math.sign(boss.x-s.player.x)||s.player.facing)?0:Math.sign(boss.x-s.player.x),guard:{held:true}};
    if(locked&&boss.hp>threshold&&boss.hp<=threshold+20&&route.game.getControlState().strike.ready&&
      Math.abs(boss.x-s.player.x)<=100&&Math.abs(boss.laneY-s.player.laneY)<=35)
      input=press('strike');
    const after=route.step(input);
    const bossAfter=after.enemies.find(e=>e.kind==='null_regent'),events=route.events.slice(before);
    if(boss?.phase==='recovery'&&events.some(e=>e.type==='enemy-hit'&&e.kind==='null_regent')){
      recoveryHit=true;if(bossAfter.hp>0){assert.equal(bossAfter.phase,'recovery');assert.equal(bossAfter.punishUntilMs,deadline);}
      if(!receipt.samples.punish)receipt.samples.punish=after;
      if(bossAfter.hp>0)recordSnapshot('boss-punish',after,{bossPhase:bossAfter.bossPhase,enemyId:bossAfter.id,window:'punish',
        action:'recover',punishRemainingMs:after.boss.punishRemainingMs,deadlineUnchanged:true});
    }
    if(locked&&bossAfter?.bossPhase>boss.bossPhase&&bossAfter.phase==='windup'){
      phaseLocked=true;assert.equal(bossAfter.attackTell.type,locked.type);assert.equal(bossAfter.attackTell.durationMs,locked.durationMs);
      assert.equal(bossAfter.attackTell.targetX,locked.targetX);assert.equal(bossAfter.attackTell.laneY,locked.laneY);
    }
  }
  const s=route.view();assert.equal(s.status,'desk-ready');assert.equal(s.kills,30);assert.equal(s.city.completedWaves,12);
  assert.equal(advances.size,6);assert.equal(waves.size,6);assert.equal(maxMelee,1);assert(mixedPressure,'ranged foes attack while a close fighter commits');
  assert(tactics.has('rift_stalker:flank'));assert(tactics.has('prism_guard:protect-spitter'));assert(tactics.has('shock_mantid:pulse-line'));
  assert(recoveryHit,'an actual strike lands inside the real boss punish window');
  assert(phaseLocked,'an actual damaging strike crosses a boss phase threshold during its locked warning');
  assert.deepEqual(route.events.filter(e=>e.type==='boss-phase').map(e=>e.phase),[2,3]);
  const natural=route.events.filter(e=>e.type==='boss-exposed'&&e.durationMs>=1250);assert(natural.length>0);
  const warnings=new Map();let lastTell=-Infinity;
  for(const event of route.events){
    if(event.type==='enemy-tell'){
      assert(event.atMs-lastTell+1e-6>=C.constants.tellSpacingMs);lastTell=event.atMs;
      assert(event.response);warnings.set(event.id,event);
    }
    if(event.type==='enemy-attack'){
      const warning=warnings.get(event.id);assert(warning);assert.equal(event.attackType,warning.attackType);
      assert(event.atMs-warning.atMs+1e-6>=warning.tellMs);
    }
  }
  receipt.route={kills:s.kills,waves:s.city.completedWaves,districts:s.city.clearedZones.length,
    advances:[...advances],maxMelee,mixedPressure,recoveryHit,phaseLockedDuringRoute:phaseLocked,
    elapsedMs:s.elapsedMs,bossExposures:natural.length,tactics:[...tactics].sort()};
  const retry=route.game.retry();assert.equal(retry.zone.index,6);assert.equal(retry.wave.index,2);
  assert.equal(retry.boss.phase,1);assert.equal(retry.boss.punishRemainingMs,0);assert.equal(retry.boss.window,'approach');
  assert.equal(retry.player.hp,100);assert.equal(retry.player.attack,null);
});
const outIndex=process.argv.indexOf('--out');if(outIndex>=0)fs.writeFileSync(path.resolve(process.argv[outIndex+1]),JSON.stringify(receipt,null,2)+'\n');
if(snapshotIndex>=0){
  for(const name of [...Array.from({length:6},(_,i)=>'district-'+(i+1)+'-tell'),'boss-phase-2-tell','boss-phase-3-tell','boss-punish','fixture-discharge'])
    assert(snapshotNames.has(name),'existing public-input route earns visual case '+name);
  fs.writeFileSync(path.resolve(process.argv[snapshotIndex+1]),JSON.stringify(snapshots,null,2)+'\n');
}
console.log('Mac city polish: '+receipt.checks.length+' actual-core groups passed. Rendering, physical controls and feel remain host checks.');
