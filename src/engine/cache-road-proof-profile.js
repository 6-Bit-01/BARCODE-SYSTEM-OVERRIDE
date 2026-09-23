// Owner-supplied, aligned parts for Cache Back's road/mix interaction proof.
// These are one song's compatible parts, not campaign Stem Keys or Level 1 audio.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/cache-road-proof-profile.js', exports: ['BARCODE.CACHE_ROAD_PROOF_PROFILE_ID'], dependencies: ['BARCODE.MusicProfiles'] });
(function(B) {
  // Some preview imports omit binary assets; use the identical published
  // revision if the first-party URL cannot be decoded on that host.
  const publishedAudio = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/c2ca847c63c3b8b70ba178dd02fda0ad8ab4f508/assets/audio/';
  const source = (name, role) => ({ sourceId: `cache-${name}`, mixRole: role,
    assetId: `audio.proof.cache-${name}`, url: `assets/audio/cache-${name}.mp3`,
    backupUrl: `${publishedAudio}cache-${name}.mp3`,
    required: true, gain: 0, offsetSec: 0, nativeLoop: true,
    fallbackRole: 'required-or-degraded', playbackPolicy: 'start-synchronously' });
  B.CACHE_ROAD_PROOF_PROFILE_ID = 'level-02.proof';
  B.MusicProfiles.register({
    profileId: B.CACHE_ROAD_PROOF_PROFILE_ID, levelId: 'level-02', runtimeRegistration: true,
    metadataStatus: 'unverified',
    arrangement: { sources: [source('bass', 'bass'), source('drums', 'drums'),
      source('harmony', 'harmony'), source('fx', 'fx')] },
    // Bass and drums carry the same song through every lane. The lane accents
    // rearrange parts above that foundation; FX alone is too sparse to carry
    // the opening. The fourth lane uses a Harmony/FX combination until its
    // own instrumental is supplied.
    laneMix: { laneRoles: ['bass', 'drums', 'harmony', 'fx'],
      baseGains: { bass: 0.13, drums: 0.52, harmony: 0.06, fx: 0.30 },
      laneAccents: [ { bass: 0.05 }, { drums: 0.16 },
        { harmony: 0.64 }, { harmony: 0.34, fx: 0.40 } ],
      transitionSec: 0.14 },
    playback: { startTrackSec: 0, loop: null, endPolicy: 'native-loop' },
    timeline: { mode: 'fixed-tempo', gridOriginTrackSec: 0,
      fixedGrid: { quarterBpm: 128, beatsPerBar: 4, beatUnit: 4 } },
    phrasePresentation: { barsPerPhrase: 8, beatCount: 32 }, judgmentRules: []
  });
})(window.BARCODE = window.BARCODE || {});
