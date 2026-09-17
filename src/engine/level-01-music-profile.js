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
  const LEVEL_01_PROFILE_ID = 'level-01.main';
  namespace.MusicProfiles.register({
    profileId: 'level-01.main',
    levelId: 'level-01',
    runtimeRegistration: true,
    metadataStatus: 'legacy-compatibility',
    compatibility: { note: 'Migrates existing Level 1 behavior only; not verified as a reusable musical standard.' },
    arrangement: { sources: [
      { sourceId: 'foundation', mixRole: 'bed', assetId: 'audio.level-01.foundation', url: 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/2133657a-6dbe-47c0-b4c3-4cb9849b3c58.mp3', required: true, gain: 0.8, offsetSec: 0, nativeLoop: true, fallbackRole: 'required-or-degraded', playbackPolicy: 'start-synchronously' },
      { sourceId: 'bass-layer', mixRole: 'pressure', assetId: 'audio.level-01.bass-layer', url: 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/5089debd-8927-4409-88f1-785be8508686.mp3', required: true, gain: 0, offsetSec: 0, nativeLoop: true, fallbackRole: 'synthetic-layer-fallback', playbackPolicy: 'start-synchronously-muted' },
      { sourceId: 'fx-layer', mixRole: 'colour', assetId: 'audio.level-01.fx-layer', url: 'https://dcnmwoxzefwqmvvkpqap.supabase.co/storage/v1/object/public/audio-assets/e56876ca-50d1-4b32-bcb9-1e37b7d1f822/1e86d080-84ac-45df-b591-5e433ae5ec8f.mp3', required: true, gain: 0, offsetSec: 0, nativeLoop: true, fallbackRole: 'synthetic-layer-fallback', playbackPolicy: 'start-synchronously-muted' }
    ] },
    adaptiveMix: { colourRole: 'colour', fadeSec: 0.3, states: {
      explore: { bed: 0.4, pressure: 0, colour: 0 },
      combat: { bed: 0.4, pressure: 0.52, colour: 0.12 },
      rhythm: { bed: 0.4, pressure: 0.6, colour: 0.68 },
      hack: { bed: 0.4, pressure: 0.42, colour: 0.52 },
      boss: { bed: 0.4, pressure: 0.62, colour: 0.38 },
      bossFinal: { bed: 0.4, pressure: 0.65, colour: 0.72 },
      counter: { bed: 0.4, pressure: 0.48, colour: 0.58 },
      restored: { bed: 0.4, pressure: 0.24, colour: 0.28 },
      victory: { bed: 0.4, pressure: 0.56, colour: 0.6 },
      legacyCombat: { bed: 0.4, pressure: 0.6, colour: 0 },
      legacyRhythm: { bed: 0.4, pressure: 0.6, colour: 0.8 },
      legacyRhythmSolo: { bed: 0.4, pressure: 0, colour: 0.8 }
    } },
    playback: { startTrackSec: 0, loop: null, endPolicy: 'level-controlled', legacyManualRestartSec: 211, restartSemantics: 'manual-fade-wait-restart-compatibility' },
    timeline: { mode: 'fixed-tempo', gridOriginTrackSec: 0, fixedGrid: { quarterBpm: 146, beatsPerBar: 4, beatUnit: 4 } },
    phrasePresentation: { barsPerPhrase: 4, beatCount: 16 },
    judgmentRules: [{ id: 'level-01.attack', target: 'quarter-note', windowsMs: { perfect: 60, excellent: 100 }, calibrationOffsetMs: 0 }],
    legacyCompatibility: { firstBoundaryOffsetBeats: 0, establishmentBeatCount: 32, phraseCycleBeats: 16, deadCompensationMsNotApplied: -20, unequalStemDebt: 'foundation/fx about 212.088s, bass about 210.442s; runtime preserves native loops plus coordinated 211s manual restart.' }
  });


  namespace.ensureLevel01MusicProfileSelected = function ensureLevel01MusicProfileSelected() {
    const registry = namespace.MusicProfiles;
    const transport = namespace.MusicTransport;
    if (!registry || typeof registry.get !== 'function' || typeof registry.select !== 'function') {
      console.error('[music-profile] Missing MusicProfiles registry; Level 1 cannot select level-01.main before audio loading.');
      return { ok: false, reason: 'missing-registry', profileId: LEVEL_01_PROFILE_ID };
    }
    const registered = registry.get(LEVEL_01_PROFILE_ID);
    if (!registered) {
      console.error('[music-profile] Missing registration for level-01.main; verify src/engine/level-01-music-profile.js executed in the hosted script path before audio initialization.');
      return { ok: false, reason: 'missing-registration', profileId: LEVEL_01_PROFILE_ID };
    }
    const selected = registry.select(LEVEL_01_PROFILE_ID);
    if (!selected || selected.profileId !== LEVEL_01_PROFILE_ID) {
      console.error('[music-profile] Failed to select exact Level 1 music profile level-01.main before audio loading.');
      return { ok: false, reason: 'selection-failed', profileId: LEVEL_01_PROFILE_ID };
    }
    if (!transport || typeof transport.load !== 'function') {
      console.error('[music-profile] MusicTransport unavailable; cannot load exact Level 1 profile level-01.main.');
      return { ok: false, reason: 'transport-unavailable', profileId: LEVEL_01_PROFILE_ID };
    }
    const loadResult = transport.load(LEVEL_01_PROFILE_ID);
    if (!loadResult || loadResult.status !== 'ok' || loadResult.profileId !== LEVEL_01_PROFILE_ID) {
      console.error('[music-profile] Failed to load exact Level 1 profile level-01.main into MusicTransport.');
      return { ok: false, reason: 'transport-load-failed', profileId: LEVEL_01_PROFILE_ID };
    }
    return { ok: true, profileId: LEVEL_01_PROFILE_ID };
  };
})(window.BARCODE);
