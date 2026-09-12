# Responsive-combat verification

These PNGs use the approved remote sprite sheets and the existing foreground artwork, drawn with the production player, enemy, parallax and CombatFX code. A small Canvas sprite adapter supplies atlas/anchor drawing at the host boundary. They are **diagnostic renders, not live Makko screenshots**. The scene uses 0.82 game zoom, then scales the 1920-pixel view to 1440 pixels for comparison.

- `responsive-combat-preview.png`: exploration, planted Rhythm Mode, and a resolved perfect hit at combo ten. The same foreground/camera is used in all panels. Scenery remains behind actors and warnings.
- `responsive-contact-preview.png`: the six ordinary-enemy clips, calibrated feet and their stable damage bodies. A separate head sensor handles passive landing stomps; it can sit above the smaller torso shown here.
- Source atlas bounds (alpha threshold 128), foot/head rows and retained scales are in `docs/technical/enemy-contact-calibration.json`.

`npm run check:level-01-responsive-combat` tests real code for queued timestamped taps, state-independent bodies, rising/contact damage versus swept descending stomps, both Makko anchor conventions, frame scheduling at 30/60/120/144 Hz, elapsed-time particle/camera behavior, feedback outcomes/lifetimes and bounded audio sources. Existing boss tests retain pulse, bounce/rearm, pause/retry and Jammer handoff coverage. Audio uses boundary stubs for ownership tests; cue loudness, audible timing and Makko rendering remain owner playtest items. There is no measured hardware FPS claim.

The exported `test-evidence.json` records required command exit statuses against the exact source revision. Previous evidence in the source pack remains historical.
