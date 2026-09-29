// Magnified production sweeper draw, with the actual atlas loader and no Makko.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {createCanvas,Image}=require(require.resolve('@napi-rs/canvas',{
  paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const {createRig,load}=require('./check-level-01-boss');

async function main() {
  const output=path.resolve(process.argv[2]);
  const revision=process.argv[3];
  const {w,context}=createRig();
  delete w.MakkoEngine;
  w.localStorage={getItem(){return null;},setItem(){}};
  load(context,'src/game/lore-collection.js');
  w.lostDataSystem.archive=new w.BARCODE.LoreCollection();
  load(context,'src/game/campaign-services.js');
  load(context,'src/game/cache-road-landscape.js');
  const pending=[];
  w.Image=class extends Image {
    set src(url) {
      const file=url.slice(url.indexOf('assets/'));
      if(!file.endsWith('/sweeper-frames.webp'))return;
      pending.push(new Promise((resolve,reject)=>{
        const loaded=this.onload;
        this.onload=()=>{loaded();resolve();};this.onerror=reject;
        super.src=path.resolve(file);
      }));
    }
  };
  load(context,'src/engine/presentation-assets.js');
  await Promise.all(pending);
  let source=revision?execFileSync('git',['show',`${revision}:src/game/cache-road-proof.js`],
    {encoding:'utf8'}):fs.readFileSync('src/game/cache-road-proof.js','utf8');
  const marker='  B.Campaign.register(ID,';
  if(!source.includes(marker))throw Error('Missing vehicle review hook');
  source=source.replace(marker,'  window.drawReviewVehicle=drawVehicle;\n'+marker);
  vm.runInContext(source,context,{filename:'src/game/cache-road-proof.js'});
  const canvas=createCanvas(1280,880),ctx=canvas.getContext('2d');
  const draw=w.BARCODE.PresentationAssets.draw;
  let calls=0;
  w.BARCODE.PresentationAssets.draw=(...args)=>{if(args[0]==='cacheSweeper')calls++;return draw(...args);};
  const frames=[];
  for(let cel=0;cel<8;cel++) {
    const x=(cel%4)*320,y=Math.floor(cel/4)*440;
    ctx.fillStyle='#152733';ctx.fillRect(x,y,320,440);
    ctx.fillStyle='#afc9cf';ctx.font='18px sans-serif';
    ctx.fillText(`CEL ${cel+1} / ${cel<4?'LEFT':'RIGHT'} TURN`,x+18,y+30);
    const before=calls;
    w.drawReviewVehicle(ctx,x+145,y+402,205,250,'sweeper',
      {phase:(cel+.2)/.11,steer:cel<4?-1:1});
    frames.push({cel,atlasDraws:calls-before});
  }
  fs.mkdirSync(path.dirname(output),{recursive:true});
  fs.writeFileSync(output,await canvas.encode('webp',88));
  console.log(JSON.stringify({output,revision:revision||'working tree',makko:false,frames}));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
