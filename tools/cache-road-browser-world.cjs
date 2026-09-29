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
    '  B.Campaign.register(ID,','  window.roadReviewState=newState;window.roadReviewCues={PULSES,pulseVisual,shiftOffset};\n  B.Campaign.register(ID,'));
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
  const liveAnimationFrames={};
  const nativeAssetDraw=B.PresentationAssets.draw;
  B.PresentationAssets.draw=(key,target,options)=>{
    if(window.roadReviewDefinitions[key]?.frames>1)
      (liveAnimationFrames[key]??=new Set()).add(options?.frame??0);
    return nativeAssetDraw(key,target,options);
  };
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
    screens.push({progress,webp:ctx.canvas.toDataURL('image/webp',.9).split(',')[1]});
  }
  // Advance the real driver and draw it in Chromium while repeatedly
  // changing gears. The controlled audio clock makes exact beat-4 frames
  // reproducible; audio scheduling is separately rendered with Web Audio.
  const actualAudio=window.audioSystem;
  window.audioSystem={context:{currentTime:0},playCombatCue(){}};
  road.selectMusicProfile();B.MusicTransport.start({sourceAnchorAudioSec:0,sourceOffsetTrackSec:0});
  road.state=window.roadReviewState();road.state.timeMs=1e6;road.state.invulnerableMs=1e6;
  const drive={frames:0,arrivals:0,maxPixelError:0,gears:[]};
  for(let frame=0;frame<=32*16;frame++) {
    const beat=frame/16,now=beat*60/128;
    window.audioSystem.context.currentTime=now;
    const actions=frame===20?{move_down:{pressed:true}}:
      frame===97||frame===170?{move_up:{pressed:true}}:
      frame===270?{move_down:{pressed:true}}:
      frame===353?{road_turbo:{pressed:true}}:{};
    road.handleActions(actions);road.update(60/128/16*1000);
    const s=road.state;
    if(drive.gears.at(-1)!==s.gear)drive.gears.push(s.gear);
    for(const pulse of window.roadReviewCues.PULSES) {
      const cue=window.roadReviewCues.pulseVisual(pulse,s);
      if(cue&&Math.abs(cue.target-beat)<1e-8) {
        const t=1-(cue.d+80)/520;
        const error=Math.abs(400+t*t*680-(400+.83*.83*680-119*.14));
        if(error>1e-6||window.roadReviewCues.shiftOffset(s,false)!==0)
          throw Error('Gear shift moved a fourth-beat pad away from the rear axle');
        drive.maxPixelError=Math.max(drive.maxPixelError,error);drive.arrivals++;
        road.draw(ctx);drive.frames++;
        screens.push({progress:`Beat-${beat}-Gear-${s.gear+1}`,webp:ctx.canvas.toDataURL('image/webp',.9).split(',')[1]});
      }
    }
    if(frame%8===0) {road.draw(ctx);drive.frames++;}
  }
  if(drive.arrivals<3||new Set(drive.gears).size!==3)throw Error('Driving review missed gears or beat targets');
  window.audioSystem=actualAudio;
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
  B.PresentationAssets.draw=nativeAssetDraw;
  const usedAnimations=Object.fromEntries(Object.entries(liveAnimationFrames)
    .map(([key,values])=>[key,[...values].sort((a,b)=>a-b)]));
  const movingWalkers=Object.entries(usedAnimations).filter(([key])=>key.endsWith('Travel'));
  if(movingWalkers.length<7||movingWalkers.some(([,values])=>values.length<2))
    throw Error('Pedestrian animation failed in the actual world draw');
  // Check pinned delivery as well as bundled files. A locally working sheet
  // is not enough for a Makko import which omits binary assets.
  const hosted=[];
  for(const key of ['cacheSweeper',...keys.filter(key=>key.endsWith('Travel'))]) {
    const definition=window.roadReviewDefinitions[key];
    const response=await fetch(definition.root+definition.path);
    if(!response.ok)throw Error(`Published animation unavailable: ${key} (${response.status})`);
    const remote=await response.arrayBuffer(),local=await (await fetch('/'+definition.path)).arrayBuffer();
    const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)))
      .map(n=>n.toString(16).padStart(2,'0')).join('');
    if(await digest(remote)!==await digest(local))throw Error(`Published animation differs: ${key}`);
    hosted.push({key,bytes:remote.byteLength});
  }
  return {loadedAssets:keys.length,frames,animations,usedAnimations,drive,hosted,screens,contextCalls:window.contextCalls};
};
