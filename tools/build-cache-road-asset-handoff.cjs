// Exact projected envelopes of two proposed bank modules over normal game
// frames. The outlines show placement/occlusion reasoning, not finished art.
const fs=require('node:fs');
const path=require('node:path');
const {createCanvas,loadImage,GlobalFonts}=require(require.resolve(
  '@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const out=path.resolve('docs/source-pack/review-cache-production-plan');
GlobalFonts.registerFromPath(path.resolve(
  'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
const worldPath=a=>200*Math.sin(a/700)+90*Math.sin(a/295+.5);
const heading=a=>200/700*Math.cos(a/700)+90/295*Math.cos(a/295+.5);
const depth=d=>1-(d+80)/520;
const projected=(progress,address)=>{
  const t=depth(address-progress),ahead=(1-t)*520;
  const center=960+(worldPath(progress+ahead)-worldPath(progress)-
    ahead*heading(progress))*.95;
  const sidewalk=center-(82+534*t)-(220+190*t)*(.1+.9*t);
  const roadward=sidewalk-20*t,width=1600*t;
  return {t,width,roadward,left:roadward-width,foot:400+680*t*t+24*t};
};
const scale=620/1280, sourceToPanel=scale*2/3;
function module(ctx,progress,address,x0,y0,color,tag) {
  const g=projected(progress,address);
  if(g.t<.05||g.t>1.12)return;
  const x=x0+g.left*sourceToPanel,right=x0+g.roadward*sourceToPanel;
  const bottom=y0+g.foot*sourceToPanel;
  const h=g.width*.50*sourceToPanel;
  // Outline of an upright image footprint; the other strips occlude its
  // bottom. The far module uses the same projection rather than a fade.
  ctx.save();ctx.beginPath();ctx.rect(x0,y0,620,349);ctx.clip();
  ctx.beginPath();ctx.moveTo(x,bottom);ctx.lineTo(x,bottom-h*.52);
  ctx.lineTo(x+(right-x)*.13,bottom-h*.75);
  ctx.lineTo(x+(right-x)*.27,bottom-h*.60);
  ctx.lineTo(x+(right-x)*.39,bottom-h);
  ctx.lineTo(x+(right-x)*.56,bottom-h*.82);
  ctx.lineTo(x+(right-x)*.72,bottom-h*.95);
  ctx.lineTo(right,bottom-h*.63);ctx.lineTo(right,bottom);ctx.closePath();
  ctx.globalAlpha=.18;ctx.fillStyle=color;ctx.fill();ctx.globalAlpha=.95;
  ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.setLineDash([6,5]);ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();ctx.moveTo(Math.max(x,x0),bottom);
  ctx.lineTo(Math.min(right,x0+620),bottom);
  ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#081723e8';ctx.fillRect(Math.max(x0+5,Math.min(x0+505,right-98)),
    Math.max(y0+85,Math.min(y0+322,bottom-29)),99,22);
  ctx.fillStyle=color;ctx.font='500 16px Oxanium';
  ctx.fillText(tag,Math.max(x0+11,Math.min(x0+511,right-92)),
    Math.max(y0+101,Math.min(y0+338,bottom-13)));
  ctx.restore();
}
async function main() {
  const stops=[100,230,360,500];
  const canvas=createCanvas(1280,870),c=canvas.getContext('2d');
  c.fillStyle='#091725';c.fillRect(0,0,1280,870);
  c.fillStyle='#f1f4eb';c.font='500 26px Oxanium';
  c.fillText('TWO WORLD-ADDRESSED PLATES / FOUR MOMENTS IN THE SAME CAMERA',22,35);
  c.fillStyle='#b9cbd1';c.font='400 16px Oxanium';
  c.fillText('Outlines are proposed image footprints on unchanged production frames; colored shapes are not building art.',22,59);
  for(let i=0;i<stops.length;i++) {
    const p=stops[i],x=20+(i%2)*640,y=84+Math.floor(i/2)*365;
    const file=p===230?path.join(out,'baseline','Cache-Road-Mirror-Road-0230.webp'):
      path.join(out,'motion-baseline',`Cache-Road-Mirror-Road-${String(p).padStart(4,'0')}.webp`);
    const img=await loadImage(file);
    c.save();c.beginPath();c.rect(x,y,620,349);c.clip();
    c.drawImage(img,x,y,620,349);c.restore();
    // B is farther down the route and draws first. A approaches and then
    // leaves at the outer edge; an actual near ground strip covers its feet.
    module(c,p,680,x,y,'#70d3ea','B / 680');
    module(c,p,500,x,y,'#ffc779','A / 500');
    c.fillStyle='#081723e8';c.fillRect(x+8,y+7,313,29);
    const a=projected(p,500),b=projected(p,680);
    c.fillStyle='#f3f5ef';c.font='500 17px Oxanium';
    c.fillText(`progress ${p}  ·  A t=${a.t.toFixed(3)}  ·  B t=${b.t.toFixed(3)}`,x+16,y+27);
    c.strokeStyle='#72909d';c.lineWidth=1;c.strokeRect(x,y,620,349);
  }
  c.fillStyle='#f1f4eb';c.font='500 20px Oxanium';
  c.fillText('A stays at address 500. B stays at address 680. The seed never places them again each frame.',22,826);
  c.fillStyle='#b9cbd1';c.font='400 16px Oxanium';
  c.fillText('Both scale with t; far/near ground strips, roofs, and the screen edge hide the handoff. No opacity animation or arbitrary spawn threshold.',22,853);
  fs.writeFileSync(path.join(out,'05-asset-pass-and-handoff.png'),canvas.toBuffer('image/png'));
}
main().catch(err=>{console.error(err.stack||err);process.exitCode=1;});
