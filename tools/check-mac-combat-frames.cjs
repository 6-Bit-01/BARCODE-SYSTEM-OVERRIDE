#!/usr/bin/env node
// Focused authored-cel playback checks. Optional --manifest / --registration
// measures real PNG bytes; fixture checks alone are not native-art approval.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const vm=require('node:vm'),crypto=require('node:crypto'),zlib=require('node:zlib');
const args=process.argv.slice(2),source=path.resolve(args[0]&&!args[0].startsWith('--')?args.shift():path.join(__dirname,'..'));
const options={};
while(args.length){const arg=args.shift(),match=/^--(manifest|registration|out)(?:=(.*))?$/.exec(arg);
  assert(match,'Unknown argument '+arg);options[match[1]]=match[2]||args.shift();assert(options[match[1]],'Missing argument '+arg);}
const moduleFile=path.join(source,'src/game/mac-combat-frames.js'),coreFile=path.join(source,'src/game/mac-street-combat.js');
const code=fs.readFileSync(moduleFile,'utf8'),forbidden=()=>{throw Error('Playback created an owner');};
const context={window:{BARCODE:{}},setTimeout:forbidden,setInterval:forbidden,requestAnimationFrame:forbidden,
  fetch:forbidden,Image:forbidden,Audio:forbidden,document:{createElement:forbidden,addEventListener:forbidden},
  localStorage:{setItem:forbidden},performance:{now:forbidden}};
vm.runInNewContext(code,context,{filename:moduleFile});
vm.runInNewContext(fs.readFileSync(coreFile,'utf8'),context,{filename:coreFile});
const F=context.window.BARCODE.MacCombatFrames,C=context.window.BARCODE.MacStreetCombat;
const plain=value=>JSON.parse(JSON.stringify(value)),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const groups=[],native=[];
function check(name,body){body();groups.push(name);console.log('PASS '+name);}
function registration(kind='mac',multiple=false){
  const frames=[],clips={},ids=new Set(),counts={basic:0,advanced:0};
  const cel=id=>{if(ids.has(id))return id;ids.add(id);const sheet=multiple&&frames.length%2?'advanced':'basic',index=counts[sheet]++;
    frames.push({id,sheet,source:{x:index*64,y:0,width:64,height:128},feetPivot:{x:32,y:124}});return id;};
  const clip=(key,list,loop=false)=>{clips[key]={loop,frames:list.map(([id,holdMs])=>({frame:cel(id),holdMs}))};};
  clip('idle',[['idle_a',280],['idle_b',280]],true);
  clip('walk',[['walk_contact_a',kind==='mac'?110:100],['walk_pass_a',kind==='mac'?90:100],['walk_contact_b',kind==='mac'?110:100],['walk_pass_b',kind==='mac'?90:100]],true);
  clip('hurt',[['hurt',220]]);clip('defeat',[['fall',120],['down',480]]);
  if(kind==='mac'){
    clip('guard',[['guard',200]]);clip('jump-rise',[['jump_takeoff',80],['jump_rise',120]]);clip('jump-fall',[['jump_fall',120],['jump_descent',80]]);
    clip('throw',[['throw_grab',90],['throw_brace',50],['throw_release',140],['idle_a',140]]);
  }
  for(const move of kind==='mac'?F.moves:F.styles[kind]){
    clip(move+'.windup',[['idle_a',20],[move+'_windup',80]]);
    const delay={'rift-cross':.5,'retreat-slash':.55,'mantid-leap':.65,'lancer-sweep':55/190,'shield-heavy':100/240}[move]||0;
    clip(move+'.active',delay?[[move+'_windup',delay*100],[move+'_contact',(1-delay)*100]]:[[move+'_contact',100]]);
    clip(move+'.recovery',[[move+'_windup',45],['idle_a',55]]);
  }
  if(kind==='mac')clip('landing',[['jump_landing',100]]);
  const sheets=Object.entries(counts).filter(([,count])=>count).map(([id,count])=>({id,sourceImage:'assets/test/'+kind+'-'+id+'.png',
    sourceSHA256:'f'.repeat(64),dimensions:{width:count*64,height:128}}));
  const r={schemaVersion:1,actor:kind,facing:'right',pixelScale:{standingVisibleHeight:100},frames,clips};
  if(multiple)r.sheets=sheets;else{Object.assign(r,sheets[0]);delete r.id;for(const frame of frames)delete frame.sheet;}
  return r;
}
const macRegistration=registration('mac',true),mac=F.compile(macRegistration,{complete:true});
const player=(extra={})=>({hp:100,mode:'idle',facing:1,elevation:0,velocityZ:0,
  animation:{action:'idle',ageMs:0,motion:{stridePhase:0}},...extra});
