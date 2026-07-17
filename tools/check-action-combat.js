#!/usr/bin/env node
const fs = require('fs');
const vm = require('vm');
function assert(cond, msg) { if (!cond) { console.error(`❌ ${msg}`); process.exit(1); } }
function read(p) { return fs.readFileSync(p, 'utf8'); }
function keyEvent(key, repeat = false) { return { key, repeat, preventDefault() { this.defaultPrevented = true; }, stopPropagation() {} }; }
function sandbox() {
  const listeners = { keydown: [], keyup: [], DOMContentLoaded: [] };
  const s = { console: { log(){}, warn(){}, error(){} }, Date, Math, Promise, Set, Map,
    setTimeout(fn) { return 1; }, clearTimeout(){}, setInterval() { return 1; }, clearInterval(){},
    performance: { now: () => 1000 }, navigator: { getGamepads: () => [] },
    document: { readyState: 'loading', addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, getElementById: () => null, querySelector: () => null },
    window: null };
  s.window = s;
  s.window.FILE_MANIFEST = [];
  s.window.addEventListener = (type, fn) => { (listeners[type] ||= []).push(fn); };
  s.window.removeEventListener = (type, fn) => { listeners[type] = (listeners[type] || []).filter(item => item !== fn); };
  s.__listeners = listeners;
  s.window.distance = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
  s.window.clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  s.window.randomRange = (min, max) => (min + max) / 2;
  s.window.Vector2D = class Vector2D { constructor(x=0,y=0){this.x=x;this.y=y;} add(v){return new s.window.Vector2D(this.x+v.x,this.y+v.y);} multiply(n){return new s.window.Vector2D(this.x*n,this.y*n);} };
  vm.createContext(s);
  return s;
}
function load(s, file) { vm.runInContext(read(file), s, { filename: file }); }
function fakeAudioContext() { return { currentTime: 12, sampleRate: 8000, createBuffer(channels, length, sampleRate) { return { channels, length, sampleRate, getChannelData() { return new Float32Array(length); } }; } }; }

