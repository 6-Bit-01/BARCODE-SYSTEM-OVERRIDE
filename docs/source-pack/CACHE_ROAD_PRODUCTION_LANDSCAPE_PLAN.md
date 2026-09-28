# Cache Road: measured production landscape plan

September 26, 2026. This is an implementation contract for the playable Level 2 road, not a claim that the illustrated city has been built. The image overlays below sit on frames drawn by the normal `CacheRoadProof.draw` code at world progress 230. The review harness sets the game state and captures a frame; it does not replace the landscape or load the puppet-study fixture.

## Visible baseline and proposed footprints

![Current production frame with road, sidewalk, city boundary, and reveal geometry](review-cache-production-plan/01-current-measured.png)

![Proposed rear, middle, and near illustrated coverage over that same game frame](review-cache-production-plan/02-proposed-coverage.png)

![World street sockets and the far-to-near draw order](review-cache-production-plan/03-world-and-draw-order.png)

![Left and right modular plate shape contract](review-cache-production-plan/04-asset-shape-contract.png)

![Two fixed-address plate envelopes passing the current game camera](review-cache-production-plan/05-asset-pass-and-handoff.png)

These are **geometry overlays**, not a paint-over of a hoped-for finished game. The existing HUD, traffic, road width, bend, skyline, and sparse sites remain visible underneath. The colored bank envelopes mark where the new art and opaque ground must cover. The two pale street shapes are example positions on the same coordinate system; the eventual streets come from a connected world graph.

## Measurements from the current renderer

Source canvas is 1920 × 1080; the captured review frame is 1280 × 720. The road starts at `y=400`; its width grows from 164 source pixels at the vanishing point to 1,232 at the bottom. Its depth and position are `t=1-(distance+80)/520`, `roadY=400+680t²`, and road half-width `82+534t`. Those are existing formulas in `src/game/cache-road-proof.js`, not proposed camera changes.

At progress 230, the projected widths are:

| Source y | Depth t | Road x span | Left / right visible bank | Bare bank beyond outer sidewalk |
| ---: | ---: | ---: | ---: | ---: |
| 425 | .192 | 678–1047 | 678 / 873 px | 608 / 803 px |
| 470 | .321 | 637–1143 | 637 / 777 px | 527 / 667 px |
| 570 | .500 | 573–1271 | 573 / 649 px | 400 / 476 px |
| 740 | .707 | 487–1407 | 487 / 513 px | 226 / 252 px |
| 910 | .866 | 413–1502 | 413 / 418 px | 75 / 80 px |

These values are source pixels; multiply by 2/3 to compare with the review PNGs. The left/right widths differ because the road bends at this address. Repeatable numbers for progress 0, 230, and 600 can be recomputed from the production projection; the three unmarked game frames are in `review-cache-production-plan/baseline/`.

Four code facts explain much of the current look:

1. Ground clusters are drawn every **440 world units** and only when `.10 < t < .70`. That visible interval spans `(.70-.10) × 520 = 312` world units, so **at most one cluster per bank** can be inside that window at a time. Some intervals contain none. Other featured sites can occupy a bank, but they are separate individual pieces.
2. Those six ground-cluster images are 1774–1903 pixels wide, but a 128×64 alpha sample of their full canvases finds only **44.5%–57.2% fully opaque pixels**. This is a source-image statistic, not a measurement of on-screen building coverage. Scaling these same cards up cannot alone fill the blank ground beneath their silhouettes.
3. The visible city boundary and the building reveal use different curves. At progress 230, the city boundary is roughly `y=403–439`; the separate reveal curve reaches **y=845** at both outer edges. `clipRoadside` stops applying the reveal curve entirely at **t=.75**, which is `y=782.5`. That discontinuity can expose a building foot at one instant.
4. Surface strips already use the road projection: outer ground samples every **85 world units**, grain every **48**, and sidewalk every **55**. The missing piece is a shared world layout and near-depth occlusion for large upright scenery and connected branch roads.

## Production data model

Create deterministic chunks at road addresses, initially **180 world units apart**, with an illustrated ground/plate span of **225 units**. The 45-unit overlap is a starting geometry value to test in motion. Left and right chunk phases differ so they do not form matching gates. A chunk records:

- Side, `startAt`, `endAt`, stable seed, and district family.
- Street sockets at the arterial sidewalk and at compatible outer/longitudinal neighbors. An edge has connected nodes in `(at, radial distance)` coordinates, so its shape may run along the road, outward, turn, or cross diagonally. Roads are projected from those nodes, not scattered as screen-space polygons.
- Parcel sockets with facing, footprint, entrance position, setback, and allowed art family. Buildings may only occupy a parcel that has a reachable sidewalk.
- Rear/middle/near plate references, ground contact line, and front occlusion line. These are metadata for renderer placement, not a painted lot attached to each building.
- Pedestrian and prop slots tied to a connected sidewalk or intentional court. Existing single-person cutouts remain individual; groups of 1–5 are formed at runtime with no repeated person inside one group.

