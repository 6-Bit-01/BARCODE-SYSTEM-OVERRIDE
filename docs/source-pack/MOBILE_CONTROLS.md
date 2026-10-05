# Whole-game mobile controls

Current work: October 5, 2026. Implementation is complete; 19 focused mobile contracts pass. Actual browser/layout acceptance, full regression, exact-head CI and publication are pending. Base: merged performance PR183, `42b2a3157638a8742717095fbdea7055b6efeb71`.

The owner requests mobile joystick and touch controls throughout the game before the website release. Cover the real opening/title/menu, difficulty/tutorial, hacking, Level 1, road steering/gears/beat pads/skills, bridge, ending and results. Contextual actions must call the existing screen owners and keep their timing, completion and pause rules.

`src/core/touch-controls.js` exports `BARCODE.TouchControls` and launches once after `src/core/action-input.js` and `src/core/input.js`. Its DOM controls submit a virtual semantic input channel to the existing ActionInput/InputManager. Keep physical keyboard keys independent: releasing a finger must not release a held key, and vice versa. Support simultaneous stick/button touches and preserve short edge-triggered taps.

Controls enable for a primary coarse pointer or an actual touch, keeping a hybrid laptop's fine-pointer use dormant. The 19 passing contracts include release outside the control surface when pointer capture is refused, preservation of unrelated pointers, shared pointer/keyboard skip holds and independent physical keys. Actual browser/layout flow remains separately pending.

Use responsive safe-area layout and touch targets of at least 44 CSS pixels. Release every virtual hold on pointer cancellation, lost capture, blur, document hiding, layout changes and context transitions; a changed screen must not inherit a held action. Preserve accessible button names and normal browser behavior outside the control surface.

Retain one gameplay-frame/input/audio owner, the retained GPU renderer and complete native recovery. Add no control RAF, timer or Canvas. Preserve the native 1920×1080 frame, all 624 original artwork/audio hashes, judgments, music, economy and compatible saves.

Acceptance must include focused actual-module multi-touch/physical-key/release contracts and real browser touch interactions through the authored flow. Check portrait/landscape layout, opening/audio, menus/tutorial/hack, Level 1, road and comic/results transitions; retain keyboard/gamepad and existing recovery/resource gates. Complete full regression and exact-head source CI before source merge. Then build the final merged source, verify package identity, repeat site CI/preview checks and record deployment/live verification. GPU-only site PR481 has passed its current checks but remains draft; that evidence does not establish mobile acceptance or publication.
