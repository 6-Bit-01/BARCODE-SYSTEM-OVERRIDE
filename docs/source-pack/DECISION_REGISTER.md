# Decision Register

## September 16, 2026 — street depth, one terminal and render cost

Base/rollback is merged PR #58 (`1c8b54ec5db0e102f64c0ffb15bd4b57c5e5acda`). Branch `agent/street-depth-terminal-performance` implements the owner's new feedback: draw emitter hardware behind enemies, replace three large generic boxes with one illustrated broadcast terminal at the Tower, and reduce wasted scenery rendering. The two removed boxes also lose their colliders; thin wall-mounted supports remain. Baked original rail geometry/off states use asset ancestor `1891ebb4e061971362817832e942ef9fbe05d15a`. Native gate-pass draw calls fall from 14 to 1 for the first gate and 55 to 2 after all gates clear at the fixed review camera. This is not a hosted FPS claim. See `STREET_DEPTH_TERMINAL_PERFORMANCE.md` for implementation, assets, tests, limits and the exact Makko route. Review head/CI belong to the generated receipt. Owner Makko acceptance is pending; earlier entries are history.

## Latest owner decisions — thin rails and original traffic

The owner selected the first, thinner continuous rail example and approved proceeding with the reviewed eight-issue plan. Machinery covers the full building contact and joins a ground track across sidewalk/curb/street. Foreground cars retain original speed, altitude, size, art, direction, bob and spawn behavior; add warnings/damage to them. Thin barely noticeable landing lines are restored, superseding their prior removal. Keep text-free hearts, 3D utility props, foot masking, grounded guards, Firewall smoothing, clear Objectives and practical keypad input. Preserve the working cutscene buttons. `THIN_RAIL_TRAFFIC_CORRECTION.md` is the concrete current contract; prior car-lane tuning is rejected.

## September 15: approved rebuild after owner rejection and revert

The owner says #55 was useless apart from its cutscene button changes, reports that it was reverted, and requires a plan before further work. The subsequent revised plan was explicitly approved by “Ok lets proceed.” Base is `6e3751ba1561d8694e0bdc9a623e74ac6a45624d`; the new scope is `LEVEL_01_REBUILD_PASS.md`.

Required corrections: health uses a clear heart silhouette without floating text; barrier machinery must be actual assets, including building-mounted emitters; utility boxes need a perspective top/side; walking belongs in the middle of the sidewalk; Firewall backward walking/jitter and unfair body overlap must be fixed. Rooftop play uses the painted building tops without blue platform lines; selected parapets hide a small part of grounded feet. Ground enemies must not float or automatically hop toward the player. Foreground hazards use existing car artwork. The approved rebuild includes a new dedicated rooftop security drone with its own illustrated states and bounded flight, plus the agreed dialogue, Objectives and keyboard/controller/pointer hacking changes.

Keep H's puzzle slowdown and eight-second hijack, ordinary lethal stomps, original single jump, mission quota, Jammer/boss and existing music/art. A cloud secret and full mobile movement controls are outside this rebuild. The new drone's art and tuning remain subject to owner Makko acceptance; do not misrepresent implementation approval as playtest approval.

## September 15: extend the wall through the sidewalk and road

The owner describes the tall barriers as almost good and requests their bottoms cover the sidewalk as walls rising across the entire road, rooftops and sidewalk. Their screenshot establishes the missing foreground footprint. This authorizes a focused drawing correction with the current perspective, curb step and tall design; it does not change gate placement, collision, unlock rules, health/hijack, traffic hazards or other mechanics. PR #53 is merged and retained; exact owner Makko acceptance of this correction remains pending.

## Latest decision — enemy hijack chosen

The owner explicitly selected **Enemy hijack** as the replacement hacking reward. H slows enemies during its puzzle; do not conflate that assistance with the outcome. This selection supersedes the earlier unresolved H section and the assistant's assumed-stun direction. The first implementation uses one eight-second ordinary ally and preserves actual defeat credit; the previously agreed repair/rooftop scope provides replacement healing. Exact initial tuning and owner review are in `ENEMY_HIJACK_REPAIR_PASS.md`. Environmental terminals/cloud/traffic remain later ideas.


## September 14: restrained motion polish and reopened health/roof design

