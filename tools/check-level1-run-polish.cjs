#!/usr/bin/env node
// Exact new run cels and real Player/SpritePlayback owners: anatomy, cadence,
// seamless wrap, stable pelvis, and repeated draws that never advance time.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createRig}=require('./check-level-01-boss'),{createSprite,playerClips}=require('./makko-animation-fixture');
const root=path.resolve(__dirname,'..'),folder='assets/level1-run-v2';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const {createCanvas,loadImage}=require(require.resolve('@napi-rs/canvas',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||root,root]}));
const near=(a,b,why)=>assert(Math.abs(a-b)<1e-5,`${why}: ${a} / ${b}`);
function playback(meta) {
  const frames=Object.values(meta.frames);
  for(const fps of [30,60,120,144,'irregular']) {
    const {w,calls}=createRig(),p=w.player;w.rhythmSystem.hideRhythmMode();p.position.x=100;p.position.y=784;p.grounded=true;p.allowMovement=true;p.setRunHeld(true);
    const s=createSprite(playerClips),play=s.play;let plays=0;
    s.play=function(name,...args){plays++;const ref=play.call(s,name,...args);if(name==='6_bit_run_run'){s.currentSprite.metadata.frames=Object.fromEntries(frames.map((f,i)=>[String(i),f]));s.currentSprite.getAnchorPoint=()=>meta.meta.anchor;s.currentSprite.hasManifestAnchor=()=>true;s.currentSprite.getManifestScale=()=>1;}return ref;};
    p.sprite=s;p.spriteReady=true;p.moveRight();
    const irregular=[17,53,8,91,32,14,66,27],visited=new Set();let elapsed=0,i=0;
    while(elapsed<1800-1e-7) {
      const delta=Math.min(fps==='irregular'?irregular[i++%irregular.length]:1000/fps,1800-elapsed);
      p.moveRight();p.update(delta,true);elapsed+=delta;visited.add(p.animationRef.currentFrame);
      let phase=(elapsed+1e-6)%600,expected=0;
      while(expected<frames.length-1&&phase>=frames[expected].duration){phase-=frames[expected].duration;expected++;}
      assert.equal(p.animationRef.currentFrame,expected,`${fps}: exact excess time and phase survive every render`);
      assert.equal(p.state,'run');assert.equal(p.position.y,784);assert.equal(p.grounded,true);
    }
    near(p.position.x,910,`${fps}: three gaits retain exact 450/s travel`);
    assert.equal(plays,1,`${fps}: continuous run never stops/restarts at a frame boundary or wrap`);
    assert.equal(visited.size,frames.length);assert.equal(p.animationRef.currentFrame,0);near(s.currentSprite.timeAccumulator,0,`${fps}: cycle duration is exactly 600ms`);
    const held={x:p.position.x,frame:p.animationRef.currentFrame,accumulator:s.currentSprite.timeAccumulator,time:p.animationTime};
    w.isPaused=true;p.update(200,true);assert.deepEqual({x:p.position.x,frame:p.animationRef.currentFrame,accumulator:s.currentSprite.timeAccumulator,time:p.animationTime},held);
    w.isPaused=false;p.state='walk';p.setRunHeld(false);p.velocity.x=300;p.playAnimation('walk',8);
    p.state='run';p.setRunHeld(true);p.velocity.x=450;p.updateSpriteAnimation(0);
    assert.equal(p.animationRef.currentFrame,5,'walk-to-run keeps the opposite half-stride at exactly300ms');
    p.playAnimation('run',4);p.state='walk';p.setRunHeld(false);p.velocity.x=300;p.updateSpriteAnimation(0);
    assert.equal(p.animationRef.currentFrame,6,'run-to-walk uses cumulative cel duration, not index fraction');
    near(s.currentSprite.timeAccumulator,25,'run-to-walk also preserves the partial target cel');
    assert.deepEqual(calls.errors,[]);
  }
}
async function main() {
  const c=read(folder+'/calibration.json'),meta=read(folder+'/6_bit_run_run.json'),frames=Object.values(meta.frames);
  assert.equal(c.version,2);assert.equal(c.frames,11);assert.equal(c.gaitDurationMs,600);assert.equal(c.groundSpeed,450);
  const image=await loadImage(path.join(root,folder,'6_bit_run_run.webp')),canvas=createCanvas(c.width,c.height),ctx=canvas.getContext('2d');
  const bytes=fs.readFileSync(path.join(root,folder,'6_bit_run_run.webp'));assert.equal(sha(bytes),c.sha256);
  assert.equal(sha(fs.readFileSync(path.join(root,folder,'source-registration.json'))),c.sourceRegistrationSha256,'portable measured registration is the exact checked asset');
  for(const source of c.sources)assert.equal(sha(fs.readFileSync(path.join(root,folder,source.file))),source.sha256);
  assert.equal(c.registration.length,11);assert.equal(c.uniquePoses,11);const distinct=new Set();
  const worldHip=[],worldCap=[];
  assert.deepEqual(c.contactStartsMs,[0,300],'opposite contacts are exactly equally spaced');
  assert(Math.max(...c.frameScales)/Math.min(...c.frameScales)<=1.08,'body-size calibration is bounded to the measured small source variance');
  for(let i=0;i<c.frames;i++) {
    const f=frames[i].frame,r=c.registration[i];ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(image,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
    const rgba=ctx.getImageData(0,0,c.width,c.height).data;distinct.add(sha(rgba));
    const solid=(x,y)=>x>=0&&y>=0&&x<c.width&&y<c.height&&rgba[(Math.round(y)*c.width+Math.round(x))*4+3]>=128;
    for(const key of ['pelvis','nearSole','farSole','nearFist','farFist','capCrown'])if(r[key])assert(solid(...r[key]),`${i}: reviewed ${key} remains on actual decoded native artwork`);
    near(r.pelvis[0],c.anchorX,`${i}: stable pelvis X`);
    assert(Math.abs((r.pelvis[1]-(c.anchorY-c.pelvisToGroundSource))*c.renderScale-r.bobWorldY)<=c.renderScale+1e-6,`${i}: only small repeatable pelvis bob, within native integer registration`);
    const scale=c.frameScales[i],ground=c.footRows[i];
    worldHip.push([c.headOffsetsXWorld[i]+(r.pelvis[0]-c.headColumns[i])*scale,(r.pelvis[1]-ground)*scale]);
    worldCap.push([c.headOffsetsXWorld[i],(r.capCrown[1]-ground)*scale]);
    near((r.visibleFootRow-r.headRow)*scale,c.targetMedianBodyHeight,'whole-body pixel height is constant at canonical size');
    assert.equal(frames[i].duration,c.frameDurationsMs[i]);
    let bottom=-1;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(solid(x,y))bottom=y;
    assert.equal(bottom,r.visibleFootRow,'real cel body contact calibration');
    near((bottom-ground)*scale,-r.flightLiftWorld,`${i}: true boots contact the floor or use the authored flight lift`);
    assert((bottom-ground)*scale<=1e-6,`${i}: no visible boot sinks through ground`);
  }
  for(let i=0;i<c.frames;i++) {
    const next=(i+1)%c.frames;
    assert(Math.abs(worldCap[next][0]-worldCap[i][0])<=6,`${i}: no lateral cap jerk, including wrap`);
    assert(Math.abs(worldCap[next][1]-worldCap[i][1])<=6,`${i}: no vertical cap jerk, including wrap`);
    assert(Math.abs(worldHip[next][1]-worldHip[i][1])<=8,`${i}: bounded natural vertical pelvis motion`);
    assert(Math.abs(worldHip[next][0]-worldHip[i][0])<=8,`${i}: bounded natural horizontal pelvis motion, including wrap`);
  }
  assert.equal(distinct.size,11);
  // Verify those same measurements through actual Player.drawSprite calls.
  // This catches a stale production registration even if JSON itself is sound.
  const production=createRig(),p=production.w.player;production.w.rhythmSystem.hideRhythmMode();
  p.sprite=createSprite(playerClips);p.spriteReady=true;p.state='run';p.position.x=500;p.position.y=784;p.grounded=true;p.velocity.x=450;p.setRunHeld(true);
  let drawn;p.sprite.draw=(context,x,y,options)=>{drawn={x,y,...options};};
  for(const facing of [-1,1])for(let i=0;i<c.frames;i++) {
    p.facing=facing;p.playAnimation('run',i);
    const sheet=p.sprite.currentSprite;sheet.getAnchorPoint=()=>meta.meta.anchor;sheet.hasManifestAnchor=()=>true;sheet.getManifestScale=()=>1;
    const before={frame:p.animationRef.currentFrame,time:p.animationTime,x:p.position.x};p.drawSprite(ctx);
    assert.deepEqual({frame:p.animationRef.currentFrame,time:p.animationTime,x:p.position.x},before,'native production draw cannot tick the run');
    const sign=drawn.flipH?-1:1,r=c.registration[i];near(drawn.scale,c.frameScales[i],'production selects measured per-cel size');
    near(drawn.x+sign*(r.capCrown[0]-meta.meta.anchor.x)*drawn.scale,p.position.x+facing*c.headOffsetsXWorld[i],'actual drawn cap stays registered in either facing');
    near(drawn.y+(r.visibleFootRow-meta.meta.anchor.y)*drawn.scale,856-r.flightLiftWorld,'actual drawn boots use exact floor/flight rows');
    near(drawn.y+(r.capCrown[1]-meta.meta.anchor.y)*drawn.scale,856+worldCap[i][1],'actual drawn crown has no hidden extra offset');
  }
  for(const i of c.contactFrames) {
    const r=c.registration[i],foot=r.nearSole[0]-r.farSole[0],hand=r.nearFist[0]-r.farFist[0];
    assert(foot*hand<0,`${i}: arms oppose the contacting legs`);
  }
  assert((c.registration[0].nearSole[0]-c.registration[0].farSole[0])*(c.registration[5].nearSole[0]-c.registration[5].farSole[0])<0,'both genuine alternating leg contacts exist');
  assert((c.registration[0].nearFist[0]-c.registration[0].farFist[0])*(c.registration[5].nearFist[0]-c.registration[5].farFist[0])<0,'camera-visible arm really reverses across the half-stride');
  playback(meta);
  const adjacentMax = (points,axis) => Math.max(...points.map((point,i) => Math.abs(points[(i+1)%points.length][axis]-point[axis])));
  console.log(JSON.stringify({passed:true,poses:11,cycleMs:600,contactsMs:[0,300],clockRates:[30,60,120,144,'irregular'],alternatingContacts:true,capAdjacentJumpMaxWorld:{x:adjacentMax(worldCap,0),y:adjacentMax(worldCap,1)},pelvisAdjacentJumpMaxWorld:{x:adjacentMax(worldHip,0),y:adjacentMax(worldHip,1)},capWrapJumpWorld:{x:Math.abs(worldCap[0][0]-worldCap.at(-1)[0]),y:Math.abs(worldCap[0][1]-worldCap.at(-1)[1])},limitsWorld:{capAdjacent:6,pelvisAdjacent:8},wrapChecked:true,atlasSha256:c.sha256,limits:'Exact decoded cels, reviewed anatomy landmarks and production update at native Canvas/public Makko boundary; hosted/device feel remains owner acceptance.'},null,2));
}
module.exports={playback};
if(require.main===module)main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
