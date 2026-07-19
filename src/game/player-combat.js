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
    constructor(options = {}) { this.cooldownMs = options.cooldownMs ?? 250; this.range = options.range ?? 300; this.lastAttackAt = -Infinity; this.sequence = 0; }
    reset() { this.lastAttackAt = -Infinity; this.sequence = 0; }
    canAttack(now = Date.now()) { return now - this.lastAttackAt >= this.cooldownMs; }
    resolvePrimary({ player = window.player, enemyManager = window.enemyManager, now = Date.now(), timing = null } = {}) {
      const result = { ok: false, action: 'primary', sequence: ++this.sequence, reason: '', timing: null, damage: 0, targets: [] };
      if (!this.gameplayActive()) { result.reason = 'gameplay-inactive'; return result; }
      if (!player) { result.reason = 'player-unavailable'; return result; }
      const rhythm = window.rhythmSystem;
      if (!rhythm || typeof rhythm.isActive !== 'function' || !rhythm.isActive()) { result.reason = 'rhythm-inactive'; return result; }
      if (!rhythm.trackStarted || rhythm.currentTempoBeat === 0) { result.reason = 'rhythm-not-ready'; result.timing = { available: false, timing: 'waiting' }; this.applyFeedback(result.timing); return result; }
      if (!this.canAttack(now)) { result.reason = 'cooldown'; result.timing = { available: false, timing: 'cooldown' }; return result; }
      this.lastAttackAt = now;
      const judgment = timing || this.getTimingJudgment();
      result.timing = judgment;
      if (!judgment || !judgment.available || !SUCCESS_DAMAGE[judgment.timing]) {
        result.reason = judgment && judgment.timing ? judgment.timing : 'unavailable';
        this.applyFeedback(judgment || { available: false, timing: 'unavailable' });
        return result;
      }
      result.damage = SUCCESS_DAMAGE[judgment.timing];
      this.playAttackAnimation(player);
      this.applyFeedback(judgment);
      if (window.sector1Progression && typeof window.sector1Progression.chargeSignalLift === 'function') window.sector1Progression.chargeSignalLift();
      const targets = this.findTargets(player, enemyManager, judgment);
      const jammerHit = this.tryDamageJammer(player, judgment, result.sequence);
      if (jammerHit.ok) result.targets.push(jammerHit.target);
      const hitIds = new Set();
      targets.forEach(target => {
        if (!target || !target.active || hitIds.has(target)) return;
        hitIds.add(target);
        if (typeof target.takeDamage === 'function') target.takeDamage(result.damage);
        if (window.particleSystem && typeof window.particleSystem.impact === 'function') window.particleSystem.impact(target.position.x, target.position.y, '#00ffff', 20);
        result.targets.push({ type: target.type || 'target', damage: result.damage, x: target.position && target.position.x, y: target.position && target.position.y });
      });
      result.ok = true; result.reason = (targets.length || jammerHit.ok) ? 'hit' : 'no-target';
      return result;
    }
    gameplayActive() { const gs = window.gameState || {}; return !(window.isPaused || window.isRunning === false || gs.paused || gs.gameOver || gs.victory || gs.running === false); }
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