(async function main() {
const files = {
  input: read('src/core/input.js'), action: read('src/core/action-input.js'), combat: read('src/game/player-combat.js'), rhythm: read('src/game/rhythm.js'), enemy: read('src/game/enemies.js'), player: read('src/game/player.js'), audio: read('src/engine/audio.js'), boot: read('src/engine/boot-loader.js'), title: read('src/engine/title-screen.js'), loop: read('src/core/loop.js')
};
assert(files.input.includes('new window.BARCODE.ActionInput({ attach: false })'), 'InputManager embeds unattached ActionInput');
assert(files.input.includes("tutorialSystem.isActive") && !files.input.includes('canAdvanceDialogueWithInput() &&'), 'Active tutorial owns Space without can-advance precheck');
assert(!/window\.audioSystem\.init\(\)\.then/.test(files.boot + files.title), 'Boot/title paths do not call audioSystem.init() directly');
assert(files.audio.includes('prepareActiveMusicProfile'), 'AudioSystem has active profile preparation path');
assert(files.combat.includes('SUCCESS_DAMAGE') && !files.combat.includes('isReady(') && !files.combat.includes("handleInput('feedback-only')"), 'PlayerCombat beat-gates damage without nonexistent readiness or duplicate rhythm input');
assert(files.enemy.includes('Intentional passive landing stomp') && files.enemy.includes('takeDamage(999)'), 'Passive top-down lethal stomp is restored');
assert(files.player.includes('createEntranceExplosion()'), 'Player.createEntranceExplosion is restored');
assert(!/fastFallMultiplier|fastFallInvincible/.test(files.player), 'Down-key fast-fall remains removed');
assert(!/setInterval\(|requestAnimationFrame\(/.test(files.action + files.combat), 'No action/combat RAF or interval owner');

// Space ownership and repeated jump behavior.
{
  const s = sandbox();
  let jumped = 0, handled = 0;
  s.window.BARCODE = { RuntimeLifecycle: { togglePause(){} } };
  s.window.gameState = { running: true, paused: false, gameOver: false };
  s.window.player = { grounded: true, jump() { if (!this.grounded) return false; jumped++; this.grounded = false; return true; }, moveLeft(){}, moveRight(){}, stopHorizontal(){} };
  s.window.handleGameAction = action => action === 'jump' ? { ok: s.window.player.jump() } : { ok: false };
  load(s, 'src/core/action-input.js'); load(s, 'src/core/input.js');
  const manager = new s.window.InputManager();
  assert(s.__listeners.keydown.length === 1, 'Single low-level keydown owner');
  s.window.tutorialSystem = { isActive: () => true, handleSpacePress(){ handled++; }, checkObjective(){} };
  s.__listeners.keydown[0](keyEvent(' ')); manager.update();
  assert(handled === 1 && jumped === 0, 'Active tutorial ready Space is consumed and does not jump');
  s.__listeners.keydown[0](keyEvent(' ', true)); manager.update();
  assert(handled === 1 && jumped === 0, 'Held tutorial Space does not repeat or jump');
  s.__listeners.keyup[0](keyEvent(' ')); manager.update();
  s.window.tutorialSystem = { isActive: () => true, handleSpacePress(){ handled++; }, checkObjective(){} };
  s.__listeners.keydown[0](keyEvent(' ')); manager.update();
  assert(handled === 2 && jumped === 0, 'Objective-gated/not-ready tutorial Space is still owned by tutorial');
  s.__listeners.keyup[0](keyEvent(' ')); manager.update();
  s.window.tutorialSystem = { isActive: () => false, handleSpacePress(){ handled++; }, checkObjective(){} };
  s.__listeners.keydown[0](keyEvent(' ')); manager.update();
  assert(jumped === 1, 'Inactive tutorial Space jumps');
  s.__listeners.keyup[0](keyEvent(' ')); manager.update(); s.window.player.grounded = true;
  s.__listeners.keydown[0](keyEvent(' ')); manager.update();
  assert(jumped === 2, 'After key release and landing, Space jumps again');
}

// Rhythm mode and beat-gated damage.
{
  const s = sandbox();
  s.window.BARCODE = { RuntimeLifecycle: { togglePause(){} } };
  s.window.gameState = { running: true, paused: false, gameOver: false };
  let active = false, judgments = 0, damageCalls = 0;
  s.window.rhythmSystem = { trackStarted: true, currentTempoBeat: 1, isActive: () => active, show(){ active = true; }, hide(){ active = false; }, applyResolvedAttackFeedback(j) { this.last = j; } };
  s.window.player = { position:{x:0,y:0}, startPrimaryAttackAnimation(){}, moveLeft(){ this.moved = true; }, moveRight(){}, stopHorizontal(){}, jump(){ this.jumped = true; return true; } };
  s.window.enemyManager = { enemies: [{ active: true, position:{x:10,y:0}, takeDamage(d){ damageCalls++; this.damage = d; } }] };
  s.window.audioSystem = { context: { currentTime: 4 } };
  s.window.BARCODE.MusicProfiles = { getActive: () => ({ judgmentRules: [{ id: 'level-01.attack', target: 'quarter-note' }] }) };
  s.window.BARCODE.MusicTransport = { judgeInput(){ judgments++; return { available: true, timing: 'miss' }; } };
  load(s, 'src/core/action-input.js'); load(s, 'src/game/player-combat.js'); s.window.BARCODE.playerCombat.cooldownMs = 0; load(s, 'src/core/input.js');
  const manager = new s.window.InputManager();
  s.__listeners.keydown[0](keyEvent('ArrowDown')); manager.update();
  assert(damageCalls === 0 && judgments === 0, 'Down while Rhythm Mode inactive causes no damage and no judgment');
  s.__listeners.keyup[0](keyEvent('ArrowDown')); manager.update();
  s.__listeners.keydown[0](keyEvent('r')); manager.update();
  assert(active === true, 'R activates actual Rhythm Combat Mode');
  s.__listeners.keyup[0](keyEvent('r')); manager.update();
  s.__listeners.keydown[0](keyEvent('r')); manager.update();
  assert(active === false, 'R deactivates actual Rhythm Combat Mode');
  active = true; s.__listeners.keyup[0](keyEvent('r')); manager.update();
  for (const timing of ['miss','unavailable','stopped']) {
    s.window.BARCODE.MusicTransport.judgeInput = () => { judgments++; return { available: timing !== 'unavailable' && timing !== 'stopped', timing }; };
    s.__listeners.keyup[0](keyEvent('ArrowDown')); manager.update();
    s.__listeners.keydown[0](keyEvent('ArrowDown')); manager.update();
  }
  assert(damageCalls === 0, 'Miss/unavailable/stopped timing causes zero damage');
  s.window.BARCODE.MusicTransport.judgeInput = () => { judgments++; return { available: true, timing: 'perfect' }; };
  s.__listeners.keyup[0](keyEvent('ArrowDown')); manager.update();
  s.__listeners.keydown[0](keyEvent('ArrowDown')); manager.update();
  assert(damageCalls === 1 && s.window.enemyManager.enemies[0].damage === 3, 'Perfect timing applies one successful damage transaction');
}

// Entrance explosion and stomp collision.
{
  const s = sandbox();
  s.window.Particle = class Particle {};
  s.window.particleSystem = { particles: [], impact(){ this.impacted = (this.impacted || 0) + 1; } };
  load(s, 'src/game/player.js');
  const player = new s.window.Player(200, 500);
  assert(typeof player.createEntranceExplosion === 'function', 'createEntranceExplosion exists');
  player.isEntering = true; player.entranceStartTime = Date.now() - player.entranceDuration - 1; player.updateEntranceAnimation(16);
  assert(!player.isEntering, 'Entrance completion does not throw and finishes');
  load(s, 'src/game/enemies.js');
  const manager = new s.window.EnemyManager(); manager.simulationTimeMs = 1000;
  let defeats = 0;
  const enemy = { active: true, _isTutorialEnemy: true, type: 'virus', position:{x:0,y:0}, lastPlayerHitTimeMs: -Infinity, getHitbox: () => ({ x: -20, y: 0, width: 40, height: 40 }), takeDamage(d){ assert(d === 999, 'Stomp damage is lethal'); this.active = false; manager.recordDefeat(this); } };
  manager.enemies = [enemy];
  manager.recordDefeat = function(e){ if (e._recorded) return false; e._recorded = true; defeats++; return true; };
  const stomper = { controlsDisabled:false, position:{x:0,y:15}, velocity:{x:0,y:100}, getHitbox: () => ({ x:-10, y:-30, width:20, height:45 }), takeDamageWithKnockback(){ throw new Error('stomp should not damage player'); } };
  manager.checkCollisions(stomper);
  assert(defeats === 1 && stomper.velocity.y === -550 && stomper._enemyInvulnerableUntilMs === 1400 && s.window.particleSystem.impacted === 1, 'Top-down stomp kills once, bounces, grants grace, and emits impact');
}

// Active profile preparation and title-safe initialization.
{
  const s = sandbox();
  s.window.AudioContext = function AudioContext(){ return fakeAudioContext(); };
  s.window.fetch = async () => ({ ok: false, status: 404 });
  s.window.BARCODE = { MusicProfiles: { getActive: () => ({ profileId:'level-01.main', arrangement:{ sources:[
    { sourceId:'foundation', assetId:'audio.level-01.foundation', required:true, url:'u1' },
    { sourceId:'bass-layer', assetId:'audio.level-01.bass-layer', required:true, url:'u2' },
    { sourceId:'fx-layer', assetId:'audio.level-01.fx-layer', required:true, url:'u3' }
  ] } }) }, MusicTransport: { load(){ return { status:'ok', profileId:'level-01.main' }; } } };
  load(s, 'src/engine/audio.js');
  const audio = new s.window.AudioSystem(); audio.context = fakeAudioContext(); audio.initialized = true; audio.musicTracks = {};
  const p1 = audio.prepareActiveMusicProfile(); const p2 = audio.prepareActiveMusicProfile();
  assert(p1 === p2, 'Repeated preparation joins one in-flight promise');
  const prepared = await p1;
  assert(prepared.ok, 'Active Level 1 profile preparation succeeds with fallbacks');
  for (const id of ['foundation','bass-layer','fx-layer']) assert(audio.musicTracks[id] && audio.musicTracks[id].buffer, `${id} has usable buffer after preparation`);
  audio.layersStarted = false;
  const start = audio.startAllLayersSimultaneously();
  assert(start && start.reason !== 'missing-required-source', 'Gameplay music start is not missing prepared sources');
}

console.log('PASS action/combat hotfix regression checks');
})().catch(error => { console.error(error && error.stack || error); process.exit(1); });
