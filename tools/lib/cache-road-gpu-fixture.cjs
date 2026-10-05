// Explicit host/graphics stubs for production GPU contracts. They record
// ownership and geometry; they do not rasterize or model GPU performance.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../..');
const rendererBytes = fs.readFileSync(path.join(root, 'src/engine/cache-road-gpu-renderer.js'));
const contextBytes = fs.readFileSync(path.join(root, 'src/engine/cache-road-gpu-context.js'));
const cinematicsBytes = fs.readFileSync(path.join(root, 'src/game/cache-road-cinematics.js'));
const roadBytes = fs.readFileSync(path.join(root, 'src/game/cache-road-proof.js'));
const bankBytes = fs.readFileSync(path.join(root, 'src/engine/cache-road-texture-bank.js'));
const textureWorkerBytes = fs.readFileSync(path.join(root, 'src/engine/cache-road-texture-worker.js'));
const styleKeys = ['fillStyle', 'strokeStyle', 'globalAlpha', 'globalCompositeOperation',
  'lineWidth', 'lineCap', 'lineJoin', 'miterLimit', 'lineDashOffset', 'font', 'textAlign',
  'textBaseline', 'direction', 'shadowColor', 'shadowBlur', 'shadowOffsetX',
  'shadowOffsetY', 'imageSmoothingEnabled', 'imageSmoothingQuality', 'filter'];

class NativePath {
  constructor() { this.ops = []; }
}
for (const method of ['moveTo', 'lineTo', 'closePath', 'rect', 'arc', 'ellipse',
  'bezierCurveTo', 'quadraticCurveTo', 'roundRect']) {
  NativePath.prototype[method] = function (...args) { this.ops.push([method, args]); };
}

function nativeContext() {
  const n = {
    canvas: { width: 1920, height: 1080 },
    m: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }, dash: [], stack: [], draws: [], gradients: [],
    fillStyle: '#123456', strokeStyle: '#abcdef', globalAlpha: .7,
    globalCompositeOperation: 'source-over', lineWidth: 2, lineCap: 'butt',
    lineJoin: 'miter', miterLimit: 10, lineDashOffset: 0, font: 'bold 18px Oxanium',
    textAlign: 'left', textBaseline: 'alphabetic', direction: 'ltr',
    shadowColor: '#00000000', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
    imageSmoothingEnabled: true, imageSmoothingQuality: 'high', filter: 'none'
  };
  n.getTransform = () => ({ ...n.m });
  n.getLineDash = () => n.dash.slice();
  n.setLineDash = dash => { n.dash = Array.from(dash); };
  n.setTransform = (a, b, c, d, e, f) => { n.m = { a, b, c, d, e, f }; };
  n.save = () => n.stack.push({ m: { ...n.m }, dash: n.dash.slice(),
    styles: Object.fromEntries(styleKeys.map(key => [key, n[key]])) });
  n.restore = () => {
    const saved = n.stack.pop();
    assert(saved, 'replay must not consume a caller save frame');
    n.m = saved.m; n.dash = saved.dash; Object.assign(n, saved.styles);
  };
  n.translate = (x, y) => { n.m.e += n.m.a * x + n.m.c * y; n.m.f += n.m.b * x + n.m.d * y; };
  n.scale = (x, y) => { n.m.a *= x; n.m.b *= x; n.m.c *= y; n.m.d *= y; };
  n.rotate = angle => {
    const { a, b, c, d } = n.m, co = Math.cos(angle), si = Math.sin(angle);
    n.m.a = a * co + c * si; n.m.b = b * co + d * si;
    n.m.c = -a * si + c * co; n.m.d = -b * si + d * co;
  };
  n.transform = (a, b, c, d, e, f) => {
    const m = { ...n.m };
    n.m = { a: m.a * a + m.c * b, b: m.b * a + m.d * b,
      c: m.a * c + m.c * d, d: m.b * c + m.d * d,
      e: m.a * e + m.c * f + m.e, f: m.b * e + m.d * f + m.f };
  };
  for (const type of ['linear', 'radial']) {
    n[type === 'linear' ? 'createLinearGradient' : 'createRadialGradient'] = (...args) => {
      const gradient = { type, args, m: { ...n.m }, stops: [],
        addColorStop(offset, color) { this.stops.push([offset, color]); } };
      n.gradients.push(gradient); return gradient;
    };
  }
  for (const method of ['beginPath', 'moveTo', 'lineTo', 'closePath', 'rect', 'arc',
    'ellipse', 'bezierCurveTo', 'quadraticCurveTo', 'roundRect', 'clip', 'stroke',
    'fill', 'fillRect', 'strokeRect', 'drawImage', 'fillText', 'clearRect']) {
    n[method] = (...args) => n.draws.push({ method, args, m: { ...n.m },
      alpha: n.globalAlpha, fillStyle: n.fillStyle, font: n.font, dash: n.dash.slice() });
  }
  n.measureText = text => ({ width: String(text).length * 10 });
  return n;
}

