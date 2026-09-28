# Cache Road layered city: implementation gap audit

September 26, 2026. Local head
`14c26b5591b29c733612215484adc8e218254ca3`. Read before authoring more
production cards. This compares the current playable workshop integration
with the approved direction and measured camera plan. The older v2–v5 source
packs predate this September 26 landscape work; the current repository,
owner corrections, `AGENTS.md`, `CURRENT_STATE.md`, `ACCEPTANCE.md`, measured
overlays and live renderer are the implementation references. This is an
audit of the current game, not a new visual pass or Makko acceptance.

| Approved rule / evidence | Current playable implementation | Result |
| --- | --- | --- |
| At source `y=470,570,740`, visible bank beyond the sidewalk is left/right `527/667`, `400/476`, `226/252` pixels. Both banks need rear, middle and near art filling this space; see `review-cache-production-plan/Measurements.json` and `02-proposed-coverage.png`. | Workshop plates are centered around isolated addresses. Their illustrated silhouettes occupy only part of each large transparent canvas. | **Fails coverage.** Renderer screenshots still show wide bare pavement between small clusters. |
| Proposed chunks every 180 world units with 225-unit covered spans and 45-unit overlap; separate rear/middle/near depth bands and an opaque near ground strip hiding older feet. | Six plate addresses per bank in a 675-unit workshop run. At the committed seed, three runs leave 2,475 and 2,406 uncovered world units between them. The three tiers rotate through the addresses rather than each chunk owning all three; they share the same `sideDepth` reveal and are drawn over the ground in one list. | **Fails continuity and depth layering.** More scale alone would repeat/swell those cutouts. |
| A shared sampled `(along,outward,height)` terrain surface grades streets and parcels, supplies ground contact and occludes far buildings behind nearer rises; see `CACHE_ROAD_MODULAR_SHAPES.md` and `CACHE_ROAD_PROCEDURAL_REVIEW.md`. | `terrainAt()` interpolates between two lateral positions on a mostly shallow bank with a longitudinal sine. The workshop art has a geometric clip at its own foot, but no opaque nearer ground pass between layers. | **Fails terrain/occlusion.** Roads and buildings cannot truly roll behind local hills yet. |
| A connected graph chooses streets, sidewalks, accessible parcels and a legal opening before selecting art. It may bend, turn, cross or end intentionally. No exposed parallel-road ribbons or bus stops without service. | One graph branch per workshop run can cut a sidewalk and parapet. Its two edges lead to a loading court, but there is no block/parcel graph across the route. Older isolated infill streets still render elsewhere. | **Partial connector only.** It is not the requested procedural neighborhood street system. |
| Art plates have transparent roofs, road-facing entrances, compatible contact points, overlap-safe ends, declared frontage sockets and no baked lot island. Review-only connected blocks require fitting before promotion; see `04-asset-shape-contract.png` and `CACHE_ROAD_ASSET_MANIFEST.md`. | Four rear/middle PNGs were copied from the review cutouts; four front edits have large transparent gaps. No authored contact points, overlap ends, individual frontage metadata or illustrated join pieces were validated. | **Fails production art contract.** The earlier “9 of 94” count describes file exports, not nine accepted modular units. |
| Preserve the wide 420-unit roadside crest, shallow city boundary, two city depths, palette, road/HUD/gameplay, 22 active featured areas with 9 LEFT/9 RIGHT/4 BOTH, and fifteen individual people assembled without duplicate IDs. | Those existing systems are still present. A local-first workshop art registration has no published immutable binary URL for Makko. | **Preserved locally; hosted art unverified.** Do not claim Makko integration or owner acceptance. |

The generated illustrated target in `review-cache-puppet-city/Illustrated-Target.png`
is a density goal, not evidence that one bitmap can animate. Its adjacent
`Assembled-Camera-Frame.webp` and the latest workshop drive both demonstrate
the same deficiency: isolated art on a broad flat bank. The prior dense
transparent puppet rows, dark near-camera road slabs, wall-like horizon and
unconnected bus stops are rejected examples, not shortcuts to restore.

## Corrected build order

1. Replace the isolated workshop run schedule with a persistent 180/225
   world-address coverage scaffold on both banks. Measure coverage at the
   listed y rows in real frames. Rear/middle/near must have different depth
   jobs and a near ground occlusion pass. Keep roads and featured places legal.
2. Implement terrain samples and graph-derived road/sidewalk/parcel contact
   before drawing more painted roads. Show a geometry debug view beside the
   actual moving game camera. Reject any branch that appears as an arbitrary
   slash or cuts a building.
3. Fit new large sided cards to that geometry and produce overlap/contact
   metadata and illustrated joins. Use the workshop sources as donor art, not
   proof of a complete family. Preserve the existing featured sites and
   individuals; distribute six district families to avoid repetition.
4. Check opening, bends and later route at multiple seeds and continuous
   speed. Reject three consecutive bare mid-bank review points, floating
   feet, alpha pop, misfacing, sidewalk intrusion and unconnected roads.

