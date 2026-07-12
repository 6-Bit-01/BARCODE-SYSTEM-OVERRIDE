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
36. `src/game/main-new.js`
37. inline script block

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

- Inline `index.html` starts boot-loader monitoring on `DOMContentLoaded` and calls `window.startGame()` from the start button flow.
- `src/game/main-new.js` defines `autoInitGame`, but static inspection shows inline `index.html` sets `window.autoStartDisabled = true` at the end of the inline block.
- Inactive files contain older boot/start paths and should be re-audited before use.

## Static code inference: update/render/collision ownership candidates

- `src/core/loop.js` calls `window.updateGame`, `window.renderer.update`, and `window.renderGame` every active frame.
- `src/game/update-coordinator.js` coordinates player, enemy, systems, visual systems, progression, objectives, audio, tutorial, lost data, lore, and game-condition updates.
- Enemy collision checks appear in the update coordinator and in enemy manager implementations.

## Confirmed repository fact: timer/interval/listener hotspots

Hotspots include inline `index.html`, `src/engine/audio.js`, `src/engine/boot-loader.js`, `src/engine/cutscene.js`, `src/engine/particles.js`, `src/engine/renderer.js`, `src/engine/title-screen.js`, `src/game/game-initializer.js`, `src/game/game-state.js`, `src/game/player.js`, `src/game/enemies.js`, `jammer-fix-patch.js`, `src/game/hacking.js`, `src/game/rhythm.js`, `src/game/tutorial.js`, `src/game/jammer-spawn-logic.js`, `src/game/collision-fix.js`, `src/core/input.js`, `src/core/fullscreen.js`, `src/core/loop.js`, and `src/game/main-new.js`.

## Inventory only: diagnostic/legacy candidates

The generated inventory lists candidate diagnostic/legacy files. This is inventory only and not a deletion decision.

## Not runtime-tested

No browser or Makko execution was performed by Codex.
