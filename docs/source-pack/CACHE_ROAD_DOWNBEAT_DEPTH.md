# Cache Road — first beats, depth motion and complete animation routes

September 29, 2026. Base: merged PR #148,
`3767b0e3d61eb58e5c47464d1fe4756e47a644d7`.
This pass keeps the current engine, scenery composition, five recordings,
four lanes, buffered gears, abilities, collision and save/exit rules.

## Timing that owns a physical road address

Every announced action now owns the next measure's first beat. Its fixed
world address is the endpoint of the already committed road section plus
the rear-tire strike offset. A new gear cannot change that endpoint. The
2–3–4 approach, charging icon, tire-line brackets and ONE flash name the same
beat. The ±130 ms forgiving window remains, but the gold flash and PRESS
instruction begin on ONE. An accepted early tap waits for ONE to award its
visible response; late taps acknowledge immediately. Surge earned by either
an early or late tap commits on the following bar, consistently.

The source grid was checked against the actual decoded MP3s, not just the
runtime constant: 128 BPM, 4/4, zero origin, 100 bars / 187.5 seconds. See
`CACHE_ROAD_SONG_GRID_AUDIT.md` and `review-cache-downbeat-depth/Song-Grid-Checks.json`.
Container priming/padding is already trimmed; adding its apparent 25 ms
start time would incorrectly move the music grid.

The road previously followed the audio rendering clock, potentially ahead
of the sound reaching the speaker. `getOutputAudioTime` now estimates heard
context time using output timestamps, with bounded latency fallback. Road
motion and timestamped road input use that clock. Older keyboard events keep
their captured age; manual input calibration is applied once. Invalid/stale
output timestamps fall back safely and the road holds rather than rewinds
if an estimate changes. Level 1 retains its existing raw input timestamp.

Sources and predictable countdown sounds continue to schedule against raw
AudioContext time. An early tap can schedule confirmation on its source
beat; a tap received after that audio was rendered must acknowledge at the
next possible audio instant. This cannot remove hardware/controller latency.

## A car shifting in perspective

The normal generated chassis cels redraw the outline enough to look like
shaking. Cache now uses one registered normal cel per steering pose and one
whole image draw. Tires and wet reflections still move; the eight impact
cels still play once. A shift moves the complete car closer/larger, launches
it farther/smaller, then smoothly settles it. Its depth ranges about .77–.855
around the .83 resting position. Both downbeat judgment windows are fully
settled. Reduced Motion retains the resting depth.

The thin synthetic deck perimeter and overlaid guardrail curves are removed;
illustrated walls, pavement and joints remain. The sweeper remains one whole
cel per frame, preserving the earlier correction to doubled wheels/body.

## Animations that actually appear

Two placement defects were real: random district picks never instantiated
the animated wayfinding sign, and the global eligibility modulus excluded
all data-district ambient cards. Context-specific rotation now includes every
prop and ambient family. Rival animation advances by elapsed time consistently
across gears.

`cache-road-animation-routes.cjs` invokes full production world/HUD draws:
575 draws cover 41 animated/stateful atlas keys, all moving pedestrian types
on both banks and in the mirror, all eight three-cel props, all six ambient
families, traffic/rival, eight impact cels, four action animations, six mirror
states and 203 flyover cels. The three ordinary Cache poses deliberately use
stable cel zero; seated/standing source poses remain still. Reduced Motion
is checked separately. Sheet pixel checks are isolated from this recorder,
so diagnostic draws cannot falsely satisfy live animation coverage.

Chromium additionally decodes every animated sheet, compares all 41 pinned
hosted files with bundled bytes, and exercises the actual production remote
Image loader with bundled fallback disabled. The complete route audit uses
a 480×270 canvas to bound CI cost; ordinary world/driving captures use
1920×1080. Neither is an owner-device FPS benchmark.

## Rendering cost and verification limits

Only unflipped local-origin raster draws skip redundant save/translate/restore
operations. Nonzero translations and flips keep the original path. A broader
optimization was rejected because filtered raster output differed. The final
path produced identical pixels in 64 native Canvas cases across eight real
assets, including crops, transforms, blur, clipping, alpha and following draws.
The isolated 1,024-draw benchmark fell from 4.794 to 2.677 ms; this is not a
claim of a 44% improvement to overall game frame rate.

Focused checks cover 70,400 physical displacement observations, 21 exact
rear-axle arrivals through changing gears, 24/30/60/120 FPS, boundary requests,
pause/resume and complete song/Echo exits in all gears. Actual output-helper
and captured-input checks cover five delays (0/20/80/150/250 ms), all three
gears and 50 perfect heard-beat arrivals. The motion check covers 221 settled
window samples, ordinary stable chassis, moving treads and all impact cels.
Full npm/syntax and real Chromium CI gate publication/merge.

The input-driven review preserves real traffic and integrity. Final review
metrics and Chromium evidence live in `review-cache-downbeat-depth/`.
Owner Makko import, sustained device FPS and musical/controller feel remain
open. No new art binaries or asset roots were introduced. Reverting this
change returns the PR #148 code and its earlier beat-four behavior; the next
milestone is the owner's playtest of timing, gear depth and visible motion.
