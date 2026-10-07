'use strict';
// Focused checks use the generated production owners, without browser claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { inflateSync } = require('node:zlib');

const output = path.resolve(process.argv[2] || '');
assert(process.argv[2], 'Usage: node tools/check-standalone-build.js OUTPUT');
const read = name => fs.readFileSync(path.join(output, name), 'utf8');
const owner = JSON.parse(read('.standalone-build.json'));
assert.equal(owner.builder, 'barcode-system-override-standalone-v1');
assert.equal(owner.status, 'complete');
const manifest = JSON.parse(read('sprites-manifest.json'));
const quiet = { log() {}, warn() {}, error() {} };
const makeContext = extra => vm.createContext({ window: { BARCODE: {}, ...extra }, console: quiet });
const load = (context, name) => vm.runInContext(read(name), context, { filename: name });
const localAsset = url => {
  assert(!/^(?:https?:|\/)/.test(url), `Asset escaped the game directory: ${url}`);
  const resolved = path.resolve(output, url);
  assert(resolved.startsWith(output + path.sep), `Asset escaped output: ${url}`);
  assert(fs.existsSync(resolved) && fs.statSync(resolved).isFile(), `Missing asset: ${url}`);
  return resolved;
};

const textureRoot = 'assets/cache-road/gpu-textures/';
const textureManifestName = textureRoot + 'manifest.json';
const originalAssetCount = 624;
const originalAssetInventorySHA256 = '0b2ac58dc88ddb68b595fb8592d242d8478c426d78309fe4ff45b88c04027f56';
// These eight siblings extend the package; they never replace the sealed bank.
const macReviewRoot = 'assets/mac-street-review/';
const macReviewAssets = new Set([
  'cache-walk-to-car-v6.png', 'mac-hero-v2.png', 'mac-poses-v3-frames.json', 'mac-poses-v3.png',
  'scene03-kave-dead-air-v5.png', 'scene05-margin-note-v1.png',
  'scene06-record-straight-v1.png', 'street-panorama-v1.png'
].map(name => macReviewRoot + name));
const macCityRoot = 'assets/mac-city-review/';
const macCityAssets = new Set([
  'chitin_scuttler-v1.png', 'chitin_scuttler-v1-frames.json',
  'psion_lancer-v2.png', 'psion_lancer-v2-frames.json',
  'bile_spitter-v1.png', 'bile_spitter-v1-frames.json',
  'prism_guard-v1.png', 'prism_guard-v1-frames.json',
  'rift_stalker-v1.png', 'rift_stalker-v1-frames.json',
  'shock_mantid-v2.png', 'shock_mantid-v2-frames.json',
  'null_regent-v2.png', 'null_regent-v2-frames.json',
  'service-alley-v1.png', 'night-market-v1.png', 'transit-concourse-v1.png',
  'relay-canal-v1.png', 'rooftop-relay-v1.png', 'broadcast-plaza-v1.png',
  'mac-city-art-v1.json', 'mac-attacks-v4.png', 'mac-attacks-v4-frames.json'
].map(name => macCityRoot + name));
const macRigRoot = 'assets/mac-combat-rigs/';
const macRigActors = ['mac', 'chitin_scuttler', 'psion_lancer', 'bile_spitter', 'prism_guard', 'rift_stalker', 'shock_mantid', 'null_regent'];
const macRigStem = kind => kind === 'mac' ? 'mac-modem-v2' : kind + '-v1';
const macRigAssets = new Set(['mac-combat-art-v1.json', ...macRigActors.flatMap(kind => [macRigStem(kind) + '.png', macRigStem(kind) + '-rig.json'])].map(name => macRigRoot + name));
const macFrameRoot = 'assets/mac-combat-frames/';
const macDynamicRoot = 'assets/mac-street-dynamic/';
const macDynamicSheets = {dyn_guard:'mac-guard-two-braids-v1.png',dyn_run:'mac-run-two-braids-v1.png',
  dyn_hold:'mac-hold-carry-two-braids-v1.png',dyn_weapon:'mac-weapon-poses-two-braids-v1.png',
  dyn_pipe_swing:'mac-pipe-swing-two-braids-v1.png'};
const macDynamicImageHashes = {
  dyn_guard:'2a6ed176b8cefba33793f1d6633671322afc8555c01c725cbe8a9ca306e3ed85',
  dyn_run:'b78e958967d49d32eccb85a19594691e244e6023c34371a002099f3ec0cc4a23',
  dyn_hold:'c832b0a3cdfd58ce9c117beb9160c876b3df1d6cd4aa92cdb436e16527c916c9',
  dyn_weapon:'f4d2a4c8d5f602691fa787c08b01680ab1bc19461a035cf0789a336c4969ec93',
  dyn_pipe_swing:'a22a5f4787d339614af5c2fc51a548affe55628e057bb54cdeffbdb1e21c83af'};
const macDynamicHistoricalImages = {
  'mac-guard-v1.png':'f3410efa856aa1ea7fcedf69bd1e37f8c259af8cfb315282fc81f08b235ca0ee',
  'mac-run-v1.png':'711c9993b6d39b0ce1fbc49897f154618c9d0baafad796a4bb236b2f6d9d4378',
  'mac-hold-carry-v1.png':'e40c210ed47efb4453d7add6d42250e766715825ff3943727203667d9939861c',
  'mac-weapon-poses-v1.png':'e59a6f8716d6d5b8fc3f4789dbc96cde64c94f186d99f6b2d8640f8033e4fba3'};
const macDynamicFrames = ['guard_brace','guard_step_a','guard_step_b','guard_impact',
  'run_contact_a','run_pass_a','run_contact_b','run_pass_b','grab_reach','grab_hold','pummel_load','pummel_contact',
  'pickup_load','carry_hold','carry_step_a','carry_step_b','melee_load','melee_contact','melee_follow','fire_aim','fire_recoil','fire_ready'];
const macPipeSwingPhases = {
  windup:[{frame:'pipe_swing_load',holdMs:50},{frame:'pipe_swing_uncoil',holdMs:50}],
  active:[{frame:'pipe_swing_contact',holdMs:95}],
  recovery:[{frame:'pipe_swing_through',holdMs:50},{frame:'pipe_swing_finish',holdMs:70},{frame:'pipe_swing_recover',holdMs:50}]};
