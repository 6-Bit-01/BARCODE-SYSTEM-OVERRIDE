#!/usr/bin/env node
// Opportunity/skill probes; --integration checks the actual lifecycle economy,
// and --balance compares real driving controls with and without face sync.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),w={BARCODE:{}};
for(const file of ['src/game/cache-road-adrenaline.js','src/game/cache-road-combat.js'])
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),{window:w});
const A=w.BARCODE.CacheRoadAdrenaline,C=w.BARCODE.CacheRoadCombat;
const copy=value=>JSON.parse(JSON.stringify(value));
const s=A.create();assert.equal(s.value,25);assert.equal(A.pose(s).tier,'cold');
const first=A.resolve(s,{id:'pad-0',result:'good',atMs:500});
assert(first.accepted&&first.tierChanged&&first.tier==='charged');
assert.equal(s.value,40);
const accepted=copy(s);
for(const result of ['good','perfect','miss'])assert.equal(A.resolve(s,{id:'pad-0',result,atMs:900}).accepted,false);
assert.deepEqual(copy(s),accepted,'duplicate hits and expired copies cannot farm or lose charge');
for(const result of ['early','late','button','lane','held'])
  assert.equal(A.resolve(s,{id:'rejected-'+result,result}).accepted,false,'only true resolved judgments affect adrenaline');
assert.deepEqual(copy(s),accepted);
A.resolve(s,{id:'pad-1',result:'perfect',atMs:2000});
A.resolve(s,{id:'pad-2',result:'good',atMs:4000});assert.equal(A.pose(s).tier,'rush');
assert.equal(s.value,75);assert.equal(s.chain,3);
const steady=JSON.stringify(s);
for(let frame=0;frame<1000;frame++)A.pose(s);
assert.equal(JSON.stringify(s),steady,'draw/observation has no time decay, receipt, tier or clock mutation');
const miss1=A.resolve(s,{id:'pad-3',result:'miss'});assert.equal(miss1.delta,0);
assert.equal(s.chain,0);assert.equal(s.missStreak,1);
assert.equal(A.resolve(s,{id:'pad-4',result:'miss'}).delta,-12);
assert.equal(A.resolve(s,{id:'pad-5',result:'miss'}).delta,-18);
assert.equal(A.resolve(s,{id:'pad-6',result:'miss'}).delta,-24);
assert.equal(A.resolve(s,{id:'pad-7',result:'perfect'}).delta,20);
assert.equal(s.missStreak,0,'a genuinely met opportunity ends the miss run immediately');
assert.equal(A.spend(s,'turbo').delta,-10);
assert.equal(A.spend(s,'disrupt').delta,-14);
assert.equal(A.wreck(s).delta,-12);
assert.equal(s.value,5);
assert.equal(A.spend(s,'disrupt').delta,-5);
assert.equal(A.spend(s,'turbo').accepted,true,'zero adrenaline never locks a combat control');
assert.equal(s.value,0);
const saved=A.snapshot(s),restored=A.restore(saved);assert(restored);
assert.equal(restored.value,s.value);assert.deepEqual(copy(restored.receipts),copy(s.receipts));
assert.equal(A.resolve(restored,{id:'pad-7',result:'perfect'}).accepted,false,'checkpoint replay retains duplicate protection');
assert.equal(restored.lastDelta,0);assert.equal(restored.lastAtMs,0);
for(const mutate of [raw=>raw.value=101,raw=>raw.value=-1,raw=>raw.receipts.push(raw.receipts[0]),
  raw=>raw.stats.perfect++,raw=>raw.chain=100,raw=>raw.lastAtMs=Infinity,raw=>raw.version=2]) {
  const invalid=copy(saved);mutate(invalid);assert.equal(A.restore(invalid),null,'malformed new metadata is rejected');
}
const hot=A.create();for(let pad=0;pad<8;pad++)A.resolve(hot,{id:'heat-'+pad,result:'perfect'});
assert.equal(hot.value,100,'repeated genuine successes clamp at full charge');
const b0=C.syncBenefits(4,0),b100=C.syncBenefits(4,100);
assert.equal(b0.power,2);assert.equal(b0.recharge,.6);assert.equal(b0.ammoMs,1500);
assert.equal(b100.power,2.6);assert(Math.abs(b100.recharge-.45)<1e-9);assert.equal(b100.ammoMs,1050);
assert(b100.footprint<b0.footprint&&b100.guardMs>b0.guardMs&&b100.trackingMs>b0.trackingMs);

