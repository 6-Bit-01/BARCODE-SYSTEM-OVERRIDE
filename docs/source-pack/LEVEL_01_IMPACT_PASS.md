# Level 1 impact and discovery pass

Owner approval: “Alright let's proceed,” following the expanded ten-item proposal. Implement all ten together on `agent/level1-impact-discovery`, based on merged PR #43, `51b65d4cd71d369b05003ddaa83cfe6f88fe348b`. One combined draft PR; owner Makko playtest before merge. Earlier incomplete polish lists do not substitute for this scope.

## Exact approved scope

1. Different camera reactions: directional hit kicks, downward heavy landings, stronger stomps, rolling destruction rumble, stable HUD/timing target and exceptional-event push-in.
2. Substantial contact: brief animation holds, bold contact shapes and cores, directional material debris and matching sounds. Virus data chunks, Corrupted strips, Firewall hot metal; debris survives defeated actors.
3. Threshold attack variety: tight pulse, sweeping waveform, branching discharge. Tune actual target behavior with readable anticipation and impacts; preserve successful rhythm judgment, boss/Jammer rules and Amp ownership.
4. Rhythm transforms the street: stronger screen equalizers, hit-responsive signs, light along cables and pavement, sustained-combo intensity and musical phrase build/release.
5. Movement/scenery react: takeoff and force-based landings, foot sparks, rooftop contact, stomp-rattled signs, vent coughs, hanging cable swing and passing vehicle light.
6. Four distinct encounters: Signal Alley reconnecting lights; Cache Overpass traffic shadows/rooftop arrivals; Firewall Plaza heavy entrances/metal; Broadcast Gate displays building toward the Jammer. Preserve quotas/gates; visibly celebrate clears.
7. Jammer/boss payoff: strain, distortion, breakup and ordered neighborhood recovery; boss entrance/major attack identity and persistent restored district. Preserve the existing cinematic/mission sequence.
8. Compact comic HUD and predictive rhythm: top-left approaching notes and fixed hit target; smaller information blocks, health/Amp/combo feedback, BARCODE styling.
9. Fourth-wall moments: heavy strikes knock captions crooked, a Studio Rat crosses the panel margin with an object, crew responds to actual inspection, major clears briefly reframe the street; authored callbacks.
10. Between-fight discoveries: Studio Rat, Cliff maintenance clue, WittyF0x route observation, inspectable venue detail and optional crew responses, tied to existing traversal/Amp/lore routes.

## Implementation checkpoints

- Combat/camera: 1–3 and movement hooks. Verify deterministic target selection, preview parity, damage rules and bounded frame-owned effects.
- Scenery/encounters: 4–7 and fourth-wall staging. Preserve all mission, boss, collision and lifecycle invariants.
- HUD/discoveries: 8–10 integrated with prior checkpoints. Verify input ownership, persistence and visual readability.

Use existing art and code-native effects. No new runtime dependencies, canvas contexts, listeners or animation loops. Keep the corrected intro. Save facts only on real inspection; do not expose the secret collection purpose or invent ending rules. Ordinary movement, H hacking, tutorial Space and musical judgment remain unchanged.

## Required acceptance

Full `npm test`, all-JavaScript syntax check, consequential production-code regression tests and visual fixtures. Browser intro regression must remain green. Generated fixtures are diagnostics, not proof of Makko feel or audio synchronization. Review all ten items together, then perform the AGENTS owner playtest before merge. Update the maintained Source Pack v5 from the committed revision and publish exact base/head, CI and rollback evidence.
