// Production ending controller, with only DOM/audio/storage hosts supplied.
// Whole Campaign/road/RAF handoff is covered separately by completion checks.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../src/engine/cache-ending.js'),'utf8');
const copy=value=>JSON.parse(JSON.stringify(value));
function rig(options={}) {
  const calls={saves:[],audio:[],stops:0,engineStops:0,resultArms:0,dom:[],images:[],drawn:[]};
  const road={active:true,status:'clear',state:{status:'clear'},chapter:{delivery:{
    version:1,result:{score:120,rank:'A'},ending:{version:1,page:0,cue:0,done:false}}},
    armResultControls(){calls.resultArms++;}};
  const facts={items:['stem.voice','stem.bass'],completedLevels:['level-01','level-02']};
  const B={CacheRoadProof:road,CacheChapter:{persist(value){calls.saves.push(copy(value.chapter));return options.save!==false;},
    saveStatus:()=>options.save===false?'unavailable':'saved'},Campaign:{archive:()=>({status:'ready',record:{progress:facts}})},
    Preferences:{values:{}},RuntimeLifecycle:{togglePause(){window.isPaused=!window.isPaused;}}};
  const window={BARCODE:B,isPaused:false,gameState:{paused:false},inputManager:{keys:{},resultKeysHeld:new Set(),resetActionEdges(){}},
    audioSystem:{stopRuntimeAudio(){calls.stops++;},stopRoadEngine(){calls.engineStops++;},
      playCacheBridgeCue(name){calls.audio.push(name);},stopCacheBridgeAudio(){}}};
  const canvas={getBoundingClientRect:()=>({left:0,top:0,width:1920,height:1080})};
  const document={getElementById:()=>canvas,body:{appendChild(el){calls.dom.push(el);}},createElement:()=>({style:{},
    attrs:{},setAttribute(name,value){this.attrs[name]=value;},remove(){this.removed=true;}})};
  const context={window,document,Image:class{constructor(){calls.images.push(this);} set src(v){this.url=v;}get src(){return this.url;}}};
  for(const file of ['src/engine/intro-sequence.js','src/engine/cache-scene-layouts.js','src/engine/cache-scene-effects.js','src/engine/comic-dialogue.js'])
    vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context,{filename:file});
  vm.runInNewContext(source,context,{filename:'src/engine/cache-ending.js'});
  const e=B.CacheEnding;
  const ctx=new Proxy({font:'20px monospace',measureText:value=>({width:String(value).length*12}),
    fillText(value){calls.drawn.push(String(value));}}, {get(target,key){return target[key]||(()=>{});}});
  const key=(value,held,repeat=false)=>e[held?'keyDown':'keyUp']({key:value,repeat,preventDefault(){}});
  const tap=value=>{key(value,true);key(value,false);};
  const step=ms=>{for(let t=0;t<ms;t+=100)e.update(Math.min(100,ms-t));};
  const pad=(held={},pressed={},changed=false)=>e.gamepad({held,pressed,changed});
  return {window,B,road,facts,calls,e,ctx,key,tap,step,pad};
}
function checkGuardAndProgress() {
  const r=rig(),{e,road,calls,facts}=r,initial=copy(facts);
  road.status='playing';assert.equal(e.start(),false);road.status='clear';
  const receipt=road.chapter.delivery;road.chapter.delivery=null;assert.equal(e.start(),false);road.chapter.delivery=receipt;
  road.active=false;assert.equal(e.start(),false);road.active=true;
  assert(e.start());assert.equal(e.panels.length,4);assert.equal(calls.audio[0],'relay');
  assert.equal(calls.stops,1);assert.equal(calls.engineStops,1);
  const visited=[];
  for(let page=0;page<4;page++)for(let cue=0;cue<3;cue++) {
    assert.equal(e.page,page);assert.equal(e.cue,cue);visited.push(`${page}:${cue}`);
    assert.deepEqual(copy(road.chapter.delivery.ending),{version:1,page,cue,done:false});
    if(page===3&&cue===2)break;r.tap('Enter');
  }
  r.step(30000);assert(e.active);assert.equal(e.done,false,'Ready does not silently finish');
  assert.deepEqual(copy(facts),initial,'reading never modifies campaign awards');
  assert.equal(road.chapter.delivery.result,receipt.result,'reading retains the original earned result');
  assert(e.finish());assert(!e.active);assert.equal(road.chapter.delivery.ending.done,true);
  assert.equal(calls.resultArms,1);assert.equal(e.finish(),false);
  assert.equal(calls.resultArms,1,'one final action returns to results exactly once');
  assert.equal(calls.dom[0].removed,true);
  assert(e.start(road.chapter.delivery.ending));assert(e.done,'reopening does not revoke completion');
  assert.equal(e.page,3);assert.equal(e.cue,2);e.back();
  return visited.length;
}
function checkTimingTranscriptAndControls() {
  const r=rig(),{e,window}=r;
  window.inputManager.resultKeysHeld.add('enter');e.start();
  r.key('Enter',true);assert.equal(e.cue,0,'carried keyboard confirm needs release');
  r.key('Enter',false);r.key('Enter',true);assert.equal(e.cue,1);
  for(let i=0;i<12;i++)r.key('Enter',true,true);
  assert.equal(e.cue,1,'repeat cannot consume dialogue');r.key('Enter',false);
  r.step(3999);assert.equal(e.cue,1);r.step(1);assert.equal(e.cue,2);
  r.step(12000);assert.equal(e.cue,2);assert.equal(e.page,0);
  r.tap('Enter');assert.equal(e.page,1);assert.equal(e.cue,0);
  r.step(799);assert.equal(e.cue,0);r.step(1);assert.equal(e.cue,1);
  r.tap('T');assert(e.transcriptOpen);assert(e.transcriptElement.textContent.includes(e.panels[1].lines[1][1]));
  const before=copy(e.serialize()),elapsed=e.cueElapsedMs;r.step(12000);
  assert.deepEqual(copy(e.serialize()),before);assert.equal(e.cueElapsedMs,elapsed);
  r.tap('Enter');assert(!e.transcriptOpen);assert.deepEqual(copy(e.serialize()),before,'confirm closes transcript before advancing');
  r.tap('P');assert(window.isPaused);r.step(12000);assert.equal(e.cueElapsedMs,elapsed);
  window.isPaused=false;r.pad();
  r.pad({b0:true},{b0:true},true);assert.deepEqual(copy(e.serialize()),before,'owner-change held confirm is blocked');
  r.pad({b0:false});r.pad({b0:true},{b0:true});assert.equal(e.cue,2);
  r.pad({b0:true});assert.equal(e.page,1,'held confirm cannot advance again');
  r.pad({b0:false});r.pad({b8:true},{b8:true});assert(!e.active);
  assert.equal(r.road.chapter.delivery.ending.page,1);assert.equal(r.road.chapter.delivery.ending.cue,2);
}
function checkSkip() {
  for(const source of ['keyboard','gamepad']) {
    const r=rig(),{e}=r;e.start();r.pad();
    r.key('s',true);r.pad({b1:true},{b1:true});r.step(2000);
    if(source==='keyboard')r.key('s',false);else r.pad({b1:false});
    r.step(2000);assert.equal(e.skipMs,4000,'independent remaining hold continues skip');
    r.key('s',false);r.pad({b1:false});assert.equal(e.skipMs,0);
    r.key('s',true);r.step(4999);assert(e.page<3);r.step(1);
    assert.equal(e.page,3);assert.equal(e.cue,2);assert(e.active);assert.equal(e.done,false);
    r.step(8000);assert(e.active,'held skip never executes Finish chapter');r.key('s',false);
    r.tap('Escape');assert(!e.active);assert.equal(r.road.chapter.delivery.ending.done,false);
    e.start(r.road.chapter.delivery.ending);r.pad();r.pad({b0:true},{b0:true});
    assert(!e.active);assert.equal(r.road.chapter.delivery.ending.done,true);
  }
  const r=rig();r.window.inputManager.keys.s=true;r.e.start();r.key('s',true);r.step(6000);
  assert.equal(r.e.page,0,'carried skip cannot skip');r.key('s',false);r.key('s',true);r.step(5000);assert.equal(r.e.page,3);
}
function checkSavesAndMissingArt() {
  let positions=0;
  for(let page=0;page<4;page++)for(let cue=0;cue<3;cue++) {
    const r=rig(),{e,calls}=r;e.start({version:1,page,cue,done:false});positions++;
    assert.equal(e.page,page);assert.equal(e.cue,cue);assert.equal(calls.audio.length,0,'all restored positions are silent');
    e.back();assert.deepEqual(copy(r.road.chapter.delivery.ending),{version:1,page,cue,done:false});
  }
  const r=rig({save:false}),{e,calls}=r;
  for(const saved of [null,undefined,[],{version:2,page:3,cue:2,done:true}])
    assert.deepEqual(copy(e.normalize(saved)),{version:1,page:0,cue:0,done:false});
  assert.deepEqual(copy(e.normalize({version:1,page:99,cue:-2,done:'true'})),{version:1,page:3,cue:0,done:false});
  assert.deepEqual(copy(e.normalize({version:1,page:NaN,cue:Infinity,done:true})),{version:1,page:0,cue:0,done:true});
  e.start();assert.equal(calls.images.length,4);assert(calls.images[0].url.startsWith('https://raw.githubusercontent.com/'));
  r.step(8000);assert.equal(calls.images.length,8);assert(calls.images[4].url.startsWith('assets/cache-ending/'));
  r.step(8000);assert(e.images.every(item=>item.status==='unavailable'),'both fetch attempts are bounded by shared updates');
  e.draw(r.ctx);assert(calls.drawn.includes('BASS RECOVERED'));
  assert(calls.drawn.includes('SAVE UNAVAILABLE / KEEP THIS SESSION OPEN'));
  assert(!calls.drawn.includes('PROGRESS SAVED'),'ready archive alone cannot claim a successful save');
  assert(calls.drawn.some(text=>text.includes('PICTURE UNAVAILABLE')));
  e.skipToReady();e.pointer({clientX:1500,clientY:1035});
  assert(!e.active);assert(r.road.chapter.delivery.ending.done,'save failure preserves session and usable final action');
  const oldLoad=calls.images[4].onload;assert.equal(oldLoad,null,'dispose removes stale image callbacks');
  const r2=rig();r2.facts.items=['stem.voice'];r2.e.start();r2.e.draw(r2.ctx);
  assert(!r2.calls.drawn.includes('BASS RECOVERED'),'badge cannot fabricate a reward');
  r2.e.dispose();assert(r2.calls.images.every(image=>image.onload===null&&image.onerror===null));
  assert.equal(r2.calls.dom.length,1);assert(r2.calls.dom[0].removed);
  return positions;
}

