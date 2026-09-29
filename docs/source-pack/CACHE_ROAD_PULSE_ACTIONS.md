# Cache Road actions — grounded pad review

## September 29 confirmed phrase art follow-up

The long road stretches after a successful button press now use a separate
`confirmed-bar.webp` painted tile, rather than the old pair of thin rails and
vector grooves. Four repeating bar tiles sit inside one continuous lane wash;
the artwork has four worn beat slashes in each bar. The renderer shows the
next four confirmed bars ahead and keeps the queued preview dim. Both remain
beneath traffic and follow road curvature; the four-bar section divider and
music capture duration have not changed. The new source PNG is in
`assets/cache-road/roadside/beat/sources/`. It was generated with the built-in
image tool using the existing phrase/pad art as style references, then cropped
and converted to a 512×256 transparent lossless WebP. Prompt: a continuous
top-down lane inlay with chipped cream edges, a translucent jade center,
four short beat slashes and tiny magenta/amber scuffs; no arrow, badge,
lettering, asphalt background or glow. Scripted production-draw stills show
two simultaneously confirmed lanes; Makko motion and music feel need review.

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

The inked comic marking lies flush with the blacktop, uses the road's perspective
and bend, and is drawn before opaque cars and red traffic warnings. There is
no floating halo or screen blend over traffic. Pads are harmless: missing one,
driving across one or pressing the wrong button costs no life or points.
While the car is centered in the marked lane within 145 units before or 30
after its center, pressing the marked button within the existing 185 ms
window **on the fourth beat of a measure** catches it once. Other beats do
not consume the pad. At the 75-unit/s speed ceiling, the 175-unit painted
reach lasts 2.33 seconds: longer than a 1.875-second four-beat cycle plus
both 185 ms timing margins. Slower speeds give more chances; speeding up
does not alter the song tempo. Braking or accelerating changes when the car
reaches that window; the marking itself stays at its world address. The
continuous strip indicates reach, not spatial beat positions. The HUD counts
through four beats, names the action and mapped button, swells the icon as
beat four approaches, and changes to an amber PRESS cue during the judgment
window. Timing settings apply to the input timestamp and the displayed cue.

Eight actual painted raster assets supply the pad, continuous approach,
phrase overlay, brief catch burst and separate Surge, Push, Brace and Refill
badges. The pad, strip and phrase art remain beneath traffic. The HUD burst
appears only after a successful catch. Simple vector paths remain as a
loading fallback for the action symbols.

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
pad draw order beneath a vehicle, checks beats one through three and the
fourth-beat HUD swell, and covers speed rewards, collisions,
checkpoints, the 100-bar song and old saves. The native production draw was
inspected at eight road positions with the current car, road and city art;
it is not a Makko frame. The owner still needs to judge visibility, density,
steering/timing, the longer music holds and audio feel in Makko after merge.
The separate vehicle, shadow, road direction, ship and parallax art follow-up
remains open. Add crew vocals only from an aligned supplied recording.
