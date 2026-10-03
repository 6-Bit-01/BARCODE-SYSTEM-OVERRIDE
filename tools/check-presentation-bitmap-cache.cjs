// Loader lifecycle checks plus real Chromium verification of prepared SVG reuse.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.resolve(__dirname,'../src/engine/presentation-assets.js'),'utf8');
const inspected=source.replace('  const cache = {};','  const cache = {};window.bitmapReview={entries,cache};');
async function unit(){
  for(const failure of ['none','reject','throw','invalid']){
    const images=[],prepared=[],closed=[];
    class Image {constructor(){this.naturalWidth=1024;this.naturalHeight=512;images.push(this);}}
    const w={Image,BARCODE:{},createImageBitmap(image){
      prepared.push(image);
      if(failure==='throw')throw Error('unsupported');
      if(failure==='reject')return Promise.reject(Error('unsupported'));
      return Promise.resolve({width:failure==='invalid'?0:image.naturalWidth,height:image.naturalHeight,
        image,close(){closed.push(this);}});
    },context={window:w};
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
    assert(raster.ready);assert.equal(prepared.length,1,'existing raster sheets stay on their original path');
    const missing=cache.cacheSidewalk;missing.image.onerror();
    assert.equal(missing.image.src,entries.cacheSidewalk.path,'one pinned failure uses the bundled SVG');
    missing.image.onload();await new Promise(setImmediate);
    assert(missing.ready);assert.equal(prepared.length,2);
    w.BARCODE.PresentationAssets.preload();assert.equal(prepared.length,2,'re-entry reuses prepared fallback art');
  }
  console.log('PASS: one SVG preparation per load, warm/pause reuse, exact source rectangles, context preservation, raster routing and graceful bitmap rejection.');
}
async function browser(){
  const http=require('node:http'),os=require('node:os'),{spawn}=require('node:child_process'),{once}=require('node:events');
  const root=path.resolve(__dirname,'..'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'barcode-bitmap-'));
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
    window.createImageBitmap=(image)=>{bitmapAttempts.push(image.src);return bitmap(image);};
  </script><script src="/registry.js"></script>`;
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    if(pathname==='/'){res.setHeader('Content-Type','text/html');res.end(fixture);return;}
    if(pathname==='/registry.js'){res.setHeader('Content-Type','text/javascript');res.end(inspected);return;}
    const file=path.resolve(root,'.'+pathname);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',pathname.endsWith('.svg')?'image/svg+xml':pathname.endsWith('.webp')?'image/webp':'image/png');
    fs.createReadStream(file).pipe(res);
  });
  try{
    server.listen(0,'127.0.0.1');await once(server,'listening');
    const origin='http://127.0.0.1:'+server.address().port;
    child=spawn(chromePath,['--headless=new','--no-sandbox','--disable-dev-shm-usage','--no-first-run',
      '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
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
      if(p){pending.delete(value.id);clearTimeout(p.timeout);value.error?p.reject(Error(JSON.stringify(value.error))):p.resolve(value.result);}});
    const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;
      const timeout=setTimeout(()=>{pending.delete(id);reject(Error(method+' timeout'));},60000);
      pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});
    await send('Page.enable');await send('Runtime.enable');await send('Page.navigate',{url:origin});
    const result=await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{
      const started=performance.now();
      while(!window.bitmapReview||Object.values(bitmapReview.cache).some(state=>!state.ready)){
        if(performance.now()-started>45000)throw Error('assets did not prepare');await new Promise(r=>setTimeout(r,25));
      }
      const {entries,cache}=bitmapReview,svg=Object.keys(entries).filter(key=>entries[key].path.endsWith('.svg'));
      if(svg.some(key=>!(cache[key].bitmap instanceof ImageBitmap)))throw Error('SVG bitmap preparation failed');
      if(bitmapAttempts.length!==svg.length)throw Error('SVG preparations were duplicated or raster sheets prepared');
      const c=document.getElementById('gameCanvas'),ctx=c.getContext('2d'),P=BARCODE.PresentationAssets;
      const before=bitmapAttempts.length,pixels=[];
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
      P.preload();if(bitmapAttempts.length!==before)throw Error('warm draws or preload rebuilt the cache');
      if(contextCalls!==1)throw Error('display Canvas ownership changed');
      return {passed:true,preparedSVGs:svg.length,warmDraws:120,pausedPixels:true,displayContexts:contextCalls,
        preservedMirrorFilter:'blur(2.3px)',limitation:'Real Chromium loader/cache validation; owner device FPS remains unmeasured.'};
    })()`});
    if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
    assert(result.result.value?.passed);console.log(JSON.stringify(result.result.value));
  }finally{
    socket?.close();child?.kill();server.close();fs.rmSync(profile,{recursive:true,force:true});
  }
}
(async()=>{await unit();if(process.argv.includes('--browser'))await browser();})().catch(e=>{console.error(e.stack);process.exitCode=1;});
