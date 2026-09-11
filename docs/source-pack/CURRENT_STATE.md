# Current State

## Current gameplay pass — September 11, 2026

Baseline: merged PR #28, `05c1404f5805e9e17dc5eac015abd7fe0a8c2aa1`. The owner reports a major improvement and a boss win, but found the fight too difficult and won by staying in an endless safe head-bounce loop. This is positive playtest feedback with an unresolved exploit/balance issue, not blanket acceptance.

Current branch: `agent/level1-musical-combat`. This pass is **unmerged and awaiting owner Makko testing**; the generated manifest names its exact revision and PR. It implements the approved combined recommendations 1–5, 8 and 9. Later ideas and a standalone migration are not silently included.

- Boss: 10 health, 1.8-second ready grace, 1.6-second warning, 3-second minimum recovery. After the first cycle, six health introduces a second pulse without reducing those windows. Only after two cycles, at three health, warning/recovery shorten to 1.3/2.5 seconds. These are provisional playtest tuning values.
- Attacks, the second pulse and counter-window boundaries sample the existing MusicTransport. They wait for a beat crossing after their minimum hostile-time duration, with no second scheduler. H still scales hostile time to 0.4 and leaves music running. No-grid/silent development hosts use the existing timer-based phase fallback; this cannot grant offbeat rhythm damage.
- Pulse speed is 560 world pixels/second; approach distance 230. Each pulse retains one damage latch and existing player invulnerability. The second pulse waits at least 410 ms and a music boundary; recovery waits at least 700 ms after the last pulse, then a boundary.
- Boss head landings remain safe, but impart a 260 ms outward horizontal impulse at 360 pixels/second, then return to ordinary air control. A floor/platform landing rearms stomp counter damage; changing boss cycles alone does not. Only one stomp damages each cyan cycle. World-edge rebounds point inward; retry clears impulse state. Ordinary enemy stomps remain lethal.
- Authored Corrupted enemies approach, show a 650 ms charge warning, commit to one direction for 420 ms, then recover for 950 ms. Authored Firewalls brace for 950 ms, perform the existing 80-pixel glide and complete attack clip, then approach again. They retain contact damage and normal stomp eligibility. Tutorial behavior and authored entrances are preserved.
- Swoopers advertise and retain the player position captured when their warning begins. They cannot retarget a successful dodge at release. Existing one-dive-at-a-time coordination remains.
- Enemy windup/recovery labels and bars, a marked swooper lane, actual-hit flash, distinct existing hit/guard/stomp sounds and restrained shake improve feedback. No art/asset URLs, music arrangement, transport speed or new effects timers were added.
- Rhythm uses the same authoritative judgment to show EARLY/LATE. A compact player-local cue shows the beat and Down input; taking damage announces the loss of Rhythm Mode and the R command immediately. Reset removes stale messages.

Verification and limits: see `test-evidence.json` for the exact revision and results. Production-module tests cover no-input bounce behavior, genuine double-pulse jumps at 30/60/120 FPS, beat alignment, generation changes, damage/reset, enemy commitments and cue lifetime. They do not establish Makko appearance, audible sync or subjective difficulty. These remain owner playtest items.

Next: accept/refine this Level 1 build, then scope the standalone migration as a separate milestone. Preserve the current engine/art as the comparison baseline; campaign foundations and the Contra-style prototype follow. Persistent saves, new genres, settings, new lore prose and environmental expansion are not implemented in this pass.

## Historical implementation notes

The entries below preserve the sequence of earlier work. Their branch status and tuning describe those earlier passes; the current section and generated manifest supersede them.

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

## General Level 1 polish before the next playtest

The owner asked for a general game improvement pass before testing, beyond focused boss repairs. This is included in the same PR #28 branch.

- Ordinary enemy rendering and Makko hitbox lookup now share the exact position, animation scale and facing. This removes the previous 59–69 pixel offset discrepancies and the Firewall attack scale mismatch while retaining existing contact margins and lethal stomp rules. This affects contact feel and must be checked with the visible sprites in Makko.
- Primary attacks now display separate short feedback for missed timing, correct timing without contact, actual damage, a guarded boss and lift charging. Feedback follows the existing game clock and clears on combat reset; it adds no timers or listeners.
- Objectives show the active encounter's own defeat progress, a matching play hint and a direction to the next encounter. Completed objectives remain recorded but stop covering the active fight. The Jammer objective follows actual remaining health.
- The Jammer now changes signal color/label and lights relay segments after 4, 8 and 12 hits, with one restrained impact at each transition. Destruction still occurs at exactly 16 hits and starts the existing cinematic once. Music and source artwork are unchanged.

Encounter counts, packet timing and enemy attack behavior are unchanged; this pass improves the readability of their existing variety. Musical enemy telegraphs, deeper encounter tuning and persistent authored lore remain future work.

## Next after acceptance

1. Merge the accepted milestone and rebuild the current source archive at the actual merged SHA.
2. Add campaign/save and deterministic lore foundations; repair source-role mixing before introducing another song.
3. Build a short Contra-style prototype, then prove road/first-person rendering before commissioning the corresponding assets.

Follow-on work includes musical enemy telegraphs and deeper encounter tuning informed by the next playtest. Campaign/save/lore work follows Level 1 acceptance.
