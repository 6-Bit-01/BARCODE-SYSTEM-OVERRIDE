// Cache Back chase slice. It shares the existing input/RAF/audio/save/pause
// owners and awards no Level 2 campaign facts.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/cache-road-proof.js', exports: ['BARCODE.CacheRoadProof'], dependencies: ['BARCODE.Campaign', 'BARCODE.MusicTransport'] });
(function(B) {
  'use strict';
  const ID = 'level-02', PROFILE = 'level-02.proof';
  const LAP = 2460, END = 4 * LAP, GATE = 3 * LAP + 2060;
  const ZONE_COST = 60, ZONE_WINDOW = 16;
  const LANES = ['DRIVE', 'FLOW', 'BREAKAWAY', 'UNDERCURRENT'];
  const CHECKPOINTS = { 'road-start': 0, 'road-cache': 850, 'road-fork': 1700,
    'road-verse-2': 28, 'road-verse-3': 52, 'road-verse-4': 76,
    'road-gate': 92, 'road-clear': 100 };
  const TRAFFIC = [
    [190, 1, 'freight'], [275, 2, 'van'], [350, 0, 'block'], [465, 2, 'sweeper'],
    [550, 1, 'block'], [635, 2, 'freight'], [735, 0, 'van'], [895, 3, 'block'],
    [975, 1, 'freight'], [1050, 2, 'block'], [1135, 0, 'audit'], [1220, 3, 'van'],
    [1320, 1, 'block'], [1415, 2, 'sweeper'], [1510, 0, 'freight'], [1610, 3, 'van'],
    [1765, 1, 'freight'], [1840, 2, 'block'], [1930, 0, 'van'], [2005, 1, 'sweeper'],
    [2170, 2, 'audit'], [2265, 0, 'block'], [2345, 1, 'freight']
  ];
  // Paired traffic narrows the route at readable, repeatable places. Its open
  // lanes rotate each pass; a driver can always plan a route from the horizon.
  const GATES = { 550: [2], 975: [2, 3], 1320: [0], 1840: [1], 2005: [3], 2345: [2] };
  const HAZARDS = TRAFFIC.flatMap(([at, lane, kind]) => Array.from({ length: 5 }, (_, pass) => [
    { at: at + pass * LAP, lane: (lane + pass) % 4, kind },
    ...(GATES[at] || []).map(extra => ({ at: at + pass * LAP,
      lane: (extra + pass) % 4, kind: 'block' }))
  ]).flat());
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const laneAvailable = (lane, bar) => bar >= 0 && bar < 100 && (lane === 0 ||
    (lane === 1 ? bar >= 4 : bar >= 12 && (bar - 4) % 24 >= 8));
  const availableFor = (lane, startBar, endBar) =>
    Array.from({ length: endBar - startBar }, (_, index) => startBar + index)
      .every(bar => laneAvailable(lane, bar));
  const nextStrip = bar => (Math.floor(bar / 4) + 1) * 4;
  const laneArrival = (lane, bar) => {
    if (lane === 1) return 4;
    if (bar < 12) return 12;
    return 4 + Math.ceil((bar - 4) / 24) * 24 + 8;
  };
  const songSection = bar => {
    if (bar < 4) return 'INTRO';
    if (bar >= 100) return 'TAPE END';
    const phase = (bar - 4) % 24, cycle = 1 + Math.floor((bar - 4) / 24);
    return phase < 8 ? `VERSE ${cycle} A` : phase < 16 ? `VERSE ${cycle} B` : `CHORUS ${cycle}`;
  };
  const stackSize = state => Math.max(1, new Set(state.captures.map(capture => capture.lane)).size);
  const legacyPoint = { 'road-start': 0, 'road-cache': 850, 'road-fork': 1700,
    'road-gate': 2070, 'road-clear': LAP };
  function migrateProof(proof, version) {
    if (version === 4) return proof;
    const old = version === 3 ? proof : {
      ...proof, lane: [0, 0, 1, 3][proof.lane] ?? 0,
      lanePos: [0, 0, 1, 3][Math.round(proof.lanePos ?? proof.lane)] ?? 0,
      musicBar: Math.min(99, Math.floor(proof.progress / (54 * 1.875))) };
    // Indefinite old locks have no bar expiry. Refund them instead of turning
    // an old save into a permanent four-part stack.
    return { ...old, locked: [], lockEnergy: clamp((proof.lockEnergy ?? 65) +
      60 * (proof.locked || []).length, 0, 100) };
  }
  const roadCurve = progress => Math.sin(progress / 190) * 0.72 + Math.sin(progress / 410) * 0.24;
  const hazardLane = (hazard, progress, audits) => {
    if (hazard.kind === 'audit') return audits[hazard.at] ?? hazard.lane;
    if (hazard.kind === 'sweeper') return hazard.lane + clamp((progress - (hazard.at - 165)) / 120, 0, 1);
    return hazard.lane;
  };

  const PALETTE = ['#69d9f5', '#ffc077', '#cd9dff', '#91f5bc'];
  const polygon = (ctx, points, fill) => {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  };
  // One silhouette language at every depth. The four traffic kinds differ in
  // body shape, lights and warning marks even without reading their labels.
  function drawVehicle(ctx, x, y, w, h, kind, { alpha = 1, turbo = false } = {}) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= alpha;
    ctx.fillStyle = '#07111da9'; ctx.beginPath();
    ctx.ellipse(0, 7, w * 0.62, Math.max(4, h * 0.13), 0, 0, Math.PI * 2); ctx.fill();
    if (kind === 'block') {
      polygon(ctx, [[-w*.57,0],[-w*.54,-h*.64],[-w*.43,-h*.77],[w*.43,-h*.77],[w*.54,-h*.64],[w*.57,0]], '#f0a35b');
      polygon(ctx, [[-w*.47,-h*.59],[w*.47,-h*.59],[w*.44,-h*.13],[-w*.44,-h*.13]], '#2b3149');
      for (let i = -1; i <= 1; i++) polygon(ctx,
        [[(i-.42)*w/3,-h*.59],[(i+.08)*w/3,-h*.59],[(i+.42)*w/3,-h*.13],[(i-.08)*w/3,-h*.13]], '#ffe5a9');
      ctx.fillStyle = '#ff5f7b'; ctx.fillRect(-w*.48,-h*.78,w*.22,h*.1); ctx.fillRect(w*.26,-h*.78,w*.22,h*.1);
    } else if (kind === 'freight') {
      ctx.fillStyle = '#0b1e30'; ctx.fillRect(-w*.57,-h*.22,w*.17,h*.29); ctx.fillRect(w*.40,-h*.22,w*.17,h*.29);
      polygon(ctx, [[-w*.49,-h*.06],[-w*.49,-h*.88],[-w*.38,-h],[w*.38,-h],[w*.49,-h*.88],[w*.49,-h*.06]], '#657d89');
      polygon(ctx, [[-w*.40,-h*.89],[w*.40,-h*.89],[w*.42,-h*.28],[-w*.42,-h*.28]], '#19384d');
      ctx.strokeStyle = '#91c8d1'; ctx.lineWidth = Math.max(1,w*.018); ctx.strokeRect(-w*.38,-h*.86,w*.76,h*.56);
      ctx.fillStyle = '#d0dee0'; ctx.fillRect(-w*.025,-h*.86,w*.05,h*.58);
      ctx.fillStyle = '#ff8275'; ctx.fillRect(-w*.42,-h*.19,w*.19,h*.09); ctx.fillRect(w*.23,-h*.19,w*.19,h*.09);
    } else {
      const player = kind === 'cache' || kind === 'echo';
      const body = kind === 'rival' ? '#f9f6ee' : kind === 'audit' ? '#f1eee9' : kind === 'sweeper' ? '#e5a15f' :
        kind === 'van' ? '#4c8fc0' : kind === 'echo' ? '#b7f8ff' : turbo ? '#fbe3a3' : '#61e7d4';
      if (turbo) {
        polygon(ctx, [[-w*.35,0],[-w*.2,h*.48],[-w*.06,h*.04]], '#ffbb5f');
        polygon(ctx, [[w*.35,0],[w*.2,h*.48],[w*.06,h*.04]], '#ffbb5f');
      }
      ctx.fillStyle = '#0b1726'; ctx.fillRect(-w*.55,-h*.35,w*.15,h*.4); ctx.fillRect(w*.4,-h*.35,w*.15,h*.4);
      polygon(ctx, [[-w*.47,0],[-w*.53,-h*.48],[-w*.32,-h*.67],[w*.32,-h*.67],[w*.53,-h*.48],[w*.47,0]], body);
      polygon(ctx, [[-w*.33,-h*.59],[-w*.25,-h*.91],[w*.25,-h*.91],[w*.33,-h*.59]],
        kind === 'audit' || kind === 'rival' ? '#8f9ba6' : '#163b52');
      ctx.fillStyle = kind === 'audit' || kind === 'rival' ? '#fb6087' : kind === 'sweeper' ? '#fff2a8' : '#ffc077';
      ctx.fillRect(-w*.43,-h*.22,w*.23,h*.105); ctx.fillRect(w*.2,-h*.22,w*.23,h*.105);
      ctx.fillStyle = '#132239'; ctx.fillRect(-w*.16,-h*.19,w*.32,h*.11);
      if (player) {
        ctx.strokeStyle = '#eaffef'; ctx.lineWidth = Math.max(2,w*.024);
        ctx.beginPath(); ctx.moveTo(-w*.56,-h*.62); ctx.lineTo(w*.56,-h*.62); ctx.stroke();
        ctx.fillStyle = '#edfff4';
        ctx.beginPath(); ctx.arc(-w*.11,-h*.73,w*.045,0,Math.PI*2); ctx.arc(w*.11,-h*.73,w*.045,0,Math.PI*2); ctx.fill();
        ctx.font = `bold ${Math.max(8,w*.115)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText(kind === 'echo' ? 'REPLAY' : 'CACHE', 0, -h*.32);
        if (kind === 'echo') {
          ctx.strokeStyle = '#dfffff'; ctx.lineWidth = Math.max(2,w*.03);
          ctx.strokeRect(-w*.56,-h*.94,w*1.12,h*1.05);
        }
      } else if (kind === 'rival') {
        ctx.fillStyle = '#fc5c91'; ctx.fillRect(-w*.42,-h*.53,w*.84,h*.1);
        ctx.fillStyle = '#19334a'; ctx.font = `bold ${Math.max(8,w*.12)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('COPY', 0, -h*.31);
        ctx.strokeStyle = '#ffacc1'; ctx.lineWidth = Math.max(2,w*.03);
        ctx.beginPath(); ctx.moveTo(-w*.58,-h*.65); ctx.lineTo(w*.58,-h*.65); ctx.stroke();
      } else if (kind === 'audit') {
        polygon(ctx, [[0,-h*.94],[-w*.09,-h*.75],[0,-h*.7],[w*.09,-h*.75]], '#fd497f');
        ctx.fillStyle = '#fb6087'; ctx.fillRect(-w*.24,-h*.48,w*.48,h*.095);
      } else if (kind === 'sweeper') {
        ctx.fillStyle = '#fff0a8'; ctx.font = `bold ${Math.max(10,w*.22)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('>', 0, -h*.31);
      } else {
        ctx.fillStyle = '#9ae8ff'; ctx.fillRect(-w*.2,-h*.52,w*.4,h*.09);
      }
    }
    ctx.restore();
  }

  function newState(saved = {}) {
    const progress = saved.progress ?? 0;
    const lanePos = saved.lanePos ?? saved.lane ?? 1;
    return { progress, lanePos, lane: Math.round(lanePos), visualLane: lanePos,
      captures: [], queuedCaptures: [], candidateLane: null, candidateSince: null,
      previewLane: null, previewBeat: null, visitArmedStart: null,
      cutMarks: {}, cutStreak: 0, cutFlashMs: 0, cutAward: 0,
      musicBeatFloat: (saved.musicBar ?? 0) * 4,
      scoredThrough: (saved.musicBar ?? 0) - 1, damagedBar: -1,
      score: saved.score ?? 0, peakStack: saved.peakStack ?? 1,
      cleanBars: saved.cleanBars ?? 0, stumbleMs: 0,
      integrity: saved.integrity ?? 3,
      speed: saved.speed ?? 44, timeMs: saved.timeMs ?? 55000,
      musicBar: saved.musicBar ?? 0, gateAt: saved.gateAt ?? null,
      // Keep the saved field name so version-4 road checkpoints still load.
      lockEnergy: saved.lockEnergy ?? 0, zoneEndBeat: -1,
      echoEnergy: saved.echoEnergy ?? (progress >= 1700 ? 100 : 65),
      boost: saved.boost ?? 1, boostMs: 0, invulnerableMs: 0, nearMisses: 0,
      steer: 0, braking: false, trace: [], echo: null, echoDeceptions: 0,
      audits: {}, drafted: {}, draftMs: 0,
      nextRivalAt: progress >= 3 * LAP + 1700 ? progress + 120 : 3 * LAP + 1810,
      rivalTarget: 1.5, rivalLane: 1.5, rivalWarning: false,
      rivalEchoCommitted: false, rivalDistractedMs: 0,
      message: '', messageMs: 0,
      gateOpen: !!saved.gateOpen, gateFailure: null,
      status: saved.status || 'playing', elapsedMs: 0 };
  }

  const road = B.CacheRoadProof = {
    active: false, status: null, state: null, returnTo: null, pending: false,
    exiting: false, audioDegraded: false, oldHint: null,
    setHint() {
      const hint = document.querySelector?.('.hint');
      if (!hint) return;
      if (this.oldHint === null) this.oldHint = hint.textContent;
      hint.textContent = 'Hold a lane .5s: lock its next 4 bars | E/RB: lock now + next 4 | Close cuts fill Zone for faster road | Space/A Turbo | H/Y Echo';
    },
    selectMusicProfile() {
      const selected = B.MusicProfiles?.select(PROFILE);
      const loaded = selected && B.MusicTransport?.load(PROFILE);
      return { ok: selected?.profileId === PROFILE && loaded?.status === 'ok' };
    },
    checkAudioAssets() {
      const tracks = window.audioSystem?.musicTracks || {};
      this.audioDegraded = B.MusicProfiles.get(PROFILE).arrangement.sources.some(source =>
        !tracks[source.sourceId]?.buffer || tracks[source.sourceId].isFallback ||
        Math.abs(tracks[source.sourceId].buffer.duration - 187.5) > 0.08);
      return !this.audioDegraded;
    },
    validate(saved) {
      const s = saved?.levelState, p = s?.proof;
      const legacy = s?.proofVersion < 3;
      return saved?.levelId === ID && [1, 2, 3, 4].includes(s?.proofVersion) &&
        Object.hasOwn(CHECKPOINTS, saved.checkpointId) &&
        (legacy || !['road-cache', 'road-fork'].includes(saved.checkpointId)) &&
        s.returnTo?.checkpointId === 'intermission' &&
        B.Campaign.validateLevel01Checkpoint(s.returnTo) &&
        Number.isFinite(p?.progress) && p.progress >= 0 && p.progress <= (legacy ? LAP : 15000) &&
        (legacy ? Math.abs(p.progress - legacyPoint[saved.checkpointId]) <= 1 :
          Number.isInteger(p.musicBar) && p.musicBar >= 0 && p.musicBar <= 100 &&
          (saved.checkpointId === 'road-start' ? p.progress === 0 :
            saved.checkpointId === 'road-clear' ? p.musicBar >= 99 :
              ['road-gate', 'road-verse-2', 'road-verse-3', 'road-verse-4'].includes(saved.checkpointId))) &&
        Number.isInteger(p.lane) && p.lane >= 0 && p.lane < 4 &&
        Number.isInteger(p.integrity) && p.integrity >= 1 && p.integrity <= 3 &&
        (s.proofVersion === 1 ||
          Number.isFinite(p.lanePos) && p.lanePos >= 0 && p.lanePos <= 3 &&
          Number.isFinite(p.speed) && p.speed >= 10 && p.speed <= 78 &&
          Number.isFinite(p.timeMs) && p.timeMs > 0 && p.timeMs <= 60000 &&
          Number.isFinite(p.lockEnergy) && p.lockEnergy >= 0 && p.lockEnergy <= 100 &&
          Number.isFinite(p.echoEnergy) && p.echoEnergy >= 0 && p.echoEnergy <= 100) &&
        (s.proofVersion === 4 ?
          Number.isInteger(p.score) && p.score >= 0 &&
          Number.isInteger(p.peakStack) && p.peakStack >= 1 && p.peakStack <= 4 &&
          Number.isInteger(p.cleanBars) && p.cleanBars >= 0 && p.cleanBars <= 100 :
          Array.isArray(p.locked) && p.locked.length <= (s.proofVersion === 1 ? 2 : 3) &&
          new Set(p.locked).size === p.locked.length &&
          p.locked.every(lane => Number.isInteger(lane) && lane >= 0 && lane < 4));
    },
    async enter() {
      if (this.active || this.pending || B.RunAndGunProof?.active || B.RunAndGunProof?.pending ||
          !B.Campaign?.intermission) return { ok: false, reason: 'handoff-unavailable' };
      const returnTo = B.Campaign.readResume();
      if (returnTo?.levelId !== 'level-01' || returnTo.checkpointId !== 'intermission' ||
          !B.Campaign.archive().record.progress.completedLevels.includes('level-01'))
        return { ok: false, reason: 'level-01-clear-required' };
      const previous = returnTo.levelState.cacheRoadCheckpoint;
      delete returnTo.levelState.cacheRoadCheckpoint; // keep the return save shallow on repeat visits
      const candidate = previous && { levelId: ID, checkpointId: previous.checkpointId,
        levelState: { proofVersion: previous.proofVersion || 1, returnTo, proof: previous.proof } };
      const resume = this.validate(candidate) ? candidate : null;
      this.pending = true;
      B.Campaign.roadAudioNotice = null;
      let audioFailure = null;
      try {
        window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
        if (!this.selectMusicProfile().ok) throw new Error('road-profile-unavailable');
        const prepared = await window.audioSystem?.prepareActiveMusicProfile?.();
        if (!prepared?.ok) { audioFailure = prepared; throw new Error('road-audio-unavailable'); }
        if (!this.checkAudioAssets()) throw new Error('road-audio-invalid');
        this.returnTo = returnTo;
        this.state = newState(resume ? migrateProof(resume.levelState.proof, resume.levelState.proofVersion) : {});
        this.status = this.state.status; this.active = true;
        this.setHint();
        B.Campaign.intermission = false; B.Campaign.run = null;
        window.gameState.victory = false; window.gameState.gameOver = false;
        window.gameState.running = true;
        const started = window.audioSystem?.startRuntimeGameplayMusic?.();
        if (!started?.ok) throw new Error('road-audio-start-failed');
        this.checkpoint(resume?.checkpointId || 'road-start');
        window.inputManager?.resetActionEdges?.();
        return { ok: true };
      } catch (error) {
        console.error('[cache-road] Entry failed:', error?.message || error, audioFailure || '');
        this.dispose();
        if (previous) returnTo.levelState.cacheRoadCheckpoint = previous;
        B.Campaign.archive().checkpoint(returnTo);
        await B.RuntimeLifecycle?.restart?.({ source: 'road-entry-recovery', resume: returnTo });
        if (audioFailure || ['road-audio-invalid', 'road-audio-start-failed'].includes(error?.message)) {
          const names = audioFailure?.failures?.map(item => item.sourceId.replace('cache-', '').toUpperCase()).join(', ');
          B.Campaign.roadAudioNotice = `CACHE MUSIC UNAVAILABLE${names ? ` (${names})` : ''} — CHECK CONNECTION, THEN RETRY`;
        }
        return { ok: false, reason: error.message };
      } finally { this.pending = false; }
    },
    restore(saved) {
      if (!this.validate(saved)) return false;
      this.returnTo = clone(saved.levelState.returnTo);
      this.state = newState({ ...migrateProof(saved.levelState.proof, saved.levelState.proofVersion),
        status: saved.checkpointId === 'road-clear' ? 'clear' : 'playing' });
      this.status = this.state.status; this.active = true; this.exiting = false;
      this.setHint();
      this.checkAudioAssets();
      window.gameState.victory = false; window.gameState.gameOver = false;
      window.gameState.running = true;
      window.inputManager?.resetActionEdges?.();
      return true;
    },
    checkpoint(id) {
      if (!this.active || !this.returnTo || !Object.hasOwn(CHECKPOINTS, id)) return false;
      const s = this.state;
      const saved = B.Campaign.archive().checkpoint({ levelId: ID, checkpointId: id,
        levelState: { proofVersion: 4, returnTo: clone(this.returnTo), proof: {
          progress: id === 'road-start' ? 0 : s.progress, lane: s.lane, lanePos: s.lanePos,
          musicBar: id === 'road-start' ? 0 : s.musicBar, gateAt: s.gateAt,
          gateOpen: s.gateOpen,
          speed: s.speed, timeMs: Math.ceil(s.timeMs),
          lockEnergy: Math.round(s.lockEnergy), echoEnergy: Math.round(s.echoEnergy),
          boost: s.boost, score: s.score, peakStack: s.peakStack,
          cleanBars: s.cleanBars, integrity: Math.max(1, s.integrity) } } });
      B.Campaign.syncTitleButton();
      return saved;
    },
    async exit() {
      if (!this.active || this.exiting) return false;
      this.exiting = true;
      const returnTo = clone(this.returnTo);
      const saved = B.Campaign.readResume();
      if (saved?.levelId === ID && this.validate(saved)) returnTo.levelState.cacheRoadCheckpoint = {
        checkpointId: saved.checkpointId, proofVersion: saved.levelState.proofVersion,
        proof: clone(saved.levelState.proof) };
      B.Campaign.archive().checkpoint(returnTo);
      B.Campaign.syncTitleButton();
      const result = await B.RuntimeLifecycle?.restart?.({ source: 'road-exit', resume: returnTo });
      if (!result?.ok) this.exiting = false;
      return !!result?.ok;
    },
    dispose() {
      const hint = document.querySelector?.('.hint');
      if (hint && this.oldHint !== null) hint.textContent = this.oldHint;
      this.oldHint = null;
      this.active = false; this.status = null; this.state = null;
      this.returnTo = null; this.exiting = false; this.audioDegraded = false;
    },
    retry() {
      if (!this.active || this.status === 'playing') return false;
      const saved = B.Campaign.readResume();
      const fromCheckpoint = this.status === 'clear' ? null : saved?.levelId === ID ?
        migrateProof(saved.levelState.proof, saved.levelState.proofVersion) : null;
      this.state = newState(fromCheckpoint ? { ...fromCheckpoint, integrity: 3,
        timeMs: Math.max(fromCheckpoint.timeMs || 0, 30000), echoEnergy: Math.max(fromCheckpoint.echoEnergy || 0, 100) } : {});
      this.status = 'playing';
      // A retry deliberately resumes at the saved bar. Steering never seeks.
      window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
      this.selectMusicProfile();
      window.audioSystem?.startRuntimeGameplayMusic?.();
      this.checkpoint(this.status === 'playing' && fromCheckpoint ? saved.checkpointId : 'road-start');
      window.inputManager?.resetActionEdges?.();
      return true;
    },
    keyDown(e) {
      if (this.status === 'playing') return false;
      const key = e.key.toLowerCase();
      if (!['enter', ' ', 'c'].includes(key)) return false;
      e.preventDefault?.();
      if (!e.repeat) key === 'c' ? this.exit() : this.retry();
      return true;
    },
    mixSnapshot() {
      if (!this.active || !this.state) return null;
      return { captures: this.state.captures.map(({ lane, startBeat, endBeat }) =>
        ({ lane, startBeat, endBeat })),
        previewLane: this.state.previewLane, previewBeat: this.state.previewBeat };
    },
    startOffsetSec() { return (this.state?.musicBar || 0) * 1.875; },
    updateCaptures(music) {
      if (!music?.running || music.profileId !== PROFILE || !music.grid) return;
      const s = this.state, { beatIndex, barIndex } = music.grid;
      s.musicBeatFloat = music.grid.beatFloat;
      // Award a completed clean bar before removing a capture that expires on
      // this boundary. Damage marks its bar and removes the current stack.
      for (let completed = s.scoredThrough + 1; completed < barIndex && completed < 100; completed++) {
        if (completed !== s.damagedBar) {
          const parts = new Set(s.captures.filter(c => c.startBeat < (completed + 1) * 4 &&
            c.endBeat > completed * 4 && laneAvailable(c.lane, completed)).map(c => c.lane));
          const stack = Math.max(1, parts.size);
          s.score += 100 * stack; s.cleanBars++;
          s.lockEnergy = clamp(s.lockEnergy + 1, 0, 100);
        }
      }
      s.scoredThrough = Math.max(s.scoredThrough, barIndex - 1);
      s.captures = s.captures.filter(capture =>
        capture.endBeat > beatIndex && laneAvailable(capture.lane, barIndex));
      let phraseEntered = false;
      for (const queued of s.queuedCaptures.filter(capture => capture.startBeat <= beatIndex)) {
        if (!laneAvailable(queued.lane, barIndex) || queued.endBeat <= beatIndex) continue;
        const previous = s.captures.find(capture => capture.lane === queued.lane);
        if (previous) s.captures.splice(s.captures.indexOf(previous), 1);
        s.captures.push({ lane: queued.lane, sealed: true,
          startBeat: queued.startBeat, endBeat: queued.endBeat });
        s.peakStack = Math.max(s.peakStack, stackSize(s));
        phraseEntered = true;
      }
      s.queuedCaptures = s.queuedCaptures.filter(capture => capture.startBeat > beatIndex);
      // Zone is a reward for skilled driving, never a price of recording music.
      // One charged entry speeds the entire aligned phrase, even if several
      // lanes enter together. Its clock comes from the shared song transport.
      if (phraseEntered && s.lockEnergy >= ZONE_COST && beatIndex >= s.zoneEndBeat) {
        s.lockEnergy -= ZONE_COST;
        s.zoneEndBeat = (Math.floor(barIndex / 4) + 1) * ZONE_WINDOW;
        s.timeMs = Math.min(60000, s.timeMs + 1500);
        s.message = 'ZONE // 4 BARS FASTER  +1.5s'; s.messageMs = 1500;
        window.audioSystem?.playCombatCue?.('data');
      }
      const centered = Math.abs(s.lanePos - s.lane) <= .30;
      if (!centered || s.candidateLane !== s.lane) {
        s.candidateLane = centered ? s.lane : null;
        s.candidateSince = centered ? music.trackTimeSec : null;
        s.previewLane = null; s.previewBeat = null;
        s.visitArmedStart = null;
      }
      const dwell = centered ? music.trackTimeSec - s.candidateSince : 0;
      if (centered && dwell >= .5) {
        if (s.previewLane === null && s.previewBeat === null && laneAvailable(s.lane, barIndex))
          s.previewBeat = beatIndex + 1;
        const startBar = nextStrip(barIndex);
        if (s.visitArmedStart === null && availableFor(s.lane, startBar, startBar + 4)) {
          const existing = s.queuedCaptures.find(c => c.lane === s.lane && c.startBeat === startBar * 4);
          if (!existing) {
            s.queuedCaptures.push({ lane: s.lane,
              startBeat: startBar * 4, endBeat: (startBar + 4) * 4,
              inkAtMs: s.elapsedMs });
            s.message = `${LANES[s.lane]} // NEXT 4 BARS SEALED`; s.messageMs = 950;
            window.audioSystem?.playCombatCue?.('inspect');
          }
          s.visitArmedStart = startBar;
        }
      }
      if (s.previewBeat !== null && beatIndex >= s.previewBeat) s.previewLane = s.lane;
    },
    snapLock() {
      const s = this.state;
      const music = B.MusicTransport?.sample?.(window.audioSystem?.context?.currentTime || 0);
      if (!music?.running || music.profileId !== PROFILE || !music.grid) return;
      const { beatIndex, barIndex } = music.grid;
      if (barIndex >= 100) return;
      const lane = clamp(Math.round(s.lanePos), 0, 3);
      const boundary = nextStrip(barIndex), endBeat = boundary * 4;
      let currentSealed = false, nextSealed = false;
      if (laneAvailable(lane, barIndex) && !s.captures.some(c => c.lane === lane && c.endBeat >= endBeat)) {
        s.captures = s.captures.filter(c => c.lane !== lane);
        s.captures.push({ lane, startBeat: beatIndex, endBeat, inkAtMs: s.elapsedMs });
        s.peakStack = Math.max(s.peakStack, stackSize(s));
        currentSealed = true;
      }
      if (availableFor(lane, boundary, boundary + 4) &&
          !s.queuedCaptures.some(c => c.lane === lane && c.startBeat === endBeat)) {
        s.queuedCaptures.push({ lane, startBeat: endBeat, endBeat: endBeat + 16,
          inkAtMs: s.elapsedMs });
        nextSealed = true;
      }
      if (currentSealed || nextSealed) {
        s.visitArmedStart = boundary;
        s.message = `${LANES[lane]} // ${currentSealed ? 'NOW' : ''}` +
          `${currentSealed && nextSealed ? ' + ' : ''}${nextSealed ? 'NEXT 4' : ''} SEALED`;
        s.messageMs = 950;
        window.audioSystem?.playCombatCue?.('inspect');
      } else if (!laneAvailable(lane, barIndex) && !availableFor(lane, boundary, boundary + 4)) {
        const arrival = laneArrival(lane, barIndex);
        s.message = `${LANES[lane]} RECORDED AT BAR ${arrival + 1}`; s.messageMs = 950;
      }
    },
    sendEcho() {
      const s = this.state;
      if (s.echoEnergy < 100) {
        s.message = 'BUFFER NEEDS A CLEAN TRACE'; s.messageMs = 950; return;
      }
      s.echoEnergy = 0;
      // The final exit cue appears about four seconds before the scanner at
      // cruise. Give that approach room for a visible split and steering.
      const durationMs = s.gateAt != null && s.progress >= s.gateAt - 220 &&
        s.progress < s.gateAt ? 6000 : 2700;
      s.echo = { lanePos: s.lanePos, progress: s.progress, ageMs: 0, durationMs,
        path: s.trace.map(sample => ({ ...sample })), sampleIndex: 0, sampleMs: 0 };
      s.rivalDistractedMs = durationMs;
      s.message = 'BUFFER ECHO // SPLIT THE LINE'; s.messageMs = 1700;
      window.audioSystem?.playCombatCue?.('data');
    },
    handleActions(actions) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state;
      s.steer = Number(!!actions.move_right?.held) - Number(!!actions.move_left?.held);
      s.braking = !!actions.move_down?.held;
      if (actions.inspect?.pressed) this.snapLock();
      if (actions.interact?.pressed) this.sendEcho();
      if (actions.jump?.pressed && s.boost > 0) {
        s.boost = 0; s.nearMisses = 0; s.boostMs = 1250;
        s.message = 'TURBO // ORIGINAL SIGNAL HELD'; s.messageMs = 900;
        window.audioSystem?.playCombatCue?.('lift');
      }
    },
    hit(kind) {
      const s = this.state;
      if (s.invulnerableMs || s.boostMs) return;
      s.integrity--; s.speed = Math.max(20, s.speed - 19); s.timeMs = Math.max(0, s.timeMs - 1800);
      s.invulnerableMs = 1400;
      s.damagedBar = s.musicBar;
      s.captures = []; s.queuedCaptures = [];
      s.zoneEndBeat = -1;
      s.candidateLane = null; s.candidateSince = null;
      s.previewLane = null; s.previewBeat = null; s.visitArmedStart = null;
      s.stumbleMs = 650; s.cutStreak = 0; s.cutFlashMs = 0; s.nearMisses = 0;
      s.message = ''; s.messageMs = 0;
      window.audioSystem?.playRoadStumble?.();
      window.audioSystem?.playCombatCue?.('damage');
      if (s.integrity <= 0) this.status = s.status = 'failed';
    },
    cleanPass(cut = false) {
      const s = this.state;
      s.nearMisses++;
      s.echoEnergy = clamp(s.echoEnergy + (cut ? 35 : 16), 0, 100);
      s.lockEnergy = clamp(s.lockEnergy + (cut ? 70 : 8), 0, 100);
      s.cutStreak = cut ? Math.min(4, s.cutStreak + 1) : 0;
      const points = (cut ? 150 * s.cutStreak : 25) * stackSize(s);
      s.score += points;
      if (s.nearMisses >= 2) { s.boost = 1; s.nearMisses = 0; }
      if (cut) { s.cutFlashMs = 740; s.cutAward = points; }
      window.audioSystem?.playCombatCue?.(cut ? 'cutline' : 'pickup');
    },
    update(delta) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state, dt = Math.min(100, Math.max(0, delta));
      if (!dt) return;
      const before = s.progress;
      const music = B.MusicTransport?.sample?.(window.audioSystem?.context?.currentTime || 0);
      const previousBar = s.musicBar;
      const bar = music?.running && music.profileId === PROFILE && music.grid ?
        Math.max(0, music.grid.barIndex) : previousBar;
      this.updateCaptures(music);
      s.musicBar = Math.max(previousBar, bar);
      s.elapsedMs += dt; s.timeMs = Math.max(0, s.timeMs - dt);
      s.boostMs = Math.max(0, s.boostMs - dt);
      s.invulnerableMs = Math.max(0, s.invulnerableMs - dt);
      s.stumbleMs = Math.max(0, s.stumbleMs - dt);
      s.cutFlashMs = Math.max(0, s.cutFlashMs - dt);
      s.messageMs = Math.max(0, s.messageMs - dt);
      s.rivalDistractedMs = Math.max(0, s.rivalDistractedMs - dt);
      const seconds = dt / 1000;
      const zoned = s.musicBeatFloat < s.zoneEndBeat;
      const targetSpeed = s.braking ? 23 : s.boostMs ? 75 : zoned ? 64 : 54;
      s.speed = clamp(s.speed + clamp(targetSpeed - s.speed,
        -(s.braking ? 48 : 8) * seconds, (s.boostMs ? 47 : 22) * seconds), 18, 75);
      const curve = roadCurve(before);
      s.lanePos = clamp(s.lanePos +
        (s.steer * 2.5 - curve * (s.speed / 54) ** 2 * 0.5) * seconds, 0, 3);
      s.lane = Math.round(s.lanePos);
      s.visualLane += (s.lanePos - s.visualLane) * Math.min(1, dt / 90);
      s.progress = Math.min(15000, before + s.speed * seconds);

      // This short input trace, rather than a past world position, can be
      // replayed from the car's present location as a readable decoy.
      s.trace.push({ steer: s.steer, duration: dt });
      let traceLength = s.trace.reduce((total, sample) => total + sample.duration, 0);
      while (traceLength > 2200 && s.trace.length > 1)
        traceLength -= s.trace.shift().duration;
      if (s.echo) {
        const e = s.echo;
        e.ageMs += dt; e.progress += s.speed * seconds;
        let remaining = dt;
        while (remaining > 0 && e.sampleIndex < e.path.length) {
          const sample = e.path[e.sampleIndex], step = Math.min(remaining, sample.duration - e.sampleMs);
          e.lanePos = clamp(e.lanePos + sample.steer * 2.5 * step / 1000, 0, 3);
          e.sampleMs += step; remaining -= step;
          if (e.sampleMs >= sample.duration) { e.sampleIndex++; e.sampleMs = 0; }
        }
        if (e.ageMs >= e.durationMs) s.echo = null;
      }
      if (Math.abs(curve) > 0.48 && s.speed > 30 && s.steer * curve > 0) {
        s.lockEnergy = clamp(s.lockEnergy + 3 * seconds, 0, 100);
        s.echoEnergy = clamp(s.echoEnergy + 8 * seconds, 0, 100);
      }

      // Resolve every vehicle at a crossing before paying clean-pass rewards.
      // A paired gate can otherwise award a near miss from its second vehicle
      // in the very frame where its first vehicle hits the car.
      const contactAt = new Set(), pendingPasses = [];
      for (const hazard of HAZARDS) {
        const distance = hazard.at - s.progress;
        const hazardId = `${hazard.at}/${hazard.lane}`;
        if (hazard.kind === 'audit' && distance < 160 && distance > 0 &&
          !Object.hasOwn(s.audits, hazard.at))
          s.audits[hazard.at] = s.echo ? Math.round(s.echo.lanePos) : s.lane;
        const lane = hazardLane(hazard, s.progress, s.audits);
        if (distance <= 80 && distance > 0 && s.speed >= 38 && !s.invulnerableMs &&
            !s.boostMs && Math.abs(lane - s.lanePos) < .45)
          s.cutMarks[hazardId] = true;
        if (hazard.kind === 'freight' && distance > 15 && distance < 110 &&
            Math.abs(lane - s.lanePos) < 0.42 && s.speed >= 28 && !s.drafted[hazard.at]) {
          s.draftMs += dt;
          if (s.draftMs >= 600) {
            s.drafted[hazard.at] = true; s.draftMs = 0; s.boost = 1;
            s.echoEnergy = clamp(s.echoEnergy + 25, 0, 100);
            s.lockEnergy = clamp(s.lockEnergy + 20, 0, 100);
            s.message = 'FREIGHT DRAFT // TURBO READY'; s.messageMs = 900;
          }
        }
        if (before >= hazard.at || s.progress < hazard.at) continue;
        const gap = Math.abs(lane - s.lanePos);
        if (gap < (hazard.kind === 'freight' ? 0.53 : 0.45)) {
          contactAt.add(hazard.at);
          this.hit(hazard.kind === 'block' ? 'roadblock' : hazard.kind);
          if (this.status === 'failed') return;
        } else if (gap < 1.13 && s.speed >= 25) {
          pendingPasses.push({ at: hazard.at,
            cut: !!s.cutMarks[hazardId] && gap < 1.08 && s.speed >= 38 });
        }
        delete s.cutMarks[hazardId];
      }
      for (const pass of pendingPasses) if (!contactAt.has(pass.at)) this.cleanPass(pass.cut);
      if (s.progress >= 3 * LAP + 1700 && s.musicBar < 100) {
        const distance = s.nextRivalAt - s.progress;
        const enteringWarning = !s.rivalWarning && distance <= 120 && distance > 0;
        s.rivalWarning = distance <= 120 && distance > 0;
        if (s.rivalWarning) {
          if (enteringWarning) {
            s.rivalTarget = s.lanePos;
            s.rivalEchoCommitted = false;
            window.audioSystem?.playCombatCue?.('warning');
          }
          if (s.echo && s.rivalDistractedMs && !s.rivalEchoCommitted) {
            s.rivalTarget = s.echo.lanePos;
            s.rivalEchoCommitted = true;
          }
          s.rivalLane += (s.rivalTarget - s.rivalLane) * Math.min(1, dt / 290);
        }
        if (before < s.nextRivalAt && s.progress >= s.nextRivalAt) {
          const decoy = !!s.echo && s.rivalDistractedMs > 0 && s.rivalEchoCommitted;
          if (decoy && Math.abs(s.echo.lanePos - s.lanePos) >= 0.7) {
            s.echoDeceptions++;
            s.message = 'RIVAL TOOK THE REPLAY'; s.messageMs = 1200;
          } else if (Math.abs(s.rivalLane - s.lanePos) < 0.55) {
            this.hit('clean copy');
            if (this.status === 'failed') return;
          }
          const density = stackSize(s);
          s.nextRivalAt = s.progress + (density >= 3 ? 155 : 225);
          s.rivalWarning = false; s.rivalEchoCommitted = false;
        }
      }
      if (before < 850 && s.progress >= 850) {
        s.timeMs = Math.max(s.timeMs, 33000) + (stackSize(s) - 1) * 1800;
        this.checkpoint('road-cache'); s.message = 'ORIGINAL TAPE / KEEP MOVING'; s.messageMs = 1600;
      }
      if (before < 1700 && s.progress >= 1700) {
        s.timeMs = Math.max(s.timeMs, 31000) + (stackSize(s) - 1) * 1800;
        s.echoEnergy = 100;
        this.checkpoint('road-fork'); s.message = 'A CLEAN COPY IS MISSING NAMES'; s.messageMs = 2400;
      }
      for (const [at, id] of [[28, 'road-verse-2'], [52, 'road-verse-3'], [76, 'road-verse-4']]) {
        if (previousBar < at && s.musicBar >= at) {
          s.timeMs = Math.max(s.timeMs, 55000);
          this.checkpoint(id);
          s.message = `VERSE ${1 + Math.floor(at / 24)} // HOLD THE ORIGINAL`;
          s.messageMs = 1800;
        }
      }
      if (previousBar < 92 && s.musicBar >= 92 && s.gateAt == null) {
        s.gateAt = Math.max(GATE, s.progress + 300);
        s.echoEnergy = 100;
      }
      if (s.gateAt != null && before < s.gateAt && s.progress >= s.gateAt) {
        if (s.lanePos < 2.45 || !s.echo || s.rivalDistractedMs <= 0 ||
            Math.abs(s.echo.lanePos - s.lanePos) < 0.75) {
          s.gateFailure = s.lanePos < 2.45 ? 'wrong-lane' :
            !s.echo || s.rivalDistractedMs <= 0 ? 'no-echo' : 'no-split';
          // Stop at the missed exit. Moving the car backward while play kept
          // running looked like a broken game loop, not a deliberate retry.
          this.status = s.status = 'failed';
          return;
        } else {
          s.timeMs = Math.max(s.timeMs, 21000);
          s.gateOpen = true; this.checkpoint('road-gate');
          s.message = 'ORIGINAL THROUGH // MAC: DISTRIBUTION DENIED'; s.messageMs = 3500;
        }
      }
      if (s.gateOpen && s.musicBar >= 100 && s.progress >= s.gateAt + 400) {
        this.status = s.status = 'clear';
        this.checkpoint('road-clear');
      }
      if (s.musicBar >= 100 && this.status === 'playing') {
        this.status = s.status = 'failed'; s.message = 'ORIGINAL TAPE ENDED';
      }
      if (this.status !== 'playing') window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
      if (s.timeMs <= 0 && this.status === 'playing') {
        this.status = s.status = 'failed'; s.message = 'TRANSMISSION WINDOW CLOSED';
      }
    },
    draw(ctx) {
      if (!ctx || !this.active) return;
      const s = this.state, progress = s.progress;
      const section = s.musicBar < 4 ? 0 : Math.min(3, Math.floor((s.musicBar - 4) / 24));
      const names = ['RAINLINE', 'SERVICE LOOP', 'MIRROR VIADUCT', 'DISTRIBUTION CAUSEWAY'];
      const skyTops = ['#08152b', '#201a30', '#1c1d43', '#152b39'];
      const skyBottoms = ['#9b4f74', '#dc805b', '#d87891', '#86a89d'];
      const reduced = !!B.Preferences?.values?.reducedMotion;
      const horizon = 345, bottom = 1080;
      const bend = t => Math.sin(progress / 190 + (1 - t) * 1.2) * (1 - t) * 124;
      const center = t => 960 + bend(t), half = t => 80 + 800 * t;
      const laneEdge = (lane, t) => center(t) - half(t) + lane * half(t) / 2;
      const laneX = (lane, t) => laneEdge(lane, t) + half(t) / 4;
      const roadY = t => horizon + t * t * (bottom - horizon);
      const depth = d => clamp(1 - (d + 80) / 520, 0, 1);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, horizon + 70);
      sky.addColorStop(0, skyTops[section]); sky.addColorStop(1, skyBottoms[section]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 1920, 1080);
      ctx.globalAlpha = .38; ctx.fillStyle = section === 3 ? '#d7fff0' : '#ffd8aa';
      ctx.beginPath(); ctx.arc(1500 - (progress * .025 % 190), 274, 105, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      // Three moving layers establish a place and a speed reference beyond the track.
      for (let layer = 0; layer < 2; layer++) {
        const pitch = layer ? 91 : 131, drift = layer ? .33 : .11;
        for (let i = -2; i < 25; i++) {
          const x = i * pitch - (progress * drift % pitch);
          const h = (layer ? 65 : 95) + ((i * 47 + layer * 31 + 3000) % (layer ? 145 : 125));
          ctx.fillStyle = layer ? '#18283c' : '#24344c';
          ctx.fillRect(x, horizon - h, pitch * (layer ? .77 : .72), h + 28);
          if (layer) {
            ctx.fillStyle = i % 3 ? '#86abc089' : '#e9b5a58c';
            for (let wy = horizon - h + 16; wy < horizon - 12; wy += 26)
              ctx.fillRect(x + 13, wy, pitch * .06, 5);
          }
        }
      }
      ctx.fillStyle = '#112134'; ctx.fillRect(0, horizon, 1920, bottom - horizon);
      // Road shoulders and the paint share a single curved road projection.
      for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const t = i / 24, x = center(t) + side * (half(t) + 26 + 39 * t);
          if (!i) ctx.moveTo(x, roadY(t)); else ctx.lineTo(x, roadY(t));
        }
        for (let i = 24; i >= 0; i--) {
          const t = i / 24, x = center(t) + side * half(t);
          ctx.lineTo(x, roadY(t));
        }
        ctx.closePath(); ctx.fillStyle = '#44536a'; ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        if (!i) ctx.moveTo(center(t) - half(t), roadY(t)); else ctx.lineTo(center(t) - half(t), roadY(t));
      }
      for (let i = 28; i >= 0; i--) { const t = i / 28; ctx.lineTo(center(t) + half(t), roadY(t)); }
      ctx.closePath(); ctx.fillStyle = '#1b2539'; ctx.fill();
      // Phrase paint is a road marking, not a second translucent lane overlay.
      // Each bar is bounded by the same depth(), laneEdge() and roadY() used
      // for traffic and studs. Its near edge travels toward the car on the
      // shared song clock, while the road curves beneath every vertex.
      const floatBar = s.musicBeatFloat / 4;
      for (let bar = Math.floor(floatBar) + 8; bar >= Math.floor(floatBar); bar--) {
        if (bar >= 100) continue;
        const near = depth(Math.max(-55, (bar - floatBar) * 65));
        const far = depth((bar + 1 - floatBar) * 65);
        if (near <= .12 || near <= far) continue;
        for (let lane = 0; lane < 4; lane++) {
          const active = s.captures.find(c => c.lane === lane && c.startBeat < (bar + 1) * 4 && c.endBeat > bar * 4);
          const armed = !active && s.queuedCaptures.find(c => c.lane === lane &&
            c.startBeat <= bar * 4 && c.endBeat > bar * 4);
          if (!active && !armed) continue;
          const mark = active || armed;
          const slot = bar - mark.startBeat / 4;
          const reveal = active || mark.inkAtMs == null ? 1 :
            clamp((s.elapsedMs - mark.inkAtMs - (3 - slot) * 100) / 260, 0, 1);
          if (!reveal) continue;
          const padNear = 8 + near * 13, padFar = 8 + far * 13;
          const quad = [[laneEdge(lane,near)+padNear,roadY(near)],
            [laneEdge(lane+1,near)-padNear,roadY(near)],
            [laneEdge(lane+1,far)-padFar,roadY(far)],
            [laneEdge(lane,far)+padFar,roadY(far)]];
          ctx.globalAlpha = (active ? .35 : .16) * reveal;
          polygon(ctx, quad, PALETTE[lane]);
          ctx.globalAlpha = (active ? .9 : .57) * reveal;
          ctx.strokeStyle = PALETTE[lane]; ctx.lineWidth = 1.5 + near * (active ? 4 : 2);
          ctx.beginPath(); ctx.moveTo(...quad[0]); ctx.lineTo(...quad[3]);
          ctx.moveTo(...quad[1]); ctx.lineTo(...quad[2]); ctx.stroke();
          // Short transverse inlaid strokes make the paint read as material
          // passing under the car as a committed phrase approaches.
          const stripeT = far + (near - far) * .38;
          ctx.lineWidth = Math.max(1, near * 3);
          ctx.beginPath();
          ctx.moveTo(laneEdge(lane,stripeT)+padFar+12,roadY(stripeT));
          ctx.lineTo(laneEdge(lane+1,stripeT)-padFar-12,roadY(stripeT)); ctx.stroke();
          // Directional grooves are cut into each bar tile. All vertices are
          // evaluated at road depth, so the motif foreshortens with approach.
          for (let mark = 0; mark < 2; mark++) {
            const markT = far + (near - far) * (.2 + mark * .32);
            const markAhead = far + (near - far) * (.32 + mark * .32);
            ctx.globalAlpha = (active ? .51 : .34) * reveal;
            ctx.beginPath();
            ctx.moveTo(laneEdge(lane,markT) + (laneEdge(lane+1,markT)-laneEdge(lane,markT))*.3,
              roadY(markT));
            ctx.lineTo(laneX(lane,markAhead), roadY(markAhead));
            ctx.lineTo(laneEdge(lane,markT) + (laneEdge(lane+1,markT)-laneEdge(lane,markT))*.7,
              roadY(markT)); ctx.stroke();
          }
          if (bar % 4 === 0 && near > .32) {
            const labelT = far + (near - far) * .7;
            ctx.save(); ctx.translate(laneX(lane,labelT), roadY(labelT));
            ctx.scale(Math.max(.35,labelT*.83), Math.max(.13,labelT*.25));
            ctx.textAlign = 'center'; ctx.fillStyle = '#fafff8';
            ctx.font = 'bold 25px Oxanium, monospace';
            ctx.fillText(`${LANES[lane]} ${bar+1}–${Math.min(100,bar+4)}`, 0, -10);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = bar % 4 === 0 ? '#b4f9ec' : '#8ea6ab';
        ctx.globalAlpha = bar % 4 === 0 ? .78 : .22;
        ctx.lineWidth = bar % 4 === 0 ? 2 + near * 5 : 1 + near;
        ctx.beginPath(); ctx.moveTo(laneEdge(0,near),roadY(near));
        ctx.lineTo(laneEdge(4,near),roadY(near)); ctx.stroke(); ctx.globalAlpha = 1;
        if (bar % 4 === 0 && near > .23) {
          ctx.fillStyle = '#d4fff1'; ctx.font = `bold ${Math.round(10 + 17 * near)}px Oxanium, monospace`;
          ctx.textAlign = 'right'; ctx.fillText(`${songSection(bar)} / ${bar + 1}–${bar + 4}`,
            laneEdge(0,near)-13, roadY(near)+3);
        }
      }
      for (const side of [-1, 1]) {
        ctx.strokeStyle = s.musicBeatFloat < s.zoneEndBeat ? '#ffe4a2' :
          section === 3 ? '#a2f9c9' : '#f0a0ac'; ctx.lineWidth = 7;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const t = i / 24, x = center(t) + side * half(t);
          if (!i) ctx.moveTo(x, roadY(t)); else ctx.lineTo(x, roadY(t));
        }
        ctx.stroke();
      }
      // Road studs and striped shoulder posts accelerate toward the player.
      for (let at = Math.floor(progress / 26) * 26; at < progress + 500; at += 26) {
        const d = at - progress, t = depth(d);
        if (d < -65 || t < .12) continue;
        const y = roadY(t), size = 2 + 17 * t * t;
        for (let lane = 1; lane < 4; lane++) {
          const x = laneEdge(lane, t);
          ctx.fillStyle = '#f4e4cf'; ctx.globalAlpha = .28 + t * .55;
          ctx.fillRect(x - size * .25, y - size * .7, size * .5, size * 1.4);
        }
        ctx.globalAlpha = 1;
        for (const side of [-1, 1]) {
          const x = center(t) + side * (half(t) + 18 + t * 32);
          ctx.fillStyle = at % 52 ? '#7c92a2' : '#efb5a2';
          ctx.fillRect(x - size*.35, y - size*2.5, size*.7, size*2.5);
          ctx.fillStyle = '#b4f7e8'; ctx.fillRect(x - size*.35, y - size*2.2, size*.7, size*.38);
        }
      }
      ctx.globalAlpha = 1;
      if (!reduced && s.speed > 40) {
        const travel = (progress * 1.8) % 190;
        for (let i = 0; i < 13; i++) {
          const d = (i * 37 + travel) % 190, t = .67 + d / 620;
          const y = roadY(t), len = 14 + (s.speed - 38) * .9 * t;
          ctx.strokeStyle = PALETTE[i % 4]; ctx.globalAlpha = .11 + t * .19;
          ctx.lineWidth = 1 + t * 2; ctx.beginPath();
          const x = center(t) + (i % 2 ? -1 : 1) * (half(t) + 60 + i * 9);
          ctx.moveTo(x, y - len); ctx.lineTo(x, y + len * .3); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      const upcoming = [850, 1700].find(at => at > progress && at - progress < 410);
      if (upcoming) {
        const t = depth(upcoming - progress), far = depth(upcoming - progress + 32);
        polygon(ctx, [[laneEdge(0,t),roadY(t)],[laneEdge(4,t),roadY(t)],
          [laneEdge(4,far),roadY(far)],[laneEdge(0,far),roadY(far)]], '#385d66');
        ctx.save(); ctx.translate(center(t),roadY(t)); ctx.scale(Math.max(.5,t),Math.max(.2,t*.34));
        ctx.fillStyle = '#e5fcf1'; ctx.font = 'bold 30px Oxanium, monospace';
        ctx.textAlign = 'center'; ctx.fillText('ROAD MARKER', 0, -16); ctx.restore();
      }
      // Far traffic first; the shapes and on-road arrows remain legible in motion.
      for (const hazard of [...HAZARDS].reverse()) {
        const d = hazard.at - progress;
        if (d < 0 || d > 440) continue;
        const t = depth(d), lane = hazardLane(hazard, progress, s.audits);
        const x = laneX(lane, t), y = roadY(t);
        const w = (hazard.kind === 'freight' ? 32 : 26) + t * (hazard.kind === 'freight' ? 144 : 113);
        const h = (hazard.kind === 'freight' ? 30 : 24) + t * (hazard.kind === 'freight' ? 149 : 111);
        if (d < 145 && d > 4 && t > .38) {
          // A braking chevron is printed on the threatened lane, with a
          // narrowing cue as the car approaches the collision plane.
          const markT = depth(d - 23);
          ctx.globalAlpha = .2 + (1 - d / 145) * .36;
          polygon(ctx, [[laneX(lane,t),y+5],
            [laneEdge(lane+1,markT)-14,roadY(markT)],
            [laneX(lane,markT),roadY(markT)-4],
            [laneEdge(lane,markT)+14,roadY(markT)]], '#ff7488');
          ctx.globalAlpha = 1;
        }
        if (hazard.kind === 'audit' && d < 165 && d > 0) {
          const ahead = depth(d - 38);
          ctx.globalAlpha = .45;
          polygon(ctx, [[laneEdge(lane,t)+9,y],[laneEdge(lane+1,t)-9,y],
            [laneEdge(lane+1,ahead)-15,roadY(ahead)],
            [laneEdge(lane,ahead)+15,roadY(ahead)]], '#ff4f82');
          ctx.globalAlpha = 1;
        }
        if (hazard.kind === 'sweeper' && d < 165 && d > 0) {
          ctx.strokeStyle = '#ffe6a2'; ctx.lineWidth = 4 + t*5;
          ctx.beginPath(); ctx.moveTo(laneX(hazard.lane,t), y + 30*t);
          ctx.lineTo(laneX(hazard.lane+1,t), y + 30*t); ctx.stroke();
          polygon(ctx, [[laneX(hazard.lane+1,t),y+30*t],
            [laneX(hazard.lane+1,t)-15*t,y+18*t],[laneX(hazard.lane+1,t)-15*t,y+42*t]], '#ffe6a2');
        }
        drawVehicle(ctx, x, y, w, h, hazard.kind);
        if (d < 210 && d > 0 && t > .38 && ['audit','sweeper','freight'].includes(hazard.kind)) {
          ctx.fillStyle = hazard.kind === 'audit' ? '#ffd0df' : '#fff2be';
          ctx.font = `bold ${Math.round(15 + t*16)}px Oxanium, monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(hazard.kind === 'audit' ? 'AUDIT LOCK' : hazard.kind === 'sweeper' ? 'MERGE >' : 'DRAFT', x, y - h - 14);
        }
      }
      if (s.gateAt != null && progress < s.gateAt + 45) {
        const t = depth(s.gateAt - progress), y = roadY(t);
        ctx.fillStyle = '#9ffff0'; ctx.font = `bold ${Math.round(18 + t*23)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('ORIGINAL >>>', laneX(3,t), y - 154*t - 52);
        ctx.fillStyle = '#ffb2bd'; ctx.fillText('AUDIT COPY', laneX(0,t), y - 154*t - 52);
      }
      if (progress >= 3 * LAP + 1700) {
        const t = .62, x = laneX(s.rivalLane,t), y = roadY(t);
        drawVehicle(ctx, x, y, 126, 127, 'rival');
        if (s.rivalWarning) {
          const markT = depth(s.nextRivalAt - progress), markX = laneX(s.rivalTarget,markT), markY = roadY(markT);
          ctx.strokeStyle = '#ff719b'; ctx.lineWidth = 6;
          ctx.strokeRect(markX - 44, markY - 83, 88, 78);
        }
      }
      const carX = laneX(s.visualLane, .83), carY = roadY(.83);
      if (s.echo) {
        const x = laneX(s.echo.lanePos, .83);
        if (Math.abs(x - carX) > 35) {
          ctx.strokeStyle = '#a4faff'; ctx.globalAlpha = .36; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x, carY - 8); ctx.lineTo(carX, carY - 8); ctx.stroke(); ctx.globalAlpha = 1;
        }
        drawVehicle(ctx, x, carY, 152, 115, 'echo', { alpha: .68 });
      }
      drawVehicle(ctx, carX, carY, 164, 119, 'cache',
        { alpha: s.invulnerableMs && Math.floor(s.invulnerableMs / 90) % 2 ? .55 : 1, turbo: !!s.boostMs });
      if (s.cutFlashMs && !reduced) {
        const pulse = s.cutFlashMs / 740;
        ctx.strokeStyle = '#dcfff1'; ctx.globalAlpha = pulse * .75;
        ctx.lineWidth = 3 + (1 - pulse) * 8;
        const left = laneEdge(s.lane,.83)+30, right = laneEdge(s.lane+1,.83)-30;
        ctx.beginPath(); ctx.moveTo(left,carY + 17); ctx.lineTo(right,carY + 17); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (s.invulnerableMs) {
        ctx.fillStyle = '#ff697a';
        ctx.fillRect(0, 163, 12, 750); ctx.fillRect(1908, 163, 12, 750);
      }
      // The driving HUD prioritizes time, damage and ability readiness.
      ctx.fillStyle = '#091523f2'; ctx.fillRect(0, 0, 1920, 164);
      ctx.fillStyle = '#9ef6e2'; ctx.font = 'bold 32px Oxanium, monospace'; ctx.textAlign = 'left';
      ctx.fillText('CACHE BACK  /  ORIGINAL MASTER', 42, 45);
      ctx.fillStyle = '#c9e1e8'; ctx.font = '20px Oxanium, monospace';
      const upcomingStrip = nextStrip(s.musicBar);
      ctx.fillText(`${names[section]}   •   ${songSection(s.musicBar)}   •   BAR ${Math.min(100, s.musicBar + 1)} / 100` +
        (upcomingStrip < 100 ? `   •   NEXT ${songSection(upcomingStrip)} ${upcomingStrip + 1}–${upcomingStrip + 4}` : ''), 44, 78);
      ctx.fillStyle = '#faf7e9'; ctx.font = 'bold 53px Oxanium, monospace';
      ctx.fillText(`${Math.round(s.speed * 5.2)}`, 44, 140);
      ctx.fillStyle = '#91bfd1'; ctx.font = '19px Oxanium, monospace'; ctx.fillText('KM/H', 173, 133);
      ctx.fillStyle = s.timeMs < 8000 ? '#ff879d' : '#f7dfaa';
      ctx.font = 'bold 39px Oxanium, monospace'; ctx.fillText(`${(s.timeMs/1000).toFixed(1)}s`, 300, 134);
      ctx.fillStyle = '#a7bcca'; ctx.font = '16px Oxanium, monospace'; ctx.fillText('WINDOW', 303, 96);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < s.integrity ? '#85efd1' : '#374959';
        ctx.fillRect(520 + i*40, 111, 29, 20);
      }
      ctx.fillStyle = '#a7bcca'; ctx.fillText('SIGNAL', 520, 96);
      const meter = (x, label, value, color) => {
        ctx.fillStyle = '#afbdcb'; ctx.font = 'bold 16px Oxanium, monospace'; ctx.fillText(label, x, 97);
        ctx.fillStyle = '#26364b'; ctx.fillRect(x, 111, 176, 18);
        ctx.fillStyle = color; ctx.fillRect(x, 111, 176 * clamp(value/100,0,1), 18);
        ctx.fillStyle = '#f7f8ec'; ctx.font = 'bold 17px Oxanium, monospace'; ctx.fillText(`${Math.round(value)}%`, x+187, 127);
      };
      meter(693, 'ECHO • AUDIT DECOY', s.echoEnergy, '#83e6fc');
      meter(969, s.musicBeatFloat < s.zoneEndBeat ? 'ZONE • 4 BARS FAST' :
        'ZONE • NEXT PHRASE', s.lockEnergy, '#d0a4ff');
      ctx.fillStyle = s.boost || s.boostMs ? '#fbd899' : '#5d7381';
      ctx.font = 'bold 21px Oxanium, monospace'; ctx.fillText(s.boostMs ? 'TURBO ACTIVE' : s.boost ? 'TURBO READY' : 'TURBO CHARGING', 1246, 124);
      ctx.fillStyle = '#afbdcb'; ctx.font = '17px Oxanium, monospace'; ctx.textAlign = 'right';
      ctx.fillText('HOLD LANE .5s → NEXT 4     E/RB → NOW + NEXT 4', 1880, 57);
      ctx.fillText('CLOSE CUT → ZONE     SPACE/A TURBO     H/Y ECHO', 1880, 91);
      ctx.fillStyle = '#e7f4e9'; ctx.font = 'bold 22px Oxanium, monospace';
      ctx.fillText(`SCORE ${s.score}    STACK x${stackSize(s)}`, 1880, 130);
      // A thin dashboard legend is enough; the actual bar spans live on the road.
      for (let i = 0; i < 4; i++) {
        const x = 1240 + i * 160;
        const capture = s.captures.find(item => item.lane === i);
        const queued = s.queuedCaptures.find(item => item.lane === i);
        ctx.fillStyle = capture || queued ? '#f1fff5' : '#a4bdc4';
        ctx.font = 'bold 13px Oxanium, monospace'; ctx.textAlign = 'left';
        ctx.fillText(`${i+1} ${['DRIVE','FLOW','BREAK','FX'][i]} ${queued ? `Q${queued.startBeat/4+1}` :
          capture ? `${Math.max(0,Math.ceil((capture.endBeat-s.musicBeatFloat)/4))}B` :
            !laneAvailable(i,s.musicBar) ? `AT ${laneArrival(i,s.musicBar)+1}` : 'READY'}`, x, 145);
        ctx.fillStyle = PALETTE[i]; ctx.globalAlpha = capture ? 1 : queued ? .65 : s.lane === i ? .45 : .16;
        ctx.fillRect(x, 151, 148, 5); ctx.globalAlpha = 1;
      }
      if (s.cutFlashMs) {
        ctx.fillStyle = '#dcfff1'; ctx.font = 'bold 22px Oxanium, monospace';
        ctx.textAlign = 'center'; ctx.fillText(`CUTLINE x${s.cutStreak}  +${s.cutAward}  // ZONE CHARGED`, 960, 150);
      }
      if (s.gateAt != null && progress > s.gateAt - 220 && progress < s.gateAt) {
        ctx.fillStyle = '#e7ffeb'; ctx.font = 'bold 25px Oxanium, monospace';
        ctx.textAlign = 'center'; ctx.fillText(s.echo ?
          'ECHO LEFT • ORIGINAL RIGHT' :
          'H/Y ECHO LEFT • ORIGINAL RIGHT', 960, 150);
      }
      if (s.messageMs > 0 && !s.stumbleMs && !s.cutFlashMs &&
          !(s.gateAt != null && progress > s.gateAt - 220 && progress < s.gateAt)) {
        ctx.fillStyle = '#b4ffe4';
        ctx.font = 'bold 20px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText(s.message, 960, 150);
      }
      if (this.audioDegraded) {
        ctx.fillStyle = '#ffbb8b'; ctx.font = '20px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText('AUDIO FALLBACK — MIX TIMBRE / ALIGNMENT NEEDS RECHECK', 960, 365);
      }
      if (this.status !== 'playing') {
        ctx.fillStyle = '#061320ed'; ctx.fillRect(370, 280, 1180, 485);
        ctx.strokeStyle = '#9cf9df'; ctx.lineWidth = 3; ctx.strokeRect(370, 280, 1180, 485);
        ctx.fillStyle = '#f5f1ee'; ctx.font = 'bold 47px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.status === 'clear' ? 'ORIGINAL TAPE DELIVERED' :
          s.gateFailure ? 'ORIGINAL EXIT MISSED' :
          s.timeMs <= 0 ? 'TRANSMISSION WINDOW CLOSED' : 'SIGNAL LOST', 960, 380);
        ctx.font = '25px Oxanium, monospace'; ctx.fillStyle = '#9cf9df';
        ctx.fillText(this.status === 'clear' ? 'DELIVERED / UNVERIFIED — Mac sees the distribution blockade.' :
          s.gateFailure === 'wrong-lane' ? 'Cache must take the far-right marked original exit.' :
          s.gateFailure === 'no-echo' ? 'Send Buffer Echo after the exit cue, then steer right.' :
          s.gateFailure === 'no-split' ? 'Give the Echo another lane so the audit follows it.' :
          'Your last road marker remains. Draft, brake and use an Echo to split the audit.', 960, 458);
        ctx.fillStyle = '#e6c8b5'; ctx.font = '22px Oxanium, monospace';
        ctx.fillText(this.status === 'clear' ? 'Proof clear only. Bass awaits the authored Level 2.' :
          s.gateFailure ? 'Retry starts at the Mirror Viaduct marker with a full Echo.' :
          'Collisions cost speed and time. The rival follows a visible warning line.', 960, 506);
        ctx.fillText(s.gateFailure ? 'ENTER / A: RETRY FROM MARKER     C / Y: RETURN TO LEVEL 1' :
          'ENTER / A: RETRY     C / Y: RETURN TO LEVEL 1', 960, 625);
        ctx.fillText('P / MENU: SETTINGS AND EXIT PREVIEW', 960, 672);
      }
      ctx.restore();
    }
  };
  B.Campaign.register(ID, { validate: saved => road.validate(saved), restore: saved => road.restore(saved) });
  B.Campaign.syncTitleButton();
})(window.BARCODE = window.BARCODE || {});
