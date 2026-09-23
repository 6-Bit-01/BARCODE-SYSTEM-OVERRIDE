# BARCODE: SYSTEM OVERRIDE — Source Pack v5

## Current review — Cache Line chase slice

The owner rejected the first lane runner as too basic and approved proceeding with the `Original Master` chase direction. Read `CACHE_LINE_BLUEPRINT.md` for the working gameplay/story target, `CACHE_LINE_CHASE_SLICE.md` for implemented controls and limits, and the newest `ACCEPTANCE.md` route. This is an unmerged review slice with temporary audio/art, no Bass/Level 2 completion, and pending hosted Makko/controller/listening/fun review. Earlier source-pack entries below remain historical.

## September 23 campaign redesign — current story handoff

Read `CAMPAIGN_REDESIGN.md` and `CAMPAIGN_SCENE_BEATS.md` first for the owner's newly selected level order, Sheila's forgotten competition and 9 Bit's player-aware presence. The older `CAMPAIGN_STORY_MAP.md` and historical review sections below predate that correction. PR #91's transmitter preview merged after #90, but the owner rejected its gameplay/boss feel as a campaign direction. The merged preview/debug route is a technical test, not Mac's planned Level 3, and grants no Drums or Level 3 completion. This source-pack documentation revision does not add gameplay, scenes, songs or a new approved ending.

## Current review — Broadcast Slum combat and debug access

PR #89 is merged at `c0d061407378831ae90fcac49985a29c3c5ea037` (base/rollback). Its Broadcast Slum combat pass added roof shield nodes, counter surges, varied defenders and temporary scatter after the first proof felt easy and basic. Branch `agent/level3-debug-menu` adds testing controls. The Cache Line is still Level 2 in story order. Start with `BROADCAST_SLUM_PROOF.md`, the newest `ACCEPTANCE.md` route and seven `review-broadcast-slum/` captures; exact test and publication state are in the generated receipt. Owner hosted Makko/audio/controller feel review remains pending.

This review adds a Level 1 **Complete Level 1** DEV action for reaching Cache Back, and a session-only `DEV 3` canvas menu with relay jumps, recovery and **Complete Preview**. Unlock each panel with Shift+F1 or its lower-left button in the corresponding level. Console commands: `DEBUG.level1.completeLevel()` and `DEBUG.level3.completeProof()` after unlock. The Level 1 shortcut saves Voice and the handoff without a best result, bonus or difficulty challenge record. The preview clear still has no Drums/Level 3 campaign award. Seven native captures now include the Level 3 menu.

## Latest correction — visible elevator roof riders

Start with `ELEVATOR_ROOF_DEPTH_FIX.md` and `review-roof-depth/roof-corrupted.webp`. Enemies now render on top of the elevator deck while riding; existing physics and the four-circle bonk scope remain. Exact tested/published revisions and checks are in the receipt. `TUTORIAL_FLOW_PROPOSAL.md` answers the owner's new design question with a 25 → 20 bubble recommendation; tutorial runtime remains unchanged. Owner Makko review is pending.

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
2. `CAMPAIGN_REDESIGN.md` and `CAMPAIGN_SCENE_BEATS.md` — latest seven-level order, story/scene direction and 9 Bit presentation; `CONTINUATION_PLAN.md` — historical implementation stages.
3. `CAMPAIGN_STORY_MAP.md` — superseded treatment retained for Level 1 and historical reveal/collectible context; `BROADCAST_SLUM_PROOF.md` — earlier technical preview evidence.
4. `EASTER_EGGS_AND_CAMEOS.md` and `ASSET_AND_PLATFORM_PLAN.md` — corrected cast, inspiration bank, assets and platforms.
5. `DECISION_REGISTER.md`, `CURRENT_STATE.md` and `ACCEPTANCE.md` — decisions, implementation and verification limits.
6. `ROADMAP.md`, `CAMPAIGN_CONCEPTS.md`, `LORE_AND_CAST.md`, `MUSIC_AND_ART.md` — production and retained boundaries.
7. `UPDATE_PROTOCOL.md` and `CHANGELOG.md` — maintain the same archive and actual revision history.

`SOURCE_MANIFEST.json` is generated from the exact exported Git revision and lists the historical input ZIPs excluded from the export. `FILE_HASHES.sha256` covers the exported files. Automated evidence is included when supplied at build time; missing evidence is not a pass. `repository-snapshot/` preserves repository paths from that same commit, including runtime source, manifests, validation tools and `docs/source-pack/`. The pack documents also appear at this archive's root for convenient reading; both copies have identical bytes. There is no `.git` directory and no nested historical source ZIP.

Use `repository-snapshot/` as the project root for source review or Makko import. To continue development or rebuild from Git, check out the manifest's revision in the canonical repository; this download has no Git history. Makko's engine and externally hosted artwork/audio are dependencies, so the snapshot is not a self-contained offline game.

Canonical project: https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE

The historical v5 starting point was merged PR #25, `7788ebfab4d6231c18229bef9571d6b97b676764`. The current intro implementation starts from merged #39; the generated manifest identifies this archive's exact branch/head and review status. PR #4 was rejected and remains excluded; its global music-clock implementation is not a prerequisite.

Historical asset registries/contact sheets are retained under `references/` for identification and visual continuity. Their audit dates remain historical. Current runtime asset metadata lives in the exact repository snapshot; do not overwrite it from an older reference.
