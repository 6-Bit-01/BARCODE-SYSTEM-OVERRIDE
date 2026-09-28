# Market family: production fit checkpoint

September 27, 2026. The first non-workshop family is integrated into the
playable `CacheRoadProof.draw` landscape at selected district addresses. This
is an art-fitting checkpoint before authoring five more families, not an
owner-approved full-route city pass.

## Contract and implementation

| Unit | Source size | Contact `(u, y)` | Front socket | Role |
| --- | ---: | ---: | ---: | --- |
| `block-market-L-rear` | 1942 × 809 | `.86, 571` | none | Outer roof run behind the nearer terrain |
| `block-market-L-middle` | 1944 × 809 | `.77, 633` | none | Connected occupied middle row |
| `block-market-L-front-gap` | 1944 × 809 | `.68, 615` | solid ends near `u=.72`; roadward end empty | Frontage only when a left local street exists |
| `block-market-L-front-fill` | 1944 × 809 | `.86, 655` | occupied | Frontage when the graph has no street |
| `block-market-R-rear` | 1942 × 809 | `.14, 586` | none | Opposite bank roof run |
| `block-market-R-middle` | 1945 × 809 | `.23, 673` | none | Opposite bank middle row |
| `block-market-R-front-gap` | 1942 × 809 | `.32, 559` | empty to `u=.28`; solid beyond | Frontage only when a right local street exists |
| `block-market-R-front-fill` | 1942 × 809 | `.14, 570` | occupied | Opposite bank closed street socket |

PNG source and transparent WebP runtime exports live in
`assets/cache-road/world/blocks/sources/` and `assets/cache-road/world/blocks/`.
The left cards descend toward the left outer bank; right cards descend toward
the right. The art has no baked oval lot. The renderer projects the authored
street edge to the graph's `radial=250` mouth and projects each contact point
onto the same sampled terrain as the road. Nearer terrain strips mask the
foundation. The gap is chosen only by the connected road graph; closed
frontage never creates a fake local street. The existing six setting accents
can still occupy legal deeper graph parcels.

The family appears on left addresses 300–899 and right addresses 700–1799
in this first fit, so the real protected-site route exercises both banks,
both openings and closed frontages. These fixed trial windows are not the
final six-family district selector. The shared local road material at
`assets/cache-road/world/materials/wet-local-street.webp` is sampled
by world address only inside its projected graph street and sidewalk throat.
It does not replace the established rolling bank grain.

## Verification

- `node tools/check-cache-road-block-art.cjs` decodes all eight source PNGs
  and optimized WebPs, checks dimensions, lower contact within 35 source
  pixels of the declared anchor, correct bank slope, truly transparent open
  socket on the road-facing fifth and an occupied filled socket.
- `npm run check:cache-road-proof` checks actual protected-site placement,
  open street graph ownership and the local material's projected draws.
- `npm run check:presentation-assets` checks preload and local fallback for
  all nine new runtime images.
- The [24-second actual renderer drive](review-cache-market-family/Cache-Road-Curved-Roadside-Drive.mp4)
  covers approach, pass and exit at 15 fps. Six stills and motion track are
  beside it. Seed 17 was separately inspected at progress 450, 800, 1050,
  1500 and 1700. This is a scripted Canvas draw review, not a gameplay
  frame-rate or Makko import measurement.

## Follow-up status

The image units fit the stated alpha/contact/socket contract and are in the
working renderer. The eight sided sidewalk, curb, sidewall and end-cap join
cutouts arrived with the homes checkpoint. They are drawn at graph mouths,
and the wet street is now mapped as two triangles so tapered quads do not
leave an uncovered wedge. These joins still need the entire route and hosted
Makko review; the fixed trial windows are not a six-family selector. See
`CACHE_ROAD_HOMES_SECOND_FAMILY.md` for the latest contact and motion gate.
