# Current State

## Level 1 impact and discovery — combined review after #43

The owner approved all ten recommendations in `LEVEL_01_IMPACT_PASS.md`. Base/rollback is merged PR #43, `51b65d4cd71d369b05003ddaa83cfe6f88fe348b`. All ten are implemented together on `agent/level1-impact-discovery`, through combat/camera, scenery and HUD/discovery checkpoints. This is one draft review, not a merged or Makko-accepted build. Exact published head, PR and completed CI status belong to the generated receipt/manifest.

Combat now has directional hit/hurt kicks, force-based landings, a stronger stomp and rolling destruction/boss reactions. The final boss hit has a bounded 3.5% camera push-in and 620ms of visible world before the results fade in. Brief actor holds, brighter contact cores and persistent data/strip/metal debris give contacts material identity. Ordinary attacks retain the base radius, add a narrow forward waveform from combo 5, and up to two short chain links from combo 10. Previews and damage share one query; Amp spends once per attack. Boss/Jammer range, damage, guards, stomp rules and musical judgment remain separate and unchanged.

The actual sign interiors, curb, cables and pavement react to music, phrases, combo and nearby impacts. A hanging sign rattles, vents cough, foot contacts spark and existing traffic sweeps light. The four encounters have different arrival accents; Cache viruses descend from roof height through the existing protected entrance owner, Firewall arrivals throw metal, and Broadcast screens fill toward the Jammer release. Jammer strain/breakup feeds the existing ordered restoration; boss footsteps and major pulses have distinct reactions. Clears briefly frame the street as a comic panel, and stomps tilt only the encounter caption.

Health and the predictive beat lane occupy a compact comic panel at top-left. Notes approach a fixed target; visual offset never changes scoring. Objectives/boss guidance sit at top-right, with compact Amp feedback and no duplicated floating judgment label. Four optional details use E / controller LB between fights: Studio Rat near the lift, Cliff's maintenance plate on the first roof, WittyF0x's mark on the Firewall canopy and the venue flyer on the street. A second inspection press reveals the optional crew reply; walking away closes it. Actual inspections persist distinct `easterEggs` facts alongside the unchanged lore records. The rat crosses the panel margin dragging its bolt and earns a results callback.

Local `npm test`, `npm run check:syntax:all` and six native Canvas scenes pass. The native scenes use the unchanged foreground/sprite sheets and an explicit Makko sprite adapter; the production world transform is verified to restore before the timing target. They do not certify host rendering, audio sync or gameplay feel. Browser intro regression and committed-source export run in CI. Preserve the corrected eight-scene intro and the original cast, controls, mission quotas, roofs/lift, lore, boss/retry and restart. Next: owner Makko acceptance of this whole pass, then Stage C campaign services; do not re-implement these ten items or split them into new tiny PRs.

## Timed intro cues and screen readouts — after merged #42

Verified base/rollback is `f1831f95c187bdd5afd9c8231d2a7a10ac262671`. The owner confirms the intro images now appear and requests sequential dialogue/caption timing, Space advancing one cue, messages on the illustrated screens and a correction to DJ Floppydisc's hand. `agent/intro-cue-staging` implements that focused continuation; exact head/PR and completed validation belong to the generated manifest/receipt.

Each scene begins with its title/art, then reveals its authored cues on a reading clock. Space, Enter, click or controller A reveals the next cue immediately and restarts that cue's reading interval. Revealed dialogue stays available; the last cue waits for manual page advancement. Loading, hidden tabs, lost focus and whole-intro skip holds pause the reading clock. Screen messages are angled and clipped into five actual displays. Three scenes without a usable display place their caption in the page margin. Page 6's optional displaced caption appears only after 6 Bit refuses the screen's order.

The page-5 knob hand is corrected using the built-in image editor, preserving the scene and model. Its new WebP/hash/prompt provenance is recorded in `assets/intro/art-manifest.json`; public images are pinned to the art checkpoint `8180996dfc81630e0509a6ae3f0b0ec5db2934a6`, which is part of this same review branch. The other seven runtime images are unchanged.

