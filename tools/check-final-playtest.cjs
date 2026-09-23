// Production gameplay/save/menu owners; host canvas/audio are explicit stubs.
const assert=require('assert');
const {createRig,load}=require('./check-level-01-boss');
const {campaignRig}=require('./check-boss-music-campaign.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));

async function main(){
  // The test shortcut reaches the real saved handoff, while leaving performance
  // records and difficulty challenge awards to completed playthroughs.
  {
    const {w,p,c,context,storage}=campaignRig();
    load(context,'src/game/level-01-debug.js');
    assert.equal(w.DEBUG.level1.completeLevel().reason,'debug-disabled');
    w.BARCODE.DEBUG_LEVEL_1_SESSION=true;
    const result=w.DEBUG.level1.completeLevel();assert(result.ok,JSON.stringify(result));
    assert(result.intermission && c.intermission && w.gameState.victory);
    assert.equal(p.state,'level_complete');
    assert.equal(c.result.bonus,0);
    assert.equal(c.readResume().checkpointId,'intermission');
    assert(c.archive().record.progress.completedLevels.includes('level-01'));
    assert(c.archive().record.progress.items.includes('stem.voice'));
    assert(c.archive().record.progress.unlockedLevels.includes('level-02'));
    assert.equal(c.archive().record.progress.results['level-01'],undefined);
    assert.equal(c.archive().record.progress.levelChallenges?.['level-01'],undefined);
    assert.equal(w.DEBUG.level1.completeLevel().reason,'level-01-inactive');
    const reopened=campaignRig(storage);assert.equal(reopened.c.readResume().checkpointId,'intermission');
    assert(reopened.c.restore(reopened.c.readResume()) && reopened.c.intermission);
  }
  // Death persists the policy immediately, restores the objective's earned
  // state, and cannot farm score or clear a retry by reopening the browser.
  for(const mode of ['checkpoints','full-run'])for(const stage of ['encounter_2','encounter_4','jammer','boss']){
    const r=campaignRig(),{w,p,c,storage}=r;r.reachReady();
    c.run.recoveryMode=mode;w.BARCODE.LevelDifficulty.recoveryMode=mode;
    w.gameState.score=4500;w.player.health=1;c.checkpoint(stage);
    const original=copy(c.readResume());
    w.gameState.score+=900;c.run.elapsedMs+=7000;c.run.damageTaken=3;w.player.health=0;
    w.checkGameConditions();assert(w.gameState.gameOver);assert(c.deathHandled);
    const saved=c.readResume();assert(saved);assert.equal(saved.levelState.health,3);
    assert.equal(saved.checkpointId,mode==='full-run'?'encounter_1':stage);
    assert.equal(saved.levelState.score,mode==='full-run'?0:4500);
    if(mode==='checkpoints'){
      assert.equal(saved.levelState.run.retries,1);assert(saved.levelState.run.elapsedMs>=original.levelState.run.elapsedMs+7000);
    }else{
      assert.equal(saved.levelState.run.retries,0);assert.equal(saved.levelState.run.elapsedMs,0);
      assert.notEqual(saved.levelState.run.runId,original.levelState.run.runId);
      assert(!p.canRetryBossCheckpoint(),'Full Run cannot bypass death via boss retry');
    }
    const next=campaignRig(storage);assert(next.c.restore(next.c.readResume()));
    assert.equal(next.w.player.health,3);assert.equal(next.w.BARCODE.LevelDifficulty.recoveryMode,mode);
    assert(!next.w.BARCODE.LevelDifficulty.setRecovery(mode==='full-run'?'checkpoints':'full-run'),'locked through resume');
    assert.equal(next.p.state,mode==='full-run'?'encounter_1':stage==='boss'?'boss_ready':stage==='jammer'?'jammer_active':stage);
    assert.equal(next.w.gameState.score,mode==='full-run'?0:4500);
  }
  // Actual shared lifecycle restarts one gameplay owner from the saved stage.
  {
    const r=campaignRig(),{w,c,context}=r;
    load(context,'src/core/runtime-lifecycle.js');assert((await w.BARCODE.RuntimeLifecycle.start()).ok);
    const d=w.BARCODE.LevelDifficulty;d.select(1);d.confirm();w.sector1Progression.startMission();
    w.gameState.score=2300;c.checkpoint('encounter_3');w.player.health=0;w.checkGameConditions();
    const result=await c.retryObjective();assert(result.ok,JSON.stringify(result));
    assert.equal(w.sector1Progression.state,'encounter_3');assert.equal(w.player.health,3);
    assert.equal(w.gameState.score,2300);assert.equal(c.run.retries,1);assert(d.locked);
    assert.equal(r.calls.musicStarts,1,'normal lifecycle starts exactly one source set for a retry');
  }
  for(const mode of ['checkpoints','full-run']){
    const {w,p,c}=campaignRig();p.startMission();c.run.recoveryMode=mode;w.gameState.score=0;
    c.run.damageTaken=1;const result=c.finish();assert.equal(result.bonus,mode==='full-run'?1500:1000);
    assert.equal(c.finish().bonus,result.bonus);assert.equal(w.gameState.score,result.bonus);
    assert.equal(c.archive().record.progress.results['level-01'].standard.best.recoveryMode,mode);
  }

  // A four-hit relay burst always causes a visible, fixed, finite warning;
  // evading it works at all supported frame rates and does not change music.
  for(const hz of [30,60,120])for(const difficulty of ['relaxed','standard','overclocked']){
    const {w,p}=createRig();w.BARCODE.LevelDifficulty={choice:{id:difficulty},getHostileScale:()=>1};
    const env=w.BARCODE.JammerEnvironment;p.state='jammer_active';env.reveal({position:{x:2000,y:784}});
    w.player.position.x=1860;w.player.position.y=784;const hp=w.player.health;
    const clock=w.BARCODE.MusicTransport.getDiagnostics().generation;
    for(let i=1;i<=4;i++)assert(env.applyRhythmDamage({timing:'perfect',sequence:i}).ok);
    const surge=env.getStatus().surge;assert(surge);assert.equal(env.getStatus().health,12);
    assert(!env.applyRhythmDamage({timing:'perfect',sequence:5}).ok,'active relay shield rejects extra stationary damage');
    w.isPaused=true;env.update(500);assert.equal(env.getStatus().surge.elapsed,0);w.isPaused=false;
    w.player.position.x+=400;assert.equal(env.getStatus().surge.x,surge.x,'warning never tracks an escaping player');
    for(let t=0;t<surge.warningMs+500;t+=1000/hz)env.update(1000/hz);
    assert.equal(w.player.health,hp);assert(!env.getStatus().surge);assert(env.canReceiveRhythmDamage());
    assert.equal(w.BARCODE.MusicTransport.getDiagnostics().generation,clock);
    const guards=w.enemyManager.enemies.filter(e=>e.escort?.owner==='jammer');assert.equal(guards.length,1);
    assert.equal(guards[0].health,4);assert.equal(guards[0].getPointValue(),0);
    env.reset();assert.equal(env.getStatus().surge,null);
  }
  {
    const {w}=createRig(),env=w.BARCODE.JammerEnvironment;
    env.reveal();for(let i=0;i<4;i++)env.applyRhythmDamage({timing:'perfect',sequence:i});
    let hits=0;w.player.takeDamage=()=>hits++;
    for(let t=0;t<2000;t+=20)env.update(20);
    assert.equal(hits,1,'standing in the marked discharge causes exactly one hit');
  }
  // Support is earned by boss phase/health, bounded, readable, and cleared on
  // victory. Its shots commit before firing; stomps and hijacks still work.
  {
    const r=createRig(),{w,p}=r;r.reachReady();p.beginBossCombat();p.boss.health=6;p.boss.phase='approach';
    p.updateBossSupport(16);const drone=w.enemyManager.enemies.find(e=>e._bossSupport);assert(drone);
    assert.equal(drone.getHitbox().width,80);assert.equal(drone.health,4);assert.equal(drone.getPointValue(),0);
    const hp=drone.health;drone.takeDamage(3);assert(drone.active&&drone.health===hp-3,'support survives one perfect beat');
    p.boss.phase='recovery';p.getStageSurfaces=()=>[];w.player.position.x=3000;w.player.position.y=300;
    drone.position.x=2630;drone.position.y=145;drone.dronePhase='patrol';drone.dronePhaseMs=1600;drone.escort.side=-1;
    drone.updateFlight(16,w.player,10000);assert.equal(drone.dronePhase,'warning');const aim=copy(drone.aim);
    w.player.position.x+=150;drone.updateFlight(400,w.player,10400);assert.deepEqual(copy(drone.aim),aim);
    assert(!drone.pulse,'a warning precedes the projectile');drone.updateFlight(800,w.player,11200);
    assert(['fire','recovery'].includes(drone.dronePhase));
    p.boss.phase='approach';for(let i=0;i<100;i++)p.updateBossSupport(15000);
    assert(w.enemyManager.enemies.filter(e=>e.active&&e._bossSupport).length<=2);
    drone.spawnTimeMs=-10000;drone.simulationTimeMs=20000;
    assert(w.enemyManager.hijackEnemy(drone),'support keeps the normal hack counter');
    assert(w.enemyManager.isHijacked(drone));w.enemyManager.releaseHijack(drone);
    const box=drone.getStompBox();w.enemyManager.enemies=[drone];w.player.controlsDisabled=false;
    w.player.position.x=drone.position.x;w.player.velocity.y=100;
    w.player.contactSweep={previousFootY:box.y-20,currentFootY:box.y+20,previousX:drone.position.x,currentX:drone.position.x};
    w.particleSystem.explosion=()=>{};w.particleSystem.stompEffect=()=>{};
    w.enemyManager.checkCollisions(w.player);assert(!drone.active,'support remains vulnerable to a committed head landing');
    p.boss.supportWaitMs=0;p.boss.supportWaves=0;p.updateBossSupport(16);
    p.completeLevel();assert(w.enemyManager.enemies.filter(e=>e._bossSupport).every(e=>!e.active&&!e.pulse));
  }
  // Learned dialogue homes only win after proven dwell and sustained current
  // clearance. Existing motion is retained, including restart and crowd rules.
  {
    const {w}=createRig();w.rhythmSystem.hideRhythmMode();w.gameCamera={centerX:960,y:0};
    const ui=w.BARCODE.OverlayLayout,owner={},v=[{width:600,height:180}];
    const step=(time,actors=[])=>{w.gameState.gameTime=time;return ui.present(owner,'dialogue',v,{actors,remember:true});};
    let home;for(let t=0;t<=6500;t+=50)home=step(t);
    const foe={position:{x:home.x,y:home.y},getHitbox:()=>({x:home.x,y:home.y,width:600,height:180})};
    let displaced;for(let t=6550;t<=8000;t+=50)displaced=step(t,[foe]);
    assert(Math.hypot(home.x-displaced.x,home.y-displaced.y)>40);
    for(let t=8050;t<=8500;t+=50){const box=step(t);assert(Math.hypot(box.x-home.x,box.y-home.y)>40,'brief vacancy cannot trigger a return');}
    let settled;for(let t=8550;t<=11500;t+=50)settled=step(t);
    assert.equal(settled.x,home.x);assert.equal(settled.y,home.y);assert(settled.readable);
    assert(owner._overlayPanels.dialogue.homes.length<=6);
  }
  // Settings work before a gameplay lifecycle exists. Fullscreen failure is
  // recoverable; closing title settings does not start/resume gameplay/audio.
  {
    const {w,context,calls}=createRig();let appended=0,focused=0;
    const ctx=new Proxy({}, {get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
    const canvas={style:{},setAttribute(){},focus(){},getContext:()=>ctx};
    const settingsButton={focus(){focused++;}};
    w.document.getElementById=id=>id==='settingsButton'?settingsButton:id==='startOverlay'?{classList:{contains:()=>false}}:null;
    w.document.createElement=()=>canvas;w.document.body={appendChild(){appended++;}};
    for(const f of ['src/core/gamepad-ui.js','src/game/pause-menu.js'])load(context,f);
    const m=w.BARCODE.PauseMenu;assert(m.openTitle());assert(m.titleOpen&&m.open);assert.equal(appended,1);
    m.keyDown({key:'Escape',preventDefault(){}});assert(!m.titleOpen&&!m.open);assert.equal(focused,1);
    assert(m.openTitle());assert.equal(appended,1,'reuse a single settings surface');
    w.fullscreenManager={isSupported:true,isActive:false,toggle(){throw new Error('denied');}};
    await m.toggleFullscreen();assert(m.message.includes('blocked'));assert(!m.fullscreenPending&&m.titleOpen);
    w.fullscreenManager.toggle=async()=>{w.fullscreenManager.isActive=true;};await m.toggleFullscreen();assert.equal(m.message,'');
    await m.resume();assert(!m.open);assert.equal(calls.musicStarts,0);assert.equal(calls.loopStarts,0);
    assert.equal(w.BARCODE.Preferences.values.reducedMotion,false);
  }
  console.log('Final playtest pass: solid hacking (smart-box suite), 8 death/resume routes, real lifecycle retry, recovery scoring, 9 relay timings, committed bounded drones, learned panel homes and title/fullscreen ownership passed.');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
