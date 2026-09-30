// The clean copy gets one physical road address and one committed lane.
// The road owns clocks, damage, sound, save boundaries and presentation.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/cache-road-pursuit.js',
  exports: ['BARCODE.CacheRoadPursuit'], dependencies: [] });
(function(B) {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = (n, fallback = 0) => Number.isFinite(n) ? n : fallback;
  const MAX_SPEED = 75;
  const WAVES = Object.freeze([
    Object.freeze({ id: 'scan-lesson', bar: 58, label: 'surveillance', lesson: true }),
    Object.freeze({ id: 'pursuit-approach', bar: 77, label: 'approach' }),
    Object.freeze({ id: 'pursuit-interception', bar: 83, label: 'interception' }),
    Object.freeze({ id: 'pursuit-last-pass', bar: 88, label: 'last-pass' })
  ]);
  const TUNING = Object.freeze({
    relaxed: Object.freeze({ lead: 180, lockMs: 600, gap: .48 }),
    standard: Object.freeze({ lead: 155, lockMs: 450, gap: .52 }),
    overclocked: Object.freeze({ lead: 140, lockMs: 350, gap: .55 })
  });
  const ECHO_RUNWAY = 65;
  const SAFE_RADIUS = 90;
  function create({ barFloat = 0 } = {}) {
    const bar = Math.max(0, finite(barFloat));
    return { version: 1, lastBar: bar,
      // Checkpoint recovery never recreates a half-finished, unseen strike.
      // A marker exactly at an announcement still receives its full runway.
      announced: WAVES.filter(wave => wave.bar < bar - .001).map(wave => wave.id),
      actor: null, phase: bar >= 92 ? 'delivery' : bar >= 90 ? 'prepare-delivery' : bar >= 76 ? 'approach' : 'quiet',
      prepareAnnounced: bar >= 90, deliveryAnnounced: bar >= 92,
      deliveryActorCreated: false };
  }
  function blocks(actors, at, lane) {
    return actors.some(actor => Number.isFinite(actor.at) && Number.isFinite(actor.lane) &&
      !actor.cleared && Math.abs(actor.at - at) <= SAFE_RADIUS && Math.abs(actor.lane - lane) < .72);
  }
  function pulseConflict(input, at, lane) {
    const pulses = Array.isArray(input.protectedPulses) ? input.protectedPulses :
      [{ at: input.protectedAt, lane: input.protectedLane }];
    return pulses.some(pulse => Number.isFinite(pulse.at) && Number.isFinite(pulse.lane) &&
      Math.abs(pulse.at - at) <= SAFE_RADIUS && Math.abs(pulse.lane - lane) < .9);
  }
  function chooseLane(input, actor, wanted) {
    const actors = Array.isArray(input.actors) ? input.actors : [];
    const target = clamp(finite(wanted, 1.5), 0, 3);
    const lanes = [0, 1, 2, 3].sort((a, b) => Math.abs(a - target) - Math.abs(b - target) || a - b);
    return lanes.find(lane => !pulseConflict(input, actor.at, lane) &&
      !blocks(actors, actor.at, lane) &&
      [lane - 1, lane + 1].some(escape => escape >= 0 && escape <= 3 &&
        !blocks(actors, actor.at, escape)));
  }
  function smooth(n) { const u = clamp(n, 0, 1); return u * u * (3 - 2 * u); }
  function startTurn(actor, lane) {
    actor.turnFrom = actor.lane; actor.targetLane = lane; actor.turnMs = 0;
  }
  function advanceTurn(actor, dt) {
    actor.turnMs += dt;
    actor.lane = actor.turnFrom + (actor.targetLane - actor.turnFrom) * smooth(actor.turnMs / 400);
  }
  function event(type, actor, extras = {}) {
    return { type, id: actor?.id || 'delivery-runway', at: actor?.at,
      lane: actor?.targetLane, lesson: !!actor?.lesson, ...extras };
  }
  function step(state, input = {}) {
    if (!state || state.version !== 1) return [];
    const progress = Math.max(0, finite(input.progress));
    const before = finite(input.before, progress);
    const bar = Math.max(state.lastBar, finite(input.barFloat, state.lastBar));
    const dt = clamp(finite(input.dt), 0, 100);
    const tuning = TUNING[input.difficultyId] || TUNING.standard;
    const events = [];
    state.lastBar = bar;
    if (bar >= 92) {
      state.phase = 'delivery';
      if (!state.deliveryAnnounced) {
        state.deliveryAnnounced = true;
        events.push(event('stage', null, { stage: 'delivery' }));
      }
      // The right-lane Echo split owns this section. There is no hidden last
      // interception underneath the gate, even following a gear change.
      if (state.actor && !state.actor.delivery && !state.actor.crossed) {
        state.actor.crossed = true; state.actor.aborted = true;
        state.actor.recoverMs = 900; state.actor.warning = false;
      }
      if (!state.deliveryActorCreated && Number.isFinite(input.gateAt)) {
        state.deliveryActorCreated = true;
        if (input.gateAt > progress) {
          // This is the actual clean-copy car at the exit. It follows the
          // replay visibly, but cannot add a hidden collision to the split.
          state.actor = { id: 'delivery-audit', stage: 'delivery-audit', delivery: true,
            at: input.gateAt, lane: 1.5, targetLane: 1.5, turnFrom: 1.5,
            turnMs: 0, ageMs: 0, recoverMs: 0, locked: false, warning: true,
            echoCommitted: false, crossed: false, aborted: false, lesson: false };
        }
      }
    } else {
      if (bar >= 90) {
        state.phase = 'prepare-delivery';
        if (!state.prepareAnnounced) {
          state.prepareAnnounced = true;
          events.push(event('stage', null, { stage: 'prepare-delivery' }));
        }
      }
      const wave = WAVES.find(item => bar >= item.bar && !state.announced.includes(item.id));
      if (wave) {
        // Audio resume may jump ahead. Expired waves are skipped, never
        // stacked together at the current car location.
        state.announced.push(wave.id);
        if (bar - wave.bar < .5) {
          const initialLane = clamp(Math.round(finite(input.lane, 1.5)), 0, 3);
          state.actor = { id: wave.id, stage: wave.label, lesson: !!wave.lesson,
            at: progress + tuning.lead, lane: initialLane <= 1 ? 3 : 0,
            targetLane: initialLane, turnFrom: initialLane <= 1 ? 3 : 0,
            turnMs: 0, ageMs: 0, recoverMs: 0, locked: false,
            warning: true, echoCommitted: false, crossed: false, aborted: false,
            lead: tuning.lead, lockMs: tuning.lockMs, gap: tuning.gap };
          state.phase = wave.label;
          events.push(event('stage', state.actor, { stage: wave.label }));
          events.push(event('warning', state.actor));
          if (wave.lesson) events.push(event('refill', state.actor, { amount: 100 }));
        }
      }
    }
    const actor = state.actor;
    if (!actor) return events;
    const distance = actor.at - progress;
    if (actor.crossed) {
      if (actor.delivery && actor.echoCommitted) advanceTurn(actor, dt);
      actor.recoverMs += dt;
      if (actor.aborted && actor.recoverMs > 1500 || distance < -240) state.actor = null;
      return events;
    }
    if (actor.delivery) {
      const echoLane = input.echo?.lanePos ?? input.echo?.lane;
      if (!actor.echoCommitted && input.echo && input.echoActive !== false && Number.isFinite(echoLane)) {
        actor.locked = true; actor.echoCommitted = true;
        actor.echoLane = clamp(echoLane, 0, 3); startTurn(actor, actor.echoLane);
        events.push(event('echo-lock', actor, { delivery: true }));
      }
      if (actor.echoCommitted) advanceTurn(actor, dt);
      if (before < actor.at && progress >= actor.at) {
        actor.crossed = true; actor.warning = false;
        events.push(event('delivery-pass', actor, { delivery: true, echoCommitted: actor.echoCommitted }));
      }
      return events;
    }
    if (actor.locked && pulseConflict(input, actor.at, actor.targetLane)) {
      // A gear-dependent pad can be published after the rival's lane lock.
      // Keep both addresses fixed and concede the pass instead of moving
      // an announced target or hiding a solid opponent beneath safe paint.
      actor.crossed = true; actor.aborted = true; actor.warning = false;
      events.push(event('disengage', actor, { reason: 'new-pulse-corridor' }));
      return events;
    }
    actor.ageMs += dt;
    if (!actor.locked) {
      const target = chooseLane(input, actor, input.lane);
      if (target !== undefined) actor.targetLane = target;
      actor.lane += (actor.targetLane - actor.lane) * Math.min(1, dt / 190);
      if (actor.ageMs >= actor.lockMs) {
        if (target === undefined) {
          actor.crossed = true; actor.aborted = true; actor.warning = false;
          events.push(event('disengage', actor, { reason: 'no-clear-corridor' }));
          return events;
        }
        actor.locked = true;
        actor.lockProgress = progress;
        startTurn(actor, target);
        events.push(event('lock', actor));
      }
    }
    const echoLane = input.echo?.lanePos ?? input.echo?.lane;
    if (!actor.echoCommitted && actor.locked && input.echo && input.echoActive !== false &&
        Number.isFinite(echoLane) && distance >= ECHO_RUNWAY) {
      const target = chooseLane(input, actor, echoLane);
      // A nearby pad and its escape corridor take priority over the lure.
      // Only visibly committing to the decoy counts as an Echo deception.
      if (target !== undefined && Math.abs(target - echoLane) < .6) {
        actor.echoCommitted = true; actor.echoLane = target;
        startTurn(actor, target);
        events.push(event('echo-lock', actor));
      }
    }
    if (actor.locked) {
      advanceTurn(actor, dt);
    }
    if (before < actor.at && progress >= actor.at) {
      actor.crossed = true; actor.warning = false; actor.recoverMs = 0;
      state.phase = 'recover';
      const gap = Math.abs(actor.lane - finite(input.lane, 1.5));
      if (gap < actor.gap) events.push(event('hit', actor, { kind: 'clean copy', gap }));
      else if (actor.echoCommitted && Math.abs(actor.echoLane - finite(input.lane, 1.5)) >= .7)
        events.push(event('deception', actor, { gap }));
      else events.push(event('evaded', actor, { gap }));
    }
    return events;
  }
  function pose(state, { progress = 0 } = {}) {
    const actor = state?.actor;
    if (!actor || actor.at - progress > 440 || actor.at - progress < -240) return null;
    return { id: actor.id, kind: 'rival', at: actor.at, lane: actor.lane,
      stage: actor.crossed ? 'recover' : actor.stage, warning: actor.warning,
      locked: actor.locked, lockLane: actor.targetLane, echoCommitted: actor.echoCommitted,
      lesson: actor.lesson, delivery: !!actor.delivery, crossed: actor.crossed,
      alpha: actor.aborted ? clamp(1 - actor.recoverMs / 1500, 0, 1) : 1 };
  }
  B.CacheRoadPursuit = Object.freeze({ create, step, pose, waves: WAVES,
    tuning: TUNING, maxSpeed: MAX_SPEED, echoRunway: ECHO_RUNWAY });
})(window.BARCODE = window.BARCODE || {});
