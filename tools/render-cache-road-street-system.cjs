// Review-only placeholder study. The world layout is generated once from a
// seed; the same world coordinates drive the plan, camera frames and motion.
// Nothing in this file is loaded by the playable game.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]
}));

const W=1920,H=1080,OUT=path.resolve(process.argv[2] ||
  'docs/source-pack/review-cache-street-system');
const seed=Number(process.argv[3] || 37);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const hash=(side,i,salt=0)=>{
  let n=(seed^Math.imul(side+5,0x9e3779b9)^
    Math.imul(i+31,0x85ebca6b)^Math.imul(salt+83,0xc2b2ae35))>>>0;
  n=Math.imul(n^(n>>>16),0x7feb352d);
  n=Math.imul(n^(n>>>15),0x846ca68b);
  return ((n^(n>>>16))>>>0)/4294967296;
};
const palette={sky:'#241d39',land:'#2d444a',asphalt:'#252b39',
  local:'#354650',walk:'#647a7a',edge:'#d3b885',mark:'#d2d5c3',
  lot:'#436264',open:'#568071',card:['#54787d','#967770','#7889a0','#a09372']};
const polygon=(c,pts,fill)=>{
  if(pts.length<3)return;
  c.beginPath();c.moveTo(pts[0].x,pts[0].y);
  for(const p of pts.slice(1))c.lineTo(p.x,p.y);
  c.closePath();if(fill){c.fillStyle=fill;c.fill();}
};
const line=(c,pts,color,width)=>{
  c.beginPath();c.moveTo(pts[0].x,pts[0].y);
  for(const p of pts.slice(1))c.lineTo(p.x,p.y);
  c.lineWidth=width;c.strokeStyle=color;c.stroke();
};

// Each bank has a through street, deeper linked streets and intentionally
// staggered connections to the main road. Edges, junctions and parcels all
// come from this graph. No street is painted as an isolated decoration.
function world() {
  const edges=[],lots=[],nodes=[];
  const edge=(side,a,b,kind,width)=>edges.push({side,a,b,kind,width});
  for(const side of [-1,1]) {
    const start=side<0?[-100,160,400,650,900,1150]:
      [-190,50,300,560,810,1060];
    const street=start.map((s,i)=>({s:s+(i===0||i===start.length-1?0:
      Math.round((hash(side,i,1)-.5)*38)),r:365+
      Math.round((hash(side,i,2)-.5)*88)}));
    const back=start.map((s,i)=>({s:street[i].s+
      Math.round((hash(side,i,3)-.5)*105),r:730+
      Math.round((hash(side,i,4)-.5)*115)}));
    for(let i=0;i<street.length;i++) {
      nodes.push({side,...street[i],kind:'local'});
      nodes.push({side,...back[i],kind:'back'});
      if(i<street.length-1) {
        const bend={s:lerp(street[i].s,street[i+1].s,.48),
          r:lerp(street[i].r,street[i+1].r,.48)+
            (hash(side,i,5)-.5)*62};
        edge(side,street[i],bend,'through',46);
        edge(side,bend,street[i+1],'through',46);
        edge(side,back[i],back[i+1],'back',35);
        // One diagonal through every other deep block makes actual wedges.
        if(hash(side,i,66)<.37)
          edge(side,street[i],back[i+1],'diagonal',29);
      }
      if(i>0&&i<street.length-1) {
        const mouth={s:street[i].s+(side<0?-29:26),r:0};
        const knee={s:lerp(mouth.s,street[i].s,.58),r:160};
        edge(side,mouth,knee,'access',49);
        edge(side,knee,street[i],'access',49);
        nodes.push({side,...mouth,kind:'main'});
        edge(side,street[i],back[i],'cross',36);
      } else edge(side,street[i],back[i],'cross',36);
    }
    // Blocks are the spaces between junctions. Split their frontages into
    // variable parcel widths, leaving road clearances at both ends.
    for(let i=0;i<street.length-1;i++) {
      const a=street[i],b=street[i+1],span=b.s-a.s;
      const count=span>245?3:2;
      for(let k=0;k<count;k++) {
        const s0=lerp(a.s,b.s,k/count)+27;
        const s1=lerp(a.s,b.s,(k+1)/count)-27;
        const s=(s0+s1)/2;
        const frontR=lerp(a.r,b.r,(k+.5)/count);
        lots.push({side,s0,s1,s,r:165+hash(side,i*9+k,11)*76,
          kind:'front',height:150+hash(side,i*9+k,12)*86,
          color:Math.floor(hash(side,i*9+k,13)*4)});
        if(k!==count-1||i%2) {
          lots.push({side,s0:s0+8,s1:s1-6,s:s+10,
            r:frontR+121+hash(side,i*9+k,14)*60,
            kind:'middle',height:175+hash(side,i*9+k,15)*90,
            color:Math.floor(hash(side,i*9+k,16)*4)});
        }
      }
      // A connected interior contains a court or workshop cluster, not
      // another mandatory roadside row of identical cards.
      lots.push({side,s0:a.s+span*.25,s1:b.s-span*.24,
        s:lerp(a.s,b.s,.51),r:775+hash(side,i,18)*75,
        kind:i%3===1?'court':'deep',height:165+hash(side,i,19)*105,
        color:Math.floor(hash(side,i,20)*4)});
    }
  }
  // The diagonal can occupy a parcel. A fit test leaves that parcel open;
  // buildings never cover a through street simply to fill empty space.
  const usable=lots.filter(lot=>lot.kind==='court'||!edges.some(e=>{
    if(e.side!==lot.side)return false;
    const vx=e.b.s-e.a.s,vy=e.b.r-e.a.r;
    const t=clamp(((lot.s-e.a.s)*vx+(lot.r-e.a.r)*vy)/
      (vx*vx+vy*vy),0,1);
    const distance=Math.hypot(lot.s-(e.a.s+t*vx),
      lot.r-(e.a.r+t*vy));
    return distance<e.width/2+42;
  }));
  return {edges,nodes,lots:usable};
}

