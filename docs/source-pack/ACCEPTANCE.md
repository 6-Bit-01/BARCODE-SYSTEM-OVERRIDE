# Acceptance and Test Status

## September 16, 2026 — controller settings and visible hack availability

The owner approved the settings pass and asked for visible hack recharge. Base/rollback is merged PR #61, `91bc4917462062056ebe2cec7d01b89783d81850`; branch `agent/controller-settings-hack-meter`. The earlier controller recommendations are now approved and implemented: Cross jump, Square beat attack, Triangle hack/release, L1 Rhythm Mode, R1 inspect, Circle contextual back/exit and Options pause. Gameplay actions can be remapped under Pause → Controller settings, with saved deadzone, prompt style and vibration. Contextual dialogue/keypad/menu controls stay explicit and fixed.

A live hack meter shows charge, remaining seconds, target/grounded requirements, training lock and active ally/release time using the same availability gates as hack input. The ten-second cooldown, shorter lost-target cooldown, eight-second hijack, attack judgments and movement remain unchanged. Existing standard-mapped controller ownership is shared across gameplay and menus, with held controls blocked on reconnect/resume. No new art, gameplay balance or audio timing change.

Full tests and all-JavaScript syntax checks pass. Production Canvas settings, remapping and six hack states have been rendered and inspected. These checks use synthetic controllers and native rendering, not a physical DualSense or hosted Makko. Read `docs/source-pack/CONTROLLER_SETTINGS_HACK_PASS.md` (or the root copy in the source pack) for the test route and limits. Exact draft head, PR and CI are in the generated receipt. Owner Makko acceptance remains pending before merge. Earlier current-work entries are historical.

## September 16, 2026 — sustained walk loop repair

Base/rollback: merged PR #60, `5e0de1e16f2e40fd077468a18b0404e067cf634f`. Branch: `agent/walk-loop-repair`. The owner reports the recurring walk hitch during long strides and asks for a smoother pass. The previous twelve-pose selection omitted the four return poses available in the retained complete-body source. Restore source poses 0–15, with circular body registration, planted foot baseline and uniform 62.5 ms frames. Sixteen drawings now fill 64 host frame slots across four one-second strides; movement speed, collisions and other actions remain. No generated replacement art is installed.

Asset ancestor: `3e1af42b28521ff02efd7343792a890196493f70`; manifest ancestor: `215fde24db9f7493f1ee862e14761eb097db55e9`. The active startup pin and registry detection require this repaired manifest, including when the old walk is already cached. Read `WALK_LOOP_PASS.md` for the native before/after, long-hold tests, controller recommendations and Makko route. Controller changes are recommendations only, pending owner selection. Exact head/PR/CI are in the generated receipt. Makko acceptance remains required before merge; previous current-work entries are historical.


## September 16, 2026 — upper routes, boss pursuit and readable guidance

Current review branch: `agent/upper-route-boss-polish`. Base/rollback: merged PR #59 (`a4c16069b008c508a1dca60aeba3aab7e3c29b3f`). This expands the saved Jammer-arrow repair with the owner's later request for visible drones, faint roof landing lines, free boss-combat camera movement, more rooftop exploration, a sharp boss flourish, an illustrated elevator and boss participation above the street. Earlier current-work entries are history.

The two existing mission drones move into the first packets over Cache's awning and Tower's lower roof. No extra mission kills: quota stays 20. Existing roof edges gain a one-screen-pixel light stroke with a faint dark keyline. Three optional crown-roof signal caches reward a total of 1,500 score and up to three existing Amp charges; rewards are one-time per run and checkpoint-consistent. The single broadcast terminal and existing platform geometry remain.

Boss combat releases the vertical camera lock. The boss takes a distance-aware route through actual supports using an 850 ms landing warning, an 800–1,250 ms animated leap, and a counter window after landing (one second plus the next beat on intermediate supports; normal recovery at the destination). No landing contact attack. Roof pulses stay on their support's height and horizontal span. Base health, damage, musical attack timings, and player movement remain. Retry returns the boss/camera to street state.

New illustrated lift carriage, twelve crisp whole-body flourish drawings and eight leap drawings are pinned to asset commit `b1e9de902b325a949562e8ebeece375a8452ecca`. The new flourish is drawn by the shared production image cache over the existing animation owner, avoiding the host's stale low-resolution artwork. The four-second entrance uses quick motion, a held roar and return; combat keeps its existing sweep clock. Boss idle/walk and all player art are preserved. Prompts and registration are in `assets/upper-route/`.

The continuation also narrows the existing continuous emitter artwork to 14 world units, with compact caps and elbows, retaining its full facade-to-street footprint and prebaked powered/off states. Only emitter hardware draws behind enemies; gate fields, lift, repairs, props and boss retain the established foreground order. Original cars and the single broadcast terminal remain.

Read `UPPER_ROUTE_BOSS_PASS.md` and the latest acceptance route. Production-module and native-render evidence are not hosted Makko acceptance. Exact review revision, final test results and PR are in the generated receipt. Owner Makko review remains pending before merge.


## September 16, 2026 — restore Jammer arrow to the screen edge

Base/rollback: merged PR #59 (`a4c16069b008c508a1dca60aeba3aab7e3c29b3f`). Branch: `agent/fix-jammer-arrow-edge`. The owner reports the guidance arrow appearing over the player. At zoom 1 and 1.2, the player's projected position lies below the arrow's safe bottom (770); the old ray starts on that clamped boundary and selects its zero-distance bottom intersection. Reproduction at player x=960, y=784 and Jammer x=3520 yielded arrow (960,770), directly over the player.

For a Jammer beyond the left/right viewport, place the cue on that corresponding safe edge, clamp its height and point its artwork at the projected target. The normal-zoom reproduction now gives (1840,770). Keep current arrow artwork, distance, pulse/fade, single UI draw owner, on-screen hiding and gameplay. No asset changes. The circled facade-emitter appearance is not changed by this focused arrow correction.

The production-module mission harness covers both directions, ground/jump heights and four zooms (24 combinations), target direction, HUD bounds and hiding on entry/removal. Required suite/syntax results and exact review head are recorded in the generated receipt. Native/VM checks do not establish hosted Makko acceptance. Earlier current-state entries below are historical.

### Focused Makko review — pending

Import the exact draft revision from the receipt into a fresh preview. Reach the revealed Jammer with it offscreen: the arrow must sit at the far left/right edge toward it, not over 6 Bit, while standing, walking and jumping. Approach until the Jammer enters view: the arrow must disappear. Check the opposite direction on another reveal/debug placement, then destroy the Jammer and confirm the cue stays hidden through the boss handoff. Record the imported SHA and PASS/FAIL before merging. After merge, re-import the actual main SHA and repeat the focused route.


## September 16, 2026 — street depth, one terminal and render cost

Base/rollback is merged PR #58 (`1c8b54ec5db0e102f64c0ffb15bd4b57c5e5acda`). Branch `agent/street-depth-terminal-performance` implements the owner's new feedback: draw emitter hardware behind enemies, replace three large generic boxes with one illustrated broadcast terminal at the Tower, and reduce wasted scenery rendering. The two removed boxes also lose their colliders; thin wall-mounted supports remain. Baked original rail geometry/off states use asset ancestor `1891ebb4e061971362817832e942ef9fbe05d15a`. Native gate-pass draw calls fall from 14 to 1 for the first gate and 55 to 2 after all gates clear at the fixed review camera. This is not a hosted FPS claim. See `STREET_DEPTH_TERMINAL_PERFORMANCE.md` for implementation, assets, tests, limits and the exact Makko route. Review head/CI belong to the generated receipt. Owner Makko acceptance is pending; earlier entries are history.

## Thin rail / original traffic correction — owner review pending

