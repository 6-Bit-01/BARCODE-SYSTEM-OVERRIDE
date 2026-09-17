// Real production owners. Web Audio nodes, browser storage and time are host
// boundaries; this is scheduling/logic evidence, not an audible Makko verdict.
const assert = require('assert'), fs = require('fs'), crypto = require('crypto');
const { createRig, load } = require('./check-level-01-boss');
const copy = x => JSON.parse(JSON.stringify(x));
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const contract = require('../docs/technical/music-sync-baseline.json');

function audioRig(dynamic = true) {
  const r = createRig(), { w, context } = r;
  load(context, 'src/engine/music-director.js'); load(context, 'src/engine/audio.js');
  for (const [name, digest] of Object.entries(contract.methods)) assert.equal(hash(w.AudioSystem.prototype[name].toString()), digest, `${name}: protected synchronization changed`);
  assert.equal(hash(fs.readFileSync('src/engine/music-transport.js')), contract.transportSha256);
  const profile = copy(w.BARCODE.MusicProfiles.get('level-01.main'));
  delete profile.adaptiveMix; profile.arrangement.sources.forEach(s => delete s.mixRole);
  assert.deepStrictEqual(profile, contract.profile, 'source URLs/offsets/loops/gains, grid and judgment stay unchanged');
  let wall = 0, id = 0, rhythm = false, hack = false;
  const queue = new Map(), trace = [], nodes = [];
  const param = value => ({ value, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; },
    exponentialRampToValueAtTime(v) { this.value = v; }, cancelAndHoldAtTime() {}, cancelScheduledValues() {} });
  const node = () => { const n = { gain: param(1), connections: new Set(), connect(to) { this.connections.add(to); }, disconnect(to) { if (to) this.connections.delete(to); else this.connections.clear(); } }; nodes.push(n); return n; };
  const ac = { currentTime: 0, state: 'running', sampleRate: 44100, createGain: node,
    createBiquadFilter() { return Object.assign(node(), { frequency: param(18000), Q: param(0) }); },
    createDelay() { return Object.assign(node(), { delayTime: param(0) }); },
    createBufferSource() { return Object.assign(node(), { playbackRate: param(1), loop: false,
      start(time, offset) { trace.push(['start', this.buffer.id, time, offset, this.loop, this.playbackRate.value]); },
      stop() { trace.push(['stop', this.buffer.id, ac.currentTime]); } }); },
    async suspend() { this.state = 'suspended'; }, async resume() { this.state = 'running'; }
  };
  function schedule(fn, ms, repeat) { const next = ++id; queue.set(next, { fn, due: wall + (Number(ms) || 0), repeat }); return next; }
  w.setTimeout = (fn, ms) => schedule(fn, ms, 0); w.clearTimeout = key => queue.delete(key);
  w.setInterval = (fn, ms) => schedule(fn, ms, ms); w.clearInterval = key => queue.delete(key);
  const audio = w.audioSystem = new w.AudioSystem();
  Object.assign(audio, { initialized: true, context: ac, musicGain: node(), sfxGain: node() });
  for (const s of profile.arrangement.sources) audio.musicTracks[s.sourceId] = { buffer: { id: s.sourceId, duration: s.sourceId === 'bass-layer' ? 210.442 : 212.088 }, volume: 0 };
  w.BARCODE.Preferences = { values: { dynamicMusic: dynamic } };
  w.rhythmSystem = { isActive: () => rhythm, isRunning: () => true, prepareForLoopRestart() {}, resetBeatCounter() {}, restartForLoop() {}, combo: 0 };
  w.hackingSystem = { isActive: () => hack };
  function advance(ms) {
    const target = wall + ms;
    while (true) {
      const next = [...queue].filter(([, t]) => t.due <= target).sort((a,b) => a[1].due - b[1].due)[0];
      if (!next) break;
      const [key, task] = next;
      if (ac.state === 'running') ac.currentTime += (task.due - wall) / 1000;
      wall = task.due; queue.delete(key);
      if (task.repeat) queue.set(key, { ...task, due: wall + task.repeat });
      task.fn();
    }
    if (ac.state === 'running') ac.currentTime += (target - wall) / 1000;
    wall = target; audio.updateLayers();
  }
  return { ...r, audio, ac, trace, nodes, queue, advance, setRhythm(v) { rhythm = v; }, setHack(v) { hack = v; } };
}

