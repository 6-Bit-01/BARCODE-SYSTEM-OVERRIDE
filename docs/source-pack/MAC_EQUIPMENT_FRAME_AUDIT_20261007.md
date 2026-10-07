# Mac equipment frame audit — October 7, 2026

Mac now keeps each weapon in a measured, closed hand through the reachable movement and combat cels. Rear walk/run equipment stays outside the body silhouette; counter contact retains the tattooed guarding hand; retained guns and disc remain visible through jump, kicks, counter recovery and landing. Dedicated gun cels and detached transport grips use matching held dimensions. Ground pickups retain their existing dimensions.

All eight weapon types are covered in both facings. The last-charge attack uses its committed weapon through recovery after inventory reaches zero. Real damage drops the weapon before hurt/defeat. Grapple and prop carrying occupy the hands and stow inventory. These legal ownership rules are kept separate from visual fixtures; no armed hurt/defeat or simultaneously held victim/prop/weapon fixture is presented as gameplay.

## Artwork and generation provenance

The eight original supplemental PNG sheets and approved base art, walk, air kick and six pipe attack cels retain their original bytes. The new sibling is a complete-body carry bank, not a segmented rig. No horizontal or independent body-part stretching was introduced. Each original sheet keeps its measured uniform head-to-body calibration.

Selected new asset: `assets/mac-street-dynamic/mac-carry-low-front-v2.png`, 2,002,112 bytes, 1536×1024 RGBA, SHA-256 `f60d950343d3198eee51f1147eacc232cf76d740d004c9a74c5c60b881df7a33`.

Mode: the built-in image generation tool, following `C:/Users/jondh/.codex/skills/.system/imagegen/SKILL.md`. Transparent background was requested in every call. References were inspected before use:

- `C:/Users/jondh/.codex/.chatgpt-projects/g-p-6a52f588fb708191961f8109dc24fc41/level2-minimal-source-20261003/assets/mac-combat-frames/mac-basic-v2.png`
- `C:/Users/jondh/.codex/.chatgpt-projects/g-p-6a52f588fb708191961f8109dc24fc41/level2-minimal-source-20261003/assets/mac-street-dynamic/mac-hold-carry-two-braids-v1.png`

The selected generation is preserved at `C:/Users/jondh/.codex/generated_images/01a11766-6cf2-7e51-bff4-487499770fbc/exec-bc957238-3132-4a02-8b1d-304bc4ad7e86.png`. The preceding candidates remain recoverable in that same generation directory as `exec-ab88d51b-72bb-4d1c-8bda-ec1f2836af9d.png`, `exec-509d4ff8-ca86-42eb-a6ad-e5a120c28ff5.png`, `exec-4f23f421-9722-4906-87e4-d34fa092f2c0.png` and `exec-0c0614c4-603d-48cb-924d-16b9a40c0ebf.png`. These candidates are not runtime assets and were not deleted.

Final edit prompt:

> Use case: precise-object-edit. Production complete full-body beat-em-up carry sheet. Preserve all six entire characters, exact heads, faces, TWO braids, outfit, legs, shoes, body proportions, grid positions and clean transparent alpha. Make one anatomical adjustment to BOTH supporting arms in the carry poses (TOP MIDDLE hold, TOP RIGHT stride, BOTTOM LEFT passing step): extend the forearms FORWARD horizontally at BELT / WAIST HEIGHT, so BOTH upturned supporting palms are well ahead of the character's FACE in horizontal position, rather than beneath his chest. The near elbow should bend naturally around 120 degrees and project forward from his tattooed upper arm. The two palms must be side-by-side underneath an invisible crate, roughly at local x420 and x470 within each512px cell, with head center aroundx270. Near supporting palm should be 80–100px horizontally AHEAD of nose, never below/behind nose. Hands should support a heavy load from BELOW with curled natural fingers; palms UP. Do not draw the crate or any prop. Adjust top-left pickup squat to reach palms forward similarly near the ground. Adjust bottom-middle throwwindup supporting palms to extend forward at upper-chest height, still ahead of face, so it can lift same load. Leave bottom-right release and all legs unchanged. No long rubber arms or detached limbs: complete cels with natural arm lengths, lean upper body slightly back if needed. No background, mist, glow, shadows, labels or new text. Actual alpha transparency.

