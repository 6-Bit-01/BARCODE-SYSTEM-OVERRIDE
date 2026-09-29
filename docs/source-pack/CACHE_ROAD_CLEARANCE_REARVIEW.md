# Cache Road — building clearance and the world behind the car

September 29, 2026. Base: merged PR #151,
`ac9f70c162d45b3e85d8c60c273dad205c0417ed`.
The owner identified a garage intersecting a green residential block and
requested reliable placement separation, plus actual vehicle sprites and
the front setting viewed backward in the rearview. The latest explicit
instruction is to keep the existing blur: **`blur(2.3px)` remains exact**.

## Why the screenshot overlap was allowed

The garage is at world address 1840; `cacheHomesRMiddle` was allowed at 1905,
only 65 units away. The older middle/rear reservation required roughly 42
units of center separation for that site. It therefore passed while the
painted building footprints still intersected. A nominal address-gap check
and correct painter order do not establish clear ground footprints.

The fitter uses two-dimensional ground-contact envelopes, with along-road
extent, radial depth and an 18-unit clearance. Featured sites use source-scaled
half-frontage and a conservative 75-unit contact half-depth. Fixed places
reserve first, modular blocks fit next, and optional satellites fit last.
Open street sockets and authored radial rows remain fixed. Other cards can
move along their own 225-unit parcel within a 15-unit inset; accepted moves
carry contacts and parcel/access metadata with them. Intended same-family
modular seams retain their authored overlap.

Cards without a legal position are omitted when the layout is generated,
not masked in the renderer or moved outward to conceal them. Their unused
parcel entrances/access edges are removed and graph IDs remapped. The default
route retains 139 of 227 candidate cards: 38 relocate along their parcels
and 88 are rejected. All 48 modular art keys and all 25 street mouths remain.
Seventeen optional satellites fit afterward; 15 are omitted. There are zero
unresolved or conflicting contact envelopes, including fixed-site pairs.
The reported middle card at 1905 and rear card at 1979 are both
rejected; the garage remains at 1840 with its original 41-unit setback.

These are defined ground-contact envelopes, not full sprite rectangles or
pixel-perfect silhouette collision. Testing must cover the reported pair
through its approach and pass, both banks, bends and the full route. The
earlier `CACHE_ROAD_PRODUCTION_LANDSCAPE_PLAN.md` is a broader design contract;
this fix does not claim that every proposal there is built.

## A rearview of the same world

The rearward scene samples only existing world addresses already behind
Cache. The three authored city layers replace its procedural skyline, while
bank, road and branch-street materials use the shared terrain height field.
Buildings keep their source width, setback, growth, street socket and painted
foundation coordinates instead of being reduced to equally sized thumbnails.
People, props and lamp activity remain tied to the same passed addresses.

Passed traffic now uses the production vehicle draw and authored animation
cels, including its live phase and turning pose, instead of generic shapes.
The glass, Cache's face/crop/HUD and exact 2.3 px blur are preserved. World
motion recedes toward the rear horizon as the car advances.

Existing vehicle sprites are rear-authored views. This deliberate reuse
does not create front-facing vehicle art, new headlamps or a full 3D camera.
No new artwork or hosted asset roots are part of this correction. Keep the
already approved animation clocks, streetlamp scale/rays and audio behavior.

## Verification and review contract

Focused clearance evidence must test painted footprint separation rather
than repeat the old center-distance assertion. Rearview checks must use the
production renderer and verify existing sprites, world-addressed scenery,
receding motion and the retained blur. Inspect both the reported overlap
location and ordinary street scenes in moving captures.

Full regression, syntax and Chromium rendering/audio remain merge gates.
The PR and generated source-pack receipt identify the actual tested revision
and final result; this document does not treat a planning rule or an earlier
milestone's passing tests as proof of this change.
The completed candidate passes full local `npm test` and repository-wide
syntax checks. Chromium and final-head CI remain the merge gates.

`tools/check-cache-road-clearance.cjs` passes 10 generated layouts: five seeds
(27469, 17, 92381, 2026 and 7777) at route lengths 9840 and 15000, auditing
1,162 retained cards. It independently checks every contact pair, allowing
only recorded authored seams, and verifies fixed openings, stable seeded
reconstruction, parcel/access graph validity and rejection from the actual
scenery index. Production draws retain the garage across progress 1450–1800.
The existing Cache Road proof also passes.

The expanded animation-route check passes 753 production draws covering all
48 atlas keys, including every mirror animation cel for six traffic types.
The focused 16-second, 24 FPS rearview comparison covers four passed-traffic
segments using the actual renderer; its metadata and exact blur are recorded
in `Rearview-Review.json`. This is focused rearview evidence, not full-game CI.

A final 360-sample local native mirror-only comparison measured mean draw
time of 4.956 ms before and 6.694 ms after (p95 9.062/12.165 ms). Mean asset
submissions increased from 44.794 to 100.183 for the richer reflected world;
coarser miniature bank strips reduced the first candidate's 151.7 submissions
while retaining the blur and reviewed appearance. Concurrent checks affected
absolute timing; the recorded difference is about 1.7 ms in this local run,
not a total-frame-time or Makko/device FPS claim. The final integrated mirror
comparison was regenerated and visually inspected after the placement update.

The current review directory is `review-cache-clearance-rearview/`.
`Clearance-Before-After.webp` records the reported building correction, with
exact layout counts in `Clearance-Report.json`. The final clearance and
rearview comparisons have been visually inspected.
`Rearview-Before-After.webp` compares the reflected scene; the matched motion
comparison is `Rearview-Before-After.mp4` in Git. `Drive-Review.mp4` and
current comparison stills are retained in the source pack, along with the
approved layered-city baseline and #151's
`Chip-SFX-Audition.mp3`.

The drive review is a silent, 16-second, 24 FPS, 1280×720 visual sweep using
actual production Canvas draws, from progress 1420 to approximately 2696.7. It approaches the
reported garage at 1840, passes it and follows it into the mirror. It is
scripted visual inspection, not an input-driven run or a new audio recording;
it makes no catch-score or integrity claim. Full gameplay/timing behavior is
covered separately by regression and browser checks. The prior chip audition
is retained as #151 evidence; this pass adds no audio. The video fully decodes;
`Drive-Review.json` records its scope and source/video hashes.

The five music stems, exact 128 BPM / 4/4 grid, beat-ONE targets, buffered
gears, input judgment, lamps and chip SFX remain approved behavior to preserve.
Owner Makko appearance and device performance remain the next playtest;
automated footage is implementation evidence, not owner acceptance.
