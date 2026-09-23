// Owner-supplied, aligned parts for Cache Back's road/mix interaction proof.
// These are one song's compatible parts, not campaign Stem Keys or Level 1 audio.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/cache-road-proof-profile.js', exports: ['BARCODE.CACHE_ROAD_PROOF_PROFILE_ID'], dependencies: ['BARCODE.MusicProfiles'] });
(function(B) {
  const source = (name, role) => ({ sourceId: `cache-${name}`, mixRole: role,
    assetId: `audio.proof.cache-${name}`, url: `assets/audio/cache-${name}.mp3`,
    required: true, gain: 0, offsetSec: 0, nativeLoop: true,
    fallbackRole: 'required-or-degraded', playbackPolicy: 'start-synchronously' });
  B.CACHE_ROAD_PROOF_PROFILE_ID = 'level-02.proof';
  B.MusicProfiles.register({
    profileId: B.CACHE_ROAD_PROOF_PROFILE_ID, levelId: 'level-02', runtimeRegistration: true,
    metadataStatus: 'unverified',
    arrangement: { sources: [source('bass', 'bass'), source('drums', 'drums'),
      source('harmony', 'harmony'), source('fx', 'fx')] },
    laneMix: { laneRoles: ['bass', 'drums', 'harmony', 'fx'],
      laneGains: [0.28, 0.62, 0.52, 0.64], fadeSec: 0.16 },
    playback: { startTrackSec: 0, loop: null, endPolicy: 'native-loop' },
    timeline: { mode: 'fixed-tempo', gridOriginTrackSec: 0,
      fixedGrid: { quarterBpm: 128, beatsPerBar: 4, beatUnit: 4 } },
    phrasePresentation: { barsPerPhrase: 8, beatCount: 32 }, judgmentRules: []
  });
})(window.BARCODE = window.BARCODE || {});
