// Diagnostic production draws with loaded art; timings describe the runner, not a player's device.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {performance}=require('node:perf_hooks');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const {nativeAssets,prepared,stage}=require('./render-cache-beat-visual-system.cjs');
const root=path.resolve(__dirname,'..');process.chdir(root);
const median=values=>{const v=values.slice().sort((a,b)=>a-b);return v[Math.floor(v.length/2)];};
async function main(){
  GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
  const assets=await nativeAssets(),canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
  const results=[];
  for(const name of ['Approach','Ready-ONE','Perfect-Impact','Good','Miss','Reduced','Focused-Turn']){
    for(const skin of [true,false]){
      const r=prepared(assets),s=stage(r,name),B=r.B;
      if(!skin)B.CacheRoadBeatSurface=undefined;
      let current,groups,counts;
      const draw=B.PresentationAssets.draw;
      B.PresentationAssets.draw=(key,c,args)=>{
        const start=performance.now(),ok=draw(key,c,args),elapsed=performance.now()-start;
        const group=key.startsWith('cacheBeat')?'beat-art':c.filter!=='none'?'filtered-art':'other-art';
        groups[group]=(groups[group]||0)+elapsed;counts[group]=(counts[group]||0)+1;
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
        s.elapsedMs+=16.667;
      }
      const warm=samples.slice(2);
      const row={name,skin,coldMs:samples[0].ms,medianMs:median(warm.map(x=>x.ms)),
        p95Ms:Math.max(...warm.map(x=>x.ms)),
        groups:Object.fromEntries([...new Set(warm.flatMap(x=>Object.keys(x.groups)))]
          .map(k=>[k,median(warm.map(x=>x.groups[k]||0))])),
        counts:warm.at(-1).counts};
      results.push(row);console.log(JSON.stringify(row));
    }
  }
  const report={revision:process.env.GITHUB_SHA||'local',results,
    limitation:'Loaded production Canvas diagnostics on this host; fallback runs isolate beat-art work. No device FPS or human acceptance claim.'};
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
