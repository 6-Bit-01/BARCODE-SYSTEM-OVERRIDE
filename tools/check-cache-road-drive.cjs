// Physical road/music invariants, using production transport and driving code.
// Unlike a formula-only cue check, these vary controls after pads are visible
// and compare each pad against independently observed world displacement.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createRig,load}=require('./check-level-01-boss');
function rig(saved={}) {
  const {w,context,listeners}=createRig(),B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};
  load(context,'src/engine/cache-road-proof-profile.js');
  load(context,'src/game/cache-road-landscape.js');
  const source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
  vm.runInContext(source.replace('  const road = B.CacheRoadProof = {',
    '  window.driveTest={newState,pulseVisual,shiftOffset,PULSES,STRIKE_DISTANCE,STRIKE_DEPTH};\n  const road = B.CacheRoadProof = {'),context);
  const road=B.CacheRoadProof;
  road.active=true;road.status='playing';road.state=w.driveTest.newState(saved);
  road.state.invulnerableMs=1e8;
  road.state.timeMs=1e8;
  road.selectMusicProfile();
  B.MusicTransport.start({sourceAnchorAudioSec:0,sourceOffsetTrackSec:0});
  w.audioSystem.context.currentTime=0;
  return {w,B,context,listeners,road,inspect:w.driveTest};
}
const beatSec=60/128;
function tick(r,beat,actions={},delta=1000/60) {
  r.w.audioSystem.context.currentTime=beat*beatSec;
  r.road.handleActions(actions);r.road.update(delta);
}
function keyboardRig(saved={}) {
  const r=rig(saved);
  for(const file of ['src/core/action-input.js','src/core/input.js','src/game/pause-menu.js',
    'src/game/cache-road-cinematics.js'])load(r.context,file);
  const manager=r.w.inputManager=new r.w.InputManager();
  const key=(type,value,repeat=false)=>{
    const event={key:value,repeat,shiftKey:false,timeStamp:r.w.performance.now(),preventDefault(){}};
    for(const listener of r.listeners[type]||[])listener(event);
  };
  const frame=(beat=r.w.audioSystem.context.currentTime/beatSec,options={})=>{
    r.w.audioSystem.context.currentTime=beat*beatSec;
    manager.update(options);r.road.update(1000/60);return manager.actionInput.state;
  };
  frame();return {...r,manager,key,frame};
}
function checkKeyboard() {
  // Dispatch the actual shared listener, including keyup before the next RAF.
  // These diagnostic fixtures stage only the starting gear/audio clock.
  for(const [key,action,direction] of [['ArrowUp','move_up',1],['w','move_up',1],
    ['ArrowDown','move_down',-1],['s','move_down',-1]]) {
    const r=keyboardRig();r.key('keydown',key);r.key('keydown',key,true);r.key('keyup',key);
    const state=r.frame();
    assert(state[action].pressed&&state[action].released&&!state[action].held,
      `${key}: a completed between-frame gear tap retains its discrete edge`);
    assert.equal(state[action].presses.length,1,'browser key repeat does not duplicate a gear tap');
    assert.equal(r.road.state.pendingGear,1+direction,'real road owner queues the selected gear');
    assert.equal(r.road.state.pendingGearBeat,4);
    r.frame(4.8);assert.equal(r.road.state.gear,1+direction,'real next ONE commits the short-tap gear');
  }
  for(const [key,alias,action,direction,gear] of [['ArrowUp','w','move_up',1,0],
    ['ArrowDown','s','move_down',-1,2]]) {
    const r=keyboardRig({gear});r.key('keydown',key);r.frame();
    assert.equal(r.road.state.pendingGear,1);
    r.key('keydown',key,true);r.key('keydown',alias);r.key('keyup',key);
    const held=r.frame(4.8);
    assert(held[action].held&&!held[action].pressed,'held aliases share one gear stroke');
    assert.equal(r.road.state.gear,1);
    r.frame(8.8);assert.equal(r.road.state.gear,1,'holding never queues a second gear');
    assert.equal(r.road.state.pendingGear,null);
    r.key('keyup',alias);r.frame();r.key('keydown',alias);r.key('keyup',alias);r.frame();
    assert.equal(r.road.state.pendingGear,1+direction,'release rearms one new alias tap');
    r.frame(12.8);assert.equal(r.road.state.gear,1+direction);
  }
  {
    const r=keyboardRig();
    for(const key of ['ArrowUp','ArrowDown']){r.key('keydown',key);r.key('keyup',key);}
    r.frame();assert.equal(r.road.state.pendingGear,0,'Down retains priority over simultaneous Up');
    r.key('keydown','ArrowRight');r.key('keyup','ArrowRight');r.frame();
    assert.equal(r.road.state.steer,0,'continuous steering does not acquire discrete queued taps');
    r.key('keydown','ArrowRight');r.frame();assert.equal(r.road.state.steer,1);
    r.key('keydown','ArrowLeft');r.frame();assert.equal(r.road.state.steer,0);
    r.key('keyup','ArrowLeft');r.frame();assert.equal(r.road.state.steer,1);
  }
  {
    const r=keyboardRig();r.key('keydown','ArrowUp');r.key('keyup','ArrowUp');
    for(const listener of r.listeners.blur||[])listener();r.frame();
    assert.equal(r.road.state.pendingGear,null,'focus loss cancels an unconsumed gear tap');
    r.key('keydown','ArrowRight');r.frame();
    for(const listener of r.listeners.blur||[])listener();r.frame();
    assert.equal(r.road.state.steer,0,'focus loss releases continuous steering');
    r.key('keydown','ArrowUp');r.key('keyup','ArrowUp');
    r.frame(undefined,{inputOnly:true,context:{paused:true}});r.frame();
    assert.equal(r.road.state.pendingGear,null,'suppressed context consumes a tap without leaking after resume');
    r.w.isPaused=r.w.gameState.paused=true;
    r.key('keydown','ArrowUp');r.key('keyup','ArrowUp');r.manager.updatePausedInput();
    assert.equal(r.road.state.pendingGear,null,'actual settings owner consumes gear keys while paused');
    r.w.isPaused=r.w.gameState.paused=false;r.B.PauseMenu.sync();r.frame();
    assert.equal(r.road.state.pendingGear,null,'menu keys cannot become gear taps after resume');
  }
  for(const context of ['level1','intro','handoff','results']) {
    const r=keyboardRig();
    if(context==='level1')r.road.active=false;
    else if(context==='intro')r.road.introMs=0;
    else if(context==='handoff')r.road.handoffMs=100;
    else r.road.status='failed';
    r.key('keydown','ArrowUp');r.key('keyup','ArrowUp');
    const state=r.frame();
    assert(!state.move_up.pressed,`${context}: no road-only queued gear edge`);
    assert.equal(r.road.state.pendingGear,null);
    if(context==='level1') {
      assert(state.jump.pressed,'Level 1 retains its existing between-frame jump edge');
      r.key('keydown','ArrowUp');r.frame();assert(r.manager.actionInput.state.move_up.held,
        'Level 1 movement remains continuously held');
    }
  }
  console.log('PASS: real keyboard gear taps/aliases/ONE commits, held/repeat/priority, continuous steering, blur/pause/menu/context and Level 1 isolation');
}
function run() {
  checkKeyboard();
  let checks=0,arrivals=0,maxPixelError=0;
  for(const gear of [0,1,2]) {
    const r=rig({gear});tick(r,0);
    const observed=new Map();let previousProgress=0;
    // 64 subdivisions include exact beats and both sides of every boundary.
    for(let n=1;n<=64*96;n++) {
      const beat=n/64,s=r.road.state;
      const actions={};
      if(n%397===17)actions.move_up={pressed:true};
      if(n%277===31)actions.move_down={pressed:true};
      if(n===701||n===1949) {s.boost=1;actions.road_turbo={pressed:true};}
      if(n===1167) {s.invulnerableMs=0;r.road.hit('van');s.invulnerableMs=1e8;}
      tick(r,beat,actions,n%81===0?190:1000/60);
      assert(s.progress>=previousProgress,'forward travel never jumps backward');
      const advance=s.progress-previousProgress;
      for(const pulse of r.inspect.PULSES) {
        const cue=r.inspect.pulseVisual(pulse,s,beatSec);if(!cue)continue;
        assert.equal(cue.target%4,0,'only first beats own action targets');
        const prior=observed.get(pulse.id);
        if(prior) {
          assert.equal(cue.target,prior.target,'announced deadlines are immutable');
          assert.equal(cue.at,prior.at,'announced road paint never changes address');
          assert(Math.abs(cue.d-prior.d+advance)<1e-8,'pad and world move by the same distance');
          checks++;
        }
        if(Math.abs(beat-cue.target)<1e-9) {
          const t=1-(cue.d+80)/520;
          const error=Math.abs((400+680*t*t)-(400+680*.83*.83-119*.14));
          maxPixelError=Math.max(maxPixelError,error);
          assert(error<1e-7,'physical painted pad meets rear axle at beat one');arrivals++;
        }
        if(cue.window)assert.equal(r.inspect.shiftOffset(s,false),0,
          'the entire accepted button window has a settled car on its hit plane');
        observed.set(pulse.id,{target:cue.target,at:cue.at,d:cue.d});
      }
      previousProgress=s.progress;
    }
  }
  assert(arrivals>=20,'exercise many independent road targets across all gears');
  // Input received just AFTER a boundary cannot change the bar already begun,
  // even when the render/update which observes that boundary is late.
  for(const requestBeat of [3.99,4,4.01]) {
    const r=rig();tick(r,0);tick(r,3.9);
    tick(r,requestBeat,{move_up:{pressed:true}});
    const expected=requestBeat<4?4:8;
    assert.equal(r.road.state.pendingGearBeat,expected);
    tick(r,4.8);
    assert.equal(r.road.state.gear,requestBeat<4?2:1);
    tick(r,8.8);assert.equal(r.road.state.gear,2);
  }
  const endpoints=[];
  // Real wrecks select first gear, clear pre-crash boosts/shifts and stay in
  // first after the recovery bar. Revealed paint retains its physical ONE.
  for(const protectedBy of ['none','push','brace','turbo','grace']) {
    const r=rig({gear:2});tick(r,0);tick(r,2);const s=r.road.state;
    s.invulnerableMs=protectedBy==='grace'?100:0;
    s.ramMs=protectedBy==='push'?100:0;s.shield=protectedBy==='brace'?1:0;
    s.boostMs=protectedBy==='turbo'?100:0;
    s.pendingGear=1;s.pendingGearBeat=4;s.queuedTurbo=true;s.turboBeat=4;
    s.queuedSurge=true;s.surgeBeat=4;
    const addresses=JSON.stringify([s.pulseTargets,s.pulsePlaces]);
    r.road.hit('van');
    if(protectedBy!=='none') {assert.equal(s.gear,2,'blocked contact is not a wreck');continue;}
    assert.equal(s.gear,0);assert.equal(s.pendingGear,null);assert(!s.queuedTurbo&&!s.queuedSurge);
    assert.equal(JSON.stringify([s.pulseTargets,s.pulsePlaces]),addresses,'wreck never moves announced paint');
    s.invulnerableMs=1e8;
    // New requests during crash recovery cannot defeat the first-gear reset.
    tick(r,3,{move_up:{pressed:true},road_turbo:{pressed:true}});
    tick(r,4.8);assert.equal(s.gear,0);assert.equal(s.speed,30);assert(!s.queuedRecovery);
    tick(r,8.8);assert.equal(s.gear,0);assert.equal(s.speed,30,'no automatic return to the old gear');
    tick(r,9,{move_up:{pressed:true}});tick(r,12.8);assert.equal(s.gear,1,'normal manual acceleration resumes');
  }
  for(const fps of [24,30,60,120]) {
    const r=rig();tick(r,0);
    for(let frame=1;frame<=fps*12;frame++)tick(r,frame/fps/beatSec,{},1000/fps);
    endpoints.push(r.road.state.progress);
  }
  assert(Math.max(...endpoints)-Math.min(...endpoints)<1e-8,'road distance is independent of frame rate');
  // A suspended audio transport freezes physical travel, including active shifts.
  const p=rig();tick(p,0);tick(p,3,{move_up:{pressed:true}});
  p.B.MusicTransport.pause(p.w.audioSystem.context.currentTime);
  const frozen=p.road.state.progress;
  p.w.audioSystem.context.currentTime+=9;p.road.update(100);
  assert.equal(p.road.state.progress,frozen);
  p.B.MusicTransport.resume(p.w.audioSystem.context.currentTime);p.road.update(16);
  assert(Math.abs(p.road.state.progress-frozen)<1e-7);
  const endings=[];
  for(const gear of [0,1,2]) {
    const r=rig({gear});tick(r,0);let sent=false;
    for(let frame=1;frame<=8000&&r.road.status==='playing';frame++) {
      const s=r.road.state;
      if(s.gateAt!==null&&!sent&&s.progress>s.gateAt-140) {
        s.lanePos=s.lane=0;s.trace=[{steer:0,duration:1500}];
        r.road.sendEcho();s.lanePos=s.lane=3;sent=true;
      }
      tick(r,frame/20,{move_right:{held:sent&&s.lanePos<2.95}},60/128/20*1000);
    }
    assert.equal(r.road.status,'clear',`gear ${gear+1} can complete the whole song and Echo exit`);
    endings.push({gear:gear+1,progress:r.road.state.progress,gate:r.road.state.gateAt});
  }
  console.log(JSON.stringify({physicalDisplacementChecks:checks,downbeatArrivals:arrivals,maxPixelError,frameRates:[24,30,60,120],boundaryInputs:3,pauseResume:true,endings}));
}
if(require.main===module)process.argv.includes('--keyboard')?checkKeyboard():run();
module.exports={rig,tick,checkKeyboard,run};
