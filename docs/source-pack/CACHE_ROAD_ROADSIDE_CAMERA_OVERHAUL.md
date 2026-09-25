# Cache Road roadside camera overhaul — September 25, 2026

Base and rollback: merged #126, `a5ba87433809de73a6027ec2eac50de040b8b71d`.
The owner rejected its visual result. The two supplied screenshots show a
parked traffic car detached from any legible lot, a small park along the
city's bottom edge, and empty ground between the road and far sites. The
previous native checks proved that draw calls occurred; they did not prove
that the composition worked during a drive.

## Camera and place rules

- The road center, sidewalk, streetlights, filler and individual sites still
  use the same world-progress centerline. There is one site row, with ten
  types appearing in twenty sites per lap. Buildings remain outside the
  outer sidewalk, with road-facing fronts.
- Site width is now proportional to the *same depth* that widens the road.
  The second late-arrival easing multiplier is gone. A building grows at a
  steady rate through distant, middle and near stages, then exits the screen.
- The painted foreground city ends at screen-world y=425. Distant site feet
  sit behind this crest; roofs enter first. A continuous clip reveals the
  lower facade and parcel as it approaches, and clears entirely by depth
  0.54. Site scale does not accelerate during this reveal.
- The three city paintings use one bounded camera bearing derived from the
  road's path and tangent, at 0.22, 0.50 and 0.85 parallax ratios. They have
  fixed overscan and no modulo tile scroll. Reduced Motion fixes their pan.
- The parking lot keeps its curved projected paving, bays, fence and sign.
  Its three parked copies of active traffic have been removed; the owner
  correctly read them as stray cars off the road. The park now uses its whole
  painted oblique scene at the same site depth as the buildings, facing its
  entrance toward the road, instead of scattered cropped foliage.

No music, controls, traffic collision positions, lane actions, saves or
campaign awards changed. The five owner MP3s and the separate adrenaline
and power-up backlog remain in `CACHE_ROAD_COHESION_AUDIT.md`.

## Visual inspection and limits

The production Canvas renderer was sampled at fourteen road distances in
the opening lap and fourteen in the third lap, including buildings, the
parking lot, park and bends. A continuous 32-second production draw covered
the first lap at fifteen frames per second. Review frames:

- `review-cache-roadside-camera/opening.webp` — market/house size and setback
- `review-cache-roadside-camera/park.webp` — open lot and complete park
- `review-cache-roadside-camera/later-bend.webp` — mixed site types and traffic
- `review-cache-roadside-camera/third-lap.webp` — reversed side sequence

The focused production test checks a three-stage roof reveal, steady growth,
visible sidewalk clearance, facing, a whole park, absence of parking cars,
and city parallax sharing one camera bearing. The full suite and syntax gate
belong to the exact revision receipt. These draws are visual evidence from
the actual road renderer, not a Makko capture, human drive, audio listening
verdict, or owner acceptance. The park's painted slab and sparse outer
landscape are still visual judgments for a normal-size Makko drive; the
source art itself was not repainted in this correction.

## Next review

At normal speed, follow a far roof at the city crest until its facade clears
and the location exits the side of the frame. Watch the whole park and the
empty parking lot through a bend, and check that no car appears outside the
road. Repeat in a later district and with Reduced Motion. If a site still
looks like a detached island, record its road position and frame. The next
visual step would be purpose-painted ground/approach art for that specific
site, measured against the actual curved road, before any more random props.
