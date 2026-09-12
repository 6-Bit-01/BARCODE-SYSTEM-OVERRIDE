// UI management for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/ui-manager.js',
  exports: ['drawGameUI'],
  dependencies: ['renderer', 'gameState', 'player', 'sector1Progression', 'lostDataSystem', 'hackingSystem', 'rhythmSystem', 'objectivesSystem', 'loreSystem', 'jammerIndicator', 'tutorialSystem']
});

// Boss-intro presentation is intentionally derived from the progression owner's
// public state. UI visibility is never stored here, so objectives and diagnostics
// return automatically on the first frame after the camera-return phase ends.
const BOSS_CINEMATIC_PRESENTATION_STATES = new Set([
  'jammer_destroyed_freeze',
  'enemy_purge',
  'camera_pan',
  'boss_walk_in',
  'boss_close_up',
  'boss_flourish',
  'boss_hold',
  'camera_return',
  'boss_camera_return'
]);

const isBossCinematicPresentationActive = () => {
  const progression = window.sector1Progression;
  if (!progression) return false;

  if (typeof progression.isBossCinematicActive === 'function') {
    return progression.isBossCinematicActive();
  }
  if (typeof progression.isBossIntroCinematicActive === 'function') {
    return progression.isBossIntroCinematicActive();
  }

  const state = String(progression.state || '');
  if (BOSS_CINEMATIC_PRESENTATION_STATES.has(state)) return true;

  // Keep compatibility with a named return phase supplied by the progression
  // owner without coupling the UI to its exact implementation spelling.
  return progression.jammerDestroyedNotified === true &&
    /(?:camera.*return|return.*camera|cinematic.*return)/.test(state);
};

const encounterPresentation = (() => {
  const presentation = {
    owner: null,
    lastState: '',
    lastActiveEncounterId: null,
    clearedEncounterIds: new Set(),
    cue: null
  };

  const now = () => Number.isFinite(window.gameState?.gameTime)
    ? window.gameState.gameTime
    : (window.performance && typeof window.performance.now === 'function' ? window.performance.now() : Date.now());

  const definitions = () => Array.isArray(window.Sector1Progression?.ENCOUNTERS)
    ? window.Sector1Progression.ENCOUNTERS
    : [];

  const definitionFor = id => definitions().find(encounter => encounter.id === id) || null;

  const waveNumberFor = id => {
    const index = definitions().findIndex(encounter => encounter.id === id);
    return index >= 0 ? index + 1 : null;
  };

  const reset = owner => {
    presentation.owner = owner || null;
    presentation.lastState = owner?.state || '';
    presentation.lastActiveEncounterId = null;
    presentation.clearedEncounterIds.clear();
    presentation.cue = null;
  };

  const beginCue = (kind, encounterId) => {
    const definition = definitionFor(encounterId);
    const wave = waveNumberFor(encounterId);
    if (!definition || !wave) return;
    presentation.cue = {
      kind,
      label: definition.label,
      wave,
      total: definitions().length,
      startedAt: now(),
      duration: kind === 'start' ? 1600 : 850
    };
  };

  const update = owner => {
    if (owner !== presentation.owner) reset(owner);
    if (!owner || !owner.missionStarted || owner.state === 'tutorial') {
      if (presentation.lastActiveEncounterId || presentation.cue) reset(owner);
      return;
    }

    const currentState = String(owner.state || '');
    const previousState = presentation.lastState;
    const activeEncounterId = /^encounter_\d+$/.test(String(owner.activeEncounterId || ''))
      ? owner.activeEncounterId
      : null;

    if (previousState && previousState !== currentState &&
        presentation.lastActiveEncounterId === previousState &&
        !presentation.clearedEncounterIds.has(previousState)) {
      presentation.clearedEncounterIds.add(previousState);
      beginCue('clear', previousState);
    }

    if (activeEncounterId && activeEncounterId !== presentation.lastActiveEncounterId) {
      presentation.lastActiveEncounterId = activeEncounterId;
      beginCue('start', activeEncounterId);
    }

    presentation.lastState = currentState;
  };

  const cueAlpha = (elapsed, duration) => {
    const fadeIn = Math.min(1, elapsed / 160);
    const fadeOut = Math.min(1, Math.max(0, duration - elapsed) / 260);
    return Math.max(0, Math.min(fadeIn, fadeOut));
  };

  const drawStartCue = (ctx, cue, elapsed, alpha) => {
    const easedY = 278 - Math.max(0, 1 - elapsed / 260) * 10;
    const width = 500;
    const height = 62;
    const x = (1920 - width) / 2;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 12, 28, 0.88)';
    ctx.fillRect(x, easedY, width, height);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, easedY, width, height);

    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`WAVE ${cue.wave} / ${cue.total}`, 960, easedY + 9);

    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 22px 'Orbitron', monospace";
    ctx.fillText(String(cue.label || '').toUpperCase(), 960, easedY + 29);
  };

  const drawClearCue = (ctx, cue, elapsed, alpha) => {
    const progress = Math.max(0, Math.min(1, elapsed / cue.duration));
    const halfLine = 90 + 180 * Math.sin(Math.PI * progress);
    const y = 290;

    ctx.globalAlpha = alpha * 0.78;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(960 - halfLine, y + 28);
    ctx.lineTo(960 + halfLine, y + 28);
    ctx.stroke();

    ctx.globalAlpha = alpha;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#bfffff';
    ctx.font = "bold 18px 'Orbitron', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${String(cue.label || '').toUpperCase()} CLEARED`, 960, y);
  };

  const draw = ctx => {
    const cue = presentation.cue;
    if (!ctx || !cue) return;
    const elapsed = now() - cue.startedAt;
    if (elapsed >= cue.duration) {
      presentation.cue = null;
      return;
    }

    const alpha = cueAlpha(elapsed, cue.duration);
    ctx.save();
    if (cue.kind === 'clear') drawClearCue(ctx, cue, elapsed, alpha);
    else drawStartCue(ctx, cue, elapsed, alpha);
    ctx.restore();
  };

  return { update, draw };
})();

