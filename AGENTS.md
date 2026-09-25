# Repository Guidance

## September 25, 2026 — Cache Road horizon and locale follow-up

After merged #125, the owner rejected duplicate whole buildings, floating
parking ground and mismatched generated cars. The current visual correction
uses one site sequence, a depth-based horizon reveal and projected park and
parking surfaces with game traffic art. Preserve exterior sidewalk setback,
road-facing entrances, shared road/light motion, the five owner MP3s, lane
actions and the open adrenaline/power-up backlog. See
`docs/source-pack/CACHE_ROAD_HORIZON_LOCALES.md` and the top acceptance route.
Native draws and VM checks are not Makko feel acceptance.

## September 25, 2026 — Cache Road visual contact pass

The owner wants the visual backlog ahead of another mechanics tune. From
merged #117, reverse blacktop sampling so it approaches the car, face each
reused flying-ship atlas along its travel, and anchor Cache/freight wheel
paint and contact shadows to the recovered art while the chassis moves. Hold
decorative ship travel and animation under Reduced Motion. See
`docs/source-pack/CACHE_ROAD_VISUAL_CONTACT.md` for native motion review and
`CACHE_ROAD_COHESION_AUDIT.md` for the still-open illustrated traffic,
sidewalk/pedestrian/building/prop scenes, playtest and power-up work.

After merged #118, the automated review identified a raised outer front tire
whose shadow sat too low in a turn pose. The focused follow-up uses separately
measured outer/near contact and mask heights in both steering paintings;
turn-specific draw assertions and the Turbo comparison cover that correction.
Preserve the five owner MP3s, four lanes, controls, sparse pads, save/exit rules and
no Level 2 award. Merge the tested PR for the owner's Makko import; only that
play can settle visual speed, sound and controller feel. Older art review
requirements below describe prior branches.

## September 24, 2026 — Cache Road cohesion and power-up backlog

After merged #116, the owner requests repeated play/simulation before their
next Makko run and adds defensive, offensive, traffic, environment, song and
lane power-ups. Preserve the current face/bumpers and selective inlaid pads.
The current focused patch keeps caught pads visible until they pass the car
and reports armed Push/Brace in the top HUD. The production-input playthrough
results, full seven-part visual/gameplay list and candidate interactions are
in `docs/source-pack/CACHE_ROAD_COHESION_AUDIT.md`. Do not call scripted
runs Makko listening or treat the eight/sixteen-bar holds as final balance.

## September 24, 2026 — grounded Cache Road pads after owner play

The owner rejected #115's fast floating rings: they crossed vehicles, appeared
too often and made the road feel cluttered. Keep the four face actions and
established lane names, but place small mint pads at fixed, planned road
positions in two four-lane runs per lap. Draw them as asphalt markings before
traffic so cars occlude them. The button is judged on any beat while crossing
the pad, with speed affecting approach timing; a miss is harmless. This trial
uses eight bars for a catch and sixteen for a consecutive catch in the same
run to keep four parts reachable with much wider spacing. No crew recording
exists yet. Preserve five owner MP3s, saves, collision/exit and no Level 2
award. See `docs/source-pack/CACHE_ROAD_PULSE_ACTIONS.md` and current
acceptance route; native preview and simulation do not settle Makko feel.

## September 24, 2026 — Cache Road timed pulse review

The owner now wants four face buttons as four distinct driving actions, two
bumpers for Turbo/Echo, left/right steering and up/down speed control with
different rewards. Safe, friendly beat pulses are separate from solid traffic.
The current prototype uses Surge, Push, Brace and Refill, and catches lane
music only when the matching button is pressed on its visible beat in that
lane. Consecutive catches can hold eight bars, and all four active parts
expose the still unrecorded crew-vocal gate. Preserve DRIVE, FLOW, BREAKAWAY
and UNDERCURRENT, the five owner MP3s, save migration and no Level 2 award.
Previous hold/E/RB seal/Zone rules below are historical. See
`docs/source-pack/CACHE_ROAD_PULSE_ACTIONS.md` and the latest acceptance
route. A code/VM/native preview is not Makko feel acceptance; CI and owner
listening remain required. Keep the requested vehicle/roadside art follow-up
after this mechanical review.

## September 24, 2026 — Cache Road layered art PR

The owner requested a calmer seam-free road, swapped visual turn poses, more of Cache Back's face in the same mirror, dirty wispy effects, a genuinely layered city, roadside hardware, a small distant city and a beat/stack-responsive morphing sky. Reuse animated Level 1 ship art as high flying traffic. The source and current preview must retain the recovered car, freight and mirror work. The owner now authorizes a PR for this complete pass; do not merge without their Makko review. Keep lane names, music and save/gameplay rules unchanged. See `docs/source-pack/CACHE_ROAD_MIRROR_ART.md` and the asset READMEs.

## September 24, 2026 — prior Cache Road art motion review

The owner rejected the first recovered art/motion preview as flat and inferior to the saved parallax study. The local review separated wheel contact from chassis movement, added turning rim motion, a stronger freight suspension, wet spray and a decaying crash jolt, and restored city, roadside deck and road motion. The scripted renderer steers through six states; it is not a Makko capture. Preserve Cache Back's partial face inside the mirror on the driver's side with a forward gaze, all four lane names, music/gameplay/saves and the compact transient objective. This branch starts from merged #111; the earlier unpublished animation source was lost, but the saved transparent vehicle/skyline art has been recovered. See `docs/source-pack/CACHE_ROAD_MIRROR_ART.md` and the vehicle/world READMEs.

## September 24, 2026 — Cache Road authored opening

The owner approved a short in-drive opening that makes the original-recording delivery goal clear and teaches the lane hold, E/RB, Turbo and Echo through the first freight, paired block and audit. Keep the hints above the road, transient, and responsive to actual actions; never interrupt driving with a choice menu. The first marker supplies a saved Echo chance for the audit, and version-4 marker saves must validate on Continue. Preserve the music rule and exact lane names below, five MP3s, save migration, final exit, no Bass/Level 2 award, and merged-before-Makko process. See `docs/source-pack/CACHE_ROAD_AUTHORED_OPENING.md` and the first route in `ACCEPTANCE.md`.

## September 24, 2026 — Cache Road predictable lane choices

The owner played merged #109 and found traffic-pass music capture random, difficult to line up, and x3/x4 still too common. Supersede the pass-earned rule below. Center in a lane for 0.5 seconds to choose that part for the next bar; the latest deliberate hold in each bar wins and remains selected while steering to avoid traffic. On that bar's shared downbeat it plays to the end of the current four-bar section; only one automatic part can enter per bar. E/RB still seals the current section remainder and next four once per section. Passes and close cuts grant score, Zone/Echo/Turbo but never choose or extend a music part; recognize adjacent near misses with normal steering drift and show clear feedback. A hit clears current, upcoming and selected parts and keeps the beat-aligned dropout/recovery. Preserve established lane names, all five MP3s, 100-bar form, road paint under traffic, Zone, Turbo/Echo, old saves, no Level 2 award, and the merged-before-Makko process. See `docs/source-pack/CACHE_ROAD_PREDICTABLE_MUSIC.md` and newest acceptance route. Test one-per-bar, choosing then dodging, actual cut and near miss, hit, full song and repository gates. Owner audio/controller feel remains an open Makko judgment.

## September 24, 2026 — Cache Road driving-earned music prototype

Owner Makko play finds that free half-second holds plus unlimited E/RB presses make x3/x4 routine, and a traffic hit sounds like the same music at lower volume. This pass changes that specific rule: a centered 0.5-second hold prepares/previews a part; a clean pass seals the current four-bar remainder, and a close escape also carries the next four bars. E/RB still seals the current remainder and next four immediately but can do so once per four-bar section. All supplied lane recordings remain selectable throughout the 100-bar song; no section mask or meter payment returns. A hit clears prepared, active and queued parts, briefly cuts the shared bus to silence and returns on a beat, then leaves Pressure drums without the quiet Drive/Flow beds until a new part is earned. The five source clocks never stop or seek on impact. Preserve lane names, road paint, Zone, Turbo/Echo, save migration, no Level 2 award, and merged-before-Makko listening flow. The old free-lock acceptance route is historical; see `docs/source-pack/CACHE_ROAD_DRIVING_MUSIC.md` and the newest route in `ACCEPTANCE.md`. Test traffic steering without invulnerability, actual MP3 output, full 100 bars and all repo gates.

## September 24, 2026 — Cache Road recorded-lane correction