function physical(charge) {
  const state=C.create(),input={bar:10,progress:1000,lanePos:1,speed:52,syncCount:0,adrenaline:charge};
  const enemy={id:'foe-0',kind:'rammer',hp:3,maxHp:3,at:1040,lane:1,ageMs:0,
    phase:'recover',phaseMs:0,rearmMs:1000,attackLane:1,attackKind:'ram',attackDone:true};
  state.enemies.push(enemy);state.ledger.push({id:enemy.id,kind:enemy.kind,hp:3,maxHp:3,
    damage:0,spawnBar:4,retired:false});state.nextSpawnMs=1e8;
  const attack=C.act(state,'attack',input);assert(attack.accepted);
  const damage=state.stats.damageDealt,attackCooldown=state.cooldowns.attack;
  const guard=C.act(state,'defend',input);assert(guard.accepted);
  const guardMs=state.defendMs,guardCooldown=state.cooldowns.defend;
  state.enemies=[];state.ledger=[];state.ammo=0;
  for(let frame=0;frame<32;frame++)C.step(state,100,input);
  return {damage,attackCooldown,guardMs,guardCooldown,ammo:state.ammo};
}
const cold=physical(0),rush=physical(100);
assert(rush.damage>cold.damage,'charge changes actual attributed enemy damage');
assert(rush.attackCooldown<cold.attackCooldown&&rush.guardCooldown<cold.guardCooldown,'charge advances practical skill availability');
assert(rush.guardMs>cold.guardMs,'charge creates a longer usable Defend window');
assert.equal(cold.ammo,0);assert.equal(rush.ammo,1,'charge actually reloads a spent round sooner');
console.log(JSON.stringify({gate:'adrenaline-opportunity-economy',passed:true,
  settings:copy(A.settings),distinctReceipts:s.receipts.length,legacyNeutral:b0,cold,rush}));

