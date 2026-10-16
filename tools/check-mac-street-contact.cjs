#!/usr/bin/env node
'use strict';
// Earn positions and commitments in the shipping simulation; no patched health,
// positions, enemy phases, timers, or alternative combat implementation.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const bytes=fs.readFileSync(path.join(__dirname,'../src/game/mac-street-combat.js'));
const forbidden=()=>{throw Error('Contact pass introduced a global owner');};
const context={window:{BARCODE:{}},requestAnimationFrame:forbidden,setTimeout:forbidden,setInterval:forbidden,
  document:{createElement:forbidden,addEventListener:forbidden},Audio:forbidden,AudioContext:forbidden};
vm.runInNewContext(bytes.toString('utf8'),context);
const C=context.window.BARCODE.MacStreetCombat,dt=1000/120,baseline=process.argv.includes('--baseline');
const receipt={sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex'),baseline,checks:[],probes:{}};
function rig(){const game=C.create(),events=[];return {game,events,view:()=>game.getSnapshot(),step(input={}){
  const s=game.update(dt,input);events.push(...game.drainEvents());return s;},until(test,input={},ms=15000){
  for(let n=0;n<ms/dt;n++){const s=game.getSnapshot();if(test(s))return s;this.step(typeof input==='function'?input(s):input);}
  assert.fail('Earned contact setup timed out '+JSON.stringify(game.getSnapshot().enemies.map(e=>({kind:e.kind,phase:e.phase,x:e.x,laneY:e.laneY}))));}};}
function check(name,run){run();receipt.checks.push(name);console.log('PASS '+name);}
check('a spear commitment cannot damage Mac after he crosses behind its locked facing',()=>{
  const r=rig();r.until(s=>s.enemies.some(e=>e.kind==='psion_lancer'&&e.phase==='windup'),s=>{
    const foe=s.enemies.find(e=>e.hp>0&&e.phase!=='dormant'&&e.kind==='chitin_scuttler');
    if(s.zone.state==='entry')return {move_x:1,run:{held:true}};
    if(foe?.phase==='windup'||foe?.phase==='active')return {move_x:s.player.facing!==Math.sign(foe.x-s.player.x)?Math.sign(foe.x-s.player.x):0,guard:{held:true}};
    return {};
  });
  const tell=r.view().enemies.find(e=>e.kind==='psion_lancer'),behind=tell.attackOriginX-tell.attackFacing*40;
  assert.equal(tell.attackTell.type,'lunge');const locked={x:tell.attackOriginX,lane: tell.attackLaneY,facing:tell.attackFacing};
  r.until(s=>Math.abs(s.player.x-behind)<3&&Math.abs(s.player.laneY-locked.lane)<3,s=>({
    move_x:Math.abs(s.player.x-behind)>2?Math.sign(behind-s.player.x)*Math.min(1,Math.abs(behind-s.player.x)/4):0,
    move_y:Math.abs(s.player.laneY-locked.lane)>2?Math.sign(locked.lane-s.player.laneY):0,run:{held:true},
    ...(s.player.grounded&&!r.events.some(e=>e.type==='jump')?{jump:{pressed:true,held:true}}:{})
  }),3000);
  const before=r.view(),start=r.events.length;
  r.until(s=>s.enemies.find(e=>e.kind==='psion_lancer').phase==='recovery',{},3000);
  const hits=r.events.slice(start).filter(e=>e.type==='player-hit'&&e.kind==='psion_lancer');
  receipt.probes.behindSpear={locked,player:{x:before.player.x,laneY:before.player.laneY,elevation:before.player.elevation,hp:before.player.hp},
    hitCount:hits.length,hits,finalHp:r.view().player.hp};
  if(!baseline)assert.equal(hits.length,0,'locked spear only contacts its forward path, not the symmetric rear sweep');
});
const out=process.argv.indexOf('--out');if(out>=0)fs.writeFileSync(path.resolve(process.argv[out+1]),JSON.stringify(receipt,null,2)+'\n');
console.log('Mac contact: '+receipt.checks.length+' actual public-input groups passed'+(baseline?' (baseline observation)':'')+'.');
