// Loader lifecycle and production Chromium frame/raster comparisons.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../src/engine/presentation-assets.js'),'utf8');
const inspected=source.replace('  const cache = {};','  const cache = {};window.bitmapReview={entries,cache};');
async function unit(){
  for(const failure of ['none','reject','throw','invalid']){
    const images=[],prepared=[],closed=[];
    class Image {constructor(){this.naturalWidth=1024;this.naturalHeight=512;images.push(this);}}
    const w={Image,BARCODE:{},createImageBitmap(image,options){
      prepared.push(image);
      if(failure==='throw')throw Error('unsupported');
      if(failure==='reject')return Promise.reject(Error('unsupported'));
      return Promise.resolve({width:failure==='invalid'?0:(options?.resizeWidth||image.naturalWidth),height:options?.resizeHeight||image.naturalHeight,
        image,close(){closed.push(this);}});
    }},context={window:w};
    vm.runInNewContext(inspected,context);
    const {entries,cache}=w.bitmapReview,key='cacheDashDigits',state=cache[key],image=state.image;
    assert.equal(state.ready,false);image.onload();
    assert.equal(state.image.onload,null);assert.equal(state.image.onerror,null);
    const count=images.length;w.BARCODE.PresentationAssets.preload();
    assert.equal(images.length,count,'preload cannot recreate pending or prepared images');
    await new Promise(setImmediate);assert(state.ready,'unsupported preparation retains the original art');
    assert.equal(prepared.filter(value=>value===image).length,1,'a loaded SVG has exactly one preparation attempt');
    assert.equal(!!state.bitmap,failure==='none');assert.equal(closed.length,failure==='invalid'?1:0);
    const calls=[],ctx={globalAlpha:.37,filter:'blur(2.3px)',imageSmoothingEnabled:false,
      save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);}};
    for(let frame=0;frame<20;frame++)
      assert(w.BARCODE.PresentationAssets.draw(key,ctx,{x:0,y:0,width:50,height:17,sourceRect:[12,9,31,19]}));
    assert.equal(prepared.length,1,'drawing and paused repeats never prepare or decode another bitmap');
    for(const call of calls){
      assert.equal(call[0],state.bitmap||image);assert.deepEqual(call.slice(1),[12,9,31,19,0,0,50,17]);
    }
    assert.equal(ctx.filter,'blur(2.3px)');assert.equal(ctx.globalAlpha,.37);
    assert.equal(ctx.imageSmoothingEnabled,false,'direct projected draws restore smoothing');
    const raster=cache.cacheBeatHardware;raster.image.onload();
    assert(raster.ready,'road raster art remains available during variant preparation');
    await new Promise(setImmediate);
    assert.equal(!!raster.rasters?.length,failure==='none',
      'raster preparation succeeds once or keeps the original source on failure');
    const rasterAttempts=prepared.filter(value=>value===raster.image).length;
    assert(rasterAttempts>0&&rasterAttempts<=3,'each road sheet has at most three preparation attempts');
    const missing=cache.cacheSidewalk;missing.image.onerror();
    assert.equal(missing.image.src,entries.cacheSidewalk.path,'one pinned failure uses the bundled SVG');
    missing.image.onload();await new Promise(setImmediate);
    assert(missing.ready);assert.equal(prepared.length,2+rasterAttempts);
    w.BARCODE.PresentationAssets.preload();assert.equal(prepared.length,2+rasterAttempts,'re-entry reuses all prepared fallback art');
  }
  console.log('PASS: one SVG preparation per load, warm/pause reuse, exact source rectangles, context preservation, raster routing and graceful bitmap rejection.');
}


