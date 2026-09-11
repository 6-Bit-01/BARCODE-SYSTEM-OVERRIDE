# Repository Guidance

## Current authority and scope

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
- Preserve the two-hit rhythm-powered lift, authored rooftops, and approved player/contact geometry. Backend ownership changes are not permission to remove mechanics.
- Level 1 requires 20 post-tutorial mission defeats through four authored encounter groups. Tutorial kills do not count.
- At 20 mission defeats the Broadcast Jammer appears once in the opposite world half. It has 16 health and accepts one damage per successful rhythm attack; H and passive stomp do not damage it. It remains an environmental object owned by `BARCODE.JammerEnvironment`, not an ordinary enemy.
- Jammer destruction leads through the existing freeze, purge, camera pan, boss entrance/flourish and control handoff into the boss encounter. Reuse that presentation; do not casually rename its boss or change its identity.
- Each level selects its own song/profile. Level 1's compatibility timing and source names are never a campaign fallback. Other genres choose their own musical interaction and need not gate their ordinary inputs by rhythm.
- Lore: 28 one-time pieces distributed `3 / 4 / 5 / 4 / 5 / 4 / 3`; deterministic IDs, authored purposes and eventual persistent collection. Random legacy prose is not approved canon.
- 9 Bit is the byproduct of negative parts separated from 6 Bit; do not insert him into the locked prologue.
- Existing prologue images/wording and approved art are locked. Never call 6 Bit/the player “the virus.” Mac Modem's established metaphor is character-specific.
- *Observer Not Found* is separate. City Scrambler, obsolete boss hooks and legacy README claims supply no automatic future-design authority.

## Engineering and validation

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
