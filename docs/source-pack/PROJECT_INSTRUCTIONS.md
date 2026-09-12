# Project Instructions

## Authority and evidence

1. The owner's newest direct instruction controls design and scope.
2. This pack's `DECISION_REGISTER.md` records current retained decisions. Its explicitly provisional specifics remain provisional.
3. Other v5 design files elaborate those decisions.
4. Current source and Git/PR history establish what is implemented. The generated manifest establishes exactly what was exported.
5. v2–v4 and older conversations provide history only where retained. Obsolete prompts, raw lore, comments and README claims cannot override later approval.

The September 11 approval locks in the recommended direction and continued implementation. It does not retroactively mark gameplay as tested, choose every candidate boss/title/ending, or approve an unmentioned art replacement.

## Preserve the game the owner approved

Use only the original four as playable characters. Preserve the simulation premise, 9 Bit's origin and the separate *Observer Not Found* boundary. The owner reopened intro/story review and approved the bounded storyboard/comic-scene piece in COMIC_BROADCAST_PASS.md; its corrected cameo roster overrides older candidates. Reuse the current art and retain the live intro during this first prototype. Retain the twenty-enemy mission, sixteen-hit environmental Jammer, lethal ordinary-enemy landing stomp, single-jump kit, two-hit lift, real Rhythm Combat Mode and H/R tutorial locks with timing running in the background.

Future musical interactions vary by genre. Level 1 intentionally gates Down attack damage by rhythm; the older blanket “all normal attacks always work off beat” instruction no longer applies to that attack. It does not follow that racing, puzzle, gunplay or RPG inputs must also be beat-gated.

## Build and review workflow

Codex implements the current bounded milestone and produces a reviewable branch/source archive. Use existing assets and host interfaces; no wholesale engine conversion. Test the production logic with the established dependency-free tooling and state exactly what host stubs omit. The owner plays the supplied revision in a duplicate Makko project before merge. Keep the known-good project available.

Progress should produce meaningful playable changes. Fix contradictory instructions and tests as support for the boss milestone, then proceed to campaign infrastructure and compact genre prototypes. Avoid broad retuning or art requests while a concrete blocker remains unproven.

For each milestone report base/head SHAs, intentional behavior changes, validation, Makko status, asset changes, known limitations, rollback and the next step. Keep the source ZIP current using `UPDATE_PROTOCOL.md`; retain one current downloadable archive identity and Git history for older states.

## Architecture direction

Keep `index.html`, the namespaced runtime, semantic input, one lifecycle/frame owner and the profile-owned music transport. Before full additional levels, introduce a small adapter with enter/update/render/pause/resume/exit responsibilities and one versioned campaign state using stable IDs. Dispose level-created listeners/timers/loops/audio. Do not build a generic engine ahead of the first actual consumer.

All JavaScript must parse in Makko, including inactive files. The existing production-code VM harnesses are legitimate logic checks; they are not graphical/audio tests. The old PR-001 documentation/static-only restrictions were scoped to that historical PR and are superseded by later implementation work, not used to bypass the still-current Makko-before-merge requirement.
