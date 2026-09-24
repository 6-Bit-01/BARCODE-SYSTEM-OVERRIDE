# Cache Road — Lane Stack and Zone Review

## Owner correction

Merged #105 charges ink before a lane can lock, so stacking music feels random and often only one part enters. The owner wants a readable choice: drive in a lane for 0.5 seconds to lock that lane's upcoming four bars, or use RB to lock the current recorded part immediately **and** its upcoming four bars. Driving well should instead put the car in Zone, save time and make the next four-bar road section faster. This pass is bounded to that loop and the existing road HUD.

## Rules to test

| Action | Musical result | Driving result |
| --- | --- | --- |
| Center in a lane for 0.5 seconds | Freely queue the next aligned four-bar phrase if recorded. Example: intro bar 3 Flow queues verse bars 1–4. | No meter spend. One queue per lane visit. |
| E/RB in a lane | Immediately catch the current recorded remainder through its four-bar boundary and queue the next aligned four bars if recorded. | No meter spend. Repeated taps cannot duplicate or lengthen a phrase. |
| Cut late around threatened traffic | No gate on the music. | +70 Zone and rising cut score; a normal adjacent pass gives +8. Freight draft gives +20, clean bars +1. |
| A queued phrase starts with at least 60 Zone | All queued lane parts enter on the original song clock. | Consume 60 once, target speed 64 instead of cruise 54 through the aligned four bars, and add 1.5 seconds once to the time window (capped at 60). |
| Space/A Turbo, H/Y Echo | Existing mix continues. | Turbo briefly targets 75 and protects against impact. Echo lures an audit and enables the original exit. |
| Traffic hit | A short audible warp/dip, active and queued parts lost; transport remains aligned. | Speed/time/integrity loss; Zone ends. No collision text obscures the road. |

Sparse tracks remain unavailable before their actual recordings: Flow begins at song bar 5; Breakaway and Undercurrent start at song bar 13 and return at each verse B/chorus. The header names the available future entrance. Pressure drums remain steady; clean score scales with the number of captured lanes, up to x4. A single lane cannot duplicate itself into a multiplier. The old automatic 1.5-second eight-bar carry and the 60/40 ink costs are removed. The shared input, audio, RAF, save and pause owners remain.

## Visual and validation

The painted bars use the same curved lane projection, depth and road Y as traffic, with one road layer beneath vehicles. RB paints the current bar immediately and the next four-bar phrase ahead; queued bars reveal from far to near. The dashboard labels hold, RB, Zone, Turbo and Echo. The road edge turns gold during Zone. The meter is still stored under `lockEnergy` for v4 checkpoint compatibility, but it no longer blocks musical captures; fresh runs begin at zero. Historical indefinite locks from v1–v3 remain refunded through the existing migration.

The focused production harness checks empty-meter automatic locking in intro, immediate RB current+next and idempotence, real steering/holds to a four-lane queued stack, a timed near collision followed by an aligned Zone activation with speed and time gain, traffic gate routes, collision reset, the complete 100-bar chase and Echo exit, save migration and no campaign reward. Chromium exercises the actual MP3 decoder, bus and road draw. Native frames `10-rb-now-next.webp` and `11-zone-active.webp` complement the existing nine section views. Automated checks do not settle musical quality or driving fun in Makko. Import the exact main merge SHA for the owner review in `ACCEPTANCE.md`.
