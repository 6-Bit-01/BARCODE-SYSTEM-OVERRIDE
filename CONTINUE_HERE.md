# Continue here — Level 1 rebuild after reverted #55

## September 16, 2026 — controller playtest repair and car approach warnings

Base/rollback is merged PR #62, `af8019a1e7755195c4e6e2cddf1e3d3f9f82002a`. Branch: `agent/controller-jump-traffic-warning`. The owner reports that #62's controller changes failed in play: RB still made a tiny jump and Cross stopped movement. Preserve that failure attribution; earlier passing automated checks were insufficient.

The failure reproduces in playable training: its hardcoded bumper jump bypasses the mapped held state, causing an immediate release cut (54.81px rise at 60Hz), while Cross advances dialogue and clears inputs (no jump). Training now shares the normal mapped jump for press/hold/release. Cross/A jumps throughout playable training and gameplay; Create/View advances crew speech without clearing movement. R1/RB remains inspect. Menu/intro/keypad ownership remains contextual. Full input-plus-update trajectories match keyboard flight at 30/60/120Hz, including remapped jumps; held Cross reaches about 286px at 60Hz. Jump physics are not retuned.

New illustrated red WATCH OUT tag and independently reversible arrow are pinned to asset ancestor `27c23b7042a903006f79683f01518f9b5eec49fb`. Warning begins three seconds before projected artwork entry (within one frame), flashes without vanishing, points off the correct left/right edge at the actual car height, follows zoom/vertical camera, and ends on the first visible artwork. Only the text tag can shift to clear the HUD, with a connector back to the true-height arrow. Entirely off-view flight does not create a false warning at another level. Original car speed, scale, height, bob, probability and three-second queued launch remain.

Read `docs/source-pack/CONTROLLER_TRAFFIC_REPAIR.md` (or its root pack copy) for evidence and owner review. Tests/native rendering are not a fresh physical DualSense/Makko acceptance. Exact final validation, PR and revision are in the generated receipt. Keep the new draft unmerged pending owner acceptance. Earlier entries are history.

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


## September 16, 2026 — street depth, one terminal and render cost

Base/rollback is merged PR #58 (`1c8b54ec5db0e102f64c0ffb15bd4b57c5e5acda`). Branch `agent/street-depth-terminal-performance` implements the owner's new feedback: draw emitter hardware behind enemies, replace three large generic boxes with one illustrated broadcast terminal at the Tower, and reduce wasted scenery rendering. The two removed boxes also lose their colliders; thin wall-mounted supports remain. Baked original rail geometry/off states use asset ancestor `1891ebb4e061971362817832e942ef9fbe05d15a`. Native gate-pass draw calls fall from 14 to 1 for the first gate and 55 to 2 after all gates clear at the fixed review camera. This is not a hosted FPS claim. See `STREET_DEPTH_TERMINAL_PERFORMANCE.md` for implementation, assets, tests, limits and the exact Makko route. Review head/CI belong to the generated receipt. Owner Makko acceptance is pending; earlier entries are history.

## Continue here — thin rails and original traffic

Base/rollback `f048d229a51b9ecce801cd9d736613491c4ae2f9` (merged #57). Branch `agent/thin-rails-original-traffic`. The owner selected the thin continuous facade-to-road concept and approved the reviewed eight-issue plan. Read `docs/source-pack/THIN_RAIL_TRAFFIC_CORRECTION.md` and the newest acceptance entry. Four rail parts are pinned to `08d5720f31020fd846ea6b93c76988ffef6e3fbe`; original car behavior is restored and verified against the pre-rebuild production source. Source/native checks are not Makko acceptance. Prepare/review the exact receipt head, then after acceptance and merge import the actual main merge SHA into a fresh preview. Do not redo the reverted/rejected passes or substitute another car system.

Base/rollback: `6e3751ba1561d8694e0bdc9a623e74ac6a45624d` (merged revert #56, retaining #54). Branch: `agent/level1-rebuild-reviewed`. The owner approved the rebuilt scope after explicitly rejecting #55. The implementation and actual artwork are prepared on this branch; exact published head, PR and validation are in the generated source receipt. Do not reapply #55 wholesale or redo the older art passes.

Read `docs/source-pack/LEVEL_01_REBUILD_PASS.md` and the newest `ACCEPTANCE.md` first. Three compact illustration atlases are already published in immutable asset ancestor `a155d4283a12df4dd7ea0f8cb9eb0bf985644fa8`; runtime uses that exact pin. Original cars and the merged character art remain the sources for existing actors. The new drone, machinery, roof routes, contact/Firewall fixes and controls are integrated for review.

Next: owner Makko review of the exact PR head before merge. Capture the imported SHA, PASS/FAIL and short clips of street contact/Firewall, roof/drone/car play and controls. After acceptance and merge, read the actual new main merge SHA, import it into a fresh Makko preview and repeat the same route. Native Canvas footage and automated checks do not claim hosted Makko acceptance.

## Historical handoff before the rejected pass

# Continue here — wall sidewalk/street footprint

PR #53 is merged at `685d13d4de1d56c8a39a82077460d894144bd091`; its walk, enemy hijack, repairs and rooftop supports are the current baseline. The owner's new screenshot identifies a visual gap at the wall's base: it stops at the walking line and only projects backward. The focused `agent/barrier-street-footprint` correction extends the same tall translucent wall forward across the sidewalk, down the curb and through the road. Existing gate positions, collisions, unlock conditions and collapse clock remain.

Review the before/after native render and the newest `docs/source-pack/ACCEPTANCE.md` route. Exact published SHA, PR and validation are in the generated source receipt. Test the review head in a fresh Makko preview before merging; after merge import actual new main SHA and repeat the same wall/gate checks. Base/rollback is the merged #53 SHA above. Do not redo earlier artwork or the hijack pass.

## Previous hijack handoff (now merged)

The owner selected enemy hijacking as H's reward. Implementation is complete for review on `agent/enemy-hijack-repairs`. The owner merged walk PR #52 during preparation; current main/base is `66c17d1880f5de933e9b928833e5dd2bfff6a817`, with exactly the same files as the original walk head `b1692f47017459011177fb779639682534c862b7`. The new draft targets main directly. The separately committed hijack work is preserved; keep the completed walk artwork.

Read `docs/source-pack/ENEMY_HIJACK_REPAIR_PASS.md` for the actual mechanics, art, limits, focused Makko route and post-merge deployment. The final published SHA, PR URL and validation evidence belong to the generated receipt. Do not reimplement the pass or mistake source/native checks for hosted Makko approval.

H now has one eight-second ally, an explicit target, safe expiry/release and no health/area-stun success transaction. Two rooftop repairs, one marked carrier and two small physical supports supply recovery and traversal. No cloud stage, traffic hazard or character redraw is bundled.

Owner Makko acceptance is next; #52's merge is already complete and is not hosted test evidence. After accepting and merging the new hijack PR, import the actual new main merge revision and repeat the focused checks. Returning to the current main SHA above removes only this new pass while retaining the merged walk; `ea2921960477e38c74740dda378fcb513a8f1cc1` remains the earlier pre-walk rollback reference.
