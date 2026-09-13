# BARCODE: System Override

A BARCODE simulation built around seven distinct retro game genres and the original four: 6 Bit, DJ Floppydisc, Cache Back and Mac Modem.

## Current state

The main runtime through merged PR #37 contains a finishable Level 1: tutorial and authored encounters, rhythm combat/hacking, rooftops and lift, Jammer-to-boss transition, retry/completion, musical scenery and combat feedback, animated traffic, saved pause settings, three persistent lore discoveries and their reading archive. Levels 2–7 and full campaign routing/resume are planned, not implemented.

The opening's current repair builds on merged PR #40 after the owner reported a context-limit error and missing pictures. It caches the intro canvas context, supplies verified pinned image delivery, places comic dialogue within the eight model-based scenes, and rewrites the real tutorial as the crew-channel continuation. Read [the repair and limits](docs/source-pack/INTRO_REPAIR.md), [the complete street conversation](docs/source-pack/INTRO_TO_LEVEL_01.md), [opening previews](docs/source-pack/INTRO_OVERHAUL.md) and [acceptance route](docs/source-pack/ACCEPTANCE.md). Live Makko acceptance of this repair is pending.

The broader [continuation plan](docs/source-pack/CONTINUATION_PLAN.md), [whole-story map](docs/source-pack/CAMPAIGN_STORY_MAP.md), [cameos and Easter eggs](docs/source-pack/EASTER_EGGS_AND_CAMEOS.md), and [asset/platform plan](docs/source-pack/ASSET_AND_PLATFORM_PLAN.md) remain authoritative. The owner's next request is HUD/rhythm presentation and less repetitive attacks, after the intro; Stage C campaign/save/mixer services follow.

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