Base/rollback `f048d229a51b9ecce801cd9d736613491c4ae2f9`; branch `agent/thin-rails-original-traffic`. Exact tested/published head and automated results are in the generated receipt. Import the draft head before merging. Use the complete review route in `THIN_RAIL_TRAFFIC_CORRECTION.md`: original cars both directions and protected damage, four full-height facade/curb rails and opening, faint roof edges/foot masking, 3D box/lift, Firewall turns/contact/crowds, drone warning/shot/hijack, heart rewards, both puzzles on controller/pointer with untimed practice, separate cutscene buttons, Objectives, audio, twenty defeats, Jammer and boss/retry/restart. Record SHA, PASS/FAIL and clips. After acceptance and merge, read/import the actual new main merge SHA into a fresh preview and repeat. Native footage and automated checks are not hosted gameplay acceptance.

## Level 1 rebuild after reverted #55 — owner review pending

Base/rollback: `6e3751ba1561d8694e0bdc9a623e74ac6a45624d`; branch `agent/level1-rebuild-reviewed`. Exact review head and PR are in the generated source receipt. Test this head before merging. The failed #55 was reverted; earlier pending-pass instructions below are historical.

1. Import the exact PR head into a fresh Makko preview. Check cold asset loading, title and all intro scenes. Rapid Space/A presses must stop at the current scene; Enter/RB and the separate Next Scene button advance only when ready. Check pointer controls, deliberate S/B hold skip and gameplay handoff.
2. Walk and reverse beside Firewall on both sides; watch several complete strides, attack/recovery and pause/resume. Test side contact during invulnerability, hacking and crowds beside gates/boxes. Bodies must separate; clean descending ordinary stomps must still defeat and rebound. Record any unexpected damage with health before/after.
3. Inspect the shared sidewalk foot plane, shadows, lift boarding, Jammer and boss contact. Use the utility box and service steps; their top/side must match the scene. Inspect all four barrier mounts, sidewalk/curb/road footprint, player pressure, enemy passage, opening and dormant machinery.
4. Climb the original route and the building crowns using the existing single jump. Check landings/reversals, selected parapet masking and camera ascent/descent/return to the boss. Ground guards must stay on their own surface. Collect the heart repair while hurt, verify a full-health cell stays available, and check the carrier drops once.
5. Fight the new Cache and Tower drones: patrol stays near its own roof, lock/shot/recovery is readable, its attack is avoidable, stomp/rhythm damage counts once, and H conversion targets hostiles. Release/expiry must clear allied shots and give the normal reboot safety. Complete all twenty mission defeats and check the last-enemy direction hint.
6. Watch warned foreground cars from both directions and at different roof heights. They must use the existing artwork. Confirm the 2.8-second direction/height warning, safe waiting space, a single damage event, and pause/hack recovery without an unseen incoming hit.
7. Complete both H puzzles using keyboard, controller only, and mouse/touch keypad. Navigate/select/correct/submit/cancel; verify the original slowdown, eight-second ally, cooldown and tutorial locks. Check Objectives, recent dialogue/instant text, rhythm/Amp, audio, discoveries, sixteen-hit Jammer, boss win/loss/retry and full restart.

Record imported SHA, PASS/FAIL and short clips showing (a) Firewall/contact/barrier, (b) roof masking/drone/car warning and hit, and (c) dialogue separation/controller keypad. Record browser/controller and repro steps for failures. Automated checks/native Canvas renders do not certify hosted art delivery, audio or game feel.

**Normal post-merge deployment:** after owner acceptance and merge, read the actual new `main` merge SHA, import that exact revision into Makko and open a fresh preview. Repeat steps 1–7 and record the deployed SHA and the same focused evidence. Do not assume the review SHA is the merge SHA. If needed, re-import base `6e3751ba1561d8694e0bdc9a623e74ac6a45624d` to restore the reverted baseline. Further campaign/cloud work follows acceptance of this rebuild.

## Wall sidewalk/street footprint review

Base/rollback: merged #53, `685d13d4de1d56c8a39a82077460d894144bd091`. Import the exact new PR head from its description/source receipt into a duplicate Makko project and start a fresh preview.

1. At the tutorial wall, check that the bottom crosses the sidewalk in perspective, drops down the curb and reaches the street, with no strip of apparently open pavement in front. Its upper portion still reads as a tall wall through the buildings/rooftops. Compare with `Barrier-Sidewalk-Street-Review.png`.
2. Walk/jump toward the closed boundary; check that it still stops the player at the original gate. Follow all four encounters, view their walls from the street and available rooftops, and clear each gate. The full field should collapse/fade together and movement should unlock immediately as before.
3. Move the camera toward/away from a wall so the foreground extension enters first; check for popping/clipping. Pause during a collapse, resume, restart, and check reduced effects. Retain walking/audio, hijack/repair, lift, Jammer and boss/retry smoke checks.

Record imported SHA, PASS/FAIL and one short clip showing the sidewalk/curb/street footprint, a blocked jump, gate opening and movement through it. Native drawing and automated validation do not replace owner Makko review. After acceptance and merge, import the actual new main merge SHA, open a fresh preview and repeat these same checks; record deployed SHA and evidence. Roll back this visual correction by re-importing the base above.

## Enemy hijack / repair route review

Use the exact new review SHA from the PR/source receipt. Walk PR #52 is already merged at `66c17d1880f5de933e9b928833e5dd2bfff6a817`; this new draft targets main directly and preserves all completed walk and hijack work. Follow `ENEMY_HIJACK_REPAIR_PASS.md`'s focused Makko route: both H puzzles, all three ordinary target types, one ally, enemy combat, player-friendly fire exclusion, target death/failure/cancel, early release, expiry/reboot, pause/restart, full-health/injured repairs, one carrier drop, both directions on the two supports, gate counts and boss retry. Preserve intro/music/lift/Cat/Amp/lore/Jammer/boss smoke checks.

Capture imported SHA, PASS/FAIL and a clip covering target lock → conversion → enemy hit → expiry/reboot → repair. Automated checks and native Canvas review do not replace this owner test. After acceptance/merge re-import actual main merge SHA into a fresh Makko preview, repeat the route and record SHA/evidence. This pass's base/rollback is `66c17d1880f5de933e9b928833e5dd2bfff6a817`, retaining the merged walk; earlier pre-walk rollback is `ea2921960477e38c74740dda378fcb513a8f1cc1`. Neither merge nor automation claims a Makko PASS.


## Current review: stable 6 Bit walk and compact atlas

Base/rollback: merged #51, `ea2921960477e38c74740dda378fcb513a8f1cc1`. Import the exact published head of `agent/player-motion-polish`, identified on its PR and generated receipt. Earlier pending #51 wording below is historical.

1. Start a fresh Makko preview. Hold a direction for several full strides in both directions, including while the camera follows. Watch the body, planted feet and loop seam; confirm the earlier shake/surge and faint extra limbs are reduced. Pause mid-stride, resume and repeat after restart.
2. Start/stop, reverse direction, jump/land while moving, and enter/leave R. Confirm instant controls, normal jump height/reach, stable idle, existing rhythm poses, contacts and ground speed.
3. Traverse the existing lift/rooftop route and encounter walls. Retain title/intro, H/R, audio, Jammer/boss, win/loss/retry and restart checks. Health behavior, traffic collisions, platforms and cloud rooms have not changed in this PR.

Record the imported SHA, PASS/FAIL, and a short clip showing both walking directions, one turn, jump/landing and pause/resume. The comparison video is a sprite diagnostic, not hosted game footage. Owner Makko acceptance remains required before merge.

After acceptance and merge, import the actual new `main` merge SHA into Makko, reopen a fresh preview and repeat the same route. Record the merge SHA and the same short movement clip. Rollback: re-import `ea2921960477e38c74740dda378fcb513a8f1cc1`.

