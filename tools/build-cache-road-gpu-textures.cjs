'use strict';
// Reproducible full-resolution GPU derivatives; canonical artwork is read only.
// Requires official KTX-Software4.4.2 toktx, Python3 with Pillow+NumPy, Node22+.
// Usage: node tools/build-cache-road-gpu-textures.cjs --toktx PATH --python PATH [--jobs 3] [--threads 2]
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),cp=require('node:child_process'),
 crypto=require('node:crypto'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks');
const root=path.resolve(__dirname,'..'),args=process.argv.slice(2),option=(name,fallback)=>{
 const at=args.indexOf(name);return at<0?fallback:args[at+1];};
const encoder=option('--toktx',process.env.TOKTX_BIN),python=option('--python',process.env.PYTHON_BIN||'python'),
 jobs=Number(option('--jobs','3')),threads=Number(option('--threads','2'));
assert(encoder&&fs.existsSync(encoder),'Supply the official KTX4.4.2 encoder with --toktx or TOKTX_BIN');
assert(Number.isInteger(jobs)&&jobs>=1&&jobs<=4&&Number.isInteger(threads)&&threads>=1&&threads<=4&&jobs*threads<=8,'Use at most4 jobs/8 total encoder threads');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),fileHash=file=>digest(fs.readFileSync(file));
const output=path.join(root,'assets/cache-road/gpu-textures'),work=path.join(root,'.cache-road-gpu-texture-work-'+process.pid),
 progressFile=path.resolve(option('--receipt',path.join(root,'verification/cache-road-gpu-texture-generation.json')));
const versionResult=cp.spawnSync(encoder,['--version'],{encoding:'utf8',windowsHide:true}),version=(versionResult.stdout+versionResult.stderr).trim();
assert.equal(versionResult.status,0,'Pinned encoder did not run');
assert.equal(version,'toktx v4.4.2','Encoder must match the pinned release');
const sourceFiles=['src/engine/cache-scene-layouts.js','src/game/cache-road-landscape.js','src/game/cache-road-proof.js','src/engine/presentation-assets.js'],
 sourceHashes=Object.fromEntries(sourceFiles.map(relative=>[relative,fileHash(path.join(root,relative))]));
const context=vm.createContext({window:{BARCODE:{Campaign:{register(){},syncTitleButton(){}}}}});
for(const relative of sourceFiles.slice(0,3)){
 let source=fs.readFileSync(path.join(root,relative),'utf8');
 if(relative.endsWith('cache-road-proof.js')){
  assert(source.includes('const GPU_LEVEL_KEYS=gpuLevelKeys();'),'Authored GPU source selector changed');
  source=source.replace('const GPU_LEVEL_KEYS=gpuLevelKeys();','const GPU_LEVEL_KEYS=gpuLevelKeys();B.__PACK_GPU_KEYS=GPU_LEVEL_KEYS;');
 }
 vm.runInContext(source,context,{filename:relative,timeout:3000});
}
const pa=fs.readFileSync(path.join(root,sourceFiles[3]),'utf8'),boundary=pa.indexOf('  const cache = {};');
assert(boundary>0,'Authored source catalog boundary changed');
vm.runInContext(pa.slice(0,boundary)+'B.__PACK_ENTRIES=entries;})();',context,{timeout:3000});
const B=context.window.BARCODE,keys=Array.from(B.__PACK_GPU_KEYS),catalog=B.__PACK_ENTRIES;
assert.equal(keys.length,171,'Review a changed whole-level source set before regenerating');
assert.equal(new Set(keys).size,keys.length);
const sourceRows=keys.map(key=>{const relative=catalog[key]?.path;assert(relative&&!path.isAbsolute(relative)&&!relative.split('/').includes('..'));
 return {key,originalPath:relative,absolute:path.join(root,relative),originalSHA256:fileHash(path.join(root,relative))};});
const metadataPython=String.raw`import sys,json,xml.etree.ElementTree as ET
from PIL import Image
rows=json.load(sys.stdin)
for row in rows:
 if row['originalPath'].endswith('.svg'):
  svg=ET.parse(row['absolute']).getroot(); row['originalWidth']=int(svg.attrib['width']); row['originalHeight']=int(svg.attrib['height']); row['kind']='original'
 else:
  with Image.open(row['absolute']) as image: row['originalWidth'],row['originalHeight']=image.size
  row['kind']='compressed'
print(json.dumps(rows))`;
const rows=JSON.parse(cp.execFileSync(python,['-c',metadataPython],{input:JSON.stringify(sourceRows),encoding:'utf8',windowsHide:true}));
assert.equal(rows.filter(x=>x.kind==='compressed').length,149);assert.equal(rows.filter(x=>x.kind==='original').length,22);
const costs=(width,height)=>{let bytes=0,blockBytes=0,levels=0;for(;;){bytes+=width*height*4;blockBytes+=Math.ceil(width/4)*Math.ceil(height/4)*16;levels++;
 if(width===1&&height===1)break;width=Math.max(1,Math.floor(width/2));height=Math.max(1,Math.floor(height/2));}return {bytes,blockBytes,levels};};