The generator joins sockets before placing art. Any visible street mouth must lead to a local lane and at least one parcel or a clearly drawn intentional endpoint. A bus stop is eligible only when a local street and sidewalk actually serve it. The graph should offer straight, turning, crossing, and diagonal routes over multiple chunks; it should not demand every road shape in every frame.

## Art contract

The complete production count, family names, connector pieces, reuse inventory, and proposed export naming are in [the Cache Road asset bill](CACHE_ROAD_ASSET_MANIFEST.md).

Author **six neighborhood families**, each with separate rear, middle, and near transparent plates: at least **18 base plates**, then side-specific variants and socket/ground join pieces where mirroring would put an entrance, sign, or perspective on the wrong side. All six families need a usable composition on **each** bank, even when that requires separate art. Candidate families are homes/shops, market/diner, repair/service, transit/workshops, greenhouse/hydroponics, and data/utility. Current area assets, six ground clusters, and four review cutouts remain available as details or source material; none should be enlarged and called a finished neighborhood.

At `t=.5` (source `y=570`), the left and right visible banks are 573 and 649 pixels wide, with 400 and 476 pixels beyond the sidewalk. The first art plates should project to about **750–900 source pixels wide** at that depth and overscan the outer frame edge. That implies an initial width parameter of **1500–1800 × t**, to be adjusted against their painted silhouettes. The plate's lower portion carries continuous opaque terrain/architecture except where a declared street socket cuts it. The upper outline can be irregular and transparent. Adjacent plates need compatible ground colors, perspective, contact height, and edge details. This is a footprint requirement, not an instruction to draw a rectangular billboard.

### Exact source shape and join rules

The diagram above defines **what each source cutout and its metadata must provide**. It is a schematic, not proposed building art. The left-bank roadward edge is on the **right** of the source image; its outer contact is lower in screen space, and its roadward contact is higher. Right-bank art has the opposite orientation. Preserve the authored perspective, door facing, signs, and asymmetric lighting; a mirrored source is usable only when all of those still make sense.

- **Transparent top:** irregular roofs, signs, aerials, and gaps. Do not paint a rectangular sky or opaque skyline strip into an upright plate.
- **Illustrated middle:** a connected run of several compatible buildings at *one approximate radial depth*. Buildings implied to be much farther back go into a separate rear plate; those close to the sidewalk go into a near plate. That lets each layer have its own perspective motion.
- **Buried bottom:** building foundations and a short painted transition extend below the renderer's contact curve. The final visible bank edge comes from live projected terrain, not an oval or diagonal land island baked into the image. The ground itself is a separate opaque world-plane surface that can carry a curved street or sidewalk.
- **Legal openings:** a local-street socket is an intentional gap between facades. Road paving draws underneath it and connects to the arterial sidewalk. The layout must choose an open variant where its graph has a mouth; it must never punch a road through a painted building. Frontage variants need closed, access, and corner/through choices; rear roof plates do not need the same openings.
- **Join margins:** the proposed 225-unit span with 180-unit pitch leaves 45 units of overlap. Keep the ends free of unique doors or text, give their contact/ground material matching colors, and cover the join with a plausible corner, wall, roof overhang, or foreground object. No time-based transparency crossfade.

Each exported plate needs metadata for `side`, district family, `tier`, world-address span, radial depth band, contact/control points, street-socket locations, entry position, and allowed neighboring edges. Anchor its **roadward edge** a few pixels beyond the outer sidewalk, then let its large outer edge overscan the frame. Do not center a giant cutout at an arbitrary radial x position where it can jut into the lanes. An upright plate scales as one local depth band; the ground texture is projected separately through the road's actual camera. That distinction prevents a broad street or lot painted in perspective inside a sprite from fighting the road projection.

### What one passing module does

For a **hypothetical** left middle plate anchored at world address 500, drawn at `1600 × t` pixels wide, the existing game projection gives the following progression. The width is a proposed art parameter; `t`, road y, and x are derived from current game formulas. Its roadward edge is `roadsideX(left,t,220,190)-20t` and its outer edge extends left by the drawn width. The four-panel overlay draws its outline and that of another fixed-address plate at 680 over normal production frames; the outlines are placement diagrams, not new building art.