Owner playback contradicts the claimed missing stems. Directly decoded owner MP3s show Undercurrent throughout every verse A (about −30 dBFS RMS in bars 5–12) and softer Breakaway content there (about −43 dBFS). The hard-coded intro/verse A availability masks in the road and music director were an inaccurate inference; all four lanes now accept the current and upcoming four-bar capture through the 100-bar song. Some intro samples are genuinely silent and Breakaway is much quieter in verse A, so visible locks do not invent or amplify recorded content. Preserve the free half-second hold, E/RB current-plus-next, Zone, collision, road paint, save/exit and no-award boundaries. Owner's excessive ease report remains a separate balance issue; do not solve it by hiding or refusing lanes. Test and merge for Makko listening, then maintain the source pack from the exact revision.

## September 24, 2026 — Cache Road Zone review corrections

Following merged #106 (`6b874006fa1de26afd727afa7feb89c7c5c8a853`), fix three concrete review findings on `agent/cache-road-zone-polish`: pause controls must describe free hold/E/RB captures and Zone; RB confirmation must name only the current and/or upcoming phrases actually sealed; a paired traffic collision must suppress every clean-pass reward from the same crossing even if the adjacent vehicle is processed first. Preserve #106's free four-bar stack, Zone timing/speed/time, MP3 transport, visual paint, hit stumble, Turbo/Echo and no-award boundary. Run focused and full validation, merge after CI for Makko, then refresh the maintained source pack from exact main. See `docs/source-pack/CACHE_ROAD_ZONE.md` and newest acceptance route.

## September 24, 2026 — Cache Road Zone and clear lane captures

The owner reports that merged #105's 60/40 ink gate makes lane captures feel random and prevents stacking. This focused `agent/cache-road-zone` pass supersedes that payment rule: a centered 0.5-second hold freely commits the **next aligned four bars** of that lane, and E/RB immediately commits the recorded remainder of the current four-bar section **plus the next four bars** when that stem exists. Each visit is idempotent; long holds no longer silently extend to eight. Close cuts, near misses, freight drafting and clean bars fill Zone. A charged Zone begins when a queued phrase enters, speeds that aligned four-bar stretch and refunds 1.5 seconds once. Preserve #105's single road-projected paint, denser fair traffic, Turbo/Echo, hit stumble with a clear road, five supplied MP3s, 100-bar form, old saves and no campaign award. See `docs/source-pack/CACHE_ROAD_ZONE.md` and the newest acceptance route. Merge after CI for Makko testing; owner fun, controller and listening acceptance remains open. Earlier Cutline guidance below is historical.

## September 24, 2026 — Cache Road Cutline review

Owner playtest of merged #104 found duplicate/floating road layers, a free-lane sweep exploit and little skill expression. The current `agent/cache-road-cutline` pass keeps **automatic** phrase locks but charges 60% ink for four bars, 40% more for the eight-bar carry and awards a major refill for a threatened-lane close cut. Paired/triple traffic gates, a road warning and an Echo audit lure make timed driving and tools meaningful. Phrase paint is a single projected road layer with a progressive print; lower HUD cards and floating marker/popup are removed. RB remains unrelated to locks. Preserve five supplied MP3s, full 100-bar form, collision stutter without text, old saves and no campaign award. See `docs/source-pack/CACHE_ROAD_CUTLINE.md`. Merge after CI for Makko evaluation; owner fun/listening acceptance remains open. Earlier free-lock guidance below is historical.

## September 24, 2026 — Cache Road phrase commit system

The owner corrected #103's two-bar captures and collision overlay, and explicitly wants **automatic lane locks**. The current review branch `agent/cache-road-section-lock` arms the next aligned four-bar phrase after 0.5 seconds centered without a button, then automatically carries it to eight after 1.5 seconds for 25% meter where recorded. A beat-aligned current-lane preview, full road-surface phrase lighting and a clear collision view with the existing audio stumble complete the loop. Keep the five supplied MP3s synchronized and the 100-bar intro/verse A/verse B/chorus form. The dwell thresholds and carry charge are playtest balance, tested through real steering to x4. `docs/source-pack/CACHE_ROAD_SECTION_LOCK.md` is the new rule and review record; the Stack the Bars directions below are historical. Preserve old saves, the final Echo exit, no Bass/Level 2 award and shared frame/audio/input owners. Run focused production, Chromium, native-frame, full suite and syntax checks. Merge after CI for owner Makko review, then refresh the maintained v5 pack from the exact main commit.

## September 23, 2026 — Stack the Bars and collision stumble

The owner accepted the Stack the Bars design after hearing #102 and requested a Guitar Hero-style audible miss on traffic impact. This pass replaces the four-bar vote/indefinite locks below: center in a lane for 0.5 seconds to catch it on the next beat for two bars; E/RB spends 50% to seal that lane for four bars while driving to another. Distinct caught parts stack up to x4 over the always-on Pressure, quiet Drive floor and verse Flow bed. A collision briefly stutters/powers down the music bus, plays a pitched tear, clears the active stack, and keeps all MP3 sources on their shared clock. Score clean bars and near misses, show each lane's remaining captured bars and section entrance. The sparse intro/verse A parts are visibly unavailable until their recorded entrance. Migrate v1–v3 road saves to v4 with old indefinite locks refunded. Preserve the complete 100-bar chase, old title/Level 1/Level 3 boundaries and no Level 2 award. Merge after CI before Makko listening; the owner must still assess sound and controller feel. See `docs/source-pack/CACHE_ROAD_STACK_THE_BARS.md`.

## September 23, 2026 — full Cache Road song arrangement (historical before Stack the Bars)

The owner corrected the song form: **four-bar intro, then four 16-bar verses and four eight-bar choruses** (100 bars total at the provisional 128 BPM grid). The A/B labels in the reference image are the two eight-bar halves of each verse, not separate verses. The former four-stem PR #101 is superseded by the five named owner stems from `BARCODE_Cache_Road_MP3_Layers.zip`. Pressure/drums is the permanent backbone; Drive, Flow, Breakaway and Undercurrent/FX are selectable. Never make steering continuously change stem gain. Hold a chosen combination for a complete four-bar phrase, keep three audible parts in normal verse/chorus play, and allow the two-part intro because the other recorded parts have almost no content there. The full drive needs to reach the fourth chorus and final bar, with all five sources sharing one clock. See `docs/source-pack/CACHE_ROAD_FULL_SONG_ARRANGEMENT.md`. Historical four-stem and FX-bed directions below are superseded. Keep the merged-before-Makko review rule, old checkpoint migration, title/Level 1/Level 3 boundaries and no Bass/Level 2 award.

## September 23, 2026 — steady Cache Road arrangement after owner listening

PR #100 merged at `86ec9ce08018584a75b3fbd456738239a926e322`, but the owner heard large dips and returns while steering. The actual stems are uneven: Bass is loud and continuous; FX is sparse, especially at the opening. The next change keeps Bass, Drums, Harmony and FX on their shared clock, with a steady Bass/Drums foundation and lane/lock accents that change combinations without dropping the song. The fourth lane temporarily features Harmony plus FX while awaiting the new instrumental. Keep the no-lane vocal deferred until an asset exists. Test steering both directions with real MP3s, run repository checks, publish and merge after CI so the owner can listen in Makko. Automated browser output is not a listening verdict. The old beat-gated FX-bed instruction below is superseded.

## September 23, 2026 — owner confirmed audio; merge before Makko review

The owner heard the four real Cache Road stems in Makko after PR #98 merged at `ae1be4a1ee868f0307daa0e8e47f7a100a1510e1`. The new problem is musical: swapping one selected part for another sounds abrupt. Implement an always-on FX bed, a faint drum pulse through the sparse FX opening, and longer beat-aligned handoffs using the current four stems. The fourth lane temporarily foregrounds FX until the owner supplies another Harmony/instrumental part; the future crew vocal performance reward has no audio asset yet and must not be fabricated. Preserve the shared audio clock, old saves, the title/Level 1 mix, Level 3 test and no Bass/Level 2 award.

The owner explicitly clarified that **Makko testing requires a merged PR**. Publish the tested change as a ready PR, merge it after its checks pass, then give the actual main merge SHA for import. Historical instructions below to leave PRs unmerged until Makko listening are superseded. A passing automated check still does not claim the merged build has been heard in Makko.

## September 23, 2026 — Cache road remained silent in PR #97

The owner confirms title audio works but Cache Road remains silent in Makko after the GET-only/canvas fix in PR #97. #97 merged while this follow-up was prepared; base the next draft on its actual merge `df02c8964d34b2cfa13a5c4f6d3495395b39aba5`. Do not describe local asset decoding as a hosted listening pass. The road loader previously substituted generic 60-second buffers for missing 187.5-second owner stems and returned success; the road only marked that as degraded. The next revision must require the four actual MP3s, try the same pinned published bytes if an import omits a local binary, and visibly fail/retry at the intermission if neither source works. Preserve the existing canvas fix and title/Level 1 audio. Cover a missing-local-asset browser case, live published URL delivery where available, actual nonzero audio output, failure/retry, and full repository gates. Makko listening remains unverified; do not merge on automated results.

