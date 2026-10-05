// Actual loaded-art boundaries supplement the deeper existing ONE/judgment
// regression. Native Canvas is diagnostic, not device/browser acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const {nativeAssets,prepared,stage,focusedReceipt,modules,atlasRegistration}=require('./render-cache-beat-visual-system.cjs');
const {pressAt}=require('./check-cache-drive-feedback.cjs');
const root=path.resolve(__dirname,'..');process.chdir(root);
const copy=value=>JSON.parse(JSON.stringify(value)),hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const keys=['cacheBeatHardware','cacheBeatEnergy','cacheBeatTiming'];
function snapshotContext(ctx) {
  return {matrix:copy(ctx.getTransform()),alpha:ctx.globalAlpha,filter:ctx.filter,
    blur:ctx.shadowBlur,lineWidth:ctx.lineWidth,smoothing:ctx.imageSmoothingEnabled};
}
function protectedPixels(ctx,args) {
  const p=args.projection,x=p.laneX(args.nextPulse.lane,p.strikeDepth),m=ctx.getTransform();
  const box={left:x-72,right:x+72,top:p.strikeY+13,bottom:p.strikeY+149};
  const points=[[box.left,box.top],[box.right,box.top],[box.right,box.bottom],[box.left,box.bottom]]
    .map(([xx,yy])=>[m.a*xx+m.c*yy+m.e,m.b*xx+m.d*yy+m.f]);
  const left=Math.max(0,Math.floor(Math.min(...points.map(p=>p[0]))));
  const top=Math.max(0,Math.floor(Math.min(...points.map(p=>p[1]))));
  const right=Math.min(1920,Math.ceil(Math.max(...points.map(p=>p[0]))));
  const bottom=Math.min(1080,Math.ceil(Math.max(...points.map(p=>p[1]))));
  assert(right>left&&bottom>top,'the transformed upcoming cue is visible');
  const width=right-left,height=bottom-top,data=ctx.getImageData(left,top,width,height).data;
  const determinant=m.a*m.d-m.b*m.c,pixels=[];
  for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++) {
    const px=left+xx+.5-m.e,py=top+yy+.5-m.f;
    const wx=(m.d*px-m.c*py)/determinant,wy=(-m.b*px+m.a*py)/determinant;
    if(wx<box.left||wx>box.right||wy<box.top||wy>box.bottom)continue;
    const i=(yy*width+xx)*4;pixels.push(data[i],data[i+1],data[i+2],data[i+3]);
  }
  assert(pixels.length>4000);return Buffer.from(pixels);
}
function screenBounds(ctx,{left,right,top,bottom}) {
  const m=ctx.getTransform(),points=[[left,top],[right,top],[right,bottom],[left,bottom]]
    .map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
  return {left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),
    top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1]))};
}
function focusedReceiptClearance(assets) {
  // Earned results now stay in the existing HUD at fast/max focus. Observe
  // its real instrument ink, rather than copying its placement into a model.
  const records=[];
  for(const zoom of [1.253,1.335])for(const age of [0,80,360]) {
    const r=prepared(assets),s=focusedReceipt(r,{zoom,age});
    const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),shells=[],labels=[];
    const H=r.B.CacheRoadBeatFeedback,I=r.B.CacheRoadInstruments,draw=r.B.PresentationAssets.draw,fill=ctx.fillText.bind(ctx);
    let inReceipt=false,inReward=false;
    r.B.CacheRoadBeatFeedback={...H,drawReceipt(c,state,args) {
      inReceipt=true;try{return H.drawReceipt(c,state,args);}finally{inReceipt=false;}
    }};
    r.B.CacheRoadInstruments={...I,drawAdrenaline(c,state,args) {
      inReward=true;try{return I.drawAdrenaline(c,state,args);}finally{inReward=false;}
    }};
    r.B.PresentationAssets.draw=(key,c,args)=> {
      if(inReceipt&&key==='cacheBeatTiming'&&args.frame===5) {
        const e=assets.entries[key],left=args.x-args.width*e.ax,top=args.y-args.height*e.ay;
        shells.push(screenBounds(c,{left,top,right:left+args.width,bottom:top+args.height}));
      }
      return draw(key,c,args);
    };
    ctx.fillText=(value,x,y,maxWidth)=> {
      if(inReward&&(value==='PERFECT'||String(value)===`+${s.beatFeedback.delta}`)) {
        const m=ctx.measureText(String(value)),scale=Math.min(1,maxWidth/m.width);
        labels.push({value:String(value),bounds:screenBounds(ctx,{
          left:x-m.actualBoundingBoxLeft*scale-1,right:x+m.actualBoundingBoxRight*scale+1,
          top:y-m.actualBoundingBoxAscent-1,bottom:y+m.actualBoundingBoxDescent+1})});
      }
      return fill(value,x,y,maxWidth);
    };
    const before=JSON.stringify(s);r.road.draw(ctx);
    assert.equal(JSON.stringify(s),before,'focused earned review retains the real judgment and paint state');
    assert.equal(shells.length,0,'the actual earned Perfect submits no duplicate ground quality shell');
    assert.deepEqual(labels.map(label=>label.value),['PERFECT',`+${s.beatFeedback.delta}`],
      'the actual HUD quality and true gain remain readable under the real focused camera');
    for(const bounds of labels.map(label=>label.bounds))
      assert(bounds.left>=0&&bounds.right<=canvas.width&&bounds.top>=0&&bounds.bottom<=canvas.height,
        `the complete earned HUD ink stays inside the viewport at zoom ${zoom}, age ${age}`);
    records.push({zoom,age,groundShells:shells.length,labels});
  }
  return records;
}
async function perspectiveDiagnostic() {
  // A diagnostic source distinguishes every corner independently of the
  // artwork. Only the actual production projection module performs the warp.
  const source=createCanvas(256,256),sc=source.getContext('2d');
  const colors=['#ff0000','#00ff00','#0000ff','#ffff00'];
  for(const [i,[x,y]] of [[0,[0,0]],[1,[128,0]],[2,[128,128]],[3,[0,128]]]) {
    sc.fillStyle=colors[i];sc.fillRect(x,y,128,128);
  }
  const image=await loadImage(source.toBuffer('image/png')),w={BARCODE:{}};let diagnosticDraws=0;
  w.BARCODE.PresentationAssets={ready:key=>key==='diagnostic',draw(key,ctx,a) {
    assert.equal(key,'diagnostic');diagnosticDraws++;ctx.drawImage(image,a.x-a.width/2,a.y-a.height/2,a.width,a.height);return true;
  }};
  vm.runInNewContext(fs.readFileSync('src/game/cache-road-beat-surface.js','utf8'),{window:w});
  const S=w.BARCODE.CacheRoadBeatSurface,c=createCanvas(420,340),ctx=c.getContext('2d');
  const points=[[35,300],[380,280],[285,45],[150,70]];
  assert(S.paintQuad(ctx,'diagnostic',points));
  assert.equal(diagnosticDraws,2,'unequal perspective warps retain both original triangles');
  const center=[points.reduce((a,p)=>a+p[0],0)/4,points.reduce((a,p)=>a+p[1],0)/4];
  for(const [corner,expected] of [[3,[255,0,0]],[2,[0,255,0]],[1,[0,0,255]],[0,[255,255,0]]]) {
    const p=points[corner],x=Math.round(p[0]*.82+center[0]*.18),y=Math.round(p[1]*.82+center[1]*.18);
    const pixel=Array.from(ctx.getImageData(x,y,1,1).data);
    assert.deepEqual(pixel.slice(0,3),expected,'painted UV corners keep the near/far road-facing orientation');
    assert.equal(pixel[3],255,'source corners retain opaque interiors');
  }
  for(const t of [.2,.4,.6,.8]) {
    const x=Math.round(points[3][0]*(1-t)+points[1][0]*t),y=Math.round(points[3][1]*(1-t)+points[1][1]*t);
    assert(ctx.getImageData(x,y,1,1).data[3]>=180,'the two true road triangles do not leave a transparent diagonal crack');
  }
  ctx.reset();const parallel=[[35,300],[380,280],[350,45],[5,65]],beforeDraws=diagnosticDraws;
  assert(S.paintQuad(ctx,'diagnostic',parallel));
  assert.equal(diagnosticDraws-beforeDraws,1,'an equal affine surface submits one native painting');
  const mid=[parallel.reduce((sum,p)=>sum+p[0],0)/4,parallel.reduce((sum,p)=>sum+p[1],0)/4];
  for(const [corner,expected]of [[3,[255,0,0]],[2,[0,255,0]],[1,[0,0,255]],[0,[255,255,0]]]){
    const p=parallel[corner],pixel=Array.from(ctx.getImageData(Math.round(p[0]*.82+mid[0]*.18),Math.round(p[1]*.82+mid[1]*.18),1,1).data);
    assert.deepEqual(pixel.slice(0,3),expected,'single affine paint retains every authored UV corner');assert.equal(pixel[3],255);
  }
  assert.equal(ctx.getImageData(Math.round(mid[0]),Math.round(mid[1]),1,1).data[3],255,'the merged surface has no internal alpha seam');
  ctx.reset();ctx.translate(13,17);ctx.rotate(.027);ctx.globalAlpha=.37;ctx.lineWidth=7;
  const parent=snapshotContext(ctx);assert(S.paintQuad(ctx,'diagnostic',points,{opacity:.6}));
  assert.deepEqual(snapshotContext(ctx),parent,'perspective texture restores the inherited camera/context');
  assert.equal(S.paintQuad(ctx,'missing',points),false);
  assert.equal(S.paintQuad(ctx,'diagnostic',[[NaN,0],...points.slice(1)]),false);
  assert.deepEqual(snapshotContext(ctx),parent,'unavailable or invalid art leaves the current context intact');
  return {corners:4,diagonalSamples:4};
}
async function main() {
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const diagnostic=await perspectiveDiagnostic(),assets=await nativeAssets();
  const fingerprints=Object.fromEntries(['src/engine/presentation-assets.js','src/game/cache-road-proof.js',
    'src/game/cache-road-guidance.js',...modules]
    .filter(file=>fs.existsSync(file)).map(file=>[file,hash(fs.readFileSync(file))]));
  const atlas=[];
  for(const key of keys) {
    const e=assets.entries[key],image=assets.images[key];assert(e&&image,'every authored beat atlas is bundled and registered');
    assert.equal(e.columns,4);assert.equal(e.rows,key==='cacheBeatEnergy'?3:2);
    assert.equal(e.frames,e.columns*e.rows);assert.equal(e.ax,.5);assert.equal(e.ay,.5);
    assert.equal(image.width%e.columns,0);assert.equal(image.height%e.rows,0);
    const c=createCanvas(image.width,image.height),ctx=c.getContext('2d');ctx.drawImage(image,0,0);
    const fw=image.width/e.columns,fh=image.height/e.rows,cells=[];
    for(let frame=0;frame<e.frames;frame++) {
      const data=ctx.getImageData(frame%e.columns*fw,Math.floor(frame/e.columns)*fh,fw,fh).data;
      let opaque=0,transparent=0;
      for(let pixel=3;pixel<data.length;pixel+=4) {if(data[pixel]>96)opaque++;if(!data[pixel])transparent++;}
      assert(opaque>200,`${key}/${frame} contains actual painted art`);
      assert(transparent>200,`${key}/${frame} has usable transparency`);
      cells.push({frame,opaque,transparent,sha256:hash(data)});
    }
    assert.equal(new Set(cells.map(cell=>cell.sha256)).size,e.frames,'every state/color has distinct source pixels');
    atlas.push({key,path:e.path,width:image.width,height:image.height,cells,sha256:hash(fs.readFileSync(e.path))});
  }
  const registration=atlasRegistration(assets).records;
  assert.equal(registration.length,28,'all 28 current runtime source frames are actually drawn by the production API');
  assert.equal(new Set(registration.map(frame=>frame.pixelHash)).size,28,
    'source registration, per-frame crops and true road projection produce 28 visibly distinct native states');
  assert(registration.every(frame=>frame.opaquePixels>200),'no registered source/crop combination becomes an empty rendered frame');
  const focusedReceipts=focusedReceiptClearance(assets);
  const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),frames=[];
  for(const name of ['Approach','Ready-ONE','Perfect-Impact','Good','Miss','Reduced','Focused-Turn']) {
    const r=prepared(assets),s=stage(r,name),H=r.B.CacheRoadBeatFeedback,S=r.B.CacheRoadBeatSurface;
    assert(S);assert.deepEqual(copy(S.limits),{trianglesPerSurface:2,runwayPulses:0,sparkClusters:4,
      padImageCalls:2,targetImageCalls:10,receiptImageCalls:0});
    const calls=[],events=[],limits={pad:0,target:0,receipt:0},maxImageCalls={pad:0,target:0,receipt:0};let scope=null,target=null;
    const draw=r.B.PresentationAssets.draw;
    r.B.PresentationAssets.draw=(key,c,args)=>{
      calls.push({key,...copy(args),scope,filter:c.filter});events.push({key,scope,filter:c.filter});
      if(keys.includes(key)&&scope)limits[scope]++;
      return draw(key,c,args);
    };
    r.B.CacheRoadBeatFeedback={...H};
    for(const [method,kind] of [['drawPad','pad'],['drawTarget','target'],['drawReceipt','receipt']])
      r.B.CacheRoadBeatFeedback[method]=(c,state,...rest)=> {
        scope=kind;const start=limits[kind];if(kind==='target')target=rest[0];
        const protectedBefore=kind==='receipt'&&rest[0].nextCue?.ready?protectedPixels(c,rest[0]):null;
        const result=H[method](c,state,...rest);
        if(protectedBefore)assert.deepEqual(protectedPixels(c,rest[0]),protectedBefore,
          'loaded artwork preserves the entire transformed upcoming timing target');
        const bound=kind==='pad'?S.limits.padImageCalls:kind==='target'?S.limits.targetImageCalls:S.limits.receiptImageCalls;
        const work=limits[kind]-start;maxImageCalls[kind]=Math.max(maxImageCalls[kind],work);
        assert(work<=bound,`${kind} actual authored image work remains within its published bound`);
        scope=null;return result;
      };
    ctx.reset();const before=JSON.stringify(s),owners=JSON.stringify({calls:r.calls,timers:r.timers.size});
    r.road.draw(ctx);const pixels=Buffer.from(ctx.getImageData(0,0,1920,1080).data);
    const firstEvents=events.slice(),firstCalls=calls.slice();
    assert.equal(JSON.stringify(s),before,'the loaded whole-scene draw cannot mutate chart, receipts or clocks');
    assert.equal(JSON.stringify({calls:r.calls,timers:r.timers.size}),owners,'paint never creates another lifecycle owner');
    ctx.reset();r.road.draw(ctx);assert.deepEqual(Buffer.from(ctx.getImageData(0,0,1920,1080).data),pixels,
      'a paused/repeated loaded-art frame has identical native pixels');
    assert(calls.some(call=>keys.includes(call.key)&&call.scope==='pad'),'actual physical pads use the custom skin');
    assert(!calls.some(call=>call.key==='cacheBeatEnergy'&&call.scope),'minimal ground cues submit no energy layers');
    assert(!calls.some(call=>call.scope==='receipt'),'handled ground receipts submit no asset paint');
    if(target.nextCue?.ready)assert(calls.some(call=>call.key==='cacheBeatTiming'&&call.scope==='target'),
      'an actual ready cue uses the custom timing hardware');
    else {
      const caught=H.feedbackPose(s,{reduced:!!r.B.Preferences.values.reducedMotion});
      const dockCalls=calls.filter(call=>call.key==='cacheBeatHardware'&&call.scope==='target');
      if(caught?.success&&caught.age<650)assert(dockCalls.length>0&&dockCalls.length<=4,
        'only a real recent caught receipt keeps a dock between announced targets');
      else assert.equal(dockCalls.length,0,'inactive docks submit no persistent hardware work');
    }
    const roadArt=firstEvents.map((event,index)=>keys.includes(event.key)&&event.scope?index:-1).filter(i=>i>=0);
    const firstCar=firstEvents.findIndex(event=>/^cacheCar(?:Left|Right|Hit)?$/.test(event.key)&&event.filter==='none');
    assert(firstCar>Math.max(...roadArt),
      'the actual Cache car paints after ground art and occludes it');
    if(s.beatFeedback?.kind==='perfect'||s.beatFeedback?.kind==='good') {
      assert.equal(maxImageCalls.receipt,0,'the genuine earned quality is handled by the retained HUD');
      const reward=r.B.CacheRoadInstruments.rewardPose(s,{reduced:!!r.B.Preferences.values.reducedMotion});
      assert(reward.paired&&reward.quality===s.beatFeedback.kind,
        'actual earned receipt facts still pair with their HUD quality and true gain');
    }
    if(name==='Reduced')assert(!calls.some(call=>call.scope==='receipt'&&call.key==='cacheBeatEnergy'&&call.frame>=8),
      'Reduced Motion submits no removed transient particle clusters');
    if(name==='Perfect-Impact') {
      for(const options of [{reduced:true,flashes:true},{reduced:false,flashes:false}]) {
        r.w.BARCODE_RENDER_QUALITY={flashes:options.flashes};
        const args={projection:target.projection,reduced:options.reduced,road:r.road};
        const sample=age=>{ctx.reset();ctx.clearRect(0,0,1920,1080);H.drawReceipt(ctx,{...s,
          elapsedMs:s.beatFeedback.atMs+age},args);return Buffer.from(ctx.getImageData(0,0,1920,1080).data);};
        assert.deepEqual(sample(100),sample(600),'loaded earned paint is steady for both comfort preferences');
      }
    }
    frames.push({name,maxImageCalls,authoredCalls:firstCalls.filter(call=>keys.includes(call.key)).length,
      pixelHash:hash(pixels),originalBlur:firstCalls.some(call=>call.filter==='blur(2.3px)')});
  }
  // Existing regression owns exhaustive source deadlines and successive
  // outcomes. These two actual chart pairs specifically exercise new skins.
  const consecutive=[];
  for(const sameLane of [false,true]) {
    const r=prepared(assets);let found=false;
    for(let bar=Math.floor(r.road.state.musicBeatFloat/4);bar<90&&!found;bar++) {
      r.tick(bar*4);const prior=r.road.pulses().find(p=>p.target===bar*4);
      const next=r.road.pulses().find(p=>p.target===bar*4+4);
      if(!prior||!next||(prior.lane===next.lane)!==sameLane)continue;
      r.pulse=prior;r.road.state.lane=r.road.state.lanePos=prior.lane;
      assert(pressAt(r,sameLane?0:150).accepted);const s=r.road.state;
      if(s.opening)s.opening.sealed=true;s.opening=null;s.handoffMs=0;
      const H=r.B.CacheRoadBeatFeedback,draw=r.B.PresentationAssets.draw;let exercised=false,targetImages=0,inTarget=false,dockImages=0;
      r.B.PresentationAssets.draw=(key,c,args)=> {
        if(inTarget&&keys.includes(key)) {
          targetImages++;
          if(key==='cacheBeatHardware'&&args.width===256&&args.height===256)dockImages++;
        }
        return draw(key,c,args);
      };
      r.B.CacheRoadBeatFeedback={...H,drawReceipt(c,state,args) {
        assert.equal(args.nextPulse.id,next.id);assert(args.nextCue.ready);
        const before=protectedPixels(c,args),result=H.drawReceipt(c,state,args);
        assert.deepEqual(protectedPixels(c,args),before,'new receipt textures cannot overwrite the next real mapped cue');
        exercised=true;return result;
      },drawTarget(c,state,args) {
        inTarget=true;let result;try{result=H.drawTarget(c,state,args);}finally{inTarget=false;}
        assert.equal(targetImages,sameLane?8:10,
          'one active dock plus any distinct genuinely caught dock keep the exact2/10/0 budget');
        assert.equal(dockImages,sameLane?2:4,'inactive slots never substitute legacy bracket/texture work');
        return result;
      }};
      ctx.reset();r.road.draw(ctx);assert(exercised);
      consecutive.push({sameLane,prior:prior.id,next:next.id,kind:s.beatFeedback.kind,targetImages,dockImages});found=true;
    }
    assert(found,'the production v4 chart supplies both consecutive-lane asset cases');
  }
  for(const [file,digest] of Object.entries(fingerprints))assert.equal(hash(fs.readFileSync(file)),digest,
    'all observed source bytes remain fixed during the native asset run');
  const report={passed:true,diagnostic,atlases:atlas,registration,frames,consecutive,focusedReceipts,sourceHashes:fingerprints,
    limitation:'Native loaded-art production fixtures and two actual chart/judgment pairs. No human controller, browser, audio, Makko/device FPS or comfort acceptance claim.'};
  if(process.argv[2])fs.writeFileSync(path.resolve(process.argv[2]),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({gate:'cache-beat-visual-system',passed:true,atlases:atlas.length,
    sourceCells:atlas.reduce((sum,a)=>sum+a.cells.length,0),diagnostic,frames,consecutive,
    focusedReceipts:focusedReceipts.length,worstFocusedHUDBottom:Math.max(...focusedReceipts.flatMap(r=>r.labels.map(l=>l.bounds.bottom)))}));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
