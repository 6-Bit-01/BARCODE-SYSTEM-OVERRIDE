# Cache Road frame-time repair — October 1, 2026

The owner reports a new repeating lag/catch-up cycle as soon as Cache Back's
road starts. The baseline is merged PR #163,
`8813ef7d1e6c76f5f2903096a5ae5555735d3b66`.

`tools/profile-cache-frame.cjs` measures the actual production road renderer
with the repository's registered images in native Canvas at several road
addresses. In a fixed opening-camera sample, the original 24-world-unit bank
slabs spent about 18–20 ms per frame on the terrain pass within a roughly
41–45 ms full draw. The rearview was about 5–7 ms and the sorted roadside
art about 2 ms. These are local CPU diagnostics, not Chrome or Makko FPS.
The same measurement against merged #162 and #160 showed similar draw cost;
the bank-side correction in #163 is not isolated as the cause of the hitch.

The ground now uses eight slabs per 624-world-unit grain period: 78 world
units per slab. The earlier 72-unit candidate did not divide that period and
could request a source crop above the authored grain strip. With the final
spacing, every normalized source phase is 0, 78, …, 546, including negative
world addresses. Source crops remain inside the original y=32…855 strip;
each crop is 102.875 pixels tall. The grain remains tied to each world address,
and courts and connected side streets still draw at their actual addresses
inside the slab interval. The full road, sidewalks, site art, vehicles and
mirror remain present.

A native pixel comparison uses the same final renderer and camera with only
the diagnostic slab interval changed back to 24 units. Twelve 1920×1080
captures near the final 78- and 156-unit boundaries measured 0.666–0.737
average RGB difference. Mean adjacent-frame change was 7.344–7.812 for the
final spacing and 7.370–7.836 for the 24-unit reference; the largest difference
between matched adjacent-frame changes was 0.027 RGB units. That diagnostic
shows no added boundary jump in the sampled images. The exact 2.3 px rearview
blur, art delivery and foreground exits remain unchanged.

The later race-setup/camera pass uses one transform around the existing world,
then restores it before the dashboard and mirror. Fourteen short Canvas
strokes at high speed add no texture submission. A five-position native
sample of the final 78-unit build measured 27.92–30.64 ms median full draws
and 5.74–6.74 ms terrain passes. A cold maximum of 104.49 ms and a later
52.36 ms maximum show that local spikes still occur. Host variation prevents
a camera-speedup claim. The original stall remains open for Makko verification.

The focused regression checks both bank directions, world-aligned grain,
source crop bounds across multiple grain phases, and street/court textures.
`node tools/profile-cache-frame.cjs` is a diagnostic;
run `PROFILE_REVISION=8813ef7 node tools/profile-cache-frame.cjs` to compare
the merge baseline. `PROFILE_SEAMS=1` samples addresses 75…80 and 153…158.
`PROFILE_TERRAIN_STEP=24` compares the same renderer/camera at the original
spacing without editing production code; overrides must be positive integer
divisors of the grain period. `PROFILE_CAPTURE=/absolute/path/prefix` saves
the sampled images. Timing varies with host load and image decode. The full
test/syntax/CI outcomes belong to the final PR receipt.

## Makko acceptance

Import the exact reviewed revision and start a fresh Cache Road drive with
sound, then retry a saved marker. Watch the first minute and several districts
for the reported alternating lag/catch-up. Check both banks, rolling grain,
road edges, street mouths, rearview and passed objects for visual seams or
missing art. Record the build SHA, browser/device, gear/difficulty and a short
screen recording if a hitch remains. Automated native timing does not establish
physical-controller, audible or hosted Makko frame pacing.
