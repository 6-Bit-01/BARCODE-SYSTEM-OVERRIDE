// Production Campaign, bridge, input, RAF, lifecycle and Cache Road owners.
// Storage, Canvas and the asynchronous audio host are supplied at boundaries.
// This is deterministic integration evidence, not browser/device acceptance.
const assert=require('node:assert/strict');
const {campaignRig}=require('./check-boss-music-campaign.cjs');
const {load}=require('./check-level-01-boss');
const copy=value=>JSON.parse(JSON.stringify(value));
const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};

function bridgeRig(storage) {
  const r=campaignRig(storage),{w,context,listeners}=r,B=w.BARCODE,C=B.Campaign;
  r.reachReady();
  for(const file of ['src/engine/cache-road-proof-profile.js','src/game/cache-road-landscape.js',
    'src/game/cache-road-proof.js','src/engine/cache-bridge.js','src/core/action-input.js',
    'src/core/gamepad-ui.js','src/core/input.js'])load(context,file);
  const road=B.CacheRoadProof,bridge=B.CacheBridge;
  const pad={index:0,id:'Bridge boundary pad',mapping:'standard',connected:true,
    buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0]};
  w.navigator.getGamepads=()=>[pad];
  w.inputManager=new w.InputManager();
  const gradient={addColorStop(){}};
  const ctx=new Proxy({globalAlpha:1,font:'20px monospace',filter:'none',
    measureText:text=>({width:String(text).length*11}),
    createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},
  {get:(target,key)=>key in target?target[key]:()=>{}});
  const canvas={width:1920,height:1080,style:{},getContext:()=>ctx};ctx.canvas=canvas;
  canvas.getBoundingClientRect=()=>({left:0,top:0,width:1920,height:1080});
  w.document.getElementById=id=>id==='gameCanvas'?canvas:null;
  w.document.querySelector=()=>null;
  w.renderer.canvas=canvas;w.renderer.ctx=canvas.getContext('2d');
  let clock=w.performance.now(),raf=0;
  w.performance.now=()=>clock;w.Date.now=()=>clock;
  w.requestAnimationFrame=()=>++raf;w.cancelAnimationFrame=()=>{};
  w.renderGame=()=>{};
  const observed={roadEntries:0,musicStarts:[],prepared:[],worldUpdates:0,roadUpdates:0};
  const enter=road.enter.bind(road),roadUpdate=road.update.bind(road);
  road.enter=(...args)=>{observed.roadEntries++;return enter(...args);};
  road.update=(...args)=>{observed.roadUpdates++;return roadUpdate(...args);};
  const updateGame=w.updateGame;
  w.updateGame=(...args)=>{observed.worldUpdates++;return updateGame?.(...args);};
  const audio=w.audioSystem;
  audio.context={currentTime:0,state:'running',sampleRate:48000};
  audio.prepareActiveMusicProfile=async()=>{
    const profile=B.MusicProfiles.getActive();observed.prepared.push(profile.profileId);
    if(profile.profileId==='level-02.proof'&&audio.roadPreparation) {
      const result=await audio.roadPreparation();if(!result?.ok)return result;
    }
    audio.musicTracks=Object.fromEntries(profile.arrangement.sources.map(source=>
      [source.sourceId,{buffer:{duration:profile.profileId==='level-02.proof'?187.5:212.088},isFallback:false}]));
    return {ok:true};
  };
  audio.startRuntimeGameplayMusic=()=>{
    const profile=B.MusicProfiles.getActive();
    if(profile.profileId==='level-02.proof'&&audio.failRoadStart)return {ok:false,reason:'boundary-start-failed'};
    observed.musicStarts.push(profile.profileId);
    const result=B.MusicTransport.start({sourceAnchorAudioSec:audio.context.currentTime,
      sourceOffsetTrackSec:profile.profileId==='level-02.proof'?road.startOffsetSec():0});
    return {ok:result.status==='ok'&&result.running};
  };
  audio.stopRuntimeAudio=()=>{r.calls.audioStops++;B.MusicTransport.stop();};
  audio.updateLayers=()=>{};
  load(context,'src/core/runtime-lifecycle.js');
  load(context,'src/core/loop.js');
  const key=(name,held,repeat=false)=>{
    for(const listener of listeners[held?'keydown':'keyup']||[])
      listener({key:name,repeat,shiftKey:false,preventDefault(){}});
  };
  const tap=name=>{key(name,true);key(name,false);};
  const input=()=>w.inputManager.update();
  input();
  function step(ms,rate=60) {
    for(let remaining=ms;remaining>1e-7;) {
      const delta=Math.min(remaining,1000/rate);remaining-=delta;clock+=delta;
      if(!w.isPaused)audio.context.currentTime+=delta/1000;
      w.gameLoop(clock);
    }
  }
  function finish() {
    assert(r.p.completeLevel());
    // The victory card's own delayed-release protection is independently
    // exercised by check-controller-victory; this fixture starts after it.
    r.p.completion.controlsReady=true;
    return copy(C.readResume());
  }
  async function boot(saved=finish()) {
    C.archive().checkpoint(saved);
    const result=await B.RuntimeLifecycle.start({resume:saved});
    assert(result.ok,JSON.stringify(result));input();return saved;
  }
  return {...r,B,C,bridge,road,audio,pad,canvas,observed,key,tap,input,step,finish,boot,
    roadStarts:()=>observed.musicStarts.filter(id=>id==='level-02.proof').length};
}

