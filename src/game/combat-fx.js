// Frame-owned feedback. These shapes describe resolved actions; they never
// deal damage, advance the music, or own a timer/render loop.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/combat-fx.js', exports: ['BARCODE.CombatFX'], dependencies: ['BARCODE.MusicTransport'] });
(function() {
  const BARCODE = window.BARCODE = window.BARCODE || {};
  const TAU = Math.PI * 2;
  const colors = { virus: '#efffff', corrupted: '#ff65e8', firewall: '#ffac48', boss: '#77ffe1', broadcast_jammer: '#92fff1' };
  class CombatFX {
    constructor() { this.reset(); }
    reset() { this.events = []; this.timeMs = 0; this.sceneKick = 0; this.serial = 0; this.lastCombo = 0; }
    add(event) {
      if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return;
      if (this.events.length >= 96) this.events.shift();
      this.events.push({ age: 0, duration: 420, color: '#77ffe1', id: ++this.serial, ...event });
    }
    update(ms) {
      this.timeMs += ms;
      this.sceneKick = Math.max(0, this.sceneKick - ms / 600);
      let write = 0;
      for (const event of this.events) {
        event.age += ms;
        if (event.age < event.duration) this.events[write++] = event;
      }
      this.events.length = write;
    }
    beat() {
      const time = window.audioSystem?.context?.currentTime;
      const sample = Number.isFinite(time) ? BARCODE.MusicTransport?.sample?.(time) : null;
      return sample?.running && sample.grid ? { fraction: sample.grid.beatFloat % 1, index: Math.floor(sample.grid.beatFloat) } : { fraction: 1, index: 0 };
    }
    visible(x, y, radius = 100) {
      const center = window.gameCamera?.centerX ?? ((window.gameCamera?.x || 0) + 960);
      const zoom = Math.max(0.4, window.renderer?.zoomLevel || 1);
      return x + radius >= center - 960 / zoom && x - radius <= center + 960 / zoom && y + radius >= -500 && y - radius <= 1200;
    }
    mode(entering, player = window.player) {
      if (!player) return;
      this.lastCombo = 0;
      this.sceneKick = entering ? 1 : 0;
      this.add({ kind: 'entry', x: player.position.x, y: player.position.y + 72, duration: entering ? 650 : 220, radius: entering ? 210 : 95, color: entering ? '#7cffe2' : '#b0bed6' });
      window.audioSystem?.playCombatCue?.(entering ? 'enter' : 'exit');
    }
    contact(type, x, y, direction = 1, defeated = false, perfect = false) {
      this.add({ kind: 'impact', x, y, direction: direction || 1, material: type, defeated, perfect, color: colors[type] || '#7cffe2', duration: defeated ? 640 : 280 });
    }
    resolved(result, player, range) {
      if (!player || !result.timing?.available) return;
      const combo = window.rhythmSystem?.combo || 0;
      if (!result.ok) { this.lastCombo = combo; return; }
      const x = player.position.x, y = player.position.y;
      const perfect = result.timing.timing === 'perfect';
      const color = result.reason === 'boss-guarded' ? '#ffbe70' : result.targets.length ? '#7cffe2' : '#8babb8';
      this.sceneKick = result.targets.length ? 1 : 0.4;
      this.add({ kind: 'pulse', x, y, radius: range, color, duration: perfect ? 340 : 270, perfect });
      for (const target of result.targets) {
        this.add({ kind: 'link', x, y: y - 24, tx: target.x, ty: target.contactY ?? target.y, color: colors[target.type] || color, duration: perfect ? 200 : 150, perfect });
        if (target.type === 'boss' || target.type === 'broadcast_jammer') this.contact(target.type, target.x, target.contactY ?? target.y, Math.sign(target.x - x), false, perfect);
      }
      if (result.targets.length) player.impactHoldMs = perfect ? 45 : 25;
      if (result.reason === 'boss-guarded') {
        const boss = window.sector1Progression?.boss;
        if (boss) this.add({ kind: 'guard', x: boss.x, y: boss.y, duration: 260, color: '#ffbe70', direction: Math.sign(x - boss.x) || -1 });
      }
      window.audioSystem?.playCombatCue?.(Number.isFinite(result.liftCharges) ? 'lift' : result.reason === 'boss-guarded' ? 'guard' : result.targets.length ? (perfect ? 'perfect' : 'hit') : 'empty');
      if ((combo >= 5 && this.lastCombo < 5) || (combo >= 10 && this.lastCombo < 10)) {
        const tier = combo >= 10 ? 10 : 5;
        this.add({ kind: 'combo', x, y: y - 10, tier, duration: 540, color: tier === 10 ? '#ff8af3' : '#7cffe2' });
        player.afterimageMs = 220;
        window.audioSystem?.playCombatCue?.(tier === 10 ? 'combo10' : 'combo5');
      }
      this.lastCombo = combo;
    }
    drawRhythmField(ctx, x, y) {
      if (!this.visible(x, y, 430)) return;
      const { fraction, index } = this.beat();
      const pulse = Math.pow(1 - fraction, 3);
      const combo = window.rhythmSystem?.combo || 0;
      const range = window.rhythmSystem?.getAuthoritativeDamageRadius?.() || 250;
      ctx.save();
      // The complete thin circle uses the same origin/radius as the ordinary
      // damage query. The compact foot field conveys stance, not attack reach.
      ctx.strokeStyle = `rgba(109,255,226,${0.12 + pulse * 0.12})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]); ctx.beginPath(); ctx.arc(x, y, range, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      if ((BARCODE.signalAmpCharges || 0) > 0) {
        ctx.strokeStyle = 'rgba(244,151,255,0.22)'; ctx.setLineDash([3, 15]);
        ctx.beginPath(); ctx.arc(x, y, 430, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      }
      const foot = y + 72;
      ctx.fillStyle = `rgba(38,234,218,${0.09 + pulse * 0.09})`;
      ctx.beginPath(); ctx.ellipse(x, foot, 85 + pulse * 20, 20, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = combo >= 10 ? '#ffa0ed' : '#81ffe5'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(x, foot, 68 + pulse * 16, 16 + pulse * 4, 0, 0, TAU); ctx.stroke();
      // Stable, beat-indexed short tendrils remain close to the performer.
      ctx.globalAlpha = 0.45 + pulse * 0.3; ctx.lineWidth = 2;
      for (let side = -1; side <= 1; side += 2) {
        ctx.beginPath(); ctx.moveTo(x + side * 32, foot - 12);
        for (let i = 1; i <= 5; i++) ctx.lineTo(x + side * (32 + Math.sin(index * 1.7 + i) * (10 + Math.min(combo, 10))), foot - 12 - i * (11 + pulse * 3));
        ctx.stroke();
      }
      ctx.restore();
    }
    draw(ctx) {
      for (const e of this.events) {
        if (!this.visible(e.x, e.y, e.radius || (e.tx ? Math.abs(e.tx - e.x) + 80 : 200))) continue;
        const t = e.age / e.duration, fade = 1 - t;
        ctx.save(); ctx.globalAlpha = fade; ctx.strokeStyle = e.color; ctx.fillStyle = e.color; ctx.lineWidth = e.perfect ? 4 : 2;
        if (e.kind === 'entry') {
          ctx.beginPath(); ctx.ellipse(e.x, e.y, 30 + t * e.radius, 8 + t * 32, 0, 0, TAU); ctx.stroke();
          for (let i = 0; i < 12; i++) ctx.fillRect(e.x - 58 + i * 10, e.y - 6 - Math.sin(i * 1.8) * 8 - t * 65, i % 3 ? 3 : 5, 12 * fade);
        } else if (e.kind === 'pulse') {
          ctx.globalAlpha = fade * 0.55;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.radius * (0.7 + 0.3 * t), 0, TAU); ctx.stroke();
        } else if (e.kind === 'link') {
          if (!Number.isFinite(e.tx) || !Number.isFinite(e.ty)) { ctx.restore(); continue; }
          ctx.beginPath(); ctx.moveTo(e.x, e.y);
          for (let i = 1; i < 8; i++) ctx.lineTo(e.x + (e.tx - e.x) * i / 8, e.y + (e.ty - e.y) * i / 8 + Math.sin(e.id * 2 + i * 4.1) * 12 * fade);
          ctx.lineTo(e.tx, e.ty); ctx.stroke();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.tx, e.ty, 12 + t * 10, 0, TAU); ctx.stroke();
        } else if (e.kind === 'impact') {
          const radius = (e.defeated ? 90 : 42) * t + 5;
          ctx.globalAlpha = fade * 0.7; ctx.beginPath(); ctx.arc(e.x, e.y, radius, 0, TAU); ctx.stroke();
          const count = e.defeated ? 18 : 8;
          for (let i = 0; i < count; i++) {
            const angle = i * 2.39996;
            const distance = (e.defeated ? 145 : 56) * t * (0.4 + (i % 5) / 8);
            const px = e.x + Math.cos(angle) * distance + e.direction * t * 35;
            const py = e.y + Math.sin(angle) * distance + (e.material === 'firewall' ? 80 * t * t : -t * 14);
            if (e.material === 'corrupted') ctx.fillRect(px, py, (i % 3 + 1) * 8 * fade, 3);
            else if (e.material === 'firewall') { ctx.beginPath(); ctx.moveTo(px, py - 5 * fade); ctx.lineTo(px + 5 * fade, py + 5); ctx.lineTo(px - 6 * fade, py + 3); ctx.closePath(); ctx.fill(); }
            else ctx.fillRect(px, py, 3 + 4 * fade, 3 + 4 * fade);
          }
        } else if (e.kind === 'guard') {
          const angle = e.direction < 0 ? Math.PI : 0;
          ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, 65 + t * 25, angle - 0.85, angle + 0.85); ctx.stroke();
        } else if (e.kind === 'combo') {
          for (let i = 0; i < 18; i++) {
            const angle = i * TAU / 18, radius = 55 + t * (e.tier === 10 ? 140 : 95);
            ctx.save(); ctx.translate(e.x + Math.cos(angle) * radius, e.y + Math.sin(angle) * radius * 0.7); ctx.rotate(angle);
            ctx.fillRect(0, -2, (i % 3 + 1) * 5, 4); ctx.restore();
          }
        }
        ctx.restore();
      }
    }
  }
  BARCODE.CombatFX = CombatFX;
  BARCODE.combatFX = new CombatFX();
})();
