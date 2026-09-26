# Cache Road: rolling ground and inhabited outskirts

## Visual scope

The road height, 420-unit roadside crest, two-depth city, HUD, palette, weather,
featured site addresses, and driving rules retain the reviewed composition.
The current foundation uses a continuous opaque ground panel under sites and
six painted ground clusters, three for each bank. A cluster yields to a nearby
featured site or smaller neighborhood scene so whole paintings do not fight
for the same part of the landscape.

The rain grain now samples adjoining 48-unit world strips from one painted
source. A texel's address is fixed by world distance modulo 624; its projected
position uses the same `sideDepth(at - progress)` as the road's sidewalks,
places and lamps. Both banks clip at the established shallow city boundary,
while bases remain buried in the rolling bank. The material advances toward
the player when the road advances, including through bends and pause/resume.

The six ground-cluster paintings now sit closer to the visible bank and draw
larger, so their buildings read as neighborhoods at driving scale. The six
smaller gap settings also draw larger. Eighteen deep-set featured sites get
compact frontages chosen by their use: homes by housing, repairs by garages,
utility hardware by works, a garden/workshop by parks, and a vendor at
selected market or diner sites. These frontages keep the original site address.

## Static neighborhood trial

Forty-two fixed infill addresses occupy selected gaps between the larger
places over the complete route. Six existing painted BARCODE settings rotate
through them: repair shop, greenhouse workshop, homes, workshops, transit
nook and utility corner. Each has a small paved branch in the ground plane,
an opaque building or service setting, and a few fixed residents and props.
Cycles, carts, terminals, planters and service crates repeat with different
contexts; the existing foreground places get matching props. Residents and
small furniture also appear by featured sites and parking areas. The
pedestrians hold a deterministic pose for this visual trial. None of these
objects affects collision, traffic, pickups, music or saved game state.

The branch road appears only at middle distance and narrows into its painted
setting. It does not turn into a wide dark slab near the player. Infill art
draws below the road and main sites, and its foot is clipped into the same
terrain surface. The gap selection prevents a second full building row.
Deep-set frontages do not add junctions. The painted bus-stop source is
retained but inactive: the current roadside has no verified bus route or stop
frontage. The older flat shelter and stall drawings were removed; the vendor
painting appears only with market/diner addresses.

## Native review

Compare the [opening](review-cache-inhabited/Cache-Road-Mirror-Road-0000.webp),
[early cluster scale](review-cache-inhabited/Cache-Road-Mirror-Road-0320.webp),
[early service gap](review-cache-inhabited/Cache-Road-Mirror-Road-0400.webp),
[next block](review-cache-inhabited/Cache-Road-Mirror-Road-0700.webp),
[later bend](review-cache-inhabited/Cache-Road-Mirror-Road-4000.webp) and
[last section](review-cache-inhabited/Cache-Road-Mirror-Road-6200.webp).
The separate continuous 32-second drive is the motion review. These are
scripted production Canvas frames; a merged Makko drive and owner visual
acceptance remain to be done.

Checks cover the pinned/bundled art, six infill settings, contextual vendors,
opaque scale, city
pan, road texture and a fixed ground strip moving toward the player with
progress. The composition should be judged at normal play speed as well as
in stills: the curb, terrain, buildings and small streets should read as one
space without a transparent roll-in or competing building row.