function fixture(options={}) {
  const stats = { adds: 0, removes: 0, reorders: 0, visibility: 0 },
    uploads = [], decodes = [], surfaces = [], textReturns = [], renders = [];
  class Container {
    constructor() { this.children = []; this.parent = null; this._visible = true; }
    get visible() { return this._visible; }
    set visible(value) { if (this._visible !== value) stats.visibility++; this._visible = value; }
    addChild(...children) {
      for (const child of children) this.addChildAt(child, this.children.length);
      return children[0];
    }
    addChildAt(child, index) {
      child.parent?.removeChild(child); this.children.splice(index, 0, child);
      child.parent = this; stats.adds++; return child;
    }
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index >= 0) { this.children.splice(index, 1); child.parent = null; stats.removes++; }
      return child;
    }
    removeChildren() { const children = this.children.slice(); for (const child of children) this.removeChild(child); return children; }
    setChildIndex(child, index) {
      const prior = this.children.indexOf(child); assert(prior >= 0);
      this.children.splice(prior, 1); this.children.splice(index, 0, child); stats.reorders++;
    }
    destroy(options = {}) {
      if (this.destroyed) return;
      this.destroyed = true;
      if (options.children) for (const child of this.children.slice()) child.destroy?.(options);
      this.removeChildren(); this.parent?.removeChild(this);
    }
  }
  class Graphics extends Container {
    constructor() { super(); this.ops = []; }
    clear() { this.ops = []; return this; }
    setFromMatrix(matrix) { this.matrix = matrix; return this; }
  }
  for (const method of ['moveTo', 'lineTo', 'closePath', 'poly', 'cut', 'fill', 'stroke']) {
    Graphics.prototype[method] = function (...args) { this.ops.push([method, args]); return this; };
  }
  class ImageSource {
    constructor(options) {
      Object.assign(this, options); this.style = { scaleMode: options.scaleMode };
      this.pixelWidth = options.width; this.pixelHeight = options.height;
    }
    unload() { this.unloads = (this.unloads || 0) + 1; }
    destroy() { this.destroyed = true; this.unload(); this.resource = null; }
  }
  class CompressedSource extends ImageSource {
    constructor(options) { super(options); this.mipLevelCount=options.resource.length; this.uploadMethodId='compressed'; }
  }
  class Texture {
    constructor(options) { Object.assign(this, options); this.orig = { width: options.source.width, height: options.source.height }; }
    get width() { return this.source.width; }
    get height() { return this.source.height; }
    destroy(destroySource) { this.destroyed = true; if(destroySource)this.source.destroy(); }
  }
  Texture.EMPTY = new Texture({ source: new ImageSource({ width: 1, height: 1 }) });
  class Geometry {
    constructor(options) {
      Object.assign(this, options); this.buffers = { aPosition: { update() {} }, aUV: { update() {} } };
      this.indexBuffer = { update() {} };
      if(options.attributes){this.buffers=Object.fromEntries(Object.entries(options.attributes).map(([key,value])=>[key,value.buffer]));
        this.indexBuffer=options.indexBuffer;}
    }
    getBuffer(key) { return this.buffers[key]; }
    destroy(buffers) { this.destroyed = true;
      if(buffers)for(const buffer of new Set([...Object.values(this.buffers),this.indexBuffer]))buffer.destroy?.(); }
  }
  class Buffer {
    constructor(options){Object.assign(this,options);this.updates=[];}
    update(bytes){this.updates.push(bytes);}
    destroy(){this.destroyed=true;this.data=null;}
  }
  class Shader {
    constructor(options) {
      this.glProgram=options.glProgram;
      this.resources = {};
      for (const [key, value] of Object.entries(options.resources)) {
        this.resources[key] = key.endsWith('Uniforms')
          ? { uniforms: Object.fromEntries(Object.entries(value).map(([name, entry]) => [name, entry.value])), update() {} }
          : value;
      }
    }
    destroy() { this.destroyed = true; }
  }
  class Mesh extends Container {
    constructor(options) { super(); Object.assign(this, options); this.mask = null; }
  }
  class Matrix {
    constructor(a = 1, b = 0, c = 0, d = 1, e = 0, f = 0) { Object.assign(this, { a, b, c, d, e, f }); }
  }
  class Sprite extends Container {
    constructor(texture) { super(); this.texture = texture; this.position = { set: (x, y) => { this.x = x; this.y = y; } }; }
  }
  class TextStyle { constructor(options) { Object.assign(this, options); } }
  class Renderer {
    constructor() {
      this.gl = { SAMPLES: 'samples', MAX_TEXTURE_SIZE: 'maxSize',
        getParameter: key => key === 'samples' ? (this.options?.antialias ? 4 : 0) : 16384 };
      if(options.worldBatch){const gl=this.gl;
        Object.assign(gl,{MAX_TEXTURE_IMAGE_UNITS:'samplers',MAX_VERTEX_ATTRIBS:'attributes',MAX_VARYING_VECTORS:'varyings',
          VERTEX_SHADER:'vertex',FRAGMENT_SHADER:'fragment',COMPILE_STATUS:'compiled',LINK_STATUS:'linked',
          getParameter:key=>({samples:0,maxSize:16384,samplers:options.samplers??8,attributes:8,varyings:7})[key],
          createShader:type=>({type}),shaderSource:(shader,source)=>{shader.source=source;},compileShader(){},
          getShaderParameter:()=>!options.shaderFailure,getShaderInfoLog:()=> 'Fixture shader rejection',deleteShader(){},
          createProgram:()=>({}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,getProgramInfoLog:()=>'',deleteProgram(){}});
      }
      this.texture = { initSource: source => uploads.push({ source, resource: source.resource }) };
      this.events = { setTargetElement: target => { this.eventTarget = target; } };
      this.gc = { run() {} };
      this.renderTarget = { getRenderTarget: target => target, getGpuRenderTarget: target => target };
      this.canvasText = { getTexture: () => new Texture({ source: new ImageSource({ width: 32, height: 128, resource: 'text' }) }),
        returnTexture: texture => textReturns.push(texture) };
    }
    async init(options) { this.options = options; }
    render(options) { renders.push(options); }
    destroy() { this.destroyed = true; }
  }
  const ticker = () => ({ started: true, autoStart: true, stop() { this.started = false; } });
  const P = { WebGLRenderer: Renderer, Container, Graphics, ImageSource, CompressedSource, Texture, TextStyle,
    MeshGeometry: Geometry, Shader, Mesh, Matrix, Sprite,
    Ticker: { system: ticker(), shared: ticker() },
    GlProgram: { from: options => ({ ...options, destroy() {} }) },
    RenderTexture: { create: options => new Texture({ source: new ImageSource(options) }) },
    CanvasTextMetrics: { measureText: () => ({ width: 32, height: 64, fontProperties: { ascent: 52, descent: 12 } }) } };
  if(options.worldBatch)Object.assign(P,{Geometry,Buffer,BufferUsage:{VERTEX:1,INDEX:2,COPY_DST:4}});
  const elements = new Map();
  const document = { fonts: { check: () => true }, getElementById: id => elements.get(id), createElement: tag => {
    assert.equal(tag, 'canvas');
    const canvas = { style: {}, attributes: {}, listeners: {},
      setAttribute(key, value) { this.attributes[key] = value; },
      remove() { this.parentNode?.removeChild(this); },
      addEventListener(event, callback) { this.listeners[event] = callback; } };
    surfaces.push(canvas); return canvas;
  } };
  const window = { BARCODE: {}, PIXI: P, Path2D: NativePath, performance: { now: () => 1 } };
  vm.runInNewContext(contextBytes.toString(), { window });
  const injection = '\n  B._testGPU={state,paintGradient,showContents,convexClipOrientation,updateQuad,slot,imageQuad,clipImageQuad,worldVertex,worldFragment,worldPrimitive,worldBatch,appendWorldPrimitive,finishWorldBatch};\n  B.CacheRoadGPU=';
  const instrumented = rendererBytes.toString().replace('\n  B.CacheRoadGPU=', injection);
  assert.notEqual(instrumented, rendererBytes.toString(), 'renderer test exposure must match the actual API export');
  vm.runInNewContext(instrumented, { window, document });
  const native = nativeContext();
  function image(key, width = 32, height = 32, decode = null) {
    const source = { complete: true, naturalWidth: width, naturalHeight: height };
    if (decode) source.decode = () => { decodes.push(key); return decode(); };
    return { key, image: source, path: 'assets/' + key + '.png' };
  }
  return { gpu: window.BARCODE.CacheRoadGPU, internals: window.BARCODE._testGPU,
    state: window.BARCODE._testGPU.state, Recorder: window.BARCODE.CacheRoadGPUContext,
    P, window, document, elements, ctx: native, image, stats, uploads, decodes, surfaces, textReturns, renders };
}

