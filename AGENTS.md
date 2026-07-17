# Repository Guidance

## Locked content and project boundaries

- Playable characters only: 6 Bit, DJ Floppydisc, Cache Back, and Mac Modem.
- Cameos/collaborators are never player-controlled.
- Seven major levels are planned, each eventually with distinct 1990s Sega Genesis/Super Nintendo mechanical identities.
- 6 Bit intended base movement is left/right plus one jump; no double-jump, slide, or functional dash.
- Rhythm Mode is `R`; timed rhythm attack is Down Arrow.
- Hack is `H`; it is a short puzzle and success restores one health bar.
- Lore plan: 28 one-time pieces distributed `3 / 4 / 5 / 4 / 5 / 4 / 3`.
- 9 Bit is the byproduct formed from the negative parts separated from 6 Bit; 9 Bit does not appear in the locked prologue.
- Prologue wording/images and existing approved art are locked.
- Never call 6 Bit/the player “the virus” in game-facing text.
- *Observer Not Found* is separate and supplies no automatic canon.
- City Scrambler, fast-fall code, dormant boss hooks, and README claims are not automatic future-design authority.

## PR-001 non-change rule

PR-001 is a truthful baseline/documentation/tooling pass only. Do not change gameplay, controls, art, audio, dialogue, camera, timing, levels, balance, boot behavior, runtime files, manifests, or asset URLs.

## Engineering and lifecycle rules

- Treat `index.html` as the browser entrypoint.
- Do not execute browser game code from validation scripts.
- Do not add a bundler, convert files to ES modules, download/replace assets, or hide failures with broad ignores.
- Keep validation dependency-free unless a future PR explicitly approves dependencies.
- Document duplicate lifecycle/global ownership instead of fixing it in PR-001.

## Verified commands

- `npm ci`
- `npm test`
- `npm run check:syntax`
- `npm run audit:syntax:all`
- `npm run check:syntax:all` is expected to fail while inactive syntax errors remain.
- `npm run audit:paths`
- `npm run audit:globals`
- `npm run audit:external-assets`
- `npm run baseline:generate`
- `npm run baseline:check`

## Owner/Makko verification

Codex static checks do not replace owner Makko testing. The owner must test Makko import/open, title presentation, prologue presentation, gameplay feel, audio, camera, sprites, and restart before merge.

## Focused review guidance

Review for accidental gameplay/art/dialogue changes, baseline blind spots, validation that hides failures, undocumented runtime paths, and any claim not backed by static inspection or owner Makko testing.


## Newest owner control decisions

- Active tutorial owns Space exclusively; no simultaneous tutorial advance/jump from the same Space press.
- `R` is actual Rhythm Combat Mode, not merely a visual overlay.
- Down Arrow damage requires a successful rhythm judgment while Rhythm Combat Mode is active.
- Passive top-down landing stomp is intentional and lethal.
- Passive stomp approval does not approve Down-key fast-fall or dash.
- Each level explicitly selects its own song/profile; Level 1 may select `level-01.main`, but it is not a global fallback for future levels.


## Level 1 mission owner decisions

- The 20-enemy post-tutorial objective is intentional.
- Tutorial kills do not count toward the Level 1 mission counter.
- The 20 enemies are delivered through four authored encounter groups.
- At 20 mission defeats, the Broadcast Jammer appears once in the world half opposite the player.
- The Broadcast Jammer has 16 health and accepts exactly one damage per successful rhythm attack.
- The Broadcast Jammer is not hacked with `H` and is not damaged by passive stomp.
- Broadcast Jammer destruction triggers the freeze, enemy purge, rightward camera pan, boss walk-in, flourish, and `boss_ready` handoff.
- Boss combat is the next milestone after the `boss_ready` handoff.
- Backend ownership changes are not permission to remove approved mechanics.
