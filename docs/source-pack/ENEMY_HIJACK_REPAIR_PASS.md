# Enemy hijack, repairs and the upper route

The owner's “Enemy hijack!!!! Fuck yes!” selects temporary enemy allegiance conversion as H's new reward. This supersedes the earlier undecided H section and the mistaken assumption that a visible stun was already its established purpose. H still slows hostile simulation to 40% while solving the existing puzzle. Successful hacking now converts one enemy; it no longer heals or emits the old area-stun transaction.

This pass builds on walk PR #52, which the owner merged during preparation. Verified main/base is `66c17d1880f5de933e9b928833e5dd2bfff6a817`; its full tree is identical to the original walk head `b1692f47017459011177fb779639682534c862b7`. The tested hijack work is preserved in a separate commit and published as a new draft directly against main. No undo, art recreation or gameplay reimplementation is needed. The generated source receipt and PR identify the final exact revision and CI results; the #52 merge does not establish Makko acceptance.

## First playable rules

- H / controller Y locks the nearest eligible ordinary enemy within 520 world pixels. The target is marked before starting and remains the selected actor throughout the puzzle. Entrances, spawn protection, tutorial actors, bosses and the environmental Jammer cannot be hijacked.
- Solve either existing puzzle to change that enemy's allegiance for eight seconds. Only one ally exists at a time. It uses its current whole-body art and AI against the nearest ordinary hostile; hostiles can turn toward it when it is closer than the player.
- The ally cannot damage 6 Bit or receive his rhythm/stomp attacks. Its ordinary attack commitments deal two damage to hostile bodies, and hostile commitments deal one damage back, with a 900 ms per-attacker contact limit. Conversion does not restore the enemy's health, change the mission quota, or grant a defeat. Actual kills pass through existing score and defeat ownership once.
- Green brackets and a `6 BIT // ALLY` countdown mark allegiance. The last two seconds turn amber and read `CONTROL EXPIRING`. H / Y releases early, including during the cooldown. Expiry/release causes a one-second harmless reboot, then ordinary hostile behavior resumes. Existing grounded H access still applies.
- No nearby eligible target means no puzzle and no cooldown consumption. A target that dies during a correct solution is not replaced with another actor: the link reports lost and allows reacquisition after 1.5 seconds. Failure, timeout and cancellation grant no ally.
- Pause freezes the simulation-owned ally/reboot clocks. Cinematic suppression freezes hostile work; purge and run/boss-retry cleanup remove actors normally. One ally never stalls a gate permanently: its eight-second conversion expires and the player can release it early.
- The existing hacking tutorial has no guaranteed live target. It now explicitly teaches a practice uplink, preserves the objective IDs/input ownership and explains live hijacking, the countdown, release and repair sources. It does not grant a hidden ally charge.

## Replacement health and route

| Item | World placement / ownership |
| --- | --- |
| Repair Cell A | Signal Awning, x=1080, y=450; supported at y=492 |
| Repair Cell B | Tower Awning, x=3480, y=460; supported at y=502 |
| Carrier | First Corrupted in Cache Overpass, encounter_2 index 0; same cartridge drawn beside its body |
| Carrier drop | Exactly one cell at the defeated carrier's street x, center y=780; cleanup/purge never generates a drop |
| Maintenance ledge | x=1390, top y=410, width=128; eases the first upper gap |
| Utility unit | x=3150, top y=650, width=160; later street-to-Tower-Awning re-entry |

Cells restore one of the existing three health bars, remain when full and never expire. Collection requires real body overlap from the accessible side of the surface; it cannot occur through a roof. Actual health change commits collection even if an optional feedback callback fails. New runs restore the cells; boss retry preserves the existing full-health checkpoint and does not respawn earlier pickups.

The cartridge, barcode/cross, carrier attachment, pickup burst, health flash, allegiance brackets, countdown and industrial supports are drawn by the existing Canvas owners using the approved HUD palette. No new remote artwork, character redraw, independent animation loop or audio source owner is introduced. Two short cues use the existing combat-audio bus. The original seven scenery-calibrated surfaces and two-hit Signal Lift remain; added props expose their own real landing geometry.

## Evidence and limits

`tools/check-enemy-hijack.js` exercises real H sessions, locked/lost targets, single-ally ownership, ordinary-enemy AI retargeting, both attack directions, friendly contact/stomps/rhythm exclusion, score/mission attribution, failure/cancel/timeout, pause/release/expiry, repair consumption/drop/reset and forward/reverse traversal using actual Player physics at 30/60/120 Hz. Existing puzzle and controller tests now expect allegiance conversion rather than health/stun; their timing and ownership checks remain.

The full local suite and all-file syntax check are required before publication. Current-head GitHub Actions and source export results belong in the generated receipt. A native Canvas review establishes drawing/layout only; it does not establish Makko rendering, sound or gameplay feel.

## Owner Makko review and normal deployment

Import the exact new PR head and open a fresh Makko preview. Complete/skip the intro normally; exercise the updated H practice and real port/memory puzzles. Lock a Virus, Corrupted and Firewall in separate attempts; confirm slowdown only while solving, one clear ally afterward, attacks against other enemies and no player-friendly fire. Try wrong input, cancellation, a dead target, H release, expiry beside the player, pause/resume and restart. Watch the last-enemy case and ordinary defeat totals/gate release.

At full health, leave a rooftop cell and return injured; collect once. Defeat the marked Cache Overpass carrier, including while allied, and collect its single drop. Check both new climbs and returns, future closed gates, and the original lift, Cat, lore and Amp. Retain Jammer 16 hits, boss handoff/win/loss/full-health retry, music and walk/turn/landing checks.

Record imported SHA, PASS/FAIL and a short clip showing target lock, conversion, an enemy hit, countdown/reboot and one repair pickup. Owner Makko acceptance remains required before this new PR merges; #52 is already merged. After merge, re-import the actual new main merge SHA into Makko, open a fresh preview and repeat the focused route; record merge SHA and evidence. Rollback for this pass is current main `66c17d1880f5de933e9b928833e5dd2bfff6a817`, retaining the merged walk. Earlier pre-walk rollback remains `ea2921960477e38c74740dda378fcb513a8f1cc1`.

Next: tune the eight-second duration, damage exchange and three-cell supply from that playtest. Cloud secrets, traffic hazards, wider campaign work and blanket animation reprocessing remain later scope.
