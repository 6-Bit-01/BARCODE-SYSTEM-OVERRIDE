# Animated background asset, rain and central Jammer

Base/rollback: merged PR #66, `e79b30795ed825042c4bd27a28fd57e3c2da6c8f`. Review branch: `agent/animated-background-central-jammer`. The owner's latest request replaces the opposite-half Jammer rule and asks for a reusable background animation made here, without a new service account.

## Asset and runtime

`assets/world-v3/animated-background/far-background-loop.mp4` is a silent eight-second, 24 fps loop of the existing far-city art. Its smoke/cloud contours deform periodically. Source-colored building pixels outside the motion mask are copied unchanged before video compression. This is a baked animation made from the existing illustration, not generative video or moving camera footage. The source illustration remains unchanged.

The model-created selection mask, corrected mask, four keyframes, manifest and offline builder are included. `PROMPT.md` records the method and the correction of mistaken skyline selections. The video is 1,660,401 bytes. Its content is 2087×754, with one padded column for H.264; production draws only the original content rectangle at the established 4600-pixel fixed scale. Asset commit: `ac31c22a283ca0e62b25ed303e8360c383336c14`.

The existing background owner creates one muted, inline video. The game update and pause/stop hooks synchronize playback. Reset seeks to zero; disposal pauses and releases the source; reinitialization reuses the scene owner and creates one fresh decoder. A pending play cannot keep a disposed video alive or pause a newly resumed current run. The pinned asset has one bundled-path retry, then the original static image if media cannot play. No additional RAF, timer, audio source or runtime dependency is added.

Sky rain rises from 112 to 144 streaks and foreground rain from 144 to 184 (about 28%). Opacities rise from 0.30/0.32 to 0.34/0.36. Existing analytic motion, pause ownership and placement behind actors remain.

## Jammer and retained systems

The widened central band is x=1180–2916, approximately 42% of the 4096-unit level. Existing lift clearance removes the right-side candidates, leaving x=1200, 1400, 1600, 1800 or 2000 independently of the player's half. Initial/reset position is x=1600. Normal reveal after 20 mission defeats uses this chooser. Diagnostic APIs may still accept explicit test positions.

All safe candidates leave at least 800 world units of rightward boss-camera travel from the rightmost normal attack position. Tests retain the full attack-range exclusion at both lift lips. Jammer health/damage, mission quota, boss timing, original cars, training/mission warnings and damage, permanent terminal placement/depth, controller inputs, music and rooftop routes remain.

## Evidence and limits

- The offline bake checks an exact uncompressed loop endpoint and unchanged pixels outside the mask on all 192 frames. Encoded video has ordinary compression noise.
- The existing boss test exercises every safe slot from both ends of the map, lift exclusion and boss-pan distance. The full frame-loop environment check still verifies original foreground cars, WATCH OUT, actual health 3→2, training/mission roof follow and pause at 30/60/120 Hz.
- `tools/check-background-browser.cjs` exercises actual Chromium H.264 decoding, muted autoplay without a gesture, production fixed-scale video drawing, visible cloud motion, pause/reset/natural looping, restart/disposal and static fallback. CI runs it and retains screenshots/results. The scratch machine has no Chrome binary; local invocation reports that prerequisite rather than claiming a pass.
- Required `npm test`, all-JavaScript syntax and the existing intro browser check remain gates. Their exact outcomes, head and CI URLs are recorded in the generated receipt.

Canonical pack version 69 matched all 394 exported files at the base; its full prior manifest/receipt and qualified owner feedback are retained in `verification/pr66-merged-history.json`. This draft still requires the hosted Makko route in `ACCEPTANCE.md`, including media policy, visual feel, boss reveal and regressions, before merge.
