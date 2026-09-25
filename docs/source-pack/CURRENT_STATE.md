# Current State

## September 25 — illustrated traffic and layered side-road events

After merged #119, the next visual pass adds painted audit/sweeper vehicles,
the cutting signal trike and a draftable night shuttle. Market and relay-depot
blocks run diagonally along both sides over a world-fixed, repeating muted
frontage and continuous service pavement. Pedestrians, lamps, event plinths,
tile joints and the parapet share the road's depth curve; the near end grows
as it approaches. Seven scripted native chapters were inspected, including
early/late frames of each side. The production proof drives both four-pad
runs without damage and checks changed hazard behavior and synchronized
roadside approach. See `CACHE_ROAD_VISUAL_WORLD.md` and the first acceptance
route. Owner Makko motion and audio judgment is still pending. Song source,
pad locations, controls, saves, final Echo and campaign award boundary remain.

## September 25 — raised turn-wheel contact follow-up

Automated review of merged #118 found that its generic turn contact height
left the raised outer front tire shadow too low on `cacheCarRight`, with the
mirrored turn also needing separate rear/front heights. The selected wheel
mask and shadow now follow each pose's opaque tire bounds. A native Turbo
comparison and turn-specific focused assertions cover both steering sides;
the rest of #118's road, ship, music and gameplay state is unchanged. See
`CACHE_ROAD_VISUAL_CONTACT.md` for the measured positions and review image.

## September 25 — Cache Road visual contact review

Starting from merged #117 (`8923d3eea3fc5fe8cd8944ef50f3578ccaf0d785`),
this focused pass makes the continuous blacktop texture travel toward the
driver, turns the gray flying ships to match their flight, and holds all
decorative ship motion in Reduced Motion. Recovered Cache Back, freight and
other painted traffic keep their tire pixels and new contact shadows at each
art-specific wheel line while the chassis bounces and impacts. A native
six-scene production draw and enlarged before/after contact image were
inspected; the focused proof checks texture direction, atlas facing, wheel
shadow positions and Reduced Motion. Music, pads, controls, traffic rules,
saves and campaign awards do not change. The illustrated scan/sweeper and
additional traffic, sidewalks/pedestrians/varied roadside scenes, then
adrenaline balance remain open. See `CACHE_ROAD_VISUAL_CONTACT.md` and the
cohesion audit. Makko play has not judged this revision yet.

## September 24 — repeated Cache Road drives and caught-pad correction

Merged main #116 is `5c246b217397848b6dc8f24b5b1d20b94890ee79`.
Four scripted production-input runs and native road frames exposed a pad
vanishing early after a catch, the low-speed tape-end trap and overly sustained
four-part stacks under an ideal pad-seeking route. This review branch keeps a
caught marking drawn until it passes the car and shows armed Push/Brace state
in the compact top HUD. Music timing, eight/sixteen-bar durations, traffic,
assets, saves and campaign awards are unchanged. The full results, prior
seven-part plan and defense/offense/traffic/environment/song/lane power-up
backlog are in `CACHE_ROAD_COHESION_AUDIT.md`. Automated driving and native
draws cannot establish Makko sound, input feel or owner acceptance.

## September 24 — grounded Cache Road pads (review branch)

Owner play of merged #115 found the rings too fast, too frequent, distracting
and visibly over traffic. The current branch replaces the seven-per-four-bar
song stream with two four-pad road runs per lap. The mint, low-profile pads
stay at fixed world positions, follow the blacktop bend, and draw beneath
cars. They appear in authored traffic gaps; the HUD names only a pad close
enough to see. A press on a song beat in the pad's lane and crossing window
earns one of the same four actions. Misses remain harmless. Eight-bar base
and sixteen-bar consecutive same-run holds are a trial balance for the wider
spacing. The real five-track mix, lane names, road art, saves, collision and
exit are unchanged; the full-adrenaline crew vocal still lacks a recording.

Focused tests steer through both runs to x4 without damage and verify draw
order and a missed pad. A native production-draw contact sheet was inspected
at eight positions; its timing and visual quality require Makko play. Full
suite, syntax and CI outcomes belong to the final revision receipt. The
owner must judge pace, visibility, timing and music duration in Makko.

## September 24 — Cache Road safe pulse prototype (PR review)

Based on merged art-loader repair `950ce07`. Seven repeatable face-button
pulses appear per four-bar phrase, rotate across the four established lanes,
and arrive on the 128 BPM transport. A matching timed press in the marked
lane earns four bars of its part; consecutive catches hold eight. The four
buttons supply Surge, Push, Brace and Refill. Left/right still steers,
up/down changes speed and bonuses, and LB/RB spend Turbo/Echo on controller.
The safe mint rings are drawn above the road with their own symbol and text;
traffic stays solid. Unprotected contact still cuts to drums-only recovery.
The existing Pressure plus four lane MP3s, art, checkpoints, final exit and
campaign no-award boundary remain. The full-adrenaline state exposes a
future vocal gate, but no crew-vocal MP3 exists in this source.

The focused harness reaches four parts through real steering and traffic,
checks all inputs and hit outcomes, and traverses the full song/old saves.
`npm test` and `npm run check:syntax:all` pass. Chromium was unavailable
for the optional browser decoder test. Neither native drawing nor local VM
checks prove Makko controller feel, audio timing or visual readability.
Review `CACHE_ROAD_PULSE_ACTIONS.md` and the acceptance route before merging.

## September 24 — Cache Road art delivery repair (PR review)

The owner reports seeing the old graphics after the art PRs merged. The 19
Cache Road image files are present at merged commit `37db983`, but their
runtime entries requested only relative paths. Makko imports may omit binary
files, leaving the game to draw its older fallback vehicles and scenery.
Those entries now request the published images from that fixed revision and
fall back to local files if necessary. No artwork or animation was redrawn.
All 19 published URLs respond, and local loader checks cover both paths.
The cause in the owner's particular Makko import and the visible result still
need a fresh import and playtest; this PR does not establish that by itself.

## September 24 — Cache Road layered art and sky (PR review)

This pass responds to the owner's latest visual review. The Level 1 blacktop
is quieter and samples adjoining rows with a blended wrap; artificial wet
seams and most transverse grid lines are gone. The city now has separate
small distant buildings, recovered far skyline and new industrial facades,
with a lower road horizon so the sky is visible. Its color and moving veils
respond to the song beat, active part count and Turbo. Two animated Level 1
ship models cross above it at different apparent depths and angles. New
continuous wall art and cantilever lamps follow the road bend. The left/right
turn poses are swapped, the mirror face moves farther into view without a
scale change, and hit/near-pass/Turbo have dirty spray and soot instead of
clean beam effects. The car, truck, tire and mirror motion from the previous
local review remains. The twelve-second reel is a scripted production draw;
Makko speed, controller feel and final art judgment remain owner review after
the PR. Gameplay, music, saves and the four lane names are unchanged.

## September 24 — revised Cache Road motion and parallax (local review)

The owner rejected the first rebuilt motion preview as inferior to the saved
parallax video. The renderer now moves the far city, lower rooftops, nearby
silhouettes, road-depth service decks and lamps, wet surface, seams and lane
studs on distinct paths. Recovered wheels stay at the road while the car and
freight chassis ride their shocks; steering reveals a turning side rim, and
the car throws wet spray. The collision uses its saved pose and a decaying
body jolt. The scripted native reel includes lane changes and six event
states, with close crops following the car and freight. This remains an art
review from production draw code, not a playable Makko capture. No PR yet.