## Current review: idle, flourish and fireball polish

Base/rollback: merged PR #50, `42aebe8c19853da510c385c45606dfd3b4c7973a`. Import the exact published head of `agent/animation-fireball-polish`, recorded on the PR and source-pack receipt. Earlier pending PR #49/#50 instructions below are historical.

1. Open a fresh Makko preview and Start. Watch at least three complete 6 Bit idle loops, then walk, jump/land and enter/leave R. The loop should return without the old take splice; the existing pose timing and feet should remain stable. Restart/reopen and confirm the repaired artwork is still installed without loading errors.
2. Destroy the Jammer and watch the full boss walk → close-up → flourish → idle handoff. The clarified flourish retains 48 poses/four seconds and the same body size and ground contact. Check it again during the combat sweep.
3. Watch fireballs in both directions and the later double pulse. Check the larger flame, soft glow, wake and steady hot front. Jump them and check the same health loss, speed, attack warnings and counter timing; paused effects must freeze and resume with gameplay.
4. Finish one win and one loss/retry, then restart. Retain the normal title/intro, movement/contact, lift, H/R, music/audio and Jammer-to-boss smoke route.

Record the imported SHA, PASS/FAIL and short clips of three idle loops and the boss flourish/fireballs; include health before/after any unexpected hit. Automated/native-Canvas checks do not establish hosted Makko acceptance. Owner acceptance remains required before merge.

After acceptance and merge, re-import the actual new `main` merge SHA into Makko, open a fresh preview and repeat steps 1–4. Record that merge SHA and the same two clips. Roll back by re-importing `42aebe8c19853da510c385c45606dfd3b4c7973a` if needed. Stage C campaign services remain deferred until this presentation pass is accepted.

## Level 1 presentation smoothing after merged #48

Base/rollback: `de9a63ea9311aba23d6a9ad6c3dca3b5e8aa50a5`. Import the exact head of `agent/level1-presentation-smoothing-recovery`; owner Makko acceptance is required before merge.

1. Watch 6 Bit, Virus, Corrupted, Firewall, Jammer and boss idle through complete loops. Confirm the approved designs/actions remain recognizable, texture/silhouette flicker is reduced, and feet/contacts do not drift. Jump and Firewall attack endpoints must still read cleanly.
2. Reveal the Jammer and confirm its visible foot sits on the same 822 sidewalk contact as the actors, without changing range, health or the destruction sequence.
3. Traverse with normal and foreground cars. Background light cones must pass behind buildings; foreground-car light remains over the buildings and behind its car.
4. Run the tutorial and confirm the pink objective card has its own space below score/lore. Inspect the Studio Cat on Cache Overpass: it dashes across the rooftop once, is away from the lift, retains both crew lines and does not replay after collection or reload.
5. Enter all four encounters. Each closed barrier must read as a tall digital wall spanning the sidewalk perspective, then dissolve on the existing immediate unlock clock. Confirm jumping, collision and progression are unchanged.

Automated checks preserve all atlas counts/timing/anchors, verify hashes and smoothing provenance, and exercise the presentation ownership changes. They do not certify live Makko playback, audio, or final visual feel.

Recovery verification: all twelve remote atlas hashes and sizes match the saved outputs; delivery is pinned to `1edf7fe6a011b88d511b955db9d1342f78912009`. The complete local test suite and all-file syntax pass, including equal-time playback at 30/60/120/144 Hz, irregular frame deltas, native speed/pause/one-shot behavior, stable idle references and full jump apex/recovery drawings. Record the exact imported PR head plus short clips of character transitions and the Jammer-to-boss sequence during owner review. After acceptance and merge, re-import the actual new `main` merge SHA into Makko, reopen its preview, and repeat the five checks above plus title/intro, lift, H/R, audio, boss win/loss/retry and restart. Roll back by re-importing `de9a63ea9311aba23d6a9ad6c3dca3b5e8aa50a5` if required.

## Makko sprite-loading repair after merged #47

Base/rollback: `8f09568eeb9726f7b80fb43e1ecb3f6e4672bea2`. Import the repair branch `agent/fix-makko-sprite-loading` at its published review head.

1. Open from a fresh Makko preview, press Start and confirm 6 Bit uses the new idle, walk, jump and rhythm drawings, including the player created before startup finishes.
2. Confirm Virus, Corrupted and Firewall use the replacement sprites throughout their actions. Check the Jammer and boss idle when reached; the two intentionally retained boss clips remain as documented below.
3. Reopen/restart and check there are no repeated sprite downloads, duplicate initialization, shifted feet, or changes to controls, collision, rhythm, hack, intro, HUD and the updated city layers.

Automated coverage includes cold/old/mixed/current registries, single-flight startup, player rebinding, cleared timeout and all twelve atlas paths. Actual saved Makko SDK drawing is recorded in `verification/makko-model-runtime.json`; its local image transport does not certify live host import or audio.

## Recovered model art / live HUD — September 14, 2026

Review `agent/finish-model-art-hud` at the exact head in its PR/receipt. Base/rollback: merged #46, `f3bf9ed294a2bd69fe3a7dccc02a1c50b9241db2`. Owner Makko review is still required before merge.

1. Confirm the model-based 6 Bit idle, walk both directions, jump and headbang appear. Check planted feet and body fairness on street, roofs and lift.
2. Confirm Virus, Corrupted, Firewall and Jammer use the recovered drawings; check warnings, contacts and all animation transitions. Inspect Firewall flame continuity, particularly the three previously flagged poses.
3. Check both city layers across the whole street, including transparent gaps, building/platform alignment and seams.
4. Check the sampler/barcode HUD in exploration, rhythm and boss play. Health, score, lore, combo, Amp and target timing must reflect actual state; healing and fragment flights must end on their panels.
5. Complete the retained title/intro/tutorial, H/R, audio, twenty-enemy mission, Jammer, boss loss/win/retry, pause/restart and save smoke route. Boss idle is redrawn; walk/flourish and traffic deliberately remain their working original animations because the final new exports were not saved.

Native Canvas and deterministic tests do not certify Makko playback, audio or game feel. Earlier routes below are historical.

> **Recovery checkpoint, September 14.** Draft PR #46 exists. Twelve recovered complete-body clips (547 frames), the approved city layers and live HUD are being installed and checked on that same branch. Final boss walk/flourish and vehicle loop exports were removed by workspace maintenance before publication and could not be recovered from GitHub or the saved v5. The original working boss walk/flourish and traffic remain. Do not regenerate the approved designs, claim full completion, or merge this checkpoint. See MODEL_ART_RECOVERY.md.


> **September 13 production checkpoint — in progress.** The owner approved integrating the model-based artwork and HUD as one combined pass on `agent/model-art-hud-integration`, from merged #45. Twelve complete-pose clips (547 frames) and the live HUD are prepared. Final two boss clips, vehicle loops, scenery/anchor calibration, delivery pins and full validation remain. No PR or Makko acceptance is claimed at this checkpoint. See `MODEL_ART_HUD_IMPLEMENTATION.md`; older review-only sections below are historical.


## Current review — model-based art, full-body trial and new HUD

This checkpoint needs visual review of bundled examples; the playable source remains merged #45. Open `repository-snapshot/docs/visual-overhaul/hud-review.html` in the ZIP and switch Explore, Rhythm and Boss. Pause/Play controls the trial. The mode values are explicit examples, not live gameplay.

