# Cache Road — buffered gears and grounded scenery

September 29, 2026. Supersedes the direct throttle/brake and musical-only pad
projection from the earlier pulse repairs. The existing renderer, music,
controller mapping, campaign handoff and version-4 checkpoints remain.

## Recovered decision and actual fault

The earlier September 29 discussion first proposed a 145-before/30-after
catch strip around a fixed road address at 128 BPM (PR #138). The later
discussion assigned immutable fourth-beat targets (PR #145), then put the
hit line under the rear tires (PR #146). Conversation retrieval supplied
excerpts, not a complete transcript or a conversation URL.

Neither implementation committed road displacement to that musical target.
PR #147 still moved paint at 22 world units per beat while integrating the
road independently from instantaneous speed. Formula tests could pass while
the paint visibly slid across the road. The owner now explicitly proposed
buffering gear changes and launching on a musical section boundary.

## Driving contract

- Tap Up/Down to queue one of three persistent gears: 30, 52 or 70 road
  units/second. Holding a direction does not repeatedly shift. Opposite
  input can cancel a queued change. Releasing does not reset the gear.
- The next downbeat commits a four-beat road section. Acceleration blends
  over its first 0.75 beat, using an analytic integral of a smooth velocity
  curve. The Web Audio transport is the time authority; RAF deltas do not
  accumulate road distance.
- An authored encounter selects its lane/action and sequence. Before its
  section's countdown, its painted world address is fixed to the position
  the car will occupy on beat four, plus the rear-tire contact offset.
  Once announced, neither its address nor its deadline changes.
- Pad distance is literally `padWorldAddress - roadProgress`. Lane studs,
  obstacles, scenery and pad displacement share the same progress. Gear,
  Turbo, Surge and recovery requests cannot change a committed section.
- Inputs arriving on or after a downbeat target the following downbeat;
  a delayed render cannot apply them retroactively. An early caught Surge
  is resolved before planning the following section, even across a dropped
  frame. Early accepted confirmation still waits for the exact target beat.
- The HUD previews the next lane/action without guessing its arrival time.
  When the road section commits, the local 1–2–3–4 count and permanent
  rear-tire brackets take over. Future uncommitted phrase tiles are not drawn.
- The whole car loads backward after the fourth-beat window, launches
  forward on one and settles before three. It is stationary on the hit
  plane throughout the accepted fourth-beat window. Turning poses retain
  the same rear-axle midpoint. Reduced Motion suppresses the shift animation.
- Turbo queues a complete fast bar; Surge queues the next bar. Collisions
  keep their immediate visual/audio/integrity/time penalties and queue a
  slow recovery bar, instead of moving an already announced target.

The final rival phase follows verse four. The exit is placed 150 units ahead
in the final chorus, reachable with the six-second Echo even in first gear.
Opening the exit and reaching the song end clears the run; a hidden distance
quota no longer defeats a slow driver. Scenery, traffic and encounters extend
through 15,000 units so high gears do not leave the inhabited route.

## Scenery and animation

The old renderer combined a shallow city horizon with a second crest up to
420 pixels lower, a buried card offset, and separate leg/foundation clipping.
Those contradictory burial/reveal transforms are removed. Foundation and
foot positions now remain on the projected terrain throughout approach.
The skyline roofline rises by 80 pixels by scaling around its original
grounded foot, preserving aspect ratios and avoiding a floating lower edge.

The painter sorts actual projected ground contacts. Wide building cards use
their fitted front foundation, rather than just their nominal road address.
People, street furniture, large service lamps, parapets, street-wall ends,
parking signs and posts all enter that queue. Terrain is painted first;
transparent building sockets still reveal anything behind their opening.
Featured-site repetition spacing also accounts for the newly visible distance.

Passers-by now use the existing independently authored walking views. Local
standing/seated activities remain still. Removing the actor horizon mask
exposes complete footfalls. Horizontal travellers still head outward toward
their nearest edge; front/back walkers keep their authored facing. Player
cel playback uses elapsed time rather than slowing with the selected gear.
The sweeper retains one complete cel per frame, without split wheel ghosts.

## Verification and review

- `check-cache-road-drive.cjs`: 70,400 physical displacement comparisons,
  21 exact fourth-beat arrivals across changing gears, boundary inputs,
  pause/resume, 24/30/60/120 Hz invariance and full-song finishes in all gears.
- Legacy isolated traffic fixtures explicitly re-anchor their audio trajectory
  when teleporting to an encounter. Continuous driving tests use unmodified
  production updates. Obsolete tests requiring buried buildings and sliding
  musical paint have been replaced with grounding and physical-arrival checks.
- Native Canvas review: 32 seconds of mapped steering/actions, repeated gear
  changes, Echo and Turbo; seven catches and full integrity. The review audio
  is rendered from its recorded events and five original MP3s by production
  Web Audio code in Chromium.
- Browser checks exercise the production world renderer and all three gears,
  compare animation cels, verify live pedestrian frame selection, and compare
  ten published sweeper/travel sheets byte-for-byte with bundled assets.

Review media lives in `review-cache-gears-grounding/`. Browser audio, driving
measurements and screenshots are retained in the matching CI artifact.
Native and headless checks are not acceptance of Makko device frame rate,
controller latency or the owner's subjective timing feel.
