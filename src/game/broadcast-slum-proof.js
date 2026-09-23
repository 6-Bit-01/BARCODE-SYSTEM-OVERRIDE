// A playable, explicitly provisional Level 3 genre proof. The Level 2 story
// route remains next; this preview awards no keys, levels, lore or results.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/broadcast-slum-proof.js', exports: ['BARCODE.RunAndGunProof'], dependencies: ['BARCODE.Campaign', 'BARCODE.MusicTransport'] });
(function(B) {
  'use strict';
  const ID = 'level-03', PROFILE = 'level-03.proof', FLOOR = 798, WIDTH = 4800;
  const PLAYER_W = 44, PLAYER_H = 76, PHRASE_MS = 16 * 60000 / 108;
  const RELAYS = [{ x: 1690, hp: 5 }, { x: 3340, hp: 7 }];
  const PLATFORMS = [
    { x: 540, y: 665, w: 330 }, { x: 1110, y: 610, w: 270 },
    { x: 2110, y: 670, w: 360 }, { x: 2780, y: 620, w: 260 },
    { x: 3800, y: 650, w: 360 }
  ];
  const ENEMIES = [
    { x: 935, min: 850, max: 1080 }, { x: 1430, min: 1360, max: 1545 },
    { x: 2350, min: 2190, max: 2600 }, { x: 2930, min: 2840, max: 3120 },
    { x: 3850, min: 3720, max: 4050 }, { x: 4320, min: 4220, max: 4470 }
  ];
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rectHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const copy = value => JSON.parse(JSON.stringify(value));

  function newState(checkpoint = {}) {
    const relays = checkpoint.relays ? [...checkpoint.relays] : RELAYS.map(relay => relay.hp);
    const x = checkpoint.playerX ?? 180;
    return {
      player: { x, y: FLOOR - PLAYER_H, vx: 0, vy: 0, facing: 1, grounded: true,
        health: checkpoint.health ?? 4, invulnerableMs: 0 },
      relays, enemies: ENEMIES.map((enemy, index) => ({ ...enemy, y: FLOOR - 64,
        health: relays[1] === 0 && index < 4 || relays[0] === 0 && index < 2 ? 0 : 3,
        direction: index % 2 ? -1 : 1, cooldownMs: 900 + index * 235, warningMs: 0 })),
      shots: [], hostileShots: [], cameraX: clamp(x - 650, 0, WIDTH - 1920),
      elapsedMs: checkpoint.elapsedMs ?? 0, kills: checkpoint.kills ?? 0,
      fireCooldownMs: 0, lastPhrase: null, fallbackMs: 0, warning: false,
      flashMs: 0, message: '', messageMs: 0, status: checkpoint.status || 'playing'
    };
  }

  const proof = B.RunAndGunProof = {
    active: false, status: null, state: null, returnTo: null, pending: false, exiting: false, audioDegraded: false,
    checkAudioAssets() {
      const tracks = window.audioSystem?.musicTracks || {};
      this.audioDegraded = B.MusicProfiles.get(PROFILE).arrangement.sources.some(source =>
        !tracks[source.sourceId]?.buffer || tracks[source.sourceId].isFallback ||
        Math.abs(tracks[source.sourceId].buffer.duration - PHRASE_MS / 1000) > 0.02);
      return !this.audioDegraded;
    },
    validate(saved) {
      const c = saved?.levelState, p = c?.proof;
      return saved?.levelId === ID && ['proof-start', 'proof-relay', 'proof-relay-2', 'proof-clear'].includes(saved.checkpointId) &&
        c?.previewVersion === 1 && c.returnTo?.checkpointId === 'intermission' &&
        B.Campaign.validateLevel01Checkpoint(c.returnTo) && !!p &&
        Number.isFinite(p.playerX) && p.playerX >= 0 && p.playerX <= WIDTH &&
        Number.isInteger(p.health) && p.health >= 1 && p.health <= 4 &&
        Number.isFinite(p.elapsedMs) && p.elapsedMs >= 0 && p.elapsedMs < 1e10 &&
        Number.isInteger(p.kills) && p.kills >= 0 && p.kills <= ENEMIES.length &&
        Array.isArray(p.relays) && p.relays.length === 2 && p.relays.every((n, i) => Number.isInteger(n) && n >= 0 && n <= RELAYS[i].hp) &&
        (saved.checkpointId !== 'proof-start' || p.relays[0] === RELAYS[0].hp && p.relays[1] === RELAYS[1].hp) &&
        (!['proof-relay', 'proof-relay-2', 'proof-clear'].includes(saved.checkpointId) || p.relays[0] === 0) &&
        (!['proof-relay-2', 'proof-clear'].includes(saved.checkpointId) || p.relays[1] === 0);
    },
    selectMusicProfile() {
      const selected = B.MusicProfiles?.select(PROFILE);
      const loaded = selected && B.MusicTransport?.load(PROFILE);
      return { ok: selected?.profileId === PROFILE && loaded?.status === 'ok' };
    },
    async enter() {
      if (this.active || this.pending || !B.Campaign?.intermission) return { ok: false, reason: 'handoff-unavailable' };
      const returnTo = B.Campaign.readResume();
      if (returnTo?.levelId !== 'level-01' || returnTo.checkpointId !== 'intermission' ||
          !B.Campaign.archive().record.progress.completedLevels.includes('level-01')) return { ok: false, reason: 'level-01-clear-required' };
      const previous = returnTo.levelState.previewCheckpoint;
      const previousSaved = previous && { levelId: ID, checkpointId: previous.checkpointId,
        levelState: { previewVersion: 1, returnTo, proof: previous.proof } };
      const resumePreview = this.validate(previousSaved) ? previous : null;
      this.pending = true;
      try {
        window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
        if (!this.selectMusicProfile().ok) throw new Error('missing-proof-profile');
        const prepared = await window.audioSystem?.prepareActiveMusicProfile?.();
        if (!prepared?.ok) throw new Error('proof-audio-unavailable');
        this.checkAudioAssets();
        this.returnTo = returnTo;
        this.state = newState(resumePreview ? { ...resumePreview.proof,
          status: resumePreview.checkpointId === 'proof-clear' ? 'clear' : 'playing' } : {});
        this.status = this.state.status; this.active = true;
        B.Campaign.intermission = false; B.Campaign.run = null;
        window.gameState.victory = false; window.gameState.gameOver = false; window.gameState.running = true;
        const started = window.audioSystem?.startRuntimeGameplayMusic?.();
        if (!started?.ok) throw new Error('proof-audio-start-failed');
        this.checkpoint(resumePreview?.checkpointId || 'proof-start');
        window.inputManager?.resetActionEdges?.();
        return { ok: true };
      } catch (error) {
        this.dispose();
        B.Campaign.archive().checkpoint(returnTo);
        await B.RuntimeLifecycle?.restart?.({ source: 'proof-entry-recovery', resume: returnTo });
        return { ok: false, reason: error.message };
      } finally { this.pending = false; }
    },
    restore(saved) {
      if (!this.validate(saved)) return false;
      this.returnTo = copy(saved.levelState.returnTo);
      this.state = newState({ ...saved.levelState.proof,
        status: saved.checkpointId === 'proof-clear' ? 'clear' : 'playing' });
      this.status = this.state.status; this.active = true; this.exiting = false;
      this.checkAudioAssets();
      window.gameState.victory = false; window.gameState.gameOver = false; window.gameState.running = true;
      window.inputManager?.resetActionEdges?.();
      return true;
    },
    checkpoint(id) {
      if (!this.active || !this.returnTo || !['proof-start', 'proof-relay', 'proof-relay-2', 'proof-clear'].includes(id)) return false;
      const s = this.state, p = s.player;
      const saved = B.Campaign.archive().checkpoint({ levelId: ID, checkpointId: id,
        levelState: { previewVersion: 1, returnTo: copy(this.returnTo), proof: {
          playerX: Math.round(p.x), health: Math.max(1, p.health), elapsedMs: Math.round(s.elapsedMs),
          kills: s.kills, relays: [...s.relays] } } });
      B.Campaign.syncTitleButton();
      return saved;
    },
    async exit() {
      if (!this.active || this.exiting) return false;
      this.exiting = true;
      const returnTo = copy(this.returnTo);
      const saved = B.Campaign.readResume();
      if (saved?.levelId === ID && this.validate(saved)) returnTo.levelState.previewCheckpoint = {
        checkpointId: saved.checkpointId, proof: copy(saved.levelState.proof) };
      B.Campaign.archive().checkpoint(returnTo);
      B.Campaign.syncTitleButton();
      const result = await B.RuntimeLifecycle?.restart?.({ source: 'proof-exit', resume: returnTo });
      if (!result?.ok) this.exiting = false;
      return !!result?.ok;
    },
    dispose() { this.active = false; this.status = null; this.state = null; this.returnTo = null; this.exiting = false; this.audioDegraded = false; },
    retry() {
      if (!this.active || this.status === 'playing') return false;
      const saved = B.Campaign.readResume();
      if (this.status === 'clear') {
        this.state = newState(); this.checkpoint('proof-start');
      } else {
        this.state = newState(saved?.levelId === ID ? saved.levelState.proof : {});
      }
      this.status = 'playing';
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
    volleyTarget() {
      const s = this.state, index = s?.relays.findIndex(hp => hp > 0) ?? -1;
      if (index < 0) return -1;
      const x = RELAYS[index].x - 40;
      return s.player.x >= x - 1250 && s.player.x <= x + 80 ? index : -1;
    },
    threatActive() {
      return !!(this.state && this.status === 'playing' &&
        (this.volleyTarget() >= 0 || this.state.enemies.some(enemy => enemy.health > 0 && Math.abs(enemy.x - this.state.player.x) < 750)));
    },
    handleActions(actions) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state, p = s.player;
      p.vx = (Number(!!actions.move_right?.held) - Number(!!actions.move_left?.held)) * 330;
      if (p.vx) p.facing = Math.sign(p.vx);
      if (actions.jump?.pressed && p.grounded) { p.vy = -735; p.grounded = false; }
      if (actions.inspect?.held && s.fireCooldownMs <= 0) {
        s.fireCooldownMs = 180;
        s.shots.push({ x: p.x + PLAYER_W / 2 + p.facing * 34, y: p.y + 34,
          vx: p.facing * 1020, life: 1000 });
        window.audioSystem?.playSound?.('synthHit');
      }
    },
    hitPlayer() {
      const s = this.state, p = s.player;
      if (p.invulnerableMs > 0 || this.status !== 'playing') return;
      p.health--; p.invulnerableMs = 900; s.flashMs = 180;
      s.message = 'SIGNAL HIT — JUMP OR CLEAR THE DEFENSE'; s.messageMs = 1000;
      window.audioSystem?.playSound?.('hit');
      if (p.health <= 0) { this.status = s.status = 'failed'; p.vx = 0; }
    },
    phrase(delta) {
      const s = this.state;
      const sample = B.MusicTransport?.sample?.(window.audioSystem?.context?.currentTime);
      const grid = !this.audioDegraded && sample?.profileId === PROFILE && sample.running ? sample.grid : null;
      if (grid) {
        const phrase = Math.floor(grid.beatIndex / 16);
        s.warning = grid.beatIndex % 16 >= 14 && this.volleyTarget() >= 0;
        if (s.lastPhrase !== null && phrase > s.lastPhrase && this.volleyTarget() >= 0) this.volley();
        s.lastPhrase = phrase;
      } else {
        s.fallbackMs += delta;
        s.warning = s.fallbackMs >= PHRASE_MS - 1200 && this.volleyTarget() >= 0;
        if (s.fallbackMs >= PHRASE_MS) {
          s.fallbackMs %= PHRASE_MS;
          if (this.volleyTarget() >= 0) this.volley();
        }
      }
    },
    volley() {
      const s = this.state, index = this.volleyTarget();
      if (index < 0) return;
      const x = RELAYS[index].x - 40;
      for (const y of [FLOOR - 53, FLOOR - 100]) s.hostileShots.push({ x, y, vx: -590, vy: 0, life: 2100, volley: true });
      s.message = 'PHRASE VOLLEY — JUMP ABOVE BOTH LANES'; s.messageMs = 1200;
    },
    update(delta) {
      if (!this.active || this.exiting || this.status !== 'playing') return;
      const s = this.state, p = s.player, dt = clamp(delta, 0, 100) / 1000;
      s.elapsedMs += delta;
      s.fireCooldownMs = Math.max(0, s.fireCooldownMs - delta);
      s.flashMs = Math.max(0, s.flashMs - delta); s.messageMs = Math.max(0, s.messageMs - delta);
      p.invulnerableMs = Math.max(0, p.invulnerableMs - delta);
      const previousBottom = p.y + PLAYER_H;
      p.x = clamp(p.x + p.vx * dt, 0, WIDTH - PLAYER_W);
      for (let i = 0; i < RELAYS.length; i++) if (s.relays[i] > 0 && p.x + PLAYER_W > RELAYS[i].x - 50 && p.x < RELAYS[i].x + 46)
        p.x = RELAYS[i].x - 50 - PLAYER_W;
      p.vy = Math.min(1100, p.vy + 1850 * dt); p.y += p.vy * dt;
      p.grounded = false;
      for (const platform of PLATFORMS) {
        if (p.vy >= 0 && previousBottom <= platform.y + 9 && p.y + PLAYER_H >= platform.y &&
            p.x + PLAYER_W > platform.x && p.x < platform.x + platform.w) {
          p.y = platform.y - PLAYER_H; p.vy = 0; p.grounded = true;
        }
      }
      if (p.y + PLAYER_H >= FLOOR) { p.y = FLOOR - PLAYER_H; p.vy = 0; p.grounded = true; }
      for (const enemy of s.enemies) {
        if (enemy.health <= 0) continue;
        enemy.x += enemy.direction * 55 * dt;
        if (enemy.x < enemy.min || enemy.x > enemy.max) { enemy.x = clamp(enemy.x, enemy.min, enemy.max); enemy.direction *= -1; }
        const distance = Math.abs(enemy.x - p.x);
        if (enemy.warningMs > 0) {
          enemy.warningMs -= delta;
          if (enemy.warningMs <= 0) {
            const direction = Math.sign(p.x - enemy.x) || -1;
            s.hostileShots.push({ x: enemy.x + 20, y: enemy.y + 30, vx: direction * 465,
              vy: clamp((p.y + 34 - enemy.y - 30) / Math.max(0.5, distance / 465), -260, 260), life: 1500 });
            enemy.cooldownMs = 2100;
          }
        } else {
          enemy.cooldownMs -= delta;
          if (enemy.cooldownMs <= 0 && distance < 640) enemy.warningMs = 650;
        }
        if (rectHit({ x: enemy.x, y: enemy.y, w: 42, h: 64 }, { x: p.x, y: p.y, w: PLAYER_W, h: PLAYER_H })) this.hitPlayer();
      }
      for (const shot of s.shots) {
        shot.x += shot.vx * dt; shot.life -= delta;
        for (let i = 0; i < RELAYS.length; i++) {
          const r = RELAYS[i];
          if (s.relays[i] > 0 && rectHit({ x: shot.x, y: shot.y, w: 18, h: 8 }, { x: r.x - 28, y: 500, w: 65, h: FLOOR - 500 })) {
            shot.life = 0; s.relays[i]--;
            s.message = s.relays[i] ? `RELAY ${i + 1} / ${s.relays[i]} HITS REMAIN` : `RELAY ${i + 1} DISABLED`;
            s.messageMs = 1100;
            if (s.relays[i] === 0) this.checkpoint(i === 0 ? 'proof-relay' : 'proof-relay-2');
            break;
          }
        }
        if (shot.life <= 0) continue;
        for (const enemy of s.enemies) if (enemy.health > 0 && rectHit({ x: shot.x, y: shot.y, w: 18, h: 8 }, { x: enemy.x, y: enemy.y, w: 42, h: 64 })) {
          enemy.health--; shot.life = 0;
          if (enemy.health === 0) { s.kills++; s.message = 'DEFENSE CLEARED'; s.messageMs = 850; }
          break;
        }
      }
      s.shots = s.shots.filter(shot => shot.life > 0 && shot.x >= 0 && shot.x <= WIDTH);
      for (const shot of s.hostileShots) {
        shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= delta;
        if (shot.life > 0 && rectHit({ x: shot.x, y: shot.y, w: 21, h: 13 }, { x: p.x, y: p.y, w: PLAYER_W, h: PLAYER_H })) {
          shot.life = 0; this.hitPlayer();
        }
      }
      s.hostileShots = s.hostileShots.filter(shot => shot.life > 0 && shot.x >= 0 && shot.x <= WIDTH && shot.y > 0 && shot.y < FLOOR);
      this.phrase(delta);
      s.cameraX += (clamp(p.x - 650, 0, WIDTH - 1920) - s.cameraX) * Math.min(1, dt * 6);
      if (p.x >= WIDTH - 130 && s.relays.every(hp => hp === 0)) {
        this.status = s.status = 'clear'; p.vx = 0;
        this.checkpoint('proof-clear');
      }
    },
    draw(ctx) {
      if (!ctx || !this.active) return;
      const s = this.state, p = s.player, camera = s.cameraX;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
      sky.addColorStop(0, '#0b1225'); sky.addColorStop(0.6, '#172036'); sky.addColorStop(1, '#352447');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 1920, 1080);
      for (let i = 0; i < 18; i++) {
        const x = i * 175 - (camera * 0.28 % 175), height = 290 + (i * 73 % 230);
        ctx.fillStyle = i % 3 ? '#142237' : '#1a2940'; ctx.fillRect(x, FLOOR - height, 145, height);
        ctx.fillStyle = '#507c86';
        for (let y = FLOOR - height + 30; y < FLOOR - 24; y += 48) for (let j = 0; j < 3; j++) if ((i + j + y) % 4)
          ctx.fillRect(x + 17 + j * 38, y, 14, 18);
      }
      ctx.translate(-camera, 0);
      for (let i = 0; i < 13; i++) {
        const x = i * 400;
        ctx.fillStyle = '#253042'; ctx.fillRect(x, FLOOR - 335 - (i % 3) * 55, 310, 335 + (i % 3) * 55);
        ctx.fillStyle = '#36536b'; ctx.fillRect(x + 18, FLOOR - 292 - (i % 3) * 55, 270, 5);
        ctx.fillStyle = '#142435';
        for (let y = FLOOR - 250 - (i % 3) * 55; y < FLOOR - 25; y += 60) for (let j = 0; j < 3; j++)
          ctx.fillRect(x + 40 + j * 74, y, 35, 36);
      }
      ctx.fillStyle = '#17212d'; ctx.fillRect(0, FLOOR, WIDTH, 282);
      ctx.fillStyle = '#6b536e'; ctx.fillRect(0, FLOOR, WIDTH, 7);
      ctx.fillStyle = '#496a72';
      for (let x = 0; x < WIDTH; x += 180) ctx.fillRect(x + 30, FLOOR + 85, 90, 4);
      for (const platform of PLATFORMS) {
        ctx.fillStyle = '#1d3745'; ctx.fillRect(platform.x, platform.y, platform.w, 22);
        ctx.fillStyle = '#92ffdc'; ctx.fillRect(platform.x, platform.y, platform.w, 4);
        ctx.fillStyle = '#3c5064'; ctx.fillRect(platform.x + 18, platform.y + 22, 10, FLOOR - platform.y - 22);
        ctx.fillRect(platform.x + platform.w - 28, platform.y + 22, 10, FLOOR - platform.y - 22);
      }
      RELAYS.forEach((relay, i) => {
        const alive = s.relays[i] > 0;
        ctx.fillStyle = alive ? '#142a36' : '#203442'; ctx.fillRect(relay.x - 28, 500, 65, FLOOR - 500);
        ctx.fillStyle = alive ? '#ff7399' : '#83a6a4'; ctx.fillRect(relay.x - 28, 500, 65, 10);
        ctx.fillRect(relay.x - 7, 555, 23, 160);
        ctx.fillStyle = '#d4f3ec'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
        ctx.fillText(alive ? `${s.relays[i]} / ${relay.hp}` : 'OFF', relay.x + 4, 485);
        if (alive && s.warning && i === this.volleyTarget()) {
          ctx.fillStyle = 'rgba(255,100,137,0.18)'; ctx.fillRect(relay.x - 1280, FLOOR - 140, 1250, 108);
          ctx.strokeStyle = '#ff8aaa'; ctx.lineWidth = 3;
          for (const y of [FLOOR - 100, FLOOR - 53]) { ctx.beginPath(); ctx.moveTo(relay.x - 1280, y); ctx.lineTo(relay.x - 32, y); ctx.stroke(); }
        }
      });
      ctx.fillStyle = '#91ffdd'; ctx.fillRect(WIDTH - 110, FLOOR - 170, 13, 170);
      ctx.fillStyle = '#d7f9f4'; ctx.font = 'bold 20px monospace'; ctx.fillText('UPLINK', WIDTH - 105, FLOOR - 184);
      for (const enemy of s.enemies) if (enemy.health > 0) {
        ctx.fillStyle = enemy.warningMs > 0 ? '#ff9d9e' : '#b08bdd'; ctx.fillRect(enemy.x, enemy.y + 12, 42, 48);
        ctx.fillStyle = '#101727'; ctx.fillRect(enemy.x + 5, enemy.y, 33, 24);
        ctx.fillStyle = enemy.warningMs > 0 ? '#fff0d6' : '#9affdf'; ctx.fillRect(enemy.x + 9, enemy.y + 21, 24, 7);
        if (enemy.warningMs > 0) { ctx.strokeStyle = '#ff8098'; ctx.lineWidth = 3; ctx.strokeRect(enemy.x - 9, enemy.y - 9, 60, 83); }
      }
      ctx.fillStyle = '#b4ffdb'; for (const shot of s.shots) ctx.fillRect(shot.x, shot.y, 20, 7);
      for (const shot of s.hostileShots) {
        ctx.fillStyle = shot.volley ? '#ff789d' : '#f5ad8d'; ctx.fillRect(shot.x, shot.y, 21, 13);
      }
      if (p.invulnerableMs <= 0 || Math.floor(p.invulnerableMs / 75) % 2 === 0) {
        ctx.fillStyle = '#131925'; ctx.fillRect(p.x + 4, p.y + 25, 36, 51);
        ctx.fillStyle = '#e8ecf3'; ctx.fillRect(p.x + 8, p.y + 20, 28, 24);
        ctx.fillStyle = '#080c16'; ctx.fillRect(p.x + 3, p.y + 12, 41, 13);
        ctx.fillStyle = '#9affd7'; ctx.fillRect(p.x + (p.facing > 0 ? 25 : 11), p.y + 31, 8, 5);
        ctx.fillStyle = '#7249a5'; ctx.fillRect(p.x + (p.facing > 0 ? 32 : -20), p.y + 36, 27, 11);
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = 'rgba(4,13,24,0.94)'; ctx.fillRect(0, 0, 1920, 142);
      ctx.fillStyle = '#97ffdc'; ctx.font = 'bold 28px Oxanium, monospace'; ctx.textAlign = 'left';
      ctx.fillText('BROADCAST SLUM / RUN-AND-GUN PROOF', 48, 48);
      ctx.font = '21px Oxanium, monospace'; ctx.fillStyle = '#d3def0';
      ctx.fillText('Destroy both blockade relays. Reach the uplink.', 48, 87);
      ctx.fillStyle = '#c6addf'; ctx.fillText('DEVELOPMENT PREVIEW / Story order: The Cache Line comes first', 48, 122);
      if (this.audioDegraded) {
        ctx.fillStyle = '#ffbd83'; ctx.textAlign = 'center'; ctx.font = '20px Oxanium, monospace';
        ctx.fillText('AUDIO FALLBACK / CHECK LOCAL PROTOTYPE STEMS IN THIS HOST', 960, 165);
      }
      ctx.textAlign = 'right'; ctx.fillStyle = '#ff9db3'; ctx.fillText('SIGNAL', 1735, 48);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i < p.health ? '#ff8aab' : '#40364c'; ctx.fillRect(1762 + i * 27, 30, 19, 25);
        ctx.strokeStyle = '#ba7899'; ctx.lineWidth = 1; ctx.strokeRect(1762 + i * 27, 30, 19, 25);
      }
      ctx.fillStyle = '#a7ffdd'; ctx.fillText(`RELAYS  ${s.relays.filter(hp => hp === 0).length} / 2`, 1865, 87);
      ctx.font = '19px Oxanium, monospace'; ctx.fillStyle = '#c3c9df';
      ctx.fillText(`${Math.floor(s.elapsedMs / 60000)}:${String(Math.floor(s.elapsedMs / 1000) % 60).padStart(2, '0')}  /  KILLS ${s.kills}`, 1865, 121);
      if (s.warning && this.status === 'playing') {
        ctx.fillStyle = '#ff9db3'; ctx.font = 'bold 27px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText('PHRASE VOLLEY INCOMING — JUMP ABOVE BOTH LANES', 960, 203);
      } else if (s.messageMs > 0) {
        ctx.fillStyle = '#a9ffe4'; ctx.font = 'bold 25px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText(s.message, 960, 203);
      }
      ctx.fillStyle = 'rgba(4,13,24,0.88)'; ctx.fillRect(0, 1014, 1920, 66);
      ctx.fillStyle = '#cbd9e7'; ctx.font = '20px Oxanium, monospace'; ctx.textAlign = 'center';
      ctx.fillText(B.GamepadUI?.connected ? 'STICK / D-PAD MOVE     CROSS / A JUMP     R1 / RB FIRE     START PAUSE' : 'A / D MOVE     SPACE JUMP     HOLD E FIRE     P PAUSE', 960, 1055);
      if (s.flashMs) { ctx.fillStyle = `rgba(255,92,126,${s.flashMs / 900})`; ctx.fillRect(0, 0, 1920, 1080); }
      if (this.status !== 'playing') {
        ctx.fillStyle = 'rgba(3,11,21,0.9)'; ctx.fillRect(0, 0, 1920, 1080);
        ctx.strokeStyle = this.status === 'clear' ? '#91ffdd' : '#ff8ea8'; ctx.lineWidth = 4; ctx.strokeRect(340, 250, 1240, 550);
        ctx.textAlign = 'center'; ctx.fillStyle = this.status === 'clear' ? '#91ffdd' : '#ff8ea8'; ctx.font = 'bold 52px Oxanium, monospace';
        ctx.fillText(this.status === 'clear' ? 'BLOCKADE PROOF CLEARED' : 'SIGNAL LOST', 960, 378);
        ctx.fillStyle = '#e9eaf2'; ctx.font = '26px Oxanium, monospace';
        ctx.fillText(this.status === 'clear' ? 'The real story route reaches this sector after The Cache Line.' : 'Your saved checkpoint is ready.', 960, 475);
        ctx.fillText('Preview progress awards no campaign key or Level 3 clear.', 960, 531);
        ctx.fillStyle = '#a9ffe4'; ctx.fillText(B.GamepadUI?.connected ? 'CROSS / A — REPLAY     TRIANGLE / Y — RETURN TO HANDOFF' : 'ENTER — REPLAY     C — RETURN TO HANDOFF', 960, 661);
        ctx.fillText('P / START — PAUSE AND SETTINGS', 960, 713);
      }
      ctx.restore();
    }
  };
  B.Campaign.register(ID, { validate: saved => proof.validate(saved), restore: saved => proof.restore(saved) });
  B.Campaign.syncTitleButton();
})(window.BARCODE = window.BARCODE || {});
