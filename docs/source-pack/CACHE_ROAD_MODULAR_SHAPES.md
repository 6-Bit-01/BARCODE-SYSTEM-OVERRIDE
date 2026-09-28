# Cache Road modular world: shape contract (review draft)

This defines the interfaces between the street generator and illustrated
roadside cards. It is a design target, not a change to the playable renderer.
The previous grid experiment remains a diagnostic until a real camera-motion
sample shows coherent ground, streets and buildings together.

## One coordinate system

Every road, sidewalk, lot, card foot and pedestrian route uses `(along,
outward, height)`: distance along the highway, distance outward from its
edge on the left or right bank, and the shared terrain height. The camera
projects these coordinates once. The roadside crest is a silhouette of that
surface, with the wide horizon staying at its reviewed height. An object
emerges because nearer ground stops hiding it, never because its opacity
fades in. Road and ground material samples advance with highway progress.

World dimensions are provisional until a short actual-camera motion proof.
Use **U** for the width of a narrow storefront at a readable middle distance.
It is a world measurement, not a fixed number of screen pixels. A site can
have an irregular polygon footprint; the widths below are fitting classes,
not a square-tile grid.

## Shared street and sidewalk interfaces

1. Generate a connected street graph with variable block lengths, bends,
   diagonals, T/X junctions, small loops and occasional dead ends. One local
   through street may run per bank; other streets form neighborhood pockets.
   Every visible crossing is also a route junction.
2. Expand each graph edge into a graded road surface. Derive continuous curb
   and sidewalk edges from it. Junctions own the polygon where those strips
   meet; no card paints an independent road or sidewalk under itself.
3. Polygonize the remaining space into blocks. Cut lots from blocks using
   each card's frontage width, depth, entrance and clearance. The road graph
   can adjust to needed block sizes before a site is accepted.
4. Leave accessible openings where a sidewalk meets a doorway, alley,
   driveway or transit stop. People move on connected sidewalk paths; a bus
   stop requires a connected bus route.

| Footprint family | Frontage and depth | Appropriate cards |
| --- | --- | --- |
| Narrow frontage | About 1 U wide, 1–2 U deep; one street edge | Home, kiosk, small shop, service bay |
| Connected row | 2–4 U wide, 1–2 U deep; divisible bays | Several related buildings, market row, workshop strip |
| Corner or wedge | Two accessible street edges, angled back edge | Corner shop, diner, utility building, entrance plaza |
| Deep court | 2–4 U frontage, 2–3 U depth, one clear access | Multi-building setting, garden, depot, yard |
| Passage or alley | Two occupied sides and a traversable gap | Back entrance, stair, pedestrian passage, narrow street |
| Terrace or open lot | Irregular boundary following terrain contours | Park, construction area, planted slope, parking or utility pad |

The [footprint sheet](review-cache-modular-shapes/Footprint-Interfaces.png)
shows these as **top-down geometry interfaces**. It is not a proposed game
frame or a set of final art silhouettes. Its editable SVG is beside the PNG.

## Illustrated card interface

Each card, whether one building, a cluster or a long strip, supplies:

- Its transparent illustration and a separate contact shadow or mask.
- A footprint polygon, ground-contact anchor, visible height and scale band.
- One or more frontage edges with doorway/driveway points and road-facing
  direction. A corner can face two streets; LEFT/RIGHT rules apply to the
  actual illustrated perspective, not to a baked ground mound.
- Optional back/front sublayers for fences, awnings, trees, balconies and
  people so a nearer card or rise can pass in front correctly.
- Use tags such as home, workshop, market, transit or open space, plus the
  lighting/material family it belongs to.

The shared ground supplies all pavement, rain grain, curb, slope and road
connection. Nearby cards join through authored covers: drainpipes, fences,
wall returns, steps, planters, cables, alley mouths and contact shadows.
Rows have real end caps and repeatable middle bays. A compound card can keep
several buildings together, but it obeys the same footprint/frontage rules
as an individual card. Horizontal city strips stay in the far or middle
distance; their own ground cannot become a foreground slab.

## Procedural composition and proof

The generator chooses a district character, builds streets and sidewalks,
fits a mixture of individual lots and compound settings, then fills valid
gaps with connectors and activity. It varies block length, street angle,
depth, building height and density while preserving connected entrances and
clear pedestrian space. The current 25 area paintings, six ground clusters,
15 individuals and existing street props remain available for salvage or
select landmark use; ground-bearing art may need separating before it joins
the modular kit.

The first gate is a **real renderer** sample: one short moving district,
generated at two seeds and seen at far, middle and passing distances with
the existing gameplay road and HUD. Review the top-down geometry beside the
actual camera motion. The sample must show an intact crest, road/sidewalk/
lot contact, overlapping buildings, a visible turn, coherent scale, opaque
reveals and no repeated wall of props. Only then lock world-unit dimensions
and commission the larger batch of compatible illustrated cards.

## In-camera fitting check

The [six-second camera sample](review-cache-modular-shapes/camera-seed-53-motion/Cache-Road-Curved-Roadside-Drive.mp4)
uses the actual Cache Road camera, horizon, HUD and existing BARCODE paintings.
The [approach](review-cache-modular-shapes/camera-seed-53/Cache-Road-Mirror-Road-0000.webp),
[middle](review-cache-modular-shapes/camera-seed-53/Cache-Road-Mirror-Road-0120.webp)
and [passing](review-cache-modular-shapes/camera-seed-53/Cache-Road-Mirror-Road-0240.webp)
frames show the same world locations as the car advances. The layout is a
review-only repeating footprint fixture with seeded spacing; it is not the
proposed street generator or a playable change. Existing images stand in for
future ground-separated cards. A second [seed-17 check](review-cache-modular-shapes/camera-seed-17/Cache-Road-Mirror-Road-0240.webp)
tests a slightly different fitting offset.

In the actual camera, a row hugs each roadside bank. The near house/shop or
diner/garage passes sideways out of view; a deeper compound becomes visible
behind it as the crest uncovers its lower edge. The little diagonal between
them is where a local street would turn into a neighborhood. The road, lot
and card foot currently share a projection, so their motion stays together.

This fitting check does **not** pass the visual gate yet. The broad flat bank
and existing painted foundations still make these look like well-placed
roadside illustrations, not a connected district. The local street has no
convincing cut into the highway edge or continuous sidewalk junction, and
the far horizon remains sparse. Seed variation changes offsets but does not
create distinct neighborhoods. The next camera proof needs a single
height-bearing terrain surface, a road/sidewalk junction cut into it, card
art separated from its old ground island, and terrain occlusion of each card
as it rolls over the crest. Only then is a denser procedural fitting test
meaningful.

## Connected-block visual follow-up

The [connected-block camera study](review-cache-connected-block/README.md)
puts an access street, back lane, junction, alley, four occupied lots, street
fixtures and individual pedestrians into the actual moving view. The left
and right openings are staggered, so they do not read as a paired gate. It
also compares the current road width with a preview-only narrower road that
reveals more of the back block while leaving the crest height unchanged.

This is still an authored visual fixture, not procedural district generation.
It establishes the need for several depth bands and connected in-between
space. The current wide road leaves little screen area for the deepest band;
the comparison should inform the camera/terrain choice before new assets are
commissioned. New modular cards and a shared height surface remain the next
engineering and art requirements.
