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

// Actual tutorial drawing must offer a next action in the completed-task gap.
{
 const {w,context}=createRig();load(context,'src/game/tutorial.js');
 const t=new w.TutorialSystem();
 Object.assign(t,{active:true,dialogue:[{speaker:'cache',text:'Still with you.'}],currentText:'Still with you.',targetText:'Still with you.',readyToAdvance:true,objectives:[{id:'movement',text:'Move left and right',completed:false}]});
 const lines=[];const c=new Proxy({globalAlpha:1,fillText(text,x,y){if(x>=1450&&y<500)lines.push(text);},measureText(text){return {width:text.length*10};}},{get:(o,k)=>o[k]??(()=>{})});
 t.draw(c);assert(lines.includes('□ Move left and right'));assert(!lines.includes('Continue crew briefing'));
 t.objectives[0].completed=true;lines.length=0;t.draw(c);
 assert(lines.includes('Continue crew briefing')&&lines.includes('Space: Continue'));
 w.BARCODE.GamepadUI={connected:true};w.BARCODE.ControllerSettings={button:()=> 'Create'};
 lines.length=0;t.draw(c);assert(lines.includes('Create: Continue'),'cue matches existing controller dialogue ownership');
 t.storyChapter=4;t._finalMessageSequenceArmed=true;lines.length=0;t.draw(c);
 assert(lines.includes('Entering the next section…'));assert(!lines.includes('Create: Continue'),'automatic transition does not request another press');
}
console.log('Fitted gates: registered bake, mirrored pavement, roof/street blocking and open passage; tutorial next-action cues passed.');
