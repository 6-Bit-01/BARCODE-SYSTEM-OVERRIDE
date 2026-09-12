#!/usr/bin/env node
// Production owners with boundary-only host stubs. This does not certify Makko.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createRig: createBaseRig, load } = require('./check-level-01-boss');
const { createSprite, playerClips, enemyClips } = require('./makko-animation-fixture');
function createRig() { const rig=createBaseRig(); load(rig.context,'src/game/combat-fx.js'); return rig; }
const copy = x => JSON.parse(JSON.stringify(x));
const near = (a,b,why) => assert(Math.abs(a-b) < 1e-6, `${why}: ${a} / ${b}`);

// A short key tap is captured once, at its original musical time, even if the
// next rendered frame is later. Repeat, pause and reset cannot replay it.
{
  const { w, context } = createRig();
  load(context,'src/core/action-input.js'); load(context,'src/core/input.js');
  const input = new w.BARCODE.ActionInput();
  const beat = 60/146;
  w.audioSystem.context.currentTime = beat * 50;
  const event = { key:'ArrowDown', timeStamp:w.performance.now(), preventDefault(){} };
  input.handleKeyDown(event); input.handleKeyDown({...event,repeat:true}); input.handleKeyUp(event);
  w.audioSystem.context.currentTime += 0.19;
  const pressed = input.update().primary;
  assert(pressed.pressed && !pressed.held && pressed.released);
  assert.strictEqual(pressed.presses.length,1);
  const hit = w.BARCODE.playerCombat.resolvePrimary({now:pressed.presses[0].wallTimeMs,audioTimeSec:pressed.presses[0].audioTimeSec});
  assert.strictEqual(hit.timing.timing,'perfect','judgment uses the original key time, not the later frame');
  assert.strictEqual(w.BARCODE.playerCombat.getTimingJudgment().timing,'miss');
  assert(!input.update().primary.pressed);
  input.handleKeyDown(event); input.handleKeyUp(event);
  assert(!input.update({paused:true}).primary.pressed); assert(!input.update().primary.pressed);
  input.handleKeyDown(event); input.reset(); assert(!input.update().primary.pressed);
  // String-key compatibility is used by existing owner/debug integrations.
  input.handleKeyDown('r'); assert(input.update().rhythm_mode.pressed);
}

// Damage bodies stay the same across clips/facing and exclude an idle guitar.
{
  const { w } = createRig();
  const body = copy(w.player.getHitbox());
  for (const state of ['idle','walk','jump','rhythm']) for (const facing of [-1,1]) {
    w.player.state=state; w.player.facing=facing;
    assert.deepStrictEqual(copy(w.player.getHitbox()),body);
  }
  const enemy = new w.Enemy(965,750,'virus');
  enemy.position.x=965; enemy.position.y=750; enemy.entranceComplete=true;
  w.enemyManager.enemies=[enemy];
  w.enemyManager.checkCollisions(w.player);
  assert.strictEqual(w.player.health,3,'nearby nonoverlapping bodies cannot cause a pre-box push or damage');
  near(w.player.position.x,900,'no phantom push');
  for (const type of ['virus','corrupted','firewall']) {
    const e = new w.Enemy(1000,750,type); e.position.x=1000;e.position.y=750;
    const box=copy(e.getHitbox());
    for (const pose of ['idle','walk','attack']) { e.currentAnimation=`${type}_${pose}_${pose}`; assert.deepStrictEqual(copy(e.getHitbox()),box); }
  }
}