function camera(progress) {
  const pathAt=s=>200*Math.sin(s/700)+90*Math.sin(s/295+.5);
  const heading=200/700*Math.cos(progress/700)+90/295*Math.cos(progress/295+.5);
  const eye=pathAt(progress);
  const center=t=>960+(pathAt(progress+(1-t)*520)-eye-(1-t)*520*heading)*.95;
  const half=t=>82+534*t;
  const depth=s=>1-(s-progress+80)/520;
  const roadY=t=>400+680*t*t;
  const project=(side,p)=>{
    const t=depth(p.s);
    const roll=(13*Math.sin(p.s/117+side*.36)+
      5*Math.sin(p.s/49+p.r/360))*clamp(p.r/290,0,1)*t;
    return {x:center(t)+side*(half(t)+p.r*(.1+.9*t)),
      y:roadY(t)+p.r*.012*t+roll,t};
  };
  return {center,half,depth,roadY,project};
}

function disk(c,point,r,color){
  c.beginPath();c.arc(point.x,point.y,r,0,Math.PI*2);
  c.fillStyle=color;c.fill();
}
function roadRibbon(c,cam,e,width,color) {
  const dx=e.b.s-e.a.s,dy=e.b.r-e.a.r;
  const d=Math.hypot(dx,dy),nx=dy/d*width/2,ny=-dx/d*width/2;
  const sides=[{s:e.a.s+nx,r:e.a.r+ny},
    {s:e.b.s+nx,r:e.b.r+ny},
    {s:e.b.s-nx,r:e.b.r-ny},
    {s:e.a.s-nx,r:e.a.r-ny}];
  polygon(c,sides.map(p=>cam.project(e.side,p)),color);
}
function cityAndTerrain(c,cam,progress) {
  const sky=c.createLinearGradient(0,0,0,480);
  sky.addColorStop(0,'#17233d');sky.addColorStop(.5,'#67445d');
  sky.addColorStop(1,'#c17d76');
  c.fillStyle=sky;c.fillRect(0,0,W,H);
  // Distant city is a quieter depth behind the bold terrain boundary.
  for(let i=0;i<85;i++) {
    const x=i*25-40-(progress*.035)%25,h=43+hash(1,i,55)*100;
    c.fillStyle=i%3?'#324158':'#3c4a62';
    c.fillRect(x,402-h,22+hash(1,i,56)*16,h+23);
  }
  const crest=x=>405+12*Math.pow(Math.abs(x-cam.center(0))/960,2)+
    3*Math.sin(x/170+progress/400);
  const land=c.createLinearGradient(0,400,0,H);
  land.addColorStop(0,'#3b595a');land.addColorStop(1,palette.land);
  c.beginPath();c.moveTo(0,crest(0));
  for(let x=20;x<=W;x+=20)c.lineTo(x,crest(x));
  c.lineTo(W,H);c.lineTo(0,H);c.closePath();
  c.fillStyle=land;c.fill();
  c.beginPath();c.moveTo(0,crest(0));
  for(let x=20;x<=W;x+=20)c.lineTo(x,crest(x));
  c.strokeStyle='#172c39';c.lineWidth=8;c.stroke();
  // Broad, translucent bands mark the near terrain's rolling contours.
  // They use the same projection and world addresses as street geometry.
  for(let s=Math.floor((progress+490)/160)*160;s>progress-80;s-=160) {
    const f=s+80,n=s-80;
    for(const side of [-1,1]) {
      const quad=[{s:f,r:45},{s:n,r:45},{s:n,r:1200},
        {s:f,r:1200}].map(p=>cam.project(side,p));
      const low=c.createLinearGradient(0,quad[0].y,0,quad[1].y);
      low.addColorStop(0,'#79a29700');
      low.addColorStop(.5,'#79a29720');
      low.addColorStop(1,'#79a29700');
      polygon(c,quad,low);
    }
  }
  // Every contour is keyed to world distance, so it rolls with roads/cards.
  for(let s=Math.floor((progress+440)/60)*60;s>progress-80;s-=60) {
    const t=cam.depth(s);if(t<.05||t>1.05)continue;
    for(const side of [-1,1]) {
      const a=cam.project(side,{s,r:72});
      const b=cam.project(side,{s,r:1100});
      line(c,[a,b],s%120===0?'#74908a33':'#a6b5a627',1+t*2);
    }
  }
}

