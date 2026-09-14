// Optional diagnostic using the actual Makko SDK and decoded production atlases.
// MAKKO_ENGINE_PATH and MODEL_ART_ORIGINALS point to locally supplied host files.
// Native Canvas replaces browser image transport only; the SDK loads, clones and draws.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const { createCanvas, Image } = require(require.resolve('@napi-rs/canvas', {
  paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || process.cwd()]
}));
const { createRig, load } = require('./check-level-01-boss');
const root = path.resolve(__dirname, '..');
const sdkPath = process.env.MAKKO_ENGINE_PATH;
const originals = process.env.MODEL_ART_ORIGINALS;
assert(sdkPath && originals, 'Supply MAKKO_ENGINE_PATH and MODEL_ART_ORIGINALS.');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const installed = read(path.join(root, 'sprites-manifest.json'));
const original = read(path.join(root, 'assets/sprites-v3/original-manifest.json'));
const requests = [], imageRequests = [];

function localAsset(url) {
  const parsed = new URL(url);
  if (parsed.hostname === 'raw.githubusercontent.com') {
    const suffix = parsed.pathname.split('/').slice(4).join('/');
    assert(suffix.startsWith('assets/sprites-v3/prepared/'));
    return path.join(root, suffix);
  }
  return path.join(originals, path.basename(parsed.pathname));
}

async function main() {
  const { w, context } = createRig();
  w.Image = class AssetImage extends Image {
    set src(url) {
      if (String(url).includes('MakkoWebsiteLogo')) { queueMicrotask(() => this.onerror?.(new Error('Logo outside this diagnostic'))); return; }
      imageRequests.push(url);
      super.src = fs.readFileSync(localAsset(url));
    }
  };
  w.fetch = async url => {
    requests.push(url);
    if (url === 'sprites-manifest.json') return { ok: true, json: async () => original };
    if (/^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/[a-f0-9]{40}\/sprites-manifest\.json$/.test(url)) {
      return { ok: true, json: async () => installed };
    }
    if (!String(url).startsWith('https://')) return { ok: false, status: 404 };
    return { ok: true, json: async () => read(localAsset(url)) };
  };
  const sdk = fs.readFileSync(sdkPath, 'utf8');
  vm.runInContext(sdk, context, { filename: 'MakkoEngine.min.js' });
  const engine = w.MakkoEngine;
  await engine.init('sprites-manifest.json');
  w.useFallbackGraphics = false;
  await w.player.initSprite();
  const oldPlayer = w.player.sprite;
  assert.equal(oldPlayer.currentSprite.imagePath, original.characters['6_bit_main'].animations['6_bit_idle_idle'].image);
  load(context, 'src/game/game-initializer.js');
  const first = w.initSprites(), second = w.initSprites();
  assert.equal(first, second);
  await first;
  assert.equal(w.useFallbackGraphics, false);
  assert.equal(w.MakkoEngine, engine);
  assert.notEqual(w.player.sprite, oldPlayer);
  assert.equal(w.player.sprite.currentSprite.imagePath, installed.characters['6_bit_main'].animations['6_bit_idle_idle'].image);

  const canvas = createCanvas(1440, 960), ctx = canvas.getContext('2d');
  ctx.fillStyle = '#11131b'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const samples = [];
  for (const [character, record] of Object.entries(installed.characters)) {
    const sprite = engine.sprite(character);
    for (const [clip, entry] of Object.entries(record.animations)) {
      if (!entry.image.includes('/assets/sprites-v3/prepared/')) continue;
      sprite.play(clip);
      assert.equal(sprite.currentSprite.imagePath, entry.image);
      assert.equal(sprite.currentSprite.jsonPath, entry.json);
      const i = samples.length, x = (i % 4) * 360 + 180, y = Math.floor(i / 4) * 320 + 280;
      const scale = Math.min(230 / entry.dimensions.width, 235 / entry.dimensions.height);
      sprite.draw(ctx, x, y, { scale });
      ctx.fillStyle = '#aaffbb'; ctx.font = '13px monospace'; ctx.textAlign = 'center';
      ctx.fillText(clip, x, y + 26);
      samples.push({ character, clip, image: sprite.currentSprite.imagePath, frames: sprite.currentSprite.metadata.meta.frameTags[0].to + 1 });
    }
  }
  assert.equal(samples.length, 12);
  const actorContext = createCanvas(1920, 1080).getContext('2d');
  for (const type of ['virus', 'corrupted', 'firewall']) {
    const enemy = new w.Enemy(500, 700, type);
    enemy.initSprite();
    assert.equal(enemy.spriteReady, true);
    assert(enemy.sprite.currentSprite.imagePath.includes('/assets/sprites-v3/prepared/'));
    enemy.drawSprite(actorContext);
  }
  w.player.drawSprite(actorContext);
  const before = requests.length;
  await w.initSprites();
  assert.equal(requests.length, before, 'repeat startup reuses the verified SDK registry');
  const out = path.join(root, 'docs/source-pack/verification');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'makko-model-runtime.webp'), canvas.toBuffer('image/webp'));
  fs.writeFileSync(path.join(out, 'makko-model-runtime.json'), JSON.stringify({
    passed: true, sdkSha256: crypto.createHash('sha256').update(sdk).digest('hex'),
    scenarios: ['preloaded host manifest replaced', 'pre-Start player clone rebound', 'all twelve real SDK clips drawn', 'production player and three enemies drawn', 'concurrent and repeated startup'],
    samples, manifestRequests: requests.filter(url => String(url).includes('sprites-manifest.json')),
    imageLoads: imageRequests.length,
    limits: 'Actual saved Makko SDK, production initialization and sprite owners with decoded local atlas bytes; browser networking, host import, audio and playtest feel remain outside this diagnostic.'
  }, null, 2) + '\n');
  console.log('Actual Makko SDK: old registry replaced, player rebound, 12 production clips and player/enemy owners drawn; repeat startup made no requests.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