async function checkPagesAndFacts() {
  const r=bridgeRig(),{B,C,bridge,road,w}=r;
  const saved=await r.boot();
  assert.equal(bridge.panels.length,8,'the playable bridge has eight pages');
  assert(bridge.active&&C.intermission&&w.gameState.victory&&!w.gameState.running);
  assert.equal(bridge.page,0);assert.equal(bridge.cue,0);
  assert.deepEqual(copy(C.archive().record.progress.items),['stem.voice'],
    'the real Level1 completion grants Voice once, not the future Bass key');
  const points=w.gameState.score,results=copy(C.archive().record.progress.results);
  const traversed=[];
  for(let page=0;page<8;page++) {
    for(let cue=0;cue<3;cue++) {
      assert.equal(bridge.page,page);assert.equal(bridge.cue,cue);
      traversed.push(`${page}:${cue}`);
      const checkpoint=C.readResume();
      assert.equal(checkpoint.checkpointId,'intermission');
      assert.equal(checkpoint.levelState.cacheBridge.page,page);
      assert.equal(checkpoint.levelState.cacheBridge.cue,cue);
      assert(!road.active&&road.state===null&&r.roadStarts()===0,
        'reading/revealing every cue cannot start the road clock or song');
      if(page===7&&cue===2)break;
      r.tap('Enter');
    }
  }
  assert.equal(new Set(traversed).size,24,'every title and dialogue cue is traversed exactly once');
  r.step(12000);
  assert.equal(bridge.page,7);assert.equal(bridge.cue,2);
  assert(!road.active&&r.roadStarts()===0,'the final Ready page waits indefinitely for Drive');
  assert.equal(r.observed.worldUpdates,0);assert.equal(r.observed.roadUpdates,0,
    'the actual RAF gives the bridge exclusive simulation ownership');
  assert.equal(C.run.elapsedMs,saved.levelState.run.elapsedMs);
  assert.equal(w.gameState.score,points);assert.deepEqual(copy(C.archive().record.progress.results),results);
  r.tap('Enter');await flush();
  assert(road.active&&!bridge.active&&!C.intermission);
  assert.equal(r.observed.roadEntries,1);assert.equal(r.roadStarts(),1);
  assert.equal(road.state.elapsedMs,0,'road simulation begins only after the final handoff');
  assert.equal(C.readResume().levelId,'level-02');
  assert(!C.archive().record.progress.items.includes('stem.bass'));
  return 24;
}

