#!/usr/bin/env node
// Isolated collision/recharge probes. These deliberately arranged addresses
// are regression fixtures, not played races or owner acceptance evidence.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const w={BARCODE:{}};vm.runInNewContext(fs.readFileSync('src/game/cache-road-combat.js','utf8'),{window:w});
const C=w.BARCODE.CacheRoadCombat;
function pair(){const s=C.create();const input={bar:10,progress:1000,lanePos:1,speed:52,syncCount:4};
 for(const [id,at] of [['foe-0',1100],['foe-1',1180]]) {
  s.enemies.push({id,kind:'bike',hp:2,maxHp:2,at,lane:1,ageMs:0,phase:'recover',phaseMs:0,rearmMs:0,attackLane:1,attackKind:'kick',attackDone:true});
  s.ledger.push({id,kind:'bike',hp:2,maxHp:2,damage:0,spawnBar:4,retired:false});
 }
 s.lastProgress=1000;s.nextSpawnMs=1e8;return {s,input};}
const {s,input}=pair();s.enemies.reverse();
const shot=C.act(s,'attack',input);assert(shot.accepted);assert.equal(s.projectiles[0].targetId,'foe-0');
assert.equal(C.pose(s,input).target.id,'foe-0');
s.cooldowns.attack=0;assert.equal(C.act(s,'attack',input).reason,'in-flight');
const events=[];for(let i=0;i<30;i++){input.progress+=2.6;events.push(...C.step(s,50,input));}
assert.equal(s.ledger.find(e=>e.id==='foe-0').hp,0);
assert.equal(s.ledger.find(e=>e.id==='foe-1').hp,2,'shot destruction never splashes its neighbour');
assert.deepEqual([...new Set(events.filter(e=>e.type==='enemy-hit').map(e=>e.id))],['foe-0']);
const ram=pair();ram.input.syncCount=0;ram.input.boosting=true;ram.input.speed=110;
const ramEvents=[];for(let i=0;i<80;i++){ram.input.progress+=11;ramEvents.push(...C.step(ram.s,100,ram.input));}
assert(ramEvents.some(e=>e.type==='ram-impact'&&e.id==='foe-0'),'catching a recovering chassis causes physical ram contact');
assert(ramEvents.find(e=>e.type==='ram-impact').at-ram.input.progress<0);
for(const id of ['foe-0','foe-1'])assert(ramEvents.filter(e=>e.type==='ram-impact'&&e.id===id).length<=1);
for(const count of [0,4]){const f=pair();f.input.syncCount=count;f.s.ammo=0;f.s.enemies=[];f.s.ledger=[];
 for(let i=0;i<15;i++)C.step(f.s,100,f.input);
 assert.equal(f.s.ammo,count===4?1:0,'full-sync reload gives a practical 3x improvement');}
const reward=C.create();reward.cooldowns.defend=1000;C.rewardSync(reward,true);assert.equal(reward.cooldowns.defend,500);
assert.equal(C.syncBenefits(4).power,2);assert.equal(C.syncBenefits(4).recharge,.6);
(async()=>{const m=JSON.parse(fs.readFileSync('assets/cache-road/combat/fx-metadata.json')).assets[0];
 const png=await loadImage(m.generatedOriginal),webp=await loadImage(m.runtime);
 assert.deepEqual([webp.width,webp.height],m.size);
 const canvas=createCanvas(webp.width,webp.height),ctx=canvas.getContext('2d');ctx.drawImage(png,0,0);
 const original=ctx.getImageData(0,0,webp.width,webp.height).data;ctx.clearRect(0,0,webp.width,webp.height);ctx.drawImage(webp,0,0);
 const decoded=ctx.getImageData(0,0,webp.width,webp.height).data;
 for(let i=3;i<decoded.length;i+=4)assert.equal(decoded[i],original[i],'native source/runtime alpha');
 for(let i=0;i<12;i++){const pixels=ctx.getImageData(i%4*362,Math.floor(i/4)*362,362,362).data;
  assert(pixels.some((v,j)=>j%4===3&&v>0),`FX cell ${i} has native alpha paint`);}
 console.log('PASS: single locked bullet, no projectile splash, physical Turbo ram, one contact per boost, 3x sync reload, recharge reward, 12 native FX cells with source alpha preserved');
})().catch(e=>{console.error(e);process.exitCode=1;});
