# The Cache Line — missed original exit

September 23, 2026. Base/rollback: merged PR #95 at `2cd9d40a44b6c91abc36c3d6d40a766dc9879c0f`. The owner found the faster chase better, but it appeared to loop or jerk back to an earlier moment. This is a focused correction to that playtest report, not a new road stage.

## Cause and change

At the original exit, the prior code silently assigned progress 1910 after a missed Echo split at 2060 and left play running. Road motion, nearby hazards and the rival then replayed; it looked like a broken loop. The final cue first appeared at progress 1840, roughly four seconds before the scanner at cruise, yet Buffer Echo lasted only 2.7 seconds. A prompt-following attempt could expire before reaching the exit.

A missed exit now freezes at its reached position and shows **ORIGINAL EXIT MISSED** with the relevant cause: wrong lane, no live Echo or insufficient separation. Enter/A is the deliberate retry from the saved Mirror Viaduct marker at 1700, with full Echo and at least 30 seconds. The road does not move backward until that input. An Echo sent in the final approach (1840–2060) lasts six seconds; elsewhere it keeps the original 2.7-second duration. The approach cue distinguishes an active Echo from the instruction to send one. A successful split still enters the causeway and can deliver the unverified original.

## Scope and verification (before the owner MP3 follow-up)

The proof's v1/v2 save envelope and marker IDs are unchanged. In the initial fix, five provisional 120 BPM sources, #95 driving/traffic/art, the shared input/frame/audio/pause owners, Level 1 Voice/return and separate Level 3 architecture test remained. No Bass key, Level 2 completion/result/lore or authored music was granted. The owner subsequently supplied tracks; `CACHE_LINE_MP3_STEMS.md` records their conversion and the current review mix.

`npm run check:cache-road-proof` now drives wrong-lane and expired/missing-Echo misses through the actual update path, checks monotonic progress until an explicit result input, verifies marker/energy restoration, and sends an Echo when the visible cue appears to reach a successful exit at normal cruise. Five native Canvas stills in `review-cache-line/`, including `05-exit-missed.webp`, support legibility inspection. `npm test` and `npm run check:syntax:all` are the required code gates. None establish Makko timing, physical controller input, sound or play feel; use the newest `ACCEPTANCE.md` route for the owner review before merge.
