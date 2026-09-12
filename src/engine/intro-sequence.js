// The opening's script and comic page renderer. CutsceneSystem owns its clock,
// input, assets and lifetime; this module owns no listeners, timers or audio.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/intro-sequence.js', exports: ['BARCODE.IntroSequence'], dependencies: [] });
(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const panels = Object.freeze([
    { beat: 'O1', title: 'LEAVE THE ROOM NOISE IN', image: 0, layout: 'room', stamp: 'BARCODE / ON AIR', lines: [
      ['DJ FLOPPYDISC', 'One more pass. Leave the room noise in.'],
      ['6 BIT', "That's the part that proves somebody's here."]] },
    { beat: 'O1', title: 'KEEP THE TAKE', image: 0, layout: 'links', stamp: 'DEAD AIR DISTRICT / LIVE', lines: [
      ['MAC MODEM', "Street relays are open. You're reaching the whole district."],
      ['CACHE BACK', 'Rolling. Names, mistakes, everything. This one stays.']] },
    { beat: 'O2', title: 'THEN THE RETURN GOES QUIET', image: 1, layout: 'failure', stamp: 'NO BROADCAST DETECTED', lines: [
      ['DJ FLOPPYDISC', 'We were on the air a second ago.'],
      ['6 BIT', 'Then your detector needs a new job.']] },
    { beat: 'O3', title: 'SAVE THE PART IT WANTS GONE', image: 5, layout: 'archive', stamp: 'RECOVERY REQUEST: DISCARD UNREADABLE AUDIO', lines: [
      ['CACHE BACK', "It wants a clean copy. I've locked the original."],
      ['MAC MODEM', "The outside route is still there. I'm getting you access."]] },
    { beat: 'O3', title: 'LISTEN UNDER THE STATIC', image: 6, layout: 'listen', stamp: 'CREW CHANNEL / STILL OPEN', lines: [
      ['DJ FLOPPYDISC', "There's still something under that noise. Don't wipe it."],
      ['6 BIT', 'Keep listening. Tell me when it changes.']] },
    { beat: 'O4', title: '6 BIT HAS OTHER PLANS', image: 3, layout: 'refusal', stamp: 'PLEASE WAIT FOR AUTOMATIC RECOVERY', lines: [
      ['6 BIT', "Automatic recovery can wait. I'm going outside."],
      ['MAC MODEM', "Good. I can open the way. I can't walk it for you."]] },
    { beat: 'O5', title: 'START WITH THIS DISTRICT', image: 10, layout: 'tower', stamp: 'TOWER UPLINK / BLOCKED', lines: [
      ['MAC MODEM', 'The interference runs toward the tower. Street level is jammed.'],
      ['6 BIT', 'Then we get the neighborhood talking first. The tower can hear us coming.']] },
    { beat: 'O5', title: 'DEAD AIR DISTRICT', image: 2, layout: 'handoff', stamp: 'RESTORE THE LOCAL SIGNAL. FIND THE JAMMER.', lines: [
      ['CACHE BACK', 'We are still here, 6. Keep us on the line.'],
      ['6 BIT', 'All four of us. Leave it open.']] }
  ].map(panel => Object.freeze({ ...panel, lines: Object.freeze(panel.lines.map(line => Object.freeze(line))) })));
  const ink = '#080b19', paper = '#ddd7ed', mint = '#95ffe0', pink = '#f696d9';
  const crew = ['6 BIT', 'DJ FLOPPYDISC', 'CACHE BACK', 'MAC MODEM'];
  const text = (ctx, line, x, y, size = 24, color = paper, bold = false) => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px monospace`; ctx.fillStyle = color;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(line, x, y);
  };
  function wrap(ctx, value, width) {
    const lines = []; let line = '';
    for (const word of value.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }
  function art(ctx, images, index, x, y, width, height, crop = null) {
    ctx.fillStyle = '#152235'; ctx.fillRect(x, y, width, height);
    const source = images?.[index]?.element;
    const sw = source?.naturalWidth || source?.width, sh = source?.naturalHeight || source?.height;
    if (sw && sh) {
      const area = crop || [0, 0, 1, 1];
      const scale = Math.min(width / (sw * area[2]), height / (sh * area[3]));
      const dw = sw * area[2] * scale, dh = sh * area[3] * scale;
      ctx.drawImage(source, sw * area[0], sh * area[1], sw * area[2], sh * area[3], x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
    } else {
      text(ctx, 'CHANNEL IMAGE UNAVAILABLE', x + 24, y + 34, 19, '#a4afc9');
    }
    ctx.strokeStyle = paper; ctx.lineWidth = 5; ctx.strokeRect(x, y, width, height);
  }
  // These are the already approved monitor labels, not invented portraits.
  const macCrop = [0.351, 0.26, 0.155, 0.166];
  const cacheCrop = [0.352, 0.432, 0.157, 0.183];
  BARCODE.IntroSequence = {
    panels, inspectedGutter: false,
    reset() { this.inspectedGutter = false; },
    inspect(index) { if (panels[index]?.layout !== 'refusal') return false; this.inspectedGutter = true; return true; },
    transcript(index) {
      const panel = panels[index];
      return panel ? `${panel.title}. ${panel.stamp}. ${panel.lines.map(line => line.join(': ')).join(' ')}` : '';
    },
    draw(ctx, { index = 0, elapsedMs = 0, images = [], pad = false, skipProgress = 0, holding = false } = {}) {
      const panel = panels[index]; if (!ctx || !panel) return;
      ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.fillStyle = ink; ctx.fillRect(0, 0, 1920, 1080);
      // Printed page marks and thick panel borders bridge the illustrated
      // broadcast into the pixel game without claiming new character art.
      ctx.fillStyle = '#241e36';
      for (let y = 18; y < 1040; y += 18) for (const x of [28, 44, 1876, 1892]) ctx.fillRect(x, y, 3, 3);
      ctx.fillStyle = pink; ctx.fillRect(96, 48, 130, 31);
      text(ctx, 'BARCODE', 108, 52, 22, ink, true);
      text(ctx, 'SYSTEM OVERRIDE / OPENING TRANSMISSION', 248, 54, 21, '#a9b4ca');
      text(ctx, `${String(index + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`, 1680, 54, 24, mint);
      text(ctx, panel.title, 96, 103, 36, paper, true);
      art(ctx, images, panel.image, 96, 166, 1168, 532);
      const right = (image, y, crop) => art(ctx, images, image, 1312, y, 512, 246, crop);
      if (['links', 'archive'].includes(panel.layout)) {
        right(7, 166, macCrop); right(7, 452, cacheCrop);
      } else if (panel.layout === 'failure') {
        right(5, 166); right(2, 452, [0.18, 0.12, 0.65, 0.58]);
      } else if (panel.layout === 'refusal') {
        right(7, 166, macCrop); right(5, 452);
      } else if (panel.layout === 'tower' || panel.layout === 'handoff') {
        right(panel.layout === 'handoff' ? 10 : 5, 166);
        ctx.fillStyle = '#191e32'; ctx.fillRect(1312, 452, 512, 246);
        ctx.strokeStyle = paper; ctx.lineWidth = 5; ctx.strokeRect(1312, 452, 512, 246);
        text(ctx, 'FIRST: THE NEIGHBORHOOD', 1340, 482, 24, mint, true);
        text(ctx, 'Open the street.', 1340, 534, 26);
        text(ctx, 'Find the Jammer.', 1340, 574, 26);
        text(ctx, 'Keep the crew connected.', 1340, 636, 20, '#bdabda');
      } else {
        right(panel.layout === 'listen' ? 1 : 6, 166);
        ctx.fillStyle = '#191e32'; ctx.fillRect(1312, 452, 512, 246);
        ctx.strokeStyle = paper; ctx.lineWidth = 5; ctx.strokeRect(1312, 452, 512, 246);
        text(ctx, 'FOUR CHANNELS / ONE BROADCAST', 1336, 472, 22, pink, true);
        crew.forEach((name, i) => {
          const speaking = panel.lines.some(line => line[0] === name);
          ctx.fillStyle = speaking ? mint : '#566578'; ctx.fillRect(1338, 523 + i * 40, 8, 8);
          text(ctx, name, 1364, 517 + i * 40, 24, speaking ? mint : '#bdc6d8');
        });
      }
      // One plot-linked breach: the recovery order slides out of its panel
      // when 6 Bit rejects it. Reduced effects preserve its displaced endpoint.
      const displace = panel.layout === 'refusal' ? 84 * (window.BARCODE_RENDER_QUALITY?.flashes === false ? 1 : Math.min(1, elapsedMs / 650)) : 0;
      const sx = 140 - displace, sy = 620;
      ctx.fillStyle = ink; ctx.fillRect(sx + 7, sy + 8, 1040, 54);
      ctx.fillStyle = panel.layout === 'failure' || panel.layout === 'refusal' ? pink : mint;
      ctx.fillRect(sx, sy, 1040, 54);
      text(ctx, panel.stamp, sx + 20, sy + 15, 23, ink, true);
      if (panel.layout === 'handoff') {
        ctx.fillStyle = mint;
        for (let i = 0; i < 10; i++) ctx.fillRect(1246 + (i % 3) * 12, 190 + i * 46, 8, 8);
      }
      panel.lines.forEach(([speaker, dialogue], i) => {
        const x = 96 + i * 884;
        ctx.fillStyle = i ? '#211b31' : '#112932'; ctx.fillRect(x, 744, 844, 194);
        ctx.strokeStyle = i ? pink : mint; ctx.lineWidth = 2; ctx.strokeRect(x, 744, 844, 194);
        text(ctx, speaker, x + 24, 762, 22, i ? pink : mint, true);
        ctx.font = '29px monospace';
        wrap(ctx, dialogue, 796).forEach((line, j) => text(ctx, line, x + 24, 804 + j * 36, 29));
      });
      if (panel.layout === 'refusal') text(ctx, this.inspectedGutter ? 'MARGIN NOTE: "WAIT" IS NOT A PLAN.' : `${pad ? 'D-pad Left' : 'Left Arrow'}: inspect the displaced caption`, 96, 963, 20, '#e4cb93');
      const next = index === panels.length - 1 ? 'Enter Dead Air District' : 'Next panel';
      text(ctx, pad ? `A: ${next}    Hold B / S for 5s: Skip intro` : `Space / Enter / Click: ${next}    Hold S for 5s: Skip intro`, 96, 1016, 21, '#bcc8db');
      if (holding) {
        ctx.fillStyle = '#42284d'; ctx.fillRect(1376, 978, 448, 12);
        ctx.fillStyle = pink; ctx.fillRect(1376, 978, 448 * skipProgress, 12);
        text(ctx, `SKIPPING IN ${(5 * (1 - skipProgress)).toFixed(1)}s / RELEASE TO CANCEL`, 1376, 1000, 16, pink);
      }
      ctx.restore();
    },
    getDiagnostics() { return { panels: panels.length, inspected: this.inspectedGutter ? ['egg.comic.gutter'] : [] }; }
  };
})();
