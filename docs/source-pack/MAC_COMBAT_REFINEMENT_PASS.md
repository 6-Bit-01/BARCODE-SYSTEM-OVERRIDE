# Mac combat refinement after city1

## Owner follow-up: concise opening and complete equipment audit

The owner rejected the remaining bat/weapon grips after reviewing `refine1` and requested every reachable frame, equipment combination and interaction be checked. The earlier running-placement receipt certifies its measured attachment points and recorded pictures; it is not owner acceptance of natural grips. The follow-up retains all approved complete-body artwork and inspects the actual sampler and painter through standing, locomotion, guarding, strikes, flight, kicks, occupied hands, carry/release, item loss and inventory transitions, in both directions. Final corrections and visual evidence must be recorded before the next preview is delivered.

The pre-level-3 opening retains all eight scene/art IDs, with one short cue per scene. Production shows the complete cue immediately: the common route takes nine advances, including the optional Continue at the 9 Bit margin break. Answering that single fourth-wall choice takes ten total inputs, with one short reply. Kave's ordinary opening/end conversations have no choice menus; the earned desk payoff takes one advance. Only 9 Bit's direct address to the player offers `Get it heard` / `Keep the receipts`. Ordinary relay/fixture instructions belong to Kave or DJ; 9 Bit's remaining rooftop aside explicitly addresses the player and camera.

The complete refinement checkpoint remains source `f902da798c57124bebaea766eab7a3fc7eda1e35` / site `dfa5560f0f4a9167e1665431f392be7118731eda`. Its original logs and package receipts remain preserved separately. New follow-up checks and release receipts use distinct `refine2`/`dialogue` names in `verification/mac-combat-refine-20261007`; prior results do not certify changed inputs. Private source/site PRs remain drafts.

The follow-up carries tools through flight, kicks, counters and landing with per-cel contact and wrist direction rather than hiding retained equipment. Detached scatter/coil/disc transport uses uniform factors 0.5/0.5/0.7 to match their authored embedded models; native ground/fire cels still suppress duplicate overlays. The last-charge inventory is empty after contact, but its committed attack retains the visible tool through recovery. Actual damage cancels that attack before dropping remaining-charge inventory, so hurt/defeat is unarmed and never creates a zero-charge duplicate.

Actual combat compositions exposed a foreground Canal truck hiding Mac during all four final-charge scatter phases. Foreground intact/cracked scenery now eases its opacity only where its registered, rotated world bounds overlap Mac's upper body. Props retain their depth, size, collision and destruction behavior; broken or launched objects keep normal opacity. Four corrected actual scenes and exact actor companions verify visibility and weapon retention. Unsupported HUD direction arrows now use the font's supported `>` character.

Carrying uses the versioned complete-body sibling `assets/mac-street-dynamic/mac-carry-low-front-v2.png`; all eight earlier selected supplemental PNGs are preserved. The nine-sheet bank declares 61 complete cels. Props keep their street dimensions, ground pivots and scale. Their support grip differs from the floor-center pivot, so physical handoff adds a measured per-kind/surface center offset to the native hand point. The holding point is `(73.515304364 forward, 121.564522903 elevation)`; the final pre-140 ms windup point is `(74.476288735, 178.743092964)`.

| Prop surface | Forward center offset | Elevation center offset |
| --- | ---: | ---: |
| Crate intact | 56.654676292 | -16.726618715 |
| Crate cracked | 57.464028712 | -18.345323720 |
| Barrel intact | 25.485668718 | 0 |
| Barrel cracked | 24.960191021 | 0 |

The existing 140 ms ownership transfer, 420 ms commitment, throw velocity/gravity, damage and drop/pause rules remain authoritative. At transfer the world prop starts at that measured floor center, preventing a backward or vertical teleport when the held overlay ends. Final earned-state handoff evidence accounts for the first existing 120 Hz ballistic step, rather than comparing two unrelated static poses. Art prompts, reference identities and the finite visual scope are recorded in `MAC_EQUIPMENT_FRAME_AUDIT_20261007.md`; final release receipts establish the tested changed head.

October 7, 2026. Continue the existing private chapter from retained source `bcd25f4` and website `1eee336e`, rather than restarting the city pass or replacing accepted artwork. This refinement implements weapon distribution, measured character scale and running grips, close body contacts and spacing, later encounter pressure, and boss HUD clarity. The core is frozen at the focused checkpoint described below; final wrapper completion, exact-head packaging, cloud results and hosted observation remain pending until separately recorded.

## Weapons throughout the city

