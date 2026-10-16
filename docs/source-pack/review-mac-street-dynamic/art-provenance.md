# Mac street equipment and complete action drawings

These project assets were generated with the built-in imagegen tool on October 6, 2026 (local date), then copied into the source with their native PNG bytes and alpha unchanged. No bitmap was resized, resampled, recolored, cropped into a replacement image, or assembled from character limbs. Native crop rectangles, feet pivots, and whole-item grip anchors are registration data only.

The identity reference was `assets/mac-combat-frames/mac-basic-v2.png`, the accepted Mac model with brown dreadlocks, orange beard, white/red/black face paint, black MODEM cap, tattooed arms, brown open vest, black clothes, and red sneakers. The object style reference was `assets/mac-street-power/street-props-v1.png`. Existing character pictures, enemy cels, six district backdrops, original music, and story portraits were preserved.

| Selected native source | Project asset | Use |
|---|---|---|
| exec-76cb6ac5-a0fb-48fe-8604-2c507ceb52e4.png | assets/mac-street-dynamic/mac-hold-carry-v1.png | Four whole grab/pummel cels and four pickup/carry cels; first-row guard proposal excluded from gameplay |
| exec-19007fd8-200c-4fe4-95ad-8d8bbdc47c85.png | assets/mac-street-dynamic/mac-guard-v1.png | Whole raised-forearm guard, careful guarded steps, compressed block |
| exec-719fd9d8-8a92-4a81-94cc-6c2382b4e923.png | assets/mac-street-dynamic/mac-run-v1.png | Four whole running cels |
| exec-64d521cc-44df-47e5-8b55-cd68c22ab18a.png | assets/mac-street-dynamic/mac-weapon-poses-v1.png | Whole melee load/contact/follow-through and firearm aim/recoil/ready |
| exec-27268bb3-f321-4066-bbfe-773f868d9284.png | assets/mac-street-power/street-weapons-v1.png | Eight whole native weapon objects |
| exec-114bf243-7e4a-4693-b02c-999190177d40.png | assets/mac-street-power/street-cars-v1.png | Coupe and delivery van, each intact/cracked/wrecked |
| exec-c95abe60-959e-4c01-ac6e-bcff2afd76ca.png | assets/mac-street-power/street-fixtures-v1.png | Barrel, streetlight, wall-backed terminal, each intact/cracked/broken |
| exec-a16a91b5-bab4-4b2c-a1a6-da9b052f2440.png | assets/mac-street-power/street-powerups-v1.png | Overdrive, Barrier, Impact, and three finite native shot images |

Generated source files remain under `C:/Users/jondh/.codex/generated_images/01a1033a-c1a6-7aa0-9ce9-295e72ae3419/`. Original car/powerup candidates remain there; selected cleanup variants were copied, without deleting earlier work. Transparent background was requested for every call. Alpha inspection checks the saved native RGBA files rather than assuming the preview's background appearance proves transparency.

## Prompt set

All prompts requested bold, detailed hand-inked comic game art matching the supplied references; complete uncropped objects or head-to-toe characters; coherent camera, proportions and costume; separated transparent gutters; actual transparent RGBA; no added scenery, labels, ground shadows, 3D rendering, puppet limbs, or watermark. The production instructions for each asset were:

- **Hold/carry:** four columns by three rows. First row was guard raise/brace/two careful guarded steps. Second row was grab reach, held lapel grip, rear-fist pummel windup, short gut punch. Third row was knees-bent pickup, supporting palms hold, and two loaded carry contacts. The first guard row was too close to the original idle pose and is explicitly excluded; it was superseded by the focused guard call.
- **Focused guard:** two columns by two rows. Both forearms actively cover Mac's face and chest, fists closed, elbows ahead of the ribs, knees bent. Draw a planted brace, two careful steps, and a compressed incoming-hit brace. This must differ from the old fists-at-chin idle stance. Preserve every identity/costume feature.
- **Run:** two columns by two rows. Four strong forward-leaning complete-character run contacts/pass poses, with opposing arms and clearly alternating legs, same three-quarter facing-right view. Maintain foreground-leg identity, head/torso size, costume, whole hands and shoes. Closed fists supply whole-equipment anchors.
- **Weapon action:** three columns by two rows, whole Mac without baked equipment. Top row: coiled rear-grip melee windup; forward closed-grip chest-height contact; low forward follow-through. Bottom row: right-hand grip plus left supporting palm aiming an implied gun to the right; braced recoil; compact ready. No body parts are separated. Whole native items attach only at the registered grips.
- **Weapons:** four columns by two rows. Top: worn taped pipe, wrapped crowbar, blue shock baton, contained cyan energy blade. Bottom: violet gravity hammer, three-barrel compact scatter blaster, long cyan-coil rifle, red/cyan plasma disc. Melee handles point low-left and heads high-right; firearm muzzles point right. Keep ergonomic grips, readable silhouettes, worn steel/copper and restrained energy edges.
- **Cars:** three columns by two rows. Same dark teal coupe intact/cracked/wrecked in row one; same mustard industrial delivery van intact/cracked/wrecked in row two. Every front faces right, with coherent cab/hood/front-wheel relationships. Preserve each vehicle's camera, body, scale and palette through damage states; finite rubble, no giant fire. A follow-up background-extraction prompt requested removal of diffuse backdrop haze and shadows while preserving all six vehicles and their atlas positions.
- **Fixtures:** three columns by three rows. Each row is intact/cracked/broken: caution-band steel barrel; cyan curved streetlight; wall-backed public terminal. The broken terminal retains its opaque backplate/recess and wires so destruction belongs to the wall surface. Broken fragments retain the family's scale and remain near its base.
- **Powerups/shots:** three columns by two rows. Orange Overdrive battery/lightning symbol, cyan Barrier core/shield symbol, violet Impact core/burst symbol; then orange scatter bolt, cyan coil dart, red/cyan plasma disc. They are physical pickups and finite shots, with coherent industrial materials, no text or UI badges. A follow-up background-extraction prompt requested removal of diffuse colored backdrop clouds while retaining finite shot trails and the exact six objects/layout.

## Registration and scale

The accepted Mac remains 260 world units tall; normal enemies remain at their accepted scale and the boss remains 335. Whole prop families share one fixed native-to-world factor across intact/cracked/broken states. Targets are crate 104, barrel 117, coupe about 175.5, delivery van about 227.5, terminal about 240.5, streetlight about 498, stall about 299, relay about 266.5. Damage rubble is not enlarged independently. Cars are limited to suitable outdoor streets/plaza/canal areas, with no cars on the rooftop or inside the concourse.

Whole character sheets use a uniform reference scale per sheet and authored ground pivots. Supplemental grip anchors place a whole weapon or prop at a complete character's actual fist/palms; they never transform a body part. Accepted walk, jump and combat frames keep their original bytes and registrations, with a separate supplemental anchor map for equipped items.

This is a private gameplay preview. New visual and gameplay acceptance, physical phone performance, and final Mac music remain owner playtest items. Generation and registration do not establish acceptance by themselves.
