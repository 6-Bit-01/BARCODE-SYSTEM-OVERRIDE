// Post-tutorial objective compatibility shim plus the recovered Level 1 presentation-cleanup pass.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/post-tutorial-objectives.js', exports: ['PostTutorialObjectives'], dependencies: ['objectivesSystem'] });

(function installRecoveredLevel01PresentationPass() {
  const B = window.BARCODE = window.BARCODE || {};
  const SMOOTH_STEP_MS = 1000 / 120;
  const JAMMER_LIFT_Y = 118;
  const STUDIO_RAT_ID = 'egg.l01.studio-rat';
  const STUDIO_RAT_X = 2825;
  const STUDIO_RAT_Y = 822;

  function stabilizeSpriteClock(sprite) {
    if (!sprite || typeof sprite.update !== 'function' || sprite.__barcodeSmoothClock) return;
    const rawUpdate = sprite.update.bind(sprite);
    let carryMs = 0;
    sprite.update = function stableSpriteUpdate(deltaMs) {
      const incoming = Math.max(0, Math.min(100, Number(deltaMs) || 0));
      carryMs = Math.min(100, carryMs + incoming);
      let guard = 0;
      while (carryMs + 0.0001 >= SMOOTH_STEP_MS && guard < 12) {
        rawUpdate(SMOOTH_STEP_MS);
        carryMs -= SMOOTH_STEP_MS;
        guard += 1;
      }
    };
    try { Object.defineProperty(sprite, '__barcodeSmoothClock', { value: true }); } catch (_) { sprite.__barcodeSmoothClock = true; }
  }

  function installCharacterAnimationCleanup() {
    const playerProto = window.Player?.prototype;
    if (playerProto && !playerProto.__barcodePresentationCleanup) {
      const originalPlayerUpdate = playerProto.updateSpriteAnimation;
      const originalPlayerPlay = playerProto.playAnimation;
      const playerAnimations = {
        idle: '6_bit_idle_idle',
        walk: '6_bit_walk_walk',
        jump: '6_bit_jump_jump',
        rhythm: '6_bit_r__h_mode_rhmode'
      };

      playerProto.updateSpriteAnimation = function smoothedPlayerAnimation(deltaMs) {
        stabilizeSpriteClock(this.sprite);
        return originalPlayerUpdate.call(this, deltaMs);
      };

      playerProto.playAnimation = function stablePlayerClip(animationName, frame = null) {
        const fullName = playerAnimations[animationName] || animationName;
        const freshJump = animationName === 'jump' && !this.jumpAnimationStarted;
        const sameClip = this.currentAnimation === fullName;
        const sameFrame = frame === null || this.animationRef?.currentFrame === frame;
        if (sameClip && sameFrame && this.animationRef && !this.animationRef.isInterrupted && !freshJump) return this.animationRef;
        return originalPlayerPlay.call(this, animationName, frame);
      };
      try { Object.defineProperty(playerProto, '__barcodePresentationCleanup', { value: true }); } catch (_) { playerProto.__barcodePresentationCleanup = true; }
    }

    const enemyProto = window.Enemy?.prototype;
    if (enemyProto && !enemyProto.__barcodePresentationCleanup) {
      const originalEnemyUpdate = enemyProto.update;
      const originalEnemyPlay = enemyProto.playAnimation;
      const maps = {
        virus: { idle: 'virus_idle_idle' },
        corrupted: { idle: 'corrupted_idle_idle', walk: 'corrupted_walk_walk' },
        firewall: { idle: 'firewall_idle_idle', walk: 'firewall_walk_walk', attack: 'firewall_attack_default' }
      };

      enemyProto.update = function smoothedEnemyAnimation(deltaMs, player, simulationTimeMs) {
        stabilizeSpriteClock(this.sprite);
        return originalEnemyUpdate.call(this, deltaMs, player, simulationTimeMs);
      };

      enemyProto.playAnimation = function stableEnemyClip(name) {
        if (!this.spriteReady || !this.sprite) return;
        stabilizeSpriteClock(this.sprite);
        const fullName = maps[this.type]?.[name] || name;
        if (this.currentAnimation === fullName && this.animationRef && !this.animationRef.isInterrupted) return this.animationRef;
        return originalEnemyPlay.call(this, name);
      };
      try { Object.defineProperty(enemyProto, '__barcodePresentationCleanup', { value: true }); } catch (_) { enemyProto.__barcodePresentationCleanup = true; }
    }
  }

  function installJammerLift() {
    const jammer = B.JammerEnvironment;
    if (!jammer || jammer.__barcodePresentationLifted) return;
    const lifted = {
      ...jammer,
      update(deltaMs) {
        let remaining = Math.max(0, Math.min(100, Number(deltaMs) || 0));
        if (remaining <= 0) return jammer.update(deltaMs);
        let status = jammer.getStatus?.();
        let guard = 0;
        while (remaining > 0.0001 && guard < 12) {
          const step = Math.min(SMOOTH_STEP_MS, remaining);
          status = jammer.update(step);
          remaining -= step;
          guard += 1;
        }
        return status;
      },
      draw(ctx) {
        if (!ctx) return;
        ctx.save();
        ctx.translate(0, -JAMMER_LIFT_Y);
        jammer.draw(ctx);
        ctx.restore();
      },
      getAimBounds() {
        const bounds = jammer.getAimBounds?.();
        return bounds ? { ...bounds, y: bounds.y - JAMMER_LIFT_Y } : bounds;
      }
    };
    try { Object.defineProperty(lifted, '__barcodePresentationLifted', { value: true }); } catch (_) { lifted.__barcodePresentationLifted = true; }
    B.JammerEnvironment = Object.freeze(lifted);
  }

  function drawTrafficBeam(ctx, ship, elapsedMs, foreground) {
    if (!ctx || !ship) return;
    const bobY = Math.sin((elapsedMs || 0) / 1000 + (ship.bobOffset || 0)) * (ship.bobAmount || 0);
    const x = ship.x;
    const y = ship.y + bobY;
    const direction = ship.direction || 1;
    const size = Math.max(40, ship.size || 80);
    const reach = foreground ? 470 : 360;
    const spread = foreground ? 165 : 120;
    ctx.save();
    ctx.globalAlpha = foreground ? 0.105 : 0.045;
    ctx.fillStyle = '#b6e9fa';
    ctx.beginPath();
    ctx.moveTo(x - direction * size * 0.12, y + size * 0.18);
    ctx.lineTo(x + direction * reach, 824);
    ctx.lineTo(x + direction * reach + spread, 824);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function installTrafficLayering() {
    const proto = window.SpaceShipSystem?.prototype;
    if (!proto || proto.__barcodeTrafficLayering) return;
    const originalNormal = proto.drawNormalShips;
    const originalForeground = proto.drawForegroundShips;

    proto.drawNormalShips = function layeredNormalTraffic(ctx) {
      for (const ship of this.ships || []) if (!ship.isForeground) drawTrafficBeam(ctx, ship, this.elapsedMs, false);
      return originalNormal.call(this, ctx);
    };
    proto.drawForegroundShips = function layeredForegroundTraffic(ctx) {
      for (const ship of this.ships || []) if (ship.isForeground) drawTrafficBeam(ctx, ship, this.elapsedMs, true);
      return originalForeground.call(this, ctx);
    };
    try { Object.defineProperty(proto, '__barcodeTrafficLayering', { value: true }); } catch (_) { proto.__barcodeTrafficLayering = true; }
  }

  function makeTutorialObjectiveContext(ctx, offsetY) {
    const shiftRect = (method, args) => {
      const out = Array.from(args);
      if (Number(out[0]) >= 1400 && Number(out[1]) >= 0 && Number(out[1]) < 360) out[1] += offsetY;
      return ctx[method](...out);
    };
    const shiftText = (method, args) => {
      const out = Array.from(args);
      if (Number(out[1]) >= 1400 && Number(out[2]) >= 0 && Number(out[2]) < 360) out[2] += offsetY;
      return ctx[method](...out);
    };
    return new Proxy(ctx, {
      get(target, property) {
        if (property === 'fillRect' || property === 'strokeRect' || property === 'clearRect') return (...args) => shiftRect(property, args);
        if (property === 'fillText' || property === 'strokeText') return (...args) => shiftText(property, args);
        const value = target[property];
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, property, value) { target[property] = value; return true; }
    });
  }

  function installTutorialTaskPlacement() {
    const proto = window.TutorialSystem?.prototype;
    if (!proto || proto.__barcodeTutorialTaskPlacement || typeof proto.draw !== 'function') return;
    const originalDraw = proto.draw;
    proto.draw = function drawWithSeparatedTaskCard(ctx) {
      return originalDraw.call(this, makeTutorialObjectiveContext(ctx, 170));
    };
    try { Object.defineProperty(proto, '__barcodeTutorialTaskPlacement', { value: true }); } catch (_) { proto.__barcodeTutorialTaskPlacement = true; }
  }

  function drawDigitalWall(ctx, gate, progress, opening, timeMs) {
    const fade = Math.max(0, Math.min(1, 1 - progress));
    if (fade <= 0.001) return;
    const baseY = gate.y + gate.h;
    const fullTop = Math.max(235, gate.y - 330);
    const fullHeight = Math.max(1, baseY - fullTop);
    const height = fullHeight * fade * fade;
    const top = baseY - height;
    const frontX = gate.x - 10;
    const frontW = gate.w + 20;
    const depthX = 28;
    const depthY = -15;
    const flicker = 0.75 + Math.sin((timeMs || 0) / 75 + gate.x * 0.01) * 0.12;
    const scan = top + ((timeMs || 0) / 3 % Math.max(8, height));

    ctx.save();
    ctx.globalAlpha = fade;

    // Street/sidewalk base: the wall is planted into the world rather than a flat vertical blocker.
    ctx.fillStyle = opening ? 'rgba(95,255,216,0.16)' : 'rgba(195,88,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(frontX - 28, baseY - 4);
    ctx.lineTo(frontX + frontW + 28, baseY - 4);
    ctx.lineTo(frontX + frontW + 54, baseY + 23);
    ctx.lineTo(frontX - 54, baseY + 23);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = opening ? '#9dffe5' : '#e69aff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Main face.
    ctx.fillStyle = opening ? 'rgba(61,255,207,0.10)' : 'rgba(151,55,215,0.14)';
    ctx.fillRect(frontX, top, frontW, height);
    ctx.strokeStyle = opening ? '#b8ffeb' : '#f0b0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(frontX, top, frontW, height);

    // Perspective side and top planes give the barrier real thickness.
    ctx.fillStyle = opening ? 'rgba(30,180,150,0.18)' : 'rgba(79,35,122,0.28)';
    ctx.beginPath();
    ctx.moveTo(frontX + frontW, top);
    ctx.lineTo(frontX + frontW + depthX, top + depthY);
    ctx.lineTo(frontX + frontW + depthX, baseY + depthY);
    ctx.lineTo(frontX + frontW, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = opening ? 'rgba(107,255,219,0.15)' : 'rgba(216,112,255,0.20)';
    ctx.beginPath();
    ctx.moveTo(frontX, top);
    ctx.lineTo(frontX + depthX, top + depthY);
    ctx.lineTo(frontX + frontW + depthX, top + depthY);
    ctx.lineTo(frontX + frontW, top);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tall digital columns and depth-aligned crossbands keep it legible as an energy wall.
    ctx.globalAlpha = fade * flicker;
    for (let x = frontX + 6; x < frontX + frontW - 2; x += 7) {
      ctx.fillStyle = opening ? 'rgba(145,255,225,0.55)' : 'rgba(231,136,255,0.55)';
      ctx.fillRect(x, top + 4, (Math.floor(x) % 3) ? 2 : 3, Math.max(0, height - 8));
    }
    ctx.globalAlpha = fade * 0.55;
    for (let y = top + 28; y < baseY; y += 54) {
      ctx.fillStyle = opening ? '#9dffe5' : '#d892ff';
      ctx.fillRect(frontX + 3, y, frontW - 6, 2);
    }
    ctx.globalAlpha = fade;
    ctx.fillStyle = opening ? '#d2fff3' : '#fff0ff';
    ctx.fillRect(frontX - 5, Math.min(baseY - 4, scan), frontW + 10, 3);

    if (opening) {
      ctx.globalAlpha = fade * 0.75;
      ctx.fillStyle = '#baffea';
      for (let i = 0; i < 8; i++) {
        const t = (i + 1) / 9;
        ctx.fillRect(frontX + t * frontW + progress * 24, baseY - progress * (45 + i * 13), 3, 7);
      }
    }
    ctx.restore();
  }

  function patchSector1Class(Sector1Progression) {
    const proto = Sector1Progression?.prototype;
    if (!proto || proto.__barcodePresentationCleanup) return Sector1Progression;
    const originalBossUpdate = proto.updateBossSprite;
    if (typeof originalBossUpdate === 'function') {
      proto.updateBossSprite = function smoothedBossSprite(deltaMs) {
        stabilizeSpriteClock(this.boss?.sprite);
        return originalBossUpdate.call(this, deltaMs);
      };
    }
    proto.drawEncounterGates = function drawThreeDimensionalEncounterWalls(ctx) {
      if (!ctx || typeof this.getGatePresentation !== 'function') return;
      const fx = B.combatFX;
      const time = fx?.timeMs ?? this.districtSignal?.elapsedMs ?? 0;
      for (const item of this.getGatePresentation()) {
        const gate = item.gate;
        if (!gate) continue;
        if (fx?.visible && !fx.visible(gate.x, gate.y + gate.h * 0.5, 260)) continue;
        drawDigitalWall(ctx, gate, item.progress || 0, !!item.opening, time);
      }
    };
    try { Object.defineProperty(proto, '__barcodePresentationCleanup', { value: true }); } catch (_) { proto.__barcodePresentationCleanup = true; }
    return Sector1Progression;
  }

  function armSector1Patch() {
    if (window.Sector1Progression) { patchSector1Class(window.Sector1Progression); return; }
    try {
      Object.defineProperty(window, 'Sector1Progression', {
        configurable: true,
        enumerable: true,
        get() { return undefined; },
        set(value) {
          patchSector1Class(value);
          Object.defineProperty(window, 'Sector1Progression', { value, writable: true, configurable: true, enumerable: true });
        }
      });
    } catch (_) {}
  }

  function patchStageFXClass(Level01StageFX) {
    const proto = Level01StageFX?.prototype;
    if (!proto || proto.__barcodePresentationCleanup) return Level01StageFX;
    const ratDetail = Level01StageFX.DETAILS?.find?.(detail => detail.id === STUDIO_RAT_ID);
    if (ratDetail) {
      ratDetail.x = STUDIO_RAT_X;
      ratDetail.y = STUDIO_RAT_Y;
      ratDetail.name = 'RELAY STOREFRONT';
      ratDetail.lines = [
        'Something just moved behind that relay shutter. Fast.',
        'Studio Rat. Stole a bolt and took the service lane. You only get one sighting.'
      ];
    }

    const originalInspect = proto.inspect;
    const originalDrawWorld = proto.drawWorld;
    const originalDrawHUD = proto.drawHUD;
    const originalDrawRat = proto.drawRat;

    proto.inspect = function oneTimeStudioRatInspection() {
      const nearby = this.findNearby?.();
      const wasRat = nearby?.id === STUDIO_RAT_ID;
      const result = originalInspect.call(this);
      if (wasRat) {
        if (result?.reason === 'discovered') this.ratAge = 0;
        else this.ratAge = null;
      }
      return result;
    };

    proto.drawRat = function hiddenStaticStudioRat(ctx, x, y, scale) {
      if (this.ratAge === null && ratDetail && Math.abs(x - ratDetail.x) < 2 && Math.abs(y - ratDetail.y) < 2) return;
      return originalDrawRat.call(this, ctx, x, y, scale);
    };

    proto.drawWorld = function separatedTrafficAndStudioRatEvent(ctx) {
      const shipSystem = window.spaceShipSystem;
      const savedShips = shipSystem?.ships;
      const archiveFn = this.archive;
      const realArchive = archiveFn?.call(this);
      let archiveMasked = false;
      try {
        // The old beam pass lived above the foreground. Suppress only that read here;
        // each ship now owns its light in the same render layer as the ship itself.
        if (shipSystem && Array.isArray(savedShips)) shipSystem.ships = [];
        // Keep the Studio Rat genuinely hidden instead of advertising it with the generic egg marker.
        if (realArchive?.hasEgg) {
          this.archive = () => ({ hasEgg: id => id === STUDIO_RAT_ID ? true : realArchive.hasEgg(id) });
          archiveMasked = true;
        }
        originalDrawWorld.call(this, ctx);
      } finally {
        if (shipSystem && Array.isArray(savedShips)) shipSystem.ships = savedShips;
        if (archiveMasked) this.archive = archiveFn;
      }

      if (this.ratAge !== null && ratDetail && ctx) {
        const t = Math.max(0, Math.min(1, this.ratAge / 3600));
        const x = ratDetail.x + 44 + t * 560;
        const y = ratDetail.y - 3 - Math.sin(t * Math.PI) * 17;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (1 - t) * 1.35);
        originalDrawRat.call(this, ctx, x, y, 1.12);
        ctx.strokeStyle = '#b8c6d8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 25, y - 4);
        ctx.lineTo(x - 61, y + 5);
        ctx.stroke();
        ctx.fillStyle = '#dfe7ed';
        ctx.fillRect(x - 75, y - 3, 15, 11);
        ctx.fillStyle = '#8fffe2';
        for (let i = 0; i < 5; i++) ctx.fillRect(x - 95 - i * 9, y + 7 - (i % 2) * 5, 4, 3);
        ctx.restore();
      }
    };

    proto.drawHUD = function studioRatStaysInWorld(ctx) {
      const age = this.ratAge;
      this.ratAge = null;
      try { return originalDrawHUD.call(this, ctx); }
      finally { this.ratAge = age; }
    };

    try { Object.defineProperty(proto, '__barcodePresentationCleanup', { value: true }); } catch (_) { proto.__barcodePresentationCleanup = true; }
    return Level01StageFX;
  }

  function armStageFXPatch() {
    if (B.Level01StageFX) { patchStageFXClass(B.Level01StageFX); return; }
    try {
      Object.defineProperty(B, 'Level01StageFX', {
        configurable: true,
        enumerable: true,
        get() { return undefined; },
        set(value) {
          patchStageFXClass(value);
          Object.defineProperty(B, 'Level01StageFX', { value, writable: true, configurable: true, enumerable: true });
        }
      });
    } catch (_) {}
  }

  installCharacterAnimationCleanup();
  installJammerLift();
  installTrafficLayering();
  installTutorialTaskPlacement();
  armSector1Patch();
  armStageFXPatch();
})();

window.PostTutorialObjectives = class PostTutorialObjectives {
  constructor() { this.completedObjectives = new Set(); }
  update() {}
  draw(ctx) { if (window.objectivesSystem && typeof window.objectivesSystem.draw === 'function') window.objectivesSystem.draw(ctx); }
  reset() { this.completedObjectives.clear(); }
};
