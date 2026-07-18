// Opt-in Level 1 debug panel/API. Enabled only with ?debugLevel1=1.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/level-01-debug.js', exports: ['DEBUG.level1'], dependencies: ['sector1Progression'] });

(function() {
  'use strict';
  const enabled = typeof window !== 'undefined' && window.location && new URLSearchParams(window.location.search).get('debugLevel1') === '1';
  window.DEBUG = window.DEBUG || {};
  if (!enabled) return;
  const overlayState = { enabled: false, spawns: true, actors: true, platforms: true, camera: true };
  function prog() { return window.sector1Progression || (window.initSector1Progression && window.initSector1Progression(window.player)); }
  function call(name, ...args) { const p = prog(); const fn = p && p[name]; return typeof fn === 'function' ? fn.apply(p, args) : null; }
  function help() { return ['help','status','skipTutorial','gotoEncounter(1..4)','clearEncounter','setMissionKills(value)','completeEncounters','gotoJammer','damageJammer(amount=1)','destroyJammer','triggerBossIntro','overlay(options)','reset']; }
  function status() { return prog()?.getDiagnostics?.() || null; }
  function overlay(options) { if (typeof options === 'boolean') overlayState.enabled = options; else if (options) Object.assign(overlayState, options); else overlayState.enabled = !overlayState.enabled; return Object.assign({}, overlayState); }
  function reset() { prog()?.reset?.(); if (window.enemyManager?.clear) window.enemyManager.clear(); return status(); }
  function drawRect(ctx, r, color) { ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.strokeRect(r.x ?? r.left, r.y ?? r.top, r.w ?? r.width ?? (r.right-r.left), r.h ?? r.height ?? (r.bottom-r.top)); }
  function drawOverlay(ctx) {
    if (!overlayState.enabled || !ctx) return;
    ctx.save(); ctx.font = '12px monospace';
    const layout = window.BARCODE?.LEVEL_01_LAYOUT;
    if (overlayState.platforms && layout) layout.STAGE_SURFACES.forEach(s => { drawRect(ctx, s, '#00ffff'); ctx.fillStyle='#00ffff'; ctx.fillText(s.id, s.x, s.y-4); });
    if (overlayState.actors && window.player) { const b=window.player.getGameplayBody?.(); const v=window.player.getVisualBounds?.(); if (b) drawRect(ctx,b,'#00ff00'); if (v) drawRect(ctx,v,'#ffff00'); ctx.fillRect(window.player.position.x-3, window.player.position.y-3, 6, 6); }
    if (overlayState.actors && window.enemyManager) (window.enemyManager.enemies||[]).forEach(e=>{ if(!e.active) return; const b=e.getGameplayBody?.(); const v=e.getVisualBounds?.(); if(b) drawRect(ctx,b,e.isSpawnProtected?.()?'#ffffff':'#ff9900'); if(v) drawRect(ctx,v,'#ff00ff'); ctx.fillText(e.type+(e._jammerReinforcement?' R':''), e.position.x-24, e.position.y-8); });
    const env=window.BARCODE?.JammerEnvironment; const jb=env?.getAimBounds?.(); if(jb) { drawRect(ctx,jb,'#ff00ff'); ctx.fillText('jammer aim', jb.x, jb.y-4); }
    const p=prog(); if (p?.boss && window.BARCODE?.Level01Presentation?.bossTransform) drawRect(ctx, window.BARCODE.Level01Presentation.bossTransform(p.boss), '#ff3300');
    if (overlayState.camera && p?.getVisibleWorldBounds) { const vb=p.getVisibleWorldBounds(); ctx.strokeStyle='#ffffff'; ctx.strokeRect(vb.left, 40, vb.right-vb.left, 80); ctx.fillText('camera visible world', vb.left, 36); }
    if (overlayState.spawns && p?.lastSpawnPlan) { const a=p.lastSpawnPlan.accepted; ctx.strokeStyle='#00ff88'; ctx.beginPath(); ctx.arc(a.x,a.y,20,0,Math.PI*2); ctx.stroke(); }
    ctx.restore();
  }
  window.DEBUG.level1 = { help, status, skipTutorial:()=>call('debugSkipTutorial'), gotoEncounter:n=>call('debugGotoEncounter',n), clearEncounter:()=>call('debugClearEncounter'), setMissionKills:v=>call('debugSetMissionKills',v), completeEncounters:()=>call('debugSetMissionKills',20), gotoJammer:()=>call('debugGotoJammer'), damageJammer:(a=1)=>call('debugDamageJammer',a), destroyJammer:()=>call('debugDestroyJammer'), triggerBossIntro:()=>call('debugTriggerBossIntro'), overlay, reset, drawOverlay };
  function panelButton(text, fn) { const b=document.createElement('button'); b.textContent=text; b.onclick=fn; b.style.cssText='display:block;margin:3px;width:190px;background:#111;color:#0ff;border:1px solid #0ff;font:12px monospace;'; return b; }
  function makePanel() { const d=document.createElement('div'); d.id='level1-debug-panel'; d.style.cssText='display:none;position:fixed;right:12px;top:80px;z-index:99999;background:rgba(0,0,0,.85);border:1px solid #0ff;padding:8px;color:#fff;font:12px monospace;'; d.append('Level 1 Debug'); d.append(panelButton('Skip Tutorial',()=>window.DEBUG.level1.skipTutorial())); [1,2,3,4].forEach(n=>d.append(panelButton('Encounter '+n,()=>window.DEBUG.level1.gotoEncounter(n)))); d.append(panelButton('Clear Encounter',()=>window.DEBUG.level1.clearEncounter())); d.append(panelButton('Go To Jammer / 20 Kills',()=>window.DEBUG.level1.gotoJammer())); d.append(panelButton('Damage Jammer Once',()=>window.DEBUG.level1.damageJammer(1))); d.append(panelButton('Destroy Jammer / Run Boss Intro',()=>window.DEBUG.level1.destroyJammer())); d.append(panelButton('Toggle Geometry Overlay',()=>window.DEBUG.level1.overlay())); d.append(panelButton('Reset Level 1',()=>window.DEBUG.level1.reset())); document.body.appendChild(d); }
  document.addEventListener('DOMContentLoaded', makePanel);
  document.addEventListener('keydown', e => { if (e.key === 'F1') { e.preventDefault(); const p=document.getElementById('level1-debug-panel'); if(p) p.style.display = p.style.display === 'none' ? 'block' : 'none'; } });
})();
