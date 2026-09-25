// Scripted production HUD states for art review; no gameplay or Makko capture.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createCanvas, loadImage, GlobalFonts } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]
}));
const { createRig, load } = require('./check-level-01-boss');

async function main() {
  const out = path.resolve(process.argv[2] || 'docs/source-pack/review-cache-road-mirror');
  fs.mkdirSync(out, { recursive: true });
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
    cacheSkyline: 'assets/cache-road/world/skyline.webp',
    cacheDistantCity: 'assets/cache-road/world/distant-city.webp',
    cacheMidCity: 'assets/cache-road/world/mid-city.webp',
    cacheParapet: 'assets/cache-road/roadside/parapet.webp',
    cachePylon: 'assets/cache-road/roadside/service-pylon.webp',
    cacheMarketBlock: 'assets/cache-road/roadside/market-block.webp',
    cacheRelayDepot: 'assets/cache-road/roadside/relay-depot.webp',
    cacheServiceFrontage: 'assets/cache-road/roadside/service-frontage.webp',
    cacheImpactGrit: 'assets/cache-road/effects/impact-grit.webp',
    cacheSpeedMist: 'assets/cache-road/effects/speed-mist.webp',
    cacheBlacktop: 'assets/wet-street/rain-blacktop.webp',
    cacheFly1: 'assets/traffic/ship-1.webp',
    cacheFly3: 'assets/traffic/ship-3.webp'
  };
  const art = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key,file]) =>
    [key, await loadImage(path.resolve(file))])));
  const { w, context } = createRig();
  w.localStorage = { getItem() { return null; }, setItem() {} };
  load(context, 'src/game/lore-collection.js');
  w.lostDataSystem.archive = new w.BARCODE.LoreCollection();
  load(context, 'src/game/campaign-services.js');
  load(context, 'src/engine/cache-road-proof-profile.js');
  load(context, 'src/game/cache-road-proof.js');
  w.BARCODE.PresentationAssets = {
    ready(key) { return !!art[key]; },
    draw(key, ctx, { x, y, width, height, frame, sourceRect, flip } = {}) {
      const image = art[key]; if (!image) return false;
      const mirror = key === 'cacheMirror';
      const ship = key === 'cacheFly1' || key === 'cacheFly3';
      const frameWidth = ship ? 320 : image.width;
      const frameHeight = key === 'cacheFly1' ? 83 : key === 'cacheFly3' ? 97 : image.height;
      const [sx, sy, sw, sh] = sourceRect || [0,0,mirror ? 512 : frameWidth,mirror ? 512 : frameHeight];
      const ax = key === 'cacheSkyline' || key === 'cacheDistantCity' || key === 'cacheMidCity' || key === 'cacheBlacktop' ? 0 :
        key === 'cachePylon' ? .28 : .5;
      const ay = key === 'cacheMirror' || ship ? .5 : key === 'cacheBlacktop' ? 0 : 1;
      ctx.save(); ctx.translate(x,y); if (flip) ctx.scale(-1,1); ctx.imageSmoothingEnabled = !ship;
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
  const fps = 18, seconds = 2, chapters = worldReview ? [
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
  const laneMoves = worldReview ? [
    [1,1,0,1], [2,2.8,.25,1.4], [0,1,.15,1.25],
    [1,0,.3,1.3], [2,2,0,1], [2,1,.3,1.4], [3,3,0,1]
  ] : [
    [1.5,1.5,0,1], [1.5,2.45,.15,1.35], [2.45,1.2,.06,1.3],
    [1.2,2.0,.12,.62], [2.0,2.0,0,1], [2.0,1.5,.4,1.6]
  ];
  const smooth = value => { const v=Math.max(0,Math.min(1,value)); return v*v*(3-2*v); };
  const file = path.join(out, worldFrames ? 'Cache-Road-Mirror-World-Preview.mp4' :
    'Cache-Road-Mirror-Preview.mp4');
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
    s.progress = chapter.progress + local * 54;
    s.elapsedMs = i * 1000 / fps;
    s.musicBar = chapter.bar + Math.floor(local / 1.875);
    s.musicBeatFloat = s.musicBar * 4 + local % 1.875 * 4 / 1.875;
    const [from,to,start,end] = laneMoves[chapterIndex];
    const turn = Math.max(0,Math.min(1,(local-start)/(end-start)));
    s.lanePos = s.visualLane = from+(to-from)*smooth(turn);
    s.lane = Math.round(s.lanePos); s.speed = 54;
    s.steer = turn > 0 && turn < 1 ? Math.sign(to-from)*(.15+.85*Math.sin(Math.PI*turn)) : 0;
    const half = 80+800*.83;
    const bend = Math.sin(s.progress/190+(1-.83)*1.2)*(1-.83)*124;
    carCenters.push((960+bend-half+s.visualLane*half/2+half/4)*2/3);
    s.integrity = !worldReview && chapterIndex === 5 ? 1 : 3;
    s.timeMs = !worldReview && chapterIndex === 5 ? 7400 : 55000;
    s.pendingCapture = !worldReview && chapterIndex === 1 ? { lane: 2, startBeat: (s.musicBar + 1)*4 } : null;
    s.candidateHold = !worldReview && chapterIndex === 1 ? .82 : 0;
    s.candidateLane = !worldReview && chapterIndex === 1 ? 2 : null;
    s.boostMs = !worldReview && chapterIndex === 2 ? 800 : 0;
    s.cutFlashMs = !worldReview && chapterIndex === 3 ? Math.max(0,740-local*1000) : 0;
    s.cutStreak = !worldReview && chapterIndex === 3 ? 2 : 0;
    s.cutAward = !worldReview && chapterIndex === 3 ? 250 : 0;
    s.stumbleMs = !worldReview && chapterIndex === 4 ? Math.max(0,650-local*1000) : 0;
    s.invulnerableMs = !worldReview && chapterIndex === 4 ? Math.max(0,1400-local*1000) : 0;
    s.messageMs = 0; s.message = '';
    s.echoEnergy = 65 + chapterIndex * 6;
    s.lockEnergy = 26 + chapterIndex * 10;
    road.draw(sc);
    if (worldFrames) {
      // Layout study: the current production HUD is placed over the owner's
      // earlier road-motion preview. The two draws are not one live build.
      vc.drawImage(worldFrames[Math.floor(i * 120 / (chapters.length * seconds * fps))],
        0,0,800,450,0,0,1280,720);
      vc.drawImage(scene,0,0,1920,164,0,0,1280,109.3333);
    } else vc.drawImage(scene,0,0,1920,1080,0,0,1280,720);
    const stillAt = chapterIndex === 3 || chapterIndex === 4 ? 4 : fps;
    if (i % (fps * seconds) === stillAt) {
      fs.writeFileSync(path.join(out, `Cache-Road-Mirror-${chapter.name}.webp`),
        video.toBuffer('image/webp',88));
      const row = chapterIndex * 190;
      dc.drawImage(scene, 600, 0, 1320, 164, 0, row, 1320, 164);
      dc.fillStyle = '#091523'; dc.fillRect(0, row+164, 1320, 26);
      dc.fillStyle = '#f5dda9'; dc.font = 'bold 18px Oxanium';
      dc.fillText(chapter.name.toUpperCase(), 20, row+184);
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
