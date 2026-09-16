// Behavioral checks use production Player, Enemy, progression and traffic owners.
const assert=require('assert'),fs=require('fs'),{createRig,load}=require('./check-level-01-boss');
function rig(){const r=createRig();r.p.startMission();r.p.state='jammer_active';r.p.closedGateEncounterId=null;r.w.rhythmSystem.hideRhythmMode();r.w.player.allowMovement=true;return r;}
// Solid undersides require approaching around the lip. The Tower/Broadcast
// overhangs are descended with the existing Down+Jump action; the connected
// upper ascent runs through the Relay and the outward Tower middle step.
const {createSprite,playerClips}=require('./makko-animation-fixture');
const routes=[
 ["signal-awning","signal-roof",724,729,0.08,-1,0.05],
 ["signal-roof","signal-high-step",829,710,0],
 ["signal-high-step","west-crown",690,570,0],
 ["signal-roof","cache-high-step",1270,1460,0],
 ["cache-high-step","cache-crown",1480,1620,0],
 ["cache-crown","firewall-roof",1850,1990,0],
 ["firewall-roof","relay-rooftop",2480,2640,0],
 ["relay-rooftop","tower-middle-step",3142,3092,0],
 ["tower-middle-step","tower-high-step",3112,3412,0],
 ["tower-high-step","tower-crown",3480,3530,0],
 ["firewall-low-step","firewall-canopy",2140,2050,0],
 ["firewall-canopy","firewall-high-step",1924,2185,0.08,-1,0],
 ["firewall-high-step","firewall-roof",2228,2240,0],
 [null,"tower-utility-unit",480,640,0],
 ["tower-utility-unit","signal-awning",690,850,0],
 ["tower-rooftop","tower-awning",3500,3500,0,0,0,"drop"],
 ["tower-rooftop","tower-middle-step",3300,3140,0],
 ["tower-crown","broadcast-crown",3710,3850,0],
 ["broadcast-awning","broadcast-low-step",3880,4000,0],
 ["broadcast-high-step","broadcast-low-step",3950,3950,0,0,0,"drop"],
 ["broadcast-high-step","broadcast-crown",3900,3940,0]
];
for(const fps of [30,60,120])for(const [from,to,start,x,delay=0,dir=0,walk=0,action='jump'] of routes){
 const {w,p}=rig(),player=w.player,surfaces=p.getStageSurfaces();const source=surfaces.find(s=>s.id===from),dest=surfaces.find(s=>s.id===to);assert(dest);
 Object.assign(player.position,{x:start,y:(source?.y??856)-72});player.grounded=true;player.supportedSurfaceId=from;
 player.sprite=createSprite(playerClips);player.spriteReady=true;player.playAnimation('idle');player.isJumpHeld=()=>true;player.facing=dir||Math.sign(x-start)||1;
 for(let j=0;j<Math.round(walk*fps);j++){dir>0?player.moveRight():player.moveLeft();player.update(1000/fps,true);}
 assert(action==='drop'?player.dropThrough():player.jump(),'route starts with a valid player action');
 let landed=null;for(let i=0;i<fps*3;i++){
  if(i/fps<delay&&dir){dir>0?player.moveRight():player.moveLeft();}
  else if(i/fps>=delay){if(player.position.x<x-5)player.moveRight();else if(player.position.x>x+5)player.moveLeft();else player.stopHorizontal();}
  player.update(1000/fps,true);if(player.grounded){landed=player.supportedSurfaceId;break;}
 }
 assert.strictEqual(landed,to,`${fps}Hz ${from||'street'} -> ${to}: ended ${landed} at ${player.position.x},${player.position.y+72}`);
}
for(const fps of [30,60,120]){
 const {w,p}=rig();const roof=p.getStageSurfaces().find(s=>s.id==='cache-crown');const guard=new w.Enemy(1500,roof.y-72,'corrupted');Object.assign(guard.position,{x:1500,y:roof.y-72});Object.assign(guard,{_sector1MissionEnemy:true,entranceComplete:true,supportedSurfaceId:roof.id,spawnProtectionDuration:0});
 for(let i=0;i<fps*12;i++){Object.assign(w.player.position,{x:i<fps*6?1900:1300,y:-650});guard.update(1000/fps,w.player,i*1000/fps);assert(Math.abs(guard.position.y+72-roof.y)<.001,'ground guard never rises toward player');assert(guard.position.x>=roof.x&&guard.position.x<=roof.x+roof.w,'guard stays on roof');}
 const drone=new w.RooftopDrone(1620,roof.y-182,roof);drone._sector1MissionEnemy=true;drone.spawnProtectionDuration=0;w.enemyManager.enemies=[drone];
 for(let i=0;i<fps*12;i++){w.player.position.y=i<fps*6?784:-900;drone.update(1000/fps,w.player,i*1000/fps);assert(Math.abs(drone.position.y-drone.home.y)<=5.01,'drone cannot follow player outside its flight band');assert(drone.position.x>=drone.home.left&&drone.position.x<=drone.home.right);}
}
{
 const {w,p,context}=rig();const hero=w.player;Object.assign(hero.position,{x:1100,y:784});const enemy=new w.Enemy(1105,784,'firewall');Object.assign(enemy.position,{x:1105,y:784});Object.assign(enemy,{entranceComplete:true,_sector1MissionEnemy:true,spawnProtectionDuration:0});w.enemyManager.enemies=[enemy];hero.invulnerableUntil=Date.now()+100000;
 w.enemyManager.checkCollisions(hero);assert(!w.enemyManager.simpleAABBcollision(hero.getHitbox(),enemy.getHitbox()),'recovery overlaps resolve without taking damage');assert.strictEqual(hero.health,3);
 load(context,'src/engine/traffic-sheets.js');load(context,'src/engine/spaceships.js');w.SpaceShipSystem.prototype.loadShipImages=function(){};const traffic=new w.SpaceShipSystem();w.spaceShipSystem=traffic;
 assert.strictEqual(traffic.createForegroundShip(),null,'unavailable art creates no invisible hazard or substitute car');
 traffic.imagesLoaded[0]=true;traffic.shipImages[0]={width:1280,height:727};const car=traffic.createForegroundShip(true);assert(car);assert.strictEqual(car.launchInMs,3000);
 const ops=[];const c=new Proxy({},{get:(t,k)=>t[k]??((...a)=>ops.push([k,...a])),set:(t,k,v)=>(t[k]=v,true)});
 traffic.drawShip(c,car);assert(ops.some(o=>o[0]==='drawImage'&&o.length===6),'the original GIF draws even without an atlas');assert(!ops.some(o=>o[0]==='fillRect'),'no replacement vehicle drawing');
 traffic.spawnShip=()=>{};traffic.update(2900);assert.strictEqual(traffic.ships.length,0);traffic.update(100);assert(traffic.ships.includes(car));
 const x=car.x;w.hackingSystem.active=true;traffic.update(100);assert(Math.abs(car.x-x-car.speed*6)<.001,'original traffic continues during hacking');w.hackingSystem.active=false;
 traffic.resetRuntime();assert.strictEqual(traffic.pendingForeground.length,0);assert.strictEqual(traffic.ships.length,0);

}
{
 const {w,p}=rig();const roof=p.getStageSurfaces().find(s=>s.id==='tower-crown'),actor={position:{x:3400,y:roof.y-72},grounded:true,supportedSurfaceId:roof.id};let clips=0;const c={beginPath(){},rect(x,y,w,h){assert.strictEqual(y+h,roof.y-roof.maskFeet);},clip(){clips++;}};
 p.clipRoofFeet(c,actor);assert.strictEqual(clips,1);actor.grounded=false;p.clipRoofFeet(c,actor);assert.strictEqual(clips,1,'airborne bodies remain visible in front of roofs');
 const ops=[];const ctx=new Proxy({},{get:(t,k)=>t[k]??((...a)=>ops.push([k,...a])),set:(t,k,v)=>(t[k]=v,true)});p.drawStageSurfaces(ctx);
 for(const surface of w.Sector1Progression.STAGE_SURFACES)assert(ops.some(o=>o[0]==='lineTo'&&o[1]===surface.x+surface.w&&o[2]===surface.y-(surface.maskFeet||0)),'subtle landing edge follows painted lip');
}
console.log('Rebuild: 63 production climbing/descent actions with solid undersides; grounded guards and bounded drones at 30/60/120Hz; protected contact, original GIF cars, original approach/puzzle motion/reset and roof masking passed.');
{
 const {w,p}=rig(),roof=p.getStageSurfaces().find(s=>s.id==='cache-crown');
 const ground=['firewall','corrupted','corrupted'].map((type,i)=>{const e=new w.Enemy(1500+i*60,784,type);Object.assign(e.position,{x:1500+i*60,y:784});Object.assign(e,{_sector1MissionEnemy:true,entranceComplete:true,_inCrowd:true,spawnProtectionDuration:0});e.velocity.y=0;return e;});
 w.player.position.y=-800;w.enemyManager.enemies=ground;w.enemyManager.applyCrowdBehavior(ground,w.player,16);ground.forEach(e=>assert.strictEqual(e.velocity.y,0,'crowd steering cannot levitate ground enemies'));
 const drone=new w.RooftopDrone(1580,roof.y-182,roof);Object.assign(drone,{_sector1MissionEnemy:true,spawnProtectionDuration:0});
 const victim=new w.Enemy(1760,roof.y-92,'corrupted');Object.assign(victim.position,{x:1760,y:roof.y-92});Object.assign(victim,{entranceComplete:true,_sector1MissionEnemy:true,spawnProtectionDuration:0});w.enemyManager.enemies=[drone,victim];w.player.position.x=1550;w.player.position.y=roof.y-72;
 assert.strictEqual(w.enemyManager.findHijackTarget(),drone,'new enemy participates in normal H targeting');assert(w.enemyManager.hijackEnemy(drone));
 const health=w.player.health;for(let i=0;i<360&&victim.active;i++){w.enemyManager.simulationTimeMs=i*1000/60;drone.update(1000/60,victim,i*1000/60);}
 assert(victim.health<victim.maxHealth,'hijacked drone fires at an enemy');assert.strictEqual(w.player.health,health,'allied projectile cannot damage player');
 w.enemyManager.releaseHijack(drone);assert.strictEqual(drone.pulse,null,'expiry/release removes allied projectiles');
}
console.log('Full crowd motion ownership and drone target/conversion/projectile/release checks passed.');
