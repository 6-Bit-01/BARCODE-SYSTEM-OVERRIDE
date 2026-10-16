'use strict';
// Real scene owners/profile declarations with bounded browser-host resources.
// Host byte counters describe released originals; they do not assert OS memory.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const plain=value=>JSON.parse(JSON.stringify(value));
const deferred=()=>{let resolve;const promise=new Promise(yes=>{resolve=yes;});return {promise,resolve};};
const flush=async()=>{for(let n=0;n<16;n++)await Promise.resolve();};
function rig(){
  const media=[],timers=[],cancelled=[],w={BARCODE:{},console:{log(){},warn(){},error(){}},
    removeEventListener(){},setTimeout(callback){timers.push(callback);return timers.length;}};
  class OriginalImage{
    constructor(){this._src='';this.naturalWidth=0;this.naturalHeight=0;media.push(this);}
    set src(value){this._src=value;this.naturalWidth=value?20:0;this.naturalHeight=value?30:0;if(value)queueMicrotask(()=>this.onload?.());}
    get src(){return this._src;}
    removeAttribute(name){assert.equal(name,'src');this.src='';}
  }
  class Canvas{constructor(width=64,height=64){this.width=width;this.height=height;}remove(){}}
  const document={readyState:'loading',addEventListener(){},removeEventListener(){},
    createElement(tag){return tag==='video'?{src:'',paused:true,preload:'',readyState:0,
      play(){return Promise.resolve();},pause(){this.paused=true;},load(){this.loadCount=(this.loadCount||0)+1;},
      removeAttribute(){this.src='';}}:new Canvas();}};
  w.document=document;w.Image=OriginalImage;
  w.BARCODE.IntroSequence={panels:[{asset:'intro-one.webp',hostedAsset:'intro-one.webp'},{asset:'intro-two.webp',hostedAsset:'intro-two.webp'}]};
  const context=vm.createContext({window:w,document,Image:OriginalImage,URL,console:w.console,
    setTimeout:w.setTimeout,clearTimeout:id=>cancelled.push(id),clearInterval:id=>cancelled.push(id)});
  for(const file of ['src/engine/music-profiles.js','src/engine/level-01-music-profile.js',
    'src/engine/cache-road-proof-profile.js','src/engine/audio.js','src/engine/parallax.js',
    'src/engine/cutscene.js','src/engine/spaceships.js','src/engine/level-scene-resources.js'])
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  const B=w.BARCODE,audio=Object.create(w.AudioSystem.prototype);
  audio.musicTracks={};audio.assetLoadPromises={};audio.resumeCalls=0;
  audio.resumeRuntimeAudio=()=>{audio.resumeCalls++;return Promise.resolve();};w.audioSystem=audio;
  B.CacheRoadProof={active:true,state:{},entryGeneration:1};
  B.Campaign={save:{checkpointId:'intermission',levelState:{collectibles:['original'],returnTo:{levelId:'level-01'}}}};
  const track=(length=48000)=>({buffer:{length,numberOfChannels:2},isPlaying:true,
    source:{stopCalls:0,stop(){this.stopCalls++;},disconnect(){this.disconnected=true;}},gain:{disconnect(){this.disconnected=true;}}});
  B.MusicProfiles.select('level-02.proof');
  for(const source of B.MusicProfiles.get('level-02.proof').arrangement.sources){
    const item=track();audio.musicTracks[source.sourceId]=item;audio.assetLoadPromises[source.assetId]=Promise.resolve(item);
  }
  for(const source of B.MusicProfiles.get('level-01.main').arrangement.sources){
    const item=track();audio.musicTracks[source.sourceId]=item;audio.assetLoadPromises[source.assetId]=Promise.resolve(item);
  }
  audio.titleScreenMusic={buffer:{length:123,numberOfChannels:2}};
  audio.assetLoadPromises['audio.title']=Promise.resolve(audio.titleScreenMusic);
  const titleImage=new OriginalImage();titleImage.src='title.webp';B.assetLoadPromises['image.title']=Promise.resolve(titleImage);
  return {w,B,audio,media,timers,cancelled,OriginalImage,Canvas,track};
}
async function owners(r){
  const {w,OriginalImage,Canvas}=r;
  w.parallaxBackground=new w.ParallaxBackground();
  for(let n=0;n<2;n++){const img=new OriginalImage();img.src='world-'+n;w.parallaxBackground.addLayer({image:img});}
  w.parallaxBackground.loadSkyAnimation();w.parallaxBackground.atmosphereSprites={steam:new Canvas()};
  w.cutsceneSystem=new w.CutsceneSystem();
  for(const item of w.cutsceneSystem.cutsceneImages){item.element=new OriginalImage();item.element.src=item.url;item.loaded=true;}
  w.cutsceneSystem.introCanvas=new Canvas(1920,1080);w.cutsceneSystem.userPaused=true;
  w.cutsceneSystem.ownedTimeouts.add(41);w.cutsceneSystem.ownedIntervals.add(42);
  w.spaceShipSystem=new w.SpaceShipSystem();w.spaceShipSystem.pendingSpawnTimeouts.add(43);
  await flush();assert(w.spaceShipSystem.imagesLoaded.every(Boolean));
}
async function run(){
  const r=rig();await owners(r);const {w,B,audio}=r;
  const old={parallax:w.parallaxBackground,sky:w.parallaxBackground.skyVideo,comic:w.cutsceneSystem,
    ships:w.spaceShipSystem,images:r.media.slice(1)};
  const save=JSON.stringify(B.Campaign.save),titleImage=r.media[0],titleBuffer=audio.titleScreenMusic.buffer;
  const roadTracks=Object.fromEntries(B.MusicProfiles.get('level-02.proof').arrangement.sources.map(s=>[s.sourceId,audio.musicTracks[s.sourceId]]));
  const oldTracks=Object.fromEntries(B.MusicProfiles.get('level-01.main').arrangement.sources.map(s=>[s.sourceId,audio.musicTracks[s.sourceId]]));
  const oldNodes=Object.values(oldTracks).map(track=>track.source);
  B.MusicProfiles.select('level-01.main');assert.equal((await B.LevelSceneResources.releaseLevel1()).reason,'road-not-prepared');
  assert.equal(w.parallaxBackground,old.parallax);B.MusicProfiles.select('level-02.proof');
  const timerCount=r.timers.length,report=await B.LevelSceneResources.releaseLevel1();
  assert(report.ok);assert.equal(report.releasedSourceImages,8);assert.equal(report.releasedImagePixels,8*600);
  assert.equal(report.releasedCanvasPixels,1920*1080+64*64);assert.equal(report.releasedAudioBuffers,3);
  assert.equal(report.releasedAudioBytes,3*48000*2*4);
  assert.equal(r.timers.length,timerCount,'retirement creates no timer or frame owner');
  for(const image of old.images){assert.equal(image.src,'');assert.equal(image.onload,null);assert.equal(image.onerror,null);}
  assert.equal(old.sky.src,'');assert.equal(old.parallax.skyVideo,null);assert.equal(old.ships.disposed,true);
  assert.equal(old.comic.cutsceneImages.length,0);assert.equal(old.comic.ownedTimeouts.size,0);assert.equal(old.comic.ownedIntervals.size,0);
  assert.equal(audio.resumeCalls,0,'retiring a paused old comic cannot start prepared road audio');
  assert.deepEqual(r.cancelled.sort(),[41,42,43]);
  assert.equal(w.parallaxBackground,null);assert.equal(w.cutsceneSystem,null);assert.equal(w.spaceShipSystem,null);
  for(const track of Object.values(oldTracks)){assert.equal(track.buffer,null);assert.equal(track.source,null);assert.equal(track.gain,null);}
  for(const node of oldNodes){assert.equal(node.stopCalls,1);assert.equal(node.disconnected,true);assert.equal(node.buffer,null);}
  for(const [key,track]of Object.entries(roadTracks))assert.equal(audio.musicTracks[key],track);
  assert.equal(audio.titleScreenMusic.buffer,titleBuffer);assert.equal(titleImage.src,'title.webp');
  assert.equal(JSON.stringify(B.Campaign.save),save,'campaign/save state stays intact');
  assert.equal((await B.LevelSceneResources.releaseLevel1()).releasedSourceImages,0,'retirement is idempotent');
  assert(w.initParallax());assert(w.initCutscene());assert(w.initSpaceShips());await flush();
  assert.notEqual(w.parallaxBackground,old.parallax);assert.notEqual(w.cutsceneSystem,old.comic);assert.notEqual(w.spaceShipSystem,old.ships);
  assert(w.parallaxBackground.layers.every(layer=>layer.loaded));assert(w.spaceShipSystem.imagesLoaded.every(Boolean));

  const pending=rig();await owners(pending);const imageJob=deferred(),audioJob=deferred();
  pending.B.assetLoadPromises['image.level-01.pending']=imageJob.promise;
  pending.audio.assetLoadPromises['audio.level-01.fx-layer']=audioJob.promise;
  const kept=pending.audio.musicTracks['fx-layer'],result=await pending.B.LevelSceneResources.releaseLevel1();
  assert.deepEqual(plain(result.pendingImageKeys),['image.level-01.pending']);assert.deepEqual(plain(result.pendingAudioKeys),['audio.level-01.fx-layer']);
  assert.equal(pending.B.assetLoadPromises['image.level-01.pending'],imageJob.promise);assert.equal(pending.audio.musicTracks['fx-layer'],kept);assert(kept.buffer);
  const late=new pending.OriginalImage();late.src='pending.webp';imageJob.resolve(late);audioJob.resolve(kept);await flush();
  const settled=await pending.B.LevelSceneResources.releaseLevel1();assert.equal(late.src,'');assert.equal(kept.buffer,null);assert.equal(settled.releasedAudioBuffers,1);

  const preparing=rig(),preparation=deferred();
  preparing.audio.activeProfilePreparationInFlight=preparation.promise;preparing.audio.activeProfilePreparationKey='level-01.main';
  const untouched=preparing.audio.musicTracks.foundation;
  const omitted=await preparing.B.LevelSceneResources.releaseLevel1();assert.equal(omitted.pendingAudioKeys.length,3);
  assert.equal(preparing.audio.musicTracks.foundation,untouched);assert(untouched.buffer);
  preparation.resolve();preparing.audio.activeProfilePreparationInFlight=null;preparing.audio.activeProfilePreparationKey=null;
  assert.equal((await preparing.B.LevelSceneResources.releaseLevel1()).releasedAudioBuffers,3);

  const cancelled=rig();await owners(cancelled);const owner=cancelled.w.parallaxBackground;
  const obsolete=cancelled.B.LevelSceneResources.releaseLevel1();cancelled.B.CacheRoadProof.entryGeneration++;
  assert.equal((await obsolete).reason,'handoff-cancelled');assert.equal(cancelled.w.parallaxBackground,owner);
  console.log(JSON.stringify({passed:true,productionOwnerCleanup:true,productionInitializerReload:true,
    exactProfileAudioScope:true,preparedRoadAndTitlePreserved:true,savesPreserved:true,pendingJobsOmitted:true,
    cancelledHandoffPreserved:true,releasedFixtureOriginalPixels:report.releasedImagePixels,
    releasedFixtureAudioBytes:report.releasedAudioBytes,performanceAcceptance:false,
    limitation:'Actual production owner/profile contracts with host image/audio boundaries; OS reclamation remains browser evidence.'}));
}
run().catch(error=>{console.error(error.stack);process.exitCode=1;});
