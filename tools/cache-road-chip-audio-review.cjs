// Runs in Chromium, through the production AudioSystem and real Web Audio.
// This audition is intentionally separate from the scripted driving capture:
// isolated cues make masking/distortion reviewable, then the original five
// stems demonstrate the engine and cues in their actual musical context.
module.exports = async function reviewRoadChipAudio() {
  const require = (condition, message) => { if (!condition) throw Error(message); };
  const rate = 32000, beat = 60 / 128, seconds = 42;
  const stems = ['pressure', 'drive', 'flow', 'breakaway', 'undercurrent'];
  const volumes = [.60, .19, .55, .50, .62];
  const context = new OfflineAudioContext(2, seconds * rate, rate);
  const decoded = new Map();
  for (const name of stems) {
    const response = await fetch(`/assets/audio/cache-${name}.mp3`);
    require(response.ok, `Chip audition missing original stem: ${name}`);
    const buffer = await context.decodeAudioData(await response.arrayBuffer());
    require(Math.abs(buffer.duration - 187.5) < .01, `Unexpected ${name} duration`);
    decoded.set(name, buffer);
  }
  function rig(ctx) {
    const audio = new AudioSystem(), sourceLog = [], bufferNames = new Map();
    for (const [name, buffer] of decoded) bufferNames.set(buffer, name);
    let clock = 0, maxVoices = 0;
    const wrapSource = (source, type) => {
      const start = source.start.bind(source), stop = source.stop.bind(source);
      const entry = { type, starts: [], stops: [], source };
      sourceLog.push(entry);
      source.start = (...args) => {
        entry.music = bufferNames.get(source.buffer) || null;
        entry.starts.push(args); return start(...args);
      };
      source.stop = (...args) => { entry.stops.push(args); return stop(...args); };
      return source;
    };
    audio.context = new Proxy(ctx, { get(target, key) {
      if (key === 'state') return 'running';
      if (key === 'currentTime') return clock;
      if (key === 'createBufferSource') return () => wrapSource(target.createBufferSource(), 'buffer');
      if (key === 'createOscillator') return () => wrapSource(target.createOscillator(), 'oscillator');
      const value = target[key];
      return typeof value === 'function' ? value.bind(target) : value;
    } });
    audio.sfxGain = ctx.createGain(); audio.sfxGain.connect(ctx.destination);
    audio.musicGain = ctx.createGain(); audio.musicGain.gain.value = .8;
    audio.musicGain.connect(ctx.destination); audio.initialized = true;
    const inspect = () => { maxVoices = Math.max(maxVoices, audio.combatVoices?.size || 0);
      require(maxVoices <= 12, `Unbounded chip one-shots: ${maxVoices}`);
      require((audio.roadCueBuffers?.size || 0) <= 96, 'Unbounded chip buffer cache');
    };
    return { audio, sourceLog, inspect, setClock: value => { clock = value; },
      get maxVoices() { return maxVoices; } };
  }
  async function render(r, ctx, events) {
    const groups = new Map();
    for (const event of events.sort((a, b) => a.time - b.time)) {
      const quantum = Math.max(0, Math.floor(event.time * ctx.sampleRate / 128));
      require(quantum * 128 < ctx.length, 'Review event beyond render duration');
      if (!groups.has(quantum)) groups.set(quantum, []);
      groups.get(quantum).push(event);
    }
    const waits = [];
    for (const [quantum, batch] of groups) waits.push(ctx.suspend(quantum * 128 / ctx.sampleRate).then(async () => {
      try {
        for (const event of batch) { r.setClock(event.time); event.run(); r.inspect(); }
      } finally {
        // A failed assertion must surface its actual error, not strand the
        // renderer in a suspension until the outer CDP timeout expires.
        await ctx.resume();
      }
    }));
    const [buffer] = await Promise.all([ctx.startRendering(), ...waits]);
    // Deliver native AudioScheduledSourceNode ended events before counting.
    await new Promise(resolve => setTimeout(resolve, 0));
    return buffer;
  }
  function metrics(buffer, from = 0, to = buffer.duration) {
    const start = Math.max(0, Math.floor(from * buffer.sampleRate));
    const end = Math.min(buffer.length, Math.ceil(to * buffer.sampleRate));
    let peak = 0, energy = 0, sum = 0, clipped = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let index = start; index < end; index++) {
        const value = data[index]; require(Number.isFinite(value), 'Non-finite chip PCM');
        peak = Math.max(peak, Math.abs(value)); energy += value * value; sum += value;
        if (Math.abs(value) >= 1) clipped++;
      }
    }
    const samples = (end - start) * buffer.numberOfChannels;
    return { peak, rms: Math.sqrt(energy / samples), dc: sum / samples, clipped, samples };
  }
  const r = rig(context), audio = r.audio, events = [], labels = [], scheduled = [];
  const cue = (kind, at, options = {}, lead = .06) => {
    const calledAt = at - lead;
    events.push({ time: calledAt, run() {
      const opts = { audioTimeSec: at, trackTimeSec: 7.5, ...options };
      const ok = audio.playCombatCue(kind, opts), result = { ...audio.lastSFXCue };
      require(ok, `Audition cue refused: ${kind}`);
      require(Math.abs(result.audioTimeSec - at) < 1e-8, `${kind} moved its source-clock deadline`);
      const duplicate = audio.playCombatCue(kind, opts);
      require(duplicate === false, `${kind} duplicate escaped cadence gate`);
      scheduled.push({ kind, at, calledAt, ...result, duplicateRejected: true });
    } });
  };
  const isolated = [
    ['Count TWO', 'roadCount', { countBeat: 2 }],
    ['Count THREE', 'roadCount', { countBeat: 3 }],
    ['Count FOUR', 'roadCount', { countBeat: 4 }],
    ['Downbeat ONE', 'roadReady'], ['Perfect catch', 'roadPerfect', { action: 2 }],
    ['Good catch', 'roadGood', { action: 0 }], ['Impact / crash', 'roadCrash', { intensity: .85 }],
    ['Gear shift', 'roadShift'], ['Turbo launch', 'roadTurbo'], ['Turbo ready', 'roadTurboReady'],
    ['Close pass', 'roadNearMiss', { pan: -.7 }], ['Brace / protection', 'roadBrace'],
    ['Push', 'roadPush'], ['Echo', 'roadEcho'], ['Lane lock', 'roadLock'],
    ['Refill', 'roadRefill'], ['Warning', 'roadWarning'], ['Miss', 'roadMiss'], ['Empty', 'roadEmpty']
  ];
  isolated.forEach(([label, kind, options], index) => {
    const at = .25 + index * .88;
    labels.push({ label, kind, from: at, to: at + .83, section: 'isolated' });
    cue(kind, at, options);
  });
  labels.push({ label: 'Downbeat ONE in the F-bass measure', kind: 'roadReady',
    from: 17.05, to: 17.88, section: 'isolated' });
  cue('roadReady', 17.05, { trackTimeSec: 39.375 });
  const engineSamples = [];
  function enginePass(from, to, inMusic) {
    labels.push({ label: inMusic ? 'Original five stems with dynamic chip engine and cues' :
      'Engine: three gears, load-up, turbo and damage', from, to,
      section: inMusic ? 'in-song' : 'engine' });
    let firstSources = null;
    const count = Math.round((to - from) * 20);
    for (let index = 0; index < count; index++) {
      const at = from + index / 20, u = index / count;
      const gear = u < .30 ? 0 : u < .62 ? 1 : 2;
      const shifting = (u > .26 && u < .33) || (u > .58 && u < .65) ? .85 : 0;
      const boost = u > .70 && u < .83 ? 1 : 0;
      const damage = u > .88 && u < .94 ? .8 : 0;
      const load = .20 + .65 * Math.abs(Math.sin(u * Math.PI * 2));
      const speed = boost ? 78 : [30, 52, 70][gear];
      events.push({ time: at, run() {
        audio.updateRoadEngine({ active: true, gear, speed,
          shifting, boost, load, damage, pan: inMusic ? .12 : -.25 + .5 * u,
          trackTimeSec: inMusic ? 30 + at - from : 7.5 + at - from });
        const engine = audio.roadEngine;
        require(engine && engine.sources.length === 3, 'Engine did not create its bounded three-source graph');
        if (!firstSources) firstSources = [...engine.sources];
        require(engine.sources.every((source, position) => source === firstSources[position]),
          'Engine update restarted an oscillator/noise source');
        if (index % 10 === 0) engineSamples.push({ at, gear, speed, shifting, boost, damage, load,
          rpmHz: engine.rpmHz, pulseHz: engine.pulse.frequency.value, subHz: engine.sub.frequency.value });
      } });
    }
    events.push({ time: to, run() {
      audio.stopRoadEngine(); require(!audio.roadEngine, 'Stopped engine graph retained');
    } });
  }
  enginePass(18, 24, false);
  enginePass(26, 41, true);
  for (let index = 0; index < stems.length; index++) {
    const name = stems[index], source = audio.context.createBufferSource(), gain = context.createGain();
    source.buffer = decoded.get(name); gain.gain.value = volumes[index];
    source.connect(gain); gain.connect(audio.musicGain);
    // Bar 17 of the user's original arrangement. No resampling, re-seeking,
    // tempo change or replacement song is used for the in-context audition.
    source.start(26, 30); source.stop(41);
    audio.musicTracks[`cache-${name}`] = { source, gain, buffer: source.buffer, isPlaying: true, startTime: -4 };
  }
  for (let countBeat = 2; countBeat <= 4; countBeat++) cue('roadCount', 26 + (countBeat - 1) * beat,
    { countBeat, trackTimeSec: 30 + (countBeat - 1) * beat }, .12);
  const musicCues = [
    ['roadReady', 1, {}], ['roadPerfect', 2, { action: 2 }],
    ['roadNearMiss', 2.5, { pan: .85 }], ['roadShift', 3, {}],
    ['roadTurboReady', 3.5, {}], ['roadTurbo', 4, {}],
    ['roadBrace', 4.5, {}], ['roadGood', 5, { action: 1 }],
    ['roadCrash', 5.5, { intensity: .7, pan: -.4 }],
    ['roadEcho', 6, {}], ['roadPerfect', 7, { action: 3 }]
  ];
  for (const [kind, bar, options] of musicCues) {
    const at = 26 + bar * beat * 4;
    cue(kind, at, { ...options, trackTimeSec: 30 + at - 26 }, .14);
    labels.push({ label: kind, kind, from: at, to: at + .75, section: 'in-song cue' });
  }
  const buffer = await render(r, context, events);
  const beforeCleanup = { voices: audio.combatVoices?.size || 0, engine: !!audio.roadEngine,
    releasingEngines: audio.roadEngineReleases?.size || 0 };
  require(beforeCleanup.voices === 0 && !beforeCleanup.engine && beforeCleanup.releasingEngines === 0,
    'Audition leaked native ended voices/engine');
  audio.stopCombatCues();
  const total = metrics(buffer);
  require(total.peak < 1 && !total.clipped && Math.abs(total.dc) < .01,
    `Clipped or DC-offset audition PCM: ${JSON.stringify(total)}`);
  for (const label of labels.filter(item => item.section === 'isolated')) {
    const m = metrics(buffer, label.from, label.to);
    require(m.rms > .0003 && m.peak < 1 && Math.abs(m.dc) < .02, `Silent/invalid ${label.kind}: ${JSON.stringify(m)}`);
    const before = metrics(buffer, label.from - .025, label.from - .001);
    require(before.peak < .00005, `${label.kind} sounded before its scheduled deadline`);
    label.metrics = m;
  }
  const dReady = scheduled.find(item => item.kind === 'roadReady' && item.at < 10);
  const fReady = scheduled.find(item => item.kind === 'roadReady' && item.at === 17.05);
  require(dReady?.noteRoot === 'D' && fReady?.noteRoot === 'F',
    'The soundtrack\'s measured D/F changes did not reach production cue scheduling');
  const engineMetrics = [metrics(buffer, 18.3, 19.1), metrics(buffer, 21.0, 21.8), metrics(buffer, 22.3, 22.9)];
  require(engineMetrics.every(item => item.rms > .0001), 'One engine gear produced silence');
  require(new Set(engineSamples.map(item => Math.round(item.rpmHz))).size >= 6,
    'Engine did not respond dynamically to gear/load/turbo');
  require(metrics(buffer, 24.2, 25.8).peak < .00005 && metrics(buffer, 41.2, 41.9).peak < .00005,
    'Stopped engine left audible residual signal');
  const musicSources = r.sourceLog.filter(item => item.music);
  require(musicSources.length === 5 && musicSources.every(item => item.starts.length === 1 &&
    item.starts[0][0] === 26 && item.starts[0][1] === 30 && item.stops.length === 1 && item.stops[0][0] === 41),
  'SFX/engine mutated original music source starts, offsets or stops');

  // Stress is not part of the listening reel. Concurrent voice stealing and
  // finite cached variants are tested separately at full user SFX gain.
  const stressContext = new OfflineAudioContext(2, rate * 3, rate), stress = rig(stressContext);
  const stressEvents = [], stressKinds = isolated.map(item => item[1]);
  let accepted = 0, cacheBeforeRepeat = 0, cacheAfterRepeat = 0;
  for (let index = 0; index < 300; index++) stressEvents.push({ time: .1 + index * .004, run() {
    const kind = stressKinds[index % stressKinds.length];
    if (stress.audio.playCombatCue(kind, { intensity: (index % 8) / 7, action: index % 4,
      countBeat: 2 + index % 3, pan: index % 2 ? -.7 : .7,
      trackTimeSec: index % 2 ? 39.375 : 7.5 })) accepted++;
  } });
  stressEvents.push({ time: 1.5, run() {
    // The same already-generated cue variant must not keep allocating buffers.
    stress.audio.playCombatCue('roadPerfect', { trackTimeSec: 7.5, action: 0 });
    cacheBeforeRepeat = stress.audio.roadSFXStats?.cacheBuilds || 0;
  } });
  stressEvents.push({ time: 1.7, run() {
    stress.audio.playCombatCue('roadPerfect', { trackTimeSec: 7.5, action: 0 });
    cacheAfterRepeat = stress.audio.roadSFXStats?.cacheBuilds || 0;
  } });
  stressEvents.push({ time: 2.5, run() { stress.audio.stopCombatCues(); stress.audio.stopRoadEngine(); } });
  const stressBuffer = await render(stress, stressContext, stressEvents), stressPCM = metrics(stressBuffer);
  require(accepted > 100 && stress.maxVoices <= 12, 'Stress did not exercise bounded voice stealing');
  require(cacheBeforeRepeat === cacheAfterRepeat, 'Repeated chip cue rebuilt its immutable buffer');
  require(stressPCM.peak < 1 && !stressPCM.clipped && Math.abs(stressPCM.dc) < .01,
    `Concurrent chip cues clip at full SFX gain: ${JSON.stringify(stressPCM)}`);
  require(!stress.audio.combatVoices?.size && !stress.audio.roadEngine, 'Stress cleanup leaked voices');

  // Actual AudioContext suspend/resume verifies the production lifecycle, which
  // cannot be proven by an OfflineAudioContext proxy. Muted only at destination.
  const live = new AudioContext({ sampleRate: rate }), lifecycleAudio = new AudioSystem();
  const lifecycle = { starts: 0, stops: 0 };
  try {
    lifecycleAudio.context = live; lifecycleAudio.initialized = true;
    lifecycleAudio.sfxGain = live.createGain(); lifecycleAudio.sfxGain.gain.value = 0;
    lifecycleAudio.sfxGain.connect(live.destination);
    lifecycleAudio.musicGain = live.createGain(); lifecycleAudio.musicGain.connect(lifecycleAudio.sfxGain);
    await live.resume();
    for (const [name, data] of decoded) {
      const source = live.createBufferSource(); source.buffer = data;
      const stop = source.stop.bind(source); source.stop = (...args) => { lifecycle.stops++; return stop(...args); };
      source.connect(lifecycleAudio.musicGain); source.start(live.currentTime, 30); lifecycle.starts++;
      lifecycleAudio.musicTracks[name] = { source, isPlaying: true, startTime: live.currentTime - 30 };
    }
    const update = () => lifecycleAudio.updateRoadEngine({ active: true, gear: 1, speed: 52,
      load: .5, boost: 0, shifting: 0, damage: 0, trackTimeSec: 30 });
    update(); lifecycleAudio.playCombatCue('roadPerfect', { audioTimeSec: live.currentTime + .15, trackTimeSec: 30 });
    const oldEngine = lifecycleAudio.roadEngine;
    const pause = await lifecycleAudio.pauseRuntimeAudio();
    require(pause.ok && live.state === 'suspended' && !lifecycleAudio.roadEngine &&
      !lifecycleAudio.combatVoices?.size, 'Pause left road engine/cues alive');
    const resume = await lifecycleAudio.resumeRuntimeAudio(); update();
    require(resume.ok && lifecycleAudio.roadEngine && lifecycleAudio.roadEngine !== oldEngine,
      'Resume failed to recreate the engine once');
    require(lifecycle.starts === 5 && lifecycle.stops === 0,
      'Pause/resume or engine update restarted/stopped a music stem');
    const restart = await lifecycleAudio.prepareRestartAudio();
    require(restart.ok && !lifecycleAudio.roadEngine && !lifecycleAudio.combatVoices?.size &&
      lifecycle.stops === 5, 'Restart failed to release road/music sources');
    lifecycle.pause = pause.reason; lifecycle.resume = resume.reason; lifecycle.restart = restart.reason;
    lifecycle.engineStats = { ...lifecycleAudio.roadSFXStats };
  } finally {
    lifecycleAudio.stopCombatCues();
    // close() cannot deliver a future release tail's ended event. Retire it
    // explicitly before closing this disposable test context.
    lifecycleAudio.stopRoadEngine({ immediate: true });
    await live.close();
  }

  // Small, uncompressed stereo PCM file is reproducible and can be auditioned
  // directly or transcoded by packaging without touching the generated SFX.
  const pcm = new ArrayBuffer(44 + buffer.length * 4), view = new DataView(pcm);
  const str = (offset, value) => { for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i)); };
  str(0, 'RIFF'); view.setUint32(4, pcm.byteLength - 8, true); str(8, 'WAVE'); str(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 2, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 4, true); view.setUint16(32, 4, true);
  view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, pcm.byteLength - 44, true);
  for (let index = 0; index < buffer.length; index++) for (let channel = 0; channel < 2; channel++)
    view.setInt16(44 + (index * 2 + channel) * 2, Math.round(buffer.getChannelData(channel)[index] * 32767), true);
  const bytes = new Uint8Array(pcm); let binary = '';
  for (let index = 0; index < bytes.length; index += 16384)
    binary += String.fromCharCode(...bytes.subarray(index, index + 16384));
  return { seconds, sampleRate: rate, grid: { bpm: 128, beatSec: beat, meter: '4/4' },
    originalStems: stems, musicSourceStarts: musicSources.map(item => ({ stem: item.music, starts: item.starts, stops: item.stops })),
    pcm: btoa(binary), metrics: total, labels, scheduled, engineSamples, engineMetrics,
    maxVoices: r.maxVoices, cacheEntries: audio.roadCueBuffers?.size || 0,
    stats: { ...audio.roadSFXStats }, beforeCleanup, lifecycle,
    stress: { accepted, maxVoices: stress.maxVoices, cacheEntries: stress.audio.roadCueBuffers?.size || 0,
      cacheBeforeRepeat, cacheAfterRepeat, metrics: stressPCM, stats: { ...stress.audio.roadSFXStats } } };
};
