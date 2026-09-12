# Roadmap — intro correction after merged PR #39

Base: **0d1882f6b6eebf6fc5704d8a3270f2a6b1fb7354**, merged #38; runtime through #37 is retained. Finishable Level 1, combat/animation/audio repairs, combined polish, discovery/traffic/targets and written lore/archive are merged. Their old checklists are history, not the next tasks.

`CONTINUATION_PLAN.md` is the detailed current checklist/evidence trail. `CAMPAIGN_STORY_MAP.md` carries the full working story; `EASTER_EGGS_AND_CAMEOS.md` and `ASSET_AND_PLATFORM_PLAN.md` carry supporting requirements.

| Order | Deliverable | Exit evidence | State |
|---|---|---|---|
| A | Full story/cast/reveal/collectible/inspiration map and current handoff | Seven connected levels, 28 stable lore purposes, corrected cast, required/optional payoffs, exact source status | Merged in #38 |
| B | Representative existing-art crew/panel sequence; remaining controller, committed-enemy, boss-cue, HUD, camera and calibration improvements | Connected scene with later payoff, production logic checks and focused owner Makko route | Merged as #39; actual intro correction now in review, HUD/rhythm follow-up next |
| C | Campaign adapter, extend existing save, keys/modules/results/intermissions and second-song mixer proof | Clean leave/re-enter, old discoveries survive, resume progress, no resource leaks, independent source roles | Before full new genres |
| D | Contra slice first; road and first-person proofs; puzzle and capped Sample-party loops | Roughly five-minute useful proofs with threat/music relationship, pause/exit/save-return and measured asset geometry | Planned; production order differs from story order |
| E | Complete compact stages with story bridges, crew roles, selected eggs, lore/rewards and appropriate music | Finishable stages, required plot on main route, persistent discoveries | Planned |
| F | Finale preparation, prior-item/crew payoffs, 9 Bit, authored resolution and full-game acceptance | Zero-module win route, recoverable final save, transitions and ending paths checked | Exact outcomes unresolved |

Use coherent combined reviews, not a separate PR per tiny effect. Stage A changed documents only; Stage B was implemented in #39 but missed the actual intro request. INTRO_OVERHAUL.md records that correction; the owner ordered HUD/rhythm/attack-variety work next, before Stage C. Exact scenes/assets and ending/puzzle/device choices are resolved when concrete designs are ready; retained decisions need not be reapproved.

## Infrastructure and performance

- Extend the existing save slot/envelope and lore IDs. Persistent lore/settings exist; full campaign resume/routing/ending evaluation do not.
- Resolve profile-owned mixer roles before the second song. Fixed-grid/no-grid support is not a completed tempo-map/cue engine.
- Preserve one lifecycle/frame/input owner and dispose resources on exit. Introduce shared infrastructure with a real new consumer.
- Profile the complete scene on its target host/device before increasing effects/decoded art. Original traffic optimization is complete.
- Standalone migration remains deferred. The bounded mobile proof is not a full port or engine-selection decision.

## Stage size and assets

Aim for seven polished compact levels. Earlier v4 first-clear estimates of roughly 12–18 minutes for action/puzzle/racing, 20–30 for the party stage and 30–45 for the finale are historical budget guesses, not promises. Playtests determine useful length.

Prove controls, camera, collision, one threat, one musical relationship and lifecycle/save-return before large art orders. Start the Sample stage with 6–8 families, one settlement and one route/battle loop. Produce assets to measured needs using the owner's Makko workflow; no blanket overhaul follows from the story direction.

## Historical references

`SELECTED_PASS_CHECK.md`, `RESPONSIVE_COMBAT_PASS.md`, `MAKKO_HEALTH_CHECK.md`, `POLISH_PASS.md`, `DISCOVERY_PASS.md` and `LORE_ARCHIVE_PASS.md` explain the merged baseline. `OVERHAUL_PROPOSAL.md` retains optional earlier ideas. Use their actual completed/deferred status rather than copying old next-step headings.