const macPipeSwingFrames = new Set(Object.values(macPipeSwingPhases).flat().map(entry=>entry.frame));
const heldWeaponKinds = ['pipe','crowbar','shock-baton','energy-blade','gravity-hammer','scatter-blaster','coil-rifle','plasma-disc'];
function checkNativePolygons(polygons, rect) {
  assert(Array.isArray(polygons), 'Native overlap regions must be polygon arrays');
  for (const polygon of polygons) {
    assert(Array.isArray(polygon) && polygon.length >= 3, 'Native overlap polygon needs an area');
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const point = polygon[i], next = polygon[(i + 1) % polygon.length];
      assert(Number.isFinite(point?.x) && Number.isFinite(point?.y) &&
        point.x >= 0 && point.y >= 0 && point.x <= rect.width && point.y <= rect.height,
        'Native overlap polygon escapes its complete source crop');
      area += point.x * next.y - next.x * point.y;
    }
    assert(Math.abs(area) > .01, 'Native overlap polygon has no area');
  }
}
function checkItemBindings(entry, rect) {
  assert.deepEqual(Object.keys(entry.itemBindings || {}).sort(), [...heldWeaponKinds].sort(),
    'Each equipped character cel must register all eight weapons');
  const power = JSON.parse(read('assets/mac-street-power/mac-street-power-v1.json'));
  for (const [kind, binding] of Object.entries(entry.itemBindings)) {
    assert(Number.isFinite(binding.gripAnchor?.x) && Number.isFinite(binding.gripAnchor?.y) &&
      binding.gripAnchor.x >= 0 && binding.gripAnchor.x <= rect.width &&
      binding.gripAnchor.y >= 0 && binding.gripAnchor.y <= rect.height, 'Invalid native weapon grip');
    assert(Number.isFinite(binding.weaponAngle) && Math.abs(binding.weaponAngle) <= Math.PI);
    assert(['front','behind'].includes(binding.itemLayer), 'Invalid held item layer');
    checkNativePolygons(binding.handOcclusion, rect);
    if (Object.hasOwn(binding, 'itemFrontRegions')) checkNativePolygons(binding.itemFrontRegions, power.cells['weapon_' + kind].source);
  }
}
function supplementalFrameFiles(actor, baseRegistration) {
  const name = macDynamicRoot + 'mac-modem-actions-v1.json', selection = actor.supplemental;
  assert.equal(selection?.registration, name, 'Only the selected Mac supplemental registration enters the game');
  const bytes = fs.readFileSync(localFile(name)), registration = JSON.parse(bytes);
  assert.equal(createPowerHash(bytes), selection.registrationSHA256, 'Supplemental registration changed');
  assert.equal(owner.files[name].sha256, selection.registrationSHA256);
  assert.equal(registration.baseRegistration, actor.registration);
  assert.equal(registration.baseRegistrationSHA256, actor.registrationSHA256, 'Supplemental poses must preserve the accepted base');
  assert.equal(registration.actor, 'mac'); assert.equal(registration.schemaVersion, 1); assert.equal(registration.facing, 'right');
  assert.equal(registration.sheets.length, 5);
  assert.deepEqual(registration.sheets.map(sheet => sheet.id).sort(), Object.keys(macDynamicSheets).sort());
  assert.equal(registration.frames.length, 28);
  assert.deepEqual(registration.frames.map(frame => frame.id).sort(), [...macDynamicFrames,...macPipeSwingFrames].sort());
  // Validate the actual packaged loader and registrations, never source-tree substitutes.
  const context = makeContext(); load(context, 'src/game/mac-combat-frames.js');
  const frames = context.window.BARCODE.MacCombatFrames;
  const compiled = frames.compileSupplemental(registration, {baseCompiled:frames.compile(baseRegistration,{complete:true}),complete:true});
  for (const frame of registration.frames) {
    if(macPipeSwingFrames.has(frame.id)) {
      assert.equal(frame.sheet,'dyn_pipe_swing');assert.equal(frame.embeddedWeapon,'pipe');
      for(const key of ['gripAnchor','weaponAngle','itemBindings','handOcclusion'])
        assert(!Object.hasOwn(frame,key),'Complete embedded pipe cels must not attach a second item');
    } else {
      assert.notEqual(frame.sheet,'dyn_pipe_swing');assert(!Object.hasOwn(frame,'embeddedWeapon'));
      checkItemBindings(frame, frame.source);
    }
  }
  const pipeClips=new Set(Object.keys(macPipeSwingPhases).map(phase=>'pipe-swing.'+phase));
  for(const [key,clip]of Object.entries(registration.clips))for(const entry of clip.frames)
    assert.equal(macPipeSwingFrames.has(entry.frame),pipeClips.has(key),
      'Embedded pipe cels may only belong to their committed pipe phases');
  for(const [phase,sequence]of Object.entries(macPipeSwingPhases))
    assert.deepEqual(registration.clips['pipe-swing.'+phase],{loop:false,frames:sequence},
      'Pipe swing must preserve its exact six-cel phase order and bounded holds');
  const baseFrames = new Map(baseRegistration.frames.map(frame => [frame.id, frame]));
  for (const [frame, entry] of Object.entries(registration.baseGripAnchors)) checkItemBindings(entry, baseFrames.get(frame).source);
  const selected = new Set([name]);
  for (const sheet of registration.sheets) {
    assert.equal(sheet.sourceImage, macDynamicRoot + macDynamicSheets[sheet.id]);
    assert.equal(sheet.sourceSHA256,macDynamicImageHashes[sheet.id],
      'Selected supplemental PNG differs from the pinned native candidate');
    const data = fs.readFileSync(localFile(sheet.sourceImage)), hash = createPowerHash(data);
    assert.equal(hash, sheet.sourceSHA256); assert.equal(owner.files[sheet.sourceImage].sha256, hash);
    const image = nativeRigRGBA(data, sheet.sourceImage);
    assert.deepEqual(sheet.dimensions, {width:image.width,height:image.height});
    selected.add(sheet.sourceImage);
    for (const frame of Object.values(compiled.frames).filter(frame => frame.sheet === sheet.id)) {
      const r = frame.source; let visible = 0, clear = 0, clipped = false;
      for (let y=0;y<r.height;y++) for (let x=0;x<r.width;x++) {
        const alpha = image.pixels[((r.y+y)*image.width+r.x+x)*4+3];
        if(alpha>8) {visible++;clipped ||= x===0||y===0||x===r.width-1||y===r.height-1;}
        else clear++;
      }
      assert(visible>0&&clear>0,'Supplemental cel must retain complete native ink and transparency: '+frame.id);
      assert(!clipped,'Supplemental body ink clipped: '+frame.id);
    }
  }
  assert.equal(selected.size, 6);
  // Keep the four historical source sheets byte-identical while selecting only the replacements.
  for(const [filename,digest]of Object.entries(macDynamicHistoricalImages)) {
    const imageName=macDynamicRoot+filename,data=fs.readFileSync(localFile(imageName));
    assert.equal(createPowerHash(data),digest,'Historical supplemental source PNG changed');
    assert.equal(owner.files[imageName]?.sha256,digest);selected.add(imageName);
  }
  assert.equal(selected.size,10);
  return selected;
}
function combatFrameFiles() {
  const bankName = macFrameRoot + 'mac-combat-frames-v1.json', bank = JSON.parse(read(bankName));
  assert.equal(bank.schemaVersion, 1);
  assert.deepEqual(bank.actors.map(actor => actor.kind).sort(), [...macRigActors].sort());
  const selected = new Set([bankName]);
  for (const actor of bank.actors) {
    const registrationName = macFrameRoot + actor.kind + '-frames-v1.json';
    assert.equal(actor.registration, registrationName);
    selected.add(registrationName);
    const bytes = fs.readFileSync(localAsset(registrationName));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), actor.registrationSHA256);
    const registration = JSON.parse(bytes);
    assert.equal(registration.actor, actor.kind); assert.equal(registration.schemaVersion, 1);
    assert.equal(registration.facing, 'right');
    for (const sheet of registration.sheets) {
      assert.match(sheet.sourceImage, /^assets\/mac-combat-frames\/[a-z0-9_-]+-v[0-9]+\.png$/);
      selected.add(sheet.sourceImage);
      assert.equal(owner.files[sheet.sourceImage]?.sha256, sheet.sourceSHA256);
    }
    if(actor.kind==='mac') for(const name of supplementalFrameFiles(actor,registration)) selected.add(name);
    else assert(!Object.hasOwn(actor,'supplemental'),'Only Mac has selected supplemental poses');
  }
  assert.deepEqual([...bank.files].sort(), [...selected].sort(), 'Only selected native cels and registrations belong to the bank');
  assert.deepEqual(Object.keys(owner.files).filter(name => name.startsWith(macFrameRoot)||name.startsWith(macDynamicRoot)).sort(), [...selected].sort());
  return selected;
}
const createPowerHash = data => crypto.createHash('sha256').update(data).digest('hex');
const macPowerRoot = 'assets/mac-street-power/';
const macPowerSheets = {props:'street-props-v1.png',blood:'street-blood-v1.png',equipment:'street-weapons-v1.png',
  cars:'street-cars-side-v2.png',fixtures:'street-fixtures-v1.png',cores:'street-powerups-v1.png'};
const macPowerCells = ['crate_intact','crate_cracked','crate_broken','stall_intact','stall_cracked','stall_broken','relay_off','relay_on','pickup_health',
  ...['red','green','purple'].flatMap(color => ['impact','heavy','floor'].map(kind => 'blood_' + color + '_' + kind)),
  ...['pipe','crowbar','shock-baton','energy-blade','gravity-hammer','scatter-blaster','coil-rifle','plasma-disc'].map(kind=>'weapon_'+kind),
  ...['car','car_van','barrel','fixture_streetlight','fixture_terminal'].flatMap(kind=>['intact','cracked','broken'].map(state=>kind+'_'+state)),
  'pickup_overdrive','pickup_barrier','pickup_impact','projectile_scatter-bolt','projectile_coil-bolt','projectile_plasma-disc'];
