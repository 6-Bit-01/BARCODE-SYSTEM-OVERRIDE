# Elevator clearance, rooftop exit and returning Studio Rat

Base/rollback: merged PR #69, `3554b0a326572b86f17a66300aa5ae9d122cd9c3`. Branch: `agent/lift-clearance-context-prompt`. The owner reports that the merged cabin is cramped, its label stays over the scene, its floor stops below the rooftop, the Studio Rat is missing, and a platform covers the tower drone. The merge and earlier passing checks do not establish acceptance of those details. This combined follow-up implements all five corrections and the requested sparse, obvious head contact.

## Playable changes

- The existing cabin grows from 196×258 to 280×432, around the same center x=2506. Its floor rises from y=856 to the actual Firewall rooftop at y=59, rather than the canopy at y=358. Two beats still power it. Static roof support wins at the aligned stop, allowing a straight walk left onto the rooftop without a jump; the unoccupied lift then returns. Its one fixed drive strip spans the entire longer route.
- The permanent world label is removed. An altitude-aware approach shows a screen-space RHYTHM LIFT prompt for 2.4 seconds including a 0.5-second fade. Remaining aboard does not repeat it. Leaving for 1.2 seconds rearms a later approach.
- Only the visible cabin roof receives upward head contact. Its inset underside matches the existing illustration. The probe follows the opaque cap in the actual jump animation, excluding hands, padding and post edges. Contact ends upward motion with a brief spark and quiet existing cue, without damage, stun or horizontal knockback. Roof landings and moving-roof support also work. The climb-through awnings retain their established behavior; no invisible general ceiling planes are added.
- Studio Rat chooses one of six supported perches on each fresh Level 1 run: Signal awning, Cache awning, Firewall canopy, Relay roof, Tower roof or Broadcast awning. Checkpoint retry retains the selected perch and whether its event was consumed. Existing saved discovery no longer hides it. Each run allows one event, while durable discovery/reward credit remains once per level. Later levels still need their genre-specific encounters; this change does not claim those unbuilt levels are playable.
- The actual encounter-4 drone spawns at x=3660 and patrols x=3625–3695, beyond the overhead steps. Its body and descending stomp approach stay clear. The climbing platforms retain their route geometry.
- Cliff's note moves to x=2300, beside the wider cabin. The nearest safe Jammer candidate shifts to x=1940 so the wider cabin remains outside the full attack margin; five central candidates remain.

No new art, asset ancestor, dependency, input binding, audio clock or update/render owner is introduced. The existing cabin, cat and drone artwork is reused. Animation crown samples are measured from the already approved prepared jump frames.

## Verification

`tools/check-level-finale.js` runs production movement and animation at 30/60/120 Hz, both facings, inside/edge/outside jumps, moving and returning cabin contact, a full ascent and real grounded walk-off, roof landing/carry, prompt timing, altitude and pause/reset. It also exercises every random cat perch with prior save credit, inspection, event consumption, checkpoint resume and fresh runs, plus actual mission-drone patrol and descending stomps at both endpoints.

`check-level-01-impact`, `check-level-01-gameplay-dynamics` and `check-level1-rebuild` retain the discovery transaction, lift lifecycle and 63 established traversal jumps. The full `npm test` and `npm run check:syntax:all` results and exact tested revision belong to the generated validation receipt.

Baseline inventory regeneration is intentional only for source-line metadata shifted by the scoped additions. Script order, manifests, dependencies and baseline exceptions must not change.

Native review is generated with `LIFT_CLEARANCE_REVIEW=1 node tools/render-level1-rebuild.cjs OUTPUT`. It uses production draw/update owners and original sprites with adapted host image/sprite services. See `verification/lift-clearance-review.mp4`, the `lift-*.webp` stills, `drone-open-stomp-lane.webp` and `studio-rat-random-*.webp`. This is native rendered evidence, not a hosted Makko or physical-controller acceptance claim.

## Post-merge deployment and focused owner check

After the owner accepts and merges this PR, sync Makko to the resulting `main` revision using the existing project import/deploy flow, publish that revision, and reload the deployed game. Do not report deployment until that step has actually completed. The maintained source pack must then be refreshed from the exact merged revision.

1. Approach the elevator at street height. Capture the roomy cabin and brief HUD prompt, then remain nearby for three seconds to show that the text clears.
2. Jump inside once, then alongside each post. Capture the cap meeting the visible roof with a small spark, no health loss/stun, and unobstructed jumps outside it. Check an existing awning ascent too.
3. Power with two beats, ride to the upper stop and walk left onto the actual rooftop without jumping. Record the aligned floor, successful exit and lift returning while 6 Bit stays on the roof. Repeat after pause/resume.
4. Reach encounter 4. Record the drone beyond the gray steps and stomp it from the open air above; verify normal rebound and defeat credit.
5. With an existing Studio Rat discovery save, start fresh runs and search the six listed perches. Record its visible return and two differing placements; repeated random draws can legitimately choose the same spot. Inspect once, retry a checkpoint, then start a fresh run: retry must not replay the event, and the fresh run must restore it without duplicate permanent credit.

For any failure, retain the deployed revision, browser/controller, location and a short clip including the lead-in. Owner Makko acceptance remains pending; this PR stays a draft until reviewed.
