# Cache Road pedestrian travel review

The painted source pose determines whether a person moves. Six individually
placed walkers now have four footfalls toward the camera and four footfalls
away; the render selects the authored view and never mirrors it. The courier
walks beside and pushes the bicycle to the right, the skateboarder rolls to
the left, and the crate carrier walks to the right while holding the crate.

| Source family | Game sheets | Cels | Facing and behavior |
| --- | ---: | ---: | --- |
| Courier, mechanic, market worker, student, gardener, resident walkers | 6 | 8 each | Front row toward, back row away; four footfalls per view |
| Bicycle courier | 1 | 4 | Walks on foot, pushing bicycle right |
| Skateboarder | 1 | 4 | Pushes and rolls left |
| Crate carrier | 1 | 8 | Walks right with the crate |

The remaining twelve individual people stay on their original single still
cel, including every seated or standing figure: courier, mechanic, umbrella,
student, food worker, sweeper, handheld player, gardener, electrician,
waving resident, board player, and street cook. Their static composition may
face either side, but no walking animation is applied. This is the owner's
source-image behavior rule, not a blanket animation of all person cutouts.

The new WebP sheets are in `assets/cache-road/world/props/animation/` and
the editable generated PNG atlases are in `assets/cache-road/world/sources/animation/`.
`python3 tools/build-cache-pedestrians.py` technically registers their cells
to the original source aspect and foot contact. The original still WebPs remain
the loading fallback. The six walker sheets retain both authored directions;
the three travel actions retain only their painted left/right direction.
World-address offsets vary the phase, and the forward and rearview renderers
sample the same cel. Reduced Motion holds the first cel in the corresponding
facing row. This pass changes presentation only, not groups, scene addresses,
collisions, speed, sound or save data.

## Review evidence and limits

- [Frame board](review-cache-pedestrians/Travel-Frames.webp) displays all
  packed cels and their order.
- [Eight-second production draw](review-cache-pedestrians/Travel-Drive.mp4)
  shows their small roadside scale in the existing Cache Road composition.
  It is a scripted Canvas art capture, not a Makko input/audio playtest.
- The focused scene and asset-loader checks cover still-versus-travel
  selection, no horizontal travel flip, toward/away row, frame advancement,
  shared mirror phase, Reduced Motion, immutable request and bundled fallback.
  The local full `npm test`, all-file syntax audit, art-sheet geometry check
  and `git diff --check` also pass.

The painted art ancestor is published at
`6f128e9c3ddca5e642c01bd94d61d3ffbf18bf52` after the owner explicitly
approved public GitHub publication. The loader requests that immutable
revision first and has one bundled fallback. Hosted Makko appearance and
device frame pacing remain unverified.
