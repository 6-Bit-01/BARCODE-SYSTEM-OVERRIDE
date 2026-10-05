#!/usr/bin/env node
'use strict';
// Production touch + shared input owners, driven through pointer events. Browser
// services are supplied by a small DOM rig; real layout is checked separately.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),plain=value=>JSON.parse(JSON.stringify(value));
class EventTarget {
 constructor(){this.listeners=new Map();}
 addEventListener(type,handler,options){const list=this.listeners.get(type)||[];list.push({handler,options});this.listeners.set(type,list);}
 removeEventListener(type,handler){this.listeners.set(type,(this.listeners.get(type)||[]).filter(row=>row.handler!==handler));}
 dispatchEvent(event){event.target||=this;event.currentTarget=this;
  event.preventDefault||=()=>{event.defaultPrevented=true;};event.stopPropagation||=()=>{event.propagationStopped=true;};
  for(const {handler} of [...this.listeners.get(event.type)||[]])handler.call(this,event);
  if(event.bubbles&&!event.propagationStopped)this.parentNode?.dispatchEvent(event);return !event.defaultPrevented;}
}
class Element extends EventTarget {
 constructor(tag,doc){super();this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.style={setProperty(key,value){this[key]=value;},removeProperty(key){delete this[key];}};
  this.dataset={};this.attributes={};this.className='';this.hidden=false;this.disabled=false;this.textContent='';this.captured=new Set();
  this.classList={add:(...names)=>{this.className=[...new Set([...this.className.split(/\s+/).filter(Boolean),...names])].join(' ');},
   remove:(...names)=>{this.className=this.className.split(/\s+/).filter(name=>!names.includes(name)).join(' ');},contains:name=>this.className.split(/\s+/).includes(name),
   toggle:(name,force)=>{const wanted=force??!this.classList.contains(name);wanted?this.classList.add(name):this.classList.remove(name);return wanted;}};}
 appendChild(child){child.parentNode?.removeChild?.(child);child.parentNode=this;this.children.push(child);return child;}
 get textContent(){return (this._text||'')+this.children.map(child=>child.textContent).join('');}
 set textContent(value){this._text=String(value);for(const child of this.children||[])child.parentNode=null;this.children=[];}
 append(...children){for(const child of children)this.appendChild(child);}
 replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];this.append(...children);}
 removeChild(child){this.children=this.children.filter(item=>item!==child);child.parentNode=null;return child;}
 remove(){this.parentNode?.removeChild(this);}
 setAttribute(key,value){this.attributes[key]=String(value);if(key==='id')this.id=String(value);if(key==='class')this.className=String(value);
  if(key.startsWith('data-'))this.dataset[key.slice(5).replace(/-([a-z])/g,(_,char)=>char.toUpperCase())]=String(value);}
 removeAttribute(key){delete this.attributes[key];if(key==='id')this.id='';if(key==='class')this.className='';
  if(key.startsWith('data-'))delete this.dataset[key.slice(5).replace(/-([a-z])/g,(_,char)=>char.toUpperCase())];}
 getAttribute(key){if(key.startsWith('data-'))return this.dataset[key.slice(5).replace(/-([a-z])/g,(_,char)=>char.toUpperCase())]??null;
  return key==='id'?this.id:key==='class'?this.className:this.attributes[key]??null;}
 matches(selector){if(selector.includes(','))return selector.split(',').some(part=>this.matches(part.trim()));
  if(selector.startsWith('#'))return this.id===selector.slice(1);if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));
  const attr=selector.match(/^(\w+)?\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]$/);if(attr)return (!attr[1]||this.tagName.toLowerCase()===attr[1])&&
   this.getAttribute(attr[2])!==null&&(attr[3]===undefined||this.getAttribute(attr[2])===attr[3]);return this.tagName.toLowerCase()===selector;}
 closest(selector){return this.matches(selector)?this:this.parentNode?.closest?.(selector)||null;}
 contains(child){return child===this||this.children.some(item=>item.contains(child));}
 querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 setPointerCapture(id){this.captured.add(id);}releasePointerCapture(id){this.captured.delete(id);}hasPointerCapture(id){return this.captured.has(id);}
 focus(){this.ownerDocument.activeElement=this;}click(){if(!this.disabled)this.dispatchEvent({type:'click',bubbles:true});}
 getBoundingClientRect(){return this.rect||{x:20,y:600,left:20,top:600,width:140,height:140,right:160,bottom:740};}
}
function rig({touch=true,hybrid=false,width=390,height=844}={}){
 const doc=new EventTarget();doc.readyState='loading';doc.hidden=false;doc.createElement=tag=>new Element(tag,doc);
 doc.documentElement=doc.createElement('html');doc.body=doc.createElement('body');doc.body.parentNode=doc;
 doc.documentElement.appendChild(doc.body);doc.getElementById=id=>doc.documentElement.querySelector('#'+id);
 doc.querySelector=selector=>doc.documentElement.querySelector(selector);doc.querySelectorAll=selector=>doc.documentElement.querySelectorAll(selector);
 const win=new EventTarget(),route=[],work={raf:0,timers:0,intervals:0,canvases:0};
 Object.assign(win,{document:doc,console,Math,Date,Map,Set,performance:{now:()=>1000},
  innerWidth:width,innerHeight:height,navigator:{maxTouchPoints:touch?5:0,getGamepads:()=>[]},
  matchMedia:query=>({matches:hybrid?/any-pointer:\s*coarse/.test(query):touch&&/coarse|hover:\s*none/.test(query),media:query,addEventListener(){},removeEventListener(){}}),
  localStorage:{getItem(){return null;},setItem(){}},gameState:{running:true,paused:false,gameOver:false,victory:false},isRunning:true,isPaused:false,
  audioSystem:{context:{currentTime:2},getOutputAudioTime:t=>t-0.05},getComputedStyle:element=>element.style,
  requestAnimationFrame(){work.raf++;throw Error('Touch controls installed a new RAF');},cancelAnimationFrame(){},
  setTimeout(){work.timers++;throw Error('Touch controls installed a timer');},clearTimeout(){},
  setInterval(){work.intervals++;throw Error('Touch controls installed an interval');},clearInterval(){}});
 win.window=win;doc.defaultView=win;doc.parentNode=win;
 const create=doc.createElement;doc.createElement=tag=>{if(tag==='canvas')work.canvases++;return create(tag);};
 const start=doc.createElement('button');start.id='startButton';start.addEventListener('click',()=>route.push(['title','start']));doc.body.appendChild(start);
 const continued=doc.createElement('button');continued.id='continueButton';continued.hidden=true;continued.addEventListener('click',()=>route.push(['title','continue']));doc.body.appendChild(continued);
 const settings=doc.createElement('button');settings.id='settingsButton';settings.addEventListener('click',()=>route.push(['title','settings']));doc.body.appendChild(settings);
 const canvas=doc.createElement('canvas');canvas.id='gameCanvas';canvas.width=1920;canvas.height=1080;doc.body.appendChild(canvas);
 const context=vm.createContext(win),load=file=>vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
 load('src/core/gamepad-ui.js');load('src/core/action-input.js');load('src/core/input.js');
 const B=win.BARCODE;let state='running';
 B.RuntimeLifecycle={getState:()=>state,togglePause(){state=state==='paused'?'running':'paused';win.isPaused=win.gameState.paused=state==='paused';route.push(['lifecycle',state]);}};
 B.LevelDifficulty={open:false,selected:1,select(index){this.selected=index;route.push(['difficulty','select',index]);return true;},
  confirm(){this.open=false;route.push(['difficulty','begin']);return true;},toggleRecovery(){route.push(['difficulty','recovery']);return true;},
  keyDown(e){if(!this.open)return false;route.push(['difficulty',e.key]);if(e.key==='ArrowRight'||e.key==='arrowright')this.selected=(this.selected+1)%3;return true;},keyUp(){}};
 B.PauseMenu={titleOpen:false,heldKeys:new Set(),isPaused:()=>B.PauseMenu.titleOpen||state==='paused',resume(){route.push(['pause','resume']);},
  keyDown(e){if(!(this.titleOpen||state==='paused'))return false;this.heldKeys.add(e.key.toLowerCase());route.push(['pause',e.key]);if(e.key.toLowerCase()==='p'||e.key.toLowerCase()==='escape')B.RuntimeLifecycle.togglePause();return true;},
  keyUp(e){this.heldKeys.delete(e.key.toLowerCase());route.push(['pause-up',e.key]);},sync(){},render(){}};
 B.CacheRoadProof={active:false,status:'playing',introMs:null,keyDown(e){if(this.status==='playing')return false;route.push(['road-results',e.key]);return true;},keyUp(){},handleActions(actions){route.push(['road',plain(actions)]);}};
 const manager=win.inputManager=new win.InputManager();
 doc.readyState='complete';
 const key=(type,key)=>win.dispatchEvent({type,key,repeat:false,timeStamp:990,bubbles:false});
 const pointer=(element,type,id,x,y,extra={})=>element.dispatchEvent({type,pointerId:id,pointerType:'touch',clientX:x,clientY:y,
  button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,timeStamp:990,bubbles:true,...extra});
 const frame=()=>{manager.update();return manager.actionInput.state;};
 return {w:win,doc,B,manager,context,load,route,work,key,pointer,frame,setState(value){state=value;win.isPaused=win.gameState.paused=value==='paused';}};
}

