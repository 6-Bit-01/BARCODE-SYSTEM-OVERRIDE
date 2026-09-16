// Native visual review: production actor/level/traffic owners, bundled artwork.
// Image and Makko sprite boundaries are adapted; no hosted/audio claim.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),{once}=require('events');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
const {createRig,load}=require('./check-level-01-boss'),{createSprite}=require('./makko-animation-fixture'),{installArt}=require('./render-cat-chaos.cjs');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'../review');fs.mkdirSync(out,{recursive:true});
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','Oxanium');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','sans-serif');
async function main(){
 const {w,p,context,calls}=createRig();await installArt(w,context);
 const clips={};for(const file of fs.readdirSync(path.join(root,'assets/sprites-v3/prepared')).filter(f=>f.endsWith('.json'))){const key=file.slice(0,-5),meta=JSON.parse(fs.readFileSync(path.join(root,'assets/sprites-v3/prepared',file)));clips[key]={meta,image:await loadImage(path.join(root,'assets/sprites-v3/prepared',key+'.webp')),frames:Object.values(meta.frames)};}
 if(process.env.UPPER_ROUTE_REVIEW){
  const key='sector_1_boss_walk_walk',folder=process.env.BOSS_WALK_CACHE;
  if(!folder)throw new Error('BOSS_WALK_CACHE must contain the original manifest-linked walk bytes');
  const meta=JSON.parse(fs.readFileSync(path.join(folder,key+'.json')));
  clips[key]={meta,image:await loadImage(path.join(folder,key+'.webp')),frames:Object.values(meta.frames)};
 }
 function sprite(data=clips){const s=createSprite(Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.frames.length]))),old=s.play;
  s.isLoaded=()=>true;s.getHitboxWorld=()=>null;
  s.play=function(...args){const r=old.apply(s,args),a=data[args[0]],anchor=a.meta.meta.anchor||{x:a.frames[0].frame.w/2,y:308};
   s.currentSprite.getAnchorPoint=()=>anchor;s.currentSprite.hasManifestAnchor=()=>true;s.currentSprite.getManifestScale=()=>1;
   s.currentSprite.metadata.frames=Object.fromEntries(a.frames.map((f,i)=>[String(i),{...f,duration:f.duration||83}]));return r;};
  s.draw=(c,x,y,o={})=>{const a=data[s.getCurrentAnimation()];if(!a)return;const f=a.frames[s.currentSprite.currentFrame%a.frames.length].frame,anchor=s.currentSprite.getAnchorPoint(),scale=o.scale||1;c.save();c.globalAlpha*=o.alpha??1;c.translate(x,y);c.scale(o.flipH?-scale:scale,scale);c.drawImage(a.image,f.x,f.y,f.w,f.h,-anchor.x,-anchor.y,f.w,f.h);c.restore();};return s;
 }
 w.MakkoEngine.sprite=()=>sprite();w.player.sprite=sprite();w.player.spriteReady=true;w.player.playAnimation('idle');
 load(context,'src/game/combat-fx.js');load(context,'src/game/render-coordinator.js');load(context,'src/game/hacking.js');load(context,'src/game/ui-manager.js');load(context,'src/engine/traffic-sheets.js');load(context,'src/engine/spaceships.js');w.SpaceShipSystem.prototype.loadShipImages=function(){};w.spaceShipSystem=new w.SpaceShipSystem();
 for(let i=0;i<3;i++){w.spaceShipSystem.shipImages[i]=await loadImage(path.join(root,'assets/traffic/ship-'+(i+1)+'.webp'));w.spaceShipSystem.imagesLoaded[i]=true;w.spaceShipSystem.shipSheets[i]=w.BARCODE.trafficSheets[i];}
 const bg=await loadImage(path.join(root,'assets/world-v3/far-background.webp')),fg=await loadImage(path.join(root,'assets/world-v3/buildings.webp'));
 p.startMission();w.rhythmSystem.hideRhythmMode();w.player.allowMovement=true;
 function scene(c,cx,cy){w.gameCamera={centerX:cx,y:cy};w.renderer.zoomLevel=1;c.fillStyle='#111322';c.fillRect(0,0,1920,1080);c.drawImage(bg,0,0,1920,1080);c.save();c.translate(960-cx,-cy);c.drawImage(fg,0,2,fg.width,fg.height-2,-152,-550+2*1589/fg.height,4400,1589-2*1589/fg.height);w.drawGround(c);w.drawGameEntities(c);w.player.draw(c);c.restore();c.save();c.translate(0,-cy);w.spaceShipSystem.drawForegroundShips(c);c.restore();if(!w.tutorialSystem?.isActive?.())w.drawObjectives(c);}
 function setHero(x,foot,support){Object.assign(w.player.position,{x,y:foot-72});w.player.velocity.x=0;w.player.velocity.y=0;w.player.grounded=true;w.player.supportedSurfaceId=support||null;w.player.state='idle';w.player.airInput=0;w.player.controlsDisabled=false;w.player.invulnerableUntil=0;w.player.health=w.player.maxHealth;w.player.playAnimation('idle');}
 const canvas=createCanvas(1920,1080),c=canvas.getContext('2d');
 if(process.env.LIFT_ROOF_DEPTH_REVIEW){
  p.state='jammer_active';p.closedGateEncounterId=null;
  const crop=createCanvas(720,720),cc=crop.getContext('2d');
  for(const type of ['virus','corrupted','firewall','drone']){
   p.resetSignalLift();const lift=p.signalLift;lift.y=lift.prevY=650;lift.state='moving';
   const roof=p.getLiftRoof(),x=roof.x+roof.w/2;
   setHero(x,lift.y,lift.id);
   const e=type==='drone'?new w.RooftopDrone(x,roof.topY-57,{x:2300,w:500}):new w.Enemy(x,roof.topY-72,type);
   Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,spawnProtectionDuration:0,supportedSurfaceId:roof.id});
   e.position.x=x;e.position.y=roof.topY-(type==='drone'?57:72);e.updateAI=()=>{};
   if(type!=='drone')e.playAnimation('idle');
   w.enemyManager.enemies=[e];
   e.update(100,w.player,100);p.updateSignalLift(100);
   scene(c,x,p.getLiftRoof().topY-230);cc.drawImage(canvas,600,0,720,720,0,0,720,720);
   fs.writeFileSync(path.join(out,'roof-'+type+'.webp'),crop.toBuffer('image/webp',90));
  }
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native roof depth review: four enemy types standing over the moving deck, player inside cabin.');return;
 }
 if(process.env.SOLID_LEDGE_REVIEW){
  p.state='jammer_active';p.closedGateEncounterId=null;w.enemyManager.enemies=[];
  const movie=createCanvas(960,720),mc=movie.getContext('2d');
  const video=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','15','-i','pipe:0','-c:v','libx264','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'solid-ledges-smush.mp4')],{stdio:['pipe','ignore','pipe']});
  let errors='';video.stderr.on('data',b=>errors+=b);
  async function emit(label,cx=2506,cy=0,name=null){
   scene(c,cx,cy);mc.drawImage(canvas,480,330,960,720,0,0,960,720);
   mc.fillStyle='rgba(4,12,18,.94)';mc.fillRect(12,12,936,32);mc.fillStyle='#fff';mc.font='18px Oxanium';mc.fillText(label,25,35);
   if(name)fs.writeFileSync(path.join(out,name+'.webp'),movie.toBuffer('image/webp',90));
   if(!video.stdin.write(movie.toBuffer('image/jpeg',85)))await once(video.stdin,'drain');
  }
  function enemy(type,x,foot){const e=new w.Enemy(x,foot-72,type);Object.assign(e.position,{x,y:foot-72});Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,spawnProtectionDuration:0});e.updateAI=()=>{};return e;}
  setHero(3500,856,null);w.player.isJumpHeld=()=>true;w.player.jump();let bonk=false;
  for(let i=0;i<23;i++){w.player.update(1000/15,true);p.updateSignalLift(1000/15);const hit=!!w.player.headContactSurfaceId;await emit('Awning bonk — jump stops at the visible underside',3500,0,hit&&!bonk?'awning-bonk':null);bonk ||= hit;}
  p.resetSignalLift();let lift=p.signalLift;lift.y=lift.prevY=680;lift.state='moving';let roof=p.getLiftRoof();
  setHero(roof.x+roof.w*.7,roof.topY,roof.id);const rider=enemy('corrupted',roof.x+60,roof.topY);rider.supportedSurfaceId=roof.id;w.enemyManager.enemies=[rider];
  for(let i=0;i<30;i++){if(i<10)w.player.moveLeft();else if(i<18)w.player.moveRight();else w.player.stopHorizontal();w.player.update(1000/15,true);rider.update(1000/15,w.player,i*1000/15);p.updateSignalLift(1000/15);await emit('Solid elevator roof — walking and riding upward',2506,p.getLiftRoof().topY-660,i===20?'roof-riders':null);}
  for(const type of ['firewall','corrupted','virus']){
   p.resetSignalLift();lift=p.signalLift;lift.y=lift.prevY=550;lift.state='returning';setHero(lift.x-130,856,null);const victim=enemy(type,2506,856);w.enemyManager.enemies=[victim];
   for(let i=0;i<50;i++){victim.update(1000/15,w.player,i*1000/15);p.updateSignalLift(1000/15);await emit('Descending elevator — '+type+' gets pancaked',2506,0,i===35?'pancake-'+type:i===0?'before-'+type:null);}
  }
  video.stdin.end();const [code]=await once(video,'close');if(code)throw new Error(errors);
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native awning bonk, moving roof riders and three enemy pancake scenes rendered.');return;
 }
 if(process.env.LIFT_CLEARANCE_REVIEW){
  for(const file of ['src/engine/parallax.js','src/game/lore-collection.js','src/game/level-01-stage-fx.js'])load(context,file);
  const storage=new Map();w.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  w.lostDataSystem.archive=new w.BARCODE.LoreCollection();w.BARCODE.stageFX.reset(p);
  w.parallaxBackground=new w.ParallaxBackground();w.parallaxBackground.addLayer({image:bg,scrollFactorX:.5});w.parallaxBackground.addLayer({image:fg,scrollFactorX:1});
  p.state='encounter_3';p.closedGateEncounterId=null;p.spawnedEncounterIds.add(p.state);w.enemyManager.enemies=[];
  let cameraX=2538;
  function frame(cy=0){
   p.cameraY=cy;p.getCameraX=()=>Math.max(960,Math.min(3136,cameraX));w.renderer.zoomLevel=.625;
   c.fillStyle='#000';c.fillRect(0,0,1920,1080);c.save();c.translate(960,675*.375+425*.625);c.scale(.625,.625);c.translate(-960,-425);
   w.drawGameElements(c);c.restore();w.drawGameUI(c);
  }
  function save(name){fs.writeFileSync(path.join(out,name+'.webp'),canvas.toBuffer('image/webp',88));}
  const center=p.signalLift.x+p.signalLift.w/2;setHero(center,856,p.signalLift.id);
  p.updateSignalLift(16);frame();save('lift-approach');p.updateSignalLift(2500);frame();save('lift-clear-cabin');
  const movie=createCanvas(960,540),mc=movie.getContext('2d');
  const video=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-i','pipe:0','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'lift-clearance-review.mp4')],{stdio:['pipe','ignore','pipe']});
  let errors='';video.stderr.on('data',b=>errors+=b);
  async function emit(label,cy=0){frame(cy);mc.drawImage(canvas,0,0,960,540);mc.fillStyle='rgba(4,12,18,.92)';mc.fillRect(12,509,936,24);mc.fillStyle='#fff';mc.font='13px Oxanium';mc.fillText(label,24,526);if(!video.stdin.write(movie.toBuffer('image/png')))await once(video.stdin,'drain');}
  for(let i=0;i<30;i++)await emit('Larger cabin · Clear headroom · Persistent world label removed');
  w.player.isJumpHeld=()=>true;w.player.jump();let captured=false;
  for(let i=0;i<36;i++){
   w.player.update(1000/30,true);p.updateSignalLift(1000/30);
   await emit('Actual jump update · Cap contacts the visible underside · No damage or stun');
   if(w.player.liftHeadContact&&!captured){save('lift-visible-bump');captured=true;}
  }
  if(!captured)throw new Error('Native jump never contacted the roof');
  setHero(p.signalLift.x-40,856);w.player.jump();
  for(let i=0;i<36;i++){w.player.update(1000/30,true);p.updateSignalLift(1000/30);await emit('Jumping beside the cabin is clear · Awning climb-through behavior retained');}
  setHero(center,856,p.signalLift.id);p.chargeSignalLift();p.chargeSignalLift();
  for(let i=0;i<120;i++){w.player.update(1000/30,true);p.updateSignalLift(1000/30);await emit('Two-beat ascent · Lift floor reaches the actual rooftop',Math.min(0,(p.signalLift.y-856)*.65));}
  frame(-518);save('lift-rooftop-alignment');
  for(let i=0;i<24;i++){w.player.moveLeft();w.player.update(1000/30,true);p.updateSignalLift(1000/30);await emit('Walk straight onto the rooftop · No extra jump needed',-518);}
  if(w.player.supportedSurfaceId!=='firewall-roof')throw new Error('Player did not walk onto the actual rooftop');
  save('lift-rooftop-walkoff');
  p.state='encounter_4';p.spawnedEncounterIds.add(p.state);cameraX=3450;
  const drone=p.spawnMissionEnemy({type:'virus',x:3450},'encounter_4',1);drone.spawnProtectionDuration=0;drone.spawnTimeMs=-10000;
  setHero(3545,275,'tower-rooftop');frame(-350);save('drone-open-stomp-lane');
  for(let i=0;i<30;i++){drone.update(1000/30,null,10000+i*1000/30);await emit('Mission drone patrol moved beyond the overhead steps · Open stomp approach',-350);}
  w.enemyManager.enemies=[];const stage=w.BARCODE.stageFX;
  stage.archive().completeStudioRatEvent('level-01');
  w.Math=Object.create(Math);
  for(const [index,name] of [[0,'signal'],[5,'broadcast']]){
   w.Math.random=()=>(index+.5)/6;stage.reset(p);
   const spot=stage.ratSpot;cameraX=spot.x;setHero(spot.x-120,spot.y,spot.surfaceId);
   for(let i=0;i<24;i++){stage.update(1000/30);await emit('Studio Rat returns despite existing save credit · Random reachable perch each run',spot.y-550);}
   save('studio-rat-random-'+name);
  }
  video.stdin.end();const [code]=await once(video,'close');if(code!==0)throw new Error(errors);
  if(calls.errors.length)throw new Error([...new Set(calls.errors)].join('\n'));
  console.log('Native larger cabin, brief HUD, true cap/roof contact, rooftop walk-off, open drone lane and saved-cat random perches rendered.');return;
 }
 if(process.env.FINALE_REVIEW){
  for(const file of ['src/game/lore-collection.js','src/game/level-difficulty.js','src/game/level-01-stage-fx.js','src/engine/parallax.js'])load(context,file);
  const storage=new Map();w.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  w.lostDataSystem.archive=new w.BARCODE.LoreCollection();w.BARCODE.stageFX.reset(p);
  w.parallaxBackground=new w.ParallaxBackground();w.parallaxBackground.addLayer({image:bg,scrollFactorX:.5});w.parallaxBackground.addLayer({image:fg,scrollFactorX:1});w.document.createElement=()=>createCanvas(64,64);
  p.state='encounter_2';p.closedGateEncounterId=null;w.enemyManager.enemies=[];
  function frame(cx=2538,cy=0,zoom=.625){
   p.cameraY=cy;p.getCameraX=()=>cx;w.renderer.zoomLevel=zoom;
   c.fillStyle='#000';c.fillRect(0,0,1920,1080);c.save();c.translate(960,675*(1-zoom)+425*zoom);c.scale(zoom,zoom);c.translate(-960,-425);
   w.drawGameElements(c);c.restore();w.drawGameUI(c);
  }
  function save(name){fs.writeFileSync(path.join(out,name+'.webp'),canvas.toBuffer('image/webp'));}
  const lift=p.signalLift;setHero(lift.x+lift.w/2,lift.y,lift.id);
  frame();save('lift-bottom');lift.state='moving';lift.charges=2;p.updateSignalLift(1000);frame();save('lift-moving');
  p.updateSignalLift(10000);frame(2538,-320);save('lift-top');
  w.BARCODE.LevelDifficulty.beginLevel();w.BARCODE.LevelDifficulty.draw(c);save('level-difficulty');w.BARCODE.LevelDifficulty.stop();
  const movie=createCanvas(960,540),mc=movie.getContext('2d');
  const video=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','20','-i','pipe:0','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'finale-review.mp4')],{stdio:['pipe','ignore','pipe']});
  let errors='';video.stderr.on('data',b=>errors+=b);
  async function emit(label){mc.drawImage(canvas,0,0,960,540);mc.fillStyle='rgba(4,12,18,.92)';mc.fillRect(12,509,936,24);mc.fillStyle='#fff';mc.font='13px Oxanium';mc.fillText(label,24,526);if(!video.stdin.write(movie.toBuffer('image/png')))await once(video.stdin,'drain');}
  p.resetSignalLift();setHero(lift.x+lift.w/2,856,lift.id);
  for(let i=0;i<150;i++){
   if(i===15||i===28)p.chargeSignalLift();p.updateSignalLift(50);w.BARCODE.combatFX.update(50);w.BARCODE.stageFX.update(50);
   frame(2538,Math.min(0,(p.signalLift.y-856)*.65));await emit('Native production render · Fixed full-height drive · Two beats power the carriage');
  }
  setHero(1625,330,'cache-canopy');w.gameCamera.centerX=1680;
  const victim=new w.Enemy(1880,258,'virus');Object.assign(victim.position,{x:1880,y:258});Object.assign(victim,{entranceComplete:true,spawnProtectionDuration:0,spawnTimeMs:-10000,active:true,_sector1MissionEnemy:true});
  victim.sprite=sprite();victim.spriteReady=true;victim.playAnimation('idle');w.enemyManager.enemies=[victim];
  frame(1680,-400,.8);w.BARCODE.stageFX.update(0);w.BARCODE.stageFX.inspect();
  for(let i=0;i<128;i++){
   w.BARCODE.stageFX.update(50);w.BARCODE.combatFX.update(50);frame(1680,-400,.8);
   if(i===8)save('cat-fourth-wall');if(i===53)save('cat-drag');
   await emit('Native production render · Studio Rat looks at the player, pounces and drags one enemy away');
  }
  video.stdin.end();const [code]=await once(video,'close');if(code!==0)throw new Error(errors);
  if(calls.errors.length)throw new Error([...new Set(calls.errors)].join('\n'));
  console.log('Finale native stills and powered lift / Studio Rat animation rendered.');return;
 }
 if(process.env.TRAFFIC_WARNING_REVIEW){
  const traffic=w.spaceShipSystem;traffic.warningImage=await loadImage(path.join(root,'assets/traffic-warning/watch-out.webp'));traffic.spawnShip=()=>{};
  const movie=createCanvas(960,540),mc=movie.getContext('2d');
  const video=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','30','-i','pipe:0','-c:v','libx264','-pix_fmt','yuv420p',path.join(out,'traffic-warning-both-sides.mp4')],{stdio:['pipe','ignore','pipe']});let errors='';video.stderr.on('data',d=>errors+=d);
  for(const direction of [1,-1]){
   traffic.resetRuntime();const car=traffic.createForegroundShip(true);
   Object.assign(car,{direction,speed:72.5*direction,flipH:direction<0,x:direction>0?-2370:4290,y:direction>0?-100:-300,shipType:0});
   p.state='encounter_2';p.closedGateEncounterId=null;const roof=p.getStageSurfaces().find(s=>s.id==='cache-crown');setHero(roof.x+roof.w/2,roof.y,roof.id);
   for(let i=0;i<126;i++){
    scene(c,2100,-550);w.drawGameUI(c);traffic.drawTrafficWarnings(c);
    if(i===36)fs.writeFileSync(path.join(out,'warning-'+(direction>0?'left':'right')+'.png'),canvas.toBuffer('image/png'));
    mc.drawImage(canvas,0,0,960,540);
    if(!video.stdin.write(movie.toBuffer('image/png')))await once(video.stdin,'drain');
    traffic.update(1000/30);
   }
  }
  video.stdin.end();const [code]=await once(video,'close');if(code!==0)throw new Error(errors);if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native warning previews and both-direction approach video complete.');return;
 }
 if(process.env.ENVIRONMENT_REPAIR_REVIEW){
  load(context,'src/engine/parallax.js');load(context,'src/engine/particles.js');load(context,'src/core/loop.js');
  w.parallaxBackground=new w.ParallaxBackground();
  w.parallaxBackground.addLayer({image:bg,scrollFactorX:0.5});w.parallaxBackground.addLayer({image:fg,scrollFactorX:1});
  w.document.createElement=()=>createCanvas(64,64);
  w.document.getElementById=id=>id==='gameCanvas'?canvas:null;
  Object.assign(w.renderer,{screenShake:{x:0,y:0},clear(){c.fillStyle='#111322';c.fillRect(0,0,1920,1080);}});
  w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.tutorialSystem.draw=()=>{};
  w.spaceShipSystem.warningImage=await loadImage(path.join(root,'assets/traffic-warning/watch-out.webp'));
  const movie=createCanvas(960,540),mc=movie.getContext('2d');
  const video=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','30','-i','pipe:0','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'environment-repair-review.mp4')],{stdio:['pipe','ignore','pipe']});
  let errors='',now=10000;video.stderr.on('data',b=>errors+=b);w.Date.now=()=>now;
  async function frame(label){
    now+=1000/30;w.gameLoop(now);
    mc.drawImage(canvas,0,0,960,540);mc.fillStyle='rgba(4,12,18,.9)';mc.fillRect(12,509,936,24);mc.fillStyle='#fff';mc.font='13px Oxanium';mc.fillText(label,24,526);
    if(!video.stdin.write(movie.toBuffer('image/png')))await once(video.stdin,'drain');
  }
  p.reset();Object.assign(w.tutorialSystem,{active:true,completed:false});w.renderer.zoomLevel=.8;w.lastTime=now;w.isRunning=true;setHero(480,856);
  for(let i=0;i<150;i++){
    await frame('Native frame-loop review · Training · Fixed camera: rain, steam and moving sign light');
    if(i===0||i===90)fs.writeFileSync(path.join(out,'training-street-'+i+'.webp'),canvas.toBuffer('image/webp'));
  }
  for(const [index,seed] of [1984,1981].entries()){
    p.reset();Object.assign(w.tutorialSystem,{active:!index,completed:!!index});if(index){p.startMission();p.state='jammer_active';}
    w.enemyManager.enemies=[];w.spaceShipSystem.resetRuntime();setHero(310,-200,'west-crown');p.cameraY=-800;w.renderer.zoomLevel=.8;
    require('vm').runInContext(`Math.random=(()=>{let s=${seed};return ()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);})()`,context);
    let health=3;
    for(let i=0;i<126;i++){
      await frame('Native frame-loop review · '+(index?'Mission / from right':'Training / from left')+' · WATCH OUT → visible contact → real health loss');
      if(i===45)fs.writeFileSync(path.join(out,'watch-out-'+(index?'right':'left')+'.webp'),canvas.toBuffer('image/webp'));
      if(w.player.health<health){fs.writeFileSync(path.join(out,'traffic-hit-'+index+'.webp'),canvas.toBuffer('image/webp'));health=w.player.health;}
    }
    if(health!==2)throw new Error('Expected one real traffic health loss: '+health);
  }
  video.stdin.end();const [code]=await once(video,'close');if(code!==0)throw new Error(errors);
  if(calls.errors.length)throw new Error([...new Set(calls.errors)].join('\n'));
  console.log('Native 13-second production frame-loop capture: live training scene, natural left/right warnings and actual player damage.');return;
 }
 if(process.env.WORLD_DEPTH_REVIEW){
  load(context,'src/engine/parallax.js');w.parallaxBackground=new w.ParallaxBackground();
  w.parallaxBackground.addLayer({image:bg,scrollFactorX:0.5});w.parallaxBackground.addLayer({image:fg,scrollFactorX:1});
  w.document.createElement=()=>createCanvas(64,64);w.parallaxBackground.prepareAtmosphereSprites();
  function frame(cx=960,cy=0,zoom=0.8){
    p.cameraY=cy;p.getCameraX=()=>cx;w.renderer.zoomLevel=zoom;
    c.fillStyle='#000';c.fillRect(0,0,1920,1080);c.save();c.translate(960,675*(1-zoom)+425*zoom);c.scale(zoom,zoom);c.translate(-960,-425);
    w.drawGameElements(c);c.restore();w.drawGameUI(c);
  }
  function capture(name,cx,cy,zoom){frame(cx,cy,zoom);fs.writeFileSync(path.join(out,name+'.webp'),canvas.toBuffer('image/webp'));}
  p.reset();setHero(580,856);w.BARCODE.combatFX.reset();capture('box-in-tutorial');
  p.startMission();p.closedGateEncounterId='encounter_1';
  const enemy=new w.Enemy(770,784,'firewall');Object.assign(enemy,{entranceComplete:true,spawnProtectionDuration:0,spawnTimeMs:-100000,active:true,_sector1MissionEnemy:true});
  Object.assign(enemy.position,{x:770,y:784});enemy.sprite=sprite();enemy.spriteReady=true;enemy.playAnimation('walk');w.enemyManager.enemies=[enemy];
  capture('enemy-in-front-of-box');
  // Force an overlap only in this diagnostic image to inspect the real
  // hologram renderer over the terminal. Production gate locations stay put.
  const gate=w.Sector1Progression.ENCOUNTER_GATES[0],presentation=p.getGatePresentation;
  p.getGatePresentation=()=>[{gate:{...gate,x:840},opening:false,progress:0}];
  enemy.position.x=1000;capture('hologram-over-box');p.getGatePresentation=presentation;
  p.closedGateEncounterId=null;p.state='jammer_active';w.enemyManager.enemies=[];
  setHero(3500,-314,'tower-crown');capture('stable-background-roof',3136,-1040,0.625);
  const movie=createCanvas(960,540),mc=movie.getContext('2d');
  const video=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','12','-i','pipe:0','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'box-background-review.mp4')],{stdio:['pipe','ignore','pipe']});let errors='';video.stderr.on('data',b=>errors+=b);
  for(let i=0;i<96;i++){
   w.BARCODE.combatFX.update(1000/12);
   if(i<36){setHero(560,856);enemy.position.x=620+i*9;w.enemyManager.enemies=[enemy];w.BARCODE.SpritePlayback.update(enemy.sprite,1000/12);frame();}
   else{w.enemyManager.enemies=[];const cx=960+(i-36)/59*2176;setHero(cx,-314);frame(cx,-850,0.8-0.175*Math.sin((i-36)/59*Math.PI));}
   mc.drawImage(canvas,0,0,960,540);if(!video.stdin.write(movie.toBuffer('image/png')))await once(video.stdin,'drain');
  }
  video.stdin.end();const [code]=await once(video,'close');if(code!==0)throw new Error(errors);
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));console.log('Production box depth, tutorial presence, hologram overlap and animated fixed-scale skyline rendered.');return;
 }
 if(process.env.SCENE_POLISH_REVIEW){
  load(context,'src/engine/parallax.js');w.parallaxBackground=new w.ParallaxBackground();
  w.parallaxBackground.addLayer({image:bg,scrollFactorX:0.5});w.parallaxBackground.addLayer({image:fg,scrollFactorX:1});
  p.state='jammer_active';p.missionDefeats=20;p.closedGateEncounterId=null;p.spawnedEncounterIds.add(p.state);
  w.enemyManager.enemies=[];w.BARCODE.JammerEnvironment.reveal();
  function capture(name,cx,cy,zoom){
    p.cameraY=cy;p.getCameraX=()=>cx;w.renderer.zoomLevel=zoom;
    c.fillStyle='#000';c.fillRect(0,0,1920,1080);c.save();c.translate(960,675*(1-zoom)+425*zoom);c.scale(zoom,zoom);c.translate(-960,-425);
    w.drawGameElements(c);c.restore();w.drawGameUI(c);fs.writeFileSync(path.join(out,name+'.png'),canvas.toBuffer('image/png'));
  }
  setHero(3290,856);capture('wet-street-jammer',3136,0,1);
  setHero(590,856);capture('left-terminal-route',960,0,0.8);
  setHero(2420,856);capture('middle-right-lift',2440,0,0.8);
  setHero(3500,-314,'tower-crown');capture('roof-zoom-coverage',3136,-1040,0.4);
  if(process.env.STILLS_ONLY){if(calls.errors.length)throw new Error(calls.errors.join('\n'));return;}
  const video=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','12','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'jammer-steady.mp4')],{stdio:['pipe','ignore','pipe']});let errors='';video.stderr.on('data',b=>errors+=b);
  setHero(3290,856);p.cameraY=0;p.getCameraX=()=>3136;w.renderer.zoomLevel=1;
  for(let i=0;i<48;i++){w.BARCODE.JammerEnvironment.update(1000/12);c.clearRect(0,0,1920,1080);w.drawGameElements(c);if(!video.stdin.write(canvas.toBuffer('image/png')))await once(video.stdin,'drain');}
  video.stdin.end();const [code]=await once(video,'close');if(code!==0)throw new Error(errors);
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));console.log('Production sky coverage, wet street and steady jammer rendered.');return;
 }
 if(process.env.HACK_POPUP_REVIEW){
  load(context,'src/game/pause-menu.js');load(context,'src/core/gamepad-ui.js');
  const pad={id:'DualSense Wireless Controller (054c)',mapping:'standard',connected:true,index:0,buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0]};w.navigator.getGamepads=()=>[pad];w.BARCODE.GamepadUI.read();
  const menu=w.BARCODE.PauseMenu;menu.view='controller';c.fillStyle='#101d29';c.fillRect(0,0,1920,1080);menu.draw(c);fs.writeFileSync(path.join(out,'cross-controller-settings.png'),canvas.toBuffer('image/png'));
  const hack=w.hackingSystem=new w.HackingSystem(),target=new w.Enemy(1050,784,'virus');Object.assign(target,{entranceComplete:true,spawnProtectionDuration:0,spawnTimeMs:-10000});
  p.state='encounter_1';p.closedGateEncounterId=p.state;setHero(900,856);w.enemyManager.enemies=[target];w.tutorialSystem.active=false;
  w.rhythmSystem.showRhythmMode();hack.update(16);
  scene(c,960,0);w.drawGameUI(c);fs.writeFileSync(path.join(out,'hack-ready-popup.png'),canvas.toBuffer('image/png'));
  hack.update(2100);scene(c,960,0);w.drawGameUI(c);fs.writeFileSync(path.join(out,'hack-popup-fading.png'),canvas.toBuffer('image/png'));
  hack.update(300);if(hack.getReadyPopup())throw new Error('Popup failed to disappear');scene(c,960,0);w.drawGameUI(c);fs.writeFileSync(path.join(out,'hack-popup-cleared.png'),canvas.toBuffer('image/png'));
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));console.log('Shared Cross settings, real ready popup, fade and fully cleared playfield rendered.');return;
 }
 if(process.env.CONTROLLER_REVIEW){
  load(context,'src/game/pause-menu.js');load(context,'src/core/gamepad-ui.js');
  const pad={id:'DualSense Wireless Controller (054c)',mapping:'standard',connected:true,index:0,buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0]};
  w.navigator.getGamepads=()=>[pad];w.BARCODE.GamepadUI.read();
  const menu=w.BARCODE.PauseMenu;menu.view='controller';menu.controllerFocus=0;
  c.fillStyle='#101d29';c.fillRect(0,0,1920,1080);menu.draw(c);fs.writeFileSync(path.join(out,'controller-settings.png'),canvas.toBuffer('image/png'));
  menu.controllerFocus=5;menu.activateController();menu.draw(c);fs.writeFileSync(path.join(out,'controller-remap.png'),canvas.toBuffer('image/png'));
  menu.captureAction=null;
  const hack=w.hackingSystem=new w.HackingSystem();
  const target=new w.Enemy(900,784,'virus');Object.assign(target.position,{x:900,y:784});target.entranceComplete=true;target.spawnProtectionDuration=0;target.spawnTimeMs=-10000;
  p.state='encounter_1';p.closedGateEncounterId=p.state;setHero(1000,856);w.enemyManager.enemies=[target];
  const strip=createCanvas(760,600),sc=strip.getContext('2d');sc.fillStyle='#101d29';sc.fillRect(0,0,760,600);
  const states=['ready','recharging','no-target','locked','airborne','linked'];
  for(let i=0;i<states.length;i++){
   const state=states[i];hack.reset();w.tutorialSystem.active=false;w.player.grounded=true;w.enemyManager.enemies=[target];target._hijackedUntilMs=0;
   if(state==='recharging')hack.cooldownUntil=w.Date.now()+6300;
   if(state==='no-target')w.enemyManager.enemies=[];
   if(state==='locked'){w.tutorialSystem.active=true;w.tutorialSystem.storyChapter=1;}
   if(state==='airborne')w.player.grounded=false;
   if(state==='linked')target._hijackedUntilMs=w.enemyManager.simulationTimeMs+8000;
   const status=hack.getAvailability();if(status.state!==state)throw new Error('Expected '+state+', got '+status.state);
   hack.updateReadyPopup(0);scene(c,1000,0);w.drawBasicUI(c);w.BARCODE.ComicHUD.hack(c,hack.getReadyPopup());
   if(i<2)fs.writeFileSync(path.join(out,'hack-'+state+'.png'),canvas.toBuffer('image/png'));
   sc.drawImage(canvas,720,183,335,100,375*(i%2),190*Math.floor(i/2)+40,335,100);
   sc.fillStyle='#c0ed55';sc.font='20px Oxanium';sc.fillText(state.toUpperCase(),375*(i%2)+8,190*Math.floor(i/2)+25);
  }
  fs.writeFileSync(path.join(out,'hack-states.png'),strip.toBuffer('image/png'));
  w.tutorialSystem.active=false;w.player.grounded=true;w.enemyManager.enemies=[];hack.reset();w.rhythmSystem.showRhythmMode();scene(c,1000,0);w.drawGameUI(c);
  fs.writeFileSync(path.join(out,'hack-rhythm-layout.png'),canvas.toBuffer('image/png'));
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Controller settings/capture and six real hack availability states rendered through production UI.');return;
 }
 if(process.env.WALK_LOOP_REVIEW){
  const oldRoot=process.env.WALK_BASELINE;
  if(!oldRoot)throw new Error('WALK_BASELINE requires before.webp and before.json from the base commit');
  const meta=JSON.parse(fs.readFileSync(path.join(oldRoot,'before.json')));
  const oldClips={...clips,'6_bit_walk_walk':{meta,image:await loadImage(path.join(oldRoot,'before.webp')),frames:Object.values(meta.frames)}};
  const actors=[new w.Player(),new w.Player()];
  actors.forEach((a,i)=>{a.sprite=sprite(i?clips:oldClips);a.spriteReady=true;a.state='walk';a.grounded=true;a.position={x:960,y:784};a.velocity={x:300,y:0};a.impactHoldMs=0;a.playAnimation('walk');});
  const preview=createCanvas(960,600),pc=preview.getContext('2d');
  const ff=spawn('/usr/bin/ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s','960x600','-r','60','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'Walk-Loop-Review.mp4')],{stdio:['pipe','ignore','pipe']});let err='';ff.stderr.on('data',d=>err+=d);const completion=once(ff,'close');
  for(let i=0;i<600;i++){
   pc.fillStyle='#131b25';pc.fillRect(0,0,960,600);
   actors.forEach((a,row)=>{
    a.facing=i<300?1:-1;a.updateSpriteAnimation(1000/60);
    pc.save();pc.beginPath();pc.rect(0,row*300,960,300);pc.clip();
    pc.fillStyle='#22343c';pc.fillRect(0,row*300+253,960,47);
    pc.strokeStyle='#51756e';pc.beginPath();pc.moveTo(0,row*300+253);pc.lineTo(960,row*300+253);pc.stroke();
    const shift=(i*5)%96*(i<300?-1:1);pc.strokeStyle='#3a5057';
    for(let x=-96;x<1060;x+=96){pc.beginPath();pc.moveTo(x+shift,row*300+253);pc.lineTo(x+shift-12,row*300+300);pc.stroke();}
    pc.translate(480-960,row*300+253-856);a.drawSprite(pc);pc.restore();
    pc.fillStyle='#dcebe3';pc.font='18px Oxanium';pc.fillText(row?'REPAIRED / COMPLETE 16-POSE CYCLE':'BEFORE / TRUNCATED 12-POSE CYCLE',22,row*300+30);
   });
   pc.fillStyle='#a4bcb9';pc.font='14px Oxanium';pc.fillText((i/60).toFixed(2)+' s / '+(i<300?'RIGHT':'LEFT'),780,28);
   if([54,58,60,62].includes(i))fs.writeFileSync(path.join(out,'walk-seam-'+i+'.png'),preview.toBuffer('image/png'));
   if(!ff.stdin.write(Buffer.from(pc.getImageData(0,0,960,600).data)))await once(ff.stdin,'drain');
  }
  ff.stdin.end();const [code]=await completion;if(code)throw new Error(err);
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('10-second before/after: production Player + SpritePlayback, mirrored turn at five seconds; adapted host drawing.');return;
 }
 p.state='encounter_1';p.closedGateEncounterId=p.state;p.spawnedEncounterIds.add(p.state);
 setHero(1110,856);const firewall=new w.Enemy(850,784,'firewall');Object.assign(firewall.position,{x:850,y:784});firewall._sector1MissionEnemy=true;firewall.entranceComplete=true;firewall.spawnProtectionDuration=0;firewall.pollSpriteReady();firewall.playAnimation('walk');w.enemyManager.enemies=[firewall];
 scene(c,1080,0);fs.writeFileSync(path.join(out,'street-barrier.png'),canvas.toBuffer('image/png'));
 Object.assign(firewall.position,{x:1378,y:784});setHero(1200,856);
 scene(c,1320,0);fs.writeFileSync(path.join(out,'enemy-over-rail.png'),canvas.toBuffer('image/png'));
 p.districtSignal.clearedAtMs=[0,0,0,0];p.districtSignal.elapsedMs=3000;p.state='jammer_active';p.closedGateEncounterId=null;
 scene(c,1320,0);fs.writeFileSync(path.join(out,'enemy-over-cleared-rail.png'),canvas.toBuffer('image/png'));
 p.districtSignal.clearedAtMs=[null,null,null,null];

 for(const [i,cx] of [1080,2040,2990,3290].entries()){p.state='encounter_'+(i+1);p.closedGateEncounterId=p.state;setHero(w.Sector1Progression.ENCOUNTER_GATES[i].x-140,856);w.enemyManager.enemies=[];scene(c,cx,0);fs.writeFileSync(path.join(out,'gate-'+(i+1)+'-street.png'),canvas.toBuffer('image/png'));scene(c,cx,-600);fs.writeFileSync(path.join(out,'gate-'+(i+1)+'-roof.png'),canvas.toBuffer('image/png'));}
 p.state='encounter_4';p.closedGateEncounterId=p.state;setHero(770,650,'tower-utility-unit');w.enemyManager.enemies=[];scene(c,960,0);fs.writeFileSync(path.join(out,'broadcast-terminal.png'),canvas.toBuffer('image/png'));
 const roof=w.Sector1Progression.STAGE_SURFACES.find(p=>p.id==='tower-crown');const drone=new w.RooftopDrone(3490,-500,roof);drone._sector1MissionEnemy=true;drone.spawnProtectionDuration=0;w.enemyManager.enemies=[drone];setHero(3340,-314,'tower-crown');scene(c,3160,-914);fs.writeFileSync(path.join(out,'rooftop-drone.png'),canvas.toBuffer('image/png'));
 const hack=w.hackingSystem=new w.HackingSystem();hack.active=true;hack.phase='answer';hack.puzzleType=2;hack.currentPuzzle={type:2,answer:'4061',hidden:true};hack.inputText='40';hack.useKeypad();scene(c,3160,-914);hack.draw(c);fs.writeFileSync(path.join(out,'keypad.png'),canvas.toBuffer('image/png'));hack.active=false;
 if(process.env.FACADE_REVIEW){
  const sheet=createCanvas(1920,2160),sc=sheet.getContext('2d');
  for(let i=0;i<4;i++)for(const [column,view] of ['street','roof'].entries()){
   const im=await loadImage(path.join(out,'gate-'+(i+1)+'-'+view+'.png'));
   sc.drawImage(im,column*960,i*540,960,540);
   sc.fillStyle='rgba(4,12,18,.94)';sc.fillRect(column*960+12,i*540+12,490,32);
   sc.fillStyle='#d8ffad';sc.font='19px Oxanium';sc.fillText('Gate '+(i+1)+' · '+view+' · production geometry',column*960+24,i*540+35);
  }
  fs.writeFileSync(path.join(out,'facade-gates-street-roof.webp'),sheet.toBuffer('image/webp',86));
  load(context,'src/game/tutorial.js');w.tutorialSystem=new w.TutorialSystem();
  w.tutorialSystem.startTutorial();w.tutorialSystem.objectives.forEach(o=>{o.completed=true;});
  w.tutorialSystem.currentText=w.tutorialSystem.targetText;w.tutorialSystem.readyToAdvance=true;
  p.reset();w.enemyManager.enemies=[];setHero(580,856);scene(c,960,0);w.drawBasicUI(c);w.tutorialSystem.draw(c);
  fs.writeFileSync(path.join(out,'facade-training-objectives.webp'),canvas.toBuffer('image/webp',88));
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('All four fitted gates at street/roof height and the live tutorial Objectives transition rendered.');return;
 }
 if(process.env.UPPER_ROUTE_REVIEW){
  p.state='jammer_active';p.closedGateEncounterId=null;p.districtSignal.clearedAtMs=[0,0,0,0];p.districtSignal.elapsedMs=3000;
  p.resetSignalLift();p.signalLift.y=660;p.signalLift.charges=2;p.signalLift.state='rising';setHero(725,660,'signal-lift');w.enemyManager.enemies=[];
  scene(c,1060,0);fs.writeFileSync(path.join(out,'upper-lift.png'),canvas.toBuffer('image/png'));
  const def=w.Sector1Progression.ENCOUNTERS[1];p.state=def.id;p.spawnEncounter(def);p.updatePendingSpawns(1000);
  w.enemyManager.enemies=p.activeEncounterEnemies.filter(e=>e.type==='drone');setHero(1660,330,'cache-awning');w.enemyManager.enemies.forEach(e=>e.update(800,w.player,800));scene(c,1790,-270);fs.writeFileSync(path.join(out,'upper-drone.png'),canvas.toBuffer('image/png'));
  p.state='jammer_active';p.closedGateEncounterId=null;w.enemyManager.enemies=[];setHero(310,-200,'west-crown');scene(c,1000,-800);fs.writeFileSync(path.join(out,'upper-cache.png'),canvas.toBuffer('image/png'));
  p.boss={x:3480,y:784,active:true,sprite:sprite(),spriteReady:true,fallbackLocked:false,activeAnimation:null};p.enterBossReady();p.startBossFlourish();
  p.phaseElapsed=2100;setHero(3170,856);scene(c,3136,0);fs.writeFileSync(path.join(out,'upper-flourish.png'),canvas.toBuffer('image/png'));
  const preview=createCanvas(960,540),pc=preview.getContext('2d');
  const ff=spawn('/usr/bin/ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s','960x540','-r','30','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'Upper-Route-Boss-Review.mp4')],{stdio:['pipe','ignore','pipe']});let err='';ff.stderr.on('data',d=>err+=d);const completion=once(ff,'close');
  for(let i=0;i<660;i++){
   const dt=1000/30;w.gameState.gameTime=i*dt;
   if(i<120){p.state='boss_flourish';p.phaseElapsed=i*dt;p.boss.state='flourish';scene(c,3136,0);}
   else {
    if(i===120){p.boss.x=3430;p.boss.y=784;p.enterBossReady();p.beginBossCombat();setHero(3490,-314,'tower-crown');}
    if(i===480){setHero(3500,856);p.setBossCombatPhase('approach');}
    w.audioSystem.context.currentTime+=dt/1000;p.update(dt);
    scene(c,3136,p.getCameraY());
    if(i===220||i===400||i===450)fs.writeFileSync(path.join(out,'upper-boss-'+i+'.png'),canvas.toBuffer('image/png'));
   }
   pc.setTransform(.5,0,0,.5,0,0);pc.drawImage(canvas,0,0);pc.fillStyle='rgba(8,12,20,.9)';pc.fillRect(18,1010,1520,46);pc.fillStyle='#fff';pc.font='22px Oxanium';pc.fillText(i<120?'Native review · Crisp boss flourish':i<480?'Native review · Boss climbs authored supports · Camera follows player':'Native review · Boss returns toward street level',34,1041);
   if(!ff.stdin.write(Buffer.from(pc.getImageData(0,0,960,540).data)))await once(ff.stdin,'drain');
  }
  ff.stdin.end();const [code]=await completion;if(code!==0)throw new Error(err);if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Upper-route production art, first-wave drone and 22-second boss/camera review rendered.');
 }
 if(process.env.REVIEW_STILLS_ONLY)return console.log('Four production stills rendered.');
 // Script one original car for this short capture. Select a valid original
 // altitude for a visible contact; production spawning and range stay intact.
 w.spaceShipSystem.spawnShip=()=>{};
 const video=createCanvas(1280,720),v=video.getContext('2d');const ff=spawn('/usr/bin/ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s','1280x720','-r','30','-i','pipe:0','-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'Level1-Rebuild-Motion.mp4')],{stdio:['pipe','ignore','pipe']});let err='';ff.stderr.on('data',d=>err+=d);const completion=once(ff,'close');
 for(let i=0;i<480;i++){
  w.Date.now=()=>10000+i*1000/30;w.gameState.gameTime=i*1000/30;
  if(i===0){p.state='encounter_1';p.closedGateEncounterId=p.state;setHero(1110,856);Object.assign(firewall.position,{x:770,y:784});firewall.combatPattern='approach';firewall.combatPatternMs=0;w.enemyManager.enemies=[firewall];}
  if(i<180){const dx=i<90?1:-1;dx>0?w.player.moveRight():w.player.moveLeft();w.player.update(1000/30);p.applyGateCollision();firewall.update(1000/30,w.player,i*1000/30);w.enemyManager.simulationTimeMs=i*1000/30;w.enemyManager.checkCollisions(w.player);p.updateBarrierContacts(1000/30);}
  if(i===180){p.state='encounter_4';p.closedGateEncounterId=p.state;setHero(3330,-314,'tower-crown');w.enemyManager.enemies=[drone];drone.active=true;drone.dronePhase='patrol';drone.dronePhaseMs=0;}
  if(i>=180&&i<300){drone.update(1000/30,w.player,i*1000/30);w.player.update(1000/30);}
  if(i===300){w.enemyManager.enemies=[];setHero(3440,-314,'tower-crown');w.spaceShipSystem.createForegroundShip(true).y=-350;}
  if(i>=300){w.spaceShipSystem.update(1000/30);w.player.update(1000/30);}
  if(i%30===0)console.log(JSON.stringify({frame:i,x:w.player.position.x,y:w.player.position.y,health:w.player.health,support:w.player.supportedSurfaceId,state:w.player.state,activeCar:w.spaceShipSystem.ships.filter(s=>s.isForeground).map(s=>({x:s.x,y:s.y,hit:s.hit}))}));
  v.setTransform(2/3,0,0,2/3,0,0);scene(v,i<180?1080:3160,i<180?0:-914);
  v.fillStyle='rgba(8,12,20,.9)';v.fillRect(20,1010,820,46);v.fillStyle='#fff';v.font='22px Oxanium';v.fillText(i<180?'Native review · Firewall travel and turns':i<300?'Native review · Roof edge and drone windup':'Native review · Original car · Scripted approach and contact',35,1042);
  if(!ff.stdin.write(Buffer.from(v.getImageData(0,0,1280,720).data)))await once(ff.stdin,'drain');
 }
 ff.stdin.end();const [code,signal]=await completion;if(code!==0)throw new Error(err||'Encoder terminated: '+signal);if(calls.errors.length)throw new Error(calls.errors.join('\n'));console.log('Twelve stills and 16-second production-motion review rendered.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
