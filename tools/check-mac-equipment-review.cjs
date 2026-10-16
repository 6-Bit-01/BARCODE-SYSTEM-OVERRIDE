#!/usr/bin/env node
'use strict';
// Execute the actual review DOM handlers, preparation, sampler and painter.
// Host DOM, image decoding and Canvas pixels are stubs; visual acceptance is separate.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto,createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..'),sha=data=>createHash('sha256').update(data).digest('hex');
const inputs=['mac-equipment-review.html','src/game/mac-street-combat.js','src/game/mac-combat-frames.js',
  'src/game/mac-combat-preview.js','assets/mac-combat-frames/mac-combat-frames-v1.json',
  'assets/mac-street-dynamic/mac-modem-actions-v1.json','assets/mac-street-power/mac-street-power-v1.json','tools/check-mac-equipment-review.cjs'];
const identities=()=>Object.fromEntries(inputs.map(name=>[name,sha(fs.readFileSync(path.join(root,name)))]));
const before=identities(),started=performance.now(),html=fs.readFileSync(path.join(root,inputs[0]),'utf8');
const script=html.match(/<script id="equipment-review">([\s\S]*?)<\/script>/);assert(script);
let now=1000,next=0,maxOwners=0;const scheduled=new Map(),painted=[];
class Element {
  constructor(tag,id){this.tagName=tag;this.id=id;this.children=[];this.listeners=new Map();this.attributes={};this.disabled=false;this.width=840;this.height=480;}
  append(...children){for(const child of children){child.parent=this;this.children.push(child);if(this.tagName==='select'&&this._value===undefined)this._value=child.value;}}
  get value(){return this._value??'';}set value(v){this._value=v;}
  get options(){return this.children;}setAttribute(k,v){this.attributes[k]=String(v);}
  addEventListener(type,callback){this.listeners.set(type,[...(this.listeners.get(type)||[]),callback]);}
  dispatch(type){for(const callback of this.listeners.get(type)||[])callback({type,target:this});}
  click(){if(!this.disabled)this.dispatch('click');}
  remove(){this.parent.children=this.parent.children.filter(child=>child!==this);}
  getContext(){return this.ctx??=new Proxy({canvas:this,drawImage(){},save(){},restore(){},translate(){},scale(){},rotate(){},
    beginPath(){},moveTo(){},lineTo(){},closePath(){},clip(){},fillRect(){},stroke(){},measureText:()=>({width:100})},
    {get:(object,key)=>key in object?object[key]:()=>{}});}
}
const ids=new Map();
for(const [id,tag]of Object.entries({'equipment-grid':'div',pose:'select',prop:'select',placement:'select',
  'action-weapon':'select','action-type':'select','swing-toggle':'button','swing-left':'canvas','swing-right':'canvas',scenery:'canvas',status:'p'}))ids.set(id,new Element(tag,id));
for(const id of ['placement','action-weapon','action-type']){
  const block=html.match(new RegExp('<select id="'+id+'">([\\s\\S]*?)<\\/select>'));assert(block);
  for(const match of block[1].matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)){const option=new Element('option');option.value=match[1];option.textContent=match[2];ids.get(id).append(option);}
}
ids.get('swing-toggle').disabled=true;
const document={getElementById:id=>ids.get(id),createElement:tag=>new Element(tag)};
const raf=callback=>{const id=++next;scheduled.set(id,callback);maxOwners=Math.max(maxOwners,scheduled.size);return id;};
function step(ms,frameTimestamp){now+=ms;const queue=[...scheduled.values()];scheduled.clear();queue.forEach(callback=>callback(frameTimestamp??now));assert(scheduled.size<=1,'A second review RAF owner was created');}
const context={console,document,performance:{now:()=>now},requestAnimationFrame:raf,cancelAnimationFrame:id=>scheduled.delete(id),
  TextDecoder,Uint8Array,Map,Set,URLSearchParams,
  setTimeout(){assert.fail('Review created a timer');},setInterval(){assert.fail('Review created an interval');},
  Image:class{async decode(){const file=path.resolve(root,this.src);assert(file.startsWith(root+path.sep)&&fs.existsSync(file));
    const fd=fs.openSync(file,'r'),header=Buffer.alloc(32);fs.readSync(fd,header,0,32,0);fs.closeSync(fd);
    this.naturalWidth=header.subarray(1,4).toString()==='PNG'?header.readUInt32BE(16):1860;
    this.naturalHeight=header.subarray(1,4).toString()==='PNG'?header.readUInt32BE(20):845;}},
  fetch:async name=>{const file=path.resolve(root,name);assert(file.startsWith(root+path.sep));const data=fs.readFileSync(file);
    return{ok:true,json:async()=>JSON.parse(data.toString('utf8')),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};}};
