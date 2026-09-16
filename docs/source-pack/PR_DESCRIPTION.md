The previous bonk pass made every stage underside collidable, exceeding the four objects circled in the owner's photos and blocking direct upward platform routes.

This correction:

- Limits static bonks to the two circled striped awnings and two circled small gray steps: `signal-awning`, `tower-awning`, `cache-maintenance-step`, and `firewall-low-step`.
- Restores upward passage through every unmarked platform while retaining landing support. Platform positions and jump physics are unchanged.
- Preserves the separately approved solid moving elevator roof, rider support and enemy pancakes, plus #72's controller, victory and twelve-second ally fixes.

The original three screenshots were recovered and inspected; `CIRCLED_BONK_CORRECTION.md` maps each red circle to its exact collider. Regression checks assert the independent four-object scope, every unmarked underside, direct upper routes, and 72 climbing/descent trajectories at 30/60/120 Hz. Full-suite and syntax results are recorded in the source-pack receipt.

Base/rollback: merged #72, `0c428a053225dfa68b42fbb7464708f020daba76`. No new art or dependencies. Keep this draft for owner Makko/controller review using the current `ACCEPTANCE.md` route; automated checks do not claim hosted acceptance.
