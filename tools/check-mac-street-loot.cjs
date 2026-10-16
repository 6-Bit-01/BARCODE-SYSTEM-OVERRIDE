#!/usr/bin/env node
'use strict';
// Real production simulation and public inputs. No writes to health, actor
// coordinates, clocks, inventory, prop HP, districts or checkpoints.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const forbidden=()=>{throw Error('Loot must not create a browser owner or roll during physics');};
const math=Object.create(Math);math.random=forbidden;
const bytes=fs.readFileSync(path.join(__dirname,'../src/game/mac-street-combat.js'));
const context={window:{BARCODE:{}},Math:math,setTimeout:forbidden,setInterval:forbidden,requestAnimationFrame:forbidden,
  document:{createElement:forbidden,addEventListener:forbidden},Audio:forbidden,AudioContext:forbidden};
vm.runInNewContext(bytes.toString('utf8'),context);
const M=context.window.BARCODE.MacStreetCombat,plain=value=>JSON.parse(JSON.stringify(value)),dt=1000/60;
const press=name=>({[name]:{pressed:true,held:true}}),receipt={sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),checks:[],route:null};
function check(name,body){body();receipt.checks.push(name);console.log('PASS '+name);}
function rig(lootSeed){const game=M.create({lootSeed}),events=[];
  const r={game,events,equippedIds:new Set(),lastStrike:false,lastThrow:false,view:()=>game.getSnapshot(),
    step(input={},delta=dt){const s=game.update(delta,input),fresh=game.drainEvents();events.push(...fresh);
      for(const event of fresh)if(event.type==='weapon-equipped')r.equippedIds.add(event.id);return s;},
    until(predicate,input={},limitMs=25000){for(let n=0;n<Math.ceil(limitMs/dt);n++){
      const s=r.view();if(predicate(s))return s;r.step(typeof input==='function'?input(s):input);}
      const s=r.view();assert.fail('Public-input loot route timed out: '+JSON.stringify({zone:s.zone.index,wave:s.zone.wave,state:s.zone.state,
        status:s.status,player:{x:s.player.x,laneY:s.player.laneY,hp:s.player.hp,weapon:s.player.weapon},
        foes:s.enemies.filter(e=>e.hp).map(e=>({kind:e.kind,x:e.x,laneY:e.laneY,phase:e.phase}))}));}};return r;}
const walk=(p,target)=>({move_x:Math.abs(target.x-p.x)>6?Math.sign(target.x-p.x):0,
  move_y:Math.abs(target.laneY-p.laneY)>5?Math.sign(target.laneY-p.laneY):0});