The owner requests improved existing 6 Bit animations, especially the shaky/uneven walk, while explicitly excluding giant changes now. This authorizes the narrow player-motion pass. The owner also questions hack-for-health and proposes enemy/rooftop pickups, more upper platforms, a possible cloud secret and traffic hazards. These reopen the older health/expansion locks for design discussion; they do not yet choose drop rates, enemy type, a new H behavior, added geometry or damaging traffic. See NEXT_SMALL_GAMEPLAY_PASS.md for grounded recommendations. The seven major levels, four playable characters, single jump and simulation/canon requirements remain.

September 13 owner correction: **Studio Rats are cats**; the name is slang, never a literal-rodent design instruction. The new asset/FX/boss-sizing pass is governed by `CAT_CHAOS_ASSET_PASS.md`, after merged PR #44. Keep the existing stable discovery IDs and saved records.

## Current owner approval — all ten impact/discovery recommendations after #43

“Alright let's proceed” authorizes the complete numbered scope in `LEVEL_01_IMPACT_PASS.md`, including actual attack variety, compact top-left predictive rhythm, FX, four encounter identities and optional fourth-wall/discovery content. Use one combined pass and draft PR; the existing push/draft authorization persists. The prior intro-first work is retained from merged #43. Stage C follows this review.

Review tuning: ordinary base radius still grows 250–350; combo 5 adds a forward wave up to base+85 (470 maximum), within 90 vertical pixels; combo 10 adds at most two links of 140 pixels with total reach at most 520. Amp provides its existing 430 radius and one charge per ordinary-target transaction; the same bounded wave/link rules then apply. No multiplied boss/Jammer damage or new input is inferred. Camera peaks are 5px hit/landing, 7 hurt, 10 stomp, 12 destruction, 9 boss and 13 final-hit, with bounded decay and optional motion. These are implementation tuning choices awaiting Makko feel review, not new canon locks.

E / controller LB is the separate optional Inspect action; H/Y remains hacking. The four new stable IDs are listed in EASTER_EGGS_AND_CAMEOS. Their original dialogue and presentation are authorized by this scope. They do not settle future revelations, ending evaluation, more playable characters or later level designs.

## Owner correction after merged #39 — intro first

The owner repeatedly requested the actual intro, then reported that holding S did not work and criticized the HUD/rhythm presentation. Their latest explicit order is: “Stick to the intro work and then do that.” The opening correction in INTRO_OVERHAUL.md therefore comes first, based on `510342ed21692fd85f9b99ef6b29990a5694132d`; the HUD/rhythm/threshold-attack request is the next authorized follow-up. Stage C does not take its place. The owner then explicitly requested intro images, required models first, and supplied models for 6 Bit, Cache Back, Cliff, DJ Floppydisc and Mac Modem. This authorizes the eight targeted illustrations and integration in INTRO_ART_DIRECTION.md. All other intro characters remain offscreen/obscured. It does not settle a new 9 Bit origin/reveal or claim owner Makko acceptance.

## Stage B implementation authority — after merged #38

The owner confirmed “Merged. Lets proceed.” The campaign map/instruction reconciliation is now merged at `0d1882f6b6eebf6fc5704d8a3270f2a6b1fb7354`. This authorizes the next combined Stage B implementation described in CONTINUATION_PLAN. `STORY_CONTROLS_PASS.md` records the reviewable scene, input mapping, calibration semantics and gameplay boundary. Specific new dialogue, controller ergonomics and camera/HUD feel remain subject to Makko review. This does not approve merging without that gate or silently implementing Stage C–F.


## Latest owner direction: map the whole campaign, then implement

After merging PR #37, the owner approved the broader improvement direction, corrected the cast, required mapping the whole story rather than isolated intro material, and explicitly added Easter eggs to the games/things inspiring System Override. The September 12 continuation asks to carry all established work forward carefully. `CONTINUATION_PLAN.md` traces evidence, completed work and remaining implementation; `CAMPAIGN_STORY_MAP.md` is the new working treatment, including all 28 record purposes. `EASTER_EGGS_AND_CAMEOS.md` and `ASSET_AND_PLATFORM_PLAN.md` carry the corrected roster, influence bank and production dependencies.

Specific new scenes, placements, captions, reveal order and asset requests in those documents are proposals for review, not recovered verbatim approvals or installed content. The complete last-chat transcript/review file was not available; the visible owner instructions, retrieved review summaries and inspected source are explicitly distinguished. Base: merged #37 at `38732933713c4f9ec22666e49b728a0626a85f25`.

