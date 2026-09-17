# Smart boxes correction

The owner's final message rejects hiding text on every movement and requests moving/fading smart boxes. This pass builds on merged #78 (`ec89e7468a6f79bcafcaea8b07d3c75ab37a3cf9`), branch `agent/smart-box-motion`. Exact published head, PR, tree and validation belong to the generated receipt.

## Behavior

Walking, jumping and Rhythm Mode do not dismiss unread tutorial, lore or inspection. Dialogue uses 1100/860/600-wide readable shapes instead of the near-screen-wide strip. Height stays stable throughout a chapter and uses complete lines, not the typewriter cursor. Speaker/body/Continue stay together. Clear placements remain parked. A 260 ms smoothstep glide moves an obstructed panel to nearby safe space; active rhythm controls reserve their own area.

During an obstructed crossing, panel opacity drops and each actor's padded screen rectangle is excluded separately, so overlapping actor masks cannot XOR text back over another enemy. Opacity recovers over 120 ms. Reshaping uses the final readable dimensions, bounded on screen throughout the dissolve, instead of squeezing text through intermediate widths.

Only when every readable full layout is occupied does a small saved-message/held-signal tab replace the body. A 350 ms sustained opening precedes expansion. Unread cursors, Continue, closing/reading time and hack scan/answer/watchdog/input remain intact while unreadable. Tutorial/terminal/Studio Rat/lore priority stays intact. Reduced motion relocates directly without glide/reshape dissolve.

The hack terminal retains full and six-column compact layouts and the actual camera projection of the locked target, player and other enemies. Pointer regions match the drawn layout, moving keys reject taps, and the held tab permits tap-to-cancel. Keyboard/controller cancellation remains available. Stable digits, Erase, Submit and navigation retain their behavior. Objectives, wave/clear notices, attack feedback and lift prompts share movement/clearance.

The existing active game clock owns presentation: no new event loop, timer or listener. Pause freezes motion and owner resets discard layouts. Elevator artwork and rear/passenger/front-rail order, collisions, power, combat and story are retained.

## Evidence and limits

`check-smart-box-motion.js` exercises production placement for airborne readability, intermediate glides, dissolve/cutouts, steady parking, dock/recovery, reduced motion, retained cursor/input, restart and moving keypad protection. Tutorial checks cover keyboard/PS/Xbox at 30/60/120 Hz. Street-depth retains 24 target/camera/zoom cases plus moved pointer regions. Impact tests preserve Studio Rat/lore/inspect sequencing while correcting movement-hide assertions. Combat fixtures load the actual shared tutorial UI dependency.

Generate native evidence with `SMART_MOTION_REVIEW=1 node tools/render-level1-rebuild.cjs docs/source-pack/review-smart-box-motion`. It contains a seven-second staged production capture, six native stills and per-frame layout data using existing bundled artwork. Actor poses deliberately expose transitions; this is not a hosted playthrough. Older `review-smart-panels/` captures remain historical #78 evidence.

Required full-suite/syntax/CI results belong to the receipt. Owner Makko and physical-controller acceptance are pending. Follow the newest ACCEPTANCE route before assistant merge. Rollback/import baseline: `ec89e7468a6f79bcafcaea8b07d3c75ab37a3cf9`.
