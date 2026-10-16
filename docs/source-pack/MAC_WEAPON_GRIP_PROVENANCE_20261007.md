# Mac weapon grips — October 7, 2026

The owner rejected the floating guns, hand layering and two-handed disc hold. Three new sibling native sheets contain27 whole character-and-weapon cels. They use authored trigger/support hand occlusion, a one-handed disc rim grip, and empty-hand disc release/followthrough. Built-in imagegen mode was used with accepted character and weapon references; native PNGs were copied unchanged. Registration measures crop-local ground pivots, one uniform per-sheet body scale and the actual active muzzle/release point. No body-part rig or gameplay clock was added.

Saved assets:

- assets/mac-street-dynamic/mac-scatter-blaster-grips-v1.png — SHA25636667f70a3e14bfba05baf4bdf86dda013bc83cb826d340bc3216faf97c274e7
- assets/mac-street-dynamic/mac-coil-rifle-grips-v1.png — SHA256cd1fd6a52cf1df9fd9ff43a1a047768dc8b4285f6b7488685a45f565e1ecb297
- assets/mac-street-dynamic/mac-plasma-disc-grips-v1.png — SHA256ad23988027d373b8ca10af1f8e4b99e3adb1cb441c1040b37b9b533e7a8ef8e8

Each sheet is1254×1254 native RGBA. Measured ready-body heights are421/408/403px. All55 selected supplemental cels on8 sheets preserve the previous28-cel bank, including the6 pipe swing cels. Every visible native alpha pixel above8 is registered exactly once. Accepted flight/kick/counter/landing/carry/grapple cels temporarily stow these three weapons; inventory/charges remain intact. The disc release/followthrough contains no stationary disc; the physical projectile is rendered by the existing game owner.

