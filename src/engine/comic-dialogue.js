// Shared, measured comic lettering. Page authors own placement; this renderer
// owns only ink and text, with no input, persistence, timers or audio.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({name:'src/engine/comic-dialogue.js',exports:['BARCODE.ComicDialogue'],dependencies:[]});
(function(B) {
  'use strict';
  const ink='#090e18',paper='#f2eadb';
  const colors=Object.freeze({'6 BIT':'#e6e5ee','DJ FLOPPYDISC':'#83e9ff',
    'CACHE BACK':'#ffd65c','MAC MODEM':'#ff929c'});
  const fontSize=30,lineHeight=32;
  function wrap(ctx,value,width) {
    const lines=[];let line='';
    for(const word of value.split(' ')) {
      const candidate=line?`${line} ${word}`:word;
      if(line&&ctx.measureText(candidate).width>width){lines.push(line);line=word;}
      else line=candidate;
    }
    if(line)lines.push(line);return lines;
  }
  function box(ctx,x,y,w,h,cut=12) {
    ctx.beginPath();ctx.moveTo(x+cut,y);ctx.lineTo(x+w-cut,y);
    ctx.lineTo(x+w,y+cut);ctx.lineTo(x+w,y+h-cut);ctx.lineTo(x+w-cut,y+h);
    ctx.lineTo(x+cut,y+h);ctx.lineTo(x,y+h-cut);ctx.lineTo(x,y+cut);ctx.closePath();
  }
  function text(ctx,value,x,y,size,color) {
    ctx.font=`bold ${size}px Oxanium, sans-serif`;ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillStyle=color;ctx.fillText(value,x,y);
  }
  function layouts(ctx,dialogue,placements,rect) {
    ctx.save();
    const result=dialogue.map(([label,body],i)=>{
      const p=placements[i],speaker=label.replace(/\s*\/\s*COMMS$/,'');
      const radio=p.radio===true||/\/\s*COMMS$/.test(label);
      ctx.font=`bold ${fontSize}px Oxanium, sans-serif`;
      const lines=wrap(ctx,body,p.w-56),h=70+lines.length*lineHeight;
      const tail=!radio&&p.tail&&rect?[rect.x+p.tail[0]*rect.w,rect.y+p.tail[1]*rect.h]:null;
      const channel=radio?`${speaker} / COMMS`:speaker;
      ctx.font='bold 20px Oxanium, sans-serif';
      const labelRect={x:p.x+22,y:p.y+9,w:ctx.measureText(channel).width+20,h:29};
      return {...p,h,tail,radio,speaker,label:channel,lines,fontSize,lineHeight,
        accent:colors[speaker]||'#a7f2d3',serial:i+1,labelRect,
        textRect:{x:p.x+28,y:p.y+50,w:p.w-56,h:lines.length*lineHeight}};
    });
    ctx.restore();return result;
  }
  function tail(ctx,l) {
    if(!l.tail)return;
    const [tx,ty]=l.tail;
    const baseX=l.x+Math.max(46,Math.min(l.w-46,
      Number.isFinite(l.tailBase)?l.tailBase*l.w:tx-l.x));
    const baseY=ty>l.y+l.h/2?l.y+l.h-5:l.y+5;
    ctx.beginPath();ctx.moveTo(baseX-19,baseY);ctx.lineTo(tx,ty);ctx.lineTo(baseX+19,baseY);ctx.closePath();
    ctx.strokeStyle=ink;ctx.lineWidth=8;ctx.stroke();ctx.fillStyle=paper;ctx.fill();
  }
  function balloon(ctx,l) {
    const {x,y,w,h,accent,radio}=l;
    box(ctx,x+7,y+8,w,h);ctx.fillStyle=ink;ctx.fill();
    box(ctx,x,y,w,h);ctx.strokeStyle=ink;ctx.lineWidth=8;ctx.stroke();
    ctx.fillStyle=radio?'#101d2c':paper;ctx.fill();
    ctx.strokeStyle=radio?accent:'#c8bfaf';ctx.lineWidth=2;ctx.stroke();
    // Speaker color, reading order and a receiver meter distinguish radio
    // from in-scene speech without suggesting a false physical speaker.
    box(ctx,l.labelRect.x,l.labelRect.y,l.labelRect.w,l.labelRect.h,5);
    ctx.fillStyle=accent;ctx.fill();
    text(ctx,l.label,l.labelRect.x+10,l.labelRect.y+4,20,ink);
    text(ctx,`0${l.serial}`,x+w-53,y+16,17,radio?accent:'#716b65');
    if(radio) {
      ctx.fillStyle=accent;ctx.fillRect(x+12,y+50,3,h-72);
      for(let i=0;i<4;i++)ctx.fillRect(x+w-109+i*9,y+29-i*4,5,5+i*4);
    }
    l.lines.forEach((line,i)=>text(ctx,line,l.textRect.x,l.textRect.y+i*lineHeight,fontSize,radio?paper:ink));
  }
  function draw(ctx,measured,{cue,cueElapsedMs,reduced}) {
    const shown=measured.slice(0,cue);
    function paint(l,fn) {
      ctx.save();ctx.lineJoin='round';ctx.shadowBlur=0;
      ctx.globalAlpha*=!reduced&&cue===l.serial ? .4+.6*Math.min(1,Math.max(0,cueElapsedMs)/180):1;
      fn(ctx,l);ctx.restore();
    }
    // All pointers sit under every balloon, including the next speaker's.
    shown.forEach(l=>paint(l,tail));shown.forEach(l=>paint(l,balloon));
  }
  B.ComicDialogue=Object.freeze({layouts,draw,colors});
})(window.BARCODE=window.BARCODE||{});
