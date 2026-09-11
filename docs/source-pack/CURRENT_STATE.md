# Current State

Updated: September 11, 2026. See `SOURCE_MANIFEST.json` for this export's exact branch/head/review status; this document's baseline section deliberately remains historical.

## Verified merged starting point

Repository: `6-Bit-01/BARCODE-SYSTEM-OVERRIDE`. Baseline commit: `7788ebfab4d6231c18229bef9571d6b97b676764`, merged PR #25. PR #4 remains excluded. v4 documented an earlier PR #3 state and must not be replayed as current instructions.

| Area | Present in baseline source |
|---|---|
| Presentation | Approved title/prologue, city/background/foreground, flying traffic, sprites, particles and music |
| Movement | Single jump, variable height, jump buffering and ledge forgiveness; opposite-direction cancellation; lethal ordinary-enemy passive stomp |
| Input/rhythm/hack | Tutorial owns Space; H/R locks; actual Rhythm Combat Mode and judged Down attacks; timing continues in background |
| Mission | Four authored groups totaling 20 post-tutorial enemies, authored roofs, two-hit Signal Lift, Signal Amp, three fragment locations |
| Jammer/entrance | Sixteen-hit environmental Jammer; freeze/purge/pan/boss walk-in/flourish/control handoff |
| Boss endpoint | `boss_ready`; damage disabled and no finished boss fight or Level 1 completion |
| Architecture | Existing lifecycle/frame/input owners and fixed-grid/no-grid music profiles; only `level-01.main` registered |
| Campaign | Other levels, other playable-character implementations, persistent campaign progress and finale not implemented |

The preceding audit reported `npm test` and all-JavaScript syntax checks passing at this baseline. This is historical evidence, not the new branch's result; use the current archive's supplied test receipt for that.

## Current playtest repair

Merged PR #27: `a69384e5c647e0f1f457564ccbb3c29cd37e2059`. It added the 12-health boss, pulse warnings/cyan counters, boss retry and Level 1 completion. The owner played that build and reported blocking presentation/traversal issues; **Makko acceptance was not achieved**.

Current branch: `agent/level1-playtest-repairs`, based on merged PR #27. Status: **reviewable repair; unmerged, owner verification pending**. The generated manifest records the exact export SHA.

- The first encounter boundary is active during the tutorial and remains active through handoff. Horizontal movement is clamped before downstream collision/camera consumers; large steps and an already-past-gate position cannot bypass it. Later pre-encounter boundaries also close the trigger gap.
- The boss remains at world x=3480 through camera return. After the ready pause, ordinary world-space pursuit brings it toward the player, including from offscreen.
- Boss frames were remeasured from all three existing manifest-linked sheets. Neutral body height is normalized to 202.4 world pixels (walk baseline preserved); planted-foot rows, both facing directions, legacy/scaled/absent runtime anchors and manifest scale are handled explicitly. Natural pose changes remain. The stable head contact hull matches that neutral body height.
- Descending top contact rebounds in every combat phase. Cyan windows take one stomp damage per cycle; guarded/repeated contacts give a safe bounce and explanatory cue. Ground pulses remain one-health damage with existing player invulnerability. Full-health instant death was not reproduced; the owner's report still requires Makko retesting.
- Jammer reveal randomly chooses one of three safe street positions in the opposite half. All six positions clear the lift plus the Jammer attack radius and player foot margin. A nearby lift prompt explains R + Down on beat and shows charge progress.

No sprite URLs, source artwork, music, mission quota, Jammer health or ordinary-enemy stomp rules were changed. Boss balance and art/contact feel still require Makko. The boss checkpoint is session-only; campaign save and Level 2 remain unimplemented.

`ACCEPTANCE.md` records the focused retest. Production-module checks verify deterministic behavior and the draw-call anchor contract; they do not run Makko's renderer or verify live audio.

## Next after acceptance

1. Merge the accepted milestone and rebuild the current source archive at the actual merged SHA.
2. Add campaign/save and deterministic lore foundations; repair source-role mixing before introducing another song.
3. Build a short Contra-style prototype, then prove road/first-person rendering before commissioning the corresponding assets.

Follow-on polish includes differentiated attack feedback, measured enemy contact corrections, musical telegraphs and Jammer presentation escalation. It is approved direction, not a claim that every improvement lands in the first boss patch.
