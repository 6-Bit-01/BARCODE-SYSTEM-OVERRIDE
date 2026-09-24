# Cache Road actions — grounded pad review

The owner played merged #115 and rejected its floating, song-driven rings:
they came too fast, crossed traffic, appeared too often and distracted from
the landscape. This revision keeps the four driving actions but places their
opportunities at authored world positions. It is a playtest candidate, not
accepted visual or musical feel.

## Controls and rewards

| Face | Keyboard | Action | Catch reward |
| --- | --- | --- | --- |
| A / Cross | K | Surge | Catch the lane part and briefly accelerate. |
| B / Circle | L | Push | Catch the part and arm one traffic counter for 1.8 seconds. |
| X / Square | J | Brace | Catch the part and block one later collision. |
| Y / Triangle | I | Refill | Catch the part and add 40 Echo energy; at high speed, ready Turbo. |

Left bumper / Space spends ready Turbo. Right bumper / H sends Buffer Echo.
Left/right or stick/D-pad steers; up/W accelerates, down/S brakes. These
bindings apply to Cache Road only. The four music lane names are unchanged.

Two planned runs of four pads occupy each 2460-unit road lap. The first is
at 150, 365, 585 and 810; the second at 1260, 1490, 1720 and 1895. Their
lanes rotate with traffic on successive laps, keeping the authored gaps.
There are eight pads per lap instead of seven every four song bars. Runs are
separated by a clear stretch. Each run visits four distinct lanes with varied
actions. The player sees the next pad on the road before reaching it, and a
small HUD line gives its lane, button and distance while it is visible.

The mint marking lies flush with the blacktop, uses the road's perspective
and bend, and is drawn before opaque cars and red traffic warnings. There is
no floating halo or screen blend over traffic. Pads are harmless: missing one,
driving across one or pressing the wrong button costs no life or points.
While the car is centered in the marked lane within 55 units before or 18
after its center, pressing the marked button within the existing 185 ms beat
window catches it once. Braking or accelerating changes when the car reaches
that window; the pad itself does not follow the song clock. Timing settings
still apply to the input timestamp.

A caught part starts on the judged beat and lasts eight bars. A consecutive
catch in the same four-pad run lasts sixteen bars. Wider spacing needs this
longer hold for a deliberate four-lane route to reach x4; the durations are
review balance, not a final music rule. Four live parts expose the future
crew-vocal gate, but there is no sixth aligned vocal file, so no voice is
invented. The steady Pressure drums and four other instrumental parts are
the actual supplied MP3s.

Fast catches at speed 61+ double points and every second one readies Turbo;
slower catches at 36 or less add 25 Echo energy. Refill adds its own 40.
Traffic passes still score and charge abilities. Push and Brace protect one
impact differently; an unprotected hit clears earned parts and breaks the
music bus before a beat-aligned drums-only return.

## Verification and owner review

The production-module test steers through both four-pad runs with actual
traffic, reaches all four parts in each, verifies harmless missed input and
pad draw order beneath a vehicle, and covers speed rewards, collisions,
checkpoints, the 100-bar song and old saves. The native production draw was
inspected at eight road positions with the current car, road and city art;
it is not a Makko frame. The owner still needs to judge visibility, density,
steering/timing, the longer music holds and audio feel in Makko after merge.
The separate vehicle, shadow, road direction, ship and parallax art follow-up
remains open. Add crew vocals only from an aligned supplied recording.