async function checkHeldControls() {
  for(const control of ['Enter',' ','S','pad-confirm','pad-skip']) {
    const r=bridgeRig(),{bridge,C,pad}=r;
    if(control==='pad-confirm')pad.buttons[0].pressed=true;
    else if(control==='pad-skip')pad.buttons[1].pressed=true;
    else r.key(control,true);
    r.input();r.finish();assert(C.openIntermission());
    r.step(7000);
    if(!control.startsWith('pad'))r.key(control,true,true);
    r.input();
    assert.equal(bridge.page,0,`${control} carried in from combat cannot leave the first page`);
    assert.equal(r.roadStarts(),0);
    if(control==='pad-confirm')pad.buttons[0].pressed=false;
    else if(control==='pad-skip')pad.buttons[1].pressed=false;
    else r.key(control,false);
    r.input();
    r.tap('Enter');assert.equal(bridge.page,1,'a released, fresh confirm advances one page');
  }
  const r=bridgeRig(),{bridge,pad}=r;await r.boot();
  r.key('Enter',true);const first=bridge.cue;
  for(let i=0;i<20;i++)r.key('Enter',true,true);
  assert.equal(bridge.cue,first,'keyboard repeat cannot consume further cues');
  r.key('Enter',false);
  pad.buttons[0].pressed=true;r.input();const next=bridge.cue;
  for(let i=0;i<20;i++)r.input();
  assert.equal(bridge.cue,next,'a held controller confirm has one edge');
  pad.buttons[0].pressed=false;r.input();
}

async function checkSkipAndEscape() {
  for(const released of ['keyboard','gamepad']) {
    const r=bridgeRig(),{bridge,pad,C}=r;await r.boot();
    r.key('s',true);pad.buttons[1].pressed=true;r.input();r.step(2000);
    if(released==='keyboard')r.key('s',false);
    else {pad.buttons[1].pressed=false;r.input();}
    r.step(2000);
    assert(bridge.skipMs>=3999,'releasing one physical skip source preserves the other hold');
    r.key('s',false);pad.buttons[1].pressed=false;r.input();r.step(20);
    assert.equal(bridge.skipMs,0,'releasing all skip sources resets the hold');
    r.key('s',true);r.step(4990);
    assert(bridge.page<7,'skip requires the full five-second hold');
    r.step(20);assert.equal(bridge.page,7);assert.equal(bridge.cue,2);
    r.step(6000);assert.equal(r.observed.roadEntries,0,'skip reaches Ready without starting Drive');
    r.key('s',false);r.tap('Escape');
    assert(!bridge.active&&!C.intermission&&r.w.gameState.victory);
    assert.equal(C.readResume().levelState.cacheBridge.page,7,'Back retains bridge reading progress');
    r.step(500); // Preserve the results card's existing release-to-arm gate.
    assert(C.openIntermission());assert.equal(bridge.page,7);assert.equal(bridge.cue,2);
    assert.equal(r.roadStarts(),0,'returning from results does not silently enter road');
  }
  const r=bridgeRig(),{bridge,B}=r;await r.boot();
  r.key('s',true);r.step(2000);
  r.tap('t');assert(bridge.transcriptOpen);
  const before=bridge.skipMs;
  const cue=bridge.cue,elapsed=bridge.cueElapsedMs;r.step(7000);
  assert.equal(bridge.skipMs,before);assert.equal(bridge.cue,cue);
  assert.equal(bridge.cueElapsedMs,elapsed,'transcript reading freezes cue and skip clocks');
  r.tap('t');assert(!bridge.transcriptOpen);r.key('s',false);
  await B.RuntimeLifecycle.pause('bridge-test');
  const paused=copy(bridge.serialize());r.step(7000);
  assert.deepEqual(copy(bridge.serialize()),paused);
  await B.RuntimeLifecycle.resume('bridge-test');
  r.input(); // Neutral poll hands ownership back from the pause menu.
  r.pad.buttons[8].pressed=true;r.input();
  assert(!bridge.active&&!r.C.intermission,'controller Back returns to results');
}

