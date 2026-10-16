#!/usr/bin/env node
// Native Canvas + production Jammer / SLAM / pickup owners, bundled exact RGBA.
// Only Image/Makko transport and native Canvas are adapted. No hosted, browser,
// physical-controller, audible-SFX or device-FPS acceptance is claimed here.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{
  paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||root,root]}));
const {createRig,load}=require('./check-level-01-boss');
const {createSprite}=require('./makko-animation-fixture');
const out=process.argv[2]&&path.resolve(process.argv[2]);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const copy=value=>JSON.parse(JSON.stringify(value));
const metrics={scope:'Native production owners with exact bundled RGBA artwork',
  limits:'Image/Makko boundary adapted; no live host, network, audible SFX or device FPS claim.',
  cels:{},clipped:[],routes:[],difficulty:[],sourceHashes:{}};
if(out)fs.mkdirSync(out,{recursive:true});
GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
async function installArt(w,context) {
  const file='src/engine/presentation-assets.js',source=fs.readFileSync(path.join(root,file),'utf8');
  const mark='  const cache = {};';assert(source.includes(mark),'production asset-cache boundary');
  vm.runInContext(source.replace(mark,mark+' window.signalNativeEntries=entries;'),context,{filename:file});
  w.signalNativeImages={};
  for(const key of ['level1SignalDischarge','level1SignalAmp','steadyJammer','bossFlourish','bossPulse']) {
    const entry=w.signalNativeEntries[key];assert(entry,'declared production asset '+key);
    w.signalNativeImages[key]=await loadImage(path.join(root,entry.path));
    metrics.sourceHashes[entry.path]=hash(fs.readFileSync(path.join(root,entry.path)));
  }
  vm.runInContext(source.replace(mark,'  const cache=Object.fromEntries(Object.entries(window.signalNativeImages).map(([key,image])=>[key,{image,ready:true}]));'),context,{filename:file});
  const draw=w.BARCODE.PresentationAssets.draw;
  w.BARCODE.PresentationAssets={...w.BARCODE.PresentationAssets,draw(key,ctx,options){
    if(key==='level1SignalDischarge'||key==='level1SignalAmp')metrics.routes.push({key,frame:options.frame,width:options.width,height:options.height,alpha:ctx.globalAlpha});
    return draw(key,ctx,options);
  }};
}
async function installSprites(w) {
  const clips={};
  for(const name of ['6_bit_idle_idle','6_bit_walk_walk','6_bit_jump_jump','6_bit_r__h_mode_rhmode',
    'broadcast_jammer_idle_idle','sector_1_boss_idle_idle','sector_1_boss_attack_attack']) {
    const base=path.join(root,'assets/sprites-v3/prepared',name);
    const meta=JSON.parse(fs.readFileSync(base+'.json'));clips[name]={meta,frames:Object.values(meta.frames),image:await loadImage(base+'.webp')};
  }
  const make=()=>{
    const s=createSprite(Object.fromEntries(Object.entries(clips).map(([name,c])=>[name,c.frames.length]))),play=s.play;
    s.isLoaded=()=>true;s.getAvailableAnimations=()=>Object.keys(clips);s.getHitboxWorld=()=>null;
    s.play=function(name,...args){const ref=play.call(s,name,...args),c=clips[name];
      s.currentSprite.metadata.frames=Object.fromEntries(c.frames.map((f,i)=>[String(i),f]));
      s.currentSprite.getAnchorPoint=()=>c.meta.meta.anchor||{x:c.frames[0].frame.w/2,y:c.frames[0].frame.h};
      s.currentSprite.hasManifestAnchor=()=>true;s.currentSprite.getManifestScale=()=>1;return ref;};
    s.draw=(ctx,x,y,o={})=>{const c=clips[s.getCurrentAnimation()];if(!c)return;
      const f=c.frames[s.currentSprite.currentFrame].frame,a=s.currentSprite.getAnchorPoint(),scale=o.scale??1;
      ctx.save();ctx.globalAlpha*=o.alpha??1;ctx.translate(x,y);ctx.scale(o.flipH?-scale:scale,scale);
      ctx.drawImage(c.image,f.x,f.y,f.w,f.h,-a.x,-a.y,f.w,f.h);ctx.restore();};return s;};
  w.MakkoEngine.sprite=()=>make();w.player.sprite=make();w.player.spriteReady=true;w.player.playAnimation('idle');
  return make;
}
async function main() {
  const fencedFiles=['src/game/level1-signal-art.js','src/game/jammer-environment.js','src/game/combat-fx.js','src/game/sector1-progression.js',
    'src/engine/presentation-assets.js','tools/check-level1-signal-art.cjs','assets/level1-signal-art/packing.json'];
  const fence=Object.fromEntries(fencedFiles.map(file=>[file,hash(fs.readFileSync(path.join(root,file)))]));
  const rig=createRig(),{w,p,context,calls}=rig;
  await installArt(w,context);const make=await installSprites(w);
  load(context,'src/game/level1-signal-art.js');load(context,'src/game/combat-fx.js');load(context,'src/engine/parallax.js');
  w.BARCODE.Preferences={values:{reducedMotion:false,flashes:true}};
  w.renderer.zoomLevel=.735;w.renderer.getFollowCameraX=x=>x;
  w.document.createElement=()=>createCanvas(128,128);
  const art=w.BARCODE.Level1SignalArt,fx=w.BARCODE.combatFX,jammer=w.BARCODE.JammerEnvironment;
  const isolated=createCanvas(420,460),ic=isolated.getContext('2d');
  const pixels=draw=>{ic.clearRect(0,0,420,460);draw(ic);return Buffer.from(ic.getImageData(0,0,420,460).data);};
  const write=(name,canvas)=>{if(out)fs.writeFileSync(path.join(out,name+'.png'),canvas.toBuffer('image/png'));};
  // Every new source frame is genuinely distinct, rather than a timing-only loop.
  for(const key of ['level1SignalDischarge','level1SignalAmp']) {
    const distinct=new Set();
    for(let frame=0;frame<8;frame++)distinct.add(hash(pixels(c=>w.BARCODE.PresentationAssets.draw(key,c,{x:210,y:210,width:180,height:180,frame}))));
    assert.equal(distinct.size,8,key+' eight distinct raster cels');metrics.cels[key]=distinct.size;
  }
  // Geometry tests use the real production crop/draw function and native alpha.
  for(const active of [false,true])for(const width of [176,200,240,280]) {
    const options={x:60,y:60,width,height:278,elapsedMs:active?1450:350,active};
    const a=pixels(c=>art.drawThreat(c,options));assert(a.equals(pixels(c=>art.drawThreat(c,options))),'drawing is repeatable and clock-free');
    let visible=0,maxAlpha=0;
    for(let i=0;i<a.length;i+=4)if(a[i+3]){const n=i/4,x=n%420,y=Math.floor(n/420);visible++;maxAlpha=Math.max(maxAlpha,a[i+3]);
      assert(x>=60&&x<60+width&&y>=60&&y<338,'all art and guides remain within exact danger geometry');}
    assert(visible>500,'actual painted electricity reaches the native surface');
    // Sample the interior, excluding the high-contrast address guides.
    let centerMaxAlpha=0;
    for(let y=80;y<318;y++)for(let x=80;x<40+width;x++)centerMaxAlpha=Math.max(centerMaxAlpha,a[(y*420+x)*4+3]);
    assert(centerMaxAlpha<=(active?138:205),'phase alpha keeps center translucent');
    metrics.clipped.push({active,width,visible,maxAlpha,centerMaxAlpha});
  }
  assert.deepEqual([0,175,350,525].map(elapsedMs=>art.threatPose({elapsedMs}).frame),[0,1,2,3]);
  assert.deepEqual([0,105,210,315].map(activeAgeMs=>art.threatPose({active:true,activeAgeMs}).frame),[4,5,6,7]);
  assert.deepEqual([0,140,280,420,560,700,840,980].map(timeMs=>art.ampPose({timeMs}).frame),[0,1,2,3,4,5,6,7]);
  for(const quiet of [{reducedMotion:true,flashes:true},{reducedMotion:false,flashes:false}]) {
    w.BARCODE.Preferences.values=quiet;
    assert.equal(art.threatPose({elapsedMs:525}).frame,0);assert.equal(art.threatPose({active:true,activeAgeMs:315}).frame,4);assert.equal(art.ampPose({timeMs:980}).frame,0);
    const warning=pixels(c=>art.drawThreat(c,{x:60,y:60,width:240,height:278,elapsedMs:0}));
    assert(warning.equals(pixels(c=>art.drawThreat(c,{x:60,y:60,width:240,height:278,elapsedMs:525}))),'quiet warning holds exact native pixels as owner time advances');
    fx.timeMs=0;const amp=pixels(c=>fx.drawAmpIcon(c,210,210));fx.timeMs=980;
    assert(amp.equals(pixels(c=>fx.drawAmpIcon(c,210,210))),'actual quiet Amp call holds pixels as combat time advances');
  }
  w.BARCODE.Preferences.values={reducedMotion:false,flashes:true};
  w.BARCODE_RENDER_QUALITY={flashes:false};
  assert.equal(art.threatPose({elapsedMs:525}).frame,0);assert.equal(art.threatPose({active:true,activeAgeMs:315}).frame,4);assert.equal(art.ampPose({timeMs:980}).frame,0);
  w.BARCODE_RENDER_QUALITY={flashes:true};fx.timeMs=0;
  const chargeRasters=[];
  for(let chargeCount=0;chargeCount<=3;chargeCount++)chargeRasters.push(pixels(c=>fx.drawAmpIcon(c,210,210,1,chargeCount)));
  assert.equal(new Set(chargeRasters.map(hash)).size,4,'real charge sockets visibly distinguish all four counts');
  for(let i=1;i<4;i++) {
    const a=chargeRasters[i-1],b=chargeRasters[i];let changed=0;
    for(let n=0;n<a.length;n+=4)if(a[n]!==b[n]||a[n+1]!==b[n+1]||a[n+2]!==b[n+2]||a[n+3]!==b[n+3]) {
      const x=n/4%420,y=Math.floor(n/4/420);assert(x>=194&&x<=226&&y>=220&&y<=225,'charge changes stay on socket strip');changed++;
    }assert(changed>10,'each spent charge has a visible socket');
  }
  // Trigger warnings through the actual four timed Jammer hits; unchanged
  // dimensions, warmup, one-hit damage and total lifetime at each difficulty.
  const damage=[];w.player.takeDamage=(n,origin)=>damage.push({n,origin});
  const cues=[];w.audioSystem.playCombatCue=cue=>cues.push(cue);
  function surge(choice='standard') {
    w.BARCODE.LevelDifficulty={choice:{id:choice}};w.player.position.x=1400;w.player.position.y=784;
    jammer.reset();jammer.reveal({position:{x:1750,y:784}});
    for(let sequence=0;sequence<4;sequence++)assert(jammer.applyRhythmDamage({timing:'perfect',sequence}).ok);
    return jammer.getStatus().surge;
  }
  for(const [choice,width,warningMs] of [['relaxed',200,1700],['standard',240,1400],['overclocked',280,1050]]) {
    const start=damage.length,s=surge(choice);assert.equal(s.width,width);assert.equal(s.warningMs,warningMs);
    jammer.update(warningMs-1);assert.equal(damage.length,start,'no premature damage');
    jammer.update(1);assert.equal(damage.length,start+1,'one damage at actual active boundary');
    jammer.update(419);assert(jammer.getStatus().surge);assert.equal(damage.length,start+1,'no repeated damage');
    jammer.update(1);assert.equal(jammer.getStatus().surge,null,'420 ms active lifetime unchanged');metrics.difficulty.push({choice,width,warningMs,damage:1});
  }
  // Native production background and actor draws provide actual readable
  // game context. Fixture camera matches the usual Level 1 .735 zoom.
  const bg=new w.ParallaxBackground();
  bg.layers=[{imgElement:await loadImage(path.join(root,'assets/world-v3/far-background.webp')),loaded:true,opacity:1,blendMode:'source-over',scrollFactorX:.5,scrollFactorY:0},
    {imgElement:await loadImage(path.join(root,'assets/world-v3/buildings.webp')),loaded:true,opacity:1,blendMode:'source-over',scrollFactorX:1,scrollFactorY:0}];
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
  function scene(name,centerX,draw,centerY=540) {
    w.gameCamera={centerX,y:centerY-540};
    bg.updateCamera(centerX,centerY-540);
    ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1920,1080);ctx.fillStyle='#10132b';ctx.fillRect(0,0,1920,1080);
    ctx.save();ctx.translate(960,540);ctx.scale(.735,.735);ctx.translate(-960,-540-(centerY-540));bg.draw(ctx);ctx.restore();
    ctx.save();ctx.translate(960,540);ctx.scale(.735,.735);ctx.translate(-centerX,-centerY);draw(ctx);w.player.drawSprite(ctx);ctx.restore();
    write(name,canvas);
    if(out) {
      const detail=createCanvas(640,400),dc=detail.getContext('2d');
      const top=name.includes('amp')?290:440,left=name.includes('amp')?650:670;
      dc.drawImage(canvas,left,top,640,400,0,0,640,400);write(name+'-native-detail',detail);
    }
    return Buffer.from(ctx.getImageData(0,0,1920,1080).data);
  }
  for(const reducedMotion of [false,true]) {
    const tag=reducedMotion?'reduced':'normal';w.BARCODE.Preferences.values={reducedMotion,flashes:true};
    surge();jammer.update(350);
    const state=copy(jammer.getStatus());
    const warning=scene(tag+'-jammer-warning',1520,c=>jammer.draw(c));assert.deepEqual(copy(jammer.getStatus()),state,'actual Jammer draw is pure');
    assert(warning.equals(scene(tag+'-jammer-warning',1520,c=>jammer.draw(c))),'actual Jammer repeat holds cel');
    w.isPaused=true;jammer.update(1000);assert.deepEqual(copy(jammer.getStatus()),state,'pause freezes real warning');w.isPaused=false;
    jammer.update(1100);scene(tag+'-jammer-discharge',1520,c=>jammer.draw(c));
    if(!reducedMotion&&out) {
      // Review-only alpha alternatives around the final .54 value. Same
      // production phase, crop, actor, camera and exact guide geometry.
      const assets=w.BARCODE.PresentationAssets;
      for(const alpha of [.52,.55]) {
        w.BARCODE.PresentationAssets={...assets,draw(key,c,options){
          const incoming=c.globalAlpha;
          if(key==='level1SignalDischarge'&&options.frame>=4)c.globalAlpha=alpha;
          try{return assets.draw(key,c,options);}finally{c.globalAlpha=incoming;}
        }};
        scene('active-alpha-'+Math.round(alpha*100),1520,c=>jammer.draw(c));
      }
      w.BARCODE.PresentationAssets=assets;
    }
    w.isPaused=true;const held=copy(jammer.getStatus());jammer.update(500);assert.deepEqual(copy(jammer.getStatus()),held,'pause freezes real discharge');w.isPaused=false;
    jammer.reset();
    // Boss fixture drives the production phase selector, rather than setting
    // a made-up hazard: cycle 3 / six health is the actual standard SLAM route.
    p.boss={x:1720,y:784,active:true,defeated:false,state:'idle',health:6,maxHealth:9,cycle:2,pulses:[],
      sprite:make(),spriteReady:true,activeAnimation:null,facing:-1,phase:'approach',phaseElapsedMs:0};
    p.state='boss_combat';p.setBossCombatPhase('telegraph');assert.equal(p.boss.attackPattern,'slam');
    p.boss.phaseElapsedMs=350;scene(tag+'-slam-warning',1520,c=>p.drawBoss(c));
    p.setBossCombatPhase('sweep');assert.equal(p.boss.slam.remainingMs,360);p.updateBossSlam(90);p.boss.phaseElapsedMs=90;
    scene(tag+'-slam-active',1520,c=>p.drawBoss(c));assert.equal(p.boss.slam.remainingMs,270);
    p.updateBossSlam(270);assert.equal(p.boss.slam.remainingMs,0,'original SLAM duration unchanged');
    // Real roof pickup draw and collection owner; the canonical 6 Bit actor
    // stands beside it at its actual authored roof height.
    p.boss=null;p.state='encounters';p.missionStarted=true;p.signalAmpCollected=false;
    fx.timeMs=420;w.player.position.x=2750;w.player.position.y=124;
    scene(tag+'-amp-pickup',2800,c=>p.drawSignalAmp(c),290);
    const before=fx.timeMs;p.giveSignalAmp();assert.equal(w.BARCODE.signalAmpCharges,3);assert(p.signalAmpCollected);assert.equal(fx.timeMs,before,'collection does not create a new clock');
  }
  // Real call sites request distinct warning/active atlas rows, including
  // quiet states and native amp draw. Collision/audio remain owner-controlled.
  // Native Canvas stores global alpha on an 8-bit grid (browser Canvas uses
  // floating-point values); allow one alpha step without weakening the phase.
  assert(metrics.routes.some(r=>r.key==='level1SignalDischarge'&&r.frame===2&&Math.abs(r.alpha-.8)<=1/255));
  assert(metrics.routes.some(r=>r.key==='level1SignalDischarge'&&r.frame>=4&&Math.abs(r.alpha-.54)<=1/255));
  assert(metrics.routes.some(r=>r.key==='level1SignalAmp'&&r.frame===3));
  assert(metrics.routes.some(r=>r.key==='level1SignalAmp'&&r.frame===0));
  assert(cues.includes('warning')&&cues.includes('guard')&&cues.includes('pickup'),'existing event SFX routes still fire');
  assert.deepEqual(calls.errors,[]);
  for(const file of fencedFiles) {
    assert.equal(hash(fs.readFileSync(path.join(root,file))),fence[file],file+' remained unchanged during the native review');
    metrics.sourceHashes[file]=fence[file];
  }
  assert(!/requestAnimationFrame|setTimeout|setInterval|createElement|Date\.now|performance\.now/.test(fs.readFileSync(path.join(root,'src/game/level1-signal-art.js'),'utf8')),'new art owner creates no loop, timer, Canvas or wall clock');
  const packed=JSON.parse(fs.readFileSync(path.join(root,'assets/level1-signal-art/packing.json')));
  for(const sheet of Object.values(packed)) {
    assert.equal(hash(fs.readFileSync(path.join(root,sheet.atlas))),sheet.atlasSha256,'review loads the exact lossless packed sheet');
    assert.equal(hash(fs.readFileSync(path.join(root,sheet.source))),sheet.sourceSha256,'original generated source stays unchanged');
  }
  metrics.routes=metrics.routes.filter((r,i,a)=>a.findIndex(s=>JSON.stringify(s)===JSON.stringify(r))===i);
  if(out)fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(metrics,null,2)+'\n');
  console.log('Level 1 Signal art: 16 unique cels, 8 exact clipped rectangles, 3 actual Jammer difficulty paths, real SLAM/pickup normal + quiet, charge/pause/SFX checks passed.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
