# Known Issues

## Confirmed repository fact

- Missing first-party runtime path: `/lib/MakkoEngine.min.js` from `index.html`.
- Inactive syntax failure: `src/core/boot.js`.
- Inactive syntax failure: `src/core/game/game-manager.js`.
- Loaded duplicate enemy globals: `src/game/enemies.js` and `jammer-fix-patch.js` both define `window.Enemy`, `window.EnemyManager`, and initialize `window.enemyManager`.

## Static code inference

- `src/core/loop.js` directly updates `window.renderer`, while update coordination also owns visual-system updates; this may represent competing per-frame ownership.
- Enemy collision checks appear in the update coordinator and inside the enemy manager implementation; this may represent competing collision ownership.
- Several inactive files contain older lifecycle paths that should not be treated as current authority without re-audit.

## Not runtime-tested

- The practical runtime effect of duplicate enemy definitions has not been measured in Makko/browser.
- External asset reachability was not network-validated; hosts were inventoried statically only.

## Owner/Makko verification required

- Confirm title presentation, prologue, gameplay feel, audio, camera, sprites, and restart are unchanged after importing this branch into a duplicate Makko project.
