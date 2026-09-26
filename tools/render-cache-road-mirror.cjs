// Scripted production HUD states for art review; no gameplay or Makko capture.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]
}));
const { createRig, load } = require('./check-level-01-boss');

async function main() {
  const out = path.resolve(process.argv[2] || 'docs/source-pack/review-cache-road-mirror');
  fs.mkdirSync(out, { recursive: true });
  const areaReviewPath = process.env.CACHE_REVIEW_AREA_ASSET;
  if (areaReviewPath && !path.resolve(areaReviewPath).startsWith(
    path.resolve('assets/cache-road/roadside/places') + path.sep))
    throw Error('Area review asset must be a roadside place image');
  const worldFrames = process.argv[3] ? await Promise.all(Array.from({length:120}, (_,i) =>
    loadImage(path.resolve(process.argv[3], `${String(i).padStart(3,'0')}.webp`)))) : null;
  GlobalFonts.registerFromPath(path.resolve('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'), 'Oxanium');
  const files = {
    cacheMirror: 'assets/cache-road/hud/cache-back-mirror-expressions.webp',
    cacheCar: 'assets/cache-road/vehicles/cache-center.webp',
    cacheCarLeft: 'assets/cache-road/vehicles/cache-left.webp',
    cacheCarRight: 'assets/cache-road/vehicles/cache-right.webp',
    cacheCarHit: 'assets/cache-road/vehicles/cache-hit.webp',
    cacheFreight: 'assets/cache-road/vehicles/freight.webp',
    cacheCourier: 'assets/cache-road/vehicles/courier.webp',
    cacheBarricade: 'assets/cache-road/vehicles/barricade.webp',
    cacheRival: 'assets/cache-road/vehicles/rival.webp',
    cacheAudit: 'assets/cache-road/vehicles/audit-sedan.webp',
    cacheSweeper: 'assets/cache-road/vehicles/sweeper.webp',
    cacheTrike: 'assets/cache-road/vehicles/signal-trike.webp',
    cacheShuttle: 'assets/cache-road/vehicles/night-shuttle.webp',
    cacheSkyline: 'assets/cache-road/world/panorama-skyline.webp',
    cacheDistantCity: 'assets/cache-road/world/bridge-free-distance.webp',
    cacheOutskirts: 'assets/cache-road/world/bridge-free-outskirts.webp',
    cacheMidCity: 'assets/cache-road/world/panorama-frontage.webp',
    cacheGroundClusterL1: 'assets/cache-road/world/ground-cluster-left-01.webp',
    cacheGroundClusterL2: 'assets/cache-road/world/ground-cluster-left-02.webp',
    cacheGroundClusterL3: 'assets/cache-road/world/ground-cluster-left-03.webp',
    cacheGroundClusterR1: 'assets/cache-road/world/ground-cluster-right-01.webp',
    cacheGroundClusterR2: 'assets/cache-road/world/ground-cluster-right-02.webp',
    cacheGroundClusterR3: 'assets/cache-road/world/ground-cluster-right-03.webp',
    cacheTransitNook: 'assets/cache-road/world/transit-service-nook.webp',
    cacheOutskirtsHomes: 'assets/cache-road/world/outskirts-homes.webp',
    cacheUtilityCorner: 'assets/cache-road/world/utility-service-corner.webp',
    cacheGreenhouseWorkshop: 'assets/cache-road/world/greenhouse-workshop.webp',
    cacheOutskirtsWorkshops: 'assets/cache-road/world/outskirts-workshops.webp',
    cacheRepairShop: 'assets/cache-road/world/neighborhood-repair-shop.webp',
    cacheVendorStall: 'assets/cache-road/world/street-vendor-people.webp',
    cacheParapet: 'assets/cache-road/roadside/parapet.webp',
    cachePylon: 'assets/cache-road/roadside/service-pylon.webp',
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
    cacheImpactGrit: 'assets/cache-road/effects/impact-grit.webp',
    cacheSpeedMist: 'assets/cache-road/effects/speed-mist.webp',
    cacheBlacktop: 'assets/wet-street/rain-blacktop.webp',
    cacheFly1: 'assets/traffic/ship-1.webp',
    cacheFly3: 'assets/traffic/ship-3.webp'
  };
  if (areaReviewPath) files.cacheReviewPlace = areaReviewPath;
  const art = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key,file]) =>
    [key, await loadImage(path.resolve(file))])));
  const { w, context } = createRig();
  w.localStorage = { getItem() { return null; }, setItem() {} };
  load(context, 'src/game/lore-collection.js');
  w.lostDataSystem.archive = new w.BARCODE.LoreCollection();
  load(context, 'src/game/campaign-services.js');
  load(context, 'src/engine/cache-road-proof-profile.js');
  if (areaReviewPath) {
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
  } else load(context, 'src/game/cache-road-proof.js');
  w.BARCODE.PresentationAssets = {
    ready(key) { return !!art[key]; },
    draw(key, ctx, { x, y, width, height, frame, sourceRect, flip } = {}) {
      const image = art[key]; if (!image) return false;
      const mirror = key === 'cacheMirror';
      const ship = key === 'cacheFly1' || key === 'cacheFly3';
      const frameWidth = ship ? 320 : image.width;
      const frameHeight = key === 'cacheFly1' ? 83 : key === 'cacheFly3' ? 97 : image.height;
      const [sx, sy, sw, sh] = sourceRect || [0,0,mirror ? 512 : frameWidth,mirror ? 512 : frameHeight];
      const ax = key === 'cacheSkyline' || key === 'cacheDistantCity' || key === 'cacheOutskirts' || key === 'cacheMidCity' || key === 'cacheBlacktop' || key === 'cacheSidewalk' || key.endsWith('Ground') || key === 'cacheRollingGrain' ? 0 :
        key === 'cachePylon' ? .28 : .5;
      const ay = key === 'cacheMirror' || ship ? .5 :
        key === 'cacheBlacktop' || key === 'cacheSidewalk' || key.endsWith('Ground') || key === 'cacheRollingGrain' ? 0 : 1;
      const reviewFlip=key === 'cacheReviewPlace' &&
        process.env.CACHE_REVIEW_FLIP_RIGHT === '1' && x>960;
      ctx.save(); ctx.translate(x,y);
      if(key === 'cacheReviewPlace' ? reviewFlip : flip) ctx.scale(-1,1);
      ctx.imageSmoothingEnabled = !ship;
      ctx.drawImage(image, (mirror ? frame % 3 * 512 : ship ? frame % 8 * 320 : 0) + sx,
        (mirror ? Math.floor(frame / 3) * 512 : ship ? Math.floor(frame / 8) * frameHeight : 0) + sy,
        sw, sh, -width*ax, -height*ay, width, height);
      ctx.restore(); return true;
    }
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
  const continuous = process.env.CACHE_REVIEW_CONTINUOUS === '1';
  const customProgress=process.env.CACHE_REVIEW_PROGRESS?.split(',')
    .map(Number).filter(Number.isFinite);
  const stillReview = process.env.CACHE_REVIEW_STILLS === '1' || !!customProgress?.length;
  const reviewLap = Number(process.env.CACHE_REVIEW_LAP || 0);
  const sceneryReview = worldReview || siteReview || stillReview;
  const fps = stillReview ? 1 : continuous ? 15 : 18;
  const seconds = stillReview ? 1 : continuous ? 32 : 2;
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
  const file = path.join(out, continuous ? 'Cache-Road-Curved-Roadside-Drive.mp4' :
    worldFrames ? 'Cache-Road-Mirror-World-Preview.mp4' : 'Cache-Road-Mirror-Preview.mp4');
  const ff = spawn('/usr/bin/ffmpeg', ['-y','-loglevel','error','-f','rawvideo',
    '-pix_fmt','rgba','-s','1280x720','-r',String(fps),'-i','pipe:0',
    '-an','-c:v','libx264','-threads','2','-preset','veryfast','-crf','19',
    '-pix_fmt','yuv420p','-movflags','+faststart',file],
    { stdio: ['pipe','ignore','pipe'] });
  let error = ''; ff.stderr.on('data', data => { error += data; });
  const completion = once(ff,'close');
  const carCenters = [];
  for (let i = 0; i < chapters.length * seconds * fps; i++) {
    const chapterIndex = Math.floor(i / (seconds * fps));
    const chapter = chapters[chapterIndex], local = i % (seconds * fps) / fps;
    const s = road.state;
    s.progress = continuous ? local * 80 + reviewLap*2460 :
      chapter.progress + local * 54 + reviewLap*2460;
    s.elapsedMs = i * 1000 / fps;
    s.musicBar = chapter.bar + reviewLap*24 + Math.floor(local / 1.875);
    s.musicBeatFloat = s.musicBar * 4 + local % 1.875 * 4 / 1.875;
    // Scripted arrangement states expose queued, single, and full-stack road
    // markings for art review; no audio or playable route is implied.
    const reviewParts=continuous ? [[0],[0,1],[0,1,3],[0,1,2,3]][Math.min(3,Math.floor(local/8))] :
      worldReview ? [[],[],[0],[0,1],[0,1,3],[1,3],[0,1,2,3]][chapterIndex] : [];
    s.captures=reviewParts.map(lane => ({ lane,startBeat:(s.musicBar-1)*4,
      endBeat:(s.musicBar+7)*4 }));
    s.queuedCaptures=worldReview&&chapterIndex===1 ? [{lane:2,
      startBeat:(s.musicBar+1)*4,endBeat:(s.musicBar+5)*4,
      inkAtMs:s.elapsedMs-350}] : [];
    s.fullAdrenaline=s.captures.length===4;
    const [from,to,start,end] = stillReview ? [1.5,1.5,0,1] : laneMoves[chapterIndex];
    const turn = Math.max(0,Math.min(1,(local-start)/(end-start)));
    s.lanePos = s.visualLane = continuous ? 1.5+.45*Math.sin(local*.41) : from+(to-from)*smooth(turn);
    s.lane = Math.round(s.lanePos); s.speed = 54;
    s.steer = continuous ? .12*Math.cos(local*.41) :
      turn > 0 && turn < 1 ? Math.sign(to-from)*(.15+.85*Math.sin(Math.PI*turn)) : 0;
    const at=t => 200*Math.sin(t/700)+90*Math.sin(t/295+.5);
    const heading=200/700*Math.cos(s.progress/700)+90/295*Math.cos(s.progress/295+.5);
    const ahead=(1-.83)*520;
    const half=82+534*.83;
    const center=960+(at(s.progress+ahead)-at(s.progress)-ahead*heading)*.95;
    carCenters.push((center-half+s.visualLane*half/2+half/4)*2/3);
    s.integrity = !sceneryReview && chapterIndex === 5 ? 1 : 3;
    s.timeMs = !sceneryReview && chapterIndex === 5 ? 7400 : 55000;
    s.pendingCapture = !sceneryReview && chapterIndex === 1 ? { lane: 2, startBeat: (s.musicBar + 1)*4 } : null;
    s.candidateHold = !sceneryReview && chapterIndex === 1 ? .82 : 0;
    s.candidateLane = !sceneryReview && chapterIndex === 1 ? 2 : null;
    s.boostMs = !sceneryReview && chapterIndex === 2 ? 800 : 0;
    s.cutFlashMs = !sceneryReview && chapterIndex === 3 ? Math.max(0,740-local*1000) : 0;
    s.cutStreak = !sceneryReview && chapterIndex === 3 ? 2 : 0;
    s.cutAward = !sceneryReview && chapterIndex === 3 ? 250 : 0;
    s.stumbleMs = !sceneryReview && chapterIndex === 4 ? Math.max(0,650-local*1000) : 0;
    s.invulnerableMs = !sceneryReview && chapterIndex === 4 ? Math.max(0,1400-local*1000) : 0;
    s.messageMs = 0; s.message = '';
    if(worldReview&&chapterIndex===3) {
      s.ramMs=1200;s.shield=1;
      s.messageMs=1100;s.message='PUSH // BREAKAWAY +8 BARS';
    } else {s.ramMs=0;s.shield=0;}
    s.echoEnergy = Math.min(100,65 + chapterIndex * 6);
    s.lockEnergy = 26 + chapterIndex * 10;
    sc.reset();
    road.draw(sc);
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
    JSON.stringify({ fps, carCenters }, null, 2));
  fs.writeFileSync(path.join(out, 'Cache-Road-Mirror-Detail.webp'), detail.toBuffer('image/webp',90));
  console.log(file);
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