function drawGraph(c,cam,graph,progress) {
  const visible=e=>Math.max(cam.depth(e.a.s),cam.depth(e.b.s))>.03&&
    Math.min(cam.depth(e.a.s),cam.depth(e.b.s))<1.2;
  // Grade is shared: road and sidewalk ribbons project through one camera.
  // Junction disks join the quad edges and cover any tiny wedge gaps.
  for(const e of graph.edges.filter(visible))
    roadRibbon(c,cam,e,e.width+18,palette.walk);
  for(const node of graph.nodes) {
    if(node.kind==='main'||cam.depth(node.s)<.03||cam.depth(node.s)>1.2)continue;
    const p=cam.project(node.side,node);
    disk(c,p,(27+9)*(.12+.88*p.t),palette.walk);
  }
  for(const e of graph.edges.filter(visible))
    roadRibbon(c,cam,e,e.width,palette.local);
  for(const node of graph.nodes) {
    if(node.kind==='main'||cam.depth(node.s)<.03||cam.depth(node.s)>1.2)continue;
    const p=cam.project(node.side,node);
    disk(c,p,27*(.12+.88*p.t),palette.local);
  }
  // Main asphalt covers the exact inner edge of the side road, joining it
  // without the former parapet/wall. Sidewalk segments yield at each mouth.
  const left=[],right=[];
  for(let j=0;j<=72;j++) {
    const t=j/60;
    left.push({x:cam.center(t)-cam.half(t),y:cam.roadY(t)});
    right.push({x:cam.center(t)+cam.half(t),y:cam.roadY(t)});
  }
  polygon(c,[...left,...right.reverse()],palette.asphalt);
  // Broken road center and lanes are anchored to route distance.
  for(let s=Math.floor((progress+440)/52)*52;s>progress-80;s-=52) {
    if(Math.floor(s/52)%2===0)continue;
    const a=clamp(cam.depth(s+20),.01,1.15),b=clamp(cam.depth(s),.01,1.15);
    for(const n of [-.5,0,.5]) {
      const points=[a,b].map(t=>({x:cam.center(t)+n*cam.half(t),
        y:cam.roadY(t)}));
      line(c,points,'#c3c6b4ba',1+3*b);
    }
  }
  for(const side of [-1,1]) {
    const mouths=graph.nodes.filter(n=>n.side===side&&n.kind==='main');
    for(let s=Math.floor((progress+445)/11)*11;s>progress-80;s-=11) {
      if(mouths.some(m=>Math.abs(s-m.s)<42))continue;
      const t=cam.depth(s),u=cam.depth(s-11);
      if(t<.02||u>1.15)continue;
      const p=cam.project(side,{s,r:0});
      const q=cam.project(side,{s:s-11,r:0});
      const po=cam.project(side,{s,r:41});
      const qo=cam.project(side,{s:s-11,r:41});
      polygon(c,[p,q,qo,po],palette.walk);
      line(c,[p,q],palette.edge,1+2*t);
    }
  }
}