The combat owner creates one reproducible loot layout at chapter creation. The wrapper supplies one unsigned 32-bit seed through `MacStreetCombat.create({ lootSeed })`, using the browser crypto source with a clock fallback. Normal checkpoint retry preserves that seed and checkpoint inventory; entering or replaying the full chapter chooses a fresh seed. The physics update does not call `Math.random`, reroll drops each frame or add another timer/owner. The public snapshot exposes `lootSeed`; `lootLayout(seed)` returns frozen layout data for review, and missing/invalid seeds use the deterministic `defaultLootSeed` of `5062979`.

Each district has two floor caches, one in each fight pocket, selected among readable authored positions with bounded local variation. The first Pipe stays at `(300, 880)` so learning the existing L/Throw pickup never requires luck. The late-alley Crowbar remains available for the shield encounter. All eight weapon types retain their chapter tiers, with a random supplemental cache in each of the later four districts. Firearms first appear at the canal; the opening streets cannot roll guns.

| District | Guaranteed floor tools | Seeded hidden rewards |
| --- | --- | --- |
| Service Alley | Pipe, Crowbar | One of the two crates, plus the car |
| Night Market | Shock Baton, Energy Blade | One stall/crate/barrel, plus the car |
| Transit Concourse | Gravity Hammer, one supplemental tool | One cargo crate |
| Relay Canal | Scatter Blaster, one supplemental tool | The barrel, plus the van |
| Rooftop Relay | Coil Rifle, one supplemental tool | One crate/barrel |
| Broadcast Plaza | Plasma Disc, one supplemental tool | The crate, plus the car |

The chapter therefore provides twelve floor caches and ten optional breakable weapon rewards. Reward kinds come from district-specific pools, preserving early melee tools and later gun availability. A reward is admitted only on the object's actual one-time destruction and remains a normal L/Throw floor pickup with finite native charges. The `prop-break` receipt names the actual `weaponPickupId` and `weaponKind`; it never claims an unadmitted drop. Existing health/power rewards, object dimensions, strength, car bounce, carry rules, weapon timing, damage and grip assets are retained. If the bounded pickup pool fills, only inaccessible earlier-district floor loot can be retired to make room; current/future drops remain bounded by the existing cap.

## Native scale and running grips

The supplemental sampler now applies one measured uniform factor to each complete native sheet, using the cap-crown-to-beard-tip segment against the accepted base model. The image, hand/item transforms and physical shot/carry anchors use that same scalar around the actual feet pivot. Native source rectangles, aspect ratio and PNG bytes remain unchanged. The eight factors are:

| Sheet | Whole-cel factor |
| --- | ---: |
| Guard | 0.948028823 |
| Run | 0.856016011 |
| Hold | 0.871293452 |
| Weapon | 0.972275404 |
| Pipe swing | 0.927693442 |
| Scatter Blaster | 0.923068198 |
| Coil Rifle | 0.924446345 |
| Plasma Disc | 0.940342227 |

Each of the five melee tools now uses individually traced native closed-fist grips through all four actual run cels: `contact_a` `(104,281)`, `pass_a` `(310,199)`, `contact_b` `(420,186)`, and `pass_b` `(51,258)`. Per-weapon hilt offsets/angles and original palm repaint masks remain distinct. Rear-arm phases place the item behind the whole body; front-arm phases retain front layering. The equipment review samples all four weighted phase checkpoints, including the formerly skipped `pass_a`. Scatter/coil/disc keep their original embedded complete two-cel run banks. The 64 native sampler/painter checks cover all eight tools, four checkpoints and both facings; they do not invent extra gun frames.

The compiled native attachment receipt couples core offsets to the chosen cels: Scatter `(67.267772750,173.870090584)`, Coil `(88.366194752,185.569008979)`, Disc `(98.887601932,174.721652493)`, and held prop `(59.826903630,121.929830769)`, expressed as forward/elevation world offsets. The existing throw release stays `(73.907,155.394)`. Registration SHA-256 is `726355025f1f53cebedd3a364f2550c6cefd1bff076f273be4c18f01e4c59f9b`. `native-placement-coupling.json` and the 27-group passed `native-dynamic-check.json` record this exact coupling and uniform-scaling integrity. The saved before/after native views were inspected by the parent; hosted animation, owner appearance acceptance and physical-device performance remain separate.

## Body contact, spacing and later fights

