// Draws the exact generated graph/asset lots used in the camera review.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createCanvas,GlobalFonts}=require(require.resolve('@napi-rs/canvas',{
  paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]
}));
const context=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync('src/game/cache-road-districts.js','utf8'),context);
const generator=context.window.BARCODE.CacheRoadDistricts;
const seeds=[17,53],extent=1250;
const canvas=createCanvas(1600,930),ctx=canvas.getContext('2d');
GlobalFonts.registerFromPath(path.resolve(
  'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
ctx.fillStyle='#07131d';ctx.fillRect(0,0,1600,930);
const roles={homes:'#4a91a0',shop:'#d69555',works:'#a86a9a',civic:'#e1bd6d'};
const roads={service:'#56aeb5',cross:'#e4a859',loop:'#da79bb',
  spur:'#a18bd2',link:'#92b692',alley:'#889eac'};
for(let panel=0;panel<2;panel++) {
  const seed=seeds[panel],layout=generator.create(seed,1500,'grid');
  const x0=20+panel*790,w=770,mid=x0+w/2;
  const projection=(side,at,radial)=>({
    x:mid+side*(78+(radial-200)*.135),
    y:846-at/extent*732
  });
  ctx.fillStyle='#102634';ctx.fillRect(x0,72,w,788);
  ctx.fillStyle='#182331';ctx.fillRect(mid-72,72,144,788);
  ctx.strokeStyle='#7d6d71';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(mid-72,72);ctx.lineTo(mid-72,860);
  ctx.moveTo(mid+72,72);ctx.lineTo(mid+72,860);ctx.stroke();
  ctx.setLineDash([16,23]);ctx.strokeStyle='#917e69';ctx.lineWidth=1.3;
  for(let lane=-1;lane<=1;lane++){
    ctx.beginPath();ctx.moveTo(mid+lane*36,73);ctx.lineTo(mid+lane*36,860);ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.save();ctx.beginPath();ctx.rect(x0,72,w,788);ctx.clip();
  // These lots, road edges and asset labels come from the same layout object
  // that the production-camera proof projects, without hand-painted edits.
  for(const node of layout.nodes) {
    if(node.at>extent||!node.lot)continue;
    const a=projection(node.side,node.lot.start,node.lot.inner);
    const b=projection(node.side,node.lot.end,node.lot.outer);
    ctx.globalAlpha=.30;ctx.fillStyle=roles[node.role]||'#5a7880';
    ctx.fillRect(Math.min(a.x,b.x),Math.min(a.y,b.y),
      Math.abs(b.x-a.x),Math.abs(b.y-a.y));ctx.globalAlpha=1;
  }
  // The roads are connected world paths. Diagonal and turn segments use
  // actual successive graph points; a loop has both endpoints on cross roads.
  for(const edge of layout.edges) {
    if(!edge.points.some(p=>p.at>=-20&&p.at<=extent+20))continue;
    ctx.strokeStyle=roads[edge.kind];
    ctx.lineWidth=Math.max(2.5,edge.width*.055);
    ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    edge.points.forEach((p,i)=>{
      const q=projection(edge.side,p.at,p.radial);
      if(i)ctx.lineTo(q.x,q.y);else ctx.moveTo(q.x,q.y);
    });ctx.stroke();
  }
  for(const node of layout.nodes) {
    if(node.at>extent||!node.parcel)continue;
    const p=projection(node.side,node.at,node.buildingR);
    ctx.fillStyle=roles[node.role]||'#bfd0d0';
    ctx.beginPath();ctx.arc(p.x,p.y,5,0,2*Math.PI);ctx.fill();
    ctx.font='10px Oxanium';ctx.fillStyle='#d5e9de';
    const label=node.parcel[0].replace(/^cachePlace/,'')
      .replace(/^cache/,'').replace('GroundCluster','Cluster');
    ctx.fillText(label.slice(0,16),p.x+(node.side<0?-92:8),p.y-6);
  }
  ctx.restore();
  ctx.fillStyle='#e9f5e8';ctx.font='bold 22px Oxanium';
  ctx.fillText(`SEED ${seed}`,x0+15,42);
  ctx.font='13px Oxanium';ctx.fillStyle='#a6bdc0';
  ctx.fillText('LEFT BANK',x0+35,92);ctx.fillText('RIGHT BANK',mid+160,92);
  ctx.fillText('Highway',mid-24,460);
  const inFrame=layout.edges.filter(edge=>edge.points.some(p=>p.at<extent));
  const counts=Object.keys(roads).map(kind=>
    `${kind} ${new Set(inFrame.filter(edge=>edge.kind===kind)
      .map(edge=>edge.source)).size}`).join('  ·  ');
  ctx.fillStyle='#c9d6cc';ctx.font='12px Oxanium';
  ctx.fillText(counts,x0+15,886);
}
ctx.fillStyle='#91adb1';ctx.font='12px Oxanium';
ctx.fillText('World distance increases toward the top. Colored lots and labels are chosen by each generated block.',26,914);
const output=path.resolve(process.argv[2]||
  'docs/source-pack/review-cache-district-prototype/Grid-Topology-Seeds-17-53.png');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,canvas.toBuffer('image/png'));
console.log(output);
