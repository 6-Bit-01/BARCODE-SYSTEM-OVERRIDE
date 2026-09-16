# Project Instructions

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

## September 16, 2026 — current upper-route follow-up after merged #59

The owner requested the Jammer-arrow correction, visible drones, barely visible roof-edge guides, a free boss-combat camera, more rooftop exploration, a sharper boss intro, an illustrated elevator and boss jump/climb participation above the street. `UPPER_ROUTE_BOSS_PASS.md` records the recovered combined implementation and focused review. Thin continuous rails and hardware depth remain part of the saved continuation. Base/rollback is `a4c16069b008c508a1dca60aeba3aab7e3c29b3f`; branch `agent/upper-route-boss-polish`. Preserve original car motion, single jump, the 20-defeat mission and existing combat/music rules. Exact reward/timing/art choices are implemented for owner Makko review, which remains pending before merge. Older latest/current entries below describe earlier milestones.

## Latest approved scope

The owner selected thin continuous barrier rails and approved `THIN_RAIL_TRAFFIC_CORRECTION.md`. This supersedes detached emitter boxes, retuned foreground cars and removal of all roof lines. Preserve exact original car motion/art, add warnings/damage, restore faint roof edges, finish contact/Firewall/keypad/attention corrections and retain working separate cutscene controls. One combined draft; owner Makko review before merge.

## Current H reward and bounded route update

The owner selected enemy hijack, superseding previous one-bar hack healing and assumed stun-purpose guidance. H now temporarily converts one nearby ordinary enemy after the existing slowed-time puzzle; repairs come from the scoped cells/carrier. `ENEMY_HIJACK_REPAIR_PASS.md` controls this implementation and its review. Walk PR #52 is merged; publish the preserved new work as one draft against current main. Preserve the walk, single jump, original lift, mission/Jammer/boss requirements and owner Makko acceptance.


## Authority and evidence

1. The owner's newest direct instruction controls design and scope.
2. This pack's `DECISION_REGISTER.md` records current retained decisions. Its explicitly provisional specifics remain provisional.
3. Other v5 design files elaborate those decisions.
4. Current source and Git/PR history establish what is implemented. The generated manifest establishes exactly what was exported.
5. v2–v4 and older conversations provide history only where retained. Obsolete prompts, raw lore, comments and README claims cannot override later approval.

The post-PR #37 approval required a full campaign/story map, corrected cameos and inspiration Easter eggs before isolated intro work. Read `CONTINUATION_PLAN.md` and its linked story/cameo/asset documents first. They distinguish retained decisions from new working treatments. Approval of direction does not retroactively mark gameplay as tested or choose every candidate boss/title/ending.

## Preserve the game the owner approved

Use only the original four as playable characters. Preserve the simulation premise, 9 Bit's origin and the separate *Observer Not Found* boundary. The owner reopened intro/story development: INTRO_OVERHAUL.md records the replacement opening and INTRO_ART_DIRECTION.md its eight new scenes using the subsequently supplied character models. Only the five supplied characters may be visibly identifiable; the original four remain playable. Preserve other-character concealment and the existing reveal boundaries. Apply the latest cast inclusions/exclusions in `LORE_AND_CAST.md`. Retain the twenty-enemy mission, sixteen-hit environmental Jammer, lethal ordinary-enemy landing stomp, single-jump kit, two-hit lift, real Rhythm Combat Mode and H/R tutorial locks with timing running in the background.

Future musical interactions vary by genre. Level 1 intentionally gates Down attack damage by rhythm; the older blanket “all normal attacks always work off beat” instruction no longer applies to that attack. It does not follow that racing, puzzle, gunplay or RPG inputs must also be beat-gated.

## Build and review workflow

Codex implements the current bounded milestone and produces a reviewable branch/source archive. Use existing assets and host interfaces; no wholesale engine conversion. Test the production logic with the established dependency-free tooling and state exactly what host stubs omit. The owner plays the supplied revision in a duplicate Makko project before merge. Keep the known-good project available.

The campaign map is merged in #38, the first Stage B implementation in #39, the eight-scene opening in #40, the context/art/dialogue repair in #41 and fullscreen recovery in #42. The owner now confirms the images appear and requests staged dialogue/caption timing, Space advancing one cue, readouts on the actual screens and a correction to DJ Floppydisc's hand. INTRO_CUE_STAGING.md governs this continuation. The targeted page-5 image edit is explicitly authorized; retain the other seven illustrations and prior fullscreen/tutorial repairs. The owner's order remains intro first, HUD/rhythm presentation and attack variety second, campaign infrastructure afterward. Preserve earlier gameplay and completed lore; standalone migration remains deferred.

For each milestone report base/head SHAs, intentional behavior changes, validation, Makko status, asset changes, known limitations, rollback and the next step. Keep the source ZIP current using `UPDATE_PROTOCOL.md`; retain one current downloadable archive identity and Git history for older states.

## Architecture direction

Keep `index.html`, the namespaced runtime, semantic input, one lifecycle/frame owner and the profile-owned music transport. Before full additional levels, introduce a small adapter with enter/update/render/pause/resume/exit responsibilities and one versioned campaign state using stable IDs. Dispose level-created listeners/timers/loops/audio. Do not build a generic engine ahead of the first actual consumer.

All JavaScript must parse in Makko, including inactive files. The existing production-code VM harnesses are legitimate logic checks; they are not graphical/audio tests. The old PR-001 documentation/static-only restrictions were scoped to that historical PR and are superseded by later implementation work, not used to bypass the still-current Makko-before-merge requirement.
