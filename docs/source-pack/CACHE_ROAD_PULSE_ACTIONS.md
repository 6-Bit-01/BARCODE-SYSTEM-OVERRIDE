# Cache Road pulse actions — review prototype

The owner replaced passive lane holds and the E/RB music seal with a driving
rhythm idea. Each face button has a different road action. The left and right
bumpers are special abilities; horizontal input steers, and up/down change
speed. This is a playable review balance, not accepted Makko feel.

## Controls and rewards

| Face | Keyboard | Road action | On a safe pulse |
| --- | --- | --- | --- |
| A / Cross | K | Surge | Catch the lane part for four bars and briefly accelerate. |
| B / Circle | L | Push | Catch the part and arm one traffic counter for 1.8 seconds. |
| X / Square | J | Brace | Catch the part and block one later collision. |
| Y / Triangle | I | Refill | Catch the part and add 40 Echo energy; at high speed, ready Turbo. |

Left bumper / Space spends ready Turbo. Right bumper / H sends the existing
Buffer Echo. Left/right or stick/D-pad steers; up/W accelerates, down/S brakes.
These bindings are specific to Cache Road. Level 1 combat/controller remaps do
not gain extra face actions. The pulse icon uses the controller's Xbox or
PlayStation labels, while the road's four music names stay unchanged.

The pulse chart repeats every four bars with a one-lane rotation. Glowing
mint rings, a four-point spark, an action label and a surface glow separate
harmless pickups from opaque vehicles and red hazard paint. The ring arrives
on the existing 128 BPM song clock, irrespective of car speed. A press within
185 ms of its beat and 0.38 lane of its center catches it once. Timing settings
apply to the button timestamp. A miss or wrong button costs no points or life.
The UI shows the next target, button and countdown without stopping driving.

A catch starts its lane part on the judged beat for four bars. Catching the
next pulse two beats later extends its part to eight bars; repeated catches
refresh only that lane. Four live parts set the full-adrenaline/vocal gate.
The four instrumental parts and steady Pressure drums are real supplied MP3s.
There is no sixth aligned crew-vocal file in this source, so the gate is
visible but no vocal audio plays yet.

Fast catches at 61+ speed double pulse points and every second fast catch
readies Turbo. Slower catches at 36 or less add 25 Echo energy; the Refill
button adds its own 40. Ordinary traffic passes still score and charge
Echo/Turbo. Push and Brace each protect one real impact in different ways;
an unprotected hit clears earned parts and breaks the music bus before
drums-only recovery. A fresh safe pulse can restart the mix quickly.

## Review and next pass

The focused production-module test drives the first five pulses with real
steering, clears authored traffic and reaches all four parts. It also checks
timed input, controller face/bumpers, fast/slow benefits, each collision
outcome, synchronized mixing, checkpoints, the 100-bar song and old saves.
`npm test` and `npm run check:syntax:all` pass. A browser MP3 check could not
run here because Chromium is unavailable. A native production-draw inspection
shows the mint rings and road placement but does not establish Makko visuals
or controller/audio feel.

The owner should judge whether the chart gives enough warning, whether the
four actions feel different, whether safe rings are unmistakable, and whether
four-part arrivals are satisfying rather than automatic. After that tune
event density, timing, visual weight and speed bonuses, then add enemy/action
variety. The vehicle, shadow, road motion, ship and parallax art follow-up
remains separate. Add vocals only when an aligned recording is supplied.
