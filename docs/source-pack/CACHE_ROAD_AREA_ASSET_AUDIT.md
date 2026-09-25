# Cache Road area asset side audit

September 25, 2026. The first audit covered **18** transparent area WebPs:
ten original sources and eight later shape studies. Five cyber sources for
the right and two more for the left bring the current folder to **25**. The
table retains the first audit and adds the two new left sources. That audit
places each of the original 18 **unmirrored** on the left and
right of the restored wide horizon at equal depth, then compares its ground
edge again as it approaches. LEFT and RIGHT describe the source as painted;
they do not require every footprint to be square. The owner's marked road
example calls for a taper that rolls into the planet on its own bank.

| Area source | Side as painted | In the game | Ground/fit observation |
| --- | --- | --- | --- |
| `apartment.webp` | BOTH | Active legacy | Narrow footing; little diagonal ground to contradict either bank. |
| `community-garden-horizon.webp` | RIGHT | Active at 8158 | Long bank climbs away toward the outer right; awkward on the left. |
| `community-garden-left-compact.webp` | LEFT | Active at 6303 | Short, soft mound climbs toward the inner right. |
| `community-garden-rounded.webp` | LEFT | Active at 4460 | Rounded diagonal garden; opposite bank reverses the taper. |
| `community-garden.webp` | LEFT | Inactive | Its long rectangular retaining edge still juts, even on its better bank. |
| `construction-yard-horizon.webp` | RIGHT | Active at 3635 | Long industrial bank tapers on the right; wrong-way slope on the left. |
| `construction-yard-right-compact.webp` | RIGHT | Active at 7015 | Shorter right-hand industrial mound has a gentler outer edge. |
| `construction-yard-rounded.webp` | LEFT | Active at 3138 | Rounded industrial bank is less abrupt on the left. |
| `construction-yard.webp` | LEFT | Inactive | Hard rectangular apron remains conspicuous on either horizon. |
| `corner-market.webp` | BOTH | Active legacy | Compact building with a short, unobtrusive paved base. |
| `drone-service-node.webp` | LEFT | Active at 6511 | Compact cyber garage with its ground taper painted for the left bank. |
| `encrypted-pump.webp` | LEFT | Active at 7427 | Rounded pump platform with a short rising inner edge. |
| `fabrication-horizon.webp` | RIGHT | Active default yard | Cyber site is painted for the right and mirrors as a whole on the left. |
| `hydroponics-horizon.webp` | LEFT | Active default garden | Cyber site is painted for the left and mirrors as a whole on the right. |
| `night-diner.webp` | BOTH | Active legacy | Small rounded footing works on either bank. |
| `parking-lot.webp` | NEITHER | Inactive | Flat slab and painted cars conflict with the rolling ground; projected lot remains. |
| `pocket-park.webp` | LEFT | Active legacy | Long path reads best rising toward the inner right; straight edge remains visible. |
| `repair-garage.webp` | BOTH | Active legacy | Short square footprint is not strongly handed. |
| `row-house.webp` | LEFT | Active legacy | Small diagonal garden rises to the right of the house. |
| `substation.webp` | LEFT | Active legacy | Long fence and paving rise toward the right; a weaker fit than compact sites. |

The first 18 raw source shapes group as **9 LEFT, 4 RIGHT, 4 BOTH, 1 NEITHER**.
Side is a silhouette direction, not an endorsement of the hard-edged original
garden and yard. The seven other legacy paintings keep their existing
road-facing mirror rule; this pass changes only the selected garden and yard
sites. The two cyber defaults also mirror the whole source on the opposite
bank, preserving their slope. The six older variants stay **unmirrored on
their assigned bank**. No site is added: right-side addresses 3635 and 8158
reuse existing substation and park positions, respectively, to bring the
right-hand versions into the playable route before the finish.

## Visual comparisons

The six paired source sheets show all 18 unmirrored sources at world progress
7020 and 7060. Each row uses the same place size, setback, depth, and wide
horizon; left and right are the actual production drawing paths. In order:

- [Horizon 1](review-cache-area-sides/horizon-1.webp), [2](review-cache-area-sides/horizon-2.webp), [3](review-cache-area-sides/horizon-3.webp)
- [Closer 1](review-cache-area-sides/closer-1.webp), [2](review-cache-area-sides/closer-2.webp), [3](review-cache-area-sides/closer-3.webp)

The [live first three](review-cache-area-live/live-1.webp) and
[live last three](review-cache-area-live/live-2.webp) show the six selected
variants at their **actual seeded addresses**, each at approach and closer
distance. The renderer's `CACHE_REVIEW_AREA_ASSET` mode produces the
equal-depth unmirrored comparisons without changing the live game. Its
`CACHE_REVIEW_PROGRESS` mode produces the actual-address frames. These are
scripted production Canvas draws; Makko's presentation remains for owner
review. The reference sketch shows direction and contact, not a demand for
rectangular assets.

## Five additional areas — mirrored onto the right

The five new cyber cutouts came out with a left-facing slope. The owner
identified that handedness and asked to flip the complete pictures. Their
WebPs retain the original pixels; the game draws each entire source with
`flip:true` only at its assigned right-bank address. That preserves upright
buildings and turns the ground taper, doorway and lighting together. The
actual right-hand side now has **four existing native-right sources and five
new mirrored sources**. The new assets reuse sites already in the route:

| New WebP source | Right-bank world address | Area kind | Intended rendered width |
| --- | ---: | --- | ---: |
| `relay-exchange.webp` | 623 | Substation | 360 |
| `night-data-market.webp` | 2685 | Market | 560 |
| `data-reclamation.webp` | 5055 | Construction | 560 |
| `signal-orchard.webp` | 5829 | Garden | 600 |
| `capacitor-exchange.webp` | 8846 | Substation | 550 |

Before the two new left sites, the inventory was **23 WebPs, 20 active**, with the two original
hard-edged wide lots and painted parking slab inactive. As raw files, the
five additions are left-facing, so the source-only count would be 14 LEFT,
4 RIGHT, 4 BOTH and 1 NEITHER. The in-game right-facing selection gains five
through whole-image mirroring. No new roadside address was created.

## Two additional areas — native left bank

The owner pointed out that two of the nine original LEFT selections were
inactive. The encrypted pump and drone service node fill that usable gap.
Both have transparent, compact BARCODE cyber bases painted for the left,
drawn **unflipped** at existing substation and garage positions respectively.
Their live approach and closer frames are in
[the left-bank comparison](review-cache-left-live/left-live-1.webp).

The current inventory is **25 WebPs: 22 usable and active** in the road,
grouped as **9 LEFT, 9 RIGHT, 4 BOTH**, plus **3 retained inactive** (the
original garden, original construction yard and painted parking lot).
The five mirrored paintings count on the RIGHT where the game draws them;
the two new native-left paintings count on the LEFT. Neither the wide
planet nor the roadside address count changes.

### Facing diagram and actual game frames

- [Left-facing selections](review-cache-area-sides/side-facing-1.webp): nine
  **active, usable** sources as painted on the left. The two hard-edged
  originals are retained only in the audit table.
- [Right-facing selections](review-cache-area-sides/side-facing-2.webp): four
  older sources as painted plus five new sources mirrored on the right.
- [New right placements 1–3](review-cache-right-live/right-live-1.webp) and
  [4–5](review-cache-right-live/right-live-2.webp): actual existing world
  addresses, approach and closer distance. The tall relay uses a narrower
  width so it does not tower across the HUD.
- [New left placements](review-cache-left-live/left-live-1.webp): the drone
  service node at 6511 and encrypted pump at 7427, approach and closer.

The shared image-generation prompt asked for separate wet-charcoal BARCODE
cyber locations with cyan/magenta signals, amber practical light, upright
architecture, one compact asymmetric rolling parcel and a genuinely
transparent background. Subjects were signal orchard, relay exchange,
data reclamation yard, capacitor exchange and night data market. The
generated orientation was corrected by mirroring the entire painting at
draw time after comparing both banks.

The two additional left prompt subjects were a wet charcoal encrypted pump
station with cyan conduits and a compact robotic drone service bay, each
with magenta diagnostics, amber practical lights, upright structures and a
short sloping transparent parcel fitted to the left bank.
