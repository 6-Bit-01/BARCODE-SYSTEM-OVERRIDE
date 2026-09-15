# Restore original flying cars and fit the selected thin barrier rails

The last rebuild changed the flying cars’ size, speed, altitude and spawning, and its detached emitter boxes did not follow the wall footprint. The owner selected the first thin continuous rail concept and approved correcting the full eight-issue pass.

This draft restores the original foreground car creator and movement from `6e3751b`, including its art, size, speed, height range, direction, bob and spawn cadence. Advance warnings and swept damage operate on those same cars. Pause freezes the approach; hack protection consumes contact harmlessly while cars keep moving. No new ground lanes or substitute car drawings.

Four new transparent hardware assets form continuous facade rails, pavement tracks, elbows and caps. They follow all four gate footprints, with local pressure/passage effects and power-down. Roof highlights are one muted screen pixel; the 3D utility props, foot masks, text-free heart repairs, centered sidewalk and working cutscene controls are retained.

Contact separation respects roof boundaries and protected recovery. Firewall walk/idle is chosen after edge clamping, avoiding repeated animation restarts. The illustrated rooftop drone’s warning and muzzle now share the shot vector, with roof interception. Objectives show the current action and remain visible above the hack keypad. Every input gets the same 16-second answer budget; practice answer entry is untimed.

## Validation

- `npm test` and `npm run check:syntax:all` passed locally.
- 80 seeded comparisons execute archived original traffic alongside the new owner: matching geometry, motion and animation clocks.
- 30/60/120 FPS checks cover approach/pause, swept contact/protection, roof-bound contact and both keypad practice puzzles. All 75 existing climb checks pass.
- Twelve native stills and a 16-second clip exercise production drawing and actors with host image/sprite adapters. The clip scripts one original car at a valid original altitude to show contact; it does not alter production spawning. Native evidence does not certify hosted audio/controller feel.
- Full regression coverage retains twenty mission defeats, sixteen-hit Jammer, eight-second hijack, single jump, audio ownership and boss/retry. Static fixtures were updated for moving hitboxes, Canvas transforms, current objective text and the approved answer deadline.

One draft against merged #57 (`f048d229a51b9ecce801cd9d736613491c4ae2f9`). Do not merge before owner Makko acceptance. The exact published revision, CI results and source-pack receipt identify the review build.

## Makko review

Import the exact draft head into a fresh preview. Check all four facade-to-road rails, pressure/passage/opening, original cars in both directions and protected contact, Firewall turns/crowds, stomps and hijack expiry, roof routes/edges/feet, repairs, both puzzles with controller/pointer, cutscene controls and Objectives. Finish the twenty-defeat mission, Jammer, boss win/loss/retry and restart with audio. Record imported SHA, PASS/FAIL and short clips. After acceptance and merge, import the actual new main merge SHA into a fresh preview and repeat.

Detailed scope: `docs/source-pack/THIN_RAIL_TRAFFIC_CORRECTION.md`. Native comparison: `docs/source-pack/verification/thin-rails-original-traffic.webp`.