function parcelsOnGround(c,cam,graph) {
  for(const lot of graph.lots) {
    const t=cam.depth(lot.s);
    if(t<.12||t>1.05)continue;
    const patch=[{s:lot.s0+6,r:lot.r-71},
      {s:lot.s1-6,r:lot.r-71},{s:lot.s1-6,r:lot.r+71},
      {s:lot.s0+6,r:lot.r+71}].map(p=>cam.project(lot.side,p));
    c.globalAlpha=.35;
    polygon(c,patch,lot.kind==='court'?palette.open:palette.lot);
    c.globalAlpha=.6;
    line(c,[...patch,patch[0]],'#718e8b',1.2);
    c.globalAlpha=1;
  }
}

function drawCard(c,cam,lot,progress) {
  const t=cam.depth(lot.s);
  if(t<.04||t>1.25)return;
  const foot=cam.project(lot.side,{s:lot.s,r:lot.r});
  const scale=.13+.9*t;
  const width=(lot.kind==='deep'?260:
    lot.kind==='middle'?222:205)*scale;
  const height=lot.height*(.21+1.05*t);
  const x=foot.x-width/2,y=foot.y-height;
  if(x>W+110||x+width< -110)return;
  if(lot.kind==='court') {
    const patch=cam.project(lot.side,{s:lot.s,r:lot.r+35});
    c.fillStyle=palette.open;
    c.beginPath();c.ellipse(patch.x,patch.y,width*.8,12+24*t,
      0,0,Math.PI*2);c.fill();
    for(let i=0;i<3;i++) {
      const px=x+width*(.2+i*.31),py=foot.y-5;
      line(c,[{x:px,y:py},{x:px,y:py-(18+24*t)}],
        '#233a3b',2+2*t);
      disk(c,{x:px,y:py-(18+24*t)},7+8*t,'#8ab6a0');
    }
    return;
  }
  // The near roll hides the lower wall until the whole footing clears it.
  // No card fades and no card carries a separate patch of painted ground.
  const reveal=clamp((t-.07)/.36,0,1);
  const hidden=(1-reveal)*height*.62;
  c.save();c.beginPath();c.rect(x-6,y-8,width+12,height-hidden+14);
  c.clip();
  if(reveal>.9) {
    c.fillStyle='#0c172383';c.beginPath();
    c.ellipse(foot.x,foot.y+2,Math.max(12,width*.62),6+7*t,0,0,7);
    c.fill();
  }
  c.fillStyle=palette.card[lot.color];c.fillRect(x,y,width,height);
  c.fillStyle='#263747';c.fillRect(x+width*.73,y+height*.19,width*.27,
    height*.81);
  c.fillStyle='#c1b6a0';c.fillRect(x-3,y-4,width+6,5+2*t);
  c.fillStyle='#253748';c.fillRect(x+width*.37,y-height*.16,
    width*.43,height*.16);
  c.fillStyle='#d4a579';c.fillRect(x+width*.35,y-height*.18,
    width*.47,3+2*t);
  const floors=Math.max(2,Math.floor(height/23));
  for(let row=0;row<floors;row++)for(let col=0;col<3;col++) {
    const ww=width*.14,xx=x+width*(.09+col*.2),yy=y+13+row*(height-23)/floors;
    c.fillStyle=(row+col+lot.color)%3===0?'#efc37d':'#253f50';
    c.fillRect(xx,yy,ww,Math.max(3,5*t+2));
  }
  c.fillStyle='#1a303d';
  c.fillRect(x+width*.45,foot.y-25*scale,width*.16,25*scale);
  c.restore();
}
function life(c,cam,graph) {
  for(const n of graph.nodes) {
    if(n.kind!=='local')continue;
    const t=cam.depth(n.s);if(t<.3||t>1.03)continue;
    const p=cam.project(n.side,{s:n.s-31,r:n.r-44});
    c.strokeStyle='#e2c58e';c.lineWidth=2+t*2;
    c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y-27*t);c.stroke();
    disk(c,{x:p.x,y:p.y-27*t},4+2*t,'#f6d18b');
    const walker=cam.project(n.side,{s:n.s+35,r:n.r+39});
    disk(c,{x:walker.x,y:walker.y-12*t},3+3*t,'#dbb398');
    line(c,[{x:walker.x,y:walker.y-10*t},
      {x:walker.x,y:walker.y}], '#bacac5',2+t);
  }
}
function render(c,graph,progress) {
  c.reset();const cam=camera(progress);
  cityAndTerrain(c,cam,progress);
  drawGraph(c,cam,graph,progress);
  parcelsOnGround(c,cam,graph);
  graph.lots.slice().sort((a,b)=>b.s-a.s).forEach(lot=>
    drawCard(c,cam,lot,progress));
  life(c,cam,graph);
  // A restrained car silhouette makes scale and the actual camera crop clear.
  const carY=cam.roadY(.83),carX=cam.center(.83);
  c.fillStyle='#0b1624b8';c.beginPath();c.ellipse(carX,carY+80,102,25,0,0,7);c.fill();
  polygon(c,[{x:carX-83,y:carY+69},{x:carX-66,y:carY-2},
    {x:carX-44,y:carY-39},{x:carX+44,y:carY-39},
    {x:carX+66,y:carY-2},{x:carX+83,y:carY+69}], '#e7b944');
  polygon(c,[{x:carX-42,y:carY-28},{x:carX+42,y:carY-28},
    {x:carX+56,y:carY+1},{x:carX-56,y:carY+1}], '#263f51');
  c.fillStyle='#ef6783';c.fillRect(carX-75,carY+38,30,8);
  c.fillRect(carX+45,carY+38,30,8);
  c.fillStyle='#0c1a2cca';c.fillRect(0,0,W,88);
  c.fillStyle='#e3e1c7';c.font='bold 36px Oxanium';
  c.fillText('CACHE ROAD  /  CONNECTED STREET SYSTEM',39,52);
  c.font='22px Oxanium';c.fillStyle='#a2c5be';
  c.fillText('SHARED GROUND  •  CONNECTED ROADS  •  PARCEL FIT  •  GROUNDLESS CARDS',39,80);
  c.fillStyle='#122235c9';c.fillRect(1540,20,340,54);
  c.font='21px Oxanium';c.fillStyle='#f1cf87';
  c.fillText(`SEED ${seed}  /  ${Math.round(progress)} UNITS`,1557,55);
}

