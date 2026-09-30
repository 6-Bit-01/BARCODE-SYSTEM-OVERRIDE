// Registered controls and compact route guidance share the existing Canvas.
// The SVG masters use these same badge paths; no image load owns a prompt.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/cache-road-guidance.js',
  exports: ['BARCODE.CacheRoadGuidance'], dependencies: ['BARCODE.ControllerSettings'] });
(function(B) {
  'use strict';
  const BADGES = Object.freeze([
    Object.freeze({name:'SURGE',color:'#8bf2a6',key:'K',shape:'chevron',points:[[50,4],[96,40],[79,40],[79,91],[21,91],[21,40],[4,40]]}),
    Object.freeze({name:'PUSH',color:'#ff917d',key:'L',shape:'hexagon',points:[[25,6],[75,6],[98,50],[75,94],[25,94],[2,50]]}),
    Object.freeze({name:'BRACE',color:'#77ddff',key:'J',shape:'shield',points:[[50,4],[92,19],[85,68],[70,87],[50,98],[30,87],[15,68],[8,19]]}),
    Object.freeze({name:'REFILL',color:'#ffe085',key:'I',shape:'square',points:[[10,8],[90,8],[92,10],[92,90],[90,92],[10,92],[8,90],[8,10]]}),
    Object.freeze({name:'TURBO',color:'#c1afff',key:'SPACE',shape:'pill',points:[[-20,18],[112,18],[127,32],[127,68],[112,82],[-20,82],[-28,68],[-28,32]]}),
    Object.freeze({name:'ECHO',color:'#a3f0e8',key:'H',shape:'pill',points:[[-20,18],[112,18],[127,32],[127,68],[112,82],[-20,82],[-28,68],[-28,32]]})
  ]);
  const LANES=['DRIVE','FLOW','BREAKAWAY','UNDERCURRENT'];
  const LANE_COLORS=['#69d9f5','#ffc077','#cd9dff','#91f5bc'];
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const font=(ctx,size,weight='bold')=>{ctx.font=`${weight} ${size}px Oxanium, sans-serif`;};
  function path(ctx,points) {
    ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
  }
  function label(index) {
    const badge=BADGES[index];
    return badge ? B.GamepadUI?.connected ? B.ControllerSettings?.button(index)||badge.key : badge.key : '';
  }
  function fittedText(ctx,value,x,y,maxWidth,size=20,color='#d9eee6',align='left') {
    const text=String(value??'');ctx.textAlign=align;ctx.textBaseline='middle';
    let measured=size;font(ctx,measured);
    while(measured>12&&ctx.measureText(text).width>maxWidth)font(ctx,--measured);
    ctx.fillStyle=color;ctx.fillText(text,x,y,maxWidth);
    return {x:align==='center'?x-Math.min(maxWidth,ctx.measureText(text).width)/2:x,
      y:y-measured*.55,w:Math.min(maxWidth,ctx.measureText(text).width),h:measured*1.1};
  }
  function buttonGlyph(ctx,text,cx,cy,size,maxWidth=size*1.6) {
    ctx.strokeStyle='#0b2230';ctx.lineWidth=size*.10;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();
    if(text==='✕') {
      ctx.moveTo(cx-size*.3,cy-size*.3);ctx.lineTo(cx+size*.3,cy+size*.3);
      ctx.moveTo(cx+size*.3,cy-size*.3);ctx.lineTo(cx-size*.3,cy+size*.3);ctx.stroke();
    } else if(text==='○') {
      ctx.arc(cx,cy,size*.34,0,Math.PI*2);ctx.stroke();
    } else if(text==='□') {
      ctx.strokeRect(cx-size*.3,cy-size*.3,size*.6,size*.6);
    } else if(text==='△') {
      ctx.moveTo(cx,cy-size*.38);ctx.lineTo(cx+size*.37,cy+size*.28);
      ctx.lineTo(cx-size*.37,cy+size*.28);ctx.closePath();ctx.stroke();
    } else fittedText(ctx,text,cx,cy+1,maxWidth,size,text.length>3?'#12303a':'#0b2230','center');
  }
  function drawButton(ctx,{index=0,x=0,y=0,size=60,label:override,active=false,disabled=false}={}) {
    const badge=BADGES[index]||BADGES[0],width=size*(index>=4?1.55:1);
    ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/100,size/100);
    ctx.globalAlpha*=disabled?.38:1;
    ctx.lineJoin='round';ctx.lineWidth=8;path(ctx,badge.points);
    ctx.strokeStyle='#06141f';ctx.stroke();ctx.fillStyle=badge.color;ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle=active?'#fffce6':'#ffffff99';ctx.stroke();
    if(active) {ctx.lineWidth=3;ctx.strokeStyle='#fffce6';path(ctx,badge.points);ctx.stroke();}
    buttonGlyph(ctx,override??label(index),50,index===0?59:50,index>=4?29:43,index>=4?96:69);
    // Tiny register marks distinguish shoulder functions without relying on hue.
    if(index>=4) {
      ctx.strokeStyle='#14303d';ctx.lineWidth=3;ctx.beginPath();
      if(index===4) {ctx.moveTo(-17,42);ctx.lineTo(-9,50);ctx.lineTo(-17,58);}
      else {ctx.arc(-12,50,7,-1,1);ctx.moveTo(-7,39);ctx.arc(-12,50,12,-1,1);}
      ctx.stroke();
    }
    ctx.restore();
    return {x:x-width/2,y:y-size/2,w:width,h:size};
  }
  function panel(ctx,x,y,w,h,accent) {
    path(ctx,[[x+9,y],[x+w-9,y],[x+w,y+9],[x+w,y+h-9],[x+w-9,y+h],[x+9,y+h],[x,y+h-9],[x,y+9]]);
    ctx.fillStyle='#081c28ed';ctx.fill();ctx.strokeStyle='#47636b';ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle=accent;ctx.fillRect(x+1,y+10,3,h-20);
  }
  function tape(ctx,x,y,size,color='#ffdd96') {
    ctx.save();ctx.translate(x,y);ctx.scale(size/40,size/40);
    ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.strokeRect(-20,-12,40,24);
    for(const xx of [-10,10]) {ctx.beginPath();ctx.arc(xx,0,4,0,Math.PI*2);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(6,0);ctx.stroke();ctx.restore();
  }
  function laneMark(ctx,lane,x,y,size=24) {
    ctx.save();ctx.translate(x,y);ctx.scale(size/40,size/40);
    ctx.strokeStyle=LANE_COLORS[lane]||'#a4e8da';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    if(lane===0)for(const offset of [-10,0,10]){ctx.moveTo(offset-6,12);ctx.lineTo(offset+6,-12);}
    else if(lane===1) {ctx.moveTo(-18,0);ctx.bezierCurveTo(-8,-16,-5,-16,0,0);ctx.bezierCurveTo(5,16,8,16,18,0);}
    else if(lane===2)for(const offset of [-9,9]){ctx.moveTo(offset-7,-13);ctx.lineTo(offset+6,0);ctx.lineTo(offset-7,13);}
    else {ctx.moveTo(-18,6);ctx.lineTo(-8,6);ctx.lineTo(-3,-11);ctx.lineTo(3,14);ctx.lineTo(9,-4);ctx.lineTo(18,-4);}
    ctx.stroke();ctx.restore();
  }
  function objective(road) {
    const s=road.state,bar=s.musicBeatFloat/4;
    if(s.gateOpen)return {stage:3,title:'DELIVER THE ORIGINAL',instruction:'EXIT CLEAR  /  KEEP DRIVING'};
    if(s.gateAt!=null&&s.progress>=s.gateAt-220) return {stage:2,title:'SPLIT THE AUDIT',
      instruction:s.echo?'ECHO SENT  /  TAKE THE FAR-RIGHT EXIT':'HOLD LEFT  /  SEND ECHO  /  EXIT RIGHT'};
    if(bar>=90)return {stage:2,title:'PREPARE THE DELIVERY SPLIT',instruction:'HOLD LEFT  /  SAVE ECHO FOR THE EXIT'};
    if(bar>=76)return {stage:2,title:'ESCAPE THE PURSUIT',instruction:'DODGE THE LOCK  /  PROTECT THE ORIGINAL'};
    if(bar>=52)return {stage:2,title:'CROSS THE AUDIT GRID',instruction:'SEND A DECOY  /  CHANGE LANES'};
    if(bar>=28)return {stage:1,title:'CROSS THE FREIGHT LINE',instruction:'DRAFT  /  FIND THE GAP  /  KEEP MOVING'};
    return {stage:0,title:'DELIVER THE ORIGINAL',instruction:'SURVIVE THE ROUTE  /  KEEP THE TAPE SAFE'};
  }
  function lesson(road,{nextPulse,nextCue}={}) {
    const s=road.state,bar=s.musicBeatFloat/4;
    if(s.gateAt!=null&&s.progress>=s.gateAt-220&&!s.gateOpen) return {index:5,
      title:s.echo?'DECOY LEFT / ORIGINAL RIGHT':'ECHO LEFT / EXIT RIGHT',
      detail:s.echo?'Take the far-right marked exit.':'Send the replay, then steer away from it.'};
    if(bar>=56&&bar<59)return {index:5,title:'SEND ECHO / CHANGE LANES',detail:'Let the scanner follow your replay.'};
    if(bar<4&&!nextPulse)return {index:0,title:'STEER INTO THE MARKED LANE',detail:'Up / Down queues your next gear on ONE.'};
    const record=road.recordOpportunity?.();
    if(record?.active&&(!nextCue||nextCue.remaining>3))return {record:true,title:'OPTIONAL RECORD  /  HOLD AMBER LANE',detail:'Stay 0.65 seconds. Saved to the pause archive.'};
    if(nextPulse&&nextCue?.ready) {
      const inLane=Math.abs(s.lanePos-nextPulse.lane)<=.38;
      return {index:nextPulse.action,active:nextCue.window&&inLane,
        title:nextCue.window&&inLane?'PRESS NOW':`LANE ${nextPulse.lane+1}  /  ${BADGES[nextPulse.action].name}`,
        detail:bar<12?(inLane?'Tap on ONE as the pad meets your rear tires.':'Steer into the marked lane, then tap on ONE.'):
          inLane?'BEAT ONE / REAR-TIRE TARGET':'ENTER THE MARKED LANE / BEAT ONE'};
    }
    if(!s.opening?.held&&bar<12)return {index:0,title:'LINE UP / TAP ON ONE',detail:'Match the colored button when its pad reaches the tires.'};
    if(s.pulseFlashMs>0&&Number.isInteger(s.pulseFlashAction)) {
      const descriptions=['Surge launches on the next ONE.','Push clears your next contact before it expires.',
        'Brace absorbs one impact.','Refill adds Echo charge. Gear 3 also readies Turbo.'];
      return {index:s.pulseFlashAction,title:['SURGE QUEUED','PUSH ARMED','BRACE ARMED','ECHO REFILLED'][s.pulseFlashAction],detail:descriptions[s.pulseFlashAction]};
    }
    if(bar>=12&&bar<16&&!s.opening?.turbo)return {index:4,title:'DRAFT OR PASS CLOSE / TURBO',detail:'Two near misses ready Turbo. Launch on the next ONE.'};
    if(bar>=76&&bar<78)return {index:5,title:'LOCKED LANE / MOVE',detail:'Dodge the rival, or send an Echo to draw it away.'};
    return null;
  }
  function receipt(ctx,s) {
    const live=value=>value&&Number.isFinite(value.expiresMs)&&s.elapsedMs<value.expiresMs;
    const drive=live(s.driveFeedback)?s.driveFeedback:null,mix=live(s.mixFeedback)?s.mixFeedback:null;
    if(!drive&&!mix)return null;
    // A lane receipt belongs under a success only when both report the same
    // award. A later expiry must never appear to be the reward for a hit.
    const combined=drive&&mix&&['perfect','good'].includes(drive.kind)&&
      ['join','extend'].includes(mix.kind)&&drive.lane===mix.lane&&
      Math.abs((drive.atMs||0)-(mix.atMs||0))<=40;
    const d=combined?drive:!mix||drive&&(drive.atMs||0)>=(mix.atMs||0)?drive:mix;
    const failure=['early','late','button','lane','miss'].includes(d.kind);
    const names={perfect:'PERFECT',good:'ON BEAT',early:'TOO EARLY',late:'TOO LATE',button:'WRONG BUTTON',
      lane:'CHANGE LANE',miss:'MISSED',record:'RECORD SAVED',join:'PART IN',extend:'PART HELD',lost:'PART OUT'};
    const color=failure?'#ffab95':d.kind==='record'||d.kind==='lost'?'#ffe085':'#b9ffe0';
    const title=names[d.kind]||d.label||'READY';
    const music=combined?mix:['join','extend','lost'].includes(d.kind)?d:null;
    const instructions={early:'Wait for the target to light.',late:'Tap as the target lights on ONE.',
      button:'Match the shown button.',lane:'Enter the marked lane first.',miss:'Line up for the next pad.',record:'Optional record added to the archive.'};
    const musicLabel=music?`${LANES[music.lane]||music.label||'PART'} ${music.kind==='lost'?'OUT':music.kind==='extend'?'HELD':'IN'}`+
      (music.holdBars>0?` / ${music.holdBars} BARS`:''):'';
    const subtitle=musicLabel||instructions[d.kind]||
      (['perfect','good'].includes(d.kind)?`${LANES[d.lane]||'LANE'} CAPTURED`:d.label)||'READY';
    font(ctx,22);const width=clamp(Math.max(ctx.measureText(title).width,ctx.measureText(subtitle).width)+118,320,560);
    panel(ctx,30,268,width,82,color);
    if(Number.isInteger(d.action))drawButton(ctx,{index:d.action,x:73,y:309,size:48,active:!failure});
    else if(d.kind==='record')tape(ctx,73,309,38);
    else laneMark(ctx,d.lane,73,309,32);
    fittedText(ctx,title,111,293,width-100,25,color);
    if(music) {laneMark(ctx,music.lane,120,323,18);fittedText(ctx,subtitle,139,323,width-125,19,LANE_COLORS[music.lane]);}
    else fittedText(ctx,subtitle,111,323,width-100,18,'#cfdfdf');
    return {x:30,y:268,w:width,h:82};
  }
  function draw(ctx,road,options={}) {
    if(!road?.state||road.status!=='playing')return;
    const s=road.state,goal=objective(road),cue=lesson(road,options);
    ctx.save();ctx.globalAlpha=1;
    panel(ctx,30,174,650,72,'#b7f2d7');tape(ctx,58,195,25,'#b7f2d7');
    fittedText(ctx,goal.title,82,195,452,19,'#e5fff0');
    if(road.chapter)fittedText(ctx,`${road.chapter.records?.length||0}/4 OPTIONAL`,614,195,110,12,'#e5cba0','center');
    for(let i=0;i<4;i++) {
      const x=48+i*151;ctx.fillStyle=i<=goal.stage?'#a6ebd1':'#29444b';ctx.fillRect(x,215,138,3);
    }
    fittedText(ctx,goal.instruction,48,234,610,16,'#b6d8d1');
    if(cue) {
      panel(ctx,1210,174,680,72,cue.record?'#ffe085':BADGES[cue.index??0].color);
      if(cue.record)tape(ctx,1257,209,38);else drawButton(ctx,{index:cue.index,x:1257,y:209,size:42,active:cue.active});
      fittedText(ctx,cue.title,1310,196,558,19,cue.active?'#fff5a8':'#effaef');
      fittedText(ctx,cue.detail,1310,224,558,16,'#c1dcd8');
    }
    receipt(ctx,s);ctx.restore();
  }
  function drawHelp(ctx,road) {
    ctx.save();
    fittedText(ctx,'STEER: LEFT / RIGHT   GEAR: UP / DOWN',440,433,545,19,'#d4dfec');
    const descriptions=['Next ONE: speed burst','Clear one contact','Absorb one hit','+40 Echo; gear 3 Turbo'];
    for(let i=0;i<4;i++) {
      const col=i%2,row=Math.floor(i/2),x=440+col*277,y=466+row*76;
      drawButton(ctx,{index:i,x:x+25,y:y+21,size:44});
      fittedText(ctx,BADGES[i].name,x+56,y+10,194,18,BADGES[i].color);
      fittedText(ctx,descriptions[i],x+56,y+35,194,14,'#d4dfec');
    }
    fittedText(ctx,'MATCH THE PAD  /  PRESS ON BEAT ONE',440,625,548,20,'#a0ffe4');
    fittedText(ctx,'A catch brings that lane into the song.',440,654,548,17,'#d4dfec');
    for(let i=4;i<6;i++) {
      const x=440+(i-4)*277;
      drawButton(ctx,{index:i,x:x+35,y:698,size:43});
      fittedText(ctx,BADGES[i].name,x+80,685,185,17,BADGES[i].color);
      fittedText(ctx,i===4?'Launch next ONE':'100% charge: replay',x+80,709,185,14,'#d4dfec');
    }
    fittedText(ctx,'EXIT: ECHO LEFT / ORIGINAL FAR RIGHT',440,750,548,18,'#a0ffe4');
    tape(ctx,456,784,27);fittedText(ctx,'Optional record: hold its lane for 0.65s.',484,784,506,16,'#e7d2b3');
    ctx.restore();
  }
  B.CacheRoadGuidance=Object.freeze({badges:BADGES,label,drawButton,draw,drawHelp,objective,lesson});
})(window.BARCODE = window.BARCODE || {});