Production VM checks cover timing, one-cue input, focus/visibility, held-repeat prevention, fullscreen, cleanup and tutorial/mission continuation. Native Canvas renders cover all final pages and staged pages 3/5/6, with measured dialogue bounds. The Chromium check follows native input through the staged sequence, fullscreen, retry and tutorial; final CI status is recorded separately. No live Makko acceptance is claimed. See `INTRO_CUE_STAGING.md` and the top ACCEPTANCE route. Earlier sections describe historical work. HUD/rhythm/attack variety is next after this review.

## Black-screen recovery after merged PR #41

PR #41 is merged at `897b750cf64bafe3d50746cd7c8c19379ef4fbf6`, but the owner reports that the intro is entirely black and unusable. Its prior passing tests did not load the fullscreen manager. Start requested fullscreen on `#gameCanvas`; lifecycle startup hid that canvas, and CutsceneSystem mounted the intro inside the current fullscreen element. The intro therefore became hidden canvas fallback content. A request resolving after intro creation could also exclude a body-mounted overlay from the fullscreen tree.

`agent/intro-fullscreen-recovery` fullscreens the stable document root and mounts the intro in the body. The retained eight images, scene-positioned dialogue, one-context budget, independent S/B holds, tutorial, audio and gameplay are unchanged. The new ancestry regression failed on merged #41 and passes with this fix. All existing tests and syntax checks pass locally; the added real Chromium check runs in GitHub validation and exports screenshots/results. Exact final results belong to the generated receipt and CI run. This environment could not install Chromium, and no live Makko PASS is claimed.

See `INTRO_FULLSCREEN_RECOVERY.md` and the top ACCEPTANCE route. One combined draft/source export; no merge. HUD/rhythm/attack variety follows the repaired opening, then campaign services. Earlier “current” sections below describe historical checkpoints.

## Current repair after merged PR #40

PR #40 is merged at `a747b58411650146bdc003a529d0470167d275db`. The owner then reported a canvas-context limit, missing opening images and a narrative mismatch with the first level, and requested styled dialogue positioned within the scenes. `INTRO_REPAIR.md` controls this combined repair on `agent/intro-makko-repair`; the generated manifest identifies its exact head and PR.

The intro now acquires one drawing context per canvas, loads verified commit-pinned copies of the same eight model-based images with a bounded bundled fallback, and uses individually placed comic balloons/comms cards over full-width illustrations. The actual five-chapter tutorial now continues the open crew channel and establishes the district/Jammer task. Objective progression reads stable IDs rather than old dialogue wording. `INTRO_TO_LEVEL_01.md` contains the exact new conversation. All prior gameplay/lore saves remain.

Normal and skipped openings are tested through the real tutorial into one mission. Public image bytes/CORS and native Canvas layouts are checked separately; full regression/syntax results belong to the receipt. Live Makko acceptance of this repair is pending. The prior intro report below is historical and is superseded where it claimed relative-only delivery or unchanged tutorial copy. HUD/rhythm/attack-variety work follows this repair, then Stage C.

## Intro correction — current review

PR #39 is merged at `510342ed21692fd85f9b99ef6b29990a5694132d`. It added a crew scene after the tutorial while leaving the actual opening unchanged. The owner explicitly corrected that omission and reported that holding S did not skip. Branch `agent/intro-overhaul` now replaces the actual CutsceneSystem opening with the eight-page treatment in `INTRO_OVERHAUL.md`, using the five beats established by the merged campaign map. The generated manifest identifies the exact review head and PR.

The original four make a broadcast, its return signal fails, the Network's report conflicts with their experience, Cache protects the original, DJ listens, Mac finds access, and 6 Bit chooses to restore Dead Air District. One recovery caption crosses a panel boundary as he refuses to wait. The owner supplied character models and explicitly requested the missing intro art. Eight new bundled illustrations now show these actions with the supplied likenesses, scene-specific detail crops and character-colored nameplates. Cliff appears briefly behind Mac/Cache on page 2; all other characters remain offscreen or obscured. INTRO_ART_DIRECTION.md and the asset prompt/hash manifest record the models and scenes. The existing title, 9 Bit disclosure and music remain.

Keyboard S and controller B now have independent continuous five-second holds. Release cancels that input's hold; controller polling/disconnect cannot cancel S. Blur/hidden-tab cancellation, held-input consumption, cancellable image loading and startup teardown are checked through the production owners. The existing intro-song fade/gameplay-music handoff remains. The extra post-tutorial scene is removed; the tutorial enters the mission directly. Optional `egg.comic.gutter` inspection moves to opening page 6 and retains its run-only results callback.

