# Dynamic speed camera and corrected wind

## Owner direction — October 1, 2026

The owner rejects PR #165's broad curling wind and requests stronger camera
extremes: slow driving shows the full view; acceleration and fast driving
tighten it around the car, with zoom breathing, wobble and short shake bursts.
Button destinations must remain readable, and cropped traffic must be announced.
Base/rollback is merged PR #165, `1ba468d3d3f4947e776758f0de05d8095fc51277`.
The cutscene correction from that PR remains intact.

## Presentation contract

The camera reads actual speed and the existing bar's gear transition. It adds
no simulation, clock, saved state or frame owner. Its slow-speed scale is 1;
fast driving approaches 1.24–1.26; Turbo approaches 1.29–1.335. The hard
maximum is 1.335. Existing acceleration smoothing drives the aperture;
opposite gear changes add opposite short pressure offsets. A broad slow zoom
cycle and bounded steering roll/translation add movement between events.
Pass and collision feedback remain brief and bounded. This does not claim
owner approval of comfort, appearance or frame pacing.

Zoom pivots around the existing rear-tire timing line rather than the middle
of the road. The car, paint and traffic share one transform. All four lane
destinations fit below the HUD across the tested camera envelope; the HUD and
exact rearview `blur(2.3px)` remain outside that transform. Existing HUD lane,
button and beat-ONE readouts remain available during every zoom state.

For a collidable actor within 240 world units ahead and at most 8 units behind
the player, transformed full-body bounds detect cropping. A small car/arrow
marker points toward its screen edge. The nearest cropped actor per lane is
shown, with overlapping edge markers suppressed; all threatened lanes remain
identified by amber triangles in the existing four-lane HUD. Scenery, distant
traffic, invisible/non-collidable actors and already-passed cars get no alert.
Pursuit actors use the same check. A cropped ready button destination receives
its actual button shape at the edge; a visible destination gets no duplicate.
Warnings report existing geometry and never move encounters or change judgment.

`wind-streak-atlas-v2.png` replaces the live curling atlas. Its original RGBA
output retains transparency: five live thin, straight tapered streak clusters
stream down/out at the periphery; the quieter sixth cell remains reserved.
There is no stationary corner flare or full-screen pressure wash. Six clusters
and at most one passing cluster draw per frame, using the existing image cache.
The original PR #165 artwork remains in Git as rejected historical art.

Reduced Motion or Flashes Off removes the new moving camera and wind. Runtime
pause freezes the existing clock; no presentation timer continues independently.
Actual speed, gear/road integration, beat timing, encounters, collision/damage,
abilities, arrangement, saves, rewards and complete foreground exits remain.

## Evidence and acceptance

Production helper checks cover 60 effect states, the slow/fast/Turbo aperture,
opposite shift pressure, wobble/breathing, all four crop directions, independent
lane warning budgets and 720 speed/time/steer camera combinations with all four
button destinations inside the aperture. Existing complete races and regression
checks remain required. Exact final head, CI and exits belong in the receipt.

`review-dynamic-speed-camera/` contains a scripted production-painter sweep,
not a Makko recording or playtest. It explicitly stages slow → fast/Turbo →
slow and pass/hit feedback. It does not prove earning, hosted FPS or comfort.
The owner must assess motion comfort, warning clarity, actual controls/audio,
art delivery and frame pacing in Makko. PR #165's tests and earlier partial
owner acceptance remain historical evidence for their original revisions.
