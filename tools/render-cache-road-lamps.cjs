// Enlarged production lamp source/beam review; actual world stills are separate.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
async function main(){
  const out=path.resolve(process.argv[2]||'docs/source-pack/review-cache-lamps-chip-sound');
  fs.mkdirSync(out,{recursive:true});
  const {w,context}=createRig(),B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};
  load(context,'src/engine/cache-road-proof-profile.js');
  load(context,'src/game/cache-road-landscape.js');
  vm.runInContext(fs.readFileSync('src/game/cache-road-proof.js','utf8').replace(
    '  B.Campaign.register(ID,','  window.lampReview={drawLampLight,SERVICE_LAMP_HEIGHT,SERVICE_LAMP_WIDTH,PROP_SHAPES};\n  B.Campaign.register(ID,'),context);
  const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8');
  w.Image=undefined;
  vm.runInContext(manifest.replace('  const cache = {};','  window.lampDefinitions=entries;\n  const cache = {};'),context);
  const keys=['cachePylon','cacheNewLampL','cacheNewLampR','cacheWalkerCourierToward'];
  w.lampImages=Object.fromEntries(await Promise.all(keys.map(async key=>[key,await loadImage(w.lampDefinitions[key].path)])));
  vm.runInContext(manifest.replace('  const cache = {};','  const cache=Object.fromEntries(Object.entries(window.lampImages).map(([key,image])=>[key,{image,ready:true}]));'),context);
  const c=createCanvas(1440,790),ctx=c.getContext('2d');
  ctx.fillStyle='#102330';ctx.fillRect(0,0,1440,790);
  ctx.fillStyle='#f6dda9';ctx.font='26px sans-serif';
  ctx.fillText('Street lighting • measured scale and grounded light',28,43);
  ctx.fillStyle='#a8c3cd';ctx.font='16px sans-serif';
  ctx.fillText('Production source crops and Canvas lighting • same physical scale in all three panels',28,71);
  const L=w.lampReview;
  for(let i=0;i<3;i++) {
    const key=keys[i],left=18+i*474,groundY=650;
    ctx.save();ctx.beginPath();ctx.rect(left,95,456,600);ctx.clip();
    ctx.fillStyle='#203844';ctx.fillRect(left,95,456,600);
    ctx.fillStyle='#3b5059';ctx.fillRect(left,groundY-13,456,108);
    ctx.strokeStyle='#5b6e71';ctx.lineWidth=1;
    for(let j=0;j<7;j++) {
      ctx.beginPath();ctx.moveTo(left+j*90,groundY-13);ctx.lineTo(left+j*105-70,groundY+88);ctx.stroke();
    }
    const scale=1.6,height=(i?L.PROP_SHAPES[key][1]:L.SERVICE_LAMP_HEIGHT)*scale;
    const width=i?height*2/3:L.SERVICE_LAMP_WIDTH*scale;
    const args={x:left+(i===2?284:154),y:groundY,width,height,
      ...(i===0?{sourceRect:[42,69,954,1386]}:{frame:1})};
    L.drawLampLight(ctx,key,args,'pool');
    L.drawLampLight(ctx,key,args,'beam');
    B.PresentationAssets.draw(key,ctx,args);
    const personHeight=134*1.2*scale;
    B.PresentationAssets.draw('cacheWalkerCourierToward',ctx,{
      x:left+(i===2?58:394),y:groundY,width:personHeight*2/3,height:personHeight});
    ctx.restore();
    ctx.fillStyle='#e4d8bc';ctx.font='20px sans-serif';
    ctx.fillText(i?'Corner lamp • 230 units':'Service lamp • 260 units',left+14,130);
    ctx.fillStyle='#b4c9cb';ctx.font='15px sans-serif';
    ctx.fillText(i?'15% shorter, existing light cels preserved':'35% smaller; both painted lenses cast light',left+14,157);
  }
  ctx.fillStyle='#adc6cb';ctx.font='17px sans-serif';
  ctx.fillText('308-unit service spacing • left/right stagger • clear street mouths • steady rays in Reduced Motion',28,735);
  ctx.fillText('Surface pools render before people/props; each soft ray shares its lamp’s ground-contact ordering.',28,763);
  fs.writeFileSync(path.join(out,'Lamp-Details.webp'),c.toBuffer('image/webp',94));
  console.log(path.join(out,'Lamp-Details.webp'));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
