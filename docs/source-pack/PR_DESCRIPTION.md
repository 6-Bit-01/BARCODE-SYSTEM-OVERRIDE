# Finish upper routes, boss pursuit and Jammer guidance

The Jammer cue could appear above 6 Bit, drones were easy to miss, upper routes lacked clear landing edges and rewards, and the boss kept the camera on the street. This completes the recovered follow-up to merged PR #59.

- Keep offscreen Jammer guidance on the correct screen edge.
- Move the two existing mission drones into the first packets at accessible roof heights; keep the 20-defeat quota.
- Add faint landing guides and three optional rooftop signal caches, awarding 1,500 total score and up to three existing Amp charges once per run.
- Let the camera follow upper-level combat and let the boss pursue through actual supports using warned, animated leaps and a counter window after each landing. Roof pulses respect their platform height and span; retry restores the street checkpoint.
- Install the saved illustrated lift and newly drawn boss flourish/leap poses. Preserve the four-second introduction, boss idle/walk, existing combat timing, damage and health.
- Restore slim continuous emitter hardware and put only that hardware behind enemies. Preserve the field, foreground props, original flying-car motion and single broadcast terminal.

Base/rollback: `a4c16069b008c508a1dca60aeba3aab7e3c29b3f` (merged #59). Branch: `agent/upper-route-boss-polish`. The generated receipt and GitHub PR identify the exact published review head and tree.

## Validation

The recovered final local `npm test` and `npm run check:syntax:all` passed. Production checks cover 30/60/120 Hz boss climb/descent, camera, pause, first-packet drone rendering, one-time caches, roof pulse bounds and retry; the existing combat, mission, original-car and traversal checks remain. The baseline inventory only adds the new harness. Documentation-only handoff changes followed those checks.

The saved 22-second native clip and stills use production modules with host image/sprite adapters and scripted player placements. They do not establish hosted Makko performance, audio or input feel. No new dependencies, canvas or frame loop.

Immutable asset pins: lift/boss `b1e9de902b325a949562e8ebeece375a8452ecca`; slim rails `c0b459ed219af816f696116ad3e37f64fad20460`. The seven image files were checked against their published bytes during the recovered pass.

## Review before merge

Import the exact draft head into a fresh Makko preview. Check the Jammer arrow on both sides while walking/jumping; both early drones and H/stomp/rhythm interaction; lift foot placement; faint roof guides and all three caches; the full boss flourish; boss pursuit up/down, warned landings, counter windows and platform-bound pulses. Check thin rails under enemy feet, pause during a leap, boss loss/retry, victory and full restart. Retain the title/intro, original cars, music and core movement smoke check.

Record imported SHA, PASS/FAIL and short clips covering the Jammer cue, lift/drone and boss ascent/descent. Owner Makko acceptance remains pending; keep this PR a draft until accepted.

## After merge

Read the actual new `main` merge SHA, import that revision into Makko, and open a fresh preview. Repeat the same focused route and record the imported merge SHA, PASS/FAIL and clips. Rollback is re-importing the PR #59 base above. The source pack remains the same maintained v5 file.

Full implementation, limitations and route: `docs/source-pack/UPPER_ROUTE_BOSS_PASS.md`.
