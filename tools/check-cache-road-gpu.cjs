// Production scene/renderer contracts under explicit host and graphics stubs.
// Run actual browser checks separately for pixels, audio and performance.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { fixture, nativeContext: native, NativePath: Path, rendererBytes, contextBytes,
  cinematicsBytes, roadBytes, bankBytes, textureWorkerBytes, compressedBank,
  levelSourceDescriptors, roadSceneApi } = require('./lib/cache-road-gpu-fixture.cjs');
const plain = value => JSON.parse(JSON.stringify(value));
const checks = [];
function check(name, run) { checks.push({ name, run }); }
async function settle() { for (let i = 0; i < 8; i++) await Promise.resolve(); }

{
  const f = fixture(), Recorder = f.Recorder;
check('closed subpath and rect continue from their starting point',()=>{const c=new Recorder(native());c.moveTo(2,3);c.lineTo(8,3);c.lineTo(8,9);c.closePath();c.lineTo(10,20);c.stroke();assert.deepEqual(plain(c.commands[0].paths),[{points:[2,3,8,3,8,9],closed:true},{points:[2,3,10,20],closed:false}]);c.beginPath();c.rect(4,5,6,7);c.lineTo(20,30);c.stroke();assert.deepEqual(plain(c.commands[1].paths[1].points),[4,5,20,30]);});
check('closed cubic continuation starts at the closed origin',()=>{const c=new Recorder(native());c.moveTo(0,0);c.lineTo(9,0);c.closePath();c.bezierCurveTo(0,3,3,3,3,0);c.stroke();const p=c.commands[0].paths[1].points;assert.deepEqual(plain(p.slice(0,2)),[0,0]);assert.deepEqual(plain(p.slice(-2)),[3,0]);});
check('source paths are transformed and snapshotted at clipping',()=>{const n=native(),c=new Recorder(n),p=c.createPath();p.rect(1,2,3,4);c.translate(10,20);c.clip(p,'evenodd');p.rect(100,200,300,400);c.fillRect(0,0,5,6);assert.deepEqual(plain(c.commands[0].clips[0].paths[0].points),[11,22,14,22,14,26,11,26]);c.replay(n);const clip=n.draws.find(call=>call.method==='clip');assert.equal(clip.args[0].ops.length,1);assert.equal(clip.args[1],'evenodd');});
check('gradient commands snapshot stops and preserve creation transforms',()=>{const n=native(),c=new Recorder(n);c.save();c.scale(3,2);c.translate(4,5);const g=c.createRadialGradient(0,0,1,0,0,8);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#00000000');c.fillStyle=g;c.fillRect(0,0,10,10);g.addColorStop(.5,'#ff0000');assert.equal(c.commands[0].style.stops.length,2);assert.deepEqual(plain(c.commands[0].style.transform),{a:3,b:0,c:0,d:2,e:12,f:10});c.restore();c.replay(n);assert.deepEqual(n.gradients[0].m,{a:3,b:0,c:0,d:2,e:12,f:10});});
check('anisotropic stroke has exact user-space width and transform',()=>{const c=new Recorder(native());c.moveTo(10,20);c.lineTo(30,40);c.setTransform(2,.5,.75,3,4,5);c.lineWidth=7;c.stroke();const command=c.commands[0],m=command.strokeTransform;assert.equal(command.nativeLineWidth,7);for(let j=0;j<command.paths[0].points.length;j+=2){const p=command.strokePaths[0].points,x=p[j],y=p[j+1];assert(Math.abs(m.a*x+m.c*y+m.e-command.paths[0].points[j])<1e-10);assert(Math.abs(m.b*x+m.d*y+m.f-command.paths[0].points[j+1])<1e-10);}});
check('nine-argument atlas crop and horizontal flip remain exact',()=>{const c=new Recorder(native()),image={naturalWidth:1472,naturalHeight:534};c.translate(91,72);c.scale(-1,1);c.drawImage(image,1104,267,368,267,-40,-50,80,50);const command=c.commands[0];assert.equal(command.image,image);assert.deepEqual(plain(command.source),[1104,267,368,267]);assert.deepEqual(plain(command.dest),[-40,-50,80,50]);assert.deepEqual(plain(command.transform),{a:-1,b:0,c:0,d:1,e:91,f:72});});
check('fallback replay reinstates initial styles and retains caller stack',()=>{const n=native();n.save();n.setTransform(1.2,.2,-.2,1.2,10,20);n.setLineDash([2,3]);const c=new Recorder(n);c.fillRect(1,2,3,4);c.save();c.globalAlpha=.3;c.translate(5,6);c.fillRect(4,5,6,7);c.restore();n.globalAlpha=.99;n.fillStyle='#ff0000';n.setTransform(9,0,0,9,100,200);n.setLineDash([]);c.replay(n);const paint=n.draws.filter(call=>call.method==='fillRect');assert.equal(paint[0].alpha,.7);assert.equal(paint[0].fillStyle,'#123456');assert.deepEqual(paint[0].m,{a:1.2,b:.2,c:-.2,d:1.2,e:10,f:20});assert.deepEqual(paint[0].dash,[2,3]);assert.equal(n.stack.length,1);assert.equal(n.globalAlpha,.7);assert.deepEqual(n.dash,[2,3]);});
check('unbalanced recording cannot consume native caller save frames',()=>{const n=native();n.save();const c=new Recorder(n);c.restore();c.save();c.globalAlpha=.2;c.fillRect(0,0,2,2);assert.equal(c.commands.balanced,false);assert.throws(()=>c.applyState(n),/did not balance/);c.replay(n);assert.equal(n.stack.length,1);assert.equal(n.globalAlpha,.2);});
check('all command types retain filter and complete shadow state',()=>{const c=new Recorder(native());c.filter='hue-rotate(315deg)';c.shadowOffsetX=3;c.shadowOffsetY=4;c.shadowColor='#ff0000';c.fillRect(0,0,5,5);c.drawImage({width:5,height:5},0,0);c.fillText('P',1,2);for(const command of c.commands){assert.equal(command.filter,'hue-rotate(315deg)');assert.equal(command.shadowOffsetX,3);assert.equal(command.shadowOffsetY,4);assert.equal(command.shadowColor,'#ff0000');}});
check('rounded tire contour replays original method; opaque native path falls back',()=>{const n=native(),c=new Recorder(n);c.roundRect(2,3,12,9,2);c.fill();assert.deepEqual(plain(c.commands[0].paths.at(-1).points),[2,3]);c.replay(n);assert.equal(n.draws.filter(call=>call.method==='roundRect').length,1);assert.equal(n.draws.filter(call=>['lineTo','arc','closePath'].includes(call.method)).length,0);const d=new Recorder(native());d.clip(new Path());d.fillRect(0,0,3,3);assert.equal(d.commands[0].kind,'unsupported');});
}


{
  const f = fixture(), gpu = f.internals, Recorder = f.Recorder;
  function command(draw) {
    const c = new Recorder(native());
    const gradient = c.createLinearGradient(0, 0, 20, 20);
    gradient.addColorStop(0, '#abcdef'); gradient.addColorStop(1, '#00000000');
    c.fillStyle = gradient; draw(c); return c.commands.at(-1);
  }
  function item() { return gpu.slot([], 0); }
check('actual recorder rectangle including degenerate current point uses exact unmasked quad',()=>{const cmd=command(c=>c.fillRect(2,3,10,11)),i=item();assert.equal(gpu.paintGradient(i,cmd),true);assert.equal(i.gradient.mask,null);assert.equal(i.gradientMask.visible,false);assert.deepEqual(plain(i.gradient.geometry.positions),{0:2,1:3,2:12,3:3,4:12,5:14,6:2,7:14});assert.deepEqual(Array.from(i.gradient.geometry.indices),[0,1,2,0,2,3]);});
check('actual transformed triangle preserves device positions and saved gradient inverse',()=>{const cmd=command(c=>{c.setTransform(2,.5,-.2,3,9,12);c.beginPath();c.moveTo(0,0);c.lineTo(10,0);c.lineTo(3,5);c.closePath();c.fill();}),i=item();assert.equal(gpu.paintGradient(i,cmd),true);assert.equal(i.gradient.geometry.positions.length,6);for(let j=0;j<6;j++)assert(Math.abs(i.gradient.geometry.positions[j]-cmd.paths[0].points[j])<1e-6);assert.deepEqual(Array.from(i.gradient.geometry.indices),[0,1,2]);assert.deepEqual(plain(Array.from(i.gradient.shader.resources.gradientUniforms.uniforms.uInverse)),[1,0,0,0,1,0,0,0,1]);});
check('clockwise simple convex quad has no stencil',()=>{const cmd=command(c=>{c.beginPath();c.moveTo(0,0);c.lineTo(0,9);c.lineTo(8,9);c.lineTo(8,0);c.closePath();c.fill();}),i=item();assert.equal(gpu.paintGradient(i,cmd),true);assert.equal(i.gradient.mask,null);});
check('concave quad retains exact mask path',()=>{const cmd=command(c=>{c.beginPath();c.moveTo(0,0);c.lineTo(10,0);c.lineTo(2,2);c.lineTo(0,10);c.closePath();c.fill();}),i=item();assert.equal(gpu.paintGradient(i,cmd),false);assert.equal(i.gradient.mask,i.gradientMask);assert.equal(i.gradientMask.visible,true);assert.deepEqual(plain(i.gradientMask.ops[0][1][0]),plain(cmd.paths[0].points));});
check('compound and evenodd fills keep masks',()=>{for(const rule of ['nonzero','evenodd']){const cmd=command(c=>{c.beginPath();c.rect(0,0,10,10);c.rect(2,2,5,5);c.fill(rule);}),i=item();assert.equal(gpu.paintGradient(i,cmd),false);assert.equal(i.gradient.mask,i.gradientMask);assert.equal(i.gradientMask.visible,true);}});
check('curved fills and anisotropic gradient strokes keep full mask',()=>{const curve=command(c=>{c.beginPath();c.arc(5,5,5,0,Math.PI*2);c.closePath();c.fill();}),i=item();assert.equal(gpu.paintGradient(i,curve),false);assert.equal(i.gradient.mask,i.gradientMask);const stroke=command(c=>{c.setTransform(3,.2,.5,2,4,5);c.beginPath();c.moveTo(0,0);c.lineTo(10,5);c.strokeStyle=c.fillStyle;c.lineWidth=3;c.stroke();}),j=item();assert.equal(gpu.paintGradient(j,stroke),false);assert.equal(j.gradient.mask,j.gradientMask);assert.deepEqual(plain(j.gradientMask.matrix),plain(stroke.strokeTransform));assert.equal(j.gradientMask.ops.at(-1)[0],'stroke');assert.equal(j.gradientMask.ops.at(-1)[1][0].width,3);});
check('pooled masked then triangle then quad resets mask, visibility and index count',()=>{const i=item(),curve=command(c=>{c.beginPath();c.arc(5,5,5,0,Math.PI*2);c.closePath();c.fill();}),tri=command(c=>{c.beginPath();c.moveTo(0,0);c.lineTo(9,0);c.lineTo(5,8);c.closePath();c.fill();}),quad=command(c=>c.fillRect(0,0,10,10));gpu.paintGradient(i,curve);gpu.showContents(i,'gradient');assert.equal(i.gradientMask.visible,true);gpu.paintGradient(i,tri);gpu.showContents(i,'gradient');assert.equal(i.gradient.mask,null);assert.equal(i.gradientMask.visible,false);assert.equal(i.gradient.geometry.indices.length,3);const cachedUVs=i.gradientUVs[3];gpu.paintGradient(i,tri);assert.equal(i.gradientUVs[3],cachedUVs);gpu.paintGradient(i,quad);assert.equal(i.gradient.geometry.indices.length,6);gpu.paintGradient(i,curve);assert.equal(i.gradient.mask,i.gradientMask);assert.equal(i.gradientMask.visible,true);});
check('singular gradient transforms retain existing explicit fallback error',()=>{const cmd=command(c=>c.fillRect(0,0,3,3));cmd.style.transform={a:0,b:0,c:0,d:0,e:0,f:0};assert.throws(()=>gpu.paintGradient(item(),cmd),/Singular gradient transform/);});
}


{
  function warmupFixture() {
    const f = fixture(); f.ctx.font = '12px monospace'; f.ctx.measureText = () => ({ width: 32 });
    return f;
  }
check('warmup awaits original decodes and alone owns uploads before caller handoff',async()=>{const f=warmupFixture();let release;const d=f.image('first',32,32,()=>new Promise(r=>{release=r;}));const pending=f.gpu.warmup(f.ctx,[d]);await settle();assert.deepEqual(f.decodes,['first']);assert.equal(f.uploads.length,0);release();const result=await pending;assert.equal(result.ready,true);assert.equal(result.fit,true);assert.equal(f.uploads.filter(x=>x.resource===d.image).length,1);assert.equal(f.state.text.size,1);assert.equal(f.ctx.font,'12px monospace');assert.equal(f.ctx.stack.length,0);assert.equal(f.surfaces.length,1);assert.equal(f.P.Ticker.system.started,false);assert.equal(f.P.Ticker.shared.started,false);assert.equal(f.state.renderer.eventTarget,null);assert.equal(f.state.renderer.options.width,1920);assert.equal(f.state.renderer.options.resolution,1);});
check('warmup exceeding256Mi texels reports actual failure before decode/image upload',async()=>{const f=warmupFixture(),d=f.image('oversize',16384,16384,()=>Promise.resolve());const result=await f.gpu.warmup(f.ctx,[d]);assert.equal(result.ready,false);assert.equal(result.fit,false);assert.equal(result.reason,'initial-source-set-exceeds-cap');assert(result.requiredTexels>256*1024*1024);assert.equal(f.decodes.length,0);assert.equal(f.uploads.length,0);assert.equal(f.state.sources.size,0);});
check('notloaded images and unavailable renderer remain explicit incomplete warmup',async()=>{const f=warmupFixture(),d=f.image('loading');d.image.complete=false;const result=await f.gpu.warmup(f.ctx,[d]);assert.equal(result.ready,false);assert.deepEqual(plain(result.notReadySources),['loading']);assert.equal(f.uploads.filter(x=>x.resource===d.image).length,0);const g=warmupFixture();delete g.P.WebGLRenderer;const absent=await g.gpu.warmup(g.ctx,[g.image('no-gl')]);assert.equal(absent.ready,false);assert.equal(absent.reason,'renderer-not-ready');});
check('optional decode settlement performs no upload and prepare bounds starts/uploads to2',async()=>{const f=warmupFixture();await f.gpu.warmup(f.ctx,[],{texts:[]});const releases=[],ds=Array.from({length:5},(_,i)=>f.image('future-'+i,32,32,()=>new Promise(r=>releases.push(r))));f.gpu.prepare(f.ctx,ds);assert.equal(f.decodes.length,2);assert.equal(f.uploads.length,0);releases.slice().forEach(r=>r());await settle();assert.equal(f.uploads.length,0);f.gpu.prepare(f.ctx,ds);assert.equal(f.uploads.length,2);assert.equal(f.decodes.length,4);releases.slice().forEach(r=>r());await settle();f.gpu.prepare(f.ctx,ds);assert.equal(f.uploads.length,4);assert.equal(f.decodes.length,5);assert.equal(f.gpu.diagnostics().prefetchUploads,4);});
check('overbudget optional lookahead cannot evict actual demand or cycle requested residents',async()=>{const f=warmupFixture(),current=f.image('current',8192,8192),next=f.image('next',8192,8192),large=f.image('third',8192,8192);await f.gpu.warmup(f.ctx,[current],{texts:[]});f.state.demands.set('forward',{images:new Set([current.image]),texts:new Set(),tick:f.state.tick});f.gpu.prepare(f.ctx,[current,next,large]);assert(f.state.sources.has(current.image));assert(f.state.sources.has(next.image));assert.equal(f.state.sources.has(large.image),false);const uploaded=f.uploads.length;for(let n=0;n<5;n++){f.state.demands.set('forward',{images:new Set([current.image]),texts:new Set(),tick:f.state.tick});f.gpu.prepare(f.ctx,[current,next,large]);}assert.equal(f.uploads.length,uploaded);assert(f.state.sources.has(current.image));assert(f.state.sources.has(next.image));assert.equal(f.gpu.diagnostics().optionalStatus,'budget-limited');assert.equal(f.gpu.diagnostics().fallback,null);assert(f.gpu.diagnostics().residentTexels<=256*1024*1024);});
check('dropped optional route sources become LRU while actual current source stays protected',async()=>{const f=warmupFixture(),current=f.image('current',8192,8192),old=f.image('old',8192,8192),next=f.image('new',8192,8192);await f.gpu.warmup(f.ctx,[current],{texts:[]});f.state.demands.set('forward',{images:new Set([current.image]),texts:new Set(),tick:f.state.tick});f.gpu.prepare(f.ctx,[current,old]);f.state.demands.set('forward',{images:new Set([current.image]),texts:new Set(),tick:f.state.tick});f.gpu.prepare(f.ctx,[current,next]);assert(f.state.sources.has(current.image));assert.equal(f.state.sources.has(old.image),false);assert(f.state.sources.has(next.image));assert.equal(f.gpu.diagnostics().evictions,1);});
check('decode rejection retains original loaded source upload and reports failed decode',async()=>{const f=warmupFixture(),d=f.image('decode-rejected',32,32,()=>Promise.reject(Error('unsupported')));const result=await f.gpu.warmup(f.ctx,[d],{texts:[]});assert.equal(result.ready,true);assert.deepEqual(plain(result.decodeFailedSources),['decode-rejected']);assert(f.state.sources.has(d.image));f.gpu.prepare(f.ctx,[d]);assert.equal(f.gpu.diagnostics().optionalDecodeFailed,1);});
check('late-to-early route handoff reclaims old demand while each route independently fits',async()=>{const f=warmupFixture(),late=[f.image('late-1',8192,8192),f.image('late-2',8192,8192)],early=[f.image('early-1',8192,8192),f.image('early-2',8192,8192)];const before=await f.gpu.warmup(f.ctx,late);assert.equal(before.ready,true);assert(before.requiredTexels<=256*1024*1024);const lateTexels=late.reduce((n,d)=>n+f.state.sources.get(d.image).cost,0);assert(lateTexels*2+f.state.targetTexels>256*1024*1024);f.state.demands.set('forward',{images:new Set(late.map(d=>d.image)),texts:new Set(),tick:f.state.tick});f.state.demands.set('rear',{images:new Set(late.map(d=>d.image)),texts:new Set(),tick:f.state.tick});f.state.optionalSources=new Map(late.map(d=>[d.image,f.state.sources.get(d.image).cost]));f.state.pendingSources.set(late[0].image,123);f.state.pendingText.set('obsolete',{text:'old',font:'bold 64px Oxanium'});f.state.optionalStatus='budget-limited';const after=await f.gpu.warmup(f.ctx,early);assert.equal(after.ready,true);assert.equal(after.fit,true);assert(after.requiredTexels<=256*1024*1024);assert.equal(f.state.pendingSources.size,0);assert.equal(f.state.pendingText.size,0);assert.equal(f.state.optionalSources.size,0);assert.equal(f.state.optionalStatus,null);assert.equal(f.state.demands.has('forward'),false);assert.equal(f.state.demands.has('rear'),false);assert.deepEqual([...f.state.demands.get('warmup').images],early.map(d=>d.image));for(const d of early)assert(f.state.sources.has(d.image));for(const d of late)assert.equal(f.state.sources.has(d.image),false);assert.equal(f.state.text.size,1);assert.equal(f.gpu.diagnostics().residentTexels<=256*1024*1024,true);assert.equal(f.state.evictions,2);});
check('diagnostics report bounded residency and omit remote descriptor URLs',async()=>{const f=warmupFixture(),d=f.image('signed');d.path='https://host.invalid/art.png?token=private';await f.gpu.warmup(f.ctx,[d],{texts:[]});const data=f.gpu.diagnostics();assert.equal(data.residentBudgetTexels,256*1024*1024);assert.equal(data.residentSourceDescriptors[0].key,'signed');assert.equal(data.residentSourceDescriptors[0].path,null);assert(!JSON.stringify(data).includes('private'));assert.equal(data.residentSourceDescriptors[0].width,32);assert.equal(data.residentSourceDescriptors[0].mipTexels,1365);});
}

check('all original Level 2 sources fit before play and resident prepare performs no upload or decode', async () => {
  const f = fixture(), descriptors = levelSourceDescriptors();
  assert.equal(descriptors.length, 171);
  await f.gpu.warmup(f.ctx, [], { texts: [] });
  f.state.pendingRearViewport = { x: 626, y: 0, width: 714, height: 141 };
  f.gpu.prepare(f.ctx);
  const result = await f.gpu.warmup(f.ctx, descriptors, { rearViewport: { x: 626, y: 0, width: 714, height: 141 } });
  assert.equal(result.ready, true); assert.equal(result.fit, true);
  assert.equal(f.state.sources.size, 171); assert.equal(f.state.text.size, 1);
  const sourceMipTexels = [...f.state.sources.values()].reduce((sum, entry) => sum + entry.cost, 0);
  assert.equal(sourceMipTexels, 255565094);
  assert.equal(f.state.targetTexels, 2274948);
  assert.equal(result.requiredTexels, sourceMipTexels + f.state.targetTexels + [...f.state.text.values()][0].cost);
  assert(result.requiredTexels <= 256 * 1024 * 1024);
  for (const descriptor of descriptors) {
    const resident = f.state.sources.get(descriptor.image);
    assert.equal(resident.width, descriptor.image.naturalWidth);
    assert.equal(resident.height, descriptor.image.naturalHeight);
    assert.equal(resident.texture.source.resource, descriptor.image);
    assert.equal(resident.texture.source.autoGenerateMipmaps, true);
  }
  const uploads = f.uploads.length, decodes = f.decodes.length;
  for (let i = 0; i < 4; i++) f.gpu.prepare(f.ctx, descriptors);
  assert.equal(f.uploads.length, uploads); assert.equal(f.decodes.length, decodes);
  assert.equal(f.gpu.diagnostics().pendingSources, 0);
  assert.equal(f.gpu.diagnostics().optionalPendingSources, 0);
  assert.equal(f.gpu.diagnostics().evictions, 0);
});

check('entry waits for the existing parking font before glyph and image uploads', async () => {
  const f = fixture(), d = f.image('font-handoff'); let finishFont, loaded = false;
  f.document.fonts.check = () => loaded;
  f.document.fonts.load = (font, text) => {
    assert.equal(font, 'bold 64px Oxanium'); assert.equal(text, 'P');
    return new Promise(resolve => { finishFont = () => { loaded = true; resolve(); }; });
  };
  const preparation = f.gpu.warmup(f.ctx, [d]); await settle();
  assert.equal(f.uploads.length, 0); assert.equal(f.state.text.size, 0);
  finishFont(); const result = await preparation;
  assert.equal(result.ready, true); assert.equal(f.state.text.size, 1);
  assert(f.state.sources.has(d.image));
});

check('failed optional GL uploads are bounded attempts and do not retry the same requested failures', async () => {
  const f = fixture(); await f.gpu.warmup(f.ctx, [], { texts: [] });
  const descriptors = Array.from({ length: 5 }, (_, index) => f.image('failed-' + index));
  let attempts = 0;
  f.state.renderer.texture.initSource = () => { attempts++; throw Error('upload unavailable'); };
  const result = await f.gpu.warmup(f.ctx, descriptors, { texts: [] });
  assert.equal(result.ready, false); assert.equal(result.missingSources.length, 5);
  attempts = 0; f.gpu.prepare(f.ctx, descriptors); assert.equal(attempts, 2);
  f.gpu.prepare(f.ctx, descriptors); assert.equal(attempts, 4);
  f.gpu.prepare(f.ctx, descriptors); assert.equal(attempts, 5);
  f.gpu.prepare(f.ctx, descriptors); assert.equal(attempts, 5);
  assert.equal(f.gpu.diagnostics().optionalUploadFailed, 5);
});

check('atlas crop and horizontal flip retain original source UVs and native positions', () => {
  const f = fixture(), c = new f.Recorder(f.ctx), image = f.image('atlas', 1472, 534).image;
  c.translate(91, 72); c.scale(-1, 1);
  c.drawImage(image, 1104, 267, 368, 267, -40, -50, 80, 50);
  const quad = f.internals.imageQuad(c.commands[0], { width: 1472, height: 534 });
  assert.deepEqual(plain(quad.positions), [131, 22, 51, 22, 51, 72, 131, 72]);
  assert.deepEqual(plain(quad.uvs), [.75, .5, 1, .5, 1, 1, .75, 1]);
});

check('real recorder triangle clips ignore degenerate current subpaths and preserve UVs', async () => {
  const f = fixture(), d = f.image('triangle', 10, 10);
  await f.gpu.warmup(f.ctx, [d], { texts: [] });
  for (const points of [[[2, 2], [8, 2], [5, 8]], [[2, 2], [5, 8], [8, 2]]]) {
    const c = new f.Recorder(f.ctx);
    c.beginPath(); c.moveTo(...points[0]); c.lineTo(...points[1]); c.lineTo(...points[2]);
    c.closePath(); c.clip(); c.drawImage(d.image, 0, 0, 10, 10);
    assert.equal(f.gpu.render(c.commands, f.ctx), true);
    const mesh = f.state.pools.get('forward')[0].image;
    assert.equal(mesh.geometry.positions.length, 6);
    assert.equal(mesh.geometry.indices.length, 3);
    const rendered = [];
    for (let i = 0; i < 6; i += 2) {
      const x = mesh.geometry.positions[i], y = mesh.geometry.positions[i + 1];
      rendered.push([x, y]);
      assert(Math.abs(mesh.geometry.uvs[i] - x / 10) < 1e-6);
      assert(Math.abs(mesh.geometry.uvs[i + 1] - y / 10) < 1e-6);
    }
    assert.deepEqual(rendered.sort(), points.slice().sort());
    assert.equal(f.gpu.diagnostics().clipGroupsByKind.forward.meshClips, 1);
    assert.equal(f.gpu.diagnostics().clipGroupsByKind.forward.masks, 0);
  }
});

check('sheared image clips use all eight exact vertices then reset pooled quad indices', async () => {
  const f = fixture(), d = f.image('diamond', 10, 10);
  await f.gpu.warmup(f.ctx, [d], { texts: [] });
  const c = new f.Recorder(f.ctx);
  c.beginPath(); c.rect(2, 2, 6, 6); c.clip();
  c.setTransform(.5, .5, .5, -.5, 0, 5); c.drawImage(d.image, 0, 0, 10, 10);
  assert.equal(f.gpu.render(c.commands, f.ctx), true);
  const mesh = f.state.pools.get('forward')[0].image;
  assert.equal(mesh.geometry.positions.length, 16); assert.equal(mesh.geometry.indices.length, 18);
  const rendered = [];
  for (let i = 0; i < 16; i += 2) {
    const x = mesh.geometry.positions[i], y = mesh.geometry.positions[i + 1];
    rendered.push([x, y]);
    assert(Math.abs(mesh.geometry.uvs[i] - (x + y - 5) / 10) < 1e-6);
    assert(Math.abs(mesh.geometry.uvs[i + 1] - (x - y + 5) / 10) < 1e-6);
  }
  assert.deepEqual(rendered.sort(), [[2, 3], [3, 2], [7, 2], [8, 3], [8, 7], [7, 8], [3, 8], [2, 7]].sort());
  const plainScene = new f.Recorder(f.ctx); plainScene.drawImage(d.image, 0, 0, 10, 10);
  assert.equal(f.gpu.render(plainScene.commands, f.ctx), true);
  assert.equal(mesh.geometry.positions.length, 8); assert.equal(mesh.geometry.indices.length, 6);
});

check('empty image intersection contributes no stale visible mesh', async () => {
  const f = fixture(), d = f.image('empty', 10, 10);
  await f.gpu.warmup(f.ctx, [d], { texts: [] });
  const c = new f.Recorder(f.ctx); c.beginPath(); c.rect(20, 20, 2, 2); c.clip();
  c.drawImage(d.image, 0, 0, 10, 10);
  assert.equal(f.gpu.render(c.commands, f.ctx), true);
  assert.equal(f.state.pools.get('forward')[0].root.visible, false);
  assert.equal(f.gpu.diagnostics().clipGroupsByKind.forward.groups, 0);
});

check('complex and evenodd image clips retain their complete stencil chains', async () => {
  const f = fixture(), d = f.image('mask', 10, 10);
  await f.gpu.warmup(f.ctx, [d], { texts: [] });
  for (const shape of ['concave', 'compound', 'curve', 'evenodd']) {
    const c = new f.Recorder(f.ctx); c.beginPath();
    if (shape === 'concave') {
      c.moveTo(0, 0); c.lineTo(10, 0); c.lineTo(2, 2); c.lineTo(0, 10); c.closePath();
    } else if (shape === 'curve') c.arc(5, 5, 5, 0, Math.PI * 2);
    else { c.rect(0, 0, 10, 10); if (shape === 'compound') c.rect(2, 2, 5, 5); }
    c.clip(shape === 'evenodd' ? 'evenodd' : 'nonzero'); c.drawImage(d.image, 0, 0, 10, 10);
    assert.equal(f.gpu.render(c.commands, f.ctx), true);
    const diagnostics = f.gpu.diagnostics().clipGroupsByKind.forward;
    assert.equal(diagnostics.meshClips, 0); assert.equal(diagnostics.masks, 1);
    const group = f.state.clipGroups.get('forward')[0];
    assert.equal(group.clips[0].container.mask, group.clips[0].graphics);
    assert(group.clips[0].graphics.ops.some(operation => operation[0] === 'fill'));
  }
});

check('adjacent shared clips retain one group and stable redraws do not reparent or toggle children', async () => {
  const f = fixture(), d = f.image('retained', 10, 10);
  await f.gpu.warmup(f.ctx, [d], { texts: [] });
  function scene(count) {
    const c = new f.Recorder(f.ctx); c.beginPath(); c.arc(5, 5, 5, 0, Math.PI * 2); c.clip();
    for (let i = 0; i < count; i++) c.drawImage(d.image, i, 0, 10, 10);
    return c.commands;
  }
  assert.equal(f.gpu.render(scene(4), f.ctx), true);
  const before = { ...f.stats }, stage = f.state.sceneStages.get('forward');
  assert.equal(f.gpu.render(scene(4), f.ctx), true);
  assert.deepEqual(f.stats, before);
  assert.equal(f.state.sceneStages.get('forward'), stage);
  assert.equal(f.gpu.diagnostics().clipGroupsByKind.forward.groups, 1);
  assert.equal(f.gpu.diagnostics().clipGroupsByKind.forward.masks, 1);
  assert.equal(f.gpu.render(scene(2), f.ctx), true);
  assert.equal(f.state.pools.get('forward')[0].root.visible, true);
  assert.equal(f.state.pools.get('forward')[1].root.visible, true);
  assert.equal(f.state.pools.get('forward')[2].root.visible, false);
  assert.equal(f.state.pools.get('forward')[3].root.visible, false);
});

check('rear target preparation stays outside draw and retains separate forward and rear stages', async () => {
  const f = fixture(), d = f.image('views', 10, 10), viewport = { x: 626, y: 0, width: 714, height: 141 };
  await f.gpu.warmup(f.ctx, [d], { texts: [] });
  const c = new f.Recorder(f.ctx); c.drawImage(d.image, 0, 0, 10, 10);
  assert.equal(f.gpu.render(c.commands, f.ctx), true);
  const forward = f.state.sceneStages.get('forward'), uploaded = f.uploads.length;
  assert.equal(f.gpu.render(c.commands, f.ctx, { kind: 'rear', viewport }), false);
  assert.equal(f.uploads.length, uploaded);
  assert.equal(f.state.rearTarget, null);
  f.gpu.prepare(f.ctx);
  assert.equal(f.state.rearTarget.source.width, 714); assert.equal(f.state.rearTarget.source.height, 141);
  assert.equal(f.gpu.render(c.commands, f.ctx, { kind: 'rear', viewport }), true);
  assert.notEqual(f.state.sceneStages.get('rear'), forward);
  assert.equal(f.state.pools.get('forward')[0].root.visible, true);
  const draw = f.renders.at(-2);
  assert.equal(draw.target, f.state.rearTarget); assert.equal(draw.transform.e, -626);
  assert(draw.transform.f === 0);
  assert.deepEqual(f.ctx.draws.at(-1).args.slice(1), [626, 0, 714, 141, 626, 0, 714, 141]);
  assert(f.gpu.diagnostics().residentTexels <= f.gpu.diagnostics().residentBudgetTexels);
});

check('parking glyph size changes reuse one white texture and later images reset pooled tint', async () => {
  const f = fixture(), d = f.image('after-glyph', 10, 10);
  await f.gpu.warmup(f.ctx, [d]);
  const c = new f.Recorder(f.ctx); c.fillStyle = '#ff0000'; c.font = 'bold 7px Oxanium';
  c.fillText('P', 0, 0); c.font = 'bold 31px Oxanium'; c.fillText('P', 50, 50);
  const uploads = f.uploads.length;
  assert.equal(f.gpu.render(c.commands, f.ctx), true); assert.equal(f.uploads.length, uploads);
  assert.equal(f.state.text.size, 1);
  const pool = f.state.pools.get('forward');
  const width = mesh => Math.abs(mesh.geometry.positions[2] - mesh.geometry.positions[0]);
  assert(Math.abs(width(pool[1].image) / width(pool[0].image) - 31 / 7) < 1e-5);
  assert.equal(pool[0].image.tint, 0xff0000);
  const next = new f.Recorder(f.ctx); next.drawImage(d.image, 0, 0, 10, 10);
  assert.equal(f.gpu.render(next.commands, f.ctx), true);
  assert.equal(pool[0].image.tint, 0xffffff); assert.equal(f.state.text.size, 1);
});

check('missing GPU source makes no draw-time upload and native replay paints the original operations', async () => {
  const f = fixture(), d = f.image('missing', 10, 10);
  await f.gpu.warmup(f.ctx, [], { texts: [] });
  f.ctx.save(); const c = new f.Recorder(f.ctx);
  c.fillStyle = '#abcdef'; c.fillRect(1, 2, 3, 4); c.save(); c.translate(20, 30);
  c.drawImage(d.image, 0, 0, 10, 10); c.restore();
  const uploads = f.uploads.length, renders = f.renders.length;
  assert.equal(f.gpu.render(c.commands, f.ctx), false);
  assert.equal(f.uploads.length, uploads); assert.equal(f.renders.length, renders);
  assert.equal(f.gpu.diagnostics().fallback, 'preparing-visible-sources');
  c.replay(f.ctx);
  const image = f.ctx.draws.find(draw => draw.method === 'drawImage');
  assert.equal(image.args[0], d.image); assert.equal(image.m.e, 20); assert.equal(image.m.f, 30);
  assert.equal(f.ctx.draws.find(draw => draw.method === 'fillRect').fillStyle, '#abcdef');
  assert.equal(f.ctx.stack.length, 1);
  f.gpu.prepare(f.ctx, [d]);
  assert.equal(f.gpu.render(c.commands, f.ctx), true);
  assert.equal(f.ctx.stack.length, 1); f.ctx.restore();
});

check('unsupported state rejects the complete GPU scene and preserves native shadow/filter replay', async () => {
  const f = fixture(); await f.gpu.warmup(f.ctx, [], { texts: [] });
  const c = new f.Recorder(f.ctx); c.shadowColor = '#ff0000'; c.shadowBlur = 4;
  c.filter = 'blur(2px)'; c.fillRect(1, 2, 3, 4);
  assert.equal(f.gpu.render(c.commands, f.ctx), false); assert.equal(f.renders.length, 0);
  c.replay(f.ctx); assert.equal(f.ctx.shadowColor, '#ff0000'); assert.equal(f.ctx.shadowBlur, 4);
  assert.equal(f.ctx.filter, 'blur(2px)'); assert.equal(f.ctx.draws.at(-1).method, 'fillRect');
});

check('context restoration uploads in prepare and regenerates pooled glyphs before rendering resumes', async () => {
  const f = fixture(), d = f.image('recovery', 10, 10); await f.gpu.warmup(f.ctx, [d]);
  const c = new f.Recorder(f.ctx); c.drawImage(d.image, 0, 0, 10, 10);
  c.font = 'bold 18px Oxanium'; c.fillText('P', 10, 20);
  assert.equal(f.gpu.render(c.commands, f.ctx), true);
  f.state.canvas.listeners.webglcontextlost();
  assert.equal(f.gpu.diagnostics().status, 'lost'); assert.equal(f.gpu.begin(f.ctx), null);
  assert.equal(f.gpu.render(c.commands, f.ctx), false); c.replay(f.ctx);
  assert(f.ctx.draws.some(draw => draw.method === 'drawImage' && draw.args[0] === d.image));
  const uploaded = f.uploads.length;
  f.state.canvas.listeners.webglcontextrestored();
  assert.equal(f.uploads.length, uploaded); assert.equal(f.gpu.diagnostics().status, 'restoring');
  f.gpu.prepare(f.ctx, [d]); assert(f.uploads.length > uploaded);
  assert.equal(f.gpu.diagnostics().status, 'ready'); assert.equal(f.state.text.size, 0);
  assert.equal(f.gpu.render(c.commands, f.ctx), false);
  f.gpu.prepare(f.ctx, [d]); assert.equal(f.gpu.render(c.commands, f.ctx), true);
  assert.equal(f.state.text.size, 1);
  assert.equal(f.P.Ticker.shared.started, false); assert.equal(f.P.Ticker.system.started, false);
  assert.equal(f.ctx.stack.length, 0);
});

// These contracts exercise actual scene recording, retained stages and the
// public layer API. The DOM fixture models ownership only, never pixels.
function enableLayer(f) {
  const children = [f.ctx.canvas], classes = new Set();
  const parent = {
    children,
    removeChild(child) { const index = children.indexOf(child); if (index >= 0) children.splice(index, 1); child.parentNode = null; },
    insertBefore(child, before) { child.parentNode?.removeChild(child); children.splice(children.indexOf(before), 0, child); child.parentNode = this; }
  };
  Object.assign(f.ctx.canvas, { id: 'gameCanvas', parentNode: parent,
    style: { background: '#123456', backgroundColor: '#123456', zIndex: '4' },
    classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) } });
  f.window.renderer = { ctx: f.ctx };
  f.elements.set('gameCanvas', f.ctx.canvas); f.elements.set('standalone-viewport-style', {});
  return { parent, classes };
}
const directRearViewport = { x: 626, y: 0, width: 714, height: 141 };
function directScenes(f, image) {
  const forward = new f.Recorder(f.ctx), rear = new f.Recorder(f.ctx), glass = new f.Recorder(f.ctx);
  forward.drawImage(image, 0, 0, 1920, 1080);
  rear.drawImage(image, 626, 0, 714, 141);
  glass.beginPath(); glass.moveTo(638, 12); glass.lineTo(1328, 12);
  glass.quadraticCurveTo(1310, 80, 1300, 129); glass.lineTo(660, 129);
  glass.quadraticCurveTo(650, 80, 638, 12); glass.closePath(); glass.clip(); glass.fillRect(626, 0, 714, 141);
  return { forward: forward.commands, rear: rear.commands, clip: glass.commands[0].clips[0] };
}