## September 23, 2026 — PR #96 host audio and canvas failure follow-up

The owner's Makko playtest of #96 failed: the four MP3 stems did not play, and the host reported `Canvas context creation limit exceeded`. PR #96 was then merged at `c2ca847c63c3b8b70ba178dd02fda0ad8ab4f508`. The follow-up on `agent/cache-road-audio-load-repair` caches the game canvas context across Cache Road, Level 3 and difficulty frames; it also removes the MP3 loader's mandatory HEAD probe, which rejected otherwise readable assets on some hosts. A real Chromium check uses a HEAD-rejecting local server and a canvas-call guard: 600 road frames use one context acquisition, all four shipped MP3s GET/decode to 187.5 seconds and start on one clock with nonzero lane gain. This does not establish Makko delivery, sound, full-loop seams or controller feel. Publish a new draft PR, refresh v5 from the committed tree, and retain the Makko-before-merge gate. Preserve the missed-exit fix, campaign boundaries and old saves.

## September 23, 2026 — owner MP3 stems for Cache road review

The owner supplied `ContraBass.wav`, `ContraDrums.wav`, `ContraHarmony.wav` and `ContraFX.wav`, then requested MP3s before merge. The current `agent/cache-line-exit-retry-clarity` review includes four 160 kbps MP3s in the road profile, mapped to Bass/Drums/Harmony/FX lanes. Their common 187.5-second decode and inferred 128 BPM grid replace the five generated scratch WAVs; the original uploads remain the provenance, and `docs/source-pack/CACHE_LINE_MP3_STEMS.md` records exact conversion and checks. The road loads the four parts together and still starts each on one transport anchor. This is a review mix: listen in Makko, test an actual controller, seams, load time, volume and the Echo exit before assistant merge. Preserve old saves, the Level 1/Level 3 routing and no Bass/Level 2 clear. Refresh the current source pack from the tested review commit.

## September 23, 2026 — Cache Line exit retry correction

PR #95 is merged at `2cd9d40a44b6c91abc36c3d6d40a766dc9879c0f`. The owner reports the better chase still loops or jerks backward. The cause in #95 is the missed original exit assigning progress 1910 and continuing to drive, while the 2.7-second Echo expires before a normal run from the visible exit cue. Branch `agent/cache-line-exit-retry-clarity` stops at an explicit missed-exit result without changing progress; only the player's retry returns to the saved Mirror Viaduct marker with full Echo. The final approach Echo lasts six seconds and the cue states the split. See `docs/source-pack/CACHE_LINE_GATE_RETRY_FIX.md` and the newest acceptance route. Preserve speed/art and checkpoint format from #95, the Level 1/Level 3 handoffs, one input/frame/audio owner, and no Bass/Level 2 clear. Publish a tested draft and refresh canonical v5; owner Makko/controller/feel review remains necessary before assistant merge.

## September 23, 2026 — Cache Line readability and pace follow-up

PR #94 merged at `0852ff0bf23d5ae52816f59f7131db93c0741777`. The owner played that chase slice and found it slow and hard to read with crude vehicles. The current branch `agent/cache-line-visual-speed-pass` is a focused response: faster cruise/turbo/steering, clearer projected road motion and differentiated code-native traffic/Cache/Echo/Clean Copy silhouettes, local warnings and a simpler HUD. See `docs/source-pack/CACHE_LINE_VISUAL_PACING_PASS.md` and the newest acceptance route. Keep the five temporary music sources, checkpoint compatibility, Level 1 return, separate Level 3 test, no Bass/Level 2 clear and all shared owners intact. This is a playtest pass, not approved final art or a finished authored chapter. Publish a tested draft and update canonical v5; require owner Makko/controller/feel review before assistant merge.

## September 23, 2026 — Cache Line chase slice after creative review

The owner rejected the lane-runner proof as too basic and accepted the `Original Master` chase concept for further work. `docs/source-pack/CACHE_LINE_BLUEPRINT.md` states the working target; `CACHE_LINE_CHASE_SLICE.md` records the current review pass. The same Level 2 draft now tests continuous steering/brake/speed, distinct traffic, paid three-part locks, Buffer Echo, a committing Clean Copy rival and an Echo split at the original exit. Do not mistake the temporary raster vehicles or generated 120 BPM WAVs for final art/music, the proof card for an authored cutscene, or this encounter for a finished boss. Preserve v1 proof checkpoint migration, Level 1 Voice/return, old Level 3 test, one input/RAF/audio owner and no Bass/Level 2 clear. Run the targeted and full suite, publish the tested draft and refresh canonical v5. Owner Makko/controller/listening/feel review remains necessary before merging or calling the chapter complete.

## September 23, 2026 — Cache road lane-music proof

The current owner continuation asks to make Level 2's soundtrack respond to road lanes: each lane carries one part, and locked lanes continue playing when Cache steers elsewhere. `docs/source-pack/CACHE_ROAD_MUSIC_PROOF.md` records the bounded implementation/review. It is a separate `level-02.proof` song and save adapter, not authored Level 2 completion. The Level 3 transmitter test remains reachable as a labeled architecture route. Preserve Voice, old Level 1 saves, old Level 3 checkpoints, the shared input/RAF/audio/pause lifecycle and no Bass award. These scratch 120 BPM WAVs are temporary; listen in Makko before accepting feel or replacing them with authored music. Publish one tested draft; do not assistant-merge before owner Makko/controller/listening review.

## September 23, 2026 — campaign redesign after rejected Level 3 feel review

The owner's latest story direction is in `docs/source-pack/CAMPAIGN_REDESIGN.md`; read it before the historical sections below. The playable order is 6 Bit/platformer, Cache Back/Rad Racer, Mac Modem/Streets of Rage, DJ Floppydisc/Super Smash TV, all four/Sheila's Pokémon-inspired forgotten competition, all four/first-person RPG, all four/DOOM finale. The old Contra preview was an architecture test, not the new Level 3. PR #91 merged the transmitter preview, but the owner rejected its boss/gameplay feel as the campaign direction; its placeholder story is not canon. Do not grant its Drums key or Level 3 completion. The owner corrected the Level 5 story: Sheila competes using the original four as mindless husks; they do not remember it, discover it after Level 4, and she does not replace Corporate Satan after defeating him. 9 Bit is an unexpected player-aware ghost on saved-title, game-over, level-end and final end surfaces. He also occasionally pranks the crew/player, including a saved-game tile that moves after a pointer click once; the real save, input paths and result facts remain usable. See `docs/source-pack/CAMPAIGN_SCENE_BEATS.md` for the story arc and interaction contract. The exact simulation creator, separation initiator, 9 Bit motive/ending and later gameplay/copy remain design tasks. Earlier required Contra/puzzle/DOOM-before-finale entries in this file are superseded for future stages; preserve shipped Level 1, lore and campaign/save contracts.

## Historical September 23 implementation note — transmitter architecture preview

Base/rollback is merged #90, `568c646a3f67cf4ebca4faebd81752534c67ee6f`; branch `agent/broadcast-slum-boss-pass`. The owner confirms the first two Level 3 preview passes work but feel too easy and basic, and asks for a more compelling Contra-style proof with distinct enemies, a boss and a story connection. Read the newest `docs/source-pack/BROADCAST_SLUM_PROOF.md` and `ACCEPTANCE.md`. This is still a contained test of reused Level 1 architecture; The Cache Line is Level 2 in story order. Keep one input/RAF/audio/save/pause owner, old preview checkpoint compatibility, and clean Level 1 return. Do not award Drums, a Level 3 campaign clear or durable later lore. PR #91 subsequently merged; the owner then rejected the preview's gameplay feel as a campaign direction.

## September 23, 2026 — Level 1 skip and Level 3 DEV menu

PR #89 has already been merged at `c0d061407378831ae90fcac49985a29c3c5ea037` (base/rollback). Branch `agent/level3-debug-menu` adds a session-only Level 1 completion shortcut and canvas-native Level 3 development menu. Read `docs/source-pack/BROADCAST_SLUM_PROOF.md` and the newest ACCEPTANCE route. Level 1's skip must use the real intermission save/Voice unlock, but exclude artificial best-result, bonus and difficulty challenge records. Level 3 controls may reset/advance its provisional relay checkpoints and show `proof-clear`; they must never award Drums or a Level 3 campaign clear. Preserve one input/RAF owner, pause and audio return. Publish a new tested draft and refresh canonical v5; owner Makko/controller/audio/feel acceptance remains pending before assistant merge.

## September 23, 2026 — Broadcast Slum combat follow-up

