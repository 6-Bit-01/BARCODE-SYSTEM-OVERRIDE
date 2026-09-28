# Cache Road workshop family — first playable art checkpoint

September 26, 2026. This records the earlier playable workshop export. It
does **not** meet the modular city acceptance contract: its runs are isolated,
its tiers do not share an opaque ground handoff, and its sources lack complete
contact/join metadata. The measured correction is in
`CACHE_ROAD_LAYER_GAP_AUDIT.md`. The files below remain useful donor art, not
eight approved production plates.

![Eight sided workshop plates](workshop-family-contact-sheet.png)

## Delivered image units

| Bank | Rear | Middle | Front with street gap | Closed front |
| --- | --- | --- | --- | --- |
| Left | `block-workshop-L-rear` | `block-workshop-L-middle` | `block-workshop-L-front-gap` | `block-workshop-L-front-fill` |
| Right | `block-workshop-R-rear` | `block-workshop-R-middle` | `block-workshop-R-front-gap` | `block-workshop-R-front-fill` |

All eight PNG sources are in `assets/cache-road/world/blocks/sources/`; the
matching transparent runtime WebPs are one level above. The rear and middle
plates recut the four connected-block review paintings. The four front plates
were generated from the painted ground clusters and edited for the appropriate
roadward edge. `front-gap` opens on the **right edge of the left-bank image**
and the **left edge of the right-bank image**. `front-fill` occupies that same
frontage when the street graph has no branch. There is no whole-image mirror
at runtime. These are buildings with alpha below and around their feet, not
standalone opaque terrain islands.

`assets/cache-road/world/materials/sources/workshop-wet-pavement-original.png`
is the unmodified top-down painted source. The runtime WebP is an edge-matched
tile made by resizing the source to 1024 square, mirroring it horizontally,
then mirroring the resulting pair vertically. The renderer samples neighboring
world-address strips and blends to the existing ground grain at district ends.

## Camera and socket contract

`src/game/cache-road-landscape.js` holds the eight image dimensions and their
per-tier roadward anchor. A district schedules two banks with front, middle and
rear addresses 95 world units apart, and alternates the open frontage between
banks where an existing featured site permits it. Front plates within 98 world
units of a featured site are omitted; street mouths need 160 units of clearance.
One run begins near world address 405; subsequent runs are seeded and separated
by about 2660–3140 world units. The same addresses persist through pause,
retry and draw calls.

The street graph starts at the arterial sidewalk (`radial=220`), reaches a
corner 135 world units ahead at `radial=430`, and terminates in a loading court
190 units ahead at `radial=540`. The mouth is 38 world units wide. These values
describe a first legal connector, not the completed multidirectional grid.
Paving renders under the art. The sidewalk is cut at the matching address,
curb returns are drawn around the entrance, and parapet/pylon segments are
omitted across the mouth. A closed frontage has none of those cuts.

The plates use the same `sideDepth`, road bend and `terrainAt` projection as
the ground and sidewalk. Their alpha remains one; a rolling geometric clip
reveals the roof from behind the approved wide crest and buries the feet.
Only the district ground material blends to the old grain at its world edges.
The existing road, city depths, HUD, sites, pedestrians and gameplay are kept.

## Renderer review

Actual 1920×1080 draws were captured at progress 180, 280, 390, 560, 620,
3300, 3500 and 6800 in `review-workshop-first-family-final/`. The scripted
12-second continuous opening is
`review-workshop-first-family-final/continuous/Cache-Road-Curved-Roadside-Drive.mp4`.
These are VM renderer captures; they do not certify Makko loading, frame rate,
controller feel or owner acceptance.

The nine new runtime images are currently registered as local-first assets.
The art commit exists on the local branch, but its push was blocked by automatic
approval review, so there is no published immutable URL for Makko imports that
omit binary files. Keep this distinction until the branch can be published and
the image root pinned to that commit.

The first family brings larger buildings across the crest and the pavement
advances with the road. At near passes, the authored gap and its street move
offscreen together. Broad ground still shows between clusters and the same
building motifs become obvious when this one family spans an entire district.
The next production batch needs another family with a different silhouette,
more parcel coverage and smaller inhabited details. The local street's visual
read also needs review beside those new plates before treating the road graph
as a full neighborhood grid. No bus stop is active at this socket.

## Verification

- `npm run check:cache-road-proof` loads the landscape generator and checks
  deterministic sockets, protected featured sites, graph linkage and the
  existing full-route gameplay contract.
- `npm run check:syntax` and `git diff --check` pass.
- `npm run check:cache-road-browser` requires `CHROME_BIN` in this environment;
  the VM renderer was used for this asset checkpoint.
