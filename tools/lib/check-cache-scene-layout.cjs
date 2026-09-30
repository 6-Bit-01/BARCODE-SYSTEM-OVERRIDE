// Native review assertions shared by the Cache bridge and delivery renderers.
const assert=require('node:assert/strict');
const bounds=r=>[r.x,r.y,r.x+r.w,r.y+r.h];
const overlap=(a,b)=>Math.min(a[2],b[2])-Math.max(a[0],b[0])>.5&&Math.min(a[3],b[3])-Math.max(a[1],b[1])>.5;
const inside=(a,b)=>a[0]>=b[0]-1&&a[1]>=b[1]-1&&a[2]<=b[2]+1&&a[3]<=b[3]+1;
function polygonOverlapsRect(polygon,r) {
  const rectangle=[[r[0],r[1]],[r[2],r[1]],[r[2],r[3]],[r[0],r[3]]];
  const axes=[[1,0],[0,1],...polygon.map((p,i)=>{const q=polygon[(i+1)%polygon.length];return [p[1]-q[1],q[0]-p[0]];})];
  return axes.every(([x,y])=>{
    const a=polygon.map(p=>p[0]*x+p[1]*y),b=rectangle.map(p=>p[0]*x+p[1]*y);
    return Math.min(Math.max(...a),Math.max(...b))>Math.max(Math.min(...a),Math.min(...b))+.01;
  });
}
function inspectDialogue({scene,B,chapter,ctx,texts}) {
  const measured=scene.dialogueLayouts(ctx),rect=scene.imageRect();
  const protectedRegions=rect?B.CacheSceneLayouts[chapter][scene.page].protected.map(p=>({...p,
    bounds:[rect.x+p.x*rect.w,rect.y+p.y*rect.h,rect.x+(p.x+p.w)*rect.w,rect.y+(p.y+p.h)*rect.h]})):[];
  const shown=scene.transcriptOpen?[]:measured.slice(0,scene.cue);
  for(const l of shown) {
    const body=bounds(l),outer=[l.x-4,l.y-4,l.x+l.w+7,l.y+l.h+8];
    assert(inside(outer,[48,103,1872,985]),`${chapter} ${scene.page+1}: balloon escapes readable area`);
    assert(inside(bounds(l.labelRect),body),`${chapter} ${scene.page+1}: speaker tab escapes balloon`);
    const meter=[l.x+l.w-109,l.y+13,l.x+l.w-77,l.y+34];
    const serial=[l.x+l.w-53,l.y+16,l.x+l.w-25,l.y+36];
    assert(!overlap(bounds(l.labelRect),serial),`${chapter} ${scene.page+1}: speaker tab overlaps serial`);
    if(l.radio)assert(!overlap(bounds(l.labelRect),meter),`${chapter} ${scene.page+1}: speaker tab overlaps radio meter`);
    for(const entry of texts) {
      if(entry.x===l.textRect.x&&entry.y>=l.textRect.y&&entry.y<l.textRect.y+l.textRect.h)
        assert(inside(entry.bounds,[l.x+24,l.y+44,l.x+l.w-24,l.y+l.h-8]),`${chapter} ${scene.page+1}: dialogue escapes balloon: ${entry.text}`);
      if(entry.x===l.labelRect.x+10&&entry.y===l.labelRect.y+4)
        assert(inside(entry.bounds,bounds(l.labelRect)),`${chapter} ${scene.page+1}: label escapes tab: ${entry.text}`);
    }
    let pointer=null;
    if(l.tail) {
      const bx=l.x+Math.max(46,Math.min(l.w-46,Number.isFinite(l.tailBase)?l.tailBase*l.w:l.tail[0]-l.x));
      const by=l.tail[1]>l.y+l.h/2?l.y+l.h-5:l.y+5;
      pointer=[[bx-23,by],l.tail,[bx+23,by]];
      assert(inside([l.tail[0],l.tail[1],l.tail[0],l.tail[1]],bounds(rect)),`${chapter} ${scene.page+1}: pointer escapes painted image`);
    }
    for(const p of protectedRegions) {
      assert(!overlap(outer,p.bounds),`${chapter} ${scene.page+1}: balloon covers ${p.label}`);
      if(pointer)assert(!polygonOverlapsRect(pointer,p.bounds),`${chapter} ${scene.page+1}: pointer crosses ${p.label}`);
    }
  }
  for(let i=0;i<shown.length;i++)for(let j=i+1;j<shown.length;j++) {
    const a=shown[i],b=shown[j];
    assert(!overlap([a.x-4,a.y-4,a.x+a.w+7,a.y+a.h+8],[b.x-4,b.y-4,b.x+b.w+7,b.y+b.h+8]),
      `${chapter} ${scene.page+1}: balloons overlap`);
  }
  return {balloons:shown.map(l=>({x:l.x,y:l.y,w:l.w,h:l.h,radio:l.radio,tail:l.tail,label:l.label,
    labelRect:l.labelRect,textRect:l.textRect})),protected:protectedRegions};
}
function inspectEffects({scene,B,chapter,ctx,hashPixels}) {
  const values=B.Preferences.values,previous={...values},elapsed=scene.sceneElapsedMs,cueElapsed=scene.cueElapsedMs;
  const transcript=scene.transcriptOpen;scene.transcriptOpen=false;
  const snapshot=(ms,reduced,flashes)=>{
    values.reducedMotion=reduced;values.flashes=flashes;scene.sceneElapsedMs=ms;scene.cueElapsedMs=ms;
    ctx.reset();scene.draw(ctx);return hashPixels();
  };
  assert.notEqual(snapshot(0,false,true),snapshot(4300,false,true),`${chapter} ${scene.page+1}: normal scene has no visible motion`);
  assert.equal(snapshot(0,true,true),snapshot(4300,true,true),`${chapter} ${scene.page+1}: Reduced Motion pixels drift`);
  assert.equal(snapshot(0,false,false),snapshot(4300,false,false),`${chapter} ${scene.page+1}: flashes-off pixels drift`);
  // Isolate effects from the camera and dialogue: a moving picture alone is
  // not evidence that its scene-specific rain/light/trace layers animate.
  scene.sceneElapsedMs=6000;const fixedRect=scene.imageRect();
  const effectPixels=(ms,reduced,flashes)=>{
    ctx.reset();B.CacheSceneEffects.draw(ctx,{chapter,page:scene.page,rect:fixedRect,sceneElapsedMs:ms,cue:2,cueElapsedMs:400,reduced,flashes});
    return hashPixels();
  };
  assert.notEqual(effectPixels(0,false,true),effectPixels(4300,false,true),`${chapter} ${scene.page+1}: isolated effects do not animate`);
  assert.equal(effectPixels(0,true,true),effectPixels(4300,true,true),`${chapter} ${scene.page+1}: reduced isolated effects drift`);
  assert.equal(effectPixels(0,false,false),effectPixels(4300,false,false),`${chapter} ${scene.page+1}: flashes-off isolated effects drift`);
  for(const reduced of [false,true])for(const ms of [0,6000]) {
    values.reducedMotion=reduced;values.flashes=true;scene.sceneElapsedMs=ms;
    const r=scene.imageRect(),f=scene.frame;
    inspectDialogue({scene,B,chapter,ctx,texts:[]});
    assert(inside(bounds(r),bounds(f)),`${chapter} ${scene.page+1}: camera crops the painting`);
    const image=scene.images[scene.page].element;
    assert(Math.abs(r.w/r.h-image.width/image.height)<1e-9,'camera preserves source aspect ratio');
    ctx.reset();ctx.fillStyle='#123456';ctx.strokeStyle='#654321';ctx.globalAlpha=.71;ctx.lineWidth=7;
    // This native host's style getters retain the last assigned string after
    // restore(), while its actual paint state restores correctly. Compare
    // native swatches as well as the reliable transform/alpha/width getters.
    const paintSwatch=()=>{ctx.fillRect(4,4,8,8);ctx.strokeRect(20,4,8,8);return Buffer.from(ctx.getImageData(0,0,40,20).data);};
    const expectedPaint=paintSwatch();ctx.clearRect(0,0,1920,1080);
    const before=[ctx.globalAlpha,ctx.lineWidth,ctx.globalCompositeOperation,...['a','b','c','d','e','f'].map(k=>ctx.getTransform()[k])];
    B.CacheSceneEffects.draw(ctx,{chapter,page:scene.page,rect:r,sceneElapsedMs:ms,cue:2,cueElapsedMs:400,reduced});
    const after=[ctx.globalAlpha,ctx.lineWidth,ctx.globalCompositeOperation,...['a','b','c','d','e','f'].map(k=>ctx.getTransform()[k])];
    assert.deepEqual(after,before,'scene effects restore native Canvas state');
    const pixels=ctx.getImageData(0,0,1920,1080).data;
    for(let y=0;y<1080;y++)for(let x=0;x<1920;x++)if(x<Math.floor(r.x)||x>Math.ceil(r.x+r.w)||y<Math.floor(r.y)||y>Math.ceil(r.y+r.h))
      assert.equal(pixels[(y*1920+x)*4+3],0,`${chapter} ${scene.page+1}: effect escapes actual image rect`);
    assert.deepEqual(paintSwatch(),expectedPaint,'scene effects restore actual native fill/stroke paint and clipping');
  }
  Object.assign(values,previous);if(!('flashes' in previous))delete values.flashes;
  scene.sceneElapsedMs=elapsed;scene.cueElapsedMs=cueElapsed;scene.transcriptOpen=transcript;
  return {page:scene.page+1,normalMotion:true,reducedMotionStatic:true,flashesOffStatic:true,containPreserved:true,contextRestored:true,paintClipped:true};
}
module.exports={inspectDialogue,inspectEffects};
