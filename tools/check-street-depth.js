// Production draw ordering, scenery visibility, and retained route contract.
const assert=require('assert');
const {createRig,load}=require('./check-level-01-boss');
const {w,p,context}=createRig();p.startMission();
const props=w.Sector1Progression.TRAVERSAL_PROPS;
assert.strictEqual(props.filter(p=>p.h>30).length,1,'one large street prop');
assert.strictEqual(props.find(p=>p.h>30).asset,'broadcastTerminal');
assert(props.find(p=>p.h>30).x<1000,'single terminal supplies the left entry route');
assert(w.Sector1Progression.SIGNAL_LIFT.x>2048 && w.Sector1Progression.SIGNAL_LIFT.x<3000,'lift sits in the middle-right');
assert(!p.getStageSurfaces().some(p=>['firewall-utility-unit','broadcast-utility-unit'].includes(p.id)),'removed boxes leave no invisible collision');
const original=w.sector1Progression;
load(context,'src/game/render-coordinator.js');
const order=[];
const originalJammer=w.BARCODE.JammerEnvironment;
w.BARCODE.JammerEnvironment={draw:()=>order.push('jammer')};
w.sector1Progression={drawTraversalProps:()=>order.push('props'),drawEncounterHardware:()=>order.push('hardware'),draw:()=>order.push('progression')};
w.enemyManager.draw=(ctx,roofPass)=>order.push(roofPass?'roofEnemy':'enemy');
w.lostDataSystem={draw:()=>order.push('lostData')};
w.drawGameEntities({});
assert.deepStrictEqual(order,['props','jammer','hardware','enemy','progression','roofEnemy','lostData'],'solid props precede actors; roof enemies follow the lift and other enemies retain their depth');
w.sector1Progression=original;
w.BARCODE.JammerEnvironment=originalJammer;
let draws=0,filters=0;const stack=[];
const c={canvas:{width:1920,height:1080},globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),
 save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},set filter(v){filters++;}};
w.BARCODE.PresentationAssets={ready:()=>true,draw(){draws++;return true;}};
const gates=w.Sector1Progression.ENCOUNTER_GATES;
p.drawBarrierHardware(c,gates[0],false,0);assert.strictEqual(draws,1,'one image for visible active hardware');
draws=0;p.drawBarrierHardware(c,gates[0],true,1);assert.strictEqual(draws,1,'one image for visible cleared hardware');
draws=0;p.drawBarrierHardware(c,gates[0],true,.5);assert.strictEqual(draws,2,'opening only crossfades the two states');
draws=0;p.drawBarrierHardware(c,gates[3],true,1);assert.strictEqual(draws,0,'offscreen cleared gate costs no draws');
assert.strictEqual(filters,0,'no per-frame rail filters');assert.strictEqual(stack.length,0,'canvas state balanced');
c.getTransform=()=>({a:.6,b:0,c:0,d:.6,e:-1200,f:650});
assert(p.isSceneryVisible(c,3150,-314,194,230),'upper scenery stays visible through zoom/camera');
console.log('Street depth: production layering, one large prop, no ghost boxes, camera-aware culling, 1–2 hardware draws and zero live filters passed.');

