# Cache Road — living sidelines and fitted tail lights

September 29, 2026. Base: merged PR #149,
`c15787189d7252cc8f45eee6a01c38ee0d5ea175`.
This visual pass preserves beat ONE, the verified 128 BPM / 4/4 song grid,
audible road time, buffered gears, rear-tire targets and existing gameplay.

## Light size follows the painted vehicle

The previous fixed pair of reflections did not fit narrow, tall or turning
vehicles and excluded the trike. Eleven vehicle/pose definitions now provide
measured lamp bounds. Each light gets its own road streak and lens highlight;
Cache's left, right and impact poses have their own bounds. The trike uses
one central reflection, while the sweeper and shuttle use narrow tall lamps.
Streak placement follows the rendered vehicle's turn. Braking still changes
brightness, and the sweeper remains one complete image per draw.

## People act according to their pose

Seven new four-cel sheets extend the existing walkers and travellers:

| Person | Motion | Ground behavior |
| --- | --- | --- |
| Cleaner | Sweeping stroke | Planted feet |
| Gardener | Watering | Planted feet and planter |
| Electrician | Repairing | Planted feet and cabinet |
| Resident | Waving | Planted feet |
| Board player | Playing | Remains seated |
| Street cook | Cooking | Remains at the cart |
| Handheld player | Walking with device | Travels toward the nearest outer edge |

Working and seated people now animate in place; this supersedes older
instructions that froze those complete images. Remaining bystanders have
a restrained planted idle, with no ground travel. Existing toward/away
walkers retain their authored views, and horizontal travellers face outward.
The main road and mirror share frame selection and placement. Reduced Motion
holds decorative poses. Original still art remains the loading fallback.

## More readable roadside activity

Market and diner frontages reliably receive carts, with context-appropriate
furniture beside them. Workshop, residential and district props sit nearer
their usable frontage. The default seeded route contains 336 props, including
24 vendor carts; these are whole-route counts, not simultaneous screen counts
or a measured increase over the prior build. The layout record is
`review-cache-living-sidelines/Living-Layout-Checks.json`.

The vendor cart has a replacement four-cel sheet with clean steam and cloth
motion. Six district effects use larger, measured sockets on the visible
facades: market, homes, workshop, greenhouse, data and transit. Their local
activity includes steam, windows, vents and indicator motion. They follow
the building through the existing contact-depth queue and appear in the
rearview as well. Open street mouths remain clear.

Inspection also found an unrelated-looking cause of misplaced effects:
24 greenhouse, data and transit block entries had top-left image anchors,
while road placement expected bottom-center. Their anchors now match the
other three families (`ax=.5`, `ay=1`), so foundations, facade effects and
depth contacts use the same position. Keep this alignment contract across
all 48 block entries.

## Delivery and verification

The immutable public art revision is
`172b7586864cace27eb55a85bfa2d63d96b77f89`, with a tree matching local art
commit `280ca22`. New person/cart source paintings and packed runtime sheets
remain in the repository. The expanded route audit passes 705 production draws covering all 48
animated/stateful sheets through actual world/HUD draws,
including work cycles and mirror routes. Direct sheet inspection remains a
separate check and cannot substitute for production visibility.

All 48 block anchors have been checked through production draw rectangles;
the vehicle-light board and all six facade-family boards passed visual
inspection. Full local `npm test` and `npm run check:syntax:all` pass. The
route audit checks work/prop/facade playback in both cameras; a separate native
pixel comparison confirms visible reflected activity for all six facade families.
The preserved timing suite passes 70,400 road-displacement comparisons, 21
changing-gear arrivals and 50 heard-downbeat inputs with 0–250 ms output delay.
Final-head CI must also pass real Chromium rendering/audio and byte-identical
hosted-art loading before merge; its outcome is recorded in the PR and generated
source-pack receipt. The owner authorizes merge after CI; Makko appearance,
controller/audio feel and sustained device performance remain owner review.
The 32-second input-driven capture uses all three gears, records seven perfect
catches and retains full integrity. Its cue, mix and playback events exactly
match the earlier Chromium audio replay; the current CI replays that trace
again. This pass makes no measured FPS improvement claim.

Review material is collected under `review-cache-living-sidelines/`:

- `Living-Details.mp4`: enlarged light, activity and facade inspection.
- `Drive-Review.mp4`: production drive with its matching game audio.
- `Vehicle-Lights.webp`, `Street-Activities.webp`, `Facade-Activity.webp`
  and route-quarter stills: visual contact and composition references.

These captures use the production renderer, not an owner Makko session.
The source pack retains both current videos and stills, plus the approved
layered-city baseline. The next acceptance step is the owner's moving
playtest of lights, planted work cycles and the busier sidelines.
