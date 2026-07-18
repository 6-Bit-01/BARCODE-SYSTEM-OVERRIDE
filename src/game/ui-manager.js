// UI management for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/ui-manager.js',
  exports: ['drawGameUI'],
  dependencies: ['renderer', 'gameState', 'player', 'sector1Progression', 'lostDataSystem', 'hackingSystem', 'rhythmSystem', 'objectivesSystem', 'loreSystem', 'jammerIndicator', 'tutorialSystem']
});


function drawGlowText(ctx, text, x, y, options = {}) {
  const size = options.size || 20;
  const color = options.color || '#ffffff';
  const align = options.align || 'left';
  ctx.save();
  ctx.font = `${size}px monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = options.baseline || 'top';
  ctx.shadowColor = color;
  ctx.shadowBlur = options.blur || 10;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawHealthBar(ctx, x, y, width, height, current, max) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
  ctx.fillRect(x, y, width, height);
  const healthPercent = Math.max(0, Math.min(1, max ? current / max : 0));
  ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + healthPercent * 0.5})`;
  ctx.fillRect(x, y, width * healthPercent, height);
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

function drawRendererGlowText(ctx, text, x, y, options) {
  if (window.renderer && typeof window.renderer.drawGlowText === 'function') {
    try { window.renderer.drawGlowText(text, x, y, options); return; } catch (_) {}
  }
  drawGlowText(ctx, text, x, y, options);
}

function drawRendererHealthBar(ctx, x, y, width, height, current, max) {
  if (window.renderer && typeof window.renderer.drawHealthBar === 'function') {
    try { window.renderer.drawHealthBar(x, y, width, height, current, max); return; } catch (_) {}
  }
  drawHealthBar(ctx, x, y, width, height, current, max);
}

function drawLoreCounter(ctx) {
  if (!window.lostDataSystem) return;
  try {
    const loreProgress = window.lostDataSystem.getProgress();
    const loreX = 50;
    const loreY = 100;
    const loreWidth = 300;
    const loreHeight = 30;
    const allCollected = loreProgress.collected >= loreProgress.total && loreProgress.total > 0;
    ctx.fillStyle = 'rgba(40, 0, 60, 0.95)';
    ctx.fillRect(loreX, loreY, loreWidth, loreHeight);
    ctx.strokeStyle = '#9333ea';
    ctx.lineWidth = 2;
    ctx.strokeRect(loreX, loreY, loreWidth, loreHeight);
    ctx.fillStyle = allCollected ? '#00ff00' : '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`LORE: ${loreProgress.collected}/${loreProgress.total}`, loreX + 15, loreY + loreHeight / 2);
    const barWidth = loreWidth - 30;
    const barHeight = 4;
    const barX = loreX + 15;
    const barY = loreY + loreHeight - 8;
    const progress = loreProgress.total > 0 ? loreProgress.collected / loreProgress.total : 0;
    ctx.fillStyle = '#333333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = allCollected ? '#00ff00' : '#9333ea';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);
  } catch (error) {
    console.error('Error drawing lore counter:', error?.message || error);
  }
}

function drawBasicUI(ctx) {
  const player = window.player || { health: 0, maxHealth: 1 };
  ctx.save();
  ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
  ctx.fillRect(30, 30, 340, 60);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 340, 60);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(40, 0, 60, 0.95)';
  ctx.fillRect(760, 30, 400, 50);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(760, 30, 400, 50);
  ctx.restore();

  drawRendererHealthBar(ctx, 50, 50, 300, 30, player.health, player.maxHealth);
  drawLoreCounter(ctx);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  drawRendererGlowText(ctx, 'SIGNAL STRENGTH', 200, 40, { align: 'center', color: '#00ffff', size: 16 });

  let progressText = 'SECTOR 1: THE CITY';
  if (window.enemyManager) progressText += ` | Defeats ${window.enemyManager.defeatedCount || 0}`;
  const jammerStatus = window.BARCODE && window.BARCODE.JammerEnvironment ? window.BARCODE.JammerEnvironment.getStatus() : null;
  if (jammerStatus && jammerStatus.revealed) progressText += ` | Jammer ${jammerStatus.triggered ? 'triggered' : 'revealed'}`;
  drawRendererGlowText(ctx, progressText, 960, 50, { align: 'center', color: '#ff00ff', size: 20 });

  const score = window.gameState && Number.isFinite(window.gameState.score) ? window.gameState.score : 0;
  drawRendererGlowText(ctx, `SCORE: ${score}`, 1920 - 200, 50, { align: 'right', color: '#00ffff', size: 20 });
}

// Main UI drawing function
window.drawGameUI = function(ctx) {
  window.__activeUICtx = ctx;
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

  // Draw health and basic UI elements
  drawBasicUI(ctx);

  // Draw objectives after tutorial completion
  if (tutorialCompleted) {
    drawObjectives(ctx);
  }

  // Draw hacking interface
  if (window.hackingSystem && typeof window.hackingSystem.isActive === 'function' && window.hackingSystem.isActive()) {
    window.hackingSystem.draw(ctx);
  }

  // Draw rhythm UI elements
  drawRhythmUI(ctx);

  // Draw collection message
  if (window.gameState.collectionMessage && window.gameState.collectionMessage.timer > 0) {
    drawCollectionMessage(ctx);
  }

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

  drawHackTimeoutMessage(ctx);

  // Jammer indicator is owned by render-coordinator UI pass.
};

// Draw objectives panel
function drawObjectives(ctx) {
  if (window.objectivesSystem && typeof window.objectivesSystem.draw === 'function') {
    window.objectivesSystem.active = true;
    window.objectivesSystem.draw(ctx);
    return;
  }
  ctx.save();
  ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
  ctx.fillRect(1300, 120, 500, 160);
  ctx.strokeStyle = '#00ffff';
  ctx.strokeRect(1300, 120, 500, 160);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('› Explore Dead Air District', 1315, 180);
  ctx.restore();
}

// Draw rhythm UI elements
function drawRhythmUI(ctx) {
  if (window.rhythmSystem && typeof window.rhythmSystem.isActive === 'function' && window.rhythmSystem.isActive()) {
    try {
      ctx.save();

      if (typeof window.rhythmSystem.draw4BarProgress === 'function') {
        window.rhythmSystem.draw4BarProgress(ctx);
      }

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

      if (typeof window.rhythmSystem.drawUI === 'function') {
        window.rhythmSystem.drawUI(ctx);
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
  const boxY = 200;

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
  // CRITICAL: Continue rhythm system updates during game over
  if (window.rhythmSystem && typeof window.rhythmSystem.update === 'function') {
    try {
      window.rhythmSystem.update(16);
    } catch (error) {
      console.error('Error updating rhythm system during game over:', error);
    }
  }

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
      window.renderer.drawGlowText('Press SPACE to restart', 960, 700, {
        size: 24,
        color: '#ffffff'
      });
    } catch (error) {
      drawGlowText('Press SPACE to restart', 960, 700, {
        size: 24,
        color: '#ffffff'
      });
    }
  } else {
    drawGlowText('Press SPACE to restart', 960, 700, {
      size: 24,
      color: '#ffffff'
    });
  }

  // CRITICAL: Draw rhythm progress even during game over
  if (window.rhythmSystem && typeof window.rhythmSystem.draw === 'function') {
    try {
      window.rhythmSystem.draw(ctx, 960, 500);
    } catch (error) {
      console.error('Error drawing rhythm system during game over:', error);
    }
  }
}

// Draw pause screen
function drawPauseScreen(ctx) {
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