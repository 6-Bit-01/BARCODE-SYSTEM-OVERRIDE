# Finish the approved tutorial and gameplay feedback pass

The approved twenty-bubble tutorial and the later art/gameplay feedback survived in a local checkout but were missing from main. This restores that work over merged #75 and completes the solid-awning integration.

- Coordinate dialogue, early/out-of-order actions, enemy entrances and hack phases with one tutorial progression owner. Keep all four speakers and story beats, show actual keyboard/controller bindings, preserve earned combo credit, require deliberate Rhythm Mode exit and remove the final forced wait.
- Connect all five supplied platform designs, six reactive HUD expressions, a soft digital healing chime and calibrated beat-result colors. Preserve #75's five-second lift power, terminal placement and painted-waveform glitch.
- Make the five awnings fully solid while retaining ordinary platform behavior and the two circled step bonks. Correct the boss's oversized terrain probe (310 units versus a roughly 232-unit walking body), awning descent and overhead routing. Rising cabin passengers clear the fixed canopy and keep their ride.
- Restore the actual approved plan and asset provenance in the continuation records. Related recommendations are documented without adding them to gameplay.

Validation: `npm test` and `npm run check:syntax:all` pass. Production-module tests cover keyboard/PS/Xbox tutorial flow and traversal at 30/60/120 FPS, original boss street movement, lift handoffs/timeouts, real portrait events, beat calibration/reset and bounded pickup audio. Current native renders show twelve tutorial states, nine mounted platforms, terminal states, six portraits and three beat outcomes.

Base/rollback: `48ec019a6037a3bf3910614eb5bae3c0c58d4130` (merged #75). Feedback artwork pin: `dce79e888592023b85abe0eac2572f76b66e51ac`. No additional dependencies or new runtime timers/loops.

See `docs/source-pack/FINISH_THE_JOB_RECOVERY.md` and the newest `ACCEPTANCE.md` route. Hosted Makko, physical-controller feel and sound acceptance remain pending. Keep this draft unmerged for the owner's review; after acceptance and merge, import the actual new main SHA and repeat the route.