async function integration() {
  const {combatRig,runCombatRace}=require('./check-cache-combat-integration.cjs');
  const flush=async()=>{for(let i=0;i<24;i++)await Promise.resolve();};
  const quiet=await combatRig(),initial=copy(quiet.road.state.adrenaline);
  assert(initial&&initial.value===25);
  quiet.step(5000,50);
  assert.deepEqual(copy(quiet.road.state.adrenaline),initial,
    'the actual four-bar music intro has no idle drain or invented missed opportunity');
  for(const index of [0,1,2,3]) {
    quiet.pad.buttons[index].pressed=true;quiet.step(20,50);
    quiet.pad.buttons[index].pressed=false;quiet.step(20,50);
  }
  assert.deepEqual(copy(quiet.road.state.adrenaline),initial,
    'real out-of-opportunity face presses cannot refill or drain the meter');
  quiet.tap('p');quiet.input();await flush();assert(quiet.w.isPaused);
  quiet.step(2000,50);
  assert.deepEqual(copy(quiet.road.state.adrenaline),initial,'real lifecycle Pause freezes the entire opportunity economy');
  quiet.tap('p');quiet.input();await flush();assert(!quiet.w.isPaused);
  // Resume release-arms the gameplay owner; give it the same released poll
  // as a player before expecting a later fresh controller edge to act.
  quiet.input();quiet.step(20,50);
  quiet.pad.buttons[4].pressed=true;quiet.step(20,50);
  assert.equal(quiet.road.state.adrenaline.value,15,'the actual L1 Turbo edge spends charge after acceptance');
  assert.equal(quiet.road.state.adrenaline.stats.turbos,1);
  quiet.step(200,50);
  assert.equal(quiet.road.state.adrenaline.stats.turbos,1,'a held Turbo edge cannot spend repeatedly');
  quiet.pad.buttons[4].pressed=false;quiet.step(20,50);
  quiet.pad.buttons[4].pressed=true;quiet.step(20,50);
  assert.equal(quiet.road.state.adrenaline.value,15,'a rejected recharging Turbo edge spends nothing');
  quiet.pad.buttons[4].pressed=false;quiet.step(20,50);
  await quiet.B.RuntimeLifecycle.stop('adrenaline-empty-intro-control-check');

  let checkpointChecks=0,lastCheckedBar=-1;
  const played=await runCombatRace({difficulty:'standard',gear:1,maxBar:28,earlyHits:1,
    onFrame(r) {
      const state=r.road.state;
      assert.equal(state.lockEnergy,state.adrenaline.value,'compatible saved meter mirrors actual earned charge');
      assert.equal(state.adrenaline.stats.wrecks,r.road.chapter.damageTaken,
        'only an actual integrity loss records an adrenaline wreck');
      if(state.musicBar>0&&state.musicBar!==lastCheckedBar) {
        const checkpoint=r.road.makeCheckpoint('road-verse-2');
        if(!r.road.validate(checkpoint)) {
          const legacy=copy(checkpoint);delete legacy.levelState.proof.adrenaline;
          const proof=checkpoint.levelState.proof;
          assert.fail('Actual bar checkpoint rejected: '+JSON.stringify({
            musicBar:state.musicBar,beat:state.musicBeatFloat,withoutAdrenalineValid:r.road.validate(legacy),
            receiptCount:proof.adrenaline.receipts.length,
            unrecognizedOrFuture:proof.adrenaline.receipts.filter(receipt=>!proof.encounters.pulses.some(pulse=>
              pulse.id===receipt.id&&pulse.target<=proof.musicBar*4+.001)),
            combatRestores:!!r.B.CacheRoadCombat.restore(proof.combat,{bar:proof.musicBar,progress:proof.progress}),
            adrenalineRestores:!!r.B.CacheRoadAdrenaline.restore(proof.adrenaline),
            driveSection:proof.driveSection}));
        }
        checkpointChecks++;lastCheckedBar=state.musicBar;
      }
    }});
  assert(played.result.damageTaken>=1,'the real-input recovery probe reaches an unprotected physical contact');
  assert(played.result.accurate>0,'the recovery probe subsequently earns actual timed pads');
  let r=played.r;
  const saved=copy(r.road.makeCheckpoint('road-verse-2'));
  assert(r.road.validate(saved),'the owner accepts its actual played adrenaline checkpoint');
  const earned=copy(saved.levelState.proof.adrenaline);
  assert(earned.receipts.length>0&&earned.stats.wrecks>0);
  const unknown=copy(saved);unknown.levelState.proof.adrenaline.receipts[0].id='unknown/forged-opportunity';
  assert(A.restore(unknown.levelState.proof.adrenaline),'the unknown-ID negative retains structurally valid economy data');
  assert.equal(r.road.validate(unknown),false,'a forged unknown pad cannot grant earned checkpoint charge');
  const future=copy(saved),futurePulse=future.levelState.proof.encounters.pulses.find(pulse=>
    pulse.target>future.levelState.proof.musicBar*4+.001);
  assert(futurePulse,'the save includes its real announced next-ONE opportunity');
  future.levelState.proof.adrenaline.receipts.push({id:futurePulse.id,result:'perfect'});
  future.levelState.proof.adrenaline.stats.perfect++;
  assert(A.restore(future.levelState.proof.adrenaline),'the future-ID negative retains structurally valid economy data');
  assert.equal(r.road.validate(future),false,'an announced future pad cannot be claimed as earned checkpoint charge');
  const old=copy(saved);delete old.levelState.proof.adrenaline;old.levelState.proof.lockEnergy=0;
  assert(r.road.validate(old),'older version-four checkpoints without adrenaline remain valid');
  assert(r.C.archive().checkpoint(saved));const storage=r.storage;
  await r.B.RuntimeLifecycle.stop('adrenaline-earned-checkpoint-reload');
  r=await combatRig('standard',storage,saved);
  assert.equal(r.road.state.adrenaline.value,earned.value);
  assert.deepEqual(copy(r.road.state.adrenaline.receipts),earned.receipts,
    'the actual lifecycle reload preserves distinct accepted/missed receipts');
  const unchanged=copy(r.road.state.adrenaline);
  assert.equal(r.B.CacheRoadAdrenaline.resolve(r.road.state.adrenaline,
    {id:earned.receipts[0].id,result:'perfect'}).accepted,false);
  assert.deepEqual(copy(r.road.state.adrenaline),unchanged,'a restored old pad cannot farm charge');
  await r.B.RuntimeLifecycle.stop('adrenaline-old-v4-migration');
  r=await combatRig('standard',storage,old);
  assert.equal(r.road.state.adrenaline.value,25,'older-v4 saves migrate to starter charge without losing their combat facts');
  assert.deepEqual(copy(r.road.state.combat.ledger),old.levelState.proof.combat.ledger);
  await r.B.RuntimeLifecycle.stop('adrenaline-integration-complete');
  const receipt={gate:'adrenaline-production-economy',passed:true,checkpointChecks,
    actualWrecks:earned.stats.wrecks,acceptedPads:played.result.accurate,
    pause:true,authoredIntroGap:true,rejectedFacePresses:true,heldAndRejectedTurbo:true,
    earnedReload:true,legacyV4Migration:true,unknownAndFutureReceiptsRejected:true};
  console.log(JSON.stringify(receipt));return receipt;
}