function plan(c,graph) {
  c.reset();c.fillStyle='#142535';c.fillRect(0,0,W,H);
  c.fillStyle='#e9dec9';c.font='bold 50px Oxanium';
  c.fillText('ONE GENERATED DISTRICT / PLAN VIEW',60,68);
  c.font='24px Oxanium';c.fillStyle='#a7bdb8';
  c.fillText('The camera frames below use this exact street graph and these exact lots.',60,110);
  // World s runs vertically. This diagram is a check on street connectivity;
  // the main review is in the camera sequence.
  const map=p=>({x:1170+p.side*(42+p.r*.42),y:985-(p.s+190)*.59});
  c.fillStyle=palette.asphalt;c.fillRect(1128,155,84,850);
  c.fillStyle=palette.mark;c.font='21px Oxanium';
  c.fillText('MAIN ROAD',1083,1031);
  for(const e of graph.edges) {
    const a=map({...e.a,side:e.side}),b=map({...e.b,side:e.side});
    line(c,[a,b],palette.walk,(e.width+25)*.45);
    line(c,[a,b],palette.local,e.width*.45);
  }
  for(const lot of graph.lots) {
    const p=map(lot),w=Math.max(12,(lot.s1-lot.s0)*.33);
    const r=lot.kind==='court'?16:lot.kind==='deep'?24:19;
    c.fillStyle=lot.kind==='court'?palette.open:palette.card[lot.color];
    c.fillRect(p.x-r,p.y-w/2,r*2,w);
    c.strokeStyle='#d8d5bc';c.lineWidth=2;
    c.strokeRect(p.x-r,p.y-w/2,r*2,w);
  }
  for(const node of graph.nodes.filter(n=>n.kind==='main')) {
    const p=map(node);disk(c,p,8,'#f2c76c');
  }
  const legend=[['#f2c76c','MAIN ROAD JUNCTION'],
    [palette.local,'LINKED LOCAL STREET'],
    [palette.card[0],'BUILDING PARCEL'],
    [palette.open,'OPEN COURT / GREEN']];
  legend.forEach(([color,label],i)=>{
    c.fillStyle=color;c.fillRect(60,240+i*62,25,25);
    c.fillStyle='#e1decf';c.font='23px Oxanium';
    c.fillText(label,102,262+i*62);
  });
  c.font='22px Oxanium';c.fillStyle='#a7bdb8';
  c.fillText('The spaces between streets become lots and courtyards.',60,565);
  c.fillText('Every local route joins the next street or the main road.',60,603);
  c.fillText('A card is omitted if a street cuts its footprint.',60,641);
  c.fillStyle='#f2c76c';c.fillText('DRIVE DIRECTION',1680,1022);
  polygon(c,[{x:1840,y:950},{x:1821,y:991},{x:1859,y:991}],'#f2c76c');
}

