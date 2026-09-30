# Cache Line encounters, reactions and final pursuit

The owner approved the encounter layout, physical ability reactions, final
pursuit, more assets and complete races in every gear. This pass starts from
merged #156, `8a6b974e809e907e97a364fcb328693be3764ac6`, on
`agent/cache-encounter-pursuit`. That commit is the base/rollback. The PR and
generated source-pack receipt identify the exact final candidate, validation
runs and eventual merge; this document does not substitute an earlier pass's
CI result for the current code.

## Driving layout

The road follows the existing 100-bar, 128 BPM song. Zero-based bar indices
match production state and test evidence.

| Bars | Section | Playable purpose |
| --- | --- | --- |
| 0–4 | Night Departure | Establish the mint pad and beat ONE |
| 4–28 | City Escape | Read single traffic/merge tells, clean passes and drafts |
| 28–52 | Freight Corridor | Choose convoy gaps and use Push/Brace |
| 52–76 | Audit Grid | Read committed audit lanes and learn the Echo rival at 58 |
| 76–92 | Final Pursuit | Three readable rival attacks, then prepare the split |
| 92–100 | Delivery Runway | Send Echo, take the right exit and finish the song |

`cache-road-encounters.js` replaces the repeated distance loop for eligible
new runs. It materializes traffic from committed audio bars with a 440-unit
reveal distance. Chorus sections lower civilian traffic density. The Echo
lesson and finale reserve open road so a rival cannot trap the player behind
a simultaneous convoy wall. The final split has no additional damaging interception. Musical offers stay
quiet from bars 90–95 so the slowest gear can finish the split; rewards return
at bars 96 and 98.

The chart chooses a musical lane at most one lane from the previous offer,
reserving traffic's swept lanes and a rival's committed lane. If no nearby
route fits, that beat stays quiet. It does not move a published pad or force
a multi-lane scramble merely to keep an action count. New pads retain the
existing next-measure ONE and the existing judgment window. A late or missing
announcement stays absent instead of appearing under the car.

Traffic and pads receive fixed world addresses. Queued gears, Surge and Turbo
change subsequent driving sections, never an already revealed address.
Checkpoint restoration must preserve the committed trajectory/addresses and
must not award a boundary pad twice. An earned gate stays open after reload,
even when the restored bar begins before its physical address; it neither
demands another Echo nor creates another delivery audit. Tests exercise this
through actual earned saves and resumed Bass completion in all three gears.
These are validation requirements, not
permission to retime the song or weaken legacy checks.

## Ability consequences and recovery

`cache-road-reactions.js` is the shared physical response used by front view,
rearview and collision handling. Each actor identity reacts once.

- Push gives the contacted vehicle an immediate forward impulse, bounded by
  the next occupied contact. The road does not claim an unreserved shoulder
  for a full vehicle. The short effect follows the physical actor.
- Brace absorbs one contact with a short vehicle response and Cache recoil.
  The struck actor clears once; it cannot damage Cache again in the next frame.
- Echo can make a scanning rival commit to the replay's lane. Its visible turn
  finishes before contact, and later player/decoy motion cannot make it track
  again. A last-instant Echo cannot teleport the rival across lanes.
- An unprotected crash removes one live captured part, preferring the struck
  lane, then the earliest expiry. Other live parts and already judged queued
  captures survive. The brief musical disruption ends after one beat; the
  collision recovery period is separate from the song clock.

The five synchronized sources and always-on pressure/drum backbone remain.
No new crew recording is supplied, synthesized as purported speech or claimed
to be part of the original song.

## Difficulty

The existing campaign choice supplies the road mode. It now changes actual
traffic and recovery, rather than serving only as result metadata.

| Mode | Integrity | Collision width scale | Collision recovery | Minimum row gap |
| --- | ---: | ---: | ---: | ---: |
| Relaxed | 4 | 0.88 | 1,800 ms | 118 units |
| Standard | 3 | 1.00 | 1,450 ms | 92 units |
| Overclocked | 3 | 1.04 | 1,100 ms | 74 units |

