Slight downward controller movement could turn a jump into an accidental platform drop. After boss defeat, a fresh Cross/Enter could trigger a rematch before the victory card appeared, restoring boss health and returning the player to the street.

This combined follow-up:

- Requires a firm downward stick press within 35 degrees of straight down, or pure D-pad down, plus a fresh mapped jump for descent. Light/diagonal movement jumps normally.
- Protects victory until the existing count-up finishes and result controls have been released for 250 ms. A fresh press then explicitly rematches or restarts. Covers street and rooftop wins; loss retry remains immediate.
- Extends hacked allies to 12 seconds, with matching countdown/bar, success text and tutorial. Pause and early release remain.

Validation covers production input/player/RAF/progression at 30/60/120 Hz, remapped jumps, repeated/held victory input, deliberate rematch/restart, and twelve-second allegiance expiry at 30/60/120/144 Hz. Required gates: full `npm test` and all-JavaScript syntax checks. The generated source-pack receipt records their actual results and exact revision. No new artwork, dependencies, timers or movement-physics changes.

Base/rollback: merged #71, `5babd454e2753d834be2372642ee8612e0b39a9d`. See `CONTROLLER_VICTORY_ALLY_PASS.md` and the current `ACCEPTANCE.md` route. Keep this draft unmerged until owner physical-controller/Makko review; after merge, import the actual main merge SHA into a fresh preview.