// Real player physics crosses each ordinary head at several frame rates. A
// fast descent may pass the entire body in one frame and still lands once.
for (const fps of [30,60,120,144]) for (const type of ['virus','corrupted','firewall']) {
  const { w,calls }=createRig(); w.rhythmSystem.hide(); w.sector1Progression=null;
  const e=new w.Enemy(1000,750,type); e.position.x=1000;e.position.y=750;e.entranceComplete=true;
  e.spriteReady=true;e.sprite=createSprite(enemyClips);e.playAnimation(type==='firewall'?'attack':'idle');
  e._sector1MissionEnemy=true;e.combatPattern=type==='firewall'?'attack':'brace';e.combatPatternMs=100;e.committedDirection=1;
  w.player.spriteReady=true;w.player.sprite=createSprite(playerClips);
  e.previousStompBox=e.getStompBox(); w.enemyManager.enemies=[e];
  w.player.position.x=1000; w.player.position.y=e.getStompBox().y-72-35;
  w.player.grounded=false; w.player.velocity.y=1100; w.player.allowMovement=true;
  for(let frame=0;frame<fps && e.active;frame++) { w.player.update(1000/fps); w.enemyManager.update(1000/fps,w.player); }
  assert(!e.active,`${fps}/${type}: actual descending head crossing is lethal`);
  assert(w.player.velocity.y<0 && w.player.health===3,`${fps}/${type}: safe rebound`);
  w.enemyManager.checkCollisions(w.player); assert(w.player.health===3);
  assert.deepStrictEqual(calls.errors,[],'animated enemy manager completes before collision resolution');
}
{
  const { w }=createRig(); w.rhythmSystem.hide(); w.sector1Progression=null;
  const e=new w.Enemy(1000,750,'virus'); e.position.x=1000;e.position.y=750;e.entranceComplete=true;
  w.enemyManager.enemies=[e];
  w.player.position.x=1000; w.player.position.y=e.getHitbox().y-60;
  w.player.grounded=false;w.player.velocity.y=-200;
  w.player.contactSweep={previousX:1000,currentX:1000,previousFootY:e.getHitbox().y+20,currentFootY:e.getHitbox().y+12};
  w.enemyManager.checkCollisions(w.player);
  assert(e.active,'rising into a body cannot be a stomp');
  assert.strictEqual(w.player.health,2,'real rising body contact still damages');
}
{
  const { w }=createRig();
  const a=new w.Enemy(1000,750,'firewall'),b=new w.Enemy(1000,750,'corrupted');
  for(const e of [a,b]){e.position.x=1000;e.position.y=750;e.entranceComplete=true;}
  w.enemyManager.enemies=[a,b];w.enemyManager.checkEnemyCollisions();
  assert(a.position.x < b.position.x); near(a.position.y,750,'crowd separation keeps ground'); near(b.position.y,750,'crowd separation keeps ground');
}

// Audited source-frame feet, both Makko anchor paths, both facings. The inverse
// transform must be correct independently of the collider's stable dimensions.
{
  const calibration=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/technical/enemy-contact-calibration.json')));
  const {w}=createRig();
  for(const [name,p] of Object.entries(calibration.poses)) for(const scaled of [true,false]) for(const facing of [-1,1]) {
    const type=name.split('_')[0],e=new w.Enemy(1400,750,type);e.position.x=1400;e.position.y=750;e.currentAnimation=name;e.facing=facing;
    e.sprite={currentSprite:{getAnchorPoint:()=>({x:p.anchorX,y:p.anchorY}),hasManifestAnchor:()=>scaled,getManifestScale:()=>1}};
    for(let i=0;i<p.footRows.length;i++) {
      e.animationRef={currentFrame:i}; const pose=e.getSpritePresentation();
      near(pose.y-p.anchorY*(scaled?p.scale:1)+p.footRows[i]*p.scale,822,`${name}/${i}: foot line`);
      near(pose.x+(facing===-1?-1:1)*(p.anchorX*p.scale-p.anchorX*(scaled?p.scale:1)),1400,`${name}: horizontal anchor`);
    }
  }
}

// No dropped RAF callbacks at common display rates; simulation covers elapsed
// time once, renderer once, and there is still one scheduled gameplay frame.
for(const fps of [30,60,120,144]) {
  const {w,context}=createRig();let rendered=0,updated=0,elapsed=0,requested=0;
  w.requestAnimationFrame=()=>++requested;w.cancelAnimationFrame=()=>{};
  load(context,'src/core/loop.js');w.lastTime=0;w.isRunning=true;w.isPaused=false;
  w.updateGame=ms=>{updated++;elapsed+=ms;};w.renderGame=()=>rendered++;
  for(let i=1;i<=fps*10;i++) w.gameLoop(i*1000/fps);
  assert.strictEqual(rendered,fps*10);assert.strictEqual(updated,rendered);assert.strictEqual(requested,rendered);
  near(elapsed,10000,`${fps}: simulation elapsed`);
}

// Particle shrink and camera interpolation describe elapsed time, not frames.
{
  const values=[];
  for(const fps of [30,60,120,144]) {
    const {w,context}=createRig();load(context,'src/engine/particles.js');load(context,'src/engine/renderer.js');
    const p=new w.Particle(1000,200,100,0,'#ffffff',10,2000);
    const camera={glitchIntensity:0,chromaticAberration:0,cinematicZoomOverride:null,zoomLevel:0.7,targetZoomLevel:1,zoomSpeed:0.05};
    for(let i=0;i<fps;i++){p.update(1000/fps);w.Renderer.prototype.update.call(camera,1000/fps);}
    values.push([p.position.x,p.size,camera.zoomLevel]);
  }
  for(const value of values) value.forEach((v,i)=>near(v,values[0][i],'frame-independent presentation'));
}

