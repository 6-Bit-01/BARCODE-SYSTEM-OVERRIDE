# Cache Road procedural city: asset bill

September 26, 2026 plan, updated September 27 after the six-family production
integration. Counts refer to **usable image exports or placement slots**;
some derive from existing art. The generator, masks, street graph and
projection are code/data, not counted as painted images. The 94-unit core
kit is now present on the unmerged review branch, with source/runtime alpha
checks and actual draw review. Owner Makko acceptance remains open. See
`CACHE_ROAD_SIX_FAMILY_PRODUCTION.md` for fit, source paths and route evidence.

**Production status:** six families × two banks × four measured tiers now
provide 48 routed cards. Eight joins, four materials, six street decals,
ten new props, twelve individual directional walkers and six practical
light sheets complete the 94 core units. The workshop's extra dense donor
exports are retained but excluded from that count. The prior market and
homes checkpoints remain historical evidence; the new review covers the
mixed full route. These units are locally implemented and tested, not yet
owner accepted in Makko. See `CACHE_ROAD_MARKET_FIRST_FAMILY.md`,
`CACHE_ROAD_HOMES_SECOND_FAMILY.md`, and `CACHE_ROAD_LAYER_GAP_AUDIT.md`
for earlier corrections.

## Existing art we keep

| Inventory | Count | Role in the new system |
| --- | ---: | --- |
| Side-audited featured areas | 22 active/usable: 9 left, 9 right, 4 both | Special parcels within neighborhoods. Their baked foundations must be buried/cropped against the new shared ground. No random flipping of wrong-facing variants. |
| Older area sources | 3 inactive | Retain in repository; do not add to the procedural selection. |
| Ground-cluster paintings | 6, three per side | Source material and occasional deep or mid decorative fragments. They are not seamless ground or the main bank fill. |
| Smaller neighborhood settings | 6 | Secondary courtyards/shops at legal parcel sockets, with scale and facing checked. |
| Review-only connected-block cutouts | 4 | Source material for block architecture; not direct production scenery until split/fitted. |
| Individual pedestrian cutouts | 15 | Separate residents and actions. Groups of 1–5 remain generated without duplicate identities. |
| Painted street props | 5 | Bicycle rack, work supplies, delivery van, bench/planters, and data kiosk; placed by street/parcel context. |
| Existing panorama, rain grain, sidewalk, main road, vehicles and HUD | Current set | Keep the approved camera and game presentation. Rear neighborhood plates come in front of the distant city; no new bridge skyline is required. |
| Service bus stop | 1 inactive | Use only after a generated local street, pedestrian path, and boarding bay make its placement believable. |

The 22/3 area inventory is documented in `CACHE_ROAD_AREA_ASSET_AUDIT.md`; the six smaller settings, fifteen people, and five props are documented in `CACHE_ROAD_INHABITED_GROUND.md` and defined in `src/game/cache-road-proof.js`.

## Reuse decision for the existing files

