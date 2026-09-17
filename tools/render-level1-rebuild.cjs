// Native visual review: production actor/level/traffic owners, bundled artwork.
// Image and Makko sprite boundaries are adapted; no hosted/audio claim.
const fs=require('fs'),path=require('path'),{spawn}=require('child_process'),{once}=require('events');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
const {createRig,load}=require('./check-level-01-boss'),{createSprite}=require('./makko-animation-fixture'),{installArt}=require('./render-cat-chaos.cjs');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'../review');fs.mkdirSync(out,{recursive:true});
GlobalFonts.registerFromPath((process.env.CONTROL_POLISH_REVIEW || process.env.BOSS_MUSIC_REVIEW || process.env.ENEMY_LIFT_EXIT_REVIEW || process.env.LIFT_RIDER_REVIEW || process.env.TUTORIAL_FLOW_REVIEW || process.env.FEEDBACK_POLISH_REVIEW || process.env.PLAYTEST_POLISH_REVIEW || process.env.SMART_PANEL_REVIEW || process.env.SMART_MOTION_REVIEW) ? path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf') : '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','Oxanium');
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
 function scene(c,cx,cy){w.gameCamera={centerX:cx,y:cy};w.renderer.zoomLevel=1;c.fillStyle='#111322';c.fillRect(0,0,1920,1080);c.drawImage(bg,0,0,1920,1080);c.save();c.translate(960-cx,-cy);c.drawImage(fg,0,2,fg.width,fg.height-2,-152,-550+2*1589/fg.height,4400,1589-2*1589/fg.height);w.drawGround(c);if(process.env.PLAYTEST_POLISH_REVIEW)w.BARCODE.stageFX.drawWorld(c);w.drawGameEntities(c);if(p.getLiftActorLayer(w.player)!=='behind')w.player.draw(c);p.drawSignalLift(c,'front');c.restore();c.save();c.translate(0,-cy);w.spaceShipSystem.drawForegroundShips(c);c.restore();if(!w.tutorialSystem?.isActive?.()&&!process.env.PLAYTEST_POLISH_REVIEW&&!process.env.BOSS_MUSIC_REVIEW)w.drawObjectives(c);}
 function setHero(x,foot,support){Object.assign(w.player.position,{x,y:foot-72});w.player.velocity.x=0;w.player.velocity.y=0;w.player.grounded=true;w.player.supportedSurfaceId=support||null;w.player.state='idle';w.player.airInput=0;w.player.controlsDisabled=false;w.player.invulnerableUntil=0;w.player.health=w.player.maxHealth;w.player.playAnimation('idle');}
 const canvas=createCanvas(1920,1080),c=canvas.getContext('2d');
 if(process.env.CONTROL_POLISH_REVIEW){
  const assert=require('assert');load(context,'src/core/gamepad-ui.js');
  const H=w.BARCODE.ComicHUD,settings=w.BARCODE.ControllerSettings;
  const metrics=[],sheet=createCanvas(1280,1020),sc=sheet.getContext('2d');
  sc.fillStyle='#182334';sc.fillRect(0,0,1280,1020);
  const cases=[['Keyboard','keyboard',3],['Xbox','xbox',3],['PlayStation','playstation',3],['Remapped PlayStation','playstation',7]];
  for(const [i,[title,device,binding]] of cases.entries()){
   p.state='jammer_active';p.closedGateEncounterId=null;p.pendingSpawns=[];setHero(2300,856);
   const enemy=new w.Enemy(2420,784,'virus');Object.assign(enemy.position,{x:2420,y:784});
   Object.assign(enemy,{entranceComplete:true,_authoredEntranceActive:false,spawnTimeMs:-10000,spawnProtectionDuration:0});
   enemy.initSprite();enemy.playAnimation('idle');w.enemyManager.enemies=[enemy];
   w.BARCODE.GamepadUI.connected=device!=='keyboard';settings.labels=device;settings.bindings.interact=binding;
   // Reproduce the caller's old middle-baseline state without leaking it into
   // the marker. This is the same production draw path for both platforms.
   c.textBaseline='middle';scene(c,2380,0);
   const x=(i%2)*640,y=Math.floor(i/2)*510;
   sc.drawImage(canvas,770,550,460,330,x,y+46,640,459);
   sc.font='bold 24px Oxanium, monospace';sc.fillStyle='#eee8d6';sc.textBaseline='middle';sc.fillText(title+' — '+settings.prompt('interact','H'),x+20,y+24);
  }
  fs.writeFileSync(path.join(out,'control-alignment.webp'),sheet.toBuffer('image/webp',92));
  const badges=createCanvas(1200,320),bc=badges.getContext('2d');bc.fillStyle='#263446';bc.fillRect(0,0,1200,320);
  for(const [i,label] of ['H','Y','△','✕','LB','R2','↓','Space','Submit','⌫'].entries()){
   const width=label.length>2?100:48,height=40,pixel=createCanvas(width,height),pc=pixel.getContext('2d');
   pc.font='bold 26px Oxanium, monospace';pc.fillStyle='#a98ee9';
   let reference=null;
   for(const baseline of ['alphabetic','middle','top','bottom']){
    pc.clearRect(0,0,width,height);pc.textBaseline=baseline;pc.textAlign='right';
    H.buttonText(pc,label,0,0,width,height);
    const bytes=pixel.toBuffer('image/png');if(reference)assert(reference.equals(bytes),'baseline-independent ink: '+label);reference=bytes;
    assert.equal(pc.textBaseline,baseline,'canvas state restored');assert.equal(pc.textAlign,'right');
   }
   const rgba=pc.getImageData(0,0,width,height).data;let minX=width,minY=height,maxX=-1,maxY=-1;
   for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>64){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
   assert(maxX>=0,'visible glyph: '+label);
   const dx=(minX+maxX+1-width)/2,dy=(minY+maxY+1-height)/2;
   assert(Math.abs(dx)<=1&&Math.abs(dy)<=1,'centered native ink: '+label+' '+dx+','+dy);
   metrics.push({label,width,height,inkCenterErrorPx:{x:dx,y:dy},inheritedBaselines:4});
   const x=30+(i%5)*238,y=35+Math.floor(i/5)*145;
   bc.fillStyle='#0b1017';bc.fillRect(x,y,width*2,height*2);bc.drawImage(pixel,x,y,width*2,height*2);
  }
  fs.writeFileSync(path.join(out,'button-glyphs.webp'),badges.toBuffer('image/webp',95));
  fs.writeFileSync(path.join(out,'native-control-metrics.json'),JSON.stringify({renderer:'native Canvas with bundled Oxanium',metrics,scope:'40 pixel comparisons; adapted Makko art; not hosted/controller acceptance'},null,2)+'\n');
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));console.log('Four production enemy prompts and 40 native glyph/baseline comparisons passed.');return;
 }
 if(process.env.BOSS_MUSIC_REVIEW){
  const store=new Map();w.localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  for(const file of ['src/game/lore-collection.js','src/game/level-difficulty.js','src/game/campaign-services.js'])load(context,file);
  w.lostDataSystem.archive=new w.BARCODE.LoreCollection();w.lostDataSystem.collectedLore=new Set(['lore.l01.01','lore.l01.02']);w.lostDataSystem.getProgress=()=>({collected:2});
  w.BARCODE.LevelDifficulty.beginLevel();w.BARCODE.LevelDifficulty.select(1);w.BARCODE.LevelDifficulty.confirm();w.BARCODE.Campaign.begin();
  // Stage the combat pose directly: this native pack contains the production
  // idle/attack sheets; hosted walk-in is covered by the integration rig.
  p.boss={x:3150,y:784,sprite:sprite(),activeAnimation:null};p.enterBossReady();p.state='boss_combat';
  setHero(2980,856);p.boss.cycle=2;p.boss.health=4;p.setBossCombatPhase('telegraph');p.boss.phaseElapsedMs=700;
  function save(name){fs.writeFileSync(path.join(out,name+'.webp'),canvas.toBuffer('image/webp',88));}
  scene(c,3000,0);w.drawBasicUI(c);w.drawSector1BossUI(c);save('boss-slam-warning');
  setHero(2710,856);p.setBossCombatPhase('sweep');scene(c,3000,0);w.drawBasicUI(c);w.drawSector1BossUI(c);save('boss-slam-escape');
  Object.assign(w.BARCODE.Campaign.run,{elapsedMs:185000,damageTaken:1,retries:1,attempts:53,accurate:48,perfect:40,connected:45,connectedPerfect:38});
  w.gameState.score=8500;p.completeLevel();for(let i=0;i<180;i++)p.updateCompletionPresentation(20);
  w.drawSector1BossUI(c);save('campaign-results');
  w.BARCODE.Campaign.openIntermission();w.drawSector1BossUI(c);save('campaign-handoff');
  w.BARCODE.Campaign.closeIntermission();load(context,'src/game/pause-menu.js');w.isPaused=true;w.BARCODE.PauseMenu.open=true;w.BARCODE.PauseMenu.draw(c);save('dynamic-music-setting');
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));console.log('Five production boss, results, intermission and settings captures rendered.');return;
 }
 if(process.env.ENEMY_LIFT_EXIT_REVIEW){
  p.state='jammer_active';p.closedGateEncounterId=null;p.pendingSpawns=[];
  const preview=createCanvas(960,540),pc=preview.getContext('2d'),lift=p.signalLift;
  for(const direction of [-1,1]){
   p.resetSignalLift();setHero(lift.x+lift.w/2+direction*900,856);
   const crowd=['firewall','corrupted'].map((type,i)=>{
    const x=lift.x+lift.w/2-35+i*70,e=new w.Enemy(x,784,type);
    Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,_sector1MissionEnemy:true,
      combatPattern:'approach',combatPatternMs:0,supportedSurfaceId:lift.id});
    Object.assign(e.position,{x,y:784});e.velocity.x=e.velocity.y=0;e.initSprite();e.playAnimation('idle');return e;
   });
   w.enemyManager.enemies=crowd;
   for(let i=0;i<240;i++){w.gameState.gameTime+=1000/60;w.enemyManager.update(1000/60,w.player);p.updateSignalLift(1000/60);}
   if(!crowd.every(e=>direction>0?e.position.x>lift.x+lift.w:e.position.x<lift.x))throw new Error('Native active enemies remain trapped');
   scene(c,2500,0);w.BARCODE.sceneProjection.capture({getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})});w.drawGameUI(c);pc.drawImage(canvas,0,0,960,540);
   fs.writeFileSync(path.join(out,'exit-'+(direction>0?'right':'left')+'.webp'),preview.toBuffer('image/webp',90));
  }
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native active Firewall/Corrupted manager pursuit exits both sides of the grounded elevator.');return;
 }
 if(process.env.LIFT_RIDER_REVIEW){
  p.state='jammer_active';p.closedGateEncounterId=null;p.pendingSpawns=[];
  const traffic=w.spaceShipSystem;traffic.resetRuntime();traffic.spawnShip=()=>{};
  const preview=createCanvas(960,540),pc=preview.getContext('2d'),lift=p.signalLift;
  const guard=new w.Enemy(2520,p.getLiftRoof().topY-72,'corrupted');
  Object.assign(guard,{entranceComplete:true,_authoredEntranceActive:false,_hijackIdle:true,supportedSurfaceId:'signal-lift-roof'});
  Object.assign(guard.position,{x:2520,y:p.getLiftRoof().topY-72});guard.velocity.x=guard.velocity.y=0;guard.initSprite();guard.playAnimation('idle');w.enemyManager.enemies=[guard];
  setHero(2450,lift.y,lift.id);p.chargeSignalLift();p.chargeSignalLift();
  const frames=[];
  function draw(cx,cy){scene(c,cx,cy);w.BARCODE.sceneProjection.capture({getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})});w.drawGameUI(c);traffic.drawTrafficWarnings(c);pc.drawImage(canvas,0,0,960,540);}
  function still(name){fs.writeFileSync(path.join(out,name+'.webp'),preview.toBuffer('image/webp',90));}
  const movie=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','24','-vcodec','mjpeg','-i','pipe:0','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'lift-full-cycle.mp4')],{stdio:['pipe','ignore','pipe']});
  let errors='';movie.stderr.on('data',b=>errors+=b);
  for(let i=0;i<240;i++){
   const dt=1000/24;w.gameState.gameTime=i*dt;
   w.player.update(dt,true);guard.update(dt,w.player,i*dt);p.updateSignalLift(dt);
   const roof=p.getLiftRoof(),body=p.getRoofActorBounds(guard);
   if(w.player.supportedSurfaceId!==lift.id||guard.supportedSurfaceId!==roof.id||Math.abs(w.player.position.x-2450)>.001||Math.abs(body.y+body.height-roof.topY)>.001)throw new Error('Native ride lost support');
   draw(2450,Math.min(0,lift.y-720));
   if([55,115,150,220].includes(i))still('ride-'+i);
   frames.push({ms:(i+1)*dt,liftY:lift.y,playerX:w.player.position.x,playerFoot:w.player.position.y+72,roofFoot:body.y+body.height,state:lift.state});
   if(!movie.stdin.write(preview.toBuffer('image/jpeg',86)))await once(movie.stdin,'drain');
  }
  movie.stdin.end();const [exit]=await once(movie,'close');if(exit)throw new Error(errors);
  w.enemyManager.enemies=[];setHero(2200,358,'firewall-canopy');draw(2200,0);still('platform-removed-and-reused');
  traffic.warningImage=await loadImage(path.join(root,'assets/traffic-warning/watch-out.webp'));
  for(const direction of [1,-1]){
   traffic.resetRuntime();const car=traffic.createForegroundShip(true);
   Object.assign(car,{direction,speed:72.5*direction,flipH:direction<0,x:direction>0?-2370:4290,y:-200,shipType:0,bobAmount:0});traffic.update(1000);
   setHero(1700,-169,'cache-crown');draw(1700,-550);still('warning-danger-'+(direction>0?'left':'right'));
   setHero(1700,330,'cache-awning');draw(1700,-550);still('warning-safe-'+(direction>0?'left':'right'));
   setHero(1700,-169,'cache-crown');draw(1700,0);still('warning-offscreen-'+(direction>0?'left':'right'));
  }
  fs.writeFileSync(path.join(out,'ride-evidence.json'),JSON.stringify(frames,null,2));
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native ten-second full floor/roof ride, platform removal/reuse, and danger/safe/offscreen warning stills rendered.');return;
 }
 if(process.env.SMART_MOTION_REVIEW){
  for(const file of ['src/core/action-input.js','src/core/gamepad-ui.js','src/core/input.js','src/game/tutorial.js'])load(context,file);
  p.reset();w.hackingSystem=new w.HackingSystem();w.inputManager=new w.InputManager();
  const t=w.tutorialSystem,h=w.hackingSystem;t.startTutorial();setHero(1000,856);t.handleSpacePress();
  const preview=createCanvas(960,540),pc=preview.getContext('2d'),layouts=[];
  const foe=(x,foot)=>{const e=new w.Enemy(x,foot-72,'firewall');Object.assign(e.position,{x,y:foot-72});Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,spawnProtectionDuration:0,spawnTimeMs:-10000});e.initSprite();e.playAnimation('idle');return e;};
  const movingFoe=foe(1700,856);w.enemyManager.enemies=[movingFoe];
  function frame(){scene(c,960,0);w.BARCODE.sceneProjection.capture({getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})});t.draw(c);w.drawGameUI(c);pc.drawImage(canvas,0,0,960,540);}
  function still(name){fs.writeFileSync(path.join(out,name+'.webp'),preview.toBuffer('image/webp',90));}
  const movie=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','24','-vcodec','mjpeg','-i','pipe:0','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'smart-box-motion.mp4')],{stdio:['pipe','ignore','pipe']});
  let errors='';movie.stderr.on('data',b=>errors+=b);
  for(let i=0;i<168;i++){
   w.gameState.gameTime=i*1000/24;
   // Staged production poses isolate the UI behavior for review.
   const rise=Math.max(0,Math.min(1,(i-35)/25));movingFoe.position.y=784-rise*460;
   w.player.velocity.x=i<28?170:0;w.player.grounded=i<28;w.player.position.x=900+Math.min(i,28)*4;
   frame();layouts.push({frame:i,layout:t._dialogueLayout});
   if([20,49,54,100].includes(i))still('story-'+i);
   if(!movie.stdin.write(preview.toBuffer('image/jpeg',86)))await once(movie.stdin,'drain');
  }
  movie.stdin.end();const [exit]=await once(movie,'close');if(exit)throw new Error(errors);
  t.active=false;t.completed=true;p.startMission();p.state='jammer_active';p.pendingSpawns=[];p.closedGateEncounterId=null;
  w.enemyManager.enemies=[100,450,700,1220,1580,1810].map(x=>foe(x,856));setHero(960,856);h.reset();if(!h.start())throw new Error('Real crowded hack must open');
  h.update(h.bootDurationMs+h.displayTime+1);frame();w.gameState.gameTime+=400;frame();still('hack-crowded');
  const target=h.hijackTarget;target.position.y=320;frame();w.gameState.gameTime+=300;frame();still('hack-raised-target');
  fs.writeFileSync(path.join(out,'motion-evidence.json'),JSON.stringify(layouts,null,2));
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native motion: seven-second staged production capture, four story frames and two adaptive hack layouts.');return;
 }
 if(process.env.SMART_PANEL_REVIEW){
  for(const file of ['src/core/action-input.js','src/core/gamepad-ui.js','src/core/input.js','src/game/tutorial.js'])load(context,file);
  p.reset();w.hackingSystem=new w.HackingSystem();w.inputManager=new w.InputManager();
  const t=w.tutorialSystem,h=w.hackingSystem;t.startTutorial();setHero(1000,856);
  const acknowledge=()=>{if(!t.readyToAdvance)t.handleSpacePress();t.handleSpacePress();};
  const preview=createCanvas(960,540),pc=preview.getContext('2d');
  function save(name,cx=960,cy=0){scene(c,cx,cy);w.BARCODE.sceneProjection.capture({getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})});w.drawTacticalFocusCue(c);t.draw(c);w.drawGameUI(c);pc.drawImage(canvas,0,0,960,540);fs.writeFileSync(path.join(out,name+'.webp'),preview.toBuffer('image/webp',90));}
  t.handleSpacePress();save('01-calm-story');
  w.player.jump();w.player.update(180,true);t.update(180);save('02-jump-story-hidden',960,-150);
  setHero(1000,856);save('03-story-resumes');
  t.startChapter(1);acknowledge();acknowledge();acknowledge();t.update(2100);w.updateEnemies(700);
  const awning=p.getStageSurfaces().find(s=>s.id==='signal-awning');setHero(1000,awning.y,awning.id);
  save('04-rooftop-stomp-task',960,-150);
  w.player.jump();w.player.update(160,true);t.update(160);save('05-airborne-stomp-task',960,-150);
  t.active=false;t.completed=true;h.reset();p.startMission();p.state='jammer_active';p.closedGateEncounterId=null;p.pendingSpawns=[];w.enemyManager.clear();w.spaceShipSystem.ships=[];
  w.navigator.getGamepads=()=>[{id:'Sony DualSense',connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))}];w.inputManager.update();
  for(const side of [1,-1]){
   h.reset();setHero(960,856);const target=new w.Enemy(960+side*300,784,'firewall');Object.assign(target.position,{x:960+side*300,y:784});Object.assign(target,{entranceComplete:true,_authoredEntranceActive:false,spawnProtectionDuration:0,spawnTimeMs:-10000});target.initSprite();target.playAnimation('idle');w.enemyManager.enemies=[target];
   if(!h.start())throw new Error('Review must open the real target hack');h.update(h.bootDurationMs+h.displayTime+1);save(side===1?'06-hack-target-right':'07-hack-target-left');
   if(side===-1){h.inputText=h.currentPuzzle.answer;h.processInput('Enter');save('08-hack-result-clear');}
  }
  h.reset();w.enemyManager.clear();
  for(const state of ['ground','floor','roof','under']){
   p.resetSignalLift();const lift=p.signalLift;lift.y=lift.prevY=state==='ground'?856:650;
   const roof=p.getLiftRoof(),foot=state==='roof'?roof.topY:state==='floor'?lift.y:856;
   setHero(lift.x+lift.w*.17,foot,state==='under'?null:state==='roof'?roof.id:lift.id);
   const target=new w.Enemy(lift.x+lift.w*.81,foot-72,'firewall');Object.assign(target.position,{x:lift.x+lift.w*.81,y:foot-72});Object.assign(target,{entranceComplete:true,_authoredEntranceActive:false,spawnProtectionDuration:0,spawnTimeMs:-10000});target.initSprite();target.playAnimation('idle');w.enemyManager.enemies=[target];
   save('lift-'+state,lift.x+lift.w/2,state==='roof'?-80:160);
  }
  const storage=new Map();w.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  for(const file of ['src/game/lore-records.js','src/game/lore-collection.js','src/engine/lore.js','src/game/level-01-stage-fx.js'])load(context,file);
  w.lostDataSystem.archive=new w.BARCODE.LoreCollection();w.initLore();const stage=w.BARCODE.stageFX,lore=w.loreSystem;
  function streetFoe(x){const e=new w.Enemy(x,784,'firewall');Object.assign(e.position,{x,y:784});Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,spawnProtectionDuration:0,spawnTimeMs:-10000});e.initSprite();e.playAnimation('idle');return e;}
  setHero(1000,awning.y,awning.id);w.enemyManager.enemies=[streetFoe(1200)];lore.displayLoreMessage(w.BARCODE.LoreRecords.preview('lore.l01.01'),'lore.l01.01');lore.update(500);save('09-lore-clear',960,-150);
  p.state='encounter_3';const detail=stage.details.find(d=>d.id==='egg.l01.cliff-maintenance');setHero(detail.x,detail.y);w.enemyManager.enemies=[streetFoe(detail.x+130)];stage.update(16);if(!stage.inspect().ok)throw new Error('Review must open a real inspection');save('10-inspect-clear',detail.x,-150);
  w.player.jump();w.player.update(160,true);stage.update(160);lore.update(160);save('11-inspect-play-hidden',detail.x,-150);
  stage.message=null;lore.reset();h.reset();setHero(960,856);w.enemyManager.enemies=[100,450,700,1220,1580,1810].map(streetFoe);
  if(!h.start())throw new Error('Review must open crowded hack');h.update(h.bootDurationMs+h.displayTime+1);save('12-hack-crowd-clear');
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native review: calm/hidden/resumed story, rooftop stomp practice, both hack target sides/result, and front rails over ground/floor/roof/underpass actors.');return;
 }
 if(process.env.PLAYTEST_POLISH_REVIEW){
  for(const file of ['src/core/action-input.js','src/core/gamepad-ui.js','src/core/input.js','src/game/tutorial.js','src/game/lore-records.js','src/game/lore-collection.js','src/engine/lore.js','src/game/level-01-stage-fx.js'])load(context,file);
  const storage=new Map();w.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  w.lostDataSystem.archive=new w.BARCODE.LoreCollection();w.initLore();
  p.reset();w.hackingSystem=new w.HackingSystem();w.inputManager=new w.InputManager();
  const t=w.tutorialSystem,h=w.hackingSystem;t.startTutorial();setHero(660,856,null);
  const acknowledge=()=>{if(!t.readyToAdvance)t.handleSpacePress();t.handleSpacePress();};
  const preview=createCanvas(960,540),pc=preview.getContext('2d');
  function frame(cx=960,cy=0){scene(c,cx,cy);w.drawTacticalFocusCue(c);t.draw(c);w.drawGameUI(c);pc.drawImage(canvas,0,0,960,540);}
  function save(name,cx=960,cy=0){frame(cx,cy);fs.writeFileSync(path.join(out,name+'.webp'),preview.toBuffer('image/webp',90));}
  t.handleSpacePress();save('01-dialogue');for(let i=0;i<4;i++)acknowledge();save('02-move-task');t.checkObjective('movement');save('03-jump-task');
  w.navigator.getGamepads=()=>[{id:'Sony DualSense',connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))}];w.inputManager.update();t.startChapter(1);acknowledge();acknowledge();t.handleSpacePress();save('04-controller-briefing');
  t.startChapter(3);h.start();h.update(h.bootDurationMs+h.displayTime+1);t.update(0);save('05-terminal-only');
  h.inputText=h.currentPuzzle.answer;h.processInput('Enter');t.update(0);save('06-hack-result');h.update(1100);t.update(0);t.handleSpacePress();save('07-story-resumes');
  t.active=false;t.completed=true;h.reset();p.startMission();p.state='jammer_active';p.closedGateEncounterId=null;p.pendingSpawns=[];w.enemyManager.clear();w.loreSystem.reset();w.spaceShipSystem.ships=[];
  function foe(type,x,foot){const e=type==='drone'?new w.RooftopDrone(x,foot-57,{x:x-180,w:360}):new w.Enemy(x,foot-72,type);Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,spawnProtectionDuration:0,spawnTimeMs:-10000});Object.assign(e.position,{x,y:foot-(type==='drone'?57:72)});if(type!=='drone'){e.initSprite();e.playAnimation('idle');}return e;}
  setHero(800,856,null);w.enemyManager.enemies=[foe('corrupted',970,856),foe('virus',380,856),foe('firewall',180,856)];h.start();
  const movie=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate','24','-i','pipe:0','-c:v','libx264','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'hack-dilation.mp4')],{stdio:['pipe','ignore','pipe']});
  let errors='';movie.stderr.on('data',b=>errors+=b);
  for(let i=0;i<144;i++){w.enemyManager.update(1000/24,w.player);h.update(1000/24);frame();if(i===45)save('08-hack-tracers');if(!movie.stdin.write(preview.toBuffer('image/jpeg',85)))await once(movie.stdin,'drain');}
  movie.stdin.end();const [code]=await once(movie,'close');if(code)throw new Error(errors);h.reset();w.enemyManager.clear();
  p.state='encounter_2';const stage=w.BARCODE.stageFX;stage.reset(p);const spot=stage.ratSpot;setHero(spot.x,spot.y,spot.surfaceId);w.gameCamera.centerX=spot.x;
  const e=foe('corrupted',spot.x+80,spot.y);w.enemyManager.enemies=[e];w.loreSystem.displayLoreMessage('A recovered transmission waits while the crew speaks.');w.loreSystem.update(500);stage.update(16);stage.inspect();stage.update(2200);w.loreSystem.update(2200);save('09-studio-rat-clear',spot.x,spot.y-650);
  stage.update(4100);w.loreSystem.update(16);save('10-inspection-resumes',spot.x,spot.y-650);stage.inspect();stage.inspect();w.loreSystem.update(16);save('11-lore-resumes',spot.x,spot.y-650);
  w.loreSystem.reset();stage.reset(p);w.enemyManager.clear();p.state='jammer_active';
  for(const state of ['ground','riders','under']){
   p.resetSignalLift();const lift=p.signalLift;lift.y=lift.prevY=state==='ground'?856:650;
   const x=lift.x+lift.w/2,foot=state==='riders'?lift.y:856;setHero(x+55,foot,state==='under'?null:lift.id);
   w.enemyManager.enemies=[foe('firewall',x-55,foot)];save('lift-'+state,x,160);
  }
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native review: alternating tutorial, hack result/story, six-second dilation video, Studio Rat/inspect/lore sequencing, and ground/rider/underpass lift states.');return;
 }
 if(process.env.FEEDBACK_POLISH_REVIEW){
  p.state='jammer_active';p.closedGateEncounterId=null;w.enemyManager.enemies=[];setHero(50,856,null);
  const sheet=createCanvas(1200,900),sc=sheet.getContext('2d');sc.fillStyle='#080f17';sc.fillRect(0,0,1200,900);
  const steps=w.Sector1Progression.TRAVERSAL_PROPS.filter(x=>!x.asset);
  for(let i=0;i<steps.length;i++){
   const prop=steps[i];scene(c,prop.x+prop.w/2,prop.y-140);
   const x=(i%3)*400,y=Math.floor(i/3)*300;
   sc.drawImage(canvas,700,0,520,360,x,y+28,400,272);sc.fillStyle='#d2ece0';sc.font='17px Oxanium';sc.fillText(prop.id,x+12,y+21);
  }
  fs.writeFileSync(path.join(out,'platform-mounts.webp'),sheet.toBuffer('image/webp',90));
  for(const time of [3000,4050]){
   p.districtSignal.elapsedMs=time;scene(c,590,430);
   const crop=createCanvas(700,570),cc=crop.getContext('2d');cc.drawImage(canvas,650,0,700,570,0,0,700,570);
   fs.writeFileSync(path.join(out,'terminal-'+time+'.webp'),crop.toBuffer('image/webp',90));
  }
  const faces=createCanvas(1050,230),fc=faces.getContext('2d');fc.fillStyle='#080f17';fc.fillRect(0,0,1050,230);
  for(let frame=0;frame<6;frame++){w.BARCODE.PresentationAssets.draw('hudExpressions',fc,{x:87+frame*175,y:97,width:172,height:172,frame});fc.fillStyle='#ddf4e5';fc.font='16px Oxanium';fc.fillText(['Neutral','Damage','Good streak','Charging','Low health','Relief / win'][frame],frame*175+20,212);}
  fs.writeFileSync(path.join(out,'hud-faces.webp'),faces.toBuffer('image/webp',92));
  setHero(660,856,null);w.rhythmSystem.showRhythmMode();
  const lanes=createCanvas(1500,450),lc=lanes.getContext('2d');lc.fillStyle='#080f17';lc.fillRect(0,0,1500,450);
  for(const [i,timing] of ['perfect','excellent','miss'].entries()){
   lc.save();lc.translate(i*500,-80);lc.scale(.7,.7);
   w.BARCODE.ComicHUD.rhythm(lc,{lane:{ready:true,notes:[{x:66,index:1,timing},{x:148,index:2},{x:230,index:3},{x:312,index:4,downbeat:true}]},pattern:'pulse',combo:timing==='miss'?0:4,established:true,tempoBeat:4,tempoBeats:4});lc.restore();
   lc.fillStyle='#ddf4e5';lc.font='22px Oxanium';lc.fillText(timing.toUpperCase(),i*500+28,296);
  }
  fs.writeFileSync(path.join(out,'beat-results.webp'),lanes.toBuffer('image/webp',90));
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native feedback review: nine mounted platforms, terminal placement/glitch, six portrait states, three beat outcomes.');return;
 }
 if(process.env.TUTORIAL_FLOW_REVIEW){
  for(const file of ['src/core/action-input.js','src/core/gamepad-ui.js','src/core/input.js','src/game/tutorial.js'])load(context,file);
  p.reset();w.hackingSystem=new w.HackingSystem();w.inputManager=new w.InputManager();
  const t=w.tutorialSystem;t.startTutorial();setHero(660,856,null);
  const pad={id:'Sony DualSense',connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false}))};
  const usePad=enabled=>{w.navigator.getGamepads=()=>enabled?[pad]:[];w.inputManager.update();};
  const acknowledge=()=>{if(!t.readyToAdvance)t.handleSpacePress();t.handleSpacePress();};
  const preview=createCanvas(960,540),pc=preview.getContext('2d');
  function save(name){scene(c,960,0);t.draw(c);w.drawGameUI(c);pc.drawImage(canvas,0,0,960,540);fs.writeFileSync(path.join(out,name+'.webp'),preview.toBuffer('image/webp',88));}
  t.update(450);save('01-keyboard-move');t.checkObjective('movement');save('02-keyboard-jump');
  usePad(true);t.startChapter(1);acknowledge();acknowledge();t.handleSpacePress();save('03-stomp-briefing');acknowledge();t.update(2100);
  for(const e of w.enemyManager.enemies){e.update(600,w.player,600);}save('04-stomp-practice');
  w.enemyManager.clear();t.startChapter(2);setHero(660,856,null);w.rhythmSystem.showRhythmMode();t.update(0);acknowledge();t.handleSpacePress();save('05-rhythm-beats');
  w.rhythmSystem.combo=5;t.update(0);t.handleSpacePress();save('06-rhythm-exit');w.inputManager.leaveRhythmMode();
  t.startChapter(3);w.hackingSystem.start();w.hackingSystem.update(w.hackingSystem.bootDurationMs);t.update(0);save('07-hack-read');
  w.hackingSystem.update(w.hackingSystem.displayTime+1);t.update(0);save('08-hack-input');
  w.hackingSystem.inputText=w.hackingSystem.currentPuzzle.answer;w.hackingSystem.processInput('Enter');t.update(0);t.handleSpacePress();save('09-hack-return-to-story');
  w.hackingSystem.reset();t.startChapter(4);for(let i=0;i<4;i++)acknowledge();t.handleSpacePress();save('10-final-continue');
  t.completeTutorial();p.startMission();p.pendingSpawns=[];w.enemyManager.clear();setHero(750,856,null);
  const e=new w.Enemy(840,784,'corrupted');Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,spawnProtectionDuration:0});Object.assign(e.position,{x:840,y:784});e.initSprite();e.playAnimation('idle');w.enemyManager.enemies=[e];t.update(16);save('11-first-enemy-hack');
  w.enemyManager.hijackEnemy(e);t.update(16);save('12-first-ally');
  if(calls.errors.length)throw new Error(calls.errors.join('\n'));
  console.log('Native tutorial review: 12 production HUD/story/terminal states, bundled Oxanium font and artwork.');return;
 }
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