check('direct presentation requires the standalone marker and exact game canvas', async () => {
  const f = fixture(), d = f.image('layer-owner'); await f.gpu.warmup(f.ctx, [d], { texts: [] });
  assert.equal(f.gpu.beginFrame(f.ctx), false);
  const host = enableLayer(f), other = native();
  assert.equal(f.gpu.beginFrame(other), false);
  f.elements.delete('standalone-viewport-style'); assert.equal(f.gpu.beginFrame(f.ctx), false);
  f.elements.set('standalone-viewport-style', {}); assert.equal(f.gpu.beginFrame(f.ctx), true);
  assert.deepEqual(host.parent.children, [f.state.canvas, f.ctx.canvas]);
  assert.equal(f.state.canvas.id, 'cacheRoadGpuCanvas'); assert.equal(f.state.canvas.style.pointerEvents, 'none');
  assert.equal(f.state.canvas.attributes['aria-hidden'], 'true');
  assert.equal(f.gpu.directFrameActive(), true);
});

check('forward and mirror queue without interop and present one final screen with bounded Gaussian targets', async () => {
  const f = fixture(), d = f.image('direct-views'); const host = enableLayer(f);
  await f.gpu.warmup(f.ctx, [d], { texts: [], rearViewport: directRearViewport });
  const scene = directScenes(f, d.image), initialTargets = f.state.targetTexels,
    uploaded = f.uploads.length, original = f.ctx.getTransform();
  f.ctx.save(); f.ctx.translate(5, 6);
  assert.equal(f.gpu.beginFrame(f.ctx), true);
  assert.equal(f.gpu.render(scene.forward, f.ctx, { defer: true }), true);
  assert.equal(f.gpu.render(scene.rear, f.ctx, { kind: 'rear', direct: true, viewport: directRearViewport, glassClip: scene.clip }), true);
  assert.equal(f.renders.length, 0); assert.equal(f.uploads.length, uploaded);
  assert.equal(f.ctx.draws.filter(draw => draw.method === 'clearRect').length, 1);
  assert.equal(f.ctx.draws.filter(draw => draw.method === 'drawImage').length, 0);
  assert.equal(f.ctx.stack.length, 1); f.ctx.restore(); assert.deepEqual(f.ctx.getTransform(), original);
  assert.equal(f.gpu.present(f.ctx), true); assert.equal(f.renders.length, 3);
  assert.equal(f.renders[0].target, f.state.rearTarget);
  assert.equal(f.renders[0].transform.e, -626);
  assert.equal(f.renders[1].target, f.state.rearBlurTarget);
  assert.equal(f.renders[2].container, f.state.finalStage); assert.equal(f.renders[2].target, undefined);
  assert.equal(f.state.rearBlurTarget.source.antialias, false);
  assert.equal(initialTargets, 1920 * 1080 + 714 * 141 * 2);
  assert.equal(f.state.renderer.options.antialias, false);
  assert.equal(f.state.renderer.options.useContextAlpha, false);
  assert.equal(f.state.renderer.options.backgroundAlpha, 1);
  assert.equal(f.state.rearTarget.source.antialias, false);
  assert.equal(f.gpu.diagnostics().antialias, false); assert.equal(f.gpu.diagnostics().targetSamples, 1);
  assert.deepEqual(Array.from(f.state.rearBlurMesh.shader.resources.blurUniforms.uniforms.uStep), [Math.fround(1 / 714), 0]);
  assert.deepEqual(Array.from(f.state.rearDisplayMesh.shader.resources.blurUniforms.uniforms.uStep), [0, Math.fround(1 / 141)]);
  assert.equal(f.state.rearBlurMesh.shader.resources.uTexture, f.state.rearTarget.source);
  assert.equal(f.state.rearDisplayMesh.shader.resources.uTexture, f.state.rearBlurTarget.source);
  assert.deepEqual(plain(f.state.rearGlass.clips[0].graphics.ops.find(op => op[0] === 'poly')[1][0]), plain(scene.clip.paths[0].points));
  assert.equal(f.state.layerVisible, true); assert(host.classes.has('cache-road-gpu-active'));
  assert.equal(f.gpu.diagnostics().directFrames, 1);
  assert.deepEqual(plain(f.gpu.diagnostics().copiesByKind), { forward: 0, rear: 0 });
  assert.equal(f.gpu.present(f.ctx), true); assert.equal(f.renders.length, 3);
});

