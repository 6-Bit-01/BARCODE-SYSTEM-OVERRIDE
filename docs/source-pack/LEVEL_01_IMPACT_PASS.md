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

Intentional baseline change: one frame-owned module, `src/game/level-01-stage-fx.js`, is inserted after progression and before the coordinators; later script indices shift by one. It adds no external assets, runtime dependencies, canvas contexts, timers or listeners. Regenerate the inventory only for this reviewed graph change. Existing Amp tests now place the target at 410px, beyond the newly approved combo-5 waveform, and still require charge depletion to remove that reach. Preview cardinalities reflect the approved threshold geometry, with exact damage/preview parity retained. Damage-camera and lore-flight destination assertions follow the new 7px hurt profile and compact HUD.

Full `npm test`, all-JavaScript syntax check, consequential production-code regression tests and visual fixtures. Browser intro regression must remain green. Generated fixtures are diagnostics, not proof of Makko feel or audio synchronization. Review all ten items together, then perform the AGENTS owner playtest before merge. Update the maintained Source Pack v5 from the committed revision and publish exact base/head, CI and rollback evidence.

## Completed implementation and evidence

All ten items are integrated in this single review. `Renderer` owns bounded typed motion; `PlayerCombat` owns pulse/wave/chain target selection and preview parity; `CombatFX` owns material and foot impacts; the existing frame updates `Level01StageFX` for scenery, encounters and discoveries. Parallax still places readouts inside the original glass. `RhythmSystem` exposes predicted note positions without changing judgment. `LoreCollection` unions independent lore/Easter-egg facts on the existing compatible save.

Three implementation checkpoints cover combat/camera, reactive stage/encounters/discoveries, and compact HUD/integrated verification. Full local tests and all-JavaScript syntax passed. The new production check covers thresholds, directional reach, two-hop bounds, one-charge transactions, camera direction/decay/pause/settings, protected roof arrivals, E/LB ownership, concurrent saves, calibration, final-hit visibility and retry cleanup. Six native Canvas scenarios use the original foreground and five original sprite sheets. Their fixture adapter does not certify Makko animation or audio. Production render matrices prove the timing target is outside world zoom/shake. No intro art or source URLs changed.

Scope refinements found in review: remove the old duplicate floating judgment; place boss guidance outside the attack feedback strip; leave 620ms for the final impact before the result card fades in. The maintained v5 export must come from the final committed head and record CI/Makko status accurately. Source ZIP identity refresh remains dependent on the available persistent-file connector; CI provides the exact committed export.

PR #44 continuation finishes the two remaining presentation corrections: hack repair packets/outline now match the compact health bar, and result counters wait through both the 620ms final-hit hold and 240ms card fade. One progression-owned timeline governs the fade and full staggered count-up, capped at 2060ms. The existing production regression covers visibility, count-up, pause and rematch cleanup; `node tools/render-impact-followup.cjs` produces the native UI diagnostic `verification/impact-pass-hud-results.webp`. No new gameplay/art change, new PR or Makko acceptance is implied.
