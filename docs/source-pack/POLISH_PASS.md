# Approved combined polish pass — September 12, 2026

Owner approval: "Agreed. Lets lock it in. Update or make a new source file pack and keep it updated. Then lets continue with the plan" after the recommendation to deliver 1–9 together with particle/logging cleanup. Base and rollback: merged PR #34, `85a0b32c530d9fc04fab91ef4e3d18ef88ee8249`. Branch: `agent/level1-combined-polish`. Initial status: scope locked; implementation pending. Later review status and actual evidence belong in CURRENT_STATE and the generated manifest/receipt.

| # | Approved change | Acceptance |
|---|---|---|
| 1 | Reconnect impact shake with controlled strength/time; highlight actually lost health segments and hit direction. | Frame-rate independent bounded shake; smaller events do not replace a stronger impact; only accepted damage produces health-loss feedback. |
| 2 | Recognizable enemy warning symbols and ground arrows for committed charge direction. | Cues match the existing Corrupted/Firewall/Swooper windup and direction; no changed AI, damage or contact rules. |
| 3 | Animated amplifier/barcode pickup symbol, announcement, charge pips and depletion effect. | Pickup/use/depletion and checkpoint/full-reset state agree with actual Amp charges. |
| 4 | Barcode energy gates with scanning lines, electrical flicker and short unlock collapse. | Effects follow the actual encounter gate lifecycle and never control collision/progression. |
| 5 | Different storefront equalizer patterns, downbeat accents, traveling curb lights and sustained-combo scenery. | Use continuous MusicTransport; quieter boss decoration; restoration behavior retained. |
| 6 | Sparse vent steam, dust, cable sparks and neon pavement spill. | Existing city art and coordinates; bounded/cached decoration with offscreen culling; readable combat warnings. |
| 7 | Clearer rooftop fragment beacon and assembled data symbol flying to the counter. | Actual collection and existing rewards/lore unchanged; UI flight follows existing camera/zoom; no extra collection. |
| 8 | Pause controls/reminder, Music/SFX sliders and saved shake/flash/CRT preferences. | Keyboard and pointer operation; paused game remains still; no resumed movement/attack from menu input; safe storage failure and reset behavior. |
| 9 | Animated results breakdown for score, best combo and fragments. | Read existing completed-run data; retain all parts of a run across boss retry, clear on full restart; no invented accuracy or time stats. |

Also remove per-frame particle/collection logging, cull decorative particles and cache repeated glows. No performance percentage is promised without host measurements. Use existing owners and frame loop, no parallel timers, no gameplay mutation in draw code, no external artwork/audio changes and no dependencies/bundler rewrite.

## Follow-ons, not selected for this pass

10. Recover animated traffic from existing multi-frame GIFs using compact animation sheets.
11. Read-only rhythm-target preview following authoritative range/guard rules.
12. Deterministic authored lore identities/text and a persistent reading archive.

## Manageable implementation checkpoints

The owner explicitly requested smaller pieces after repeated freezes. Retain one final combined draft PR; save the current v5 source archive after each completed chunk.

| Chunk | Scope | State |
|---|---|---|
| 1 | Items 1–3: damage/impacts, warnings, Signal Amp | Implemented; automated evidence in the export receipt; Makko pending |
| 2 | Items 4–7: gates, musical scenery, atmosphere, Lost Data | Implemented; automated evidence in the export receipt; Makko pending |
| 3 | Items 8–9: pause/settings, completion payoff; remaining particle/logging cleanup | Implemented and validated; source receipt identifies the exact checkpoint |
| Combined review | Full verification and one draft PR; owner Makko acceptance before merge | Automated checks passed; combined draft review; Makko pending |

All implementation chunks are complete. Review the one combined draft using CURRENT_STATE and PR_DESCRIPTION; exact publication status/head/PR are in the generated manifest. Preferences expose/persist `BARCODE_RENDER_QUALITY.screenShake`, `.flashes` and `.crtPostEffects`. Scenery retains its last music sample while paused, the menu uses a cached scene, and completed-run statistics have their own presentation delta in the existing RAF. Existing owners remain authoritative for rewards, collision and lifecycle.

## Preservation and delivery

Preserve PR #34's public Makko animation calls and restored audio; locked intro/art/music, single jump and opposing-input behavior, tutorial-owned Space and H/R locks, continuous background rhythm, grounded stance, ordinary lethal stomps, calibrated geometry, two-hit lift, 20 mission defeats/four groups, sixteen-hit environmental Jammer and current boss balance/retry.

Record a source-pack checkpoint before implementation and refresh the same v5 archive after review and merge. Publish the complete pass in one draft PR, report exact base/head and real test limits, and retain owner Makko acceptance before merge. The existing merge-maintenance automation is enabled; it maintains exports only and cannot implement, merge or deploy.
