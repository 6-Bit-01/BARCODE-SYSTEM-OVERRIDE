# Music profiles and fixed transport

PR #5 adds `window.BARCODE.MusicProfiles` and `window.BARCODE.MusicTransport` as browser-global seams. Profile selection is exact-ID only: unknown, missing, or invalid IDs create a no-profile degraded session and never inherit Level 1, the previously selected profile, `146` BPM, `4/4`, a phrase size, judgment windows, or restart timing.

`MusicProfiles.register(profile)` validates and freezes the authoritative data. It rejects malformed profiles, duplicate profile IDs, duplicate source IDs, duplicate judgment-rule IDs, invalid URL/resolver contracts, non-finite source gains/offsets, invalid fixed-grid meter data, malformed phrase presentation, and unordered judgment windows. `get(id)` and `getActive()` return immutable registered profiles. `select(id)` selects only a registered exact ID; failures clear active selection.

`MusicTransport.load(profileId)` binds the exact profile. Loading the already-bound profile is idempotent: it preserves running state, source anchor, source offset, last boundary, generation, and the last valid sample. Loading a different profile or an unknown profile invalidates the previous session and advances generation as appropriate. `start({ sourceAnchorAudioSec, sourceOffsetTrackSec })` anchors playback to the scheduled Web Audio time used for sources. Repeating the same effective start is idempotent. `stop()` advances generation only on the first effective stop; repeated stops remain stopped without generation churn. `coordinatedRestart(anchor)` represents the Level-1 manual restart and advances generation.

`sample(audioTimeSec)` returns playback position. `poll(audioTimeSec)` is pumped by the existing frame owner and emits ordered, bounded beat-boundary batches for fixed-grid profiles. Beat-event identity is `(profileId, generation, beatIndex)` so consumers can process catch-up hitches once per unique boundary and ignore stale-generation events. Large hitches are capped to a bounded batch; a hitch counter records truncation. `judgeInput(ruleId, audioTimeSec)` resolves a named judgment rule by stable ID and returns nearest-grid timing only while the transport is running with a supported fixed grid. Stopped, no-profile, no-grid, or missing-rule sessions return intentional judgment-unavailable results.

Playback time and grid phase are separate. `trackTimeSec = (audioTimeSec - sourceAnchorAudioSec) + sourceOffsetTrackSec`. `gridOriginTrackSec` is the track-time offset for musical tick zero. A fixed-grid profile declares quarter-note BPM plus the authored beat denominator; the runtime grid beat duration is `(60 / quarterBpm) * (4 / beatUnit)`. This preserves Level 1's 4/4 quarter-note result exactly while allowing synthetic or future profiles to use another denominator without inheriting Level 1.

PR #5 supports only playback with no grid and playback with one fixed-tempo/fixed-meter grid. No-grid profiles remain valid playback sessions: playback position advances, `grid` remains `null`, no beat events are emitted, and judgment is unavailable. Reserved tempo-map, marker, cue, and meter-change ideas are not interpreted at runtime.

Only `level-01.main` is registered at runtime. It is marked `legacy-compatibility`, not verified and not reusable by other levels. Its compatibility values preserve the current three source IDs/URLs/gains/native loops, `146` BPM, `4/4`, `32` establishment beats, `16`-beat/four-bar phrase presentation, `60`/`100` ms named `level-01.attack` judgment windows with no `-20` ms compensation, and the Level-1-only `legacyManualRestartSec: 211`. The unequal-stem debt remains: native source lengths differ and the existing manual fade/wait/restart is preserved rather than reinterpreted as a verified loop endpoint.

Future songs must supply their own profile metadata or deliberately choose no grid. They must not receive Level 1 tempo, meter, phrase, source count, judgment, or restart defaults.

## PR #7 lifecycle pause/resume contract

`MusicTransport.pause(audioTimeSec)` freezes the current track position using Web Audio time and advances transport generation so stale boundary events from the pre-pause generation cannot affect the resumed run. `resume(audioTimeSec)` re-anchors `sourceAnchorAudioSec` from the preserved track position and the resumed AudioContext time, also advancing generation. The boundary cursor is re-seeded at the frozen/resumed beat so paused time does not emit catch-up beats. `stop()` remains the explicit full-session invalidation path.

Runtime pause/resume does not introduce wall-clock musical authority, timers, RAF, fallback BPM, new sources, or profile changes. The selected profile ID, Level 1's `146` BPM compatibility metadata, `4/4` meter, `32` establishment beats, `60`/`100` ms judgment windows, source URLs/gains, and 211-second coordinated restart behavior remain profile-owned and unchanged.

### Pause/resume invariant guarded after PR #7 review

The transport representation after pause/resume is: pause stores the current track position in `sourceOffsetTrackSec`; resume sets `sourceAnchorAudioSec` to the current Web Audio time without subtracting that offset. Therefore, starting at audio time `100` with track offset `10`, pausing at audio time `105` freezes track time `15`, resuming at audio time `200` samples track time `15`, and sampling at audio time `201` gives track time `16`. The runtime lifecycle static guard rejects the old subtract-offset resume formula.

### Static validation scope after PR #7 follow-up

Music-profile validation is dependency-free static source inspection. It checks exact Level 1 IDs, URLs, gains, native-loop flags, fallback roles, `146` BPM, `4/4`, `legacyManualRestartSec: 211`, judgment windows, transport structure, resume anchoring, and no transport-owned timer/RAF/wall-clock authority. Runtime musical behavior remains an owner Makko/browser smoke-test responsibility.
