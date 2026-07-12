# Makko Handoff

## Confirmed repository fact

This PR adds documentation and Node standard-library validation tooling. It does not intentionally alter existing runtime/game/art/asset files.

## Five-minute owner route

1. Duplicate/back up the current Makko project.
2. Sync/import `codex/pr-001-baseline-prep` into the duplicate only.
3. Confirm the project opens.
4. Confirm the title art/presentation is unchanged.
5. Start the game and confirm the 11-entry prologue images/words/presentation are unchanged.
6. Reach gameplay and confirm movement, rhythm, hacking, enemies, objectives, camera, audio, and sprites feel exactly as before.
7. Restart once and note any new error.
8. Report `PASS`, `FAIL`, or `PASS WITH NOTES`.

## Not runtime-tested

Codex did not perform Makko/browser gameplay testing.

## Rollback

If this branch causes Makko import or runtime trouble, close the duplicate project and return to the original Makko project. In Git, switch back to `main` or reset the test branch to `origin/main`.
