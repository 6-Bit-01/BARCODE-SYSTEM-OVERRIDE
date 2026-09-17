# Audible music response

Base/rollback: merged #82, `a0f9e79356210b0966f0a9d04113094b52b8e568`. The owner reports no perceptible change, then confirms the filenames are wrong and should be ignored. This correction treats source names as stable identifiers, not instrument descriptions.

## Cause

The director activates in the production integration rig, but the previous treatment was poorly matched to the audio. In a decoded 40–60 second excerpt, about 96% of the historical `fx-layer` energy is below 250 Hz and nearly all is below 2.2 kHz. Its earlier 4.2–16 kHz low-pass treatment had almost nothing to remove. The file named `bass-layer` instead has substantial midrange energy. Small gain changes and an approximately 10% maximum echo return further limited the audible distinction. This is not evidence of a source-sync failure or proof of what build a particular Makko session loaded.

## Changes

- Keep every source ID, URL, native loop, start offset, start gain and playback speed. `audio.js`, the complete transport and rhythm judgments remain unchanged. The existing protected baseline still applies.
- Assign colour/filter/echo to the actual midrange source; leave the foundation and low-bass path direct. No audio file is renamed, edited or replaced.
- Give exploration, combat, rhythm, hack, boss recovery and victory distinct arrangements. Hacking drops the low-bass layer and takes the midrange filter to 850 Hz. Return to rhythm restores it on the current beat grid.
- Four authored phrase variants change the low bass and midrange by meaningful amounts. Normal combat/rhythm pull back for the last two beats of each authored phrase, then return. The foundation remains at 0.4 throughout. Changes use ramps on running sources.
- A bounded echo accents hack entry/success and combo milestones, with the same four-beat rate limit. Its delay derives from the active profile's beat duration. Profile validation limits wet, feedback, send, filter and phrase multipliers.
- Dynamic music OFF maps the new roles back to the exact historical exploration/combat/rhythm gains. Runtime diagnostics include enabled state, actual colour source, filter frequency and phrase pullback state.

## Evidence and limits

The production integration check now inspects actual gain values and connections, confirms a substantial hack cutaway/return, follows phrase breaks, checks legacy Off exploration and remaps all phrase roles in the independent 92 BPM / three-beat profile. Existing three-loop/pause/source-schedule comparisons remain.

`tools/check-music-audibility.cjs` runs the production graph in Chromium's OfflineAudioContext. A controlled-spectrum fixture proves that real automation changes PCM, then the optional original-file mode renders identical 28-second excerpts with Dynamic music OFF and ON. Each run covers combat (0–7 s), rhythm (7–14 s), hack (14–21 s) and rhythm return (21–28 s). Source scheduling, steady foundation, direct routes, filter response, measured hack output and headroom are checked. WAV outputs retain float headroom without independent normalization. A/B excerpts use the same beat-aligned source crop; the runtime source offset is unchanged.

Run locally with `CHROME_BIN=/path/to/chrome MUSIC_ASSET_DIR=/path/to/original-mp3s MUSIC_BROWSER_OUTPUT=/path/to/output node tools/check-music-audibility.cjs`. The asset folder uses the existing source IDs as filenames. CI runs controlled and original-file modes and uploads the evidence. Numerical render checks establish changed output, not human hearing, taste or Makko-device acceptance. Use the newest ACCEPTANCE route before merge.

The A/B preview in `review-audible-music/music-ab-original-then-dynamic.mp3` plays original mixing at 0–28 seconds, a one-second gap, then the dynamic treatment at 29–57 seconds. Both halves use the same source excerpts and a shared 0.8 preview gain to keep legacy overshoots within the encoded file's headroom; neither half is independently normalized. The browser render uses 22.05 kHz stereo and controlled gameplay transitions. It is a rendered comparison, not a live play recording.

Measured original-file render: maximum absolute PCM amplitude is 1.131 with original mixing and 0.973 with dynamic mixing; the new treatment introduces no clipped samples in this excerpt. The hacking section's RMS falls from 0.230 to 0.081 while the foundation gain stays fixed. `pcm-review.json` records representative actual AudioParam values/connections and measurements. The controlled-signal browser test also passes. Full-suite, syntax and CI outcomes plus the exact published revision belong to the generated receipt.
