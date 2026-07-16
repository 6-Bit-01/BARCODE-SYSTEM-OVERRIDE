# Script and Global Map

## Confirmed repository fact: exact script order

1. `/lib/MakkoEngine.min.js`
2. `src/utils/math.js`
3. `src/core/fullscreen.js`
4. `src/core/input.js`
5. `src/engine/audio.js`
6. `src/engine/boot-loader.js`
7. `src/engine/particles.js`
8. `src/engine/renderer.js`
9. `src/engine/parallax.js`
10. `src/engine/spaceships.js`
11. `src/engine/lore.js`
12. `src/engine/jammer-indicator.js`
13. `src/engine/jammer-arrow-indicator.js`
14. `src/engine/title-screen.js`
15. `src/game/objectives.js`
16. `src/engine/cutscene.js`
17. `src/core/loop.js`
18. `src/game/player.js`
19. `src/game/enemies.js`
20. `src/game/jammer-spawn-logic.js`
21. `src/game/hacking.js`
22. `src/game/rhythm.js`
23. `src/game/tutorial.js`
24. `src/game/post-tutorial-objectives.js`
25. `src/game/lost-data.js`
26. `src/game/sector1-progression.js`
27. `src/game/game-state.js`
28. `src/game/update-coordinator.js`
29. `src/game/render-coordinator.js`
30. `src/game/ui-manager.js`
31. `src/game/game-initializer.js`
32. `src/game/dependency-validator.js`
33. `src/game/debug-commands.js`
34. `jammer-fix-patch.js`
35. `src/game/collision-fix.js`
36. inline script block: `window.autoStartDisabled = true`
37. `src/game/main-new.js`
38. inline script block

## Confirmed repository fact: loaded/unloaded status

Loaded and unloaded JavaScript files are listed in `baseline-inventory.json`.

## Confirmed repository fact: critical globals

- `window.startGame`: loaded owner `src/game/main-new.js`; inactive competing owner `src/game/main.js`.
- `window.startNewGame`: loaded owner `src/game/main-new.js`; inactive manager method remains in `src/core/game-manager.js`. The separate syntax-failing inactive file `src/core/game/game-manager.js` was archived as `docs/archive/pre-pr001/inactive-source/src/core/game/game-manager.js.txt` after owner Makko testing confirmed Makko parses repository `.js` files even when they are not loaded by `index.html`.
- `window.startGameInitialization`: loaded owner `src/game/game-initializer.js`; inactive competing owner `src/game/main.js`.
- `window.gameLoop` and `window.startGameLoop`: loaded owner `src/core/loop.js`.
- `window.updateGame`: loaded owner `src/game/update-coordinator.js`.
- `window.renderGame`: loaded owner `src/game/render-coordinator.js`.
- `window.Enemy`, `window.EnemyManager`, `window.enemyManager`: loaded definitions in both `src/game/enemies.js` and later `jammer-fix-patch.js`.

## Static code inference: startup path candidates

- Inline `index.html` sets `window.autoStartDisabled = true` before `src/game/main-new.js` loads, starts boot-loader monitoring on `DOMContentLoaded`, and calls `window.startGame()` from the start button flow.
- `src/game/main-new.js` defines `autoInitGame`, but static inspection shows the active lifecycle owner is the `index.html` start-button flow because auto-start is disabled before that file evaluates.
- The active start-button flow is single-flight guarded before its first `await`; reentrant click/Space attempts are ignored while startup is in progress or already initialized.
- `src/game/game-initializer.js` coalesces overlapping `initSprites`, `initAudio`, and `startGameInitialization` calls with in-flight promises; successful full-system initialization is reusable and failed attempts clear the in-flight promise for retry.
- Inactive files contain older boot/start paths and should be re-audited before use.

## Static code inference: update/render/collision ownership candidates