check('any rejected direct view discards the frame and forced native drawing preserves original replay', async () => {
  const f = fixture(), d = f.image('fallback-owner'); enableLayer(f);
  await f.gpu.warmup(f.ctx, [d], { texts: [], rearViewport: directRearViewport });
  const scene = directScenes(f, d.image); assert.equal(f.gpu.beginFrame(f.ctx), true);
  assert.equal(f.gpu.render(scene.forward, f.ctx, { defer: true }), true);
  assert.equal(f.gpu.render(scene.rear, f.ctx, { kind: 'rear', direct: true, viewport: directRearViewport }), false);
  assert.equal(f.gpu.present(f.ctx), false); assert.equal(f.renders.length, 0); assert.equal(f.state.layerVisible, false);
  const recorder = new f.Recorder(f.ctx); recorder.drawImage(d.image, 0, 0, 1920, 1080);
  f.gpu.withNativeFallback(() => {
    assert.equal(f.gpu.beginFrame(f.ctx), false); assert.equal(f.gpu.begin(f.ctx), null);
    recorder.replay(f.ctx);
  });
  assert.equal(f.ctx.draws.at(-1).args[0], d.image); assert.equal(f.state.nativeFallbackDepth, 0);
  assert.throws(() => f.gpu.withNativeFallback(() => { throw Error('native-owner-error'); }), /native-owner-error/);
  assert.equal(f.state.nativeFallbackDepth, 0); assert.equal(f.gpu.beginFrame(f.ctx), true);
  assert.equal(f.gpu.render(scene.forward, f.ctx, { defer: true }), true);
  f.state.renderer.render = () => { throw Error('lost-during-present'); };
  assert.equal(f.gpu.present(f.ctx), false); assert.equal(f.state.layerVisible, false);
  assert.equal(f.state.pendingForward, null); assert.equal(f.gpu.diagnostics().fallback, 'direct-present-error');
});