// Main UI drawing function
window.drawGameUI = function(ctx) {
  // CRITICAL: Reset text alignment to default at start of drawUI
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  // Check if tutorial is complete - only show objectives after tutorial
  let tutorialCompleted = false;
  
  if (!window.tutorialSystem) {
    tutorialCompleted = true;
  } else if (typeof window.tutorialSystem.isCompleted === 'function' && window.tutorialSystem.isCompleted()) {
    tutorialCompleted = true;
  } else if (window.tutorialSystem.completed && !window.tutorialSystem.active) {
    tutorialCompleted = true;
  }

  const bossCinematicActive = isBossCinematicPresentationActive();
  encounterPresentation.update(window.sector1Progression);
  
  // Draw health and basic UI elements
  drawBasicUI(ctx);
  window.BARCODE?.combatFX?.drawDamageHUD(ctx, window.player, 50, 50, 300, 30);
  window.BARCODE?.combatFX?.drawAmpHUD(ctx);
  
  // Draw objectives after tutorial completion
  if (tutorialCompleted && !bossCinematicActive && !['boss_ready', 'boss_combat', 'level_complete'].includes(window.sector1Progression?.state)) {
    drawObjectives(ctx);
  }
  
  // Draw hacking interface
  if (!bossCinematicActive && !window.gameState.gameOver && !window.gameState.victory && window.hackingSystem && (window.hackingSystem.isActive?.() || window.hackingSystem.feedback || window.hackingSystem.resultFx)) {
    window.hackingSystem.draw(ctx);
  }
  
  // Draw rhythm UI elements
  if (!window.hackingSystem?.isActive?.()) drawRhythmUI(ctx);
  
  // Draw collection message
  if (window.gameState.collectionMessage && window.gameState.collectionMessage.timer > 0) {
    drawCollectionMessage(ctx);
  }

  if (!bossCinematicActive) {
    if (!window.hackingSystem?.isActive?.()) encounterPresentation.draw(ctx);
  }
  
  drawSector1BossUI(ctx);
  const attackFeedback = window.BARCODE?.playerCombat?.getFeedback?.();
  if (attackFeedback && !bossCinematicActive && !window.gameState.gameOver && !window.gameState.victory && !window.hackingSystem?.isActive?.()) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 8, 16, 0.92)';
    ctx.fillRect(620, 220, 680, 38);
    ctx.fillStyle = attackFeedback.color;
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(attackFeedback.text, 960, 239, 650);
    ctx.restore();
  }

  window.BARCODE?.combatFX?.drawFragmentFlights(ctx);

  // Draw game over screen
  if (window.gameState.gameOver) {
    drawGameOver(ctx);
  }
  
  // Draw pause screen
  if (window.gameState.paused) {
    drawPauseScreen(ctx);
  }
  
  // Draw lore messages
  drawLoreMessages(ctx);
  
  // Draw jammer indicator
  if (!bossCinematicActive && window.jammerIndicator && typeof window.jammerIndicator.draw === 'function') {
    try {
      window.jammerIndicator.draw(ctx);
    } catch (error) {
      console.error('Error drawing jammer indicator:', error?.message || error);
    }
  }

  // Session-only Makko diagnostics. This stays in the UI pass so the overlay uses
  // the same world-to-screen projection without changing gameplay rendering.
  if (!bossCinematicActive && window.DEBUG?.level1?.drawOverlay) {
    try {
      window.DEBUG.level1.drawOverlay(ctx);
    } catch (error) {
      console.error('Error drawing Level 1 debug overlay:', error?.message || error);
    }
  }
  
  // Draw hack timeout message
  drawHackTimeoutMessage(ctx);
  window.BARCODE?.CrewTransmission?.draw(ctx);
};

