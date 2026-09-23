// Cache Back road and lane-mixer vertical slice. It shares the existing
// input/RAF/audio/save/pause owners and awards no Level 2 campaign facts.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/cache-road-proof.js', exports: ['BARCODE.CacheRoadProof'], dependencies: ['BARCODE.Campaign', 'BARCODE.MusicTransport'] });
(function(B) {
  'use strict';
  const ID = 'level-02', PROFILE = 'level-02.proof', END = 2460, GATE = 2060;
  const LANES = ['BASS', 'BREAK', 'HARMONY', 'LEAD'];
  const CHECKPOINTS = { 'road-start': 0, 'road-cache': 850, 'road-fork': 1700,
    'road-gate': 2070, 'road-clear': END };
  const HAZARDS = [
    [190, 1, 'van'], [275, 2, 'van'], [350, 0, 'block'], [465, 3, 'van'],
    [550, 1, 'block'], [635, 2, 'van'], [735, 0, 'van'], [895, 3, 'block'],
    [975, 1, 'van'], [1050, 2, 'block'], [1135, 0, 'van'], [1220, 3, 'van'],
    [1320, 1, 'block'], [1415, 2, 'van'], [1510, 0, 'block'], [1610, 3, 'van'],
    [1765, 1, 'van'], [1840, 2, 'block'], [1930, 0, 'van'], [2005, 1, 'block'],
    [2170, 2, 'van'], [2265, 0, 'block'], [2345, 1, 'van']
  ].map(([at, lane, kind]) => ({ at, lane, kind }));
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function newState(saved = {}) {
    const progress = saved.progress ?? 0;
    return { progress, lane: saved.lane ?? 1, visualLane: saved.lane ?? 1,
      locked: [...(saved.locked || [])], integrity: saved.integrity ?? 3,
      boost: 1, boostMs: 0, invulnerableMs: 0, steerMs: 0, nearMisses: 0,
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
      hint.textContent = 'Left/Right: Lane | E / RB: Lock part | Space / A: Cache dash | P / Menu: Pause';
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
      return saved?.levelId === ID && s?.proofVersion === 1 &&
        Object.hasOwn(CHECKPOINTS, saved.checkpointId) &&
        s.returnTo?.checkpointId === 'intermission' &&
        B.Campaign.validateLevel01Checkpoint(s.returnTo) &&
        Number.isFinite(p?.progress) && p.progress >= 0 && p.progress <= END &&
        (saved.checkpointId === 'road-clear' ? p.progress === END :
          Math.abs(p.progress - CHECKPOINTS[saved.checkpointId]) <= 1) &&
        Number.isInteger(p.lane) && p.lane >= 0 && p.lane < 4 &&
        Number.isInteger(p.integrity) && p.integrity >= 1 && p.integrity <= 3 &&
        Array.isArray(p.locked) && p.locked.length <= 2 &&
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
        levelState: { proofVersion: 1, returnTo, proof: previous.proof } };
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
        levelState: { proofVersion: 1, returnTo: clone(this.returnTo), proof: {
          progress: CHECKPOINTS[id], lane: s.lane, locked: [...s.locked],
          integrity: Math.max(1, s.integrity) } } });
      B.Campaign.syncTitleButton();
      return saved;
    },
    async exit() {
      if (!this.active || this.exiting) return false;
      this.exiting = true;
      const returnTo = clone(this.returnTo);
      const saved = B.Campaign.readResume();
      if (saved?.levelId === ID && this.validate(saved)) returnTo.levelState.cacheRoadCheckpoint = {
        checkpointId: saved.checkpointId, proof: clone(saved.levelState.proof) };
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
      this.state = newState(fromCheckpoint ? { ...fromCheckpoint, integrity: 3 } : {});
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
        finalMix: this.state.progress >= 2220 || this.status === 'clear' };
    },
    lockCurrent() {
      const s = this.state, lane = s.lane, index = s.locked.indexOf(lane);
      if (index >= 0) {
        s.locked.splice(index, 1); s.message = `${LANES[lane]} RELEASED`;
      } else {
        if (s.locked.length === 2) s.locked.shift();
        s.locked.push(lane); s.message = `${LANES[lane]} LOCKED IN`;
      }
      s.messageMs = 1150;
    },
    handleActions(actions) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state;
      const direction = Number(!!actions.move_right?.held) - Number(!!actions.move_left?.held);
      if (direction && (s.steerMs <= 0 || actions.move_right?.pressed || actions.move_left?.pressed)) {
        s.lane = clamp(s.lane + direction, 0, 3);
        s.steerMs = 180;
      }
      if (actions.inspect?.pressed) this.lockCurrent();
      if (actions.jump?.pressed && s.boost > 0) {
        s.boost = 0; s.nearMisses = 0; s.boostMs = 1100;
        s.message = 'CACHE DASH // ORIGINAL SIGNAL HELD'; s.messageMs = 900;
      }
    },
    update(delta) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state, dt = Math.min(100, Math.max(0, delta));
      const before = s.progress;
      s.elapsedMs += dt; s.steerMs = Math.max(0, s.steerMs - dt);
      s.boostMs = Math.max(0, s.boostMs - dt);
      s.invulnerableMs = Math.max(0, s.invulnerableMs - dt);
      s.messageMs = Math.max(0, s.messageMs - dt);
      s.gateRejectMs = Math.max(0, s.gateRejectMs - dt);
      s.visualLane += (s.lane - s.visualLane) * Math.min(1, dt / 105);
      s.progress = Math.min(END, before + dt / 1000 * (s.boostMs ? 43 : 31));
      for (const hazard of HAZARDS) {
        if (before >= hazard.at || s.progress < hazard.at) continue;
        if (hazard.lane === s.lane && !s.boostMs && !s.invulnerableMs) {
          s.integrity--; s.invulnerableMs = 1350;
          s.message = hazard.kind === 'block' ? 'ROADBLOCK / SIGNAL DAMAGED' : 'TRAFFIC HIT / SIGNAL DAMAGED';
          s.messageMs = 1200;
          window.audioSystem?.playSound?.('synthHit');
          if (s.integrity <= 0) {
            this.status = s.status = 'failed'; return;
          }
        } else if (Math.abs(hazard.lane - s.lane) === 1) {
          s.nearMisses++;
          if (s.nearMisses >= 2 && !s.boost) { s.boost = 1; s.nearMisses = 0; }
        }
      }
      if (before < 850 && s.progress >= 850) {
        this.checkpoint('road-cache'); s.message = 'ORIGINAL TAPE / KEEP MOVING'; s.messageMs = 1600;
      }
      if (before < 1700 && s.progress >= 1700) {
        this.checkpoint('road-fork'); s.message = 'A CLEAN COPY IS MISSING NAMES'; s.messageMs = 2400;
      }
      if (before < GATE && s.progress >= GATE) {
        if (s.lane !== 3) {
          s.progress = 1910; s.gateRejectMs = 1200;
          s.message = 'CLEAN COPY REJECTED // TAKE FAR RIGHT'; s.messageMs = 2400;
        } else {
          s.gateOpen = true; this.checkpoint('road-gate');
          s.message = 'ORIGINAL RECEIVED // MAC: DISTRIBUTION DENIED'; s.messageMs = 3500;
        }
      }
      if (s.progress >= END) {
        s.progress = END; this.status = s.status = 'clear';
        this.checkpoint('road-clear');
      }
    },
    draw(ctx) {
      if (!ctx || !this.active) return;
      const s = this.state, progress = s.progress;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, 930);
      sky.addColorStop(0, '#060d25'); sky.addColorStop(0.65, '#40264b'); sky.addColorStop(1, '#bc556c');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 1920, 1080);
      const horizon = 345, bottom = 1080;
      const bend = t => Math.sin(progress / 290 + t * 2.4) * (1 - t) * 92;
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
      ctx.fillStyle = '#102133'; ctx.fillRect(0, horizon, 1920, bottom - horizon);
      ctx.beginPath(); ctx.moveTo(center(0) - half(0), horizon);
      for (let i = 1; i <= 24; i++) { const t = i / 24; ctx.lineTo(center(t) - half(t), roadY(t)); }
      for (let i = 24; i >= 0; i--) { const t = i / 24; ctx.lineTo(center(t) + half(t), roadY(t)); }
      ctx.closePath(); ctx.fillStyle = '#20283b'; ctx.fill();
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
      const colours = ['#67ddff', '#fba66f', '#d59cff', '#9cffbb'];
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
      for (const hazard of HAZARDS) {
        const d = hazard.at - progress;
        if (d < -45 || d > 440) continue;
        const t = clamp(1 - (d + 80) / 520, 0, 1), x = laneX(hazard.lane, t), y = roadY(t);
        const w = 24 + t * 90, h = 16 + t * 100;
        ctx.fillStyle = '#0b1021'; ctx.fillRect(x - w * 0.6, y - h * 0.1, w * 1.2, h * 0.24);
        ctx.fillStyle = hazard.kind === 'block' ? '#cc765d' : '#4c76a0';
        ctx.fillRect(x - w / 2, y - h, w, h);
        ctx.fillStyle = hazard.kind === 'block' ? '#fff0c9' : '#adf4ff';
        ctx.fillRect(x - w * 0.35, y - h * 0.75, w * 0.7, h * 0.22);
        ctx.fillStyle = '#fbc375';
        ctx.fillRect(x - w * 0.42, y - h * 0.17, w * 0.2, h * 0.1);
        ctx.fillRect(x + w * 0.22, y - h * 0.17, w * 0.2, h * 0.1);
      }
      if (progress > 1630 && progress < GATE + 30) {
        const d = GATE - progress, t = clamp(1 - (d + 80) / 520, 0, 1);
        const x = laneX(3, t), y = roadY(t);
        ctx.fillStyle = '#94ffd3'; ctx.font = `bold ${Math.round(20 + t * 25)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('ORIGINAL', x, y - 90 * t - 25);
        ctx.fillStyle = '#ff9d91'; ctx.fillText('CLEAN COPY / EMPTY', laneX(0, t), y - 90 * t - 25);
      }
      // Cache's car stays screen-relative; the road and hazards move past it.
      const carX = laneX(s.visualLane, 0.83), carY = roadY(0.83);
      ctx.globalAlpha = s.invulnerableMs && Math.floor(s.invulnerableMs / 90) % 2 ? 0.4 : 1;
      ctx.fillStyle = '#090f1a'; ctx.beginPath(); ctx.ellipse(carX, carY + 18, 105, 20, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = s.boostMs ? '#ffe399' : '#80f5de'; ctx.fillRect(carX - 78, carY - 94, 156, 104);
      ctx.fillStyle = '#132f41'; ctx.fillRect(carX - 58, carY - 80, 116, 47);
      ctx.fillStyle = '#f597a6'; ctx.fillRect(carX - 66, carY - 12, 28, 12); ctx.fillRect(carX + 38, carY - 12, 28, 12);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#07121f'; ctx.fillRect(0, 0, 1920, 166);
      ctx.fillStyle = '#9cf9df'; ctx.font = 'bold 33px Oxanium, monospace';
      ctx.textAlign = 'left'; ctx.fillText('THE CACHE LINE // MIX RUN', 60, 58);
      ctx.fillStyle = '#f6eef3'; ctx.font = '22px Oxanium, monospace';
      ctx.fillText(`SIGNAL ${Math.floor(progress)} / ${END}     INTEGRITY ${s.integrity}/3`, 60, 102);
      ctx.fillText(`CACHE DASH ${s.boost ? 'READY' : s.boostMs ? 'ACTIVE' : 'NEAR MISSES REFILL'}`, 60, 139);
      ctx.fillStyle = '#b9a6cd'; ctx.textAlign = 'right';
      ctx.fillText('PROVISIONAL LEVEL 2 // NO CAMPAIGN KEY', 1860, 57);
      ctx.fillText('← → / STICK: LANE     E / RB: LOCK     SPACE / A: DASH     P / MENU: PAUSE', 1860, 101);
      ctx.fillText('TWO LOCKS + CURRENT LANE • BEAT-ALIGNED MIX', 1860, 139);
      for (let i = 0; i < 4; i++) {
        const x = 200 + i * 380, selected = s.lane === i, locked = s.locked.includes(i);
        ctx.fillStyle = selected ? '#225456' : locked ? '#443a5d' : '#172437';
        ctx.fillRect(x, 954, 350, 79);
        ctx.strokeStyle = colours[i]; ctx.lineWidth = selected || locked ? 4 : 2;
        ctx.strokeRect(x, 954, 350, 79);
        ctx.fillStyle = '#f7f4ed'; ctx.font = 'bold 23px Oxanium, monospace';
        ctx.textAlign = 'center'; ctx.fillText(`${i + 1} ${LANES[i]}${locked ? '  • LOCKED' : ''}`, x + 175, 1003);
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
        ctx.fillText(this.status === 'clear' ? 'ORIGINAL TAPE DELIVERED' : 'SIGNAL LOST', 960, 380);
        ctx.font = '25px Oxanium, monospace'; ctx.fillStyle = '#9cf9df';
        ctx.fillText(this.status === 'clear' ? 'Mac has a blockade to investigate. The Bass Key awaits the authored stage.' :
          'The road checkpoint remains. Try a different lane and carry its sound with you.', 960, 458);
        ctx.fillText('ENTER / A: RETRY     C / Y: RETURN TO LEVEL 1', 960, 625);
        ctx.fillText('P / MENU: SETTINGS AND EXIT PREVIEW', 960, 672);
      }
      ctx.restore();
    }
  };
  B.Campaign.register(ID, { validate: saved => road.validate(saved), restore: saved => road.restore(saved) });
  B.Campaign.syncTitleButton();
})(window.BARCODE = window.BARCODE || {});
