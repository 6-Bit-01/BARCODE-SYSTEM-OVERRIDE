# The Cache Line — authored completion

**October 5 expanded-handoff proposal:** [BROADCAST_SLUM_STORY_PRODUCTION.md](BROADCAST_SLUM_STORY_PRODUCTION.md) develops eight Level 2-to-3 scenes for the owner's minimum seven, adding two reconverging choices, a useful Kave cameo and a 9 Bit frame intrusion. It retains successful original delivery and the hold-to-Mac objective, ending with Mac visibly heading into action in a pose distinct from Cache and 6 Bit. The [asset/reference review](STORY_PRODUCTION_REVIEW.html) includes generated Cache/Mac hero PNG concepts awaiting owner art review; Kave public references are found; final likeness and scene 3/5/6 art remain to be produced, and browser review is pending. Current runtime still uses the four-scene ending below and eight-scene Cache bridge; no new Drums, Level 3 gameplay, merge/deployment or refreshed v5 archive is claimed. Published direct-controls baseline: source PR186/site PR483; older implementation/publication-in-progress statements below are historical.

The owner approved the next milestone after merged PR #155: an authored
Level 2 ending, its one-time **Bass** key, four optional records and Cache's
handoff to Mac. This scope supersedes the earlier proof-only prohibition on
those additions for newly started authored runs. It does not retroactively
turn an old proof result or checkpoint into a campaign award.

This document records the agreed script and implementation contract. Exact
publication revision and final validation belong to the PR and generated
source-pack receipt. Implementation and combined verification are in progress.

## Mandatory story and exact outro script

The eight-scene Level 1 bridge already established that the clean copy omits
names and meaningful detail, and that Cache chose the protected original.
The road ending completes that delivery. Its receiver acknowledges
**DELIVERED**, but distribution marks the original **UNVERIFIED** and holds
it. Mac follows the hold to street enforcement. All of this is on the main
path; none of the optional records is needed to understand the destination.

| Scene / title | First line | Second line |
| --- | --- | --- |
| 1 · ORIGINAL DELIVERED | **CACHE BACK:** Original delivered. Names, room noise, all of it. | **DJ FLOPPYDISC / COMMS:** It matches. Nothing missing. |
| 2 · DELIVERED / UNVERIFIED | **CACHE BACK:** They took the file. Why isn't it going out? | **MAC MODEM / COMMS:** Delivery passed. Distribution says UNVERIFIED. |
| 3 · THE LABEL HOLDS | **DJ FLOPPYDISC / COMMS:** The original arrived. The distribution hold is still there. | **CACHE BACK / COMMS:** Then being delivered isn't enough. They're stopping it here. |
| 4 · STREET ACCESS | **MAC MODEM / COMMS:** The hold points to street enforcement. I'll find a way through. | **6 BIT / COMMS:** Cache got it here. Mac, get it heard. |

The stamp distinguishes successful transport from blocked distribution; it
does not undo the clear or suggest the original was lost. No scene claims
that the clean copy has already been approved for broadcast, identifies who
ordered the hold, or reveals an antagonist, separation initiator or Sheila.
DJ's comparison confirms preservation rather than explaining the wider
simulation. Cache remains the road lead. Scene 3 cuts back to DJ and Mac in
the studio comparing preserved traces, with Cache still on comms from the
receiver. The last scene cuts separately to Mac at a street-access cabinet
beside a closed barrier; he has not teleported to Cache's receiver. The crew
stays connected over comms.

The final handoff is a saved campaign endpoint for Mac's future chapter.
The rejected Contra-style development preview remains a separately labeled
technical preview. It must not be renamed, launched as Mac's chapter or
treated as an authored Level 3 completion route. New front-facing car art or
unestablished character designs are not required by this milestone.

## Reward, replay and migration contract

A newly started authored run that earns the road clear grants the Level 2
completion fact and Bass through the campaign's durable award path. The key
is guaranteed by the clear: no collectible, perfect rhythm score, difficulty,
module, or flawless race is required. Retry, outro replay, resume and repeated
clear cannot duplicate the key. Failure does not grant it.