// Screen-space boss readability and terminal outcome use the existing UI pass.
function drawSector1BossUI(ctx) {
  const owner = window.sector1Progression;
  const status = owner?.getBossStatus?.();
  if (!status || !['boss_ready', 'boss_combat', 'level_complete'].includes(owner.state)) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (window.gameState.victory) {
    ctx.fillStyle = 'rgba(0, 8, 16, 0.94)';
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(390, 265, 1140, 560);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('SECTOR 1 COMPLETE', 960, 365);
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px monospace';
    ctx.fillText('DEAD AIR DISTRICT', 960, 425);
    ctx.font = '22px monospace';
    ctx.fillText('20 mission enemies. Jammer destroyed. Boss defeated.', 960, 475);
    const rows = owner.getCompletionPresentation?.() || [];
    rows.forEach((row, index) => {
      const x = 465 + index * 340;
      ctx.fillStyle = '#112a3b'; ctx.fillRect(x, 525, 310, 132);
      ctx.fillStyle = '#c6a0ff'; ctx.font = '20px monospace';
      ctx.fillText(['SCORE', 'BEST COMBO', 'LOST DATA'][index], x + 155, 552);
      ctx.fillStyle = '#a0ffe4'; ctx.font = 'bold 38px monospace';
      ctx.fillText(row.total === null ? String(row.value) : `${row.value} / ${row.total}`, x + 155, 601);
      ctx.fillRect(x, 653, 310 * row.progress, 4);
    });
    ctx.fillStyle = '#b9faff';
    ctx.font = '22px monospace';
    ctx.fillText(window.BARCODE?.GamepadUI?.connected ? 'X — Restart Level 1' : 'SPACE — Restart Level 1', 960, 718);
    ctx.fillText(window.BARCODE?.GamepadUI?.connected ? 'A — Rematch the boss' : 'ENTER — Rematch the boss', 960, 766);
    if (window.BARCODE?.CrewTransmission?.inspectedGutter) {
      ctx.font = '18px monospace'; ctx.fillStyle = '#cbaaff';
      ctx.fillText('STUDIO RATS: Carrier restored. We are keeping the caption.', 960, 865);
    }
  } else if (!window.gameState.gameOver) {
    const x = 600, y = 24, width = 720;
    ctx.fillStyle = 'rgba(0, 8, 16, 0.9)';
    ctx.fillRect(x - 20, y, width + 40, 112);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SECTOR 1 BOSS', 960, y + 23);
    ctx.fillStyle = '#281523';
    ctx.fillRect(x, y + 43, width, 16);
    ctx.fillStyle = status.canReceiveDamage ? '#00ffff' : '#ff7044';
    ctx.fillRect(x, y + 43, width * status.health / status.maxHealth, 16);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y + 43, width, 16);
    ctx.fillStyle = '#ffffff';
    ctx.font = '17px monospace';
    const cue = status.phase === 'ready' ? 'Get ready. Jump the ground pulse.' : status.canReceiveDamage ?
      (status.canStompCounter ? 'COUNTER WINDOW — Timed rhythm hit or landing stomp' : 'COUNTER WINDOW — Timed rhythm hit; stomp unavailable') : status.phase === 'telegraph' ?
      (status.doublePulse ? 'TWO GROUND PULSES — JUMP' : 'GROUND PULSE — JUMP') : 'Evade the pulse. Counter when the boss glows cyan.';
    ctx.fillText(cue, 960, y + 86);
  }
  ctx.restore();
}