All prior Level 1 controls, HUD, rhythm combat, calibration, camera, lore, mission, lift, Jammer and boss behavior are retained in this intro correction. The owner dislikes the PR #39 HUD and prefers aspects of the older rhythm presentation, and has asked for less repetitive threshold-based attacks. **Latest work order: finish this intro first; then address HUD/rhythm presentation and attack variety, before Stage C.** No HUD/combat redesign is claimed in this intro branch.

Production tests and native Canvas renders check control/lifecycle behavior and text layout. See the generated receipt for exact verification. Makko presentation, audible fade and physical-device acceptance remain pending. Base/rollback is the merge above.

## Historical planning checkpoint

The following planning-only description belongs to merged PR #38; Stage B above supersedes its “next/not implemented” wording.


## Campaign continuity planning — current review

Verified main: `38732933713c4f9ec22666e49b728a0626a85f25`, merged PR #37 on September 12, 2026. GitHub's static-validation check succeeded on that merge. No open PRs were present at the initial continuation check. The generated manifest identifies this documentation review revision; older review-build headings below describe historical PRs.

The current change completes a whole-campaign working story map, all 28 record purposes, latest cameo corrections, primary and historical inspiration Easter-egg bank, representative intro/art plan, remaining control/readability work, campaign/music/save dependencies and mobile/standalone disposition. Read `CONTINUATION_PLAN.md` first. Stale active roadmap/cast/intro instructions and the repository README are reconciled. Newly drafted scenes/placements are proposals; the final simulation/ending questions remain open.

No runtime, tests, art, asset URLs or dependencies are changed in this pass. All three implemented Level 1 lore records and saved IDs remain exactly as in #37, together with prior polish/traffic/targets and combat/audio repairs. Full campaign routing/resume and Levels 2–7 remain future implementation. Existing save/settings/discovery work is not relabeled missing.

The source investigation independently confirmed a missing default controller Rhythm Mode binding, crowd steering writes that can conflict with committed attacks, and a boss cue that omits the stomp-cycle condition used by damage. These are next-pass findings, not claimed fixes. Automated verification is recorded against the exact exported commit; no new Makko gameplay, audio, device or mobile PASS is claimed.

Next implementation: use the map to script/prototype a representative existing-art crew/panel transition tied to Level 1 and a later payoff, with coherent checkpoints for the remaining controls/readability work. Continue with campaign services and genre proofs afterward. No engine migration or mass art order is approved here.

## Historical implementation reports

The following entries preserve earlier build/acceptance reports. Their branch and pending-review wording describes those checkpoints. Current merge status and the manifest control present state; a merged PR alone does not prove the owner's currently imported Makko SHA.

## Authored lore and pause archive — current review build

PR #36 is merged at `58b6abe6179ce6b7e8996c4d4099c9eff674f35f`, the base and rollback for `agent/level1-lore-archive`. The owner approved the archive and explicitly requested actual lore improvement using BARCODE and 6 Bit context. `LORE_ARCHIVE_PASS.md` records the source audit and scope; `LEVEL_01_LORE.md` contains the complete implemented text. The generated manifest identifies the exact checkpoint, publication status and PR.

All three current records now have titles, three paragraphs, a crew author/source and a brief 6 Bit response: Cache Back's **Four Names on the Tape**, DJ Floppydisc's **The Other Side of Silence**, and Mac Modem's **A Whole Block on Mute**. They develop crew history, the unresolved inverted waveform and the Jammer's environmental reach. These are new in-game records based on established canon, replacing the previous placeholder lines. The contradictory legacy random pool is removed from the runtime.

P → Lore archive reads the same catalog using the existing persistent collection. Existing PR #36 saves reveal the revised entries automatically; browsing cannot unlock entries or award score. Unrecovered titles/body text remain hidden. Keyboard and scaled pointer controls use the existing input owner; Esc returns to pause and P resumes. Sequential pickup notices queue, freeze with paused gameplay, and point to the full record. Reset clears transient notices and run counters without erasing discoveries. No save schema, placement, 4/9/14 defeat threshold, reward, asset URL or dependency change.