check('registered cinematic HUD context records logical alpha and composites its rear fade once', async () => {
  const f = fixture(); enableLayer(f); const road = roadSceneApi(f), d = f.image('hud-fade');
  await f.gpu.warmup(f.ctx, [d], { texts: [], rearViewport: directRearViewport });
  f.ctx.save(); const before = f.ctx.getTransform(), savedAlpha = f.ctx.globalAlpha;
  const hud = road.cinematics.withHUDAlpha(f.ctx, .5); hud.globalAlpha = 1;
  const info = road.cinematics.hudContextInfo(hud);
  assert.equal(info.frameContext, f.ctx); assert.equal(info.opacity, .5); assert(Object.isFrozen(info));
  assert.equal(road.cinematics.hudContextInfo(new Proxy(f.ctx, {})), null);
  assert.equal(road.beginGpuScene(new Proxy(f.ctx, {}), {}), null);
  const scene = directScenes(f, d.image); assert.equal(f.gpu.beginFrame(f.ctx), true);
  assert.equal(f.gpu.render(scene.forward, f.ctx, { defer: true }), true);
  const options = { kind: 'rear', direct: true, viewport: directRearViewport, glassClip: scene.clip };
  const recorder = road.beginGpuScene(hud, options); assert(recorder);
  assert.equal(recorder.globalAlpha, 1); assert.equal(options.opacity, .5);
  recorder.drawImage(d.image, 626, 0, 714, 141);
  recorder.save(); recorder.globalAlpha *= .8; recorder.fillStyle = '#123456'; recorder.fillRect(638, 12, 20, 20); recorder.restore();
  assert.deepEqual(Array.from(recorder.commands, command => command.alpha), [1, .8]);
  assert.equal(road.finishGpuScene(recorder, hud, options), true);
  assert.equal(hud.globalAlpha, 1); assert.equal(f.ctx.globalAlpha, .5);
  assert.equal(f.state.pendingRear.opacity, .5);
  assert.equal(f.gpu.present(f.ctx), true);
  assert.equal(f.state.rearDisplayMesh.shader.resources.blurUniforms.uniforms.uAlpha, .5);
  assert.equal(f.state.rearBlurMesh.shader.resources.blurUniforms.uniforms.uAlpha, 1);
  assert(f.state.blurProgram.fragment.includes('gl_FragColor=color*uAlpha;'));
  assert.equal(f.ctx.draws.filter(draw => draw.method === 'drawImage').length, 0);
  assert.equal(f.renders.filter(render => !render.target).length, 1);
  assert.deepEqual(plain(f.gpu.diagnostics().copiesByKind), { forward: 0, rear: 0 });
  f.ctx.restore(); assert.equal(f.ctx.globalAlpha, savedAlpha); assert.deepEqual(f.ctx.getTransform(), before);
  assert.equal(f.ctx.stack.length, 0);
  assert.equal(f.gpu.beginFrame(f.ctx), true);
  assert.equal(f.gpu.render(scene.forward, f.ctx, { defer: true }), true);
  const normalOptions = { kind: 'rear', direct: true, viewport: directRearViewport, glassClip: scene.clip };
  const normal = road.beginGpuScene(f.ctx, normalOptions); normal.drawImage(d.image, 626, 0, 714, 141);
  assert.equal(normalOptions.opacity, 1); assert.equal(road.finishGpuScene(normal, f.ctx, normalOptions), true);
  assert.equal(f.gpu.present(f.ctx), true);
  assert.equal(f.state.rearDisplayMesh.shader.resources.blurUniforms.uniforms.uAlpha, 1);
});