The owner's first playtest of merged #88 reports that the proof works but feels easy and basic. Base/rollback is `b32a67831acc296c1cb1887ad579bbc04ac44cb1`; branch `agent/broadcast-slum-combat-pass`. Read the updated `docs/source-pack/BROADCAST_SLUM_PROOF.md` and newest ACCEPTANCE route. Each relay now has a reachable roof node shield, a bounded counter surge with a warned two-lane volley, an additional marked roof shot when elevated, a runner from behind, and a temporary scatter pickup. Defenders have distinct elevated gunner, patrol and runner behavior. Keep the preview boundary, checkpoint migration, audio transport, controls and Level 1 return intact. Voice persists; no Drums or Level 3 completion. Publish one tested draft and refresh canonical v5. Owner Makko/audio/controller feel acceptance is required before assistant merge.

## September 23, 2026 — first playable Broadcast Slum proof

The owner accepted moving past Level 1 after merged PR #86, `50aae91fea5f63a876d75a97bd67f86a539a961f`. Branch `agent/broadcast-slum-proof` provides one provisional Level 3 run-and-gun preview from Cache Back's saved handoff. Read `docs/source-pack/BROADCAST_SLUM_PROOF.md` and the newest ACCEPTANCE route. The Cache Line remains Level 2 in story order. Keep the preview's two relay checkpoints, entry, pause, exit, title resume, independent 108 BPM temporary stems and Level 1 audio return within the existing input/RAF/save/transport owners. Preserve Voice and Level 1 discoveries; do not award Drums, Level 3 completion, or a later story scene. Preserve Level 1 music timing and combat. Publish one tested draft and refresh canonical v5. Hosted Makko/audio/physical-controller acceptance is required before assistant merge.

## September 17, 2026 — stronger Hack and Rhythm Mode presence

The owner's new request authorizes pronounced audiovisual power in both modes and a bullet-time feel in hacking. Base/rollback is merged #85, `62b44f7cf5446b38bec18746411587327cedb142`; branch `agent/mode-power-presence`. Read MODE_POWER_PASS.md and the newest ACCEPTANCE route. Retain the opaque terminal/live viewport and protected music synchronization. Cars/spawning, ambient particles and skyline now slow with hacking; the elevator keeps its established passenger/power clock. Personal animation, input and FX remain real-time; terminal answering remains stationary. Use approved idle frames for a dedicated hack gesture and guard deflection. Rhythm uses the actual transport beat and damage radius. New SFX share the existing bus/voice budget, warning priority, pause/reset and preferences. Reduced Motion/Flashes Off retain steady readable cues. No damage/score/boss/jammer retuning in this pass. Publish one tested draft and refresh canonical v5. Existing owner Makko/controller acceptance remains required before assistant merge.

## September 17, 2026 — final Level 1 playtest follow-up

The owner's new request authorizes a stable visible hack panel with live enemies, title settings and pause fullscreen, explicit settings/recovery rules, stronger varied boss support and jammer phases, and a gentle return to proven dialogue/objective positions. Base/rollback is merged #84, `bbd95ba821b99a1268e1dc563d7027fdbf12dc08`; branch `agent/level1-final-playtest`. Read FINAL_PLAYTEST_PASS.md and the newest ACCEPTANCE route.

Active hacking now owns an opaque fixed panel beside one scaled live scene. Earlier moving/cutout terminal requirements are superseded for active hacking only. Preserve working dialogue movement; learned homes are a bounded opt-in preference, not a replacement solver. Preserve music source/transport/judgment sync. Settings use the existing input/frame owners. Difficulty/recovery lock per level; objective recovery is the default, Full Run earns +500 clear points. Both modes save objective boundaries. Death must persist before reopening and must not duplicate points. Boss/relay escorts reuse smaller recolored rooftop art, have finite warned shots/population, keep hack/stomp counters and award no farm points. Publish one tested draft and refresh canonical v5. Existing owner Makko/physical-controller acceptance is still required before assistant merge.

## September 17, 2026 — control alignment and finishing

The owner requests a pass aligning controls on their black squares plus remaining discussed polish/optimization. Base/rollback is merged #83, `c5be7a9ac1c2a1ef6609ce69e5714a5c9f8b2698`; branch `agent/control-polish-optimization`. Read `CONTROL_POLISH_PASS.md` and the newest ACCEPTANCE route.

Center prompt glyphs independently of inherited Canvas text state, use saved device/action labels, and fit wider mappings. Share the centering with objective badges, hack keypads and Begin Level. Preserve all gameplay/art/music and moving-panel behavior. Target repeated presentation work only: per-request actor projection, duplicate layout candidates, complete-line wrapping and per-enemy target searches. Earlier polish/boss/music/campaign features already exist; do not redo them. Native pixel evidence and equivalent placement checks supplement the full suite. Publish one tested draft and refresh maintained v5; existing owner Makko review remains required before assistant merge.

## September 17, 2026 — make the music response audible

The owner cannot hear PR #82's music changes and confirms the track names are wrong: ignore them when choosing musical treatment. Base/rollback is merged #82, `a0f9e79356210b0966f0a9d04113094b52b8e568`; branch `agent/audible-music-response`. Read AUDIBLE_MUSIC_RESPONSE.md.

The linked audio, not the filenames, establishes processing roles. The historical `fx-layer` is predominantly low bass; `bass-layer` contains midrange material. The earlier high-cut filter on the former had almost nothing to remove. Keep source IDs/URLs, timing, loops, transport and judgments unchanged. Apply colour processing to actual midrange, add clear bass cutaways/returns and phrase variation, and preserve the dry foundation. Off must still reproduce legacy mixing exactly.

Real Chromium PCM renders now supplement timing and gain-route tests; attach the original-audio A/B evidence and keep listening acceptance distinct from numerical output checks. Preserve all #82 gameplay and campaign changes. Publish one tested draft and refresh maintained v5; no assistant merge before the owner's Makko listening review.

## September 17, 2026 — boss, safe music variation and campaign foundation

Owner approval: “Alright, let's do it. You can take a look at the sync but if its not broken, don't fix it.” Base/rollback is merged #81, `a75f33f2321a9e96f3a8fa7677dbf61e586bdb1e`; branch `agent/boss-music-campaign`. Read `BOSS_MUSIC_CAMPAIGN_PASS.md` and the newest acceptance route.

Preserve the actual audio start/loop/restart/transport/judgment baseline; file-length differences and inaccurate old comments are not a demonstrated synchronization failure. The new profile-owned mix uses running tracks, gain/filter/echo and a saved Dynamic music A/B switch. Protected-method hashes plus real source-schedule comparisons cover three loops and pause/resume. No audible Makko acceptance is implied.

Boss counters now use 6/3/2 fresh beats by difficulty, with a fixed marked slam on later cycles. Keep the safe rebounds, traffic, roof/lift physics and all previous controls. Campaign additions persist encounter/Jammer/boss checkpoints, per-difficulty results and the Voice key, plus an honest upcoming-channel intermission. Preserve the save identity, hidden reward facts and unresolved ending rules. Later playable levels and their authored music are not supplied by this milestone.

Two new frame-owned modules intentionally extend the script graph; preserve baseline exceptions while updating that inventory. Publish one tested draft and update the same maintained v5 archive. Owner Makko/physical-controller/listening acceptance remains pending before assistant merge.

## September 17, 2026 — enemies can leave the elevator

The owner reports enemies trapped in the grounded cabin after merged #80. Base/rollback: `f2fb5dccf7473f8584fcd3bf25847780c35a37b3`; branch `agent/enemy-lift-exits`. Real Firewall, Corrupted and virus pursuit reproduced the fault in both directions: the ledge guard stopped actors 45 units inside the cabin.

Enemy walking and contact separation now share safe bounds: grounded cabin exits use the street; level, overlapping lift/rooftop supports join their walking ranges. Exposed elevated edges retain their guard. Moving-deck landing support continues to the actual edge so rooftop handoff has no falling gap. Preserve player carrying, lift power/layers, smart boxes, platform reuse, traffic and combat tuning.

Read `ENEMY_LIFT_EXIT_FIX.md` and the newest acceptance route. Existing 99 ride tests now include 54 exits with real enemy AI, rooftop handoffs/reboarding, crowd pursuit and stationary-player separation. Exact head, CI and checks belong to the generated receipt. Publish one tested draft and refresh the maintained v5 archive; hosted Makko/controller acceptance remains pending.

## September 17, 2026 — stable elevator passengers and relevant car warnings

Review branch `agent/lift-riders-traffic-relevance` builds on merged #79, `318f024c1e1c6bb38f479b7e4842c894074c5ed4` (base/rollback). The owner requested smoother elevator carrying, removal/reuse of the circled lower Firewall platform, and WATCH OUT only near a car's danger lane, without pulling it onscreen. Exact review revision, tree, PR and checks belong to the generated receipt.

