# BARCODE: SYSTEM OVERRIDE — Source Pack v5

**Approved direction; active milestone: finish Level 1's boss encounter.** The owner approved this direction and requested a regularly updated source ZIP on September 11, 2026.

This pack replaces conflicting instructions in v2–v4. It preserves the later approved mission, rhythm, movement, lift and cinematic repairs, consolidates the seven-level campaign direction, and makes current implementation/verification explicit. It is a living project handoff, not an assertion that every planned feature is implemented.

## Start here

1. `PROJECT_INSTRUCTIONS.md` — working rules and authority.
2. `DECISION_REGISTER.md` — locked decisions, approved direction and open specifics.
3. `CURRENT_STATE.md` and `ACCEPTANCE.md` — what exists, what changed and what remains unverified.
4. `ROADMAP.md` — milestones and their concrete exits.
5. `CAMPAIGN_CONCEPTS.md`, `LORE_AND_CAST.md`, `MUSIC_AND_ART.md` — creative and production direction.
6. `UPDATE_PROTOCOL.md` and `CHANGELOG.md` — how to keep this archive current.

`SOURCE_MANIFEST.json` is generated from the exact exported Git revision and lists the historical input ZIPs excluded from the export. `FILE_HASHES.sha256` covers the exported files. Automated evidence is included when supplied at build time; missing evidence is not a pass. `repository-snapshot/` preserves repository paths from that same commit, including runtime source, manifests, validation tools and `docs/source-pack/`. The pack documents also appear at this archive's root for convenient reading; both copies have identical bytes. There is no `.git` directory and no nested historical source ZIP.

Use `repository-snapshot/` as the project root for source review or Makko import. To continue development or rebuild from Git, check out the manifest's revision in the canonical repository; this download has no Git history. Makko's engine and externally hosted artwork/audio are dependencies, so the snapshot is not a self-contained offline game.

Canonical project: https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE

The verified starting point for this milestone is merged PR #25, `7788ebfab4d6231c18229bef9571d6b97b676764`. The generated manifest identifies this archive's later branch/head and review status. PR #4 was rejected and remains excluded; its global music-clock implementation is not a prerequisite.

Historical asset registries/contact sheets are retained under `references/` for identification and visual continuity. Their audit dates remain historical. Current runtime asset metadata lives in the exact repository snapshot; do not overwrite it from an older reference.
