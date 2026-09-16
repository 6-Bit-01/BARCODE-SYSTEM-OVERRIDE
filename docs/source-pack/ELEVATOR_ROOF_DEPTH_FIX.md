# Elevator roof visibility

Base and rollback: merged PR #73, `8fc2f8ea838d1dc901b97c7b7c93581459451ddf`. Branch: `agent/elevator-roof-depth`. The owner reports an enemy's lower body appearing behind the elevator deck.

The existing foot plane is correct: the player stands on the illustrated deck and every actor stays supported during lift travel. EnemyManager previously drew every enemy before progression drew the complete cabin, so the later roof pixels covered enemies' feet and legs. This fix splits that existing enemy draw into two passes. Enemies over the roof, including airborne approaches/departures, draw after the cabin. Other enemies retain their previous depth. Each actor draws once, with the existing type order, inactive filtering and camera culling within each pass.

There are no collider, foot-height, platform-position or gameplay changes. Only the four red-circled static objects retain bonks; the hard moving roof, all riders, pancakes, deliberate controller descent, protected victory and twelve-second allies remain.

## Evidence and review

- `tools/check-solid-ledges.js` exercises real movement plus real manager/coordinator render ordering for virus, corrupted, Firewall and drone on rising and returning lifts. It covers airborne transitions, actors below the roof, inactive/culling cases, one draw per actor and an unavailable lift. Existing roof collision/carry checks still cover the player, all four enemies and boss at 30/60/120 Hz.
- `tools/check-street-depth.js` retains ground scenery ordering and adds the roof pass. The ownership assertion names the new explicit first-pass call. The baseline update changes only the enemy-manager source line, from 2017 to 2027.
- Reproduce the native artwork review with `LIFT_ROOF_DEPTH_REVIEW=1 node tools/render-level1-rebuild.cjs /absolute/review/path`. `review-roof-depth/roof-corrupted.webp` directly matches the reported lower-body problem; the other three images cover the remaining enemy types. These use the production game modules, bundled art and a native canvas/Makko sprite adapter. They do not establish hosted Makko acceptance.
- Full `npm test`, all-JavaScript syntax and GitHub CI results, exact tested/published revisions and tree identity are recorded in the generated receipt.

Owner review: import the exact PR revision into Makko, observe an enemy on the rising and returning roof, then approach/leave the edge. Confirm full feet on the deck and that the player can still ride inside. Preserve the four-circle bonk restriction. Keep this draft unmerged until owner acceptance; rollback is the base above.

The accompanying `TUTORIAL_FLOW_PROPOSAL.md` answers the owner's tutorial design question. It is a proposal, not a runtime tutorial rewrite in this fix.
