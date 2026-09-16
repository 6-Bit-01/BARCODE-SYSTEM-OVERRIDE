# Sidewalk box and background continuity

Base/rollback: merged PR #64, `97b6367b53bc719594e77f32d89cc6bfdfbe72f7`.
Review branch: `agent/sidewalk-box-background`. One combined draft, pending owner Makko acceptance. The generated source receipt identifies the exact head and CI status.

The terminal previously appeared only when the mission started and drew after both enemies and the barrier fields. The sky's inverse-viewport cover calculation also resized its image as camera position changed, on top of the gameplay zoom.

## Changes

- Move the existing left terminal up 32px (x=690, top y=618, foot y=824). Keep its size, perspective and stable collider ID. Street actors stand at y=856, leaving visible pavement in front.
- Render it and enable its matching platform during training, mission play and fresh reset. It is no longer coupled to mission rewards.
- Draw this terminal before enemies and hologram fields. Other upper-route props, the lift, pickups and boss keep their previous pass.
- Draw the distant skyline at one fixed aspect-correct size, independent of the gameplay zoom. Keep camera parallax and cover the full screen from street to roof. Foreground camera behavior and original traffic remain.
- Add sparse rain, chimney haze and slow light variation over the existing distant art. Reuse cached atmosphere textures and the existing simulation clock; pause freezes motion and restart resets it. Reduced flashes keeps the window lights steady; boss combat dims these accents.

No new artwork, asset URLs, dependencies, timers or animation loops. Movement, jump physics, traffic settings/warnings, mission/boss rules, Cross beat controls, platform descent and hack popup remain.

## Validation

Production checks cover initial/reset terminal drawing, aligned tutorial landings, draw order, the 32px foot-plane separation and 45 combinations of camera position, roof height and zoom. Animation checks cover repeated draws, time progression, pause, reset and reduced flashes. Existing traversal checks retain all 63 jumps at 30/60/120Hz and the original-car comparisons. Full `npm test` and all-JavaScript syntax validation are required on the final commit; their exact results are in the generated receipt.

Native previews use the real render coordinator, parallax, progression, sprites and cached art with adapted Image/Makko boundaries. The eight-second video scripts actor/camera positions. These are visual/logic checks, not hosted Makko performance, physical controller or audio acceptance.

- `verification/box-in-tutorial.webp`: terminal before mission start.
- `verification/enemy-in-front-of-box.webp`: street enemy in front of the terminal; original active gate.
- `verification/hologram-over-box.webp`: diagnostic overlap with a temporarily shifted gate in the rendering fixture only; production gate positions are unchanged.
- `verification/stable-background-roof.webp`: roof camera and wide gameplay zoom.
- `verification/box-background-review.mp4`: enemy crossing, background parallax and animated details.

## Owner test route

1. Import this exact draft head into a fresh Makko preview. At the first playable tutorial frame, confirm the terminal is already present. Walk past it, then jump onto it and onto the first awning.
2. Complete training. Confirm the terminal does not appear, move or replace itself at mission start. Let street enemies cross its full width in both directions; bodies and feet should stay visible in front, with sidewalk below the terminal.
3. Inspect the active hologram where it overlaps the terminal's right side. The translucent field and its lines should draw over the terminal. Check gate opening and retained enemy/hardware depth.
4. Walk left to center to right, reverse direction, then climb to the highest roofs. The distant skyline should keep its size and shape while scrolling; no black top strip. The foreground still uses the existing gameplay camera zoom.
5. Stand still to inspect rain, soft chimney drift and small light variations. Pause/resume, toggle reduced flashes, retry the boss and fully restart. Confirm animation lifecycle and initial terminal presence.

Keep this draft unmerged until the owner records Makko acceptance. Rollback is the base above. Further animation intensity/art changes await that visual feedback.
