// Production Canvas review: scripted art states or input-driven gameplay.
// This is a local render, not a Makko capture.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawn, execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { once } = require('node:events');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]
}));
const { createRig, load } = require('./check-level-01-boss');
let encoder;

async function main() {
  const out = path.resolve(process.argv[2] || 'docs/source-pack/review-cache-road-mirror');
  fs.mkdirSync(out, { recursive: true });
  const areaReviewPath = process.env.CACHE_REVIEW_AREA_ASSET;
  const districtSeed = process.env.CACHE_DISTRICT_SEED;
  const puppetSeed = process.env.CACHE_PUPPET_SEED;
  const landscapeSeed = process.env.CACHE_LANDSCAPE_SEED;
  if([puppetSeed,districtSeed,landscapeSeed,areaReviewPath]
    .filter(value=>value!==undefined).length>1)
    throw Error('Choose one scenery preview');
  if (areaReviewPath && !path.resolve(areaReviewPath).startsWith(
    path.resolve('assets/cache-road/roadside/places') + path.sep))
    throw Error('Area review asset must be a roadside place image');
  const worldFrames = process.argv[3] ? await Promise.all(Array.from({length:120}, (_,i) =>
    loadImage(path.resolve(process.argv[3], `${String(i).padStart(3,'0')}.webp`)))) : null;
  GlobalFonts.registerFromPath(path.resolve('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'), 'Oxanium');
  const files = {
    cacheMirror: 'assets/cache-road/hud/cache-back-mirror-expressions.webp',
    cacheCar: 'assets/cache-road/vehicles/animation/cache-center-frames.webp',
    cacheCarLeft: 'assets/cache-road/vehicles/animation/cache-left-frames.webp',
    cacheCarRight: 'assets/cache-road/vehicles/animation/cache-right-frames.webp',
    cacheCarHit: 'assets/cache-road/vehicles/animation/cache-hit-frames.webp',
    cacheFreight: 'assets/cache-road/vehicles/animation/freight-frames.webp',
    cacheCourier: 'assets/cache-road/vehicles/animation/courier-frames.webp',
    cacheBarricade: 'assets/cache-road/vehicles/barricade.webp',
    cacheRival: 'assets/cache-road/vehicles/animation/rival-frames.webp',
    cacheAudit: 'assets/cache-road/vehicles/animation/audit-sedan-frames.webp',
    cacheSweeper: 'assets/cache-road/vehicles/animation/sweeper-frames.webp',
    cacheTrike: 'assets/cache-road/vehicles/animation/signal-trike-frames.webp',
    cacheShuttle: 'assets/cache-road/vehicles/animation/night-shuttle-frames.webp',
    cacheSkyline: 'assets/cache-road/world/panorama-skyline.webp',
    cacheDistantCity: 'assets/cache-road/world/bridge-free-distance.webp',
    cacheOutskirts: 'assets/cache-road/world/bridge-free-outskirts.webp',
    cacheMidCity: 'assets/cache-road/world/bridge-free-district.webp',
    cacheGroundClusterL1: 'assets/cache-road/world/ground-cluster-left-01.webp',
    cacheGroundClusterL2: 'assets/cache-road/world/ground-cluster-left-02.webp',
    cacheGroundClusterL3: 'assets/cache-road/world/ground-cluster-left-03.webp',
    cacheGroundClusterR1: 'assets/cache-road/world/ground-cluster-right-01.webp',
    cacheGroundClusterR2: 'assets/cache-road/world/ground-cluster-right-02.webp',
    cacheGroundClusterR3: 'assets/cache-road/world/ground-cluster-right-03.webp',
    cacheWorkshopLRear: 'assets/cache-road/world/blocks/block-workshop-L-rear.webp',
    cacheWorkshopLMiddle: 'assets/cache-road/world/blocks/block-workshop-L-middle.webp',
    cacheWorkshopLMiddleDense: 'assets/cache-road/world/blocks/block-workshop-L-middle-dense.webp',
    cacheWorkshopLFrontGap: 'assets/cache-road/world/blocks/block-workshop-L-front-gap.webp',
    cacheWorkshopLFrontFill: 'assets/cache-road/world/blocks/block-workshop-L-front-fill.webp',
    cacheWorkshopRRear: 'assets/cache-road/world/blocks/block-workshop-R-rear.webp',
    cacheWorkshopRMiddle: 'assets/cache-road/world/blocks/block-workshop-R-middle.webp',
    cacheWorkshopRMiddleDense: 'assets/cache-road/world/blocks/block-workshop-R-middle-dense.webp',
    cacheWorkshopRFrontGap: 'assets/cache-road/world/blocks/block-workshop-R-front-gap.webp',
    cacheWorkshopRFrontFill: 'assets/cache-road/world/blocks/block-workshop-R-front-fill.webp',
    cacheMarketLMiddle: 'assets/cache-road/world/blocks/block-market-L-middle.webp',
    cacheMarketLFrontGap: 'assets/cache-road/world/blocks/block-market-L-front-gap.webp',
    cacheMarketLFrontFill: 'assets/cache-road/world/blocks/block-market-L-front-fill.webp',
    cacheMarketRMiddle: 'assets/cache-road/world/blocks/block-market-R-middle.webp',
    cacheMarketLRear: 'assets/cache-road/world/blocks/block-market-L-rear.webp',
    cacheMarketRRear: 'assets/cache-road/world/blocks/block-market-R-rear.webp',
    cacheMarketRFrontGap: 'assets/cache-road/world/blocks/block-market-R-front-gap.webp',
    cacheMarketRFrontFill: 'assets/cache-road/world/blocks/block-market-R-front-fill.webp',
    cacheHomesLRear: 'assets/cache-road/world/blocks/block-homes-L-rear.webp',
    cacheHomesLMiddle: 'assets/cache-road/world/blocks/block-homes-L-middle.webp',
    cacheHomesLFrontGap: 'assets/cache-road/world/blocks/block-homes-L-front-gap.webp',
    cacheHomesLFrontFill: 'assets/cache-road/world/blocks/block-homes-L-front-fill.webp',
    cacheHomesRRear: 'assets/cache-road/world/blocks/block-homes-R-rear.webp',
    cacheHomesRMiddle: 'assets/cache-road/world/blocks/block-homes-R-middle.webp',
    cacheHomesRFrontGap: 'assets/cache-road/world/blocks/block-homes-R-front-gap.webp',
    cacheHomesRFrontFill: 'assets/cache-road/world/blocks/block-homes-R-front-fill.webp',
    cacheGreenhouseLRear: 'assets/cache-road/world/blocks/block-greenhouse-L-rear.webp',
    cacheGreenhouseLMiddle: 'assets/cache-road/world/blocks/block-greenhouse-L-middle.webp',
    cacheGreenhouseLFrontGap: 'assets/cache-road/world/blocks/block-greenhouse-L-front-gap.webp',
    cacheGreenhouseLFrontFill: 'assets/cache-road/world/blocks/block-greenhouse-L-front-fill.webp',
    cacheGreenhouseRRear: 'assets/cache-road/world/blocks/block-greenhouse-R-rear.webp',
    cacheGreenhouseRMiddle: 'assets/cache-road/world/blocks/block-greenhouse-R-middle.webp',
    cacheGreenhouseRFrontGap: 'assets/cache-road/world/blocks/block-greenhouse-R-front-gap.webp',
    cacheGreenhouseRFrontFill: 'assets/cache-road/world/blocks/block-greenhouse-R-front-fill.webp',
    cacheDataLRear: 'assets/cache-road/world/blocks/block-data-L-rear.webp',
    cacheDataLMiddle: 'assets/cache-road/world/blocks/block-data-L-middle.webp',
    cacheDataLFrontGap: 'assets/cache-road/world/blocks/block-data-L-front-gap.webp',
    cacheDataLFrontFill: 'assets/cache-road/world/blocks/block-data-L-front-fill.webp',
    cacheDataRRear: 'assets/cache-road/world/blocks/block-data-R-rear.webp',
    cacheDataRMiddle: 'assets/cache-road/world/blocks/block-data-R-middle.webp',
    cacheDataRFrontGap: 'assets/cache-road/world/blocks/block-data-R-front-gap.webp',
    cacheDataRFrontFill: 'assets/cache-road/world/blocks/block-data-R-front-fill.webp',
    cacheTransitLRear: 'assets/cache-road/world/blocks/block-transit-L-rear.webp',
    cacheTransitLMiddle: 'assets/cache-road/world/blocks/block-transit-L-middle.webp',
    cacheTransitLFrontGap: 'assets/cache-road/world/blocks/block-transit-L-front-gap.webp',
    cacheTransitLFrontFill: 'assets/cache-road/world/blocks/block-transit-L-front-fill.webp',
    cacheTransitRRear: 'assets/cache-road/world/blocks/block-transit-R-rear.webp',
    cacheTransitRMiddle: 'assets/cache-road/world/blocks/block-transit-R-middle.webp',
    cacheTransitRFrontGap: 'assets/cache-road/world/blocks/block-transit-R-front-gap.webp',
    cacheTransitRFrontFill: 'assets/cache-road/world/blocks/block-transit-R-front-fill.webp',
    cacheResidentialPaving: 'assets/cache-road/world/materials/residential-paving.webp',
    cacheServiceCourtPaving: 'assets/cache-road/world/materials/service-court-paving.webp',
    cachePlantedGravelCourt: 'assets/cache-road/world/materials/planted-gravel-court.webp',
    cacheWalkerCourierToward: 'assets/cache-road/world/props/walker-courier-toward.webp',
    cacheWalkerCourierAway: 'assets/cache-road/world/props/walker-courier-away.webp',
    cacheWalkerMechanicToward: 'assets/cache-road/world/props/walker-mechanic-toward.webp',
    cacheWalkerMechanicAway: 'assets/cache-road/world/props/walker-mechanic-away.webp',
    cacheWalkerMarketWorkerToward: 'assets/cache-road/world/props/walker-market-worker-toward.webp',
    cacheWalkerMarketWorkerAway: 'assets/cache-road/world/props/walker-market-worker-away.webp',
    cacheWalkerStudentToward: 'assets/cache-road/world/props/walker-student-toward.webp',
    cacheWalkerStudentAway: 'assets/cache-road/world/props/walker-student-away.webp',
    cacheWalkerGardenerToward: 'assets/cache-road/world/props/walker-gardener-toward.webp',
    cacheWalkerGardenerAway: 'assets/cache-road/world/props/walker-gardener-away.webp',
    cacheWalkerResidentToward: 'assets/cache-road/world/props/walker-resident-toward.webp',
    cacheWalkerResidentAway: 'assets/cache-road/world/props/walker-resident-away.webp',
    cacheWalkerCourierTravel: 'assets/cache-road/world/props/animation/walker-courier-frames.webp',
    cacheWalkerMechanicTravel: 'assets/cache-road/world/props/animation/walker-mechanic-frames.webp',
    cacheWalkerMarketWorkerTravel: 'assets/cache-road/world/props/animation/walker-market-worker-frames.webp',
    cacheWalkerStudentTravel: 'assets/cache-road/world/props/animation/walker-student-frames.webp',
    cacheWalkerGardenerTravel: 'assets/cache-road/world/props/animation/walker-gardener-frames.webp',
    cacheWalkerResidentTravel: 'assets/cache-road/world/props/animation/walker-resident-frames.webp',
    cachePersonBicycleCourierTravel: 'assets/cache-road/world/props/animation/person-bicycle-courier-frames.webp',
    cachePersonSkateboarderTravel: 'assets/cache-road/world/props/animation/person-skateboarder-frames.webp',
    cachePersonCrateCarrierTravel: 'assets/cache-road/world/props/animation/person-crate-carrier-frames.webp',
    cacheNewLampL: 'assets/cache-road/world/props/animation/street-lamp-L-frames.webp',
    cacheNewLampR: 'assets/cache-road/world/props/animation/street-lamp-R-frames.webp',
    cacheNewCrossingSignalL: 'assets/cache-road/world/props/animation/street-crossing-signal-L-frames.webp',
    cacheNewCrossingSignalR: 'assets/cache-road/world/props/animation/street-crossing-signal-R-frames.webp',
    cacheNewWayfindingSign: 'assets/cache-road/world/props/animation/street-wayfinding-sign-frames.webp',
    cacheNewBinsRecycling: 'assets/cache-road/world/props/street-bins-recycling.webp',
    cacheNewLoadingCrates: 'assets/cache-road/world/props/street-loading-crates.webp',
    cacheNewUtilityCabinet: 'assets/cache-road/world/props/animation/street-utility-cabinet-frames.webp',
    cacheNewVendorCart: 'assets/cache-road/world/props/animation/street-vendor-cart-frames.webp',
    cacheNewFencePlanter: 'assets/cache-road/world/props/street-fence-planter.webp',
    cacheDecalCrosswalk: 'assets/cache-road/world/decals/crosswalk.svg',
    cacheDecalStopLine: 'assets/cache-road/world/decals/stop-line.svg',
    cacheDecalDrainage: 'assets/cache-road/world/decals/drainage.svg',
    cacheDecalLoadingBay: 'assets/cache-road/world/decals/loading-bay.svg',
    cacheDecalServiceStencil: 'assets/cache-road/world/decals/service-stencil.svg',
    cacheDecalWetRepairPatch: 'assets/cache-road/world/decals/wet-repair-patch.svg',
    cacheAmbientMarket: 'assets/cache-road/world/ambient/market-practicals.svg',
    cacheAmbientHomes: 'assets/cache-road/world/ambient/homes-practicals.svg',
    cacheAmbientWorkshop: 'assets/cache-road/world/ambient/workshop-practicals.svg',
    cacheAmbientGreenhouse: 'assets/cache-road/world/ambient/greenhouse-practicals.svg',
    cacheAmbientData: 'assets/cache-road/world/ambient/data-practicals.svg',
    cacheAmbientTransit: 'assets/cache-road/world/ambient/transit-practicals.svg',
    cacheLocalStreet: 'assets/cache-road/world/materials/wet-local-street.webp',
    cacheJoinLTurn: 'assets/cache-road/world/joins/sidewalk-turn-L.svg',
    cacheJoinRTurn: 'assets/cache-road/world/joins/sidewalk-turn-R.svg',
    cacheJoinLCurb: 'assets/cache-road/world/joins/curb-return-L.svg',
    cacheJoinRCurb: 'assets/cache-road/world/joins/curb-return-R.svg',
    cacheJoinLStreetWall: 'assets/cache-road/world/joins/street-mouth-sidewall-L.svg',
    cacheJoinRStreetWall: 'assets/cache-road/world/joins/street-mouth-sidewall-R.svg',
    cacheJoinLEndcap: 'assets/cache-road/world/joins/wall-roof-endcap-L.svg',
    cacheJoinREndcap: 'assets/cache-road/world/joins/wall-roof-endcap-R.svg',
    cacheWorkshopPavement: 'assets/cache-road/world/materials/workshop-wet-pavement.webp',
    cacheTransitNook: 'assets/cache-road/world/transit-service-nook.webp',
    cacheOutskirtsHomes: 'assets/cache-road/world/outskirts-homes.webp',
    cacheUtilityCorner: 'assets/cache-road/world/utility-service-corner.webp',
    cacheGreenhouseWorkshop: 'assets/cache-road/world/greenhouse-workshop.webp',
    cacheOutskirtsWorkshops: 'assets/cache-road/world/outskirts-workshops.webp',
    cacheRepairShop: 'assets/cache-road/world/neighborhood-repair-shop.webp',
    cacheVendorStall: 'assets/cache-road/world/street-vendor-people.webp',
    cachePersonCourier: 'assets/cache-road/world/props/person-courier.webp',
    cachePersonMechanic: 'assets/cache-road/world/props/person-mechanic.webp',
    cachePersonUmbrella: 'assets/cache-road/world/props/person-umbrella.webp',
    cachePersonStudent: 'assets/cache-road/world/props/person-student.webp',
    cachePersonFoodWorker: 'assets/cache-road/world/props/person-food-worker.webp',
    cachePersonBicycleCourier: 'assets/cache-road/world/props/person-bicycle-courier.webp',
    cachePersonSweeper: 'assets/cache-road/world/props/person-sweeper.webp',
    cachePersonHandheldPlayer: 'assets/cache-road/world/props/person-handheld-player.webp',
    cachePersonGardener: 'assets/cache-road/world/props/person-gardener.webp',
    cachePersonElectrician: 'assets/cache-road/world/props/person-electrician.webp',
    cachePersonWavingResident: 'assets/cache-road/world/props/person-waving-resident.webp',
    cachePersonSkateboarder: 'assets/cache-road/world/props/person-skateboarder.webp',
    cachePersonCrateCarrier: 'assets/cache-road/world/props/person-crate-carrier.webp',
    cachePersonBoardPlayer: 'assets/cache-road/world/props/person-board-player.webp',
    cachePersonStreetCook: 'assets/cache-road/world/props/person-street-cook.webp',
    cacheStreetBicycleRack: 'assets/cache-road/world/props/street-bicycle-rack.webp',
    cacheStreetWorkSupplies: 'assets/cache-road/world/props/street-work-supplies.webp',
    cacheStreetDeliveryVan: 'assets/cache-road/world/props/street-delivery-van.webp',
    cacheStreetBenchPlanters: 'assets/cache-road/world/props/street-bench-planters.webp',
    cacheStreetDataKiosk: 'assets/cache-road/world/props/animation/street-data-kiosk-frames.webp',
    cacheParapet: 'assets/cache-road/roadside/parapet.webp',
    cachePylon: 'assets/cache-road/roadside/service-pylon.webp',
    cachePulsePad: 'assets/cache-road/roadside/beat/pulse-pad.webp',
    cachePulseStrip: 'assets/cache-road/roadside/beat/approach-strip.webp',
    cachePhraseStrip: 'assets/cache-road/roadside/beat/beat-phrase.webp',
    cacheConfirmedBar: 'assets/cache-road/roadside/beat/confirmed-bar.webp',
    cachePulseBurst: 'assets/cache-road/roadside/beat/pulse-burst.webp',
    cachePulseSurge: 'assets/cache-road/roadside/beat/animation/surge-frames.webp',
    cachePulsePush: 'assets/cache-road/roadside/beat/animation/push-frames.webp',
    cachePulseBrace: 'assets/cache-road/roadside/beat/animation/brace-frames.webp',
    cachePulseRefill: 'assets/cache-road/roadside/beat/animation/refill-frames.webp',
    cacheSidewalk: 'assets/cache-road/roadside/sidewalk-slab.svg',
    cacheOuterGround: 'assets/cache-road/roadside/continuous-ground-panel.svg',
    cacheRollingGrain: 'assets/cache-road/roadside/rolling-ground-grain.webp',
    cacheGreenGround: 'assets/cache-road/roadside/green-ground-panel.svg',
    cacheServiceGround: 'assets/cache-road/roadside/service-ground-panel.svg',
    cachePlaceMarket: 'assets/cache-road/roadside/places/corner-market.webp',
    cachePlaceHouse: 'assets/cache-road/roadside/places/row-house.webp',
    cachePlacePark: 'assets/cache-road/roadside/places/pocket-park.webp',
    cachePlaceGarage: 'assets/cache-road/roadside/places/repair-garage.webp',
    cachePlaceApartment: 'assets/cache-road/roadside/places/apartment.webp',
    cachePlaceDiner: 'assets/cache-road/roadside/places/night-diner.webp',
    cachePlaceSubstation: 'assets/cache-road/roadside/places/substation.webp',
    cachePlaceGarden: 'assets/cache-road/roadside/places/hydroponics-horizon.webp',
    cachePlaceConstruction: 'assets/cache-road/roadside/places/fabrication-horizon.webp',
    cachePlaceGardenRounded: 'assets/cache-road/roadside/places/community-garden-rounded.webp',
    cachePlaceGardenCompact: 'assets/cache-road/roadside/places/community-garden-left-compact.webp',
    cachePlaceGardenHorizon: 'assets/cache-road/roadside/places/community-garden-horizon.webp',
    cachePlaceConstructionRounded: 'assets/cache-road/roadside/places/construction-yard-rounded.webp',
    cachePlaceConstructionHorizon: 'assets/cache-road/roadside/places/construction-yard-horizon.webp',
    cachePlaceConstructionCompact: 'assets/cache-road/roadside/places/construction-yard-right-compact.webp',
    cachePlaceSignalOrchard: 'assets/cache-road/roadside/places/signal-orchard.webp',
    cachePlaceRelayExchange: 'assets/cache-road/roadside/places/relay-exchange.webp',
    cachePlaceDataReclamation: 'assets/cache-road/roadside/places/data-reclamation.webp',
    cachePlaceCapacitorExchange: 'assets/cache-road/roadside/places/capacitor-exchange.webp',
    cachePlaceNightDataMarket: 'assets/cache-road/roadside/places/night-data-market.webp',
    cachePlaceEncryptedPump: 'assets/cache-road/roadside/places/encrypted-pump.webp',
    cachePlaceDroneServiceNode: 'assets/cache-road/roadside/places/drone-service-node.webp',
    ...(puppetSeed===undefined?{}:{
      cachePuppetA: 'assets/cache-road/world/review-puppet/connected-block-a.png',
      cachePuppetB: 'assets/cache-road/world/review-puppet/connected-block-b.png',
      cachePuppetC: 'assets/cache-road/world/review-puppet/connected-block-c.png',
      cachePuppetD: 'assets/cache-road/world/review-puppet/connected-block-d.png'
    }),
    cacheImpactGrit: 'assets/cache-road/effects/impact-grit.webp',
    cacheSpeedMist: 'assets/cache-road/effects/speed-mist.webp',
    cacheBrakeReflection: 'assets/cache-road/effects/brake-reflection.webp',
    cacheDamagedExhaust: 'assets/cache-road/effects/damaged-exhaust.webp',
    cacheBlacktop: 'assets/wet-street/rain-blacktop.webp',
    cacheFly1: 'assets/traffic/ship-1.webp',
    cacheFly3: 'assets/traffic/ship-3.webp'
  };
  const manifestContext=vm.createContext({window:{BARCODE:{}}});
  vm.runInContext(fs.readFileSync('src/engine/presentation-assets.js','utf8')
    .replace('  const cache = {};','  window.reviewEntries=entries;\n  const cache = {};'),manifestContext);
  for(const [key,entry] of Object.entries(manifestContext.window.reviewEntries))
    if(key.startsWith('cache'))files[key]=entry.path;
  if (areaReviewPath) files.cacheReviewPlace = areaReviewPath;
  const art = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key,file]) =>
    [key, await loadImage(path.resolve(file))])));
  const { w, context } = createRig();
  w.localStorage = { getItem() { return null; }, setItem() {} };
  load(context, 'src/game/lore-collection.js');
  w.lostDataSystem.archive = new w.BARCODE.LoreCollection();
  load(context, 'src/game/campaign-services.js');
  load(context, 'src/engine/cache-road-proof-profile.js');
  load(context, 'src/game/cache-road-landscape.js');
  if (districtSeed !== undefined) {
    if(!/^\d{1,8}$/.test(districtSeed))throw Error('District seed must be a small unsigned integer');
    load(context, 'src/game/cache-road-districts.js');
    w.CACHE_DISTRICT_PREVIEW=w.BARCODE.CacheRoadDistricts.create(
      Number(districtSeed),10000,process.env.CACHE_DISTRICT_MODE||'spine');
    let source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
    const edits=[
      ["  const clone = value => JSON.parse(JSON.stringify(value));",
        "  SIDE_PLACES.length=0; INFILL_SCENES.length=0;\n"+
        "  SATELLITE_SCENES.length=0; STREET_SCENES.length=0;\n"+
        "  const clone = value => JSON.parse(JSON.stringify(value));"],
      ['      // Narrow side streets occupy selected gaps.',
        '      B.CacheRoadDistricts.draw(ctx,{progress,sideDepth,roadsideX,terrainAt,'+
        'clipRoadside},window.CACHE_DISTRICT_PREVIEW,s.elapsedMs||0);\n'+
        '      // Narrow side streets occupy selected gaps.'],
      ['        const phase=side<0?41:105,spacing=440;',
        '        const phase=side<0?41:105,spacing=440;\n'+
        '        if(window.CACHE_DISTRICT_PREVIEW)continue;'],
      ['          const fx=roadsideX(side,far,46,58);',
        '          if(B.CacheRoadDistricts.openingAt(window.CACHE_DISTRICT_PREVIEW,'+
        'side,at-31))continue;\n'+
        '          const fx=roadsideX(side,far,46,58);'],
      ['          const x=roadsideX(side,t,98,80);',
        '          if(B.CacheRoadDistricts.openingAt(window.CACHE_DISTRICT_PREVIEW,'+
        'side,at))continue;\n'+
        '          const x=roadsideX(side,t,98,80);']
    ];
    for(const [before,after] of edits) {
      if(!source.includes(before))throw Error(`District preview injection changed: ${before}`);
      source=source.replace(before,after);
    }
    const cameraHalf=process.env.CACHE_BLOCK_CAMERA_HALF;
    if(cameraHalf!==undefined) {
      if(process.env.CACHE_DISTRICT_MODE!=='block'||
        !/^\d{3}$/.test(cameraHalf)||Number(cameraHalf)<380||
        Number(cameraHalf)>534)throw Error('Invalid block camera width');
      const before='      const half = t => 82 + 534 * t;';
      if(!source.includes(before))throw Error('Road camera width marker changed');
      source=source.replace(before,
        `      const half = t => 82 + ${Number(cameraHalf)} * t;`);
    }
    vm.runInContext(source,context,{filename:'src/game/cache-road-proof.js [district preview]'});
  } else if(puppetSeed!==undefined) {
    if(!/^\d{1,8}$/.test(puppetSeed))
      throw Error('Puppet seed must be a small unsigned integer');
    load(context,'src/game/cache-road-puppet-study.js');
    w.CACHE_PUPPET_PREVIEW=w.BARCODE.CacheRoadPuppetStudy.create(
      Number(puppetSeed),10000);
    let source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
    const projection='{progress,sideDepth,roadsideX,terrainAt,clipRoadside}';
    const edits=[
      ["  const clone = value => JSON.parse(JSON.stringify(value));",
        "  SIDE_PLACES.length=0; INFILL_SCENES.length=0;\n"+
        "  SATELLITE_SCENES.length=0; STREET_SCENES.length=0;\n"+
        "  const clone = value => JSON.parse(JSON.stringify(value));"],
      ['      // The open lot is a patch of the curved landscape;',
        `      B.CacheRoadPuppetStudy.draw(ctx,${projection},`+
        "window.CACHE_PUPPET_PREVIEW,'ground');\n"+
        '      // The open lot is a patch of the curved landscape;'],
      ['      // Upright painted buildings retain their authored diagonal perspective.',
        `      B.CacheRoadPuppetStudy.draw(ctx,${projection},`+
        "window.CACHE_PUPPET_PREVIEW,'cards');\n"+
        '      // Upright painted buildings retain their authored diagonal perspective.'],
      ['          const fx=roadsideX(side,far,46,58);',
        '          if(window.CACHE_PUPPET_PREVIEW)continue;\n'+
        '          const fx=roadsideX(side,far,46,58);'],
      ['          const x=roadsideX(side,t,98,80);',
        '          if(window.CACHE_PUPPET_PREVIEW)continue;\n'+
        '          const x=roadsideX(side,t,98,80);']
    ];
    for(const [before,after] of edits) {
      if(!source.includes(before))throw Error(`Puppet preview injection changed: ${before}`);
      source=source.replace(before,after);
    }
    const puppetHalf=process.env.CACHE_PUPPET_CAMERA_HALF;
    if(puppetHalf!==undefined) {
      if(!/^\d{3}$/.test(puppetHalf)||Number(puppetHalf)<390||
        Number(puppetHalf)>534)throw Error('Invalid puppet camera width');
      const before='      const half = t => 82 + 534 * t;';
      if(!source.includes(before))throw Error('Road camera width marker changed');
      source=source.replace(before,
        `      const half = t => 82 + ${Number(puppetHalf)} * t;`);
    }
    vm.runInContext(source,context,{filename:'src/game/cache-road-proof.js [puppet preview]'});
  } else if(landscapeSeed!==undefined) {
    if(!/^\d{1,8}$/.test(landscapeSeed))
      throw Error('Landscape seed must be a small unsigned integer');
    const source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
    const marker='B.CacheRoadLandscape?.create(0x6b4d,END,SIDE_PLACES)';
    if(!source.includes(marker))throw Error('Landscape seed insertion changed');
    vm.runInContext(source.replace(marker,
      `B.CacheRoadLandscape?.create(${Number(landscapeSeed)},END,SIDE_PLACES)`),
    context,{filename:'src/game/cache-road-proof.js [landscape seed review]'});
  } else if (areaReviewPath) {
    // Keep the production projection intact, but replace the seeded sites
    // with one unmirrored copy of this source at equal depth on each bank.
    const area = art.cacheReviewPlace;
    let source = fs.readFileSync('src/game/cache-road-proof.js', 'utf8');
    const artMarker = "  const PLACE_KINDS = [...Object.keys(PLACE_ART),'parking'];";
    const placeMarker = '  SIDE_PLACES.sort((a,b)=>b.at-a.at);';
    if (!source.includes(artMarker) || !source.includes(placeMarker))
      throw Error('Cache Road review insertion point changed');
    const reviewMaxW=Number(process.env.CACHE_REVIEW_MAX_W || 650);
    if(!Number.isFinite(reviewMaxW) || reviewMaxW<=0 || reviewMaxW>960)
      throw Error('Invalid area review width');
    source = source.replace(artMarker,
      `  PLACE_ART.review = ['cacheReviewPlace',${area.width},${area.height},${reviewMaxW},190];\n${artMarker}`);
    source = source.replace(placeMarker, `${placeMarker}\n`+
      "  SIDE_PLACES.length=0;\n"+
      "  for(const side of [-1,1]) SIDE_PLACES.push({at:7200,side,size:1,setback:90,kind:'review'});");
    vm.runInContext(source, context, { filename: 'src/game/cache-road-proof.js [area review]' });
  } else if(process.env.CACHE_REVIEW_PRINT_LAYOUT) {
    const source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
    const marker='  // Six existing settings now occupy legal graph parcels';
    if(!source.includes(marker))throw Error('Landscape layout marker changed');
    vm.runInContext(source.replace(marker,
      '  window.CACHE_REVIEW_LAYOUT=LANDSCAPE;\n'+marker),context,
    {filename:'src/game/cache-road-proof.js [layout inspection]'});
    const layout=w.CACHE_REVIEW_LAYOUT;
    console.log(JSON.stringify(layout.chunks.filter(chunk=>
      process.env.CACHE_REVIEW_PRINT_LAYOUT==='all'||
      chunk.family==='market').map(chunk=>({id:chunk.id,side:chunk.side,
        frontAt:chunk.frontAt,open:chunk.open,plates:layout.plates.filter(
          plate=>plate.chunkId===chunk.id).map(plate=>
            `${plate.tier}:${plate.art[0]}`)})),null,2));
  } else if(process.env.CACHE_REVIEW_REVISION) {
    const source=execFileSync('git',['show',`${process.env.CACHE_REVIEW_REVISION}:src/game/cache-road-proof.js`],{encoding:'utf8'});
    vm.runInContext(source,context,{filename:'cache-road-review-revision.js'});
  } else load(context, 'src/game/cache-road-proof.js');
  // Use the production atlas code, including its real frame grid, anchors,
  // crops and smoothing. Only image delivery is replaced with local files.
  // A second hand-written atlas renderer previously missed ambient columns.
  const definitions=fs.readFileSync('src/engine/presentation-assets.js','utf8');
  const imageClass=w.Image;w.Image=undefined;w.__reviewArt=art;
  vm.runInContext(definitions.replace('  const cache = {};',
    `  const cache = Object.fromEntries(Object.entries(window.__reviewArt)
      .map(([key,image])=>[key,{image,ready:true}]));`),context,
    {filename:'presentation-assets.js [local image delivery]'});
  w.Image=imageClass;
  const productionDraw=w.BARCODE.PresentationAssets.draw;
  const assetFrames={},renderStats=[],assetCosts={};
  let frameDraws=0;
  w.BARCODE.PresentationAssets.draw=(key,ctx,args={})=>{
    frameDraws++;
    (assetFrames[key]??=new Set()).add(args.frame||0);
    if(key==='cacheReviewPlace'||key.startsWith('cachePuppet')) {
      const image=art[key];if(!image)return false;
      ctx.save();ctx.translate(args.x,args.y);
      if(args.flip||process.env.CACHE_REVIEW_FLIP_RIGHT==='1'&&args.x>960)ctx.scale(-1,1);
      ctx.drawImage(image,-args.width/2,-args.height,args.width,args.height);
      ctx.restore();return true;
    }
    const start=process.env.CACHE_REVIEW_PROFILE?performance.now():0;
    const drawn=productionDraw(key,ctx,args);
    if(start)assetCosts[key]=(assetCosts[key]||0)+performance.now()-start;
    return drawn;
  };
  const parent = { levelId: 'level-01', checkpointId: 'intermission', levelState: {
    difficultyId: 'standard', run: { levelId: 'level-01', runId: 'mirror-review',
      recoveryMode: 'checkpoints', elapsedMs: 120000, damageTaken: 0, retries: 0,
      attempts: 1, accurate: 1, perfect: 1, connected: 1, connectedPerfect: 1,
      completed: true }, score: 2400, bestCombo: 2, health: 3, playerX: 3500,
    fragments: [], skyCaches: [], ampCharges: 1,
    boss: { bossX: 3480, playerX: 3500, score: 2400, skyCaches: [] },
    result: { score: 2400 } } };
  const saved = { levelId: 'level-02', checkpointId: 'road-start', levelState: {
    proofVersion: 4, returnTo: parent, proof: { progress: 0, lane: 1, lanePos: 1,
      musicBar: 0, speed: 54, timeMs: 55000, lockEnergy: 0, echoEnergy: 100,
      integrity: 3, score: 0, peakStack: 1, cleanBars: 0 } } };
  const road = w.BARCODE.CacheRoadProof;
  if (!road.restore(saved)) throw Error('Road fixture did not restore');
  road.audioDegraded = false;
  const scene = createCanvas(1920,1080), sc = scene.getContext('2d');
  const video = createCanvas(1280,720), vc = video.getContext('2d');
  const detail = createCanvas(1320, 1140), dc = detail.getContext('2d');
  const worldReview = process.env.CACHE_REVIEW_WORLD === '1';
  const siteReview = process.env.CACHE_REVIEW_SITES === '1';
  const gameplay = process.env.CACHE_REVIEW_GAMEPLAY === '1';
  const gearReview = gameplay && process.env.CACHE_REVIEW_GEARS === '1';
  const continuous = gameplay || process.env.CACHE_REVIEW_CONTINUOUS === '1';
  const animationReview = process.env.CACHE_REVIEW_ANIMATION === '1';
  const customProgress=process.env.CACHE_REVIEW_PROGRESS?.split(',')
    .map(Number).filter(Number.isFinite);
  const stillReview = process.env.CACHE_REVIEW_STILLS === '1' || !!customProgress?.length;
  const reviewLap = Number(process.env.CACHE_REVIEW_LAP || 0);
  const sceneryReview = worldReview || siteReview || stillReview;
  const fps = stillReview ? 1 : continuous ? Number(process.env.CACHE_REVIEW_FPS||
    (districtSeed!==undefined||puppetSeed!==undefined?
      Number(process.env.CACHE_DISTRICT_FPS||24):15)) : 18;
  const seconds = stillReview ? 1 : continuous ? Number(process.env.CACHE_REVIEW_SECONDS||
    (districtSeed!==undefined||puppetSeed!==undefined?
      Number(process.env.CACHE_DISTRICT_SECONDS||8):32)) : 2;
  if(!Number.isInteger(fps)||fps<1||fps>60||!Number.isInteger(seconds)||
    seconds<1||seconds>32)throw Error('Invalid review rate or duration');
  const chapters = stillReview ?
    (customProgress?.length ? customProgress :
      [0,100,150,230,325,400,455,525,600,800,1000,1300,1700,2200])
      .map(progress=>({name:`Road-${String(progress).padStart(4,'0')}`,
        progress,bar:4+Math.floor(progress/81)})) :
    continuous ? [{ name: 'Continuous-Drive', progress: 0, bar: 4 }] : siteReview ? [
    { name: 'Parking-Peek', progress: 155, bar: 6 },
    { name: 'Parking-Approach', progress: 325, bar: 8 },
    { name: 'Parking-Clear', progress: 455, bar: 10 },
    { name: 'Park-Peek', progress: 230, bar: 7 },
    { name: 'Park-Approach', progress: 400, bar: 9 },
    { name: 'Park-Clear', progress: 525, bar: 11 }
  ] : worldReview ? [
    { name: 'Market', progress: 0, bar: 4 },
    { name: 'Sweeper', progress: 315, bar: 7 },
    { name: 'Trike', progress: 565, bar: 10 },
    { name: 'Audit', progress: 975, bar: 15 },
    { name: 'Shuttle', progress: 1065, bar: 16 },
    { name: 'Depot', progress: 1255, bar: 19 },
    { name: 'Later-Block', progress: 2020, bar: 28 }
  ] : [
    { name: 'Calm', progress: 3020, bar: 32 },
    { name: 'Focused', progress: 3120, bar: 33 },
    { name: 'Turbo', progress: 5580, bar: 56 },
    { name: 'Close-Pass', progress: 5720, bar: 57 },
    { name: 'Hit', progress: 7900, bar: 80 },
    { name: 'Low-Signal', progress: 8080, bar: 81 }
  ];
  const laneMoves = continuous ? [[1.5,1.5,0,1]] : siteReview ? [
    [1.5,1.5,0,1],[1.5,1.5,0,1],[1.5,1.5,0,1],
    [1.5,1.5,0,1],[1.5,1.5,0,1],[1.5,1.5,0,1]
  ] : worldReview ? [
    [1,1,0,1], [2,2.8,.25,1.4], [0,1,.15,1.25],
    [1,0,.3,1.3], [2,2,0,1], [2,1,.3,1.4], [3,3,0,1]
  ] : [
    [1.5,1.5,0,1], [1.5,2.45,.15,1.35], [2.45,1.2,.06,1.3],
    [1.2,2.0,.12,.62], [2.0,2.0,0,1], [2.0,1.5,.4,1.6]
  ];
  const smooth = value => { const v=Math.max(0,Math.min(1,value)); return v*v*(3-2*v); };
  const file = path.join(out, animationReview ? 'Cache-Road-Animation-Drive.mp4' :
    continuous ? 'Cache-Road-Curved-Roadside-Drive.mp4' :
    worldFrames ? 'Cache-Road-Mirror-World-Preview.mp4' : 'Cache-Road-Mirror-Preview.mp4');
  const ff = encoder = spawn('/usr/bin/ffmpeg', ['-y','-loglevel','error','-f','rawvideo',
    '-pix_fmt','rgba','-s','1280x720','-r',String(fps),'-i','pipe:0',
    '-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19',
    '-pix_fmt','yuv420p','-movflags','+faststart',file],
    { stdio: ['pipe','ignore','pipe'] });
  let error = ''; ff.stderr.on('data', data => { error += data; });
  const completion = once(ff,'close');
  const carCenters = [];
  const audioEvents=[],mixEvents=[],playbackFrames=[];
  if(gameplay) {
    road.selectMusicProfile();
    w.BARCODE.MusicTransport.start({sourceAnchorAudioSec:0,sourceOffsetTrackSec:0});
    load(context,'src/engine/music-director.js');
    const profile=w.BARCODE.MusicProfiles.get('level-02.proof');
    Object.assign(w.audioSystem,{layersStarted:true,isLooping:false,
      getActiveMusicProfile:()=>profile,
      musicTracks:Object.fromEntries(profile.arrangement.sources.map(source=>
        [source.sourceId,{sourceId:source.sourceId,isPlaying:true,gain:{},volume:0}])),
      rampAdaptiveStemGain(track,volume,duration) {
        mixEvents.push({sourceId:track.sourceId,volume,duration,at:this.context.currentTime});
        track.volume=volume;
      },
      playCombatCue(kind,options={}) {
        audioEvents.push({kind,at:options.audioTimeSec??this.context.currentTime,
          calledAt:this.context.currentTime});return true;
      }
    });
  }
  const driveRoute=[[150,0,'road_a'],[365,1,'road_x'],[585,3,'road_y'],[810,2,'road_b'],
    [1260,2,'road_y'],[1490,1,'road_a'],[1720,0,'road_x'],[1895,3,'road_b']];
  let driveIndex=0;
  let reviewEchoSent=false;
  const shiftInputs=[[1,'move_down'],[4.2,'move_up'],[8.2,'move_up'],
    [11,'move_down'],[14,'move_down'],[17,'move_up'],[21,'move_up'],[26,'road_turbo']];
  let shiftIndex=0;
  for (let i = 0; i < chapters.length * seconds * fps; i++) {
    const chapterIndex = Math.floor(i / (seconds * fps));
    const chapter = chapters[chapterIndex], local = i % (seconds * fps) / fps;
    const s = road.state;
    if(!gameplay) {
    s.progress = continuous ? local * 80 + reviewLap*2460 :
      chapter.progress + local * 54 + reviewLap*2460;
    s.elapsedMs = i * 1000 / fps;
    s.musicBar = chapter.bar + reviewLap*24 + Math.floor(local / 1.875);
    s.musicBeatFloat = s.musicBar * 4 + (stillReview && process.env.CACHE_REVIEW_BEAT_OFFSET !== undefined ?
      Number(process.env.CACHE_REVIEW_BEAT_OFFSET) : local % 1.875 * 4 / 1.875);
    // Scripted arrangement states expose queued, single, and full-stack road
    // markings for art review; no audio or playable route is implied.
    const reviewParts=process.env.CACHE_REVIEW_CAPTURE_LANES ?
      process.env.CACHE_REVIEW_CAPTURE_LANES.split(',').map(Number).filter(lane=>lane>=0&&lane<4) :
      continuous ? [[0],[0,1],[0,1,3],[0,1,2,3]][Math.min(3,Math.floor(local/8))] :
      worldReview ? [[],[],[0],[0,1],[0,1,3],[1,3],[0,1,2,3]][chapterIndex] : [];
    s.captures=reviewParts.map(lane => ({ lane,startBeat:(s.musicBar-1)*4,
      endBeat:(s.musicBar+7)*4 }));
    s.queuedCaptures=worldReview&&chapterIndex===1 ? [{lane:2,
      startBeat:(s.musicBar+1)*4,endBeat:(s.musicBar+5)*4,
      inkAtMs:s.elapsedMs-350}] : [];
    s.fullAdrenaline=s.captures.length===4;
    const reviewLane=Number(process.env.CACHE_REVIEW_LANE ?? 1.5);
    const [from,to,start,end] = stillReview ? [reviewLane,reviewLane,0,1] : laneMoves[chapterIndex];
    const turn = Math.max(0,Math.min(1,(local-start)/(end-start)));
    s.lanePos = s.visualLane = continuous ? 1.5+.45*Math.sin(local*.41) : from+(to-from)*smooth(turn);
    s.lane = Math.round(s.lanePos);
    s.speed = Number(process.env.CACHE_REVIEW_SPEED ??
      (process.env.CACHE_REVIEW_BRAKING === '1' ? 32 : 54));
    s.steer = continuous ? .12*Math.cos(local*.41) :
      turn > 0 && turn < 1 ? Math.sign(to-from)*(.15+.85*Math.sin(Math.PI*turn)) : 0;
    const at=t => 200*Math.sin(t/700)+90*Math.sin(t/295+.5);
    const heading=200/700*Math.cos(s.progress/700)+90/295*Math.cos(s.progress/295+.5);
    const ahead=(1-.83)*520;
    const half=82+534*.83;
    const center=960+(at(s.progress+ahead)-at(s.progress)-ahead*heading)*.95;
    carCenters.push((center-half+s.visualLane*half/2+half/4)*2/3);
    s.integrity = Number(process.env.CACHE_REVIEW_INTEGRITY ??
      (!sceneryReview && chapterIndex === 5 ? 1 : 3));
    s.braking = process.env.CACHE_REVIEW_BRAKING === '1';
    s.timeMs = !sceneryReview && chapterIndex === 5 ? 7400 : 55000;
    s.pendingCapture = !sceneryReview && chapterIndex === 1 ? { lane: 2, startBeat: (s.musicBar + 1)*4 } : null;
    s.candidateHold = !sceneryReview && chapterIndex === 1 ? .82 : 0;
    s.candidateLane = !sceneryReview && chapterIndex === 1 ? 2 : null;
    s.boostMs = !sceneryReview && chapterIndex === 2 ? 800 : 0;
    s.cutFlashMs = !sceneryReview && chapterIndex === 3 ? Math.max(0,740-local*1000) : 0;
    s.cutStreak = !sceneryReview && chapterIndex === 3 ? 2 : 0;
    s.cutAward = !sceneryReview && chapterIndex === 3 ? 250 : 0;
    s.stumbleMs = Number(process.env.CACHE_REVIEW_STUMBLE ??
      (!sceneryReview && chapterIndex === 4 ? Math.max(0,650-local*1000) : 0));
    if(animationReview) {
      // A review cue every two seconds demonstrates each eight-cel action
      // without changing the playable catch or music judgment.
      const actionAge=local%2;
      s.pulseFlashAction=Math.floor(local/2)%4;
      s.pulseFlashMs=actionAge>=.35 && actionAge<1 ?
        650-(actionAge-.35)*1000 : 0;
    }
    s.invulnerableMs = !sceneryReview && chapterIndex === 4 ? Math.max(0,1400-local*1000) : 0;
    s.messageMs = 0; s.message = '';
    if(worldReview&&chapterIndex===3) {
      s.ramMs=1200;s.shield=1;
      s.messageMs=1100;s.message='PUSH // BREAKAWAY +8 BARS';
    } else {s.ramMs=0;s.shield=0;}
    s.echoEnergy = Math.min(100,65 + chapterIndex * 6);
    s.lockEnergy = 26 + chapterIndex * 10;
    road.updateStreetMotion(1000/fps);
    const sectionBeat=Math.floor(s.musicBeatFloat/4)*4;
    const section={beat:sectionBeat,beatSec:60/128,speed:s.speed,v0:s.speed,
      from:s.progress-(s.musicBeatFloat-sectionBeat)*60/128*s.speed};
    s.driveSections=[section];s.pulseTargets={};s.pulsePlaces={};
    road.placePulse(section);
    road.updatePulses({running:true,profileId:'level-02.proof',
      audioTimeSec:s.musicBeatFloat*60/128,
      grid:{beatFloat:s.musicBeatFloat,beatDurationSec:60/128}});
    } else {
      const now=i/fps,beat=now/(60/128);
      w.audioSystem.context.currentTime=now;
      const next=driveRoute[driveIndex];
      const goal=driveIndex===1&&s.progress<205?0:
        driveIndex===3&&s.progress<650?3:
        driveIndex===4&&s.progress<1058?0:
        driveIndex===5&&s.progress<1338?2:
        driveIndex===6&&s.progress<1528?1:next?.[1]??3;
      const steer=goal-s.lanePos;
      const actions={move_left:{held:steer<-.1},move_right:{held:steer>.1}};
      if(gearReview&&shiftIndex<shiftInputs.length&&now>=shiftInputs[shiftIndex][0]) {
        actions[shiftInputs[shiftIndex++][1]]={pressed:true};
      }
      if(gearReview&&!reviewEchoSent&&s.progress>=920) {
        actions.road_echo={pressed:true};reviewEchoSent=true;
      }
      if(next&&Math.abs(steer)<=.38&&
          Math.abs(beat-s.pulseTargets[`0/${Math.floor(driveIndex/4)}/${driveIndex%4}`])<.055) {
        actions[next[2]]={pressed:true,presses:[{audioTimeSec:now}]};driveIndex++;
      }
      road.handleActions(actions);
      road.update(1000/fps);
      w.BARCODE.musicDirector.apply(w.audioSystem);
      playbackFrames.push({at:now,progress:s.progress,beat:s.musicBeatFloat,
        lane:s.lanePos,speed:s.speed,integrity:s.integrity,
        gear:s.gear,pendingGear:s.pendingGear,boostMs:s.boostMs,
        captures:s.captures.length,pulseFlashMs:s.pulseFlashMs,
        targets:{...s.pulseTargets},places:{...s.pulsePlaces}});
    }
    if(process.env.CACHE_REVIEW_FEEDBACK==='1'&&!gameplay) {
      // Explicit presentation fixtures; real earning is covered by gameplay checks.
      const phase=Math.floor(local/2)%4;
      s.progress=535+local*4;
      s.lanePos=s.visualLane=s.lane=2;
      s.boost=0;s.boostMs=phase===3?900:0;
      s.draftTarget=phase===0?635:null;s.draftMs=phase===0?360:0;
      s.shield=phase===1?1:0;s.ramMs=phase===2?1500:0;
      s.turboReadyMs=phase===3?700:0;
    }
    sc.reset();frameDraws=0;
    const started=performance.now();
    road.draw(sc);
    renderStats.push({progress:s.progress,ms:performance.now()-started,assetDraws:frameDraws});
    if(continuous&&i% (fps*4)===0)console.log(`Review ${Math.floor(i/fps)}/${seconds}s; gear ${s.gear+1}; integrity ${s.integrity}`);
    if (worldFrames) {
      // Layout study: the current production HUD is placed over the owner's
      // earlier road-motion preview. The two draws are not one live build.
      vc.drawImage(worldFrames[Math.floor(i * 120 / (chapters.length * seconds * fps))],
        0,0,800,450,0,0,1280,720);
      vc.drawImage(scene,0,0,1920,164,0,0,1280,109.3333);
    } else vc.drawImage(scene,0,0,1920,1080,0,0,1280,720);
    const stillAt = stillReview ? 0 : chapterIndex === 3 || chapterIndex === 4 ? 4 : fps;
    if (continuous ? i % (fps*4) === fps : i % (fps * seconds) === stillAt) {
      const name=continuous ? `Drive-${String(Math.floor(i/(fps*4))).padStart(2,'0')}` : chapter.name;
      fs.writeFileSync(path.join(out, `Cache-Road-Mirror-${name}.webp`),
        video.toBuffer('image/webp',88));
      const row = (continuous ? Math.floor(i/(fps*4)) : chapterIndex) * 190;
      if(row+190<=detail.height) {
        dc.drawImage(scene, 600, 0, 1320, 164, 0, row, 1320, 164);
        dc.fillStyle = '#091523'; dc.fillRect(0, row+164, 1320, 26);
        dc.fillStyle = '#f5dda9'; dc.font = 'bold 18px Oxanium';
        dc.fillText(name.toUpperCase(), 20, row+184);
      }
    }
    if (!ff.stdin.write(Buffer.from(vc.getImageData(0,0,1280,720).data)))
      await once(ff.stdin,'drain');
  }
  ff.stdin.end();
  const [code, signal] = await completion;
  if (code !== 0) throw Error(error || `ffmpeg exited: ${signal}`);
  fs.writeFileSync(path.join(out,'Cache-Road-Motion-Track.json'),
    JSON.stringify({ fps,gameplay,seconds,landscapeSeed:landscapeSeed===undefined?
      0x6b4d:Number(landscapeSeed),carCenters,audioEvents,mixEvents,playbackFrames,
      renderStats,assetCosts,assetFrames:Object.fromEntries(Object.entries(assetFrames)
        .map(([key,frames])=>[key,[...frames].sort((a,b)=>a-b)])) }, null, 2));
  fs.writeFileSync(path.join(out, 'Cache-Road-Mirror-Detail.webp'), detail.toBuffer('image/webp',90));
  console.log(file);
}
main().catch(error => {
  encoder?.stdin.destroy();encoder?.kill();
  console.error(error.stack || error);process.exitCode = 1;
});
