# BARCODE: System Override

A BARCODE simulation built around seven distinct retro game genres and the original four: 6 Bit, DJ Floppydisc, Cache Back and Mac Modem.

## Current state

Read [CURRENT_STATE.md](docs/source-pack/CURRENT_STATE.md) and [the acceptance route](docs/source-pack/ACCEPTANCE.md) for the active review. Level 1 and its Cache Back handoff are playable. A clearly labeled Broadcast Slum development preview starts from that handoff; merged #89 added roof shield nodes, counter surges, varied defenders and temporary scatter. The current review adds debug access to both levels. The Cache Line remains Level 2 in story order.

The preview grants no later campaign completion or Drums key. Its owner Makko/audio/controller feel review is pending. The Cache Line and later story routes remain planned.

For a quick test route, start Level 1 and open its `DEV` panel at the lower left (or press Shift+F1). Choose **Complete Level 1**, then enter the Broadcast Slum preview from Cache Back. Console command after unlocking: `DEBUG.level1.completeLevel()`. In the preview, open `DEV 3` (or Shift+F1) for relay checkpoints, recovery and **Complete Preview**; console command: `DEBUG.level3.completeProof()`. The Level 1 shortcut grants the handoff and Voice without a best result or challenge record. The preview clear grants no Drums or Level 3 campaign completion.

## Runtime and checks

The browser entrypoint is `index.html`, loading namespaced/global JavaScript without a bundler. Makko supplies `/lib/MakkoEngine.min.js`, which is not in Git. External artwork/audio remain host dependencies; the repository is not a standalone offline build.

```bash
npm ci
npm test
npm run check:syntax:all
```

The dependency-free suite exercises production logic through explicit host boundaries and audits source/lifecycle/input/combat/music/discovery behavior. All JavaScript, including inactive files, must parse for Makko. Automated checks do not establish live rendering, audio synchronization, control feel or supported-device performance.

## Development and source pack

Read [AGENTS.md](AGENTS.md) and [project instructions](docs/source-pack/PROJECT_INSTRUCTIONS.md). The [Cache Road opening](docs/source-pack/CACHE_ROAD_AUTHORED_OPENING.md) teaches its delivery goal and controls during the drive. The owner imports merged, CI-checked changes into Makko to test gameplay. Preserve the current mechanics and discoveries. Production logic checks and layout diagnostics do not replace that gameplay review.

The maintained [v5 source pack](docs/source-pack/README.md) exports an exact committed tree through `tools/build-source-pack.py`; CI publishes a revision-named archive artifact. [The update protocol](docs/source-pack/UPDATE_PROTOCOL.md) governs the current downloadable archive and merge receipts. Attached v2–v4 packs and old audit reports are provenance, not current implementation commands. Historical technical records remain under `docs/technical/` and `docs/archive/`.
