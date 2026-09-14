// Approved illustrated HUD. Draw-only: no timers, contexts or gameplay writes.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/comic-hud.js', exports: ['BARCODE.ComicHUD'], dependencies: [] });
(function () {
  const B = window.BARCODE = window.BARCODE || {};
  const C = Object.freeze({ ink:'#0b1017', paper:'#eee8d6', green:'#c0ed55', teal:'#70efe0', purple:'#a98ee9', muted:'#a4b7b6', red:'#ed6b4e' });
  const health = Object.freeze({ x:196.25, y:128.75, width:431.25, height:36.25 });
  const lore = Object.freeze({ x:1642.5, y:138.75, width:241.25, height:53.75 });
  function polygon(c, points, fill, stroke, width=2) {
    c.beginPath(); points.forEach((p,i)=>i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath();
    c.fillStyle=fill; c.fill(); if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  function plate(c,x,y,w,h,fill=C.ink,edge=C.paper) {
    polygon(c,[[x+7,y+7],[x+w+7,y+3],[x+w-5,y+h+7],[x+3,y+h+4]],'#03070c');
    polygon(c,[[x,y+3],[x+w-14,y],[x+w,y+14],[x+w-4,y+h],[x+9,y+h-3],[x,y+h-15]],fill,edge);
  }
  function text(c,t,x,y,size=22,color=C.paper,weight=600,align='left',maxWidth) {
    c.font=`${weight} ${size}px Oxanium, monospace`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';
    if(maxWidth) c.fillText(String(t),x,y,maxWidth); else c.fillText(String(t),x,y);
  }
  function barcode(c,x,y,w,h,fill) {
    let at=x,n=0;c.fillStyle=fill;
    while(at<x+w){const bw=[3,5,2,7,3,2,5][n++%7];c.fillRect(at,y,Math.min(bw,x+w-at),h);at+=bw+2;}
  }
  function begin(c) { c.save();c.globalAlpha=1;c.shadowBlur=0;c.scale(1.25,1.25); }
  function basic(c, { player, rhythm, progress, score, pad, training }) {
    begin(c);
    const active=!!rhythm?.isActive?.(), max=Math.max(1,player?.maxHealth||3), hp=Math.max(0,Math.min(max,player?.health||0));
    plate(c,22,22,508,139);
    polygon(c,[[27,29],[144,27],[135,154],[31,154]],'#253441',C.paper);
    c.save();c.beginPath();c.rect(31,29,106,123);c.clip();
    if(!B.PresentationAssets?.draw('hudPortrait',c,{x:85.5,y:88.5,width:127,height:127})) text(c,'6 BIT',84,90,27,C.paper,700,'center');
    c.restore();
    text(c,'6 BIT',157,51,32,C.paper,700);
    text(c,active?'RHYTHM COMBAT':'SIGNAL ACTIVE',505,53,16,active?C.green:C.muted,600,'right');
    text(c,'HEALTH',157,84,16,C.muted);text(c,`${hp} / ${max}`,506,84,18,C.paper,600,'right');
    const segment=345/max;
    for(let i=0;i<max;i++) {
      const x=157+i*segment, w=segment-8;
      polygon(c,[[x,103],[x+w,103],[x+w-8,132],[x-8,132]],i<hp?'#27372a':'#302731');
      barcode(c,x+1,106,w-10,22,i<hp?C.green:'#503c46');
    }
    c.fillStyle=C.purple;c.fillRect(156,146,346,3);
    plate(c,1200,23,310,76,C.paper,C.ink);
    text(c,'SCORE',1220,42,16,C.ink);text(c,String(Math.max(0,score||0)).padStart(6,'0'),1488,64,31,C.ink,700,'right',260);
    plate(c,1314,111,193,43);text(c,'LORE',1330,132,16,C.muted);text(c,`${progress?.collected||0} / ${progress?.total||3}`,1488,132,23,C.paper,600,'right');
    if(!active){plate(c,26,179,213,36,C.ink,C.muted);text(c,`[${pad?'B':'R'}] RHYTHM MODE`,43,197,17);}
    if(progress?.saved===false) text(c,'ARCHIVE SAVE UNAVAILABLE — KEEP TAB OPEN',26,active?448:312,12,'#ffc68a',600,'left',500);
    if(training) text(c,'DEAD AIR DISTRICT / CREW TRAINING',810,158,16,C.purple,600,'center',530);
    c.restore();
  }
  function objectives(c,{ title, detail, kick }) {
    begin(c);c.translate(1293,218);c.rotate((kick||0)*.038);
    plate(c,-213,-48,426,97,C.ink,C.muted);
    polygon(c,[[-211,-46],[-200,-47],[-204,47],[-210,42]],C.green);
    text(c,title,-186,-23,22,C.paper,700,'left',378);
    text(c,detail,-186,13,15,C.muted,600,'left',378);
    c.restore();
  }
  function boss(c,status) {
    begin(c);const counter=!!status.canReceiveDamage,color=counter?C.teal:C.red;
    plate(c,585,26,580,111,C.ink,color);
    text(c,'SECTOR 1 BOSS',607,51,24,C.paper,700);
    const phase=counter?'COUNTER WINDOW':status.phase==='ready'?'GET READY':status.doublePulse?'DOUBLE PULSE':'GROUND PULSE';
    text(c,phase,1142,51,17,color,700,'right',290);
    const ratio=Math.max(0,Math.min(1,status.health/Math.max(1,status.maxHealth)));
    for(let i=0;i<12;i++) { c.fillStyle='#27333c';c.fillRect(607+i*44,78,37,17);const fill=Math.max(0,Math.min(1,ratio*12-i));c.fillStyle=color;c.fillRect(607+i*44,78,37*fill,17); }
    const cue=counter?(status.canStompCounter?'TIMED HIT OR LANDING STOMP':'TIMED HIT · STOMP UNAVAILABLE'):status.doublePulse?'JUMP BOTH PULSES. WATCH FOR CYAN.':'JUMP THE PULSE. WATCH FOR CYAN.';
    text(c,cue,607,117,16,C.paper,600,'left',535);c.restore();
  }
  function rhythm(c,{ lane, pattern, pad, combo, established, tempoBeat, tempoBeats }) {
    begin(c);const color=pattern==='discharge'?C.purple:pattern==='wave'?C.teal:C.green;
    plate(c,24,183,554,170,C.ink,color);
    polygon(c,[[24,186],[330,183],[314,217],[26,221]],color);
    text(c,'RHYTHM COMBAT',42,204,22,C.ink,700);text(c,`[${pad?'B':'R'}] EXIT`,554,205,17,C.paper,600,'right');
    c.fillStyle='#1b2930';c.fillRect(46,243,330,53);
    c.save();c.beginPath();c.rect(46,243,330,53);c.clip();
    c.strokeStyle='#536968';c.lineWidth=1;c.beginPath();c.moveTo(46,270);c.lineTo(376,270);c.stroke();
    // Existing transport-derived note coordinates are mapped into the new lane.
    // The same x=96 beat crossing still hits the fixed target exactly.
    for(const note of lane.notes) {
      const x=152+(note.x-96)*(52/82), onTarget=Math.abs(note.x-96)<6;
      polygon(c,[[x-5,252],[x+9,252],[x+4,287],[x-10,287]],onTarget?C.paper:note.downbeat?color:C.muted);
      if(note.downbeat) barcode(c,x-3,255,8,29,C.ink);
    }
    c.restore();c.fillStyle=C.paper;c.fillRect(150.5,235,3,68);
    polygon(c,[[141,231],[162,231],[152,241]],C.paper);
    text(c,pad?'X':'DOWN',46,325,19,C.paper,700);
    text(c,!lane.ready?'WAITING FOR MUSIC':!established?`FIND THE BEAT ${tempoBeat}/${tempoBeats}`:'HIT ON THE MARK',120,325,15,C.muted,600,'left',252);
    text(c,'COMBO',413,242,16,C.muted);text(c,pattern.toUpperCase(),554,242,11,C.muted,600,'right',81);
    text(c,combo,480,288,String(combo).length>3?48:70,color,700,'center',150);
    text(c,combo>=10?'CHAIN · 2 MAX':combo>=5?`${10-combo} TO DISCHARGE`:`${5-combo} TO WAVE`,554,328,15,color,700,'right',178);
    c.restore();
  }
  function amp(c,{charges,notice,visible,active}) {
    if(!visible)return;begin(c);const y=active?368:229;
    plate(c,25,y,303,63,C.ink,C.muted);text(c,charges?'AMP':'AMP EMPTY',43,y+21,18,C.paper);
    for(let i=0;i<3;i++) polygon(c,[[184+i*37,y+12],[214+i*37,y+12],[209+i*37,y+30],[179+i*37,y+30]],i<charges?C.purple:'#313440');
    const message=notice?.kind==='pickup'?'3 HITS · LONGER ENEMY REACH':notice?.kind==='empty'?'DEPLETED · NORMAL REACH':charges?'ON-BEAT HITS: ENEMY REACH +':'NORMAL REACH';
    text(c,message,43,y+47,12,C.muted,600,'left',269);c.restore();
  }
  B.ComicHUD=Object.freeze({health,lore,C,polygon,plate,text,basic,objectives,boss,rhythm,amp});
})();
