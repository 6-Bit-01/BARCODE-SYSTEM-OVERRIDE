// Shared raster cache. Three images, one bounded pinned/bundled attempt each;
// no canvases, timers, frame loops or gameplay state. Reused across restarts.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/presentation-assets.js', exports: ['BARCODE.PresentationAssets'], dependencies: [] });
(function() {
  const B = window.BARCODE = window.BARCODE || {};
  const root = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/e35ebe3ae8bfc547815a5a93c952424fa067af5d/';
  const entries = {
    studioCat: { path: 'assets/presentation/studio-cat.webp', columns: 2, rows: 2, frames: 4, ax: 0.5, ay: 0.9375 },
    directionArrow: { path: 'assets/presentation/direction-arrow.webp', columns: 1, rows: 1, frames: 1, ax: 0.5, ay: 0.5 },
    bossPulse: { path: 'assets/presentation/boss-pulse.webp', columns: 2, rows: 2, frames: 4, crop: [10, 95, 236, 145], ax: 0.5, ay: 1 }
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
      image.src = root + entry.path;
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
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, index % entry.columns * fw + sx, Math.floor(index / entry.columns) * fh + sy, sw, sh,
      -width * entry.ax, -h * entry.ay, width, h);
    ctx.restore(); return true;
  }
  B.PresentationAssets = { preload, draw };
  preload();
})();