Boarded floor/roof passengers retain the carriage's foreground lane through overlapping facade ledges and both stops. Fractional foot coordinates retain support. Walking out transfers support; stepping aboard at the aligned rooftop acquires it. Cabin jumps retain the lane; deliberate drops release it. An exit into a solid canopy waits at the cabin edge instead of ejecting the actor. This supersedes automatic rooftop/canopy handoffs and their sideways shoves. Awnings remain solid for other actors. Enemy floor support survives the street stop.

Remove `firewall-low-step` art, top collision and bonk. Reuse its gold frame at `firewall-high-step`, replacing a repeated design while preserving that upper step's geometry and hangers. Car cues use the actual player/hazard lane and briefly anticipate vertical movement. Label and arrow remain at the approaching edge and actual car altitude, including clipping/offscreen. Preserve original car motion/damage, five-second power, recharge reversal, crushing, front rails, controls and #79 smart boxes.

Read `LIFT_RIDERS_TRAFFIC_PASS.md` and the newest acceptance route. Publish a tested draft and refresh the existing v5 archive. Owner Makko/physical-controller acceptance remains pending before assistant merge; automated/native captures do not establish it. Earlier conflicting entries are historical.

## September 17, 2026 — smart boxes: movement is not a hide trigger

The owner rejected PR #78's blanket hiding during walking, jumping and Rhythm Combat. That correction supersedes the older smart-panels section and its acceptance route. Base/rollback: merged #78, `ec89e7468a6f79bcafcaea8b07d3c75ab37a3cf9`; branch `agent/smart-box-motion`.

Unread tutorial, lore and inspection remain visible during play. Shared screen-space placement moves panels around actors, reshapes tutorial dialogue or the hack keypad when needed, glides to the chosen location, and dissolves during an obstructed crossing. Actor pixels are clipped out during that crossing, then the panel fades back in. Clear panels stay parked. Only actual crowding uses a compact saved-message tab; it reopens after a sustained clear window. Unread lines, Continue and hack scan/deadline/input remain protected while unreadable. Active rhythm controls reserve their space. Pause/restart and reduced motion use existing lifecycle owners.

Preserve #78 elevator rear/passenger/front-rail layering, collisions, power and all other gameplay. Read SMART_BOX_MOTION_PASS.md and the newest ACCEPTANCE route. Publish a draft and refresh the existing v5 archive. Owner Makko/physical-controller acceptance remains pending before assistant merge; automated/native captures do not establish it.


## September 17, 2026 — smart panels and elevator front rails

Base/rollback: merged #77, `78f67f4750a2d12f8a2063c895d06d5b9952d700`. Branch: `agent/tutorial-play-space`. The owner reports the tutorial hiding street enemies during jumps, the fixed hack panel hiding its locked target, and passengers appearing over the elevator's front rails. This pass implements those reports together.

Across gameplay, tutorial, lore, inspection, mission objectives and transient prompts avoid visible actors. Large unread dialogue waits during movement, airborne play and Rhythm Combat; typing, Continue input and reading time stay frozen while hidden. One reading panel takes priority over secondary prompts. The hack terminal and result use the actual camera/zoom projection to avoid the target, player and other enemies. Crowded scenes use a short six-column keypad, with matching pointer/controller navigation. Clear placements remain steady. If no readable layout fits, unseen dialogue and puzzle phases wait while Escape remains available.

The existing lift image is split with complementary clips: cabin back/deck, passengers, then front rails/lip. The fixed drive remains behind actors, and characters below the moving floor remain behind both cabin layers. This supersedes drawing the whole cabin behind passengers. No asset replacement or collision/timing changes.

Read `docs/source-pack/SMART_PANELS_LIFT_PASS.md` (or `SMART_PANELS_LIFT_PASS.md` at the pack root). Preserve all merged #77 tutorial/progression, hack dilation/trails, deliberate drops, Studio Rat sequencing, recovered art and five-second lift power. Current PR/head/checks belong to the generated receipt. Publish one draft and refresh maintained v5; owner Makko acceptance remains pending before assistant merge. Older entries below are history.

## September 17, 2026 — playtest clarity, hack dilation and dynamic lift depth

Continue from merged #76, `ee089acce1ee9dad6ffd877fe32f99dd633aa011` (base/rollback), on `agent/tutorial-single-panel`. The owner's follow-up requests are implemented together: one alternating tutorial instruction area; lore and inspect waiting through the complete Studio Rat event; stronger hack slowdown with a gentle pulse and enemy trails; deliberate Down + Jump through every standable surface, including solids; and player/enemy elevator depth following the moving floor. The fixed drive stays behind actors.

Read `docs/source-pack/PLAYTEST_POLISH_PASS.md` (or `PLAYTEST_POLISH_PASS.md` at the pack root). These explicit requests supersede the old simultaneous Objectives/dialogue cards, 40% constant focus, solid-surface drop prohibition and roof-only enemy depth fix. Preserve the twenty-bubble story/progression, all recovered art, boss clearance, twelve-second allies and exact five-second lift power. Current PR/head/checks belong to the generated receipt. Publish one draft, refresh the maintained v5 archive and retain owner Makko acceptance before assistant merge. Older entries below are history.

## September 17, 2026 — Finish The Job recovered and completed

The owner's shared **Finish The Job** conversation explicitly approved the twenty-bubble tutorial and then added platform art, lift/terminal polish, pickup SFX, reactive portraits, solid awnings and beat colors. The original local tutorial commit and unfinished art/gameplay work were recovered. They are integrated on `agent/finish-job-recovered` over merged #75, `48ec019a6037a3bf3910614eb5bae3c0c58d4130` (base/rollback).

Read `docs/source-pack/FINISH_THE_JOB_RECOVERY.md` (or `FINISH_THE_JOB_RECOVERY.md` from the pack root) first. It records the approved scope, recovery provenance, boss-routing cause, implementation, evidence and recommendations. The tutorial is implemented. All five platform designs and six portrait expressions are recovered and connected. Earlier claims that this work was only a proposal or that its artwork was missing are superseded.

The latest owner instruction makes all five awnings fully solid for every actor. Ordinary roofs/steps remain one-way except the two circled small-step underside bonks. Boss terrain clearance now matches his roughly 232-unit body instead of the oversized 310-unit elevator probe. He clears awning edges and blocked upper routes while retaining his original street approach. Preserve #75's exact five-second lift clock and corrected terminal placement/screen effect.

One combined draft and the maintained v5 archive hold this work. Exact head, PR and test outcomes belong to the generated receipt. Owner Makko acceptance remains pending before assistant merge; native renders and simulated input tests do not establish it. Follow the newest `ACCEPTANCE.md` route. Earlier current-work entries below are historical.

## September 17, 2026 — platform attachments, five-second lift power and terminal screen

Continuation from merged #74, `ea7a34571f91ba12d05291d6698eb17b389d150f`, on `agent/platform-mounts-charge-timeout`. PR #73 already corrected the blanket ledge collision mistake: only the four circled static objects bonk, plus the separately solid moving elevator roof. This pass preserves that collision scope and every existing small deck position/size.

Visible support hardware now terminates on masonry: left/right cantilevers for projecting decks, bolted front brackets and short hangers where glass/signs prevented an underside attachment. The current deck artwork is retained. Three previously proposed replacement image designs were not recovered from GitHub or available files; do not claim they were integrated or replace them with invented equivalents.

Two initial rhythm charges still launch the lift. Each accepted charge grants five simulation seconds; it then returns even when occupied. An onboard charge renews power at the shared rooftop seam or reverses descent. Pause freezes the countdown. The permanent terminal moves left to x=498, y=638, clear of the illustrated awning and neighboring door, with its existing collider/art/depth. Its existing painted waveform jitters inside the glass for 320 ms every 4.2 seconds using the shared scenery clock; reduced flashes disables this.

See `PLATFORM_MOUNTS_CHARGE_PASS.md` and native captures in `review-platform-mounts/`. Required full-suite/syntax outcomes and exact published revision belong to the generated receipt. Publish one draft and refresh the existing v5 archive; owner Makko acceptance remains pending. The tutorial proposal remains unimplemented.

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

## September 16, 2026 — boss fairness, full-height rhythm lift and Studio Rats

Base/rollback is merged #68, `84f7471fce9bb9300cd7c6f7165a86787054ace9`; branch `agent/boss-fairness-level-rewards`. The owner authorized this combined gameplay pass, then corrected the elevator: one fixed full-height back drive with the cabin in front and powered mechanism animation. This current section supersedes historical work entries.

Rhythm attacks now reach the boss body on street/roofs. Slightly wider descending stomp catches and brief shallow side-contact forgiveness preserve genuine damage. Original warned foreground cars stay active in boss combat and hit both actors; the boss gets only a small inset/40 ms exposure allowance. The 196-wide roofed elevator expands around its original center for a valid canopy handoff, with fixed drive strip, animated teeth/motors, readable short rhythm-power text and Cliff's note beside it.

