# BARCODE: SYSTEM OVERRIDE — Source Pack v5

**Current milestone: full-campaign story/continuity planning after merged PR #37.** Main was verified at `38732933713c4f9ec22666e49b728a0626a85f25`. Finishable Level 1, combat/animation/audio repairs, combined polish, discoveries/traffic/targets and written lore/archive are implemented. This review reconciles the later story/cast/Easter-egg direction and changes documents only.

This pack replaces conflicting instructions in v2–v4. It preserves the later approved mission, rhythm, movement, lift and cinematic repairs, consolidates the seven-level campaign direction, and makes current implementation/verification explicit. It is a living project handoff, not an assertion that every planned feature is implemented.

## Start here

1. `PROJECT_INSTRUCTIONS.md` — authority and working rules.
2. `CONTINUATION_PLAN.md` — handoff, source evidence, completed work and all remaining stages.
3. `CAMPAIGN_STORY_MAP.md` — whole-story treatment, 28 record purposes and setup/payoff map.
4. `EASTER_EGGS_AND_CAMEOS.md` and `ASSET_AND_PLATFORM_PLAN.md` — corrected cast, inspiration bank, assets and platforms.
5. `DECISION_REGISTER.md`, `CURRENT_STATE.md` and `ACCEPTANCE.md` — decisions, implementation and verification limits.
6. `ROADMAP.md`, `CAMPAIGN_CONCEPTS.md`, `LORE_AND_CAST.md`, `MUSIC_AND_ART.md` — production and retained boundaries.
7. `UPDATE_PROTOCOL.md` and `CHANGELOG.md` — maintain the same archive and actual revision history.

`SOURCE_MANIFEST.json` is generated from the exact exported Git revision and lists the historical input ZIPs excluded from the export. `FILE_HASHES.sha256` covers the exported files. Automated evidence is included when supplied at build time; missing evidence is not a pass. `repository-snapshot/` preserves repository paths from that same commit, including runtime source, manifests, validation tools and `docs/source-pack/`. The pack documents also appear at this archive's root for convenient reading; both copies have identical bytes. There is no `.git` directory and no nested historical source ZIP.

Use `repository-snapshot/` as the project root for source review or Makko import. To continue development or rebuild from Git, check out the manifest's revision in the canonical repository; this download has no Git history. Makko's engine and externally hosted artwork/audio are dependencies, so the snapshot is not a self-contained offline game.

Canonical project: https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE

The historical v5 starting point was merged PR #25, `7788ebfab4d6231c18229bef9571d6b97b676764`. The current continuation starts from merged #37; the generated manifest identifies this archive's exact branch/head and review status. PR #4 was rejected and remains excluded; its global music-clock implementation is not a prerequisite.

Historical asset registries/contact sheets are retained under `references/` for identification and visual continuity. Their audit dates remain historical. Current runtime asset metadata lives in the exact repository snapshot; do not overwrite it from an older reference.
