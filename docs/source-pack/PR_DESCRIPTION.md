Level 1's existing effects gave most actions the same small reaction, and the large HUD offered little sense of an approaching beat. This implements all ten approved impact/discovery recommendations together, preserving the corrected opening and the established mission.

- Give hits, landings, stomps, destruction and boss attacks distinct camera/contact reactions; add material debris and a visible final-hit finish.
- Add real combo-5 waveform and combo-10 chain attacks, with authoritative target previews, one-charge Amp spending and unchanged boss/Jammer damage rules.
- Make the existing street react to rhythm and physical actions; distinguish all four encounters, protected roof arrivals, Jammer recovery and boss entrances.
- Consolidate the comic HUD around a fixed top-left target with approaching notes. Add E/LB inspections, optional crew replies, persistent discoveries, caption tilts, clear framing and a Studio Rat crossing the panel margin.

The exact ten-item mapping and tuning are in `docs/source-pack/LEVEL_01_IMPACT_PASS.md`. This is one combined draft with implementation checkpoints. No new game raster assets, runtime dependencies, canvas contexts, listeners or animation loops are introduced. The original four playable characters, tutorial/input ownership, 20-enemy mission, 16-health Jammer, lift/roofs, lore and boss/retry remain.

Validation: `npm test`, `npm run check:syntax:all`, targeted production checks and six native Canvas scenes using unchanged foreground/sprite assets. Native fixtures explicitly adapt the Makko sprite boundary; they do not certify host playback, audio sync or feel. CI also runs the retained real Chromium intro/fullscreen regression and exports Source Pack v5 from the committed revision.

Makko review before merge: follow the top ten-item route in `docs/source-pack/ACCEPTANCE.md`, particularly impact strength, 5/10 thresholds, warning readability, E/LB ownership, controller/audio feel and full boss/retry/restart. The new attack reach and camera values remain review tuning. Do not merge until the owner accepts this build.

Base/rollback: `51b65d4cd71d369b05003ddaa83cfe6f88fe348b` (merged #43). Next after acceptance: Stage C campaign services.
