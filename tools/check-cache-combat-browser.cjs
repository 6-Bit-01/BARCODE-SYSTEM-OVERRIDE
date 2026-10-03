#!/usr/bin/env node
// Fresh combat race in native Chromium using production scripts in index order.
// Simulation traverses every shared-RAF/input update; Canvas samples are selected
// throughout the actual race and on earned combat changes, not every display frame.
// Audio clock/device and campaign persistence are controlled host boundaries.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const http = require('node:http'), crypto = require('node:crypto');
const { spawn } = require('node:child_process'), { once } = require('node:events');
const { Driver, instrument, safeItem, PROFILES, ACTION_BUTTON, SNAPSHOT_KEYS } =
  require('./check-cache-road-races.cjs');
const { CombatDriver, observeCombat } = require('./check-cache-combat-integration.cjs');
const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.CACHE_COMBAT_BROWSER_OUTPUT ||
  path.join(os.tmpdir(), 'barcode-cache-combat-browser'));
const requireHosted = process.env.CACHE_COMBAT_BROWSER_REQUIRE_HOSTED === '1';
const chromePath = process.env.CHROME_BIN || ['/usr/bin/google-chrome', '/usr/bin/chromium',
  '/usr/bin/chromium-browser'].find(fs.existsSync);
assert(chromePath, 'Set CHROME_BIN to an installed Chrome/Chromium executable. Node 22+ supplies WebSocket.');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'assets/cache-road/combat/atlas-metadata.json'), 'utf8'));
const combatAssets = [...metadata.assets,...JSON.parse(fs.readFileSync(path.join(root,'assets/cache-road/combat/fx-metadata.json'))).assets];
assert.deepEqual(combatAssets.map(asset => asset.key).sort(),
  ['cacheCombatBike','cacheCombatBikeCrash','cacheCombatBlast','cacheCombatHostiles','cacheCombatFX'].sort(),
  'all five authored combat atlases are represented by their actual metadata');
const feedbackAssets=JSON.parse(fs.readFileSync(path.join(root,'assets/cache-road/blood/atlas-metadata.json'))).assets;
assert.deepEqual(feedbackAssets.map(asset=>asset.key).sort(),['cacheBloodSplatter','cacheCrewCallouts'],
  'custom blood and canonical crew portrait sheets have independent delivery metadata');
const beatPacking=JSON.parse(fs.readFileSync(path.join(root,'assets/cache-road/beat-system/packing.json')));
const beatAssets=Object.entries(beatPacking).map(([name,asset])=>({
  key:{hardware:'cacheBeatHardware',energy:'cacheBeatEnergy',timing:'cacheBeatTiming'}[name],
  runtime:asset.atlas,size:asset.atlasSize,sha256:asset.atlasSha256}));
assert.deepEqual(beatAssets.map(asset=>asset.key).sort(),['cacheBeatHardware','cacheBeatEnergy','cacheBeatTiming'].sort(),
  'all three custom beat sheets use actual packed runtime dimensions and byte hashes');
const beatRoot=fs.readFileSync(path.join(root,'src/engine/presentation-assets.js'),'utf8')
  .match(/const cacheBeatRoot = '([^']+)'/)?.[1];
assert.match(beatRoot||'',/^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/[0-9a-f]{40}\/$/,
  'custom beat art has an immutable published production source');
const beatKeys=beatAssets.map(asset=>asset.key);
const assets=[...combatAssets,...feedbackAssets,...beatAssets];
const critical = new Set(['src/engine/music-profiles.js', 'src/engine/music-transport.js',
  'src/engine/music-director.js', 'src/engine/cache-road-proof-profile.js', 'src/engine/presentation-assets.js',
  'src/game/campaign-services.js', 'src/game/cache-chapter.js', 'src/game/cache-road-landscape.js', 'src/game/cache-road-encounters.js',
  'src/game/cache-road-reactions.js', 'src/game/cache-road-pursuit.js', 'src/game/cache-road-adrenaline.js', 'src/game/cache-road-combat.js',
  'src/game/cache-road-crosswalks.js', 'src/game/cache-road-mirror.js', 'src/game/cache-road-crew-callouts.js',
  'src/game/cache-road-boss-art.js', 'src/game/cache-road-instruments.js', 'src/game/cache-road-guidance.js',
  'src/game/cache-road-beat-surface.js', 'src/game/cache-road-beat-feedback.js',
  'src/game/cache-road-cinematics.js', 'src/game/cache-road-proof.js',
  'src/engine/intro-sequence.js', 'src/engine/cache-scene-layouts.js', 'src/engine/cache-scene-effects.js',
  'src/engine/comic-dialogue.js', 'src/engine/cache-bridge.js', 'src/engine/cache-ending.js',
  'src/core/action-input.js', 'src/core/gamepad-ui.js', 'src/core/input.js', 'src/core/loop.js']);
const optional = ['src/game/cache-road-combat-art.js'];
for (const file of optional) if (fs.existsSync(path.join(root, file))) critical.add(file);
const scripts = [...index.matchAll(/<script\s+src=["']([^"']+)["']/g)].map(match => match[1])
  .filter(file => critical.has(file));
assert.equal(new Set(scripts).size, critical.size, 'every critical production owner is present once in actual index script order');
const assetFiles = [];
for (const folder of ['assets/cache-road/combat', 'assets/cache-road/pursuit', 'assets/cache-road/blood',
  'assets/cache-road/beat-system']) {
  const visit = dir => { if (!fs.existsSync(path.join(root, dir))) return;
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) visit(file);
      else if (/\.(json|webp|png|svg)$/.test(file)) assetFiles.push(file);
    }};
  visit(folder);
}
const checkedFiles = ['index.html', ...scripts, 'tools/check-cache-road-races.cjs',
  'tools/check-cache-combat-integration.cjs', 'tools/check-cache-combat-browser.cjs', ...assetFiles];
