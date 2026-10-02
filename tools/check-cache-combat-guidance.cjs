// Real Canvas guidance and Pause remapping boundaries for the combat chase.
// No road timing, enemy health or production control state is rewritten here.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const plain=value=>JSON.parse(JSON.stringify(value));
const store=new Map();
const w={BARCODE:{},FILE_MANIFEST:[],navigator:{getGamepads:()=>[]},
  localStorage:{getItem:key=>store.get(key),setItem:(key,value)=>store.set(key,value)},
  document:{getElementById:()=>null},inputManager:{resetActionEdges(){},
    actionInput:{reset(){},keyboardBindings:{road_attack:['f'],road_turbo:[' '],road_defend:['g'],road_disrupt:['v']}}}};
w.window=w;
const context=vm.createContext(w);
for(const file of ['src/core/gamepad-ui.js','src/game/cache-road-guidance.js','src/game/pause-menu.js'])
  vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const B=w.BARCODE,g=B.CacheRoadGuidance,c=B.ControllerSettings,menu=B.PauseMenu;
const road=B.CacheRoadProof={active:true,status:'playing',chapter:{encounterVersion:4,difficultyId:'standard',records:[]},
  state:{combat:{version:4,boss:{defeated:false}},musicBeatFloat:40,lanePos:1,progress:100,
    elapsedMs:0,opening:{held:true},pulseFlashMs:0,gateAt:null,gateOpen:false},recordOpportunity:()=>null};
const ctx=createCanvas(1920,1080).getContext('2d'),texts=[];
const fill=ctx.fillText.bind(ctx);
ctx.fillText=(value,x,y,maxWidth)=>{
  const transform=ctx.getTransform(),width=Math.min(maxWidth??Infinity,ctx.measureText(String(value)).width);
  const left=x-(ctx.textAlign==='center'?width/2:ctx.textAlign==='right'?width:0);
  texts.push({value:String(value),x:transform.a*left+transform.c*y+transform.e,
    y:transform.b*x+transform.d*y+transform.f,width:width*transform.a});
  fill(value,x,y,maxWidth);
};
function values(){return texts.map(text=>text.value);}
function clear(){texts.length=0;ctx.clearRect(0,0,1920,1080);}

assert.deepEqual(plain(g.badges.map(b=>b.name)),['SURGE','PUSH','BRACE','REFILL','TURBO','ECHO'],
  'historical badge data remains available for version-1–3 saves');
assert.deepEqual(plain(g.combatBadges.slice(0,4).map(b=>b.name)),['SYNC A','SYNC B','SYNC X','SYNC Y']);
assert.deepEqual(plain(g.combatBadges.slice(0,4).map(b=>[b.shape,b.color,b.key,b.points])),
  plain(g.badges.slice(0,4).map(b=>[b.shape,b.color,b.key,b.points])),
  'sync pieces keep the existing chart shapes, colors and keyboard addresses');
assert.deepEqual([4,5,6,7].map(i=>g.label(i,road)),['SPACE','F','G','V']);
B.GamepadUI.connected=true;c.labels='playstation';
w.navigator.getGamepads=()=>[{mapping:'standard',id:'DualSense',index:0,connected:true,
  buttons:Array.from({length:17},()=>({pressed:false,value:0})),axes:[0,0]}];
assert.deepEqual([5,4,6,7].map(i=>g.label(i,road)),['R1','L1','R2','L2']);
assert(c.bind('road_attack',7));
assert.deepEqual([5,4,6,7].map(i=>g.label(i,road)),['R2','L1','R1','L2'],
  'guidance follows the actual saved shoulder/trigger remap');
B.GamepadUI.connected=false;
w.inputManager.actionInput.keyboardBindings.road_attack=['q'];
assert.equal(g.label(5,road),'Q','keyboard guidance follows the input owner’s remap');
w.inputManager.actionInput.keyboardBindings.road_attack=['f'];
const faces=['road_a','road_b','road_x','road_y'];
faces.forEach((action,index)=>{w.inputManager.actionInput.keyboardBindings[action]=['z','c','n','m'].slice(index,index+1);});
assert.deepEqual([0,1,2,3].map(i=>g.label(i,road)),['Z','C','N','M'],
  'ground face-button prompts follow the actual keyboard input remaps');
faces.forEach(action=>{delete w.inputManager.actionInput.keyboardBindings[action];});
assert.deepEqual([0,1,2,3].map(i=>g.label(i,road)),['K','L','J','I'],
  'unmapped historical input fixtures retain their existing face labels');
