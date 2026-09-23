# BARCODE: System Override

A BARCODE simulation built around seven distinct retro game genres and the original four: 6 Bit, DJ Floppydisc, Cache Back and Mac Modem.

## Current state

Read [CURRENT_STATE.md](docs/source-pack/CURRENT_STATE.md) and [the acceptance route](docs/source-pack/ACCEPTANCE.md) for the active review. Level 1 and its Cache Back handoff are playable. A clearly labeled Broadcast Slum development preview starts from that handoff; the current combat follow-up adds roof shield nodes, counter surges, varied defenders and a temporary scatter pickup after the owner's first playtest of merged #88. The Cache Line remains Level 2 in story order.

The preview grants no later campaign completion or Drums key. Its owner Makko/audio/controller feel review is pending. The Cache Line and later story routes remain planned.

## Runtime and checks

The browser entrypoint is `index.html`, loading namespaced/global JavaScript without a bundler. Makko supplies `/lib/MakkoEngine.min.js`, which is not in Git. External artwork/audio remain host dependencies; the repository is not a standalone offline build.

```bash
npm ci
npm test
npm run check:syntax:all
```

The dependency-free suite exercises production logic through explicit host boundaries and audits source/lifecycle/input/combat/music/discovery behavior. All JavaScript, including inactive files, must parse for Makko. Automated checks do not establish live rendering, audio synchronization, control feel or supported-device performance.

## Development and source pack

Read [AGENTS.md](AGENTS.md) and [project instructions](docs/source-pack/PROJECT_INSTRUCTIONS.md). Codex implements coherent reviewable milestones; the owner tests gameplay changes in Makko before merge. Preserve the current mechanics and discoveries. Production logic checks and layout diagnostics do not replace that gameplay review.

The maintained [v5 source pack](docs/source-pack/README.md) exports an exact committed tree through `tools/build-source-pack.py`; CI publishes a revision-named archive artifact. [The update protocol](docs/source-pack/UPDATE_PROTOCOL.md) governs the current downloadable archive and merge receipts. Attached v2–v4 packs and old audit reports are provenance, not current implementation commands. Historical technical records remain under `docs/technical/` and `docs/archive/`.