| ID | Status | Latest decision |
|---|---|---|
| D-037 | LOCKED | Map the complete campaign and setup/payoff chain before implementing isolated beginning scenes. |
| D-038 | LOCKED | Include Cliff, Sheila, Studio Rats, WittyF0x, Kave, SKELLA and Dr3wBaby; Sheila remains silhouette-only if depicted. |
| D-039 | LOCKED | Exclude Mind Fanatic/M1ND_FANATIC, Emerald/EMRLD, Crowline and W3T TDDY from active plans; retire W3T TDDY's old Tower support requirement. |
| D-040 | APPROVED DIRECTION | Stronger Comix Zone-style panels/impacts and Metal Gear-style comms/reveals/player-aware moments; story-led Easter eggs to the established inspirations. |
| D-041 | APPROVED DIRECTION | Reopen intro/story development; prototype a representative sequence with current assets, then request targeted missing art. This supersedes an absolute no-reconsideration rule, not the current playable baseline or review of exact changes. |
| D-042 | APPROVED DIRECTION | Retain remaining controller, committed-enemy steering, truthful boss cue, HUD, camera and calibration work from the recovered review; implement with the existing lifecycle/timing owners. |
| D-043 | APPROVED DIRECTION | Retain bounded mobile feasibility; standalone migration and a full mobile/engine conversion remain deferred. |

## Historical owner direction: implement and improve the lore

After the archive/three-record follow-up was offered, the owner said "Proceed" and added: "We also have to actually implement and improve the lore. Use all context from BARCODE and 6 Bit to make, confirm, edit, and/or add to the current unlocked lore". This is approval to write and implement substantive entries, not leave placeholder text behind a new menu. The source audit uses the current repository decisions, attached v4 reveal purposes, BARCODE Bibles and World Overview. `LORE_ARCHIVE_PASS.md` distinguishes established facts from newly authored in-game dialogue; `LEVEL_01_LORE.md` preserves the exact implemented copy.

Base: merged PR #36. Keep IDs and saved unlocks, original-four identities, the existing prologue and the hidden collection purpose. The three current records do not decide the simulation creator, later reveal order or final outcome rules. Migration stays deferred. Existing draft publication authorization persists; owner Makko acceptance is still required before merge.

The earlier selections below remain historical records of their own passes.

## Latest owner direction: discovery follow-up

The owner approved the two remaining suggestions (rhythm target brackets and animated existing traffic), requested repair of late lore availability and the uncollectible rooftop Signal Amp, and deferred migration. Collection contributes to the eventual ending and the test is secret; no player-facing explanation may expose that relationship. Persist stable discoveries without inventing unapproved thresholds. `DISCOVERY_PASS.md` is the combined scope. PR #35 is merged; its merge revision is the new base.

## Current locked selection — September 12, 2026

The owner accepted the latest nine-item recommendation: "Agreed. Lets lock it in. Update or make a new source file pack and keep it updated. Then lets continue with the plan". `POLISH_PASS.md` preserves the exact 1–9 mapping and particle/logging cleanup. Deliver the complete selection in one draft PR from merged #34, with source-pack checkpoints and an updated review archive. Implementation approval is not Makko acceptance. The existing merged-PR pack maintenance automation remains enabled (ID `6aa4396731548191b1b9323614dc49e3`), verified September 12; its latest run refreshed #34.

Traffic animation (10), target previews (11), and the authored persistent lore archive (12) remain follow-ons. Do not substitute numbers from historical proposals.

## Current responsive combat selection — September 11, 2026

The owner asked for improvements including FX, reported questionable hitboxes and said the earlier Rhythm Mode/background effects were barely noticeable, then requested continuation. The selected next build is items **1–8 from the latest sixteen-item review**, plus a stronger visible musical response in the existing scenery. `RESPONSIVE_COMBAT_PASS.md` records the exact mapping. This approves correcting the previous pose-dependent collision geometry, timestamp capture, frame pacing, attack/contact/combo FX, animation phase selection and bounded action sounds. It does not mean the older PR #29 or #31 numbered selections. One combined PR; Makko-before-merge remains.

New collision sizes, effect intensities and cue levels are provisional playtest tuning. Preserve the locked mission, single jump, grounded R, hack rewards, musical transport, sixteen-hit Jammer, two-hit lift, boss balance, intro and asset URLs. Items 9–16 and migration remain follow-ons.