Focused production checks and native Canvas text/layout inspection pass. The export receipt records the full required suite and all-file syntax results against the exact exported revision. Owner Makko import, hosted persistence, reading/voice review, live audio and gameplay acceptance remain pending. Use the current PR_DESCRIPTION and ACCEPTANCE checklists. Historical sections below describe earlier milestones, including copy that this pass supersedes.

## Discovery follow-up — completed review build

PR #35 is merged at `c346e16e24c00b46611e6328d6f0fd6158cf315a`. The owner selected rhythm target brackets and animated existing traffic, reported missing late lore and the uncollectible rooftop Signal Amp, and deferred migration. `DISCOVERY_PASS.md` is the current scope. Branch: `agent/level1-discovery-traffic`; generated manifest identifies the exact checkpoint.

Collection/Amp repair is implemented and passes focused production checks. Three records unlock at 4/9/14 mission defeats without elapsed-time or collection-order gates. Stable `lore.l01.01`–`.03` identities and the canonical single-slot save preserve unique discoveries across level replays/reloads. Run counters/score reset separately. Pickup geometry uses the real body on/above the authored roof; the Amp explains its three-use ordinary-enemy reach bonus. Provisional record text replaces the quarantined random pool and awaits owner review. Exact ending rules and full campaign resume remain unimplemented.

The two selected follow-ons are implemented in the same pass. Read-only target brackets use actual ordinary-enemy/Amp, environmental and boss rules, including the next successful hit’s combo growth and guarded/open distinction. All 325 original traffic frames now play from three shared lossless WebP sheets (about 3 MB transfer, less than 50 MiB decoded) using elapsed time. Existing framing/travel and original-art fallback remain.

Required `npm test` and all-file syntax passed, as did the responsive-combat checks with the actual Makko animation classes. Native Canvas inspection covers atlas cropping, normal/Amp brackets, boss phase cues and Amp prompts. The baseline changes add two runtime modules and two test scripts, shift inline indices, and remove the obsolete LostData gameState assignment; prior asset/ownership findings remain. The generated manifest and receipt identify the exact published head/PR and test evidence. Owner Makko import, live asset delivery/performance, persistence on the actual host, and provisional three-record text review are pending. Use the current `PR_DESCRIPTION.md` checklist before merge. Historical sections below describe their own milestones.

## Combined polish pass — September 12, 2026

Approved scope: **1–9 plus particle/logging cleanup**, recorded in `POLISH_PASS.md`. Base/rollback: PR #34 merged at `85a0b32c530d9fc04fab91ef4e3d18ef88ee8249`. Branch: `agent/level1-combined-polish`. The owner asked to work in manageable pieces after repeated interruptions. **Checkpoint 3 implements all approved items 1–9 plus particle/logging cleanup.** The completed pass is prepared for one combined draft review. The generated manifest records its exact publication status, commit and PR; owner Makko acceptance is pending.

- Impact shake now advances once through the existing renderer/frame owner, with elapsed-time decay, a six-pixel/300 ms cap and protection against weaker hits replacing stronger ones. Retry/full-reset combat cleanup clears it. Accepted damage records lost health segments and the source side, including boss pulse origin; immunity cannot add a second indicator. These visuals do not change health, immunity or collision rules.
- Corrupted/Firewall warnings gain triangle/shield icons and ground arrows using their stored committed direction. Swoopers show double chevrons and the locked aim marker. Windup bars read existing AI time, remain still during pause, and do not advance AI during drawing.
- The existing rooftop Signal Amp now has an animated amplifier/barcode symbol, collection announcement, three HUD charge pips, use/depletion feedback and an empty state. Actual pickup/attack transactions drive notifications. Boss retry restores checkpoint charges without replaying pickup; full reset clears collection and effects. Existing range, target and charge-spending rules are retained.