check('actual fading rearview uses GPU reflection while the original face and label retain native fade', async () => {
  const f = fixture(); enableLayer(f); const road = roadSceneApi(f), sources = levelSourceDescriptors();
  const byKey = new Map(sources.map(source => [source.key, source.image]));
  // Cache's face remains a native HUD asset, outside the GPU scenery key set.
  byKey.set('cacheMirror', f.image('native-mirror-face', 2700, 335).image);
  f.window.HTMLCanvasElement = function Canvas() {};
  Object.setPrototypeOf(f.ctx.canvas, f.window.HTMLCanvasElement.prototype);
  f.window.BARCODE.PresentationAssets = { draw(key, ctx, args) {
    const image = byKey.get(key); assert(image, 'actual rear scene source is included in level warmup: ' + key);
    if (args.sourceRect) ctx.drawImage(image, ...args.sourceRect, args.x, args.y, args.width, args.height);
    else ctx.drawImage(image, args.x, args.y, args.width, args.height);
    return true;
  } };
  await f.gpu.warmup(f.ctx, sources, { texts: [], rearViewport: directRearViewport });
  const scene = directScenes(f, sources[0].image);
  f.ctx.save(); const original = f.ctx.getTransform(), savedAlpha = f.ctx.globalAlpha;
  assert.equal(f.gpu.beginFrame(f.ctx), true);
  assert.equal(f.gpu.render(scene.forward, f.ctx, { defer: true }), true);
  const hud = road.cinematics.withHUDAlpha(f.ctx, .5); hud.globalAlpha = 1;
  road.drawRearview(hud, road.newState(), '#8fe3db', true);
  assert.equal(f.state.frameFailed, false); assert.equal(f.state.pendingRear.opacity, .5);
  assert.equal(f.gpu.present(f.ctx), true);
  assert.equal(f.state.rearDisplayMesh.shader.resources.blurUniforms.uniforms.uAlpha, .5);
  const draws = f.ctx.draws.filter(draw => draw.method === 'drawImage');
  assert.equal(draws.length, 1, 'only the original native mirror face is painted on Canvas');
  assert.equal(draws[0].args[0], byKey.get('cacheMirror')); assert.equal(draws[0].alpha, .5);
  const label = f.ctx.draws.find(draw => draw.method === 'fillText' && draw.args[0] === 'REAR VIEW');
  assert.equal(label.alpha, .5); assert.equal(f.ctx.stack.length, 1);
  assert.equal(f.ctx.draws.filter(draw => draw.method === 'clearRect').length, 2);
  assert.deepEqual(plain(f.gpu.diagnostics().copiesByKind), { forward: 0, rear: 0 });
  f.ctx.restore(); assert.equal(f.ctx.globalAlpha, savedAlpha); assert.deepEqual(f.ctx.getTransform(), original);
  assert.equal(f.ctx.stack.length, 0);
});

