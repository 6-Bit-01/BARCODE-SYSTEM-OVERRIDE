// Actual pure painter, production image cache and native source alpha checks.
// The contact sheet is staged art/geometry evidence, not an earned playtest.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.resolve(__dirname,'..');
const metadata=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/cache-road/combat/atlas-metadata.json')));
const assetsSource=fs.readFileSync(path.join(ROOT,'src/engine/presentation-assets.js'),'utf8');
const artSource=fs.readFileSync(path.join(ROOT,'src/game/cache-road-combat-art.js'),'utf8');
const keys=['cacheCombatBike','cacheCombatHostiles','cacheCombatBikeCrash','cacheCombatBlast'];
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const plain=value=>JSON.parse(JSON.stringify(value));
const bikePoses=[
  {kind:'bike',phase:'approach',frame:0},
  {kind:'bike',phase:'windup',lane:2,lockLane:1,frame:1},
  {kind:'bike',phase:'windup',lane:1,lockLane:2,frame:2},
  {kind:'bike',phase:'committed',frame:3},
  {kind:'bike',phase:'recover',frame:4},
  {kind:'bike',phase:'stunned',frame:5},
  {kind:'bike',phase:'approach',damage:.5,frame:6},
  {kind:'bike',phase:'wreck',ageMs:2000,wreck:true,frame:7}
];
const chassisPoses=['rammer','escort','disruptor'].flatMap((kind,index)=>[
  {kind,phase:'approach',frame:index*4},
  {kind,phase:'committed',frame:index*4+1},
  {kind,phase:'stunned',damage:.5,frame:index*4+2},
  {kind,phase:'wreck',wreck:true,ageMs:2000,frame:index*4+3}
]);
function fixture(cache) {
  const images=[],window={BARCODE:{},FILE_MANIFEST:[],nativeCache:cache};
  window.Image=class {
    constructor(){this.requests=[];images.push(this);}
    set src(url){this.requests.push(url);}
  };
  const context=vm.createContext({window});
  vm.runInContext(assetsSource.replace('  const cache = {};',
    '  window.artEntries=entries;const cache=window.nativeCache||{};'),context);
  vm.runInContext(artSource,context);
  return {window,images,context,entries:window.artEntries,
    assets:window.BARCODE.PresentationAssets,art:window.BARCODE.CacheRoadCombatArt};
}
function recorder() {
  const calls=[],stack=[];
  const ctx={globalAlpha:.7,imageSmoothingEnabled:false,
    save(){stack.push([this.globalAlpha,this.imageSmoothingEnabled]);},
    restore(){assert(stack.length);[this.globalAlpha,this.imageSmoothingEnabled]=stack.pop();},
    translate(...args){assert(args.every(Number.isFinite));calls.push(['translate',...args]);},
    rotate(angle){assert(Number.isFinite(angle));calls.push(['rotate',angle]);},
    scale(...args){calls.push(['scale',...args]);},
    drawImage(image,...args){assert(args.every(Number.isFinite));calls.push(['drawImage',image,...args]);}};
  return {ctx,calls,stack};
}
function painterChecks() {
  const f=fixture(),r=recorder(),options={x:200,y:310,width:164,height:150,alpha:.5};
  assert.deepEqual(Object.keys(f.entries).filter(key=>keys.includes(key)),keys);
  for(const asset of metadata.assets) {
    const entry=f.entries[asset.key];assert(entry,'new art is in the production shared cache');
    assert.deepEqual([entry.columns,entry.rows,entry.frames],[asset.columns,asset.rows,asset.frames]);
    assert.deepEqual([entry.ax,entry.ay],asset.registrationAnchor);
    assert(entry.root&&/^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/[0-9a-f]{40}\/$/.test(entry.root),
      'combat delivery is an immutable published asset revision');
    assert.equal(entry.path,asset.runtime);
    assert.deepEqual(plain(f.art.anchors[asset.key]),asset.cells.map(cell=>cell.anchor));
    const image=f.images.find(image=>image.requests[0]?.endsWith(asset.runtime));
    assert(image,'the unchanged shared loader requests the runtime atlas');
    image.naturalWidth=asset.size[0];image.naturalHeight=asset.size[1];image.onload();
  }
  const absent=fixture();
  assert.equal(absent.art.drawBody(r.ctx,{...options,kind:'bike',phase:'approach'}),false);
  assert.equal(absent.art.drawBlast(r.ctx,{...options,ageMs:100}),false);
  for(const asset of metadata.assets) {
    const image=absent.images.find(image=>image.requests[0]?.endsWith(asset.runtime));
    image.onerror();image.onerror();assert.equal(image.requests.length,2,'one remote and one local attempt');
    assert.equal(image.requests[1],asset.runtime);absent.assets.preload();
    assert.equal(image.requests.length,2,'redrawing/restart cannot open another request loop');
  }
  const seen=Object.fromEntries(keys.map(key=>[key,new Set()]));
  const draw=f.assets.draw;
  f.window.BARCODE.PresentationAssets.draw=(key,ctx,o)=>{
    const result=draw(key,ctx,o);if(result&&seen[key])seen[key].add(o.frame??0);return result;
  };
  for(const pose of [...bikePoses,...chassisPoses]) {
    const frozen=Object.freeze({...options,...pose,id:'physical-actor',at:1550,lane:1.5});
    const before=JSON.stringify(frozen);r.calls.length=0;
    const selected=f.art.frameFor(frozen);
    assert.equal(selected.frame,pose.frame);
    assert.equal(f.art.drawBody(r.ctx,frozen),true);
    assert.equal(JSON.stringify(frozen),before,'paint cannot mutate a physical actor');
    assert.equal(r.ctx.globalAlpha,.7);assert.equal(r.ctx.imageSmoothingEnabled,false);assert.equal(r.stack.length,0);
    assert(r.calls.some(call=>call[0]==='translate'&&call[1]===200&&call[2]===310),
      'grounded actor uses its caller-owned physical contact');
  }
  for(const [age,bodyFrame,riderFrame] of [[150,0,3],[800,1,4],[1400,2,4],[2000,7,5]]) {
    r.calls.length=0;
    const pose={...options,kind:'bike',phase:'wreck',wreck:true,rider:true,ageMs:age,
      flipAngle:Math.PI,lift:58,riderLift:95,riderOffset:45};
    const choice=f.art.frameFor(pose);assert.equal(choice.frame,bodyFrame);
    assert.equal(f.art.drawBody(r.ctx,pose),true);
    assert(seen.cacheCombatBikeCrash.has(riderFrame));
    const rotations=r.calls.filter(call=>call[0]==='rotate');
    if(age<1600)assert(rotations.some(call=>call[1]===Math.PI),'actual controller flip is consumed');
    if(age<1900)assert(r.calls.some(call=>call[0]==='translate'&&call[1]===245&&call[2]===137),
      'detached rider has distinct world lift/offset rather than a body-space overlay');
    assert.equal(r.stack.length,0);assert.equal(r.ctx.globalAlpha,.7);
  }
  r.calls.length=0;
  assert(f.art.drawBody(r.ctx,{...options,kind:'bike',phase:'wreck',wreck:true,ageMs:800,
    flipAngle:Math.PI,lift:58,riderLift:95,riderOffset:45,reduced:true}));
  assert(!r.calls.some(call=>call[0]==='rotate'),'Reduced Motion retains static wreck/rider paint');
  for(let frame=0;frame<6;frame++) {
    const o={...options,ageMs:frame*1900/6+1};
    assert.equal(f.art.blastFrameFor(o),frame);assert(f.art.drawBlast(r.ctx,o));
    assert(f.art.blastFrameFor({...o,flashes:false})>=3,'flashes off omits every bright ignition/burst cell');
  }
  assert.equal(f.art.drawBlast(r.ctx,{...options,ageMs:100,reduced:true}),false);
  for(const ageMs of [-1,1900,5000])assert.equal(f.art.drawBlast(r.ctx,{...options,ageMs}),false);
  for(const bad of [{width:0},{height:-1},{x:NaN},{y:Infinity}]) {
    assert.equal(f.art.drawBody(r.ctx,{...options,kind:'bike',...bad}),false);
    assert.equal(f.art.drawBlast(r.ctx,{...options,ageMs:10,...bad}),false);
  }
  assert.equal(f.art.drawBody(r.ctx,{...options,kind:'rig'}),false,'existing rig painter keeps its own body');
  for(const asset of metadata.assets)
    assert.deepEqual([...seen[asset.key]].sort((a,b)=>a-b),Array.from({length:asset.frames},(_,i)=>i),
      'all intended poses/components/ages are reached through the production helper');
}
async function decoded(local) {
  const image=await loadImage(path.join(ROOT,local)),canvas=createCanvas(image.width,image.height);
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,image.width,image.height).data;
  const alpha=Uint8Array.from({length:image.width*image.height},(_,i)=>pixels[i*4+3]);
  return {image,width:image.width,height:image.height,pixels,alpha};
}
async function nativeChecks() {
  const cache={};let bytes=0;
  for(const asset of metadata.assets) {
    assert.equal(sha(fs.readFileSync(path.join(ROOT,asset.generatedOriginal))),asset.sha256.source);
    assert.equal(sha(fs.readFileSync(path.join(ROOT,asset.runtime))),asset.sha256.runtime);
    const original=await decoded(asset.generatedOriginal),runtime=await decoded(asset.runtime);
    assert.deepEqual([runtime.width,runtime.height],asset.size);
    const expected=new Uint8Array(runtime.alpha.length),[cw,ch]=asset.cellSize;
    const hashes=new Set();
    for(const cell of asset.cells) {
      const [sx,sy,sw,sh]=cell.sourceRect;
      const dx=cell.frame%asset.columns*cw+cell.insert[0];
      const dy=Math.floor(cell.frame/asset.columns)*ch+cell.insert[1];
      assert(sx>=0&&sy>=0&&sx+sw<=original.width&&sy+sh<=original.height);
      assert(cell.insert[0]>=0&&cell.insert[1]>=0&&cell.insert[0]+sw<=cw&&cell.insert[1]+sh<=ch,
        'complete source extraction fits without clipping in its runtime cell');
      for(let y=0;y<sh;y++)expected.set(original.alpha.subarray((sy+y)*original.width+sx,
        (sy+y)*original.width+sx+sw),(dy+y)*runtime.width+dx);
      const frameBytes=Buffer.alloc(cw*ch*4);let solid=0;
      const fx=cell.frame%asset.columns*cw,fy=Math.floor(cell.frame/asset.columns)*ch;
      for(let y=0;y<ch;y++) {
        const start=((fy+y)*runtime.width+fx)*4;
        frameBytes.set(runtime.pixels.subarray(start,start+cw*4),y*cw*4);
        for(let x=0;x<cw;x++)if(runtime.alpha[(fy+y)*runtime.width+fx+x]>=200)solid++;
      }
      assert(solid>500,'each cell contains substantial authored paint');hashes.add(sha(frameBytes));
      if(cell.contact) {
        const [x,y]=cell.contact;let pixels=0;
        assert(x>=cell.opaqueBounds[0]&&x<=cell.opaqueBounds[2],
          'center tire-plane contact stays within the painted support span');
        for(let yy=Math.max(0,Math.floor(y)-6);yy<Math.min(ch,Math.ceil(y)+2);yy++)
          for(let xx=0;xx<cw;xx++)
            if(runtime.alpha[(fy+yy)*runtime.width+fx+xx]>=128)pixels++;
        assert(pixels>2,'registered physical contact touches actual tire/ground paint');
      }
    }
    assert.deepEqual(runtime.alpha,expected,'native PNG alpha survives crop/repack/exact WebP conversion');
    assert(runtime.alpha.some(a=>a===0)&&runtime.alpha.some(a=>a>0&&a<200));
    assert.equal(hashes.size,asset.frames,'each named mechanical pose/component/age has distinct paint');
    assert.equal(runtime.width*runtime.height*4,asset.bytes.decodedRGBA);bytes+=asset.bytes.decodedRGBA;
    cache[asset.key]={image:runtime.image,ready:true};
  }
  assert.equal(bytes,metadata.runtimeDecodedBytes,'actual decoded budget is recorded truthfully');
  assert(bytes<32*1024*1024,'all four runtime atlases stay in a bounded shared 32 MiB envelope');
  return cache;
}
function contactSheet(cache,output) {
  const f=fixture(cache),canvas=createCanvas(1200,1880),ctx=canvas.getContext('2d');
  ctx.fillStyle='#101a22';ctx.fillRect(0,0,1200,1880);
  ctx.font='bold 23px sans-serif';ctx.fillStyle='#d9e9df';ctx.fillText('COMBAT CHASE — ACTUAL PAINTED SPRITES',20,34);
  ctx.font='14px sans-serif';ctx.fillStyle='#9fb4ae';
  ctx.fillText('Native production helper; staged pose/contact review, not a playtest',20,58);
  for(const [i,pose] of [...bikePoses,...chassisPoses].entries()) {
    const x=i%4*300,y=76+Math.floor(i/4)*242;
    ctx.fillStyle=i%2?'#182833':'#1e2c34';ctx.fillRect(x+4,y,292,234);
    ctx.fillStyle='#adc3b8';ctx.font='14px sans-serif';ctx.fillText(`${pose.kind} · ${pose.phase} · ${pose.frame}`,x+12,y+20);
    ctx.strokeStyle='#47755d';ctx.beginPath();ctx.moveTo(x+10,y+212);ctx.lineTo(x+290,y+212);ctx.stroke();
    assert(f.art.drawBody(ctx,{...pose,x:x+150,y:y+212,width:244,height:205,rider:false}));
  }
  for(const [i,ageMs] of [150,800,1400,2200].entries()) {
    const x=i*300,y=1300;ctx.fillStyle='#182833';ctx.fillRect(x+4,y,292,294);
    ctx.fillStyle='#adc3b8';ctx.font='14px sans-serif';ctx.fillText(`Bike + rider wreck · ${ageMs} ms`,x+12,y+22);
    assert(f.art.drawBody(ctx,{kind:'bike',phase:'wreck',wreck:true,rider:true,ageMs,
      x:x+130,y:y+240,width:150,height:145,lift:ageMs<1600?38:0,
      riderLift:ageMs<1900?58:0,riderOffset:ageMs<1900?42:60,
      flipAngle:Math.min(1,ageMs/1600)*Math.PI*2}));
  }
  for(let i=0;i<6;i++) {
    const x=i*200;ctx.fillStyle='#adc3b8';ctx.font='13px sans-serif';ctx.fillText(`Blast age ${i}`,x+15,1615);
    assert(f.art.drawBlast(ctx,{x:x+100,y:1740,width:185,height:190,ageMs:i*1900/6+1}));
  }
  fs.writeFileSync(output,canvas.toBuffer('image/png'));
}
async function main() {
  painterChecks();const cache=await nativeChecks();
  if(process.argv[2])contactSheet(cache,path.resolve(process.argv[2]));
  console.log('Cache combat art passed: 8 bike poses, 12 hostile chassis states, 6 separate bike/rider crash components, 6 real-age blasts; immutable cache, source hashes/native alpha, physical contacts, flight/rider transforms, no-flash/Reduced Motion and missing-art bounds.');
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={fixture,nativeChecks,contactSheet};
