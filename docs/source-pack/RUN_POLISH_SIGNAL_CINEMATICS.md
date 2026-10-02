# Run polish, signal artwork and driving scenes

Base and rollback: merged PR #176,
`67ecf59fd99fbdb8aa3e00f8b059b3720bd1954b`.

The owner requests smoother running, custom art for the orange Signal Discharge
and remaining crude assets, and more in-game Cache Back driving scenes. The
request calls the driving stage Level 3; its character, road, car and boss match
the existing Level 2 Cache Back chapter. That chapter receives the scenes, while
the separate Broadcast Slum Level 3 prototype and campaign numbering remain.

## Run presentation

The previous run had large frame-to-frame head/body registration jumps and
uneven pose transitions. Its simulation clock and 450-unit running speed were
already working. Correct the artwork/registration and preserve the gait phase
when Shift/L2/LT changes walking to running. Keep ordinary 300-unit walking,
ground contacts, existing single jump, entrance and mode locks. New source art
and packed playback data use a sibling directory; previous raster files remain
unchanged. Actual landmarks, wrap and native before/after evidence are recorded
by the focused run review rather than assuming unique cels prove a good gait.

The selected gait has eleven distinct cels over 600 ms: five at 60 ms, then
six at 50 ms. Opposite foot contacts occur at 0 and 300 ms. Per-cel size and
position calibration holds canonical body height and actual boot contacts;
walking/running transitions preserve cumulative playback phase. The native
review checks cap continuity across every adjacent cel, including the wrap.

## Painted signal effects and amplifier

An eight-cel signal atlas has four hollow amber warning cels and four brighter
electrical discharge cels. The existing Jammer surge and boss SLAM owners supply
their original elapsed times, bounds and active phases. The art is clipped to
those exact bounds; the field never becomes a new collision owner. Explicit
edge indicators and short warnings retain legible danger registration.

A separate eight-cel portable amplifier replaces the magenta Signal Amp square.
Its chipped purple/mint casing, speaker core and indicator lights animate on
the existing effects clock. Pickup collision, use, saved charges and socket
geometry remain unchanged. Both atlases preserve the generated alpha and retain
source/packing provenance; reduced motion selects a stable phase.

## Driving opening and departure

Fresh version-4 races use a 7.6-second automatic approach on the real road,
beginning without gameplay HUD. Two staged enemies close around Cache; he
sideswipes one offroad and opens a lane. The remaining escort stays visible
through the handoff. These authored presentation actors grant no score, kills,
damage or resources. Their visual approach ends at the original race start, so
the real song begins at beat zero and physical pad addresses stay intact.

The HUD fades during the final approach and steering hands over across 1.4
seconds. Opening lines are Cache's “They want the tape? Come get it,” 6 Bit's
“Cache. Eyes on the road,” and Cache's “One lane open. That's all I need.”

Only genuine earned boss/song/result conditions begin the horizon departure.
Cache drives away while the HUD clears, with short radio lines about keeping
the original and opening the next route. The existing ending follows. Saved
results are committed before departure, so resume cannot revoke the clear or
invent additional defeats.

Shared clocks freeze during pause. Fresh release/press arming prevents carried
skip/resume buttons from activating a skill or skipping another state. Existing
skip controls and quiet settings remain usable. No new Canvas, context, RAF,
timer or audio source is introduced; HUD fade uses the existing main context.
Historical version-1/2/3 races preserve their prior opening/result rules.

## Verification and limits

Focused production checks cover run clocks, anatomical registration and phase
handoff; original Jammer/SLAM bounds and damage times; actual Amp collection;
cinematic pause, skip, held edges, chart addresses, control ramp and an earned
full boss clear. Native captures inspect the actual shipped sprites, road, HUD
opacity and horizon movement using the production renderer. The native harness
records a host decoder adaptation for C2PA-bearing PNG buffers: on the specific
misclassification error it decodes a byte-identical PNG snapshot, checking the
asset hash before and after. Runtime assets and browser decoding are unchanged.
Full regression,
all-file syntax and both exact final-head hosted CI events remain merge gates.

The generated export records the actual tested/merged revisions, source and
asset fingerprints, completed gates and source-pack identity. Scripted/native
review does not claim owner Makko, physical-controller, listening, comfort or
device-FPS acceptance. Those remain separate owner observations.
