// Real Chromium title-settings/input/fullscreen regression. Node 22+ and an installed Chrome
// binary are required; no npm dependencies or Makko replacement are added.
// Production DOM/CSS, title adapters, PauseMenu, InputManager and fullscreen run
// intact. Gameplay/audio lifecycle calls are counted stubs; no Makko claim.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.SETTINGS_BROWSER_OUTPUT || path.join(os.tmpdir(), 'barcode-settings-browser'));
const chromePath = process.env.CHROME_BIN || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(file => fs.existsSync(file));
assert(chromePath, 'Set CHROME_BIN to an installed Chrome/Chromium executable.');
fs.mkdirSync(output, { recursive: true });
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const startFrom = index.indexOf("document.getElementById('settingsButton').addEventListener");
const startTo = index.indexOf('// Handle fullscreen changes', startFrom);
assert(startFrom >= 0 && startTo > startFrom);
const styles = index.match(/<style>([\s\S]*?)<\/style>/)[0];
const markup = index.slice(index.indexOf('<body>') + 6, index.indexOf('<!-- MakkoEngine'));
const scripts = ['src/utils/math.js', 'src/core/fullscreen.js', 'src/game/lore-records.js', 'src/game/pause-menu.js', 'src/core/action-input.js', 'src/core/gamepad-ui.js', 'src/core/input.js', 'src/game/comic-hud.js'];
const fixture = `<!doctype html><html><head>${styles}<link rel="stylesheet" href="/style.css"></head><body>${markup}
<script>
window.browserCheck = { starts:0, resumes:0, contexts:0, pad:null };
const originalContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function(...args) { if (this.id==='titleSettingsCanvas') browserCheck.contexts++; return originalContext.apply(this,args); };
window.gameState = { running:false, paused:false };
window.BARCODE={RuntimeLifecycle:{getState:()=> 'idle',start:async()=>{browserCheck.starts++;return {ok:true};},resume:async()=>{browserCheck.resumes++;return {ok:true};}}};
Object.defineProperty(navigator,'getGamepads',{value:()=>browserCheck.pad?[browserCheck.pad]:[]});
</script>
${scripts.map(file => `<script src="/${file}"></script>`).join('\n')}
<script>${index.slice(startFrom, startTo)}
document.getElementById('startOverlay').style.display='flex';document.getElementById('startOverlay').style.opacity='1';
// The real title RAF calls this same owner; this fixture supplies only its clock.
function frame(){window.inputManager?.updateFrontend('title');requestAnimationFrame(frame);}requestAnimationFrame(frame);
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
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: false });
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
  const press=async (k,code=k)=>{await key(k,code);await key(k,code,false);};
  const clickRow=async index=>{
    const point=await evaluate(`(()=>{const r=BARCODE.PauseMenu.canvas().getBoundingClientRect();return {x:r.x+r.width*1200/1920,y:r.y+r.height*(350+${index}*38)/1080};})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
  };
  await send('Page.enable');await send('Runtime.enable');
  for(const [width,height] of [[1280,720],[960,720]]){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url:origin});
    await until('document.readyState==="complete" && !!window.inputManager && !!window.fullscreenManager','title ready');
    await press('o','KeyO');
    await until('BARCODE.PauseMenu.titleOpen','keyboard open');
    assert.equal(await evaluate('BARCODE.PauseMenu.focus'),0,'opening key does not change a setting');
    assert(await evaluate(`(()=>{const c=BARCODE.PauseMenu.titleCanvas,r=c.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===c && r.width<=innerWidth && r.height<=innerHeight;})()`),'settings fills viewport and owns hit testing');
    await press('ArrowUp');await press('Enter');
    await until('!!document.fullscreenElement','keyboard fullscreen enters');
    await clickRow(14);await until('!document.fullscreenElement && !fullscreenManager.isActive && !BARCODE.PauseMenu.fullscreenPending','pointer fullscreen exits');
    assert.equal(await evaluate('BARCODE.PauseMenu.fullscreenChoice'),false);
    assert.equal(await evaluate('BARCODE.PauseMenu.message'),'','successful fullscreen must not show a blocked warning');
    const old=await evaluate('BARCODE.Preferences.values.reducedMotion');
    await clickRow(13);assert.equal(await evaluate('BARCODE.Preferences.values.reducedMotion'),!old,'scaled pointer toggles setting');
    await clickRow(8);assert.equal(await evaluate('BARCODE.PauseMenu.view'),'timing');
    await press('ArrowRight');await press('Escape');
    await clickRow(12);assert.equal(await evaluate('BARCODE.PauseMenu.view'),'controller');
    await press('Escape');await clickRow(9);assert.equal(await evaluate('BARCODE.PauseMenu.view'),'archive');
    await press('Escape');await screenshot(`settings-${width}x${height}`);
    await press('Escape');assert.equal(await evaluate('BARCODE.PauseMenu.titleOpen'),false);
    await press(' ','Space');assert(await evaluate('BARCODE.PauseMenu.titleOpen'),'Space on focused Settings opens menu');
    assert.equal(await evaluate('BARCODE.PauseMenu.focus'),0,'Space does not leak into first row');
    await press('Escape');await click('#settingsButton');await press('Escape');
    assert(await evaluate('browserCheck.starts===0 && browserCheck.resumes===0'),'settings do not start gameplay or resume audio');
    // Simulated device, real frontend poll/debounce/routing.
    await evaluate(`browserCheck.pad={id:'Xbox Controller',index:0,connected:true,mapping:'standard',axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))}`);
    await delay(80);await evaluate('browserCheck.pad.buttons[2]={pressed:true,value:1}');
    await until('BARCODE.PauseMenu.titleOpen','controller opens settings');
    await evaluate('browserCheck.pad.buttons[2]={pressed:false,value:0}');await delay(80);
    await evaluate('browserCheck.pad.buttons[1]={pressed:true,value:1}');await until('!BARCODE.PauseMenu.titleOpen','controller back');
    await evaluate('browserCheck.pad=null');
    assert.equal(await evaluate('document.querySelectorAll("#titleSettingsCanvas").length'),1,'one reused surface');
    // Explicit windowed choice survives the next Start gesture in this session.
    await click('#startButton');assert.equal(await evaluate('browserCheck.starts'),1);assert.equal(await evaluate('!!document.fullscreenElement'),false);
    await send('Page.reload');await until('document.readyState==="complete" && !!window.inputManager','reload');
    assert.equal(await evaluate('BARCODE.Preferences.values.reducedMotion'),!old,'preference survives browser reload');
    receipts.push({width,height,keyboard:true,pointer:true,simulatedController:true,fullscreen:true,persistence:true});
  }
  assert.deepEqual(errors,[],'no browser exceptions');
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,receipts,errors,limits:'Real Chromium production settings/DOM/input/fullscreen; lifecycle counted stubs and simulated controller. Hosted Makko and physical controller acceptance remain pending.'},null,2));
  console.log('Chromium settings passed at 1280×720 and 960×720: keyboard/pointer/controller, native fullscreen, modal ownership, submenus and saved preferences.');
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