// Real transaction outcomes select links, guard/miss feedback and milestones.
{
  const {w,context,beat}=createRig();load(context,'src/game/combat-fx.js');
  const fx=w.BARCODE.combatFX; const generation=w.BARCODE.MusicTransport.getDiagnostics().generation;
  const cues=[],rhythmSounds=[];w.audioSystem.playCombatCue=kind=>cues.push(kind);
  w.audioSystem.playRhythmAttack=timing=>rhythmSounds.push(timing);
  w.rhythmSystem.hide();w.rhythmSystem.show();assert(fx.events.some(e=>e.kind==='entry'));
  beat();assert(!fx.events.some(e=>e.kind==='link'),'empty timing success never fabricates contact');
  assert.deepStrictEqual(rhythmSounds,['perfect'],'FX cannot suppress the original rhythm sound');
  const enemy=new w.Enemy(1000,750,'firewall');enemy.position.x=1000;enemy.position.y=750;enemy.health=100;
  w.enemyManager.enemies=[enemy];
  for(let i=0;i<10;i++){ fx.update(600);beat(); }
  assert.strictEqual(rhythmSounds.length,11,'one rhythm success sound per resolved success');
  assert(cues.filter(x=>x==='combo5').length===1 && cues.filter(x=>x==='combo10').length===1);
  const link=fx.events.find(e=>e.kind==='link');assert(link && link.tx===1000 && link.ty < 750);
  assert(enemy.health===70,'FX do not add damage');
  fx.update(700);assert.strictEqual(fx.events.length,0);
  beat('miss');assert.strictEqual(w.rhythmSystem.combo,0);assert(!fx.events.some(e=>e.kind==='link'));
  assert.strictEqual(rhythmSounds.length,11,'miss cannot play a success sound');
  assert.strictEqual(w.BARCODE.MusicTransport.getDiagnostics().generation,generation);
  for(let i=0;i<200;i++)fx.contact('virus',1000,700);assert(fx.events.length<=96);
  assert(!fx.visible(99999,750));w.BARCODE.playerCombat.reset();assert.strictEqual(fx.events.length,0);
}

// Physics still advances during a short local visual hold; poses follow jump
// phases and the animation controller introduces no timer ownership.
{
  const {w,timers,calls}=createRig();w.rhythmSystem.hide();w.sector1Progression=null;
  const p=w.player;let ticks=0;
  p.spriteReady=true;p.sprite=createSprite(playerClips);
  const update=p.sprite.update.bind(p.sprite);p.sprite.update=ms=>{ticks++;update(ms);};
  p.state='jump';p.grounded=false;const count=timers.size;
  for(const [vy,lo,hi] of [[-600,4,8],[0,10,10],[700,13,16]]) {p.velocity.y=vy;p.updateSpriteAnimation(16);assert(p.animationRef.currentFrame>=lo&&p.animationRef.currentFrame<=hi);}
  p.position.y=500;p.impactHoldMs=45;p.velocity.y=200;const oldY=p.position.y,before=ticks;p.update(16);
  assert(p.position.y!==oldY,'impact does not freeze physics');assert.strictEqual(ticks,before);
  assert.strictEqual(timers.size,count);
  const firewall=new w.Enemy(1200,750,'firewall');firewall.spriteReady=true;firewall.sprite=createSprite(enemyClips);firewall.playAnimation('attack');
  firewall.combatPattern='attack';firewall.combatPatternMs=400;firewall.updateCombatPose();assert(firewall.animationRef.currentFrame<32);
  firewall.combatPattern='recovery';firewall.combatPatternMs=1000;firewall.updateCombatPose();assert(firewall.animationRef.currentFrame>=32);
  assert.deepStrictEqual(calls.errors,[],'getter-only animation handles must not throw');
}

