# Controller descent, boss victory and hacked allies

Base/rollback: merged PR #71, `5babd454e2753d834be2372642ee8612e0b39a9d`.
Review branch: `agent/controller-drop-victory`. Exact published SHA/PR and test results are recorded in the generated source-pack receipt.

The owner reported accidental platform descent from slight controller movement and a boss win that reset boss health and returned the player to street level. The same pass extends hacked allies to twelve seconds.

## Changes

- Platform descent requires stick Y >= 0.70 within 35 degrees of straight down, or D-pad down without another D-pad direction, plus a fresh mapped jump. It does not require two taps. Walking/menu sensitivity is unchanged. Intentional descent still ignores only the current support, and keyboard descent remains available.
- The victory handler previously accepted a fresh Cross/Enter while the result card was still invisible. Its existing checkpoint rematch restored boss health and street position, matching the reported symptom. Input now waits for the existing 2.06-second results reveal/count-up, followed by 250 ms with result controls released. Cross/Enter explicitly rematches and Square/Space explicitly restarts after that point. Physical keyboard state survives the winning hit's action reset; button mashing and held controls cannot queue an automatic rematch. The UI reveals the choices when usable. Defeat retry stays immediate.
- Successful hijack lasts 12 simulation seconds. The countdown bar uses the same duration constant; success text and tutorial match. Pause freezes the timer, early release works, and the existing harmless reboot and mission credit remain.

## Verification and limits

`check-controller-victory.js` runs the production input/player/progression/RAF owners with synthetic browser/controller services. It checks light and diagonal stick inputs, the downward cone, D-pad conflicts, remapped jumps, and wins at street/rooftop height with controller/keyboard at 30/60/120 Hz. Checks include repeated/held inputs, pause during release, preserved win position/score, deliberate rematch/restart, and immediate loss retry. Existing traversal tests retain next-platform catches and held-chord protection.

`check-enemy-hijack.js` uses the real puzzle and allegiance owners, confirms twelve-second expiry at 30/60/120/144 Hz, and retains pause, early release, AI fighting and defeat-credit checks. Required gates are `npm test` and `npm run check:syntax:all`; actual outcomes are in the receipt. The static inventory change adds this regression script and moves the EnemyManager global assignment line by one; script order and baseline exceptions are unchanged.

No new artwork, asset URLs, dependencies, listeners or timers. These automated checks do not establish physical DualSense feel or hosted Makko acceptance. Follow the current route in `ACCEPTANCE.md`; retain draft status until owner acceptance. Later levels and final campaign reward delivery remain separate work.
