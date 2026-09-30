# Visual driving and complete foreground exits

The owner requested fewer words during play and asked to see passed cars and
road objects continue off screen. This is a presentation pass on merged #160
(`a176163110f08988bc5f0425815d5fb6cb2e21e4`), which remains the rollback.

## Live presentation

The mission strip shows the original cassette, actual song-route progress,
three act milestones, delivery flag and four optional-record lights. An
upcoming action shows its four-lane target, actual mapped button and ONE
ring. The dashboard keeps short action/beat labels and shows a steering arrow
when the driver is in the wrong lane; the tire target carries the button
itself. The optional record sign uses cassette/lane/hold graphics.

The final approach shows two numbered diagrams: send Echo in the leftmost
lane, then take the original to the far-right exit. Brief distinct outcomes
remain for perfect/good, early/late, wrong button/lane and missed presses.
Musical receipts use lane glyphs with entry/hold/exit symbols and duration
lights. A newer loss cannot be mislabeled as the reward for a prior success.
Longer ability, timing, mission and record explanations remain in Pause.

## Foreground visibility

Previously ordinary traffic stopped drawing at its contact address while
still visibly above the bottom edge. Road depth also stopped growing at 1.
Some roadside categories used still earlier category-specific near cutoffs.
The forward projection now continues beyond the frame, with conservative
whole-artwork bounds and bounded distance/depth ranges. Passed scenery keeps
its actual world socket, while inner-lane cars can leave below the screen.
Near traffic is drawn after Cache using the current projected car depth, so
steering behind a passed vehicle cannot paint Cache over its roof. Reaction
fades remain authored reaction effects; collecting a pickup remains
an intentional removal. The exact rearview `blur(2.3px)` is preserved.

No encounter layout, traffic count, collision timing, input judgment, ability,
save/reward or music rule changes. Fresh version 2 and saved version 1 retain
their existing rules. The previous tuning limitation around rare simultaneous
four-part peaks at higher fixed-gear difficulty remains unchanged.

## Review and deployment

`review-cache-visual-drive/` contains compact native production-renderer UI
stills and a foreground motion sequence with source hashes. Staged camera/UI
fixtures are labeled separately from any actual input-driven race frame.
These inspect rendering, not human driving or physical-controller feel.
Focused checks cover visibility beyond the old cutoff, complete exit,
finite/bounded projection, control labels, brief feedback and exit diagrams.
Full regression includes the existing 26 complete input-driven races.

Final local, CI, exact tested tree and merge results belong to the PR and the
source pack validation receipt. Normal Makko import/reload plus the exact
focused device checks are in the newest section of `ACCEPTANCE.md`. No Makko
or physical-device acceptance is implied by native/automated output.
