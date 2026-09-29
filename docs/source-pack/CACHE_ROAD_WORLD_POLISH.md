# Cache Road — world, feedback and rendering pass

September 29, 2026. Baseline: merged PR #146, `8faa64b13ed5dd1b919c27ac102051b78974cfc7`.

## What changed

| Area | Implementation |
| --- | --- |
| Occlusion | People, fixtures and buildings share one ordered world queue; nearer terrain/facades cover distant actors. The mirror uses the same mixed ordering. |
| Scale | People are 20% larger. Lamps 146 → 270 units; signals 130 → 226; parked vans 171 → 220; kiosks 142 → 178; carts 120 → 170. Smaller props have individual corrections. World position and perspective remain continuous. |
| Animation | Reflected props use the same elapsed-time cel as the main scene. Moving actors use their current address for visibility, including long, slow approaches. Static sitting/standing poses stay still. Sweeper remains one complete cel per draw. |
| Rhythm attention | A local four-count and mapped button sit below the line under the rear tires. The same immutable fourth-beat deadline drives paint, countdown, judgment and confirmation. Captured phrase paint is quieter, giving the next action priority. |
| Traffic skill | A visible slipstream and local progress meter show a 600 ms continuous draft. Leaving or switching trucks resets the hold; damage and turbo interrupt it. Charge no longer accumulates across unrelated encounters. |
| Action feedback | Turbo readiness has a short two-tone sound and local receipt. Brace/push have distinct car outlines and impact bursts. Near misses/cuts show score on the actual passing side. |
| Rendering | Static scenery is indexed once and sliced by world range. The painter queue drains once per frame. Projection values and the ground silhouette are reused. Invisible far ground slabs are skipped. Both banks share each ground clip; small actor clips use four vertices. |

## Evidence and limits

The native video renderer now calls the actual `PresentationAssets.draw`
implementation with locally delivered images, including its real columns,
anchors, source rectangles and smoothing. The previous duplicate renderer
did not understand the ambient-light sheets' four columns.

`review-cache-world-polish/Review-Checks.json` records matched native draw
timings, visual review coverage and validation. Discard the first second of
each matched 24 fps, eight-second sequence as warm-up. Report median and
95th percentile draw time, not video encoding throughput or claimed game
FPS. These measurements use software Canvas in this workspace.

`Drive-Review.mp4` is an input-driven opening with production update,
steering, beat targets and four captures. Its audio is replayed by the
production Web Audio cue/mixer implementation in Chromium from
`Drive-Trace.json`. `World-and-Feedback.mp4` contains explicitly staged
ability visuals and moving scenery from all four route quarters; it does
not demonstrate earning those abilities. Gameplay regressions exercise the
actual draft reset, protection, scoring, full song, final exit and old saves.

Chromium additionally loads every registered road image, draws 96 real
world frames across four route quarters, bounds-checks image source crops,
and verifies changing pixels in every registered road animation. The
existing canvas-context guard, local/published MP3 recovery, beat scheduling
and audio voice cleanup checks remain active.

Makko hosted asset delivery, controller feel and device frame pacing remain
for the owner's playtest. No engine replacement was required for these
renderer and gameplay defects.
