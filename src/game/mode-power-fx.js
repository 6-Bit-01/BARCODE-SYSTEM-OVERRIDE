// Presentation for the existing hack/rhythm owners. No input, damage, timer,
// music transport or sprite-loop ownership lives here.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/mode-power-fx.js', exports: ['BARCODE.ModePowerFX'], dependencies: ['BARCODE.MusicTransport'] });
(function() {
  const B = window.BARCODE = window.BARCODE || {}, TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
  const sounds = Object.freeze({
    'time-enter': { seconds: .64, from: 640, to: 52, air: .12 },
    'time-return': { seconds: .46, from: 90, to: 740, air: .08 },
    deflect: { seconds: .32, from: 1460, to: 240, air: .16 },
    'rhythm-surge': { seconds: .52, from: 65, to: 220, air: .06 },
    'rhythm-impact': { seconds: .27, from: 150, to: 45, air: .09 }
  });
  class ModePowerFX {
    constructor() { this.buffers = new Map(); this.reset(); }
    reset() {
      for (const voice of this.voices || []) voice.dispose();
      this.voices = new Set(); this.events = []; this.timeMs = 0; this.worldTimeMs = 0;
      this.guardMs = 0; this.kick = 0; this.rhythmAgeMs = 0; this.cueTimes = {};
    }
    reduced() { return !!B.Preferences?.values?.reducedMotion; }
    flashes() { return !B.Preferences?.values?.reducedFlashes && window.BARCODE_RENDER_QUALITY?.flashes !== false; }
    hacking() { return !!window.hackingSystem?.isActive?.(); }
    rhythm() { return !this.hacking() && !!window.rhythmSystem?.isActive?.(); }
    update(ms) {
      if (!Number.isFinite(ms) || ms < 0 || window.isPaused || window.gameState?.paused) return;
      this.timeMs += ms;
      this.worldTimeMs += ms * (B.TacticalFocusClock?.getScale?.() ?? 1);
      this.guardMs = Math.max(0, this.guardMs - ms);
      this.kick = Math.max(0, this.kick - ms / 420);
      this.rhythmAgeMs = this.rhythm() ? this.rhythmAgeMs + ms : 0;
      let n = 0;
      for (const e of this.events) { e.age += ms; if (e.age < e.duration) this.events[n++] = e; }
      this.events.length = n;
    }
    event(kind, options = {}) {
      const p = window.player?.position;
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
      if (this.events.length >= 24) this.events.shift();
      this.events.push({ kind, x: p.x, y: p.y, age: 0, duration: 600, ...options });
    }
    hackStarted() {
      this.guardMs = 0; this.kick = 1;
      this.event('collapse', { duration: 620 }); this.playCue('time-enter');
    }
    hackEnded(outcome) {
      this.guardMs = 0;
      this.event('release', { duration: 440, success: outcome === 'success' });
      this.playCue('time-return');
    }
    deflect() {
      this.guardMs = 330; this.kick = 1;
      this.event('deflect', { duration: 480, direction: window.player?.facing || 1 });
      this.playCue('deflect');
    }
    rhythmMode(entering) {
      this.rhythmAgeMs = 0;
      if (!entering) return;
      this.kick = 1; this.event('surge', { duration: 720 }); this.playCue('rhythm-surge');
    }
    resolved(result, player, range) {
      if (!result?.ok || !result.timing?.available || !result.targets?.length || !player) return;
      const combo = window.rhythmSystem?.combo || 0, perfect = result.timing.timing === 'perfect';
      this.kick = perfect ? 1 : .6;
      this.event('beat', { x: player.position.x, y: player.position.y, duration: perfect ? 500 : 380,
        radius: Math.max(1, Number(range) || 250), perfect, combo });
      // Additional low-end accents belong to connected strong hits, not an
      // independent metronome or every keypress. Existing hit sounds remain.
      if (perfect && (combo % 4 === 0 || result.pattern === 'discharge')) this.playCue('rhythm-impact');
    }
    hackPose(player) {
      if (!this.hacking() || !player?.grounded || player.cinematicPoseActive) return null;
      const age = window.hackingSystem.sessionElapsedMs || 0;
      // Existing approved idle atlas: the arm extends from frames 0..12.
      // Select via Makko play(startFrame), never assign its read-only getter.
      let frame = this.reduced() ? 10 : age < 480 ? Math.floor(age / 40) : 10 + Math.floor((age - 480) / 160) % 3;
      if (this.guardMs > 0 && !this.reduced()) frame = 12 - Math.floor((330 - this.guardMs) / 85) % 3;
      return { animation: 'idle', frame: clamp(frame, 0, 12) };
    }
    makeBuffer(context, kind) {
      const spec = sounds[kind]; if (!spec) return null;
      const rate = context.sampleRate, key = `${rate}:${kind}`;
      if (this.buffers.has(key)) return this.buffers.get(key);
      const buffer = context.createBuffer(1, Math.ceil(rate * spec.seconds), rate), data = buffer.getChannelData(0);
      let phase = 0, seed = 0x6b1701, air = 0;
      for (let i = 0; i < data.length; i++) {
        const t = i / rate, u = t / spec.seconds;
        const hz = spec.from * Math.pow(spec.to / spec.from, u);
        phase += TAU * hz / rate;
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        air += .16 * (seed / 2147483648 - 1 - air);
        const envelope = Math.min(1, t / .012) * Math.pow(1 - u, 1.7) * Math.min(1, (spec.seconds - t) / .028);
        let body = .36 * Math.sin(phase) + .08 * Math.sin(phase * 2.003);
        if (kind === 'rhythm-surge') body += .12 * Math.sin(TAU * 440 * t) * Math.sin(Math.PI * u) ** 2;
        if (kind === 'deflect') body += .16 * Math.sin(TAU * 2112 * t) * Math.exp(-t * 17);
        data[i] = envelope * (body + air * spec.air);
      }
      // A bounded cache also handles replacing an AudioContext at a new rate.
      if (this.buffers.size >= 10) this.buffers.clear();
      this.buffers.set(key, buffer); return buffer;
    }
    playCue(kind) {
      const audio = window.audioSystem, ac = audio?.context;
      if (!sounds[kind] || !ac || !audio.sfxGain || ac.state !== 'running' || window.isPaused || window.gameState?.paused || typeof ac.createBuffer !== 'function') return false;
      const now = ac.currentTime;
      if (now - (this.cueTimes[kind] ?? -Infinity) < .09) return false;
      // Do not steal a warning/damage voice or compete with its first attack.
      if ((audio.criticalCueUntil || 0) > now && kind !== 'deflect') return false;
      audio.combatVoices ||= new Set();
      while (audio.combatVoices.size >= 12) {
        const old = [...audio.combatVoices].find(v => !v.critical);
        if (!old) return false;
        old.dispose();
      }
      const source = ac.createBufferSource(), gain = ac.createGain();
      source.buffer = this.makeBuffer(ac, kind); gain.gain.value = kind === 'rhythm-impact' ? .62 : .75;
      source.connect(gain); gain.connect(audio.sfxGain);
      const voice = { critical: false, dispose: () => {
        if (!this.voices.delete(voice)) return;
        audio.combatVoices.delete(voice); source.onended = null;
        try { source.stop(); } catch (_) {} source.disconnect(); gain.disconnect();
      } };
      this.voices.add(voice); audio.combatVoices.add(voice); source.onended = voice.dispose;
      this.cueTimes[kind] = now; source.start(now);
      audio.lastSFXCue = { kind, reason: 'scheduled', audioTimeSec: now }; return true;
    }
    beat() {
      const ac = window.audioSystem?.context;
      const sample = Number.isFinite(ac?.currentTime) ? B.MusicTransport?.sample?.(ac.currentTime - (B.Preferences?.values?.visualOffsetMs || 0) / 1000) : null;
      return sample?.running && sample.grid ? sample.grid.beatFloat % 1 : 1;
    }
    hand(player) { return { x: player.position.x + (player.facing || 1) * 83, y: player.position.y - 89 }; }
    drawBehind(ctx) {
      const player = window.player; if (!player || (!this.hacking() && !this.rhythm())) return;
      const p = player.position, reduced = this.reduced(), hack = this.hacking();
      const beat = this.beat(), pulse = reduced ? .35 : Math.pow(1 - beat, 3);
      ctx.save();
      const radius = hack ? 150 : Math.min(250, window.rhythmSystem?.getAuthoritativeDamageRadius?.() || 250);
      const glow = ctx.createRadialGradient(p.x, p.y - 18, 16, p.x, p.y - 18, radius);
      glow.addColorStop(0, hack ? 'rgba(85,208,255,0.21)' : `rgba(105,255,181,${.12 + pulse * .1})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = glow;
      ctx.fillRect(p.x - radius, p.y - radius - 18, radius * 2, radius * 2);
      ctx.strokeStyle = hack ? '#8de4ff' : (window.rhythmSystem.combo >= 10 ? '#ff9ee9' : '#9bffcb');
      if (hack) {
        const hand = this.hand(player), angle = reduced ? 0 : this.timeMs / 950;
        ctx.lineWidth = 2.3;
        for (let ring = 0; ring < 3; ring++) {
          const r = 21 + ring * 15; ctx.globalAlpha = .76 - ring * .17;
          ctx.beginPath(); ctx.ellipse(hand.x, hand.y, r * .48, r, angle * (ring % 2 ? -1 : 1), .18, TAU - .35); ctx.stroke();
        }
        const target = window.hackingSystem.hijackTarget;
        const tp = target?.position;
        if (tp && target.active !== false) {
          const tx = tp.x, ty = tp.y - 35;
          ctx.globalAlpha = .55; ctx.lineWidth = 2; ctx.setLineDash([7, 13]);
          ctx.lineDashOffset = reduced ? 0 : -this.timeMs / 35;
          ctx.beginPath(); ctx.moveTo(hand.x, hand.y); ctx.quadraticCurveTo((hand.x + tx) / 2, Math.min(hand.y, ty) - 75, tx, ty); ctx.stroke(); ctx.setLineDash([]);
          ctx.strokeRect(tx - 33, ty - 48, 66, 96);
        }
      } else {
        // Beat-driven expanding pressure rings remain within the real radius.
        for (let i = 0; i < (reduced ? 1 : 3); i++) {
          const phase = reduced ? .5 : (beat + i / 3) % 1;
          ctx.globalAlpha = (1 - phase) * .48; ctx.lineWidth = 2 + pulse * 3;
          ctx.beginPath(); ctx.ellipse(p.x, p.y + 72, 40 + phase * (radius - 40), 10 + phase * 43, 0, 0, TAU); ctx.stroke();
        }
        // Short equalizer columns frame the performer without covering faces.
        ctx.globalAlpha = .42 + pulse * .2;
        for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
          const h = 12 + (5 - i) * (5 + pulse * 6);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fillRect(p.x + side * (65 + i * 13) - 3, p.y + 62 - h, 5, h);
        }
      }
      ctx.restore();
    }
    drawFront(ctx) {
      const reduced = this.reduced();
      for (const e of this.events) {
        const t = e.age / e.duration, fade = 1 - t;
        ctx.save(); ctx.globalAlpha = fade * (this.flashes() ? .8 : .4);
        ctx.strokeStyle = e.kind === 'surge' || e.kind === 'beat' ? (e.combo >= 10 ? '#ffb0ed' : '#a0ffcf') : '#aaedff';
        ctx.lineWidth = e.perfect ? 4 : 2;
        const radius = reduced ? 65 : e.kind === 'collapse' ? 55 + 240 * (1 - smooth(t)) : 35 + smooth(t) * (e.radius || 185);
        ctx.beginPath(); ctx.ellipse(e.x, e.y + 60, radius, radius * .24, 0, 0, TAU); ctx.stroke();
        if (e.kind === 'deflect') {
          const x = e.x + e.direction * 72, y = e.y - 62;
          ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, reduced ? 48 : 36 + t * 55, (e.direction < 0 ? Math.PI : 0) - .95, (e.direction < 0 ? Math.PI : 0) + .95); ctx.stroke();
          if (!reduced) for (let i = 0; i < 10; i++) {
            const a = -.95 + i * .21, r = 24 + t * (70 + i % 3 * 27);
            const px = x + e.direction * Math.cos(a) * r, py = y + Math.sin(a) * r;
            ctx.strokeRect(px, py, 7 + i % 3 * 3, 3);
          }
        }
        ctx.restore();
      }
    }
    drawScreen(ctx) {
      const hack = this.hacking(), rhythm = this.rhythm(); if (!hack && !rhythm) return;
      const view = hack ? window.hackingSystem.getSceneViewport?.() : null;
      const v = view || { x: 0, y: 0, width: 1920, height: 850 };
      ctx.save(); ctx.beginPath(); ctx.rect(v.x, v.y, v.width, v.height); ctx.clip();
      if (hack) {
        ctx.fillStyle = 'rgba(31,76,111,0.11)'; ctx.fillRect(v.x, v.y, v.width, v.height);
        const fade = ctx.createRadialGradient(v.x + v.width / 2, v.y + v.height / 2, v.height * .18,
          v.x + v.width / 2, v.y + v.height / 2, v.width * .64);
        fade.addColorStop(0, 'rgba(2,9,21,0)'); fade.addColorStop(1, 'rgba(2,9,21,0.58)');
        ctx.fillStyle = fade; ctx.fillRect(v.x, v.y, v.width, v.height);
        // Quiet time-lens arcs, not fullscreen flashes or a readability filter.
        if (!this.reduced()) {
          ctx.strokeStyle = 'rgba(142,221,255,0.23)'; ctx.lineWidth = 1.5;
          const age = window.hackingSystem.sessionElapsedMs || 0;
          for (let i = 0; i < 4; i++) {
            const phase = (age / 2800 + i / 4) % 1;
            ctx.beginPath(); ctx.ellipse(v.x + v.width / 2, v.y + v.height / 2, v.width * (.48 + phase * .16), v.height * (.42 + phase * .22), 0, 0, TAU); ctx.stroke();
          }
        }
      } else if (this.flashes() && !this.reduced()) {
        const strength = Math.max(this.kick, Math.pow(1 - this.beat(), 4) * .5);
        // Only a narrow border responds: central combat and HUD stay clear.
        ctx.globalAlpha = strength * .4; ctx.strokeStyle = window.rhythmSystem.combo >= 10 ? '#ef87db' : '#87f8bb';
        ctx.lineWidth = 3 + strength * 4; ctx.strokeRect(v.x + 5, v.y + 5, v.width - 10, v.height - 10);
      }
      ctx.restore();
    }
  }
  B.ModePowerFX = ModePowerFX; B.modePowerFX = new ModePowerFX();
})();
