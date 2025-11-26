// UI management for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/game/ui-manager.js',
  exports: ['drawGameUI'],
  dependencies: ['renderer', 'gameState', 'player', 'sector1Progression', 'lostDataSystem', 'hackingSystem', 'rhythmSystem', 'objectivesSystem', 'loreSystem', 'jammerIndicator', 'tutorialSystem']
});

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
  
  // Draw jammer indicator
  if (window.jammerIndicator && typeof window.jammerIndicator.draw === 'function') {
    try {
      window.jammerIndicator.draw(ctx);
    } catch (error) {
      console.error('Error drawing jammer indicator:', error?.message || error);
    }
  }
  
  // Draw hack timeout message
  drawHackTimeoutMessage(ctx);
};

// Draw basic UI elements (health, score, etc.)
function drawBasicUI(ctx) {
  // Helper functions
  function drawGlowText(text, x, y, options = {}) {
    const size = options.size || 20;
    const color = options.color || '#ffffff';
    const align = options.align || 'left';
    
    ctx.save();
    ctx.font = `${size}px monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    
    ctx.restore();
  }
  
  function drawHealthBar(x, y, width, height, current, max) {
    ctx.save();
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(x, y, width, height);
    
    const healthPercent = Math.max(0, Math.min(1, current / max));
    ctx.fillStyle = `rgba(0, 255, 0, ${0.5 + healthPercent * 0.5})`;
    ctx.fillRect(x, y, width * healthPercent, height);
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    ctx.restore();
  }
  
  // Health bar background panel
  ctx.save();
  ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
  ctx.fillRect(30, 30, 340, 60);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 340, 60);
  ctx.restore();
  
  // Level progress background panel
  ctx.save();
  ctx.fillStyle = 'rgba(40, 0, 60, 0.95)';
  ctx.fillRect(760, 30, 400, 50);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(760, 30, 400, 50);
  ctx.restore();
  
  // Draw health bar
  if (window.renderer && typeof window.renderer.drawHealthBar === 'function') {
    try {
      window.renderer.drawHealthBar(50, 50, 300, 30, window.player.health, window.player.maxHealth);
    } catch (error) {
      drawHealthBar(50, 50, 300, 30, window.player.health, window.player.maxHealth);
    }
  } else {
    drawHealthBar(50, 50, 300, 30, window.player.health, window.player.maxHealth);
  }
  
  // Draw lore counter
  if (window.lostDataSystem) {
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
      ctx.fillText(`LORE: ${loreProgress.collected}/${loreProgress.total}`, loreX + 15, loreY + loreHeight/2);
      
      const barWidth = loreWidth - 30;
      const barHeight = 4;
      const barX = loreX + 15;
      const barY = loreY + loreHeight - 8;
      const progress = loreProgress.total > 0 ? loreProgress.collected / loreProgress.total : 0;
      
      ctx.fillStyle = '#333333';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = allCollected ? '#00ff00' : '#9333ea';
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
      
      if (allCollected) {
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('ALL LORE RETRIEVED', loreX + 15, loreY + loreHeight + 8);
        
        const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        ctx.globalAlpha = pulse;
        ctx.font = '12px monospace';
        ctx.fillStyle = '#88ff88';
        ctx.fillText('All fragments collected', loreX + 15, loreY + loreHeight + 26);
        ctx.globalAlpha = 1.0;
      }
      
    } catch (error) {
      console.error('Error drawing lore counter:', error?.message || error);
    }
  }
  
  // Reset text alignment before drawing UI text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  
  // Draw "SIGNAL STRENGTH" label
  if (window.renderer && typeof window.renderer.drawGlowText === 'function') {
    try {
      window.renderer.drawGlowText('SIGNAL STRENGTH', 200, 40, {
        align: 'center',
        color: '#00ffff',
        size: 16
      });
    } catch (error) {
      drawGlowText('SIGNAL STRENGTH', 200, 40, {
        align: 'center',
        color: '#00ffff',
        size: 16
      });
    }
  } else {
    drawGlowText('SIGNAL STRENGTH', 200, 40, {
      align: 'center',
      color: '#00ffff',
      size: 16
    });
  }
  
  // Draw level and progression progress
  let progressText = 'SECTOR 1: THE CITY';
  
  if (window.sector1Progression) {
    const jammerStatus = window.sector1Progression.broadcastJammerDestroyed ? '✓' : '📡';
    const enemyStatus = `${window.sector1Progression.enemiesDefeated}/${window.sector1Progression.requiredEnemyKills}`;
    progressText += ` | ${jammerStatus} Jammer | ${enemyStatus} Enemies`;
  }
  
  if (window.renderer && typeof window.renderer.drawGlowText === 'function') {
    try {
      window.renderer.drawGlowText(progressText, 960, 50, {
        align: 'center',
        color: '#ff00ff',
        size: 20
      });
    } catch (error) {
      drawGlowText(progressText, 960, 50, {
        align: 'center',
        color: '#ff00ff',
        size: 20
      });
    }
  } else {
    drawGlowText(progressText, 960, 50, {
      align: 'center',
      color: '#ff00ff',
      size: 20
    });
  }
  
  // Draw score
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  
  if (window.renderer && typeof window.renderer.drawGlowText === 'function') {
    try {
      window.renderer.drawGlowText(`SCORE: ${window.gameState.score}`, 1920 - 200, 50, {
        align: 'right',
        color: '#00ffff',
        size: 20
      });
    } catch (error) {
      drawGlowText(`SCORE: ${window.gameState.score}`, 1920 - 200, 50, {
        align: 'right',
        color: '#00ffff',
        size: 20
      });
    }
  } else {
    drawGlowText(`SCORE: ${window.gameState.score}`, 1920 - 200, 50, {
      align: 'right',
      color: '#00ffff',
      size: 20
    });
  }
}

// Draw objectives panel
function drawObjectives(ctx) {
  // Force objectives system to be always active after tutorial initialization
  if (window.objectivesSystem) {
    window.objectivesSystem.active = true;
    try {
      if (window.objectivesSystem.objectiveUI) {
        window.objectivesSystem.objectiveUI.visible = true;
      }
    } catch (error) {
      console.warn('⚠️ Failed to set objectives UI visibility:', error?.message || error);
    }
  }
  
  // Save context state to avoid affecting other UI elements
  ctx.save();
  
  // Draw objectives panel directly
  const objX = 1300;
  const objY = 120;
  const objWidth = 500;
  const objHeight = 200;
  
  // Panel background
  ctx.fillStyle = 'rgba(0, 20, 40, 0.95)';
  ctx.fillRect(objX, objY, objWidth, objHeight);
  
  // Panel border
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(objX, objY, objWidth, objHeight);
  
  // Header
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('MISSION OBJECTIVES', objX + 15, objY + 10);
  
  // Get enemy count
  let enemiesDefeated = 0;
  let requiredEnemies = 20;
  
  if (window.sector1Progression) {
    enemiesDefeated = window.sector1Progression.enemiesDefeated || 0;
    requiredEnemies = window.sector1Progression.requiredEnemyKills || 20;
  } else if (window.enemyManager) {
    enemiesDefeated = window.enemyManager.defeatedCount || 0;
  }
  
  // Enemy counter in header
  ctx.fillStyle = enemiesDefeated >= requiredEnemies ? '#00ff00' : '#ff9900';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`ENEMIES: ${enemiesDefeated}/${requiredEnemies}`, objX + objWidth - 15, objY + 12);
  
  // Draw objectives list
  let yOffset = 40;
  
  // Enemy objective
  ctx.fillStyle = enemiesDefeated >= requiredEnemies ? '#00ff00' : '#ff9900';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  const enemyPrefix = enemiesDefeated >= requiredEnemies ? '✓' : '›';
  ctx.fillText(`${enemyPrefix} Defeat 20 enemies`, objX + 15, objY + yOffset);
  
  ctx.fillStyle = enemiesDefeated >= requiredEnemies ? '#00ff00' : '#cccccc';
  ctx.font = '12px monospace';
  ctx.fillText(`Progress: ${enemiesDefeated}/${requiredEnemies}`, objX + 30, objY + yOffset + 18);
  yOffset += 45;
  
  // Jammer objective (show after 20 enemies)
  if (enemiesDefeated >= requiredEnemies) {
    const jammerDestroyed = window.sector1Progression && window.sector1Progression.broadcastJammerDestroyed;
    ctx.fillStyle = jammerDestroyed ? '#00ff00' : '#ff9900';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    const jammerPrefix = jammerDestroyed ? '✓' : '›';
    ctx.fillText(`${jammerPrefix} Destroy the jammer`, objX + 15, objY + yOffset);
    
    ctx.fillStyle = jammerDestroyed ? '#00ff00' : '#cccccc';
    ctx.font = '12px monospace';
    ctx.fillText('Use rhythm attacks (R key)', objX + 30, objY + yOffset + 18);
    yOffset += 45;
  }
  
  // Progress bar at bottom
  const barY = objY + objHeight - 40;
  const barHeight = 20;
  const barWidth = objWidth - 60;
  const progress = Math.min(1.0, enemiesDefeated / requiredEnemies);
  
  ctx.fillStyle = '#333333';
  ctx.fillRect(objX + 30, barY, barWidth, barHeight);
  
  if (progress >= 1.0) {
    ctx.fillStyle = '#00ff00';
  } else if (progress >= 0.5) {
    ctx.fillStyle = '#ffff00';
  } else {
    ctx.fillStyle = '#ff9900';
  }
  
  const fillWidth = barWidth * progress;
  ctx.fillRect(objX + 30, barY, fillWidth, barHeight);
  
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(objX + 30, barY, barWidth, barHeight);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`ENEMIES DEFEATED: ${enemiesDefeated}/${requiredEnemies}`, objX + objWidth/2, barY + barHeight/2);
  
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