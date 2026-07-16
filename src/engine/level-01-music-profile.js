// Level 1 legacy-compatibility music profile. Not a reusable default.
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/level-01-music-profile.js',
  exports: ['BARCODE.LEVEL_01_MUSIC_PROFILE_ID'],
  dependencies: ['BARCODE.MusicProfiles']
});

window.BARCODE = window.BARCODE || {};

(function(namespace) {
  'use strict';
  namespace.LEVEL_01_MUSIC_PROFILE_ID = 'level-01.main';
  namespace.MusicProfiles.register({
    profileId: 'level-01.main',
    levelId: 'level-01',
    runtimeRegistration: true,
    metadataStatus: 'legacy-compatibility',
    compatibility: { note: 'Migrates existing Level 1 behavior only; not verified as a reusable musical standard.' },
    arrangement: { sources: [
      { sourceId: 'foundation', assetId: 'audio.level-01.foundation', url: 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/2133657a-6dbe-47c0-b4c3-4cb9849b3c58.mp3', required: true, gain: 0.8, offsetSec: 0, nativeLoop: true, fallbackRole: 'required-or-degraded', playbackPolicy: 'start-synchronously' },
      { sourceId: 'bass-layer', assetId: 'audio.level-01.bass-layer', url: 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/5089debd-8927-4409-88f1-785be8508686.mp3', required: true, gain: 0, offsetSec: 0, nativeLoop: true, fallbackRole: 'synthetic-layer-fallback', playbackPolicy: 'start-synchronously-muted' },
      { sourceId: 'fx-layer', assetId: 'audio.level-01.fx-layer', url: 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/1e86d080-84ac-45df-b591-5e433ae5ec8f.mp3', required: true, gain: 0, offsetSec: 0, nativeLoop: true, fallbackRole: 'synthetic-layer-fallback', playbackPolicy: 'start-synchronously-muted' }
    ] },
    playback: { startTrackSec: 0, loop: null, endPolicy: 'level-controlled', legacyManualRestartSec: 211, restartSemantics: 'manual-fade-wait-restart-compatibility' },
    timeline: { mode: 'fixed-tempo', gridOriginTrackSec: 0, fixedGrid: { quarterBpm: 146, beatsPerBar: 4, beatUnit: 4 } },
    phrasePresentation: { barsPerPhrase: 4, beatCount: 16 },
    judgmentRules: [{ id: 'level-01.attack', target: 'quarter-note', windowsMs: { perfect: 60, excellent: 100 }, calibrationOffsetMs: 0 }],
    legacyCompatibility: { firstBoundaryOffsetBeats: 0, establishmentBeatCount: 32, phraseCycleBeats: 16, deadCompensationMsNotApplied: -20, unequalStemDebt: 'foundation/fx about 212.088s, bass about 210.442s; runtime preserves native loops plus coordinated 211s manual restart.' }
  });
})(window.BARCODE);