- All four encounter gates gain barcode rails, scanning energy and a 650 ms collapse driven by the existing clear timestamp. Real collision opens immediately on the existing progression event; pause, repeat notifications and reset cannot extend/replay it.
- Eleven measured storefront interiors use four equalizer patterns, stronger downbeats, moving curb accents and sustained-combo energy from the continuous MusicTransport. Existing district restoration and quieter boss decoration remain. Paused redraws retain the last music sample.
- Existing curb grilles/cable junctions/shopfronts host sparse steam, dust, brief sparks and neon pavement spill. Three cached glow textures, finite analytic particles and viewport culling bound the drawing work; decoration dims near committed enemy attacks. Reduced-flash hooks suppress bright modulation.
- Lost Data gains a rooftop barcode beacon and a four-piece assembly/flight to the lore counter. The HUD flight uses the actual camera/zoom/shake matrix. Rewards, lore selection and cooldown remain at the real one-time collection; visual arrival awards nothing. Two cached glows replace repeated gradient work, offscreen ambient emission is skipped and per-frame collection logging is removed.

- The pause screen now provides the controls and rhythm-exit reminder, Music/SFX sliders, saved shake/flash/CRT settings, Resume and Reset Settings. Tab/arrows/Enter and pointer/drag use the existing input owner. Menu keys and held gamepad actions cannot become resumed movement or attacks. Paused presentation redraws a cached scene only after menu changes, without advancing gameplay or adding a timer/listener. Storage failures retain working in-session settings and show an honest save status.
- A user music gain controls gameplay, title and cutscene music while retaining their existing default mix. SFX controls both effect buses; existing sample/voice routing is preserved. Generic interaction-based autoplay recovery cannot wake deliberately paused audio. Saved preferences apply after audio initialization and survive full restart.
- Completion now animates actual score, best combo and Lost Data totals over 1.6 seconds through the existing RAF. Best combo spans Rhythm Mode entries and boss attempts. Boss retry retains collected fragments and their reward even if found after the checkpoint; full restart clears run totals/collection. Existing lore text/selection remain legacy, and no persistent reading archive is added.
- Particle drawing avoids per-frame filtered arrays/logging and culls invisible decoration. Routine particle diagnostics are opt-in; the leftover startup test burst is removed. Cached glows and offscreen fragment emission cleanup from checkpoint 2 remain.

Production-owner checks cover the combined gameplay/FX scope, real pause/input/transport ownership, scaled pointer coordinates, settings reload/storage failure, gamepad release, completed-run snapshots and retry/reset. Required `npm test`, all-file syntax and actual Makko animation-boundary results are in the export receipt, with exact tested-source hashes. Inventory changes add the pause module/test and update script indices and moved declaration lines; prior asset/ownership findings remain. New `verification/polish-chunk-3-pause.png` and `polish-chunk-3-results.png` are production Canvas diagnostics using fixture totals, not live Makko screenshots. Earlier diagnostics retain their stated limits. Audible mix, host performance and game feel still require owner testing.

**Next: owner Makko test of the combined draft revision.** Use the six-step `PR_DESCRIPTION.md` checklist, record the exact SHA, project/device and PASS/FAIL, and capture disputed damage or audio diagnostics if needed. The publication pass verified main still equals base `85a0b32c530d9fc04fab91ef4e3d18ef88ee8249`. Published gameplay and tests match the fully validated local checkpoint `e0d4eee2fe26e36997b0f15668529afdc36bcfe8`; only review/handoff documents change for publication. All three implementation checkpoints are complete; do not redo 1–9 or open separate effects/menu PRs. After acceptance and merge, update v5, import the actual main merge SHA into Makko and repeat opening/contact/audio and pause/retry smoke checks. Items 10–12 remain follow-ons.

Keep the established v5 archive identity and update it at completed checkpoints and merges. The previously enabled maintenance automation covers archive exports only. No new Makko acceptance report was supplied for #34. Earlier sections describe historical work.

## Makko health repair — September 12, 2026

PR #33 is merged at `8d0cf73a223494b355d850930f4ac8047353804f`. The owner reports better effects/flow but a stuck landing jump, intermittent enemy clipping/unfair damage and missing rhythm/action SFX. Current repair branch: `agent/level1-makko-health-repair`; exact draft/head and test receipt are generated in the archive manifest. Owner Makko acceptance is pending.

The repair removes writes to Makko's getter-only animation frame, advances landing recovery independently, and restores full animated enemy collision updates. Original rhythm/damage samples return, per-voice gain replaces whole-channel ducking, and action cues use actual SFX-graph readiness with stronger envelopes. Selected visuals, movement/progression, music and art are preserved. Expanded checks run against actual official Makko animation classes; audio loudness and contact feel remain owner checks.