const pose=(actor,compiled=mac,extra={})=>F.sample(actor,{compiled,player:compiled.actor==='mac',...extra});
function draw(p,compiled=mac,facing=1){
  const calls=[],images=new Map(compiled.sheetIds.map(id=>[id,{id,naturalWidth:compiled.sheets[id].dimensions.width,naturalHeight:compiled.sheets[id].dimensions.height}]));
  const ctx={globalAlpha:.41,save(){calls.push(['save']);this.saved=this.globalAlpha;},restore(){calls.push(['restore']);this.globalAlpha=this.saved;},
    translate(...a){calls.push(['translate',...a]);},scale(...a){calls.push(['scale',...a]);},rotate(){assert.fail('Whole cels must not rotate');},
    drawImage(...a){calls.push(['drawImage',...a]);}};
  const result=F.draw(ctx,{compiled,images},p,500,880,260,facing,.86);
  assert.equal(ctx.globalAlpha,.41);return {calls,result,images};
}
check('exact eight roles expose six Mac moves, two enemy tactics and four boss attacks',()=>{
  assert.equal(F.moves.length,6);assert.equal(Object.keys(F.styles).length,7);
  for(const kind of ['mac',...Object.keys(F.styles)]){
    const compiled=F.compile(registration(kind),{complete:true});assert.equal(compiled.actor,kind);
    for(const key of F.requiredClips(kind))assert(compiled.clips[key]);
  }
  assert.throws(()=>F.requiredClips('level1-zombie'),/unknown actor/);
});
check('missing committed actions and malformed crops, pivots, holds and sheets fail explicitly',()=>{
  const bad=edit=>{const r=plain(macRegistration);edit(r);assert.throws(()=>F.compile(r,{complete:true}),/Whole-character frames/);};
  bad(r=>delete r.clips['counter.active']);bad(r=>r.frames[0].source.width=999999);
  bad(r=>delete r.clips.landing);bad(r=>r.clips.landing.loop=true);bad(r=>r.clips.landing.frames[0].holdMs=101);
  bad(r=>r.frames[0].source.x=.5);bad(r=>r.frames[0].feetPivot.y=NaN);
  bad(r=>r.frames[0].baselineLift=Infinity);bad(r=>r.frames[0].baselineLift='high');
  bad(r=>{r.frames[1].sheet=r.frames[0].sheet;Object.assign(r.frames[1].source,r.frames[0].source);});
  bad(r=>delete r.frames[0].sheet);bad(r=>r.clips['jab.active'].frames[0].frame='missing');
  bad(r=>r.clips.walk.frames[0].holdMs=0);bad(r=>r.clips.hurt.loop=true);
  bad(r=>r.sheets[0].sourceSHA256='unverified');bad(r=>r.clips.throw.frames[0].holdMs=91);
  bad(r=>r.sheets[0].standingVisibleHeight=0);
  assert.throws(()=>pose(player({attack:{kind:'nonexistent',phase:'active',phaseProgress:0}})),/invalid committed/);
});
check('one full-body draw uses the exact basic/advanced sheet, a common scale and feet pivot',()=>{
  const samples=[pose(player()),pose(player({attack:{kind:'cross',phase:'windup',phaseProgress:.3}}))];
  assert.equal(new Set(samples.map(p=>p.frame.sheet)).size,2);
  for(const p of samples)for(const facing of [-1,1]){
    const {calls,result}=draw(p,mac,facing),paint=calls.filter(call=>call[0]==='drawImage');
    assert.equal(paint.length,1);assert.equal(paint[0][1].id,p.frame.sheet);assert.equal(result.scale,2.6);
    assert.deepEqual(calls.find(call=>call[0]==='scale'),['scale',facing,1]);
    assert.equal(paint[0][6],-p.frame.feetPivot.x*2.6);assert.equal(paint[0][7],-p.frame.feetPivot.y*2.6);
    assert.equal(paint[0][8],p.frame.source.width*2.6);assert.equal(paint[0][9],p.frame.source.height*2.6);
  }
  const p=samples[1];assert.throws(()=>F.draw({},{compiled:mac,images:{}},p,1,1),/missing exact sheet/);
  assert.throws(()=>F.draw({},{compiled:mac,images:{}},p,NaN,1),/non-finite/);
});
check('single-sheet legacy pivot alias is explicit and decoded image identity is checked',()=>{
  const r=registration();for(const f of r.frames){f.pivot=f.feetPivot;delete f.feetPivot;}
  const compiled=F.compile(r,{complete:true}),p=pose(player(),compiled),calls=[];
  const ctx={save(){},restore(){},translate(){},scale(){},drawImage(...v){calls.push(v);}};
  F.draw(ctx,{compiled,image:{naturalWidth:r.dimensions.width,naturalHeight:r.dimensions.height}},p,0,0);
  assert.equal(calls.length,1);
  assert.throws(()=>F.draw(ctx,{compiled,image:{naturalWidth:1,naturalHeight:1}},p,0,0),/dimensions differ/);
});
check('different sheet density uses one uniform sheet scale without normalizing individual poses',()=>{
  const r=plain(macRegistration);r.sheets[0].pixelScale={standingVisibleHeight:100};r.sheets[1].standingVisibleHeight=125;
  const compiled=F.compile(r,{complete:true}),basic=pose(player(),compiled),advanced=pose(player({attack:{kind:'cross',phase:'windup',phaseProgress:.3}}),compiled);
  assert.equal(draw(basic,compiled).result.scale,2.6);assert.equal(draw(advanced,compiled).result.scale,2.08);
  for(const frame of Object.values(compiled.frames).filter(f=>f.sheet==='advanced'))assert.equal(frame.standingHeight,125);
});
check('finite per-cel baseline lift translates the complete body uniformly at actual height',()=>{
  const r=plain(macRegistration);r.frames.find(f=>f.id==='jump_rise').baselineLift=48.5;
  const compiled=F.compile(r,{complete:true}),p=pose(player({elevation:80,velocityZ:100}),compiled);
  assert.equal(p.frameId,'jump_rise');
  const {calls,result}=draw(p,compiled);assert.deepEqual(calls.find(c=>c[0]==='translate'),['translate',500,831.5]);
  assert.equal(result.baselineLift,48.5);assert.equal(calls.filter(c=>c[0]==='drawImage').length,1);
  const ctx={save(){},restore(){},scale(){},drawImage(){},translate(x,y){assert.equal(y,880-48.5*335/260);}};
  const images=new Map(compiled.sheetIds.map(id=>[id,{naturalWidth:compiled.sheets[id].dimensions.width,naturalHeight:compiled.sheets[id].dimensions.height}]));
  F.draw(ctx,{compiled,images},p,500,880,335,-1);
});
check('authored holds are discrete, gait follows simulation distance and pause needs no hidden clock',()=>{
  const a=player({animation:{action:'idle',ageMs:100,motion:{stridePhase:0}}}),before=JSON.stringify(a);
  assert.equal(pose(a).frameId,'idle_a');assert.equal(pose(a).frameId,pose(a).frameId);assert.equal(JSON.stringify(a),before);
  a.animation.ageMs=279.999;assert.equal(pose(a).frameId,'idle_a');a.animation.ageMs=280;assert.equal(pose(a).frameId,'idle_b');
  assert.equal(pose(a,mac,{reducedMotion:true}).frameId,'idle_a');
  const actual=[];for(const phase of [0,.274,.275,.499,.5,.774,.775,.999,1])actual.push(pose(player({animation:{action:'walk',ageMs:9999,motion:{stridePhase:phase}}})).frameId);
  assert.deepEqual(actual,['walk_contact_a','walk_contact_a','walk_pass_a','walk_pass_a','walk_contact_b','walk_contact_b','walk_pass_b','walk_pass_b','walk_contact_a']);
});
check('actual jump velocity advances takeoff, chamber, fall and descent despite stale action age',()=>{
  const r=rig();r.step({jump:{pressed:true,held:true}});const samples=[],seen=new Set();
  for(let i=0;i<100;i++){
    const s=r.view(),p=s.player;if(p.elevation===0&&p.velocityZ===0)break;
    const stale={...p,animation:{...p.animation,ageMs:999999}},cel=pose(stale);seen.add(cel.frameId);
    const expected=p.velocityZ>0?1-p.velocityZ/C.constants.jumpSpeed:-p.velocityZ/C.constants.jumpSpeed;
    assert.equal(cel.phaseProgress,Math.max(0,Math.min(1,expected)));samples.push(cel);r.step();
  }
  assert.deepEqual([...seen],['jump_takeoff','jump_rise','jump_fall','jump_descent']);assert(samples.length>70);
  assert.equal(pose(r.view().player).clipKey,'idle');
});
check('actual land receipt holds the landing cel for 100ms without overriding committed actions',()=>{
  const r=rig();r.step({jump:{pressed:true,held:true}});let landedAt;
  for(let i=0;i<100&&landedAt===undefined;i++){r.step();const event=r.game.drainEvents().find(e=>e.type==='land');if(event)landedAt=event.atMs;}
  assert(Number.isFinite(landedAt));const p=r.view().player,before=JSON.stringify(p);
  assert.equal(p.elevation,0);assert.equal(p.velocityZ,0);
  for(const age of [0,99.999])assert.equal(pose(p,mac,{landingAgeMs:age}).frameId,'jump_landing');
  assert.equal(pose(p,mac,{landingAgeMs:100}).clipKey,'idle');
  assert.equal(pose(p,mac,{landingAgeMs:-1}).clipKey,'idle');
  assert.equal(pose({...p,hurtMs:1},mac,{landingAgeMs:0}).clipKey,'hurt');
  assert.equal(pose({...p,attack:{kind:'jab',phase:'active',phaseProgress:0}},mac,{landingAgeMs:0}).clipKey,'jab.active');
  assert.equal(pose({...p,grapple:{elapsedMs:0},throwMs:420},mac,{landingAgeMs:0}).clipKey,'throw');
  assert.equal(pose({...p,elevation:1,velocityZ:560},mac,{landingAgeMs:0}).clipKey,'jump-rise');
  assert.equal(pose({...p,hp:0},mac,{landingAgeMs:0,stateAgeMs:0}).clipKey,'defeat');
  assert.equal(JSON.stringify(p),before);assert.equal(pose(p,mac,{landingAgeMs:10}).frameId,pose(p,mac,{landingAgeMs:10}).frameId);
});
function rig(){const game=C.create(),dt=C.constants.stepMs;
  return {game,dt,step(input={}){return game.update(dt,input);},view(){return game.getSnapshot();},
    until(pred,input={},limit=1800){for(let i=0;i<limit;i++){const s=game.getSnapshot();if(pred(s))return s;game.update(dt,typeof input==='function'?input(s):input);}assert.fail('Bounded natural-input setup timed out');}};}