The final edit referenced the preserved preceding complete-sheet candidate `exec-0c0614c4-603d-48cb-924d-16b9a40c0ebf.png`. The original reference character remains the identity source. Both root and the independent visual reviewer inspected the selected character and actual composites. The brown RGB visible in a raw preview is underneath alpha-zero pixels; sampled inter-cell background and seams were transparent. The actual painter composites show no opaque rectangular backdrop.

## Native registration and physical continuity

The new exact bank contains six complete cels: `carry_low_pickup`, `carry_low_hold`, `carry_low_stride`, `carry_low_pass`, `carry_low_windup`, `carry_low_release`. The crop seam is native y505, preserving all visible ink. Uniform calibration uses cap crown `(265,18)` to beard tip `(283,144)`, factor `0.8926066366976507`; effective standing height is `541.1118180646071`. Feet and both palm silhouettes are measured in each source cel. The distinct narrow passing step and wide stride remain separate.

Held crates and barrels retain their ground display size. Their underside grip points and precise finger silhouettes put both hands on the lower edge while keeping Mac's face visible. Crate intact/cracked grips are `(55,259)` and `(55,251)`; barrel intact/cracked grips are `(70,321)` and `(70,311)`. Ground pivots are unchanged. The native `carry_low_release` remains available in the source bank; actual post-transfer animation uses the approved existing release/recovery cels.

The exact physical ownership transfer remains 140ms. Hold uses the low support cel and pre-transfer windup lifts the prop. The core release origin is coupled to the last held native pivot, including distinct intact/cracked world-center offsets:

| Surface | Forward center shift | Elevation center shift |
| --- | ---: | ---: |
| Crate intact | 56.654676292 | -16.726618715 |
| Crate cracked | 57.464028712 | -18.345323720 |
| Barrel intact | 25.485668718 | 0 |
| Barrel cracked | 24.960191021 | 0 |

Hold anatomical point is forward `73.515304364`, elevation `121.564522903`; release anatomical point is forward `74.476288735`, elevation `178.743092964`. No throw timing or damage changes accompany this coupling. Separate actual 120Hz last-held/first-world states cover all four surfaces in both facings, with one ballistic step accounted for by the physics receipt.

Held-only `itemScale` is validated in the sampler and strict builder. Scatter and coil transport models use `0.5`, disc `0.7`; the item painter receives this only for equipment attached to Mac. Raw ground `drawPowerCell` retains its default scale of one. Palm masks, angle and layering remain individual per cel/weapon.

## Verification and retained review evidence

The existing native frame checker passed all 27 groups, including actual PNG byte hashes, source bounds, alpha coverage, uniform calibration, feet, hand metadata, exact nine-sheet/61-cel set, exclusive prop support cels, retained weapon transport and invalid held-scale rejection. The strict builder pins the new exact PNG SHA and exact six-cel set; original pins remain enforced.

Evidence is retained under `C:/Users/jondh/.codex/.chatgpt-projects/g-p-6a52f588fb708191961f8109dc24fc41/verification/mac-combat-refine-20261007`:

- `native-equipment-final-check.json`: native 27-group check; SHA-256 `739a05f5ef2294cea35f049e38516024523168e06d452233bfb973238976b719`.
- `native-equipment-final/equipment-audit-receipt.json`: 466 legal distinct frame/facing placements, 84 actual production painter JPEG pages including closeups, 9,762,995 JPEG bytes; SHA-256 `b095eca5c6a09768e1e31fde7d8304009f43dfb2acceb17dbbab835bdab15095`.
- `equipment-final/native-earned-stills/native-earned-render-receipt.json`: 108 actual native1920×1080 scenes, 28,940,617 JPEG bytes; 92 actual public-input interactions and 16 exact carry handoff states; SHA-256 `e718f7c057a4305787a28de4cd1afc60e1a794caabed0f1369cdbedde495e7b8`.
- `native-refine2-placement-coupling.json`: final geometry and drawing input hashes; SHA-256 `62edf8373e327ff0f14cfbd2d45cd9a67a553be941b70fc41d72ad534e922a1c`.
- `equipment-visual-review-final.json`: independent finite visual review passed after directly opening all 219 recorded pages, with 54 current source bindings. This includes the 84 native matrix/zoom pages, 108 earned interaction scenes and 12 later HUD/visibility/actor corrections, plus recorded character/story references. SHA-256 `0c321bdd5ebee89d9483fc24a831ad2884baa830c2c078989dc825a9bdbfee4d`. Acceptance is bounded to these recorded pages and identities.

