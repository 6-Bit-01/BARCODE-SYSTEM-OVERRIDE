// Reproducible measurements and overlays for the production Cache Road plan.
// The source frames are made with render-cache-road-mirror.cjs in its normal
// scenery mode. This script does not change the game or invent finished art.
const fs = require('node:fs');
const path = require('node:path');
const {createCanvas, loadImage, GlobalFonts} = require(require.resolve(
  '@napi-rs/canvas', {paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]}));

const out = path.resolve('docs/source-pack/review-cache-production-plan');
const progress = 230;
const S = 2/3, W = 1280, H = 720, FOOT = 190;
const P = {
  road:'#ffd36a', sidewalk:'#63ead4', city:'#75c8ff',
  reveal:'#fa85bb', rear:'#6da7ff', middle:'#d080ff', near:'#ffc477'
};
GlobalFonts.registerFromPath(path.resolve(
  'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const worldPath=at=>200*Math.sin(at/700)+90*Math.sin(at/295+.5);
const heading=at=>200/700*Math.cos(at/700)+90/295*Math.cos(at/295+.5);
const center=(t,p)=>{
  const ahead=(1-t)*520;
  return 960+(worldPath(p+ahead)-worldPath(p)-ahead*heading(p))*.95;
};
const half=t=>82+534*t;
const roadY=t=>400+680*t*t;
const depth=d=>1-(d+80)/520;
const sideX=(side,t,base,growth,p)=>
  center(t,p)+side*(half(t)+(base+growth*t)*(.1+.9*t));
const crest=(x,p)=>400+25+420*Math.pow(clamp(
  (Math.abs(x-center(0,p))-150)/600,0,1),2);
const city=(x,p)=>400+8+18*Math.pow(Math.abs(x-center(0,p))/960,2)+
  6*Math.sin(x/260+p/1700)+2*Math.sin(x/93+p/1100);
const pos=(side,t,base,growth,p)=>[S*sideX(side,t,base,growth,p),S*roadY(t)];

function curve(ctx,fn,color,width=2,dash=[]) {
  ctx.save();ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;
  ctx.lineWidth=width;
  for(let x=0;x<=1920;x+=8) {
    const y=fn(x);if(!x)ctx.moveTo(x*S,y*S);else ctx.lineTo(x*S,y*S);
  }
  ctx.stroke();ctx.restore();
}
function projected(ctx,side,base,growth,p,color,width=2,dash=[]) {
  ctx.save();ctx.beginPath();ctx.setLineDash(dash);
  for(let i=0;i<=80;i++) {
    const t=i/80, [x,y]=pos(side,t,base,growth,p);
    if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.restore();
}
function label(ctx,txt,x,y,color='#f4f7f5',font=17) {
  ctx.save();ctx.font=`500 ${font}px Oxanium`;
  const width=ctx.measureText(txt).width+16;
  ctx.fillStyle='#091521df';ctx.fillRect(x-5,y-font,width,23);
  ctx.fillStyle=color;ctx.fillText(txt,x+3,y+1);ctx.restore();
}
function footer(ctx,title,lines) {
  ctx.fillStyle='#081522';ctx.fillRect(0,H,W,FOOT);
  ctx.fillStyle='#d8e7e5';ctx.font='500 25px Oxanium';
  ctx.fillText(title,28,H+36);
  ctx.font='400 17px Oxanium';
  lines.forEach((line,i)=>ctx.fillText(line,28,H+70+i*26));
}
function save(ctx,name) {
  fs.writeFileSync(path.join(out,name),ctx.canvas.toBuffer('image/png'));
}
function bankBand(ctx,side,low,high,p,color) {
  ctx.beginPath();ctx.moveTo(side<0?0:W,S*roadY(low));
  for(let i=0;i<=48;i++) {
    const t=low+(high-low)*i/48;
    const [x,y]=pos(side,t,220,190,p);ctx.lineTo(x,y);
  }
  ctx.lineTo(side<0?0:W,S*roadY(high));ctx.closePath();
  ctx.save();ctx.fillStyle=color;ctx.globalAlpha=.18;ctx.fill();ctx.restore();
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash([8,6]);ctx.stroke();
  ctx.setLineDash([]);
}
function streetSocket(ctx,side,mouth,outerShift,p) {
  // One projected street mouth crosses the sidewalk and enters an outer
  // network lane. This is a measured footprint, not rendered pavement art.
  const t0=depth(mouth-30-p),t1=depth(mouth+30-p);
  const t2=depth(mouth+outerShift-30-p),t3=depth(mouth+outerShift+30-p);
  const pts=[pos(side,t0,73,50,p),pos(side,t1,73,50,p),
    pos(side,t3,880,360,p),pos(side,t2,880,360,p)];
  ctx.save();ctx.beginPath();ctx.moveTo(...pts[0]);
  for(const pt of pts.slice(1))ctx.lineTo(...pt);ctx.closePath();
  ctx.fillStyle='#f5e6a4';ctx.globalAlpha=.3;ctx.fill();
  ctx.globalAlpha=.9;ctx.strokeStyle='#fff5ca';ctx.lineWidth=2.3;
  ctx.setLineDash([7,5]);ctx.stroke();ctx.restore();
}
function arrow(ctx,a,b,color) {
  ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();
  const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
  ctx.beginPath();ctx.moveTo(...b);
  ctx.lineTo(b[0]-11*Math.cos(angle-.5),b[1]-11*Math.sin(angle-.5));
  ctx.lineTo(b[0]-11*Math.cos(angle+.5),b[1]-11*Math.sin(angle+.5));
  ctx.closePath();ctx.fill();ctx.restore();
}

async function main() {
  fs.mkdirSync(out,{recursive:true});
  const baseline=await loadImage(path.join(out,'baseline',
    'Cache-Road-Mirror-Road-0230.webp'));
  const measurement=createCanvas(W,H+FOOT),m=measurement.getContext('2d');
  m.drawImage(baseline,0,0,W,H);
  curve(m,x=>city(x,progress),P.city,3);
  curve(m,x=>crest(x,progress),P.reveal,3,[8,7]);
  for(const side of [-1,1]) {
    projected(m,side,0,0,progress,P.road,3);
    projected(m,side,220,190,progress,P.sidewalk,3);
  }
  for(const y of [470,570,740]) {
    const t=Math.sqrt((y-400)/680),x1=S*(center(t,progress)-half(t));
    const x2=S*(center(t,progress)+half(t)),sy=S*y;
    m.save();m.strokeStyle='#f7f5e9aa';m.lineWidth=1.5;
    m.setLineDash([4,5]);m.beginPath();m.moveTo(0,sy);m.lineTo(W,sy);m.stroke();m.restore();
    label(m,`y ${y}`,x1+8,sy-7,'#fff4d6',15);
    m.fillStyle=P.road;m.fillRect(x1-4,sy-4,8,8);m.fillRect(x2-4,sy-4,8,8);
  }
  footer(m,'CURRENT GAME / MEASURED GEOMETRY',[
    'Blue: visible city boundary  |  Pink dashed: separate building reveal clip  |  Gold: road edges  |  Mint: outer sidewalk.',
    'At world y=570, the road is x=573..1271. Each visible bank still spans 573 px left / 649 px right (1920-wide source).',
    'The reveal clip reaches y=845 at outer frame edges, then disappears abruptly at depth t=0.75 (world y=783).',
    'Frames use the production drawing code at world progress 230; overlays are measurements, not a changed game.'
  ]);
  save(m,'01-current-measured.png');

  const proposal=createCanvas(W,H+FOOT),q=proposal.getContext('2d');
  q.drawImage(baseline,0,0,W,H);
  // Three overlapping bank-wide coverage envelopes. They are planned
  // footprints for modular plates and do not pretend to be finished artwork.
  for(const side of [-1,1]) {
    bankBand(q,side,.015,.43,progress,P.rear);
    bankBand(q,side,.28,.72,progress,P.middle);
    bankBand(q,side,.57,1.10,progress,P.near);
  }
  streetSocket(q,-1,progress+225,30,progress);
  streetSocket(q,1,progress+315,-25,progress);
  projected(q,-1,220,190,progress,'#e4fff9',2);
  projected(q,1,220,190,progress,'#e4fff9',2);
  label(q,'REAR ROOFS',16,293,P.rear,16);
  label(q,'MIDDLE BLOCK',18,378,P.middle,16);
  label(q,'NEAR FRONTAGE',17,528,P.near,16);
  label(q,'STREET SOCKET',938,323,'#fff5ca',16);
  arrow(q,[1015,331],[1053,354],'#fff5ca');
  footer(q,'PROPOSED COVERAGE / SAME GAME CAMERA',[
    'Color envelopes show where large illustrated plates must overlap. They are footprint diagrams, not replacement scenery.',
    'Rear t=.015–.43; middle t=.28–.72; near t=.57–1.10. Each bank covers outward from the sidewalk and overscans screen edge.',
    'Two example street mouths use world addresses +225 and +315, cross a real sidewalk socket, then enter outer block lanes.',
    'The front strip occludes the middle plate feet; the middle strip occludes rear feet. No per-object alpha appearance.'
  ]);
  save(q,'02-proposed-coverage.png');

  const diagram=createCanvas(W,H+FOOT),d=diagram.getContext('2d');
  d.fillStyle='#0c1b2b';d.fillRect(0,0,W,H+FOOT);
  d.fillStyle='#e9f2ee';d.font='500 25px Oxanium';
  d.fillText('WORLD LAYOUT',40,43);d.fillText('DEPTH-ORDERED DRAW',680,43);
  d.font='400 17px Oxanium';d.fillStyle='#b6cbd0';
  d.fillText('Top down / address increases upward',40,70);
  d.fillText('Side view / player is at the bottom',680,70);
  // Schematic road graph with explicit sockets, sidewalks, and parcels.
  const xRoad0=260,xRoad1=410,top=100,base=650;
  d.fillStyle='#233343';d.fillRect(xRoad0,top,xRoad1-xRoad0,base-top);
  d.fillStyle='#6a8690';d.fillRect(242,top,18,base-top);d.fillRect(410,top,18,base-top);
  d.strokeStyle=P.road;d.lineWidth=2;d.strokeRect(xRoad0,top,xRoad1-xRoad0,base-top);
  for(const y of [210,385,560]) {
    d.strokeStyle='#516378';d.setLineDash([8,9]);d.beginPath();
    d.moveTo(335,y-65);d.lineTo(335,y+65);d.stroke();d.setLineDash([]);
  }
  const segments=[
    [[80,210],[80,540]],[[592,205],[592,510]],
    [[242,195],[80,210],[80,285]],[[428,285],[592,266],[592,205]],
    [[242,445],[85,455],[80,540]],[[428,540],[590,510],[592,395]]
  ];
  d.strokeStyle='#b1c5c3';d.lineCap='round';d.lineJoin='round';d.lineWidth=40;
  for(const pts of segments){d.beginPath();d.moveTo(...pts[0]);for(const pt of pts.slice(1))d.lineTo(...pt);d.stroke();}
  d.strokeStyle='#34444f';d.lineWidth=28;
  for(const pts of segments){d.beginPath();d.moveTo(...pts[0]);for(const pt of pts.slice(1))d.lineTo(...pt);d.stroke();}
  for(const [x,y,w,h] of [[35,115,160,65],[26,315,160,65],[35,570,165,65],
    [480,110,132,70],[463,320,145,65],[475,570,145,65]]) {
    d.strokeStyle=P.middle;d.lineWidth=2;d.setLineDash([7,5]);d.strokeRect(x,y,w,h);d.setLineDash([]);
  }
  label(d,'CONNECTED ARTERY',266,375,P.road,16);
  label(d,'PARCEL SOCKET',40,152,P.middle,15);
  label(d,'LOCAL LANE',468,269,'#e1f4ef',15);
  label(d,'SIDEWALK',428,615,P.sidewalk,15);
  // The right side shows the actual compositing dependency, not unrelated
  // strips assembled on top of one flat background.
  const layer=(y,color,title,detail)=>{
    d.fillStyle=color;d.globalAlpha=.22;d.fillRect(700,y,535,85);d.globalAlpha=1;
    d.fillStyle=color;d.fillRect(700,y,9,85);
    d.fillStyle='#f2f5f0';d.font='500 19px Oxanium';d.fillText(title,725,y+32);
    d.fillStyle='#d4e0dd';d.font='400 16px Oxanium';d.fillText(detail,725,y+59);
  };
  layer(112,P.rear,'1  Rear plate + roof silhouettes','Begins behind the visible city boundary');
  layer(217,P.middle,'2  Middle ground + connected streets','Existing world graph; paving is opaque');
  layer(322,P.middle,'3  Middle upright plates','Feet buried in their world depth strip');
  layer(427,P.near,'4  Near ground strip + frontage','Overlaps and hides the middle plate feet');
  layer(532,P.sidewalk,'5  Continuous road + sidewalk','Same progress and perspective as the banks');
  d.strokeStyle='#d9e3dd';d.lineWidth=2;
  for(const y of [203,308,413,518])arrow(d,[966,y-1],[966,y+12],'#d9e3dd');
  footer(d,'CONTENT RULES / ONE SEEDED WORLD',[
    'Chunks provide compatible street and sidewalk sockets. Parcel fronts and pedestrians are placed from that graph.',
    'Six neighborhood families supply rear/middle/front plates; individual existing buildings and props add local variation.',
    'Draw far to near by world depth. The next opaque ground strip covers old feet and street ends; no transparency reveal.'
  ]);
  save(d,'03-world-and-draw-order.png');

  const measures={source:'src/game/cache-road-proof.js production draw',
    frame:'baseline/Cache-Road-Mirror-Road-0230.webp',frameProgress:progress,
    sourceResolution:[1920,1080],reviewResolution:[1280,720],
    geometry:{horizonY:400,roadY:'400 + 680*t*t',roadHalf:'82 + 534*t',
      depth:'1-(distance+80)/520',
      roadWidthAtHorizon:164,roadWidthAtBottom:1232,
      currentPlaceClipStopsAtT:.75,clipStopY:roadY(.75)},
    rows:[425,470,570,740,910].map(y=>{
      const t=Math.sqrt((y-400)/680);
      return {y,depth:+t.toFixed(3),roadEdges:[center(t,progress)-half(t),center(t,progress)+half(t)].map(Math.round),
        outerSidewalk:[sideX(-1,t,220,190,progress),sideX(1,t,220,190,progress)].map(Math.round),
        visibleBankWidths:[center(t,progress)-half(t),1920-center(t,progress)-half(t)].map(Math.round),
        groundBeyondSidewalk:[sideX(-1,t,220,190,progress),
          1920-sideX(1,t,220,190,progress)].map(Math.round)};
    }),
    artInventory:[]};
  for(const name of ['ground-cluster-left-01.webp','ground-cluster-left-02.webp',
    'ground-cluster-left-03.webp','ground-cluster-right-01.webp',
    'ground-cluster-right-02.webp','ground-cluster-right-03.webp']) {
    const img=await loadImage(path.resolve('assets/cache-road/world',name));
    const c=createCanvas(128,64),cx=c.getContext('2d');cx.drawImage(img,0,0,128,64);
    const a=cx.getImageData(0,0,128,64).data;
    let opaque=0;for(let i=3;i<a.length;i+=4)if(a[i]>=250)opaque++;
    measures.artInventory.push({name,size:[img.width,img.height],
      opaqueCanvasFraction:+(opaque/(128*64)).toFixed(3)});
  }
  fs.writeFileSync(path.join(out,'Measurements.json'),JSON.stringify(measures,null,2)+'\n');
  console.log(path.join(out,'01-current-measured.png'));
}
main().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
