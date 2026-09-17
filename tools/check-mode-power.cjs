// Actual hack/player/clock/presentation modules; explicitly simulated host audio.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createRig, load } = require('./check-level-01-boss');
const { createSprite, playerClips } = require('./makko-animation-fixture');
const near = (a,b,label) => assert(Math.abs(a-b)<1e-6, `${label}: ${a} != ${b}`);
function rig() {
  const r = createRig(), {w,context} = r;
  r.p.startMission(); w.rhythmSystem.hideRhythmMode();
  w.BARCODE.Preferences = {values:{reducedMotion:false,reducedFlashes:false,visualOffsetMs:0}};
  load(context,'src/game/mode-power-fx.js'); load(context,'src/game/combat-fx.js');
  load(context,'src/game/hacking.js'); w.hackingSystem = new w.HackingSystem();
  const e = new w.Enemy(1000,784,'corrupted');
  Object.assign(e,{entranceComplete:true,_authoredEntranceActive:false,_sector1MissionEnemy:true,spawnTimeMs:-10000,spawnProtectionDuration:0,simulationTimeMs:0});
  e.position.x=1000;e.position.y=784;w.enemyManager.enemies=[e];
  return {...r,e,fx:w.BARCODE.modePowerFX,h:w.hackingSystem};
}
function audio(w,rate=48000) {
  const sources=[],connects=[];
  const ac={currentTime:10,state:'running',sampleRate:rate,
    createBuffer(channels,length,sampleRate){const data=new Float32Array(length);return {length,sampleRate,duration:length/sampleRate,getChannelData:()=>data};},
    createBufferSource(){const s={connect(n){connects.push(n);},disconnect(){this.disconnected=true;},start(t){this.at=t;},stop(){this.stopped=true;}};sources.push(s);return s;},
    createGain(){return {gain:{value:1},connect(n){connects.push(n);},disconnect(){this.disconnected=true;}};}
  };
  w.audioSystem.context=ac;w.audioSystem.sfxGain={name:'existing-sfx-bus'};w.audioSystem.combatVoices=new Set();
  return {ac,sources,connects};
}
for (const fps of [30,60,120]) {
  const {w,h,fx}=rig();assert(h.start());
  const transport=JSON.stringify(w.BARCODE.MusicTransport.getDiagnostics());
  w.player.sprite=createSprite(playerClips);w.player.spriteReady=true;w.player.currentAnimation=null;
  w.player.state='idle';w.player.landingPoseMs=90;
  let min=1,max=0;
  for(let i=0;i<fps*2.4;i++){
    const scale=w.BARCODE.TacticalFocusClock.getScale();min=Math.min(min,scale);max=Math.max(max,scale);
    // The shared visual owner advances exactly once per full frame.
    w.BARCODE.combatFX.update(1000/fps);h.update(1000/fps);w.player.updateSpriteAnimation(1000/fps);
  }
  near(fx.timeMs,2400,'presentation stays real-time');near(fx.worldTimeMs,384,'world averages 16%');
  near(h.sessionElapsedMs,2400,'puzzle remains real-time');assert(min>=.148-1e-8&&max<=.172+1e-8);
  assert.equal(w.player.currentAnimation,'6_bit_idle_idle');assert(!w.player.landingPoseActive);
  assert(w.player.animationRef.currentFrame>=10&&w.player.animationRef.currentFrame<=12);
  const hp=w.player.health;assert(h.absorbGuardHit());assert(!h.absorbGuardHit());assert.equal(w.player.health,hp);
  assert(fx.events.some(e=>e.kind==='deflect'));assert.equal(fx.guardMs,330);
  w.gameState.paused=true;const paused=JSON.stringify([fx.events,fx.timeMs,fx.worldTimeMs]);fx.update(1000);h.update(1000);
  assert.equal(JSON.stringify([fx.events,fx.timeMs,fx.worldTimeMs]),paused);w.gameState.paused=false;
  w.BARCODE.Preferences.values.reducedMotion=true;assert.equal(w.BARCODE.TacticalFocusClock.getScale(),.16);
  assert.equal(fx.hackPose(w.player).frame,10);w.player.grounded=false;assert.equal(fx.hackPose(w.player),null);w.player.grounded=true;
  h.cancel();assert.equal(w.BARCODE.TacticalFocusClock.getScale(),1);assert.equal(fx.hackPose(w.player),null);
  assert(fx.events.some(e=>e.kind==='release'));assert.equal(fx.guardMs,0);
  assert.equal(JSON.stringify(w.BARCODE.MusicTransport.getDiagnostics()),transport,'effects never alter transport');
  fx.update(2000);assert.equal(fx.events.length,0);h.reset();assert.equal(fx.worldTimeMs,0);
}
// Production dispatcher: scenery and particles share focus, player receives full dt.
{
  const {w,h,fx}=rig();assert(h.start());w.BARCODE.Preferences.values.reducedMotion=true;
  const dt={};w.player.update=(ms,movement)=>{dt.player=ms;dt.movement=movement;};
  w.enemyManager.update=()=>{};w.particleSystem.update=ms=>dt.particles=ms;
  w.spaceShipSystem={update:ms=>dt.cars=ms};w.checkGameConditions=()=>{};w.sector1Progression.update=()=>{};
  w.updateGame(100);assert.equal(dt.player,100);assert.equal(dt.movement,false,'puzzle retains movement/input ownership');
  assert.equal(dt.particles,16);assert.equal(dt.cars,16);assert.equal(fx.timeMs,100);assert.equal(fx.worldTimeMs,16);
  h.cancel();w.updateGame(100);assert.equal(dt.cars,100);assert.equal(dt.particles,100);assert.equal(dt.movement,true);
}
// Silent skyline video responds, resets, and never touches audio playbackRate.
{
  const {w,context,h}=rig();load(context,'src/engine/parallax.js');
  const sky=Object.create(w.ParallaxBackground.prototype);
  sky.skyVideo={playbackRate:1,paused:false,readyState:3,pause(){this.paused=true;}};sky.skyVideoGeneration=0;
  w.isRunning=true;assert(h.start());sky.syncSkyPlayback();assert.equal(sky.skyVideo.playbackRate,.16);
  w.isPaused=true;sky.syncSkyPlayback();assert(sky.skyVideo.paused);w.isPaused=false;
  sky.resetSkyAnimation();assert.equal(sky.skyVideo.playbackRate,1);assert.equal(sky.skyVideo.currentTime,0);
  h.cancel();sky.skyVideo.paused=false;sky.syncSkyPlayback();assert.equal(sky.skyVideo.playbackRate,1);
}
// Synthesized cues are finite, bounded, distinct, cached and on the SFX bus.
for(const rate of [44100,48000]){
  const {w,fx}=rig(),{ac,sources,connects}=audio(w,rate),prints=new Set();
  for(const kind of ['time-enter','time-return','deflect','rhythm-surge','rhythm-impact']){
    const b=fx.makeBuffer(ac,kind),samples=b.getChannelData(0);assert.strictEqual(fx.makeBuffer(ac,kind),b);
    let peak=0,energy=0;for(const n of samples){assert(Number.isFinite(n));peak=Math.max(peak,Math.abs(n));energy+=n*n;}
    assert(peak>.05&&peak<.9);assert(Math.sqrt(energy/samples.length)>.015);assert.equal(samples[0],0);
    assert(Math.abs(samples.at(-1))<.0001);prints.add(Buffer.from(samples.buffer).toString('base64'));
    assert(fx.playCue(kind));assert(!fx.playCue(kind),'rapid duplicates rejected');ac.currentTime+=1;
  }
  assert.equal(prints.size,5);assert.equal(sources.length,5);assert(connects.includes(w.audioSystem.sfxGain));
  w.audioSystem.criticalCueUntil=ac.currentTime+.4;assert(!fx.playCue('rhythm-impact'));assert(fx.playCue('deflect'));
  w.gameState.paused=true;assert(!fx.playCue('time-return'));w.gameState.paused=false;
  fx.reset();assert.equal(w.audioSystem.combatVoices.size,0);assert(sources.every(s=>s.stopped&&s.disconnected));
  for(let i=0;i<12;i++)w.audioSystem.combatVoices.add({critical:true,dispose(){throw Error('must not steal critical voice');}});
  assert(!fx.playCue('deflect'),'all-critical pool cannot be evicted');assert.equal(w.audioSystem.combatVoices.size,12);
}
// Actual mode/connected-hit hooks; draws are read-only and clipped to live scene.
{
  const {w,h,fx}=rig();w.rhythmSystem.showRhythmMode();assert(fx.events.some(e=>e.kind==='surge'));
  fx.events=[];const result={ok:true,timing:{available:true,timing:'perfect'},targets:[{}]};
  w.rhythmSystem.combo=12;w.BARCODE.combatFX.resolved(result,w.player,250);assert(fx.events.some(e=>e.kind==='beat'&&e.combo===12));
  fx.events=[];fx.resolved({...result,targets:[]},w.player,250);assert.equal(fx.events.length,0,'no fake impact on a miss');
  assert(h.start());fx.deflect();let strokes=0,clipRect;
  const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),stroke(){strokes++;},rect(...args){clipRect=args;}},{get:(o,k)=>o[k]??(()=>{})});
  const before=JSON.stringify([fx.events,h.sessionElapsedMs,w.player.position,h.guardHitsRemaining]);
  for(let i=0;i<2;i++){fx.drawBehind(ctx);fx.drawFront(ctx);fx.drawScreen(ctx);}
  assert(strokes>0);const view=h.getSceneViewport();assert.deepEqual(clipRect,[view.x,view.y,view.width,view.height]);
  assert.equal(JSON.stringify([fx.events,h.sessionElapsedMs,w.player.position,h.guardHitsRemaining]),before);
  for(let i=0;i<100;i++)fx.event('beat');assert.equal(fx.events.length,24);fx.update(1000);assert.equal(fx.events.length,0);
  w.BARCODE.Preferences.values.reducedMotion=true;w.BARCODE.Preferences.values.reducedFlashes=true;
  fx.drawBehind(ctx);fx.drawFront(ctx);fx.drawScreen(ctx);h.reset();assert.equal(fx.events.length,0);
}
const index=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
assert(index.indexOf('src/game/mode-power-fx.js')<index.indexOf('src/game/combat-fx.js'));
console.log('Mode power: 30/60/120Hz full-speed puzzle/pose, 16% world, dispatch, one guard, pause/cancel/reset, skyline, 10 finite PCM buffers, voice bounds, rhythm hooks, read-only/clipped drawing and reduced-motion checks passed.');