// The terminal exists before mission activation, with the same visible top
// and collider. Mission rewards and optional high steps retain their gates.
{
 const {w,p}=createRig();p.reset();
 const terminal=w.Sector1Progression.TRAVERSAL_PROPS.find(prop=>prop.asset==='broadcastTerminal');
 assert(p.getStageSurfaces().some(s=>s.id===terminal.id),'terminal support exists in training');
 assert(!p.getStageSurfaces().some(s=>s.id==='signal-high-step'),'other route unlocks are retained');
 assert.strictEqual(w.Player.GROUND_Y+72-terminal.y-terminal.h,12,'lower sidewalk remains open below the box');
 const images=[];w.BARCODE.PresentationAssets={draw(key,ctx,pose){images.push({key,pose});return true;}};
 const ctx=new Proxy({getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})},{get:(o,k)=>o[k]??(()=>{})});
 p.drawTraversalProps(ctx);assert.strictEqual(images.length,1);assert.strictEqual(images[0].key,'broadcastTerminal');
 const initial=JSON.stringify(images[0]);p.startMission();images.length=0;p.drawTraversalProps(ctx);
 assert.strictEqual(JSON.stringify(images.find(i=>i.key==='broadcastTerminal')),initial,'mission start does not move, spawn or replace terminal');
 p.reset();images.length=0;p.drawTraversalProps(ctx);assert.strictEqual(JSON.stringify(images[0]),initial,'restart preserves its initial presentation');
 Object.assign(w.player.position,{x:terminal.x+80,y:terminal.y+4-72});w.player.velocity.y=100;
 assert(p.applyPlayerStageCollision(w.player,{previousFootY:terminal.y-4-72,currentFootY:terminal.y+4-72}));
 assert.strictEqual(w.player.position.y+72,terminal.y,'training landing matches the drawn top');
 images.length=0;p.drawRepairRoute(ctx);assert.strictEqual(images.length,0,'no reward pass draws the terminal again');
}

