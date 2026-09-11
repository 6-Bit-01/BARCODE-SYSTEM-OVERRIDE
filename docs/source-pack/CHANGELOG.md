# Changelog

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
