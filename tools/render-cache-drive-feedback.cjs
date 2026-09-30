#!/usr/bin/env node
// Native production UI fixtures plus separately identified real-input race frames.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'..');process.chdir(repo);
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const {runRace}=require('./check-cache-road-races.cjs');
const {createCanvas,loadImage,GlobalFonts}=require(path.join(repo,'node_modules/@napi-rs/canvas'));
const {createRig,load}=require(path.join(repo,'tools/check-level-01-boss'));
async function main(){
 const sources=['src/game/cache-road-guidance.js','src/game/cache-road-proof.js','src/game/cache-road-encounters.js','src/game/cache-road-reactions.js','src/game/cache-road-pursuit.js','src/game/pause-menu.js','src/engine/cache-road-proof-profile.js','src/engine/presentation-assets.js','tools/render-cache-drive-feedback.cjs','tools/check-cache-road-races.cjs'];
 const sourceHashes=Object.fromEntries(sources.map(file=>[file,hash(path.join(repo,file))]));
 GlobalFonts.registerFromPath(path.join(repo,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
 const manifest=fs.readFileSync('src/engine/presentation-assets.js','utf8'),defs=createRig();defs.w.Image=undefined;
 vm.runInContext(manifest.replace('  const cache = {};','  window.entries=entries;\n  const cache = {};'),defs.context);
 const images=Object.fromEntries(await Promise.all(Object.entries(defs.w.entries).filter(([key])=>key.startsWith('cache')).map(async([key,e])=>[key,await loadImage(path.join(repo,e.path))])));
 const {w,context}=createRig(),B=w.BARCODE;B.Campaign={register(){},syncTitleButton(){}};
 for(const file of ['src/core/gamepad-ui.js','src/engine/cache-road-proof-profile.js','src/game/cache-road-landscape.js','src/game/cache-road-guidance.js','src/game/pause-menu.js'])load(context,file);
 vm.runInContext(fs.readFileSync('src/game/cache-road-proof.js','utf8').replace('  B.Campaign.register(ID,','  window.guideReview={newState};\n  B.Campaign.register(ID,'),context);
 w.Image=undefined;w.images=images;
 vm.runInContext(manifest.replace('  const cache = {};','  const cache=Object.fromEntries(Object.entries(window.images).map(([key,image])=>[key,{image,ready:true}]));'),context);
 B.CacheChapter={recordIds:['r1','r2','r3','r4']};
 const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d'),out=path.resolve(process.argv[2]||'docs/source-pack/review-cache-drive-feedback');fs.mkdirSync(out,{recursive:true});
 const fixtures=[],raceStills=[];
 const sheet=createCanvas(1280,5*386),sc=sheet.getContext('2d');sc.fillStyle='#071b27';sc.fillRect(0,0,sheet.width,sheet.height);
 const cases=[['keyboard-one',{controller:false,musicBeatFloat:3.8}],['xbox-one',{controller:true,labels:'xbox',musicBeatFloat:4}],['playstation-one',{controller:true,labels:'playstation',musicBeatFloat:4}],['success',{musicBeatFloat:4,driveFeedback:{kind:'perfect',action:0,lane:0,expiresMs:2000},mixFeedback:{kind:'join',lane:0,holdBars:3,expiresMs:2200},pulseFlashAction:0,pulseFlashLane:0,pulseFlashMs:600,pulseTiming:'PERFECT'}],['wrong-button',{driveFeedback:{kind:'button',action:0,lane:0,expiresMs:2000}}],['pause-keyboard',{pause:true}],['pause-xbox',{pause:true,controller:true,labels:'xbox'}],['pause-playstation',{pause:true,controller:true,labels:'playstation'}],['echo-exit',{progress:9800,gateAt:9900,musicBeatFloat:370,musicBar:92,lanePos:0,echoEnergy:100}]];
 for(const [name,extra] of cases){
 const s=Object.assign(w.guideReview.newState(),{progress:130,elapsedMs:1000,lane:0,lanePos:0,visualLane:0,speed:52,gear:1,timeMs:55000,integrity:3,musicBar:0,musicBeatFloat:3,pendingGear:null,echoEnergy:77,nearMisses:1,captures:[],queuedCaptures:[],pulseTargets:{'0/0/0':4},pulsePlaces:{'0/0/0':146.469},audits:[],streetMotion:{},driveSections:[{beat:0,beatSec:60/128,from:52,v0:52,speed:52,gear:1}]},extra);
 B.GamepadUI.connected=!!extra.controller;B.ControllerSettings.labels=extra.labels||'auto';
 const road=B.CacheRoadProof;road.state=s;road.active=true;road.status='playing';road.chapter={records:[],difficultyId:'standard',encounterVersion:2};road.audioDegraded=false;
 if(name==='success'){s.caughtPulses['0/0/0']=true;s.pulseHoldBars=B.MusicProfiles.get('level-02.proof').laneMix.reactive.captureBars;s.mixFeedback.holdBars=s.pulseHoldBars;}
 ctx.reset();road.draw(ctx);if(extra.pause)B.PauseMenu.draw(ctx);
 const index=fixtures.length,x=(index%2)*640,y=Math.floor(index/2)*386;
 sc.fillStyle='#c1eadf';sc.font='17px Oxanium';sc.fillText(`FIXTURE / ${name}`,x+12,y+20);sc.drawImage(canvas,x,y+26,640,360);
 const file=`Fixture-${name}.webp`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/webp',92));
 fixtures.push({file,kind:'staged-ui-state',controller:extra.labels||(extra.controller?'xbox':'keyboard'),sha256:hash(path.join(out,file))});
 }
 fs.writeFileSync(path.join(out,'Controls-and-Feedback.webp'),sheet.toBuffer('image/webp',93));
 const badgeSheet=createCanvas(1500,440),bc=badgeSheet.getContext('2d');bc.fillStyle='#0b2332';bc.fillRect(0,0,1500,440);
 for(const [row,mode] of ['keyboard','xbox','playstation'].entries()){
 B.GamepadUI.connected=mode!=='keyboard';B.ControllerSettings.labels=mode==='keyboard'?'auto':mode;
 bc.fillStyle='#d1ebdf';bc.font='18px Oxanium';bc.fillText(mode.toUpperCase(),18,30+row*145);
 for(let i=0;i<6;i++){B.CacheRoadGuidance.drawButton(bc,{index:i,x:140+i*235,y:79+row*145,size:77});
 bc.fillStyle=B.CacheRoadGuidance.badges[i].color;bc.font='17px Oxanium';bc.fillText(B.CacheRoadGuidance.badges[i].name,108+i*235,136+row*145);}}
 fs.writeFileSync(path.join(out,'Control-Badges.webp'),badgeSheet.toBuffer('image/webp',95));
 // A second evidence set comes from one complete real-input controller race.
 // Its snapshots never alter positions, health, captures, charges or score.
 const taken=new Set();
 const race=await runRace({difficulty:'standard',gear:1,profile:'practiced',async onReady(r){
 if(!r.B.CacheRoadGuidance)load(r.context,'src/game/cache-road-guidance.js');
 r.w.Image=undefined;r.w.nativeReviewImages=images;
 vm.runInContext(manifest.replace('  const cache = {};','  const cache=Object.fromEntries(Object.entries(window.nativeReviewImages).map(([key,image])=>[key,{image,ready:true}]));'),r.context);
 },async onFrame(r){
 const s=r.road.state,bar=s.musicBeatFloat/4;
 const names=[];
 if(s.driveFeedback&&s.elapsedMs<s.driveFeedback.expiresMs&&['good','perfect'].includes(s.driveFeedback.kind))names.push('Capture');
 if(s.driveFeedback?.kind==='record'&&s.elapsedMs<s.driveFeedback.expiresMs)names.push('Record');
 if(bar>=33&&bar<34)names.push('Freight');
 if(s.echo&&bar>=56&&bar<62)names.push('Echo');
 if(s.gateAt!==null&&!s.gateOpen&&s.progress>=s.gateAt-150)names.push('Delivery-split');
 if(s.gateOpen)names.push('Exit-clear');
 for(const name of names){if(taken.has(name))continue;taken.add(name);ctx.reset();r.drawRoad(ctx);
 const file=`Race-${name}.webp`;fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/webp',92));
 raceStills.push({file,kind:'actual-production-input-race-state',bar,elapsedMs:s.elapsedMs,lane:s.lanePos,integrity:s.integrity,sha256:hash(path.join(out,file))});}
 }});

 const report={kind:'native-production-readability-review',dimensions:{width:1920,height:1080},fixtures,raceStills,
 race:{status:race.result.status,encounterVersion:race.result.encounterVersion,gear:race.result.gear,difficulty:race.result.difficulty,profile:race.result.profile,finalBar:race.result.finalBar,captured:race.result.captured,damageTaken:race.result.damageTaken,gateOpen:race.result.gateOpen},
 sourceHashes,
 limitations:'Fixture files stage UI states over the production road renderer. Race files are actual frames from a complete production-input-driven Standard / Gear 2 run. Native Canvas and host audio/storage boundaries are simulated; no human, browser, Makko, physical-controller or sound-mix acceptance is claimed.'};
 for(const [file,digest] of Object.entries(sourceHashes))assert.equal(hash(path.join(repo,file)),digest,`Source changed during render: ${file}`);
 fs.writeFileSync(path.join(out,'README.md'),'# Cache drive readability review\n\n'+report.limitations+'\n\n`Controls-and-Feedback.webp` compares the nine named UI fixtures. `Control-Badges.webp` shows the six controls using keyboard, Xbox and PlayStation labels. Full-resolution `Fixture-` images isolate presentation states; `Race-` images come from the separately simulated full race. All images use the production Canvas and local authored art. Run `node tools/render-cache-drive-feedback.cjs` to rebuild. Source hashes are fenced against edits during the render.\n');
 fs.writeFileSync(path.join(out,'Readability-Review.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({out,fixtures:fixtures.length,raceStills:raceStills.length,race:report.race}));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