async function checkSaves() {
  const r=bridgeRig(),{bridge,C}=r,legacy=await r.boot();
  const progress=copy(C.archive().record.progress),score=r.w.gameState.score;
  for(const malformed of [undefined,null,'bad',[],{},
    {version:99,page:7,cue:2},{version:1,page:Infinity,cue:-1},
    {version:1,page:-9,cue:'2'},{version:1,page:100,cue:100}]) {
    const saved=copy(legacy);saved.levelState.cacheBridge=malformed;
    assert(C.validateLevel01Checkpoint(saved),'optional malformed bridge metadata does not destroy a valid old checkpoint');
    C.closeIntermission();
    assert(C.restore(saved));
    assert(bridge.active&&Number.isInteger(bridge.page)&&bridge.page>=0&&bridge.page<8&&
      Number.isInteger(bridge.cue)&&bridge.cue>=0&&bridge.cue<3,
    'bridge metadata is bounded on actual campaign restore');
  }
  for(let page=0;page<8;page++)for(let cue=0;cue<3;cue++) {
    const saved=copy(legacy);saved.levelState.cacheBridge={version:1,page,cue};
    C.closeIntermission();
    C.archive().checkpoint(saved);assert(C.restore(C.readResume()));
    assert.equal(bridge.page,page);assert.equal(bridge.cue,cue);
    assert.deepEqual(copy(bridge.serialize()),{version:1,page,cue});
  }
  for(const corrupt of [saved=>{saved.levelState.score=-1;},
    saved=>{saved.levelState.boss=null;},saved=>{saved.levelState.run.levelId='level-02';}]) {
    const saved=copy(legacy);corrupt(saved);
    assert(!C.validateLevel01Checkpoint(saved));assert(!C.restore(saved),
      'invalid parent checkpoints cannot bypass validation through direct restore');
  }
  assert.equal(r.w.gameState.score,score);
  assert.deepEqual(copy(C.archive().record.progress),progress,
    'reopening any page or rejecting malformed saves never re-awards score or stem keys');
  r.tap('Enter');await flush();assert(r.road.active);
  const roadSave=copy(C.readResume());assert(await r.road.exit());
  const nested=copy(C.readResume().levelState.cacheRoadCheckpoint);
  assert(nested&&nested.checkpointId==='road-start');
  const parent=C.readResume();parent.levelState.cacheBridge={version:1,page:3,cue:1};
  C.closeIntermission();C.archive().checkpoint(parent);assert(C.restore(parent));r.tap('Enter');
  assert.deepEqual(copy(C.readResume().levelState.cacheRoadCheckpoint),nested,
    'bridge progress saves preserve the nested road checkpoint');
  const reopened=bridgeRig(r.storage);await reopened.boot(roadSave);
  assert(reopened.road.active&&!reopened.bridge.active,
    'resuming a real road checkpoint does not force the bridge to replay');
  assert.equal(reopened.roadStarts(),1);
}

