// Focused moving-art contact sheet through production draw helpers/atlas.
// The main road film is rendered separately by render-cache-road-mirror.cjs.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{
  paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const {createRig,load}=require('./check-level-01-boss');

async function main() {
  const out=path.resolve(process.argv[2]||'docs/source-pack/review-cache-living-sidelines');
  fs.mkdirSync(out,{recursive:true});
  const {w,context}=createRig(),B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};
  load(context,'src/engine/cache-road-proof-profile.js');
  load(context,'src/game/cache-road-landscape.js');
  vm.runInContext(fs.readFileSync('src/game/cache-road-proof.js','utf8').replace(
    '  B.Campaign.register(ID,','  window.livingReview={drawVehicle,drawStreetActor,drawFacadeActivity,PEDESTRIANS,STREET_ITEMS,AMBIENT_PLATES,PERSON_ACTIVITY,VEHICLE_TAIL_LIGHTS};\n  B.Campaign.register(ID,'),context);
  const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8');
  w.Image=undefined;
  vm.runInContext(manifest.replace('  const cache = {};','  window.livingDefinitions=entries;\n  const cache = {};'),context);
  w.livingImages=Object.fromEntries(await Promise.all(Object.entries(w.livingDefinitions)
    .filter(([key])=>key.startsWith('cache')).map(async([key,entry])=>
      [key,await loadImage(path.resolve(entry.path))])));
  vm.runInContext(manifest.replace('  const cache = {};',
    '  const cache=Object.fromEntries(Object.entries(window.livingImages).map(([key,image])=>[key,{image,ready:true}]));'),context);
  const {drawVehicle,drawStreetActor,PEDESTRIANS,STREET_ITEMS}=w.livingReview;
  const canvas=createCanvas(1280,720),ctx=canvas.getContext('2d');
  const fps=24,seconds=18;
  const video=path.join(out,'Living-Details.mp4');
  const encoder=spawn('/usr/bin/ffmpeg',['-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgba',
    '-s','1280x720','-r',String(fps),'-i','pipe:0','-an','-c:v','libx264','-threads','2',
    '-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',video],
    {stdio:['pipe','ignore','pipe']});
  let errors='';encoder.stderr.on('data',data=>errors+=data);
  const vehicles=[['cache',0,'Cache'],['cache',1,'Cache / left pose'],['cache',-1,'Cache / right pose'],
    ['freight',0,'Freight'],['van',0,'Courier'],['rival',0,'Rival'],['audit',0,'Audit'],
    ['sweeper',.7,'Sweeper / turning'],['trike',.7,'Trike / single lamp'],['shuttle',0,'Shuttle']];
  const actors=[6,8,9,10,13,14,7];
  for(let f=0;f<fps*seconds;f++) {
    const ms=f/fps*1000,facades=f>=fps*12,people=f>=fps*6&&!facades;
    ctx.fillStyle='#11262f';ctx.fillRect(0,0,1280,720);
    ctx.fillStyle='#f5dfab';ctx.font='22px sans-serif';
    ctx.fillText(facades?'Building activity • fixtures attached to painted facades':people?'Street activities • planted contacts, moving hands and tools':'Vehicle lights • fitted lenses and individual road reflections',24,33);
    ctx.fillStyle='#9ab7be';ctx.font='13px sans-serif';
    ctx.fillText('Production draw helpers and real atlas metadata • enlarged inspection • Reduced Motion freezes decorative loops',24,56);
    if(!people&&!facades)for(let i=0;i<vehicles.length;i++) {
      const [kind,steer,name]=vehicles[i],x=128+(i%5)*256,y=272+Math.floor(i/5)*297;
      ctx.fillStyle='#193039';ctx.fillRect(x-118,y-154,236,262);
      ctx.fillStyle='#bed0d1';ctx.font='14px sans-serif';ctx.fillText(name,x-110,y-132);
      drawVehicle(ctx,x,y,kind==='freight'?126:142,kind==='freight'?144:117,kind,
        {phase:ms*.054,steer,braking:kind==='cache'&&Math.floor(ms/1200)%2===1});
    } else if(people)for(let i=0;i<8;i++) {
      const x=160+(i%4)*320,y=355+Math.floor(i/4)*312;
      ctx.fillStyle='#1c3540';ctx.fillRect(x-150,y-266,300,283);
      const id=actors[i],item=id===undefined?{key:'cacheNewVendorCart',at:0}: {id,at:0};
      const [key,aspect]=id===undefined?['cacheNewVendorCart',460/384]:PEDESTRIANS[id];
      const height=id===6?175:212;
      ctx.fillStyle='#c6d8d8';ctx.font='14px sans-serif';
      ctx.fillText(id===undefined?'Vendor cart / steam + cloth':key.replace('cachePerson','').replace(/([a-z])([A-Z])/g,'$1 $2'),x-140,y-242);
      ctx.strokeStyle='#527780';ctx.beginPath();ctx.moveTo(x-135,y);ctx.lineTo(x+135,y);ctx.stroke();
      drawStreetActor(ctx,item,key,{x,y,width:height*aspect,height}, {elapsedMs:ms},false,id!==undefined);
    } else {
      const families=['market','homes','workshop','greenhouse','data','transit'];
      for(let i=0;i<families.length;i++) {
        const side=i%2?-1:1;
        const plate=[...w.livingReview.AMBIENT_PLATES].find(p=>p.family===families[i]&&p.side===side);
        const [key,sw,sh]=plate.art,width=760,height=width*sh/sw;
        const left=(i%3)*426,top=83+Math.floor(i/3)*313;
        ctx.save();ctx.beginPath();ctx.rect(left+5,top,416,304);ctx.clip();
        ctx.fillStyle='#1c3540';ctx.fillRect(left,top,426,304);
        const x=left+(side<0?420-width/2:6+width/2),y=top+286;
        B.PresentationAssets.draw(key,ctx,{x,y,width,height});
        w.livingReview.drawFacadeActivity(ctx,plate,x,y,width,height,{elapsedMs:ms},false);
        ctx.fillStyle='#c6d8d8';ctx.font='16px sans-serif';ctx.fillText(families[i],left+14,top+22);
        ctx.restore();
      }
    }
    if(f===36||f===fps*7)fs.writeFileSync(path.join(out,people?'Street-Activities.webp':'Vehicle-Lights.webp'),canvas.toBuffer('image/webp'));
    if(f===fps*13)fs.writeFileSync(path.join(out,'Facade-Activity.webp'),canvas.toBuffer('image/webp'));
    if(!encoder.stdin.write(Buffer.from(ctx.getImageData(0,0,1280,720).data)))await once(encoder.stdin,'drain');
  }
  encoder.stdin.end();const [code]=await once(encoder,'close');if(code)throw Error(errors);
  const counts={};for(const {item} of STREET_ITEMS)if(item.key)counts[item.key]=(counts[item.key]||0)+1;
  fs.writeFileSync(path.join(out,'Living-Layout-Checks.json'),JSON.stringify({
    props:counts,totalProps:Object.values(counts).reduce((a,b)=>a+b,0),
    people:STREET_ITEMS.filter(({item})=>item.id!==undefined).length,
    activeFrontages:w.livingReview.AMBIENT_PLATES.size,vehicleLightBounds:w.livingReview.VEHICLE_TAIL_LIGHTS,
    activityTypes:Object.keys(w.livingReview.PERSON_ACTIVITY).length,
    note:'Moving inspection uses production helpers, not owner-device or Makko footage.'},null,2)+'\n');
  console.log(video);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