context.window={BARCODE:{},document,crypto:webcrypto,location:{search:''}};
vm.createContext(context);
for(const name of inputs.slice(1,4))vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
const B=context.window.BARCODE,P=B.MacCombatPreview,originalPrepare=P.prepare,originalDraw=P.drawMacPose;let prepared;
P.prepare=function(...args){prepared=originalPrepare.apply(this,args);return prepared;};
P.drawMacPose=function(ctx,art,pose,options){const result=originalDraw.call(this,ctx,art,pose,options);
  if(['swing-left','swing-right'].includes(ctx.canvas.id))painted.push({canvas:ctx.canvas.id,facing:options.facing,frame:pose.frame.id,
    action:pose.action,phase:pose.phase,key:pose.committedKey,embedded:pose.frame.embeddedWeapon||null,item:result.item});return result;};
const choose=(id,value)=>{ids.get(id).value=value;ids.get(id).dispatch('change');};
const plain=value=>JSON.parse(JSON.stringify(value));
(async()=>{
  vm.runInContext(script[1],context,{filename:'mac-equipment-review.html'});
  assert(ids.get('swing-toggle').disabled&&ids.get('action-weapon').disabled&&ids.get('action-type').disabled,'Action controls must wait for prepared artwork');
  choose('action-weapon','pipe');choose('action-type','weapon');assert.equal(scheduled.size,0);
  await prepared;await Promise.resolve();
  const R=B.MacEquipmentReview,weapon=ids.get('action-weapon'),action=ids.get('action-type'),button=ids.get('swing-toggle');
  assert(!button.disabled&&!weapon.disabled&&!action.disabled);assert.equal(scheduled.size,0,'Loading must not start animation');
  assert.deepEqual(weapon.options.map(option=>option.value),plain(R.weapons));
  assert.deepEqual(action.options.map(option=>option.value),['weapon','walk','run','guard-step']);
  assert.match(html,/revision=anatomy1/);for(const name of ['weapons','scenes','playerFor','drawWeapon','drawProp','floor'])assert(R[name],'Existing review API disappeared');
  const armedRun=!!P.frameArt.get('mac').supplemental?.clips['armed-run'];
  for(const kind of R.weapons)for(let index=0;index<4;index++){
    const scene=R.scenes.find(s=>s.id==='run-'+index),player=R.playerFor(kind,scene);
    const expected=armedRun&&R.weapons.slice(0,5).includes(kind)?[.125,.375,.625,.875][index]:scene.stride;
    assert.equal(player.animation.motion.stridePhase,expected,'Run checkpoints must match the selected armed or native gun/disc bank');
  }
  const observations=[];
  for(const kind of R.weapons)for(const type of R.actionTypes){
    choose('action-weapon',kind);choose('action-type',type);assert.equal(scheduled.size,0);
    const rule=B.MacStreetCombat.weapons[kind];
    const ages=type==='weapon'?[0,rule.windupMs*.5,rule.windupMs+rule.activeMs*.5,rule.windupMs+rule.activeMs+rule.recoveryMs*.5,
      rule.windupMs+rule.activeMs+rule.recoveryMs+50]:[0,.125,.375,.625,.875,1.125].map(fraction=>fraction*110000/(type==='run'?429:type==='guard-step'?57.2:260));
    button.click();assert.equal(scheduled.size,1);assert.equal(button.attributes['aria-pressed'],'true');
    let age=0;const frames=new Set(),phases=new Set();
    for(const target of ages){painted.length=0;step(target-age);age=target;assert.equal(scheduled.size,1);
      assert.equal(painted.length,2,'The one review owner must paint both facings once');
      assert.deepEqual(painted.map(value=>value.facing),[-1,1]);assert.equal(painted[0].frame,painted[1].frame);
      const scene=R.actionScene(kind,type,target),player=R.playerFor(kind,scene);
      assert.equal(player.weapon.kind,kind);
      if(type!=='weapon'){
        const speed=type==='run'?B.MacStreetCombat.constants.moveSpeed*B.MacStreetCombat.constants.runMultiplier:
          type==='guard-step'?B.MacStreetCombat.constants.moveSpeed*.22:B.MacStreetCombat.constants.moveSpeed;
        assert.equal(player.animation.motion.speed,speed);assert(Math.abs(scene.stride-(target*speed/110000)%1)<1e-9,'Stride must advance uniformly with actual travel speed');
        assert.equal(player.guarding,type==='guard-step');assert.equal(player.running,type==='run');
      }
      frames.add(painted[0].frame);phases.add(scene.phase||scene.action);
      assert(painted.every(value=>value.item===`weapon_${kind}`||value.embedded===kind),'Selected equipment must remain visible in both directions');
    }
    button.click();assert.equal(scheduled.size,0);assert.equal(button.attributes['aria-pressed'],'false');
    if(type==='weapon')assert(['windup','active','recovery','idle'].every(phase=>phases.has(phase)),'Attack loop skipped a committed phase or rest');
    else assert(frames.size>=2,'Motion loop never leaves one static pose');
    observations.push({weapon:kind,type,frames:[...frames],phases:[...phases]});
  }
  choose('action-weapon','pipe');choose('action-type','walk');button.click();step(110000/260*.375);
  const frozen=painted.at(-1).frame;button.click();const stopped=painted.length;step(900);assert.equal(painted.length,stopped);
  button.click();step(0);assert.equal(painted.at(-1).frame,frozen,'Resume must preserve the paused cycle position');
  choose('action-weapon','gravity-hammer');choose('action-type','run');assert.equal(scheduled.size,1,'Changing selectors must reuse the same pending owner');
  const resetFrame=painted.at(-1).frame;painted.length=0;step(0,now-8);
  assert.equal(scheduled.size,1,'An older queued frame timestamp must not stop a reset action');
  assert.equal(painted.length,2);assert.equal(painted[0].frame,resetFrame,'A queued timestamp before selector reset must draw the reset pose');
  choose('pose','guard');choose('prop','barrel_intact');choose('placement','carry');assert.equal(scheduled.size,1,'Static inspections cannot create another animation owner');
  step(50);button.click();assert.equal(scheduled.size,0);assert.equal(maxOwners,1);
  for(const args of [['pipe','unknown',0],['unknown','walk',0],['pipe','walk',NaN],['pipe','walk',-1]])assert.throws(()=>R.actionScene(...args),/equipment-review-action-invalid/);
  assert.deepEqual(identities(),before,'Inputs changed while the focused review ran');
  const receipt={status:'passed',sourceInputs:before,weaponActionCombinations:observations.length,observations,
    actualPreparation:true,actualProductionSamplerAndPainter:true,maximumReviewRafOwners:maxOwners,pausePreservesCycle:true,
    selectorsReuseOwner:true,staleFrameTimestampClamped:true,staticControlsPreserved:true,conditionalArmedRunCheckpoints:true,seconds:(performance.now()-started)/1000,
    limits:'Deterministic DOM/RAF/Canvas/image-host stubs. No native pixel, browser, anatomy or visual acceptance is claimed.'};
  const flag=process.argv.indexOf('--receipt');if(flag>=0){const file=path.resolve(process.argv[flag+1]),workspace=path.dirname(root);
    assert(file.startsWith(workspace+path.sep));fs.mkdirSync(path.dirname(file),{recursive:true});assert(!fs.existsSync(file),'Preserve prior focused receipt');fs.writeFileSync(file,JSON.stringify(receipt,null,2)+'\n');}
  console.log(JSON.stringify({status:receipt.status,combinations:observations.length,maximumReviewRafOwners:maxOwners,seconds:receipt.seconds,limits:receipt.limits}));
})().catch(error=>{console.error(error);process.exitCode=1;});