Read `MAKKO_HEALTH_CHECK.md` for what stuck/failed, evidence, limitations, focused testing, diagnostics and post-merge deployment. Sections below describe historical builds; the latest failed playtest supersedes their pending acceptance status.

## Responsive combat and visible musical scenery — September 11, 2026

Base/rollback: merged PR #32, `97198270dabd9b917d58f6499c2d0668d186eb12`. Branch: `agent/level1-responsive-combat`. The owner reports uncertain hitboxes and rhythm/background effects that were hard to notice. This is the selected **1–8 responsive-combat pass plus stronger musical scenery**, documented in `RESPONSIVE_COMBAT_PASS.md`. Earlier numbered proposals below are historical. Exact review SHA/PR and validation are generated in the archive manifest and receipt. Makko acceptance is pending. The owner explicitly authorized uploading this completed pass to `6-Bit-01/BARCODE-SYSTEM-OVERRIDE` and opening its combined draft PR on September 12. The preceding local review was `3ec6427`; publication changes only these status documents, with gameplay and verification code identical. `PR_DESCRIPTION.md` records the review scope; the generated manifest supplies the published revision and PR link.

- Player and ordinary-enemy damage bodies stay stable across animation/facing. Player feet have their own swept landing probe; enemy head-contact planes follow audited silhouettes above the torso. Rising or side contact cannot become a stomp. Crowd separation is horizontal and no longer pushes a player before testing overlap. Existing ordinary lethality and boss counter/rebound rules remain.
- Fast input taps survive between frames and retain their capture-time musical judgment. RAF uses each display callback instead of the old fractional-threshold limiter. Particle shrink, trails and zoom depend on elapsed time; offscreen particles/enemies/effects are culled. The new FX owner replaces unused random player-arc work and gates legacy rhythm diagnostics. The synthetic 30/60/120/144 Hz check confirms callback ownership and elapsed time, not hardware FPS.
- R produces a visible entry burst, a compact electric stance and a thin actual-radius guide. Correct hits connect to actual damaged targets; empty beats and guarded hits have distinct feedback. Five/ten-hit milestones add barcode bursts, echoes and accents. Impacts/deaths use directional data strips, hot pieces or pixels, with bounded lifetime and at most a 45 ms local animation hold. Music, input and physics continue.
- Existing sign interiors now show visible beat equalizers and an illuminated curb while performing. Successful attacks briefly brighten the scenery; boss decoration remains reduced. The previous encounter/Jammer restoration persists, including retry/reset behavior.
- Existing jump frames follow ascent/apex/descent and brief idle landing recovery. Firewall attack/recovery poses follow their committed phases. Ordinary-enemy feet use audited frame rows and Makko's actual anchor convention at their retained scales. The new short synthetic cues share the existing SFX bus, with a twelve-voice cap and source cleanup; no music, intro, sprite URL or dependency changes.

`verification/responsive-combat-preview.png` and `verification/responsive-contact-preview.png` show actual artwork drawn through the production Canvas owners with a boundary sprite renderer. They are diagnostic renders, not Makko screenshots. `enemy-contact-calibration.json` records measured source rows. The baseline inventory was intentionally refreshed for the new loaded FX module, its focused check, and moved declarations; prior ownership/asset findings remain.

Next: owner retest below. Settings, new lore/exploration/content, campaign changes and standalone migration remain follow-ons.

## District restoration and selected-pass completion — September 11, 2026

PR #31 is merged at `b9d7ac46f1a3f6eaaf09d28b2508cfd8105ba045`. The owner requested a check against the original selected pass after interruption-related scope confusion. `SELECTED_PASS_CHECK.md` records the exact commitment and maps all eight selected items to code.

Current branch: `agent/level1-district-restoration`, based on merged #31. This continues the original sequence: animation/stance/hacking and five effects, **then district restoration**. The owner rejected fragmenting the remaining small correction into a separate PR.

