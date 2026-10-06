'use strict';
// Read-only PNG alpha inspection. Never writes or transforms image pixels.
const fs=require('node:fs'),zlib=require('node:zlib'),assert=require('node:assert/strict');
const [input,output]=process.argv.slice(2),bytes=fs.readFileSync(input),chunks=[];
assert.equal(bytes.subarray(1,4).toString(),'PNG');
let width,height,colorType,bitDepth;
for(let p=8;p<bytes.length;){const size=bytes.readUInt32BE(p),kind=bytes.toString('ascii',p+4,p+8),data=bytes.subarray(p+8,p+8+size);
 if(kind==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];assert.equal(data[12],0,'Interlacing unsupported');}
 if(kind==='IDAT')chunks.push(data);p+=size+12;}
assert.equal(bitDepth,8);assert.equal(colorType,6,'RGBA required');
const packed=zlib.inflateSync(Buffer.concat(chunks)),stride=width*4,pixels=Buffer.alloc(stride*height);
const paeth=(a,b,c)=>{const p=a+b-c,aa=Math.abs(p-a),bb=Math.abs(p-b),cc=Math.abs(p-c);return aa<=bb&&aa<=cc?a:bb<=cc?b:c;};
let cursor=0;
for(let y=0;y<height;y++){const filter=packed[cursor++];for(let x=0;x<stride;x++){
 const a=x>=4?pixels[y*stride+x-4]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
 const predictor=filter===0?0:filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):filter===4?paeth(a,b,c):NaN;
 assert(Number.isFinite(predictor),'PNG filter');pixels[y*stride+x]=(packed[cursor++]+predictor)&255;}}
const threshold=8,occupied=new Array(width).fill(false);let transparentPixels=0,opaquePixels=0,semitransparentPixels=0;
for(let x=0;x<width;x++)for(let y=0;y<height;y++){const alpha=pixels[y*stride+x*4+3];
 if(alpha===0)transparentPixels++;else if(alpha===255)opaquePixels++;else semitransparentPixels++;if(alpha>threshold)occupied[x]=true;}
const bands=[];let start=-1;
for(let x=0;x<=width;x++){if(x<width&&occupied[x]){if(start<0)start=x;}else if(start>=0){let minY=height,maxY=-1;
 for(let xx=start;xx<x;xx++)for(let yy=0;yy<height;yy++)if(pixels[yy*stride+xx*4+3]>threshold){minY=Math.min(minY,yy);maxY=Math.max(maxY,yy);}
 bands.push({x:start,y:minY,width:x-start,height:maxY-minY+1,right:x-1,bottom:maxY});start=-1;}}
const logicalBands=[];
for(const band of bands){const prior=logicalBands[logicalBands.length-1];
 if(prior&&band.x-prior.right<=16){prior.right=band.right;prior.bottom=Math.max(prior.bottom,band.bottom);prior.y=Math.min(prior.y,band.y);prior.width=prior.right-prior.x+1;prior.height=prior.bottom-prior.y+1;}
 else logicalBands.push({...band});}
for(const band of logicalBands){let left=width,right=-1;const top=Math.max(band.y,band.bottom-19);
 for(let x=band.x;x<=band.right;x++)for(let y=top;y<=band.bottom;y++)if(pixels[y*stride+x*4+3]>threshold){left=Math.min(left,x);right=Math.max(right,x);}
 band.lowestShoeStrip={top,bottom:band.bottom,left,right,centerX:(left+right)/2};}
const report={width,height,bitDepth,colorType,alphaThreshold:threshold,transparentPixels,opaquePixels,semitransparentPixels,bands,logicalBands};
if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