// A stable top band: player / current objective / score and Amp.
function drawBasicUI(ctx) {
  const player = window.player, rhythm = window.rhythmSystem, pad = window.BARCODE?.GamepadUI?.connected;
  const progress = window.lostDataSystem?.getProgress?.();
  ctx.save(); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(7,20,34,0.95)'; ctx.fillRect(30, 24, 340, 148); ctx.fillRect(1530, 24, 360, 62);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = 'bold 17px monospace'; ctx.fillStyle = '#91ffe0';
  ctx.fillText('6 BIT / SIGNAL STRENGTH', 50, 38);
  ctx.fillStyle = '#422634'; ctx.fillRect(50, 50, 300, 30);
  ctx.fillStyle = '#91ffe0'; ctx.fillRect(50, 50, 300 * Math.max(0, Math.min(1, (player?.health || 0) / (player?.maxHealth || 1))), 30);
  ctx.strokeStyle = '#a2c1ce'; ctx.lineWidth = 1; ctx.strokeRect(50, 50, 300, 30);
  ctx.fillStyle = '#142a33';
  for (let i = 1; i < (player?.maxHealth || 1); i++) ctx.fillRect(50 + 300 * i / player.maxHealth - 1, 50, 2, 30);
  ctx.fillStyle = '#dfd3f7'; ctx.font = '18px monospace';
  ctx.fillText(`LORE: ${progress?.collected || 0}/${progress?.total || 3}`, 50, 104);
  ctx.fillStyle = rhythm?.isActive?.() ? '#91ffe0' : '#afbacf';
  ctx.fillText(rhythm?.isActive?.() ? (pad ? 'RHYTHM ON / B: EXIT' : 'RHYTHM ON / R: EXIT') : (pad ? 'TRAVERSAL / B: RHYTHM' : 'TRAVERSAL / R: RHYTHM'), 50, 137);
  if (progress?.saved === false) { ctx.font = '12px monospace'; ctx.fillStyle = '#ffc68a'; ctx.fillText('ARCHIVE SAVE UNAVAILABLE — KEEP TAB OPEN', 50, 184); }
  ctx.textAlign = 'right'; ctx.fillStyle = '#91ffe0'; ctx.font = 'bold 22px monospace'; ctx.fillText(`SCORE ${window.gameState.score}`, 1865, 53);
  if (window.tutorialSystem?.isActive?.()) {
    ctx.textAlign = 'center'; ctx.fillStyle = '#cbaaff'; ctx.font = '22px monospace'; ctx.fillText('DEAD AIR DISTRICT / CREW TRAINING', 960, 53);
  }
  ctx.restore();
}

// Draw objectives panel
function drawObjectives(ctx) {
  if (window.objectivesSystem && typeof window.objectivesSystem.draw === 'function') {
    window.objectivesSystem.active = true;
    window.objectivesSystem.draw(ctx);
    return;
  }
  ctx.save();
  ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
  ctx.fillRect(420, 24, 1060, 104);
  ctx.strokeStyle = '#00ffff';
  ctx.strokeRect(420, 24, 1060, 104);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('› Explore Dead Air District', 440, 70);
  ctx.restore();
}

