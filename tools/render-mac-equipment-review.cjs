#!/usr/bin/env node
'use strict';
// Native-pixel diagnostic through the exact production Mac attachment renderer.
// This renders review output only; registered production bitmap files are read-only.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const assert=require('node:assert/strict'),{createCanvas,Image}=require('@napi-rs/canvas');
const source=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||path.join(source,'..','verification','mac-street-equipment-20261006'));
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inputFiles=['src/game/mac-combat-preview.js','src/game/mac-combat-frames.js','src/game/mac-street-combat.js','mac-equipment-review.html','assets/mac-combat-frames/mac-combat-frames-v1.json','assets/mac-street-dynamic/mac-modem-actions-v1.json','assets/mac-street-power/mac-street-power-v1.json'];
const sourceInputs=inputFiles.map(file=>({path:file,sha256:sha(path.join(source,file))}));
const window={BARCODE:{},console,Image,crypto:crypto.webcrypto,TextDecoder,Uint8Array,URLSearchParams,
  fetch:async relative=>{const bytes=fs.readFileSync(path.join(source,relative));return{ok:true,json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}};
window.window=window;
const context=vm.createContext(window);
for(const file of ['src/game/mac-street-combat.js','src/game/mac-combat-frames.js','src/game/mac-combat-preview.js'])vm.runInContext(fs.readFileSync(path.join(source,file),'utf8'),context,{filename:file});
const html=fs.readFileSync(path.join(source,'mac-equipment-review.html'),'utf8'),script=html.match(/<script id="equipment-review">([\s\S]*?)<\/script>/);
assert(script,'Private page shares its review pose selection with this native renderer');vm.runInContext(script[1],context,{filename:'mac-equipment-review.html'});
async function run(){
  const previous=process.cwd();process.chdir(source);
  try{await window.BARCODE.MacCombatPreview.prepare();}finally{process.chdir(previous);}
  const B=window.BARCODE,R=B.MacEquipmentReview,P=B.MacCombatPreview;
  const cellWidth=840,width=cellWidth*4,rowHeight=440,canvas=createCanvas(width,rowHeight*R.weapons.length+80),ctx=canvas.getContext('2d');
  ctx.fillStyle='#09121d';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#eee5d1';ctx.font='24px sans-serif';ctx.fillText('Native equipment · production drawing method · still pose review',24,36);
  const placements=[];
  const contactScenes=[{id:'idle',facing:-1},{id:'idle',facing:1},{id:'weapon-active',facing:-1},{id:'weapon-active',facing:1}];
  function drawCard(ctx,kind,{id,facing},left,top){
    const scene=R.scenes.find(item=>item.id===id);
    ctx.save();ctx.beginPath();ctx.rect(left,top,cellWidth,rowHeight);ctx.clip();ctx.translate(left,top);R.floor(ctx,cellWidth,rowHeight,390);
    ctx.fillStyle='#e9d8b5';ctx.font='18px sans-serif';ctx.fillText(B.MacStreetCombat.weapons[kind].name+' · '+scene.title+' · '+(facing<0?'left':'right'),14,28);
    const placement=R.drawWeapon(ctx,kind,scene,facing,{x:cellWidth/2,feet:390,height:260});ctx.restore();
    assert(placement.pose.gripAnchor||placement.pose.frame.embeddedWeapon===kind,'Native weapon has a registered grip or complete embedded cel');
    return {weapon:kind,scene:id,facing,frame:placement.pose.frame.id,embeddedWeapon:placement.pose.frame.embeddedWeapon||null,gripAnchor:placement.pose.gripAnchor,weaponAngle:placement.pose.weaponAngle,itemLayer:placement.pose.itemLayer,handOcclusion:placement.pose.handOcclusion};
  }
  for(const [row,kind]of R.weapons.entries())for(const [column,entry]of contactScenes.entries())placements.push(drawCard(ctx,kind,entry,column*cellWidth,80+row*rowHeight));
  fs.mkdirSync(out,{recursive:true});const imagePath=path.join(out,'equipment-contact-sheet.png');fs.writeFileSync(imagePath,canvas.toBuffer('image/png'));
  const guardRun=createCanvas(width,rowHeight*R.weapons.length+80),gctx=guardRun.getContext('2d');
  R.floor(gctx,guardRun.width,guardRun.height,0);gctx.fillStyle='#eee5d1';gctx.font='24px sans-serif';gctx.fillText('Native equipment · Guard and Run · production drawing method',24,36);
  for(const[row,kind]of R.weapons.entries())for(const[column,entry]of [{id:'guard',facing:-1},{id:'guard',facing:1},{id:'run-0',facing:-1},{id:'run-0',facing:1}].entries())drawCard(gctx,kind,entry,column*cellWidth,80+row*rowHeight);
  const guardRunPath=path.join(out,'equipment-guard-run.png');fs.writeFileSync(guardRunPath,guardRun.toBuffer('image/png'));
  const individual=[];
  for(const kind of R.weapons){const panel=createCanvas(cellWidth*2,rowHeight*2),pctx=panel.getContext('2d');for(const[index,entry]of contactScenes.entries())drawCard(pctx,kind,entry,(index%2)*cellWidth,Math.floor(index/2)*rowHeight);const file=path.join(out,'equipment-'+kind+'.png');fs.writeFileSync(file,panel.toBuffer('image/png'));individual.push(file);}
  for(const kind of R.weapons){const panel=createCanvas(cellWidth*2,rowHeight*2),pctx=panel.getContext('2d');for(const[index,entry]of[{id:'guard',facing:-1},{id:'guard',facing:1},{id:'run-0',facing:-1},{id:'run-0',facing:1}].entries())drawCard(pctx,kind,entry,(index%2)*cellWidth,Math.floor(index/2)*rowHeight);const file=path.join(out,'guard-run-'+kind+'.png');fs.writeFileSync(file,panel.toBuffer('image/png'));individual.push(file);}
  const eligibleCanvas=createCanvas(840,720),eligibleContext=eligibleCanvas.getContext('2d');let eligiblePoseCount=0;
  for(const kind of R.weapons)for(const scene of R.scenes)for(const facing of [-1,1]){R.floor(eligibleContext,840,720,600);const placed=R.drawWeapon(eligibleContext,kind,scene,facing,{x:420,feet:600,height:260});assert(Number.isFinite(placed.handX)&&Number.isFinite(placed.handY));eligiblePoseCount++;}
  const props=['car_intact','car_van_intact','crate_intact','barrel_intact','fixture_terminal_intact','fixture_streetlight_intact'];
  const comparison=createCanvas(1600,780*props.length),pctx=comparison.getContext('2d');
  for(const[row,name]of props.entries()){if(!P.powerArt.cells[name])continue;const top=row*780;pctx.save();pctx.translate(0,top);R.floor(pctx,1600,780,680);pctx.fillStyle='#e9d8b5';pctx.font='24px sans-serif';pctx.fillText(name.replaceAll('_',' ')+' · Mac 260',24,38);R.drawProp(pctx,name);pctx.restore();}
  const propPath=path.join(out,'equipment-proportions.png');fs.writeFileSync(propPath,comparison.toBuffer('image/png'));
  const carry=createCanvas(cellWidth*4,880),cctx=carry.getContext('2d');
  for(const[row,kind]of ['crate','barrel'].entries())for(const[column,entry]of [{state:'carry',facing:-1},{state:'carry',facing:1},{state:'release',facing:-1},{state:'release',facing:1}].entries()){
    cctx.save();cctx.translate(column*cellWidth,row*440);R.floor(cctx,cellWidth,440,390);cctx.fillStyle='#e9d8b5';cctx.font='18px sans-serif';cctx.fillText(kind+' · '+entry.state+' · '+(entry.facing<0?'left':'right'),14,28);R.drawProp(cctx,kind+'_intact',entry.state,{x:cellWidth/2,feet:390,facing:entry.facing});cctx.restore();
  }
  const carryPath=path.join(out,'equipment-carry.png');fs.writeFileSync(carryPath,carry.toBuffer('image/png'));
  for(const input of sourceInputs)assert.equal(sha(path.join(source,input.path)),input.sha256,'Native render inputs changed during review: '+input.path);
  const receipt={scope:'Code-rendered native RGBA review through MacCombatPreview.drawMacPose and production sampler; browser and gameplay acceptance remain separate.',eligiblePoseCount,images:[imagePath,propPath,carryPath,guardRunPath,...individual].map(file=>({path:file,sha256:sha(file)})),sourceInputs,placements};
  fs.writeFileSync(path.join(out,'equipment-render-review.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({status:'rendered',images:receipt.images,placements:placements.length},null,2));
}
run().catch(error=>{console.error(error);process.exitCode=1;});