const manifest={version:1,sourceCount:171,compressedCount:149,originalCount:22,encoder:'KTX-Software',encoderVersion:'4.4.2',
 encoderCommit:'4d6fc70eaf62ad0558e63e8d97eb9766118327a6',
 encoderRelease:'https://github.com/KhronosGroup/KTX-Software/releases/tag/v4.4.2',
 encoderWindowsReleaseSHA256:'1f323b0fec19794f5e6c0425a61d4b1da396872a10be862d105f4f4b2d2957fe',
 encoderBinarySHA256:fileHash(encoder),transcoderCommit:'9bebe16726b3a61c8c213eeee3b7cffb462ef34e',
 alphaMode:'premultiplied-alpha',colorSpace:'unorm',quality:2,rdo:false,supercompression:'zstd-lossless-level3',
 mipFilter:'box in encoded-byte premultiplied UNORM space; clamp addressing',padding:'extrude final edge; retain original UV window',
 originalRgbaMipBytes:0,compressedGpuMipBytes:0,svgGpuMipBytes:0,allGpuMipBytes:0,entries:{}};
fs.mkdirSync(output,{recursive:true});fs.mkdirSync(work,{recursive:true});fs.mkdirSync(path.dirname(progressFile),{recursive:true});
const preparePython=String.raw`import sys,json
from PIL import Image
import numpy as np
original,target,width,height,padded_width,padded_height=sys.argv[1:]
with Image.open(original) as opened: image=opened.convert('RGBA')
if image.size!=(int(width),int(height)): raise RuntimeError('Original dimensions changed')
pixels=np.asarray(image).copy(); pixels[:,:,:3]=((pixels[:,:,:3].astype(np.uint16)*pixels[:,:,3:4]+127)//255).astype(np.uint8)
pixels=np.pad(pixels,((0,int(padded_height)-int(height)),(0,int(padded_width)-int(width)),(0,0)),mode='edge')
Image.fromarray(pixels).save(target)`;
const run=(exe,argv)=>new Promise((resolve,reject)=>cp.execFile(exe,argv,{windowsHide:true,maxBuffer:2*1024*1024},(error,stdout,stderr)=>error?reject(Error(String(error)+'\n'+stderr)):resolve(stdout)));
let decoder,completed=0;const started=performance.now(),receipts=[];
const progress=()=>fs.writeFileSync(progressFile,JSON.stringify({status:'generating',completed,total:rows.length,elapsedMs:performance.now()-started,
 completedEntries:Object.keys(manifest.entries),sourceHashes,receipts},null,2));
