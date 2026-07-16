// Immutable music profile registry for BARCODE: System Override
window.FILE_MANIFEST = window.FILE_MANIFEST || [];
window.FILE_MANIFEST.push({
  name: 'src/engine/music-profiles.js',
  exports: ['BARCODE.MusicProfiles'],
  dependencies: []
});

window.BARCODE = window.BARCODE || {};

(function(namespace) {
  'use strict';

  function clone(value) {
    if (value === undefined || value === null) return value;
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(key => deepFreeze(value[key]));
    return Object.freeze(value);
  }

  function invalid(reason) {
    return { ok: false, reason };
  }

  function validateSource(source) {
    if (!source || typeof source !== 'object') return invalid('source must be an object');
    if (!source.sourceId || typeof source.sourceId !== 'string') return invalid('sourceId required');
    if (!source.assetId || typeof source.assetId !== 'string') return invalid('assetId required');
    if (!source.url && !source.resolverId) return invalid('url or resolverId required');
    if (source.url && typeof source.url !== 'string') return invalid('url must be a string');
    if (source.resolverId && typeof source.resolverId !== 'string') return invalid('resolverId must be a string');
    if (typeof source.required !== 'boolean') return invalid('required boolean required');
    if (typeof source.gain !== 'number' || source.gain < 0) return invalid('gain must be non-negative number');
    if (typeof source.offsetSec !== 'number' || source.offsetSec < 0) return invalid('offsetSec must be non-negative number');
    if (typeof source.nativeLoop !== 'boolean') return invalid('nativeLoop boolean required');
    if (!source.fallbackRole || typeof source.fallbackRole !== 'string') return invalid('fallbackRole required');
    if (!source.playbackPolicy || typeof source.playbackPolicy !== 'string') return invalid('playbackPolicy required');
    return { ok: true };
  }

  function validateProfile(profile) {
    if (!profile || typeof profile !== 'object') return invalid('profile must be an object');
    if (!profile.profileId || typeof profile.profileId !== 'string') return invalid('profileId required');
    if (!profile.levelId || typeof profile.levelId !== 'string') return invalid('levelId required');
    if (!['unverified', 'legacy-compatibility', 'verified'].includes(profile.metadataStatus)) return invalid('metadataStatus invalid');
    if (profile.metadataStatus === 'legacy-compatibility' && profile.profileId !== 'level-01.main') return invalid('legacy-compatibility is Level 1 only');
    const sources = profile.arrangement && profile.arrangement.sources;
    if (!Array.isArray(sources) || sources.length < 1) return invalid('arrangement.sources required');
    for (const source of sources) {
      const sourceResult = validateSource(source);
      if (!sourceResult.ok) return invalid(`${source.sourceId || 'source'}: ${sourceResult.reason}`);
    }
    if (!profile.playback || typeof profile.playback !== 'object') return invalid('playback required');
    if (typeof profile.playback.startTrackSec !== 'number' || profile.playback.startTrackSec < 0) return invalid('playback.startTrackSec invalid');
    if (profile.playback.legacyManualRestartSec != null && (typeof profile.playback.legacyManualRestartSec !== 'number' || profile.playback.legacyManualRestartSec <= 0)) return invalid('legacyManualRestartSec invalid');
    if (!profile.timeline || typeof profile.timeline !== 'object') return invalid('timeline required');
    if (!['none', 'fixed-tempo'].includes(profile.timeline.mode)) return invalid('runtime supports only none or fixed-tempo');
    if (profile.timeline.mode === 'fixed-tempo') {
      if (typeof profile.timeline.gridOriginTrackSec !== 'number') return invalid('gridOriginTrackSec required');
      if (!profile.timeline.fixedGrid || typeof profile.timeline.fixedGrid !== 'object') return invalid('fixedGrid required');
      const grid = profile.timeline.fixedGrid;
      if (typeof grid.quarterBpm !== 'number' || grid.quarterBpm <= 0) return invalid('quarterBpm invalid');
      if (typeof grid.beatsPerBar !== 'number' || grid.beatsPerBar <= 0) return invalid('beatsPerBar invalid');
      if (typeof grid.beatUnit !== 'number' || grid.beatUnit <= 0) return invalid('beatUnit invalid');
    }
    if (!Array.isArray(profile.judgmentRules)) return invalid('judgmentRules array required');
    return { ok: true };
  }

  const registry = new Map();
  let activeProfileId = null;

  function register(profile) {
    const validation = validateProfile(profile);
    if (!validation.ok) throw new Error(`Invalid music profile: ${validation.reason}`);
    const frozen = deepFreeze(clone(profile));
    registry.set(frozen.profileId, frozen);
    return frozen;
  }

  function get(profileId) {
    if (!profileId || typeof profileId !== 'string') return null;
    return registry.get(profileId) || null;
  }

  function select(profileId) {
    if (!profileId || typeof profileId !== 'string') {
      activeProfileId = null;
      return null;
    }
    const exact = registry.get(profileId) || null;
    activeProfileId = exact ? exact.profileId : null;
    return exact;
  }

  function getActive() { return get(activeProfileId); }

  namespace.MusicProfiles = deepFreeze({ register, get, select, getActive, validateProfile, cloneProfile: clone, deepFreeze });
})(window.BARCODE);