// Draw rhythm UI elements
function drawRhythmUI(ctx) {
  if (window.rhythmSystem && typeof window.rhythmSystem.isActive === 'function' && window.rhythmSystem.isActive()) {
    try {
      ctx.save();
      
      window.rhythmSystem.drawCompactHUD?.(ctx);
      
      if (window.rhythmSystem.beatEffects) {
        window.rhythmSystem.beatEffects.forEach(effect => {
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 3;
          ctx.globalAlpha = effect.opacity;
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, Math.max(0, effect.radius), 0, Math.PI * 2);
          ctx.stroke();
        });
      }
      
      if (window.rhythmSystem.particles) {
        window.rhythmSystem.particles.forEach(particle => {
          ctx.fillStyle = particle.color;
          ctx.globalAlpha = particle.life;
          ctx.fillRect(
            particle.x - particle.size/2,
            particle.y - particle.size/2,
            particle.size,
            particle.size
          );
        });
      }
      
      if (window.rhythmSystem.hitIndicators) {
        window.rhythmSystem.hitIndicators.forEach(indicator => {
          ctx.fillStyle = indicator.color;
          ctx.globalAlpha = indicator.life;
          ctx.font = `bold ${indicator.size}px Orbitron`;
          ctx.textAlign = 'center';
          ctx.fillText(indicator.text, indicator.x, indicator.y);
        });
      }
      

      
      ctx.restore();
    } catch (error) {
      console.error('Error drawing rhythm UI:', error?.message || error);
    }
  }
}

// Draw collection message
function drawCollectionMessage(ctx) {
  const message = window.gameState.collectionMessage;
  if (!message || message.timer <= 0) return;
  
  ctx.save();
  
  let alpha = 1.0;
  if (message.timer < 60) {
    alpha = message.timer / 60;
  }
  
  let scale = 1.0;
  if (message.timer > 150) {
    scale = 1.0 + Math.sin((180 - message.timer) * 0.3) * 0.1;
  }
  
  ctx.globalAlpha = alpha;
  ctx.font = `bold ${Math.floor(36 * scale)}px 'Orbitron', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const padding = 30;
  const textMetrics = ctx.measureText(message.text);
  const boxWidth = textMetrics.width + padding * 2;
  const boxHeight = 60;
  const boxX = (1920 - boxWidth) / 2;
  const boxY = 350;
  
  ctx.fillStyle = 'rgba(0, 20, 40, 0.9)';
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(message.text, 960, boxY + boxHeight / 2);
  
  ctx.restore();
}

// Draw game over screen
function drawGameOver(ctx) {
  function drawGlowText(text, x, y, options = {}) {
    const size = options.size || 20;
    const color = options.color || '#ffffff';
    const align = options.align || 'center';
    
    ctx.save();
    ctx.font = `${size}px monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    
    ctx.restore();
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, 1920, 1080);
  
  if (window.renderer && typeof window.renderer.drawGlowText === 'function') {
    try {
      window.renderer.drawGlowText('SYSTEM BREACH DETECTED', 960, 400, {
        size: 48,
        color: '#ff0000'
      });
    } catch (error) {
      drawGlowText('SYSTEM BREACH DETECTED', 960, 400, {
        size: 48,
        color: '#ff0000'
      });
    }
  } else {
    drawGlowText('SYSTEM BREACH DETECTED', 960, 400, {
      size: 48,
      color: '#ff0000'
    });
  }
  
  if (window.renderer && typeof window.renderer.drawGlowText === 'function') {
    try {
      window.renderer.drawGlowText('FINAL SCORE', 960, 500, {
        size: 32,
        color: '#ff00ff'
      });
    } catch (error) {
      drawGlowText('FINAL SCORE', 960, 500, {
        size: 32,
        color: '#ff00ff'
      });
    }
  } else {
    drawGlowText('FINAL SCORE', 960, 500, {
      size: 32,
      color: '#ff00ff'
    });
  }
  
  if (window.renderer && typeof window.renderer.drawGlowText === 'function') {
    try {
      window.renderer.drawGlowText(window.gameState.score.toString(), 960, 550, {
        size: 48,
        color: '#00ffff'
      });
    } catch (error) {
      drawGlowText(window.gameState.score.toString(), 960, 550, {
        size: 48,
        color: '#00ffff'
      });
    }
  } else {
    drawGlowText(window.gameState.score.toString(), 960, 550, {
      size: 48,
      color: '#00ffff'
    });
  }
  
  if (window.renderer && typeof window.renderer.drawGlowText === 'function') {
    try {
      window.renderer.drawGlowText((window.BARCODE?.GamepadUI?.connected ? (window.sector1Progression?.canRetryBossCheckpoint?.() ? 'A: Retry boss  |  X: Restart Level 1' : 'A / X: Restart Level 1') : window.sector1Progression?.canRetryBossCheckpoint?.() ? 'SPACE: Retry boss  |  SHIFT+SPACE: Restart Level 1' : 'Press SPACE to restart'), 960, 700, {
        size: 24,
        color: '#ffffff'
      });
    } catch (error) {
      drawGlowText((window.BARCODE?.GamepadUI?.connected ? (window.sector1Progression?.canRetryBossCheckpoint?.() ? 'A: Retry boss  |  X: Restart Level 1' : 'A / X: Restart Level 1') : window.sector1Progression?.canRetryBossCheckpoint?.() ? 'SPACE: Retry boss  |  SHIFT+SPACE: Restart Level 1' : 'Press SPACE to restart'), 960, 700, {
        size: 24,
        color: '#ffffff'
      });
    }
  } else {
    drawGlowText((window.BARCODE?.GamepadUI?.connected ? (window.sector1Progression?.canRetryBossCheckpoint?.() ? 'A: Retry boss  |  X: Restart Level 1' : 'A / X: Restart Level 1') : window.sector1Progression?.canRetryBossCheckpoint?.() ? 'SPACE: Retry boss  |  SHIFT+SPACE: Restart Level 1' : 'Press SPACE to restart'), 960, 700, {
      size: 24,
      color: '#ffffff'
    });
  }
  

}

