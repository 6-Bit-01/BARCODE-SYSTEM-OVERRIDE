'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {classifyBackend,inspectBootstrap,unexercisedGate}=require('./lib/cache-road-gpu-backend.cjs');
const checker=fs.readFileSync(path.join(__dirname,'check-cache-road-gpu-browser.cjs'),'utf8');
const prepared=()=>({gl:{renderer:'ANGLE (Google, Vulkan SwiftShader Device)',unmaskedRenderer:true},
  actualContext:{width:1920,height:1080,lost:false},
  gpu:{status:'ready',error:null,residentSources:171,compressedSources:149,expectedOriginalSources:22,
    pendingSources:0,warmup:{ready:true},worldCompiler:{enabled:true},
    textureBank:{workerActive:false,pendingJobs:0,lastResult:{failed:[],unlisted:[]}}},
  road:{active:true,presentationPreparing:false},warmupActive:null,
  presentationResult:{complete:true,missingKeys:[]},compressedBankAcceptance:{accepted:true}});
const hardware={renderer:'ANGLE (AMD, AMD Radeon RX 6600 Direct3D11)',unmaskedRenderer:true};
let groups=0;
function check(run){run();groups++;}

check(()=>{
  assert.equal(classifyBackend(hardware,{status:'ready'}).hardware,true);
  assert.equal(classifyBackend({renderer:'llvmpipe (LLVM 19)',unmaskedRenderer:true},{status:'ready'}).backend,'software GL');
  assert.equal(classifyBackend({renderer:'WebKit WebGL',unmaskedRenderer:false},{status:'ready'}).backend,'unidentified GL');
  assert.equal(classifyBackend(null,{status:'unavailable'}).backend,'unavailable GL');
});
check(()=>{
  const gate=unexercisedGate(prepared(),'fresh','head',{});
  assert.equal(gate.status,'performanceUnexercised');assert.equal(gate.performanceExercised,false);
  assert.equal(gate.functionalStatus,'notExercised');assert.equal(gate.bootstrap.status,'passed');
  for(const field of ['cpuDrawMedianMs','cpuDrawP95Ms','cpuDrawMaxMs','observedRafCadence','fullyGpuAccepted',
    'fullyGpu','zeroDrivingUploads','completeLevelSources','directPresentAccepted','directScreenAcceptance',
    'zeroCanvasCopies','measuredTextureUploads'])assert.equal(gate[field],null);
  for(const field of ['naturalHudHandoff','gameplay','controls','pauseResume','activeAudio','contextRecovery','level1Return'])
    assert.equal(gate.functionalScenarios[field].status,'notExercised');
  assert.equal(gate.budgetMs,1000/30);assert.equal(gate.gl.renderer,prepared().gl.renderer);
});
check(()=>{
  const state=prepared();state.gl=hardware;
  assert.throws(()=>unexercisedGate(state,'boss','head',{}),/Hardware must retain/);
  assert.equal(inspectBootstrap(state).status,'passed');
});
check(()=>{
  const state=prepared();state.gl=null;state.actualContext=null;state.gpu.status='unavailable';
  state.gpu.warmup={ready:false};state.gpu.worldCompiler={enabled:false};state.compressedBankAcceptance={accepted:false};
  const gate=unexercisedGate(state,'fresh','head',{});
  assert.equal(gate.bootstrap.gpuPreparation.status,'notExercised');assert.equal(gate.functionalStatus,'notExercised');
  state.presentationResult.missingKeys=['missing-original'];state.presentationResult.complete=false;
  assert.throws(()=>unexercisedGate(state,'fresh','head',{}),/Original scene preparation failed/);
});
check(()=>{
  for(const mutate of [s=>{s.gpu.error='Shader compilation failed';},s=>{s.gpu.status='lost';},
    s=>{s.gpu.worldCompiler.enabled=false;},s=>{s.gpu.warmup.ready=false;},
    s=>{s.presentationResult.missingKeys=['missing'];},s=>{s.road.presentationPreparing=true;},
    s=>{s.warmupActive={};},s=>{s.gpu.pendingSources=1;},s=>{s.compressedBankAcceptance.accepted=false;},
    s=>{s.gpu.textureBank.workerActive=true;},s=>{s.gpu.textureBank.pendingJobs=1;},
    s=>{s.gpu.textureBank.lastResult.failed=['bad-codec'];},s=>{s.gpu.textureBank.lastResult.unlisted=['bad-key'];}]){
    const state=prepared();mutate(state);assert.throws(()=>unexercisedGate(state,'fresh','head',{}));
  }
});
check(()=>{
  const start=checker.indexOf('function backendSnapshot(){'),end=checker.indexOf('\nasync function main(){',start);
  assert(start>=0&&end>start,'Actual browser snapshot function is absent');
  const gpu=prepared().gpu,ctx={canvas:{width:1920,height:1080,id:'cacheRoadGpuCanvas'},isContextLost:()=>false,
    VERSION:'version',VENDOR:'vendor',RENDERER:'renderer',
    getExtension:()=>({UNMASKED_VENDOR_WEBGL:'unmaskedVendor',UNMASKED_RENDERER_WEBGL:'unmaskedRenderer'}),
    getParameter:key=>({version:'WebGL2',unmaskedVendor:'AMD',unmaskedRenderer:hardware.renderer})[key],getContextAttributes:()=>({antialias:false})};
  const host={BARCODE:{CacheRoadGPU:{diagnostics:()=>gpu},CacheRoadProof:{active:true,presentationPreparing:false,
      presentationResult:{complete:true,missingKeys:[]}}},
    gpuSmoke:{gpuContext:ctx,gl:{renderer:'auxiliary SwiftShader probe',unmaskedRenderer:true},warmupCalls:[],contexts:[]},
    performance:{getEntriesByType:()=>[]},location:{origin:'http://game.local'}};
  vm.createContext(host);vm.runInContext(checker.slice(start,end)+'\nresult=backendSnapshot();',host);
  assert.equal(host.result.gl.renderer,hardware.renderer);assert.equal(classifyBackend(host.result.gl,gpu).hardware,true);
  assert.equal(host.result.actualContext.element,'cacheRoadGpuCanvas');
});
check(()=>{
  const early=checker.indexOf("operation('backend: actual game context after settled normal presentation preparation')"),
    classified=checker.indexOf('if(!classification.hardware&&!diagnosticOnly)',early),
    hud=checker.indexOf("operation('gameplay: natural ready HUD handoff')",early);
  assert(early>=0&&classified>early&&hud>classified,'Nonhardware classification must precede the natural HUD wait');
  const guards=checker.slice(early,classified);
  assert(guards.includes('assert.equal(exceptions.length,0'));
  assert(guards.includes("resourceFailures.filter(n=>n!=='/favicon.ico')"));
  assert(guards.includes('assert.deepEqual(hashes(),inputHashes'));
  assert(guards.includes('inspectExternalResources(backendState.externalResources)'));
  assert(guards.includes('inspectTextureBank(backendState.gpu)'));
  assert(guards.includes('inspectBootstrap(backendState)'));
  const branch=checker.slice(classified,hud);
  assert(branch.includes("'performance-gate.json'"));assert(branch.includes("'functional-gate.json'"));
  assert(!branch.includes('screenshot('),'Software backend branch must not force stalled ReadPixels capture');
});
console.log(JSON.stringify({passed:true,groups,actualContextClassification:true,
  hardwareGatePreserved:true,unexercisedHasNoNumericOrFunctionalAcceptance:true,
  bootstrapFailuresRemainFailures:true,limitation:'Checker decision contracts only; no browser or hardware performance was run.'}));
