# Music profiles and fixed transport

PR #5 adds `window.BARCODE.MusicProfiles` and `window.BARCODE.MusicTransport` as browser-global seams. Profile selection is exact-ID only: unknown, missing, or invalid IDs create a no-profile degraded session and never inherit Level 1, the previously selected profile, `146` BPM, `4/4`, a phrase size, judgment windows, or restart timing.

`MusicProfiles.register(profile)` validates and freezes the authoritative data. `get(id)` and `getActive()` return immutable registered profiles. `select(id)` selects only a registered exact ID; failures clear active selection.

`MusicTransport.load(profileId)` binds the exact profile. `start({ sourceAnchorAudioSec, sourceOffsetTrackSec })` anchors playback to the scheduled Web Audio time used for sources. `sample(audioTimeSec)` returns playback position. `poll(audioTimeSec)` is pumped by the existing frame owner and emits bounded beat-boundary batches for fixed-grid profiles. `judgeInput(ruleId, audioTimeSec)` returns nearest-grid timing or an intentional unavailable result for no-grid/no-profile sessions. Effective profile changes, source starts, stops, and coordinated manual restarts advance generation; duplicate idempotent starts and native buffer wraps do not.

Playback time and grid phase are separate. `trackTimeSec = (audioTimeSec - sourceAnchorAudioSec) + sourceOffsetTrackSec`. `gridOriginTrackSec` is the track-time offset for musical tick zero. PR #5 supports only playback with no grid and playback with one fixed-tempo/fixed-meter grid. Reserved tempo-map, marker, cue, and meter-change ideas are not interpreted at runtime.

Only `level-01.main` is registered at runtime. It is marked `legacy-compatibility`, not verified and not reusable by other levels. Its compatibility values preserve the current three source IDs/URLs/gains/native loops, `146` BPM, `4/4`, `32` establishment beats, `16`-beat/four-bar phrase presentation, `60`/`100` ms judgment windows with no `-20` ms compensation, and the Level-1-only `legacyManualRestartSec: 211`. The unequal-stem debt remains: native source lengths differ and the existing manual fade/wait/restart is preserved rather than reinterpreted as a verified loop endpoint.

Future songs must supply their own profile metadata or deliberately choose no grid. They must not receive Level 1 tempo, meter, phrase, source count, judgment, or restart defaults.
