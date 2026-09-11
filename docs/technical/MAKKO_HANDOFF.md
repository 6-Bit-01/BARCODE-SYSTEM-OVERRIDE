# Makko Handoff — Level 1 Boss Milestone

Status: `agent/level1-playtest-repairs`, repairing the failed first PR #27 playtest; no Makko PASS is claimed. Read the generated archive manifest for the exact base/head revision and the test evidence for what automated checks actually ran.

The branch preserves the existing intro and Level 1 mission, then extends the boss entrance into combat, a quick boss retry and a Level 1 completion result. No later level or persistent campaign save should be inferred from this endpoint. Final boss identity is still open.

## Import and short regression route

1. Duplicate/back up the current Makko project and import the exact supplied branch/revision into the duplicate.
2. Open the project and confirm title plus locked prologue still display correctly.
3. Hold right and try jumping past the opening gate during tutorial; it must stop you before the first encounter exit. Check tutorial Space advances without jumping; H/R unlock at their steps. Confirm timing is already running when R becomes available.
4. Check both movement keys cancel and release resumes the remaining direction; single jump, ordinary enemy contact damage and lethal passive stomp still work.
5. Read the nearby R + Down on-beat lift prompt. Charge/ride the Signal Lift with two successful rhythm hits. Check feet/roof contact and camera coverage against the approved art.
6. Complete the normal mission at least once: 20 post-tutorial defeats, opposite-half Jammer, sixteen rhythm hits and the established boss entrance. The Jammer attack area must be clear of the lift.

## Current boss controls and first-pass behavior

The generic boss starts at 12 health after a 1.4-second ready pause. It warns before an outward ground-pulse attack, then exposes a cyan recovery window. Successful rhythm attacks deal one health in that window; a descending stomp can also deal one health, at most once per recovery, and rebounds the player. Guarded/repeated top landings also rebound safely without boss damage. At half health or lower the warning/recovery tighten and a second pulse follows. These are first-pass tuning values awaiting playtest, not final balance approval. Signal Amp remains an ordinary-enemy effect.

| Screen | Control | Result |
|---|---|---|
| Player defeated by boss | Space | Retry the boss checkpoint at fair restored state |
| Player defeated by boss | Shift + Space | Restart the whole level |
| Level 1 complete | Enter | Boss rematch |
| Level 1 complete | Space | Restart the whole level |

For a duplicate-project repeat test, the existing development panel has **Go / Reset Boss** and the documented development API exposes `DEBUG.level1.gotoBoss`; boss diagnostics report phase, health, pulses and checkpoint status. Use normal controls for the actual acceptance run.

## Boss acceptance route

1. Watch walk/idle/flourish for consistent body scale and foot alignment. The boss must remain at its world mark during camera return, then walk toward the player through normal pursuit, even offscreen. Confirm combat starts only after the camera/control handoff. Watch each attack's warning, active damage and recovery; identify a safe response before trying to win.
2. Verify successful rhythm attacks can damage the boss in intended windows; missed timing/inactive R cannot. Try the intended stomp opening and check that ordinary-enemy stomp remains unchanged.
3. Take damage, pause during pressure, resume and deliberately lose. Use the offered retry and confirm a clean boss checkpoint: restored fair health/state, no old hazards, no twenty-enemy replay, no repeated intro.
4. Win. Confirm the level-complete result occurs once and ends danger. Check available end-screen actions match their labels and do not claim an unimplemented Level 2.
5. Restart the full level and confirm the tutorial/mission state, lift, Jammer, music and boss all reset. Listen for duplicate music, silent layers or drift across pause/retry.

Development-only shortcuts may speed repeated boss checks, but never replace one normal-route verification. Enable only documented debug hooks in a duplicate test project and disable them for normal play.

## Report

Return `PASS`, `FAIL`, or `PASS WITH NOTES`, the exact tested revision, where any issue occurred, and a screenshot/video when alignment or timing is involved. Automated Node/VM checks cannot settle those visual/audio questions. Owner Makko testing remains required before merge.

## Recovery

Keep the original Makko project as the working fallback. If the duplicate fails, return to the original and report the tested revision; do not overwrite the good project. For Git, inspect the branch diff and use a normal revert of the milestone if already merged, preserving later unrelated work. Before merge, simply keep using the known-good `main` revision.
