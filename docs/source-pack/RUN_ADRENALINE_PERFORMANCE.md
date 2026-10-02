# Run, required-enemy recovery and adrenaline pass

October 2, 2026 owner request, continuing from merged #175 at
`67ea4946b4c10be00d7257ee72fbd4b92e90fdd8`.

This candidate adds a genuine 6 Bit run, repairs required enemies stranded
behind encounter walls, reduces crowded hack/road rendering work, makes timed
Cache Road presses build a useful spendable meter, and improves its instruments.
Final tested revision, complete regression/syntax, hosted browser, both exact
final-head CI events and publication results belong to the generated export
receipt. Owner Makko, physical-controller, listening, comfort, human balance
and device frame-pacing acceptance remain unrecorded.

## Level 1 run and accessible mission enemies

Hold Shift while moving, or the default L2/LT controller trigger, to run at
450 world units per second. Ordinary walking stays at 300. Run is grounded
movement, uses twelve complete canonical-style cels at 50 ms each, and follows
actual movement velocity. Its feet/body registration matches the existing
hero; the original idle, walk, jump and rhythm artwork remains unchanged.
The new sequence preserves 6 Bit's hat, hair, glasses, white irises, face paint
and costume instead of replacing his established sprite design.

The existing single jump and directional air movement remain authoritative.
Entrance, planted Rhythm Mode, hacking, cinematics and pause keep their access
rules. Releasing Run returns to walking. Focus loss, lifecycle resets and
controller changes clear held Run input. Existing controller layouts migrate
without resetting customized controls; Level 2 keeps its independent skill
bindings.

Required encounter enemies must enter and remain on the reachable side of
their closed gate. Spawn/entrance targeting uses the owning encounter boundary,
and misplaced required actors recover to an accessible safe position. This
preserves enemy identity, health, authored defeat credit and the twenty-defeat
mission requirement. No automatic kill, free credit or opened future wall
substitutes for fighting the required enemy. Existing roof/drone supports,
ordinary collision and tutorial boundaries remain in place.

## Measured rendering work

Crowded hack paint now uses one recent full-body echo per enemy while retaining
the three movement ribbons and their recorded history. The measured canonical
body submission budgets fall from 48 to 16 for eight enemies, and 72 to 24 for
twelve. Animation, AI, collision, the existing tactical slowdown and music still
have their original owners; painting does not tick them a second time.

Level 2 constructs the repeated 65-vertex terrain crest path once per frame.
The native production comparison removes 660–858 redundant Canvas vertex
submissions per sampled frame, with byte-identical complete main/rear pixels
at four road addresses and Reduced Motion both off and on. Hosts without
`Path2D` retain the original command path. Conservative rearview culling skips
only complete scenery outside the glass; retained sources keep their order,
projection, cels and exact `blur(2.3px)`. No extra Canvas surface, RAF, timer or
image owner is introduced.

`tools/check-cache-road-render-cost.cjs` verifies the native comparison and
held pedestrian cels. `tools/profile-cache-frame.cjs` additionally supports
`PROFILE_SCENARIO=combat`; its dense production-controller fixture contains
eleven civilian actors and three combat foes. Native CPU timing varies with
host load and decode/cache state. These measurements establish reduced work
and sampled pixel identity, not a guaranteed percentage speedup or device FPS.

Pedestrian contact already saved the exact fractional impact time and stopped
its world/lane position. Its walking clock now also stops at that contact,
so the original cel remains held during the existing throw, landing and later
rearview passage. Impact paint may age; the grounded body's legs no longer
cycle. Contact ledgers, old saves, road registration and penalty-free pedestrian
economy remain intact. Fallen riders retain their existing grounded hit pose.

## Continuous adrenaline

Version-4 combat roads use an independent 0–100 adrenaline meter, initially 25.
Accurate timed face-button opportunities earn charge at their actual musical
award point. Each opportunity has one bounded receipt, including missed pads,
so repeated presses or checkpoint restoration cannot replay an award. Wrong,
off-lane or out-of-window presses do not refill it.

| Event | Meter change |
| --- | --- |
| Good timed press | +15 |
| Perfect timed press | +20 |
| First consecutive missed opportunity | Grace; no charge loss |
| Second / third / later consecutive misses | −12 / −18 / −24 each |
| Accepted Turbo | −10 |
| Accepted Disrupt | −14 |
| Genuine unblocked wreck | −12 |

A successful press breaks the miss streak. Missing an actual authored
opportunity drains charge; an interval without a scheduled pad does not invent
a miss. All changes clamp to 0–100. Costs follow accepted skill inputs, so a
rejected cooldown/ammo input cannot spend charge. Pedestrian hits remain
outside this economy.

Every positive meter value supplies smoothly scaled benefits in addition to
the existing live-part synchronization benefits. The 35/70 CHARGED/RUSH
markers describe intensity and sound feedback; they are not hard unlocks.

| Additional benefit | At 100 adrenaline |
| --- | --- |
| Attack/counter power | ×1.30 |
| Skill recharge duration | ×0.75 |
| Ammo refill duration | ×0.70 |
| Guard duration | +250 ms |
| Enemy tracking response time | +300 ms |
| Tracking footprint | ×0.82 |

Turbo and Disrupt exchange some accumulated strength for an immediate tactical
action. Attack and Defend keep their existing ammo/cooldown rules. All four
skills remain usable at zero charge when their ordinary requirements are met;
there is no new meter lock or persistent upgrade shop. Four synchronized parts
still own the original bonus music layer, independently of the new meter.

Charge, streaks and anti-duplicate receipts save/restore with the existing road
checkpoint. A restored checkpoint clears stale presentation deltas while
retaining earned charge. Compatible older v4 saves initialize the optional
meter; historical v1–3 rules remain intact. Shared simulation/heard-music
clocks own expiry and display ages, including pause. No alternate song clock,
judgment window, lane address or audio source is added.

## Instruments, help and sound

The left peripheral adrenaline instrument shows its actual value, COLD/
CHARGED/RUSH intensity, a brief gain/spend/loss receipt and power/recharge/guard
values. The existing right dashboard uses distinct Attack, Turbo, Defend and
Disrupt pictograms, mapped controls, cooldown tracks, active/queued/shot states
and two ammo sockets. Its synchronization/power/ammo footer has a dark backing
for contrast. Accepted pad guidance gains static lock corners. Earned receipts
sit below the meter while the center driving view remains clear.

Pause retains all control, boss and record explanations and adds the short
gain/miss/cost/zero-charge rules. Good/Perfect outcomes use the existing action
sounds; upward charge tiers and downward missed-pad transitions use bounded
existing cues through the road sound owner. Reduced Motion and Flashes Off
keep readable steady status and suppress optional motion/flash feedback.
The instruments extend the established comic paths/colors without replacing
road paintings, mirror artwork, original music or the previous crew/blood art.

## Review route and limits

Inspect native walk/run transitions in both directions and on street/roof
supports, then test all four encounter gates and crowded hacking. Compare
timed presses against deliberately missed opportunities; spend charge with
Turbo/Disrupt, take a genuine wreck, and recover through later successful pads.
Check zero-charge skills, all difficulties/gears, pause, old/earned checkpoint
resumes, controller mappings and the held pedestrian cel in both cameras.

Focused module/native checks are diagnostic evidence. Complete final-head
regression, all-file syntax, production browser checks and both exact-head CI
events remain publication gates under standing owner authority. Final results
must be attributed to the exact candidate/export receipt. Human Makko,
controller, audible quality, comfort, fun/balance and device pacing remain
separate owner review.
