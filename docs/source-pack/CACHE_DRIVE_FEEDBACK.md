# Cache Line — drive feedback and reactive arrangement

The owner's nine-point playable-game review follows merged #159. This pass
changes fresh runs to encounter version 2 while preserving saved version 1
charts, health/recovery tuning, timing and music behavior. Base/rollback:
`8f0f435c3edb7ddbd13373e7ba0a95c84f0c6f95`.

## What the player should understand

Deliver Cache's protected original: survive the 100-bar route, send Echo on
the left at the final split, and take the original through the far-right exit.
The four cassette pickups are optional written archive records. Holding the
marked lane for 650 ms collects one; they do not supply music or determine
whether delivery succeeds. The persistent compact objective follows the
route; contextual lessons introduce the next usable mechanic. Pause contains
a visual control reference and the existing archive.

The four musical lanes and the four face-button actions are separate:
catching a pad brings that pad's **lane** into the song and grants its named
**action**. Labels follow the connected controller family or keyboard.

| Action | Keyboard | Xbox | PlayStation | Badge | Existing effect |
| --- | --- | --- | --- | --- | --- |
| Surge | K | A | Cross | Green chevron | Speed burst on next ONE |
| Push | L | B | Circle | Coral hexagon | Clear one contact during its 3.75 s window |
| Brace | J | X | Square | Cyan shield | Absorb one impact |
| Refill | I | Y | Triangle | Gold square | +40 Echo charge; fast gear also readies Turbo |
| Turbo | Space | LB | L1 | Violet pill | Launch on next ONE when ready |
| Echo | H | RB | R1 | Mint pill | Send a replay using 100 charge |

Six SVG masters and matching pure Canvas geometry make prompts immediate,
with no network/image-loading dependency. Color, silhouette and mapped label
all identify the button. Badge ink on the road remains projected and is
occluded by traffic; the stationary target sits beneath the rear tires.

## One timing contract

The source transport remains authoritative. Inputs use the audible/output
clock and configured calibration exactly once. Announced target beats and
world addresses never move after gear changes. The count-in leads through
2, 3, 4, ONE. The PRESS cue is active throughout the same accepted window as
judgment, including its early half. Version 2 accepts ±180 ms with ±70 ms
perfect; version 1 retains ±130/70 ms. A sub-microsecond numerical tolerance
applies only to the new rule's exact boundaries. The protected transport
digest is refreshed for that conditional comparison only; all original
AudioSystem synchronization method hashes and the Level 1 profile stay exact.

Success has a clear PERFECT/ON BEAT receipt. Missed attempts explain early,
late, wrong button or wrong lane; unattempted pads expire once as MISSED.
These receipts add no second damage penalty, consume no successful award and
do not prevent correcting an early/wrong press inside the valid window.
Early accepted awards remain queued until their actual ONE. Receipt clocks,
miss markers and presentation state are transient and never become save data.

## Traffic, road grounding and speed

Version 2 replaces long whole-act traffic exclusions with local reservations:
known musical targets, locked pursuit contacts and their escape lanes are
protected. Convoy formations hold for four song bars, giving two verse
pad opportunities to reach an outer lane before its opening changes. Rows
occupy at most two lanes, leave an adjacent escape corridor,
and preserve an intersecting free corridor from the prior row. Near upcoming
rival contacts, the authored wave times and allowed speed range reserve a
local one-edge traffic corridor, leaving room for the rival, pad and escape.
This avoids cancelling attacks without emptying whole pursuit acts. The opening
and final split stay clear. Existing version 1 chart scheduling is retained.

Relaxed uses fewer rows and longer recovery; Standard supplies regular
traffic; Overclocked adds tighter rows and more two-actor encounters as speed
allows. This affects physical driving pressure, not the musical timing window.
Complete races exercise all nine combinations plus intentional damage,
missed actions, early/late timing, shifting, Push and exit retry.

Misleading upright lane studs become flat road-plane reflectors, and redundant
procedural shoulder poles are removed. A reproduced floating green end-cap
was traced to the transparent bitmap's edge rather than the actual facade
socket. The end-cap now uses the facade's projected roadside anchor. Speed
adds bounded ground glints at the road's outer edges; Reduced Motion holds
the pattern static. The approved horizon, city geometry, street lights,
building clearance and exact `blur(2.3px)` rearview remain intact.

## Music that answers the player

Version 2 captures last three bars initially and six bars for a connected
sequence. These are deliberately short enough to release between sections,
while allowing brief full-arrangement peaks during accurate chorus play.
Actual joins, extensions and losses produce named part receipts. Quiet Drive
and Flow beds remain at 0.03 and 0.045; full levels stay 0.19 and 0.55.
Breakaway/Undercurrent still enter from silence at 0.50/0.62. Pressure stays
0.60. The 110 ms attack and 300 ms release expose the transition without a
new playback start. All five original recordings and common playheads remain
unchanged. There is no newly supplied vocal recording.

A version 2 collision removes one live earned part and keeps the drum/support
bed running. The old whole-music-bus stumble mute is skipped for this version.
Queued earned awards survive, and the next capture rebuilds the arrangement.
Legacy captures remain 8/16 bars, with their original support levels and ramps.

## Evidence and limits

The checks exercise production transport, chart, input, shared update,
collision, save and mix code. Controlled races do not write health,
invulnerability, position, captures or score to force success. Native stills
use actual production rendering with disclosed presentation fixtures. The
browser audio check renders a production-event catch/extend/expiry/crash
sequence through a real AudioContext using the five supplied recordings.
Final run counts/results, tested head and both CI outcomes belong to the PR
and exported test receipt; they are not inferred from an earlier revision.

`review-cache-drive-feedback` contains the current visual evidence and a
56.25-second native music-only audition. Its trace applies the production
linear gain ramps to all five decoded recordings from their common origin;
this listening aid does not claim a physical audio-device test. Browser
CI retains the reactive music WAV and event/target trace in its driving review
artifact. These prove implementation behavior, not Makko/controller/audio
latency acceptance. Follow the exact import/reload and focused evidence route
at the top of `ACCEPTANCE.md`. A future skill tree, upgrades and new power-up
economy need a separate design pass; this pass makes the existing abilities
learnable and measures their recovery effect first.

## Measured final race study

All 26 controlled 100-bar races clear with identical production/harness
hashes before and after the study. This includes all nine gear/difficulty
pairs and nine actual-damage recovery runs. Each recovery loses exactly one
live part and captures another within 0.86–3.08 seconds. Practiced runs
produce 42–64 actual part entrances/exits and one to three Echo deceptions;
all four parts join and leave in every practiced gear/difficulty pair. The
drum target stays 0.60 across all 26 runs.

Civilian passes in the practiced runs are 18–19 on Relaxed, 60 on Standard,
and 90–137 on Overclocked. The higher range reflects gear-dependent spacing
and earned speed effects. Complete timing probes reject all actual presses
outside the new window; focused checks separately cover exact ±180 ms edges.

Four-part simultaneous peaks remain rare: the fixed-gear studies reached
four parts in Relaxed and Standard gear 1, while Standard gears 2/3 and
Overclocked peaked at three. All four individual parts still react repeatedly.
This is an explicit tuning limitation for a future skills/arrangement pass,
not evidence of a permanent full mix or an implemented additional vocal.
See the complete `review-cache-drive-feedback/full-race-balance` report for
per-run measurements. Full regression/Chromium outcomes remain in the PR and
exported receipt, and Makko/controller feel requires the acceptance route.