async function main() {
  fs.mkdirSync(OUT,{recursive:true});
  GlobalFonts.registerFromPath(path.resolve(
    'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const graph=world(),full=createCanvas(W,H),c=full.getContext('2d');
  const small=createCanvas(1280,720),sc=small.getContext('2d');
  plan(c,graph);
  fs.writeFileSync(path.join(OUT,'Generated-Street-Plan.webp'),
    full.toBuffer('image/webp',90));
  const stages=[0,140,280];
  const montage=createCanvas(1280,2160),mc=montage.getContext('2d');
  for(let i=0;i<stages.length;i++) {
    render(c,graph,stages[i]);sc.drawImage(full,0,0,1280,720);
    const label=['FAR / STREETS AND ROOFS CRESTING',
      'MIDDLE / CONNECTED BLOCK READABLE',
      'NEAR / JUNCTION AND LOTS ROLL PAST'][i];
    fs.writeFileSync(path.join(OUT,`${i+1}-${label.split(' / ')[0]}.webp`),
      small.toBuffer('image/webp',88));
    // Decode each saved still to avoid a canvas-backed source being reused
    // while the next stage is drawn by some native canvas implementations.
    mc.drawImage(await loadImage(path.join(OUT,
      `${i+1}-${label.split(' / ')[0]}.webp`)),0,i*720);
    mc.fillStyle='#102231d9';mc.fillRect(0,i*720+675,710,45);
    mc.fillStyle='#f1d38e';mc.font='bold 27px Oxanium';
    mc.fillText(label,25,i*720+707);
  }
  fs.writeFileSync(path.join(OUT,'One-Block-Three-Distances.webp'),
    montage.toBuffer('image/webp',90));
  const videoPath=path.join(OUT,'Connected-District-Drive.mp4');
  const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','rawvideo',
    '-pix_fmt','rgba','-s','1280x720','-r','18','-i','pipe:0',
    '-an','-c:v','libx264','-threads','2','-preset','veryfast',
    '-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',videoPath],
    {stdio:['pipe','ignore','pipe']});
  let ffErr='';ff.stderr.on('data',data=>{ffErr+=data;});
  const completion=once(ff,'close');
  for(let frame=0;frame<7*18;frame++) {
    render(c,graph,frame*300/(7*18-1));
    sc.drawImage(full,0,0,1280,720);
    if(!ff.stdin.write(Buffer.from(sc.getImageData(0,0,1280,720).data)))
      await once(ff.stdin,'drain');
  }
  ff.stdin.end();const [code]=await completion;
  if(code!==0)throw Error(ffErr||`ffmpeg ${code}`);
  fs.writeFileSync(path.join(OUT,'README.md'),
    `# Cache Road connected street system / review only\n\n`+
    `Seed ${seed}; camera uses the current game horizon (400/1080), `+
    `road projection, width, and bend. New shapes are placeholders.\n\n`+
    `The plan, three camera stills, and seven-second drive use the same `+
    `generated graph and parcel set. Side street ribbons have linked `+
    `junctions; lots are split from the resulting blocks and are omitted `+
    `when a street occupies their footprint. The world moves by advancing `+
    `the camera progress, rather than translating independent layers.\n\n`+
    `This is a standalone renderer study. It does not alter playable `+
    `terrain, art, traffic, HUD or music. It does not establish final `+
    `street widths, card art, animation, or parcel rules.\n`);
  console.log(JSON.stringify({videoPath,edges:graph.edges.length,
    parcels:graph.lots.length,still:stages},null,2));
}
main().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
