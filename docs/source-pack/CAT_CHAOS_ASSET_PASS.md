# Studio Cats, chaotic FX and boss assets

Owner scope after merged PR #44, base `4b207c5570a6bccd86b95c702c11e1e6606bbf01`. One combined review on `agent/level1-cat-chaos-assets`.

1. **Studio Rats means cats.** Replace the literal rodent with a recognizable feline sprite and update active story references. Retain `egg.l01.studio-rat` and the existing inspection/archive facts and crew response. The later presentation-smoothing pass relocates the cat to Cache Overpass and makes its rooftop dash first-discovery-only.
2. **Reusable arrow artwork.** Replace the generic active Jammer pointer with a distressed BARCODE arrow asset. Keep one guidance owner, its projected direction, safe edges, visibility and distance rules; future targets can reuse the asset renderer.
3. **Boss attack artwork.** Replace flat orange pulse rectangles with animated jagged energy. Preserve the warning interval, bright readable collision front, pulse geometry, musical boundaries and damage rules.
4. **More chaotic FX.** Vary silhouettes, rotations, fragments, burst timing and branching. Sample visual randomness when an event is created; drawing must not mutate simulation, sample gameplay randomness or flicker unpredictably between identical renders. Keep bounded event/particle counts, pause/restart cleanup, steady HUD and reduced-effect settings.
5. **Boss sizing.** Inspect all three source sheets and their opaque/frame/foot measurements. Apply a modest shared size increase and an additional walk adjustment without stretching individual axes, normalizing away authored motion or changing the boss design. Retain Makko anchor/manifest-scale compensation and test collision/foot alignment.

Use built-in image generation for new raster assets; include final prompts, source hashes, crop/packing data and delivery provenance. Existing boss sheets remain unchanged. Native render fixtures must identify their Makko/audio boundary. Run the required production regression and syntax suites, preserve the intro Chromium gate, publish one draft and refresh the maintained source export. Stage C remains next after this pass.

## Implementation and measurements

Three generated assets are published at immutable art checkpoint `e35ebe3ae8bfc547815a5a93c952424fa067af5d`: a four-frame tuxedo cat walk, one distressed cream/lime/violet barcode arrow, and four purple/cyan/amber ground-pulse frames. All three hosted byte hashes were verified against the bundled manifest. Total compressed runtime art is 365,944 bytes. The later presentation-smoothing pass moves the cat animation into the rooftop world layer and makes it one-time. The saved `egg.l01.studio-rat` ID remains compatible.

| Boss clip | Source frames | Frame pixels | Neutral body pixels | Effective scale before | Effective scale now |
| --- | --- | --- | --- | --- | --- |
| Idle | 48 | 256 × 179 | 178 | 1.137079 | 1.228045 |
| Walk | 41 | 200 × 256 | 253 | 0.8 | 0.91584 |
| Attack / flourish | 48 | 256 × 155 | 125, excluding raised blades | 1.6192 | 1.748736 |

The shared body height increases from 202.4 to 218.592 pixels (+8%). Walk receives another 6% (+14.48% relative to the old walk), preserving its taller side-on silhouette. The stable collision core also grows 8% to follow the shared body; it does not fluctuate with walk/breathing frames. Existing 137 per-frame foot rows, mirrored anchors and cancellation of Makko's manifest scale remain intact. Damage, musical windows, pulse dimensions/speed/range and counter/retry rules are retained.

Combat effects choose an isolated visual seed at event creation. Hits vary their torn burst families, angles, scratches, branch offsets, delayed fragments and rotations. Debris preserves data/strip/metal material differences. Landing and destruction waves use irregular paths. Identical event/age draws are repeatable; drawing does not advance random state or gameplay. Existing 96-event cap, pause/expiry/reset and reduced-flash behavior remain.

## Deliberate runtime inventory change

`index.html` gains exactly one script, `src/engine/presentation-assets.js`, before the existing Jammer indicator. It exports one shared three-image cache. This authorized asset delivery module changes script order, inline indices and the static global inventory. Regenerate `docs/technical/baseline-inventory.json` for this specific graph change; do not relax any gameplay or syntax assertions. No runtime package, canvas, listener, timer, audio source or loop is added.

## Verification and handoff

`check:presentation-assets` exercises production loading (including bounded failure), frame crops, shared consumers, saved ID compatibility, seed variety, pure rendering, pause, expiry and caps. The mission harness checks all boss clip foot rows, mirrored/unmirrored runtime anchors and manifest scales at the new tuning. Existing mission, boss, combat, input and save checks remain required.

`node tools/render-cat-chaos.cjs ../asset-review` generates the asset/boss/FX diagnostic. `node tools/render-level-01-impact.cjs ../asset-review ../asset-review/FG.png --cat-chaos` captures six production world/HUD scenes and verifies the fixed rhythm target remains outside the camera transform. Native sprite/image adapters are explicitly test boundaries. Chromium also decodes/draws all three assets through the bundled fallback, after the normal and skipped intro routes; CI supplies the exact revision receipt. None of these checks certifies live Makko playback, sound or feel.

The full local 27-command regression and all-JavaScript syntax suites pass, as do the native diagnostics. Current-head Chromium is verified through CI before handoff. Owner Makko review remains pending. Base/rollback: merged #44 at `4b207c5570a6bccd86b95c702c11e1e6606bbf01`. The generated source export/PR receipt identifies the exact review head. Next after this pass: Stage C campaign services.
