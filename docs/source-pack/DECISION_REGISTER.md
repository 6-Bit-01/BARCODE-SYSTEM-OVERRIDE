# Decision Register

## September 17, 2026 — playtest clarity, hack dilation and dynamic lift depth

Continue from merged #76, `ee089acce1ee9dad6ffd877fe32f99dd633aa011` (base/rollback), on `agent/tutorial-single-panel`. The owner's follow-up requests are implemented together: one alternating tutorial instruction area; lore and inspect waiting through the complete Studio Rat event; stronger hack slowdown with a gentle pulse and enemy trails; deliberate Down + Jump through every standable surface, including solids; and player/enemy elevator depth following the moving floor. The fixed drive stays behind actors.

Read `docs/source-pack/PLAYTEST_POLISH_PASS.md` (or `PLAYTEST_POLISH_PASS.md` at the pack root). These explicit requests supersede the old simultaneous Objectives/dialogue cards, 40% constant focus, solid-surface drop prohibition and roof-only enemy depth fix. Preserve the twenty-bubble story/progression, all recovered art, boss clearance, twelve-second allies and exact five-second lift power. Current PR/head/checks belong to the generated receipt. Publish one draft, refresh the maintained v5 archive and retain owner Makko acceptance before assistant merge. Older entries below are history.

## September 17 — recovered owner approval supersedes incomplete continuation notes

