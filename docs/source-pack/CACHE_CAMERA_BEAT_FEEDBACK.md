# Cache camera repair and ground timing feedback

This owner-requested follow-up starts from merged PR #177. The reported
camera/frame drop concerns Cache's driving chapter (Level 2 in the source).
The earlier uploaded v2–v4 and PR86 archives remain historical inputs.

## Camera and bounded rendering

An earned clear previously switched the road camera to a neutral view in
one frame. The departure now starts from the last live zoom/offset/tilt and
settles over 1.1 seconds on the existing outro clock. Reduced Motion and
Flashes Off keep their steady view. The opening handoff remains gradual.

The actual transformed camera supplies conservative inverse viewport bounds.
Roadside sprite/surface culling uses those bounds, and fully off-view local
streets and courts skip their texture transforms and clips. Opaque sky/land
coverage reaches the inverse viewport so a roll or translation cannot leave
stale pixels along the frame edge. Physical world addresses, foreground exits,
actual speed, collision and the original mirror blur remain intact.

## Ground cues and earned feedback

Each timed pad keeps its original world position and song target. Its action
color and silhouette match the existing face-button badge. Dark ink gives the
badge contrast against road texture, rails show its lane/runway, and a single
contracting frame/ring marks the approach to ONE. The rear-tire target shows
the actual mapped keyboard or controller symbol with readable measure counts.
Vehicles continue to occlude paint on the ground.

Good and Perfect awards produce different local impacts and a short readable
receipt. The receipt uses the accepted adrenaline result: +15/+20 normally,
only the actual remaining gain near 100, and MAX at full charge. A bounded
charge sweep highlights the newly earned part of the real meter; chain and
35/70 threshold feedback make repeated accurate inputs visible. Rejected
early/wrong/lane presses do not invent an award. A missed real opportunity
has a quiet receipt, retaining the existing first-miss grace and later losses.

The existing Good/Perfect and tier sounds remain on their current audio bus,
source timing and voice budget. Ground and meter responses read the same
simulation receipt/time; pause holds them. Reduced Motion and Flashes Off
replace impact motion with steady readable paint. No extra Canvas, filter,
particle emitter, timer, RAF, input owner or audio owner is introduced.

## Preserved rules and verification

Judgment windows, immutable announced pad/beat addresses, original song and
source deadlines, chart/version history, score/resources, captures, skills,
compatible saves and canonical raster bytes are preserved. Presentation
receipts are transient and do not enter the saved economy.

`check:cache-camera-beat-feedback` verifies production camera continuity,
inverse bounds/edge coverage, retained native pixels and removed submissions,
real ground receipts/mapping/quiet paint, and honest meter gains/caps/pause.
The complete package regression, all-file syntax, native production animation
review and both exact feature-head CI events remain required. Exact outcomes,
tested head and actual merge belong to the generated export receipt.
Host CPU costs are diagnostic, not measured owner device FPS. Owner Makko,
physical controller, listening, motion comfort and human fun acceptance remain
unrecorded until played.
