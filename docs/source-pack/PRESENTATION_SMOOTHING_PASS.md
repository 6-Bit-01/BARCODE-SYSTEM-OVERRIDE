# Level 1 Presentation Smoothing Pass


Publication recovery also preserves the previously saved SpritePlayback clock, stable enemy idle references, and all jump apex/landing drawings from `375de26`. The existing PR #49 shim is replaced by these direct production owners, keeping one implementation of each effect. The twelve atlas files are the exact saved `61d691d` outputs.

Date: September 14, 2026  
Base/rollback: merged PR #48, `de9a63ea9311aba23d6a9ad6c3dca3b5e8aa50a5`  
Review branch: `agent/level1-presentation-smoothing-recovery`

## Installed changes

- The Broadcast Jammer retains scale `0.7` but uses the shared 72-pixel visual-foot offset, placing it at sidewalk contact instead of below the street.
- Every installed replacement atlas is processed as complete registered frames with a restrained premultiplied-RGBA temporal filter: previous `0.09`, current `0.82`, next `0.09`. Looping actions wrap; jump/attack endpoints clamp. All 547 frames, 12 fps clocks, names, cells, anchors and gameplay bodies remain.
- Traffic light cones have explicit depth ownership. Normal cars and their cones render before the building layer; foreground cones render after buildings and before their cars.
- Tutorial objectives begin at y220, below the score/lore stack.
- The Studio Cat discovery keeps its durable ID but moves from the Signal Lift to the Cache Overpass roof at x1680/y330. Its dash is part of the world and starts only for a fresh collection.
- Four encounter barriers retain their x collision planes and immediate unlock timing, but render from y202 to y822 as perspective digital slabs extending along the sidewalk.

## Reproducibility and limits

Run `python3 tools/smooth-model-atlases.py` with Pillow available. Version 1 is idempotent unless `--force` is supplied. `assets/sprites-v3/calibration.json` records each prior hash, output hash, weights and edge policy. The filter changes image pixels only; it does not invent in-between frames or alter animation timing.

Automated tests verify the source ownership, saved-event behavior, atlas bytes, frame geometry, anchors and clocks. Visual smoothness, live Makko decoding, composition, audio and game feel still require the owner review in `ACCEPTANCE.md`. No automatic merge is authorized.