async function checkAudio() {
  const runs = [];
  for (const dynamic of [false, true]) {
    const r = audioRig(dynamic), { w, audio, ac } = r;
    assert(audio.startAllLayersSimultaneously().ok);
    for (let frame = 0; frame < 35000; frame++) {
      r.setRhythm(frame % 500 < 250); r.setHack(frame % 900 > 800);
      w.rhythmSystem.combo = Math.floor(frame / 35) % 22;
      if (frame === 4700) { w.gameState.paused = true; await audio.pauseRuntimeAudio(); }
      if (frame === 4850) { w.gameState.paused = false; await audio.resumeRuntimeAudio(); }
      if (frame % 1100 === 0) w.BARCODE.musicDirector.accent('hack');
      r.advance(20);
      assert(Object.values(audio.musicTracks).every(t => !t.source || t.source.playbackRate.value === 1));
    }
    const starts = r.trace.filter(t => t[0] === 'start');
    assert.equal(starts.length, 12, 'initial start plus three full legacy restarts, three sources each');
    for (let i = 0; i < starts.length; i += 3) {
      assert.equal(starts[i][2], starts[i+1][2]); assert.equal(starts[i][2], starts[i+2][2]);
      assert(starts.slice(i, i+3).every(t => t[3] === 0 && t[4] === true));
    }
    runs.push({ trace: r.trace, transport: copy(w.BARCODE.MusicTransport.sample(ac.currentTime)) });
    audio.stopRuntimeAudio();
    assert.equal(r.queue.size, 0, 'stop clears all audio callbacks');
    assert.equal(w.BARCODE.musicDirector.graph, null, 'effect nodes disposed on exit');
  }
  assert.deepStrictEqual(runs[0], runs[1], 'arrangement/effects cannot change source schedule, offsets, loop boundaries or transport');

  const r = audioRig(), { w, audio } = r;
  audio.startAllLayersSimultaneously(); r.advance(100);
  r.setRhythm(true); r.advance(2000);
  const before = r.trace.length;
  w.BARCODE.Preferences.values.dynamicMusic = false; r.advance(20);
  assert.equal(audio.musicTracks.foundation.volume, 0.4);
  assert.equal(audio.musicTracks['bass-layer'].volume, 0, 'original rhythm-with-no-enemies mix');
  assert.equal(audio.musicTracks['fx-layer'].volume, 0.8);
  assert.equal(w.BARCODE.musicDirector.graph, null);
  assert.equal(r.trace.length, before, 'A/B switch does not restart a source');
  w.BARCODE.Preferences.values.dynamicMusic = true;
  r.p.state = 'boss_combat'; r.p.boss = { active: true, defeated: false, phase: 'telegraph' };
  r.advance(2000);
  assert(audio.musicTracks['bass-layer'].volume > 0, 'boss has pressure even with no ordinary enemies');

  audio.stopRuntimeAudio();
  const second = copy(w.BARCODE.MusicProfiles.get('level-01.main'));
  second.profileId = 'proof.different-song'; second.levelId = 'proof'; second.runtimeRegistration = false; second.metadataStatus = 'verified';
  delete second.legacyCompatibility; delete second.compatibility;
  second.playback = { startTrackSec: 0, loop: null, endPolicy: 'level-controlled' };
  second.timeline.fixedGrid = { quarterBpm: 92, beatsPerBar: 3, beatUnit: 4 };
  second.phrasePresentation = { barsPerPhrase: 2, beatCount: 6 };
  second.arrangement.sources.forEach((s,i) => { s.sourceId = ['engine-bed','road-pulse','tape-colour'][i]; s.assetId = `proof.${i}`; });
  const roleNames = {bed:'motor',pressure:'gears',colour:'airwaves'};
  second.arrangement.sources.forEach(s => { s.mixRole = roleNames[s.mixRole]; });
  second.adaptiveMix.colourRole = 'airwaves';
  for (const [key, levels] of Object.entries(second.adaptiveMix.states)) second.adaptiveMix.states[key] = Object.fromEntries(Object.entries(levels).map(([role, value]) => [roleNames[role], value]));
  w.BARCODE.MusicProfiles.register(second); w.BARCODE.MusicProfiles.select(second.profileId); w.BARCODE.MusicTransport.load(second.profileId);
  audio.musicTracks = Object.fromEntries(second.arrangement.sources.map(s => [s.sourceId, {buffer:{id:s.sourceId,duration:12},volume:0}]));
  assert(audio.startAllLayersSimultaneously().ok); r.advance(2000);
  assert.deepStrictEqual(Object.keys(w.BARCODE.musicDirector.volumes), second.arrangement.sources.map(s => s.sourceId));
  assert.equal(w.BARCODE.MusicTransport.sample(r.ac.currentTime).grid.beatsPerBar, 3);
  assert.equal(audio.musicTracks.foundation, undefined);
  audio.stopRuntimeAudio();
  console.log('Audio: unchanged timing contract, 3 full loops, pause/resume, effects A/B and independent 92 BPM / 3-beat source roles passed.');
}