check('failed cinematic GPU submission replays the same faded alpha and invalidates direct presentation', async () => {
  const f = fixture(); enableLayer(f); const road = roadSceneApi(f), d = f.image('fade-fallback');
  await f.gpu.warmup(f.ctx, [d], { texts: [], rearViewport: directRearViewport });
  const scene = directScenes(f, d.image); f.ctx.save(); const originalAlpha = f.ctx.globalAlpha;
  const hud = road.cinematics.withHUDAlpha(f.ctx, .5); hud.globalAlpha = 1;
  assert.equal(f.gpu.beginFrame(f.ctx), true); assert.equal(f.gpu.render(scene.forward, f.ctx, { defer: true }), true);
  const recorder = road.beginGpuScene(hud, { kind: 'rear', direct: true });
  recorder.drawImage(d.image, 626, 0, 714, 141);
  recorder.save(); recorder.globalAlpha *= .8; recorder.fillRect(638, 12, 20, 20); recorder.restore();
  assert.equal(road.finishGpuScene(recorder, hud, { kind: 'rear', direct: true }), false);
  assert.equal(f.ctx.draws.find(draw => draw.method === 'drawImage').alpha, .5);
  assert.equal(f.ctx.draws.find(draw => draw.method === 'fillRect').alpha, .4);
  assert.equal(hud.globalAlpha, 1); assert.equal(f.ctx.stack.length, 1);
  assert.equal(f.gpu.present(f.ctx), false); assert.equal(f.renders.length, 0);
  f.gpu.withNativeFallback(() => {
    assert.equal(road.beginGpuScene(hud, { kind: 'rear', direct: true }), null);
    recorder.replay(hud);
  });
  assert.equal(f.ctx.draws.filter(draw => draw.method === 'drawImage').at(-1).alpha, .5);
  assert.equal(f.ctx.globalAlpha, .5); assert.equal(f.state.nativeFallbackDepth, 0);
  f.ctx.restore(); assert.equal(f.ctx.globalAlpha, originalAlpha); assert.equal(f.ctx.stack.length, 0);
  assert.equal(f.gpu.beginFrame(f.ctx), true); assert.equal(f.gpu.render(scene.forward, f.ctx, { defer: true }), true);
  assert.equal(road.beginGpuScene(new Proxy(f.ctx, {}), { kind: 'rear', direct: true }), null);
  assert.equal(f.gpu.present(f.ctx), false); assert.equal(f.state.layerVisible, false);
});

