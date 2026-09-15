# Thin rails and original traffic — owner-approved correction

The owner selected the **first, thinner continuous rail example**, reviewed the complete eight-issue plan, and said “Alright let's proceed.” Base/rollback is merged #57, `f048d229a51b9ecce801cd9d736613491c4ae2f9`. Branch: `agent/thin-rails-original-traffic`. Exact published head and PR belong to the generated receipt. Earlier references to new street traffic lanes or no roof lines are superseded.

## Implemented scope

1. Preserve the working separate dialogue and next-scene controls, deliberate full-intro skip, instant-text option and recent dialogue. No new intro or cast changes.
2. Preserve text-free heart repair capsules, carrier reward and full-health retention. No floating health text is added.
3. Bound contact separation to an enemy's supported roof/world, move the player only for the remaining clearance, resolve crowd overlaps in a bounded pass and retain a recovery grace period after protected overlap. Keep descending lethal ordinary stomps and eight-second hijack/reboot rules.
4. Replace detached barrier boxes with actual thin wall/pavement modules, a connecting elbow and roof cap. Tiles run continuously along the facade contact and the existing sidewalk/curb/street footprint. The tower's cap meets its beveled side below the tallest roof. Hardware draws behind foreground utility props. Pressure bends local field strands; authorized passage parts the field locally without erasing the background. Opening powers down the hardware. Gate blocking/unlock positions and collapse duration remain.
5. Preserve the shared sidewalk foot plane at y=856 and inspect it with existing shadows, lift, utility props and boss alignment. Do not introduce another arbitrary ground shift.
6. Retain Objectives, put an action in its title and show the immediate encounter counter. During hacking, a compact objective row sits above the keypad instead of being hidden or covered. Replace the repeated nearby-enemy H/Y sentence with the current input's key glyph; retain explicit ally/reboot/expiry status.
7. Restore one-screen-pixel muted roof-edge highlights at 24% opacity, aligned to painted parapet lips on masked roofs. Remove heavy glowing/dashed utility-platform strips; retain solid tops/sides/shadows. Keep actual building-top routes, selected foot masks, supported guards, rewards and the existing illustrated drone. Align its warning with its muzzle and shot vector; prevent a shot crossing a landing surface.
8. The shared keypad gets 16 seconds for answer entry from the start for every input type; tapping it no longer extends a four-second deadline. Practice answer entry is untimed. Display/memory presentation timing remains unchanged, and malformed live sessions retain a bounded watchdog. Preserve keyboard digits/Backspace/Enter and controller/pointer select/delete/submit/cancel.

Firewall approach animation now selects walk/idle after roof-edge movement is constrained. This avoids restarting both clips every update at an edge. Facing follows actual travel; the already-registered whole-body stride and original movement/attack speeds remain.

## Original traffic contract

Restore the production foreground creator from `6e3751ba1561d8694e0bdc9a623e74ac6a45624d`: size parameter 690, speed magnitude 72.5 per normalized 60 Hz frame (4,350 pre-zoom units/sec), random altitude -400..0, random direction/phase, bob 5..15, original transparent-frame handling, animation and art. Preserve the four-second spawn opportunities, 15% foreground chance, original pre-spawn whoosh and three-second delayed approach. No new ground lanes, alternating directions, nearest-player height selection or slower 540-unit cars.

The upcoming original car is selected when its warning begins, so the indicator names the actual approach. The three-second delay advances with the existing simulation/pause owner rather than wall-clock callbacks. A paused warning cannot elapse behind a menu. H does not reset, reposition or slow the car. The original normal-car creator and horizontal foreground render layer remain.

The newly added vertical camera reveals the original foreground altitude band; it does not retune the band's coordinates. Player horizontal world position is projected into the original car layer for collision. Common vertical translation/zoom cancels. Swept body contact handles fast passes and camera movement, excludes transparent margins/exhaust, and costs one bar once per car. Puzzle/invulnerability contact is consumed harmlessly so it cannot become a delayed hit after protection ends. Missing car imagery does not create an invisible hazard or substitute artwork. Foreground lighting again uses the original car array.

## Artwork and verification

Four transparent WebP parts are pinned to asset ancestor `08d5720f31020fd846ea6b93c76988ffef6e3fbe`, in `assets/thin-rails/`. The built-in image generator produced the parts from the selected concept. `provenance.json` records the prompt and whole-part preparation, including removal of the generated checkerboard outside silhouettes under the existing Python preparation authorization. Existing character, drone and car images are preserved.

`check-rail-traffic-correction.js` compares 80 seeded foreground cars directly with archived original production source, then exercises exact motion, 30/60/120 Hz approach/pause, projected swept damage, protected passage, roof-bound contact and both untimed keypad practice puzzles. The original source fixture is test-only and is never loaded by the game. Existing 75 climb, drone/hijack, gameplay, animation and intro checks remain. Update the static inventory for the deliberate new fixture/check, asset references and shifted source positions; no runtime exception is hidden by inventory regeneration.

The native render tool uses production geometry, UI and sprites with host image/sprite adapters. It produces street/roof views for every gate, utility-box and keypad stills, and a motion clip. It is not a hosted Makko playthrough and does not certify live audio/controller feel. Required test outcomes and exact tested revision belong to the generated receipt.

## Owner Makko review

Import the exact draft head into a fresh duplicate preview before merge. Watch both car directions at their original speed/altitude/scale, then take one hit and repeat under hack protection. Check all four full facade-to-road rails, their top caps, pressure, enemy passage and opening. Walk/reverse Firewall at roof boundaries and in crowds; verify protected overlap, clean stomps and hijack expiry. Climb the routes, inspect faint edges and foot masks, use both utility/lift access paths and collect heart/Amp rewards. Complete both hack puzzles with controller only and pointer input; wait in practice before submitting. Check dialogue ownership, Objectives, audio, twenty defeats, sixteen-hit Jammer, boss win/loss/retry and full restart.

Record imported SHA, PASS/FAIL and short clips. After acceptance and merge, read and import the actual new main merge SHA into a fresh preview and repeat. The previous main SHA is a rollback reference, not a claim that its rejected traffic/art choices were accepted.
