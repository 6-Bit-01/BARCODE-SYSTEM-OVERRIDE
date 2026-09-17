// Exercise production placement/transition/input state, not a parallel UI model.
const assert=require('assert');
const {createRig,load}=require('./check-level-01-boss');
const {rig}=require('./check-tutorial-flow');
const {w}=createRig();w.rhythmSystem.hideRhythmMode();w.gameCamera={centerX:960,y:0};
const ui=w.BARCODE.OverlayLayout,owner={};w.gameState.gameTime=0;
const actor=(x,y,width=80,height=140)=>({position:{x,y},getHitbox:()=>({x,y,width,height})});
const variant=[{width:600,height:220}];
const first=ui.present(owner,'test',variant,{actors:[]});
const foe=actor(first.x+140,first.y+30);
const begin=ui.present(owner,'test',variant,{actors:[foe]});
assert(begin.moving&&!begin.readable&&begin.alpha<0.3,'crossed panel dissolves immediately while preserving its line');
assert(begin.cutouts.length,'actor pixels are removed during the crossing');
let clips=0;ui.begin({globalAlpha:1,beginPath(){},rect(){},clip(rule){assert.equal(rule,'evenodd');clips++;}},begin);
assert.equal(clips,begin.cutouts.length);
w.gameState.gameTime=130;const middle=ui.present(owner,'test',variant,{actors:[foe]});
w.gameState.gameTime=300;const end=ui.present(owner,'test',variant,{actors:[foe]});
assert(end.readable&&!end.moving);assert.equal(ui.overlap(end,ui.actorBounds(foe)),0);
assert(Math.hypot(middle.x-first.x,middle.y-first.y)>0,'panel actually glides');
assert(Math.hypot(middle.x-end.x,middle.y-end.y)>0,'glide has an intermediate position');
const stable=JSON.stringify(end);w.gameState.gameTime=2000;
assert.equal(JSON.stringify(ui.present(owner,'test',variant,{actors:[]})),stable,'vacated space never makes a readable panel chase the player back');
const flood=[actor(0,210,1920,900)];
const dock=ui.present(owner,'test',variant,{actors:flood});assert(dock.docked&&!dock.readable);
w.gameState.gameTime=2100;assert(ui.present(owner,'test',variant,{actors:[]}).docked,'brief opening keeps the saved-line tab steady');
w.gameState.gameTime=2500;ui.present(owner,'test',variant,{actors:[]});
w.gameState.gameTime=2800;assert(ui.present(owner,'test',variant,{actors:[]}).readable,'sustained safe opening restores the whole line');
// Two intersecting cutouts must be subtracted independently, never XORed.
const many=ui.present({},'mask',variant,{actors:[...flood,...flood]});clips=0;
ui.begin({globalAlpha:1,beginPath(){},rect(){},clip(){clips++;}},many);assert(clips>=1);
w.BARCODE.Preferences={values:{reducedMotion:true}};
const reducedOwner={};const r1=ui.present(reducedOwner,'test',variant,{actors:[]});
const r2=ui.present(reducedOwner,'test',variant,{actors:[actor(r1.x+200,r1.y+40)]});
assert(r2.readable&&!r2.moving,'reduced motion relocates directly without a glide or dissolve');
// Tutorial contents, Continue and reading clocks survive real crowding.
{
 const r=rig(),{w,t}=r;w.player.grounded=false;w.player.velocity.x=200;t.update(100);
 assert.equal(t.getInstructionOwner(),'dialogue');assert(t.getDialogueLayout().readable);
 t.handleSpacePress();const full=t.currentText,cursor=t.currentDialogue;
 w.enemyManager.enemies=[Object.assign(actor(0,210,4000,1300),{active:true})];
 const held=t.getDialogueLayout();assert(held.docked&&!held.readable);
 t.update(3000);assert.equal(t.currentText,full);assert.equal(t.currentDialogue,cursor);assert(!t.handleSpacePress());
 w.enemyManager.enemies=[];t.getDialogueLayout();w.gameState.gameTime+=400;t.getDialogueLayout();w.gameState.gameTime+=300;
 assert(t.getDialogueLayout().readable);assert.equal(t.currentText,full);
 t.startTutorial();assert.equal(Object.keys(t._overlayPanels).length,0,'restart discards layout state');
}
// Active hacking reserves solid controls; crowds cannot erase or disable them.
{
 const r=createRig(),{w,context}=r;load(context,'src/game/hacking.js');const h=w.hackingSystem=new w.HackingSystem();
 w.tutorialSystem.active=true;w.tutorialSystem.storyChapter=3;w.tutorialSystem.completed=false;w.tutorialSystem.completedObjectives=new Set();
 w.player.grounded=true;assert(h.start());h.update(h.bootDurationMs+h.displayTime+1);assert.equal(h.phase,'answer');
 const layout=h.getPanelLayout(),elapsed=h.phaseElapsedMs;h.panelLayout=layout;
 w.enemyManager.enemies=[Object.assign(actor(0,0,8000,3000),{active:true})];
 assert.deepEqual(h.getPanelLayout(),layout);assert(layout.readable&&layout.alpha===1&&!layout.moving&&!layout.cutouts.length);
 w.document.getElementById=()=>({getBoundingClientRect:()=>({left:0,top:0,width:1920,height:1080})});
 const key=h.getKeypad().find(k=>k.key==='1');assert(h.pointerInput({clientX:key.x+10,clientY:key.y+10}));assert.equal(h.inputText,'1');
 h.update(100);assert(h.phaseElapsedMs>elapsed,'visible usable puzzle keeps its clock');
 assert(h.getSceneViewport().x+h.getSceneViewport().width<layout.x,'live action and controls have separate space');
 assert(h.processInput('Escape'));assert(!h.active);assert.equal(h.getSceneViewport(),null);
}
console.log('Smart boxes: original dialogue glide/cutouts/crowd recovery and retained reading; solid, stable, usable hack controls under crowding passed.');
