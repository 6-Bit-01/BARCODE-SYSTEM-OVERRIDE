// Run complete production world/HUD draws, not isolated atlas draws. Kept
// self-contained so the same audit runs in the VM and real Chromium fixture.
module.exports=function auditAnimationRoutes({B,ctx,newState,entities,definitions}) {
  const road=B.CacheRoadProof,originalState=road.state;
  const originalAssetsDraw=B.PresentationAssets.draw;
  const originalReduced=B.Preferences?.values?.reducedMotion;
  B.Preferences??={values:{}};B.Preferences.values??={};
  B.Preferences.values.reducedMotion=false;
  const coverage={main:{},mirror:{}},cases=[];
  let current,recording=true;
  const check=(value,message)=>{if(!value)throw Error(message);};
  const remember=(scope,key,frame)=>{
    const frames=coverage[scope][key]??=new Set();frames.add(frame);
  };
  B.PresentationAssets.draw=(key,target,options={})=>{
    const definition=definitions[key];
    const drawn=originalAssetsDraw(key,target,options);
    if(recording&&drawn&&definition?.frames>1) {
      const frame=options.frame??0;
      check(Number.isInteger(frame)&&frame>=0&&frame<definition.frames,
        `Invalid live animation cel: ${key}/${frame}`);
      remember(target.filter==='blur(2.3px)'?'mirror':'main',key,frame);
      if(current)current.push([key,frame]);
    }
    return drawn;
  };
  const render=(label,progress,elapsedMs,extra={})=>{
    road.state={...newState({progress,musicBar:40}),elapsedMs,
      musicBeatFloat:160+elapsedMs/468.75,...extra};
    current=[];road.draw(ctx);cases.push({label,progress,elapsedMs});
    const result=current;current=null;return result;
  };
  const candidates=(predicate)=>entities.STREET_ITEMS.filter(record=>
    record.item.at>400&&record.item.at<14000&&predicate(record.item));
  const exerciseActor=(label,records,period,count)=>{
    check(records.length,`${label} has no live world placements`);
    // Both banks use the same route. Choosing a source on each bank catches
    // one-sided culling/placement regressions and preserves authored facing.
    const selections=[-1,1].map(side=>records.find(record=>record.scene.side===side)).filter(Boolean);
    for(const record of selections)for(const camera of ['main','mirror'])
      for(let cel=0;cel<count;cel++)render(`${label}/${camera}`,
        record.item.at+(camera==='main'?-250:150),cel*period);
  };
  try {
    for(const id of [5,7,11,12,...Array.from({length:12},(_,i)=>i+15)])
      exerciseActor(`person-${id}`,candidates(item=>item.id===id),
        id===11?170:id===5?220:210,id===12?8:4);
    for(const [id,period] of [[6,200],[8,320],[9,240],[10,230],[13,380],[14,250]])
      exerciseActor(`activity-${id}`,candidates(item=>item.id===id),period,4);
    const propKeys=Object.keys(definitions).filter(key=>
      (key.startsWith('cacheNew')||key==='cacheStreetDataKiosk')&&definitions[key].frames>1);
    for(const key of propKeys)
      exerciseActor(key,candidates(item=>item.key===key),310,definitions[key].frames);
    for(const key of Object.keys(definitions).filter(key=>key.startsWith('cacheAmbient'))) {
      const family=key.slice('cacheAmbient'.length).toLowerCase();
      const plate=entities.AMBIENT_PLATES.find(plate=>plate.family===family&&plate.at>400);
      check(plate,`${key} has no live eligible frontage`);
      for(const camera of ['main','mirror'])for(let cel=0;cel<4;cel++)
        render(`${key}/${camera}`,plate.at+(camera==='main'?-300:150),cel*230);
    }
    for(const kind of ['freight','van','audit','sweeper','trike','shuttle']) {
      const hazard=entities.HAZARDS.find(hazard=>hazard.kind===kind);
      check(hazard,`${kind} has no live traffic placement`);
      for(const camera of ['main','mirror'])for(let cel=0;cel<8;cel++)
        render(`${kind}/${camera}`,hazard.at+(camera==='main'?-85:85),cel/(.054*.11));
    }
    for(let cel=0;cel<8;cel++)render('rival',11000,cel/(.054*.11),{musicBar:80});
    for(const steer of [-1,0,1])render('Cache steering',1200,890,{steer});
    for(let cel=0;cel<8;cel++)render('Cache impact',1200,cel*82,{stumbleMs:650-cel*82});
    for(let action=0;action<4;action++)for(let cel=0;cel<8;cel++)
      render('action confirmation',1200,cel*82,{pulseFlashMs:650-cel*82,
        pulseFlashAction:action,pulseFlashLane:action});
    for(const extra of [{},{pulseFlashMs:350},{boostMs:400},{cutFlashMs:300},
      {stumbleMs:350},{integrity:1}])render('mirror expression',1200,420,extra);
    for(let cel=0;cel<122;cel++)render('sky traffic',1200,cel*40);
    const intentionalStable=['cacheCar','cacheCarLeft','cacheCarRight'];
    const inventory=Object.entries(definitions).filter(([key,entry])=>
      key.startsWith('cache')&&entry.frames>1);
    for(const [key,entry] of inventory) {
      const frames=coverage.main[key]??new Set();
      const expected=intentionalStable.includes(key)?1:entry.frames;
      check(frames.size===expected,`${key}: actual world/HUD drew ${frames.size}/${expected} cels`);
      if(key.endsWith('Travel')||key.endsWith('Activity')||
          key.startsWith('cacheAmbient')||propKeys.includes(key)||
          ['cacheFreight','cacheCourier','cacheAudit','cacheSweeper',
            'cacheTrike','cacheShuttle'].includes(key))
        check(coverage.mirror[key]?.size===entry.frames,
          `${key}: rearview did not play every authored cel`);
    }
    // Reduced Motion freezes decorative clocks while reaction expressions
    // remain state-driven. This must not turn on hidden secondary loops.
    recording=false;B.Preferences.values.reducedMotion=true;
    const reducedAt=clock=>{
      const result=[];
      B.PresentationAssets.draw=(key,target,options={})=>{
        if(definitions[key]?.frames>1)result.push([key,options.frame??0]);
        return originalAssetsDraw(key,target,options);
      };
      render('reduced motion',1200,clock);return result;
    };
    check(JSON.stringify(reducedAt(0))===JSON.stringify(reducedAt(1234)),
      'Reduced Motion advanced an animation');
    return {productionDraws:cases.length,animatedKeys:inventory.length,
      intentionalStable,main:Object.fromEntries(Object.entries(coverage.main)
        .map(([key,frames])=>[key,[...frames].sort((a,b)=>a-b)])),
      mirror:Object.fromEntries(Object.entries(coverage.mirror)
        .map(([key,frames])=>[key,[...frames].sort((a,b)=>a-b)])),
      reducedMotion:true};
  } finally {
    B.PresentationAssets.draw=originalAssetsDraw;road.state=originalState;
    B.Preferences.values.reducedMotion=originalReduced;
  }
};
