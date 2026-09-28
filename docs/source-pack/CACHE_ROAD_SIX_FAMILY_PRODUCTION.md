# Cache Road six-family production integration

September 27, 2026. Unmerged review branch based on merged `main` at
`2b711916170368735cb77dfce15466a27ce21bb0`. The owner's
approved layered-city composition remains the reference: road and wide 420
unit planet crest, shallow separate city edge, opaque rear/middle/front
cards, and a nearer rolling ground strip that hides older feet. The camera,
road geometry, distant skyline, featured sites, traffic and HUD are unchanged.

## Production inventory

| Category | Current usable units | Runtime relationship |
| --- | ---: | --- |
| Six district families, two banks, four tiers | 48 | Side-specific rear, middle, open front and filled front. The workshop's two extra dense donor files remain retained but are not counted as the core four tiers. |
| Sided joins | 8 | Curb, turn, mouth wall and end cap on real graph openings. |
| Local materials | 4 | Wet road plus residential, service and planted courts. Main road and rolling rain grain are reused. |
| Street decals | 6 | Crosswalk, stop line, drain, loading bay, service stencil and repair patch projected onto graph street quads. |
| New street props | 10 | Two bank lamps and two crossing signals at legal mouths; wayfinding, bins, crates, cabinet, cart and fence/planter at matching districts. |
| New directional people | 12 | Six separate identities in toward/away walking poses, composed at runtime without duplicate identities in a group. Fifteen earlier action poses remain active. |
| Animated practical overlays | 6 | Four-frame window/sign/fan details, one sheet per family. The building plate itself stays opaque at fixed scale. Reduced Motion holds a frame. |
| **Total new core kit** | **94** | These are image units/exports, not 94 unrelated setting paintings. |

Optimized WebP runtime exports are checked into GitHub under
`assets/cache-road/world/blocks`, `materials`, and `props`; joins, decals and
practical sheets are SVG. The transparent PNG masters remain in the maintained
v5 source pack and can be compared when that pack is unpacked. `tools/import-cache-road-district-art.py` can re-export WebP from the
source-pack masters; `tools/build-cache-road-support-art.py`
rebuilds the exact vector support art. No group pedestrian is one image.

## Fit and selection

| Measurement | Value | Gate |
| --- | ---: | --- |
| Horizon in 1920×1080 camera | y = 400 | Existing city/road boundary retained. |
| Road depth projection | y = 400 + 680t²; half width = 82 + 534t | Bank cards and all props use the same `sideDepth` as the road. |
| Side planet crest | 420 unit rise | No small-planet roundness change. |
| Chunk pitch / span / overlap | 180 / 225 / 45 world units | Both banks covered beyond the 9840 unit route end. |
| Graph street mouth | half width 19, total 38 world units | Open front has transparent alpha socket; closed front occupies it. |
| District cadence | 10 chunks per family run, seeded six-family cycle | A family holds through approximately 1800 units. Side streets and accents vary by seed and bank. |
| Source roadward feet | u=.86/.77/.68/.86 on L, usually .14/.23/.32/.14 on R for rear/middle/open/filled | Workshop R open uses u=.38; source-specific y contacts live in `cache-road-landscape.js`. |
| Open socket boundary | L u=.70–.72; R u=.28 | Fully transparent reserved right/left fifth; the graph decides when to use it. |

All 48 runtime plate keys occur on the current protected-site route; every
open key pairs with a generated street at its chunk address. The alpha test
compares PNG and WebP source dimensions and feet to the declared metadata,
checks the downhill outer bank, and checks reserved socket transparency.
Contacts are intentionally different between sources; visual placement uses
the measured contact rather than treating image bottom as the ground.

Courts choose pavement by family: homes/transit residential, greenhouse
planted, workshop/data service, market wet street. The road graph is made
before art, parcels have accessible entrances, and street marking quads
are only drawn on its two connected branch edges. Directional walkers and
props are seeded once at world addresses. The street furniture is not a
new bus stop; the old shelter remains inactive pending a real boarding bay.

## Actual renderer review

The `review-cache-six-districts/default` stills sample 0–9000 progress across
all six families. `streets` samples actual graph mouths, including workshop,
greenhouse and data bends. `drive-0` through `drive-3` traverse four consecutive
2460 unit route quarters at eight review frames per second. These captures
run the production `CacheRoadProof.draw` path with staged HUD/game state.
They establish image layering and world-fixed motion in the local Canvas
renderer; they do not measure Makko host frame pacing or certify owner
appearance acceptance. Inspect the moving clips for transitions, street
continuity, repeated motifs and bank exits before merging.

The remaining gate is an owner Makko import/open and moving playtest on the
actual host, including frame pacing, road controls, side approaches and
asset loading. The 97 new runtime entries request the immutable art ancestor
`33c768b73f29d9e0e2a91f30961a525030e6f6ba` and fall back to the
bundled paths. That revision is published; the pinned URLs can resolve independently
of whether Makko imports the bundled binaries. Previously published art retains its
existing pins. Walking poses are separate static frames for later motion
cycles; the six practical detail sheets animate now.