// Draw pause screen
function drawPauseScreen(ctx) {
  if (window.BARCODE?.PauseMenu) { window.BARCODE.PauseMenu.draw(ctx); return; }
  function drawGlowText(text, x, y, options = {}) {
    const size = options.size || 20;
    const color = options.color || '#ffffff';
    const align = options.align || 'center';
    
    ctx.save();
    ctx.font = `${size}px monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    
    ctx.restore();
  }
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, 1920, 1080);
  
  if (window.renderer && typeof window.renderer.drawGlowText === 'function') {
    try {
      window.renderer.drawGlowText('PAUSED', 960, 540, {
        size: 48,
        color: '#ffff00'
      });
    } catch (error) {
      drawGlowText('PAUSED', 960, 540, {
        size: 48,
        color: '#ffff00'
      });
    }
  } else {
    drawGlowText('PAUSED', 960, 540, {
      size: 48,
      color: '#ffff00'
    });
  }
}

// Draw lore messages
function drawLoreMessages(ctx) {
  // Draw lore messages at bottom of screen
  if (window.loreSystem && typeof window.loreSystem.draw === 'function') {
    try {
      window.loreSystem.draw(ctx);
    } catch (error) {
      console.error('Error drawing lore system:', error?.message || error);
    }
  }
}

// Draw hack timeout message
function drawHackTimeoutMessage(ctx) {
  if (window.hackTimeoutMessage && window.hackTimeoutMessage.timer > 0) {
    ctx.save();
    
    const flashDuration = 30;
    const totalFlashes = 4;
    const currentFlash = Math.floor((120 - window.hackTimeoutMessage.timer) / flashDuration);
    const flashProgress = ((120 - window.hackTimeoutMessage.timer) % flashDuration) / flashDuration;
    
    let alpha;
    if (currentFlash < totalFlashes) {
      if (flashProgress < 0.5) {
        alpha = flashProgress * 2;
      } else {
        alpha = 2 - flashProgress * 2;
      }
    } else {
      alpha = 0;
    }
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 15;
    ctx.fillText(window.hackTimeoutMessage.text, 960, 140);
    ctx.restore();
    
    window.hackTimeoutMessage.timer--;
    
    if (window.hackTimeoutMessage.timer <= 0) {
      window.hackTimeoutMessage = null;
    }
  }
}