## Selected-pass verification after the interruption

The owner asked to check the PR against what was selected and proceed with that plan. `SELECTED_PASS_CHECK.md` anchors the exact conversation and implementation. The original recommendation scheduled district restoration after the animation/stance/hacking and five named effects. After the owner rejected a separate PR for the small stomp omission, the current build combines that correction with the district follow-on. Preserve all of PR #31; the earlier PR #29 selection (1–5, 8 and 9) and main overhaul headings are not substitutes for those five effects. New combo systems, settings, lore and standalone migration remain separately scheduled.

## September 11 animation, mode and effects approval

The owner said "Proceed with the next pass" after the recommendation to implement animation transitions, a planted rhythm stance, hacking presentation and the first inexpensive effects, then confirmed merging PR #30. This authorizes the scoped `agent/level1-animation-effects` pass: grounded R entry, explicit exit for traversal, preserved lift/forced motion, continuous background timing, existing hack rules/rewards, contact shadows, landing/stomp/attack effects, lift energy and subtle sign pulses. It does not approve replacement assets, new movement abilities, altered boss balance or all remaining proposals. Makko acceptance is separate.

Statuses: **LOCKED** = explicit retained requirement; **APPROVED DIRECTION** = September 11 direction approved for development, details remain tunable; **OPEN** = no final choice; **SUPERSEDED** = historical instruction to retire.

| ID | Status | Decision / source |
|---|---|---|
| D-001 | LOCKED | Seven major levels; each changes its mechanical identity. Prior owner campaign request retained. |
| D-002 | LOCKED | Only 6 Bit, DJ Floppydisc, Cache Back and Mac Modem playable. Guests are cameos/support. |
| D-003 | LOCKED | Takes place in a simulation. 9 Bit is formed from the negative parts separated from 6 Bit. |
| D-004 | UPDATED BY D-041 | Preserve current prologue/art as the live baseline; latest owner direction reopens selective intro/story design and prototype review. No incidental 9 Bit insertion. *Observer Not Found* stays separate. |
| D-005 | LOCKED | Required later homages: Rad Racer, Contra, Tetris/Dr. Mario, Pokémon and DOOM. First-person RPG finale confronts 9 Bit and uses prior-level finds. |
| D-006 | LOCKED | Level 1 movement: left/right, opposing directions cancel, single jump; no dash/slide/double jump/Down fast-fall. |
| D-007 | LOCKED | Active tutorial owns Space. H/R retain tutorial locks; background music/rhythm timing continues with R hidden or inactive. |
| D-008 | LOCKED | R is actual Rhythm Combat Mode; Down damage requires successful rhythm judgment. Passive landing stomp stays lethal against ordinary enemies. |
| D-009 | LOCKED | 20 post-tutorial enemies, four authored groups; tutorial kills excluded. |
| D-010 | LOCKED | Jammer appears in opposite half at 20 defeats; sixteen health, one damage per successful rhythm hit. Environmental owner; not hacked/stomped. |
| D-011 | LOCKED | Preserve Jammer-to-boss freeze/purge/pan/entrance/flourish/handoff and rhythm-powered two-hit lift. |
| D-012 | LOCKED | 28 one-time lore records, distribution 3/4/5/4/5/4/3. Random legacy text is not final canon. |
| D-013 | LOCKED | Each level selects its own song/profile. No inherited Level 1 BPM/stems/grid/restart policy. Musical input judgment is chosen per genre. |
| D-014 | SUPERSEDED BY D-039 | Old W3T TDDY ally/Tower support instruction is retired. Six guaranteed keys and the crew's recovered route provide finale access without a replacement cameo gate. |
| D-015 | APPROVED DIRECTION | Finish Level 1 now: learnable boss patterns, quick fair retry, victory and a real completion endpoint. |
| D-016 | APPROVED DIRECTION | Reconcile documentation/tests; strengthen encounter teaching, feedback/readability, selected musical telegraphs and Jammer escalation. Implement in focused passes. |
| D-017 | APPROVED DIRECTION | Small campaign adapter and versioned persistent progress before full new genres; prove independent-song mixer behavior. |
| D-018 | APPROVED DIRECTION | First expansion prototype is Contra-style because side-view code can be reused. Production order need not equal campaign order. Prove road/first-person rendering before large asset orders. |
| D-019 | APPROVED DIRECTION | Compact stages, corrupted public-access transitions, shared crew/motifs and independent music connect the genre shifts. |
| D-020 | APPROVED DIRECTION | Collect musical/program Samples that equip the original four in the Pokémon-inspired stage. Keep creature/content count compact. |
| D-021 | APPROVED DIRECTION | Guaranteed six Stem Keys, optional Signature Modules, and a separately composed Full Mix arrangement provide finale progression/payoff. Exact item names/effects remain tunable. |
| D-022 | APPROVED DIRECTION | Regularly rebuild/update this source ZIP at milestones and merges with actual SHA/PR/test status. |
| D-023 | OPEN | Final shipping titles, exact later order/lead assignments, Dr. Mario versus Tetris rules and L2–L6 boss identities. Use the recorded map as a working plan. |
| D-024 | OPEN | Level 1 boss's final identity/name; current existing sprite is an implementation basis, not approval of “Program Director,” “City Scrambler” or 9 Bit. |
| D-025 | OPEN | Later tracks and verified music metadata; final art/animation requests follow prototypes. |
| D-026 | OPEN | Simulation creator, full 9 Bit reveal/dialogue/trait list, exact ending thresholds, outcomes and presentation; collection affects the result under the latest owner direction. |
| D-027 | OPEN, WITH D-042/D-043 DIRECTION | Final supported devices/controller/touch scope and Level 7 combat cadence remain open. Remaining controller/calibration improvements and a bounded mobile proof have a recorded production direction. |
| D-028 | SUPERSEDED | v4's no-quota/non-destructible-Jammer and its rejection of the 20-enemy route. Later owner decisions explicitly restore/approve this mission. |
| D-029 | SUPERSEDED | v4's universal off-beat attack permission, old no-stomp prose, and tests requiring those old design statements. |
| D-030 | SUPERSEDED | PR-001 documentation-only/static-only rules as perpetual project restrictions; they applied to that earlier pass. Makko verification before merge remains current. |
| D-031 | SUPERSEDED | v4's PR #3 baseline/next-PR commands, `maxLevel: 5`, random lore as campaign delivery, and any dependency on rejected PR #4. |

