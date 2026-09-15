# Level 1 rebuild after reverted #55

Base/rollback: `6e3751ba1561d8694e0bdc9a623e74ac6a45624d`. Branch: `agent/level1-rebuild-reviewed`. The owner approved this revised pass after rejecting and reverting #55. Publication, exact tested revision and CI results belong to the PR and generated receipt. Owner Makko acceptance is pending.

## Changes and design boundaries

| Piece | Implemented behavior |
|---|---|
| Intro | Space/A advances dialogue within a scene; Enter/RB advances a completed scene. Pointer buttons are separate. Existing deliberate S/B hold skip and input guards remain. |
| Repair | White/lime heart capsule, restrained pulse, burst/sound/HUD feedback, no floating labels. Two placed repairs and one marked Corrupted drop retain +1/full-health persistence. Late placed repair now rewards the Tower crown. |
| Contact | Independent side separation during invulnerability/hack/reboot; recovery damage rules and ordinary lethal descending stomps remain. |
| Firewall | Existing first sixteen walk drawings registered and paced as one steady stride. Motion owns facing, integrates once and avoids random per-frame speed. Crowd steering cannot assign vertical movement to ground enemies. |
| Street | Shared physics anchor 784 plus 72 visible-foot offset puts feet at 856, centered on the painted sidewalk. Lift, shadows, enemies, Jammer, boss and restart share that plane. |
| Barriers | Actual illustrated facade and floor emitters, fitted per gate. The #54 perspective sidewalk/curb/road footprint remains. Field extends above the crowns, uses a quieter fill and local contact/passage ripples, and leaves dormant machinery after opening. |
| Roofs | Original seven calibrated colliders remain; six building crowns and ten additional service supports expand access. Existing two supports gain depth. No blue roof lines. Selected grounded feet clip 9–12 world pixels behind real roof fronts; airborne actors stay visible. Vertical camera returns to street for the boss. |
| New enemy | Distinct eight-frame rooftop security drone on Cache/Tower crowns. Bounded flight, fixed aim warning, single pulse and recovery. It uses normal damage, defeat credit and eight-second H conversion. Other rooftop guards stay on their own supports. |
| Traffic | Existing three atlas/GIF artworks and their proportions. World-space foreground lanes, 2.8-second direction/height warning, 540px/s pass, once-per-car damage attempt and normal recovery protection. Missing art creates no hazard. Background traffic remains scenery; no substitute car drawing. |
| UI/input | Objectives heading, current unfinished tutorial task, less competing guidance, delayed final-enemy direction hint. Shared hack keypad supports keyboard digits and pointer/controller selection/correction/submission/cancel; practice entry is untimed and keypad entry gets 16 seconds. Instant text/recent crew dialogue are available in pause. |

The existing single jump, 300px/s player speed, three-bar health, twenty mission defeats, sixteen-hit Jammer, boss timing/damage, rhythm/music clock and existing character art remain. No cloud room, campaign expansion or complete touch movement controls are included.

## Assets and integration

New illustration sources are recorded in `assets/level1-rebuild/prompts.json`. `facade-emitters.webp` (168,942 bytes), `floor-emitters.webp` (195,282) and `rooftop-drone.webp` (179,258) total 543,482 bytes and use the immutable published ancestor `a155d4283a12df4dd7ea0f8cb9eb0bf985644fa8`. These are actual raster drawings; native rendering provides alignment, glow and local effects. The original car atlas URLs are pinned to the reverted baseline with their existing image fallback. No new car designs were made.

The security drone uses 2 HP and normal 250-point credit; ordinary top-down stomp remains lethal. Patrol is 58px/s within its roof band with at most 5px vertical bob. Initial tuning: 1.5s patrol, 1.15s fixed lock warning, 0.18s firing and 1.5s recovery. One swept pulse at 490px/s lasts at most 850ms. Conversion directs it toward hostiles; release/expiry clears its projectile. This tuning needs live feel review.

All updates use existing lifecycle owners. No extra RAF/interval/audio context is introduced. Traffic is held during hacking and rewarns on return; pause/scene/reset ownership is retained. New contact effects are bounded to ten short-lived ripples.

## Validation and review

`npm test` and `npm run check:syntax:all` are required. `tools/check-level1-rebuild.js` uses actual production classes to check 75 single jumps at 30/60/120 FPS, grounded guards/bounded drones, protected contact, drone targeting/allegiance/projectiles, original-image traffic fallback/warnings/damage/reset and roof masking. Existing cutscene/controller, contact, lift, hijack, mission, rhythm/audio and boss suites retain their contracts; fixtures are updated for intentional ground/geometry/input changes. The inventory change is scoped to these source/assets/tools.

`tools/render-level1-rebuild.cjs` renders real production drawing and animation through native Canvas and host adapters. It produces street/barrier, utility box, rooftop/drone and keypad stills plus a 16-second motion sample. This verifies drawing integration; it is not browser gameplay or Makko acceptance. Full-suite/CI outcomes and the exact published tree are reported with the PR and export receipt.

Owner route and normal post-merge instructions are at the top of `ACCEPTANCE.md`. Review exact head before merging; after acceptance import actual new main SHA, use a fresh Makko preview and repeat the same focused route. Rollback is the base above. Future work follows owner feedback on this rebuild.