let pinnedPixiCache;
function pinnedPixi(){
  if(pinnedPixiCache)return pinnedPixiCache;
  // Execute the shipped, pinned library for its actual geometry/resource APIs.
  // The precision-query host is explicit; it does not compile or render GL.
  const sandbox={console,performance:{now:()=>0},setTimeout,clearTimeout,setInterval,clearInterval,
    URL,URLSearchParams,TextEncoder,TextDecoder,navigator:{userAgent:'GPU contracts',platform:'Win32'}};
  sandbox.window=sandbox;sandbox.self=sandbox;
  sandbox.document={createElement:()=>({getContext:()=>({getShaderPrecisionFormat:()=>({precision:23}),
    VERTEX_SHADER:1,FRAGMENT_SHADER:2,HIGH_FLOAT:3})})};
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root,'src/vendor/pixi-8.22.0/pixi.min.js'),'utf8'),sandbox);
  assert.equal(sandbox.PIXI.VERSION,'8.22.0');
  return pinnedPixiCache=sandbox.PIXI;
}

function compressedBank(f, descriptors, options={}) {
  // Execute both production scripts. Only the browser/decoder boundary is
  // substituted: these stubs cannot establish image quality or GPU timings.
  const workers=[],files=[],loads=[],requests=[],entries={},metadata=new Map();
  descriptors.forEach((descriptor,index)=>{
    const originalWidth=descriptor.image.naturalWidth,originalHeight=descriptor.image.naturalHeight,
      width=Math.ceil(originalWidth/4)*4,height=Math.ceil(originalHeight/4)*4;
    const entry={kind:'compressed',originalWidth,originalHeight,width,height,
      levels:Math.floor(Math.log2(Math.max(width,height)))+1,
      path:'assets/cache-road/gpu-textures/'+descriptor.key+'.ktx2'};
    entries[descriptor.key]=entry;metadata.set(index+1,{...entry,key:descriptor.key,token:index+1});
  });
  const manifest={version:1,encoderCommit:'4d6fc70eaf62ad0558e63e8d97eb9766118327a6',
    transcoderCommit:'9bebe16726b3a61c8c213eeee3b7cffb462ef34e',
    alphaMode:'premultiplied-alpha',colorSpace:'unorm',entries};
  class KTX2File {
    constructor(bytes) { this.data=metadata.get(bytes[0]); files.push(this); }
    isValid() { return !options.invalid?.(this.data.key); }
    isUASTC() { return true; } isSRGB() { return !!options.srgb; }
    getDFDTransferFunc() { return 1; } getDFDFlags() { return options.straightAlpha?0:1; }
    getFaces() { return 1; } getLayers() { return 0; }
    getWidth() { return this.data.width; } getHeight() { return this.data.height; }
    getLevels() { return this.data.levels; } startTranscoding() { return true; }
    getImageTranscodedSizeInBytes(level,layer,face,target) {
      const w=Math.max(1,this.data.width>>level),h=Math.max(1,this.data.height>>level);
      return Math.ceil(w/4)*Math.ceil(h/4)*16;
    }
    transcodeImage(output,...args) { this.args=args; output.fill(this.data.token); return !options.transcodeFailure?.(this.data.key); }
    close() { this.closed=true; } delete() { this.deleted=true; }
  }
  class Worker {
    constructor(url) {
      this.url=url;workers.push(this);const owner=this;
      const self={postMessage(message,transferables) {
        owner.transferables=transferables;
        Promise.resolve().then(()=>{if(!owner.terminated)owner.onmessage?.({data:message});});
      }};
      const host={self,importScripts:js=>{loads.push(js);host.BASIS=async config=>{
        loads.push(config.locateFile('basis_transcoder.wasm'));
        if(options.initGate)await options.initGate;
        return {initializeBasis(){},KTX2File};
      };},fetch:async url=>{
        requests.push(url);const key=new URL(url).pathname.split('/').pop().replace(/\.ktx2$/,'');
        if(options.textureGate)await options.textureGate(key);
        const record=[...metadata.values()].find(value=>value.key===key);
        return {ok:!options.loadFailure?.(key),status:503,arrayBuffer:async()=>Uint8Array.of(record.token).buffer};
      }};
      vm.runInNewContext(textureWorkerBytes.toString(),host);
      this.deliver=message=>self.onmessage({data:message});
    }
    postMessage(message) {
      if(options.workerError&&message.type==='load') {
        Promise.resolve().then(()=>this.onerror?.({message:'worker failed'}));return;
      }
      this.deliver(message);
    }
    terminate() { this.terminated=true; }
  }
  f.document.currentScript={src:'https://game.invalid/src/engine/cache-road-texture-bank.js'};
  f.document.baseURI='https://game.invalid/';f.window.location={href:f.document.baseURI};
  f.window.Worker=Worker;f.window.AbortController=AbortController;
  f.window.fetch=async()=>({ok:!options.manifestFailure,json:async()=>options.manifest||manifest});
  f.elements.set('standalone-viewport-style',{});
  vm.runInNewContext(bankBytes.toString(),{window:f.window,document:f.document,URL});
  const extensions=options.unsupported?new Set():new Set(['EXT_texture_compression_bptc']);
  // Renderer initialization is asynchronous; its GL boundary can be set before
  // calling warmup, or by the constructor-prototype setter used below.
  const setGL=gl=>{gl.getExtension=name=>extensions.has(name)?{}:null;};
  if(f.state.renderer)setGL(f.state.renderer.gl);
  const OriginalRenderer=f.P.WebGLRenderer;
  f.P.WebGLRenderer=class extends OriginalRenderer{constructor(){super();setGL(this.gl);}};
  return {workers,files,loads,requests,manifest,bank:f.window.BARCODE.CacheRoadTextureBank};
}

