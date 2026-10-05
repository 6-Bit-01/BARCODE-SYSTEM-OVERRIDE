'use strict';
// Focused checks use the generated production owners, without browser claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

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

function safeUInt64(data, offset) {
  const value = data.readBigUInt64LE(offset);
  assert(value <= BigInt(Number.MAX_SAFE_INTEGER), "KTX2 range exceeds safe integer bounds");
  return Number(value);
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
  const originals = assets.filter(name => !derivatives.has(name));
  assert.equal(originals.length, originalAssetCount, 'All 624 original assets must remain present');
  assert.equal(owner.canonicalAssetCount - derivatives.size, originalAssetCount);
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
    derivativeFiles: derivatives.size, compressedBytes, compressedMipBytes: residentMipBytes, svgMipBytes,
    originalMipBytes, gpuMipBytes: residentMipBytes + svgMipBytes, originalAssetInventorySHA256,
    fullResolution: true, premultipliedUNORM: true, productionKeyAndPathCoverage: true, actualAssetHashes: true };
}

async function main() {
  const index = read('index.html');
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
    vendorLicenseAndHashes: true, gpuRendererLoadOrder: true, compressedTextureBank: textureInventory,
    limits: 'VM contracts and local files only; no browser, listening or performance acceptance' }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
