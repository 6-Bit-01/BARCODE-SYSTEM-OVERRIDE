# Cache Road: procedural district motion review (September 26)

## Owner's target

The off-road landscape must be a connected, inhabited city outskirts that
rolls toward the player with the highway. Streets, sidewalks, buildings,
bus routes/stops, pedestrian paths and props belong to the same world. Keep
the wide horizon, current highway framing, ground motion, palette, existing
side-fitted areas and every individual pedestrian cutout. The previous
generated paintovers were compositional ideas; they did not respect the exact
amount of visible roadside space in the production camera.

## Actual renderer experiments

`src/game/cache-road-districts.js` is an isolated prototype loaded only by
`tools/render-cache-road-mirror.cjs` when `CACHE_DISTRICT_SEED` is set. It
generates a seeded world-space service road on each bank, continuous across
world knots; attached branches, parcel ground, side-fitted buildings, street
furniture and individual walkers are projected through the production camera
and terrain functions. A left-bank candidate stop belongs to the connected
service road. It uses a separate bench and marker, leaving the older stop
painting with its baked-in two people inactive. Nothing in the playable draw
loads this prototype. No original source or active asset was removed.

Two modes were rendered at the same seed and scripted eight-second route:

- [One spine per bank](review-cache-district-prototype/seed-53-spine-motion/Cache-Road-Curved-Roadside-Drive.mp4), with shorter branch roads and parcels.
- [Two connected street depths](review-cache-district-prototype/seed-53-layered-motion/Cache-Road-Curved-Roadside-Drive.mp4), with cross streets and parcels between them.

The renderer also produced independent layouts at seeds 17 and 53, including
[spine frame A](review-cache-district-prototype/seed-17/Cache-Road-Mirror-Road-0150.webp),
[spine frame B](review-cache-district-prototype/seed-53/Cache-Road-Mirror-Road-0150.webp) and
[layered frame](review-cache-district-prototype/seed-53-layered/Cache-Road-Mirror-Road-0150.webp).
These are scripted 24 fps Canvas production-draw reviews, not native Makko
gameplay or frame-rate measurements.

## Findings: neither mode is the solution yet

The street, curb, parcels and sprites advance coherently with highway progress;
seed changes the place sequence without changing road projection. But the
visible bank is narrow. A parallel road reads as a second highway with shops
spaced along it, and two parallel roads read as even more dark stripes. The
painted buildings still bring their own ground patches, so they do not form
continuous urban blocks. The current `terrainAt()` is a mostly shallow bank
with a small longitudinal roll; drawing more road ribbons on top of it cannot
create roads cresting, disappearing and reappearing behind local hills.

The existing procedural group IDs remain separate and unique, but these
standalone art poses do not yet provide matching toward/away walking cycles.
The prototype moves their world anchors to demonstrate paths; it must not be
confused with finished pedestrian animation.

## Recommended generator before integrating scenery

Build a sampled world-space terrain surface with a height at both route
distance and lateral distance. Keep the existing **wide silhouette**. A street
graph should choose neighborhood pockets and connections behind the visible
ridge, occasionally bringing a road toward the player; it should not expose
a continuous parallel road on each side. Grade the surface gently around
street segments, blend its banks back into the rolling ground, and use the
same samples for the road, curb, parcel footprint, building contact and
occlusion. Terrain/world material coordinates follow road progress. Draw
far ground and sites before near ground so local rises hide what is behind
them. Only after this terrain-road motion proof should parcels, existing
landmark paintings and new modular building cutouts be composed onto it.

The generator needs stable world IDs across chunks, a bounded visible set,
road-connected addresses and pedestrian routes; bus stops require an actual
connected transit path. Alternate single walkers and naturally formed groups
of 2–5 from separate unique IDs. Directional walker animation follows the
sidewalk path tangent; keep all current pose assets available as variants.

The next visual gate is actual generated motion at several seeds and route
positions, with the geometry debug view beside the game image. Check road
continuity, crest reveal, terrain/building contact, bus-stop logic, left/right
asset orientation, density and on-screen speed before replacing the current
landscape. No acceptance or playable integration is claimed here.

## Irregular grid experiment after the one-spine review

The owner preferred one local street per bank over the two-street sample, but
asked for a network going in every direction. `CACHE_DISTRICT_MODE=grid` now
generates a two-coordinate street graph: one through route on each bank,
cross streets that bend after clearing a site, optional short outer loops,
diagonal spurs, and connecting side streets. Intersections are split into
shared vertices so routes can turn where drawn streets cross. Seeded blocks
vary in length with the selected existing art's declared size. Lots can sit
between the highway and local street or beyond that street; they reserve a
clear footprint before the area, individual pedestrians, props and lamps are
anchored. The bus marker is attached to the left local route.

- [Exact top-down graph and lots at seeds 17 and 53](review-cache-district-prototype/Grid-Topology-Seeds-17-53.png). Teal is the local through street; amber is a cross street; pink and violet/green show shorter connections farther from the highway. Shaded rectangles are chosen art lots. This image is drawn from the same generated graph as the game frames, not a paintover.
- [Seed 53 in the current game camera at route distance 150](review-cache-district-prototype/seed-53-grid/Cache-Road-Mirror-Road-0150.webp) and [seed 17 at route distance 300](review-cache-district-prototype/seed-17-grid/Cache-Road-Mirror-Road-0300.webp).
- [Eight-second seed 53 camera motion sample](review-cache-district-prototype/seed-53-grid-motion/Cache-Road-Curved-Roadside-Drive.mp4). It is a scripted 24 fps Canvas review using the game's draw functions, not playable gameplay or a measured game frame rate.

This proves that road direction is not constrained to vertical screen strips,
and that the same seeded topology and lot selection persist during camera
motion. The current camera review does **not** look like a complete city yet.
Most farther connections are hidden by the narrow visible bank, while the
visible through street still reads as a long ribbon. The present terrain
projection has no two-dimensional hills, road grading or land occlusion, so
it cannot show a street disappearing behind a rise and returning with sites
cresting in layers. Some cutout ground edges and far-side placements also
need visual fitting. This experiment remains review-only; it does not replace
the playable roadside.

For the next implementation sample, make the ground a sampled surface at
route distance and lateral position. Grade it gently along graph edges;
project road, curb, parcel and asset contact through those same samples; and
mask far sites behind nearer rises. Keep the wide horizon where it is. Use
asset footprint, side orientation and road clearance to pack near and far
lots, then attach sidewalks, crossings, alleys, utility props, lighting and
stop markers to graph edges. Pedestrians should follow sidewalk tangents,
with unique individual art selected for groups of one through five; existing
action poses remain available. Review the graph and several actual camera
routes before moving the generator into the playable scene.

## Reproduce

```bash
CACHE_DISTRICT_SEED=53 CACHE_DISTRICT_MODE=spine CACHE_REVIEW_CONTINUOUS=1 node tools/render-cache-road-mirror.cjs docs/source-pack/review-cache-district-prototype/seed-53-spine-motion
CACHE_DISTRICT_SEED=53 CACHE_DISTRICT_MODE=layered CACHE_REVIEW_CONTINUOUS=1 node tools/render-cache-road-mirror.cjs docs/source-pack/review-cache-district-prototype/seed-53-layered-motion
node tools/check-cache-road-district-grid.cjs
node tools/render-cache-road-district-map.cjs
CACHE_DISTRICT_SEED=53 CACHE_DISTRICT_MODE=grid CACHE_REVIEW_CONTINUOUS=1 node tools/render-cache-road-mirror.cjs docs/source-pack/review-cache-district-prototype/seed-53-grid-motion
```