function campaignRig(storage = new Map()) {
  const r = createRig(), { w, context } = r;
  w.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) };
  for (const file of ['src/game/lore-collection.js','src/game/level-difficulty.js','src/game/campaign-services.js','src/game/lost-data.js']) load(context, file);
  w.lostDataSystem = new w.LostDataSystem(); w.lostDataSystem.init(w.player);
  const d = w.BARCODE.LevelDifficulty; d.beginLevel(); d.select(1); d.confirm();
  return { ...r, storage, c: w.BARCODE.Campaign };
}

async function checkCampaign() {
  for (const stage of ['encounter_1','encounter_2','encounter_3','encounter_4','jammer','boss']) {
    const r = campaignRig(), { w, p, c, storage } = r;
    r.reachReady(); w.player.position.x = 2000;
    assert(c.checkpoint(stage)); const saved = c.readResume(); assert(saved);
    const next = campaignRig(storage);
    let bossArtReady = stage !== 'boss';
    if (stage === 'boss') {
      const sprite = next.w.MakkoEngine.sprite;
      next.w.MakkoEngine.sprite = function(...args) {
        const result = sprite(...args); result.isLoaded = () => bossArtReady; return result;
      };
    }
    assert(next.c.restore(saved));
    assert.equal(next.p.state, stage === 'boss' ? 'boss_ready' : stage === 'jammer' ? 'jammer_active' : stage);
    assert.equal(next.p.missionDefeats, { encounter_1:0, encounter_2:4, encounter_3:9, encounter_4:14, jammer:20, boss:20 }[stage]);
    assert(next.w.BARCODE.LevelDifficulty.locked); assert.equal(next.w.BARCODE.LevelDifficulty.choice.id, 'standard');
    assert.equal(next.w.player.position.y, 784);
    if (stage === 'boss') {
      assert(!next.p.boss.spriteReady, 'resume tolerates a pending host sprite');
      bossArtReady = true; next.tick(20);
      assert(next.p.boss.spriteReady, 'normal frame polling installs late boss art after resume');
      assert(!next.p.boss.fallbackLocked);
    }
  }
  const r = campaignRig(), { w, p, c, storage } = r;
  r.reachReady(); p.beginBossCombat(); w.player.position.x = p.boss.x - 150;
  const generation = w.BARCODE.MusicTransport.getDiagnostics().generation;
  w.gameState.gameOver = true; assert(p.retryBossCheckpoint().ok);
  assert.equal(c.run.retries, 1); assert.equal(w.BARCODE.MusicTransport.getDiagnostics().generation, generation);
  p.beginBossCombat(); w.rhythmSystem.show(); p.setBossCombatPhase('recovery');
  w.player.position.x = p.boss.x - 150;
  for (let i = 0; i < 10; i++) r.beat();
  assert(p.boss.defeated); assert(c.result); assert.equal(c.run.connected, 26, 'final killing hit included once');
  assert.equal(c.run.attempts, 26); assert.equal(c.result.bonus, 1600, 'retry excludes no-damage bonus');
  const archive = w.lostDataSystem.archive;
  assert.deepStrictEqual(copy(archive.record.progress.items), ['stem.voice']);
  assert(archive.record.progress.unlockedLevels.includes('level-02'));
  assert(archive.record.progress.results['level-01'].standard.best.score > 0);
  const winning = copy(archive.record.progress.results);
  const reopened = campaignRig(storage), saved = reopened.c.readResume();
  assert.equal(saved.checkpointId, 'intermission'); assert(reopened.c.restore(saved));
  assert(reopened.c.intermission && reopened.w.gameState.victory && !reopened.w.gameState.running);
  assert.deepStrictEqual(copy(reopened.w.lostDataSystem.archive.record.progress.results), winning, 'resume grants no second award');
  const stale = new w.BARCODE.LoreCollection();
  assert(p.retryBossCheckpoint().ok); p.beginBossCombat(); p.setBossCombatPhase('recovery');
  w.player.position.x = p.boss.x - 150; w.rhythmSystem.show();
  for (let i = 0; i < 10; i++) r.beat();
  assert.equal(c.result.bonus, 0, 'boss practice grants no clear bonus');
  assert.deepStrictEqual(copy(archive.record.progress.results), winning, 'practice cannot replace full-run records');
  stale.collect('lore.l02.01');
  const merged = new w.BARCODE.LoreCollection();
  assert(merged.has('lore.l02.01')); assert(merged.record.progress.items.includes('stem.voice'));
  assert.deepStrictEqual(copy(merged.record.progress.results), winning, 'stale tab preserves result/key facts');
  load(reopened.context, 'src/core/runtime-lifecycle.js');
  assert((await reopened.w.BARCODE.RuntimeLifecycle.start({ resume: saved })).ok, 'actual lifecycle skips intro and restores saved intermission');
  assert(!reopened.w.gameState.running && reopened.w.gameState.victory);
  assert.equal(reopened.calls.musicStarts, 1, 'fresh browser resume starts its song exactly once');
  console.log('Campaign: six checkpoint types, locked difficulty, terminal resume, complete run stats, one-time key/bonus, practice and concurrent saves passed.');
}

