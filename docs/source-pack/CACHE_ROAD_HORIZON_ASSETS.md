# Cache Road — wide horizon and directional place art

Base: merged #128, `049078f9192c34579332857c9781b329a6cae968`.
The intervening unpublished city-approach draft flattened the planet by
using its modest skyline clip as the roadside mask. The owner rejected that
look. This correction restores #128's wide roadside crest and separate
skyline edge. The near city still grows and rises along the full song, and
the fog still meets the city/terrain contact after side surfaces draw.

## Asset geometry and placement

The owner's marked frame asks for a short, curved piece of ground with
upright structures rooted in it. Another reference singles out the
hydroponics source as a correct **left-side** silhouette: the image climbs
from outer left to road-facing right. The whole source is mirrored on the
right. Fabrication starts with the opposite source slope and entrance.
Their asymmetry is intentional; all geometry stays in the painting rather
than bending individual columns in the game engine.

| Active source | Native side | Opposite side | Footprint |
| --- | --- | --- | --- |
| `hydroponics-horizon.webp` | Left, unmirrored | Right, mirrored | Compact wet bank with a raised inner-right gate and upright cyber grow node |
| `fabrication-horizon.webp` | Right, unmirrored | Left, mirrored | Compact gravel bank with a raised inner-left gate and upright modular fabrication structure |

The full site still grows uniformly with road depth and sits beyond the
outer sidewalk. At this stage the six intermediate WebP experiments were
inactive. They are now in the runtime on their fitted banks; see
`CACHE_ROAD_AREA_ASSET_AUDIT.md`. The hard-edged original wide garden/yard
sources remain in the asset folder but are not used.

## Asset direction

The final built-in image-generation prompts used the actual road screenshot
as a color/shape reference and the original place paintings as a rendering
reference. Hydroponics: *compact dystopian cyber city grow node, upright
dark steel/concrete tower, cyan systems, magenta controlled growth racks,
wet oil-dark pavement, curved bank rising toward the right-hand road gate,
transparent irregular edge*. Fabrication: *compact cyber industrial site,
upright modular assembly tower, cyan conduits and magenta diagnostics,
robotic arm, hazard lamps, wet concrete, curved bank rising toward the
left-hand road gate, transparent irregular edge*. Both prompts excluded
ordinary contemporary sites, cozy/rural props, long rectangular platforms,
UI, sky and text. The generated alpha PNGs were reduced to 960-pixel-wide
WebPs without changing their artwork, and those WebPs are the runtime art.

## Native review

These are scripted production Canvas frames, not Makko screenshots:

- [`left-and-right.webp`](review-cache-horizon-assets/left-and-right.webp):
  hydroponics on the left, fabrication on the right at world progress 6850.
- [`left-fabrication.webp`](review-cache-horizon-assets/left-fabrication.webp):
  mirrored fabrication on the left at progress 2100.
- [`right-hydroponics.webp`](review-cache-horizon-assets/right-hydroponics.webp):
  mirrored hydroponics on the right at progress 9780.

The focused draw check covers road-facing mirror selection, sidewalk
clearance, the separate modest skyline edge and near-city approach. The
continuous drive and repository gates are recorded in the revision receipt.
Actual Makko appearance, performance, controller and audio remain for the
owner to judge. The deferred adrenaline and power-up work is unchanged.
