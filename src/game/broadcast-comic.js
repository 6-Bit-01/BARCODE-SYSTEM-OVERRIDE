// One authored broadcast interruption, driven by a real encounter clear.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/broadcast-comic.js',
  exports: ['BARCODE.BroadcastComic'],
  dependencies: []
});

(function () {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const CARD = Object.freeze({ x: 440, y: 292, w: 1040, h: 216 });
  const LINES = Object.freeze([
    Object.freeze({ speaker: '6 BIT', text: 'Cliff. I cleared the block. Why is the caption still here?', ms: 3500, color: '#a8ff70' }),
    Object.freeze({ speaker: 'CLIFF', text: 'Hang on. It\'s on a separate circuit.', ms: 2700, color: '#ddb1ff' }),
    Object.freeze({ speaker: 'SHEILA', text: 'Cliff. The caption. Not the whole frame.', ms: 2600, color: '#83e6ee' }),
    Object.freeze({ speaker: '6 BIT', text: 'Leave it. I like the view.', ms: 2400, color: '#a8ff70' })
  ]);
  const WAIT_MS = 1000; // Let the existing clear cue and defeat burst finish.
  const TOTAL_MS = WAIT_MS + LINES.reduce((sum, line) => sum + line.ms, 0) + 350;

  function blocked() {
    const game = window.gameState;
    const progression = window.sector1Progression;
    if (!game?.running || game.paused || game.gameOver || game.victory || window.isPaused) return true;
    if (!progression?.missionStarted || !/^encounter_/.test(progression.state)) return true;
    if (window.tutorialSystem?.isActive?.() || window.cutsceneSystem?.isPlaying?.() ||
        window.hackingSystem?.isActive?.() || window.rhythmSystem?.isActive?.()) return true;
    if (game.collectionMessage || window.loreSystem?.currentLore || BARCODE.combatFX?.ampNotice) return true;
    // Pending entrances are threats too: never put a call over their warnings.
    if (progression.pendingSpawns?.length || progression.activeEncounterId ||
        window.enemyManager?.enemies?.some(enemy => enemy?.active && !enemy._defeatRecorded)) return true;
    const body = window.player?.getHitbox?.();
    const project = BARCODE.sceneProjection?.worldToScreen?.bind(BARCODE.sceneProjection);
    if (body && project) {
      const a = project({ x: body.x, y: body.y });
      const b = project({ x: body.x + body.width, y: body.y + body.height });
      if (b.x > CARD.x - 20 && a.x < CARD.x + CARD.w + 20 &&
          b.y > CARD.y - 20 && a.y < CARD.y + CARD.h + 20) return true;
    }
    return false;
  }

  function panel(ctx, x, y, w, h, cut = 18) {
    ctx.beginPath(); ctx.moveTo(x + cut, y); ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - cut, y + h); ctx.lineTo(x, y + h); ctx.closePath();
  }

  BARCODE.BroadcastComic = {
    reset() { this.queued = false; this.played = false; this.elapsedMs = 0; },
    queueFirstBlock(encounterId) {
      if (encounterId !== 'encounter_1' || this.queued || this.played) return false;
      this.queued = true;
      return true;
    },
    update(deltaTime) {
      if (!this.queued || this.played || blocked()) return;
      this.elapsedMs = Math.min(TOTAL_MS, this.elapsedMs + Math.max(0, Number.isFinite(deltaTime) ? deltaTime : 0));
      if (this.elapsedMs >= TOTAL_MS) { this.played = true; this.queued = false; }
    },
    getView() {
      if (!this.queued || this.played || this.elapsedMs < WAIT_MS || blocked()) return null;
      let age = this.elapsedMs - WAIT_MS;
      let index = 0;
      while (index < LINES.length - 1 && age >= LINES[index].ms) { age -= LINES[index].ms; index++; }
      const fade = Math.min(1, (this.elapsedMs - WAIT_MS) / 180, (TOTAL_MS - this.elapsedMs) / 350);
      return { ...LINES[index], index, age, fade: Math.max(0, fade),
        // The stamp breaks after Cliff's line. With reduced flashes, the
        // layout changes directly, without fragments or the quick rotation.
        breakProgress: index < 2 ? 0 : Math.min(1, index > 2 ? 1 : age / 440),
        reduced: window.BARCODE_RENDER_QUALITY?.flashes === false };
    },
    draw(ctx) {
      const view = this.getView();
      if (!view) return;
      ctx.save();
      try {
        ctx.globalAlpha *= view.fade;
        ctx.shadowBlur = 0; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        // Narrow outer frame only. No full-screen wash, shake or time stop.
        ctx.strokeStyle = '#9cedc0'; ctx.lineWidth = 2;
        const progress = view.reduced ? Number(view.index >= 2) : view.breakProgress;
        ctx.beginPath(); ctx.moveTo(35, 270); ctx.lineTo(35, 218); ctx.lineTo(132, 218); ctx.stroke();
        if (progress < 1) {
          ctx.save(); ctx.globalAlpha *= 1 - progress;
          ctx.translate(1838, 218 + progress * 100); ctx.rotate(progress * 0.45);
          ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(47, 0); ctx.lineTo(47, 52); ctx.stroke(); ctx.restore();
        }
        if (progress < 1) {
          ctx.save();
          ctx.translate(CARD.x + CARD.w - 263 + progress * 94, CARD.y + 34 + progress * 90);
          ctx.rotate(-0.055 + progress * 0.36); ctx.globalAlpha *= 1 - progress;
          ctx.fillStyle = '#151719'; ctx.fillRect(-10, -32, 276, 47);
          ctx.strokeStyle = '#f3c66b'; ctx.lineWidth = 3; ctx.strokeRect(-10, -32, 276, 47);
          ctx.fillStyle = '#f3c66b'; ctx.font = 'bold 25px monospace'; ctx.fillText('ACCESS RESTRICTED', 4, 0);
          ctx.restore();
        }
        // Offset paper shadow and clipped corner echo the existing barcode UI.
        panel(ctx, CARD.x + 7, CARD.y + 58, CARD.w, 153);
        ctx.fillStyle = '#040807'; ctx.fill();
        panel(ctx, CARD.x, CARD.y + 49, CARD.w, 153);
        ctx.fillStyle = 'rgba(7, 17, 19, 0.97)'; ctx.fill();
        ctx.strokeStyle = view.color; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#a3bdbe'; ctx.font = '15px monospace';
        ctx.fillText('SIGNAL ALLEY  /  BACKSTAGE LINE', CARD.x + 28, CARD.y + 80);
        ctx.fillStyle = view.color; ctx.font = 'bold 24px monospace';
        ctx.fillText(view.speaker, CARD.x + 28, CARD.y + 117);
        ctx.fillStyle = '#f3f5e8'; ctx.font = '24px monospace';
        // Deliberate authored wrap; no font squeezing or tiny mobile text.
        const words = view.text.split(' '); let line = ''; const lines = [];
        for (const word of words) {
          const candidate = line ? line + ' ' + word : word;
          if (line && ctx.measureText(candidate).width > CARD.w - 65) { lines.push(line); line = word; }
          else line = candidate;
        }
        lines.push(line);
        lines.forEach((text, i) => ctx.fillText(text, CARD.x + 28, CARD.y + 154 + i * 29));
        if (view.index >= 2) {
          ctx.fillStyle = '#a8ff70'; ctx.font = 'bold 18px monospace';
          ctx.fillText('SIGNAL ALLEY  /  OPEN', CARD.x + 29, CARD.y + 22);
          if (!view.reduced && progress < 1) {
            ctx.strokeStyle = '#f3c66b'; ctx.lineWidth = 3;
            for (let i = 0; i < 7; i++) {
              const x = CARD.x + CARD.w - 195 + i * 39;
              const y = CARD.y + 7 + Math.sin(i * 2) * progress * 56;
              ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8 + progress * 12, y + 6); ctx.stroke();
            }
          }
        }
        ctx.fillStyle = view.color;
        for (let i = 0; i < 4; i++) { ctx.globalAlpha = view.fade * (i === view.index ? 1 : 0.22); ctx.fillRect(CARD.x + CARD.w - 126 + i * 22, CARD.y + 104, 13, 5); }
      } finally { ctx.restore(); }
    },
    getDiagnostics() { return { queued: this.queued, played: this.played, elapsedMs: this.elapsedMs, visible: !!this.getView() }; }
  };
  BARCODE.BroadcastComic.reset();
})();
