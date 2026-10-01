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

The ground now uses 72-world-unit slabs. The grain source remains tied to
each world address, and courts and connected side streets still draw at their
actual addresses inside the slab interval. The full road, sidewalks, site
art, vehicles and mirror are untouched. A fixed opening-camera pixel comparison
against the 24-unit baseline measured 0.57–0.85 average RGB difference over
five 1920×1080 positions (0.89–1.60 in the broad bank region). Frames sampled
across two 72-unit slab boundaries have essentially the same frame-to-frame
change as the old spacing, with no new boundary jump in that diagnostic.
The exact 2.3 px rearview
blur, art delivery and foreground exits remain unchanged.

The later race-setup/camera pass uses one transform around the existing world,
then restores it before the dashboard and mirror. Fourteen short Canvas
strokes at high speed add no texture submission. A five-position native
sample of this combined build measured 25.84–30.89 ms median full draws and
5.98–7.14 ms terrain passes. A sequential sample of the ground-only commit
measured 30.23–36.65 ms full draws on this host, but this comparison is too
variable to claim a camera speedup. The original stall remains open for
Makko verification.

The focused regression checks both bank directions, world-aligned grain and
street/court textures. `node tools/profile-cache-frame.cjs` is a diagnostic;
run `PROFILE_REVISION=8813ef7 node tools/profile-cache-frame.cjs` to compare
the merge baseline. Its timing varies with host load and image decode. The
full test/syntax/CI outcomes belong to the final PR receipt.

## Makko acceptance

Import the exact reviewed revision and start a fresh Cache Road drive with
sound, then retry a saved marker. Watch the first minute and several districts
for the reported alternating lag/catch-up. Check both banks, rolling grain,
road edges, street mouths, rearview and passed objects for visual seams or
missing art. Record the build SHA, browser/device, gear/difficulty and a short
screen recording if a hitch remains. Automated native timing does not establish
physical-controller, audible or hosted Makko frame pacing.
