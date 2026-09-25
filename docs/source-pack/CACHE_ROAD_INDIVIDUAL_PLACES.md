# Cache Road individual places — September 25, 2026

The owner rejected the six long diagonal paintings from PR #122. The intended
roadside is a succession of separate locations: buildings, houses, open lots,
parks and service spaces that emerge small in the distance, become larger,
and pass at road speed. The individual artwork is still authored in oblique
perspective. A uniform size change preserves each roof, wall and footprint;
the renderer does not stretch a connected facade or slice a strip.

Ten transparent parcels are in `assets/cache-road/roadside/places/`: corner
market, row house, parking lot, pocket park, repair garage, apartment, night
diner, substation, community garden and construction yard. The right side
mirrors the no-text illustrated props. The separate PNGs are retained under
`places/sources/`; `places/README.md` lists their roles and art direction.

Both sides receive seeded world-positioned lots. Four district palettes
change the mix along each lap, and a foreground parcel's type and size
control its next spacing. A second, smaller row of independent parcels gives
depth behind the main places; its choices and intervals have separate seeds.
Fixed seeds mean pause, retry, save restore and frame-rate changes cannot
reshuffle the landscape. Small kiosks, low houses, trees, fences, utility
boxes, wet paving and glints fill intervals between the parcels. The older
distant/mid city layers, curved service deck,
slab joints, parapet, walkers and lamps remain at distinct depths. Each
moving foreground element shares `depth(at - progress)`, `roadY(t)` and the
curved `roadsideX` projection with the road. Place images use one scale in
both axes and become translucent near their distant entry.

The native review renders a continuous 32-second drive across the first
urban and industrial districts, plus the seven scripted traffic and song
states. The production proof checks deterministic variety, separate parcels
on both sides, uniform growth and movement with a lamp, and the absence of
the rejected strips. These are visual and logic fixtures. Makko import and
the owner's normal-speed judgment still decide whether density, perspective
and driving feel work. The road pads, HUD instruments and bar motifs from
PR #122 remain in this pass; traffic, five supplied stems, controls, saves,
collision, and campaign award boundaries retain their earlier rules. The
adrenaline and defense/offense/traffic/environment/song/lane power-up list
remains in `CACHE_ROAD_COHESION_AUDIT.md` for the next mechanics work.
