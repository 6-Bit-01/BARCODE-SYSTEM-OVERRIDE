# Cache Road rearview reflection review — September 24, 2026

The latest owner review supersedes the first recovered-art parallax pass.
The mirror crop now moves Cache Back farther into the same glass without
resizing him. The turn art is swapped to match the actual car direction.
The road uses contiguous, subdued Level 1 blacktop samples with a blended
wrap. A smaller distant city, the recovered skyline and a separate industrial
midground have their own rates, leaving room above the road for music-beat
responsive sky color and veils. Two Level 1 flying ship atlases cross overhead.
New parapet and cantilever light art follows road depth; hit, Turbo and close
pass use irregular spray/soot instead of clean geometry. New source PNGs,
optimized WebPs and prompts live in `assets/cache-road/`. The integrated
twelve-second render and close crops still use production draw code with
scripted state, not Makko gameplay. This revised pass is intended for a PR;
the older composite is only a reference.

The owner corrected the prior separate portrait-card layout: Cache Back appears
inside the rearview, looking ahead at the road. The existing six-cell atlas
derived from his supplied model now completes the side of his face that was
cut off. Both brown eyes, the cap brim, glasses and upper mask fit inside the
mirror. The portrait is opaque while the decorative road stays visible around
it; mirror clipping, glare and frame still cover the shared scene. There is no
independent face border or label. Calm, deliberate choice, Turbo/Zone, close
pass, hit and low-signal states use existing road events; the hit takes
priority over low signal during the stumble. The ordinary cells face forward;
the hit cell has both eyes squeezed shut and a slight head jolt.

The city and road behind him are a decorative loop. They show no actual cars
or collision warning. Reduced Motion holds the decorative movement. All four
established lane names, song controls, save and reward behavior remain.
The first-stretch objective has a smaller panel and disappears between real
opening cues.

The new atlas and generated source are in `assets/cache-road/hud/`, with the
model provenance and prompt recorded there. `tools/render-cache-road-mirror.cjs`
renders six scripted states from the production HUD. The native renderer's
video and stills are in `review-cache-road-mirror/`. A second visual layout
study in `review-cache-road-mirror-composite/` places those exact HUD pixels
over the previously saved road-motion preview; it is explicitly a composite,
not one running build or a Makko capture.

The earlier unpushed vehicle, world and first HUD source branch was in a
transient workspace that reset. This checkout is based on merged main #111.
The prior road-motion preview was recovered, but its unpublished source art
and code are not present here. Keep this review separate from any claim that
all art has been reassembled for a PR. The owner should judge the mirror crop,
eye direction, contrast and size from the preview before that recovery and
integration work.

Local validation: the focused road and presentation-asset checks, full
`npm test` suite, all-file JavaScript syntax check, and native visual render
passed. This does not establish Makko frame rate or controller feel.

Later art recovery: the transparent vehicle poses and skyline were found in
the owner's saved files and are now bundled in `assets/cache-road/`. The lost
animation code was rebuilt in `drawVehicle`; the native
`review-cache-road-mirror/` video now renders the car, road texture, skyline
and mirror in one production draw. The older
`review-cache-road-mirror-composite/` remains only a layout study. See the
vehicle and world READMEs for the exact recovered source titles. Regenerate
the motion reviews with `node tools/render-cache-road-mirror.cjs` followed by
`python tools/build-cache-road-motion-previews.py`; the car and freight loops
are crops of that same renderer output. They are scripted art reviews, not a
browser drive or a Makko capture.

The first recovered-art motion preview was rejected by the owner. The next
review keeps wheel pixels on the road while the chassis bounces, adds an
actual narrow rotating side-rim detail during turns, a slower/larger freight
bounce, wet spray and a decaying crash jolt. The skyline's lower city is no
longer covered by the road background; separate low roofs, foreground
silhouettes, service decks/towers, lamps and world-fixed wet seams move at
different depths. The renderer's six scripted scenes now include continuous
lane moves, and its JSON motion track lets the close-up crop follow the car.
The prior parallax video is a visual reference, not a source asset. No PR has
been opened for this revision.
