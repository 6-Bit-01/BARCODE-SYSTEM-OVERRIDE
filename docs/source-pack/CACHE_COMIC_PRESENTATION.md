# Cache comic presentation

This pass follows merged #158 (`694f109cd776bf9b05013aabebc3e1347855dd45`).
It changes the presentation of the existing bridge and delivery ending.
Source paintings, pinned image URLs, all 24 dialogue lines and 36 cues remain
unchanged. The opening, tutorial and road retain their existing behavior.

## Authored lettering

`CacheSceneLayouts` supplies two measured placements per painting and named
face/prop exclusion rectangles. Speech has a cream fill and a pointer to the
visible speaker's body. Radio uses dark cards, crew colors and receiver bars;
explicit `/ COMMS` lines never acquire a physical pointer. The final bridge
reply is radio because Cache is inside the departing car.

`ComicDialogue` wraps the exact text at 30 px in the existing Oxanium font,
measures its height, and draws a speaker tab and reading-order number. Boxes
stay fixed in Canvas coordinates. Pointers track the actual contain-fitted
art rectangle. Their bases are authored to clear hands and tape hardware.
The transcript replaces balloons while open. Missing/loading art uses two
readable lower comms cards with no pointers; the original descriptive fallback
and accessible DOM transcript remain available. Save/status notices sit above
the unchanged footer controls.

## Scene effects

| Scene | Effect aligned to the painting |
| --- | --- |
| Bridge 1 — district | Rain beyond 6 Bit, warm lamps, wet-road reflections |
| Bridge 2 — uplink | Practical lamps, network CRT glass, reel/tape accents |
| Bridge 3 — original | Original waveform and cassette activity |
| Bridge 4 — clean copy | Clean waveform with deliberate gaps |
| Bridge 5 — keep both | Saved trace, tape seal and equipment lights |
| Bridge 6 — departure | Rain, tail lamps and wet pavement |
| Bridge 7 — ignition | Windshield rain, instruments and cassette light |
| Bridge 8 — road | Rain, red lamps and departing reflections |
| Ending 1 — delivered | Local rain, receiver lights and protected case |
| Ending 2 — unverified | Monitor rim light around unchanged status lettering |
| Ending 3 — hold | Both trace monitors and studio practical light |
| Ending 4 — street | Rain, gate lamps and pavement reflections |

`CacheSceneEffects` is a pure Canvas painter: no RAF, timers, DOM, images,
resources, audio or saved state. Every effect is clipped to the supplied image
rectangle. A 0.988-to-1 camera settle lasts six seconds and stays entirely
inside the original frame, never cropping the painting. Reduced Motion or
flashes disabled gives the settled camera and static meaningful lighting;
there are no strobes. The receiver's DELIVERED/UNVERIFIED labels use the same
image transform and remain above the effects.

## Ownership and compatibility

The existing game loop advances `sceneElapsedMs` only while reading normally.
Pause, transcript, held skip and pending Drive freeze it. Cue changes preserve
scene time; page changes reset it. The clock is transient and never extends
the checkpoint schema. Restored page/cue positions retain their original
silent-start contract. Cue durations and audio cue mappings are unchanged.

Five-second skip still reaches the final reading position. Drive and Finish
require a separate fresh confirmation. No new reward, music start or Mac-stage
launch belongs to this renderer. Existing stale-async guards, image cleanup,
release-to-arm inputs and atomic chapter receipt remain the same.

## Evidence and deployment

Both native renderers use production helpers and decoded original art. Their
layout checks cover every cue, transcript and motion mode, body/label bounds,
face/prop clearance and control separation. Native movies are scripted Canvas
reviews with the existing synthesized cue PCM; they are not Makko recordings.
Focused tests cover transient-clock and save/input semantics. Browser fixtures
exercise production Canvas/input plus hosted image delivery. Full regression,
all-file syntax and both final-head CI events are required before merge; exact
results are recorded by the PR and generated receipt.

See `ACCEPTANCE.md` for the focused Makko import/reload route. Actual Makko and
physical-controller acceptance remain unrecorded. The source pack exports the
exact merged Git tree and retains both current native scene-review folders.
