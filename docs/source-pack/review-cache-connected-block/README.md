# Cache Road: connected block camera study

This is a visual review fixture in the real Cache Road renderer, not a change
to the playable landscape. It answers what lies between the building cards
when the area is treated as a street-connected block.

| View | Motion | Representative frames |
| --- | --- | --- |
| Current game camera and road width | [Six-second drive](current-camera/Cache-Road-Curved-Roadside-Drive.mp4) | [Left opening](current-camera/Cache-Road-Mirror-Road-0180.webp), [right opening](current-camera/Cache-Road-Mirror-Road-0340.webp) |
| Experimental extra side-bank space, same crest height | [Six-second drive](extra-bank-space/Cache-Road-Curved-Roadside-Drive.mp4) | [Left opening](extra-bank-space/Cache-Road-Mirror-Road-0180.webp), [right opening](extra-bank-space/Cache-Road-Mirror-Road-0340.webp) |

The left side street appears first; the right one is farther along the route.
Each opening runs into a back lane with a junction and short alley. Two
frontage lots and two deeper lots surround that route. Existing BARCODE art
stands in for future modular cards; vendor stalls, parked delivery vans,
bicycle racks, kiosks, corner lights and distinct individual pedestrians
occupy the street and sidewalk spaces. The wall and pylon gaps exist only in
this review fixture so the access streets actually meet the road edge.

The second view changes only the preview camera's road half-width growth
from 534 to 410; it does not lower the horizon or alter the playable road.
The comparison tests how much of the back block the current composition can
show. The current-width view has less room for the third depth layer.

This is an authored arrangement repeated for camera review. It is **not**
a procedural street generator, finished intersection system, new terrain
surface or finished ground-separated art. The existing paintings retain
their private ground and the bank still looks too flat. The sample's purpose
is to choose the visible block structure before building those systems.

Reproduce a view with `CACHE_DISTRICT_SEED=53 CACHE_DISTRICT_MODE=block`
and `node tools/render-cache-road-mirror.cjs OUTPUT_DIR`. Add
`CACHE_BLOCK_CAMERA_HALF=410` for the wider-bank comparison, and
`CACHE_REVIEW_CONTINUOUS=1 CACHE_DISTRICT_SECONDS=6 CACHE_DISTRICT_FPS=18`
for the moving clip.
