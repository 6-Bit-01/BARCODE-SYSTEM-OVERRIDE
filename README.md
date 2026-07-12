# BARCODE: System Override

BARCODE: System Override is in a repository-baseline/revival state. This branch documents what is present in Git, adds dependency-free static validation, and avoids gameplay or asset changes.

## Entrypoint

The browser entrypoint is `index.html`. It loads legacy global scripts directly with `<script>` tags; there is no bundler and no ES module conversion in this baseline.

## Runtime dependency uncertainty

`index.html` references `/lib/MakkoEngine.min.js`, but that file is not present in this repository. Static checks report this as a missing first-party runtime path. It may be supplied by Makko or the host environment, but Codex has not runtime-verified that.

## Loaded architecture, statically observed

The active page loads utility/core files, engine systems, game systems, `jammer-fix-patch.js`, `src/game/collision-fix.js`, and `src/game/main-new.js`. Static inspection identifies coordinator-style ownership for the frame loop, update pass, render pass, and game start path.

Known duplicate or competing global ownership is documented in `docs/technical/SCRIPT_AND_GLOBAL_MAP.md` and the generated inventory.

## Validation commands

```bash
npm ci
npm test
npm run check:syntax
npm run audit:syntax:all
npm run check:syntax:all
npm run audit:paths
npm run audit:globals
npm run audit:external-assets
npm run baseline:generate
npm run baseline:check
```

`npm test` validates the active static runtime surface and deterministic baseline. `npm run audit:syntax:all` prints inactive syntax failures in report-only mode. `npm run check:syntax:all` is expected to fail while the documented inactive syntax errors remain.

## Codex + owner workflow

Codex prepares static, non-destructive repository changes. The owner duplicates/tests the Makko project and reports `PASS`, `FAIL`, or `PASS WITH NOTES` before merge. Codex has not verified browser/Makko gameplay in this baseline.

## Technical baseline

- `docs/technical/LEGACY_BASELINE.md`
- `docs/technical/KNOWN_ISSUES.md`
- `docs/technical/MAKKO_HANDOFF.md`
- `docs/technical/SCRIPT_AND_GLOBAL_MAP.md`
- `docs/technical/baseline-inventory.json`
- `docs/technical/baseline-exceptions.json`

Historical root summaries from before PR-001 are preserved under `docs/archive/pre-pr001/`.

## What this baseline does not claim

This README does not claim that features, controller support, boss flow, audio, Makko import, browser gameplay, or the full game have been runtime-verified. It also does not make design authority out of current drift such as City Scrambler, the 20-kill jammer gate, fast-fall/stomp code, dormant boss hooks, or prior README claims.
