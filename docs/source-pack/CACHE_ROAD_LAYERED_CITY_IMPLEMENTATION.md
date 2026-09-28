# Cache Road layered city: playable integration candidate

September 26, 2026. This work follows the measured production landscape
plan and the [gap audit](CACHE_ROAD_LAYER_GAP_AUDIT.md). It changes
`CacheRoadProof.draw` in the playable Level 2 route. The scripted captures
below are evidence from that draw function, not concept art or Makko owner
acceptance.

## What runs in the game

At the default seed, the route has 117 overlapping bank chunks at 180-unit
pitch and 225-unit span, 253 world-addressed cards/parcels, and 15 protected
street mouths (7 left, 8 right). The graph has 547 nodes and 573 edges.
Each parcel entrance connects to the arterial sidewalk, its footpath, or a
loading court. The generator selects mouths from gaps between featured sites
before it selects a front gap card. Three local route shapes change the
diagonal approach to a court; the deeper graph connection remains a footpath
until there is compatible corner/through art.

The renderer paints 24-unit sampled ground strips from far to near. Each
strip shares the road's world progress and samples a terrain height from
address and outward distance; the next strip hides older building feet.
Card scale and address exist throughout the drive, without a visibility
fade. A roadward contact offset compensates for transparent source padding
on the right-bank workshop plates. The broad workshop pavement slab is
retained as an asset but no longer drawn as a parallel road. An actual
small court terminates each painted branch.

The six existing neighborhood settings and contextual street life remain
in graph-owned parcels or featured-site frontages. The old sporadic ground
clusters are suppressed where the continuous chunks own the bank; the
paintings remain in the asset folder. The 22 active featured area artworks,
15 individual pedestrian variants, road width, wide crest, separate city
boundary, two city depths, HUD, traffic, music, and gameplay remain.

Two additional left/right dense workshop cutouts are local art donors in
this candidate. Including them gives ten workshop plate exports, not ten
accepted modular assets or six finished district families.

## Production draw evidence

- [Opening and progress 230](review-cache-layered-city/default/Cache-Road-Mirror-Road-0230.webp),
  [later bend 1300](review-cache-layered-city/default/Cache-Road-Mirror-Road-1300.webp),
  [2200](review-cache-layered-city/default/Cache-Road-Mirror-Road-2200.webp).
- [Seed 17 at 230](review-cache-layered-city/seed-17/Cache-Road-Mirror-Road-0230.webp)
  and [seed 53 at 1300](review-cache-layered-city/seed-53/Cache-Road-Mirror-Road-1300.webp).
  The folders also contain 2200 for both seeds and the default folder
  contains 0 and 600. These are three actual generator seeds, with the
  same featured-site addresses.
- [12-second continuous production-draw drive](review-cache-layered-city/Continuous-Drive.mp4),
  at 15 captured frames per second, covering world progress 0–960. The
  harness scripts HUD/traffic state and renders the normal road draw;
  it is not an interactive or Makko frame-rate measurement.

The renderer exposes `CACHE_LANDSCAPE_SEED` only in the review harness;
production uses 0x6b4d. `npm test`, `npm run check:syntax:all`, and
`git diff --check` pass on this candidate. The focused test checks full
bank address overlap, accessible parcels, graph connectivity, site-protected
mouths, seeded variation, distinct procedural pedestrian groups, surface
projection, and the existing Level 2 gameplay.

## Open acceptance work

This is the first real layout and painter integration, **not** the approved
finished city. The workshop architecture still repeats and the five other
neighborhood families need sided rear/middle/near art, socket variants and
validated contact/control lines. Only branch-to-court pavement is currently
painted; the outer footpath graph must gain art-supported turns and crossings
before it becomes a visible street grid. Some transparent source fringes
and near-bank seams still require source fitting through the full route.
Existing featured sites still use the earlier `t=.75` reveal switch; remove
it only after a continuous terrain occlusion comparison proves the new mask
works for those art sources too. Pedestrian poses are static pending walk
cycles. The new local-first artwork loads in repository review, but Makko
asset import/fallback and browser frame pacing are not verified. Owner
judgment of the look remains open.