check('pause snapshot composites both layers and hide/context loss restore styles without stale presentation', async () => {
  const f = fixture(), d = f.image('pause-layers'); const host = enableLayer(f);
  await f.gpu.warmup(f.ctx, [d], { texts: [] }); const scene = directScenes(f, d.image);
  f.gpu.beginFrame(f.ctx); f.gpu.render(scene.forward, f.ctx, { defer: true }); f.gpu.present(f.ctx);
  const snapshot = native(), initial = snapshot.globalAlpha;
  assert.equal(f.gpu.snapshotTo(snapshot, f.ctx.canvas), true);
  assert.deepEqual(snapshot.draws.map(draw => draw.args[0]), [f.state.canvas, f.ctx.canvas]);
  assert.equal(snapshot.stack.length, 0); assert.equal(snapshot.globalAlpha, initial);
  f.gpu.hide(); assert.equal(f.ctx.canvas.style.background, '#123456'); assert.equal(f.ctx.canvas.style.zIndex, '4');
  assert.equal(host.classes.has('cache-road-gpu-active'), false); assert.equal(f.gpu.snapshotTo(snapshot, f.ctx.canvas), false);
  f.gpu.beginFrame(f.ctx); f.gpu.render(scene.forward, f.ctx, { defer: true });
  f.state.canvas.listeners.webglcontextlost(); assert.equal(f.gpu.present(f.ctx), false);
  assert.equal(f.state.canvas.style.display, 'none'); assert.equal(f.state.layerVisible, false);
  f.gpu.destroy(); assert.deepEqual(host.parent.children, [f.ctx.canvas]);
  assert.equal(f.ctx.canvas.style.backgroundColor, '#123456');
});

check('explicit GPU collection belongs to guarded loading and active prepare never collects', async () => {
  const f = fixture(), d = f.image('collection-owner'); let collections = 0;
  // Initialization is still the actual public warmup path; the fixture only
  // records collection ownership after the renderer has been constructed.
  const first = f.gpu.warmup(f.ctx, [d], { texts: [] });
  f.state.renderer.gc.run = () => collections++;
  assert.equal((await first).ready, true); assert.equal(collections, 1);
  f.window.performance.now = () => 1000000;
  for (let i = 0; i < 4; i++) f.gpu.prepare(f.ctx, [d]);
  assert.equal(collections, 1);
  let finishDecode, cancelled = false;
  const late = f.image('cancelled-collection', 32, 32, () => new Promise(resolve => { finishDecode = resolve; }));
  const handoff = f.gpu.warmup(f.ctx, [late], { texts: [], cancelled: () => cancelled }); await settle();
  cancelled = true; finishDecode(); assert.equal((await handoff).reason, 'warmup-cancelled');
  assert.equal(collections, 1);
  assert.equal((await f.gpu.warmup(f.ctx, [d], { texts: [] })).ready, true);
  assert.equal(collections, 2); assert.equal(f.gpu.diagnostics().automaticGC, false);
});

check('warmup cancellation after initialization or delayed decode cannot upload or overwrite a newer route', async () => {
  const f = fixture(), first = f.image('cancelled-init'); let cancelled = false;
  const initializing = f.gpu.warmup(f.ctx, [first], { texts: [], cancelled: () => cancelled });
  cancelled = true; const initial = await initializing;
  assert.equal(initial.reason, 'warmup-cancelled'); assert.equal(f.uploads.length, 0); assert.equal(f.state.warmupResult, null);
  let resolveOld; const old = f.image('old-delayed', 32, 32, () => new Promise(resolve => { resolveOld = resolve; }));
  const older = f.gpu.warmup(f.ctx, [old], { texts: [] }); await settle();
  const current = f.image('current-route'); const newer = await f.gpu.warmup(f.ctx, [current], { texts: [] });
  assert.equal(newer.ready, true); const uploaded = f.uploads.length, report = f.state.warmupResult;
  resolveOld(); const obsolete = await older;
  assert.equal(obsolete.reason, 'warmup-cancelled'); assert.equal(f.uploads.length, uploaded);
  assert.equal(f.state.sources.has(old.image), false); assert.equal(f.state.warmupResult, report);
  assert.deepEqual([...f.state.demands.get('warmup').images], [current.image]);
  let resolveFont, cancelFont = false;
  f.document.fonts.load = () => new Promise(resolve => { resolveFont = resolve; });
  const fontWarmup = f.gpu.warmup(f.ctx, [old], { cancelled: () => cancelFont }); await settle();
  cancelFont = true; resolveFont(); const cancelledFont = await fontWarmup;
  assert.equal(cancelledFont.reason, 'warmup-cancelled'); assert.equal(f.uploads.length, uploaded);
});

check('level exit releases every source reference, cancels late warmup and supports a later visit', async () => {
  const f=fixture(), original=f.image('first-level-visit');
  await f.gpu.warmup(f.ctx,[original],{texts:[]});
  const renderer=f.state.renderer, canvas=f.state.canvas;
  const texture=f.state.sources.get(original.image).texture;
  let finishDecode;
  const pending=f.image('exit-during-decode',32,32,()=>new Promise(resolve=>{finishDecode=resolve;}));
  const oldWarmup=f.gpu.warmup(f.ctx,[pending],{texts:[]}); await settle();
  f.gpu.releaseLevel();
  assert.equal(texture.destroyed,true);
  assert.equal(f.gpu.diagnostics().residentSources,0);
  assert.equal(f.gpu.diagnostics().sourceMipTexels,0);
  for(const key of ['sources','text','pendingSources','pendingText','demands','sourceInfo','decodes','optionalSources'])
    assert.equal(f.state[key].size,0,key+' must not retain level art');
  const uploads=f.uploads.length;
  finishDecode(); assert.equal((await oldWarmup).reason,'warmup-cancelled');
  assert.equal(f.uploads.length,uploads);
  f.gpu.releaseLevel(); assert.equal(f.gpu.diagnostics().sourceMipTexels,0);
  const next=f.image('second-level-visit');
  assert.equal((await f.gpu.warmup(f.ctx,[next],{texts:[]})).ready,true);
  assert.equal(f.state.renderer,renderer); assert.equal(f.state.canvas,canvas);
  assert.deepEqual([...f.state.sources.keys()],[next.image]);
});

check('compressed warmup keeps original identity and dimensions while skipping original decode',async()=>{
  const f=fixture(),ds=[f.image('padded',35,17,()=>Promise.resolve()),f.image('aligned',32,32,()=>Promise.resolve())];
  const bank=compressedBank(f,ds),result=await f.gpu.warmup(f.ctx,ds,{texts:[]});
  assert.equal(result.ready,true);assert.equal(bank.workers.length,1);assert.equal(bank.workers[0].terminated,true);
  assert.equal(f.decodes.length,0);assert.equal(bank.bank.diagnostics().workerActive,false);
  assert.equal(bank.bank.diagnostics().pendingJobs,0);assert(bank.files.every(file=>file.closed&&file.deleted));
  for(const d of ds){
    const entry=f.state.sources.get(d.image),source=entry.texture.source;
    assert.equal(entry.width,d.image.naturalWidth);assert.equal(entry.height,d.image.naturalHeight);
    assert.equal(source.uploadMethodId,'compressed');assert.equal(source.format,'bc7-rgba-unorm');
    assert.equal(source.alphaMode,'premultiplied-alpha');assert.equal(source.autoGenerateMipmaps,false);
    assert.equal(source.mipLevelCount,source.resource.length);assert.equal(source.autoGarbageCollect,false);
  }
  const entry=f.state.sources.get(ds[0].image);
  assert.equal(entry.textureWidth,36);assert.equal(entry.textureHeight,20);
  const quad=f.internals.imageQuad({source:[30,10,10,10],dest:[1,2,100,100]},entry);
  assert.deepEqual(plain(quad.positions),[1,2,51,2,51,72,1,72]);
  assert.deepEqual(plain(quad.uvs),[30/36,10/20,35/36,10/20,35/36,17/20,30/36,17/20]);
  assert(bank.loads.every(url=>url.startsWith('https://game.invalid/src/vendor/basis-2.50/')));
  const diagnostic=f.gpu.diagnostics();assert.equal(diagnostic.compressedSources,2);assert.equal(diagnostic.originalFallbackSources,0);
  assert.equal(diagnostic.sourceFormats['bc7-rgba-unorm'],2);
  assert.equal(diagnostic.sourceStorageBytes,[...f.state.sources.values()].reduce((n,e)=>n+e.storageBytes,0));
  const uploads=f.uploads.length;for(let n=0;n<3;n++)f.gpu.prepare(f.ctx,ds);
  assert.equal(f.uploads.length,uploads);assert.equal(f.decodes.length,0);assert.equal(bank.workers.length,1);
  await f.gpu.warmup(f.ctx,ds,{texts:[]});assert.equal(bank.workers.length,1);assert.equal(f.decodes.length,0);
});

