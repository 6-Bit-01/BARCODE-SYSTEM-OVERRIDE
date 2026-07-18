#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
function assert(cond, msg) { if (!cond) { console.error(`❌ ${msg}`); process.exit(1); } }
function pass(msg) { console.log(`✓ ${msg}`); }
function fakeAudioContext() { return { currentTime: 4, sampleRate: 44100, state: 'running', createGain(){ return { gain:{ value:1, setValueAtTime(){}, linearRampToValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){} }; }, createOscillator(){ return { frequency:{ value:0, setValueAtTime(){}, exponentialRampToValueAtTime(){} }, connect(){}, start(){}, stop(){}, type:'sine' }; }, createBuffer(){ return { getChannelData(){ return new Float32Array(16); } }; }, createBufferSource(){ return { connect(){}, start(){}, stop(){}, buffer:null, loop:false }; }, createAnalyser(){ return { connect(){}, frequencyBinCount: 8, getByteFrequencyData(){} }; }, decodeAudioData: async () => ({ decoded:true }) }; }
function sandbox() {
  const listeners = { keydown: [], keyup: [], mousemove: [], mousedown: [], mouseup: [], gamepadconnected: [], gamepaddisconnected: [], DOMContentLoaded: [] };
  const s = { console, setTimeout(fn){ return 1; }, clearTimeout(){}, setInterval(){ return 1; }, clearInterval(){}, Date, Math, Promise, Float32Array, ArrayBuffer, performance:{ now: () => 1000 }, navigator:{ getGamepads: () => [] } };
  s.window = s; s.document = { readyState:'loading', addEventListener(type, fn){ (listeners[type] ||= []).push(fn); } };
  s.window.addEventListener = (type, fn) => { (listeners[type] ||= []).push(fn); };
  s.window.removeEventListener = () => {};
  s.__listeners = listeners;
  s.window.FILE_MANIFEST = [];
  s.window.distance = (x1,y1,x2,y2) => Math.hypot(x2-x1, y2-y1);
  s.window.clamp = (v,min,max) => Math.max(min, Math.min(max, v));
  s.window.Vector2D = class Vector2D { constructor(x,y){ this.x=x; this.y=y; } add(v){ return new s.window.Vector2D(this.x+v.x,this.y+v.y); } multiply(n){ return new s.window.Vector2D(this.x*n,this.y*n); } };
  return vm.createContext(s);
}
function load(s, rel) { vm.runInContext(read(rel), s, { filename: rel }); }
function keyEvent(key, repeat=false) { return { key, repeat, preventDefault(){ this.defaultPrevented = true; } }; }

