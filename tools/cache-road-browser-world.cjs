// Executed inside the real Chromium road/audio fixture. Image delivery is
// local; atlas metadata, scenery, canvas draw and frame selection are production.
module.exports=async function reviewRoadWorld() {
  const load=async file=>(await fetch('/'+file)).text();
  const B=window.BARCODE;
  const font=await new FontFace('Oxanium',
    'url(/assets/studies/visual-overhaul/references/fonts/Oxanium.ttf)').load();
  document.fonts.add(font);
  B.Campaign={register(){},syncTitleButton(){}};
  (0,eval)(await load('src/game/cache-road-landscape.js'));
  (0,eval)((await load('src/game/cache-road-proof.js')).replace(
    '  B.Campaign.register(ID,','  window.roadReviewState=newState;\n  B.Campaign.register(ID,'));
  (0,eval)((await load('src/engine/presentation-assets.js'))
    .replace('      if (cache[key]) continue;',"      if (cache[key]||!key.startsWith('cache')) continue;")
    .replace('image.src = (entry.root ?? root) + entry.path;','image.src = entry.path;')
    .replace('  const cache = {};','  window.roadReviewDefinitions=entries;\n  const cache = {};'));
  const keys=Object.keys(window.roadReviewDefinitions).filter(key=>key.startsWith('cache'));
  const start=performance.now();
  while(!keys.every(key=>B.PresentationAssets.ready(key))) {
    if(performance.now()-start>45000)
      throw Error('Missing road assets: '+keys.filter(key=>!B.PresentationAssets.ready(key)).join(','));
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  const road=B.CacheRoadProof,ctx=window.renderer.ctx;
  road.active=true;road.status='playing';road.audioDegraded=false;
  const nativeDraw=ctx.drawImage.bind(ctx);
  let imageCalls=0;
  ctx.drawImage=(image,...args)=>{
    if(args.some(value=>!Number.isFinite(value)))throw Error('Non-finite road image draw');
    if(args.length===8) {
      const [x,y,w,h]=args;
      if(x<0||y<0||x+w>image.width+.02||y+h>image.height+.02)
        throw Error('Road atlas crop escaped its sheet');
    }
    imageCalls++;return nativeDraw(image,...args);
  };
  const frames=[],screens=[];
  B.Preferences={values:{reducedMotion:false}};
  for(const progress of [180,2680,5160,7620]) {
    road.state=window.roadReviewState({progress,lanePos:1.5,speed:54});
    for(let frame=0;frame<24;frame++) {
      road.state.progress=progress+frame*2;
      road.state.elapsedMs=frame*100;
      road.state.musicBeatFloat=3+frame*.1;
      road.state.pulseTargets={};
      road.updateStreetMotion(100);
      const began=performance.now(),calls=imageCalls;
      road.draw(ctx);
      frames.push({progress:road.state.progress,submitMs:performance.now()-began,
        imageCalls:imageCalls-calls});
    }
    screens.push({progress,png:ctx.canvas.toDataURL('image/png').split(',')[1]});
  }
  // Every authored road animation must contain changing pixels at real cel
  // boundaries. This catches missing assets and whole-sheet rendering.
  const sheet=document.createElement('canvas');sheet.width=128;sheet.height=128;
  const celCtx=sheet.getContext('2d',{willReadFrequently:true});
  const animations={};
  for(const key of keys) {
    const definition=window.roadReviewDefinitions[key];
    if(definition.frames<=1||key.startsWith('cacheFly'))continue;
    const hashes=[];
    for(let frame=0;frame<definition.frames;frame++) {
      celCtx.clearRect(0,0,128,128);
      B.PresentationAssets.draw(key,celCtx,{x:64,y:100,width:100,height:90,frame});
      const pixels=celCtx.getImageData(0,0,128,128).data;
      let hash=2166136261;
      for(let i=0;i<pixels.length;i++)hash=Math.imul(hash^pixels[i],16777619);
      hashes.push(hash>>>0);
    }
    const distinct=new Set(hashes).size;
    if(distinct<2)throw Error(`${key} does not animate`);
    animations[key]={frames:definition.frames,distinct};
  }
  ctx.drawImage=nativeDraw;
  return {loadedAssets:keys.length,frames,animations,screens,contextCalls:window.contextCalls};
};
