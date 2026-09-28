# Cache Road illustrated puppet-city study

This is a **visual study**, not a change to the playable road.

## Two distinct views

- `Illustrated-Target.png` is a generated edit of a Cache Road frame. It shows
  the intended visual density, continuous sidewalks, layered outskirts,
  activities and convincing ground contact. It is one painted target frame,
  not evidence that these objects have independent layers or will animate.
- `Assembled-Camera-Frame.webp` and `Puppet-Card-Drive.mp4` are scripted
  frames from the actual Cache Road renderer. Four new transparent block
  paintings are placed with existing house, diner, repair, utility and
  ground-cluster assets at seeded addresses. They use the current road width,
  horizon, bend and HUD. The streets are connected only within the review
  fixture; the playable landscape is untouched.

## What the comparison reveals

The new building paintings have richer silhouettes and overlap in depth, but
the camera assembly still falls short of the target. Large stretches of
ground between blocks remain empty. The new street mouths lack illustrated
corners, continuous sidewalk turns, and enough secondary settings; the old
painted lots still carry parts of their private foundations. The ground
material and card feet require a single surface and continuous terrain
occlusion rather than a card-level reveal alone. Existing road width also
leaves little screen area for deeper cards at passing distance.

The four PNGs under `assets/cache-road/world/review-puppet/` are opaque
building cutouts on transparent backgrounds. They remain review assets until
footprint, frontage, contact masks, left/right facing and connection pieces
are authored and accepted. Do not promote this review module to production
as a completed procedural landscape.

The fixture can be reproduced with:

```sh
CACHE_PUPPET_SEED=37 CACHE_REVIEW_CONTINUOUS=1 \
CACHE_DISTRICT_SECONDS=6 CACHE_DISTRICT_FPS=15 \
node tools/render-cache-road-mirror.cjs OUTPUT_DIR
```
