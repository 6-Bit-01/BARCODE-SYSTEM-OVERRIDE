# Makko health check and repair — September 12, 2026

PR #33 merged at `8d0cf73a223494b355d850930f4ac8047353804f`. The owner's next playtest reports improved effects/flow, a permanent jump pose after landing, intermittent enemy clipping/unfair contact, and missing rhythm/action SFX. Animation/contact/audio acceptance failed; positive feedback for effects/flow is retained.

Repair branch: `agent/level1-makko-health-repair`. The archive manifest identifies the exact review commit and PR. This repair awaits owner Makko testing; it is not merged or gameplay-accepted.

## What stuck and what failed

| Selected work | Health finding | Repair/status |
| --- | --- | --- |
| 1. Stable bodies and swept ordinary stomps | Geometry survived, but Corrupted brace and Firewall attack poses throw before the manager reaches collision resolution. | Correct Makko frame selection. Full animated manager checks cover all three types, body damage, immunity and descending stomps at 30/60/120/144 FPS. Contact feel still needs a Makko retest. |
| 2. Captured taps and original timing | Production checks retain one-shot taps and captured-time judgments. No new owner failure reported. | Preserved. |
| 3. Frame pacing | Owner says flow feels better; elapsed-time and single-RAF checks remain. | Preserved. |
| 4. Attack reach and target links | Effects feel better; real hit/miss/empty/guard transactions still drive visuals. | Preserved, including empty hits producing no false target link. |
| 5. Directional/material contact effects | Effects and local impact holds remain; physics continues during visual holds. | Preserved. |
| 6. Combo milestones | Five/ten milestones remain once per crossing, with reset/expiry checks. | Preserved. |
| 7. Jump/landing and enemy phase animation | Confirmed getter assignment error. Twenty updates over 320 ms left landing recovery stuck at 90 ms. | Use public `play(name, loop, startFrame)`; recovery time advances independently of sprite success; committed poses use one clock. |
| 8. Action sounds | CombatFX suppressed original rhythm success calls; damage samples were bypassed. New cues also waited for all remote asset initialization despite a ready SFX graph. | Restore rhythm/damage samples, actual graph readiness, stronger envelopes and the shared twelve-voice cap/reset cleanup. Final loudness is unverified in Makko. |
| Musical scenery and Rhythm Mode entry | General effects feedback is positive; every scenery element was not individually accepted. | Entry field, storefront/street response and camera integration preserved. |

## Reproduction and validation

The [official Makko runtime](https://www.makko.ai/lib/MakkoEngine.min.js) has SHA-256 `f9fe349b2aa9fecb6dc5732c19e49182a8e46785402db204a7702fc7ed2b25d9` at this check. `AnimationReference.currentFrame` has a getter and no setter; Character/SpriteSheet accept a start frame through `play`.

With those actual exported classes and synthetic frame metadata, merged code reproduced the landing error and aborted both Corrupted and Firewall updates before overlapping-body damage. The repaired production owners pass with those same classes. The old writable `{ currentFrame: 0 }` stub missed this contract. The replacement exposes a getter and optionally loads Makko itself:

```sh
MAKKO_ENGINE_PATH=/absolute/path/MakkoEngine.min.js node tools/check-level-01-responsive-combat.js
MAKKO_ENGINE_PATH=/absolute/path/MakkoEngine.min.js node tools/check-frame-ownership.js
```

The downloaded runtime is a temporary test input, not redistributed code. Source art is unchanged. The generated receipt records required `npm test`, `npm run check:syntax:all`, exact tested commit/tree and official-runtime checks. The inventory refresh adds one fixture and updates three shifted declaration line numbers. Cinematic coverage now executes the actual owner: the neutral frame remains frozen and resumes after release, replacing a brittle source-string assertion.

Audio tracing reproduced zero original rhythm-success calls with CombatFX present. A legacy success changed the whole SFX bus from 1 to 0.9 and scheduled a delayed restoration. Restored samples now use per-voice gain, preserve user bus volume and dispose with synthetic cues on reset. Failed sample loading uses a bounded synthetic fallback. The ready-graph/all-assets flag failure is a reproduced conditional startup fault; the owner's actual context state was not captured, so it is not asserted to explain every silent action.

All three existing rhythm WAV URLs and the damage WAV returned HTTP 200 with `audio/wav` during this check. This verifies availability here, not browser decoding or audible playback.

New cue peak is 0.18 (empty cue 0.06), with a short sustain before decay. Music gains/timing are unchanged. Routing, sample preference, voice limits and lifecycle run against production code with audio boundary stubs. These are not listening tests. Native browser download failed in this workspace; final mix, browser permissions and asset decoding require Makko testing.

Known host dependencies remain: Makko serves `/lib/MakkoEngine.min.js`; two optional local whoosh MP3 references use existing fallbacks. Remote audio/art hosts, music sources and artwork are unchanged. No engine/bundler dependency, geometry change, damage/boss rebalance or mission rewrite is included.

## Focused Makko test and evidence

Import the exact draft revision into a duplicate Makko project. Restart the preview to clear old script instances and the old SFX bus state.

1. Let 6 Bit spawn and land without input. Jump/land repeatedly, walk immediately after landing, and enter/exit R. Idle/walk must resume without the getter error. Pause/resume during a jump once.
2. Stomp a Virus, bracing/charging Corrupted and attacking/recovering Firewall. Each descending head landing should kill the ordinary enemy and rebound safely. Touch each body from the side separately: one normal damage event with immunity, not delayed damage after clipping. Record health before/after any disputed hit, enemy type and a short clip.
3. With music playing, compare R entry/exit, on-beat Down with/without a target, a miss, jump/land/stomp, damage, lift, pickup and combo five/ten. Rhythm success samples should be back. Cues should be audible without masking the beat/warnings.
4. Check the improved effects/flow. Use the two-hit lift, complete a hack, finish the sixteen-hit Jammer and verify R stays off through the cinematic. The normal quota remains twenty.
5. Use Go / Reset Boss for loss/retry and win/rematch; also restart the full level. Check for stale animation/cues or duplicate music. Existing balance and rebound/rearm rules remain.

If SFX stay silent, immediately after trying a cue capture this diagnostics call and the console errors:

```js
JSON.stringify(window.audioSystem.getRuntimeDiagnostics(), null, 2)
```

It reports context state, master/SFX gain, loaded rhythm names, active voices and the last cue's scheduling/block reason. Report SHA, Makko project/device, per-step PASS/FAIL and any contact clip. A scheduled cue does not prove speakers emitted sound.

## Post-merge deployment and rollback

After owner acceptance and merge, import/sync GitHub **main** at the actual merge SHA into Makko, restart its preview, and repeat steps 1–3 plus pause/retry smoke checks. Record deployed SHA and PASS/FAIL. The draft PR does not deploy Makko.

Rollback returns to `8d0cf73a223494b355d850930f4ac8047353804f` and restores the reported defects. Use a reviewed revert if needed; do not rewrite main. Accept this repair before further feature work.
