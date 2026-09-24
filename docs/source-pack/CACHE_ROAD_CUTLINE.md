# Cache Road: Cutline and painted phrases

## Playtest rule

The five existing MP3s still run on one 128 BPM clock across the four-bar intro and four verse/chorus cycles. Pressure stays on; Drive, Flow, Breakaway and Undercurrent are the four selectable road bands. A centered lane previews its recorded part on the next beat. After 0.5 seconds centered, **the next aligned four-bar phrase locks automatically** when that lane is recorded there and the ink meter has at least 60%. There is no RB or E lock action. One visit can arm once; changing lanes then returning is possible, but it requires another 60%. Holding the arm for 1.5 seconds total automatically extends the same start to eight bars for another 40% if the next four bars contain that part. An unavailable section spends nothing. These costs make the eight-bar hold a choice against stacking another lane.

| Driving event | Ink and payoff |
| --- | --- |
| Start | 100% ink: one four-bar lock plus an eight-bar carry, or one lock with 40% retained. |
| Close cut | Enter a vehicle's collision lane within 80 road units, then steer out to a narrow adjacent clearance before it reaches the car, while moving at least 38. Gain 70% ink, 35% Echo and a 150 × cut streak × active-stack score award; the distinct rising cue, road pulse and small top-HUD notice mark success. |
| Adjacent pass without a threatened-lane escape | Gain only 8% ink, 16% Echo and 25 × stack points. It cannot cheaply fund repeated captures. |
| Clean bar, freight draft, good curve | Gain 3%, 20% and up to 3%/second respectively. These make recovery possible without requiring every pass to be perfect. |
| Traffic contact | Keep the brief music cut/warp and signal/speed/time loss. Clear active and queued phrases, ink remains as earned; the road stays visible with no hit panel or hit text. |

Cut streaks cap at four and reset on a passive pass or collision. Two close or adjacent passes refill one Turbo; Turbo is a 1.25-second speed/protection burst, so spending it through a gate trades the chance for a cut against safety. Echo (H/Y) replays the recent steering trace. If sent before an audit locks its target, the audit follows the decoy lane; Echo also splits Clean Copy and the final original exit. These tools share the existing input/audio owners. The extra paired and three-wide traffic groups rotate by road pass, with at least one open lane and a projected warning on the threatened road surface. A player can avoid them early; a late exit earns the larger cut reward. The timing, density, and ink costs are review balance, not a claim of final difficulty.

## One road surface

The old full-lane tint, floating road-marker box, separate 58-unit transverse overlay, and four bottom cards are removed. A single projected phrase paint pass uses the road's own depth, curvature, lane edges and y coordinates; vehicles, studs and the player render above it. Each captured bar has an inset road tile, tapered rails, a transverse groove and two perspective chevrons. Four-bar boundaries and phrase names are stamped on the pavement. When a phrase arms, its four tiles print from far to near over roughly half a second; an eight-bar carry prints its second group separately. The markings advance with the music grid beneath the car. A compact top legend and ink/ability readouts leave the lower road clear. The checkpoint sign is painted on the surface; short cut and mission messages live in the header rather than on a central road panel. Reduced motion suppresses the cut pulse and peripheral speed streaks but keeps warning paint and the ink state.

## Evidence and limits

The production transport/road harness confirms intro bar 3 Flow can arm verse bars 1–4, the charged eight-bar carry, RB spam having no effect, a timed cut at 19.6 seconds followed by an automatic Drive lock at 19.95, the three-lane gate's open/blocked routes, and a no-steering/RB-camping run that fails near bar 10 at peak stack x1. It also verifies the Echo audit lure, collision reset, all 100 bars, final Echo exit, score checkpoints and old-save migration. Chromium decodes and plays the five supplied local and fallback MP3s, checks canvas ownership and the recovering collision bus. Nine native frames in `review-cache-road-sections/` include the painted approach, cut pulse, passing bar, final exit and clear collision view. Automated traces and stills do not establish Makko controller timing, perceived speed, musical taste or fun; those require the owner's import and playtest.