Existing proof-era playable checkpoints and completed results keep their
statistics and terminal behavior. Loading one alone does not grant Bass or
Level 2 completion. A deliberate new run establishes authored eligibility;
old terminal results remain silent until Retry. Preserve the saved-bar music
restore and release-to-arm controls fixed in PR #155.

The road's existing `proofVersion: 4` remains compatible. An optional
`levelState.chapter` version-1 field identifies authored runs by a stable
`cache-*` run ID. Absent, invalid or legacy chapter metadata stays ineligible;
resuming or finishing that proof does not upgrade it. Checkpoint retries keep
the authored run ID; a true replay from the beginning creates a new one.

Completion requires the active road's actual clear status, open gate and
`musicBar >= 100`. The chapter creates one delivery receipt with
`{version:1, result, ending:{version:1, page:0, cue:0, done:false}}`. The result
retains the existing road score and adds no completion bonus. One
`completeCampaignLevel` transaction writes the result, terminal road
checkpoint, Bass, Level 2 completion, Level 3 unlock and only records the
player actually collected. The unlock is a campaign fact, not a claim that
Mac's authored stage is playable.

If browser storage fails, the current session retains its completion and
collection facts and exposes an honest save warning. An explicit persistence
retry writes that same receipt; it must not manufacture another reward or
reset the road/outro. A failed write is not reported as a durable save.

The outro is owned by `BARCODE.CacheEnding`, using existing input, Canvas,
pause and lifecycle owners. Reading, resume, skipping or leaving it must not
restart the road song, engine or race clock. Required story remains readable
without art or audio. Held inputs must release before they can advance a
scene or invoke the final action.

| Action | Keyboard | Controller |
| --- | --- | --- |
| Next cue / scene, then separate final Finish chapter | Enter or Space | Confirm / button 0 |
| Skip to final Ready without finishing | Hold S for 5 seconds | Hold button 1 for 5 seconds |
| Transcript | T | Button 2 |
| Pause | P | Menu / button 9 |
| Return to results, preserving reading position | Escape | View / button 8 |

`CacheEnding.normalize` and `serialize` bound its page/cue checkpoint. The
reading state is stored at `road.chapter.delivery.ending`. Final **Finish
chapter** marks `ending.done` and returns to results; skipping only reaches
Ready. This surface has no development-test action. The Bass badge reflects
the actual `stem.bass` archive fact, and save feedback uses the chapter's
save status rather than claiming success merely because the scene displayed.

An authored clear's results use Enter / controller confirm to resume or
replay the delivery, R / button 2 to replay the full race, C / button 3 to
return to the title, and S / button 1 to retry an unavailable save. Pointer
buttons expose the same choices. Legacy proof clear/failure retains its
existing Retry and Level 1 results return, without claiming an authored award.

## Four optional records

`src/game/lore-records.js` is the single source of the full prose and collection
preview. Existing Level 1 objects and save IDs remain unchanged. `level1`
contains the original three records; `level2` contains these four; `all`
contains the seven in display order. `get(id)` and `preview(id)` address both
chapters. Saved collections retain IDs, not copies of text.

| Stable ID | Display number / title | Author / source | Optional purpose |
| --- | --- | --- | --- |
| `lore.l02.01` | 04 · A Copy That Travels | Cache Back / Transit integrity note | Distinguish successful transfer from faithful preservation. |
| `lore.l02.02` | 05 · Leave the Mistakes In | Cache Back / Original / clean comparison | Explain why Cache keeps meaningful imperfections and both comparison versions. |
| `lore.l02.03` | 06 · A Familiar Rhythm | DJ Floppydisc / Damaged pursuit-channel log | Preserve a cadence reminiscent of 6 Bit while explicitly refusing identification from damaged fragments. |
| `lore.l02.04` | 07 · Delivered Is Not Distributed | Mac Modem / Receiver routing trace | Deepen the delivery/distribution distinction and establish street enforcement as an investigative destination. |

Four separated, visibly marked opportunities use lane choice and dwell during
the drive. Each has a two-bar preview, an amber cassette painted in its lane,
an optional-record roadside sign and a small progress indication. The road
clock below is zero-based; lanes in the table are numbered left to right for
readability.

