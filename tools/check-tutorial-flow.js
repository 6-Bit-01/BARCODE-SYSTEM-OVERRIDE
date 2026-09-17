// Real tutorial/input/rhythm/hack/enemy owners. Only browser/device boundaries
// and defeat events are supplied; no separate model of tutorial transitions.
const assert = require('assert');
const { createRig, load } = require('./check-level-01-boss');
const { createSprite, playerClips } = require('./makko-animation-fixture');
function rig(fps = 60, device = 'keyboard') {
  const r = createRig(), { w, context } = r;
  for (const file of ['src/core/action-input.js', 'src/core/gamepad-ui.js', 'src/core/input.js', 'src/game/hacking.js', 'src/game/tutorial.js']) load(context, file);
  w.hackingSystem = new w.HackingSystem();
  w.tutorialSystem = new w.TutorialSystem();
  w.inputManager = new w.InputManager();
  w.player.sprite = createSprite(playerClips); w.player.spriteReady = true; w.player.playAnimation('idle'); w.player.allowMovement = true;
  const pad = { id: device === 'playstation' ? 'Sony DualSense' : 'Xbox Controller', mapping: 'standard', connected: true,
    axes: [0, 0], buttons: Array.from({length:17}, () => ({pressed:false})) };
  w.navigator.getGamepads = () => device === 'keyboard' ? [] : [pad];
  const t = w.tutorialSystem; t.startTutorial();
  function step(ms = 1000 / fps) {
    w.inputManager.update();
    if (!w.gameState.paused && !w.isPaused) {
      r.tick(ms); w.player.update(ms, true); w.rhythmSystem.update(ms);
      w.hackingSystem.update(ms); w.updateEnemies(ms); t.update(ms);
    }
  }
  function advance(ms) { for (let n = 0; n < ms;) { const dt = Math.min(1000 / fps, ms - n); step(dt); n += dt; } }
  function key(value, type = 'keydown', repeat = false) {
    for (const fn of r.listeners[type] || []) fn({key:value,repeat,preventDefault(){}});
  }
  function tapKey(value) { key(value); step(); key(value, 'keyup'); step(); }
  function tapPad(button) { pad.buttons[button].pressed = true; step(); pad.buttons[button].pressed = false; step(); }
  function pressContinue() { if (device === 'keyboard') tapKey(' '); else tapPad(8); }
  function acknowledge() { if (!t.readyToAdvance) pressContinue(); pressContinue(); }
  function ground() { w.player.position.y = 784; w.player.velocity.x = w.player.velocity.y = 0; w.player.grounded = true; }
  function defeat(enemy) { enemy.active = false; enemy.health = 0; w.enemyManager.recordDefeat(enemy); }
  step();
  return { ...r, t, pad, step, advance, key, tapKey, tapPad, acknowledge, pressContinue, ground, defeat, device };
}
function main() {
  {
    const r=rig(),{t,w}=r;
    r.tapKey('w');const cursor=t.currentDialogue,typed=t.currentText,index=t.characterIndex;
    assert.equal(t.getInstructionOwner(),'task','jump replaces unread story with the next compact task');
    t.update(800);assert.equal(t.currentText,typed);assert.equal(t.characterIndex,index);
    assert(!t.handleSpacePress());assert.equal(t.currentDialogue,cursor,'hidden story cannot consume Continue');
    t.checkObjective('movement');assert.equal(t.getInstructionOwner(),'play','no task leaves the playfield clear');
    r.ground();assert.equal(t.getInstructionOwner(),'dialogue');t.update(100);assert(t.characterIndex>index,'reading resumes at its saved cursor');
    t.startChapter(4);for(let n=0;n<4;n++)r.acknowledge();r.pressContinue();t.update(0);
    assert(t.isFinalMessage);const elapsed=t.finalMessageTimer;
    w.player.grounded=false;t.update(20000);assert(t.active&&t.finalMessageTimer===elapsed,'hidden closing dialogue cannot time out');
    r.ground();t.update(12000-elapsed);assert(t.completed);
  }
  {
    const {t} = rig(); const counts = [], speakers = new Set();
    for (let c = 0; c < 5; c++) { t.startChapter(c); counts.push(t.dialogue.length); t.dialogue.forEach(d => speakers.add(d.speaker)); }
    assert.deepStrictEqual(counts, [4,3,4,4,5]); assert.strictEqual(counts.reduce((a,b)=>a+b),20);
    assert.deepStrictEqual([...speakers].sort(), ['6bit','cache','dj','mac']);
  }
  for (const fps of [30,60,120]) for (const device of ['keyboard','playstation','xbox']) {
    const r = rig(fps, device), {w,t} = r;
    assert(!w.hackingSystem.start()); assert(!w.rhythmSystem.show().ok, 'future abilities stay locked');
    assert(!t.checkObjective('hack_complete')); assert(!t.checkObjective('rhythm_combo'));
    // Jump before movement, while Cache is still speaking. No repeated work,
    // cut-off story, extra jump from Continue, or early enemies.
    if (device === 'keyboard') r.tapKey('w'); else r.tapPad(0);
    assert(t.completedObjectives.has('jump')); assert(!t.completedObjectives.has('movement'));
    assert.equal(t.getObjectivePresentation().title, 'Move left or right');
    if (device === 'keyboard') r.tapKey('d'); else { r.pad.axes[0] = 1; r.step(); r.pad.axes[0] = 0; r.step(); }
    assert(t.completedObjectives.has('movement')); assert.equal(t.currentDialogue,0);
    assert(t.targetText.includes('original studio take'));
    assert.equal(t.getObjectivePresentation(), null, 'Continue belongs only to the story footer');
    r.ground(); r.acknowledge(); assert(w.player.grounded, 'Continue never leaks to jump');
    assert.equal(t.currentDialogue,1); r.acknowledge(); r.acknowledge();
    assert.equal(t.storyChapter,1, 'completed coaching skipped only after all arrival story');
    r.advance(10000); assert.equal(w.enemyManager.enemies.length,0,'slow reading creates no enemies');
    r.acknowledge(); r.advance(5000); assert.equal(w.enemyManager.enemies.length,0);
    r.acknowledge(); assert.equal(t.currentDialogue,2); assert(!t.combatPracticeStarted);
    r.acknowledge(); assert(t.combatPracticeStarted); assert.equal(t._tutorialEnemyCount,1);
    r.pressContinue(); assert.equal(t._tutorialEnemyCount,1,'repeated Continue cannot spawn another wave');
    w.gameState.paused=true; r.advance(4000); assert.equal(t._tutorialEnemyCount,1,'pause freezes entrance clock');
    w.gameState.paused=false; r.advance(2100); assert.equal(t._tutorialEnemyCount,3);
    const enemies=w.enemyManager.enemies.slice(); assert.equal(enemies.length,3);
    for(const e of enemies) { r.defeat(e); assert.equal(w.enemyManager.recordDefeat(e),false); }
    assert.equal(t._tutorialEnemiesDefeated,3); assert.equal(t.storyChapter,1,'defeat callbacks only record facts');
    assert.equal(r.p.missionDefeats,0); r.step(); assert.equal(t.storyChapter,2);
    assert.equal(t.currentDialogue,0); assert(t.targetText.includes('beat survived'));
    r.ground(); if(device==='keyboard')r.tapKey('r');else r.tapPad(4);
    for(let n=0;n<5;n++)r.beat('perfect');
    t.update(0); assert(t.completedObjectives.has('rhythm_combo')); assert(w.rhythmSystem.isActive(),'combo does not force an exit');
    r.beat('miss'); t.update(0); assert(t.completedObjectives.has('rhythm_combo'),'later miss retains earned credit');
    if(device==='keyboard')r.tapKey('r');else r.tapPad(4);
    assert(t.completedObjectives.has('rhythm_exit')); assert.equal(t.currentDialogue,0,'early actions preserve DJ story');
    r.acknowledge(); assert.equal(t.currentDialogue,3); assert(t.targetText.includes("you're moving again"));
    r.acknowledge(); assert.equal(t.storyChapter,3); assert.equal(t.currentDialogue,0);
    // Start the real hack before Mac's story ends. Its live Read/Input coaching
    // borrows the display, then returns to the unread story without replaying tasks.
    r.ground(); if(device==='keyboard')r.tapKey('h');else r.tapPad(3);
    const h=w.hackingSystem; assert(h.active); assert(t.getDialoguePresentation().text.includes('Watch the signal'));
    const cursor=t.currentDialogue, typed=t.currentText; t.handleSpacePress(); assert.equal(t.currentDialogue,cursor);
    h.puzzleType=2; r.advance(h.bootDurationMs+3100); assert.equal(h.phase,'answer');
    assert(t.getDialoguePresentation().text.includes('no time limit')); assert.equal(t.currentText,typed);
    r.advance(25000); assert(h.active,'practice answer remains untimed');
    h.inputText='bad';h.checkAnswer();r.step();assert(!t.completedObjectives.has('hack_complete'));
    assert.equal(t.currentDialogue,0);assert(t.completedObjectives.has('hack_start'),'failure preserves started credit');
    r.ground();if(device==='keyboard')r.tapKey('h');else r.tapPad(3);
    r.advance(h.bootDurationMs+h.displayTime+100);assert.equal(h.phase,'answer');
    h.inputText=h.currentPuzzle.answer;h.processInput('Enter');
    assert(t.completedObjectives.has('hack_complete'));assert.equal(t.currentDialogue,0);
    r.step();assert.equal(t.currentDialogue,0);assert(t.targetText.startsWith('Their commands'));
    assert.equal(t.getDialoguePresentation().line.speaker,'mac');
    assert(t.targetText.startsWith(t.getDialoguePresentation().text),'unread story resumes its preserved typing cursor');
    const held=t.currentText;r.pressContinue();assert.equal(t.currentDialogue,0);assert.equal(t.currentText,held,'hidden result cannot consume story input');
    r.advance(1100);r.acknowledge();assert.equal(t.currentDialogue,3);assert(t.targetText.includes('twelve seconds'));
    r.acknowledge();assert.equal(t.storyChapter,4);assert(!r.p.missionStarted);
    for(let n=0;n<4;n++)r.acknowledge();assert.equal(t.currentDialogue,4);
    r.pressContinue();assert(t.active&&t.readyToAdvance,'first Continue reveals closing line');
    r.pressContinue();r.step();assert(t.completed&&!t.active);assert(r.p.missionStarted);
    assert.equal(r.p.missionDefeats,0,'three training kills are excluded from mission quota');
    const wave=r.p.pendingSpawns.length;r.step();assert(r.p.pendingSpawns.length<=wave,'mission starts once');
    assert.deepStrictEqual(r.calls.errors,[]);
  }
  {
    const r=rig(),{t,w}=r;t.startChapter(1);r.acknowledge();r.acknowledge();r.acknowledge();
    const old=w.enemyManager.enemies[0],generation=t.runGeneration;
    t.startTutorial();assert.equal(t.runGeneration,generation+1);r.advance(5000);
    assert.equal(w.enemyManager.enemies.length,0,'restart cancels old queued and live training enemies');
    t.startChapter(1);r.acknowledge();r.acknowledge();r.acknowledge();
    assert.equal(t.recordEnemyDefeat(old),false,'late prior-run defeat cannot satisfy new lesson');
    t.active=false;r.advance(5000);assert.equal(t._tutorialEnemyCount,1,'stopped tutorial cannot spawn late enemies');
  }
  {
    const r=rig(),{t,w}=r;t.startChapter(2);r.ground();r.tapKey('r');
    for(let n=0;n<5;n++)r.beat('perfect');
    r.tapKey('r');assert(t.completedObjectives.has('rhythm_combo')&&t.completedObjectives.has('rhythm_exit'),'exit snapshots last combo before hide clears it');
    t.startChapter(4);for(let n=0;n<4;n++)r.acknowledge();
    r.pressContinue();t.update(0);assert(t.isFinalMessage);
    const elapsed=t.finalMessageTimer;w.gameState.paused=true;t.update(20000);assert(t.active&&t.finalMessageTimer===elapsed);
    w.gameState.paused=false;t.update(11999-elapsed);assert(t.active);t.update(1);assert(t.completed&&!t.active,'optional automatic closing still finishes once');
  }
  {
    const r=rig(),{t,w}=r;t.startChapter(2);r.acknowledge();r.ground();r.tapKey('r');
    for(let n=0;n<5;n++)r.beat('perfect');t.update(0);assert.equal(t.currentDialogue,3);
    r.pressContinue();assert(t.targetText.includes('Now leave'));r.tapKey('r');
    assert(t.targetText.includes("you're moving again"),'exiting replaces obsolete exit coaching while preserving acknowledgement');
    r.acknowledge();assert.equal(t.storyChapter,3);r.acknowledge();r.ground();r.tapKey('h');
    const h=w.hackingSystem;r.advance(h.bootDurationMs+h.displayTime+100);assert.equal(t.currentDialogue,2);
    h.inputText='bad';h.checkAnswer();r.step();
    assert(t.getDialoguePresentation().hidden,'closed failed terminal cannot still request an answer');
    assert.equal(t.getObjectivePresentation().title,'Retry the practice hack');
    assert(h.resultDetail.includes('try again when ready'),'practice failure never claims a nonexistent cooldown');
  }
  {
    const r=rig(60,'playstation'),{t,w}=r;
    w.BARCODE.ControllerSettings.bind('jump',6);
    assert.equal(t.control('jump'),'L2');r.tapPad(6);assert(t.completedObjectives.has('jump'));
    assert(!t.getObjectivePresentation().title.includes('Arrow'));
    r.pad.connected=false;r.step();assert.equal(t.control('jump'),'↑ / W');
    t.active=false;t.completed=true;r.p.startMission();
    const a=new w.Enemy(w.player.position.x+80,784,'corrupted');Object.assign(a,{entranceComplete:true,_authoredEntranceActive:false,spawnProtectionDuration:0});Object.assign(a.position,{x:w.player.position.x+80,y:784});w.enemyManager.enemies=[a];r.ground();
    t.update(16);assert.equal(t.getContextHint()?.id,'hack');
    assert(w.enemyManager.hijackEnemy(a));t.update(16);assert.equal(t.getContextHint()?.id,'ally','success immediately replaces obsolete hack cue');
    w.enemyManager.releaseHijack(a);t.update(16);assert(!t.getContextHint()||t.getContextHint().id!=='ally');
  }
  console.log('Tutorial flow: 20 bubbles; keyboard/PS/Xbox at 30/60/120 Hz; early and reversed actions; acknowledged spawns; pause/reset/late events; real rhythm/hack success and retry; retained story; deliberate exit; remaps; final handoff and contextual cues passed.');
}
if(require.main===module)main();
module.exports={rig};
