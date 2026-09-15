// Optional native Canvas review of production geometry/UI with existing art.
// Requires the Work runtime's Canvas module; adds no game or CI dependency.
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const {createRig,load}=require('./check-level-01-boss');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'/tmp/barcode-playtest-review');fs.mkdirSync(out,{recursive:true});
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','Oxanium');
GlobalFonts.registerFromPath('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf','monospace');
async function main(){
  const {w,p,context}=createRig();p.startMission();w.rhythmSystem.hideRhythmMode();
  load(context,'src/game/render-coordinator.js');load(context,'src/game/hacking.js');
  load(context,'src/engine/spaceships.js');w.SpaceShipSystem.prototype.loadShipImages=function(){};w.spaceShipSystem=new w.SpaceShipSystem();
  const foreground=await loadImage(path.join(root,'assets/world-v3/buildings.webp'));
  const background=await loadImage(path.join(root,'assets/world-v3/far-background.webp'));
  const sheets={};
  for(const name of ['6_bit_idle_idle','6_bit_walk_walk','firewall_walk_walk','virus_idle_idle']){
    const file=path.join(root,'assets/sprites-v3/prepared',name);sheets[name]={image:await loadImage(file+'.webp'),frames:Object.values(JSON.parse(fs.readFileSync(file+'.json')).frames)};
  }
  const canvas=createCanvas(1920,1080),c=canvas.getContext('2d');
  const actor=(name,x,foot,scale,anchor,frame=0,dir=1)=>{const a=sheets[name],f=a.frames[frame].frame;c.save();c.translate(x,foot);c.scale(dir,1);c.drawImage(a.image,f.x,f.y,f.w,f.h,-anchor*scale,-308*scale,f.w*scale,f.h*scale);c.restore();};
  function scene(name,cameraX,cameraY,encounter,heroX,heroFoot){
    c.setTransform(1,0,0,1,0,0);c.fillStyle='#10151c';c.fillRect(0,0,1920,1080);c.drawImage(background,0,0,1920,1080);
    Object.assign(w.player.position,{x:heroX,y:heroFoot-72});w.gameCamera={centerX:cameraX,y:cameraY};w.renderer.zoomLevel=1;p.state=encounter;p.closedGateEncounterId=encounter;p.spawnedEncounterIds.add(encounter);
    c.save();c.translate(960-cameraX,-cameraY);c.drawImage(foreground,-152,-550,4400,1589);w.drawGround(c);
    p.draw(c);actor('6_bit_idle_idle',heroX,heroFoot,2/3,160);
    if(cameraY===0)actor('firewall_walk_walk',heroX+270,856,2/3,160,8,-1);
    w.spaceShipSystem.drawHazards(c);c.restore();
    if(!w.hackingSystem?.isActive?.()&&!w.spaceShipSystem.hazards.some(h=>h.phase==='warning')) w.BARCODE.ComicHUD.objectives(c,{title:encounter.replace('_',' ').toUpperCase(),detail:'2 / 5 CLEARED',kick:0});
    fs.writeFileSync(path.join(out,name+'.png'),canvas.toBuffer('image/png'));
  }
  p.touchBarrier(w.Sector1Progression.ENCOUNTER_GATES[0],720,'push');
  scene('street-barrier',1080,0,'encounter_1',1170,856);
  scene('utility-box',3220,0,'encounter_4',3220,650);
  w.spaceShipSystem.hazards=[{phase:'warning',x:3700,y:-260,direction:-1,remainingMs:2200,width:220,height:82}];
  scene('upper-route',3220,-590,'encounter_4',3500,-326);
  const h=w.hackingSystem=new w.HackingSystem();h.active=true;h.phase='answer';h.puzzleType=2;h.currentPuzzle={type:2,answer:'4061',hidden:true};h.inputText='40';h.useKeypad();h.phaseElapsedMs=4200;
  scene('hack-keypad',1080,0,'encounter_1',1170,856);h.draw(c);fs.writeFileSync(path.join(out,'hack-keypad.png'),canvas.toBuffer('image/png'));
  console.log(JSON.stringify({output:out,images:['street-barrier','utility-box','upper-route','hack-keypad'],scope:'Native production geometry/UI; original sprite drawings placed for scale. No hosted Makko or audio claim.'}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