function checkSceneClock() {
  const r=rig(),{e,window}=r;e.start();assert.equal(e.sceneElapsedMs,0);
  r.step(300);assert.equal(e.sceneElapsedMs,300);
  r.tap('Enter');assert.equal(e.cue,1);assert.equal(e.sceneElapsedMs,300,
    'a dialogue reveal preserves the scene effect clock');
  r.step(120);assert.equal(e.sceneElapsedMs,420);
  r.tap('T');r.step(1200);assert.equal(e.sceneElapsedMs,420,'transcript freezes scene effects');
  r.tap('Enter');assert(!e.transcriptOpen);assert.equal(e.cue,1);
  r.tap('P');assert(window.isPaused);r.step(1200);assert.equal(e.sceneElapsedMs,420,'pause freezes scene effects');
  window.isPaused=false;r.key('s',true);r.step(1200);
  assert.equal(e.sceneElapsedMs,420,'holding skip freezes scene effects');
  r.key('s',false);r.step(120);assert.equal(e.sceneElapsedMs,540);
  r.tap('Enter');assert.equal(e.cue,2);assert.equal(e.sceneElapsedMs,540);
  r.tap('Enter');assert.equal(e.page,1);assert.equal(e.sceneElapsedMs,0,'page changes reset scene effects');
  assert.deepEqual(copy(e.serialize()),{version:1,page:1,cue:0,done:false});
  e.dispose();e.start({version:1,page:2,cue:1,done:false});
  assert.equal(e.sceneElapsedMs,0,'restore starts a transient clock without changing reading position');
  assert.deepEqual(copy(e.serialize()),{version:1,page:2,cue:1,done:false});
}

function main() {
  const cues=checkGuardAndProgress();checkTimingTranscriptAndControls();checkSkip();checkSceneClock();
  const saved=checkSavesAndMissingArt();
  console.log(`Cache ending: ${cues} actual cues, ${saved} silent save positions, release-to-arm controls, five-second skip, final-only Finish, pause/transcript, bounded image fallbacks and truthful saved/reward feedback and scene-effect clock ownership passed.`);
}
module.exports={endingRig:rig};
if(require.main===module)main();
