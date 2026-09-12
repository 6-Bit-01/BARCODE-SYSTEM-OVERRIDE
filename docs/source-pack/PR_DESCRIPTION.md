# Repair Makko landing, enemy contact updates and missing SFX

After merged PR #33 the owner reports better effects/flow, but 6 Bit stays in the jump pose after landing, enemy contact becomes inconsistent, and rhythm/action sounds are missing.

The animation code assigns to Makko's getter-only `currentFrame`. That freezes the landing timer and aborts Corrupted/Firewall updates before collision resolution. CombatFX also suppresses the original rhythm success call; damage samples are bypassed, while new cues unnecessarily depend on all remote assets finishing initialization.

- Select frames with Makko's public `play(name, loop, startFrame)` API; advance recovery independently and keep committed poses on one clock.
- Restore rhythm/damage samples with per-voice volume and bounded reset cleanup. Remove delayed whole-channel volume restoration. Use actual SFX readiness and stronger action-cue envelopes.
- Preserve improved visuals/flow, body geometry, damage/boss balance, music, art, controls, lift/Jammer and mission progression.
- Replace permissive animation stubs with getter-only handles and optional actual Makko classes. Add animated manager contact/stomp checks at 30/60/120/144 FPS, landing recovery, cinematic ownership and sample/bus/lifecycle checks.

Validation: `npm test`, `npm run check:syntax:all`, `git diff --check`, plus responsive-combat and frame-ownership checks against the official Makko runtime. The merged failure was reproduced with the same runtime. Existing rhythm/damage WAV URLs return HTTP 200. Final sound mix, sprite rendering and contact feel still need Makko testing; no live gameplay PASS is claimed. A native browser download was unavailable here. No production dependency or asset URL is introduced.

Base/rollback: `8d0cf73a223494b355d850930f4ac8047353804f`. The generated archive manifest/receipt identify exact head/tree. Rollback restores the reported defects. Known debt includes the host-provided Makko script and optional whoosh references with existing fallbacks.

Keep this PR in draft for the five-step test in `docs/source-pack/MAKKO_HEALTH_CHECK.md`: spawn/land/stance, all three ordinary enemy contacts, rhythm/action SFX under music, retained mission effects/transition, and boss retry/rematch/reset. Capture tested SHA, device/project, per-step PASS/FAIL and health/video for disputed damage. If audio stays silent, capture `window.audioSystem.getRuntimeDiagnostics()` immediately after trying a cue.

After owner acceptance and merge, import/sync **main at the actual merge SHA** into Makko, restart preview and repeat opening/contact/audio plus pause/retry smoke checks. Record deployed SHA and PASS/FAIL. This draft does not deploy Makko. Accept this repair before new features.