(async function main() {
const files = {
  index: read('index.html'), input: read('src/core/input.js'), action: read('src/core/action-input.js'), combat: read('src/game/player-combat.js'), rhythm: read('src/game/rhythm.js'), enemy: read('src/game/enemies.js'), player: read('src/game/player.js'), audio: read('src/engine/audio.js'), init: read('src/game/game-initializer.js'), tutorial: read('src/game/tutorial.js'), boot: read('src/engine/boot-loader.js'), title: read('src/engine/title-screen.js')
};
const playerCombatScripts = [...files.index.matchAll(/<script\s+src="src\/game\/player-combat\.js"><\/script>/g)];
assert(playerCombatScripts.length === 1, 'index.html loads src/game/player-combat.js exactly once');
assert(files.index.indexOf('src/core/action-input.js') < files.index.indexOf('src/game/player-combat.js') && files.index.indexOf('src/game/player-combat.js') < files.index.indexOf('src/core/input.js'), 'player-combat loads after ActionInput and before InputManager');
assert(files.action.includes('rhythm_mode') && !files.action.includes('rhythm_visual'), 'semantic action is rhythm_mode, not rhythm_visual');
assert(files.input.includes('actions.rhythm_mode') && !files.input.includes('actions.rhythm_visual'), 'InputManager routes rhythm_mode');
assert(files.tutorial.includes("'rhythm_combo'") && files.tutorial.includes("'hack_start'") && files.tutorial.includes("'hack_complete'"), 'existing rhythm_combo/hack_start/hack_complete objectives remain present');
assert(!/optional_timing_removed|terminal_interact_optional|terminal_hack_optional/.test(files.tutorial), 'obsolete optional tutorial objective identifiers are absent');
assert(!files.input.includes('findInteractionTarget'), 'H hacking route does not depend on nonexistent BARCODE.findInteractionTarget');
assert(!/window\.audioSystem\.init\(\)\.then/.test(files.boot + files.title), 'Boot/title paths do not call audioSystem.init().then directly');
assert(files.init.includes("window.initAudio({ profileId: 'level-01.main' })"), 'Level 1 startup explicitly requests level-01.main');

// Normal index order exposes PlayerCombat before InputManager can route Down Arrow.
{
  const s = sandbox();
  s.window.gameState = { running:true, paused:false, gameOver:false };
  s.window.rhythmSystem = { active:true, trackStarted:true, currentTempoBeat:1, isActive(){ return this.active; }, applyResolvedAttackFeedback(j){ this.last = j; } };
  s.window.player = { grounded:true, position:{x:0,y:0}, startPrimaryAttackAnimation(){}, stopHorizontal(){}, moveLeft(){}, moveRight(){}, jump(){ return true; } };
  let reached = 0;
  s.window.enemyManager = { enemies:[{ active:true, position:{x:1,y:0}, takeDamage(){ reached++; } }] };
  s.window.audioSystem = { context:{ currentTime: 1 } };
  s.window.BARCODE = { RuntimeLifecycle:{ togglePause(){} }, MusicProfiles:{ getActive: () => ({ judgmentRules:[{ id:'level-01.attack', target:'quarter-note' }] }) }, MusicTransport:{ judgeInput: () => ({ available:true, timing:'perfect' }) } };
  load(s, 'src/core/action-input.js'); load(s, 'src/game/player-combat.js'); load(s, 'src/core/input.js');
  assert(typeof s.window.BARCODE.PlayerCombat === 'function' && s.window.BARCODE.playerCombat, 'BARCODE.PlayerCombat and singleton exist after normal script order');
  s.window.BARCODE.playerCombat.cooldownMs = 0;
  const manager = new s.window.InputManager();
  s.__listeners.keydown[0](keyEvent('ArrowDown')); manager.update();
  assert(reached === 1, 'Successful Down Arrow action reaches PlayerCombat damage transaction');
}
pass('script order and PlayerCombat routing');

// Tutorial Space ownership and repeated Space jumping outside tutorial.
{
  const s = sandbox(); let jumped = 0, handled = 0;
  s.window.BARCODE = { RuntimeLifecycle:{ togglePause(){} } }; s.window.gameState = { running:true, paused:false, gameOver:false };
  s.window.player = { grounded:true, jump(){ if (!this.grounded) return false; jumped++; this.grounded = false; return true; }, moveLeft(){}, moveRight(){}, stopHorizontal(){} };
  s.window.handleGameAction = action => action === 'jump' ? { ok: s.window.player.jump() } : { ok:false };
  load(s, 'src/core/action-input.js'); load(s, 'src/game/player-combat.js'); load(s, 'src/core/input.js');
  const manager = new s.window.InputManager();
  assert(s.__listeners.keydown.length === 1, 'Single low-level keydown owner');
  s.window.tutorialSystem = { isActive: () => true, handleSpacePress(){ handled++; }, checkObjective(){} };
  s.__listeners.keydown[0](keyEvent(' ')); manager.update();
  assert(handled === 1 && jumped === 0, 'Active tutorial Space is consumed and never jumps');
  s.__listeners.keydown[0](keyEvent(' ', true)); manager.update();
  assert(handled === 1 && jumped === 0, 'Held tutorial Space does not repeat or jump');
  s.__listeners.keyup[0](keyEvent(' ')); manager.update();
  s.window.tutorialSystem = { isActive: () => true, handleSpacePress(){ handled++; }, checkObjective(){} };
  s.__listeners.keydown[0](keyEvent(' ')); manager.update();
  assert(handled === 2 && jumped === 0, 'Not-ready/objective-gated tutorial Space still belongs only to tutorial');
  s.__listeners.keyup[0](keyEvent(' ')); manager.update();
  s.window.tutorialSystem = { isActive: () => false, checkObjective(){} };
  s.__listeners.keydown[0](keyEvent(' ')); manager.update(); assert(jumped === 1, 'Outside tutorial Space jumps');
  s.__listeners.keyup[0](keyEvent(' ')); manager.update(); s.window.player.grounded = true;
  s.__listeners.keydown[0](keyEvent(' ')); manager.update(); assert(jumped === 2, 'Outside tutorial Space jumps again after release and landing');
}
pass('tutorial Space ownership and repeated jumping');

// Tutorial rhythm-combo and hacking progression use real objective identifiers.
{
  const s = sandbox();
  load(s, 'src/game/tutorial.js');
  const tutorial = new s.window.TutorialSystem();
  tutorial.active = true;
  tutorial.startChapter(2);
  tutorial.completedObjectives.add('rhythm_start');
  const rhythmGateIndex = tutorial.dialogue.findIndex(d => d.requiresObjectives && d.requiresObjectives.includes('rhythm_combo'));
  tutorial.currentDialogue = rhythmGateIndex;
  tutorial.readyToAdvance = true;
  s.window.rhythmSystem = { combo: 5, maxCombo: 5, getCombo(){ return 5; }, hide(){ this.hidden = true; } };
  tutorial.update(16);
  const rhythmObj = tutorial.objectives.find(obj => obj.id === 'rhythm_combo');
  assert(tutorial.completedObjectives.has('rhythm_combo') && rhythmObj && rhythmObj.completed, 'Chapter 2 combo >= 5 completes rhythm_combo UI objective');
  assert(tutorial.canAdvanceDialogueWithInput(), 'Chapter 2 gate can advance after rhythm_start and rhythm_combo');

  let started = 0;
  const hacking = { active:false, complete:false, _lastResultFailed:false, start(){ started++; this.active = true; }, isActive(){ return this.active; }, isComplete(){ return this.complete; }, processInput(){} };
  s.window.hackingSystem = hacking;
  s.window.rhythmSystem = { isActive: () => false };
  s.window.BARCODE = { RuntimeLifecycle:{ togglePause(){} }, findInteractionTarget(){ throw new Error('findInteractionTarget must not be used'); } };
  s.window.gameState = { running:true, paused:false, gameOver:false, victory:false };
  s.window.player = { grounded:true, jump(){ return true; }, moveLeft(){}, moveRight(){}, stopHorizontal(){} };
  tutorial.startChapter(3);
  const hackGateIndex = tutorial.dialogue.findIndex(d => d.requiresObjectives && d.requiresObjectives.includes('hack_complete'));
  tutorial.currentDialogue = hackGateIndex;
  tutorial.readyToAdvance = true;
  s.window.tutorialSystem = tutorial;
  load(s, 'src/core/action-input.js'); load(s, 'src/game/player-combat.js'); load(s, 'src/core/input.js');
  const manager = new s.window.InputManager();
  s.__listeners.keydown[0](keyEvent('h')); manager.update();
  assert(started === 1 && hacking.active, 'H starts the existing hacking system without target resolver dependency');
  assert(tutorial.completedObjectives.has('hack_start'), 'hack_start completes only after hacking becomes active');
  hacking.complete = true; tutorial.update(16);
  const hackObj = tutorial.objectives.find(obj => obj.id === 'hack_complete');
  assert(tutorial.completedObjectives.has('hack_complete') && hackObj && hackObj.completed, 'Successful hacking completion completes hack_complete');
  assert(tutorial.canAdvanceDialogueWithInput(), 'Chapter 3 gate can advance after hack_start and hack_complete');

  hacking.active = false; hacking.complete = false; started = 0; tutorial.completedObjectives.delete('hack_start');
  s.__listeners.keyup[0](keyEvent('h')); manager.update();
  s.window.player.grounded = false;
  s.__listeners.keydown[0](keyEvent('h')); manager.update();
  assert(started === 0 && !hacking.active, 'H does not start hacking while airborne');
  s.__listeners.keyup[0](keyEvent('h')); manager.update();
  s.window.player.grounded = true; s.window.rhythmSystem = { isActive: () => true };
  s.__listeners.keydown[0](keyEvent('h')); manager.update();
  assert(started === 0 && !hacking.active, 'H does not start hacking while Rhythm Combat Mode is active');
}
pass('tutorial rhythm/hacking objective progression');

// Rhythm Mode restrictions, objective completion, and deactivation.
{
  const s = sandbox(); load(s, 'src/game/rhythm.js');
  const rhythm = new s.window.RhythmSystem(); rhythm.running = true; rhythm.trackStarted = true; rhythm.currentTempoBeat = 1;
  let completed = 0; s.window.tutorialSystem = { isActive: () => true, checkObjective(id){ if (id === 'rhythm_start') completed++; } };
  s.window.rhythmSystem = rhythm; s.window.gameState = { running:true, paused:false, gameOver:false, victory:false };
  s.window.player = { grounded:false, state:'jump', velocity:{x:50}, stopHorizontal(){ this.velocity.x = 0; } };
  assert(!rhythm.show().ok && !rhythm.isActive(), 'R cannot activate while airborne');
  s.window.player.grounded = true; s.window.hackingSystem = { isActive: () => true }; assert(!rhythm.show().ok, 'R cannot activate while hacking');
  s.window.hackingSystem = { isActive: () => false }; s.window.isPaused = true; assert(!rhythm.show().ok, 'R cannot activate while paused');
  s.window.isPaused = false; s.window.isRunning = false; assert(!rhythm.show().ok, 'R cannot activate while stopped');
  s.window.isRunning = true; s.window.gameState.gameOver = true; assert(!rhythm.show().ok, 'R cannot activate during game over');
  s.window.gameState.gameOver = false; s.window.cutsceneSystem = { active:true }; assert(!rhythm.show().ok, 'R cannot activate during cutscene');
  assert(completed === 0, 'Blocked R presses do not complete rhythm_start');
  s.window.cutsceneSystem.active = false; s.window.player.velocity.x = 50;
  const ok = rhythm.show(); assert(ok.ok && rhythm.isActive() && s.window.player.velocity.x === 0, 'Successful R activation enters real Rhythm Mode and stops horizontal movement');
  rhythm.hideRhythmMode(); assert(!rhythm.isActive(), 'R deactivation exits Rhythm Mode and restores action eligibility');
}
pass('Rhythm Mode restrictions');

// Beat-gated damage.
{
  const s = sandbox(); load(s, 'src/game/player-combat.js');
  s.window.gameState = { running:true, paused:false, gameOver:false }; s.window.audioSystem = { context:{ currentTime: 4 } };
  s.window.player = { position:{x:0,y:0}, startPrimaryAttackAnimation(){} };
  let damageCalls = 0, judgments = 0;
  s.window.enemyManager = { enemies:[{ active:true, position:{x:10,y:0}, takeDamage(d){ damageCalls++; this.damage = d; } }] };
  s.window.BARCODE.MusicProfiles = { getActive: () => ({ judgmentRules:[{ id:'attack', target:'quarter-note' }] }) };
  s.window.BARCODE.MusicTransport = { judgeInput(){ judgments++; return { available:true, timing:'miss' }; } };
  s.window.rhythmSystem = { active:false, trackStarted:true, currentTempoBeat:1, isActive(){ return this.active; }, applyResolvedAttackFeedback(j){ this.last = j; } };
  const combat = new s.window.BARCODE.PlayerCombat({ cooldownMs: 10 });
  combat.resolvePrimary({ now: 100 }); assert(damageCalls === 0 && judgments === 0, 'Down while inactive causes zero judgment and zero damage');
  s.window.rhythmSystem.active = true;
  for (const timing of ['miss','unavailable','stopped']) { s.window.BARCODE.MusicTransport.judgeInput = () => { judgments++; return { available: timing === 'miss', timing }; }; combat.lastAttackAt = -Infinity; combat.resolvePrimary({ now: 100 }); }
  assert(damageCalls === 0, 'Miss/unavailable/stopped cause zero damage');
  s.window.rhythmSystem.trackStarted = false; combat.lastAttackAt = -Infinity; combat.resolvePrimary({ now: 200 }); assert(damageCalls === 0, 'Waiting track causes zero damage');
  s.window.rhythmSystem.trackStarted = true; combat.lastAttackAt = 250; combat.resolvePrimary({ now: 255 }); assert(damageCalls === 0, 'Cooldown causes zero damage');
  s.window.BARCODE.MusicTransport.judgeInput = () => { judgments++; return { available:true, timing:'perfect' }; }; combat.lastAttackAt = -Infinity; combat.resolvePrimary({ now: 300 });
  assert(damageCalls === 1 && s.window.enemyManager.enemies[0].damage === 3, 'Perfect applies one transaction per target');
  s.window.BARCODE.MusicTransport.judgeInput = () => { judgments++; return { available:true, timing:'excellent' }; }; combat.lastAttackAt = -Infinity; combat.resolvePrimary({ now: 400 });
  assert(damageCalls === 2 && s.window.enemyManager.enemies[0].damage === 2, 'Excellent applies one transaction per target');
}
pass('beat-gated PlayerCombat damage');

// Entrance and passive stomp.
{
  const s = sandbox(); s.window.Particle = class Particle {}; s.window.particleSystem = { particles:[], enemySpawnEffect(){}, impact(){ this.impacted = (this.impacted || 0) + 1; } };
  load(s, 'src/game/player.js'); const player = new s.window.Player(200, 500);
  assert(typeof player.createEntranceExplosion === 'function', 'Player.createEntranceExplosion exists');
  player.isEntering = true; player.entranceStartTime = Date.now() - player.entranceDuration - 1; player.updateEntranceAnimation(16); assert(!player.isEntering, 'Entrance completion does not throw');
  load(s, 'src/game/enemies.js');

  const entering = new s.window.Enemy(0, 650, 'virus');
  entering._sector1MissionEnemy = true;
  entering._authoredEntranceActive = true;
  entering._entranceTarget = { x: 840, y: 650 };
  entering._authoredEntranceSpeed = 420;
  entering.entranceComplete = false;
  entering.update(1000, { position:{ x:1200, y:750 } }, 1000);
  assert(entering.position.x === 420 && entering.position.y === 650 && entering._authoredEntranceActive, 'Authored off-screen entrance integrates exactly once per update');
  entering.update(1000, { position:{ x:1200, y:750 } }, 2000);
  assert(entering.position.x === 840 && entering.position.y === 650 && entering.entranceComplete && !entering._authoredEntranceActive, 'Authored entrance reaches its stage target and releases normal AI');

  const manager = new s.window.EnemyManager(); manager.simulationTimeMs = 1000; let defeats = 0;
  const enemy = { active:true, _isTutorialEnemy:true, type:'virus', position:{x:0,y:0}, lastPlayerHitTimeMs:-Infinity, isSpawnProtected: () => true, getHitbox: () => ({ x:-20, y:0, width:40, height:40 }), takeDamage(d){ assert(d === 999, 'Stomp damage is lethal'); this.active = false; manager.recordDefeat(this); } };
  manager.enemies = [enemy]; manager.recordDefeat = e => { if (e._recorded) return false; e._recorded = true; defeats++; return true; };
  const stomper = { controlsDisabled:false, position:{x:0,y:15}, velocity:{x:0,y:100}, getHitbox: () => ({ x:-10, y:-30, width:20, height:45 }), takeDamageWithKnockback(){ throw new Error('stomp should not damage player'); } };
  manager.checkCollisions(stomper); assert(defeats === 1 && stomper.velocity.y === -550 && stomper._enemyInvulnerableUntilMs === 1400 && s.window.particleSystem.impacted === 1, 'Passive landing stomp kills once and bounces');

  let contactDamage = 0;
  const protectedEnemy = { active:true, type:'corrupted', position:{x:0,y:0}, isSpawnProtected: () => true, getHitbox: () => ({ x:-20, y:0, width:40, height:40 }) };
  const protectedPlayer = { controlsDisabled:false, position:{x:0,y:0}, velocity:{x:0,y:0}, getHitbox: () => ({ x:-10, y:10, width:20, height:30 }), takeDamageWithKnockback(){ contactDamage++; } };
  manager.enemies = [protectedEnemy];
  manager.checkCollisions(protectedPlayer);
  assert(protectedPlayer.position.x === 0 && protectedPlayer.position.y === 0 && contactDamage === 0, 'Protected authored entrance cannot spawn-push or contact-damage the player');

  const quotaManager = new s.window.EnemyManager();
  quotaManager.defeatedCount = 20;
  s.window.gameState = { enemiesDefeated:20 };
  let missionCallbacks = 0;
  s.window.sector1Progression = { onEnemyDefeated(){ missionCallbacks++; } };
  assert(quotaManager.recordDefeat({ _jammerReinforcement:true }), 'Jammer reinforcement defeat is recorded once for cleanup');
  assert(quotaManager.defeatedCount === 20 && s.window.gameState.enemiesDefeated === 20 && missionCallbacks === 0, 'Jammer reinforcements never inflate the completed 20-kill quota');
}
pass('authored entrances, spawn protection, passive stomp, and reinforcement quota isolation');

// Audio profile ownership and profile-keyed preparation.
{
  const s = sandbox(); s.window.AudioContext = function AudioContext(){ return fakeAudioContext(); }; s.window.fetch = async () => ({ ok:false, status:404 });
  let activeProfile = null; let loadCount = 0;
  const profile = id => ({ profileId:id, arrangement:{ sources:[{ sourceId:'foundation', required:true, url:'u1' }, { sourceId:'bass-layer', required:true, url:'u2' }, { sourceId:'fx-layer', required:true, url:'u3' }] } });
  s.window.BARCODE = { MusicProfiles:{ getActive: () => activeProfile }, MusicTransport:{ load(){ return { status:'ok' }; } } };
  load(s, 'src/engine/audio.js'); const audio = new s.window.AudioSystem(); audio.context = fakeAudioContext(); audio.initialized = true; audio.musicTracks = {}; audio.loadMusicTracks = async () => { loadCount++; };
  const titleOnly = await audio.prepareActiveMusicProfile(); assert(!titleOnly.ok && titleOnly.reason === 'missing-profile-selection' && !s.window.BARCODE.MusicProfiles.getActive(), 'Title-only prep does not select Level 1');
  activeProfile = profile('level-01.main'); const p1 = audio.prepareActiveMusicProfile(); const p2 = audio.prepareActiveMusicProfile(); assert(p1 === p2, 'Same selected profile joins in-flight preparation'); const prepared = await p1;
  assert(prepared.ok && prepared.profileId === 'level-01.main', 'Level 1 active profile preparation succeeds');
  for (const id of ['foundation','bass-layer','fx-layer']) assert(audio.musicTracks[id] && audio.musicTracks[id].buffer, `${id} has usable buffer after preparation`);
  activeProfile = profile('level-02.synthetic'); const p3 = audio.prepareActiveMusicProfile(); assert(p3 !== p1, 'Different selected profile does not reuse stale in-flight promise'); await p3; assert(loadCount >= 2, 'Different profile preparation runs its own load path');
}
pass('audio profile ownership');

console.log('PASS action/combat hotfix regression checks');

})().catch(error => { console.error(error && error.stack || error); process.exit(1); });