1. Inspect the hero sheet and actual model PNGs together: cap and green brim, glasses, face paint, exposed mouth/chin, brown hair, coat, shirt, gloves and boots.
2. Watch `headbang-overhaul.animated.webp`: original left, model-based redraw right. All 48 original frame keys/order/durations are retained at 12 fps, but generated anatomy and details are not pixel-exact. Judge cap/coat/hair consistency, full-body fold/recovery and the midpoint/repeat seam. No duplicated filler frames are added.
3. Compare every enemy type, all three vehicles and both city layers in the accompanying sheets. These are drawing examples; full enemy/traffic sequences and precise platform/repeat-seam mapping remain unfinished.
4. Judge HUD legibility in quiet exploration, active rhythm and boss states: barcode health, beat target, combo, Amp, objectives and boss warnings. The preview uses fixture data and a separate renderer; no live UI/gameplay modification is claimed.

`VISUAL_OVERHAUL_REVIEW.md` lists provenance, scope and production work still needed. The generated receipt records actual local checks; no real-browser/Makko acceptance or new external publication is claimed. Owner Makko review remains required before a future integrated build merges. Earlier sample/import routes below are historical.

## Historical review — subtle whole-frame restoration

The owner rejected the cutout animation. The active runtime, original sprite manifest, anchors/facing and scenery now match merged #45. Three complete 2x restoration trials are **not installed**; this checkpoint needs art review, not a new Makko import to view the samples.

1. Watch the individual `verification/original-motion-headbang.animated.webp`, `original-motion-jump.animated.webp` and `original-motion-attack.animated.webp` comparisons: original left, restored right, matched source frame and display size, each looping its own full cycle. Compare the headbang fold/recovery, jump tuck/landing and Firewall lunge/punch. Check temporal texture flicker and whether the modest clarity gain is useful. The combined overview is useful for a glance but can interrupt a repeat of a shorter clip at its shared reset.
2. Inspect the full original/restored image and JSON pairs in `assets/studies/original-motion/`. All 134 source frames, keys, order, durations and tags remain; all spatial coordinates are exactly doubled. The decoded restored alpha must equal the original alpha replicated 2x. These invariants are checked during generation and recorded in its manifest.
3. Treat approval of this sample quality separately from eventual runtime acceptance. Any integration must keep original logical dimensions, foot/head anchors, facing and phase-selected frames; doubling atlas pixels alone must not double actors or collision bodies. Preserve the complete AGENTS Makko smoke route for a future integrated build.

Required local regression and all-file syntax results are recorded in the export receipt. No new Chromium CI, live Makko review, hosted asset publication, PR or merge is claimed. The old cutout import route below is historical and must not be followed for this checkpoint.

## Historical cutout replacement route — rejected and inactive

Import the exact `agent/sprite-upgrade-study` draft head into the duplicate Makko project. Base/rollback is merged #45, `c557c87bb0e04287e6c694d7d6559174d8b65d06`. This is the complete runtime replacement described in `SPRITE_REPLACEMENT_PASS.md`; the unused-study status below is historical. Original model PNGs were unavailable, so review 6 Bit's likeness against your originals as well as the derived intro reference.

1. Watch 6 Bit idle, walk both directions, turn, take off, reach the apex, descend and land repeatedly on street/roofs/lift. Enter/exit Rhythm Mode. Check cap, paint, human face and costume, continuous joints, clean alpha, readable poses and planted feet through every transition. The four source clips now face right.
2. Watch Virus pulse, Corrupted idle/walk and Firewall idle/walk/punch. Stomp ordinary enemies, take side contact and attack/hack as before. Judge readable warnings, body fairness, correct facing and contact; check both sprite-anchor paths supported by the host.
3. Clear all twenty mission enemies and destroy the Jammer. Check the complete boss entrance/idle/walk/pulse sequence. The existing +8% boss size and additional +6% walk increase remain. Review the subtle clarity refinement without expecting a new boss/Jammer design.
4. Traverse the whole street and rooftops in windowed/fullscreen view. Check panorama aspect, seams, foreground windows/platform alignment, three traffic animations and their lighting. Compare quiet traversal with busy combat for clarity.
5. Pause/resume, lose/retry the boss, win, restart and reload. Retain the full AGENTS smoke route for title/intro/tutorial, S/B skip, lift, H/R, audio, discoveries and saves. Watch for missing sheets, stale frames, duplicate loops, errors or a progressive slowdown.

Record the imported commit SHA, browser/window mode, a short clip showing hero transitions and enemy contact, and a clip showing the Jammer-to-boss sequence. Report any issue with exact state/facing/frame if available. Native Canvas and VM checks explicitly adapt Makko's boundary; they do not prove live host playback, audio sync or game feel. Owner Makko acceptance remains the merge gate.

## Sprite/background study status — after merged #45

The current `agent/sprite-upgrade-study` work contains unused art candidates and comparisons only; the playable runtime remains merged #45 (`c557c87bb0e04287e6c694d7d6559174d8b65d06`). This is not a new Makko gameplay build. Inspect `SPRITE_UPGRADE_STUDY.md` and `verification/sprite-upgrade-comparison.gif` for actual limitations. Both sprite studies are RGB with baked checkerboards; the walk has exaggerated knee lift and needs a corrected cycle. A model-faithful final hero requires the original face/front/side PNGs, unavailable in this workspace.

The panoramic background passes its aspect assertion and actual parallax composition with the unchanged foreground; owner art direction review is pending. Any eventual production sprite set must preserve foot anchors/body geometry, phase-selected jump/landing frames, flip direction, input/timing, and pass the retained gameplay/Makko route before merge. Do not treat a promising still drawing as animation/export acceptance.

## Studio Cat / chaotic FX / boss asset review — after merged #44

Import the exact `agent/level1-cat-chaos-assets` review head. Base/rollback is merged #44, `4b207c5570a6bccd86b95c702c11e1e6606bbf01`. New art and size/FX tuning require owner Makko acceptance before merge; older draft sections below are historical.

1. Inspect the cat at street x590 between encounters with E / LB. It must read as a cat, deliver the corrected crew exchange and walk beside the caption without covering text. Repeat after reload with the existing discovery saved; no new lore or duplicate discovery is granted.
2. Reveal the Jammer and move to either side until it leaves the screen. The textured pointer must aim correctly at safe edges, retain its distance label and disappear when the target is visible/destroyed. Check windowed/fullscreen and different zooms.
3. Compare repeated hits, combo-5 waves, combo-10 chains, landings, metal/data/strip defeats and major clears. Bursts should look noticeably different and more unruly while enemy warnings and the fixed beat target stay readable. Pause freezes their current shape; reduced flashes and shake settings still apply.
4. Watch the entire boss entrance, idle, walk and attack. The boss should be modestly larger and the narrow walk fuller; feet must stay on the street through clip changes, mirroring and movement. Check the 8%-larger stable body core feels fair for contact and stomp counters.
5. Watch/jump both directions of the textured ground pulse, including double pulses. The bright leading edge marks the same 64 × 56 hazard; warnings, damage and musical counter windows retain their behavior. Pause/resume, boss loss/rematch, victory and full restart must clear old effects and reuse the three images.

Retain the complete AGENTS smoke route for intro/tutorial, movement/contact, lift/roofs, H/R, audio, quotas/Jammer, boss win/loss/retry and restart. Focused production tests and native `verification/cat-chaos-*.webp` diagnostics cover code/frame behavior; the CI Chromium check covers image decoding/fallback and the existing intro routes. Neither replaces Makko playback/feel review.

## Combined ten-item impact/discovery review — after #43

Import the exact `agent/level1-impact-discovery` PR head into the duplicate Makko project. Rollback is `51b65d4cd71d369b05003ddaa83cfe6f88fe348b`. Owner Makko acceptance is required before merge. Keep the full opening/fullscreen, tutorial, movement/contact, H/R, lift, audio, mission/Jammer, boss win/loss/retry and restart smoke route from AGENTS.

