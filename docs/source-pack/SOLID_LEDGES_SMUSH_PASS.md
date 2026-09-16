# Solid ledges, rideable elevator roof and pancakes

Base/rollback: merged PR #70, `78475a7be0ec1ba1b4c7aa6d3fc1b069d00c7edf`. Branch: `agent/solid-awnings-lift-roof`. The generated receipt records the exact review head and PR.

## Behavior

- Upward player contact with the actual awning, rooftop lip or gray-step underside ends the jump, gives a brief spark and uses the existing quiet landing cue. The animation's opaque cap owns contact. There is no head-contact damage or stun. Facades remain scenery; deliberate Down + Jump still descends ordinary ledges.
- The illustrated cabin roof is a complete slab with top, bottom and sides. Relative swept collision catches rapid actor movement and a moving carriage. The player, virus, corrupted, Firewall, drone and boss can land, stand and move on it, and are carried once per frame in both directions. Down + Jump cannot bypass this hard roof. Static-rooftop exit remains safe when the roof returns.
- The boss takes warned leaps onto/around the roof instead of walking through it or becoming stuck behind it. Leaving the roof clears the edge before descending. Boss damage, warning/recovery rules and checkpoint health are retained.
- The descending floor catches enemies below it, immediately records their normal defeat and stretches their frozen sprite to 185% width and 8% height over 180 ms. The remains stay visibly beneath the illustrated base, then fade after a total 3.2 seconds. Virus, corrupted, Firewall and drones participate; passengers on the floor/roof do not. The existing boss combat and player damage rules remain separate from this ordinary-enemy environmental defeat. The same guarded death transaction grants score, mission progress and repair-carrier drops once.
- The Tower middle step moves from x=3260 to x=3100. Its visible support and collider move together, opening the jump around the Crown underside. Jump around the Signal roof lip, climb the Firewall step from the canopy's left edge, and reach Tower/Broadcast crowns via the Relay and upper steps. The lower Tower/Broadcast awnings remain reachable by deliberate descent. No extra platform, art dependency, movement ability or input binding is added.

## Verification

`npm test` includes `check:solid-ledges`. The focused production-module harness covers both facings at every static underside, full-slab side sweeps, all six actor types carried up/down at 30/60/120 Hz, pause/reset, hard-roof drop protection, four enemy types crushed once, sprite compression, score/repair accounting, negative cases and a long-frame floor sweep. Existing full gameplay integration covers rooftop exit/return and boss checkpoint rematch. The climb harness retains 63 real movement actions and now approaches solid lips or descends overhangs instead of requiring forbidden upward passage. Boss traversal across the district remains covered at all three frame rates. `npm run check:syntax:all` checks every JavaScript file.

Inventory changes are limited to the added test file and shifted EnemyManager/player source-line metadata. Existing script order, external asset pins and exception policy are retained.

Native review: `SOLID_LEDGE_REVIEW=1 node tools/render-level1-rebuild.cjs OUTPUT`. Production draw/update owners and the existing prepared sprite/scene bytes render `review-solid-ledges/solid-ledges-smush.mp4`, `awning-bonk.webp`, `roof-riders.webp`, and three before/pancake pairs. Host image/sprite boundaries are adapted; this is not hosted Makko or physical-controller acceptance.

## Focused Makko review

1. Jump beneath the striped awnings and gray steps. Confirm the cap bonks the visible underside and movement remains responsive.
2. Jump toward each side of the elevator roof, land on top, walk across it and ride in both directions. Repeat with enemies and the boss present. Check a full cabin ascent, walk-off onto the Firewall rooftop, pause/resume and return.
3. Lure enemies beneath the returning elevator. Confirm the broad flattened silhouette appears under the base, score/defeats advance once and a marked carrier still drops its repair. A rising/stopped lift and riders must remain safe.
4. Traverse the upper route through Relay → relocated Tower middle step → Tower high step → Crown → Broadcast Crown. Follow with a boss retry and pursuit across the elevator.

After owner acceptance and merge, sync/publish the resulting main revision through the existing Makko project flow and refresh the source pack from that exact revision. This draft does not claim a live deployment.
