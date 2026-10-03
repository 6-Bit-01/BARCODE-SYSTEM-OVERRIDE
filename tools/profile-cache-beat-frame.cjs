// Diagnostic production draws with loaded art; timings describe the runner, not a player's device.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const {createCanvas,GlobalFonts,loadImage}=require('@napi-rs/canvas');
const {nativeAssets,prepared,stage}=require('./render-cache-beat-visual-system.cjs');
const root=path.resolve(__dirname,'..');process.chdir(root);
const median=values=>{const v=values.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)];};
async function main(){
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const assets=await nativeAssets(),images={...assets.images},bitmapKeys=[];
  // This native fixture mirrors Chromium's one-time createImageBitmap path.
  // Production loader reuse and ownership are independently checked in Chromium.
  for(const [key,entry] of Object.entries(assets.entries))if(images[key]&&entry.path.endsWith('.svg')){
    const image=images[key],c=createCanvas(image.naturalWidth,image.naturalHeight);
    c.getContext('2d').drawImage(image,0,0);images[key]=await loadImage(c.toBuffer('image/png'));bitmapKeys.push(key);
  }
  const bitmapAssets={...assets,images},canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
  const results=[],pixelReferences=new Map(),pixelComparisons=[];
  for(const name of ['Approach','Ready-ONE','Perfect-Impact','Good','Miss','Reduced','Focused-Turn']){
    for(const {skin,mode} of [{skin:true,mode:'vector'},{skin:true,mode:'bitmap'},{skin:false,mode:'vector'}]){
      const r=prepared(mode==='bitmap'?bitmapAssets:assets),s=stage(r,name),B=r.B;
      if(!skin)B.CacheRoadBeatSurface=undefined;
      let current,groups,counts;
      const draw=B.PresentationAssets.draw;
      B.PresentationAssets.draw=(key,c,args)=>{
        const start=performance.now(),ok=draw(key,c,args),elapsed=performance.now()-start;
        const group=key.startsWith('cacheBeat')?'beat-art':c.filter!=='none'?'filtered-art':'other-art';
        groups[group]=(groups[group]||0)+elapsed;counts[group]=(counts[group]||0)+1;
        groups[key]=(groups[key]||0)+elapsed;
        return ok;
      };
      const H=B.CacheRoadBeatFeedback;
      B.CacheRoadBeatFeedback={...H};
      for(const method of ['drawPad','drawTarget','drawReceipt'])
        B.CacheRoadBeatFeedback[method]=(...args)=>{
          const start=performance.now(),ok=H[method](...args);
          groups[method]=(groups[method]||0)+performance.now()-start;return ok;
        };
      const samples=[];
      for(let i=0;i<10;i++){
        ctx.reset();groups={};counts={};
        const before=JSON.stringify(s),start=performance.now();r.road.draw(ctx);
        current=performance.now()-start;
        assert.equal(JSON.stringify(s),before,'a timed production draw must not advance gameplay');
        samples.push({ms:current,groups:{...groups},counts:{...counts}});
        if(i===2&&skin){
          const pixels=Buffer.from(ctx.getImageData(0,0,canvas.width,canvas.height).data);
          if(mode==='vector')pixelReferences.set(name,pixels);
          else{
            const reference=pixelReferences.get(name);let total=0,max=0,changed=0;
            for(let at=0;at<pixels.length;at++)if(at%4!==3){
              const d=Math.abs(pixels[at]-reference[at]);total+=d;max=Math.max(max,d);if(d)changed++;
            }
            const meanRGB=total/(canvas.width*canvas.height*3);
            assert(meanRGB<.5,'bitmap preparation must preserve the loaded production appearance');
            pixelComparisons.push({name,meanRGB,maxChannelDifference:max,changedChannels:changed});
          }
        }
        s.elapsedMs+=16.667;
      }
      const warm=samples.slice(2);
      const row={name,skin,mode,coldMs:samples[0].ms,medianMs:median(warm.map(x=>x.ms)),
        p95Ms:Math.max(...warm.map(x=>x.ms)),
        groups:Object.fromEntries([...new Set(warm.flatMap(x=>Object.keys(x.groups)))]
          .map(k=>[k,median(warm.map(x=>x.groups[k]||0))])),
        counts:warm.at(-1).counts};
      results.push(row);console.log(JSON.stringify(row));
    }
  }
  const improvements=['Approach','Ready-ONE','Perfect-Impact','Good','Miss','Reduced','Focused-Turn'].map(name=>{
    const before=results.find(r=>r.name===name&&r.skin&&r.mode==='vector'),after=results.find(r=>r.name===name&&r.skin&&r.mode==='bitmap');
    return {name,beforeMs:before.medianMs,afterMs:after.medianMs,ratio:after.medianMs/before.medianMs};
  });
  assert(improvements.every(row=>row.ratio<.8),'every loaded production scene must cut at least 20 percent of median draw time on the same host');
  console.log(JSON.stringify({gate:'level2-svg-frame-cost',passed:true,preparedSVGs:bitmapKeys.length,improvements,pixelComparisons}));
  const report={bitmapKeys,improvements,pixelComparisons,revision:process.env.GITHUB_SHA||'local',results,
    limitation:'Loaded production Canvas diagnostics on this host; fallback runs isolate beat-art work. No device FPS or human acceptance claim.'};
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