1. Compare normal hits, damage, heavy roof landings, stomps and destruction. Their direction/weight differs; health and the beat target stay steady. Disable Screen shake in Pause and repeat.
2. Hit/defeat Virus, Corrupted and Firewall. Look for bright contact cores, data squares, displaced strips and hot metal. Debris continues after the enemy disappears; attacks/physics never freeze globally. Compare SFX and Flash accents off.
3. Build combo 5 and 10: a forward waveform then short chain links become real attacks. Brackets match the next successful hit, including turning, vertical separation and Amp use. Miss resets the tier. Check that boss guard and Jammer's one-health-per-success remain intact.
4. Perform across musical phrases: actual screen glass, curb, cable lights and pavement build with combo. Quiet traversal stays quieter. Enemy windups remain readable.
5. Jump, land from different heights, run across roofs and stomp near the hanging sign/vents. Check foot sparks, rattle, cable swing, steam and existing vehicle light sweeps without collision changes.
6. Play all four encounters. Signal Alley reconnects; Cache Overpass has protected descending Virus arrivals and traffic shadows; Firewall Plaza has heavier entrances; Broadcast Gate displays build to release. Confirm all 20 required defeats and unchanged gate progression. Clears visibly reframe/unlock the street.
7. Damage and destroy the 16-health Jammer. Watch increasing strain, breakup and buildings recovering in order through the existing cinematic. Rhythm Mode exits immediately. Boss entry/major pulses have weight; the final hit stays visible briefly before results. Retry preserves the restored district without replaying clears.
8. Read health, Amp, combo, objective and approaching beat notes at normal window size and fullscreen. The top-left target stays fixed through shake/zoom. Check keyboard/controller prompts, early/late feedback, calibration and the relocated lore-collection destination. After a successful hack, repair packets must land inside the health bar and its outline must follow that bar. On victory, watch the final impact and card fade before the score starts counting from zero; score, combo and lore must each finish at their saved totals. Pause and rematch must preserve/reset that animation cleanly.
9. Stomp during an encounter: only its caption tilts. Inspect the Studio Rat and watch it drag a bolt through the panel margin. Check its earned results callback; no callback is granted merely by drawing or standing nearby.
10. Between fights, backtrack to the rat at street x590; read Cliff's plate on the first roof x865; inspect WittyF0x's mark on the Firewall canopy x2475 and the venue flyer at street x1840. Use E / LB, then again for the optional crew reply; walk away to dismiss. H/Y still starts hacking. Pause, tutorial, fights and airborne states cannot inspect. Reload and revisit: facts persist, lore totals and combat stats do not change.

Automated evidence covers production target/input/save/lifecycle rules, protected arrivals, camera bounds, reduced effects, victory timing and existing mission/boss regressions. Native Canvas fixtures are in `verification/impact-pass-*.webp`; they use fixed scenario states and an animation adapter. Browser CI retains the intro/fullscreen regression. Audio feel, host sprite playback, controller ergonomics and final tuning remain owner review items.

## Staged intro review — after merged #42

Base/rollback: `f1831f95c187bdd5afd9c8231d2a7a10ac262671`. Import the exact head of `agent/intro-cue-staging` into the duplicate Makko project before merge. The owner confirmed the prior images are visible; this new timing/art pass needs its own review.

1. Start normally and wait. Art/title appear first; readouts, dialogue and captions follow in story order. Earlier speech stays visible, and the scene does not turn its own page. Judge the reading intervals in `INTRO_CUE_STAGING.md`.
2. Press Space once during a reading interval: exactly the next cue appears on the same scene. Hold it: no repeated advance. After the final cue, a fresh press changes scene. Check Enter, click and controller A too.
3. On pages 1, 2, 3, 5 and 6, readouts sit within the actual monitor glass and follow its angle. Pages 4, 7 and 8 use the lower page margin. Inspect page 5's corrected thumb/index grip and wrist; check DJ's face, likeness and two scope traces remain intact. Compare the final and staged renders in `verification/`.
4. Leave the tab or window while a line is showing, then return: its remaining reading time is preserved. Check fullscreen exit/re-entry and resize; text stays aligned and input stays usable.
5. On page 6, inspect the displaced recovery caption only after 6 Bit's refusal. Check reduced effects, early S/B release, a full independent five-second hold and both normal/skipped tutorial entry.
6. Complete the existing opening/tutorial into one mission; verify audible music handoff and the existing Level 1 movement, combat, lift, Jammer, boss/retry and restart route. Automated stubs cannot certify these Makko/audio/device results.

VM checks exercise the actual cue clock and owners. Native Canvas renders verify production layout; Chromium checks native fullscreen, decoded bundled art and trusted inputs with explicit initializer/gameplay/audio boundaries. Exact completed results belong to the receipt and linked CI run.

## Black-screen recovery — after merged #41

Base/rollback: `897b750cf64bafe3d50746cd7c8c19379ef4fbf6`. Test the exact head of `agent/intro-fullscreen-recovery` in the duplicate Makko project before merge. The owner-reported black screen supersedes the previous unconfirmed repair status.

1. Click Start normally. Page 1, its artwork, dialogue and controls must be visible immediately in fullscreen. Exit fullscreen, re-enter with Shift+F, and resize: the same page stays readable and clickable. If fullscreen is declined, it remains usable in the window.
2. Read/advance all eight scenes with click/Space/Enter or controller A. Also take the five-second S/B skip route, including early release with a connected controller. Confirm page 6 inspection and the existing scene-placed dialogue remain.
3. Both completion routes enter Cache's “Still with you” tutorial once. The game canvas returns, intro overlay disappears, and the existing four-second audio fade completes. Complete movement/jump, training, R and H gates; the mission starts once at zero.
4. Check the existing movement/contact, lift, pause/archive, Jammer/boss/retry and restart smoke route. These systems were not retuned. Record exact SHA and any remaining host error.

The dependency-free regression includes the production fullscreen owner and both asynchronous request orderings, denied fullscreen, exit/re-entry, pointer input and tutorial handoff. GitHub's added Chromium check supplies real layout, native fullscreen, hit testing, decoded local artwork, keyboard/pointer, resize and visible failure/retry evidence. It uses explicit initializer/gameplay/audio boundaries and does not certify Makko sprites or audible audio.

## Current intro repair review — after #40

Base/rollback: `a747b58411650146bdc003a529d0470167d275db`. Review the exact manifest revision from `agent/intro-makko-repair` in the duplicate Makko project. The owner has already reported that PR #40's opening failed; the earlier checklist below is historical.

1. Open from the title and leave page 1 running for at least two minutes. All artwork should load and remain visible without context-limit errors. Advance through all eight scenes in windowed/fullscreen views; check the new balloon pointers, comms cards, faces, tape lock, scope, door hand and tower remain readable. Compare `verification/intro-contact.webp` with the host result.
2. Complete once by reading and once by holding S for five seconds, with a controller connected. Also test B, early release, mixed S/B holds, tab/focus cancellation and repeat/held advance. Page 6 inspection and its run-only results callback remain available.
3. After either intro path, Cache answers “Still with you” and Mac establishes the jammed district. Read/complete all five tutorial chapters: movement/jump, three training defeats, five rhythm hits, successful hack, and the final crew line's hold/fade. Check speaker colors/names and prompts. The twenty-defeat mission begins once at zero; no second boot, tower-collapse exposition or extra post-tutorial scene appears.
4. Listen through the existing four-second intro-song fade and gameplay music/rhythm start. Spot-check H/R locks, both hack puzzles, pause/archive, lift, Jammer cinematic, boss/retry and restart with existing saves.