| Player progress | Depth t | Ground y | Plate width | Roadward edge x | Outer edge x | What should be visible |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 100 | .077 | 404 | 123 px | 677 | 554 | Roof fragments behind the far terrain; preceding scenery still fills the bank. |
| 230 | .327 | 473 | 523 px | 517 | −6 | Middle facade and connected frontage emerge while lower feet remain occluded. |
| 360 | .577 | 626 | 923 px | 327 | −596 | The plate overscans the left frame; the next block is visible nearer the horizon. |
| 500 | .846 | 887 | 1,354 px | 78 | −1,276 | Only its roadward edge remains; the following block owns more of the visible bank. |

The natural perspective scale change remains. The visual fix is the **handoff**: several partly visible layers are present before any one building gets large, and nearer opaque scenery covers the old layer as it passes. A plate must not be created when it enters the visible range or faded in. Its world address, art selection, and connected streets exist throughout the drive; clipping and offscreen culling determine visibility.

The procedural order is: choose a coherent neighborhood family across several chunks; connect local street sockets; carve accessible parcels; select side-safe closed/open/corner plate variants that fit those parcels; then place separate props and pedestrians. Random choices are stable by world address. This imposes real compatibility rules rather than promising that every perspective painting can be placed next to every other one.

## Implementation sequence in the actual game

1. **Build the layout module** (`src/game/cache-road-landscape.js`) with the chunk, street graph, parcel, and art-placement data above. Load it in `index.html` before `cache-road-proof.js`. The same seed/address must reproduce the same layout after pause, retry, or restore. Add graph assertions for connected sockets, valid parcel access, and no duplicate pedestrian within a group.
2. **Replace the scenery draw path in `cache-road-proof.js`.** Keep the present `center`, `roadY`, `half`, `sideDepth`, and road/vehicle/HUD behavior. Draw bank strips from far to near. Each strip paints continuous ground and connected streets, then its upright plate; the next nearer opaque strip hides the older plate feet and the older street continuation. Road and sidewalk draw at the same world progress. Remove the `t=.75` clipping switch and the independent site-reveal curve after the new occlusion is working. Cull only beyond projected bounds; never use an alpha fade to introduce a nearby block.
3. **Register the art in `presentation-assets.js`** and make it load in the real game. Its current loader tries an immutable remote art commit before a local path; Makko may omit binary assets from imports. The new keys need a reachable pinned asset commit and a verified fallback, not just files that work in the local render harness. Existing art is retained until in-game replacements prove better.
4. **Attach activity to the world graph.** Store pedestrians and props by parcel/sidewalk address. Add camera-facing and camera-away walking cutouts/frames where current sources cannot support the intended motion. Keep groups procedural and animate after their placement and scale work in motion.
5. **Tune and integrate the entire route** on the playable Level 2 branch. Remove or suppress old ground-cluster/isolated-street draws where the new system owns the same addresses. Keep the existing HUD, music, gameplay, road width, and background baseline unless a measured fault specifically calls for a change. Ship one coherent game PR, not a review-only renderer path.

## Acceptance checks

- Drive the actual level continuously from opening through late route, on both straight and curved sections, and inspect fixed addresses at progress 0, 230, 600, 1300, and 2200 under at least three layout seeds. Scripted captures are diagnostic evidence; the deliverable is playable Level 2.
- At the measured middle span (`y≈470–740`), rear/middle/near coverage must make the outer banks read as connected city ground. Reject any extended bare corridor that persists across three consecutive review points or any hard card seam, floating foot, transparency pop, or suddenly materializing road.
- Verify a tracked building's screen position/scale changes continuously until terrain or the frame hides it; a street socket remains connected to its sidewalk as it passes. Re-run this through bends and both side orientations.
- Exercise pause/retry/save restore at the same address. The street graph, parcels, and people must be identical. Check missing remote art and local fallback explicitly in Makko, and compare browser frame pacing with the pre-change route before accepting the PR.
- Keep Level 2 music, lane actions, traffic collision, vehicle art, and the wide road/planet camera behavior intact. Owner review in Makko decides whether the final visual density and motion meet the desired game feel.

## Reproduction

```sh
CACHE_REVIEW_PROGRESS=0,230,600 CACHE_REVIEW_STILLS=1 \
  node tools/render-cache-road-mirror.cjs \
  docs/source-pack/review-cache-production-plan/baseline
node tools/build-cache-road-landscape-plan.cjs

CACHE_REVIEW_PROGRESS=100,230,360,500 CACHE_REVIEW_STILLS=1 \
  node tools/render-cache-road-mirror.cjs \
  docs/source-pack/review-cache-production-plan/motion-baseline
node tools/build-cache-road-asset-handoff.cjs
```

`review-cache-production-plan/Measurements.json` records the projection rows and alpha samples behind these overlays. The numerical values above are measured or directly derived from the current renderer. The initial chunk pitch, plate dimensions, and coverage zones are **design parameters to validate in the playable build**, not claims about an existing system.
