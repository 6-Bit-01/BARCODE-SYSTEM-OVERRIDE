#!/usr/bin/env node
// Production core, public input only. No fixture writes to HP, world positions,
// clocks, inventory or checkpoints; the long route earns every district/weapon.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const forbidden=()=>{throw Error('Combat must not create a browser owner');};
const sandbox={window:{BARCODE:{}},document:{addEventListener:forbidden,createElement:forbidden},
  requestAnimationFrame:forbidden,setTimeout:forbidden,setInterval:forbidden,Audio:forbidden,AudioContext:forbidden};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../src/game/mac-street-combat.js'),'utf8'),sandbox);
const M=sandbox.window.BARCODE.MacStreetCombat,plain=x=>JSON.parse(JSON.stringify(x));
const press=name=>({[name]:{pressed:true,held:true}});let groups=0;
function check(name,body){body();groups++;console.log('PASS '+name);}
function rig(hz=60){const game=M.create(),events=[],dt=1000/hz;
  const r={game,events,view:()=>game.getSnapshot(),step(input={},delta=dt){const s=game.update(delta,input);events.push(...game.drainEvents());return s;},
    run(ms,input={}){for(let n=0;n<Math.ceil(ms/dt);n++)r.step(input);return r.view();},
    until(test,input={},limit=20000){for(let n=0;n<Math.ceil(limit/dt);n++){const s=r.view();if(test(s))return s;r.step(typeof input==='function'?input(s):input);}
      throw Error('Public-input route timed out: '+JSON.stringify({player:r.view().player,zone:r.view().zone,foes:r.view().enemies.map(e=>({id:e.id,hp:e.hp,phase:e.phase}))}));}};return r;}
function nearEnemy(r){r.until(s=>s.enemies[0].phase==='windup',{move_x:1});
  r.until(()=>r.game.getControlState().throw.ready&&r.game.getControlState().throw.targetType==='enemy',{move_x:1},500);r.step();}
function walkTo(r,x,y=880){r.until(s=>Math.abs(s.player.x-x)<6&&Math.abs(s.player.laneY-y)<6,s=>({
  move_x:Math.abs(s.player.x-x)>5?Math.sign(x-s.player.x):0,move_y:Math.abs(s.player.laneY-y)>5?Math.sign(y-s.player.laneY):0}),25000);r.step();}