async function pack(row,index){
 const originalCost=costs(row.originalWidth,row.originalHeight),entry={kind:row.kind,originalPath:row.originalPath,originalSHA256:row.originalSHA256,
  originalWidth:row.originalWidth,originalHeight:row.originalHeight,rgbaMipBytes:originalCost.bytes};
 if(row.kind==='original')Object.assign(entry,{path:row.originalPath,width:row.originalWidth,height:row.originalHeight,levels:originalCost.levels,
  sha256:row.originalSHA256,bytes:fs.statSync(row.absolute).size});
 else {
  const width=Math.ceil(row.originalWidth/4)*4,height=Math.ceil(row.originalHeight/4)*4,paddedCost=costs(width,height),
   folder=path.join(work,String(index)),png=path.join(folder,'input.png'),ktxFile=path.join(folder,'output.ktx2');
  fs.mkdirSync(folder,{recursive:true});const t=performance.now();
  try{
   await run(python,['-c',preparePython,row.absolute,png,String(row.originalWidth),String(row.originalHeight),String(width),String(height)]);
   const encodeStarted=performance.now();
   await run(encoder,['--t2','--encode','uastc','--uastc_quality','2','--genmipmap','--filter','box','--assign_oetf','linear','--assign_primaries','none','--zcmp','3','--threads',String(threads),ktxFile,png]);
   const encodedMs=performance.now()-encodeStarted,bytes=fs.readFileSync(ktxFile);bytes[bytes.readUInt32LE(48)+15]|=1;
   const file=new decoder.KTX2File(new Uint8Array(bytes));let bc7MipBytes=0;
   const transcodeStarted=performance.now();
   try{
    assert(file.isValid()&&file.isUASTC()&&!file.isSRGB()&&file.getDFDTransferFunc()===1&&(file.getDFDFlags()&1));
    assert.equal(file.getFaces(),1);assert(file.getLayers()<=1);assert.equal(file.getWidth(),width);assert.equal(file.getHeight(),height);assert.equal(file.getLevels(),paddedCost.levels);
    assert(file.startTranscoding(),'Matching decoder rejected KTX2');
    for(let level=0;level<file.getLevels();level++){
     const size=file.getImageTranscodedSizeInBytes(level,0,0,6),blocks=new Uint8Array(size);
     assert(file.transcodeImage(blocks,level,0,0,6,0,-1,-1),'Matching BC7 full-mip transcode failed');bc7MipBytes+=size;
    }
   }finally{file.close();file.delete();}
   assert.equal(bc7MipBytes,paddedCost.blockBytes);assert.equal(fileHash(row.absolute),row.originalSHA256);
   const relative='assets/cache-road/gpu-textures/'+row.key+'.ktx2';fs.writeFileSync(path.join(root,relative),bytes);
   Object.assign(entry,{path:relative,width,height,levels:paddedCost.levels,uvWindow:[0,0,row.originalWidth/width,row.originalHeight/height],
    paddedRgbaMipBytes:paddedCost.bytes,bc7MipBytes,sha256:digest(bytes),bytes:bytes.length});
   receipts.push({key:row.key,encodeMs:encodedMs,totalMs:performance.now()-t,bc7TranscodeMs:performance.now()-transcodeStarted,bytes:bytes.length});
  }finally{assert.equal(path.dirname(folder),work);fs.rmSync(folder,{recursive:true,force:true});}
 }
 manifest.entries[row.key]=entry;completed++;progress();
 console.log(JSON.stringify({completed,total:rows.length,key:row.key,kind:row.kind,bytes:entry.bytes,elapsedSeconds:+((performance.now()-started)/1000).toFixed(1)}));
}
(async()=>{
 decoder=await require(path.join(root,'src/vendor/basis-2.50/basis_transcoder.js'))();decoder.initializeBasis();
 let next=0;await Promise.all(Array.from({length:jobs},async()=>{while(next<rows.length){const index=next++;await pack(rows[index],index);}}));
 // Stable source order and verified canonical originals make the output reviewable.
 manifest.entries=Object.fromEntries(rows.map(row=>[row.key,manifest.entries[row.key]]));
 for(const row of rows){assert.equal(fileHash(row.absolute),row.originalSHA256);const entry=manifest.entries[row.key];
  manifest.originalRgbaMipBytes+=entry.rgbaMipBytes;if(entry.kind==='compressed')manifest.compressedGpuMipBytes+=entry.bc7MipBytes;else manifest.svgGpuMipBytes+=entry.rgbaMipBytes;}
 manifest.allGpuMipBytes=manifest.compressedGpuMipBytes+manifest.svgGpuMipBytes;
 const currentHashes=Object.fromEntries(sourceFiles.map(relative=>[relative,fileHash(path.join(root,relative))]));
 assert.equal(sourceHashes[sourceFiles[0]],currentHashes[sourceFiles[0]]);assert.equal(sourceHashes[sourceFiles[1]],currentHashes[sourceFiles[1]]);
 // Lifecycle/renderer edits may run concurrently, but source-selector identity cannot.
 const finalKeysContext=vm.createContext({window:{BARCODE:{Campaign:{register(){},syncTitleButton(){}}}}});
 for(const relative of sourceFiles.slice(0,3)){let text=fs.readFileSync(path.join(root,relative),'utf8');if(relative.endsWith('proof.js'))text=text.replace('const GPU_LEVEL_KEYS=gpuLevelKeys();','const GPU_LEVEL_KEYS=gpuLevelKeys();B.__PACK_GPU_KEYS=GPU_LEVEL_KEYS;');vm.runInContext(text,finalKeysContext,{timeout:3000});}
 assert.deepEqual(Array.from(finalKeysContext.window.BARCODE.__PACK_GPU_KEYS),keys);
 fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(progressFile,JSON.stringify({status:'complete',completed,elapsedMs:performance.now()-started,sourceHashesBefore:sourceHashes,sourceHashesAfter:currentHashes,jobs,threads,receipts},null,2));
 assert.equal(path.dirname(work),root);assert(path.basename(work).startsWith('.cache-road-gpu-texture-work-'));fs.rmSync(work,{recursive:true,force:true});
 console.log(JSON.stringify({status:'complete',sources:171,compressed:149,originalSVG:22,elapsedSeconds:(performance.now()-started)/1000,
  originalMipMiB:manifest.originalRgbaMipBytes/1048576,newGpuMipMiB:manifest.allGpuMipBytes/1048576,ktx2MiB:Object.values(manifest.entries).filter(x=>x.kind==='compressed').reduce((a,x)=>a+x.bytes,0)/1048576}));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