// The owner reported a permanent jump pose on spawn/landing. Exercise the
// production landing path and full enemy manager, including sprite updates.
for(const fps of [30,60,120,144]) {
  const {w,calls}=createRig();w.rhythmSystem.hide();w.sector1Progression=null;
  const p=w.player;p.spriteReady=true;p.sprite=createSprite(playerClips);
  p.position.y=730;p.grounded=false;p.velocity.y=350;
  for(let i=0;i<fps;i++)p.update(1000/fps);
  assert(p.grounded && p.landingPoseMs===0 && !p.landingPoseActive,`${fps}: landing recovery finishes`);
  assert.strictEqual(p.sprite.getCurrentAnimation(),'6_bit_idle_idle');
  assert.deepStrictEqual(calls.errors,[]);
}
for(const type of ['virus','corrupted','firewall']) {
  const {w,calls}=createRig();w.rhythmSystem.hide();w.sector1Progression=null;
  const e=new w.Enemy(900,750,type);e.position.x=900;e.position.y=750;e.entranceComplete=true;
  e.spriteReady=true;e.sprite=createSprite(enemyClips);e.playAnimation(type==='firewall'?'attack':'idle');
  e._sector1MissionEnemy=true;e.combatPattern=type==='firewall'?'attack':'brace';e.combatPatternMs=100;e.committedDirection=1;
  e.spawnProtectionDuration=0;
  w.enemyManager.enemies=[e];w.enemyManager.update(16,w.player);
  assert.strictEqual(w.player.health,3-e.damage,`${type}: sprite update cannot skip body contact`);
  const health=w.player.health;
  w.enemyManager.update(16,w.player);assert.strictEqual(w.player.health,health,'contact grants damage immunity');
  assert.deepStrictEqual(calls.errors,[]);
}

// Actual audio owner: finite sources, voice cap, rate limit, cleanup and bus.
{
  const {w,context,timers}=createRig();load(context,'src/engine/audio.js');const a=new w.AudioSystem();
  let disconnected=0;const oscillators=[],buffers=[],bus={gain:{value:0.7}};
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  a.context={currentTime:10,state:'running',createOscillator(){const o={frequency:param(),connect(){},start(){},stop(at){if(at!==undefined)assert(Number.isFinite(at)&&at>10&&at<30);},disconnect(){disconnected++;}};oscillators.push(o);return o;},createGain(){return {gain:param(),connect(to){assert.strictEqual(to,bus);},disconnect(){disconnected++;}};}};
  a.sfxGain=bus;a.initialized=true;
  assert(a.playCombatCue('jump'));assert(!a.playCombatCue('jump'),'same-instant duplicated cue is suppressed');
  for(let i=0;i<30;i++){a.context.currentTime+=0.04;a.playCombatCue('combo10');assert(a.combatVoices.size<=12);}
  for(const o of oscillators) o.onended?.();assert.strictEqual(a.combatVoices.size,0);assert(disconnected>=oscillators.length*2);
  a.playCombatCue('stomp');a.stopCombatCues();assert.strictEqual(a.combatVoices.size,0);
  a.initialized=false;a.context.currentTime+=0.1;
  assert(a.playCombatCue('land'),'ready SFX graph works while unrelated assets are loading');
  a.context.createBufferSource=()=>{const source={connect(){},start(){},stop(){},disconnect(){disconnected++;}};buffers.push(source);return source;};
  a.sounds.rhythmSuccess1=()=>a.playSFXBuffer({duration:0.4},0.9,'rhythm-success');a.rhythmSuccessSounds=['rhythmSuccess1'];
  const timerCount=timers.size;
  for(let i=0;i<20;i++){a.context.currentTime+=60/146;a.playRhythmAttack('perfect');assert.strictEqual(bus.gain.value,0.7);}
  assert.strictEqual(buffers.length,20);assert(a.combatVoices.size<=12);
  assert.strictEqual(timers.size,timerCount,'rhythm playback cannot schedule stale SFX-volume restores');
  a.sounds.playerDamage=()=>a.playSFXBuffer({duration:0.3},1,'player-damage');
  a.playPlayerDamageSound();assert.strictEqual(buffers.length,21,'restore loaded damage sound');
  a.stopCombatCues();assert.strictEqual(a.combatVoices.size,0,'restart disposes sample and synthetic voices');
  a.context.state='suspended';assert(!a.playCombatCue('pickup'));
  assert(!a.playSFXBuffer({duration:1}));
  assert.strictEqual(a.getRuntimeDiagnostics().sfx.lastCue.reason,'suspended');
}
console.log('Responsive combat: input timestamps, stable contacts, swept stomps, source anchors, 30/60/120/144 Hz pacing, feedback lifecycle, animation and audio ownership passed.');