Level-start difficulty locks through checkpoint retries. Level-specific profiles and hidden best-completion values support future rewards; exact reward thresholds/content remain undecided. Level 1's one-time tuxedo Studio Rat event now looks at the viewer, pounces and drags an eligible enemy off screen, or pulls the comic border when none is available. Durable identifiers cover all seven future levels; the later encounters still require their genre-specific implementation. Existing save credit survives the event upgrade.

Read `BOSS_FAIRNESS_PASS.md` for tuning, asset provenance, regression routes, native previews and limitations. Asset ancestor: `f92f076b237632c7001641690505560fe9075da6`. The source receipt records the exact PR/head/checks. Preserve all #68 environment/controls/routes/music work. One combined draft; owner Makko playtest remains required before merge. The earlier temporary outage is resolved and `BOSS_FAIRNESS_RECOVERY.md` is historical.

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


## September 16, 2026 — street depth, one terminal and render cost

Base/rollback is merged PR #58 (`1c8b54ec5db0e102f64c0ffb15bd4b57c5e5acda`). Branch `agent/street-depth-terminal-performance` implements the owner's new feedback: draw emitter hardware behind enemies, replace three large generic boxes with one illustrated broadcast terminal at the Tower, and reduce wasted scenery rendering. The two removed boxes also lose their colliders; thin wall-mounted supports remain. Baked original rail geometry/off states use asset ancestor `1891ebb4e061971362817832e942ef9fbe05d15a`. Native gate-pass draw calls fall from 14 to 1 for the first gate and 55 to 2 after all gates clear at the fixed review camera. This is not a hosted FPS claim. See `STREET_DEPTH_TERMINAL_PERFORMANCE.md` for implementation, assets, tests, limits and the exact Makko route. Review head/CI belong to the generated receipt. Owner Makko acceptance is pending; earlier entries are history.

**Current approved correction after merged #57.** Base/rollback `f048d229a51b9ecce801cd9d736613491c4ae2f9`; branch `agent/thin-rails-original-traffic`. The owner selected the first/thinner continuous barrier rail, explicitly requires the original cars' speed/height/size/random movement, and restores barely visible roof lines. `docs/source-pack/THIN_RAIL_TRAFFIC_CORRECTION.md` governs the approved eight-issue pass. Do not reinstate #57's 540-unit traffic, street lanes or detached boxes. Preserve working cutscene controls, locked mission/music/boss rules and owner Makko acceptance before merge. The exact revision/PR is in the generated receipt. Older current-status entries below are historical.

**Current owner-approved rebuild after reverted PR #55.** Base/rollback is merged revert #56, `6e3751ba1561d8694e0bdc9a623e74ac6a45624d`; branch `agent/level1-rebuild-reviewed`. The owner rejected #55's substitute cars, barrier look, blue platform edges and levitating ground enemies, then approved the explicitly restated rebuild plan. `docs/source-pack/LEVEL_01_REBUILD_PASS.md` governs: separate cutscene controls, text-free heart repairs, fair body separation, steady Firewall motion, shared sidewalk plane, actual illustrated facade/floor emitter assets, 3D utility props, real building-top routes with selected foot masking, an illustrated bounded rooftop security drone, hazards using the existing car art, and a shared hack keypad. Preserve single jump, 20 mission defeats, eight-second hijack, music and Jammer/boss rules. The new enemy and hazards are expressly approved here; older exploratory-only restrictions below are historical. Publish one draft and keep owner Makko acceptance before merge. Tests/native footage are not hosted playtest evidence. Continue from the newest handoff and exact generated receipt; never reapply all of failed #55.

**Current scoped correction: wall sidewalk/street footprint.** PR #53 is merged at `685d13d4de1d56c8a39a82077460d894144bd091`. The owner says the tall walls are almost right but their bottoms leave the sidewalk open. On `agent/barrier-street-footprint`, extend the existing wall face forward along its perspective, over the raised sidewalk and down the curb into the road. Preserve the tall design, gate/collision/unlock rules, merged walk and hijack/repair work. One focused draft with native before/after review, required validation and owner Makko acceptance before merge. The current continuation and newest source-pack entries supersede older current-status paragraphs below.

**Current owner-approved pass: enemy hijack, repairs and small rooftop connections.** The owner's “Enemy hijack!!!! Fuck yes!” selects H's replacement reward. `docs/source-pack/ENEMY_HIJACK_REPAIR_PASS.md` governs `agent/enemy-hijack-repairs`. The owner merged walk PR #52 during preparation: current main/base is `66c17d1880f5de933e9b928833e5dd2bfff6a817`, whose complete tree equals the original walk head `b1692f47017459011177fb779639682534c862b7`. Preserve the tested hijack work and publish one new draft directly against main; no undo or repeat implementation is needed. H's puzzle-time 40% slowdown stays; success converts one ordinary enemy for eight seconds instead of healing or the old area-stun path. Add the already-agreed two rooftop repairs, one marked carrier and two small supports. This expressly supersedes old H reward locks and the earlier undecided/stun recommendations. Preserve owner Makko review before this new PR merges; the #52 merge does not establish hosted playtest acceptance. Other locked mechanics and art remain.


## Current authority and scope

**Current scoped follow-up after merged #51:** `agent/player-motion-polish`, base/rollback `ea2921960477e38c74740dda378fcb513a8f1cc1`. The owner asks for less fidgety 6 Bit animations and small visual/play improvements. Deliver the diagnosed walk registration/cadence repair using existing complete-body drawings and compact atlas storage. Health pickups, H redesign, extra rooftops, cloud secrets and traffic hazards are newly reopened design proposals; record recommendations without silently implementing them. `CONTINUE_HERE.md` and newest source-pack entries govern. One combined draft; retain owner Makko acceptance before merge. Earlier current-work entries below are historical.

**Current follow-up after merged PR #50.** Base/rollback is `42aebe8c19853da510c385c45606dfd3b4c7973a`; branch `agent/animation-fireball-polish`. Reuse the saved `7f0dd0e` idle/flourish assets, connect them to the active loader with matching boss geometry, and finish the larger fireball presentation while retaining gameplay/timing/damage. `CONTINUE_HERE.md` and the newest source-pack current-state/acceptance entries govern. Publish one combined draft; owner Makko acceptance remains required before merge. Earlier current-work entries below are historical.

**Current review pass after merged PR #48.** Base/rollback is `de9a63ea9311aba23d6a9ad6c3dca3b5e8aa50a5`; branch is `agent/level1-presentation-smoothing-recovery`. Preserve the approved art designs and all gameplay. The scoped presentation corrections are: Jammer sidewalk placement, restrained temporal cleanup of the twelve installed replacement atlases, depth-correct traffic lighting, a separate tutorial-objective lane, a one-time rooftop Studio Cat event away from the Signal Lift, and tall sidewalk-aligned 3D encounter walls. `CONTINUE_HERE.md` and `docs/source-pack/PRESENTATION_SMOOTHING_PASS.md` govern this pass. Publish one draft PR and retain owner Makko acceptance before merge. Older current-work paragraphs below are historical.

Current repair follows merged PR #47 (`8f09568eeb9726f7b80fb43e1ecb3f6e4672bea2`): the owner sees the new background but Makko still renders old character sprites. On `agent/fix-makko-sprite-loading`, fix the active initialization path, bypass the host-owned manifest, replace preloaded old templates and rebind the existing player. Preserve the saved artwork, gameplay and owner Makko review before merge. Do not restart art production. `CONTINUE_HERE.md` is the current handoff; earlier recovery status below is historical.

Read `CONTINUE_HERE.md` first for this continuation. Current recovery integrates the already-approved v5 version 38 work over merged #46 on `agent/finish-model-art-hud`; historical baseline/draft wording below must not restart completed work. The existing locked mechanics and Makko-before-merge requirement remain.

**Current approved implementation: one combined model-art and HUD pass.** The owner's latest “Fuck yeah!!!! Let's make it happen!!!” approves carrying the reviewed artwork and HUD into production. `docs/source-pack/MODEL_ART_HUD_IMPLEMENTATION.md` governs `agent/model-art-hud-integration`, based on merged #45. Finish complete-body sequences against the original pose guides, calibrate all world art, and connect the reviewed HUD to live game state. Existing push/draft authorization and owner Makko acceptance before merge persist. The review-only paragraph below describes the preceding checkpoint; its inactivity status no longer limits this implementation. Do not revive the rejected cutout rig.

