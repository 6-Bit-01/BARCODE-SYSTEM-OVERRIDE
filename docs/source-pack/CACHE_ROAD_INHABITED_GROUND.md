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

## Procedural street life

Forty-two fixed infill addresses occupy selected gaps between the larger
places over the complete route. Six existing painted BARCODE settings rotate
through them: repair shop, greenhouse workshop, homes, workshops, transit
nook and utility corner. Each has a small paved branch in the ground plane
and an opaque building or service setting. The broad ground-cluster paintings
now have 440 world units between candidate addresses and yield to infill,
featured sites and their satellite frontages, so mismatched painted angles
do not pile up.

Fifteen individual pedestrians are available. The original five standing
figures remain, joined by ten side, rear or three-quarter action poses:
walking a bicycle, sweeping, gaming while walking, watering plants, repairing
a utility box, waving with groceries, skating, carrying a crate, playing a
board game and cooking at a small cart. Their PNGs are separate sources for
later animation. No group painting is used. At each world address a stable
seed chooses a group of one to five, starts with an action appropriate to the
site and fills the rest with different individual IDs. The group is composed
from independent projected sprites, never sampling an ID twice. Five painted
props—bicycle rack, work supplies, delivery van, bench with planters and data
kiosk—replace the old vector filler, with selection weighted by nearby
market, home, park, garage, works or parking context. Scale and ground contact
track road progress. The people hold one pose until animation frames are
authored; scenery does not affect collision, traffic, pickups, music or saves.

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
The three 32-second normal-speed drive excerpts cover the opening and later
route sections. These are scripted production Canvas frames; a merged Makko
drive and owner visual acceptance remain to be done.

[Opening drive](review-cache-inhabited/Cache-Road-Street-Life-Opening.mp4) ·
[Middle drive](review-cache-inhabited/Cache-Road-Street-Life-Middle.mp4) ·
[Late drive](review-cache-inhabited/Cache-Road-Street-Life-Late.mp4)

Checks cover the pinned/bundled art, all pedestrian group sizes and unique
members, six infill settings, contextual vendors, opaque scale, city pan, road
texture and a fixed ground strip moving toward the player with progress.
Judge the composition at normal play speed and in stills: curb, terrain,
buildings and small streets should read as one space without a transparent
roll-in or competing building row.
