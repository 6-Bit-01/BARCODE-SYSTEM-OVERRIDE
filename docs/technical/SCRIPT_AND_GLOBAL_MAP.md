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

## PR-009 semantic action and combat ownership

- `window.BARCODE.ActionInput` is the authoritative Level 1 gameplay action boundary. It maps keyboard and standard gamepad input to `move_left`, `move_right`, `jump`, `primary`, `interact`, `pause`, and `rhythm_mode`.
- Default keyboard bindings are Left/Right or A/D for movement, Space/Up/W for one normal jump, Down Arrow for primary attack, H for interact, P for pause, and R for actual Rhythm Combat Mode.
- Default standard gamepad bindings are left stick or D-pad for movement, A/button 0 for jump, X/button 2 for primary, Y/button 3 for interact, and Start/button 9 for pause.
- `window.BARCODE.playerCombat` is the single authoritative primary-attack transaction. Input requests a semantic primary press, RhythmSystem may supply timing feedback, and PlayerCombat resolves targets and applies damage once per eligible target.
- Down Arrow rhythm attacks are beat-gated: Rhythm Combat Mode must be active, the track/transport must be ready, and only successful approved judgments damage targets. Miss, unavailable, no-grid, degraded, not-ready, inactive, or cooldown inputs deal zero damage.
- Dash and fast-fall/stomp are removed from active production controls. Down Arrow is the primary attack, not fast-fall. Hacking requires an explicit nearby interaction target; global H no longer starts hacking anywhere in the level.
- Final attack art, hitbox tuning, range tuning, and encounter feel remain deferred to the authored Level 1 presentation pass.

- Tutorial Space and jump are mutually exclusive while the tutorial is active; Space is consumed by tutorial dialogue/objective handling and Up/W remain jump inputs. Each level entry path explicitly selects its own music profile rather than relying on a global Level 1 fallback. Passive top-down landing stomp is intentional and lethal.
