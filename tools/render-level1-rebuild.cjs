// Native visual review: production actor/level/traffic owners, bundled artwork.
// Image and Makko sprite boundaries are adapted; no hosted/audio claim.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),{once}=require('events');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
const {createRig,load}=require('./check-level-01-boss'),{createSprite}=require('./makko-animation-fixture'),{installArt}=require('./render-cat-chaos.cjs');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'../review');fs.mkdirSync(out,{recursive:true});
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','Oxanium');
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
 w.MakkoEngine.sprite=sprite;w.player.sprite=sprite();w.player.spriteReady=true;w.player.playAnimation('idle');
 load(context,'src/game/combat-fx.js');load(context,'src/game/render-coordinator.js');load(context,'src/game/hacking.js');load(context,'src/game/ui-manager.js');load(context,'src/engine/traffic-sheets.js');load(context,'src/engine/spaceships.js');w.SpaceShipSystem.prototype.loadShipImages=function(){};w.spaceShipSystem=new w.SpaceShipSystem();
 for(let i=0;i<3;i++){w.spaceShipSystem.shipImages[i]=await loadImage(path.join(root,'assets/traffic/ship-'+(i+1)+'.webp'));w.spaceShipSystem.imagesLoaded[i]=true;w.spaceShipSystem.shipSheets[i]=w.BARCODE.trafficSheets[i];}
 const bg=await loadImage(path.join(root,'assets/world-v3/far-background.webp')),fg=await loadImage(path.join(root,'assets/world-v3/buildings.webp'));
 p.startMission();w.rhythmSystem.hideRhythmMode();w.player.allowMovement=true;
 function scene(c,cx,cy){w.gameCamera={centerX:cx,y:cy};w.renderer.zoomLevel=1;c.fillStyle='#111322';c.fillRect(0,0,1920,1080);c.drawImage(bg,0,0,1920,1080);c.save();c.translate(960-cx,-cy);c.drawImage(fg,0,2,fg.width,fg.height-2,-152,-550+2*1589/fg.height,4400,1589-2*1589/fg.height);w.drawGround(c);w.drawGameEntities(c);w.player.draw(c);c.restore();c.save();c.translate(0,-cy);w.spaceShipSystem.drawForegroundShips(c);c.restore();w.drawObjectives(c);}
 function setHero(x,foot,support){Object.assign(w.player.position,{x,y:foot-72});w.player.velocity.x=0;w.player.velocity.y=0;w.player.grounded=true;w.player.supportedSurfaceId=support||null;w.player.state='idle';w.player.airInput=0;w.player.controlsDisabled=false;w.player.invulnerableUntil=0;w.player.health=w.player.maxHealth;w.player.playAnimation('idle');}
 const canvas=createCanvas(1920,1080),c=canvas.getContext('2d');
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
   scene(c,1000,0);w.drawBasicUI(c);w.BARCODE.ComicHUD.hack(c,status,false);
   if(i<2)fs.writeFileSync(path.join(out,'hack-'+state+'.png'),canvas.toBuffer('image/png'));
   sc.drawImage(canvas,410,273,335,100,375*(i%2),190*Math.floor(i/2)+40,335,100);
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

 for(const [i,cx] of [1080,2040,2990,3290].entries()){p.state='encounter_'+(i+1);p.closedGateEncounterId=p.state;setHero([1110,2010,2900,3870][i],856);w.enemyManager.enemies=[];scene(c,cx,0);fs.writeFileSync(path.join(out,'gate-'+(i+1)+'-street.png'),canvas.toBuffer('image/png'));scene(c,cx,-600);fs.writeFileSync(path.join(out,'gate-'+(i+1)+'-roof.png'),canvas.toBuffer('image/png'));}
 p.state='encounter_4';p.closedGateEncounterId=p.state;setHero(3250,650,'tower-utility-unit');w.enemyManager.enemies=[];scene(c,3190,0);fs.writeFileSync(path.join(out,'broadcast-terminal.png'),canvas.toBuffer('image/png'));
 const roof=w.Sector1Progression.STAGE_SURFACES.find(p=>p.id==='tower-crown');const drone=new w.RooftopDrone(3490,-500,roof);drone._sector1MissionEnemy=true;drone.spawnProtectionDuration=0;w.enemyManager.enemies=[drone];setHero(3340,-314,'tower-crown');scene(c,3160,-914);fs.writeFileSync(path.join(out,'rooftop-drone.png'),canvas.toBuffer('image/png'));
 const hack=w.hackingSystem=new w.HackingSystem();hack.active=true;hack.phase='answer';hack.puzzleType=2;hack.currentPuzzle={type:2,answer:'4061',hidden:true};hack.inputText='40';hack.useKeypad();scene(c,3160,-914);hack.draw(c);fs.writeFileSync(path.join(out,'keypad.png'),canvas.toBuffer('image/png'));hack.active=false;
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