| Record | Road-clock window | Lane | Collection |
| --- | --- | --- | --- |
| `lore.l02.01` | `12 <= musicBar < 20` | 1 | Hold the marked lane for 650 ms. |
| `lore.l02.02` | `36 <= musicBar < 44` | 3 | Hold the marked lane for 650 ms. |
| `lore.l02.03` | `60 <= musicBar < 68` | 2 | Hold the marked lane for 650 ms. |
| `lore.l02.04` | `84 <= musicBar < 90` | 4 | Hold the marked lane for 650 ms. |

The car must stay within 0.38 lane units of the target without stumbling.
Leaving or taking a hit resets the dwell. Collection is optional and requires
no face-button press, perfect action judgment or change to the music. A brief
cassette check confirms collection; full prose is read in the pause archive.
There is no automatic record award at the finish. Missing every record still
permits the complete ending, Bass and the Mac handoff. A replay can recover a
missed record without duplicating previously saved IDs.

The pursuit extract is authored written evidence in the optional archive;
it does not claim a newly voiced transmission or establish its speaker.
The fourth record describes the receiver's routing mechanism and hold route,
so finding it before the finish does not falsely claim Cache has already
completed the delivery.

## Protected behavior and verification boundary

Preserve the five supplied road music sources, 128 BPM grid, beat-ONE action
contact, buffered gears, driving difficulty and gameplay, custom dashboard,
streetlamps, building clearance, shared scenery projection and exact rearview
`blur(2.3px)`. The eight-page opening, eight-scene incoming bridge and Voice
award remain intact. No optional module or later key is awarded here.

Verification must exercise fresh clear versus failure and legacy saves,
duplicate award prevention, one-time optional collection, no-record clear,
save/restore of reading progress, held controls, pause/replay/exit and silent
terminal handoff. The combined suite, all-file syntax and required Chromium
checks gate publication/merge under standing owner authority; the final PR
and receipt report actual results. Automated checks do not establish Makko
pacing, listening preference, device performance or controller feel.

## Art and native review

Four new complete illustrations use the established character and rear-car
references. Editable generated PNGs and runtime WebPs are in
`assets/cache-ending/`, each 1860×845. The immutable art ancestor is
`14593372f7c58d8a3c5869bbda6989b98889f1ac`; the prompts, manifest and README
record the actual source assets. Runtime text fits the receiver's measured
green and amber screens in scene 2. Those labels hide when the transcript
panel is open. Images contain no baked dialogue, and the entire painting
fits the existing 1568×712 frame without cropping.

`tools/render-cache-ending.cjs` captures the actual `CacheEnding` renderer and
cue progression, using the actual `AudioSystem` synthesis. The review at
`review-cache-ending/Ending-Review.mp4` is **32 seconds, 384 frames, 12 fps,
1280×720**. Four full-resolution stills and `Ending-Contact.webp` show the
complete 1920×1080 composition. Each page advances after eight seconds;
all twelve title/dialogue cues appear. Final Ready remains active, with
`done:false`; the capture never invokes Finish chapter.

The native check passes **52 layout cases**, including ordinary and Reduced
Motion cues, transcripts, controller labels, save warnings and missing art.
Native transformed glyph bounds stay inside their caption/control regions
and the two measured monitor interiors, with no text overlap or Canvas
escape. All four contact-sheet tiles remain distinct. Full video decoding
passes. The report identifies the exact production-source and art hashes.

Relay at 0 seconds and tape at 16 seconds reuse two existing original chip
cues. The 32 kHz mono production PCM peaks at **0.132368 or lower**, does not
clip and has zero active voices after cleanup. No speech, song or road engine
is added. `Ending-Cues.wav` is the same exact cue PCM with the long reading
silence removed, lasting **1.83 seconds**. The full review WAV is an assembly
source; the MP4 contains its AAC encoding.

This is a scripted native review, not a Makko capture. Local decoded images
replace browser/network delivery; chapter persistence, earned Bass and the
road clear are explicit host fixtures. The capture therefore does not prove
campaign awards, actual browser storage, hosted image loading or physical
input. Those behaviors require the separate production integration and
Chromium checks recorded in the final PR and receipt.
