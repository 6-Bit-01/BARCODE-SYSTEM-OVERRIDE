# Known Issues

## Resolved in PR #8 scope

- Duplicate active enemy globals were consolidated into the single active enemy owner in `src/game/enemies.js`.
- The active Jammer is now `BARCODE.JammerEnvironment`, not an enemy.
- Enemy defeats now flow through one authoritative defeat event owned by `EnemyManager.recordDefeat()` and projected to legacy counters instead of adding manager, sector, and game-state totals together.
- Enemy/Jammer lifecycle diagnostics are exposed through `RuntimeLifecycle.getDiagnostics()`.

## Remaining known debt

- Enemy tuning, final combat controls, final authored Level 1 stage geometry, Relay Stage choreography, boss transition, and campaign/save routing are deferred to later owner-approved PRs.
- Virus, Corrupted, and Firewall art/feel are preserved approximately from the prototype; final encounter pacing remains asset/feel debt for the authored Level 1 stage PR.
- The current time convention for enemy simulation is milliseconds at manager/API boundaries with explicit per-frame seconds conversion for integration and behavior-local countdowns. The active Firewall lunge path now uses `Seconds`-suffixed countdown fields (`lungeCooldownSeconds`, `behaviorTimerSeconds`, `glideDurationSeconds`, `fullAttackDurationSeconds`, and related animation/preparation fields), while simulation timestamp fields use `Ms`; older non-enemy systems may still contain wall-clock compatibility code outside this PR's scope.
- The Jammer environmental presentation is a compatibility presentation only and preserves the approved sprite placement (`drawScale = 0.7`, `drawOffsetY = 190`) while remaining non-destructible. Final signal-distortion sequence, Relay gate retune, boss lead-in, and checkpoint behavior are intentionally deferred to the authored Level 1 stage PR.


## Lifecycle validation notes

Runtime lifecycle owner remains `BARCODE.RuntimeLifecycle`, preserving the PR #7 single-flight start/retry/restart behavior. Static inspection remains the automated proof layer; Owner/Makko browser testing is still required before merge for title, intro, gameplay feel, audio, camera, sprites, restart, and environmental Jammer smoke checks.