function fight(r,s){
  const p=s.player,controls=r.game.getControlState(),input={};if(p.grapple||p.carry)return {};
  const foe=s.enemies.filter(e=>e.hp>0&&e.phase!=='dormant').sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  const wanted=s.pickups.filter(item=>item.kind==='weapon'&&item.source==='street-cache'&&!r.equippedIds.has(item.id))
    .sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  if(wanted&&(!foe||Math.abs(wanted.x-p.x)<160)){
    if(controls.throw.ready&&controls.throw.targetType==='weapon'&&controls.throw.targetId===wanted.id)return press('throw');
    if(!foe||Math.abs(foe.x-p.x)>105)return walk(p,wanted);
  }
  if(!foe)return {move_x:1};
  const dx=foe.x-p.x,direction=Math.sign(dx)||p.facing;
  input.move_x=Math.abs(dx)>58||p.facing!==direction?direction:0;
  input.move_y=Math.abs(foe.laneY-p.laneY)>8?Math.sign(foe.laneY-p.laneY):0;
  const incoming=s.projectiles.find(item=>item.owner!=='player'&&(item.x-p.x)*item.facing<0&&Math.abs(item.x-p.x)<145&&Math.abs(item.laneY-p.laneY)<=item.laneReach+10);
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
    if(warning.attackTell.guardable===false&&remaining<250&&controls.jump.ready)input.jump={pressed:true,held:true};
    else if(warning.attackTell.guardable!==false&&remaining<105)input.guard={held:true};
    else if(warning.attackTell.guardable===false&&!p.elevation)input.move_y=p.laneY>875?-1:1;
    input.move_x=0;return input;
  }
  if(foe.kind!=='null_regent'&&controls.throw.ready&&controls.throw.targetType==='enemy'&&!r.lastThrow)input.throw={pressed:true,held:true};
  else if(controls.strike.ready&&!r.lastStrike&&Math.abs(dx)<(p.weapon?M.weapons[p.weapon.kind].reach:100)&&Math.abs(foe.laneY-p.laneY)<35)
    input.strike={pressed:true,held:true};
  r.lastThrow=!!input.throw;r.lastStrike=!!input.strike;return input;
}
function equip(r,item){
  r.until(s=>r.equippedIds.has(item.id),s=>{const controls=r.game.getControlState();
    if(controls.throw.ready&&controls.throw.targetType==='weapon'&&controls.throw.targetId===item.id)return press('throw');
    return walk(s.player,item);});r.step();
}
function smash(r,prop){
  r.until(s=>s.props.find(item=>item.id===prop.id).broken,s=>{
    const target=s.props.find(item=>item.id===prop.id),p=s.player,controls=r.game.getControlState(),direction=Math.sign(target.x-p.x)||p.facing;
    if(Math.abs(p.x-target.x)>62||Math.abs(p.laneY-target.laneY)>8)return walk(p,{x:target.x-direction*55,laneY:target.laneY});
    if(p.facing!==direction)return {move_x:direction};
    if(controls.strike.ready&&!p.attack)return press('strike');return {};
  },45000);r.until(s=>!s.player.attack);r.step();
}
check('uint32 seeds reproduce complete immutable layouts and only a full replay rerolls',()=>{
  for(const seed of [0,1,42,0xffffffff]){
    assert.deepEqual(plain(M.lootLayout(seed)),plain(M.lootLayout(seed)));
    assert.equal(M.create({lootSeed:seed}).getSnapshot().lootSeed,seed);
    const layout=M.lootLayout(seed);assert(Object.isFrozen(layout)&&Object.isFrozen(layout.pickups)&&Object.isFrozen(layout.propWeapons));
    assert(layout.pickups.every(Object.isFrozen)&&layout.propWeapons.every(Object.isFrozen));
  }
  for(const seed of [-1,1.5,NaN,Infinity,0x100000000,'42',undefined])assert.equal(M.lootLayout(seed).seed,M.defaultLootSeed);
  assert.notDeepEqual(plain(M.lootLayout(0)),plain(M.lootLayout(1)));
  const game=M.create({lootSeed:42}),before=plain(game.getSnapshot());
  game.update(100,{});assert.deepEqual(plain(game.getSnapshot().pickups),before.pickups);
  game.retry();assert.equal(game.getSnapshot().lootSeed,42);assert.deepEqual(plain(game.getSnapshot().pickups),before.pickups);
  before.pickups[0].x=0;assert.equal(game.getSnapshot().pickups[0].x,300,'public snapshots cannot corrupt the authored tutorial cache');
});
check('64 distinct seeds supply both fight pockets and breakable rewards in every district without frontloaded guns',()=>{
  const signatures=new Set(),positions=new Map(),rewards=new Map();
  for(let seed=0;seed<64;seed++){
    const layout=M.lootLayout(seed);signatures.add(JSON.stringify(plain(layout)));
    assert.equal(layout.pickups.length,12);assert.equal(layout.propWeapons.length,10);
    assert.equal(new Set(layout.pickups.map(item=>item.id)).size,12);assert.equal(new Set(layout.propWeapons.map(item=>item.propId)).size,10);
    assert.deepEqual([...new Set(layout.pickups.map(item=>item.weaponKind))].sort(),Object.keys(M.weapons).sort());
    for(const zone of M.zones){
      const items=layout.pickups.filter(item=>item.zoneId===zone.id);assert.equal(items.length,2);
      assert(items.some(item=>item.x<zone.startX+M.constants.advanceEntryOffset));
      assert(items.some(item=>item.x>zone.startX+M.constants.advanceEntryOffset));
      for(const item of items){assert(item.x>zone.startX+40&&item.x<zone.endX-40);
        assert(item.laneY>=M.constants.laneMin&&item.laneY<=M.constants.laneMax);
        assert.equal(item.charges,M.weapons[item.weaponKind].charges);
        assert(!M.props.some(prop=>prop.zoneId===zone.id&&prop.carryable&&Math.abs(prop.x-item.x)<=M.constants.propReach+8&&Math.abs(prop.laneY-item.laneY)<=55),
          'L floor pickup cannot be shadowed by a carryable prop: '+item.id);
        if(zone.index<=3)assert(!M.weapons[item.weaponKind].projectile,'guns belong to the later half of the city');
        const key=zone.id+':'+item.id;if(!positions.has(key))positions.set(key,new Set());positions.get(key).add(item.x+':'+item.laneY);
      }
      const drops=layout.propWeapons.filter(item=>M.props.find(prop=>prop.id===item.propId)?.zoneId===zone.id);
      assert(drops.some(item=>{const prop=M.props.find(prop=>prop.id===item.propId);return prop.carryable||prop.kind==='stall';}));
      for(const item of drops){const prop=M.props.find(prop=>prop.id===item.propId);assert(prop.maxHp>0&&prop.targetable);
        assert(M.weapons[item.weaponKind]);if(zone.index<=3)assert(!M.weapons[item.weaponKind].projectile);
        if(!rewards.has(prop.id))rewards.set(prop.id,new Set());rewards.get(prop.id).add(item.weaponKind);}
    }
    const tutorial=layout.pickups.find(item=>item.id==='street-weapon-pipe');assert.deepEqual(plain(tutorial),{
      id:'street-weapon-pipe',kind:'weapon',weaponKind:'pipe',charges:14,zoneId:'service-alley',x:300,laneY:880,source:'street-cache'});
  }
  assert.equal(signatures.size,64);assert([...positions].filter(([key])=>!key.endsWith('street-weapon-pipe')).every(([,values])=>values.size>20));
  assert([...rewards.values()].every(values=>values.size>1));
});
check('the real first Pipe equips by L and retry restores the same chapter roll with finite charges',()=>{
  for(const seed of [0,42]){
    const r=rig(seed),pipe=r.view().pickups.find(item=>item.weaponKind==='pipe');equip(r,pipe);
    assert.equal(r.view().player.weapon.kind,'pipe');assert.equal(r.view().player.weapon.charges,14);
    r.step(press('strike'));r.until(s=>!s.player.attack);assert.equal(r.view().player.weapon.charges,13);
    r.game.retry();assert.equal(r.view().lootSeed,seed);assert.equal(r.view().player.weapon,null);
    assert.equal(r.view().pickups.filter(item=>item.id===pipe.id).length,1);
    assert.deepEqual(plain(r.view().pickups),plain(M.lootLayout(seed).pickups.filter(item=>item.zoneId==='service-alley')));
  }
});
check('an earned six-district route equips all floor caches and all ten actual prop rewards once',()=>{
  const seed=42,r=rig(seed),layout=plain(M.lootLayout(seed)),districts=[];
  for(const zone of M.zones){
    r.until(s=>s.zone.id===zone.id&&s.zone.cleared||s.status==='defeated',s=>fight(r,s),650000);
    assert.notEqual(r.view().status,'defeated','real fighting must reach '+zone.name);
    for(const reward of layout.propWeapons.filter(item=>M.props.find(prop=>prop.id===item.propId).zoneId===zone.id)){
      const prop=r.view().props.find(item=>item.id===reward.propId);if(!prop.broken)smash(r,prop);
      const breaks=r.events.filter(event=>event.type==='prop-break'&&event.id===prop.id);assert.equal(breaks.length,1);
      const event=breaks[0];assert.equal(event.weaponKind,reward.weaponKind);assert.equal(event.weaponPickupId,prop.id+'-weapon');
      const item=r.view().pickups.find(item=>item.id===event.weaponPickupId);
      if(!r.equippedIds.has(event.weaponPickupId)){assert(item,'actual broken object emits its admitted weapon');
        assert.equal(item.source,'prop');assert.equal(item.sourceId,prop.id);assert.equal(item.charges,M.weapons[reward.weaponKind].charges);equip(r,item);}
      assert.equal(r.events.filter(event=>event.type==='weapon-equipped'&&event.id===prop.id+'-weapon').length,1);
    }
    for(const floor of layout.pickups.filter(item=>item.zoneId===zone.id))if(!r.equippedIds.has(floor.id)){
      const item=r.view().pickups.find(item=>item.id===floor.id);assert(item);equip(r,item);}
    const ids=r.view().pickups.map(item=>item.id);assert.equal(new Set(ids).size,ids.length);assert(r.view().pickups.length<=M.constants.maxPickups);
    districts.push({id:zone.id,floorIds:layout.pickups.filter(item=>item.zoneId===zone.id).map(item=>item.id),
      rewards:layout.propWeapons.filter(item=>M.props.find(prop=>prop.id===item.propId).zoneId===zone.id)});
    if(zone.index<M.zones.length)r.until(s=>s.zone.index===zone.index+1,{move_x:1},20000);
  }
  assert.equal(r.view().kills,30);assert.equal(r.view().city.completedWaves,12);assert.equal(r.view().city.clearedZones.length,6);
  for(const item of layout.pickups)assert.equal(r.events.filter(event=>event.type==='weapon-equipped'&&event.id===item.id).length,1);
  receipt.route={seed,status:r.view().status,kills:r.view().kills,completedWaves:r.view().city.completedWaves,districts,
    floorEquipped:layout.pickups.length,propRewardsEquipped:layout.propWeapons.length,elapsedMs:r.view().elapsedMs};
});
const outputIndex=process.argv.indexOf('--receipt-out');if(outputIndex>=0){assert(process.argv[outputIndex+1]);
  fs.writeFileSync(path.resolve(process.argv[outputIndex+1]),JSON.stringify(receipt,null,2)+'\n');}
console.log('Mac street loot: '+receipt.checks.length+' groups passed.');
console.log(JSON.stringify(receipt.route));
