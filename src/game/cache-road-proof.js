// Cache Back chase slice. It shares the existing input/RAF/audio/save/pause
// owners and awards no Level 2 campaign facts.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/cache-road-proof.js', exports: ['BARCODE.CacheRoadProof'], dependencies: ['BARCODE.Campaign', 'BARCODE.MusicTransport'] });
(function(B) {
  'use strict';
  const ID = 'level-02', PROFILE = 'level-02.proof';
  const LAP = 2460, END = 4 * LAP, GATE = 3 * LAP + 2060;
  const ZONE_COST = 60, ZONE_WINDOW = 16;
  const LANES = ['DRIVE', 'FLOW', 'BREAKAWAY', 'UNDERCURRENT'];
  const CHECKPOINTS = { 'road-start': 0, 'road-cache': 850, 'road-fork': 1700,
    'road-verse-2': 28, 'road-verse-3': 52, 'road-verse-4': 76,
    'road-gate': 92, 'road-clear': 100 };
  const TRAFFIC = [
    [190, 1, 'freight'], [275, 2, 'van'], [350, 0, 'block'], [465, 2, 'sweeper'],
    [550, 1, 'block'], [635, 2, 'freight'], [735, 0, 'van'], [895, 3, 'block'],
    [975, 1, 'freight'], [1050, 2, 'block'], [1135, 0, 'audit'], [1220, 3, 'van'],
    [1320, 1, 'block'], [1415, 2, 'sweeper'], [1510, 0, 'freight'], [1610, 3, 'van'],
    [1765, 1, 'freight'], [1840, 2, 'block'], [1930, 0, 'van'], [2005, 1, 'sweeper'],
    [2170, 2, 'audit'], [2265, 0, 'block'], [2345, 1, 'freight']
  ];
  // Paired traffic narrows the route at readable, repeatable places. Its open
  // lanes rotate each pass; a driver can always plan a route from the horizon.
  const GATES = { 550: [2], 975: [2, 3], 1320: [0], 1840: [1], 2005: [3], 2345: [2] };
  const HAZARDS = TRAFFIC.flatMap(([at, lane, kind]) => Array.from({ length: 5 }, (_, pass) => [
    { at: at + pass * LAP, lane: (lane + pass) % 4, kind },
    ...(GATES[at] || []).map(extra => ({ at: at + pass * LAP,
      lane: (extra + pass) % 4, kind: 'block' }))
  ]).flat());
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function mirrorExpression(s) {
    if (s.stumbleMs > 0) return 4;
    if (s.invulnerableMs > 0) return 6;
    if (s.integrity <= 1 || s.timeMs < 8000 || s.status === 'failed') return 5;
    if (s.boostMs > 0 || s.musicBeatFloat < s.zoneEndBeat || s.status === 'clear') return 2;
    if (s.cutFlashMs > 0 || (s.messageMs > 0 && /NEAR MISS/.test(s.message))) return 3;
    if (s.pendingCapture || s.candidateHold > .2 || s.rivalWarning) return 1;
    return 0;
  }

  function mirrorOutline(ctx, x, y, w, h) {
    ctx.beginPath(); ctx.moveTo(x + 16, y); ctx.lineTo(x + w - 16, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + 16);
    ctx.lineTo(x + w - 7, y + h - 12);
    ctx.quadraticCurveTo(x + w - 9, y + h, x + w - 24, y + h);
    ctx.lineTo(x + 24, y + h);
    ctx.quadraticCurveTo(x + 9, y + h, x + 7, y + h - 12);
    ctx.lineTo(x, y + 16); ctx.quadraticCurveTo(x, y, x + 16, y);
    ctx.closePath();
  }

  // One piece of glass contains both the passing road and Cache's eyes.
  function drawRearview(ctx, s, accent, reduced) {
    const x = 638, y = 12, w = 690, h = 117;
    const expression = mirrorExpression(s);
    const edge = expression === 4 ? '#ff7c89' : expression === 5 ? '#f7b376' :
      expression === 2 ? '#f6d188' : '#8fe3db';
    const phase = reduced ? 0 : s.progress;
    ctx.fillStyle = '#45616f'; ctx.fillRect(x + 338, 0, 14, 14);
    ctx.fillStyle = '#25394a'; mirrorOutline(ctx, x - 6, y - 5, w + 12, h + 10); ctx.fill();
    ctx.fillStyle = edge; mirrorOutline(ctx, x - 3, y - 2, w + 6, h + 4); ctx.fill();
    ctx.save(); mirrorOutline(ctx, x, y, w, h); ctx.clip();
    const glass = ctx.createLinearGradient(0, y, 0, y + h);
    glass.addColorStop(0, '#0e1b2d'); glass.addColorStop(.53, '#394a60');
    glass.addColorStop(1, '#10232e');
    ctx.fillStyle = glass; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = accent; ctx.globalAlpha = .17;
    ctx.beginPath(); ctx.arc(x + 407 - phase * .012 % 55, y + 32, 30, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    const skylineShift = phase * .13 % 38;
    for (let i = -1; i < 20; i++) {
      const bx = x + i * 38 - skylineShift;
      const bh = 15 + ((i * 19 + 17) % 5) * 6;
      ctx.fillStyle = i % 3 ? '#203442' : '#29394c';
      ctx.fillRect(bx, y + 58 - bh, 33, bh);
      ctx.fillStyle = '#e8b991'; ctx.globalAlpha = .17;
      ctx.fillRect(bx + 8, y + 51 - bh, 2, 2); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = '#223d47'; ctx.fillRect(x, y + 56, w, h - 56);
    ctx.beginPath(); ctx.moveTo(x + 251, y + 55); ctx.lineTo(x + 307, y + 55);
    ctx.lineTo(x + 548, y + h); ctx.lineTo(x + 10, y + h); ctx.closePath();
    ctx.fillStyle = '#142a36'; ctx.fill();
    ctx.strokeStyle = '#82999e'; ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(x + 279 + side * 28, y + 56);
      ctx.lineTo(x + 279 + side * 268, y + h); ctx.stroke();
    }
    for (let i = 0; i < 7; i++) {
      const t = ((i * 84 + phase * 1.6) % 588) / 588;
      const yy = y + 57 + t * 62;
      ctx.strokeStyle = '#d3d4c5'; ctx.globalAlpha = .18 + t * .46;
      ctx.lineWidth = 1 + t * 2;
      ctx.beginPath(); ctx.moveTo(x + 279, yy); ctx.lineTo(x + 279, yy + 2 + t * 17); ctx.stroke();
      for (const side of [-1, 1]) {
        const postX = x + 279 + side * (34 + t * 266);
        ctx.strokeStyle = '#9ee6d6'; ctx.globalAlpha = .12 + t * .33;
        ctx.beginPath(); ctx.moveTo(postX, yy + 7); ctx.lineTo(postX, yy - 3 - t * 16); ctx.stroke();
        ctx.fillStyle = '#e2ffdc'; ctx.fillRect(postX - 2, yy - 5 - t * 16, 3 + t * 3, 3);
      }
    }
    ctx.globalAlpha = 1;
    // Cache sits on the driver's side. Both eyes face the windshield for
    // ordinary driving. The impact cell braces facing forward; after that
    // brief flinch, the separate recovery cell checks the mirror behind him.
    // The portrait has its own alpha silhouette. Keep the face opaque so the
    // reflected road never shows through his glasses, skin or mask.
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (!B.PresentationAssets?.draw?.('cacheMirror', ctx, {
      x: x + 180, y: y + h/2, width: 250, height: 111,
      sourceRect: [24, 150, 464, 210], frame: expression })) {
      ctx.fillStyle = '#d9aa4c'; ctx.beginPath();
      ctx.arc(x + 57, y + 50, 58, Math.PI, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#142632'; ctx.fillRect(x, y + 65, 122, 52);
      ctx.fillStyle = '#f4e0b1'; ctx.fillRect(x + 52, y + 58, 28, 8);
    }
    // Shared glare and scan marks pass over both the road and Cache's face.
    ctx.strokeStyle = '#c8eef0'; ctx.globalAlpha = .24; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 23, y + 15); ctx.lineTo(x + 159, y + 3);
    ctx.lineTo(x + w - 32, y + 3); ctx.stroke();
    ctx.globalAlpha = .12; ctx.fillStyle = '#9ac9cb';
    ctx.fillRect(x + 10, y + 75, w - 20, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#d8eee3'; ctx.font = 'bold 12px Oxanium, monospace';
    ctx.textAlign = 'left'; ctx.fillText('REAR VIEW', x + 19, y + 24);
    if (expression === 4) {
      ctx.fillStyle = '#ff74857d'; ctx.fillRect(x + 5, y + 87, w - 10, 3);
    }
    ctx.restore();
  }
  // Every supplied stem runs for the complete song. Some recorded passages
  // are softer, but that is not a reason to reject their lane captures.
  const laneAvailable = (lane, bar) => lane >= 0 && lane < LANES.length &&
    bar >= 0 && bar < 100;
  const availableFor = (lane, startBar, endBar) =>
    startBar >= 0 && endBar <= 100 && startBar < endBar && laneAvailable(lane, startBar);
  const nextStrip = bar => (Math.floor(bar / 4) + 1) * 4;
  const songSection = bar => {
    if (bar < 4) return 'INTRO';
    if (bar >= 100) return 'TAPE END';
    const phase = (bar - 4) % 24, cycle = 1 + Math.floor((bar - 4) / 24);
    return phase < 8 ? `VERSE ${cycle} A` : phase < 16 ? `VERSE ${cycle} B` : `CHORUS ${cycle}`;
  };
  const stackSize = state => Math.max(1, new Set(state.captures.map(capture => capture.lane)).size);
  const legacyPoint = { 'road-start': 0, 'road-cache': 850, 'road-fork': 1700,
    'road-gate': 2070, 'road-clear': LAP };
  function migrateProof(proof, version) {
    if (version === 4) return proof;
    const old = version === 3 ? proof : {
      ...proof, lane: [0, 0, 1, 3][proof.lane] ?? 0,
      lanePos: [0, 0, 1, 3][Math.round(proof.lanePos ?? proof.lane)] ?? 0,
      musicBar: Math.min(99, Math.floor(proof.progress / (54 * 1.875))) };
    // Indefinite old locks have no bar expiry. Refund them instead of turning
    // an old save into a permanent four-part stack.
    return { ...old, locked: [], lockEnergy: clamp((proof.lockEnergy ?? 65) +
      60 * (proof.locked || []).length, 0, 100) };
  }
  const roadCurve = progress => Math.sin(progress / 190) * 0.72 + Math.sin(progress / 410) * 0.24;
  const hazardLane = (hazard, progress, audits) => {
    if (hazard.kind === 'audit') return audits[hazard.at] ?? hazard.lane;
    if (hazard.kind === 'sweeper') return hazard.lane + clamp((progress - (hazard.at - 165)) / 120, 0, 1);
    return hazard.lane;
  };

  const PALETTE = ['#69d9f5', '#ffc077', '#cd9dff', '#91f5bc'];
  const polygon = (ctx, points, fill) => {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  };
  const grit = n => { const v=Math.sin(n*78.233+12.9898)*43758.5453; return v-Math.floor(v); };
  function drawGrimyPlume(ctx,x,y,phase,spread,strength,colors,direction=1) {
    ctx.save();
    for(let i=0;i<15;i++) {
      const age=((phase*.013+i*.171+grit(i*11+spread))%1+1)%1;
      const wobble=Math.sin(age*8+i*3.9)*spread*.13;
      const sideways=(grit(i*17+spread)-.5)*spread*.75+age*spread*.32*direction;
      const xx=x+sideways+wobble, yy=y+age*spread*.85;
      const opacity=strength*(1-age)*(.34+grit(i*13)*.33);
      ctx.globalAlpha=opacity;
      ctx.strokeStyle=i%4===0?colors[1]:colors[0];
      ctx.lineWidth=Math.max(1.5,spread*(.036+.052*grit(i*7))*(1-age));
      ctx.beginPath(); ctx.moveTo(xx-spread*.08*direction,yy-spread*.19);
      ctx.quadraticCurveTo(xx+spread*.12*direction,yy-spread*.12,
        xx+spread*(.10+.16*grit(i*5))*direction,yy+spread*.035); ctx.stroke();
      ctx.globalAlpha=opacity*.22; ctx.fillStyle=i%3===0?colors[1]:colors[0];
      ctx.beginPath();ctx.ellipse(xx,yy,spread*(.044+.05*grit(i*19))*(1-age),
        spread*(.028+.025*grit(i*23))*(1-age),-.35,0,Math.PI*2);ctx.fill();
      if(i%2===0) {
        ctx.fillStyle=i%3===0?colors[1]:colors[0];
        const fleck=1+spread*.025*(1-age);
        ctx.fillRect(xx+spread*.14*direction,yy+spread*.04,fleck,fleck*.6);
      }
    }
    ctx.restore();
  }
  // One silhouette language at every depth. The four traffic kinds differ in
  // body shape, lights and warning marks even without reading their labels.
  function drawVehicle(ctx, x, y, w, h, kind, { alpha = 1, turbo = false,
    phase = 0, steer = 0, hit = 0, reduced = false } = {}) {
    const artKey = kind === 'cache' ? hit ? 'cacheCarHit' : steer < -.08 ?
      'cacheCarRight' : steer > .08 ? 'cacheCarLeft' : 'cacheCar' :
      ({ freight: 'cacheFreight', van: 'cacheCourier', block: 'cacheBarricade',
        rival: 'cacheRival' })[kind];
    if (artKey && B.PresentationAssets?.ready?.(artKey)) {
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= alpha;
      const ratio = kind === 'block' ? [1.12, 1.28] : kind === 'freight' ? [1.27, 1.19] : [1.28, 1.32];
      const impact = hit && !reduced ? 1-clamp(hit/650,0,1) : 0;
      const recoil = impact ? Math.exp(-5*impact)*Math.sin(impact*17) : 0;
      const sway = reduced || kind === 'block' ? 0 :
        Math.sin(phase*(kind === 'freight' ? .055 : .082)+x*.009)*.65 +
        Math.sin(phase*(kind === 'freight' ? .105 : .15)+x*.016)*.35;
      const bounce = sway*h*(kind === 'freight' ? .085 : .044) - Math.abs(recoil)*h*.08;
      const jolt = recoil*w*.075;
      const roll = reduced ? 0 : (kind === 'cache' ? steer*.025 : 0) + recoil*.07;
      const art = { x: 0, y: 1, width: w*ratio[0], height: h*ratio[1] };
      const anchored = kind !== 'block';
      const freight = kind === 'freight';
      const tires = anchored ? [-1,1].map(side => {
        const pos = kind === 'cache' && !hit && steer < -.08 ?
          (side < 0 ? -.51 : .38) : kind === 'cache' && !hit && steer > .08 ?
            (side < 0 ? -.38 : .51) : side*(freight ? .32 : .44);
        return { x: w*pos, top: -h*(freight ? .27 : .39),
          height: h*(freight ? .25 : .30), width: w*(freight ? .15 : .125) };
      }) : [];
      ctx.fillStyle = '#06132099'; ctx.beginPath();
      ctx.ellipse(0, 6, w*(.56-Math.max(0,-bounce/h)*.15),
        Math.max(4,h*.10), 0, 0, Math.PI*2); ctx.fill();
      if(turbo && !reduced) {
        for(let i=0;i<2;i++) {
          ctx.save(); ctx.globalAlpha*=.29+i*.09;
          ctx.rotate((i?-.09:.08)+Math.sin(phase*.045+i)*.06);
          B.PresentationAssets?.draw?.('cacheSpeedMist',ctx,{
            x:(i?1:-1)*w*.27,y:h*.46+i*7,
            width:w*(1.17+i*.23),height:h*(.48+i*.12),flip:!!i });
          ctx.restore();
        }
        drawGrimyPlume(ctx,-w*.21,-h*.09,phase+7,h*.73,.9,
          ['#8ed4d5','#495360'], -1);
        drawGrimyPlume(ctx,w*.16,-h*.08,phase+29,h*.85,.83,
          ['#e9ab68','#555968'],1);
      }
      if (!reduced && kind === 'cache') {
        // Thin wet spray begins at the two contact patches, not at the roof.
        for (const tire of tires) {
          for (let i=0; i<4; i++) {
            const cycle = ((phase*.7+i*8+tire.x) % 32+32) % 32;
            const drift = (tire.x < 0 ? -1 : 1)*(7+cycle*.56);
            ctx.strokeStyle = i%2 ? '#a4e8ef70' : '#e9d0ae6a';
            ctx.lineWidth = Math.max(.8,w*.008)*(1-cycle/44);
            ctx.beginPath(); ctx.moveTo(tire.x,2+cycle*.42);
            ctx.lineTo(tire.x+drift,5+cycle*.84); ctx.stroke();
          }
        }
      }
      // The recovered images include both wheels. Paint their original pixels
      // at road contact, then draw the bouncing chassis around those areas.
      for (const tire of tires) {
        ctx.save(); ctx.beginPath();
        ctx.roundRect(tire.x-tire.width/2,tire.top,tire.width,tire.height,Math.max(1,tire.width*.2));
        ctx.clip(); B.PresentationAssets.draw(artKey, ctx, art); ctx.restore();
      }
      ctx.save(); ctx.translate(jolt,bounce); ctx.rotate(roll);
      if (anchored) {
        ctx.beginPath(); ctx.rect(-art.width/2,-art.height,art.width,art.height+2);
        for (const tire of tires)
          ctx.roundRect(tire.x-tire.width/2-jolt,tire.top-bounce,tire.width,tire.height,
            Math.max(1,tire.width*.2));
        ctx.clip('evenodd');
      }
      B.PresentationAssets.draw(artKey, ctx, art);
      ctx.restore();
      for (const tire of tires) {
        const top = tire.top+h*(freight ? .04 : .06);
        const tireH = h*(freight ? .16 : .19);
        const tireW = tire.width*.61;
        ctx.save(); ctx.beginPath();
        ctx.roundRect(tire.x-tireW/2,top,tireW,tireH,Math.max(1,tireW*.24)); ctx.clip();
        ctx.fillStyle = '#0a111ca8'; ctx.fillRect(tire.x-tireW/2,top,tireW,tireH);
        const pitch = tireH/4;
        const offset = reduced ? 0 : ((phase*(freight ? .53 : .42)) % pitch + pitch) % pitch;
        for (let tread=-1; tread<5; tread++) {
          const yy = top+tread*pitch+offset;
          ctx.fillStyle = freight ? '#8a98a6cc' : '#7e8c9bc9';
          ctx.fillRect(tire.x-tireW*.37,yy,tireW*.3,Math.max(1,pitch*.3));
          ctx.fillStyle = '#5d7082bd';
          ctx.fillRect(tire.x+tireW*.06,yy+pitch*.24,tireW*.3,Math.max(1,pitch*.3));
        }
        ctx.restore();
      }
      if (kind === 'cache' && !hit && Math.abs(steer) > .08) {
        // A side rim becomes visible only while turning. Its narrow ellipse
        // spins inside the actual wheel rather than beside the car.
        const wx = (steer < 0 ? 1 : -1)*w*.40;
        const wy = -h*(steer < 0 ? .30 : .34);
        const rx = w*.020, ry = h*.072;
        ctx.save(); ctx.beginPath(); ctx.ellipse(wx,wy,rx,ry,0,0,Math.PI*2); ctx.clip();
        ctx.fillStyle = '#18202bd7'; ctx.fillRect(wx-rx,wy-ry,rx*2,ry*2);
        ctx.strokeStyle = '#d9b477d9'; ctx.lineWidth = Math.max(.8,w*.007);
        ctx.beginPath(); ctx.ellipse(wx,wy,rx*.92,ry*.92,0,0,Math.PI*2); ctx.stroke();
        for (let spoke=0; spoke<4; spoke++) {
          const angle=(reduced ? 0 : phase*.18)+spoke*Math.PI/2;
          ctx.beginPath(); ctx.moveTo(wx,wy);
          ctx.lineTo(wx+Math.cos(angle)*rx*.76,wy+Math.sin(angle)*ry*.76); ctx.stroke();
        }
        ctx.restore();
      }
      ctx.restore(); return;
    }
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= alpha;
    if (!reduced && kind !== 'block')
      ctx.translate(0, Math.sin(phase*.18+x*.04)*Math.max(1,h*.03));
    ctx.fillStyle = '#07111da9'; ctx.beginPath();
    ctx.ellipse(0, 7, w * 0.62, Math.max(4, h * 0.13), 0, 0, Math.PI * 2); ctx.fill();
    if (kind === 'block') {
      polygon(ctx, [[-w*.57,0],[-w*.54,-h*.64],[-w*.43,-h*.77],[w*.43,-h*.77],[w*.54,-h*.64],[w*.57,0]], '#f0a35b');
      polygon(ctx, [[-w*.47,-h*.59],[w*.47,-h*.59],[w*.44,-h*.13],[-w*.44,-h*.13]], '#2b3149');
      for (let i = -1; i <= 1; i++) polygon(ctx,
        [[(i-.42)*w/3,-h*.59],[(i+.08)*w/3,-h*.59],[(i+.42)*w/3,-h*.13],[(i-.08)*w/3,-h*.13]], '#ffe5a9');
      ctx.fillStyle = '#ff5f7b'; ctx.fillRect(-w*.48,-h*.78,w*.22,h*.1); ctx.fillRect(w*.26,-h*.78,w*.22,h*.1);
    } else if (kind === 'freight') {
      ctx.fillStyle = '#0b1e30'; ctx.fillRect(-w*.57,-h*.22,w*.17,h*.29); ctx.fillRect(w*.40,-h*.22,w*.17,h*.29);
      polygon(ctx, [[-w*.49,-h*.06],[-w*.49,-h*.88],[-w*.38,-h],[w*.38,-h],[w*.49,-h*.88],[w*.49,-h*.06]], '#657d89');
      polygon(ctx, [[-w*.40,-h*.89],[w*.40,-h*.89],[w*.42,-h*.28],[-w*.42,-h*.28]], '#19384d');
      ctx.strokeStyle = '#91c8d1'; ctx.lineWidth = Math.max(1,w*.018); ctx.strokeRect(-w*.38,-h*.86,w*.76,h*.56);
      ctx.fillStyle = '#d0dee0'; ctx.fillRect(-w*.025,-h*.86,w*.05,h*.58);
      ctx.fillStyle = '#ff8275'; ctx.fillRect(-w*.42,-h*.19,w*.19,h*.09); ctx.fillRect(w*.23,-h*.19,w*.19,h*.09);
    } else {
      const player = kind === 'cache' || kind === 'echo';
      const body = kind === 'rival' ? '#f9f6ee' : kind === 'audit' ? '#f1eee9' : kind === 'sweeper' ? '#e5a15f' :
        kind === 'van' ? '#4c8fc0' : kind === 'echo' ? '#b7f8ff' : turbo ? '#fbe3a3' : '#61e7d4';
      if(turbo&&!reduced)
        drawGrimyPlume(ctx,0,-h*.08,phase,h*.9,.85,['#e8a469','#5e626a']);
      ctx.fillStyle = '#0b1726'; ctx.fillRect(-w*.55,-h*.35,w*.15,h*.4); ctx.fillRect(w*.4,-h*.35,w*.15,h*.4);
      polygon(ctx, [[-w*.47,0],[-w*.53,-h*.48],[-w*.32,-h*.67],[w*.32,-h*.67],[w*.53,-h*.48],[w*.47,0]], body);
      polygon(ctx, [[-w*.33,-h*.59],[-w*.25,-h*.91],[w*.25,-h*.91],[w*.33,-h*.59]],
        kind === 'audit' || kind === 'rival' ? '#8f9ba6' : '#163b52');
      ctx.fillStyle = kind === 'audit' || kind === 'rival' ? '#fb6087' : kind === 'sweeper' ? '#fff2a8' : '#ffc077';
      ctx.fillRect(-w*.43,-h*.22,w*.23,h*.105); ctx.fillRect(w*.2,-h*.22,w*.23,h*.105);
      ctx.fillStyle = '#132239'; ctx.fillRect(-w*.16,-h*.19,w*.32,h*.11);
      if (player) {
        ctx.strokeStyle = '#eaffef'; ctx.lineWidth = Math.max(2,w*.024);
        ctx.beginPath(); ctx.moveTo(-w*.56,-h*.62); ctx.lineTo(w*.56,-h*.62); ctx.stroke();
        ctx.fillStyle = '#edfff4';
        ctx.beginPath(); ctx.arc(-w*.11,-h*.73,w*.045,0,Math.PI*2); ctx.arc(w*.11,-h*.73,w*.045,0,Math.PI*2); ctx.fill();
        ctx.font = `bold ${Math.max(8,w*.115)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText(kind === 'echo' ? 'REPLAY' : 'CACHE', 0, -h*.32);
        if (kind === 'echo') {
          ctx.strokeStyle = '#dfffff'; ctx.lineWidth = Math.max(2,w*.03);
          ctx.strokeRect(-w*.56,-h*.94,w*1.12,h*1.05);
        }
      } else if (kind === 'rival') {
        ctx.fillStyle = '#fc5c91'; ctx.fillRect(-w*.42,-h*.53,w*.84,h*.1);
        ctx.fillStyle = '#19334a'; ctx.font = `bold ${Math.max(8,w*.12)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('COPY', 0, -h*.31);
        ctx.strokeStyle = '#ffacc1'; ctx.lineWidth = Math.max(2,w*.03);
        ctx.beginPath(); ctx.moveTo(-w*.58,-h*.65); ctx.lineTo(w*.58,-h*.65); ctx.stroke();
      } else if (kind === 'audit') {
        polygon(ctx, [[0,-h*.94],[-w*.09,-h*.75],[0,-h*.7],[w*.09,-h*.75]], '#fd497f');
        ctx.fillStyle = '#fb6087'; ctx.fillRect(-w*.24,-h*.48,w*.48,h*.095);
      } else if (kind === 'sweeper') {
        ctx.fillStyle = '#fff0a8'; ctx.font = `bold ${Math.max(10,w*.22)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('>', 0, -h*.31);
      } else {
        ctx.fillStyle = '#9ae8ff'; ctx.fillRect(-w*.2,-h*.52,w*.4,h*.09);
      }
    }
    if (kind !== 'block') {
      ctx.strokeStyle = '#c3d9de'; ctx.lineWidth = Math.max(1,w*.012);
      for (const side of [-1,1]) {
        const xx = side*w*.475, yy = -h*.15, radius = Math.max(2,w*.055);
        ctx.beginPath(); ctx.arc(xx,yy,radius,0,Math.PI*2); ctx.stroke();
        for (let spoke=0; spoke<3; spoke++) {
          const angle=(reduced ? 0 : phase*.25)+spoke*Math.PI*2/3;
          ctx.beginPath(); ctx.moveTo(xx,yy);
          ctx.lineTo(xx+Math.cos(angle)*radius*.8,yy+Math.sin(angle)*radius*.8);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function newState(saved = {}) {
    const progress = saved.progress ?? 0;
    const lanePos = saved.lanePos ?? saved.lane ?? 1;
    return { progress, lanePos, lane: Math.round(lanePos), visualLane: lanePos,
      captures: [], queuedCaptures: [], pendingCapture: null, candidateLane: null, candidateSince: null,
      candidateHold: 0, candidateBar: saved.musicBar ?? 0,
      previewLane: null, previewBeat: null,
      lastSnapStartBar: -1, hitRecovery: false,
      cutMarks: {}, cutStreak: 0, cutFlashMs: 0, cutAward: 0,
      musicBeatFloat: (saved.musicBar ?? 0) * 4,
      scoredThrough: (saved.musicBar ?? 0) - 1, damagedBar: -1,
      score: saved.score ?? 0, peakStack: saved.peakStack ?? 1,
      cleanBars: saved.cleanBars ?? 0, stumbleMs: 0,
      integrity: saved.integrity ?? 3,
      speed: saved.speed ?? 44, timeMs: saved.timeMs ?? 55000,
      musicBar: saved.musicBar ?? 0, gateAt: saved.gateAt ?? null,
      // Keep the saved field name so version-4 road checkpoints still load.
      lockEnergy: saved.lockEnergy ?? 0, zoneEndBeat: -1,
      echoEnergy: saved.echoEnergy ?? (progress >= 1700 ? 100 : 65),
      boost: saved.boost ?? 1, boostMs: 0, invulnerableMs: 0, nearMisses: 0,
      steer: 0, braking: false, trace: [], echo: null, echoDeceptions: 0,
      audits: {}, drafted: {}, draftMs: 0,
      nextRivalAt: progress >= 3 * LAP + 1700 ? progress + 120 : 3 * LAP + 1810,
      rivalTarget: 1.5, rivalLane: 1.5, rivalWarning: false,
      rivalEchoCommitted: false, rivalDistractedMs: 0,
      // Road lessons are momentary guidance, not save or music state.
      opening: { held: false, sealed: false, turbo: false, echo: false, auditFollowedEcho: false },
      message: '', messageMs: 0,
      gateOpen: !!saved.gateOpen, gateFailure: null,
      status: saved.status || 'playing', elapsedMs: 0 };
  }

  const road = B.CacheRoadProof = {
    active: false, status: null, state: null, returnTo: null, pending: false,
    exiting: false, audioDegraded: false, oldHint: null,
    setHint() {
      const hint = document.querySelector?.('.hint');
      if (!hint) return;
      if (this.oldHint === null) this.oldHint = hint.textContent;
      hint.textContent = 'Hold a lane .5s: choose its part for the next bar | One choice per bar; dodge after choosing | E/RB: once per 4 bars, now + next 4 | Space/A Turbo | H/Y Echo';
    },
    openingCue() {
      if (this.status !== 'playing' || !this.state) return null;
      const s = this.state, at = s.progress;
      const button = (action, keyboard, pad) => B.ControllerSettings?.prompt(action, keyboard) ||
        (B.GamepadUI?.connected ? pad : keyboard);
      if (at < 300) {
        if (!s.opening.held && at < 170) return ['HOLD A LANE FOR HALF A SECOND',
          `Steer with ${B.GamepadUI?.connected ? 'STICK / D-PAD' : 'LEFT / RIGHT'}. Its music joins on the next bar.`];
        if (!s.opening.sealed && at < 190) return ['FREIGHT AHEAD — KEEP THIS PART',
          `Press ${button('inspect', 'E', 'RB')} to play it now and through the next four bars.`];
        return ['FREIGHT AHEAD', 'Steer out of its lane. The part you kept stays with you.'];
      }
      if (at >= 465 && at < 650) {
        if (!s.opening.turbo && s.boost > 0) return ['TWO LANES BLOCKED AHEAD',
          `Outside lanes are open. Press ${button('jump', 'SPACE', 'A')} at the block for a short Turbo burst.`];
        return ['TWO LANES BLOCKED AHEAD', 'Take an outside lane through the gap.'];
      }
      if (at >= 850 && at < 1135) {
        if (at < 975) {
          if (s.echo) return ['ECHO SENT — SCAN AHEAD',
            'Hold far left through the block. Move away from the Echo after it.'];
          if (s.echoEnergy >= 100) return ['SCAN AHEAD — SEND AN ECHO',
            `Hold far left at the block. Press ${button('interact', 'H', 'Y')} near it, then move away.`];
          return ['SCAN AHEAD', 'Hold far left through the block. Dodge the audit car.'];
        }
        return s.opening.auditFollowedEcho ? ['THE SCAN FOLLOWED YOUR ECHO',
          'Steer away from its lane to keep the original recording safe.'] :
          ['THE SCAN LOCKED ON', 'Change lanes before the audit car reaches you.'];
      }
      return null;
    },
    selectMusicProfile() {
      const selected = B.MusicProfiles?.select(PROFILE);
      const loaded = selected && B.MusicTransport?.load(PROFILE);
      return { ok: selected?.profileId === PROFILE && loaded?.status === 'ok' };
    },
    checkAudioAssets() {
      const tracks = window.audioSystem?.musicTracks || {};
      this.audioDegraded = B.MusicProfiles.get(PROFILE).arrangement.sources.some(source =>
        !tracks[source.sourceId]?.buffer || tracks[source.sourceId].isFallback ||
        Math.abs(tracks[source.sourceId].buffer.duration - 187.5) > 0.08);
      return !this.audioDegraded;
    },
    validate(saved) {
      const s = saved?.levelState, p = s?.proof;
      const legacy = s?.proofVersion < 3;
      return saved?.levelId === ID && [1, 2, 3, 4].includes(s?.proofVersion) &&
        Object.hasOwn(CHECKPOINTS, saved.checkpointId) &&
        (legacy || s?.proofVersion === 4 || !['road-cache', 'road-fork'].includes(saved.checkpointId)) &&
        s.returnTo?.checkpointId === 'intermission' &&
        B.Campaign.validateLevel01Checkpoint(s.returnTo) &&
        Number.isFinite(p?.progress) && p.progress >= 0 && p.progress <= (legacy ? LAP : 15000) &&
        (legacy ? Math.abs(p.progress - legacyPoint[saved.checkpointId]) <= 1 :
          Number.isInteger(p.musicBar) && p.musicBar >= 0 && p.musicBar <= 100 &&
          (saved.checkpointId === 'road-start' ? p.progress === 0 :
            saved.checkpointId === 'road-cache' ? p.progress >= 850 && p.progress < 860 :
            saved.checkpointId === 'road-fork' ? p.progress >= 1700 && p.progress < 1710 :
            saved.checkpointId === 'road-clear' ? p.musicBar >= 99 :
              ['road-gate', 'road-verse-2', 'road-verse-3', 'road-verse-4'].includes(saved.checkpointId))) &&
        Number.isInteger(p.lane) && p.lane >= 0 && p.lane < 4 &&
        Number.isInteger(p.integrity) && p.integrity >= 1 && p.integrity <= 3 &&
        (s.proofVersion === 1 ||
          Number.isFinite(p.lanePos) && p.lanePos >= 0 && p.lanePos <= 3 &&
          Number.isFinite(p.speed) && p.speed >= 10 && p.speed <= 78 &&
          Number.isFinite(p.timeMs) && p.timeMs > 0 && p.timeMs <= 60000 &&
          Number.isFinite(p.lockEnergy) && p.lockEnergy >= 0 && p.lockEnergy <= 100 &&
          Number.isFinite(p.echoEnergy) && p.echoEnergy >= 0 && p.echoEnergy <= 100) &&
        (s.proofVersion === 4 ?
          Number.isInteger(p.score) && p.score >= 0 &&
          Number.isInteger(p.peakStack) && p.peakStack >= 1 && p.peakStack <= 4 &&
          Number.isInteger(p.cleanBars) && p.cleanBars >= 0 && p.cleanBars <= 100 :
          Array.isArray(p.locked) && p.locked.length <= (s.proofVersion === 1 ? 2 : 3) &&
          new Set(p.locked).size === p.locked.length &&
          p.locked.every(lane => Number.isInteger(lane) && lane >= 0 && lane < 4));
    },
    async enter() {
      if (this.active || this.pending || B.RunAndGunProof?.active || B.RunAndGunProof?.pending ||
          !B.Campaign?.intermission) return { ok: false, reason: 'handoff-unavailable' };
      const returnTo = B.Campaign.readResume();
      if (returnTo?.levelId !== 'level-01' || returnTo.checkpointId !== 'intermission' ||
          !B.Campaign.archive().record.progress.completedLevels.includes('level-01'))
        return { ok: false, reason: 'level-01-clear-required' };
      const previous = returnTo.levelState.cacheRoadCheckpoint;
      delete returnTo.levelState.cacheRoadCheckpoint; // keep the return save shallow on repeat visits
      const candidate = previous && { levelId: ID, checkpointId: previous.checkpointId,
        levelState: { proofVersion: previous.proofVersion || 1, returnTo, proof: previous.proof } };
      const resume = this.validate(candidate) ? candidate : null;
      this.pending = true;
      B.Campaign.roadAudioNotice = null;
      let audioFailure = null;
      try {
        window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
        if (!this.selectMusicProfile().ok) throw new Error('road-profile-unavailable');
        const prepared = await window.audioSystem?.prepareActiveMusicProfile?.();
        if (!prepared?.ok) { audioFailure = prepared; throw new Error('road-audio-unavailable'); }
        if (!this.checkAudioAssets()) throw new Error('road-audio-invalid');
        this.returnTo = returnTo;
        this.state = newState(resume ? migrateProof(resume.levelState.proof, resume.levelState.proofVersion) : {});
        this.status = this.state.status; this.active = true;
        this.setHint();
        B.Campaign.intermission = false; B.Campaign.run = null;
        window.gameState.victory = false; window.gameState.gameOver = false;
        window.gameState.running = true;
        const started = window.audioSystem?.startRuntimeGameplayMusic?.();
        if (!started?.ok) throw new Error('road-audio-start-failed');
        this.checkpoint(resume?.checkpointId || 'road-start');
        window.inputManager?.resetActionEdges?.();
        return { ok: true };
      } catch (error) {
        console.error('[cache-road] Entry failed:', error?.message || error, audioFailure || '');
        this.dispose();
        if (previous) returnTo.levelState.cacheRoadCheckpoint = previous;
        B.Campaign.archive().checkpoint(returnTo);
        await B.RuntimeLifecycle?.restart?.({ source: 'road-entry-recovery', resume: returnTo });
        if (audioFailure || ['road-audio-invalid', 'road-audio-start-failed'].includes(error?.message)) {
          const names = audioFailure?.failures?.map(item => item.sourceId.replace('cache-', '').toUpperCase()).join(', ');
          B.Campaign.roadAudioNotice = `CACHE MUSIC UNAVAILABLE${names ? ` (${names})` : ''} — CHECK CONNECTION, THEN RETRY`;
        }
        return { ok: false, reason: error.message };
      } finally { this.pending = false; }
    },
    restore(saved) {
      if (!this.validate(saved)) return false;
      this.returnTo = clone(saved.levelState.returnTo);
      this.state = newState({ ...migrateProof(saved.levelState.proof, saved.levelState.proofVersion),
        status: saved.checkpointId === 'road-clear' ? 'clear' : 'playing' });
      this.status = this.state.status; this.active = true; this.exiting = false;
      this.setHint();
      this.checkAudioAssets();
      window.gameState.victory = false; window.gameState.gameOver = false;
      window.gameState.running = true;
      window.inputManager?.resetActionEdges?.();
      return true;
    },
    checkpoint(id) {
      if (!this.active || !this.returnTo || !Object.hasOwn(CHECKPOINTS, id)) return false;
      const s = this.state;
      const saved = B.Campaign.archive().checkpoint({ levelId: ID, checkpointId: id,
        levelState: { proofVersion: 4, returnTo: clone(this.returnTo), proof: {
          progress: id === 'road-start' ? 0 : s.progress, lane: s.lane, lanePos: s.lanePos,
          musicBar: id === 'road-start' ? 0 : s.musicBar, gateAt: s.gateAt,
          gateOpen: s.gateOpen,
          speed: s.speed, timeMs: Math.ceil(s.timeMs),
          lockEnergy: Math.round(s.lockEnergy), echoEnergy: Math.round(s.echoEnergy),
          boost: s.boost, score: s.score, peakStack: s.peakStack,
          cleanBars: s.cleanBars, integrity: Math.max(1, s.integrity) } } });
      B.Campaign.syncTitleButton();
      return saved;
    },
    async exit() {
      if (!this.active || this.exiting) return false;
      this.exiting = true;
      const returnTo = clone(this.returnTo);
      const saved = B.Campaign.readResume();
      if (saved?.levelId === ID && this.validate(saved)) returnTo.levelState.cacheRoadCheckpoint = {
        checkpointId: saved.checkpointId, proofVersion: saved.levelState.proofVersion,
        proof: clone(saved.levelState.proof) };
      B.Campaign.archive().checkpoint(returnTo);
      B.Campaign.syncTitleButton();
      const result = await B.RuntimeLifecycle?.restart?.({ source: 'road-exit', resume: returnTo });
      if (!result?.ok) this.exiting = false;
      return !!result?.ok;
    },
    dispose() {
      const hint = document.querySelector?.('.hint');
      if (hint && this.oldHint !== null) hint.textContent = this.oldHint;
      this.oldHint = null;
      this.active = false; this.status = null; this.state = null;
      this.returnTo = null; this.exiting = false; this.audioDegraded = false;
    },
    retry() {
      if (!this.active || this.status === 'playing') return false;
      const saved = B.Campaign.readResume();
      const fromCheckpoint = this.status === 'clear' ? null : saved?.levelId === ID ?
        migrateProof(saved.levelState.proof, saved.levelState.proofVersion) : null;
      this.state = newState(fromCheckpoint ? { ...fromCheckpoint, integrity: 3,
        timeMs: Math.max(fromCheckpoint.timeMs || 0, 30000), echoEnergy: Math.max(fromCheckpoint.echoEnergy || 0, 100) } : {});
      this.status = 'playing';
      // A retry deliberately resumes at the saved bar. Steering never seeks.
      window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
      this.selectMusicProfile();
      window.audioSystem?.startRuntimeGameplayMusic?.();
      this.checkpoint(this.status === 'playing' && fromCheckpoint ? saved.checkpointId : 'road-start');
      window.inputManager?.resetActionEdges?.();
      return true;
    },
    keyDown(e) {
      if (this.status === 'playing') return false;
      const key = e.key.toLowerCase();
      if (!['enter', ' ', 'c'].includes(key)) return false;
      e.preventDefault?.();
      if (!e.repeat) key === 'c' ? this.exit() : this.retry();
      return true;
    },
    mixSnapshot() {
      if (!this.active || !this.state) return null;
      return { captures: this.state.captures.map(({ lane, startBeat, endBeat }) =>
        ({ lane, startBeat, endBeat })),
        previewLane: this.state.previewLane, previewBeat: this.state.previewBeat,
        hitRecovery: this.state.hitRecovery };
    },
    startOffsetSec() { return (this.state?.musicBar || 0) * 1.875; },
    updateCaptures(music) {
      if (!music?.running || music.profileId !== PROFILE || !music.grid) return;
      const s = this.state, { beatIndex, barIndex } = music.grid;
      s.musicBeatFloat = music.grid.beatFloat;
      // A hold must spend its full half second inside the bar making the
      // choice. Remaining centered across a downbeat cannot renew it for free.
      if (s.candidateBar !== barIndex) {
        s.candidateBar = barIndex;
        s.candidateLane = null; s.candidateSince = null; s.candidateHold = 0;
        s.previewLane = null; s.previewBeat = null;
      }
      // Award a completed clean bar before removing a capture that expires on
      // this boundary. Damage marks its bar and removes the current stack.
      for (let completed = s.scoredThrough + 1; completed < barIndex && completed < 100; completed++) {
        if (completed !== s.damagedBar) {
          const parts = new Set(s.captures.filter(c => c.startBeat < (completed + 1) * 4 &&
            c.endBeat > completed * 4 && laneAvailable(c.lane, completed)).map(c => c.lane));
          const stack = Math.max(1, parts.size);
          s.score += 100 * stack; s.cleanBars++;
          s.lockEnergy = clamp(s.lockEnergy + 1, 0, 100);
        }
      }
      s.scoredThrough = Math.max(s.scoredThrough, barIndex - 1);
      s.captures = s.captures.filter(capture =>
        capture.endBeat > beatIndex && laneAvailable(capture.lane, barIndex));
      let phraseEntered = false;
      for (const queued of s.queuedCaptures.filter(capture => capture.startBeat <= beatIndex)) {
        if (!laneAvailable(queued.lane, barIndex) || queued.endBeat <= beatIndex) continue;
        const previous = s.captures.find(capture => capture.lane === queued.lane);
        if (previous) s.captures.splice(s.captures.indexOf(previous), 1);
        s.captures.push({ lane: queued.lane, sealed: true,
          startBeat: queued.startBeat, endBeat: queued.endBeat });
        s.peakStack = Math.max(s.peakStack, stackSize(s));
        phraseEntered = true;
      }
      s.queuedCaptures = s.queuedCaptures.filter(capture => capture.startBeat > beatIndex);
      // The last lane held in a bar is the choice for the next bar. Once
      // chosen, it survives steering away from traffic; one bar can add at
      // most one part. Only the shared transport boundary plays that choice.
      const selected = s.pendingCapture;
      if (selected && barIndex >= selected.startBeat / 4) {
        s.pendingCapture = null;
        if (barIndex === selected.startBeat / 4 && selected.endBeat > beatIndex &&
            laneAvailable(selected.lane, barIndex)) {
          const previous = s.captures.find(capture => capture.lane === selected.lane);
          if (!previous || previous.endBeat < selected.endBeat) {
            if (previous) s.captures.splice(s.captures.indexOf(previous), 1);
            s.captures.push({ ...selected, inkAtMs: s.elapsedMs });
            s.peakStack = Math.max(s.peakStack, stackSize(s));
            s.hitRecovery = false;
            if (barIndex % 4 === 0) phraseEntered = true;
          }
        }
      }
      // Zone is a reward for skilled driving, never a price of recording music.
      // One charged entry speeds the entire aligned phrase, even if several
      // lanes enter together. Its clock comes from the shared song transport.
      if (phraseEntered && s.lockEnergy >= ZONE_COST && beatIndex >= s.zoneEndBeat) {
        s.lockEnergy -= ZONE_COST;
        s.zoneEndBeat = (Math.floor(barIndex / 4) + 1) * ZONE_WINDOW;
        s.timeMs = Math.min(60000, s.timeMs + 1500);
        s.message = 'ZONE // 4 BARS FASTER  +1.5s'; s.messageMs = 1500;
        window.audioSystem?.playCombatCue?.('data');
      }
      const centered = Math.abs(s.lanePos - s.lane) <= .30;
      if (!centered || s.candidateLane !== s.lane) {
        s.candidateLane = centered ? s.lane : null;
        s.candidateSince = centered ? music.trackTimeSec : null;
        s.previewLane = null; s.previewBeat = null;
      }
      const dwell = centered ? music.trackTimeSec - s.candidateSince : 0;
      s.candidateHold = clamp(dwell / .5, 0, 1);
      if (centered && dwell >= .5) {
        if (s.previewLane === null && s.previewBeat === null && laneAvailable(s.lane, barIndex))
          s.previewBeat = beatIndex + 1;
        const nextBar = barIndex + 1;
        if (nextBar < 100 && (s.pendingCapture?.lane !== s.lane ||
            s.pendingCapture.startBeat !== nextBar * 4)) {
          s.pendingCapture = { lane: s.lane, startBeat: nextBar * 4,
            endBeat: nextStrip(nextBar) * 4 };
          s.opening.held = true;
          s.message = `${LANES[s.lane]} // NEXT BAR ${nextBar + 1}`; s.messageMs = 950;
          window.audioSystem?.playCombatCue?.('inspect');
        }
      }
      if (s.previewBeat !== null && beatIndex >= s.previewBeat) s.previewLane = s.lane;
    },
    snapLock() {
      const s = this.state;
      const music = B.MusicTransport?.sample?.(window.audioSystem?.context?.currentTime || 0);
      if (!music?.running || music.profileId !== PROFILE || !music.grid) return;
      const { beatIndex, barIndex } = music.grid;
      if (barIndex >= 100) return;
      const lane = clamp(Math.round(s.lanePos), 0, 3);
      const boundary = nextStrip(barIndex), endBeat = boundary * 4;
      const startBar = Math.floor(barIndex / 4) * 4;
      if (s.lastSnapStartBar === startBar) {
        s.message = 'E/RB // READY NEXT 4 BARS'; s.messageMs = 950;
        return;
      }
      let currentSealed = false, nextSealed = false;
      if (laneAvailable(lane, barIndex) && !s.captures.some(c => c.lane === lane && c.endBeat >= endBeat)) {
        s.captures = s.captures.filter(c => c.lane !== lane);
        s.captures.push({ lane, startBeat: beatIndex, endBeat, inkAtMs: s.elapsedMs });
        s.peakStack = Math.max(s.peakStack, stackSize(s));
        currentSealed = true;
      }
      if (availableFor(lane, boundary, boundary + 4) &&
          !s.queuedCaptures.some(c => c.lane === lane && c.startBeat === endBeat)) {
        s.queuedCaptures.push({ lane, startBeat: endBeat, endBeat: endBeat + 16,
          inkAtMs: s.elapsedMs });
        nextSealed = true;
      }
      if (currentSealed || nextSealed) {
        s.lastSnapStartBar = startBar;
        s.opening.sealed = true;
        s.hitRecovery = false;
        s.message = `${LANES[lane]} // ${currentSealed ? 'NOW' : ''}` +
          `${currentSealed && nextSealed ? ' + ' : ''}${nextSealed ? 'NEXT 4' : ''} SEALED`;
        s.messageMs = 950;
        window.audioSystem?.playCombatCue?.('inspect');
      }
    },
    sendEcho() {
      const s = this.state;
      if (s.echoEnergy < 100) {
        s.message = 'BUFFER NEEDS A CLEAN TRACE'; s.messageMs = 950; return;
      }
      s.echoEnergy = 0;
      // Give the first audit and final exit time for a visible split. Both
      // appear shortly after a marker; other Echos keep their short duration.
      const firstAudit = s.progress >= 850 && s.progress < 975;
      const finalExit = s.gateAt != null && s.progress >= s.gateAt - 220 && s.progress < s.gateAt;
      const durationMs = firstAudit || finalExit ? 6000 : 2700;
      s.echo = { lanePos: s.lanePos, progress: s.progress, ageMs: 0, durationMs,
        path: s.trace.map(sample => ({ ...sample })), sampleIndex: 0, sampleMs: 0 };
      s.rivalDistractedMs = durationMs;
      s.opening.echo = true;
      s.message = 'BUFFER ECHO // SPLIT THE LINE'; s.messageMs = 1700;
      window.audioSystem?.playCombatCue?.('data');
    },
    handleActions(actions) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state;
      s.steer = Number(!!actions.move_right?.held) - Number(!!actions.move_left?.held);
      s.braking = !!actions.move_down?.held;
      if (actions.inspect?.pressed) this.snapLock();
      if (actions.interact?.pressed) this.sendEcho();
      if (actions.jump?.pressed && s.boost > 0) {
        s.boost = 0; s.nearMisses = 0; s.boostMs = 1250;
        s.opening.turbo = true;
        s.message = 'TURBO // ORIGINAL SIGNAL HELD'; s.messageMs = 900;
        window.audioSystem?.playCombatCue?.('lift');
      }
    },
    hit(kind) {
      const s = this.state;
      if (s.invulnerableMs || s.boostMs) return;
      s.integrity--; s.speed = Math.max(20, s.speed - 19); s.timeMs = Math.max(0, s.timeMs - 1800);
      s.invulnerableMs = 1400;
      s.damagedBar = s.musicBar;
      s.captures = []; s.queuedCaptures = []; s.pendingCapture = null;
      s.hitRecovery = true;
      s.zoneEndBeat = -1;
      s.candidateLane = null; s.candidateSince = null;
      s.candidateHold = 0;
      s.previewLane = null; s.previewBeat = null;
      s.stumbleMs = 650; s.cutStreak = 0; s.cutFlashMs = 0; s.nearMisses = 0;
      s.message = ''; s.messageMs = 0;
      window.audioSystem?.playRoadStumble?.();
      window.audioSystem?.playCombatCue?.('damage');
      if (s.integrity <= 0) this.status = s.status = 'failed';
    },
    cleanPass(cut = false) {
      const s = this.state;
      // Passing traffic charges abilities and score, not the music choice.
      // A collision's grace window is recovery, not a clean crossing.
      if (s.invulnerableMs) return;
      s.nearMisses++;
      s.echoEnergy = clamp(s.echoEnergy + (cut ? 35 : 16), 0, 100);
      s.lockEnergy = clamp(s.lockEnergy + (cut ? 70 : 8), 0, 100);
      s.cutStreak = cut ? Math.min(4, s.cutStreak + 1) : 0;
      const points = (cut ? 150 * s.cutStreak : 25) * stackSize(s);
      s.score += points;
      if (s.nearMisses >= 2) { s.boost = 1; s.nearMisses = 0; }
      if (cut) { s.cutFlashMs = 740; s.cutAward = points; }
      else { s.message = `NEAR MISS // +${points}  TURBO ${s.nearMisses}/2`; s.messageMs = 850; }
      window.audioSystem?.playCombatCue?.(cut ? 'cutline' : 'pickup');
    },
    update(delta) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state, dt = Math.min(100, Math.max(0, delta));
      if (!dt) return;
      const before = s.progress;
      const music = B.MusicTransport?.sample?.(window.audioSystem?.context?.currentTime || 0);
      const previousBar = s.musicBar;
      const bar = music?.running && music.profileId === PROFILE && music.grid ?
        Math.max(0, music.grid.barIndex) : previousBar;
      this.updateCaptures(music);
      s.musicBar = Math.max(previousBar, bar);
      s.elapsedMs += dt; s.timeMs = Math.max(0, s.timeMs - dt);
      s.boostMs = Math.max(0, s.boostMs - dt);
      s.invulnerableMs = Math.max(0, s.invulnerableMs - dt);
      s.stumbleMs = Math.max(0, s.stumbleMs - dt);
      s.cutFlashMs = Math.max(0, s.cutFlashMs - dt);
      s.messageMs = Math.max(0, s.messageMs - dt);
      s.rivalDistractedMs = Math.max(0, s.rivalDistractedMs - dt);
      const seconds = dt / 1000;
      const zoned = s.musicBeatFloat < s.zoneEndBeat;
      const targetSpeed = s.braking ? 23 : s.boostMs ? 75 : zoned ? 64 : 54;
      s.speed = clamp(s.speed + clamp(targetSpeed - s.speed,
        -(s.braking ? 48 : 8) * seconds, (s.boostMs ? 47 : 22) * seconds), 18, 75);
      const curve = roadCurve(before);
      s.lanePos = clamp(s.lanePos +
        (s.steer * 2.5 - curve * (s.speed / 54) ** 2 * 0.5) * seconds, 0, 3);
      s.lane = Math.round(s.lanePos);
      s.visualLane += (s.lanePos - s.visualLane) * Math.min(1, dt / 90);
      s.progress = Math.min(15000, before + s.speed * seconds);

      // This short input trace, rather than a past world position, can be
      // replayed from the car's present location as a readable decoy.
      s.trace.push({ steer: s.steer, duration: dt });
      let traceLength = s.trace.reduce((total, sample) => total + sample.duration, 0);
      while (traceLength > 2200 && s.trace.length > 1)
        traceLength -= s.trace.shift().duration;
      if (s.echo) {
        const e = s.echo;
        e.ageMs += dt; e.progress += s.speed * seconds;
        let remaining = dt;
        while (remaining > 0 && e.sampleIndex < e.path.length) {
          const sample = e.path[e.sampleIndex], step = Math.min(remaining, sample.duration - e.sampleMs);
          e.lanePos = clamp(e.lanePos + sample.steer * 2.5 * step / 1000, 0, 3);
          e.sampleMs += step; remaining -= step;
          if (e.sampleMs >= sample.duration) { e.sampleIndex++; e.sampleMs = 0; }
        }
        if (e.ageMs >= e.durationMs) s.echo = null;
      }
      if (Math.abs(curve) > 0.48 && s.speed > 30 && s.steer * curve > 0) {
        s.lockEnergy = clamp(s.lockEnergy + 3 * seconds, 0, 100);
        s.echoEnergy = clamp(s.echoEnergy + 8 * seconds, 0, 100);
      }

      // Resolve every vehicle at a crossing before paying clean-pass rewards.
      // A paired gate can otherwise award a near miss from its second vehicle
      // in the very frame where its first vehicle hits the car.
      const contactAt = new Set(), pendingPasses = [];
      for (const hazard of HAZARDS) {
        const distance = hazard.at - s.progress;
        const hazardId = `${hazard.at}/${hazard.lane}`;
        if (hazard.kind === 'audit' && distance < 160 && distance > 0 &&
          !Object.hasOwn(s.audits, hazard.at)) {
          s.audits[hazard.at] = s.echo ? Math.round(s.echo.lanePos) : s.lane;
          if (hazard.at === 1135 && s.echo) s.opening.auditFollowedEcho = true;
        }
        const lane = hazardLane(hazard, s.progress, s.audits);
        if (distance <= 80 && distance > 0 && s.speed >= 38 && !s.invulnerableMs &&
            !s.boostMs && Math.abs(lane - s.lanePos) < .45)
          s.cutMarks[hazardId] = true;
        if (hazard.kind === 'freight' && distance > 15 && distance < 110 &&
            Math.abs(lane - s.lanePos) < 0.42 && s.speed >= 28 && !s.drafted[hazard.at]) {
          s.draftMs += dt;
          if (s.draftMs >= 600) {
            s.drafted[hazard.at] = true; s.draftMs = 0; s.boost = 1;
            s.echoEnergy = clamp(s.echoEnergy + 25, 0, 100);
            s.lockEnergy = clamp(s.lockEnergy + 20, 0, 100);
            s.message = 'FREIGHT DRAFT // TURBO READY'; s.messageMs = 900;
          }
        }
        if (before >= hazard.at || s.progress < hazard.at) continue;
        const gap = Math.abs(lane - s.lanePos);
        if (gap < (hazard.kind === 'freight' ? 0.53 : 0.45)) {
          contactAt.add(hazard.at);
          this.hit(hazard.kind === 'block' ? 'roadblock' : hazard.kind);
          if (this.status === 'failed') return;
        } else if (gap < 1.30 && s.speed >= 25) {
          pendingPasses.push({ at: hazard.at,
            cut: !!s.cutMarks[hazardId] && gap < 1.20 && s.speed >= 38 });
        }
        delete s.cutMarks[hazardId];
      }
      for (const pass of pendingPasses) if (!contactAt.has(pass.at)) this.cleanPass(pass.cut);
      if (s.progress >= 3 * LAP + 1700 && s.musicBar < 100) {
        const distance = s.nextRivalAt - s.progress;
        const enteringWarning = !s.rivalWarning && distance <= 120 && distance > 0;
        s.rivalWarning = distance <= 120 && distance > 0;
        if (s.rivalWarning) {
          if (enteringWarning) {
            s.rivalTarget = s.lanePos;
            s.rivalEchoCommitted = false;
            window.audioSystem?.playCombatCue?.('warning');
          }
          if (s.echo && s.rivalDistractedMs && !s.rivalEchoCommitted) {
            s.rivalTarget = s.echo.lanePos;
            s.rivalEchoCommitted = true;
          }
          s.rivalLane += (s.rivalTarget - s.rivalLane) * Math.min(1, dt / 290);
        }
        if (before < s.nextRivalAt && s.progress >= s.nextRivalAt) {
          const decoy = !!s.echo && s.rivalDistractedMs > 0 && s.rivalEchoCommitted;
          if (decoy && Math.abs(s.echo.lanePos - s.lanePos) >= 0.7) {
            s.echoDeceptions++;
            s.message = 'RIVAL TOOK THE REPLAY'; s.messageMs = 1200;
          } else if (Math.abs(s.rivalLane - s.lanePos) < 0.55) {
            this.hit('clean copy');
            if (this.status === 'failed') return;
          }
          const density = stackSize(s);
          s.nextRivalAt = s.progress + (density >= 3 ? 155 : 225);
          s.rivalWarning = false; s.rivalEchoCommitted = false;
        }
      }
      if (before < 850 && s.progress >= 850) {
        s.timeMs = Math.max(s.timeMs, 33000) + (stackSize(s) - 1) * 1800;
        s.echoEnergy = 100;
        this.checkpoint('road-cache'); s.message = 'ORIGINAL TAPE / KEEP MOVING'; s.messageMs = 1600;
      }
      if (before < 1700 && s.progress >= 1700) {
        s.timeMs = Math.max(s.timeMs, 31000) + (stackSize(s) - 1) * 1800;
        s.echoEnergy = 100;
        this.checkpoint('road-fork'); s.message = 'A CLEAN COPY IS MISSING NAMES'; s.messageMs = 2400;
      }
      for (const [at, id] of [[28, 'road-verse-2'], [52, 'road-verse-3'], [76, 'road-verse-4']]) {
        if (previousBar < at && s.musicBar >= at) {
          s.timeMs = Math.max(s.timeMs, 55000);
          this.checkpoint(id);
          s.message = `VERSE ${1 + Math.floor(at / 24)} // HOLD THE ORIGINAL`;
          s.messageMs = 1800;
        }
      }
      if (previousBar < 92 && s.musicBar >= 92 && s.gateAt == null) {
        s.gateAt = Math.max(GATE, s.progress + 300);
        s.echoEnergy = 100;
      }
      if (s.gateAt != null && before < s.gateAt && s.progress >= s.gateAt) {
        if (s.lanePos < 2.45 || !s.echo || s.rivalDistractedMs <= 0 ||
            Math.abs(s.echo.lanePos - s.lanePos) < 0.75) {
          s.gateFailure = s.lanePos < 2.45 ? 'wrong-lane' :
            !s.echo || s.rivalDistractedMs <= 0 ? 'no-echo' : 'no-split';
          // Stop at the missed exit. Moving the car backward while play kept
          // running looked like a broken game loop, not a deliberate retry.
          this.status = s.status = 'failed';
          return;
        } else {
          s.timeMs = Math.max(s.timeMs, 21000);
          s.gateOpen = true; this.checkpoint('road-gate');
          s.message = 'ORIGINAL THROUGH // MAC: DISTRIBUTION DENIED'; s.messageMs = 3500;
        }
      }
      if (s.gateOpen && s.musicBar >= 100 && s.progress >= s.gateAt + 400) {
        this.status = s.status = 'clear';
        this.checkpoint('road-clear');
      }
      if (s.musicBar >= 100 && this.status === 'playing') {
        this.status = s.status = 'failed'; s.message = 'ORIGINAL TAPE ENDED';
      }
      if (this.status !== 'playing') window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
      if (s.timeMs <= 0 && this.status === 'playing') {
        this.status = s.status = 'failed'; s.message = 'TRANSMISSION WINDOW CLOSED';
      }
    },
    draw(ctx) {
      if (!ctx || !this.active) return;
      const s = this.state, progress = s.progress;
      const section = s.musicBar < 4 ? 0 : Math.min(3, Math.floor((s.musicBar - 4) / 24));
      const names = ['RAINLINE', 'SERVICE LOOP', 'MIRROR VIADUCT', 'DISTRIBUTION CAUSEWAY'];
      const skyBottoms = ['#9b4f74', '#dc805b', '#d87891', '#86a89d'];
      const reduced = !!B.Preferences?.values?.reducedMotion;
      const horizon = 400, bottom = 1080;
      const bend = t => Math.sin(progress / 190 + (1 - t) * 1.2) * (1 - t) * 124;
      const center = t => 960 + bend(t), half = t => 80 + 800 * t;
      const laneEdge = (lane, t) => center(t) - half(t) + lane * half(t) / 2;
      const laneX = (lane, t) => laneEdge(lane, t) + half(t) / 4;
      const roadY = t => horizon + t * t * (bottom - horizon);
      const depth = d => clamp(1 - (d + 80) / 520, 0, 1);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const beat = reduced ? 0 : s.musicBeatFloat || 0;
      const stack = Math.min(4,s.captures?.length || 0);
      const beatPulse = reduced ? 0 : Math.pow(1-((beat%1+1)%1),5);
      const energy = stack/4 + (s.boostMs ? .3 : 0) + beatPulse*.27;
      const hue = (186 + section*65 + Math.sin(beat*.31)*55 + energy*37 + 360)%360;
      const sky = ctx.createLinearGradient(0, 0, 0, horizon + 70);
      sky.addColorStop(0, `hsl(${hue},48%,${9+energy*3}%)`);
      sky.addColorStop(.48, `hsl(${(hue+42)%360},58%,${14+energy*5}%)`);
      sky.addColorStop(1, skyBottoms[section]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 1920, 1080);
      ctx.fillStyle = '#122236'; ctx.fillRect(0, horizon, 1920, bottom - horizon);
      // Wide veils move with the shared beat and the number of parts playing.
      // Reduced Motion holds their geometry in place.
      ctx.save(); ctx.globalCompositeOperation='screen';
      for (let k=0;k<4;k++) {
        const cx=230+k*490+Math.sin(beat*(.18+k*.037)+k*1.8)*180;
        const cy=80+k%2*105+Math.cos(beat*.29+k*2)*28;
        const radius=290+k*45;
        const wash=ctx.createRadialGradient(cx,cy,20,cx,cy,radius);
        wash.addColorStop(0,`hsla(${(hue+64+k*45)%360},90%,60%,${.23+energy*.14})`);
        wash.addColorStop(.55,`hsla(${(hue+22+k*36)%360},72%,40%,.075)`);
        wash.addColorStop(1,'#00000000');
        ctx.fillStyle=wash; ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2);
        for (let ribbon=0;ribbon<3;ribbon++) {
          ctx.strokeStyle=`hsla(${(hue+k*41)%360},88%,72%,${(.07+energy*.026)/(ribbon+1)})`;
          ctx.lineWidth=45+ribbon*42;
          ctx.beginPath(); ctx.moveTo(cx-radius,cy+40+ribbon*21);
          ctx.bezierCurveTo(cx-120,cy-85-ribbon*7,cx+80,cy+60+ribbon*12,
            cx+radius,cy-40+ribbon*13); ctx.stroke();
        }
      }
      for(let band=0;band<3;band++) {
        const wave=beat*(.25+band*.05)+band*2.1;
        const y=167+band*35+Math.sin(wave)*25;
        const glow=ctx.createLinearGradient(0,y-35,0,y+95);
        glow.addColorStop(0,'#00000000');
        glow.addColorStop(.42,`hsla(${(hue+band*67)%360},90%,65%,${.22+energy*.14})`);
        glow.addColorStop(1,'#00000000');
        ctx.fillStyle=glow;ctx.beginPath();ctx.moveTo(-90,y+17);
        ctx.bezierCurveTo(310,y-94+Math.sin(wave+1)*45,
          510,y+40+Math.cos(wave+2)*50,890,y-12);
        ctx.bezierCurveTo(1200,y-88+Math.sin(wave+3)*38,
          1510,y+50+Math.cos(wave+1)*42,2010,y-45);
        ctx.lineTo(2010,y+70);
        ctx.bezierCurveTo(1490,y+125,1150,y+8,890,y+87);
        ctx.bezierCurveTo(580,y+137,290,y+25,-90,y+118);
        ctx.closePath();ctx.fill();
      }
      ctx.restore();
      const distantWidth=2640,distantShift=reduced?0:progress*.012%distantWidth;
      ctx.globalAlpha=.73;
      for(let tile=-1;tile<=1;tile++)
        B.PresentationAssets?.draw?.('cacheDistantCity',ctx,{
          x:tile*distantWidth-distantShift,y:horizon-90,
          width:distantWidth,height:170 });
      ctx.globalAlpha=1;
      // Two actual city paintings occupy different depths. Their bottom edges
      // meet the road's horizon; no crop of one skyline is pasted over another.
      const skylineWidth = 2310, skylineShift = reduced ? 0 : progress*.035 % skylineWidth;
      ctx.globalAlpha = .65;
      for (let tile = -1; tile <= 1; tile++)
        B.PresentationAssets?.draw?.('cacheSkyline', ctx, {
          x: tile*skylineWidth - skylineShift, y: horizon + 25,
          width: skylineWidth, height: 225,
          sourceRect: [0,180,2079,440] });
      const haze = ctx.createLinearGradient(0,horizon-170,0,horizon+40);
      haze.addColorStop(0,'#4b6e7600'); haze.addColorStop(1,'#7796a657');
      ctx.fillStyle = haze; ctx.fillRect(0,horizon-170,1920,210);
      ctx.globalAlpha = 1;
      const cityWidth = 2230, cityShift = reduced ? 0 : progress*.15 % cityWidth;
      ctx.globalAlpha = .82;
      for (let tile=-1; tile<=1; tile++)
        B.PresentationAssets?.draw?.('cacheMidCity',ctx,{
          x:tile*cityWidth-cityShift-70,y:horizon+25,
          width:cityWidth,height:168,sourceRect:[0,260,2079,496] });
      ctx.globalAlpha = 1;
      // Level 1's animated ships cross above this road at different depths
      // and bank angles. They never enter the collision system.
      for (let i=0;i<5;i++) {
        const forward=i%2===0, model=i%3===0?'cacheFly1':'cacheFly3';
        const travel=progress*(forward?.22:-.15);
        const x=((i*511+travel+260)%2360+2360)%2360-220;
        const y=202+(i%3)*38+Math.sin(progress*.013+i*2.4)*(reduced?0:7);
        const width=73+(i%3)*15, height=width*(model==='cacheFly1'?.26:.30);
        const angle=(forward?-.055:.075)+Math.sin(progress*.008+i)*(reduced?0:.025);
        const frame=Math.floor((s.elapsedMs||0)/40+i*27)%(model==='cacheFly1'?81:122);
        ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
        ctx.globalAlpha=.58+(i%3)*.08;
        B.PresentationAssets?.draw?.(model,ctx,{
          x:0,y:0,width,height,frame,flip:!forward });
        ctx.restore();
      }
      // Side decks track the same bend as the lane geometry. Real parapet and
      // pylon art is placed at world distances below, after the asphalt.
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#142437';
        ctx.beginPath();
        for (let i=0; i<=28; i++) {
          const t=i/28;
          const xx=center(t)+side*(half(t)+73+50*t);
          if (!i) ctx.moveTo(xx,roadY(t)); else ctx.lineTo(xx,roadY(t));
        }
        for (let i=28; i>=0; i--) {
          const t=i/28;
          ctx.lineTo(center(t)+side*(half(t)+220+190*t),roadY(t)+24*t);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#496074'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i=0; i<=28; i++) {
          const t=i/28, xx=center(t)+side*(half(t)+220+190*t);
          if (!i) ctx.moveTo(xx,roadY(t)+24*t); else ctx.lineTo(xx,roadY(t)+24*t);
        }
        ctx.stroke();
      }
      // Road shoulders and the paint share a single curved road projection.
      for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const t = i / 24, x = center(t) + side * (half(t) + 26 + 39 * t);
          if (!i) ctx.moveTo(x, roadY(t)); else ctx.lineTo(x, roadY(t));
        }
        for (let i = 24; i >= 0; i--) {
          const t = i / 24, x = center(t) + side * half(t);
          ctx.lineTo(x, roadY(t));
        }
        ctx.closePath(); ctx.fillStyle = '#44536a'; ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        if (!i) ctx.moveTo(center(t) - half(t), roadY(t)); else ctx.lineTo(center(t) - half(t), roadY(t));
      }
      for (let i = 28; i >= 0; i--) { const t = i / 28; ctx.lineTo(center(t) + half(t), roadY(t)); }
      ctx.closePath(); ctx.fillStyle = '#171f2b'; ctx.fill();
      // Adjacent slices now read adjacent texels. The old sampling jumped to
      // an unrelated row at every band boundary. Blend the one wrap over the
      // source's last 108 pixels into its first 108 pixels.
      ctx.save();
      for (let i = 0; i < 28; i++) {
        let c=((progress*.82+i*22)%616+616)%616, consumed=0;
        while (consumed<22) {
          const length=Math.min(22-consumed,616-c,c<508?508-c:22);
          const far=(i+consumed/22)/28, near=(i+(consumed+length)/22)/28;
          const mid=(far+near)/2, yy=roadY(far), endY=roadY(near);
          const args={ x:center(mid)-half(mid),y:yy,width:half(mid)*2,
            height:endY-yy+1,sourceRect:[0,108+c,2172,length] };
          const blend=c>=508 ? clamp((c+length/2-508)/108,0,1) : 0;
          ctx.globalAlpha=.27*(1-blend);
          B.PresentationAssets?.draw?.('cacheBlacktop',ctx,args);
          if (blend) {
            ctx.globalAlpha=.27*blend;
            B.PresentationAssets?.draw?.('cacheBlacktop',ctx,{
              ...args,sourceRect:[0,c-508,2172,length] });
          }
          consumed+=length; c=(c+length)%616;
        }
      }
      ctx.restore();
      const roadFog=ctx.createLinearGradient(0,horizon,0,horizon+170);
      roadFog.addColorStop(0,'#1c293b9e'); roadFog.addColorStop(1,'#1c293b00');
      ctx.save(); ctx.beginPath();
      for (let i=0;i<=28;i++) {
        const t=i/28; if (!i) ctx.moveTo(center(t)-half(t),roadY(t));
        else ctx.lineTo(center(t)-half(t),roadY(t));
      }
      for (let i=28;i>=0;i--) { const t=i/28; ctx.lineTo(center(t)+half(t),roadY(t)); }
      ctx.closePath(); ctx.clip(); ctx.fillStyle=roadFog; ctx.fillRect(0,horizon,1920,170);
      ctx.restore();
      // Stretch adjacent wall segments between the same projected road points.
      // This makes one continuous side wall rather than floating sign panels.
      for(let at=Math.floor((progress+500)/62)*62;at>progress-65;at-=62) {
        const far=clamp(depth(at+62-progress),.13,.99);
        const near=clamp(depth(at-progress),.13,.99);
        if(near<=far)continue;
        const id=Math.abs(Math.floor(at/62));
        for(const side of [-1,1]) {
          const fx=center(far)+side*(half(far)+46+58*far);
          const nx=center(near)+side*(half(near)+46+58*near);
          const fy=roadY(far)-20*far, ny=roadY(near)-20*near;
          const wallH=18+63*(far+near)/2;
          ctx.save(); ctx.globalAlpha=.70+.20*near;
          ctx.transform((nx-fx)/690,(ny-fy)/690,0,wallH/337,fx,fy);
          B.PresentationAssets?.draw?.('cacheParapet',ctx,{
            x:345,y:337,width:690,height:337,
            sourceRect:[(id+(side<0?0:1))%3*690,282,690,337],
            flip:side===1 });
          ctx.restore();
        }
      }
      ctx.globalAlpha=1;
      for(let at=Math.floor((progress+520)/142)*142;at>progress-65;at-=142) {
        const t=depth(at-progress);if(t<.17||t>.97)continue;
        const y=roadY(t)+18*t;
        for(const side of [-1,1]) {
          const x=center(t)+side*(half(t)+98+80*t);
          B.PresentationAssets?.draw?.('cachePylon',ctx,{
            x,y,width:58+146*t,height:105+277*t,
            sourceRect:[42,69,954,1386],flip:side===1 });
        }
      }
      // Phrase paint is a road marking, not a second translucent lane overlay.
      // Each bar is bounded by the same depth(), laneEdge() and roadY() used
      // for traffic and studs. Its near edge travels toward the car on the
      // shared song clock, while the road curves beneath every vertex.
      const floatBar = s.musicBeatFloat / 4;
      for (let bar = Math.floor(floatBar) + 8; bar >= Math.floor(floatBar); bar--) {
        if (bar >= 100) continue;
        const near = depth(Math.max(-55, (bar - floatBar) * 65));
        const far = depth((bar + 1 - floatBar) * 65);
        if (near <= .12 || near <= far) continue;
        let painted = false;
        for (let lane = 0; lane < 4; lane++) {
          const active = s.captures.find(c => c.lane === lane && c.startBeat < (bar + 1) * 4 && c.endBeat > bar * 4);
          const queued = !active && s.queuedCaptures.find(c => c.lane === lane &&
            c.startBeat <= bar * 4 && c.endBeat > bar * 4);
          const selected = !active && !queued && s.pendingCapture?.lane === lane &&
            s.pendingCapture.startBeat <= bar * 4 && s.pendingCapture.endBeat > bar * 4 ?
            s.pendingCapture : null;
          if (!active && !queued && !selected) continue;
          const mark = active || queued || selected;
          const slot = bar - mark.startBeat / 4;
          const reveal = active || mark.inkAtMs == null ? 1 :
            clamp((s.elapsedMs - mark.inkAtMs - (3 - slot) * 100) / 260, 0, 1);
          if (!reveal) continue;
          painted = true;
          const padNear = 8 + near * 13, padFar = 8 + far * 13;
          const quad = [[laneEdge(lane,near)+padNear,roadY(near)],
            [laneEdge(lane+1,near)-padNear,roadY(near)],
            [laneEdge(lane+1,far)-padFar,roadY(far)],
            [laneEdge(lane,far)+padFar,roadY(far)]];
          ctx.globalAlpha = (active ? .35 : selected ? .10 : .16) * reveal;
          polygon(ctx, quad, PALETTE[lane]);
          ctx.globalAlpha = (active ? .9 : selected ? .35 : .57) * reveal;
          ctx.strokeStyle = PALETTE[lane]; ctx.lineWidth = 1.5 + near * (active ? 4 : 2);
          ctx.beginPath(); ctx.moveTo(...quad[0]); ctx.lineTo(...quad[3]);
          ctx.moveTo(...quad[1]); ctx.lineTo(...quad[2]); ctx.stroke();
          // Short transverse inlaid strokes make the paint read as material
          // passing under the car as a committed phrase approaches.
          const stripeT = far + (near - far) * .38;
          ctx.lineWidth = Math.max(1, near * 3);
          ctx.beginPath();
          ctx.moveTo(laneEdge(lane,stripeT)+padFar+12,roadY(stripeT));
          ctx.lineTo(laneEdge(lane+1,stripeT)-padFar-12,roadY(stripeT)); ctx.stroke();
          // Directional grooves are cut into each bar tile. All vertices are
          // evaluated at road depth, so the motif foreshortens with approach.
          for (let mark = 0; mark < 2; mark++) {
            const markT = far + (near - far) * (.2 + mark * .32);
            const markAhead = far + (near - far) * (.32 + mark * .32);
            ctx.globalAlpha = (active ? .51 : .34) * reveal;
            ctx.beginPath();
            ctx.moveTo(laneEdge(lane,markT) + (laneEdge(lane+1,markT)-laneEdge(lane,markT))*.3,
              roadY(markT));
            ctx.lineTo(laneX(lane,markAhead), roadY(markAhead));
            ctx.lineTo(laneEdge(lane,markT) + (laneEdge(lane+1,markT)-laneEdge(lane,markT))*.7,
              roadY(markT)); ctx.stroke();
          }
          if (bar % 4 === 0 && near > .32) {
            const labelT = far + (near - far) * .7;
            ctx.save(); ctx.translate(laneX(lane,labelT), roadY(labelT));
            ctx.scale(Math.max(.35,labelT*.83), Math.max(.13,labelT*.25));
            ctx.textAlign = 'center'; ctx.fillStyle = '#fafff8';
            ctx.font = 'bold 25px Oxanium, monospace';
            ctx.fillText(`${LANES[lane]} ${bar+1}–${Math.min(100,bar+4)}`, 0, -10);
            ctx.restore();
          }
          ctx.globalAlpha = 1;
        }
        if(bar%4===0||painted) {
          ctx.strokeStyle = bar%4===0 ? '#b4f9ec' : '#8ea6ab';
          ctx.globalAlpha = bar%4===0 ? .49 : .1;
          ctx.lineWidth = bar%4===0 ? 2+near*3 : 1+near;
          ctx.beginPath();ctx.moveTo(laneEdge(0,near),roadY(near));
          ctx.lineTo(laneEdge(4,near),roadY(near));ctx.stroke();ctx.globalAlpha=1;
        }
        if (bar % 4 === 0 && near > .23) {
          ctx.fillStyle = '#d4fff1'; ctx.font = `bold ${Math.round(10 + 17 * near)}px Oxanium, monospace`;
          ctx.textAlign = 'right'; ctx.fillText(`${songSection(bar)} / ${bar + 1}–${bar + 4}`,
            laneEdge(0,near)-13, roadY(near)+3);
        }
      }
      for (const side of [-1, 1]) {
        ctx.strokeStyle = s.musicBeatFloat < s.zoneEndBeat ? '#ffe4a2' :
          section === 3 ? '#a2f9c9' : '#f0a0ac'; ctx.lineWidth = 4;
        ctx.globalAlpha=.46;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const t = i / 24, x = center(t) + side * half(t);
          if (!i) ctx.moveTo(x, roadY(t)); else ctx.lineTo(x, roadY(t));
        }
        ctx.stroke();
      }
      ctx.globalAlpha=1;
      // Road studs and striped shoulder posts accelerate toward the player.
      for (let at = Math.floor(progress / 26) * 26; at < progress + 500; at += 26) {
        const d = at - progress, t = depth(d);
        if (d < -65 || t < .12) continue;
        const y = roadY(t), size = 2 + 17 * t * t;
        for (let lane = 1; lane < 4; lane++) {
          const x = laneEdge(lane, t);
          ctx.fillStyle = '#f4e4cf'; ctx.globalAlpha = .28 + t * .55;
          ctx.fillRect(x - size * .25, y - size * .7, size * .5, size * 1.4);
        }
        ctx.globalAlpha = 1;
        for (const side of [-1, 1]) {
          const x = center(t) + side * (half(t) + 18 + t * 32);
          if(at%52===0) {
            ctx.fillStyle = '#9f8290';
            ctx.fillRect(x - size*.25, y - size*1.7, size*.5, size*1.7);
            ctx.fillStyle = '#e4b594'; ctx.fillRect(x - size*.25, y - size*1.5, size*.5, size*.24);
          }
        }
      }
      // Near guardrails and lamps travel faster than the skyline and road.
      for (const side of [-1, 1]) {
        ctx.strokeStyle = '#719098a8'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const t = i/24, xx = center(t)+side*(half(t)+43+42*t), yy = roadY(t)-22*t;
          if (!i) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const upcoming = [850, 1700].find(at => at > progress && at - progress < 410);
      if (upcoming) {
        const t = depth(upcoming - progress), far = depth(upcoming - progress + 32);
        polygon(ctx, [[laneEdge(0,t),roadY(t)],[laneEdge(4,t),roadY(t)],
          [laneEdge(4,far),roadY(far)],[laneEdge(0,far),roadY(far)]], '#385d66');
        ctx.save(); ctx.translate(center(t),roadY(t)); ctx.scale(Math.max(.5,t),Math.max(.2,t*.34));
        ctx.fillStyle = '#e5fcf1'; ctx.font = 'bold 30px Oxanium, monospace';
        ctx.textAlign = 'center'; ctx.fillText('ROAD MARKER', 0, -16); ctx.restore();
      }
      // Far traffic first; the shapes and on-road arrows remain legible in motion.
      for (const hazard of [...HAZARDS].reverse()) {
        const d = hazard.at - progress;
        if (d < 0 || d > 440) continue;
        const t = depth(d), lane = hazardLane(hazard, progress, s.audits);
        const x = laneX(lane, t), y = roadY(t);
        const w = (hazard.kind === 'freight' ? 32 : 26) + t * (hazard.kind === 'freight' ? 144 : 113);
        const h = (hazard.kind === 'freight' ? 30 : 24) + t * (hazard.kind === 'freight' ? 149 : 111);
        if (d < 145 && d > 4 && t > .38) {
          // A braking chevron is printed on the threatened lane, with a
          // narrowing cue as the car approaches the collision plane.
          const markT = depth(d - 23);
          ctx.globalAlpha = .2 + (1 - d / 145) * .36;
          polygon(ctx, [[laneX(lane,t),y+5],
            [laneEdge(lane+1,markT)-14,roadY(markT)],
            [laneX(lane,markT),roadY(markT)-4],
            [laneEdge(lane,markT)+14,roadY(markT)]], '#ff7488');
          ctx.globalAlpha = 1;
        }
        if (hazard.kind === 'audit' && d < 165 && d > 0) {
          const ahead = depth(d - 38);
          ctx.globalAlpha = .45;
          polygon(ctx, [[laneEdge(lane,t)+9,y],[laneEdge(lane+1,t)-9,y],
            [laneEdge(lane+1,ahead)-15,roadY(ahead)],
            [laneEdge(lane,ahead)+15,roadY(ahead)]], '#ff4f82');
          ctx.globalAlpha = 1;
        }
        if (hazard.kind === 'sweeper' && d < 165 && d > 0) {
          ctx.strokeStyle = '#ffe6a2'; ctx.lineWidth = 4 + t*5;
          ctx.beginPath(); ctx.moveTo(laneX(hazard.lane,t), y + 30*t);
          ctx.lineTo(laneX(hazard.lane+1,t), y + 30*t); ctx.stroke();
          polygon(ctx, [[laneX(hazard.lane+1,t),y+30*t],
            [laneX(hazard.lane+1,t)-15*t,y+18*t],[laneX(hazard.lane+1,t)-15*t,y+42*t]], '#ffe6a2');
        }
        drawVehicle(ctx, x, y, w, h, hazard.kind,
          { phase: progress + hazard.at*.17, reduced });
        if (d < 210 && d > 0 && t > .38 && ['audit','sweeper','freight'].includes(hazard.kind)) {
          ctx.fillStyle = hazard.kind === 'audit' ? '#ffd0df' : '#fff2be';
          ctx.font = `bold ${Math.round(15 + t*16)}px Oxanium, monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(hazard.kind === 'audit' ? 'AUDIT LOCK' : hazard.kind === 'sweeper' ? 'MERGE >' : 'DRAFT', x, y - h - 14);
        }
      }
      if (s.gateAt != null && progress < s.gateAt + 45) {
        const t = depth(s.gateAt - progress), y = roadY(t);
        ctx.fillStyle = '#9ffff0'; ctx.font = `bold ${Math.round(18 + t*23)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('ORIGINAL >>>', laneX(3,t), y - 154*t - 52);
        ctx.fillStyle = '#ffb2bd'; ctx.fillText('AUDIT COPY', laneX(0,t), y - 154*t - 52);
      }
      if (progress >= 3 * LAP + 1700) {
        const t = .62, x = laneX(s.rivalLane,t), y = roadY(t);
        drawVehicle(ctx, x, y, 126, 127, 'rival', { phase: progress, reduced });
        if (s.rivalWarning) {
          const markT = depth(s.nextRivalAt - progress), markX = laneX(s.rivalTarget,markT), markY = roadY(markT);
          ctx.strokeStyle = '#ff719b'; ctx.lineWidth = 6;
          ctx.strokeRect(markX - 44, markY - 83, 88, 78);
        }
      }
      const carX = laneX(s.visualLane, .83), carY = roadY(.83);
      if (s.echo) {
        const x = laneX(s.echo.lanePos, .83);
        if (Math.abs(x - carX) > 35) {
          ctx.strokeStyle = '#a4faff'; ctx.globalAlpha = .36; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x, carY - 8); ctx.lineTo(carX, carY - 8); ctx.stroke(); ctx.globalAlpha = 1;
        }
        drawVehicle(ctx, x, carY, 152, 115, 'echo', { alpha: .68 });
      }
      drawVehicle(ctx, carX, carY, 164, 119, 'cache',
        { alpha: !s.stumbleMs && s.invulnerableMs && Math.floor(s.invulnerableMs / 90) % 2 ? .55 : 1,
          turbo: !!s.boostMs, phase: progress, steer: s.steer, hit: s.stumbleMs,
          reduced });
      if (s.cutFlashMs && !reduced) {
        const pulse = s.cutFlashMs / 740;
        const side=Math.floor(progress/51)%2?1:-1;
        ctx.save();ctx.globalAlpha=.51*pulse;
        ctx.translate(carX+side*105,carY+24);ctx.rotate(side*.2);
        B.PresentationAssets?.draw?.('cacheSpeedMist',ctx,{
          x:0,y:0,width:225,height:94,flip:side<0 });
        ctx.restore();
        drawGrimyPlume(ctx,carX+side*108,carY-46,progress*1.3,
          113,pulse,['#a1d4cf','#697984'],side);
        drawGrimyPlume(ctx,carX+side*70,carY-10,progress*1.3+42,
          61,pulse*.8,['#ddc2a1','#48545f'],side);
      }
      if (s.stumbleMs) {
        const pulse = s.stumbleMs / 650;
        ctx.save();ctx.translate(carX,carY+32);
        ctx.rotate(Math.sin(progress*.07)*.045);
        ctx.globalAlpha=.76*pulse;
        B.PresentationAssets?.draw?.('cacheImpactGrit',ctx,{
          x:0,y:0,width:306+(1-pulse)*72,height:145+(1-pulse)*35 });
        ctx.restore();
        drawGrimyPlume(ctx,carX-64,carY-55,progress*.9+12,
          126,pulse,['#e3a480','#363b47'],-1);
        drawGrimyPlume(ctx,carX+61,carY-75,progress*.9+47,
          151,pulse,['#b8a3a0','#303540'],1);
      }
      if (s.invulnerableMs) {
        ctx.fillStyle = '#ff697a';
        ctx.fillRect(0, 163, 12, 750); ctx.fillRect(1908, 163, 12, 750);
      }
      // The driving HUD prioritizes time, damage and ability readiness.
      ctx.fillStyle = '#091523f2'; ctx.fillRect(0, 0, 1920, 164);
      ctx.fillStyle = '#9ef6e2'; ctx.font = 'bold 32px Oxanium, monospace'; ctx.textAlign = 'left';
      ctx.fillText('CACHE BACK  /  ORIGINAL MASTER', 42, 45);
      ctx.fillStyle = '#c9e1e8'; ctx.font = '20px Oxanium, monospace';
      ctx.fillText(`${names[section]}   •   ${songSection(s.musicBar)}   •   BAR ${Math.min(100, s.musicBar + 1)} / 100`,
        44, 78, 568);
      ctx.fillStyle = '#faf7e9'; ctx.font = 'bold 53px Oxanium, monospace';
      ctx.fillText(`${Math.round(s.speed * 5.2)}`, 44, 140);
      ctx.fillStyle = '#91bfd1'; ctx.font = '19px Oxanium, monospace'; ctx.fillText('KM/H', 173, 133);
      ctx.fillStyle = s.timeMs < 8000 ? '#ff879d' : '#f7dfaa';
      ctx.font = 'bold 39px Oxanium, monospace'; ctx.fillText(`${(s.timeMs/1000).toFixed(1)}s`, 300, 134);
      ctx.fillStyle = '#a7bcca'; ctx.font = '16px Oxanium, monospace'; ctx.fillText('WINDOW', 303, 96);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < s.integrity ? '#85efd1' : '#374959';
        ctx.fillRect(520 + i*40, 111, 29, 20);
      }
      ctx.fillStyle = '#a7bcca'; ctx.fillText('SIGNAL', 520, 96);
      drawRearview(ctx, s, ['#f6adbb', '#f3b276', '#d2a4f9', '#9aefce'][section], reduced);
      ctx.fillStyle = '#e4ede5'; ctx.font = 'bold 18px Oxanium, monospace'; ctx.textAlign = 'left';
      const chosen = s.pendingCapture;
      const barWait = ((4 - s.musicBeatFloat % 4) * .46875).toFixed(1);
      ctx.fillText(chosen ? `NEXT BAR: ${LANES[chosen.lane]} IN ${barWait}s` :
        'HOLD A LANE .5s: CHOOSE THE NEXT BAR', 1345, 31, 540);
      ctx.fillStyle = '#b5cbd0'; ctx.font = '16px Oxanium, monospace';
      ctx.fillText(`E/RB: NOW + NEXT 4 ${s.lastSnapStartBar === Math.floor(s.musicBar/4)*4 ? 'USED' : 'READY'}`, 1345, 57, 282);
      ctx.fillText('SPACE/A: TURBO    H/Y: ECHO', 1615, 57, 270);
      const meter = (x, label, value, color) => {
        ctx.fillStyle = '#afbdcb'; ctx.font = 'bold 14px Oxanium, monospace'; ctx.fillText(label, x, 80);
        ctx.fillStyle = '#26364b'; ctx.fillRect(x, 87, 196, 14);
        ctx.fillStyle = color; ctx.fillRect(x, 87, 196 * clamp(value/100,0,1), 14);
        ctx.fillStyle = '#f7f8ec'; ctx.font = 'bold 14px Oxanium, monospace'; ctx.fillText(`${Math.round(value)}%`, x + 204, 100);
      };
      meter(1345, 'ECHO', s.echoEnergy, '#83e6fc');
      meter(1615, s.musicBeatFloat < s.zoneEndBeat ? 'ZONE ACTIVE' : 'ZONE', s.lockEnergy, '#d0a4ff');
      ctx.fillStyle = '#e7f4e9'; ctx.font = 'bold 21px Oxanium, monospace';
      ctx.fillText(`SCORE ${s.score}    STACK x${stackSize(s)}`, 1345, 131, 315);
      ctx.fillStyle = s.boost || s.boostMs ? '#fbd899' : '#718995';
      ctx.font = 'bold 17px Oxanium, monospace';
      ctx.fillText(s.boostMs ? 'TURBO ACTIVE' : s.boost ? 'TURBO READY' : 'TURBO CHARGING', 1660, 131, 230);
      // The original four names remain beneath the one-piece mirror.
      for (let i = 0; i < 4; i++) {
        const x = 642 + i * 171;
        const capture = s.captures.find(item => item.lane === i);
        const queued = s.queuedCaptures.find(item => item.lane === i);
        const selected = chosen?.lane === i ? chosen : null;
        ctx.fillStyle = capture || queued ? '#f1fff5' : selected ? '#ffc077' : '#a4bdc4';
        ctx.font = 'bold 13px Oxanium, monospace'; ctx.textAlign = 'left';
        ctx.fillText(`${i+1} ${LANES[i]} ${queued ? `Q${queued.startBeat/4+1}` :
          selected ? `N${selected.startBeat/4+1}` :
          capture ? `${Math.max(0,Math.ceil((capture.endBeat-s.musicBeatFloat)/4))}B` : 'HOLD'}`, x, 145, 165);
        ctx.fillStyle = PALETTE[i]; ctx.globalAlpha = capture ? 1 : queued ? .65 : selected ? .40 : s.lane === i ? .45 : .16;
        ctx.fillRect(x, 151, 162, 5); ctx.globalAlpha = 1;
        if (s.candidateLane === i && s.candidateHold < 1) {
          ctx.fillStyle = '#f1fff5'; ctx.fillRect(x, 158, 162 * s.candidateHold, 3);
        }
      }
      ctx.textAlign = 'left';
      if (s.cutFlashMs) {
        ctx.fillStyle = '#dcfff1'; ctx.font = 'bold 17px Oxanium, monospace';
        ctx.fillText(`CLOSE CUT x${s.cutStreak}  +${s.cutAward}  // ZONE CHARGED`, 1345, 155, 535);
      } else if (s.gateAt != null && progress > s.gateAt - 220 && progress < s.gateAt) {
        ctx.fillStyle = '#e7ffeb'; ctx.font = 'bold 17px Oxanium, monospace';
        ctx.fillText(s.echo ? 'ECHO LEFT • ORIGINAL RIGHT' :
          'H/Y ECHO LEFT • ORIGINAL RIGHT', 1345, 155, 535);
      } else if (s.messageMs > 0 && !s.stumbleMs &&
          !(s.gateAt != null && progress > s.gateAt - 220 && progress < s.gateAt)) {
        ctx.fillStyle = '#b4ffe4';
        ctx.font = 'bold 17px Oxanium, monospace'; ctx.fillText(s.message, 1345, 155, 535);
      }
      // Guidance only appears while its driving lesson is actionable.
      const cue = this.openingCue();
      if (cue) {
        ctx.fillStyle = '#081824d9'; ctx.fillRect(30, 176, 875, 82);
        ctx.fillStyle = '#90efda'; ctx.fillRect(30, 176, 5, 82);
        ctx.textAlign = 'left'; ctx.fillStyle = '#aaf1dc';
        ctx.font = 'bold 13px Oxanium, monospace';
        ctx.fillText('DELIVER THE ORIGINAL RECORDING  /  THE CLEAN COPY ERASED THE NAMES', 48, 196, 835);
        ctx.fillStyle = '#fff5df'; ctx.font = 'bold 21px Oxanium, monospace'; ctx.fillText(cue[0], 48, 222, 835);
        ctx.fillStyle = '#c8e0df'; ctx.font = '17px Oxanium, monospace'; ctx.fillText(cue[1], 48, 246, 835);
      }
      if (this.audioDegraded) {
        ctx.fillStyle = '#ffbb8b'; ctx.font = '20px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText('AUDIO FALLBACK — MIX TIMBRE / ALIGNMENT NEEDS RECHECK', 960, 365);
      }
      if (this.status !== 'playing') {
        ctx.fillStyle = '#061320ed'; ctx.fillRect(370, 280, 1180, 485);
        ctx.strokeStyle = '#9cf9df'; ctx.lineWidth = 3; ctx.strokeRect(370, 280, 1180, 485);
        ctx.fillStyle = '#f5f1ee'; ctx.font = 'bold 47px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.status === 'clear' ? 'ORIGINAL TAPE DELIVERED' :
          s.gateFailure ? 'ORIGINAL EXIT MISSED' :
          s.timeMs <= 0 ? 'TRANSMISSION WINDOW CLOSED' : 'SIGNAL LOST', 960, 380);
        ctx.font = '25px Oxanium, monospace'; ctx.fillStyle = '#9cf9df';
        ctx.fillText(this.status === 'clear' ? 'DELIVERED / UNVERIFIED — Mac sees the distribution blockade.' :
          s.gateFailure === 'wrong-lane' ? 'Cache must take the far-right marked original exit.' :
          s.gateFailure === 'no-echo' ? 'Send Buffer Echo after the exit cue, then steer right.' :
          s.gateFailure === 'no-split' ? 'Give the Echo another lane so the audit follows it.' :
          'Your last road marker remains. Draft, brake and use an Echo to split the audit.', 960, 458);
        ctx.fillStyle = '#e6c8b5'; ctx.font = '22px Oxanium, monospace';
        ctx.fillText(this.status === 'clear' ? 'Proof clear only. Bass awaits the authored Level 2.' :
          s.gateFailure ? 'Retry starts at the Mirror Viaduct marker with a full Echo.' :
          'Collisions cost speed and time. The rival follows a visible warning line.', 960, 506);
        ctx.fillText(s.gateFailure ? 'ENTER / A: RETRY FROM MARKER     C / Y: RETURN TO LEVEL 1' :
          'ENTER / A: RETRY     C / Y: RETURN TO LEVEL 1', 960, 625);
        ctx.fillText('P / MENU: SETTINGS AND EXIT PREVIEW', 960, 672);
      }
      ctx.restore();
    }
  };
  B.Campaign.register(ID, { validate: saved => road.validate(saved), restore: saved => road.restore(saved) });
  B.Campaign.syncTitleButton();
})(window.BARCODE = window.BARCODE || {});
