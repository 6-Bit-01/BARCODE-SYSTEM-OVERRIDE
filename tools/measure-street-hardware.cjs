// Native CPU raster benchmark, not browser/Makko FPS. Both revisions execute
// their production draw methods using the same decoded asset adapter.
const fs=require('fs'),vm=require('vm'),{execFileSync}=require('child_process');
const {createCanvas}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES]}));
const {createRig}=require('./check-level-01-boss');
const {installArt}=require('./render-cat-chaos.cjs');
const base='1c8b54ec';
async function run(legacy,cleared){
 const {w,p:current,context}=createRig();await installArt(w,context);
 let p=current;
 if(legacy){vm.runInContext(execFileSync('git',['show',base+':src/game/sector1-progression.js'],{encoding:'utf8'}),context);p=new w.Sector1Progression(w.player);}
 p.startMission();p.state=cleared?'jammer_active':'encounter_1';p.closedGateEncounterId=cleared?null:'encounter_1';
 p.districtSignal.elapsedMs=3000;p.districtSignal.clearedAtMs=cleared?[0,0,0,0]:[null,null,null,null];
 const canvas=createCanvas(1920,1080),c=canvas.getContext('2d');
 let images=0;const draw=c.drawImage.bind(c);c.drawImage=(...args)=>{images++;draw(...args);};
 const samples=[];
 for(let frame=0;frame<36;frame++){
  const t=performance.now();c.clearRect(0,0,1920,1080);p.drawEncounterGates(c);
  const ms=performance.now()-t;if(frame>=6)samples.push(ms);
 }
 samples.sort((a,b)=>a-b);
 return {medianMs:+samples[15].toFixed(3),p95Ms:+samples[28].toFixed(3),hardwareImageDrawsPerFrame:images/36};
}
(async()=>{const result={scope:'Native Canvas gate pass only at 1920x1080; fixed camera; 6 warmups + 30 samples; not hosted FPS',base};
 for(const cleared of [false,true])result[cleared?'allCleared':'firstGate']={before:await run(true,cleared),after:await run(false,cleared)};
 const out=process.argv[2];if(out)fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));})();
