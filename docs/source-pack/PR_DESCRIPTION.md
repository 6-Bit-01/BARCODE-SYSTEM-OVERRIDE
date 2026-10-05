# Render Level 2 scenery through retained GPU batches

## Problem and resulting behavior

Level 2 stalls when its HUD and rear scenery appear because the old Canvas painter repeatedly rebuilds clips, renders large artwork, and submits separate gradient materials. The replacement compiles compatible scenery images, convex fills and analytic gradients into ordered retained GPU triangle batches through the pinned local PixiJS renderer. Repeated ground paths share immutable transformed geometry within each frame. The original native foreground, mirror face and controls remain; both scenery views render directly behind them without per-frame Canvas copies.

All 171 GPU sources prepare before driving: 149 full-resolution KTX2 raster derivatives and 22 original browser-rendered SVGs, with complete premultiplied mip chains and original UV crops. Their GPU mip storage falls from 974.903 to 248.328 MiB. All 624 original artwork/audio assets remain byte-identical. One pinned local decoder worker terminates after warmup. Explicit level ownership retires and reloads inactive Level 1 artwork, sprites and audio. Existing gameplay, saves, input/audio owners and the single gameplay RAF remain. Unsupported materials/hardware and graphics loss retain complete native recovery; complex paths keep their existing exact GPU pipeline.

## Validation and limits

Actual default AMD Radeon 660M browser runs against runtime source `a7b2ba5ed3115bcd24903a7729b5060efacadd92`:

- Fresh Level 2: draw median/p95/max 15.5/24.3/42.8 ms, versus the preceding compressed renderer's 32.0/43.8/63.9 ms. All 786 measured frames completed both GPU views and final visible output.
- Earned boss Continue: 16.0/23.5/35.4 ms; all 232 measured frames completed both views and final visible output.
- Both runs had zero playing texture uploads, Canvas copies or native fallbacks; all 149 compressed +22 original sources, terminated worker and both-view image/gradient batches remained valid before and after genuine graphics loss/full native fallback/ordinary restoration.
- Real keyboard/gear, pause/audio, ordinary Level 1 return/reloaded resources and authored bridge P/P passed. All 415 input-file hashes remained unchanged; screenshots were visually reviewed.
- Seventy GPU contracts, frame-local path-cache contracts, all-file JavaScript syntax and the actual 88-script/774-asset standalone build passed locally. The broad local regression was interrupted without a prior failure so whole-race simulations would not compete with hardware measurement; required exact-head full regression and delivery CI remain pending.

Observed headless RAF median/p95 was 16.7/33.4 ms in both runs, with occasional slower frames. This is a substantial measured improvement, not a universal display-FPS or zero-glitches claim. The existing 1000/30-ms hardware draw gate is unchanged; software/unidentified backends remain performanceUnexercised. Submitted batch counts are not asserted to be measured GL draw calls.

## Release

Publication on the existing BARCODE website is authorized. This source PR remains draft until its exact-head checks pass. The currently live game is still the earlier source d41be793 package from site PR480; the replacement is not yet published. The hidden `/system-override` route and footer copyright shortcut remain the launch path.