check('unsupported compression and invalid manifest preserve complete original preparation',async()=>{
  for(const options of [{unsupported:true},{manifestFailure:true},{manifest:{version:999}}]){
    const f=fixture(),d=f.image('original-fallback',32,32,()=>Promise.resolve()),bank=compressedBank(f,[d],options);
    assert.equal((await f.gpu.warmup(f.ctx,[d],{texts:[]})).ready,true);
    assert.equal(f.state.sources.get(d.image).texture.source.resource,d.image);
    assert.equal(f.gpu.diagnostics().compressedSources,0);assert.equal(f.gpu.diagnostics().originalFallbackSources,1);
    assert.deepEqual(f.decodes,['original-fallback']);assert.equal(bank.workers.length,0);
  }
});

check('listed tiny SVG originals preserve browser rasterization and do not count as compressed failures',async()=>{
  const f=fixture(),ds=[f.image('compressed-art',32,32,()=>Promise.resolve()),f.image('svg-art',80,160,()=>Promise.resolve())];
  ds[1].path='assets/cache-road/hud/original.svg';
  const bank=compressedBank(f,ds),entry=bank.manifest.entries['svg-art'];
  Object.assign(entry,{kind:'original',path:ds[1].path,width:80,height:160});
  assert.equal((await f.gpu.warmup(f.ctx,ds,{texts:[]})).ready,true);
  assert.equal(f.state.sources.size,2);assert.equal(bank.requests.length,1);assert.deepEqual(f.decodes,['svg-art']);
  assert.equal(f.state.sources.get(ds[1].image).texture.source.resource,ds[1].image);
  const data=f.gpu.diagnostics();assert.equal(data.compressedSources,1);assert.equal(data.expectedOriginalSources,1);
  assert.equal(data.originalFallbackSources,0);assert.equal(data.compressedFallbackSources,0);
  assert.deepEqual(plain(data.textureBank.lastResult.expectedOriginal),['svg-art']);
});

check('partial decoder failures close native files and fall back only those original sources',async()=>{
  const f=fixture(),ds=[f.image('good',32,32,()=>Promise.resolve()),f.image('failed',32,32,()=>Promise.resolve())],
    bank=compressedBank(f,ds,{transcodeFailure:key=>key==='failed'});
  const result=await f.gpu.warmup(f.ctx,ds,{texts:[]});assert.equal(result.ready,true);
  assert.equal(f.gpu.diagnostics().compressedSources,1);assert.deepEqual(f.decodes,['failed']);
  assert.equal(f.state.sources.get(ds[1].image).texture.source.resource,ds[1].image);
  assert(bank.files.every(file=>file.closed&&file.deleted));assert.equal(bank.workers[0].terminated,true);
  assert.deepEqual(plain(result.textureBank.failed),['failed']);
});

check('compressed sources with straight alpha or sRGB never replace native UNORM art',async()=>{
  for(const options of [{straightAlpha:true},{srgb:true}]){
    const f=fixture(),d=f.image('invalid-color-contract',32,32,()=>Promise.resolve()),bank=compressedBank(f,[d],options);
    assert.equal((await f.gpu.warmup(f.ctx,[d],{texts:[]})).ready,true);
    assert.equal(f.gpu.diagnostics().compressedSources,0);assert.deepEqual(f.decodes,['invalid-color-contract']);
    assert(bank.files.every(file=>file.closed&&file.deleted));assert.equal(bank.workers[0].terminated,true);
  }
});

check('worker failure cannot leave queued loads pending or prevent original fallback',async()=>{
  const f=fixture(),ds=[f.image('worker-failed-1',32,32,()=>Promise.resolve()),f.image('worker-failed-2',32,32,()=>Promise.resolve())],
    bank=compressedBank(f,ds,{workerError:true});
  assert.equal((await f.gpu.warmup(f.ctx,ds,{texts:[]})).ready,true);
  assert.equal(bank.workers[0].terminated,true);assert.equal(bank.bank.diagnostics().pendingJobs,0);
  assert.deepEqual(f.decodes,ds.map(d=>d.key));assert.equal(f.gpu.diagnostics().compressedSources,0);
});

check('compressed GL upload failure decodes the original before completing fallback upload',async()=>{
  const f=fixture(),d=f.image('upload-fallback',32,32,()=>Promise.resolve());compressedBank(f,[d]);
  await f.gpu.warmup(f.ctx,[],{texts:[]});
  const upload=f.state.renderer.texture.initSource;
  f.state.renderer.texture.initSource=source=>{if(source.uploadMethodId==='compressed')throw Error('compressed GL rejected');upload(source);};
  assert.equal((await f.gpu.warmup(f.ctx,[d],{texts:[]})).ready,true);
  assert.deepEqual(f.decodes,['upload-fallback']);assert.equal(f.state.sources.get(d.image).texture.source.resource,d.image);
});

check('level exit cancels the decoder immediately and late replies cannot resurrect sources',async()=>{
  const f=fixture(),d=f.image('cancelled-compressed',32,32,()=>Promise.resolve());let finish;
  const gate=new Promise(resolve=>{finish=resolve;});const bank=compressedBank(f,[d],{textureGate:()=>gate});
  const handoff=f.gpu.warmup(f.ctx,[d],{texts:[]});
  for(let n=0;n<8&&bank.requests.length===0;n++)await settle();assert.equal(bank.requests.length,1);
  f.gpu.releaseLevel();assert.equal(bank.workers[0].terminated,true);assert.equal(bank.bank.diagnostics().pendingJobs,0);
  assert.equal((await handoff).reason,'warmup-cancelled');const uploads=f.uploads.length;
  finish();await settle();assert.equal(f.uploads.length,uploads);assert.equal(f.state.sources.size,0);assert.equal(f.decodes.length,0);
});

check('compressed context recovery reuploads retained mip buffers and exit releases them',async()=>{
  const f=fixture(),d=f.image('compressed-recovery',35,17,()=>Promise.resolve()),bank=compressedBank(f,[d]);
  await f.gpu.warmup(f.ctx,[d],{texts:[]});const source=f.state.sources.get(d.image).texture.source,mips=source.resource;
  f.state.canvas.listeners.webglcontextlost();f.state.canvas.listeners.webglcontextrestored();
  const uploads=f.uploads.length;f.gpu.prepare(f.ctx,[d]);assert.equal(f.state.status,'ready');
  assert.equal(f.uploads.length,uploads+1);assert.equal(source.resource,mips);
  assert.equal(f.decodes.length,0);assert.equal(bank.workers.length,1);
  f.gpu.releaseLevel();assert.equal(source.destroyed,true);assert.equal(source.resource,null);
  assert.equal(f.gpu.diagnostics().sourceStorageBytes,0);assert.equal(f.gpu.diagnostics().compressedSources,0);
});

async function main() {
  const groups = [];
  for (const test of checks) {
    try { await test.run(); }
    catch (error) { error.message = `GPU contract "${test.name}": ${error.message}`; throw error; }
    groups.push(test.name);
  }
  const result = {
    passed: true, groupCount: groups.length, groups,
    rendererSHA256: crypto.createHash('sha256').update(rendererBytes).digest('hex'),
    contextSHA256: crypto.createHash('sha256').update(contextBytes).digest('hex'),
    roadSHA256: crypto.createHash('sha256').update(roadBytes).digest('hex'),
    cinematicsSHA256: crypto.createHash('sha256').update(cinematicsBytes).digest('hex'),
    textureBankSHA256: crypto.createHash('sha256').update(bankBytes).digest('hex'),
    textureWorkerSHA256: crypto.createHash('sha256').update(textureWorkerBytes).digest('hex'),
    browserRun: false, nativeCanvasRun: false, performanceAcceptance: false
  };
  if (process.env.CACHE_ROAD_GPU_RECEIPT) {
    const destination = path.resolve(process.env.CACHE_ROAD_GPU_RECEIPT);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
  }
  console.log(`Cache road GPU contracts: ${groups.length} passed (VM; browser performance checked separately).`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
