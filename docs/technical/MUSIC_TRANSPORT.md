# Authoritative Music Transport

PR-004 establishes `src/engine/music-clock.js` as the sole owner of musical time. The clock is configured at 146 BPM, four beats per bar, and four bars per phrase. It does not perform waveform beat detection or automatic BPM detection.

## Ownership

Before PR-004, timing authority was split between Web Audio source starts in `audio.js`, recursive timer-based beat sync in `AudioSystem.scheduleNextBeatSync()`, and beat/bar/phrase counters in `rhythm.js`. After PR-004, `window.musicClock` owns beat, bar, phrase, epoch, and input-judgment timing. `RhythmSystem` keeps compatibility fields for existing UI and gameplay, but derives them from the clock snapshot.

## Audio start and reanchor flow

`AudioSystem.startAllLayersSimultaneously()` still starts foundation, bass, and FX layers at the same `syncTime`. The music clock is reanchored exactly once to that same scheduled Web Audio source start time. Individual layers do not anchor the transport.

During the existing manual loop restart, the clock is stopped while sources are intentionally between epochs. When replacement sources are scheduled, the clock is reanchored to the exact new synchronized `restartTime`. The clock epoch increments on stop/reanchor so stale boundary state cannot produce later callbacks.

## Snapshot contract

`window.musicClock.getSnapshot()` returns a stable immutable snapshot containing transport mode, BPM, beat duration, anchor time, current transport time, elapsed musical time, absolute beat index, completed beat count, beat within bar, bar within phrase, absolute bar index, phrase index, beat/bar/phrase phase values, epoch, and whether the first downbeat has occurred.

## Event contract

Subscribers may register for `beat`, `bar`, `phrase`, `start`, `stop`, `reanchor`, and `resync`. Boundary events are emitted when `sample()` observes crossed boundaries. If a frame hitch crosses multiple beats, each missing boundary is emitted in order. Extremely large gaps are capped and produce one `resync` event instead of flooding callbacks. Event payloads are frozen snapshots/copies so subscribers do not mutate clock internals.

## Input timing calculation

Rhythm input uses `musicClock.judgeNearestBeat()`, comparing the input sample against the nearest beat in the same clock domain used by playback. The live gameplay windows are preserved: `perfect` at or within 60 ms, `excellent` at or within 100 ms, and `miss` beyond 100 ms. The old `timingOffset = -20` drift compensation is not applied; calibration remains configurable and defaults to `0` to preserve the inspected live no-compensation path.

## Fallback mode

If Web Audio or a music source is unavailable, the clock can start one clearly labeled fallback transport using monotonic `performance.now()`. Fallback preserves 146 BPM and reports degraded mode once. Audio mode and fallback mode are mutually exclusive; when Web Audio becomes available, reanchor invalidates fallback timing with a new epoch.

## Pause/resume behavior

The transport follows the active Web Audio clock. Existing pause/resume systems should sample or reanchor against actual audio state rather than introducing a second timer. PR-004 does not redesign pause behavior or add gameplay consumers.

## Loop restart behavior and source-duration debt

The current audible restart endpoint remains 211 seconds in PR-004. That value is preserved for non-change safety, but it is not proven to be a musical loop boundary. Observed source durations are approximately:

- Foundation: 212.088 seconds
- Bass layer: 210.442 seconds
- FX layer: 212.088 seconds

Decoded `AudioBuffer.duration` remains runtime authority for asset inspection. The unequal stem/container durations are audio asset debt. Changing loop endpoints requires owner-approved matched stems or explicit loop metadata; PR-004 does not trim, stretch, replace, or re-export audio.

## Future consumers

PR-005 can simplify rhythm UI now that the 32-beat presentation no longer owns tempo. PR-006, PR-007, and PR-008 can subscribe to beat/bar/phrase boundaries for enemy telegraphs, arena choreography, beat-reactive signs/windows, flying-car surges, and boss phase work without creating new clocks.
