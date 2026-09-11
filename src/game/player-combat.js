// Authoritative 6 Bit primary rhythm-attack transaction.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/player-combat.js',
  exports: ['BARCODE.PlayerCombat'],
  dependencies: ['EnemyManager', 'BARCODE.MusicTransport', 'BARCODE.MusicProfiles', 'rhythmSystem']
});

(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const SUCCESS_DAMAGE = { perfect: 3, excellent: 2 };
  class PlayerCombat {
    constructor(options = {}) { this.cooldownMs = options.cooldownMs ?? 250; this.range = options.range ?? 300; this.lastAttackAt = -Infinity; this.sequence = 0; this.feedback = null; }
    reset() { this.lastAttackAt = -Infinity; this.sequence = 0; this.feedback = null; this.rhythmLostUntil = 0; }
    canAttack(now = Date.now()) { return now - this.lastAttackAt >= this.cooldownMs; }
    resolvePrimary({ player = window.player, enemyManager = window.enemyManager, now = Date.now(), timing = null } = {}) {
      const result = { ok: false, action: 'primary', sequence: ++this.sequence, reason: '', timing: null, damage: 0, targets: [] };
      const finish = () => { this.recordFeedback(result); return result; };
      if (!this.gameplayActive()) { result.reason = 'gameplay-inactive'; return finish(); }
      if (!player) { result.reason = 'player-unavailable'; return finish(); }
      const rhythm = window.rhythmSystem;
      if (!rhythm || typeof rhythm.isActive !== 'function' || !rhythm.isActive()) { result.reason = 'rhythm-inactive'; return finish(); }
      if (!rhythm.trackStarted || rhythm.currentTempoBeat === 0) { result.reason = 'rhythm-not-ready'; result.timing = { available: false, timing: 'waiting' }; this.applyFeedback(result.timing); return finish(); }
      if (!this.canAttack(now)) { result.reason = 'cooldown'; result.timing = { available: false, timing: 'cooldown' }; return finish(); }
      this.lastAttackAt = now;
      const judgment = timing || this.getTimingJudgment();
      result.timing = judgment;
      if (!judgment || !judgment.available || !SUCCESS_DAMAGE[judgment.timing]) {
        result.reason = judgment && judgment.timing ? judgment.timing : 'unavailable';
        this.applyFeedback(judgment || { available: false, timing: 'unavailable' });
        return finish();
      }
      result.damage = SUCCESS_DAMAGE[judgment.timing];
      this.playAttackAnimation(player);
      this.applyFeedback(judgment);
      // A successful beat while standing on the Signal Lift powers traversal;
      // chargeSignalLift owns the support/availability checks.
      const lift = window.sector1Progression?.chargeSignalLift?.();
      if (lift?.ok) result.liftCharges = lift.charges;
      const targets = this.findTargets(player, enemyManager, judgment);
      const jammerHit = this.tryDamageJammer(player, judgment, result.sequence);
      if (jammerHit.ok) result.targets.push(jammerHit.target);
      const bossHit = window.sector1Progression?.applyBossRhythmDamage?.({
        player, judgment, sequence: result.sequence,
        range: window.rhythmSystem?.getAuthoritativeDamageRadius?.() ?? this.range
      }) || { ok: false };
      result.bossReason = bossHit.reason || null;
      if (bossHit.ok) {
        result.targets.push(bossHit.target);
      }
      const hitIds = new Set();
      targets.forEach(target => {
        if (!target || !target.active || hitIds.has(target)) return;
        hitIds.add(target);
        if (typeof target.takeDamage === 'function') target.takeDamage(result.damage);
        if (window.particleSystem && typeof window.particleSystem.impact === 'function') window.particleSystem.impact(target.position.x, target.position.y, '#00ffff', 20);
        result.targets.push({ type: target.type || 'target', damage: result.damage, x: target.position && target.position.x, y: target.position && target.position.y });
      });
      result.ok = true; result.reason = result.targets.length ? 'hit' : bossHit.reason === 'boss-guarded' ? 'boss-guarded' : 'no-target';
      return finish();
    }
    recordFeedback(result) {
      // Musical accuracy and actual contact are different results. Keep one
      // short message on the existing game clock; no timer or render loop.
      if (['gameplay-inactive', 'player-unavailable', 'cooldown'].includes(result.reason)) return;
      let text, color = '#ffbd70';
      if (result.targets.length) {
        const damage = result.targets.reduce((sum, target) => sum + target.damage, 0);
        text = `${result.timing.timing.toUpperCase()} — ${result.targets.length > 1 ? result.targets.length + ' TARGETS · ' : ''}${damage} DAMAGE`;
        color = '#00ffff';
        window.audioSystem?.playSound?.('synthHit');
        window.renderer?.addScreenShake?.(result.timing.timing === 'perfect' ? 2 : 1, 70);
      } else if (Number.isFinite(result.liftCharges)) {
        text = `LIFT CHARGED ${result.liftCharges}/2`;
        color = '#00ffff';
      } else if (result.reason === 'rhythm-inactive') text = 'PRESS R TO ENTER RHYTHM MODE';
      else if (result.reason === 'rhythm-not-ready') text = 'LISTEN FOR THE BEAT';
      else if (result.reason === 'miss') text = Number.isFinite(result.timing?.signedOffsetMs) ? `${result.timing.signedOffsetMs < 0 ? 'EARLY' : 'LATE'} — MATCH THE PULSE` : 'OFF BEAT — MATCH THE PULSE';
      else if (result.bossReason === 'boss-guarded') { text = 'ON BEAT — BOSS GUARDED; WAIT FOR CYAN'; window.audioSystem?.playSound?.('hihat'); }
      else if (result.reason === 'no-target') text = 'ON BEAT — MOVE CLOSER TO A TARGET';
      else text = 'RHYTHM TIMING NOT READY';
      this.feedback = { text, color, expiresAt: (window.gameState?.gameTime || 0) + 1000 };
    }
    getFeedback() {
      return this.feedback && (window.gameState?.gameTime || 0) < this.feedback.expiresAt ? { ...this.feedback } : null;
    }
    notifyRhythmLost() {
      this.rhythmLostUntil = (window.gameState?.gameTime || 0) + 2200;
      this.feedback = { text: 'RHYTHM MODE LOST — PRESS R TO RE-ENTER', color: '#ffbd70', expiresAt: this.rhythmLostUntil };
    }
    drawPlayerTimingCue(ctx, player) {
      if (!ctx || !player || !this.gameplayActive() || window.hackingSystem?.isActive?.() || window.tutorialSystem?.isActive?.()) return;
      const active = window.rhythmSystem?.isActive?.();
      const lost = !active && (window.gameState?.gameTime || 0) < (this.rhythmLostUntil || 0);
      if (!active && !lost) return;
      const x = player.position.x;
      const y = player.position.y - 120;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 8, 16, 0.88)'; ctx.fillRect(x - 70, y - 25, 140, 38);
      ctx.textAlign = 'center'; ctx.font = 'bold 12px monospace';
      ctx.fillStyle = lost ? '#ffbd70' : '#ffffff';
      ctx.fillText(lost ? 'PRESS R — RHYTHM OFF' : 'DOWN ON BEAT', x, y - 10);
      if (active) {
        const time = window.audioSystem?.context?.currentTime;
        const sample = Number.isFinite(time) ? BARCODE.MusicTransport?.sample?.(time) : null;
        if (sample?.running && sample.grid) {
          const fraction = sample.grid.beatFloat % 1;
          const profile = BARCODE.MusicProfiles?.getActive?.();
          const rule = profile?.judgmentRules?.find(r => r.target === 'quarter-note' || /attack/.test(r.id));
          const onBeat = Math.min(fraction, 1 - fraction) * sample.grid.beatDurationSec * 1000 <= (rule?.windowsMs?.perfect ?? 0);
          ctx.fillStyle = '#657887'; ctx.fillRect(x - 54, y + 2, 108, 2);
          ctx.fillStyle = onBeat ? '#00ffff' : '#ffffff';
          ctx.fillRect(x - 3, y - 1, 6, 8);
          const travel = 52 * (1 - fraction);
          ctx.fillRect(x - travel - 2, y, 4, 6); ctx.fillRect(x + travel - 2, y, 4, 6);
        }
      }
      ctx.restore();
    }
    gameplayActive() { const gs = window.gameState || {}; return !(window.sector1Progression?.isGameplaySuppressed?.() || window.isPaused || window.isRunning === false || gs.paused || gs.gameOver || gs.victory || gs.running === false); }
    getTimingJudgment() {
      const transport = BARCODE.MusicTransport;
      const profile = BARCODE.MusicProfiles && BARCODE.MusicProfiles.getActive ? BARCODE.MusicProfiles.getActive() : null;
      const rule = profile && profile.judgmentRules && profile.judgmentRules.find(r => r.target === 'quarter-note' || /attack/.test(r.id)) || null;
      const audioTimeSec = window.audioSystem && window.audioSystem.context ? window.audioSystem.context.currentTime : null;
      if (!transport || typeof transport.judgeInput !== 'function' || !rule || !Number.isFinite(audioTimeSec)) return { available: false, timing: 'unavailable' };
      return transport.judgeInput(rule.id, audioTimeSec) || { available: false, timing: 'unavailable' };
    }
    playAttackAnimation(player) { if (player && typeof player.startPrimaryAttackAnimation === 'function') player.startPrimaryAttackAnimation(); else if (player && typeof player.playAnimation === 'function') player.playAnimation('rhythm'); }
    applyFeedback(judgment) { if (window.rhythmSystem && typeof window.rhythmSystem.applyResolvedAttackFeedback === 'function') window.rhythmSystem.applyResolvedAttackFeedback(judgment); }
    getAuthoritativeRange(judgment = null, { jammer = false } = {}) { if (jammer) return this.range; const rhythmRange = window.rhythmSystem && typeof window.rhythmSystem.getAuthoritativeDamageRadius === 'function' ? window.rhythmSystem.getAuthoritativeDamageRadius() : this.range; const ampCharges = window.BARCODE && Number(window.BARCODE.signalAmpCharges || 0); const ampOk = ampCharges > 0 && judgment && (judgment.timing === 'perfect' || judgment.timing === 'excellent'); return ampOk ? 430 : rhythmRange; }
    findTargets(player, enemyManager, judgment = null) { const enemies = enemyManager && Array.isArray(enemyManager.enemies) ? enemyManager.enemies : []; const range = this.getAuthoritativeRange(judgment); const targets = enemies.filter(enemy => enemy.active && enemy.type !== 'broadcast_jammer' && enemy.type !== 'boss' && window.distance(player.position.x, player.position.y, enemy.position.x, enemy.position.y) <= range); if (targets.length && window.BARCODE && window.BARCODE.signalAmpCharges > 0 && judgment && (judgment.timing === 'perfect' || judgment.timing === 'excellent')) window.BARCODE.signalAmpCharges -= 1; return targets; }
    tryDamageJammer(player, judgment, sequence) {
      const env = BARCODE.JammerEnvironment;
      if (!env || !env.canReceiveRhythmDamage || !env.applyRhythmDamage) return { ok: false };
      if (!judgment || !(judgment.timing === 'perfect' || judgment.timing === 'excellent')) return { ok: false };
      const status = env.getStatus();
      const position = status && status.position;
      if (!position || window.distance(player.position.x, player.position.y, position.x, position.y) > this.getAuthoritativeRange(judgment, { jammer: true })) return { ok: false };
      const damaged = env.applyRhythmDamage({ amount: 1, timing: judgment.timing, sequence });
      return damaged.ok ? { ok: true, target: { type: 'broadcast_jammer', damage: 1, x: position.x, y: position.y } } : { ok: false };
    }
    diagnostics() { return { cooldownMs: this.cooldownMs, range: this.range, sequence: this.sequence, lastAttackAt: this.lastAttackAt }; }
  }
  BARCODE.PlayerCombat = PlayerCombat;
  BARCODE.playerCombat = BARCODE.playerCombat || new PlayerCombat();
})();
