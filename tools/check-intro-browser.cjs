// Real Chromium layout/fullscreen regression. Node 22+ and an installed Chrome
// binary are required; no npm dependencies or Makko replacement are added.
// Production DOM/CSS, Start adapter, fullscreen, intro, tutorial and lifecycle
// run intact. Only the unavailable Makko initializer, gameplay loop and audio
// boundary are omitted. Local assets exercise the existing bundled fallback.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.INTRO_BROWSER_OUTPUT || path.join(os.tmpdir(), 'barcode-intro-browser'));
const chromePath = process.env.CHROME_BIN || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(file => fs.existsSync(file));
assert(chromePath, 'Set CHROME_BIN to an installed Chrome/Chromium executable.');
fs.mkdirSync(output, { recursive: true });
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const startFrom = index.indexOf("document.getElementById('startButton').addEventListener('click', async function()");
const startTo = index.indexOf('// Add keyboard support for start button', startFrom);
assert(startFrom >= 0 && startTo > startFrom, 'production Start adapter is available');
const styles = index.match(/<style>([\s\S]*?)<\/style>/)[0];
const markup = index.slice(index.indexOf('<body>') + 6, index.indexOf('<!-- MakkoEngine'));
const scripts = ['src/utils/math.js', 'src/core/fullscreen.js', 'src/engine/presentation-assets.js', 'src/game/comic-hud.js', 'src/engine/intro-sequence.js', 'src/engine/cutscene.js', 'src/game/tutorial.js', 'src/core/runtime-lifecycle.js'];
const fixture = `<!doctype html><html><head>${styles}<link rel="stylesheet" href="/style.css"></head><body>${markup}
<script>
window.browserCheck = { loops: 0, contexts: 0, fail: new URLSearchParams(location.search).has('fail') };
const getContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(...args) {
  if (this.id !== 'gameCanvas' && ++browserCheck.contexts > 1) throw new Error('Intro requested its context again');
  return getContext.apply(this, args);
};
window.startGameInitialization = async () => {
  // Allow the native fullscreen request to settle while initialization runs.
  await new Promise(resolve => setTimeout(resolve, 150));
  if (browserCheck.fail) { browserCheck.fail = false; throw new Error('Initializer fixture failure'); }
};
window.startGameLoop = () => { browserCheck.loops++; };
window.gameState = { running: false, paused: false };
</script>
${scripts.map(file => `<script src="/${file}"></script>`).join('\n')}
<script>${index.slice(startFrom, startTo)}
document.getElementById('startOverlay').style.display = 'flex';
document.getElementById('startOverlay').style.opacity = '1';
</script></body></html>`;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(fixture); return;
  }
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); res.end(); return;
  }
  const type = { '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp' }[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(file).pipe(res);
});
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let chrome, chromeClosed, socket;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'barcode-chrome-'));
const errors = [];
const receipts = [];
async function main() {
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--no-first-run', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  chromeClosed = new Promise(resolve => chrome.once('close', resolve));
  const debuggerUrl = await new Promise((resolve, reject) => {
    let stderr = '';
    const timeout = setTimeout(() => fail(new Error(`Chrome did not expose DevTools within 30s.\n${stderr}`)), 30000);
    const cleanup = () => {
      clearTimeout(timeout);
      chrome.off('error', fail); chrome.off('close', closed);
      chrome.stderr.off('data', readStderr);
    };
    const fail = error => { cleanup(); reject(error); };
    const closed = (code, signal) => fail(new Error(`Chrome closed before DevTools (${code ?? signal}).\n${stderr}`));
    const readStderr = data => {
      // Pipe chunks can split the endpoint line; wait for its terminating whitespace.
      stderr = (stderr + data).slice(-16384);
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)\s/);
      if (match) { cleanup(); resolve(match[1]); }
    };
    chrome.once('error', fail); chrome.once('close', closed);
    chrome.stderr.on('data', readStderr);
  });
  const debuggerOrigin = new URL(debuggerUrl).origin.replace('ws:', 'http:');
  const target = await (await fetch(`${debuggerOrigin}/json/new`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let serial = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timeout } = pending.get(message.id); pending.delete(message.id); clearTimeout(timeout);
      if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial;
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 10000);
    pending.set(id, { resolve, reject, timeout }); socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails)); return result.result.value;
  };
  const until = async (expression, label) => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await delay(50); }
    throw new Error(`Browser timeout: ${label}`);
  };
  const screenshot = async name => {
    const result = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(result.data, 'base64'));
  };
  const click = async selector => {
    const point = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  };
  const key = async (key, code, down = true, autoRepeat = false) => send('Input.dispatchKeyEvent', { type: down ? 'keyDown' : 'keyUp', key, code, autoRepeat, windowsVirtualKeyCode: code === 'Space' ? 32 : key === 'Enter' ? 13 : 83 });
  const visibleIntro = async label => {
    const state = await evaluate(`(() => {
      const scene = window.cutsceneSystem, canvas = scene.introCanvas, r = canvas.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      const pixels = scene.introContext.getImageData(0, 0, 1920, 1080).data;
      let bright = 0; for (let i = 0; i < pixels.length; i += 400) if (pixels[i] + pixels[i+1] + pixels[i+2] > 120) bright++;
      return { label: ${JSON.stringify(label)}, fullscreen: document.fullscreenElement?.tagName || null,
        width: r.width, height: r.height, hit: hit === canvas, bright, panel: scene.currentImageIndex, cue: scene.currentCueIndex,
        contexts: browserCheck.contexts, ready: scene.cutsceneImages.filter(image => image.loaded).length };
    })()`);
    receipts.push(state); await screenshot(label);
    assert(state.width > 100 && state.height > 100 && state.hit, `${label}: drawn intro is not visible/clickable: ${JSON.stringify(state)}`);
    assert(state.bright > 100 && state.ready === 8 && state.contexts === 1, `${label}: artwork/drawing/context budget failed`);
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://raw.githubusercontent.com/*', 'https://fonts.googleapis.com/*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: origin });
  await until('document.readyState === "complete" && !!window.fullscreenManager', 'fixture ready');
  await click('#startButton');
  await until('window.cutsceneSystem?.isPlaying() && cutsceneSystem.cutsceneImages.every(image => image.loaded)', 'intro artwork');
  assert(await evaluate('document.fullscreenElement === document.documentElement'), 'Start enters native fullscreen on the shared root');
  await until('cutsceneSystem.currentCueIndex === 1', 'automatic first screen cue');
  assert(await evaluate('!cutsceneSystem.transcriptElement.textContent.includes("One more pass")'), 'future dialogue is still hidden');
  await key(' ', 'Space'); await key(' ', 'Space', true, true); await key(' ', 'Space', false);
  assert(await evaluate('cutsceneSystem.currentImageIndex === 1 && cutsceneSystem.currentCueIndex === 2 && cutsceneSystem.transcriptElement.textContent.includes("One more pass") && !cutsceneSystem.transcriptElement.textContent.includes("part that proves")'), 'Space reveals one speech bubble; held repeat cannot reveal another');
  await delay(300); await key('Enter', 'Enter'); await key('Enter', 'Enter', false);
  assert(await evaluate('cutsceneSystem.currentImageIndex === 1 && cutsceneSystem.currentCueIndex === 2'), 'scene key cannot consume dialogue');
  await delay(300); await click('#barcode-intro');
  assert(await evaluate('cutsceneSystem.currentImageIndex === 1 && cutsceneSystem.currentCueIndex === 3'), 'pointer reveals the second speech bubble on the same page');
  await visibleIntro('01-fullscreen');
  await evaluate('document.exitFullscreen()'); await until('!document.fullscreenElement', 'fullscreen exit');
  await visibleIntro('02-windowed');
  await evaluate('fullscreenManager.enter()'); await until('!!document.fullscreenElement', 'fullscreen re-entry');
  await visibleIntro('03-reentered');
  await send('Emulation.setDeviceMetricsOverride', { width: 960, height: 540, deviceScaleFactor: 1, mobile: false });
  await visibleIntro('04-resized');
  let presses = 0;
  while (await evaluate('cutsceneSystem.isPlaying()')) {
    assert(presses++ < 40, 'all cues can reach the tutorial without getting stuck');
    await delay(300);
    const complete = await evaluate('cutsceneSystem.currentCueIndex >= BARCODE.IntroSequence.getCues(cutsceneSystem.currentImageIndex - 1).length - 1');
    const advanceKey = complete ? 'Enter' : ' ', advanceCode = complete ? 'Enter' : 'Space';
    await key(advanceKey, advanceCode); await key(advanceKey, advanceCode, false);
    const stage = await evaluate('({ active: cutsceneSystem.isPlaying(), panel: cutsceneSystem.currentImageIndex, cue: cutsceneSystem.currentCueIndex })');
    if (stage.active && [3, 5, 6].includes(stage.panel) && [1, 2].includes(stage.cue)) await visibleIntro(`cue-${stage.panel}-${stage.cue}`);
  }
  await until('BARCODE.RuntimeLifecycle.getState() === "running" && !document.getElementById("barcode-intro")', 'tutorial handoff');
  assert(await evaluate('tutorialSystem.targetText.includes("Still with you") && browserCheck.loops === 1 && gameCanvas.getBoundingClientRect().height > 100'), 'tutorial starts visibly once');
  // Render the actual tutorial card on an explicitly empty gameplay boundary.
  await evaluate('tutorialSystem.update(5000); tutorialSystem.draw(gameCanvas.getContext("2d"))');
  await screenshot('05-tutorial-card');
  await evaluate('document.exitFullscreen()');
  await send('Page.navigate', { url: origin + '/?fail=1' });
  await until('document.readyState === "complete" && !!window.fullscreenManager', 'retry fixture ready');
  await click('#startButton');
  await until('BARCODE.RuntimeLifecycle.getState() === "failed"', 'initializer failure');
  assert(await evaluate('document.elementFromPoint(innerWidth/2, innerHeight/2)?.closest("#startOverlay") !== null'), 'retry UI stays within fullscreen');
  await screenshot('06-visible-retry'); await click('#startButton');
  await until('window.cutsceneSystem?.isPlaying() && cutsceneSystem.cutsceneImages.every(image => image.loaded)', 'retry intro artwork');
  await visibleIntro('07-retry-intro');
  await key('s', 'KeyS'); await delay(2000); await key('s', 'KeyS', false);
  assert(await evaluate('cutsceneSystem.isPlaying() && !cutsceneSystem.isSkipHoldActive'), 'early release cancels skip');
  await key('s', 'KeyS'); await delay(5100); await key('s', 'KeyS', false);
  await until('BARCODE.RuntimeLifecycle.getState() === "running" && !document.getElementById("barcode-intro")', 'held S handoff');
  assert(await evaluate('tutorialSystem.targetText.includes("Still with you") && browserCheck.loops === 1'), 'skipped intro starts tutorial once');
  // Decode and draw the new production assets through the bundled fallback,
  // using the existing gameplay canvas after the intro releases it.
  await until(`(() => { const ctx = gameCanvas.getContext('2d'); return ['studioCat', 'directionArrow', 'bossPulse'].every(key => BARCODE.PresentationAssets.draw(key, ctx)); })()`, 'presentation asset decoding');
  assert(await evaluate(`(() => {
    const ctx = gameCanvas.getContext('2d'); ctx.clearRect(0, 0, 1920, 1080);
    for (let i = 0; i < 4; i++) {
      BARCODE.PresentationAssets.draw('studioCat', ctx, { x: 280 + i * 380, y: 300, width: 232, frame: i });
      ctx.save(); ctx.translate(280 + i * 380, 540); ctx.rotate(i * Math.PI / 2);
      BARCODE.PresentationAssets.draw('directionArrow', ctx, { width: 212 }); ctx.restore();
      BARCODE.PresentationAssets.draw('bossPulse', ctx, { x: 280 + i * 380, y: 840, width: 128, height: 112, frame: i, flip: i % 2 === 1 });
    }
    return [180, 450, 730].every(y => { const data = ctx.getImageData(100, y, 1650, 150).data; let filled = 0; for (let i = 3; i < data.length; i += 4) if (data[i] > 128) filled++; return filled > 1000; });
  })()`), 'cat, arrow and pulse produce visible opaque pixels in Chromium');
  await screenshot('08-presentation-assets');
  assert.deepEqual(errors, [], 'no browser JavaScript exceptions');
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ passed: true, receipts, errors, limits: 'Real Chromium DOM/fullscreen/input and local artwork; Makko sprites, gameplay loop and audible audio are not exercised.' }, null, 2));
  console.log(`Chromium timed cues, advancement, fullscreen, resize, retry, tutorial handoff and presentation assets passed. Evidence: ${output}`);
}
main().catch(error => {
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ passed: false, error: error.stack, receipts, errors }, null, 2));
  console.error(error); process.exitCode = 1;
}).finally(async () => {
  socket?.close();
  if (chrome && chrome.exitCode === null && chrome.signalCode === null) chrome.kill();
  if (chromeClosed) await chromeClosed;
  server.close();
  // Chromium helpers can finish profile writes after the main process exits.
  // Wait for closed stdio, then retry transient directory-removal races.
  await fs.promises.rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});