## September 24 — Cache Road art recovery in local review

The saved transparent car poses, collision pose, freight, courier, barricade,
rival and skyline have been recovered into `assets/cache-road/`. The playable
road renderer now uses those assets and Level 1's rain-blacktop texture; car
shocks, more pronounced freight bounce, rotating wheel detail, near-pass
streaks and the crash jolt are driven by current road state. The earlier
animation source itself was not recovered, so these motions have been rebuilt
in code. The native renderer in `review-cache-road-mirror/` now shows one
production draw with the car, world and mirror together. It is scripted state
review, not a Makko capture. No PR has been made and owner motion approval is
pending.

## September 24 — rearview reflection layout (local art review)

Cache Back's partial face lives inside the mirror glass, looking straight ahead in ordinary driving and glancing back on a hit. Six expressions react to choice, Turbo/Zone, close pass, hit and low signal. The objective panel only appears with a live opening cue. The earlier HUD-only review also used a composite with the saved road video. That composite is historical; the newer art recovery entry above describes the production renderer with all three pieces together. See `CACHE_ROAD_MIRROR_ART.md`.

## September 24 — in-drive Cache Road opening

The proof now states the original-recording delivery goal in the first stretch and offers short contextual lane hold, E/RB, Turbo and Echo instructions above the horizon. The first freight, paired block and audit supply their actual driving situations; a successful action advances its cue without interrupting play. The first marker refills Echo and validates as a version-4 Continue save, so the audit has a repeatable decoy opportunity; its Echo lasts six seconds like the final exit. A production route clears the left gap and redirects the audit, with native layout frames. All four lane names, the five MP3s, next-bar music choices, 100-bar song, old saves, final exit and no-award boundary remain. The owner still needs to judge cue timing, clarity and controller/music feel in merged Makko. See `CACHE_ROAD_AUTHORED_OPENING.md` and the first acceptance route.

## September 24 — predictable choices and separate driving bonuses

The owner's playtest of merged #109 found traffic-gated parts random and hard to line up, with near misses inconsistent. A centered half-second hold now visibly chooses one lane's part for the next bar; a later hold replaces it, and a dodge does not cancel it. The chosen part enters on the song clock for the current four-bar section, at most one newly chosen part per bar. E/RB still adds the present remainder and next four once per section. Passes and close cuts only pay score and abilities; adjacent passes allow ordinary steering drift and report a near miss. Zone can start when the chosen part enters at a section boundary. Hit dropout and drums-only recovery, five MP3s, lane names, full song, Echo exit and saves remain. This is verified in local production logic; merged Makko music, timing and controller feel are still untested. See `CACHE_ROAD_PREDICTABLE_MUSIC.md` and the first acceptance route. Older entries are historical.

## September 24 — driving-earned parts and a clear hit

The owner confirms that the all-lane correction made the game better but x3/x4 remain routine and a hit sounds like the same music at a lower level. The free hold and multi-lane RB rule allowed four parts within a few seconds. The review rule now makes a half-second hold prepare and preview a lane, a clean traffic pass carry it through the current section, a tight escape carry it through the next four bars, and E/RB seal current plus next once per four-bar section. A hit breaks the music briefly, then leaves drums without the quiet background beds until the player earns a new part. All five unchanged MP3s remain in sync and all four lanes remain available throughout the song. A production steering route reaches x4 without invulnerability; a safe lane sweep does not. This is a playtest hypothesis for merged Makko and a physical controller, not a claim of accepted feel. See `CACHE_ROAD_DRIVING_MUSIC.md` and the newest `ACCEPTANCE.md` route. The free-lock descriptions below are historical.

## September 24 — all four recorded lanes can lock

The owner found lanes refusing to lock. The hard-coded mask treated verse A Breakaway/Undercurrent as absent. Decoding the unchanged owner MP3s confirms both contain audio during verse A: approximately −43 and −30 dBFS RMS respectively in the first verse's bars 5–12. Breakaway is much softer than its verse B part (about −20 dBFS), but it is not missing. The road and music director now accept all four lane captures throughout the 100-bar song, including an RB capture at chorus bar 28 into the following verse A. The road no longer promises a false later entrance. Genuine quiet passages retain their original levels. The owner has also reported that capturing every available lane feels too easy; this correction fixes the false gate, not that balance judgment. Makko sound and difficulty remain to be assessed.

## September 24 — Zone review corrections (follow-up)

The merged #106 build establishes free half-second next-four-bar captures, RB current-plus-next when recorded, and a separate faster four-bar Zone. Review identified three clarity/skill-credit defects. The follow-up updates both keyboard/controller pause instructions, reports only phrases RB actually added when a stem disappears at a section boundary, and settles an entire paired gate before paying near-miss rewards so a collision cannot award Zone, Echo, score or Turbo from its adjacent vehicles. A hit also resets near-miss progress. The current musical timing, projected road paint, five owner MP3s, full song and campaign boundaries remain. Production tests cover both orders of a paired gate hit and an unavailable next phrase; owner Makko sound and feel remain pending. See `CACHE_ROAD_ZONE.md`.

## September 24 — Cache Road Zone and immediate RB (review)

The merged #105 ink gate stopped music stacking at arbitrary times. This pass makes an aligned next-four-bar capture free after a 0.5-second centered lane hold. E/RB immediately adds the current recorded remainder and the next aligned four bars, with repeated taps in one lane adding nothing. The old 1.5-second automatic eight-bar extension is gone. The road remains one projected paint surface; the compact legend shows queued starts and sparse-stem entrance, and the header explains both inputs. Skill now fills a separate Zone meter: close cuts +70, ordinary near misses +8, drafts +20 and clean bars +1. With 60 available when a queued phrase starts, its four bars drive toward 64 rather than 54 and refund 1.5 seconds; Turbo still reaches 75. Multiple queued lanes activate together for one Zone charge. A collision cuts the stack and Zone while keeping the road clear. A production steering simulation reaches x4 without meter, checks RB, Zone, traffic, full song/exit/saves; eleven native frames show current/next paint and active Zone. Makko balance, controller and sound remain owner review after merge. See `CACHE_ROAD_ZONE.md`. The paid Cutline entry below is historical.

## September 24 — Cache Road Cutline (review)

After the owner tested merged #104, the free 0.5-second automatic locks and duplicated road overlays were too easy and visually detached. This pass keeps automatic next-phrase locks, now costing 60% ink; the 1.5-second eight-bar carry costs 40% more. A close escape from an actual threatened lane supplies 70% ink and a cut streak bonus; merely passing adjacent supplies 8%. Paired and three-wide traffic gates rotate open routes, Turbo protects for a short burst, and Echo redirects audits as well as the final rival. Four-bar/section paint now prints progressively in a single road projection under traffic; the floating lower cards, full-lane tint and detached road-marker box are gone. Messages stay in the header, and a collision still produces its audible stumble without obstructing the road. The five owner MP3s, 100-bar song, Level 1/3 boundaries, old saves and no Level 2 award remain. Production steering and camping simulations, Chromium and nine native frames support this review; Makko difficulty, fun, actual controller feel and listening are pending after merge. See `CACHE_ROAD_CUTLINE.md`. The free-lock design below is historical.