| Status | Files or groups | Use and required work |
| --- | --- | --- |
| Carry over in the playable scene | Current two drawn city depths (`bridge-free-distance`, `bridge-free-outskirts`), road blacktop, vehicle/traffic/HUD sprites, weather/effects, projected `continuous-ground-panel`, `rolling-ground-grain`, `sidewalk-slab`, and road furniture (`parapet`, `service-pylon`) | Keep the current visual baseline and projection. Fit the new city in front of the distant backdrop. Road furniture may need graph-aware spacing at a local street mouth; the imagery does not need replacing. Other registered panoramas are retained sources, but are not additional active city depths in the current draw path. |
| Use as featured parcels, with ground-foot cleanup | The 22 active area WebPs: **left** `community-garden-left-compact`, `community-garden-rounded`, `construction-yard-rounded`, `drone-service-node`, `encrypted-pump`, `hydroponics-horizon`, `pocket-park`, `row-house`, `substation`; **right in the current draw** `community-garden-horizon`, `construction-yard-horizon`, `construction-yard-right-compact`, `fabrication-horizon`, `signal-orchard`, `relay-exchange`, `data-reclamation`, `capacitor-exchange`, `night-data-market`; **both** `apartment`, `corner-market`, `night-diner`, `repair-garage` | Place at compatible graph parcels, preserving their audited facing. Clip or re-export the painted lot/fence edge and bury the feet in the shared terrain. The five cyber assets drawn on the right are whole-image mirrors of left-facing sources; verify signs and entrances before adding any new mirror use. These are special locations, not interchangeable seamless frontage plates. |
| Use as small settings, after footprint check | `neighborhood-repair-shop`, `greenhouse-workshop`, `outskirts-homes`, `outskirts-workshops`, `transit-service-nook`, `utility-service-corner` | Keep them as secondary courts/shops at real parcel sockets. Their baked paving may need a crop or foreground occlusion where it meets projected street material. Avoid putting them directly beside a wide plate at a different apparent angle. |
| Use as individual detail | Fifteen separate `world/props/person-*` sprites; five earlier `street-*` props | Keep distinct people and generated groups of 1–5. Twelve additional directional walking sprites and ten new context props are now active; actual walking cycles remain future animation work. |
| Recut and extend into production plates | Six `ground-cluster-left/right-01..03` paintings and four `review-puppet/connected-block-a..d` cutouts | The connected buildings, roofs, shop fronts and lighting are strong source material for rear/middle/front runs. The clusters' hard paved islands cannot tile as continuous ground, and the review cutouts have no street socket or side/contact metadata. Separate building silhouettes from baked ground, extend/cap edges, and author left/right and open/closed frontage exports. These images are **not ten finished modular plates**; some repeat similar motifs, so avoid obvious identical neighboring buildings. |
| Conditional or source only | `street-vendor-people`, `service-bus-stop`; inactive `community-garden`, `construction-yard`, `parking-lot`; older panoramas and inactive green/service/outer ground tiles | The vendor painting bakes people together; extract the stall if it is to host separately animated residents. A bus stop needs a local road, safe boarding edge and pedestrian path. The three inactive site slabs retain useful building/plant details, but their whole footprints failed the horizon fit. Keep earlier backdrops and tiles for reference rather than layering them over the current approved backdrop. |

The immediate bank-plate donor set is the **six clusters plus four connected-block cutouts**, supplemented by buildings in the six smaller settings. Reusing their painted architecture saves design and painting work, but does not eliminate the new transparent exports, side variants, legal street openings, or shared terrain joins.

## New core illustrated kit

Six district families provide the visual range. These are neighborhood *settings*, not one generic building recolored six times:

| Family ID | Character | Existing sites that can appear as accents |
| --- | --- | --- |
| `homes` | Dense row houses, shared courts, balconies, small stores | Row house, apartment, outskirts homes |
| `market` | Night food, signs, vendors, narrow pedestrian passages | Market, diner, night data market |
| `workshop` | Repair fronts, logistics bays, loading alleys | Garage, construction, repair shop, delivery van |
| `greenhouse` | Hydroponic roofs, water/utility paths, planted courts | Garden, greenhouse workshop, signal orchard |
| `data` | Relay cabinets, exchange buildings, cableways, diagnostics | Substation, relay exchange, pump, data reclamation |
| `transit` | Local street stop, courtyards, community services | Transit nook, utility corner, bus stop only when valid |

For **each family and each bank**, author four compatible image units:

1. `rear`: broad irregular roof silhouette with transparent sky and a buried lower edge.
2. `middle`: connected architecture at one radial depth, with an aligned court or passage for a possible outer street continuation.
3. `front-gap`: large road-facing frontage split around one authored street/sidewalk socket. The socket's address and width live in metadata.
4. `front-fill`: matching shop/house/court piece that occupies the socket if the world graph chooses a closed frontage. It has the same palette, contact points, and seam cover as `front-gap`.