async function checkPendingAndFailure() {
  for(const failure of ['prepare','reject','start']) {
    const r=bridgeRig(),{bridge,road,audio,C}=r;
    const saved=r.finish();saved.levelState.cacheBridge={version:1,page:7,cue:2};
    await r.boot(saved);
    if(failure==='prepare')audio.roadPreparation=async()=>({ok:false,failures:[{sourceId:'cache-original'}]});
    if(failure==='reject')audio.roadPreparation=async()=>{throw Error('boundary-fetch-rejected');};
    if(failure==='start')audio.failRoadStart=true;
    r.tap('Enter');await flush();
    assert(!road.active&&!road.pending&&!bridge.pending&&bridge.active&&C.intermission,
      `${failure} failure restores a usable bridge`);
    assert.equal(bridge.page,7);assert.equal(bridge.cue,2);
    assert.equal(C.readResume().levelId,'level-01');assert.equal(r.roadStarts(),0);
    audio.roadPreparation=null;audio.failRoadStart=false;
    r.tap('Enter');await flush();
    assert(road.active&&!bridge.active);assert.equal(r.roadStarts(),1,
      'a fresh confirmation can retry audio without duplicate road starts');
  }
  for(const cleanup of ['title','restart']) {
    const r=bridgeRig(),{bridge,road,audio,B}=r;
    const saved=r.finish();saved.levelState.cacheBridge={version:1,page:7,cue:2};
    await r.boot(saved);const gate=deferred();audio.roadPreparation=()=>gate.promise;
    r.tap('Enter');assert(bridge.pending&&road.pending);
    for(let i=0;i<12;i++){r.tap('Enter');bridge.advance();}
    assert.equal(r.observed.roadEntries,1,'pending preparation owns exactly one road entry');
    if(cleanup==='title')assert((await B.RuntimeLifecycle.stop('title')).ok);
    else assert((await B.RuntimeLifecycle.restart({source:'bridge-reset-test'})).ok);
    assert(!bridge.active&&!bridge.pending&&!road.active);
    gate.resolve({ok:true});await flush();
    assert(!road.active&&!bridge.active&&!road.pending);
    assert.equal(r.roadStarts(),0,'cancelled async preparation cannot resurrect road after cleanup');
  }
  const r=bridgeRig();await r.boot();r.key('s',true);r.step(2000);
  r.C.resetSession();assert(!r.bridge.active&&!r.bridge.pending&&r.bridge.skipMs===0,
    'campaign reset releases bridge state and held skip input');
}

async function checkArchitectureCancellation() {
  // The DEV shortcut shares the bridge's input and async handoff. Exercise
  // its real adapter too: cancelling the comic must invalidate late L3 work.
  for(const cleanup of ['title','restart'])for(const completion of ['resolve','reject']) {
    const r=bridgeRig(),{B,C,bridge,audio,context}=r;
    load(context,'src/engine/broadcast-slum-proof-profile.js');
    load(context,'src/game/broadcast-slum-proof.js');
    await r.boot();
    const proof=B.RunAndGunProof,gate=deferred();
    const prepare=audio.prepareActiveMusicProfile.bind(audio);
    audio.prepareActiveMusicProfile=async()=>{
      if(B.MusicProfiles.getActive().profileId==='level-03.proof')await gate.promise;
      return prepare();
    };
    const enter=proof.enter.bind(proof);let entries=0;
    proof.enter=(...args)=>{entries++;return enter(...args);};
    const pending=bridge.architecture();
    assert(bridge.pending&&proof.pending);
    for(let i=0;i<5;i++)await bridge.architecture();
    assert.equal(entries,1,'pending DEV preparation owns one real architecture entry');
    if(cleanup==='title')assert((await B.RuntimeLifecycle.stop('title')).ok);
    else assert((await B.RuntimeLifecycle.restart({source:'bridge-dev-reset-test'})).ok);
    const archive=copy(C.archive().record),musicStarts=r.observed.musicStarts.length;
    if(completion==='resolve')gate.resolve({ok:true});
    else gate.reject(Error('late architecture fetch rejected'));
    const result=await pending;await flush();
    assert.equal(result?.reason,'handoff-cancelled');
    assert(!proof.active&&!proof.pending&&!bridge.active&&!bridge.pending,
      `${cleanup}/${completion}: a cancelled DEV handoff cannot restore either owner`);
    assert.equal(r.observed.musicStarts.length,musicStarts,
      'late DEV preparation cannot start any gameplay music');
    assert.deepEqual(copy(C.archive().record),archive,
      'late DEV completion cannot overwrite the current campaign checkpoint or progress');
  }
}

