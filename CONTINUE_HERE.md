# Continue here — Level 1 rebuild after reverted #55

## September 16, 2026 — elevator roof visibility; tutorial flow review

Base/rollback: merged #73, `8fc2f8ea838d1dc901b97c7b7c93581459451ddf`. Branch: `agent/elevator-roof-depth`. The owner reports enemies hidden behind the elevator deck. The physical foot plane is already correct; draw roof enemies after the cabin, including airborne transitions, while preserving existing below-roof depth and one draw per actor. No collision or platform changes. See `ELEVATOR_ROOF_DEPTH_FIX.md` and its four native artwork previews. The four-circle bonk restriction, moving support, pancakes, controls, victory protection and twelve-second allies remain.

The owner also asks how to improve tutorial timing/readability and remove at least two chat bubbles while preserving story. `TUTORIAL_FLOW_PROPOSAL.md` audits the current sequence and recommends 25 → 20 bubbles with event-driven teaching and clear mapped controls. This is a design proposal; tutorial runtime/text remain unchanged in the elevator fix. Publish the tested elevator correction as one draft and refresh v5. Exact head/CI are in the receipt; owner Makko acceptance remains pending.

## September 16, 2026 — restrict bonks to the owner's red circles

The owner rejects PR #71's blanket underside collisions: only the four circled objects in the three original screenshots are approved. Base/rollback: merged #72, `0c428a053225dfa68b42fbb7464708f020daba76`. Branch: `agent/circled-bonks`.

Static bonks are now explicitly limited to `signal-awning`, `tower-awning`, `cache-maintenance-step` and `firewall-low-step`. Every unmarked roof, canopy and step retains one-way landing and allows upward passage. The separately requested elevator roof remains fully solid and rideable. No platform positions or jump physics change. The previous all-ledge implementation and its outside-detour route requirements were a scope error, not owner-approved design.

See `CIRCLED_BONK_CORRECTION.md` for the exact photo-to-object mapping. Tests assert that exact four-item scope independently of implementation and restore direct platform ascents. Preserve #72's deliberate drop input, victory protection and twelve-second allies, plus elevator pancakes. Publish one draft and refresh the maintained v5 pack; physical-controller/Makko review remains pending. Older current-work entries are historical.

## September 16, 2026 — deliberate platform drops, protected victory and 12-second allies

Base/rollback: merged PR #71, `5babd454e2753d834be2372642ee8612e0b39a9d`. Branch: `agent/controller-drop-victory`. The owner reports accidental controller drops and a boss defeat that immediately resets the boss/player, then explicitly extends hacked allies to 12 seconds.

Controller descent now requires at least 70% downward stick travel within 35 degrees of straight down, or pure D-pad down, plus a fresh mapped jump. Light/down-diagonal walking still jumps normally. Keyboard descent and one-platform-at-a-time landing remain. Victory input waits until the existing results count-up finishes, then requires 250 ms with both result controls released; only a fresh press can rematch/restart. The old result handler accepted fresh Cross/Enter immediately after defeat, before the card appeared, resetting boss health and returning the player to the street. The same protection covers street and rooftop wins. Hacked allegiance now lasts 12 simulation seconds, with matching countdown, bar, success text and tutorial; pause and early release remain.

Read `CONTROLLER_VICTORY_ALLY_PASS.md` for the focused review route and limits. Exact tested/published revision, full-suite results and CI belong to the generated receipt. No new art, dependencies, timers or movement-physics changes. One combined draft; physical-controller and owner Makko acceptance remain pending before assistant merge. Earlier current-work entries are historical.

## September 16, 2026 — solid awnings, moving elevator roof and enemy pancakes

Base/rollback is merged #70, `78475a7be0ec1ba1b4c7aa6d3fc1b069d00c7edf`. Branch: `agent/solid-awnings-lift-roof`. The owner explicitly requests bonks on awnings and hittable ledges, a fully solid elevator roof supporting the player, enemies and boss while moving, and visibly pancaked enemies under a descending elevator. This supersedes the previous cabin-only/climb-through-awnings direction.

