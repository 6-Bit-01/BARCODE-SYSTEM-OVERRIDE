# Timing under Cache and the sweeper's doubled edges

Base: merged #145, `9090c2d7a8a36d6ff1f2d53e56a4dd125dc1a4fa`.
The owner correctly identified that the previous repair moved the press
target ahead of the car. Its small temporary brackets did not establish
where passing pads should be judged. The owner also found the sweeper
still looked like overlapping animation images.

## Timing line

- The note center meets the rear tire contact on beat four. That depth is
  calculated from the same car size, tire contact and road projection used
  to draw Cache; the camera and car position are retained.
- A permanent thin line spans four lanes. End brackets stay visible around
  the opaque car, including between actions. The upcoming lane brightens
  through its buildup, warms for the press window and flashes on a catch.
- The road pad passes beneath the car. The HUD keeps its button and
  countdown visible while the body covers the pad. Opening guidance and
  the shoulder label point to the line under the rear tires.
- Phrase paint shares the new contact depth. Every announced target is
  still beat four; speed changes, calibration and response scheduling keep
  the behavior verified in #145. No audio or input windows changed.

## Sweeper

The source atlas contains one complete vehicle per cel. The old renderer
drew that cel three times: two stationary wheel masks and a translated,
rotated chassis with matching holes. The painted wheel silhouettes change
across cels, so those fixed masks left doubled tire edges during a turn.
A separate generated ellipse also floated above the painted roof lamps.

The sweeper now uses one complete atlas draw. Wheels, brush, body and
painted beacons move together. The existing smooth merge, light animation
and small suspension movement remain; the extra roof ellipse is removed.
Other vehicles and the pedestrian travel correction are retained.

## Evidence

- [Before: split sweeper](review-cache-car-strike/Sweeper-Before.webp)
- [After: complete sweeper](review-cache-car-strike/Sweeper-After.webp)
- [Production drive with audio](review-cache-car-strike/Drive-Review.mp4)
- [Car timing-line preview](review-cache-car-strike/Drive-Preview.webp)

`tools/render-cache-sweeper.cjs` loads the actual atlas through production
`PresentationAssets.draw`, exposes the production vehicle draw and removes
Makko from its environment. It reproduces three atlas draws per old frame
and one per corrected frame. The boards show the first four cels turning
left and the last four turning right.

The drive uses ordinary steering and timed presses through production
update/draw, at 24 fps. Its unchanged event trace permits the exact Chromium
audio replay from #145 to accompany the corrected visuals. The source
audio checks and trace remain in `review-cache-motion-rhythm/`.
Focused checks assert the car-relative strike depth at six speeds and
multiple song phases, the permanent marker during action gaps and the
single sweeper draw. Local full regression and all-file syntax checks pass;
hosted browser CI remains the final merge gate. These controlled renders do not establish Makko device
performance or replace the owner's controller/audio feel review.

## Engine assessment

These defects reproduce in our Canvas renderer without Makko. Cache Road's
road projection, vehicle compositing and hit timing are owned by this
repository; `src/core/loop.js` calls its update/draw directly, and
`PresentationAssets.draw` uses Canvas `drawImage` for these sheets. Makko's
asset delivery and canvas context guard have required integration work, but
neither caused the two defects corrected here.

A full engine rewrite is not warranted by this evidence. A future
standalone host could reuse the game's renderer, audio, controls and assets
if host-specific restrictions justify that work. No migration is started
by this repair. Rollback: revert to the base above, with the owner's rejected
timing offset and sweeper split explicitly recorded as known issues.
