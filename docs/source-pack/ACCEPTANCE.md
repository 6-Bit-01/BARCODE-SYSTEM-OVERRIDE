# Acceptance and Test Status

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