This is **6 families × 2 sides × 4 units = 48 final sided exports**. An export may derive from shared source painting, but each of the six families needs a verified left and right result. Only the road graph decides whether a frontage gap remains open. The opaque ground and street paving underneath are renderer-owned and continue across the image boundaries. Keep doors, text and unique props out of the 45-world-unit overlap ends.

Naming example: `block-market-L-rear.webp`, `block-market-L-middle.webp`, `block-market-L-front-gap.webp`, `block-market-L-front-fill.webp`, and the matching `R` files. Metadata records side, family, tier, world span, radial band, roadward edge, ground-contact control points, socket bounds, entrance location, and legal neighboring edges. The source art has alpha; the renderer supplies the rolling mask. Do not export a visible oval lot attached to every building.

## New shared support kit

| Art category | New units | Exact uses and constraints |
| --- | ---: | --- |
| Join and street-throat cutouts | 8 | Left/right curb return, sidewalk turn, street-mouth sidewall, and wall/roof end cap. These cover joins around actual graph sockets; no fake road entrance. |
| Tileable local ground materials | 4 | Wet local-street asphalt, residential paving, service-court paving, and planted/gravel court. The main racing-road texture and rolling rain grain remain. Material origin is fixed to world address. |
| Ground decals | 6 | Crosswalk, stop line, drainage, loading bay, service stencil, and wet repair patch. Draw on projected pavement only where the graph supplies the appropriate street or parcel. |
| Small inhabited props | 10 | Two side-fitted local lamps, two crossing signals, wayfinding sign, bins/recycling, loading crates, utility cabinet, small vendor cart, and fence/planter seam cover. Reuse the five existing props alongside them. |
| Directional walking people | 12 | Six **individual identities**, each with one toward-camera and one away-camera actionable walking pose. Keep source layers suitable for later animation; never paint a group into one image. Combine with the existing fifteen people. |
| Ambient animation overlays | 6 | One sheet per family for isolated sign/window pulses, fans, steam or small practical lights. Loop locally on the plate; no whole-building opacity or scale pulse. Reduced Motion holds a clean frame. |

**Core target: 94 production art units** (48 + 8 + 4 + 6 + 10 + 12 + 6), backed by current art. This is a target for usable exports/slots, **not a request for 94 wholly original paintings**. For example, some of the 48 plate exports may recut and extend existing clusters or connected-block art; the 22 featured areas, six smaller settings, fifteen people and five props are additional reuse and are not counted again as new exports. These are design quantities, not already-created files. An atlas or multi-frame sheet can reduce file requests. Extra alternate middle plates should be added only if the actual full-route game drive shows conspicuous repeats; the initial generator can reorder six families and use the 22 featured sites for variation.

## What is generated instead of painted

- The continuous curved bank, shared ground depth strips, horizon occlusion, road geometry in all directions, junction masks, and sidewalk continuity.
- Seeded district runs and addresses; connected road graph first, parcels and plate selection second, people/props last. Nothing rerolls while crossing the screen.
- Group size and membership for pedestrians; no group sprite files.
- Motion parallax and perspective scale. Ambient details use separate frame animation; the city plates do not swell or fade independently.

## Production order and gate

1. Deliver **one complete family on both banks** (8 image units), one local ground material, and the needed socket joins directly into the playable renderer. Check the authored slope, footprint, street gap, occlusion, and offscreen exit on the actual road camera. This is a production implementation checkpoint, not a separate concept deliverable.
2. Author the other five families and support kit to the accepted contact/socket spec. The graph may choose closed or open frontages, but every generated combination must have a legal plate and connection.
3. Add small props and individual walkers by graph context, then ambient overlay animation. Validate the entire route and bends for seams, repeats, size, direction and frame pacing before the coherent Level 2 PR is presented.

Keep original working files for painting, alpha, contact metadata, and future animation, plus optimized transparent WebP runtime exports. Verify both local and pinned remote loading in Makko before treating any art as shipped.