**Current owner direction: visibly overhaul the sprite artwork using the actual model, provide examples across the world and redesign the HUD.** The subtle restoration did not meet the requested quality change; cutout animation remains rejected. `docs/source-pack/VISUAL_OVERHAUL_REVIEW.md` governs `agent/visual-overhaul-review`. All four original 6 Bit model PNGs have now been recovered, inspected and bundled. Use their hat, glasses, paint, hair and costume details. New work includes 12 complete hero poses, a 48-frame whole-body headbang trial, eight enemy poses, two city layers, all three vehicle drawings and a three-state HUD preview. These are review assets; active runtime remains merged #45 (`c557c87bb0e04287e6c694d7d6559174d8b65d06`). Extra frames are explicitly permitted for better loops; the prior exact-alpha/no-new-frames limit is superseded. Preserve recognizable original actions and gameplay/event timing, with whole-frame drawing and registration. Do not revive separated-part rigs or the rejected pass's publication request. Earlier Python processing authorization persists. Keep #45's cats, pointer, pulse, varied FX, boss sizing and all merged intro/mechanics. Complete sequences, scenery calibration and runtime HUD integration remain next; one combined eventual review and owner Makko acceptance before merge still apply. Stage C follows this art/HUD work.

**Historical, rejected sprite/scenery replacement direction.** The previous `agent/sprite-upgrade-study` implementation is preserved as provenance in `docs/source-pack/SPRITE_REPLACEMENT_PASS.md` and unused art folders. Keeping 636 frame entries and the original clocks did not preserve the original movement. Its cutout implementation and publication instructions are superseded by the owner correction above; retained scenery candidates are also inactive pending separate review.

**Current work: Studio Cats, authored pointer/pulse assets, chaotic FX and boss sizing after merged PR #44.** Base/rollback is `4b207c5570a6bccd86b95c702c11e1e6606bbf01`. The owner explicitly corrects Studio Rats to cats (slang; never literal rodents), requests a cat asset, reusable Jammer arrow, boss-attack assets, less tame/generic and more varied FX, a slightly larger boss and a larger walk animation. `docs/source-pack/CAT_CHAOS_ASSET_PASS.md` governs this combined pass on `agent/level1-cat-chaos-assets`. This authorizes the specific new art and size tuning; preserve the existing boss design, timing, damage, grounded anchors, intro and ten-item pass. Keep discovery/save IDs compatible. One combined draft with owner Makko review before merge. Stage C follows this newly requested presentation pass. Older current-work sections are historical.

**Current work: all ten Level 1 impact/discovery recommendations, approved by “Alright let's proceed.”** Base/rollback is merged PR #43, `51b65d4cd71d369b05003ddaa83cfe6f88fe348b`. `docs/source-pack/LEVEL_01_IMPACT_PASS.md` preserves the exact numbered scope: camera, contact, attack thresholds, musical scenery, physical scenery, four encounter identities, Jammer/boss payoff, compact predictive HUD, fourth-wall events and optional discoveries. Implement as one combined pass on `agent/level1-impact-discovery`, with combat, scenery and HUD/discovery checkpoints and one draft PR. Preserve the corrected opening and all locked mechanics. Existing push/draft authorization persists; owner Makko acceptance remains required before merge. Older “current work” sections below are historical. Stage C campaign services follow this pass.

**Current work: staged intro cues and screen integration after merged PR #42.** Base/rollback is `f1831f95c187bdd5afd9c8231d2a7a10ac262671`. The owner confirms the images now appear, requests correctly timed dialogue/captions with Space advancing each cue, screen readouts on the illustrated displays, and an anatomical correction to DJ Floppydisc's knob hand. `INTRO_CUE_STAGING.md` governs this combined pass on `agent/intro-cue-staging`. This explicitly authorizes a targeted image edit to page 5; retain the other seven illustrations, scene composition and cast. Preserve the fullscreen recovery, one-context budget, independent S/B holds and existing tutorial/gameplay. Publish one combined draft; owner Makko acceptance remains required before merge. Earlier current-work sections below are historical. HUD/rhythm/attack variety follows intro acceptance.

**Current work: black-screen recovery after merged PR #41.** The verified base is `897b750cf64bafe3d50746cd7c8c19379ef4fbf6`. The owner reports a completely black, unusable intro. `INTRO_FULLSCREEN_RECOVERY.md` records the confirmed fullscreen/hidden-canvas defect, the focused repair on `agent/intro-fullscreen-recovery`, and regression evidence. Preserve #41's artwork, scene-placed dialogue, cached context, independent S/B skip and tutorial continuation. Fullscreen belongs to the shared document root; the intro mounts in the body, never inside the hidden gameplay canvas. The existing push/draft authorization persists; owner Makko acceptance remains required before merge. HUD/rhythm/attack variety remains the next pass. The #40 repair record below is historical.

**Current work: repair the opening after merged PR #40.** Base/rollback is `a747b58411650146bdc003a529d0470167d275db`. The owner reports a canvas-context limit, missing images, dialogue that does not flow into Level 1, and asks for awesome styled dialogue placed on the images according to the action. INTRO_REPAIR.md records this one combined repair on `agent/intro-makko-repair`: cached context, verified pinned delivery of the existing eight model-based images with bounded bundled fallback, scene-authored comic balloons/comms cards, and the actual tutorial rewritten as the continuing crew channel with objective-ID progression. INTRO_TO_LEVEL_01.md contains the exact street script. Preserve independent S/B skip, image/model authority, gameplay and existing lore saves. Exact publication/verification belongs to the source manifest; owner Makko review before merge remains required. HUD/rhythm/attack variety follows this repair, then Stage C. Do not regenerate the artwork, restart broad audits, split this into tiny PRs or claim PR #40's merge meant its opening worked.

The latest owner cast correction includes Cliff, Sheila, Studio Rats, WittyF0x, Kave, SKELLA and Dr3wBaby; excludes Mind Fanatic/M1ND_FANATIC, Emerald/EMRLD, Crowline and W3T TDDY. Retire the old W3T TDDY route dependency. Only the original four remain playable. Sheila remains a silhouette when depicted.

The owner reopened intro/story development. This supersedes the old absolute prohibition on reconsidering the prologue **for the approved design/prototype work**. The concrete replacement opening is now written and implemented for review in INTRO_OVERHAUL.md; the previous absolute intro-copy lock does not prohibit that authorized correction. Existing art assets, title and working gameplay remain the baseline. The owner subsequently requested the intro images and supplied the current character models. INTRO_ART_DIRECTION.md records this targeted eight-scene production and supersedes the earlier existing-art restriction for the opening. Do not infer a new 9 Bit reveal or a wider campaign redraw. Specific new scenes in the map are working proposals. Standalone migration is deferred; mobile remains a bounded feasibility question.

## Historical scope records

The milestone descriptions below preserve earlier selections. Their old “current,” “next,” draft and acceptance wording is historical; the current plan and generated revision status take precedence. Do not redo completed PRs #27–#37 or substitute an earlier numbered selection.

Newest owner-approved work: `docs/source-pack/LORE_ARCHIVE_PASS.md`, based on merged PR #36 (`58b6abe6179ce6b7e8996c4d4099c9eff674f35f`). The owner approved the pause-menu archive and then explicitly requested implementing and improving the actual unlocked lore using BARCODE and 6 Bit context. Three authored records now replace the provisional copy, share one catalog with collection notices, and remain readable from persisted IDs. This authorizes new in-game writing based on established canon; it does not settle later campaign revelations. Preserve save compatibility, the original four, the locked prologue and secret collection purpose. One combined draft and the same maintained v5 pack; owner Makko acceptance before merge.

The following scopes are historical milestones; the newest section above controls the current pass.

Newest owner-approved work: `docs/source-pack/DISCOVERY_PASS.md`, based on merged PR #35. Implement the two selected follow-ons (rhythm target brackets, animated existing traffic) together with the reported Lost Data availability/persistence and rooftop Signal Amp repairs. Collection contributes to a secret eventual ending test; preserve durable facts without inventing thresholds or exposing that purpose in player-facing text. Migration is deferred. The combined implementation and required regression checks are complete; exact publication status is in the source manifest. One combined draft PR and maintained v5 pack; Makko acceptance remains required.

