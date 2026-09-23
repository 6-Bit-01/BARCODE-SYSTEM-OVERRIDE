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
  assert.equal(w.BARCODE.musicDirector.desiredState(), 'explore');
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
  s.player.y = 798 - 76; s.player.vy = 0; s.player.x = 1300;
  for (let i = 0; i < 5; i++) { s.shots.push({ x: 1640, y: 745, vx: 1020, life: 1000 }); proof.update(16); }
  assert.equal(s.relays[0], 0);
  assert.equal(archive.record.current.checkpointId, 'proof-relay');
  assert.deepEqual(copy(archive.record.progress.items), ['stem.voice'], 'preview leaves the earned Level 1 key intact');

  // The saved proof checkpoint survives a new adapter instance/session.
  const saved = C.readResume();
  proof.dispose();
  assert(C.restore(saved));
  assert.equal(proof.state.relays[0], 0);
  assert.equal(proof.state.enemies[0].health, 0);
  assert.equal(w.gameState.running, true);
  const malicious = copy(saved); malicious.levelState.returnTo.levelState.run.runId = null;
  assert.equal(proof.validate(malicious), false, 'a malformed parent checkpoint cannot be embedded');

  proof.state.player.x = 3000;
  proof.state.enemies.forEach(enemy => { enemy.health = 0; });
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
  proof.state.relays = [0, 0]; proof.state.player.x = 4800 - 130;
  proof.update(16);
  assert.equal(proof.status, 'clear');
  assert.equal(archive.record.current.checkpointId, 'proof-clear');
  assert(!archive.record.progress.completedLevels.includes('level-03'));
  assert(!archive.record.progress.items.includes('stem.drums'));
  assert.equal(w.BARCODE.musicDirector.desiredState(), 'victory');
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
  console.log('Broadcast Slum: controls, two-stem profile, phrase volley, checkpoint reload, no awards and Level 1 return passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
