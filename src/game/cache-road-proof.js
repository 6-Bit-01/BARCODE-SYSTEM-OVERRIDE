// Cache Back chase slice. It shares the existing input/RAF/audio/save/pause
// owners and awards no Level 2 campaign facts.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/cache-road-proof.js', exports: ['BARCODE.CacheRoadProof'], dependencies: ['BARCODE.Campaign', 'BARCODE.MusicTransport'] });
(function(B) {
  'use strict';
  const ID = 'level-02', PROFILE = 'level-02.proof';
  const LAP = 2460, END = 4 * LAP, GATE = 3 * LAP + 2060;
  const BAR_BEATS = 4, PULSE_BEATS = 32;
  // 175 road units at the 75-unit/s ceiling gives 2.33 s in reach: a full
  // fourth-beat cycle (1.875 s) plus both 185 ms judgment margins.
  const PAD_EARLY = 145, PAD_LATE = 30;
  const LANES = ['DRIVE', 'FLOW', 'BREAKAWAY', 'UNDERCURRENT'];
  const PULSE_ACTIONS = [
    { key: 'road_a', label: 'SURGE', button: 0, keyboard: 'K' },
    { key: 'road_b', label: 'PUSH', button: 1, keyboard: 'L' },
    { key: 'road_x', label: 'BRACE', button: 2, keyboard: 'J' },
    { key: 'road_y', label: 'REFILL', button: 3, keyboard: 'I' }
  ];
  // Two planned runs per lap, with breathing room between them. Each run
  // visits all four lanes; the road and traffic rotate together on later laps.
  // The markings stay at these world positions even when the driver brakes.
  const PULSE_RUNS = [
    [[150,0,0],[365,1,2],[585,3,3],[810,2,1]],
    [[1260,2,3],[1490,1,0],[1720,0,2],[1895,3,1]]
  ];
  const PULSES = Array.from({ length: 5 }, (_, pass) =>
    PULSE_RUNS.flatMap((run, runIndex) => run.map(([at, lane, action], order) => ({
      at: at + pass * LAP, lane: (lane + pass) % 4, action,
      id: `${pass}/${runIndex}/${order}`, run: `${pass}/${runIndex}`, order
    })))).flat();
  const CHECKPOINTS = { 'road-start': 0, 'road-cache': 850, 'road-fork': 1700,
    'road-verse-2': 28, 'road-verse-3': 52, 'road-verse-4': 76,
    'road-gate': 92, 'road-clear': 100 };
  const TRAFFIC = [
    [190, 1, 'freight'], [275, 2, 'van'], [350, 0, 'block'], [465, 2, 'sweeper'],
    [550, 1, 'block'], [635, 2, 'freight'], [735, 0, 'trike'], [895, 3, 'block'],
    [975, 1, 'freight'], [1050, 2, 'block'], [1135, 0, 'audit'], [1220, 3, 'shuttle'],
    [1320, 1, 'block'], [1415, 2, 'sweeper'], [1510, 0, 'freight'], [1610, 3, 'van'],
    [1765, 1, 'freight'], [1840, 2, 'block'], [1930, 0, 'trike'], [2005, 1, 'sweeper'],
    [2170, 2, 'audit'], [2265, 0, 'block'], [2345, 1, 'freight']
  ];
  // Paired traffic narrows the route at readable, repeatable places. Its open
  // lanes rotate each pass; a driver can always plan a route from the horizon.
  const GATES = { 550: [2], 975: [2, 3], 1320: [0], 1840: [1], 2005: [3], 2345: [2] };
  const HAZARDS = TRAFFIC.flatMap(([at, lane, kind]) => Array.from({ length: 5 }, (_, pass) => [
    { at: at + pass * LAP, lane: (lane + pass) % 4, kind },
    ...(GATES[at] || []).map(extra => ({ at: at + pass * LAP,
      lane: (extra + pass) % 4, kind: 'block' }))
  ]).flat());
  // Each whole painting is a single world site. The open parking surface is
  // constructed on the projected ground instead of using a fixed bitmap slab.
  const PLACE_ART = {
    market: ['cachePlaceMarket',960,876,700,150],
    house: ['cachePlaceHouse',960,891,700,135],
    garage: ['cachePlaceGarage',960,632,700,175],
    apartment: ['cachePlaceApartment',631,960,490,135],
    diner: ['cachePlaceDiner',960,618,700,170],
    park: ['cachePlacePark',960,640,650,165],
    substation: ['cachePlaceSubstation',960,638,680,185],
    garden: ['cachePlaceGarden',960,800,620,190],
    construction: ['cachePlaceConstruction',960,640,650,195]
  };
  // A site keeps one whole painting with a side-specific ground silhouette.
  // The first six are already painted for their assigned bank. The later
  // five cyber sources turn as a whole for the right; two more are fitted
  // directly to the left bank.
  const SIDE_VARIANTS = {
    gardenRounded: {kind:'garden',side:-1,art:['cachePlaceGardenRounded',960,646,620]},
    gardenCompact: {kind:'garden',side:-1,art:['cachePlaceGardenCompact',960,793,620]},
    gardenHorizon: {kind:'garden',side:1,art:['cachePlaceGardenHorizon',960,540,620]},
    constructionRounded: {kind:'construction',side:-1,art:['cachePlaceConstructionRounded',960,585,650]},
    constructionHorizon: {kind:'construction',side:1,art:['cachePlaceConstructionHorizon',960,585,650]},
    constructionCompact: {kind:'construction',side:1,art:['cachePlaceConstructionCompact',960,692,650]},
    signalOrchard: {kind:'garden',side:1,flip:true,art:['cachePlaceSignalOrchard',960,633,600]},
    relayExchange: {kind:'substation',side:1,flip:true,art:['cachePlaceRelayExchange',960,1420,360]},
    dataReclamation: {kind:'construction',side:1,flip:true,art:['cachePlaceDataReclamation',960,597,560]},
    capacitorExchange: {kind:'substation',side:1,flip:true,art:['cachePlaceCapacitorExchange',960,721,550]},
    nightDataMarket: {kind:'market',side:1,flip:true,art:['cachePlaceNightDataMarket',960,633,560]},
    encryptedPump: {kind:'substation',side:-1,flip:false,art:['cachePlaceEncryptedPump',960,637,550]},
    droneServiceNode: {kind:'garage',side:-1,flip:false,art:['cachePlaceDroneServiceNode',960,643,520]}
  };
  // Curated addresses replace their picture within the existing site cadence.
  // Some existing right-hand park/substation slots become a garden or yard;
  // the total number of locations and their positions do not change.
  const FEATURED_SITES = {
    '1:623':'relayExchange',
    '1:2685':'nightDataMarket',
    '-1:3138':'constructionRounded',
    '1:3635':'constructionHorizon',
    '-1:4460':'gardenRounded',
    '1:5055':'dataReclamation',
    '1:5829':'signalOrchard',
    '-1:6303':'gardenCompact',
    '-1:6511':'droneServiceNode',
    '1:7015':'constructionCompact',
    '-1:7427':'encryptedPump',
    '1:8158':'gardenHorizon',
    '1:8846':'capacitorExchange'
  };
  // The hydroponics gate is on the right of its curved bank. It faces the
  // left road directly and mirrors for the right road. The fabrication gate
  // and other places are painted on the left, except the repair garage.
  const placeFacesRoad = (kind, side) =>
    kind === 'garage' || kind === 'garden' ? side > 0 : side < 0;
  const PLACE_KINDS = [...Object.keys(PLACE_ART),'parking'];
  // Seeded choices keep the lots varied yet identical after pause, retry,
  // saved-road restore and frame-rate changes.
  const placeRandom = n => {
    let x = Math.imul(n ^ n >>> 16, 0x7feb352d);
    x = Math.imul(x ^ x >>> 15, 0x846ca68b);
    return ((x ^ x >>> 16) >>> 0) / 4294967296;
  };
  // Each bank gets its own fixed sequence of addresses. Short runs and long
  // open intervals happen independently; an occasional facing pair is kept
  // intentionally, rather than making every building arrive as a gate.
  const SIDE_PLACES = [];
  for(const side of [-1,1]) {
    let at=side<0?175:200, index=0;
    while(at<END+570) {
      const seed=(side+2)*9173+index*2411;
      if(side>0 && index>0 && index%7===3) {
        const across=SIDE_PLACES.reduce((best,place)=>
          Math.abs(place.at-at)<Math.abs((best?.at??Infinity)-at)?place:best,null);
        if(across && Math.abs(across.at-at)<140)
          at=across.at+Math.round((placeRandom(seed+6)-.5)*35);
      } else if(side>0 && index>0 && SIDE_PLACES.some(place=>
        Math.abs(place.at-at)<76)) at+=82;
      SIDE_PLACES.push({at:Math.round(at),side,index,seed,
        size:.86+placeRandom(seed+4)*.3,
        setback:index===0?(side<0?65:165):
          18+Math.round(placeRandom(seed+9)*245)});
      const gap=175+placeRandom(seed+17)*127+
        (placeRandom(seed+23)<.27?75+placeRandom(seed+29)*95:0);
      at+=gap;index++;
    }
  }
  SIDE_PLACES.sort((a,b)=>a.at-b.at);
  const lastKindAt = new Map();
  for(const place of SIDE_PLACES) {
    const choices=PLACE_KINDS.map((kind,k)=>({kind,
      score:placeRandom(place.seed+k*97)-
        Math.max(0,530-(place.at-(lastKindAt.get(kind)??-10000)))/530*2}));
    choices.sort((a,b)=>b.score-a.score);
    place.kind=place.index===0?(place.side<0?'market':'house'):choices[0].kind;
    lastKindAt.set(place.kind,place.at);
    delete place.index;delete place.seed;
  }
  for(const place of SIDE_PLACES) {
    const variantName=FEATURED_SITES[`${place.side}:${place.at}`];
    const variant=SIDE_VARIANTS[variantName];
    if(variant && variant.side===place.side) {
      place.kind=variant.kind;
      place.variant=variantName;
    }
  }
  SIDE_PLACES.sort((a,b)=>b.at-a.at);
  // Existing featured places own their parcels. Generate the modular blocks
  // around those addresses so one family cannot cover a special location or
  // cut a road mouth through its painted foundation.
  const LANDSCAPE = B.CacheRoadLandscape?.create(0x6b4d,END,SIDE_PLACES) ||
    {plates:[],streets:[],districts:[],owns:()=>false};
  // Six existing settings now occupy legal graph parcels in place of a
  // middle workshop card. Their people and props share those addresses.
  const INFILL_ART = [
    ['cacheTransitNook',1602,982,650],
    ['cacheOutskirtsHomes',2022,778,910],
    ['cacheUtilityCorner',1585,992,620],
    ['cacheGreenhouseWorkshop',1536,1024,700],
    ['cacheOutskirtsWorkshops',2022,778,910],
    ['cacheRepairShop',1389,1132,650]
  ];
  const VENDOR_ART=['cacheVendorStall',1391,1131,690];
  const INFILL_SCENES=LANDSCAPE.plates.filter(plate=>plate.key==='accent')
    .map((plate,index)=>({at:plate.at,side:plate.side,index,
      art:INFILL_ART.find(art=>art[0]===plate.art[0])}));
  // A deep-set featured site can leave an empty curb even though its own
  // building is present farther out. A smaller occupied frontage connects
  // that site to the road, without changing the established site address.
  const SATELLITE_SCENES=SIDE_PLACES.filter(place=>place.kind!=='parking' &&
    place.setback>145 && !INFILL_SCENES.some(scene=>scene.side===place.side &&
      Math.abs(scene.at-place.at)<130)).map(place=>({
        at:place.at,side:place.side,index:Math.floor(place.at/220),
        art:place.kind==='market'||place.kind==='diner' ? VENDOR_ART :
          place.kind==='construction'||place.kind==='substation' ? INFILL_ART[2] :
          place.kind==='garage' ? INFILL_ART[5] :
          place.kind==='park'||place.kind==='garden' ? INFILL_ART[3] : INFILL_ART[1]
      }));
  // Individual cutouts remain independent animation units. Context chooses
  // one local action, then passers-by are sampled without replacement.
  const PEDESTRIANS = [
    // A vendor customer painted into cacheVendorStall is about 340 source
    // pixels high. At that frontage's 690-unit width this is ~168 units;
    // its setback makes a 130–140 unit sidewalk walker read at the same size.
    ['cachePersonCourier',1036/1560,134],
    ['cachePersonMechanic',1036/1555,134],
    ['cachePersonUmbrella',1036/1534,134],
    ['cachePersonStudent',989/1547,134],
    ['cachePersonFoodWorker',1036/1559,134],
    ['cachePersonBicycleCourier',1481/1048,132],
    ['cachePersonSweeper',1199/1330,131],
    ['cachePersonHandheldPlayer',993/1560,134],
    ['cachePersonGardener',1217/1322,132],
    ['cachePersonElectrician',1238/1307,124],
    ['cachePersonWavingResident',1015/1503,134],
    ['cachePersonSkateboarder',1238/1319,131],
    ['cachePersonCrateCarrier',1263/1208,128],
    ['cachePersonBoardPlayer',1236/1302,120],
    ['cachePersonStreetCook',1293/1194,131],
    ...['Courier','Mechanic','MarketWorker','Student','Gardener','Resident']
      .flatMap(identity=>['Toward','Away'].map(direction=>
        [`cacheWalker${identity}${direction}`,1024/1536,132]))
  ];
  const WALKER_TRAVEL=['Courier','Mechanic','MarketWorker','Student',
    'Gardener','Resident'].map(identity=>`cacheWalker${identity}Travel`);
  const OTHER_TRAVEL={
    5:['cachePersonBicycleCourierTravel',4,220],
    11:['cachePersonSkateboarderTravel',4,170],
    12:['cachePersonCrateCarrierTravel',8,210]
  };
  const travels=id=>id>=15||OTHER_TRAVEL[id]!==undefined;
  function pedestrianTravel(item,s,reduced) {
    const id=item.id;
    if(!travels(id))return null;
    if(id>=15) {
      // Toward and away are authored views, not horizontally mirrored poses.
      const direction=(id-15)%2;
      const phase=reduced?0:Math.floor(((s.elapsedMs||0)+item.at*13)/210);
      return {key:WALKER_TRAVEL[Math.floor((id-15)/2)],
        frame:direction*4+((phase%4)+4)%4};
    }
    const [key,count,period]=OTHER_TRAVEL[id];
    const phase=reduced?0:Math.floor(((s.elapsedMs||0)+item.at*13)/period);
    return {key,frame:((phase%count)+count)%count};
  }
  const PASSERS=[0,1,2,3,4,5,7,10,11,12];
  const LOCAL_ACTIONS={
    market:[14,12,5],diner:[14,12,7],
    park:[13,8,11],garden:[8,13,10],
    garage:[9,6,12],substation:[9,6,12],
    construction:[12,9,6],parking:[5,6,12],
    house:[10,7,13],apartment:[10,7,13]
  };
  const STREET_PROPS={
    market:['cacheStreetBicycleRack','cacheStreetWorkSupplies','cacheStreetDataKiosk'],
    diner:['cacheStreetBicycleRack','cacheStreetBenchPlanters','cacheStreetDataKiosk'],
    park:['cacheStreetBenchPlanters','cacheStreetBicycleRack'],
    garden:['cacheStreetBenchPlanters','cacheStreetWorkSupplies'],
    garage:['cacheStreetWorkSupplies','cacheStreetDeliveryVan','cacheStreetBicycleRack'],
    substation:['cacheStreetDataKiosk','cacheStreetWorkSupplies'],
    construction:['cacheStreetWorkSupplies','cacheStreetDeliveryVan'],
    parking:['cacheStreetDeliveryVan','cacheStreetBicycleRack','cacheStreetDataKiosk'],
    house:['cacheStreetBenchPlanters','cacheStreetBicycleRack'],
    apartment:['cacheStreetBicycleRack','cacheStreetBenchPlanters']
  };
  const PROP_SHAPES={
    cacheStreetBicycleRack:[1526/1023,102],
    cacheStreetWorkSupplies:[1491/1039,104],
    cacheStreetDeliveryVan:[1498/1016,171],
    cacheStreetBenchPlanters:[1546/1040,104],
    cacheStreetDataKiosk:[1224/1318,142],
    cacheNewLampL:[1024/1536,146],cacheNewLampR:[1024/1536,146],
    cacheNewCrossingSignalL:[1024/1536,130],
    cacheNewCrossingSignalR:[1024/1536,130],
    cacheNewWayfindingSign:[1024/1536,141],
    cacheNewBinsRecycling:[1312/1199,83],
    cacheNewLoadingCrates:[1312/1199,91],
    cacheNewUtilityCabinet:[1246/1263,130],
    cacheNewVendorCart:[1312/1199,120],
    cacheNewFencePlanter:[1536/1024,86]
  };
  // Along-road addresses and distance from the curb both vary. Keeping
  // the group within one parcel gives pairs, knots and arcs instead of a row.
  const FRONT_FORMATIONS={
    1:[[0,0]],
    2:[[-19,-30],[17,35]],
    3:[[-32,6],[13,-49],[24,48]],
    4:[[-41,-15],[-8,52],[24,-47],[39,22]],
    5:[[-44,-13],[-18,53],[10,-52],[39,34],[2,5]]
  };
  const arrangePeople=(ids,center,base,seed,mirror=false)=>
    ids.map((id,i)=>{
      const [along,radial]=FRONT_FORMATIONS[ids.length][i];
      return {id,at:center+(mirror?-along:along),
        base:base+radial+Math.round((placeRandom(seed+id*79)-.5)*10),
        scale:1+placeRandom(seed+id*37)*.09,
        // Travel poses only face their authored direction. Planted people can
        // still be composed toward either side of a frontage.
        flip:travels(id)?false:placeRandom(seed+id*73)>.5};
    }).sort((a,b)=>b.at-a.at);
  // These are world addresses, generated once with a stable seed. Road
  // progress projects the same people and furniture as the ground and lane.
  const STREET_SCENES=[...SIDE_PLACES,...INFILL_SCENES.map(scene=>({
    at:scene.at,side:scene.side,kind:
      scene.art[0]==='cacheGreenhouseWorkshop'?'garden':
      scene.art[0]==='cacheOutskirtsHomes'?'house':
      scene.art[0]==='cacheTransitNook'?'parking':'garage',
    infill:true
  }))].map((anchor,index)=>{
    const seed=Math.round(anchor.at*17+anchor.side*987+index*173);
    const size=1+Math.floor(placeRandom(seed+3)*5);
    const local=LOCAL_ACTIONS[anchor.kind]||LOCAL_ACTIONS.house;
    const leader=local[Math.floor(placeRandom(seed+5)*local.length)];
    const pool=PASSERS.filter(id=>id!==leader)
      .sort((a,b)=>placeRandom(seed+a*131)-placeRandom(seed+b*131));
    const ids=[leader,...pool.slice(0,size-1)];
    // Shuffle the spatial order without changing who belongs to the group.
    ids.sort((a,b)=>placeRandom(seed+a*227+11)-placeRandom(seed+b*227+11));
    let center=anchor.at+Math.round((placeRandom(seed+13)-.5)*26);
    const nearbyMouth=LANDSCAPE.streets.find(street=>street.side===anchor.side &&
      Math.abs(street.at-center)<116);
    if(nearbyMouth)center=nearbyMouth.at+
      (center<nearbyMouth.at?-116:116);
    const people=placeRandom(seed+91)<.17?[]:
      arrangePeople(ids,center,340,seed,placeRandom(seed+7)>.5);
    const choices=STREET_PROPS[anchor.kind]||STREET_PROPS.house;
    const props=placeRandom(seed+57)<.20?[]:[{
      key:choices[Math.floor(placeRandom(seed+29)*choices.length)],
      at:center+(placeRandom(seed+43)<.5?-45:45),
      base:anchor.kind==='parking'?414:380,
      scale:.96+placeRandom(seed+47)*.15
    }];
    if(choices.length>2 && placeRandom(seed+61)<.23)props.push({
      key:choices[Math.floor(placeRandom(seed+67)*choices.length)],
      at:center+(props[0]?.at>center?-55:55),
      base:445,scale:.94+placeRandom(seed+71)*.13
    });
    return {at:anchor.at,side:anchor.side,kind:anchor.kind,people,
      props:props.sort((a,b)=>b.at-a.at)};
  }).sort((a,b)=>b.at-a.at);
  const DISTRICT_PROPS={
    market:['cacheNewVendorCart','cacheNewBinsRecycling'],
    homes:['cacheNewFencePlanter','cacheNewBinsRecycling'],
    workshop:['cacheNewLoadingCrates','cacheNewUtilityCabinet'],
    greenhouse:['cacheNewFencePlanter','cacheNewBinsRecycling'],
    data:['cacheNewUtilityCabinet','cacheNewWayfindingSign'],
    transit:['cacheNewWayfindingSign','cacheNewBinsRecycling']
  };
  // The graph fixes addresses first. Stable, separate directional cutouts
  // are sampled without replacing an identity within a group. These are
  // pedestrians on accessible parcel fronts, never part of a building card.
  const DISTRICT_SCENES=LANDSCAPE.chunks.filter((chunk,index)=>
    index%3===1 && LANDSCAPE.plates.some(plate=>plate.chunkId===chunk.id &&
      plate.tier==='front')).map((chunk,index)=>{
    const salt=chunk.seed+index*119;
    const size=1+Math.floor(placeRandom(salt+7)*5);
    const first=Math.floor(placeRandom(salt+11)*6);
    const ids=Array.from({length:size},(_,j)=>{
      const identity=(first+j)%6;
      const direction=placeRandom(salt+identity*67)>.5?0:1;
      return 15+identity*2+direction;
    });
    // A transparent front card can contain a real street mouth. Its lamps
    // sit at ±41, so keep the gathering on the parcel past the mouth.
    const onStreet=LANDSCAPE.streets.some(street=>
      street.side===chunk.side && street.at===chunk.frontAt);
    const mirror=placeRandom(salt+29)>.5;
    const center=chunk.frontAt+(onStreet?(mirror?108:-108):
      Math.round((placeRandom(salt+23)-.5)*28));
    const people=arrangePeople(ids,center,344,salt,mirror);
    const choices=DISTRICT_PROPS[chunk.family];
    const key=choices[Math.floor(placeRandom(salt+17)*choices.length)];
    return {at:chunk.frontAt,side:chunk.side,kind:chunk.family,people,
      props:[{key,at:center+(onStreet?(mirror?26:-26):(index%2?-54:54)),
        base:412,scale:1}]};
  });
  for(const street of LANDSCAPE.streets) {
    DISTRICT_SCENES.push({at:street.at,side:street.side,kind:street.family,
      people:[],props:[
        {key:street.side<0?'cacheNewLampL':'cacheNewLampR',
          at:street.at-41,base:280,scale:.94},
        {key:street.side<0?'cacheNewCrossingSignalL':'cacheNewCrossingSignalR',
          at:street.at+41,base:280,scale:.91}
      ]});
  }
  STREET_SCENES.push(...DISTRICT_SCENES);
  STREET_SCENES.sort((a,b)=>b.at-a.at);
  const STREET_ITEMS=STREET_SCENES.flatMap(scene=>
    [...scene.props,...scene.people].map(item=>({scene,item})))
    .sort((a,b)=>b.item.at-a.item.at);
  const clone = value => JSON.parse(JSON.stringify(value));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const smooth = value => {const t=clamp(value,0,1);return t*t*(3-2*t);};
  const roadPath = at => 200*Math.sin(at/700)+90*Math.sin(at/295+.5);
  const roadHeading = at => 200/700*Math.cos(at/700)+90/295*Math.cos(at/295+.5);
  function mirrorExpression(s) {
    if (s.stumbleMs > 0) return 4;
    if (s.integrity <= 1 || s.timeMs < 8000 || s.status === 'failed') return 5;
    if (s.boostMs > 0 || s.fullAdrenaline || s.status === 'clear') return 2;
    if (s.cutFlashMs > 0 || (s.messageMs > 0 && /NEAR MISS/.test(s.message))) return 3;
    if (s.pulseFlashMs > 0 || s.rivalWarning) return 1;
    return 0;
  }

  function mirrorOutline(ctx, x, y, w, h) {
    ctx.beginPath(); ctx.moveTo(x + 16, y); ctx.lineTo(x + w - 16, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + 16);
    ctx.lineTo(x + w - 7, y + h - 12);
    ctx.quadraticCurveTo(x + w - 9, y + h, x + w - 24, y + h);
    ctx.lineTo(x + 24, y + h);
    ctx.quadraticCurveTo(x + 9, y + h, x + 7, y + h - 12);
    ctx.lineTo(x, y + 16); ctx.quadraticCurveTo(x, y, x + 16, y);
    ctx.closePath();
  }

  // The reflection looks back along the same world centerline as the main
  // camera. A real mirror cancels the rear camera's horizontal reversal, so
  // the physical lane order stays left-to-right while motion runs away.
  function drawRearRoad(ctx, s, x, y, w, h, accent, reduced) {
    const progress = s.progress, reach = 440, horizon = y + 47, floor = y + h + 4;
    const profile = at => {
      const distance = clamp(progress - at, 0, reach);
      const t = 1 - distance/reach;
      const bend = roadPath(progress-distance)-roadPath(progress)+
        distance*roadHeading(progress);
      return { t, x: x + 475 + bend*.72, y: horizon+(floor-horizon)*t*t,
        half: 27+165*t };
    };
    const laneX = (lane,p) => p.x+(lane-1.5)*p.half/2;
    const far = profile(progress-reach);
    ctx.save(); ctx.filter = 'blur(2.3px)';
    ctx.fillStyle = accent; ctx.globalAlpha = .11;
    ctx.beginPath(); ctx.arc(x+425-(reduced?0:progress*.012)%55,y+31,29,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha = 1;
    const skylineShift = progress*.035%37;
    for(let i=-1;i<20;i++) {
      const bx=x+i*38-skylineShift, bh=15+((i*19+17)%5)*6;
      ctx.fillStyle=i%3?'#263c4a':'#344557';
      ctx.fillRect(bx,y+58-bh,33,bh);
      ctx.fillStyle='#f8cca4';ctx.globalAlpha=.2;
      ctx.fillRect(bx+8,y+50-bh,2,3);ctx.globalAlpha=1;
    }
    ctx.fillStyle='#274550';ctx.fillRect(x,horizon,w,floor-horizon);
    // The narrow sidewalks use the same curved bank as the rearward road.
    for(const side of [-1,1]) {
      ctx.fillStyle='#526373';ctx.beginPath();
      ctx.moveTo(far.x+side*(far.half+6),far.y);
      for(let i=1;i<=12;i++) {
        const p=profile(progress-reach*(1-i/12));
        ctx.lineTo(p.x+side*(p.half+6),p.y);
      }
      for(let i=12;i>=0;i--) {
        const p=profile(progress-reach*(1-i/12));
        ctx.lineTo(p.x+side*(p.half+34+12*p.t),p.y);
      }
      ctx.closePath();ctx.fill();
    }
    for(const side of [-1,1]) {
      ctx.fillStyle='#4e6070';ctx.beginPath();
      ctx.moveTo(far.x+side*far.half,far.y);
      for(let i=1;i<=12;i++) {
        const p=profile(progress-reach*(1-i/12));
        ctx.lineTo(p.x+side*p.half,p.y);
      }
      for(let i=12;i>=0;i--) {
        const p=profile(progress-reach*(1-i/12));
        ctx.lineTo(p.x+side*(p.half+6+9*p.t),p.y);
      }
      ctx.closePath();ctx.fill();
    }
    ctx.fillStyle='#192e39';
    ctx.beginPath();ctx.moveTo(far.x-far.half,far.y);
    for(let i=1;i<=12;i++) {
      const p=profile(progress-reach*(1-i/12));ctx.lineTo(p.x-p.half,p.y);
    }
    for(let i=12;i>=0;i--) {
      const p=profile(progress-reach*(1-i/12));ctx.lineTo(p.x+p.half,p.y);
    }
    ctx.closePath();ctx.fill();
    // Sample the same rain-blacktop painting used by the forward road at
    // addresses behind the car. The glass blur hides slice joins naturally.
    ctx.save();ctx.clip();ctx.globalAlpha=.31;
    for(let i=0;i<9;i++) {
      const a=profile(progress-reach*(1-i/9));
      const b=profile(progress-reach*(1-(i+1)/9));
      const mid=profile(progress-reach*(1-(i+.5)/9));
      const worldAt=progress-reach*(1-(i+.5)/9);
      const row=((worldAt*.82%596)+596)%596;
      B.PresentationAssets?.draw?.('cacheBlacktop',ctx,{
        x:mid.x-mid.half,y:a.y,width:mid.half*2,height:b.y-a.y+1,
        sourceRect:[0,108+row,2172,20] });
    }
    ctx.restore();
    for(const side of [-1,1]) {
      ctx.strokeStyle='#a2b7b9';ctx.lineWidth=1.3;
      ctx.beginPath();ctx.moveTo(far.x+side*far.half,far.y);
      for(let i=1;i<=12;i++) {
        const p=profile(progress-reach*(1-i/12));
        ctx.lineTo(p.x+side*p.half,p.y);
      }
      ctx.stroke();
    }
    // All marks have fixed world addresses. After the car passes one, its
    // image moves toward the horizon and shrinks instead of approaching us.
    for(let at=Math.floor(progress/55)*55;at>progress-reach;at-=55) {
      if(at>progress)continue;
      const a=profile(at), b=profile(Math.max(at-15,progress-reach));
      for(let lane=1;lane<4;lane++) {
        const width=.6+1.8*a.t;
        polygon(ctx,[[laneX(lane-.5,a)-width,a.y],
          [laneX(lane-.5,a)+width,a.y],
          [laneX(lane-.5,b)+width*.4,b.y],
          [laneX(lane-.5,b)-width*.4,b.y]],'#c7d3ca');
      }
      for(const side of [-1,1]) {
        ctx.fillStyle='#b7e2d1';ctx.globalAlpha=.18+a.t*.3;
        ctx.fillRect(a.x+side*(a.half+7),a.y-4-a.t*8,2+a.t*2,4+a.t*8);
        ctx.globalAlpha=1;
      }
    }
    // Branch streets are the graph's actual mouths, opening through the
    // miniature sidewalk only once their addresses are behind the car.
    for(const street of LANDSCAPE.streets) {
      if(street.at>=progress || street.at<progress-reach)continue;
      const side=street.side;
      const close=profile(Math.min(progress,street.at+street.halfWidth));
      const distant=profile(Math.max(progress-reach,street.at-street.halfWidth));
      const inner=p=>p.x+side*(p.half+5);
      const outer=p=>p.x+side*(p.half+48+12*p.t);
      const corners=[[inner(close),close.y],[inner(distant),distant.y],
        [outer(distant),distant.y-3*distant.t],[outer(close),close.y-3*close.t]];
      polygon(ctx,corners,'#263841');
      ctx.strokeStyle='#92aeb1';ctx.globalAlpha=.35;
      ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(...corners[0]);ctx.lineTo(...corners[3]);
      ctx.moveTo(...corners[1]);ctx.lineTo(...corners[2]);ctx.stroke();
      ctx.globalAlpha=1;
    }
    // Reuse the production district cards, featured places and individual
    // people/props instead of generic boxes. The rear camera samples their
    // existing world addresses and the glass clips and blurs their miniatures.
    const scenery=[
      ...LANDSCAPE.plates.map(plate=>({at:plate.at,side:plate.side,plate})),
      ...SIDE_PLACES.map(place=>({at:place.at,side:place.side,place})),
      ...SATELLITE_SCENES.map(scene=>({at:scene.at+43,side:scene.side,satellite:scene}))
    ].filter(item=>item.at<progress&&item.at>progress-reach)
      .sort((a,b)=>a.at-b.at);
    for(const item of scenery) {
      const p=profile(item.at),side=item.side;
      let key,sourceW,sourceH,width,flip=false,setback=0,sourceRect;
      if(item.plate) {
        [key,sourceW,sourceH]=item.plate.art;
        sourceH=item.plate.art[6]||sourceH;
        width=18+50*p.t;flip=!!item.plate.flip;
        sourceRect=[0,0,sourceW,sourceH];
      } else if(item.satellite) {
        [key,sourceW,sourceH]=item.satellite.art;
        width=15+43*p.t;flip=side>0;setback=5;
      } else if(item.place.kind!=='parking') {
        const place=item.place,variant=SIDE_VARIANTS[place.variant];
        [key,sourceW,sourceH]=(variant&&variant.art)||PLACE_ART[place.kind];
        width=(18+51*p.t)*place.size;
        flip=variant?!!variant.flip:placeFacesRoad(place.kind,side);
        setback=place.setback*.035*p.t;
      } else {
        const bx=p.x+side*(p.half+26+item.place.setback*.035*p.t);
        ctx.fillStyle='#667683';ctx.globalAlpha=.44;
        ctx.fillRect(bx-(side<0?22*p.t:0),p.y-2*p.t,22*p.t,3*p.t);
        ctx.globalAlpha=1;continue;
      }
      const artX=p.x+side*(p.half+8+setback+width*.5);
      const height=width*sourceH/sourceW;
      ctx.globalAlpha=.56+.37*p.t;
      if(!B.PresentationAssets?.draw?.(key,ctx,{
        x:artX,y:p.y+2*p.t,width,height,sourceRect,flip })) {
        ctx.fillStyle='#536977';
        ctx.fillRect(artX-width/2,p.y-height,width,height);
      }
      ctx.globalAlpha=1;
    }
    for(const {scene,item} of STREET_ITEMS) {
      if(item.at>=progress || item.at<progress-reach)continue;
      const p=profile(item.at),side=scene.side;
      const person=item.id!==undefined;
      const [key,aspect]=person?PEDESTRIANS[item.id]:
        [item.key,PROP_SHAPES[item.key][0]];
      const height=(person?2.5:3.5)+10*p.t*item.scale;
      const artX=p.x+side*(p.half+10+item.base*.065*p.t);
      ctx.globalAlpha=.55+.36*p.t;
      const travel=person?pedestrianTravel(item,s,reduced):null;
      const args={x:artX,y:p.y+2*p.t,width:height*aspect,height,
        flip:travel?false:person?item.flip:false,
        frame:travel?.frame??(person||reduced?0:
          ((Math.floor(((s.elapsedMs||0)+item.at*9)/310)%3)+3)%3)};
      if(!travel||!B.PresentationAssets?.draw?.(travel.key,ctx,args))
        B.PresentationAssets?.draw?.(key,ctx,{...args,frame:0});
      ctx.globalAlpha=1;
    }
    for(const hazard of HAZARDS) {
      if(hazard.at>=progress || hazard.at<progress-reach)continue;
      const p=profile(hazard.at);
      const lane=hazardLane(hazard,progress,s.audits);
      const hx=laneX(lane,p), hw=(8+22*p.t)*(hazard.kind==='freight'?1.35:1);
      const hh=5+12*p.t;
      ctx.globalAlpha=.3+.62*p.t;
      ctx.fillStyle=hazard.kind==='block'?'#c09a62':'#405967';
      ctx.beginPath();ctx.moveTo(hx-hw/2,p.y);ctx.lineTo(hx-hw*.43,p.y-hh);
      ctx.lineTo(hx+hw*.43,p.y-hh);ctx.lineTo(hx+hw/2,p.y);
      ctx.closePath();ctx.fill();
      ctx.fillStyle='#ffe8bc';
      ctx.fillRect(hx-hw*.39,p.y-hh*.57,2+3*p.t,2+p.t);
      ctx.fillRect(hx+hw*.22,p.y-hh*.57,2+3*p.t,2+p.t);
      ctx.globalAlpha=1;
    }
    ctx.restore();
    // Only reflected scenery gets softened. Cache and the glass markings are
    // painted afterward at the HUD's native resolution.
  }

  // One piece of glass contains both the passing road and Cache's eyes.
  function drawRearview(ctx, s, accent, reduced) {
    const x = 638, y = 12, w = 690, h = 117;
    const expression = mirrorExpression(s);
    const edge = expression === 4 ? '#ff7c89' : expression === 5 ? '#f7b376' :
      expression === 2 ? '#f6d188' : '#8fe3db';
    ctx.fillStyle = '#45616f'; ctx.fillRect(x + 338, 0, 14, 14);
    ctx.fillStyle = '#25394a'; mirrorOutline(ctx, x - 6, y - 5, w + 12, h + 10); ctx.fill();
    ctx.fillStyle = edge; mirrorOutline(ctx, x - 3, y - 2, w + 6, h + 4); ctx.fill();
    ctx.save(); mirrorOutline(ctx, x, y, w, h); ctx.clip();
    const glass = ctx.createLinearGradient(0, y, 0, y + h);
    glass.addColorStop(0, '#0e1b2d'); glass.addColorStop(.53, '#394a60');
    glass.addColorStop(1, '#10232e');
    ctx.fillStyle = glass; ctx.fillRect(x, y, w, h);
    drawRearRoad(ctx,s,x,y,w,h,accent,reduced);
    // Cache sits on the driver's side. His eyes face the windshield
    // for ordinary driving; only the impact cell glances across the mirror.
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (!B.PresentationAssets?.draw?.('cacheMirror', ctx, {
      x: x + 195, y: y + h/2, width: 280, height: 111,
      sourceRect: [0, 150, 450, 185], frame: expression })) {
      ctx.fillStyle = '#d9aa4c'; ctx.beginPath();
      ctx.arc(x + 57, y + 50, 58, Math.PI, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#142632'; ctx.fillRect(x, y + 65, 122, 52);
      ctx.fillStyle = '#f4e0b1'; ctx.fillRect(x + 52, y + 58, 28, 8);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // Shared glare and scan marks pass over both the road and Cache's face.
    ctx.strokeStyle = '#c8eef0'; ctx.globalAlpha = .24; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 23, y + 15); ctx.lineTo(x + 159, y + 3);
    ctx.lineTo(x + w - 32, y + 3); ctx.stroke();
    ctx.globalAlpha = .12; ctx.fillStyle = '#9ac9cb';
    ctx.fillRect(x + 10, y + 75, w - 20, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#d8eee3'; ctx.font = 'bold 12px Oxanium, monospace';
    ctx.textAlign = 'left'; ctx.fillText('REAR VIEW', x + 19, y + 24);
    if (expression === 4) {
      ctx.fillStyle = '#ff74857d'; ctx.fillRect(x + 5, y + 87, w - 10, 3);
    }
    ctx.restore();
  }
  // Every supplied stem runs for the complete song. Some recorded passages
  // are softer, but that is not a reason to reject their lane captures.
  const laneAvailable = (lane, bar) => lane >= 0 && lane < LANES.length &&
    bar >= 0 && bar < 100;
  const songSection = bar => {
    if (bar < 4) return 'INTRO';
    if (bar >= 100) return 'TAPE END';
    const phase = (bar - 4) % 24, cycle = 1 + Math.floor((bar - 4) / 24);
    return phase < 8 ? `VERSE ${cycle} A` : phase < 16 ? `VERSE ${cycle} B` : `CHORUS ${cycle}`;
  };
  const stackSize = state => Math.max(1, new Set(state.captures.map(capture => capture.lane)).size);
  const legacyPoint = { 'road-start': 0, 'road-cache': 850, 'road-fork': 1700,
    'road-gate': 2070, 'road-clear': LAP };
  function migrateProof(proof, version) {
    if (version === 4) return proof;
    const old = version === 3 ? proof : {
      ...proof, lane: [0, 0, 1, 3][proof.lane] ?? 0,
      lanePos: [0, 0, 1, 3][Math.round(proof.lanePos ?? proof.lane)] ?? 0,
      musicBar: Math.min(99, Math.floor(proof.progress / (54 * 1.875))) };
    // Indefinite old locks have no bar expiry. Refund them instead of turning
    // an old save into a permanent four-part stack.
    return { ...old, locked: [], lockEnergy: clamp((proof.lockEnergy ?? 65) +
      60 * (proof.locked || []).length, 0, 100) };
  }
  const roadCurve = progress => Math.sin(progress / 190) * 0.72 + Math.sin(progress / 410) * 0.24;
  const hazardLane = (hazard, progress, audits) => {
    if (hazard.kind === 'audit') return audits[hazard.at] ?? hazard.lane;
    if (hazard.kind === 'sweeper' || hazard.kind === 'trike') {
      const direction = hazard.lane === 3 ? -1 : 1;
      const warning = hazard.kind === 'sweeper' ? 165 : 205;
      const duration = hazard.kind === 'sweeper' ? 120 : 125;
      return hazard.lane + direction * clamp((progress - (hazard.at - warning)) / duration, 0, 1);
    }
    return hazard.lane;
  };

  const PALETTE = ['#69d9f5', '#ffc077', '#cd9dff', '#91f5bc'];
  const polygon = (ctx, points, fill) => {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  };
  // Map a hand-inked decal onto both halves of the exact projected road
  // trapezoid. One affine rectangle would stretch beyond its far edge.
  function paintComicDecal(ctx,key,[a,b,c,d]) {
    if(!B.PresentationAssets?.ready?.(key))return false;
    for(const [corners,matrix] of [
      [[a,b,c],[(b[0]-a[0])/512,(b[1]-a[1])/512,
        (c[0]-b[0])/256,(c[1]-b[1])/256]],
      [[a,c,d],[(c[0]-d[0])/512,(c[1]-d[1])/512,
        (d[0]-a[0])/256,(d[1]-a[1])/256]]
    ]) {
      ctx.save();ctx.beginPath();ctx.moveTo(...corners[0]);
      ctx.lineTo(...corners[1]);ctx.lineTo(...corners[2]);
      ctx.closePath();ctx.clip();ctx.transform(...matrix,a[0],a[1]);
      B.PresentationAssets.draw(key,ctx,{x:0,y:0,width:512,height:256});
      ctx.restore();
    }
    return true;
  }
  // Painted action badges share their symbols on the road and HUD; the small
  // vector paths below remain useful while images load.
  function drawActionIcon(ctx,action,x,y,size,color='#d6ffe7',frame=0) {
    if(B.PresentationAssets?.draw?.(
      ['cachePulseSurge','cachePulsePush','cachePulseBrace','cachePulseRefill'][action],
      ctx,{x,y,width:size,height:size,frame}))return;
    ctx.save();ctx.translate(x,y);ctx.scale(size/60,size/60);
    ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=5;
    ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    if(action===0) { // Surge: a double forward impulse.
      for(const offset of [0,16]) {
        ctx.moveTo(-20,10-offset);ctx.lineTo(0,-10-offset);
        ctx.lineTo(20,10-offset);
      }
      ctx.stroke();
    } else if(action===1) { // Push: an impact wedge.
      ctx.moveTo(-23,-13);ctx.lineTo(5,-13);ctx.lineTo(24,0);
      ctx.lineTo(5,13);ctx.lineTo(-23,13);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-14,-22);ctx.lineTo(-14,-16);
      ctx.moveTo(-14,16);ctx.lineTo(-14,22);ctx.stroke();
    } else if(action===2) { // Brace: armored shield.
      ctx.moveTo(0,-24);ctx.lineTo(21,-15);ctx.lineTo(18,8);
      ctx.quadraticCurveTo(12,22,0,27);ctx.quadraticCurveTo(-12,22,-18,8);
      ctx.lineTo(-21,-15);ctx.closePath();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-9,1);ctx.lineTo(-1,9);ctx.lineTo(12,-8);ctx.stroke();
    } else { // Refill: winding signal coil.
      ctx.arc(0,0,21,-.4,Math.PI*1.55);ctx.stroke();
      polygon(ctx,[[16,-21],[27,-18],[21,-8]],color);
      ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(0,11);
      ctx.moveTo(-10,1);ctx.lineTo(10,1);ctx.stroke();
    }
    ctx.restore();
  }
  function drawLaneMark(ctx,lane,x,y,size,color=PALETTE[lane]) {
    ctx.save();ctx.translate(x,y);ctx.scale(size/50,size/50);
    ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=4;
    ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
    if(lane===0) { // Drive: parallel motion tracks.
      for(const offset of [-10,0,10]) {
        ctx.moveTo(offset-9,15);ctx.lineTo(offset+9,-15);
      }
      ctx.stroke();
    } else if(lane===1) { // Flow: continuous waveform.
      ctx.moveTo(-23,0);ctx.bezierCurveTo(-12,-19,-5,-19,2,0);
      ctx.bezierCurveTo(9,19,16,19,23,0);ctx.stroke();
    } else if(lane===2) { // Breakaway: divided outward chevrons.
      ctx.moveTo(-23,15);ctx.lineTo(-5,-4);ctx.lineTo(-23,-20);
      ctx.moveTo(0,15);ctx.lineTo(19,-4);ctx.lineTo(0,-20);ctx.stroke();
    } else { // Undercurrent: pulse below the surface.
      ctx.moveTo(-23,9);ctx.lineTo(-10,9);ctx.lineTo(-4,-10);
      ctx.lineTo(4,20);ctx.lineTo(11,-3);ctx.lineTo(23,-3);ctx.stroke();
      ctx.beginPath();ctx.arc(-16,-11,2,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  }
  function instrumentPanel(ctx,x,y,w,h,accent) {
    polygon(ctx,[[x+14,y],[x+w-14,y],[x+w,y+14],[x+w,y+h-10],
      [x+w-10,y+h],[x+10,y+h],[x,y+h-10],[x,y+14]],'#0b1b2bed');
    ctx.strokeStyle=accent;ctx.globalAlpha=.54;ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x+16,y+3);ctx.lineTo(x+w-16,y+3);
    ctx.moveTo(x+9,y+h-5);ctx.lineTo(x+w-9,y+h-5);ctx.stroke();
    ctx.globalAlpha=1;ctx.fillStyle='#527181';
    for(const xx of [x+13,x+w-13]) {
      ctx.beginPath();ctx.arc(xx,y+h-12,2,0,Math.PI*2);ctx.fill();
    }
  }
  const grit = n => { const v=Math.sin(n*78.233+12.9898)*43758.5453; return v-Math.floor(v); };
  function drawGrimyPlume(ctx,x,y,phase,spread,strength,colors,direction=1) {
    ctx.save();
    for(let i=0;i<15;i++) {
      const age=((phase*.013+i*.171+grit(i*11+spread))%1+1)%1;
      const wobble=Math.sin(age*8+i*3.9)*spread*.13;
      const sideways=(grit(i*17+spread)-.5)*spread*.75+age*spread*.32*direction;
      const xx=x+sideways+wobble, yy=y+age*spread*.85;
      const opacity=strength*(1-age)*(.34+grit(i*13)*.33);
      ctx.globalAlpha=opacity;
      ctx.strokeStyle=i%4===0?colors[1]:colors[0];
      ctx.lineWidth=Math.max(1.5,spread*(.036+.052*grit(i*7))*(1-age));
      ctx.beginPath(); ctx.moveTo(xx-spread*.08*direction,yy-spread*.19);
      ctx.quadraticCurveTo(xx+spread*.12*direction,yy-spread*.12,
        xx+spread*(.10+.16*grit(i*5))*direction,yy+spread*.035); ctx.stroke();
      ctx.globalAlpha=opacity*.22; ctx.fillStyle=i%3===0?colors[1]:colors[0];
      ctx.beginPath();ctx.ellipse(xx,yy,spread*(.044+.05*grit(i*19))*(1-age),
        spread*(.028+.025*grit(i*23))*(1-age),-.35,0,Math.PI*2);ctx.fill();
      if(i%2===0) {
        ctx.fillStyle=i%3===0?colors[1]:colors[0];
        const fleck=1+spread*.025*(1-age);
        ctx.fillRect(xx+spread*.14*direction,yy+spread*.04,fleck,fleck*.6);
      }
    }
    ctx.restore();
  }
  // One silhouette language at every depth. The four traffic kinds differ in
  // body shape, lights and warning marks even without reading their labels.
  function drawVehicle(ctx, x, y, w, h, kind, { alpha = 1, turbo = false,
    phase = 0, steer = 0, hit = 0, braking = false, damage = 0,
    reduced = false } = {}) {
    const artKey = kind === 'cache' ? hit ? 'cacheCarHit' : steer < -.08 ?
      'cacheCarRight' : steer > .08 ? 'cacheCarLeft' : 'cacheCar' :
      ({ freight: 'cacheFreight', van: 'cacheCourier', block: 'cacheBarricade',
        rival: 'cacheRival', audit: 'cacheAudit', sweeper: 'cacheSweeper',
        trike: 'cacheTrike', shuttle: 'cacheShuttle' })[kind];
    if (artKey && B.PresentationAssets?.ready?.(artKey)) {
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= alpha;
      // Advance painted detail with travel. The impact pose is a one-shot
      // sequence; all masked tire and body passes use the same cel.
      const vehicleFrame = reduced ? 0 : hit && kind === 'cache' ?
        Math.min(7,Math.floor((650-hit)/82)) :
        ((Math.floor(phase*.11+x*.015)%8)+8)%8;
      const ratio = kind === 'block' ? [1.12, 1.28] : kind === 'freight' ? [1.27, 1.19] :
        kind === 'trike' ? [1.32, 1.24] : kind === 'sweeper' || kind === 'shuttle' ?
          [1.23, 1.38] : [1.28, 1.32];
      const impact = hit && !reduced ? 1-clamp(hit/650,0,1) : 0;
      const recoil = impact ? Math.exp(-5*impact)*Math.sin(impact*17) : 0;
      const sway = reduced || kind === 'block' ? 0 :
        Math.sin(phase*(kind === 'freight' ? .055 : .082)+x*.009)*.65 +
        Math.sin(phase*(kind === 'freight' ? .105 : .15)+x*.016)*.35;
      // Each painted pose shares its silhouette. The sprung chassis still
      // travels independently while the tire pixels remain planted.
      const bounce = sway*h*(kind === 'freight' ? .115 : .075) - Math.abs(recoil)*h*.08;
      const jolt = recoil*w*.075;
      const roll = reduced ? 0 : (kind === 'cache' ? steer*.025 : 0) +
        sway*.009+recoil*.07;
      const art = { x: 0, y: 1, width: w*ratio[0], height: h*ratio[1],
        frame: vehicleFrame };
      const anchored = kind !== 'block';
      const freight = kind === 'freight';
      // The transparent paintings do not all end at the same wheel line:
      // the exhaust/bumper often extends below the tires. Keep each contact
      // point in the road frame while the painted chassis rides its shocks.
      const contact = freight ? [.08,.08] : kind === 'trike' ? [.08] :
        kind === 'sweeper' ? [.075,.075] : kind === 'shuttle' ? [.05,.05] :
        kind === 'audit' ? [.08,.08] : artKey === 'cacheCarLeft' ? [.17,.275] :
        artKey === 'cacheCarRight' ? [.31,.125] : artKey === 'cacheRival' ? [.07,.07] :
        artKey === 'cacheCourier' ? [.15,.15] : [.14,.14];
      const tireTop = kind === 'trike' ? [.32] : kind === 'sweeper' ? [.30,.30] :
        kind === 'shuttle' ? [.25,.25] : kind === 'audit' ? [.34,.34] :
        artKey === 'cacheCarLeft' ? [.43,.61] :
        artKey === 'cacheCarRight' ? [.61,.43] : [freight ? .29 : .43,freight ? .29 : .43];
      const tires = anchored ? (kind === 'trike' ? [0] : [-1,1]).map((side,index) => {
        const pos = kind === 'cache' && !hit && steer < -.08 ?
          (side < 0 ? -.51 : .38) : kind === 'cache' && !hit && steer > .08 ?
            (side < 0 ? -.38 : .51) : side*(freight ? .32 :
              kind === 'sweeper' ? .32 : kind === 'shuttle' ? .35 : kind === 'audit' ? .38 : .44);
        const top = -h*tireTop[index], bottom = -h*contact[index];
        return { x: w*pos, top, bottom, height: bottom-top,
          width: w*(kind === 'trike' ? .22 : freight || kind === 'sweeper' || kind === 'shuttle' ? .15 : .125) };
      }) : [];
      // The broken red painting sits on the road before the car and tires.
      // Cache's brake input brightens it; traffic has only a dim tail-light
      // trace, apart from the deliberately slow shuttle.
      if (kind !== 'block' && kind !== 'trike' &&
          B.PresentationAssets?.ready?.('cacheBrakeReflection')) {
        const light = kind === 'cache' ? braking ? .76 : hit ? .56 : .11 :
          kind === 'shuttle' ? .34 : kind === 'freight' ? .23 : .16;
        ctx.save();ctx.globalAlpha*=light;
        B.PresentationAssets.draw('cacheBrakeReflection',ctx,{
          x:0,y:-h*.48,width:w*1.64,height:h*1.55 });
        ctx.restore();
      }
      // Once the impact pose ends, reduced integrity remains visible on the
      // car itself rather than as another full-screen warning.
      if (kind === 'cache' && damage && !hit &&
          B.PresentationAssets?.ready?.('cacheDamagedExhaust')) {
        const severe = damage >= 2;
        ctx.save();ctx.globalAlpha*=(severe?.58:.34)*
          (reduced?1:.88+.12*Math.sin(phase*.13));
        B.PresentationAssets.draw('cacheDamagedExhaust',ctx,{
          x:-w*.41,y:-h*.14,width:w*(severe?.76:.55),
          height:h*(severe?1.03:.75) });
        ctx.restore();
      }
      ctx.fillStyle = '#0613207d'; ctx.beginPath();
      ctx.ellipse(0,-h*.075,w*.50,Math.max(2,h*.055),0,0,Math.PI*2); ctx.fill();
      for (const tire of tires) {
        ctx.fillStyle = '#030b16c8'; ctx.beginPath();
        ctx.ellipse(tire.x,tire.bottom+2,tire.width*.86,
          Math.max(2,h*.043),0,0,Math.PI*2); ctx.fill();
      }
      if(turbo && !reduced) {
        for(let i=0;i<2;i++) {
          ctx.save(); ctx.globalAlpha*=.29+i*.09;
          ctx.rotate((i?-.09:.08)+Math.sin(phase*.045+i)*.06);
          B.PresentationAssets?.draw?.('cacheSpeedMist',ctx,{
            x:(i?1:-1)*w*.27,y:h*.46+i*7,
            width:w*(1.17+i*.23),height:h*(.48+i*.12),flip:!!i });
          ctx.restore();
        }
        drawGrimyPlume(ctx,-w*.21,-h*.09,phase+7,h*.73,.9,
          ['#8ed4d5','#495360'], -1);
        drawGrimyPlume(ctx,w*.16,-h*.08,phase+29,h*.85,.83,
          ['#e9ab68','#555968'],1);
      }
      if (!reduced && anchored) {
        // Animated wet contact remains behind all moving traffic. It is
        // brighter on Cache, whose tire motion is the player's main cue.
        for (const tire of tires) {
          for (let i=0; i<(kind === 'cache'?6:3); i++) {
            const cycle = ((phase*.75+i*8+tire.x) % 40+40) % 40;
            const drift = (tire.x < 0 ? -1 : 1)*(8+cycle*.66);
            ctx.strokeStyle = kind === 'cache' ?
              (i%2 ? '#a4e8ef8c' : '#e9d0ae80') : '#9ec4c16a';
            ctx.lineWidth = Math.max(.9,w*.009)*(1-cycle/54);
            ctx.beginPath(); ctx.moveTo(tire.x,tire.bottom+2+cycle*.42);
            ctx.lineTo(tire.x+drift,tire.bottom+5+cycle*.84); ctx.stroke();
          }
        }
      }
      // The recovered images include both wheels. Paint their original pixels
      // at road contact, then draw the bouncing chassis around those areas.
      // Short dark struts live behind both layers when the body lifts away.
      for (const tire of tires) {
        ctx.strokeStyle = '#0a1421'; ctx.lineWidth = Math.max(2,tire.width*.43);
        ctx.beginPath(); ctx.moveTo(tire.x,tire.top+tire.height*.42);
        ctx.lineTo(tire.x+jolt*.5,tire.top+bounce+h*.025); ctx.stroke();
      }
      for (const tire of tires) {
        ctx.save(); ctx.beginPath();
        ctx.roundRect(tire.x-tire.width/2,tire.top,tire.width,tire.height,Math.max(1,tire.width*.2));
        ctx.clip(); B.PresentationAssets.draw(artKey, ctx, art); ctx.restore();
      }
      ctx.save(); ctx.translate(jolt,bounce); ctx.rotate(roll);
      if (anchored) {
        ctx.beginPath(); ctx.rect(-art.width/2,-art.height,art.width,art.height+2);
        for (const tire of tires)
          ctx.roundRect(tire.x-tire.width/2-jolt,tire.top-bounce,tire.width,tire.height,
            Math.max(1,tire.width*.2));
        ctx.clip('evenodd');
      }
      B.PresentationAssets.draw(artKey, ctx, art);
      ctx.restore();
      if (!reduced && ['cache','freight','van','rival','audit','shuttle'].includes(kind)) {
        // Small changing reflections animate the painted rear lamps without
        // replacing the hand-painted vehicle poses or flashing a whole car.
        ctx.save();ctx.translate(jolt,bounce);ctx.rotate(roll);
        ctx.globalCompositeOperation='screen';
        ctx.globalAlpha*=kind==='cache' && braking ? .72 :
          .15+.18*(.5+.5*Math.sin(phase*.17+x*.01));
        ctx.fillStyle=kind==='cache' && braking ? '#ff7773' :
          kind==='cache'?'#ffcb78':'#ff8e87';
        const lampY=-h*(kind==='freight'?.18:.29);
        for(const side of [-1,1]) {
          ctx.beginPath();ctx.ellipse(side*w*.35,lampY,
            Math.max(2,w*.065),Math.max(1.5,h*.038),0,0,Math.PI*2);ctx.fill();
        }
        ctx.restore();
      }
      for (const tire of tires) {
        const top = tire.top+tire.height*.25;
        const tireH = tire.height*.64;
        const tireW = tire.width*.61;
        ctx.save(); ctx.beginPath();
        ctx.roundRect(tire.x-tireW/2,top,tireW,tireH,Math.max(1,tireW*.24)); ctx.clip();
        ctx.fillStyle = '#0a111ca8'; ctx.fillRect(tire.x-tireW/2,top,tireW,tireH);
        const pitch = tireH/4;
        const offset = reduced ? 0 : ((phase*(freight ? .53 : .42)) % pitch + pitch) % pitch;
        for (let tread=-1; tread<5; tread++) {
          const yy = top+tread*pitch+offset;
          ctx.fillStyle = freight ? '#8a98a6cc' : '#7e8c9bc9';
          ctx.fillRect(tire.x-tireW*.37,yy,tireW*.3,Math.max(1,pitch*.3));
          ctx.fillStyle = '#5d7082bd';
          ctx.fillRect(tire.x+tireW*.06,yy+pitch*.24,tireW*.3,Math.max(1,pitch*.3));
        }
        ctx.restore();
      }
      if (kind === 'cache' && !hit && Math.abs(steer) > .08) {
        // A side rim becomes visible only while turning. Its narrow ellipse
        // spins inside the actual wheel rather than beside the car.
        const wx = (steer < 0 ? 1 : -1)*w*.40;
        const wy = -h*(steer < 0 ? .27 : .29);
        const rx = w*.020, ry = h*.072;
        ctx.save(); ctx.beginPath(); ctx.ellipse(wx,wy,rx,ry,0,0,Math.PI*2); ctx.clip();
        ctx.fillStyle = '#18202bd7'; ctx.fillRect(wx-rx,wy-ry,rx*2,ry*2);
        ctx.strokeStyle = '#d9b477d9'; ctx.lineWidth = Math.max(.8,w*.007);
        ctx.beginPath(); ctx.ellipse(wx,wy,rx*.92,ry*.92,0,0,Math.PI*2); ctx.stroke();
        for (let spoke=0; spoke<4; spoke++) {
          const angle=(reduced ? 0 : phase*.18)+spoke*Math.PI/2;
          ctx.beginPath(); ctx.moveTo(wx,wy);
          ctx.lineTo(wx+Math.cos(angle)*rx*.76,wy+Math.sin(angle)*ry*.76); ctx.stroke();
        }
        ctx.restore();
      }
      if (kind === 'audit' || kind === 'sweeper' || kind === 'trike') {
        // Roof beacons and signal mast respond to travel without moving the
        // grounded tire pixels. A scan/merge is visible before its collision.
        const pulse = reduced ? .55 : .35 + .65 * Math.pow(Math.sin(phase*.11),2);
        ctx.save(); ctx.translate(jolt,bounce); ctx.rotate(roll);
        ctx.globalAlpha *= pulse;
        ctx.fillStyle = kind === 'sweeper' ? '#ffd079' : kind === 'audit' ? '#ff77bb' : '#8af6f1';
        ctx.beginPath(); ctx.ellipse(0,-h*(kind === 'trike' ? 1.18 : 1.25),
          w*.11,h*.045,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
      ctx.restore(); return;
    }
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= alpha;
    if (!reduced && kind !== 'block')
      ctx.translate(0, Math.sin(phase*.18+x*.04)*Math.max(1,h*.03));
    ctx.fillStyle = '#07111da9'; ctx.beginPath();
    ctx.ellipse(0, 7, w * 0.62, Math.max(4, h * 0.13), 0, 0, Math.PI * 2); ctx.fill();
    if (kind === 'block') {
      polygon(ctx, [[-w*.57,0],[-w*.54,-h*.64],[-w*.43,-h*.77],[w*.43,-h*.77],[w*.54,-h*.64],[w*.57,0]], '#f0a35b');
      polygon(ctx, [[-w*.47,-h*.59],[w*.47,-h*.59],[w*.44,-h*.13],[-w*.44,-h*.13]], '#2b3149');
      for (let i = -1; i <= 1; i++) polygon(ctx,
        [[(i-.42)*w/3,-h*.59],[(i+.08)*w/3,-h*.59],[(i+.42)*w/3,-h*.13],[(i-.08)*w/3,-h*.13]], '#ffe5a9');
      ctx.fillStyle = '#ff5f7b'; ctx.fillRect(-w*.48,-h*.78,w*.22,h*.1); ctx.fillRect(w*.26,-h*.78,w*.22,h*.1);
    } else if (kind === 'freight') {
      ctx.fillStyle = '#0b1e30'; ctx.fillRect(-w*.57,-h*.22,w*.17,h*.29); ctx.fillRect(w*.40,-h*.22,w*.17,h*.29);
      polygon(ctx, [[-w*.49,-h*.06],[-w*.49,-h*.88],[-w*.38,-h],[w*.38,-h],[w*.49,-h*.88],[w*.49,-h*.06]], '#657d89');
      polygon(ctx, [[-w*.40,-h*.89],[w*.40,-h*.89],[w*.42,-h*.28],[-w*.42,-h*.28]], '#19384d');
      ctx.strokeStyle = '#91c8d1'; ctx.lineWidth = Math.max(1,w*.018); ctx.strokeRect(-w*.38,-h*.86,w*.76,h*.56);
      ctx.fillStyle = '#d0dee0'; ctx.fillRect(-w*.025,-h*.86,w*.05,h*.58);
      ctx.fillStyle = '#ff8275'; ctx.fillRect(-w*.42,-h*.19,w*.19,h*.09); ctx.fillRect(w*.23,-h*.19,w*.19,h*.09);
    } else {
      const player = kind === 'cache' || kind === 'echo';
      const body = kind === 'rival' ? '#f9f6ee' : kind === 'audit' ? '#f1eee9' : kind === 'sweeper' ? '#e5a15f' :
        kind === 'van' ? '#4c8fc0' : kind === 'echo' ? '#b7f8ff' : turbo ? '#fbe3a3' : '#61e7d4';
      if(turbo&&!reduced)
        drawGrimyPlume(ctx,0,-h*.08,phase,h*.9,.85,['#e8a469','#5e626a']);
      ctx.fillStyle = '#0b1726'; ctx.fillRect(-w*.55,-h*.35,w*.15,h*.4); ctx.fillRect(w*.4,-h*.35,w*.15,h*.4);
      polygon(ctx, [[-w*.47,0],[-w*.53,-h*.48],[-w*.32,-h*.67],[w*.32,-h*.67],[w*.53,-h*.48],[w*.47,0]], body);
      polygon(ctx, [[-w*.33,-h*.59],[-w*.25,-h*.91],[w*.25,-h*.91],[w*.33,-h*.59]],
        kind === 'audit' || kind === 'rival' ? '#8f9ba6' : '#163b52');
      ctx.fillStyle = kind === 'audit' || kind === 'rival' ? '#fb6087' : kind === 'sweeper' ? '#fff2a8' : '#ffc077';
      ctx.fillRect(-w*.43,-h*.22,w*.23,h*.105); ctx.fillRect(w*.2,-h*.22,w*.23,h*.105);
      ctx.fillStyle = '#132239'; ctx.fillRect(-w*.16,-h*.19,w*.32,h*.11);
      if (player) {
        ctx.strokeStyle = '#eaffef'; ctx.lineWidth = Math.max(2,w*.024);
        ctx.beginPath(); ctx.moveTo(-w*.56,-h*.62); ctx.lineTo(w*.56,-h*.62); ctx.stroke();
        ctx.fillStyle = '#edfff4';
        ctx.beginPath(); ctx.arc(-w*.11,-h*.73,w*.045,0,Math.PI*2); ctx.arc(w*.11,-h*.73,w*.045,0,Math.PI*2); ctx.fill();
        ctx.font = `bold ${Math.max(8,w*.115)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText(kind === 'echo' ? 'REPLAY' : 'CACHE', 0, -h*.32);
        if (kind === 'echo') {
          ctx.strokeStyle = '#dfffff'; ctx.lineWidth = Math.max(2,w*.03);
          ctx.strokeRect(-w*.56,-h*.94,w*1.12,h*1.05);
        }
      } else if (kind === 'rival') {
        ctx.fillStyle = '#fc5c91'; ctx.fillRect(-w*.42,-h*.53,w*.84,h*.1);
        ctx.fillStyle = '#19334a'; ctx.font = `bold ${Math.max(8,w*.12)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('COPY', 0, -h*.31);
        ctx.strokeStyle = '#ffacc1'; ctx.lineWidth = Math.max(2,w*.03);
        ctx.beginPath(); ctx.moveTo(-w*.58,-h*.65); ctx.lineTo(w*.58,-h*.65); ctx.stroke();
      } else if (kind === 'audit') {
        polygon(ctx, [[0,-h*.94],[-w*.09,-h*.75],[0,-h*.7],[w*.09,-h*.75]], '#fd497f');
        ctx.fillStyle = '#fb6087'; ctx.fillRect(-w*.24,-h*.48,w*.48,h*.095);
      } else if (kind === 'sweeper') {
        ctx.fillStyle = '#fff0a8'; ctx.font = `bold ${Math.max(10,w*.22)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('>', 0, -h*.31);
      } else {
        ctx.fillStyle = '#9ae8ff'; ctx.fillRect(-w*.2,-h*.52,w*.4,h*.09);
      }
    }
    if (kind !== 'block') {
      ctx.strokeStyle = '#c3d9de'; ctx.lineWidth = Math.max(1,w*.012);
      for (const side of [-1,1]) {
        const xx = side*w*.475, yy = -h*.15, radius = Math.max(2,w*.055);
        ctx.beginPath(); ctx.arc(xx,yy,radius,0,Math.PI*2); ctx.stroke();
        for (let spoke=0; spoke<3; spoke++) {
          const angle=(reduced ? 0 : phase*.25)+spoke*Math.PI*2/3;
          ctx.beginPath(); ctx.moveTo(xx,yy);
          ctx.lineTo(xx+Math.cos(angle)*radius*.8,yy+Math.sin(angle)*radius*.8);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function newState(saved = {}) {
    const progress = saved.progress ?? 0;
    const lanePos = saved.lanePos ?? saved.lane ?? 1;
    return { progress, lanePos, lane: Math.round(lanePos), visualLane: lanePos,
      captures: [], queuedCaptures: [], hitRecovery: false,
      caughtPulses: {}, pulseFlashMs: 0, pulseFlashAction: null, pulseCombo: 0,
      lastPulseRun: null, lastPulseOrder: -1,
      fullAdrenaline: false, fullAdrenalineCount: 0, shield: 0, ramMs: 0, surgeMs: 0,
      fastPulses: 0,
      cutMarks: {}, cutStreak: 0, cutFlashMs: 0, cutAward: 0,
      musicBeatFloat: (saved.musicBar ?? 0) * 4,
      scoredThrough: (saved.musicBar ?? 0) - 1, damagedBar: -1,
      score: saved.score ?? 0, peakStack: saved.peakStack ?? 1,
      cleanBars: saved.cleanBars ?? 0, stumbleMs: 0,
      integrity: saved.integrity ?? 3,
      speed: saved.speed ?? 44, timeMs: saved.timeMs ?? 55000,
      musicBar: saved.musicBar ?? 0, gateAt: saved.gateAt ?? null,
      // Keep the saved field name so version-4 road checkpoints still load.
      lockEnergy: saved.lockEnergy ?? 0, zoneEndBeat: -1,
      echoEnergy: saved.echoEnergy ?? (progress >= 1700 ? 100 : 65),
      boost: saved.boost ?? 1, boostMs: 0, invulnerableMs: 0, nearMisses: 0,
      steer: 0, braking: false, throttling: false, trace: [], echo: null, echoDeceptions: 0,
      audits: {}, drafted: {}, draftMs: 0,
      nextRivalAt: progress >= 3 * LAP + 1700 ? progress + 120 : 3 * LAP + 1810,
      rivalTarget: 1.5, rivalLane: 1.5, rivalWarning: false,
      rivalEchoCommitted: false, rivalDistractedMs: 0,
      // Road lessons are momentary guidance, not save or music state.
      opening: { held: false, sealed: false, turbo: false, echo: false, auditFollowedEcho: false },
      message: '', messageMs: 0,
      gateOpen: !!saved.gateOpen, gateFailure: null,
      status: saved.status || 'playing', elapsedMs: 0 };
  }

  const road = B.CacheRoadProof = {
    active: false, status: null, state: null, returnTo: null, pending: false,
    exiting: false, audioDegraded: false, oldHint: null,
    setHint() {
      const hint = document.querySelector?.('.hint');
      if (!hint) return;
      if (this.oldHint === null) this.oldHint = hint.textContent;
      const left = B.GamepadUI?.connected ? B.ControllerSettings?.button(4) : 'SPACE';
      const right = B.GamepadUI?.connected ? B.ControllerSettings?.button(5) : 'H';
      hint.textContent = `Road pads are safe: enter the marked lane and press its face button on beat 4 | Up: faster rewards; Down: slower Echo refill | ${left} Turbo | ${right} Echo`;
    },
    openingCue() {
      if (this.status !== 'playing' || !this.state) return null;
      const s = this.state, at = s.progress;
      if (at < 300) {
        if (!s.opening.held && s.musicBeatFloat < 10) return ['MINT ROAD PADS ARE SAFE',
          `Enter its marked lane. Tap the face button on BEAT 4 (${B.GamepadUI?.connected ? [0,1,2,3].map(i=>B.ControllerSettings?.button(i)).join(' / ') : 'K / L / J / I'}).`];
        if (!s.opening.sealed && s.musicBeatFloat < 20) return ['FOLLOW THE NEXT ROAD PAD',
          'Catch two in the same run for a longer part. Up earns more points; Down refills Echo.'];
        return ['TRAFFIC IS SOLID; MINT PADS ARE SAFE', 'Pads are painted into the road. Give vehicles room when changing lanes.'];
      }
      if (at >= 465 && at < 650) {
        if (!s.opening.turbo && s.boost > 0) return ['TWO LANES BLOCKED AHEAD',
          `Outside lanes are open. Press ${B.GamepadUI?.connected ? B.ControllerSettings?.button(4) : 'SPACE'} for Turbo.`];
        return ['TWO LANES BLOCKED AHEAD', 'Take an outside lane through the gap.'];
      }
      if (at >= 850 && at < 1135) {
        if (at < 975) {
          if (s.echo) return ['ECHO SENT — SCAN AHEAD',
            'Hold far left through the block. Move away from the Echo after it.'];
          if (s.echoEnergy >= 100) return ['SCAN AHEAD — SEND AN ECHO',
            `Hold far left at the block. Press ${B.GamepadUI?.connected ? B.ControllerSettings?.button(5) : 'H'} near it, then move away.`];
          return ['SCAN AHEAD', 'Hold far left through the block. Dodge the audit car.'];
        }
        return s.opening.auditFollowedEcho ? ['THE SCAN FOLLOWED YOUR ECHO',
          'Steer away from its lane to keep the original recording safe.'] :
          ['THE SCAN LOCKED ON', 'Change lanes before the audit car reaches you.'];
      }
      return null;
    },
    selectMusicProfile() {
      const selected = B.MusicProfiles?.select(PROFILE);
      const loaded = selected && B.MusicTransport?.load(PROFILE);
      return { ok: selected?.profileId === PROFILE && loaded?.status === 'ok' };
    },
    checkAudioAssets() {
      const tracks = window.audioSystem?.musicTracks || {};
      this.audioDegraded = B.MusicProfiles.get(PROFILE).arrangement.sources.some(source =>
        !tracks[source.sourceId]?.buffer || tracks[source.sourceId].isFallback ||
        Math.abs(tracks[source.sourceId].buffer.duration - 187.5) > 0.08);
      return !this.audioDegraded;
    },
    validate(saved) {
      const s = saved?.levelState, p = s?.proof;
      const legacy = s?.proofVersion < 3;
      return saved?.levelId === ID && [1, 2, 3, 4].includes(s?.proofVersion) &&
        Object.hasOwn(CHECKPOINTS, saved.checkpointId) &&
        (legacy || s?.proofVersion === 4 || !['road-cache', 'road-fork'].includes(saved.checkpointId)) &&
        s.returnTo?.checkpointId === 'intermission' &&
        B.Campaign.validateLevel01Checkpoint(s.returnTo) &&
        Number.isFinite(p?.progress) && p.progress >= 0 && p.progress <= (legacy ? LAP : 15000) &&
        (legacy ? Math.abs(p.progress - legacyPoint[saved.checkpointId]) <= 1 :
          Number.isInteger(p.musicBar) && p.musicBar >= 0 && p.musicBar <= 100 &&
          (saved.checkpointId === 'road-start' ? p.progress === 0 :
            saved.checkpointId === 'road-cache' ? p.progress >= 850 && p.progress < 860 :
            saved.checkpointId === 'road-fork' ? p.progress >= 1700 && p.progress < 1710 :
            saved.checkpointId === 'road-clear' ? p.musicBar >= 99 :
              ['road-gate', 'road-verse-2', 'road-verse-3', 'road-verse-4'].includes(saved.checkpointId))) &&
        Number.isInteger(p.lane) && p.lane >= 0 && p.lane < 4 &&
        Number.isInteger(p.integrity) && p.integrity >= 1 && p.integrity <= 3 &&
        (s.proofVersion === 1 ||
          Number.isFinite(p.lanePos) && p.lanePos >= 0 && p.lanePos <= 3 &&
          Number.isFinite(p.speed) && p.speed >= 10 && p.speed <= 78 &&
          Number.isFinite(p.timeMs) && p.timeMs > 0 && p.timeMs <= 60000 &&
          Number.isFinite(p.lockEnergy) && p.lockEnergy >= 0 && p.lockEnergy <= 100 &&
          Number.isFinite(p.echoEnergy) && p.echoEnergy >= 0 && p.echoEnergy <= 100) &&
        (s.proofVersion === 4 ?
          Number.isInteger(p.score) && p.score >= 0 &&
          Number.isInteger(p.peakStack) && p.peakStack >= 1 && p.peakStack <= 4 &&
          Number.isInteger(p.cleanBars) && p.cleanBars >= 0 && p.cleanBars <= 100 :
          Array.isArray(p.locked) && p.locked.length <= (s.proofVersion === 1 ? 2 : 3) &&
          new Set(p.locked).size === p.locked.length &&
          p.locked.every(lane => Number.isInteger(lane) && lane >= 0 && lane < 4));
    },
    async enter() {
      if (this.active || this.pending || B.RunAndGunProof?.active || B.RunAndGunProof?.pending ||
          !B.Campaign?.intermission) return { ok: false, reason: 'handoff-unavailable' };
      const returnTo = B.Campaign.readResume();
      if (returnTo?.levelId !== 'level-01' || returnTo.checkpointId !== 'intermission' ||
          !B.Campaign.archive().record.progress.completedLevels.includes('level-01'))
        return { ok: false, reason: 'level-01-clear-required' };
      const previous = returnTo.levelState.cacheRoadCheckpoint;
      delete returnTo.levelState.cacheRoadCheckpoint; // keep the return save shallow on repeat visits
      const candidate = previous && { levelId: ID, checkpointId: previous.checkpointId,
        levelState: { proofVersion: previous.proofVersion || 1, returnTo, proof: previous.proof } };
      const resume = this.validate(candidate) ? candidate : null;
      this.pending = true;
      B.Campaign.roadAudioNotice = null;
      let audioFailure = null;
      try {
        window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
        if (!this.selectMusicProfile().ok) throw new Error('road-profile-unavailable');
        const prepared = await window.audioSystem?.prepareActiveMusicProfile?.();
        if (!prepared?.ok) { audioFailure = prepared; throw new Error('road-audio-unavailable'); }
        if (!this.checkAudioAssets()) throw new Error('road-audio-invalid');
        this.returnTo = returnTo;
        this.state = newState(resume ? migrateProof(resume.levelState.proof, resume.levelState.proofVersion) : {});
        this.status = this.state.status; this.active = true;
        this.setHint();
        B.Campaign.intermission = false; B.Campaign.run = null;
        window.gameState.victory = false; window.gameState.gameOver = false;
        window.gameState.running = true;
        const started = window.audioSystem?.startRuntimeGameplayMusic?.();
        if (!started?.ok) throw new Error('road-audio-start-failed');
        this.checkpoint(resume?.checkpointId || 'road-start');
        window.inputManager?.resetActionEdges?.();
        return { ok: true };
      } catch (error) {
        console.error('[cache-road] Entry failed:', error?.message || error, audioFailure || '');
        this.dispose();
        if (previous) returnTo.levelState.cacheRoadCheckpoint = previous;
        B.Campaign.archive().checkpoint(returnTo);
        await B.RuntimeLifecycle?.restart?.({ source: 'road-entry-recovery', resume: returnTo });
        if (audioFailure || ['road-audio-invalid', 'road-audio-start-failed'].includes(error?.message)) {
          const names = audioFailure?.failures?.map(item => item.sourceId.replace('cache-', '').toUpperCase()).join(', ');
          B.Campaign.roadAudioNotice = `CACHE MUSIC UNAVAILABLE${names ? ` (${names})` : ''} — CHECK CONNECTION, THEN RETRY`;
        }
        return { ok: false, reason: error.message };
      } finally { this.pending = false; }
    },
    restore(saved) {
      if (!this.validate(saved)) return false;
      this.returnTo = clone(saved.levelState.returnTo);
      this.state = newState({ ...migrateProof(saved.levelState.proof, saved.levelState.proofVersion),
        status: saved.checkpointId === 'road-clear' ? 'clear' : 'playing' });
      this.status = this.state.status; this.active = true; this.exiting = false;
      this.setHint();
      this.checkAudioAssets();
      window.gameState.victory = false; window.gameState.gameOver = false;
      window.gameState.running = true;
      window.inputManager?.resetActionEdges?.();
      return true;
    },
    checkpoint(id) {
      if (!this.active || !this.returnTo || !Object.hasOwn(CHECKPOINTS, id)) return false;
      const s = this.state;
      const saved = B.Campaign.archive().checkpoint({ levelId: ID, checkpointId: id,
        levelState: { proofVersion: 4, returnTo: clone(this.returnTo), proof: {
          progress: id === 'road-start' ? 0 : s.progress, lane: s.lane, lanePos: s.lanePos,
          musicBar: id === 'road-start' ? 0 : s.musicBar, gateAt: s.gateAt,
          gateOpen: s.gateOpen,
          speed: s.speed, timeMs: Math.ceil(s.timeMs),
          lockEnergy: Math.round(s.lockEnergy), echoEnergy: Math.round(s.echoEnergy),
          boost: s.boost, score: s.score, peakStack: s.peakStack,
          cleanBars: s.cleanBars, integrity: Math.max(1, s.integrity) } } });
      B.Campaign.syncTitleButton();
      return saved;
    },
    async exit() {
      if (!this.active || this.exiting) return false;
      this.exiting = true;
      const returnTo = clone(this.returnTo);
      const saved = B.Campaign.readResume();
      if (saved?.levelId === ID && this.validate(saved)) returnTo.levelState.cacheRoadCheckpoint = {
        checkpointId: saved.checkpointId, proofVersion: saved.levelState.proofVersion,
        proof: clone(saved.levelState.proof) };
      B.Campaign.archive().checkpoint(returnTo);
      B.Campaign.syncTitleButton();
      const result = await B.RuntimeLifecycle?.restart?.({ source: 'road-exit', resume: returnTo });
      if (!result?.ok) this.exiting = false;
      return !!result?.ok;
    },
    dispose() {
      const hint = document.querySelector?.('.hint');
      if (hint && this.oldHint !== null) hint.textContent = this.oldHint;
      this.oldHint = null;
      this.active = false; this.status = null; this.state = null;
      this.returnTo = null; this.exiting = false; this.audioDegraded = false;
    },
    retry() {
      if (!this.active || this.status === 'playing') return false;
      const saved = B.Campaign.readResume();
      const fromCheckpoint = this.status === 'clear' ? null : saved?.levelId === ID ?
        migrateProof(saved.levelState.proof, saved.levelState.proofVersion) : null;
      this.state = newState(fromCheckpoint ? { ...fromCheckpoint, integrity: 3,
        timeMs: Math.max(fromCheckpoint.timeMs || 0, 30000), echoEnergy: Math.max(fromCheckpoint.echoEnergy || 0, 100) } : {});
      this.status = 'playing';
      // A retry deliberately resumes at the saved bar. Steering never seeks.
      window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
      this.selectMusicProfile();
      window.audioSystem?.startRuntimeGameplayMusic?.();
      this.checkpoint(this.status === 'playing' && fromCheckpoint ? saved.checkpointId : 'road-start');
      window.inputManager?.resetActionEdges?.();
      return true;
    },
    keyDown(e) {
      if (this.status === 'playing') return false;
      const key = e.key.toLowerCase();
      if (!['enter', ' ', 'c'].includes(key)) return false;
      e.preventDefault?.();
      if (!e.repeat) key === 'c' ? this.exit() : this.retry();
      return true;
    },
    mixSnapshot() {
      if (!this.active || !this.state) return null;
      return { captures: this.state.captures.map(({ lane, startBeat, endBeat }) =>
        ({ lane, startBeat, endBeat })),
        // The aligned crew-vocal source is still needed before this can sound.
        bonusVocal: this.state.fullAdrenaline,
        hitRecovery: this.state.hitRecovery };
    },
    startOffsetSec() { return (this.state?.musicBar || 0) * 1.875; },
    updateCaptures(music) {
      if (!music?.running || music.profileId !== PROFILE || !music.grid) return;
      const s = this.state, { beatIndex, barIndex } = music.grid;
      s.musicBeatFloat = music.grid.beatFloat;
      // Score a finished bar before retiring a part at its last beat.
      for (let completed = s.scoredThrough + 1; completed < barIndex && completed < 100; completed++) {
        if (completed !== s.damagedBar) {
          const parts = new Set(s.captures.filter(c => c.startBeat < (completed + 1) * BAR_BEATS &&
            c.endBeat > completed * BAR_BEATS).map(c => c.lane));
          s.score += 100 * Math.max(1, parts.size); s.cleanBars++;
        }
      }
      s.scoredThrough = Math.max(s.scoredThrough, barIndex - 1);
      s.captures = s.captures.filter(c => c.endBeat > beatIndex && laneAvailable(c.lane, barIndex));
      for (const queued of s.queuedCaptures.filter(c => c.startBeat <= beatIndex)) {
        if (queued.endBeat <= beatIndex || !laneAvailable(queued.lane, barIndex)) continue;
        const prior = s.captures.find(c => c.lane === queued.lane);
        if (prior) s.captures.splice(s.captures.indexOf(prior), 1);
        s.captures.push(queued);
        s.hitRecovery = false;
      }
      s.queuedCaptures = s.queuedCaptures.filter(c => c.startBeat > beatIndex);
      s.peakStack = Math.max(s.peakStack, stackSize(s));
      const full = s.captures.length === 4;
      if (full && !s.fullAdrenaline) {
        s.fullAdrenalineCount++;
        s.message = 'FULL ADRENALINE'; s.messageMs = 1300;
        window.audioSystem?.playCombatCue?.('data');
      }
      s.fullAdrenaline = full;
    },
    // The pad stays at its world address. Only the fourth beat of a measure
    // can catch it; a longer visible approach preserves a fair opportunity
    // at normal and boosted speeds without moving the marking with the song.
    catchPulse(action, pressTimeSec) {
      const s = this.state;
      const now = Number.isFinite(pressTimeSec) ? pressTimeSec : window.audioSystem?.context?.currentTime;
      const judgment = B.MusicTransport?.judgeInput?.('road-pulse', now,
        B.Preferences?.values?.inputOffsetMs || 0);
      if (!judgment?.available || judgment.timing === 'miss' ||
        judgment.beatIndex % BAR_BEATS !== BAR_BEATS - 1) return false;
      const pulse = PULSES.find(p => p.at - s.progress >= -PAD_LATE &&
        p.at - s.progress <= PAD_EARLY && PULSE_ACTIONS[p.action].key === action &&
        !s.caughtPulses[p.id] && Math.abs(s.lanePos - p.lane) <= .38);
      if (!pulse) return false;
      s.caughtPulses[pulse.id] = true;
      const fast = s.speed >= 61, slow = s.speed <= 36;
      s.pulseCombo = pulse.run === s.lastPulseRun && pulse.order === s.lastPulseOrder + 1 ?
        s.pulseCombo + 1 : 1;
      s.lastPulseRun = pulse.run; s.lastPulseOrder = pulse.order;
      const long = s.pulseCombo >= 2;
      const startBeat = judgment.beatIndex;
      const endBeat = Math.min(400, startBeat + (long ? 2 : 1) * PULSE_BEATS);
      const existing = s.captures.find(c => c.lane === pulse.lane) ||
        s.queuedCaptures.find(c => c.lane === pulse.lane);
      if (existing) existing.endBeat = Math.max(existing.endBeat, endBeat);
      else s.queuedCaptures.push({ lane: pulse.lane, startBeat, endBeat, inkAtMs: s.elapsedMs });
      s.opening.held = true;
      if (long) s.opening.sealed = true;
      s.pulseFlashMs = 650;
      s.pulseFlashAction = pulse.action;
      s.score += (judgment.timing === 'perfect' ? 80 : 50) * (fast ? 2 : 1);
      if (fast && ++s.fastPulses % 2 === 0) s.boost = 1;
      if (slow) s.echoEnergy = clamp(s.echoEnergy + 25, 0, 100);
      switch (action) {
        case 'road_a': s.surgeMs = Math.max(s.surgeMs, 900); break;
        case 'road_b': s.ramMs = Math.max(s.ramMs, 1800); break;
        case 'road_x': s.shield = 1; break;
        case 'road_y':
          s.echoEnergy = clamp(s.echoEnergy + 40, 0, 100);
          if (fast) s.boost = 1;
          break;
      }
      const effect = PULSE_ACTIONS[pulse.action].label;
      s.message = `${effect} // ${LANES[pulse.lane]} +${long ? 16 : 8} BARS` +
        (fast ? '  FAST x2' : slow ? '  ECHO +25' : '');
      s.messageMs = 1100;
      window.audioSystem?.playCombatCue?.('pickup');
      return true;
    },
    sendEcho() {
      const s = this.state;
      if (s.echoEnergy < 100) {
        s.message = 'BUFFER NEEDS A CLEAN TRACE'; s.messageMs = 950; return;
      }
      s.echoEnergy = 0;
      // Give the first audit and final exit time for a visible split. Both
      // appear shortly after a marker; other Echos keep their short duration.
      const firstAudit = s.progress >= 850 && s.progress < 975;
      const finalExit = s.gateAt != null && s.progress >= s.gateAt - 220 && s.progress < s.gateAt;
      const durationMs = firstAudit || finalExit ? 6000 : 2700;
      s.echo = { lanePos: s.lanePos, progress: s.progress, ageMs: 0, durationMs,
        path: s.trace.map(sample => ({ ...sample })), sampleIndex: 0, sampleMs: 0 };
      s.rivalDistractedMs = durationMs;
      s.opening.echo = true;
      s.message = 'BUFFER ECHO // SPLIT THE LINE'; s.messageMs = 1700;
      window.audioSystem?.playCombatCue?.('data');
    },
    handleActions(actions) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state;
      s.steer = Number(!!actions.move_right?.held) - Number(!!actions.move_left?.held);
      s.braking = !!actions.move_down?.held;
      s.throttling = !!actions.move_up?.held && !s.braking;
      for (const face of PULSE_ACTIONS)
        for (const press of actions[face.key]?.presses?.length ? actions[face.key].presses :
          actions[face.key]?.pressed ? [{ audioTimeSec: window.audioSystem?.context?.currentTime }] : [])
          this.catchPulse(face.key, press.audioTimeSec);
      if (actions.road_echo?.pressed) this.sendEcho();
      if (actions.road_turbo?.pressed && s.boost > 0) {
        s.boost = 0; s.nearMisses = 0; s.boostMs = 1250;
        s.opening.turbo = true;
        s.message = 'TURBO // ORIGINAL SIGNAL HELD'; s.messageMs = 900;
        window.audioSystem?.playCombatCue?.('lift');
      }
    },
    hit(kind) {
      const s = this.state;
      if (s.invulnerableMs || s.boostMs) return;
      if (s.ramMs > 0) {
        s.ramMs = 0; s.score += 100; s.message = 'PUSH // TRAFFIC CLEARED';
        s.messageMs = 900; window.audioSystem?.playCombatCue?.('cutline'); return;
      }
      if (s.shield) {
        s.shield = 0; s.message = 'BRACE // IMPACT BLOCKED';
        s.messageMs = 900; window.audioSystem?.playCombatCue?.('land'); return;
      }
      s.integrity--; s.speed = Math.max(20, s.speed - 19); s.timeMs = Math.max(0, s.timeMs - 1800);
      s.invulnerableMs = 1400;
      s.damagedBar = s.musicBar;
      s.captures = []; s.queuedCaptures = []; s.fullAdrenaline = false;
      s.pulseCombo = 0; s.lastPulseRun = null; s.lastPulseOrder = -1;
      s.hitRecovery = true;
      s.shield = 0; s.ramMs = 0; s.surgeMs = 0;
      s.stumbleMs = 650; s.cutStreak = 0; s.cutFlashMs = 0; s.nearMisses = 0;
      s.message = ''; s.messageMs = 0;
      window.audioSystem?.playRoadStumble?.();
      window.audioSystem?.playCombatCue?.('damage');
      if (s.integrity <= 0) this.status = s.status = 'failed';
    },
    cleanPass(cut = false) {
      const s = this.state;
      // Traffic skill charges abilities and score; the visible pulses earn music.
      // A collision's grace window is recovery, not a clean crossing.
      if (s.invulnerableMs) return;
      s.nearMisses++;
      s.echoEnergy = clamp(s.echoEnergy + (cut ? 35 : 16), 0, 100);
      s.cutStreak = cut ? Math.min(4, s.cutStreak + 1) : 0;
      const points = (cut ? 150 * s.cutStreak : 25) * stackSize(s);
      s.score += points;
      if (s.nearMisses >= 2) { s.boost = 1; s.nearMisses = 0; }
      if (cut) { s.cutFlashMs = 740; s.cutAward = points; }
      else { s.message = `NEAR MISS // +${points}  TURBO ${s.nearMisses}/2`; s.messageMs = 850; }
      window.audioSystem?.playCombatCue?.(cut ? 'cutline' : 'pickup');
    },
    update(delta) {
      if (!this.active || this.status !== 'playing' || this.exiting) return;
      const s = this.state, dt = Math.min(100, Math.max(0, delta));
      if (!dt) return;
      const before = s.progress;
      const music = B.MusicTransport?.sample?.(window.audioSystem?.context?.currentTime || 0);
      const previousBar = s.musicBar;
      const bar = music?.running && music.profileId === PROFILE && music.grid ?
        Math.max(0, music.grid.barIndex) : previousBar;
      this.updateCaptures(music);
      s.musicBar = Math.max(previousBar, bar);
      s.elapsedMs += dt; s.timeMs = Math.max(0, s.timeMs - dt);
      s.boostMs = Math.max(0, s.boostMs - dt);
      s.ramMs = Math.max(0, s.ramMs - dt);
      s.surgeMs = Math.max(0, s.surgeMs - dt);
      s.pulseFlashMs = Math.max(0, s.pulseFlashMs - dt);
      s.invulnerableMs = Math.max(0, s.invulnerableMs - dt);
      s.stumbleMs = Math.max(0, s.stumbleMs - dt);
      s.cutFlashMs = Math.max(0, s.cutFlashMs - dt);
      s.messageMs = Math.max(0, s.messageMs - dt);
      s.rivalDistractedMs = Math.max(0, s.rivalDistractedMs - dt);
      const seconds = dt / 1000;
      const targetSpeed = s.braking ? 23 : s.boostMs ? 75 : s.surgeMs ? 68 :
        s.throttling ? 68 : 54;
      s.speed = clamp(s.speed + clamp(targetSpeed - s.speed,
        -(s.braking ? 48 : 8) * seconds, (s.boostMs ? 47 : 22) * seconds), 18, 75);
      const curve = roadCurve(before);
      s.lanePos = clamp(s.lanePos +
        (s.steer * 2.5 - curve * (s.speed / 54) ** 2 * 0.5) * seconds, 0, 3);
      s.lane = Math.round(s.lanePos);
      s.visualLane += (s.lanePos - s.visualLane) * Math.min(1, dt / 90);
      s.progress = Math.min(15000, before + s.speed * seconds);

      // This short input trace, rather than a past world position, can be
      // replayed from the car's present location as a readable decoy.
      s.trace.push({ steer: s.steer, duration: dt });
      let traceLength = s.trace.reduce((total, sample) => total + sample.duration, 0);
      while (traceLength > 2200 && s.trace.length > 1)
        traceLength -= s.trace.shift().duration;
      if (s.echo) {
        const e = s.echo;
        e.ageMs += dt; e.progress += s.speed * seconds;
        let remaining = dt;
        while (remaining > 0 && e.sampleIndex < e.path.length) {
          const sample = e.path[e.sampleIndex], step = Math.min(remaining, sample.duration - e.sampleMs);
          e.lanePos = clamp(e.lanePos + sample.steer * 2.5 * step / 1000, 0, 3);
          e.sampleMs += step; remaining -= step;
          if (e.sampleMs >= sample.duration) { e.sampleIndex++; e.sampleMs = 0; }
        }
        if (e.ageMs >= e.durationMs) s.echo = null;
      }
      if (Math.abs(curve) > 0.48 && s.speed > 30 && s.steer * curve > 0) {
        s.echoEnergy = clamp(s.echoEnergy + 8 * seconds, 0, 100);
      }

      // Resolve every vehicle at a crossing before paying clean-pass rewards.
      // A paired gate can otherwise award a near miss from its second vehicle
      // in the very frame where its first vehicle hits the car.
      const contactAt = new Set(), pendingPasses = [];
      for (const hazard of HAZARDS) {
        const distance = hazard.at - s.progress;
        const hazardId = `${hazard.at}/${hazard.lane}`;
        if (hazard.kind === 'audit' && distance < 160 && distance > 0 &&
          !Object.hasOwn(s.audits, hazard.at)) {
          s.audits[hazard.at] = s.echo ? Math.round(s.echo.lanePos) : s.lane;
          if (hazard.at === 1135 && s.echo) s.opening.auditFollowedEcho = true;
        }
        const lane = hazardLane(hazard, s.progress, s.audits);
        if (distance <= 80 && distance > 0 && s.speed >= 38 && !s.invulnerableMs &&
            !s.boostMs && Math.abs(lane - s.lanePos) < .45)
          s.cutMarks[hazardId] = true;
        if ((hazard.kind === 'freight' || hazard.kind === 'shuttle') &&
            distance > 15 && distance < 110 &&
            Math.abs(lane - s.lanePos) < 0.42 && s.speed >= 28 && !s.drafted[hazard.at]) {
          s.draftMs += dt;
          if (s.draftMs >= 600) {
            s.drafted[hazard.at] = true; s.draftMs = 0; s.boost = 1;
            s.echoEnergy = clamp(s.echoEnergy + 25, 0, 100);
            s.message = hazard.kind === 'shuttle' ? 'SHUTTLE DRAFT // TURBO READY' :
              'FREIGHT DRAFT // TURBO READY'; s.messageMs = 900;
          }
        }
        if (before >= hazard.at || s.progress < hazard.at) continue;
        const gap = Math.abs(lane - s.lanePos);
        if (gap < (['freight','shuttle','sweeper'].includes(hazard.kind) ? 0.53 :
            hazard.kind === 'trike' ? 0.38 : 0.45)) {
          if (contactAt.has(hazard.at)) continue;
          contactAt.add(hazard.at);
          this.hit(hazard.kind === 'block' ? 'roadblock' : hazard.kind);
          if (this.status === 'failed') return;
        } else if (gap < 1.30 && s.speed >= 25) {
          pendingPasses.push({ at: hazard.at,
            cut: !!s.cutMarks[hazardId] && gap < 1.20 && s.speed >= 38 });
        }
        delete s.cutMarks[hazardId];
      }
      const paidAt = new Set();
      for (const pass of pendingPasses) if (!contactAt.has(pass.at) && !paidAt.has(pass.at)) {
        this.cleanPass(pass.cut); paidAt.add(pass.at);
      }
      if (s.progress >= 3 * LAP + 1700 && s.musicBar < 100) {
        const distance = s.nextRivalAt - s.progress;
        const enteringWarning = !s.rivalWarning && distance <= 120 && distance > 0;
        s.rivalWarning = distance <= 120 && distance > 0;
        if (s.rivalWarning) {
          if (enteringWarning) {
            s.rivalTarget = s.lanePos;
            s.rivalEchoCommitted = false;
            window.audioSystem?.playCombatCue?.('warning');
          }
          if (s.echo && s.rivalDistractedMs && !s.rivalEchoCommitted) {
            s.rivalTarget = s.echo.lanePos;
            s.rivalEchoCommitted = true;
          }
          s.rivalLane += (s.rivalTarget - s.rivalLane) * Math.min(1, dt / 290);
        }
        if (before < s.nextRivalAt && s.progress >= s.nextRivalAt) {
          const decoy = !!s.echo && s.rivalDistractedMs > 0 && s.rivalEchoCommitted;
          if (decoy && Math.abs(s.echo.lanePos - s.lanePos) >= 0.7) {
            s.echoDeceptions++;
            s.message = 'RIVAL TOOK THE REPLAY'; s.messageMs = 1200;
          } else if (Math.abs(s.rivalLane - s.lanePos) < 0.55) {
            this.hit('clean copy');
            if (this.status === 'failed') return;
          }
          const density = stackSize(s);
          s.nextRivalAt = s.progress + (density >= 3 ? 155 : 225);
          s.rivalWarning = false; s.rivalEchoCommitted = false;
        }
      }
      if (before < 850 && s.progress >= 850) {
        s.timeMs = Math.max(s.timeMs, 33000) + (stackSize(s) - 1) * 1800;
        s.echoEnergy = 100;
        this.checkpoint('road-cache'); s.message = 'ORIGINAL TAPE / KEEP MOVING'; s.messageMs = 1600;
      }
      if (before < 1700 && s.progress >= 1700) {
        s.timeMs = Math.max(s.timeMs, 31000) + (stackSize(s) - 1) * 1800;
        s.echoEnergy = 100;
        this.checkpoint('road-fork'); s.message = 'A CLEAN COPY IS MISSING NAMES'; s.messageMs = 2400;
      }
      for (const [at, id] of [[28, 'road-verse-2'], [52, 'road-verse-3'], [76, 'road-verse-4']]) {
        if (previousBar < at && s.musicBar >= at) {
          s.timeMs = Math.max(s.timeMs, 55000);
          this.checkpoint(id);
          s.message = `VERSE ${1 + Math.floor(at / 24)} // HOLD THE ORIGINAL`;
          s.messageMs = 1800;
        }
      }
      if (previousBar < 92 && s.musicBar >= 92 && s.gateAt == null) {
        s.gateAt = Math.max(GATE, s.progress + 300);
        s.echoEnergy = 100;
      }
      if (s.gateAt != null && before < s.gateAt && s.progress >= s.gateAt) {
        if (s.lanePos < 2.45 || !s.echo || s.rivalDistractedMs <= 0 ||
            Math.abs(s.echo.lanePos - s.lanePos) < 0.75) {
          s.gateFailure = s.lanePos < 2.45 ? 'wrong-lane' :
            !s.echo || s.rivalDistractedMs <= 0 ? 'no-echo' : 'no-split';
          // Stop at the missed exit. Moving the car backward while play kept
          // running looked like a broken game loop, not a deliberate retry.
          this.status = s.status = 'failed';
          return;
        } else {
          s.timeMs = Math.max(s.timeMs, 21000);
          s.gateOpen = true; this.checkpoint('road-gate');
          s.message = 'ORIGINAL THROUGH // MAC: DISTRIBUTION DENIED'; s.messageMs = 3500;
        }
      }
      if (s.gateOpen && s.musicBar >= 100 && s.progress >= s.gateAt + 400) {
        this.status = s.status = 'clear';
        this.checkpoint('road-clear');
      }
      if (s.musicBar >= 100 && this.status === 'playing') {
        this.status = s.status = 'failed'; s.message = 'ORIGINAL TAPE ENDED';
      }
      if (this.status !== 'playing') window.audioSystem?.stopRuntimeAudio?.({ stopMusic: true });
      if (s.timeMs <= 0 && this.status === 'playing') {
        this.status = s.status = 'failed'; s.message = 'TRANSMISSION WINDOW CLOSED';
      }
    },
    draw(ctx) {
      if (!ctx || !this.active) return;
      const s = this.state, progress = s.progress;
      const section = s.musicBar < 4 ? 0 : Math.min(3, Math.floor((s.musicBar - 4) / 24));
      const names = ['RAINLINE', 'SERVICE LOOP', 'MIRROR VIADUCT', 'DISTRIBUTION CAUSEWAY'];
      const skyBottoms = ['#9b4f74', '#dc805b', '#d87891', '#86a89d'];
      const reduced = !!B.Preferences?.values?.reducedMotion;
      const horizon = 400, bottom = 1080;
      // A camera follows the tangent of a world-space road centerline. The
      // far road bends toward its upcoming path while the car stays centered.
      const path=roadPath, heading=roadHeading;
      const eyePath=path(progress),eyeHeading=heading(progress);
      const center = t => {
        const ahead=(1-t)*520;
        return 960+(path(progress+ahead)-eyePath-ahead*eyeHeading)*.95;
      };
      const half = t => 82 + 534 * t;
      const laneEdge = (lane, t) => center(t) - half(t) + lane * half(t) / 2;
      const laneX = (lane, t) => laneEdge(lane, t) + half(t) / 4;
      const roadY = t => horizon + t * t * (bottom - horizon);
      const depth = d => clamp(1 - (d + 80) / 520, 0, 1);
      // The bank has one invertible world projection for ground, streets,
      // sites and people. Its shallow far slope lets a site clear the horizon
      // before the near slope accelerates it past the player. d=0 retains
      // the established sidewalk/road contact depth (525/620).
      const bankNear=525/620,bankReach=1200,bankCurve=3.1;
      const sideDepth = d => bankNear*Math.pow(
        Math.max(0,(bankReach-d)/bankReach),bankCurve);
      const bankAddress = t => progress+bankReach*(1-
        Math.pow(Math.max(0,t)/bankNear,1/bankCurve));
      // Painted blocks contain foreground facades inside one large card.
      // Moderate their near magnification without moving their world foot.
      const cardScale = t => t/(1+.20*t);
      // The road, curb, lot and lamp offsets all converge at the vanishing
      // point, and the same projection continues beyond the bottom of frame.
      const roadsideX = (side,t,base,growth) =>
        center(t)+side*(half(t)+(base+growth*t)*(.1+.9*t));
      // Keep the established wide planet silhouette. The compact cyber sites
      // have asymmetrical ground banks shaped for this deep roadside crest.
      const crestY = x => horizon+25+420*Math.pow(
        clamp((Math.abs(x-center(0))-150)/600,0,1),2);
      const cityCrestY = x => horizon+8+18*Math.pow(
        Math.abs(x-center(0))/960,2)+
        6*Math.sin(x/260+progress/1700)+2*Math.sin(x/93+progress/1100);
      const terrainAt = (side,t,x) => {
        const at=bankAddress(t);
        const radial=(side*(x-center(t))-half(t))/(.1+.9*t)-190*t;
        return roadY(t)+t*(LANDSCAPE.height?.(side,at,
          Math.max(220,radial))??24);
      };
      // Terrain uncovers a site as it approaches. The old fixed crest mask
      // switched off at t=.75, exposing an entire foundation in one frame.
      const roadsideRevealY=(side,t,x)=>{
        const ground=terrainAt(side,t,x)+7*t;
        return crestY(x)+(ground-crestY(x))*smooth((t-.10)/.57);
      };
      // The distant foot sits just below the visible bank. Perspective growth
      // raises a little more of the roof above that bank each frame; the
      // burial tapers away before the parcel reaches its terrain contact.
      // The clipping edge itself remains the curved hill, never the roof.
      const areaFoot=(side,t,roadwardX,groundFoot,height)=>Math.max(
        groundFoot,roadsideRevealY(side,t,roadwardX)+
          height*.8*(1-smooth((t-.025)/.22)));
      // Uncover a grounded cutout from its roof down while the bank lip
      // still hides its foundation. Its world foot never leaves the terrain.
      const emergenceLip=(t,foot,height)=>foot-height+
        height*smooth((t-.025)/.24);
      const clipRoadside = (t,draw,side,actor=null,reveal=null) => {
        ctx.save();
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1920,0);
        // People and small props need one horizontal contact line across
        // their whole width; a curved screen-space crest shears their
        // road-facing half away while the opposite half stays visible.
        const actorLip=actor&&actor.foot+5*t-
          actor.height*.55*(1-smooth((t-.16)/.4));
        const lip=reveal||actor?.reveal?emergenceLip(t,
          (reveal||actor).foot,(reveal||actor).height):Infinity;
        for(let x=1920;x>=0;x-=30)
          ctx.lineTo(x,Math.min(actor?actorLip:roadsideRevealY(side,t,x),lip));
        ctx.closePath();ctx.clip();
        draw(); ctx.restore();
      };
      // Paint one authored surface tile in the world plane. Its two sides
      // use the same curve and depth as the curb, parcel and passing lamps;
      // clipping the projected quad keeps the texture inside its own slab.
      const drawSurfacePanel = (key,side,far,near,inner,outer,sourceRect=null) => {
        const point=(t,edge) => ({
          x:roadsideX(side,t,...edge.slice(0,2)),
          y:terrainAt(side,t,roadsideX(side,t,...edge.slice(0,2)))+
            (edge[3]?0:(edge[2]-24)*t)
        });
        const fi=point(far,inner),fo=point(far,outer);
        const ni=point(near,inner),no=point(near,outer);
        const farWidth=Math.hypot(fo.x-fi.x,fo.y-fi.y);
        const nearWidth=Math.hypot(no.x-ni.x,no.y-ni.y);
        ctx.save();ctx.beginPath();ctx.moveTo(fi.x,fi.y);
        ctx.lineTo(ni.x,ni.y);ctx.lineTo(no.x,no.y);
        ctx.lineTo(fo.x,fo.y);ctx.closePath();ctx.clip();
        const reach=Math.max(1.08,Math.min(3,nearWidth/farWidth+.08));
        ctx.transform((fo.x-fi.x)*reach/256,(fo.y-fi.y)*reach/256,
          (ni.x-fi.x)/256,(ni.y-fi.y)/256,fi.x,fi.y);
        B.PresentationAssets?.draw?.(key,ctx,{x:0,y:0,width:256,height:256,
          sourceRect});
        ctx.restore();
      };
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha=1;
      const beat = reduced ? 0 : s.musicBeatFloat || 0;
      const stack = Math.min(4,s.captures?.length || 0);
      const beatPulse = reduced ? 0 : Math.pow(1-((beat%1+1)%1),5);
      const energy = stack/4 + (s.boostMs ? .3 : 0) + beatPulse*.27;
      const hue = (186 + section*65 + Math.sin(beat*.31)*55 + energy*37 + 360)%360;
      const sky = ctx.createLinearGradient(0, 0, 0, horizon + 70);
      sky.addColorStop(0, `hsl(${hue},48%,${9+energy*3}%)`);
      sky.addColorStop(.48, `hsl(${(hue+42)%360},58%,${14+energy*5}%)`);
      sky.addColorStop(1, skyBottoms[section]);
      ctx.fillStyle = sky; ctx.fillRect(0, 0, 1920, 1080);
      ctx.fillStyle = '#122236'; ctx.fillRect(0, horizon, 1920, bottom - horizon);
      // Wide veils move with the shared beat and the number of parts playing.
      // Reduced Motion holds their geometry in place.
      ctx.save(); ctx.globalCompositeOperation='screen';
      for (let k=0;k<4;k++) {
        const cx=230+k*490+Math.sin(beat*(.18+k*.037)+k*1.8)*180;
        const cy=80+k%2*105+Math.cos(beat*.29+k*2)*28;
        const radius=290+k*45;
        const wash=ctx.createRadialGradient(cx,cy,20,cx,cy,radius);
        wash.addColorStop(0,`hsla(${(hue+64+k*45)%360},90%,60%,${.23+energy*.14})`);
        wash.addColorStop(.55,`hsla(${(hue+22+k*36)%360},72%,40%,.075)`);
        wash.addColorStop(1,'#00000000');
        ctx.fillStyle=wash; ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2);
        for (let ribbon=0;ribbon<3;ribbon++) {
          ctx.strokeStyle=`hsla(${(hue+k*41)%360},88%,72%,${(.07+energy*.026)/(ribbon+1)})`;
          ctx.lineWidth=45+ribbon*42;
          ctx.beginPath(); ctx.moveTo(cx-radius,cy+40+ribbon*21);
          ctx.bezierCurveTo(cx-120,cy-85-ribbon*7,cx+80,cy+60+ribbon*12,
            cx+radius,cy-40+ribbon*13); ctx.stroke();
        }
      }
      for(let band=0;band<3;band++) {
        const wave=beat*(.25+band*.05)+band*2.1;
        const y=167+band*35+Math.sin(wave)*25;
        const glow=ctx.createLinearGradient(0,y-35,0,y+95);
        glow.addColorStop(0,'#00000000');
        glow.addColorStop(.42,`hsla(${(hue+band*67)%360},90%,65%,${.22+energy*.14})`);
        glow.addColorStop(1,'#00000000');
        ctx.fillStyle=glow;ctx.beginPath();ctx.moveTo(-90,y+17);
        ctx.bezierCurveTo(310,y-94+Math.sin(wave+1)*45,
          510,y+40+Math.cos(wave+2)*50,890,y-12);
        ctx.bezierCurveTo(1200,y-88+Math.sin(wave+3)*38,
          1510,y+50+Math.cos(wave+1)*42,2010,y-45);
        ctx.lineTo(2010,y+70);
        ctx.bezierCurveTo(1490,y+125,1150,y+8,890,y+87);
        ctx.bezierCurveTo(580,y+137,290,y+25,-90,y+118);
        ctx.closePath();ctx.fill();
      }
      ctx.restore();
      // One opaque landscape continues beneath every roadside location.
      const land=ctx.createLinearGradient(0,horizon,0,bottom);
      land.addColorStop(0,'#263b43');land.addColorStop(1,'#293f43');
      ctx.fillStyle=land;ctx.fillRect(0,horizon,1920,bottom-horizon);
      // The three city paintings share the road's world path. All begin at
      // the center of their wider-than-screen source. Near architecture
      // tracks turns most, while the close frontage rises from completely
      // below the skyline lip to a clear silhouette by the end of the run.
      const startBearing=path(520)-path(0)-520*heading(0);
      const currentBearing=path(progress+520)-eyePath-520*eyeHeading;
      const bearing=clamp((eyePath-path(0))*.7+
        (eyeHeading-heading(0))*160+
        (currentBearing-startBearing)*.62,-330,330);
      const cityDistance=clamp(progress/END,0,1);
      const cityApproach=cityDistance*cityDistance*(3-2*cityDistance);
      ctx.save();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(1920,0);
      for(let x=1920;x>=0;x-=30)ctx.lineTo(x,cityCrestY(x));
      ctx.closePath();ctx.clip();
      const cityLayers=[
        // key, width, height, foot, opacity, horizontal parallax
        ['cacheDistantCity',2600,800,520,.53,.18],
        ['cacheOutskirts',2680,760,540,.68,.48],
        ['cacheMidCity',2800,450,825-405*cityApproach,.88,.90]
      ];
      for(const [key,width,height,foot,opacity,parallax] of cityLayers) {
        ctx.globalAlpha=opacity;
        B.PresentationAssets?.draw?.(key,ctx,{
          x:(1920-width)/2-bearing*parallax,y:foot,
          width,height });
      }
      ctx.restore();
      // Level 1's animated ships cross above this road at different depths
      // and bank angles. They never enter the collision system.
      for (let i=0;i<5;i++) {
        const forward=i%2===0, model=i%3===0?'cacheFly1':'cacheFly3';
        const travel=(reduced?0:progress)*(forward?.22:-.15);
        const x=((i*511+travel+260)%2360+2360)%2360-220;
        const y=202+(i%3)*38+(reduced?0:Math.sin(progress*.013+i*2.4)*7);
        const width=73+(i%3)*15, height=width*(model==='cacheFly1'?.26:.30);
        const angle=(forward?-.055:.075)+(reduced?0:Math.sin(progress*.008+i)*.025);
        const frame=Math.floor((reduced?0:(s.elapsedMs||0))/40+i*27)%(model==='cacheFly1'?81:122);
        ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
        ctx.globalAlpha=.58+(i%3)*.08;
        B.PresentationAssets?.draw?.(model,ctx,{
          x:0,y:0,width,height,frame,
          // The pink ship is painted nose-right; the gray ship is nose-left.
          flip:model==='cacheFly1'?!forward:forward });
        ctx.restore();
      }
      // The sampled ground below is the single material pass for both
      // banks. Its strips cover the contact points of older cards.
      ctx.save();ctx.beginPath();
      for(let x=0;x<=1920;x+=20) {
        if(x===0)ctx.moveTo(x,cityCrestY(x));
        else ctx.lineTo(x,cityCrestY(x));
      }
      ctx.strokeStyle='#102a34';ctx.lineWidth=6;ctx.stroke();
      ctx.restore();
      // Neighboring strips sample adjacent rows of one world-fixed material.
      const grainPeriod=624,grainTop=32,grainHeight=823;
      // The shared local-street material is 1254 square; a 64-pixel strip remains
      // inside its source row when the address wraps.
      const localStreetPeriod=1254-64;
      // Paint sampled world strips far to near. Each opaque nearer strip
      // hides the foot of an older card and the road beyond its local rise.
      // A card has a fixed world address: terrain, not alpha, reveals it.
      const streetPoint=(side,node,atOffset=0,radialOffset=0)=>{
        const t=sideDepth(node.at+atOffset-progress);
        const x=roadsideX(side,t,node.radial+radialOffset,190);
        return [x,terrainAt(side,t,x)+3*t];
      };
      const paintProjectedStreet=(corners,row,key='cacheLocalStreet',alpha=.95)=>{
        const [a,b,c,d]=corners;
        // A single affine image spans a parallelogram, while a road recedes
        // as a trapezoid. Two mapped triangles cover its exact four corners.
        const paintHalf=(path,matrix)=>{
          ctx.save();ctx.beginPath();ctx.moveTo(...a);
          for(const corner of path)ctx.lineTo(...corner);
          ctx.closePath();ctx.clip();ctx.globalAlpha=alpha;
          ctx.transform(...matrix,a[0],a[1]);
          B.PresentationAssets?.draw?.(key,ctx,{x:0,y:0,
            width:256,height:256,
            sourceRect:key==='cacheLocalStreet'?[0,row,256,64]:[0,0,256,64]});
          ctx.restore();
        };
        paintHalf([b,c],[(b[0]-a[0])/256,(b[1]-a[1])/256,
          (c[0]-b[0])/256,(c[1]-b[1])/256]);
        paintHalf([c,d],[(c[0]-d[0])/256,(c[1]-d[1])/256,
          (d[0]-a[0])/256,(d[1]-a[1])/256]);
      };
      const paintLocalStreet=part=>{
        const {side,a,b,halfWidth}=part;
        const along=b.at-a.at,across=(b.radial-a.radial)*.5;
        const len=Math.hypot(along,across)||1;
        const atOff=-across/len*halfWidth;
        const radialOff=along/len*halfWidth*2;
        const left=streetPoint(side,a,atOff,radialOff);
        const right=streetPoint(side,a,-atOff,-radialOff);
        const endRight=streetPoint(side,b,-atOff,-radialOff);
        const endLeft=streetPoint(side,b,atOff,radialOff);
        ctx.save();ctx.globalAlpha=.96;
        polygon(ctx,[left,right,endRight,endLeft],'#17242a');
        // An affine map of the whole tapered quad leaves an uncovered
        // triangle. Split along the diagonal; both triangles use the same
        // source address, so the moving road never shows a flat wedge.
        const row=((Math.floor(a.at*2)%localStreetPeriod)+
          localStreetPeriod)%localStreetPeriod;
        paintProjectedStreet([left,right,endRight,endLeft],row);
        // Decals are mapped to the exact graph street quad. A gap never
        // gains a painted road unless the road graph actually owns it.
        const decal=part.edgeIndex===0&&part.segment===0?
          'cacheDecalCrosswalk':
          part.edgeIndex===0&&part.segment===1?'cacheDecalStopLine':
          part.edgeIndex===1&&part.segment===0?'cacheDecalDrainage':
          part.edgeIndex===1&&part.segment===part.segments-1?
            (part.family==='workshop'||part.family==='transit'?
              'cacheDecalLoadingBay':'cacheDecalServiceStencil'):
          part.edgeIndex===1&&part.segment===2&&
            (part.family==='data'||part.family==='market')?
              'cacheDecalWetRepairPatch':null;
        if(decal)paintProjectedStreet([left,right,endRight,endLeft],0,decal,.76);
        ctx.globalAlpha=.42;ctx.strokeStyle='#829a91';
        ctx.lineWidth=.7+.7*sideDepth(part.at-progress);
        for(const line of [[left,endLeft],[right,endRight]]) {
          ctx.beginPath();ctx.moveTo(...line[0]);ctx.lineTo(...line[1]);ctx.stroke();
        }
        ctx.restore();
      };
      // Parking is a world-addressed patch of the same rolling bank.
      const drawProjectedLocale = (place,t) => {
        const side=place.side;
        const nearAt=place.at-67*place.size;
        const farAt=place.at+82*place.size;
        const n=clamp(sideDepth(nearAt-progress),.06,1.18);
        const f=clamp(sideDepth(farAt-progress),.06,1.18);
        const lotX=(tt,outer=false)=>roadsideX(side,tt,
          outer?605+place.setback:255,outer?345:215);
        const lotY=(tt,outer=false)=>terrainAt(side,tt,lotX(tt,outer));
        clipRoadside(t,()=>{
          ctx.globalAlpha=1;
          // Address-aligned 24-unit tiles preserve their texels when a lot
          // crosses the horizon, and share the street's affine quad mapping.
          for(let at=Math.floor(farAt/24)*24;at>nearAt-24;at-=24) {
            const ahead=Math.min(farAt,at+24),behind=Math.max(nearAt,at);
            if(ahead<=behind)continue;
            const far=clamp(sideDepth(ahead-progress),.06,1.18);
            const near=clamp(sideDepth(behind-progress),.06,1.18);
            if(near<=far)continue;
            const row=((Math.floor(at*2)%localStreetPeriod)+
              localStreetPeriod)%localStreetPeriod;
            paintProjectedStreet([
              [lotX(far),lotY(far)],
              [lotX(near),lotY(near)],
              [lotX(near,true),lotY(near,true)+17*near],
              [lotX(far,true),lotY(far,true)+17*far]
            ],row,'cacheLocalStreet',.82);
          }
          ctx.strokeStyle='#82969a8a';
          ctx.lineWidth=1+2*n;ctx.beginPath();
          ctx.moveTo(lotX(f),lotY(f));ctx.lineTo(lotX(n),lotY(n));ctx.stroke();
          for(const offset of [48,0,-48]) {
            const tt=sideDepth(place.at+offset-progress);
            if(tt<.08||tt>1.18)continue;
            ctx.strokeStyle='#9bb5b17d';ctx.lineWidth=1+3*tt;
            ctx.beginPath();ctx.moveTo(roadsideX(side,tt,350,250),lotY(tt)+4*tt);
            ctx.lineTo(lotX(tt,true),lotY(tt,true)+15*tt);ctx.stroke();
          }
          // Fence posts stop around the entrance instead of spanning the bay.
          for(const offset of [72,39,-38,-71]) {
            const tt=sideDepth(place.at+offset-progress);
            if(tt<.10||tt>1.18)continue;
            const x=lotX(tt),y=lotY(tt),height=27*tt;
            ctx.strokeStyle='#859395';ctx.lineWidth=1+2*tt;
            ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-height);ctx.stroke();
            ctx.fillStyle='#d89968';ctx.fillRect(x-2*tt,y-height-2*tt,4*tt,3*tt);
          }
        },side);
        const signT=sideDepth(place.at+70-progress);
        if(signT>.22&&signT<1.14)clipRoadside(signT,()=>{
          const x=roadsideX(side,signT,265,220),y=lotY(signT);
          ctx.fillStyle='#172936';ctx.fillRect(x-2*signT,y-67*signT,4*signT,67*signT);
          ctx.fillStyle='#476c75';ctx.fillRect(x-15*signT,y-77*signT,30*signT,24*signT);
          ctx.fillStyle='#e8c692';ctx.font=`bold ${Math.max(7,19*signT)}px Oxanium`;
          ctx.fillText('P',x-5*signT,y-58*signT);
        },side);
      };
      const clusterArt={
        '-1':[['cacheGroundClusterL1',1903,826],
          ['cacheGroundClusterL2',1903,826],['cacheGroundClusterL3',1774,887]],
        '1':[['cacheGroundClusterR1',1898,829],
          ['cacheGroundClusterR2',1774,887],['cacheGroundClusterR3',1774,887]]
      };
      const visibleAreas=[
        ...LANDSCAPE.plates.map(plate=>({at:plate.at,kind:'plate',plate})),
        ...SATELLITE_SCENES.map(scene=>({at:scene.at+43,kind:'satellite',scene})),
        ...SIDE_PLACES.map(place=>({at:place.at,
          kind:place.kind==='parking'?'parking':'place',place}))
      ].filter(area=>{
        const t=sideDepth(area.at-progress);
        return t>(area.kind==='parking'?.06:.025)&&
          t<(area.kind==='satellite'?.95:1.2);
      });
      // Ground clusters also have real world addresses. They take their
      // position in the same painter sequence as district and featured art.
      for(const side of [-1,1]) {
        const phase=side<0?41:105,spacing=440;
        for(let at=Math.floor((progress+850-phase)/spacing)*spacing+phase;
          at>progress+65;at-=spacing) {
          const t=sideDepth(at-progress);
          if(t<.025||t>.70||LANDSCAPE.owns(side,at,100))continue;
          if(SIDE_PLACES.some(place=>place.side===side &&
            place.kind!=='parking' && Math.abs(place.at-at)<145))continue;
          if(INFILL_SCENES.some(scene=>scene.side===side &&
            Math.abs(scene.at-at)<165))continue;
          if(SATELLITE_SCENES.some(scene=>scene.side===side &&
            Math.abs(scene.at-at)<145))continue;
          visibleAreas.push({at,side,index:Math.floor((at-phase)/spacing),kind:'cluster'});
        }
      }
      visibleAreas.sort((a,b)=>b.at-a.at);
      const drawArea=area=>{
        const t=sideDepth(area.at-progress);
        if(area.kind==='parking') {
          drawProjectedLocale(area.place,t);
        } else if(area.kind==='plate') {
          const {plate}=area;
          const [key,sourceW,sourceH,maxW,base,growth,
            contactBottom,contactAt,fit]=plate.art;
          const width=maxW*cardScale(t);
          const socketFraction=fit?.socketU===undefined?0:
            plate.side<0?1-fit.socketU:fit.socketU;
          const roadward=roadsideX(plate.side,t,base,growth)-
            plate.side*width*socketFraction;
          const x=roadward+plate.side*width*.5;
          if(x+width*.5<0||x-width*.5>1920)return;
          const footX=fit?.footU===undefined?roadward:
            x-width*.5+width*fit.footU;
          const height=width*(contactBottom||sourceH)/sourceW;
          const groundFoot=terrainAt(plate.side,t,footX)+
            (contactAt?(contactBottom-contactAt)*width/sourceW+6*t:22*t);
          const y=areaFoot(plate.side,t,footX,groundFoot,height);
          clipRoadside(t,()=>{
            B.PresentationAssets?.draw?.(key,ctx,{x,y,width,height,groundY:groundFoot,
              sourceRect:[0,0,sourceW,contactBottom||sourceH],flip:!!plate.flip});
            if(t>.20&&plate.tier==='front'&&plate.key==='open') {
              const capX=roadward+plate.side*13*t;
              B.PresentationAssets?.draw?.(plate.side<0?
                'cacheJoinLEndcap':'cacheJoinREndcap',ctx,{
                x:capX,y:terrainAt(plate.side,t,capX)+5*t,
                width:48*t,height:96*t });
            }
            if(t>.28&&plate.tier==='front'&&plate.key==='closed'&&
              (Number(plate.chunkId.split(':')[1])%3===0)) {
              const lightX=x+plate.side*width*.09;
              B.PresentationAssets?.draw?.(`cacheAmbient${
                plate.family[0].toUpperCase()+plate.family.slice(1)}`,ctx,{
                x:lightX,y:y-width*.24,width:54*t,height:54*t,
                frame:reduced?1:Math.floor((s.elapsedMs||0)/230+
                  Number(plate.chunkId.split(':')[1]))%4});
            }
          },plate.side);
        } else if(area.kind==='cluster') {
          const {side,index}=area;
          const variants=clusterArt[String(side)];
          const [key,sourceW,sourceH]=variants[((index%3)+3)%3];
          const width=(1190+70*placeRandom(index*83+side*19))*cardScale(t);
          const x=roadsideX(side,t,
            580+80*placeRandom(index*79+side*23)+280*t,300);
          if(x+width*.5<0||x-width*.5>1920)return;
          const height=width*sourceH/sourceW;
          const roadward=x-side*width*.5;
          const groundFoot=terrainAt(side,t,x)+60*t;
          const y=areaFoot(side,t,roadward,groundFoot,height);
          clipRoadside(t,()=>{
            ctx.globalAlpha=1;
            B.PresentationAssets?.draw?.(key,ctx,{
              x,y,width,height,groundY:groundFoot,flip:false });
          },side);
        } else if(area.kind==='satellite') {
          const {scene}=area,side=scene.side;
          const [key,sourceW,sourceH,maxW]=scene.art;
          const width=Math.min(720,maxW)*cardScale(t);
          const sidewalkEdge=roadsideX(side,t,220,190);
          const x=sidewalkEdge+side*(width*.5+29*t);
          if(x+width*.5<0||x-width*.5>1920)return;
          const height=width*sourceH/sourceW;
          const groundFoot=terrainAt(side,t,x)+9*t;
          const y=areaFoot(side,t,sidewalkEdge+side*29*t,groundFoot,height);
          clipRoadside(t,()=>B.PresentationAssets?.draw?.(key,ctx,{
            x,y,width,height,groundY:groundFoot,flip:side>0 }),side);
        } else {
          const {place}=area,side=place.side;
          const [key,sourceW,sourceH,maxW]=
            (place.variant&&SIDE_VARIANTS[place.variant].art)||PLACE_ART[place.kind];
          const width=maxW*cardScale(t)*place.size;
          const height=width*sourceH/sourceW;
          const sidewalkEdge=roadsideX(side,t,220,190);
          const x=sidewalkEdge+side*(width*.5+(26+place.setback)*t);
          const roadward=sidewalkEdge+side*(26+place.setback)*t;
          const groundFoot=terrainAt(side,t,x);
          const y=areaFoot(side,t,roadward,groundFoot,height);
          clipRoadside(t,()=>B.PresentationAssets?.draw?.(key,ctx,{
            x,y,width,height,groundY:groundFoot,flip:place.variant?
              !!SIDE_VARIANTS[place.variant].flip:placeFacesRoad(place.kind,side) }),
            side);
        }
      };
      const visibleStreetParts=(LANDSCAPE.streetParts||[]).filter(part=>{
        const t=sideDepth(part.at-progress);
        return t>.09&&t<1.2;
      });
      const visibleCourts=(LANDSCAPE.streets||[]).map(street=>({
        side:street.side,at:street.nodes[2].at,family:street.family
      })).filter(court=>{
        const t=sideDepth(court.at-progress);
        return t>.10&&t<1.17;
      });
      const layerStep=24;
      for(let at=Math.floor((progress+864)/layerStep)*layerStep;
        at>progress-200;at-=layerStep) {
        const far=sideDepth(at+layerStep-progress);
        const near=sideDepth(at-progress);
        if(far<.018||near>1.35)continue;
        for(const side of [-1,1]) {
          ctx.save();ctx.beginPath();ctx.moveTo(0,cityCrestY(0));
          for(let xx=30;xx<=1920;xx+=30)
            ctx.lineTo(xx,cityCrestY(xx));
          ctx.lineTo(1920,bottom);ctx.lineTo(0,bottom);
          ctx.closePath();ctx.clip();
          ctx.globalAlpha=1;
          drawSurfacePanel('cacheOuterGround',side,far,near,
            [220,190,24,0],[2500,440,40,1]);
          const row=((at%grainPeriod)+grainPeriod)%grainPeriod;
          const sourceY=grainTop+grainHeight*(1-(row+layerStep)/grainPeriod);
          ctx.globalAlpha=.44;
          drawSurfacePanel('cacheRollingGrain',side,far,near,
            [220,190,24,0],[2500,440,40,1],
            [side<0?0:265,sourceY,1509,
              grainHeight*layerStep/grainPeriod]);
          ctx.restore();
        }
        for(const court of visibleCourts) {
          if(court.at<at||court.at>=at+layerStep)continue;
          const corners=[
            streetPoint(court.side,{at:court.at+36,radial:575}),
            streetPoint(court.side,{at:court.at+36,radial:700}),
            streetPoint(court.side,{at:court.at-36,radial:700}),
            streetPoint(court.side,{at:court.at-36,radial:575})
          ];
          ctx.save();ctx.globalAlpha=.88;
          polygon(ctx,corners,'#30414a');
          const material=court.family==='homes'||court.family==='transit'?
            'cacheResidentialPaving':court.family==='greenhouse'?
            'cachePlantedGravelCourt':
            court.family==='workshop'||court.family==='data'?
            'cacheServiceCourtPaving':'cacheLocalStreet';
          // The court stays within its four projected corners and shares
          // the same depth/terrain sample as the connected branch.
          paintProjectedStreet(corners,
            ((Math.floor(court.at*2)%localStreetPeriod)+localStreetPeriod)%localStreetPeriod,
            material,.84);
          ctx.globalAlpha=.44;ctx.strokeStyle='#82949b';
          ctx.lineWidth=1.3;
          ctx.beginPath();ctx.moveTo(...corners[0]);
          for(let i=1;i<corners.length;i++)ctx.lineTo(...corners[i]);
          ctx.closePath();ctx.stroke();
          ctx.restore();
        }
        for(const part of visibleStreetParts)
          if(part.at>=at&&part.at<at+layerStep)paintLocalStreet(part);
        for(const area of visibleAreas)
          if(area.at>=at&&area.at<at+layerStep)drawArea(area);
      }
      // Side decks track the same bend as the lane geometry. Real parapet and
      // pylon art is placed at world distances below, after the asphalt.
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#263749';
        ctx.beginPath();
        for (let i=0; i<=28; i++) {
          const t=i/28;
          const xx=roadsideX(side,t,73,50);
          if (!i) ctx.moveTo(xx,roadY(t)); else ctx.lineTo(xx,roadY(t));
        }
        for (let i=28; i>=0; i--) {
          const t=i/28;
          ctx.lineTo(roadsideX(side,t,220,190),roadY(t)+24*t);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#8296a1'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i=0; i<=28; i++) {
          const t=i/28, xx=roadsideX(side,t,220,190);
          if (!i) ctx.moveTo(xx,roadY(t)+24*t); else ctx.lineTo(xx,roadY(t)+24*t);
        }
        ctx.stroke();
      }
      for(let at=Math.floor((progress+520)/55)*55;at>progress-170;at-=55) {
        const far=sideDepth(at+55-progress),near=sideDepth(at-progress);
        if(far<.11||near>1.18)continue;
        for(const side of [-1,1])
          drawSurfacePanel('cacheSidewalk',side,far,near,
            [73,50,0,0],[220,190,24,0]);
      }
      // World-fixed joints and drainage marks turn the decks into sidewalks
      // that advance with the road instead of a flat colored wedge.
      for(let at=Math.floor((progress+435)/55)*55;at>progress-170;at-=55) {
        const t=sideDepth(at-progress); if(t<.16||t>1.17)continue;
        for(const side of [-1,1]) {
          const inner=roadsideX(side,t,73,50);
          const outer=roadsideX(side,t,220,190);
          const yy=roadY(t);
          ctx.strokeStyle='#bac8c16b'; ctx.lineWidth=1+2*t;
          ctx.beginPath(); ctx.moveTo(inner,yy); ctx.lineTo(outer,yy+24*t);ctx.stroke();
          ctx.fillStyle='#0a1523a8';
          ctx.fillRect(inner+side*(26+22*t)-(side<0?26*t:0),yy+2*t,26*t,4*t);
          // Wet service-lane dashes belong to the same 55-unit tile as the
          // slab joint; both expand and pass at the road's exact speed.
          if(Math.floor(at/55)%2===0) {
            const next=sideDepth(at+28-progress), far=clamp(next,.16,1.17);
            ctx.strokeStyle='#abc0bd70';ctx.lineWidth=1+3*t;
            ctx.beginPath();ctx.moveTo(roadsideX(side,t,150,114),yy+10*t);
            ctx.lineTo(roadsideX(side,far,150,114),roadY(far)+10*far);ctx.stroke();
          }
        }
      }
      // Cut a street throat through the sidewalk only at graph sockets.
      // Its corners, paving and rail opening all share the same address.
      for(const street of LANDSCAPE.streets) {
        const t=sideDepth(street.at-progress);
        if(t<.16||t>1.13)continue;
        const nearAt=street.at-street.halfWidth;
        const farAt=street.at+street.halfWidth;
        const side=street.side;
        const foot=(at,base,growth)=>{
          const tt=sideDepth(at-progress),x=roadsideX(side,tt,base,growth);
          return [x,roadY(tt)+(base>73?24*tt:0)];
        };
        const a=foot(farAt,73,50),b=foot(nearAt,73,50);
        const c=foot(nearAt,255,190),d=foot(farAt,255,190);
        clipRoadside(t,()=>{
          polygon(ctx,[a,b,c,d],'#172732');
          const row=((Math.floor(street.at*2)%localStreetPeriod)+
            localStreetPeriod)%localStreetPeriod;
          paintProjectedStreet([a,b,c,d],row);
          ctx.strokeStyle='#8ba4aa';ctx.lineWidth=1.5+2.2*t;
          for(const edge of [[a,d],[b,c]]) {
            ctx.beginPath();ctx.moveTo(...edge[0]);ctx.lineTo(...edge[1]);ctx.stroke();
          }
          // Sidewalk return edges emphasize the two real corners without
          // painting a wall across the entrance.
          ctx.strokeStyle='#a8b5b4';ctx.lineWidth=2+3*t;
          for(const corner of [a,b]){
            const outer=foot(corner===a?farAt:nearAt,275,200);
            ctx.beginPath();ctx.moveTo(...corner);ctx.lineTo(...outer);ctx.stroke();
          }
          // The transparent center of these cutouts leaves the graph road
          // clear. Their pavers and bevels turn the existing sidewalk into
          // its two measured 38-unit street corners.
          const p0=foot(nearAt-9,73,50);
          const p1=foot(farAt+9,73,50);
          const p2=foot(nearAt-9,275,200);
          const p3=foot(farAt+9,275,200);
          ctx.save();ctx.beginPath();ctx.moveTo(...p0);
          for(const p of [p1,p3,p2])ctx.lineTo(...p);
          ctx.closePath();ctx.clip();
          ctx.transform((p1[0]-p0[0])/256,(p1[1]-p0[1])/256,
            (p2[0]-p0[0])/256,(p2[1]-p0[1])/256,p0[0],p0[1]);
          for(const key of [side<0?'cacheJoinLTurn':'cacheJoinRTurn',
            side<0?'cacheJoinLCurb':'cacheJoinRCurb'])
            B.PresentationAssets?.draw?.(key,ctx,{x:0,y:0,
              width:256,height:256});
          ctx.restore();
        },side);
      }
      // Road shoulders and the paint share a single curved road projection.
      for (const side of [-1, 1]) {
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const t = i / 24, x = center(t) + side * (half(t) + 26 + 39 * t);
          if (!i) ctx.moveTo(x, roadY(t)); else ctx.lineTo(x, roadY(t));
        }
        for (let i = 24; i >= 0; i--) {
          const t = i / 24, x = center(t) + side * half(t);
          ctx.lineTo(x, roadY(t));
        }
        ctx.closePath(); ctx.fillStyle = '#44536a'; ctx.fill();
      }
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const t = i / 28;
        if (!i) ctx.moveTo(center(t) - half(t), roadY(t)); else ctx.lineTo(center(t) - half(t), roadY(t));
      }
      for (let i = 28; i >= 0; i--) { const t = i / 28; ctx.lineTo(center(t) + half(t), roadY(t)); }
      ctx.closePath(); ctx.fillStyle = '#171f2b'; ctx.fill();
      // Adjacent slices read adjacent texels from horizon to car. Advancing
      // progress decreases the source offset so a mark moves toward the car.
      // Blend the wrap over the last 108 pixels into the first 108 pixels.
      ctx.save();
      for (let i = 0; i < 28; i++) {
        let c=((-progress*.82+i*22)%616+616)%616, consumed=0;
        while (consumed<22) {
          const length=Math.min(22-consumed,616-c,c<508?508-c:22);
          const far=(i+consumed/22)/28, near=(i+(consumed+length)/22)/28;
          const mid=(far+near)/2, yy=roadY(far), endY=roadY(near);
          const args={ x:center(mid)-half(mid),y:yy,width:half(mid)*2,
            height:endY-yy+1,sourceRect:[0,108+c,2172,length] };
          const blend=c>=508 ? clamp((c+length/2-508)/108,0,1) : 0;
          ctx.globalAlpha=.27*(1-blend);
          B.PresentationAssets?.draw?.('cacheBlacktop',ctx,args);
          if (blend) {
            ctx.globalAlpha=.27*blend;
            B.PresentationAssets?.draw?.('cacheBlacktop',ctx,{
              ...args,sourceRect:[0,c-508,2172,length] });
          }
          consumed+=length; c=(c+length)%616;
        }
      }
      ctx.restore();
      const roadFog=ctx.createLinearGradient(0,horizon,0,horizon+170);
      roadFog.addColorStop(0,'#1c293b9e'); roadFog.addColorStop(1,'#1c293b00');
      ctx.save(); ctx.beginPath();
      for (let i=0;i<=28;i++) {
        const t=i/28; if (!i) ctx.moveTo(center(t)-half(t),roadY(t));
        else ctx.lineTo(center(t)-half(t),roadY(t));
      }
      for (let i=28;i>=0;i--) { const t=i/28; ctx.lineTo(center(t)+half(t),roadY(t)); }
      ctx.closePath(); ctx.clip(); ctx.fillStyle=roadFog; ctx.fillRect(0,horizon,1920,170);
      ctx.restore();
      const drawStreetLife = (scene, item, person=false) => {
        const t=sideDepth(item.at-progress);
        if(t<(person?.15:.025)||t>1.08)return;
        const [key,aspect,height]=person?PEDESTRIANS[item.id]:
          [item.key,...PROP_SHAPES[item.key]];
        const h=height*t*item.scale;
        const width=h*aspect;
        const x=roadsideX(scene.side,t,item.base,person?210:260);
        if(x+width*.5<0||x-width*.5>1920)return;
        const foot=terrainAt(scene.side,t,x)+4*t;
        clipRoadside(t,()=>{
          ctx.save();ctx.globalAlpha=1;
          ctx.fillStyle='#0d19218c';ctx.beginPath();
          ctx.ellipse(x,foot+2*t,Math.max(9,width*.33),Math.max(2,4*t),0,0,Math.PI*2);
          ctx.fill();
          // World-address offset prevents fixtures flashing in lockstep.
          const propFrame = !person && !reduced ?
            ((Math.floor(((s.elapsedMs||0)+item.at*9)/310)%3)+3)%3 : 0;
          const travel=person?pedestrianTravel(item,s,reduced):null;
          const args={x,y:foot,width,height:h,
            flip:travel?false:person?item.flip:false,
            frame:travel?.frame??propFrame};
          if(!travel||!B.PresentationAssets?.draw?.(travel.key,ctx,args))
            B.PresentationAssets?.draw?.(key,ctx,{...args,frame:propFrame});
          ctx.restore();
        },scene.side,{foot,height:h,reveal:!person});
      };
      // Each group is composed at runtime from separate people. Its members
      // stay distinct, rooted in the same projected bank and pass with the road.
      for(const {scene,item} of STREET_ITEMS)
        drawStreetLife(scene,item,item.id!==undefined);
      // Stretch adjacent wall segments between the same projected road points.
      // This makes one continuous side wall rather than floating sign panels.
      for(let at=Math.floor((progress+500)/62)*62;at>progress-150;at-=62) {
        const far=clamp(sideDepth(at+62-progress),.13,1.15);
        const near=clamp(sideDepth(at-progress),.13,1.15);
        if(near<=far)continue;
        const id=Math.abs(Math.floor(at/62));
        for(const side of [-1,1]) {
          // A 38-unit mouth may fall inside a 62-unit parapet tile. Remove
          // only the graph's street width, keeping the illustrated wall
          // intact right up to both sidewalk corners.
          const mouths=LANDSCAPE.streets.filter(street=>street.side===side &&
            at<street.at+street.halfWidth &&
            at+62>street.at-street.halfWidth);
          const fx=roadsideX(side,far,46,58);
          const nx=roadsideX(side,near,46,58);
          const fy=roadY(far)-20*far, ny=roadY(near)-20*near;
          const wallH=18+63*(far+near)/2;
          let cursor=at;
          const visible=[];
          for(const street of mouths.sort((a,b)=>a.at-b.at)) {
            const start=Math.max(at,street.at-street.halfWidth);
            const end=Math.min(at+62,street.at+street.halfWidth);
            if(start>cursor)visible.push([cursor,start]);
            cursor=Math.max(cursor,end);
          }
          if(cursor<at+62)visible.push([cursor,at+62]);
          for(const [start,end] of visible) {
            if(end-start<.5)continue;
            const u0=(at+62-end)/62*690;
            const u1=(at+62-start)/62*690;
            ctx.save();ctx.globalAlpha=.70+.20*near;
            ctx.transform((nx-fx)/690,(ny-fy)/690,0,wallH/337,fx,fy);
            // Clip in the full source tile's coordinates so its texture
            // does not squash or restart at the join.
            ctx.beginPath();ctx.rect(u0,0,u1-u0,337);ctx.clip();
            B.PresentationAssets?.draw?.('cacheParapet',ctx,{
              x:345,y:337,width:690,height:337,
              sourceRect:[(id+(side<0?0:1))%3*690,282,690,337],
              flip:side===1 });
            ctx.restore();
          }
        }
      }
      for(const street of LANDSCAPE.streets) {
        if(sideDepth(street.at-progress)<.15||
          sideDepth(street.at-progress)>1.18)continue;
        for(const edgeAt of [street.at-street.halfWidth,
          street.at+street.halfWidth]) {
          const t=sideDepth(edgeAt-progress);
          if(t<.13||t>1.17)continue;
          const x=roadsideX(street.side,t,46,58);
          const wallH=18+63*t;
          ctx.save();ctx.globalAlpha=.76;
          B.PresentationAssets?.draw?.(street.side<0?
            'cacheJoinLStreetWall':'cacheJoinRStreetWall',ctx,{
            x,y:roadY(t)-20*t+wallH,
            width:9+13*t,height:wallH });
          ctx.restore();
        }
      }
      ctx.globalAlpha=1;
      for(let at=Math.floor((progress+850)/142)*142;at>progress-420;at-=142) {
        const t=sideDepth(at-progress);if(t<.025||t>1.65)continue;
        for(const side of [-1,1]) {
          if(LANDSCAPE.streets.some(street=>street.side===side &&
            Math.abs(street.at-at)<street.halfWidth+13))continue;
          const x=roadsideX(side,t,98,80);
          const width=214*t,height=400*t;
          const y=roadY(t)+18*t;
          clipRoadside(t,()=>B.PresentationAssets?.draw?.('cachePylon',ctx,{
            x,y,width,height,
            sourceRect:[42,69,954,1386],flip:side===1 }),
            side,null,{foot:y,height});
        }
      }
      // Phrase paint is a road marking, not a second translucent lane overlay.
      // Each bar is bounded by the same depth(), laneEdge() and roadY() used
      // for traffic and studs. Its near edge travels toward the car on the
      // shared song clock, while the road curves beneath every vertex.
      const cueBeatSec=B.MusicTransport?.getLastSample?.()?.grid?.beatDurationSec||60/128;
      const inputBeat=(s.musicBeatFloat||0)-
        (B.Preferences?.values?.inputOffsetMs||0)/1000/cueBeatSec;
      const beatInBar=((inputBeat%BAR_BEATS)+BAR_BEATS)%BAR_BEATS;
      const fourthWindow=Math.abs(beatInBar-(BAR_BEATS-1))<=.185/cueBeatSec;
      const fourthCharge=beatInBar<=3?smooth((beatInBar-2)/1):
        clamp(1-(beatInBar-3)/.5,0,1);
      const floatBar = s.musicBeatFloat / 4;
      // The confirmed phrase is a continuous four-bar wash, with painted
      // beat marks placed in each bar below. The wash follows the exact road
      // curve and stays under cars; upcoming captures keep only their preview.
      for(let lane=0;lane<4;lane++) {
        const capture=s.captures.find(c=>c.lane===lane &&
          c.startBeat<(floatBar+4)*4 && c.endBeat>floatBar*4);
        if(!capture)continue;
        const start=Math.max(floatBar,capture.startBeat/4);
        const end=Math.min(floatBar+4,capture.endBeat/4,100);
        const near=depth(Math.max(-55,(start-floatBar)*65));
        const far=depth((end-floatBar)*65);
        if(near<=far)continue;
        const inset=8;
        ctx.save();ctx.globalAlpha=.15;ctx.fillStyle=PALETTE[lane];
        ctx.beginPath();
        for(let i=0;i<=12;i++) {
          const t=far+(near-far)*i/12;
          const px=laneEdge(lane,t)+inset,py=roadY(t);
          if(!i)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }
        for(let i=12;i>=0;i--) {
          const t=far+(near-far)*i/12;
          ctx.lineTo(laneEdge(lane+1,t)-inset,roadY(t));
        }
        ctx.closePath();ctx.fill();ctx.restore();
      }
      for (let bar = Math.floor(floatBar) + 8; bar >= Math.floor(floatBar); bar--) {
        if (bar >= 100) continue;
        const near = depth(Math.max(-55, (bar - floatBar) * 65));
        const far = depth((bar + 1 - floatBar) * 65);
        if (near <= .12 || near <= far) continue;
        for (let lane = 0; lane < 4; lane++) {
          const active = s.captures.find(c => c.lane === lane && c.startBeat < (bar + 1) * 4 && c.endBeat > bar * 4);
          const queued = !active && s.queuedCaptures.find(c => c.lane === lane &&
            c.startBeat <= bar * 4 && c.endBeat > bar * 4);
          if (!active && !queued) continue;
          const mark = active || queued;
          const slot = bar - mark.startBeat / 4;
          const reveal = active || mark.inkAtMs == null ? 1 :
            clamp((s.elapsedMs - mark.inkAtMs - (3 - slot) * 100) / 260, 0, 1);
          if (!reveal) continue;
          // Show the next four lit bars as separate, road-bound ink tiles.
          // Queued captures keep the thin preview; a successful press swaps
          // it for the much broader confirmed painting beneath traffic.
          if(active && bar >= Math.floor(floatBar)+4)continue;
          const trimFar=far+(near-far)*.08,trimNear=far+(near-far)*.91;
          const inset=5+near*10;
          const tile=[
            [laneEdge(lane,trimNear)+inset,roadY(trimNear)],
            [laneEdge(lane+1,trimNear)-inset,roadY(trimNear)],
            [laneEdge(lane+1,trimFar)-inset,roadY(trimFar)],
            [laneEdge(lane,trimFar)+inset,roadY(trimFar)]];
          ctx.save();
          if(active) {
            ctx.globalAlpha=.68*reveal;
            if(!paintComicDecal(ctx,'cacheConfirmedBar',tile))
              polygon(ctx,tile,'#b8ebda');
          } else {
            ctx.globalAlpha=.31*reveal;
            paintComicDecal(ctx,'cachePhraseStrip',tile);
          }
          ctx.restore();
        }
        if(bar%4===0) {
          ctx.strokeStyle = '#b4f9ec';
          ctx.globalAlpha = .49;
          ctx.lineWidth = 2+near*3;
          ctx.beginPath();ctx.moveTo(laneEdge(0,near),roadY(near));
          ctx.lineTo(laneEdge(4,near),roadY(near));ctx.stroke();ctx.globalAlpha=1;
        }
        if (bar % 4 === 0 && near > .23) {
          ctx.fillStyle = '#d4fff1'; ctx.font = `bold ${Math.round(10 + 17 * near)}px Oxanium, monospace`;
          ctx.textAlign = 'right'; ctx.fillText(`${songSection(bar)} / ${bar + 1}–${bar + 4}`,
            laneEdge(0,near)-13, roadY(near)+3);
        }
      }
      for (const side of [-1, 1]) {
        ctx.strokeStyle = s.fullAdrenaline ? '#ffe4a2' :
          section === 3 ? '#a2f9c9' : '#f0a0ac'; ctx.lineWidth = 4;
        ctx.globalAlpha=.46;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const t = i / 24, x = center(t) + side * half(t);
          if (!i) ctx.moveTo(x, roadY(t)); else ctx.lineTo(x, roadY(t));
        }
        ctx.stroke();
      }
      ctx.globalAlpha=1;
      // Road studs and striped shoulder posts accelerate toward the player.
      for (let at = Math.floor(progress / 26) * 26; at < progress + 500; at += 26) {
        const d = at - progress, t = depth(d);
        if (d < -65 || t < .12) continue;
        const y = roadY(t), size = 2 + 17 * t * t;
        for (let lane = 1; lane < 4; lane++) {
          const x = laneEdge(lane, t);
          ctx.fillStyle = '#f4e4cf'; ctx.globalAlpha = .28 + t * .55;
          ctx.fillRect(x - size * .25, y - size * .7, size * .5, size * 1.4);
        }
        ctx.globalAlpha = 1;
        for (const side of [-1, 1]) {
          const x = center(t) + side * (half(t) + 18 + t * 32);
          if(at%52===0) {
            ctx.fillStyle = '#9f8290';
            ctx.fillRect(x - size*.25, y - size*1.7, size*.5, size*1.7);
            ctx.fillStyle = '#e4b594'; ctx.fillRect(x - size*.25, y - size*1.5, size*.5, size*.24);
          }
        }
      }
      // Near guardrails and lamps travel faster than the skyline and road.
      for (const side of [-1, 1]) {
        ctx.strokeStyle = '#719098a8'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 24; i++) {
          const t = i/24, xx = center(t)+side*(half(t)+43+42*t), yy = roadY(t)-22*t;
          if (!i) ctx.moveTo(xx,yy); else ctx.lineTo(xx,yy);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      const upcoming = [850, 1700].find(at => at > progress && at - progress < 410);
      if (upcoming) {
        const t = depth(upcoming - progress), far = depth(upcoming - progress + 32);
        polygon(ctx, [[laneEdge(0,t),roadY(t)],[laneEdge(4,t),roadY(t)],
          [laneEdge(4,far),roadY(far)],[laneEdge(0,far),roadY(far)]], '#385d66');
        ctx.save(); ctx.translate(center(t),roadY(t)); ctx.scale(Math.max(.5,t),Math.max(.2,t*.34));
        ctx.fillStyle = '#e5fcf1'; ctx.font = 'bold 30px Oxanium, monospace';
        ctx.textAlign = 'center'; ctx.fillText('ROAD MARKER', 0, -16); ctx.restore();
      }
      // Small inlaid road pads use world distance and the same curved road
      // projection as vehicles. Traffic is drawn afterward and occludes them.
      for (const pulse of PULSES) {
        const d = pulse.at - progress;
        // A caught marking remains part of the asphalt until it passes under
        // the car. The caught flag prevents another award, not its drawing.
        if (d < -PAD_LATE-8 || d > 345) continue;
        const near = depth(d - 18), far = depth(d + 18), mid = depth(d);
        if (mid < .17 || near <= far) continue;
        const spent=!!s.caughtPulses[pulse.id],ready=d<=PAD_EARLY&&d>=-PAD_LATE;
        // The continuous painted strip covers precisely the input zone;
        // its position makes no claim about the song's beat positions.
        const stripNear=depth(d-PAD_EARLY),stripFar=depth(d+PAD_LATE);
        if(stripNear>stripFar+.005) {
          const stripNearWidth=Math.min(82,(laneEdge(pulse.lane+1,stripNear)-
            laneEdge(pulse.lane,stripNear))*.22);
          const stripFarWidth=Math.min(82,(laneEdge(pulse.lane+1,stripFar)-
            laneEdge(pulse.lane,stripFar))*.22);
          ctx.save();ctx.globalAlpha=spent?.20:.51;
          paintComicDecal(ctx,'cachePulseStrip',[
            [laneX(pulse.lane,stripNear)-stripNearWidth,roadY(stripNear)],
            [laneX(pulse.lane,stripNear)+stripNearWidth,roadY(stripNear)],
            [laneX(pulse.lane,stripFar)+stripFarWidth,roadY(stripFar)],
            [laneX(pulse.lane,stripFar)-stripFarWidth,roadY(stripFar)]]);
          ctx.restore();
        }
        const x = laneX(pulse.lane, mid), y = roadY(mid);
        const nearWidth = Math.min(116, (laneEdge(pulse.lane+1,near) - laneEdge(pulse.lane,near))*.32);
        const farWidth = Math.min(116, (laneEdge(pulse.lane+1,far) - laneEdge(pulse.lane,far))*.32);
        const points = [[laneX(pulse.lane,near)-nearWidth,roadY(near)],
          [laneX(pulse.lane,near)+nearWidth,roadY(near)],
          [laneX(pulse.lane,far)+farWidth,roadY(far)],
          [laneX(pulse.lane,far)-farWidth,roadY(far)]];
        ctx.save();
        ctx.globalAlpha=spent ? .55 : .88;
        polygon(ctx,points,'#061922');
        if(!paintComicDecal(ctx,'cachePulsePad',points)) {
          const inset=8+mid*5;
          polygon(ctx,[[points[0][0]+inset,points[0][1]-2],
            [points[1][0]-inset,points[1][1]-2],
            [points[2][0]-inset*.65,points[2][1]+2],
            [points[3][0]+inset*.65,points[3][1]+2]],'#174c51');
        }
        ctx.strokeStyle=spent?'#6d9389':ready&&fourthWindow?'#fff0aa':'#9ad9c5';
        ctx.lineWidth=1+mid*(ready&&fourthWindow?5:2);
        ctx.beginPath(); points.forEach(([px,py],i) => i ? ctx.lineTo(px,py) : ctx.moveTo(px,py));
        ctx.closePath(); ctx.stroke();
        // The inked edge charges on the approach, then flashes on beat four.
        // It stays in the road plane, so traffic still occludes it.
        if(ready&&!spent) {
          ctx.globalAlpha=.5+(reduced?0:fourthCharge*.5);
          ctx.strokeStyle=fourthWindow?'#fff0aa':'#a9f5d8';
          ctx.lineWidth=2+mid*(2+fourthCharge*4);
          ctx.beginPath();ctx.moveTo(points[0][0]+15,points[0][1]-3);
          ctx.lineTo(points[1][0]-15,points[1][1]-3);ctx.stroke();
        }
        ctx.globalAlpha=spent ? .52 : 1;
        ctx.translate(x,y);ctx.scale(Math.max(.52,mid),Math.max(.29,mid*.46));
        const face=PULSE_ACTIONS[pulse.action];
        const quiet=[0,1,6,7][Math.floor(((s.elapsedMs||0)+pulse.at*3)/180)%4];
        drawActionIcon(ctx,pulse.action,0,-22,48,'#d7ffe6',
          reduced?0:spent?7:ready&&fourthWindow?2:quiet);
        ctx.fillStyle = '#f4f3d7'; ctx.textAlign = 'center';
        ctx.font = 'bold 40px Oxanium, monospace';
        ctx.fillText(B.GamepadUI?.connected ? B.ControllerSettings?.button(face.button) || face.keyboard : face.keyboard,0,38);
        ctx.restore();
      }
      // Far traffic first; the shapes and on-road arrows remain legible in motion.
      for (const hazard of [...HAZARDS].reverse()) {
        const d = hazard.at - progress;
        if (d < 0 || d > 440) continue;
        const t = depth(d), lane = hazardLane(hazard, progress, s.audits);
        const x = laneX(lane, t), y = roadY(t);
        const heavy = ['freight','shuttle','sweeper'].includes(hazard.kind);
        const w = (heavy ? 32 : hazard.kind === 'trike' ? 21 : 26) +
          t * (heavy ? 144 : hazard.kind === 'trike' ? 96 : 113);
        const h = (heavy ? 30 : 24) + t * (heavy ? 149 : 111);
        if (d < 145 && d > 4 && t > .38) {
          // A braking chevron is printed on the threatened lane, with a
          // narrowing cue as the car approaches the collision plane.
          const markT = depth(d - 23);
          ctx.globalAlpha = .2 + (1 - d / 145) * .36;
          polygon(ctx, [[laneX(lane,t),y+5],
            [laneEdge(lane+1,markT)-14,roadY(markT)],
            [laneX(lane,markT),roadY(markT)-4],
            [laneEdge(lane,markT)+14,roadY(markT)]], '#ff7488');
          ctx.globalAlpha = 1;
        }
        if (hazard.kind === 'audit' && d < 165 && d > 0) {
          const ahead = depth(d - 38);
          ctx.globalAlpha = .45;
          polygon(ctx, [[laneEdge(lane,t)+9,y],[laneEdge(lane+1,t)-9,y],
            [laneEdge(lane+1,ahead)-15,roadY(ahead)],
            [laneEdge(lane,ahead)+15,roadY(ahead)]], '#ff4f82');
          ctx.globalAlpha = 1;
        }
        if ((hazard.kind === 'sweeper' || hazard.kind === 'trike') && d <
            (hazard.kind === 'sweeper' ? 190 : 225) && d > 0) {
          const target = hazard.lane + (hazard.lane === 3 ? -1 : 1);
          const arrowT = depth(d - 48), targetX = laneX(target,arrowT);
          ctx.strokeStyle = hazard.kind === 'sweeper' ? '#ffe6a2' : '#9cf6ef';
          ctx.globalAlpha = .60; ctx.lineWidth = (hazard.kind === 'sweeper' ? 5 : 3) + t*4;
          ctx.beginPath(); ctx.moveTo(laneX(hazard.lane,t),y+12*t);
          ctx.lineTo(targetX,roadY(arrowT)+10*arrowT); ctx.stroke();
          const direction = Math.sign(target-hazard.lane);
          polygon(ctx, [[targetX,roadY(arrowT)+10*arrowT],
            [targetX-direction*21*arrowT,roadY(arrowT)-9*arrowT],
            [targetX-direction*20*arrowT,roadY(arrowT)+30*arrowT]],
          hazard.kind === 'sweeper' ? '#ffe6a2' : '#9cf6ef');
          ctx.globalAlpha = 1;
        }
        drawVehicle(ctx, x, y, w, h, hazard.kind,
          { phase: progress + hazard.at*.17, reduced });
        if (d < 210 && d > 0 && t > .38 &&
            ['audit','sweeper','freight','trike','shuttle'].includes(hazard.kind)) {
          ctx.fillStyle = hazard.kind === 'audit' ? '#ffd0df' :
            hazard.kind === 'trike' ? '#b4fff1' : '#fff2be';
          ctx.font = `bold ${Math.round(15 + t*16)}px Oxanium, monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(hazard.kind === 'audit' ? 'AUDIT LOCK' :
            hazard.kind === 'sweeper' ? 'SWEEP' : hazard.kind === 'trike' ?
              (hazard.lane === 3 ? '< CUT' : 'CUT >') :
            hazard.kind === 'shuttle' ? 'SLOW / DRAFT' : 'DRAFT', x, y - h - 14);
        }
      }
      if (s.gateAt != null && progress < s.gateAt + 45) {
        const t = depth(s.gateAt - progress), y = roadY(t);
        ctx.fillStyle = '#9ffff0'; ctx.font = `bold ${Math.round(18 + t*23)}px Oxanium, monospace`;
        ctx.textAlign = 'center'; ctx.fillText('ORIGINAL >>>', laneX(3,t), y - 154*t - 52);
        ctx.fillStyle = '#ffb2bd'; ctx.fillText('AUDIT COPY', laneX(0,t), y - 154*t - 52);
      }
      if (progress >= 3 * LAP + 1700) {
        const t = .62, x = laneX(s.rivalLane,t), y = roadY(t);
        drawVehicle(ctx, x, y, 126, 127, 'rival', { phase: progress, reduced });
        if (s.rivalWarning) {
          const markT = depth(s.nextRivalAt - progress), markX = laneX(s.rivalTarget,markT), markY = roadY(markT);
          ctx.strokeStyle = '#ff719b'; ctx.lineWidth = 6;
          ctx.strokeRect(markX - 44, markY - 83, 88, 78);
        }
      }
      const carX = laneX(s.visualLane, .83), carY = roadY(.83);
      if (s.echo) {
        const x = laneX(s.echo.lanePos, .83);
        if (Math.abs(x - carX) > 35) {
          ctx.strokeStyle = '#a4faff'; ctx.globalAlpha = .36; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(x, carY - 8); ctx.lineTo(carX, carY - 8); ctx.stroke(); ctx.globalAlpha = 1;
        }
        drawVehicle(ctx, x, carY, 152, 115, 'echo',
          { alpha: .68, phase: progress+37, reduced });
      }
      if (s.braking || s.stumbleMs) {
        // Two short broken wet tire tracks follow the curved road under the
        // car. They are local to the rear tires and disappear on release.
        ctx.save();ctx.globalAlpha=s.stumbleMs?.35:.24;
        ctx.strokeStyle='#87949e';ctx.lineCap='round';
        ctx.lineWidth=2.5;
        for(const side of [-1,1])for(let segment=0;segment<3;segment++) {
          ctx.beginPath();
          for(let step=0;step<=3;step++) {
            const t=.835+segment*.055+step*.012;
            const xx=laneX(s.visualLane,t)+side*72-s.steer*(t-.83)*24;
            const yy=roadY(t)-16;
            if(!step)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
      drawVehicle(ctx, carX, carY, 164, 119, 'cache',
        { alpha: !s.stumbleMs && s.invulnerableMs && Math.floor(s.invulnerableMs / 90) % 2 ? .55 : 1,
          turbo: !!s.boostMs, phase: progress, steer: s.steer, hit: s.stumbleMs,
          braking:s.braking, damage:3-s.integrity, reduced });
      if (s.cutFlashMs && !reduced) {
        const pulse = s.cutFlashMs / 740;
        const side=Math.floor(progress/51)%2?1:-1;
        ctx.save();ctx.globalAlpha=.51*pulse;
        ctx.translate(carX+side*105,carY+24);ctx.rotate(side*.2);
        B.PresentationAssets?.draw?.('cacheSpeedMist',ctx,{
          x:0,y:0,width:225,height:94,flip:side<0 });
        ctx.restore();
        drawGrimyPlume(ctx,carX+side*108,carY-46,progress*1.3,
          113,pulse,['#a1d4cf','#697984'],side);
        drawGrimyPlume(ctx,carX+side*70,carY-10,progress*1.3+42,
          61,pulse*.8,['#ddc2a1','#48545f'],side);
      }
      if (s.stumbleMs) {
        const pulse = s.stumbleMs / 650;
        ctx.save();ctx.translate(carX,carY+32);
        ctx.rotate(Math.sin(progress*.07)*.045);
        ctx.globalAlpha=.76*pulse;
        B.PresentationAssets?.draw?.('cacheImpactGrit',ctx,{
          x:0,y:0,width:306+(1-pulse)*72,height:145+(1-pulse)*35 });
        ctx.restore();
        drawGrimyPlume(ctx,carX-64,carY-55,progress*.9+12,
          126,pulse,['#e3a480','#363b47'],-1);
        drawGrimyPlume(ctx,carX+61,carY-75,progress*.9+47,
          151,pulse,['#b8a3a0','#303540'],1);
      }
      if (s.invulnerableMs) {
        ctx.fillStyle = '#ff697a';
        ctx.fillRect(0, 163, 12, 750); ctx.fillRect(1908, 163, 12, 750);
      }
      // The driving HUD prioritizes time, damage and ability readiness.
      ctx.fillStyle = '#07121ff5'; ctx.fillRect(0, 0, 1920, 164);
      instrumentPanel(ctx,20,5,605,153,'#79d9d1');
      instrumentPanel(ctx,1338,5,562,153,s.fullAdrenaline?'#f6d38a':'#81d8d2');
      ctx.strokeStyle='#678b96';ctx.lineWidth=2;
      for(let tick=0;tick<9;tick++) {
        ctx.globalAlpha=tick<Math.round(s.speed/9) ? .7 : .25;
        ctx.beginPath();ctx.moveTo(44+tick*29,151);
        ctx.lineTo(63+tick*29,151);ctx.stroke();
      }
      ctx.globalAlpha=1;
      ctx.fillStyle = '#9ef6e2'; ctx.font = 'bold 32px Oxanium, monospace'; ctx.textAlign = 'left';
      ctx.fillText('CACHE BACK  /  ORIGINAL MASTER', 42, 45);
      ctx.fillStyle = '#c9e1e8'; ctx.font = '20px Oxanium, monospace';
      ctx.fillText(`${names[section]}   •   ${songSection(s.musicBar)}   •   BAR ${Math.min(100, s.musicBar + 1)} / 100`,
        44, 78, 568);
      ctx.fillStyle = '#faf7e9'; ctx.font = 'bold 53px Oxanium, monospace';
      ctx.fillText(`${Math.round(s.speed * 5.2)}`, 44, 140);
      ctx.fillStyle = '#91bfd1'; ctx.font = '19px Oxanium, monospace'; ctx.fillText('KM/H', 173, 133);
      ctx.fillStyle = s.timeMs < 8000 ? '#ff879d' : '#f7dfaa';
      ctx.font = 'bold 39px Oxanium, monospace'; ctx.fillText(`${(s.timeMs/1000).toFixed(1)}s`, 300, 134);
      ctx.fillStyle = '#a7bcca'; ctx.font = '16px Oxanium, monospace'; ctx.fillText('WINDOW', 303, 96);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i < s.integrity ? '#85efd1' : '#374959';
        ctx.fillRect(520 + i*40, 111, 29, 20);
      }
      ctx.fillStyle = '#a7bcca'; ctx.fillText('SIGNAL', 520, 96);
      drawRearview(ctx, s, ['#f6adbb', '#f3b276', '#d2a4f9', '#9aefce'][section], reduced);
      ctx.fillStyle = '#e4ede5'; ctx.font = 'bold 18px Oxanium, monospace'; ctx.textAlign = 'left';
      const nextPulse = PULSES.find(p => p.at >= s.progress - PAD_LATE &&
        !s.caughtPulses[p.id]);
      const nextFace = nextPulse && PULSE_ACTIONS[nextPulse.action];
      const nextButton = nextFace && (B.GamepadUI?.connected ?
        B.ControllerSettings?.button(nextFace.button) || nextFace.keyboard : nextFace.keyboard);
      const padDistance = nextPulse?.at - s.progress;
      const padVisible=nextPulse&&padDistance<=345;
      const padReady=padVisible&&padDistance<=PAD_EARLY&&padDistance>=-PAD_LATE;
      const inPadLane=padReady&&Math.abs(s.lanePos-nextPulse.lane)<=.38;
      const pressNow=inPadLane&&fourthWindow;
      const showingCatch=s.pulseFlashMs>0 && s.pulseFlashAction!==null;
      const iconScale=padReady&&inPadLane&&!reduced?1+.28*fourthCharge:1;
      polygon(ctx,[[1352,17],[1395,17],[1407,27],[1407,70],
        [1395,82],[1352,82],[1343,70],[1343,27]],'#050e17');
      polygon(ctx,[[1355,21],[1392,21],[1402,30],[1402,68],
        [1392,77],[1355,77],[1348,68],[1348,30]],
        pressNow?'#a65e45':padReady?'#24585a':'#17323c');
      if(s.pulseFlashMs&&!reduced) {
        ctx.save();ctx.globalAlpha=.75*s.pulseFlashMs/650;
        B.PresentationAssets?.draw?.('cachePulseBurst',ctx,
          {x:1375,y:49,width:100,height:50});
        ctx.restore();
      }
      if(showingCatch) {
        const cel=reduced?0:Math.min(7,Math.floor((650-s.pulseFlashMs)/82));
        drawActionIcon(ctx,s.pulseFlashAction,1375,44,reduced?45:68,
          '#c6ffe2',cel);
      } else if(padVisible) drawActionIcon(ctx,nextPulse.action,1375,44,
        37*iconScale,'#c6ffe2',reduced?0:pressNow?2:
          [0,1,6,7][Math.floor((s.elapsedMs||0)/180)%4]);
      else drawLaneMark(ctx,s.lane,1375,43,35,'#9bd7d0');
      ctx.fillStyle='#a8bfcb';ctx.font='bold 14px Oxanium, monospace';
      ctx.fillText(showingCatch?'PHRASE CAPTURED':
        padVisible?`NEXT PAD  /  ${LANES[nextPulse.lane]}`:'ROAD CLEAR',1418,29,460);
      ctx.fillStyle=pressNow?'#fff2ad':'#d8f5e8';
      ctx.font='bold 25px Oxanium, monospace';
      ctx.fillText(showingCatch?
        `${PULSE_ACTIONS[s.pulseFlashAction].label}  //  +${s.pulseCombo>=2?16:8} BARS`:
        padVisible?`${nextButton}  ${nextFace.label}  •  ${pressNow?'PRESS!':padReady?
        inPadLane?'HIT ON 4':'ENTER LANE':`${Math.round(padDistance)} AHEAD`}`:
        'READ THE NEXT GAP',1418,56,465);
      if(padVisible&&!showingCatch) {
        for(let count=1;count<=4;count++) {
          const step=Math.floor(beatInBar)+1;
          const selected=count===step;
          const hot=padReady&&count===4&&fourthWindow;
          const px=1418+(count-1)*25;
          polygon(ctx,[[px+3,61],[px+19,61],[px+22,65],[px+19,80],
            [px+3,80],[px,76],[px,65]],hot?'#ffda83':selected?'#a5efd5':'#314b54');
          ctx.fillStyle=hot?'#111b1d':'#09202a';
          ctx.font='bold 14px Oxanium, monospace';ctx.textAlign='center';
          ctx.fillText(String(count),px+11,76);
        }
        ctx.textAlign='left';ctx.fillStyle=pressNow?'#ffefa7':'#a9c9c7';
        ctx.font='bold 13px Oxanium, monospace';
        ctx.fillText('BEAT 4',1523,76);
      }
      ctx.fillStyle = '#b5cbd0'; ctx.font = '16px Oxanium, monospace';
      const armed = [s.ramMs > 0 ? `PUSH ${Math.ceil(s.ramMs / 100) / 10}s` : '',
        s.shield ? 'BRACE READY' : ''].filter(Boolean).join('  •  ');
      if(armed) {
        ctx.font='bold 14px Oxanium, monospace';
        ctx.fillText(armed,1623,76,267);
      }
      const meter = (x, label, value, color, display = `${Math.round(value)}%`) => {
        ctx.fillStyle = '#afbdcb'; ctx.font = 'bold 14px Oxanium, monospace'; ctx.fillText(label, x, 88);
        ctx.fillStyle = '#26364b'; ctx.fillRect(x, 95, 196, 14);
        ctx.fillStyle = color; ctx.fillRect(x, 95, 196 * clamp(value/100,0,1), 14);
        ctx.fillStyle = '#f7f8ec'; ctx.font = 'bold 14px Oxanium, monospace'; ctx.fillText(display, x + 204, 108);
      };
      meter(1345, 'ECHO', s.echoEnergy, '#83e6fc');
      meter(1615, s.fullAdrenaline ? 'FULL ADRENALINE' : 'PARTS ACTIVE',
        s.captures.length * 25, '#d0a4ff', `${s.captures.length}/4`);
      ctx.fillStyle = '#e7f4e9'; ctx.font = 'bold 21px Oxanium, monospace';
      ctx.fillText(`SCORE ${s.score}    STACK x${stackSize(s)}`, 1345, 135, 315);
      ctx.fillStyle = s.boost || s.boostMs ? '#fbd899' : '#718995';
      ctx.font = 'bold 17px Oxanium, monospace';
      const turboButton = B.GamepadUI?.connected ? B.ControllerSettings?.button(4) : 'SPACE';
      ctx.fillText(s.boostMs ? 'TURBO ACTIVE' : s.boost ? `${turboButton} TURBO READY` : `${turboButton} TURBO CHARGING`, 1660, 131, 230);
      // Four instrument cells carry the same shapes as the inlaid road bars.
      for (let i = 0; i < 4; i++) {
        const x = 642 + i * 171;
        const capture = s.captures.find(item => item.lane === i);
        const queued = s.queuedCaptures.find(item => item.lane === i);
        ctx.fillStyle=capture?'#1b3843':queued?'#1c3040':'#112332';
        ctx.fillRect(x,132,162,27);
        ctx.strokeStyle=PALETTE[i];ctx.globalAlpha=capture ? .86 : queued ? .55 : .23;
        ctx.strokeRect(x+.5,132.5,161,26);ctx.globalAlpha=1;
        drawLaneMark(ctx,i,x+15,145,19,PALETTE[i]);
        ctx.fillStyle=capture||queued?'#f1fff5':'#a4bdc4';
        ctx.font='bold 15px Oxanium, monospace';ctx.textAlign='left';
        ctx.fillText(`${LANES[i]}  ${queued?'NEXT':capture?
          `${Math.max(0,Math.ceil((capture.endBeat-s.musicBeatFloat)/4))}B`:'—'}`,x+29,149,130);
        ctx.fillStyle = PALETTE[i]; ctx.globalAlpha = capture ? 1 : queued ? .65 : s.lane === i ? .45 : .16;
        ctx.fillRect(x+3,155,156,3);ctx.globalAlpha=1;
      }
      ctx.textAlign = 'left';
      if (s.cutFlashMs) {
        ctx.fillStyle = '#dcfff1'; ctx.font = 'bold 17px Oxanium, monospace';
        ctx.fillText(`CLOSE CUT x${s.cutStreak}  +${s.cutAward}  // TURBO + ECHO`, 1345, 155, 535);
      } else if (s.gateAt != null && progress > s.gateAt - 220 && progress < s.gateAt) {
        ctx.fillStyle = '#e7ffeb'; ctx.font = 'bold 17px Oxanium, monospace';
        ctx.fillText(s.echo ? 'ECHO LEFT • ORIGINAL RIGHT' :
          `${B.GamepadUI?.connected ? B.ControllerSettings?.button(5) : 'H'} ECHO LEFT • ORIGINAL RIGHT`, 1345, 155, 535);
      } else if (s.messageMs > 0 && !s.stumbleMs &&
          !(s.gateAt != null && progress > s.gateAt - 220 && progress < s.gateAt)) {
        ctx.fillStyle = '#b4ffe4';
        ctx.font = 'bold 17px Oxanium, monospace'; ctx.fillText(s.message, 1345, 155, 535);
      }
      // Guidance only appears while its driving lesson is actionable.
      const cue = this.openingCue();
      if (cue) {
        ctx.fillStyle = '#081824d9'; ctx.fillRect(30, 176, 875, 82);
        ctx.fillStyle = '#90efda'; ctx.fillRect(30, 176, 5, 82);
        ctx.textAlign = 'left'; ctx.fillStyle = '#aaf1dc';
        ctx.font = 'bold 13px Oxanium, monospace';
        ctx.fillText('DELIVER THE ORIGINAL RECORDING  /  THE CLEAN COPY ERASED THE NAMES', 48, 196, 835);
        ctx.fillStyle = '#fff5df'; ctx.font = 'bold 21px Oxanium, monospace'; ctx.fillText(cue[0], 48, 222, 835);
        ctx.fillStyle = '#c8e0df'; ctx.font = '17px Oxanium, monospace'; ctx.fillText(cue[1], 48, 246, 835);
      }
      if (this.audioDegraded) {
        ctx.fillStyle = '#ffbb8b'; ctx.font = '20px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText('AUDIO FALLBACK — MIX TIMBRE / ALIGNMENT NEEDS RECHECK', 960, 365);
      }
      if (this.status !== 'playing') {
        ctx.fillStyle = '#061320ed'; ctx.fillRect(370, 280, 1180, 485);
        ctx.strokeStyle = '#9cf9df'; ctx.lineWidth = 3; ctx.strokeRect(370, 280, 1180, 485);
        ctx.fillStyle = '#f5f1ee'; ctx.font = 'bold 47px Oxanium, monospace'; ctx.textAlign = 'center';
        ctx.fillText(this.status === 'clear' ? 'ORIGINAL TAPE DELIVERED' :
          s.gateFailure ? 'ORIGINAL EXIT MISSED' :
          s.timeMs <= 0 ? 'TRANSMISSION WINDOW CLOSED' : 'SIGNAL LOST', 960, 380);
        ctx.font = '25px Oxanium, monospace'; ctx.fillStyle = '#9cf9df';
        ctx.fillText(this.status === 'clear' ? 'DELIVERED / UNVERIFIED — Mac sees the distribution blockade.' :
          s.gateFailure === 'wrong-lane' ? 'Cache must take the far-right marked original exit.' :
          s.gateFailure === 'no-echo' ? 'Send Buffer Echo after the exit cue, then steer right.' :
          s.gateFailure === 'no-split' ? 'Give the Echo another lane so the audit follows it.' :
          'Your last road marker remains. Draft, brake and use an Echo to split the audit.', 960, 458);
        ctx.fillStyle = '#e6c8b5'; ctx.font = '22px Oxanium, monospace';
        ctx.fillText(this.status === 'clear' ? 'Proof clear only. Bass awaits the authored Level 2.' :
          s.gateFailure ? 'Retry starts at the Mirror Viaduct marker with a full Echo.' :
          'Collisions cost speed and time. The rival follows a visible warning line.', 960, 506);
        ctx.fillText(s.gateFailure ? 'ENTER / A: RETRY FROM MARKER     C / Y: RETURN TO LEVEL 1' :
          'ENTER / A: RETRY     C / Y: RETURN TO LEVEL 1', 960, 625);
        ctx.fillText('P / MENU: SETTINGS AND EXIT PREVIEW', 960, 672);
      }
      ctx.restore();
    }
  };
  B.Campaign.register(ID, { validate: saved => road.validate(saved), restore: saved => road.restore(saved) });
  B.Campaign.syncTitleButton();
})(window.BARCODE = window.BARCODE || {});