No additional production export should be marked accepted before those
in-camera checks. Two newly generated dense-block paintings outside the
repository are unintegrated scratch exploration, with baked ground and no
verified socket/contact data. They are not counted or approved assets.

## Exact sources and scope reconciled

I checked the owner's corrections through September 26 against
`CACHE_ROAD_PRODUCTION_LANDSCAPE_PLAN.md` and all five overlays, its
`Measurements.json`, `CACHE_ROAD_ASSET_MANIFEST.md`,
`CACHE_ROAD_MODULAR_SHAPES.md`, `CACHE_ROAD_PROCEDURAL_REVIEW.md`,
`CACHE_ROAD_AREA_ASSET_AUDIT.md`, `CACHE_ROAD_INHABITED_GROUND.md`,
`CACHE_ROAD_SETBACK_FACING.md`, `CACHE_ROAD_HORIZON_ASSETS.md`,
`CACHE_ROAD_WORKSHOP_FIRST_FAMILY.md`, `CURRENT_STATE.md`, `ACCEPTANCE.md`
and `AGENTS.md`. I inspected `cache-road-landscape.js`, the actual draw in
`cache-road-proof.js`, `presentation-assets.js`, `index.html`, the eight
runtime WebPs, their contact sheet, production stills at progress 280 and
390, and the puppet-city target beside its real assembled camera frame.
The target painting establishes desired density; it does not establish
runtime behavior. Several user-marked screenshots are missing from the
workspace, so this audit does not pretend to have remeasured their circles.

Fresh production-draw captures at the planned review addresses are retained
for this audit: [progress 230](review-cache-layer-gap-audit/Cache-Road-Mirror-Road-0230.webp),
[1300](review-cache-layer-gap-audit/Cache-Road-Mirror-Road-1300.webp) and
[2200](review-cache-layer-gap-audit/Cache-Road-Mirror-Road-2200.webp).
These use the real `CacheRoadProof.draw` path; their HUD state and movement
are scripted by the review harness, not a Makko play session.

Newer corrections control historical drafts. The accepted baseline is the
wide planet, separate shallow city edge, two bridge-free background depths,
moving world-fixed grain and road, with the established camera/palette/HUD.
The rejected shallow tiny planet, wall horizon, bridge-heavy skyline,
transparent puppet rows, dark near-camera street slabs, exposed parallel
road ribbons and unconnected bus stops are not implementation options.

The source canvas is 1920×1080. Current projection is
`t=1-(distance+80)/520`, `roadY=400+680t²`, road half-width `82+534t`.
At progress 230, ground beyond the outer sidewalk has these widths in
**source** pixels; the review frame scales them by two thirds:

| Source y | t | Left bank | Right bank | Planned visible job |
| ---: | ---: | ---: | ---: | --- |
| 425 | .192 | 608 | 803 | Rear roofs, beginning of middle blocks |
| 470 | .321 | 527 | 667 | Rear/middle with near handoff |
| 570 | .500 | 400 | 476 | Middle/near; first plate footprint about 750–900 px, overscanning the outside edge |
| 740 | .707 | 226 | 252 | Near frontage and opaque nearer ground |
| 910 | .866 | 75 | 80 | Passing edge; no art swelling into lanes |

The initial tier bands in `02-proposed-coverage.png` are rear
`t=.015–.43`, middle `.28–.72` and near `.57–1.10` **on each bank**.
These are design parameters to validate in the actual moving camera, not
an excuse to center a transparent image of nominally correct width.

Inspecting the committed generator with the production featured-site
protection at seed `0x6b4d` yields three workshop runs at `338–1013`,
`3488–4163`, `6569–7244`; 30 plates (12 rear, 12 middle, **6 front**) and
only **two** connected workshop street mouths. The source width parameters
of 1470–1600 times `t` nominally yield 735–800 pixels at `t=.5`, but their
architecture has a different footprint and radial anchor. The eight
runtime images have 37.9%–54.6% fully opaque *canvas area*, not measured
on-screen building coverage. The production stills visibly retain wide
bare banks. Increasing width by itself cannot create continuous terrain,
legal joins or depth occlusion.

## Approved-detail traceability

`Pass` here means a current source/renderer feature was verified, not that
the owner accepted its appearance. `Partial` means a supporting piece exists
but the agreed system is absent.

