# Level 1 → Cache Line bridge

This eight-scene comic replaces the single post-Level-1 intermission card.
Base: merged PR #153, `658b99f`, on `agent/cache-eight-scene-bridge`.
The existing eight-page opening remains unchanged. The bridge uses the
gameplay Canvas, RAF and input owner; it is illustrated still art with staged
dialogue, not voiced dialogue or a fully animated film.

## Story and exact runtime script

Level 1 has restored the outgoing connection and earned **Voice**. Cache
already protected the original in the opening; he now chooses to carry it.
DJ preserves both traces, Mac opens the route and 6 Bit remains on street/comms.
The clean copy removes meaningful detail. This does not reveal an antagonist,
identify the Master as a character, or award the future **Bass** key.

The titles and lines below match `src/engine/cache-bridge.js`. The artwork
contains no dialogue; runtime text supplies each speaker and line.

| Page / title | Beat | First line | Second line |
| --- | --- | --- | --- |
| 1 · THE DISTRICT ANSWERS | Lit district; 6 Bit in the wet street | **MAC MODEM / COMMS:** Outgoing relay is open. | **6 BIT:** Hear that? They're still here. |
| 2 · THE TRANSIT LINE IS OPEN | Mac and Cache reconnect the studio uplink | **MAC MODEM:** Local signal's back. The transit line is open. | **CACHE BACK:** Then the original goes with me. |
| 3 · THE ORIGINAL | DJ auditions the original for Cache | **DJ FLOPPYDISC:** The original. Room noise, names, every mistake. | **CACHE BACK:** Play the other one. |
| 4 · LISTEN TO THE GAPS | Compare the cleaned copy and original | **DJ FLOPPYDISC:** Cleaner. But listen to the gaps. | **CACHE BACK:** It didn't fix the recording. It took us out. |
| 5 · KEEP BOTH TRACES | Secure the already-protected original for travel | **CACHE BACK:** Keep both traces. This one leaves with me. | **DJ FLOPPYDISC:** Both saved. Crew channel stays open. |
| 6 · ONE PIECE | Rear view: Cache reaches the yellow car; 6 Bit on radio | **6 BIT / COMMS:** Get it there in one piece. | **CACHE BACK:** The recording or the car? |
| 7 · ORIGINAL LOADED | Load the cassette; ignition and digital instruments | **MAC MODEM / COMMS:** Route is yours. Keep the original moving. | **CACHE BACK:** Original loaded. |
| 8 · THE CACHE LINE | Rear car/road composition leads to gameplay | **6 BIT / COMMS:** We're on the line. | **CACHE BACK:** Then let's make some noise. |

## Reading, controls and handoff

Each page has a title cue (800 ms), a first-line cue (4 seconds), then a
second-line cue that waits indefinitely. A fresh confirm reveals the next
cue/page. Final **Drive** is a separate confirm; reading or skipping never
starts the road song, engine or race clock. The full road introduction and
existing song-start/count-in behavior remain under Cache Road's owner.

| Action | Keyboard | Controller | Pointer |
| --- | --- | --- | --- |
| Next line / next scene / final Drive | Enter or Space | Confirm, button 0 | Labeled button |
| Skip to final Ready page | Hold S for 5 seconds | Hold button 1 for 5 seconds | No hold target |
| Transcript | T | Button 2 | Transcript button |
| Return to results | Escape | View / button 8 | Results button |
| Pause | P | Menu / button 9 | Existing pause route |
| Retained Level 3 development test | 3 | Button 3 | Level 3 test button on final page |

Controller labels follow the active controller profile. Held inputs arriving
from combat/results must be released before they can advance the bridge.
Transcript/pause stop reading clocks; skip requires a complete independent
five-second hold. Results preserves progress. Optional versioned page/cue
metadata extends the existing checkpoint without invalidating older saves,
changing score/results or awarding Voice again. A saved road session resumes
the road directly; restoring a saved dialogue cue does not replay its audition. Failed audio entry keeps Ready retryable; cancelled
handoffs must not start a late race or resurrect the retained development test.

## Art and audio

Eight new built-in ImageGen illustrations use the approved intro identities,
studio palette and rear car references. Original PNGs, q92 WebPs, complete
prompts/reference provenance and a hash manifest live in `assets/cache-bridge/`.
The sixteen PNG/WebP files use immutable art ancestor
`9881bf126f2a529ccfe5c6262d4c1de98990973f`; prompts/manifests are in the
integration descendant. Native dimensions are approximately 2.2:1; the renderer fits the whole
image in a 1568×712 frame. It does not crop faces to normalize small size
differences. Existing rear views support departure; this pass does not establish
new front-car or complete character model sheets.

Five short original synthesized cues cover relay, original, clean, tape and
ignition. The comparison is one 128 BPM D/A-octave bar: the clean version
retains identical samples except removed eighth-note slots **2, 4 and 7**.
It demonstrates omissions musically, not literal recorded names, room voices
or excerpts of the protected song. Maximum cue duration is 1.94 seconds;
one bridge voice and five cached buffers use the existing SFX bus. Page exit,
pause and disposal stop cues; they do not automatically resume or start music.

## Evidence and remaining review

The focused audio checker passes; its receipt records identical retained samples, intentional
omissions, bounded buffers/voice count, cleanup and unchanged protected sync
hashes. Production flow checks pass all 24 title/dialogue cues, physical
input edges, five-second skip, save/restore, retry/cancellation and final-only
road entry. All-file syntax passes; local full regression and final-head
Chromium/CI are pending at this documentation checkpoint. The exact tested
revision and final outcomes belong to the PR and generated receipt; those
merge gates are not replaced by art review. Owner Makko readability, pace,
audio preference and physical-controller feel remain unmeasured.

Review assets are collected in `review-cache-bridge/`: `Bridge-01.webp`
through `Bridge-08.webp`, `Bridge-Contact.webp`, `Bridge-Review.mp4`,
`Bridge-Review.json`, `Bridge-Cues.wav` and `Bridge-Audio-Checks.json`. The
completed preview is **64.000 seconds, 768 frames, 12 fps, 1280×720**, using
scripted production Canvas draws and exact synthesized PCM. It is not a
Makko playtest, natural reading-speed measurement or completed road run.
The capture passes 72 native text-metric checks with no overlap/escape and
the same layout in Reduced Motion. All five production cues are included;
the 32 kHz mono mix has no clipping. Final Ready remains active and Drive
is never invoked. The capture receipt identifies its actual source hashes;
the integration source differs only by its verified final immutable art pin.
The source pack keeps this preview and cue WAV alongside the approved dashboard drive, layered-city
baseline and prior chip audition. The full `Bridge-Review.wav` assembly
remains in Git and is omitted from the ZIP as duplicate review media; the
short cue audition is explicitly retained.