function powerArtFiles(bytes, files) {
  const name = macPowerRoot + 'mac-street-power-v1.json', bank = JSON.parse(bytes(name));
  assert.equal(bank.schema, 1);
  assert.deepEqual(Object.keys(bank.cells).sort(), [...macPowerCells].sort());
  assert.equal(bank.sheets.length, 6);
  assert.deepEqual(bank.sheets.map(sheet=>sheet.id).sort(),Object.keys(macPowerSheets).sort());
  const selected = new Set([name]), sheets = new Map(), crops = [];
  for (const sheet of bank.sheets) {
    assert.equal(sheet.sourceImage, macPowerRoot + macPowerSheets[sheet.id]);
    const data = bytes(sheet.sourceImage), hash = createPowerHash(data);
    assert.equal(hash, sheet.sourceSHA256); assert.equal(files[sheet.sourceImage]?.sha256, hash);
    const image = nativeRigRGBA(data, sheet.sourceImage);
    assert.deepEqual(sheet.dimensions, {width: image.width, height: image.height});
    sheets.set(sheet.id, image); selected.add(sheet.sourceImage);
  }
  assert.equal(selected.size, 7);
  for (const [id, cell] of Object.entries(bank.cells)) {
    const image = sheets.get(cell.sheet), r = cell.source; assert(image, 'Unknown power atlas: ' + id);
    for (const key of ['x','y','width','height']) assert(Number.isSafeInteger(r[key]) && r[key] >= (['width','height'].includes(key) ? 1 : 0));
    assert(r.x+r.width<=image.width && r.y+r.height<=image.height, 'Native power crop escapes atlas: '+id);
    assert(Number.isFinite(cell.pivot.x) && cell.pivot.x>=0 && cell.pivot.x<=r.width);
    assert(Number.isFinite(cell.pivot.y) && cell.pivot.y>=0 && cell.pivot.y<=r.height);
    // The enlarged 550-world streetlight retains its native clear crop padding.
    assert(Number.isFinite(cell.displayHeight) && cell.displayHeight>0 && cell.displayHeight<=(id.startsWith('fixture_streetlight_')?580:500));
    for(const key of ['grip','muzzle']) if(Object.hasOwn(cell,key)) {
      assert(Number.isFinite(cell[key]?.x)&&cell[key].x>=0&&cell[key].x<=r.width,'Invalid native weapon '+key+': '+id);
      assert(Number.isFinite(cell[key]?.y)&&cell[key].y>=0&&cell[key].y<=r.height,'Invalid native weapon '+key+': '+id);
    }
    if (Object.hasOwn(cell, 'itemFrontRegions')) checkNativePolygons(cell.itemFrontRegions, r);
    let visible=0, clear=0, clipped=false;
    for(let y=0;y<r.height;y++) for(let x=0;x<r.width;x++) {
      const alpha=image.pixels[((r.y+y)*image.width+r.x+x)*4+3];
      if(alpha>8) { visible++; clipped ||= x===0||y===0||x===r.width-1||y===r.height-1; }
      else clear++;
    }
    assert(visible>0 && clear>0,'Power cell must retain native drawn ink and transparency: '+id);
    assert(!clipped,'Visible power ink clipped: '+id);
    for(const old of crops) assert(old.sheet!==cell.sheet ||
      Math.min(r.x+r.width,old.source.x+old.source.width)<=Math.max(r.x,old.source.x) ||
      Math.min(r.y+r.height,old.source.y+old.source.height)<=Math.max(r.y,old.source.y),'Power crops overlap: '+id);
    crops.push(cell);
  }
  const historicalCar = macPowerRoot + 'street-cars-v1.png';
  assert.equal(createPowerHash(bytes(historicalCar)), '8a4bb7d98147fdf88b7cafe39ba268af7b557e601abad24015b3922a4b6d7224',
    'Historical car PNG must remain unchanged');
  selected.add(historicalCar);
  assert.deepEqual(Object.keys(files).filter(name=>name.startsWith(macPowerRoot)).sort(),[...selected].sort());
  return selected;
}
const encoderCommit = '4d6fc70eaf62ad0558e63e8d97eb9766118327a6';
const transcoderCommit = '9bebe16726b3a61c8c213eeee3b7cffb462ef34e';
function textureManifest() {
  const value = JSON.parse(read(textureManifestName));
  assert.equal(value.version, 1);
  assert.equal(value.encoderCommit, encoderCommit);
  assert.equal(value.transcoderCommit, transcoderCommit);
  assert.equal(value.alphaMode, "premultiplied-alpha");
  assert.equal(value.colorSpace, "unorm");
  assert.equal(value.sourceCount, 171);
  assert.equal(value.compressedCount, 149);
  assert.equal(value.originalCount, 22);
  assert(value.entries && typeof value.entries === "object" && !Array.isArray(value.entries));
  assert.equal(Object.keys(value.entries).length, 171, "The complete road texture bank must contain 171 originals");
  return value;
}

function derivativeNames(value = textureManifest()) {
  const names = [textureManifestName];
  for (const [key, entry] of Object.entries(value.entries)) {
    assert.match(key, /^[A-Za-z0-9_.-]+$/);
    assert(["compressed", "original"].includes(entry.kind), `Invalid texture ownership kind: ${key}`);
    if (entry.kind === "compressed") {
      assert.equal(entry.path, textureRoot + key + ".ktx2", "Derivative path must match its original PA key");
      names.push(entry.path);
    } else assert.equal(entry.path, entry.originalPath, "Original SVG textures must retain their canonical file");
  }
  assert.equal(names.length, 150, "Only 149 KTX2 derivatives and their manifest may be added");
  assert.equal(Object.values(value.entries).filter((entry) => entry.kind === "original").length, 22);
  assert.equal(new Set(names).size, names.length, "Texture derivatives must have unique ownership");
  return new Set(names);
}

