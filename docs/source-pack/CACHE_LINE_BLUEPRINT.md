# The Cache Line: Original Master — gameplay blueprint

September 23, 2026. **Working creative direction for Level 2**, after the owner rejected the simple lane runner as too basic. This is a design target and a reviewable chase slice, not a claim that the complete authored chapter, soundtrack, scenes, art, or Bass Key is finished. The selected campaign facts in `CAMPAIGN_REDESIGN.md` take precedence over the proposed details below.

## Promise and stakes

Cache Back carries the original recording restored by Level 1 across a transit sector. The recovery apparatus has a more polished copy that omits names, breaths and mistakes. Both versions can pass a mechanical check. Cache hears what is missing and chooses to deliver the original. The route exposes a distribution blockade for Mac's Level 3; it does not identify who initiated the separation, who made the simulation, or who is behind a distorted cadence that resembles 6 Bit.

The player should feel like a fast, cunning driver who keeps evidence alive under pursuit. Every ten seconds should ask for a driving decision: take a draft, brake for a curve, risk a near miss to recharge, change the mix, or spend Cache's recorded path to misdirect a pursuer. Timed checkpoints create urgency while immediate checkpoint retries support learning.

## Player loop and controls for the review slice

| Action | Purpose | Existing input owner |
|---|---|---|
| Left / right | Continuous lateral steering across four visible signal bands; road curvature pushes against a fast car | `move_left` / `move_right` |
| Down | Brake into traffic or a bend, then accelerate automatically when released in this slice | `move_down` |
| Space / A | Spend a charged turbo; drafting and clean near misses replenish it | `jump` |
| E / RB | Lock or release the active musical part; earn a new lock charge by driving cleanly | `inspect` |
| H / Y | Play a Buffer Echo of recent steering, then split from it; clean driving charges the ability | `interact` |
| P / Menu | Shared pause, settings and Exit preview | `pause` |

The authored chapter may give throttle its own remappable action; this slice uses automatic acceleration to avoid changing Level 1's global input map. Steering is continuous, traffic has legible advance warnings, and a collision costs speed, time and integrity. A failure never replays the whole road.

Four aligned stems of one song occupy the signal bands: bass, break, harmony and lead. The current band plays immediately on the next transport beat. Locks keep up to three other parts playing as the car moves; locks are earned by skilled driving rather than gained by pressing E repeatedly. A quiet carrier gives the driver a musical clock. Sound changes must remain smooth, sources keep running together, and the game never asks for a precision beat press while cornering. The mix is expressive; no single arrangement is required to finish. A dense mix recovers more time at checkpoints but draws more pressure from the pursuing system. The final mix belongs to the driver's decisions, rather than a forced all-stems switch near the finish.

Buffer Echo records the recent steering trace. Activating it plays that trace from Cache's current position as a visible second car while the real car takes a different line. The rival commits to the echo briefly. The mechanic needs a readable split, a meaningful cost, and enough energy on a boss retry to learn the trick. It does not rewind the actual tape, erase a collision, or alter saved evidence.

## Route and rival

| Beat | Driving challenge | Character/evidence |
|---|---|---|
| Rainline | Draft freight, learn the musical bands, take the first curve and checkpoint | Cache can hear imperfections that the clean recording lacks |
| Service Loop | Sweepers and changing traffic lines, optional express or maintenance approach | An absurd road-service bulletin; Dr3wBaby or WittyF0x can be an optional callback, never a gate |
| Mirror Viaduct | Catch an audit car telegraphing a lane, use an echo to split paths | A pursuer's familiar cadence remains uncertain |
| Distribution Causeway | A white, spotless Clean Copy vehicle boxes Cache into an audit scanner; lure it with the echo, escape via the marked original route | The original goes through; its delivery trace identifies Mac's distribution blockade |

The Clean Copy is a **proposed adversary for this chase**, not a new canonical person or an assertion that 9 Bit or 6 Bit drives it. It has readable physical position and a warned target lane. In the slice, the finale tests driving, musical switching under pressure, and an Echo split instead of a health bar. The full chapter could extend this into a three-phase race with drafts, a temporarily stolen part and a final overtake; those later phases need playtesting before implementation.

## Presentation and chapter boundary

The complete chapter wants a short Cache/DJ handoff, brief in-car lines over safe stretches, a clear comparison of both recordings, then a skippable result scene where the apparatus marks the delivered original `UNVERIFIED` and Mac sees the distribution stamp. Mandatory understanding lives on this direct path. Four optional Level 2 records deepen the comparison, the uncertain cadence and the blockade; they do not carry the sole explanation. A sparse 9 Bit caption/billboard gag can question the recovery label, but never changes a real warning, save, result or control.

This slice keeps the established Level 1 Voice and Level 3 architecture test intact. It awards **no** Bass Key, Level 2 completion or durable lore; its temporary 120 BPM audio and canvas drawing are unapproved stand-ins. Completing a proof only demonstrates an interaction. The full chapter still needs composed music, authored scenes, art, optional routes, narrative records and owner feel review.

## Acceptance before expanding the chapter

1. In the first minute, steering, braking, drafting and turbo feel distinct and traffic reads early enough to react.
2. A listener can tell which parts were locked and hear clean transitions across several loops. Pause/resume never desynchronizes them.
3. Buffer Echo visibly diverges from the car and actually redirects the rival. A boss retry supplies a fair opportunity to use it.
4. At least one hard decision combines line choice, speed, mix and pursuit; losing explains what happened and restarts nearby.
5. The authentic recording and Mac handoff are comprehensible without collecting records. The actual clear screen remains truthful.
6. Physical controller and hosted Makko play determine whether the slice is *fun*. Automated tests can establish behavior and lifecycle, not feel.
