# Script and Global Map

`index.html` remains the browser entrypoint and loads Makko-hosted browser globals directly; no bundler or module conversion is introduced.

## Active script-order summary

The active Level 1 runtime now loads `src/game/enemies.js` once and then `src/game/jammer-environment.js`. Superseded late enemy override, Jammer spawn patch, and collision patch files are no longer active script-order participants.

## Enemy globals

- `window.Enemy`: single active enemy class in `src/game/enemies.js` for Virus, Corrupted, and Firewall only.
- `window.EnemyManager`: single active manager class in `src/game/enemies.js`.
- `window.enemyManager`: created idempotently once by `src/game/enemies.js`; repeated initialization returns the stable instance instead of replacing live state.

`EnemyManager.update(deltaMs, player)` owns enemy simulation, enemy/enemy separation, enemy/player collision, enemy cleanup, and authoritative defeat events. Manager API boundaries use milliseconds; local integration may convert to seconds in variables named `dt`.

## Jammer globals

- `window.BARCODE.JammerEnvironment`: environmental owner in `src/game/jammer-environment.js`.

The Jammer is not in `enemyManager.enemies`, is not returned by `getActiveEnemies()`, and has no enemy health, damage, kill credit, point value, hurtbox, stomp path, rhythm-hit path, or target-selection path. Its supported operations are `initialize`, `reveal`, `trigger`, `reset`, `dispose`, `update`, `draw`, `getStatus`, `getDiagnostics`, and `getPosition`.

## Runtime lifecycle integration

`BARCODE.RuntimeLifecycle` clears/disposes enemy state and resets/disposes `BARCODE.JammerEnvironment` during reset, stop, failure cleanup, and restart paths. Diagnostics include enemy manager counts and Jammer environmental status.
