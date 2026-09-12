// The opening's script and comic page renderer. CutsceneSystem owns its clock,
// input, assets and lifetime; this module owns no listeners, timers or audio.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/intro-sequence.js', exports: ['BARCODE.IntroSequence'], dependencies: [] });
(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const panels = Object.freeze([
    { beat: 'O1', title: 'LEAVE THE ROOM NOISE IN', image: 0, asset: 'assets/intro/intro-01-broadcast.webp', layout: 'room', visual: '6 Bit and DJ Floppydisc work the mixing desk in a warm, lived-in studio.', stamp: 'BARCODE / ON AIR', lines: [
      ['DJ FLOPPYDISC', 'One more pass. Leave the room noise in.'],
      ['6 BIT', "That's the part that proves somebody's here."]] },
    { beat: 'O1', title: 'KEEP THE TAKE', image: 1, asset: 'assets/intro/intro-02-keep-the-take.webp', layout: 'links', visual: 'Mac connects the patch bay while Cache records. Behind them, Cliff checks a cable beneath a coffee mug, clipboard in hand.', stamp: 'DEAD AIR DISTRICT / LIVE', lines: [
      ['MAC MODEM', "Street relays are open. You're reaching the whole district."],
      ['CACHE BACK', 'Rolling. Names, mistakes, everything. This one stays.']] },
    { beat: 'O2', title: 'THEN THE RETURN GOES QUIET', image: 2, asset: 'assets/intro/intro-03-dead-return.webp', layout: 'failure', visual: 'The receiver falls to a flat trace and static. 6 Bit leans toward it; DJ stops at the faders.', stamp: 'NO BROADCAST DETECTED', lines: [
      ['DJ FLOPPYDISC', 'We were on the air a second ago.'],
      ['6 BIT', 'Then your detector needs a new job.']] },
    { beat: 'O3', title: 'SAVE THE PART IT WANTS GONE', image: 3, asset: 'assets/intro/intro-04-preserve.webp', layout: 'archive', visual: 'Cache locks the original recording against overwriting. Mac opens the outside access circuit.', stamp: 'RECOVERY REQUEST: DISCARD UNREADABLE AUDIO', lines: [
      ['CACHE BACK', "It wants a clean copy. I've locked the original."],
      ['MAC MODEM', "The outside route is still there. I'm getting you access."]] },
    { beat: 'O3', title: 'LISTEN UNDER THE STATIC', image: 4, asset: 'assets/intro/intro-05-listen.webp', layout: 'listen', visual: 'DJ isolates a faint surviving signal. Two traces remain on the scope beneath the noise.', stamp: 'CREW CHANNEL / STILL OPEN', lines: [
      ['DJ FLOPPYDISC', "There's still something under that noise. Don't wipe it."],
      ['6 BIT', 'Keep listening. Tell me when it changes.']] },
    { beat: 'O4', title: '6 BIT HAS OTHER PLANS', image: 5, asset: 'assets/intro/intro-06-refusal.webp', layout: 'refusal', visual: '6 Bit pushes open the studio door and looks back toward his crew as the recovery caption slips out of its frame.', stamp: 'PLEASE WAIT FOR AUTOMATIC RECOVERY', lines: [
      ['6 BIT', "Automatic recovery can wait. I'm going outside."],
      ['MAC MODEM', "Good. I can open the way. I can't walk it for you."]] },
    { beat: 'O5', title: 'START WITH THIS DISTRICT', image: 6, asset: 'assets/intro/intro-07-district.webp', layout: 'tower', visual: 'Beyond 6 Bit, a wet street of shuttered music shops leads toward the distant lattice broadcast tower.', stamp: 'TOWER UPLINK / BLOCKED', lines: [
      ['MAC MODEM', 'The interference runs toward the tower. Street level is jammed.'],
      ['6 BIT', 'Then we get the neighborhood talking first. The tower can hear us coming.']] },
    { beat: 'O5', title: 'DEAD AIR DISTRICT', image: 7, asset: 'assets/intro/intro-08-keep-it-open.webp', layout: 'handoff', visual: '6 Bit steps into the district, listening to the crew. All four channels remain connected.', stamp: 'RESTORE THE LOCAL SIGNAL. FIND THE JAMMER.', lines: [
      ['CACHE BACK', 'We are still here, 6. Keep us on the line.'],
      ['6 BIT', 'All four of us. Leave it open.']] }
  ].map(panel => Object.freeze({ ...panel, lines: Object.freeze(panel.lines.map(line => Object.freeze(line))) })));
  const ink = '#080b19', paper = '#ddd7ed', mint = '#95ffe0', pink = '#f696d9';
  const crew = ['6 BIT', 'DJ FLOPPYDISC', 'CACHE BACK', 'MAC MODEM'];
  const crewColors = { '6 BIT': '#e6e5ee', 'DJ FLOPPYDISC': '#83e9ff', 'CACHE BACK': '#ffd65c', 'MAC MODEM': '#ff929c' };
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
  function signalDetail(ctx, x, y, listening, elapsedMs, reduced) {
    ctx.fillStyle = '#101e29'; ctx.fillRect(x, y, 512, 246);
    ctx.strokeStyle = paper; ctx.lineWidth = 5; ctx.strokeRect(x, y, 512, 246);
    text(ctx, listening ? 'UNDER THE STATIC' : 'RETURN CHANNEL', x + 24, y + 22, 23, listening ? mint : pink, true);
    ctx.strokeStyle = '#24404a'; ctx.lineWidth = 1;
    for (let row = 0; row < 4; row++) { ctx.beginPath(); ctx.moveTo(x + 24, y + 84 + row * 32); ctx.lineTo(x + 488, y + 84 + row * 32); ctx.stroke(); }
    // A restrained presentation cue, not a second audio/rhythm clock. The
    // two opposing traces seed the later record comparison without naming it.
    const phase = reduced ? 0 : Math.min(2000, elapsedMs) / 600;
    const traces = listening ? [1, -1] : [0];
    traces.forEach((sign, row) => {
      ctx.strokeStyle = row ? pink : mint; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 116; i++) {
        const wave = sign * (Math.sin(i * 0.22 + phase) + Math.sin(i * 0.66 + phase) * 0.25) * 18;
        const px = x + 24 + i * 4, py = y + (listening ? 112 + row * 64 : 144) + wave;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
    });
    text(ctx, listening ? 'STILL HERE.' : 'A MOMENT AGO: LIVE.', x + 24, y + 211, 18, '#a8bec8');
  }
  function crewDetail(ctx, panel, y) {
    ctx.fillStyle = '#171b2b'; ctx.fillRect(1312, y, 512, 246);
    ctx.strokeStyle = paper; ctx.lineWidth = 5; ctx.strokeRect(1312, y, 512, 246);
    text(ctx, 'FOUR CHANNELS / ONE BROADCAST', 1336, y + 20, 22, paper, true);
    crew.forEach((name, i) => {
      const speaking = panel.lines.some(line => line[0] === name);
      ctx.fillStyle = crewColors[name]; ctx.fillRect(1338, y + 71 + i * 40, speaking ? 12 : 6, 8);
      text(ctx, name, 1364, y + 65 + i * 40, 24, crewColors[name]);
    });
  }
  BARCODE.IntroSequence = {
    panels, inspectedGutter: false,
    reset() { this.inspectedGutter = false; },
    inspect(index) { if (panels[index]?.layout !== 'refusal') return false; this.inspectedGutter = true; return true; },
    transcript(index) {
      const panel = panels[index];
      return panel ? `${panel.title}. ${panel.visual} ${panel.stamp}. ${panel.lines.map(line => line.join(': ')).join(' ')}` : '';
    },
    draw(ctx, { index = 0, elapsedMs = 0, images = [], pad = false, skipProgress = 0, holding = false } = {}) {
      const panel = panels[index]; if (!ctx || !panel) return;
      ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.fillStyle = ink; ctx.fillRect(0, 0, 1920, 1080);
      // The supplied models govern every visible character in these eight
      // scenes. Printed frames and details bridge their art into pixel play.
      ctx.fillStyle = '#241e36';
      for (let y = 18; y < 1040; y += 18) for (const x of [28, 44, 1876, 1892]) ctx.fillRect(x, y, 3, 3);
      ctx.fillStyle = pink; ctx.fillRect(96, 48, 130, 31);
      text(ctx, 'BARCODE', 108, 52, 22, ink, true);
      text(ctx, 'SYSTEM OVERRIDE / OPENING TRANSMISSION', 248, 54, 21, '#a9b4ca');
      text(ctx, `${String(index + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`, 1680, 54, 24, mint);
      text(ctx, panel.title, 96, 103, 36, paper, true);
      art(ctx, images, panel.image, 96, 166, 1168, 532);
      const right = (image, y, crop) => art(ctx, images, image, 1312, y, 512, 246, crop);
      if (panel.layout === 'links') {
        right(1, 166, [0.16, 0.01, 0.27, 0.40]); right(1, 452, [0.59, 0.02, 0.34, 0.46]);
      } else if (panel.layout === 'archive') {
        right(3, 166, [0.28, 0.48, 0.29, 0.39]); right(3, 452, [0.60, 0.02, 0.36, 0.49]);
      } else if (panel.layout === 'failure') {
        signalDetail(ctx, 1312, 166, false, elapsedMs, true);
        right(2, 452, [0.57, 0.01, 0.35, 0.47]);
      } else if (panel.layout === 'refusal') {
        right(3, 166, [0.63, 0.02, 0.34, 0.46]); right(5, 452, [0.015, 0.13, 0.33, 0.45]);
      } else if (panel.layout === 'tower') {
        right(6, 166, [0.59, 0.02, 0.29, 0.44]);
        ctx.fillStyle = '#191e32'; ctx.fillRect(1312, 452, 512, 246);
        ctx.strokeStyle = paper; ctx.lineWidth = 5; ctx.strokeRect(1312, 452, 512, 246);
        text(ctx, 'FIRST: THE NEIGHBORHOOD', 1340, 482, 24, mint, true);
        text(ctx, 'Open the street.', 1340, 534, 26);
        text(ctx, 'Find the Jammer.', 1340, 574, 26);
        text(ctx, 'Keep the crew connected.', 1340, 636, 20, '#bdabda');
      } else if (panel.layout === 'listen') {
        signalDetail(ctx, 1312, 166, true, elapsedMs, window.BARCODE_RENDER_QUALITY?.flashes === false);
        crewDetail(ctx, panel, 452);
      } else {
        if (panel.layout === 'handoff') right(1, 166, [0.59, 0.02, 0.34, 0.46]);
        else right(0, 166, [0.51, 0.015, 0.34, 0.46]);
        crewDetail(ctx, panel, 452);
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
        const accent = crewColors[speaker];
        ctx.fillStyle = '#030611'; ctx.fillRect(x + 7, 751, 844, 194);
        ctx.fillStyle = '#131b29'; ctx.fillRect(x, 744, 844, 194);
        ctx.strokeStyle = paper; ctx.lineWidth = 2; ctx.strokeRect(x, 744, 844, 194);
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = accent; ctx.fillRect(x + 16, 752, ctx.measureText(speaker).width + 32, 37);
        text(ctx, speaker, x + 32, 760, 22, ink, true);
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
