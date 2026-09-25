# Cache Road city approach and planet edge — September 25, 2026

**Historical rejected local draft:** the owner found the single shallow
crest made the planet too small and exposed buildings awkwardly. The
current correction restores the wide roadside planet, keeps the near-city
approach and fog, and uses directional compact cyber assets. See
`CACHE_ROAD_HORIZON_ASSETS.md`.

Base: merged #128, `049078f9192c34579332857c9781b329a6cae968`.
The owner marked a dark gap between fog and the planet at both sides of the
game screen, then supplied industrial and garden close crops where a wide
painted platform seemed to rise above the horizon. The same game art is kept.

## Geometry and draw order

The old roadside mask dropped as much as 420 canvas units near the screen
edges, while the city was clipped by a separate 48-unit curve. Wide painted
sites could expose their whole diagonal base at a depth where the side
landscape still read as a distant crest. A single shallow curve now follows
the road's vanishing point and defines the city/terrain contact and first
roof reveal. A site then advances through a smooth, depth-based clearing
zone; its base is already visible before the near clip is removed. The
individual world positions, external sidewalk setbacks and native art
scale/facing are retained.

The closer `cacheMidCity` frontage draws at its native aspect, growing from
2370 to 2620 canvas units while its foot rises by 151 units from the opening
to the end of the route. The city progress is clamped to the full four-lap
distance and does not reset at a lap boundary. The other two city layers
stay fixed in depth; all three share the bounded road-bearing pan. Reduced
Motion freezes decorative pan but still shows forward travel toward the
city. Contact haze follows the shared crest after projected side-ground
panels, before sidewalks and fully colored foreground sites.

## Review and limits

The first and third-lap 32-second production Canvas drives and staged
opening, yard, garden, mid-route and final approach views were inspected.
Four exact renderer frames are in `review-cache-city-approach/`:
`opening.webp`, `yard.webp`, `garden.webp` and `final-city.webp`.
The focused renderer check covers the long vivid roof-to-foot reveal,
shallow shared crest, proportional city growth, shared pan and Reduced
Motion. The full suite and hosted browser checks are recorded with the
review revision. These draws are not a playable Makko capture, and the
owner's judgment of the new horizon and wide illustrated lots remains open.

The game still uses complete oblique paintings for the yard, garden and
park; this pass adjusts how they enter the scene rather than painting new
geometry inside them. If their internal perspective remains awkward at
normal game size, those individual locales should be repainted around the
road projection, using the game's existing art style and road-facing
entrances. The music, traffic, action pads and deferred adrenaline/power-up
work are outside this visual change.
