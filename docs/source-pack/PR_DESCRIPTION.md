# Complete the approved Level 1 polish pass (1–9)

The owner approved one combined pass to make combat feedback, the city, pickups and the existing pause/completion screens clearer and more useful. This builds on merged PR #34 and preserves its Makko animation/contact and SFX repairs.

The three saved implementation checkpoints together add:

1. Bounded elapsed-time impact shake and health/source indicators driven by accepted damage.
2. Enemy warning symbols and ground arrows that follow committed attacks.
3. Signal Amp artwork drawn in Canvas, pickup announcement, actual charge pips and depletion feedback.
4. Scanning barcode gates with a short collapse after the real gate unlocks.
5. Four storefront equalizer patterns, downbeat/combo accents and traveling curb lights.
6. Sparse art-aligned steam, dust, cable sparks and neon spill with caching/culling and quieter decoration near warnings.
7. Lost Data beacons and assembled pieces flying to the counter through the actual camera/zoom projection.
8. A useful pause screen: controls, rhythm-exit reminder, keyboard/pointer audio sliders and saved shake/flash/CRT preferences. Menu inputs cannot become resumed attacks/movement; deliberate pause keeps audio suspended.
9. An animated breakdown of real score, whole-run best combo and fragments. Boss retry preserves the run's collection and best combo; full restart clears run totals.

Particle drawing/logging cleanup removes avoidable allocations, routine logs and the old startup test burst. Existing artwork/audio URLs, mission quota, two-hit lift, 16-hit Jammer, boss balance, tutorial access locks and continuous hidden rhythm remain. Music volume uses an additional user gain without changing the original default mix. Authored lore, traffic animation and target previews remain follow-ons.

Validation: `npm test`, `npm run check:syntax:all`, and the responsive-combat suite against the actual downloaded Makko animation runtime passed at the source receipt's revision. Production-owner checks cover pause/input/audio ownership, collection/retry/reset and all combined effects. Native Canvas diagnostics were inspected. These checks do not establish audible mix, host FPS or Makko gameplay feel.

Makko acceptance before merge:

1. Import the published head into the duplicate project. Check opening/landing, tutorial Space/H/R locks, opposite-direction movement and ordinary head/side contact. Listen to rhythm/action SFX under music.
2. Take accepted and immune hits. Watch lost health/source feedback, enemy committed arrows and Swooper aim. Collect/use/deplete the Amp.
3. Clear all four gates; passage should open immediately while energy collapses. Compare R-off/R-on storefronts, downbeats/combos, sparse atmosphere and quieter boss decoration.
4. Collect Lost Data while the camera/zoom changes. Confirm one reward/lore entry, flight arrival and pause/resume. Check the lift, Jammer exit cinematic and original boss tuning.
5. Press P during movement/combat. Adjust sliders by keyboard/pointer, mute Music/SFX, toggle effects, resume with no leaked input, then reload/restart to verify settings persist.
6. Lose/retry and win/rematch. Check whole-run best combo and fragment totals, including a fragment collected after the boss checkpoint. Space full-restarts and clears run totals. Record SHA, project/device, PASS/FAIL and any disputed damage clip.

Base/rollback: `85a0b32c530d9fc04fab91ef4e3d18ef88ee8249` (merged #34). Head/PR URL belong in the published receipt and generated manifest. This remains a draft until owner Makko acceptance; after merge, import the actual main merge SHA and repeat opening/contact/audio and pause/retry smoke checks.
