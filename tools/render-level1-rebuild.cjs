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
 function sprite(){const s=createSprite(Object.fromEntries(Object.entries(clips).map(([k,v])=>[k,v.frames.length]))),old=s.play;
  s.isLoaded=()=>true;s.getHitboxWorld=()=>null;
  s.play=function(...args){const r=old.apply(s,args),a=clips[args[0]],anchor=a.meta.meta.anchor||{x:a.frames[0].frame.w/2,y:308};
   s.currentSprite.getAnchorPoint=()=>anchor;s.currentSprite.hasManifestAnchor=()=>true;s.currentSprite.getManifestScale=()=>1;
   s.currentSprite.metadata.frames=Object.fromEntries(a.frames.map((f,i)=>[String(i),{...f,duration:f.duration||83}]));return r;};
  s.draw=(c,x,y,o={})=>{const a=clips[s.getCurrentAnimation()];if(!a)return;const f=a.frames[s.currentSprite.currentFrame%a.frames.length].frame,anchor=s.currentSprite.getAnchorPoint(),scale=o.scale||1;c.save();c.globalAlpha*=o.alpha??1;c.translate(x,y);c.scale(o.flipH?-scale:scale,scale);c.drawImage(a.image,f.x,f.y,f.w,f.h,-anchor.x,-anchor.y,f.w,f.h);c.restore();};return s;
 }
 w.MakkoEngine.sprite=sprite;w.player.sprite=sprite();w.player.spriteReady=true;w.player.playAnimation('idle');
 load(context,'src/game/combat-fx.js');load(context,'src/game/render-coordinator.js');load(context,'src/game/hacking.js');load(context,'src/engine/traffic-sheets.js');load(context,'src/engine/spaceships.js');w.SpaceShipSystem.prototype.loadShipImages=function(){};w.spaceShipSystem=new w.SpaceShipSystem();
 for(let i=0;i<3;i++){w.spaceShipSystem.shipImages[i]=await loadImage(path.join(root,'assets/traffic/ship-'+(i+1)+'.webp'));w.spaceShipSystem.imagesLoaded[i]=true;w.spaceShipSystem.shipSheets[i]=w.BARCODE.trafficSheets[i];}
 const bg=await loadImage(path.join(root,'assets/world-v3/far-background.webp')),fg=await loadImage(path.join(root,'assets/world-v3/buildings.webp'));
 p.startMission();w.rhythmSystem.hideRhythmMode();w.player.allowMovement=true;
 function scene(c,cx,cy){w.gameCamera={centerX:cx,y:cy};w.renderer.zoomLevel=1;c.fillStyle='#111322';c.fillRect(0,0,1920,1080);c.drawImage(bg,0,0,1920,1080);c.save();c.translate(960-cx,-cy);c.drawImage(fg,0,2,fg.width,fg.height-2,-152,-550+2*1589/fg.height,4400,1589-2*1589/fg.height);w.drawGround(c);p.draw(c);w.enemyManager.enemies.forEach(e=>e.draw(c));w.player.draw(c);w.spaceShipSystem.drawHazards(c);c.restore();w.BARCODE.ComicHUD.objectives(c,{title:p.state==='encounter_4'?'BROADCAST GATE':'CLEAR THE DISTRICT',detail:'Explore the upper route',kick:0});}
 function setHero(x,foot,support){Object.assign(w.player.position,{x,y:foot-72});w.player.velocity.x=0;w.player.velocity.y=0;w.player.grounded=true;w.player.supportedSurfaceId=support||null;w.player.state='idle';w.player.playAnimation('idle');}
 const canvas=createCanvas(1920,1080),c=canvas.getContext('2d');
 p.state='encounter_1';p.closedGateEncounterId=p.state;p.spawnedEncounterIds.add(p.state);
 setHero(1110,856);const firewall=new w.Enemy(850,784,'firewall');Object.assign(firewall.position,{x:850,y:784});firewall._sector1MissionEnemy=true;firewall.entranceComplete=true;firewall.spawnProtectionDuration=0;firewall.pollSpriteReady();firewall.playAnimation('walk');w.enemyManager.enemies=[firewall];
 scene(c,1080,0);fs.writeFileSync(path.join(out,'street-barrier.png'),canvas.toBuffer('image/png'));
 p.state='encounter_4';p.closedGateEncounterId=p.state;setHero(3250,650,'tower-utility-unit');w.enemyManager.enemies=[];scene(c,3190,0);fs.writeFileSync(path.join(out,'utility-box.png'),canvas.toBuffer('image/png'));
 const roof=w.Sector1Progression.STAGE_SURFACES.find(p=>p.id==='tower-crown');const drone=new w.RooftopDrone(3490,-500,roof);drone._sector1MissionEnemy=true;drone.spawnProtectionDuration=0;w.enemyManager.enemies=[drone];setHero(3340,-314,'tower-crown');scene(c,3160,-914);fs.writeFileSync(path.join(out,'rooftop-drone.png'),canvas.toBuffer('image/png'));
 const hack=w.hackingSystem=new w.HackingSystem();hack.active=true;hack.phase='answer';hack.puzzleType=2;hack.currentPuzzle={type:2,answer:'4061',hidden:true};hack.inputText='40';hack.useKeypad();scene(c,3160,-914);hack.draw(c);fs.writeFileSync(path.join(out,'keypad.png'),canvas.toBuffer('image/png'));hack.active=false;
 if(process.env.REVIEW_STILLS_ONLY)return console.log('Four production stills rendered.');
 const video=createCanvas(1280,720),v=video.getContext('2d');const ff=spawn('/usr/bin/ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgba','-s','1280x720','-r','30','-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'Level1-Rebuild-Motion.mp4')],{stdio:['pipe','ignore','pipe']});let err='';ff.stderr.on('data',d=>err+=d);
 for(let i=0;i<480;i++){
  if(i===0){p.state='encounter_1';p.closedGateEncounterId=p.state;setHero(1110,856);Object.assign(firewall.position,{x:770,y:784});firewall.combatPattern='approach';firewall.combatPatternMs=0;w.enemyManager.enemies=[firewall];}
  if(i<180){const dx=i<90?1:-1;dx>0?w.player.moveRight():w.player.moveLeft();w.player.update(1000/30);p.applyGateCollision();firewall.update(1000/30,w.player,i*1000/30);}
  if(i===180){p.state='encounter_4';p.closedGateEncounterId=p.state;setHero(3330,-314,'tower-crown');w.enemyManager.enemies=[drone];drone.active=true;drone.dronePhase='patrol';drone.dronePhaseMs=0;}
  if(i>=180&&i<300){drone.update(1000/30,w.player,i*1000/30);w.player.update(1000/30);}
  if(i===300){w.enemyManager.enemies=[];setHero(3440,-314,'tower-crown');w.spaceShipSystem.createForegroundShip();}
  if(i>=300){w.spaceShipSystem.updateHazards(1000/30);w.player.update(1000/30);}
  v.setTransform(2/3,0,0,2/3,0,0);scene(v,i<180?1080:3160,i<180?0:-914);
  v.fillStyle='rgba(8,12,20,.9)';v.fillRect(20,1010,820,46);v.fillStyle='#fff';v.font='22px Oxanium';v.fillText(i<180?'Native review · Firewall travel and turns':i<300?'Native review · Roof edge and drone windup':'Native review · Existing car art and lane warning',35,1042);
  if(!ff.stdin.write(Buffer.from(v.getImageData(0,0,1280,720).data)))await once(ff.stdin,'drain');
 }
 ff.stdin.end();const [code]=await once(ff,'close');if(code)throw new Error(err);if(calls.errors.length)throw new Error(calls.errors.join('\n'));console.log('Four stills and 16-second production-motion review rendered.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