## September 24 — phrase commit system (review)

The owner wants a coherent **automatic** lane-lock system tied to the supplied song diagram and a clear collision road. Settling for 0.5 seconds automatically arms the next aligned four-bar phrase at no cost and previews the current recorded part on the next beat; staying centered for 1.5 seconds carries the plan to eight bars for 25% meter if the recording exists. Moving to other lanes builds x4; camping cannot automatically rearm every phrase. The lane surface itself lights for each armed or active bar across the projected road, with song-section boundaries, labels and exact bar ranges in the HUD. Traffic remains above the surface. The collision keeps its audible cut/warp and speed/time/integrity consequence, clears armed/active parts and shows no road-covering popup or hit text. Production steering reaches x4 before Verse B, Chromium decodes all five existing MP3s and native frames show the road. Makko balance, listening and controller feel remain pending after merge. See `CACHE_ROAD_SECTION_LOCK.md`. The two-bar catches and manual seals below are historical.

## September 23 — Stack the Bars and collision stumble (review)

The four-bar vote has become a 0.5-second lane hold followed by a next-beat two-bar catch. E/RB deliberately seals a centered lane for four bars at 50% meter cost; another caught part stacks up to x4 while Pressure drums and quieter Drive/Flow beds keep the song moving. The road and HUD show a four-bar strip, captured lane cells, score and live multiplier; sparse recorded parts show their entrance instead of promising a silent catch. Clean bars and near misses score/refill the seal meter. Traffic breaks the active stack and produces a 0.62-second music-bus stutter with a pitched digital tear without seeking or stopping the five MP3s. V4 checkpoints carry score, refund old indefinite locks and reset timed captures. The full song, final Echo exit, old saves and no-award boundaries remain. Production, Chromium and native-frame checks support review; owner Makko sound/physical-controller judgment is pending. See `CACHE_ROAD_STACK_THE_BARS.md`. The four-bar vote entry below is historical.

## September 23 — complete Cache Road song (PR #102 review)

Five owner-supplied MP3s now make one 100-bar, approximately 187.5-second song: four-bar intro, then four 16-bar verses and four eight-bar choruses. Pressure (drums) stays on; the four road bands are Drive (bass), Flow and Breakaway (the two harmony parts), and Undercurrent (FX). The intro has Pressure and Drive; normal verses and choruses carry at least one additional recorded part. Steering and locks vote for the next four-bar phrase, with a 0.38-second gain fade at its boundary. All five sources retain one clock and the missing-import URL points to immutable asset commit `b0b26df3ca3289a24163f6b198072ea0de1429af`. The chase reaches chorus four and ends at the final Echo exit; new verse checkpoints and old-save migration preserve the Level 1 handoff, Level 3 preview and no-award boundary. The future crew-vocal reward is still awaiting an owner asset. Local production checks and the full repository suite pass; real Chromium CI and owner Makko listening/controller feel remain separate gates. See `CACHE_ROAD_FULL_SONG_ARRANGEMENT.md` and the newest acceptance route. The four-stem current-state entries below are historical.

## September 23 — steady Cache Road arrangement (review)

The owner reports PR #100's continuous lane fades sound like music cutting out and returning. The real Bass file has about 0.60 RMS, Drums 0.16, Harmony 0.09 and FX 0.05; FX is nearly silent through much of the opening. The previous lane gains therefore made the FX lane much quieter regardless of crossfade shape. This revision holds Bass/Drums/FX and a small Harmony presence in every lane, then blends lane accents for Bass, Drums, Harmony, or the temporary Harmony/FX combination. Earned locks retain accents, capped when two accents share one source. The four original MP3s, shared clock, saves, title/Level 1 audio and Level 3 preview remain unchanged. The new fourth instrumental and performance vocal are still absent. A 32-second PCM simulation of the actual stems with eight lane positions reduced the ratio of loudest to quietest four-second median RMS from 7.21 to 1.17; this is a level measurement, not a Makko listening pass. Hosted musical feel remains for the owner after merge.

## September 23 — FX bed and musical lane handoffs

The owner confirms PR #98's merged revision `ae1be4a1ee868f0307daa0e8e47f7a100a1510e1` plays the supplied MP3s in Makko. Steering between lanes still sounds abrupt. This pass keeps the same four files and shared start/loop, holds FX underneath every lane, keeps a very quiet drum groove because the current FX file drops near silence during the opening, and makes the next-beat transition slower on exit than entry. A brief lane crossing does not audition every intermediate part. The fourth lane temporarily raises FX above its bed level; the owner is creating another instrumental/Harmony part for that lane. A separate no-lane gang vocal earned through strong driving is planned after its real audio is supplied. Neither new stem nor vocal reward is present in this revision. See `CACHE_ROAD_FX_BED_PASS.md` and the newest acceptance route. The owner needs this PR **merged before** testing the revised mix in Makko; local browser output is not a listening verdict.

## September 23 — second Makko audio failure on draft #97

The owner confirms title music works but Cache Road remains silent after the GET-only repair. PR #97 merged at `df02c8964d34b2cfa13a5c4f6d3495395b39aba5` while this follow-up was prepared; its tree matches the tested local parent. The old loader generated generic 60-second buffers for failed owner MP3 requests, then reported successful preparation; the road only showed a degraded-audio warning. This revision requires all four actual 187.5-second stems, tries the identical published #96 assets when local preview binaries are unavailable, and returns to the intermission with an explicit error if neither copy loads. A focused production test covers missing local files, published copies, complete failure and retry. A Chromium test decodes and mixes actual MP3s when the local host deliberately returns 404; its running audio graph has nonzero output. The fixed public copy also decoded through a direct Chromium fetch from this workspace, with the workspace proxy certificate exception. Makko's asset responses and audible output remain unknown until the owner imports this new draft; preserve the canvas correction, title and Level 1 music, saves and no Bass/Level 2 clear. See `CACHE_ROAD_AUDIO_LOAD_REPAIR.md` and the current acceptance route.

## September 23 — PR #96 failed host review: MP3 playback and canvas context correction

The owner reports that the four MP3s in PR #96 did not work in Makko and supplied two `Canvas context creation limit exceeded` runtime errors. #96 subsequently merged at `c2ca847c63c3b8b70ba178dd02fda0ad8ab4f508`; this correction is a new review branch based on that merge. Cache Road's frame loop called `gameCanvas.getContext('2d')` every frame; the renderer also probed another canvas on failure and could retry an optional CRT tile every frame. The current correction reuses one game context across road, Level 3 and difficulty frames, avoids repetitive reset on unrelated draw errors, and bounds optional canvas creation. The music loader now performs one GET per asset without requiring a successful HEAD first. An actual Chromium test with a HEAD-rejecting asset server and a context-call guard draws 600 frames with one main-canvas context acquisition, decodes four 187.5-second shipped MP3s and starts them together with a nonzero selected lane. The prior Makko result remains **failed** until the owner imports and tests this revision. The missed-exit fix, saves, Level 1 return, Level 3 test and no Bass/Level 2 clear remain intact. See `CACHE_LINE_MP3_STEMS.md` and the current acceptance route.

## September 23 — Cache Line owner MP3 stems and missed-exit retry (review draft)

