# Cache Road motion and fourth-beat repair

Base: merged #144, `6123c55fa02acd5601bf9aa7b1dc8d8ac322c780`.
The owner reported stationary travellers, a broken-looking sweeper turn,
misaligned pulse overlays and unclear timing. This pass improves the
existing scene and gameplay using the current paintings and audio.

## People and traffic

| Figure | Ground behavior | Facing |
| --- | --- | --- |
| Six walking identities | Move along the roadside, toward or away | Authored front/back row |
| Bicycle pusher | Walks outward at 43 ground units/s | Whole figure faces its bank's outer edge |
| Skateboarder | Travels outward at 76 ground units/s | Whole figure faces its bank's outer edge |
| Crate carrier | Walks outward at 34 ground units/s | Whole figure faces its bank's outer edge |
| Twelve seated/standing people | Hold their original ground positions | Existing still composition |

Travel starts when an encounter enters the visible approach and ends after
it passes the rearview. Position is shared by forward and rearview draws.
Reduced Motion freezes displacement and holds the first facing cel. There
is no separate timer or respawn loop. The owner's outward-travel request
supersedes the prior ban on flipping the three horizontal complete figures.

The sweeper and trike now ease into and out of their one-lane merge. A small
turn lean is applied to the complete vehicle, including its tire masks.
Frame phase no longer depends on screen x, so changing lanes does not jump
between cels. Heavy vehicles use smaller suspension travel.

## One musical target

Route addresses still control when an encounter is offered. Once offered,
the action receives one future beat four with at least three preceding
beats and at least one bar between actions. Braking, throttle and Turbo
cannot move this deadline.

The button and three count-in marks use the same music-time road projection
as the captured phrase paint. They reach a thin strike line just ahead of
Cache: it stays visible while his opaque car would hide a target beneath
the rear wheels. All cues remain within their projected lane and beneath
traffic. The HUD shows the same 1-2-3-4 countdown. The button remains calm
until its final buildup and press window.

Judgment uses the production transport and event timestamp: 70 ms perfect,
130 ms good, only for the announced beat four. A saved input offset adjusts
the tap once; it does not move the visual clock. An early accepted press is
latched once, with the capture and burst released on the target beat. Its
audio is scheduled at that exact source-clock time. Late valid taps respond
immediately. Missed actions expire and cannot be claimed on a later bar.

Three quiet count-in clicks support the visual buildup. A soft beat-four
accent marks the target. Perfect and good catches have separate short
chords and a painted road burst; they share the existing SFX volume,
12-voice bound and lifecycle cleanup. The five original song stems remain
the source of the dynamic arrangement.

## Evidence

- [16-second drive with sound](review-cache-motion-rhythm/Drive-Review.mp4)
  and [preview](review-cache-motion-rhythm/Drive-Preview.webp): four timed
  captures, three remaining signal points and the sweeper merge. The local
  production Canvas render uses 24 fps; it is not a device performance test.
- `review-cache-motion-rhythm/Drive-Trace.json`: input-driven production
  update trace, actual cue call times and MusicDirector stem ramps.
- `tools/render-cache-road-mirror.cjs` with `CACHE_REVIEW_GAMEPLAY=1`:
  production Canvas drive with ordinary steering and timed button presses.
- `tools/cache-road-review-audio.cjs`: replay those recorded calls through
  production AudioSystem and real OfflineAudioContext in Chromium.
- Focused checks cover still/travel positions, outward facing, Reduced
  Motion, smooth turn endpoints, six speeds and initial song phases,
  immutable deadlines, exact receptor alignment, early latching and
  duplicate suppression. Both authored four-action runs clear real traffic
  with ordinary steering and reach four music parts.
- Local full `npm test` and all-file syntax pass. The
  [Chromium run](https://github.com/6-Bit-01/BARCODE-SYSTEM-OVERRIDE/actions/runs/36608610526)
  passed, including the real MP3s and recorded drive replay. Its
  `review-cache-motion-rhythm/Drive-Audio-Checks.json` records the exact cue
  start times, peak 0.525, RMS 0.080 and zero retained voices. The final
  branch also runs the complete CI gate before merge.

This is a controlled production-render and audio review. Owner Makko input
latency, appearance and device pacing are still to be judged after import.
Rollback is a revert of this repair to the base above; source paintings and
the five MP3s are retained.
