// Native production rendering with explicit image/sprite adapters. This is not
// hosted Makko or physical-controller acceptance. Requires optional Canvas tool.
const fs=require('fs'),path=require('path'),assert=require('assert');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const {createRig,load}=require('./check-level-01-boss');
const {installArt}=require('./render-cat-chaos.cjs');
const {createSprite,playerClips,enemyClips}=require('./makko-animation-fixture');
const root=path.resolve(__dirname,'..');
async function sprite(names){
  const s=createSprite(names),specs=Object.assign({},...Object.values(JSON.parse(fs.readFileSync(path.join(root,'sprites-manifest.json'))).characters).map(c=>c.animations)),clips={};
  for(const name of Object.keys(names)){
    const spec=specs[name],image=await loadImage(path.join(root,'assets/sprites-v3/prepared',name+'.webp'));
    const data=JSON.parse(fs.readFileSync(path.join(root,'assets/sprites-v3/prepared',name+'.json')));
    clips[name]={image,frames:Object.values(data.frames),spec};
  }
  const play=s.play.bind(s);s.play=(name,...args)=>{const ref=play(name,...args),sheet=s.currentSprite,spec=clips[name].spec;
    sheet.getAnchorPoint=()=>spec.anchor;sheet.hasManifestAnchor=()=>true;sheet.getManifestScale=()=>spec.metadata?.scale||1;return ref;};
  s.isLoaded=()=>true;s.getHitboxWorld=()=>null;
  s.draw=(ctx,x,y,o={})=>{const c=clips[s.getCurrentAnimation()];if(!c)return;const f=c.frames[s.currentSprite.currentFrame].frame;
    const scale=(o.scale||1)*(c.spec.metadata?.scale||1),a=c.spec.anchor;
    ctx.save();ctx.translate(x,y);ctx.scale(o.flipH?-scale:scale,scale);ctx.drawImage(c.image,f.x,f.y,f.w,f.h,-a.x,-a.y,f.w,f.h);ctx.restore();};
  return s;
}
async function main(){
  const out=path.resolve(process.argv[2]||'../mode-power-review');fs.mkdirSync(out,{recursive:true});
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const r=createRig(),{w,p,context,calls}=r;await installArt(w,context);
  for(const f of ['src/game/mode-power-fx.js','src/game/combat-fx.js','src/game/hacking.js','src/engine/parallax.js','src/game/ui-manager.js','src/game/render-coordinator.js'])load(context,f);
  const c=createCanvas(1920,1080),ctx=c.getContext('2d');w.document.getElementById=id=>id==='gameCanvas'?c:null;
  w.renderer={zoomLevel:1,screenShake:{x:0,y:0},getZoomLevel:()=>1,clear(){ctx.fillStyle='#07121e';ctx.fillRect(0,0,1920,1080);},addScreenShake(){},addGlitch(){}};
  w.BARCODE.Preferences={values:{reducedMotion:false,reducedFlashes:false,visualOffsetMs:0}};
  w.parallaxBackground=new w.ParallaxBackground();
  for(const [i,file] of ['far-background','buildings'].entries())w.parallaxBackground.addLayer({image:await loadImage(path.join(root,'assets/world-v3',file+'.webp')),scrollFactorX:i?1:.5,scrollFactorY:0,y:i?-200:-100,width:4096,height:1479});
  p.startMission();p.getCameraY=()=>0;w.player.position.x=900;w.player.position.y=784;w.player.isEntering=false;
  w.player.sprite=await sprite(playerClips);w.player.spriteReady=true;w.player.currentAnimation=null;
  w.enemyManager.enemies=[];
  for(const [i,x] of [640,1100,1190].entries()){
    const type=i?'corrupted':'firewall',e=new w.Enemy(x,784,type);e.position.x=x;e.position.y=784;
    Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,_sector1MissionEnemy:true,spawnTimeMs:-10000,spawnProtectionDuration:0,simulationTimeMs:0});
    const names=Object.fromEntries(Object.entries(enemyClips).filter(([n])=>n.startsWith(type+'_')));
    e.sprite=await sprite(names);e.spriteReady=true;e.currentAnimation=null;e.sprite.play(type+'_idle_idle',true,0);e.animationRef={currentFrame:0};w.enemyManager.enemies.push(e);
  }
  w.rhythmSystem.hideRhythmMode();w.hackingSystem=new w.HackingSystem();assert(w.hackingSystem.start());
  w.hackingSystem.puzzleType=1;w.hackingSystem.update(1000);w.player.updateState();w.player.updateSpriteAnimation(16);
  const draw=(name)=>{w.renderGame();assert.deepEqual(calls.errors,[],JSON.stringify(calls.errors));fs.writeFileSync(path.join(out,name+'.webp'),c.toBuffer('image/webp'));};
  draw('hack-focus');w.hackingSystem.absorbGuardHit();w.BARCODE.combatFX.update(95);draw('hack-deflect');
  const hackView=w.hackingSystem.getSceneViewport(),before=ctx.getImageData(1110,245,780,710).data;
  w.BARCODE.modePowerFX.drawScreen(ctx);assert.deepEqual(ctx.getImageData(1110,245,780,710).data,before,'scene FX cannot alter the opaque keypad');
  w.BARCODE.Preferences.values.reducedMotion=true;w.BARCODE.Preferences.values.reducedFlashes=true;draw('hack-reduced');
  w.BARCODE.Preferences.values.reducedMotion=false;w.BARCODE.Preferences.values.reducedFlashes=false;
  w.hackingSystem.cancel();w.rhythmSystem.showRhythmMode();w.rhythmSystem.combo=12;
  w.player.updateState();w.player.updateSpriteAnimation(16);
  w.BARCODE.combatFX.resolved({ok:true,timing:{available:true,timing:'perfect'},targets:[{}],pattern:'discharge'},w.player,250);
  w.BARCODE.combatFX.update(140);draw('rhythm-impact');
  const summary={status:'passed',adapter:'Native Canvas with production render/UI/hack/player/effects; explicit Makko atlas and host adapters',captures:4,keypadSceneIsolation:true,hostedAcceptance:false};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(summary,null,2)+'\n');console.log(summary);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
