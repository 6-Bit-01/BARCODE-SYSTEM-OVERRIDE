# Level 1 final playtest follow-up

Base/rollback: merged #84, `bbd95ba821b99a1268e1dc563d7027fdbf12dc08`. Branch: `agent/level1-final-playtest`. Exact publication/test state is generated in the source-pack receipt. Owner Makko/controller acceptance remains pending.

## Hack visibility and safe dialogue positions

The active terminal no longer participates in actor cutouts, fading, moving or crowded docking. It occupies a fixed opaque 780×710 panel on the right. The world is rendered once into a 1060×596.25 live view to the left; full-sized HUD and keypad remain separate. Projection/actor bounds/traffic edge warnings follow the actual scene viewport. Existing scan/deadline/input, tactical-focus clock, guard and cancellation behavior remain.

Only dialogue/task/objective panels opt into learned homes. A location starts accruing dwell after 1.5 seconds settled; at most six homes are retained, each capped at 30 seconds. A better home must exceed current dwell by 1.5 seconds, fit the current dimensions, stay clear for a full second, and wait until the current placement is stable for 2.5 seconds. Existing movement, actor exclusion, crowd docking and unread-time protection still own transitions. Learning is session-local and resets with the panel/lifecycle.

## Settings contract

| Choice | Available | Persistence / scoring |
| --- | --- | --- |
| Music, SFX, Dynamic music | Title and pause; anytime | Device preference; no point penalty |
| Screen shake, flash accents, CRT, reduced motion, instant dialogue | Title and pause; anytime | Device preference; no point penalty |
| Controller bindings, prompts, vibration, deadzone | Title and pause; anytime | Existing device preference; fixed menu controls |
| Input compensation / visual delay | Title and pause; anytime | Saved ±200ms; original audio timing and scoring windows remain |
| Fullscreen | Title settings and pause | Browser session; native user gesture/host permission applies; rejection leaves menu usable |
| Difficulty and recovery | Level start only | Locked and included in checkpoint/result; new level/run can choose again |

The title has a Settings button and O shortcut; controller X/Square opens it. One reusable canvas uses the existing InputManager and title frame owner. Closing never starts gameplay or resumes audio. Explicitly exiting fullscreen keeps the subsequent Start gesture windowed in that session. Browsers may refuse controller-triggered fullscreen; pointer/keyboard can retry. Saved preferences are not silently converted into a fullscreen permission.

## Recovery and points

Objective checkpoints are the default. The existing Level 1 save identity/schema stores encounter starts, jammer, boss and the completion intermission. On death, retry restores the saved objective's score, resources and full health; post-checkpoint points are discarded. Elapsed time, damage and retry facts retain the failed attempt. Boss quick retry remains supported.

Full Run death starts a fresh encounter-1 attempt with zero run score/resources and the same selected difficulty/recovery. The reset is persisted before the death menu, preventing a reload from restoring the failed boss attempt. Both policies can Continue Saved at an objective boundary when leaving normally; this is not a frame-exact suspend or a cloud/account save. Legacy saves default to objective recovery. Blocked storage retains the existing in-session fallback and save-unavailable notice.

A real clear retains ordinary kill/collection points, 1000 clear points, up to 600 connected-perfect quality points, and the existing 500 damage-free/retry-free bonus. Full Run adds 500 clear points. Accessibility preferences do not affect points. Practice gives no new campaign clear bonus/key/record. Each saved result includes recoveryMode; existing per-difficulty best records remain, not a new global leaderboard or ending threshold.

## Combat variety

Boss health/attack patterns/musical counter windows remain. Standard/Overclocked support starts at 6 HP; Relaxed at 4 HP. Maximum live support is 1/2/2 and maximum summons per fight 2/3/4 for Relaxed/Standard/Overclocked. Summons wait 18/12/12 seconds and occur during approach. A support drone will not begin a warning during the boss telegraph/sweep.

Escorts reuse rooftop drone frames at 125px rather than 156px, an 80×65.6 hitbox and a sprite-only palette filter. They flank at approximately 370 world units, change altitude gradually, commit to an aimed line, warn for 1150 hostile-clock milliseconds, then fire a finite non-homing projectile. Four HP survives one perfect beat; existing lethal head landings and hijacks remain counters. Boss support and relay guards award zero points and do not inflate encounter quotas. Victory/retry clears support and projectiles. Original rooftop patrols stay unchanged.

The jammer retains 16 HP and one damage per qualifying beat. At 12/8/4 HP it shields, marks the player's current column, and discharges after a warning. Warning times are 1700/1400/1050ms and widths 200/240/280 by difficulty; hostile/tactical-focus scaling applies. The 420ms active column can hit once and never follows the player. The shield prevents continuing stationary damage during that sequence. Relay breaks summon at most 1 guard on Relaxed or 2 otherwise. Exit Rhythm Mode, evade, counter the guard and resume the next burst. Destruction/cinematic/music handoff remains.

## Evidence and limits

`npm test` includes the new production-owner final-playtest check: eight death/reopen combinations, real lifecycle restore, score idempotence, nine relay timing/difficulty cases, standing/evading, bounded support and its hack/stomp counters, learned panel homes and title/fullscreen failure ownership. Existing smart-panel and street-depth checks now assert fixed opaque hack controls/live-view separation across 24 camera cases; dialogue regression remains.

`tools/check-settings-browser.cjs` uses real Chromium, production title DOM/CSS/adapters and input/menu/fullscreen code at 1280×720 and 960×720. It checks keyboard/pointer, simulated-controller routing, native fullscreen, modal ownership, submenus and preference reload. Gameplay/audio initialization are counted stubs. CI uploads browser evidence. `npm run check:syntax:all` covers scripts beyond the active graph. Baseline inventory changes are global line-location moves only; exceptions are unchanged. Existing music protected-method/three-loop checks remain part of the suite.

Six native Canvas review screens in `review-final-playtest/` use production rendering and local artwork with explicit Makko sprite/image adapters. They demonstrate layout, not hosted gameplay or listening acceptance. No new audio assets, source clocks, loops, source scheduling or beat judgment changes are made. Follow the newest ACCEPTANCE route before merge. Further balance tuning should follow actual playtest; later playable sectors, final ending thresholds and cross-device/cloud saves remain future work.
