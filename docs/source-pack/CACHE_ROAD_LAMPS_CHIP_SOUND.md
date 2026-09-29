# Cache Road — streetlamp scale and dynamic chip sound

September 29, 2026. Base: merged PR #150,
`f9b5119a5d06407d4293af130b4cf4658d09352b`.
The owner praised the living-sidelines pass and requested smaller, more
widely spaced streetlights with translucent downward beams and ground light,
plus richer 8/16-bit driving sounds that work with the actual song.

## Streetlights that fit the roadside

The dominant service mast shrinks from 400×214 to 260×139.1 world units
(35% smaller), with its aspect ratio preserved. Decorative corner lamps shrink from 270 to
230. Service masts are spaced 308 units apart per bank instead of 142, with
opposite banks staggered by 154 rather than appearing as repeated pairs.
Service fixtures keep 180 units clear of corner lamps and 28 beyond street
mouths. There are 77 service fixtures across the full pre/post-route extent;
this is an inventory count, not the number visible at once.

Measured lens sockets anchor translucent downward rays and soft projected
ground pools to the existing painted fixtures. Ground light is drawn after
terrain and before buildings, people and furniture; beams follow the lamp
in the world-depth queue. The mirror uses the same placement and light rules.
This keeps rays and pools attached to their lamp as the camera approaches,
without restoring the removed road-edge outlines or changing the horizon.
Light is steady, and missing lamp art suppresses its associated rays/pools.
The lamp pass adds no source artwork or hosted asset roots.

## A sound vocabulary measured against the recordings

`review-cache-lamps-chip-sound/Song-Tonality.json` records the five original
audio hashes and analysis of all 100 measures. The first-beat bass root is
D in 92 measures and F in eight: one-based measures 22, 26, 46, 50, 70, 74,
94 and 98. The maximum measured bass pitch error is 0.818 cents; a separate
third-partial check supports the root map. This is strong evidence for those
roots, not a claim of a complete chord transcription or composer-declared key.

Tonal cues use a conservative root/fifth/octave vocabulary: D/A in the D
measures and F/C in the F measures. Approach counts and early confirmations
receive the announced target measure's time, so a cue leading into an F
measure already uses its destination pitch set. Mechanical engine glides,
impact noise and metal transients provide physical movement rather than
claiming to be chords. The verified 128 BPM / 4/4 / zero-origin song timing,
beat-ONE button arrivals and original five recordings remain unchanged.

## Richer effects with bounded audio work

The synthesis palette contains 19 cue families with layered pulse, triangle,
FM metal and clocked noise textures. Live driving routes countdown/arrival,
perfect/good catches, crash, brace/Push, near passes, queued/committed shifts,
turbo readiness/launch, Echo, full-stack and warning events to that palette.
Lock, refill, miss and empty sounds are available in the audition but have
no current gameplay calls; the 19-family count is not a live-event count.
The four action catches vary their lead timbre; passes can sound from the
side they occurred on, and impact intensity follows the driving state.
The existing beat-aligned music stumble remains, with one new crash sound
replacing the extra legacy oscillator.

Each complete cue is synthesized into a cached 32 kHz, 16-bit-quantized PCM
buffer. Playback is bounded by repeat limits, cue priorities, at most 12
transient voices and a 96-entry cache. Critical timing/result cues can
displace decorative voices and briefly lower the engine underneath them.
This avoids rebuilding a layered oscillator graph for every button press.

One continuous engine uses three reusable sources: pulse body, triangle sub
and filtered noise. Pitch, filter, load, shift dip, turbo, damage texture and
stereo position respond to the car's actual world speed. Parameter refreshes
are capped at 30 Hz and replace stale automation; gear changes reuse the
sources. Ordinary engine exit uses a 25 ms fade, while pause clears it
immediately. Restart, scene disposal and results release the relevant
engine/cue state through the existing SFX lifecycle.
All road sound routes through the user's SFX bus. Level 1 keeps its existing
sound palette, and sound updates never restart or seek the music stems.

## Review and verification contract

Full regression, all-file syntax, real Chromium rendering/audio and final
CI are merge requirements. Focused checks cover lamp placement/projection,
target-measure pitch metadata, exact count/arrival deadlines, all three gears,
directional passes, distinct protected and damaging contacts, bounded voices,
buffer reuse, unclipped output and cleanup. A real AudioContext lifecycle
check must complement offline audio rendering for suspend/resume/restart.
The source-pack receipt and PR record actual results for the tested revision;
earlier pass results are not evidence for this candidate.

The focused lamp check passes real main/mirror production draws at 11 route
positions, same-bank spacing, measured socket projection, ground contact,
mirroring and actual Canvas alpha falloff. Production stills have been
visually inspected. The block-art check and existing 705-draw animation audit
also pass all 48 atlas keys. These focused outcomes do not replace full-game
CI. Lamp captures are reproducible with `tools/render-cache-road-lamps.cjs`.
The existing audible-clock check passes all 50 downbeat arrivals/presses
across simulated output delays up to 250 ms. This verifies retained timing;
it does not establish the owner's hardware latency or preferred mix.

`tools/check-cache-road-chip-sfx.cjs` passes 152 synthesized palette variants,
with maximum pre-playback sample peak 0.60033 and minimum RMS 0.03491.
Pitch autocorrelation distinguishes the intended count notes from adjacent
semitones. It also verifies the 92/8 root map, exact source deadlines,
12-voice/96-buffer bounds, 6,000 engine updates reusing three sources,
gear dip/turbo rev, 25 ms release, rapid restart, pause cleanup and unchanged
legacy routing. These are focused synthesis/lifecycle checks; final Chromium
audibility, combined mix and full-head CI are recorded in their own results.
Gameplay routing is checked separately from this complete palette audition.

Review material under `review-cache-lamps-chip-sound/` includes:

- `Lamp-Scale-Before-After.webp` and `Lamp-Details.webp`: matched roadside
  comparison and close light inspection.
- `Drive-Review.mp4`: production driving with the original music and new SFX.
- `Chip-SFX-Audition.mp3`: isolated cues, dynamic engine and in-song audition.
- `Song-Tonality.json`: recording measurements and conservative pitch map.

The source pack retains these current media and the approved layered-city
baseline. Automated capture establishes implementation behavior, not the
owner's preferred mix, perceived musical fit, controller latency or Makko
device performance. Those remain the next owner playtest; no FPS gain or
subjective audio acceptance is claimed.

## Recorded browser evidence

Chromium run [36644476011](https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/actions/runs/36644476011)
rendered the included review audio from candidate `e62bea741801f8d95542039afa1495de43f7fd2a`.
The 42-second audition peaks at 0.60860 with zero clipped samples; stress
peaks at 0.61334 with at most 12 voices. The driving mix peaks at 0.62672
and releases all transient voices and its engine. Real pause/resume/restart
passes without restarting the original stems during road cues. The review
folder records exact metrics and provenance; the final source-pack receipt
identifies final-head CI after the last release-tail cleanup correction.

Listen at 0–18 seconds for isolated palette examples, 18–24 for the engine,
and 26–41 for effects/engine mixed with the original five recordings.
The 32-second drive exercises all three gears, seven perfect beat catches,
Turbo and close passes with full integrity. Its encoded video fully decodes
and its simulation trace matches the audio replay fields exactly.

Local full `npm test` and `npm run check:syntax:all` pass. The protected music
pause method and its baseline hashes remain unchanged; road cleanup uses
the existing lifecycle seam. Final-head CI remains the merge gate.
