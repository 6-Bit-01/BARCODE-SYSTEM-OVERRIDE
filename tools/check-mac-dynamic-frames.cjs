// Focused supplemental whole-character sampler and actual native registration.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),vm=require('node:vm'),zlib=require('node:zlib');
const source=path.resolve(__dirname,'..'),modulePath=path.join(source,'src/game/mac-combat-frames.js');
const options={},args=process.argv.slice(2);
while(args.length){const arg=args.shift(),match=/^--(registration|base|equipment|out)(?:=(.*))?$/.exec(arg);
  assert(match,'Unknown option '+arg);options[match[1]]=match[2]||args.shift();assert(options[match[1]],'Missing option value');}
const context={window:{BARCODE:{}}};vm.createContext(context);vm.runInContext(fs.readFileSync(modulePath,'utf8'),context,{filename:modulePath});
const F=context.window.BARCODE.MacCombatFrames,plain=value=>JSON.parse(JSON.stringify(value));
const sha=value=>crypto.createHash('sha256').update(value).digest('hex'),checks=[],native=[];
const basePath=options.base?path.resolve(source,options.base):path.join(source,'assets/mac-combat-frames/mac-frames-v1.json');
const baseRegistration=JSON.parse(fs.readFileSync(basePath,'utf8')),base=F.compile(baseRegistration,{complete:true});
function check(name,run){run();checks.push(name);}
function fixture(){
  const ids=['guard_stand','guard_a','guard_b','run_a','run_b','run_c','run_d','grab_reach','grab_hold',
    'pummel_load','pummel_contact','carry_hold','carry_a','carry_b','melee_load','melee_contact','melee_recover','fire_aim','fire_recoil'];
  const clip=(frames,loop=false,holdMs=100)=>({loop,frames:frames.map(frame=>({frame,holdMs}))});
  const r={schemaVersion:1,actor:'mac',facing:'right',pixelScale:{standingVisibleHeight:70,referenceFrame:'guard_stand'},
    sheets:[{id:'dyn_test',sourceImage:'assets/mac-street-dynamic/fixture.png',sourceSHA256:'a'.repeat(64),
      dimensions:{width:1200,height:100},pixelScale:{standingVisibleHeight:70,referenceFrame:'guard_stand'}}],
    frames:ids.map((id,index)=>({id,sheet:'dyn_test',source:{x:index*60,y:0,width:60,height:80},
      feetPivot:{x:30,y:75},baselineLift:0,gripAnchor:{x:40,y:35},weaponAngle:id==='fire_recoil'?-.12:0})),
    clips:{guard:clip(['guard_stand'],true),'guard-walk':clip(['guard_a','guard_b'],true),run:clip(['run_a','run_b','run_c','run_d'],true),
      'grab-start':clip(['grab_reach','grab_hold']),'grab-hold':clip(['grab_hold'],true),
      'pummel.windup':clip(['pummel_load']),'pummel.active':clip(['pummel_contact']),'pummel.recovery':clip(['grab_hold']),
      carry:clip(['carry_hold'],true),'carry-walk':clip(['carry_a','carry_b'],true),
      'melee.windup':clip(['melee_load']),'melee.active':clip(['melee_contact']),'melee.recovery':clip(['melee_recover']),
      'fire.windup':clip(['fire_aim']),'fire.active':clip(['fire_recoil']),'fire.recovery':clip(['fire_aim'])},
    baseGripAnchors:{chamber:{gripAnchor:{x:100,y:120},weaponAngle:.2},throw_grab:{gripAnchor:{x:210,y:120},weaponAngle:0}}};
  for(const action of ['walk','run']){
    const ids=['contact_a','pass_a','contact_b','pass_b'].map(id=>'armed_'+action+'_'+id),sheet='dyn_armed_'+action;
    r.sheets.push({id:sheet,sourceImage:'assets/mac-street-dynamic/'+sheet+'-fixture.png',sourceSHA256:(action==='walk'?'b':'c').repeat(64),
      dimensions:{width:240,height:100},pixelScale:{standingVisibleHeight:70,referenceFrame:ids[0]}});
    for(const [index,id]of ids.entries())r.frames.push({id,sheet,source:{x:index*60,y:0,width:60,height:80},feetPivot:{x:30,y:75},baselineLift:0,
      gripAnchor:{x:40,y:35},weaponAngle:1.5,itemBindings:Object.fromEntries(['pipe','crowbar','shock-baton','energy-blade','gravity-hammer'].map((kind,i)=>[kind,{
        gripAnchor:{x:40+i*.1,y:35+index*.1},weaponAngle:1.5+i*.02,itemLayer:'behind',itemScale:1,
        handOcclusion:[[{x:35,y:30},{x:49,y:30},{x:49,y:42},{x:35,y:42}]]}]))});
    r.clips['armed-'+action]=clip(ids,true,action==='walk'?100:75);
  }
  return r;
}
const registration=fixture(),supplemental=F.compileSupplemental(registration,{baseCompiled:base});
function embeddedFixture(){
  const r=fixture();
  for(const [index,kind]of F.embeddedWeapons.entries()) {
    const stem=kind.replaceAll('-','_'),sheet='dyn_'+stem,last=kind==='plasma-disc'?'followthrough':'hurt';
    const ids=['ready','aim','recoil','walk_a','walk_b','run_a','run_b','guard',last];
    r.sheets.push({id:sheet,sourceImage:'assets/mac-street-dynamic/'+stem+'-fixture.png',
      sourceSHA256:String(index+1).repeat(64),dimensions:{width:300,height:300},
      pixelScale:{standingVisibleHeight:70,referenceFrame:stem+'_ready'}});
    for(const [i,id]of ids.entries())r.frames.push({id:stem+'_'+id,sheet,
      source:{x:(i%3)*100,y:Math.floor(i/3)*100,width:90,height:90},feetPivot:{x:40,y:85},
      baselineLift:0,embeddedWeapon:kind,...(id==='recoil'?{shotAnchor:{x:80,y:30}}:{})});
    const key=action=>'weapon_'+kind+'.'+action;
    const clip=(ids,loop)=>({loop,frames:ids.map(id=>({frame:stem+'_'+id,holdMs:100}))});
    r.clips[key('idle')]=clip(['ready'],true);r.clips[key('walk')]=clip(['walk_a','walk_b'],true);
    r.clips[key('run')]=clip(['run_a','run_b'],true);r.clips[key('guard')]=clip(['guard'],true);
    r.clips[key('hurt')]=clip([kind==='plasma-disc'?'ready':'hurt'],false);
    r.clips[key('windup')]=clip(['aim'],false);r.clips[key('active')]=clip(['recoil'],false);
    r.clips[key('recovery')]=clip([kind==='plasma-disc'?'followthrough':'ready'],false);
  }
  return r;
}
const discRetainedAliases={load:'disc_jump_load',takeoff:'disc_jump_rise',chamber:'disc_kick_chamber',
  kick_extend:'disc_kick_contact',kick_contact:'disc_kick_contact',kick_retract:'disc_kick_retract',descent:'disc_jump_descent',
  landing:'disc_landing',counter_contact:'disc_counter_contact',guard_brace:'disc_guard_brace',guard_step_a:'disc_guard_step_a',
  guard_step_b:'disc_guard_step_b',guard_impact:'disc_guard_impact',hook_recovery:'plasma_disc_ready',idle_b:'plasma_disc_ready'};
