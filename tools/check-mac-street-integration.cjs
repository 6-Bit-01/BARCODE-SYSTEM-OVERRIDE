#!/usr/bin/env node
'use strict';
// Real Mac wrapper, combat/story, shared lifecycle/frame/input and touch owners.
// The DOM, image decoding, Canvas operations and audio device are host stubs;
// health, encounters, choices and action routing are never imitated or patched.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const {webcrypto, createHash} = require('node:crypto');
const root = path.resolve(__dirname, '..');
const plain = value => JSON.parse(JSON.stringify(value));
class EventTarget {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, handler) { const list = this.listeners.get(type) || []; list.push(handler); this.listeners.set(type, list); }
  removeEventListener(type, handler) { this.listeners.set(type, (this.listeners.get(type) || []).filter(h => h !== handler)); }
  dispatchEvent(event) {
    event.target ||= this; event.currentTarget = this;
    event.preventDefault ||= () => { event.defaultPrevented = true; };
    event.stopPropagation ||= () => { event.propagationStopped = true; };
    for (const handler of [...this.listeners.get(event.type) || []]) handler.call(this, event);
    if (event.bubbles && !event.propagationStopped) this.parentNode?.dispatchEvent(event);
    return !event.defaultPrevented;
  }
}
class Element extends EventTarget {
  constructor(tag, doc) {
    super(); this.tagName = tag.toUpperCase(); this.ownerDocument = doc; this.children = [];
    this.style = {setProperty(key, value) { this[key] = value; }, removeProperty(key) { delete this[key]; }};
    this.dataset = {}; this.attributes = {}; this.className = ''; this.hidden = false; this.disabled = false;
    this.captured = new Set();
    this.classList = {add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter(n => !names.includes(n)).join(' '); },
      contains: name => this.className.split(/\s+/).includes(name),
      toggle: (name, force) => { const wanted = force ?? !this.classList.contains(name); wanted ? this.classList.add(name) : this.classList.remove(name); return wanted; }};
  }
  get textContent() { return (this._text || '') + this.children.map(c => c.textContent).join(''); }
  set textContent(value) { this._text = String(value); for (const c of this.children) c.parentNode = null; this.children = []; }
  appendChild(child) { child.parentNode?.removeChild?.(child); child.parentNode = this; this.children.push(child); return child; }
  append(...children) { children.forEach(c => this.appendChild(c)); }
  removeChild(child) { this.children = this.children.filter(c => c !== child); child.parentNode = null; return child; }
  remove() { this.parentNode?.removeChild(this); }
  setAttribute(key, value) { this.attributes[key] = String(value); if (key === 'id') this.id = String(value);
    if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value); }
  removeAttribute(key) { delete this.attributes[key]; }
  getAttribute(key) { return key === 'id' ? this.id ?? null : key.startsWith('data-')
    ? this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ?? null : this.attributes[key] ?? null; }
  matches(selector) { if (selector.startsWith('#')) return this.id === selector.slice(1); if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    const attr = selector.match(/^\[([\w-]+)\]$/); return attr ? this.getAttribute(attr[1]) !== null : this.tagName.toLowerCase() === selector; }
  closest(selector) { return this.matches(selector) ? this : this.parentNode?.closest?.(selector) || null; }
  contains(child) { return child === this || this.children.some(c => c.contains(child)); }
  querySelectorAll(selector) { return this.children.flatMap(c => [...(c.matches(selector) ? [c] : []), ...c.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  setPointerCapture(id) { this.captured.add(id); }
  releasePointerCapture(id) { this.captured.delete(id); }
  hasPointerCapture(id) { return this.captured.has(id); }
  focus() { this.ownerDocument.activeElement = this; }
  click() { if (!this.disabled) this.dispatchEvent({type: 'click', bubbles: true, detail: 0}); }
  getBoundingClientRect() { return {left: 20, top: 600, width: 140, height: 140, right: 160, bottom: 740}; }
}
function rig({touch = false, initAudio, corruptAsset, powerMutation, supplementalMutation, lootSeed = 5062979} = {}) {
  const work = {raf: 0, timers: 0, intervals: 0, canvases: 0, writes: [], profiles: [], audio: [], cues: [], events: [], decoded: [], celDraws: {}, powerDraws: [], lastCels: [], lastDraws: [], lastRotations: [], lastTexts: [], storyReceipts: [], fetched: []};
  let supplementalOverride = null;
  if (supplementalMutation) {
    const bank = JSON.parse(fs.readFileSync(path.join(root,'assets/mac-combat-frames/mac-combat-frames-v1.json'),'utf8'));
    const spec = bank.actors.find(actor => actor.kind === 'mac').supplemental;
    const registration = JSON.parse(fs.readFileSync(path.join(root,spec.registration),'utf8'));
    supplementalMutation(registration);
    const bytes = Buffer.from(JSON.stringify(registration));
    supplementalOverride = {path:spec.registration,bytes,hash:createHash('sha256').update(bytes).digest('hex')};
  }
  let now = 1000, nextRaf = 0; const scheduled = new Map(), pads = [];
  const doc = new EventTarget(); doc.readyState = 'loading'; doc.hidden = false;
  const ctx = canvas => new Proxy({canvas, stack:[], rotation:0, lastTranslate:null,clipRegion:null,currentPath:[], measureText: text => ({width: String(text).length * 12}),
    save() { (this.stack ||= []).push({position:this.lastTranslate,rotation:this.rotation || 0,clipRegion:this.clipRegion}); },
    restore() { const saved=this.stack?.pop();if(saved){this.lastTranslate=saved.position;this.rotation=saved.rotation;this.clipRegion=saved.clipRegion;} },
    beginPath(){this.currentPath=[];},moveTo(x,y){this.currentPath.push({move:true,x,y});},lineTo(x,y){this.currentPath.push({x,y});},clip(){this.clipRegion=this.currentPath.map(point=>({...point}));},
    fillText(text,x,y){work.lastTexts.push({text:String(text),x,y,font:this.font});},
    drawImage(image, ...args) { if (args.length === 8 && /assets\/mac-(?:combat-frames|street-dynamic)\//.test(image.src || '')) {
      const call={path:image.src,args,position:this.lastTranslate,rotation:this.rotation || 0,clipRegion:this.clipRegion};work.celDraws[image.src] = (work.celDraws[image.src] || 0) + 1;work.lastCels.push(call);work.lastDraws.push(call);
    } else if (args.length === 8 && image.src?.startsWith('assets/mac-street-power/')) {const call={path:image.src,args,position:this.lastTranslate,rotation:this.rotation || 0,clipRegion:this.clipRegion};work.powerDraws.push(call);work.lastDraws.push(call);} }, translate(x,y) { this.lastTranslate=[x,y]; }, rotate(angle) { this.rotation=(this.rotation || 0)+angle;work.lastRotations.push(angle); },
    getTransform: () => ({a: 1, b: 0, c: 0, d: 1, e: 0, f: 0})}, {get(obj, key) { return key in obj ? obj[key] : () => {}; }});
  doc.createElement = tag => { const e = new Element(tag, doc); if (tag === 'canvas') { work.canvases++; e.getContext = () => e.context ||= ctx(e); } return e; };
  doc.documentElement = doc.createElement('html'); doc.body = doc.createElement('body'); doc.body.parentNode = doc;
  doc.documentElement.appendChild(doc.body);
  doc.getElementById = id => doc.documentElement.querySelector('#' + id);
  doc.querySelector = s => doc.documentElement.querySelector(s); doc.querySelectorAll = s => doc.documentElement.querySelectorAll(s);
  for (const id of ['startOverlay', 'loadingIndicator', 'startButton', 'continueButton', 'settingsButton', 'gameCanvas']) {
    const e = doc.createElement(id === 'gameCanvas' ? 'canvas' : id.endsWith('Button') ? 'button' : 'div');
    e.id = id; if (id === 'continueButton') e.hidden = true; if (id === 'gameCanvas') { e.width = 1920; e.height = 1080; } doc.body.appendChild(e);
  }
  const win = new EventTarget();
  let seedRequests = 0;
  const testCrypto = {subtle:webcrypto.subtle, getRandomValues(values) {
    for(let i=0;i<values.length;i++) values[i]=(lootSeed+seedRequests+i)>>>0;
    seedRequests++;work.seedRequests=seedRequests;return values;
  }};
  Object.assign(win, {document: doc, console, Math, Date, Map, Set, URLSearchParams, crypto: testCrypto, TextDecoder, Uint8Array,
    location: {search: '?preview=mac-firstslice'}, innerWidth: 390, innerHeight: 844,
    performance: {now: () => now}, navigator: {maxTouchPoints: touch ? 5 : 0, getGamepads: () => pads},
    matchMedia: query => ({matches: touch && /coarse|hover:\s*none/.test(query), addEventListener() {}, removeEventListener() {}}),
    localStorage: {getItem() { return null; }, setItem(key, value) { work.writes.push([key, value]); }, removeItem(key) { work.writes.push([key, null]); }},
    gameState: {running: false, paused: false, gameOver: false, victory: false}, isRunning: false, isPaused: false,
    requestAnimationFrame(callback) { work.raf++; const handle = ++nextRaf; scheduled.set(handle, callback); return handle; },
    cancelAnimationFrame(handle) { scheduled.delete(handle); },
    setTimeout() { work.timers++; throw Error('Unexpected timer owner in preview integration'); }, clearTimeout() {},
    setInterval() { work.intervals++; throw Error('Unexpected interval owner in preview integration'); }, clearInterval() {},
    Image: class {async decode() {
      work.decoded.push(this.src);
      const data = fs.readFileSync(path.join(root, this.src));
      if (data.subarray(1, 4).toString() === 'PNG') {
        this.width = data.readUInt32BE(16); this.height = data.readUInt32BE(20); return;
      }
      assert.equal(data.toString('ascii',8,12),'WEBP');
      for (let offset=12; offset+8<=data.length;) {
        const kind=data.toString('ascii',offset,offset+4),size=data.readUInt32LE(offset+4),start=offset+8;
        if(kind==='VP8X'){this.width=1+data.readUIntLE(start+4,3);this.height=1+data.readUIntLE(start+7,3);return;}
        if(kind==='VP8L'){const bits=data.readUInt32LE(start+1);this.width=1+(bits&0x3fff);this.height=1+((bits>>>14)&0x3fff);return;}
        if(kind==='VP8 '){this.width=data.readUInt16LE(start+6)&0x3fff;this.height=data.readUInt16LE(start+8)&0x3fff;return;}
        offset=start+size+(size&1);
      }
      assert.fail('Native image dimensions unavailable: '+this.src);
    }},
    fetch: async url => {
      work.fetched.push(url); let bytes = fs.readFileSync(path.join(root, url));
      if (supplementalOverride && url === supplementalOverride.path) bytes = supplementalOverride.bytes;
      if (supplementalOverride && url === 'assets/mac-combat-frames/mac-combat-frames-v1.json') {
        const bank = JSON.parse(bytes);bank.actors.find(actor => actor.kind === 'mac').supplemental.registrationSHA256 = supplementalOverride.hash;bytes = Buffer.from(JSON.stringify(bank));
      }
      if(powerMutation&&url==='assets/mac-street-power/mac-street-power-v1.json') {const manifest=JSON.parse(bytes);powerMutation(manifest);bytes=Buffer.from(JSON.stringify(manifest));}
      if (corruptAsset === url) { bytes = Buffer.from(bytes); bytes[Math.floor(bytes.length / 2)] ^= 1; }
      return {ok: true, json: async () => JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, '')),
        arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)};
    },
    titleScreen: {hide() {}, show() {}},
    initAudio: initAudio || (async () => { work.audio.push('init'); }),
    audioSystem: {context: {currentTime: 2}, layersStarted: false,
      getOutputAudioTime: t => t, getContextState: () => 'running',
      stopRuntimeAudio() { this.layersStarted = false; work.audio.push('stop'); return {ok: true}; },
      prepareActiveMusicProfile: async () => ({ok: true}),
      startRuntimeGameplayMusic() { this.layersStarted = true; work.audio.push('start'); return {ok: true}; },
      pauseRuntimeAudio: async () => ({ok: true}), resumeRuntimeAudio: async () => ({ok: true}),
      playSound: name => work.audio.push(name), playCombatCue: (kind, options) => work.cues.push({kind,options}), updateLayers() {}, setMusicVolume() {}, setSFXVolume() {}, setRhythmVolume() {}},
    player: {setRunHeld() {}}});
  win.window = win; doc.defaultView = win; doc.parentNode = win;
  const context = vm.createContext(win), load = file => vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, {filename: file});
  load('src/core/gamepad-ui.js'); load('src/core/action-input.js'); load('src/core/input.js');
  const B = win.BARCODE;
  B.MusicProfiles = {select(id) { work.profiles.push(['select', id]); return {id}; }};
  B.MusicTransport = {load(id) { work.profiles.push(['load', id]); return {status: 'ok'}; }, getDiagnostics: () => ({})};
  B.Campaign = {resetSession() { assert.fail('Private preview must not initialize a campaign'); }, syncTitleButton() {}};
  B.LoreRecords = {catalog: [], getCatalog: () => [], chapters: () => []};
  load('src/game/pause-menu.js'); load('src/core/runtime-lifecycle.js'); load('src/core/loop.js');
  load('src/game/mac-street-combat.js'); load('src/game/mac-street-story.js'); load('src/game/mac-combat-frames.js'); load('src/game/mac-combat-preview.js');
  const manager = win.inputManager = new win.InputManager();
  doc.readyState = 'complete'; load('src/core/touch-controls.js');
  const globalListeners = () => [...win.listeners.values(), ...doc.listeners.values()].reduce((sum, items) => sum + items.length, 0);
  const key = (type, value, repeat = false) => win.dispatchEvent({type, key: value, repeat, timeStamp: now});
  const pointer = (element, type, id, x = 90, y = 670) => element.dispatchEvent({type, pointerId: id, pointerType: 'touch', clientX: x, clientY: y,
    button: 0, buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1, timeStamp: now, bubbles: true});
  const r = {w: win, doc, B, manager, work, pads, scheduled, key, pointer, globalListeners,
    async start() { const result = await B.RuntimeLifecycle.start({privatePreview: 'mac-firstslice'}); assert(result.ok, JSON.stringify(result)); return result; },
    frame(dt = 1000 / 60) {
      work.lastCels = []; work.lastDraws = []; work.lastRotations = []; work.lastTexts = [];
      const handle = win.gameLoopRafHandle; assert(scheduled.has(handle), 'existing gameplay owner has the next frame');
      const callback = scheduled.get(handle); scheduled.delete(handle); now += dt; callback(now);
      if (r.lastEventBatch !== B.MacCombatPreview.lastEvents) {r.lastEventBatch=B.MacCombatPreview.lastEvents;work.events.push(...(r.lastEventBatch || []));}
      assert(scheduled.size <= 1, 'at most one gameplay RAF');
      const snapshot = B.MacCombatPreview.getSnapshot(), beforeIds = r.previousStoryCueIds || [];
      const addedIds = (snapshot.gameplayCueIds || []).filter(id => !beforeIds.includes(id));
      if (addedIds.length) {
        const earned = B.MacStreetStory.gameplayCues(B.MacCombatPreview.lastEvents || [], snapshot.combat, beforeIds);
        for (const id of addedIds) {
          assert(earned.cues.some(cue => cue.id === id), 'The actual wrapper admits only a cue earned by this event batch and snapshot');
          work.storyReceipts.push({id,atMs:snapshot.combat.elapsedMs,zoneId:snapshot.combat.zone.id});
        }
      }
      r.previousStoryCueIds = [...snapshot.gameplayCueIds || []];
      assert((B.MacCombatPreview.radioQueue || []).length <= 3, 'Existing radio queue stays bounded');
      if (snapshot.phase === 'street') assert((B.MacCombatPreview.radioQueue || []).every(cue => !cue.zoneId || cue.zoneId === snapshot.combat.zone.id), 'Queued narration cannot follow Mac into a different district');
      return snapshot;
    },
    run(ms) { for (let n = 0; n < Math.round(ms / (1000 / 60)); n++) r.frame(); return B.MacCombatPreview.getSnapshot(); },
    until(predicate, input, limit = 6000) { for (let n = 0; n < limit; n++) { const s = B.MacCombatPreview.getSnapshot(); if (predicate(s)) return s;
      input?.(s); r.frame(); } assert.fail('Timed out: ' + JSON.stringify(B.MacCombatPreview.getSnapshot())); },
    button(id) { B.TouchControls.sync(); const node = B.TouchControls.buttons.get(id)?.node; assert(node, 'visible direct button ' + id); return node; },
    pad() { if (!pads[0]) { pads[0] = {id: 'Xbox test controller', index: 0, connected: true, mapping: 'standard', axes: [0, 0], buttons: Array.from({length: 17}, () => ({pressed: false, value: 0}))}; r.frame(); } return pads[0]; }};
  return r;
}
const settle = async () => { for (let n = 0; n < 12; n++) await Promise.resolve(); };
const workUnusedAtlases = paths => paths.every(file => !/mac-combat-rigs\/|mac-poses-v3\.png|mac-attacks-v4\.png|mac-city-review\/(?:chitin_scuttler|psion_lancer|bile_spitter|prism_guard|rift_stalker|shock_mantid|null_regent)-.*\.png/.test(file));
function assertWholeFrame(r) {
  const mac=r.B.MacCombatPreview,s=mac.combat.getSnapshot(),camera=mac.cameraX;
  const actors=[{kind:'mac',actor:s.player},...s.enemies.filter(e=>(e.hp>0||e.launched||e.knockdownMs>0||e.phase==='defeated'&&e.animation.ageMs<600)&&e.x-camera>-220&&e.x-camera<1920/1.35+220).map(actor=>({kind:actor.kind,actor}))];
  const wholeCels=r.work.lastCels.filter(call=>!call.clipRegion);
  assert.equal(wholeCels.length,actors.length,'One complete cel per actual visible actor; a palm mask may redraw that exact same native cel');
  assert(r.work.lastCels.every(call=>call.rotation===0),'Complete actor cels never rotate; whole held items may turn');
  const selected = new Map(), used = new Set();
  for(let i=0;i<actors.length;i++) {
    const {kind,actor}=actors[i],art=mac.frameArt.get(kind),height=kind==='null_regent'?335:260;
    const stateAgeMs=kind==='mac'&&mac.playerDefeatedAtMs!==null?s.elapsedMs-mac.playerDefeatedAtMs+mac.elapsedMs-mac.playerDefeatedHostAtMs:undefined;
    const landingAgeMs=kind==='mac'&&mac.playerLandedAtMs!==null?s.elapsedMs-mac.playerLandedAtMs:undefined;
    const guardImpactAgeMs=kind==='mac'&&mac.guardBlockedAtMs!==null?s.elapsedMs-mac.guardBlockedAtMs:undefined;
    const pose=r.B.MacCombatFrames.sample(actor,{compiled:art.compiled,supplemental:art.supplemental,player:kind==='mac',stateAgeMs,landingAgeMs,guardImpactAgeMs}),frame=pose.frame,scale=height/frame.standingHeight;
    const downStartsMs=art.compiled.clips.defeat.frames.at(-1).startMs;
    const elevation=kind==='mac'&&pose.action==='defeat'?(actor.elevation||0)*(1-Math.max(0,Math.min(1,pose.clipTimeMs/Math.max(1,downStartsMs)))):actor.elevation||0;
    const position=[actor.x-camera,actor.laneY-elevation-frame.baselineLift*height/260];
    const call=wholeCels.find(call=>!used.has(call)&&call.path===frame.sourceImage&&call.position[0]===position[0]&&call.position[1]===position[1]);
    assert(call,'Every actual visible actor has its own exact selected native sheet and feet registration');
    used.add(call);selected.set(actor,call);
    assert.equal(call.path,frame.sourceImage,'Exact selected native sheet');
    assert.deepEqual(call.args,[frame.source.x,frame.source.y,frame.source.width,frame.source.height,
      -frame.feetPivot.x*scale,-frame.feetPivot.y*scale,frame.source.width*scale,frame.source.height*scale],'Exact authored crop, uniform scale and pivot');
    assert.deepEqual(call.position,position,'Whole-cel registration follows actual flight and grounds finite defeat');
    for(const palm of r.work.lastCels.filter(call=>call.clipRegion&&call.path===frame.sourceImage&&call.args[0]===frame.source.x&&call.args[1]===frame.source.y)) {
      assert.deepEqual(palm.args,call.args,'Palm overdraw retains the full exact authored crop and pixel density');
      assert.deepEqual(palm.position,call.position,'Palm overdraw retains the same complete actor transform');
    }
  }
  const macCall=selected.get(s.player),macIndex=r.work.lastDraws.indexOf(macCall);
  const near=s.enemies.filter(e=>e.hp>0&&Math.abs(e.x-s.player.x)<160&&Math.abs(e.laneY-s.player.laneY)<=32);
  for(const {kind,actor} of actors.slice(1)) {
    const enemyIndex=r.work.lastDraws.indexOf(selected.get(actor));
    if(near.includes(actor)) {
      assert(macIndex>enemyIndex,'Mac remains visible over a living foe engaged on the same close fighting plane');
      (r.work.depthProof ||= new Set()).add(kind==='null_regent'?'close-boss':'close-ordinary');
    } else if(Math.abs(actor.laneY-s.player.laneY)>40||!near.length) {
      if(actor.laneY<s.player.laneY) assert(enemyIndex<macIndex,'A fighter in the distant upper floor lane stays behind Mac');
      else if(actor.laneY>s.player.laneY) assert(enemyIndex>macIndex,'A fighter in the distant lower floor lane stays in front of Mac');
      if(Math.abs(actor.laneY-s.player.laneY)>40)(r.work.depthProof ||= new Set()).add('separate-lanes');
    }
  }
  for(const prop of s.props.filter(prop=>prop.kind!=='relay'&&prop.heldBy!=='mac'&&Math.abs(prop.laneY-s.player.laneY)>40)) {
    const cell=mac.powerArt.cells[mac.propCell(prop)],sheet=mac.powerArt.sheets.get(cell.sheet);
    const propCall=r.work.lastDraws.find(call=>call.path===sheet.sourceImage&&call.args[0]===cell.source.x&&call.args[1]===cell.source.y&&
      call.position[0]===prop.x-camera+(prop.recoil?.x||0));
    assert(propCall,'Actual street prop retains its native registered draw');
    const propIndex=r.work.lastDraws.indexOf(propCall);
    assert(prop.laneY<s.player.laneY?propIndex<macIndex:propIndex>macIndex,'Separate prop floor lanes keep their painter order');
    (r.work.depthProof ||= new Set()).add('separate-props');
  }
}
const pressKey = (r, key) => { r.key('keydown', key); r.frame(); r.key('keyup', key); };
function assertNativeShots(r) {
  const mac=r.B.MacCombatPreview,s=mac.combat.getSnapshot(),p=s.player,shots=s.projectiles.filter(shot=>shot.owner==='player'&&shot.ageMs<=25&&shot.weaponKind===p.attack?.weaponKind);
  if(!shots.length)return;
  const art=mac.frameArt.get('mac'),pose=r.B.MacCombatFrames.sample(p,{player:true,compiled:art.compiled,supplemental:art.supplemental});
  const kind=p.attack.weaponKind,owned=art.supplemental?.clips['weapon_'+kind+'.active'],bodyScale=260/pose.standingHeight;
  let forward,elevation;
  if(owned) {
    assert.equal(pose.clipKey,'weapon_'+kind+'.active');assert.equal(pose.frame.embeddedWeapon,kind);
    assert.equal(pose.weaponStowed,false);assert(pose.shotAnchor);assert.equal(pose.shotAnchor,pose.frame.shotAnchor);
    forward=(pose.shotAnchor.x-pose.frame.feetPivot.x)*bodyScale;
    elevation=(pose.frame.feetPivot.y-pose.shotAnchor.y)*bodyScale+pose.frame.baselineLift;
  } else {
    assert.equal(pose.clipKey,'fire.active');assert(pose.gripAnchor);
    const cell=mac.powerArt.cells['weapon_'+kind],scale=cell.displayHeight/cell.source.height;
    const muzzle=cell.muzzle||cell.grip,angle=pose.weaponAngle,dx=(muzzle.x-cell.grip.x)*scale,dy=(muzzle.y-cell.grip.y)*scale;
    forward=(pose.gripAnchor.x-pose.frame.feetPivot.x)*bodyScale+dx*Math.cos(angle)-dy*Math.sin(angle);
    elevation=(pose.frame.feetPivot.y-pose.gripAnchor.y)*bodyScale+pose.frame.baselineLift-dx*Math.sin(angle)-dy*Math.cos(angle);
  }
  for(const shot of shots) {
    assert(Math.abs(shot.elevation-elevation)<.01,'Actual player shot starts at the registered native muzzle height');
    const origin=shot.x-shot.vx*shot.ageMs/1000;
    assert(Math.abs(origin-(p.x+p.facing*forward))<=r.B.MacStreetCombat.constants.moveSpeed*shots[0].ageMs/1000+.01,'Physical muzzle follows the whole native gun, including at most one shared-frame movement');
    const image=mac.powerArt.cells['projectile_'+shot.kind],sheet=mac.powerArt.sheets.get(image.sheet);
    assert(r.work.lastDraws.some(call=>call.path===sheet.sourceImage&&call.args[0]===image.source.x&&call.args[1]===image.source.y&&call.position[0]===shot.x-mac.cameraX&&call.position[1]===shot.laneY-shot.elevation),'Existing shared frame draws the native shot at its actual world position');
    (r.work.nativeShotKinds ||= new Set()).add(shot.kind);
  }
}
function assertStreetHud(r) {
  const mac = r.B.MacCombatPreview, s = mac.combat.getSnapshot(), drawn = r.work.lastTexts;
  const has = (text,x,y) => drawn.some(call => call.text === text && call.x === x && call.y === y);
  if (s.wave.state === 'combat' && !s.zone.cleared && !s.desk.unlocked) {
    const expected = `${s.zone.encounter.name} · ${s.wave.number} / 2`;
    assert(has(expected,1740,30), 'Real HUD names the actual current enemy pairing');
    const key = `${s.zone.index}:${s.wave.number}`;
    (r.work.hudEncounters ||= new Map()).set(key, s.zone.encounter.name);
    assert(drawn.some(call => call.x === 1740 && call.y === 67 &&
      (call.text === s.zone.encounter.objective || call.text.endsWith('…') && s.zone.encounter.objective.startsWith(call.text.slice(0,-1)))),
    'Fitted fight hint retains the real current objective, including host-measured ellipsis');
  }
  if (s.boss?.hp > 0) {
    assert(has(`NULL REGENT · ${s.boss.phase} / 3 · ${s.boss.phaseName}`,960,125), 'Boss HUD names the earned live phase');
    (r.work.bossHudPhases ||= new Set()).add(s.boss.phase);
    if (!mac.tutorial.skipped && !mac.tutorial.completed && !s.player.grapple && !s.player.carry &&
      ['warning','committed','punish'].includes(s.boss.window)) {
      assert(mac.tutorialReadout.hidden, 'Ordinary teaching cannot cover a live boss warning or exposed timer');
      (r.work.bossCoachWindows ||= new Set()).add(s.boss.window);
    }
    const exposedText = drawn.find(call => call.x === 960 && call.y === 177 && call.text.startsWith('EXPOSED'));
    if (s.boss.window === 'punish' && s.boss.punishRemainingMs > 0) {
      assert(exposedText);
      assert.equal(exposedText.text, `EXPOSED · ${(s.boss.punishRemainingMs/1000).toFixed(1)}s · HIT HIM`, 'Exposed HUD reads the true remaining combat clock');
      const record = {phase:s.boss.phase,atMs:s.elapsedMs,remainingMs:s.boss.punishRemainingMs,text:exposedText.text};
      const prior = r.work.lastExposedHud;
      if (prior && prior.phase === record.phase && record.atMs > prior.atMs && record.remainingMs < prior.remainingMs)
        r.work.exposedHudAdvanced = true;
      r.work.lastExposedHud = record;
    } else assert.equal(exposedText, undefined, 'HUD cannot advertise a punish window during armor or expired recovery');
  }
  for (const enemy of s.enemies.filter(e => e.hp > 0 && e.phase === 'windup' && e.attackTell?.response &&
    e.x-mac.cameraX>-220 && e.x-mac.cameraX<1920/1.35+220)) {
    const expected = enemy.attackTell.response.toUpperCase();
    const labelY = enemy.laneY-(enemy.kind==='null_regent'?360:285)-43;
    const labelX = Math.max(135,Math.min(1287,enemy.x-mac.cameraX));
    const label = drawn.find(call => call.x === labelX && call.y === labelY &&
      (call.text === expected || call.text.endsWith('…') && expected.startsWith(call.text.slice(0,-1))));
    assert(label, 'Actual committed tell draws its matching response label above this enemy');
    (r.work.tellResponses ||= new Set()).add(enemy.attackTell.response);
    responseCoverage.add(enemy.attackTell.response);
  }
}
async function fightRoute(r,{until,equipWeapons=true,combatLane}={}) {
  const actionInput = r.manager.actionInput;
  let strikeHeld = false, throwHeld = false;
  const areas = new Set(), waves = new Set(), bossPhases = new Set();
  for (let frame = 0; frame < 30000; frame++) {
    const s = r.B.MacCombatPreview.getSnapshot();
    if (until?.(s)) {actionInput.releaseVirtualOwner('route');return s;}
    if (s.combat.desk.unlocked || s.status === 'failed') {
      assert.deepEqual([...areas], [1, 2, 3, 4, 5, 6]);
      assert.equal(waves.size, 12); assert(bossPhases.has(2) && bossPhases.has(3));
      return s;
    }
    const state = s.combat, p = state.player, c = r.B.MacCombatPreview.getControlState();
    areas.add(state.zone.index); waves.add(`${state.zone.index}:${state.wave.index}`);
    if (state.boss) bossPhases.add(state.boss.phase);
    const foe = state.enemies.filter(e => e.hp > 0 && e.phase !== 'dormant')
      .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const gunShot={ 'scatter-blaster':'scatter-bolt','coil-rifle':'coil-bolt','plasma-disc':'plasma-disc' };
    const pendingShot=gunShot[p.weapon?.kind]&&!r.work.nativeShotKinds?.has(gunShot[p.weapon.kind]);
    const cache=equipWeapons&&!pendingShot?state.pickups.filter(item=>item.kind==='weapon'&&item.source==='street-cache'&&item.zoneId===state.zone.id)
      .sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0]:null;
    actionInput.releaseVirtualOwner('route');
    const hold = name => actionInput.setVirtualAction(name, 'route', true, {timeStamp: r.w.performance.now()});
    if(c.interactAvailable) {
      if(r.B.TouchControls.enabled) { const link=r.button('inspect');assert.match(link.textContent,/Link/);r.pointer(link,'pointerdown',91);r.pointer(link,'pointerup',91);r.work.relayTouchUses=(r.work.relayTouchUses||0)+1; }
      else hold('inspect');
    }
    if (cache && c.throw.ready && c.throw.targetType === 'weapon' && c.throw.targetId===cache.id && !throwHeld) {hold('road_disrupt');throwHeld=true;strikeHeld=false;}
    else if (cache && (!foe || Math.abs(foe.x-p.x)>145 && Math.abs(cache.x-p.x)<140)) {
      if(Math.abs(cache.x-p.x)>7)hold(cache.x>p.x?'move_right':'move_left');
      if(Math.abs(cache.laneY-p.laneY)>5)hold(cache.laneY>p.laneY?'move_down':'move_up');
      throwHeld=false;strikeHeld=false;
    }
    else if (!foe) {hold('move_right');throwHeld=false;strikeHeld=false;}
    else {
      const direction = Math.sign(foe.x - p.x) || p.facing;
      const ranged = ['scatter-blaster','coil-rifle','plasma-disc'].includes(p.weapon?.kind), attackReach = ranged ? p.weapon.kind==='coil-rifle'?650:330 : 100;
      if (Math.abs(foe.x - p.x) > (ranged ? 230 : 58) || p.facing !== direction) hold(direction > 0 ? 'move_right' : 'move_left');
      const targetLane = combatLane ?? foe.laneY;
      if (Math.abs(targetLane - p.laneY) > (combatLane === undefined ? 8 : 3)) hold(targetLane > p.laneY ? 'move_down' : 'move_up');
      let strike = false, throwing = false;
      const incoming = state.projectiles.find(item => item.owner !== 'player' && (item.x-p.x)*item.facing < 0 && Math.abs(item.x-p.x)<145 && Math.abs(item.laneY-p.laneY)<=item.laneReach+10);
      const warning = state.enemies.filter(e => e.hp > 0 && e.phase === 'windup' && Math.abs(e.attackLaneY-p.laneY)<45 && Math.abs(e.x-p.x)<330)
        .sort((a,b)=>(a.tellMs-a.phaseMs)-(b.tellMs-b.phaseMs))[0];
      const remaining = warning ? warning.tellMs-warning.phaseMs : Infinity;
      if (foe.kind === 'null_regent' && foe.phase === 'active') {
        actionInput.releaseVirtualOwner('route');
        if (foe.attackSpec.guardable !== false) hold('road_defend');
        else if (c.jump.ready) hold('jump');
        else hold(p.laneY > 875 ? 'move_up' : 'move_down');
      } else if (foe.kind === 'null_regent' && state.projectiles.some(item => item.owner !== 'player' && Math.abs(item.x-p.x)<430 && Math.abs(item.laneY-p.laneY)<55)) {
        actionInput.releaseVirtualOwner('route');
        if (incoming && c.jump.ready) hold('jump'); else hold('road_defend');
      } else if (incoming && c.jump.ready) hold('jump');
      else if (warning && remaining < (warning.kind === 'null_regent' ? 650 : 310) && (warning.kind === 'null_regent' || !p.attack && !p.throwMs)) {
        actionInput.releaseVirtualOwner('route');
        if (warning.attackTell.guardable === false && remaining < 250 && c.jump.ready) hold('jump');
        else if (warning.attackTell.guardable !== false && remaining < 105) hold('road_defend');
        else if (warning.attackTell.guardable === false && p.elevation === 0) hold(p.laneY > 875 ? 'move_up' : 'move_down');
      } else if (!pendingShot && c.throw.ready && c.throw.targetType === 'enemy' && !throwHeld) { hold('road_disrupt'); throwing = true; }
      else if (c.strike.ready && !strikeHeld && Math.abs(foe.x - p.x) <= attackReach && Math.abs(foe.laneY - p.laneY) <= 35) { hold('road_attack'); strike = true; }
      strikeHeld = strike; throwHeld = throwing;
    }
    r.frame(); assertNativeShots(r); assertStreetHud(r); if (frame % 90 === 0) {assertWholeFrame(r);await settle();}
  }
  assert.fail('City route timed out: ' + JSON.stringify(r.B.MacCombatPreview.getSnapshot()));
}
let groups = 0;
const responseCoverage = new Set();
async function check(name, body) {
  const selected=process.argv.indexOf('--only-group');
  if(selected>=0&&!name.includes(process.argv[selected+1]))return;
  await body(); groups++; console.log('PASS Mac integration ' + name);
}
async function run() {
  await check('registration and native sheet hash mismatches reject entry without a part-rig fallback', async () => {
    const bank=JSON.parse(fs.readFileSync(path.join(root,'assets/mac-combat-frames/mac-combat-frames-v1.json'),'utf8'));
    const actor=bank.actors.find(a=>a.kind==='mac'),registration=JSON.parse(fs.readFileSync(path.join(root,actor.registration),'utf8'));
    const nativeSheet=registration.sheets?.[0]?.sourceImage||registration.sourceImage;
    assert(actor.supplemental,'Shipping index declares native supplemental actions');
    const dynamic=JSON.parse(fs.readFileSync(path.join(root,actor.supplemental.registration),'utf8'));
    const power=JSON.parse(fs.readFileSync(path.join(root,'assets/mac-street-power/mac-street-power-v1.json'),'utf8'));
    for(const corruptAsset of [actor.registration,nativeSheet,actor.supplemental.registration,dynamic.sheets[0].sourceImage,power.sheets[0].sourceImage]) {
      const r=rig({corruptAsset});await assert.rejects(r.B.MacCombatPreview.prepare(),/mac-frame-asset-hash-mismatch/);
      assert.equal(r.B.MacCombatPreview.frameArt.size,0);assert.equal(r.scheduled.size,0);
      assert(workUnusedAtlases(r.work.decoded));assert.deepEqual(r.work.audio,[]);assert.deepEqual(r.work.writes,[]);
      r.B.MacCombatPreview.dispose();await settle();
    }
  });
  await check('validly hashed supplemental actions reject a different base registration path or hash', async () => {
    for (const supplementalMutation of [registration => {registration.baseRegistration = 'assets/mac-combat-frames/other-actor.json';}, registration => {registration.baseRegistrationSHA256 = '0'.repeat(64);}]) {
      const r = rig({supplementalMutation});
      await assert.rejects(r.B.MacCombatPreview.prepare(),/mac-dynamic-base-registration-mismatch/);
      assert.equal(r.B.MacCombatPreview.frameArt.size,0);assert.equal(r.scheduled.size,0);
      assert.deepEqual(r.work.audio,[]);assert.deepEqual(r.work.writes,[]);
      r.B.MacCombatPreview.dispose();await settle();
    }
  });
  await check('private lifecycle start/exit owns one frame and restores custom source bindings', async () => {
    const r = rig(), input = r.manager.actionInput;
    input.remap('jump', ['z', 'arrowup']); input.remap('road_attack', ['q']); const original = plain(input.keyboardBindings), listeners = r.globalListeners();
    await r.start(); assert(r.B.MacCombatPreview.requested()); assert.equal(r.B.RuntimeLifecycle.getState(), 'running');
    assert.equal(r.scheduled.size, 1); assert.deepEqual(plain(input.keyboardBindings.jump), [' ']);
    assert.equal(r.work.canvases, 1, 'Mac prepare/enter creates no canvas'); assert.equal(r.work.timers, 0); assert.equal(r.work.intervals, 0);
    r.run(200); assert.equal(r.globalListeners(), listeners);
    assert.equal(r.B.MacCombatPreview.frameArt.size, 8, 'Exactly eight complete native character registrations are resident');
    assert(r.B.MacCombatPreview.frameArt.get('mac').supplemental?.complete,'Expanded actions load the complete registered native Mac supplement');
    for(const art of r.B.MacCombatPreview.frameArt.values()) {
      assert(art.compiled.complete);assert.equal(art.images.size,art.compiled.sheetIds.length+(art.supplemental?.sheetIds.length || 0));
      for(const sheet of Object.values(art.compiled.sheets)) assert(r.work.fetched.includes(sheet.sourceImage),'Every exact native image is hash checked');
      for(const sheet of Object.values(art.supplemental?.sheets || {})) assert(r.work.fetched.includes(sheet.sourceImage),'Every dynamic native sheet is also hash checked');
    }
    assert(workUnusedAtlases(r.work.decoded), 'Part rigs and retained historical pose atlases are not decoded');
    await r.B.MacCombatPreview.exit(); assert.equal(r.scheduled.size, 0); assert.equal(r.B.RuntimeLifecycle.getState(), 'idle');
    assert.equal(r.B.MacCombatPreview.active, false); assert.deepEqual(plain(input.keyboardBindings), original);
    assert.deepEqual(r.work.writes, []); assert.equal(r.doc.getElementById('startOverlay').classList.contains('hidden'), false);
  });
  await check('native props and three blood colors verify exact bytes and uniform registered cells through the real renderer', async () => {
    const r=rig();await r.start();r.manager.touchCommand('mac:skip');r.frame();const mac=r.B.MacCombatPreview,art=mac.powerArt;
    assert(art.sheets.size>=2&&art.sheets.size<=8);assert(Object.keys(art.cells).length>=44&&Object.keys(art.cells).length<=128);
    for(const sheet of art.sheets.values()) {assert(r.work.fetched.includes(sheet.sourceImage));assert(r.work.decoded.includes(sheet.sourceImage));}
    for(const name of ['crate_intact','crate_cracked','crate_broken','blood_red_impact','blood_green_heavy','blood_purple_floor',
      'car_intact','barrel_broken','fixture_streetlight_cracked','fixture_terminal_intact','weapon_shock-baton','weapon_coil-rifle','pickup_overdrive','projectile_plasma-disc']) {
      const cell=art.cells[name],sheet=art.sheets.get(cell.sheet),before=r.work.powerDraws.length;
      mac.drawPowerCell(r.doc.getElementById('gameCanvas').context,name,300,880);const call=r.work.powerDraws[before],scale=cell.displayHeight/cell.source.height;
      assert.equal(call.path,sheet.sourceImage);assert.deepEqual(call.args,[cell.source.x,cell.source.y,cell.source.width,cell.source.height,-cell.pivot.x*scale,-cell.pivot.y*scale,cell.source.width*scale,cell.source.height*scale]);
    }
    const scale=name=>art.cells[name].displayHeight/art.cells[name].source.height;
    for(const family of ['crate','stall','car','barrel','fixture_streetlight','fixture_terminal']) {
      assert(Math.abs(scale(family+'_intact')-scale(family+'_broken'))<1e-8,'Broken '+family+' keeps intact native density');
      assert(Math.abs(scale(family+'_intact')-scale(family+'_cracked'))<1e-8,'Cracked '+family+' keeps intact native density');
    }
    assert.equal(r.work.canvases,1);assert.equal(r.work.timers,0);assert.equal(r.work.intervals,0);await mac.exit();assert.equal(mac.powerArt,null);
  });
  await check('real native preparation rejects malformed atlas crops, overlapping cells and dimensions before gameplay starts', async () => {
    for(const [powerMutation,error] of [
      [manifest=>{manifest.cells.crate_intact.source.width=99999;},/mac-street-power-cell-invalid/],
      [manifest=>{manifest.cells.crate_cracked.source={...manifest.cells.crate_intact.source};},/mac-street-power-overlapping-cells/],
      [manifest=>{manifest.sheets[0].dimensions.width++;},/mac-street-power-native-dimensions-mismatch/],
      [manifest=>{delete manifest.cells['projectile_coil-bolt'];},/mac-street-power-registration-invalid/],
      [manifest=>{manifest.cells['weapon_pipe'].grip={x:Infinity,y:0};},/mac-street-power-grip-invalid/],
      [manifest=>{manifest.sheets=Array.from({length:9},()=>manifest.sheets[0]);},/mac-street-power-registration-invalid/],
      [manifest=>{manifest.cells.weapon_pipe.itemFrontRegions=[[{x:0,y:0},{x:1,y:1},{x:2,y:2}]];},/mac-street-power-item-region-invalid/],
      [manifest=>{manifest.cells.weapon_pipe.itemFrontRegions=[[{x:0,y:0},{x:99999,y:0},{x:1,y:1}]];},/mac-street-power-item-region-invalid/]
    ]) {const r=rig({powerMutation});await assert.rejects(r.B.MacCombatPreview.prepare(),error);assert.equal(r.B.MacCombatPreview.active,false);assert.equal(r.scheduled.size,0);assert.deepEqual(r.work.audio,[]);r.B.MacCombatPreview.dispose();}
  });
  await check('private review paints every weapon and eligible pose in both directions through native body, item and palm layers', async () => {
    const r=rig();await r.start();
    const html=fs.readFileSync(path.join(root,'mac-equipment-review.html'),'utf8'),script=html.match(/<script id="equipment-review">([\s\S]*?)<\/script>/);
    assert(script);vm.runInNewContext(script[1],{window:r.w});
    const mac=r.B.MacCombatPreview,R=r.B.MacEquipmentReview,art=mac.frameArt.get('mac'),ctx=r.doc.getElementById('gameCanvas').getContext('2d');
    const before=plain(mac.combat.getSnapshot());let painted=0;
    for(const kind of R.weapons)for(const scene of R.scenes)for(const facing of [-1,1]){
      r.work.lastCels=[];r.work.lastDraws=[];
      const placed=R.drawWeapon(ctx,kind,scene,facing,{x:420,feet:390,height:260}),pose=placed.pose;
      const owned=r.B.MacCombatFrames.embeddedWeapons.includes(kind)&&art.supplemental.clips['weapon_'+kind+'.idle'];
      if(scene.action==='hurt') {
        assert.equal(placed.item,null,'Real hit reaction follows the weapon drop; no false retained hold');
        assert(!pose.frame.embeddedWeapon);assert.equal(r.work.lastCels.length,1);
        assert.equal(r.work.lastCels[0].clipRegion,null);assert.equal(r.work.lastCels[0].rotation,0);
        painted++;continue;
      }
      assert.equal(pose.weaponStowed,false,'Retained inventory remains visibly held in flight, kicks, counters and landing');
      if(scene.landingAgeMs!==undefined)assert.equal(pose.clipKey,'landing','Actual landing takes precedence over the ready hold');
      else if(owned&&['idle','walk','run','guard','guard-creep','weapon'].includes(scene.action))
        assert.equal(pose.frame.embeddedWeapon,kind,'Authored ground/fire gun poses keep their complete native cel: '+scene.id);
      if(pose.frame.embeddedWeapon){
        assert.equal(pose.frame.embeddedWeapon,kind);assert.equal(placed.item,null,'Painted-in weapon has no external overlay');
        assert.equal(r.work.lastCels.length,1,'Embedded weapon and actor draw as one complete authored cel');
        assert.equal(r.work.lastDraws.length,1);assert.equal(r.work.lastCels[0].clipRegion,null);
        assert.equal(r.work.lastCels[0].rotation,0);painted++;continue;
      }
      const anchor=pose.supplemental?art.supplemental.frames[pose.frame.id]:art.supplemental.baseGripAnchors[pose.frame.id];
      assert(anchor.itemBindings[kind],'Each weapon has a calibrated binding on '+pose.frame.id);
      assert.deepEqual(plain(pose.gripAnchor),plain(anchor.itemBindings[kind].gripAnchor));
      assert(pose.handOcclusion?.length,'Native palm mask exists for '+kind+'/'+scene.id);
      const body=r.work.lastCels.find(call=>!call.clipRegion),palm=r.work.lastCels.find(call=>call.clipRegion);
      assert(body&&palm);assert.equal(body.rotation,0);assert.equal(palm.rotation,0);
      assert.deepEqual(palm.args,body.args);assert.deepEqual(palm.position,body.position,'Palm remains in the original complete actor transform');
      const cell=mac.powerArt.cells['weapon_'+kind],sheet=mac.powerArt.sheets.get(cell.sheet),items=r.work.lastDraws.filter(call=>call.path===sheet.sourceImage&&call.args[0]===cell.source.x&&call.args[1]===cell.source.y);
      assert(items.length);assert(items.every(call=>call.rotation===pose.weaponAngle));
      assert.deepEqual(items[0].position,[placed.handX,placed.handY]);
      const heldScale=pose.itemScale??1,nativeScale=cell.displayHeight/cell.source.height*heldScale;
      assert(Number.isFinite(heldScale)&&heldScale>0,'Held scale is a finite uniform registration');
      assert.equal(items[0].args[6],cell.source.width*nativeScale,'Held width follows the registered model size');
      assert.equal(items[0].args[7],cell.source.height*nativeScale,'Held height uses the same scale; no distortion');
      if(pose.itemLayer==='behind')assert(r.work.lastDraws.indexOf(items[0])<r.work.lastDraws.indexOf(body),'Body occludes the item handle');
      else assert(r.work.lastDraws.indexOf(items[0])>r.work.lastDraws.indexOf(body));
      assert(r.work.lastDraws.indexOf(palm)>r.work.lastDraws.indexOf(items.at(-1)),'Native palm closes over the actual handle');
      const expected=pose.handOcclusion.flatMap(polygon=>polygon.map((point,index)=>({...(index?{}:{move:true}),x:420+facing*(point.x-pose.frame.feetPivot.x)*260/pose.standingHeight,y:390-(scene.action==='air-kick'?100:scene.elevation||0)-pose.frame.baselineLift+(point.y-pose.frame.feetPivot.y)*260/pose.standingHeight})));
      assert.equal(palm.clipRegion.length,expected.length);
      for(let index=0;index<expected.length;index++){const point=palm.clipRegion[index],target=expected[index];assert.equal(!!point.move,!!target.move);assert(Math.abs(point.x-target.x)<1e-8&&Math.abs(point.y-target.y)<1e-8,'Registered palm polygons mirror with the complete cel');}painted++;
    }
    for(const name of ['crate_intact','crate_cracked','barrel_intact','barrel_cracked'])for(const state of ['floor','carry','release'])for(const facing of [-1,1]) {
      r.work.lastCels=[];r.work.lastDraws=[];
      const placed=R.drawProp(ctx,name,state,{facing}),cell=mac.powerArt.cells[name],sheet=mac.powerArt.sheets.get(cell.sheet);
      const props=r.work.lastDraws.filter(call=>call.path===sheet.sourceImage&&call.args[0]===cell.source.x&&call.args[1]===cell.source.y);
      assert.equal(props.length,1,'The review has one prop owner before and after handoff');
      assert.equal(placed.item,state==='carry'?name:null,'Released props are world objects, never attached to open hands');
      assert(!placed.pose.frame.embeddedWeapon,'Prop review does not draw a phantom weapon');
      assert.equal(r.work.lastCels.filter(call=>!call.clipRegion).length,1,'Prop review retains one complete character cel');
    }
    assert.equal(painted,R.weapons.length*R.scenes.length*2);assert(painted>=432);assert.deepEqual(plain(mac.combat.getSnapshot()),before,'Visual review does not mutate the playable simulation');assert.equal(r.scheduled.size,1);assert.equal(r.work.canvases,1);assert.equal(r.work.timers,0);await mac.exit();
  });
  await check('hands-on lessons use real movement, combo and air-kick receipts; Pause and direct Skip preserve control ownership', async () => {
    const r=rig();await r.start();const mac=r.B.MacCombatPreview;r.manager.touchCommand('mac:skip');r.frame();assert.equal(mac.tutorial.index,0);assert.equal(mac.tutorialReadout.hidden,false);
    assert.match(mac.tutorialText.textContent,/WASD/);const startX=mac.combat.getSnapshot().player.x;r.key('keydown','d');r.run(100);r.key('keyup','d');
    assert(mac.combat.getSnapshot().player.x>startX);assert.equal(mac.tutorial.progress.move,1);
    await r.B.RuntimeLifecycle.pause();r.frame();const frozen=plain(mac.tutorial),clock=mac.combat.getSnapshot().elapsedMs;r.run(200);
    assert.equal(mac.tutorialReadout.hidden,true);assert.equal(mac.combat.getSnapshot().elapsedMs,clock);assert.deepEqual(plain(mac.tutorial),frozen);
    await r.B.RuntimeLifecycle.resume();r.frame();r.run(750);assert.equal(mac.tutorial.index,1);
    pressKey(r,'d');r.frame();r.key('keydown','d');r.run(50);assert(mac.combat.getSnapshot().player.running);r.key('keyup','d');r.run(750);
    assert.equal(mac.tutorial.progress.run,1);assert.equal(mac.tutorial.index,2);
    for(let i=0;i<3;i++){pressKey(r,'j');r.until(s=>!s.combat.player.attack);}
    assert.equal(mac.tutorial.progress.strike,3);r.run(750);assert.equal(mac.tutorial.index,3);
    pressKey(r,' ');r.run(50);pressKey(r,'j');assert.equal(mac.tutorial.progress.air,1);r.run(750);
    assert.equal(mac.tutorialSkip.style.minHeight,'44px');r.key('keydown','d');const before=mac.combat.getSnapshot().player.x;mac.tutorialSkip.click();r.run(100);r.key('keyup','d');
    assert(mac.tutorial.skipped);assert(mac.combat.getSnapshot().player.x>before,'Skipping coach cannot release held movement');assert.equal(mac.tutorialReadout.hidden,true);
    assert.equal(r.scheduled.size,1);assert.deepEqual(r.work.writes,[]);await mac.exit();assert.equal(r.doc.querySelector('.mac-street-coach'),null);
  });
  await check('phone and remapped controller lessons name the controls actually used, with direct controller Skip', async () => {
    const phone=rig({touch:true});await phone.start();phone.manager.touchCommand('mac:skip');phone.frame();const mac=phone.B.MacCombatPreview;
    assert.match(mac.tutorialText.textContent,/joystick/);assert(!phone.B.TouchControls.layout(phone.B.TouchControls.context).some(button=>button.id==='ui:more'));
    phone.pointer(phone.B.TouchControls.joystick,'pointerdown',41);phone.pointer(phone.B.TouchControls.joystick,'pointermove',41,130,670);phone.run(100);
    assert.equal(mac.tutorial.progress.move,1);phone.pointer(phone.B.TouchControls.joystick,'pointercancel',41);await mac.exit();
    const r=rig();await r.start();r.manager.touchCommand('mac:skip');const pad=r.pad(),settings=r.B.ControllerSettings;
    settings.bind('road_attack',4);settings.bind('road_defend',5);settings.bind('road_disrupt',7);r.frame();
    const prompts=r.B.MacCombatPreview.controlPrompts();assert.equal(prompts.strike,settings.prompt('road_attack'));assert.equal(prompts.guard,settings.prompt('road_defend'));assert.equal(prompts.throw,settings.prompt('road_disrupt'));
    pad.buttons[1].pressed=true;r.frame();assert(r.B.MacCombatPreview.tutorial.skipped);pad.buttons[1].pressed=false;r.frame();await r.B.MacCombatPreview.exit();
  });
  await check('real phone kit equips the nearby native pipe and keeps accepted walking and airborne whole cels', async () => {
    const r=rig({touch:true});await r.start();r.manager.touchCommand('mac:skip');r.frame();const mac=r.B.MacCombatPreview,T=r.B.TouchControls,art=mac.frameArt.get('mac');
    r.pointer(T.joystick,'pointerdown',61);r.pointer(T.joystick,'pointermove',61,120,670);
    r.until(()=>mac.getControlState().throw.targetType==='weapon');r.pointer(T.joystick,'pointerup',61,120,670);r.frame();
    const pickup=r.button('road_disrupt');assert.match(pickup.textContent,/Pick up/);r.pointer(pickup,'pointerdown',62);r.pointer(pickup,'pointerup',62);r.frame();
    let p=mac.combat.getSnapshot().player;assert.equal(p.weapon.kind,'pipe');assert.equal(p.weapon.charges,14);assert.equal(mac.tutorial.progress.weapon,1);assert.match(r.button('road_attack').textContent,/Pipe/);
    const cell=mac.powerArt.cells.weapon_pipe,sheet=mac.powerArt.sheets.get(cell.sheet),matching=()=>r.work.lastDraws.filter(call=>call.path===sheet.sourceImage&&call.args.slice(0,4).every((value,i)=>value===[cell.source.x,cell.source.y,cell.source.width,cell.source.height][i]));
    assert(matching().length>0,'Equipped floor weapon appears in the actual Mac draw');
    r.run(300); // Start an ordinary walk after the deliberate double-tap window.
    r.pointer(T.joystick,'pointerdown',63);r.pointer(T.joystick,'pointermove',63,117,670);r.run(50);p=mac.combat.getSnapshot().player;
    let pose=r.B.MacCombatFrames.sample(p,{player:true,compiled:art.compiled,supplemental:art.supplemental});assert.equal(pose.supplemental,false,'Equipped walking retains the accepted bank');assert(pose.gripAnchor);assertWholeFrame(r);
    const held=matching().at(-1),scale=260/pose.standingHeight;
    assert.deepEqual(held.position,[p.x-mac.cameraX+p.facing*(pose.gripAnchor.x-pose.frame.feetPivot.x)*scale,p.laneY-p.elevation-pose.frame.baselineLift+(pose.gripAnchor.y-pose.frame.feetPivot.y)*scale],'Whole item joins the calibrated native hand');
    r.pointer(T.joystick,'pointercancel',63);r.pointer(r.button('jump'),'pointerdown',64);r.frame();r.pointer(r.button('jump'),'pointerup',64);r.run(50);
    p=mac.combat.getSnapshot().player;pose=r.B.MacCombatFrames.sample(p,{player:true,compiled:art.compiled,supplemental:art.supplemental});assert.equal(pose.supplemental,false);assert(pose.gripAnchor);assertWholeFrame(r);assert(matching().length>0,'Weapon stays visible in the accepted jump');
    r.run(850);r.pointer(r.button('road_attack'),'pointerdown',65);r.frame();r.pointer(r.button('road_attack'),'pointerup',65);r.run(150);
    p=mac.combat.getSnapshot().player;assert.equal(p.attack.weaponKind,'pipe');assert.equal(p.weapon.charges,13);assertWholeFrame(r);
    pose=r.B.MacCombatFrames.sample(p,{player:true,compiled:art.compiled,supplemental:art.supplemental});
    assert.equal(pose.clipKey,'pipe-swing.active');assert.equal(pose.frame.embeddedWeapon,'pipe');
    assert.equal(pose.phaseProgress,p.attack.phaseProgress);assert.equal(matching().length,0,'Real equipped pipe swing uses its painted-in bat exactly once');
    await mac.exit();assert.equal(T.pointers.size,0);assert.equal(r.scheduled.size,0);assert.deepEqual(r.work.writes,[]);
  });
  await check('real Mac outer stick runs through both lane axes while Guard creeps and pause clears the run request', async () => {
    const r=rig({touch:true});await r.start();r.manager.touchCommand('mac:skip');r.frame();const mac=r.B.MacCombatPreview,T=r.B.TouchControls;
    r.pointer(T.joystick,'pointerdown',71);r.pointer(T.joystick,'pointermove',71,90,616);r.run(50);
    assert(mac.combat.getSnapshot().player.running);assert.equal(T.stickLabel.textContent,'RUN');assert.equal(mac.tutorial.progress.run,1);assertWholeFrame(r);
    r.pointer(T.joystick,'pointermove',71,144,670);r.pointer(r.button('road_defend'),'pointerdown',72);r.run(30);
    const x=mac.combat.getSnapshot().player.x,at=mac.combat.getSnapshot().elapsedMs;r.run(200);const p=mac.combat.getSnapshot().player;
    assert(p.guarding&&!p.running);assert(Math.abs((p.x-x)/((mac.combat.getSnapshot().elapsedMs-at)/1000)-r.B.MacStreetCombat.constants.moveSpeed*.22)<1e-7,'Guard uses the actual slow core movement');assert.equal(T.stickLabel.textContent,'MOVE');assertWholeFrame(r);
    await r.B.RuntimeLifecycle.pause();r.frame();assert.equal(T.pointers.size,0);assert(!mac.combat.getSnapshot().player.guarding&&!mac.combat.getSnapshot().player.running);
    const frozen=plain(mac.combat.getSnapshot());r.run(100);assert.deepEqual(plain(mac.combat.getSnapshot()),frozen);
    await r.B.RuntimeLifecycle.resume();r.frame();assert(!mac.combat.getSnapshot().player.running);assert.equal(r.scheduled.size,1);assert.equal(r.work.timers,0);assert.equal(r.work.intervals,0);await mac.exit();
  });
  await check('phone outer-stick Run Kick uses the real native kick phases, preserves equipped charges and cancels safely at Pause', async () => {
    const r=rig({touch:true});await r.start();r.manager.touchCommand('mac:skip');r.frame();const mac=r.B.MacCombatPreview,T=r.B.TouchControls;
    r.key('keydown','d');r.until(()=>mac.getControlState().throw.ready&&mac.getControlState().throw.targetType==='weapon');r.key('keyup','d');r.frame();
    const pickup=r.button('road_disrupt');r.pointer(pickup,'pointerdown',73);r.pointer(pickup,'pointerup',73);r.frame();const weapon=plain(mac.combat.getSnapshot().player.weapon);
    r.pointer(T.joystick,'pointerdown',74);r.pointer(T.joystick,'pointermove',74,144,670);r.run(50);assert(mac.combat.getSnapshot().player.running);
    const strike=r.button('road_attack');assert.match(strike.textContent,/Run Kick/);r.pointer(strike,'pointerdown',75);r.frame();
    let p=mac.combat.getSnapshot().player;assert.equal(p.attack.kind,'running-kick');assert.equal(p.attack.weaponKind,null);assert.deepEqual(plain(p.weapon),weapon);assert.equal(mac.tutorial.progress['running-kick'],1);
    const art=mac.frameArt.get('mac');let pose=r.B.MacCombatFrames.sample(p,{player:true,compiled:art.compiled,supplemental:art.supplemental});assert.equal(pose.clipKey,'air-kick.windup');assertWholeFrame(r);
    r.run(105);p=mac.combat.getSnapshot().player;pose=r.B.MacCombatFrames.sample(p,{player:true,compiled:art.compiled,supplemental:art.supplemental});assert.equal(pose.clipKey,'air-kick.active');assertWholeFrame(r);
    await r.B.RuntimeLifecycle.pause();r.frame();const frozen=plain(mac.combat.getSnapshot());assert.equal(frozen.player.attack,null);assert.equal(T.pointers.size,0);r.run(250);assert.deepEqual(plain(mac.combat.getSnapshot()),frozen);
    await r.B.RuntimeLifecycle.resume();r.frame();r.run(150);p=mac.combat.getSnapshot().player;assert.equal(p.attack,null);assert(!p.running);assert.deepEqual(plain(p.weapon),weapon);assert.equal(r.scheduled.size,1);assert.equal(r.work.timers,0);assert.equal(r.work.intervals,0);await mac.exit();
  });
  await check('an actual late-held Guard block selects the native impact cel only for its simulation receipt age', async () => {
    const r=rig();await r.start();r.manager.touchCommand('mac:skip');r.frame();const mac=r.B.MacCombatPreview;
    r.key('keydown','d');r.until(s=>s.combat.enemies[0].phase==='windup');r.key('keyup','d');r.key('keydown','k');
    r.until(()=>r.work.events.some(event=>event.type==='block'));const event=r.work.events.find(event=>event.type==='block'),state=mac.combat.getSnapshot(),art=mac.frameArt.get('mac');
    assert.equal(mac.guardBlockedAtMs,event.atMs);let pose=r.B.MacCombatFrames.sample(state.player,{player:true,compiled:art.compiled,supplemental:art.supplemental,guardImpactAgeMs:state.elapsedMs-event.atMs});
    assert.equal(pose.clipKey,'guard-impact');assertWholeFrame(r);r.run(180);
    const after=mac.combat.getSnapshot();pose=r.B.MacCombatFrames.sample(after.player,{player:true,compiled:art.compiled,supplemental:art.supplemental,guardImpactAgeMs:after.elapsedMs-event.atMs});assert.equal(pose.clipKey,'guard');assertWholeFrame(r);
    r.key('keyup','k');await mac.exit();
  });
  await check('real phone Grab holds one enemy, advertises bounded Pummel, and releasing the same finger throws it', async () => {
    const r=rig({touch:true});await r.start();r.manager.touchCommand('mac:skip');r.frame();const mac=r.B.MacCombatPreview,T=r.B.TouchControls;
    r.key('keydown','d');r.until(()=>mac.getControlState().throw.ready&&mac.getControlState().throw.targetType==='enemy');r.key('keyup','d');r.frame();
    const button=r.button('road_disrupt');assert.match(button.textContent,/Grab/);r.pointer(button,'pointerdown',81);r.frame();
    let p=mac.combat.getSnapshot().player;assert(p.grapple&&!p.grapple.released);const id=p.grapple.targetId;assert(p.grapple.maxHoldMs<=3000&&p.grapple.maxHoldMs>=1000);
    assert.equal(r.button('road_disrupt'),button);assert.match(button.textContent,/Throw/);assert.match(r.button('road_attack').textContent,/Pummel/);assert.match(mac.tutorialText.textContent,/hold/);assertWholeFrame(r);
    r.pointer(r.button('road_attack'),'pointerdown',82);r.run(400);r.pointer(r.button('road_attack'),'pointerup',82);
    p=mac.combat.getSnapshot().player;assert(p.grapple.pummelUsedMs>0&&p.grapple.pummelUsedMs<=1000);assert.equal(mac.tutorial.progress.grab,1);assert.equal(mac.tutorial.progress.pummel,1);assertWholeFrame(r);
    r.pointer(button,'pointerup',81);r.run(180);const thrown=mac.combat.getSnapshot().enemies.find(enemy=>enemy.id===id);
    assert(thrown.launched&&thrown.elevation>0,'Context release commits a real launched body');assert.equal(mac.tutorial.progress.throw,1);assertWholeFrame(r);
    assert.equal(T.pointers.size,0);assert.equal(r.work.timers,0);assert.equal(r.work.intervals,0);await mac.exit();
  });
  await check('pause, browser blur and cancelled capture safely drop a real held enemy without a delayed throw or stuck action', async () => {
    for(const interruption of ['pause','blur','pointercancel']) {
      const r=rig({touch:true});await r.start();r.manager.touchCommand('mac:skip');r.frame();const mac=r.B.MacCombatPreview;
      r.key('keydown','d');r.until(()=>mac.getControlState().throw.ready&&mac.getControlState().throw.targetType==='enemy');r.key('keyup','d');r.frame();
      r.pointer(r.button('road_disrupt'),'pointerdown',83);r.frame();const id=mac.combat.getSnapshot().player.grapple.targetId;
      if(interruption==='pause'){await r.B.RuntimeLifecycle.pause();r.frame();}else if(interruption==='blur')r.w.dispatchEvent({type:'blur'});else r.pointer(r.button('road_disrupt'),'pointercancel',83);
      const p=mac.combat.getSnapshot().player;assert.equal(p.grapple,null);assert.equal(p.carry,null);assert.equal(p.attack,null);assert.equal(r.B.TouchControls.pointers.size,0);
      const foe=mac.combat.getSnapshot().enemies.find(enemy=>enemy.id===id);assert(!foe.launched&&!foe.grappled,'Cancellation drops rather than violently throws');
      if(interruption==='pause'){const frozen=plain(mac.combat.getSnapshot());r.run(200);assert.deepEqual(plain(mac.combat.getSnapshot()),frozen);await r.B.RuntimeLifecycle.resume();r.frame();}
      r.run(100);assert.equal(mac.combat.getSnapshot().player.grapple,null);assert(!mac.combat.getSnapshot().player.running);assert(!r.manager.actionInput.held('road_disrupt'));await mac.exit();
    }
  });
  await check('real crate lift keeps one native scale past three seconds and release launches it in lane order', async () => {
    const r=rig({touch:true});await r.start();r.manager.touchCommand('mac:skip');r.frame();const mac=r.B.MacCombatPreview,T=r.B.TouchControls;
    // Fight along the upper street lane through public controls. The lower
    // exit crate is deliberately reserved instead of wrecked by body throws.
    await fightRoute(r,{until:s=>s.combat.zone.index===1&&s.combat.zone.cleared,equipWeapons:false,
      combatLane:r.B.MacStreetCombat.constants.laneMin+3});r.frame();
    const target=mac.combat.getSnapshot().props.find(prop=>prop.carryable&&!prop.broken);assert(target);
    r.key('keydown',target.laneY<mac.combat.getSnapshot().player.laneY?'w':'s');r.until(s=>Math.abs(s.combat.player.laneY-target.laneY)<10);r.key('keyup','w');r.key('keyup','s');r.frame();
    r.key('keydown',target.x<mac.combat.getSnapshot().player.x?'a':'d');r.until(s=>Math.abs(s.combat.player.x-target.x)<65);r.key('keyup','a');r.key('keyup','d');r.frame();r.until(()=>mac.getControlState().throw.ready&&mac.getControlState().throw.targetType==='prop');
    const cell=mac.powerArt.cells.crate_intact,sheet=mac.powerArt.sheets.get(cell.sheet),isCrate=call=>call.path===sheet.sourceImage&&call.args.slice(0,4).every((value,i)=>value===[cell.source.x,cell.source.y,cell.source.width,cell.source.height][i]);
    const ground=r.work.lastDraws.find(isCrate);assert(ground);const button=r.button('road_disrupt');assert.match(button.textContent,/Lift/);r.pointer(button,'pointerdown',84);r.frame();
    const id=mac.combat.getSnapshot().player.carry.id;assert.equal(id,target.id);r.frame();assert.match(button.textContent,/Throw/);assert.match(button.textContent,/Release/);
    const held=r.work.lastDraws.find(isCrate);assert.deepEqual(held.args.slice(6),ground.args.slice(6),'Whole crate keeps the ground native pixel density in hand');assertWholeFrame(r);
    r.run(3200);const p=mac.combat.getSnapshot().player;assert(p.carry&&!p.carry.released);assert.equal(p.carry.maxHoldMs,null,'Props have no enemy strength timeout');assertWholeFrame(r);
    r.pointer(button,'pointerup',84);r.run(180);const prop=mac.combat.getSnapshot().props.find(prop=>prop.id===id);assert(prop.launched&&prop.elevation>0&&prop.heldBy===null);
    const flight=r.work.lastDraws.find(isCrate);assert(flight);assert.deepEqual(flight.args.slice(6),ground.args.slice(6),'Flight retains the same authored crate scale');assert.deepEqual(flight.position,[prop.x-mac.cameraX,prop.laneY-prop.elevation]);
    const art=mac.frameArt.get('mac'),pose=r.B.MacCombatFrames.sample(mac.combat.getSnapshot().player,{player:true,compiled:art.compiled,supplemental:art.supplemental});
    const macCall=r.work.lastDraws.find(call=>call.path===pose.frame.sourceImage&&call.args[0]===pose.frame.source.x&&call.args[1]===pose.frame.source.y);
    assert(r.work.lastDraws.indexOf(flight)<r.work.lastDraws.indexOf(macCall),'Prop on the same floor lane draws behind Mac, independent of its elevation');assert.equal(r.work.timers,0);assert.equal(r.work.intervals,0);await mac.exit();
  });
  await check('earned native car wreckage reveals a bounded Barrier pickup whose HUD clock freezes during Pause', async () => {
    const r=rig({touch:true});await r.start();r.manager.touchCommand('mac:skip');r.frame();const mac=r.B.MacCombatPreview;
    await fightRoute(r,{until:s=>s.combat.zone.index===1&&s.combat.zone.cleared});r.frame();const car=mac.combat.getSnapshot().props.find(prop=>prop.id==='alley-car');assert(car&&!car.broken&&!car.carryable);
    r.key('keydown','s');r.until(s=>Math.abs(s.combat.player.laneY-car.laneY)<8);r.key('keyup','s');r.frame();
    r.key('keydown',car.x-70<mac.combat.getSnapshot().player.x?'a':'d');r.until(s=>Math.abs(s.combat.player.x-(car.x-70))<10);r.key('keyup','a');r.key('keyup','d');r.frame();
    pressKey(r,'j');r.until(s=>s.combat.props.find(prop=>prop.id===car.id).recoil?.elevation>0);
    const bounced=mac.combat.getSnapshot().props.find(prop=>prop.id===car.id);assert.equal(bounced.x,car.x);assert.equal(bounced.laneY,car.laneY);assert(bounced.hp>0&&!bounced.broken,'A car survives the first earned weapon or fist hit');
    const recoilCell=mac.powerArt.cells[mac.propCell(bounced)],recoilSheet=mac.powerArt.sheets.get(recoilCell.sheet),recoilDraw=r.work.lastDraws.find(call=>call.path===recoilSheet.sourceImage&&call.args[0]===recoilCell.source.x&&call.args[1]===recoilCell.source.y);
    assert.deepEqual(recoilDraw.position,[bounced.x-mac.cameraX+bounced.recoil.x,bounced.laneY-bounced.recoil.elevation]);assert.equal(recoilDraw.rotation,bounced.recoil.rotation,'Whole native car rocks around its registered floor pivot');
    await r.B.RuntimeLifecycle.pause();r.frame();const frozenRecoil=plain(mac.combat.getSnapshot().props.find(prop=>prop.id===car.id));r.run(250);assert.deepEqual(plain(mac.combat.getSnapshot().props.find(prop=>prop.id===car.id)),frozenRecoil,'Pause freezes actual car bounce');
    await r.B.RuntimeLifecycle.resume();r.frame();r.until(s=>!s.combat.player.attack);r.run(450);assert.equal(mac.combat.getSnapshot().props.find(prop=>prop.id===car.id).recoil,null,'The car settles without a presentation clock');
    for(let n=0;n<30&&!mac.combat.getSnapshot().props.find(prop=>prop.id===car.id).broken;n++){pressKey(r,'j');r.until(s=>!s.combat.player.attack);}
    assert(mac.combat.getSnapshot().props.find(prop=>prop.id===car.id).broken,'Ordinary strikes wreck the car');assert.equal(mac.tutorial.progress.scenery,1);
    const cell=mac.powerArt.cells.car_broken,sheet=mac.powerArt.sheets.get(cell.sheet);assert(r.work.lastDraws.some(call=>call.path===sheet.sourceImage&&call.args[0]===cell.source.x&&call.args[1]===cell.source.y),'Native collapsed car is selected from actual prop state');
    const pickup=mac.combat.getSnapshot().pickups.find(item=>item.kind==='barrier');assert(pickup);r.key('keydown','d');r.until(s=>s.combat.player.powerups.barrierMs>0);r.key('keyup','d');r.frame();
    let p=mac.combat.getSnapshot().player;assert.equal(p.powerups.barrierCharges,3);assert(p.powerups.barrierMs<=r.B.MacStreetCombat.constants.barrierMs);assert.equal(mac.tutorial.progress.powerup,1);mac.skipTutorial();r.frame();assert.match(mac.tutorialText.textContent,/Barrier 3 hits/);
    await r.B.RuntimeLifecycle.pause();r.frame();const power=plain(mac.combat.getSnapshot().player.powerups);r.run(300);assert.deepEqual(plain(mac.combat.getSnapshot().player.powerups),power);assert(mac.tutorialReadout.hidden);
    await r.B.RuntimeLifecycle.resume();r.frame();r.run(200);p=mac.combat.getSnapshot().player;assert(p.powerups.barrierMs<power.barrierMs);assert.match(mac.tutorialText.textContent,/Barrier/);assert.equal(r.work.timers,0);assert.equal(r.work.intervals,0);await mac.exit();
  });
  await check('eight concise scenes and one fourth-wall answer take ten inputs without leaking into Jump', async () => {
    const r = rig(); await r.start(); const mac = r.B.MacCombatPreview, initial = mac.story.snapshot();
    assert(initial.revealed, 'Compact chapter text is readable immediately, without a reveal-only press');
    r.key('keydown', ' ', true); r.frame(); r.key('keyup', ' '); assert.equal(mac.story.snapshot().sceneId, initial.sceneId);
    const scenes = new Set([initial.sceneId]), choices = new Set();
    let inputs=0;
    for (let n = 0; n < 65 && mac.phase === 'intro'; n++) {
      const s = mac.story.snapshot(); scenes.add(s.sceneId);
      assert(s.revealed); assert.equal(s.lineCount,1,'Each scene or optional response has one short cue');
      if (s.choice) {
        choices.add(s.choice.id); assert.equal(s.choice.id, 'fourth-wall-question');
        assert.equal(s.sceneId,'margin-note'); assert.equal(s.speaker,'9 BIT');
        pressKey(r, '2'); inputs++; assert.equal(mac.story.snapshot().selections['fourth-wall-question'], 'keep-receipts');
        continue;
      }
      pressKey(r, ' '); inputs++; assert.equal(mac.combat.getSnapshot().player.elevation, 0);
    }
    assert.equal(scenes.size, 8); assert.deepEqual([...choices], ['fourth-wall-question']); assert.equal(inputs,10);
    assert.equal(mac.phase, 'street'); assert.equal(mac.story, null);
    r.frame(); assert.equal(mac.combat.getSnapshot().player.elevation, 0); assert.equal(r.work.audio.filter(x => x === 'start').length, 1);
    await mac.exit();
  });
  await check('W/Up move lanes, Space jumps independently and ordinary J strikes', async () => {
    const r = rig(); await r.start(); r.manager.touchCommand('mac:skip'); const p = () => r.B.MacCombatPreview.combat.getSnapshot().player;
    const initial = p().laneY; r.key('keydown', 'w'); r.run(150); r.key('keyup', 'w');
    assert(p().laneY < initial); assert.equal(p().elevation, 0); const lane = p().laneY;
    r.key('keydown', 'ArrowUp'); r.run(150); r.key('keyup', 'ArrowUp'); assert(p().laneY < lane); assert.equal(p().elevation, 0);
    pressKey(r, ' '); assert(p().elevation > 0); r.run(800); pressKey(r, 'j'); assert.equal(p().attack.step, 1);
    await r.B.MacCombatPreview.exit(); assert(r.manager.actionInput.keyboardBindings.jump.includes('w'));
  });
  await check('played gait and full ballistic jump draw authored whole cels through the existing frame', async () => {
    const r=rig();await r.start();r.manager.touchCommand('mac:skip');const mac=r.B.MacCombatPreview,F=r.B.MacCombatFrames;
    const walkFrames=new Set();r.key('keydown','d');
    for(let i=0;i<45;i++){r.frame();assertWholeFrame(r);walkFrames.add(F.sample(mac.combat.getSnapshot().player,{compiled:mac.frameArt.get('mac').compiled,player:true}).frameId);}
    r.key('keyup','d');assert(walkFrames.size>=4,'Played distance reaches both accepted contact and passage sides');
    const clips=new Set(),jumpFrames=new Set();pressKey(r,' ');
    for(let i=0;i<100;i++) {
      const p=mac.combat.getSnapshot().player;if(p.elevation===0&&p.velocityZ===0)break;
      assertWholeFrame(r);const pose=F.sample(p,{compiled:mac.frameArt.get('mac').compiled,player:true});
      clips.add(pose.clipKey);jumpFrames.add(pose.frameId);r.frame();
    }
    assert.deepEqual([...clips],['jump-rise','jump-fall']);assert(jumpFrames.size>=3,'Actual velocity advances multiple complete flight poses');
    const landed=mac.lastEvents.find(e=>e.type==='land');assert(landed);assert.equal(mac.playerLandedAtMs,landed.atMs);
    assertWholeFrame(r);assert.equal(F.sample(mac.combat.getSnapshot().player,{compiled:mac.frameArt.get('mac').compiled,player:true,landingAgeMs:mac.combat.getSnapshot().elapsedMs-landed.atMs}).clipKey,'landing');
    assert.equal(r.work.canvases,1,'Preview has only the existing game canvas before pause');
    await r.B.RuntimeLifecycle.pause();r.frame();const landedClock=mac.combat.getSnapshot().elapsedMs;
    r.run(150);assert.equal(mac.combat.getSnapshot().elapsedMs,landedClock);
    assert.equal(F.sample(mac.combat.getSnapshot().player,{compiled:mac.frameArt.get('mac').compiled,player:true,landingAgeMs:landedClock-landed.atMs}).clipKey,'landing');
    await r.B.RuntimeLifecycle.resume();r.frame();r.run(120);assertWholeFrame(r);
    assert.equal(F.sample(mac.combat.getSnapshot().player,{compiled:mac.frameArt.get('mac').compiled,player:true,landingAgeMs:mac.combat.getSnapshot().elapsedMs-landed.atMs}).clipKey,'idle');
    assert.equal(r.scheduled.size,1);assert.equal(r.work.canvases,2);assert(r.B.PauseMenu.snapshot,'Only the shared pause snapshot adds a canvas');assert.equal(r.work.timers,0);await mac.exit();
  });
  await check('phone Strike advertises and performs moving and aerial attacks through shared controls', async () => {
    const r = rig({touch: true}); await r.start(); r.manager.touchCommand('mac:skip');
    const t=r.B.TouchControls,stick=t.joystick;
    r.pointer(stick,'pointerdown',11);r.pointer(stick,'pointermove',11,130,670);r.run(50);
    assert.match(r.button('road_attack').textContent,/Step Strike/);
    r.pointer(r.button('road_attack'),'pointerdown',12);r.frame();
    assert.equal(r.B.MacCombatPreview.combat.getSnapshot().player.attack.kind,'step-strike');
    r.pointer(r.button('road_attack'),'pointerup',12);r.pointer(stick,'pointercancel',11);r.run(650);
    r.pointer(r.button('jump'),'pointerdown',13);r.frame();r.pointer(r.button('jump'),'pointerup',13);r.run(50);
    assert.match(r.button('road_attack').textContent,/Air Kick/);
    r.pointer(r.button('road_attack'),'pointerdown',14);r.frame();
    assert.equal(r.B.MacCombatPreview.combat.getSnapshot().player.attack.kind,'air-kick');
    r.pointer(r.button('road_attack'),'pointerup',14);r.run(150);
    assertWholeFrame(r);
    assert(Object.entries(r.work.celDraws).some(([file,count])=>count>0&&r.B.MacCombatPreview.frameArt.get('mac').compiled.sheetIds.some(id=>r.B.MacCombatPreview.frameArt.get('mac').compiled.sheets[id].sourceImage===file)),'Actual shared frame draws complete native Mac cels');
    await r.B.MacCombatPreview.exit();assert.equal(r.B.MacCombatPreview.frameArt.size,0);assert.deepEqual(r.work.writes,[]);
  });
  await check('fourth-wall options support phone answers and nine-input keyboard or controller Continue', async () => {
    const r = rig(); await r.start(); const mac = r.B.MacCombatPreview;
    let commonInputs=0;
    for (let n=0;n<9&&mac.phase==='intro';n++) { pressKey(r,' '); commonInputs++; }
    assert.equal(commonInputs,9); assert.equal(mac.phase,'street'); assert.equal(mac.story,null);
    assert.equal(mac.combat.getSnapshot().player.elevation,0); await mac.exit();
    await r.start();
    for (let n=0;n<9&&!mac.story.snapshot().choice;n++) pressKey(r,' ');
    assert.equal(mac.story.snapshot().choice.id,'fourth-wall-question'); pressKey(r,' ');
    assert.equal(mac.story.snapshot().choice,null); assert.deepEqual(plain(mac.story.snapshot().selections),{});
    assert.equal(mac.combat.getSnapshot().player.elevation,0); await mac.exit();
    await r.start();
    for (let n=0;n<30&&!mac.story.snapshot().choice;n++) pressKey(r,' ');
    const settings=r.B.ControllerSettings,pad=r.pad(); settings.bind('inspect',3);
    pad.buttons[3].pressed=true; r.frame(); pad.buttons[3].pressed=false; r.frame();
    assert.equal(mac.story.snapshot().choice,null); assert.deepEqual(plain(mac.story.snapshot().selections),{});
    assert.equal(mac.combat.getSnapshot().player.elevation,0); await mac.exit();
    const phone=rig({touch:true}); await phone.start(); const pm=phone.B.MacCombatPreview;
    for(let n=0;n<9&&!pm.story.snapshot().choice;n++) phone.manager.touchCommand('mac:next');
    assert.equal(pm.story.snapshot().choice.id,'fourth-wall-question');
    const answer=phone.button('mac:choice:0');phone.pointer(answer,'pointerdown',17);phone.pointer(answer,'pointerup',17);phone.frame();
    assert.equal(pm.story.snapshot().selections['fourth-wall-question'],'get-it-heard');
    assert.equal(pm.story.snapshot().speaker,'9 BIT');assert.equal(pm.combat.getSnapshot().player.elevation,0);
    await pm.exit();
  });
  await check('Mac controller diagonals work while the original deliberate drop filter remains', async () => {
    const r = rig(); await r.start(); r.manager.touchCommand('mac:skip'); const pad = r.pad();
    pad.axes = [.85, .85]; const before = r.B.MacCombatPreview.combat.getSnapshot().player; r.run(200);
    const after = r.B.MacCombatPreview.combat.getSnapshot().player;
    assert(after.x > before.x && after.laneY > before.laneY); assert.equal(after.elevation, 0);
    pad.axes = [0, 0]; r.frame(); pad.buttons[13].pressed = pad.buttons[15].pressed = true; r.frame();
    assert(r.manager.actionInput.held('move_down') && r.manager.actionInput.held('move_right'));
    await r.B.MacCombatPreview.exit();
    assert.equal(r.manager.actionInput.gamepadHeld('move_down', [pad]), false, '6 Bit diagonal D-pad is not a drop');
    pad.buttons[13].pressed = pad.buttons[15].pressed = false; pad.axes = [.85, .85];
    assert.equal(r.manager.actionInput.gamepadHeld('move_down', [pad]), false, '6 Bit diagonal stick is not a drop');
    pad.axes = [0, .85]; assert.equal(r.manager.actionInput.gamepadHeld('move_down', [pad]), true);
  });
  await check('real touch two-axis joystick and independent action fingers survive release/cancel/pause', async () => {
    const r = rig({touch: true}); await r.start(); const next = r.button('mac:next');
    r.pointer(next, 'pointerdown', 9); r.pointer(next, 'pointerup', 9);
    assert(r.B.MacCombatPreview.story.snapshot().revealed);
    r.manager.touchCommand('mac:skip'); const t = r.B.TouchControls; t.sync(); assert.equal(t.context.name, 'mac');
    assert.equal(t.buttons.has('ui:more'), false, 'combat actions are direct');
    r.pointer(t.joystick, 'pointerdown', 1); r.pointer(t.joystick, 'pointermove', 1, 130, 640);
    r.pointer(r.button('road_defend'), 'pointerdown', 2); r.pointer(r.button('road_attack'), 'pointerdown', 3);
    r.frame(); const a = r.manager.actionInput;
    assert(a.held('move_up') && a.held('move_right') && a.held('road_defend') && a.held('road_attack'));
    assert(r.B.MacCombatPreview.combat.getSnapshot().player.attack);
    r.pointer(r.button('road_attack'), 'pointerup', 3); r.frame(); assert(!a.held('road_attack'));
    assert(a.held('road_defend') && a.held('move_up') && a.held('move_right'));
    r.pointer(r.button('road_defend'), 'pointercancel', 2); r.frame(); assert(!a.held('road_defend') && a.held('move_right'));
    await r.manager.touchCommand('pause'); r.frame(); assert.equal(t.pointers.size, 0); assert.equal(a.virtualOwners.size, 0);
    const frozen = plain(r.B.MacCombatPreview.combat.getSnapshot()); r.run(200); assert.deepEqual(plain(r.B.MacCombatPreview.combat.getSnapshot()), frozen);
    await r.B.RuntimeLifecycle.resume(); r.frame(); assert(!a.held('move_up') && !a.held('move_right') && !a.held('road_attack'));
    await r.B.MacCombatPreview.exit(); r.manager.updateFrontend('title');
    assert.equal(t.pointers.size, 0); assert.equal(t.context.name, 'title'); assert.deepEqual(r.work.writes, []);
  });
  await check('pause freezes story, skip is blocked while paused and shared menu exits preview', async () => {
    const r = rig({touch: true}); await r.start(); const mac = r.B.MacCombatPreview;
    await r.manager.touchCommand('pause'); r.frame(); const frozen = plain(mac.story.snapshot());
    assert.equal(r.manager.touchCommand('mac:skip'), false); r.run(200); assert.deepEqual(plain(mac.story.snapshot()), frozen);
    await r.B.RuntimeLifecycle.resume(); r.frame(); assert(r.manager.touchCommand('mac:skip'));
    await r.B.RuntimeLifecycle.pause(); r.frame(); r.B.PauseMenu.focus = 7; r.B.PauseMenu.activate(); await settle();
    assert.equal(r.B.RuntimeLifecycle.getState(), 'idle'); assert.equal(mac.active, false); assert.equal(r.scheduled.size, 0); assert.deepEqual(r.work.writes, []);
  });
  await check('Mac controller menu remaps actual actions and rendered help follows custom buttons', async () => {
    const r = rig(); await r.start(); r.manager.touchCommand('mac:skip'); r.pad();
    await r.B.RuntimeLifecycle.pause(); r.frame(); const menu = r.B.PauseMenu, settings = r.B.ControllerSettings;
    assert.deepEqual(plain(menu.controllerControls()).map(row => row[0]), ['jump', 'road_attack', 'road_defend', 'road_disrupt', 'inspect']);
    menu.view = 'controller'; menu.controllerFocus = 4; menu.activateController();
    assert.equal(menu.captureAction, 'road_attack');
    menu.captureController({held: {}, pressed: {}}); assert(menu.captureReady);
    menu.captureController({held: {b7: true}, pressed: {b7: true}});
    assert.equal(settings.bindings.road_attack, 7); assert.equal(settings.bindings.road_defend, 5);
    assert.equal(menu.captureAction, null);
    settings.bind('jump', 2); settings.bind('inspect', 3);
    menu.view = 'settings'; const words = [], canvas = r.doc.getElementById('gameCanvas'), ctx = canvas.getContext('2d');
    ctx.fillText = text => words.push(String(text)); menu.draw(ctx);
    for (const [action, label] of [['jump', 'Jump'], ['road_attack', 'Strike'], ['road_defend', 'Guard'], ['road_disrupt', 'Throw'], ['inspect', 'Talk']])
      assert(words.some(line => line.includes(`${settings.prompt(action)}: ${label}`)), 'actual rendered custom prompt ' + action);
    assert(!words.some(line => /RHYTHM MODE HOLDS|R or Escape exits|Beat attack|LEVEL RULES/.test(line)), 'Mac help must not describe Level1 mechanics');
    menu.view = 'controller'; menu.controllerFocus = 3 + menu.controllerControls().length; menu.activateController();
    for (const action of ['jump', 'road_attack', 'road_defend', 'road_disrupt', 'inspect'])
      assert.equal(settings.bindings[action], r.manager.actionInput.gamepadBindings[action][0].button, 'Reset actual Mac action ' + action);
    assert(r.work.writes.length > 0); assert(r.work.writes.every(([key]) => key === 'barcode.controller.v1'), 'Only explicit controller preference edits persist');
    await r.B.MacCombatPreview.exit();
  });
  await check('an earned Canal Mantid commits its guard-or-lane leaping response through the real native draw', async () => {
    const r=rig();await r.start();r.manager.touchCommand('mac:skip');
    await fightRoute(r,{until:s=>s.combat.zone.index===4});await settle();r.frame();
    const input=r.manager.actionInput,mac=r.B.MacCombatPreview;
    r.until(s=>s.combat.enemies.some(enemy=>enemy.hp>0&&enemy.kind==='shock_mantid'&&enemy.attackTell?.response==='Guard or change lane'),s=>{
      assert.notEqual(s.status,'failed','The earned Mantid observation stays playable');
      input.releaseVirtualOwner('mantid-observe');
      const p=s.combat.player,foe=s.combat.enemies.find(enemy=>enemy.hp>0&&enemy.kind==='shock_mantid');assert(foe);
      const hold=name=>input.setVirtualAction(name,'mantid-observe',true,{timeStamp:r.w.performance.now()});
      const direction=Math.sign(foe.x-p.x)||p.facing;
      if(Math.abs(foe.x-p.x)>90||p.facing!==direction)hold(direction>0?'move_right':'move_left');
      if(Math.abs(foe.laneY-p.laneY)>8)hold(foe.laneY>p.laneY?'move_down':'move_up');
      const danger=s.combat.enemies.find(enemy=>enemy.hp>0&&enemy.phase==='windup'&&Math.abs(enemy.x-p.x)<330&&Math.abs(enemy.attackLaneY-p.laneY)<65&&enemy.attackTell.remainingMs<250);
      if(danger){
        if(danger.attackTell.guardable===false&&mac.getControlState().jump.ready)hold('jump');
        else if(danger.attackTell.guardable!==false&&danger.attackTell.remainingMs<105)hold('road_defend');
      }
    },1500);
    input.releaseVirtualOwner('mantid-observe');r.frame();assertStreetHud(r);assertWholeFrame(r);
    assert(r.work.tellResponses.has('Guard or change lane'),'A real earned Mantid draws its distinct response; no actor or clock fixture is patched');
    assert.equal(r.work.timers,0);assert.equal(r.work.intervals,0);assert.deepEqual(r.work.writes,[]);await mac.exit();assert.equal(r.scheduled.size,0);
  });
  await check('real route brief desk payoff/clear/retry never awards or persists campaign completion', async () => {
    const r = rig({touch: true}); await r.start(); r.manager.touchCommand('mac:skip'); const end = await fightRoute(r);
    assert.equal(end.combat.kills, 30); assert.equal(end.combat.city.completedWaves, 12);
    assert.equal(end.combat.city.clearedZones.length, 6); assert.equal(end.combat.status, 'desk-ready'); assert.equal(end.status, 'playing');
    assert.equal(end.combat.relay.restored,true,'Actual contextual phone Link restores the market feed');assert.equal(r.work.relayTouchUses,1);
    const expectedEncounters = r.B.MacStreetCombat.encounters.flatMap((pair,zoneIndex) =>
      pair.map((encounter,waveIndex) => [`${zoneIndex+1}:${waveIndex+1}`,encounter.name]));
    assert.deepEqual([...r.work.hudEncounters], plain(expectedEncounters), 'All twelve actual fights draw their distinct encounter title');
    assert.deepEqual([...r.work.bossHudPhases], [1,2,3], 'All three earned boss phase names reach the real HUD');
    for(const proof of ['close-boss','close-ordinary','separate-lanes','separate-props'])
      assert(r.work.depthProof.has(proof),'Real native draw-order regression actually samples '+proof);
    assert(r.work.exposedHudAdvanced, 'At least one real exposed window counts down between gameplay frames');
    assert.deepEqual([...(r.work.bossCoachWindows || [])].sort(),['committed','punish','warning'],
      'An unfinished earned tutorial yields during all three live boss combat windows');
    const firstLootSeed=end.combat.lootSeed;
    assert.equal(r.work.seedRequests,1,'Street frames never reroll the chapter loot');
    assert.deepEqual([...responseCoverage].sort(), ['Guard or change lane','Guard, jump or find a gap','Jump or change lane','Parry, jump or change lane'].sort(),
      'All four earned committed-tell response classes reach the real renderer across the complete route and close Mantid observation');
    const expectedStory = [...r.B.MacStreetCombat.zones.map(zone => 'city.arrival.'+zone.id),
      'city.relay.ready','city.relay.restored.local','city.relay.restored.kave','city.regent.phase2','city.regent.phase3','city.regent.defeated'];
    for (const id of expectedStory) assert(end.gameplayCueIds.includes(id), 'Actual chapter earns story cue '+id);
    assert.equal(new Set(end.gameplayCueIds).size,end.gameplayCueIds.length,'Retry-safe story memory never duplicates cue IDs');
    assert.deepEqual(r.work.storyReceipts.map(receipt=>receipt.id),plain(end.gameplayCueIds), 'Every admitted cue has one actual wrapper receipt');
    assert.equal(r.work.timers,0);assert.equal(r.work.intervals,0);assert.equal(r.work.canvases,1,'Story and fight HUD reuse the existing native surface');
    assert.deepEqual([...(r.work.nativeShotKinds || [])].sort(),['coil-bolt','plasma-disc','scatter-bolt'],'All three actual firearms draw native shots from their calibrated physical muzzle');
    assert.equal(end.tutorial.progress.relay,1);assert(end.floorMarks<=32);
    const cellDrawn=name=>{const cell=r.B.MacCombatPreview.powerArt.cells[name],sheet=r.B.MacCombatPreview.powerArt.sheets.get(cell.sheet);return r.work.powerDraws.some(call=>call.path===sheet.sourceImage&&call.args.slice(0,4).every((value,index)=>value===[cell.source.x,cell.source.y,cell.source.width,cell.source.height][index]));};
    assert(cellDrawn('blood_green_floor'));assert(cellDrawn('blood_purple_floor'));assert(cellDrawn('blood_green_heavy')||cellDrawn('blood_purple_heavy'));
    assert(r.work.cues.some(cue=>cue.kind==='stomp'));assert(r.work.cues.some(cue=>cue.kind==='restore'));
    r.manager.actionInput.releaseVirtualOwner('route');
    r.key('keydown', 'd'); r.until(s => Math.abs(s.combat.player.x - s.combat.desk.x) < 170); r.key('keyup', 'd'); r.frame();
    const talk = r.button('inspect'); r.pointer(talk, 'pointerdown', 7); r.pointer(talk, 'pointerup', 7); r.frame();
    assert.equal(r.B.MacCombatPreview.phase, 'desk'); assert.equal(r.B.MacCombatPreview.story.snapshot().sceneId, 'review-desk');
    assert.equal(r.B.MacCombatPreview.story.snapshot().choice,null);
    assert(r.B.MacCombatPreview.story.snapshot().revealed);
    r.manager.touchCommand('mac:next'); r.frame(); assert.equal(r.B.MacCombatPreview.status, 'clear');
    assert.equal(r.w.gameState.victory, false); assert.equal(r.w.gameState.gameOver, false); assert.deepEqual(r.work.writes, []);
    assert(r.manager.touchCommand('mac:retry')); r.frame(); assert.equal(r.B.MacCombatPreview.status, 'playing');
    await settle(); r.frame(); await settle(); r.frame();
    const loadedZones = r.B.MacCombatPreview.cityArt.zones.filter(zone => r.B.MacCombatPreview.assets.has(zone.background));
    assert.deepEqual(loadedZones.map(zone => zone.id), ['service-alley','night-market']);
    assert.equal(r.B.MacCombatPreview.combat.getSnapshot().kills, 0); assert.equal(r.B.MacCombatPreview.combat.getSnapshot().player.x, 200);
    assert.notEqual(r.B.MacCombatPreview.combat.getSnapshot().lootSeed,firstLootSeed,'Full chapter replay requests a fresh loot layout');
    assert.equal(r.work.seedRequests,2);
    assert.equal(r.B.MacCombatPreview.phase, 'street'); assert.equal(r.B.MacCombatPreview.story, null); assert.deepEqual(r.work.writes, []);
    assert.equal(r.B.MacCombatPreview.floorMarks.length,0);assert.equal(r.B.MacCombatPreview.radio,null);assert.equal(r.B.MacCombatPreview.tutorial.skipped,false);
    assert.deepEqual(plain(r.B.MacCombatPreview.getSnapshot().gameplayCueIds),[],'Full-city replay clears chapter-local narration memory');
    await r.manager.touchCommand('mac:exit'); assert.equal(r.scheduled.size, 0);
    assert.deepEqual(plain(r.B.MacCombatPreview.gameplayCueSeen),[],'Disposal leaves no chapter narration memory or queue');
    assert.deepEqual(plain(r.B.MacCombatPreview.radioQueue),[]);assert.equal(r.work.timers,0);assert.equal(r.work.intervals,0);
  });
  await check('earned defeat accepts controller Start pause, fresh retry and title commands', async () => {
    const r = rig(); await r.start(); r.manager.touchCommand('mac:skip');
    r.key('keydown', 'd'); r.until(s => s.combat.enemies[0].phase === 'windup'); r.key('keyup', 'd');
    let jumpedForDefeat=false;
    r.until(s => s.status === 'failed', s => {
      const p = s.combat.player, foe = s.combat.enemies[0];
      r.key('keyup',' ');
      for(const key of ['d','a','w','s'])r.key('keyup',key);
      if(Math.abs(foe.x-p.x)>60)r.key('keydown',foe.x>p.x?'d':'a');
      if(Math.abs(foe.laneY-p.laneY)>5)r.key('keydown',foe.laneY>p.laneY?'s':'w');
      const lethalTell=s.combat.enemies.find(e=>e.hp>0&&(e.phase==='windup'&&e.attackTell.remainingMs<=25||e.phase==='active')&&p.hp<=e.attackSpec.damage&&Math.abs(e.x-p.x)<e.attackSpec.reach+p.body.radius&&Math.abs(e.attackLaneY-p.laneY)<=(e.attackSpec.laneReach??r.B.MacStreetCombat.constants.laneReach));
      const lethalShot=s.combat.projectiles.find(shot=>{
        if(p.hp>shot.damage||Math.abs(shot.laneY-p.laneY)>shot.laneReach)return false;
        const center=p.x+p.facing*p.body.offsetX,next=shot.x+shot.vx/60;
        return center+p.body.radius>=Math.min(shot.x,next)-shot.width&&center-p.body.radius<=Math.max(shot.x,next)+shot.width;
      });
      if((lethalTell||lethalShot)&&p.elevation===0&&!p.hurtMs&&p.invulnerableMs<=25){
        r.key('keydown',' ');jumpedForDefeat=true;
      }
    });
    for(const key of ['d','a','w','s',' '])r.key('keyup',key);const pad = r.pad(); pad.buttons[9].pressed = true; r.frame(); await settle();
    assert.equal(r.B.RuntimeLifecycle.getState(), 'paused', 'controller Start remains available on Mac results');
    const mac=r.B.MacCombatPreview,combatFrozen=plain(mac.combat.getSnapshot()),clockFrozen=mac.elapsedMs;
    const seenBeforeRetry=plain(mac.getSnapshot().gameplayCueIds),narrationBeforeRetry=r.work.storyReceipts.length;
    assert(seenBeforeRetry.includes('city.arrival.service-alley'),'Death occurs after actual district narration admission');
    const blood=mac.powerArt.cells.blood_red_impact;assert(r.work.powerDraws.some(call=>call.path===mac.powerArt.sheets.get(blood.sheet).sourceImage&&call.args[0]===blood.source.x&&call.args[1]===blood.source.y),'Actual player contacts draw native red damage art');assert(r.work.cues.some(cue=>cue.kind==='damage'));
    assert(jumpedForDefeat&&combatFrozen.player.elevation>0,'Actual lethal contact happens during a jump '+JSON.stringify({jumpedForDefeat,elevation:combatFrozen.player.elevation,receipts:r.work.events.filter(e=>['jump','land','player-hit','player-defeated'].includes(e.type)).slice(-10)}));
    assert.equal(mac.playerDefeatedAtMs,mac.lastEvents.find(e=>e.type==='player-defeated').atMs,'Defeat uses its actual core event receipt');
    r.run(200);assert.equal(mac.elapsedMs,clockFrozen);assert.deepEqual(plain(mac.combat.getSnapshot()),combatFrozen);
    pad.buttons[9].pressed = false; r.frame(); await r.B.RuntimeLifecycle.resume(); r.frame();r.run(700);
    assert(mac.elapsedMs>clockFrozen);assert.deepEqual(plain(mac.combat.getSnapshot()),combatFrozen,'Result animation never advances frozen gameplay');assertWholeFrame(r);
    const art=mac.frameArt.get('mac'),stateAgeMs=combatFrozen.elapsedMs-mac.playerDefeatedAtMs+mac.elapsedMs-mac.playerDefeatedHostAtMs;
    const pose=r.B.MacCombatFrames.sample(combatFrozen.player,{compiled:art.compiled,player:true,stateAgeMs});
    assert.equal(pose.frameId,art.compiled.clips.defeat.frames.at(-1).frame,'Finite fall reaches authored grounded defeat');
    const downCel=r.work.lastCels.find(c=>c.path===pose.frame.sourceImage);
    assert.deepEqual(downCel.position,[combatFrozen.player.x-mac.cameraX,combatFrozen.player.laneY-pose.frame.baselineLift],'Terminal corpse reaches lane despite frozen positive gameplay elevation');
    pad.buttons[0].pressed = true; r.frame(); assert.equal(r.B.MacCombatPreview.status, 'playing');
    assert.equal(r.B.MacCombatPreview.combat.getSnapshot().player.hp, 100); r.frame();
    assert.equal(mac.combat.getSnapshot().lootSeed,combatFrozen.lootSeed,'Normal defeat retry keeps this chapter layout');
    assert.equal(r.work.seedRequests,1,'Normal retry does not consume another seed');
    assert.equal(r.B.MacCombatPreview.combat.getSnapshot().player.elevation, 0, 'held retry A cannot become a jump');
    assert.deepEqual(plain(mac.getSnapshot().gameplayCueIds),seenBeforeRetry,'Normal checkpoint retry preserves heard chapter cues');
    assert.equal(r.work.storyReceipts.length,narrationBeforeRetry,'Retry does not issue the arrival a second time');
    pad.buttons[0].pressed = false; r.frame(); await r.B.MacCombatPreview.exit(); assert.deepEqual(r.work.writes, []);
  });
  await check('cancelled asynchronous entry cannot mutate profile/audio/controls after title return', async () => {
    let releaseInit,signalInit; const init = new Promise(resolve => { releaseInit = resolve; }),reachedInit=new Promise(resolve=>{signalInit=resolve;});
    const r = rig({initAudio: () => {signalInit();return init;}}), original = plain(r.manager.actionInput.keyboardBindings);
    const starting = r.B.RuntimeLifecycle.start({privatePreview: 'mac-firstslice'});
    await Promise.race([reachedInit,starting.then(result=>assert.fail('Entry ended before audio preparation: '+JSON.stringify(result)))]);
    assert(r.B.MacCombatPreview.active, 'reached real async audio preparation');
    await r.B.RuntimeLifecycle.stop('cancel-private-preview', {stopMusic: true}); await starting;
    const stopped = {profiles: plain(r.work.profiles), audio: plain(r.work.audio)};
    releaseInit(); await settle();
    assert.deepEqual(plain(r.work.profiles), stopped.profiles, 'stale entry cannot load a Mac profile after cancellation');
    assert.deepEqual(plain(r.work.audio), stopped.audio, 'stale entry cannot stop title audio');
    assert.deepEqual(plain(r.manager.actionInput.keyboardBindings), original); assert.equal(r.B.MacCombatPreview.active, false);
    assert.equal(r.scheduled.size, 0); assert.deepEqual(r.work.writes, []);
  });
  assert(groups>0,'The requested integration group must exist');
  console.log(`Mac street integration: ${groups} groups passed (stubbed device/art/Canvas; real owners and gameplay route).`);
}
run().catch(error => { console.error(error); process.exitCode = 1; });
