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
  vm.runInContext(source.replace('  const road = B.CacheRoadProof = {','  window.speedFXTest={speedCamera,cameraTarget,advanceCamera,drawSpeedAtmosphere,cameraPoint,cameraEdgeMarker,drawCameraWarnings,CAMERA_PIVOT_Y};\n  const road = B.CacheRoadProof = {'),r.context);
  const fx=r.w.speedFXTest,draws=[],clips=[];
  r.w.BARCODE.PresentationAssets={draw:(key,ctx,opts)=>{draws.push({key,...opts});return true;}};
  const ctx=new Proxy({globalAlpha:1,rect:(...x)=>clips.push(x),createLinearGradient:()=>({addColorStop(){}})},
    {get:(o,k)=>k in o?o[k]:()=>{}});
  for(let speed=30;speed<=100;speed+=5)for(const boostMs of [0,1000])for(const passSide of [-1,1]){
    const state={speed,boostMs,passSide,passFlashMs:780,stumbleMs:450,steer:.8,elapsedMs:10000,
      progress:777,musicBeatFloat:130,timeMs:29000,integrity:3};const before=copy(state);
    const camera=fx.speedCamera(state);assert(camera.zoom>=1&&camera.zoom<=1.3351);
    assert(Math.abs(camera.x)<=42&&Math.abs(camera.y)<=14&&Math.abs(camera.roll)<=.02);
    draws.length=0;clips.length=0;fx.drawSpeedAtmosphere(ctx,state);
    assert.equal(draws.length,7,'bounded six fine streaming clusters and one pass whoosh');
    assert(draws.every(d=>d.key==='cacheWindWhoosh'&&d.frame>=0&&d.frame<6&&d.width<=600));
    assert.deepEqual(clips,[[0,164,1920,916],[0,164,340,916],[1580,164,340,916]],'paint stays outside center lanes');
    draws.length=0;assert.deepEqual(copy(fx.speedCamera(state,{reduced:true})),{zoom:1,x:0,y:0,roll:0});
    fx.drawSpeedAtmosphere(ctx,state,{reduced:true});assert.equal(draws.length,0);
    fx.drawSpeedAtmosphere(ctx,state,{playing:false});assert.equal(draws.length,0);
    assert.deepEqual(copy(state),before,'rendering cannot mutate distance, clock, speed, damage or music');
  }
  assert(fx.speedCamera({speed:75,boostMs:1000,passFlashMs:780,stumbleMs:0,elapsedMs:0}).zoom>
    fx.speedCamera({speed:30,boostMs:0,passFlashMs:0,stumbleMs:0,elapsedMs:0}).zoom);
  // Slow gives the full aperture; acceleration/fast/Turbo visibly tighten it.
  const state={speed:30,boostMs:0,passFlashMs:0,stumbleMs:0,steer:0,elapsedMs:0};
  assert.equal(fx.speedCamera(state).zoom,1);
  assert.deepEqual(copy(fx.speedCamera({...state,steer:1})),{zoom:1,x:0,y:0,roll:0},'slow steering retains the full un-cropped aperture');
  assert(fx.speedCamera({...state,speed:70}).zoom>1.21);
  assert(fx.speedCamera({...state,speed:75,boostMs:1000}).zoom>1.29);
  const up={...state,speed:52,musicBeatFloat:.375,driveSections:[{beat:0,speed:70,v0:30}]};
  const down={...up,driveSections:[{beat:0,speed:30,v0:70}]};
  assert(fx.speedCamera(up).zoom>fx.speedCamera(down).zoom+.04,'opposite gear changes give opposite camera pressure');
  const a=fx.speedCamera({...state,speed:70}),b=fx.speedCamera({...state,speed:70,elapsedMs:1000});
  assert(Math.abs(a.zoom-b.zoom)>.005&&Math.abs(b.roll)>.001,'moving camera breathes and wobbles');
  const still={zoom:1,x:0,y:0,roll:0};
  // A real input edge/reversal changes the target, never the rendered pose.
  // Constant-target damping must give the same response at each frame rate.
  const endings=[];
  for(const fps of [24,30,60,120]) {
    const moving={...state,speed:70,steer:1};
    fx.advanceCamera(moving,0);const initial=copy(fx.speedCamera(moving));
    fx.advanceCamera(moving,1000/fps);const first=copy(fx.speedCamera(moving));
    assert(Math.abs(first.x-initial.x)<3&&Math.abs(first.roll-initial.roll)<.002,'no steering snap');
    for(let n=1;n<fps/2;n++)fx.advanceCamera(moving,1000/fps);
    const held=copy(fx.speedCamera(moving));moving.steer=-1;
    assert.deepEqual(copy(fx.speedCamera(moving)),held,'reversing input waits for the update owner');
    for(let n=0;n<fps/2;n++)fx.advanceCamera(moving,1000/fps);
    const reversed=copy(fx.speedCamera(moving));assert(reversed.x>held.x+25,'camera follows the new turn after trailing');
    const before=copy(moving);fx.speedCamera(moving);assert.deepEqual(copy(moving),before,'draw cannot advance follow');
    endings.push(reversed);
    fx.advanceCamera(moving,16,{reduced:true});assert.deepEqual(copy(fx.speedCamera(moving)),still,'accessibility clears accumulated camera momentum');
  }
  for(const end of endings)for(const key of ['zoom','x','y','roll'])
    assert(Math.abs(end[key]-endings[0][key])<1e-10,'exact follow is frame-rate independent for equal input duration');
  assert.equal(fx.cameraEdgeMarker(still,{x:960,y:700,width:100,height:130}),null);
  for(const [x,y,angle] of [[10,700,Math.PI],[1910,700,0],[960,175,-Math.PI/2],[960,1080,Math.PI/2]]) {
    const marker=fx.cameraEdgeMarker(still,{x,y,width:70,height:40});
    assert(marker&&marker.x>=58&&marker.x<=1862&&marker.y>=214&&marker.y<=1026);
    assert.equal(marker.angle,angle,'warning points toward the cropped actor, even when partly visible');
  }
  for(let t=0;t<6000;t+=100)for(const speed of [30,52,70,75])for(const steer of [-1,0,1]) {
    const camera=fx.speedCamera({...state,speed,steer,elapsedMs:t,boostMs:speed===75?900:0});
    const tire=fx.cameraPoint(camera,960,fx.CAMERA_PIVOT_Y);
    assert(Math.abs(tire.y-fx.CAMERA_PIVOT_Y)<=14,'zoom pivot keeps timing plane in view');
    for(const x of [500,805,1115,1420]) {
      const button=fx.cameraPoint(camera,x,fx.CAMERA_PIVOT_Y+78);
      assert(button.y>184&&button.y<1040,'all four lane destinations fit throughout the camera envelope');
    }
  }
  // Dense cropped actors cannot stack warnings for the same moving lane.
  let warningPositions=[],buttons=[];
  const warningCtx=new Proxy({save(){},restore(){},translate(x,y){warningPositions.push([x,y]);},rotate(){},
    moveTo(){}}, {get:(o,k)=>k in o?o[k]:()=>{}});
  r.w.BARCODE.CacheRoadGuidance={drawButton:(c,args)=>buttons.push(args)};
  const warnings=Array.from({length:12},(_,i)=>({lane:i/4,d:120-i,marker:{x:58,y:250+i*55,angle:Math.PI}}));
  fx.drawCameraWarnings(warningCtx,warnings,{x:1950,y:900,width:60,height:60,action:2,strike:true},still);
  assert.equal(buttons.length,1);assert.equal(buttons[0].index,2);assert.equal(buttons[0].active,true);
  assert.equal(warningPositions.length,5,'four distinct lane warnings plus one target, independent of actor density');
  buttons=[];fx.drawCameraWarnings(warningCtx,[],{x:960,y:930,width:60,height:60,action:1},still);
  assert.equal(buttons.length,0,'visible target gets no duplicate edge cue');
  r.w.BARCODE_RENDER_QUALITY={flashes:false};draws.length=0;
  assert.deepEqual(copy(fx.speedCamera({...state,speed:75,boostMs:1000})),still);
  fx.drawSpeedAtmosphere(ctx,{...state,speed:75});assert.equal(draws.length,0);
  console.log('Shared cutscenes: separate reading/page/final actions, transcript/pause, failed audio pause and independent skip holds passed. Speed FX: 60 live-state combinations, bounded draw/clip/camera, dynamic gear aperture, protected timing pivot, edge warnings, Reduced Motion/Flashes Off and state immutability passed.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