Pose grounding references: [rifle stock shoulder contact](https://magpul.com/ar-stocks), [manufacturer fore-end grip](https://magpul.com/media/wysiwyg/GIS/MAG411_Angled_Fore_Grip_GIS_01.pdf), [backhand rim power grip](https://www.leylanddiscgolf.com/fundamentals/backhand). These inform the illustrated grip; the fictional weapons retain their existing designs and combat rules.

The following prompt set generated the original sheets and a targeted alternate walking-contact correction. Imagegen may redraw surrounding pixels; no claim of identical pixels across generation candidates is made. Earlier sheets are preserved. Static rendered inspection, automated gameplay validation, hosted byte verification and owner playtest are recorded separately.

## riflePrompt

```text
Use case: identity-preserve.
Asset type: transparent native full-character sprite sheet for an existing classic 2D side-scrolling beat-em-up.
Input image 1: accepted Mac/Modem character identity, linework, proportions, costume reference. Input image 2: weapon design reference; use ONLY the teal coil rifle in bottom row, third item. Rebuild proper rifle holding anatomy, never reuse the floating weapon or generic empty palms.
Produce ONE 3-column by 3-row sheet of NINE separate full-body animation cels, all facing screen RIGHT. Transparent background, no labels, no text outside existing costume. Wide clear transparent gutters, no overlap, no cropped hair/weapons/shoes. Each cel same head/body/weapon size and camera. Arrange evenly in nine equal rectangular cells; 2048 square preferred.
Character exact: stocky muscular adult Mac/Modem, skull white/red face paint, reddish ginger beard, exactly TWO long reddish-brown braids, black cap with small red MODEM, brown sleeveless vest over black MODEM shirt, tattooed bare arms, black cargo jeans, red high-top sneakers. Preserve original detailed inked arcade illustration aesthetic; consistent face, clothes, tattoos and skin.
WEAPON/GRIP: dark industrial compact stock, bronze fittings, horizontal glowing teal coil fore-end, same rifle design and scale in all cels. Buttstock seats against shoulder below cheek, NEVER at eye height or through face. Dominant near right hand wraps pistol grip with index finger at trigger and thumb behind grip; support far left hand cups UNDER front fore-end well forward of trigger, fingers curled up around side. Both wrists anatomically connected to arms. Receiver behind near gripping fingers, support fingers visibly wrap fore-end. Not two hands at trigger. No disembodied hands. Barrel clear of hands, aiming horizontally right. Rifle roughly half body height long.
ROW1: (1) relaxed combat ready, shoulder-held rifle angled a few degrees down, balanced feet. (2) aimed firing stance, shoulder contact, lean slightly forward, barrel horizontal right. (3) recoil: same grip, shoulder takes kick, small backwards torso recoil and slightly elevated muzzle, no muzzle flash.
ROW2: (4) walking contact A with near leg forward and far leg back, rifle secure at low ready. (5) opposite walking contact B, clearly alternate legs and counterweight, same rifle grip. (6) running stride A, longer stride and forward lean, rifle firmly tucked close across chest, pointed right.
ROW3: (7) running stride B opposite legs with distinct knees/shoes and no twisting feet, secure rifle. (8) guarded crouch, torso braced, rifle tucked close below chin, elbows in, no blade or fist pose. (9) hit reaction, stagger with bent knees and recoil torso, maintains rifle grip, no blood.
Create whole finished character-with-weapon cels with anatomically correct hand occlusion painted in. Do not separate body parts. No body-part assembly, no gun overlays or extra weapon icons, no duplicate discarded cels, no background, no grid lines, no smeared fingers, no extra braids, no extra limbs.
```

## rifleWalkEditPrompt

```text
Use case: precise-object-edit. Edit target input1 is a nine-cell transparent character-and-rifle sprite sheet. Change ONLY the WALK CONTACT B cel at ROW 2 COLUMN 2 (center cell). Its legs currently duplicate row2column1. Make the center character's NEAR tattooed-body-side leg step BACK with its knee bent slightly and the NEAR red sneaker trailing left, while FAR leg steps FORWARD to right with its sneaker planted ahead. Natural alternating walking contact phase, no crossing ankles or rotated feet, no running leap. Keep torso, face, two braids, cap, hands, correct rifle grip and weapon absolutely identical in that cel. Keep all eight other cels pixel/composition identical, keep the sheet dimensions, all cell locations, character scale and transparent background. Do not touch other poses or add anything. A clear opposite leg stride is required in this one center cell.
```

## blasterPrompt

```text
Use case: identity-preserve. Asset type: transparent full-character weapon animation sprite sheet for the existing classic 2D arcade beat-em-up.
Input 1: exact Mac/Modem character identity and illustration style. Input 2: weapon reference; use ONLY the chunky three-barrel Scatter Blaster pistol, bottom row second item (bronze dark metal rectangular top body, three muzzle openings, tan pistol grip).
Create nine finished whole-character-with-blaster animation cels in a 3-column by 3-row evenly spaced sheet, all facing screen RIGHT, same body and weapon scale, entire bodies and braids/weapons within equal cells and separated by transparent gutters. Transparent background, no labels or grid lines, 2048 square preferred. No extra cels.
Preserve Mac's stocky muscular proportions, exact skull white/red face paint, ginger beard, exactly TWO long reddish-brown braids, black MODEM cap, brown open sleeveless vest over black MODEM tee, tattooed arms, dark cargo jeans, red high-top shoes and detailed inked arcade art. Do not redesign face or costume.
Correct pistol grip: near right hand FIRMLY WRAPS the tan rear pistol handle; curled fingers visibly in FRONT of handle, thumb wraps opposite side and index at trigger. The far left support hand cups the gripping hand BELOW/AROUND the handle, NEVER under barrel or floating beyond muzzle. Gun receiver above fingers, barrel clear and points right. Weapon length about forearm length, not giant rifle. Every hand visibly connected to wrist/arm. Draw occlusion directly into full cels, no pasted weapon or detached parts.
ROW1 left-to-right: (1) balanced standing ready, blaster held in two-handed grip near lower chest pointed a few degrees down/right. (2) deliberate aimed firing stance, arms extended toward right, correct two-hand pistol grip. (3) small recoil with elbows yielding, same grip, muzzle slightly elevated, no muzzle flash.
ROW2: (4) walk contact A near leg forward, secure low chest grip. (5) walk contact B opposite leg forward, clear alternate legs. (6) run stride A with forward lean and long stride, blaster securely tucked to chest, pointed right.
ROW3: (7) opposite run stride B, clearly alternate leg/knee angles with grounded feet orientation, same grip. (8) braced defensive crouch, elbows close and blaster below chin, anatomically plausible. (9) staggered hit reaction, bent knees, torso recoils, retains correct grip, no blood.
Whole-body cel animations, no disconnected limbs, no body-part rig, no gun overlays. Preserve two braids in EVERY cel, no extra arms/fingers, no clipped shoes, no background or text outside MODEM costume.
```

## blasterWalkEditPrompt

```text
Use case: precise-object-edit. Edit target: nine-cel transparent Mac-with-blaster sprite sheet. Change ONLY the walking cel ROW TWO COLUMN TWO, the center cel. It currently duplicates the walking leg pose to its left. Redraw ONLY its legs and shoes into a visibly different opposite walking contact: the near leg travels BACK to the left with knee softly bent and heel lifting; the far leg steps FORWARD right with heel planting and toe lifting slightly. Natural modest walk stride, not leap or running pose. Make the trailing shoe's toe point right and the leading shoe's toe also point right, different vertical heights. Preserve upper torso, face, hat, two braids, tattoos, hands and blaster grip absolutely. All eight other cels untouched, exact sheet layout/dimensions/cell placement and transparent background preserved. No new objects, no grid lines, no extra limbs.
```

## discPrompt

```text
Use case: identity-preserve. Asset type: transparent whole-character sprite sheet for a classic 2D arcade beat-em-up.
Input1 character identity/style reference, input2 weapon design reference ONLY red metal disc with glowing teal inner ring at bottom right.
Create exactly nine full-body Mac/Modem animation cels in a 3-column by3-row evenly spaced grid, all facing SCREEN RIGHT, whole shoes/hair/weapons within equal cells with broad transparent gutters; matching body scale and view; transparent background; 2048square preferred; no labels, grid lines or extra objects.
Identity locked: muscular stocky adult, skull white/red face paint, ginger beard, exactly TWO long reddish-brown braids from black cap with small red MODEM, open brown sleeveless vest over black MODEM shirt, tattooed arms, black cargo jeans, red high-top sneakers. Same detailed inked arcade linework as character ref. Normal anatomy, consistent face and costume.
Disc: solid red outer metal rim, glowing teal inner ring, dark circular center, about torso-width diameter. Correct ONE-HAND rim power grip: dominant near right hand grasps outer rim, THUMB visibly on TOP near outer edge, FOUR FINGERS curl UNDER outer rim, firm wrist connected to forearm. Rim partly BEHIND gripping fingers. Free far left hand raised in guard or balance, never touches disc. Disc should look held firmly at the rim, not two-handed like a dinner tray or gun. Disc generally almost horizontal in carry, seen as ellipse. No fingers through disc center.
ROW1: (1) balanced ready, dominant hand holds disc by outside rim beside hip/lower ribs, free hand guard; disc slightly out forward right. (2) backhand windup, torso coils and near throwing forearm carries disc back across body toward left lower ribs, thumb/finger grip correct, free hand raised for balance; head still looks right. (3) RELEASE full body: weight shifts to leading right-side foot, near right throwing arm extends SCREEN RIGHT at chest level, palm opens with fingers naturally spread, wrist snaps, free hand back for balance. No disc in hand and NO airborne disc anywhere: the game draws the flying disc separately.
ROW2: (4) walking contact A near leg forward, right hand rim carry close to hip, left hand guard. (5) walking contact B opposite leg forward, same grip. (6) running stride A, longer forward lean and stride, disc held securely by right-hand rim near lower torso, free arm balances.
ROW3: (7) running stride B with opposite legs, same carry grip. (8) guarded crouch with disc gripped one-handed at chest side, free hand protecting face, no tray hold. (9) empty-hand FOLLOWTHROUGH after release, near throwing arm sweeps across/front naturally, torso completes rightward rotation and rear heel pivots, maintains balanced facing right. No held disc or airborne disc.
Finished whole-body authored cels, no disassembled limbs or weapon overlay assets, no extra braids, no extra hands, no clipped body parts, no muzzle flash, no background. Hands and rim occlusion must be anatomically drawn into each complete character cel.
```

## discWalkEditPrompt

```text
Use case: precise-object-edit. Edit target is transparent nine-cel sprite sheet. Change ONLY center cel at row2column2, preserving its face, two braids, vest, arms and one-handed disc rim grip. Replace that cel's walking legs with the opposite contact phase: near leg swings backward to LEFT, bent knee and heel raised; far leg extends forward to RIGHT with heel planting and toe slightly up. Keep a short walking stride, feet point right, no leap, no crossing ankles. Its silhouette must visibly differ from row2column1. All other eight cels, sheet dimensions, cell layout, body scale, artwork style and transparent background remain unchanged. Do not add a disc to the release or followthrough cels. No labels or extra limbs.
```

