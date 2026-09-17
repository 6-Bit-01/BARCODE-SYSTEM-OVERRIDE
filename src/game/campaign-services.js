// Campaign facts and Level 1 adapter. No new clock, input listener or renderer.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/campaign-services.js', exports: ['BARCODE.Campaign'], dependencies: ['BARCODE.LoreCollection', 'BARCODE.LevelDifficulty'] });
(function(B) {
  const clone = value => JSON.parse(JSON.stringify(value));
  const count = n => Number.isFinite(n) ? Math.max(0, Math.min(1e10, Math.round(n))) : 0;
  const stages = ['encounter_1', 'encounter_2', 'encounter_3', 'encounter_4', 'jammer', 'boss', 'intermission'];
  const keys = ['stem.voice', 'stem.bass', 'stem.drums', 'stem.synth', 'stem.samples', 'stem.noise_fx'];
  const C = B.Campaign = {
    run: null, result: null, intermission: false, restoring: false, contactSequence: null,
    adapters: new Map(),
    resetSession() { this.run = null; this.result = null; this.intermission = false; this.contactSequence = null; },
    archive() { return window.lostDataSystem?.archive || (this.previewArchive ||= new B.LoreCollection()); },
    register(levelId, adapter) {
      if (!/^level-0[1-7]$/.test(levelId) || typeof adapter?.restore !== 'function' || this.adapters.has(levelId)) return false;
      this.adapters.set(levelId, adapter); return true;
    },
    begin(levelId = 'level-01') {
      if (this.restoring) return;
      this.intermission = false; this.result = null; this.contactSequence = null;
      this.run = { levelId, difficultyId: B.LevelDifficulty?.choice?.id || 'standard',
        runId: `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`, elapsedMs: 0, damageTaken: 0,
        retries: 0, attempts: 0, accurate: 0, perfect: 0, connected: 0, connectedPerfect: 0, completed: false, practice: false };
    },
    active() { return !!this.run && !this.run.completed && !!window.sector1Progression?.missionStarted; },
    tick(delta) { if (this.active() && !window.sector1Progression?.isGameplaySuppressed?.()) this.run.elapsedMs += Math.max(0, Math.min(100, delta)); },
    damage(amount) { if (this.active()) this.run.damageTaken += count(amount); },
    attempt(judgment) {
      if (!this.active() || !judgment?.available || !['perfect', 'excellent', 'miss'].includes(judgment.timing)) return;
      this.run.attempts++;
      if (judgment.timing !== 'miss') this.run.accurate++;
      if (judgment.timing === 'perfect') this.run.perfect++;
    },
    contact(sequence, judgment) {
      if (!this.active() || this.contactSequence === sequence) return;
      this.contactSequence = sequence; this.run.connected++;
      if (judgment?.timing === 'perfect') this.run.connectedPerfect++;
    },
    retryBoss() {
      if (!this.run) return;
      if (this.run.completed) { this.run.practice = true; this.run.completed = false; }
      this.run.retries++; this.contactSequence = null; this.intermission = false;
    },
    checkpoint(checkpointId) {
      if (this.restoring || !this.run || this.run.practice || !stages.includes(checkpointId)) return false;
      const p = window.sector1Progression, player = window.player;
      const levelState = { difficultyId: this.run.difficultyId, run: clone(this.run),
        score: count(window.gameState?.score), bestCombo: count(window.rhythmSystem?.runBestCombo),
        health: Math.max(1, count(player?.health)), playerX: player?.position?.x ?? 200,
        fragments: [...(window.lostDataSystem?.collectedLore || [])], skyCaches: [...(p?.skyCaches || [])],
        ampCharges: count(B.signalAmpCharges), boss: p?.bossCheckpoint ? clone(p.bossCheckpoint) : null,
        result: this.result ? clone(this.result) : null };
      return this.archive().checkpoint({ levelId: this.run.levelId, checkpointId, levelState });
    },
    finish() {
      if (!this.run || this.run.completed) return this.result;
      const r = this.run;
      // Existing kill/collectible points remain. Bonuses are clear-only and
      // bounded; idle rhythm taps and boss practice cannot farm them.
      const quality = r.attempts ? Math.round(600 * r.connectedPerfect / Math.max(r.attempts, r.connectedPerfect)) : 0;
      const bonus = r.practice ? 0 : 1000 + quality + (r.damageTaken === 0 && r.retries === 0 ? 500 : 0);
      if (window.gameState) window.gameState.score += bonus;
      this.result = { runId: r.runId, completedAt: Date.now(), score: count(window.gameState?.score),
        elapsedMs: count(r.elapsedMs), damageTaken: count(r.damageTaken), retries: count(r.retries),
        attempts: count(r.attempts), accurate: count(r.accurate), perfect: count(r.perfect), connected: count(r.connected),
        bestCombo: count(window.rhythmSystem?.runBestCombo), discoveries: count(window.lostDataSystem?.getProgress?.().collected), bonus };
      r.completed = true;
      if (!r.practice) {
        const number = Number(r.levelId.slice(-2));
        this.archive().completeCampaignLevel(r.levelId, r.difficultyId, this.result, keys[number - 1],
          number < 7 ? `level-0${number + 1}` : null);
        this.checkpoint('intermission');
      }
      return this.result;
    },
    readResume() {
      const current = this.archive().record.current, s = current?.levelState;
      if (!current || !this.adapters.has(current.levelId) || !stages.includes(current.checkpointId) || !s || !s.run) return null;
      if (!['relaxed', 'standard', 'overclocked'].includes(s.difficultyId) || s.run.levelId !== current.levelId ||
          typeof s.run.runId !== 'string' || s.run.runId.length > 100 || !Number.isFinite(s.playerX) || s.playerX < 0 || s.playerX > 4096) return null;
      if (!Array.isArray(s.fragments) || !Array.isArray(s.skyCaches) || !['health','score','bestCombo','ampCharges'].every(k => Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 1e10)) return null;
      if (!['elapsedMs', 'damageTaken', 'retries', 'attempts', 'accurate', 'perfect', 'connected', 'connectedPerfect'].every(k =>
        Number.isFinite(s.run[k]) && s.run[k] >= 0 && s.run[k] <= 1e10)) return null;
      if (['boss','intermission'].includes(current.checkpointId) && (!s.boss || !Number.isFinite(s.boss.bossX) || s.boss.bossX < 0 || s.boss.bossX > 4096 ||
          !Number.isFinite(s.boss.playerX) || s.boss.playerX < 0 || s.boss.playerX > 4096 || !Number.isFinite(s.boss.score) || !Array.isArray(s.boss.skyCaches))) return null;
      if (current.checkpointId === 'intermission' && (!s.result || !Number.isFinite(s.result.score))) return null;
      return clone(current);
    },
    syncTitleButton() {
      const button = document.getElementById('continueButton');
      if (button) { button.hidden = !this.readResume(); button.disabled = false; }
    },
    async continueSaved() {
      const saved = this.readResume(); if (!saved) return { ok: false, reason: 'no-checkpoint' };
      return B.RuntimeLifecycle?.start({ resume: saved, initialStart: true });
    },
    restore(saved) {
      const adapter = this.adapters.get(saved?.levelId); if (!adapter) return false;
      this.restoring = true;
      try {
        this.run = clone(saved.levelState.run); this.result = saved.levelState.result ? clone(saved.levelState.result) : null;
        this.contactSequence = null; this.intermission = saved.checkpointId === 'intermission';
        return adapter.restore(saved);
      } finally { this.restoring = false; }
    },
    openIntermission() {
      if (!window.gameState?.victory || window.sector1Progression?.areCompletionControlsReady?.() === false) return false;
      this.intermission = true; window.inputManager?.resetActionEdges?.(); return true;
    },
    closeIntermission() { this.intermission = false; window.inputManager?.resetActionEdges?.(); },
    drawIntermission(ctx) {
      ctx.save(); ctx.fillStyle = '#070f19'; ctx.fillRect(0, 0, 1920, 1080);
      ctx.strokeStyle = '#92ffdc'; ctx.lineWidth = 3; ctx.strokeRect(290, 188, 1340, 690);
      ctx.textAlign = 'center'; ctx.fillStyle = '#92ffdc'; ctx.font = 'bold 25px Oxanium, monospace';
      ctx.fillText('BARCODE NETWORK / OUTGOING CHANNEL', 960, 265);
      ctx.fillStyle = '#f2f0e9'; ctx.font = 'bold 52px Oxanium, monospace'; ctx.fillText('VOICE RECOVERED', 960, 357);
      ctx.font = '25px Oxanium, monospace'; ctx.fillStyle = '#c7a7ff'; ctx.fillText('CACHE BACK', 960, 445);
      ctx.fillStyle = '#e0e6e9'; ctx.fillText('“Carrier is clean. I can get the signal out of this district.”', 960, 490);
      ctx.font = '22px Oxanium, monospace';
      ctx.fillText('Stem Key: Voice added to your campaign.', 960, 568);
      ctx.fillStyle = '#9eafb9'; ctx.fillText('NEXT CHANNEL: THE CACHE LINE', 960, 657);
      ctx.fillText('Your progress is saved. The next playable sector is coming.', 960, 703);
      if (this.archive().status !== 'ready') { ctx.fillStyle = '#ffb16e'; ctx.fillText('Save unavailable — keep this session open to retain progress.', 960, 754); }
      ctx.fillStyle = '#92ffdc'; ctx.font = '20px Oxanium, monospace';
      ctx.fillText(B.GamepadUI?.connected ? 'CIRCLE / B — Back to results' : 'ESC — Back to results', 960, 820);
      ctx.restore();
    }
  };
  C.register('level-01', { restore(saved) { return window.sector1Progression?.restoreCampaignCheckpoint?.(saved) || false; } });
  C.syncTitleButton();
})(window.BARCODE = window.BARCODE || {});
