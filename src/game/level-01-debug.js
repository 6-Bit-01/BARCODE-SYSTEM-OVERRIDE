// Opt-in Level 1 debug panel/API. Enabled only with ?debugLevel1=1.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/level-01-debug.js', exports: ['DEBUG.level1'], dependencies: ['sector1Progression'] });

(function() {
  'use strict';
  const enabled = typeof window !== 'undefined' && window.location && new URLSearchParams(window.location.search).get('debugLevel1') === '1';
  window.DEBUG = window.DEBUG || {};
  window.BARCODE = window.BARCODE || {};
  window.BARCODE.DEBUG_LEVEL_1_ENABLED = enabled;
  if (!enabled) return;

  const overlayState = { enabled: false, spawns: true, actors: true, platforms: true, camera: true, ground: true };
  function assertEnabled() { if (!window.BARCODE.DEBUG_LEVEL_1_ENABLED) return false; return true; }
  function prog() { return window.sector1Progression || (window.initSector1Progression && window.initSector1Progression(window.player)); }
  function call(name, ...args) { if (!assertEnabled()) return { ok: false, reason: 'debug-disabled' }; const p = prog(); const fn = p && p[name]; return typeof fn === 'function' ? fn.apply(p, args) : null; }
  function help() { return ['help','status','skipTutorial','gotoEncounter(1..4)','clearEncounter','setMissionKills(value)','completeEncounters','gotoJammer','damageJammer(amount=1)','destroyJammer','triggerBossIntro','overlay(options)','reset']; }
  function status() { return prog()?.getDiagnostics?.() || null; }
  function overlay(options) { if (!assertEnabled()) return { ok: false, reason: 'debug-disabled' }; if (typeof options === 'boolean') overlayState.enabled = options; else if (options) Object.assign(overlayState, options); else overlayState.enabled = !overlayState.enabled; return Object.assign({}, overlayState); }
  function reset() { if (!assertEnabled()) return { ok: false, reason: 'debug-disabled' }; const result = prog()?.debugResetLevel1?.() || prog()?.reset?.(); overlayState.enabled = false; if (window.enemyManager?.clear) window.enemyManager.clear(); if (window.jammerIndicator?.reset) window.jammerIndicator.reset(); return result || status(); }
  function projectRect(r) { const cam = window.BARCODE?.Level01Camera; if (!cam) return r; const p1 = cam.worldToScreen({ x: r.x ?? r.left, y: r.y ?? r.top }); const p2 = cam.worldToScreen({ x: (r.x ?? r.left) + (r.w ?? r.width ?? (r.right-r.left)), y: (r.y ?? r.top) + (r.h ?? r.height ?? (r.bottom-r.top)) }); return { x: p1.x, y: p1.y, w: p2.x - p1.x, h: p2.y - p1.y } }
  function drawRect(ctx, r, color) { const pr = projectRect(r); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(pr.x, pr.y, pr.w, pr.h); }
  function drawPoint(ctx, x, y, color) { const p = window.BARCODE?.Level01Camera?.worldToScreen ? window.BARCODE.Level01Camera.worldToScreen({ x, y }) : { x, y }; ctx.fillStyle = color; ctx.fillRect(p.x - 3, p.y - 3, 6, 6); }
  function drawOverlay(ctx) {
    if (!overlayState.enabled || !ctx) return;
    ctx.save(); ctx.font = '12px monospace';
    const layout = window.BARCODE?.LEVEL_01_LAYOUT;
    if (overlayState.ground && layout) { const left = { x: 0, y: layout.GROUND_Y, w: layout.WORLD_WIDTH, h: 1 }; drawRect(ctx, left, '#00ffff'); }
    if (overlayState.platforms && layout) layout.STAGE_SURFACES.forEach(s => drawRect(ctx, s, '#00ffff'));
    if (overlayState.actors && window.player) { const b=window.player.getGameplayBody?.(); const v=window.player.getVisualBounds?.(); if (b) drawRect(ctx,b,'#00ff00'); if (v) drawRect(ctx,v,'#ffff00'); drawPoint(ctx, window.player.position.x, window.player.position.y, '#ffff00'); }
    if (overlayState.actors && window.enemyManager) (window.enemyManager.enemies||[]).forEach(e=>{ if(!e.active) return; const b=e.getGameplayBody?.(); const v=e.getVisualBounds?.(); if(b) drawRect(ctx,b,e.isSpawnProtected?.()?'#ffffff':'#ff9900'); if(v) drawRect(ctx,v,'#ff00ff'); if(e._entranceTarget) drawPoint(ctx, e._entranceTarget.x, e._entranceTarget.y, '#00ff88'); });
    const env=window.BARCODE?.JammerEnvironment; const jb=env?.getAimBounds?.(); if(jb) drawRect(ctx,jb,'#ff00ff');
    const p=prog(); if (p?.boss && window.BARCODE?.Level01Presentation?.bossTransform) drawRect(ctx, window.BARCODE.Level01Presentation.bossTransform(p.boss), '#ff3300');
    if (overlayState.camera && window.BARCODE?.Level01Camera) { const vb=window.BARCODE.Level01Camera.visibleWorldBounds(); drawRect(ctx, { x: vb.left, y: 0, w: vb.right-vb.left, h: layout?.VIEWPORT?.height || 1080 }, '#ffffff'); }
    if (overlayState.spawns && p?.lastSpawnPlan) { const a=p.lastSpawnPlan.accepted; drawPoint(ctx, a.x, a.y, '#00ff88'); }
    ctx.restore();
  }
  window.DEBUG.level1 = { help, status, skipTutorial:()=>call('debugSkipTutorial'), gotoEncounter:n=>call('debugGotoEncounter',n), clearEncounter:()=>call('debugClearEncounter'), setMissionKills:v=>call('debugSetMissionKills',v), completeEncounters:()=>call('debugCompleteEncounters'), gotoJammer:()=>call('debugGotoJammer'), damageJammer:(a=1)=>call('debugDamageJammer',a), destroyJammer:()=>call('debugDestroyJammer'), triggerBossIntro:()=>call('debugTriggerBossIntro'), overlay, reset, drawOverlay };
  function panelButton(text, fn) { const b=document.createElement('button'); b.textContent=text; b.onclick=fn; b.style.cssText='display:block;margin:3px;width:190px;background:#111;color:#0ff;border:1px solid #0ff;font:12px monospace;'; return b; }
  function makePanel() { if (!assertEnabled() || !document.body || document.getElementById('level1-debug-panel')) return; const d=document.createElement('div'); d.id='level1-debug-panel'; d.style.cssText='display:none;position:fixed;right:12px;top:80px;z-index:99999;background:rgba(0,0,0,.85);border:1px solid #0ff;padding:8px;color:#fff;font:12px monospace;'; d.append('Level 1 Debug'); d.append(panelButton('Skip Tutorial',()=>window.DEBUG.level1.skipTutorial())); [1,2,3,4].forEach(n=>d.append(panelButton('Encounter '+n,()=>window.DEBUG.level1.gotoEncounter(n)))); d.append(panelButton('Clear Encounter',()=>window.DEBUG.level1.clearEncounter())); d.append(panelButton('Go To Jammer / 20 Kills',()=>window.DEBUG.level1.gotoJammer())); d.append(panelButton('Damage Jammer Once',()=>window.DEBUG.level1.damageJammer(1))); d.append(panelButton('Destroy Jammer / Run Boss Intro',()=>window.DEBUG.level1.destroyJammer())); d.append(panelButton('Toggle Geometry Overlay',()=>window.DEBUG.level1.overlay())); d.append(panelButton('Reset Level 1',()=>window.DEBUG.level1.reset())); document.body.appendChild(d); }
  document.addEventListener('DOMContentLoaded', makePanel);
  document.addEventListener('keydown', e => { if (!assertEnabled()) return; if (e.key === 'F1') { e.preventDefault(); const p=document.getElementById('level1-debug-panel'); if(p) p.style.display = p.style.display === 'none' ? 'block' : 'none'; } });
})();