Relaxed has fewer convoy actors and wider spacing. Overclocked adds occupied
lanes and denser reveals while preserving a route. All modes keep the same
70/130 ms perfect/accurate musical thresholds and the three existing gears.
New runs start with 60 seconds because the opening includes four intro bars
before the first 24-bar act. Later verse markers retain a 55-second budget.
The original 55-second opening failed after two real crashes at bars 8.213
and 10.635: time expired at bar 27.413 with one integrity left. Identical
inputs clear all 100 bars with the 60-second budget, retaining that integrity.
The before/after observations are included in the balance JSON.

## Staged pursuit

`cache-road-pursuit.js` emits physical events; the road retains ownership of
sound, score, damage and checkpointing. The actor's one world position is
available to both road cameras.

| Reveal bar | Stage | Purpose |
| --- | --- | --- |
| 58 | Surveillance lesson | Refill Echo and teach scanning, locking and splitting |
| 77 | Approach | First final interception with a visible lane tell |
| 83 | Interception | Repeat the learned dodge/decoy decision |
| 88 | Last pass | Final pressure before the exit preparation |
| 90 | Prepare delivery | Hold a left lane steady before sending the exit Echo |
| 92 | Delivery | The final audit visibly takes the Echo; the right-lane gate owns the finish |

On reveal, the rival gets a fixed contact 180/155/140 units ahead in
Relaxed/Standard/Overclocked. It commits after 600/450/350 ms respectively.
Every mode retains at least one second after commitment at the maximum
75-unit driving speed. One-lane steering at the production steering rate can
avoid each attack. Echo redirection requires at least 65 units of remaining
runway and commits only once. A protected pad/escape corridor takes priority;
the rival concedes an incompatible pass instead of moving a published target.

Checkpoint restoration skips an expired half-finished rival warning and
starts the next scheduled attack with its full lead. It cannot spawn an
invisible rival strike at Cache's restored position. All interception
collisions stop at bar 92, including a slow-gear late approach.

The exit still contains a visible `delivery-audit` vehicle at the gate's
fixed world address. Sending Echo commits this final car to the replay's
actual lane with a smooth turn, visible in the front road and then mirror.
It never adds another collision or duplicate deception score to the existing
gate resolution. A restored checkpoint beyond the gate does not respawn it.

## New visual assets

Four transparent generated sprites support the active mechanics:

| Asset | Production purpose |
| --- | --- |
| `push-arc.webp` | Cyan impulse at the displaced traffic contact |
| `brace-halo.webp` | Amber absorbed-impact ring around Cache |
| `echo-ribbons.webp` | Magenta/cyan wake under the existing Echo sprite |
| `delivery-beacon.webp` | Mint signal at the authored final-delivery footprint |

The assets live in `assets/cache-road/encounters/`. Its `README.md` records
dimensions and anchors; `ART_PROMPTS.md` records exact prompts and inspected
references; `manifest.json` records hashes and alpha/conversion checks.
Original generated PNG bytes remain in `sources/`, with lossless WebP runtime
conversions. Existing approved car identities/animations are retained.
The beacon is a grounded single prop, not an invented road-spanning wall or
random addition beside an occupied building. Reduced Motion suppresses large
effect motion without hiding the relevant contact/ability state.

The Brace halo follows the car's actual scaled tire frame on the road.
Its upper/far slice renders before the car and its lower/near slice after,
using identical placement and opacity. The car occludes the far arc; the
near arc stays below the painted bumper. The procedural ellipse is only a
missing-art fallback, so it cannot form a second ring through the vehicle.

## Saves and protected behavior

Fresh chapters carry `encounterVersion: 1` and serialize their committed chart.
Existing proof saves and authored chapters without that marker keep their
previous layout/rules. An explicit full Replay race creates the new version.
The previous authored chapter remains eligible for its existing completion;
older proof saves without chapter metadata remain ineligible for retroactive
Bass. Do not silently promote either kind during Continue.