function discRetainedFixture(){
  const r=embeddedFixture(),rename={guard_stand:'guard_brace',guard_a:'guard_step_a',guard_b:'guard_step_b'};
  for(const frame of r.frames)if(rename[frame.id])frame.id=rename[frame.id];
  for(const clip of Object.values(r.clips))for(const entry of clip.frames)if(rename[entry.frame])entry.frame=rename[entry.frame];
  r.pixelScale.referenceFrame=r.sheets[0].pixelScale.referenceFrame='guard_brace';
  r.frames.push({id:'guard_impact',sheet:'dyn_test',source:{x:1140,y:0,width:60,height:80},feetPivot:{x:30,y:75},baselineLift:0,gripAnchor:{x:40,y:35}});
  r.clips['guard-impact']={loop:false,frames:[{frame:'guard_impact',holdMs:120}]};
  const ids=[...new Set(Object.values(discRetainedAliases))].filter(id=>id!=='plasma_disc_ready');
  r.sheets.push({id:'dyn_disc_retained',sourceImage:'assets/mac-street-dynamic/disc-retained-fixture.png',sourceSHA256:'d'.repeat(64),
    dimensions:{width:240,height:300},pixelScale:{standingVisibleHeight:70,referenceFrame:ids[0]}});
  for(const [index,id]of ids.entries())r.frames.push({id,sheet:'dyn_disc_retained',source:{x:index%4*60,y:Math.floor(index/4)*100,width:60,height:80},
    feetPivot:{x:30,y:75},baselineLift:0,embeddedWeapon:'plasma-disc'});
  for(const [baseId,id]of Object.entries(discRetainedAliases))r.clips['disc-carry.'+baseId]={loop:false,frames:[{frame:id,holdMs:100}]};
  return r;
}
const actor=(action,extra={})=>({hp:100,facing:1,animation:{action,ageMs:0,motion:{speed:0,stridePhase:0}},...extra});
const pose=(value,extra={})=>F.sample(value,{player:true,compiled:base,supplemental,...extra});
check('supplemental compile preserves the original accepted Mac registration and clips',()=>{
  assert.equal(base.complete,true);assert.equal(supplemental.supplemental,true);
  assert.equal(Object.keys(supplemental.frames).length,27);assert.equal(base.clips.throw.totalMs,420);
  assert.equal(base.frames.idle_a.sourceImage,'assets/mac-combat-frames/mac-basic-v2.png');
  assert.equal(base.frames.chamber.gripAnchor,undefined);assert.equal(base.sheets.dyn_test,undefined);
});
check('actual movement stride selects four distinct whole run cels and two guarded creep contacts',()=>{
  assert.deepEqual([0,.26,.51,.76].map(stridePhase=>pose(actor('run',{animation:{action:'run',motion:{speed:180,stridePhase}}})).frameId),
    ['run_a','run_b','run_c','run_d']);
  assert.deepEqual([.1,.6].map(stridePhase=>pose(actor('guard-creep',{animation:{action:'guard-creep',motion:{speed:40,stridePhase}}})).frameId),['guard_a','guard_b']);
  assert.equal(pose(actor('guard')).frameId,'guard_stand');
});
check('all five melee inventories use four ordered armed walking and running cels from their real stride clock in both facings',()=>{
  for(const kind of F.weapons.filter(kind=>!F.embeddedWeapons.includes(kind)))for(const action of ['walk','run'])for(const facing of [-1,1]){
    for(const [index,stridePhase]of [0,.26,.51,.76].entries()){
      const value=actor(action,{facing,weapon:{kind,charges:7},animation:{action,ageMs:9000,motion:{speed:action==='walk'?260:429,stridePhase}}}),before=plain(value);
      const result=pose(value),id='armed_'+action+'_'+['contact_a','pass_a','contact_b','pass_b'][index],native=supplemental.frames[id].itemBindings[kind];
      assert.equal(result.frameId,id);assert.equal(result.clipKey,'armed-'+action);assert.equal(result.frame.sheet,'dyn_armed_'+action);
      assert.equal(result.frame.embeddedWeapon,undefined);assert.equal(result.weaponKind,kind);assert.equal(result.weaponStowed,false);assert.equal(result.facing,facing);
      assert(Math.abs(result.clipTimeMs-stridePhase*supplemental.clips['armed-'+action].totalMs)<1e-10);
      assert.deepEqual(plain(result.gripAnchor),plain(native.gripAnchor));assert.equal(result.weaponAngle,native.weaponAngle);assert.equal(result.itemLayer,'behind');
      assert(Object.isFrozen(result.handOcclusion[0][0]));assert.deepEqual(plain(value),before,'Sampling never changes inventory, travel cadence, facing or HP');
    }
    for(const stridePhase of [1,2,-1])assert.equal(pose(actor(action,{weapon:{kind},animation:{action,motion:{speed:260,stridePhase}}})).frameId,'armed_'+action+'_contact_a');
  }
});
check('armed gait preserves accepted unarmed motion and whole gun disc locomotion and never takes over guard attacks landing or occupied hands',()=>{
  const bank=F.compileSupplemental(embeddedFixture(),{baseCompiled:base});
  for(const facing of [-1,1])for(const action of ['walk','run']){
    const unarmed=pose(actor(action,{facing,animation:{action,motion:{speed:260,stridePhase:.6}}}),{supplemental:bank});
    assert.equal(unarmed.clipKey,action);assert.equal(unarmed.supplemental,action==='run');
    for(const kind of F.embeddedWeapons){const result=pose(actor(action,{facing,weapon:{kind},animation:{action,motion:{speed:260,stridePhase:.6}}}),{supplemental:bank});
      assert.equal(result.clipKey,'weapon_'+kind+'.'+action);assert.equal(result.frame.embeddedWeapon,kind);}
  }
  for(const kind of F.weapons.filter(kind=>!F.embeddedWeapons.includes(kind))){
    const weapon={kind,charges:7};
    for(const [value,extra,key]of [
      [actor('guard',{weapon,guarding:true}),{},'guard'],
      [actor('guard-creep',{weapon,guarding:true}),{},'guard-walk'],
      [actor('walk',{weapon}),{landingAgeMs:35},'landing'],
      [actor('jump',{weapon,elevation:90,velocityZ:300}),{},'jump-rise'],
      [actor('carry',{weapon,carry:{kind:'crate',elapsedMs:500}}),{},'carry'],
      [actor('grab-hold',{weapon,grapple:{elapsedMs:500}}),{},'grab-hold'],
      [actor('running-kick',{weapon,attack:{kind:'running-kick',phase:'active',phaseProgress:.5}}),{},'air-kick.active'],
      [actor('strike',{weapon,attack:{kind:'counter',phase:'active',phaseProgress:.5}}),{},'counter.active'],
      [actor('weapon-heavy',{weapon,attack:{kind,weaponKind:kind,phase:'active',phaseProgress:.5}}),{},'melee.active'],
      [actor('walk',{weapon,hurtMs:30}),{},'hurt'],[actor('run',{weapon,hp:0}),{},'defeat']]){
      const before=plain(value),result=pose(value,{supplemental:bank,...extra});assert.equal(result.clipKey,key);assert.deepEqual(plain(value),before);
    }
  }
});
check('armed locomotion rejects missing unordered repeated wrong-sheet or embedded cels and incomplete per-weapon palm registration',()=>{
  const bad=edit=>{const r=fixture();edit(r);assert.throws(()=>F.compileSupplemental(r,{baseCompiled:base}),/Whole-character frames/);};
  const cel=r=>r.frames.find(f=>f.id==='armed_walk_contact_a');
  bad(r=>delete r.clips['armed-walk']);bad(r=>delete r.clips['armed-run']);bad(r=>r.clips['armed-run'].loop=false);
  bad(r=>r.clips['armed-walk'].frames.pop());bad(r=>r.clips['armed-run'].frames.push({...r.clips['armed-run'].frames[0]}));
  bad(r=>r.clips['armed-walk'].frames.reverse());bad(r=>r.clips['armed-walk'].frames[1].frame='armed_walk_contact_a');
  bad(r=>r.clips['armed-walk'].frames[0].holdMs=101);bad(r=>r.clips['armed-run'].frames[0].holdMs=74);
  bad(r=>cel(r).sheet='dyn_armed_run');bad(r=>cel(r).embeddedWeapon='pipe');bad(r=>delete cel(r).gripAnchor);
  bad(r=>delete cel(r).itemBindings['gravity-hammer']);bad(r=>cel(r).itemBindings.pipe.handOcclusion=[]);
  const legacy=fixture();delete legacy.clips['armed-walk'];delete legacy.clips['armed-run'];
  const incomplete=F.compileSupplemental(legacy,{baseCompiled:base,complete:false});
  assert.equal(pose(actor('walk',{weapon:{kind:'pipe'}}),{supplemental:incomplete}).clipKey,'walk');
  assert.equal(pose(actor('run',{weapon:{kind:'pipe'}}),{supplemental:incomplete}).clipKey,'walk');
});
check('a grab enters reach then holds indefinitely without playing the old release',()=>{
  assert.equal(pose(actor('grab-hold',{grapple:{phase:'hold',elapsedMs:20}})).frameId,'grab_reach');
  assert.equal(pose(actor('grab-hold',{grapple:{phase:'hold',elapsedMs:120}})).frameId,'grab_hold');
  assert.equal(pose(actor('grab-hold',{grapple:{phase:'hold',elapsedMs:2900}})).committedKey,'grab-hold');
});
check('pummel load/contact/recovery follow the real attack phase rather than total grip age',()=>{
  for(const [phase,id] of [['windup','pummel_load'],['active','pummel_contact'],['recovery','grab_hold']]){
    const result=pose(actor('grab-pummel',{grapple:{elapsedMs:2500},attack:{kind:'pummel',phase,phaseProgress:.5}}));
    assert.equal(result.frameId,id);assert.equal(result.phase,phase);assert.equal(result.phaseProgress,.5);
  }
});
check('carry uses support cels; firearm idle uses authored two-hand ready while unarmed locomotion retains accepted cels',()=>{
  assert.equal(pose(actor('carry',{carry:{kind:'crate',elapsedMs:9000}})).frameId,'carry_hold');
  assert.equal(pose(actor('carry',{animation:{action:'carry',motion:{speed:65,stridePhase:.6}},carry:{kind:'crate'}})).frameId,'carry_b');
  assert.equal(pose(actor('idle',{weapon:{kind:'coil-rifle'}})).frameId,'fire_aim');
  assert.equal(pose(actor('idle',{weapon:{kind:'pipe'}})).frameId,'idle_a');
  assert.equal(pose(actor('walk',{animation:{action:'walk',motion:{speed:80,stridePhase:.1}},weapon:{kind:'pipe'}})).clipKey,'armed-walk');
  assert.equal(pose(actor('walk',{animation:{action:'walk',motion:{speed:80,stridePhase:.1}}})).supplemental,false);
});
check('melee heavy firearm and disc styles retain actual weapon identity and normalized contact',()=>{
  for(const [action,weapon,clip] of [['weapon-melee','pipe','melee'],['weapon-heavy','gravity-hammer','melee'],
    ['weapon-fire','coil-rifle','fire'],['weapon-disc','plasma-disc','fire']]){
    for(const phase of ['windup','active','recovery']){
      const result=pose(actor(action,{weapon:{kind:weapon},attack:{kind:weapon,phase,phaseProgress:.75}}));
      assert.equal(result.committedKey,clip+'.'+phase);assert.equal(result.attackType,weapon);assert.equal(result.phaseProgress,.75);
      assert(result.gripAnchor);assert.equal(result.frame.sheet,'dyn_test');
    }
  }
});
check('pipe-specific complete swings follow the committed weapon and phase without replacing other melee cels',()=>{
  const r=plain(registration);r.sheets[0].dimensions.width=1320;
  for(const [index,phase] of ['windup','active','recovery'].entries()){
    const id='pipe_swing_'+phase;
    r.frames.push({id,sheet:'dyn_test',source:{x:(19+index)*60,y:0,width:60,height:80},
      feetPivot:{x:30,y:75},baselineLift:0,embeddedWeapon:'pipe'});
    r.clips['pipe-swing.'+phase]={loop:false,frames:[{frame:id,holdMs:200}]};
  }
  const bank=F.compileSupplemental(r,{baseCompiled:base});
  for(const phase of ['windup','active','recovery']){
    const attack={kind:'pipe',weaponKind:'pipe',phase,phaseProgress:.65};
    const result=pose(actor('weapon-melee',{weapon:{kind:'crowbar'},attack}),{supplemental:bank});
    assert.equal(result.clipKey,'pipe-swing.'+phase);assert.equal(result.frame.embeddedWeapon,'pipe');
    assert.equal(result.phaseProgress,.65);assert.equal(result.clipTimeMs,130);assert.equal(result.gripAnchor,null);
    const other=pose(actor('weapon-melee',{weapon:{kind:'pipe'},attack:{...attack,kind:'crowbar',weaponKind:'crowbar'}}),{supplemental:bank});
    assert.equal(other.clipKey,'melee.'+phase);assert.equal(other.frame.embeddedWeapon,undefined);
    assert.equal(pose(actor('weapon-melee',{weapon:{kind:'pipe'},attack}),{supplemental}).clipKey,'melee.'+phase);
  }
  const invalid=plain(r);invalid.frames.at(-1).embeddedWeapon='unregistered-weapon';
  assert.throws(()=>F.compileSupplemental(invalid,{baseCompiled:base}),/unknown embedded weapon/);
});
check('each embedded gun and disc retains its own complete ready gait run and steady guard cels in both facings',()=>{
  const bank=F.compileSupplemental(embeddedFixture(),{baseCompiled:base});
  for(const kind of F.embeddedWeapons)for(const facing of [-1,1]) {
    const stem=kind.replaceAll('-','_');
    for(const [action,stride,id]of [['idle',0,'ready'],['walk',.1,'walk_a'],['walk',.6,'walk_b'],
      ['run',.1,'run_a'],['run',.6,'run_b'],['guard',0,'guard']]) {
      const result=pose(actor(action,{facing,weapon:{kind},animation:{action,ageMs:50,motion:{speed:80,stridePhase:stride}}}),
        {supplemental:bank,guardImpactAgeMs:20});
      assert.equal(result.frameId,stem+'_'+id);assert.equal(result.frame.embeddedWeapon,kind);
      assert.equal(result.supplemental,true);assert.equal(result.facing,facing);
      assert.equal(result.gripAnchor,null);assert.equal(result.handOcclusion,null);
      assert.equal(result.frame.itemBindings,undefined);assert.equal(result.shotAnchor,null);
      assert.equal(result.weaponStowed,false,'Authored owned weapon cels remain visible');
    }
  }
  assert.equal(pose(actor('walk'),{supplemental:bank}).supplemental,false);
  assert.equal(pose(actor('weapon-melee',{weapon:{kind:'crowbar'},attack:{kind:'crowbar',weaponKind:'crowbar',phase:'active',phaseProgress:.5}}),
    {supplemental:bank}).clipKey,'melee.active');
});
check('armed guard creep enters both authored foot contacts while retaining each native weapon grip',()=>{
  const r=embeddedFixture();
  for(const id of ['guard_a','guard_b'])r.frames.find(f=>f.id===id).itemBindings=Object.fromEntries(F.embeddedWeapons.map((kind,i)=>[kind,
    {gripAnchor:{x:40+i,y:35},weaponAngle:.4+i*.1,itemLayer:'front',
      handOcclusion:[[{x:35,y:30},{x:49,y:30},{x:49,y:42},{x:35,y:42}]]}]));
  const bank=F.compileSupplemental(r,{baseCompiled:base});
  for(const kind of F.embeddedWeapons)for(const facing of [-1,1]){
    const frames=[];
    for(const [stridePhase,id]of [[.1,'guard_a'],[.6,'guard_b']]){
      const value=actor('guard-creep',{facing,guarding:true,weapon:{kind,charges:7},
        animation:{action:'guard-creep',motion:{speed:57.2,stridePhase}}}),before=plain(value);
      const result=pose(value,{supplemental:bank});frames.push(result.frameId);
      assert.equal(result.frameId,id);assert.equal(result.clipKey,'guard-walk');
      assert.equal(result.frame.embeddedWeapon,undefined);assert.equal(result.weaponKind,kind);
      assert.equal(result.weaponStowed,false);assert.equal(result.facing,facing);
      assert.deepEqual(plain(result.gripAnchor),r.frames.find(f=>f.id===id).itemBindings[kind].gripAnchor);
      assert(result.handOcclusion.length>0);assert.deepEqual(plain(value),before,'Sampling never changes movement or charges');
    }
    assert.equal(new Set(frames).size,2,'A moving guard must step rather than slide on one still');
  }
});
check('armed block impact overrides creep then returns at its authored boundary without stealing fire hurt or steady guard',()=>{
  const r=embeddedFixture();r.clips['guard-impact']={loop:false,frames:[{frame:'guard_b',holdMs:120}]};
  const bank=F.compileSupplemental(r,{baseCompiled:base});
  for(const kind of F.embeddedWeapons)for(const facing of [-1,1]){
    for(const action of ['guard','guard-creep']){
      const value=actor(action,{facing,guarding:true,weapon:{kind,charges:7},animation:{action,ageMs:2000,motion:{speed:57.2,stridePhase:.1}}});
      for(const age of [0,40,119.999]){
        const result=pose(value,{supplemental:bank,guardImpactAgeMs:age});
        assert.equal(result.clipKey,'guard-impact');assert.equal(result.frameId,'guard_b');assert.equal(result.clipTimeMs,age);
        assert.equal(result.weaponKind,kind);assert.equal(result.weaponStowed,false);assert(result.gripAnchor);
      }
      for(const age of [-1,120,121])assert.equal(pose(value,{supplemental:bank,guardImpactAgeMs:age}).clipKey,
        action==='guard'?'weapon_'+kind+'.guard':'guard-walk','An old block cannot pin the impact pose');
    }
    const fire=kind==='plasma-disc'?'weapon-disc':'weapon-fire';
    assert.equal(pose(actor(fire,{facing,weapon:{kind},attack:{kind,weaponKind:kind,phase:'active',phaseProgress:.5}}),
      {supplemental:bank,guardImpactAgeMs:40}).clipKey,'weapon_'+kind+'.active');
    assert.equal(pose(actor('guard-creep',{facing,weapon:{kind},hurtMs:100,hitFeedback:{ageMs:17}}),
      {supplemental:bank,guardImpactAgeMs:40}).clipKey,'weapon_'+kind+'.hurt');
  }
});
check('retained disc flight kicks counters and guard response use complete rim-held cels while preserving the original phase clock',()=>{
  const r=discRetainedFixture(),bank=F.compileSupplemental(r,{baseCompiled:base}),legacy=plain(r);
  legacy.sheets=legacy.sheets.filter(s=>s.id!=='dyn_disc_retained');legacy.frames=legacy.frames.filter(f=>f.sheet!=='dyn_disc_retained');
  for(const key of Object.keys(legacy.clips))if(key.startsWith('disc-carry.'))delete legacy.clips[key];
  const old=F.compileSupplemental(legacy,{baseCompiled:base}),visited=new Set();
  for(const facing of [-1,1]){
    const weapon={kind:'plasma-disc',charges:6};
    const cases=[...[560,450,250,-100,-400].map(velocityZ=>[actor('jump',{facing,weapon,elevation:70,velocityZ}),{}]),
      [actor('walk',{facing,weapon}),{landingAgeMs:35}],
      ...[0,.26,.51,.76].map(stridePhase=>[actor('guard-creep',{facing,weapon,guarding:true,animation:{action:'guard-creep',motion:{speed:57.2,stridePhase}}}),{}]),
      [actor('guard',{facing,weapon,guarding:true}),{guardImpactAgeMs:40}]];
    for(const kind of ['air-kick','running-kick','counter'])for(const phase of ['windup','active','recovery'])for(const phaseProgress of [0,.75])
      cases.push([actor(kind==='running-kick'?kind:'strike',{facing,weapon,attack:{kind,phase,phaseProgress}}),{}]);
    for(const [value,extra]of cases){const before=plain(value),previous=pose(value,{supplemental:old,...extra}),result=pose(value,{supplemental:bank,...extra}),id=discRetainedAliases[previous.frameId];
      assert(id,'Every retained test pose has a deliberate complete-disc equivalent: '+previous.frameId);visited.add(previous.frameId);
      assert.equal(result.frameId,id);assert.equal(result.frame.embeddedWeapon,'plasma-disc');assert.equal(result.gripAnchor,null);assert.equal(result.handOcclusion,null);
      assert.equal(result.weaponStowed,false);assert.equal(result.facing,facing);assert.equal(result.clipKey,previous.clipKey);assert.equal(result.clipTimeMs,previous.clipTimeMs);
      assert.equal(result.phaseProgress,previous.phaseProgress);assert.equal(result.frameIndex,previous.frameIndex);assert.deepEqual(plain(value),before);
    }
  }
  assert.deepEqual([...visited].sort(),Object.keys(discRetainedAliases).filter(id=>id!=='guard_brace').sort(),'Every flight, attack and guard alias is sampled; the fixture guard walk uses only its two step contacts');
});
check('retained disc substitution requires real free-handed inventory and never duplicates native fire or changes gun melee hurt and release ownership',()=>{
  const bank=F.compileSupplemental(discRetainedFixture(),{baseCompiled:base});
  for(const kind of F.weapons)for(const action of ['idle','walk','run']){
    const result=pose(actor(action,{weapon:{kind},animation:{action,motion:{speed:260,stridePhase:.6}}}),{supplemental:bank});
    assert(!result.frame.id.startsWith('disc_jump_')&&!result.frame.id.startsWith('disc_kick_'));
    if(F.embeddedWeapons.includes(kind))assert.equal(result.clipKey,'weapon_'+kind+'.'+action);
  }
  for(const phase of ['windup','active','recovery']){
    const value=actor('weapon-disc',{weapon:{kind:'plasma-disc',charges:6},attack:{kind:'plasma-disc',weaponKind:'plasma-disc',phase,phaseProgress:.5}}),before=plain(value);
    const result=pose(value,{supplemental:bank});assert.equal(result.clipKey,'weapon_plasma-disc.'+phase);assert.equal(result.frame.sheet,'dyn_plasma_disc');assert.deepEqual(plain(value),before);
    assert.equal(!!result.shotAnchor,phase==='active','Only the actual committed shot exposes a projectile origin');
  }
  for(const value of [actor('carry',{weapon:{kind:'plasma-disc'},carry:{kind:'crate',elapsedMs:500}}),
    actor('grab-hold',{weapon:{kind:'plasma-disc'},grapple:{elapsedMs:500}})]){
    const result=pose(value,{supplemental:bank});assert.equal(result.weaponStowed,true);assert.equal(result.frame.embeddedWeapon,undefined);
  }
  for(const value of [actor('hurt',{hurtMs:80}),actor('run',{hp:0}),
    actor('strike',{animation:{action:'strike',weaponKind:'plasma-disc'},attack:{kind:'counter',phase:'active',phaseProgress:.5}})])
    assert.notEqual(pose(value,{supplemental:bank}).frame.sheet,'dyn_disc_retained','Dropped or absent inventory cannot be resurrected by animation identity');
});
check('the optional retained disc family is admitted all-or-nothing with exact alias identity no detached grips and no shot fields',()=>{
  const bad=edit=>{const r=discRetainedFixture();edit(r);assert.throws(()=>F.compileSupplemental(r,{baseCompiled:base}),/Whole-character frames/);};
  const cel=r=>r.frames.find(f=>f.id==='disc_kick_contact');
  bad(r=>delete r.clips['disc-carry.load']);bad(r=>r.clips['disc-carry.kick_extend'].frames[0].frame='disc_kick_retract');
  bad(r=>r.clips['disc-carry.landing'].loop=true);bad(r=>r.clips['disc-carry.landing'].frames[0].holdMs=101);
  bad(r=>r.clips['disc-carry.hook_recovery'].frames.push({...r.clips['disc-carry.hook_recovery'].frames[0]}));
  bad(r=>r.frames=r.frames.filter(f=>f.id!=='disc_jump_load'));bad(r=>cel(r).sheet='dyn_plasma_disc');
  bad(r=>cel(r).embeddedWeapon='pipe');bad(r=>cel(r).gripAnchor={x:30,y:30});bad(r=>cel(r).shotAnchor={x:40,y:30});
  bad(r=>r.clips['disc-carry.unknown']=r.clips['disc-carry.load']);
  assert(F.compileSupplemental(embeddedFixture(),{baseCompiled:base}).supplemental,'Earlier banks without the optional family retain their existing complete poses');
});
check('production five melee gaits use the registered ordered steady-hand cels with all native bindings and unchanged stride timing',()=>{
  const r=JSON.parse(fs.readFileSync(path.join(source,'assets/mac-street-dynamic/mac-modem-actions-v1.json'),'utf8')),bank=F.compileSupplemental(r,{baseCompiled:base});
  for(const action of ['walk','run'])for(const kind of F.weapons.filter(k=>!F.embeddedWeapons.includes(k)))for(const facing of [-1,1])
    for(const entry of bank.clips['armed-'+action].frames){
      const clip=bank.clips['armed-'+action],stridePhase=(entry.startMs+entry.endMs)/2/clip.totalMs,value=actor(action,{facing,weapon:{kind,charges:7},animation:{action,motion:{speed:action==='walk'?260:429,stridePhase}}});
      const before=plain(value),result=pose(value,{supplemental:bank}),binding=bank.frames[entry.frame].itemBindings[kind];
      assert.equal(result.frameId,entry.frame);assert.equal(result.frame.sheet,'dyn_armed_'+action);assert.equal(result.clipKey,'armed-'+action);
      assert.equal(result.weaponStowed,false);assert.equal(result.frame.embeddedWeapon,undefined);assert(result.handOcclusion.length);
      assert.deepEqual(plain(result.gripAnchor),plain(binding.gripAnchor));assert.equal(result.weaponAngle,binding.weaponAngle);assert.deepEqual(plain(value),before);
    }
});
check('production retained disc replaces every generic rim-holding pose with the exact complete cel without detached equipment or a second clock',()=>{
  const r=JSON.parse(fs.readFileSync(path.join(source,'assets/mac-street-dynamic/mac-modem-actions-v1.json'),'utf8')),bank=F.compileSupplemental(r,{baseCompiled:base});
  for(const facing of [-1,1])for(const [value,extra,key,id]of [
    [actor('jump',{facing,weapon:{kind:'plasma-disc'},elevation:60,velocityZ:560}),{},'jump-rise','disc_jump_load'],
    [actor('jump',{facing,weapon:{kind:'plasma-disc'},elevation:60,velocityZ:-400}),{},'jump-fall','disc_jump_descent'],
    [actor('walk',{facing,weapon:{kind:'plasma-disc'}}),{landingAgeMs:35},'landing','disc_landing'],
    [actor('strike',{facing,weapon:{kind:'plasma-disc'},attack:{kind:'counter',phase:'active',phaseProgress:.5}}),{},'counter.active','disc_counter_contact'],
    [actor('guard-creep',{facing,weapon:{kind:'plasma-disc'},guarding:true,animation:{action:'guard-creep',motion:{speed:57.2,stridePhase:.1}}}),{},'guard-walk','disc_guard_brace']]){
    const before=plain(value),result=pose(value,{supplemental:bank,...extra});assert.equal(result.clipKey,key);assert.equal(result.frameId,id);
    assert.equal(result.frame.embeddedWeapon,'plasma-disc');assert.equal(result.gripAnchor,null);assert.equal(result.handOcclusion,null);assert.equal(result.weaponStowed,false);assert.deepEqual(plain(value),before);
  }
});
check('production armed guard sampling uses registered step masks and impact cels instead of a frozen embedded guard',()=>{
  const file=path.join(source,'assets/mac-street-dynamic/mac-modem-actions-v1.json'),r=JSON.parse(fs.readFileSync(file,'utf8'));
  const bank=F.compileSupplemental(r,{baseCompiled:base}),clip=bank.clips['guard-walk'];
  assert.deepEqual(plain(clip.frames.map(entry=>entry.frame)),['guard_brace','guard_step_a','guard_brace','guard_step_b']);
  for(const kind of F.embeddedWeapons)for(const facing of [-1,1]){
    for(const entry of clip.frames){
      const stridePhase=(entry.startMs+entry.endMs)/2/clip.totalMs;
      const value=actor('guard-creep',{facing,guarding:true,weapon:{kind,charges:7},animation:{action:'guard-creep',motion:{speed:57.2,stridePhase}}});
      const before=plain(value),result=pose(value,{supplemental:bank});
      assert.equal(result.frameId,kind==='plasma-disc'?'disc_'+entry.frame:entry.frame);assert.equal(result.clipKey,'guard-walk');
      assert.equal(result.weaponKind,kind);assert.equal(result.weaponStowed,false);
      if(kind==='plasma-disc'){assert.equal(result.frame.embeddedWeapon,kind);assert.equal(result.gripAnchor,null);assert.equal(result.handOcclusion,null);}
      else{assert.equal(result.frame.embeddedWeapon,undefined);assert(result.handOcclusion.length>0);
        assert.deepEqual(plain(result.gripAnchor),plain(bank.frames[entry.frame].itemBindings[kind].gripAnchor));}
      assert.deepEqual(plain(value),before);
    }
    const result=pose(actor('guard',{facing,guarding:true,weapon:{kind}}),{supplemental:bank,guardImpactAgeMs:40});
    assert.equal(result.clipKey,'guard-impact');assert.equal(result.frameId,kind==='plasma-disc'?'disc_guard_impact':'guard_impact');
    if(kind==='plasma-disc'){assert.equal(result.frame.embeddedWeapon,kind);assert.equal(result.gripAnchor,null);}
    else{assert.equal(result.frame.embeddedWeapon,undefined);assert(result.gripAnchor&&result.handOcclusion.length);}
    assert.equal(pose(actor('guard',{facing,guarding:true,weapon:{kind}}),{supplemental:bank,guardImpactAgeMs:bank.clips['guard-impact'].totalMs}).clipKey,
      'weapon_'+kind+'.guard','Completed impact restores the accepted embedded guard');
  }
});
check('committed embedded attacks select the actual weapon and expose a frozen crop-local shot origin',()=>{
  const bank=F.compileSupplemental(embeddedFixture(),{baseCompiled:base});
  for(const kind of F.embeddedWeapons)for(const facing of [-1,1])for(const phase of ['windup','active','recovery']) {
    const action=kind==='plasma-disc'?'weapon-disc':'weapon-fire',stem=kind.replaceAll('-','_');
    const attack={kind,weaponKind:kind,phase,phaseProgress:.5};
    const result=pose(actor(action,{facing,weapon:{kind:'pipe'},attack,
      animation:{action,weaponKind:'pipe',ageMs:0,motion:{speed:0,stridePhase:0}}}),{supplemental:bank});
    assert.equal(result.clipKey,'weapon_'+kind+'.'+phase);assert.equal(result.frame.embeddedWeapon,kind);
    assert.equal(result.weaponKind,kind);assert.equal(result.attackType,kind);assert.equal(result.phaseProgress,.5);assert.equal(result.gripAnchor,null);
    assert.equal(result.weaponStowed,false);
    if(phase==='active') {
      assert.deepEqual(plain(result.shotAnchor),{x:80,y:30});assert(Object.isFrozen(result.shotAnchor));
      assert.equal(result.shotAnchor,result.frame.shotAnchor);
      const forward=(result.shotAnchor.x-result.frame.feetPivot.x)*260/result.standingHeight;
      const elevation=(result.frame.feetPivot.y-result.shotAnchor.y)*260/result.standingHeight+result.frame.baselineLift;
      assert.equal(forward,40*260/70);assert.equal(elevation,55*260/70);
      assert.equal(result.frameId,stem+'_recoil');
      const spent=pose(actor(action,{facing,weapon:null,attack}),{supplemental:bank});
      assert.equal(spent.frameId,result.frameId,'Last charge keeps the committed complete weapon cel');
    }
  }
});
check('embedded hurt follows actual hurt age while defeat carry and grapple preserve their authoritative cels',()=>{
  const bank=F.compileSupplemental(embeddedFixture(),{baseCompiled:base});
  for(const kind of F.embeddedWeapons) {
    const hurt=pose(actor('run',{hurtMs:100,weapon:{kind},hitFeedback:{ageMs:17},attack:{kind,weaponKind:kind,phase:'invalid'}}),{supplemental:bank});
    assert.equal(hurt.action,'hurt');assert.equal(hurt.clipKey,'weapon_'+kind+'.hurt');
    assert.equal(hurt.clipTimeMs,17);assert.equal(hurt.frame.embeddedWeapon,kind);
    assert.equal(pose(actor('run',{hp:0,weapon:{kind},attack:{kind,weaponKind:kind,phase:'invalid'}}),{supplemental:bank}).clipKey,'defeat');
    assert.equal(pose(actor('carry',{weapon:{kind},carry:{kind:'crate',elapsedMs:500}}),{supplemental:bank}).clipKey,'carry');
    assert.equal(pose(actor('grab-hold',{weapon:{kind},grapple:{elapsedMs:500}}),{supplemental:bank}).clipKey,'grab-hold');
    for(const phase of ['windup','active','recovery'])assert.equal(pose(actor('running-kick',{weapon:{kind},
      attack:{kind:'running-kick',phase,phaseProgress:.5}}),{supplemental:bank}).clipKey,'air-kick.'+phase);
  }
});
check('partial embedded banks wrong weapon identities detached hands and unsafe shot anchors fail registration',()=>{
  const bad=edit=>{const r=embeddedFixture();edit(r);assert.throws(()=>F.compileSupplemental(r,{baseCompiled:base}),/Whole-character frames/);};
  bad(r=>delete r.clips['weapon_coil-rifle.guard']);
  bad(r=>r.clips['weapon_scatter-blaster.active'].frames[0].frame='coil_rifle_recoil');
  bad(r=>r.frames.find(f=>f.id==='coil_rifle_recoil').shotAnchor.x=91);
  bad(r=>delete r.frames.find(f=>f.id==='coil_rifle_recoil').shotAnchor);
  bad(r=>r.frames.find(f=>f.id==='coil_rifle_guard').gripAnchor={x:40,y:30});
  bad(r=>r.clips['weapon_plasma-disc.guard'].loop=false);
  bad(r=>r.clips['weapon_coil-rifle.hurt'].loop=true);
  bad(r=>r.clips['weapon_coil-rifle.walk'].frames.pop());
  bad(r=>r.clips['weapon_coil-rifle.active'].frames.push({...r.clips['weapon_coil-rifle.active'].frames[0]}));
});
check('retained gun and disc flight kicks counters and landing stay held; carry and grapple occupy hands without changing inventory',()=>{
  const bank=F.compileSupplemental(embeddedFixture(),{baseCompiled:base});
  for(const kind of F.embeddedWeapons)for(const facing of [-1,1]) {
    const weapon={kind,charges:7,maxCharges:8},values=[
      [actor('jump',{facing,weapon,elevation:90,velocityZ:300}),{}],
      [actor('jump',{facing,weapon,elevation:90,velocityZ:-300}),{}],
      [actor('idle',{facing,weapon}),{landingAgeMs:35}],
      [actor('walk',{facing,weapon,animation:{action:'walk',motion:{speed:80,stridePhase:.6}}}),{landingAgeMs:35}],
      [actor('carry',{facing,weapon,carry:{kind:'crate',elapsedMs:500}}),{}],
      [actor('grab-hold',{facing,weapon,grapple:{elapsedMs:500}}),{}],
      [actor('throw',{facing,weapon,grapple:{phase:'release',releaseAgeMs:40,elapsedMs:1500}}),{}]
    ];
    for(const move of ['air-kick','counter','running-kick'])for(const phase of ['windup','active','recovery'])
      values.push([actor(move==='running-kick'?move:'strike',{facing,weapon,
        attack:{kind:move,phase,phaseProgress:.5}}),{}]);
    for(const [value,extra]of values) {
      const before=plain(value),result=pose(value,{supplemental:bank,...extra});
      assert.equal(result.weaponStowed,!!(value.carry||value.grapple),'Only occupied hands stow retained '+kind+' on '+result.clipKey);
      assert.equal(result.frame.embeddedWeapon,undefined);assert.deepEqual(plain(value),before);
      assert.deepEqual(plain(value.weapon),weapon,'Rendering retains every charge and inventory identity');
    }
    const ready=pose(actor('idle',{facing,weapon}),{supplemental:bank,landingAgeMs:100});
    assert.equal(ready.clipKey,'weapon_'+kind+'.idle');assert.equal(ready.weaponStowed,false);
    assert.equal(ready.frame.embeddedWeapon,kind,'Completed landing restores the proper whole weapon ready cel');
  }
  const melee=pose(actor('jump',{weapon:{kind:'pipe'},elevation:90,velocityZ:300}),{supplemental:bank});
  assert.equal(melee.weaponStowed,false,'Existing melee attachments retain their authored route');
  assert.equal(pose(actor('jump',{weapon:{kind:'coil-rifle'},elevation:90,velocityZ:300})).weaponStowed,false,
    'Legacy fixtures without the complete profile keep their existing explicitly registered route');
});
check('air kick and flight retain accepted complete cels with supplemental item anchors only',()=>{
  const result=pose(actor('strike',{weapon:{kind:'pipe'},attack:{kind:'air-kick',phase:'active',phaseProgress:.5}}));
  assert.equal(result.committedKey,'air-kick.active');assert.equal(result.supplemental,false);
  const jump=pose(actor('jump',{elevation:90,velocityZ:100,weapon:{kind:'pipe'}}));
  assert.equal(jump.committedKey,'jump-rise');assert.equal(jump.frameId,'chamber');
  assert.deepEqual(plain(jump.gripAnchor),{x:100,y:120});assert.equal(jump.weaponAngle,.2);
});
check('running kick follows real attack phases using accepted complete kick cels and keeps weapon identity',()=>{
  for(const phase of ['windup','active','recovery']) {
    const attack={kind:'running-kick',weaponKind:'pipe',phase,phaseProgress:.4};
    const result=pose(actor('running-kick',{weapon:{kind:'pipe'},attack}));
    assert.equal(result.committedKey,'air-kick.'+phase);assert.equal(result.action,'running-kick');
    assert.equal(result.attackType,'running-kick');assert.equal(result.phaseProgress,.4);assert.equal(result.weaponKind,'pipe');
    assert.equal(result.frameId,F.selectFrame(base,'air-kick.'+phase,{progress:.4}).frame.id);
  }
  assert.equal(pose(actor('running-kick',{hurtMs:40,attack:{kind:'running-kick',phase:'active'}})).committedKey,'hurt');
});
check('individual weapon bindings select frozen native hand masks while carried props use their support anchor',()=>{
  const r=plain(registration),f=r.frames.find(f=>f.id==='melee_contact');
  f.itemBindings={pipe:{gripAnchor:{x:41,y:36},weaponAngle:.4,itemLayer:'behind',
    handOcclusion:[[{x:35,y:30},{x:48,y:30},{x:48,y:42},{x:35,y:42}]]}};
  const bank=F.compileSupplemental(r,{baseCompiled:base});
  const result=pose(actor('weapon-melee',{weapon:{kind:'pipe'},attack:{kind:'pipe',phase:'active',phaseProgress:0}}),{supplemental:bank});
  assert.deepEqual(plain(result.gripAnchor),{x:41,y:36});assert.equal(result.weaponAngle,.4);assert.equal(result.itemLayer,'behind');
  assert(Object.isFrozen(result.handOcclusion));assert(Object.isFrozen(result.handOcclusion[0]));assert(Object.isFrozen(result.handOcclusion[0][0]));
  const stowed=pose(actor('weapon-melee',{carry:{kind:'crate'},weapon:{kind:'pipe'},attack:{kind:'pipe',phase:'active',phaseProgress:0}}),{supplemental:bank});
  assert.deepEqual(plain(stowed.gripAnchor),{x:40,y:35});assert.equal(stowed.itemLayer,'front');
  const spent=pose(actor('weapon-melee',{attack:{kind:'pipe',weaponKind:'pipe',phase:'active',phaseProgress:0}}),{supplemental:bank});
  assert.deepEqual(plain(spent.gripAnchor),{x:41,y:36});
});
check('malformed native occlusion and per-weapon ergonomics are rejected rather than silently inferred',()=>{
  const good={gripAnchor:{x:41,y:36},weaponAngle:.4,itemLayer:'front',
    handOcclusion:[[{x:35,y:30},{x:48,y:30},{x:48,y:42},{x:35,y:42}]]};
  const bad=edit=>{const r=plain(registration);r.frames[0].itemBindings={pipe:plain(good)};edit(r.frames[0]);
    assert.throws(()=>F.compileSupplemental(r,{baseCompiled:base}),/Whole-character frames/);};
  bad(f=>f.itemBindings.unknown=f.itemBindings.pipe);bad(f=>f.itemBindings.pipe.itemLayer='automatic');
  bad(f=>f.itemBindings.pipe.gripAnchor.x=61);bad(f=>f.itemBindings.pipe.weaponAngle=NaN);
  bad(f=>f.itemBindings.pipe.itemScale=0);bad(f=>f.itemBindings.pipe.itemScale=1.01);bad(f=>f.itemBindings.pipe.itemScale=NaN);
  bad(f=>f.itemBindings.pipe.handOcclusion=[]);bad(f=>f.itemBindings.pipe.handOcclusion[0][0].y=81);
  bad(f=>f.itemBindings.pipe.handOcclusion[0]=[{x:1,y:1},{x:2,y:2},{x:3,y:3}]);
  bad(f=>f.itemBindings.pipe.handOcclusion[0]=[{x:1,y:1},{x:2,y:2}]);bad(f=>f.handOcclusion='automatic');
});
check('actual hurt death and defeat override every held-item action',()=>{
  for(const action of ['run','grab-hold','grab-pummel','carry','weapon-melee','weapon-fire']){
    assert.equal(pose(actor(action,{hurtMs:100,attack:{kind:'pipe',phase:'invalid'}})).committedKey,'hurt');
    assert.equal(pose(actor(action,{hp:0,attack:{kind:'pipe',phase:'invalid'}})).committedKey,'defeat');
  }
});
check('carry throw and enemy release reset to commitment age after a long hold',()=>{
  const thrown=pose(actor('carry-throw',{animation:{action:'carry-throw',ageMs:150},carry:{elapsedMs:9000,releaseAgeMs:150}}));
  assert.equal(thrown.frameId,'throw_release');assert.equal(thrown.clipTimeMs,150);
  const enemy=pose(actor('throw',{animation:{action:'throw',ageMs:40},grapple:{phase:'release',elapsedMs:2500,releaseAgeMs:40}}));
  assert.equal(enemy.frameId,'throw_grab');assert.equal(enemy.clipTimeMs,40);
});
check('unavailable supplemental art safely falls back to accepted complete-character cels',()=>{
  for(const action of ['run','guard-creep','grab-hold','carry'])assert.equal(pose(actor(action),{supplemental:undefined}).supplemental,false);
  for(const action of ['weapon-melee','weapon-heavy','weapon-fire','weapon-disc','grab-pummel']){
    const result=pose(actor(action,{attack:{kind:'pipe',phase:'active',phaseProgress:.5}}),{supplemental:undefined});
    assert.equal(result.supplemental,false);assert(result.frame.sourceImage.startsWith('assets/mac-combat-frames/'));
  }
  assert.equal(pose(actor('grab-hold',{grapple:{elapsedMs:2500}}),{supplemental:undefined}).clipTimeMs,0);
});
check('held-item metadata is frozen and cannot modify the accepted base cel',()=>{
  const result=pose(actor('weapon-fire',{attack:{kind:'coil-rifle',phase:'active',phaseProgress:0}}));
  assert(Object.isFrozen(result.gripAnchor));assert(Object.isFrozen(supplemental.baseGripAnchors.chamber));
  assert.throws(()=>{result.gripAnchor.x=0;},TypeError);assert.equal(result.weaponAngle,-.12);
});
check('optional pickup and guard impact use only actual carry or event ages',()=>{
  const r=plain(registration);r.clips.pickup={loop:false,frames:[{frame:'carry_hold',holdMs:110}]};
  r.clips['guard-impact']={loop:false,frames:[{frame:'guard_b',holdMs:120}]};
  const bank=F.compileSupplemental(r,{baseCompiled:base});
  assert.equal(pose(actor('carry',{carry:{elapsedMs:30}}),{supplemental:bank}).committedKey,'pickup');
  assert.equal(pose(actor('carry',{carry:{elapsedMs:300}}),{supplemental:bank}).committedKey,'carry');
  assert.equal(pose(actor('guard'),{supplemental:bank,guardImpactAgeMs:20}).committedKey,'guard-impact');
  assert.equal(pose(actor('guard'),{supplemental:bank,guardImpactAgeMs:150}).committedKey,'guard');
});
check('adversarial action loops incomplete poses grip bounds angle and base-sheet shadowing are rejected',()=>{
  const bad=edit=>{const r=plain(registration);edit(r);assert.throws(()=>F.compileSupplemental(r,{baseCompiled:base}),/Whole-character frames/);};
  bad(r=>delete r.clips['fire.active']);bad(r=>r.clips['melee.active'].loop=true);
  bad(r=>r.clips.run.frames.pop());bad(r=>r.clips['pummel.active'].frames=r.clips['pummel.windup'].frames);
  bad(r=>delete r.frames[0].gripAnchor);bad(r=>r.frames[0].gripAnchor.x=61);bad(r=>r.frames[0].weaponAngle=4);
  bad(r=>r.frames[0].baselineLift=20);
  bad(r=>r.sheets[0].id='basic');bad(r=>r.sheets[0].pixelScale.referenceFrame='missing');
  bad(r=>r.baseGripAnchors.no_such_cel={gripAnchor:{x:1,y:1}});
  bad(r=>r.baseGripAnchors.chamber.gripAnchor.y=9999);bad(r=>r.frames[1].source.x=0);
  bad(r=>r.sheets[0].excludedRegions=[{source:{x:0,y:0,width:60,height:80},reason:'bad shadow'}]);
});
check('draw uses one native whole-character crop at the same scale facing and floor baseline',()=>{
  const result=pose(actor('run')),calls=[],ctx={save(){},restore(){},translate(...v){calls.push(['translate',...v]);},
    scale(...v){calls.push(['scale',...v]);},drawImage(...v){calls.push(['drawImage',...v]);}};
  const sheet={naturalWidth:1200,naturalHeight:100},art={images:new Map([['dyn_test',sheet]]),compiled:base};
  for(const facing of [1,-1]){
    calls.length=0;const proof=F.draw(ctx,art,result,300,880,200,facing);
    assert.equal(calls.filter(c=>c[0]==='drawImage').length,1);assert.equal(proof.scale,200/70);
    assert.equal(proof.pose,result);assert.equal(proof.gripAnchor,result.gripAnchor);
    assert.deepEqual(calls[0],['translate',300,880]);assert.deepEqual(calls[1],['scale',facing,1]);
  }
  assert.throws(()=>F.draw(ctx,{...art,images:new Map([['dyn_test',{naturalWidth:600,naturalHeight:100}]])},result,0,0,200),/dimensions differ/);
});
check('measured uniform anatomical calibration keeps whole cels feet and item anchors on one scalar',()=>{
  const r=fixture(),sheet=r.sheets[0],reference={frame:'idle_a',standingVisibleHeight:321,
    segment:{from:{x:215,y:44},to:{x:230,y:118}}};
  const scalar=(Math.hypot(15,74)/321)/(20/70);
  sheet.bodyCalibration={schemaVersion:1,feature:'cap-crown-to-beard-tip',uniformScale:scalar,
    nativeSegment:{from:{x:20,y:10},to:{x:20,y:30}},reference};
  const bank=F.compileSupplemental(r,{baseCompiled:base}),value=actor('run');
  const before=plain(value),p=pose(value,{supplemental:bank}),calls=[];
  const ctx={save(){},restore(){},translate(...a){calls.push(['translate',...a]);},scale(...a){calls.push(['scale',...a]);},drawImage(...a){calls.push(['draw',...a]);}};
  const art={images:new Map([['dyn_test',{naturalWidth:1200,naturalHeight:100}]]),compiled:base};
  for(const facing of [-1,1]){
    calls.length=0;const result=F.draw(ctx,art,p,300,880,260,facing);
    assert(Math.abs(result.scale-260/70*scalar)<1e-12);assert.equal(bank.sheets.dyn_test.standingHeight,70);
    const call=calls.find(a=>a[0]==='draw');assert(Math.abs(call[8]/60-call[9]/80)<1e-12,'Whole native XY ratio remains identical');
    assert.deepEqual(calls[0],['translate',300,880]);assert.deepEqual(calls[1],['scale',facing,1]);
    assert.deepEqual(plain(p.gripAnchor),{x:40,y:35});assert.equal(p.frame.feetPivot.y,75);
  }
  assert(Object.isFrozen(bank.sheets.dyn_test.bodyCalibration.reference.segment.from));assert.deepEqual(plain(value),before);
});
check('unsafe detached or invented anatomical calibration fails before drawing',()=>{
  const make=()=>{const r=fixture();r.sheets[0].bodyCalibration={schemaVersion:1,feature:'cap-crown-to-beard-tip',
    uniformScale:(Math.hypot(15,74)/321)/(20/70),nativeSegment:{from:{x:20,y:10},to:{x:20,y:30}},
    reference:{frame:'idle_a',standingVisibleHeight:321,segment:{from:{x:215,y:44},to:{x:230,y:118}}}};return r;};
  for(const edit of [c=>c.uniformScale=.5,c=>c.uniformScale=1,c=>c.reference.frame='missing',
    c=>c.reference.standingVisibleHeight=330,c=>c.nativeSegment.to.x=61,c=>c.reference.segment.to.x=1000,
    c=>c.nativeSegment.to={...c.nativeSegment.from}]){
    const r=make();edit(r.sheets[0].bodyCalibration);assert.throws(()=>F.compileSupplemental(r,{baseCompiled:base}),/calibration|anatomical|uniform.*scale/);
  }
});
function inside(file){const resolved=path.resolve(source,file),relative=path.relative(source,resolved);
  assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Native asset must stay inside source');return resolved;}
function rgba(bytes){
  assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  let offset=8,width,height,depth,type,interlace;const parts=[];
  while(offset<bytes.length){const size=bytes.readUInt32BE(offset),tag=bytes.toString('ascii',offset+4,offset+8),body=bytes.subarray(offset+8,offset+8+size);
    assert.equal(body.length,size);if(tag==='IHDR'){width=body.readUInt32BE(0);height=body.readUInt32BE(4);depth=body[8];type=body[9];interlace=body[12];}
    if(tag==='IDAT')parts.push(body);offset+=size+12;if(tag==='IEND')break;}
  assert(depth===8&&type===6&&interlace===0,'Native non-interlaced RGBA8 source required');
  const stride=width*4,data=zlib.inflateSync(Buffer.concat(parts)),pixels=Buffer.alloc(stride*height);
  assert.equal(data.length,(stride+1)*height);
  const paeth=(a,b,c)=>{const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
  for(let y=0;y<height;y++)for(let x=0;x<stride;x++){
    const filter=data[y*(stride+1)],a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
    assert(filter<=4);pixels[y*stride+x]=(data[y*(stride+1)+x+1]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
  }return {width,height,pixels};
}
if(options.registration)check('actual supplemental registration matches native hashes crops ground and uniform scale',()=>{
  const file=path.isAbsolute(options.registration)?options.registration:inside(options.registration);
  const bytes=fs.readFileSync(file),r=JSON.parse(bytes),compiled=F.compileSupplemental(r,{baseCompiled:base});
  const priorFrames=['guard_brace','guard_step_a','guard_step_b','guard_impact','run_contact_a','run_pass_a','run_contact_b','run_pass_b',
    'grab_reach','grab_hold','pummel_load','pummel_contact','pickup_load','carry_hold','carry_step_a','carry_step_b',
    'melee_load','melee_contact','melee_follow','fire_aim','fire_recoil','fire_ready',
    'pipe_swing_load','pipe_swing_uncoil','pipe_swing_contact','pipe_swing_through','pipe_swing_finish','pipe_swing_recover'];
  for(const id of priorFrames)assert(compiled.frames[id],'Previous complete cel remains registered: '+id);
  const pipeFrames=Object.values(compiled.frames).filter(frame=>frame.embeddedWeapon==='pipe');
  assert.equal(pipeFrames.length,6);assert.deepEqual(pipeFrames.map(frame=>frame.id).sort(),priorFrames.slice(-6).sort());
  const equipped=F.embeddedWeapons.some(kind=>compiled.clips['weapon_'+kind+'.idle']);
  const lowCarry=!!compiled.sheets.dyn_carry_low,retainedDisc=!!compiled.sheets.dyn_disc_retained;
  assert.equal(Object.keys(compiled.frames).length,(equipped?55:28)+(lowCarry?6:0)+8+(retainedDisc?12:0),'Exact preserved cels plus low carry eight armed and optional twelve retained disc cels');
  assert.equal(compiled.sheetIds.length,(equipped?8:5)+(lowCarry?1:0)+2+(retainedDisc?1:0));
  if(lowCarry)for(const id of ['carry_low_pickup','carry_low_hold','carry_low_stride','carry_low_pass','carry_low_windup','carry_low_release'])assert(compiled.frames[id]?.sheet==='dyn_carry_low');
  assert.equal(r.baseRegistrationSHA256,sha(fs.readFileSync(basePath)),'Accepted base registration unchanged');
  assert.equal(inside(r.baseRegistration),basePath,'Supplemental names the actual accepted base');
  const images=new Map(),coverage=new Map(),measurements=[],excludedSource=[];
  for(const sheet of Object.values(compiled.sheets)){
    const imageBytes=fs.readFileSync(inside(sheet.sourceImage));assert.equal(sha(imageBytes),sheet.sourceSHA256);
    const image=rgba(imageBytes);assert.deepEqual({width:image.width,height:image.height},plain(sheet.dimensions));
    images.set(sheet.id,image);coverage.set(sheet.id,new Uint8Array(image.width*image.height));
  }
  for(const frame of Object.values(compiled.frames)){
    const image=images.get(frame.sheet),crop=frame.source;let ink=0,transparent=0,left=Infinity,top=Infinity,right=-1,bottom=-1;
    for(let y=0;y<crop.height;y++)for(let x=0;x<crop.width;x++){
      const index=(y+crop.y)*image.width+x+crop.x,alpha=image.pixels[index*4+3];
      if(alpha>8){assert(x>0&&y>0&&x<crop.width-1&&y<crop.height-1,'Clipped native cel '+frame.id);
        ink++;coverage.get(frame.sheet)[index]++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
      }else transparent++;
    }
    assert(ink>0&&transparent>0,'Empty or opaque-background cel '+frame.id);
    assert(bottom<=frame.feetPivot.y+2,'Feet anchor above actual ground '+frame.id);
    measurements.push({id:frame.id,sheet:frame.sheet,visibleBounds:{x:left,y:top,width:right-left+1,height:bottom-top+1},
      inkPixels:ink,transparentPixels:transparent,gripAnchor:plain(frame.gripAnchor||null),
      embeddedWeapon:frame.embeddedWeapon||null,shotAnchor:plain(frame.shotAnchor||null),worldScale:260/frame.standingHeight});
  }
  for(const sheet of Object.values(compiled.sheets)){
    const image=images.get(sheet.id),covered=coverage.get(sheet.id),reference=measurements.find(f=>f.id===sheet.referenceFrame&&f.sheet===sheet.id);
    assert(reference);assert(Math.abs(reference.visibleBounds.height-sheet.standingHeight)<=1,'Measured upright scale differs '+sheet.id);
    for(const exclusion of sheet.excludedRegions){let pixels=0;const box=exclusion.source;
      for(let y=box.y;y<box.y+box.height;y++)for(let x=box.x;x<box.x+box.width;x++){
        const i=y*image.width+x;if(image.pixels[i*4+3]>8){pixels++;covered[i]++;}
      }
      excludedSource.push({sheet:sheet.id,...plain(exclusion),visiblePixels:pixels});
    }
    for(let i=0;i<image.width*image.height;i++)if(image.pixels[i*4+3]>8)assert.equal(covered[i],1,'Unregistered/overlapping visible source ink '+sheet.id);
  }
  const reachable=new Set(Object.values(base.clips).flatMap(clip=>clip.frames.map(entry=>entry.frame)));
  for(const id of reachable)assert(compiled.baseGripAnchors[id],'Missing reachable accepted-cel item anchor '+id);
  const baseImages=new Map(),baseAnchorMeasurements=[];
  for(const sheet of Object.values(base.sheets)){
    const imageBytes=fs.readFileSync(inside(sheet.sourceImage));assert.equal(sha(imageBytes),sheet.sourceSHA256,'Unchanged accepted native sheet');
    const image=rgba(imageBytes);assert.deepEqual({width:image.width,height:image.height},plain(sheet.dimensions));baseImages.set(sheet.id,image);
  }
  const anatomy=[];
  for(const sheet of Object.values(compiled.sheets))if(sheet.bodyCalibration){
    const calibration=sheet.bodyCalibration,frame=compiled.frames[sheet.referenceFrame],reference=base.frames[calibration.reference.frame];
    const hasInk=(image,frame,p)=>image.pixels[((frame.source.y+Math.round(p.y))*image.width+frame.source.x+Math.round(p.x))*4+3]>8;
    for(const p of [calibration.nativeSegment.from,calibration.nativeSegment.to])
      assert(hasInk(images.get(sheet.id),frame,p),'Native anatomical landmark has no actual source ink '+sheet.id);
    for(const p of [calibration.reference.segment.from,calibration.reference.segment.to])
      assert(hasInk(baseImages.get(reference.sheet),reference,p),'Accepted anatomical landmark has no original source ink');
    const length=s=>Math.hypot(s.to.x-s.from.x,s.to.y-s.from.y),target=length(calibration.reference.segment)*260/reference.standingHeight;
    const measured=length(calibration.nativeSegment)*260/frame.standingHeight;
    assert(Math.abs(target-measured)<1e-9,'Uniform anatomical world measurement differs from accepted character '+sheet.id);
    assert(Object.values(compiled.frames).filter(f=>f.sheet===sheet.id).every(f=>f.standingHeight===frame.standingHeight),'Every whole cel in one sheet shares its one scalar');
    anatomy.push({sheet:sheet.id,referenceFrame:frame.id,uniformScale:calibration.uniformScale,acceptedWorldHeadSegment:target,calibratedWorldHeadSegment:measured});
  }
  const runningGripMeasurements=[];
  const run=compiled.clips['armed-run'],midpoints=run.frames.map(entry=>(entry.startMs+entry.endMs)/2/run.totalMs);
  const reviewHTML=fs.readFileSync(path.join(source,'mac-equipment-review.html'),'utf8');
  const reviewScript=reviewHTML.match(/<script id="equipment-review">([\s\S]*?)<\/script>/);assert(reviewScript);
  const reviewContext={window:{BARCODE:{MacCombatPreview:{frameArt:new Map([['mac',{supplemental:compiled}]])},
    MacStreetCombat:{create:()=>({getSnapshot:()=>({player:{}})}),weapons:Object.fromEntries(F.weapons.map(kind=>[kind,{name:kind,charges:1}]))}}}};
  vm.createContext(reviewContext);vm.runInContext(reviewScript[1],reviewContext,{filename:'mac-equipment-review.html'});
  const review=reviewContext.window.BARCODE.MacEquipmentReview;
  const runScenes=review.scenes.filter(s=>/^run-\d$/.test(s.id));
  assert.deepEqual(plain(runScenes.map(scene=>review.playerFor('pipe',scene).animation.motion.stridePhase)),plain(midpoints),
    'Actual melee review players must enter all four armed holds');
  const legacyRun=compiled.clips.run,legacyMidpoints=legacyRun.frames.map(entry=>(entry.startMs+entry.endMs)/2/legacyRun.totalMs);
  for(const kind of F.embeddedWeapons)assert.deepEqual(plain(runScenes.map(scene=>review.playerFor(kind,scene).animation.motion.stridePhase)),plain(legacyMidpoints),
    'Native gun/disc review checkpoints retain their unchanged gait timing');
  const inPolygon=(p,polygon)=>{let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
    const a=polygon[i],b=polygon[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }return inside;};
  for(const kind of F.weapons)for(const facing of [-1,1])for(const scene of review.scenes.filter(s=>/^run-\d$/.test(s.id))){
    const actor=review.playerFor(kind,scene,facing),result=F.sample(actor,{player:true,compiled:base,supplemental:compiled});
    if(!F.embeddedWeapons.includes(kind)){
      assert.equal(result.frameId,run.frames[Number(scene.id.at(-1))].frame,'Every melee run cel has an individual grip inspection');
      assert(result.handOcclusion.some(polygon=>inPolygon(result.gripAnchor,polygon)),'Native handle must enter the closed fist polygon '+kind+'/'+result.frameId);
      assert.equal(result.itemLayer,compiled.frames[result.frameId].itemBindings[kind].itemLayer,'Held equipment uses its explicit native per-weapon depth');
      const image=images.get(result.frame.sheet),frame=result.frame,p=result.gripAnchor;
      assert(image.pixels[((frame.source.y+Math.round(p.y))*image.width+frame.source.x+Math.round(p.x))*4+3]>8,'Run grip contacts actual fist ink');
    }else{assert.equal(result.frame.embeddedWeapon,kind);assert.equal(result.gripAnchor,null);}
    runningGripMeasurements.push({kind,facing,scene:scene.id,frameId:result.frameId,gripAnchor:plain(result.gripAnchor),itemLayer:result.itemLayer,weaponAngle:result.weaponAngle});
  }
  for(const [id,anchor] of Object.entries(compiled.baseGripAnchors)){
    const frame=base.frames[id],image=baseImages.get(frame.sheet),x=Math.round(frame.source.x+anchor.gripAnchor.x),y=Math.round(frame.source.y+anchor.gripAnchor.y);
    let nearInk=0;for(let py=Math.max(frame.source.y,y-12);py<Math.min(frame.source.y+frame.source.height,y+13);py++)
      for(let px=Math.max(frame.source.x,x-12);px<Math.min(frame.source.x+frame.source.width,x+13);px++)
        if(image.pixels[(py*image.width+px)*4+3]>8)nearInk++;
    assert(nearInk>0,'Grip anchor has no nearby authored body/hand ink '+id);
    baseAnchorMeasurements.push({id,reachable:reachable.has(id),nativePoint:{x,y},nearbyInkPixels:nearInk});
  }
  assert.equal(r.attachmentSchema,1,'Individual native attachment registration required');
  let individualBindings=0,occlusionPolygons=0;
  for(const [frame,metadata] of [...Object.values(compiled.frames).map(f=>[f,f]),
    ...Object.entries(compiled.baseGripAnchors).map(([id,a])=>[base.frames[id],a])]) {
    if(frame.embeddedWeapon)continue;
    if(frame.sheet==='dyn_carry_low'){
      assert.equal(metadata.itemBindings,undefined,'Exclusive complete support cels never invent weapon bindings');
      assert(metadata.gripAnchor&&metadata.handOcclusion.length===2,'Two native support palms are registered');
      continue;
    }
    const kinds=frame.sheet.startsWith('dyn_armed_')?F.weapons.filter(kind=>!F.embeddedWeapons.includes(kind)):F.weapons;
    assert.deepEqual(Object.keys(metadata.itemBindings).sort(),[...kinds].sort(),'Every native cel records its exact reachable ergonomic bindings '+frame.id);
    for(const kind of kinds) {
      const binding=metadata.itemBindings[kind];individualBindings++;
      assert(binding.itemScale>=.25&&binding.itemScale<=1,'Held-only scale stays bounded');
      assert(binding.gripAnchor&&binding.handOcclusion.length>0);occlusionPolygons+=binding.handOcclusion.length;
      const image=images.get(frame.sheet)||baseImages.get(frame.sheet),cx=Math.round(frame.source.x+binding.gripAnchor.x),cy=Math.round(frame.source.y+binding.gripAnchor.y);
      let ink=0;for(let y=Math.max(frame.source.y,cy-10);y<Math.min(frame.source.y+frame.source.height,cy+11);y++)
        for(let x=Math.max(frame.source.x,cx-10);x<Math.min(frame.source.x+frame.source.width,cx+11);x++)if(image.pixels[(y*image.width+x)*4+3]>8)ink++;
      assert(ink>0,'Individual grip has no native hand/body ink '+frame.id+'/'+kind);
    }
  }
  native.push({registration:path.relative(source,file),registrationSHA256:sha(bytes),sheets:Object.values(compiled.sheets).map(plain),
    frameCount:measurements.length,measurements,excludedSource,baseAnchorCount:Object.keys(compiled.baseGripAnchors).length,
    reachableBaseFrameCount:reachable.size,baseAnchorMeasurements,individualBindings,occlusionPolygons,anatomicalCalibration:anatomy,runningGripMeasurements});
});
if(options.equipment)check('actual native weapons have individual measured trigger/hilt/rim grips and bounded front regions',()=>{
  const file=path.isAbsolute(options.equipment)?options.equipment:inside(options.equipment),bytes=fs.readFileSync(file),r=JSON.parse(bytes);
  assert.equal(r.schema,1);assert.equal(r.attachmentSchema,1);
  const decoded=new Map();for(const sheet of r.sheets){const b=fs.readFileSync(inside(sheet.sourceImage));assert.equal(sha(b),sheet.sourceSHA256);
    const image=rgba(b);assert.deepEqual({width:image.width,height:image.height},sheet.dimensions);decoded.set(sheet.id,image);}
  const measurements=[];
  for(const kind of F.weapons) {
    const cell=r.cells['weapon_'+kind],s=cell.source,g=cell.grip,image=decoded.get(cell.sheet);
    assert(g.x>=0&&g.x<s.width&&g.y>=0&&g.y<s.height);assert(cell.gripMeasurement?.contact);
    assert.deepEqual(cell.gripMeasurement.nativeSheetPoint,{x:s.x+g.x,y:s.y+g.y});
    assert(image.pixels[((s.y+g.y)*image.width+s.x+g.x)*4+3]>8,'Actual item grip must contact native object ink '+kind);
    for(const polygon of cell.itemFrontRegions||[]) {
      assert(polygon.length>=3&&polygon.length<=16);assert(polygon.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=s.width&&p.y>=0&&p.y<=s.height));
      assert(Math.abs(polygon.reduce((sum,p,i)=>{const q=polygon[(i+1)%polygon.length];return sum+p.x*q.y-q.x*p.y;},0))>2);
    }
    if(['scatter-blaster','coil-rifle'].includes(kind)){assert(cell.muzzle.x>g.x,'Native barrel must point forward');assert(cell.itemFrontRegions.length>0);}
    measurements.push({kind,grip:g,contact:cell.gripMeasurement.contact,frontRegions:cell.itemFrontRegions||[],muzzle:cell.muzzle||null});
  }
  native.push({equipmentRegistration:path.relative(source,file),registrationSHA256:sha(bytes),measurements,scaleMeasurements:r.scaleMeasurements});
});
const receipt={status:'passed',scope:'Supplemental complete-character registration and sampling; owner appearance and hosted playtest remain separate',
  moduleSHA256:sha(fs.readFileSync(modulePath)),checkerSHA256:sha(fs.readFileSync(__filename)),
  baseRegistrationSHA256:sha(fs.readFileSync(basePath)),groups:checks.length,checks,
  nativeArtChecked:native.length>0,native,limitations:native.length?['No hosted/FPS/owner visual acceptance claim']:['Native PNG pixels were not audited; authored sampling, production registration selection and adversarial fixtures were checked']};
if(options.out){const destination=path.resolve(options.out);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(receipt,null,2)+'\n');}
console.log('PASS '+checks.length+' dynamic whole-frame groups; native registrations checked: '+native.length);
