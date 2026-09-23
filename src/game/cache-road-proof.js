// Cache Back chase slice. It shares the existing input/RAF/audio/save/pause
// owners and awards no Level 2 campaign facts.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/cache-road-proof.js', exports: ['BARCODE.CacheRoadProof'], dependencies: ['BARCODE.Campaign', 'BARCODE.MusicTransport'] });
(function(B) {
  'use strict';
  const ID = 'level-02', PROFILE = 'level-02.proof', END = 2460, GATE = 2060;
  const LANES = ['BASS', 'BREAK', 'HARMONY', 'LEAD'];
  const CHECKPOINTS = { 'road-start': 0, 'road-cache': 850, 'road-fork': 1700,
    'road-gate': 2070, 'road-clear': END };
  const HAZARDS = [
    [190, 1, 'freight'], [275, 2, 'van'], [350, 0, 'block'], [465, 2, 'sweeper'],
    [550, 1, 'block'], [635, 2, 'freight'], [735, 0, 'van'], [895, 3, 'block'],
    [975, 1, 'freight'], [1050, 2, 'block'], [1135, 0, 'audit'], [1220, 3, 'van'],
    [1320, 1, 'block'], [1415, 2, 'sweeper'], [1510, 0, 'freight'], [1610, 3, 'van'],
    [1765, 1, 'freight'], [1840, 2, 'block'], [1930, 0, 'van'], [2005, 1, 'sweeper'],
    [2170, 2, 'audit'], [2265, 0, 'block'], [2345, 1, 'freight']
  ].map(([at, lane, kind]) => ({ at, lane, kind }));
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
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
      locked: [...(saved.locked || [])], integrity: saved.integrity ?? 3,
      speed: saved.speed ?? 44, timeMs: saved.timeMs ?? 37000,
      lockEnergy: saved.lockEnergy ?? 65, echoEnergy: saved.echoEnergy ?? (progress >= 1700 ? 100 : 65),
      boost: saved.boost ?? 1, boostMs: 0, invulnerableMs: 0, nearMisses: 0,
      steer: 0, braking: false, trace: [], echo: null, echoDeceptions: 0,
      audits: {}, drafted: {}, draftMs: 0,
      nextRivalAt: progress >= 1700 ? progress + 120 : 1810,
      rivalTarget: 1.5, rivalLane: 1.5, rivalWarning: false,
      rivalEchoCommitted: false, rivalDistractedMs: 0,
      message: 'CACHE BACK // KEEP THE ORIGINAL', messageMs: 2800,
      gateOpen: progress >= GATE, gateRejectMs: 0,
      status: saved.status || 'playing', elapsedMs: 0 };
  }

  const road = B.CacheRoadProof = {
    active: false, status: null, state: null, returnTo: null, pending: false,
    exiting: false, audioDegraded: false, oldHint: null,
    setHint() {
      const hint = document.querySelector?.('.hint');
      if (!hint) return;
      if (this.oldHint === null) this.oldHint = hint.textContent;
      hint.textContent = 'Left/Right: Steer | Down: Brake | Space/A: Turbo | E/RB: Lock | H/Y: Buffer Echo | P/Menu: Pause';
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
        Math.abs(tracks[source.sourceId].buffer.duration - 16) > 0.02);
      return !this.audioDegraded;
    },
    validate(saved) {
      const s = saved?.levelState, p = s?.proof;
      return saved?.levelId === ID && [1, 2].includes(s?.proofVersion) &&
        Object.hasOwn(CHECKPOINTS, saved.checkpointId) &&
        s.returnTo?.checkpointId === 'intermission' &&
        B.Campaign.validateLevel01Checkpoint(s.returnTo) &&
        Number.isFinite(p?.progress) && p.progress >= 0 && p.progress <= END &&
        (saved.checkpointId === 'road-clear' ? p.progress === END :
          Math.abs(p.progress - CHECKPOINTS[saved.checkpointId]) <= 1) &&
        Number.isInteger(p.lane) && p.lane >= 0 && p.lane < 4 &&
        Number.isInteger(p.integrity) && p.integrity >= 1 && p.integrity <= 3 &&
        (s.proofVersion === 1 ||
          Number.isFinite(p.lanePos) && p.lanePos >= 0 && p.lanePos <= 3 &&
          Number.isFinite(p.speed) && p.speed >= 10 && p.speed <= 78 &&
          Number.isFinite(p.timeMs) && p.timeMs > 0 && p.timeMs <= 60000 &&
          Number.isFinite(p.lockEnergy) && p.lockEnergy >= 0 && p.lockEnergy <= 100 &&
          Number.isFinite(p.echoEnergy) && p.echoEnergy >= 0 && p.echoEnergy <= 100) &&
        Array.isArray(p.locked) && p.locked.length <= (s.proofVersion === 1 ? 2 : 3) &&
        new Set(p.locked).size === p.locked.length &&
        p.locked.every(lane => Number.isInteger(lane) && lane >= 0 && lane < 4);
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
      try {
        window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
        if (!this.selectMusicProfile().ok) throw new Error('road-profile-unavailable');
        const prepared = await window.audioSystem?.prepareActiveMusicProfile?.();
        if (!prepared?.ok) throw new Error('road-audio-unavailable');
        this.checkAudioAssets();
        this.returnTo = returnTo;
        this.state = newState(resume?.levelState.proof);
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
        this.dispose();
        if (previous) returnTo.levelState.cacheRoadCheckpoint = previous;
        B.Campaign.archive().checkpoint(returnTo);
        await B.RuntimeLifecycle?.restart?.({ source: 'road-entry-recovery', resume: returnTo });
        return { ok: false, reason: error.message };
      } finally { this.pending = false; }
    },
    restore(saved) {
      if (!this.validate(saved)) return false;
      this.returnTo = clone(saved.levelState.returnTo);
      this.state = newState({ ...saved.levelState.proof,
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
        levelState: { proofVersion: 2, returnTo: clone(this.returnTo), proof: {
          progress: CHECKPOINTS[id], lane: s.lane, lanePos: s.lanePos,
          speed: s.speed, timeMs: Math.ceil(s.timeMs),
          lockEnergy: Math.round(s.lockEnergy), echoEnergy: Math.round(s.echoEnergy),
          boost: s.boost, locked: [...s.locked], integrity: Math.max(1, s.integrity) } } });
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
      const fromCheckpoint = this.status === 'clear' ? null : saved?.levelId === ID ? saved.levelState.proof : null;
      this.state = newState(fromCheckpoint ? { ...fromCheckpoint, integrity: 3,
        timeMs: Math.max(fromCheckpoint.timeMs || 0, 30000), echoEnergy: Math.max(fromCheckpoint.echoEnergy || 0, 100) } : {});
      this.status = 'playing';
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
      return { lane: this.state.lane, locked: [...this.state.locked],
        finalMix: false };
    },
    lockCurrent() {
      const s = this.state, lane = s.lane, index = s.locked.indexOf(lane);
      if (index >= 0) {
        s.locked.splice(index, 1); s.message = `${LANES[lane]} RELEASED`;
      } else {
        if (s.lockEnergy < 60) {
          s.message = 'DRIVE CLEAN TO CHARGE A MUSIC LOCK'; s.messageMs = 1200; return;
        }
        s.lockEnergy -= 60;
        if (s.locked.length === 3) s.locked.shift();
        s.locked.push(lane); s.message = `${LANES[lane]} LOCKED IN`;
      }
      s.messageMs = 1150;
      window.audioSystem?.playCombatCue?.('inspect');
    },
    sendEcho() {
      const s = this.state;
      if (s.echoEnergy < 100) {
        s.message = 'BUFFER NEEDS A CLEAN TRACE'; s.messageMs = 950; return;
      }
      s.echoEnergy = 0;
      s.echo = { lanePos: s.lanePos, progress: s.progress, ageMs: 0,
        path: s.trace.map(sample => ({ ...sample })), sampleIndex: 0, sampleMs: 0 };
      s.rivalDistractedMs = 2700;
      s.message = 'BUFFER ECHO // SPLIT THE LINE'; s.messageMs = 1700;
      window.audioSystem?.playCombatCue?.('data');
    },
    handleActions(actions) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state;
      s.steer = Number(!!actions.move_right?.held) - Number(!!actions.move_left?.held);
      s.braking = !!actions.move_down?.held;
      if (actions.inspect?.pressed) this.lockCurrent();
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
      s.message = `${kind.toUpperCase()} HIT / SIGNAL DAMAGED`;
      s.messageMs = 1400;
      window.audioSystem?.playCombatCue?.('damage');
      if (s.integrity <= 0) this.status = s.status = 'failed';
    },
    cleanPass() {
      const s = this.state;
      s.nearMisses++;
      s.echoEnergy = clamp(s.echoEnergy + 28, 0, 100);
      s.lockEnergy = clamp(s.lockEnergy + 32, 0, 100);
      if (s.nearMisses >= 2) { s.boost = 1; s.nearMisses = 0; }
      s.message = 'CLEAN PASS // BUFFER CHARGING'; s.messageMs = 800;
      window.audioSystem?.playCombatCue?.('pickup');
    },
    update(delta) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state, dt = Math.min(100, Math.max(0, delta));
      if (!dt) return;
      const before = s.progress;
      s.elapsedMs += dt; s.timeMs = Math.max(0, s.timeMs - dt);
      s.boostMs = Math.max(0, s.boostMs - dt);
      s.invulnerableMs = Math.max(0, s.invulnerableMs - dt);
      s.messageMs = Math.max(0, s.messageMs - dt);
      s.gateRejectMs = Math.max(0, s.gateRejectMs - dt);
      s.rivalDistractedMs = Math.max(0, s.rivalDistractedMs - dt);
      const seconds = dt / 1000;
      const targetSpeed = s.braking ? 23 : s.boostMs ? 75 : 54;
      s.speed = clamp(s.speed + clamp(targetSpeed - s.speed,
        -(s.braking ? 48 : 8) * seconds, (s.boostMs ? 47 : 22) * seconds), 18, 75);
      const curve = roadCurve(before);
      s.lanePos = clamp(s.lanePos +
        (s.steer * 2.5 - curve * (s.speed / 54) ** 2 * 0.5) * seconds, 0, 3);
      s.lane = Math.round(s.lanePos);
      s.visualLane += (s.lanePos - s.visualLane) * Math.min(1, dt / 90);
      s.progress = Math.min(END, before + s.speed * seconds);

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
        if (e.ageMs >= 2700) s.echo = null;
      }
      if (Math.abs(curve) > 0.48 && s.speed > 30 && s.steer * curve > 0) {
        s.lockEnergy = clamp(s.lockEnergy + 10 * seconds, 0, 100);
        s.echoEnergy = clamp(s.echoEnergy + 8 * seconds, 0, 100);
      }

      for (const hazard of HAZARDS) {
        const distance = hazard.at - s.progress;
        if (hazard.kind === 'audit' && distance < 160 && distance > 0 &&
          !Object.hasOwn(s.audits, hazard.at)) s.audits[hazard.at] = s.lane;
        const lane = hazardLane(hazard, s.progress, s.audits);
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
          this.hit(hazard.kind === 'block' ? 'roadblock' : hazard.kind);
          if (this.status === 'failed') return;
        } else if (gap < 1.18 && s.speed >= 25) {
          this.cleanPass();
        }
      }
      if (s.progress >= 1700 && s.progress < END) {
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
          const density = new Set([s.lane, ...s.locked]).size;
          s.nextRivalAt = s.progress + (density >= 3 ? 155 : 225);
          s.rivalWarning = false; s.rivalEchoCommitted = false;
        }
      }
      if (before < 850 && s.progress >= 850) {
        s.timeMs = Math.max(s.timeMs, 33000) + (new Set([s.lane, ...s.locked]).size - 1) * 1800;
        this.checkpoint('road-cache'); s.message = 'ORIGINAL TAPE / KEEP MOVING'; s.messageMs = 1600;
      }
      if (before < 1700 && s.progress >= 1700) {
        s.timeMs = Math.max(s.timeMs, 31000) + (new Set([s.lane, ...s.locked]).size - 1) * 1800;
        s.echoEnergy = 100;
        this.checkpoint('road-fork'); s.message = 'A CLEAN COPY IS MISSING NAMES'; s.messageMs = 2400;
      }
      if (before < GATE && s.progress >= GATE) {
        if (s.lanePos < 2.45 || !s.echo || s.rivalDistractedMs <= 0 ||
            Math.abs(s.echo.lanePos - s.lanePos) < 0.75) {
          s.progress = 1910; s.gateRejectMs = 1500;
          s.timeMs = Math.max(s.timeMs, 16000); s.echoEnergy = 100;
          s.echo = null; s.rivalDistractedMs = 0; s.nextRivalAt = 2020;
          s.message = 'ECHO DRAWS THE AUDIT // DRIVE ORIGINAL RIGHT'; s.messageMs = 2600;
        } else {
          s.timeMs = Math.max(s.timeMs, 21000);
          s.gateOpen = true; this.checkpoint('road-gate');
          s.message = 'ORIGINAL THROUGH // MAC: DISTRIBUTION DENIED'; s.messageMs = 3500;
        }
      }
      if (s.progress >= END) {
        s.progress = END; this.status = s.status = 'clear';
        this.checkpoint('road-clear');
      }
      if (s.timeMs <= 0 && this.status === 'playing') {
        this.status = s.status = 'failed'; s.message = 'TRANSMISSION WINDOW CLOSED';
      }
    },
    draw(ctx) {
      if (!ctx || !this.active) return;
      const s = this.state, progress = s.progress;
      const section = progress < 850 ? 0 : progress < 1700 ? 1 : progress < 2070 ? 2 : 3;
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
      // Road shoulders and four colored music bands share the same projection.
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
      for (let lane = 0; lane < 4; lane++) {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          if (!i) ctx.moveTo(laneEdge(lane, t), roadY(t)); else ctx.lineTo(laneEdge(lane, t), roadY(t));
        }
        for (let i = 20; i >= 0; i--) {
          const t = i / 20; ctx.lineTo(laneEdge(lane + 1, t), roadY(t));
        }
        ctx.closePath(); ctx.fillStyle = PALETTE[lane];
        ctx.globalAlpha = s.lane === lane ? .13 : s.locked.includes(lane) ? .085 : .028;
        ctx.fill(); ctx.globalAlpha = 1;
      }
      for (const side of [-1, 1]) {
        ctx.strokeStyle = section === 3 ? '#a2f9c9' : '#f0a0ac'; ctx.lineWidth = 7;
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
      for (let at = Math.floor(progress / 58) * 58; at < progress + 500; at += 58) {
        const d = at - progress, t = depth(d);
        if (d < -65 || t < .18) continue;
        ctx.strokeStyle = section === 3 ? '#bbfad4' : '#9bbad3';
        ctx.globalAlpha = .12 + t * .23; ctx.lineWidth = 2 + t * 8;
        ctx.beginPath(); ctx.moveTo(center(t) - half(t), roadY(t));
        ctx.lineTo(center(t) + half(t), roadY(t)); ctx.stroke();
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
        const d = upcoming - progress, t = depth(d), y = roadY(t), width = half(t) * 1.7;
        ctx.fillStyle = '#0b2431'; ctx.fillRect(center(t) - width/2, y - 100*t - 24, width, 25 + 65*t);
        ctx.strokeStyle = '#8cdef2'; ctx.lineWidth = Math.max(2, 5*t);
        ctx.strokeRect(center(t) - width/2, y - 100*t - 24, width, 25 + 65*t);
        ctx.fillStyle = '#e5fcf1'; ctx.font = `bold ${Math.round(10 + 22*t)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('ROAD MARKER', center(t), y - 60*t - 3);
      }
      // Far traffic first; the shapes and on-road arrows remain legible in motion.
      for (const hazard of [...HAZARDS].reverse()) {
        const d = hazard.at - progress;
        if (d < 0 || d > 440) continue;
        const t = depth(d), lane = hazardLane(hazard, progress, s.audits);
        const x = laneX(lane, t), y = roadY(t);
        const w = (hazard.kind === 'freight' ? 32 : 26) + t * (hazard.kind === 'freight' ? 144 : 113);
        const h = (hazard.kind === 'freight' ? 30 : 24) + t * (hazard.kind === 'freight' ? 149 : 111);
        if (hazard.kind === 'audit' && d < 165 && d > 0) {
          ctx.fillStyle = '#ff4f82'; ctx.globalAlpha = .27;
          ctx.fillRect(laneEdge(lane,t) + 8, y + h*.1, half(t)/2 - 16, 13 + 24*t);
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
      if (progress > 1700 && progress < GATE + 45) {
        const t = depth(GATE - progress), y = roadY(t);
        ctx.fillStyle = '#9ffff0'; ctx.font = `bold ${Math.round(18 + t*23)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('ORIGINAL >>>', laneX(3,t), y - 154*t - 52);
        ctx.fillStyle = '#ffb2bd'; ctx.fillText('AUDIT COPY', laneX(0,t), y - 154*t - 52);
      }
      if (progress >= 1700) {
        const t = .62, x = laneX(s.rivalLane,t), y = roadY(t);
        drawVehicle(ctx, x, y, 126, 127, 'rival');
        if (s.rivalWarning) {
          const markT = depth(s.nextRivalAt - progress), markX = laneX(s.rivalTarget,markT), markY = roadY(markT);
          ctx.strokeStyle = '#ff719b'; ctx.lineWidth = 6;
          ctx.strokeRect(markX - 44, markY - 83, 88, 78);
          ctx.fillStyle = '#ffe3eb'; ctx.font = 'bold 22px Oxanium, monospace';
          ctx.textAlign = 'center'; ctx.fillText('CLEAN COPY // MARKED LANE', 960, 371);
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
      if (s.invulnerableMs) {
        ctx.fillStyle = '#ff697a';
        ctx.fillRect(0, 163, 12, 750); ctx.fillRect(1908, 163, 12, 750);
      }
      // The driving HUD prioritizes time, damage and ability readiness.
      ctx.fillStyle = '#091523f2'; ctx.fillRect(0, 0, 1920, 164);
      ctx.fillStyle = '#9ef6e2'; ctx.font = 'bold 32px Oxanium, monospace'; ctx.textAlign = 'left';
      ctx.fillText('CACHE BACK  /  ORIGINAL MASTER', 42, 45);
      ctx.fillStyle = '#c9e1e8'; ctx.font = '20px Oxanium, monospace';
      ctx.fillText(`${names[section]}   •   SIGNAL ${Math.floor(progress)} / ${END}`, 44, 78);
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
      meter(693, 'BUFFER ECHO', s.echoEnergy, '#83e6fc');
      meter(969, 'MUSIC LOCK', s.lockEnergy, '#d0a4ff');
      ctx.fillStyle = s.boost || s.boostMs ? '#fbd899' : '#5d7381';
      ctx.font = 'bold 21px Oxanium, monospace'; ctx.fillText(s.boostMs ? 'TURBO ACTIVE' : s.boost ? 'TURBO READY' : 'TURBO CHARGING', 1246, 124);
      ctx.fillStyle = '#afbdcb'; ctx.font = '17px Oxanium, monospace'; ctx.textAlign = 'right';
      ctx.fillText('LEFT/RIGHT STEER    DOWN BRAKE    SPACE/A TURBO', 1880, 57);
      ctx.fillText('E/RB LOCK    H/Y ECHO    P/MENU PAUSE', 1880, 91);
      ctx.fillText('REVIEW SLICE • NO CAMPAIGN KEY', 1880, 129);
      for (let i = 0; i < 4; i++) {
        const x = 43 + i * 469, selected = s.lane === i, locked = s.locked.includes(i);
        ctx.fillStyle = '#0a1929e8'; ctx.fillRect(x, 957, 448, 76);
        ctx.fillStyle = PALETTE[i]; ctx.fillRect(x, 957, 448, selected ? 7 : 4);
        ctx.strokeStyle = PALETTE[i]; ctx.globalAlpha = selected ? 1 : locked ? .83 : .5;
        ctx.lineWidth = selected ? 3 : 1.5; ctx.strokeRect(x, 957, 448, 76); ctx.globalAlpha = 1;
        ctx.fillStyle = selected ? '#ffffff' : '#bdd0dc'; ctx.font = 'bold 24px Oxanium, monospace';
        ctx.textAlign = 'left'; ctx.fillText(`${i+1}  ${LANES[i]}`, x + 21, 1004);
        if (selected || locked) {
          ctx.fillStyle = selected ? PALETTE[i] : '#e9d7ff'; ctx.font = 'bold 17px Oxanium, monospace';
          ctx.textAlign = 'right'; ctx.fillText(selected ? 'LIVE' : 'LOCKED', x + 424, 1002);
        }
      }
      if (progress > 1840 && progress < GATE && !s.gateRejectMs) {
        ctx.fillStyle = '#0a2234ed'; ctx.fillRect(500, 282, 920, 54);
        ctx.strokeStyle = '#9cf9ce'; ctx.lineWidth = 2; ctx.strokeRect(500, 282, 920, 54);
        ctx.fillStyle = '#e7ffeb'; ctx.font = 'bold 25px Oxanium, monospace';
        ctx.textAlign = 'center'; ctx.fillText('SEND ECHO LEFT • STEER ORIGINAL RIGHT', 960, 316);
      }
      if (s.messageMs > 0) {
        ctx.fillStyle = '#091928ed'; ctx.fillRect(395, 195, 1130, 67);
        ctx.fillStyle = s.gateRejectMs ? '#ffb5a2' : '#b4ffe4';
        ctx.font = 'bold 28px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText(s.message, 960, 239);
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
          s.timeMs <= 0 ? 'TRANSMISSION WINDOW CLOSED' : 'SIGNAL LOST', 960, 380);
        ctx.font = '25px Oxanium, monospace'; ctx.fillStyle = '#9cf9df';
        ctx.fillText(this.status === 'clear' ? 'DELIVERED / UNVERIFIED — Mac sees the distribution blockade.' :
          'Your last road marker remains. Draft, brake and use an Echo to split the audit.', 960, 458);
        ctx.fillStyle = '#e6c8b5'; ctx.font = '22px Oxanium, monospace';
        ctx.fillText(this.status === 'clear' ? 'Proof clear only. Bass awaits the authored Level 2.' :
          'Collisions cost speed and time. The rival follows a visible warning line.', 960, 506);
        ctx.fillText('ENTER / A: RETRY     C / Y: RETURN TO LEVEL 1', 960, 625);
        ctx.fillText('P / MENU: SETTINGS AND EXIT PREVIEW', 960, 672);
      }
      ctx.restore();
    }
  };
  B.Campaign.register(ID, { validate: saved => road.validate(saved), restore: saved => road.restore(saved) });
  B.Campaign.syncTitleButton();
})(window.BARCODE = window.BARCODE || {});
