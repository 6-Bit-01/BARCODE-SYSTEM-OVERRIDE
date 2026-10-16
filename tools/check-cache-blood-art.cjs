// Production blood painter and shared raster cache: grounded registration,
// exact contact-age selection, deterministic variations and comfort controls.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {fixture}=require('./check-cache-combat-art.cjs');
const ROOT=path.resolve(__dirname,'..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function raster() {
  const f=fixture(),entry=f.entries.cacheBloodSplatter;
  assert(entry,'blood art is registered with the existing shared cache');
  assert.deepEqual([entry.columns,entry.rows,entry.frames],[3,2,6]);
  assert.deepEqual([entry.ax,entry.ay],[.5,1]);
  assert(entry.smooth,'authored comic paint uses the established smooth raster path');
  assert(/^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/[0-9a-f]{40}\/$/.test(entry.root),
    'new art delivery is pinned to an immutable asset commit');
  const metadata=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/cache-road/blood/atlas-metadata.json')));
  const asset=metadata.assets.find(item=>item.key==='cacheBloodSplatter');
  assert(asset);assert.equal(entry.path,asset.runtime);
  assert.equal(sha(fs.readFileSync(path.join(ROOT,asset.generatedOriginal))),asset.sha256.source);
  assert.equal(sha(fs.readFileSync(path.join(ROOT,asset.runtime))),asset.sha256.runtime);
  assert.deepEqual(JSON.parse(JSON.stringify(f.art.anchors.cacheBloodSplatter)),asset.cells.map(cell=>cell.anchor),
    'runtime registration comes from the inspected source-sheet contacts');
  const image=await loadImage(path.join(ROOT,entry.path));
  assert.deepEqual([image.width,image.height],asset.size);
  assert.equal(image.width%3,0);assert.equal(image.height%2,0);
  const cw=image.width/3,ch=image.height/2;
  assert.equal(image.width*image.height*4,asset.bytes.decodedRGBA,'recorded decode footprint matches the native image');
  assert(image.width*image.height*4<=8*1024*1024,'blood has a bounded shared decode budget');
  const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');
  ctx.drawImage(image,0,0);const hashes=new Set();
  const original=await loadImage(path.join(ROOT,asset.generatedOriginal));
  const sourceCanvas=createCanvas(original.width,original.height),sourceCtx=sourceCanvas.getContext('2d');
  sourceCtx.drawImage(original,0,0);
  const source=sourceCtx.getImageData(0,0,original.width,original.height).data;
  const expectedAlpha=new Uint8Array(image.width*image.height);
  for(const cell of asset.cells) {
    const [sx,sy,sw,sh]=cell.sourceRect,dx=cell.frame%3*cw+cell.insert[0],dy=Math.floor(cell.frame/3)*ch+cell.insert[1];
    assert(sx>=0&&sy>=0&&sx+sw<=original.width&&sy+sh<=original.height);
    assert(cell.insert[0]>=0&&cell.insert[1]>=0&&cell.insert[0]+sw<=cw&&cell.insert[1]+sh<=ch,
      'complete source cells fit without clipping in the padded runtime atlas');
    for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)
      expectedAlpha[(dy+y)*image.width+dx+x]=source[((sy+y)*original.width+sx+x)*4+3];
  }
  const runtime=ctx.getImageData(0,0,image.width,image.height).data;
  assert.deepEqual(Uint8Array.from({length:image.width*image.height},(_,i)=>runtime[i*4+3]),expectedAlpha,
    'native source alpha survives exact extraction/padding/lossless runtime conversion');
  for(let frame=0;frame<6;frame++) {
    const data=ctx.getImageData(frame%3*cw,Math.floor(frame/3)*ch,cw,ch).data;
    let clear=0,paint=0,red=0,edge=0;
    for(let i=0;i<data.length;i+=4) {
      if(data[i+3]===0)clear++;
      else {
        paint++;
        if(data[i]>data[i+1]*1.25&&data[i]>data[i+2]*1.05)red++;
        if(data[i+3]<200)edge++;
      }
    }
    assert(paint>200,'each frame contains authored paint');
    assert(clear>cw*ch*.15,'every frame retains true transparency around the art');
    assert(red>paint*.3,'blood reads as the authored red/burgundy palette');
    assert(edge>0,'native antialiased alpha survives runtime export');
    hashes.add(sha(data));
  }
  assert.equal(hashes.size,6,'all three sprays and all three stains are distinct');
  return {image,entry,cw,ch};
}
function recording(cache) {
  const f=fixture(cache),canvas=createCanvas(480,320),ctx=canvas.getContext('2d');
  const calls=[],draw=ctx.drawImage.bind(ctx),ellipse=ctx.ellipse.bind(ctx);
  ctx.drawImage=(...args)=>{calls.push(['image',...args,ctx.getTransform()]);return draw(...args);};
  ctx.ellipse=(...args)=>{calls.push(['ellipse',...args]);return ellipse(...args);};
  return {...f,canvas,ctx,calls};
}
function painterChecks(asset) {
  const {image,cw,ch}=asset;
  const f=recording({cacheBloodSplatter:{image,ready:true}});
  const base={x:220,y:240,width:240,height:160,alpha:.6};
  const frames=()=>f.calls.filter(call=>call[0]==='image').map(call=>
    Math.round(call[2]/cw)+3*Math.round(call[3]/ch));
  function draw(options,expected) {
    f.ctx.setTransform(1,0,0,1,3,7);f.ctx.globalAlpha=.73;
    f.ctx.imageSmoothingEnabled=false;f.calls.length=0;
    const pose=Object.freeze({...base,...options}),before=JSON.stringify(pose);
    const transform=f.ctx.getTransform(),alpha=f.ctx.globalAlpha;
    assert(f.art.drawBlood(f.ctx,pose));
    assert.deepEqual(frames(),expected);
    assert.equal(JSON.stringify(pose),before,'draw never changes a saved physical contact');
    assert.equal(f.ctx.globalAlpha,alpha);assert.equal(f.ctx.imageSmoothingEnabled,false);
    assert.deepEqual(f.ctx.getTransform(),transform,'ground effect restores caller transform');
  }
  for(let variant=0;variant<3;variant++) {
    for(const ageMs of [0,80,199])draw({variant,ageMs},[3+variant,variant]);
    for(const ageMs of [200,201,15000])draw({variant,ageMs},[3+variant]);
    draw({variant,ageMs:80,reduced:true},[3+variant]);
    draw({variant,ageMs:80,flashes:false},[3+variant]);
  }
  draw({variant:-1,ageMs:80},[5,2]);
  draw({variant:4.8,ageMs:80},[4,1]);
  f.calls.length=0;
  for(const bad of [{x:NaN},{y:Infinity},{width:0},{height:-1}])
    assert.equal(f.art.drawBlood(f.ctx,{...base,...bad}),false);
  assert.equal(f.calls.length,0,'invalid effects never paint');
  const repeated=()=>{
    f.ctx.setTransform(1,0,0,1,0,0);f.ctx.clearRect(0,0,480,320);
    const pose=Object.freeze({...base,variant:2,ageMs:80});
    assert(f.art.drawBlood(f.ctx,pose));return sha(f.canvas.toBuffer('image/png'));
  };
  assert.equal(repeated(),repeated(),'repeated observation has identical pixels and cannot age the spray');
  const absent=recording(),before=absent.images.map(item=>item.requests.length);
  for(let i=0;i<12;i++)assert(absent.art.drawBlood(absent.ctx,{...base,ageMs:i*50}));
  assert.equal(absent.calls.filter(call=>call[0]==='ellipse').length,60,
    'missing art uses only the bounded five-shape stable fallback');
  assert.equal(absent.calls.filter(call=>call[0]==='image').length,0);
  assert.deepEqual(absent.images.map(item=>item.requests.length),before,
    'missing-art drawing cannot create image requests or retries');
  const missing=absent.images.find(item=>item.requests[0]?.endsWith(asset.entry.path));
  missing.onerror();missing.onerror();absent.assets.preload();
  assert.equal(missing.requests.length,2,'only the established remote/local loader attempts are allowed');
}
async function riderChecks(asset) {
  const cache={cacheBloodSplatter:{image:asset.image,ready:true}},f=fixture();
  for(const key of ['cacheCombatBike','cacheCombatBikeCrash'])
    cache[key]={image:await loadImage(path.join(ROOT,f.entries[key].path)),ready:true};
  const r=recording(cache),options={id:'bike-7',kind:'bike',phase:'wreck',wreck:true,rider:true,
    x:140,y:260,width:164,height:150,riderX:280,riderOffset:110,ageMs:2400,
    splattered:true,riderSplatAgeMs:80,alpha:.7};
  function draw(extra) {
    r.calls.length=0;const pose=Object.freeze({...options,...extra}),before=JSON.stringify(pose);
    assert(r.art.drawBody(r.ctx,pose));assert.equal(JSON.stringify(pose),before);
    return r.calls.filter(call=>call[0]==='image'&&call[1]===asset.image);
  }
  const blood=draw({});
  assert.equal(blood.length,2,'landed contacted rider reaches authored stain plus brief spray');
  for(const call of blood) {
    const frame=Math.round(call[2]/asset.cw)+3*Math.round(call[3]/asset.ch);
    const anchor=r.art.anchors.cacheBloodSplatter?.[frame]||[.5,1];
    const localX=call[6]+call[8]*anchor[0],localY=call[7]+call[9]*anchor[1],m=call[10];
    // Native Canvas stores transforms with float precision; the registration
    // must still land within one thousandth of a pixel of physical contact.
    assert(Math.abs(m.a*localX+m.c*localY+m.e-options.riderX)<.001,
      'each authored frame registers on the authoritative projected rider lane');
    assert(Math.abs(m.b*localX+m.d*localY+m.f-options.y)<.001,
      'each authored frame registers on the unchanged rider tire-plane depth');
  }
  for(const extra of [{reduced:true},{flashes:false},{riderSplatAgeMs:200}])
    assert.equal(draw(extra).length,1,'comfort settings/elapsed contact keep only stable authored stain');
  assert.equal(draw({ageMs:1500}).length,0,'blood is never attached to an airborne rider');
  assert.equal(draw({splattered:false}).length,0,'destroying a bike alone does not create a ground-contact splat');
}
function contactSheet(asset,output) {
  const f=fixture({cacheBloodSplatter:{image:asset.image,ready:true}});
  const canvas=createCanvas(900,720),ctx=canvas.getContext('2d');
  ctx.fillStyle='#17212b';ctx.fillRect(0,0,900,720);
  const rows=[{label:'Contact · 80 ms',ageMs:80},{label:'Settled · 200 ms',ageMs:200},
    {label:'Reduced Motion · 80 ms',ageMs:80,reduced:true}];
  for(let row=0;row<rows.length;row++)for(let variant=0;variant<3;variant++) {
    const x=variant*300,y=row*240;
    ctx.fillStyle='#23313a';ctx.fillRect(x+5,y+5,290,230);
    ctx.fillStyle='#ceddd1';ctx.font='14px sans-serif';ctx.fillText(`${rows[row].label} · shape ${variant+1}`,x+12,y+28);
    ctx.strokeStyle='#52705b';ctx.beginPath();ctx.moveTo(x+12,y+180);ctx.lineTo(x+288,y+180);ctx.stroke();
    assert(f.art.drawBlood(ctx,{...rows[row],variant,x:x+150,y:y+180,width:260,height:150}));
  }
  fs.writeFileSync(output,canvas.toBuffer('image/png'));
}
async function main() {
  const asset=await raster();painterChecks(asset);await riderChecks(asset);
  if(process.argv[2])contactSheet(asset,path.resolve(process.argv[2]));
  console.log('Cache blood art passed: six distinct transparent red raster cells, 200 ms contact spray/stable stain, three deterministic shapes, grounded rider contact, pure repeated observation, comfort controls and bounded missing-art loader/fallback.');
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={raster,painterChecks,riderChecks,contactSheet};
