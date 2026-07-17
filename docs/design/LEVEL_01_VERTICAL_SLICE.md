# Level 01 Vertical Slice Direction

## Authority and scope

This document is the authoritative Level 1 direction for the PR-004 through PR-008 overhaul sequence. PR-003 only establishes frame ownership and runtime cleanup; it does not add mechanics, levels, bosses, playable characters, artwork, dialogue, lore, or audio replacements.

Level 1 is centered on 6 Bit. The game direction is a side-scrolling 16-bit rhythm platformer/beat-em-up where traversal alternates with compact combat arenas.

Only 6 Bit, DJ Floppydisc, Cache Back, and Mac Modem are playable characters. This PR does not add, expose, or prototype the other playable characters.

## Core play contract

- Down Arrow rhythm attacks require active Rhythm Combat Mode and a successful rhythm judgment.
- Accurate beat timing improves damage, stagger, combo, signal recovery, or another owner-approved combat reward.
- Music supplies the authoritative beat, bar, and phrase clock.
- Enemies and hazards telegraph using musical timing.
- The stage advances through authored spatial and musical milestones.
- Traversal spaces should lead naturally into compact combat arenas, then back into traversal.
- The boss transition occurs naturally at the final arena.
- Hacking is optional/secondary and must remain short enough not to break musical flow.

## Gates and non-authoritative legacy concepts

- There is no kill-quota gate.
- There is no jammer-destruction gate.
- The jammer is not an enemy and does not need a forced replacement object.
- “City Scrambler” is not authoritative Level 1 boss design.
- Existing boss art may only be repurposed if the owner approves the resulting identity.
- 9 Bit and *Observer Not Found* are not automatically Level 1 boss material.

## Visual and asset direction

The visual direction is damaged public-access television, VHS, obsolete computing, underground hip-hop, and 16-bit grime—not generic neon cyberpunk.

Existing approved player, enemy, parallax, particle, audio, dialogue, and UI assets should be reused intelligently where they support this direction and do not contradict locked prologue/art guidance.

### Existing Level 1 environment stack

- The approved far background `BG.png` is 1280×855.
- The approved transparent street foreground `FG.png` is 1279×462.
- The active non-tiled parallax draw path currently forces both images to 4400×1589. This approximately preserves the foreground aspect ratio but horizontally distorts the far background.
- Three approved animated flying-car GIFs are already active: normal traffic renders between the background and street foreground, while occasional foreground flybys render over the game world.
- PR-007 must preserve these approved assets and URLs, maintain the foreground/player ground alignment, correct the far-background presentation without replacing its artwork, and deliberately author traffic choreography around the authoritative beat clock.
- PR-003 does not change environment scale, traffic timing, draw order, or visual output.

Known missing assets that must be listed honestly before the vertical slice is complete:

- Owner-approved Level 1 boss identity and any required final boss art.
- Authoritative beat/bar/phrase timing data for the chosen Level 1 music.
- Final authored Level 1 spatial layout and arena boundaries.
- Any new or adjusted enemy telegraph visuals needed for musical timing.
- Any approved jammer presentation changes if the jammer remains as a non-enemy stage element.

## Planned PR sequence

1. PR-003 — frame ownership and runtime cleanup.
2. PR-004 — authoritative beat clock.
3. PR-005 — 6 Bit movement and beat-combat feel.
4. PR-006 — enemies and encounter direction.
5. PR-007 — rebuilt Level 1 stage, parallax, and progression.
6. PR-008 — new boss and complete vertical slice.

## Deferred debt notes

- PR-004 should replace ad hoc rhythm timing with an authoritative music-derived beat, bar, and phrase clock.
- PR-005 should evaluate and tune 6 Bit’s existing movement kit—including dash, stomp, and fast-fall—against the rhythm-combat direction. This document does not pre-approve or forbid additional movement options.
- PR-006 should make enemy timing and telegraphs readable against the music without redesigning all combat at once.
- PR-007 should remove reliance on kill quotas or jammer destruction as progression gates in favor of authored spatial/musical milestones.
- PR-008 should introduce an owner-approved Level 1 boss identity and transition that grows naturally from the final arena.


## PR #8 enemy/Jammer ownership note

PR #8 establishes the single active enemy owner in `src/game/enemies.js`. Virus, Corrupted, and Firewall remain the only active enemy archetypes, with approximate prototype feel preserved pending final encounter tuning. Enemy defeats are an authoritative `EnemyManager` event and are not summed with sector or game-state projections.

The Broadcast Jammer is owned by `BARCODE.JammerEnvironment`. It is an environmental trigger/presentation object, not an enemy, not a kill gate, and not destroyable. The compatibility presentation preserves the approved Makko sprite placement at `drawScale = 0.7` and `drawOffsetY = 190` from the environmental position. It exposes reveal/trigger/reset/dispose/status operations for future stage code, while the final Relay Stage sequence, boss transition, authored objectives, checkpoints, and final audiovisual choreography remain deferred to the authored Level 1 stage PR.

Enemy simulation uses milliseconds at manager/API boundaries with explicit seconds conversion for position integration and behavior-local countdowns. Firewall lunge, glide, attack animation, idle-pause, and cooldown fields are named with `Seconds` suffixes when decremented by per-frame `dt`; simulation timestamp fields use `Ms`. Enemy/enemy and enemy/player collision orchestration is owned by `EnemyManager.update()`, including finite fallback directions for exact-overlap separation.

## PR-009 combat foundation controls

The Level 1 foundation now uses `window.BARCODE.ActionInput` for semantic input and `window.BARCODE.playerCombat` for the primary attack transaction. The approved 6 Bit movement kit for this foundation is left/right plus one normal jump; no double jump, dash, slide, air dash, fast-fall, stomp, or ground-pound requirement is active.

Default controls are: Left/Right or A/D to move, Space/Up/W to jump, Down Arrow to primary attack, H to interact with an explicit nearby terminal target, P to pause, and R to activate/deactivate actual Rhythm Combat Mode. Standard gamepad defaults are left stick/D-pad movement, A/button 0 jump, X/button 2 primary, Y/button 3 interact, and Start/button 9 pause.

Down Arrow is the Level 1 rhythm attack. It deals damage only while Rhythm Combat Mode is active and the active music profile/transport returns a successful authored judgment; miss, unavailable, no-grid, not-ready, inactive, or cooldown inputs deal zero damage. Passive top-down landing stomp remains intentional and lethal. Final range, hitbox, animation readability, and encounter tuning are intentionally deferred.
