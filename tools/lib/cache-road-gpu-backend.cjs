'use strict';
const assert=require('node:assert/strict');

function classifyBackend(gl,gpu){
  const unavailable=gpu?.status==='unavailable'||!gl,
    software=/(SwiftShader|llvmpipe|lavapipe|swrast|software rasterizer|Microsoft Basic Render)/i.test(gl?.renderer||''),
    unidentified=!gl?.unmaskedRenderer||!gl?.renderer,
    hardware=!unavailable&&!software&&!unidentified;
  return {backend:unavailable?'unavailable GL':software?'software GL':unidentified?'unidentified GL':'default hardware GL',
    hardware,unavailable,software,unidentified,gl:gl||null};
}

function inspectBootstrap(snapshot){
  const gpu=snapshot.gpu;
  assert(gpu,'Actual renderer diagnostics are absent');
  assert.equal(gpu.error,null,'Renderer initialization failed before backend classification');
  assert(['ready','unavailable'].includes(gpu.status),'Renderer preparation has not settled successfully');
  assert.equal(snapshot.road.active,true,'Normal Road entry did not complete');
  assert.equal(snapshot.road.presentationPreparing,false,'Road presentation preparation is still pending');
  assert.equal(snapshot.warmupActive,null,'GPU warmup is still pending');
  // These keys describe loaded original art, independently of GPU support.
  assert.equal(snapshot.presentationResult?.complete,true,'Original scene preparation failed');
  assert.deepEqual(snapshot.presentationResult?.missingKeys,[],'Original scene sources are missing');
  const bank=gpu.textureBank;
  if(bank){assert.equal(bank.workerActive,false,'Decoder worker remains active');
    assert.equal(bank.pendingJobs,0,'Decoder jobs remain pending');
    assert.equal(bank.lastResult?.failed?.length||0,0,'Compressed preparation failed');
    assert.equal(bank.lastResult?.unlisted?.length||0,0,'Compressed preparation has unlisted sources');}
  if(gpu.status==='ready'){
    assert(snapshot.gl,'Initialized game GPU context was not observed');
    assert.equal(snapshot.actualContext?.width,1920);assert.equal(snapshot.actualContext?.height,1080);
    assert.equal(snapshot.actualContext?.lost,false,'Initialized game GPU context was lost');
    assert.equal(gpu.warmup?.ready,true,'GPU source warmup failed');
    assert.equal(gpu.pendingSources,0,'Visible GPU sources remain pending');
    assert.equal(gpu.worldCompiler?.enabled,true,'World shader compiler failed or is unsupported');
    assert.equal(snapshot.compressedBankAcceptance?.accepted,true,
      'Settled GPU bank must cover all171 sources,149compressed+22SVG, exact mip bytes and zero codec/original fallback');
  }
  return {status:'passed',stage:'normal Road entry and settled presentation preparation',
    normalEntry:true,rendererStatus:gpu.status,
    gpuPreparation:gpu.status==='ready'?{status:'passed',sourceCount:gpu.residentSources,
      presentationResult:snapshot.presentationResult,compressedCount:gpu.compressedSources,
      originalSvgCount:gpu.expectedOriginalSources,sourceFormats:gpu.sourceFormats,
      compressedBankAcceptance:snapshot.compressedBankAcceptance}:
      {status:'notExercised',reason:'GL unavailable; GPU upload preparation cannot be exercised'},
    compiler:gpu.worldCompiler||null,decoder:bank||null,
    limitation:'Bootstrap and settled resource preparation do not exercise driving, audio, controls or recovery.'};
}

function unexercisedGate(snapshot,scenario,sourceCommit,inputHashes){
  const classification=classifyBackend(snapshot.gl,snapshot.gpu);
  assert.equal(classification.hardware,false,'Hardware must retain the complete gameplay and numeric gate');
  const bootstrap=inspectBootstrap(snapshot),reason=classification.backend+' cannot provide hardware gameplay acceptance',
    functionalScenarios=Object.fromEntries(['naturalHudHandoff','gameplay','controls','pauseResume','activeAudio',
      'contextRecovery','level1Return'].map(name=>[name,{status:'notExercised',reason}]));
  return {status:'performanceUnexercised',backend:classification.backend,performanceExercised:false,
    functionalStatus:'notExercised',functionalScenarios,bootstrap,scenario,sourceCommit,inputHashes,
    budgetMs:1000/30,cpuDrawMedianMs:null,cpuDrawP95Ms:null,cpuDrawMaxMs:null,observedRafCadence:null,
    fullyGpuAccepted:null,fullyGpu:null,zeroDrivingUploads:null,completeLevelSources:null,
    directPresentAccepted:null,directScreenAcceptance:null,zeroCanvasCopies:null,measuredTextureUploads:null,
    gl:classification.gl,
    limitation:'Actual game context classified before the natural HUD wait. No GPU gameplay, controls, audio, recovery or performance result is accepted; required native browser checks run separately.'};
}
module.exports={classifyBackend,inspectBootstrap,unexercisedGate};
