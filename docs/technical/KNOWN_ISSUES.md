# Known Issues

## Confirmed repository fact

- Missing first-party runtime path: `/lib/MakkoEngine.min.js` from `index.html`.
- Archived inactive syntax failure: `src/core/boot.js` was not loaded by `index.html` and, after owner Makko testing found Makko parses every `.js` file, was moved byte-for-byte to `docs/archive/pre-pr001/inactive-source/src/core/boot.js.txt`.
- Archived inactive syntax failure: `src/core/game/game-manager.js` was not loaded by `index.html` and, after owner Makko testing found Makko parses every `.js` file, was moved byte-for-byte to `docs/archive/pre-pr001/inactive-source/src/core/game/game-manager.js.txt`.
- Loaded duplicate enemy globals: `src/game/enemies.js` and `jammer-fix-patch.js` both define `window.Enemy`, `window.EnemyManager`, and initialize `window.enemyManager`.
- Active enemy override order: `index.html` loads `jammer-fix-patch.js` after `src/game/enemies.js`, so the late-loaded `jammer-fix-patch.js` definitions are the active enemy classes and manager.
- Confirmed active enemy movement debt: the active `jammer-fix-patch.js` enemy implementation applies base `Enemy.update()` position integration and also contains behavior-level position integration for virus entrance, corrupted entrance, and firewall movement. PR-003 intentionally preserves this behavior to avoid an untested enemy tuning change.

## Static code inference

- Several inactive files contain older lifecycle paths that should not be treated as current authority without re-audit.
- Static inspection identifies `index.html` as the active lifecycle owner for boot monitoring and the start-button sequence; the single-flight guard and monitor cleanup reduce duplicate-start risk but do not replace Owner/Makko verification.
- Enemy movement consolidation should be assigned to PR-006, where enemy behavior and encounter direction can be tested together with any single-integration refactor.

## Not runtime-tested

- The practical gameplay feel of the active duplicate enemy integration has not been measured in Makko/browser.
- External asset reachability was not network-validated; hosts were inventoried statically only.

## Owner/Makko verification required

- Confirm title presentation, prologue, gameplay feel, audio, camera, sprites, and restart are unchanged after importing this branch into a duplicate Makko project.
- Specifically test rapid start-button clicks/Space presses, failed-start retry UI, prologue presentation, gameplay entry, pause/resume, and restart behavior.
