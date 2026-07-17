// Authoritative 6 Bit primary-attack transaction.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/player-combat.js',
  exports: ['BARCODE.PlayerCombat'],
  dependencies: ['EnemyManager', 'BARCODE.MusicTransport', 'BARCODE.MusicProfiles']
});

(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const BONUS = { perfect: 1.5, excellent: 1.25 };
  class PlayerCombat {
    constructor(options = {}) { this.cooldownMs = options.cooldownMs ?? 250; this.baseDamage = options.baseDamage ?? 1; this.range = options.range ?? 300; this.lastAttackAt = -Infinity; this.sequence = 0; }
    reset() { this.lastAttackAt = -Infinity; this.sequence = 0; }
    canAttack(now = Date.now()) { return now - this.lastAttackAt >= this.cooldownMs; }
    resolvePrimary({ player = window.player, enemyManager = window.enemyManager, now = Date.now(), timing = null } = {}) {
      const result = { ok: false, action: 'primary', sequence: ++this.sequence, reason: '', timing: null, multiplier: 1, baseDamage: this.baseDamage, resolvedDamage: this.baseDamage, targets: [] };
      if (!this.gameplayActive()) { result.reason = 'gameplay-inactive'; return result; }
      if (!player) { result.reason = 'player-unavailable'; return result; }
      if (!this.canAttack(now)) { result.reason = 'cooldown'; return result; }
      this.lastAttackAt = now;
      const judgment = timing || this.getTimingJudgment();
      result.timing = judgment;
      result.multiplier = BONUS[judgment.timing] || 1;
      result.resolvedDamage = Math.min(this.baseDamage * result.multiplier, this.baseDamage * 1.5);
      this.playAttackAnimation(player, judgment);
      const targets = this.findTargets(player, enemyManager);
      const hitIds = new Set();
      targets.forEach(target => {
        if (!target || !target.active || hitIds.has(target)) return;
        hitIds.add(target);
        if (typeof target.takeDamage === 'function') target.takeDamage(result.resolvedDamage);
        if (window.particleSystem && typeof window.particleSystem.impact === 'function') window.particleSystem.impact(target.position.x, target.position.y, '#00ffff', 20);
        result.targets.push({ type: target.type || 'target', damage: result.resolvedDamage, x: target.position && target.position.x, y: target.position && target.position.y });
      });
      result.ok = true; result.reason = targets.length ? 'hit' : 'no-target';
      return result;
    }
    gameplayActive() { const gs = window.gameState || {}; return !(window.isPaused || window.isRunning === false || gs.paused || gs.gameOver || gs.victory || gs.running === false); }
    getTimingJudgment() {
      const transport = BARCODE.MusicTransport;
      const profile = BARCODE.MusicProfiles && BARCODE.MusicProfiles.getActive ? BARCODE.MusicProfiles.getActive() : null;
      const rule = profile && profile.judgmentRules && profile.judgmentRules.find(r => r.id === 'level-01.attack');
      const audioTimeSec = window.audioSystem && window.audioSystem.context ? window.audioSystem.context.currentTime : null;
      if (!transport || !transport.isReady || !transport.isReady() || !rule || !Number.isFinite(audioTimeSec)) return { available: false, timing: 'unavailable' };
      const judged = transport.judgeInput(rule.id, audioTimeSec);
      if (!judged || !judged.available || judged.timing === 'miss') return { available: false, timing: judged && judged.timing ? judged.timing : 'miss' };
      return judged;
    }
    playAttackAnimation(player, judgment) { if (window.rhythmSystem && typeof window.rhythmSystem.handleInput === 'function') window.rhythmSystem.handleInput('feedback-only'); if (player && typeof player.playAnimation === 'function') player.playAnimation('rhythm'); }
    findTargets(player, enemyManager) { const enemies = enemyManager && Array.isArray(enemyManager.enemies) ? enemyManager.enemies : []; return enemies.filter(enemy => enemy.active && window.distance(player.position.x, player.position.y, enemy.position.x, enemy.position.y) <= this.range); }
    diagnostics() { return { cooldownMs: this.cooldownMs, baseDamage: this.baseDamage, range: this.range, sequence: this.sequence, lastAttackAt: this.lastAttackAt }; }
  }
  BARCODE.PlayerCombat = PlayerCombat;
  BARCODE.playerCombat = BARCODE.playerCombat || new PlayerCombat();
})();