Record exact SHA, project/origin, browser/controller and PASS/FAIL. Tests and native Canvas previews do not establish Makko rendering/audio/feel. Public endpoint/CORS evidence is in `verification/intro-asset-delivery.json`; it does not certify a host content-security policy.

## Intro correction — current owner review gate

Base/rollback: merged PR #39, `510342ed21692fd85f9b99ef6b29990a5694132d`. Review the exact exported revision in a duplicate Makko project. `INTRO_OVERHAUL.md` contains the complete script and reference images. **Makko acceptance is pending.**

1. Start from the title. The new eight-page opening must appear before any tutorial or mission. Read the original four's contributions and the broadcast failure/recovery disagreement. Compare all five visible character designs with the supplied models (INTRO_ART_DIRECTION.md); Cliff should appear only in the page-2 background and other characters remain offscreen/obscured. Confirm the eight bundled images load and names, dialogue, borders and page counter fit at your actual window/fullscreen size.
2. Advance with Space/Enter/click and controller A. Holding/repeating advance must not race through pages. The final page enters the tutorial once; a held A cannot jump/advance the tutorial as well. With an actual connected controller, hold keyboard S for five seconds. Repeat with no controller. Both must skip the entire opening, not just one page.
3. Release S early and confirm the skip cancels. Repeat with B, disconnect during a B hold, and hold/release S and B in different orders. One input must not cancel the other. Switching window/tab cancels unattended holds.
4. On page 6, inspect the displaced caption with Left Arrow or D-pad Left. Review its static endpoint with reduced effects. Finish normally or skip; the optional results callback should remain in that run. A fresh run clears it; persistent lore remains.
5. Listen through the existing four-second intro-song fade and gameplay start. Confirm one soundtrack/beat clock, no title-song overlap, no second crew scene after tutorial, and one mission entry. Spot-check existing tutorial H/R locks, movement, both hacks, pause/archive/calibration, lift, 20-defeat mission, 16-hit Jammer, boss/retry and full restart.

Record exact head, Makko project/origin, browser/controller and PASS/FAIL. Native Canvas renders are production-layout diagnostics, not certified Makko/audio captures. Tests specifically cover the reported S regression, all-page reachability, controller ownership, fade scheduling and stale startup cleanup. Full required suite/syntax and exported revision are recorded in the receipt.

The owner's next requested work is HUD/rhythm presentation and threshold-based attack variety. That follow-up follows the intro; Stage C is no longer the immediate next task.

## Historical acceptance records

Older checklists below describe their own review milestones, not a replacement for the current gate.


## Current campaign planning review — after merged PR #37

This pass changes development documents only. It does not create a new gameplay/Makko acceptance claim. Validate the exact committed review with the existing repository suite and all-file syntax check, inspect the diff for source/asset changes, and check the new plan's counts/references. The generated export receipt records commands, exit status and revision; historical reports below retain their original limits.

Review the concrete planning result:

1. Follow opening → all seven levels → finale in `CAMPAIGN_STORY_MAP.md`. Each transition has a reason, each lead contributes, required context remains on the main route and later payoff is identified.
2. Confirm only four playable characters, latest cameo inclusions/exclusions, Sheila's silhouette, 9 Bit's origin and separate-canon boundaries. No removed guest is a Tower gate.
3. Confirm exactly 28 distinct lore-purpose IDs in the distribution 3/4/5/4/5/4/3, preserving the three current records and durable save identity. The secret collection relationship remains development-only; no runtime copy was changed.
4. Confirm required inspiration references and the older candidate bank are represented, with proposed placements labeled. Scenes, art, exact ending rules and final later-level choices are not misrepresented as approved/shipped.
5. Confirm completed work through #37 is not rescheduled; remaining controller/steering/cue/HUD/camera/calibration, campaign/save/music, genre proofs, assets and mobile feasibility have concrete stages.

For the next gameplay implementation, use one representative route covering changed comms/panel/control behavior plus relevant baseline smoke checks: tutorial ownership/H/R locks, movement/contact, music continuity, lift/Jammer/boss, retry/reset, pause/archive and saved discoveries. Add production assertions for consequential changed behavior. Do not require the owner to replay every historical checklist to review these unchanged documents.

## Historical acceptance reports

## Current target: authored lore and archive — September 12, 2026

Review `agent/level1-lore-archive`, based on merged PR #36 (`58b6abe6179ce6b7e8996c4d4099c9eff674f35f`). The generated manifest/receipt ties required tests to the exact draft revision. Native Canvas renders verify complete text fit and production drawing; they do not establish live Makko rendering, audio or hosted storage. Owner acceptance remains pending.

1. On the same Makko project/origin used for PR #36, press P → Lore archive (L is the pause shortcut). Previously saved records should show their expanded text without recollection. Unrecovered entries must hide their titles and story contents. A different origin may have a separate browser save.
2. Read all recovered records with arrows/Tab/Enter and pointer clicks. Review the crew voices and 6 Bit replies against LEVEL_01_LORE. Esc goes back to the pause screen; P/Resume returns to play. World and music remain paused while reading, and held menu keys must not cause a jump/attack afterward.
3. On a normal fast run, collect the left awning, middle roof and upper route records after 4/9/14 mission defeats. All three remain available together. Collect two quickly: both notices should appear in sequence and both records should already be readable. The archive opens the latest pickup. Check one 500-point reward per record per run.
4. Reload, lose/retry the boss and full-restart. Durable discoveries remain, run counters follow their existing reset rules, and old pickup notices cannot leak into the next run. Reset Settings must not erase lore. If the host blocks saving, the archive must explain that records remain in this session.
5. Smoke-test landing/contact/SFX, H/R tutorial locks, the lift, rooftop Amp prompt/pickup/three charges, target brackets/traffic, Jammer cinematic and boss lose/retry/win. Record exact SHA, Makko project/origin, device and PASS/FAIL. After acceptance and merge, import the actual main merge SHA and repeat the archive/save/pause checks.

The following sections describe earlier review targets and are historical.

## Current target: discovery, targets and traffic — September 12, 2026

Review `agent/level1-discovery-traffic`, based on merged PR #35 (`c346e16e24c00b46611e6328d6f0fd6158cf315a`). All approved implementation is complete. Required `npm test`, all-file syntax and actual Makko animation-boundary checks passed; the generated receipt ties results to the exact revision. Native Canvas diagnostics verify production drawing with fixture positions/body guides. They do not verify live Makko asset delivery, audible mix, persistence on the hosted origin, frame rate or feel. Owner acceptance is pending; older targets below are historical.

1. Take the normal fast route. Lore unlocks at 4, 9 and 14 mission defeats; waiting or collecting an earlier piece must not delay later pieces. Explore the left awning, middle roof and upper route using the existing lift. Collect all three before completing the fight, in different orders across runs. Each has stable text/identity and one 500-point run reward.
2. Reload on the same Makko origin. The unique saved IDs must remain; a replay can award run score but cannot increase the saved unique total beyond three Level 1 records. Boss retry keeps this run's counter/reward. A full restart resets the run counter, while durable discoveries remain. Confirm the three provisional text entries with the owner. No final campaign outcome is implemented here.
3. Walk across the relay roof and touch the Signal Amp. It should collect with feet on the roof, explain longer enemy reach and show three charges. Successful ordinary-enemy rhythm hits use one charge; misses, empty swings and boss/Jammer-only hits do not. The nearby prompt should remain readable.
4. Enter R beside enemies. Cyan brackets indicate normal next-success reach, violet `AMP +` shows extended reach, and boss brackets distinguish guarded/open phases. Compare the preview with actual on-beat hits at the range edge. R-off, tutorial, pause and hacking must hide it. Looking/pausing must not spend charges.
5. Watch all three traffic types: exhaust and source animation should advance, with existing direction, framing and travel. Pause freezes their frames; resume continues. Owner diagnostics may confirm `spaceShipSystem.getDiagnostics().animatedTypes === 3`; fallback imagery is not an animation PASS.
6. Smoke-test opening/landing/contact/SFX, tutorial locks, two-hit lift, sixteen-hit Jammer, cinematic exit, boss lose/retry and win/rematch, full restart and saved pause controls. Record SHA, Makko project/origin, device and PASS/FAIL. After acceptance and merge, import the actual main merge SHA and repeat the focused collection/Amp/target/traffic checks.


