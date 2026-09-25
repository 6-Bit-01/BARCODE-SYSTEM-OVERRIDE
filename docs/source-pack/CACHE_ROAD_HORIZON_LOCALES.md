# Cache Road horizon and roadside locales — September 25, 2026

Base and rollback: merged PR #125, `6524ce84dcdc8d911054126da1f28b75f3c9afa6`.
This is the next visual correction for owner review, not a change to the
song, lane actions, traffic collisions, saves or campaign awards.

## Why this pass exists

The owner saw overlapping and repeated buildings, a parking ground plane
rising above the horizon, wrong-facing open locales and cars whose new art did
not match the game's illustrated traffic. The last generated horizontal and
oblique parking/park candidates were discarded. Their bitmap files are not
part of this build.

The renderer previously made two independent rows from the same complete
place paintings. It also treated parking and park paintings as upright sprites
with a fixed isometric ground slab. Flipping a long slab moved its gate but
could point its length away from the road on the other side.

## Current scene model

- One seeded row places ten types in twenty individual sites per lap. A type
  returns after five stations, outside a single visible road vista. The first
  market and house retain their opening placement; later laps swap sides and
  pair order. Small landscape details occupy gaps without reproducing whole
  houses or covering active sites.
- Upright buildings remain whole oblique game paintings beyond the outer
  sidewalk. Their arrival scale begins very small. A horizon clip follows
  projected depth: only the roof is visible first, then the base clears the
  foreground lip, then the site grows and travels past the screen edge.
- Parking and park ground use near and far points from the same curved road
  path as the sidewalk. Their entry, bays and path therefore turn with the
  road. The parking surface reuses the road's wet asphalt texture and the
  parked vehicles are the actual `cacheCourier` and `cacheAudit` game art.
  Park foliage is cropped from the existing painted park art; its fixed long
  slab is not drawn. Parking's old long painting is no longer preloaded.
- Streetlight scale, traffic, pads, song bars, HUD and all music/gameplay
  behavior remain in their established draw/update ownership.

## Verification and remaining judgment

The production draw harness checks a roof clipped at distance, full reveal
and greater scale nearby, exterior sidewalk clearance, one whole building of
each type per visible vista, parking cars outside the walkway and cropped park
foliage. `npm test`, `npm run check:syntax:all` and `git diff --check` passed
locally. Native scenes for the opening and third lap, six site approach
stages, and an uninterrupted 32-second drive were visually inspected.

Those renders are scripted production draws, not a Makko playthrough or
audio/controller/performance acceptance. In Makko, check the roof-to-ground
reveal on both sides during a bend, the visual size of the park and parking
cars, the lot edge at the sidewalk, and close passes through all districts.
Report the imported SHA and a road position/frame for any pop, overlap,
floating ground or style mismatch. The adrenaline and defensive/offensive/
traffic/environment/song/lane power-up plan remains in
`CACHE_ROAD_COHESION_AUDIT.md` after this visual review.
