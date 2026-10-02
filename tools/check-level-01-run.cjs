#!/usr/bin/env node
// Real production locomotion/input and exact new raster cels at native Canvas.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { spawn } = require('node:child_process'), { once } = require('node:events');
const { createRig, load } = require('./check-level-01-boss');
const { createSprite, playerClips } = require('./makko-animation-fixture');
const root = path.resolve(__dirname, '..'), out = process.argv[2] && path.resolve(process.argv[2]);
const { createCanvas, loadImage } = require(require.resolve('@napi-rs/canvas', { paths: [process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES || root, root] }));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file)));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const cal = read('assets/level1-run/calibration.json'), runMeta = read('assets/level1-run/6_bit_run_run.json');
const near = (a,b,why) => assert(Math.abs(a-b)<1e-6, `${why}: ${a} / ${b}`);
const clone = v => JSON.parse(JSON.stringify(v));
function rig(saved) {
  const r = createRig(), { w, context } = r;
  w.rhythmSystem.hideRhythmMode(); w.player.position.x = 100; w.player.allowMovement = true;
  const storage = new Map(saved ? [['barcode.controller.v1', JSON.stringify(saved)]] : []);
  w.localStorage = { getItem: k => storage.get(k), setItem: (k,v) => storage.set(k,v) };
  for (const file of ['src/core/gamepad-ui.js','src/core/action-input.js','src/core/input.js']) load(context,file);
  w.inputManager = new w.InputManager(); w.player.sprite = createSprite(playerClips); w.player.spriteReady = true;
  return r;
}
function route(r, keys = []) {
  r.w.inputManager.actionInput.keysHeld = new Set(keys);
  r.w.inputManager.update();
}
function locomotion() {
  for (const fps of [30,60,120]) {
    const r = rig(), { w } = r, p = w.player;
    const body = clone(p.getHitbox());
    route(r,['d']);
    for(let i=0;i<fps/2;i++) { route(r,['d']); p.update(1000/fps,true); }
    near(p.position.x,250,`${fps}: walk remains 300/s`); assert.equal(p.state,'walk');
    p.position.x = 100;
    for(let i=0;i<fps/2;i++) { route(r,['d','shift']); p.update(1000/fps,true); }
    near(p.position.x,325,`${fps}: held run is 450/s`); assert.equal(p.state,'run');
    assert.equal(p.currentAnimation,'6_bit_run_run'); near(p.getAnimationPlaybackRate(),1,'native run cadence');
    assert.equal(p.getHitbox().width,body.width); assert.equal(p.getHitbox().height,body.height);
    route(r,['d']); p.update(1000/fps,true); assert.equal(p.velocity.x,300); assert.equal(p.state,'walk');
    route(r,['a','d','shift']); p.update(1000/fps,true); assert.equal(p.velocity.x,0); assert.equal(p.state,'idle');
    route(r,['a','shift']); p.update(1000/fps,true); assert.equal(p.velocity.x,-450); assert.equal(p.facing,-1); assert.equal(p.state,'run');
    route(r,['shift']); p.update(1000/fps,true); assert.equal(p.state,'idle','holding run without a direction stays idle');
    route(r,['d','shift']); const before = { x:p.position.x, frame:p.animationRef.currentFrame, time:p.animationTime };
    w.isPaused=true; p.update(500,true); assert.deepEqual({ x:p.position.x,frame:p.animationRef.currentFrame,time:p.animationTime },before);
    assert.equal(p.isRunActive(),false); w.inputManager.resetActionEdges(); assert.equal(p.runHeld,false); w.isPaused=false;
    route(r,['d','shift']); p.startEntranceAnimation({targetX:200}); p.setRunHeld(true); p.update(100,true);
    assert.equal(p.velocity.x,300,'entrance remains a walk regardless of held run'); assert.equal(p.state,'walk');
    p.cancelEntranceAnimation(); p.position.x=100; p.grounded=true; p.position.y=784; p.controlsDisabled=false;
    w.rhythmSystem.show(); route(r,['d','shift']); p.update(20,true); assert.equal(p.velocity.x,0); assert.equal(p.isRunActive(),false);
    w.rhythmSystem.hideRhythmMode(); w.hackingSystem.active=true; route(r,['d','shift']); assert.equal(p.isRunActive(),false);
    w.hackingSystem.active=false; p.controlsDisabled=true; assert.equal(p.isRunActive(),false); p.controlsDisabled=false;
    route(r,['d','shift']); assert.equal(p.jump(),true); assert.equal(p.isRunActive(),false); p.moveRight();
    p.update(20,true); assert.equal(p.state,'jump'); assert(Math.abs(p.velocity.x)<=350,'run preserves directional air-speed cap');
    p.position.x=900; p.position.y=784; p.grounded=true; p.velocity.y=0;
    route(r,['d','shift']); p.update(1000,true); const gate=r.p.getCurrentGate();
    assert(p.position.x+p.width/2<=gate.x+1e-6,'run cannot cross a closed gameplay gate');
    assert.deepEqual(r.calls.errors,[]);
  }
}
function controls() {
  const keyboard=rig(), k=keyboard.w.inputManager.actionInput;
  k.handleKeyDown({key:'D'}); k.handleKeyDown({key:'Shift'}); keyboard.w.inputManager.update();
  assert.equal(keyboard.w.player.velocity.x,450,'the existing key event owner holds Shift to run');
  k.handleKeyUp({key:'Shift'}); keyboard.w.inputManager.update(); assert.equal(keyboard.w.player.velocity.x,300);
  k.remap('run',['q']); k.handleKeyDown({key:'q'}); keyboard.w.inputManager.update(); assert.equal(keyboard.w.player.velocity.x,450);
  const old = {jump:0,primary:0,interact:3,rhythm_mode:4,inspect:6};
  const r = rig({layoutVersion:3,bindings:{...old,road_attack:5,road_turbo:4,road_defend:7,road_disrupt:6},labels:'xbox'}),{w}=r;
  for(const [a,b] of Object.entries(old)) assert.equal(w.BARCODE.ControllerSettings.bindings[a],b,'old remaps stay exact');
  assert.equal(w.BARCODE.ControllerSettings.bindings.run,7,'occupied old L2 gets a free Run control');
  const pad={index:0,id:'standard',mapping:'standard',connected:true,axes:[0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
  w.navigator.getGamepads=()=>[pad]; w.inputManager.update();
  pad.axes[0]=1; pad.buttons[7].value=.49; w.inputManager.update(); assert.equal(w.player.velocity.x,300);
  pad.buttons[7].value=.7; w.inputManager.update(); assert.equal(w.player.velocity.x,450,'mapped analog trigger holds run');
  w.inputManager.resetActionEdges(); w.inputManager.update(); assert.equal(w.player.runHeld,false,'held trigger cannot leak through an owner reset');
  pad.buttons[7].value=0; w.inputManager.update(); pad.buttons[7].value=.8; w.inputManager.update(); assert.equal(w.player.runHeld,true);
  w.BARCODE.ControllerSettings.bind('run',10); assert.equal(w.BARCODE.ControllerSettings.bindings.inspect,6);
  assert.equal(w.player.runHeld,false,'saving a remap clears transient held run state');
  assert.equal(w.BARCODE.ControllerSettings.bindings.road_disrupt,6,'Level1 remap cannot change Road L2 Disrupt');
  const a=w.inputManager.actionInput; a.reset(); pad.buttons[7].value=0; pad.buttons[10].pressed=false; a.update();
  pad.buttons[10].pressed=true; assert.equal(a.update().run.held,true,'remapped run button is read by production action owner');
  pad.buttons[6].value=.8; const road=a.update(); assert.equal(road.road_disrupt.held,true,'road L2 Disrupt stays independently mapped');
  assert.equal(road.road_defend.held,false); assert.equal(road.road_attack.held,false);
}
async function art() {
  const meta = runMeta, frames=Object.values(meta.frames), entry=read('sprites-manifest.json').characters['6_bit_main'].animations['6_bit_run_run'];
  assert.equal(frames.length,12); assert.equal(entry.frameCount,12); assert.equal(entry.animationLength,.6); assert.equal(entry.fps,20);
  const imagePin=/^https:\/\/raw\.githubusercontent\.com\/6-Bit-01\/BARCODE-SYSTEM-OVERRIDE\/([a-f0-9]{40})\/assets\/level1-run\/6_bit_run_run\.webp$/.exec(entry.image);
  assert(imagePin,'new native run atlas uses an immutable production asset URL');
  assert.equal(entry.json,entry.image.replace(/\.webp$/,'.json'),'run metadata shares its immutable atlas revision');
  assert.deepEqual(entry.anchor,meta.meta.anchor); assert.equal(meta.meta.scale,1); assert.equal(cal.uniquePoses,12);
  near(cal.renderScale * cal.sourceMedianBodyHeight,cal.targetMedianBodyHeight,'run matches the measured canonical walk body height');
  const bytes=fs.readFileSync(path.join(root,'assets/level1-run/6_bit_run_run.webp')); assert.equal(hash(bytes),cal.sha256);
  const original=read('assets/sprites-v3/original-manifest.json'),installed=read('sprites-manifest.json');
  for(const [character,record] of Object.entries(original.characters)) {
    assert.deepEqual(Object.keys(installed.characters[character].animations).sort(), [...Object.keys(record.animations),...(character==='6_bit_main'?['6_bit_run_run']:[])].sort());
  }
  const oldCal=read('assets/sprites-v3/calibration.json');
  for(const [name,c] of Object.entries(oldCal)) assert.equal(hash(fs.readFileSync(path.join(root,'assets/sprites-v3/prepared',name+'.webp'))),c.sha256,`${name}: old raster bytes unchanged`);
  const clips={};
  for(const [name,folder] of [['6_bit_walk_walk','assets/sprites-v3/prepared'],['6_bit_run_run','assets/level1-run']]) {
    const data=read(folder+'/'+name+'.json'); clips[name]={meta:data,image:await loadImage(path.join(root,folder,name+'.webp')),frames:Object.values(data.frames)};
  }
  const c=createCanvas(512,512),ctx=c.getContext('2d'),unique=new Set();
  for(let i=0;i<12;i++) {
    const f=frames[i].frame; ctx.clearRect(0,0,512,512); ctx.drawImage(clips['6_bit_run_run'].image,f.x,f.y,f.w,f.h,0,0,f.w,f.h);
    const rgba=ctx.getImageData(0,0,512,512).data; unique.add(hash(rgba));
    let bottom=-1; for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(rgba[(y*512+x)*4+3]>=128)bottom=y;
    assert.equal(bottom,cal.registration[i].visibleFootRow,'decoded cels retain measured contact/flight height');
    assert.equal(frames[i].duration,50);
  }
  assert.equal(unique.size,12,'twelve genuinely distinct native run drawings');
  function sprite() {
    const s=createSprite({'6_bit_walk_walk':64,'6_bit_run_run':12}),play=s.play;
    s.play=function(name,...args){const ref=play.call(s,name,...args),sheet=s.currentSprite,d=clips[name];sheet.metadata.frames=Object.fromEntries(d.frames.map((f,i)=>[String(i),f]));sheet.getAnchorPoint=()=>d.meta.meta.anchor;sheet.hasManifestAnchor=()=>true;sheet.getManifestScale=()=>1;return ref;};
    s.draw=(canvas,x,y,o={})=>{const d=clips[s.getCurrentAnimation()],f=d.frames[s.currentSprite.currentFrame].frame,a=s.currentSprite.getAnchorPoint();canvas.save();canvas.translate(x,y);canvas.scale(o.flipH?-o.scale:o.scale,o.scale);canvas.globalAlpha*=o.alpha??1;canvas.drawImage(d.image,f.x,f.y,f.w,f.h,-a.x,-a.y,f.w,f.h);canvas.restore();};return s;
  }
  const a=rig(),b=rig();
  for(const r of [a,b]) {r.w.player.sprite=sprite();r.w.player.position.x=100;r.w.player.position.y=784;r.w.player.grounded=true;r.w.player.drawWindEffects=()=>{};}
  const video=createCanvas(960,360),v=video.getContext('2d'),review=createCanvas(960,1080),rv=review.getContext('2d');
  if(out)fs.mkdirSync(out,{recursive:true});
  let ff;
  if(out) {ff=spawn('ffmpeg',['-y','-f','image2pipe','-framerate','60','-i','-','-an','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',path.join(out,'walk-run-native.mp4')],{stdio:['pipe','ignore','pipe']});ff.stderr.on('data',()=>{});}
  const sampled=new Set();
  for(let i=0;i<120;i++) {
    // Shared production update advances both real actors. Each panel follows
    // its actor; draw repeats must never advance the native sprite clock.
    for(const [r,keys] of [[a,['d']],[b,['d','shift']]]) {route(r,keys);r.w.player.update(1000/60,true);}
    v.fillStyle='#152131';v.fillRect(0,0,960,360);v.strokeStyle='#d5bc76';v.beginPath();v.moveTo(0,310);v.lineTo(960,310);v.stroke();
    for(const [r,x,label] of [[a,240,'WALK  300 / second'],[b,720,'RUN  450 / second']]) {
      const p=r.w.player,before={x:p.position.x,frame:p.animationRef.currentFrame,time:p.animationTime};
      v.save();v.translate(x-p.position.x,310-856);p.drawSprite(v);v.restore();assert.deepEqual({x:p.position.x,frame:p.animationRef.currentFrame,time:p.animationTime},before);
      v.fillStyle='#efe8d4';v.font='22px sans-serif';v.textAlign='center';v.fillText(label,x,38);
    }
    sampled.add(b.w.player.animationRef.currentFrame);
    if(i%10===0)rv.drawImage(video,i/10%2*480,Math.floor(i/20)*180,480,180);
    if(ff&&!ff.stdin.write(video.toBuffer('image/png')))await once(ff.stdin,'drain');
    if(i===20&&out)fs.writeFileSync(path.join(out,'walk-run-native.png'),video.toBuffer('image/png'));
  }
  assert.equal(sampled.size,12,'production playback reaches all twelve run poses');
  if(ff){ff.stdin.end();const [code]=await once(ff,'close');assert.equal(code,0);fs.writeFileSync(path.join(out,'run-phases.png'),review.toBuffer('image/png'));}
  const evidence={groundSpeeds:{walk:300,run:450},controls:{keyboard:'Hold Shift',controller:'Hold L2 / LT (remappable)'},nativeRunFrames:12,gaitDurationMs:600,sourceSha256:cal.sourceSha256,atlasSha256:cal.sha256,limits:'Production owners with native Canvas/public Makko boundary; physical controller, hosted Makko and device FPS are separate acceptance.'};
  if(out)fs.writeFileSync(path.join(out,'receipt.json'),JSON.stringify(evidence,null,2)+'\n');
  return evidence;
}
(async()=>{locomotion();controls();console.log(JSON.stringify(await art(),null,2));})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
