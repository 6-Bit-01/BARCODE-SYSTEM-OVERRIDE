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

  function newState(saved = {}) {
    const progress = saved.progress ?? 0;
    const lanePos = saved.lanePos ?? saved.lane ?? 1;
    return { progress, lanePos, lane: Math.round(lanePos), visualLane: lanePos,
      locked: [...(saved.locked || [])], integrity: saved.integrity ?? 3,
      speed: saved.speed ?? 34, timeMs: saved.timeMs ?? 37000,
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
          Number.isFinite(p.speed) && p.speed >= 10 && p.speed <= 64 &&
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
      s.integrity--; s.speed = Math.max(17, s.speed - 17); s.timeMs = Math.max(0, s.timeMs - 1800);
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
      const targetSpeed = s.braking ? 18 : s.boostMs ? 62 : 44;
      s.speed = clamp(s.speed + clamp(targetSpeed - s.speed,
        -(s.braking ? 38 : 8) * seconds, (s.boostMs ? 35 : 14) * seconds), 14, 62);
      const curve = roadCurve(before);
      s.lanePos = clamp(s.lanePos +
        (s.steer * 2.15 - curve * (s.speed / 42) ** 2 * 0.43) * seconds, 0, 3);
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
          e.lanePos = clamp(e.lanePos + sample.steer * 2.15 * step / 1000, 0, 3);
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
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, 930);
      sky.addColorStop(0, progress > 1700 ? '#1b2145' : '#070e29');
      sky.addColorStop(0.65, progress > 1700 ? '#a34c77' : '#392648');
      sky.addColorStop(1, progress > 1700 ? '#efaa75' : '#ab5973');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 1920, 1080);
      const horizon = 345, bottom = 1080;
      const bend = t => Math.sin(progress / 190 + (1 - t) * 1.2) * (1 - t) * 124;
      const center = t => 960 + bend(t), half = t => 80 + 800 * t;
      const laneX = (lane, t) => center(t) + ((lane + 0.5) / 4 * 2 - 1) * half(t);
      const roadY = t => horizon + t * t * (bottom - horizon);
      // Distant skyline and scanlines move against the road's travel speed.
      for (let i = 0; i < 30; i++) {
        const x = i * 92 - (progress * 0.24 % 92);
        const h = 85 + i * 31 % 135;
        ctx.fillStyle = i % 3 ? '#132039' : '#1d2943';
        ctx.fillRect(x, horizon - h, 72, h);
        ctx.fillStyle = '#6c6779'; ctx.fillRect(x + 14, horizon - h + 24, 7, 8);
      }
      ctx.fillStyle = '#101724'; ctx.fillRect(0, horizon + 25, 1920, 735);
      for (let i = 0; i < 12; i++) {
        const x = ((i * 263 - progress * 2.2) % 2350 + 2350) % 2350 - 230;
        ctx.fillStyle = i % 3 ? '#394a57' : '#536472';
        ctx.fillRect(x, horizon + 15, 12, 480);
        ctx.fillStyle = '#76baca'; ctx.globalAlpha = 0.42;
        ctx.fillRect(x - 25, horizon + 50, 65, 4); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = '#102133'; ctx.fillRect(0, horizon, 1920, bottom - horizon);
      ctx.beginPath(); ctx.moveTo(center(0) - half(0), horizon);
      for (let i = 1; i <= 24; i++) { const t = i / 24; ctx.lineTo(center(t) - half(t), roadY(t)); }
      for (let i = 24; i >= 0; i--) { const t = i / 24; ctx.lineTo(center(t) + half(t), roadY(t)); }
      ctx.closePath(); ctx.fillStyle = '#20283b'; ctx.fill();
      const colours = ['#67ddff', '#fba66f', '#d59cff', '#9cffbb'];
      for (let lane = 0; lane < 4; lane++) {
        const x1 = laneX(lane, 0.08), x2 = laneX(lane, 1);
        ctx.beginPath(); ctx.moveTo(x1 - 18, roadY(0.08));
        ctx.lineTo(x1 + 18, roadY(0.08));
        ctx.lineTo(x2 + 150, roadY(1)); ctx.lineTo(x2 - 150, roadY(1));
        ctx.closePath(); ctx.fillStyle = colours[lane];
        ctx.globalAlpha = s.locked.includes(lane) || s.lane === lane ? 0.065 : 0.022;
        ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = '#e7788a'; ctx.lineWidth = 7;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let i = 0; i <= 22; i++) {
          const t = i / 22, x = center(t) + side * half(t);
          if (!i) ctx.moveTo(x, roadY(t)); else ctx.lineTo(x, roadY(t));
        }
        ctx.stroke();
      }
      // Road dashes and lane-color reflections encode the current mix.
      for (let lane = 0; lane < 4; lane++) {
        const t = 0.91;
        ctx.fillStyle = colours[lane]; ctx.globalAlpha = s.locked.includes(lane) || s.lane === lane ? 0.30 : 0.07;
        ctx.fillRect(laneX(lane, t) - 75, roadY(t), 150, 13);
        ctx.globalAlpha = 1;
      }
      for (let at = Math.floor(progress / 24) * 24; at < progress + 500; at += 24) {
        const d = at - progress, t = clamp(1 - (d + 80) / 520, 0, 1);
        if (d < -72 || (Math.floor(at / 24) % 2)) continue;
        ctx.fillStyle = '#b5b8c2'; ctx.globalAlpha = 0.25 + 0.55 * t;
        for (let lane = 1; lane < 4; lane++) {
          const x = center(t) - half(t) + lane * half(t) / 2;
          ctx.fillRect(x - 2 - 3 * t, roadY(t), 4 + 6 * t, 5 + 25 * t);
        }
      }
      ctx.globalAlpha = 1;
      // The approach stripes make speed and the checkpoint window readable.
      for (let at = Math.ceil(progress / 90) * 90; at < progress + 480; at += 90) {
        const d = at - progress, t = clamp(1 - (d + 80) / 520, 0, 1);
        ctx.strokeStyle = at % 180 ? '#679199' : '#d8aa8b';
        ctx.globalAlpha = 0.14 + t * 0.24; ctx.lineWidth = 2 + t * 7;
        ctx.beginPath(); ctx.moveTo(center(t) - half(t), roadY(t));
        ctx.lineTo(center(t) + half(t), roadY(t)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (const hazard of HAZARDS) {
        const d = hazard.at - progress;
        if (d < -45 || d > 440) continue;
        const t = clamp(1 - (d + 80) / 520, 0, 1);
        const lane = hazardLane(hazard, progress, s.audits);
        const x = laneX(lane, t), y = roadY(t);
        const w = (hazard.kind === 'freight' ? 34 : 24) + t * (hazard.kind === 'freight' ? 122 : 90);
        const h = (hazard.kind === 'freight' ? 28 : 16) + t * (hazard.kind === 'freight' ? 135 : 100);
        ctx.fillStyle = '#0b1021'; ctx.fillRect(x - w * 0.6, y - h * 0.1, w * 1.2, h * 0.24);
        ctx.fillStyle = hazard.kind === 'block' ? '#cc765d' : hazard.kind === 'audit' ? '#f0e8d9' :
          hazard.kind === 'freight' ? '#526774' : hazard.kind === 'sweeper' ? '#bb8351' : '#4c76a0';
        ctx.fillRect(x - w / 2, y - h, w, h);
        ctx.fillStyle = hazard.kind === 'block' ? '#fff0c9' : hazard.kind === 'audit' ? '#ee5882' : '#adf4ff';
        ctx.fillRect(x - w * 0.35, y - h * 0.75, w * 0.7, h * 0.22);
        ctx.fillStyle = '#fbc375';
        ctx.fillRect(x - w * 0.42, y - h * 0.17, w * 0.2, h * 0.1);
        ctx.fillRect(x + w * 0.22, y - h * 0.17, w * 0.2, h * 0.1);
        if (hazard.kind === 'sweeper' || hazard.kind === 'audit') {
          ctx.fillStyle = '#ffe39a'; ctx.font = `bold ${Math.round(13 + t * 23)}px Oxanium, monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(hazard.kind === 'audit' ? 'AUDIT LOCK' : 'MERGING RIGHT', x, y - h - 12);
        }
      }
      if (progress > 1670 && progress < GATE + 35) {
        const d = GATE - progress, t = clamp(1 - (d + 80) / 520, 0, 1);
        const x = laneX(3, t), y = roadY(t);
        ctx.fillStyle = '#94ffd3'; ctx.font = `bold ${Math.round(20 + t * 25)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('ORIGINAL / RIGHT EXIT', x, y - 90 * t - 25);
        ctx.fillStyle = '#ff9d91'; ctx.fillText('CLEAN COPY / AUDIT', laneX(0, t), y - 90 * t - 25);
      }
      if (progress >= 1700) {
        const t = 0.67, x = laneX(s.rivalLane, t), y = roadY(t);
        const w = 30 + t * 105, h = 30 + t * 110;
        ctx.fillStyle = '#fff0e5'; ctx.fillRect(x - w / 2, y - h, w, h);
        ctx.fillStyle = '#d65679'; ctx.fillRect(x - w * 0.36, y - h * 0.68, w * 0.72, h * 0.18);
        ctx.strokeStyle = '#ffaac1'; ctx.lineWidth = 2 + t * 5;
        ctx.strokeRect(x - w / 2, y - h, w, h);
        if (s.rivalWarning) {
          const d = s.nextRivalAt - progress, markT = clamp(1 - (d + 80) / 520, 0, 1);
          const markX = laneX(s.rivalTarget, markT), markY = roadY(markT);
          ctx.strokeStyle = '#ffc4d0'; ctx.lineWidth = 5;
          ctx.strokeRect(markX - 42, markY - 75, 84, 70);
          ctx.fillStyle = '#ffe6f0'; ctx.font = 'bold 24px Oxanium, monospace';
          ctx.textAlign = 'center'; ctx.fillText('CLEAN COPY CLOSING', 960, 325);
        }
      }
      // Cache and the visible replay share a starting point, then diverge.
      const carX = laneX(s.visualLane, 0.83), carY = roadY(0.83);
      if (s.echo) {
        const x = laneX(s.echo.lanePos, 0.83);
        ctx.globalAlpha = 0.45 + Math.sin(s.echo.ageMs / 90) * 0.12;
        ctx.fillStyle = '#a8edff'; ctx.fillRect(x - 75, carY - 90, 150, 94);
        ctx.strokeStyle = '#e3fbff'; ctx.lineWidth = 4;
        ctx.strokeRect(x - 81, carY - 98, 162, 103);
        ctx.fillStyle = '#052a3e'; ctx.fillRect(x - 52, carY - 75, 104, 40);
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = s.invulnerableMs && Math.floor(s.invulnerableMs / 90) % 2 ? 0.4 : 1;
      ctx.fillStyle = '#090f1a'; ctx.beginPath(); ctx.ellipse(carX, carY + 18, 105, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = s.boostMs ? '#ffe399' : '#80f5de'; ctx.fillRect(carX - 78, carY - 94, 156, 104);
      ctx.fillStyle = '#132f41'; ctx.fillRect(carX - 58, carY - 80, 116, 47);
      ctx.fillStyle = '#f597a6'; ctx.fillRect(carX - 66, carY - 12, 28, 12); ctx.fillRect(carX + 38, carY - 12, 28, 12);
      if (s.boostMs) {
        ctx.fillStyle = '#ffdc83'; ctx.fillRect(carX - 50, carY + 10, 25, 46);
        ctx.fillRect(carX + 25, carY + 10, 25, 46);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#07121f'; ctx.fillRect(0, 0, 1920, 166);
      ctx.fillStyle = '#9cf9df'; ctx.font = 'bold 33px Oxanium, monospace';
      ctx.textAlign = 'left'; ctx.fillText('THE CACHE LINE // ORIGINAL MASTER', 60, 58);
      ctx.fillStyle = '#f6eef3'; ctx.font = '22px Oxanium, monospace';
      ctx.fillText(`SPEED ${Math.round(s.speed * 5.2)} KM/H     WINDOW ${(s.timeMs / 1000).toFixed(1)}S     SIGNAL ${Math.floor(progress)} / ${END}`, 60, 102);
      ctx.fillText(`TURBO ${s.boost ? 'READY' : s.boostMs ? 'ACTIVE' : 'CHARGING'}     ECHO ${Math.round(s.echoEnergy)}%     LOCK ${Math.round(s.lockEnergy)}%     INTEGRITY ${s.integrity}/3`, 60, 139);
      ctx.fillStyle = '#b9a6cd'; ctx.textAlign = 'right';
      ctx.font = '18px Oxanium, monospace';
      ctx.fillText('REVIEW SLICE // NO CAMPAIGN KEY', 1860, 53);
      ctx.fillText('LEFT/RIGHT: STEER  DOWN: BRAKE  SPACE/A: TURBO  E/RB: LOCK  H/Y: ECHO', 1860, 92);
      ctx.fillText('THREE EARNED LOCKS + CURRENT BAND // BEAT-ALIGNED MIX', 1860, 131);
      for (let i = 0; i < 4; i++) {
        const x = 200 + i * 380, selected = s.lane === i, locked = s.locked.includes(i);
        ctx.fillStyle = selected ? '#225456' : locked ? '#443a5d' : '#172437';
        ctx.fillRect(x, 954, 350, 79);
        ctx.strokeStyle = colours[i]; ctx.lineWidth = selected || locked ? 4 : 2;
        ctx.strokeRect(x, 954, 350, 79);
        ctx.fillStyle = '#f7f4ed'; ctx.font = 'bold 23px Oxanium, monospace';
        ctx.textAlign = 'center'; ctx.fillText(`${i + 1} ${LANES[i]}${locked ? '  • LOCKED' : ''}`, x + 175, 1003);
      }
      if (progress > 1840 && progress < GATE && !s.gateRejectMs) {
        ctx.fillStyle = '#0b2133e5'; ctx.fillRect(465, 284, 990, 58);
        ctx.strokeStyle = '#9cffbb'; ctx.lineWidth = 2; ctx.strokeRect(465, 284, 990, 58);
        ctx.fillStyle = '#d4ffdf'; ctx.font = 'bold 25px Oxanium, monospace';
        ctx.textAlign = 'center'; ctx.fillText('H / Y: SEND ECHO LEFT • STEER ORIGINAL RIGHT', 960, 321);
      }
      if (s.messageMs > 0) {
        ctx.fillStyle = '#0c1b2bdd'; ctx.fillRect(340, 200, 1240, 72);
        ctx.fillStyle = s.gateRejectMs ? '#ffb2a1' : '#afffe1';
        ctx.font = 'bold 30px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText(s.message, 960, 247);
      }
      if (this.audioDegraded) {
        ctx.fillStyle = '#ffbb8b'; ctx.font = '20px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText('AUDIO FALLBACK — MIX TIMBRE / ALIGNMENT NEEDS RECHECK', 960, 310);
      }
      if (this.status !== 'playing') {
        ctx.fillStyle = '#061320eb'; ctx.fillRect(370, 280, 1180, 485);
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