function localFile(name, files = owner.files) {
  assert.equal(typeof name, "string", "Bundle path must be a string");
  assert(name.length > 0 && !/[\\:#?\u0000]/.test(name), `Unsafe bundle path: ${name}`);
  const relative = name.replace(/^\.\//, "");
  assert(!path.posix.isAbsolute(relative) && !relative.split("/").includes(".."),
    `Bundle path escapes the game directory: ${name}`);
  assert.equal(path.posix.normalize(relative), relative, `Noncanonical bundle path: ${name}`);
  assert(Object.hasOwn(files, relative), `Path is absent from the public hash manifest: ${name}`);
  const resolved = path.resolve(output, relative);
  assert(resolved.startsWith(output + path.sep), `Bundle path escapes the game directory: ${name}`);
  assert(fs.lstatSync(resolved).isFile(), `Missing local bundle file: ${name}`);
  return resolved;
}

function header(file, size) {
  const fd = fs.openSync(file, "r");
  try {
    const data = Buffer.alloc(Math.min(size, fs.fstatSync(fd).size));
    assert.equal(fs.readSync(fd, data, 0, data.length, 0), data.length);
    return data;
  } finally { fs.closeSync(fd); }
}

function originalDimensions(file) {
  const data = header(file, 65536);
  if (path.extname(file) === ".svg") {
    const svg = data.toString("utf8").match(/<svg\b([^>]*)>/i);
    assert(svg, "An original SVG must contain its authored viewport");
    const width = svg[1].match(/\bwidth=["']([0-9.]+)(?:px)?["']/i);
    const height = svg[1].match(/\bheight=["']([0-9.]+)(?:px)?["']/i);
    if (width && height) return [Number(width[1]), Number(height[1])];
    const box = svg[1].match(/\bviewBox=["']([^"']+)["']/i);
    assert(box, "An original SVG must declare dimensions or viewBox");
    const dimensions = box[1].trim().split(/[\s,]+/).map(Number);
    assert.equal(dimensions.length, 4);
    assert(dimensions.every(Number.isFinite));
    return dimensions.slice(2);
  }
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    assert.equal(data.toString("ascii", 12, 16), "IHDR");
    return [data.readUInt32BE(16), data.readUInt32BE(20)];
  }
  if (data.toString("ascii", 0, 4) === "RIFF" && data.toString("ascii", 8, 12) === "WEBP") {
    for (let offset = 12; offset + 8 <= data.length;) {
      const kind = data.toString("ascii", offset, offset + 4), size = data.readUInt32LE(offset + 4), start = offset + 8;
      if (kind === "VP8X") return [1 + data.readUIntLE(start + 4, 3), 1 + data.readUIntLE(start + 7, 3)];
      if (kind === "VP8L") {
        assert.equal(data[start], 0x2f);
        const bits = data.readUInt32LE(start + 1);
        return [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
      }
      if (kind === "VP8 ") {
        assert(data.subarray(start + 3, start + 6).equals(Buffer.from([0x9d, 0x01, 0x2a])));
        return [data.readUInt16LE(start + 6) & 0x3fff, data.readUInt16LE(start + 8) & 0x3fff];
      }
      offset = start + size + (size & 1);
    }
  }
  assert.fail(`The original texture dimension header is unsupported: ${path.basename(file)}`);
}

function nativeRigRGBA(data, name) {
  assert(data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Native rig PNG required: ${name}`);
  let width = 0, height = 0;
  const chunks = [];
  for (let offset = 8; offset + 12 <= data.length;) {
    const length = data.readUInt32BE(offset), kind = data.toString('ascii', offset + 4, offset + 8), start = offset + 8;
    assert(start + length + 4 <= data.length, `Truncated PNG chunk: ${name}`);
    if (kind === 'IHDR') {
      assert.equal(length, 13);
      width = data.readUInt32BE(start); height = data.readUInt32BE(start + 4);
      assert(width > 0 && height > 0);
      assert(data.subarray(start + 8, start + 13).equals(Buffer.from([8, 6, 0, 0, 0])), `Rig must retain native noninterlaced RGBA8: ${name}`);
    }
    if (kind === 'IDAT') chunks.push(data.subarray(start, start + length));
    offset = start + length + 4;
    if (kind === 'IEND') break;
  }
  assert(width && height && chunks.length, `Incomplete PNG: ${name}`);
  const stride = width * 4, expected = (stride + 1) * height;
  const raw = inflateSync(Buffer.concat(chunks), { maxOutputLength: expected });
  assert.equal(raw.length, expected, `RGBA scanline size: ${name}`);
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1), target = y * stride, mode = raw[row];
    assert(mode >= 0 && mode <= 4, `PNG filter: ${name}`);
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? pixels[target + x - 4] : 0;
      const b = y ? pixels[target + x - stride] : 0;
      const c = y && x >= 4 ? pixels[target + x - stride - 4] : 0;
      let predictor = 0;
      if (mode === 1) predictor = a;
      if (mode === 2) predictor = b;
      if (mode === 3) predictor = Math.floor((a + b) / 2);
      if (mode === 4) {
        const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      pixels[target + x] = (raw[row + 1 + x] + predictor) & 255;
    }
  }
  assert(pixels.some((value, index) => index % 4 === 3 && value < 255), `Native transparency lost: ${name}`);
  return { width, height, pixels };
}

function verifyArticulatedBank(bytes, files, root, actors, assets, digest) {
  assert.equal(assets.size, 17);
  assert.deepEqual(Object.keys(files).filter((name) => name.startsWith(root)).sort(), [...assets].sort(), 'Complete selected rig directory required');
  const bank = JSON.parse(bytes(root + 'mac-combat-art-v1.json').toString('utf8'));
  assert.equal(bank.schemaVersion, 1);
  assert.deepEqual([...bank.files].sort(), [...assets].sort(), 'Manifest must declare exactly 17 selected siblings');
  assert.equal(bank.actors.length, 8);
  assert.deepEqual(bank.actors.map((actor) => actor.kind).sort(), [...actors].sort(), 'Mac plus the exact seven alien roles required');
  const colors = { mac: 'red', chitin_scuttler: 'green', psion_lancer: 'purple', bile_spitter: 'green', prism_guard: 'purple', rift_stalker: 'purple', shock_mantid: 'green', null_regent: 'purple' };
  const bloodHex = { red: '#f04455', green: '#78ea68', purple: '#b374ed' };
  const base = ['head', 'torso', 'pelvis', ...['rear', 'front'].flatMap((side) => ['upper_arm', 'forearm', 'fist', 'thigh', 'shin', 'shoe'].map((part) => side + '_' + part))];
  const chains = {};
  for (const side of ['rear', 'front']) for (const [part, a, b] of [['upper_arm', 'shoulder', 'elbow'], ['forearm', 'elbow', 'wrist'], ['thigh', 'hip', 'knee'], ['shin', 'knee', 'ankle']]) chains[side + '_' + part] = [side + '_' + a, side + '_' + b];
  for (const side of ['a', 'b']) {
    chains['extra_upper_arm_' + side] = ['extra_shoulder_' + side, 'extra_elbow_' + side];
    chains['extra_forearm_' + side] = ['extra_elbow_' + side, 'extra_wrist_' + side];
  }
  const point = (value) => value && Number.isFinite(value.x) && Number.isFinite(value.y);
  const close = (a, b, label) => assert(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= 0.001, `Measured rig geometry differs: ${label}`);
  const registrations = [];
  for (const actor of bank.actors) {
    const kind = actor.kind, stem = kind === 'mac' ? 'mac-modem-v2' : kind + '-v1';
    const image = root + stem + '.png', rigName = root + stem + '-rig.json';
    assert.equal(actor.image, image); assert.equal(actor.rig, rigName);
    const imageBytes = bytes(image), rigBytes = bytes(rigName);
    assert.equal(actor.imageSHA256, digest(imageBytes)); assert.equal(actor.imageSHA256, files[image].sha256);
    assert.equal(actor.rigSHA256, digest(rigBytes)); assert.equal(actor.rigSHA256, files[rigName].sha256);
    assert.equal(actor.bloodColor, colors[kind]); assert.equal(actor.bloodHex, bloodHex[colors[kind]], 'Selected palette must match actual combat damage colors');
    assert.equal(typeof actor.displayName, 'string'); assert(actor.displayName.trim());
    const native = nativeRigRGBA(imageBytes, image), rig = JSON.parse(rigBytes.toString('utf8'));
    assert.equal(rig.schemaVersion, 1); assert.equal(rig.actor, kind); assert.equal(rig.sourceImage, image);
    assert.equal(rig.sourceSHA256, digest(imageBytes)); assert.deepEqual(rig.sourceDimensions, {width: native.width, height: native.height});
    assert.equal(rig.facing, 'right'); assert.equal(rig.commonScale, 1); assert.deepEqual(rig.groundOrigin, {x: 0, y: 0});
    const expectedParts = [...base, ...(kind === 'null_regent' ? ['a', 'b'].flatMap((side) => ['upper_arm', 'forearm', 'fist'].map((part) => 'extra_' + part + '_' + side)) : [])];
    assert.equal(rig.parts.length, expectedParts.length);
    assert.deepEqual(rig.parts.map((part) => part.id).sort(), expectedParts.sort(), 'Exact 15/21 anatomical pieces required');
    const parts = Object.fromEntries(rig.parts.map((part) => [part.id, part])), rest = rig.restSkeleton;
    assert(rest && Object.values(rest).every(point));
    const assembled = {left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity};
    for (const part of rig.parts) {
      const label = kind + '/' + part.id, crop = part.source, visible = part.visibleBounds;
      for (const rect of [crop, visible]) for (const key of ['x', 'y', 'width', 'height']) assert(Number.isSafeInteger(rect[key]) && rect[key] >= (['width', 'height'].includes(key) ? 1 : 0), `Measured bounds: ${label}`);
      assert(crop.x + crop.width <= native.width && crop.y + crop.height <= native.height, `Crop escapes bitmap: ${label}`);
      let left = crop.width, top = crop.height, right = -1, bottom = -1;
      const alpha = (x, y) => native.pixels[((crop.y + y) * native.width + crop.x + x) * 4 + 3];
      for (let y = 0; y < crop.height; y++) for (let x = 0; x < crop.width; x++) if (alpha(x, y) > 8) {
        left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
      assert(right >= left && bottom >= top, `Empty anatomical piece: ${label}`);
      assert.deepEqual(visible, {x: left, y: top, width: right - left + 1, height: bottom - top + 1}, `Bounds must match actual native alpha>8: ${label}`);
      const caps = [part.pivot, ...Object.values(part.anchors || {}), ...(chains[part.id] ? [part.distal] : [])];
      for (const cap of caps) {
        assert(point(cap) && Number.isSafeInteger(cap.x) && Number.isSafeInteger(cap.y) && cap.x >= 0 && cap.y >= 0 && cap.x < crop.width && cap.y < crop.height, `Native joint cap: ${label}`);
        assert(alpha(cap.x, cap.y) > 8, `Joint cap outside actual opaque piece: ${label}`);
      }
      assert.equal(part.restScale ?? 1, 1, `Per-piece scaling stretches anatomy: ${label}`);
      if (chains[part.id]) {
        const length = Math.hypot(part.distal.x - part.pivot.x, part.distal.y - part.pivot.y);
        assert(Number.isFinite(part.boneLength) && part.boneLength > 0);
        close(part.boneLength, length, label + '/source length');
        const [a, b] = chains[part.id]; assert(point(rest[a]) && point(rest[b]), `Missing rest bone joints: ${label}`);
        close(Math.hypot(rest[b].x - rest[a].x, rest[b].y - rest[a].y), length, label + '/rest length');
      }
      let angle = 0, origin;
      if (chains[part.id]) {
        const [a, b] = chains[part.id]; origin = rest[a];
        angle = Math.atan2(rest[b].y - origin.y, rest[b].x - origin.x) - Math.atan2(part.distal.y - part.pivot.y, part.distal.x - part.pivot.x);
      } else {
        const joint = part.id === 'head' ? 'neck' : ['torso', 'pelvis'].includes(part.id) ? 'waist' : part.id.startsWith('extra_fist_') ? 'extra_wrist_' + part.id.at(-1) : part.id.split('_')[0] + (part.id.endsWith('_fist') ? '_wrist' : '_ankle');
        assert(point(rest[joint]), `Missing neutral attachment joint: ${label}`); origin = rest[joint];
      }
      const c = Math.cos(angle), s = Math.sin(angle);
      const xMin = Math.min(0, c) + Math.min(0, -s), xMax = Math.max(0, c) + Math.max(0, -s);
      const yMin = Math.min(0, s) + Math.min(0, c), yMax = Math.max(0, s) + Math.max(0, c);
      for (let y = 0; y < crop.height; y++) for (let x = 0; x < crop.width; x++) if (alpha(x, y) > 8) {
        const dx = x - part.pivot.x, dy = y - part.pivot.y, tx = origin.x + dx * c - dy * s, ty = origin.y + dx * s + dy * c;
        assembled.left = Math.min(assembled.left, tx + xMin); assembled.right = Math.max(assembled.right, tx + xMax);
        assembled.top = Math.min(assembled.top, ty + yMin); assembled.bottom = Math.max(assembled.bottom, ty + yMax);
      }
    }
    for (let i = 0; i < rig.parts.length; i++) for (let j = i + 1; j < rig.parts.length; j++) {
      const a = rig.parts[i].source, b = rig.parts[j].source;
      assert(Math.min(a.x + a.width, b.x + b.width) <= Math.max(a.x, b.x) || Math.min(a.y + a.height, b.y + b.height) <= Math.max(a.y, b.y), `Anatomical crops overlap: ${kind}`);
    }
    assert(new Set(rig.parts.map((part) => part.source.width + '/' + part.source.height)).size > 1, 'Measured pieces cannot become equal atlas cells');
    for (const [id, required] of [['torso', ['neck', 'waist', 'rear_shoulder', 'front_shoulder', ...(kind === 'null_regent' ? ['extra_shoulder_a', 'extra_shoulder_b'] : [])]], ['pelvis', ['waist', 'rear_hip', 'front_hip']]]) {
      const part = parts[id]; assert.deepEqual(Object.keys(part.anchors || {}).sort(), required.sort()); assert(point(rest.waist));
      for (const [joint, cap] of Object.entries(part.anchors)) {
        assert(point(rest[joint]));
        for (const key of ['x', 'y']) close(rest[joint][key], rest.waist[key] + cap[key] - part.pivot[key], kind + '/' + joint);
      }
    }
    for (const [a, b] of [['hip', 'waist'], ['head', 'neck'], ['rear_fist', 'rear_wrist'], ['front_fist', 'front_wrist']]) {
      assert(point(rest[a]) && point(rest[b])); for (const key of ['x', 'y']) close(rest[a][key], rest[b][key], kind + '/' + a);
    }
    for (const side of ['rear', 'front']) {
      const shoe = parts[side + '_shoe']; assert.deepEqual(Object.keys(shoe.anchors || {}), ['ground_contact']);
      const ankle = rest[side + '_ankle'], foot = rest[side + '_foot_contact']; assert(point(ankle) && point(foot));
      for (const key of ['x', 'y']) close(foot[key], ankle[key] + shoe.anchors.ground_contact[key] - shoe.pivot[key], kind + '/' + side + ' foot');
      close(foot.y, 0, kind + '/planted floor');
    }
    const bounds = rig.restVisibleBounds;
    assert(bounds && ['left', 'top', 'right', 'bottom'].every((key) => Number.isFinite(bounds[key])) && bounds.right > bounds.left && bounds.bottom > bounds.top);
    close(rig.pixelScale.standingVisibleHeight, bounds.bottom - bounds.top, kind + '/native standing height');
    for (const key of ['left', 'top', 'right', 'bottom']) close(bounds[key], assembled[key], kind + '/transformed native alpha ' + key);
    close(rig.pixelScale.standingVisibleHeight, assembled.bottom - assembled.top, kind + '/actual native standing height');
    registrations.push({kind, pieces: rig.parts.length, nativePNG_SHA256: digest(imageBytes), decodedRGBA_SHA256: digest(native.pixels), rigSHA256: digest(rigBytes), restNativeAlphaExtent: Object.fromEntries(Object.entries(assembled).map(([key, value]) => [key, Math.round(value * 1e6) / 1e6]))});
  }
  return {selectedActors: 8, assetCount: 17, nativeAlphaThreshold: 8, registrations, runtimeAcceptance: 'not established by packaging'};
}

function safeUInt64(data, offset) {
  const value = data.readBigUInt64LE(offset);
  assert(value <= BigInt(Number.MAX_SAFE_INTEGER), "KTX2 range exceeds safe integer bounds");
  return Number(value);
}

function checkMacReviewAssets(scripts, index) {
  const files = owner.files;
  assert.deepEqual(Object.keys(files).filter(name => name.startsWith(macReviewRoot)).sort(), [...macReviewAssets].sort(),
    'Mac review must contain the exact eight registered siblings, with no extra photos or review files');
  assert.equal(macCityAssets.size, 23);
  assert.deepEqual(Object.keys(files).filter(name => name.startsWith(macCityRoot)).sort(), [...macCityAssets].sort(),
    'Mac city must contain exactly its 23 registered siblings, with no extra photos or generation receipts');
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const dimensions = {};
  for (const name of macReviewAssets) {
    const file = localFile(name);
    if (!name.endsWith('.png')) continue;
    assert(header(file, 8).equals(pngSignature), 'Mac art must retain native PNG bytes: ' + name);
    dimensions[name] = originalDimensions(file);
    assert(dimensions[name].every(value => Number.isSafeInteger(value) && value > 0), 'Invalid native Mac image dimensions');
  }
  for (const name of macCityAssets) {
    const file = localFile(name);
    if (name.endsWith('.png')) {
      assert(header(file, 8).equals(pngSignature), 'Mac city art must retain native PNG bytes: ' + name);
      dimensions[name] = originalDimensions(file);
      assert(dimensions[name].every(value => Number.isSafeInteger(value) && value > 0), 'Invalid native city image dimensions');
    } else JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  const imageName = macReviewRoot + 'mac-poses-v3.png', sheet = JSON.parse(read(macReviewRoot + 'mac-poses-v3-frames.json'));
  assert.equal(sheet.schemaVersion, 1); assert.equal(sheet.sourceImage, imageName); assert.equal(sheet.facing, 'right');
  assert.deepEqual([sheet.dimensions.width, sheet.dimensions.height], dimensions[imageName], 'Pose registration must describe the actual unchanged image');
  const pngHeader = header(localFile(imageName), 26);
  assert.equal(pngHeader[24], 8); assert.equal(pngHeader[25], 6, 'Mac pose sheet requires its original RGBA transparency');
  assert.deepEqual(sheet.frames.map(frame => frame.id), ['idle', 'walk_left', 'walk_right', 'punch', 'guard', 'jump']);
  assert.equal(sheet.pixelScale.standingVisibleHeight, sheet.frames[0].visibleBounds.height, 'One shared scale derives from visible standing height');
  for (const frame of sheet.frames) {
    const crop = frame.source, visible = frame.visibleBounds, pivot = frame.pivot;
    for (const rect of [crop, visible]) {
      assert(Number.isSafeInteger(rect.x) && rect.x >= 0 && Number.isSafeInteger(rect.y) && rect.y >= 0);
      assert(Number.isSafeInteger(rect.width) && rect.width > 0 && Number.isSafeInteger(rect.height) && rect.height > 0);
    }
    assert(crop.x + crop.width <= sheet.dimensions.width && crop.y + crop.height <= sheet.dimensions.height, 'Registered crop escapes image: ' + frame.id);
    assert(visible.x + visible.width <= crop.width && visible.y + visible.height <= crop.height, 'Visible silhouette escapes its crop: ' + frame.id);
    assert(Number.isFinite(pivot.x) && Number.isFinite(pivot.y) && pivot.x >= visible.x && pivot.x <= visible.x + visible.width);
    assert.equal(pivot.y, visible.y + visible.height, 'Feet must anchor the measured lowest shoe: ' + frame.id);
  }
  for (let i = 0; i < sheet.frames.length; i++) for (let j = i + 1; j < sheet.frames.length; j++) {
    const a = sheet.frames[i].source, b = sheet.frames[j].source;
    assert(Math.min(a.x + a.width, b.x + b.width) <= Math.max(a.x, b.x) ||
      Math.min(a.y + a.height, b.y + b.height) <= Math.max(a.y, b.y), 'Registered pose crops overlap');
  }
  assert(new Set(sheet.frames.map(frame => frame.source.width)).size > 1, 'Measured nonuniform crops must not become equal atlas cells');
  const macScripts = ['src/game/mac-street-combat.js', 'src/game/mac-street-story.js', 'src/game/mac-combat-frames.js', 'src/game/mac-combat-preview.js'];
  assert(!scripts.includes('src/game/mac-combat-animation.js'), 'Rejected articulated renderer must not launch');
  for (const name of macScripts) { assert.equal(scripts.filter(script => script === name).length, 1, 'One Mac script owner: ' + name); localFile(name); }
  assert(macScripts.slice(0, 3).every(name => scripts.indexOf(name) < scripts.indexOf(macScripts[3])), 'Both factories and the animation owner must precede the preview wrapper');
  assert(scripts.indexOf('src/core/runtime-lifecycle.js') < scripts.indexOf(macScripts[3]), 'Mac preview must retain the shared lifecycle owner');
  const sandbox = makeContext({ location: { search: '' } }); sandbox.URLSearchParams = URLSearchParams;
  let registrations = 0; sandbox.window.BARCODE.Campaign = {register() { registrations++; }};
  for (const name of macScripts) load(sandbox, name);
  const preview = sandbox.window.BARCODE.MacCombatPreview;
  assert.equal(registrations, 0, 'Private preview must not register or replace a campaign chapter');
  assert.equal(preview.active, false); assert.equal(preview.requested(), false, 'Ordinary title must remain the normal campaign');
  for (const [query, expected] of [['?preview=mac-firstslice', true], ['?preview=other', false], ['?mac-firstslice=1', false]]) {
    sandbox.window.location.search = query; assert.equal(preview.requested(), expected, 'Exact private query gate: ' + query);
  }
  assert.match(index, /MacCombatPreview\?\.requested\?\.\(\)/, 'The real title must read the private query gate');
  assert.match(index, /privatePreview:\s*['"]mac-firstslice['"]/, 'The private title route must enter through RuntimeLifecycle');
  return {registeredSiblingAssets: macReviewAssets.size, macCityAssetCount: macCityAssets.size, nativePngDimensions: dimensions, registeredPoseCrops: 6, privateQueryGate: true, noCampaignRegistration: true};
}

function rgbaMipBytes(width, height) {
  let bytes = 0;
  for (;;) {
    bytes += width * height * 4;
    if (width === 1 && height === 1) return bytes;
    width = Math.max(1, width >> 1); height = Math.max(1, height >> 1);
  }
}

async function checkRoadTextureBank() {
  const files = owner.files, bank = textureManifest();
  const derivatives = derivativeNames(bank);
  const signature = Buffer.from([0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a]);
  let compressedBytes = 0, residentMipBytes = 0, svgMipBytes = 0, originalMipBytes = 0;
  for (const [key, entry] of Object.entries(bank.entries)) {
    assert.equal(typeof entry.originalPath, "string");
    assert(entry.originalPath.startsWith("assets/") && !derivatives.has(entry.originalPath));
    const originalFile = localFile(entry.originalPath, files), file = localFile(entry.path, files);
    assert.equal(entry.originalSHA256, files[entry.originalPath].sha256, `Original source hash changed: ${key}`);
    assert.equal(entry.sha256, files[entry.path].sha256, `Compressed source hash changed: ${key}`);
    assert.equal(entry.bytes, files[entry.path].bytes, `Compressed source byte count changed: ${key}`);
    for (const name of ["originalWidth", "originalHeight", "width", "height", "levels", "bytes", "rgbaMipBytes"]) {
      assert(Number.isSafeInteger(entry[name]) && entry[name] > 0, `Invalid ${name}: ${key}`);
    }
    assert.deepEqual(originalDimensions(originalFile), [entry.originalWidth, entry.originalHeight],
      `Compressed bank misstates original image dimensions: ${key}`);
    assert.equal(entry.rgbaMipBytes, rgbaMipBytes(entry.originalWidth, entry.originalHeight));
    originalMipBytes += entry.rgbaMipBytes;
    if (entry.kind === "original") {
      assert.equal(path.extname(entry.originalPath), ".svg", "Only the 22 exact authored SVG textures retain original GPU storage");
      assert.equal(entry.sha256, entry.originalSHA256);
      assert.equal(entry.width, entry.originalWidth);
      assert.equal(entry.height, entry.originalHeight);
      assert.equal(entry.levels, Math.floor(Math.log2(Math.max(entry.width, entry.height))) + 1);
      svgMipBytes += entry.rgbaMipBytes;
      continue;
    }
    assert.equal(path.extname(entry.originalPath), ".webp", "Compressed sources must derive from the original 149 WebP files");
    assert(Number.isSafeInteger(entry.bc7MipBytes) && entry.bc7MipBytes > 0);
    assert.equal(entry.width, Math.ceil(entry.originalWidth / 4) * 4, `Original width was resampled: ${key}`);
    assert.equal(entry.height, Math.ceil(entry.originalHeight / 4) * 4, `Original height was resampled: ${key}`);
    assert.equal(entry.paddedRgbaMipBytes, rgbaMipBytes(entry.width, entry.height));
    assert.equal(entry.levels, Math.floor(Math.log2(Math.max(entry.width, entry.height))) + 1,
      `The original-resolution texture must retain its complete mip chain: ${key}`);
    const data = header(file, 80 + entry.levels * 24);
    assert.equal(data.length, 80 + entry.levels * 24);
    assert(data.subarray(0, 12).equals(signature), `Invalid KTX2 identifier: ${key}`);
    assert.equal(data.readUInt32LE(12), 0, `KTX2 must use Basis UASTC, not an unrelated Vulkan format: ${key}`);
    assert.equal(data.readUInt32LE(16), 1);
    assert.equal(data.readUInt32LE(20), entry.width);
    assert.equal(data.readUInt32LE(24), entry.height);
    assert.equal(data.readUInt32LE(28), 0, "Road sources must remain 2D");
    assert(data.readUInt32LE(32) <= 1, "Road sources must not become texture arrays");
    assert.equal(data.readUInt32LE(36), 1, "Road sources must not become cubemaps");
    assert.equal(data.readUInt32LE(40), entry.levels);
    assert.equal(data.readUInt32LE(44), 2, "The approved KTX2 bank uses lossless Zstandard supercompression");
    assert.equal(safeUInt64(data, 64), 0);
    assert.equal(safeUInt64(data, 72), 0);
    const dfdOffset = data.readUInt32LE(48), dfdLength = data.readUInt32LE(52);
    assert(dfdOffset >= data.length && dfdLength >= 28 && dfdOffset + dfdLength <= entry.bytes);
    const fd = fs.openSync(file, "r"), dfd = Buffer.alloc(28);
    try { assert.equal(fs.readSync(fd, dfd, 0, dfd.length, dfdOffset), dfd.length); }
    finally { fs.closeSync(fd); }
    assert.equal(dfd.readUInt32LE(0), dfdLength);
    assert.equal(dfd[12], 166, "Compressed bank must contain legacy UASTC blocks");
    assert.equal(dfd[14], 1, "Compressed colors must retain UNORM transfer");
    assert.equal(dfd[15] & 1, 1, "Compressed alpha must be premultiplied exactly once");
    let width = entry.width, height = entry.height, mipBytes = 0;
    const ranges = [];
    for (let level = 0; level < entry.levels; level++) {
      const index = 80 + level * 24, offset = safeUInt64(data, index), length = safeUInt64(data, index + 8);
      const expanded = safeUInt64(data, index + 16), expected = Math.ceil(width / 4) * Math.ceil(height / 4) * 16;
      assert(offset >= data.length && length > 0 && offset + length <= entry.bytes, `Invalid compressed mip range: ${key}/${level}`);
      assert.equal(expanded, expected, `Mip dimensions or UASTC block size changed: ${key}/${level}`);
      ranges.push([offset, offset + length]); mipBytes += expected;
      width = Math.max(1, width >> 1); height = Math.max(1, height >> 1);
    }
    ranges.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < ranges.length; i++) assert(ranges[i - 1][1] <= ranges[i][0], "KTX2 mip ranges overlap");
    assert.equal(entry.bc7MipBytes, mipBytes, `Full-resolution resident mip estimate changed: ${key}`);
    compressedBytes += entry.bytes; residentMipBytes += mipBytes;
  }
  assert.equal(bank.originalRgbaMipBytes, originalMipBytes);
  assert.equal(bank.compressedGpuMipBytes, residentMipBytes);
  assert.equal(bank.svgGpuMipBytes, svgMipBytes);
  assert.equal(bank.allGpuMipBytes, residentMipBytes + svgMipBytes);
  const assets = Object.keys(files).filter(name => name.startsWith('assets/')).sort();
  assert.deepEqual(assets.filter(name => name.startsWith(textureRoot)), [...derivatives].sort(), 'Only declared texture derivatives may be added');
  assert.deepEqual(assets.filter(name => name.startsWith(macReviewRoot)), [...macReviewAssets].sort(), 'Only the exact registered Mac siblings may extend originals');
  assert.deepEqual(assets.filter(name => name.startsWith(macCityRoot)), [...macCityAssets].sort(), 'Only the exact 23 Mac city siblings may extend originals');
  assert.equal(macRigAssets.size, 17);
  assert.deepEqual(assets.filter(name => name.startsWith(macRigRoot)), [...macRigAssets].sort(), 'Only the exact 17 articulated combat assets may extend originals');
  const frameFiles = combatFrameFiles();
  const powerFiles = powerArtFiles(name => fs.readFileSync(localAsset(name)), files);
  const originals = assets.filter(name => !derivatives.has(name) && !macReviewAssets.has(name) && !macCityAssets.has(name) && !macRigAssets.has(name) && !frameFiles.has(name) && !powerFiles.has(name));
  assert.equal(originals.length, originalAssetCount, 'All 624 original assets must remain present');
  assert.equal(owner.canonicalAssetCount - derivatives.size - macReviewAssets.size - macCityAssets.size - macRigAssets.size - frameFiles.size - powerFiles.size, originalAssetCount);
  const originalRows = originals.map(name => [name, files[name].bytes, files[name].sha256]);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(originalRows)).digest('hex'), originalAssetInventorySHA256,
    'Original artwork, music, sprites or asset metadata changed');
  let assetBytes = 0;
  for (const name of assets) {
    const record = files[name];
    assert(record && Number.isSafeInteger(record.bytes) && record.bytes >= 0);
    assert.match(record.sha256, /^[0-9a-f]{64}$/);
    const hash = crypto.createHash('sha256'); let bytes = 0;
    for await (const chunk of fs.createReadStream(localFile(name, files))) { hash.update(chunk); bytes += chunk.length; }
    assert.deepEqual({ bytes, sha256: hash.digest('hex') }, record, 'Actual deployed asset differs from ownership: ' + name);
    assetBytes += bytes;
  }
  assert.equal(owner.assetBytes, assetBytes);
  // Evaluate only the shipped catalog/selector definitions. No display, loop,
  // image decode, audio owner or hardware timing is created by this package check.
  const selector = vm.createContext({ window: { BARCODE: { Campaign: { register() {}, syncTitleButton() {} } } }, console: quiet });
  const keyMarker = 'const GPU_LEVEL_KEYS=gpuLevelKeys();';
  for (const name of ['src/engine/cache-scene-layouts.js', 'src/game/cache-road-landscape.js', 'src/game/cache-road-proof.js']) {
    let source = read(name);
    if (name.endsWith('cache-road-proof.js')) {
      assert(source.includes(keyMarker), 'The production whole-level GPU selector changed');
      source = source.replace(keyMarker, keyMarker + 'B.__PACKAGE_GPU_KEYS=GPU_LEVEL_KEYS;');
    }
    vm.runInContext(source, selector, { filename: name, timeout: 3000 });
  }
  const pa = read('src/engine/presentation-assets.js'), boundary = pa.indexOf('  const cache = {};');
  assert(boundary > 0, 'The production presentation catalog boundary changed');
  vm.runInContext(pa.slice(0, boundary) + 'B.__PACKAGE_ENTRIES=entries;})();', selector, { timeout: 3000 });
  const productionKeys = Array.from(selector.window.BARCODE.__PACKAGE_GPU_KEYS), catalog = selector.window.BARCODE.__PACKAGE_ENTRIES;
  assert.equal(productionKeys.length, 171);
  assert.deepEqual(productionKeys.sort(), Object.keys(bank.entries).sort(), 'Texture bank differs from the actual whole-level GPU keys');
  for (const [key, entry] of Object.entries(bank.entries)) {
    assert.equal(entry.originalPath, catalog[key]?.path, 'Texture bank targets different production art: ' + key);
  }
  return { sources: 171, compressed: 149, originalSVG: 22, unchangedOriginalAssets: originals.length,
    derivativeFiles: derivatives.size, macReviewAssetCount: macReviewAssets.size, macCityAssetCount: macCityAssets.size, macRigAssetCount: macRigAssets.size, macFrameAssetCount: frameFiles.size, macPowerAssetCount: powerFiles.size,
    compressedBytes, compressedMipBytes: residentMipBytes, svgMipBytes,
    originalMipBytes, gpuMipBytes: residentMipBytes + svgMipBytes, originalAssetInventorySHA256,
    fullResolution: true, premultipliedUNORM: true, productionKeyAndPathCoverage: true, actualAssetHashes: true };
}

async function main() {
  const index = read('index.html');
  const equipmentReview = read('mac-equipment-review.html');
  localFile('mac-equipment-review.html');
  for (const match of equipmentReview.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const source = match[1].match(/\bsrc=["']([^"']+)/i)?.[1];
    if (source) localAsset(source);
    else new vm.Script(match[2], {filename:'mac-equipment-review.html inline script'});
  }
  const localIndexLinks = [];
  for (const match of index.matchAll(/<link\b[^>]*>/gi)) {
    const href = match[0].match(/\bhref=["']([^"']+)/i)?.[1];
    assert(href, 'Index link has no href');
    if (!/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
      localAsset(href.split(/[?#]/)[0]); localIndexLinks.push(href);
    }
  }
  const viewport = index.match(/<style id="standalone-viewport-style">([\s\S]*?)<\/style>/);
  assert(viewport, 'Standalone viewport override is missing');
  assert(index.indexOf(viewport[0]) > index.indexOf('href="style.css"'), 'Fit rules must follow the source stylesheet');
  assert(fs.existsSync(path.join(output, 'style.css')), 'Linked source stylesheet was omitted');
  const sharedRule=viewport[1].match(/#gameCanvas\s*,\s*#cacheRoadGpuCanvas\s*\{([^}]+)\}/);
  assert(sharedRule,'Native and GPU canvases must share their complete viewport fit');
  const canvasRule=sharedRule[1];
  assert(/#gameCanvas\s*\{\s*z-index:\s*1;/.test(viewport[1])&&
    /#cacheRoadGpuCanvas\s*\{\s*z-index:\s*0;\s*pointer-events:\s*none;/.test(viewport[1]),
    'GPU scenery must stay behind the native input and HUD canvas');
  assert(/#gameCanvas\.cache-road-gpu-active\s*\{\s*background:\s*transparent;/.test(viewport[1]),
    'Only the active GPU foreground may have a transparent background');
  for (const declaration of ['position: absolute', 'left: 50%', 'top: 50%',
    'transform: translate(-50%, -50%)', 'flex: none', 'border: 0',
    'width: min(100vw, 177.777778vh)', 'height: min(100vh, 56.25vw)',
    'max-width: none', 'max-height: none', 'image-rendering: auto']) assert(canvasRule.includes(declaration), declaration);
  assert(!/\bdisplay\s*:/.test(canvasRule), 'Canvas display must stay under lifecycle ownership');
  assert(/clip-path:\s*inset\(50%\)/.test(viewport[1]) && /display:\s*block\s*!important/.test(viewport[1]),
    'Redundant DOM hints must be readable without affecting game layout');
  const backing = index.match(/<canvas\b[^>]*\bid="gameCanvas"[^>]*>/)[0];
  assert(/\bwidth="1920"/.test(backing) && /\bheight="1080"/.test(backing), 'Native backing changed');
  const scripts = [...read('index.html').matchAll(/<script\b[^>]*\bsrc=["']([^"']+)/gi)].map(match => match[1]);
  assert.equal(scripts[0], 'src/engine/standalone-sprites.js');
  assert.equal(scripts.filter(name => name.includes('standalone-sprites')).length, 1);
  const touchScript = 'src/core/touch-controls.js';
  assert.equal(scripts.filter(name => name === touchScript).length, 1,
    'Touch controls must have one launched owner');
  localAsset(touchScript);
  for (const name of ['src/core/action-input.js', 'src/core/input.js']) {
    assert.equal(scripts.filter(script => script === name).length, 1, name);
    assert(scripts.indexOf(name) < scripts.indexOf(touchScript),
      'Touch controls must follow the existing input owners');
  }
  const macReview = checkMacReviewAssets(scripts, index);
  const macRigs = verifyArticulatedBank(name => fs.readFileSync(localAsset(name)), owner.files,
    macRigRoot, macRigActors, macRigAssets, data => crypto.createHash('sha256').update(data).digest('hex'));
  const frameFiles = combatFrameFiles();
  const frameCheck = execFileSync(process.execPath, [path.join(__dirname, 'check-mac-combat-frames.cjs'), output,
    '--manifest', macFrameRoot + 'mac-combat-frames-v1.json'], {encoding: 'utf8', timeout: 120000});
  assert.match(frameCheck, /native actors checked: 8/, 'Native complete-character cels must pass actual hash, crop, alpha and action checks');
  const macFrames = {selectedActors: 8, assetCount: frameFiles.size, nativeCelsChecked: true,
    supplementalSheetsChecked: 5, supplementalCelsChecked: 28, embeddedPipeCelsChecked: 6,
    historicalSupplementalSheetsChecked: 4, supplementalPackagedLoaderChecked: true,
    runtimeAcceptance: 'not established by packaging'};
  const vendorRoot = 'src/vendor/pixi-8.22.0/';
  const vendorHashes = {
    'pixi.min.js': '06d9ef9823e743518793083c296d801e752db128cb1f519fbabe37e1259567ea',
    'LICENSE': '5ce7447bc57f7349ffc48338782fbcabe613696e00712b20d66bc58e780f9473',
    'provenance.json': 'a5c6a646c2b1b37cbd65356d0475474d9b307910a8d888f8885918d860032075'
  };
  for (const [name, expected] of Object.entries(vendorHashes)) {
    const file = vendorRoot + name;
    const bytes = fs.readFileSync(path.join(output, file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, file);
    assert.equal(owner.files[file].sha256, expected, 'Vendor manifest differs from shipped bytes');
  }
  const vendor = JSON.parse(read(vendorRoot + 'provenance.json'));
  assert.equal(vendor.version, '8.22.0');
  assert.equal(vendor.license, 'MIT');
  assert.equal(vendor.files['pixi.min.js'].sha256, vendorHashes['pixi.min.js']);
  const basisRoot = 'src/vendor/basis-2.50/';
  const basisHashes = {
    'basis_transcoder.js': '720dd9bd09c7cada6d87f1b7b70cec713df04da88cd641ac3212559353834dc8',
    'basis_transcoder.wasm': 'a0f65d4a30ecb3269d01ead7d0a3477d2b0208146d083625a90623f473f6c139',
    'LICENSE': '065fcf48d6af21c0b75e23be5ed5753aee75c892e1c2cf178fa6736305614a5c',
    'provenance.json': '49c856c675a79368ecc76e356eec90ce7aa87bf2f1da302cf51aa1f647fa03ed'
  };
  for (const [name, expected] of Object.entries(basisHashes)) {
    const file = basisRoot + name, bytes = fs.readFileSync(path.join(output, file));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, file);
    assert.equal(owner.files[file].sha256, expected, 'Decoder manifest differs from shipped bytes');
  }
  const basis = JSON.parse(read(basisRoot + 'provenance.json'));
  assert.equal(basis.version, '2.50');
  assert.equal(basis.sourceCommit, '9bebe16726b3a61c8c213eeee3b7cffb462ef34e');
  assert.equal(basis.license, 'Apache-2.0');
  for (const [name, item] of Object.entries(basis.files)) assert.equal(item.sha256, basisHashes[name]);
  localAsset('src/engine/cache-road-texture-worker.js');
  const gpuScripts = [vendorRoot + 'pixi.min.js', 'src/engine/cache-road-texture-bank.js',
    'src/engine/cache-road-gpu-renderer.js',
    'src/engine/cache-road-gpu-context.js', 'src/game/cache-road-proof.js'];
  for (const name of gpuScripts) assert.equal(scripts.filter(script => script === name).length, 1, name);
  for (let i = 1; i < gpuScripts.length; i++) {
    assert(scripts.indexOf(gpuScripts[i - 1]) < scripts.indexOf(gpuScripts[i]), 'GPU renderer load order changed');
  }
  assert(scripts.indexOf('src/engine/presentation-assets.js') < scripts.indexOf(gpuScripts[1]));
  for (const name of owner.ownedFiles.filter(name => name.endsWith('.js'))) {
    new vm.Script(read(name), { filename: name });
  }
  for (const match of read('index.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc=/.test(match[1])) new vm.Script(match[2], { filename: 'index.html inline script' });
  }
  const initContext = makeContext({ MakkoEngine: { isLoaded: () => true, getManifest: () => manifest } });
  load(initContext, 'src/game/game-initializer.js');
  assert.equal(vm.runInContext('hasCurrentModelSprites()', initContext), true,
    'Localized manifest strings must pass the actual initializer comparison');
  const musicContext = makeContext();
  load(musicContext, 'src/engine/music-profiles.js');
  const registrations = owner.ownedFiles.filter(name => name.endsWith('.js') && /MusicProfiles\.register\s*\(/.test(read(name)));
  assert.equal(registrations.length, 3, 'Expected all three production music profile owners');
  for (const name of scripts.filter(name => registrations.includes(name))) load(musicContext, name);
  assert(registrations.every(name => scripts.includes(name)), 'A generated profile registration was not executed');
  const music = musicContext.window.BARCODE.MusicProfiles;
  const profileIDs = ['level-01.main', 'level-02.proof', 'level-03.proof'];
  let localMusicSources = 0;
  for (const id of profileIDs) {
    const profile = music.get(id);
    assert(profile, `Profile did not register: ${id}`);
    assert.equal(music.validateProfile(profile).ok, true, `Profile did not pass the actual validator: ${id}`);
    for (const source of profile.arrangement.sources) {
      localAsset(source.url); localMusicSources++;
      if (source.backupUrl != null) assert(/^https:\/\//.test(source.backupUrl), 'An invalid local backup survived generation');
      if (id === 'level-02.proof') assert.equal(Object.hasOwn(source, 'backupUrl'), false,
        'Cache duplicate local backup survived generation');
    }
  }
  const textureInventory = await checkRoadTextureBank();
  const requests = [];
  class RegistryImage {
    set src(url) { requests.push(url); localAsset(url); }
  }
  const registryContext = makeContext({ Image: RegistryImage });
  load(registryContext, 'src/engine/presentation-assets.js');
  assert(requests.length > 200, 'Production presentation registry did not preload');
  const registryCount = requests.length;
  const shipRequests = [];
  let failFirstShip = true;
  class ShipImage {
    constructor() { this.width = 320; this.height = 80; }
    set src(url) {
      localAsset(url); shipRequests.push(url);
      const fail = url === './assets/traffic/ship-1.webp' && failFirstShip;
      if (fail) failFirstShip = false;
      queueMicrotask(() => { if (fail) this.onerror?.(); else this.onload?.(); });
    }
  }
  const shipContext = makeContext();
  shipContext.Image = ShipImage;
  shipContext.Date = Date;
  load(shipContext, 'src/engine/traffic-sheets.js');
  load(shipContext, 'src/engine/spaceships.js');
  const ships = new shipContext.window.SpaceShipSystem();
  for (let turn = 0; turn < 4; turn++) await new Promise(resolve => setImmediate(resolve));
  assert.equal(ships.getReadyShipTypes().length, 3, 'Local ship atlas retry failed');
  for (let index = 0; index < 3; index++) {
    assert.equal(ships.shipSheets[index], shipContext.window.BARCODE.trafficSheets[index],
      'Fallback discarded the animation sheet and would draw an entire atlas');
  }
  assert.equal(shipRequests.filter(url => url === './assets/traffic/ship-1.webp').length, 2,
    'The production fallback path was not exercised');
  const sequence = [], bootCallbacks = [], timers = [];
  const bootContext = makeContext({
    addEventListener() {},
    initSprites: () => { sequence.push('sprites'); return Promise.resolve(); },
    bootLoader: { startBootSequence: () => sequence.push('boot') }
  });
  bootContext.document = {
    addEventListener: (type, callback) => { if (type === 'DOMContentLoaded') bootCallbacks.push(callback); },
    getElementById: () => ({ addEventListener() {}, style: {} })
  };
  bootContext.setInterval = (callback, delay) => { sequence.push('monitor'); timers.push({ callback, delay }); return timers.length; };
  bootContext.setTimeout = (callback, delay) => { timers.push({ callback, delay }); return timers.length; };
  bootContext.clearInterval = () => {};
  bootContext.clearTimeout = () => {};
  bootContext.requestAnimationFrame = () => assert.fail('Standalone boot added a frame owner');
  for (const match of read('index.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc=/.test(match[1])) vm.runInContext(match[2], bootContext, { filename: 'generated index startup' });
  }
  assert.equal(bootCallbacks.length, 1, 'Standalone boot added another DOM owner');
  await bootCallbacks[0]();
  assert.deepEqual(sequence, ['sprites', 'boot', 'monitor', 'monitor']);
  assert.deepEqual(timers.map(timer => timer.delay), [100, 100, 15000], 'Existing asset monitor ownership changed');
  console.log(JSON.stringify({ passed: true, scripts: scripts.length,
    productionInitializerManifest: true, registeredMusicProfiles: profileIDs, localMusicSources,
    localPresentationRequests: registryCount,
    localAnimatedShipTypes: 3, forcedShipAtlasRetry: true, existingBootOwnerSpritePreload: true,
    containedNativeViewportCSS: true, linkedStylesheet: true, localIndexLinks,
    pinnedLocalRenderer: 'pixi.js@8.22.0', pinnedLocalTranscoder: 'Basis Universal@2.50',
    vendorLicenseAndHashes: true, gpuRendererLoadOrder: true, compressedTextureBank: textureInventory, macReview, macRigs, macFrames,
    limits: 'VM contracts and local files only; no browser, listening or performance acceptance' }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
