'use strict';
// Focused checks use the generated production owners, without browser claims.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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

async function main() {
  const index = read('index.html');
  const viewport = index.match(/<style id="standalone-viewport-style">([\s\S]*?)<\/style>/);
  assert(viewport, 'Standalone viewport override is missing');
  assert(index.indexOf(viewport[0]) > index.indexOf('href="style.css"'), 'Fit rules must follow the source stylesheet');
  assert(fs.existsSync(path.join(output, 'style.css')), 'Linked source stylesheet was omitted');
  const canvasRule = viewport[1].match(/#gameCanvas\s*\{([^}]+)\}/)[1];
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
    containedNativeViewportCSS: true, linkedStylesheet: true,
    limits: 'VM contracts and local files only; no browser, listening or performance acceptance' }));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
