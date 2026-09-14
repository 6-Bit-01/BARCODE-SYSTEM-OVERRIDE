# Continue here — idle, flourish and fireball polish

## Idle, flourish and fireball polish — September 14, 2026

Current work supersedes earlier recovery handoffs below. PRs #49 and #50 are merged; base/rollback is `42aebe8c19853da510c385c45606dfd3b4c7973a`. Continue on `agent/animation-fireball-polish`.

The owner requested a smooth 6 Bit idle loop, a clearer boss flourish/attack, and larger, better-looking boss fireballs with existing timing and damage. The saved asset checkpoint `7f0dd0e` is reused byte-for-byte: a coherent 26-frame forward/return idle and a lossless 3584×2170 boss atlas with 48 poses. No art is regenerated. The flourish is a 2× resampling/sharpening of the retained source, not a new model redraw.

All thirteen installed replacement clips (595 frames) use immutable asset commit `236e7d7b5b3c6a1dfb580f8feeac6544d8626e86`. The active loader uses verified published manifest `fab43be772cbf4d3355486e695b11898bcd959c3`, detects a stale flourish, and retains the existing registry/rebind lifecycle. Doubling flourish geometry and anchors while halving display scale preserves the same world size, feet and four-second timing. The original boss walk remains.

The fireball reuses the authored pulse art at 104×76 with a soft glow and directional wake. Its hot leading edge remains on the original 64×56 swept damage front. Speed, phase durations, second-pulse delay, damage, jump clearance, mission rules, other sprites, intro, HUD, cat discovery and walls remain unchanged. The renderer creates no timers, canvases, game state or asset downloads.

Focused model/loading, presentation and boss-anchor checks pass. Native Canvas inspection uses real image bytes and the production fireball draw method. Required full-suite/syntax and current-head CI results are recorded on the PR and generated receipt. Live Makko motion, loading, audio and playtest acceptance remain owner checks.

Implementation is complete. Publish the exact tested final tree as one combined draft PR, then update the same Source Pack v5 identity. Current publication/CI state belongs to the PR and generated receipt. Do not repeat asset processing or the merged #49/#50 work. Next is owner Makko acceptance using the top route in `docs/source-pack/ACCEPTANCE.md`; Stage C remains deferred.
