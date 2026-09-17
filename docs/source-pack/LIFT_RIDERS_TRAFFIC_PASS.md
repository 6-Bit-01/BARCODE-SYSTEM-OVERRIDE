# Elevator passengers and traffic warning relevance

The owner's descent ejection came from a static rooftop taking support at the top stop, followed by the descending ceiling shoving the stranded actor aside. The fixed canopy also pushed riders sideways on ascent. Earlier occupied-descent checks used only the far right of the cabin; fractional roof coordinates could lose support for a frame.

Boarded passengers now keep the carriage's foreground travel lane through intersecting facade ledges. Walking out, stepping aboard, cabin jumps, drops and reset have explicit support transitions. An exit into a solid canopy stops locally at the cabin boundary until there is clearance. Other actors retain full awning collision. Enemy floor support survives the street-height ground clamp. Five-second power, reversal, crush behavior and front rails remain.

The red-circled firewall-low-step at x=2130, y=430 is removed from drawing, top collision and bonks. Its existing gold frame replaces the repeated design at firewall-high-step without moving or resizing that upper platform or its hangers. No new game artwork.

WATCH OUT compares the stable player body with the actual inset car hazard and bob range, using a bounded 180 ms vertical prediction and 28-unit margin. It anticipates a nearby jump, fall or lift entry, and suppresses distant altitude lanes. The three-second approach window and ending on first visible artwork remain. Label/arrow stay at the projected hull center, even offscreen; the HUD-row clamp and connector are removed. Original traffic speed, scale, height, spawns and swept damage remain.

## Verification

The receipt records actual npm test and npm run check:syntax:all outcomes. The added check:lift-riders runs 99 full nine-second production rides at 30/60/120Hz: five floor-riding types and six roof-riding types across left/center/right. AI intent is held still while actual physics runs. It checks exact carry, both stops, no side ejection, walk-off/reboard, descending cabin jump, blocked exit, deliberate drop, reset and removed-platform collision. Existing charge, crush, solid-awning, front/rear depth and smart-box tests remain.

Traffic coverage retains 80 original-car comparisons and 18 approach trajectories, adding safe/danger transitions, jump/fall/lift anticipation and unclamped offscreen labels. Removing the one deleted route leaves 69 real climbing/descent checks. The technical inventory adds only the new test path; an old static expression assertion now recognizes the bounded foot-roundoff tolerance.

Native review command: LIFT_RIDER_REVIEW=1 node tools/render-level1-rebuild.cjs docs/source-pack/review-lift-riders. The ten-second lift-full-cycle.mp4 advances production player/enemy/lift physics; chosen camera framing follows the ride and idle AI isolates the mechanism. ride-evidence.json records floor/feet/x/state each frame. Stills show the removed/reused platform and danger/safe/offscreen warnings from both sides. This is repository artwork through a native canvas/Makko boundary adapter, not a hosted session or audio/controller acceptance.

## Review and deployment

Base/rollback: merged #79, 318f024c1e1c6bb38f479b7e4842c894074c5ed4. Review revision/tree/PR belong to the generated receipt. Follow the newest five-step ACCEPTANCE.md route. After owner acceptance and merge, import the actual main SHA into a fresh Makko preview and repeat it, recording SHA/device, per-step PASS/FAIL, a full ride clip, platform screenshot and danger/safe approaches. Owner acceptance remains pending before assistant merge. Next milestone: owner feedback on this build.
