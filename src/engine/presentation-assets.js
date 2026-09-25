// Shared raster cache. One bounded pinned/bundled attempt per asset;
// no canvases, timers, frame loops or gameplay state. Reused across restarts.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/presentation-assets.js', exports: ['BARCODE.PresentationAssets'], dependencies: [] });
(function() {
  const B = window.BARCODE = window.BARCODE || {};
  const root = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/e35ebe3ae8bfc547815a5a93c952424fa067af5d/';
  const rebuildRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/a155d4283a12df4dd7ea0f8cb9eb0bf985644fa8/';
  const railRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/08d5720f31020fd846ea6b93c76988ffef6e3fbe/';
  const streetRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/1891ebb4e061971362817832e942ef9fbe05d15a/';
  const slimRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/ac183cf0ccde1b716b82c5fdce9229d2de0c5032/';
  const upperRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/b1e9de902b325a949562e8ebeece375a8452ecca/';
  const finaleRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/f92f076b237632c7001641690505560fe9075da6/';
  const polishRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/dce79e888592023b85abe0eac2572f76b66e51ac/';
  // Makko imports may omit local binary art; use the merged artwork first.
  const cacheRoadRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/37db98387b8791655e3ff352d6bc6d61cb0b574b/';
  const cacheWorldRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/41edca02367b9f1f3af429d14df3d378ca46c9b4/';
  const cachePlacesRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/6868a002c8ee10b8067b45aa78f3dfbeaa628396/';
  const cacheRoadsideRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/3dbc72b087435b02244ff1ec097a5151329a7234/';
  // All fifteen new area paintings share one immutable asset commit. Makko
  // can request the pinned art even if its import omits bundled binary files;
  // the same relative paths remain the local preview fallback.
  const cacheNewPlacesRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/aa9beb8f1400b6ab494a63bc257d304709a81e4e/';
  const entries = {
    cacheMirror: { path: 'assets/cache-road/hud/cache-back-mirror-expressions.webp', root: cacheRoadRoot,
      columns: 3, rows: 2, frames: 6, ax: .5, ay: .5, smooth: true },
    cacheCar: { path: 'assets/cache-road/vehicles/cache-center.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheCarLeft: { path: 'assets/cache-road/vehicles/cache-left.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheCarRight: { path: 'assets/cache-road/vehicles/cache-right.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheCarHit: { path: 'assets/cache-road/vehicles/cache-hit.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheFreight: { path: 'assets/cache-road/vehicles/freight.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheCourier: { path: 'assets/cache-road/vehicles/courier.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheBarricade: { path: 'assets/cache-road/vehicles/barricade.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheRival: { path: 'assets/cache-road/vehicles/rival.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheAudit: { path: 'assets/cache-road/vehicles/audit-sedan.webp', root: cacheWorldRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheSweeper: { path: 'assets/cache-road/vehicles/sweeper.webp', root: cacheWorldRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheTrike: { path: 'assets/cache-road/vehicles/signal-trike.webp', root: cacheWorldRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheShuttle: { path: 'assets/cache-road/vehicles/night-shuttle.webp', root: cacheWorldRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceMarket: { path: 'assets/cache-road/roadside/places/corner-market.webp', root: cachePlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceHouse: { path: 'assets/cache-road/roadside/places/row-house.webp', root: cachePlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlacePark: { path: 'assets/cache-road/roadside/places/pocket-park.webp', root: cachePlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceGarage: { path: 'assets/cache-road/roadside/places/repair-garage.webp', root: cachePlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceApartment: { path: 'assets/cache-road/roadside/places/apartment.webp', root: cachePlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceDiner: { path: 'assets/cache-road/roadside/places/night-diner.webp', root: cachePlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceSubstation: { path: 'assets/cache-road/roadside/places/substation.webp', root: cachePlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceGarden: { path: 'assets/cache-road/roadside/places/hydroponics-horizon.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceConstruction: { path: 'assets/cache-road/roadside/places/fabrication-horizon.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceGardenRounded: { path: 'assets/cache-road/roadside/places/community-garden-rounded.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceGardenCompact: { path: 'assets/cache-road/roadside/places/community-garden-left-compact.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceGardenHorizon: { path: 'assets/cache-road/roadside/places/community-garden-horizon.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceConstructionRounded: { path: 'assets/cache-road/roadside/places/construction-yard-rounded.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceConstructionHorizon: { path: 'assets/cache-road/roadside/places/construction-yard-horizon.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceConstructionCompact: { path: 'assets/cache-road/roadside/places/construction-yard-right-compact.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceSignalOrchard: { path: 'assets/cache-road/roadside/places/signal-orchard.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceRelayExchange: { path: 'assets/cache-road/roadside/places/relay-exchange.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceDataReclamation: { path: 'assets/cache-road/roadside/places/data-reclamation.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceCapacitorExchange: { path: 'assets/cache-road/roadside/places/capacitor-exchange.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceNightDataMarket: { path: 'assets/cache-road/roadside/places/night-data-market.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceEncryptedPump: { path: 'assets/cache-road/roadside/places/encrypted-pump.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePlaceDroneServiceNode: { path: 'assets/cache-road/roadside/places/drone-service-node.webp', root: cacheNewPlacesRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheSkyline: { path: 'assets/cache-road/world/panorama-skyline.webp', root: cacheRoadsideRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 1, smooth: true },
    cacheDistantCity: { path: 'assets/cache-road/world/panorama-distance.webp', root: cacheRoadsideRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 1, smooth: true },
    cacheMidCity: { path: 'assets/cache-road/world/panorama-frontage.webp', root: cacheRoadsideRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 1, smooth: true },
    cacheParapet: { path: 'assets/cache-road/roadside/parapet.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cachePylon: { path: 'assets/cache-road/roadside/service-pylon.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .28, ay: 1, smooth: true },
    cacheSidewalk: { path: 'assets/cache-road/roadside/sidewalk-slab.svg', root: cacheRoadsideRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 0, smooth: true },
    cacheOuterGround: { path: 'assets/cache-road/roadside/outer-ground-panel.svg', root: cacheRoadsideRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 0, smooth: true },
    cacheGreenGround: { path: 'assets/cache-road/roadside/green-ground-panel.svg', root: cacheRoadsideRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 0, smooth: true },
    cacheServiceGround: { path: 'assets/cache-road/roadside/service-ground-panel.svg', root: cacheRoadsideRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 0, smooth: true },
    cacheImpactGrit: { path: 'assets/cache-road/effects/impact-grit.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheSpeedMist: { path: 'assets/cache-road/effects/speed-mist.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: .5, ay: 1, smooth: true },
    cacheBlacktop: { path: 'assets/wet-street/rain-blacktop.webp', root: cacheRoadRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 0, smooth: true },
    cacheFly1: { path: 'assets/traffic/ship-1.webp', root: cacheRoadRoot, columns: 8, rows: 11, frames: 81, ax: .5, ay: .5, smooth: false },
    cacheFly3: { path: 'assets/traffic/ship-3.webp', root: cacheRoadRoot, columns: 8, rows: 16, frames: 122, ax: .5, ay: .5, smooth: false },
    hudExpressions: { path: 'assets/feedback-polish/hud-expressions.webp', root: polishRoot, columns: 3, rows: 2, frames: 6, ax: .5, ay: .5, smooth: true },
    platformFacades: { path: 'assets/feedback-polish/platform-facades.webp', root: polishRoot, columns: 3, rows: 1, frames: 3, ax: 0, ay: 0, smooth: true },
    platformSideLeft: { path: 'assets/feedback-polish/platform-side-left.webp', root: polishRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 0, smooth: true },
    platformSideRight: { path: 'assets/feedback-polish/platform-side-right.webp', root: polishRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 0, smooth: true },
    studioCat: { path: 'assets/presentation/studio-cat.webp', columns: 2, rows: 2, frames: 4, ax: 0.5, ay: 0.9375 },
    directionArrow: { path: 'assets/presentation/direction-arrow.webp', columns: 1, rows: 1, frames: 1, ax: 0.5, ay: 0.5 },
    bossPulse: { path: 'assets/presentation/boss-pulse.webp', columns: 2, rows: 2, frames: 4, crop: [10, 95, 236, 145], ax: 0.5, ay: 1, smooth: true },
    hudPortrait: { path: 'assets/studies/visual-overhaul/prepared/hud-portrait.webp', root: 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/a4c1b7cf6fec0a083a4812ae1ea76edef45a5911/', columns: 1, rows: 1, frames: 1, ax: 0.5, ay: 0.5, smooth: true },
    thinWallRail: { path:'assets/thin-rails/wall.webp', root:railRoot, columns:1, rows:1, frames:1, ax:0.5, ay:0.5, smooth:true },
    thinPavementRail: { path:'assets/thin-rails/pavement.webp', root:railRoot, columns:1, rows:1, frames:1, ax:0.5, ay:0.5, smooth:true },
    thinRailElbow: { path:'assets/thin-rails/elbow.webp', root:railRoot, columns:1, rows:1, frames:1, ax:0.5, ay:0.5, smooth:true },
    thinRailCap: { path:'assets/thin-rails/cap.webp', root:railRoot, columns:1, rows:1, frames:1, ax:0.5, ay:0.5, smooth:true },
    rooftopDrone: { path:'assets/level1-rebuild/rooftop-drone.webp', root:rebuildRoot, columns:4, rows:2, frames:8, ax:0.5, ay:0.5, smooth:true },
    broadcastTerminal: { path:'assets/street-hardware/broadcast-terminal.webp', root:streetRoot, columns:1, rows:1, frames:1, ax:0, ay:0, smooth:true },
    gateHardware1: { path:'assets/street-hardware/slim-gate-1.webp', root:slimRoot, columns:2, rows:1, frames:2, ax:0, ay:0, smooth:true },
    gateHardware2: { path:'assets/street-hardware/slim-gate-2.webp', root:slimRoot, columns:2, rows:1, frames:2, ax:0, ay:0, smooth:true },
    gateHardware3: { path:'assets/street-hardware/slim-gate-3.webp', root:slimRoot, columns:2, rows:1, frames:2, ax:0, ay:0, smooth:true },
    gateHardware4: { path:'assets/street-hardware/slim-gate-4.webp', root:slimRoot, columns:2, rows:1, frames:2, ax:0, ay:0, smooth:true },
    rhythmLift: { path: 'assets/upper-route/rhythm-lift.webp', root: upperRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 0.32, smooth: true },
    liftCabin: { path: 'assets/finale/lift-cabin.webp', root: finaleRoot, columns: 1, rows: 1, frames: 1, ax: 0, ay: 0.795, smooth: true },
    liftTrack: { path: 'assets/finale/lift-track.webp', root: finaleRoot, columns: 1, rows: 1, frames: 1, ax: 0.5, ay: 0, smooth: true },
    studioCatEvent: { path: 'assets/finale/studio-cat-event.webp', root: finaleRoot, columns: 4, rows: 3, frames: 12, ax: 0.5, ay: 348 / 384, smooth: true },
    bossFlourish: { path: 'assets/upper-route/boss-flourish.webp', root: upperRoot, columns: 4, rows: 3, frames: 12, ax: 0.5, ay: 0.9375, smooth: true },
    bossLeap: { path: 'assets/upper-route/boss-leap.webp', root: upperRoot, columns: 4, rows: 2, frames: 8, ax: 0.5, ay: 0.9375, smooth: true },
    wetStreet: { path: 'assets/wet-street/rain-blacktop.webp', root: 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/6e1c8a4eb58252e1491dedc7878630dbab14929a/', columns: 1, rows: 1, frames: 1, ax: 0, ay: 0, smooth: true },
    steadyJammer: { path: 'assets/sprites-v3/prepared/broadcast_jammer_idle_idle.webp', root: 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/c6dc0116d08a70ca2c97edddb9404bd87e62906a/', columns: 8, rows: 6, frames: 48, ax: 0.5, ay: 340 / 352, smooth: true },
  };
  const cache = {};
  function preload() {
    if (typeof window.Image !== 'function') return;
    for (const [key, entry] of Object.entries(entries)) {
      if (cache[key]) continue;
      const image = new window.Image();
      const state = cache[key] = { image, ready: false, fallback: false };
      image.onload = () => { state.ready = image.naturalWidth > 0 && image.naturalHeight > 0; image.onload = null; image.onerror = null; };
      image.onerror = () => {
        if (!state.fallback) { state.fallback = true; image.src = entry.path; }
        else { image.onload = null; image.onerror = null; }
      };
      image.src = (entry.root ?? root) + entry.path;
    }
  }
  function draw(key, ctx, { x = 0, y = 0, width = 96, height, frame = 0,
    flip = false, sourceRect = null } = {}) {
    const entry = entries[key], state = cache[key];
    if (!entry || !state?.ready) return false;
    const image = state.image, fw = image.naturalWidth / entry.columns, fh = image.naturalHeight / entry.rows;
    const index = Math.max(0, Math.floor(frame)) % entry.frames;
    const [sx, sy, sw, sh] = sourceRect || entry.crop || [0, 0, fw, fh];
    const h = height ?? width * sh / sw;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = !!entry.smooth;
    ctx.drawImage(image, index % entry.columns * fw + sx, Math.floor(index / entry.columns) * fh + sy, sw, sh,
      -width * entry.ax, -h * entry.ay, width, h);
    ctx.restore(); return true;
  }
  B.PresentationAssets = { preload, draw, ready: key => !!cache[key]?.ready };
  preload();
})();
