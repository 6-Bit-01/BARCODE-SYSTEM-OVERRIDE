// Real road hit/update/draw with native Canvas at the rendering boundary.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {createCanvas}=require('@napi-rs/canvas');
const {createRig,load}=require('./check-level-01-boss');
const plain=value=>JSON.parse(JSON.stringify(value));
function rig(authored=true,difficulty='standard') {
  const r=createRig(),{w,context}=r,B=w.BARCODE;
  B.Campaign={register(){},syncTitleButton(){}};
  for(const file of ['src/engine/cache-road-proof-profile.js','src/game/cache-road-landscape.js',
    'src/game/cache-road-encounters.js','src/game/cache-road-reactions.js','src/game/cache-road-pursuit.js'])load(context,file);
  let source=fs.readFileSync('src/game/cache-road-proof.js','utf8');
  source=source.replace('  const road = B.CacheRoadProof = {',
    '  window.reactionInspect={newState,actorPose,drawRearRoad};\n  const road = B.CacheRoadProof = {');
  source=source.replace("    const artKey = kind === 'cache'",
    "    window.vehicleCalls.push({x,y,w,h,kind,alpha,steer});\n    const artKey = kind === 'cache'");
  w.vehicleCalls=[];vm.runInContext(source,context);
  const road=B.CacheRoadProof;road.active=true;road.status='playing';road.state=w.reactionInspect.newState();
  road.chapter=authored?{encounterVersion:1,difficultyId:difficulty,damageTaken:0,elapsedMs:0,records:[]}:null;
  road.configureEncounters();
  road.selectMusicProfile();B.MusicTransport.start({sourceAnchorAudioSec:0,sourceOffsetTrackSec:0});
  w.audioSystem.context.currentTime=0;
  return {...r,B,road};
}
function actor(r,at=100,lane=1,kind='freight') {
  const h={id:'integration-contact',at,lane,kind,encounter:true};
  r.road.state.encounters.rows=[{bar:4,actors:[h]}];return h;
}
function tick(r,seconds,dt=20) {
  r.w.audioSystem.context.currentTime=seconds;r.road.update(dt);
}
function run() {
  // An actual crossing consumes Push once, mutates a shared physical pose,
  // preserves integrity/music, and cannot award a free near miss afterward.
  {
    const r=rig(),s=r.road.state,h=actor(r);s.progress=99;s.ramMs=1500;s.lanePos=s.lane=1;
    s.captures=[{lane:0,startBeat:0,endBeat:32},{lane:1,startBeat:0,endBeat:32}];
    tick(r,0);tick(r,.04,40);
    assert.equal(s.integrity,3);assert.equal(s.ramMs,0);assert.equal(s.score,100);
    assert.equal(s.captures.length,2);assert.equal(r.road.chapter.damageTaken,0);
    assert.equal(r.B.CacheRoadReactions.pose(s,h).kind,'push');
    assert.equal(r.B.CacheRoadReactions.pose(s,h).collidable,false);
    for(let i=1;i<=12;i++)tick(r,.04+i*.02);
    assert.equal(s.integrity,3);assert.equal(s.score,100);assert.equal(s.nearMisses,0);
  }
  // Difficulty changes the actual damage grace. One musical part is lost;
  // the next audio beat restores the idle bed without requiring another pad.
  for(const difficulty of ['relaxed','standard','overclocked']) {
    const r=rig(true,difficulty),s=r.road.state,h=actor(r);
    s.captures=[0,1,2,3].map(lane=>({lane,startBeat:0,endBeat:64+lane*4}));
    s.queuedCaptures=[{lane:1,startBeat:4,endBeat:36}];
    r.road.hit('freight',h);
    assert.equal(s.integrity,s.maxIntegrity-1);assert.equal(r.road.chapter.damageTaken,1);
    assert.deepEqual(s.captures.map(c=>c.lane),[0,2,3]);assert.equal(s.queuedCaptures.length,1);
    assert.equal(s.invulnerableMs,r.B.CacheRoadEncounters.difficulty(difficulty).recoveryMs);
    tick(r,.4);assert.equal(s.hitRecovery,true);
    tick(r,.5);assert.equal(s.hitRecovery,false);
    assert.equal(s.captures.length,3);assert.equal(s.queuedCaptures.length,1);
  }
  // A checkpoint without encounterVersion keeps the previous recovery rule.
  {
    const r=rig(false),s=r.road.state;
    s.captures=[{lane:0,startBeat:0,endBeat:32}];s.queuedCaptures=[{lane:1,startBeat:4,endBeat:36}];
    r.road.hit('van');assert.equal(s.captures.length,0);assert.equal(s.queuedCaptures.length,0);
    assert.equal(s.invulnerableMs,1400);assert.equal(s.actorReactions,undefined);
  }
  // The ability that actually resolved this impact owns the visible effect;
  // an unused held Brace must not cover a newly spent Push with its halo.
  {
    const r=rig(),s=r.road.state,h=actor(r),drawn=[];
    r.B.PresentationAssets={draw(key){drawn.push(key);return false;}};
    s.ramMs=1500;s.shield=1;r.road.hit('freight',h);
    assert.equal(s.shield,1,'Push leaves a held Brace available for later');
    r.road.draw(createCanvas(1920,1080).getContext('2d'));
    assert(drawn.includes('cachePushArc'),'Push impact displays its own arc');
    assert(!drawn.includes('cacheBraceHalo'),'held Brace does not override Push impact');
  }
  // Forward and rear cameras call the same production pose owner. The
  // vehicle draw receives the same fading reaction, not a cached old lane.
  {
    const r=rig(),s=r.road.state,h=actor(r,100,0,'freight');
    s.progress=100;s.lanePos=s.lane=0;s.ramMs=1500;r.road.hit('freight',h);s.elapsedMs+=325;
    const expected=r.B.CacheRoadReactions.pose(s,h),ctx=createCanvas(1920,1080).getContext('2d');
    const poses=[],original=r.B.CacheRoadReactions;
    r.B.CacheRoadReactions={...original,pose(...args){const p=original.pose(...args);poses.push(plain(p));return p;}};
    r.road.draw(ctx);
    assert(poses.some(p=>p.id===expected.id&&p.at===expected.at&&p.lane===expected.lane));
    const front=r.w.vehicleCalls.find(call=>call.kind==='freight');
    assert(front);assert.equal(front.alpha,expected.alpha);
    r.w.vehicleCalls.length=0;poses.length=0;s.progress=expected.at+20;
    r.w.reactionInspect.drawRearRoad(ctx,s,638,12,690,117,'#9aefce',false);
    const rear=r.w.vehicleCalls.find(call=>call.kind==='freight');
    assert(rear&&rear.alpha>0&&rear.alpha<=expected.alpha);
    assert(poses.some(p=>p.id===expected.id&&p.at===expected.at&&p.lane===expected.lane));
  }
  console.log('Cache reaction integration: real collisions, difficulty recovery, legacy behavior and shared front/rear poses passed.');
}
if(require.main===module)run();
module.exports={rig,run};
