# Repository Guidance

## Current authority and scope

**Current work after merged PR #37: whole-campaign continuity and planning.** Main was verified at `38732933713c4f9ec22666e49b728a0626a85f25`. Read `docs/source-pack/CONTINUATION_PLAN.md`, `CAMPAIGN_STORY_MAP.md`, `EASTER_EGGS_AND_CAMEOS.md` and `ASSET_AND_PLATFORM_PLAN.md` first. The owner approved the broader improvement direction, then explicitly required the whole story to be mapped before isolated intro changes and added inspiration Easter eggs. This documentation pass records the complete working treatment and implementation order; it does not claim new runtime features or finalized scene/ending copy. Keep one combined review and the maintained v5 pack.

The latest owner cast correction includes Cliff, Sheila, Studio Rats, WittyF0x, Kave, SKELLA and Dr3wBaby; excludes Mind Fanatic/M1ND_FANATIC, Emerald/EMRLD, Crowline and W3T TDDY. Retire the old W3T TDDY route dependency. Only the original four remain playable. Sheila remains a silhouette when depicted.

The owner reopened intro/story development. This supersedes the old absolute prohibition on reconsidering the prologue **for the approved design/prototype work**. Existing images, wording, title and working gameplay remain the live baseline until a concrete replacement sequence is written, demonstrated and reviewed. Do not infer approval of an art overhaul, new 9 Bit reveal, or mass rewrite. Specific new scenes in the map are working proposals. Standalone migration is deferred; mobile remains a bounded feasibility question.

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
- `H` starts the existing short hack puzzle. Its existing availability rules and one-health-bar success reward remain.
- Tutorial and pre-encounter boundaries must prevent crossing a future closed gate. Boss world position must not be tied to cinematic camera motion; animation scale/feet must remain consistent. Jammer placement must clear the lift plus its full attack range. These are September 11 owner playtest corrections.
- Preserve the two-hit rhythm-powered lift, authored rooftops, and the currently approved stable body/swept-foot geometry. Backend ownership changes are not permission to remove mechanics.
- Level 1 requires 20 post-tutorial mission defeats through four authored encounter groups. Tutorial kills do not count.
- At 20 mission defeats the Broadcast Jammer appears once in the opposite world half. It has 16 health and accepts one damage per successful rhythm attack; H and passive stomp do not damage it. It remains an environmental object owned by `BARCODE.JammerEnvironment`, not an ordinary enemy.
- Jammer destruction immediately ends active Rhythm Combat Mode; it cannot reactivate during the cinematic or automatically resume at handoff. Preserve the background rhythm/music clock.
- Jammer destruction leads through the existing freeze, purge, camera pan, boss entrance/flourish and control handoff into the boss encounter. Reuse that presentation; do not casually rename its boss or change its identity.
- Each level selects its own song/profile. Level 1's compatibility timing and source names are never a campaign fallback. Other genres choose their own musical interaction and need not gate their ordinary inputs by rhythm.
- Lore: 28 one-time pieces distributed `3 / 4 / 5 / 4 / 5 / 4 / 3`; deterministic IDs, authored purposes and eventual persistent collection. Random legacy prose is not approved canon.
- 9 Bit is the byproduct of negative parts separated from 6 Bit. His future reveal and the revised intro must be developed together; the title/tutorial already disclose his name/presence. Do not invent a new prologue appearance as an incidental change.
- Existing prologue images/wording and approved art are the current live baseline. The newest approved whole-story/intro prototype may propose selective revisions; exact replacement scenes/art remain reviewable. Never call 6 Bit/the player “the virus.” Mac Modem's established metaphor is character-specific.
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
