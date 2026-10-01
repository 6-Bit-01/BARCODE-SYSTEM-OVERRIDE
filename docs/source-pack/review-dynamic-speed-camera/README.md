# Dynamic camera production-painter review

This twelve-second 1280 × 720, 24-fps sharing clip uses the production road,
camera, wind atlas, vehicles, markings and HUD. Its visual fixture stages a
cosine slow → fast/Turbo → slow speed sweep, a pass at five seconds and a hit
at 9.5 seconds. Review progress and arrangement are scripted. This is not a
recording of earned gameplay, Makko, audio acceptance or measured hosted FPS.

The selected stills are at one, five and nine seconds; the JSON records the
fixture flag, all submitted asset variants and native render timings. Native
timings are diagnostic only. All five intended wind cells were submitted.
The original PR #165 curls are no longer loaded. The new original PNG is
`assets/cache-road/effects/wind-streak-atlas-v2.png`; its imagegen prompt and
immutable delivery revision are in the effects README and ART_PROMPTS.

Regenerate from repository root:

`CACHE_REVIEW_CONTINUOUS=1 CACHE_REVIEW_SECONDS=12 CACHE_REVIEW_FPS=24 CACHE_REVIEW_CAMERA=1 CACHE_REVIEW_START_PROGRESS=520 node tools/render-cache-road-mirror.cjs /absolute/review-output`

The sharing MP4 uses H.264 CRF 30 compression. See `DYNAMIC_SPEED_CAMERA.md`
for the control/visibility contracts and separate owner acceptance route.