async function checkCancelledResume() {
  const r=bridgeRig(),{B,C,bridge,audio,w}=r,saved=r.finish();
  assert(r.road.selectMusicProfile().ok,'fixture leaves the prior road profile selected');
  const gate=deferred();let preparing=false,loopStarts=0;
  audio.prepareActiveMusicProfile=()=>{preparing=true;return gate.promise;};
  const startLoop=w.startGameLoop;
  w.startGameLoop=(...args)=>{loopStarts++;return startLoop(...args);};
  const pending=B.RuntimeLifecycle.start({resume:saved});await flush();
  assert(preparing&&B.RuntimeLifecycle.getState()==='starting');
  assert(!bridge.active,'the bridge waits for lifecycle profile preparation');
  assert((await B.RuntimeLifecycle.stop('title')).ok);
  const archive=copy(C.archive().record);
  gate.resolve({ok:true});const result=await pending;
  assert.equal(result.status,'stale-start');assert.equal(B.RuntimeLifecycle.getState(),'idle');
  assert(!bridge.active&&!w.isRunning&&!w.gameState.running,
    'late intermission preparation cannot reopen the bridge after returning to title');
  assert.equal(loopStarts,0);assert.equal(r.observed.musicStarts.length,0);
  assert.deepEqual(copy(C.archive().record),archive);
}

async function checkRoadResumeMusic() {
  const source=bridgeRig();await source.boot();
  source.bridge.skipToReady();await source.bridge.drive();
  // Produce valid saves through the actual adapter. This fixture establishes
  // saved states; the full route checker owns earning the Echo-gate clear.
  Object.assign(source.road.state,{progress:4500,musicBar:76,musicBeatFloat:304});
  source.road.checkpoint('road-verse-4');const playing=copy(source.C.readResume());
  Object.assign(source.road.state,{musicBar:100,musicBeatFloat:400,gateOpen:true,status:'clear'});
  source.road.status='clear';source.road.checkpoint('road-clear');
  const completed=copy(source.C.readResume()),facts=copy(source.C.archive().record.progress);
  assert(source.road.validate(playing)&&source.road.validate(completed));
  await source.B.RuntimeLifecycle.stop('fixture-title');

  const play=bridgeRig(source.storage);await play.boot(playing);
  assert.equal(play.road.status,'playing');assert.equal(play.road.state.musicBar,76);
  assert.equal(play.roadStarts(),1,'a playable saved road starts music exactly once');
  const transport=play.B.MusicTransport.getDiagnostics();
  assert(transport.running);assert.equal(transport.sourceOffsetTrackSec,76*1.875,
    'lifecycle restores the saved bar before audio reads the shared source offset');
  assert.deepEqual(copy(play.C.archive().record.progress),facts);
  await play.B.RuntimeLifecycle.stop('fixture-title');

  const result=bridgeRig(source.storage);await result.boot(completed);
  assert.equal(result.road.status,'clear');assert.equal(result.roadStarts(),0,
    'a completed road restores its result without briefly starting a song');
  assert(!result.B.MusicTransport.getDiagnostics().running);
  result.step(1000);
  assert.equal(result.road.status,'clear');assert.equal(result.roadStarts(),0);
  assert(!result.B.MusicTransport.getDiagnostics().running,
    'terminal shared-loop updates cannot restart the completed recording');
  assert.deepEqual(copy(result.C.archive().record.progress),facts,
    'completed Continue preserves Voice/results and awards no Bass or Level2 facts');
  assert(result.road.retry());assert.equal(result.road.status,'playing');
  assert.equal(result.roadStarts(),1,'deliberate Retry starts one fresh road song');
  assert.equal(result.B.MusicTransport.getDiagnostics().sourceOffsetTrackSec,0);
  assert.deepEqual(copy(result.C.archive().record.progress),facts);
  await result.B.RuntimeLifecycle.stop('fixture-title');

  const bridge=bridgeRig(source.storage);await bridge.boot(completed.levelState.returnTo);
  assert(bridge.bridge.active&&!bridge.road.active);assert.equal(bridge.roadStarts(),0);
  assert.equal(bridge.observed.musicStarts.length,0,'saved story bridge remains silent');
}

