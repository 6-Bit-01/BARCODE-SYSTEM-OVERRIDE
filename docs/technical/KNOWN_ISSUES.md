# Known Issues and Verification Limits

Updated for Source Pack v5, September 11, 2026. Baseline: merged PR #25, `7788ebfab4d6231c18229bef9571d6b97b676764`. Exact branch status and test receipts belong in the generated archive manifest/evidence and `docs/source-pack/ACCEPTANCE.md`.

## Current milestone

The merged baseline ends at a harmless `boss_ready` handoff. This branch implements Level 1 boss combat, retry and completion; it remains prepared for owner Makko verification until the handoff has a recorded result. Do not describe the new boss as shipped or balanced based on Node checks.

## Concrete remaining risks and debt

| Item | Evidence and next step |
|---|---|
| Enemy visual/contact alignment | The source audit found render offsets and a Firewall scale that may differ from hitbox calculation. This is a candidate cause, not a reproduced diagnosis. Compare visible contact and debug geometry in the current Makko build before tuning. |
| Final boss feel and art fit | Existing art supports the current encounter prototype. Telegraph clarity, visible contact, difficulty and final identity require the owner's playthrough; do not invent a replacement identity. |
| Level 1 music metadata | `level-01.main` is deliberately `legacy-compatibility`. Its 146 BPM, 4/4 and 211-second restart preserve current behavior and are not verified exports or defaults for other levels. Existing stems have unequal lengths. |
| Future-song mixer | Adaptive mixing still assumes Level 1's `foundation`, `bass-layer` and `fx-layer` names. Resolve source roles through each profile before adding a different song. |
| Music transport capabilities | Runtime supports fixed-grid and no-grid profiles. Tempo/meter maps and authored cue interpretation remain planned; reserved schema concepts are not implemented capability. |
| Lore | Three Level 1 placements exist but text comes from random legacy pools. Contradictory origin claims must not become canon. Implement authored IDs/copy and versioned collection as a focused milestone. |
| Campaign | Levels 2–7, other playable-character implementations, durable campaign progress and final ending flow remain future work. A session boss checkpoint is not a persistent campaign save. |
| Controller support | Semantic/gamepad input exists, but complete controller coverage, glyphs and mode/end-screen navigation remain unverified. The boss handoff documents keyboard controls; do not claim full controller or touch acceptance. |
| Assets and runtime | Remote asset availability, sprite alignment, audio playback, camera coverage and performance require the actual Makko project. Historical contact sheets are visual references, not a fresh availability audit. |
| Prologue historical mismatch | Earlier packs recorded 11 image entries and 12 subtitles. Verify current presentation and intent before changing the locked intro; this observation does not authorize a rewrite. |

## Preserved ownership

`src/game/enemies.js` is the single active enemy owner. Its authoritative defeat event drives mission projections without double-counting. `BARCODE.JammerEnvironment` remains a separate environmental owner, now intentionally destructible under the approved 16-hit rule. Enemy simulation uses milliseconds at manager/API boundaries and seconds for integration/local countdowns. Do not reintroduce duplicate collision or frame owners.

The runtime lifecycle owner remains `BARCODE.RuntimeLifecycle`, which coordinates start/pause/retry/restart behavior. It joins equivalent in-flight transitions and uses generation checks to reject stale startup completion. `game-initializer.js` retains single-flight audio, sprite and game initialization promises; the start button delegates startup and retry to the lifecycle instead of manually initializing those systems. New encounter state must reset with these existing owners.

Static inspection checks entrypoint delegation, single-flight initialization and explicit boot-monitor cleanup. Dependency-free production-code harnesses also check deterministic lifecycle and encounter behavior. Owner/Makko testing is still required before merge for title/prologue presentation, movement/contact, lift, rhythm/hack, camera, sprites, audio, boss win/loss/retry and restart. Automated checks do not establish presentation, audio synchronization or game feel. The documentation-only PR-001 validation restrictions were historical scope, not current runtime policy.