The owner approved publishing the missed-exit correction and supplied four aligned WAV parts, then requested MP3 conversion for load time. This review branch now includes four 160 kbps MP3s (Bass, Drums, Harmony, FX), each 187.5 seconds of gapless decoded audio, in place of the five generated 16-second WAVs. The four assets total 15.0 MB rather than 132.3 MB of supplied WAVs; fetch/decode starts together before one synchronized playback start. A provisional 128 BPM grid and balanced lane gains support steering/locks. The automatic missed-exit jump remains fixed. See `CACHE_LINE_MP3_STEMS.md`, `CACHE_LINE_GATE_RETRY_FIX.md` and the newest acceptance route. Makko browser audio, physical controller, seams, load and feel remain owner review; there is no Bass award or Level 2 clear.

## September 23 — initial missed-exit retry correction (historical within this draft)

PR #95 is merged on main at `2cd9d40a44b6c91abc36c3d6d40a766dc9879c0f`. The owner says the new chase is better but seems to loop or jerk backward near the end. A failed Echo split did automatically set progress from the original exit back to 1910 with no result; a 2.7-second Echo also expired before a normal drive from the displayed exit cue. This review branch stops at the missed exit with a reason and explicit retry from the saved Mirror Viaduct marker, and gives an Echo sent in the final approach six seconds. No hidden backward motion occurs while driving. Temporary music, #95 speed/art, v1/v2 checkpoint compatibility, Level 1 return, separate Level 3 proof and no Bass/Level 2 completion remain. See `CACHE_LINE_GATE_RETRY_FIX.md` and the newest acceptance route. Hosted Makko, controller and feel remain unverified for this change.

## September 23 — Cache Line visual and pace follow-up (merged #95; historical)

PR #94 merged on main at `0852ff0bf23d5ae52816f59f7131db93c0741777`. The owner's next playtest found the chase visually crude and slow. This draft raises cruising/boost pace and steering response, adds more frequent road/shoulder motion cues, distinct silhouettes for Cache, Echo, traffic and Clean Copy, clearer hazard/exit warnings, section color and a scan-friendly speed/window/integrity/ability/mix HUD. The temporary code-native art remains a legibility pass, not authored vehicle/city art. The same five temporary WAVs, save/progression boundary and no Bass/Level 2 clear remain. See `CACHE_LINE_VISUAL_PACING_PASS.md` and the newest acceptance route. Makko/controller/feel review is pending; the values are provisional.

## September 23 — revised Cache Line chase slice (merged #94; historical)

The owner found the first Level 2 lane runner too basic and accepted the `Original Master` chase direction for a focused proof. The updated draft tests continuous steering, auto-acceleration/braking, corner pressure, timed road markers, freight drafts and other traffic, earned three-part music locks, Buffer Echo and a committed Clean Copy rival/marked original exit. V1 proof checkpoints migrate; v2 saves retain speed and ability state. Generated 120 BPM parts and procedural canvas vehicles remain temporary; the direct-path story is only a result-card hint, not an authored comparison/cutscene. There is no Bass award or durable Level 2 clear. See `CACHE_LINE_BLUEPRINT.md`, `CACHE_LINE_CHASE_SLICE.md` and the newest `ACCEPTANCE.md`. Native frames and automated logic checks cannot settle Makko, controller, sound or fun. The first proof entry below is historical.

## September 23 — Cache Back road and musical-lane proof

Branch `agent/cache-road-music-proof` adds a provisional Level 2 route from the saved Level 1 handoff. Four lane-specific compatible parts, a quiet carrier and two persistent locks let Cache build a short arrangement while dodging road hazards and choosing the authentic tape at a delivery gate. The five locally generated WAVs start on one profile clock; gains change on beats without source restarts. Dash/near misses, two checkpoints, pause, title Continue and Level 1 return make this a playable vertical slice. The old Level 3 test remains a labeled alternate route. No Bass, Level 2 completion, lore or authored music/cutscene is added. `CACHE_ROAD_MUSIC_PROOF.md` has the exact controls, temporary assets and review route. The full automated suite passes; hosted Makko, physical controller, audio and gameplay feel remain owner review. Base is merged #92 (`45a742b4b3bdb765f60ce2b5539658f7fcd06312`); exact draft head and CI belong to the PR/receipt.

## September 23 — campaign story direction after owner review

`CAMPAIGN_REDESIGN.md` is the active revised map. The owner rejected the difficulty, combat depth and boss feel of merged PR #91's transmitter preview. Its architecture proof is distinct from an accepted Level 3, now planned for Mac as a Streets of Rage-style brawler after Cache's Level 2 road stage. DJ's Level 4 becomes a Super Smash TV-style arena; Sheila's forgotten competition and 9 Bit's player-aware intrusions are selected direction; all four play Levels 5–7, with first-person RPG then DOOM finale. No later level, authored later song, new story cutscene, Drums award or 9 Bit menu interruption is implemented by this documentation pass. The debug/provisional preview merged through #91 remains a technical route only. Old current-review entries below describe their own historical passes.

## Historical transmitter architecture proof after merged #90

Base/rollback is `568c646a3f67cf4ebca4faebd81752534c67ee6f`; branch `agent/broadcast-slum-boss-pass`. The prior previews worked but remained easy/basic. The new bounded proof tightens the game camera, adds directional shield units and airborne interceptors to the existing gunner/patrol/runner mix, and gates the uplink behind a transmitter boss with two height-separated feeds, timed core windows, three warned attack patterns and an accelerated second phase. A boss-entry save, v1/v2 migration, DEV 3 jump and story-boundary labels preserve the handoff. No Drums, Level 3 campaign completion or durable Level 4 record is granted. The Cache Line remains next in actual story order. See `BROADCAST_SLUM_PROOF.md` and the newest ACCEPTANCE route. Exact draft head, validation and CI belong to the generated receipt; the owner subsequently rejected its gameplay feel as the final stage direction.

## Historical review — debug route after merged #89

Base/rollback: `c0d061407378831ae90fcac49985a29c3c5ea037`. Branch `agent/level3-debug-menu` adds **Complete Level 1** to the existing DEV panel and `DEV 3` to the provisional Broadcast Slum canvas. The Level 1 shortcut reaches Cache Back with a real Voice/handoff save but no artificial best result, bonus or difficulty challenge. The preview menu offers relay checkpoint jumps, node/relay bypass, health, scatter, defender clear, reset and proof clear. It never awards Drums or Level 3 completion. Seven native captures include the menu. See `BROADCAST_SLUM_PROOF.md` and the newest ACCEPTANCE route; exact draft/checks belong to the generated receipt. Owner Makko/controller/audio/feel acceptance remains pending.

## Historical review — Broadcast Slum combat follow-up after merged #88

The owner's first run worked but felt easy and basic. Base/rollback is merged #88, `b32a67831acc296c1cb1887ad579bbc04ac44cb1`; branch `agent/broadcast-slum-combat-pass`. Both relays now require reachable roof nodes before core fire. A threshold counter surge warns two street lanes, marks an additional roof shot when elevated, and telegraphs a runner behind; temporary scatter pickups, elevated aimed gunners, patrol and pursuing runners add distinct actions. Shield links, impacts and objective text explain the sequence. Preview save/audio boundaries remain, including old checkpoint restores and Level 1 return; Voice remains, with no Drums or Level 3 completion. See `BROADCAST_SLUM_PROOF.md`, newest ACCEPTANCE route and seven native captures. Exact draft revision, checks and CI belong to the generated receipt. Owner Makko/controller/audio/feel acceptance remains pending. The first proof section below is history.

