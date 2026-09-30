// Song-directed encounter reveals. Once a bar is committed, every traffic
// contact and pulse address stays in the world through later speed changes.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/game/cache-road-encounters.js',
  exports: ['BARCODE.CacheRoadEncounters'], dependencies: [] });
(function(B) {
  'use strict';
  const VERSION = 1, REVEAL_DISTANCE = 440, MAX_ADDRESS = 16000;
  const KINDS = ['freight', 'van', 'block', 'sweeper', 'trike', 'audit', 'shuttle'];
  const SETTINGS = Object.freeze({
    relaxed: Object.freeze({ id: 'relaxed', maxIntegrity: 4, collisionScale: .88,
      recoveryMs: 1800, minimumRowGap: 118, contactSpacingBars: 4 }),
    standard: Object.freeze({ id: 'standard', maxIntegrity: 3, collisionScale: 1,
      recoveryMs: 1450, minimumRowGap: 92, contactSpacingBars: 2 }),
    overclocked: Object.freeze({ id: 'overclocked', maxIntegrity: 3, collisionScale: 1.04,
      recoveryMs: 1100, minimumRowGap: 74, contactSpacingBars: 2 })
  });
  const ACTS = Object.freeze([
    Object.freeze({ id: 'intro', label: 'NIGHT DEPARTURE', startBar: 0, endBar: 4 }),
    Object.freeze({ id: 'escape', label: 'CITY ESCAPE', startBar: 4, endBar: 28 }),
    Object.freeze({ id: 'freight', label: 'FREIGHT CORRIDOR', startBar: 28, endBar: 52 }),
    Object.freeze({ id: 'surveillance', label: 'AUDIT GRID', startBar: 52, endBar: 76 }),
    Object.freeze({ id: 'pursuit', label: 'FINAL PURSUIT', startBar: 76, endBar: 92 }),
    Object.freeze({ id: 'delivery', label: 'DELIVERY RUNWAY', startBar: 92, endBar: 100 }),
    Object.freeze({ id: 'complete', label: 'DELIVERED', startBar: 100, endBar: 101 })
  ]);
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
  const integer = (value, low, high) => Number.isInteger(value) && value >= low && value <= high;
  const address = value => Number.isFinite(value) && value >= 0 && value <= MAX_ADDRESS;
  function difficulty(id) { return Object.hasOwn(SETTINGS, id) ? SETTINGS[id] : SETTINGS.standard; }
  function act(bar) {
    const measure = Number.isFinite(bar) ? Math.max(0, bar) : 0;
    const info = ACTS.find(item => measure < item.endBar) || ACTS.at(-1);
    const phase = Math.max(0, (Math.floor(measure) - 4) % 24);
    return { ...info, chorus: measure >= 4 && measure < 100 && phase >= 16,
      phrase: measure < 4 ? 0 : Math.floor((measure - 4) / 8), phase };
  }
  function create(difficultyId = 'standard') {
    return { version: VERSION, difficultyId: difficulty(difficultyId).id,
      rows: [], pulses: [], committedBars: [], lastLane: 1, laneDirection: 1 };
  }
  // Same analytic integral as the road: this module never predicts a future
  // gear. Only the section already owned by the audio clock is sampled.
  function endpoint(section) {
    const age = 4 * section.beatSec, blend = .75 * section.beatSec;
    return section.from + section.v0 * blend +
      (section.speed - section.v0) * blend / 2 + section.speed * (age - blend);
  }
  function sectionBar(section) {
    if (!object(section) || !integer(section.beat, 0, 396) || section.beat % 4 ||
        !address(section.from) || !Number.isFinite(section.beatSec) || section.beatSec <= 0 ||
        section.beatSec > 2 || !Number.isFinite(section.v0) || section.v0 < 0 || section.v0 > 150 ||
        !Number.isFinite(section.speed) || section.speed < 0 || section.speed > 150) return null;
    return section.beat / 4;
  }
  function hazards(chart) { return chart?.rows?.flatMap(row => row.actors) || []; }
  function pulses(chart) { return chart?.pulses || []; }
  function occupiedLanes(actor) {
    const other = Number.isInteger(actor.mergeLane) ? actor.mergeLane : actor.lane;
    const low = Math.min(actor.lane, other), high = Math.max(actor.lane, other);
    return [0, 1, 2, 3].filter(lane => lane >= low && lane <= high);
  }
  function rowDue(bar, settings) {
    if (bar < 4 || bar >= 69 || (bar >= 50 && bar <= 62)) return false;
    // The Echo lesson (58) and final pursuit (77/83/88) own open road. At
    // minimum driving speed the last 440-unit civilian reveal clears before
    // either event. Chorus reveals halve ordinary traffic density.
    const chorus = act(bar).chorus;
    if (settings.id === 'relaxed') return bar % (chorus ? 8 : 4) === 0;
    if (settings.id === 'standard') return bar % (chorus ? 4 : 2) === 0;
    return chorus ? bar % 4 === 0 : bar % 2 === 0 || bar % 8 === 5;
  }
  function rowActors(bar, settings) {
    const scene = act(bar), turn = Math.floor((bar - 4) / 2), side = turn % 2 ? 3 : 0;
    if (scene.id === 'escape') {
      const kind = ['van', 'freight', 'trike', 'shuttle'][turn % 4];
      const lane = [0, 3, 1, 2][Math.floor(turn / 2) % 4];
      // A single merge takes exactly one neighboring lane. The whole swept
      // interval is reserved when choosing the next musical route.
      const actor = { kind, lane };
      if (kind === 'trike') Object.assign(actor, { mergeLane: lane === 3 ? 2 : lane + 1,
        warningDistance: 205, mergeDistance: 125 });
      const actors = [actor];
      if (settings.id === 'overclocked' && kind !== 'trike')
        actors.push({ kind: 'van', lane: lane < 2 ? 3 : 0 });
      return actors;
    }
    if (scene.id === 'freight') {
      const pair = turn % 3;
      const specs = pair === 0 ? [{ kind: 'freight', lane: 0 }, { kind: 'shuttle', lane: 3 }] :
        pair === 1 ? [{ kind: 'freight', lane: 3 }, { kind: 'van', lane: 2 }] :
          [{ kind: 'shuttle', lane: 0 }, { kind: 'block', lane: 1 }];
      return settings.id === 'relaxed' ? specs.slice(0, 1) : specs;
    }
    // Audit cars are visibly committed to authored lanes; only the separate
    // staged pursuer targets a replay. Free tracking here could erase a lane
    // already promised to a musical cue.
    const specs = [{ kind: 'audit', lane: side }];
    if (settings.id !== 'relaxed') specs.push({ kind: 'van', lane: side === 0 ? 3 : 0 });
    return specs;
  }
  function ensure(chart, section, reservedPulse) {
    const bar = sectionBar(section);
    if (bar === null || chart?.version !== VERSION || chart.rows.some(row => row.bar === bar)) return null;
    const settings = difficulty(chart.difficultyId);
    if (!rowDue(bar, settings)) return null;
    const at = section.from + REVEAL_DISTANCE, previous = chart.rows.at(-1);
    if (!address(at) || (previous && at - previous.at < settings.minimumRowGap)) return null;
    let specs = rowActors(bar, settings);
    if (reservedPulse && Math.abs(reservedPulse.at - at) < 70)
      specs = specs.filter(spec => !occupiedLanes(spec).includes(reservedPulse.lane));
    if (!specs.length) return null;
    const info = act(bar);
    const actors = specs.map((spec, index) => Object.freeze({ ...spec, at, bar, act: info.id,
      id: `traffic/${bar}/${index}`, encounter: true }));
    const row = Object.freeze({ id: `row/${bar}`, at, bar, act: info.id, actors: Object.freeze(actors) });
    chart.rows.push(row);
    return row;
  }
  function pulseDue(bar) {
    // The 150-unit delivery gate takes until bar 94.67 in first gear.
    // Keep its entire approach free of new cues which could pull Cache out
    // of the right lane; reward pulses return only after every gear clears.
    if (bar < 4 || bar >= 99 || (bar >= 90 && bar < 96)) return false;
    if (bar >= 96) return bar % 2 === 0;
    return act(bar).chorus || bar % 2 === 0;
  }
  function pulse(chart, section, strikeDistance, { protectedActors = [], reservedPursuit } = {}) {
    const bar = sectionBar(section);
    if (bar === null || chart?.version !== VERSION || !Number.isFinite(strikeDistance) ||
        Math.abs(strikeDistance) > 100 || !pulseDue(bar)) return null;
    const existing = chart.pulses.find(item => item.bar === bar);
    if (existing) return existing;
    const at = endpoint(section) + strikeDistance;
    if (!address(at)) return null;
    const blocked = new Set(hazards(chart).filter(actor =>
      actor.at >= section.from - 18 && actor.at <= at + 36).flatMap(occupiedLanes));
    // A rival lane already locked by its visible warning is another fixed
    // promise. Avoid it instead of forcing the pursuit to silently disappear
    // when a later bar commits a musical cue.
    const reservations = [...(Array.isArray(protectedActors) ? protectedActors : [])];
    if (reservedPursuit) reservations.push({ ...reservedPursuit, locked: true });
    for (const actor of reservations) {
      if (!actor?.locked || actor.crossed || !Number.isFinite(actor.at) || Math.abs(actor.at - at) > 90) continue;
      const targetLane = actor.targetLane ?? actor.lockLane ?? actor.lane;
      const currentLane = Number.isFinite(actor.lane) ? actor.lane : targetLane;
      if (!Number.isFinite(targetLane)) continue;
      for (const lane of [0, 1, 2, 3])
        if (lane >= Math.min(currentLane, targetLane) - .65 && lane <= Math.max(currentLane, targetLane) + .65)
          blocked.add(lane);
    }
    let direction = chart.laneDirection;
    if (chart.lastLane === 3) direction = -1;
    if (chart.lastLane === 0) direction = 1;
    const options = [chart.lastLane + direction, chart.lastLane, chart.lastLane - direction]
      .filter(lane => integer(lane, 0, 3) && !blocked.has(lane));
    // Never force a two/three-lane scramble to retain a chart count. A rare
    // blocked beat stays quiet, with the next cue still one lane away.
    if (!options.length) return null;
    const lane = options[0], info = act(bar), run = `song/${info.phrase}`;
    const previous = chart.pulses.at(-1);
    const order = previous?.run === run ? previous.order + 1 : 0;
    const actionCycle = info.id === 'freight' ? [1, 2, 3, 0] :
      info.id === 'surveillance' || info.id === 'pursuit' ? [3, 2, 0, 1] : [0, 2, 3, 1];
    const value = Object.freeze({ id: `song/${bar}`, run, order, action: actionCycle[order % 4],
      lane, at, target: section.beat + 4, bar, act: info.id, encounter: true });
    chart.pulses.push(value); chart.lastLane = lane; chart.laneDirection = direction;
    return value;
  }
  function commit(chart, section, strikeDistance, { allowPulse = true, protectedActors = [], reservedPursuit } = {}) {
    const bar = sectionBar(section);
    if (bar === null || chart?.version !== VERSION) return { row: null, pulse: null };
    if (chart.committedBars.includes(bar)) return { row: chart.rows.find(row => row.bar === bar) || null,
      pulse: chart.pulses.find(item => item.bar === bar) || null };
    const row = ensure(chart, section);
    const issued = allowPulse ? pulse(chart, section, strikeDistance, { protectedActors, reservedPursuit }) : null;
    chart.committedBars.push(bar);
    return { row, pulse: issued };
  }
  function snapshot(chart) { return chart?.version === VERSION ? clone(chart) : null; }
  function restore(raw, difficultyId = raw?.difficultyId) {
    if (!object(raw) || raw.version !== VERSION || !Object.hasOwn(SETTINGS, raw.difficultyId) ||
        raw.difficultyId !== difficulty(difficultyId).id || !Array.isArray(raw.rows) || raw.rows.length > 100 ||
        !Array.isArray(raw.pulses) || raw.pulses.length > 100 || !Array.isArray(raw.committedBars) ||
        raw.committedBars.length > 100 || raw.committedBars.some(bar => !integer(bar, 0, 99)) ||
        new Set(raw.committedBars).size !== raw.committedBars.length || !integer(raw.lastLane, 0, 3) ||
        ![-1, 1].includes(raw.laneDirection)) return null;
    const chart = create(raw.difficultyId), actorIds = new Set(), rowBars = new Set(), pulseBars = new Set();
    for (const row of raw.rows) {
      if (!object(row) || !integer(row.bar, 0, 99) || !raw.committedBars.includes(row.bar) ||
          rowBars.has(row.bar) || row.id !== `row/${row.bar}` || !address(row.at) || row.act !== act(row.bar).id ||
          !Array.isArray(row.actors) || !row.actors.length || row.actors.length > 2 ||
          (chart.rows.length && row.at - chart.rows.at(-1).at < difficulty(raw.difficultyId).minimumRowGap)) return null;
      const actors = [];
      for (let index = 0; index < row.actors.length; index++) {
        const actor = row.actors[index];
        if (!object(actor) || actor.id !== `traffic/${row.bar}/${index}` || actorIds.has(actor.id) ||
            actor.at !== row.at || actor.bar !== row.bar || actor.act !== row.act || actor.encounter !== true ||
            !KINDS.includes(actor.kind) || !integer(actor.lane, 0, 3) ||
            (actor.mergeLane !== undefined && (!integer(actor.mergeLane, 0, 3) ||
              Math.abs(actor.mergeLane - actor.lane) !== 1 || actor.warningDistance !== 205 || actor.mergeDistance !== 125))) return null;
        const safe = { kind: actor.kind, lane: actor.lane, at: actor.at, bar: actor.bar,
          act: actor.act, id: actor.id, encounter: true };
        if (actor.mergeLane !== undefined) Object.assign(safe, { mergeLane: actor.mergeLane,
          warningDistance: actor.warningDistance, mergeDistance: actor.mergeDistance });
        actors.push(Object.freeze(safe)); actorIds.add(actor.id);
      }
      if (new Set(actors.flatMap(occupiedLanes)).size > 2) return null;
      chart.rows.push(Object.freeze({ id: row.id, at: row.at, bar: row.bar,
        act: row.act, actors: Object.freeze(actors) })); rowBars.add(row.bar);
    }
    for (const item of raw.pulses) {
      if (!object(item) || !integer(item.bar, 0, 98) || !raw.committedBars.includes(item.bar) ||
          pulseBars.has(item.bar) || item.id !== `song/${item.bar}` || item.run !== `song/${act(item.bar).phrase}` ||
          !integer(item.order, 0, 7) || !integer(item.action, 0, 3) || !integer(item.lane, 0, 3) ||
          !address(item.at) || item.target !== (item.bar + 1) * 4 || item.act !== act(item.bar).id ||
          item.encounter !== true || Math.abs(item.lane - (chart.pulses.at(-1)?.lane ?? 1)) > 1 ||
          (chart.pulses.length && item.bar <= chart.pulses.at(-1).bar)) return null;
      chart.pulses.push(Object.freeze({ id: item.id, run: item.run, order: item.order,
        action: item.action, lane: item.lane, at: item.at, target: item.target,
        bar: item.bar, act: item.act, encounter: true })); pulseBars.add(item.bar);
    }
    if (chart.pulses.length && chart.pulses.at(-1).lane !== raw.lastLane) return null;
    chart.committedBars = [...raw.committedBars]; chart.lastLane = raw.lastLane;
    chart.laneDirection = raw.laneDirection;
    return chart;
  }
  B.CacheRoadEncounters = Object.freeze({ version: VERSION, revealDistance: REVEAL_DISTANCE,
    create, commit, ensure, pulse, pulses, hazards, occupiedLanes, act, difficulty, snapshot, restore });
})(window.BARCODE = window.BARCODE || {});