check('double tap runs at429; guard creeps57.2 and input release removes run history',()=>{
  const r=rig(120);r.run(50,{move_x:1});r.step();r.step({move_x:1});assert(r.view().player.running);
  const x=r.view().player.x;r.run(150,{move_x:1});assert(Math.abs(r.view().player.x-x-429*.15)<.01);
  const gx=r.view().player.x;r.run(150,{move_x:1,guard:{held:true}});assert(!r.view().player.running);
  assert(Math.abs(r.view().player.x-gx-57.2*.15)<.01);assert.equal(r.view().player.animation.action,'guard-creep');
  r.game.releaseInputs('pause');r.run(150);assert.equal(r.view().player.guarding,false);assert.equal(r.view().player.running,false);
  r.step({move_x:1});assert(!r.view().player.running,'paused held direction is not a hidden second tap');
  r.game.releaseInputs();r.step({move_x:1,run:{held:true}});assert(r.view().player.running,'outer mobile stick uses same simulation movement');
  const buffered=rig(120);buffered.game.handleInput({move_x:1});buffered.game.handleInput({});buffered.game.handleInput({move_x:1});
  buffered.game.update(M.constants.stepMs);assert(buffered.view().player.running,'two real tap edges survive a sub-step/hit-pause buffer');
  buffered.game.releaseInputs();buffered.step({move_y:1,run:{held:true}});assert(buffered.view().player.running,'outer mobile stick also runs in depth');
});
check('floor weapon equips by L and shared Strike spends a finite melee charge',()=>{
  const r=rig();walkTo(r,260);assert.equal(r.game.getControlState().throw.targetType,'weapon');r.step(press('throw'));
  assert.equal(r.view().player.weapon.kind,'pipe');assert.equal(r.view().player.weapon.charges,14);assert(!r.view().player.grapple);
  r.step();r.step(press('strike'));assert.equal(r.view().player.attack.kind,'pipe');assert.equal(r.view().player.animation.action,'weapon-melee');
  r.run(450,{strike:{held:true}});assert.equal(r.view().player.weapon.charges,13);assert.equal(r.events.filter(e=>e.type==='strike').length,1);
  r.game.releaseInputs('pause');assert(!r.view().player.attack);assert.equal(r.view().player.weapon.charges,13);
});
check('armed running Strike kicks before its weapon while charges and inventory stay intact',()=>{
  const r=rig();walkTo(r,260);r.step(press('throw'));r.step({move_x:1,run:{held:true}});
  assert.equal(r.game.getControlState().strike.label,'Run Kick');const weapon=plain(r.view().player.weapon);
  r.step({move_x:1,run:{held:true},...press('strike')});assert.equal(r.view().player.attack.kind,'running-kick');
  assert.equal(r.view().player.attack.weaponKind,null);r.run(700,{strike:{held:true}});
  assert.deepEqual(plain(r.view().player.weapon),weapon);assert(!r.events.some(e=>e.type==='weapon-used'||e.type==='weapon-fired'));
  assert.equal(r.events.filter(e=>e.type==='running-kick').length,1);
  r.game.releaseInputs('pause');r.step(press('strike'));assert.equal(r.view().player.attack.kind,'pipe');
});
check('guard preserves an armed weapon; real hurt drops and L recovers its remaining charges',()=>{
  const r=rig();walkTo(r,260);r.step(press('throw'));r.step();r.step(press('strike'));r.run(450);
  assert.equal(r.view().player.weapon.charges,13);r.until(s=>s.enemies[0].phase==='windup',{move_x:1});r.run(800,{guard:{held:true}});
  assert.equal(r.view().player.weapon.kind,'pipe');assert.equal(r.view().player.hp,100);assert(!r.events.some(e=>e.type==='weapon-dropped'));
  r.until(s=>s.player.hp<100,{},5000);assert.equal(r.view().player.weapon,null);
  const drop=r.events.find(e=>e.type==='weapon-dropped'&&e.reason==='hit');assert(drop);assert.equal(drop.charges,13);
  assert.equal(r.view().pickups.filter(p=>p.id===drop.id).length,1);
  r.until(s=>s.player.weapon?.kind==='pipe',s=>{
    if(s.player.grapple||s.player.throwMs||s.player.hurtMs)return {};
    if(r.game.getControlState().throw.ready)return press('throw');
    return {move_x:Math.abs(s.player.x-drop.x)>10?Math.sign(drop.x-s.player.x):0,
      move_y:Math.abs(s.player.laneY-drop.laneY)>8?Math.sign(drop.laneY-s.player.laneY):0};},8000);
  assert.equal(r.view().player.weapon.charges,13);assert(!r.view().pickups.some(p=>p.id===drop.id));
  const cp=r.view().checkpoint;r.game.retry();assert.deepEqual(plain(r.view().player.weapon),plain(cp.weapon));
  const ids=r.view().pickups.map(p=>p.id);assert.equal(new Set(ids).size,ids.length);assert(!ids.includes(drop.id));
});
check('L genuinely holds an enemy, walks slowly, then commits a throw only after release',()=>{
  const r=rig();nearEnemy(r);const hp=r.view().enemies[0].hp;r.step(press('throw'));
  assert.equal(r.view().player.animation.action,'grab-hold');assert.equal(r.view().player.grapple.phase,'hold');
  const x=r.view().player.x;r.run(500,{move_x:1,throw:{held:true}});assert(r.view().player.x>x+30&&r.view().player.x<x+80);
  assert.equal(r.view().enemies[0].hp,hp);assert(!r.view().player.grapple.released);assert.equal(r.game.getControlState().strike.label,'Pummel');
  r.step();assert(r.view().player.grapple.released);assert(r.view().player.grapple.releaseAgeMs<20);assert.equal(r.view().enemies[0].hp,hp);
  r.until(()=>r.events.some(e=>e.type==='throw-release'),{},300);assert.equal(r.view().enemies[0].hp,hp-28);assert(r.view().enemies[0].launched);
});
check('enemy strength timeout is <=3s and one uninterrupted L hold cannot regrab',()=>{
  const r=rig();nearEnemy(r);r.step(press('throw'));const g=r.view().player.grapple;
  assert(g.maxHoldMs>=1000&&g.maxHoldMs<=3000);r.run(4200,{throw:{held:true},move_y:-1});
  assert.equal(r.events.filter(e=>e.type==='grab-start').length,1);assert(r.events.some(e=>e.type==='grab-end'&&e.reason==='strength-limit'),JSON.stringify(r.events.filter(e=>/grab|player-hit/.test(e.type))));
  assert(!r.view().player.grapple);assert(r.events.filter(e=>e.type==='throw-release').length<=1,'a later enemy hit can interrupt release; it cannot repeat the held activation');
});
check('another enemy hitting Mac breaks the held enemy grip without a free throw',()=>{
  const r=rig();nearEnemy(r);r.step(press('throw'));r.until(s=>s.player.hp<100,{throw:{held:true}},4000);
  assert(!r.view().player.grapple);assert.equal(r.view().enemies[0].grappledBy,null);
  assert(r.events.some(e=>e.type==='grab-end'&&e.reason==='hit'));assert(!r.events.some(e=>e.type==='throw-release'));
});
check('held Strike pummels in real attack phases for <=1s total per grab',()=>{
  const r=rig();nearEnemy(r);r.step(press('throw'));r.step({throw:{held:true},...press('strike')});
  assert.equal(r.view().player.attack.kind,'pummel');assert.deepEqual(plain(r.view().player.attack.timing),{windupMs:75,activeMs:65,recoveryMs:105});
  r.run(1600,{throw:{held:true},strike:{held:true}});const p=r.view().player;
  assert(p.grapple);assert(p.grapple.pummelUsedMs<=1000);assert(p.grapple.pummelUsedMs>=975);assert(!p.attack);
  const hits=r.events.filter(e=>e.type==='enemy-hit'&&e.cause==='pummel');assert.equal(hits.length,4);assert(hits.every(e=>e.damage===6));
  r.game.releaseInputs('pause');assert(!r.view().player.grapple);assert(!r.view().player.attack);
  assert.equal(r.view().enemies[0].grappledBy,null);assert(!r.events.some(e=>e.type==='throw-release'));
});
function routeInput(r,s){const p=s.player,controls=r.game.getControlState(),input={};
  if(p.grapple||p.carry)return {};// Release L; never rely on an automatic throw.
  const foe=s.enemies.filter(e=>e.hp&&e.phase!=='dormant').sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  const wanted=s.pickups.filter(item=>item.kind==='weapon'&&!r.equipped.has(item.weaponKind))
    .sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
  if(wanted&&(!foe||Math.abs(wanted.x-p.x)<160)){
    if(controls.throw.ready&&controls.throw.targetType==='weapon'&&controls.throw.targetId===wanted.id)input.throw={pressed:true,held:true};
    else{input.move_x=Math.abs(wanted.x-p.x)>12?Math.sign(wanted.x-p.x):0;input.move_y=Math.abs(wanted.laneY-p.laneY)>8?Math.sign(wanted.laneY-p.laneY):0;}
    // A nearby attacker still gets fought rather than chasing loot through it.
    if(!foe||Math.abs(foe.x-p.x)>105)return input;
  }
  if(p.weapon&&!r.used.has(p.weapon.kind)&&controls.strike.ready){input.strike={pressed:true,held:true};return input;}
  if(!foe)return {move_x:1};
  const dx=foe.x-p.x,direction=Math.sign(dx)||p.facing;
  input.move_x=Math.abs(dx)>58||p.facing!==direction?direction:0;input.move_y=Math.abs(foe.laneY-p.laneY)>8?Math.sign(foe.laneY-p.laneY):0;
  const incoming=s.projectiles.find(item=>item.owner!=='player'&&(item.x-p.x)*item.facing<0&&Math.abs(item.x-p.x)<145&&Math.abs(item.laneY-p.laneY)<=item.laneReach+10);
  const warning=s.enemies.filter(e=>e.hp&&e.phase==='windup'&&Math.abs(e.attackLaneY-p.laneY)<45&&Math.abs(e.x-p.x)<330)
    .sort((a,b)=>(a.tellMs-a.phaseMs)-(b.tellMs-b.phaseMs))[0];
  const remain=warning?warning.tellMs-warning.phaseMs:Infinity;
  // The Regent keeps its existing armor during tells/attacks. Fight its actual
  // commitments and remaining bolts, rather than trying to stun-lock it with a gun.
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
  if(warning&&remain<(warning.kind==='null_regent'?650:310)&&(warning.kind==='null_regent'||!p.attack&&!p.throwMs)){input.move_x=0;
    if(warning.attackTell.guardable===false&&remain<250&&controls.jump.ready)input.jump={pressed:true,held:true};
    else if(warning.attackTell.guardable!==false&&remain<105)input.guard={held:true};
    else if(warning.attackTell.guardable===false&&!p.elevation)input.move_y=p.laneY>875?-1:1;return input;}
  if(controls.throw.ready&&controls.throw.targetType==='enemy'&&!r.lastThrow)input.throw={pressed:true,held:true};
  else if(controls.strike.ready&&!r.lastStrike&&Math.abs(dx)<(p.weapon?M.weapons[p.weapon.kind].reach:100)&&Math.abs(foe.laneY-p.laneY)<35)input.strike={pressed:true,held:true};
  r.lastThrow=!!input.throw;r.lastStrike=!!input.strike;return input;
}
let route;
check('all8 weapons are earned/equipped/fired through all6 districts with30 real defeats',()=>{
  const r=rig();r.equipped=new Set();r.used=new Set();
  r.until(s=>s.desk.unlocked||s.status==='defeated',s=>{
    for(const e of r.events){if(e.type==='weapon-equipped')r.equipped.add(e.kind);if(e.type==='strike'&&e.weaponKind)r.used.add(e.weaponKind);}
    return routeInput(r,s);},650000);
  for(const e of r.events){if(e.type==='weapon-equipped')r.equipped.add(e.kind);if(e.type==='strike'&&e.weaponKind)r.used.add(e.weaponKind);}
  assert.equal(r.view().status,'desk-ready',JSON.stringify({zone:r.view().zone.index,kills:r.view().kills,lastHits:r.events.filter(e=>e.type==='player-hit').slice(-4)}));assert.equal(r.view().kills,30);assert.equal(r.view().city.completedWaves,12);assert.equal(r.view().city.clearedZones.length,6);
  assert.deepEqual([...r.equipped].sort(),Object.keys(M.weapons).sort());assert.deepEqual([...r.used].sort(),Object.keys(M.weapons).sort());
  const weaponContacts=new Set(r.events.filter(e=>e.type==='enemy-hit'&&M.weapons[e.cause]).map(e=>e.cause));
  assert.deepEqual([...weaponContacts].sort(),Object.keys(M.weapons).sort(),'every earned weapon also lands actual damage, not just a display pose');
  assert(r.events.some(e=>e.type==='shield-broken'&&e.cause==='crowbar'),'crowbar actually defeats a shield');
  assert(r.events.some(e=>e.type==='enemy-hit'&&e.cause==='shock-baton'&&e.stunMs>=650),'baton applies a longer electric stun');
  assert(r.events.some(e=>e.type==='launch'&&e.cause==='gravity-hammer'),'heavy hammer launches a real opponent');
  const shots=r.events.filter(e=>e.type==='weapon-fired');assert(new Set(shots.map(e=>e.projectile)).size===3);
  assert(shots.some(e=>e.projectile==='scatter-bolt'));assert(shots.some(e=>e.projectile==='coil-bolt'));assert(shots.some(e=>e.projectile==='plasma-disc'));
  route=r;
});
check('world props are human scale and only explicit street surfaces are targetable',()=>{
  assert.equal(new Set(M.props.map(p=>p.zoneId)).size,6);const cars=M.props.filter(p=>p.kind==='car');assert.equal(cars.length,4);
  assert(cars.every(p=>p.width===(p.variant==='van'?790:680)&&p.height===(p.variant==='van'?284.083095:209.074627)&&!p.carryable));assert(cars.some(p=>p.variant==='van'));
  const native=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/mac-street-power/mac-street-power-v1.json'),'utf8'));
  const measurements=[...native.scaleMeasurements.props,...native.scaleMeasurements.cars];
  for(const prop of M.props) {
    const kind=prop.kind==='car'&&prop.variant==='van'?'car_van':['terminal','streetlight'].includes(prop.kind)?'fixture_'+prop.kind:prop.kind;
    const measurement=measurements.find(m=>m.kind===kind);assert(measurement,'every physical prop has a native solid measurement: '+kind);
    assert.equal(prop.width,measurement.visibleWidth);assert.equal(prop.height,measurement.visibleHeight);
  }
  assert.equal(native.sheets.find(s=>s.id==='cars').sourceImage,'assets/mac-street-power/street-cars-side-v2.png');
  assert(!cars.some(p=>/rooftop|transit/.test(p.zoneId)));assert(M.props.filter(p=>p.placement==='street-fixture').every(p=>p.laneY>=780&&p.laneY<=970&&p.targetable));
  const changed=route.events.filter(e=>e.type==='prop-hit');assert(changed.length>0);assert(changed.every(e=>M.props.some(p=>p.id===e.id&&p.targetable)));
});
check('calibrated long rifle muzzle still hits a point-blank opponent in its first sweep',()=>{
  const native=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/mac-street-power/mac-street-power-v1.json'),'utf8'));
  const poses=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/mac-street-dynamic/mac-modem-actions-v1.json'),'utf8'));
  const origins={};
  for(const kind of ['scatter-blaster','coil-rifle','plasma-disc']) {
    const owned=poses.clips['weapon_'+kind+'.active'],clip=owned||poses.clips['fire.active'];
    const frame=poses.frames.find(f=>f.id===clip.frames[0].frame);
    const sheet=poses.sheets.find(s=>s.id===frame.sheet),bodyScale=260/sheet.pixelScale.standingVisibleHeight;
    let forward,elevation;
    if(owned) {
      assert.equal(clip.frames.length,1);assert.equal(frame.embeddedWeapon,kind);assert(frame.shotAnchor);
      forward=(frame.shotAnchor.x-frame.feetPivot.x)*bodyScale;
      elevation=(frame.feetPivot.y-frame.shotAnchor.y)*bodyScale+frame.baselineLift;
    } else {
      const binding=frame.itemBindings[kind],cell=native.cells['weapon_'+kind];assert(binding&&cell);
      forward=(binding.gripAnchor.x-frame.feetPivot.x)*bodyScale;
      elevation=(frame.feetPivot.y-binding.gripAnchor.y)*bodyScale;
      if(cell.muzzle) {
        const itemScale=cell.displayHeight/cell.source.height,angle=binding.weaponAngle;
        const dx=(cell.muzzle.x-cell.grip.x)*itemScale,dy=(cell.muzzle.y-cell.grip.y)*itemScale;
        forward+=dx*Math.cos(angle)-dy*Math.sin(angle);
        elevation-=dx*Math.sin(angle)+dy*Math.cos(angle);
      }
    }
    origins[kind]={forward,elevation};
    assert(Math.abs(M.weapons[kind].muzzleForward-forward)<=.0005,kind+' muzzle matches its selected native origin');
    assert(Math.abs(M.weapons[kind].muzzleElevation-elevation)<=.0005,kind+' muzzle matches its selected native height');
  }
  const r=rig();r.equipped=new Set();r.used=new Set();
  r.until(s=>s.player.weapon?.kind==='coil-rifle'||s.status==='defeated',s=>{
    for(const e of r.events){if(e.type==='weapon-equipped')r.equipped.add(e.kind);if(e.type==='strike'&&e.weaponKind)r.used.add(e.weaponKind);}
    return routeInput(r,s);},450000);assert.notEqual(r.view().status,'defeated');
  // Keep the public-input opponent comfortably inside the selected native muzzle,
  // including movement during the rifle's actual windup; the old110/80 setup
  // could hit beyond the new shorter barrel and never exercise its close sweep.
  const closeRange=origins['coil-rifle'].forward*.55,walkRange=closeRange*.65;
  r.until(s=>!s.player.hurtMs&&s.enemies.some(e=>e.hp&&e.phase==='windup'&&Math.abs(e.x-s.player.x)<closeRange&&Math.abs(e.laneY-s.player.laneY)<30),s=>{
    const foe=s.enemies.filter(e=>e.hp).sort((a,b)=>Math.abs(a.x-s.player.x)-Math.abs(b.x-s.player.x))[0];
    // Close at ordinary walking speed. A permanent guard during approach
    // invites the guard's genuine overhead response and takes an avoidable hit
    // before this rifle fixture can reach its calibrated point-blank sample.
    // Respect the locked response once a real guardable attack is announced.
    return {move_x:Math.abs(foe.x-s.player.x)>walkRange?Math.sign(foe.x-s.player.x):0,
      move_y:Math.abs(foe.laneY-s.player.laneY)>8?Math.sign(foe.laneY-s.player.laneY):0,
      guard:{held:['windup','active'].includes(foe.phase)&&foe.attackSpec.guardable!==false}};
  },15000);
  assert.equal(r.view().player.weapon.kind,'coil-rifle');r.step(press('strike'));
  const eventStart=r.events.length;r.until(()=>r.events.slice(eventStart).some(e=>e.type==='weapon-fired'),{},1000);
  const shot=r.events.slice(eventStart).find(e=>e.type==='weapon-fired'),hit=r.events.slice(eventStart).find(e=>e.type==='enemy-hit'&&e.cause==='coil-rifle');
  assert(shot&&hit);assert.equal(hit.atMs,shot.atMs,'first physical sweep includes chest-to-muzzle segment');
  assert((hit.x-shot.x)*shot.facing>0&&(hit.x-shot.muzzleX)*shot.facing<0,'contact really was closer than the drawn barrel tip');
  assert.equal(shot.elevation,Number(origins['coil-rifle'].elevation.toFixed(9)));
  assert(Math.abs((shot.muzzleX-shot.x)*shot.facing-origins['coil-rifle'].forward)<.001);
});
let street;
check('a box carries beyond3s, pause drops safely, and a real throw hits a car once',()=>{
  const r=street=rig();r.equipped=new Set(Object.keys(M.weapons));r.used=new Set(Object.keys(M.weapons));
  // Fight along the upper lane to preserve the lower exit crate for this
  // carry/throw fixture. The actual crowd's launched bodies can now destroy
  // both central boxes during the ordinary route; that is valid combat.
  r.until(s=>s.zone.state==='zone-clear'||s.status==='defeated',s=>({...routeInput(r,s),
    move_y:s.player.laneY>M.constants.laneMin+3?-1:0}),100000);assert.notEqual(r.view().status,'defeated');
  const crate=r.view().props.find(p=>p.carryable&&!p.broken);assert(crate,'earned first street has a usable prop');walkTo(r,crate.x,crate.laneY);
  r.until(()=>r.game.getControlState().throw.ready&&r.game.getControlState().throw.targetType==='prop');r.step(press('throw'));
  assert(r.view().player.carry);assert.equal(r.view().player.carry.maxHoldMs,null);assert.equal(r.view().props.find(p=>p.id===crate.id).heldBy,'mac');
  const x=r.view().player.x;r.run(1000,{move_x:1,throw:{held:true}});assert(Math.abs(r.view().player.x-x-156)<.05);
  r.run(5200,{throw:{held:true}});assert(r.view().player.carry.elapsedMs>6000);assert(!r.view().player.carry.released);
  r.game.releaseInputs('pause');assert(!r.view().player.carry);assert.equal(r.view().props.find(p=>p.id===crate.id).heldBy,null);
  assert(!r.events.some(e=>e.type==='prop-throw'));r.step(press('throw'));assert(r.view().player.carry);
  const car=r.view().props.find(p=>p.kind==='car');assert(!car.broken);
  r.until(s=>Math.abs(s.player.x-(car.x-350))<6&&Math.abs(s.player.laneY-car.laneY)<6,s=>({throw:{held:true},
    move_x:Math.abs(s.player.x-(car.x-350))>5?Math.sign(car.x-350-s.player.x):0,
    move_y:Math.abs(s.player.laneY-car.laneY)>5?Math.sign(car.laneY-s.player.laneY):0}),25000);
  r.step({move_x:1,throw:{held:true}});r.step();r.until(()=>r.events.some(e=>e.type==='prop-throw'),{},300);
  const thrown=r.view().props.find(p=>p.id===crate.id);assert(thrown.launched&&thrown.elevation>0);
  r.until(s=>s.props.find(p=>p.id===crate.id).broken,{},2000);
  const collisions=r.events.filter(e=>e.type==='body-impact'&&e.id===crate.id&&e.targetId===car.id);
  assert.equal(collisions.length,1);assert.equal(collisions[0].damage,40);assert.equal(r.view().props.find(p=>p.id===car.id).hp,car.hp-40);
});
check('several normal car hits restart a bounded floor-anchored bounce then settle cleanly',()=>{
  const r=street,car=r.view().props.find(p=>p.kind==='car');assert(car.maxHp>=240&&car.hp>100);
  walkTo(r,car.x-145,car.laneY);r.until(s=>!s.player.attack);const initialHits=r.events.filter(e=>e.type==='prop-hit'&&e.id===car.id).length;
  r.step(press('strike'));r.until(()=>r.events.filter(e=>e.type==='prop-hit'&&e.id===car.id).length>initialHits,{},600);
  const first=r.view().props.find(p=>p.id===car.id);assert(!first.broken&&first.recoil);assert.equal(first.hp,car.hp-12);
  const paused=plain(first);r.game.update(0);assert.deepEqual(plain(r.view().props.find(p=>p.id===car.id)),paused);
  const oldAge=first.recoil.ageMs;r.run(50);const moving=r.view().props.find(p=>p.id===car.id);
  assert(moving.recoil.ageMs>oldAge&&moving.recoil.elevation>0);assert.equal(moving.x,car.x);assert.equal(moving.laneY,car.laneY);
  r.until(s=>s.player.attack?.phase==='recovery');r.step(press('strike'));
  r.until(()=>r.events.filter(e=>e.type==='prop-hit'&&e.id===car.id).length>initialHits+1,{},600);
  const second=r.view().props.find(p=>p.id===car.id);assert(second.recoil.ageMs<30);assert.equal(second.hp,car.hp-26);assert(!second.broken);
  for(let n=0;n<70;n++) {r.step();const p=r.view().props.find(p=>p.id===car.id);
    assert.equal(p.x,car.x);assert.equal(p.laneY,car.laneY);
    if(p.recoil){assert(p.recoil.remainingMs<=420&&p.recoil.strength<=1);assert(Math.abs(p.recoil.x)<=M.constants.carRecoilX);
      assert(p.recoil.elevation<=M.constants.carBounceHeight&&p.recoil.elevation>=0);assert(Math.abs(p.recoil.rotation)<=M.constants.carRecoilRotation);}}
  assert.equal(r.view().props.find(p=>p.id===car.id).recoil,null);assert(!r.events.some(e=>e.type==='prop-break'&&e.id===car.id));
  assert(M.weapons['gravity-hammer'].propDamage>M.weapons.crowbar.propDamage&&M.weapons.crowbar.propDamage>M.weapons.pipe.propDamage);
});
check('real pipe and crowbar contacts damage sturdy cars differently without changing enemy damage',()=>{
  const r=rig();r.equipped=new Set(Object.keys(M.weapons));r.used=new Set(Object.keys(M.weapons));
  r.until(s=>s.zone.state==='zone-clear'||s.status==='defeated',s=>routeInput(r,s),100000);assert.notEqual(r.view().status,'defeated');
  const car=r.view().props.find(p=>p.kind==='car'),initialHp=car.hp;
  for(const [kind,damage] of [['pipe',24],['crowbar',38]]) {
    const item=r.view().pickups.find(p=>p.kind==='weapon'&&p.weaponKind===kind);assert(item);
    walkTo(r,item.x,item.laneY);r.step(press('throw'));r.step();assert.equal(r.view().player.weapon.kind,kind);
    walkTo(r,car.x-145,car.laneY);r.until(s=>!s.player.attack);const before=r.view().props.find(p=>p.id===car.id).hp;
    const eventStart=r.events.length;r.step(press('strike'));r.until(()=>r.events.slice(eventStart).some(e=>e.type==='prop-hit'&&e.id===car.id));
    const event=r.events.slice(eventStart).find(e=>e.type==='prop-hit'&&e.id===car.id);
    assert.equal(event.cause,kind);assert.equal(event.damage,damage);assert.equal(r.view().props.find(p=>p.id===car.id).hp,before-damage);
    r.until(s=>!s.player.attack);
  }
  assert.equal(r.view().props.find(p=>p.id===car.id).hp,initialHp-62);assert(!r.view().props.find(p=>p.id===car.id).broken);
  assert.equal(M.weapons.pipe.damage,17);assert.equal(M.weapons.crowbar.damage,21);
});
check('wrecked car drops a real weapon and Barrier; street fixture grants timed Overdrive',()=>{
  const r=street,car=r.view().props.find(p=>p.kind==='car');walkTo(r,car.x-145,car.laneY);
  r.until(s=>s.props.find(p=>p.id===car.id).broken,s=>r.game.getControlState().strike.ready&&!s.player.attack?press('strike'):{},15000);
  assert(r.events.some(e=>e.type==='prop-break'&&e.id===car.id&&e.cause==='strike'));assert(r.view().pickups.some(p=>p.kind==='weapon'&&p.id===car.id+'-weapon'));
  assert.equal(r.events.filter(e=>e.type==='prop-break'&&e.id===car.id).length,1);assert.equal(r.view().props.find(p=>p.id===car.id).recoil,null);
  const loot=r.view().pickups.filter(p=>p.id.startsWith(car.id+'-'));r.step(press('strike'));r.run(600);
  assert.equal(r.events.filter(e=>e.type==='prop-break'&&e.id===car.id).length,1);assert.deepEqual(plain(r.view().pickups.filter(p=>p.id.startsWith(car.id+'-'))),plain(loot));
  r.until(s=>!s.player.attack);walkTo(r,car.x,car.laneY);assert.equal(r.view().player.powerups.barrierCharges,3);assert(r.view().player.powerups.barrierMs>0);
  const fixture=r.view().props.find(p=>p.kind==='streetlight');walkTo(r,fixture.x-95,fixture.laneY);
  r.until(s=>s.props.find(p=>p.id===fixture.id).broken,s=>r.game.getControlState().strike.ready&&!s.player.attack?press('strike'):{},15000);
  r.until(s=>!s.player.attack);walkTo(r,fixture.x,fixture.laneY);assert(r.view().player.powerups.overdriveMs>0);
  r.step(press('strike'));assert.equal(r.view().player.attack.timing.windupMs,67.5);assert.equal(r.view().player.attack.timing.recoveryMs,116.25);
  r.run(10500);assert.equal(r.view().player.powerups.overdriveMs,0);assert(r.events.some(e=>e.type==='powerup-expired'&&e.kind==='overdrive'));
});
check('Barrier blocks actual enemy damage; collected Impact is consumed by one existing air kick',()=>{
  const r=rig();r.equipped=new Set(Object.keys(M.weapons));r.used=new Set(Object.keys(M.weapons));
  r.until(s=>s.zone.state==='zone-clear',s=>routeInput(r,s),100000);
  const car=r.view().props.find(p=>p.kind==='car');walkTo(r,car.x-145,car.laneY);
  r.until(s=>s.props.find(p=>p.id===car.id).broken,s=>r.game.getControlState().strike.ready&&!s.player.attack?press('strike'):{},15000);
  r.until(s=>!s.player.attack);walkTo(r,car.x,car.laneY);assert.equal(r.view().player.powerups.barrierCharges,3);
  const hp=r.view().player.hp;
  r.until(s=>s.zone.index===2,{move_x:1,run:{held:true}},10000);
  r.until(()=>r.events.some(e=>e.type==='barrier-block'),s=>({move_x:s.enemies.some(e=>e.hp&&Math.abs(e.x-s.player.x)<150)?0:1}),6000);
  assert.equal(r.view().player.hp,hp);assert.equal(r.view().player.powerups.barrierCharges,2);
  r.until(s=>s.zone.index===2&&s.zone.state==='zone-clear'||s.status==='defeated',s=>routeInput(r,s),100000);assert.notEqual(r.view().status,'defeated');
  const marketCar=r.view().props.find(p=>p.kind==='car');walkTo(r,marketCar.x-145,marketCar.laneY);
  r.until(s=>s.props.find(p=>p.id===marketCar.id).broken,s=>r.game.getControlState().strike.ready&&!s.player.attack?press('strike'):{},15000);
  r.until(s=>!s.player.attack);walkTo(r,marketCar.x,marketCar.laneY);assert(r.view().player.powerups.impactMs>0);
  r.until(s=>s.zone.index===3,{move_x:1,run:{held:true}},6000);
  r.until(s=>s.enemies.some(e=>e.hp&&Math.abs(e.x-s.player.x)<110&&Math.abs(e.laneY-s.player.laneY)<40),s=>{
    const foe=s.enemies.filter(e=>e.hp).sort((a,b)=>Math.abs(a.x-s.player.x)-Math.abs(b.x-s.player.x))[0];return {
      move_x:Math.abs(foe.x-s.player.x)>80?Math.sign(foe.x-s.player.x):0,move_y:Math.abs(foe.laneY-s.player.laneY)>8?Math.sign(foe.laneY-s.player.laneY):0};},6000);
  r.step({...press('jump'),...press('strike')});r.until(()=>r.events.some(e=>e.type==='impact-pulse'),{},1000);
  assert.equal(r.view().player.powerups.impactMs,0);assert.equal(r.events.filter(e=>e.type==='impact-pulse').length,1);
  assert(r.events.some(e=>e.type==='enemy-hit'&&e.cause==='impact-pulse'&&e.heavy));assert(r.events.some(e=>e.type==='launch'&&e.cause==='impact-pulse'));
  r.run(1000);assert.equal(r.events.filter(e=>e.type==='impact-pulse').length,1);
});
check('checkpoint retry removes transients and restores earned world/inventory consistently',()=>{
  const cp=route.view().checkpoint,expected=plain(cp.props);route.game.retry();const s=route.view();
  assert.deepEqual(plain(s.props),expected.filter(p=>p.zoneId===s.zone.id));assert.deepEqual(plain(s.player.weapon),plain(cp.weapon));
  assert(!s.player.grapple&&!s.player.carry&&!s.player.running&&!s.player.guarding&&!s.player.attack);assert.equal(s.impact.remainingMs,0);
  assert(s.props.every(p=>!p.heldBy));route.run(100);assert(!route.view().player.running);assert.equal(route.game.drainEvents().length,0);
});
console.log(`Mac arsenal checks passed (${groups} groups)`);
