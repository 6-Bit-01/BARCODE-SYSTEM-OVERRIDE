# Continue here — Level 1 presentation smoothing


Publication recovery also preserves the previously saved SpritePlayback clock, stable enemy idle references, and all jump apex/landing drawings from `375de26`. The existing PR #49 shim is replaced by these direct production owners, keeping one implementation of each effect. The twelve atlas files are the exact saved `61d691d` outputs.

Updated September 14, 2026. Read this before the source-pack history.

PR #49 recovery: all twelve atlas hashes and sizes are verified in immutable asset commit `1edf7fe6a011b88d511b955db9d1342f78912009`. The active initializer and manifest use that commit. The recovered playback integration includes the entrypoint, player, enemies and test rig; the complete local suite and all-file syntax checks pass. The published head and current CI result belong to PR #49 and the generated source-pack receipt; owner Makko acceptance is still pending.

- Repository: 6-Bit-01/BARCODE-SYSTEM-OVERRIDE.
- Base/rollback: merged PR #48, `de9a63ea9311aba23d6a9ad6c3dca3b5e8aa50a5`.
- Review branch: `agent/level1-presentation-smoothing-recovery`.
- Done: move the Jammer onto the authored sidewalk contact; apply a restrained three-frame anti-flicker pass to all twelve installed replacement atlases without changing 547-frame timing, cells or anchors; split traffic lighting by foreground/background depth; move tutorial objectives below score/lore; move the Studio Cat to Cache Overpass and make its rooftop dash a one-time discovery; replace narrow gate strips with tall sidewalk-aligned digital walls.
- Preserved: gameplay bodies, collision rules, mission/boss clocks, controls, intro, HUD ownership, original two boss clips and all saved discovery IDs.
- Rebuild: `python3 tools/smooth-model-atlases.py` is idempotent at smoothing version 1 and records source/output hashes in `assets/sprites-v3/calibration.json`.
- Next: review the exact PR head in Makko using the top checklist in `docs/source-pack/ACCEPTANCE.md`. Do not merge before owner acceptance.
