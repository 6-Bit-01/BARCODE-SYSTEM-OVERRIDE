# Cache Road roadside camera and crest correction — September 25, 2026

Base and rollback: merged #126, `a5ba87433809de73a6027ec2eac50de040b8b71d`.
The owner rejected its visual result. The two supplied screenshots show a
parked traffic car detached from any legible lot, a small park along the
city's bottom edge, and empty ground between the road and far sites. The
previous native checks proved that draw calls occurred; they did not prove
that the composition worked during a drive.

The owner then reviewed draft #127 and showed five more game frames plus a
red diagonal path. The first revision's horizontal clip exposed a building's
lower pixels while its parcel stayed visually disconnected. The correction
below replaces that horizontal reveal and varies each site's road setback.

## Camera and place rules

- The road center, sidewalk, streetlights, filler and individual sites still
  use the same world-progress centerline. There is one site row, with ten
  types appearing in twenty sites per lap. Buildings remain outside the
  outer sidewalk, with road-facing fronts.
- Site width is now proportional to the *same depth* that widens the road.
  The second late-arrival easing multiplier is gone. A building grows at a
  steady rate through distant, middle and near stages, then exits the screen.
- The painted foreground city ends at screen-world y=425. Distant site feet
  travel behind a **curved** ground crest that recedes toward either screen
  edge. The same crest masks the complete painted site, its projected parcel,
  open parking lot and small filler. The top emerges first; the footing and
  ground clear as the site moves outward along the road's world path. There
  is no independent horizontal ground wipe, ground reveal fade or late size
  acceleration. A near-site clip ends after the footing has nearly cleared.
- Each site gets a seeded lateral setback of 18–198 projected world units.
  The building and its parcel move outward together; the open lot's outer
  bays stretch outward while its entrance remains near the sidewalk. This
  creates near and deep addresses on each side without moving any footprint
  onto the walkway. Low landscape filler also varies its setback.
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
the opening lap, fifteen additional steps through the first reveal, and
fourteen in the third lap. A continuous 32-second production draw covered
the first lap at fifteen frames per second. Review frames:

- `review-cache-roadside-camera/opening.webp` — early roof emergence
- `review-cache-roadside-camera/park.webp` — open lot and complete park
- `review-cache-roadside-camera/later-bend.webp` — mixed site types and traffic
- `review-cache-roadside-camera/third-lap.webp` — reversed side sequence
- `review-cache-roadside-camera/horizon-sequence.webp` — four successive
  right-side frames from roof through fully revealed, near-side facade

The focused production test checks a three-stage roof reveal, a curved mask,
steady growth, varied sidewalk clearance, facing, a whole park, absence of
parking cars, no cut-to-clear footing jump, and city parallax sharing one
camera bearing. The full suite and syntax gate belong to the exact revision
receipt. These draws are visual evidence from
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