function run(){
 let count=0;
 const check=(name,body)=>{body();count++;console.log('PASS touch '+name);};
 check('virtual holds preserve physical keyboard ownership',()=>{
  const r=rig(),a=r.manager.actionInput;r.key('keydown','d');assert(r.frame().move_right.held);
  a.setVirtualAction('move_right','finger-1',true,{timeStamp:990});a.setVirtualAction('move_right','finger-1',false,{timeStamp:990});
  assert(r.frame().move_right.held,'Releasing the joystick must not release a physical key');
  a.setVirtualAction('move_left','finger-2',true,{timeStamp:990});a.clearVirtualActions();
  assert(a.keysHeld.has('d'),'Context cancellation preserves the physical key');assert(r.frame().move_right.held);assert(!a.held('move_left'));
  r.key('keyup','d');assert(!r.frame().move_right.held);
 });
 check('short touch tap retains its audible timestamp exactly once',()=>{
  const r=rig(),a=r.manager.actionInput;r.B.CacheRoadProof.active=true;
  a.setVirtualAction('road_a','finger-1',true,{timeStamp:990});a.setVirtualAction('road_a','finger-1',false,{timeStamp:990});
  let state=r.frame();assert(state.road_a.pressed&&state.road_a.released&&!state.road_a.held);
  assert.equal(state.road_a.presses.length,1);assert(Math.abs(state.road_a.presses[0].audioTimeSec-1.99)<1e-8);
  assert(Math.abs(state.road_a.presses[0].audibleAudioTimeSec-1.94)<1e-8);
  state=r.frame();assert(!state.road_a.pressed&&!state.road_a.released,'No repeat after the next shared update');
 });
 check('cancel removes only the cancelled touch press',()=>{
  const r=rig(),a=r.manager.actionInput;r.B.CacheRoadProof.active=true;
  r.key('keydown','k');r.key('keyup','k');a.setVirtualAction('road_a','cancelled-finger',true,{timeStamp:990});
  a.releaseVirtualOwner('cancelled-finger',{discardPresses:true});const state=r.frame();
  assert.equal(state.road_a.presses.length,1,'A touch cancel must not discard a queued physical tap');assert(state.road_a.pressed&&!state.road_a.held);
  a.setVirtualAction('road_b','cancelled-finger',true,{timeStamp:990});a.clearVirtualActions();
  assert(!r.frame().road_b.pressed&&!a.held('road_b'),'A cancelled virtual edge cannot survive a context change');
 });
 check('multitouch owners release independently and do not repeat holds',()=>{
  const r=rig(),a=r.manager.actionInput;r.B.CacheRoadProof.active=true;
  for(const [action,owner] of [['move_left','stick'],['road_a','face'],['road_defend','skill']])a.setVirtualAction(action,owner,true,{timeStamp:990});
  let state=r.frame();for(const action of ['move_left','road_a','road_defend'])assert(state[action].pressed&&state[action].held,action);
  state=r.frame();for(const action of ['move_left','road_a','road_defend'])assert(state[action].held&&!state[action].pressed,action+' does not repeat');
  a.releaseVirtualOwner('face');state=r.frame();assert(state.move_left.held&&state.road_defend.held&&!state.road_a.held&&state.road_a.released);
  a.releaseVirtualOwner('stick');assert(!r.frame().move_left.held&&a.held('road_defend'));a.releaseVirtualOwner('skill');assert(!r.frame().road_defend.held);
 });
 check('between-frame touch gear tap and pause suppression use shared actions',()=>{
  const r=rig(),a=r.manager.actionInput;r.B.CacheRoadProof.active=true;
  a.setVirtualAction('move_up','gear',true,{timeStamp:990});a.setVirtualAction('move_up','gear',false,{timeStamp:990});
  assert(r.frame().move_up.pressed,'Road gear taps cannot disappear between updates');
  a.setVirtualAction('road_attack','held',true,{timeStamp:990});r.setState('paused');assert(!r.frame().road_attack.held&&!a.pressed('road_attack'));
  a.clearVirtualActions();r.setState('running');assert(!r.frame().road_attack.held&&!a.pressed('road_attack'));
 });
 check('title, opening and difficulty commands reach their exclusive owners',()=>{
  const r=rig(),command=(name,held=true)=>r.manager.touchCommand(name,held);
  for(const name of ['start','settings']){assert(command('title:'+name));assert.deepEqual(r.route.at(-1),['title',name]);}
  assert.equal(command('title:continue'),false,'Hidden Continue must remain unavailable');
  r.doc.getElementById('continueButton').hidden=false;assert(command('title:continue'));
  const intro=r.w.cutsceneSystem={isActive:true,startSkipHold:owner=>r.route.push(['intro','skip-down',owner]),endSkipHold:owner=>r.route.push(['intro','skip-up',owner]),
   skipCutscene:()=>r.route.push(['intro','dialogue']),nextScene:()=>r.route.push(['intro','scene']),toggleTranscript:()=>r.route.push(['intro','transcript']),
   inspectCaption:()=>r.route.push(['intro','caption']),togglePresentationPause:()=>r.route.push(['intro','pause'])};
  for(const name of ['dialogue','scene','transcript','caption']){command('intro:'+name);assert.deepEqual(r.route.at(-1),['intro',name]);}
  command('intro:skip');command('intro:skip',false);assert.deepEqual(r.route.slice(-2),[['intro','skip-down','touch'],['intro','skip-up','touch']]);
  command('pause');assert.deepEqual(r.route.at(-1),['intro','pause']);intro.isActive=false;r.B.LevelDifficulty.open=true;
  command('difficulty:right');assert.equal(r.B.LevelDifficulty.selected,2);command('difficulty:left');assert.equal(r.B.LevelDifficulty.selected,1);
  command('difficulty:recovery');command('difficulty:begin');assert.deepEqual(r.route.slice(-2),[['difficulty','recovery'],['difficulty','begin']]);
  assert.equal(r.manager.actionInput.keysHeld.size,0,'UI commands do not synthesize gameplay keys');
 });
 check('menu navigation preserves physically held menu keys',()=>{
  const r=rig();r.setState('paused');r.manager.touchCommand('menu:down');assert.deepEqual(r.route.slice(-2),[['pause','ArrowDown'],['pause-up','ArrowDown']]);
  r.key('keydown','ArrowDown');assert(r.B.PauseMenu.heldKeys.has('arrowdown'));const length=r.route.length;
  assert.equal(r.manager.touchCommand('menu:down'),false);assert.equal(r.route.length,length,'Touch does not repeat or release the physical menu key');
  assert(r.B.PauseMenu.heldKeys.has('arrowdown'));r.key('keyup','ArrowDown');assert(!r.B.PauseMenu.heldKeys.has('arrowdown'));
  r.manager.touchCommand('menu:select');assert.deepEqual(r.route.at(-2),['pause','Enter']);r.manager.touchCommand('menu:resume');assert.deepEqual(r.route.at(-1),['pause','resume']);
  assert.equal(r.manager.touchCommand('difficulty:right'),false,'Gameplay UI commands remain blocked behind pause');
 });
 check('touch terminal digits, deletion, confirm and cancel never leak to gameplay',()=>{
  const r=rig();r.w.hackingSystem={isActive:()=>true,useKeypad:()=>r.route.push(['hack','keypad']),processInput:key=>r.route.push(['hack',key])};
  for(const key of ['0','1','9','Backspace','Enter','Escape']){r.manager.touchCommand('hack:'+key);assert.deepEqual(r.route.at(-1),['hack',key]);}
  assert.equal(r.manager.actionInput.keysHeld.size,0);assert.deepEqual(plain(r.manager.actionInput.pendingPresses),{});
  assert.equal((r.w.listeners.get('keydown')||[]).length,1,'The shared InputManager remains the keyboard owner');
 });
 check('tutorial, bridge and ending navigation have dedicated commands',()=>{
  const r=rig();r.w.tutorialSystem={handleSpacePress:()=>r.route.push(['tutorial','continue'])};r.manager.touchCommand('tutorial:continue');assert.deepEqual(r.route.at(-1),['tutorial','continue']);
  const comic=kind=>({active:true,pending:false,advance:options=>r.route.push([kind,options?.scene?'scene':'dialogue']),toggleTranscript:()=>r.route.push([kind,'transcript']),
   architecture:()=>r.route.push([kind,'architecture']),back:()=>r.route.push([kind,'back']),holdSkip:(owner,held)=>r.route.push([kind,'skip',owner,held])});
  r.B.CacheBridge=comic('bridge');r.B.Campaign={closeIntermission:()=>r.route.push(['bridge','back'])};
  for(const name of ['dialogue','scene','transcript','architecture','back']){r.manager.touchCommand('comic:'+name);assert.deepEqual(r.route.at(-1),['bridge',name]);}
  r.manager.touchCommand('comic:skip');r.manager.touchCommand('comic:skip',false);assert.deepEqual(r.route.at(-1),['bridge','skip','touch',false]);
  r.B.CacheEnding=comic('ending');for(const name of ['dialogue','scene','transcript','back']){r.manager.touchCommand('comic:'+name);assert.deepEqual(r.route.at(-1),['ending',name]);}
 });
 check('results preserve readiness and use the authored retry/title/campaign owners',()=>{
  const r=rig();r.B.CacheRoadProof.active=true;r.B.CacheRoadProof.resultAction=action=>r.route.push(['road-result',action]);
  r.B.CacheRoadProof.finishIntro=()=>r.route.push(['road-intro','continue']);r.B.CacheRoadProof.finishOutro=()=>r.route.push(['road-outro','continue']);
  r.manager.touchCommand('road:intro');assert.deepEqual(r.route.at(-1),['road-intro','continue']);
  r.B.CacheRoadProof.resultControlsReady=false;assert.equal(r.manager.touchCommand('road:outro'),false);
  r.B.CacheRoadProof.resultControlsReady=true;r.manager.touchCommand('road:outro');assert.deepEqual(r.route.at(-1),['road-outro','continue']);
  for(const action of ['retry','title','continue']){r.manager.touchCommand('road:result:'+action);assert.deepEqual(r.route.at(-1),['road-result',action]);}
  r.B.CacheRoadProof.active=false;r.w.gameState.victory=true;r.w.sector1Progression={areCompletionControlsReady:()=>false};
  assert.equal(r.manager.touchCommand('result:retry'),false,'Touch must not bypass winning-hit release/readiness');
  r.w.sector1Progression.areCompletionControlsReady=()=>true;r.B.Campaign={openIntermission:()=>r.route.push(['result','continue']),canRetryObjective:()=>true,retryObjective:()=>r.route.push(['result','checkpoint'])};
  r.B.RuntimeLifecycle.returnToTitle=()=>r.route.push(['result','title']);
  r.manager.touchCommand('result:retry');assert.deepEqual(r.route.at(-1),['result','checkpoint']);
  r.manager.touchCommand('result:continue');assert.deepEqual(r.route.at(-1),['result','continue']);r.manager.touchCommand('result:title');assert.deepEqual(r.route.at(-1),['result','title']);
 });
 const touchRig=options=>{const r=rig(options),before={...r.work};r.load('src/core/touch-controls.js');r.T=r.B.TouchControls;r.before=before;
  r.stick=r.doc.getElementById('touchJoystick');r.center={x:90,y:670};
  r.button=id=>{const node=r.T.buttons.get(id)?.node;assert(node,'Missing touch control '+id);return node;};
  r.press=(id,pointerId=2)=>r.pointer(r.button(id),'pointerdown',pointerId,100,650);
  r.release=(id,pointerId=2,type='pointerup')=>r.pointer(r.button(id),type,pointerId,100,650);
  r.tap=(id,pointerId=2)=>{const node=r.button(id);r.pointer(node,'pointerdown',pointerId,100,650);r.pointer(node,'pointerup',pointerId,100,650);};
  r.more=()=>{if(!r.T.toolsOpen)r.tap('ui:more');assert(r.T.toolsOpen,'More opens secondary controls');};return r;};
 const roadRig=({combat=false}={})=>{
  const r=touchRig(),state={elapsedMs:1,musicBeatFloat:20,lanePos:1.5,gear:1,pulseTargets:{},caughtPulses:{},missedPulses:{},boost:1,echoEnergy:100};
  const pulses=[];let view={target:null,actors:[],projectiles:[],skills:Object.fromEntries(['attack','defend','turbo','disrupt'].map(id=>[id,{ready:true,charges:3}]))};
  if(combat)state.combat={version:4};
  Object.assign(r.B.CacheRoadProof,{active:true,state,pulses:()=>pulses,combatInput:()=>({progress:100,lanePos:state.lanePos})});
  r.B.CacheRoadCombat={pose:()=>view};r.advance=()=>{state.elapsedMs++;r.T.sync();};r.setView=value=>{view=value;r.advance();};
  r.state=state;r.pulses=pulses;r.view=()=>view;r.advance();return r;
 };
 check('Level1 defaults expose only currently usable gameplay and secondary tools',()=>{
  const r=touchRig();r.w.tutorialSystem={storyChapter:1,isActive:()=>true,getInstructionOwner:()=> 'mission'};
  let active=false,canEnter=false,canHack=false;
  r.w.rhythmSystem={isActive:()=>active,canEnterRhythmMode:()=>({ok:canEnter})};
  r.w.hackingSystem={isActive:()=>false,getAvailability:()=>({canStart:canHack,state:'ready'})};r.T.sync();
  assert.deepEqual(r.T.actions.children.map(node=>node.dataset.touchAction),['jump'],'Early tutorial has no inactive Beat, unavailable Rhythm or distant Hack');
  assert(r.T.buttons.has('ui:more')&&r.T.buttons.has('pause'));assert(!r.T.buttons.has('run')&&!r.T.buttons.has('inspect'));assert(r.T.tools.hidden);
  canEnter=true;r.T.sync();assert(r.T.buttons.has('rhythm_mode')&&!r.T.buttons.has('primary'));
  active=true;r.T.sync();assert(r.T.buttons.has('primary'));assert.match(r.button('rhythm_mode').textContent,/Exit/);
  canHack=true;r.T.sync();assert(r.T.buttons.has('interact'));canHack=false;r.T.sync();assert(!r.T.buttons.has('interact'));
  r.more();for(const id of ['inspect','run'])assert(r.T.buttons.has(id)&&r.button(id).parentNode===r.T.tools,id+' stays accessible in More');
  assert.deepEqual(r.work,r.before,'Contextual controls add no work owner');
 });
 check('availability and rhythm changes preserve joystick nodes and held actions',()=>{
  const r=touchRig();let active=false,canHack=false,canEnter=false;
  r.w.rhythmSystem={isActive:()=>active,canEnterRhythmMode:()=>({ok:canEnter})};
  r.w.hackingSystem={isActive:()=>false,getAvailability:()=>({canStart:canHack,state:'ready'})};r.T.sync();
  const jump=r.button('jump'),stick=r.stick;r.pointer(stick,'pointerdown',1,90,670);r.pointer(stick,'pointermove',1,125,670);r.press('jump',2);r.frame();
  canHack=true;canEnter=true;r.T.sync();assert.equal(r.button('jump'),jump);assert.equal(r.T.joystick,stick);assert.equal(r.T.joystickPointer,1);
  assert(r.frame().move_right.held&&r.manager.actionInput.held('jump'),'Adding available controls keeps held input');
  active=true;canHack=false;r.T.sync();assert(r.T.buttons.has('primary')&&!r.T.buttons.has('interact'));assert.equal(r.T.pointers.size,2);
  assert(r.frame().move_right.held&&r.manager.actionInput.held('jump'),'Same-screen rhythm changes do not cancel fingers');
  r.release('jump',2);r.pointer(stick,'pointerup',1,125,670);assert(!r.frame().jump.held);
  r.tap('primary');active=false;r.T.sync();assert(!r.T.buttons.has('primary'));const state=r.frame();
  assert(state.primary.pressed&&state.primary.released,'A completed tap survives removal of its now-unavailable button');assert(!r.frame().primary.pressed);
 });
 check('road defaults show the next real announced beat and never autoplay',()=>{
  const r=roadRig({combat:true});assert(!r.T.buttons.has('road:beat'));assert.equal(r.T.actions.children.length,0);
  r.pulses.push({id:'unannounced',action:1,lane:1.5},{id:'caught',action:1,lane:1.5},{id:'missed',action:2,lane:1.5},{id:'far',action:3,lane:1.5},{id:'real',action:0,lane:1.5});
  Object.assign(r.state.pulseTargets,{caught:20.5,missed:21,far:24.01,real:22});r.state.caughtPulses.caught=true;r.state.missedPulses.missed=true;r.advance();
  const beat=r.T.buttons.get('road:beat');assert.equal(beat.spec.action,'road_a');assert.match(beat.node.textContent,/A.*Sync/);assert(!r.frame().road_a.pressed);
  assert.deepEqual(r.T.gears.children.map(node=>node.dataset.touchAction).sort(),['move_down','move_up']);assert(r.T.actions.children.length<=3);
  r.state.caughtPulses.real=true;r.advance();assert(!r.T.buttons.has('road:beat'));assert(!r.frame().road_a.pressed,'Removing spent cues never synthesizes an action');
  r.state.musicBeatFloat=24;r.advance();assert.equal(r.T.buttons.get('road:beat').spec.action,'road_y');
  delete r.state.combat;r.advance();assert.match(r.button('road:beat').textContent,/Y.*Refill/,'Legacy effects keep their distinct meaning');
 });
 check('dynamic road mapping stays pinned to a held finger until release',()=>{
  const r=roadRig({combat:true});r.pulses.push({id:'a',action:0,lane:1.5},{id:'x',action:2,lane:1.5});r.state.pulseTargets={a:22,x:23};r.advance();
  const beat=r.button('road:beat'),gear=r.button('move_up');r.pointer(r.stick,'pointerdown',1,90,670);r.pointer(r.stick,'pointermove',1,125,670);r.press('road:beat',2);r.frame();
  r.state.caughtPulses.a=true;r.advance();assert.equal(r.button('road:beat'),beat);assert.equal(r.button('move_up'),gear);assert.equal(r.T.joystickPointer,1);
  assert.equal(r.T.pointers.get(2).spec.action,'road_a');assert.equal(r.T.buttons.get('road:beat').spec.action,'road_a');
  const held=r.frame();assert(held.road_a.held&&held.move_right.held&&!held.road_x.held,'Changed cue cannot remap an existing finger');
  r.release('road:beat',2);assert.equal(r.button('road:beat'),beat);assert.equal(r.T.buttons.get('road:beat').spec.action,'road_x');
  r.press('road:beat',3);const next=r.frame();assert(next.road_x.pressed&&next.move_right.held&&!next.road_a.held);r.release('road:beat',3);r.pointer(r.stick,'pointerup',1,125,670);
 });
 check('completed contextual beat taps retain their captured action across same-bar sync',()=>{
  const r=roadRig({combat:true});r.pulses.push({id:'a',action:0,lane:1.5},{id:'b',action:1,lane:1.5});r.state.pulseTargets={a:22,b:23};r.advance();
  const node=r.button('road:beat');r.tap('road:beat');r.state.missedPulses.a=true;r.advance();assert.equal(r.button('road:beat'),node);assert.equal(r.T.buttons.get('road:beat').spec.action,'road_b');
  const state=r.frame();assert.equal(state.road_a.presses.length,1);assert(state.road_a.pressed&&!state.road_b.pressed,'Queued tap uses the action captured at pointer down');
  assert(Math.abs(state.road_a.presses[0].audibleAudioTimeSec-1.94)<1e-8);assert(!r.frame().road_a.pressed&&!r.manager.actionInput.pressed('road_b'));
  r.state.missedPulses.b=true;r.advance();assert(!r.T.buttons.has('road:beat'));assert.equal(r.T.pointers.size,0);
 });
 check('road Attack and Guard appear only for real usable targets and threats',()=>{
  const r=roadRig({combat:true}),view=r.view();view.target={attackMode:'shot'};view.skills.attack.charges=0;r.advance();assert(!r.T.buttons.has('road_attack'));
  view.skills.attack.charges=1;r.advance();assert(r.T.buttons.has('road_attack')&&!r.T.buttons.has('road_defend'));
  view.skills.attack.ready=false;r.advance();assert(!r.T.buttons.has('road_attack'));view.skills.attack.ready=true;view.skills.attack.charges=0;view.target.attackMode='strike';r.advance();assert(r.T.buttons.has('road_attack'),'Melee strike does not require shot ammo');
  view.actors.push({warning:true});r.advance();assert(r.T.buttons.has('road_defend'));view.skills.defend.ready=false;r.advance();assert(!r.T.buttons.has('road_defend'));
  view.actors=[];view.projectiles=[{friendly:false}];view.skills.defend.ready=true;r.advance();assert(r.T.buttons.has('road_defend'));
  view.projectiles=[{friendly:true}];r.advance();assert(!r.T.buttons.has('road_defend'));r.B.CacheRoadProof.handoffMs=10;r.advance();assert.deepEqual([...r.T.buttons.keys()],['pause'],'Handoff remains exclusive');
 });
 check('More keeps every usable action accessible and closes only drawer holds',()=>{
  const r=roadRig({combat:true}),view=r.view();view.target={attackMode:'shot'};r.advance();r.key('keydown','d');r.pointer(r.stick,'pointerdown',1,90,670);r.pointer(r.stick,'pointermove',1,55,670);r.more();
  for(const id of ['road_attack','road_defend','road_turbo','road_disrupt','ui:pads'])assert(r.T.buttons.has(id),id+' is accessible in More');assert(r.T.tools.children.length<=5);
  r.press('road_disrupt',2);r.tap('ui:pads',3);assert(r.T.padsOpen);assert.equal(r.T.joystickPointer,1);assert(!r.T.pointers.has(2));assert(!r.frame().road_disrupt.held&&!r.manager.actionInput.pressed('road_disrupt'),'Tab cancellation discards an unconsumed held press');
  for(const id of ['road_a','road_b','road_x','road_y','ui:pads'])assert(r.T.buttons.has(id),id+' is accessible in Beat pads');assert(r.T.tools.children.length<=5);
  r.press('road_a',2);r.frame();r.tap('ui:more',3);assert(!r.T.toolsOpen&&!r.T.padsOpen&&r.T.tools.hidden);assert.equal(r.T.joystickPointer,1);assert(!r.T.pointers.has(2));
  const state=r.frame();assert(state.move_left.held&&state.move_right.held&&!state.road_a.held&&!state.road_a.pressed,'Close releases drawer without cancelling steering or a physical key');
  r.pointer(r.stick,'pointerup',1,55,670);r.key('keyup','d');delete r.state.combat;r.advance();r.more();for(const id of ['road_a','road_b','road_x','road_y','road_turbo','road_echo'])assert(r.T.buttons.has(id),id+' remains accessible for legacy play');
  assert(r.T.tools.children.length<=6);
  r.tap('ui:more');assert(!r.T.toolsOpen);assert.equal(r.manager.actionInput.virtualOwners.size,0);assert.deepEqual(r.work,r.before);
 });
 check('drawer tabs preserve completed taps and release only active access holds',()=>{
  const r=roadRig({combat:true});r.view().target={attackMode:'strike'};r.advance();r.more();
  r.tap('road_defend');r.tap('ui:pads');const tap=r.frame();assert(tap.road_defend.pressed&&tap.road_defend.released,'Completed skill tap remains valid after the drawer changes tabs');assert(!r.frame().road_defend.pressed);
  const a=r.button('road_a');a.dispatchEvent({type:'keydown',key:'Enter',repeat:false,timeStamp:990,bubbles:true});assert.equal(r.T.accessHolds.size,1);
  r.tap('ui:pads');assert(!r.T.padsOpen);assert.equal(r.T.accessHolds.size,0);const cancelled=r.frame();assert(!cancelled.road_a.held&&!cancelled.road_a.pressed,'Switching tabs cancels the still-held accessible action');
  r.key('keyup','Enter');r.tap('road_turbo');r.tap('ui:more');const boost=r.frame();assert(boost.road_turbo.pressed,'A completed boost tap survives closing its panel');assert.equal(r.T.pointers.size,0);assert(!r.T.toolsOpen&&!r.T.padsOpen);
 });
 check('touch module is idempotent and desktop stays dormant with no frame owner',()=>{
  const r=touchRig({touch:false});assert(!r.T.enabled&&r.T.root.hidden);
  const listenerCount=r.T.root.listeners.get('pointerdown').length;r.T.init();assert.equal(r.T.root.listeners.get('pointerdown').length,listenerCount);
  let contexts=0;const original=r.T.getContext;r.T.getContext=function(){contexts++;return original.call(this);};
  for(let i=0;i<20;i++){r.T.sync();r.manager.update();}assert.equal(contexts,0,'Disabled desktop must return before building a touch context');
  assert.deepEqual(r.work,r.before,'No extra Canvas, RAF, interval or timeout');assert.equal(r.T.diagnostics().ownsLoop,false);
  const hybrid=touchRig({touch:false,hybrid:true});assert(!hybrid.T.enabled&&hybrid.T.root.hidden,'A primary fine-pointer laptop does not show controls just because a touch screen exists');
  hybrid.w.dispatchEvent({type:'pointerdown',pointerId:1,pointerType:'touch',target:hybrid.doc.body});assert(hybrid.T.enabled&&!hybrid.T.root.hidden,'Actual touch enables controls on a hybrid device');
 });
 check('joystick deadzone, reversal, deliberate drop cone and run use pointer geometry',()=>{
  const r=touchRig();assert.equal(r.T.context.name,'level1');assert(!r.T.root.hidden&&!r.stick.hidden);
  r.pointer(r.stick,'pointerdown',1,90,670);assert(!r.frame().move_right.held&&!r.manager.actionInput.held('move_left'));
  r.pointer(r.stick,'pointermove',1,100,670);assert(!r.frame().move_right.held,'Small drift stays in the deadzone');
  r.pointer(r.stick,'pointermove',1,110,670);assert(r.frame().move_right.held&&!r.manager.actionInput.held('run'));
  r.pointer(r.stick,'pointermove',1,144,670);assert(r.frame().move_right.held&&r.manager.actionInput.held('run'),'Outer horizontal travel runs');
  r.pointer(r.stick,'pointermove',1,36,670);assert(r.frame().move_left.held&&!r.manager.actionInput.held('move_right'),'Reversal releases the previous direction');
  r.pointer(r.stick,'pointermove',1,90,715);assert(r.frame().move_down.held&&!r.manager.actionInput.held('move_right')&&!r.manager.actionInput.held('move_left'));
  r.pointer(r.stick,'pointermove',1,135,715);assert(!r.frame().move_down.held&&r.manager.actionInput.held('move_right'),'Diagonal walking is not a deliberate platform drop');
  r.pointer(r.stick,'pointermove',1,5000,670);assert(r.frame().move_right.held,'Out-of-surface captured travel remains bounded and valid');
  r.pointer(r.stick,'pointerup',1,5000,670);assert(!r.frame().move_right.held&&!r.manager.actionInput.held('run'));assert.equal(r.T.pointers.size,0);
 });
 check('real pointer multitouch holds jump independently of the joystick',()=>{
  const r=touchRig();r.pointer(r.stick,'pointerdown',1,90,670);r.pointer(r.stick,'pointermove',1,125,670);r.press('jump',2);
  let state=r.frame();assert(state.move_right.held&&state.jump.held&&state.jump.pressed);assert.equal(r.T.pointers.size,2);
  r.pointer(r.stick,'pointerdown',3,70,670);assert.equal(r.T.pointers.size,2,'A second finger cannot steal the active joystick');
  r.release('jump',2);state=r.frame();assert(state.move_right.held&&!state.jump.held&&state.jump.released);
  r.pointer(r.stick,'pointerup',1,125,670);assert(!r.frame().move_right.held);
  r.press('jump',4);r.press('jump',5);state=r.frame();assert.equal(state.jump.presses.length,1,'Two fingers on one held action do not double-trigger');
  r.release('jump',4);assert(r.frame().jump.held);r.release('jump',5);assert(!r.frame().jump.held);
 });
 check('pointercancel and lost capture discard taps but preserve the physical key',()=>{
  for(const cancellation of ['pointercancel','lostpointercapture']){
   const r=touchRig();r.key('keydown','d');r.press('jump',2);r.release('jump',2,cancellation);
   const state=r.frame();assert(!state.jump.pressed&&!state.jump.held);assert(state.move_right.held,'Touch cancel preserves keyboard movement');
   assert.equal(r.T.pointers.size,0);assert.equal(r.manager.actionInput.virtualOwners.size,0);
  }
  const r=touchRig();r.tap('jump');const state=r.frame();assert(state.jump.pressed&&state.jump.released&&!state.jump.held,'A normal between-frame pointer tap survives');
 });
 check('refused capture releases outside the surface without consuming unrelated events',()=>{
  const r=touchRig();r.stick.setPointerCapture=()=>{throw Error('Capture refused');};r.key('keydown','d');
  r.pointer(r.stick,'pointerdown',1,90,670);r.pointer(r.stick,'pointermove',1,55,670);assert(r.frame().move_left.held);
  r.w.dispatchEvent({type:'pointerup',pointerId:1,pointerType:'touch',target:r.doc.body,clientX:5000,clientY:5000});
  const state=r.frame();assert(!state.move_left.held&&state.move_right.held);assert.equal(r.T.pointers.size,0);
  const unrelated={type:'pointerup',pointerId:99,pointerType:'touch',target:r.doc.body};r.w.dispatchEvent(unrelated);
  assert(!unrelated.defaultPrevented&&!unrelated.propagationStopped,'Unowned outside pointers keep normal browser behavior');
  const jump=r.button('jump');jump.setPointerCapture=()=>{throw Error('Capture refused');};r.press('jump',2);
  r.w.dispatchEvent({type:'pointercancel',pointerId:2,pointerType:'touch',target:r.doc.body});assert(!r.frame().jump.pressed);
 });
 check('focused button keyboard holds release by key and accessible clicks pulse',()=>{
  const r=touchRig(),event=(node,type,key,repeat=false)=>node.dispatchEvent({type,key,repeat,timeStamp:990,bubbles:true});
  const jump=r.button('jump'),beat=r.button('primary');event(jump,'keydown',' ');event(beat,'keydown','Enter');
  let state=r.frame();assert(state.jump.held&&state.primary.held&&state.jump.pressed&&state.primary.pressed);
  event(jump,'keydown',' ',true);assert(!r.frame().jump.pressed,'A repeated activation does not repeat an action');
  r.key('keyup',' ');state=r.frame();assert(!state.jump.held&&state.primary.held,'Space release cannot release an independently held Enter action');
  r.key('keyup','Enter');assert(!r.frame().primary.held);
  jump.dispatchEvent({type:'click',detail:0,timeStamp:990,bubbles:true});state=r.frame();assert(state.jump.pressed&&!state.jump.held,'Assistive click is a pulse');
  assert(!r.frame().jump.pressed);assert.equal(r.manager.actionInput.virtualOwners.size,0);
  r.key('keydown','d');jump.dispatchEvent({type:'click',detail:0,timeStamp:990,bubbles:true});assert(r.frame().move_right.held,'Accessible activation preserves held physical movement');
  r.w.cutsceneSystem={isActive:true,cutsceneGeneration:1,startSkipHold:()=>r.route.push(['skip','start']),endSkipHold:()=>r.route.push(['skip','stop'])};r.T.sync();r.more();r.route.length=0;
  const skip=r.button('intro:skip');event(skip,'keydown',' ');r.press('intro:skip',4);assert.deepEqual(r.route,[['skip','start']]);
  r.key('keyup',' ');assert.deepEqual(r.route.filter(row=>row[0]==='skip'),[['skip','start']],'Keyboard release preserves the held pointer skip');
  r.release('intro:skip',4);assert.deepEqual(r.route.filter(row=>row[0]==='skip'),[['skip','start'],['skip','stop']],'Last control releases the shared touch skip hold');
 });
 check('pause, resize, visibility and blur clean active touches and latched run',()=>{
  for(const event of ['resize','blur','visibilitychange']){
   const r=touchRig();r.more();r.tap('run');r.pointer(r.stick,'pointerdown',1,90,670);r.pointer(r.stick,'pointermove',1,125,670);r.press('jump',2);
   if(event==='visibilitychange'){r.doc.hidden=true;r.doc.dispatchEvent({type:event});}else r.w.dispatchEvent({type:event});
   assert.equal(r.T.pointers.size,0);assert.equal(r.T.runLatched,false);assert.equal(r.manager.actionInput.virtualOwners.size,0);
   assert(!r.frame().jump.pressed,'Interrupted tap does not leak into the next shared update');
  }
  const r=touchRig();r.more();r.tap('run');assert(r.T.runLatched);r.pointer(r.stick,'pointerdown',1,90,670);r.pointer(r.stick,'pointermove',1,125,670);r.press('jump',2);
  r.press('pause',3);assert.equal(r.T.context.name,'menu');assert.equal(r.T.pointers.size,0);assert(!r.T.runLatched);assert(!r.frame().jump.pressed);
  assert(r.T.buttons.has('menu:resume')&&!r.T.buttons.has('jump'),'Paused context has menu controls exclusively');
 });
 check('road faces and skills stay simultaneous and context changes release them',()=>{
  const r=roadRig({combat:true});r.pulses.push({id:'a',action:0,lane:1.5});r.state.pulseTargets.a=22;r.view().actors.push({threatActive:true});r.advance();
  for(const id of ['move_up','move_down','road:beat','road_defend'])assert(r.T.buttons.has(id),id);
  r.pointer(r.stick,'pointerdown',1,90,670);r.pointer(r.stick,'pointermove',1,125,670);
  r.press('road:beat',2);r.press('road_defend',3);let state=r.frame();assert(state.move_right.held&&state.road_a.pressed&&state.road_defend.pressed);
  r.release('road:beat',2);state=r.frame();assert(state.move_right.held&&state.road_defend.held&&!state.road_a.held);
  r.B.CacheRoadProof.status='failed';r.B.CacheRoadProof.resultButtons=()=>[{id:'retry',label:'Retry'},{id:'title',label:'Title'}];r.T.sync();
  assert.equal(r.T.context.name,'road-results');assert.equal(r.T.pointers.size,0);assert.equal(r.manager.actionInput.virtualOwners.size,0);
  assert(!r.T.buttons.has('road_a')&&r.T.buttons.has('road:result:retry'));assert.deepEqual(r.work,r.before,'No extra frame/work owners');
 });
 check('whole-game touch surfaces expose context controls and discard old holds',()=>{
  const r=touchRig(),surface=(name,ids)=>{r.T.sync();assert.equal(r.T.context.name,name);for(const id of ids)assert(r.T.buttons.has(id),name+' '+id);
   assert.equal(r.T.pointers.size,0,'Context handoff releases previous fingers');};
  const overlay=r.doc.createElement('div');overlay.id='startOverlay';overlay.style.display='flex';r.doc.body.appendChild(overlay);r.w.isRunning=false;
  surface('title',['title:start','title:settings']);r.doc.getElementById('continueButton').hidden=false;surface('title',['title:continue']);
  r.B.PauseMenu.titleOpen=true;surface('menu',['menu:up','menu:down','menu:left','menu:right','menu:select','menu:back','menu:resume']);
  r.B.PauseMenu.titleOpen=false;r.w.cutsceneSystem={isActive:true,cutsceneGeneration:1,userPaused:false,startSkipHold:owner=>r.route.push(['intro-hold',owner]),endSkipHold:owner=>r.route.push(['intro-release',owner])};
  surface('intro',['intro:dialogue','intro:scene','ui:more','pause']);r.more();for(const id of ['intro:transcript','intro:caption','intro:skip'])assert(r.T.buttons.has(id));r.press('intro:skip',1);r.press('intro:skip',2);
  assert.equal(r.route.filter(row=>row[0]==='intro-hold').length,1,'Two fingers share one continuous skip hold');
  r.release('intro:skip',1);assert.equal(r.route.at(-1)[0],'intro-hold','First finger release leaves the second hold');r.release('intro:skip',2);assert.equal(r.route.at(-1)[0],'intro-release');
  r.w.cutsceneSystem.userPaused=true;surface('intro-paused',['pause']);assert(!r.T.buttons.has('intro:scene'));
  r.w.cutsceneSystem.isActive=false;r.B.LevelDifficulty.open=true;surface('difficulty',['difficulty:left','difficulty:right','difficulty:recovery','difficulty:begin']);
  r.B.LevelDifficulty.open=false;overlay.classList.add('hidden');r.w.isRunning=true;r.w.tutorialSystem={storyChapter:1,isActive:()=>true,getInstructionOwner:()=> 'dialogue'};
  surface('level1',['jump','primary','tutorial:continue','ui:more','pause']);
  assert(!r.T.buttons.has('interact')&&!r.T.buttons.has('rhythm_mode'),'Unready Hack and early-tutorial Rhythm stay out of the default controls');
  r.more();for(const id of ['inspect','run'])assert(r.T.buttons.has(id));r.tap('ui:more');
  r.press('jump',1);r.w.hackingSystem={phase:'answer',isActive:()=>true};surface('hack',['hack:0','hack:1','hack:9','hack:Backspace','hack:Enter','hack:Escape','pause']);assert(r.stick.hidden);
  r.w.hackingSystem.isActive=()=>false;r.B.CacheBridge={active:true,generation:1,page:0,pending:false,holdSkip(){}};
  surface('comic',['comic:dialogue','ui:more','pause']);r.more();for(const id of ['comic:scene','comic:transcript','comic:skip','comic:back'])assert(r.T.buttons.has(id));
  r.setState('paused');surface('comic-paused',['pause']);r.setState('running');r.B.CacheBridge.active=false;
  r.B.CacheEnding={active:true,generation:1,page:0,pending:false,holdSkip(){}};surface('comic',['comic:dialogue','ui:more']);r.more();for(const id of ['comic:scene','comic:back'])assert(r.T.buttons.has(id));r.B.CacheEnding.active=false;
  r.w.gameState.victory=true;r.w.sector1Progression={areCompletionControlsReady:()=>true};surface('results',['result:retry','result:continue','result:title']);r.w.gameState.victory=false;
  r.B.CacheRoadProof.active=true;r.B.CacheRoadProof.introMs=0;surface('road-intro',['road:intro','pause']);
  r.B.CacheRoadProof.introMs=null;r.B.CacheRoadProof.outroMs=0;surface('road-outro',['road:outro','pause']);
  r.B.CacheRoadProof.outroMs=null;r.B.CacheRoadProof.presentationPreparing=true;surface('loading',[]);assert(r.T.root.hidden);
  r.B.CacheRoadProof.presentationPreparing=false;r.B.CacheRoadProof.active=false;
  r.B.RunAndGunProof={active:true,status:'playing'};surface('level3',['jump','inspect','pause']);r.B.RunAndGunProof.status='failed';surface('proof-results',['proof:retry','proof:exit','pause']);
  assert.deepEqual(r.work,r.before,'Whole-game context changes add no extra Canvas/frame/time owner');
 });
 check('readable selected menu values follow the real owner without rebuilding controls',()=>{
  const r=rig();r.load('src/game/lore-records.js');r.load('src/game/pause-menu.js');const menu=r.B.PauseMenu;
  r.setState('paused');menu.open=true;menu.focus=0;r.load('src/core/touch-controls.js');const T=r.B.TouchControls;
  assert.equal(T.readout.hidden,false);assert.match(T.readout.textContent,/Music\n100%/);
  const button=T.buttons.get('menu:left').node;r.manager.touchCommand('menu:left');T.sync();assert.match(T.readout.textContent,/Music\n95%/);
  assert.equal(T.buttons.get('menu:left').node,button,'Changing a value in one menu context does not rebuild input controls');
  r.manager.touchCommand('menu:down');T.sync();assert.match(T.readout.textContent,/SFX\n100%/);
  menu.view='controller';menu.controllerFocus=0;T.sync();assert.match(T.readout.textContent,/deadzone/i);assert.match(T.readout.textContent,/%/);
  menu.controllerFocus=3;T.sync();assert.match(T.readout.textContent,/Jump/);assert(T.readout.textContent.includes(r.B.ControllerSettings.button(r.B.ControllerSettings.bindings.jump)));
  menu.view='timing';menu.timingFocus=0;r.B.Preferences.values.inputOffsetMs=35;T.sync();assert.match(T.readout.textContent,/\+35 ms/);
  menu.view='archive';menu.archiveLevel=1;menu.archiveFocus=0;T.sync();assert.match(T.readout.textContent,/UNRECOVERED/);
  const record=r.B.LoreRecords.level1[0];r.w.lostDataSystem={archive:{getIds:()=>[record.id],status:'ready'}};T.sync();assert(T.readout.textContent.includes(record.title));assert.match(T.readout.textContent,/RECOVERED/);
  menu.view='crew';r.w.tutorialSystem={recentDialogue:[{speaker:'Cache Back',text:'Keep the original.'}]};T.sync();assert.match(T.readout.textContent,/Cache Back: Keep the original\./);
  const readoutEvent={type:'pointerdown',pointerId:99,pointerType:'touch',clientX:100,clientY:500,bubbles:true};T.readout.dispatchEvent(readoutEvent);
  assert(!readoutEvent.defaultPrevented&&readoutEvent.propagationStopped,'Readout text keeps native pan/selection without reaching underlying controls');assert.equal(T.pointers.size,0);
  let writes=0,text=T.readout.textContent;Object.defineProperty(T.readout,'textContent',{get:()=>text,set:value=>{writes++;text=value;}});T.sync();T.sync();assert.equal(writes,0,'Unchanged readout does not write DOM every frame');
  r.setState('running');r.w.tutorialSystem={isActive:()=>false};T.sync();assert(T.readout.hidden&&!T.readout.textContent,'Menu readout is hidden during gameplay');
  r.B.LevelDifficulty.profile=()=>({choices:[{label:'RELAXED',description:'More time.'},{label:'STANDARD',description:'Regular rhythm.'},{label:'OVERCLOCKED',description:'Faster enemies.'}]});
  r.B.LevelDifficulty.open=true;r.B.LevelDifficulty.selected=1;T.sync();assert.match(T.readout.textContent,/STANDARD/);
  r.B.LevelDifficulty.selected=2;T.sync();assert.match(T.readout.textContent,/OVERCLOCKED/);
 });
 console.log('PASS: '+count+' touch action contracts');
}
if(require.main===module)run();
module.exports={rig,plain,run};
