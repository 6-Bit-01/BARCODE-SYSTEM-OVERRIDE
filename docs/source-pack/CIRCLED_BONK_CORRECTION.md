# Only the red-circled objects bonk

Base/rollback: merged PR #72, `0c428a053225dfa68b42fbb7464708f020daba76`. Branch: `agent/circled-bonks`. The generated source manifest and test receipt identify the exact published revision and PR.

The three original owner screenshots were recovered and visually inspected. The owner explicitly rejects the extra bonks and the blocked upward routes caused by making all ledge undersides solid. This correction keeps an explicit four-object list and removes the generic underside fallback.

| Owner photo | Circled object | Surface ID | World position / width | Underside depth |
| --- | --- | --- | --- | --- |
| `6396ac76-9f48-4504-be08-62bee16a4f4f.png` | Striped awning above the pink Signal Alley storefront | `signal-awning` | x 736, y 492, w 529 | 74 |
| `e382c7d3-a7c0-44c4-a35a-5e881541dc09.png` | Striped awning on the tall building right of the elevator | `tower-awning` | x 3292, y 502, w 402 | 78 |
| `e9f26076-f113-40cd-ae85-4901d6fbdb6f.png` | Left circled small gray step, beside the Cache storefront | `cache-maintenance-step` | x 1390, y 410, w 128 | 14 |
| Same two-circle photo | Right circled small gray step on the Firewall building | `firewall-low-step` | x 2130, y 430, w 148 | 18 |

Every other static stage surface permits upward passage and still supports landings from above. This includes other awnings, rooftops, crowns, high steps and the terminal. Their positions and the player's jump physics are unchanged. The elevator roof is separately authorized as a hard moving object for the player, enemies and boss; its collision, support/carry and pancake behavior remain intact.

## Regression evidence

`check-solid-ledges.js` now compares the enabled bonks with the independent four-ID expectation above, tests their real jump contacts in both directions, and checks upward sweeps through all unmarked static ledges. This prevents adding unapproved surfaces from silently expanding the test's own expected list. The same harness retains moving-roof and pancake tests for all actor types.

`check-level1-rebuild.js` restores direct upward routes from the Signal and Tower awnings to their roofs and from the Firewall canopy to its high step. It also checks Cache maintenance step → Cache awning and Broadcast low step → high step. The 24 routes run at 30/60/120 Hz, for 72 full player trajectories. `check-level-finale.js` again requires the unmarked upper route to retain full jump height.

Required gates: `npm test` and `npm run check:syntax:all`; their actual outcomes belong to the generated receipt. No new art, assets, dependencies or timers. These production-module tests use explicit host/device adapters and do not replace physical controller or Makko playtesting. See the current `ACCEPTANCE.md` route. Preserve merged #72's drop protection, boss-win protection and twelve-second allies.