## Historical review — first new genre proof after merged #86

Merged base/rollback is #86, `50aae91fea5f63a876d75a97bd67f86a539a961f`. Branch `agent/broadcast-slum-proof` adds a playable, clearly provisional Level 3 run-and-gun preview from the Level 1 Cache Back intermission: responsive move/jump/fire, six warned defenders, two blocking relays with phrase-timed volleys, uplink clear, two objective checkpoints, title Continue, pause/Exit preview and a real return to the preserved Level 1 handoff. It uses independent generated temporary stems at 108 BPM; the previous Level 1 synchronization contract remains intact. Voice and earlier discoveries survive. No Level 3 completion, Drums key or future story scene is awarded. See `BROADCAST_SLUM_PROOF.md` and its four native images for exact review/limits. The Cache Line road proof and actual Level 2 song are next; old current-review headings below are historical.

## Current review — Hack and Rhythm Mode presence

Merged #85 at `62b44f7cf5446b38bec18746411587327cedb142` is the base/rollback. Branch `agent/mode-power-presence` strengthens hack entry, city color, slow scenery/traffic, open-hand gesture and guard reaction; Rhythm Mode gains beat fields and contact power. Five cached SFX use the existing mixer and warning budget. The fixed terminal stays readable, and music timing remains protected. Details, visual/audio evidence and playtest limits: MODE_POWER_PASS.md. Exact published head, tree, PR, checks and CI are in the generated receipt. Earlier current-review entries below are historical. Hosted/controller/listening acceptance remains pending.

## Current review — final Level 1 playtest follow-up

Merged #84 at `bbd95ba821b99a1268e1dc563d7027fdbf12dc08` is the base/rollback. Branch `agent/level1-final-playtest` addresses the new playtest: solid side-by-side hacking, title settings and pause fullscreen, saved optional objective recovery, bounded boss support drones, jammer relay/discharge phases, and learned safe dialogue/objective positions. Working music timing remains protected. Details and explicit settings rules: FINAL_PLAYTEST_PASS.md. Exact head, PR, automated checks and CI belong to the generated receipt. Native/Chromium evidence does not establish owner Makko/controller acceptance; Level 1 is a review candidate.

## Current review — control alignment and finishing

PR #83 is merged at `c5be7a9ac1c2a1ef6609ce69e5714a5c9f8b2698` (base/rollback). Branch `agent/control-polish-optimization` centers button glyphs, corrects controller/remapping labels, aligns objective/keypad/Begin Level text, and removes repeated presentation calculations while preserving placement. The prior polish, boss, music and campaign work remains. See CONTROL_POLISH_PASS.md for 320 equivalent placement states, 40 native glyph comparisons, operation counts and focused Makko review. Exact head/PR/full checks/CI belong to the generated receipt; hosted acceptance is pending.

## Current review — audible music response

PR #82 is merged (`a0f9e79356210b0966f0a9d04113094b52b8e568`). The owner reports its musical changes are imperceptible and confirms the filenames are misleading. Branch `agent/audible-music-response` uses measured source content to route effects, adds clear bass cutaways/returns and phrase breaks, and retains exact source timing/loops/judgment plus legacy Off mixing. See AUDIBLE_MUSIC_RESPONSE.md and the generated receipt for the evidence. Gameplay, campaign and elevator behavior are unchanged.

## Current review — boss, music and campaign foundation

Branch `agent/boss-music-campaign`, based on merged #81 (`a75f33f2321a9e96f3a8fa7677dbf61e586bdb1e`). The owner approved the next pass while explicitly protecting working audio sync. See BOSS_MUSIC_CAMPAIGN_PASS.md for implementation, exact evidence scope and remaining work.

New: musical boss recovery by difficulty, fixed marked slam, profile-owned adaptive music with A/B setting, protected legacy synchronization contract, critical SFX priority/readability, durable Level 1 checkpoints and results, Voice key and resumable next-channel handoff. Six later playable levels, optional-module challenges, final ending rules and authored later songs remain outstanding. Exact head/PR/checks are generated in the source receipt; hosted/audio/controller acceptance is pending.

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


## September 16, 2026 — restore Jammer arrow to the screen edge

Base/rollback: merged PR #59 (`a4c16069b008c508a1dca60aeba3aab7e3c29b3f`). Branch: `agent/fix-jammer-arrow-edge`. The owner reports the guidance arrow appearing over the player. At zoom 1 and 1.2, the player's projected position lies below the arrow's safe bottom (770); the old ray starts on that clamped boundary and selects its zero-distance bottom intersection. Reproduction at player x=960, y=784 and Jammer x=3520 yielded arrow (960,770), directly over the player.

For a Jammer beyond the left/right viewport, place the cue on that corresponding safe edge, clamp its height and point its artwork at the projected target. The normal-zoom reproduction now gives (1840,770). Keep current arrow artwork, distance, pulse/fade, single UI draw owner, on-screen hiding and gameplay. No asset changes. The circled facade-emitter appearance is not changed by this focused arrow correction.

The production-module mission harness covers both directions, ground/jump heights and four zooms (24 combinations), target direction, HUD bounds and hiding on entry/removal. Required suite/syntax results and exact review head are recorded in the generated receipt. Native/VM checks do not establish hosted Makko acceptance. Earlier current-state entries below are historical.


## September 16, 2026 — street depth, one terminal and render cost

Base/rollback is merged PR #58 (`1c8b54ec5db0e102f64c0ffb15bd4b57c5e5acda`). Branch `agent/street-depth-terminal-performance` implements the owner's new feedback: draw emitter hardware behind enemies, replace three large generic boxes with one illustrated broadcast terminal at the Tower, and reduce wasted scenery rendering. The two removed boxes also lose their colliders; thin wall-mounted supports remain. Baked original rail geometry/off states use asset ancestor `1891ebb4e061971362817832e942ef9fbe05d15a`. Native gate-pass draw calls fall from 14 to 1 for the first gate and 55 to 2 after all gates clear at the fixed review camera. This is not a hosted FPS claim. See `STREET_DEPTH_TERMINAL_PERFORMANCE.md` for implementation, assets, tests, limits and the exact Makko route. Review head/CI belong to the generated receipt. Owner Makko acceptance is pending; earlier entries are history.

## Thin rail / original traffic correction — September 15, 2026

Base `f048d229a51b9ecce801cd9d736613491c4ae2f9`; branch `agent/thin-rails-original-traffic`. The owner rejected #57's car retuning and detached hardware, selected the thinner continuous rail example, and approved the full correction plan. Implemented: continuous generated wall/pavement rails and caps; original car creator/spawning/motion with matching warnings and swept damage; faint painted-lip roof lines; constrained contact/recovery clearance; stable Firewall edge transitions; matching drone warning/shot with roof interception; compact Objectives/H cues; sixteen-second shared entry and untimed practice. Preserve sidewalk plane, heart repairs, 3D props, building-top routes, single jump, mission/hijack/music/Jammer/boss rules.

