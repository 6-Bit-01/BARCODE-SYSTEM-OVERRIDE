# Project Instructions

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
