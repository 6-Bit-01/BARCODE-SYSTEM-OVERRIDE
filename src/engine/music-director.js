// Arrangement and colour only. The existing AudioSystem/transport owns every
// source start, offset, native loop, restart, pause and rhythm judgment.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/music-director.js', exports: ['BARCODE.MusicDirector', 'BARCODE.musicDirector'], dependencies: ['BARCODE.MusicProfiles'] });
(function(B) {
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  class MusicDirector {
    constructor() { this.reset(); }
    reset() {
      this.disposeGraph(); this.profileId = null; this.state = null; this.pending = null;
      this.lastBeat = null; this.lastBar = null; this.lastPhrase = null; this.generation = null;
      this.variation = 0; this.volumes = {}; this.pendingAccent = null; this.lastAccentBeat = -Infinity;
      this.comboMilestone = 0; this.graph = null; this.audio = null; this.enabled = null; this.turnaround = false;
      this.laneCandidate = null; this.laneCandidateSince = null;
    }
    accent(kind) {
      if (['hack', 'boss', 'clear', 'combo'].includes(kind)) this.pendingAccent = kind;
    }
    desiredState() {
      const proof = B.RunAndGunProof;
      if (proof?.active) return proof.status === 'playing' ? (proof.threatActive() ? 'combat' : 'explore') : 'victory';
      const owner = window.sector1Progression;
      if (window.gameState?.victory) return 'victory';
      if(window.hackingSystem?.isActive?.() && !owner?.isBossCinematicActive?.())return 'hack';
      if (owner?.isBossCombatLive?.() || owner?.state === 'boss_ready') {
        if (owner.boss?.phase === 'recovery') return 'counter';
        return owner.boss?.latePhase ? 'bossFinal' : 'boss';
      }
      if (owner?.isBossCinematicActive?.()) return 'restored';
      if (window.rhythmSystem?.isActive?.()) return 'rhythm';
      const pos = window.player?.position;
      const threats = window.enemyManager?.getActiveEnemies?.() || [];
      if (threats.some(e => !e.hijacked && (!pos || !e.position ||
          Math.abs(e.position.x - pos.x) < 850 && Math.abs(e.position.y - pos.y) < 330))) return 'combat';
      return 'explore';
    }
    ramp(param, target, now, duration) {
      if (!param) return;
      if (typeof param.linearRampToValueAtTime !== 'function') { param.value = target; return; }
      if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
      else { param.cancelScheduledValues?.(now); param.setValueAtTime?.(param.value, now); }
      param.linearRampToValueAtTime(target, now + duration);
    }
    bindColour(audio, source, mix) {
      const gain = audio.musicTracks[source.sourceId]?.gain, context = audio.context;
      if (this.graph?.gain === gain) return this.graph;
      this.disposeGraph();
      if (!gain?.disconnect || !context.createBiquadFilter || !context.createDelay) return null;
      const nodes = [];
      try {
        const filter = context.createBiquadFilter(); nodes.push(filter);
        const send = context.createGain(); nodes.push(send);
        const delay = context.createDelay(2); nodes.push(delay);
        const feedback = context.createGain(); nodes.push(feedback);
        const wet = context.createGain(); nodes.push(wet);
        filter.type = 'lowpass'; filter.frequency.value = 18000; filter.Q.value = 0.4;
        send.gain.value = 0;
        feedback.gain.value = mix.echo?.feedback ?? 0.12;
        wet.gain.value = mix.echo?.wet ?? 0.18;
        filter.connect(audio.musicGain); filter.connect(send); send.connect(delay);
        delay.connect(wet); wet.connect(audio.musicGain); delay.connect(feedback); feedback.connect(delay);
        gain.disconnect(audio.musicGain); gain.connect(filter);
        this.graph = { sourceId: source.sourceId, gain, filter, send, delay, nodes, output: audio.musicGain };
        return this.graph;
      } catch (_) {
        nodes.forEach(node => { try { node.disconnect(); } catch (_) {} });
        try { gain.disconnect(); gain.connect(audio.musicGain); } catch (_) {}
        return null;
      }
    }
    disposeGraph() {
      if (!this.graph) return;
      const { gain, filter, output, nodes } = this.graph;
      try { gain.disconnect(filter); gain.connect(output); } catch (_) {}
      nodes.forEach(node => { try { node.disconnect(); } catch (_) {} });
      this.graph = null;
    }
    getVolume(id) { return Number.isFinite(this.volumes[id]) ? this.volumes[id] : null; }
    applyLaneMix(audio, profile) {
      if (!audio.context || !audio.layersStarted || audio.isLooping) return false;
      if (this.profileId !== profile.profileId) { this.reset(); this.profileId = profile.profileId; }
      this.audio = audio;
      if (window.isPaused || window.gameState?.paused) return true;
      const sample = B.MusicTransport?.sample?.(audio.context.currentTime);
      const road = B.CacheRoadProof;
      const requested = road?.mixSnapshot?.();
      if (!requested || !road.active) return true;
      this.pending = requested;
      this.state = requested;
      const mix = profile.laneMix;
      const position = clamp(Number.isFinite(requested.lanePos) ? requested.lanePos : requested.lane, 0, 3);
      const locked = new Set(requested.locked);
      for (const source of profile.arrangement.sources) {
        const index = mix.laneRoles.indexOf(source.mixRole);
        // A lane is strongest at its center and remains present across the
        // neighboring lane. Locks retain full strength independently.
        const proximity = index < 0 ? 0 : Math.max(0, 1 - Math.abs(position - index) / mix.blendWidth);
        const presence = requested.finalMix || locked.has(index) ? 1 : proximity;
        const volume = Math.max(source.mixRole === mix.bedRole ? mix.bedGain : 0,
          source.mixRole === mix.grooveRole ? mix.grooveGain : 0,
          index >= 0 ? mix.laneGains[index] * presence : 0);
        this.volumes[source.sourceId] = volume;
        const track = audio.musicTracks[source.sourceId];
        if (track?.isPlaying && track.gain && Math.abs((track.volume ?? -1) - volume) > 0.005)
          audio.rampAdaptiveStemGain(track, volume,
            volume > (track.volume ?? 0) ? mix.fadeInSec : mix.fadeOutSec);
      }
      this.generation = sample?.generation;
      this.lastBeat = sample?.grid?.beatIndex ?? null;
      this.enabled = true; // Lane arrangement is the road's core interaction.
      return true;
    }
    apply(audio) {
      const profile = audio.getActiveMusicProfile?.(), mix = profile?.adaptiveMix;
      if (profile?.laneMix) return this.applyLaneMix(audio, profile);
      if (!mix || !audio.context || !audio.layersStarted || audio.isLooping) return false;
      if (this.profileId !== profile.profileId) { this.reset(); this.profileId = profile.profileId; }
      this.audio = audio;
      if (window.isPaused || window.gameState?.paused) return true;
      const now = audio.context.currentTime;
      const sample = B.MusicTransport?.sample?.(now), grid = sample?.running ? sample.grid : null;
      const enabled = B.Preferences?.values?.dynamicMusic !== false;
      this.enabled = enabled;
      const cutscene = window.cutsceneSystem?.isPlaying?.();
      const desired = this.desiredState();
      const generationChanged = this.generation !== sample?.generation;
      const beatChanged = !!grid && this.lastBeat !== grid.beatIndex;
      const barChanged = !!grid && this.lastBar !== grid.barIndex;
      const phraseBeats = grid && (grid.phraseBeatCount || grid.beatsPerBar);
      const phrase = grid ? Math.floor(grid.beatIndex / phraseBeats) : null;
      const variants = mix.phraseVariants || [{}, {}, {}, {}];
      if (!generationChanged && phrase !== null && phrase !== this.lastPhrase) this.variation = (this.variation + 1) % variants.length;
      this.pending = desired;
      // Emergency/terminal ownership is immediate; ordinary mix changes wait
      // for a bar. Boss counter cues and new rhythm/hack entries use a beat.
      const urgent = ['victory', 'restored', 'counter', 'boss', 'bossFinal', 'rhythm', 'hack'].includes(desired);
      const previousState = this.state;
      if (!this.state || !grid || (!generationChanged && (barChanged || urgent && beatChanged))) this.state = desired;
      if (enabled && previousState !== this.state && this.state === 'hack') this.accent('hack');
      const fallback = mix.states.explore;
      const levels = mix.states[this.state] || fallback;
      const baseline = enabled ? levels : mix.states[window.rhythmSystem?.isActive?.() || window.hackingSystem?.isActive?.() ? ((window.enemyManager?.getActiveEnemies?.().length || 0) > 0 ? 'legacyRhythm' : 'legacyRhythmSolo') :
        (window.enemyManager?.getActiveEnemies?.().length || 0) > 0 ? 'legacyCombat' : 'legacyExplore'] || fallback;
      const varied = enabled && ['combat', 'rhythm', 'boss'].includes(this.state);
      const variant = varied ? variants[this.variation] : {};
      // A two-beat pullback at the end of the authored phrase. Sources keep
      // running, and the foundation is never attenuated by this arrangement.
      const turnaround = enabled && grid && ['combat', 'rhythm'].includes(this.state) &&
        grid.beatIndex % phraseBeats >= Math.max(0, phraseBeats - 2);
      this.turnaround = !!turnaround;
      for (const source of profile.arrangement.sources) {
        const track = audio.musicTracks[source.sourceId];
        const role = source.mixRole;
        let level = Number.isFinite(baseline[role]) ? baseline[role] : source.gain;
        const volume = cutscene ? 0 : clamp(level * (variant[role] ?? 1) *
          (turnaround ? (mix.turnaroundGains?.[role] ?? 1) : 1), 0, 0.8);
        this.volumes[source.sourceId] = volume;
        if (track?.isPlaying && track.gain && Math.abs((track.volume ?? -1) - volume) > 0.005) {
          audio.rampAdaptiveStemGain(track, volume, enabled ? (mix.fadeSec ?? 0.3) : 0.18);
        }
      }
      const colour = profile.arrangement.sources.find(s => s.mixRole === mix.colourRole);
      if (!enabled || cutscene) { this.disposeGraph(); this.pendingAccent = null; }
      else if (colour) {
        const graph = this.bindColour(audio, colour, mix);
        if (graph && (beatChanged || !grid || generationChanged)) {
          const combo = window.rhythmSystem?.combo || 0;
          const milestone = Math.floor(combo / 5);
          if (milestone > this.comboMilestone) this.accent('combo');
          this.comboMilestone = milestone;
          const cutoff = (mix.filterHz?.[this.state] ?? 6500) +
            (this.state === 'rhythm' ? Math.min(2000, combo * 100) : 0);
          this.ramp(graph.filter.frequency, cutoff, now, 0.25);
          // No-grid songs keep their dry arrangement. Echo requires the song's
          // own verified grid; there is no inherited Level 1 tempo.
          if (grid && this.pendingAccent && !generationChanged && grid.beatIndex - this.lastAccentBeat >= 4) {
            graph.delay.delayTime.setValueAtTime?.(grid.beatDurationSec * 0.75, now);
            this.ramp(graph.send.gain, mix.echo?.send ?? 0.55, now, 0.02);
            graph.send.gain.linearRampToValueAtTime?.(0, now + Math.min(0.7, grid.beatDurationSec));
            this.lastAccentBeat = grid.beatIndex; this.pendingAccent = null;
          }
        }
      }
      if (generationChanged) { this.lastAccentBeat = -Infinity; this.pendingAccent = null; }
      this.generation = sample?.generation; this.lastBeat = grid?.beatIndex ?? null;
      this.lastBar = grid?.barIndex ?? null; this.lastPhrase = phrase;
      return true;
    }
    diagnostics() { return { profileId: this.profileId, enabled: this.enabled, state: this.state, pending: this.pending,
      variation: this.variation, turnaround: this.turnaround, volumes: { ...this.volumes }, effects: !!this.graph,
      colourSource: this.graph?.sourceId || null, filterHz: this.graph?.filter.frequency.value ?? null }; }
  }
  B.MusicDirector = MusicDirector; B.musicDirector = new MusicDirector();
})(window.BARCODE = window.BARCODE || {});
