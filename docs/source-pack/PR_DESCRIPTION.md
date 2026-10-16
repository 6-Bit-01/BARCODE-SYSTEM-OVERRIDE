# Add whole-game mobile joystick and touch controls

## Current implementation and release status — October 5, 2026

Mobile players need access to the complete game flow: menus/opening, difficulty/tutorial, hacking, Level 1, road steering/gears/pads/skills, bridge, ending and results. This work adds a DOM joystick and contextual buttons through the existing InputManager/ActionInput and screen owners. Virtual actions remain independent of physical keys; cancellation, lost capture, blur, hidden documents and context changes release holds. Responsive safe areas and at least 44 CSS-pixel targets support portrait and landscape use.

The base performance release is merged PR183 / `42b2a3157638a8742717095fbdea7055b6efeb71`. Retained GPU rendering, all 624 original asset hashes, native 1920×1080, gameplay rules, music, saves and existing input/frame/audio owners remain. No new control loop or Canvas is added.

The initial implementation passes 20 focused contracts plus independent input/lifecycle/ownership/syntax/89-script prototype checks and original asset integrity. Actual bounded prototype flow passed title/settings, opening/difficulty, Level 1 multitouch and earned Level 2 gestures at 390×844, 844×390, 375×667 and 320×568. Its touch file differs from its earlier receipt; final committed packaging must refresh the receipt.

Actual review found missing selected-settings feedback and cramped short-portrait road controls. The corrections are implemented; control-polish and the added real-menu readout group pass within 20 contracts. Final strict-build visual/layout recheck remains pending. Full source `npm test`, all-file syntax and immutable C113 standalone checks passed. Exact corrected-source CI/merge and final site package/rechecks remain pending. GPU-only site PR481 passed earlier CI/preview checks and remains draft. Publication is authorized but has not occurred. See [MOBILE_CONTROLS.md](MOBILE_CONTROLS.md).

## Earlier GPU release description (historical)

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
- Seventy GPU contracts, frame-local path-cache contracts, all-file JavaScript syntax and the actual 88-script/774-asset standalone build passed locally. CI at `70378e8f531c405d200c766d12ea6447b45f5820` completed full `npm test`, all-file syntax and standalone-build checks. Its software cloud GL warmed all 171 sources but timed out during the natural intro before the HUD; downstream browser/export checks were unexercised.

The final checker/docs-only revision preserves the physically tested a7b2 runtime/assets. It classifies the actual game context after real preparation, before the HUD wait. Software, unavailable or unidentified GL reports `performanceUnexercised` and unrun gameplay/control/audio/pause/recovery/return scenarios `notExercised`, with bootstrap/resource checks recorded separately. Existing native browser jobs remain required, and identified hardware runs every unchanged functional and 1000/30-ms draw-median gate. Final-head CI and source/site packaging remain pending.

Observed headless RAF median/p95 was 16.7/33.4 ms in both runs, with occasional slower frames. This is a substantial measured improvement, not a universal display-FPS or zero-glitches claim. The existing 1000/30-ms hardware draw gate is unchanged; software/unidentified backends remain performanceUnexercised. Submitted batch counts are not asserted to be measured GL draw calls.

## Release

Publication on the existing BARCODE website is authorized. This source PR remains draft until its exact-head checks pass. The currently live game is still the earlier source d41be793 package from site PR480; the replacement is not yet published. The hidden `/system-override` route and footer copyright shortcut remain the launch path.
