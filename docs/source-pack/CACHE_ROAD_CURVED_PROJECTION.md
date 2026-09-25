# Cache Road roadside scale and projection — September 25, 2026

The owner rejected merged PR #123 after seeing the buildings in Makko. The
streetlights had a reasonable scale, but the road filled almost the whole near
screen and the locations looked small and detached. The earlier proof checked
that individual assets existed and grew; it did not establish that their
apparent size, footing or passing motion looked right beside the cars.

## Projection correction

The old near road spanned 1,760 of 1,920 world-screen pixels. Its roadside
offset had a fixed component even at the horizon. A location could also be
removed at a depth of .97 while some of its facade was still on screen. The
new near road spans 1,232 pixels. Its center comes from one world-space road
path and the camera tangent; the asphalt, four lanes, side street, parapets,
lamps, filler and places use that center. Roadside offsets converge toward
the distant road, then expand past the bottom edge. The artwork is scaled
uniformly, retaining each painted oblique footprint.

The ten foreground locations now have larger per-type bounds. At the opening
draw, the market is more than twice the rendered player car's width and
height; the right house is over 1.4 times its width and 1.7 times its height.
They continue drawing while their upper facades remain visible below the
driver, instead of disappearing at the old near-depth cutoff. Their varied
world spacing and left/right district choices remain deterministic.

The full area outside the road has a muted ground plane. World-fixed ground
blocks, wet texture, sidewalk joints and individual parcel foundations move
with the road curve. Low structures, fences and foliage fill the intervals;
the larger painted places sit above that material. The existing pole art and
its size formula are unchanged. Road pads, HUD, song bars, traffic, audio,
controls, save format and award boundary retain their earlier rules.

## Evidence and open judgment

The native renderer draws an uninterrupted 32-second route through the first
districts as well as scripted traffic snapshots. The production drawing
check compares opening place dimensions with the player car and follows a
market, lamp and near-screen passing facade. These checks establish scale,
determinism and draw continuity; they do not prove that the painterly angle,
ground material, density or speed *feels* right in Makko. The owner should
drive the merged build at normal size, through more than one district and a
noticeable bend, then judge the whole motion with music. The seven-part
adrenaline tune and defense/offense/traffic/environment/song/lane power-up
work remain in `CACHE_ROAD_COHESION_AUDIT.md` after this visual correction.
