# Smooth turn camera fixture

Ten-second 24-fps production-painter review, fixed high-speed target and abrupt
input targets at two seconds (right), five (left), and eight (release). It uses
the production updateCamera follow owner once per fixture frame. Pass/hit
visual fixtures are scripted; they are not recorded earning or actual damage.
A native still was inspected for lane/HUD clearance. The JSON records native
render timing and atlas cells only; it does not establish hosted FPS or comfort.

Regenerate from the repository root with
`CACHE_REVIEW_CONTINUOUS=1 CACHE_REVIEW_SECONDS=10 CACHE_REVIEW_FPS=24 CACHE_REVIEW_CAMERA=1 CACHE_REVIEW_CAMERA_REPAIR=1 CACHE_REVIEW_START_PROGRESS=520 node tools/render-cache-road-mirror.cjs /absolute/review-output`.

Full race checks exercise actual wrecks separately. Makko comfort, physical
controller, sound and frame pacing still need owner acceptance. PR #166 remains
the rollback/checkpoint. The existing exit is intentionally untouched.
