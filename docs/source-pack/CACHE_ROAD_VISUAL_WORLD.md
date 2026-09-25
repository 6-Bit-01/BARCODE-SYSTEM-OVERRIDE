# Cache Road traffic and layered roadside — September 25, 2026

This is the next visual pass after #119. It follows the owner's correction that
the side locations must recede diagonally, and that a continuous side-road
background, locations ("events"), pedestrians, and streetlights pass as one
world. The music and pad chart remain in their prior review balance.

## Roadside depth

| Layer, back to front | World placement | Visible role |
| --- | --- | --- |
| Distant, skyline and mid city | Existing independent slow parallax | Horizon and large city scale. |
| Side street | Both sides of the road projection; world-fixed 55-unit slabs | Continuous paved service route, curb, drainage and dashed markings. |
| Muted frontage | Repeating 640-unit painting on the outer side of the service route | Continuous low buildings under the authored locations. |
| Events | Four fixed locations per lap, alternating market/depot and side on later passes | Brighter storefront/depot blocks, connected plinth and small activity. |
| Walkers and streetlights | Fixed world positions on the projected sidewalk; lights at 142-unit intervals | Near motion/scale and foreground occlusion. |
| Parapet | Existing stretched wall by road world distance | Front edge that ties the side street to the driveable road. |

Every near-road layer uses `depth(at - progress)`, the same `roadY(t)` and the
same `roadsideX(side,t,base,growth)` curve. Event paintings and continuous
frontage are drawn in vertical slices along successive world positions. On the
left, their near end grows toward lower left; on the right it grows toward
lower right. Source crops, tile lengths and scene positions stay fixed through
braking, accelerating, pause and retry. The backing art is muted so an event
can enter and leave over it. Streetlights draw in front, from the same depth
function; reduced motion keeps world travel because it communicates driving.

## Traffic

| Vehicle | Path/consequence | Drawing cue |
| --- | --- | --- |
| Audit sedan | Locks the player's or Echo's lane at its existing warning distance; collision removes the stack. | White surveillance silhouette, magenta road footprint and pulsing roof scan. |
| Sweeper | Merges one adjacent lane over 120 units; at the right edge it merges left instead of going off road. Wide collision clearance. | Heavy amber brush truck, one-lane road arrow and alternating beacons. |
| Signal trike | Cuts one adjacent lane over 125 units, leaving its origin lane open; its smaller footprint gives narrower clearance. | Three-wheel mast silhouette, cyan projected arrow and pulse. |
| Night shuttle | Holds its lane with a wider body; a close draft charges Turbo and Echo. | Tall purple bus, `SLOW / DRAFT` and slow road warning. |

The new trikes and shuttle replace three existing van slots; the total hazard
count and paired gates do not increase. The opening and later authored
four-pad routes still cross without damage in the production simulation.
The trike and sweeper lane changes, shuttle draft, four-part routes, full
100-bar clock, final Echo and old saves are checked in `check-cache-road-proof`.
The asset loader uses immutable published art revisions and a local fallback.

Automated review after #120 merged caught two visual cues: the right-edge
trike's warning still pointed right when its cut goes left, and roof pulses
did not share the chassis bounce/roll transform. The follow-up points the
warning into the destination lane and anchors each pulse to its vehicle.
The focused proof covers both trike directions and the beacon transform.

## Art and review

Production WebP and editable PNG reductions are in `assets/cache-road/`.
The seven transparent paintings were generated with the imagegen workflow:
rear-facing surveillance sedan, amber sweeping service truck, cyan signal
trike, purple night shuttle, connected market block, connected relay depot,
and muted repeatable service frontage. Existing Cache traffic and city art
guided perspective and color; the event and frontage prompts required an
uninterrupted plinth. Original generation outputs are retained by the image
workflow; the repository PNGs are resized, full-color source reductions.

`CACHE_REVIEW_WORLD=1 node tools/render-cache-road-mirror.cjs <output-folder>`
renders seven two-second production-draw chapters. The normal mirror review
mode remains available without that environment flag. The preview and proof
are scripted/native views, not Makko play or an audio verdict. After merge,
use the short drive in `ACCEPTANCE.md` to judge depth, streetlight occlusion,
scan and merge lead time, physical controls and sound at real game size.
