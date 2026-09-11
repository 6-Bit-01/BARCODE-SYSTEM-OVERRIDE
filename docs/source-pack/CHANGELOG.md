# Changelog

## September 11, 2026 — District restoration and selected-pass completion

- Check merged PR #31 against the original selection; preserve the exact item mapping in `SELECTED_PASS_CHECK.md`.
- Continue the planned district payoff: encounter clears stabilize local displays, four-hit Jammer milestones reduce interference, and destruction sends one world-anchored restoration wave through the existing boss cinematic.
- Keep the district restored on boss retry/rematch, reset it on full restart, and freeze its effects during pause. Eleven measured foreground overlays reuse existing artwork and the music clock.
- Connect the missing heavier stomp burst to actual ordinary-enemy and successful cyan boss head contacts. Keep guarded effects small and preserve damage/rebound/timing rules.
- Add production checks for the four encounter clears, Jammer stages, wave/pause/retry/reset and draw transforms, plus contact placement, one defeat/burst and guarded repeats. Base/rollback: merged PR #31 (`b9d7ac4`). Branch: `agent/level1-district-restoration`; Makko acceptance pending. No new assets, audio or dependencies. The stomp correction is included in this combined build, not published separately.

## September 11, 2026 — Animation, mode and effects pass (draft review)

- Continue the owner-approved next pass from merged PR #30 (`1897c4e`).
- Consolidate player clip transitions; remove delayed rhythm-animation restart callbacks and repeated same-clip walk restarts. Preserve calibrated sprite geometry.
- Add the grounded Rhythm Mode stance, immediate R exit, airborne-entry feedback and foot-level beat ring. Lift travel and forced rebounds remain functional; retry starts outside the stance and the Jammer exit fix remains intact.
- Redesign terminal presentation with distinct phases, readable codes, countdown and repair/failure feedback. Prevent damage cancellation from restoring suspended Rhythm Mode; preserve the existing hack rewards and enemy slowdown.
- Add surface-aware contact shadows, landing sparks, temporary attack/stomp echoes, lift-charge energy and restrained foreground sign pulses using the existing clock/art.
- Add focused production-module coverage; update superseded airborne/locomotion assertions to test grounded entry and preserved ordinary movement. Baseline inventory changes are limited to the new test file and inspected source-line locations; runtime script graph, external hosts and syntax debt are unchanged.
- Existing art/audio unchanged. Makko acceptance pending. Rollback to merged #30. Larger environment/combo/settings/lore work and standalone migration are deferred.

## September 11, 2026 — Jammer Rhythm Mode exit repair (review)

- Owner found active Rhythm Mode bleeding through Jammer destruction into the next section.
- End active mode and clear the final attack pose at destruction; preserve background rhythm/music.
- Reuse progression suppression for rhythm entry through the cinematic and level completion.
- Extend boss integration coverage through every cinematic phase and subsequent fresh activation; align the isolated pose test with the new owner requirement.
- Record requested broader animation, rhythm, hacking, effects and inexpensive improvements in `OVERHAUL_PROPOSAL.md`; these are not silently implemented.
- Base: merged PR #29 (`45441e1`). No art/audio changes. Unmerged review; owner Makko acceptance pending. Rollback: return to the base revision, which retains the reported mode leak.

## v5 musical combat pass — September 11, 2026

- Owner approved the combined boss/ordinary-enemy/feedback pass after a positive PR #28 playtest exposed an endless-bounce exploit and excessive boss difficulty.
- Rebalanced the boss and separated escalation; musical phase boundaries use the existing transport. Safe outward rebounds plus landing-based stomp rearm close the passive win loop.
- Added authored charge/brace/recovery patterns, committed swooper warnings and enemy cues. Existing sprites, music, tutorial rules, mission structure, lift and Jammer are preserved.
- Added player-local timing, authoritative EARLY/LATE feedback, immediate Rhythm Mode loss notice and bounded hit/guard/stomp feedback.
- Extended production-module coverage for physics/frame-rate behavior, musical boundaries, actual single-jump double-pulse clearance, enemy commitment and lifecycle reset. Baseline inventory updates reflect inspected source-line movement only.
- Unmerged playtest branch; Makko visual/audio/balance acceptance pending. Standalone migration remains a subsequent milestone.

## v5 general polish — September 11, 2026 — before the next playtest