The shared [Finish The Job conversation](https://chatgpt.com/share/6aab45a3-02cc-83e8-a465-d90391ee8c13) explicitly approves the 20-bubble tutorial after the detailed early/out-of-order action plan. Implement it together with the subsequently requested five platform designs (three facade plus two side-braced), five-second lift timeout, terminal placement/waveform, happy digital pickup SFX, six reactive HUD faces, solid awnings and judged-beat colors. The saved implementation/assets have been recovered and integrated. Previous “proposal only” and “missing art” entries are historical errors in recovery status.

The owner's later request to make awnings like the elevator supersedes the earlier four-only scope specifically for awnings: all five are fully solid; ordinary roofs and steps stay one-way, except the two previously circled small-step underside bonks. Correct boss routing around that approved geometry without adding solids to ordinary platforms or changing combat balance. Keep #75's correct lift timer and terminal integration.

See `FINISH_THE_JOB_RECOVERY.md`. Related low-hanging improvements are recommendations only. Existing authorization covers finishing, publishing one combined draft and refreshing the same v5 archive. Owner Makko acceptance remains required before assistant merge.

## September 17, 2026 — platform attachments, five-second lift power and terminal screen

Continuation from merged #74, `ea7a34571f91ba12d05291d6698eb17b389d150f`, on `agent/platform-mounts-charge-timeout`. PR #73 already corrected the blanket ledge collision mistake: only the four circled static objects bonk, plus the separately solid moving elevator roof. This pass preserves that collision scope and every existing small deck position/size.

Visible support hardware now terminates on masonry: left/right cantilevers for projecting decks, bolted front brackets and short hangers where glass/signs prevented an underside attachment. The current deck artwork is retained. Three previously proposed replacement image designs were not recovered from GitHub or available files; do not claim they were integrated or replace them with invented equivalents.

Two initial rhythm charges still launch the lift. Each accepted charge grants five simulation seconds; it then returns even when occupied. An onboard charge renews power at the shared rooftop seam or reverses descent. Pause freezes the countdown. The permanent terminal moves left to x=498, y=638, clear of the illustrated awning and neighboring door, with its existing collider/art/depth. Its existing painted waveform jitters inside the glass for 320 ms every 4.2 seconds using the shared scenery clock; reduced flashes disables this.

See `PLATFORM_MOUNTS_CHARGE_PASS.md` and native captures in `review-platform-mounts/`. Required full-suite/syntax outcomes and exact published revision belong to the generated receipt. Publish one draft and refresh the existing v5 archive; owner Makko acceptance remains pending. The tutorial proposal remains unimplemented.

## September 16 — roof enemy visibility and tutorial design question

Implement the owner's report of enemies appearing behind the elevator roof as a scoped draw-order correction. Retain the existing accurate landing height and collider. The owner additionally requests recommendations for clearer tutorial controls, consistent timing and at least two fewer bubbles while retaining storyline dialogue. The concrete proposal is 25 → 20 authored chapter bubbles; its wording/flow remains a proposal and is not silently applied to this elevator fix. Preserve all prior red-circle restrictions.

## September 16 — explicit owner correction overrides blanket bonks

Bonks are approved ONLY for the red-circled objects in the three supplied photos: `signal-awning`, `tower-awning`, `cache-maintenance-step`, `firewall-low-step`. The earlier interpretation of “anything the player can hit” as every stage underside was incorrect. Do not expand this list by appearance or generalize it to other roofs/steps. The separately requested moving elevator roof remains hard on every side and supports all actor types. See `CIRCLED_BONK_CORRECTION.md`; direct upward routes on unmarked platforms must remain playable.

## September 16 — controller descent, boss-win protection and ally time

Approved together by the owner: protect against incidental downward controller movement when jumping; fix boss defeat resetting its health and returning the player to ground; make successful hacked enemies fight for the player for **12 seconds**. Twelve seconds supersedes historical eight-second hijack descriptions. The firm 70% stick threshold, 35-degree downward window and 250 ms result-control release are reviewable implementation tuning. Preserve deliberate single-platform descent and explicit rematch/restart; do not auto-advance to an unimplemented level. See `CONTROLLER_VICTORY_ALLY_PASS.md`.

## September 16 — owner-authorized solid ledges and elevator squash

The owner broadens bonks to awnings and anything the player can hit, explicitly makes the elevator roof solid and rideable for the player, ordinary enemies and boss, then adds visible enemy pancaking beneath the descending elevator. The latest request supersedes the earlier cabin-only bonk and pass-through-awning direction. Use the existing sprites for the squash; retain defeat accounting and repair drops. Reposition the existing Tower middle step outward for a viable single-jump ascent. See `SOLID_LEDGES_SMUSH_PASS.md`. Existing authorization covers implementation, branch publication and one combined draft; owner Makko acceptance remains required before assistant merge.

## September 16 — owner-authorized elevator, Studio Rat and drone correction

The owner asks for a larger/taller elevator, brief on-screen lift text, occasional logically justified head bumps, Studio Rat in a random place each level, a clear stomp approach to the covered enemy, and a higher lift stop aligned with the rooftop. Implement as one follow-up to merged #69. Use only the visible cabin roof for upward head contact; preserve climb-through awnings. Choose from safe supported cat perches once per fresh run, independent of saved reward credit. Move the drone's spawn and patrol together instead of breaking the established platform route. Level 1 is the currently playable level; later genre-specific cat encounters remain future work. Exact behavior and review route: `LIFT_ROOFTOP_RAT_PASS.md`. Owner review remains required before assistant merge.

## September 16 — approved follow-up to the conversation audit

The owner said “Ok make the PR” for the unresolved per-building hologram mounting/perspective and empty tutorial Objectives panel. Keep the selected thin continuous facade-to-street design. Fitting the field requires its blocking boundary to follow its rendered placement; the authored positions are implementation choices awaiting visual review, not a change to encounter quotas or unlock rules. Do not restart already-implemented art, traffic, controller, background, Jammer or boss passes. The new branch and source receipt identify the review build; Makko acceptance is still required before assistant merge.

## September 16, 2026 — reusable background animation and central Jammer

Base/rollback is merged PR #66, `e79b30795ed825042c4bd27a28fd57e3c2da6c8f`; branch `agent/animated-background-central-jammer`. The owner likes the new atmosphere and requests an animated asset made here, slightly heavier rain, and Jammer placement in an area a little wider than the middle third. No additional service account is wanted. Earlier current-work sections are historical.

The existing far-city illustration now has a silent eight-second smoke/cloud loop at 24 fps. Architecture stays fixed in the uncompressed asset; rendering retains the original aspect and fixed scale. Asset ancestor: `ac31c22a283ca0e62b25ed303e8360c383336c14`. One muted video follows pause/reset/stop/restart, with one bundled fallback and the original still if media is unavailable. The game keeps its existing rain, steam and sign animation; rain streak populations rise by about 28%, with a small opacity increase.

Jammer spawning no longer alternates into the opposite world half. The allowed central band is x=1180–2916 (about 42% of the map). The existing lift approach reserves the right part of that band; actual safe slots are 1200, 1400, 1600, 1800 and 2000, with x=1600 as the initial/reset default. This keeps the lift out of Jammer attack reach and leaves room for the camera to reveal the boss. The 20-defeat quota, 16 Jammer health, rhythm-only damage and cinematic/boss sequence remain.

The permanent terminal remains at x=560, y=638, behind actors/holograms and clear of windows. PR #66's training/mission WATCH OUT warnings and real traffic damage remain. Read `ANIMATED_BACKGROUND_JAMMER_PASS.md` for asset provenance, review and validation limits. Canonical pack version 69 matched all 394 base exports; its manifest/receipt is preserved in `verification/pr66-merged-history.json`. Exact final head, PR and checks belong to the generated receipt. Keep the combined draft unmerged for owner Makko review.

## September 16, 2026 — repair playable traffic, terminal placement and visible city motion

Base/rollback is merged PR #65, `a8a0dfdd587906f4beea976a15c9671a40d5aac6`; branch `agent/traffic-background-repair`. The owner reports #65 failed the placement/animation review and reports absent car warnings/damage. The merge is not acceptance. Earlier current-work sections are historical.

The terminal now sits at x=560, y=638: 20px forward of #65, with its rear at the facade and its right edge clear of the shop windows. It remains present from training/reset, climbable, and behind enemies and holograms; 12px remains before the actor foot plane. The street-to-terminal-to-awning route remains reachable.

Traffic code was retained, but warnings and damage were explicitly disabled before mission start. Playable training now shares foreground traffic hazards with the mission. Its vertical camera also follows roof travel instead of staying locked at street level. Preserve original car artwork, 15% foreground probability, random altitude/direction, scale, speed, bob and three-second queued launch. Boss/cinematic/stopped-play gates and hack/recovery protection remain. Distant cars remain scenery, and high cars cannot hit a player at another altitude.

Animation now includes visible foreground rain behind actors, slow light sweeps within existing signs from training onward, stronger pavement steam and chimney haze. The skyline retains its fixed scale; no new artwork, audio clock, timer or particle population. Reduced flashes keeps sign light steady. This animates atmospheric/sign layers; the buildings and painted cloud illustration remain fixed.

Read `ENVIRONMENT_REPAIR_PASS.md` for diagnosis, audit, exact native evidence and limits. Canonical pack version 67 matched all 386 exported base files; its full manifest/receipt and the owner failure are preserved in `verification/pr65-merged-history.json`. Exact final head, PR and CI belong to the generated receipt. Keep the new draft unmerged for owner Makko review.

## September 16, 2026 — sidewalk terminal depth and animated fixed-scale background

Current review branch: `agent/sidewalk-box-background`, based on merged PR #64 (`97b6367b53bc719594e77f32d89cc6bfdfbe72f7`). The owner requests a box set farther back on the sidewalk, visible from the start, with enemies and holograms in front; also a background that stops changing size while walking and has animation.

The one left-side terminal moves from y=650 to y=618, keeping x=690 and its existing 160×206 collider/art registration. Its foot is 32px behind the actors' foot plane. It renders and supports jumps during training and after reset. Only this permanent terminal moves to the scenery pass; upper supports, lift, rewards and boss retain their established order. Hologram fields render over it.

The distant skyline uses one fixed, aspect-correct screen-space size with horizontal/vertical parallax and enough overscan for rooftops. It no longer stretches to cover each moving inverse viewport or inherits walking-induced gameplay zoom. Foreground buildings, traffic and the existing world/cinematic camera keep their transforms. Sparse rain, chimney haze and slow window-light variation use the existing pause/reset-owned clock; reduced flashes keeps the lights steady. Existing artwork and cached haze textures are reused.

See `BOX_BACKGROUND_PASS.md` for acceptance, native previews and limits. Canonical pack version 65 matched all 379 exported base files; its manifest and test receipt remain in `verification/pr64-merged-history.json`. Latest head, PR and final test/CI results belong to the generated receipt. Owner Makko acceptance remains pending; this pass is a draft for review. Earlier current-work sections are historical.

## September 16, 2026 — Cross beats, contextual hack notice and street polish

Current approved branch: `agent/cross-beat-hack-popup`. Base/rollback is merged PR #63, `c6dc0116d08a70ca2c97edddb9404bd87e62906a`. The owner explicitly adds the top background gap, jittery Jammer, Down + Jump platform descent and illustrated rain-soaked blacktop to the Cross beat / unobtrusive hack HUD request. This is one combined draft; older current-work entries are historical.

Cross (× / Xbox A) now jumps outside Rhythm Mode and hits beats inside it; held-button transitions require release. Existing default Square beat saves migrate once by layout version; custom mappings and preferences remain. Jump/beat may share a button; other conflicting actions move to valid slots. Down + the mapped jump drops through the current support, including exiting Rhythm Mode for descent, while retaining the next lower landing and solid street. No held-chord chain dropping.

The HACK panel becomes a brief top-gap HACK READY notice only with a usable target: 1.8 seconds held, 0.6 second fade. Recharge/locked/no-target panels disappear; cooldown and hijack rules remain. Sky art covers the actual inverse viewport through roof travel and zoom. The Jammer housing uses the existing first whole-body pose at a fixed anchor, with gentle signal animation; legacy foot jitter is removed and its label sits above the dish. New wet blacktop starts below the existing curb at y=890; rails and traffic stay aligned. Asset ancestor: `6e1c8a4eb58252e1491dedc7878630dbab14929a`.

Owner continuation: relocate the rhythm lift to x=2440, y=856→358 at the middle-right Firewall canopy, with `destinationSurfaceId` owning both the landing and boss pursuit target. The single illustrated terminal moves to x=690, top y=650, on the left; its established collider ID stays stable. The terminal-to-first-awning entry route and lift-to-canopy transfer pass at 30/60/120Hz. Upper routes still connect across the district. Right-half Jammer spawn candidates move to 3100/3520/3820 to keep all three random positions clear of the relocated lift's full attack range; the three left-half slots stay unchanged. No extra box or elevator is added.

Read `CROSS_BEAT_STREET_PASS.md` for behavior, validation and the Makko route. Canonical pack v64 matched all 367 base source exports; its original manifest/test receipt are preserved in `verification/pr63-merged-history.json`. PR #62 remains owner-failed historical evidence. Automated/native checks are not physical DualSense or hosted Makko acceptance. Exact final revision, PR and CI belong to the generated receipt; keep the draft unmerged until owner acceptance.


## September 16, 2026 — controller playtest repair and car approach warnings

Base/rollback is merged PR #62, `af8019a1e7755195c4e6e2cddf1e3d3f9f82002a`. Branch: `agent/controller-jump-traffic-warning`. The owner reports that #62's controller changes failed in play: RB still made a tiny jump and Cross stopped movement. Preserve that failure attribution; earlier passing automated checks were insufficient.

The failure reproduces in playable training: its hardcoded bumper jump bypasses the mapped held state, causing an immediate release cut (54.81px rise at 60Hz), while Cross advances dialogue and clears inputs (no jump). Training now shares the normal mapped jump for press/hold/release. Cross/A jumps throughout playable training and gameplay; Create/View advances crew speech without clearing movement. R1/RB remains inspect. Menu/intro/keypad ownership remains contextual. Full input-plus-update trajectories match keyboard flight at 30/60/120Hz, including remapped jumps; held Cross reaches about 286px at 60Hz. Jump physics are not retuned.

New illustrated red WATCH OUT tag and independently reversible arrow are pinned to asset ancestor `27c23b7042a903006f79683f01518f9b5eec49fb`. Warning begins three seconds before projected artwork entry (within one frame), flashes without vanishing, points off the correct left/right edge at the actual car height, follows zoom/vertical camera, and ends on the first visible artwork. Only the text tag can shift to clear the HUD, with a connector back to the true-height arrow. Entirely off-view flight does not create a false warning at another level. Original car speed, scale, height, bob, probability and three-second queued launch remain.

Read `docs/source-pack/CONTROLLER_TRAFFIC_REPAIR.md` (or its root pack copy) for evidence and owner review. Tests/native rendering are not a fresh physical DualSense/Makko acceptance. Exact final validation, PR and revision are in the generated receipt. Keep the new draft unmerged pending owner acceptance. Earlier entries are history.

## September 16, 2026 — controller settings and visible hack availability

The owner approved the settings pass and asked for visible hack recharge. Base/rollback is merged PR #61, `91bc4917462062056ebe2cec7d01b89783d81850`; branch `agent/controller-settings-hack-meter`. The earlier controller recommendations are now approved and implemented: Cross jump, Square beat attack, Triangle hack/release, L1 Rhythm Mode, R1 inspect, Circle contextual back/exit and Options pause. Gameplay actions can be remapped under Pause → Controller settings, with saved deadzone, prompt style and vibration. Contextual dialogue/keypad/menu controls stay explicit and fixed.

A live hack meter shows charge, remaining seconds, target/grounded requirements, training lock and active ally/release time using the same availability gates as hack input. The ten-second cooldown, shorter lost-target cooldown, eight-second hijack, attack judgments and movement remain unchanged. Existing standard-mapped controller ownership is shared across gameplay and menus, with held controls blocked on reconnect/resume. No new art, gameplay balance or audio timing change.

Full tests and all-JavaScript syntax checks pass. Production Canvas settings, remapping and six hack states have been rendered and inspected. These checks use synthetic controllers and native rendering, not a physical DualSense or hosted Makko. Read `docs/source-pack/CONTROLLER_SETTINGS_HACK_PASS.md` (or the root copy in the source pack) for the test route and limits. Exact draft head, PR and CI are in the generated receipt. Owner Makko acceptance remains pending before merge. Earlier current-work entries are historical.

## September 16, 2026 — current upper-route follow-up after merged #59

The owner requested the Jammer-arrow correction, visible drones, barely visible roof-edge guides, a free boss-combat camera, more rooftop exploration, a sharper boss intro, an illustrated elevator and boss jump/climb participation above the street. `UPPER_ROUTE_BOSS_PASS.md` records the recovered combined implementation and focused review. Thin continuous rails and hardware depth remain part of the saved continuation. Base/rollback is `a4c16069b008c508a1dca60aeba3aab7e3c29b3f`; branch `agent/upper-route-boss-polish`. Preserve original car motion, single jump, the 20-defeat mission and existing combat/music rules. Exact reward/timing/art choices are implemented for owner Makko review, which remains pending before merge. Older latest/current entries below describe earlier milestones.

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
| D-010 | LOCKED; placement revised September 16 | Jammer appears in the widened central band at 20 defeats, clear of the lift and right-edge boss framing; sixteen health, one damage per successful rhythm hit. Environmental owner; not hacked/stomped. The earlier opposite-half rule is superseded by the owner's explicit placement request. |
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
