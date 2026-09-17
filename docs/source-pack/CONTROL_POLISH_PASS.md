# Control alignment and focused finishing pass

Base/rollback: merged #83, `c5be7a9ac1c2a1ef6609ce69e5714a5c9f8b2698`. Branch: `agent/control-polish-optimization`. The owner requests aligned control buttons on their black squares and the remaining discussed final touches/optimizations.

## Alignment and finishing

The enemy marker drew its backing at fixed coordinates but inherited the caller's text baseline. A middle/top baseline moved the glyph below its intended center. It also hard-coded Y for every connected controller. The marker now explicitly owns its text state, centers visible glyph bounds inside the backing, and uses the actual saved action mapping/device labels. Wider shoulder labels receive enough backing width. Ally/reboot/locked labels also set their baseline explicitly.

A shared Canvas text helper centers and fits the actual glyph ink, restores caller state, and has a middle-baseline fallback for hosts without ink metrics. The same helper covers objective control badges, normal/compact hack keypads, and Begin Level. Existing colors, backing locations and hit regions remain. Difficulty and campaign return help use the selected controller's button names; campaign text explicitly owns its baseline.

The wider audit found the earlier district restoration, combo/impact feedback, pickup assembly, sliders/accessibility settings, results and lore work already implemented. PR #82/#83 also completed the boss/music/campaign work. This pass preserves those features and the newer moving/fading smart panels; it does not redo the old polish list. Gameplay, enemy AI, score/rewards, levels, lift/traffic behavior, art and audio assets, music timing/transport/judgments and dynamic mix remain unchanged.

## Targeted performance work

- Project current actor bounds once per smart-panel request and share them across shape candidates. Deduplicate clamped candidate coordinates and sum overlaps without a temporary array per candidate. Ordering and tie-breaking remain the same; no actor-position cache survives the request.
- Reuse the tutorial's complete-line measurements until the resolved content changes. Controller-token changes and restart invalidate the bounded one-entry cache. Typing and moving-panel ownership remain live.
- Select the ready hijack marker once per enemy draw pass, instead of searching the crowd for every enemy. Clear the temporary reference even if drawing throws; the next pass selects from current state. Input still performs its own authoritative query.

Measured operation counts: a congested 12-actor, three-shape request drops from 60 actor projections to 12. A 12-enemy draw pass makes one target query. These are deterministic workload reductions, not a claim about Makko FPS or host latency.

## Evidence and scope

`npm run check:control-polish` covers keyboard, Xbox, PlayStation and remapped shoulder prompts; target refresh/cleanup; one projection per actor; and tutorial measurement reuse/invalidation. For the before/after layout comparison, run:

```sh
CONTROL_POLISH_COMPARE_BASE=c5be7a9ac1c2a1ef6609ce69e5714a5c9f8b2698 node tools/check-control-polish.cjs
```

This compares the previous production module against the edited production module in 320 moving/crowded/offscreen placement states. All results match. The optional comparison needs that Git object; normal CI checks do not depend on historical checkout depth.

`CONTROL_POLISH_REVIEW=1 node tools/render-level1-rebuild.cjs docs/source-pack/review-control-polish` uses bundled Oxanium and native Canvas. It renders four production enemy-prompt views and ten glyphs under four inherited baselines. All 40 raster comparisons match; visible ink centers stay within one pixel. `native-control-metrics.json` records the results. Native images use adapted Makko art boundaries and do not establish hosted or physical-controller acceptance.

The script graph is unchanged. The inventory adjustment is only the moved `window.enemyManager` declaration. Full-suite, all-file syntax, CI and exact published revision are recorded in the generated receipt. No new runtime asset, dependency, timer or input owner is introduced.

## Makko review and deployment

Import the exact draft head into a duplicate Makko project. Check H, Xbox Y, PlayStation triangle and a remapped shoulder button above enemies at street and roof height, while the camera zooms and the elevator moves. Confirm ally/reboot labels and release prompts. Check objective badges, normal/compact hack keypad, Begin Level, and campaign return help. Use the real selected controls to confirm each label matches its action.

Move/jump through dialogue and hack-target overlaps: text must remain readable, glide/fade around actors, retain unread lines and keep keypad input safe. Resume after pause and retry once. Recheck boss victory, elevator exits and the #83 music briefly. Record SHA, device/controller, PASS/FAIL and a short prompt/panel clip. AGENTS.md's owner Makko gate still applies before assistant merge.

After acceptance and merge, import/redeploy the actual main merge commit into Makko, fresh-load, and repeat that focused route. Retain the #83 base import for rollback. Later playable levels, authored later music, final ending/reward rules and hosted-device performance acceptance remain outstanding.
