# Hack and rhythm power pass — September 17, 2026

Base/rollback: merged #85, `62b44f7cf5446b38bec18746411587327cedb142`.
Branch: `agent/hack-rhythm-power`. Exact published head/tree and CI belong to the delivery receipt.

## Implemented

Hacking uses a 16% base hostile/world speed (gentle 14.8–17.2% pulse). Enemies, traffic, particles, procedural scenery and the silent skyline video now visibly slow together. The player animation, puzzle scan/deadline/input, camera and music retain their existing real-time owners. Movement remains reserved by the puzzle, with Cancel returning it immediately. The silent video uses a steady 16% rate rather than rapidly modulating a decoder.

Grounded hacking uses a dedicated phase-controlled open-hand sequence from the **existing approved 6 Bit idle atlas**, with a held breathing pose and a brief guard reaction. This is new animation logic, not a newly drawn sprite sheet or a replacement character. Ring/tether/target effects, a cold live-scene treatment, entrance collapse, return wave and the existing one-use guard's shard deflection complete the hack presentation. Airborne and cinematic poses retain precedence. No additional invulnerability or damage is introduced.

Rhythm gains transport-sampled pressure rings, equalizer columns, a restrained edge pulse, entry surge and connected-hit ripples with stronger perfect/combo accents. Existing combat effects, damage, target radius and beat judgment remain authoritative. Misses do not invent connected-hit feedback. Five deterministically synthesized SFX cover hack entry/return, guard deflection, rhythm entry and selected strong connected impacts. They share the existing SFX volume/output/voice pool, protect critical warning voices and dispose on completion/reset. No new downloaded audio or game artwork is required.

Active hacking retains #85's **opaque fixed terminal beside one live scene**. The new screen treatment is clipped to the scene and cannot fade or cut out the keypad. Preferences reduce moving/flash effects, without reducing power or rewards. The frame-owned owner bounds transient effects to 24 and cached audio buffers to 10; it owns no input listener or interval.

## Preserved boundaries

No edits to `audio.js`, music profiles, the music director, transport, source files/URLs, starts, native loops, playback speed, loop callbacks, calibration or judgments. The video rate change does not touch music. #85 settings/recovery, boss support, jammer phases, smart dialogue, original traffic outside hacking and elevator/collision behavior remain.

## Verification

`npm test` and `npm run check:syntax:all` passed locally. The added production regression checks 30/60/120 Hz timing, real-time puzzle and approved getter-only sprite API, landing/airborne precedence, dispatcher deltas, one guard, pause/cancel/reset, skyline reset, ten finite 44.1/48 kHz buffers, cache/voice limits, critical-voice protection, actual rhythm hooks and clipped/read-only drawing. Earlier fixed-speed assertions were updated to the deliberate 16% contract; encounter setup waits for actual initial spawning before checking slowed grace.

`node tools/check-mode-power-browser.cjs` passed in real Chromium using the production synthesis and routing with an OfflineAudioContext scheduled-time/state adapter. All five cues produced nonzero finite PCM, peaks below 0.31 at the fixture's SFX level, and zero remaining voices. This is not a full-game mix clipping guarantee or a hosted listening result. `node tools/check-music-audibility.cjs` also passed its controlled-spectrum real Chromium comparison; the protected music/source-schedule regression remains in the full suite.

`tools/render-mode-power.cjs` rendered four native production scenes with explicit Canvas/Makko atlas/host adapters: focus, deflection, reduced effects and rhythm impact. The fixed keypad was pixel-identical before/after drawing the scene treatment. These captures verify layout/art integration, not hosted Makko, device performance or physical-controller acceptance. Optional render tooling is not a runtime dependency.

## Review and deployment

Import the exact published head into a duplicate Makko preview. Near multiple enemies, enter hack: watch slowed hostiles/cars/rain behind the readable keypad; complete both puzzle types, cancel, absorb the one guard and take the next legitimate hit. Compare entry/exit and deflection audio. Try street, rooftop and lift positions, pause/resume, death/retry and both reduced preferences. Return to rhythm: verify the pressure rings follow the song, perfect/combo accents feel distinct, miss feedback remains truthful and warning sounds remain audible. Run through a music loop boundary and the boss/elevator smoke route.

Keep this a draft until the owner accepts hosted/controller/listening feel. After acceptance and merge, import the actual main merge revision, fresh-load, repeat the focused routes and record device/controller/browser and PASS/FAIL. No migration or configuration change. Keep the #85 import available for rollback.
