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
    assert(raster.ready);assert.equal(prepared.length,1,'raster images retain the original decoding and draw path');
    const missing=cache.cacheSidewalk;missing.image.onerror();
    assert.equal(missing.image.src,entries.cacheSidewalk.path,'one pinned failure uses the bundled SVG');
    missing.image.onload();await new Promise(setImmediate);
    assert(missing.ready);assert.equal(prepared.length,2);
    w.BARCODE.PresentationAssets.preload();assert.equal(prepared.length,2,'re-entry reuses prepared fallback art');
  }
  console.log('PASS: one SVG preparation per load, warm/pause reuse, exact source rectangles, context preservation, raster routing and graceful bitmap rejection.');
}

function budgetUnit(){
  const w={BARCODE:{}};
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../src/game/cache-road-render-budget.js'),'utf8'),{window:w});
  const owner=w.BARCODE.CacheRoadRenderBudget,budget=owner.create();
  assert.equal(budget.scale,1,'each new run begins at full detail');
  owner.observe(budget,90);owner.observe(budget,90);
  assert.equal(budget.scale,1,'one or two cold/impact frames cannot reduce detail');
  owner.observe(budget,90);assert.equal(budget.scale,.4,'sustained slow paint lowers only world sampling');
  const frozen=JSON.stringify(budget);
  for(let i=0;i<700;i++)owner.observe(budget,1,{paused:true});
  assert.equal(JSON.stringify(budget),frozen,'paused repeated paint cannot change quality');
  for(const cost of [NaN,Infinity,-1])owner.observe(budget,cost);
  assert.equal(JSON.stringify(budget),frozen,'invalid clocks cannot alter a budget');
  for(let i=0;i<599;i++)owner.observe(budget,1);
  assert.equal(budget.scale,.4,'detail recovery needs sustained spare capacity');
  owner.observe(budget,1);assert.equal(budget.scale,.5);
  for(let i=0;i<30;i++)owner.observe(budget,200);
  assert.equal(budget.scale,1/6,'background sampling stops at a finite floor with native interactive paint');
  const fresh=owner.create();assert.equal(fresh.scale,1);
  assert.equal(budget.scale,1/6,'a fresh run has independent presentation state');
  console.log('PASS: bounded adaptive world quality, cold/impact tolerance, pause freeze, clock fallback, recovery hysteresis and fresh-run independence.');
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
    'src/game/cache-road-render-budget.js','src/game/cache-road-proof.js'];
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
      let road=fs.readFileSync(path.join(root,'src/game/cache-road-proof.js'),'utf8');
      assert(road.includes('const compositeBlur=ctx.canvas?.width>0'));
      road=road.replace('const compositeBlur=ctx.canvas?.width>0',
        "const compositeBlur=window.bitmapReview.mode!=='vector'&&ctx.canvas?.width>0");
      assert(road.includes('const budgetEligible=!!budgetOwner'));
      road=road.replace('const budgetEligible=!!budgetOwner',
        "const budgetEligible=window.bitmapReview.mode==='adaptive'&&!window.bitmapReview.fullQuality&&!!budgetOwner");
      assert(road.includes("ctx.imageSmoothingQuality='low';"));
      road=road.replace("ctx.imageSmoothingQuality='low';",
        "if(window.bitmapReview.mode==='adaptive')ctx.imageSmoothingQuality='low';");
      for(const [marker,label]of [["      const live=this.state,cinema=this.cinematicPose();","begin"],["      // One opaque landscape continues beneath every roadside location.","sky"],["      // Neighboring strips sample adjacent rows of one world-fixed material.","city"],["      const groundCrest=Array.from({length:65},(_,i)=>[i*30,cityCrestY(i*30)]);","world-preparation"],["      // Road shoulders and the paint share a single curved road projection.","terrain"],["      const roadFog=ctx.createLinearGradient(0,horizon,0,horizon+170);","asphalt"],["      // Phrase paint is a road marking, not a second translucent lane overlay.","street-objects"],["      const boss=s.combat?combatPose.boss:B.CacheRoadPursuit?.boss?.(s.pursuit,{progress});","beat-and-traffic"],["      ctx.restore(); // world camera","vehicles-and-fx"],["      // A compact VFD instrument cluster leaves the original mirror and","atmosphere"],["    const far = profile(progress-reach);","mirror-start"],["    if(compositeBlur) {","mirror-scene"],["    // Only reflected scenery gets softened.","mirror-blur"],["      drawRearview(ctx, s, ['#f6adbb', '#f3b276', '#d2a4f9', '#9aefce'][section], reduced,heightSample,combatPose,crosswalkPose);","dashboard"]]) {
        assert(road.includes(marker),'phase marker '+label);
        road=road.replace(marker,"window.canvasCostMark?.("+JSON.stringify(label)+");\n"+marker);
      }
      res.setHeader('Content-Type','text/javascript');res.end(road);return;
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
      while(!window.bitmapReview||Object.values(bitmapReview.cache).some(state=>!state.ready)){
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
      const median=values=>{const v=values.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)];};
      const rows=[],assetDraw=P.draw,bitmapFactory=window.createImageBitmap;
      const originalDrawImage=ctx.drawImage;let reflectionBlurs=0;
      const inspectDrawImage=function(source,...args){
        if(source===c&&this.filter==='blur(2.3px)')reflectionBlurs++;
        return originalDrawImage.call(this,source,...args);
      };
      const framePixels=new Map(),pixelComparisons=[],qualityComparisons=[],screens=[];
      let measuredGroups={};
      const inspectAssetDraw=(key,context,args)=>{
        const group=context.filter==='none'?'plain':'filtered';
        const began=performance.now(),ok=assetDraw(key,context,args),ms=performance.now()-began;
        measuredGroups[group]=(measuredGroups[group]||0)+ms;
        measuredGroups[key]=(measuredGroups[key]||0)+ms;
        return ok;
      };
      // Draw identical moving production states in both representations.
      // A one-pixel readback flushes queued raster work into elapsed time.
      // These are controlled rendering diagnostics, not device gameplay FPS.
      for(const scene of frameReviewScenes)for(const mode of ['vector','bitmap','adaptive']) {
        bitmapReview.mode=mode;
        window.createImageBitmap=mode==='vector'?undefined:bitmapFactory;
        for(const key of svg)cache[key].bitmap=mode==='vector'?undefined:bitmaps[key];
        road.chapter=structuredClone(scene.chapter);road.state=structuredClone(scene.state);
        BARCODE.Preferences.values.reducedMotion=scene.name==='Reduced';
        // Up to nine detail transitions require three slow draws apiece.
        // Retain startup costs, then measure a full settled 16-frame window.
        // Fidelity repaint happens after that window so it cannot perturb it.
        const samples=[],startupFrames=[];
        for(let frame=0;frame<46;frame++) {
          ctx.reset();ctx.imageSmoothingQuality='high';measuredGroups={};reflectionBlurs=0;
          const stateBefore=JSON.stringify(road.state),began=performance.now();
          road.draw(ctx);const submitted=performance.now();ctx.getImageData(0,0,1,1);
          const elapsed=performance.now()-began;
          if(frame===45)console.log('FRAME_COST '+JSON.stringify({name:scene.name,mode,
            submitMs:submitted-began,flushMs:performance.now()-submitted}));
          if(JSON.stringify(road.state)!==stateBefore)throw Error('A measured draw changed gameplay');
          if(ctx.imageSmoothingQuality!=='high')throw Error('road draw leaked its sampling quality');
          if(frame>=30)samples.push(elapsed);
          else if(mode==='adaptive')startupFrames.push({frame,ms:elapsed,
            worldScale:road.renderBudget.drawnScale});
          if(frame===45) {
            const displayedPixels=ctx.getImageData(0,0,c.width,c.height).data;
            screens.push({name:scene.name,mode,webp:c.toDataURL('image/webp',.9).split(',')[1]});
            let pixels=displayedPixels;
            // Inspect reflection/resources separately from production timing.
            // Per-draw wrappers allocate and query the native context hundreds
            // of times; that diagnostic work must not enter the frame budget.
            ctx.drawImage=inspectDrawImage;P.draw=inspectAssetDraw;
            reflectionBlurs=0;measuredGroups={};ctx.reset();ctx.imageSmoothingQuality='high';
            road.draw(ctx);ctx.getImageData(0,0,1,1);
            if(reflectionBlurs!==(mode==='vector'?0:1))throw Error('reflection blur was repeated or lost');
            if(JSON.stringify(road.state)!==stateBefore||ctx.imageSmoothingQuality!=='high')
              throw Error('instrumented inspection leaked gameplay or sampling state');
            console.log('FRAME_COST '+JSON.stringify({name:scene.name,mode,diagnosticOnly:true,
              groups:Object.fromEntries(Object.entries(measuredGroups).filter(([key,value])=>value>1))}));
            ctx.drawImage=originalDrawImage;P.draw=assetDraw;
            if(mode==='adaptive') {
              const reference=framePixels.get(scene.name+'-bitmap');
              let difference=0,hudDifference=0;
              for(let i=0;i<displayedPixels.length;i++)if(i%4!==3) {
                const delta=Math.abs(displayedPixels[i]-reference[i]);difference+=delta;
                if(i<1920*164*4)hudDifference+=delta;
              }
              qualityComparisons.push({name:scene.name,worldScale:road.renderBudget.drawnScale,
                meanRGB:difference/(1920*1080*3),nativeHUDMeanRGB:hudDifference/(1920*164*3)});
              // Verify unchanged native geometry/art at full quality as well
              // as reviewing the actual adaptive output saved above.
              bitmapReview.fullQuality=true;ctx.reset();road.draw(ctx);
              pixels=ctx.getImageData(0,0,c.width,c.height).data;
              bitmapReview.fullQuality=false;
            }
            if(mode==='vector')framePixels.set(scene.name+'-vector',pixels);
            else {
              const previous=framePixels.get(scene.name+'-'+(mode==='adaptive'?'bitmap':'vector'));let total=0,max=0;
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
          p95Ms:sorted[Math.ceil(sorted.length*.95)-1],frames:samples.length,
          warmupFrames:30,startupFrames:mode==='adaptive'?startupFrames:undefined,worldScale:mode==='adaptive'?road.renderBudget.drawnScale:1,includesRasterFlush:true});
        console.log('FRAME_COST '+JSON.stringify(rows.at(-1)));
      }
      for(const key of svg)cache[key].bitmap=bitmaps[key];
      window.createImageBitmap=bitmapFactory;bitmapReview.mode='adaptive';
      const frameComparisons=frameReviewScenes.map(({name})=>{
        const previous=rows.find(row=>row.name===name&&row.mode==='bitmap');
        const after=rows.find(row=>row.name===name&&row.mode==='adaptive');
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
      BARCODE.CacheRoadBeatSurface=skin;
      // Paused repeat paint retains both the chosen detail and exact pixels.
      window.isPaused=true;ctx.reset();road.draw(ctx);
      const pausedScale=road.renderBudget.scale,pausedImage=ctx.getImageData(0,0,c.width,c.height).data;
      for(let repeat=0;repeat<5;repeat++) {
        ctx.reset();road.draw(ctx);
        const current=ctx.getImageData(0,0,c.width,c.height).data;
        if(current.some((value,index)=>value!==pausedImage[index])||road.renderBudget.scale!==pausedScale)
          throw Error('paused world sampling or pixels changed');
      }
      window.isPaused=false;
      // Flush between production phases only in this diagnostic. Queued
      // Canvas work can otherwise be charged to a later, unrelated image.
      const phaseRows=[],methods=['fill','stroke','fillRect','strokeRect','fillText','strokeText','drawImage'];
      const originals=Object.fromEntries(methods.map(name=>[name,ctx[name]]));
      let methodCosts={},phaseStart=0;
      for(const name of methods)ctx[name]=function(...args){
        const start=performance.now(),result=originals[name].apply(this,args),cost=performance.now()-start;
        const group=name+(this.globalCompositeOperation==='screen'?':screen':'')+
          (name==='drawImage'&&args[0]===c?':self':'');
        const value=methodCosts[group]||(methodCosts[group]={calls:0,ms:0});
        value.calls++;value.ms+=cost;return result;
      };
      const costMark=phase=>{
        const submitted=performance.now();ctx.getImageData(0,0,1,1);
        const now=performance.now();
        if(phase!=='begin')phaseRows.push({phase,submitMs:submitted-phaseStart,
          flushMs:now-submitted,totalMs:now-phaseStart,methods:methodCosts});
        methodCosts={};phaseStart=now;
      };
      road.chapter=structuredClone(scene.chapter);road.state=structuredClone(scene.state);
      BARCODE.Preferences.values.reducedMotion=false;
      for(let warm=0;warm<12;warm++){ctx.reset();road.draw(ctx);ctx.getImageData(0,0,1,1);}
      window.canvasCostMark=costMark;
      for(let frame=0;frame<3;frame++) {
        ctx.reset();ctx.getImageData(0,0,1,1);
        road.draw(ctx);window.canvasCostMark('hud-complete');
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      window.canvasCostMark=undefined;
      for(const name of methods)ctx[name]=originals[name];
      console.log('FRAME_COST '+JSON.stringify({name:'production-phase-costs',phaseRows}));
      // Hold the late moving scene and isolate decorative animated atlases.
      // These diagnostic suppressions never run in production or gate fidelity.
      const animatedAtlasDimensions=Object.fromEntries(['cacheFly1','cacheFly3','cacheWindWhoosh'].map(key=>
        [key,{width:cache[key].image.naturalWidth,height:cache[key].image.naturalHeight}]));
      for(const omitted of [[],['cacheFly1','cacheFly3'],['cacheWindWhoosh']]) {
        const skipped=new Set(omitted);P.draw=(key,context,args)=>skipped.has(key)||assetDraw(key,context,args);
        road.chapter=structuredClone(scene.chapter);road.state=structuredClone(scene.state);
        BARCODE.Preferences.values.reducedMotion=false;
        const costs=[];
        for(let frame=0;frame<40;frame++) {
          ctx.reset();ctx.imageSmoothingQuality='high';const begin=performance.now();road.draw(ctx);
          ctx.getImageData(0,0,1,1);if(frame>=24)costs.push(performance.now()-begin);
          road.state.progress+=road.state.speed/60;road.state.elapsedMs+=1000/60;
          road.state.musicBeatFloat+=128/60/60;road.state.musicBar=Math.floor(road.state.musicBeatFloat/4);
          await new Promise(resolve=>setTimeout(resolve,0));
        }
        console.log('FRAME_COST '+JSON.stringify({name:'animated-atlas-isolation',omitted,
          medianMs:median(costs),worldScale:road.renderBudget.drawnScale,animatedAtlasDimensions}));
      }
      P.draw=assetDraw;
      const viewportChecks=[];ctx.drawImage=inspectDrawImage;
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
        preparedSVGs:svg.length,qualityComparisons,absoluteFrameBudgetMs,reflectionBlursPerFrame:1,warmDraws:120,pausedPixels:true,displayContexts:contextCalls,
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
      const screen=screens[i],column=['vector','bitmap','adaptive'].indexOf(screen.mode),row=Math.floor(i/3);
      paint.fillStyle='#d4f4df';paint.font='16px sans-serif';
      paint.fillText(screen.name+' — '+['pre-180','PR180','adaptive world'][column],column*640+12,row*390+22);
      paint.drawImage(await loadImage(Buffer.from(screen.webp,'base64')),column*640,row*390+30,640,360);
    }
    const encoded=sheet.toBuffer('image/webp',80).toString('base64');
    for(let at=0;at<encoded.length;at+=24000)
      console.log('FRAME_REVIEW '+String(at/24000).padStart(4,'0')+' '+encoded.slice(at,at+24000));
    assert(report.performancePass,'adaptive world painting must cut PR180 frame/raster cost by 25 percent, avoid a scene regression, and fit the 30 Hz diagnostic frame budget');
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
(async()=>{await unit();budgetUnit();if(process.argv.includes('--browser'))await browser();})().catch(e=>{console.error(e.stack);process.exitCode=1;});