- Owner expanded the request to improvements across Level 1, beyond focused boss/test helpers. Added this pass to PR #28.
- Unified ordinary enemy sprite and hitbox transforms without changing contact margins; fixed the existing Firewall attack scale mismatch.
- Added clear attack-result feedback, encounter-local progress/hints and route direction; hid completed objectives while retaining their completion records.
- Added four Jammer signal stages and milestone impacts across the existing sixteen-hit sequence.
- Extended production-module checks for sprite/hitbox transform agreement in both facings, actual attack outcomes, feedback expiry/reset, objective progress and stage/destruction deduplication.
- Kept existing movement, enemy behavior/packet timing, art, music and progression requirements. Live Makko contact and presentation acceptance remain pending.

## v5 repair — September 11, 2026 — first owner playtest

- Recorded merged PR #27 at `a69384e5c647e0f1f457564ccbb3c29cd37e2059` and the owner’s failed acceptance findings.
- Prevented tutorial/pre-trigger gate bypass; kept the boss fixed in world space through camera return.
- Recalibrated boss foot rows and neutral body scale from the existing sheets; corrected both runtime anchor paths and manifest scale handling.
- Added safe guarded/repeated boss-stomp rebounds with cyan-only damage. The reported instant death remains a Makko verification item, not a claimed reproduced full-health kill.
- Added six safe opposite-half Jammer slots and a readable two-beat lift prompt.
- Extended production-module checks for boundaries, every placement slot, actual sprite draw arguments, offscreen pursuit and guarded/cyan landings at one and three health. Updated obsolete tests that explicitly required camera-carried boss motion.
- Regenerated the baseline inventory only for inspected source-line shifts; no runtime graph or asset changes were hidden. Current repair is unmerged pending owner Makko acceptance.

## v5 — September 11, 2026 — Level 1 completion milestone

Owner approval: “HELL yeah. Let's lock that in with a new source zip that you regularly update and let's proceed.”

- Established PR #25 (`7788ebfab4d6231c18229bef9571d6b97b676764`) as the verified merged starting point, replacing v4's obsolete PR #3 snapshot.
- Restored the later approved contract in active documentation: twenty-enemy mission, destructible sixteen-hit environmental Jammer, real Rhythm Combat Mode, judged Down attacks, lethal ordinary-enemy stomp, tutorial H/R locks with continuing background timing and two-hit lift.
- Scoped PR-001's documentation/static-only restrictions to their historical pass; preserved Makko verification before merge and documented the later established production-code VM validation approach.
- Removed obsolete design-prose assertions from the frame-ownership check while retaining its runtime assertions.
- Locked in the next direction: finishable Level 1 boss/retry/completion, then campaign/save/lore/music foundation and compact genre proofs.
- Implemented the first 12-health boss encounter using existing sprites: readable ground-pulse warnings, cyan rhythm/stomp counter windows, a second pulse below half health, and a real Level 1 completion screen.
- Added a boss checkpoint that restores health, encounter state and entry score without replaying the mission or restarting music; victory offers a rematch or full restart. Focus loss clears latched retry keys, and lifecycle resume preserves terminal simulation state.
- Added production-module boss checks for the mission handoff, timing/damage, stomp, pause, death, retry, completion and reset; the complete existing suite and all-JavaScript syntax checks pass. Exact-revision evidence is generated with the export; Makko remains pending.
- Retained the seven-level working map, original-four roster, simulation/9 Bit boundaries, 28-piece lore plan, Sample collection, separate Full Mix arrangement, art reuse and deliberate asset workflow. Provisional titles/identities/endings stay marked.
- Added source-archive maintenance protocol, exact-revision manifest/hash support and preserved historical visual/asset references without nested old ZIPs.

At v5 creation, the boss implementation was unmerged and awaiting owner Makko acceptance. PR #27 subsequently merged; the repair entry above records that merge and the owner’s unsuccessful first playtest. Do not infer Makko acceptance from the merge.

## Historical context

v2 established cleanup/source boundaries. v3/v4 developed the multi-genre campaign and independent-song profile direction. PR #4's global-clock approach was rejected. Later merged gameplay repairs through PR #25 and the owner's direct corrections supersede conflicting old mechanics instructions. Preserve history for provenance; do not re-run old PR prompts.