async function rasterUnit(){
  const prepared=[],images=[],closed=[];let live=0,maxLive=0;
  class Image{constructor(){this.naturalWidth=2048;this.naturalHeight=1024;images.push(this);}}
  const w={Image,BARCODE:{},createImageBitmap(image,options){
    prepared.push(image);live++;maxLive=Math.max(maxLive,live);
    return Promise.resolve().then(()=>{live--;return {width:options.resizeWidth,height:options.resizeHeight,
      close(){closed.push(this);}};});
  }};
  vm.runInNewContext(inspected,w.window?{window:w.window}:{window:w});
  const {cache,entries}=w.bitmapReview;
  // Exercise the actual loader/queue, not a second implementation.
  for(const [key,state]of Object.entries(cache))
    if(key.startsWith('cache')&&!entries[key].path.endsWith('.svg'))state.image.onload();
  for(let wait=0;wait<3000&&Object.values(cache).some(s=>s.preparingRaster);wait++)await Promise.resolve();
  assert(!Object.values(cache).some(s=>s.preparingRaster),'the finite preparation queue drains');
  assert(maxLive<=2,'only two raster preparations may be active');
  const pixels=Object.values(cache).flatMap(s=>s.rasters||[]).reduce((n,r)=>n+r.image.width*r.image.height,0);
  assert(pixels<=32*1024*1024,'derived raster memory stays inside its global pixel budget');
  assert(Object.values(cache).every(s=>(s.rasters?.length||0)<=3),'each sheet has a finite pyramid');
  const key='cacheStreetBenchPlanters',state=cache[key],e=entries[key];
  assert(state.rasters.length,'the expensive bench/planter sheet has prepared variants');
  const calls=[],ctx={globalAlpha:.37,filter:'blur(2.3px)',imageSmoothingEnabled:false,
    save(){},restore(){},translate(){},scale(){},getTransform(){return this.matrix;},
    matrix:{a:.2,b:.03,c:0,d:.2,e:0,f:0},drawImage(...args){calls.push(args);}};
  const count=prepared.length;
  for(let i=0;i<120;i++)w.BARCODE.PresentationAssets.draw(key,ctx,
    {width:180,height:100,sourceRect:[12,9,800,600]});
  const raster=state.rasters.find(r=>r.image===calls[0][0]);assert(raster);
  assert.deepEqual(calls[0].slice(1,5),[12*raster.scaleX,9*raster.scaleY,800*raster.scaleX,600*raster.scaleY]);
  assert.deepEqual(calls[0].slice(5),[-180*e.ax,-100*e.ay,180,100],'anchors and destination remain exact');
  assert.equal(prepared.length,count,'warm and paused draws never allocate another variant');
  ctx.matrix={a:8,b:0,c:0,d:8,e:0,f:0};
  w.BARCODE.PresentationAssets.draw(key,ctx,{width:1200,height:800});
  assert.equal(calls.at(-1)[0],state.image,'large foreground art uses the original resolution');
  ctx.getTransform=undefined;
  w.BARCODE.PresentationAssets.draw(key,ctx,{width:24,height:16});
  assert.equal(calls.at(-1)[0],state.image,'hosts without affine inspection keep the original source');
  assert.equal(ctx.globalAlpha,.37);assert.equal(ctx.filter,'blur(2.3px)');
  assert.equal(ctx.imageSmoothingEnabled,false);w.BARCODE.PresentationAssets.preload();
  assert.equal(prepared.length,count,'re-entry retains the same finite prepared resources');
  console.log('PASS: bounded raster memory/concurrency, affine source/crop registration, full-size fallback and allocation-free warm draws.');
}

