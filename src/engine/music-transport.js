// Fixed/no-grid music transport for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/music-transport.js',
  exports: ['BARCODE.MusicTransport'],
  dependencies: ['BARCODE.MusicProfiles']
});

window.BARCODE = window.BARCODE || {};

(function(namespace) {
  'use strict';
  const freeze = namespace.MusicProfiles.deepFreeze;
  const clone = namespace.MusicProfiles.cloneProfile;

  function makeNoProfile(reason, generation) {
    return freeze({ status: 'no-profile', reason, profileId: null, generation, running: false, trackTimeSec: null, grid: null, judgmentAvailable: false });
  }

  function createTransport() {
    let profile = null;
    let generation = 0;
    let running = false;
    let sourceAnchorAudioSec = null;
    let sourceOffsetTrackSec = 0;
    let lastSample = null;
    let boundaryListeners = [];
    let lastBoundaryBeat = null;
    let hitches = 0;

    function load(profileId) {
      const next = namespace.MusicProfiles.get(profileId);
      if (!next) {
        if (profile || running) generation++;
        profile = null; running = false; sourceAnchorAudioSec = null; sourceOffsetTrackSec = 0; lastBoundaryBeat = null;
        return makeNoProfile('unknown-or-invalid-profile-id', generation);
      }
      if (!profile || profile.profileId !== next.profileId) generation++;
      profile = next; running = false; sourceAnchorAudioSec = null; sourceOffsetTrackSec = next.playback.startTrackSec || 0; lastBoundaryBeat = null;
      return sample(sourceAnchorAudioSec || 0);
    }

    function start(options) {
      options = options || {};
      if (!profile) return makeNoProfile('no-profile-loaded', generation);
      const anchor = options.sourceAnchorAudioSec;
      const offset = options.sourceOffsetTrackSec != null ? options.sourceOffsetTrackSec : profile.playback.startTrackSec || 0;
      if (running && sourceAnchorAudioSec === anchor && sourceOffsetTrackSec === offset) return sample(anchor);
      if (!running || sourceAnchorAudioSec !== anchor || sourceOffsetTrackSec !== offset) generation++;
      running = true; sourceAnchorAudioSec = anchor; sourceOffsetTrackSec = offset; lastBoundaryBeat = null;
      return sample(anchor);
    }

    function stop() {
      if (running || profile) generation++;
      running = false; sourceAnchorAudioSec = null; lastBoundaryBeat = null;
      return sample(0);
    }

    function coordinatedRestart(anchor) {
      if (!profile) return makeNoProfile('no-profile-loaded', generation);
      generation++;
      running = true; sourceAnchorAudioSec = anchor; sourceOffsetTrackSec = profile.playback.startTrackSec || 0; lastBoundaryBeat = null;
      return sample(anchor);
    }

    function fixedGrid(trackTimeSec) {
      if (!profile || !profile.timeline || profile.timeline.mode !== 'fixed-tempo') return null;
      const grid = profile.timeline.fixedGrid;
      const gridTime = trackTimeSec - profile.timeline.gridOriginTrackSec;
      if (gridTime < 0) return null;
      const beatDurationSec = 60 / grid.quarterBpm;
      const beatFloat = gridTime / beatDurationSec;
      const beatIndex = Math.floor(beatFloat);
      return freeze({ beatDurationSec, beatFloat, beatIndex, beatInBar: beatIndex % grid.beatsPerBar, barIndex: Math.floor(beatIndex / grid.beatsPerBar), beatsPerBar: grid.beatsPerBar, phraseBeatCount: profile.phrasePresentation && profile.phrasePresentation.beatCount || null, establishmentBeatCount: profile.legacyCompatibility && profile.legacyCompatibility.establishmentBeatCount || null });
    }

    function sample(audioTimeSec) {
      if (!profile) return makeNoProfile('no-profile-loaded', generation);
      const trackTimeSec = running && sourceAnchorAudioSec != null ? (audioTimeSec - sourceAnchorAudioSec) + sourceOffsetTrackSec : sourceOffsetTrackSec;
      const snapshot = freeze({ status: 'ok', profileId: profile.profileId, metadataStatus: profile.metadataStatus, generation, running, audioTimeSec, sourceAnchorAudioSec, sourceOffsetTrackSec, trackTimeSec, grid: fixedGrid(trackTimeSec), judgmentAvailable: profile.timeline.mode === 'fixed-tempo' && profile.judgmentRules.length > 0 });
      lastSample = snapshot;
      return snapshot;
    }

    function poll(audioTimeSec) {
      const snapshot = sample(audioTimeSec);
      const events = [];
      if (snapshot.grid) {
        const beat = snapshot.grid.beatIndex;
        if (lastBoundaryBeat == null) lastBoundaryBeat = beat;
        if (beat > lastBoundaryBeat) {
          const crossed = Math.min(beat - lastBoundaryBeat, 16);
          if (beat - lastBoundaryBeat > crossed) hitches++;
          for (let i = crossed; i >= 1; i--) events.push(freeze({ type: 'beat', beatIndex: beat - i + 1, generation: snapshot.generation, profileId: snapshot.profileId }));
          lastBoundaryBeat = beat;
        }
      }
      const batch = freeze({ snapshot, events, hitches });
      events.forEach(event => boundaryListeners.slice().forEach(listener => listener(event)));
      return batch;
    }

    function judgeInput(ruleId, audioTimeSec) {
      const snapshot = sample(audioTimeSec);
      if (!snapshot.judgmentAvailable || !snapshot.grid) return freeze({ available: false, timing: 'unavailable', generation: snapshot.generation });
      const rule = profile.judgmentRules.find(candidate => candidate.id === ruleId);
      if (!rule) return freeze({ available: false, timing: 'unavailable', generation: snapshot.generation });
      const beatMs = snapshot.grid.beatDurationSec * 1000;
      const phaseMs = (snapshot.grid.beatFloat - Math.floor(snapshot.grid.beatFloat)) * beatMs;
      const distanceMs = Math.min(phaseMs, beatMs - phaseMs);
      let timing = 'miss';
      if (distanceMs <= rule.windowsMs.perfect) timing = 'perfect';
      else if (distanceMs <= rule.windowsMs.excellent) timing = 'excellent';
      return freeze({ available: true, timing, distanceMs, generation: snapshot.generation });
    }

    return freeze({ load, start, stop, coordinatedRestart, sample, poll, judgeInput, onBoundary: function(type, listener) { boundaryListeners.push(listener); return function(){ boundaryListeners = boundaryListeners.filter(item => item !== listener); }; }, getListenerCount: function(){ return boundaryListeners.length; }, getLastSample: function(){ return clone(lastSample); } });
  }

  namespace.MusicTransport = createTransport();
  namespace.createMusicTransport = createTransport;
})(window.BARCODE);
