// Native UI-only checks over the real production adrenaline and combat poses.
// These fixtures review instrument state and pixel ownership, not device FPS.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const crypto=require('node:crypto');
const {createCanvas,GlobalFonts}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');process.chdir(root);
const sources=['src/game/cache-road-adrenaline.js','src/game/cache-road-combat.js',
  'src/game/cache-road-instruments.js','src/game/cache-road-guidance.js'];
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const hashes=Object.fromEntries(sources.map(file=>[file,hash(fs.readFileSync(file))]));
GlobalFonts.registerFromPath(path.join(root,'assets/studies/visual-overhaul/references/fonts/Oxanium.ttf'),'Oxanium');
const w={BARCODE:{GamepadUI:{connected:false},ControllerSettings:{
  prompt:(action,fallback)=>fallback,button:index=>['A','B','X','Y','LB','RB'][index]}}};
const context=vm.createContext({window:w,console});
for(const file of sources)vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
const B=w.BARCODE,A=B.CacheRoadAdrenaline,I=B.CacheRoadInstruments,C=B.CacheRoadCombat;
const copy=value=>JSON.parse(JSON.stringify(value));
const canvas=createCanvas(1920,1080),ctx=canvas.getContext('2d');
const pixels=()=>Buffer.from(ctx.getImageData(0,0,1920,1080).data);
const cleared=()=>{ctx.reset();ctx.clearRect(0,0,1920,1080);};
const text=[];const fill=ctx.fillText.bind(ctx);ctx.fillText=(value,...args)=>{text.push(String(value));fill(value,...args);};
function renderMeter(adrenaline,elapsedMs=5000,reduced=true) {
  cleared();text.length=0;const s={adrenaline,elapsedMs},before=JSON.stringify(s);
  const bounds=I.drawAdrenaline(ctx,s,{reduced});assert(bounds);
  assert.equal(JSON.stringify(s),before,'instrument paint cannot spend/reward or advance state');
  return {data:pixels(),text:[...text],bounds};
}
const cases=[];
for(const value of [0,25,34,35,69,70,100]) {
  const state=A.create({value}),render=renderMeter(state);
  assert(render.text.includes(String(value)),'native meter keeps its exact value visible');
  assert(render.text.includes(value>=70?'RUSH':value>=35?'CHARGED':'COLD'),'native tier agrees with real thresholds');
  cases.push({name:`${value} / ${A.pose(state).tier}`,state});
}
assert.notEqual(hash(renderMeter(A.create({value:34})).data),hash(renderMeter(A.create({value:35})).data));
assert.notEqual(hash(renderMeter(A.create({value:69})).data),hash(renderMeter(A.create({value:70})).data));
const charge=A.create();A.resolve(charge,{id:'native-good',result:'good',atMs:4000});
assert(renderMeter(charge,4500).text.includes('+15'),'accepted production gain owns the receipt');
assert(!renderMeter(charge,5200).text.includes('+15'),'gain receipt expires at1200 simulation milliseconds');
cases.push({name:'GOOD / +15',state:copy(charge),elapsedMs:4500});
A.spend(charge,'turbo',{atMs:5000});
assert(renderMeter(charge,5400).text.includes('-10'),'a successful spend remains distinct from a miss');
cases.push({name:'TURBO / −10',state:copy(charge),elapsedMs:5400});
const miss=A.create({value:85});A.resolve(miss,{id:'native-miss-1',result:'miss',atMs:4000});
assert.equal(miss.value,85);assert(!renderMeter(miss,4500).text.some(t=>/^[-+]\d+$/.test(t)),
  'first-miss grace never paints a false loss');
cases.push({name:'FIRST MISS / grace',state:copy(miss),elapsedMs:4500});
A.resolve(miss,{id:'native-miss-2',result:'miss',atMs:5000});
assert(renderMeter(miss,5500).text.includes('-12'),'second missed production opportunity visibly loses charge');
cases.push({name:'SECOND MISS / −12',state:copy(miss),elapsedMs:5500});
const quietCharge=A.create({value:70});A.resolve(quietCharge,{id:'quiet-good',result:'good',atMs:5000});
const q1=renderMeter(quietCharge,5100,true).data,q2=renderMeter(quietCharge,5600,true).data;
assert.deepEqual(q1,q2,'Reduced Motion keeps a recent state completely steady');
w.BARCODE_RENDER_QUALITY={flashes:false};
const f1=renderMeter(quietCharge,5100,false).data,f2=renderMeter(quietCharge,5600,false).data;
assert.deepEqual(f1,f2,'Flashes Off also keeps meter paint steady');
w.BARCODE_RENDER_QUALITY={flashes:true};
const repeat=renderMeter(quietCharge,5100,false).data;
assert.deepEqual(repeat,renderMeter(quietCharge,5100,false).data,'identical paused simulation time gives identical pixels');
assert.notEqual(hash(repeat),hash(renderMeter(quietCharge,5600,false).data),'normal positive-hit tick advances only with simulation time');
// Instrument panels remain peripheral. No pixel may reach the road center.
for(let y=0;y<1080;y++)for(let x=500;x<1330;x++)assert.equal(repeat[(y*1920+x)*4+3],0);
const glyphHashes=[];
for(const name of ['attack','turbo','defend','disrupt']) {
  cleared();I.glyph(ctx,name,40,40,36,'#ffffff');
  const crop=ctx.getImageData(0,0,80,80).data;
  assert([...crop].some((value,index)=>index%4===3&&value>0),`${name} glyph really draws pixels`);
  glyphHashes.push(hash(crop));
}
assert.equal(new Set(glyphHashes).size,4,'skill pictograms remain distinct without their colors or labels');
const combat=C.create(),state={elapsedMs:5000,boostMs:0,queuedTurbo:false,combat};
let pose=C.pose(combat,{syncCount:2,adrenaline:70});
const pristine=JSON.stringify({state,pose});
cleared();text.length=0;assert(I.drawSkills(ctx,state,pose));const ready=pixels();
assert.equal(JSON.stringify({state,pose}),pristine,'skill paint cannot reload, fire, or advance combat');
assert.equal(text.filter(t=>t==='READY').length,4,'all four available skills have a readable ready state');
const profiles=[{name:'READY / four separate glyphs',combat:copy(combat),state:copy(state)}];
combat.cooldowns.attack=450;combat.cooldowns.turbo=4000;combat.cooldowns.defend=2500;combat.cooldowns.disrupt=6000;
combat.ammo=1;pose=C.pose(combat,{syncCount:2,adrenaline:70});
cleared();text.length=0;I.drawSkills(ctx,state,pose);assert.notEqual(hash(pixels()),hash(ready),'cooldowns and ammunition visibly differ');
profiles.push({name:'RECHARGING / live progress',combat:copy(combat),state:copy(state)});
combat.defendMs=600;combat.disruptMs=800;state.queuedTurbo=true;pose=C.pose(combat,{syncCount:2,adrenaline:70});
cleared();text.length=0;I.drawSkills(ctx,state,pose);
assert(text.includes('NEXT 1'));assert.equal(text.filter(t=>t==='ACTIVE').length,2);
profiles.push({name:'QUEUED / ACTIVE states',combat:copy(combat),state:copy(state)});
ctx.reset();ctx.translate(11,17);ctx.globalAlpha=.47;ctx.lineWidth=7;ctx.fillStyle='#123456';
const before={matrix:copy(ctx.getTransform()),alpha:ctx.globalAlpha,lineWidth:ctx.lineWidth};
I.drawAdrenaline(ctx,{adrenaline:charge,elapsedMs:5100});I.drawSkills(ctx,state,pose);
assert.deepEqual({matrix:copy(ctx.getTransform()),alpha:ctx.globalAlpha,lineWidth:ctx.lineWidth},before,
  'both helpers restore the caller Canvas state');