async function checkRoadResultControllerEdges() {
  for(const status of ['clear','failed'])for(const button of [0,3]) {
    const r=bridgeRig(),{B,road,pad}=r;await r.boot();
    r.bridge.skipToReady();await r.bridge.drive();
    load(r.context,'src/game/lore-records.js');load(r.context,'src/game/pause-menu.js');
    B.PauseMenu.snapshot={};B.PauseMenu.snapshotContext={drawImage(){}};
    r.input();assert.equal(B.GamepadUI.owner,'gameplay');
    const facts=copy(r.C.archive().record.progress),calls={retry:0,exit:0};let exitPromise;
    const retry=road.retry.bind(road),exit=road.exit.bind(road);
    road.retry=(...args)=>{calls.retry++;return retry(...args);};
    road.exit=(...args)=>{calls.exit++;return exitPromise=exit(...args);};
    // This physical press arrives after the last gameplay poll but before
    // the same frame's production update reaches its clear/failure result.
    pad.buttons[button].pressed=true;road.state.invulnerableMs=10000;
    if(status==='clear'){road.state.gateOpen=true;r.audio.context.currentTime=188;}
    else {road.state.timeMs=1;r.audio.context.currentTime=.1;}
    road.update(100);assert.equal(road.status,status);
    for(let i=0;i<5;i++)r.input();
    assert.equal(B.GamepadUI.owner,'road-results');
    assert.deepEqual(calls,{retry:0,exit:0},`${status}/b${button}: carried input cannot choose a result`);
    assert.equal(road.status,status);assert(road.active);

    if(button===0) {
      pad.buttons[9].pressed=true;r.input();await flush();
      assert(r.w.isPaused,'a fresh Menu button still pauses road results');
      r.input();assert.equal(B.GamepadUI.owner,'pause','pause owns input before road results');
      pad.buttons[9].pressed=false;r.input();pad.buttons[9].pressed=true;r.input();await flush();
      assert(!r.w.isPaused,'the actual pause menu accepts Menu to resume');
      r.input();pad.buttons[9].pressed=false;r.input();
      assert.deepEqual(calls,{retry:0,exit:0},'resuming cannot consume the held Retry button');
    }
    pad.buttons[button].pressed=false;r.input();
    pad.buttons[button].pressed=true;r.input();
    if(button===3)await exitPromise;
    for(let i=0;i<5;i++)r.input();
    assert.deepEqual(calls,button===0?{retry:1,exit:0}:{retry:0,exit:1},
      `${status}/b${button}: release and fresh press performs exactly one chosen action`);
    if(button===0){assert.equal(road.status,'playing');assert.equal(r.roadStarts(),2);}
    else {assert(!road.active&&r.bridge.active);assert.equal(r.roadStarts(),1);}
    assert.deepEqual(copy(r.C.archive().record.progress),facts);
  }
}

async function main() {
  const cues=await checkPagesAndFacts();
  await checkHeldControls();await checkSkipAndEscape();await checkSaves();await checkPendingAndFailure();
  await checkArchitectureCancellation();await checkCancelledResume();await checkRoadResumeMusic();
  await checkRoadResultControllerEdges();
  console.log(`Cache bridge: ${cues} production cues, physical held inputs, independent five-second skip, save/restore, audio retry, cancelled road/DEV handoffs, silent completed road, restored-bar playback and released road-result controls passed.`);
}
module.exports={bridgeRig};
if(require.main===module)main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