Four rail images use asset ancestor `08d5720f31020fd846ea6b93c76988ffef6e3fbe`. `THIN_RAIL_TRAFFIC_CORRECTION.md` records the implementation, original-traffic contract and validation limits. Native scene/motion review and focused production checks are prepared; exact full-suite/CI results and review head belong to the generated receipt. Owner Makko acceptance remains pending. Earlier entries are historical.

## Level 1 rebuild after reverted #55 — September 15, 2026

The owner reverted failed PR #55 via #56. Verified base/rollback is `6e3751ba1561d8694e0bdc9a623e74ac6a45624d`, whose tree preserves #54. Current branch is `agent/level1-rebuild-reviewed`. The owner approved the revised plan before implementation; the complete scope and tuning are in `LEVEL_01_REBUILD_PASS.md`. This is a fresh review over the reverted base, selectively retaining the approved cutscene/input improvements rather than restoring the failed pass.

Installed: fair protected-contact separation; steady registered Firewall travel; feet at sidewalk y=856; text-free heart repairs; clearer objectives and shared hack keypad; six additional colliders on actual building crowns with foot masking; ten additional service supports alongside the two existing props; two new illustrated drones within the existing twenty-enemy quota; generated facade/floor emitter hardware on the retained street-spanning barrier geometry; and warned traffic using the existing three car drawings. Ground guards do not navigate upward. Original seven surfaces and single-jump physics remain; the renderer no longer paints blue lines across roofs.

New images are pinned to verified asset ancestor `a155d4283a12df4dd7ea0f8cb9eb0bf985644fa8` (three WebP atlases, 543,482 bytes total). Existing car atlas URLs use immutable base `6e3751ba1561d8694e0bdc9a623e74ac6a45624d` with the existing image fallback. Missing car art does not create a hazard or substitute drawing. The bounded new drone uses the existing simulation, damage, defeat and hijack owners.

Focused production checks exercise 75 climbs at 30/60/120 FPS, protected contact, grounded guards, bounded drone flight/conversion/projectiles, actual-image car fallback, warnings/damage/recovery and roof masking. Required full-suite/syntax and remote CI outcomes belong to the exact PR/receipt. Native review footage uses production drawing with host adapters; it is not a browser/Makko playtest. Owner Makko visual, control, audio and gameplay acceptance is still pending. Earlier current-state entries are history.

## Wall footprint correction — September 15, 2026

PR #53 is merged. Base/rollback is `685d13d4de1d56c8a39a82077460d894144bd091`; current branch is `agent/barrier-street-footprint`. The owner sees the tall barriers but reports that their flat bottoms leave the sidewalk looking passable. The wall renderer now spans forward along the existing perspective, follows the raised sidewalk, steps down the curb and reaches beyond the street artwork. Its near end/top retain slab thickness; projected ribs and the footprint share the existing collapse/fade clock, with culling expanded for the full wall.

This changes drawing only: original gate coordinates, collisions, unlock conditions, full-height barrier and opening duration remain. Merged walk, hijack, repairs and all gameplay remain. Native before/after review shows the actual foreground and production wall drawing; it does not establish hosted Makko acceptance. Required tests, CI and exact review head are recorded in the generated receipt/PR. Follow the top ACCEPTANCE route, then import the actual main merge revision after acceptance/merge. Earlier current-state entries are historical.

## Current review: enemy hijack and replacement repairs

The owner selected enemy hijacking as H's new success reward. The scoped implementation is recorded in `ENEMY_HIJACK_REPAIR_PASS.md`: eight-second ordinary-enemy allegiance, visible lock/countdown/reboot, friendly-fire exclusion, repair cells/carrier and two physical rooftop connections. The former hack heal and area-stun success path are removed. The owner merged walk PR #52 during preparation. Verified main/base is now `66c17d1880f5de933e9b928833e5dd2bfff6a817`; its complete tree matches the original walk head `b1692f47017459011177fb779639682534c862b7`. Preserve the separately committed, tested new work in a new draft against main; no runtime conflict or lost work occurred. Exact final review/CI status is generated in the source receipt and PR. Makko remains pending; the merge is not playtest acceptance, and earlier current-state entries are history.


## Restrained player motion polish — September 14, 2026

PR #51 is merged. Base/rollback: `ea2921960477e38c74740dda378fcb513a8f1cc1`; branch `agent/player-motion-polish`. The owner requested less fidgety 6 Bit animation and small improvements to the current game, explicitly avoiding giant changes. Health sources, rooftop expansion, cloud secrets and traffic hazards were reopened for design discussion; they are recommendations rather than implemented mechanics.

The walk had uneven/repeated poses, a 46.5-source-pixel waist-registration span and faint overlapping limbs from its prior temporal blend. Reuse twelve complete-body drawings from immutable original art `a4c1b7cf6fec0a083a4812ae1ea76edef45a5911`, register the waist to within one source pixel, retain a restrained natural vertical bob, and pace the stride according to lower-body pose changes. No model generation, cutout rig, limb swapping or changed world movement is used.

The same 48 animation keys describe four coherent one-second strides, with bounded 45–135 ms pose holds. Only twelve image cells are stored: atlas 2304×640 instead of 2304×1920; 493,234 bytes instead of 2,512,406 (80.4% smaller transfer, 66.7% fewer decoded pixels). Cell size, source anchor, 300 px/s ground speed, collision, controls and total four-second clip contract stay the same. Jump, rhythm and the just-repaired idle were inspected; their current imagery and phase timing remain.

Active immutable artwork: `39410b034c9444861f8f30836e31f9ec252d92fe`. Manifest: `7f77b53dce9cd340bf74b33f38c673a2987a9c5d`. The generic temporal tool recognizes the bespoke packed walk and cannot overwrite it. Added production-playback checks exercise the actual unequal pose durations at 30/60/120/144 Hz, loop boundaries, pause and irregular deltas. Published revision, full-suite and CI evidence belong to the PR and generated source receipt. Native sprite inspection/comparison is not hosted Makko acceptance.

See `NEXT_SMALL_GAMEPLAY_PASS.md` for the grounded health/rooftop recommendations and the top of `ACCEPTANCE.md` for this walk-only review. Larger design suggestions do not silently replace the current mechanics.

## Idle, flourish and fireball polish — September 14, 2026

Current work supersedes earlier recovery handoffs below. PRs #49 and #50 are merged; base/rollback is `42aebe8c19853da510c385c45606dfd3b4c7973a`. Continue on `agent/animation-fireball-polish`.

The owner requested a smooth 6 Bit idle loop, a clearer boss flourish/attack, and larger, better-looking boss fireballs with existing timing and damage. The saved asset checkpoint `7f0dd0e` is reused byte-for-byte: a coherent 26-frame forward/return idle and a lossless 3584×2170 boss atlas with 48 poses. No art is regenerated. The flourish is a 2× resampling/sharpening of the retained source, not a new model redraw.

All thirteen installed replacement clips (595 frames) use immutable asset commit `236e7d7b5b3c6a1dfb580f8feeac6544d8626e86`. The active loader uses verified published manifest `fab43be772cbf4d3355486e695b11898bcd959c3`, detects a stale flourish, and retains the existing registry/rebind lifecycle. Doubling flourish geometry and anchors while halving display scale preserves the same world size, feet and four-second timing. The original boss walk remains.

