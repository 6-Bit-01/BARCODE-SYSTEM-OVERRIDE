// The opening's script and comic page renderer. CutsceneSystem owns its clock,
// input, assets and lifetime; this module owns no listeners, timers or audio.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/intro-sequence.js', exports: ['BARCODE.IntroSequence'], dependencies: [] });
(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  // Immutable public copies survive Makko imports without a binary asset root.
  const assetRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/a747b58411650146bdc003a529d0470167d275db/';
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
  ].map(panel => Object.freeze({ ...panel, hostedAsset: assetRoot + panel.asset, lines: Object.freeze(panel.lines.map(line => Object.freeze(line))) })));
  const ink = '#090b15', paper = '#f1eadd', mint = '#95ffe0', pink = '#f696d9';
  const crewColors = { '6 BIT': '#e6e5ee', 'DJ FLOPPYDISC': '#83e9ff', 'CACHE BACK': '#ffd65c', 'MAC MODEM': '#ff929c' };
  const frame = Object.freeze({ x: 48, y: 140, w: 1824, h: 828 });
  // Authored against the actual illustrations. Tails end below the speaking
  // face; offscreen voices use a receiver card instead of a false face pointer.
  // These coordinates deliberately leave the tape lock, scope, door hand,
  // tower, Cliff's face and the four supplied likenesses visible.
  const compositions = [
    { stamp: [90, 176, 420], balloons: [
      { x: 1060, y: 644, w: 736, tail: [1260, 524] },
      { x: 132, y: 794, w: 790, tail: [635, 618] }] },
    { stamp: [90, 176, 350], balloons: [
      { x: 104, y: 752, w: 744, tail: [593, 594] },
      { x: 1098, y: 788, w: 700, tail: [1370, 674] }] },
    { stamp: [104, 616, 526], balloons: [
      { x: 646, y: 676, w: 540, tail: [868, 602] },
      { x: 1254, y: 798, w: 556, tail: [1390, 626] }] },
    { stamp: [748, 838, 412], balloons: [
      { x: 92, y: 766, w: 610, tail: [459, 634] },
      { x: 1188, y: 742, w: 628, tail: [1408, 610] }] },
    { stamp: [980, 178, 630], balloons: [
      { x: 94, y: 750, w: 746, tail: [620, 612] },
      { x: 1184, y: 786, w: 632, radio: true }] },
    { stamp: [110, 526, 626], balloons: [
      { x: 1044, y: 672, w: 758, tail: [1212, 584] },
      { x: 104, y: 770, w: 732, radio: true }] },
    { stamp: [1340, 870, 464], balloons: [
      { x: 768, y: 180, w: 512, radio: true },
      { x: 660, y: 698, w: 750, tail: [518, 520] }] },
    { stamp: [1090, 858, 714], balloons: [
      { x: 1128, y: 672, w: 674, radio: true },
      { x: 140, y: 796, w: 752, tail: [662, 582] }] }
  ];
  const text = (ctx, line, x, y, size = 24, color = paper, bold = false, family = 'monospace') => {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${family}`; ctx.fillStyle = color;
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
  function polygon(ctx, points) {
    ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  }
  function cutBox(ctx, x, y, w, h, cut = 16) {
    polygon(ctx, [[x + cut, y], [x + w, y], [x + w, y + h - cut], [x + w - cut, y + h], [x, y + h], [x, y + cut]]);
  }
  function drawArt(ctx, images, index) {
    const { x, y, w, h } = frame;
    ctx.fillStyle = '#152235'; ctx.fillRect(x, y, w, h);
    const item = images?.[index], source = item?.element;
    const sw = source?.naturalWidth || source?.width, sh = source?.naturalHeight || source?.height;
    if (sw && sh) {
      const scale = Math.min(w / sw, h / sh), dw = sw * scale, dh = sh * scale;
      ctx.drawImage(source, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    } else {
      text(ctx, item?.status === 'unavailable' ? 'SCENE ART UNAVAILABLE' : 'TUNING THE PICTURE...', 730, 466, 28, mint, true);
    }
    ctx.strokeStyle = paper; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = '#282235'; ctx.lineWidth = 2; ctx.strokeRect(x - 9, y - 9, w + 18, h + 18);
  }
  function balloonLayout(ctx, dialogue, placement) {
    ctx.font = 'bold 30px sans-serif';
    const lines = wrap(ctx, dialogue, placement.w - 60);
    return { ...placement, h: 78 + lines.length * 36, lines };
  }
  function balloon(ctx, speaker, layout, serial) {
    const { x, y, w, h, tail, radio, lines } = layout;
    const accent = crewColors[speaker], fill = radio ? '#101a2b' : paper;
    ctx.save(); ctx.lineJoin = 'round';
    if (tail) {
      const baseX = Math.max(x + 54, Math.min(x + w - 68, tail[0]));
      polygon(ctx, [[baseX - 22, y + 8], tail, [baseX + 20, y + 8]]);
      ctx.fillStyle = fill; ctx.strokeStyle = ink; ctx.lineWidth = 10; ctx.stroke(); ctx.fill();
    }
    cutBox(ctx, x + 9, y + 10, w, h); ctx.fillStyle = ink; ctx.fill();
    cutBox(ctx, x, y, w, h); ctx.strokeStyle = ink; ctx.lineWidth = 10; ctx.stroke(); ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = radio ? accent : '#c8bfaf'; ctx.lineWidth = 2; ctx.stroke();
    // Printed channel tab + small reading-order marker, with actual dialogue
    // in larger proportional lettering instead of terminal body copy.
    ctx.font = 'bold 21px monospace';
    const label = radio ? `${speaker} / COMMS` : speaker;
    const labelWidth = ctx.measureText(label).width + 38;
    cutBox(ctx, x + 22, y - 17, labelWidth, 39, 7); ctx.fillStyle = accent; ctx.fill();
    text(ctx, label, x + 40, y - 9, 21, ink, true);
    text(ctx, `0${serial}`, x + w - 58, y + 22, 17, radio ? accent : '#716b65', true);
    if (radio) {
      ctx.fillStyle = accent;
      for (let i = 0; i < 4; i++) ctx.fillRect(x + w - 71 + i * 9, y - 12 - i * 4, 5, 10 + i * 4);
      ctx.fillRect(x + 13, y + 38, 3, h - 65);
    }
    lines.forEach((line, i) => text(ctx, line, x + 30, y + 45 + i * 36, 30, radio ? paper : ink, true, 'sans-serif'));
    // Two short registration marks give the card a printed, imperfect edge.
    ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(x - 13, y + 34); ctx.lineTo(x - 13, y + 57);
    ctx.moveTo(x + w - 46, y + h + 16); ctx.lineTo(x + w - 15, y + h + 16); ctx.stroke();
    ctx.restore();
  }
  function stamp(ctx, panel, placement, elapsedMs, reduced) {
    let [x, y, w] = placement;
    if (panel.layout === 'refusal') x -= 52 * (reduced ? 1 : Math.min(1, elapsedMs / 650));
    const accent = ['failure', 'refusal', 'archive'].includes(panel.layout) ? pink : mint;
    ctx.font = 'bold 21px monospace';
    const lines = wrap(ctx, panel.stamp, w - 36), h = 26 + lines.length * 27;
    ctx.fillStyle = ink; ctx.fillRect(x + 6, y + 7, w, h);
    ctx.fillStyle = accent; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    lines.forEach((line, i) => text(ctx, line, x + 18, y + 13 + i * 27, 21, ink, true));
  }
  BARCODE.IntroSequence = {
    panels, inspectedGutter: false,
    reset() { this.inspectedGutter = false; },
    inspect(index) { if (panels[index]?.layout !== 'refusal') return false; this.inspectedGutter = true; return true; },
    transcript(index) {
      const panel = panels[index];
      return panel ? `${panel.title}. ${panel.visual} ${panel.stamp}. ${panel.lines.map(line => line.join(': ')).join(' ')}` : '';
    },
    getDialogueLayouts(ctx, index) {
      return panels[index]?.lines.map((line, i) => balloonLayout(ctx, line[1], compositions[index].balloons[i])) || [];
    },
    draw(ctx, { index = 0, elapsedMs = 0, images = [], pad = false, skipProgress = 0, holding = false } = {}) {
      const panel = panels[index]; if (!ctx || !panel) return;
      const reduced = window.BARCODE_RENDER_QUALITY?.flashes === false;
      ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      ctx.fillStyle = ink; ctx.fillRect(0, 0, 1920, 1080);
      ctx.fillStyle = pink; ctx.fillRect(48, 25, 163, 38);
      text(ctx, 'BARCODE', 62, 30, 26, ink, true);
      text(ctx, 'SYSTEM OVERRIDE / OPENING TRANSMISSION', 235, 35, 20, '#a9b4ca');
      text(ctx, panel.title, 48, 77, 36, paper, true, 'sans-serif');
      text(ctx, `${String(index + 1).padStart(2, '0')} / 08`, 1710, 32, 27, mint, true);
      for (let i = 0; i < panels.length; i++) {
        ctx.fillStyle = i <= index ? mint : '#2b3040'; ctx.fillRect(1698 + i * 22, 86, 14, i === index ? 15 : 5);
      }
      drawArt(ctx, images, panel.image);
      stamp(ctx, panel, compositions[index].stamp, elapsedMs, reduced);
      this.getDialogueLayouts(ctx, index).forEach((layout, i) => balloon(ctx, panel.lines[i][0], layout, i + 1));
      if (panel.layout === 'refusal') text(ctx, this.inspectedGutter ? 'MARGIN NOTE: "WAIT" IS NOT A PLAN.' : `${pad ? 'D-pad Left' : 'Left Arrow'}: inspect the displaced recovery order`, 48, 990, 20, '#e4cb93');
      else text(ctx, index < 2 ? 'STUDIO FEED / ORIGINAL TAKE' : index < 6 ? 'SIGNAL LOST. CREW STILL HERE.' : 'NEXT STOP / DEAD AIR DISTRICT', 48, 990, 19, '#9daabc');
      const next = index === panels.length - 1 ? 'Enter Dead Air District' : 'Next panel';
      text(ctx, pad ? `A: ${next}` : `Space / Enter / Click: ${next}`, 48, 1030, 22, paper);
      if (holding) {
        ctx.fillStyle = '#42284d'; ctx.fillRect(1340, 1015, 528, 9);
        ctx.fillStyle = pink; ctx.fillRect(1340, 1015, 528 * skipProgress, 9);
        text(ctx, `SKIPPING IN ${(5 * (1 - skipProgress)).toFixed(1)}s / RELEASE TO CANCEL`, 1340, 1034, 17, pink);
      } else text(ctx, pad ? 'Hold B / S for 5s: Skip intro' : 'Hold S for 5s: Skip intro', 1370, 1032, 22, '#b5bdcd');
      ctx.restore();
    },
    getDiagnostics() { return { panels: panels.length, inspected: this.inspectedGutter ? ['egg.comic.gutter'] : [] }; }
  };
})();