function actionPhases(r,kind){
  const expected=C.strikes.find(rule=>rule.kind===kind)||C.attacks[kind],seen=new Set();
  for(let i=0;i<100;i++){
    const s=r.view(),a=s.player.attack;if(!a)break;
    assert.equal(a.kind,kind);assert.deepEqual(plain(a.timing),{windupMs:expected.windupMs,activeMs:expected.activeMs,recoveryMs:expected.recoveryMs});
    const p=pose(s.player);seen.add(a.phase);assert.equal(p.committedKey,kind+'.'+a.phase);
    if(a.phase==='active')assert.equal(p.frameId,kind+'_contact');
    draw(p);r.step();
  }
  assert.deepEqual([...seen],['windup','active','recovery']);
}
check('actual public-input jab/cross/finisher timing retains every contact and recovery window',()=>{
  const r=rig();for(const kind of ['jab','cross','finisher']){r.step({strike:{pressed:true,held:true}});actionPhases(r,kind);}
});
check('actual moving strike, aerial kick and earned guard-counter select distinct committed cels',()=>{
  let r=rig();r.step({move_x:1,strike:{pressed:true,held:true}});actionPhases(r,'step-strike');
  r=rig();r.step({jump:{pressed:true,held:true}});r.step({strike:{pressed:true,held:true}});actionPhases(r,'air-kick');
  r=rig();r.until(s=>s.enemies[0].phase==='windup',{move_x:1});
  r.until(s=>s.enemies[0].attackTell?.remainingMs<=80);r.step({guard:{held:true}});
  r.until(s=>s.player.counterMs>0,{guard:{held:true}});
  r.step({strike:{pressed:true,held:true}});actionPhases(r,'counter');
});
check('actual throw release at 140ms, recovery at 280ms and 420ms commitment use authored holds',()=>{
  const r=rig();r.until(()=>r.game.getControlState().throw.ready,{move_x:1});r.step({throw:{pressed:true,held:true}});
  let beforeRelease=false,released=false,recovery=false;
  for(let i=0;i<65;i++){
    const s=r.view(),g=s.player.grapple;if(!g)break;const p=pose(s.player);
    assert.equal(p.committedKey,'throw');
    if(!g.released){beforeRelease=true;assert(g.elapsedMs<140);assert.notEqual(p.frameId,'throw_release');}
    else if(g.elapsedMs+1e-7<280){released=true;assert.equal(p.frameId,'throw_release');}
    else{recovery=true;assert.equal(p.frameId,'idle_a');}r.step();
  }
  assert(beforeRelease&&released&&recovery);assert.equal(r.view().player.grapple,null);
});
check('each enemy tactic has a distinct authored preparation/contact sequence and honest delayed contact',()=>{
  for(const [kind,moves] of Object.entries(F.styles)){
    const compiled=F.compile(registration(kind),{complete:true}),signatures=[];
    for(const move of moves){
      const snapshots=['windup','active','recovery'].map(phase=>({kind,hp:100,facing:-1,phase,
        animation:{action:phase==='windup'?'tell':phase==='active'?'attack':'recover',pose:move,phaseProgress:.8,ageMs:80}}));
      const samples=snapshots.map(s=>pose(s,compiled));signatures.push(samples.map(p=>p.frameId).join('|'));
      for(let i=0;i<3;i++){assert.equal(samples[i].committedKey,move+'.'+snapshots[i].phase);draw(samples[i],compiled,-1);}
      const delay={'rift-cross':.5,'retreat-slash':.55,'mantid-leap':.65,'lancer-sweep':55/190,'shield-heavy':100/240}[move];
      if(delay){const s=snapshots[1];s.animation.phaseProgress=delay-.000001;assert.equal(pose(s,compiled).frameId,move+'_windup');
        s.animation.phaseProgress=delay+.000001;assert.equal(pose(s,compiled).frameId,move+'_contact');}
      if(delay){const activeMs={'lancer-sweep':190,'shield-heavy':240,'rift-cross':360,'retreat-slash':380,'mantid-leap':500}[move];
        const s={kind,hp:100,phase:'active',phaseMs:delay*activeMs-.00001,attackSpec:{attackType:move,activeMs},animation:{pose:move,phaseProgress:1}};
        assert.equal(pose(s,compiled).frameId,move+'_windup');s.phaseMs+=.00002;assert.equal(pose(s,compiled).frameId,move+'_contact');}
    }
    assert.equal(new Set(signatures).size,moves.length);
  }
});
check('hurt, defeat and jump retain whole cels, with an explicit death clock and finite boss placement',()=>{
  assert.equal(pose(player({hurtMs:10,animation:{action:'hurt',ageMs:10}})).frameId,'hurt');
  assert.equal(pose(player({elevation:30,velocityZ:120})).frameId,'jump_rise');
  assert.equal(pose(player({elevation:30,velocityZ:-120})).frameId,'jump_fall');
  const dead=player({hp:0,animation:{action:'defeated',ageMs:0}});
  assert.equal(pose(dead).frameId,'down');assert.equal(pose(dead,mac,{stateAgeMs:10}).frameId,'fall');
  assert.equal(pose(dead,mac,{stateAgeMs:120}).frameId,'down');
  const compiled=F.compile(registration('null_regent'),{complete:true}),p=pose({kind:'null_regent',hp:0,phase:'defeated',animation:{action:'defeat',ageMs:1000}},compiled);
  const ctx={save(){},restore(){},translate(){},scale(){},drawImage(...values){assert(values.slice(1).every(Number.isFinite));}};
  F.draw(ctx,{compiled,image:{naturalWidth:compiled.sheets.basic?.dimensions.width||compiled.sheets.main.dimensions.width,
    naturalHeight:128}},p,1,1,335,-1);assert.equal(p.frameId,'down');
});
check('sampling is defensive and preserves the core snapshot, blood, movement and ownership',()=>{
  const r=rig(),s=r.step(),copy=JSON.stringify(s),p=pose(s.player);draw(p);
  assert.equal(JSON.stringify(s),copy);assert.equal(s.player.bloodHex,'#f04455');
  assert(s.enemies.every(e=>['#78ea68','#b374ed'].includes(e.bloodHex)));
  assert.throws(()=>pose({...s.enemies[0],kind:'prism_guard'},F.compile(registration('chitin_scuttler'))),/identity differ/);
  assert(!/\b(?:requestAnimationFrame|setTimeout|setInterval|fetch|localStorage|document|AudioContext|performance)\s*(?:\.|\()/m.test(code));
});

function nativePng(bytes){
  assert(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'Not a native PNG');
  let offset=8,width,height,depth,type,interlace,idat=[];
  while(offset<bytes.length){const length=bytes.readUInt32BE(offset),tag=bytes.toString('ascii',offset+4,offset+8),body=bytes.subarray(offset+8,offset+8+length);
    assert(body.length===length,'Truncated PNG chunk');if(tag==='IHDR'){width=body.readUInt32BE(0);height=body.readUInt32BE(4);depth=body[8];type=body[9];interlace=body[12];}
    if(tag==='IDAT')idat.push(body);offset+=length+12;if(tag==='IEND')break;}
  assert(depth===8&&type===6&&interlace===0,'Native transparency checker needs non-interlaced RGBA8 PNG');
  const stride=width*4,data=zlib.inflateSync(Buffer.concat(idat));assert.equal(data.length,(stride+1)*height);
  const pixels=Buffer.alloc(stride*height),paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){const filter=data[y*(stride+1)];assert(filter<=4,'Invalid PNG row filter');for(let x=0;x<stride;x++){
    const a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
    pixels[y*stride+x]=(data[y*(stride+1)+x+1]+([0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter]))&255;
  }}return {width,height,pixels};
}
check('native alpha reader reconstructs an independently specified PNG including transparent pixels',()=>{
  const chunk=(tag,body)=>{const name=Buffer.from(tag),length=Buffer.alloc(4),crcBytes=Buffer.alloc(4);length.writeUInt32BE(body.length);
    let crc=0xffffffff;for(const byte of Buffer.concat([name,body])){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
    crcBytes.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([length,name,body,crcBytes]);};
  const header=Buffer.alloc(13);header.writeUInt32BE(2,0);header.writeUInt32BE(2,4);header[8]=8;header[9]=6;
  // Manually authored Sub/Up rows; the expected RGBA pixels do not use decoder math.
  const rows=Buffer.from([1,255,0,0,255,1,255,0,1,2,1,0,255,0,25,51,75,128]);
  const bytes=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
  const decoded=nativePng(bytes);assert.deepEqual({width:decoded.width,height:decoded.height},{width:2,height:2});
  assert.deepEqual([...decoded.pixels],[255,0,0,255,0,255,0,0,0,0,255,255,25,50,75,128]);
});
function inside(file){const resolved=path.resolve(source,file),relative=path.relative(source,resolved);
  assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Native asset must stay inside source');return resolved;}
function inspectNative(registrationPath,complete){
  const file=path.isAbsolute(registrationPath)?registrationPath:inside(registrationPath),r=JSON.parse(fs.readFileSync(file,'utf8')),compiled=F.compile(r,{complete});
  const decoded=new Map(),coverage=new Map(),measurements=[],nativeCoverage=[];
  for(const sheet of Object.values(compiled.sheets)){const bytes=fs.readFileSync(inside(sheet.sourceImage));assert.equal(sha(bytes),sheet.sourceSHA256,'Actual native image hash');
    const png=nativePng(bytes);assert.deepEqual({width:png.width,height:png.height},plain(sheet.dimensions));decoded.set(sheet.id,png);coverage.set(sheet.id,new Uint8Array(png.width*png.height));}
  for(const frame of Object.values(compiled.frames)){
    const png=decoded.get(frame.sheet),s=frame.source;let occupied=0,transparent=0,left=Infinity,top=Infinity,right=-1,bottom=-1,edgeAlpha=false;
    for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){const a=png.pixels[((y+s.y)*png.width+x+s.x)*4+3];
      if(a>8){coverage.get(frame.sheet)[(y+s.y)*png.width+x+s.x]++;occupied++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);if(x===0||y===0||x===s.width-1||y===s.height-1)edgeAlpha=true;}else transparent++;}
    assert(occupied>0,'Empty authored cel '+frame.id);assert(transparent>0,'Opaque background in cel '+frame.id);
    assert(!edgeAlpha,'Visible ink touches native crop edge '+frame.id);
    assert(bottom<=frame.feetPivot.y+2,'Ink extends below registered ground anchor '+frame.id);
    measurements.push({frameId:frame.id,sheet:frame.sheet,occupiedPixels:occupied,transparentPixels:transparent,
      actualVisibleBounds:{x:left,y:top,width:right-left+1,height:bottom-top+1},feetPivot:plain(frame.feetPivot),baselineLift:frame.baselineLift,edgeAlpha});
  }
  for(const sheet of Object.values(compiled.sheets)){
    const png=decoded.get(sheet.id),covered=coverage.get(sheet.id);let visiblePixels=0,coveredOnce=0;
    for(let index=0;index<png.width*png.height;index++)if(png.pixels[index*4+3]>8){
      visiblePixels++;if(covered[index]===1)coveredOnce++;
      if(complete)assert.equal(covered[index],1,'Native visible ink must occur in exactly one registered crop: '+sheet.id+' at '+index%png.width+','+Math.floor(index/png.width));
    }
    nativeCoverage.push({sheet:sheet.id,visiblePixels,coveredOnce,allVisibleCoveredExactlyOnce:visiblePixels===coveredOnce});
    const referenceId=sheet.referenceFrame||r.pixelScale.referenceFrame||compiled.clips.idle?.frames[0].frame;
    const reference=measurements.find(m=>m.frameId===referenceId&&m.sheet===sheet.id);
    assert(reference,'Missing measured standing reference cel on sheet '+sheet.id);
    assert(Math.abs(reference.actualVisibleBounds.height-sheet.standingHeight)<=1,'Actual standing height differs from uniform sheet scale '+sheet.id);
  }
  const record={actor:r.actor,registrationPath:path.relative(source,file),registrationSHA256:sha(fs.readFileSync(file)),complete,
    sheetCount:decoded.size,frameCount:measurements.length,measurements,nativeCoverage,warning:'Native crop/hash/scale checks do not establish likeness or visual animation acceptance.'};
  native.push(record);return {r,compiled,record};
}
if(options.registration)check('supplied prototype registration uses verified native whole-character PNG cels',()=>inspectNative(options.registration,false));
if(options.manifest)check('exact eight-actor authored bank has complete committed clips and verified native cels',()=>{
  const file=path.isAbsolute(options.manifest)?options.manifest:inside(options.manifest),bank=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(bank.schemaVersion,1);assert(Array.isArray(bank.actors));assert.equal(bank.actors.length,8);
  assert.deepEqual(bank.actors.map(a=>a.kind).sort(),['mac',...Object.keys(F.styles)].sort());
  for(const actor of bank.actors){const registrationFile=actor.registration;assert(typeof registrationFile==='string','Actor registration path');
    const {r,compiled}=inspectNative(registrationFile,true);assert.equal(r.actor,actor.kind);
    assert.equal(actor.registrationSHA256,sha(fs.readFileSync(inside(registrationFile))),'Exact registration hash');
    const moves=actor.kind==='mac'?F.moves:F.styles[actor.kind];
    const signatures=moves.map(move=>['windup','active','recovery'].map(phase=>compiled.clips[move+'.'+phase].frames.map(entry=>entry.frame).join(',')).join('|'));
    assert.equal(new Set(signatures).size,moves.length,'Distinct authored fighting style sequences');
  }
});
const receipt={status:'passed',scope:'Focused whole-character playback/registration; no full game or visual acceptance claim',
  source,moduleSHA256:sha(fs.readFileSync(moduleFile)),groups:groups.length,checks:groups,nativeArtChecked:native.length>0,native,
  limitations:native.length?['Owner visual acceptance is separate','No hosted/FPS/full-route check performed']:['Native art was not supplied; only playback and adversarial registration fixtures checked'],
  wroteReceipt:!!options.out};
if(options.out){const out=path.resolve(options.out);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(receipt,null,2)+'\n');}
console.log(`PASS ${groups.length} focused whole-frame groups; native actors checked: ${native.length}`);
