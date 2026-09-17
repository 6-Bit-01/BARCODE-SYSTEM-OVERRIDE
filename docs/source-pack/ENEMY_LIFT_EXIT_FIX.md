# Enemy elevator exit repair

Base/rollback: merged #80, `f2fb5dccf7473f8584fcd3bf25847780c35a37b3`. Branch: `agent/enemy-lift-exits`. The owner supplied a playtest screenshot showing enemies bunched inside the grounded cabin.

## Cause and change

Actual Firewall, Corrupted and virus AI reproduced the trap from both directions. The existing `stayOnSurface` ledge guard treated the lift as an isolated platform and zeroed horizontal velocity around 45 units before its edge. PR #80 retained enemy support at the street stop, exposing that guard. Its 99 full-ride tests held AI intent still and could not detect a walking exit failure.

Enemy walking and player-contact separation now share `getSurfaceWalkBounds`. The grounded cabin connects to the street. Level overlapping rooftop/lift walking ranges connect for departure and boarding. An exposed elevated edge stays guarded, and unrelated static ledges keep their previous limits. Enemy landing uses the full moving-deck span; the former ten-unit inset left a brief unsupported gap during a level rooftop handoff.

No changes to enemy speed, attacks, damage, spawn counts, player physics, lift charge timing, art/layers, smart boxes or traffic. No new runtime assets or dependencies.

## Verification and handoff

`check:lift-riders` retains 99 complete rides and adds 54 actual-AI exit cases across 30/60/120 Hz: Firewall, Corrupted and virus enemies; both directions; starting inside, crossing from outside, and returning to the street. It also checks seamless top-stop exit/reboarding, exposed-edge protection, full-manager crowd pursuit and contact separation beside a stationary player. Other required checks are `npm test`, `npm run check:syntax:all` and `git diff --check`; the generated receipt records outcomes.

Native evidence in `review-enemy-lift-exits/` uses the production enemy manager with active Firewall/Corrupted pursuit and bundled artwork through the existing canvas/Makko adapter. Reproduce with `ENEMY_LIFT_EXIT_REVIEW=1 node tools/render-level1-rebuild.cjs docs/source-pack/review-enemy-lift-exits`. This is not hosted Makko or physical-controller acceptance.

The static inventory update changes only the two line offsets for the existing EnemyManager and enemyManager assignments after inserting the shared walking-bounds method. No inventory scope or baseline assertions were removed.

Follow the newest `ACCEPTANCE.md` route before assistant merge. After merge, import the actual new main SHA in a fresh Makko preview; capture both exit directions and an occupied full ride, recording revision/device and PASS/FAIL. The source archive remains a review build until merged. Next step: owner playtest feedback on enemy movement through the cabin.