// Inspect actual production image calls under camera and zoom transforms.
// The distant layer stays one size; foreground geometry keeps its world size.
{
 const {w,context}=createRig();load(context,'src/engine/parallax.js');load(context,'src/game/combat-fx.js');
 const bg=new w.ParallaxBackground(),image={width:2048,height:740};
 const layer=bg.addLayer({image,scrollFactorX:0.5});bg.addLayer({image,scrollFactorX:1});
 let matrix={a:1,b:0,c:0,d:1,e:0,f:0},ops=[],stack=[];
 const ctx=new Proxy({
  getTransform:()=>({...matrix}),
  save(){stack.push({...matrix});},restore(){matrix=stack.pop();},
  setTransform(a,b,c,d,e,f){matrix={a,b,c,d,e,f};},
  translate(x,y){matrix.e+=matrix.a*x;matrix.f+=matrix.d*y;},scale(x,y){matrix.a*=x;matrix.d*=y;},
  drawImage(...args){ops.push({kind:'image',args:args.slice(1),matrix:{...matrix}});},
  moveTo(...args){ops.push({kind:'rain',args});},fillRect(...args){ops.push({kind:'light',args,alpha:this.globalAlpha});}
 },{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 for(const zoom of [0.4,0.625,0.8,1,1.2])for(const cameraX of [960,2048,3136])for(const cameraY of [0,-520,-1040]){
  matrix={a:zoom,b:0,c:0,d:zoom,e:960*(1-zoom)+4,f:675*(1-zoom)-cameraY*.3*zoom-3};
  const before={...matrix};ops=[];w.gameCamera={centerX:cameraX,y:cameraY};bg.updateCamera(cameraX,856);bg.drawLayer(ctx,layer);
  const call=ops.find(o=>o.kind==='image'),[x,y,width,height]=call.args;
  assert.strictEqual(width,4600);assert.strictEqual(height,4600*740/2048);
  assert.deepStrictEqual(call.matrix,{a:1,b:0,c:0,d:1,e:0,f:0},'gameplay zoom cannot resize skyline');
  assert(x<=0&&y<=0&&x+width>=1920&&y+height>=1080,'fixed art covers the full viewport, including roof travel');
  assert.deepStrictEqual(matrix,before,'foreground transform is restored');assert.strictEqual(stack.length,0);
 }
 const sample=()=>{ops=[];bg.drawLayer(ctx,layer);return JSON.stringify(ops);};
 const still=sample();assert.strictEqual(sample(),still,'render does not advance animation state');
 w.BARCODE.combatFX.update(400);assert.notStrictEqual(sample(),still,'existing gameplay clock animates the skyline');
 w.gameState.paused=true;const paused=sample();w.BARCODE.combatFX.update(1000);assert.strictEqual(sample(),paused,'pause freezes background animation');
 w.BARCODE.combatFX.reset();assert.strictEqual(sample(),still,'restart resets background motion');
 w.BARCODE_RENDER_QUALITY={flashes:false};const low=sample();w.gameState.paused=false;w.BARCODE.combatFX.update(400);
 const lights=ops.filter(o=>o.kind==='light');sample();assert.deepStrictEqual(ops.filter(o=>o.kind==='light'),lights,'reduced-flash setting keeps city lights steady');
 assert(low.length>0);
}
console.log('Terminal from training/reset, 12px walking lane, aligned landing, hologram order; 45 sky camera/zoom cases and deterministic pause/reset animation passed.');

// Fitted geometry must not leave invisible old boundaries or erase opened
// ones late. Exercise every production gate, including both roof and street.
{
 const {w,p}=createRig();p.startMission();
 const geometry=require('../assets/street-hardware/geometry.json');
 for(const [i,g] of w.Sector1Progression.ENCOUNTER_GATES.entries()) {
  const {path}=p.getGateGeometry(g),box=p.getGateHardwareLayout(g);
  assert.strictEqual(path[1][0],g.x+g.w/2,'track crosses the blocking strip at actor feet');
  assert.strictEqual(path[2][0],path[3][0],'curb drop is vertical');
  assert.strictEqual(path[3][1]-path[2][1],4,'track traverses the live curb');
  assert(path[4][1]>1080,'track reaches beyond the road edge');
  for(const field of ['left','top','width','height'])assert.strictEqual(geometry[i][field],box[field],'baked hardware keeps the current registered bounds');
  p.state=g.encounterId;p.spawnedEncounterIds.add(g.encounterId);p.closedGateEncounterId=g.encounterId;
  for(const y of [w.Player.GROUND_Y,-360]) {
   Object.assign(w.player.position,{x:g.x+20,y});w.player.velocity.x=300;
   p.applyGateCollision();assert.strictEqual(w.player.position.x,g.x-w.player.width/2,'field and blocking boundary move together at both heights');
  }
  p.openEncounterGate(g.encounterId);
  w.player.position.x=g.x+20;p.applyGateCollision();assert.strictEqual(w.player.position.x,g.x+20,'cleared track remains passable');
 }
 assert(w.Sector1Progression.ENCOUNTER_GATES[0].curbX<w.Sector1Progression.ENCOUNTER_GATES[0].mountX);
 assert(w.Sector1Progression.ENCOUNTER_GATES[3].curbX>w.Sector1Progression.ENCOUNTER_GATES[3].mountX,'right district follows its rightward paving perspective');
}

// Calm story and compact action cues alternate; Continue stays in story.
{
 const {w,context}=createRig();load(context,'src/game/comic-hud.js');load(context,'src/game/tutorial.js');
 const t=new w.TutorialSystem();t.startTutorial();
 w.rhythmSystem.hideRhythmMode();
 const lines=[];const c=new Proxy({globalAlpha:1,fillText(text,x,y){
  if(t.getInstructionOwner()==='dialogue'){const box=t._dialogueLayout;assert(y>=box.y&&y<=box.y+box.height,'story fits its clear reading area');}
  else {const box=t._taskLayout;assert(x>=box.x&&x<=box.x+box.width&&y>=box.y&&y<=box.y+box.height,'action text fits its compact card');assert.equal(box.width,564);assert(box.height<=158);}
  lines.push(text);
 },measureText(text){return {width:text.length*12};}},{get:(o,k)=>o[k]??(()=>{})});
 t.handleSpacePress();t.draw(c);assert(lines.some(x=>x.includes('original studio take')));assert(!lines.includes('Move left or right'));
 for(let i=0;i<4;i++){if(!t.readyToAdvance)t.handleSpacePress();t.handleSpacePress();}
 lines.length=0;t.draw(c);assert(lines.includes('Move left or right'));assert(lines.includes('← / →'));assert(!lines.some(x=>x.includes('Press Space')));
 t.completeObjective('movement');lines.length=0;t.draw(c);assert(lines.includes('Jump'));assert(!lines.includes('Move left or right'));
 t.startChapter(4);t.currentDialogue=t.dialogue.length-1;t.startNextDialogue();t.handleSpacePress();
 w.BARCODE.GamepadUI={connected:true};w.BARCODE.ControllerSettings={button:()=> 'Create'};
 lines.length=0;t.draw(c);assert(lines.includes('Press Create button to continue'));assert(!lines.includes('OBJECTIVES'));assert(!lines.some(x=>x.includes('completed actions')));
 for(const h of [{isActive:()=>true},{feedback:{}},{resultFx:{}}]){w.hackingSystem=h;lines.length=0;t.draw(c);assert.equal(lines.length,0,'terminal owns instructions including result');assert(!t.handleSpacePress());}
}
console.log('Fitted gates: registered bake, mirrored pavement, roof/street blocking and open passage; tutorial next-action cues passed.');

// Relocated terminal pixels and pointer hit regions must agree after the real
// camera/zoom projection. Exercise both target sides, moving targets and roofs.
{
 const {w,p,context}=createRig();load(context,'src/game/render-coordinator.js');load(context,'src/game/hacking.js');
 p.startMission();w.rhythmSystem.hideRhythmMode();w.hackingSystem=new w.HackingSystem();
 const h=w.hackingSystem,rects=[],stack=[];let matrix={x:0,y:0,scale:1};
 const c=new Proxy({globalAlpha:1,
  save(){stack.push({...matrix});},restore(){matrix=stack.pop();},
  translate(x,y){matrix.x+=x*matrix.scale;matrix.y+=y*matrix.scale;},scale(x,y){assert.equal(x,y);matrix.scale*=x;},
  fillRect(x,y,width,height){rects.push({x:matrix.x+x*matrix.scale,y:matrix.y+y*matrix.scale,width:width*matrix.scale,height:height*matrix.scale});},
  measureText(text){return {width:text.length*12};}
 },{get:(o,k)=>o[k]??(()=>{})});
 const canvasRect={left:71,top:40,width:960,height:540};
 w.document.getElementById=()=>({getBoundingClientRect:()=>canvasRect});
 const tap=(x,y)=>h.pointerInput({clientX:71+x/2,clientY:40+y/2});
 const draw=()=>{rects.length=0;h.draw(c);return rects[0];};
 const clearOf=(box,actor)=>assert.equal(w.BARCODE.OverlayLayout.overlap(box,w.BARCODE.OverlayLayout.actorBounds(actor)),0,'panel clears the projected actor, including its visual margin');
 for(const zoom of [0.4,0.735,1,1.2])for(const cy of [0,-240,-700])for(const side of [-1,1]){
  h.reset();w.player.grounded=true;Object.assign(w.player.position,{x:1800,y:784+cy});
  const target=new w.Enemy(1800+side*300,784+cy,'firewall');
  Object.assign(target.position,{x:1800+side*300,y:784+cy});Object.assign(target,{entranceComplete:true,spawnProtectionDuration:0,spawnTimeMs:-10000});
  w.enemyManager.enemies=[target];w.gameCamera={centerX:1800,y:cy};
  w.BARCODE.sceneProjection.capture({getTransform:()=>({a:zoom,b:0,c:0,d:zoom,e:960*(1-zoom)+3*zoom,f:675*(1-zoom)-2*zoom})});
  assert(h.start());h.update(h.bootDurationMs+h.displayTime+1);assert.equal(h.phase,'answer');
  let box=draw();clearOf(box,target);clearOf(box,w.player);assert(box.y>=225&&box.x>=26&&box.x+box.width<=1894&&box.y+box.height<=1054);
  const stable=JSON.stringify(box);assert.equal(JSON.stringify(draw()),stable,'stationary content does not shuffle the panel');
  const time=h.phaseElapsedMs;
  for(const digit of ['1','6','0']){
   h.inputText='';const key=h.getKeypad().find(k=>k.key===digit);
   assert(rects.some(r=>Math.abs(r.x-key.x)<.001&&Math.abs(r.y-key.y)<.001&&Math.abs(r.width-key.w)<.001&&Math.abs(r.height-key.h)<.001),'pointer region equals the drawn key');
   assert(tap(key.x+key.w/2,key.y+key.h/2));assert.equal(h.inputText,digit);
  }
  assert.equal(h.phaseElapsedMs,time,'layout and input do not spend puzzle time');
  target.position.x=1800-side*300;box=draw();clearOf(box,target);clearOf(box,w.player);
  h.inputText=h.currentPuzzle.answer;const submit=h.getKeypad().find(k=>k.key==='Enter');tap(submit.x+submit.w/2,submit.y+submit.h/2);
  assert(!h.active&&w.enemyManager.isHijacked(target),'relocated Submit converts the locked target');
  box=draw();clearOf(box,target);clearOf(box,w.player);
  w.enemyManager.releaseHijack(target);target._hijackRebootUntilMs=0;h.reset();assert(h.start());draw();
  const layout=h.panelLayout;tap(layout.x+660*layout.scale,layout.y+30*layout.scale);assert(!h.active,'relocated Cancel is clickable');
  h.reset();assert(!h.panelLayout&&!h.resultLayout&&!h.resultFx,'reset drops layout and target references');
 }
 // A crowded street needs the short keypad instead of a tall side panel.
 Object.assign(w.player.position,{x:960,y:784});w.gameCamera={centerX:960,y:0};
 w.BARCODE.sceneProjection.capture({getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})});
 w.enemyManager.enemies=[100,450,700,1220,1580,1810].map(x=>{
  const e=new w.Enemy(x,784,'firewall');Object.assign(e.position,{x,y:784});Object.assign(e,{entranceComplete:true,spawnProtectionDuration:0,spawnTimeMs:-10000});return e;
 });
 assert(h.start());h.update(h.bootDurationMs+h.displayTime+1);const compact=draw();assert(h.panelLayout.compact&&h.panelLayout.clear);
 for(const actor of [w.player,...w.enemyManager.enemies])clearOf(compact,actor);
 h.keypadIndex=5;h.navigateKeypad(0,1);assert.equal(h.keypadIndex,11,'six-column keypad moves down to Submit');h.navigateKeypad(-1,0);assert.equal(h.keypadIndex,10);
 for(const digit of ['6','7','0']){h.inputText='';const key=h.getKeypad().find(k=>k.key===digit);tap(key.x+key.w/2,key.y+key.h/2);assert.equal(h.inputText,digit);}
 const erase=h.getKeypad().find(k=>k.key==='Backspace');tap(erase.x+erase.w/2,erase.y+erase.h/2);assert.equal(h.inputText,'');
 h.inputText=h.currentPuzzle.answer;h.keypadIndex=11;h.activateKeypad();assert.equal(h.resultFx.outcome,'success','compact keyboard/controller/pointer layout retains submission');
 w.enemyManager.releaseHijack();h.reset();w.enemyManager.enemies=w.enemyManager.enemies.filter(e=>!e._hijackRebootUntilMs);
 assert(h.start());h.update(h.bootDurationMs+h.displayTime+1);const locked=h.hijackTarget,phase=h.phase,elapsed=h.phaseElapsedMs,session=h.sessionElapsedMs;
 w.enemyManager.enemies=[locked,...[300,550,800].flatMap(y=>[200,600,1000,1400,1800].map(x=>{
  const e=new w.Enemy(x,y,'firewall');Object.assign(e.position,{x,y});Object.assign(e,{entranceComplete:true,spawnProtectionDuration:0,spawnTimeMs:-10000});return e;
 }))];
 assert(!h.getPanelLayout().clear,'actors can occupy every readable panel location');rects.length=0;h.draw(c);assert.equal(rects.length,0,'an occupied terminal does not cover enemies');
 h.update(8000);assert.equal(h.phase,phase);assert.equal(h.phaseElapsedMs,elapsed);assert.equal(h.sessionElapsedMs,session);assert(!h.processInput('1'),'an unseen puzzle cannot consume input or expire');
 assert(h.processInput('Escape')&&!h.active,'Escape remains available while the panel waits');
}
console.log('Overlay clearance: 24 camera/zoom/target cases, stable placement, moved targets, drawn keypad hit regions, pointer submit/cancel, result clearance and reset passed.');
