// Exhaustive production-route playback coverage. Canvas is a recording
// boundary here; the same audit runs with real images/Canvas in Chromium.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createRig,load}=require('./check-level-01-boss');
const audit=require('./cache-road-animation-routes.cjs');
const {w,context}=createRig();
w.BARCODE.Campaign={register(){},syncTitleButton(){}};
load(context,'src/engine/cache-road-proof-profile.js');
for(const file of ['src/game/cache-road-landscape.js','src/game/cache-road-guidance.js',
  'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js',
  'src/game/cache-road-pursuit.js','src/game/cache-road-boss-art.js',
  'src/game/cache-road-combat.js','src/game/cache-road-combat-art.js',
  'src/game/cache-road-crosswalks.js','src/game/cache-road-mirror.js',
  'src/game/cache-road-crew-callouts.js'])load(context,file);
const source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
const marker='  B.Campaign.register(ID,';
assert(source.includes(marker));
vm.runInContext(source.replace(marker,
  '  window.animationEntities={HAZARDS,STREET_ITEMS,AMBIENT_PLATES:[...AMBIENT_PLATES]};\n'+
  '  window.animationNewState=newState;\n'+marker),context);
vm.runInContext(fs.readFileSync('src/engine/presentation-assets.js','utf8')
  .replace('  const cache = {};','  window.animationDefinitions=entries;\n  const cache = {};'),context);
const definitions=w.animationDefinitions,loaded=[];
w.Image=class {
  set src(url) {
    const entry=Object.values(definitions).find(entry=>url.endsWith(entry.path));
    assert(entry,`unknown asset ${url}`);
    this.naturalWidth=entry.columns*600;this.naturalHeight=entry.rows*600;
    loaded.push(url);this.onload?.();
  }
};
w.BARCODE.PresentationAssets.preload();
const stack=[],gradient={addColorStop(){}};let atlasDraws=0;
const ctx=new Proxy({canvas:{width:1920,height:1080},globalAlpha:1,filter:'none',
  save(){stack.push({filter:this.filter,globalAlpha:this.globalAlpha});},
  restore(){Object.assign(this,stack.pop());},
  createLinearGradient(){return gradient;},createRadialGradient(){return gradient;},
  measureText(text){return {width:String(text).length*12};},
  drawImage(image,...args){
    assert(args.every(Number.isFinite),'non-finite image coordinate');
    // World materials use documented sourceRect dimensions larger than
    // these dummy images; atlas crop pixels are verified by Chromium.
    atlasDraws++;
  }
},{get:(target,key)=>key in target?target[key]:()=>{}});
const road=w.BARCODE.CacheRoadProof;road.active=true;road.status='playing';
road.state=w.animationNewState();
const result=audit({B:w.BARCODE,ctx,newState:w.animationNewState,
  entities:w.animationEntities,definitions});
assert.equal(result.animatedKeys,58,'inventory includes every retained road/pursuit atlas, five combat atlases and two contact-feedback atlases');
assert.equal(result.legacyAnimatedKeys,51,'every original legacy animation assertion is retained');
assert.deepEqual(result.authoredCombatKeys,
  ['cacheCombatBike','cacheCombatHostiles','cacheCombatBikeCrash','cacheCombatBlast','cacheCombatFX']);
assert.deepEqual(result.authoredFeedbackKeys,['cacheBloodSplatter','cacheCrewCallouts']);
assert.deepEqual(result.main.cacheBloodSplatter,[0,1,2,3,4,5]);
assert.deepEqual(result.mirror.cacheBloodSplatter,[0,1,2,3,4,5]);
assert.deepEqual(result.main.cacheCrewCallouts,[0,1,2]);
assert(!result.mirror.cacheCrewCallouts,'crew portraits belong only to the main HUD');
assert.equal(loaded.length,Object.keys(definitions).length);
assert(stack.length===0,'all production canvas scopes restored');
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');
console.log(`Cache Road animation routes passed: ${result.animatedKeys} atlas keys (${result.legacyAnimatedKeys} legacy plus five combat and two contact-feedback), ${result.productionDraws} production draws, ${atlasDraws} image submissions; all cels, both walking views/banks and rearview, all prop/ambient families, owner-selected mirror moods, ships, eight pursuit poses, four live impacts, all 32 combat body cells and six blood cells in both cameras, 12 front projectile/contact cells and three main-HUD crew portraits, and Reduced Motion. Staged physical-contact diagnostics remain separate from earned-input race evidence.`);