clear();g.drawHelp(ctx,road);
for(const name of ['SYNC A','SYNC B','SYNC X','SYNC Y','ATTACK','TURBO','DEFEND','DISRUPT'])assert(values().includes(name),name);
assert(values().every(text=>!/(SURGE|PUSH|BRACE|REFILL|ECHO)/.test(text)),
  'fresh help never presents a synchronization piece as a combat skill or prompts removed Echo');
assert(values().some(text=>/even with zero sync/.test(text)));
assert(values().some(text=>/DODGE FOR AN OPENING.*ATTACK TO BREAK/.test(text)));
assert(texts.every(text=>text.x>=440&&text.x+text.width<=990&&text.y>=433&&text.y<=786),
  'all fresh Pause controls fit their left column without covering settings');

const pulse={action:2,lane:1},cue={ready:true,window:true,remaining:0};
assert.equal(g.lesson(road,{nextPulse:pulse,nextCue:cue}).active,true);
assert.match(g.lesson(road,{nextPulse:pulse,nextCue:{...cue,window:false}}).title,/SYNC X/);
road.state.musicBeatFloat=370;road.state.gateAt=road.state.progress+100;
B.CacheRoadCombat={pose:()=>({actors:[{kind:'rig',warning:true,lockLane:2,at:220,lane:2}],
  boss:{hp:12,maxHp:12,systems:[{broken:false},{broken:false},{broken:false}],defeated:false}})};
clear();g.draw(ctx,road,{nextPulse:pulse,nextCue:cue,reduced:true});
assert(values().includes('PRESS NOW'),'boss guidance preserves the announced pad destination and press target');
assert(values().every(text=>!/(ECHO|EXIT|ATTACK THE RIG)/.test(text)),
  'a live pad owns its prompt instead of being covered by the boss or scrapped exit');
clear();g.draw(ctx,road,{reduced:true});
assert(values().includes('ATTACK THE RIG'),'the boss requires actual attacks when no pad prompt owns the panel');
road.state.combat.boss.defeated=true;
assert.equal(g.objective(road).title,'PURSUIT DESTROYED');

w.isPaused=true;menu.sync();menu.view='controller';
assert.equal(menu.controllerRowCount(),9);
for(const [row,action] of [[3,'road_attack'],[4,'road_turbo'],[5,'road_defend'],[6,'road_disrupt']]){
  menu.controllerFocus=row;menu.activateController();assert.equal(menu.captureAction,action);menu.captureAction=null;
}
menu.controllerFocus=0;menu.keyDown({key:'ArrowUp',preventDefault(){}});
assert.equal(menu.controllerFocus,8,'contextual navigation reaches Back without an invisible legacy row');
const levelBefore=plain(Object.fromEntries(['jump','primary','interact','rhythm_mode','inspect'].map(action=>[action,c.bindings[action]])));
menu.controllerFocus=3;menu.activateController();
menu.captureController({pressed:{},held:{}});assert(menu.captureReady);
menu.captureController({pressed:{b0:true},held:{b0:true}});
assert.equal(menu.captureAction,'road_attack','a face button cannot steal a skill or its sync address');
menu.captureController({pressed:{b6:true},held:{b6:true}});
assert.equal(menu.captureAction,null);assert.equal(c.bindings.road_attack,6);
menu.controllerFocus=7;menu.activateController();
assert.deepEqual(plain(Object.fromEntries(['road_attack','road_turbo','road_defend','road_disrupt'].map(action=>[action,c.bindings[action]]))),
  {road_attack:5,road_turbo:4,road_defend:7,road_disrupt:6});
assert.deepEqual(plain(Object.fromEntries(Object.keys(levelBefore).map(action=>[action,c.bindings[action]]))),levelBefore,
  'resetting the chase skill mapping preserves Level1 customization');
const controllerTexts=[];
menu.drawController(ctx,value=>controllerTexts.push(String(value)));
for(const name of ['Attack','Turbo','Defend','Disrupt','Reset skill mapping'])assert(controllerTexts.includes(name));
assert(!controllerTexts.includes('Beat attack'));
road.active=false;
assert.equal(menu.controllerRowCount(),11,'Level1 retains its original controls and adds the held Run setting');
menu.controllerFocus=3;menu.activateController();assert.equal(menu.captureAction,'jump');menu.captureAction=null;
road.active=true;road.chapter.encounterVersion=3;delete road.state.combat;
clear();g.drawHelp(ctx,road);
assert(values().includes('SURGE'));assert(values().includes('ECHO'));
assert(!values().includes('DISRUPT'),'historical saves retain their original rules and help');
console.log(JSON.stringify({syncPieces:4,combatSkills:4,skillLabels:['keyboard','PlayStation','remapped'],
  pauseRemapRows:4,legacyControlsPreserved:true,bossPadReadability:true,pauseColumnBounds:true}));