| D-032 | LOCKED | September 11 playtest: tutorial movement must not allow passing the encounter boundary before it activates. |
| D-033 | LOCKED | Boss belongs to world coordinates: camera return cannot carry/teleport it; it must approach through normal movement, including offscreen. Animation scale/alignment must be consistent. |
| D-034 | LOCKED | Jammer placement must keep its attack positions clear of the elevator. Retain and explain the two-hit rhythm-powered lift. |
| D-035 | APPROVED DIRECTION | Boss top landings safely rebound outside cyan windows; only the cyan counter damages it. Verify the reported instant death in Makko. |

| D-036 | APPROVED DIRECTION | September 11: general Level 1 improvement pass before the next playtest, covering contact, combat feedback, encounter/route readability and Jammer presentation. Keep the repaired mechanics and established project direction. |

Do not treat an approved production direction as a claim that it has been implemented or visually accepted. Source trace: uploaded v2/v3/v4 packs; the owner's later control/mission corrections retained in repository guidance and merged PR #25; September 11 project assessment and direct approval. This is a decision synthesis, not a claim to reproduce every private conversation verbatim.

## September 11 musical combat approval

The owner replied “Lets goooooooo!” to the recommendation to combine proposals 1–5, 8 and 9. This authorizes boss balance/musical openings/safe outward rebounds, stronger ordinary-enemy behavior and combat/rhythm feedback. Exact tuning remains subject to playtesting. Their preceding report explicitly identifies endless head bouncing as an exploit; the prior safe-landing repair is not approval of that win loop.

The broader optional rooftop, district-reaction, settings, lore and ending ideas remain proposals for later passes. Standalone migration is the next recommended infrastructure milestone; no migration is bundled into this gameplay PR.

## September 11 Jammer exit correction

LOCKED: Rhythm Combat Mode automatically ends when the Jammer is destroyed. It must not survive the cinematic or return automatically at boss handoff. The background music/rhythm clock continues; a new R activation remains available once normal gameplay returns. This supersedes earlier commentary/tests preserving the active mode through the cinematic.

The owner requested recommendations for a stronger overall animation/rhythm/hack pass, including effects and inexpensive opportunities. See `OVERHAUL_PROPOSAL.md`; proposed redesigns are not approved changes to mechanics.
