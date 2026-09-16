# Environment and traffic repair after owner feedback

Base: merged PR #65 (`a8a0dfdd587906f4beea976a15c9671a40d5aac6`). Branch: `agent/traffic-background-repair`. Owner feedback is a failed review, not acceptance. Final PR/head/CI live in the generated receipt.

## What happened

The previous terminal move overshot the facade. The new skyline accents were faint and mostly occluded by foreground buildings from the sidewalk. Calling that sufficient visible animation was an overstatement.

Traffic was not deleted or reverted: `spaceships.js` is identical across PRs #63–65. Its shared warning/damage gate explicitly required mission start and an inactive tutorial. The earlier hazard checks called `startMission()` before exercising collisions and warnings, so they never tested playable training. Once the terminal became available at the beginning, the separate mission-only vertical camera gate also left early roof travel above the viewport. These are reproduced source/runtime gaps; they do not prove the precise state of the owner's hosted session.

## Corrections

- Terminal x=560, y=638, retaining the existing 160×206 support and authored art registration. Its back sits at the facade, right edge clears the pink windows and front leaves 12px before actor feet. Always present and behind enemies/holograms. The left move was calibrated visually; the first 50px adjustment still covered a window, so it was moved farther left before publication.
- Warnings and one-hit-per-car damage apply during active training as well as the mission. Actual body overlap is still required. Player entrance, stopped play, boss/cinematic phases, hacking and damage recovery keep their protections. No car spawn/flight/size/probability retuning.
- Vertical camera follows playable training roof travel, using the same bounds, smoothing and street return as the mission.
- Foreground rain is drawn after buildings but before actors/HUD; sign light sweeps and pavement steam are visible before mission/music activation. Distant chimney haze and rain are stronger, and chimney mouths are aligned to the existing art. Fixed population, existing three cached textures, existing pause-owned clock; no extra timers, listeners, live filters or gameplay particles. Buildings and painted cloud art stay fixed while atmosphere and signs animate.

## Retention audit

Canonical source-pack version 67 matched all 386 exported files against merged #65. Its full manifest and evidence remain in `verification/pr65-merged-history.json`, annotated with the owner failure.

| Area | Evidence and retained behavior |
|---|---|
| Prior #65 change | Only parallax, terminal/progression and entity ordering changed in its production source; traffic was untouched. |
| Controls and jump | Input, action mapping, controller settings and Player source unchanged by this repair. Cross jump/beat, held jump and Down + Jump remain. |
| Hacking | Hacking and comic HUD source unchanged; eight-second ally conversion, recharge and brief HACK READY remain. |
| Actor art | Sprite manifest, loader pins, walk drawings, enemies and Jammer source unchanged. |
| Mission and boss | Progression diff is only terminal position/comment and training camera eligibility. Twenty defeats, drones, right lift, caches/repairs, gate ordering, Jammer, boss pursuit/cinematic/finish/retry remain. |
| Music | Audio/transport source unchanged; atmosphere consumes the existing presentation clock. |
| Traffic | Original assets, speed (4,350 units/s), size (690), random y=-400..0, direction, bob, 15% foreground chance and queue unchanged. Distant traffic remains scenery. |

No other deleted feature was found in this scoped audit. This is not a blanket hosted-playtest pass.

## Verification

`check-environment-runtime.js` runs the actual RAF → update coordinator → render coordinator with original seeded random spawns, completed image boundaries and host canvas adapters. Twelve routes cover training/mission × left/right × 30/60/120Hz. They assert rendered WATCH OUT, actual Player health 3→2, warning before contact, early roof camera following, unchanged car properties, advancing scenery, balanced render state, no runtime errors and paused clocks. It neither injects a damage callback nor relocates a spawned car.

The existing original-car comparisons/protection checks remain. The 63 jump trajectories now target the relocated terminal. Street-depth checks retain initial presence, reset, exact landing, actor/hologram ordering, 45 fixed-scale camera cases and pause/reset/reduced-flash checks. Required `npm test` and `npm run check:syntax:all` results are in the final receipt.

Native evidence uses production frame/update/render methods and actual artwork, with host image/sprite adapters. Training dialogue is suppressed for visibility; there is no physical controller/audio/Makko-host claim:

- `verification/repair-environment-repair-review.mp4`: fixed street view of animation, then original random cars from both sides, warnings and real health loss.
- `verification/repair-training-street-90.webp`: facade alignment and clear windows.
- `verification/repair-watch-out-left.webp` and `repair-watch-out-right.webp`: projected warnings.
- `verification/repair-traffic-hit-0.webp`: real hit with the HUD at 2/3.

Owner Makko review of the exact new revision remains required before merge. If a hosted failure persists after training, capture its imported SHA and gameplay state; the reproduced training gate must not be assumed to explain an unobserved post-training failure.
