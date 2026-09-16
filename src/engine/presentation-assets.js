// Shared raster cache. One bounded pinned/bundled attempt per asset;
// no canvases, timers, frame loops or gameplay state. Reused across restarts.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/presentation-assets.js', exports: ['BARCODE.PresentationAssets'], dependencies: [] });
(function() {
  const B = window.BARCODE = window.BARCODE || {};
  const root = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/e35ebe3ae8bfc547815a5a93c952424fa067af5d/';
  const rebuildRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/a155d4283a12df4dd7ea0f8cb9eb0bf985644fa8/';
  const railRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/08d5720f31020fd846ea6b93c76988ffef6e3fbe/';
  const streetRoot = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/1891ebb4e061971362817832e942ef9fbe05d15a/';
  const entries = {
    studioCat: { path: 'assets/presentation/studio-cat.webp', columns: 2, rows: 2, frames: 4, ax: 0.5, ay: 0.9375 },
    directionArrow: { path: 'assets/presentation/direction-arrow.webp', columns: 1, rows: 1, frames: 1, ax: 0.5, ay: 0.5 },
    bossPulse: { path: 'assets/presentation/boss-pulse.webp', columns: 2, rows: 2, frames: 4, crop: [10, 95, 236, 145], ax: 0.5, ay: 1, smooth: true },
    hudPortrait: { path: 'assets/studies/visual-overhaul/prepared/hud-portrait.webp', root: 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/a4c1b7cf6fec0a083a4812ae1ea76edef45a5911/', columns: 1, rows: 1, frames: 1, ax: 0.5, ay: 0.5, smooth: true },
    thinWallRail: { path:'assets/thin-rails/wall.webp', root:railRoot, columns:1, rows:1, frames:1, ax:0.5, ay:0.5, smooth:true },
    thinPavementRail: { path:'assets/thin-rails/pavement.webp', root:railRoot, columns:1, rows:1, frames:1, ax:0.5, ay:0.5, smooth:true },
    thinRailElbow: { path:'assets/thin-rails/elbow.webp', root:railRoot, columns:1, rows:1, frames:1, ax:0.5, ay:0.5, smooth:true },
    thinRailCap: { path:'assets/thin-rails/cap.webp', root:railRoot, columns:1, rows:1, frames:1, ax:0.5, ay:0.5, smooth:true },
    rooftopDrone: { path:'assets/level1-rebuild/rooftop-drone.webp', root:rebuildRoot, columns:4, rows:2, frames:8, ax:0.5, ay:0.5, smooth:true },
    broadcastTerminal: { path:'assets/street-hardware/broadcast-terminal.webp', root:streetRoot, columns:1, rows:1, frames:1, ax:0, ay:0, smooth:true },
    gateHardware1: { path:'assets/street-hardware/gate-1.webp', root:streetRoot, columns:2, rows:1, frames:2, ax:0, ay:0, smooth:true },
    gateHardware2: { path:'assets/street-hardware/gate-2.webp', root:streetRoot, columns:2, rows:1, frames:2, ax:0, ay:0, smooth:true },
    gateHardware3: { path:'assets/street-hardware/gate-3.webp', root:streetRoot, columns:2, rows:1, frames:2, ax:0, ay:0, smooth:true },
    gateHardware4: { path:'assets/street-hardware/gate-4.webp', root:streetRoot, columns:2, rows:1, frames:2, ax:0, ay:0, smooth:true },
  };
  const cache = {};
  function preload() {
    if (typeof window.Image !== 'function') return;
    for (const [key, entry] of Object.entries(entries)) {
      if (cache[key]) continue;
      const image = new window.Image();
      const state = cache[key] = { image, ready: false, fallback: false };
      image.onload = () => { state.ready = image.naturalWidth > 0 && image.naturalHeight > 0; image.onload = null; image.onerror = null; };
      image.onerror = () => {
        if (!state.fallback) { state.fallback = true; image.src = entry.path; }
        else { image.onload = null; image.onerror = null; }
      };
      image.src = (entry.root ?? root) + entry.path;
    }
  }
  function draw(key, ctx, { x = 0, y = 0, width = 96, height, frame = 0, flip = false } = {}) {
    const entry = entries[key], state = cache[key];
    if (!entry || !state?.ready) return false;
    const image = state.image, fw = image.naturalWidth / entry.columns, fh = image.naturalHeight / entry.rows;
    const index = Math.max(0, Math.floor(frame)) % entry.frames;
    const [sx, sy, sw, sh] = entry.crop || [0, 0, fw, fh];
    const h = height ?? width * sh / sw;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = !!entry.smooth;
    ctx.drawImage(image, index % entry.columns * fw + sx, Math.floor(index / entry.columns) * fh + sy, sw, sh,
      -width * entry.ax, -h * entry.ay, width, h);
    ctx.restore(); return true;
  }
  B.PresentationAssets = { preload, draw, ready: key => !!cache[key]?.ready };
  preload();
})();
