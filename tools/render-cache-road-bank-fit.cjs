#!/usr/bin/env node
// Native production camera-only fixtures. No replacement scenery, inputs,
// collisions, transport, host delivery or subjective acceptance is staged.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { createRig, load } = require('./check-level-01-boss');
const repo = path.resolve(__dirname, '..');
process.chdir(repo);
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const round = value => Math.round(value * 1000) / 1000;
const plain = value => JSON.parse(JSON.stringify(value));
const out = path.resolve(process.argv[2] || 'docs/source-pack/review-cache-bank-fit');
const sourceFiles = ['src/game/cache-road-proof.js', 'src/game/cache-road-landscape.js',
  'src/game/cache-road-guidance.js', 'src/core/gamepad-ui.js',
  'src/engine/cache-road-proof-profile.js', 'src/engine/presentation-assets.js',
  'tools/render-cache-road-bank-fit.cjs'];

async function main() {
  const sourceHashes = Object.fromEntries(sourceFiles.map(file => [file, digest(file)]));
  const revision = execFileSync('git', ['-c', `safe.directory=${repo.replace(/\\/g, '/')}`,
    'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  GlobalFonts.registerFromPath('assets/studies/visual-overhaul/references/fonts/Oxanium.ttf', 'Oxanium');
  const manifest = fs.readFileSync('src/engine/presentation-assets.js', 'utf8');
  const marker = '  const cache = {};';
  assert(manifest.includes(marker), 'PresentationAssets cache injection anchor exists');
  const defs = createRig(); defs.w.Image = undefined;
  vm.runInContext(manifest.replace(marker, '  window.bankFitEntries=entries;\n' + marker), defs.context);
  const entries = defs.w.bankFitEntries;
  const cacheEntries = Object.entries(entries).filter(([key]) => key.startsWith('cache'));
  const images = Object.fromEntries(await Promise.all(cacheEntries.map(async ([key, entry]) =>
    [key, await loadImage(path.join(repo, entry.path))])));
  const assetHashes = Object.fromEntries(cacheEntries.map(([key, entry]) => [key,
    { path: entry.path, sha256: digest(entry.path), width: images[key].width,
      height: images[key].height, anchor: { x: entry.ax, y: entry.ay } }]));
  const r = createRig(), { w, context } = r, B = w.BARCODE;
  B.Campaign = { register() {}, syncTitleButton() {} };
  for (const file of ['src/core/gamepad-ui.js', 'src/engine/cache-road-proof-profile.js',
    'src/game/cache-road-landscape.js', 'src/game/cache-road-guidance.js']) load(context, file);
  let source = fs.readFileSync('src/game/cache-road-proof.js', 'utf8');
  // Read-only review hooks surround the actual production submissions. They
  // attach their existing world records; all layout, projection and paint
  // calculations remain the original code.
  const hooks = [
    ['  B.Campaign.register(ID,', '  window.bankFitReview={PLACE_ART,PLACE_BANK_RULES,SIDE_VARIANTS,SIDE_PLACES,LANDSCAPE,SCENERY,newState};\n  B.Campaign.register(ID,'],
    ['      for(const item of worldPaint)item.draw();',
      '      for(const item of worldPaint){window.bankFitItem=item.area;item.draw();}\n      window.bankFitItem=null;'],
    ['    for(const {item,p,key,args,person} of scenery) {',
      '    for(const {item,p,key,args,person} of scenery) {\n      window.bankFitItem=item;'],
    ['    const reflected=roadHazards(s).map(hazard=>({hazard,actor:actorPose(s,hazard)}));',
      '    window.bankFitItem=null;\n    const reflected=roadHazards(s).map(hazard=>({hazard,actor:actorPose(s,hazard)}));']
  ];
  for (const [before, after] of hooks) {
    assert.equal(source.split(before).length, 2, `Unique instrumentation anchor: ${before}`);
    source = source.replace(before, after);
  }
  vm.runInContext(source, context, { filename: 'cache-road-bank-fit-production.js' });
  w.Image = undefined; w.nativeVisualReviewImages = images;
  vm.runInContext(manifest.replace(marker,
    '  const cache=Object.fromEntries(Object.entries(window.nativeVisualReviewImages).map(([key,image])=>[key,{image,ready:true}]));'), context);
  B.CacheChapter = { recordIds: ['r1', 'r2', 'r3', 'r4'] };
  const R = w.bankFitReview, road = B.CacheRoadProof;
  const artFor = item => item.place ? R.SIDE_VARIANTS[item.place.variant]?.art || R.PLACE_ART[item.place.kind] :
    item.plate?.art || item.scene?.art;
  const describe = item => ({ at: item.at, side: item.side, kind: item.kind,
    ...(item.place ? { placeKind: item.place.kind, variant: item.place.variant || null,
      size: item.place.size, setback: item.place.setback } : {}),
    ...(item.plate ? { family: item.plate.family, tier: item.plate.tier,
      plateKey: item.plate.key, chunkId: item.plate.chunkId } : {}),
    art: plain(artFor(item) || []),
    sourceFit: plain(B.CacheRoadLandscape.SOURCE_FITS?.[artFor(item)?.[0]] || null),
    bankRule: plain(R.PLACE_BANK_RULES?.[artFor(item)?.[0]] || null) });
  const targets = [], targetIds = new Set();
  const add = (item, group, role) => {
    if (!item) throw new Error(`No actual production scenery for ${role}`);
    const id = `${group}-${item.side < 0 ? 'L' : 'R'}-${round(item.at)}`;
    if (targetIds.has(id)) return;
    targetIds.add(id); targets.push({ id, group, role, world: describe(item) });
  };
  // Actual protected-route addresses, rather than putting an arbitrary card
  // in front of a camera. Both source banks and actual featured alternatives
  // are retained. A target may already be outside the main frame near a pass.
  for (const side of [-1, 1]) for (const kind of ['house', 'park']) {
    const items = Array.from(R.SCENERY).filter(item => item.side === side &&
      item.place?.kind === kind && !item.place.variant).sort((a, b) => a.at - b.at);
    add(items[0], 'featured', `${kind} first actual ${side < 0 ? 'left' : 'right'} site`);
    if (items.length > 1) add(items[Math.floor(items.length / 2)], 'featured',
      `${kind} later actual ${side < 0 ? 'left' : 'right'} site / different bend`);
  }
  for (const [variant, def] of Object.entries(R.SIDE_VARIANTS)) {
    add(Array.from(R.SCENERY).filter(item => item.place?.variant === variant)
      .sort((a, b) => a.at - b.at)[0], 'variants', `${variant} native route / declared bank ${def.side}`);
  }
  for (const family of ['market', 'homes', 'workshop', 'greenhouse', 'data', 'transit'])
    for (const side of [-1, 1]) for (const slot of ['middle', 'open']) {
      const items = Array.from(R.SCENERY).filter(item => item.plate?.family === family &&
        item.side === side && (slot === 'open' ? item.plate.key === 'open' : item.plate.tier === 'middle'))
        .sort((a, b) => a.at - b.at);
      add(items[0], 'districts', `${family} ${slot} actual ${side < 0 ? 'left' : 'right'} card`);
    }
  for (const key of ['cacheTransitNook','cacheOutskirtsHomes','cacheUtilityCorner',
    'cacheGreenhouseWorkshop','cacheOutskirtsWorkshops','cacheRepairShop','cacheVendorStall'])
    for (const side of [-1,1]) for (const kind of ['plate','satellite']) {
      const items=Array.from(R.SCENERY).filter(item=>item.side===side && item.kind===kind &&
        artFor(item)?.[0]===key).sort((a,b)=>a.at-b.at);
      if(items.length)add(items[0],'contextual',`${key} actual ${kind} ${side<0?'left':'right'}`);
    }
  const contextualOnly=process.argv[3]==='--contextual';
  if(contextualOnly)targets.splice(0,targets.length,...targets.filter(target=>target.group==='contextual'));
  const canvas = createCanvas(1920, 1080), ctx = canvas.getContext('2d');
  let calls = [];
  const drawAsset = B.PresentationAssets.draw;
  B.PresentationAssets.draw = function(key, c, args = {}) {
    const item = w.bankFitItem;
    if (item && artFor(item)?.[0] === key) {
      const e = entries[key], matrix = c.getTransform();
      const width = args.width, height = args.height;
      const point = (u, v) => {
        const x = args.x + (u - e.ax) * width * (args.flip ? -1 : 1);
        const y = args.y + (v - e.ay) * height;
        return { x: round(matrix.a*x + matrix.c*y + matrix.e),
          y: round(matrix.b*x + matrix.d*y + matrix.f) };
      };
      const corners = [[0,0],[1,0],[0,1],[1,1]].map(([u,v]) => point(u,v));
      const art = artFor(item), sourceFit = B.CacheRoadLandscape.SOURCE_FITS?.[key];
      const fit = item.plate?.art[8] || sourceFit;
      const contactU = fit?.footU;
      const contactAt = item.plate?.art[7] ?? sourceFit?.contactAt;
      const crop = args.sourceRect || e.crop || [0,0,images[key].width/e.columns,images[key].height/e.rows];
      const hasContact = Number.isFinite(contactU) && Number.isFinite(contactAt);
      const sourceWidth = art[1] || images[key].width/e.columns;
      const localContactU = hasContact ? (contactU*sourceWidth-crop[0])/crop[2] : null;
      const localContactV = hasContact ? (contactAt-crop[1])/crop[3] : null;
      calls.push({ camera: String(c.filter).includes('blur') ? 'rear' : 'main', key,
        world: describe(item), flip: !!args.flip,
        args: plain(args), anchorPoint: point(e.ax,e.ay),
        sourceContact: hasContact ? { u: contactU, x: round(contactU*sourceWidth), y: contactAt,
          sourceSide: fit?.sourceSide ?? sourceFit?.sourceSide ?? null } : null,
        declaredContact: hasContact ? { sourceU:contactU, localU:localContactU, localV:localContactV,
          renderedU:args.flip?1-localContactU:localContactU,...point(localContactU,localContactV) } : null,
        groundY: Number.isFinite(args.groundY) ? args.groundY : null,
        bounds: { left: Math.min(...corners.map(p=>p.x)), right: Math.max(...corners.map(p=>p.x)),
          top: Math.min(...corners.map(p=>p.y)), bottom: Math.max(...corners.map(p=>p.y)) },
        matrix: { a: matrix.a, b: matrix.b, c: matrix.c, d: matrix.d, e: matrix.e, f: matrix.f } });
    }
    return drawAsset.call(this,key,c,args);
  };
  fs.mkdirSync(out, { recursive: true });
  const frames = [], stages = [['approach',-600],['middle',-260],['near',-40],['passed-rear',180]];
  for (const target of targets) for (const [stage, offset] of stages) {
    const progress = Math.max(0,target.world.at+offset);
    road.state = Object.assign(R.newState(), { progress, elapsedMs: 1800, lane: 1,
      lanePos: 1, visualLane: 1, speed: 52, gear: 1, timeMs: 55000, integrity: 3,
      musicBar: 24, musicBeatFloat: 96, captures: [], queuedCaptures: [],
      pulseTargets: {}, pulsePlaces: {}, audits: [], streetMotion: {},
      driveSections: [{ beat: 0, beatSec: 60/128, from: 52, v0: 52, speed: 52, gear: 1 }] });
    road.active=true; road.status='playing'; road.audioDegraded=false;
    road.chapter={records:[],difficultyId:'standard',encounterVersion:2};
    calls=[]; w.bankFitItem=null; ctx.reset(); road.draw(ctx);
    const file = `${target.id}-${stage}.webp`;
    fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/webp',91));
    const targetCalls = calls.filter(call=>call.world.at===target.world.at && call.world.side===target.world.side &&
      call.world.kind===target.world.kind && call.key===target.world.art[0]);
    frames.push({file,sha256:digest(path.join(out,file)),targetId:target.id,stage,progress,
      targetDistance:round(target.world.at-progress),targetCalls,calls:plain(calls)});
  }
  // Contact sheets contain scaled copies of the full unchanged scene, with
  // captions outside the game image. Full-resolution frames remain adjacent.
  for (const group of ['featured','variants','districts','contextual']) {
    const rows = targets.filter(target=>target.group===group);
    if(!rows.length)continue;
    const sheet=createCanvas(1280,48+rows.length*224),sc=sheet.getContext('2d');
    sc.fillStyle='#081b26';sc.fillRect(0,0,sheet.width,sheet.height);
    sc.fillStyle='#c2e8df';sc.font='18px Oxanium';
    sc.fillText(`PRODUCTION CAMERA ONLY / ${group} / ${revision.slice(0,12)}`,14,28);
    for (let i=0;i<rows.length;i++) for (let j=0;j<stages.length;j++) {
      const frame=frames.find(frame=>frame.targetId===rows[i].id&&frame.stage===stages[j][0]);
      const image=await loadImage(path.join(out,frame.file)),x=j*320,y=48+i*224;
      sc.fillStyle='#c2e8df';sc.font='11px Oxanium';
      sc.fillText(`${rows[i].world.art[0]} ${rows[i].world.side<0?'L':'R'} @${round(rows[i].world.at)}`,x+5,y+14);
      sc.fillText(`${frame.stage} / progress ${round(frame.progress)} / d=${frame.targetDistance}`,x+5,y+30);
      sc.drawImage(image,x,y+40,320,180);
    }
    fs.writeFileSync(path.join(out,`Contact-Sheet-${group}.webp`),sheet.toBuffer('image/webp',91));
  }
  for (const [file,sha] of Object.entries(sourceHashes)) assert.equal(digest(file),sha,`Source changed during capture: ${file}`);
  for (const entry of Object.values(assetHashes)) assert.equal(digest(entry.path),entry.sha256,`Asset changed during capture: ${entry.path}`);
  const limitations='Camera-only fixture over actual generated scenery and production CacheRoadProof.draw. Only camera/game presentation state is staged; authored assets, layout, projection, depth sorting and main/rear drawing are production code. It does not exercise input, collision, music scheduling, remote asset loading, browser/Makko performance, physical controller or human appearance acceptance. Projected calls are actual asset submissions and declared metadata contacts, not a pixel-perfect occupied-foundation proof; terrain/frame clipping can hide a submitted image.';
  const report={kind:'native-production-bank-fit-review',revision,
    revisionMeaning:'Git HEAD identifies the base; sourceHashes identify the exact working-file bytes rendered, including any uncommitted repair.',
    sourceHashes,assetHashes,
    dimensions:{width:1920,height:1080},cacheAssetsLoaded:cacheEntries.length,
    targets,stages:Object.fromEntries(stages),frames,limitations};
  fs.writeFileSync(path.join(out,contextualOnly?'Bank-Fit-Contextual.json':'Bank-Fit-Review.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(out,contextualOnly?'README-Contextual.md':'README.md'),'# Roadside bank-fit review\n\n'+limitations+'\n\n'+
    'The contact sheets group actual house/park sites, all curated featured variants, middle/open cards from every family on both banks, and contextual accent/satellite sources. Each row follows one fixed world address through approach, middle, near and passed-rear views. Full 1920×1080 frames retain the entire game artwork. The JSON records exact source/asset hashes, revision, selected addresses, source keys, flips and production main/rear submissions. Use the optional third argument --contextual to capture only the contextual group in a separate manifest without replacing the other groups.\n');
  console.log(JSON.stringify({out,revision,cacheAssetsLoaded:cacheEntries.length,targets:targets.length,
    frames:frames.length,mainCalls:frames.reduce((sum,frame)=>sum+frame.targetCalls.filter(c=>c.camera==='main').length,0),
    rearCalls:frames.reduce((sum,frame)=>sum+frame.targetCalls.filter(c=>c.camera==='rear').length,0)}));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
