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
25 percent improvement against PR180 and no scene regression above 10 percent.

Browser tabs observed in the private review were background-throttled. Their
frame intervals cannot establish player FPS. Automated functional/pixel checks,
complete-frame diagnostics and owner foreground-play acceptance remain separate.
