# Final playtest evidence

Six native Canvas captures use production rendering and bundled artwork, with explicit Makko sprite/image adapters. They are layout evidence, not a hosted playtest. Reproduce with `FINAL_PLAYTEST_REVIEW=1 node tools/render-level1-rebuild.cjs docs/source-pack/review-final-playtest` in the documented native Canvas runtime.

- hack-live-view.webp: fixed opaque terminal beside a single live world view.
- title-settings.webp / pause-settings.webp: shared menu, fullscreen and reduced motion.
- level-rules.webp: difficulty and recovery selected before locking.
- jammer-discharge.webp: fixed warned zone, shield and relay guard.
- boss-support.webp: smaller recolored escort and committed aim warning.

`browser/result.json` and both browser PNGs record real Chromium title settings at 1280×720 and 960×720, including native fullscreen, preference persistence and simulated-controller routing. Gameplay/audio lifecycle calls are counted stubs. `CHROME_BIN=/path/to/chrome SETTINGS_BROWSER_OUTPUT=docs/source-pack/review-final-playtest/browser node tools/check-settings-browser.cjs` reproduces them. Physical-controller and owner Makko acceptance remain pending.