const frameReviewCount=screens=>screens.length/3;
async function browser(){
  const http=require('node:http'),os=require('node:os'),{spawn}=require('node:child_process'),{once}=require('node:events');
  const root=path.resolve(__dirname,'..'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'barcode-bitmap-'));
  const {prepared,stage,modules}=require('./render-cache-beat-visual-system.cjs');
  const definitions={window:{BARCODE:{}}};vm.runInNewContext(inspected,definitions);
  const entries=definitions.window.bitmapReview.entries;
  const scenes=['Approach','Ready-ONE','Perfect-Impact','Good','Miss','Reduced','Focused-Turn'].map(name=>{
    const r=prepared({manifest:source,entries,images:{}});
    return {name,state:JSON.parse(JSON.stringify(stage(r,name))),chapter:r.road.chapter};
  });
  const production=['src/engine/music-profiles.js','src/engine/music-transport.js',
    'src/engine/cache-road-proof-profile.js','src/game/cache-road-landscape.js',
    'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
    'src/game/cache-road-pursuit.js','src/game/cache-road-guidance.js',...modules,
    'src/game/cache-road-proof.js'];
  const chromePath=process.env.CHROME_BIN||'/usr/bin/google-chrome';
  let child,socket;
  const fixture=`<!doctype html><canvas id="gameCanvas" width="1920" height="1080"></canvas><script>
    window.bitmapAttempts=[];window.contextCalls=0;
    const originalContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(...args){
      if(++contextCalls>1)throw Error('extra display Canvas context');return originalContext.apply(this,args);
    };
    const descriptor=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
    Object.defineProperty(HTMLImageElement.prototype,'src',{get:descriptor.get,set(value){
      if(value.startsWith('https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/'))
        value='/'+value.split('/').slice(6).join('/');
      descriptor.set.call(this,value);
    }});
    const bitmap=window.createImageBitmap.bind(window);
    window.createImageBitmap=(image,...args)=>{bitmapAttempts.push(image.src);return bitmap(image,...args);};
    window.BARCODE={Campaign:{register(){},syncTitleButton(){}},GamepadUI:{connected:false},
      CacheChapter:{recordIds:['r1','r2','r3','r4']},Preferences:{values:{reducedMotion:false,flashes:true}}};
    window.audioSystem={context:{currentTime:0,state:'running'},playCombatCue(){}};
    window.frameReviewScenes=${JSON.stringify(scenes)};
  </script><script src="/registry.js"></script>
  ${production.map(file=>'<script src="/'+file+'"></script>').join('')}`;
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}
    if(pathname==='/registry.js'){res.setHeader('Content-Type','text/javascript');res.end(inspected);return;}
    if(pathname==='/src/game/cache-road-proof.js') {
      const road=fs.readFileSync(path.join(root,'src/game/cache-road-proof.js'),'utf8');
      assert(road.includes('const compositeBlur=ctx.canvas?.width>0'));
      res.setHeader('Content-Type','text/javascript');
      res.end(road.replace('const compositeBlur=ctx.canvas?.width>0',
        "const compositeBlur=window.bitmapReview.mode!=='vector'&&ctx.canvas?.width>0"));return;
    }
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',pathname.endsWith('.js')?'text/javascript':pathname.endsWith('.ttf')?'font/ttf':pathname.endsWith('.svg')?'image/svg+xml':pathname.endsWith('.webp')?'image/webp':'image/png');
    fs.createReadStream(file).pipe(res);
  });
  try{
    server.listen(0,'127.0.0.1');await once(server,'listening');
    const origin='http://127.0.0.1:'+server.address().port;
    child=spawn(chromePath,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run',
      '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe'],windowsHide:true});
    const debug=await new Promise((resolve,reject)=>{
      let output='';const timeout=setTimeout(()=>reject(Error('Chromium startup timed out')),30000);
      child.stderr.on('data',chunk=>{output+=chunk;const m=output.match(/DevTools listening on (ws:\/\/\S+)/);
        if(m){clearTimeout(timeout);resolve(m[1]);}});child.once('error',reject);
    });
    const target=await(await fetch(new URL(debug).origin.replace('ws:','http:')+'/json/new',{method:'PUT'})).json();
    socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{
      socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    let serial=0;const pending=new Map();
    socket.addEventListener('message',event=>{const value=JSON.parse(event.data),p=pending.get(value.id);
      if(value.method==='Runtime.consoleAPICalled')for(const argument of value.params.args||[])
        if(typeof argument.value==='string'&&argument.value.startsWith('FRAME_COST '))console.log(argument.value);
      if(p){pending.delete(value.id);clearTimeout(p.timeout);value.error?p.reject(Error(JSON.stringify(value.error))):p.resolve(value.result);}});
    const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;
      const timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},180000);
      pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});
    await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:origin});
    const result=await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
      const started=performance.now();
      while(!window.bitmapReview||Object.values(bitmapReview.cache).some(state=>!state.ready||state.preparingRaster)){
        if(performance.now()-started>45000)throw Error('assets did not prepare');await new Promise(r=>setTimeout(r,25));
      }
      const {entries,cache}=bitmapReview,svg=Object.keys(entries).filter(key=>entries[key].path.endsWith('.svg'));
      if(svg.some(key=>!(cache[key].bitmap instanceof ImageBitmap)))throw Error('SVG bitmap preparation failed');
      if(bitmapAttempts.filter(src=>src.endsWith('.svg')).length!==svg.length)throw Error('SVG preparations were duplicated');
      const c=document.getElementById('gameCanvas'),ctx=c.getContext('2d'),P=BARCODE.PresentationAssets;
      const beforeSVG=bitmapAttempts.filter(src=>src.endsWith('.svg')).length,pixels=[];
      for(let repeat=0;repeat<2;repeat++){
        ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.translate(42,57);ctx.rotate(.013);ctx.globalAlpha=.7;
        P.draw('cacheOuterGround',ctx,{x:0,y:0,width:1530,height:850});
        ctx.filter='blur(2.3px)';P.draw('cacheSidewalk',ctx,{x:170,y:550,width:250,height:87});
        ctx.filter='none';
        for(let digit=0;digit<10;digit++)P.draw('cacheDashDigits',ctx,{x:30+digit*58,y:80,width:36,height:55,
          sourceRect:[digit*64,0,64,100]});
        ctx.restore();pixels.push(Array.from(ctx.getImageData(0,0,c.width,c.height).data));
      }
      if(pixels[0].some((value,i)=>value!==pixels[1][i]))throw Error('paused pixels changed');
      for(let frame=0;frame<120;frame++)
        P.draw('cacheDashDigits',ctx,{x:10,y:10,width:36,height:55,sourceRect:[0,0,64,100]});
      P.preload();if(bitmapAttempts.filter(src=>src.endsWith('.svg')).length!==beforeSVG)throw Error('warm SVG draws or preload rebuilt the cache');
      if(contextCalls!==1)throw Error('display Canvas ownership changed');
      const font=await new FontFace('Oxanium',
        'url(/assets/studies/visual-overhaul/references/fonts/Oxanium.ttf)').load();
      document.fonts.add(font);window.renderer={canvas:c,ctx};
      const road=BARCODE.CacheRoadProof;
      if(!road)throw Error('Production road renderer did not load');
      road.active=true;road.status='playing';road.audioDegraded=false;
      road.selectMusicProfile();BARCODE.MusicTransport.start({sourceAnchorAudioSec:0,sourceOffsetTrackSec:0});
      const bitmaps=Object.fromEntries(svg.map(key=>[key,cache[key].bitmap]));
      const rasters=Object.fromEntries(Object.entries(cache).map(([key,state])=>[key,state.rasters]));
      const rasterPixels=Object.values(rasters).flatMap(items=>items||[])
        .reduce((sum,item)=>sum+item.image.width*item.image.height,0);
      if(rasterPixels>32*1024*1024)throw Error('raster variants exceed the memory budget');
      const median=values=>{const v=values.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)];};
      const rows=[],assetDraw=P.draw,bitmapFactory=window.createImageBitmap;
      const originalDrawImage=ctx.drawImage;let reflectionBlurs=0;
      ctx.drawImage=function(source,...args){
        if(source===c&&this.filter==='blur(2.3px)')reflectionBlurs++;
        return originalDrawImage.call(this,source,...args);
      };
      const framePixels=new Map(),pixelComparisons=[],screens=[];
      let measuredGroups={};
      P.draw=(key,context,args)=>{
        const group=context.filter==='none'?'plain':'filtered';
        const began=performance.now(),ok=assetDraw(key,context,args),ms=performance.now()-began;
        measuredGroups[group]=(measuredGroups[group]||0)+ms;
        measuredGroups[key]=(measuredGroups[key]||0)+ms;
        return ok;
      };
      // Draw identical moving production states in both representations.
      // A one-pixel readback flushes queued raster work into elapsed time.
      // These are controlled rendering diagnostics, not device gameplay FPS.
      for(const scene of frameReviewScenes)for(const mode of ['vector','bitmap','raster']) {
        bitmapReview.mode=mode;
        window.createImageBitmap=mode==='vector'?undefined:bitmapFactory;
        for(const key of svg)cache[key].bitmap=mode==='vector'?undefined:bitmaps[key];
        for(const [key,items]of Object.entries(rasters))cache[key].rasters=mode==='raster'?items:undefined;
        road.chapter=structuredClone(scene.chapter);road.state=structuredClone(scene.state);
        BARCODE.Preferences.values.reducedMotion=scene.name==='Reduced';
        const samples=[];
        for(let frame=0;frame<10;frame++) {
          ctx.reset();measuredGroups={};reflectionBlurs=0;
          const stateBefore=JSON.stringify(road.state),began=performance.now();
          road.draw(ctx);const submitted=performance.now();ctx.getImageData(0,0,1,1);
          const elapsed=performance.now()-began;
          if(frame===9)console.log('FRAME_COST '+JSON.stringify({name:scene.name,mode,
            submitMs:submitted-began,flushMs:performance.now()-submitted,
            groups:Object.fromEntries(Object.entries(measuredGroups).filter(([key,value])=>value>1))}));
          if(JSON.stringify(road.state)!==stateBefore)throw Error('A measured draw changed gameplay');
          if(reflectionBlurs!==(mode==='vector'?0:1))throw Error('reflection blur was repeated or lost');
          if(frame>=2)samples.push(elapsed);
          if(frame===4) {
            const pixels=ctx.getImageData(0,0,c.width,c.height).data;
            screens.push({name:scene.name,mode,webp:c.toDataURL('image/webp',.9).split(',')[1]});
            if(mode==='vector')framePixels.set(scene.name+'-vector',pixels);
            else {
              const previous=framePixels.get(scene.name+'-'+(mode==='raster'?'bitmap':'vector'));let total=0,max=0;
              for(let i=0;i<pixels.length;i++)if(i%4!==3) {
                const difference=Math.abs(pixels[i]-previous[i]);total+=difference;max=Math.max(max,difference);
              }
              pixelComparisons.push({name:scene.name,mode,meanRGB:total/(c.width*c.height*3),maxChannelDifference:max});
              if(mode==='bitmap')framePixels.set(scene.name+'-bitmap',pixels);
              else {framePixels.delete(scene.name+'-bitmap');framePixels.delete(scene.name+'-vector');}
            }
          }
          road.state.progress+=road.state.speed/60;road.state.elapsedMs+=1000/60;
          road.state.musicBeatFloat+=128/60/60;
          road.state.musicBar=Math.floor(road.state.musicBeatFloat/4);
          await new Promise(resolve=>setTimeout(resolve,0));
        }
        const sorted=samples.slice().sort((a,b)=>a-b);
        rows.push({name:scene.name,mode,medianMs:median(samples),
          p95Ms:sorted[Math.ceil(sorted.length*.95)-1],frames:samples.length,includesRasterFlush:true});
        console.log('FRAME_COST '+JSON.stringify(rows.at(-1)));
      }
      for(const key of svg)cache[key].bitmap=bitmaps[key];
      for(const [key,items]of Object.entries(rasters))cache[key].rasters=items;
      window.createImageBitmap=bitmapFactory;bitmapReview.mode='raster';
      const frameComparisons=frameReviewScenes.map(({name})=>{
        const previous=rows.find(row=>row.name===name&&row.mode==='bitmap');
        const after=rows.find(row=>row.name===name&&row.mode==='raster');
        return {name,beforeMs:previous.medianMs,afterMs:after.medianMs,p95Ms:after.p95Ms,
          ratio:after.medianMs/previous.medianMs};
      });
      const diagnostics=[];
      const skin=BARCODE.CacheRoadBeatSurface,scene=frameReviewScenes.find(s=>s.name==='Ready-ONE');
      for(const disableBeatArt of [false,true]) {
        BARCODE.CacheRoadBeatSurface=disableBeatArt?undefined:skin;
        road.chapter=structuredClone(scene.chapter);road.state=structuredClone(scene.state);
        const samples=[];
        for(let frame=0;frame<8;frame++) {
          ctx.reset();measuredGroups={};const started=performance.now();road.draw(ctx);
          const submitMs=performance.now()-started;ctx.getImageData(0,0,1,1);
          if(frame>1)samples.push({totalMs:performance.now()-started,submitMs,groups:{...measuredGroups}});
          road.state.progress+=road.state.speed/60;road.state.elapsedMs+=1000/60;
          await new Promise(resolve=>setTimeout(resolve,0));
        }
        const last=samples.at(-1);
        diagnostics.push({name:'isolated-beat-art',disableBeatArt,medianMs:median(samples.map(s=>s.totalMs)),
          medianSubmitMs:median(samples.map(s=>s.submitMs)),
          groups:Object.fromEntries(Object.entries(last.groups).filter(([key,value])=>value>1))});
        console.log('FRAME_COST '+JSON.stringify(diagnostics.at(-1)));
      }
      BARCODE.CacheRoadBeatSurface=skin;P.draw=assetDraw;
      const viewportChecks=[];
      for(const [width,height,scale]of [[960,540,.5],[2400,1350,1.25]]) {
        c.width=width;c.height=height;ctx.setTransform(scale,0,0,scale,7,11);
        reflectionBlurs=0;const before=ctx.getTransform(),stateBefore=JSON.stringify(road.state);
        road.draw(ctx);const after=ctx.getTransform();
        if(reflectionBlurs!==1||JSON.stringify(road.state)!==stateBefore)
          throw Error('scaled viewport lost reflection blur or changed gameplay');
        if(['a','b','c','d','e','f'].some(key=>before[key]!==after[key]))
          throw Error('reflection blur changed the caller viewport transform');
        viewportChecks.push({width,height,scale,reflectionBlurs,transformPreserved:true});
      }
      c.width=1920;c.height=1080;ctx.drawImage=originalDrawImage;
      const aggregateRatio=frameComparisons.reduce((sum,row)=>sum+row.afterMs,0)/
        frameComparisons.reduce((sum,row)=>sum+row.beforeMs,0);
      console.log('FRAME_COST '+JSON.stringify({aggregateRatio,frameComparisons}));
      const absoluteFrameBudgetMs=1000/30;
      const performancePass=frameComparisons.every(row=>row.ratio<=1.1&&row.afterMs<=absoluteFrameBudgetMs)&&aggregateRatio<.75;
      if(contextCalls!==1||bitmapAttempts.filter(src=>src.endsWith('.svg')).length!==beforeSVG)throw Error('Measured road draws rebuilt shared resources');
      return {passed:true,performancePass,aggregateRatio,frameComparisons,frameSamples:rows,pixelComparisons,screens,viewportChecks,
        preparedSVGs:svg.length,rasterPixels,absoluteFrameBudgetMs,reflectionBlursPerFrame:1,warmDraws:120,pausedPixels:true,displayContexts:contextCalls,
        preservedMirrorFilter:'blur(2.3px)',limitation:'Real Chromium loader/cache validation; owner device FPS remains unmeasured.'};
    })()`});
    if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
    assert(result.result.value?.passed);
    const {screens,...report}=result.result.value;
    console.log(JSON.stringify(report));
    if(process.env.BITMAP_FRAME_REPORT) {
      const directory=path.dirname(process.env.BITMAP_FRAME_REPORT);fs.mkdirSync(directory,{recursive:true});
      for(const screen of screens)fs.writeFileSync(path.join(directory,screen.name+'-'+screen.mode+'.webp'),
        Buffer.from(screen.webp,'base64'));
      fs.writeFileSync(process.env.BITMAP_FRAME_REPORT,JSON.stringify(report,null,2)+'\n');
    }
    // Keep a compact visual review in the job log as well as the artifact.
    // This is an offline diagnostic Canvas, independent of the display owner.
    const {createCanvas,loadImage}=require('@napi-rs/canvas');
    const sheet=createCanvas(1920,frameReviewCount(screens)*390),paint=sheet.getContext('2d');
    paint.fillStyle='#0b141b';paint.fillRect(0,0,sheet.width,sheet.height);
    for(let i=0;i<screens.length;i++) {
      const screen=screens[i],column=['vector','bitmap','raster'].indexOf(screen.mode),row=Math.floor(i/3);
      paint.fillStyle='#d4f4df';paint.font='16px sans-serif';
      paint.fillText(screen.name+' — '+['pre-180','PR180','raster repair'][column],column*640+12,row*390+22);
      paint.drawImage(await loadImage(Buffer.from(screen.webp,'base64')),column*640,row*390+30,640,360);
    }
    const encoded=sheet.toBuffer('image/webp',80).toString('base64');
    for(let at=0;at<encoded.length;at+=24000)
      console.log('FRAME_REVIEW '+String(at/24000).padStart(4,'0')+' '+encoded.slice(at,at+24000));
    assert(report.performancePass,'raster variants must cut PR180 frame/raster cost by 25 percent, avoid a scene regression, and fit the 30 Hz diagnostic frame budget');
    assert(report.pixelComparisons.every(row=>row.meanRGB<1),
      'one reflection blur and SVG preparation must preserve loaded production appearance within one mean RGB level');
  }finally{
    socket?.close();
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
    // Chromium can still write its profile after kill() returns. Await the
    // process and retry transient child-process locks before removing it.
    if(child&&child.exitCode===null&&child.signalCode===null) {
      const stopped=once(child,'close');
      child.kill();await stopped;
    }
    const tempRoot=path.resolve(os.tmpdir());
    if(path.dirname(path.resolve(profile))!==tempRoot||!path.basename(profile).startsWith('barcode-bitmap-'))
      throw Error('Refusing to remove a profile outside the test temporary directory');
    await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:20,retryDelay:100});
  }
}
(async()=>{await unit();await rasterUnit();if(process.argv.includes('--browser'))await browser();})().catch(e=>{console.error(e.stack);process.exitCode=1;});