const sourceHashes = () => Object.fromEntries(checkedFiles.map(file =>
  [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
const initialSourceHashes = sourceHashes();
fs.mkdirSync(output, { recursive: true });
const fixture = `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Oxanium;src:url('/assets/studies/visual-overhaul/references/fonts/Oxanium.ttf') format('truetype');font-weight:200 800}
html,body{margin:0;background:#090e18;width:100%;height:100%;overflow:hidden}
canvas{display:block;width:100vw;height:100vh;object-fit:contain}
</style><canvas id="gameCanvas" width="1920" height="1080"></canvas><script>
window.browserProof={contexts:0,extraCanvases:0,worldUpdates:0,roadUpdates:0,musicStarts:0,
  clock:0,images:[],drawn:{},rigCalls:0,impactCalls:0,rigHealth:{},drawCosts:[],saves:[],timingNegative:null,
  completions:[],completionRequests:[],guidanceCalls:0,bossGuidanceCalls:0,
  cues:[],raceFrames:0,rafUpdates:0,simulationFrames:0,pad:{index:0,id:'Standard browser test controller',
    mapping:'standard',connected:true,timestamp:0,axes:[0,0],
    buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))}};
const nativeGetContext=HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext=function(...args){
  if(this.id!=='gameCanvas')throw Error('Unexpected secondary Canvas context');
  if(++browserProof.contexts>1)throw Error('Repeated main Canvas context acquisition');
  return nativeGetContext.apply(this,args);
};
const nativeCreate=document.createElement.bind(document);
document.createElement=function(tag,...args){
  if(String(tag).toLowerCase()==='canvas')browserProof.extraCanvases++;
  return nativeCreate(tag,...args);
};
// Existing art is bundled at this controlled host. Hosted mode leaves the
// pursuit, combat and custom feedback assets on production immutable URLs and
// refuses their bundled fallback; local review records bundled decoding.
const NativeImage=window.Image;
const srcProperty=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');
window.Image=function(...args){const image=new NativeImage(...args);browserProof.images.push(image);
  Object.defineProperty(image,'src',{get(){return srcProperty.get.call(this);},set(value){
    this.proofOriginalSrc=value;
    if(typeof value==='string'&&value.startsWith('https://raw.githubusercontent.com/')&&
       !(${requireHosted}&&(value.includes('/assets/cache-road/combat/')||value.includes('/assets/cache-road/pursuit/')||value.includes('/assets/cache-road/blood/')||value.includes('/assets/cache-road/beat-system/')))){
      const at=value.indexOf('/assets/');if(at>=0)value=value.slice(at);
    }
    srcProperty.set.call(this,value);
  }});return image;
};
window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};
window.gameState={running:false,paused:false,victory:true};window.isPaused=false;window.isRunning=true;
window.BARCODE_RENDER_QUALITY={flashes:true};
window.updateGame=()=>{browserProof.worldUpdates++;};window.renderGame=()=>{};
Object.defineProperty(navigator,'getGamepads',{value:()=>[browserProof.pad]});
// A complete Level 1 intermission fixture satisfies the actual Campaign
// validator. Fresh road progression, health, captures and damage are earned.
const parent={levelId:'level-01',checkpointId:'intermission',levelState:{difficultyId:'standard',
  run:{levelId:'level-01',difficultyId:'standard',recoveryMode:'checkpoints',runId:'browser-completed-level-01',
    elapsedMs:9000,damageTaken:0,retries:0,attempts:16,accurate:16,perfect:16,
    connected:16,connectedPerfect:16,completed:true,practice:false},
  score:2100,bestCombo:16,health:3,playerX:1790,fragments:[],skyCaches:[],ampCharges:0,
  boss:{playerX:1790,bossX:3480,score:0,skyCaches:[],signalAmpCharges:0},
  result:{runId:'browser-completed-level-01',score:2100},cacheBridge:{version:1,page:7,cue:2}}};
const initialRecord={current:structuredClone(parent),progress:{
    completedLevels:['level-01'],unlockedLevels:['level-01','level-02'],items:['stem.voice'],lore:[],results:{}}},
  archive={status:'ready',record:JSON.parse(localStorage.getItem('combat-browser-archive')||'null')||initialRecord,
  checkpoint(value){this.record.current=structuredClone(value);
    browserProof.saves.push(structuredClone(value));localStorage.setItem('combat-browser-archive',JSON.stringify(this.record));return true;},
  collect(){return true;},
  completeCampaignLevel(level,difficulty,result,item,unlock,options){
    const request={level,difficulty,result:structuredClone(result),item,unlock,
      checkpoint:structuredClone(options.checkpoint),loreIds:structuredClone(options.loreIds||[]),
      source:BARCODE.CacheEnding?.active?'ending-position':'earned-clear'};
    browserProof.completionRequests.push(request);
    // The production archive deduplicates reward facts while saving the same
    // frozen receipt again as the ending's reading position changes.
    if(!browserProof.completions.some(saved=>saved.level===level&&saved.difficulty===difficulty&&
      saved.result.runId===result.runId))browserProof.completions.push(structuredClone(request));
    this.record.progress.completedLevels=[...new Set([...this.record.progress.completedLevels,level])];
    this.record.progress.items=[...new Set([...this.record.progress.items,item])];
    this.record.progress.unlockedLevels=[...new Set([...this.record.progress.unlockedLevels,unlock])];
    this.record.progress.lore=[...new Set([...this.record.progress.lore,...request.loreIds])];
    this.record.progress.results[level]=structuredClone(result);
    return this.checkpoint(options.checkpoint);
  }};
window.lostDataSystem={archive};
window.BARCODE={Preferences:{values:{reducedMotion:false,flashes:true,inputOffsetMs:0}},
  PauseMenu:{heldKeys:new Set(),drag:null,sync(){},render(){},keyDown(event){
      if(window.isPaused&&['p','escape'].includes(event.key.toLowerCase())){
        BARCODE.RuntimeLifecycle.togglePause();return true;}return false;},
    keyUp(){},pointer:()=>false},
  RuntimeLifecycle:{restart(){throw Error('Unexpected road handoff recovery');},
    togglePause(){window.isPaused=!window.isPaused;gameState.paused=window.isPaused;
      const result=window.isPaused?BARCODE.MusicTransport.pause(audioSystem.context.currentTime):
        BARCODE.MusicTransport.resume(audioSystem.context.currentTime);
      window.lastTime=browserProof.clock;return result;}}};
window.audioSystem={context:{currentTime:0,state:'running'},musicTracks:{},
  prepareActiveMusicProfile:async function(){this.musicTracks=Object.fromEntries(
    BARCODE.MusicProfiles.getActive().arrangement.sources.map(source=>
      [source.sourceId,{buffer:{duration:187.5},isFallback:false,isPlaying:true,volume:0,gain:{gain:{value:0}}}]));return {ok:true};},
  startRuntimeGameplayMusic(){browserProof.musicStarts++;const result=BARCODE.MusicTransport.start({
    sourceAnchorAudioSec:this.context.currentTime,sourceOffsetTrackSec:BARCODE.CacheRoadProof.startOffsetSec()});
    return {ok:result.status==='ok'&&result.running};},
  stopRuntimeAudio(){BARCODE.MusicTransport.stop();},updateLayers(){BARCODE.musicDirector?.apply?.(this);},stopRoadEngine(){},
  getActiveMusicProfile(){return BARCODE.MusicProfiles.getActive();},layersStarted:true,isLooping:false,
  rampAdaptiveStemGain(track,volume){track.volume=volume;track.gain.gain.value=volume;},
  getOutputAudioTime(value){return value??this.context.currentTime;},
  playCombatCue(kind){browserProof.cues.push(kind);return true;},stopCacheBridgeAudio(){}};
</script>${scripts.map(file => `<script src="/${file}"></script>`).join('')}
<script>
const canvas=document.getElementById('gameCanvas');window.renderer={canvas,ctx:canvas.getContext('2d')};
const copy=value=>JSON.parse(JSON.stringify(value));
const round=(value,digits=3)=>Number(Number(value||0).toFixed(digits));
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const PROFILES=${JSON.stringify(PROFILES)},ACTION_BUTTON=${JSON.stringify(ACTION_BUTTON)},
  BUTTONS={attack:5,turbo:4,defend:7,disrupt:6};
const SNAPSHOT_KEYS=${JSON.stringify(SNAPSHOT_KEYS)},safeItem=${safeItem.toString()};
const instrument=${instrument.toString()},Driver=${Driver.toString()},
  observeCombat=${observeCombat.toString()},CombatDriver=${CombatDriver.toString()};
const originalAssetDraw=BARCODE.PresentationAssets.draw;
const beatArt=BARCODE.CacheRoadBeatFeedback;
browserProof.beatPaints={targets:0,pads:0,earned:0,earnedCustom:0,earnedCustomKeys:[],qualities:[],gains:[]};
BARCODE.CacheRoadBeatFeedback={...beatArt,
  drawTarget(...args){browserProof.beatPaints.targets++;return beatArt.drawTarget(...args);},
  drawPad(...args){const painted=beatArt.drawPad(...args);if(painted)browserProof.beatPaints.pads++;return painted;},
  drawReceipt(ctx,state,options){
    const before=Object.fromEntries(${JSON.stringify(beatKeys)}.map(key=>[key,browserProof.drawn[key]||0]));
    const painted=beatArt.drawReceipt(ctx,state,options),pose=beatArt.feedbackPose(state,options);
    if(painted&&pose?.success){browserProof.beatPaints.earned++;
      browserProof.beatPaints.qualities.push(pose.quality);browserProof.beatPaints.gains.push(pose.delta);
      const customKeys=${JSON.stringify(beatKeys)}.filter(key=>(browserProof.drawn[key]||0)>before[key]);
      if(customKeys.length){browserProof.beatPaints.earnedCustom++;
        browserProof.beatPaints.earnedCustomKeys.push(...customKeys);}}
    return painted;
  }};
browserProof.combatPaints={kinds:{},wrecks:0,riders:0,flips:0,reduced:0,blasts:0,blastFrames:[],noFlashFrames:[],reducedBlastDraws:0};
const combatArt=BARCODE.CacheRoadCombatArt;
if(combatArt)BARCODE.CacheRoadCombatArt={...combatArt,drawBody(ctx,options){
  const painted=combatArt.drawBody(ctx,options);
  if(painted){const counters=browserProof.combatPaints;
    counters.kinds[options.kind]=(counters.kinds[options.kind]||0)+1;
    if(options.wreck===true||options.phase==='wreck')counters.wrecks++;
    if(options.riderLift>0)counters.riders++;
    if(Math.abs(options.flipAngle||0)>.05&&!options.reduced)counters.flips++;
    if(options.reduced)counters.reduced++;
  }
  return painted;
},drawBlast(ctx,options){
  const painted=combatArt.drawBlast(ctx,options),counters=browserProof.combatPaints;
  if(painted){const frame=combatArt.blastFrameFor(options);counters.blasts++;counters.blastFrames.push(frame);
    if(options.flashes===false)counters.noFlashFrames.push(frame);
    if(options.reduced)counters.reducedBlastDraws++;
  }
  return painted;
}};
browserProof.texts=[];browserProof.textPaints=[];browserProof.traceTextAlpha=false;
const nativeFillText=CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText=function(value,...args){
  if(browserProof.texts.length<20000)browserProof.texts.push(String(value));
  if(browserProof.traceTextAlpha&&browserProof.textPaints.length<20000)
    browserProof.textPaints.push({value:String(value),alpha:this.globalAlpha});
  return nativeFillText.call(this,value,...args);
};
BARCODE.PresentationAssets.draw=function(key,...args){const ready=originalAssetDraw.call(this,key,...args);
  if(ready)browserProof.drawn[key]=(browserProof.drawn[key]||0)+1;return ready;};
const originalUpdate=BARCODE.CacheRoadProof.update,originalRoadDraw=BARCODE.CacheRoadProof.draw;
browserProof.trafficGuards=[];browserProof.guardAttempts=0;browserProof.lastGuardPressMs=-10000;
browserProof.pedestrianContacts=[];
browserProof.crewReactions=[];
const crosswalkStep=BARCODE.CacheRoadCrosswalks.step;
BARCODE.CacheRoadCrosswalks.step=function(...args){
  const s=BARCODE.CacheRoadProof.state;
  const economy=()=>JSON.stringify({score:s.score,integrity:s.integrity,captures:s.captures,
    queued:s.queuedCaptures,ammo:s.combat.ammo,cooldowns:s.combat.cooldowns,
    damage:s.combat.stats.damageDealt,takedowns:s.combat.stats.takedowns});
  const before=economy(),events=crosswalkStep.apply(this,args);
  if(economy()!==before)throw Error('Pedestrian contact altered the driving economy');
  for(const event of events)browserProof.pedestrianContacts.push(copy(event));
  return events;
};
const crewCallouts=BARCODE.CacheRoadCrewCallouts;
BARCODE.CacheRoadCrewCallouts={...crewCallouts,enqueue(state,event){
  const economy=()=>JSON.stringify({score:state.score,integrity:state.integrity,timeMs:state.timeMs,
    captures:state.captures,queued:state.queuedCaptures,ammo:state.combat.ammo,cooldowns:state.combat.cooldowns});
  const before=economy(),accepted=crewCallouts.enqueue(state,event);
  if(economy()!==before)throw Error('Crew reaction altered the driving economy');
  if(accepted)browserProof.crewReactions.push({id:event.id,...copy(crewCallouts.lineFor(event.hitCount))});
  return accepted;
}};
const originalHit=BARCODE.CacheRoadProof.hit;
BARCODE.CacheRoadProof.hit=function(...args){
  const s=this.state,before={integrity:s.integrity,damageTaken:this.chapter.damageTaken,
    guardMs:s.combat?.defendMs||0,blocks:s.combat?.stats.blocks||0,
    damageDealt:s.combat?.stats.damageDealt||0,shield:s.shield,ramMs:s.ramMs};
  const result=originalHit.apply(this,args);
  if(args[2]!==true&&before.guardMs>0&&s.combat.defendMs===0&&s.combat.stats.blocks===before.blocks+1&&s.integrity===before.integrity){
    browserProof.trafficGuards.push({kind:args[0],actorId:args[1]?.id||null,bar:s.musicBeatFloat/4,
      before,after:{integrity:s.integrity,damageTaken:this.chapter.damageTaken,guardMs:s.combat.defendMs,
        blocks:s.combat.stats.blocks,damageDealt:s.combat.stats.damageDealt,shield:s.shield,ramMs:s.ramMs}});
  }
  return result;
};
BARCODE.CacheRoadProof.update=function(...args){browserProof.roadUpdates++;return originalUpdate.apply(this,args);};
browserProof.renderedSamples=0;browserProof.drawNext=false;browserProof.drawReasons=[];
browserProof.fullLoopCosts=[];browserProof.bossPaintFrames=0;browserProof.measureLoop=false;
BARCODE.CacheRoadProof.draw=function(...args){if(!browserProof.drawNext)return;
  browserProof.drawNext=false;browserProof.renderedSamples++;const begin=performance.now();
  try{return originalRoadDraw.apply(this,args);}finally{browserProof.drawCosts.push(performance.now()-begin);}};
const originalGuidance=BARCODE.CacheRoadGuidance;
BARCODE.CacheRoadGuidance={...originalGuidance,draw(...args){
  browserProof.guidanceCalls++;return originalGuidance.draw.apply(originalGuidance,args);}};
browserProof.step=ms=>{for(let left=ms;left>0;){const dt=Math.min(20,left);left-=dt;
  browserProof.clock+=dt;audioSystem.context.currentTime+=dt/1000;
  browserProof.rafUpdates++;
  if(BARCODE.CacheRoadProof.active&&BARCODE.CacheRoadProof.status==='playing'&&
      BARCODE.CacheRoadProof.introMs===null&&!window.isPaused)browserProof.simulationFrames++;
  browserProof.pad.timestamp=browserProof.clock;
  const measured=browserProof.measureLoop,begin=performance.now();
  gameLoop(browserProof.clock);
  if(measured){
    renderer.ctx.getImageData(0,0,1,1);
    browserProof.fullLoopCosts.push({ms:performance.now()-begin,
      bar:BARCODE.CacheRoadProof.state.musicBeatFloat/4,
      gear:BARCODE.CacheRoadProof.state.gear,boss:!!BARCODE.CacheRoadProof.state.combat?.boss});
    browserProof.measureLoop=false;
  }}};
browserProof.release=()=>{for(const button of browserProof.pad.buttons){button.pressed=false;button.value=0;button.touched=false;}
  browserProof.pad.axes=[0,0];};
browserProof.render=reason=>{browserProof.drawNext=true;BARCODE.CacheRoadProof.draw(renderer.ctx);
  browserProof.drawReasons.push({reason,bar:BARCODE.CacheRoadProof.state.musicBeatFloat/4,
    combat:copy(BARCODE.CacheRoadProof.encounterSnapshot().combat),
    crosswalks:copy(BARCODE.CacheRoadProof.encounterSnapshot().crosswalks),
    crewCallout:copy(BARCODE.CacheRoadProof.state.crosswalkToast),
    mirror:copy(BARCODE.CacheRoadProof.state.mirrorState),preferences:copy(BARCODE.Preferences.values)});};
browserProof.boot=async()=>{window.lastTime=browserProof.clock;
  const saved=BARCODE.Campaign.readResume();
  if(!saved)throw Error('Persisted checkpoint rejected by actual Campaign adapter');
  if(saved.levelId==='level-02'){
    // Match the production lifecycle's documented resume order: prepare the
    // profile, restore the registered adapter, then start at its saved bar.
    const road=BARCODE.CacheRoadProof,selection=road.selectMusicProfile();
    if(!selection.ok)throw Error('Saved combat music profile selection failed');
    const prepared=await audioSystem.prepareActiveMusicProfile();
    if(!prepared.ok)throw Error('Saved combat music preparation failed');
    if(!BARCODE.Campaign.restore(saved))throw Error('Actual Campaign rejected its earned road checkpoint');
    if(road.status==='playing'&&!audioSystem.startRuntimeGameplayMusic().ok)
      throw Error('Saved combat music startup failed');
  } else {
    if(saved.levelId!=='level-01'||saved.checkpointId!=='intermission'||
       !BARCODE.Campaign.archive().record.progress.completedLevels.includes('level-01'))
      throw Error('Controlled bridge-ready entry requires a completed Level 1 save');
    BARCODE.Campaign.intermission=true;BARCODE.CacheBridge.start(saved.levelState.cacheBridge);browserProof.step(20);
  }};
browserProof.observe=()=>{const r={B:BARCODE,road:BARCODE.CacheRoadProof,pad:browserProof.pad,audio:audioSystem};
  browserProof.observed=observeCombat(r);return r;};
browserProof.startDriver=()=>{const r=browserProof.observed?{B:BARCODE,road:BARCODE.CacheRoadProof,pad:browserProof.pad,audio:audioSystem}:browserProof.observe();
  browserProof.driver=new CombatDriver(r,PROFILES.recovering,1,browserProof.observed,{earlyHits:1});};
browserProof.playChunk=count=>{const road=BARCODE.CacheRoadProof;
  for(let frame=0;frame<count&&road.status==='playing';frame++){
    browserProof.release();browserProof.driver.step();
    // One visibly anticipated civilian contact gets a genuine analog guard.
    // Later deliberate lane errors remain unguarded and must really wreck.
    const s=road.state,mistake=browserProof.driver.mistake,combat=road.encounterSnapshot().combat;
    if(!browserProof.trafficGuards.length&&browserProof.guardAttempts<6&&mistake&&!s.boostMs&&!s.invulnerableMs&&
        combat.skills.defend.ready&&s.elapsedMs-browserProof.lastGuardPressMs>150){
      const seconds=(mistake.at-s.progress)/Math.max(26,s.speed),lane=mistake.targetLane??mistake.lane;
      if(seconds>0&&seconds<.4&&Math.abs(lane-s.lanePos)<.45){
        browserProof.pad.buttons[7].value=.85;browserProof.guardAttempts++;
        browserProof.lastGuardPressMs=s.elapsedMs;
      }
    }
    // Cover a physical pedestrian contact with actual steering after the guard.
    // Follow one visible moving person, then return to the normal chase driver.
    if(browserProof.trafficGuards.length&&!s.crosswalks.hitCount){
      const person=road.encounterSnapshot().crosswalks.people.find(person=>person.phase==='walking'&&
        person.lane>=0&&person.lane<=3&&person.distance>0&&person.distance<200);
      if(person)browserProof.pad.axes[0]=Math.abs(person.lane-s.lanePos)>.06?Math.sign(person.lane-s.lanePos):0;
    }
    // R2/L2 exercise the actual analog-trigger threshold, with pressed=false.
    for(const button of [6,7])if(browserProof.pad.buttons[button].pressed){browserProof.pad.buttons[button].pressed=false;browserProof.pad.buttons[button].value=.85;}
    const eventsBefore=browserProof.observed.events.length,contactsBefore=browserProof.pedestrianContacts.length;
    // Consecutive production frames traverse the shared input/update/audio owners.
    const measure=browserProof.raceFrames<160||!!s.combat.boss&&browserProof.bossPaintFrames<160;
    if(measure){browserProof.drawNext=true;browserProof.measureLoop=true;
      if(s.combat.boss)browserProof.bossPaintFrames++;}
    browserProof.step(20);browserProof.raceFrames++;
    const events=browserProof.observed.events.slice(eventsBefore);
    const special=events.find(event=>event.kind==='combat-event'&&
      ['enemy-arrive','warning','lock','enemy-shot','takedown','boss-arrive','enemy-hit','boss-defeated','disrupt'].includes(event.type))||
      events.find(event=>event.kind==='wreck-recovery')||
      (browserProof.pedestrianContacts.length>contactsBefore?{type:'pedestrian-hit'}:null);
    if(special||browserProof.raceFrames%25===0)browserProof.render(special?special.type||special.kind:'periodic');
    const updatedCombat=road.encounterSnapshot().combat;
    if(updatedCombat?.boss&&updatedCombat.boss.hp!==browserProof.lastHp){browserProof.lastHp=updatedCombat.boss.hp;break;}
    if(events.some(event=>event.kind==='combat-event'&&event.type==='takedown')||events.some(event=>event.kind==='wreck-recovery'))break;
  }
  return browserProof.summary(false);};
browserProof.summary=(includeEvents=true)=>{const road=BARCODE.CacheRoadProof,s=road.state,combat=road.encounterSnapshot().combat;
  return {status:road.status,encounterVersion:road.chapter.encounterVersion,bar:s.musicBeatFloat/4,
    progress:s.progress,integrity:s.integrity,gear:s.gear,chapter:copy(road.chapter),combat:copy(combat),
    crosswalks:copy(s.crosswalks),pedestrianContacts:copy(browserProof.pedestrianContacts),
    crewCallout:copy(s.crosswalkToast),crewQueue:copy(s.crosswalkMessages),crewReactions:copy(browserProof.crewReactions),mirror:copy(s.mirrorState),
    camera:copy(s.cameraMotion),music:BARCODE.MusicTransport.sample(audioSystem.context.currentTime).grid?.beatFloat,
    drumVolume:BARCODE.musicDirector.getVolume('cache-pressure'),events:includeEvents?copy(browserProof.observed?.events||[]):[],
    drawn:{...browserProof.drawn},combatPaints:copy(browserProof.combatPaints),
    raceFrames:browserProof.raceFrames,rafUpdates:browserProof.rafUpdates,
    simulationFrames:browserProof.simulationFrames,renderedSamples:browserProof.renderedSamples,
    guidanceCalls:browserProof.guidanceCalls,trafficGuards:copy(browserProof.trafficGuards),guardAttempts:browserProof.guardAttempts,
    saved:BARCODE.Campaign.readResume(),completions:copy(browserProof.completions),
    completionRequests:copy(browserProof.completionRequests),rewardFacts:copy(BARCODE.Campaign.archive().record.progress)};};
browserProof.frozen=()=>{const s=BARCODE.CacheRoadProof.state;return {progress:s.progress,elapsedMs:s.elapsedMs,
  musicBeat:s.musicBeatFloat,captures:copy(s.captures),queued:copy(s.queuedCaptures),pending:copy(s.pendingPulseAwards),
  combat:BARCODE.CacheRoadCombat.snapshot(s.combat),crosswalks:copy(s.crosswalks),mirror:copy(s.mirrorState),camera:copy(s.cameraMotion),
  crewCallout:copy(s.crosswalkToast),crewQueue:copy(s.crosswalkMessages),crewIds:copy(s.crosswalkCalloutIds),
  heardBeat:BARCODE.MusicTransport.sample(audioSystem.context.currentTime).grid?.beatFloat};};
</script>`;
const requests={head:0,localCombat:[],remoteCombat:[],localBeat:[],remoteBeat:[]},errors=[],frames=[];
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(req.method==='HEAD'){requests.head++;res.writeHead(405);res.end();return;}
  if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});res.end(fixture);return;}
  if(/^\/assets\/cache-road\/(combat|blood)\//.test(pathname)){
    requests.localCombat.push(pathname);if(requireHosted){res.writeHead(404);res.end();return;}}
  if(/^\/assets\/cache-road\/beat-system\//.test(pathname)){
    requests.localBeat.push(pathname);if(requireHosted){res.writeHead(404);res.end();return;}}
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':{'.js':'text/javascript','.ttf':'font/ttf','.webp':'image/webp',
    '.png':'image/png','.svg':'image/svg+xml','.json':'application/json'}[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'barcode-combat-chrome-'));
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let chrome,chromeClosed,socket,receipt;
async function main(){
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const origin=`http://127.0.0.1:${server.address().port}`;
  chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required','--no-first-run','--remote-debugging-port=0',
    `--user-data-dir=${profile}`,'about:blank'],{stdio:['ignore','ignore','pipe']});
  chromeClosed=new Promise(resolve=>chrome.once('close',resolve));
  const debuggerUrl=await new Promise((resolve,reject)=>{
    let stderr='';const timeout=setTimeout(()=>fail(Error(`Chrome startup timeout: ${stderr}`)),30000);
    const cleanup=()=>{clearTimeout(timeout);chrome.off('error',fail);chrome.off('close',closed);chrome.stderr.off('data',read);};
    const fail=error=>{cleanup();reject(error);},closed=code=>fail(Error(`Chrome exited ${code}: ${stderr}`));
    const read=chunk=>{stderr=(stderr+chunk).slice(-16384);const match=stderr.match(/DevTools listening on (ws:\/\/\S+)\s/);
      if(match){cleanup();resolve(match[1]);}};
    chrome.once('error',fail);chrome.once('close',closed);chrome.stderr.on('data',read);
  });
  const target=await(await fetch(`${new URL(debuggerUrl).origin.replace('ws:','http:')}/json/new`,{method:'PUT'})).json();
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
  let serial=0;const pending=new Map();
  socket.addEventListener('message',event=>{
    const message=JSON.parse(event.data);
    if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails);
    if(message.method==='Network.requestWillBeSent'&&message.params.request.url.startsWith('https://')&&
      /\/assets\/cache-road\/(combat|blood)\//.test(message.params.request.url))requests.remoteCombat.push(message.params.request.url);
    if(message.method==='Network.requestWillBeSent'&&message.params.request.url.startsWith('https://')&&
      /\/assets\/cache-road\/beat-system\//.test(message.params.request.url))requests.remoteBeat.push(message.params.request.url);
    if(pending.has(message.id)){const{resolve,reject,timeout}=pending.get(message.id);pending.delete(message.id);clearTimeout(timeout);
      if(message.error)reject(Error(JSON.stringify(message.error)));else resolve(message.result);}
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
    const id=++serial,timeout=setTimeout(()=>{pending.delete(id);reject(Error(`${method} timeout`));},30000);
    pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{
    expression,returnByValue:true,awaitPromise:true,userGesture:true});
    assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;};
  const until=async(expression,label)=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await delay(200);}
    throw Error(`Browser timeout: ${label}`);};
  const key=(name,held=true)=>send('Input.dispatchKeyEvent',{type:held?'keyDown':'keyUp',key:name,
    code:name==='Enter'?'Enter':`Key${name.toUpperCase()}`,windowsVirtualKeyCode:name==='Enter'?13:name.toUpperCase().charCodeAt(0)});
  const tap=async name=>{await key(name);await key(name,false);};
  const shot=async(label,state)=>{
    const image=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    const file=`Combat-${String(frames.length).padStart(2,'0')}-${label}.png`;
    fs.writeFileSync(path.join(output,file),Buffer.from(image.data,'base64'));
    frames.push({file,fixture:false,label,bar:state.bar,integrity:state.integrity,
      combat:state.combat,drawn:state.drawn});};
  const ready=async()=>{
    await until('document.readyState==="complete"&&!!window.inputManager&&!!window.renderer&&!!BARCODE.CacheRoadCombat','production owners/input ready');
    await evaluate('document.fonts.ready');
    await until('["cacheCar","cacheRival","cacheDashBezel","cacheMirror","cachePulsePad","cachePursuitRig"].every(key=>BARCODE.PresentationAssets.ready(key))','bundled cars/dashboard/rig decode');
    await until(`${JSON.stringify(assets.map(asset=>asset.key))}.every(key=>BARCODE.PresentationAssets.ready(key))`,
      requireHosted?'all ten immutable combat/feedback/beat atlases decode':'all ten bundled combat/feedback/beat atlases decode');
    assert(await evaluate('!!BARCODE.CacheRoadCombatArt'),'the registered production combat painter loads in actual index order');
    assert(await evaluate('!!BARCODE.CacheRoadCrewCallouts'),'the registered crew reaction owner loads in actual index order');
    assert(await evaluate('typeof BARCODE.CacheRoadBeatSurface?.paintQuad==="function"'),
      'the actual custom beat projection owner loads in production index order');
  };
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:origin});await ready();
  const decoded=await evaluate(`Promise.all([...new Map(browserProof.images.filter(image=>
    image.src.includes('/assets/cache-road/combat/')||image.src.includes('/assets/cache-road/blood/')||image.src.includes('/assets/cache-road/beat-system/'))
    .map(image=>[image.src,image])).values()].map(async image=>{
      const response=await fetch(image.src);if(!response.ok)throw Error('Combat atlas fetch failed '+image.src);
      const bytes=await response.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',bytes);
      return {url:image.src,productionUrl:image.proofOriginalSrc,bytes:bytes.byteLength,
        width:image.naturalWidth,height:image.naturalHeight,
        sha256:[...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('')};}))`);
  assert.equal(decoded.length,assets.length,'all ten actually loaded combat/feedback/beat atlases are independently fetched and verified');
  for(const asset of assets){
    const loaded=decoded.find(item=>new URL(item.url).pathname.endsWith('/'+asset.runtime));
    assert(loaded,`Missing decoded ${asset.key}`);
    assert.deepEqual([loaded.width,loaded.height],asset.size);
    assert.equal(loaded.bytes,asset.bytes?.runtime??fs.statSync(path.join(root,asset.runtime)).size);assert.equal(loaded.bytes,fs.statSync(path.join(root,asset.runtime)).size);
    assert.equal(loaded.sha256,typeof asset.sha256==='string'?asset.sha256:asset.sha256.runtime);assert.equal(loaded.sha256,initialSourceHashes[asset.runtime]);
    if(beatKeys.includes(asset.key))assert.equal(loaded.productionUrl,beatRoot+asset.runtime,
      'the actual beat loader attempts the correct immutable production atlas before bundled review substitution');
    if(requireHosted){assert.match(loaded.url,/^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/[0-9a-f]{40}\/assets\/cache-road\/(combat|blood|beat-system)\//);
      assert.equal(loaded.url,loaded.productionUrl,'new art uses its immutable production URL without local substitution');}
  }
  await evaluate('browserProof.boot()');
  assert.equal(await evaluate('browserProof.musicStarts'),0);
  await tap('Enter');await until('BARCODE.CacheRoadProof.active&&!BARCODE.CacheBridge.active','native Drive enters fresh combat chapter');
  assert.equal(await evaluate('BARCODE.CacheRoadProof.chapter.encounterVersion'),4);
  assert.equal(await evaluate('BARCODE.CacheRoadProof.state.invulnerableMs'),0);
  assert.equal(await evaluate('browserProof.musicStarts'),0,'fresh setup remains silent');
  await evaluate('browserProof.traceTextAlpha=true');
  const openingBefore=await evaluate('browserProof.frozen()');
  const firstText=await evaluate('browserProof.textPaints.length');
  await evaluate('browserProof.render("opening-no-hud")');
  assert.equal(await evaluate('BARCODE.CacheRoadProof.cinematicPose().hudAlpha'),0);
  assert(!(await evaluate(`browserProof.textPaints.slice(${firstText}).some(paint=>paint.value==='ATTACK')`)),
    'the native opening begins with no combat HUD');
  assert(!(await evaluate(`browserProof.textPaints.slice(${firstText}).some(paint=>paint.value==='1')`)),
    'cinematic control also hides the ordinary tire-line input guide');
  await shot('opening-no-hud',await evaluate('browserProof.summary()'));
  await evaluate('browserProof.step(3000);browserProof.render("opening-surrounded")');
  await shot('opening-surrounded',await evaluate('browserProof.summary()'));
  await evaluate('browserProof.step(1500);browserProof.render("opening-staged-ram")');
  assert(await evaluate('BARCODE.CacheRoadProof.cinematicPose().actors.some(actor=>actor.phase==="wreck")'));
  await shot('opening-staged-ram',await evaluate('browserProof.summary()'));
  await evaluate('browserProof.step(2500)');
  const fadeText=await evaluate('browserProof.textPaints.length');
  const openingAlpha=await evaluate('BARCODE.CacheRoadProof.cinematicPose().hudAlpha');
  assert(openingAlpha>0&&openingAlpha<1);
  await evaluate('browserProof.render("opening-real-hud-fade")');
  const openingPaints=await evaluate(`browserProof.textPaints.slice(${fadeText}).filter(paint=>paint.value==='ATTACK')`);
  assert(openingPaints.length&&openingPaints.every(paint=>paint.alpha>0&&paint.alpha<=openingAlpha+1e-8),
    'actual native HUD alpha writes are multiplied by the cinematic fade on the existing context');
  assert.equal(await evaluate('renderer.ctx.globalAlpha'),1,'HUD fade restores the main native context alpha');
  assert.deepEqual(await evaluate('browserProof.frozen()'),openingBefore,
    'staged native surround and ram do not change chart, combat, captures or physical progress');
  await shot('opening-real-hud-fade',await evaluate('browserProof.summary()'));
  await evaluate('browserProof.traceTextAlpha=false');
  await tap('Enter');await evaluate('browserProof.release();browserProof.step(20);');
  assert.equal(await evaluate('browserProof.musicStarts'),1);
  assert(await evaluate('BARCODE.CacheRoadProof.handoffMs!==null'));
  await evaluate('browserProof.step(1400);browserProof.observe();');
  assert.equal(await evaluate('BARCODE.CacheRoadProof.handoffMs'),null,
    'native combat input begins only after the real gradual control handoff');
  const cinematicNative={openingNoHUD:true,openingAlpha,openingPaints,stagedRamUnscored:true,
    gradualControlHandoff:true,existingMainContext:true};
  const zeroSync=[];
  for(const [skill,button] of [['defend',7],['disrupt',6],['turbo',4]]){
    const before=await evaluate('browserProof.summary()');assert.equal(before.combat.syncCount,0);
    assert(before.combat.skills[skill].ready);
    await evaluate(`browserProof.pad.buttons[${button}].${button>=6?'value=.85':'pressed=true'};browserProof.step(20);`);
    const after=await evaluate('browserProof.summary()'),accepted=after.events.filter(event=>event.kind==='combat-input'&&event.accepted&&event.skill===skill);
    assert.equal(accepted.length,1);assert.equal(accepted[0].syncBefore,0);
    await evaluate('browserProof.step(100)');
    assert.equal(await evaluate(`browserProof.observed.events.filter(event=>event.kind==='combat-input'&&event.accepted&&event.skill===${JSON.stringify(skill)}).length`),1,'held skill cannot repeat');
    await evaluate('browserProof.release();browserProof.step(20)');zeroSync.push({skill,button,event:accepted[0],analog:button>=6});
  }
  // Attack is a weapon aimed at a real visible target, not a synthetic hit.
  let targetVisible=false;
  for(let frame=0;frame<650;frame++){
    const state=await evaluate('browserProof.summary()');assert.equal(state.combat.syncCount,0);
    if(state.combat.target){targetVisible=true;break;}
    await evaluate(`{const road=BARCODE.CacheRoadProof,s=road.state,actors=road.encounterSnapshot().combat.actors;
      const target=actors.find(actor=>actor.hp>0);browserProof.pad.axes[0]=target&&Math.abs(target.lane-s.lanePos)>.07?Math.sign(target.lane-s.lanePos):0;browserProof.step(20);}`);
  }
  assert(targetVisible,'zero-sync Attack waits for an actual announced enemy in weapon range');
  await evaluate('browserProof.release();browserProof.pad.buttons[5].pressed=true;browserProof.step(20);browserProof.render("zero-sync-attack")');
  let state=await evaluate('browserProof.summary()');
  const attack=state.events.filter(event=>event.kind==='combat-input'&&event.accepted&&event.skill==='attack');
  assert.equal(attack.length,1);assert.equal(attack[0].syncBefore,0);zeroSync.push({skill:'attack',button:5,event:attack[0]});
  assert.equal(state.chapter.accurate,0,'combat cannot award a face-button music capture');
  await shot('zero-sync-four-controls',state);await evaluate('browserProof.release();browserProof.step(20);browserProof.startDriver()');
  let paused=false,reloaded=false,drawnWreck=false,drawnRider=false,drawnFlip=false,comfort=null,restoreReceipt=null;
  const bossHp=[],allEvents=[],allDrawn={},drawSessions=[],paintSessions=[],drawSamples=[],trafficGuards=[],fullLoopCosts=[];
  let totalFrames=0,totalDriverFrames=0,totalRafUpdates=0,totalSamples=0,minimumDrums=Infinity,lastHp=null;
  for(let chunk=0;chunk<900;chunk++){
    state=await evaluate('browserProof.playChunk(50)');
    minimumDrums=Math.min(minimumDrums,state.drumVolume);
    if(state.combat.boss&&state.combat.boss.hp!==lastHp){lastHp=state.combat.boss.hp;bossHp.push({hp:lastHp,bar:state.bar});
      await shot(`boss-hp-${String(lastHp).replace('.','_')}`,state);}
    const wreck=state.combat.wrecks.find(item=>item.ageMs<1400);
    if(wreck&&(!drawnWreck||wreck.rider&&!drawnRider||wreck.flip&&!drawnFlip)){
      await evaluate('browserProof.step(160);browserProof.render("earned-flip-rider")');state=await evaluate('browserProof.summary()');
      drawnWreck=true;drawnRider||=wreck.rider;drawnFlip||=wreck.flip;await shot('earned-takedown-flip-rider',state);
    }
    if(!paused&&state.combat.boss){
      await evaluate('browserProof.release();browserProof.step(20)');await tap('p');await evaluate('browserProof.step(20)');
      assert(await evaluate('window.isPaused'));const before=await evaluate('browserProof.frozen()');
      await evaluate('browserProof.step(1000)');assert.deepEqual(await evaluate('browserProof.frozen()'),before,
        'pause holds earned combat, captures, camera, physical progress and audible music together');
      await tap('p');assert(!(await evaluate('window.isPaused')));paused=true;
    }
    if(!comfort&&state.combat.wrecks.some(wreck=>wreck.ageMs<1300)){
      const before=await evaluate('browserProof.frozen()');
      const normalPaints=state.combatPaints;
      assert(normalPaints.blasts>0,'the preference probe begins on an actually painted earned explosion');
      await evaluate('BARCODE.Preferences.values.reducedMotion=true;BARCODE.Preferences.values.flashes=false;BARCODE_RENDER_QUALITY.flashes=false;browserProof.render("reduced-motion-no-flashes")');
      const reduced=await evaluate('browserProof.summary()');await shot('reduced-motion-no-flashes',reduced);
      assert.equal(reduced.combatPaints.blasts,normalPaints.blasts,'Reduced Motion suppresses the live explosion painter');
      await evaluate('BARCODE.Preferences.values.reducedMotion=false;browserProof.render("no-flashes-smoke")');
      const noFlash=await evaluate('browserProof.summary()');await shot('no-flashes-smoke',noFlash);
      assert(noFlash.combatPaints.noFlashFrames.length>0&&noFlash.combatPaints.noFlashFrames.every(frame=>frame>=3),
        'Flashes Off uses only the actual smoke/debris cells of the earned explosion');
      assert.deepEqual(await evaluate('browserProof.frozen()'),before,'preference-only draw never alters the chase simulation');
      await evaluate('BARCODE.Preferences.values.reducedMotion=false;BARCODE.Preferences.values.flashes=true;BARCODE_RENDER_QUALITY.flashes=true;browserProof.render("normal-motion")');
      comfort={reducedMotionDrawn:true,liveExplosionSuppressed:true,flashesDisabledSmokeDrawn:true,
        noFlashFrames:noFlash.combatPaints.noFlashFrames,simulationUnchanged:true};
    }
    if(!reloaded&&state.combat.boss?.hp>0&&state.combat.boss.hp<=9){
      const before=await evaluate('browserProof.summary(false)'),earned=await evaluate(`(()=>{const road=BARCODE.CacheRoadProof,saved=road.makeCheckpoint('road-verse-4');
        if(!road.validate(saved))throw Error('Actual midboss checkpoint rejected');BARCODE.Campaign.archive().checkpoint(saved);return saved;})()`);
      assert(earned.levelState.proof.combat.ledger.some(item=>item.kind==='rig'&&item.damage>0));
      const forged=JSON.parse(JSON.stringify(earned));forged.levelState.proof.gateOpen=true;
      assert.equal(await evaluate(`BARCODE.CacheRoadProof.validate(${JSON.stringify(forged)})`),false,'an undefeated rig cannot forge the delivery gate');
      allEvents.push(...await evaluate('browserProof.observed.events'));totalFrames+=before.simulationFrames;
      totalDriverFrames+=before.raceFrames;totalRafUpdates+=before.rafUpdates;totalSamples+=before.renderedSamples;
      paintSessions.push(before.combatPaints);drawSessions.push(before.drawn);drawSamples.push(...await evaluate('browserProof.drawReasons'));
      trafficGuards.push(...before.trafficGuards);fullLoopCosts.push(...await evaluate('browserProof.fullLoopCosts'));
      await send('Page.reload');await ready();await evaluate('browserProof.boot();');
      await until('BARCODE.CacheRoadProof.active&&BARCODE.CacheRoadProof.introMs===null','actual saved race re-enters after page reload');
      await evaluate('browserProof.release();browserProof.step(20);browserProof.startDriver();browserProof.render("earned-midboss-reload")');
      state=await evaluate('browserProof.summary()');
      assert.equal(state.chapter.runId,before.chapter.runId);assert.equal(state.combat.boss.hp,before.combat.boss.hp,'real weapon damage survives page reload');
      assert.equal(state.combat.stats.damageDealt,before.combat.stats.damageDealt);
      assert.equal(state.crosswalks.hitCount,before.crosswalks.hitCount,'pedestrian contacts survive earned page reload');
      assert.deepEqual(state.crosswalks.crossings.map(item=>item.hitMask),before.crosswalks.crossings.map(item=>item.hitMask));
      assert(state.combat.actors.every(actor=>!actor.locked),'resumed enemies receive their warning again');
      restoreReceipt={savedBar:earned.levelState.proof.musicBar,beforeHp:before.combat.boss.hp,afterHp:state.combat.boss.hp,
        runId:state.chapter.runId,damageDealt:state.combat.stats.damageDealt,forgedGateRejected:true};reloaded=true;
      await shot('earned-midboss-reload',state);
    }
    if(state.status!=='playing')break;
  }
  assert.equal(state.status,'clear',JSON.stringify({status:state.status,bar:state.bar,integrity:state.integrity,boss:state.combat.boss}));
  await evaluate('browserProof.render("earned-clear")');state=await evaluate('browserProof.summary(false)');await shot('earned-clear',state);
  assert.equal(await evaluate('BARCODE.CacheRoadProof.outroMs'),0);
  assert.equal(await evaluate('!!BARCODE.CacheEnding.active'),false,'earned clear shows the horizon exit before the next overlay');
  const outroBefore=await evaluate('browserProof.frozen()');
  await evaluate('browserProof.release();browserProof.step(500)');
  await evaluate('browserProof.traceTextAlpha=true');
  const outroText=await evaluate('browserProof.textPaints.length');
  const outroAlpha=await evaluate('BARCODE.CacheRoadProof.cinematicPose().hudAlpha');
  await evaluate('browserProof.render("earned-horizon-hud-fade")');
  const outroPaints=await evaluate(`browserProof.textPaints.slice(${outroText}).filter(paint=>paint.value==='ATTACK')`);
  assert(outroPaints.length&&outroPaints.every(paint=>paint.alpha>0&&paint.alpha<=outroAlpha+1e-8));
  assert.equal(await evaluate('renderer.ctx.globalAlpha'),1);
  await shot('earned-horizon-hud-fade',await evaluate('browserProof.summary(false)'));
  await evaluate('browserProof.traceTextAlpha=false');
  await evaluate('browserProof.step(2500);browserProof.render("earned-receding-horizon")');
  const receding=await evaluate('BARCODE.CacheRoadProof.cinematicPose()');
  assert(receding.car.depth>0&&receding.car.depth<.1&&receding.hudAlpha===0);
  assert.deepEqual(await evaluate('browserProof.frozen()'),outroBefore,
    'earned native horizon exit changes presentation only after the actual full song and boss defeat');
  await shot('earned-receding-horizon',await evaluate('browserProof.summary(false)'));
  await tap('Enter');await evaluate('browserProof.step(20)');
  assert.equal(await evaluate('BARCODE.CacheRoadProof.outroMs'),null);
  assert(await evaluate('!!BARCODE.CacheEnding.active'),'fresh released native Enter skips to the earned ending');
  Object.assign(cinematicNative,{earnedOutro:true,outroAlpha,outroPaints,recedingDepth:receding.car.depth,
    outroEconomyFrozen:true,freshOutroSkip:true});
  state=await evaluate('browserProof.summary(false)');
  allEvents.push(...await evaluate('browserProof.observed.events'));totalFrames+=state.simulationFrames;
  totalDriverFrames+=state.raceFrames;totalRafUpdates+=state.rafUpdates;totalSamples+=state.renderedSamples;
  paintSessions.push(state.combatPaints);drawSessions.push(state.drawn);drawSamples.push(...await evaluate('browserProof.drawReasons'));
  for(const session of drawSessions)for(const[key,value]of Object.entries(session))allDrawn[key]=(allDrawn[key]||0)+value;
  trafficGuards.push(...state.trafficGuards);fullLoopCosts.push(...await evaluate('browserProof.fullLoopCosts'));
  assert(state.bar>=100&&state.bar<=100.02);assert.equal(state.encounterVersion,4);
  assert(state.combat.boss.defeated&&state.combat.boss.hp===0);
  assert.deepEqual(state.crosswalks.crossings.map(item=>item.bar),[10,30,50,70],
    'the native full race commits exactly four crosswalks');
  assert.deepEqual([...new Set(drawSamples.flatMap(sample=>sample.crosswalks?.crossings.map(item=>item.bar)||[]))].sort((a,b)=>a-b),
    [10,30,50,70],'all four physical crosswalks are sampled in actual native draws');
  assert(drawSamples.some(sample=>sample.crosswalks?.people.some(person=>person.phase==='walking')),
    'real crossing pedestrians are drawn during the earned race');
  const crewPaints=drawSamples.filter(sample=>sample.crewCallout?.speaker);
  assert(crewPaints.length>0,'an actual physical pedestrian contact paints its crew popup in native Canvas');
  assert(crewPaints.every(sample=>['6 BIT','DJ FLOPPYDISC','MAC MODEM'].includes(sample.crewCallout.speaker)&&
    sample.crewCallout.remainingMs>0&&sample.crewCallout.remainingMs<=3200),
    'native crew reactions retain authored identity and a shared-update readability clock');
  assert(bossHp.some(item=>item.hp===12)&&bossHp.some(item=>item.hp===0),'actual initial and destroyed rig states are sampled');
  assert(allEvents.some(event=>event.kind==='combat-event'&&event.type==='enemy-hit'&&event.id==='rig'));
  assert(allEvents.some(event=>event.kind==='wreck-recovery'&&event.gear===0&&event.queuedRecovery&&event.recoveryBeat%4===0),
    'a real driver mistake physically wrecks and selects first gear with next-ONE recovery');
  assert(trafficGuards.length>0,'a genuine timed native R2 guard prevents an ordinary physical traffic wreck');
  for(const guarded of trafficGuards){
    assert.equal(guarded.before.integrity,guarded.after.integrity);assert.equal(guarded.before.damageTaken,guarded.after.damageTaken);
    assert.equal(guarded.before.damageDealt,guarded.after.damageDealt,'a traffic guard cannot invent damage to enemies or the rig');
    assert.equal(guarded.before.shield,guarded.after.shield);assert.equal(guarded.before.ramMs,guarded.after.ramMs);
    assert.equal(guarded.after.guardMs,0);assert.equal(guarded.after.blocks,guarded.before.blocks+1);
  }
  assert(drawnWreck&&drawnRider&&drawnFlip,'an actually destroyed bike/car is rendered with physical flip and separated rider');
  assert(paintSessions.some(session=>session.wrecks>0&&session.riders>0&&session.flips>0),
    'the actual production painter returns successful wreck, airborne-rider and rotating-chassis paints');
  for(const key of assets.map(asset=>asset.key))assert(allDrawn[key]>0,`the native production race paints ${key}`);
  for(const kind of ['bike','rammer','escort','disruptor'])
    assert(paintSessions.some(session=>session.kinds[kind]>0),`the actual ${kind} is painted in the played chase`);
  assert(paintSessions.every(session=>session.reducedBlastDraws===0));
  assert(paused&&reloaded&&comfort);assert.equal(minimumDrums,.60);
  assert(state.chapter.delivery&&state.chapter.delivery.result.accurate>5);
  assert.equal(new Set(allEvents.filter(event=>event.kind==='capture').map(event=>event.action)).size,4,'all four face buttons still synchronize announced parts');
  assert.equal(state.rewardFacts.items.filter(item=>item==='stem.bass').length,1);
  const beatPaints=await evaluate('browserProof.beatPaints');
  assert(beatPaints.targets>0&&beatPaints.pads>0&&beatPaints.earned>0,
    'actual native race paints the new ground target, physical pads and earned adrenaline receipts');
  assert(beatPaints.gains.some(gain=>gain>0&&gain<=20),
    'an earned native ground receipt shows a real bounded positive adrenaline gain');
  assert(beatPaints.earnedCustom>0&&beatPaints.earnedCustomKeys.includes('cacheBeatTiming'),
    'at least one real earned native receipt submits custom beat artwork and its quality shell');
  assert.equal(await evaluate('document.querySelectorAll("canvas").length'),1);
  assert.equal(await evaluate('browserProof.contexts'),1);assert.equal(await evaluate('browserProof.extraCanvases'),0);
  assert.equal(await evaluate('browserProof.worldUpdates'),0);assert(state.guidanceCalls>0);
  const labels=await evaluate('browserProof.texts');
  for(const label of ['ATTACK','TURBO','DEFEND','DISRUPT','RB','LB','RT','LT'])
    assert(labels.includes(label),`the native fixed HUD renders the ${label} control label`);
  assert.deepEqual(await evaluate('Object.fromEntries(["road_attack","road_turbo","road_defend","road_disrupt"].map(action=>[action,BARCODE.ControllerSettings.bindings[action]]))'),
    {road_attack:5,road_turbo:4,road_defend:7,road_disrupt:6},'actual saved/default bindings implement the approved four-control mapping');
  assert(totalSamples>=100&&totalSamples<totalFrames/4,'selected native Canvas samples supplement every actual simulation frame');
  assert(fullLoopCosts.length>=320,'consecutive complete gameplay frames cover road and live boss');
  assert(fullLoopCosts.some(frame=>frame.boss)&&fullLoopCosts.some(frame=>!frame.boss),
    'sustained diagnostics include actual chase and rig combat');
  const sortedLoopCosts=fullLoopCosts.map(frame=>frame.ms).sort((a,b)=>a-b);
  const fullLoopTiming={frames:fullLoopCosts.length,medianMs:sortedLoopCosts[Math.floor(sortedLoopCosts.length/2)],
    p95Ms:sortedLoopCosts[Math.ceil(sortedLoopCosts.length*.95)-1],
    over33Ms:fullLoopCosts.filter(frame=>frame.ms>1000/30).length,
    gears:[...new Set(fullLoopCosts.map(frame=>frame.gear))],samples:fullLoopCosts,
    limitation:'Consecutive native Chromium shared-loop frames with raster flush; controlled audio/device hosts, not player-device FPS.'};
  console.log('SUSTAINED_FRAME_COST '+JSON.stringify({...fullLoopTiming,samples:undefined}));
  assert.deepEqual(errors,[],'native browser raises no uncaught production exceptions');assert.equal(requests.head,0);
  if(requireHosted)assert.deepEqual(requests.localCombat,[],'new combat/feedback art never silently falls back to bundled paths');
  if(requireHosted)assert.deepEqual(requests.localBeat,[],'custom beat art never silently falls back to bundled paths');
  assert.deepEqual(sourceHashes(),initialSourceHashes,'source and authored assets remain frozen throughout the browser race');
  receipt={passed:true,assetDelivery:requireHosted?'immutable-hosted':'bundled',decoded,zeroSync,frames,bossHp,
    state,events:allEvents,restoreReceipt,comfort,cinematicNative,drawn:allDrawn,combatPaintSessions:paintSessions,drawSamples,trafficGuards,
    renderedControlLabels:[...new Set(labels)],beatPaints,requests,errors,minimumDrums,
    simulationFrames:totalFrames,driverFrames:totalDriverFrames,sharedRafUpdates:totalRafUpdates,
    nativeCanvasSamples:totalSamples,fullLoopTiming,sourceHashes:initialSourceHashes,sourceStableThroughoutRun:true,
    checks:{nativeControllerAndAnalogTriggers:true,zeroSyncFourSkills:true,actualWeaponBossDamage:true,
      nativeR2PreventsOrdinaryTrafficWreck:true,physicallyEarnedWreckAndFirstGear:true,actualBikeRiderAndFlipDrawn:true,pausedCombatCameraMusicFrozen:true,
      earnedPageReload:true,persistedPedestrianContacts:true,fourPhysicalCrosswalksDrawn:true,
      pedestrianContactsPreserveEconomy:true,customBloodAndCrewAtlasesDecoded:true,physicalHitCrewPopupDrawn:true,
      crewQueueIncludedInPauseFreeze:true,stableMirrorOwner:true,forgedGateRejected:true,complete100Bars:true,independentFourFaceSync:true,
      reducedMotionNoFlashesDrawn:true,nativeOpeningNoHUD:true,nativeExistingContextHUDFade:true,
      unscoredStagedRam:true,nativeEarnedHorizonExit:true,freshOutroSkip:true,
      nativeGroundTimingAndEarnedAdrenalinePaint:true,customBeatSheetsDecodedAndHashed:true,
      immutableBeatSourceAttempt:true,customBeatProjectionOwnerLoaded:true,earnedCustomBeatReceipt:true,
      oneCanvas:true,stateInjection:false},
    limits:'Production scripts in index order, controlled saved bridge-ready entry, native Chromium input/Canvas, every shared-RAF simulation update and selected Canvas samples. Does not exercise title boot or every display frame. Audio clock, gamepad device, lifecycle pause and Campaign persistence are controlled hosts. No progress, health, immunity, resources, captures or boss-damage injection. Not Makko, physical-controller, recorded listening, human balance, comfort or display-pacing acceptance.'};
  console.log(`Cache combat Chromium passed: zero-sync four controls, analog triggers, actual12HP rig damage, wreck/first gear, earned page reload, full100bars; ${totalFrames} simulation frames and ${totalSamples} sampled Canvas frames.`);
}
main().catch(error=>{receipt={passed:false,error:error.stack,frames,requests,errors};console.error(error);process.exitCode=1;})
  .finally(async()=>{fs.writeFileSync(path.join(output,'Combat-Browser-Checks.json'),JSON.stringify(receipt||{passed:false},null,2)+'\n');
    socket?.close();if(chrome&&chrome.exitCode===null&&chrome.signalCode===null)chrome.kill();if(chromeClosed)await chromeClosed;
    server.close();await fs.promises.rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:100});});