The fireball reuses the authored pulse art at 104×76 with a soft glow and directional wake. Its hot leading edge remains on the original 64×56 swept damage front. Speed, phase durations, second-pulse delay, damage, jump clearance, mission rules, other sprites, intro, HUD, cat discovery and walls remain unchanged. The renderer creates no timers, canvases, game state or asset downloads.

Focused model/loading, presentation and boss-anchor checks pass. Native Canvas inspection uses real image bytes and the production fireball draw method. Required full-suite/syntax and current-head CI results are recorded on the PR and generated receipt. Live Makko motion, loading, audio and playtest acceptance remain owner checks.

Publication recovery also preserves the previously saved SpritePlayback clock, stable enemy idle references, and all jump apex/landing drawings from `375de26`. The existing PR #49 shim is replaced by these direct production owners, keeping one implementation of each effect. The twelve atlas files are the exact saved `61d691d` outputs.

## Level 1 presentation smoothing — September 14, 2026

The completed recovery targets existing draft PR #49. Twelve atlas hashes and sizes are verified in immutable asset commit `1edf7fe6a011b88d511b955db9d1342f78912009`, used by both the manifest and active initializer. Restored the saved playback script loading, player/enemy integration and test fixture that were omitted during interruption. Local `npm test` and `npm run check:syntax:all` pass; current-head CI and published revision are recorded in the PR and generated archive receipt. Owner Makko acceptance remains pending.

Base/rollback is merged PR #48, `de9a63ea9311aba23d6a9ad6c3dca3b5e8aa50a5`. The combined review branch is `agent/level1-presentation-smoothing-recovery`. This pass corrects presentation only: the Jammer now meets the 822 sidewalk contact; all twelve installed replacement atlases receive a restrained premultiplied-RGBA temporal pass while retaining 547 frames, 12 fps clocks, cells and anchors; background traffic lighting is composited behind buildings while foreground lighting remains in front.

The tutorial objective card now sits below the score/lore stack. The saved `egg.l01.studio-rat` discovery is a Studio Cat on Cache Overpass, away from the Signal Lift, and its rooftop dash can occur only on the first collection. Encounter barriers are tall perspective digital walls aligned across the sidewalk instead of narrow vertical strips. Mission collision, unlock timing, intro, combat, boss, HUD and saves are unchanged.

Automated checks cover atlas hashes/geometry/provenance, one-time discovery behavior, Jammer ownership/contact, gate form, UI lane and render order. Full suite, all-file syntax and exact published revision belong to the PR/receipt. Live Makko motion, composition and feel still require owner review before merge. See `PRESENTATION_SMOOTHING_PASS.md` and the top of `ACCEPTANCE.md`.

## Makko still showing old character sprites — September 14, 2026

PR #47 is merged at `8f09568eeb9726f7b80fb43e1ecb3f6e4672bea2`. The owner confirms the background and some presentation work but reports old Makko player/enemy sprites. `agent/fix-makko-sprite-loading` repairs the active `game-initializer.js`: use the immutable published manifest URL, reuse a loaded registry only when all twelve replacement image/JSON pairs match, and rebind the player created before Start. Allow sixty seconds for cold atlas downloads and clear the timeout after completion. Existing gameplay, imagery, HUD and retained boss clips are unchanged.

The model-art regression now executes active startup with cold, preloaded old, mixed and current registries, including concurrent calls and player rebinding. Its previous reference to the unused legacy `main.js` was insufficient. A separate diagnostic runs the actual saved Makko SDK with decoded local atlas bytes, replaces the old registry, and draws all twelve replacement clips plus production player/enemy owners. This proves the SDK loading/cloning/drawing path; live Makko import, browser networking, audio and playtest acceptance remain owner checks. See `verification/makko-model-runtime.json` and `.webp`.

PR #47 now publishes the recovered runtime integration and immutable artwork. The first push run passed its game, syntax and Chromium assertions but failed afterward while removing Chrome's temporary profile (`ENOTEMPTY`); the simultaneous PR run passed. The follow-up waits for Chrome's close event and retries transient directory-removal races. Current-head validation is reported on PR #47 and in its generated source receipt. Owner Makko acceptance remains pending.

## Recovered model-art integration — September 14, 2026

Current base is merged PR #46, `f3bf9ed294a2bd69fe3a7dccc02a1c50b9241db2`. That PR preserved five atlases but did not install the runtime changes. The saved v5 version 38 already contained the remaining prepared clips, calibration, new world layers and live ComicHUD; this pass restores that implementation rather than redrawing it. Continue from `CONTINUE_HERE.md`, not the historical sections below.

On `agent/finish-model-art-hud`, sprites-manifest now installs twelve recovered clips / 547 full drawings, and parallax installs the new far city and building layers. Every replacement points at immutable art commit `a4c1b7cf6fec0a083a4812ae1ea76edef45a5911`. The illustrated HUD consumes the live health, score, lore, rhythm, combo, Amp and boss owners; heal/damage/lore effects follow its panels. Fixed collision bodies, original action timing, music and mechanics remain.

Two original boss clips (walk and flourish/attack) and the three existing traffic animations remain because their final new exports are absent from v5. This is a recovered integration, not completion of those missing drawings. The saved source also notes three Firewall flame poses needing a continuity review. No lost artwork has been represented as recovered.

Validation and publication status are recorded in CONTINUE_HERE and the generated receipt. Owner Makko playback, sound, proportions and contact review remain required before merge. Stage C follows acceptance of the art/HUD work.

> **Recovery checkpoint, September 14.** Draft PR #46 exists. Twelve recovered complete-body clips (547 frames), the approved city layers and live HUD are being installed and checked on that same branch. Final boss walk/flourish and vehicle loop exports were removed by workspace maintenance before publication and could not be recovered from GitHub or the saved v5. The original working boss walk/flourish and traffic remain. Do not regenerate the approved designs, claim full completion, or merge this checkpoint. See MODEL_ART_RECOVERY.md.


> **September 13 production checkpoint — in progress.** The owner approved integrating the model-based artwork and HUD as one combined pass on `agent/model-art-hud-integration`, from merged #45. Twelve complete-pose clips (547 frames) and the live HUD are prepared. Final two boss clips, vehicle loops, scenery/anchor calibration, delivery pins and full validation remain. No PR or Makko acceptance is claimed at this checkpoint. See `MODEL_ART_HUD_IMPLEMENTATION.md`; older review-only sections below are historical.


## Current review — visible model-based overhaul, September 13

The owner's latest correction requires a visible redraw with the actual reference model and examples across enemies, both city layers, buildings, vehicles and HUD. The original four model PNGs are now recovered and bundled. `VISUAL_OVERHAUL_REVIEW.md` records 12 complete hero poses, one 48-frame full-body headbang trial, eight enemy poses, two redrawn city layers, all three vehicle designs and an interactive three-state HUD with the correct portrait. Added frames are authorized but none have been padded into this trial.

The new drawings and HUD are local review assets on `agent/visual-overhaul-review`, not installed replacements or finished versions of every animation. The active game matches merged #45 byte-for-byte in runtime source, entrypoint, manifests and package settings. The headbang needs drawing-consistency and loop review; other full sequences, platform alignment and HUD state wiring remain production work. Required code checks and actual preview validation belong to the export receipt; no new PR, push, merge, Chromium CI or Makko import is claimed. The subtle restoration and cutout directions below are historical. Continue with the current visible overhaul, then Stage C.

