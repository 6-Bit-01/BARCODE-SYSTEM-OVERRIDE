# BARCODE: SYSTEM OVERRIDE — Source Pack v5

## Latest correction — restrict bonks to the four red-circled objects

Start with `CIRCLED_BONK_CORRECTION.md`. Unmarked platform undersides are open again; the two circled striped awnings, two circled gray steps and separately approved elevator roof retain head contact. Earlier blanket-bonk descriptions are superseded. The manifest/receipt record the exact review SHA, PR and checks; owner Makko acceptance is pending.

## Latest review build — controller drops, boss victory and twelve-second allies

This follow-up to merged #71 prevents accidental controller platform drops and invisible victory rematches, and extends hacked allies to twelve seconds. Start with `CONTROLLER_VICTORY_ALLY_PASS.md` and the current `ACCEPTANCE.md` route. The manifest/receipt identify the exact review revision, PR and check results. Previous build entries are historical; physical-controller and Makko acceptance remain pending.

## Latest review build — solid ledges and enemy pancakes

This pack contains the follow-up to merged #70 on `agent/solid-awnings-lift-roof`: awning/ledge bonks, a solid moving roof for all actors, and visible enemy squashing beneath the descending elevator. Start with `SOLID_LEDGES_SMUSH_PASS.md`; inspect `review-solid-ledges/solid-ledges-smush.mp4`. The generated manifest and validation receipt identify the exact review commit and PR. Older current-work entries are historical; owner Makko acceptance remains pending.

**Current milestone: Stage B crew link and Level 1 controls/readability after merged PR #38.** Base: `0d1882f6b6eebf6fc5704d8a3270f2a6b1fb7354`. The whole-campaign plan is merged; `STORY_CONTROLS_PASS.md` records this combined gameplay review. Exact exported head/PR/validation is in the manifest and receipt. Makko acceptance remains pending.

This pack replaces conflicting instructions in v2–v4. It preserves the later approved mission, rhythm, movement, lift and cinematic repairs, consolidates the seven-level campaign direction, and makes current implementation/verification explicit. It is a living project handoff, not an assertion that every planned feature is implemented.

## Start here

1. `PROJECT_INSTRUCTIONS.md` — authority and working rules.
2. `STORY_CONTROLS_PASS.md` — current implemented pass, controls, timing and Makko route; `CONTINUATION_PLAN.md` — all campaign stages and source evidence.
3. `CAMPAIGN_STORY_MAP.md` — whole-story treatment, 28 record purposes and setup/payoff map.
4. `EASTER_EGGS_AND_CAMEOS.md` and `ASSET_AND_PLATFORM_PLAN.md` — corrected cast, inspiration bank, assets and platforms.
5. `DECISION_REGISTER.md`, `CURRENT_STATE.md` and `ACCEPTANCE.md` — decisions, implementation and verification limits.
6. `ROADMAP.md`, `CAMPAIGN_CONCEPTS.md`, `LORE_AND_CAST.md`, `MUSIC_AND_ART.md` — production and retained boundaries.
7. `UPDATE_PROTOCOL.md` and `CHANGELOG.md` — maintain the same archive and actual revision history.

`SOURCE_MANIFEST.json` is generated from the exact exported Git revision and lists the historical input ZIPs excluded from the export. `FILE_HASHES.sha256` covers the exported files. Automated evidence is included when supplied at build time; missing evidence is not a pass. `repository-snapshot/` preserves repository paths from that same commit, including runtime source, manifests, validation tools and `docs/source-pack/`. The pack documents also appear at this archive's root for convenient reading; both copies have identical bytes. There is no `.git` directory and no nested historical source ZIP.

Use `repository-snapshot/` as the project root for source review or Makko import. To continue development or rebuild from Git, check out the manifest's revision in the canonical repository; this download has no Git history. Makko's engine and externally hosted artwork/audio are dependencies, so the snapshot is not a self-contained offline game.

Canonical project: https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE

The historical v5 starting point was merged PR #25, `7788ebfab4d6231c18229bef9571d6b97b676764`. The current intro implementation starts from merged #39; the generated manifest identifies this archive's exact branch/head and review status. PR #4 was rejected and remains excluded; its global music-clock implementation is not a prerequisite.

Historical asset registries/contact sheets are retained under `references/` for identification and visual continuity. Their audit dates remain historical. Current runtime asset metadata lives in the exact repository snapshot; do not overwrite it from an older reference.
