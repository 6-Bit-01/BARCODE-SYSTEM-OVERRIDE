// Check the authored PNG alpha and optimized WebP against the contact/socket
// coordinates actually consumed by CacheRoadLandscape. A pretty isolated
// illustration is not a usable bank card if this contract fails.
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const root=path.resolve(__dirname,'..');

async function sourceOrRuntime(sourcePath,runtime) {
  return fs.existsSync(sourcePath)?pixels(sourcePath):runtime;
}
async function pixels(file) {
  const image=await loadImage(file);
  const canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');
  ctx.drawImage(image,0,0);
  return {w:image.width,h:image.height,
    alpha:ctx.getImageData(0,0,image.width,image.height).data};
}
function bottom(data,u) {
  const x=Math.round(u*(data.w-1));
  for(let y=data.h-1;y>=Math.floor(data.h*.30);y--)
    if(data.alpha[(y*data.w+x)*4+3]>128)return y;
  return null;
}
function occupied(data,u0,u1) {
  let hits=0,total=0;
  for(let x=Math.floor(data.w*u0);x<Math.ceil(data.w*u1);x+=4)
    for(let y=Math.floor(data.h*.5);y<data.h;y+=4) {
      hits+=data.alpha[(y*data.w+x)*4+3]>128;
      total++;
    }
  return hits/total;
}
async function run() {
  const {w,context}=createRig();
  load(context,'src/game/cache-road-landscape.js');
  // Both road cameras and facade sockets use center-x / foundation-y.
  // Exercise the real atlas draw boundary: three families previously used
  // top-left anchors, burying their buildings below floating activity.
  w.Image=undefined;
  vm.runInContext(fs.readFileSync(path.join(root,
    'src/engine/presentation-assets.js'),'utf8').replace('  const cache = {};',
    `  const cache=Object.fromEntries(Object.keys(entries).map(key=>[key,{
      ready:true,image:{naturalWidth:200,naturalHeight:100}}]));`),context);
  function assertProjectedAnchor(key) {
    let tx=0,ty=0,rectangle;
    const ctx={save(){},restore(){},translate(x,y){tx+=x;ty+=y;},
      drawImage(image,sx,sy,sw,sh,x,y,width,height){
        rectangle=[tx+x,ty+y,width,height];
      }};
    assert(w.BARCODE.PresentationAssets.draw(key,ctx,
      {x:600,y:450,width:400,height:200}),`${key} has a runtime atlas entry`);
    assert.deepEqual(rectangle,[400,250,400,200],
      `${key} places its center and foundation at the projected contact`);
  }
  const layout=w.BARCODE.CacheRoadLandscape.create(0x6b4d,9840,[]);
  const expected=['L-rear','L-middle','L-front-gap','L-front-fill',
    'R-rear','R-middle','R-front-gap','R-front-fill'];
  for(const family of ['market','homes','workshop','greenhouse','data','transit']) {
    const prefix=family[0].toUpperCase()+family.slice(1);
    const art=new Map(layout.plates.filter(p=>p.family===family&&p.key!=='accent'&&
      p.art[0].startsWith(`cache${prefix}`)).map(p=>[p.art[0],p.art]));
    assert.deepEqual([...art.keys()].sort(),expected.map(s=>
      `cache${prefix}${s.replace('-rear','Rear').replace('-middle','Middle')
        .replace('-front-gap','FrontGap').replace('-front-fill','FrontFill')}`)
      .sort(), `both banks use every ${family} tier and graph frontage`);
    for(const name of expected) {
    const side=name[0];
    const key=`cache${prefix}${side}${name.slice(2).split('-').map(x=>
      x[0].toUpperCase()+x.slice(1)).join('')}`;
    const metadata=art.get(key);
    assertProjectedAnchor(key);
    const runtime=await pixels(path.join(root,
      `assets/cache-road/world/blocks/block-${family}-${name}.webp`));
    const source=await sourceOrRuntime(path.join(root,
      `assets/cache-road/world/blocks/sources/block-${family}-${name}.png`),runtime);
    assert.equal(source.w,metadata[1],`${name} source width`);
    assert.equal(source.h,metadata[2],`${name} source height`);
    assert.equal(runtime.w,source.w,`${name} runtime width`);
    assert.equal(runtime.h,source.h,`${name} runtime height`);
    const fit=metadata[8];
    assert(fit && fit.footU>.08&&fit.footU<.92,
      `${name} declares an interior terrain foot`);
    const foot=bottom(source,fit.footU);
    assert(foot!==null&&Math.abs(foot-metadata[7])<35,
      `${name} contact ${metadata[7]} must be near opaque foot ${foot}`);
    assert(Math.abs(bottom(runtime,fit.footU)-foot)<5,
      `${name} optimized alpha retains its ground contact`);
    const outer=bottom(source,side==='L'?.14:.86);
    assert(outer!==null&&outer>foot+30,
      `${name} must slope down toward the ${side==='L'?'left':'right'} outer bank`);
    if(name.endsWith('front-gap')) {
      const reserved=side==='L'?[.80,1]:[0,.20];
      assert(occupied(source,...reserved)<.002&&
        occupied(runtime,...reserved)<.002,
        `${name} has a fully transparent road-facing street socket`);
      assert(Math.abs(fit.socketU-(side==='L'?
        family==='market'?.72:family==='data'?.71:.70:.28))<.015,
        `${name} socket metadata matches the authored opening`);
    } else {
      assert(fit.socketU===undefined,
        `${name} may not create a street without the road graph`);
    }
    if(name.endsWith('front-fill'))
      assert(occupied(source,...(side==='L'?[.8,.95]:[.05,.2]))>.18,
        `${name} occupies the road-facing socket when the graph closes it`);
    }
  }
  for(const material of ['wet-local-street','residential-paving',
    'service-court-paving','planted-gravel-court']) {
    const runtime=await pixels(path.join(root,
      `assets/cache-road/world/materials/${material}.webp`));
    const source=await sourceOrRuntime(path.join(root,
      `assets/cache-road/world/materials/${material==='wet-local-street'?'':'sources/'}${material}.png`),runtime);
    assert.deepEqual([source.w,source.h,runtime.w,runtime.h],
      [1254,1254,1254,1254],`${material} follows the fixed world-row period`);
  }
  for(const side of ['L','R'])for(const kind of [
    'sidewalk-turn','curb-return','street-mouth-sidewall','wall-roof-endcap']) {
    const art=await pixels(path.join(root,
      `assets/cache-road/world/joins/${kind}-${side}.svg`));
    const flat=kind==='sidewalk-turn'||kind==='curb-return';
    assert.deepEqual([art.w,art.h],flat?[256,256]:
      kind==='street-mouth-sidewall'?[80,160]:[96,192],
    `${side} ${kind} has the authored join projection dimensions`);
    const alpha=(x,y)=>art.alpha[(y*art.w+x)*4+3];
    if(flat) {
      assert.equal(alpha(128,128),0,
        `${side} ${kind} leaves the graph street center transparent`);
      assert([32,45,53,203,211,224].some(x=>alpha(x,128)>100),
        `${side} ${kind} occupies its sidewalk corner`);
    } else assert(alpha(Math.floor(art.w/2),Math.floor(art.h*.6))>100,
      `${side} ${kind} has an illustrated end face`);
  }
  for(const name of ['crosswalk','stop-line','drainage','loading-bay',
    'service-stencil','wet-repair-patch']) {
    const decal=await pixels(path.join(root,`assets/cache-road/world/decals/${name}.svg`));
    assert.deepEqual([decal.w,decal.h],[256,64],`${name} fits a projected street segment`);
  }
  for(const family of ['market','homes','workshop','greenhouse','data','transit']) {
    const practical=await pixels(path.join(root,
      `assets/cache-road/world/ambient/${family}-practicals.svg`));
    assert.deepEqual([practical.w,practical.h],[512,128],
      `${family} practical details hold four independently animated frames`);
  }
  const props='assets/cache-road/world/props/';
  for(const identity of ['courier','mechanic','market-worker','student',
    'gardener','resident'])for(const direction of ['toward','away']) {
    const name=`walker-${identity}-${direction}`;
    const runtime=await pixels(path.join(root,props,`${name}.webp`));
    const source=await sourceOrRuntime(path.join(root,props,`sources/${name}.png`),runtime);
    assert.deepEqual([source.w,source.h,runtime.w,runtime.h],
      [1024,1536,1024,1536],`${name} remains an individual pose`);
    assert(source.alpha[3]<16&&runtime.alpha[3]<16,
      `${name} has transparent cutout corners`);
  }
  for(const name of ['lamp-L','lamp-R','crossing-signal-L',
    'crossing-signal-R','wayfinding-sign','bins-recycling','loading-crates',
    'utility-cabinet','vendor-cart','fence-planter']) {
    const runtime=await pixels(path.join(root,props,`street-${name}.webp`));
    const source=await sourceOrRuntime(path.join(root,props,`sources/street-${name}.png`),runtime);
    assert.deepEqual([runtime.w,runtime.h],[source.w,source.h],
      `${name} runtime export retains its source geometry`);
    assert(source.alpha[3]<16&&runtime.alpha[3]<16,
      `${name} preserves transparent corners`);
  }
  for(const name of ['walker-courier','walker-mechanic','walker-market-worker',
    'walker-student','walker-gardener','walker-resident',
    'person-bicycle-courier','person-skateboarder','person-crate-carrier']) {
    const original=name.startsWith('walker-') ?
      `${name}-toward.webp` : `${name}.webp`;
    const pose=await pixels(path.join(root,props,original));
    const sourcePath=path.join(root,
      `assets/cache-road/world/sources/animation/${name}-source.png`);
    assert(fs.existsSync(sourcePath),`${name} retains its editable source atlas`);
    const atlas=await pixels(path.join(root,props,`animation/${name}-frames.webp`));
    const cols=name==='person-bicycle-courier'||name==='person-skateboarder'?2:4;
    assert.deepEqual([atlas.w,atlas.h],[Math.round(384*pose.w/pose.h)*cols,768],
      `${name} is registered to the original aspect in a two-row sheet`);
    const cw=atlas.w/cols,ch=atlas.h/2;
    for(let frame=0;frame<cols*2;frame++) {
      const x=frame%cols*cw,y=Math.floor(frame/cols)*ch;
      let solid=0;
      for(let yy=y+8;yy<y+ch-8;yy+=4)
        for(let xx=x+8;xx<x+cw-8;xx+=4)
          solid+=atlas.alpha[(yy*atlas.w+xx)*4+3]>128;
      assert(solid>100,`${name} frame ${frame} contains the painted figure`);
      for(const edge of [x,x+cw-1])for(let yy=y;yy<y+ch;yy+=4)
        assert(atlas.alpha[(yy*atlas.w+edge)*4+3]<16,
          `${name} frame ${frame} has no horizontal edge clipping`);
    }
  }
  console.log('Cache Road art: 48 sided contacts, four materials, eight joins, six decals, 22 still cutouts, six light sheets and nine travel sheets pass');
}
run().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
