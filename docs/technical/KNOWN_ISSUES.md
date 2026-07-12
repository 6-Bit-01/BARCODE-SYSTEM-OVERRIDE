# Known Issues

## Confirmed repository fact

- Missing first-party runtime path: `/lib/MakkoEngine.min.js` from `index.html`.
- Archived inactive syntax failure: `src/core/boot.js` was not loaded by `index.html` and, after owner Makko testing found Makko parses every `.js` file, was moved byte-for-byte to `docs/archive/pre-pr001/inactive-source/src/core/boot.js.txt`.
- Archived inactive syntax failure: `src/core/game/game-manager.js` was not loaded by `index.html` and, after owner Makko testing found Makko parses every `.js` file, was moved byte-for-byte to `docs/archive/pre-pr001/inactive-source/src/core/game/game-manager.js.txt`.
- Loaded duplicate enemy globals: `src/game/enemies.js` and `jammer-fix-patch.js` both define `window.Enemy`, `window.EnemyManager`, and initialize `window.enemyManager`.

## Static code inference

- `src/core/loop.js` directly updates `window.renderer`, while update coordination also owns visual-system updates; this may represent competing per-frame ownership.
- Enemy collision checks appear in the update coordinator and inside the enemy manager implementation; this may represent competing collision ownership.
- Several inactive files contain older lifecycle paths that should not be treated as current authority without re-audit.
- Static inspection identifies `index.html` as the active lifecycle owner for boot monitoring and the start-button sequence; the single-flight guard and monitor cleanup reduce duplicate-start risk but do not replace Owner/Makko verification.

## Not runtime-tested

- The practical runtime effect of duplicate enemy definitions has not been measured in Makko/browser.
- External asset reachability was not network-validated; hosts were inventoried statically only.

## Owner/Makko verification required

- Confirm title presentation, prologue, gameplay feel, audio, camera, sprites, and restart are unchanged after importing this branch into a duplicate Makko project.
- Specifically test rapid start-button clicks/Space presses, failed-start retry UI, prologue presentation, gameplay entry, and restart behavior.