- `src/core/loop.js` calls `window.updateGame`, `window.renderer.update`, and `window.renderGame` every active frame.
- `src/game/update-coordinator.js` coordinates player, enemy, systems, visual systems, progression, objectives, audio, tutorial, lost data, lore, and game-condition updates.
- Enemy collision checks appear in the update coordinator and in enemy manager implementations.

## Confirmed repository fact: timer/interval/listener hotspots

Hotspots include inline `index.html` (including boot-monitor cleanup ownership), `src/engine/audio.js`, `src/engine/boot-loader.js`, `src/engine/cutscene.js`, `src/engine/particles.js`, `src/engine/renderer.js`, `src/engine/title-screen.js`, `src/game/game-initializer.js`, `src/game/game-state.js`, `src/game/player.js`, `src/game/enemies.js`, `jammer-fix-patch.js`, `src/game/hacking.js`, `src/game/rhythm.js`, `src/game/tutorial.js`, `src/game/jammer-spawn-logic.js`, `src/game/collision-fix.js`, `src/core/input.js`, `src/core/fullscreen.js`, `src/core/loop.js`, and `src/game/main-new.js`.

## Inventory only: diagnostic/legacy candidates

The generated inventory lists candidate diagnostic/legacy files. This is inventory only and not a deletion decision.

## Not runtime-tested

No browser or Makko execution was performed by Codex.

## PR #7 runtime lifecycle ownership update

- `window.BARCODE.RuntimeLifecycle`: loaded owner `src/core/runtime-lifecycle.js`; authoritative runtime states are `idle`, `starting`, `running`, `paused`, `stopping`, and `failed` with an explicit allowed-transition table.
- The `index.html` start button is now a user-gesture adapter: it resets visible retry text, requests fullscreen synchronously, and delegates first Start or failed retry to `RuntimeLifecycle`. It no longer owns the manual parallax/spaceship/lore/lost-data/cutscene initialization sequence.
- `src/game/game-initializer.js` remains the single-flight shared initializer for sprites/audio/base systems; `RuntimeLifecycle` is the caller that decides when that initializer participates in first Start, retry, or restart.
- `src/game/main-new.js` retains `window.startGame`, `window.autoInitGame`, and `window.startNewGame` only as compatibility delegates to `RuntimeLifecycle`; they do not schedule frames or initialize gameplay independently.
- `src/core/loop.js` remains the only active gameplay `requestAnimationFrame` owner. RuntimeLifecycle calls `startGameLoop`, `pauseGame`, `resumeGame`, and `stopGame` without adding another frame scheduler.
- `src/core/input.js` routes active `P` pause/resume and game-over Space restart directly to `RuntimeLifecycle` instead of relying on the broad legacy `window.handleGameAction` implementation in inactive `src/game/main.js`.
- The lifecycle feature card named PR #6 in the v4 source pack is implemented as PR #7 because PR #6 became the approved Makko music/rhythm hotfix.

## PR #7 review-fix lifecycle notes

- Runtime pause is audio-first and atomic: gameplay frames are not canceled until `AudioSystem.pauseRuntimeAudio()` has either fully paused audio/transport or rolled back partial audio state.
- Restart from `running` and from `paused` uses `AudioSystem.prepareRestartAudio()` to resume a suspended context if needed, stop old gameplay sources, stop stale transport state, and then start one fresh gameplay music/rhythm session through the lifecycle restart initializer.
- Cutscene, hacking, and spaceship systems expose diagnostics for lifecycle-owned delayed callbacks so the owner can inspect whether stale timers/listeners remain after stop/restart cycles.

## PR #7 follow-up correction map

- `src/game/game-state.js` owns terminal gameplay flags and pending initial-enemy spawn handles; RuntimeLifecycle calls its narrow reset/cancel helpers during restart/stop instead of re-running full `initGameState()` when progress should be preserved.
- `src/engine/audio.js` owns run-audio generation and run-timeout registration for delayed beat, layer-update, verification, fade, and 211-second restart callbacks.
- `tools/check-music-profiles.js` is static-only source inspection; it must not execute `src/` browser runtime files.
