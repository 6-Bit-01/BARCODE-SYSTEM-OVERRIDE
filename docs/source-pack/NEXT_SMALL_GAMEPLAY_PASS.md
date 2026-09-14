# Recommendations from the current Level 1 build

## Superseded by the selected hijack implementation

The owner selected enemy hijack. The current implemented scope, concrete repair placements, code-native art and test route are in `ENEMY_HIJACK_REPAIR_PASS.md`. The proposals below are historical; their “keep stun” assumption is not the chosen H behavior. Puzzle-time slowdown remains separate from the new allegiance reward.


Reviewed against merged PR #51 (`ea2921960477e38c74740dda378fcb513a8f1cc1`) and the narrow walk polish. The owner wants the existing game to look/play better, without a large redesign. These are proposals except for the walk work recorded in CURRENT_STATE.

## What the current build actually provides

- Player health is three bars. Successful H puzzles restore one bar, emit an existing override pulse and set a ten-second cooldown. H has tutorial ownership, grounded availability, audio/UI/result feedback and gameplay lifecycle integration. Changing its reward needs the tutorial and feedback updated together.
- The seven authored upper surfaces are Signal Awning, Cache Awning, Firewall Canopy, Relay Rooftop, Tower Rooftop, Tower Awning and Broadcast Awning. The two-hit Signal Lift, rooftop Signal Amp, one-time Studio Cat and lore discoveries already exist.
- Normal ground movement is 300 px/s. Jump buffering, coyote time, variable jump height and contact/landing feedback already exist. The current motion issue is chiefly frame registration and cadence; adding more movement abilities is unnecessary.
- Cars are randomized parallax scenery with separate background/foreground lighting. Their paths do not currently define fair player-world collision lanes. The camera follows horizontally; a substantial cloud layer would require more camera/world work.

## Recommended next bounded gameplay pass

| Change | Proposed behavior | Why it fits |
| --- | --- | --- |
| Rooftop health | Start with two visible, guaranteed +1 repair pickups on reachable upper-route stops. Leave unused repairs available when the player is full. | Makes exploration useful and avoids making survival depend entirely on luck. Exact placements/availability require playtest tuning. |
| A marked carrier | Use one visually marked member of an existing enemy type carrying a repair, rather than producing a whole new enemy class. | Gives players a readable tactical target and a reliable ground-level recovery opportunity. The type and encounter are not selected yet. |
| H's role | Remove the health reward only as part of the complete replacement. Keep its existing override/stun purpose; environmental terminals/route interactions are a later extension. | Moves recovery back into traversal/combat while retaining a useful hacking identity. Tutorial, prompts, repair-result animation and reward sound must change together. |
| Upper-route readability | Add a small number of tangible stepping props where the current single-jump route feels tight, and make the next landing/reward visible from below. Keep clear ways down. | Improves the seven existing surfaces before creating a second full map. Verify reachability, gate boundaries and camera framing with the current jump. |

Do not begin with pure random health placement or a guaranteed drop from every enemy of a common type. That makes recovery unpredictable or farmable and can drown out the rooftop incentive. Chance-based extra drops can be considered after the guaranteed supply is playtested. Preserve boss retry behavior and prevent repeated collection/retry from duplicating rewards.

## Later, small optional additions

- **Cloud secret:** a short hidden bonus room or skyline pocket, teased through rooftop scenery. Keep it optional within Level 1, not an eighth major campaign level. A full vertical sky stage is outside the current small polish scope.
- **Traffic hazard:** one clearly authored rooftop crossing with advance headlight/shadow/audio warning and safe recovery space. Keep decorative background traffic scenic. Do not attach damage to randomly spawned parallax cars.
- **Further animation review:** check turn reversals, jump-to-idle/walk recovery and rhythm-entry transitions in Makko after the walk fix. Retain responsive controls and recognizable whole-body actions; avoid a global speed or smoothing filter across every clip.

The recommended order is current walk acceptance, then the health/upper-route pass, then one optional secret or traffic crossing if the level benefits from it. Existing intro, Jammer/boss sequence, HUD, cat event and gate work are completed foundations, not work to redo. Larger campaign services remain separately scoped.
