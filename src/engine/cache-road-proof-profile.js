// Owner-supplied, aligned parts for Cache Back's road/mix interaction proof.
// These are one song's compatible parts, not campaign Stem Keys or Level 1 audio.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({ name: 'src/engine/cache-road-proof-profile.js', exports: ['BARCODE.CACHE_ROAD_PROOF_PROFILE_ID'], dependencies: ['BARCODE.MusicProfiles'] });
(function(B) {
  // Some preview imports omit binary assets; use the identical published
  // revision if the first-party URL cannot be decoded on that host.
  const publishedAudio = 'https://raw.githubusercontent.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/agent/cache-road-full-song/assets/audio/';
  const source = (name, role) => ({ sourceId: `cache-${name}`, mixRole: role,
    assetId: `audio.proof.cache-${name}`, url: `assets/audio/cache-${name}.mp3`,
    backupUrl: `${publishedAudio}cache-${name}.mp3`,
    required: true, gain: 0, offsetSec: 0, nativeLoop: true,
    fallbackRole: 'required-or-degraded', playbackPolicy: 'start-synchronously' });
  B.CACHE_ROAD_PROOF_PROFILE_ID = 'level-02.proof';
  B.MusicProfiles.register({
    profileId: B.CACHE_ROAD_PROOF_PROFILE_ID, levelId: 'level-02', runtimeRegistration: true,
    metadataStatus: 'unverified',
    arrangement: { sources: [source('drive', 'drive'), source('pressure', 'pressure'),
      source('flow', 'flow'), source('breakaway', 'breakaway'),
      source('undercurrent', 'undercurrent')] },
    // All five sources start together. Pressure is the drum backbone; the
    // other parts trade on complete four-bar boundaries. In the intro and
    // first half of each verse some recorded parts contain almost no sound.
    laneMix: { laneRoles: ['drive', 'flow', 'breakaway', 'undercurrent'],
      backboneRole: 'pressure', barsPerPhrase: 4, transitionSec: 0.38,
      levels: { pressure: 0.60, drive: 0.19, flow: 0.55,
        breakaway: 0.50, undercurrent: 0.62 } },
    playback: { startTrackSec: 0, loop: null, endPolicy: 'native-loop' },
    timeline: { mode: 'fixed-tempo', gridOriginTrackSec: 0,
      fixedGrid: { quarterBpm: 128, beatsPerBar: 4, beatUnit: 4 } },
    phrasePresentation: { barsPerPhrase: 4, beatCount: 16 }, judgmentRules: []
  });
})(window.BARCODE = window.BARCODE || {});