Preserve the existing save envelope, atomic Bass/result/Level-2-completion/
Level-3-unlock checkpoint transaction, optional records, silent completed
results and saved ending page/cue. Keep release-to-arm result controls,
pause/retry/title behavior and the four-panel ending. The eight opening and
eight bridge panels remain intact. Mac's authored stage is still future work.

The road horizon/composition, approved building/prop footprint separation,
left-only source restrictions, digital dashboard and exact `blur(2.3px)`
remain unchanged. The same road positions drive the actual vehicle sprites
in the mirror; asset polish does not authorize reducing the user's blur.

## Validation evidence and current limits

Focused checks are `tools/check-cache-road-encounters.cjs`,
`tools/check-cache-road-pursuit.cjs`, `tools/check-cache-road-reactions.cjs`
and `tools/check-cache-road-reaction-integration.cjs`. They cover committed
addresses, safe route selection, every-gear warning lead, one-time Echo,
reactions and recovery. The legacy road, completion and migration gates remain
required and must not be weakened to accept the new chart.

`tools/check-cache-road-races.cjs` drives complete production input/RAF races
for all three gears × all three difficulties, then repeats with a recovering
controller profile. It uses delayed visible observations, real gear/button
inputs, timing error, missed actions and deliberate visible lane errors.
It must not inject road progress, health, immunity, abilities, captures or
score. Completion fixtures that grant immunity are separate story/save tests
and are not balance evidence.

The outputs are `docs/source-pack/review-cache-encounters/full-race-balance.md`
and `full-race-balance.json` in the same directory. The final controller study
records **22/22 completed runs**:

| Study | Runs | Measured result |
| --- | ---: | --- |
| Practiced controller, every gear and difficulty | 9 | All clear at bar 100 without unprotected damage |
| Recovering controller, every gear and difficulty | 9 | Each takes one actual hit, loses exactly one live part and clears |
| Mixed gears | 1 | Actual queued gear changes followed by a complete clear |
| Deliberately missed final Echo | 1 | Genuine gate failure, verse-four checkpoint retry and eventual clear |
| Earned Push route | 1 | Five physical traffic contacts, no damage and full clear |
| Two early crashes | 1 | Survives the first marker and completes with one integrity |

The recovering runs retain one to three other parts and capture again
0.86–13.38 seconds after damage. They finish with three integrity on Relaxed
and two on Standard/Overclocked. Every matrix run records an actual rival
deception. Frame counts confirm the requested gears are genuinely engaged:
gears 1 and 3 run for 9,282 of 9,375 frames after the initial queued shift;
gear 2 occupies all 9,375 frames. The cautious matrix controller uses Brace
on actual contacts. The additional Standard/Gear 2 ram route earns Push
through normal inputs and deliberately contacts five visible actors inside
its 3,750 ms window, finishing without damage and with 54 captures.

The preliminary matrix did not produce actual crash damage because earned
Brace absorbed its intended errors. The final recovery controller explicitly
skips Brace until the probe and persists with a visible lane error until one
real hit occurs. The final study also verifies the actual gear rather than
assuming the first requested D-pad input took effect across entry's release
guard. These corrections avoid overstating what the simulation exercised.

The native review uses the actual Standard/Gear 2 ram-route race. Its
25-second production-rendered excerpts include matching captured-stem audio;
engine/SFX and Web Audio/device automation are outside that reconstruction.
Separate Push/Brace strips are explicitly labelled state fixtures. The exact
final local/Chromium/CI outcomes belong to the candidate PR and generated
receipt; full-race success alone is not the full merge gate.

Deterministic controller success is not a human win-rate estimate. Native
production rendering and hosted browser checks do not establish Makko device
latency, controller comfort, platform performance or subjective audio feel.
After merge, deploy/import through the normal project route, confirm the
receipt revision and follow the newest `ACCEPTANCE.md` checks in every gear.
Capture platform/browser, mapped input device, difficulty, gear, save route,
bar and a short video when reporting a mismatch.