| Requirement | Actual source or renderer evidence | Status / next proof |
| --- | --- | --- |
| Dense, large, overlapping, page-filling city banks across the route | Three short workshop runs, with the measured gaps and small isolated silhouettes in the 280/390 actual frames | **Fail:** measure both banks at the five source-y rows after continuous coverage. |
| Rear/middle/near as separate depth jobs with overlap and a clean handoff | Plate tiers rotate by address at 95-unit spacing; all draw after common ground with one `sideDepth` | **Fail:** each repeated chunk must contain different radial-depth roles and occlude earlier feet. |
| Natural roof peek, buried foundation and opaque rolling reveal, without whole-art fade | A per-sprite geometric clip uses `crestY` and shallow `terrainAt`; ground draws before every sprite. Existing `clipRoadside` still drops its crest mask at `t=.75` | **Fail:** draw far-to-near opaque terrain strips and track a building over consecutive frames. |
| One sampled `(along,outward,height)` ground surface for road grade, sidewalk, parcels, feet and occlusion | `terrainAt(side,t,x)` interpolates two lateral heights plus a longitudinal sine; it is not a sampled two-coordinate world surface | **Fail:** implement and inspect surface contours and actual camera roll before more art. |
| Wide crest and clear city/terrain boundary without wall, triangle or floating road | `horizon=400`, original 420-unit roadside crest and separate shallow `cityCrestY` remain; the two bridge-free depths remain | **Preserved locally:** do not change their height to disguise mismatched art. |
| Ground texture and streets advance at road speed through bends | Outer ground 85-unit, grit 48-unit and sidewalk 55-unit projected strips remain; workshop pavement blends only inside its three runs | **Partial:** moving material exists, but opaque continuous district terrain and graded roads do not. |
| Connected multidirectional streets, bends, diagonals, junctions, loops or intentional ends; no visible parallel-road ribbons | Two workshop branches have one mouth/two edges and end at a court; independent `INFILL_SCENES` still paint isolated branches. `cache-road-districts.js` is a rejected review experiment, not playable system | **Fail:** connect nodes across chunks, grade routes, then derive blocks and parcels. |
| Every street mouth matches sidewalk, curb/rail gap and reachable frontage | Workshop mouth cuts sidewalk/rail/pylon at its address; older infill roads have no graph mouth or accessible parcel polygon | **Partial:** assert every road endpoint and parcel access across the route, not only a chosen workshop gap. |
| Side-safe buildings outside the outer sidewalk; preserve house/diner/garage facing and varied location size/setback | Existing 73 featured occurrences retain independent bank cadence, sizes `.86–1.16`, variable setbacks, and whole-image side flip rules; six additional block fronts are selected around protected sites | **Partial:** existing place code is preserved, but each new block requires roadward contact, footprint and passing-frame face checks. |
| 9 usable LEFT, 9 usable RIGHT, 4 BOTH area sources, plus 3 retained inactive | `SIDE_VARIANTS`, `PLACE_ART`, curated featured addresses and the area audit preserve the 22/3 inventory; five new right cyber images are whole-image mirrors | **Pass for existing inventory:** do not flip raw side-fitted art casually or count inactive sources as usable. |
| Transparent irregular roofs, one radial-depth building band, buried bottom, sockets, matching ends and illustrated joins | Eight workshop WebPs exist; four rear/middle are direct review cutouts. Metadata has key/size/radial anchor and an occasional socket, but no contact/control points, footprint polygons, legal neighbor edges or painted join pieces | **Fail:** treat them as donor images until re-exported and validated on both banks. |
| Six distinctive district families on each bank, with rear/middle/front-gap/front-fill and support kit | Only the workshop family and one wet-pavement material exist; the 94-unit bill includes 48 sided exports and support art, not 94 accepted paintings | **Fail:** author the other five only after the geometry/contact gate. “9 of 94” is a file count, not nine accepted units. |
| Inhabited roads, alleys, courts, decals, street furniture and varied settings arranged by the graph | Six older compact settings, six ground-cluster sources, five painted props and contextual site satellites are in the game, but do not fit workshop parcels or hide its seams | **Partial:** retain reusable art and place by legal parcel/sidewalk slots. |
| Individual pedestrian assets; groups of 1–5 with no duplicate identity; actionable directional walkers later | Fifteen separate sources and deterministic unique group IDs are checked in `check-cache-road-proof.cjs`; current anchors follow site/infill scenes, not a walkable network. Toward/away cycles are not authored | **Partial:** preserve individuals and reanchor them to graph paths; separate new walking poses from group composition. |
| Bus stop only with a connected transit route, bay and pedestrian path | Bus-stop painting is retained but inactive; five painted props remain context selected | **Pass for current placement:** do not activate the stop just to fill space. |
| Highway camera/width, traffic, lane actions, HUD, music, vehicle art, weather and reduced-motion ownership unchanged | Current production modules and assets remain in place; no landscape prototype replaces gameplay | **Preserved locally:** run game regression and compare full-route motion after a real replacement. |
| Stable seed/world IDs through motion, pause, retry and save restore | Current generator is deterministic, but its data model contains no connected route-wide block/parcel/people graph | **Partial:** assert exact node/parcel/group regeneration at several seeds and restored addresses. |
| Pinned runtime art fallback and Makko acceptance before merge | Workshop entries in `presentation-assets.js` use `root:''`. They load locally, but no published immutable art root exists; the previous push was rejected by automatic approval review | **Unverified:** do not claim hosted import, frame pacing or owner acceptance. |

The first gate is a real generated moving district and its debug geometry,
at multiple seeds and route positions, with the original width and horizon.
It must show continuous three-depth occupation, legal road mouths, opaque
contact and a pass off the frame. A screenshot or one new dense painting
cannot satisfy that gate. The complete six-family art kit and route-wide
production integration follow only when these measured mechanics hold.
