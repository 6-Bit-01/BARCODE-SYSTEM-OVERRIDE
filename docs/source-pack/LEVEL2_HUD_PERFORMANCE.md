# Level 2 HUD performance review

The owner reports smooth Level 1 play and sustained lag as soon as Level 2's
driving HUD appears. The website preview is for testing; production release
remains on hold until the owner approves it.

The native mirror previously read its display crop with `getImageData` every
frame and reconstructed an RGBA VideoFrame. Chromium can disable accelerated
Canvas drawing after repeated readbacks. This is a plausible persistent-lag
trigger, not a measured diagnosis of the owner's graphics backend.

The candidate copies the exact native 714 x 141 mirror crop into one retained
OffscreenCanvas presentation surface on the existing road/frame owner. Its
private context is acquired once. The display still has one Canvas and the
original frame, input, music and gameplay owners. No new timer or RAF is added.
The scratch copy uses neutral 1:1 RGBA drawing, then the original display clip,
composite and single `blur(2.3px)` paint its result. Canonical asset bytes and
native world resolution are unchanged. Unsupported hosts use the original
synchronous Canvas copy; preparation failures are latched and release storage.

The small surface replaces two unsuccessful private experiments: direct
self-copy and a canvas-backed VideoFrame. Neither established a speed gain.
The retained surface must pass its own native pixel and runtime checks.

Diagnostics retain native chase and live-boss frames in their phase capture.
Their explicit `willReadFrequently:false` prevents diagnostic-only pixel
readbacks from changing the production rendering backend. They still drain
draws and retain all prior fidelity, alpha, caller, viewport and performance
thresholds: 33.33 ms phase medians, at least 80 undefeated live-boss samples,
25 percent improvement against the existing PR180-style uncached reference and
no scene regression above 10 percent. That reference uses current production
code with its native caches disabled; it is not a historical PR180 checkout.

Browser tabs observed in the private review were background-throttled. Their
frame intervals cannot establish player FPS. Automated functional/pixel checks,
complete-frame diagnostics and owner foreground-play acceptance remain separate.

## Native diagnostic result

Candidate `d517e05` failed both exact-head frame-budget events: the push run
reported chase/boss medians of 61.7/63.0 ms, while the pull-request run reported
91.8/95.4 ms. Both measured 447 native frames and every measured frame exceeded
33.33 ms. Separate runners are not a paired speed comparison.

The sustained paint phases identify city and street-object painting as the
largest submitted costs. In the pull-request run, their chase medians were
28.5 and 39.3 ms, versus 0.1 ms for the dashboard, 0.5 ms for the remaining HUD,
11.0 ms for the reflected scene and 0.4 ms for its final blur. Diagnostic
readback boundaries can move deferred work between phases; they do not prove
the owner's graphics backend or isolated physical HUD cost.

The native mirror reached the original-copy fidelity comparison: mean RGB
difference was 0.000198 and alpha was unchanged in the reported boss fixture.
That does not satisfy the failed whole-scene timing gate. The website stays on
the prior game source until a candidate demonstrates improvement. Production
remains on hold.

## Full native scenery working set

The next candidate reserves full-sheet ImageBitmaps for 15 measured hot
background sources before any image finishes loading. Their 19,072,502 pixels
share the existing 32 Mi-pixel background pool with the old quarter-size
derivatives. The canonical quarter-size set occupies 13,665,172 pixels, so the
combined 32,737,674 pixels fit that same pool. The separate 32 Mi-pixel functional
sprite budget is unchanged.

The original WebP sheets remain authoritative and all full-sheet preparations
retain their exact dimensions, alpha, cel boundaries, crops and sampler. Native
draws select a ready full-sheet bitmap; unsupported APIs, unexpected source or
output dimensions and preparation/load failures release their reservation and
retain the original source. Warm and paused draws reuse the cache. Preparation
does not create a Canvas, timer or input/frame owner.

This experiment can bypass lazy scaled-decode/cache work. It does not remove
destination resampling, transforms or blending, and repeated decoding on every
old draw has not been established. Native pixel fidelity and whole-scene speed
remain required before updating the website preview.
