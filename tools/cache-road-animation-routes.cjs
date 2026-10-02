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
    const mirrorOwner=B.CacheRoadMirror;
    check(mirrorOwner,'Sustained mirror owner was not loaded');
    for(const [frame,extra] of [{},{pulseFlashMs:350},{boostMs:400},{cutFlashMs:300},
      {stumbleMs:350},{integrity:1}].entries()) {
      const mirrorState=mirrorOwner.create();
      mirrorOwner.step(mirrorState,450,extra);
      const calls=render(`diagnostic settled mirror expression ${frame}`,1200,420,{...extra,mirrorState});
      check(calls.some(([key,cel])=>key==='cacheMirror'&&cel===frame),
        `Production mirror missed owner-selected expression ${frame}`);
    }
    for(const passSide of [-1,1])render('painted passing whoosh',1200,420,{passFlashMs:780,passSide});
    for(let cel=0;cel<122;cel++)render('sky traffic',1200,cel*40);
    // Diagnostic production-state coverage, separate from the earned input
    // race gate: the actual Pursuit owner creates and counters each attack.
    // Only the rig's road address is staged to inspect each camera's draw.
    const pursuitOwner=B.CacheRoadPursuit;
    check(pursuitOwner&&B.CacheRoadBossArt,'Pursuit art owners were not loaded');
    const clone=value=>JSON.parse(JSON.stringify(value));
    const pursuit=pursuitOwner.create({version:3,barFloat:72});
    const pursuitCases=[];let pursuitProgress=1200,pursuitBar=72;
    const stepPursuit=(bar,dt=100,lane=1,next=pursuitProgress)=>{
      const events=pursuitOwner.step(pursuit,{before:pursuitProgress,progress:next,
        barFloat:bar,dt,lane,difficultyId:'standard',actors:[],protectedPulses:[]});
      pursuitProgress=next;pursuitBar=bar;return events;
    };
    const capturePursuit=(frame,impact)=>pursuitCases.push({frame,impact,
      pursuit:clone(pursuit),progress:pursuitProgress,bar:pursuitBar});
    const lockPursuit=bar=>{for(let i=0;i<5;i++)stepPursuit(bar);};
    const counterPursuit=bar=>{
      const events=stepPursuit(bar,20,3,pursuit.actor.at+1);
      const impact=events.find(event=>event.type==='boss-counter');
      check(impact,`Diagnostic pursuit at bar ${bar} did not counter its actual attack`);
      return impact;
    };
    stepPursuit(72,20);capturePursuit(0);
    lockPursuit(76);capturePursuit(1);
    capturePursuit(2,counterPursuit(77));
    lockPursuit(80);capturePursuit(3);
    capturePursuit(4,counterPursuit(81));
    for(let i=0;i<11;i++)stepPursuit(81);
    capturePursuit(5);
    lockPursuit(84);capturePursuit(6);
    capturePursuit(7,counterPursuit(85));
    for(const fixture of pursuitCases)for(const camera of ['main','mirror']) {
      const staged=clone(fixture.pursuit),clock=1000+fixture.frame*100;
      staged.boss.rigAt=fixture.progress+(camera==='main'?230:-140);
      const calls=render(`diagnostic pursuit pose-${fixture.frame}/${camera}`,
        fixture.progress,clock,{pursuit:staged,musicBar:fixture.bar,
          musicBeatFloat:fixture.bar*4,...(camera==='main'&&fixture.impact?
            {bossImpact:{...fixture.impact,atMs:clock-50}}:{})});
      check(calls.some(([key,frame])=>key==='cachePursuitRig'&&frame===fixture.frame),
        `Production ${camera} missed diagnostic pursuit pose ${fixture.frame}`);
    }
    // These four atlases are mechanical poses/components, not autonomous
    // legacy animation clocks. The focused combat-art gate checks their pure
    // contracts and native source integrity; this fixture additionally sends
    // every pose through the actual Combat view owner and full road painter.
    // These explicitly staged diagnostic states are not earned race evidence.
    const authoredCombatKeys=['cacheCombatBike','cacheCombatHostiles',
      'cacheCombatBikeCrash','cacheCombatBlast','cacheCombatFX'];
    const combatOwner=B.CacheRoadCombat;
    check(combatOwner&&B.CacheRoadCombatArt,'Authored combat owners were not loaded');
    const combatCases=[
      {kind:'bike',phase:'approach',frame:0},
      {kind:'bike',phase:'windup',attackLane:0,frame:1},
      {kind:'bike',phase:'windup',attackLane:2,frame:2},
      {kind:'bike',phase:'attack',frame:3},
      {kind:'bike',phase:'recover',frame:4},
      {kind:'bike',phase:'stunned',frame:5},
      {kind:'bike',phase:'approach',hp:1,frame:6},
      {kind:'bike',wreck:true,ageMs:2000,frame:7},
      ...['rammer','escort','disruptor'].flatMap((kind,index)=>[
        {kind,phase:'approach',frame:index*4},
        {kind,phase:'attack',frame:index*4+1},
        {kind,phase:'stunned',hp:1,frame:index*4+2},
        {kind,wreck:true,ageMs:2000,frame:index*4+3}]),
      ...[150,800,1400,2000].map((ageMs,index)=>({kind:'bike',wreck:true,ageMs,
        crashFrame:index<3?index:null,riderFrame:index===0?3:index===3?5:4})),
      ...Array.from({length:6},(_,blastFrame)=>({kind:'bike',wreck:true,
        ageMs:blastFrame*1900/6+1,blastFrame}))
    ];
    for(const [index,fixture] of combatCases.entries())for(const camera of ['main','mirror']) {
      const progress=1200,clock=2000+index*100;
      const combat=combatOwner.create({difficultyId:'standard'});
      combat.lastProgress=progress;combat.lastBar=40;combat.elapsedMs=clock;
      const maxHp=fixture.kind==='bike'?2:3;
      const actor={id:`foe-art-${index}`,kind:fixture.kind,
        at:progress+(camera==='main'?150:-140),lane:1,
        hp:fixture.hp??maxHp,maxHp,ageMs:fixture.ageMs??clock,
        phase:fixture.phase??'approach',phaseMs:0,
        attackLane:fixture.attackLane??1,attackKind:fixture.kind==='bike'?'kick':'ram'};
      if(fixture.wreck)combat.wrecks.push({...actor,rollMs:1600,
        flip:true,rider:fixture.kind==='bike'});
      else combat.enemies.push(actor);
      const calls=render(`diagnostic combat ${fixture.kind}-${index}/${camera}`,
        progress,clock,{combat,pursuit:null,musicBar:40,musicBeatFloat:160});
      const contains=(key,frame)=>calls.some(([k,f])=>k===key&&f===frame);
      if(fixture.frame!==undefined)check(contains(fixture.kind==='bike'?
        'cacheCombatBike':'cacheCombatHostiles',fixture.frame),
        `Production ${camera} missed diagnostic ${fixture.kind} pose ${fixture.frame}`);
      if(fixture.crashFrame!==undefined&&fixture.crashFrame!==null)
        check(contains('cacheCombatBikeCrash',fixture.crashFrame),
          `Production ${camera} missed actual bike crash age ${fixture.ageMs}`);
      if(fixture.riderFrame!==undefined)check(contains('cacheCombatBikeCrash',fixture.riderFrame),
        `Production ${camera} missed detached rider age ${fixture.ageMs}`);
      if(fixture.blastFrame!==undefined)check(contains('cacheCombatBlast',fixture.blastFrame),
        `Production ${camera} missed real-age blast cell ${fixture.blastFrame}`);
    }
    for(const fixture of [
      {frame:0,shot:true,friendly:true},{frame:1,shot:true,friendly:false},
      {frame:2,shot:true,friendly:true,kind:'reflected'},
      {frame:3,type:'muzzle',age:0},{frame:4,type:'impact',age:0},
      {frame:5,type:'impact',age:100},{frame:6,type:'impact',age:200},
      {frame:7,type:'impact',age:300},{frame:8,type:'ram',age:0},
      {frame:9,type:'ram',age:150},{frame:10,type:'disrupt',age:0},
      {frame:11,type:'impact',age:375}]) {
      const combat=combatOwner.create();
      if(fixture.shot)combat.projectiles.push({id:'diagnostic-shot',at:1060,lane:1,
        friendly:fixture.friendly,kind:fixture.kind||'shot',ageMs:0});
      const calls=render(`diagnostic physical projectile/contact FX ${fixture.frame}`,1000,1000,
        {combat,pursuit:null,combatFx:fixture.shot?[]:[{type:fixture.type,at:1060,lane:1,
          atMs:1000-fixture.age,duration:400}]});
      check(calls.some(([key,frame])=>key==='cacheCombatFX'&&frame===fixture.frame),
        `Production world missed projectile/contact FX cell ${fixture.frame}`);
    }
    // The new feedback atlases use physical contact age and crew identity,
    // not autonomous clocks. Produce pedestrian and rider contacts through
    // their real owners, then stage camera addresses only for visual route
    // diagnostics. These draws do not claim an earned-input race.
    const authoredFeedbackKeys=['cacheBloodSplatter','cacheCrewCallouts'];
    const crossingOwner=B.CacheRoadCrosswalks,crewOwner=B.CacheRoadCrewCallouts;
    check(crossingOwner&&crewOwner,'Pedestrian/crew feedback owners were not loaded');
    const crossings=crossingOwner.create({progress:1000,bar:0}),pedestrianCases=[];
    for(const [bar,at] of [[10,1200],[30,2000]]) {
      crossingOwner.commit(crossings,{beat:bar*4,from:at-300});
      // Hold a real approaching crossing outside contact until the two
      // walkers reach Cache's lane. The final sweep hits both actual bodies.
      for(let i=0;i<18;i++)crossingOwner.step(crossings,250,
        {before:at-200,progress:at-200,lanePos:1.5,previousLanePos:1.5,speed:52,bar});
      const events=crossingOwner.step(crossings,1,
        {before:at-10,progress:at+10,lanePos:1.5,previousLanePos:1.5,speed:52,bar});
      check(events.length===2&&events.every(event=>event.type==='pedestrian-hit'),
        `Diagnostic crosswalk ${bar} did not physically hit both walkers`);
      crossingOwner.step(crossings,79,
        {before:at+10,progress:at+10,lanePos:1.5,previousLanePos:1.5,speed:52,bar});
      pedestrianCases.push({at,events,crosswalks:clone(crossings)});
    }
    for(const fixture of pedestrianCases)for(const camera of ['main','mirror']) {
      const progress=fixture.at+(camera==='main'?-150:140);
      const calls=render(`diagnostic physical pedestrian blood/${camera}`,progress,5000,
        {crosswalks:clone(fixture.crosswalks)});
      for(const frame of [0,1,3,4])check(calls.some(([key,cel])=>key==='cacheBloodSplatter'&&cel===frame),
        `Production ${camera} missed physical pedestrian blood cell ${frame}`);
    }
    for(const event of pedestrianCases.flatMap(fixture=>fixture.events).slice(0,3)) {
      const feedback={crosswalkToast:null,crosswalkMessages:[],crosswalkCalloutIds:[]};
      check(crewOwner.enqueue(feedback,event),'Real pedestrian contact did not enqueue crew feedback');
      const frame=(event.hitCount-1)%3;
      const calls=render(`diagnostic physical-contact crew portrait ${frame}`,1200,5000,feedback);
      check(calls.some(([key,cel])=>key==='cacheCrewCallouts'&&cel===frame),
        `Production HUD missed crew portrait ${frame}`);
    }
    const riderCombat=combatOwner.create();
    riderCombat.lastProgress=1190;riderCombat.lastLanePos=1.34;
    riderCombat.wrecks.push({id:'foe-0',kind:'bike',at:1200,lane:1,hp:0,maxHp:2,
      ageMs:2400,rollMs:1600,flip:true,rider:true,riderSplatAtMs:null});
    const riderEvents=combatOwner.step(riderCombat,1,{progress:1210,lanePos:1.34,bar:40});
    check(riderEvents.some(event=>event.type==='rider-splatter'),
      'Diagnostic rider did not receive actual grounded swept contact');
    combatOwner.step(riderCombat,79,{progress:1210,lanePos:1.34,bar:40});
    for(const camera of ['main','mirror']) {
      const at=riderCombat.wrecks[0].at,progress=at+(camera==='main'?-150:140);
      const calls=render(`diagnostic physical rider blood/${camera}`,progress,5000,
        {combat:clone(riderCombat),pursuit:null});
      for(const frame of [2,5])check(calls.some(([key,cel])=>key==='cacheBloodSplatter'&&cel===frame),
        `Production ${camera} missed physical rider blood cell ${frame}`);
    }
    const intentionalStable=['cacheCar','cacheCarLeft','cacheCarRight'];
    const inventory=Object.entries(definitions).filter(([key,entry])=>
      key.startsWith('cache')&&entry.frames>1);
    for(const [key,entry] of inventory) {
      const frames=coverage.main[key]??new Set();
      const expected=intentionalStable.includes(key)?1:entry.liveFrames?.length||entry.frames;
      if(entry.liveFrames)check(JSON.stringify([...frames].sort((a,b)=>a-b))===JSON.stringify(entry.liveFrames),
        `${key}: live variant atlas must draw every intended effect and no reserved source cel`);
      check(frames.size===expected,`${key}: actual world/HUD drew ${frames.size}/${expected} cels`);
      if(key.endsWith('Travel')||key.endsWith('Activity')||
          key.startsWith('cacheAmbient')||propKeys.includes(key)||
          ['cacheFreight','cacheCourier','cacheAudit','cacheSweeper',
            'cacheTrike','cacheShuttle','cachePursuitRig','cacheBloodSplatter',
            ...authoredCombatKeys.filter(key=>key!=='cacheCombatFX')].includes(key))
        check(coverage.mirror[key]?.size===entry.frames,
          `${key}: rearview did not play every authored cel`);
    }
    check(!coverage.mirror.cacheCrewCallouts,'Crew portraits must remain in the main HUD outside reflected scenery');
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
      legacyAnimatedKeys:inventory.length-authoredCombatKeys.length-authoredFeedbackKeys.length,
      authoredCombatKeys,authoredFeedbackKeys,
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