async function balance() {
  const {runCombatRace}=require('./check-cache-combat-integration.cjs');
  const samples=[];
  for(const noSync of [false,true]) {
    let maximum=0,rushMs=0,chargedMs=0,lastValue=null,changes=0;
    const run=await runCombatRace({difficulty:'standard',gear:1,maxBar:28,noSync,
      onFrame(r) {
        const state=r.road.state.adrenaline;assert(state,'the production integration must create current-v4 adrenaline');
        const pose=r.B.CacheRoadAdrenaline.pose(state);maximum=Math.max(maximum,pose.value);
        if(pose.tier==='rush')rushMs+=20;if(pose.tier==='charged')chargedMs+=20;
        if(lastValue!==null&&lastValue!==pose.value)changes++;lastValue=pose.value;
      }});
    const result=run.result,pose=run.r.B.CacheRoadAdrenaline.pose(run.r.road.state.adrenaline);
    const sample={noSync,frames:result.frames,bar:result.finalBar,status:result.status,
      acceptedPads:result.accurate,damageTaken:result.damageTaken,damageDealt:result.combat.stats.damageDealt,
      takedowns:result.combat.stats.takedowns,acceptedSkills:Object.fromEntries(['attack','defend','turbo','disrupt'].map(skill=>
        [skill,result.events.filter(event=>event.kind==='combat-input'&&event.skill===skill&&event.accepted).length])),
      adrenaline:{maximum,rushMs,chargedMs,changes,final:pose.value,stats:copy(run.r.road.state.adrenaline.stats)},
      drums:result.drumMinimum};
    assert.equal(sample.drums,.60,'meter and skills preserve the drum backbone');
    samples.push(sample);console.log(JSON.stringify({gate:'adrenaline-production-controls',sample}));
  }
  assert(samples[0].acceptedPads>0&&samples[0].adrenaline.maximum>=70,'correct timed controls genuinely reach Rush');
  assert.equal(samples[1].acceptedPads,0);assert.equal(samples[1].adrenaline.maximum,25);
  assert.equal(samples[1].adrenaline.final,0,'ignoring multiple real opportunities exhausts charge');
  assert(samples[1].acceptedSkills.attack>0&&samples[1].acceptedSkills.turbo>0,
    'cold players retain usable skill controls');
  const evidence={passed:true,modelSettings:copy(A.settings),samples,
    method:'Production ActionInput, shared RAF, real chart/mix and delayed visible observations; same Standard/second-gear driver, with face sync withheld only in the comparison.',
    limits:'28-bar controlled comparison; not human success rates, device pacing, listening or owner balance acceptance.'};
  const output=process.argv.find(arg=>arg.startsWith('--output='));
  if(output)fs.writeFileSync(path.resolve(output.slice('--output='.length)),JSON.stringify(evidence,null,2)+'\n');
  return evidence;
}
if(require.main===module)(async()=>{
  if(process.argv.includes('--integration')) {
    const receipt=await integration();
    const output=process.argv.find(arg=>arg.startsWith('--output='));
    if(output&&!process.argv.includes('--balance'))
      fs.writeFileSync(path.resolve(output.slice('--output='.length)),JSON.stringify(receipt,null,2)+'\n');
  }
  if(process.argv.includes('--balance'))await balance();
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