// NAPI's fillStyle getter retains its last assigned string after restore,
// although the saved native paint is restored. Assert actual resulting ink.
ctx.globalAlpha=1;ctx.fillRect(0,0,2,2);
assert.deepEqual(Array.from(ctx.getImageData(12,18,1,1).data),[18,52,86,255],
  'the caller fill color is restored in the actual native paint');
cleared();text.length=0;
const road={status:'playing',chapter:{encounterVersion:4,records:[]},state:{combat,
  musicBeatFloat:8,lanePos:1,elapsedMs:5100,progress:130,adrenaline:quietCharge,opening:{held:true}},
  recordOpportunity:()=>null};
B.CacheRoadGuidance.drawHelp(ctx,road);
for(const phrase of ['ADRENALINE / 35 CHARGED / 70 RUSH',
  'Accurate pads feed it; 2+ misses drain it. Power / recharge / guard scale.',
  'Turbo −10 / Disrupt −14 · both usable at zero charge.'])assert(text.includes(phrase));
const help=createCanvas(600,410),hc=help.getContext('2d');hc.fillStyle='#0d2032';hc.fillRect(0,0,600,410);
hc.drawImage(canvas,420,406,600,410,0,0,600,410);
const output=process.argv[2]?path.resolve(process.argv[2]):null;
if(output) {
  assert(!output.startsWith(root+path.sep),'Native previews belong outside the Git source tree');fs.mkdirSync(output,{recursive:true});
  const sheet=createCanvas(1060,970),sc=sheet.getContext('2d');sc.fillStyle='#061621';sc.fillRect(0,0,sheet.width,sheet.height);
  sc.fillStyle='#e4f4e8';sc.font='bold 20px Oxanium';sc.fillText('CACHE / LIVE INSTRUMENT STATES',24,29);
  for(let i=0;i<cases.length;i++) {
    const item=cases[i],x=25+(i%2)*510,y=64+Math.floor(i/2)*111;
    sc.fillStyle='#adc8c1';sc.font='13px Oxanium';sc.fillText(item.name,x,y-10);
    I.drawAdrenaline(sc,{adrenaline:item.state,elapsedMs:item.elapsedMs||5000},{x,y,reduced:true});
  }
  for(let i=0;i<profiles.length;i++) {
    const item=profiles[i],y=755+i*70;
    sc.fillStyle='#adc8c1';sc.font='13px Oxanium';sc.fillText(item.name,557,y+24);
    sc.save();sc.translate(25-1366,y-102);I.drawSkills(sc,item.state,C.pose(item.combat,{syncCount:2,adrenaline:70}));sc.restore();
  }
  fs.writeFileSync(path.join(output,'Cache-Instrument-States.webp'),sheet.toBuffer('image/webp',94));
  fs.writeFileSync(path.join(output,'Cache-Pause-Adrenaline.webp'),help.toBuffer('image/webp',94));
  fs.writeFileSync(path.join(output,'instrument-native-evidence.json'),JSON.stringify({kind:'native-production-instrument-fixtures',
    sourceHashes:hashes,meterCases:cases.length,skillProfiles:profiles.length,glyphHashes,
    limits:'Real production adrenaline/skill poses and drawing over staged UI fixtures. No device frame pacing, human balance, audio or browser acceptance is claimed.'},null,2)+'\n');
}
for(const [file,digest] of Object.entries(hashes))assert.equal(hash(fs.readFileSync(file)),digest,`source changed during native review: ${file}`);
console.log(JSON.stringify({meterCases:cases.length,skillProfiles:profiles.length,distinctGlyphs:4,
  thresholds:[35,70],paintPure:true,quietSteady:true,roadCenterClear:true,output}));