## Current target: approved combined polish 1–9 — September 12, 2026

Checkpoint 3 on merged #34 implements **all approved items 1–9 plus particle/logging cleanup**. The one combined draft is the review target; its exact publication status/head/PR are in the generated manifest. Owner Makko acceptance is pending. The export receipt identifies executed full-suite/all-file syntax and actual Makko animation-boundary checks and their exact revision. `npm run check:level-01-polish` covers chunks 1–2; `npm run check:level-01-polish-menu` covers pause keyboard/pointer/lifecycle ownership, settings/storage failure, audio pause, gamepad release, completed-run data and retry/reset. Both are in `npm test`. The earlier gate assertion now permits approved barcode detail while retaining bounds/absence checks. The inventory adds the pause module/test and records resulting script/declaration positions without removing existing findings.

Checkpoint 3 owner checks: press P while moving and during a charge; the world/music should pause. Use Tab/arrows/Enter and pointer dragging to change Music/SFX, mute each, toggle shake/flash accents/CRT, and resume with P/Escape/Resume. No held menu jump, movement or attack should fire afterward. Reopen/reload and full-restart to verify preferences persist. Defaults restores the original mix/effects. During an active run, build a combo, leave/re-enter R, collect fragments, lose/retry the boss, then win. The completion breakdown should reach the actual score, whole-run best combo and fragment count; Enter rematches, Space clears the run. Check a fragment collected after boss handoff retains exactly one reward on retry. Keyboard/pointer checks do not claim a touch UI or audible host mix.

Owner spot-check, when testing this partial branch: take one left/right side hit and a boss pulse; compare lost segments and direction, then touch again during immunity; watch Corrupted/Firewall arrows while moving behind their windups and dodge a Swooper marker; collect the rooftop Amp, use three successful ordinary-target hits, and check the empty state. Pause should freeze new FX; boss retry should restore checkpoint charges, and full restart should clear them. Keep the PR #34 landing/contact/audio smoke checks.

For checkpoint 2, clear each of the four gates: the barrier should collapse promptly while passage opens immediately. Compare R-off/R-on storefronts, sustained combos and the quieter boss area; steam/sparks should stay sparse around charge warnings. Find a rooftop Lost Data beacon, collect it while the camera moves/zooms, and watch pieces assemble and reach the lore counter. Confirm one 500-point reward and one lore entry; pause mid-flight, resume, then retry/reset without stale flights. Canvas diagnostics verify composition and transforms, not host FPS, audible mix or subjective visibility. The complete Makko acceptance checklist below remains required before the eventual combined PR merges.

Owner Makko check: opening/landing/contact/audio; visible charge warnings; Amp pickup/use/depletion; all four gate clears; musical scenery and atmosphere; Lost Data flight/counter; pause keyboard/pointer controls, saved volumes and reduced effects; victory statistics and retry/reset. Confirm music, H/R locks, single jump, lift, Jammer and boss balance remain intact. The generated receipt will record actual results and remaining limits.

## Current target: Makko animation/contact/audio repair — September 12, 2026

PR #33 is merged; the owner's latest test is **FAIL for animation/contact/audio, positive for effects/flow**. Review `agent/level1-makko-health-repair` at the manifest revision. This repair awaits Makko acceptance.

Use the five steps in `MAKKO_HEALTH_CHECK.md`: spawn/landing/stance; all three ordinary enemies' head/side contacts; rhythm/action sounds under music; retained effects/lift/hack/Jammer; boss retry/rematch and full restart. Record SHA, project/device, per-step PASS/FAIL, health before/after unfair hits and a short clip. If sounds stay silent, capture `window.audioSystem.getRuntimeDiagnostics()` after trying a cue.

Required automated receipts include full-suite/all-file syntax and getter-only/official-runtime animation checks. Audio routing checks are not an audible mix test. After acceptance and merge, import the actual main merge SHA into Makko, restart preview and repeat opening/contact/audio and pause/retry smoke checks. Passing Node checks alone does not accept the repair.

## Current responsive combat / visible rhythm pass

Test branch: `agent/level1-responsive-combat`, based on merged #32 (`9719827`). The owner authorized publication of this completed build; it remains unmerged for Makko testing. The archive manifest names the exact tested revision and PR. Owner Makko acceptance remains pending; earlier approval of a different build is not acceptance here.

1. Play the opening/tutorial normally. Try very short Down taps, rapid release/repress, opposing directions, single jumps and H/R tutorial locks. Space advances dialogue without also jumping.
2. Walk close to each enemy in idle/walk/rhythm poses. Check that the weapon/transparent sprite padding does not hurt you. Land onto all three ordinary types, including a moving/attacking Firewall; rising into an enemy or touching its side should damage normally. Optional geometry overlay shows body bounds. Report enemy, action and frame/video for unexpected contact.
3. Enter/exit R beside the same storefront. Entry burst, performer field, equalizers and curb response should be obvious; walking/jumping still require stance exit. Hit on time with and without a target. Lightning must terminate on actual hits. Compare five/ten-hit milestones and a miss resetting the combo. Check Signal Amp reach and the Jammer's unchanged 300-pixel attack rule.
4. Judge jump rise/apex/descent/landing, Firewall warning/attack/recovery, directional defeats and the sound differences between jump/land/stomp, damage, guard, lift and pickup. Music stays continuous through impacts. Report whether effects or sound mask enemy warnings/the musical beat.
5. Use the two-hit lift, hack successfully/fail/take damage during H, destroy the sixteen-hit Jammer and watch the complete cinematic. R ends immediately and cannot reopen during it. Check camera alignment of the scene effects.
6. Fight the boss normally and attempt repeated head bouncing. The existing rearm/separation rule, cyan windows and balance remain. Pause/resume, die/retry, win/rematch and restart the level; check no stale effects, duplicate cues or leaked mode. Boss retry preserves district recovery; full restart resets it.

Automated checks exercise the production owners, source-frame anchoring, swept contact, timestamp judgments, display-rate scheduling, FX lifetime, cue voice limits and the existing campaign-level gates. Canvas inspection verifies composition with actual source art through a boundary renderer. Neither replaces Makko audio/rendering/feel acceptance. After acceptance/merge, import main and repeat the handoff checks against its exact revision.

## Current district restoration and selected-pass completion

Base: merged PR #31 (`b9d7ac4`). Branch: `agent/level1-district-restoration`. Use the six-step checklist and post-merge Makko handoff in `SELECTED_PASS_CHECK.md`. The manifest/receipt identify the exact revision, PR and test results. Check local encounter restoration, all Jammer stages, wave/camera/pause, restored boss retries and full reset, plus the included heavy-stomp correction and retained PR #31 behavior. Capture the same storefront before/after and a short wave/handoff video with revision and PASS/FAIL. Owner playtest remains pending.

## Current animation, mode and effects retest — September 11, 2026

Draft review branch: `agent/level1-animation-effects`, based on merged PR #30 (`1897c4e`). Exact revision/PR/test receipts are in `SOURCE_MANIFEST.json` and `test-evidence.json`. Makko acceptance is pending; preceding reports do not accept this new build.

