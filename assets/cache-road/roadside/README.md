# Cache Road roadside art

`parapet.webp` and `service-pylon.webp` are optimized from the transparent PNGs
in `sources/`. The parapet is drawn as consecutive projected wall segments
following the road bend. Service pylons and cantilever lamps sit at world
distances, get larger as they pass, and mirror across the road. Their amber
light and chipped steel remain separate from lane indicators. Full prompts
and reference roles are in `../ART_PROMPTS.md`.

The six `*-perspective.webp` cutouts are the current market, depot and muted
frontage art for both sides of the road. Their diagonal depth is painted into
the source, including the continuous curb and paving. The renderer registers
each whole image to two projected world points; the previous horizontal
`market-block`, `relay-depot` and `service-frontage` images are historical and
not loaded. See `DIAGONAL_PROMPTS.md` and
`docs/source-pack/CACHE_ROAD_INSTRUMENT_ART.md`.