The 92-state replay recorded the earlier `1d85f44f` hand-mask registration; final `4a245146` changes only palm silhouettes. These original simulation input hashes are preserved separately from final drawing hashes. The 16 later handoff states already record the final registration. Neither batch edits the simulation state for drawing. Native stills are diagnostic evidence, not browser, live audio, hardware frame-rate or owner play acceptance.

After these galleries, the wrapper's unsupported HUD arrow glyph was replaced with ASCII `>` and choice controller directions with `Left/Right`. This text-only change leaves body drawing, grips, ownership and geometry unchanged. The earlier 108-scene receipt keeps its original painter `3e7d78dae2b9507679e464914556c527670a0fa0e35d1040c258dce2dd337159`. Four actual scenes were separately redrawn with the HUD-only painter `7911567406010f50874bacadeff83f68d6f03199f8e712a9985af30dddde3acd` in `equipment-final/HUD-final/native-earned-render-receipt.json`: market arch objective, Canal objective, Regent pummel and Lancer pummel. Their original snapshots and earlier images remain preserved.

The independent review found that the foreground Canal truck hid Mac in all four actual Scatter last-charge states. The final wrapper now smoothly fades a foreground, unbroken, unlaunched prop only when its measured transformed bounds overlap Mac's head/torso; minimum opacity is 0.28. Depth and collision are unchanged. `equipment-final/visibility-final/native-earned-render-receipt.json` preserves four after full street scenes and four optical actor companions from those exact states. The companions use the actual `drawStreet`-selected `drawMacPose` arguments; only their neutral diagnostic canvas omits world occluders. Both full scenes and companions were directly inspected by the implementing agent; independent final review is recorded separately.

The final public equipment review shows physically unarmed hurt, committed last-charge inventory fallback, all run phases and release world ownership. Its Play link uses the private `refine2` label. Private source/site packaging, exact-head cloud verification and owner acceptance are separate release gates; production merge/publication has not been performed by this audit.

Retained diagnostic intermediates include the before, angle, carry, support, palms, closeup, crate-edge and crate-finger galleries. Their exact images, dimensions, hashes and bytes are in their existing receipts; helpers regenerate them only from the corresponding frozen inputs. Earlier evidence and generated variants were preserved. No cleanup or permanent deletion was performed.

## Frozen production identities

| Input | SHA-256 |
| --- | --- |
| `src/game/mac-combat-frames.js` | `fbcfe274c06db1523e9c5ba33e188b69c0f41e78f94e751848818820216d5784` |
| `assets/mac-street-dynamic/mac-modem-actions-v1.json` | `4a245146191fb24dd44d897de6ce05cec4b73b29efda415b92499ca93f797e0f` |
| `assets/mac-street-power/mac-street-power-v1.json` | `ccb7bc610db084d62f4ac205656ad1bddac108563f3edb1dffa1585d5cca853a` |
| `assets/mac-combat-frames/mac-combat-frames-v1.json` | `4dd8eb847862ec9c3ec0d10f1544546e50551a6f47e03417bffa56523280e7f5` |
| `tools/check-mac-dynamic-frames.cjs` | `fe6f75be854d2a1eac1f3dd8ee897ba969a7dc52721de65ffdc482af2f75cf80` |
| `tools/build-standalone.py` | `652165b70ac8e520f16b3ee02a5a7019837dbf43a50c9183599c2b20fabbe34a` |
| `mac-equipment-review.html` | `55f1d1c1228edc1c2f2ae2a039fb850a4d3c57295c742d2d7c8d6e3e10fc3db5` |
| `src/game/mac-street-combat.js` | `8108944b9fd9160ca0ba3d58428d4a73d365d69b834db8310f4b9791e7d36a47` |
| `src/game/mac-combat-preview.js` | `535e98a03b5bd041cfb7f3a8e625369e5bc1967133eb19488d565adca3824a65` |
