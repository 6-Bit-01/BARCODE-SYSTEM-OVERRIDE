// Production mode clocks, animation, FX and voice lifecycle. Host boundaries
// are controlled; native captures and the Chromium PCM test complement this.
const assert=require('assert');
const {createRig,load}=require('./check-level-01-boss');
const {createSprite,playerClips}=require('./makko-animation-fixture');
function rig(){
 const r=createRig(),{w,p,context}=r;
 p.startMission();p.state='jammer_active';p.closedGateEncounterId=null;w.enemyManager.enemies=[];w.rhythmSystem.hideRhythmMode();
 load(context,'src/game/combat-fx.js');load(context,'src/game/hacking.js');
 w.hackingSystem=new w.HackingSystem();w.BARCODE.Preferences={values:{reducedMotion:false,flashes:true}};
 w.player.sprite=createSprite(playerClips);w.player.spriteReady=true;w.player.playAnimation('idle');
 w.player.grounded=true;w.player.isEntering=false;w.player.position.x=800;w.player.position.y=784;
 return r;
}
for(const hz of [30,60,120]){
 const {w,context,timers}=rig(),fx=w.BARCODE.combatFX,h=w.hackingSystem,hero=w.player,cues=[];
 w.audioSystem.playModeCue=k=>cues.push(k);const beforeBox=JSON.stringify(hero.getHitbox());
 h.active=true;h.guardHitsRemaining=1;
 for(let i=0;i<hz;i++){h.sessionElapsedMs=i*1000/hz;hero.updateState();hero.updateSpriteAnimation(1000/hz);fx.update(1000/hz);}
 assert.equal(hero.state,'hack');assert.equal(hero.currentAnimation,'6_bit_idle_idle');
 assert.equal(JSON.stringify(hero.getHitbox()),beforeBox,'gesture does not change combat/terrain body');
 assert.deepEqual(cues,['hack-in'],'one entry cue per session');
 assert(h.absorbGuardHit());assert(!h.absorbGuardHit(),'guard remains exactly one hit');
 assert(fx.hackDeflectMs>0);hero.updateSpriteAnimation(1000/hz);assert.equal(hero.animationRef.currentFrame,8);
 assert.deepEqual(cues,['hack-in','hack-guard']);
 const time=fx.powerAge;w.isPaused=true;fx.update(1000);assert.equal(fx.powerAge,time);w.isPaused=false;
 h.cancel({restoreRhythm:false});assert.equal(h.feedback,null,'cancel clears the guard message');fx.update(1000/hz);assert.equal(cues.at(-1),'hack-out');
 assert.equal(w.BARCODE.TacticalFocusClock.getScale(),1);assert.equal(fx.sceneFilter(),'none');
 hero.updateState();assert.equal(hero.state,'idle');fx.reset();assert.equal(fx.events.length,0);assert.equal(fx.hackDeflectMs,0);
 assert.equal(timers.size,0,'no mode timer owner');
 // Real cars move and animate on the same slow clock; the queued approach
 // remains three simulation seconds and returns to normal on cancellation.
 load(context,'src/engine/spaceships.js');w.SpaceShipSystem.prototype.loadShipImages=function(){};
 const traffic=new w.SpaceShipSystem();traffic.spawnShip=()=>{};
 const ship={x:0,y:-100,speed:1,direction:1,size:100,bobAmount:0,isForeground:false};traffic.ships=[ship];
 h.active=true;h.sessionElapsedMs=0;let elapsed=0;
 for(let i=0;i<hz;i++){h.sessionElapsedMs=i*1000/hz;elapsed+=1000/hz*w.BARCODE.TacticalFocusClock.getScale();traffic.update(1000/hz);}
 assert(Math.abs(ship.x-elapsed*.06)<1e-7);assert(Math.abs(ship.animationElapsedMs-elapsed)<1e-7);
 assert(ship.x>19&&ship.x<23,'one second of traffic advances about 35%');
 const x=ship.x;h.active=false;traffic.update(1000);assert(Math.abs(ship.x-x-60)<1e-7);
 const pending={...ship,x:0,launchInMs:3000};traffic.pendingForeground=[pending];
 h.active=true;w.BARCODE.Preferences.values.reducedMotion=true;traffic.update(8000);assert.equal(traffic.pendingForeground.length,1);
 h.active=false;traffic.update(200);assert.equal(traffic.pendingForeground.length,0);assert.equal(pending.x,0);
 w.isPaused=true;const at=traffic.elapsedMs;traffic.update(1000);assert.equal(traffic.elapsedMs,at);w.isPaused=false;
 // Coordinator sends ambient particles slow delta, but personal FX real delta.
 let ambient=0;w.particleSystem.update=dt=>ambient+=dt;h.active=true;fx.reset();w.updateVisualSystems(100);
 assert.equal(ambient,35);assert.equal(fx.powerAge,100);
 w.BARCODE.Preferences.values.reducedMotion=false;w.BARCODE.Preferences.values.flashes=false;
 h.sessionElapsedMs=500;assert.equal(w.BARCODE.TacticalFocusClock.getScale(),.35);
}
{
 const {w,context}=rig();load(context,'src/engine/spaceships.js');w.SpaceShipSystem.prototype.loadShipImages=function(){};
 const t=new w.SpaceShipSystem();t.imagesLoaded=[true,false,false];t.shipImages=[{},null,null];
 t.spawnShip();const count=t.ships.length+t.pendingForeground.length;assert.equal(count,1);
 t.elapsedMs=3999;t.spawnShip();assert.equal(t.ships.length+t.pendingForeground.length,count);
 t.elapsedMs=4000;t.spawnShip();assert.equal(t.ships.length+t.pendingForeground.length,count+1,'cadence uses simulation time');
}
{
 const {w,context}=rig();load(context,'src/engine/parallax.js');
 const bg=Object.create(w.ParallaxBackground.prototype);bg.skyVideo={paused:false,readyState:2,playbackRate:1,pause(){this.paused=true;}};
 w.hackingSystem.active=true;bg.syncSkyPlayback();assert.equal(bg.skyVideo.playbackRate,.35);
 w.hackingSystem.active=false;bg.syncSkyPlayback();assert.equal(bg.skyVideo.playbackRate,1);
 w.isPaused=true;bg.syncSkyPlayback();assert(bg.skyVideo.paused);
 load(context,'src/engine/music-director.js');w.sector1Progression={isBossCombatLive:()=>true,boss:{phase:'approach'}};
 w.hackingSystem.active=true;assert.equal(w.BARCODE.musicDirector.desiredState(),'hack');
 w.hackingSystem.active=false;assert.equal(w.BARCODE.musicDirector.desiredState(),'boss');
}
{
 const {w}=rig(),fx=w.BARCODE.combatFX;w.hackingSystem.active=true;fx.update(100);
 let draws=0;const gradient={addColorStop(){}},ctx=new Proxy({createRadialGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:(()=>draws++),set:(o,k,v)=>(o[k]=v,true)});
 w.BARCODE.sceneProjection={worldToScreen:p=>p};
 const state=JSON.stringify(fx);fx.drawHackField(ctx,800,784);fx.drawPowerScreen(ctx);assert(draws>0);assert.equal(JSON.stringify(fx),state,'render is read only');
 w.BARCODE.Preferences.values.reducedMotion=true;draws=0;fx.drawPowerScreen(ctx);assert.equal(draws,0,'no screen surge in reduced motion');
 w.BARCODE.Preferences.values.reducedMotion=false;w.BARCODE.Preferences.values.flashes=false;fx.drawPowerScreen(ctx);assert.equal(draws,0,'no screen surge with flashes off');
 for(let i=0;i<500;i++)fx.hackDeflect();assert.equal(fx.events.length,96);fx.update(1000);assert.equal(fx.events.length,0);
}
{
 const {w,context}=rig();load(context,'src/engine/audio.js');const a=new w.AudioSystem();let buffers=0;
 const param=()=>({value:1,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({gain:param(),frequency:param(),connect(){},disconnect(){},start(){},stop(){}});
 a.context={state:'running',sampleRate:22050,currentTime:0,createGain:node,createOscillator:node,createBufferSource:node,
  createBuffer(c,n,rate){buffers++;const data=new Float32Array(n);return{sampleRate:rate,getChannelData:()=>data};}};
 a.sfxGain=node();assert(a.playModeCue('hack-in'));assert(!a.playModeCue('hack-in'));a.context.currentTime=1;assert(a.playModeCue('hack-in'));assert.equal(buffers,1);
 a.stopCombatCues();assert.equal(a.combatVoices.size,0);a.context.currentTime=0;assert(a.playModeCue('hack-in'),'reset permits first cue on a fresh context');
 a.stopCombatCues();for(let i=0;i<12;i++){a.context.currentTime=i;assert(a.playCombatCue('warning'));}
 const critical=[...a.combatVoices];assert(!a.playModeCue('hack-in'),'texture cannot evict warnings');assert(critical.every(v=>a.combatVoices.has(v)));
 assert(!a.playModeCue('rhythm-hit'),'no bass transient during warning');a.stopCombatCues();
 a.context.state='suspended';assert(!a.playModeCue('hack-guard'));assert.equal(a.combatVoices.size,0);
}
console.log('PASS: 30/60/120 Hz mode/traffic clocks; full-speed gesture/guard; body invariance; reset/pause; scenery restoration; boss hack mix; accessibility; bounded FX and warning-safe SFX.');
