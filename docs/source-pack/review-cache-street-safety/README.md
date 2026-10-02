# Cache street-safety recovered played evidence

These files preserve completed gameplay/profile work from the interrupted session.
The original report hashes and timestamps are retained. They are historical
captures, not an assertion about the subsequently reviewed final commit.

## Complete played captures

`baseline-played-profile.json` records the pre-optimization production-input
100-bar race (375 sampled draws, 10 warmup samples). `final-played-profile.json`
records the subsequent integrated street-safety race (190 sampled draws, one
second sample cadence with event-driven extra draws, 8 warmup samples). Both use
real production Campaign, ActionInput and every 20 ms shared update; there is no
injection of health, progress, captures, boss damage or victory. Registered images
are painted with native Node Canvas at 1920 by 1080.

The final historical capture clears all 100 bars with 58 of 62 accurate announced
pads, 23 hostile takedowns, and no damage. It visibly samples the four crosswalks
at bars 10, 30, 50 and 70. Two real pedestrian contacts produce different shame
messages and leave score and integrity unchanged at the owning contact step. One
fallen bike rider is splattered after landing. Ordinary mirror moods hold for
roughly three seconds; the recorded shortest non-hit/alarm hold is 2,140 ms because
an urgent alarm interrupts that ordinary mood.

Hostile crowding in this practiced race changes from 132 multi-near-hostile frames
to zero; maximum near hostiles changes from two to one, with no simultaneous
windups. This is one played route, not a proof of human difficulty or every traffic
combination. Civilian and hostile combined metrics are kept separately in the
final report.

## Timing and image evidence

Median total native draw CPU falls from 94.701 to 52.008 ms; p95 falls from 412.523
to 304.878 ms. The runs use different sampling cadences and warmup counts, so these
are diagnostic observations, not a matched speedup benchmark or device/browser
FPS. The earlier baseline includes the frame-cost hotspots; the final report
retains stage and asset timings for later comparison. Combat pose construction in
sampled draws changes from median three calls to one, with maximum five to two.

`pedestrian-hit-message.png` is an untouched production-rendered historical
screenshot of a real crossing impact; it shows the physical crosswalk, pedestrians
and the independent shame message. The original recovered evidence is about 7.5 MB; a separate current-tree report
and untouched PNG are retained below.

The final historical capture predates subsequent integration fixes in
`src/game/cache-road-combat.js`, `src/game/cache-road-crosswalks.js` and
`src/game/cache-road-proof.js`. Check each report's sourceHashes before treating
it as final-tree evidence. Final regression and native browser checks must run
against the actual final commit.

## Bounded local browser attempt

The recovered local Chrome executable was truncated at 72,272,896 bytes. Restoring
it from the existing complete archive recovered `--version`, but the local native
combat browser test exited immediately before gameplay with:

`FATAL process_singleton_posix.cc:297: socket() failed: Operation not permitted (1)`.

The same interrupted installation also had a corrupted resources.pak. The local
browser report is recorded honestly as failed startup, not a gameplay failure or
native browser pass. CI provides the final native Chromium gate on a working
installation; no repeated long silent local browser run was used.

## Reproduce the profile

Run from any directory with the checkout's native Canvas dependency installed:

```sh
node docs/source-pack/review-cache-street-safety/profile-played.cjs /tmp/cache-play-profile-rerun
```

The copied script resolves the repository relative to its own location and uses a
temporary output directory by default. It snapshots sources and instruments stage
and timer calls only. Outputs contain the sources used for that particular rerun.
Do not overwrite these historical baseline/final reports with new source hashes.

## Final local candidate capture

`current-played-profile.json` is a separate complete production-input/native
Canvas rerun after the late integration fixes. It preserves the full detailed
frame evidence and its own original source fingerprints. The race cleared after
9,374 shared gameplay frames and 190 native draws, with all four crossings,
58 of 62 accurate pads, 23 takedowns, a defeated 12-HP rig, three integrity and no
damage. Two pedestrian hits left score and integrity unchanged at the contact
step and produced distinct messages; one landed rider was splattered. There were
zero multi-near-hostile frames and zero simultaneous windups in this route.

The current run's diagnostic total draw CPU median is 63.973 ms and p95 is
297.849 ms. Concurrent local work and native CPU rendering make these unsuitable
as device FPS or a matched performance claim.

`current-crosswalk-30-played.png` is the untouched raw current-tree render of the
second crossing. `current-play-verification.json` independently hashes both
outputs and compares every reported production source hash with the on-disk tree
at verification. The reproducible run reads an immutable initial snapshot of the
production scripts for its entire simulation. The recorded profile date is the
runtime's original date; the separate receipt preserves the host verification
time. No historical report or image was replaced.

Local native Chromium and final CI remain unvalidated for this unpublished
candidate; the blocked local browser startup above is distinct from the passing
native Canvas race.

## Publication authorization

The owner explicitly approved publication, PR creation and merge after CI on
October 1. All game/runtime/test sources remain identical to the passing local
checks and source-hashed final capture; only publication-status prose changed.
Hosted results and merge state belong in the PR/export receipt.