Visible stage undersides now stop upward player motion with a small contact cue. The full cabin roof blocks side/upward entry and supports/carries every actor type in both directions. Boss pursuit routes around the slab. The descending floor flattens ordinary enemies and drones using their existing sprites, with one defeat/score/repair transaction and a bounded 3.2-second visual. Floor and roof riders remain supported. The Tower middle step moves 160 units left to x=3100 so the solid-underside upper route remains connected; both collider and illustration share the position.

Read `SOLID_LEDGES_SMUSH_PASS.md` for behavior, native evidence and the focused playtest route. Required local tests, exact revision and CI status belong to the generated receipt. Publish one combined draft and refresh the established v5 source pack. Owner Makko acceptance remains pending before assistant merge; older current-work entries below are historical.

## September 16, 2026 — elevator rooftop exit, clear drone and returning Studio Rat

Base/rollback is merged #69, `3554b0a326572b86f17a66300aa5ae9d122cd9c3`; branch `agent/lift-clearance-context-prompt`. The owner reports a cramped cabin, persistent label, below-roof stop, missing cat and a platform covering the tower drone. This current combined correction supersedes older current-work entries; #69's merge does not mean those details passed owner review.

The 280×432 cabin now reaches the actual Firewall rooftop at y=59, with a walk-off exit. A brief approach HUD replaces the world label. Only the illustrated cabin roof catches an upward cap; inset edges, no damage/stun and visible contact sparks keep this sparse. Existing awning ascent routes remain. The tower drone moves beyond the overhead steps. Studio Rat chooses among six reachable perches per fresh Level 1 run even with prior save credit; checkpoints preserve its location/event consumption and permanent rewards cannot duplicate. Later levels still require their own genre-specific encounters. The owner subsequently flagged the Firewall high step in the lift path: it moves 170 units left to x=2160, including its collider and illustration, while the canopy-to-roof climbing route stays reachable.

Read `LIFT_ROOFTOP_RAT_PASS.md` for the implementation, native evidence, exact focused owner route and post-merge deployment instructions. Source-line baseline shifts are expected; do not alter script order or baseline exceptions. Full local/CI results and exact revision belong to the generated receipt. Publish one combined draft and refresh the established source pack. Owner Makko acceptance remains pending; preserve existing controls, music, traffic, boss, environment and save data.

## September 16, 2026 — fit holograms to buildings and complete tutorial Objectives

Branch `agent/facade-hologram-objectives`, based on merged #67 (`d3d6128ce63c795c4096a320012e2136e21dfbc4`). The owner authorized one PR for the two gaps recovered in the conversation audit. Earlier current-work entries are historical.

Each gate now uses a measured facade mount and its local pavement direction. Hardware, field edges, curb transition, baked image bounds and the blocking strip share those coordinates. The field thickness matches the existing 14-unit thin rail. Blocking x positions move with the fitted fields to 1342, 1966, 3269 and 3853; encounter identities, triggers, defeat quotas and unlock/collapse rules remain. Native previews cover every gate at street and roof height. The four rebaked assemblies use immutable asset ancestor `ac183cf0ccde1b716b82c5fdce9229d2de0c5032`.

After tutorial tasks finish, Objectives now offers “Continue crew briefing” with Space or the existing Create/View control. Active tasks and input ownership remain. Preserve the animated BG asset/rain, central Jammer, terminal placement/depth, original warned/damaging cars, controls, upper routes, boss, rewards and music. See `FACADE_HOLOGRAM_PASS.md`. The prior v70 manifest/receipt is retained in `verification/pr67-merged-history.json`. Exact review SHA and check outcomes belong to the generated receipt. Owner Makko acceptance remains pending; keep this combined draft unmerged.

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