- Each cleared encounter stabilizes its own storefront displays; recovery traces settle into steady light. Eleven display/window interiors are aligned to the approved foreground image.
- The Jammer's existing four-hit stages gradually reduce localized interference. Its final hit sends one restoration wave outward from its actual world position, lighting displays and traveling along the curb during the existing cinematic. It settles before the boss fight, where musical decoration is quieter.
- Restoration uses the existing pause-gated frame update. Boss retry/rematch preserves the recovered district; full restart resets it. It adds no timers, listeners, audio sources or replacement artwork.
- The audit found that the heavier stomp burst had no live callers. This combined build connects it to successful ordinary-enemy and cyan boss head contacts, retaining smaller guarded effects. Damage, rebound, mission credit and music rules are unchanged.

Production-module checks cover all four real encounter packet completions, the final-defeat transition, sixteen Jammer hits, staged interference, single-wave/pause behavior, cinematic handoff, boss retry, full restart, foreground transforms and clock ownership. Existing combat checks cover stomp contact and guarded repeats. Local Canvas inspection uses the actual foreground; live Makko appearance, audio and readability remain owner acceptance items. The generated manifest/receipt identify the exact review revision and results. Rollback: merged #31.

Older sections below are historical and do not override this scope/status.

## Current animation, mode and effects pass — September 11, 2026

Base: merged PR #30, `1897c4eaade80ca156f4fe6e33828a8bcd59304b`. Review branch: `agent/level1-animation-effects`. The owner approved proceeding with the recommended next pass and confirmed merging #30. The generated manifest records this branch's exact revision and draft PR. This build has not been accepted in Makko.

- Player animation requests now preserve a running clip; new jumps restart once, airborne poses take priority, and rhythm animation recovery no longer schedules delayed callbacks. Existing sheets, scales and foot anchors are retained.
- Rhythm Mode is a grounded performance stance. Entry stops horizontal input and clears buffered jumps; walking/jumping resume after R or Escape releases it. Forced airborne motion ends the stance without stopping gravity or boss separation. The two-hit lift can carry the planted player. Background music and rhythm timing continue throughout. Retry starts outside the stance.
- The terminal shows connect/read/input phases, larger codes and ports, a visible countdown, and short success/failure feedback. Success sends repair packets toward the health HUD. Existing puzzle rules, slowdown, guard, one-health reward and nearby-enemy stun remain. Damage cancellation cannot restore suspended Rhythm Mode; cinematic suppression still wins.
- Added player contact shadows using street/roof/lift surfaces, landing sparks, brief attack/stomp echoes, visible lift-charge energy and subtle beat-driven light overlays aligned with the existing foreground signs. No replacement assets or new audio sources.

Focused checks cover stance/input and rebound behavior at 30/60/120 FPS, animation continuity without delayed timers, lift support/effect cleanup, hacking result/damage/cinematic transitions and sign transforms. A local Canvas inspection covers six terminal draw states; this does not verify the Makko renderer or live audible timing. Full required test results are supplied in the archive receipt.

Remaining: owner playtest, including repeated animation transitions, real boss rhythm/stomp play with explicit stance exit, lift/roof contact and effects at actual game scale. Broader combo, district-restoration, settings and authored-lore ideas are deferred. Standalone migration remains the recommended next infrastructure milestone. Rollback: return to merged #30, which retains the Jammer mode-exit repair.

## Historical Jammer transition repair — September 11, 2026

Base: merged PR #29, `45441e1` (full base/head recorded by the generated manifest). Branch: `agent/jammer-rhythm-exit`; unmerged, awaiting owner Makko verification. Owner response to the musical combat build: “Not bad!” with a new report that Rhythm Mode survives Jammer destruction and leaks into the next section. This is not blanket playtest acceptance.

Jammer destruction now immediately exits the active mode, clears the final attack pose, and freezes the player. Rhythm entry uses the existing progression suppression rule, so R cannot reopen it during the cinematic or level completion. Boss handoff restores normal controls with Rhythm Mode still off; a fresh R press enables it. The background transport, beat progress and track readiness remain running. No assets, timing windows, movement rules, boss balance or hack rewards changed.

Focused production-module checks exercise the real final attack, all eight cinematic phases, beat advancement, unchanged transport generation and fresh activation at handoff. Full required verification is recorded in the generated archive's test receipt. Automated checks do not prove Makko visuals or audible timing.

`OVERHAUL_PROPOSAL.md` records the requested stronger animation/rhythm/hack/effects ideas as proposals, not implementation approval. Standalone migration remains a separately scoped infrastructure milestone.

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
