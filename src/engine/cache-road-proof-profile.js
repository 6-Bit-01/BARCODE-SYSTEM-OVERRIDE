// Temporary, synchronized parts for Cache Back's road/mix interaction proof.
// These are one song's compatible parts, not campaign Stem Keys or Level 1 audio.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/cache-road-proof-profile.js', exports: ['BARCODE.CACHE_ROAD_PROOF_PROFILE_ID'], dependencies: ['BARCODE.MusicProfiles'] });
(function(B) {
  const source = (name, role) => ({ sourceId: `cache-${name}`, mixRole: role,
    assetId: `audio.proof.cache-${name}`, url: `assets/audio/cache-road-proof-${name}.wav`,
    required: true, gain: role === 'bed' ? 0.19 : 0, offsetSec: 0, nativeLoop: true,
    fallbackRole: 'required-or-degraded', playbackPolicy: 'start-synchronously' });
  B.CACHE_ROAD_PROOF_PROFILE_ID = 'level-02.proof';
  B.MusicProfiles.register({
    profileId: B.CACHE_ROAD_PROOF_PROFILE_ID, levelId: 'level-02', runtimeRegistration: true,
    metadataStatus: 'unverified',
    arrangement: { sources: [source('bed', 'bed'), source('bass', 'bass'),
      source('break', 'break'), source('harmony', 'harmony'), source('lead', 'lead')] },
    laneMix: { bedRole: 'bed', laneRoles: ['bass', 'break', 'harmony', 'lead'],
      bedGain: 0.19, laneGains: [0.43, 0.48, 0.32, 0.33], fadeSec: 0.16 },
    playback: { startTrackSec: 0, loop: null, endPolicy: 'native-loop' },
    timeline: { mode: 'fixed-tempo', gridOriginTrackSec: 0,
      fixedGrid: { quarterBpm: 120, beatsPerBar: 4, beatUnit: 4 } },
    phrasePresentation: { barsPerPhrase: 8, beatCount: 32 }, judgmentRules: []
  });
})(window.BARCODE = window.BARCODE || {});
