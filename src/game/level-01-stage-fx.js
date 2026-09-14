// Level 1 scenery and optional inspections. Updated by the existing frame owner.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/level-01-stage-fx.js', exports: ['BARCODE.Level01StageFX'], dependencies: ['BARCODE.LoreCollection', 'BARCODE.CombatFX'] });
(function() {
  const B = window.BARCODE = window.BARCODE || {}, TAU = Math.PI * 2;
  const DETAILS = Object.freeze([
    { id: 'egg.l01.studio-rat', x: 1680, y: 330, name: 'STUDIO RAT', speaker: 'CACHE BACK',
      lines: ['That cat just stole a bolt from the rooftop relay.', 'Studio Rats. Four paws, no respect for production equipment.'] },
    { id: 'egg.l01.cliff-maintenance', x: 865, y: 492, name: 'MAINTENANCE PLATE', speaker: 'CLIFF',
      lines: ['Two clean beats. That is all the lift needs.', 'I fixed the wiring. You still have to do the climbing.'] },
    { id: 'egg.l01.witty-route', x: 2475, y: 358, name: 'ROUTE MARK', speaker: 'WittyF0x',
      lines: ['See that glow above the relay roof? Signal Amp.', 'The high route has its own rewards. Look before you drop.'] },
    { id: 'egg.l01.venue-flyer', x: 1840, y: 822, name: 'VENUE FLYER', speaker: 'DJ FLOPPYDISC',
      lines: ['BARCODE. Doors open when the signal comes back.', 'Keep the flyer. A room can go quiet without being finished.'] }
  ]);
  const COLORS = ['#8cffe0', '#c1b0ff', '#ffc07b', '#ff99e7'];
  class Level01StageFX {
    constructor() { this.reset(window.sector1Progression || null); }
    reset(owner = null, { resume = false } = {}) {
      this.owner = owner; this.timeMs = 0; this.reactions = []; this.events = [];
      this.seenEntrances = new WeakSet(); this.arrived = new WeakSet(); this.clears = new Set();
      this.activeEncounter = null; this.message = null; this.nearby = null; this.captionKick = 0;
      this.ratAge = null; this.lastBossState = ''; this.lastStepX = null;
      if (resume) {
        owner?.getDistrictSignalState?.().zones.forEach(z => { if (z.cleared) this.clears.add(z.id); });
        this.activeEncounter = owner?.activeEncounterId || null;
        this.lastBossState = owner?.state || '';
        for (const e of window.enemyManager?.enemies || []) { this.seenEntrances.add(e); if (e.entranceComplete) this.arrived.add(e); }
      }
    }
    archive() { return window.lostDataSystem?.archive || this.fallbackArchive || null; }
    event(kind, x, options = {}) {
      if (!Number.isFinite(x)) return;
      if (this.events.length >= 16) this.events.shift();
      this.events.push({ kind, x, y: 822, age: 0, duration: 1100, seed: B.combatFX?.nextSeed?.() || 1, ...options });
    }
    react(x, strength = 1, kind = 'hit') {
      if (!Number.isFinite(x)) return;
      if (this.reactions.length >= 12) this.reactions.shift();
      this.reactions.push({ x, strength: Math.max(0, Math.min(1, strength)), age: 0 });
      if (kind === 'stomp') this.captionKick = 1;
    }
    energyAt(x) {
      return Math.min(1, this.reactions.reduce((sum, r) => sum + r.strength * Math.max(0, 1 - Math.abs(x - r.x) / 750) * Math.max(0, 1 - r.age / 1000), 0));
    }
    canInspect() {
      const o = this.owner, gs = window.gameState;
      if (!o?.missionStarted || window.tutorialSystem?.isActive?.() || window.isPaused || gs?.paused || !gs?.running ||
        window.hackingSystem?.isActive?.() || o.isGameplaySuppressed?.() || !window.player?.grounded ||
        /jammer|boss|complete/.test(o.state || '')) return false;
      return !o.getEncounterStatus?.()?.started;
    }
    findNearby() {
      if (!this.canInspect()) return null;
      const p = window.player;
      const catId = DETAILS[0].id;
      return DETAILS.find(d => (d.id !== catId || !this.archive()?.hasEgg?.(catId) || this.message?.id === catId) &&
        Math.abs(d.x - p.position.x) < 95 && Math.abs(d.y - (p.position.y + 72)) < 70) || null;
    }
    inspect() {
      const detail = this.findNearby();
      if (!detail) return { ok: false, reason: 'no-detail' };
      if (this.message?.id === detail.id && this.message.line === 0) { this.message.line = 1; this.message.age = 0; return { ok: true, reason: 'crew-response' }; }
      if (this.message?.id === detail.id) { this.message = null; return { ok: true, reason: 'closed' }; }
      const fresh = this.archive()?.collectEgg?.(detail.id) || false;
      this.message = { ...detail, line: 0, age: 0, duration: 7200 };
      if (detail.id === DETAILS[0].id && fresh) this.ratAge = 0;
      window.audioSystem?.playCombatCue?.('inspect');
      return { ok: true, reason: fresh ? 'discovered' : 'revisit', id: detail.id };
    }
    update(ms) {
      if (!Number.isFinite(ms) || ms < 0 || window.isPaused || window.gameState?.paused) return;
      const owner = window.sector1Progression;
      if (owner !== this.owner) this.reset(owner);
      if (!this.archive() && B.LoreCollection) this.fallbackArchive = new B.LoreCollection();
      this.timeMs += ms;
      this.reactions.forEach(r => r.age += ms); this.reactions = this.reactions.filter(r => r.age < 1000);
      this.events.forEach(e => e.age += ms); this.events = this.events.filter(e => e.age < e.duration);
      this.captionKick = Math.max(0, this.captionKick - ms / 1700);
      if (this.ratAge !== null) { this.ratAge += ms; if (this.ratAge > 3600) this.ratAge = null; }
      if (this.message) { this.message.age += ms; if (this.message.age >= this.message.duration || !this.canInspect() || Math.abs(window.player.position.x - this.message.x) > 200) this.message = null; }
      this.nearby = this.findNearby();
      if (!owner?.missionStarted) return;
      if (owner.activeEncounterId && owner.activeEncounterId !== this.activeEncounter) {
        this.activeEncounter = owner.activeEncounterId;
        this.event('encounter', window.player.position.x, { zone: Number(this.activeEncounter.slice(-1)) - 1, duration: 1600 });
      }
      const district = owner.getDistrictSignalState?.();
      district?.zones.forEach((zone, i) => {
        if (zone.cleared && !this.clears.has(zone.id)) {
          this.clears.add(zone.id); this.event('clear', window.player.position.x, { zone: i, duration: 1000 });
          window.audioSystem?.playCombatCue?.('restore');
        }
      });
      for (const e of window.enemyManager?.enemies || []) {
        if (!e.active || !e._sector1MissionEnemy) continue;
        if (!this.seenEntrances.has(e)) {
          this.seenEntrances.add(e);
          const zone = Number(e._sector1EncounterId?.slice(-1)) - 1;
          this.event('arrival', e._entranceTarget?.x ?? e.position.x, { zone, y: e._entranceTarget?.y ?? e.position.y, duration: 950 });
        }
        if (e.entranceComplete && !this.arrived.has(e)) {
          this.arrived.add(e);
          if (e.type === 'firewall') {
            B.combatFX?.contact('firewall', e.position.x, 812, e.facing, false, false);
            if (B.combatFX?.visible(e.position.x, 812)) window.renderer?.impact?.('land', { strength: 0.8 });
          }
        }
      }
      const boss = owner.boss;
      if (owner.state !== this.lastBossState) {
        if (owner.state === 'boss_flourish') { this.event('boss', boss.x, { duration: 900 }); window.renderer?.impact?.('boss'); }
        this.lastBossState = owner.state;
      }
      if (owner.state === 'boss_walk_in' && boss && (this.lastStepX === null || Math.abs(boss.x - this.lastStepX) > 150)) {
        this.lastStepX = boss.x; B.combatFX?.contact('firewall', boss.x, 822, -1, false);
        window.renderer?.impact?.('land', { strength: 0.6 });
      }
    }
    drawArchitecture(ctx, music, district) {
      // Source-image coordinates, called inside the foreground's transform.
      // No second texture or canvas allocation; screens remain inside their glass.
      const sourceX = x => -152 + x * 4400 / 1279;
      const phase = music.beatFloat || 0, phrase = Math.floor(phase / 4) % 4;
      ctx.save();
      for (const [x, y] of [[390, 214], [785, 201]]) {
          const kick = this.energyAt(sourceX(x));
        const swing = Math.sin(this.timeMs / 110) * kick * 9;
        ctx.strokeStyle = '#182738'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 30, y - 22); ctx.quadraticCurveTo(x + swing, y + 32, x + 65, y - 16); ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const t = ((phase * 0.4 + i / 8) % 1 + 1) % 1;
          const px = (1 - t) ** 2 * (x - 30) + 2 * (1 - t) * t * (x + swing) + t * t * (x + 65);
          const py = (1 - t) ** 2 * (y - 22) + 2 * (1 - t) * t * (y + 32) + t * t * (y - 16);
          ctx.globalAlpha = (0.15 + music.energy * 0.5 + kick * 0.3) * music.quiet;
          ctx.fillStyle = phrase === 3 ? '#edb5ff' : '#9bffe8'; ctx.fillRect(px, py, 2.5, 1.5);
        }
      }
      for (const [x, y] of [[218, 440], [508, 440], [851, 440]]) {
        const kick = this.energyAt(sourceX(x));
        if (kick < 0.01) continue;
        for (let i = 0; i < 4; i++) {
          const t = Math.min(1, (1 - kick) + i * 0.1);
          ctx.globalAlpha = kick * 0.25; ctx.fillStyle = '#b8d2e1';
          ctx.beginPath(); ctx.ellipse(x + Math.sin(i * 3) * 6, y - t * 36, 5 + t * 12, 4 + t * 9, 0, 0, TAU); ctx.fill();
        }
      }
      const rattle = this.energyAt(sourceX(346));
      ctx.save(); ctx.globalAlpha = 1; ctx.translate(346, 294); ctx.rotate(Math.sin(this.timeMs / 60) * rattle * 0.065);
      ctx.strokeStyle = '#788792'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 13); ctx.moveTo(24, 0); ctx.lineTo(24, 13); ctx.stroke();
      ctx.fillStyle = '#101d29'; ctx.fillRect(-3, 13, 30, 13); ctx.strokeStyle = '#a6f5db'; ctx.strokeRect(-3, 13, 30, 13);
      ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#a6f5db'; ctx.fillText('ON AIR', 12, 22); ctx.restore();
      // Phrase accent is a pavement reflection, kept beneath warning shapes.
      if (music.performing && music.combo > 0) {
        ctx.globalAlpha = Math.min(0.2, music.energy * 0.12) * music.quiet;
        ctx.fillStyle = phrase === 3 ? '#e19dff' : '#77ffe1';
        for (let x = 50; x < 1279; x += 85) ctx.fillRect(x, 414, 48 + phrase * 7, 3 + music.combo * 8);
      }
      ctx.restore();
    }
    drawRat(ctx, x, y, scale = 1) {
      const moving = this.ratAge !== null;
      const frame = moving ? Math.floor(this.ratAge / 110) % 4 : 0;
      if (B.PresentationAssets?.draw('studioCat', ctx, { x, y, width: 116 * scale, frame })) return;
      ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
      ctx.strokeStyle = '#b5bfd3'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-12, -5); ctx.quadraticCurveTo(-45, -54, -29, -47); ctx.stroke();
      ctx.fillStyle = '#262d40'; ctx.strokeStyle = '#adb9cc'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, -9, 21, 12, -0.1, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(9, -15); ctx.lineTo(10, -34); ctx.lineTo(20, -25); ctx.lineTo(30, -33); ctx.lineTo(33, -10); ctx.lineTo(18, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#a4ffe8'; ctx.fillRect(22, -12, 3, 3); ctx.fillRect(-10, 1, 9, 3); ctx.fillRect(8, 1, 9, 3);
      ctx.restore();
    }
    drawTrafficLighting(ctx, { foreground = false } = {}) {
      if (!ctx || !this.owner?.missionStarted) return;
      const ships = (window.spaceShipSystem?.ships || []).filter(ship => !!ship.isForeground === !!foreground).slice(0, 3);
      ctx.save();
      ctx.fillStyle = '#b6e9fa';
      ctx.globalAlpha = foreground ? 0.1 : 0.045;
      for (const ship of ships) {
        const direction = ship.direction || 1;
        ctx.beginPath();
        ctx.moveTo(ship.x, ship.y + 60);
        ctx.lineTo(ship.x + 320 * direction, 824);
        ctx.lineTo(ship.x + 520 * direction, 824);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    drawWorld(ctx) {
      if (!this.owner?.missionStarted) return;
      ctx.save();
      for (const d of DETAILS) {
        if (!B.combatFX?.visible(d.x, d.y, 120)) continue;
        const found = this.archive()?.hasEgg?.(d.id);
        if (d === DETAILS[0]) {
          if (this.ratAge !== null) {
            const t = Math.min(1, this.ratAge / 3600);
            const x = d.x + t * 430;
            const y = d.y - Math.sin(t * Math.PI) * 54;
            ctx.save();
            ctx.globalAlpha = Math.sin(t * Math.PI);
            ctx.strokeStyle = '#eee6d4';
            ctx.lineWidth = 3;
            for (let i = 0; i < 4; i++) {
              ctx.beginPath();
              ctx.moveTo(x - 42 - i * 22, y - 18 + i * 9);
              ctx.lineTo(x - 88 - i * 32, y - 18 + i * 9);
              ctx.stroke();
            }
            ctx.restore();
            this.drawRat(ctx, x, y, 1.12);
          } else if (!found) this.drawRat(ctx, d.x, d.y);
        }
        else {
          ctx.save(); ctx.translate(d.x, d.y - 26); ctx.rotate(d === DETAILS[3] ? -0.1 : 0);
          ctx.fillStyle = d === DETAILS[3] ? '#efe5cd' : '#142936'; ctx.strokeStyle = '#a6dfd6'; ctx.lineWidth = 2;
          ctx.fillRect(-22, -23, 44, 43); ctx.strokeRect(-22, -23, 44, 43);
          ctx.fillStyle = d === DETAILS[3] ? '#182735' : '#a6ffe3'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
          ctx.fillText(d === DETAILS[1] ? '2 BEATS' : d === DETAILS[2] ? '↗ AMP' : 'BARCODE', 0, -7);
          for (let i = 0; i < 7; i++) ctx.fillRect(-16 + i * 5, 1, i % 3 ? 2 : 3, 10);
          ctx.restore();
        }
        if (!found) { ctx.strokeStyle = '#fff3c8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(d.x, d.y - 67, 4, 0, TAU); ctx.stroke(); }
      }
      for (const e of this.events) {
        const t = e.age / e.duration, fade = Math.sin(t * Math.PI);
        ctx.save(); ctx.globalAlpha = fade * 0.7; ctx.strokeStyle = COLORS[e.zone] || '#a9ffeb'; ctx.fillStyle = ctx.strokeStyle;
        if (e.kind === 'arrival') {
          if (e.zone === 1) {
            ctx.fillStyle = '#080a14'; ctx.globalAlpha = fade * 0.3; ctx.fillRect(e.x - 200 + t * 400, 784, 260, 38);
            ctx.strokeStyle = '#c1b0ff'; ctx.lineWidth = 3;
            for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(e.x - 36 + i * 18, 350 + t * 220); ctx.lineTo(e.x - 36 + i * 18, 390 + t * 220); ctx.stroke(); }
          } else if (e.zone === 2) {
            for (let i = 0; i < 12; i++) ctx.fillRect(e.x + (i - 6) * 18 * t, 812 - Math.sin(t * Math.PI) * (20 + i % 3 * 18), 10, 5);
          } else {
            for (let i = 0; i < 10; i++) ctx.fillRect(e.x - 70 + i * 16, 810 - t * (80 + i % 3 * 22), 5, 18 * (1 - t));
          }
        } else if (['clear', 'destruction', 'boss', 'victory'].includes(e.kind)) {
          ctx.lineWidth = e.kind === 'clear' ? 4 : 8;
          const spread = 30 + t * (e.kind === 'destruction' ? 720 : 450);
          for (let side = -1; side <= 1; side += 2) {
            ctx.beginPath(); ctx.moveTo(e.x + side * spread * 0.25, 820);
            for (let i = 1; i <= 9; i++) {
              const jitter = B.combatFX?.sample(e.seed, i + (side + 1) * 10) ?? 0.5;
              ctx.lineTo(e.x + side * spread * (0.25 + i / 12), 820 - Math.sin(i / 10 * Math.PI) * (10 + jitter * 45) * (1 - t));
            }
            ctx.stroke();
          }
          for (let i = 0; i < 20; i++) {
            const a = (B.combatFX?.sample(e.seed, i + 30) ?? i / 20) * TAU;
            const r = t * (150 + (B.combatFX?.sample(e.seed, i + 60) ?? 0.5) * 270);
            ctx.fillRect(e.x + Math.cos(a) * r, 745 + Math.sin(a) * r * 0.5 - t * 70, i % 3 ? 6 : 14, 4);
          }
        }
        ctx.restore();
      }
      const jammer = B.JammerEnvironment?.getStatus?.();
      if (jammer?.revealed && !jammer.destroyed && jammer.stage?.index > 0) {
        const x = jammer.position.x, y = jammer.position.y - 90, strain = jammer.stage.index / 3;
        ctx.strokeStyle = '#ecabff'; ctx.lineWidth = 3; ctx.globalAlpha = 0.3 + strain * 0.3;
        for (let side = -1; side <= 1; side += 2) {
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let i = 1; i <= 7; i++) ctx.lineTo(x + side * i * 16, y + Math.sin(i * 3 + this.timeMs / 190) * 15 * strain);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    drawHUD(ctx) {
      if (!this.owner?.missionStarted || window.gameState?.gameOver || window.gameState?.victory || window.hackingSystem?.isActive?.()) return;
      ctx.save();
      const clear = this.events.find(e => e.kind === 'clear');
      if (clear) {
        ctx.globalAlpha = Math.sin(clear.age / clear.duration * Math.PI) * 0.7; ctx.strokeStyle = '#eee7d5'; ctx.lineWidth = 6;
        for (const [x, y, sx, sy] of [[22, 22, 1, 1], [1898, 22, -1, 1], [22, 1034, 1, -1], [1898, 1034, -1, -1]]) {
          ctx.beginPath(); ctx.moveTo(x, y + 55 * sy); ctx.lineTo(x, y); ctx.lineTo(x + 140 * sx, y); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      const key = B.GamepadUI?.connected ? 'LB' : (window.inputManager?.actionInput?.keyboardBindings?.inspect?.[0] || 'E').toUpperCase();
      if (this.message) {
        const m = this.message;
        ctx.fillStyle = '#070b15'; ctx.fillRect(39, 895, 890, 116); ctx.fillStyle = '#eee6d4'; ctx.fillRect(30, 887, 890, 116);
        ctx.fillStyle = '#0c1727'; ctx.font = 'bold 16px monospace'; ctx.fillText(m.speaker, 52, 908);
        ctx.font = 'bold 20px sans-serif'; ctx.fillText(m.lines[m.line], 52, 944, 840);
        ctx.font = '13px monospace'; ctx.fillText(`${key}: ${m.line ? 'CLOSE' : 'CREW RESPONSE'}    /    KEEP MOVING TO CONTINUE`, 52, 979);
      } else if (this.nearby) {
        ctx.fillStyle = '#eee6d4'; ctx.fillRect(30, 947, 500, 49); ctx.fillStyle = '#121c2b'; ctx.font = 'bold 18px monospace';
        ctx.fillText(`${key} / INSPECT ${this.nearby.name}`, 48, 972);
      }
      ctx.restore();
    }
  }
  Level01StageFX.DETAILS = DETAILS;
  B.Level01StageFX = Level01StageFX;
  B.stageFX = new Level01StageFX();
})();
