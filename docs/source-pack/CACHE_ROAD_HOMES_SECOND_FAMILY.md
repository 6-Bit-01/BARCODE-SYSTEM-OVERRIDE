# Homes family and graph join checkpoint

September 27, 2026. This is the second of six planned sided neighborhood
families in the playable `CacheRoadProof.draw` landscape. It is an art and
projection checkpoint, not an owner-approved full-route city pass.

## Measured fit

The camera still uses `horizon=400`, `roadY=400+680t²`, road half-width
`82+534t`, and the separate 420-unit roadside reveal crest. Each world
chunk has 180-unit pitch, 225-unit illustrated span, and 45-unit overlap.
The street graph owns a 38-unit mouth (`halfWidth=19`); a transparent
frontage is never used without that graph mouth. Left fronts descend toward
the left outer bank and reserve their right edge for a street; right fronts
descend toward the right bank and reserve their left edge. Source dimensions
and fitted terrain contacts are:

| Unit | PNG and WebP size | Foot `(u, source y)` | Road-facing edge |
| --- | ---: | ---: | --- |
| `block-homes-L-rear` | 1942 × 809 | `.86, 612` | occupied |
| `block-homes-L-middle` | 1944 × 809 | `.77, 647` | occupied |
| `block-homes-L-front-gap` | 1944 × 809 | `.68, 675` | transparent from `u≈.70` rightward |
| `block-homes-L-front-fill` | 1944 × 809 | `.86, 695` | occupied |
| `block-homes-R-rear` | 1944 × 809 | `.14, 579` | occupied |
| `block-homes-R-middle` | 1942 × 809 | `.23, 632` | occupied |
| `block-homes-R-front-gap` | 1944 × 809 | `.32, 617` | transparent to `u≈.28` leftward |
| `block-homes-R-front-fill` | 1942 × 809 | `.14, 662` | occupied |

The transparent PNG masters are in `assets/cache-road/world/blocks/sources/`;
their WebP runtime copies are in the parent directory. The first paint
iterations exposed long blank stone retaining walls in the actual game
view. The eight final cards carry stepped doors, rooms, stairs and plants
under the existing homes, while their lower contours remain irregular and
buried by the same world-addressed bank ground as the market. Warm amber,
bronze and plant green add to the palette without changing the approved
sky, HUD, road, camera or city depths.

Left trial frontage addresses are 2600–4099, and right addresses are
2700–3599. These exercise open and filled fronts on both banks of the
protected-site route; they are temporary selection windows rather than the
final seeded six-family district scheduler.

## Shared street and join fit

The eight side-specific SVG cutouts in `assets/cache-road/world/joins/`
cover sidewalk turns, curb returns, street-mouth sidewalls and front roof/
wall end caps. The SVG generator is `tools/build-cache-road-join-art.cjs`.
The sidewalk and curb pieces keep their centers transparent and draw only
at actual graph mouths; the parapet is clipped at the exact 38-unit opening.
The wet local-street material is now shared by market, homes and workshop
graph streets. Each tapered road quad is drawn with two affine triangles;
the previous one-image mapping left a flat gray uncovered wedge. The
material samples a stable world row and the near ground strips bury older
street and building feet.

## Review evidence and open gate

- [20-second actual renderer pass](review-cache-homes-family/Cache-Road-Curved-Roadside-Drive.mp4)
  covers progress 2460–4060 at 15 fps, with five sampled frames and a
  motion track in the same folder.
- Seed 17 stills at [3050](review-cache-homes-family/Seed17-Road-3050.webp),
  [3150](review-cache-homes-family/Seed17-Road-3150.webp), and
  [3500](review-cache-homes-family/Seed17-Road-3500.webp) show another
  open/closed arrangement through the near bend.
- `npm run check:cache-road-proof` verifies the protected route, graph
  sockets and projected road draws. Its art check decodes all 16 new
  PNG/WebP pairs, compares source contacts and side slopes, and checks
  transparent versus occupied frontage. `npm run check:presentation-assets`
  covers the 146 registered assets and local fallback.

The remaining four planned district families, residential/service court
materials, decals, directional walkers, mixed-family transitions and seeded
district selection are still to be built. Existing workshop donor cards and
the six smaller setting accents remain in the route. This scripted Canvas
capture does not prove hosted Makko import or frame pacing. The full
100-bar route and owner gameplay review remain the acceptance gate.