function imageDimensions(file) {
  const descriptor = fs.openSync(file, 'r');
  function read(offset, size) {
    const bytes = Buffer.alloc(size), length = fs.readSync(descriptor, bytes, 0, size, offset);
    assert.equal(length, size, 'truncated image header'); return bytes;
  }
  try {
    const head = read(0, 12);
    if (head.toString('ascii', 1, 4) === 'PNG') {
      const size = read(16, 8); return [size.readUInt32BE(0), size.readUInt32BE(4)];
    }
    if (head.toString('ascii', 0, 3) === 'GIF') return [head.readUInt16LE(6), head.readUInt16LE(8)];
    if (head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP') {
      const length = fs.fstatSync(descriptor).size;
      for (let offset = 12; offset + 8 <= length;) {
        const chunk = read(offset, 8), tag = chunk.toString('ascii', 0, 4), size = chunk.readUInt32LE(4);
        if (tag === 'VP8X') {
          const payload = read(offset + 8, 10); return [1 + payload.readUIntLE(4, 3), 1 + payload.readUIntLE(7, 3)];
        }
        if (tag === 'VP8L') {
          const payload = read(offset + 8, 5), a = payload[1], b = payload[2], c = payload[3], d = payload[4];
          return [1 + (a | ((b & 63) << 8)), 1 + ((b >> 6) | (c << 2) | ((d & 15) << 10))];
        }
        if (tag === 'VP8 ') {
          const payload = read(offset + 8, 10); return [payload.readUInt16LE(6) & 16383, payload.readUInt16LE(8) & 16383];
        }
        offset += 8 + size + (size & 1);
      }
    }
    if (path.extname(file).toLowerCase() === '.svg') {
      const source = fs.readFileSync(file, 'utf8'), viewBox = source.match(/viewBox=["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/);
      const width = source.match(/\bwidth=["']([\d.]+)(?:px)?["']/), height = source.match(/\bheight=["']([\d.]+)(?:px)?["']/);
      if (width && height) return [Number(width[1]), Number(height[1])];
      if (viewBox) return [Number(viewBox[1]), Number(viewBox[2])];
    }
    throw Error('unsupported original image header: ' + path.basename(file));
  } finally { fs.closeSync(descriptor); }
}

function levelSourceDescriptors() {
  // Build the actual deterministic production layout and key set. The PA
  // metadata VM has no Image constructor, so preload cannot request/decode
  // any artwork. Read headers only for the selected Level 2 sources.
  const window = { BARCODE: { Campaign: { register() {}, syncTitleButton() {} } } };
  const host = vm.createContext({ window });
  vm.runInContext(fs.readFileSync(path.join(root, 'src/game/cache-road-landscape.js'), 'utf8'), host);
  const road = fs.readFileSync(path.join(root, 'src/game/cache-road-proof.js'), 'utf8'), marker = '  B.Campaign.register(ID,';
  assert(road.includes(marker), 'actual road registration is required for the metadata fixture');
  vm.runInContext(road.replace(marker, '  B._testLevelKeys=GPU_LEVEL_KEYS;\n' + marker), host);
  const assets = fs.readFileSync(path.join(root, 'src/engine/presentation-assets.js'), 'utf8');
  assert(assets.includes('  preload();'), 'actual presentation preload is required for metadata exposure');
  vm.runInContext(assets.replace('  preload();', '  B._testAssetEntries=entries;\n  preload();'), host);
  const keys = window.BARCODE._testLevelKeys, entries = window.BARCODE._testAssetEntries;
  assert(keys.length < Object.keys(entries).length, 'level warmup must remain smaller than all presentation assets');
  return Array.from(keys, key => {
    assert(key.startsWith('cache'), 'only Level 2 source keys are selected');
    const entry = entries[key]; assert(entry, 'selected original asset key must exist: ' + key);
    assert(entry.path.startsWith('assets/'), 'selected source must be an original local asset');
    const file = path.resolve(root, entry.path);
    assert(file.startsWith(root + path.sep), 'asset header read must remain inside the source checkout');
    const [width, height] = imageDimensions(file);
    return { key, path: entry.path, image: { complete: true, naturalWidth: width, naturalHeight: height } };
  });
}

function roadSceneApi(f) {
  // Expose the actual private routing functions only in this VM. The runtime
  // export stays unchanged, and the host still owns every frame and surface.
  const host = vm.createContext({ window: f.window, document: f.document });
  f.window.BARCODE.Campaign = { register() {}, syncTitleButton() {} };
  vm.runInContext(cinematicsBytes.toString(), host);
  vm.runInContext(fs.readFileSync(path.join(root, 'src/game/cache-road-landscape.js'), 'utf8'), host);
  const marker = '  B.Campaign.register(ID,', source = roadBytes.toString();
  assert(source.includes(marker), 'actual road scene registration is required');
  vm.runInContext(source.replace(marker,
    '  B._testRoadScenes={beginGpuScene,finishGpuScene,drawRearview,newState};\n' + marker), host);
  return { ...f.window.BARCODE._testRoadScenes, cinematics: f.window.BARCODE.CacheRoadCinematics };
}

module.exports = { fixture, nativeContext, NativePath, rendererBytes, contextBytes,
  cinematicsBytes, roadBytes, bankBytes, textureWorkerBytes, compressedBank, levelSourceDescriptors, roadSceneApi, pinnedPixi };
