# Stage opening dialogue and integrate monitor readouts

The images are visible after #42, but every line appears at once, monitor text floats in boxes and DJ Floppydisc's knob hand has incorrect anatomy.

This pass gives each scene an authored reading order and interval. Space, Enter, click or controller A reveals the next cue immediately; earlier dialogue stays visible, and the final cue waits for manual scene advancement. Loading, blur, hidden tabs and skip holds pause the clock. Five screen readouts now follow and clip to the illustrated monitor glass. Other captions use the page margin, with page 6's displaced caption following 6 Bit's refusal.

A targeted built-in image edit corrects DJ's page-5 hand and preserves the character/scene. The new WebP and provenance are included; the other seven images retain their bytes. All eight pinned public URLs match the bundled assets and provide CORS access. The existing fullscreen recovery, one-context budget, independent S/B skips and tutorial/gameplay are retained.

Base/rollback: `f1831f95c187bdd5afd9c8231d2a7a10ac262671` (merged #42). Branch: `agent/intro-cue-staging`. The generated manifest identifies the exact review head and PR. See INTRO_CUE_STAGING and the top ACCEPTANCE route for timing and owner review. One combined draft; do not merge before owner Makko acceptance.

Validation: production VM timing/input/lifecycle checks, full regression suite, all-file syntax, and native Canvas layout/art inspection. Chromium checks native input, fullscreen, decoded bundled art, retry and tutorial handoff in CI. Exact completed outcomes belong to the generated receipt and linked run. Its explicit initializer/gameplay/audio stubs do not certify Makko sprites, audible music or device feel. HUD/rhythm/attack variety follows intro acceptance.
