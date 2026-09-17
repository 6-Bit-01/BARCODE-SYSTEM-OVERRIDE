const assert = require('assert');
const {createRig, load} = require('./check-level-01-boss');
const {createSprite, playerClips} = require('./makko-animation-fixture');
const awnings = ['signal-awning','cache-awning','firewall-canopy','tower-awning','broadcast-awning'];
function rig(type = 'player') {
  const r=createRig(), {w,p}=r;
  p.startMission();p.state='jammer_active';p.closedGateEncounterId=null;w.enemyManager.enemies=[];
  let a=w.player;
  if(type==='boss'){r.reachReady();p.beginBossCombat();a=p.boss;}
  else if(type==='drone')a=new w.RooftopDrone(2500,100,{x:2300,w:500});
  else if(type!=='player')a=new w.Enemy(2500,784,type);
  if(type==='player'){a.sprite=createSprite(playerClips);a.spriteReady=true;a.playAnimation('idle');a.allowMovement=true;}
  if(type!=='player'&&type!=='boss'){a.entranceComplete=true;a._authoredEntranceActive=false;a.updateAI=()=>{};w.enemyManager.enemies=[a];}
  w.rhythmSystem.hideRhythmMode();
  return {...r,a};
}
function place(a,x,foot){const pos=a.position||a;pos.x=x;pos.y=foot-(a.type==='drone'?57:72);if(a.velocity){a.velocity.x=0;a.velocity.y=0;}}
function overlaps(box,s){return box.x+box.width>s.x+.01&&box.x<s.x+s.w-.01&&box.y+box.height>s.y+.01&&box.y<s.bottomY-.01;}
for(const type of ['player','corrupted','firewall','virus','drone','boss']){
  const r=rig(type),{p,a}=r;
  for(const id of awnings){
    const s=p.getSolidLedges().find(s=>s.id===id);
    let sides=0;
    for(const side of [-1,1]){
      place(a,s.x+s.w/2,s.y+20);const half=p.getRoofActorBounds(a).width/2;
      place(a,side<0?s.x-half-30:s.x+s.w+half+30,s.y+20);
      // The gap between Tower/Broadcast cannot hold the wider actors. Their
      // valid approaches start outside the pair, not inside another slab.
      if(p.getSolidLedges().some(other=>other.solid&&other.id!==id&&overlaps(p.getRoofActorBounds(a),other)))continue;
      sides++;
      const motion=p.captureRoofActor(a);(a.position||a).x-=side*60;
      const hit=p.resolveAwningActor(a,motion);
      assert(hit&&hit.axis==='x',type+' '+id+': solid side');assert(!overlaps(p.getRoofActorBounds(a),s),type+' '+id+' '+JSON.stringify(p.getRoofActorBounds(a))+' '+JSON.stringify(s));
    }
    assert(sides>0,type+' '+id+': at least one unobstructed approach');
    place(a,s.x+s.w/2,s.y-10);const motion=p.captureRoofActor(a);(a.position||a).y+=20;
    p.resolveAwningActor(a,motion);assert.equal(a.supportedSurfaceId,id,type+': lands on '+id);
    assert(!overlaps(p.getRoofActorBounds(a),s),type+' '+id+' '+JSON.stringify(p.getRoofActorBounds(a))+' '+JSON.stringify(s));
  }
}
// Roof passengers transfer to the fixed canopy when it catches their feet.
for(const fps of [30,60,120])for(const type of ['player','firewall','boss']){
  const {p,a}=rig(type),lift=p.signalLift;lift.y=lift.prevY=600;lift.state='returning';
  let roof=p.getLiftRoof();place(a,roof.x+roof.w*.3,roof.topY);a.supportedSurfaceId=roof.id;
  for(let i=0;i<fps;i++)p.updateSignalLift(1000/fps);
  assert.equal(a.supportedSurfaceId,'firewall-canopy',type+': descending roof hands off to canopy');
  const s=p.getSolidLedges().find(s=>s.id==='firewall-canopy');
  assert.equal(p.getRoofActorBounds(a).y+p.getRoofActorBounds(a).height,s.y);
}
// The fixed canopy must not trap/eject a rider as the cabin rises beneath it.
for(const fps of [30,60,120])for(const x of [2460,2506]){
  const {p,a}=rig(),lift=p.signalLift;place(a,x,lift.y);a.grounded=true;a.supportedSurfaceId=lift.id;
  p.chargeSignalLift();p.chargeSignalLift();
  for(let i=0;i<fps*4.5;i++){
    a.update(1000/fps,true);p.updateSignalLift(1000/fps);
    const body=p.getRoofActorBounds(a);
    for(const s of p.getSolidLedges().filter(s=>s.solid))assert(!overlaps(body,s),`${fps}Hz cabin rider clears ${s.id}`);
  }
  assert.equal(lift.y,59);assert.equal(a.supportedSurfaceId,'firewall-roof');
  assert.equal(a.position.y+72,59,'rider reaches the true rooftop after clearing the fixed canopy');
}
// Pursuit must still work across street obstructions and toward a player who
// fits beneath an awning. Attacks keep the original warning/recovery owners.
for(const fps of [30,60,120]){
  const r=rig('boss'),{w,p}=r;
  for(const x of [500,3900,1100,3450]){
    place(w.player,x,856);w.player.grounded=true;w.player.supportedSurfaceId=null;
    p.setBossCombatPhase('approach');let frames=0;
    while(frames++<fps*90){
      r.tick(1000/fps);
      const body=p.getRoofActorBounds(p.boss);
      for(const s of p.getSolidLedges().filter(s=>s.solid))assert(!overlaps(body,s),`${fps}Hz boss cannot overlap ${s.id}`);
      if(p.boss.phase==='telegraph'&&!p.boss.traversal)break;
    }
    assert(frames<fps*90,`${fps}Hz street pursuit to ${x} reaches an attack instead of looping`);
    if(x===3900){
      // Pursuit still produces a real pulse hit at the far side of the street.
      const health=w.player.health;w.player.invulnerableUntil=0;
      for(let i=0;i<fps*5&&w.player.health===health;i++)r.tick(1000/fps);
      assert(w.player.health<health,`${fps}Hz ranged attack reaches the far street player`);
      w.player.health=w.player.maxHealth;
    }
  }
}
{
  const {w}=rig(),a=w.player,H=w.BARCODE.ComicHUD;
  w.particleSystem.healEffect=()=>{};let pickups=0;w.audioSystem.playRepairPickup=()=>pickups++;
  a.hudReaction=null;assert.equal(H.portraitFrame(a,w.rhythmSystem),0);
  a.isEntering=false;a.invulnerableUntil=0;a.takeDamage(1);assert.equal(H.portraitFrame(a,w.rhythmSystem),1);
  a.update(800,true);a.health=1;assert.equal(H.portraitFrame(a,w.rhythmSystem),4);
  assert(a.restoreHealth(1));assert.equal(pickups,1);assert.equal(H.portraitFrame(a,w.rhythmSystem),5);
  a.update(1200,true);a.health=a.maxHealth;assert(!a.restoreHealth(1));assert.equal(pickups,1,'full health is silent');
  place(a,50,856);a.grounded=true;w.rhythmSystem.showRhythmMode();w.rhythmSystem.combo=0;
  assert.equal(H.portraitFrame(a,w.rhythmSystem),3);w.rhythmSystem.combo=5;assert.equal(H.portraitFrame(a,w.rhythmSystem),2);
  w.gameState.victory=true;assert.equal(H.portraitFrame(a,w.rhythmSystem),5);
}
{
  const {w,p}=rig('boss');w.player.hudReaction={kind:'hurt',ms:750};
  p.boss.clearanceTarget={id:'firewall-canopy',goal:'street',side:1};
  p.boss.streetApproachLimit=3000;w.gameState.gameOver=true;
  assert(p.retryBossCheckpoint().ok);assert.equal(w.player.hudReaction,null);
  assert.equal(p.boss.clearanceTarget,null);assert.equal(p.boss.streetApproachLimit,null);
  const terrain=p.getRoofActorBounds(p.boss);
  assert(terrain.height>230&&terrain.height<234,'terrain probe matches the existing tallest normal boss body');
}
{
  const {w}=createRig(),t=w.BARCODE.MusicTransport,r=w.rhythmSystem,period=60/146;
  w.BARCODE.Preferences={values:{inputOffsetMs:80,visualOffsetMs:80}};
  for(const [n,offset,expected] of [[20,0,'perfect'],[21,.08,'excellent'],[22,period/2,'miss']]){
    w.audioSystem.context.currentTime=n*period+.08+offset;
    const j=t.judgeInput('level-01.attack',w.audioSystem.context.currentTime,80);
    assert.equal(j.timing,expected);r.applyResolvedAttackFeedback(j);
    const note=r.getPredictiveNotes().notes.find(note=>note.index===j.beatIndex);
    assert(note);assert.equal(note.timing,expected,'color follows the judged beat');
    if(!offset)assert(Math.abs(note.x-96)<.001,'calibrated beat crosses the actual action line');
  }
  const generation=t.getDiagnostics().generation;t.start({sourceAnchorAudioSec:w.audioSystem.context.currentTime,sourceOffsetTrackSec:0});
  assert.notEqual(t.getDiagnostics().generation,generation);assert(r.getPredictiveNotes().notes.every(n=>!n.timing));
  r.hide();assert.equal(r.beatResults.size,0,'leaving rhythm clears old feedback');
}
{
  const {w,context}=createRig();load(context,'src/engine/audio.js');const a=new w.AudioSystem();let created=0,started=0,disconnected=0;
  a.context={sampleRate:44100,currentTime:10,state:'running',
    createBuffer(channels,length,rate){created++;const data=new Float32Array(length);return{sampleRate:rate,length,getChannelData(){return data;}};},
    createBufferSource(){return{connect(){},start(){started++;},stop(){},disconnect(){disconnected++;}};},
    createGain(){return{gain:{value:1},connect(to){assert.equal(to,a.sfxGain);},disconnect(){disconnected++;}};}};
  a.sfxGain={gain:{value:.4}};assert(a.playRepairPickup());assert(a.playRepairPickup());assert.equal(created,1);assert.equal(started,2);
  const samples=a.repairBuffer.getChannelData(0),peak=samples.reduce((v,x)=>Math.max(v,Math.abs(x)),0);
  assert(samples.every(Number.isFinite));assert(peak>.1&&peak<1);assert.equal(samples.length,37044);
  assert(Math.abs(samples[0])<.0001&&Math.abs(samples.at(-1))<.0001,'chime starts and finishes without a click');
  assert.equal(a.sfxGain.gain.value,.4);a.stopCombatCues();assert.equal(a.combatVoices.size,0);assert.equal(disconnected,4);
  a.context.state='suspended';assert(!a.playRepairPickup());assert.equal(started,2);
}
console.log('Feedback polish: solid awnings for six actors; moving-roof handoffs and street boss pursuit at 30/60/120Hz; real damage/heal portraits; calibrated beat colors/reset; cached, bounded pickup chime passed.');
