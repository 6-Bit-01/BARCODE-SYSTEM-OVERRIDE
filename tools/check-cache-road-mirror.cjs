// Exercise meaningful face transitions using only the shared update clock.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const window = {BARCODE:{},FILE_MANIFEST:[]};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,
  '../src/game/cache-road-mirror.js'),'utf8'),{window});
const M = window.BARCODE.CacheRoadMirror;
const input = patch => ({status:'playing',integrity:3,timeMs:55000,
  boostMs:0,fullAdrenaline:false,pulseFlashMs:0,passFlashMs:0,cutFlashMs:0,...patch});
const advance = (s,ms,patch={}) => {
  for (let left=ms;left>0;left-=20) M.step(s,Math.min(left,20),input(patch));
};
const snapshot = s => JSON.stringify(s);

// Ordinary events at a rapidly changing boundary cannot cycle the atlas.
{
  const s=M.create(),frames=new Set();
  for(let i=0;i<1000;i++) {
    M.step(s,20,input({boostMs:i%2?200:0,threat:i%2===0}));
    frames.add(M.expression(s));
  }
  assert.deepEqual([...frames],[0]);
  advance(s,440,{threat:true});assert.equal(M.expression(s),0);
  advance(s,20,{threat:true});assert.equal(M.expression(s),1);
  advance(s,1000);assert.equal(M.expression(s),1,'dwell outlasts a disappearing warning');
  advance(s,2000);assert.equal(M.expression(s),0);
}

// Consecutive successful captures hold one focused expression, even though
// each existing HUD flash fades between caught beats.
{
  const s=M.create();let changes=0,last=M.expression(s);
  for(let elapsed=0;elapsed<20000;elapsed+=20) {
    const pulseFlashMs=Math.max(0,650-elapsed%1000);
    M.step(s,20,input({pulseFlashMs}));
    const face=M.expression(s);if(face!==last)changes++;last=face;
  }
  assert.equal(M.expression(s),1);assert.equal(changes,1);
  advance(s,4000);assert.equal(M.expression(s),0);
}

// Low signal uses a separate recovery threshold. An 8-second boundary wobble
// cannot flip alarm/calm; recovered verse time can deliberately clear alarm.
{
  const s=M.create();advance(s,500,{timeMs:7900});assert.equal(M.expression(s),5);
  for(let i=0;i<300;i++)M.step(s,20,input({timeMs:i%2?8050:7950}));
  assert.equal(M.expression(s),5);
  advance(s,3500,{timeMs:11000});assert.equal(M.expression(s),0);
  advance(s,500,{integrity:1});assert.equal(M.expression(s),5);
  advance(s,4000,{integrity:1,boostMs:1000,fullAdrenaline:true});
  assert.equal(M.expression(s),5,'urgency outranks confidence');
}

// Actual hits preempt every nonurgent dwell, show impact for a bounded time,
// and recover through focused before ordinary driving resumes.
{
  const s=M.create();advance(s,500,{boostMs:1000});assert.equal(M.expression(s),2);
  M.onHit(s);assert.equal(M.expression(s),4);
  advance(s,680);assert.equal(M.expression(s),4);
  advance(s,20);assert.equal(M.expression(s),1);
  advance(s,1200);assert.equal(M.expression(s),1);
  advance(s,1800);assert.equal(M.expression(s),0);
  M.step(s,20,input({stumbleMs:650}));assert.equal(M.expression(s),4);
  advance(s,700);assert.equal(M.expression(s),1,'a decaying stumble is one hit event');
  assert.equal(M.expression(s,{status:'failed'}),5);
  assert.equal(M.expression(s,{status:'clear'}),2);
}

// A pass earns a short reaction; a stream of passes cannot constantly restart
// it. Snapshot comparisons also guard the render and pause read contracts.
{
  const s=M.create();advance(s,500,{passKind:'NEAR MISS',passFlashMs:780});
  assert.equal(M.expression(s),3);
  const before=snapshot(s);
  for(let i=0;i<100;i++) {
    M.expression(s);M.expression(s,{status:'clear'});
    M.step(s,0,input({boostMs:1000,pulseFlashMs:650}));
  }
  assert.equal(snapshot(s),before,'pause and draw cannot consume or advance events');
  advance(s,2000);assert.equal(M.expression(s),3,'displayed reaction gets a full dwell');
  advance(s,1000);assert.equal(M.expression(s),0);
  M.step(s,20,input({passKind:'NEAR MISS',passFlashMs:780}));
  advance(s,500);assert.equal(M.expression(s),0,'reaction has a repeat cooldown');
  advance(s,2400);M.step(s,20,input({passKind:'CLOSE CUT',passFlashMs:780}));
  advance(s,500);assert.equal(M.expression(s),3,'a later earned pass may react again');
}

// A full song-length stream of earned captures, chase warnings and passes
// remains a small set of sustained moods rather than a face for every flash.
{
  const s=M.create();let changes=0,last=M.expression(s);const seen=new Set([last]);
  for(let elapsed=0;elapsed<187500;elapsed+=20) {
    if(elapsed===75000)M.onHit(s,{stumbleMs:650});
    M.step(s,20,input({integrity:elapsed>=170000?1:3,
      boostMs:elapsed%14000<2500?2500-elapsed%14000:0,
      fullAdrenaline:elapsed>=45000&&elapsed<150000,
      threat:elapsed%5500<1100,pulseFlashMs:Math.max(0,650-elapsed%938),
      passKind:'NEAR MISS',passFlashMs:Math.max(0,780-elapsed%6000),
      stumbleMs:elapsed>=75000&&elapsed<75650?75650-elapsed:0}));
    const face=M.expression(s);seen.add(face);if(last!==face)changes++;last=face;
    assert(s.ageMs<=M.timing.dwellMs&&s.candidateMs<=M.timing.settleMs);
  }
  assert(changes<65,`busy song-length event stream changed face ${changes} times`);
  for(const face of [1,2,3,4,5])assert(seen.has(face),`meaningful atlas cell ${face} remains reachable`);
}
console.log('PASS Cache mirror sustained moods, event dwell, hit priority, hysteresis and pause purity');
