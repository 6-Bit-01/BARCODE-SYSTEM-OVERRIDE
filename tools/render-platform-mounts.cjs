// Production Canvas drawing with the existing native host/image adapters.
// These captures verify placement and screen motion, not hosted Makko play.
const fs=require('fs'),path=require('path'),assert=require('assert'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
const {createRig}=require('./check-level-01-boss');
const {installArt}=require('./render-cat-chaos.cjs');
async function main() {
 const out=path.resolve(process.argv[2]||'docs/source-pack/review-platform-mounts');fs.mkdirSync(out,{recursive:true});
 const {w,p,context}=createRig();await installArt(w,context);p.startMission();
 const buildings=await loadImage(path.join(root,'assets/world-v3/buildings.webp'));
 const c=createCanvas(1400,1100),ctx=c.getContext('2d');
 const props=w.Sector1Progression.TRAVERSAL_PROPS;
 for(let i=0;i<props.length;i++){
  const prop=props[i],tx=i%3*466,ty=Math.floor(i/3)*275;
  ctx.save();ctx.beginPath();ctx.rect(tx,ty,466,275);ctx.clip();ctx.fillStyle='#292534';ctx.fillRect(tx,ty,466,275);
  ctx.translate(tx+155-prop.x,ty+90-prop.y);ctx.drawImage(buildings,-152,-550,4400,1589);
  p.drawTraversalProps(ctx,true);p.drawTraversalProps(ctx,false);ctx.restore();
  ctx.fillStyle='#101821';ctx.fillRect(tx,ty,466,29);ctx.fillStyle='#e0ecd9';ctx.font='14px sans-serif';ctx.fillText(prop.id,tx+10,ty+20);
 }
 fs.writeFileSync(path.join(out,'mount-placements.webp'),c.toBuffer('image/webp'));
 const scene=createCanvas(1200,600),s=scene.getContext('2d');
 function drawScene(){
  s.fillStyle='#252033';s.fillRect(0,0,1200,600);s.save();s.translate(-180,-380);
  s.drawImage(buildings,-152,-550,4400,1589);p.drawTraversalProps(s,true);s.restore();
 }
 drawScene();fs.writeFileSync(path.join(out,'terminal-clearance.webp'),scene.toBuffer('image/webp'));
 const still=s.getImageData(0,0,1200,600).data;
 p.districtSignal.elapsedMs=4000;drawScene();
 const jitter=s.getImageData(0,0,1200,600).data, terminal=props.find(prop=>prop.asset==='broadcastTerminal');
 let changed=0;
 for(let pixel=0;pixel<1200*600;pixel++) {
  const i=pixel*4;if(still[i]===jitter[i]&&still[i+1]===jitter[i+1]&&still[i+2]===jitter[i+2])continue;
  const x=pixel%1200,y=Math.floor(pixel/1200);changed++;
  assert(x>=terminal.x+40-180&&x<=terminal.x+115-180&&y>=terminal.y+30-380&&y<=terminal.y+96-380,'jitter stays inside the painted screen');
 }
 assert(changed>0,'the painted waveform actually animates');
 w.BARCODE_RENDER_QUALITY={flashes:false};drawScene();
 assert.deepStrictEqual(s.getImageData(0,0,1200,600).data,still,'reduced flashes keeps the original screen still');
 w.BARCODE_RENDER_QUALITY={flashes:true};
 const frames=[];
 for(let i=0;i<108;i++){
  p.districtSignal.elapsedMs=i*1000/24;drawScene();frames.push(scene.toBuffer('image/png'));
 }
 const result=spawnSync('ffmpeg',['-loglevel','error','-y','-framerate','24','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'terminal-jitter.mp4')],{input:Buffer.concat(frames),maxBuffer:1024*1024});
 if(result.status!==0)throw new Error(result.stderr.toString());
 console.log('Native mount placements, terminal/door/awning clearance and 4.5-second screen animation saved.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
