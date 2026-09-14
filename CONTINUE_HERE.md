# Continue here — player motion polish

## Restrained player motion polish — September 14, 2026

PR #51 is merged. Base/rollback: `ea2921960477e38c74740dda378fcb513a8f1cc1`; branch `agent/player-motion-polish`. The owner requested less fidgety 6 Bit animation and small improvements to the current game, explicitly avoiding giant changes. Health sources, rooftop expansion, cloud secrets and traffic hazards were reopened for design discussion; they are recommendations rather than implemented mechanics.

The walk had uneven/repeated poses, a 46.5-source-pixel waist-registration span and faint overlapping limbs from its prior temporal blend. Reuse twelve complete-body drawings from immutable original art `a4c1b7cf6fec0a083a4812ae1ea76edef45a5911`, register the waist to within one source pixel, retain a restrained natural vertical bob, and pace the stride according to lower-body pose changes. No model generation, cutout rig, limb swapping or changed world movement is used.

The same 48 animation keys describe four coherent one-second strides, with bounded 45–135 ms pose holds. Only twelve image cells are stored: atlas 2304×640 instead of 2304×1920; 493,234 bytes instead of 2,512,406 (80.4% smaller transfer, 66.7% fewer decoded pixels). Cell size, source anchor, 300 px/s ground speed, collision, controls and total four-second clip contract stay the same. Jump, rhythm and the just-repaired idle were inspected; their current imagery and phase timing remain.

Active immutable artwork: `39410b034c9444861f8f30836e31f9ec252d92fe`. Manifest: `7f77b53dce9cd340bf74b33f38c673a2987a9c5d`. The generic temporal tool recognizes the bespoke packed walk and cannot overwrite it. Added production-playback checks exercise the actual unequal pose durations at 30/60/120/144 Hz, loop boundaries, pause and irregular deltas. Published revision, full-suite and CI evidence belong to the PR and generated source receipt. Native sprite inspection/comparison is not hosted Makko acceptance.

See `NEXT_SMALL_GAMEPLAY_PASS.md` for the grounded health/rooftop recommendations and the top of `ACCEPTANCE.md` for this walk-only review. Larger design suggestions do not silently replace the current mechanics.

Implementation is complete. Current publication and CI status belong to the PR and generated receipt. Do not regenerate the model art or repeat #51. Next is owner Makko walk review and a decision on the proposed health/rooftop pass.