## Historical restoration trial — quality gain rejected as insufficient

The owner says the drawings improved but the separated-part animations are worse, particularly headbang, jump and attack. The cutout pass is rejected. `agent/original-motion-restoration` restores all active runtime source, original sprite bindings/facing/calibration and scenery to merged #45 (`c557c87bb0e04287e6c694d7d6559174d8b65d06`). Its cats, arrow, pulse, varied FX and boss sizes remain, together with the earlier intro/HUD/gameplay work. No new GitHub push, PR, merge or Makko import was performed.

Three complete **review-only** 2x restoration trials preserve the whole original frames: 48 headbang, 27 jump and 59 Firewall attack frames. EDSR changes RGB detail; original alpha is replicated exactly, source order/durations/tags are retained, and pixel coordinates double uniformly. No limb extraction, pose replacement, interpolation or retiming is used. The synchronized comparison and full original/restored image/JSON pairs are included. Clarity gains are modest, and changing texture can still require visual review. The other eleven clips have not received this restoration pass.

`ORIGINAL_MOTION_RESTORATION.md` records reproducibility, limits and the next quality review. The generated receipt records required regression and all-JavaScript syntax outcomes for this restored build; neither certifies Makko rendering. Rejected rig files and previous scenery candidates remain unused historical studies. The old publication request below is cancelled for that rejected design; do not use its hosted links or publish it as the current work.

## Historical publication checkpoint — superseded by owner correction

The replacement build is complete locally. Required regression, all-file syntax and native production rendering passed at `cefc1b30b00ca42d306abc64b2c71ded35a5ba67`; independent decoding confirmed all 636 head/foot measurements. Subsequent checkpoint edits change documentation only. Automatic approval review rejected publishing this exact pass to GitHub, stating that explicit authorization for the external write was missing. No replacement branch/PR was created, no merge occurred, and Chromium CI has not run for this pass. Do not claim hosted sprite delivery or Makko readiness: the pinned art URLs remain unpublished until the art ancestor and review head are pushed. All corresponding bytes and comparisons are bundled for review.

The former next action was a push and combined draft PR. That action was blocked by automatic approval review and is now superseded by the owner's rejection of the animation. This historical checkpoint remains available for comparison; it must not be published as an accepted replacement.

## Historical cutout pass — rejected after merged #45

September 13 continuation recovered committed artwork at `1962622e7d318de92b3d1946be93ff508725709c`, with no published sprite branch/PR. It finishes the missing immutable image/JSON/scenery URLs and corrects the stale source-pack entrypoint. `ASSET_UPGRADE_STATUS.md` shows exactly what #45 already merged and what this combined review adds. The export receipt records the final published revision and actual automated outcomes; owner Makko review is still pending.

The owner approved all replacements and Python cleanup/animation assembly. The complete pass is integrated on `agent/sprite-upgrade-study`, based on `c557c87bb0e04287e6c694d7d6559174d8b65d06`. It contains matching 6 Bit idle/walk/jump/rhythm rigs, a registered Virus pulse, Corrupted idle/walk, Firewall idle/walk/punch, source-preserving Jammer/boss clarity refinements, the correctly proportioned panorama, and restrained foreground/traffic polish. All 14 original clip identities, 636 frame entries, counts and 12fps clocks remain. Source-pixel anchors and presentation scales are measured again; stable damage bodies, jump/attack phase ownership, controls, music, mission and boss behavior remain.

`SPRITE_REPLACEMENT_PASS.md` records provenance, implementation, limits and rebuild commands. The hero uses existing intro art as a derived reference: the original face/front/side model PNGs have not been re-inspected. Three animated before/after comparisons and two native production compositions are in `verification/sprite-upgrade-*`. The historical checkerboard candidates are superseded, retained only as unused studies. The full local production suite (28 commands), all-JavaScript syntax, native production compositions and original-alpha preservation checks pass. Exact published head and subsequent Chromium CI results belong to the source receipt/PR. No live Makko acceptance or merge is claimed. Next: review this combined build in Makko, then Stage C after acceptance.

## Sprite/background upgrade studies — after merged #45

PR #45 is merged at `c557c87bb0e04287e6c694d7d6559174d8b65d06`; its tree matches the tested review head. The owner's next request is to improve the existing sprites/animations and possibly the background. `SPRITE_UPGRADE_STUDY.md` records source inspection, a 6 Bit walk study, a Virus pulse study and a correctly proportioned far-background candidate on `agent/sprite-upgrade-study`.

The sprite candidates have stronger visual identity but failed the alpha export check; the walk also needs gait correction. A targeted extraction attempt did not repair the flattened checkerboard. They remain clearly labeled unused studies. The background candidate passes a production-parallax composition/aspect check with the exact existing foreground. Runtime files remain the merged #45 version. The original 6 Bit face/front/side PNGs are missing here; intro pages 6/8 were used as derived references. Obtain the originals to complete a faithful matching four-clip set, then carry enemy/background work into one combined production pass. Stage C follows this presentation work. Older draft/current sections are historical.

## Studio Cats, chaotic FX and boss assets — after merged #44

PR #44 is merged at `4b207c5570a6bccd86b95c702c11e1e6606bbf01`, including the final hack-highlight/victory-timing corrections. Its draft wording below is historical. The owner's newest five-item follow-up is implemented on `agent/level1-cat-chaos-assets`; `CAT_CHAOS_ASSET_PASS.md` records its exact scope, asset provenance and sizing table.

Studio Rats means cats. A four-frame tuxedo cat replaces the literal rodent in the street and panel-margin gag, with compatible saved discovery IDs and corrected crew copy. A reusable distressed arrow replaces the active Jammer pointer, and animated torn energy replaces the boss's orange pulse blocks. All three images use one cached loader with verified immutable URLs and bounded bundled fallbacks. Repeated effects now vary their burst shapes, scratch marks, angles, branches and fragment trajectories without consuming randomness during rendering. The boss grows 8% overall; its walk gets another 6%, with grounded frame anchors and a stable 8%-larger body core. The existing attack timings/damage remain.

The full local `npm test` suite (27 commands), `npm run check:syntax:all`, the native asset diagnostic and six production scene renders pass. This is one combined review, with current-head Chromium/export status supplied by the generated receipt. Local and CI tests do not certify Makko animation playback or gameplay feel. New art/tuning require owner Makko review before merge. Stage C follows this requested asset/FX pass. Older current/next/draft sections below preserve history.

## Level 1 impact and discovery — combined review after #43

PR #44 continuation: the hack-success packets now arrive at the compact health bar's center, and the repair outline follows that bar. The victory card and counters share one presentation timeline: 620ms final-hit hold, 240ms card fade, then the full staggered count-up. The completion clock now includes every row through 2060ms; pause and rematch preserve/reset the presentation correctly. These final corrections remain in the same draft. Production regression and all-JavaScript syntax checks pass locally; the native UI diagnostic is `verification/impact-pass-hud-results.webp`, reproducible with `node tools/render-impact-followup.cjs`. Current-head Chromium and source-export evidence belong to CI/the PR receipt. Makko review remains pending.

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
