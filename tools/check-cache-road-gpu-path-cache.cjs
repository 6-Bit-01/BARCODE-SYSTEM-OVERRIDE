'use strict';
// Actual recorder contracts only; no graphics driver or pacing claims.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
class NativePath {
  constructor(){this.operations=[];}
}
for(const method of ['moveTo','lineTo','closePath','rect','arc','ellipse','bezierCurveTo','quadraticCurveTo','roundRect'])
  NativePath.prototype[method]=function(...args){this.operations.push([method,args]);};
function native(){
  const result={canvas:{width:1920,height:1080},events:[],transformReads:0,
    matrix:{a:1,b:0,c:0,d:1,e:0,f:0},stack:[],dash:[],
    getTransform(){this.transformReads++;return {...this.matrix};},getLineDash(){return this.dash.slice();},
    setTransform(a,b,c,d,e,f){this.matrix={a,b,c,d,e,f};},setLineDash(dash){this.dash=Array.from(dash);},
    save(){this.stack.push({transform:{...this.matrix},dash:this.dash.slice()});},
    restore(){const value=this.stack.pop();assert(value,'Native replay underflow');this.matrix=value.transform;this.dash=value.dash;},
    measureText(){return {width:1};}};
  result.transform=function(a,b,c,d,e,f){const m=this.matrix;
    this.matrix={a:m.a*a+m.c*b,b:m.b*a+m.d*b,c:m.a*c+m.c*d,d:m.b*c+m.d*d,
      e:m.a*e+m.c*f+m.e,f:m.b*e+m.d*f+m.f};};
  result.translate=function(x,y){this.transform(1,0,0,1,x,y);};
  result.scale=function(x,y){this.transform(x,0,0,y,0,0);};
  result.rotate=function(angle){const c=Math.cos(angle),s=Math.sin(angle);this.transform(c,s,-s,c,0,0);};
  for(const method of ['beginPath','moveTo','lineTo','closePath','rect','arc','ellipse','bezierCurveTo',
    'quadraticCurveTo','roundRect','clip','fill','stroke','fillRect','strokeRect','drawImage'])
    result[method]=function(...args){this.events.push({method,args});};
  return result;
}
const context=vm.createContext({window:{BARCODE:{},Path2D:NativePath}});
vm.runInContext(fs.readFileSync(path.join(root,'src/engine/cache-road-gpu-context.js'),'utf8'),context,
  {filename:'src/engine/cache-road-gpu-context.js'});
const Context=context.window.BARCODE.CacheRoadGPUContext,n=native(),scene=new Context(n),crest=scene.createPath();
crest.moveTo(0,10);
for(let i=1;i<65;i++)crest.lineTo(i*30,10+i*.125);
crest.lineTo(1920,1080);crest.lineTo(0,1080);crest.closePath();
const originalOperations=crest.operations.length,revision=crest.revision;
const image={naturalWidth:64,naturalHeight:32};
for(let i=0;i<8;i++){
  scene.save();scene.clip(crest);scene.drawImage(image,0,0,64,32,i*20,20,64,32);scene.restore();
}
const first=scene.commands[0].clips[0];
assert(scene.commands.slice(0,8).every(command=>command.clips[0]===first),
  'Identical authored ground clips must retain identity across separate slab saves');
assert.equal(n.transformReads,2,'Repeated clips must not construct/replay a fresh geometry recorder');
assert(Object.isFrozen(first)&&Object.isFrozen(first.paths)&&Object.isFrozen(first.paths[0].points));
assert.equal(crest.revision,revision);
scene.fill(crest);scene.stroke(crest);
assert.equal(scene.commands[8].paths,first.paths,'Fill must reuse the exact cached transformed path');
assert.equal(scene.commands[9].paths,first.paths,'Stroke must reuse the exact cached transformed path');
scene.save();scene.clip(crest,'evenodd');scene.fillRect(0,0,1,1);scene.restore();
const evenodd=scene.commands.at(-1).clips[0];
assert.notEqual(evenodd,first,'Different fill rules must retain separate clip identities');
assert.equal(evenodd.paths,first.paths);assert.equal(evenodd.rule,'evenodd');
scene.save();scene.translate(1e-12,0);scene.clip(crest);scene.fillRect(0,0,1,1);scene.restore();
const translated=scene.commands.at(-1).clips[0];
assert.notEqual(translated,first);assert.notEqual(translated.paths,first.paths);
assert.equal(translated.paths[0].points[0],1e-12,'Exact transforms must not be quantized');
scene.save();scene.clip(crest);scene.fillRect(0,0,1,1);scene.restore();
assert.equal(scene.commands.at(-1).clips[0],first,'Returning to an exact saved transform must reuse its prior immutable clip');
scene.save();scene.setTransform(1,.2,.3,2,11,-7);scene.clip(crest);scene.fillRect(0,0,1,1);scene.restore();
const skewed=scene.commands.at(-1).clips[0];
assert.equal(skewed.paths[0].points[0],14);assert.equal(skewed.paths[0].points[1],13);
assert.notEqual(skewed,first);
crest.moveTo(-5,-6);crest.lineTo(10,11);
assert.equal(crest.revision,revision+2);
scene.save();scene.clip(crest);scene.fillRect(0,0,1,1);scene.restore();
const edited=scene.commands.at(-1).clips[0];
assert.notEqual(edited,first,'An authored path mutation must invalidate its cached variants');
assert.notEqual(edited.paths,first.paths);assert.equal(first.paths.length,2);
assert.equal(edited.paths.length,3);assert.deepEqual(Array.from(edited.paths[2].points),[-5,-6,10,11]);
assert.equal(first.paths[0].points[0],0,'Published earlier command geometry must remain unchanged');
assert.equal(scene.commands.balanced,true);
scene.replay(n);
assert.equal(n.stack.length,0,'The unchanged native replay must balance its complete stack');
const clips=n.events.filter(event=>event.method==='clip');
assert.equal(clips[0].args[0].operations.length,originalOperations,
  'Native journal must preserve the path snapshot from the original clip call');
assert.equal(clips.at(-1).args[0].operations.length,originalOperations+2);
assert.equal(clips[8].args[1],'evenodd','Native replay must preserve the original authored clip rule');
const nextScene=new Context(native());nextScene.clip(crest);nextScene.fillRect(0,0,1,1);
assert.notEqual(nextScene.commands[0].clips[0],edited,'Clip ownership must remain local to its frame recorder');
const methods=['moveTo','lineTo','closePath','rect','arc','ellipse','bezierCurveTo','quadraticCurveTo','roundRect'];
for(const method of methods){const p=scene.createPath();p[method](1,2,3,4,5,6,7,8);assert.equal(p.revision,1,method+' must invalidate shape revision');}
const opaque=new Context(native());opaque.clip(new NativePath());
assert.equal(opaque.commands[0].kind,'unsupported','Opaque native Path2D must retain its complete native fallback policy');
console.log(JSON.stringify({passed:true,repeatedGroundClips:8,distinctGroundClipIdentities:1,
  exactTransformRuleAndRevision:true,immutablePublishedGeometry:true,nativeReplaySnapshots:true,
  frameLocalWeakOwnership:true,limits:'Production recorder contracts only; group reduction and hardware pacing require actual built-page evidence'}));
