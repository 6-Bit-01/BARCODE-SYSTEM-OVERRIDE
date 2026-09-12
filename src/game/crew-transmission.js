// A safe tutorial-to-mission handoff. Existing update/render/input owners drive
// every state; this scene never pauses, seeks or replaces the music transport.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/crew-transmission.js', exports: ['BARCODE.CrewTransmission'], dependencies: ['BARCODE.LoreRecords'] });
(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const panels = Object.freeze([
    { title: 'A WAY THROUGH THE STATIC', image: 5, lines: [
      ['CACHE BACK', 'Four blocked channels. Twenty hostiles between you and a clean carrier.'],
      ['MAC MODEM', 'Clear the street. Once their cover drops, we can trace the Jammer.']] },
    { title: 'KEEP THE CHANNEL OPEN', image: 7, lines: [
      ['DJ FLOPPYDISC', 'The beat keeps running when you move. Plant your feet when you need to hit back.'],
      ['6 BIT', 'I can walk and listen. It is the street that is off-beat.']] },
    { title: 'PLEASE REMAIN INSIDE THE PANEL', image: 5, lines: [
      ['CLIFF / INTERCOM', 'I fixed the divider. Nothing should escape through the margin now.'],
      ['SHEILA / INTERCOM', 'Cliff. The stage direction is leaving.']] },
    { title: 'DEAD AIR DISTRICT', image: 10, lines: [
      ['6 BIT', 'Clear the district. Find the Jammer. Then we find who is holding the signal.'],
      ['CACHE BACK', 'We are still here, 6. Keep us on the line.']] }
  ]);
  BARCODE.CrewTransmission = {
    active: false, index: 0, elapsedMs: 0, inspectedGutter: false,
    reset() { this.active = false; this.index = 0; this.elapsedMs = 0; this.inspectedGutter = false; },
    start() {
      if (this.active) return false;
      this.active = true; this.index = 0; this.elapsedMs = 0;
      window.rhythmSystem?.hideRhythmMode?.();
      window.player?.stopHorizontal?.(); window.inputManager?.resetActionEdges?.();
      return true;
    },
    update(ms) { if (this.active && !window.gameState?.paused && !window.isPaused && Number.isFinite(ms)) this.elapsedMs += Math.max(0, ms); },
    finish() { this.active = false; window.inputManager?.resetActionEdges?.(); },
    input(key) {
      if (!this.active) return false;
      if (key === 'escape') { this.finish(); return true; }
      if (key === 'arrowleft' && this.index === 2) { this.inspectedGutter = true; return true; }
      if ((key === ' ' || key === 'enter') && this.elapsedMs >= 250) {
        if (++this.index >= panels.length) this.finish();
        else { this.elapsedMs = 0; window.inputManager?.resetActionEdges?.(); }
      }
      return true;
    },
    draw(ctx) {
      if (!this.active) return;
      const panel = panels[this.index], pad = BARCODE.GamepadUI?.connected;
      ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(2,8,18,0.96)'; ctx.fillRect(0, 0, 1920, 1080);
      const text = (line, x, y, size, color = '#ecf3ff') => {
        ctx.font = `${size}px monospace`; ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(line, x, y);
      };
      text('CREW LINK / DEAD AIR DISTRICT', 120, 84, 23, '#90ffe0');
      text(`${String(this.index + 1).padStart(2, '0')} / 04`, 1640, 84, 23, '#cbaaff');
      ctx.fillStyle = '#102233'; ctx.fillRect(120, 150, 1000, 510);
      const art = window.cutsceneSystem?.cutsceneImages?.[panel.image]?.element;
      if (art?.width && art?.height) {
        // Contain the existing image; do not invent a new character portrait.
        const scale = Math.min(1000 / art.width, 510 / art.height);
        const w = art.width * scale, h = art.height * scale;
        ctx.drawImage(art, 120 + (1000 - w) / 2, 150 + (510 - h) / 2, w, h);
      }
      ctx.strokeStyle = '#90ffe0'; ctx.lineWidth = 3; ctx.strokeRect(120, 150, 1000, 510);
      ctx.fillStyle = '#172136'; ctx.fillRect(1160, 150, 640, 510);
      text('CARRIER / CREW', 1190, 184, 22, '#cbaaff');
      ['6 BIT', 'DJ FLOPPYDISC', 'CACHE BACK', 'MAC MODEM'].forEach((name, i) => {
        const speaking = panel.lines.some(line => line[0] === name);
        ctx.fillStyle = speaking ? '#17443f' : '#202c42'; ctx.fillRect(1190, 248 + i * 76, 580, 54);
        text(name, 1210, 263 + i * 76, 23, speaking ? '#a3ffe7' : '#afbcd1');
      });
      text(this.index === 2 ? 'MAINTENANCE INTERCOM CONNECTED' : 'FOUR CHANNELS. ONE BROADCAST.', 1190, 592, 19, '#cbaaff');
      const drift = this.index === 2 ? Math.min(1, this.elapsedMs / 900) * 62 : 0;
      // The caption physically crosses the gutter; reduced-effects settings
      // retain a static displaced caption and the same readable information.
      const shift = window.BARCODE_RENDER_QUALITY?.flashes === false ? (this.index === 2 ? 62 : 0) : drift;
      ctx.fillStyle = '#d8c6ff'; ctx.fillRect(156 - shift, 601, 830, 48);
      text(panel.title, 174 - shift, 613, 23, '#101525');
      panel.lines.forEach(([speaker, dialogue], index) => {
        const y = 711 + index * 106;
        text(speaker, 120, y, 21, index ? '#cbaaff' : '#90ffe0');
        ctx.font = '27px monospace';
        BARCODE.LoreRecords.wrap(ctx, dialogue, 1660).forEach((line, i) => text(line, 120, y + 32 + i * 33, 27));
      });
      if (this.index === 2) text(this.inspectedGutter ? 'STUDIO RATS: WE WILL KEEP THIS FOR LATER.' : (pad ? 'D-pad Left: inspect the loose caption' : 'Left Arrow: inspect the loose caption'), 120, 942, 20, '#e7d287');
      text(pad ? 'A: Continue    B: Skip crew link    Start: Pause' : 'Space / Enter: Continue    Esc: Skip crew link    P: Pause', 120, 1008, 21, '#a5b7cc');
      ctx.restore();
    },
    getDiagnostics() { return { active: this.active, panel: this.index, inspected: this.inspectedGutter ? ['egg.comic.gutter'] : [] }; }
  };
})();
