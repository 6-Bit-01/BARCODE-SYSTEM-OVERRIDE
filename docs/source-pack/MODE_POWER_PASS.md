# Hack and Rhythm Mode presence

Base/rollback: merged #85, `62b44f7cf5446b38bec18746411587327cedb142`. Branch: `agent/mode-power-presence`. The exact published revision, PR, tree and checks are in the generated source receipt.

The owner wants a stronger bullet-time feel in hacking and a more substantial power in Rhythm Mode, while retaining working music synchronization and the newly readable terminal.

## What changes

- Hack entry briefly sends streaks outward through the live scene. A colder, darker city surrounds full-color actors and warnings. Suspended motes, rings at the player's feet and a moving uplink make the state visible even between attacks.
- A dedicated hack pose sequence reuses the approved idle/open-hand frames instead of the rhythm headbang. A palm effect and short lean/arc react to the existing single guard absorption. This is animation sequencing and drawing only: body, footing, hit tests and guard count stay unchanged.
- Cars, their spawn cadence, queued approaches and ambient particles now follow the existing 35% tactical-focus clock. The animated skyline uses a steady 35% playback rate. Normal speed returns on exit. Player gestures, personal effects, terminal timing/input, camera and music remain at full speed. The player remains stationary while entering a terminal answer; cancel returns movement. The elevator keeps its established real-time passenger/power behavior.
- Rhythm has larger floor ripples, an equalizer-shaped field, a beat-linked scene edge and stronger perfect-contact shockwaves. Combo color/height build toward the existing milestones. The thin outer circle still represents the actual damage range. No damage, points, combo gates or beat windows change.
- Five cached SFX textures cover hack entry, guard, release, rhythm entry and connected perfect hits. They use the existing SFX bus and 12-voice budget. They cannot evict critical warnings, and extra rhythm thumps defer during warning priority. Pause/reset use the existing audio lifecycle.
- Hacking a support drone during the boss now selects the established hack music treatment; boss priority previously masked it. This changes arrangement selection only. Source timing, offsets, loop/restart methods, transport, BPM and judgment remain protected by the synchronization contract. Dynamic Music Off still retains the legacy music mix.

## Readability, accessibility and cost

The opaque terminal and live viewport retain their dimensions, interaction areas and projection. Color grading affects scenery; enemy warnings and actors retain their original colors. Screen effects are clipped to the scene and rendered before the interface. No panel opacity/placement solver changes. Cancelling immediately after a guard hit now clears the stale guard message instead of showing it as a result.

Reduced Motion or Flashes Off suppresses the new screen streaks/vignette pulses and beat motion; steady mode fields remain. Reduced Motion stops hack field drift/rotation and pose shear. Flashes Off keeps the tactical clock steady. Effects are frame-owned, capped at 96 events and contain no new timer/RAF. Audio buffers are built once per sample rate and shared across repeated uses. There are no new runtime dependencies or image assets.

## Evidence and limits

`tools/check-mode-power.cjs` covers 30/60/120 Hz traffic/gesture behavior, single guard, unchanged body, pause/cancel/reset, restored scenery speed, boss hack mix selection, reduced effects, read-only drawing, bounded events, cached voices and warning priority. The old test requiring full-speed cars during hacking was updated for the owner's new bullet-time request and now also verifies restored normal speed.

Real Chromium renders production mode SFX and checks finite unclipped PCM, nonzero output for each cue, SFX mute and cleanup. The isolated sample peaks at about 0.293 with SFX gain 0.7; this is not a full-mix loudness/listening verdict. The background browser test exercises actual 35% video playback and restoration as well as its existing decode, loop, pause and fallback coverage. Existing source-hash and multi-loop scheduling tests plus original-track PCM checks protect music synchronization.

`assets/review/mode-power/` contains six native production-renderer stills, an eight-second silent motion sample and isolated SFX WAV/report. Native Makko sprite/image boundaries are adapted; enemy travel and perfect-hit events in the movie are staged to keep the terminal open. This is visual evidence, not a recorded hosted playthrough or device performance claim.

## Owner review and deployment

Import the exact draft head into a duplicate Makko preview. Hack beside approaching enemies: observe entry, hand/uplink, one guard deflection, legible keypad and slow traffic; cancel and verify immediate restoration. Repeat on a boss support drone. Build a rhythm combo with real contacts, then miss and rebuild; judge power/readability, especially around warning labels. Compare Reduced Motion, Flashes Off, SFX mute and Dynamic Music Off. Pause/resume and retry during both modes. Listen through two complete loops on the target device and physical controller.

Record SHA/device/controller, PASS/FAIL and a short clip. The existing repository instruction requires owner Makko/controller acceptance before assistant merge. After approval and merge, import the actual main merge SHA, fresh-load and repeat mode/audio/checkpoint smoke checks. Keep the base import for rollback. This pass does not declare Level 1 finally accepted or add later-level content.