function checkBoss() {
  const report = [];
  for (const fps of [30,60,120]) for (const difficulty of [0,1,2]) {
    const r = campaignRig(), { w, p } = r, d = w.BARCODE.LevelDifficulty;
    d.beginLevel(); d.select(difficulty); d.confirm(); r.reachReady();
    w.player.position.x = p.boss.x - 150; w.player.invulnerableUntil = Infinity;
    w.rhythmSystem.show(); let lastBeat = -1;
    const hits = {}, patterns = new Set();
    for (let i = 0; i < fps * 90 && !p.boss.defeated; i++) {
      r.tick(1000 / fps); patterns.add(p.boss.attackPattern);
      const beat = p.getBossMusicSample()?.grid.beatIndex;
      if (beat !== lastBeat) {
        lastBeat = beat;
        if (p.boss.phase === 'recovery') {
          const result = w.BARCODE.playerCombat.resolvePrimary({ now: w.Date.now() });
          if (result.targets.some(t => t.type === 'boss')) hits[p.boss.cycle] = (hits[p.boss.cycle] || 0) + 1;
        }
      }
    }
    assert(p.boss.defeated, 'every difficulty remains finishable');
    if (difficulty > 0) { assert(Object.keys(hits).length >= 3, 'skilled rhythm cannot finish in two openings'); assert(patterns.has('slam')); }
    report.push({ fps, difficulty: d.choice.id, hits });
  }
  for (const fps of [30,60,120]) for (const escape of [false,true]) {
    const r = campaignRig(), { w, p } = r;
    r.reachReady(); p.beginBossCombat(); w.player.position.x = p.boss.x - 150;
    p.boss.cycle = 2; p.boss.health = 5; p.setBossCombatPhase('telegraph');
    assert.equal(p.boss.attackPattern, 'slam'); const aim = p.boss.slam.x, health = w.player.health;
    if (escape) w.player.position.x = aim + 240;
    for (let i = 0; i < fps * 3; i++) r.tick(1000/fps);
    assert.equal(p.boss.slam.x, aim, 'warning locks aim');
    assert.equal(w.player.health, health - (escape ? 0 : 1), 'marked slam matches its visual region and hits at most once');
  }
  console.log('Boss: actual rhythmic attacks and readable slam at 30/60/120Hz:', JSON.stringify(report));
}

(async () => { await checkAudio(); await checkCampaign(); checkBoss(); })().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
