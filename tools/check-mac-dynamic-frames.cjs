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
  const clip=(frames,loop=false)=>({loop,frames:frames.map(frame=>({frame,holdMs:100}))});
  return {schemaVersion:1,actor:'mac',facing:'right',pixelScale:{standingVisibleHeight:70,referenceFrame:'guard_stand'},
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
}
const registration=fixture(),supplemental=F.compileSupplemental(registration,{baseCompiled:base});
const actor=(action,extra={})=>({hp:100,facing:1,animation:{action,ageMs:0,motion:{speed:0,stridePhase:0}},...extra});
const pose=(value,extra={})=>F.sample(value,{player:true,compiled:base,supplemental,...extra});
check('supplemental compile preserves the original accepted Mac registration and clips',()=>{
  assert.equal(base.complete,true);assert.equal(supplemental.supplemental,true);
  assert.equal(Object.keys(supplemental.frames).length,19);assert.equal(base.clips.throw.totalMs,420);
  assert.equal(base.frames.idle_a.sourceImage,'assets/mac-combat-frames/mac-basic-v2.png');
  assert.equal(base.frames.chamber.gripAnchor,undefined);assert.equal(base.sheets.dyn_test,undefined);
});
check('actual movement stride selects four distinct whole run cels and two guarded creep contacts',()=>{
  assert.deepEqual([0,.26,.51,.76].map(stridePhase=>pose(actor('run',{animation:{action:'run',motion:{speed:180,stridePhase}}})).frameId),
    ['run_a','run_b','run_c','run_d']);
  assert.deepEqual([.1,.6].map(stridePhase=>pose(actor('guard-creep',{animation:{action:'guard-creep',motion:{speed:40,stridePhase}}})).frameId),['guard_a','guard_b']);
  assert.equal(pose(actor('guard')).frameId,'guard_stand');
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
check('carry uses support cels; firearm idle uses authored two-hand ready while locomotion retains accepted cels',()=>{
  assert.equal(pose(actor('carry',{carry:{kind:'crate',elapsedMs:9000}})).frameId,'carry_hold');
  assert.equal(pose(actor('carry',{animation:{action:'carry',motion:{speed:65,stridePhase:.6}},carry:{kind:'crate'}})).frameId,'carry_b');
  assert.equal(pose(actor('idle',{weapon:{kind:'coil-rifle'}})).frameId,'fire_aim');
  assert.equal(pose(actor('idle',{weapon:{kind:'pipe'}})).frameId,'idle_a');
  assert.equal(pose(actor('walk',{animation:{action:'walk',motion:{speed:80,stridePhase:.1}},weapon:{kind:'pipe'}})).supplemental,false);
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
      embeddedWeapon:frame.embeddedWeapon||null,worldScale:260/frame.standingHeight});
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
    assert.deepEqual(Object.keys(metadata.itemBindings).sort(),[...F.weapons].sort(),'Every native cel records all eight ergonomic bindings '+frame.id);
    for(const kind of F.weapons) {
      const binding=metadata.itemBindings[kind];individualBindings++;
      assert(binding.gripAnchor&&binding.handOcclusion.length>0);occlusionPolygons+=binding.handOcclusion.length;
      const image=images.get(frame.sheet)||baseImages.get(frame.sheet),cx=Math.round(frame.source.x+binding.gripAnchor.x),cy=Math.round(frame.source.y+binding.gripAnchor.y);
      let ink=0;for(let y=Math.max(frame.source.y,cy-10);y<Math.min(frame.source.y+frame.source.height,cy+11);y++)
        for(let x=Math.max(frame.source.x,cx-10);x<Math.min(frame.source.x+frame.source.width,cx+11);x++)if(image.pixels[(y*image.width+x)*4+3]>8)ink++;
      assert(ink>0,'Individual grip has no native hand/body ink '+frame.id+'/'+kind);
    }
  }
  native.push({registration:path.relative(source,file),registrationSHA256:sha(bytes),sheets:Object.values(compiled.sheets).map(plain),
    frameCount:measurements.length,measurements,excludedSource,baseAnchorCount:Object.keys(compiled.baseGripAnchors).length,
    reachableBaseFrameCount:reachable.size,baseAnchorMeasurements,individualBindings,occlusionPolygons});
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
  nativeArtChecked:native.length>0,native,limitations:native.length?['No hosted/FPS/owner visual acceptance claim']:['Native supplemental art was not supplied; only authored sampling and adversarial registration fixtures checked']};
if(options.out){const destination=path.resolve(options.out);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(receipt,null,2)+'\n');}
console.log('PASS '+checks.length+' dynamic whole-frame groups; native registrations checked: '+native.length);