The version-7 core uses conservative inner-torso spans at the accepted standing display scale of 260 for regular actors and 335 for the Regent. Native transparent margins, antennae, hair, shoe tips and weapon tips do not expand a damageable body. Offset/radius pairs are Mac `(5,34)`, Scuttler `(-6,42)`, Lancer `(-8,44)`, Spitter `(-4,45)`, Guard `(6,48)`, Stalker `(-12,38)`, Mantid `(-6,46)`, and Regent `(-2,70)`.

Grounded crowd spacing uses an ellipse with both torso radii plus 18 horizontally and 54 on the feet-depth plane. Each movable enemy shares one total 260-world-unit-per-second separation budget across all pair contacts. Only approach and recovery can be moved; published warnings, active attacks, stuns, grabs, flights and knockdowns are untouched. Committed melee sweeps intersect the target's directional torso span instead of a symmetric rear reach; the Lancer no longer deals spear-lunge damage behind its committed origin. Projectiles retain their exact lane/jump caps while using torso spans horizontally.

The opening two districts retain a maximum of one close attacker. Districts three through six allow at most two, with fresh warnings still spaced by 300 simulation milliseconds and every committed tell/lane/full warning duration preserved. Later enemies approach at 1.15 times the original speed and non-boss recovery takes 0.82 times the original duration. Damage rises by one in districts three/four and two in five/six; zone healing is 22 rather than 28. Existing enemy HP, player weapon timing/damage, grab strength and the Regent's exposed recovery windows remain unchanged. The final city behavior check earned thirty defeats/twelve waves/six districts, observed the one/two commitment limits and sampled 83 settled inner-body clearances. The full 18-unit spacing buffer may compress transiently; the sampled actual inner torsos remained clear. Final wrapper behavior is recorded separately, not inferred from that route.

The twelve authored pairings, all six alien families, Null Regent, powered fixture interruption, three boss phases and exposed recovery remain. No extra encounter, dialogue menu, new action button or second simulation/input/audio/save owner is introduced.

## Boss coach visibility

The wrapper now suppresses the ordinary lesson/radio coach while a living boss is in its real warning, committed attack or exposed recovery window. Active held-enemy/held-prop instructions retain their priority. The phase name, response label and exposed countdown continue to read the actual combat snapshot; the display does not create an extra recovery clock. Final wrapper checks and native/browser readability for this changed head remain to be recorded.

## Evidence and continuation

The first loot-only checkpoint remains preserved under `mac-city-polish-20261007`. The focused loot checker was then rerun once against the final combined core SHA-256 `ebb43230912d86de9b00d08e17704aa0c8c32044786742dd48b3a79080e08957` and passed all four groups. It checked 64 distinct seeds, both fight pockets and optional prop rewards in every district, all eight type coverage, no early guns, unobstructed L targets, immutable layouts and stable retry. A genuine public-input six-district route equipped all twelve floor caches and all ten actual prop rewards once, with thirty defeats and twelve completed waves. The final receipt uses seed `42` and reached `desk-ready` at `176108.33333335526` simulation milliseconds.

The final small receipt is project-root `verification/mac-combat-refine-20261007/weapon-loot-receipt.json`, produced by `tools/check-mac-street-loot.cjs --receipt-out`. It names the core hash actually loaded. Existing arsenal assertions continue to require real weapon contacts; a seeded cache moved away from enemies must be carried to a genuine target rather than weakening the damage assertions. Any subsequent core change requires fresh affected checks.

Local final-core checks pass: combat (26), arsenal (17), city (4), power (6), directional contact (1) and loot (4) groups. The arsenal preserves every existing assertion for eight real weapon damage types, finite charges, first-sweep point-blank shots, carry/hold timing, car bounce, pickups and retry. Its fixture changes use actual public inputs and earned parry/target contact; no state mutation or relaxed damage assertion is substituted. Native dynamic registration/sampling separately passes 27 groups. These are bounded simulation and native integrity results, without physical-phone FPS or owner feel acceptance.

Finish final wrapper/touch, lifecycle, syntax and required full source checks; build the exact committed native package; verify website installation and exact source/site cloud heads; inspect the hosted normal startup and chapter; and preserve the recoverable source archive. Earlier `mac-city-polish-20261007` receipts remain evidence for city1, not certification of this changed runtime. A semantic click on an underlying title button while the boot overlay is visible is not normal user-startup proof.

Source PR189 and website PR485 remain private review drafts. Eight approved introduction scenes, exactly two optional Kave choices, current cameo/canon integration, accepted original artwork/audio identities and the shared owners remain. Final Mac music, owner gameplay/appearance acceptance and physical-device performance are separate from technical checks and remain unrecorded for this refinement.
