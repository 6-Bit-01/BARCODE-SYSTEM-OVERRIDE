// Full 100-bar Cache Road contract using the production profile, director,
// transport, save adapter and road update. Audible quality needs owner review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRig, load } = require('./check-level-01-boss');
const copy = value => JSON.parse(JSON.stringify(value));

function parentSave() {
  return { levelId: 'level-01', checkpointId: 'intermission', levelState: {
    difficultyId: 'standard', run: { levelId: 'level-01', runId: 'road-parent', recoveryMode: 'checkpoints',
      elapsedMs: 120000, damageTaken: 1, retries: 0, attempts: 18, accurate: 14, perfect: 8,
      connected: 9, connectedPerfect: 5, completed: true },
    score: 2400, bestCombo: 8, health: 3, playerX: 3500,
    fragments: [], skyCaches: [], ampCharges: 1,
    boss: { bossX: 3480, playerX: 3500, score: 2400, skyCaches: [] }, result: { score: 2400 }
  } };
}

async function run() {
  const { w, context } = createRig();
  load(context, 'src/game/lore-collection.js');
  w.lostDataSystem.archive = new w.BARCODE.LoreCollection();
  load(context, 'src/game/campaign-services.js');
  load(context, 'src/engine/cache-road-proof-profile.js');
  load(context, 'src/engine/music-director.js');
  load(context, 'src/engine/audio.js');
  load(context, 'src/game/cache-road-landscape.js');
  const roadSource=fs.readFileSync('src/game/cache-road-proof.js','utf8');
  const sceneMarker='  const clone = value => JSON.parse(JSON.stringify(value));';
  assert(roadSource.includes(sceneMarker));
  vm.runInContext(roadSource.replace(sceneMarker,
    '  window.__cacheStreetScenes = STREET_SCENES;\n'+
    '  window.__cacheStreetItems = STREET_ITEMS;\n'+
    '  window.__cachePedestrians = PEDESTRIANS;\n'+
    '  window.__cachePropShapes = PROP_SHAPES;\n'+
    '  window.__cacheLandscape = LANDSCAPE;\n'+
    '  window.__cacheSites = SIDE_PLACES;\n'+sceneMarker),
  context,{filename:'src/game/cache-road-proof.js [street-scene inspection]'});
  const landscape=w.__cacheLandscape, sites=w.__cacheSites;
  assert(landscape.pitch===180 && landscape.span===225 &&
    landscape.chunks.length>=100 && landscape.plates.length>=150 &&
    landscape.plates.every(plate=>plate.art[3]>=1500 &&
      plate.art[6]>0 && plate.art[6]<=plate.art[2]),
    'both banks use overlapping full-route chunks and fitted card metadata');
  for(const family of ['market','homes','workshop','greenhouse','data','transit']) {
    const prefix=family[0].toUpperCase()+family.slice(1);
    const familyPlates=landscape.plates.filter(plate=>plate.family===family&&
      plate.key!=='accent'&&
      plate.art[0].startsWith(`cache${prefix}`));
    assert.deepEqual([...new Set(familyPlates.map(plate=>plate.art[0]))].sort(),
      ['L','R'].flatMap(side=>['Rear','Middle','FrontGap','FrontFill']
        .map(tier=>`cache${prefix}${side}${tier}`)).sort(),
      `the protected-site route exercises all eight ${family} cards`);
    assert(familyPlates.every(plate=>plate.art[8]?.footU>0&&
      plate.art[8]?.footU<1&&
      (plate.key==='open')===(plate.art[8].socketU!==undefined)) &&
      familyPlates.filter(plate=>plate.key==='open').every(plate=>
        landscape.streets.some(street=>street.chunkId===plate.chunkId &&
          street.side===plate.side && street.at===plate.at)),
      `${family} contact and transparent graph socket stay paired`);
  }
  for(const side of [-1,1]) {
    const chunks=landscape.chunks.filter(chunk=>chunk.side===side)
      .sort((a,b)=>a.startAt-b.startAt);
    assert(chunks[0].startAt<=0 && chunks.at(-1).endAt>=9840 &&
      chunks.every((chunk,i)=>i===0 ||
        chunk.startAt-chunks[i-1].startAt===180 &&
        chunk.startAt<chunks[i-1].endAt),
      'one overlapping landscape runs without address holes on each bank');
  }
  const graph=landscape.graph;
  assert(graph.nodes.length>landscape.parcels.length &&
    graph.edges.length>graph.nodes.length-2 &&
    landscape.parcels.every(parcel=>{
      const n=graph.nodes[parcel.entrance.node];
      return n?.side===parcel.side && n?.at===parcel.entrance.at &&
        n?.radial===parcel.entrance.radial &&
        graph.edges.some(edge=>edge.kind==='parcel-access' &&
          (edge.a===n.id||edge.b===n.id));
    }), 'every graph parcel has a connected entrance');
  for(const side of [-1,1]) {
    const start=graph.nodes.find(n=>n.side===side &&
      n.type==='arterial-sidewalk').id;
    const visited=new Set([start]),pending=[start];
    while(pending.length) {
      const current=pending.pop();
      for(const edge of graph.edges) {
        const other=edge.a===current?edge.b:edge.b===current?edge.a:-1;
        if(other>=0&&!visited.has(other)) {visited.add(other);pending.push(other);}
      }
    }
    assert(graph.nodes.filter(n=>n.side===side).every(n=>visited.has(n.id)),
      'streets, sidewalks, and parcel entrances reach the main sidewalk');
  }
  const badStreet=landscape.streets.find(street=>{
    const plate=landscape.plates.find(p=>p.side===street.side &&
      p.tier==='front' && p.chunkId===street.chunkId);
    return plate?.key!=='open' ||
      sites.some(site=>site.side===street.side && Math.abs(site.at-street.at)<135) ||
      !street.edges.every(([a,b])=>a<street.nodes.length && b<street.nodes.length);
  });
  assert(landscape.streets.length>=8 && !badStreet,
    `every branch has an opening and a protected site gap: ${JSON.stringify(badStreet)}`);
  assert(new Set(landscape.streets.map(street=>
    street.nodes[3].at-street.at)).size>=2 &&
    landscape.streets.some(street=>street.nodes[3].at<street.nodes[2].at),
  'connected branches include distinct bends and a returning turn');
  assert.notDeepEqual(copy(w.BARCODE.CacheRoadLandscape.create(17,9840,sites).streets),
    copy(landscape.streets),'a different seed changes the graph layout');
  assert(landscape.plates.filter(p=>p.tier==='front').every(p=>
    !sites.some(site=>site.side===p.side && Math.abs(site.at-p.at)<98)),
    'district fronts cannot occupy featured site addresses');
  assert.deepEqual(copy(w.BARCODE.CacheRoadLandscape.create(0x6b4d,9840,sites).streets),
    copy(landscape.streets),'retry produces the same street sockets');
  // Check several real building stacks. Sites occupy their own painted lot,
  // adjacent families may not collide, and a street belongs to one chunk.
  for(const seed of [0x6b4d,17,92381,2026,7777]) {
    const layout=w.BARCODE.CacheRoadLandscape.create(seed,9840,sites);
    assert(layout.plates.length>=150 && layout.streets.length>=8,
      `seed ${seed} retains inhabited banks and real streets`);
    for(const side of [-1,1]) {
      const plates=layout.plates.filter(p=>p.side===side);
      const mouths=layout.streets.filter(s=>s.side===side).map(s=>s.at);
      const accents=plates.filter(p=>p.key==='accent');
      assert.equal(new Set(mouths).size,mouths.length,
        `seed ${seed}: one chunk owns each ${side} street mouth`);
      assert(plates.every(p=>!sites.some(s=>s.side===side&&
        Math.abs(s.at-p.at)<30)),
      `seed ${seed}: no card shares a featured site's foundation`);
      assert(accents.every((p,i)=>accents.slice(i+1).every(q=>
        Math.abs(p.at-q.at)>=240)),
      `seed ${seed}: accent foundations have distinct addresses`);
      assert(plates.every((p,i)=>plates.slice(i+1).every(q=>
        p.family===q.family||Math.abs(p.at-q.at)>=110)),
      `seed ${seed}: adjacent families do not intersect at a boundary`);
    }
  }
  const streetScenes=w.__cacheStreetScenes;
  const groups=streetScenes.map(scene=>scene.people).filter(group=>group.length);
  assert.deepEqual([...new Set(groups.map(group=>group.length))].sort(),[1,2,3,4,5],
    'procedural pedestrian groups include every size from one through five');
  assert(groups.every(group=>new Set(group.map(person=>person.id>=15?
    `new-${Math.floor((person.id-15)/2)}`:`old-${person.id}`)).size===group.length),
    'one procedural group never repeats an individual identity in either direction');
  assert(groups.every(group=>Math.max(...group.map(person=>person.at))-
    Math.min(...group.map(person=>person.at))<=104),
  'groups of five stay close enough to read as one street moment');
  assert(groups.filter(group=>group.length>=3).every(group=>
    Math.max(...group.map(person=>person.base))-
    Math.min(...group.map(person=>person.base))>=70),
  'gatherings occupy the parcel depth instead of lining up along the road');
  assert(streetScenes.every(scene=>scene.people.every(person=>
    landscape.streets.filter(street=>street.side===scene.side).every(street=>
      Math.abs(person.at-street.at)>=58))),
  'people stay clear of graph street mouths and their crossing signals');
  assert(streetScenes.every(scene=>scene.props.every(prop=>
    /cacheNew(Lamp|CrossingSignal)/.test(prop.key) ||
    landscape.streets.filter(street=>street.side===scene.side).every(street=>
      Math.abs(prop.at-street.at)>=58))),
  'loose furniture does not block a street mouth or crossing');
  const paintedCustomerHeight=340/1391*690/(1+.2*.65);
  assert(w.__cachePedestrians.filter((_,id)=>id<15 &&
    ![5,9,11,13].includes(id)).every(([, ,height])=>
      height>=paintedCustomerHeight*.84 &&
      height<=paintedCustomerHeight*1.06) &&
    w.__cachePedestrians.slice(15).every(([, ,height])=>
      height>=paintedCustomerHeight*.84) &&
    w.__cachePropShapes.cacheStreetDeliveryVan[1]>
      w.__cachePedestrians[0][2]*1.2 &&
    w.__cachePropShapes.cacheStreetDataKiosk[1]>=
      w.__cachePedestrians[0][2],
  'walkers match painted vendor customers and van and kiosk retain physical scale');
  assert(w.__cacheStreetItems.length===streetScenes.reduce((sum,scene)=>
    sum+scene.people.length+scene.props.length,0) &&
    w.__cacheStreetItems.every(({item},index)=>index===0||
      w.__cacheStreetItems[index-1].item.at>=item.at),
  'people and furniture share one far-to-near depth order across parcels');
  assert.equal(new Set(groups.flatMap(group=>group.map(person=>person.id))).size,27,
    'the full route draws fifteen action cutouts and twelve directional walkers');
  assert(['L','R'].every(side=>streetScenes.some(scene=>scene.props.some(prop=>
    prop.key===`cacheNewLamp${side}`)&&scene.people.length===0)) &&
    streetScenes.some(scene=>scene.props.some(prop=>prop.key==='cacheNewVendorCart')),
    'new practical street furniture follows graph sockets and district context');
  assert(groups.some(group=>group.some(person=>person.id>=5)) &&
    streetScenes.some(scene=>scene.props.some(prop=>prop.key==='cacheStreetDeliveryVan')),
    'action poses and contextual street furniture are instantiated across the route');
  load(context, 'src/core/action-input.js');
  const B = w.BARCODE, profile = B.MusicProfiles.select('level-02.proof');
  const road = B.CacheRoadProof, C = B.Campaign;
  const pad = { connected: true, mapping: 'standard', axes: [0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false })) };
  const priorPads = w.navigator.getGamepads;
  w.navigator.getGamepads = () => [pad];
  const input = new B.ActionInput();
  for (const [index, action] of [[0,'road_a'],[1,'road_b'],[2,'road_x'],
    [3,'road_y'],[4,'road_turbo'],[5,'road_echo']]) {
    input.update({ gameplayActive: true });
    pad.buttons[index].pressed = true;
    assert.equal(input.update({ gameplayActive: true })[action].pressed, true,
      `road-only input maps standard controller button ${index}`);
    assert.equal(input.update({ gameplayActive: true })[action].pressed, false,
      'holding a button cannot repeat a pulse');
    pad.buttons[index].pressed = false;
  }
  pad.axes[1] = -.8;
  assert.equal(input.update({ gameplayActive: true }).move_up.held, true);
  pad.axes[1] = .8;
  assert.equal(input.update({ gameplayActive: true }).move_down.held, true);
  pad.axes[1] = 0;
  input.handleKeyDown({ key: 'k' });
  assert.equal(input.update({ gameplayActive: true }).road_a.pressed, true,
    'keyboard face diamond has its own edge input');
  assert.equal(input.update({ gameplayActive: true, paused: true }).road_a.pressed, false,
    'road pulses cannot trigger through pause');
  input.dispose(); w.navigator.getGamepads = priorPads;
  assert(profile && B.MusicTransport.load(profile.profileId).status === 'ok');
  assert.deepEqual(copy(profile.arrangement.sources.map(s => s.mixRole)),
    ['drive', 'pressure', 'flow', 'breakaway', 'undercurrent']);
  assert.deepEqual(copy(profile.laneMix.laneRoles), ['drive', 'flow', 'breakaway', 'undercurrent']);
  assert.equal(profile.laneMix.backboneRole, 'pressure');
  for (const part of profile.arrangement.sources) {
    const bytes = fs.readFileSync(part.url);
    assert(bytes.length > 3000000 && bytes.toString('ascii', 0, 3) === 'ID3', part.url);
    assert(part.required && part.backupUrl.includes('b0b26df3ca3289a24163f6b198072ea0de1429af'));
  }
  const audio = new w.AudioSystem(), starts = [], ramps = [], busEvents = [];
  const param = value => ({ value, cancelAndHoldAtTime() {}, cancelScheduledValues() {},
    setValueAtTime(v, at) { this.value = v; busEvents.push({ v, at }); },
    linearRampToValueAtTime(v, at) { this.value = v; busEvents.push({ v, at }); } });
  audio.context = { currentTime: 0, state: 'running', createGain() { return { gain: param(1), connect() {}, disconnect() {} }; },
    createBufferSource() { return { connect() {}, start(at, offset) { starts.push({ at, offset }); }, stop() {} }; } };
  audio.musicGain = audio.context.createGain(); audio.initialized = true;
  audio.rampAdaptiveStemGain = (track, volume, duration) => {
    ramps.push({ role: track.role, at: audio.context.currentTime, volume, duration });
    track.volume = volume; track.gain.gain.value = volume;
  };
  for (const part of profile.arrangement.sources)
    audio.musicTracks[part.sourceId] = { role: part.mixRole, buffer: { duration: 187.5 }, volume: 0 };
  w.audioSystem = audio;
  road.active = true; road.state = { lane: 1, lanePos: 1, captures: [], musicBar: 0 };
  assert(audio.startAllLayersSimultaneously().ok);
  assert.equal(starts.length, 5);
  assert.equal(new Set(starts.map(s => `${s.at}/${s.offset}`)).size, 1);
  const volume = role => audio.musicTracks[`cache-${role}`].volume;
  const tick = (bar, lane, captures = []) => {
    road.state.lane = lane; road.state.captures = captures;
    audio.context.currentTime = .01 + bar * 1.875;
    assert(B.musicDirector.apply(audio));
  };
  tick(0, 1);
  assert(volume('pressure') === .60 && volume('drive') === .10);
  assert(volume('flow') === 0 && volume('breakaway') === 0 && volume('undercurrent') === 0);
  tick(4, 1);
  assert(volume('flow') === .18 && volume('pressure') === .60);
  tick(4.5, 1, [{ lane: 1, startBeat: 16, endBeat: 32 }]);
  assert.equal(volume('flow'), .55, 'aligned phrase becomes audible when it begins');
  tick(4.6, 3, [{ lane: 1, startBeat: 16, endBeat: 32 }]);
  assert.equal(volume('flow'), .55, 'changing lanes carries the committed phrase');
  tick(8, 3);
  assert.equal(volume('flow'), .18, 'expired phrase returns to the steady bed');
  tick(8, 2, [{ lane: 2, startBeat: 32, endBeat: 48 },
    { lane: 3, startBeat: 32, endBeat: 48 }]);
  assert.equal(volume('breakaway'), .50, 'soft Breakaway verse A is selectable');
  assert.equal(volume('undercurrent'), .62, 'recorded Undercurrent verse A is not masked');
  tick(12.5, 2, [{ lane: 2, startBeat: 48, endBeat: 64, sealed: true },
    { lane: 3, startBeat: 48, endBeat: 64 }]);
  assert.equal(volume('breakaway'), .50);
  assert.equal(volume('undercurrent'), .62);
  tick(20, 3, [0, 1, 2, 3].map(lane => ({ lane, startBeat: 80, endBeat: 96 })));
  assert(volume('undercurrent') === .62 && volume('flow') === .55 &&
    volume('drive') === .19 && volume('pressure') === .60,
  'four caught parts stack over steady Pressure');
  for (const [bar, half] of [[28, 'verseA'], [36, 'verseB'], [44, 'chorus'],
    [52, 'verseA'], [76, 'verseA'], [92, 'chorus'], [99, 'chorus']]) {
    tick(bar, 1);
    assert.equal(B.musicDirector.state.half, half, `bar ${bar + 1}`);
    assert(volume('pressure') === .60 && volume('drive') === .10);
  }
  assert(ramps.some(r => r.duration === .22) && ramps.some(r => r.duration === .38),
    'earned parts rise quickly and trail smoothly');
  assert.equal(starts.length, 5, 'arrangement never restarts a playing stem');

  const archive = w.lostDataSystem.archive;
  archive.record.progress.completedLevels.push('level-01');
  archive.record.progress.items.push('stem.voice');
  archive.checkpoint(parentSave()); C.intermission = true;
  w.audioSystem.prepareActiveMusicProfile = async () => ({ ok: true });
  w.audioSystem.stopRuntimeAudio = () => { B.MusicTransport.stop(); B.musicDirector.reset(); };
  w.audioSystem.startRuntimeGameplayMusic = () => {
    const result = B.MusicTransport.start({ sourceAnchorAudioSec: audio.context.currentTime,
      sourceOffsetTrackSec: road.startOffsetSec() });
    return { ok: result.status === 'ok' && result.running };
  };
  w.inputManager = { resetActionEdges() {} };
  w.BARCODE.RuntimeLifecycle = { async restart() { road.dispose(); return { ok: true }; } };
  w.audioSystem.musicTracks = Object.fromEntries(profile.arrangement.sources.map(s =>
    [s.sourceId, { buffer: { duration: 187.5 }, isFallback: false }]));
  road.active = false; road.state = null;
  audio.context.currentTime = 0;
  assert((await road.enter()).ok);
  assert.equal(C.readResume().levelState.proofVersion, 4);
  const roadStart = copy(C.readResume());
  const liveState = road.state, oldArt = B.PresentationAssets;
  const mirrorFrames = [], mirrorRoads = [], mirrorTraffic = [], mirrorArt = [];
  const mirrorStreets = [], litRunways = [];
  const roadArt = [], openingRects = [], drawOrder = [], hudLines = [], contacts = [];
  const trafficLabels = [], beacons = [], sidewalkEdges = [], clipStack = [];
  const ridgeAt = (points,x) => {
    if(!points)return Infinity;
    if(!Number.isFinite(x))return Infinity;
    const i=Math.max(0,Math.min(63,Math.floor((1920-x)/30)));
    const a=points[i+2],b=points[i+3];
    if(!a||!b)throw Error(`invalid ridge length ${points.length} at ${x}/${i}`);
    return a.y+(b.y-a.y)*((x-a.x)/(b.x-a.x));
  };
  B.PresentationAssets = { ready(key) { return key.startsWith('cache'); },
    draw(key, _ctx, options) {
    if (key === 'cacheMirror') mirrorFrames.push({ frame: options.frame,
      sourceRect: options.sourceRect, x: options.x, y: options.y, filter: _ctx.filter });
    else if (_ctx.filter === 'blur(2.3px)')
      mirrorArt.push({key,...options,alpha:_ctx.globalAlpha ?? 1});
    else { roadArt.push({ key, ...options, alpha:_ctx.globalAlpha ?? 1,
      clipHeight: ridgeAt(_ctx.ridge,options.x),
      clipLeft: ridgeAt(_ctx.ridge,options.x-(options.width||0)/2),
      clipRight: ridgeAt(_ctx.ridge,options.x+(options.width||0)/2),
      ...(key === 'cacheOutskirts' ? { ridgeCenter:ridgeAt(_ctx.ridge,960),
        ridgeEdge:ridgeAt(_ctx.ridge,0) } : {}),
      ...(['cacheRollingGrain','cacheWorkshopPavement','cacheLocalStreet',
        'cacheConfirmedBar'].includes(key) ||
        key.endsWith('Turn')||key.endsWith('Curb') ?
        { projected:_ctx.lastTransform?.slice() } : {}),
      ...(['cacheCar','cacheFreight','cacheSweeper'].includes(key) ?
        { chassisOffset:_ctx.lastTranslate?.slice() } : {}),
      ...(key.startsWith('cacheFly') ? { screenX: _ctx.lastTranslate?.[0] } : {}) });
      drawOrder.push(key); }
    return true;
  } };
  const paint = { addColorStop() {} };
  const drawCtx = new Proxy({ clipHeight: Infinity, ridge: null,
    createLinearGradient: () => paint,
    createRadialGradient: () => paint,
    beginPath() { this.path = []; this.pendingClip = null; },
    rect(x,y,width,height) {
      if(x===0 && y===0 && width===1920) this.pendingClip=height;
    },
    save() { clipStack.push({ height:this.clipHeight, ridge:this.ridge,
      alpha:this.globalAlpha ?? 1, filter:this.filter }); },
    restore() { const last=clipStack.pop(); this.clipHeight=last?.height ?? Infinity;
      this.ridge=last?.ridge;this.globalAlpha=last?.alpha ?? 1;this.filter=last?.filter; },
    clip() {
      if(this.pendingClip!=null)
        this.clipHeight=Math.min(this.clipHeight ?? Infinity,this.pendingClip);
      if(this.path?.length===67 && this.path[0].x===0 && this.path[1].x===1920)
        this.ridge=this.path.slice();
      this.pendingClip=null;
    },
    moveTo(x,y) { this.path?.push({x,y}); },
    lineTo(x,y) { this.path?.push({x,y}); },
    stroke() {
      if (this.strokeStyle === '#8296a1' && this.path?.length === 29)
        sidewalkEdges.push(this.path.slice());
      if (this.strokeStyle === '#87949e' && this.path?.length === 4)
        drawOrder.push('brakingTireTrack');
    },
    fillRect(x, y, width, height) {
      if (x === 30 && y === 176 && width > 100) openingRects.push([width, height]);
      if (this.fillStyle === '#ffe8bc')
        mirrorTraffic.push({ x,y,width,height,filter:this.filter });
    }, fill() {
      if (this.fillStyle === '#174c51') drawOrder.push('roadPad');
      if (this.fillStyle === '#192e39') mirrorRoads.push(this.path.slice());
      if (this.filter === 'blur(2.3px)' && this.fillStyle === '#263841')
        mirrorStreets.push(this.path.slice());
      if (this.filter !== 'blur(2.3px)' && this.fillStyle === '#69d9f5' &&
        this.path?.length === 26) litRunways.push(this.path.slice());
    },
    translate(x,y) { this.lastTranslate = [x,y]; },
    transform(...values) { this.lastTransform = values; },
    ellipse(x,y,rx,ry) {
      if (this.fillStyle === '#030b16c8') contacts.push({ x,y,rx,ry });
      if (['#ff77bb','#ffd079','#8af6f1'].includes(this.fillStyle))
        beacons.push({ x,y,translate:this.lastTranslate });
    },
    fillText(value, x, y) {
      if ((x === 1623 && y === 76) || (x === 1345 && y === 155) ||
          (x === 1418 && y === 56))
        hudLines.push({ value, x, y });
      if (value === 'CUT >' || value === '< CUT') trafficLabels.push(value);
    } },
    { get(target, key) { return key in target ? target[key] : () => {}; },
    set(target, key, value) { target[key] = value; return true; } });
  const mirrorFrame = overrides => {
    road.state = { ...liveState, progress: 395, integrity: 3, timeMs: 55000,
      stumbleMs: 0, boostMs: 0, zoneEndBeat: -1, pendingCapture: null,
      candidateHold: 0, cutFlashMs: 0, messageMs: 0, rivalWarning: false,
      ...overrides };
    mirrorFrames.length = 0; mirrorRoads.length = 0; mirrorTraffic.length = 0;
    mirrorArt.length = 0; mirrorStreets.length = 0; litRunways.length = 0;
    roadArt.length = 0; openingRects.length = 0;
    drawOrder.length = 0; hudLines.length = 0; contacts.length = 0;
    sidewalkEdges.length = 0;
    trafficLabels.length = 0; beacons.length = 0; road.draw(drawCtx);
    assert.equal(mirrorFrames.length, 1, 'one expression is drawn inside the shared rearview');
    assert.deepEqual(Array.from(mirrorFrames[0].sourceRect), [0, 150, 450, 185]);
    assert.equal(mirrorFrames[0].x, 833, 'the completed face sits inside the driver side');
    assert.notEqual(mirrorFrames[0].filter, 'blur(2.3px)',
      'Cache stays sharp outside the blurred reflection');
    return mirrorFrames[0].frame;
  };
  assert.equal(mirrorFrame({}), 0);
  mirrorFrame({progress:185});
  assert.equal(mirrorTraffic.length,0,'traffic ahead is absent from the rearview');
  mirrorFrame({progress:215});
  assert.equal(mirrorTraffic.length,2,'a passed hazard shows two blurred headlights');
  assert(mirrorTraffic.every(light=>light.filter==='blur(2.3px)'),
    'only the reflected world gets the mirror blur');
  const firstLight={...mirrorTraffic[0]};
  const firstBend=mirrorRoads[0];
  assert.equal(mirrorRoads.length,1,'the rearview has one continuous curved road');
  assert.equal((firstBend[12].x+firstBend[13].x)/2,638+475,
    'the reflected road follows the car at its near end');
  mirrorFrame({progress:250});
  assert.equal(mirrorTraffic.length,2,'the same passed car remains behind Cache');
  assert(mirrorTraffic[0].y<firstLight.y && mirrorTraffic[0].width<firstLight.width,
    'a passed car recedes and shrinks as road progress increases');
  assert(mirrorArt.some(entry=>entry.key==='cachePlaceHouse') &&
    mirrorArt.some(entry=>entry.key==='cachePlaceMarket'),
    'actual featured buildings enter the mirror only after they are passed');
  const rearHouse=mirrorArt.find(entry=>entry.key==='cachePlaceHouse');
  mirrorFrame({progress:300});
  assert(mirrorArt.find(entry=>entry.key==='cachePlaceHouse').height<rearHouse.height,
    'passed roadside art shrinks toward the rear horizon');
  const firstStreet=landscape.streets.find(street=>street.at>500 && street.at<2000);
  assert(firstStreet,'the street graph contains a rearview review address');
  mirrorFrame({progress:firstStreet.at-1});
  const oldMouths=mirrorStreets.length;
  mirrorFrame({progress:firstStreet.at+1});
  assert(mirrorStreets.length>oldMouths,
    'the actual branch road opens in the mirror only after passage');
  const firstCard=landscape.plates.find(plate=>plate.at>150 && plate.at<1500);
  assert(firstCard,'the district graph contains a rearview review card');
  mirrorFrame({progress:firstCard.at+1});
  assert(mirrorArt.some(entry=>entry.key===firstCard.art[0] && entry.width<80),
    'the same painted district card is miniaturized in the blurred glass');
  mirrorFrame({progress:450});
  assert.notEqual((mirrorRoads[0][0].x+mirrorRoads[0].at(-1).x)/2,
    (firstBend[0].x+firstBend.at(-1).x)/2,
    'rear road curvature follows the shared world path');
  assert(roadArt.some(entry => entry.key === 'cacheDistantCity') &&
    roadArt.some(entry => entry.key === 'cacheOutskirts') &&
    roadArt.some(entry => entry.key === 'cacheMidCity') &&
    roadArt.some(entry => entry.key === 'cacheParapet') &&
    roadArt.some(entry => entry.key === 'cachePylon') &&
    roadArt.some(entry => entry.key === 'cacheFly1') &&
    roadArt.some(entry => entry.key === 'cacheFly3') &&
    roadArt.some(entry => entry.key === 'cacheBlacktop') &&
    roadArt.some(entry => entry.key === 'cacheSidewalk') &&
    roadArt.some(entry => entry.key === 'cacheOuterGround') &&
    roadArt.some(entry => entry.key === 'cacheRollingGrain') &&
    roadArt.some(entry => entry.key === 'cacheCar'),
  'three city depths, projected sidewalk and ground, roadside art, traffic and car share the live draw');
  mirrorFrame({ progress: 0 });
  const uprightPlaces = entries => entries.filter(entry =>
    entry.key.startsWith('cachePlace') && entry.key !== 'cachePlaceParking');
  const places = uprightPlaces(roadArt);
  const market = places.filter(entry => entry.key === 'cachePlaceMarket' && entry.flip)
    .sort((a,b) => b.width-a.width)[0];
  const house = places.filter(entry => entry.key === 'cachePlaceHouse' && !entry.flip)
    .sort((a,b) => b.width-a.width)[0];
  assert(market && house && places.length >= 2 &&
    new Set(places.map(entry => entry.key)).size >= 2 &&
    places.every(entry => !entry.sourceRect && entry.width > 0 &&
      entry.height > 0 && entry.alpha === 1),
  'both sides contain several separate, varied, uniformly scaled parcels');
  const playerCar=roadArt.find(entry => entry.key === 'cacheCar');
  assert(market.width > playerCar.width*1.45 && market.height > playerCar.height*1.5 &&
    house.width > playerCar.width*1.2 && house.height > playerCar.height*1.4,
  'opening buildings grow beyond car scale as they clear the distant horizon');
  const sidewalkAt = (side,y) => {
    const edge=sidewalkEdges[side < 0 ? 0 : 1];
    assert(edge && edge.length === 29, 'both curved sidewalk outer edges are drawn');
    const i=edge.findIndex((point,j) => j > 0 && point.y >= y);
    if(i<1)return null;
    const a=edge[i-1],b=edge[i];
    return a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y);
  };
  const clearances=[];
  const fittedPose = {
    cachePlaceGardenRounded:[-1,false],cachePlaceGardenCompact:[-1,false],
    cachePlaceGardenHorizon:[1,false],cachePlaceConstructionRounded:[-1,false],
    cachePlaceConstructionHorizon:[1,false],cachePlaceConstructionCompact:[1,false],
    cachePlaceSignalOrchard:[1,true],cachePlaceRelayExchange:[1,true],
    cachePlaceDataReclamation:[1,true],cachePlaceCapacitorExchange:[1,true],
    cachePlaceNightDataMarket:[1,true],cachePlaceEncryptedPump:[-1,false],
    cachePlaceDroneServiceNode:[-1,false]
  };
  const checkSetbackAndFacing = () => {
    for(const entry of uprightPlaces(roadArt).filter(item =>
      item.groundY >= 590 && item.groundY <= 1080 &&
      item.x+item.width/2 >= 0 &&
      item.x-item.width/2 <= 1920)) {
      const side=entry.x < 960 ? -1 : 1;
      const curb=sidewalkAt(side,entry.groundY);
      assert(curb !== null);
      const inner=entry.x-side*entry.width/2;
      assert(side*(inner-curb) >= 4,
        `${entry.key} footprint must stay outside the ${side<0?'left':'right'} sidewalk`);
      clearances.push(side*(inner-curb)/Math.sqrt((entry.groundY-400)/680));
      if(entry.key in fittedPose) {
        const [expectedSide,expectedFlip]=fittedPose[entry.key];
        assert.equal(side,expectedSide,
          `${entry.key} keeps its native ground slope on the assigned bank`);
        assert.equal(entry.flip,expectedFlip,`${entry.key} uses its assigned facing`);
      } else assert.equal(entry.flip,
        entry.key === 'cachePlaceGarage' || entry.key === 'cachePlaceGarden' ? side>0 : side<0,
        `${entry.key} entrance faces the road from the ${side<0?'left':'right'}`);
    }
  };
  checkSetbackAndFacing();
  for(const [at,key,side] of [
    [623,'cachePlaceRelayExchange',1],
    [2685,'cachePlaceNightDataMarket',1],
    [3138,'cachePlaceConstructionRounded',-1],
    [3635,'cachePlaceConstructionHorizon',1],
    [4460,'cachePlaceGardenRounded',-1],
    [5055,'cachePlaceDataReclamation',1],
    [5829,'cachePlaceSignalOrchard',1],
    [6303,'cachePlaceGardenCompact',-1],
    [6511,'cachePlaceDroneServiceNode',-1],
    [7015,'cachePlaceConstructionCompact',1],
    [7427,'cachePlaceEncryptedPump',-1],
    [8158,'cachePlaceGardenHorizon',1],
    [8846,'cachePlaceCapacitorExchange',1]
  ]) {
    mirrorFrame({progress:at-180});
    const fitted=roadArt.find(item=>item.key===key);
    assert(fitted && (fitted.x<960 ? -1 : 1)===side &&
      fitted.flip===fittedPose[key][1] &&
      fitted.width>0 && fitted.height>0 && fitted.y-fitted.height<fitted.clipHeight,
      `${key} appears at its curated ${side<0?'left':'right'} site`);
    checkSetbackAndFacing();
  }
  mirrorFrame({progress:0});
  const openingPlaces=JSON.stringify(places);
  const cutouts=roadArt.filter(entry=>/^(cachePerson|cacheWalker|cacheStreet)/.test(entry.key));
  assert(cutouts.length>=5&&cutouts.every(entry=>
    Math.abs(entry.clipLeft-entry.clipRight)<1e-6),
  'people and props reveal across their whole width without a road-facing slice');
  mirrorFrame({progress:120});
  const earlyMarket=roadArt.filter(entry=>entry.key==='cachePlaceMarket'&&entry.flip)
    .sort((a,b)=>b.width-a.width)[0];
  mirrorFrame({progress:130});
  const lateMarket=roadArt.filter(entry=>entry.key==='cachePlaceMarket'&&entry.flip)
    .sort((a,b)=>b.width-a.width)[0];
  assert(Number.isFinite(earlyMarket?.clipHeight)&&
    Number.isFinite(lateMarket?.clipHeight)&&
    Math.abs(earlyMarket.clipHeight-lateMarket.clipHeight)<60,
  'the landscape reveal continues through the former t=.75 clip switch');
  mirrorFrame({ progress: 0 });
  assert.equal(JSON.stringify(uprightPlaces(roadArt)),openingPlaces,
    'seeded roadside placement draws identically on repeated frames');
  const lamp = roadArt.find(entry => entry.key === 'cachePylon' &&
    entry.x < 960 && entry.y > 550 && entry.y < 690);
  assert(lamp, 'streetlights share the side road with parcels and filler');
  mirrorFrame({ progress: 32 });
  const advancingMarket = roadArt.filter(entry => entry.key === 'cachePlaceMarket' && entry.flip)
    .sort((a,b) => b.width-a.width)[0];
  const advancingLamp = roadArt.find(entry => entry.key === 'cachePylon' &&
    entry.x < 960 && entry.y > lamp.y && entry.y < lamp.y+100);
  assert(advancingMarket && advancingMarket.x < market.x &&
    advancingMarket.y > market.y && advancingMarket.width > market.width &&
    advancingMarket.height > market.height && advancingLamp && advancingLamp.x < lamp.x,
  'a painted place grows and approaches alongside a world-fixed streetlight');
  assert(advancingMarket.width/market.width<1.11,
    'the same roadside site approaches at the longer, measured bank pace');
  mirrorFrame({progress:150});
  const laterWidth=roadArt.filter(entry=>entry.key==='cachePlaceMarket'&&entry.flip)
    .sort((a,b)=>b.width-a.width)[0]?.width;
  assert((laterWidth-advancingMarket.width)/118 >
    (advancingMarket.width-market.width)/32,
  'a site starts with a slower approach and accelerates near the player');
  checkSetbackAndFacing();
  assert(roadArt.some(entry => entry.key === 'cachePlaceMarket' && entry.flip &&
    entry.width > market.width && entry.x+entry.width/2 > 0 &&
    entry.y-entry.height < 1080),
  'the enlarged left market facade remains visible while it approaches the screen edge');
  checkSetbackAndFacing();
  mirrorFrame({ progress: 300 });
  assert(roadArt.some(entry => entry.key === 'cachePlaceMarket' && entry.flip &&
    entry.width > market.width*1.4 && entry.x+entry.width/2 < 0),
  'the near building exits across the landscape edge instead of crossing the sidewalk');
  const uncovered=entry=>Math.max(0,Math.min(entry.height,
    entry.clipHeight-(entry.y-entry.height)));
  const areaReveal=[],lampReveal=[],areaEdges=[];
  for(const progress of [0,60,120,160]) {
    mirrorFrame({progress});
    const area=roadArt.find(entry=>entry.key==='cachePlaceRelayExchange');
    const lampDepth=(525/620)*Math.pow((1200-(710-progress))/1200,3.1);
    const lamp=roadArt.filter(entry=>entry.key==='cachePylon'&&entry.x<960)
      .sort((a,b)=>Math.abs(a.width-214*lampDepth)-
        Math.abs(b.width-214*lampDepth))[0];
    assert(area&&lamp&&Math.abs(lamp.width-214*lampDepth)<.3,
      'the same world-addressed lamp and featured area remain present from the horizon');
    areaReveal.push([area.width,uncovered(area),area.height]);
    areaEdges.push({clip:area.clipHeight,left:area.clipLeft,
      right:area.clipRight,foot:area.y,ground:area.groundY});
    lampReveal.push([lamp.width,uncovered(lamp)]);
  }
  assert(areaEdges.every((edge,i)=>edge.left<edge.clip&&
    edge.clip<edge.right&&edge.foot>edge.ground&&
    (i===0||edge.clip>areaEdges[i-1].clip&&
      edge.clip-areaEdges[i-1].clip<20)) &&
    areaEdges[0].clip>425&&areaEdges[0].foot-areaEdges[0].ground>20,
  'a distant area stays buried behind the curved, stable bank horizon');
  assert(areaReveal[0][1]<areaReveal[0][2]*.45 &&
    areaReveal[3][1]>areaReveal[3][2]*.6 &&
    areaReveal.every(([width,visible],i)=>i===0||
      width>areaReveal[i-1][0]&&visible>areaReveal[i-1][1]) &&
    lampReveal[0][1]<3&&lampReveal[3][1]>15&&
    lampReveal.every(([width,visible],i)=>i===0||
      width>lampReveal[i-1][0]&&visible>lampReveal[i-1][1]),
  'a building and a lamp reveal roof-first, then steadily grow while approaching');
  mirrorFrame({progress:160});
  const paintedOrder=roadArt.map(entry=>entry.key);
  assert(paintedOrder.indexOf('cachePlaceGarage')<
    paintedOrder.indexOf('cacheOutskirtsHomes') &&
    paintedOrder.indexOf('cachePlaceConstruction')<
    paintedOrder.indexOf('cacheMarketLFrontGap'),
  'distant featured art draws behind the nearer satellite and district front');
  for(const [progress,bank,other] of [[250,'L','R'],[760,'R','L']]) {
    mirrorFrame({progress});
    for(const suffix of ['Turn','Curb','StreetWall','Endcap'])
      assert(roadArt.some(entry=>entry.key===`cacheJoin${bank}${suffix}` &&
        (suffix==='Turn'||suffix==='Curb' ?
          entry.projected?.length===6 && entry.alpha===1 :
          entry.width>0 && entry.height>0)),
      `${bank} ${suffix} joins its own graph socket at progress ${progress}`);
    assert(!roadArt.some(entry=>entry.key===`cacheJoin${other}Turn` ||
      entry.key===`cacheJoin${other}Curb`),
    'offscreen/opposite mouths do not stamp flat join art');
  }
  mirrorFrame({ progress: 600 });
  checkSetbackAndFacing();
  assert(uprightPlaces(roadArt).some(entry => entry.flip) &&
    !roadArt.some(entry => /^(cacheMarketBlock|cacheDepot|cacheFrontage)/.test(entry.key)),
  'later blocks use independent right-side places, never the rejected long strips');
  const reviewedKinds=new Set();
  let loneBankFrames=0,pairedApproaches=0,comparedApproaches=0;
  for(let progress=0;progress<2460;progress+=205) {
    mirrorFrame({ progress });
    checkSetbackAndFacing();
    uprightPlaces(roadArt)
      .forEach(entry => reviewedKinds.add(entry.key));
    const visible=uprightPlaces(roadArt).filter(entry=>entry.x+entry.width/2>0 &&
      entry.x-entry.width/2<1920 && entry.y-entry.height<1080 &&
      entry.clipHeight>entry.y-entry.height+4);
    assert.equal(new Set(visible.map(entry=>entry.key)).size,visible.length,
      'a visible road vista never repeats one whole building at another size');
    assert(!roadArt.some(entry=>entry.key==='cachePlaceParking'),
      'the rejected long parking slab is never drawn');
  }
  for(let progress=0;progress<2460;progress+=55) {
    mirrorFrame({progress});
    const near=uprightPlaces(roadArt).filter(item=>item.y>515 && item.y<790 &&
      item.x+item.width/2>0 && item.x-item.width/2<1920);
    const left=near.filter(item=>item.x<960),right=near.filter(item=>item.x>960);
    if((!!left.length)!=(!!right.length))loneBankFrames++;
    if(left.length&&right.length) {
      comparedApproaches++;
      if(left.some(l=>right.some(r=>Math.abs(l.y-r.y)<45)))pairedApproaches++;
    }
  }
  assert(loneBankFrames>4 && pairedApproaches<comparedApproaches*.65,
    'site approaches include one-sided gaps and only occasional facing pairs');
  assert(['Market','House','Garage','Apartment','Diner','Park','Substation',
    'Garden','Construction'].every(name=>reviewedKinds.has(`cachePlace${name}`)),
  'all nine default location paintings receive a road-facing, exterior placement check');
  assert(Math.max(...clearances)-Math.min(...clearances)>75,
    'site footprints have visibly different stable setbacks from the sidewalk');
  const infillKeys=['cacheTransitNook','cacheOutskirtsHomes',
    'cacheUtilityCorner','cacheGreenhouseWorkshop',
    'cacheOutskirtsWorkshops','cacheRepairShop','cacheVendorStall'];
  const infillSeen=new Set();
  for(let progress=0;progress<9800;progress+=160) {
    mirrorFrame({progress});
    const infill=roadArt.filter(entry=>infillKeys.includes(entry.key));
    assert(infill.every(entry=>entry.alpha===1 && entry.width>0 &&
      entry.width<2000 && (!entry.sourceRect ||
        entry.sourceRect[0]===0 && entry.sourceRect[1]===0 &&
        entry.sourceRect[2]>1300 && entry.sourceRect[3]>700) &&
      (entry.flip===(entry.x>960)||entry.width<30||
        entry.clipHeight<=entry.y-entry.height+4)),
    'graph accents and site satellites stay opaque and face their bank');
    for(const entry of infill)infillSeen.add(entry.key);
    assert(!roadArt.some(entry=>entry.key==='cacheBusStop'),
      'bus-stop painting remains inactive until a believable service route exists');
  }
  assert.deepEqual([...infillSeen].sort(),infillKeys.sort(),
    'six fixed neighborhood settings and market-side vendors appear along the route');
  mirrorFrame({progress:400});
  assert(roadArt.some(entry=>/^(cacheWorkshopL|cacheMarketL)/.test(entry.key) &&
    entry.x<960 && entry.width>230 && entry.x+entry.width/2>120),
  'the layered left district occupies the old isolated infill gap');
  let crossingGap=Infinity, crossingSamples=0;
  for(let progress=0;progress<2460;progress+=10) {
    mirrorFrame({progress});
    for(const entry of uprightPlaces(roadArt).filter(item=>
      item.y>760 && item.y<803 && item.x+item.width/2>0 &&
      item.x-item.width/2<1920 && Number.isFinite(item.clipHeight))) {
      crossingGap=Math.min(crossingGap,entry.clipHeight-entry.y);
      crossingSamples++;
    }
  }
  assert(crossingSamples>5 && crossingGap>-20,
    `a visible site's foundation must almost clear before the near clip ends (${crossingGap})`);
  mirrorFrame({progress:340});
  assert(!roadArt.some(entry=>['cacheCourier','cacheAudit'].includes(entry.key) &&
    entry.x!==0),
  'parking lots contain no stray copies of the active traffic paintings');
  mirrorFrame({progress:6010});
  const lotTile=roadArt.find(entry=>entry.key==='cacheLocalStreet' &&
    entry.alpha===.82 && entry.projected?.length===6);
  assert(lotTile && !roadArt.some(entry=>entry.key==='cacheBlacktop' &&
    entry.sourceRect?.[3]===616),
  'the lot maps local asphalt onto terrain quads without a fixed screen texture');
  mirrorFrame({progress:6020});
  const sameLotTile=roadArt.find(entry=>entry.key==='cacheLocalStreet' &&
    entry.alpha===.82 && entry.sourceRect?.[1]===lotTile.sourceRect[1]);
  assert(sameLotTile && sameLotTile.projected[5]>lotTile.projected[5],
  'a parking texel stays at its world address while its quad approaches');
  let completePark=false;
  for(let progress=0;progress<2460;progress+=75) {
    mirrorFrame({progress});
    completePark ||=roadArt.some(entry=>entry.key==='cachePlacePark' &&
      !entry.sourceRect && entry.width>300 && entry.flip===false);
  }
  assert(completePark,
  'the whole road-facing park shares the scale of other painted sites');
  mirrorFrame({ progress: 600 });
  assert(trafficLabels.includes('CUT >') && beacons.some(light => light.translate?.[0] === 0),
    'opening trike calls its right cut and keeps its beacon in the chassis frame');
  mirrorFrame({ progress: 3*2460+600 });
  assert(trafficLabels.includes('< CUT'), 'rotated right-edge trike calls its left cut');
  mirrorFrame({ progress: 395 });
  const cityKeys=['cacheDistantCity','cacheOutskirts','cacheMidCity'];
  const cityAt395=cityKeys
    .map(key=>{
      const entry=roadArt.find(item=>item.key===key);
      return entry.x-(1920-entry.width)/2;
    });
  for(const key of cityKeys) {
    const entry=roadArt.find(item=>item.key===key);
    assert(entry.width>=2600 && entry.width<3000 &&
      entry.height>350 && !entry.sourceRect,
    `${key} overscans the screen for a bounded road-bearing parallax`);
  }
  const middleCity=roadArt.find(entry=>entry.key==='cacheOutskirts');
  assert(middleCity.ridgeEdge-middleCity.ridgeCenter>10 &&
    middleCity.ridgeEdge-middleCity.ridgeCenter<35,
  'the city boundary stays shallow while the roadside keeps its wide planet crest');
  mirrorFrame({ progress: 0 });
  const openingCity=roadArt.find(entry=>entry.key==='cacheMidCity');
  assert(Math.abs(openingCity.x-(1920-openingCity.width)/2)<.001 &&
    openingCity.y-openingCity.height+openingCity.height*103/724>435,
  'the close city starts centered and completely hidden below the skyline lip');
  mirrorFrame({ progress: 3*2460+2000 });
  const nearCity=roadArt.find(entry=>entry.key==='cacheMidCity');
  assert(nearCity.width===openingCity.width &&
    nearCity.y<openingCity.y-300 && nearCity.alpha===openingCity.alpha,
  'the close city emerges vertically across the entire run without a lap reset');
  mirrorFrame({ progress: 395 });
  const roadTexture=() => roadArt.find(entry => entry.key === 'cacheBlacktop' &&
    entry.sourceRect[3] <= 22);
  const rollingGrain=roadArt.filter(entry=>entry.key==='cacheRollingGrain');
  const workshopPavement=roadArt.filter(entry=>entry.key==='cacheWorkshopPavement');
  const localStreet=roadArt.filter(entry=>entry.key==='cacheLocalStreet');
  assert(rollingGrain.length>=40 &&
    rollingGrain.every(entry=>entry.sourceRect?.[3]>0 &&
      entry.alpha===.44 && entry.projected?.length===6) &&
    workshopPavement.length===0 && localStreet.length>0 &&
    localStreet.length%2===0 &&localStreet.some(entry=>entry.alpha===.95) &&
    localStreet.every(entry=>[.82,.84,.95].includes(entry.alpha) &&
      entry.sourceRect?.[2]===256 && entry.sourceRect?.[3]===64 &&
      entry.projected?.length===6),
  'world-fixed grain covers both banks; shared local texture stays inside graph streets and market courts');
  mirrorFrame({progress:2750});
  assert(roadArt.some(entry=>entry.key==='cacheLocalStreet') &&
    !roadArt.some(entry=>entry.key.startsWith('cacheMarket')),
  'later workshop streets use the same world-addressed wet road surface');
  mirrorFrame({progress:395});
  const fixedGrain=rollingGrain.find(entry=>entry.sourceRect[0]===0 &&
    entry.sourceRect[1]>100);
  assert(fixedGrain,'a tracked left-bank terrain strip is visible');
  const textureRow = roadTexture().sourceRect[1];
  const cachePose=roadArt.filter(entry=>entry.key==='cacheCar').at(-1).chassisOffset;
  const sweeperPose=roadArt.filter(entry=>entry.key==='cacheSweeper').at(-1).chassisOffset;
  const ships = roadArt.filter(entry => entry.key.startsWith('cacheFly'));
  assert.deepEqual(ships.map(ship => [ship.key,ship.flip]),
    [['cacheFly1',false],['cacheFly3',false],['cacheFly3',true],
      ['cacheFly1',true],['cacheFly3',true]],
    'both atlas noses face their actual left/right travel');
  assert(Math.abs(contacts.at(-2).x + 164*.44) < .01 &&
    Math.abs(contacts.at(-1).x - 164*.44) < .01 &&
    Math.abs(contacts.at(-2).y - (-119*.14+2)) < .01 &&
    Math.abs(contacts.at(-1).y - (-119*.14+2)) < .01,
  'the player shadow has a contact patch under each grounded tire');
  mirrorFrame({ progress: 405 });
  assert(Math.abs(roadArt.filter(entry=>entry.key==='cacheCar').at(-1)
    .chassisOffset[1]-cachePose[1])>1 &&
    Math.abs(roadArt.filter(entry=>entry.key==='cacheSweeper').at(-1)
      .chassisOffset[1]-sweeperPose[1])>1,
  'painted player and traffic bodies animate over their grounded wheel masks');
  const cityAt405=cityKeys
    .map(key=>{
      const entry=roadArt.find(item=>item.key===key);
      return entry.x-(1920-entry.width)/2;
    });
  const pans=cityAt405.map((x,i)=>x-cityAt395[i]);
  assert(Math.abs(pans[0])<10 && Math.abs(pans[2])<35 &&
    Math.abs(pans[1]-pans[0]*.48/.18)<.01 &&
    Math.abs(pans[2]-pans[0]*.90/.18)<.01,
  'three city depths pan together on a road turn at increasing parallax ratios');
  assert(roadTexture().sourceRect[1] < textureRow,
    'blacktop marks advance from horizon toward car with road progress');
  const movedGrain=roadArt.find(entry=>entry.key===fixedGrain.key &&
    entry.sourceRect[0]===fixedGrain.sourceRect[0] &&
    entry.sourceRect[1]===fixedGrain.sourceRect[1]);
  assert(movedGrain && movedGrain.projected[5]>fixedGrain.projected[5],
    'the same ground texels approach the player as world progress advances');
  const movingShips = roadArt.filter(entry => entry.key.startsWith('cacheFly'));
  assert(movingShips[0].screenX > ships[0].screenX &&
    movingShips[1].screenX < ships[1].screenX,
  'flying traffic screen movement agrees with its visible nose');
  const previousPreferences = B.Preferences;
  B.Preferences = { values: { reducedMotion: true } };
  mirrorFrame({ progress: 395, elapsedMs: 100 });
  const stillShips = roadArt.filter(entry => entry.key.startsWith('cacheFly'));
  const stillCity=cityKeys
    .map(key=>{
      const entry=roadArt.find(item=>item.key===key);
      return entry.x-(1920-entry.width)/2;
    });
  const stillCityY=roadArt.find(entry=>entry.key==='cacheMidCity').y;
  mirrorFrame({ progress: 425, elapsedMs: 1400 });
  assert(Math.abs(roadArt.filter(entry=>entry.key==='cacheCar').at(-1)
    .chassisOffset[1])<.01,
  'Reduced Motion still plants the painted chassis on the road');
  assert.deepEqual(roadArt.filter(entry => entry.key.startsWith('cacheFly'))
    .map(ship => [ship.screenX, ship.frame]),
    stillShips.map(ship => [ship.screenX, ship.frame]),
    'Reduced Motion holds decorative flying traffic in place');
  const reducedCity=cityKeys
    .map(key=>{
      const entry=roadArt.find(item=>item.key===key);
      return entry.x-(1920-entry.width)/2;
    });
  assert(reducedCity.some((x,i)=>Math.abs(x-stillCity[i])>.1) &&
    Math.abs((reducedCity[2]-stillCity[2])/
      (reducedCity[0]-stillCity[0])-.90/.18)<.01,
  'Reduced Motion retains the road-following city camera while ships hold still');
  assert(roadArt.find(entry=>entry.key==='cacheMidCity').y<stillCityY,
    'Reduced Motion retains the close skyline arrival');
  B.Preferences = previousPreferences;
  assert.deepEqual(openingRects, [], 'the objective disappears between actionable lessons');
  mirrorFrame({ steer: -1 });
  assert(roadArt.some(entry => entry.key === 'cacheCarRight'), 'left steering uses the corrected visible turn');
  assert(Math.abs(contacts.at(-2).x + 164*.51) < .01 &&
    Math.abs(contacts.at(-2).y - (-119*.31+2)) < .01 &&
    Math.abs(contacts.at(-1).x - 164*.38) < .01 &&
    Math.abs(contacts.at(-1).y - (-119*.125+2)) < .01,
  'left steer anchors the high outer front tire and the lower rear tire separately');
  mirrorFrame({ steer: 1 });
  assert(roadArt.some(entry => entry.key === 'cacheCarLeft'), 'right steering uses the corrected visible turn');
  assert(Math.abs(contacts.at(-2).x + 164*.38) < .01 &&
    Math.abs(contacts.at(-2).y - (-119*.17+2)) < .01 &&
    Math.abs(contacts.at(-1).x - 164*.51) < .01 &&
    Math.abs(contacts.at(-1).y - (-119*.275+2)) < .01,
  'right steer anchors its near rear and raised outer front tire separately');
  assert.equal(mirrorFrame({ pulseFlashMs: 500 }), 1);
  assert.equal(mirrorFrame({ boostMs: 600 }), 2);
  assert.equal(mirrorFrame({ cutFlashMs: 500 }), 3);
  assert.equal(mirrorFrame({ stumbleMs: 650, integrity: 1 }), 4,
    'a hit overrides low signal during the collision');
  assert(roadArt.some(entry => entry.key === 'cacheCarHit'), 'collision uses its jolt pose');
  assert.equal(mirrorFrame({ integrity: 1 }), 5);
  mirrorFrame({ integrity: 3 });
  assert(!roadArt.some(entry => entry.key === 'cacheDamagedExhaust'),
    'an intact car never draws damage smoke');
  const idleGlare=roadArt.filter(entry=>entry.key==='cacheBrakeReflection').at(-1);
  mirrorFrame({ braking: true, integrity: 3 });
  const brakeGlare=roadArt.filter(entry=>entry.key==='cacheBrakeReflection').at(-1);
  assert(brakeGlare.alpha > idleGlare.alpha*4 &&
    drawOrder.lastIndexOf('cacheBrakeReflection') < drawOrder.lastIndexOf('cacheCar'),
    'braking brightens road reflection behind the car instead of covering it');
  assert.equal(drawOrder.filter(item=>item==='brakingTireTrack').length,6,
    'the brake input lays two short broken road tracks');
  mirrorFrame({ integrity: 2 });
  const mildSmoke=roadArt.find(entry=>entry.key==='cacheDamagedExhaust');
  assert(mildSmoke && !drawOrder.includes('brakingTireTrack'),
    'one lost integrity leaves a small exhaust trace without permanent skid marks');
  mirrorFrame({ integrity: 1 });
  const severeSmoke=roadArt.find(entry=>entry.key==='cacheDamagedExhaust');
  assert(severeSmoke.alpha > mildSmoke.alpha && severeSmoke.width > mildSmoke.width,
    'critical damage is more visible than one lost integrity');
  mirrorFrame({ integrity: 1, stumbleMs: 650 });
  assert(!roadArt.some(entry=>entry.key==='cacheDamagedExhaust') &&
    roadArt.some(entry=>entry.key==='cacheImpactGrit'),
    'the original impact burst owns the first instant of a collision');
  mirrorFrame({ ramMs: 1180, shield: 1, messageMs: 1100,
    message: 'PUSH // BREAKAWAY +8 BARS' });
  const armedLabel=hudLines.find(line=>/BRACE READY/.test(line.value));
  const pickupLabel=hudLines.find(line=>/BREAKAWAY \+8 BARS/.test(line.value));
  assert.match(armedLabel.value, /PUSH 1\.2s.*BRACE READY/);
  assert(pickupLabel && armedLabel.y+14 < pickupLabel.y-17,
    'armed Push/Brace stays readable alongside its transient pickup message');
  mirrorFrame({ progress: 60 });
  assert.deepEqual(openingRects, [[875, 82]], 'the opening panel remains compact');
  mirrorFrame({ progress: 130 });
  assert(drawOrder.includes('cachePulsePad') && drawOrder.includes('cachePulseStrip') &&
    drawOrder.includes('cacheFreight'));
  assert(drawOrder.indexOf('cachePulseStrip') < drawOrder.indexOf('cacheFreight'),
    'illustrated road paint is composited beneath physical traffic');
  assert(roadSource.includes('depth(d-PAD_EARLY),stripFar=depth(d+PAD_LATE)'),
    'the visible strip spans the same world-space input range as catchPulse');
  const phrase={lane:0,startBeat:32,endBeat:64};
  mirrorFrame({progress:385,musicBeatFloat:32,captures:[],queuedCaptures:[phrase]});
  assert(!drawOrder.includes('cacheConfirmedBar') &&
    drawOrder.includes('cachePhraseStrip'),
    'an unconfirmed phrase keeps a subdued preview');
  mirrorFrame({progress:385,musicBeatFloat:32,captures:[phrase],queuedCaptures:[]});
  const confirmed=roadArt.filter(entry=>entry.key==='cacheConfirmedBar');
  assert.equal(confirmed.length,8,'exactly four confirmed bar tiles map as two road triangles each');
  assert.equal(litRunways.length,1,'one continuous lane wash joins the four painted bars');
  assert(litRunways[0][12].y-litRunways[0][0].y>200 &&
    confirmed.every(entry=>entry.alpha===.68 && entry.projected?.length===6) &&
    drawOrder.indexOf('cacheConfirmedBar')<drawOrder.indexOf('cacheFreight'),
    'the confirmed stretch follows road depth and stays beneath traffic');
  mirrorFrame({ progress: 130, pulseFlashMs: 500 });
  assert(drawOrder.includes('cachePulseBurst'),
    'a successful catch gets its own brief painted HUD burst');
  mirrorFrame({ progress: 130, lanePos: 0, visualLane: 0, musicBeatFloat: 2 });
  const waitingIcon = roadArt.find(entry => entry.key === 'cachePulseSurge' && entry.x === 1375);
  assert(hudLines.some(line => /HIT ON 4/.test(line.value)),
    'the button cue names the target beat while the pad is in range');
  mirrorFrame({ progress: 130, lanePos: 0, visualLane: 0, musicBeatFloat: 3 });
  const pressIcon = roadArt.find(entry => entry.key === 'cachePulseSurge' && entry.x === 1375);
  assert(pressIcon.width > waitingIcon.width &&
    hudLines.some(line => /PRESS!/.test(line.value)),
  'on the fourth beat the action icon swells and the prompt changes to PRESS');
  mirrorFrame({ progress: 130 });
  const visibleBeforeCatch = drawOrder.filter(item => item === 'cachePulsePad').length;
  mirrorFrame({ progress: 130, caughtPulses: { '0/0/0': true } });
  assert.equal(drawOrder.filter(item => item === 'cachePulsePad').length, visibleBeforeCatch,
    'a caught fixed marking stays visible until it passes under the car');
  mirrorFrame({ progress: 190, caughtPulses: { '0/0/0': true } });
  assert.equal(drawOrder.filter(item => item === 'cachePulsePad').length, visibleBeforeCatch - 2,
    'the caught marking leaves only after it has passed the car');
  road.state = liveState; B.PresentationAssets = oldArt;
  assert.match(road.openingCue()[0], /ROAD PADS ARE SAFE/,
    'the first prompt distinguishes safe music pickups from traffic');
  assert.equal(profile.judgmentRules[0].id, 'road-pulse');
  const beatSec = 60 / 128;
  const padWindow = /const PAD_EARLY = (\d+), PAD_LATE = (\d+);/.exec(roadSource);
  assert(padWindow, 'the painted road zone has explicit world-distance bounds');
  const [early, late] = padWindow.slice(1).map(Number);
  const fourthPeriod = 4 * beatSec, judgmentSec = .185;
  for(const speed of [18,23,36,54,68,75]) {
    const crossingSec=(early+late)/speed;
    for(let phase=0;phase<fourthPeriod;phase+=.025) {
      const nextFourth=fourthPeriod-phase;
      assert(nextFourth>=judgmentSec && nextFourth<=crossingSec-judgmentSec ||
        nextFourth+fourthPeriod>=judgmentSec &&
        nextFourth+fourthPeriod<=crossingSec-judgmentSec,
      `the complete fourth-beat input window must fit in the pad at ${speed} road units/s`);
    }
  }
  const beforeSpeedProbe=road.state;
  road.state=copy(liveState);
  road.state.lane=road.state.lanePos=road.state.visualLane=0;
  road.state.speed=75;
  road.state.progress=150-(150-75*.55);
  assert(road.catchPulse('road_a',7*beatSec),
    'a top-speed driver can catch beat four while on the painted approach');
  road.state=beforeSpeedProbe;
  const face = (key, beat, lane, at, speed = 54, offset = 0) => {
    road.state.lane = road.state.lanePos = road.state.visualLane = lane;
    road.state.speed = speed; road.state.progress = at - 30;
    audio.context.currentTime = beat * beatSec + offset;
    road.handleActions({ [key]: { pressed: true, presses: [{ audioTimeSec: audio.context.currentTime }] } });
    road.update(100);
  };
  audio.context.currentTime = 3 * beatSec - .25;
  road.state.lane = road.state.lanePos = 1; road.update(100);
  assert.equal(road.state.captures.length, 0, 'holding a lane without a timed pulse earns no music');
  for (const beat of [0, 1, 2, 4]) {
    face('road_a', beat, 0, 150);
    assert.equal(road.state.captures.length, 0,
      `a precise tap on beat ${beat + 1} cannot claim the road pad`);
    assert.equal(road.state.caughtPulses['0/0/0'], undefined,
      'off-beat presses must leave the pad available for beat four');
  }
  face('road_a', 3, 0, 150);
  assert.deepEqual(copy(road.state.captures.map(c => [c.lane,c.startBeat,c.endBeat])), [[0,3,35]],
    'the first fixed road pad earns eight bars on a played beat');
  assert.equal(road.state.surgeMs > 0, true, 'A pulse gives a short speed surge');
  assert.equal(road.mixSnapshot().bonusVocal, false, 'a single part does not signal crew vocals');
  const firstScore = road.state.score;
  face('road_a', 3, 0, 150);
  assert.equal(road.state.score, firstScore, 'one pulse cannot be paid twice by a repeated press');
  road.state.progress = 401; road.state.lanePos = 1;
  assert.equal(road.catchPulse('road_x', 11 * beatSec), false,
    'a missed road pad does not wait for a later song beat or follow the car');
  face('road_x', 11, 0, 365);
  assert.equal(road.state.shield, 0, 'a button press in the wrong lane is harmless');
  face('road_x', 11, 1, 365, 54, .22);
  assert.equal(road.state.captures.length, 1, 'a late press outside the window earns no part');
  face('road_x', 11, 1, 365);
  assert.equal(road.state.shield, 1, 'X provides one defensive brace');
  assert.equal(road.state.captures.find(c => c.lane === 1).endBeat, 75,
    'the next pad in the same run holds its part for sixteen bars');
  const echoBefore = road.state.echoEnergy;
  face('road_y', 19, 3, 585, 30);
  assert(road.state.echoEnergy >= Math.min(100, echoBefore + 65),
    'a slow Y catch combines its refill with the deliberate slow-speed bonus');
  face('road_b', 27, 2, 810, 63);
  assert(road.state.ramMs > 0 && road.state.score > firstScore + 100,
    'B arms a traffic push and fast pulses score more');
  assert.equal(road.state.captures.length, 4, 'the first planned run can reach all four parts');
  assert.equal(road.state.peakStack, 4);
  assert.equal(road.state.fullAdrenalineCount, 1);
  assert.equal(road.mixSnapshot().bonusVocal, true, 'the future vocal gate follows four live parts');
  assert(B.musicDirector.apply(audio));
  assert.equal(B.musicDirector.getVolume('cache-undercurrent'), .62,
    'the fourth earned stem is present in the actual director mix');
  road.state.speed = 54; road.handleActions({ move_up: { held: true } }); road.update(100);
  assert(road.state.speed > 54, 'up throttle changes road speed');
  road.handleActions({ move_down: { held: true } }); road.update(100);
  assert(road.state.speed < 57, 'down braking lowers speed');
  const integrityBefore = road.state.integrity;
  road.hit('van');
  assert.equal(road.state.integrity, integrityBefore, 'PUSH consumes an impact offensively');
  assert.equal(road.state.ramMs, 0);
  road.hit('van');
  assert.equal(road.state.integrity, integrityBefore, 'BRACE consumes one later impact');
  assert.equal(road.state.shield, 0);
  const busBeforeHit = busEvents.length;
  road.hit('van');
  const hitBusEvents = busEvents.slice(busBeforeHit);
  assert.equal(road.state.captures.length, 0);
  assert.equal(road.state.fullAdrenaline, false);
  assert.equal(road.state.hitRecovery, true);
  assert.equal(road.state.stumbleMs, 650);
  assert(hitBusEvents.some(event => event.v === 0), 'an unprotected hit drops the music bus');
  const recoveredAt = hitBusEvents.find(event => event.v === .8)?.at;
  assert(Number.isFinite(recoveredAt), 'the bus recovers after the stumble');
  const recoveredBeat = B.MusicTransport.sample(recoveredAt).grid.beatFloat;
  assert(Math.abs(recoveredBeat - Math.round(recoveredBeat)) < .001,
    'the bus returns on the unchanged song beat');
  assert(B.musicDirector.apply(audio));
  assert.equal(B.musicDirector.getVolume('cache-pressure'), .60, 'the drum clock survives the hit');
  assert.equal(B.musicDirector.getVolume('cache-drive'), 0, 'the music part drops out, rather than merely getting quieter');
  const recoveryScore = road.state.score, recoveryEcho = road.state.echoEnergy;
  road.cleanPass(false);
  assert.equal(road.state.score, recoveryScore, 'invulnerability cannot report a clean traffic pass');
  assert.equal(road.state.echoEnergy, recoveryEcho);
  face('road_y', 35, 2, 1260);
  assert.equal(road.state.captures.length, 1, 'a safe pulse gives a quick way back after a hit');
  // A lane-centered adjacent pass counts despite small natural steering drift.
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 185; road.state.speed = 54;
  road.state.lane = 2; road.state.lanePos = 2.2;
  const nearScore = road.state.score;
  audio.context.currentTime = .1; road.handleActions({}); road.update(100);
  assert.equal(road.state.integrity, 3);
  assert(road.state.score >= nearScore + 25 && road.state.nearMisses === 1,
    'an adjacent pass with 0.2 lane steering drift counts and is reported');
  assert.match(road.state.message, /NEAR MISS/);
  assert.equal(road.state.captures.length, 0, 'traffic proximity alone does not catch a music pulse');
  // Drive the opening route with ordinary steering and the real road update;
  // teleporting lane state alone would hide an impossible chart.
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  const route = [[150,0,'road_a'],[365,1,'road_x'],[585,3,'road_y'],
    [810,2,'road_b']];
  let routeIndex = 0;
  for (let frame = 1; frame <= 900 && road.state.progress < 835; frame++) {
    audio.context.currentTime = frame * .025;
    const next = route[routeIndex];
    // The freight immediately after the first pad and before the fourth
    // require holding the safe lane until their crossing is behind the car.
    const goal = routeIndex === 1 && road.state.progress < 205 ? 0 :
      routeIndex === 3 && road.state.progress < 650 ? 3 : next?.[1] ?? 2;
    const steer = goal - road.state.lanePos;
    const actions = { move_left: { held: steer < -.10 },
      move_right: { held: steer > .10 } };
    if (next && next[0] - road.state.progress <= 105 &&
      next[0] - road.state.progress >= -30 &&
      Math.abs(steer) <= .38 &&
      Math.abs(audio.context.currentTime / beatSec -
        Math.round(audio.context.currentTime / beatSec)) <= .04 &&
      Math.round(audio.context.currentTime / beatSec) % 4 === 3) {
      actions[next[2]] = { pressed: true, presses: [{ audioTimeSec: audio.context.currentTime }] };
      routeIndex++;
    }
    road.handleActions(actions); road.update(25);
  }
  assert.equal(routeIndex, route.length, 'all planned pads are reachable with the road and music clocks');
  assert.equal(road.state.integrity, 3, 'the opening rhythm route also clears actual traffic');
  assert.equal(road.state.peakStack, 4, 'steering between real safe pulses can reach full adrenaline');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 1190; road.state.lanePos = road.state.visualLane = road.state.lane = 2;
  road.state.speed = 54;
  const laterRun = [[1260,2,'road_y'],[1490,1,'road_a'],[1720,0,'road_x'],
    [1895,3,'road_b']];
  let laterIndex = 0;
  for (let frame = 1; frame <= 650 && road.state.progress < 1920; frame++) {
    audio.context.currentTime = 20 + frame * .025;
    const next = laterRun[laterIndex];
    const goal = laterIndex === 1 && road.state.progress < 1335 ? 2 :
      laterIndex === 2 && road.state.progress < 1525 ? 1 : next?.[1] ?? 3;
    const steer = goal - road.state.lanePos;
    const actions = { move_left: { held: steer < -.10 },
      move_right: { held: steer > .10 } };
    if (next && next[0] - road.state.progress <= 105 &&
      next[0] - road.state.progress >= -30 && Math.abs(steer) <= .38 &&
      Math.abs(audio.context.currentTime / beatSec -
        Math.round(audio.context.currentTime / beatSec)) <= .04 &&
      Math.round(audio.context.currentTime / beatSec) % 4 === 3) {
      actions[next[2]] = { pressed: true, presses: [{ audioTimeSec: audio.context.currentTime }] };
      laterIndex++;
    }
    road.handleActions(actions); road.update(25);
  }
  assert.equal(laterIndex, laterRun.length, 'the second planned run offers four distinct parts');
  assert.equal(road.state.integrity, 3, 'the second run navigates real gates and traffic');
  assert.equal(road.state.peakStack, 4, 'the later run still reaches the vocal gate');
  // The new silhouettes have distinct, authored collision and draft behavior.
  const crossAt = (at, lane) => {
    road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
    assert(road.retry());
    road.state.progress = at - 1; road.state.lanePos = road.state.lane = lane;
    road.state.speed = 54; road.state.invulnerableMs = 0; road.state.boostMs = 0;
    audio.context.currentTime = 10; road.handleActions({}); road.update(100);
    return road.state.integrity;
  };
  assert.equal(crossAt(735,1),2,'signal trike has visibly cut from lane zero into lane one');
  assert.equal(crossAt(735,0),3,'the trike leaves its starting lane open after the cue');
  assert.equal(crossAt(465,3),2,'sweeper occupies its marked adjacent lane at crossing');
  assert.equal(crossAt(465,2),3,'the sweeper vacates its original lane');
  assert.equal(crossAt(465+2460,2),2,'rotated sweeper merges inward from the right edge');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 1150; road.state.lanePos = road.state.lane = 3;
  road.state.speed = 54; road.state.boost = 0;
  for(let frame=0;frame<6;frame++) {
    audio.context.currentTime = 23 + frame*.1;
    road.handleActions({});road.update(100);
  }
  assert.equal(road.state.boost,1,'a close shuttle draft charges Turbo');
  assert.match(road.state.message,/SHUTTLE DRAFT/);
  archive.checkpoint(roadStart);
  // A three-lane gate leaves a visible open route, but camping in one of its
  // blocked lanes still costs integrity. Both cases use production collision.
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 970; road.state.lanePos = road.state.lane = 0;
  road.state.speed = 54; road.state.invulnerableMs = 0;
  audio.context.currentTime = 20; road.handleActions({}); road.update(100);
  assert.equal(road.state.integrity, 3, 'gate at 975 leaves lane zero open');
  road.state.progress = 970; road.state.lanePos = road.state.lane = 1;
  road.state.speed = 54; road.state.invulnerableMs = 0;
  road.state.nearMisses = 1; road.state.boost = 0;
  const gateScore = road.state.score, gateEcho = road.state.echoEnergy;
  const gateZone = road.state.lockEnergy;
  audio.context.currentTime += .1; road.handleActions({}); road.update(100);
  assert.equal(road.state.integrity, 2, 'the paired traffic blocks lane one');
  assert.equal(road.state.score, gateScore, 'the neighboring gate vehicle pays no pass after contact');
  assert.equal(road.state.echoEnergy, gateEcho);
  assert.equal(road.state.lockEnergy, gateZone);
  assert.equal(road.state.nearMisses, 0);
  assert.equal(road.state.boost, 0, 'a gate collision cannot grant Turbo from a prior near miss');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 970; road.state.lanePos = road.state.lane = 2;
  road.state.speed = 54; road.state.invulnerableMs = 0;
  road.state.musicBar = 10; road.state.scoredThrough = 9;
  road.state.boost = 0;
  const secondGateScore = road.state.score;
  audio.context.currentTime = 20; road.handleActions({}); road.update(100);
  assert.equal(road.state.integrity, 2, 'lane two collides with the paired gate');
  assert.equal(road.state.score, secondGateScore,
    'an earlier neighbor is not rewarded before a later vehicle at the same crossing hits');
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  for (let frame = 1; frame <= 300 && road.status === 'playing'; frame++) {
    audio.context.currentTime = frame / 10;
    road.handleActions({ inspect: { pressed: true } }); road.update(100);
  }
  assert.equal(road.status, 'failed', 'camping a lane cannot survive the authored traffic');
  assert(road.state.musicBar <= 14 && road.state.peakStack < 4,
    'RB spam and passive camping cannot build a four-lane multiplier');
  audio.context.currentTime = 0; assert(road.retry());
  road.state.progress = 980; road.state.lane = road.state.lanePos = 0;
  road.state.echoEnergy = 100;
  road.sendEcho();
  audio.context.currentTime = 18.2;
  road.handleActions({ move_right: { held: true } }); road.update(100);
  assert.equal(road.state.audits[1135], 0,
    'Echo draws the approaching audit into its lane before the driver splits away');
  assert.equal(road.state.echoEnergy, 0, 'the decoy is a charged tactical choice');
  road.state.progress = 500; road.state.boost = 1;
  assert.match(road.openingCue()[1], /SPACE/);
  road.handleActions({ road_turbo: { pressed: true } });
  assert.equal(road.state.boostMs, 1250);
  assert.doesNotMatch(road.openingCue()[1], /Press SPACE/,
    'the Turbo prompt leaves after the real input spends the burst');
  // The first marker is a repeatable road lesson: it saves a ready Echo, and
  // the audit follows the actual decoy before the driver leaves that lane.
  road.status = road.state.status = 'failed'; audio.context.currentTime = 0;
  assert(road.retry());
  road.state.progress = 845; road.state.lane = road.state.lanePos = road.state.visualLane = 0;
  road.state.speed = 54; road.state.echoEnergy = 0;
  audio.context.currentTime = 19;
  road.handleActions({}); road.update(100);
  assert(road.state.progress >= 850 && road.state.echoEnergy === 100);
  const firstMarker = copy(C.readResume());
  assert.equal(firstMarker.checkpointId, 'road-cache');
  assert(road.validate(firstMarker), 'the first authored road marker must reload from Continue');
  assert.equal(firstMarker.levelState.proof.echoEnergy, 100);
  assert.match(road.openingCue()[1], /Press H/);
  const oldSettings = B.ControllerSettings, oldGamepad = B.GamepadUI;
  B.GamepadUI = { connected: true };
  B.ControllerSettings = { button(i) { return { 4: 'L1', 5: 'R1' }[i]; } };
  assert.match(road.openingCue()[1], /R1/,
    'the road prompt respects a connected controller binding');
  B.ControllerSettings = oldSettings; B.GamepadUI = oldGamepad;
  road.handleActions({ road_echo: { pressed: true } });
  assert.equal(road.state.echo.durationMs, 6000);
  assert.doesNotMatch(road.openingCue()[1], /Press H/);
  for (let frame = 0; frame < 27 && road.state.progress < 978; frame++) {
    audio.context.currentTime += .1;
    road.handleActions({ move_left: { held: true } }); road.update(100);
  }
  assert.equal(road.state.integrity, 3, 'holding the left gap passes the three-wide block');
  assert.equal(road.state.audits[1135], 0,
    'the audit commits to the Echo from the reachable first marker');
  assert.match(road.openingCue()[0], /FOLLOWED YOUR ECHO/);
  for (let frame = 0; frame < 30 && road.state.progress < 1137; frame++) {
    audio.context.currentTime += .1;
    road.handleActions({ move_right: { held: road.state.lanePos < 1.15 } }); road.update(100);
  }
  assert.equal(road.state.integrity, 3, 'leaving the Echo lane safely clears the first audit');
  assert(road.restore(firstMarker));
  assert.equal(road.state.echoEnergy, 100, 'Continue restores the first Echo opportunity');
  assert.match(road.openingCue()[1], /Press H/);
  road.state.progress = 1710;
  assert.equal(road.openingCue(), null, 'opening instructions end after the first stretch');
  archive.checkpoint(roadStart);
  road.status = road.state.status = 'failed';
  audio.context.currentTime = 0;
  assert(road.retry());
  road.state.invulnerableMs = 1000000;
  const visited = new Set(); let sent = false, minLane = 3, maxLane = 0;
  let verseFourSave, firstForkSave;
  for (let frame = 1; frame <= 1880 && road.status === 'playing'; frame++) {
    audio.context.currentTime = frame / 10;
    road.handleActions({ move_left: { held: frame < 36 },
      move_right: { held: frame >= 36 && frame < 86 || sent && road.state.lanePos < 2.95 } });
    road.update(100);
    minLane = Math.min(minLane, road.state.lanePos);
    maxLane = Math.max(maxLane, road.state.lanePos);
    if (!firstForkSave && road.state.progress >= 1700 && road.state.progress < 1710)
      firstForkSave = copy(C.readResume());
    if (road.state.musicBar === 28 || road.state.musicBar === 52 || road.state.musicBar === 76)
      visited.add(road.state.musicBar);
    if (road.state.musicBar === 76 && !verseFourSave) verseFourSave = copy(C.readResume());
    if (road.state.gateAt != null && !sent && road.state.progress >= road.state.gateAt - 200) {
      road.state.lanePos = road.state.lane = 0; road.state.trace = [{ steer: 0, duration: 1500 }];
      road.sendEcho(); road.state.lanePos = road.state.lane = 3; sent = true;
    }
  }
  assert.deepEqual([...visited], [28, 52, 76], 'the road spans all four verses and choruses');
  assert.equal(firstForkSave.checkpointId, 'road-fork');
  assert(road.validate(firstForkSave), 'the second road marker also remains a valid Continue save');
  assert(minLane < .1 && maxLane > 2.8, 'real steering traverses both sides while music continues');
  assert(sent && road.state.gateOpen, `the final chorus offers a reachable Echo exit: ${JSON.stringify({ sent, progress: road.state.progress, gateAt: road.state.gateAt, gateFailure: road.state.gateFailure, bar: road.state.musicBar, status: road.status })}`);
  assert.equal(road.status, 'clear', 'the run finishes when the complete recording ends');
  assert.equal(C.readResume().checkpointId, 'road-clear');
  assert(!archive.record.progress.completedLevels.includes('level-02'));
  assert.deepEqual(copy(archive.record.progress.items), ['stem.voice']);
  assert.equal(verseFourSave.checkpointId, 'road-verse-4');
  assert(verseFourSave.levelState.proof.score > 0, 'a checkpoint preserves the earned score');
  archive.checkpoint(verseFourSave);
  assert(road.restore(verseFourSave));
  assert.equal(road.state.score, verseFourSave.levelState.proof.score);
  assert.equal(road.state.captures.length, 0, 'phrase locks restart cleanly at a checkpoint');
  assert.equal(road.startOffsetSec(), 76 * 1.875);
  road.status = road.state.status = 'failed';
  assert(road.retry());
  assert.equal(B.MusicTransport.sample(audio.context.currentTime).sourceOffsetTrackSec, 76 * 1.875,
    'retry seeks all parts and the clock together to the verse checkpoint');

  const legacy = { levelId: 'level-02', checkpointId: 'road-cache', levelState: {
    proofVersion: 2, returnTo: parentSave(), proof: { progress: 850, lane: 1,
      lanePos: 1, locked: [1, 2, 3], integrity: 2, speed: 54,
      timeMs: 30000, lockEnergy: 10, echoEnergy: 50 } } };
  assert(road.validate(legacy));
  assert(road.restore(legacy));
  assert.deepEqual(copy(road.state.captures), []);
  assert.equal(road.state.lockEnergy, 100, 'indefinite old locks refund into the bar-seal meter');
  assert.equal(road.state.musicBar, 8);
  assert.equal(road.startOffsetSec(), 15);
  const v1 = copy(legacy);
  v1.levelState.proofVersion = 1;
  v1.levelState.proof.locked = [0, 1];
  assert(road.validate(v1) && road.restore(v1));
  assert.equal(road.state.lockEnergy, 100);
  const v3 = copy(verseFourSave);
  v3.levelState.proofVersion = 3;
  v3.levelState.proof.locked = [0, 2];
  delete v3.levelState.proof.score;
  delete v3.levelState.proof.peakStack;
  delete v3.levelState.proof.cleanBars;
  assert(road.validate(v3) && road.restore(v3));
  assert.equal(road.state.lockEnergy, 100);
  assert.equal(road.state.score, 0);
  console.log('Cache Road: safe timed four-face pulses, four-part route, speed and ability rewards, protected and unprotected traffic, full song, final Echo and old saves passed.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
