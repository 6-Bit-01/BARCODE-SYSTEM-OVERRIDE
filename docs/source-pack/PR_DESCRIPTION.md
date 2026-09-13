Studio Rats was drawn as a literal rodent, the active Jammer pointer and boss pulses used generic shapes, and repeated effects looked too uniform. This implements the owner’s five requested corrections together on the merged PR #44 baseline.

- Add a recognizable four-frame tuxedo-cat walk for the street discovery and panel-margin gag. Correct crew copy while preserving saved discovery IDs; the cat passes beside the caption.
- Add a reusable distressed barcode arrow and four animated ground-pulse frames. A single cache loads three images from immutable art checkpoint `e35ebe3ae8bfc547815a5a93c952424fa067af5d`, with bounded bundled fallbacks. Prompts, hashes, frame packing and reuse instructions are included.
- Give repeated attacks varied torn burst families, scratches, branches, fragment timing, angles and trajectories. Visual seeds are chosen once per event; rendering is repeatable and does not affect combat randomness or music.
- Enlarge the boss and stable body core 8%, then enlarge the walk another 6%. Preserve all 137 frame foot measurements and Makko anchor/scale compensation. The walk’s total change is +14.48%; idle/attack are +8%.

Boss pulse geometry, warning/music windows, damage and counter rules remain intact. The pulse artwork fills its 64 × 56 hazard, with a steady bright leading edge. Existing FX bounds, pause/reset, reduced effects, fixed HUD, intro and all ten #44 improvements are preserved. One intentional script-graph addition introduces the shared image cache; no runtime dependencies or new canvases/listeners/timers/audio sources/loops.

Validation: full `npm test` including the new production loader/FX/consumer check, all-JavaScript syntax, and seven native diagnostic compositions using the actual art/sheets. Native tests explicitly adapt the Makko sprite/image boundary. CI checks Chromium intro/input/fullscreen/retry/tutorial and all three images through the bundled fallback, then exports Source Pack v5 from the committed revision. The PR/run receipt records the exact head and completed outcomes; these tests do not certify live Makko playback, sound or feel.

Before merge, use the current five-item route in `docs/source-pack/ACCEPTANCE.md` and the retained full smoke route. Owner review of the new art, boss proportions, contact fairness, pulse readability and increased visual chaos remains pending under AGENTS.md. One combined draft; do not merge until accepted.

Base/rollback: `4b207c5570a6bccd86b95c702c11e1e6606bbf01` (merged #44). Scope/tuning: `docs/source-pack/CAT_CHAOS_ASSET_PASS.md`. Next after this pass: Stage C campaign services.
