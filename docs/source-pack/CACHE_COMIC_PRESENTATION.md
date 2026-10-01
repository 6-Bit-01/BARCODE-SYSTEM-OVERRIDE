# Cache comic presentation

## October 1 — opening format is the standard

The owner selected the first, opening cutscenes as the visual format for the
later scenes. The eight Cache bridge pages and four delivery pages now use
that same format. This supersedes the separate Cache layout introduced after
merged #158 (`694f109cd776bf9b05013aabebc3e1347855dd45`). Source paintings,
pinned image URLs, all 24 dialogue lines and 36 Cache cues remain unchanged.
The opening keeps its established presentation and behavior; its pure
presentation helpers now provide the shared standard.

`IntroSequence.format` is the immutable source for the page frame, palette,
fonts and balloon geometry. `drawHeader`, `drawFrame`, `measureBalloon` and
`drawBalloon` are reused by the later chapters rather than copied into a
second renderer. `ComicDialogue` retains measured placements and cue reveals
while using those opening helpers.

| Shared feature | Opening standard |
| --- | --- |
| Picture frame | x 48, y 140, width 1824, height 828 on the 1920 × 1080 Canvas |
| Page furniture | Pink BARCODE tab, channel label, large title, mint page count/progress ticks and double picture border |
| Palette | Ink `#090b15`, paper `#f1eadd`, mint `#95ffe0`, pink `#f696d9`, established crew accents |
| Speech | Cream angular balloons, thick ink outline, offset shadow, registration marks and authored pointers |
| Dialogue lettering | Bold 30 px sans-serif with 36 px line spacing |
| Speaker tabs | Bold 21 px monospace on crew-colored tabs that cross the balloon's top edge |
| Comms | Dark `#101a2b` receiver cards, crew accents and receiver bars without physical pointers |

## Authored lettering

`CacheSceneLayouts` supplies two placements per painting and named face/prop
exclusion rectangles, remeasured against the larger opening frame. Speech
points to the visible speaker's body. Explicit `/ COMMS` lines never acquire
a physical pointer; the final bridge reply is radio because Cache is inside
the departing car.

Balloon bodies stay fixed in Canvas coordinates. Dialogue remains inside its
body; the shared layout exports `textRect`, `labelRect` and `outerBounds` so
speaker tabs, shadows and printed edge marks are checked in their actual
opening positions. Pointers track the contain-fitted image rectangle and
clear protected faces, hands, cassette hardware and monitor glass. The exact
text is wrapped using the actual dialogue font rather than the previous
Oxanium lettering assumptions.

The transcript replaces balloons while open. Missing/loading art uses two
readable lower comms cards with no pointers; the original descriptive fallback
and accessible DOM transcript remain available. Save/status notices sit above
the common reading toolbar (updated by `SHARED_CUTSCENE_SPEED_EFFECTS.md`). The tutorial and live road do not adopt the
comic page layout.

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
inside the shared opening frame, never cropping the painting. Reduced Motion or
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

Both native renderers use production helpers, the opening's registered
sans-serif/monospace faces and decoded original art. Current page/contact
stills and `Bridge-Stills-Review.json` / `Ending-Stills-Review.json` show the
locked opening layout, with actual source/artifact hashes and native checks
for every cue, transcript and motion mode, body/tab/shadow bounds, protected
faces/props and control separation. Sampled production-pixel checks verify
motion, static accessibility modes, uncropped art and restored Canvas state;
this still-only review generates no audio or movie. Older `Review.mp4` and
`Review.json` files remain historical prior-layout audio/motion evidence;
their former still hashes do not describe the refreshed images. None are
Makko recordings or hosted browser/frame-rate acceptance.
Focused tests cover transient-clock and save/input semantics. Browser fixtures
load the opening helpers before `ComicDialogue`, measure each layout's actual
font family and check hosted image delivery, input and shared Canvas ownership.
Full regression, all-file syntax and both final-head CI events are required
before merge; exact results are recorded by the PR and generated receipt.

This format change shares the current review candidate with the Cache Road
ground-slab frame-time correction and short in-world race launch/speed camera.
It does not establish hosted browser or Makko acceptance for that combined
candidate. See `ACCEPTANCE.md` for the opening/bridge/ending comparison and
focused race import/reload route. Actual Makko, frame pacing and physical
controller acceptance remain unrecorded. Build the source pack from the exact
committed candidate or merge and retain current native scene-review evidence.

## October 1 control follow-up

The newest owner request unifies functions as well as paint. The common
reading contract and stronger road effects are specified in
`SHARED_CUTSCENE_SPEED_EFFECTS.md`; that entry supersedes this document’s
earlier preserve-controls/opening-controls restrictions. Story and artwork
contracts above remain in force.
