'use strict';
// Removing the earned Continue action or resuming the old proof instead of Mac must fail this real-owner route.
const assert=require('node:assert/strict');
const {completionRig,start,driveToClear}=require('./check-cache-completion-flow.cjs');
const {rig,plain}=require('./check-mac-street-integration.cjs');
async function main(){
 const road=completionRig();await start(road);driveToClear(road);road.ending.skipToReady();road.ending.finish();road.road.resultControlsReady=true;
 assert(road.road.resultButtons().some(b=>b.id==='continue'),'Earned Level2 results must offer Continue to Level3');
 const archive=plain(road.C.archive().record),facts=plain(archive.progress);
 // Existing publicly earned saves must reopen their results without replaying the race.
 const existing=completionRig(road.storage);await existing.boot(plain(archive.current));
 assert.equal(existing.road.status,'clear');assert(existing.road.resultButtons().some(b=>b.id==='continue'));
 const unreadSave=plain(archive.current);unreadSave.levelState.chapter.delivery.ending.done=false;
 const unread=completionRig();await unread.boot(unreadSave);
 assert(unread.ending.active);unread.ending.skipToReady();unread.ending.finish();
 assert(unread.road.resultButtons().some(b=>b.id==='continue'));
 // Unfinished authored chapters expose Resume Ending; legacy proof clears expose no Continue.
 const savedButtons=road.road.resultButtons();
 assert(savedButtons.every(b=>b.x>=0&&b.x+b.w<=1920));
 assert.equal(savedButtons.length,4);
 const oldChapter=road.road.chapter;road.road.chapter=null;
 assert(!road.road.resultButtons().some(b=>b.id==='continue'));road.road.chapter=oldChapter;
 // Real Mac asset hash preparation, story/combat, lifecycle, input and durable archive.
 const r=rig({touch:true,campaignSave:archive,campaignRoad:true}),B=r.B,mac=B.MacCombatPreview;
 const booted=await B.Campaign.continueSaved();assert(booted.ok,JSON.stringify(booted));
 assert.equal(B.RuntimeLifecycle.getState(),'running');assert.equal(r.scheduled.size,1);
 const handoff=B.CacheRoadProof;handoff.resultControlsReady=true;
 let starting;const actualEntry=mac.enterCampaign.bind(mac);mac.enterCampaign=(...args)=>(starting=actualEntry(...args));
 r.key('keydown','Enter');const result=await starting;

 assert(result.ok,'Earned results should enter Mac');
 assert(mac.active);assert.equal(mac.phase,'intro');assert.equal(handoff.active,false);
 const saved=B.Campaign.readResume();assert.equal(saved.levelId,'level-03');assert.equal(saved.checkpointId,'mac-city-entry');
 assert.deepEqual(plain(B.Campaign.archive().record.progress),facts,'Handoff must preserve rewards and results');
 assert(!facts.completedLevels.includes('level-03'),'Entry must not award Level3');
 r.frame();assert.equal(r.scheduled.size,1);assert.equal(B.RuntimeLifecycle.getState(),'running');
 r.key('keyup','Enter');r.frame();
 const reopen=rig({campaignSave:plain(B.Campaign.archive().record),campaignRoad:true});
 const resumed=await reopen.B.Campaign.continueSaved();
 assert(resumed.ok,JSON.stringify(resumed));assert(reopen.B.MacCombatPreview.active);
 assert.equal(reopen.B.MacCombatPreview.phase,'intro');assert.equal(reopen.B.RuntimeLifecycle.getState(),'running');
 assert.deepEqual(plain(reopen.B.Campaign.archive().record.progress),facts);
 // Missing or corrupt new entry must never dispatch the obsolete prototype.
 const corrupt=plain(B.Campaign.archive().record);corrupt.current.levelState.macVersion=99;
 const bad=rig({campaignSave:corrupt});bad.B.Campaign.syncTitleButton();
 assert.equal(bad.B.Campaign.readResume(),null);assert(bad.doc.getElementById('continueButton').hidden);
 // The confirmation held during transition cannot advance the first authored scene.
 const intro=resumed && reopen.B.MacCombatPreview, before=plain(intro.story.snapshot());
 reopen.manager.resultKeysHeld.add('enter');intro.update(16);intro.keyDown({key:'Enter',repeat:true,preventDefault(){}});
 assert.deepEqual(plain(intro.story.snapshot()),before);
 reopen.manager.resultKeysHeld.clear();intro.update(16);assert(intro.campaignInputReady);
 // Return from a restored Mac entry restores bindings; a new run returns to the ordinary Level1 scene owner.
 const priorKeys=plain(reopen.B.MacCombatPreview.previousKeyboard);
 await reopen.B.RuntimeLifecycle.returnToTitle({source:'campaign-regression'});
 assert(!reopen.B.MacCombatPreview.active);assert.deepEqual(plain(reopen.manager.actionInput.keyboardBindings),priorKeys);
 let level1Scenes=0;reopen.B.PresentationAssets={async selectLevel1Scene(){level1Scenes++;}};
 assert((await reopen.B.RuntimeLifecycle.start({initialStart:true})).ok);
 assert.equal(level1Scenes,1);assert(!reopen.B.MacCombatPreview.active);assert.equal(reopen.scheduled.size,1);
 // Device failure after keys/readouts are set leaves earned results and save recoverable.
 const fail=rig({campaignSave:archive,campaignRoad:true});assert((await fail.B.Campaign.continueSaved()).ok);
 const prepareNormally=fail.w.audioSystem.prepareActiveMusicProfile;let audioAttempt=0;
 fail.w.audioSystem.prepareActiveMusicProfile=async()=>fail.B.MusicProfiles.getActive().profileId==='level-03.proof' && ++audioAttempt===1 ? {ok:false} : prepareNormally();
 const originalKeys=plain(fail.manager.actionInput.keyboardBindings);
 const liveRoad=fail.B.CacheRoadProof;liveRoad.resultControlsReady=true;
 const oldCurrent=plain(fail.B.Campaign.archive().record.current);
 const failed=await fail.B.MacCombatPreview.enterCampaign(liveRoad);
 assert.equal(failed.ok,false);assert(liveRoad.active);assert(liveRoad.macHandoffError);
 assert(!fail.B.MacCombatPreview.active);assert.deepEqual(plain(fail.manager.actionInput.keyboardBindings),originalKeys);
 assert.deepEqual(plain(fail.B.Campaign.archive().record.current),oldCurrent);
 assert.deepEqual(plain(fail.B.Campaign.archive().record.progress),facts);
 assert.equal(fail.B.MusicProfiles.getActive().profileId,'level-02.proof');
 assert.equal(fail.B.RuntimeLifecycle.getState(),'running');assert.equal(fail.scheduled.size,1);
 // A refused durable write must retain the existing publicly earned save, with no Mac activation.
 const denied=rig({campaignSave:archive,campaignRoad:true});assert((await denied.B.Campaign.continueSaved()).ok);
 denied.B.CacheRoadProof.resultControlsReady=true;
 const write=denied.w.localStorage.setItem.bind(denied.w.localStorage);
 denied.w.localStorage.setItem=(key,value)=>{if(key.endsWith('.pending'))throw Error('quota-denied');return write(key,value);};
 assert.equal((await denied.B.CacheRoadProof.resultAction('continue')).ok,false);
 assert(denied.B.CacheRoadProof.active);assert(!denied.B.MacCombatPreview.active);
 assert.equal(denied.B.Campaign.readResume().levelId,'level-02');
 assert.deepEqual(plain(denied.B.Campaign.archive().record.progress),facts);
 // Legacy saved prototype remains readable/restorable through its actual old adapter.
 const {load}=require('./check-level-01-boss');
 const legacy=completionRig();load(legacy.context,'src/engine/broadcast-slum-proof-profile.js');load(legacy.context,'src/game/broadcast-slum-proof.js');
 await legacy.boot();assert((await legacy.bridge.architecture()).ok);
 const proofSave=plain(legacy.C.readResume());assert.equal(proofSave.levelId,'level-03');
 load(legacy.context,'src/game/mac-combat-preview.js');
 assert(legacy.C.readResume());assert(legacy.C.restore(proofSave));
 assert(legacy.B.RunAndGunProof.active);assert(!legacy.B.MacCombatPreview.active);
 // A cancelled stale audio preparation cannot dispose a newer started chapter.
 let releaseOld,enteredOld;const waitOld=new Promise(resolve=>releaseOld=resolve),atAudio=new Promise(resolve=>enteredOld=resolve);
 let initCalls=0;
 const cancelled=rig({campaignSave:archive,initAudio:()=>{if(++initCalls===1){enteredOld();return waitOld;}return Promise.resolve();}});
 const cancelRoad={active:true,status:'clear',chapter:plain(archive.current.levelState.chapter),resultControlsReady:true,entryGeneration:4,dispose(){this.active=false;this.entryGeneration++;}};
 const oldStart=cancelled.B.MacCombatPreview.enterCampaign(cancelRoad);await atAudio;
 cancelled.B.MacCombatPreview.dispose();cancelRoad.dispose();
 await cancelled.start();const newerGeneration=cancelled.B.MacCombatPreview.generation;
 releaseOld();assert.equal((await oldStart).ok,false);
 assert(cancelled.B.MacCombatPreview.active);assert.equal(cancelled.B.MacCombatPreview.generation,newerGeneration);
 assert.deepEqual(plain(cancelled.B.Campaign.archive().record.current),archive.current);
  // Controller A and the actual portrait touch button enter through the same result action/window.
 for (const device of ['controller','touch']) {
   const owner=rig({touch:device==='touch',campaignSave:archive,campaignRoad:true});
   assert((await owner.B.Campaign.continueSaved()).ok);
   owner.B.CacheRoadProof.resultControlsReady=true;
   let requested;const entry=owner.B.MacCombatPreview.enterCampaign.bind(owner.B.MacCombatPreview);
   owner.B.MacCombatPreview.enterCampaign=(...args)=>(requested=entry(...args));
   if(device==='controller') {
     const pad={id:'Xbox campaign test',index:0,connected:true,mapping:'standard',axes:[0,0],
       buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
     owner.pads[0]=pad;owner.manager.routeGamepadUI();
     pad.buttons[0]={pressed:true,value:1};owner.manager.routeGamepadUI();
   } else {
     const node=owner.button('road:result:continue');
     owner.pointer(node,'pointerdown',1);
   }
   assert(requested,device+' exposes the actual Continue intent');assert((await requested).ok);
   assert(owner.B.MacCombatPreview.active);assert(!owner.B.CacheRoadProof.active);
   owner.frame();assert.equal(owner.scheduled.size,1);
   assert.equal(owner.B.Campaign.readResume().checkpointId,'mac-city-entry');
 }
 // Pause during awaited Mac audio must leave the same running owner's paused Level2 results intact.
 let releaseAudio,signalAudio;const pendingAudio=new Promise(resolve=>releaseAudio=resolve),awaitingAudio=new Promise(resolve=>signalAudio=resolve);
 const paused=rig({campaignSave:archive,campaignRoad:true});assert((await paused.B.Campaign.continueSaved()).ok);
 const pausedRoad=paused.B.CacheRoadProof;pausedRoad.resultControlsReady=true;
 const defaultPrepare=paused.w.audioSystem.prepareActiveMusicProfile;
 let firstMac=true;paused.w.audioSystem.prepareActiveMusicProfile=async()=>{
   if(firstMac&&paused.B.MusicProfiles.getActive().profileId==='level-03.proof'){firstMac=false;signalAudio();return pendingAudio;}
   return defaultPrepare();
 };
 const pausing=pausedRoad.resultAction('continue');await awaitingAudio;
 assert(!paused.B.MacCombatPreview.active,'Mac cannot own gameplay/input/render before audio and durable entry are ready');
 assert(pausedRoad.active);assert.equal(paused.B.Campaign.readResume().levelId,'level-02');
 paused.manager.routeGamepadUI();assert.equal(paused.B.GamepadUI.owner,'road-results');
 await paused.B.RuntimeLifecycle.pause();releaseAudio({ok:true});assert.equal((await pausing).ok,false);
 assert(pausedRoad.active);assert.equal(pausedRoad.status,'clear');assert.equal(paused.B.RuntimeLifecycle.getState(),'paused');
 assert.equal(paused.B.MusicProfiles.getActive().profileId,'level-02.proof');
 assert.equal(paused.B.Campaign.readResume().levelId,'level-02');
 assert(!paused.B.MacCombatPreview.active);
 await paused.B.RuntimeLifecycle.resume();assert((await pausedRoad.resultAction('continue')).ok);
 assert(paused.B.MacCombatPreview.active);assert.equal(paused.scheduled.size,1);
 console.log('Level3 campaign: earned real-road Continue, actual Mac entry/checkpoint and real title Continue passed.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