1. Play the usual opening and tutorial once. Check the existing H/R locks, Space ownership, opposing-direction cancellation and single jump. Switch between walk, jump, idle, rhythm and hacking repeatedly; watch for stuck/restarting clips or feet shifting.
2. Press R on the ground: 6 Bit plants, the beat ring appears, and arrows/jump do not move him. Press R again while holding a direction: movement resumes immediately. A jump pressed while planted must not fire later on its own. Airborne R requests should say to land first, while the jump continues normally.
3. Charge the lift with two successful rhythm hits. Watch the charge effect and shadow; the lift must carry the planted stance. Exit R to walk/jump onto the rooftop. Check landing sparks, grounded shadows and brief attack/stomp echoes on ordinary enemies.
4. Complete a hack, fail one and let one time out. Read the phases, timer and input; codes disappear before input opens. Success restores one health and the existing nearby stun. Previously active Rhythm Mode may resume on a valid grounded completion; taking damage must cancel it instead. Pause/resume and Escape must release ownership cleanly.
5. Finish the Jammer. Rhythm Mode ends immediately and stays off through the whole cinematic. Re-enter R for boss counters; exit R before jumping the pulses or attempting a stomp. Head rebounds must stay safe and separate you without reopening the old endless-bounce exploit.
6. Lose/retry, win/rematch and restart. Retry begins with Rhythm Mode off. No old terminal feedback, charge effect, attack echo or duplicate music should persist. Judge whether the new effects help readability without obscuring enemy warnings.

Use the existing Go / Reset Boss control for repeated boss checks after the normal route. Report the revision, failures and how the planted stance feels in the fight. No new artwork or music is required for this test.

## Historical Jammer transition retest — September 11, 2026

Review branch: `agent/jammer-rhythm-exit`, based on merged PR #29. Owner verification pending; preceding playtest results remain historical.

1. Finish the Jammer with R + correctly timed Down. Rhythm UI/stance must exit immediately on hit sixteen.
2. Press R repeatedly through freeze, purge, pan, entrance, close-up, flourish, hold and camera return. It must not reactivate; movement remains frozen for the cinematic.
3. At control handoff, move normally. Down must require R again. Press R, then verify normal boss rhythm counters.
4. Listen for continuous music/beat timing across the transition. No restart, duplicated music or held final-attack pose.

Production-module assertions cover these lifecycle properties and transport continuity. Makko confirmation remains necessary. New overhaul/effect ideas are proposals and require a separately scoped implementation pass.

## Current test target — musical combat pass

Use `agent/level1-musical-combat` at the revision in the generated manifest. PR #28 is merged. The owner's latest run was substantially better and reached victory, but the difficult boss was defeated through an endless head-bounce exploit. Current acceptance is **pending for the new branch**, and the older test sections below remain historical evidence.

1. Play the usual Level 1 route once. Check the opening boundary, H/R tutorial locks, opposite-direction cancellation, lethal ordinary stomps, lift and safe Jammer placement. The quota remains twenty; Jammer health remains sixteen.
2. Read enemy warnings: jump a Corrupted charge, dodge the marked swooper lane, and counter after a Firewall braces/sweeps. Report if labels obscure bodies or any committed attack unexpectedly turns toward you.
3. Use R + Down: the nearby markers should meet on the beat. Miss early and late deliberately; check the feedback. Take a hit and check that R re-entry is obvious and the song continues.
4. Fight the boss with rhythm counters. The first warning/opening should be forgiving. Six health adds a second pulse; only the last three health can speed up the pattern after the introductory cycles. Hold a normal jump to clear the double pulse. Is the window long enough to recognize it and land useful attacks?
5. Try the previous exploit with no horizontal input. A head landing should send you safely outward. Repeated hovering must not damage another cycle; landing rearms an intentional next stomp. Judge the 260 ms rebound impulse and try both sides/near an arena edge.
6. Lose/retry directly, pause/resume, win/rematch and restart the full level. No stale rebound, beat warning, damage message or duplicate music should survive.

Use the existing Go / Reset Boss development control after the normal run to avoid repeating the entire level. Report how many attempts a legitimate win took, which attack caused most damage, and anything that feels unfair. Automated tests passing do not replace this feel/audio/rendering check.

## Historical acceptance records

## Status

PR #27 is merged at `a69384e5c647e0f1f457564ccbb3c29cd37e2059`. The owner's first playtest reported: unrestricted tutorial movement past the later gate; boss size/alignment changing with animation; boss carried by camera return; immediate death after attempting a stomp; Jammer/lift interaction overlap. **This is a failed acceptance pass, not approval of those behaviors.**

The current `agent/level1-playtest-repairs` branch addresses these reports and awaits a new owner Makko pass. No current Makko/browser gameplay acceptance is claimed. `SOURCE_MANIFEST.json` and `test-evidence.json` identify the exact code, review status and automated receipt.

## Focused repair retest

1. Hold right during the opening tutorial; also try crossing the opening boundary in the air. Finish the tutorial and check that you start on the correct side with the first encounter reachable.
2. Finish the mission once. Check that the Jammer and its attack area are well clear of the lift, and the lift explains its two on-beat charges before activation.
3. Watch boss walk/idle/flourish transitions: feet should stay on the street and body scale remain consistent. During camera return it should stay by the building where it stopped, then walk toward you after control returns, even from offscreen.
4. At full health, land on the boss during guarded and cyan phases. Both should bounce; only cyan should lose one boss health. Repeat at low health using retry as needed. Report player health before/after any unexpected death and whether a pulse was present.
5. Deliberately lose/retry, win/rematch, then restart the level. Confirm that the opening boundary, mission and music reset correctly.

Use the existing **Go / Reset Boss** development control for repeated boss checks after one normal route. No repeated full mission grind is needed for every animation check.

## Added general-play checks

During the same normal run, check ordinary enemy contact and stomps against their visible bodies; note whether attack messages make timing versus range clear. Follow the encounter-specific progress/hints and watch the Jammer change stage at 12, 8 and 4 health remaining. Completed objectives should leave the active objective visible. Judge the overall flow and readability as well as the original five repair items.

## Required checks

| Check | Expected result | Evidence owner |
|---|---|---|
| Existing suite/all JS syntax | Existing production/runtime checks and Makko parsing coverage pass | Codex receipt |
| Boss logic | Damage only in intended states, counter/stomp opportunity, clean death/retry, one completion, no stale hazards after pause/reset | Codex focused harness |
| Import/title/prologue | Exact supplied revision opens and preserves approved presentation | Owner Makko |
| Tutorial/movement | Space exclusive; H/R locks; background timing; opposing keys cancel; single jump | Owner Makko |
| Contact/lift | Normal enemy damage, lethal ordinary-enemy stomp, two-hit lift and readable foot/roof contact | Owner Makko |
| Normal mission route | 20 post-tutorial defeats; opposite-half Jammer; sixteen rhythm hits; established boss entrance | Owner Makko |
| Boss playthrough | Clear warnings/recovery, a fair loss and retry, successful win and honest end-screen actions | Owner Makko |
| Audio/lifecycle | Pause/resume/retry/full restart without duplicate audio, silent layers, stale attacks or broken reset | Owner Makko |

Use `repository-snapshot/docs/technical/MAKKO_HANDOFF.md` for the step-by-step route. Debug hooks may accelerate repeated testing; one normal-route run remains necessary to validate the full sequence.

## Completion report

Record: tested SHA; PASS/FAIL/PASS WITH NOTES; device/Makko project; exact route and failures; any accepted notes; automated commands/results; asset changes; and merge state. Only then mark M1 accepted and merge it. After merge, rebuild the ZIP at the actual merged SHA and retain the receipt's tested SHA so any difference remains visible.

No regression check may remove an approved mechanic just to satisfy obsolete prose from v4. Conversely, a passing logic harness is not permission to skip the owner/Makko gate.