Historical polish checkpoint (now merged as PR #35): all approved polish items 1–9 plus particle/logging cleanup are implemented and validated on `agent/level1-combined-polish`, as one combined draft review. Three implementation checkpoints and their test evidence are preserved; the generated source manifest/receipt identifies exact publication status, head and PR URL. Next: owner Makko acceptance using `docs/source-pack/PR_DESCRIPTION.md` and ACCEPTANCE, then merge and re-import the actual main merge SHA. Do not redo implementation or split this pass into separate PRs. Keep the same v5 archive updated.

September 12 current approval: the owner agreed to the latest recommendation and said "lock it in", update/maintain the source pack and continue. Implement **items 1–9 plus particle/logging cleanup as one combined pass**, exactly as mapped in `docs/source-pack/POLISH_PASS.md`, based on merged PR #34 (`85a0b32c530d9fc04fab91ef4e3d18ef88ee8249`). This scope supersedes earlier numbered selections below. Prepare one combined draft PR; retain owner Makko acceptance before merge. Items 10–12 (traffic animation, target previews, authored persistent lore archive) are follow-ons, not part of this pass. Preserve the Makko getter-only animation and audio repairs.

September 12 follow-up: PR #33 is merged. The owner reports improved effects/flow but a stuck landing jump, intermittent enemy clipping/unfair contact and missing SFX, including a getter-only `currentFrame` error. Current scope is the combined repair in `docs/source-pack/MAKKO_HEALTH_CHECK.md`. Preserve the successful responsive/visual work below; verify Makko's actual animation boundary and restore audio. Existing push/draft authorization persists; owner Makko acceptance is required before this repair merges.

Current follow-up: the responsive combat pass based on merged PR #32. Read `docs/source-pack/RESPONSIVE_COMBAT_PASS.md` for the selected 1–8 scope plus stronger visible rhythm/scenery feedback. This explicitly authorizes stable body geometry and swept ordinary stomps, input timestamps, frame pacing, attack/contact/combo FX, phase-driven animation and bounded action sounds. Older selections below are historical; do not substitute their numbering. One combined PR, preserving mission/art/music/boss balance. Makko acceptance remains required.

The owner's newest direct instruction controls design. `docs/source-pack/DECISION_REGISTER.md` records the retained decisions and the September 11, 2026 approval of the next development direction. Source Pack v5 supersedes conflicting v2–v4 instructions. Git history and the archive's generated manifest establish implementation state, not approval of accidental behavior.

The owner approved progressing from the existing Level 1 boss entrance to a finishable encounter, preserving working mechanics, and regularly updating the source ZIP. The active milestone is Level 1 boss combat, a quick retry checkpoint, and a real completion endpoint. Later level names, character assignments, boss identities, exact dialogue and ending resolution remain provisional where marked.

## Locked content and gameplay

- Playable characters only: 6 Bit, DJ Floppydisc, Cache Back, and Mac Modem. Cameos/collaborators are never player-controlled.
- Seven major levels use distinct 1990s Sega Genesis/Super Nintendo mechanical identities inside a simulation. Preserve the required Contra, Pokémon, DOOM, Rad Racer, and Tetris/Dr. Mario directions.
- 6 Bit base movement remains left/right and one jump; no double-jump, slide, dash or Down-key fast-fall. Opposite movement directions cancel; releasing either resumes the held direction.
- An active tutorial owns Space exclusively; that press cannot also jump.
- `R` is actual Rhythm Combat Mode. Down Arrow damage requires active Rhythm Combat Mode and a successful rhythm judgment. Passive top-down landing stomp remains intentional and lethal against ordinary enemies.
- H and R retain their tutorial access locks. The rhythm/audio transport and timing state continue in the background even while the mode is hidden, locked or inactive; normal pause remains a separate lifecycle state.
- `H` starts the existing short hack puzzle under its tutorial/grounded access rules. The latest approved hijack pass replaces the old one-health-bar reward as specified above.
- Tutorial and pre-encounter boundaries must prevent crossing a future closed gate. Boss world position must not be tied to cinematic camera motion; animation scale/feet must remain consistent. Jammer placement must clear the lift plus its full attack range. These are September 11 owner playtest corrections.
- Preserve the two-hit rhythm-powered lift, authored rooftops, and the currently approved stable body/swept-foot geometry. Backend ownership changes are not permission to remove mechanics.
- Level 1 requires 20 post-tutorial mission defeats through four authored encounter groups. Tutorial kills do not count.
- At 20 mission defeats the Broadcast Jammer appears once in the widened central band, clear of the lift approach. It has 16 health and accepts one damage per successful rhythm attack; H and passive stomp do not damage it. It remains an environmental object owned by `BARCODE.JammerEnvironment`, not an ordinary enemy.
- Jammer destruction immediately ends active Rhythm Combat Mode; it cannot reactivate during the cinematic or automatically resume at handoff. Preserve the background rhythm/music clock.
- Jammer destruction leads through the existing freeze, purge, camera pan, boss entrance/flourish and control handoff into the boss encounter. Reuse that presentation; do not casually rename its boss or change its identity.
- Each level selects its own song/profile. Level 1's compatibility timing and source names are never a campaign fallback. Other genres choose their own musical interaction and need not gate their ordinary inputs by rhythm.
- Lore: 28 one-time pieces distributed `3 / 4 / 5 / 4 / 5 / 4 / 3`; deterministic IDs, authored purposes and eventual persistent collection. Random legacy prose is not approved canon.
- 9 Bit is the byproduct of negative parts separated from 6 Bit. His future reveal and the revised intro must be developed together; the title/tutorial already disclose his name/presence. Do not invent a new prologue appearance as an incidental change.
- The actual opening now uses the reviewable script in INTRO_OVERHAUL.md and eight new scene illustrations governed by the supplied models in INTRO_ART_DIRECTION.md. Only 6 Bit, Cache Back, Cliff, DJ Floppydisc and Mac Modem may be visibly identifiable; other intro characters remain offscreen/obscured. Cliff is a brief cameo, not a fifth player. The owner explicitly requested this rewrite; exact presentation remains subject to Makko review. Never call 6 Bit/the player “the virus.” Mac Modem's established metaphor is character-specific.
- *Observer Not Found* is separate. City Scrambler, obsolete boss hooks and legacy README claims supply no automatic future-design authority.

## Current musical combat pass

The September 11 owner approved combined recommendations 1–5, 8 and 9 after reporting that PR #28 was substantially better but the boss was too hard and could be won through endless head bouncing. Implement fair musical boss windows, separated difficulty escalation, safe outward rebounds requiring a landing to rearm stomp counters, authored enemy commitments and clear combat/rhythm feedback. Preserve ordinary lethal stomps and all locked mechanics. Exact timings are provisional; Makko-before-merge remains required. Read the top current sections of source-pack CURRENT_STATE and ACCEPTANCE before historical entries. Standalone migration and the other optional ideas belong to later milestones.

## Engineering and validation

Current authorized follow-up: after PR #30 the owner approved the recommended animation/rhythm/hack/effects pass. Rhythm Mode now uses grounded, stationary entry and explicit R/Escape exit for traversal; forced airborne motion ends the stance, the lift can carry it, and background timing continues. Preserve ordinary single-jump movement outside the stance, existing hack rules/rewards, sprite calibration and the Jammer mode-exit repair. Read the newest source-pack current-state and acceptance sections before historical reports. This implementation is awaiting Makko acceptance.

- `index.html` remains the browser entrypoint. Keep Makko compatibility and all JavaScript syntax valid, including files outside the active script graph.
- Do not introduce a bundler/ES-module rewrite or replace asset URLs without a concrete scoped reason. Validation remains dependency-free unless a later task approves a dependency.
- Use existing lifecycle and input owners. New level timers, listeners, animation loops and audio sources must be disposed on exit; avoid stacking future genres onto Level 1 globals.
- Use targeted checks against production code for consequential behavior. The repository already includes dependency-free Node VM harnesses; they may validate deterministic state, combat and lifecycle logic with explicit host stubs. They do not prove Makko rendering, audio synchronization or gameplay feel. Do not create a parallel imitation of the implementation to obtain a passing result.
- The PR-001 documentation-only rule and its static-only validation restriction were scoped to that historical PR. They are not current prohibitions on the owner-authorized implementation milestone or the later established VM harnesses. Preserve the owner/Makko merge gate below.
- Do not make tests require obsolete documentation phrases or reduce existing assertions to conceal a regression.
- Do not regenerate the old baseline simply to make a failing check pass; first explain and scope the intentional change.

## Verification and owner handoff

Run `npm test` and `npm run check:syntax:all` for the implementation milestone. Use the focused boss/mission harnesses to resolve specific logic risks. Additional audit commands are available in `package.json`; do not repeat every audit without a reason.

The owner must test Makko import/open, title/prologue presentation, movement/contact, lift, rhythm/hack, camera, sprites, audio, boss win/loss/retry and restart before merge. Automated checks do not replace this gate. The current user instruction authorizes implementation and preparation; it does not claim this new build has passed Makko.

Report exact base/head SHAs, changed behavior, tests with limits, asset changes, known debt, rollback and the next milestone. Update `docs/source-pack/CURRENT_STATE.md`, `CHANGELOG.md`, `ACCEPTANCE.md` and the generated source archive at each completed milestone/merge as specified in `docs/source-pack/UPDATE_PROTOCOL.md`. Mark unmerged work and untested gameplay honestly.
