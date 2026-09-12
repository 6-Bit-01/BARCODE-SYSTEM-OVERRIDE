# Changelog

## September 12, 2026 — Publish the combined polish review

- Publish all three implementation checkpoints together on `agent/level1-combined-polish` for one draft PR. Main still matches merged #34; gameplay/test hashes match the fully validated `e0d4eee` checkpoint.
- Update review/handoff documents and source-pack publication metadata. The combined six-step Makko checklist is ready; owner acceptance remains required before merge.

## September 12, 2026 — Polish checkpoint 3: items 8–9 and cleanup

- Add pause controls, rhythm-exit reminder, keyboard/pointer Music/SFX sliders and saved shake/flash/CRT preferences. Reuse input/RAF/lifecycle owners and redraw a cached paused scene only when needed. Prevent held menu/gamepad actions from firing on resume.
- Preserve the original mix beneath a user music bus for gameplay/title/cutscene music, route both effect buses through the SFX setting and block generic autoplay gestures while deliberately paused. Storage failure does not prevent gameplay.
- Animate completed-run score, best combo and Lost Data totals from a completed-run snapshot. Retain run best/collection and post-checkpoint fragment rewards across boss retry; clear run totals on full restart. No lore rewrite/archive.
- Remove routine particle logs, per-draw filtered arrays and the leftover startup test burst; retain bounded/cached decoration from prior chunks.
- Add production menu/settings/retry tests and Canvas layout diagnostics; refresh the inventory for the new module/test and moved script/declaration positions. Full combined validation is recorded in the source receipt. All 1–9 plus cleanup are implemented; publish one combined draft next. Makko remains pending.

## September 12, 2026 — Polish checkpoint 2: items 4–7

- Save the next manageable checkpoint: all four scanning barcode gates collapse from actual unlock timestamps without delaying collision/progression.
- Vary storefront equalizers across four patterns, strengthen downbeat/combo accents and move curb lights using the existing music clock. Preserve district restoration, quiet boss scenery and frozen paused redraws.
- Add measured vent steam, dust, cable sparks and neon pavement spill with cached textures, finite lifetimes/culling and reduced intensity near attack warnings.
- Add rooftop Lost Data beacons and assembled barcode pieces flying through the actual camera/zoom projection to the counter. Keep rewards and lore in the real one-time collection path; cache glows, skip offscreen ambient emission and remove per-frame collection logging.
- Extend production-owner checks for gate clear/pause/reset, music/atmosphere bounds and collection/flight lifecycle. Refresh only moved baseline declaration lines and add source-art Canvas diagnostics. No new assets, dependencies, Makko PASS or separate PR.
- Items 1–7 are now implemented. Next: 8–9, remaining particle/logging cleanup, full validation and the one combined draft PR.

## September 12, 2026 — Polish checkpoint 1: items 1–3

- Follow the owner's request for manageable pieces while preserving the one combined 1–9 PR scope. Save an unpublished checkpoint for damage/impact feedback, enemy warnings and Signal Amp presentation; 4–9 and remaining cleanup follow.
- Reconnect elapsed-time shake through the existing RAF renderer owner, cap requests, protect stronger impacts and clear shake on combat reset. Record health-loss/source indicators only from accepted damage calls, including boss pulses.
- Draw warning symbols, committed ground arrows and Swooper aim markers from existing AI state; no changed attack timings or contact rules.
- Replace the Amp circle with an animated amplifier/barcode, collection announcement, actual charge pips and depletion feedback. Preserve range/consumption, pickup sound, checkpoint charges and full reset.
- Add focused production-owner checks, preserve the Makko animation/SFX repairs, extend the existing warning Canvas test boundary and refresh the inventory for the new test/declaration positions. Add a diagnostic Canvas preview with explicitly labeled fallback bodies. No new dependencies, external assets or Makko PASS claim.

## September 12, 2026 — Lock the combined polish scope

- Record the owner's approval of exactly items 1–9 and particle/logging cleanup in `POLISH_PASS.md`.
- Start from merged PR #34 with successful main CI and identical tested source tree.
- Preserve one combined draft PR and the existing v5 archive identity/merge maintenance. This checkpoint records approval, not completed implementation or Makko acceptance.

## September 12, 2026 — Repair failed PR #33 Makko playtest

- Record positive effects/flow feedback and failed animation/contact/audio acceptance against merged `8d0cf73`.
- Use public Makko start-frame selection. Landing recovery cannot latch on sprite errors; Corrupted/Firewall updates again reach collision resolution.
- Restore rhythm/damage samples, per-voice volume and bounded cleanup; remove delayed whole-SFX-channel restoration. Use actual graph readiness and stronger cue envelopes. Final Makko mix remains pending.
- Add getter-only and optional actual-Makko animation coverage, full animated contact/landing checks across four frame rates, audio routing/bus/reset checks and executed cinematic ownership checks.
- Preserve visuals/flow, calibrated geometry, health/boss balance, mission, art and music. Add focused health report/diagnostics/handoff and refresh the exact-review archive. No gameplay PASS is claimed.

## September 12, 2026 — Publish the completed combined pass

- Owner explicitly authorized pushing the completed responsive-combat/visible-rhythm build to the existing GitHub repository and opening one draft PR.
- Refresh publication status and archive metadata. Gameplay, assets, test code and tools match the tested local review at `3ec6427`; Makko acceptance remains pending.

## September 11, 2026 — Responsive combat and visible rhythm pass

- Complete the selected eight-item pass together, plus the owner's request for stronger Rhythm Mode and scenery response. Scope is pinned in `RESPONSIVE_COMBAT_PASS.md`.
- Replace animation-dependent body contact and overlap-only stomps with stable torsos, audited head planes and swept foot crossings; calibrate existing enemy feet without replacing sheets/scales.
- Capture quick taps and their audio timestamps, remove the frame-dropping limiter, use elapsed-time particle/trail/zoom behavior and cull offscreen drawing.
- Add honest attack-range/contact FX, directional material breakup, perfect-hit/5/10-combo feedback, phase-driven jump/enemy poses and bounded action sounds on the existing audio bus.
- Make existing sign interiors and curb visibly follow the beat in R; retain all previous district restoration, Jammer handoff and boss retry behavior.
- Add production checks, source calibration and diagnostic Canvas previews. Update old hull expectations to the newly approved geometry while retaining real behavioral coverage. Archive results identify the exact review SHA; live Makko acceptance remains pending. Base/rollback is merged #32 (`9719827`).

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
