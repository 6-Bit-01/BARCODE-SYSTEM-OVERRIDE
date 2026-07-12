# Legacy Baseline

## Confirmed repository fact

- Local `HEAD` and `origin/main` were confirmed at `a2f1e81b61d0fde4fdabc41c597bf44910911c2f` before implementation.
- `index.html` is the browser entrypoint.
- `/lib/MakkoEngine.min.js` is referenced by `index.html` and absent from the repository.
- Historical root reports were moved to `docs/archive/pre-pr001/`; the previous root `README.md` was copied there before replacement.

## Static code inference

- The repository contains active global-script runtime code plus inactive legacy/diagnostic files.
- `jammer-fix-patch.js` substantially overlaps the loaded enemy system and redefines enemy globals after `src/game/enemies.js`.

## Not runtime-tested

- Codex did not launch the game in a browser or Makko.
- Audio, sprites, controls, camera, prologue playback, game feel, and restart behavior require owner testing.

## Owner/Makko verification required

- Confirm Makko supplies or tolerates the missing `/lib/MakkoEngine.min.js` path.
- Confirm added docs/tools do not interfere with Makko project import/open.
