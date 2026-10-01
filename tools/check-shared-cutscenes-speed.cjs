// Production owners and pure rendering helpers; no parallel gameplay model.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {openingRig}=require('./check-intro');
const {bridgeRig}=require('./check-cache-bridge.cjs');
const {endingRig}=require('./check-cache-ending.cjs');
const {createRig,load}=require('./check-level-01-boss');
const copy=x=>JSON.parse(JSON.stringify(x));
async function main(){
  const opening=openingRig();opening.scene.start();opening.advance(300);
  const c=opening.scene;c.nextScene();assert.equal(c.currentCueIndex,0);
  opening.key(' ');assert.equal(c.currentCueIndex,1);opening.key('Enter');assert.equal(c.currentImageIndex,1);
  opening.key('t');const position=[c.currentImageIndex,c.currentCueIndex];opening.advance(12000);
  assert.deepEqual([c.currentImageIndex,c.currentCueIndex],position);opening.key('t');
  opening.w.audioSystem.pauseRuntimeAudio=async()=>({ok:true});
  opening.w.audioSystem.resumeRuntimeAudio=async()=>({ok:true});
  await c.togglePresentationPause();opening.advance(12000);assert.deepEqual([c.currentImageIndex,c.currentCueIndex],position);
  assert(!c.nextScene());assert.equal(c.startSkipHold('keyboard'),undefined);assert.equal(c.skipHolds.size,0);
  await c.togglePresentationPause();assert(!c.userPaused);
  opening.w.audioSystem.pauseRuntimeAudio=async()=>{throw Error('test audio failure');};
  assert.equal(await c.togglePresentationPause(),false);assert(!c.userPaused&&!c.pausePending,'failed host pause stays usable');
  c.startSkipHold('keyboard');opening.advance(4000);opening.pad.buttons[1].pressed=true;c.startSkipHold('gamepad');opening.advance(500);c.endSkipHold('keyboard');
  opening.advance(500);assert.equal(c.currentImageIndex,1,'staggered sources cannot inherit another hold');
  opening.advance(4000);assert.equal(c.currentImageIndex,8);assert(c.isActive);opening.pad.buttons[1].pressed=false;c.endSkipHold('gamepad');
  opening.advance(300);opening.key(' ');assert(c.isActive,'dialogue never performs final handoff');c.destroy();
  for(const kind of ['bridge','ending']){
    const r=kind==='bridge'?bridgeRig():endingRig();if(kind==='bridge')await r.boot();else r.e.start();
    const owner=kind==='bridge'?r.bridge:r.e;
    // Earlier loading test owns fallback timing. Controls work while waiting.
    r.tap('Enter');assert.equal(owner.cue,0);assert.equal(owner.page,0);
    r.tap(' ');r.tap(' ');assert.equal(owner.cue,2);r.tap(' ');assert.equal(owner.page,0);
    r.tap('Enter');assert.equal(owner.page,1);assert.equal(owner.cue,0);
    const tick=ms=>{for(let t=0;t<ms;t+=100)owner.update(Math.min(100,ms-t));};
    owner.holdSkip('keyboard',true);tick(4000);owner.holdSkip('gamepad',true);tick(500);
    owner.holdSkip('keyboard',false);tick(500);assert.equal(owner.page,1);assert(owner.skipMs<1100);
    tick(4000);assert.equal(owner.page,owner.panels.length-1);assert(owner.active);
    owner.holdSkip('gamepad',false);r.tap(' ');assert(owner.active,'dialogue cannot launch or finish');
    owner.dispose();
  }
  const r=createRig();r.w.BARCODE.Campaign={register(){},syncTitleButton(){}};load(r.context,'src/engine/cache-road-proof-profile.js');load(r.context,'src/game/cache-road-landscape.js');
  const source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
  vm.runInContext(source.replace('  const road = B.CacheRoadProof = {','  window.speedFXTest={speedCamera,drawSpeedAtmosphere};\n  const road = B.CacheRoadProof = {'),r.context);
  const fx=r.w.speedFXTest,draws=[],clips=[];
  r.w.BARCODE.PresentationAssets={draw:(key,ctx,opts)=>{draws.push({key,...opts});return true;}};
  const ctx=new Proxy({globalAlpha:1,rect:(...x)=>clips.push(x),createLinearGradient:()=>({addColorStop(){}})},
    {get:(o,k)=>k in o?o[k]:()=>{}});
  for(let speed=30;speed<=100;speed+=5)for(const boostMs of [0,1000])for(const passSide of [-1,1]){
    const state={speed,boostMs,passSide,passFlashMs:780,stumbleMs:450,steer:.8,elapsedMs:10000,
      progress:777,musicBeatFloat:130,timeMs:29000,integrity:3};const before=copy(state);
    const camera=fx.speedCamera(state);assert(camera.zoom>=1.015&&camera.zoom<=1.1541);
    assert(Math.abs(camera.x)<=27.5&&Math.abs(camera.y)<=10&&Math.abs(camera.roll)<=.01);
    draws.length=0;clips.length=0;fx.drawSpeedAtmosphere(ctx,state);
    assert.equal(draws.length,7,'bounded four wind ribbons, two corner slashes, one whoosh');
    assert(draws.every(d=>d.key==='cacheWindWhoosh'&&d.frame>=0&&d.frame<6&&d.width<=600));
    assert.deepEqual(clips,[[0,164,1920,916],[0,164,340,916],[1580,164,340,916]],'paint stays outside center lanes');
    draws.length=0;assert.deepEqual(copy(fx.speedCamera(state,{reduced:true})),{zoom:1,x:0,y:0,roll:0});
    fx.drawSpeedAtmosphere(ctx,state,{reduced:true});assert.equal(draws.length,0);
    fx.drawSpeedAtmosphere(ctx,state,{playing:false});assert.equal(draws.length,0);
    assert.deepEqual(copy(state),before,'rendering cannot mutate distance, clock, speed, damage or music');
  }
  assert(fx.speedCamera({speed:75,boostMs:1000,passFlashMs:780,stumbleMs:0,elapsedMs:0}).zoom>
    fx.speedCamera({speed:30,boostMs:0,passFlashMs:0,stumbleMs:0,elapsedMs:0}).zoom);
  console.log('Shared cutscenes: separate reading/page/final actions, transcript/pause, failed audio pause and independent skip holds passed. Speed FX: 60 live-state combinations, bounded draw/clip/camera, Reduced Motion and state immutability passed.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
