// Bake static gate hardware with the production renderer. No runtime canvases
// or per-segment filters are needed by the shipped game.
const fs=require('fs'),path=require('path');
const {createCanvas}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
const {createRig}=require('./check-level-01-boss');
const {installArt}=require('./render-cat-chaos.cjs');
async function main(){
 const {w,p,context}=createRig();await installArt(w,context);
 const out=path.resolve(__dirname,'../assets/street-hardware');fs.mkdirSync(out,{recursive:true});
 const manifest=[];
 for(const [i,g] of w.Sector1Progression.ENCOUNTER_GATES.entries()){
  const {left,top,width,height}=p.getGateHardwareLayout(g);
  const c=createCanvas(width*2,height),ctx=c.getContext('2d');
  for(let frame=0;frame<2;frame++){
   ctx.save();ctx.translate(frame*width-left,-top);
   if(frame)ctx.filter="saturate(0) brightness(.65)";
   p.drawBarrierHardwareModules(ctx,g,!!frame,frame);ctx.restore();
  }
  const file='slim-gate-'+(i+1)+'.webp';fs.writeFileSync(path.join(out,file),c.toBuffer('image/webp',90));
  manifest.push({id:'gateHardware'+(i+1),path:'assets/street-hardware/'+file,left,top,width,height,columns:2,frames:2});
 }
 fs.writeFileSync(path.join(out,'geometry.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(manifest);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
