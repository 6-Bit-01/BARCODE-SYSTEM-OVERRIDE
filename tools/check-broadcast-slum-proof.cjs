// Exercise the production preview adapter, transport, combat and campaign save.
// Canvas/audio context are host boundaries; hosted Makko feel is reviewed later.
const assert = require('assert');
const fs = require('fs');
const { createRig, load } = require('./check-level-01-boss');
const copy = value => JSON.parse(JSON.stringify(value));

function level1Intermission() {
  return { levelId: 'level-01', checkpointId: 'intermission', levelState: {
    difficultyId: 'standard', run: { levelId: 'level-01', runId: 'proof-parent', recoveryMode: 'checkpoints',
      elapsedMs: 120000, damageTaken: 1, retries: 0, attempts: 18, accurate: 14, perfect: 8,
      connected: 9, connectedPerfect: 5, completed: true },
    score: 2400, bestCombo: 8, health: 3, playerX: 3500,
    fragments: ['lore.l01.01'], skyCaches: [], ampCharges: 1,
    boss: { bossX: 3480, playerX: 3500, score: 2400, skyCaches: [] },
    result: { score: 2400 }
  } };
}

async function run() {
  const { w, context } = createRig();
  const store = new Map();
  w.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) };
  w.inputManager = { resetActionEdges() {} };
  const button = { hidden: true, disabled: true, textContent: '' };
  w.document.getElementById = id => id === 'continueButton' ? button : null;
  load(context, 'src/game/lore-collection.js');
  const archive = w.lostDataSystem.archive = new w.BARCODE.LoreCollection();
  load(context, 'src/game/campaign-services.js');
  load(context, 'src/engine/broadcast-slum-proof-profile.js');
  load(context, 'src/engine/music-director.js');
  load(context, 'src/game/broadcast-slum-proof.js');
  const debugKeys = [];
  const addListener = w.addEventListener;
  w.addEventListener = (type, listener, ...args) => {
    if (type === 'keydown') debugKeys.push(listener);
    return addListener.call(w, type, listener, ...args);
  };
  load(context, 'src/game/level-03-debug.js');
  const C = w.BARCODE.Campaign, proof = w.BARCODE.RunAndGunProof, transport = w.BARCODE.MusicTransport;
  const parent = level1Intermission();
  assert(C.validateLevel01Checkpoint(parent));
  archive.record.progress.completedLevels.push('level-01');
  archive.record.progress.items.push('stem.voice');
  assert(archive.checkpoint(parent));
  C.intermission = true;
  w.gameState.victory = true; w.gameState.running = false;
  w.audioSystem.prepareActiveMusicProfile = async () => ({ ok: true });
  w.audioSystem.musicTracks = {
    'slum-carrier': { buffer: { duration: 16 * 60 / 108 }, isFallback: false },
    'slum-pressure': { buffer: { duration: 16 * 60 / 108 }, isFallback: false }
  };
  w.audioSystem.startRuntimeGameplayMusic = () => {
    assert.equal(w.BARCODE.MusicProfiles.getActive().profileId, 'level-03.proof');
    const started = transport.start({ sourceAnchorAudioSec: 0, sourceOffsetTrackSec: 0 });
    return { ok: started.status === 'ok' && started.running };
  };
  w.audioSystem.context.currentTime = 0.01;
  let exitOptions;
  w.BARCODE.RuntimeLifecycle = { async restart(opts) { exitOptions = opts; proof.dispose(); return { ok: true }; } };

  const profile = w.BARCODE.MusicProfiles.get('level-03.proof');
  assert.equal(profile.timeline.fixedGrid.quarterBpm, 108);
  assert.deepEqual(profile.arrangement.sources.map(s => s.sourceId), ['slum-carrier', 'slum-pressure']);
  for (const source of profile.arrangement.sources) {
    const bytes = fs.readFileSync(source.url);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.readUInt32LE(24), 22050);
    assert.equal(bytes.readUInt32LE(40) / 2, 196000, 'both native-loop stems share the 16-beat seam');
  }
  assert.equal((await proof.enter()).ok, true);
  assert.equal(archive.record.current.levelId, 'level-03');
  assert.equal(button.textContent, 'CONTINUE PROTOTYPE — C / Y');
  assert.equal(C.intermission, false);
  assert.equal(C.run, null, 'preview does not inherit the completed Level 1 run');
  assert.equal(w.BARCODE.musicDirector.desiredState(), 'combat', 'an elevated gunner pressures the opening');
  load(context, 'src/core/action-input.js');
  load(context, 'src/core/input.js');
  const input = new w.InputManager();
  w.inputManager = input;
  const routedX = proof.state.player.x;
  input.routeActions({ pause: { pressed: false }, move_right: { held: true }, move_left: { held: false },
    jump: { pressed: true }, inspect: { held: true } });
  proof.update(16);
  assert(proof.state.player.x > routedX && proof.state.shots.length, 'the actual input owner routes movement, jump and fire to the preview');

  const s = proof.state;
  s.player.x = 1360; s.player.y = 798 - 76;
  assert.equal(w.BARCODE.musicDirector.desiredState(), 'combat');
  s.enemies.forEach(enemy => { enemy.health = 0; });
  proof.handleActions({ move_right: { held: true }, move_left: { held: false }, jump: { pressed: true }, inspect: { held: true } });
  const x = s.player.x;
  proof.update(16);
  assert(s.player.x > x && !s.player.grounded && s.shots.length, 'movement, jump and fire are active together');
  s.shots = []; s.player.y = 798 - 76; s.player.vy = 0; s.player.x = 1140;
  const shieldedHp = s.relays[0];
  s.shots.push({ x: 1640, y: 745, vx: 1020, life: 1000 }); proof.update(16);
  assert.equal(s.relays[0], shieldedHp, 'street-level fire cannot bypass an intact roof node');
  s.player.grounded = true;
  proof.handleActions({ jump: { pressed: true } });
  for (let i = 0; i < 40; i++) proof.update(16);
  assert.equal(s.player.y, 675 - 76, 'the roof is reachable with the ordinary jump');
  assert(s.player.scatterMs > 0 && !s.pickups[0].active, 'climbing collects the scatter chip');
  s.shots = []; s.fireCooldownMs = 0;
  proof.handleActions({ inspect: { held: true } });
  assert.deepEqual(s.shots.map(shot => shot.vy), [-220, 0, 220], 'one familiar fire control produces a temporary fan');
  s.shots = [];
  for (let i = 0; i < 3; i++) { s.shots.push({ x: 1250, y: 638, vx: 1020, life: 1000 }); proof.update(16); }
  assert.equal(s.nodes[0], 0, 'the roof node can be shot from the reachable platform');
  for (let i = 0; i < 3; i++) { s.shots.push({ x: 1640, y: 745, vx: 1020, life: 1000 }); proof.update(16); }
  assert.equal(s.relays[0], 2);
  assert.equal(s.counter?.index, 0, 'sustained relay fire forces a counter surge');
  assert.equal(s.counter.roofY, 675 - 76 + 34, 'the warning marks the occupied roof lane');
  assert(s.enemies.some(enemy => enemy.reinforcement && enemy.spawnMs > 0), 'a runner telegraphs behind the player');
  s.shots.push({ x: 1640, y: 745, vx: 1020, life: 1000 }); proof.update(16);
  assert.equal(s.relays[0], 2, 'the core shields during its counter warning');
  proof.update(1000); proof.update(50);
  assert.equal(s.hostileShots.filter(shot => shot.volley).length, 2, 'the counter launches a two-lane volley');
  const roofShot = s.hostileShots.find(shot => shot.roof);
  assert(roofShot && roofShot.y === s.counter.roofY, 'roof camping draws a separate marked shot');
  s.player.y = 798 - 76; s.player.vy = 0; s.player.grounded = true;
  roofShot.x = s.player.x;
  const dropHealth = s.player.health;
  proof.update(16);
  assert.equal(s.player.health, dropHealth, 'dropping below the marked roof shot is a valid response');
  proof.update(400);
  assert.equal(s.counter, null, 'the core reopens after the counter');
  for (let i = 0; i < 2; i++) { s.shots.push({ x: 1640, y: 745, vx: 1020, life: 1000 }); proof.update(16); }
  assert.equal(s.relays[0], 0);
  assert.equal(archive.record.current.checkpointId, 'proof-relay');
  assert.deepEqual(copy(archive.record.progress.items), ['stem.voice'], 'preview leaves the earned Level 1 key intact');

  // The saved proof checkpoint survives a new adapter instance/session.
  const saved = C.readResume();
  proof.dispose();
  assert(C.restore(saved));
  assert.equal(proof.state.relays[0], 0);
  assert.equal(proof.state.nodes[0], 0, 'old preview checkpoints infer cleared nodes from cleared relays');
  assert.equal(proof.state.enemies[0].health, 0);
  assert.equal(w.gameState.running, true);
  const malicious = copy(saved); malicious.levelState.returnTo.levelState.run.runId = null;
  assert.equal(proof.validate(malicious), false, 'a malformed parent checkpoint cannot be embedded');

  proof.state.player.x = 3000;
  proof.state.enemies.forEach(enemy => { enemy.health = 0; });
  const gunner = proof.state.enemies[3], runner = proof.state.enemies[2];
  gunner.health = 3; gunner.cooldownMs = 0;
  proof.update(16);
  assert(gunner.warningMs > 0, 'the elevated gunner telegraphs its aimed fire');
  for (let i = 0; i < 48; i++) proof.update(16);
  assert(proof.state.hostileShots.some(shot => !shot.volley && shot.vy !== 0), 'the gunner fires at player height');
  runner.health = 3; runner.x = 3190; runner.direction = 1;
  const runnerX = runner.x;
  proof.update(16);
  assert(runner.x < runnerX, 'the runner actively closes from the right');
  const shield = proof.state.enemies.find(enemy => enemy.kind === 'bulwark');
  shield.health = 5; shield.x = 2610; shield.warningMs = 0;
  proof.state.shots.push({ x: 2585, y: shield.y + 35, vx: 1020, life: 1000 });
  proof.update(16);
  assert.equal(shield.health, 5, 'front armor rejects ordinary fire');
  shield.warningMs = 500;
  proof.state.shots.push({ x: 2585, y: shield.y + 35, vx: 1020, life: 1000 });
  proof.update(16);
  assert.equal(shield.health, 4, 'the marked charge exposes the shield unit');
  shield.warningMs = 0;
  proof.state.shots.push({ x: 2660, y: shield.y + 35, vx: -1020, life: 1000 });
  proof.update(16);
  assert.equal(shield.health, 3, 'a rear shot flanks the shield');
  const drone = proof.state.enemies.find(enemy => enemy.kind === 'drone');
  drone.health = 3; drone.cooldownMs = 0;
  proof.update(16);
  assert(drone.warningMs > 0 && drone.y !== drone.platformY, 'the interceptor moves above street fire and marks its attack');
  for (let i = 0; i < 45; i++) proof.update(16);
  assert(proof.state.hostileShots.some(shot => shot.vy !== 0), 'the interceptor fires an angled shot');
  proof.state.hostileShots = [];
  proof.state.enemies.forEach(enemy => { enemy.health = 0; });
  proof.state.player.invulnerableMs = 0;
  w.audioSystem.context.currentTime = 15.2 * 60 / 108;
  proof.update(16);
  assert.equal(proof.state.warning, true);
  w.audioSystem.context.currentTime = 16.05 * 60 / 108;
  proof.update(16);
  assert.equal(proof.state.hostileShots.filter(shot => shot.volley).length, 2, 'phrase crossing fires one warned two-lane volley');
  const health = proof.state.player.health;
  proof.state.hostileShots[0].x = proof.state.player.x;
  proof.state.hostileShots[0].y = proof.state.player.y + 15;
  proof.update(16);
  assert.equal(proof.state.player.health, health - 1);
  proof.hitPlayer(); assert.equal(proof.state.player.health, health - 1, 'damage has one invulnerability window');

  // From relay range, a jump started during the warning must actually clear
  // both advancing lanes. The high lane should leave a usable timing window.
  proof.state.hostileShots = [];
  proof.state.player.x = 3180; proof.state.player.y = 798 - 76;
  proof.state.player.vx = 0; proof.state.player.vy = 0;
  proof.state.player.grounded = true; proof.state.player.invulnerableMs = 0;
  const dodgeHealth = proof.state.player.health;
  proof.handleActions({ move_right: { held: false }, move_left: { held: false }, jump: { pressed: true } });
  for (let i = 0; i < 14; i++) proof.update(16);
  proof.state.hostileShots.push(...[798 - 53, 798 - 100].map(y => ({ x: 3300, y, vx: -590, vy: 0, life: 2100, volley: true })));
  for (let i = 0; i < 16; i++) proof.update(16);
  assert.equal(proof.state.player.health, dodgeHealth, 'a warned full-speed jump clears both relay lanes');

  proof.state.hostileShots = [];
  proof.state.relays = [0, 0]; proof.state.player.x = 3780;
  proof.update(16);
  assert.equal(proof.status, 'playing', 'the transmitter gates the exit');
  assert.equal(archive.record.current.checkpointId, 'proof-boss');
  assert.equal(proof.state.player.health, 4, 'arena entry resets a fair four-hit attempt');
  assert.equal(proof.state.boss.health, 20);
  const bossCheckpoint = copy(C.readResume());
  const b = proof.state.boss;
  function strikeBoss(y, count, x = 4460) {
    for (let i = 0; i < count; i++) {
      proof.state.shots.push({ x, y, vx: 1020, life: 1000 });
      proof.update(16);
    }
  }
  strikeBoss(689, 1, 4520);
  assert.equal(b.health, 20, 'an intact feed protects the transmitter core');
  strikeBoss(610, 4);
  assert.deepEqual(copy(b.feeds), [0, 4], 'elevated fire breaks the upper feed');
  strikeBoss(733, 4);
  assert.deepEqual(copy(b.feeds), [0, 0], 'street fire breaks the lower feed');
  b.coreOpenMs = 0;
  strikeBoss(747, 1, 4520);
  assert.equal(b.health, 20, 'a closed shutter rejects core fire');
  b.coreOpenMs = 1350;
  strikeBoss(747, 10, 4520);
  assert.equal(b.phase, 2, 'core damage drives an accelerated second phase');
  assert.equal(b.health, 10);
  b.timerMs = 1; proof.update(16);
  assert.equal(b.attack, 'sweep'); assert(b.warningMs > 0);
  proof.update(900);
  assert(proof.state.hostileShots.some(shot => shot.volley), 'the boss sweep fires after its visible warning');
  proof.state.hostileShots = [];
  b.timerMs = 1; proof.update(16);
  assert.equal(b.attack, 'fan'); assert(b.warningMs > 0);
  proof.update(900);
  assert.equal(proof.state.hostileShots.filter(shot => shot.boss).length, 3);
  proof.state.hostileShots = [];
  b.timerMs = 1; proof.update(16);
  assert.equal(b.attack, 'beam'); assert(b.warningMs > 0);
  assert(proof.state.enemies.some(enemy => enemy.bossDrone && enemy.spawnMs > 0), 'overload calls one warned interceptor');
  const lockX = b.beamX;
  proof.state.player.x = lockX + 90;
  proof.update(1100);
  assert(b.beamMs > 0, 'the locked column fires after the player has time to move');
  const beamHealth = proof.state.player.health;
  proof.state.player.x = lockX + 5; proof.state.player.invulnerableMs = 0;
  proof.update(16);
  assert.equal(proof.state.player.health, beamHealth - 1, 'remaining in the live column costs one hit');
  proof.state.player.x = 3960; proof.state.player.invulnerableMs = 0;
  strikeBoss(747, 10, 4520);
  assert.equal(b.health, 0); assert(b.defeated);
  assert.equal(proof.status, 'playing', 'the player must still reach the uplink');
  proof.state.player.x = 4800 - 130;
  proof.update(16);
  assert.equal(proof.status, 'clear');
  assert.equal(archive.record.current.checkpointId, 'proof-clear');
  assert.equal(archive.record.current.levelState.previewVersion, 2);
  assert.equal(archive.record.current.levelState.proof.bossDefeated, true);
  assert(!archive.record.progress.completedLevels.includes('level-03'));
  assert(!archive.record.progress.items.includes('stem.drums'));
  assert.equal(w.BARCODE.musicDirector.desiredState(), 'victory');
  const newClear = copy(C.readResume());
  const legacyClear = copy(newClear);
  legacyClear.levelState.previewVersion = 1;
  delete legacyClear.levelState.proof.bossDefeated;
  assert(proof.restore(legacyClear), 'an old proof-clear remains loadable');
  assert(proof.state.boss.legacyClear, 'old clears do not pretend the new boss was defeated');
  assert(proof.checkpoint('proof-clear'));
  assert.equal(C.readResume().levelState.previewVersion, 1, 're-entering an earlier clear does not forge a v2 boss victory');
  assert(proof.restore(newClear));
  assert(proof.restore(bossCheckpoint), 'the boss checkpoint reloads a fresh encounter');
  assert.equal(proof.state.boss.health, 20);
  proof.state.enemies.forEach(enemy => { enemy.health = 0; });
  proof.state.player.x = 4120; proof.state.player.y = 650 - 76;
  proof.state.player.vx = 0; proof.state.player.facing = 1;
  proof.handleActions({ inspect: { held: true } });
  for (let i = 0; i < 25; i++) proof.update(16);
  assert.equal(proof.state.boss.feeds[0], 3, 'actual rooftop fire reaches the upper feed');
  assert(proof.restore(bossCheckpoint));
  proof.state.enemies.forEach(enemy => { enemy.health = 0; });
  proof.state.player.x = 4320; proof.state.player.y = 798 - 76;
  proof.state.player.vx = 0; proof.state.player.facing = 1;
  proof.handleActions({ inspect: { held: true } });
  for (let i = 0; i < 12; i++) proof.update(16);
  assert.equal(proof.state.boss.feeds[1], 3, 'actual street fire reaches the lower feed');
  assert(proof.restore(newClear));
  assert(await proof.exit());
  assert.equal(exitOptions.resume.checkpointId, 'intermission');
  assert.equal(archive.record.current.levelId, 'level-01');
  assert.equal(C.readResume().checkpointId, 'intermission');
  assert.equal(C.readResume().levelState.previewCheckpoint.checkpointId, 'proof-clear', 'explicit exit retains the preview checkpoint for re-entry');
  // The real lifecycle must select the proof profile on a fresh Continue,
  // dispose it on exit, then select Level 1 before restoring its handoff.
  assert(archive.checkpoint(saved));
  w.initSector1Progression = () => { w.sector1Progression = {
    reset() {}, restoreCampaignCheckpoint() { w.gameState.victory = true; return true; }
  }; };
  w.initObjectives = () => {};
  w.audioSystem.prepareRestartAudio = async () => { w.audioSystem.stopRuntimeAudio(); return { ok: true }; };
  const startedProfiles = [];
  w.audioSystem.startRuntimeGameplayMusic = () => {
    const profileId = w.BARCODE.MusicProfiles.getActive()?.profileId;
    startedProfiles.push(profileId);
    const started = transport.start({ sourceAnchorAudioSec: w.audioSystem.context.currentTime, sourceOffsetTrackSec: 0 });
    return { ok: started.status === 'ok' && started.running };
  };
  load(context, 'src/core/runtime-lifecycle.js');
  assert((await w.BARCODE.RuntimeLifecycle.start({ resume: saved })).ok);
  assert.equal(w.BARCODE.RuntimeLifecycle.getState(), 'running');
  assert(proof.active);
  assert.equal(w.BARCODE.MusicProfiles.getActive().profileId, 'level-03.proof');
  assert((await w.BARCODE.RuntimeLifecycle.pause('proof-review')).ok);
  assert.equal(w.BARCODE.RuntimeLifecycle.getState(), 'paused');
  assert(await proof.exit());
  assert.equal(w.BARCODE.MusicProfiles.getActive().profileId, 'level-01.main');
  assert.deepEqual(startedProfiles, ['level-03.proof', 'level-01.main']);
  assert.equal(C.intermission, true);
  assert.equal(w.gameState.victory, true);
  assert.equal(w.BARCODE.RuntimeLifecycle.getState(), 'running');
  assert.equal((await proof.enter()).ok, true);
  assert.equal(proof.state.relays[0], 0, 're-entering from Cache Back restores the last preview objective');
  assert.equal(archive.record.current.checkpointId, 'proof-relay');
  assert.equal(w.DEBUG.level3.completeProof().reason, 'debug-disabled');
  const shortcut = { key: 'F1', shiftKey: true, preventDefault() {}, stopPropagation() {} };
  debugKeys[0](shortcut);
  assert.equal(w.BARCODE.DEBUG_LEVEL_3_SESSION, true, 'Shift+F1 unlocks the preview menu only while the preview is active');
  const canvasListeners = {}, labels = [];
  const canvas = { width: 1920, height: 1080,
    addEventListener(type, fn) { canvasListeners[type] = fn; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1920, height: 1080 }; } };
  const ctx = { canvas, save() {}, restore() {}, fillRect() {}, strokeRect() {}, fillText(label) { labels.push(String(label)); } };
  w.DEBUG.level3.drawOverlay(ctx);
  assert(labels.includes('LEVEL 3 DEV — SESSION ONLY') && labels.includes('Complete Preview'));
  assert.equal(typeof canvasListeners.pointerdown, 'function', 'menu click target lives inside the existing canvas');
  assert.equal(w.DEBUG.level3.gotoRelay(1).ok, true);
  assert.equal(C.readResume().checkpointId, 'proof-start');
  assert.equal(w.DEBUG.level3.gotoRelay(2).ok, true);
  assert.equal(C.readResume().checkpointId, 'proof-relay');
  assert.deepEqual(copy(proof.state.relays), [0, 7]);
  assert.equal(w.DEBUG.level3.clearNode().ok, true);
  assert.equal(proof.state.nodes[1], 0);
  proof.restore(C.readResume());
  assert.equal(proof.state.nodes[1], 4, 'node-only debug changes are transient until its relay checkpoint');
  assert.equal(w.DEBUG.level3.clearRelay().ok, true);
  assert.equal(C.readResume().checkpointId, 'proof-relay-2');
  assert.deepEqual(copy(proof.state.relays), [0, 0]);
  assert.equal(w.DEBUG.level3.gotoBoss().ok, true);
  assert.equal(C.readResume().checkpointId, 'proof-boss');
  assert.equal(proof.state.boss.active, true);
  assert.equal(w.DEBUG.level3.giveScatter().ok, true);
  assert(proof.state.player.scatterMs > 0);
  proof.state.player.health = 1; proof.hitPlayer();
  assert.equal(proof.status, 'failed');
  assert.equal(w.DEBUG.level3.refill().ok, true);
  assert.equal(proof.status, 'playing');
  assert.equal(proof.state.player.health, 4);
  assert.equal(w.DEBUG.level3.clearDefenders().ok, true);
  assert(proof.state.enemies.every(enemy => enemy.health === 0));
  // The second-column completion button is exercised through the canvas pointer path.
  canvasListeners.pointerdown({ button: 0, currentTarget: canvas, clientX: 270, clientY: 900,
    preventDefault() {}, stopPropagation() {} });
  assert.equal(proof.status, 'clear');
  assert.equal(C.readResume().checkpointId, 'proof-clear');
  assert(proof.validate(C.readResume()));
  assert(!archive.record.progress.completedLevels.includes('level-03'));
  assert(!archive.record.progress.items.includes('stem.drums'));
  assert.equal(w.DEBUG.level3.resetProof().ok, true);
  assert.equal(proof.status, 'playing');
  assert.equal(C.readResume().checkpointId, 'proof-start');
  console.log('Broadcast Slum: distinct defenses, three boss attacks and phases, checkpoint migration, no awards, audio return and DEV controls passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
