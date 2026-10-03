# Acceptance and Test Status
## October 3 — continued lag repair verification (PR #181)


Reserve native preparation for animated vehicles, combat/beat sheets, HUD and
the pursuit rig within the unchanged 32-megapixel cap. Blood, crew portraits
and legacy/decorative sheets retain their prior original-image rendering.
Under sustained background load only diffuse mist, wind and impact dust may
use the bounded quarter-size background cache in their original native
coordinates; car/traffic bodies, functional attack/contact FX, mapped timing
paint, face and HUD retain native source detail. Fresh full-detail output is
unchanged. A separate saved decoration hint restores the caller on completion.


Native animated sheets can prepare a batch of exact original-size cels,
within the same whole-atlas 32-megapixel reservation. Draws use local crop
coordinates on the selected cel; cross-cel crops retain the complete original
image. No resampling occurs. Partial failure closes prepared cels and releases
the reservation; nonintegral/static sheets retain their unscaled full bitmap.
All preparation stays outside draws and each loaded batch is reused.


Terrain slabs proven wholly below the highest crest use the existing mask's
rectangular side/bottom bounds; crossing slabs retain the full crest path.
Projected corners and a two-device-pixel AA margin establish the safe case.
Texture sampling, terrain geometry and pixel boundaries remain unchanged.
The staged boss snapshot now restores its playing/cinematic host fields as
well as chapter/state, preventing the later results overlay from polluting
that diagnostic. It also records phases without intermediate readbacks, compares the bounded
terrain mask against the original crest pixels, and gates undefeated active
boss frames separately as well as the whole boss segment.


The staged boss trace found a repeated original-image decode on sub-megapixel
street signals. Background preparation now also covers sheets from 256 Ki
pixels upward, within the same 32-megapixel reservation cap. Smaller signals,
lamps and walkers use the same exact atlas coordinates on their thumbnail
only at reduced detail; native sources and functional sprites stay unchanged.
Review output includes the earned-boss scene and baseline/adaptive native
frames, captured after measured samples for visual inspection.


The reflection skips only complete terrain slabs outside the glass and blur
envelope. Under sustained background load, sub-sample lamp haze bands merge
using the mean of their original ten opacities; full-detail lighting keeps
all ten bands. Original lamp locations, ground pools and total light energy
remain. Staged boss diagnostics also attribute draw submissions to assets and
Canvas methods; instrumentation remains outside the timing gate.

The owner's PR180 playtest remains laggy. Background adaptation preserves
native functional road markings, timing feedback, cars, traffic/effects,
HUD/rearview and the original blur.

The final chase follow-up also observes sustained display intervals above
33.33 ms, including queued raster work after draw submission. Invalid clocks,
background gaps of 200 ms or more and pauses do not lower detail. The shared
simulation/audio deadlines remain unchanged. The controlled browser fixture
feeds the previous measured, flushed display cost into presentation on the
next measured frame; it records and asserts that feedback rather than hiding
it behind its fixed 20 ms simulation clock. The 33.33 ms median gate remains.

Review loaded adaptive output including
the lowest background detail; visible driving cues must remain readable.



The remaining failure was concentrated in boss drawing, not updates. The
display clip now also bounds native foreground blends without shortening
foreground exits. Require chase and boss medians separately within 33.33 ms;
an aggregate median cannot hide a slower boss. Untimed phase readbacks use an
explicitly staged copy of an earned live-boss snapshot and restore the actual
state afterward. Both workflows check the full chase before longer work.

Functional raster atlases can also prepare one unscaled ImageBitmap outside
drawing, capped separately at 32 megapixels including pending reservations.
The native cache keeps source/crop geometry and detail; rejection, mismatch
or capacity exhaustion retains the original image. No canonical bytes change.
The performance workflow now checks complete chase/boss frames before the
long regression workflow, and retains submission/draw/update/flush breakdowns.

Background WebP sheets also prepare one quarter-size immutable ImageBitmap
outside drawing, with a 32-megapixel reservation cap and original-image
fallback. Low-detail background/reflected scenery uses these decoded sources;
functional foreground, face and HUD retain original sources and native detail.
Under load the reflection uses one rectangular raster clip, then repaints the
original curved bezel once. Its native projection and 2.3px blur remain.

Measure seven actual moving scenes against PR180 with unwrapped production
calls and a raster flush. Keep 30 startup costs/detail levels separately,
then measure a 16-frame moving window. Trace/reflection/native-fidelity
repaints run outside that window. Require 25% aggregate improvement,
no scene regression above 10%, and every scene median within 33.33 ms.
Report p95 and chosen background scale rather than asserting zero stalls.
Require full-quality mean RGB difference below 1. Inspect native adaptive
cars, ground cues and HUD as well as the coarser background.

Check fresh-run full detail, sustained adaptation, pause freeze, invalid
clocks, recovery hysteresis, original loader/bitmap rejection and reuse,
script registration, one context/blur, draw purity and scaled caller
viewports. Expansion must preserve camera transform, styles, dash and
the caller's inherited sampler. Keep canonical asset bytes and gameplay.

Consecutive production shared-loop chase and live boss frames include
actual input/update ownership and raster flush with controlled audio hosts.
Require their median within 33.33 ms; keep p95, slow frames and detail levels.
Hosted images retain immutable URLs and exact byte/hash verification.
The fixture requests CORS before loading to measure origin-clean pixels.
Complete regression/all-file syntax and both exact final-head CI events
remain publication gates; exact results/revisions belong to the PR and
generated source-pack receipt.

After publication/import, check ordinary driving, ambush, turns, Turbo,
timed hits, dense encounters, boss, pause and re-entry. Background detail
should stabilize; interactive paint/HUD/mirror should remain sharp.
Preserve Reduced Motion and Flashes Off. Actual device pacing, controller,
listening, balance and comfort acceptance remains unrecorded.

## October 3 — Level 2 reflection repair verification (PR #180)

The real Chromium test loads production artwork and renders Approach,
Ready-ONE, earned Perfect/Good, Miss, Reduced Motion and a focused turn with
the original per-object mirror/SVG path and the repaired reflection/SVG
path. Moving-state timing includes a raster flush; aggregate complete-frame
cost must fall by at least 20%, with no scene median regression above 10%.
Loaded before/after captures must keep mean RGB difference below 1.
Structural checks require exactly one reflection blur per repaired frame,
one display context, unchanged gameplay, warm/paused reuse and preservation
of scaled/translated caller viewport transforms.

Loader checks cover asynchronous preparation, rejection and unsupported
fallbacks, one preparation attempt per loaded SVG, source rectangles,
filter/alpha/smoothing, original raster routing and preload/re-entry reuse.
Non-DOM/native contexts retain the original mirror filter path. Native
moving-frame diagnostics require 65% less hot SVG work, whole-frame medians
within 5% of baseline and mean RGB difference below 0.5. Every scene ratio
and loaded-art capture is retained. Full regression, all-file syntax and
both exact final-head CI events remain required. The generated receipt
records exact tested/merged revisions.

After importing repaired main, drive through the ambush/handoff, turns,
gear/Turbo changes, repeated Good/Perfect hits, damage, pause/re-entry and
the boss exit. Check stalling/skipping on the actual device; repeat with
Reduced Motion/Flashes Off. Cache's face, glass labels and marks should stay
sharp while scenery retains the original blur. Automated diagnostics do not
assert owner controller feel, listening, fun, comfort or device FPS.

## October 2 — Cache camera and satisfying ground timing

Drive Cache's stage through slow/fast gear changes, steering bends, Turbo,
damage, opening handoff and the earned boss-to-horizon exit. Watch for abrupt
camera resets, stale edge pixels, disappearing roadside pieces and frame
spikes. Check the same transitions with Reduced Motion and Flashes Off.

Read a ground cue's lane and actual mapped button before its approach. Follow
the closing timing marker, then compare Good and Perfect impacts, real +15/+20
charge, chain feedback and CHARGED/RUSH threshold payoff. Early/wrong inputs
must not fake an earned hit; misses must read clearly without hiding traffic.
Check keyboard, PlayStation/Xbox labels, pause and resumed checkpoints.
Original judgments, song/addresses, skill access/economy and saved charge stay
unchanged. Native production review and full regression/syntax/both exact-head
CI results belong in the export receipt. Owner controller/audio/fun/comfort
and device frame pacing remain unrecorded until played.

## October 2 — Run polish, signal art and driving scenes review

- Compare walking and running in both directions, including held/released Shift
  or L2/LT, roofs, pause, jump and repeated transitions. Head/torso registration,
  planted/airborne boots, phase continuity and the loop join should stay smooth.
- Trigger Jammer discharge and boss SLAM at all difficulties. Painted warning
  and active fields must remain distinct, keep the player visible and show the
  exact original damage boundaries/timing. Collect/use a Signal Amp and verify
  its physical art and unchanged charge sockets, quiet settings and pause.
- Enter a fresh Cache Back race. Watch automatic forward motion and the
  surrounding enemies with no gameplay HUD. A physical staged sideswipe sends
  one foe offroad; HUD and steering then hand over smoothly without ghost skills
  or skipped song/pad addresses. Check skip, held buttons, pause and resuming.
- Earn the real boss/result conditions and watch Cache drive toward the horizon
  with dialogue before the existing ending. Check outro pause, skip, held
  confirmation and earned-save reload. No cinematic grants fabricated defeats.
- Recheck historical v1–3 races, old/current saves, original audio, pedestrian
  frozen cels, adrenaline, skill controls and the separate Level 3 prototype.

See `RUN_POLISH_SIGNAL_CINEMATICS.md`. Full local regression, all-file syntax,
native production captures and both exact-head hosted CI events remain required.
Actual final results belong to the export receipt. Owner Makko, physical
controller, listening, motion comfort and device pacing remain unrecorded.

## October 2 — Run, required enemies and adrenaline review

- Hold Shift or L2/LT while moving: compare 300-unit walking with grounded
  450-unit running and twelve 50 ms canonical-style cels. Check both directions,
  street/roof supports, release, focus loss, remaps, pause, entrance, Rhythm Mode,
  hacking and the existing single jump.
- Clear all four encounters normally. Required foes must be reachable on the
  correct side of closed walls; no automatic defeat credit or skipped gate.
  Recheck a previously stranded/resumed foe and the twenty-defeat requirement.
- Compare crowded hacking and dense Level 2 scenes. Native checks retain exact
  sampled road/mirror pixels while reducing echo/terrain submissions; verify
  scenery, foreground exits, original blur and quiet settings on the actual
  device. Scripted/native CPU diagnostics do not prove device FPS.
- Earn Good/Perfect charge (+15/+20), miss once without loss, then observe
  −12/−18/−24 for successive misses. Recover through an accurate press; test
  accepted Turbo −10, Disrupt −14 and genuine wreck −12. Rejected inputs cannot
  spend charge; pedestrian contacts remain penalty-free.
- Compare smoothly stronger combat/recharge/ammo/guard/tracking as charge rises.
  CHARGED/RUSH at 35/70 are intensity markers. All four skills retain their
  ordinary access at zero charge. Check old/earned saves, pause, original song,
  all difficulties/gears and anti-duplicate opportunity receipts.
- Check readable meter/deltas, distinct mapped skill icons, cooldown/active/
  queued/shot states, two ammo sockets, accepted pad locks and Pause help.
  Listen for bounded existing gain/tier/loss cues. Struck pedestrians must hold
  their original contact cel during landing and later mirror passage.

See `RUN_ADRENALINE_PERFORMANCE.md`. Complete final-head regression, all-file
syntax, production browser and both exact-head CI results remain required and
belong to the generated export receipt. Owner Makko, physical-controller,
listening, motion comfort, human balance/fun and device pacing acceptance
remain unrecorded.

## October 2 — Level 1 walk-in and complete animation pass

Start fresh after the comic and watch 6 Bit walk from completely beyond the left
screen edge to the existing street spawn. Pause and difficulty selection should
freeze the walk; checkpoint resumes and tutorial deaths should use normal spawns.
Inspect idle/performance/walk poses, enemy warnings and drone engines, the boss,
all 48 Jammer cels, all six HUD conditions, each flying craft, terminals,
platform/gate/lift status, pickups, collected receivers, Studio Cat and inspection
props. Compare their distinct cadences and visible local motion without moving
construction variants or collision supports. Check pause, Reduced Motion and
Flashes Off. Native production rendering and source hashes are scripted evidence;
owner Makko, controller, listening, comfort and device pacing remain unrecorded.
Full regression, all-file syntax and both exact final-head CI events remain
required; actual final results belong to the export receipt.

## October 2 — custom blood and crew popups

Verify visible red splatters on pedestrian hits and one physical grounded-rider contact, with stable stains under Reduced Motion/Flashes Off. Crew portraits and short readable insults should appear below the mirror, clear of pad/rig guidance, with separate holds for successive hits and frozen ages while paused. Preserve economy, old saves, exact controls and cutscene art. Focused/native/full regression and both exact final-head CI events remain required; final results belong to the export receipt. Owner Makko/controller/audio/comfort/balance/device pacing remains unrecorded.

## October 1 — street safety and pursuit control review

Check the four zebra crossings, pedestrians visibly traversing both ways,
one contact per person and varied short shame messages without score, health,
captures or skill penalties. Destroy a bike, let the rider land, then hit the
body: one grounded splat, no repeat hit. Check front/mirror depth, Reduced
Motion and Flashes Off. Cache should sustain moods through ordinary events,
close both eyes on real damage, recover deliberately, and show fixed results.
Waiting hostiles should remain separate, offer escape space and take turns
committing attacks without erasing already visible threats.
Keep combat locks, health, shots, hit effects, reticles and rig impacts above
their owning body on either side of Cache; nearer bodies still occlude them.
The native foreground regression covers four arranged paint cases with
Reduced Motion off/on, shared-pose reuse and draw purity.
Test every gear, difficulty, skill, actual music and old/earned checkpoints. Source-hashed
scripted/native evidence is distinct from Makko, physical controller, listening,
comfort, human balance and device frame pacing; those remain unrecorded.
The final local native capture matches all 89 current source fingerprints.
Initial-head full local regression, syntax and both hosted CI runs passed.
The review draw-order correction requires fresh final-head checks recorded
in the export receipt. The owner explicitly approves
publication and merge after hosted Chromium and both final-head CI events;
those final results are recorded in the PR/export receipt.
The requested iris-only edit was skipped because other pixels changed; verify
cutscene art remains the prior original. Final CI results belong in the receipt.

## October 1 — Combat polish requires fresh owner review

Verify a single retained reticle/projectile, no neighbour damage from a shot
takedown, physical Turbo catches, smooth lane motion, readable projectiles and
bounded impacts. Confirm nonlethal rams do not show zero/stale points and
lethal rams keep the complete earned takedown receipt.
Verify Turbo absorbs a hostile bullet without a distant ram or shooter damage,
then physically catching that shooter still produces the ram. Compare four
synchronized parts against ignored pads: 2x power, 3x ammo refill and shorter
skill recharge/bonus points. Test exact
controls, save/reload, first gear, Reduced Motion/Flashes Off, original audio
and cropped hazard/pad cues. Scripted/native tests do not establish Makko,
physical-controller, listening, comfort, human balance/fun or device FPS.

## October 1 — Combat chase needs fresh owner testing

Test the exact candidate receipt with a fresh version4 race: distinguish
face-piece synchronization from four skills, use all skills at zero sync,
attack actual bikes/cars, defend committed contact, disrupt locks and Turbo
on nextONE. Keep captures amid pressure, sacrifice a part to escape, and
attack the persistent rig through three systems into the full-song ending.
R2 must guard only during its active window: it blocks one ordinary road contact
without spending a sync buffer or adding enemy damage. Hostile contact/projectile
defense can produce a real counter; GUARD READY alone is not a successful block.
Watch the newly painted kick, hostile damage, physical flips, detached rider,
localized explosion and passed wreck in both front and mirror. Test Flashes Off
and Reduced Motion while retaining readable pads, locks and four skill states.
Check wreck/retry/continue, first gear, warnings, rearview destruction,
controller remaps, original audio, Reduced Motion/Flashes Off and readable
pad addresses. Makko/controller/audio, comfort, balance/fun and actual device
frame pacing have not been accepted. Scripted results are separate evidence.
The final integration receipt has nine complete clears and an alive full-song
passive failure; the silent six-fps native preview is in `authored-preview.json`.
Historical mechanics evidence remains in `combat-integration-mechanics-checkpoint.json`.

## October 1 — pursuit overhaul requires fresh owner acceptance

Import the exact overhaul revision in its receipt and start a fresh race
(version 3). Compare its opening, scouts, convoys and rig approach; wait for
committed lane locks, dodge to break equipment and try the earned alternatives.
Miss early opportunities and confirm later recovery, take a genuine wreck
and confirm first gear, pause during an attack and reload a mid-boss marker.
Break all three systems, pass the real wreck into the mirror and complete the
full original song into the existing delivered-original ending. The old exit
is retained only by historical saved rules, not a fresh run.

Review rig damage stages, system-break/exhaust paint, readable attack/pad
addresses, danger camera aperture and neutral Reduced Motion. Listen to the
five stems through damage/recovery, and test physical controller bindings,
warning clarity, comfort, difficulty/fun and actual device frame pacing.
Automated real-input races, Chromium checks, native art diagnostics and
reduced renderer operation counts are evidence of implementation only.
They do not establish owner Makko acceptance. Prior observations retain
original revision attribution. See `CACHE_PURSUIT_OVERHAUL.md`.

## October 1 — trailing camera and first-gear wrecks

The owner accepts the direction of turn offsets but rejects abrupt/jerky
response. Confirm smooth input onset, release and fast left/right reversals,
trailing zoom, readable pad positions and steady HUD/rearview. Confirm the
soft impact response and the neutral Reduced Motion/Flashes Off settings.
A genuine wreck must select gear 1, slow smoothly on the next ONE and remain
in gear 1 until manually shifted; blocked contacts must preserve the gear.
Pending pre-crash Turbo is canceled with its unused charge returned. A request
during the recovery bar cannot bypass the forced first-gear recovery.
Automated camera/drive checks and scripted native renders do not establish
Makko comfort, controller, listening or frame-pacing acceptance. The old exit
remains for this repair only; its replacement belongs to the next PR.

## October 1 — dynamic camera and replacement wind review

The owner rejected #165's curling wind; that visual is not accepted. The new
wind/camera implementation needs review in Makko at slow, middle, high and
Turbo speeds: verify full → focused → full aperture, readable button lanes,
clear upcoming traffic, short pass/hit shake and acceptable wobble. Verify
edge car markers and the corresponding four-lane alerts if cropping occurs.
Reduced Motion and Flashes Off must remove the new motion. Confirm all three
comic groups retain #165's shared controls. No new owner acceptance is claimed.
Scripted production renders and automated helper/regression results are
separate from physical-controller, sound, comfort and hosted frame pacing.
See `DYNAMIC_SPEED_CAMERA.md`; original results remain revision-attributed.

## Identical controls and stronger speed effects — October 1

Import the candidate identified by its receipt. Compare all eight opening,
eight bridge and four ending scenes: same toolbar positions/look, cue/page
separation, transcript and reading Pause/Resume overlay. Space/A reveals only;
Enter/RB advances after the page completes. Hold S/B five seconds, cancel a
partial hold, stagger both devices, and verify a full skip waits for a fresh
final Scene action. Check held controls across startup, saved reload and
results handoffs. Retain the actual dialogue, props, cue sounds and rewards.

Drive normally, steer, use Turbo, make a close pass and take an impact. The
wind/pressure paint and stronger zoom/roll should make motion more apparent
while timing, actual speed, damage, captures and encounters feel unchanged.
The rearview/dashboard stay stable; repeat with Reduced Motion and flashes
disabled. Listen to reading Pause/Resume and test pointer/controller actions.
Observe frame pacing on Makko after a fresh import. Native previews and
production-owner checks do not count as this acceptance. This candidate is
based on merged #164; its final publication and exact tests are recorded in
the PR/receipt. See `SHARED_CUTSCENE_SPEED_EFFECTS.md`.

## Locked opening format across chapters — October 1

Import the exact reviewed or merged revision identified by the PR/receipt,
reload and compare the opening with all eight Cache bridge pages and four
replayed delivery pages. They should use the same pink BARCODE tab, channel
and title header, page count/progress, full picture frame, palette, angular
cream speech, dark comms and printed speaker tabs. Dialogue uses the same
large sans-serif lettering; colored labels use monospace and cross the top
edge of the balloon. Every line, face, cassette/hand interaction, monitor
status and street gate must remain legible. The opening itself should retain
its established layout.

Inspect the complete picture without a crop, including each page's animated
and settled pose. Repeat with Reduced Motion and flashes disabled. Test the
transcript, Pause, keyboard/controller/pointer advancement, five-second skip
and saved page/cue reload. Drive and Finish still require a fresh final
confirmation; scene reading must not start the race song or duplicate rewards.
Loading/missing art must retain readable dialogue without speaker pointers.

Native production renders and bounds checks use the shared opening helpers
and actual text fonts; they check protected art and controls as well as tab,
body and shadow geometry. Their exact results and hosted browser/CI results
belong to the candidate PR/receipt. They are not Makko or physical-device
acceptance. This candidate also contains the road frame-time correction and
race launch/speed camera, so complete both October 1 race routes below on the
same imported revision. Makko FPS, visual preference and audible/controller
feel remain pending. Base/rollback is merged #163 (`8813ef7d`).

## In-road launch and speed camera — October 1

On a fresh Drive handoff, watch the brief start-line setup and the three
story cues. Verify the song, time budget, traffic and controls begin together
at launch; Enter/controller A can skip, while Pause stops the sequence.
Continue a saved marker and retry there to ensure no intro or source seek is
inserted. Compare ordinary speed, a near miss, Turbo and an impact for camera
zoom/shake and edge streaks; repeat with Reduced Motion enabled. The dashboard,
pad strike plane and rearview should remain readable and steady. Check on
Makko with sound and note any frame stalls during the intro or race.

## Cache Road repeating frame drop — October 1

The owner reports immediate alternating lag and catch-up in Level 2. After
importing the reviewed repair, run a fresh race and a saved-marker retry with
sound. Observe the first minute, several districts and both road banks. The
ground grain, street mouths, sidewalks, rearview and complete foreground
exits should remain continuous. Record browser/device, gear/difficulty,
imported SHA and a short clip if the frame drop persists. Native Canvas
profiling and automated scene checks are diagnostics, not Makko FPS or
physical-device acceptance. Base/rollback is merged #163 (`8813ef7d`).

## Title visibility in Makko — September 30 (unmerged repair)

Live Chrome reproduced a title covering the restored Cache bridge. The owner
approved replacing Makko's 161 local files from GitHub main, then the one-line
hidden-opacity correction was reapplied. Continue revealed bridge page 08/08;
Drive resumed the saved road marker. Compact route lights, lane diagrams,
mapped badges, full Pause help, bridge return and checkpoint retry were
observed; Makko reported no preview errors. The saved late-race marker has
not been cleared into a fresh Replay race, so the complete visual driving
checklist below remains open. Base/rollback is merged #161,
`4a6ead45d64eea92da3afdba0412b6a14230fc09`.

1. On the exact reviewed build, Continue the saved bridge and road, including
   input during the boot fade. The title must stay absent over the scene.
2. Return to title. Start, Continue and Settings must be visible and usable;
   retry and fresh Drive input must continue to work.
3. After the exact merged build is refreshed, choose Replay race and complete
   the visual cues/foreground exits checklist below. Record gear, difficulty,
   bar, lane, motion settings and device for any mismatch.

The native Chromium regression uses real CSS, Continue, lifecycle and boot
fade/fallback code. It checks computed opacity and Canvas hit testing, and
rejects the original CSS. Saved-checkpoint storage/restore are explicit host
boundaries; it does not establish physical-controller or audible-device feel.
The full npm suite and all-file syntax audit also passed. Exact full-suite
results, tested revision and logs belong to the review receipt. The owner
approved publishing the repair branch and opening a draft PR. Its final
revision, publication and CI status belong to the PR/receipt.

## Visual driving and foreground exits — September 30

Import the exact merged revision from the PR/receipt through the normal Makko
route, reload, and choose Replay race. Base/rollback is merged #160,
`a176163110f08988bc5f0425815d5fb6cb2e21e4`.

1. Drive with keyboard and your controller. Follow the highlighted lane and
   mapped button through the 2–3–4–1 count. Check an on-time hit, early/late
   press, wrong button and wrong lane. Brief outcomes must stay distinct;
   repeated teaching sentences should be absent. Open Pause for explanations.
2. Overtake cars in inner and outer lanes at every gear. Watch their entire
   bodies move below/beyond the frame. Inspect lamps, walkers, signs and
   roadside scenery through the nearest visible edge: no early disappearance,
   frozen near sprite, new asphalt overlap or foreground-size jump.
3. Collect an optional record using its lane/hold cue. At the final split,
   follow step 1 (Echo on the left) then step 2 (original to the far-right
   exit). Route/record lights must report actual progress. Check Reduced
   Motion; keep the approved rearview blur and music behavior.

For a mismatch, capture a short clip and note platform, input device, gear,
difficulty, bar, lane, object and Reduced Motion/flashes settings. Native
projection fixtures and automated races are not Makko/device acceptance.

## Drive feedback and responsive music — September 30

Import the exact merged revision in the PR/receipt through the normal Makko
route, reload, and select Replay race to opt into version 2. Existing saved
version 1 chapters intentionally retain their old timing/traffic/music.

1. Drive each gear. Road marks must sit flat; inspect any reported floating
   square/pole and record bar, lane and clip if it persists. The rearview
   keeps the exact approved blur. Reduced Motion preserves stable cues.
2. Compare Relaxed, Standard and Overclocked. Traffic must continue through
   the audit/pursuit acts, with at least one reachable escape route and a
   clear final split. Test Push, Brace, Turbo, Refill and Echo recovery.
3. Follow a pad on keyboard and the actual controller family. Its color,
   shape and mapped label must match HUD/Pause. Press slightly before/after
   ONE, then deliberately too early, late, wrong button and wrong lane.
   Observe unmistakable success/failure without duplicate awards.
4. Catch different musical lanes, extend a part and allow it to expire.
   Listen for the named part entering/leaving; collide and confirm the drums
   continue while one earned part drops. Pause/reload must not desync sources.
5. Read the mission cue; collect an optional tape and find it in the pause
   archive. Complete the Echo-left/far-right-original split and 100-bar route;
   optional records are not required for delivery or the existing Bass award.

Capture platform, input device, difficulty, gear, bar, audio output/latency,
Reduced Motion/flashes and a short video with sound for mismatches. Automated
races and native/browser output do not establish human timing feel or Makko
acceptance. Base/rollback is #159, `8f0f435c3edb7ddbd13373e7ba0a95c84f0c6f95`.

## Chat bubbles and cutscene effects — September 30

Import the merged revision identified by the PR/receipt through the normal
Makko route, reload and open the Cache bridge, then replay an earned ending.

1. Read all eight bridge and four ending scenes. Speaker pointers should
   identify visible people; offscreen/comms lines use dark receiver cards.
   All words, faces, cassette/hand interactions, CRT status labels and the
   street gate stay readable. The complete art remains visible inside its frame.
2. Observe street rain/reflections, studio screens and tape accents, and
   ignition light. Pause and open the transcript: time stops. Close/resume:
   no jump or duplicate sound. Enable Reduced Motion, then disable flashes;
   lettering stays put and effects are static.
3. Test keyboard, pointer and controller reading. Hold skip five seconds;
   only a fresh confirmation starts Drive or finishes the ending. Reload
   mid-dialogue and confirm the saved page/cue resumes silently. Missing art
   still exposes all dialogue and the transcript without an orphan pointer.
4. Finish returns to the existing result with no duplicate reward or music.
   The original opening, gameplay, halo depth and exact mirror blur remain
   as before. Record platform, input device, chapter/page/cue, preferences and
   a short clip for any visual or timing issue.

Automated native/browser results and final-head full CI belong to the
PR/generated receipt; they do not establish Makko or physical-device feel.
Base/rollback is #158, `694f109cd776bf9b05013aabebc3e1347855dd45`.

## Brace ring depth — September 30 follow-up

Import the merged revision from the PR/receipt through the normal Makko
route, reload and choose Replay race. Hold Brace while steering left/right,
change gears, and absorb a traffic contact. The gold ring's far arc must
disappear behind the car, with its near arc on the road below the bumper;
no gold band should cross the painted body. Repeat with Reduced Motion and
confirm a Push contact still uses its cyan arc even while Brace is held.
Keep the exact rearview blur. Record platform, input device, gear, song bar
and a short clip for any mismatch. Base/rollback is merged #157,
`5115b9afa4fb07a39fb8b23b2ac626e72f9a2916`.

Final regression, syntax, native visual and Chromium results are recorded
against the candidate in the PR/generated receipt. This rendering change
does not alter collision, capture, health, timing or encounter decisions.

## Encounters, reactions and final pursuit — September 30

Deploy/import the merged build through the normal project route; confirm the
revision against the generated receipt, reload the game and start a fresh
race. An older saved chapter intentionally retains its original encounters;
use Replay race to review this pass. Base/rollback is merged #156,
`8a6b974e809e907e97a364fcb328693be3764ac6`.

1. Drive City Escape, Freight Corridor, Audit Grid and Final Pursuit. Check
   that traffic telegraphs its lane, convoy gaps are clear and a mint pad
   never sits under a committed obstacle. Queue gears and Turbo immediately
   before ONE: already shown pads/vehicles must stay put. Pause and resume
   near the chapter markers; no shifted timing or duplicate boundary reward.
2. Catch Push and contact traffic: its sprite must move with the same position
   in the forward road and mirror. Brace must visibly absorb one contact.
   Send Echo during the bar-58 scan, move away and watch the rival commit to
   the replay. It must stop following subsequent player steering. Keep the
   existing city footprint separation and exact 2.3 px rearview blur.
3. Intentionally crash with several captured parts and no shield/Push/Turbo.
   Lose one live part, hear a brief disruption, preserve the other parts and
   already judged queued awards, then capture another pad. Repeat on Relaxed,
   Standard and Overclocked; health, traffic and recovery should differ while
   the musical timing window stays the same.
4. Reload a checkpoint after opening the exit: it must remain earned and
   finish without requiring another Echo. Inspect all three final attacks and
   the bar-90 setup cue. At the delivery
   approach, send a stable left-lane Echo and take the far-right exit. There
   must be room to split in every gear, with no extra rival collision at the
   gate. Deliberately miss it once and Retry from the saved marker. Complete
   bar 100, check the four ending panels and confirm Bass/results save once.
5. Check the four new sprites with normal and Reduced Motion settings: no
   opaque image rectangles, oversized glow hiding lanes or beacon clipping
   nearby scenery. Resume old proof and pre-encounter authored saves; preserve
   their layout, completion eligibility, silent ending/results and song bar.

The recorded controller study clears all 18 full production-input matrix
races, including one real hit in every recovery run, plus a mixed-gear race
and a deliberately missed exit followed by checkpoint retry, an earned
five-contact Push route and two early crashes (22 complete races). Focused
chart/reaction/pursuit/save checks remain separate gates. Final local and CI
outcomes belong to the PR/generated receipt; native footage and controlled
Chromium checks do not establish Makko performance or controller feel.
Record browser/platform, input mapping/device, difficulty, gear, save route,
song bar and a short video for each failure. See `CACHE_ROAD_ENCOUNTERS.md`.
Older acceptance routes below remain historical regression context.

## Authored Cache Line completion — September 30

1. Import the merged build in Makko, Continue from the bridge and start a fresh
   drive. Preserve the eight bridge scenes, road scale, beat ONE and 2.3 px
   mirror blur. Collect a marked cassette with a 650 ms lane hold; inspect it
   under Pause → Archive. Switch chapters with all three input methods.
2. Finish a fresh 100-bar race with the Echo gate open, including a run with no
   records. Expect Bass once, actual result statistics and four ending panels.
   Reading, pausing, transcript and five-second skip must never restart music
   or the road. Skip reaches the final panel; fresh Finish chapter returns to
   results. Hold confirm across the finish and across results return: no action
   occurs until release and a new press.
3. Reload during the ending: Continue restores its page/cue silently. Replay
   ending and return to results without changing score/reward. Replay race
   starts a new eligible run. Title retains the completed checkpoint. Mac's
   authored stage remains a future chapter, with no automatic DEV launch.
4. Restore direct/nested legacy proof saves: preserve status and music offset;
   no retroactive Bass or Level 2 result. A full replay can earn completion.
   Verify a failed checkpoint attempt keeps its run ID and cumulative retry,
   elapsed and damage counts, while replay resets them.
5. Test storage unavailable then retry: report session-only facts honestly;
   no false saved badge. Repeated saves/reload must not duplicate rewards.

Focused persistence and production-flow checks, the full regression suite,
all-file syntax and hosted Chromium scene/input/audio checks are required for
this diff. Actual outcomes/head are in its PR/generated receipt. The 32-second
native review is scripted production rendering, not a Makko playthrough.
Capture the platform/browser, input device, save route, panel or song bar and
short video for any failure. Base/rollback is merged #155 (`21257af`).

## Completed-road handoff — September 30

From merged #154 (full prior CI passed), check both direct Continue and a
nested `road-clear` re-entered through the bridge. Restore the completed
result without a song/engine start or automatic replay; shared-loop updates
must leave it silent. Explicit Retry starts one fresh drive at zero. For a
playable save, restore before source creation and verify the saved-bar offset
(bar 76 = 142.5 seconds). Preserve existing preparation failure/cancellation
handling, Voice/results and the no-Bass/no-Level-2-completion boundary.
Test clear/fail × controller Retry/Exit with buttons arriving after the final
driving poll: hold does nothing, release plus fresh press acts once. Menu
pauses results; pause-menu resume must preserve the release guard.

Focused lifecycle/bridge and road-proof checks pass restore ordering, saved
offset, silent results and deliberate Retry. An earned 100-bar clear survives
exit/nested re-entry with exact statistics. Legacy v1/v2/v3 terminal saves
roundtrip; v1/v2 completion normalizes to bar 100 for valid v4 rewriting.
All four controller boundary cases and actual pause-menu resume pass. Final combined regression, syntax and actual
Chromium/CI for this repair remain pending; use its PR/generated receipt,
not #154's earlier pass. Audio preparation remains necessary and no offline
availability or Makko/device acceptance is implied. See
`CACHE_ROAD_COMPLETED_HANDOFF.md`.

## Eight-scene Level 1 → Cache Line bridge — September 30

Require all eight illustrations and the exact sixteen-line runtime script,
with title/first-line timing and an indefinite final-line reading hold. Keep
the previous opening intact. Test physical keyboard/controller held inputs,
remapped prompts, pointer buttons, independent five-second skip, transcript,
pause, results return and all 24 page/cue checkpoint states. Preserve old
saves, Voice and score/results; never grant Bass here. Ready must wait for a
fresh Drive, with retryable audio failure and no late start after cancellation.

The production flow checker passes all 24 cues, input/skip behavior, save
positions, audio-entry failure and lifecycle cancellation. The focused audio
checker passes five original synth cues, identical retained
A/B samples with eighth slots 2/4/7 omitted, maximum 1.94-second duration,
five-buffer/one-voice bounds, pause/page cleanup, shared mute and unchanged
protected sync hashes. There is no bridge song playback or road engine.
The 64-second native preview passes 72 text-metric checks with no overlap/
escape and identical Reduced Motion layout; final Ready never invokes Drive.
Full local regression and all-file syntax pass. Actual Chromium
input/rendering/remote-art checks remain pending merge gates; the PR and generated receipt identify completed results and
revision. Native artwork/preview does not establish hosted loading, Makko
pacing, controller feel or owner audio preference. See `CACHE_LINE_BRIDGE.md`.

## Digital dashboard and source-facing correction — September 29

Require live MPH conversion, separate current/queued gear, timer, integrity,
mapped action/ONE cue, Turbo/Echo state and real lane expiry. Check urgency,
empty/ready/active states and art-loading fallbacks; reject invented gauges
or labels baked into the bezel as fake state. Keyboard and remapped controller
prompts must remain accurate. Confine the new dashboard to the existing top
164-pixel HUD band and preserve the road aperture, mirror face/crop and exact
2.3 px blur.
The existing road proof and focused dashboard checker pass 38 production
draws, including queued G1, active-plus-queued lane refresh and explicit
final-exit guidance. Seven native scenarios support visual review. The cruise
frame drops from 36 to 16 alphabetic HUD words; this does not establish
readability in every state. All-file syntax passes; full regression and
final-head Chromium/CI remain merge gates recorded in the PR/receipt.
These focused results do not replace the complete gates.
The real-browser asset gate includes 48 animated/stateful sheets plus three
static HUD assets (51 total), published-byte parity and production remote
loading with fallback disabled. Static glyphs are not animation coverage.

The fenced `cachePlaceSubstation` may only appear left and unmirrored.
Right sites 2939/3913/12944 use the approved capacitor-exchange variant;
the complete serialized landscape/satellites and all 48 core keys remain.
The bank-art checker passes 12 production main/rear observations, and the
existing clearance checker passes 10 seeded routes/1,162 audited cards.
Latest owner facing instructions override old key-count assertions when a
source tag was wrong. Retain the previous clearance rules
for every legal placement. Focused production checks, full regression, syntax
and Chromium are merge gates; the PR/receipt identifies actual results.
Owner Makko readability and controller/device feel remain open. See
`CACHE_ROAD_DIGITAL_DASHBOARD.md`.

## Building clearance and rearview consistency — September 29

Revisit garage address 1840 and the previously intersecting residential
middle plate at 1905. Require footprint separation through the actual
approach/pass, plus full-route checks across banks and bends. A wider
center-distance assertion alone is insufficient evidence, and this focused
change does not certify the entire older landscape planning document.
Clearance uses along-road/radial contact envelopes with an 18-unit margin;
intended same-family seams are allowed, unrelated occupied bands are not.
The final fitter preserves radial rows, uses 75-unit featured half-depth,
rejects unplaceable cards at generation and cleans their graph leaves.
The focused check passes 10 seeded layouts with 1,162 retained cards and
independent all-contact validation. Default production retains 139 cards,
all 48 modular keys, 25 street mouths and 17 fitted satellites. Both reported
residential cards are rejected; the garage remains at 1840/setback 41 and
appears in production draws through progress 1450–1800. Existing road proof
passes. Final counts include 38 axial relocations, 88 rejected cards and
15 omitted satellites, with zero unresolved/contact-envelope conflicts.
Full local `npm test` and all-file syntax pass; Chromium/final-head CI remain
separate merge gates. Both final visual comparisons have been inspected.

The mirror must draw the existing world and authored traffic sprites behind
Cache, with receding world motion and exactly `blur(2.3px)`. Preserve current
animation, lamp and depth rules without claiming new vehicle viewing angles.
Full regression, syntax and Chromium remain merge requirements; the PR and
generated pack receipt record the tested revision/outcome. Moving comparison
captures are implementation evidence, while Makko appearance and sustained
device performance remain owner review. See
`CACHE_ROAD_CLEARANCE_REARVIEW.md`.

The animation-route check passes 753 actual production draws over all 48
atlas keys, including all mirror cels for six traffic types. The focused
rearview comparison records four passed-traffic segments at 24 FPS with
the original 2.3 px blur. Full candidate gates remain separate.

`Drive-Review.mp4` is a silent 16-second, 24 FPS scripted production-draw
sweep around the reported garage (progress 1420 to approximately 2696.7), not an
input-driven gameplay/audio capture. Prior catch and audio metrics remain
historical; gameplay preservation requires this revision's regression gates.

## Streetlamp scale and chip sound — September 29

Check smaller, staggered lamps through the full road and mirror, including
corner clearance. Downward beams must begin at the painted lenses and end
at their projected pools; the ground light must remain below actors/buildings.
Preserve #150's activities, depth contacts and readable road composition.
The focused lamp check passes main/mirror draws at 11 route positions,
spacing/socket/ground/mirroring checks and Canvas alpha falloff.

The recording audit measures all 100 first-beat roots: 92 D and eight F.
Road countdown and early-result pitch must use the target measure while
their scheduled source deadlines, beat ONE and gear timing stay unchanged.
Full regression and Chromium are merge requirements, including real audio
for distinct cues, all engine gears, voice/cache bounds, clipping, unchanged
music sources and pause/resume/restart/disposal cleanup. The generated
source-pack receipt and PR identify actual results at the tested revision.

Focused chip checks pass 152 palette PCM variants, intended count-note pitch,
12-voice/96-buffer limits, 6,000 updates sharing three engine sources,
shift/turbo response and cleanup. Maximum pre-playback sample peak is
0.60033; this is not a full music-plus-SFX mix peak. The existing delay
regression passes 50 downbeat arrivals/presses through 250 ms output delay.
Palette coverage is separate from live event routing: lock, refill, miss
and empty are auditionable sounds without current gameplay calls.

Review `Lamp-Scale-Before-After.webp`, `Lamp-Details.webp`, `Drive-Review.mp4` and
`Chip-SFX-Audition.mp3` under `review-cache-lamps-chip-sound/`. The owner must
still judge the mix and musical feel in Makko; an unclipped offline render
does not establish subjective quality or device performance. See
`CACHE_ROAD_LAMPS_CHIP_SOUND.md`.

## Living sidelines and fitted lights — September 29, candidate

Review individual tail lights and streaks across all vehicle/steering poses,
especially the single-light trike and narrow sweeper/shuttle lamps. Working
people must act with planted contacts; the board player remains seated and
the handheld player travels outward. This replaces the older rule freezing
all standing/seated images, while preserving their ground positions.

The expanded production route audit targets 48 animated/stateful sheets,
including six work/social cycles, the new traveller, four-cel cart, all six
facade families and mirror routes. All 48 block anchors have passed the
production draw-rectangle check; vehicle and six facade boards have passed
visual inspection. Hosted loading must use published matching art
(`172b758`); local sheet availability alone is insufficient. Full local regression
and syntax pass. The 705-draw route audit passes all 48 sets; separate pixel
inspection confirms all six facades contribute changing pixels to the mirror.
Final-head CI must pass Chromium and hosted loading before merge; the generated
pack receipt and PR identify that exact outcome.

The default route layout records 336 props and 24 carts. Moving review must
check their readability, building occlusion and clear street openings, while
retaining beat-ONE catches and gear behavior. Owner Makko appearance,
controller/audio feel and device FPS are still open. See
`CACHE_ROAD_LIVING_SIDELINES.md`; automated footage is not owner acceptance.

## First-beat timing and complete animation routes — September 29

Current requirements replace historical beat-four entries below. Automated
checks cover immutable physical pad contact on ONE across all gears, boundary
requests, Turbo/Surge/recovery, frame rates and pause/resume. The actual output
clock helper and timestamped input are exercised with 0–250 ms device delays,
old keyboard events, invalid timestamps and manual calibration applied once.

The animation audit submits complete production world/HUD frames. It checks
all 41 animated/stateful atlases, both pedestrian banks/directions and mirror
routes, every prop/ambient family, traffic, all impact/action cels and all
flyover cels. Standing/seated people and the stable normal Cache chassis are
intentional; Reduced Motion freezes decorative clocks. Direct sheet draws are
separate and cannot inflate live coverage. Hosted production loader checks
must pass in Chromium before merge. See `CACHE_ROAD_DOWNBEAT_DEPTH.md`.

Owner Makko import, audio/controller feel and sustained device FPS remain
unverified. The new review drive is evidence from production draw and inputs,
not an owner acceptance claim.

## Car timing line and sweeper compositing — September 29

The #145 owner review found its ahead-of-car timing plane confusing and the
sweeper still doubled. The new production draw anchors musical pads and
phrase paint at the rear tires. A permanent line and lane brackets show
where to watch even between actions. Opening guidance points to that line.
Checks cover pad/car contact across speeds and the marker between actions.

A magnified test loads the real atlas through `PresentationAssets.draw`
with Makko removed. Before: three sweeper atlas draws with fixed wheel
cutouts and a displaced body; after: one coherent cel, with no extra roof
beacon. Existing steering, animation frames, pedestrians, transport,
input windows and success audio are preserved. New Makko playtest judgment
is pending. See `CACHE_ROAD_CAR_TIMING_SWEEPER_FIX.md`.

## Cache Road motion and beat-four repair — September 29

The owner rejected #144's stationary travellers, sweeper turn and pulse
alignment. The repair now moves travelling cutouts in ground coordinates;
standing/seated figures hold their positions. Horizontal figures face the
nearest edge. The sweeper eases into and out of its merge with one coherent
body/tire frame and restrained suspension.

Every announced action is tied to one beat index congruent to 3 modulo 4.
Its road button meets the visible receptor ahead of the car on that beat,
alongside the HUD count and three preceding road marks. Speed changes do
not move the deadline; input calibration only affects judgment. Early
accepted input is latched once and pays its visible/audio response on beat
four. Perfect and good use distinct chords through the existing SFX bus.

Local full regression and all-file syntax pass. Production update simulations
clear both four-action runs without damage, with ordinary steering and four
captured parts. Focused checks cover ground travel/facing, Reduced Motion,
smooth merge endpoints, speed-independent deadlines and early input. The
rendered drive is controlled production code, not a hosted Makko session.
CI includes Web Audio checks and a replay of the drive's recorded cue calls
and stem ramps. The owner still needs to judge latency, visibility and
device pacing in the imported build. See `CACHE_ROAD_MOTION_RHYTHM_REPAIR.md`.

## Cache Road pedestrian travel — September 29, local candidate

Six walkers have separate front/back four-footfall rows; the bicycle courier
pushes right on foot, the skateboarder rolls left and the crate carrier walks
right. Twelve seated or standing people remain single still images. Authored
travel views do not flip. Reduced Motion holds the first pose per direction.
The local production Canvas drive and frame board are in
`review-cache-pedestrians/`; local `npm test`, all-file syntax, sheet geometry
and whitespace checks pass. This is art/playback verification, not hosted
Makko acceptance. The owner subsequently authorized public publication, and
the immutable art ancestor is on the public branch. Hosted CI and a Makko
playtest remain open.

## Cache Road animation delivery — September 29

Merged #142 provides eleven eight-cel vehicle sheets, eight three-cel fixture
sheets and four eight-cel action sheets. Its full CI passed; the eight-second
production draw and frame boards are in `review-cache-animation/`.

This follow-up restores immutable hosted loading for all 23 sheets plus seven
companion painted cues/effects. The asset check verifies each pinned request,
a distinct matching local fallback, cessation after two failures, and vehicle
and fixture atlas rectangles after successful fallback. The published #142
tree contains every referenced asset. Local VM checks establish loader behavior,
not live network or image decoding; full checkout CI is required before merge.

Owner Makko review remains: import the merged build, confirm animated cars,
lamps/signals and action symbols display, compare the rearview fixture phases,
and check Reduced Motion, fourth-beat input, sound and device frame pacing.
Pedestrian walking/work cycles remain deferred.

## Cache Road wet brake and damage effects — September 29

Braking makes a pair of broken red reflections under Cache and leaves six
short tire-track segments; releasing the brake returns to a dim tail-light
trace. At integrity 2, exhaust appears behind the car, and at integrity 1
it grows; the collision pose/grit takes precedence during the impact.
Production draw checks verify the states and car occlusion. In Makko, judge
the reflections in motion on wet asphalt and ensure the smoke remains
readable without masking lanes, traffic or the car.

## Cache Road fourth-beat comic cues — September 29

The replacement art uses eight local painted WebPs. Inspect the continuous
approach strip, pad, four button symbols and catch burst under real driving;
only the HUD numbers claim beat positions. At every allowed speed the 175-unit
reach lasts long enough for one complete fourth-beat timing window (2.33 s
at the 75-unit/s ceiling). This is the timing design; Makko audio/input
play remains the owner's final feel check.

The focused production check verifies that beats one, two, three and the
following first beat do not consume a pad, while beat four catches it. The
draw check verifies the inlaid comic pad remains beneath traffic and the HUD
switches from HIT ON 4 to an enlarged PRESS cue. Same-position renderer
stills at beats three and four show the button cue change; they do not prove
hosted input/audio sync. After merge, play a four-pad run in Makko at cruise,
under throttle and while braking. Confirm that the press cue agrees with
the audible fourth beat and mapped controller button, and that the inlaid
art is legible without covering cars. Report any late or early cue with
device, input-offset setting and road position. The owner has not yet
accepted this feel.

## Six-family Cache Road production review — September 27

The local protected route exercises all 48 left/right rear, middle, open
and filled cards. The alpha checker validates 48 source/runtime contacts,
transparent mouths, four local materials, eight joins, six street decals,
22 new individual cutouts and six four-frame practical sheets. The graph
and draw harness check seeded layout, parcel access, street ownership,
unique pedestrian identities, and asset loading. Staged production Canvas
captures cover 0–9000 and four consecutive 2460-unit moving quarters;
see `CACHE_ROAD_SIX_FAMILY_PRODUCTION.md`. These are review evidence,
not a Makko host acceptance. Owner moving appearance, device frame pacing,
remote publication and Makko import/open remain pending before merge. The
new kit now points to the local, immutable `b43761c` art ancestor with
checked bundled fallbacks; its public URLs are unavailable until that commit
is published. The full local `npm test` suite, all-file syntax audit and
`git diff --check` pass with this loader change. Recheck actual remote loads
after publication.

## Cache Road homes and street joins — September 27

The source and runtime art check passes sixteen market/homes sided contacts,
ground slopes, real front gap alpha and the eight open-center joins. The
protected-site layout chooses all eight homes images and only opens a gap
onto its connected street. `npm test`, `npm run check:syntax:all` and the
presentation asset fallback check passed locally. Inspect the
[20-second homes draw](review-cache-homes-family/Cache-Road-Curved-Roadside-Drive.mp4)
and seed 17 stills from `CACHE_ROAD_HOMES_SECOND_FAMILY.md`; these use the
production Canvas draw path, not hosted Makko. The other four district
families, mixed transitions, full-route seam and pacing review, and owner
Makko appearance judgment remain open before merge.

## Owner visual direction — September 26

The owner approved the overall look of the 12-second production-draw clip
at `0821f60`: “That's it! That's the look!” Treat the capture as the visual
baseline for density, horizon, perspective and rolling layer motion. This
does not mark the complete procedurally generated city or Makko/browser
playtest accepted; remaining art, visible street branches and performance
checks stay open below.

## Cache Road layered-city candidate — September 26

The current unmerged implementation passes `npm test`,
`npm run check:syntax:all` and `git diff --check`. The production draw was
captured at 0, 230, 600, 1300 and 2200 with the default seed; seeds 17 and
53 were also reviewed at 230, 1300 and 2200, plus a 12-second moving opening.
Chunk overlap, graph access, legal front gaps and ground movement have
focused assertions. These checks establish a working game-path scaffold,
not visual acceptance: five neighborhood art families, fitting and joins,
art-supported street turns/crossings, the older site clip transition,
Makko import and browser pacing still need work. See
`CACHE_ROAD_LAYERED_CITY_IMPLEMENTATION.md`. The prior audit below describes
the earlier isolated-run commit, not this candidate.

## Cache Road layered-city gate — September 26

The workshop integration fails the measured landscape gate despite the
passing gameplay harness. It does not provide continuous rear/middle/near
coverage on both banks, a sampled two-coordinate terrain surface, opaque
near-ground occlusion, a connected route-wide street/parcel graph, or
validated contact and join metadata for the eight images. Its isolated
blocks and bare banks are visible in the actual 280/390 production stills.
`CACHE_ROAD_LAYER_GAP_AUDIT.md` records the source files, exact gaps,
projection rows and requirement-by-requirement status. Do not count image
exports as approved assets or claim the full city is playable/accepted.

The next visual gate uses the original road width and crest, real moving
game frames at progress 0, 230, 600, 1300 and 2200 across three layout
seeds, and the corresponding top-down graph. It must show layered handoff,
legal streets and grounded buildings through bends without alpha pops,
hard joins, repeated barren mid-bank points or altered gameplay. Makko
import, pacing and owner feel judgment remain separate acceptance checks.

## Cache Road pedestrian action and context — September 26

Review the refreshed [opening](review-cache-inhabited/Cache-Road-Mirror-Road-0000.webp),
[early bank](review-cache-inhabited/Cache-Road-Mirror-Road-0320.webp),
[street gap](review-cache-inhabited/Cache-Road-Mirror-Road-0400.webp),
[next block](review-cache-inhabited/Cache-Road-Mirror-Road-0700.webp),
[later bend](review-cache-inhabited/Cache-Road-Mirror-Road-4000.webp) and
[last section](review-cache-inhabited/Cache-Road-Mirror-Road-6200.webp).
The new people must read as individuals doing things, with one to five in a
procedural group and no duplicate person within that group. Verify the five
painted props occur by relevant sites and move over the ground at road speed.
Three short drive clips in the same folder show opening, middle and late
route motion. The groups currently hold action poses for future animation;
this pass does not include walking cycles.

## Cache Road rolling ground and inhabited outskirts — September 26

For the larger-scale follow-up, compare the [early cluster at bar 8](review-cache-inhabited/Cache-Road-Mirror-Road-0320.webp)
with the other five stills. Ground-cluster buildings should be readable on the
bank, while featured sites keep room around them. Market/diner frontages may
have vendors and pedestrians; there should be **no bus stop** or unconnected
shelter beside the highway. The source painting remains inactive for a future
route design.

Play the full route at normal speed. The painted grain should roll toward
the car with the sidewalk and road markings, including through bends, without
a stationary floor or abrupt strip seams. Look for smaller occupied gaps,
branch lanes and residents as well as open breathing room around the larger
area paintings. No new building should rise through the ground, become
transparent at the horizon, cover the curb or create a competing wall of
architecture. Compare the five actual draw stills and continuous drive in
`CACHE_ROAD_INHABITED_GROUND.md`. Local production Canvas review and focused
checks passed; Makko performance and owner appearance judgment remain open.

## Cache Road equal usable banks — September 25

The corrected diagrams in `CACHE_ROAD_AREA_ASSET_AUDIT.md` show nine active
LEFT and nine active RIGHT selections, plus four active BOTH and three
retained inactive sources. The encrypted pump at left address 7427 and drone
service node at left address 6511 draw unflipped in existing slots; compare
their approach and closer frames in `review-cache-left-live/left-live-1.webp`.
Check their rolling footprint against the old wide horizon in Makko. The
same 25-file inventory contains 22 active area WebPs, with no new sites.

## Historical Cache Road five flipped right-bank areas — September 25

Compare the two labeled banks in `CACHE_ROAD_AREA_ASSET_AUDIT.md`. The five
new sources are left-facing when viewed alone, and the **whole picture** is
mirrored at right-bank sites. Drive past relay exchange near 623, night
data market near 2685, data reclamation near 5055, signal orchard near
5829 and capacitor exchange near 8846. The short/tall area proportions
should feel grounded as they clear the old wide horizon; no source should
appear unflipped on the right. Their actual-address approach and closer
frames are linked in the audit. The site count, road/music/gameplay and
three inactive painted lots remain unchanged. Scripted production Canvas
frames and focused checks support review; Makko appearance is still for
the owner to judge.

## Cache Road all area silhouettes and native-bank sites — September 25

The inventory and paired horizon/closer comparisons are in
`CACHE_ROAD_AREA_ASSET_AUDIT.md`. During a drive, see the rounded yard on
the left near 3138, long yard on the right near 3635, rounded garden on
the left near 4460, compact garden on the left near 6303, compact yard on
the right near 7015 and long garden on the right near 8158. The long
footprints should taper with their assigned bank; they need not be square.
The original wide garden/yard slab and painted parking lot should not
appear. The two compact cyber sites remain the common defaults. There are
still the same number of sites and the same wide planet edge. Native
approach/closer frames and focused checks passed; Makko visual judgment is
still open.

## Cache Road wide horizon and directional cyber assets — September 25

Drive past the hydroponics and fabrication sites on both banks. On the
left, hydroponics rises toward its road-facing right edge; on the right,
the whole image mirrors so its high edge faces the road. Fabrication uses
the opposite painted orientation. Their short curved ground should read
as part of the wide planet and stay beyond the sidewalk as each location
grows and passes. Compare the early and late city: the closer frontage
continues to rise, while the planet does not shrink into the rejected
shallow arc. The earlier art remains available for comparison; six variants
now appear at the specific sites above.
Native staged frames and the focused draw check support this review. This
is not yet a Makko visual/performance acceptance or a merged change. See
`CACHE_ROAD_HORIZON_ASSETS.md` for the specific frames.

## Cache Road city approach and shared crest — September 25

Historical rejected local draft; use the directional-art route above.

Drive the opening, an industrial yard and garden around a bend, and the last
part of the level at normal size. At distance, only upper roofs/treetops
should show; the painted base should clear gradually across the flatter
planet edge before passing outside the sidewalk. Fog should touch that same
edge on both sides, without a dark horizontal gap. Compare early and late
city architecture: the near frontage should grow and reveal its lower
facades steadily, including across lap boundaries, while distant layers
remain in proportion and pan only with road bearing. Repeat with Reduced
Motion. First and third-lap production drives and staged frames were
inspected; these do not establish Makko performance, input, audio or owner
visual approval. Focused production checks and repository/CI status belong
to the revision receipt. The adrenaline and power-up audit remains open.

## Cache Road staggered roadside and surface flow — September 25

Drive the merged build through the opening and a later lap at normal and
reduced speed. A location should hold as a small, fully colored roof behind
the curved crest, then reveal its ground and grow smoothly into a fast side
pass. Watch each bank independently: some addresses oppose one another,
while others have empty space or arrive well before the other side. The
curb and slab joints, side ground, parcel, lamp and building should pass on
the same bend without sliding or a bare wedge. City architecture should
keep narrow natural proportions while all three layers pan only with the
road bearing; check Reduced Motion as well. Compare a house, park, open lot
and industrial site at different setbacks. No new off-road traffic or
duplicate building should appear.

First and third-lap 32-second production Canvas drives and four selected
frames were visually inspected; the focused test covers spacing, opaque
reveal, crest, exterior clearance, uniform city aspect, projected surfaces
and shared pan. Exact full-suite and CI results belong to the revision
receipt. These scripted draws cannot settle Makko appearance, frame rate,
audio or controller feel. Owner acceptance is pending. See
`CACHE_ROAD_ROADSIDE_FLOW_PASS.md`; the audit's adrenaline and power-ups
remain deferred to the mechanics pass.

## Cache Road curved crest and varied site distance — September 25

From the exact merged build, follow one building on each side at normal
speed. Its roof should first peek above the city/planet crest while the
parcel is obstructed. The full facade and ground should clear together on
the diagonal path before the site passes outside the sidewalk. Follow the
park, open parking lot and small trees through the same reveal. Compare
several locations: some should stand visibly deeper in the landscape than
others, while their projected ground keeps them attached to the side street.
Check a later bend, third-lap reversal and Reduced Motion. The city layers,
streetlights and sidewalk should maintain the road's motion; no off-road
traffic car or duplicate whole building should appear.

The close-spaced production frames, third-lap stills and continuous Canvas
draw were visually inspected. Focused production geometry checks cover a
curved crest, roof/base/clear stages, sidewalk clearance, varying setback,
facing and no sudden lower-edge pop at the near handoff. The full repository
gate and exact revision are in the receipt. These scripted frames cannot
establish Makko appearance, performance, audio or controller feel; owner
acceptance remains open. See `CACHE_ROAD_ROADSIDE_CAMERA_OVERHAUL.md`.

## Cache Road coherent roadside camera — September 25

Historical first #127 draft: its horizontal reveal was corrected above.

Review the proposed correction against the owner's full game frame and crop.
Drive at normal size through the first park and parking lot, then a later bend
and third-lap reversal. A distant roof should rise from behind the visible
city-bottom crest, its facade and parcel should clear gradually, and its size
should grow steadily with the road and streetlights. Buildings, park and lot
must stay beyond the outer sidewalk; no parked traffic cars should appear in
the empty side terrain. The three city layers should shift together only as
the road bearing changes, without tile seams or a free-running drift. Repeat
while braking, resuming after pause and with Reduced Motion.

Staged production draws across two laps and a 32-second continuous render
were inspected. The focused draw test checks reveal, growth, setback, facing,
absence of stray parking cars and coherent city pan. Exact repository/CI
checks belong to the revision receipt. A scripted Canvas preview cannot
establish the hosted Makko appearance, frame rate, input or music feel. The
owner has not accepted the visual result. See
`CACHE_ROAD_ROADSIDE_CAMERA_OVERHAUL.md` and the stills there. The audit's
adrenaline and six power-up categories remain open after this visual review.

## Cache Road horizon and open locales — September 25

Historical #126 checklist. The owner rejected the shown park/parking cars,
horizon placement, city drift and approach scale. Use the route above.

Import the exact merged SHA into Makko and drive the opening and later road
bends at normal speed. Follow a building from its first small roof above the
horizon: its base should remain hidden briefly, then the whole building should
clear the lip, grow and leave the edge beyond the sidewalk. The streetlight
and sidewalk should travel with it. Follow the park foliage and parking lot
through the same sequence; their ground must stay in the landscape, follow
the bend and never rise into the sky. Parking cars should read as the game's
own traffic art. Look for repeated buildings at two scales, overlap, empty
gaps and entrances facing away from the road. Repeat a close pass with braking,
pause/resume and Reduced Motion. The power-up/adrenaline tuning remains next.

Production draw checks cover the clip, scale, no duplicate whole sites,
setback, facing and use of game art. Native first and third-lap scenes, six
site-stage frames and a 32-second continuous drive were inspected. They do
not establish Makko performance, audible response, input feel or aesthetic
acceptance. Record the imported SHA, device, road position and short clip for
any issue; see `CACHE_ROAD_HORIZON_LOCALES.md`.

## Roadside setback and facing — September 25

Historical #125 route. The horizon/locale route above supersedes its duplicate
background row and flat open-lot art; exterior setback/facing still apply.

Import this correction's exact merged main SHA into Makko. Drive the opening
market and house at normal size, then follow them to the near screen edges.
Their full painted footprints should stay on the landscape outside the
sidewalk, leaving a visible strip for pedestrians and lights; the market
storefront and house entrance should turn toward the road. Check the garage
bay, parking gate, park entrance and later houses on both sides, including a
noticeable bend and the close pass. Streetlights should keep their prior size.
Pause, resume and try Reduced Motion; the fixed places and curved sidewalk
should continue moving together at road speed. A road position and frame or
short clip will help resolve any remaining bad frontage, overlap or empty gap.

The focused draw checks compare visible place bounds with the actual sidewalk
paths and check orientation. Seven scripted native scenes and a continuous
drive show placement at various depths; they do not establish Makko input,
music response, performance or aesthetic acceptance. The prior pad, bar and
HUD routes still apply. Adrenaline balance and the defense/offense/traffic/
environment/song/lane power-ups remain after the visual pass.

## Curved Cache Road roadside — September 25

Historical #124 placement: the owner requested exterior setback and frontage
facing after this review. Use the route above for current visual acceptance.

Import the exact merged main SHA into Makko at normal game size. Drive the
first market and house slowly, then at cruising speed. Compare each with the
player car, freight and sweeper: the near building should feel like a real
roadside place while its far version starts small. Follow a single market
past the camera; its upper facade should continue until it leaves the edge,
without a size jump or early disappearance. Repeat around a visible road
bend and check the curb, parcel foundation, wet ground, trees, wall and lamp
all flow together. Check parking, park and industrial blocks for varied
size/spacing and empty stretches; try pause, resume and Reduced Motion.

Report the imported SHA and a normal-speed clip showing a bad angle, floating
footprint, scale mismatch, pop or blank gap. The native 32-second render and
production draw assertions cover a scripted view, not a Makko playthrough or
music/controller verdict. The pad, song-bar and HUD checks below still apply.
The adrenaline balance and new power-ups remain open after this visual pass.

## Individual Cache Road places — September 25

Historical #123 checklist: the owner rejected its visual proportions and
placement. Use the curved-roadside route above for current review.

Import the exact merged main SHA into Makko. Drive the first two districts at
normal speed, then brake, accelerate and pause/retry. Follow a small distant
market and house until they grow and leave the screen; watch parking, parks,
garage, apartment and industrial parcels appear at different sizes and
intervals on both sides. Their roofs and lots should retain their own oblique
perspective rather than shear into one long street wall. The short houses,
fences, trees, kiosks and wet patches should fill the intervals without
covering warnings, road pads or traffic. Watch the same nearby lamp, walker,
deck joint and parcel cross the view together. Repeat in Reduced Motion;
road travel should continue while decorative sky movement holds.

Judge the density and visual rhythm through a few uninterrupted minutes,
especially the transition from commercial to service blocks and the approach
at the edge of the screen. Report the imported SHA, device, road position and
a frame or short clip for any pop, repeated pattern, sliding foot line, flat
gap or readability problem. The 32-second native review is a scripted
production draw, not a Makko controller/listening playthrough. The pad,
button, song-bar and HUD checks below still apply. Power-up mechanics and
the larger adrenaline tune remain open in `CACHE_ROAD_COHESION_AUDIT.md`.

## Authored diagonal roadside and instrument art — September 25

Historical roadside checklist for the rejected connected scenes. Its pad,
song-bar and HUD checks still apply to the current build.

Import this pass's exact main merge SHA into Makko after CI. On the first
market, the source painting itself should show a large lower-left storefront
and tiny upper-right end; on the depot, the big end should be lower right.
Drive through each at cruise and while braking: the connected painted curb,
quieter row beneath, service pavement, walkers, parapet and streetlights
should pass together without a flat facade, stretched windows, sliding foot
line or a visible reset between background rows. Follow later alternating
left/right events as well. Reduced Motion should keep road travel.

Catch the first four inlaid road pads with keyboard and a mapped controller.
The symbol must identify Surge, Push, Brace or Refill before the button glyph
is close; that glyph must match the current mapping. The pad stays under
opaque traffic and remains on asphalt after a catch until passed. Watch a
queued phrase become active, a full four-part stack, a hit and the drums-only
return: the four lane motifs and HUD cells should agree, while road paint
never covers a hazard. Check the next-action prompt, signal/window, Echo,
Turbo, armed Push/Brace and Cache Back's mirror at normal game size. Report
the SHA, road position/bar/device, a frame for any seam or misleading cue,
and whether the added visual response actually helps the music feel dynamic.
The scripted preview and automated proof do not establish Makko audio,
physical-controller feel or owner acceptance. Power-up design remains open.

## Cache Road layered roadside and traffic — September 25

After this pass merges, import its exact main SHA into Makko. At normal game
size, drive the first market on the left: its far end should appear small by
the horizon, then its connected frontage and pavement should grow diagonally
toward the lower left. A quieter continuous building row and service street
should remain beneath it. The sidewalk seams, walkers and streetlights should
pass at the same road speed without a sliding seam. The depot on the right
around the first audit should approach toward the lower right, with the
frontage continuing after it. Check normal driving, braking, Turbo, pause and
Reduced Motion.

At the first sweeper near 465, read its amber one-lane arrow and get out of
its destination lane. At the small trike near 735, watch its cyan cut from
lane zero to one; its starting lane should open behind it. Use an Echo before
the audit near 1135 and see the painted audit sedan lock the decoy. The tall
purple shuttle near 1220 stays in its lane and can be drafted for Turbo.
Later rotated sweepers must merge inward at the right edge. Report the exact
imported SHA, device, road position and a frame for any separation, abrupt
tile edge, unclear warning or art fallback. The native seven-chapter preview
and scripted driving checks support this review but do not establish Makko
motion, sound or physical-controller feel. Music and pad balance remain for
the subsequent adrenaline playtest; the power-up list remains open.

## Cache Road visual contact — September 25

Import the exact merged revision into Makko and drive with the same speed
through a few hundred road units. The blacktop texture should stream from
the horizon toward the car without a flashing seam or repeated band edge.
Look above the city: pink and gray ships should point where they travel;
Reduced Motion should hold their positions and atlas frames. On straight
driving, both Cache Back tire shadows should touch their painted wheels while
the body moves over them. Turn both ways, use Turbo, hit once, and follow a
freight truck: the wheels should stay planted, the chassis should absorb
the larger/slower bump, and contact shadows should not lag behind. Check the
same scene at normal game size, then the enlarged comparison in
`review-cache-road-visual/Contact-Before-After.webp` and the raised outer
wheel comparison in `review-cache-road-visual/Turn-Contact-Before-After.webp`.
The later follow-up specifically grounds both turning front wheels. This is
a scripted production draw, not a Makko recording. Report the imported SHA
and a frame if the art falls back or a contact gap persists. Music, pads, inputs,
collision, saves and exit were unchanged in that pass; the subsequent
traffic/roadside review is above, with mechanics tuning still open.

## Cache Road cohesion follow-up — September 24

Import the exact merged revision for this pass. Catch the first Drive pad
near its front edge: its mint paint should keep approaching under the car
after the successful press, then leave behind it. The reward must occur once.
Watch a protected contact with Push and then Brace; while armed, the top HUD
should show the Push countdown and Brace charge without taking road space.
Check traffic still occludes pad paint and the four face actions remain
harmless on a miss. Listen through pad catches, a later hit and recovery;
the eight/sixteen-bar holds and five MP3s have not changed.

The repeated scripted routes found long four-part stretches and a full-brake
tape-end failure; tell us whether x4 feels earned, how speed choices read and
where the late traffic becomes unfair. The seven-part art/gameplay list and
power-up categories remain open in `CACHE_ROAD_COHESION_AUDIT.md`. Native
draws and production simulations are supporting evidence, not Makko play.

## Grounded Cache Road pads — September 24

Import the exact revision after CI and drive with sound and a controller.
The safe mint targets should read as small markings in the asphalt, approach
at road speed and disappear under the car; solid vehicles should cover them
where the view overlaps. There should be clear stretches between two planned
four-target runs, not a constant stream or floating overlays. In the first
run, aim for Drive at 150, Flow at 365, Undercurrent at 585 and Breakaway at
810. The HUD shows the action/button while a pad is visible, then a short
tap-on-beat cue while crossing it. Brake or accelerate to adjust arrival;
pressing off beat, using a wrong button or driving through without a press
should not cost score or life.

Catch the four parts while steering around freight, the two-lane block and
the van. The first part holds eight bars, later consecutive same-run parts
sixteen; decide whether four at once is winnable without feeling automatic.
Try the later run after the first marker too. Use Push and Brace on separate
traffic contacts; an unprotected hit should clear the earned stack, with
drums returning on beat. The all-four signal currently cannot play crew
vocals because that recording has not been supplied. Check speed rewards,
pause, retry/Continue, the final Echo exit and the unchanged four lane
names. Report the imported SHA, pad/traffic location and device, whether any
marking still crosses a car visually, and how the spacing and duration feel.
The simulation and native draw do not establish Makko audiovisual feel.

## Cache Road safe pulse prototype — September 24

Import the PR head into Makko after CI and drive the opening with a physical
controller and sound. Confirm left/right steering; up accelerates and down
brakes. The four face buttons should match their visible rings: A/Cross Surge,
B/Circle Push, X/Square Brace, Y/Triangle Refill. Left bumper spends Turbo;
right bumper sends Echo. On keyboard use K/L/J/I, Space and H respectively.
Glowing mint rings say SAFE, float above a mint road mark and pass through
without injury; red warnings, opaque vehicles and their collisions remain
visibly separate. A wrong/missed face press must not subtract points or hurt.

Follow the first five pulses by steering between lanes and tapping on their
music beats. Hear four named parts build over constant Pressure drums and see
the second consecutive catch hold eight bars. Try up at a pulse for double
score/Turbo readiness and down at a pulse for Echo refill. Use Push on traffic,
then Brace on a later hit; the next unprotected hit should remove the parts
and return on beat with drums, while another ring allows quick recovery. At
all four, FULL ADRENALINE should show; crew vocals will be silent until the
sixth aligned recording is supplied. Check pause/retry, the final Echo exit,
old saves and Level 1 return. Send back the bar, lane, button and speed for
any impossible or unclear prompt. Local tests cannot establish Makko sound
or input feel, so owner acceptance remains open.

## Cache Road art delivery repair — September 24

After this PR merges, import its exact merged SHA into Makko and start Cache
Road. Check for the yellow Cache Back car and animated tires/shocks, the
freight truck, layered city, road texture, roadside hardware, flying cars,
dirty effects and the completed face inside the rearview mirror. A hit should
show the closed-eye jolt. If the old graphics remain, capture the imported
SHA and a frame so the runtime import can be traced. Local loader checks and
published URL availability do not establish the hosted Makko result.

## Layered Cache Road art PR — September 24

Watch the integrated twelve-second scene at normal size. Look for continuous
blacktop without visible texture-band joins, distinct small distant buildings
behind the far and near city, a beat-responsive sky that changes color across
the reel, and Level 1 flying ships at different bank angles above the road.
The roadside wall should follow the bend without detached panels; the amber
service pylons should pass on both sides. On a left and right lane change,
confirm that the car's illustrated turn matches the movement. Cache Back's
face should remain the same scale but reveal more cap, eye and mask inside the
left side of the mirror, looking forward except the brief hit glance. Look at
Turbo, close pass and hit for dirty spray and soot, with no clean beam or
starburst overlay. Car and truck shocks and tire motion should still read.
The native reel establishes visual integration only; import the PR's exact
commit into Makko after merge to judge frame rate, control feel and art in
actual play. No lane, audio, traffic or save behavior was intentionally changed.

## Revised Cache Road art motion — September 24

Watch the twelve-second integrated road clip at normal game size before the
following car and freight close crops. Compare it with the saved prior
parallax study: the distant city, lower buildings, roadside deck/towers,
guardrail lamps and wet road should move at distinct depths without a visible
horizon cut. Follow a lane change to see body lean and the angled pose; watch
the rear tires stay planted and their treads move, then the truck's stronger
suspension. The hit should jolt, shed fragments and settle. These clips are
scripted production draws; check actual controller feel and frame rate in
Makko only after a reviewed PR is merged.

## Cache Road art and motion review — September 24

1. In the local production preview, verify the yellow car, rain road and
   skyline share one draw with the rearview. Check both steering poses,
   visible shock bounce, moving tire treads and the truck's stronger
   suspension movement in the close-up clips.
2. Confirm a near pass draws short streaks and a hit uses the collision pose,
   jolt and debris, then returns to the ordinary pose. The mirror glances
   back only during the stumble; ordinary driving looks ahead.
3. In a future merged Makko build, drive the first route with keyboard and
   controller and judge motion at normal size and frame rate. Scripted native
   clips are review evidence, not host acceptance.

## Current art review — Cache Back in the rearview

Inspect `review-cache-road-mirror-composite/Cache-Road-Mirror-World-Loop.webp` or the full MP4, then the six-state detail sheet in `review-cache-road-mirror/`. Cache's cap brim, glasses, eye and upper mask should be cropped by the same mirror glass that holds the moving road, with his gaze aimed toward the road rather than the viewer. Watch the eye/brow shifts for a lane choice, Turbo, close pass, hit and low signal. The rear image is decorative and should never suggest a real traffic warning. The composite uses the earlier saved road preview with the new production HUD pixels; check the layout now, then judge the complete art build after the unpublished vehicle/world source is restored. The current checkout has no PR and no Makko playtest.

## Current route — deliver the original

Import the exact merged main SHA after CI and enter Cache Road from Cache Back. The opening should say why Cache is driving: the clean copy erased names, so deliver the original recording. Keep steering while the brief guidance appears above the road; there should be no choice menu or blocked input. At the first freight, hold a lane for half a second and see the E/RB instruction replace the hold instruction. Press E/RB, then steer away; that instruction should leave, and the part should play now and carry into the next four bars. Drive toward the paired block: use an outside lane and try Space/A Turbo near it. Its button instruction should leave when the burst starts.

At the first road marker, Echo should be full even if it was spent earlier. Stay far left through the next three-wide block, press H/Y near the scan, then change lanes once past the block. Look for the audit to follow the Echo while Cache gets clear. Retry or Continue from that marker and check the Echo opportunity remains. The opening prompts should be gone after the first stretch. Test keyboard and a mapped controller, and listen to the music before/after a hit; this pass does not change the lane names, five MP3s or how parts are chosen. Continue through the 100-bar song and final Echo exit. Report imported SHA, any cue that arrives too early or late, obscured traffic, unclear controls and whether the delivery goal comes through. CI verifies code paths and layout; Makko timing, sound and feel remain owner review. The next-bar route below remains the active music rule.

## Current route — choose the next bar

Import the exact merged main SHA after CI. Center in one lane for half a second; the header should name that lane and count down to the next bar, and a light mark should appear on the road. Steer away to dodge traffic; the choice should stay, then that one part should join on the bar line and last to the current four-bar section's end. Hold a different lane before the bar line to replace the first choice. Try several lanes in one bar and confirm that only the last one joins. Choose a part for the last bar of a four-bar section, then dodge right after its beat: the part should expire at the section edge unless you hold a lane for another half second in that last bar. Across separate bars, choose different parts to build a stack; it should take deliberate bar-by-bar choices rather than one sweep. E/RB immediately keeps one lane through the current remainder and next four bars once per section.

Pass alongside traffic with a little steering drift. A recognized near miss should give a message, score and ability charge without changing the music choice. A tighter escape should charge more Zone but should not silently extend any part. A traffic hit should erase the chosen and playing parts, briefly interrupt audio, and return on beat to drums until a new choice joins or E/RB is used. Check Zone, Turbo, Echo, pause/retry, the final exit, old saves and the complete 100-bar recording. Report bar/lane, device, whether each choice was visible before its beat, pass feedback and how often x3/x4 occurred. Automated checks and CI cover mechanics and decoding; merged Makko listening and driving feel remain the owner's decision. Lane names, recordings and no-award boundary are unchanged. Earlier routes below describe superseded builds.

## Current route — driving earns the carried music

Import the exact merged main SHA from this pass. In a lane, center the car for half a second: its part should become ready and preview on a beat, but it should not appear as a four-bar road lock merely from waiting. Pass a nearby vehicle cleanly and hear that part continue until the current four-bar boundary after steering away. Make a tighter escape from a threatened lane: its part should also paint and play for the following four bars, while the cut charges Zone. Try a safe sweep through all four lanes; it should not automatically grant x4. Plan several passes, using one E/RB stamp in a four-bar section, to see if x3 and a rare x4 feel earned. A second E/RB in that section should say it is ready next section, and the next section should permit it again.

Hit a vehicle with parts playing. Listen for a brief music break that returns on a beat, then drums without the former quiet bed; the other parts should come back only from a new pass or the next available E/RB. No text should cover the road. Check that every lane part can be prepared in verse A despite softer recordings, and that Zone, Turbo, Echo, pause/retry, old checkpoints and the full 100-bar song still work. Record bar/hazard, stack before and after, device and whether the sound and driving feel responsive. Automated output and traffic routes are evidence of function, not a Makko listening verdict. Existing lane names and MP3s remain as supplied; no Bass/Level 2 award is made. The free-lock routes below are historical.

## Current route — all four lanes without an artificial gate

Import the exact merged main SHA for this correction. During intro bar 3, hold Breakaway then Undercurrent for half a second each: both should paint the upcoming verse bars 1–4 (song bars 5–8). Let the verse begin and check that both locks enter and stack; Undercurrent should be audible, while Breakaway's recording is much softer in this first half. Press E/RB in Breakaway or Undercurrent during chorus bar 28 and verify the current remainder **and** the next verse's first four bars stamp on the road. The MP3s and gain levels have not changed; an intro lane can be visually stamped during literal silence without new sounds appearing.

Continue to try a four-lane sweep, close cuts, Turbo, Echo and a hit. Report whether x4 remains trivial with the lanes working, and note the section/controller if any lane still refuses to paint or produce its recorded part. This change addresses the false gate only; it does not claim to resolve the owner's difficulty and fun feedback. Production and browser tests do not replace a Makko listening/handling check. The routes below record earlier builds and their sparse-lane claims are superseded.

## Current route — Cache Road Zone and lane stack

On this follow-up, pause with keyboard and controller to check that controls describe free hold and E/RB captures plus Zone. In chorus bars 25–28, press RB in Breakaway or Undercurrent: it should confirm the current recorded remainder only; the next verse A part is absent. At a paired gate, collide with either of its blocked vehicles and verify the adjacent vehicle does not also grant a near miss, score, Echo, Zone or Turbo. Retry normally afterward.

Import the exact new main SHA into Makko after CI merge. With an empty Zone meter, hold Flow for half a second in intro bar 3: verse bars 1–4 should print ahead on its road lane and sound when verse A begins. Hold longer: it should remain four bars. At a recorded chorus or verse B, drive among lanes to build x2–x4; their colors should stay on the actual curved pavement under traffic. Press E/RB in a lane during a four-bar section: its current remainder should sound/paint immediately, and the next aligned four bars should appear farther ahead. Tapping it again in the same lane should do nothing. Sparse parts should show their recorded arrival rather than seem randomly blocked.

Make a late cut around traffic, then lock another lane before the next four-bar boundary. The cut should charge Zone; at the boundary, expect a four-bar faster road, a 1.5-second time refund and one Zone charge even if multiple parts enter. Compare the road edge and header with Zone active. Test Space/A Turbo, H/Y Echo audit lure and final split, a hit that stumbles the audio and breaks the stack without road-covering text, pause/retry/old save, and the complete 100-bar run. Report imported SHA, section/lane, score/stack, speed/time, device, and what still feels confusing or unfun. Production, browser and native render checks support this build; only owner Makko play with audio and a physical controller can judge feel. No Bass/Level 2 award is made. The paid Cutline route below is historical.

## Current route — Cache Road Cutline

Import the exact new main SHA into Makko after its CI merge. In intro bar 3, settle in Flow: it should automatically print and arm the upcoming verse bars 1–4 for 60% ink, then enter on the verse boundary. Remaining centered for 1.5 seconds spends another 40% to paint bars 5–8. Try RB repeatedly; it should not add any locks. The small colored spans should be part of the curved pavement, advance under traffic, and reveal from far to near, with no second floating lane sheet or four large cards covering the bottom road.

For a deliberate Cutline, approach a vehicle in its lane, wait until it is close, then steer to a narrowly clear lane before contact. Look for the rising cue, road pulse, header reward, roughly +70 ink and a larger score than a passive adjacent pass; settle into another recorded lane to spend the refill automatically. Try a paired/three-lane gate both via its open route and with a late evasive move. Camp one lane while tapping RB to compare: it should not farm an x4 stack. Check whether the open routes and warnings are fair with keyboard and a physical controller, and whether x2–x4 are worth pursuing. Use Space/A Turbo to survive a difficult gate; send H/Y Echo before an audit commits, split into another lane and watch the audit chase the decoy. Test the final Echo original exit separately.

Hit traffic and confirm the brief audio stumble, stack loss and clear road without hit text. Listen for steady Pressure and beat-aligned changes across intro/verse/chorus, while pausing, retrying and using an old checkpoint. Verify the 100-bar end, Level 1 return, separate Level 3 preview and no Bass/Level 2 reward. Record imported SHA, bar and hazard, actual input device, attempts, score/stack, audible impression and any obscured or unfair frame. Production, Chromium and native frames verify code paths and layout only; owner Makko fun/controller/listening acceptance remains pending. The free-lock route below is historical.

## Current route — Cache Road phrase commit system

Import the new exact main SHA into Makko after its CI merge. In intro bar 3, settle in Flow for half a second. The road should automatically light Flow across **verse bars 1–4** (song bars 5–8) before they play; the harmony enters exactly at verse bar 1. Remain centered for 1.5 seconds total to see the same start extend through verse bar 8 for 25% carry charge, or move to Drive after the first arm. A hold previews an available current part on a beat while centered, and leaving releases only that preview. The armed lane raises STACK when its next phrase begins. Try to arm four distinct lanes before a verse B or chorus boundary, dodging traffic; the road surfaces should stay lit across full bars while vehicles remain visible above them. Breakaway/Undercurrent settled before verse A must spend nothing and show their later recorded entrance in the cards. No music-lock button is needed.

Hit traffic once with several active/armed parts. Hear the brief cut/warp and power dip, see the car/edge feedback and STACK x1, and keep an unobstructed view of the road; there should be **no collision text or central panel**. Previously earned score remains. Check free four-bar auto locks, the 25% eight-bar carry, clean-bar/near-miss recharge and whether x4 feels reachable and worth sustaining. Space/A remains Turbo; H/Y remains Echo. Listen for unwanted pumping, clicks or late entrances, especially across intro → verse A, verse A → B and chorus → next verse. Check pause, checkpoint retry, full song/final Echo exit, Level 1 and Level 3 return, old saves and no Bass/Level 2 clear. Report the imported SHA, exact bar/lane, controller and any confusing highlight or audio transition. Automated logic/Chromium/native frames establish behavior in those environments; Makko sound, timing, hazard contrast and fun remain owner review. The prior Stack the Bars route below is historical.

## Current route — Stack the Bars and collision stumble

Import the exact merged main SHA into Makko after CI. From the saved Level 1 handoff, drive into Cache Road with speakers/headphones and a physical controller. Hold Drive for about half a second and hear the catch on the next beat. In verse A, catch Flow; Breakaway and Undercurrent should announce their arrival at bar 13, then become audible from verse B. Press E/RB centered in a lane to seal four bars, move to another lane and catch its two bars. Watch the corresponding road cells and lower cards drain on the four-bar strip while SCORE and STACK climb to x2–x4. Verify E on a sparse lane spends nothing and a second seal can extend a current part. Space/A stays Turbo; H/Y remains Buffer Echo.

Drive alongside traffic for a near miss and compare its score at x1 versus a larger stack. Hit traffic once with several parts caught: expect an obvious brief pitched cut/stutter and power dip, a visual STACK BROKEN notice and x1, followed by music recovering in time. The score already earned remains. Listen for clicks, pump, clipping or lost beats during multiple hits, pauses, section changes, checkpoint retry and the complete final chorus. Check the Echo split/final exit, title and Level 1 return, separate Level 3 test, an old road save and no Bass Key/Level 2 clear. Report imported SHA, bar/lane, controller, score/stack, collision audio impression and a short clip if timing or feel is off. Production checks, real Chromium decoding/bus recovery and native captures are supporting evidence; Makko sound, balance and fun remain owner review.

## Current route — PR #102 complete Cache Road song

After the PR merges and its checks pass, import the exact main merge SHA into Makko. Enter Cache Road from the saved Level 1 handoff with sound on and a physical controller. The song should start with Pressure drums and Drive bass; Flow, Breakaway and Undercurrent become available as their recorded sections arrive. The four bands display DRIVE, FLOW, BREAKAWAY and UNDERCURRENT. Drive all four 16-bar verses and four 8-bar choruses after the four-bar intro, without a restart at section changes. Steer both ways and lock/release parts: a choice should hold to the next four-bar boundary, with Pressure continuous and normally at least three audible parts. Test pause/resume and a failed exit/retry from the fourth-verse checkpoint, then send Echo from the left and take the far-right original exit in the final chorus. Check title and Level 1 audio on return, the separate Level 3 preview, an old road save, and no Bass Key or Level 2 clear. Record the imported SHA and the exact bar/lane pair of any silence, pump, drift, clip or late finish. The crew-vocal reward has no audio asset yet. Local tests and CI establish code/decoder paths; only the owner can accept Makko sound and controller feel. The earlier four-stem routes below are historical.

## Current route — Cache Road steady mix after owner PR #100 playtest

The owner heard the #100 lane transitions in Makko and rejected the quiet/loud pumping. Import the merged revision from this follow-up, drive through all four lanes in both directions, pause between lanes, lock and release parts, then try the Echo exit and a full 187.5-second loop. Listen for a continuous beat and bass under every lane, additions/subtractions that remain noticeable, and a fourth-lane Harmony/FX combination without a hollow FX-only opening. Test normal speed, rapid steering, pause/resume and an old checkpoint. Report any time the song appears to disappear or clip. Automated checks exercise production gains and real MP3 output, but cannot certify Makko listening or musical feel.

## Current route — FX bed after confirmed Cache Road playback

The owner confirms the four real stems play in Makko on merged #98 (`ae1be4a1ee868f0307daa0e8e47f7a100a1510e1`) and reports that replacing one layer with the next sounds bad. **Merge this pass before importing it into Makko**, then listen from a fresh load of the actual new main SHA. The source pack's manifest and PR identify the exact code revision; automated PCM is supporting evidence, not a hosted listening verdict.

1. From the Level 1 handoff, drive across Bass → Drums → Harmony → FX and back, including rapid crossings. FX should remain quietly present throughout, with a faint pulse during its sparse opening. Lane four should make FX stronger. A short crossing should not flash a full intermediate part; the previous part should trail under the incoming part instead of dropping out.
2. Lock Drums or Harmony, change lanes, release it, then build three locks. Confirm the locked part persists, the full combination has room and the next-beat transitions do not sound muddy. Pause/resume and cross the 187.5-second native loop without the layers drifting.
3. Check title/Level 1 music and a return from the Level 3 architecture test. Old road checkpoints and the Echo exit should still work; this pass awards no Bass key or Level 2 clear. Record the imported SHA and any specific lane pair or song moment that still sounds rough. The future fourth instrumental and no-lane gang vocal are not included in this test.

## Current route — Cache Road remains silent after draft #97

The owner confirms the title music works but Cache Road still has no music in Makko. PR #97 merged while the next repair was prepared; review the new follow-up draft based on merge `df02c8964d34b2cfa13a5c4f6d3495395b39aba5`, with the old canvas fix retained. Enter Cache Road from the Level 1 intermission. The four real Bass/Drums/Harmony/FX parts must play, with the selected Drums band audible immediately; steer and lock bands, pause/resume, and listen across the loop. If Makko omits local MP3 files, the game tries the fixed public copies. If both fail, it must return to the intermission with **CACHE MUSIC UNAVAILABLE** and allow a retry, not drive silently or claim that synthetic audio is the owner song. Confirm title and Level 1 music still work, then check the Echo exit and controller. Keep this PR unmerged until the owner hears the actual stems in Makko.

The focused check covers real loader success, local 404 plus published recovery, total failure and retry. Chromium covers 600 canvas frames, real MP3 decoding from a host that rejects HEAD, a missing-local case, a running context and nonzero selected-lane audio output. A separate opt-in Chromium run fetched the pinned public assets directly from this workspace. These checks do not observe Makko's request/CSP or speakers. If the host still fails, its visible error and `[audio-load]` console line identify the failed source for the next correction.

## Current route — PR #96 playback and canvas correction

The PR #96 Makko run **failed**: the stems did not play and the host reported a canvas context creation limit. #96 then merged; import this new follow-up draft head into a fresh Makko preview and confirm the canvas error stays absent during several minutes of Cache Road driving, lane changes, pause/resume, and retry. The context fix also covers the Level 3 preview and difficulty selector; briefly open those routes.

At the Level 1 handoff, enter Cache's road and confirm the actual Bass, Drums, Harmony and FX parts are audible one by one. Lock a part, change lanes, and hear the combined mix. If any part remains silent or the audio-fallback warning appears, capture the request status for `assets/audio/cache-*.mp3` and the console's `[asset-load]` line; report whether the host's GET returned an MP3. Continue the Echo exit and 187.5-second loop checks in the route below, using a physical controller. Record the imported commit SHA, host/browser, PASS/FAIL and a short clip or console output if it still fails. Keep the PR unmerged until this specific failure and the road feel pass in Makko.

The production Chromium check used a local host that rejects HEAD: four GETs decoded the shipped MP3s, the mix raised the selected lane to 0.62, and 600 guarded road frames needed one context request. Full repository and syntax checks are recorded for the tested revision. This establishes a browser code path, not Makko's asset delivery or actual audible output.

## Current route — Cache Line MP3 stems and exit retry

Import the exact draft head into a duplicate Makko preview. From the Level 1 handoff, enter Cache's road with headphones/speakers and a physical controller.

1. Confirm a reasonable first load for four MP3 parts (about 15 MB total) with no audio fallback warning. Steer across Bass, Drums, Harmony and FX and listen for each distinct part. Lock three, switch to the fourth, release and relock; the mix should change on a beat without a playback restart. Pause/resume and listen past the complete 187.5-second loop seam for silence, drift or a click. Check whether levels and roles make musical sense; the grid and gains are provisional.
2. Reach the Mirror Viaduct. Miss the original exit without Echo and once from a wrong lane; the car should stop at a named result, not jump backward while driving. Press Enter/A to retry from the saved marker. Send Echo at the final cue from a left band, steer right and confirm the split reaches **ORIGINAL TAPE DELIVERED** while music keeps playing. Try one failure/retry and Continue Saved.
3. Exit to Level 1 and confirm Voice/music return once. Open the separate Level 3 architecture test. Verify there is no Bass key, Level 2 completion, result or lore award. Report exact imported SHA, device/browser/controller, load seconds, solo/full-mix and loop impression, Echo outcome and PASS/FAIL before merge.

Automated checks cover MP3 presence, equal decoded frame counts in FFmpeg, parallel source preparation, synchronized start, game state and save boundaries; they cannot establish browser decoder gapless behavior, Makko sound, host load speed or controller feel. Keep the draft unmerged until owner listening/play review. The former route below describes the initial correction with temporary audio.

## Historical route — initial Cache Line missed-exit retry correction

Use the exact review commit on the new draft, based on merged #95 `2cd9d40a44b6c91abc36c3d6d40a766dc9879c0f`. Complete Level 1 or use its DEV skip and enter Cache's road in Makko.

1. Reach the Mirror Viaduct. Drive into the marked original exit without Echo, then with Echo but in the wrong lane. In both cases, the car should stop at **ORIGINAL EXIT MISSED** with a specific cause. The road position must never jump backward while you are still driving. Enter/A explicitly returns to the saved Mirror Viaduct marker with a full Echo and time to try again. Check pointer/keyboard and a physical controller.
2. When the exit cue appears, send H/Y Echo from a left band, steer Cache to the far-right marked route and keep the replay apart. At normal cruise, the Echo should remain visible through the scanner; the result should reach **ORIGINAL TAPE DELIVERED** without a forced music mix. Test a timed-out and three-hit retry as well as pause/Continue Saved.
3. Listen to the unchanged five temporary aligned parts while steering and locking bands. Confirm #95 handling/traffic warnings are still fair, Level 1 Voice and audio return once, the separate Level 3 architecture test remains, and no Bass key or Level 2 clear/result/lore appears. The owner is gathering the authored tracks; this patch does not integrate them.

Record imported SHA, device/browser/controller, PASS/FAIL, the position/timing around the exit and whether the split feels legible. Automated simulation and five local Canvas stills cannot establish Makko timing, audible quality or fun. Keep this draft unmerged until the owner reviews the feel. The older #95 route below is historical and its automatic-loop expectation is superseded.

## Historical route — Cache Line visibility and pace review (merged #95)

Import the exact draft head from its receipt into a duplicate Makko project. Base/rollback is merged #94, `0852ff0bf23d5ae52816f59f7131db93c0741777`. Complete Level 1 or use its DEV skip, then enter Cache's road. This is the owner's follow-up on the rough/slow first chase; it remains a provisional slice.

1. Drive the first Rainline stretch at cruise, brake around traffic, draft a freight car and use turbo. Judge whether speed looks and feels fast without hiding the bend or near-miss line. Inspect the differently shaped freight, van, sweeper, audit, roadblock and Cache car at actual game scale; report any warning that is still late or ambiguous.
2. Cross the Service Loop and Mirror Viaduct. Read speed, remaining window, integrity, Echo/lock meters and live versus locked bands without looking away from a hazard too long. Check the projected merge arrow, audit lock, Clean Copy target and far-right original exit with Echo visible. Wrong gate still loops/refills, collision still costs speed/time/signal, and reduced-motion setting should omit peripheral speed streaks without removing core warnings.
3. Try keyboard and physical controller, pause/resume, retry and Continue Prototype at a marker. Listen to the unchanged five temporary synchronized parts and verify Level 1 return/Voice plus the separate Level 3 test. No Bass key or Level 2 clear/result/lore is awarded.

Record imported SHA, device/browser/controller, whether the pace is fun, specific unreadable frames or maneuvers, and a short clip if possible. The four updated native frames and automated harness demonstrate layout and logic only; they cannot establish Makko timing, physical input or fun. Keep the draft unmerged pending owner review. The earlier chase route below remains as historical detail.

## Historical route — Original Master chase slice (merged #94)

Import the exact new draft head into Makko. Complete Level 1 or use the DEV completion shortcut and enter The Cache Line from Cache's handoff. The slice is **not accepted gameplay** until the owner tests feel on the hosted build and physical controller; `CACHE_LINE_BLUEPRINT.md` is the target and `CACHE_LINE_CHASE_SLICE.md` records what was actually built.

1. Steer continuously with Left/Right or stick. Hold Down/S to brake, release to accelerate through a curve. Draft a freight vehicle, cut past it for a near miss, then spend Space/A turbo. Check visible sweeper merge, audit target and three-hit/speed/time consequence. Check whether warnings and handling are fair at actual scale.
2. E/RB locks the current musical part if the lock meter is charged. Move to the next band and earn two more locks through clean passes, freight draft or fast cornering. With three held and the fourth active, hear all four aligned parts. Releasing a part and reaching the finish with a sparse mix should stay sparse. Listen on headphones/speakers over several 16-second seams, while paused/resumed, and with general Dynamic music Off.
3. From the boss road marker, watch the Clean Copy commit to a marked line and dodge it. H/Y sends Buffer Echo. Make the visible copy continue left while Cache takes the marked original/right exit. Confirm the rival targets the decoy, and test the wrong gate once: the short loop should explain the split and refill Echo. Run out of time or integrity; retry from the last marker with time and Echo to practice.
4. Reload Continue Prototype from a road marker; exit via pause or the result and confirm Level 1's Voice, handoff and music return once. The separate Level 3 architecture test and old checkpoint still work. The result must say delivered/unverified but grant no Bass Key, Level 2 completion/result, future lore or repeated Voice award.

Record imported SHA, browser and input device, how many attempts, audible mix impression, car/road/hazard readability, whether the Echo gate is understandable and whether the race is fun enough to develop. Native captures in `review-cache-line/` and automated tests support logic/layout only. New soundtrack, art, cutscenes, proper boss phases and community cameos remain design/production work. Keep the draft unmerged pending the owner's play review.

## Historical first lane-runner route

## Current route — Cache Back lane-music road proof

Import the draft branch head in Makko. Complete Level 1 (the DEV completion shortcut is acceptable for reaching this handoff). Enter/click/A opens The Cache Line; key 3/click the second row/Y opens only the old Level 3 architecture test. On the road, left/right or stick changes lanes immediately. E or mapped Inspect/RB locks a part; move, lock a second, then lock a third and confirm the oldest drops. Press the same lock control again to release. Listen on headphones and speakers for each of the four distinct parts, a continuous quiet bed, a smooth next-beat transition, no restart at the 16-second phrase seam and a combined delivery section. Pause/resume and toggle general Dynamic music Off; the road's lane mix should still respond.

Check traffic anticipation, three-hit integrity, Space/A dash and adjacent near-miss refill. The far-right original gate should advance; another lane should loop back with an explanation. Fail and retry the last saved marker. Reload and Continue Prototype from a road marker and after proof clear. Exit preview via pause or C/Y on the result card and confirm the same Level 1 Voice/handoff/song returns, with no Bass key, Level 2 result or repeated Voice award. Reopen the separate Level 3 test and its old checkpoint. Record imported SHA, device/browser, audible impression, legibility, difficulty, PASS/FAIL and any proposed changes. Automated checks and a local Canvas raster do not establish Makko/controller/listening acceptance; do not merge on those alone.

## Historical September 23 story review

**September 23 owner review:** PR #91 merged the transmitter preview into main; the owner subsequently rejected its fun/depth as the campaign direction. Do not use the older acceptance route below to infer gameplay approval for Mac's Level 3. `CAMPAIGN_REDESIGN.md` is the new story/genre direction. The preview and DEV shortcuts merged through #91 are technical routes and grant no Drums or Level 3 clear. This documentation pass does not change runtime and has no hosted gameplay acceptance claim.

## Historical Broadcast Slum transmitter architecture preview route

Use the exact draft head in the generated receipt. Base/rollback is merged #90, `568c646a3f67cf4ebca4faebd81752534c67ee6f`. This is a contained Level 3 architecture proof, not the authored campaign level; The Cache Line remains Level 2.

1. From the saved Cache Back handoff, traverse the relays. Shoot a shield unit from the front, then during its bright charge or from behind; climb to fire at a hovering interceptor. The threats should demand different responses. Review the tighter camera and signage for visual readability.
2. Use DEV 3 → **Go Transmitter** to test the boss independently. Break the upper and lower feeds from different heights. Fire into the protected core, then use the recovery window after a warned floor sweep, angled fan and fixed column. At half health, verify the faster cycle and marked interceptor. Defeat it and walk to the uplink; only then does the preview clear.
3. Take a hit and lose at the boss, then replay from `proof-boss`. Pause during a warning, exit to Cache Back, reload Continue Saved and return. Check audio resumes once, Voice survives, and Drums/Level 3 completion remain absent. An earlier version-1 `proof-clear` should say **EARLIER PREVIEW CLEARED** and offer replay instead of claiming the new boss was beaten.
4. Try `DEBUG.level3.completeProof()` and its button only as a skip control. Confirm it writes a preview clear without a campaign reward. Record exact imported SHA, keyboard/physical-controller/browser, PASS/FAIL and short clips of the three warnings, phase shift and checkpoint reload. Native captures and automated tests do not substitute for hosted Makko feel or listening acceptance. This route belongs to a merged technical preview; the owner rejected its gameplay feel as a final stage.

## Level 1 skip and Level 3 DEV menu — prior hosted review

Import the exact new draft head from the generated receipt into a duplicate Makko preview. Base/rollback is merged #89, `c0d061407378831ae90fcac49985a29c3c5ea037`.

1. Start a fresh Level 1 test. Click the lower-left DEV launcher or press Shift+F1; select **Complete Level 1**. Also try `DEBUG.level1.completeLevel()` after unlock. Confirm one Cache Back handoff with Voice/Level 1 completion and no artificial bonus, best result or difficulty challenge. Reload and Continue Saved; the handoff should persist. A normal played clear should still record its ordinary result/challenge.
2. Enter Broadcast Slum. Click DEV 3 or press Shift+F1, including in fullscreen. Use Go Relay 2, Break Current Node, Disable Current Relay, Refill Signal after damage, Give Scatter, Clear Defenders and Reset Preview. Check the saved checkpoint after a relay jump/disable, then reload; a node-only bypass should reset until the relay clears. Test the console command `DEBUG.level3.completeProof()` after unlock and the matching **Complete Preview** button. The existing clear/replay/return card should appear, while Voice remains and Drums/Level 3 campaign completion stay absent.
3. Pause with a warning active: the pause menu should keep input, then normal movement/fire should return on resume. Exit preview and confirm the Level 1 handoff and music return once. Record imported SHA, keyboard/controller/browser, PASS/FAIL and a short DEV/clear/reload clip. Automated checks and seven native captures support implementation; host audio/physical-controller/feel acceptance remains with the owner. Keep this draft unmerged pending that review. After merge, import the new main SHA and repeat; retain #89 for rollback.

## Broadcast Slum combat follow-up — historical hosted route

Import the exact draft head from the generated receipt into a duplicate Makko preview. Base/rollback is merged #88, `b32a67831acc296c1cb1887ad579bbc04ac44cb1`. The owner found the first proof functional but too easy and basic. `BROADCAST_SLUM_PROOF.md` describes the revised provisional route; The Cache Line remains Level 2 in story order.

1. For fast access, start Level 1 and click DEV at the lower left or press Shift+F1, then **Complete Level 1** (`DEBUG.level1.completeLevel()` after unlock). Confirm Cache Back opens and Voice is saved without a best result/bonus/challenge record. Enter the preview by keyboard, controller and pointer. Try to shoot the first relay from the street: its shield should spark and point to the roof node. Jump to the roof, take the temporary scatter pickup, break the node, then hit the exposed core. Check movement and fire remain immediate, and the three-way shot ends after its timer.
2. At the first counter threshold, read the warning. If on the roof, the orange marked shot should require a jump or a move off the platform; from the street, jump the two pink lanes. Respond to the telegraphed runner behind. Compare elevated gunner aim, street patrol and runner pursuit while crossing to relay two. Check the second roof node and its tougher core; time at least one ordinary phrase volley with audible music. Report difficulty and fairness, including damage sources and attempts.
3. Click DEV 3 or press Shift+F1 in the preview. Try Go Relay 2, Break Current Node, Refill Signal, Give Scatter, Disable Current Relay, Clear Defenders, Reset Preview and Complete Preview; the console clear is `DEBUG.level3.completeProof()` after unlock. Check the menu in fullscreen, close it, pause during a warning, resume, clear relay one, reload and Continue Prototype. Its node and core stay off; health, enemies and pickup for the next objective reset. Exit preview and confirm Cache Back and Level 1 music return once. Clear/replay the proof: Voice persists and no Drums key, Level 3 completion or later scene appears.
4. Record imported SHA, device/controller, PASS/FAIL by step and short shield/counter/reload clips. Seven native screens and the automated suite support implementation; hosted sound, physical input and feel require owner review. Keep the draft unmerged pending that acceptance. After merge, import the actual new main SHA and repeat this focused route; retain #88 for rollback.

## Broadcast Slum first proof — historical route

Import the exact draft head from the generated receipt into a duplicate Makko preview. Base/rollback: merged #86, `50aae91fea5f63a876d75a97bd67f86a539a961f`. `BROADCAST_SLUM_PROOF.md` describes the production-order preview and the later Level 2 story route.

1. Complete or Continue a saved Level 1 clear. Open Cache Back's handoff, then enter the preview with Enter, controller confirm and pointer. Check the two relay gates, defender warnings, jump/fire input, camera and uplink clear; the player never waits for a beat to move or shoot.
2. Listen through two phrase volleys. The pink lanes warn before launching from the active relay. Jump from relay range during the warning to clear both lanes. Pause during one warning, resume and compare what you hear and see. If the audio-fallback notice appears, record it: phrase/audio acceptance remains open on that host.
3. Clear the first relay, reload and Continue Prototype. Confirm checkpoint reconstruction and that the second relay still blocks. Pause and choose Exit preview; the Cache Back handoff and Level 1 music should return once. Replay and clear the proof; the earned Voice key remains and no Drums key/Level 3 completion is recorded.
4. Record imported SHA, device/controller, PASS/FAIL for each route, and a warning/reload clip. `npm test` and four native production-draw captures support implementation; hosted audio loading, physical input and feel require this review. Keep the draft unmerged pending owner acceptance. After merge, import the actual new main SHA and repeat the focused route, retaining the #86 import for rollback.

## Hack and Rhythm Mode presence — current route

Use the exact draft head in the receipt in a duplicate Makko preview. Base/rollback: merged #85, `62b44f7cf5446b38bec18746411587327cedb142`. Read MODE_POWER_PASS.md and review assets/review/mode-power.

1. Hack a nearby enemy with traffic in view. Check the cold scene, entry pulse, palm/uplink pose, slower world and readable terminal. Allow one hit: the guard arc/gesture/sound should react once without hiding the keypad. Cancel, fail and succeed; verify normal scene/traffic speed returns each time. Input and gesture remain real-time; movement resumes on exit.
2. Repeat against a boss support drone. Listen for the established hack music treatment, then the boss arrangement returning. Build Rhythm Mode combos with real contacts: floor waves, equalizer field and perfect hits should feel stronger while enemy warnings and the true range remain readable.
3. Toggle Reduced Motion, Flashes Off, SFX mute and Dynamic Music Off. Pause/resume and retry mid-mode. Listen across two complete loops with the physical controller on the target device. Briefly recheck the elevator and objective recovery.
4. Record imported SHA, device/controller, PASS/FAIL and a short clip. Existing AGENTS.md requires owner Makko/controller acceptance before assistant merge. After acceptance/merge, import the actual main merge SHA, fresh-load and repeat these checks; retain the base import for rollback. Native staged visuals and Chromium PCM are supplementary evidence.

## Final playtest follow-up — current route

Import the exact draft head from the generated receipt into a duplicate Makko project. Base/rollback: merged #84, `bbd95ba821b99a1268e1dc563d7027fdbf12dc08`. This route supersedes older active-hack movement/fade requirements; dialogue motion remains intact.

1. On the title, open Settings with pointer, O and a physical controller's X/Square. Change volumes/effects, reduced motion, controller labels/bindings and calibration; return without starting gameplay. Reopen/reload to confirm saved preferences. Toggle fullscreen in settings and pause, including a denied embedded request, resize and windowed play. Confirm no lost focus or extra music start.
2. Hack in a crowded street, inside/near the lift and on rooftops. The terminal must stay opaque, fixed and clickable while the player/enemies remain visible in the live view. Test scan, answer, wrong answer, keypad/controller, guard hit, cancel, pause and resume. Traffic cues must remain inside the live view. Returning to play restores the normal camera presentation.
3. Start with objective recovery. Finish an encounter, die in the next, retry and reload/Continue Saved: resume the saved objective with full health, original difficulty/rules, checkpoint score/resources, and recorded retry. Repeat at jammer and boss. Start Full Run, die after progress and reload: resume the first encounter with a fresh score/attempt, not the old boss checkpoint. Complete both modes and inspect the 500-point Full Run difference; repeat practice to confirm no duplicate rewards.
4. Damage the jammer in four-hit groups. Each relay break shields it, fixes a warning at the player's position and spawns a bounded guard. Exit Rhythm Mode, leave the marked column, deal with or hijack the guard and reengage. Staying in the discharge should cause one hit. Repeat Relaxed/Standard/Overclocked; confirm the final cinematic and next checkpoint.
5. Fight the boss past 6 HP (4 on Relaxed). Smaller recolored support drones appear with finite warnings and no homing; movement, hacking and stomps remain counters. Try camping in Rhythm Mode and varying elevation. Confirm caps, victory cleanup and a clean retry. Assess repetition/difficulty by feel, especially Relaxed fairness and Overclocked pressure.
6. Read/move through the tutorial and objectives. After a box settles for a while, obstruct it and then clear its old position: it should return gently only after sustained clearance. Keep all existing unread-message, crowd and reduced-motion protections. Briefly recheck lift exits/rides, prompt alignment, pause/restart, music loops and the completion/intermission.

Record exact SHA, device/browser/controller, PASS/FAIL and short clips. Existing AGENTS.md requires owner Makko/physical-controller acceptance before assistant merge. Once accepted and merged, import the actual main merge SHA, fresh-load and repeat title/settings, crowded hack, checkpoint/death, jammer, boss and music smoke checks. Keep the base import for rollback. Automated/native/Chromium evidence is not hosted acceptance.

## Control alignment and finishing — current route

Use the exact draft head from the receipt in a duplicate Makko project. Base/rollback is merged #83, `c5be7a9ac1c2a1ef6609ce69e5714a5c9f8b2698`.

1. Check H, Xbox Y, PlayStation triangle and a remapped shoulder button on their backings above street/roof enemies, through camera zoom and lift movement. Confirm ally/reboot/release labels and that the indicated button performs the action.
2. Check objective control badges, both hack keypad shapes, Begin Level, and campaign return help. Prompts must stay centered and legible; buttons retain their click areas.
3. Walk/jump through tutorial and hack-target overlaps. Panels should keep their earlier glide/dissolve/crowd behavior, preserve unread text, and never accept a keypad press at an old position. Pause/resume and retry; briefly recheck boss completion, elevator exits and #83 music.
4. Record imported SHA, controller/device/browser, PASS/FAIL, and a short prompt/panel clip. Automated/native evidence does not establish physical-controller or Makko acceptance. After acceptance and merge, import the actual main merge commit, fresh-load and repeat this route; retain the base import for rollback.

## Audible music correction — current route

Use the exact draft head from the receipt in Makko. Base/rollback is merged #82, `a0f9e79356210b0966f0a9d04113094b52b8e568`. The names of the files do not describe their instruments.

1. Pause → Dynamic music OFF gives the original mix. Turn ON and resume. Approach combat, enter Rhythm Mode, then hack a target: hacking should clearly pull down the low bass and darken the midrange. Exiting restores the fuller arrangement on a beat. Compare both headphones and the normal speakers used for the game.
2. Stay in normal combat/rhythm for several phrases: a short two-beat pullback should return cleanly, with the foundation steady. Combo/hack echoes should be audible without obscuring warning sounds. Compare the supplied identical-excerpt A/B render: it is evidence of the graph, not a hosted-device recording.
3. Listen across two full 3:31 loop boundaries, pause/resume, boss retry and saved checkpoint resume. Source alignment, rhythm judgment and existing loop behavior must match the base. Off must remove the new treatment and preserve the original exploration/combat/rhythm mixes.
4. Briefly recheck the boss slam/counters, campaign completion and elevator exits. Record SHA, device, ON/OFF impression and PASS/FAIL. After listening acceptance and merge, import the resulting main merge commit and repeat this route; retain the base import for rollback.

## Boss/music/campaign review route — current

Use the exact draft head from the receipt in a duplicate Makko project. Base/rollback: merged #81, `a75f33f2321a9e96f3a8fa7677dbf61e586bdb1e`. Automated tests preserve scheduling but do not certify audible sync or gameplay feel.

1. Compare Dynamic music ON/OFF in Pause. Listen through at least two full 3:31 restart boundaries; verify original beat alignment, no new clicks/gaps, no doubled stems, and clear foundation timing. Exercise pause/resume, hacking, rhythm entry/exit and boss retry. Report any difference against the base, not merely an existing artifact.
2. Fight Standard, then Overclocked: learn the pulse, double pulse and fixed marked slam. Moving out of the column avoids its damage; staying inside takes at most one hit. Counter cues match real availability. Verify rhythm and stomp routes at street/roof height, traffic and full lift rides.
3. Complete an encounter, enter the next, reload and use Continue Saved (C / Triangle / Y / pointer). Confirm the checkpoint start, selected difficulty, earlier kills, score/lore/Amp/sky caches and single music start. Repeat at Jammer and boss starts. Check keyboard and a physical controller.
4. Win: inspect real results and the clear bonus. Use Continue Broadcast for the Voice key/Cache Back handoff; reopen and Continue Saved into it. Confirm Level 2 is honestly upcoming. Rematch for practice and confirm no repeat campaign bonus/key or replacement of full-run bests. Full restart remains available.
5. Recheck reduced effects, warnings with busy music, smart tutorial/hack panels, elevator exits and original traffic. Existing intro/title/new-game path must still work. Do not substitute native captures for this hosted route.

After owner acceptance and merge: import/redeploy the actual main merge commit into Makko, reopen from a fresh load and repeat the music loop, boss, checkpoint/terminal resume and elevator smoke routes. Keep the base import available for rollback.

## September 17 — enemy elevator exits

Review the exact head in the generated receipt. Base/rollback: merged #80, `f2fb5dccf7473f8584fcd3bf25847780c35a37b3`. Makko/controller acceptance remains pending.

1. Revisit the screenshot situation with enemies inside the grounded cabin. Stand to its right, then left: Firewall, Corrupted and ordinary virus enemies should pursue out of the cabin. Walk through it with a group approaching; they must not bunch at its edges.
2. Ride up and back down with enemies. At street level they can leave; at the top they can walk onto the aligned left rooftop and back aboard. An exposed elevated edge still stops ordinary walkers. Verify no player ejection, floor gaps or sideways jolts.
3. Check player/enemy contact at both grounded cabin edges, including during hack/recovery. The enemy can separate onto the street without snapping back or shoving a stationary player. Smoke-check recharge, deliberate player drop, smart boxes, car warnings and restart.

Post-merge deployment: import the actual new main merge SHA into a fresh Makko preview and repeat 1–3. Record revision/device, PASS/FAIL for each route, and clips of enemies leaving both sides plus one complete occupied ride. Re-import the base above to roll back. Automated/native adapter evidence does not establish hosted/controller acceptance.

## September 17 — elevator passengers, removed platform and relevant WATCH OUT

Import the exact draft head from the generated receipt. Base/rollback: merged #79, `318f024c1e1c6bb38f479b7e4842c894074c5ed4`. Makko and physical-controller acceptance are pending.

1. Charge twice from the left, center and right of the cabin. Stay aboard through ascent, the top stop, five-second expiry and complete descent. Expect steady feet and no sideways shove or rooftop stealing support. Repeat with a roof enemy and check front-rail depth.
2. At the top walk left onto the rooftop; remain there as the lift returns. Walk back aboard at the aligned stop and ride down. Jump inside during descent. Try exiting beside the canopy: wait at the edge until clear. Use Down + Jump to deliberately drop. Recharge during descent, pause mid-ride and restart.
3. Check the circled spot below the Firewall canopy: no low platform, invisible landing or underside bonk. The higher Firewall step uses its gold design and existing hangers. Traverse that upper route and nearby solid awnings.
4. Check car approaches from both sides while in their rooftop danger lane: cue stays at the edge/car altitude and ends on first visible artwork. Leave the lane: it clears. High traffic does not warn a street player. Jump, fall or ride toward a lane: anticipate nearby danger. With the flight line clipped/offscreen, the label must not drop below the HUD to stay visible. Speed and damage remain normal.
5. Keep dialogue unread while walking/jumping, then use rhythm/hack to confirm #79 smart placement. Do a quick boss win/loss/retry and restart smoke check for shared lifecycle changes.

Normal post-merge deployment: after owner acceptance and merge, read the actual new main merge SHA, import it into a fresh Makko preview, and repeat steps 1–5. Record imported SHA, device/input, PASS/FAIL per step, a full lift-cycle clip with both stops, the cleared-platform screenshot, and danger/safe approaches from both sides. Native captures do not prove hosted/controller acceptance. Re-import the base above if rollback is needed.

## September 17 — smart boxes correction

Review the draft head from the generated receipt. Base/rollback: `ec89e7468a6f79bcafcaea8b07d3c75ab37a3cf9` (merged #78). The previous movement-hide rule is rejected.

1. Leave a crew line unread. Walk, jump and enter Rhythm Combat: the full line stays when clear. Cross its area with an actor: it slides to safety, fades during the crossing and recovers. The beat lane stays clear. Stop: a safe panel should remain parked.
2. Climb the Signal awning during Stomp practice. Check the compact task and street enemies with the raised camera. Return to story; all twenty bubbles and earned actions remain. Test keyboard Space and actual PlayStation/Xbox Continue.
3. Collect lore and inspect while moving/jumping. They keep text and relocate. Studio Rat still finishes before inspection and queued lore. Crowding may produce a held-message tab; it reopens after a stable opening. No unseen Continue or expired story.
4. Hack targets on both sides and rooftops among other enemies. Check full/compact keypad and target/player visibility through relocation. Moving keys reject stale pointer clicks. After settling, test digits, D-pad, Erase, Submit and Cancel. An unreadable terminal freezes scan/deadline/input; Escape/controller Cancel remains available, and the visible held tab supports tap-to-exit.
5. Pause mid-transition, resume, restart, and enable reduced motion. Pause freezes motion; restart clears layouts; reduced motion places directly. Ride/walk under the elevator once to confirm retained front-rail depth.

Post-merge deployment: import the actual merged main revision into a fresh Makko preview, then repeat steps 1–5. Record the imported SHA, device and a short clip of panel plus actor for remaining issues. Hosted/physical-controller acceptance is pending.

## September 17 — smart panels and front rails

Import the exact draft head from the generated receipt. Base/rollback: merged #77, `78f67f4750a2d12f8a2063c895d06d5b9952d700`. Owner Makko/physical-controller acceptance is pending.

1. Read a crew line, then move/jump before acknowledging it. The large dialogue disappears and any remaining task uses a compact clear corner. Stop and land: unread text returns at its previous position. Hidden Continue must not skip it, and a hidden closing message must not expire.
2. During Stomp practice, climb the Signal awning and jump. Keep the three street enemies visible below the raised camera; only the compact task remains. Repeat in Rhythm Combat and complete the original twenty-bubble tutorial without repeating earned tasks.
3. Collect lore or inspect while enemies are visible. Move/jump/enter Rhythm Combat: unread panels must wait, then return without losing a line or reading time. Only one reading panel should own the instruction area. Mission objectives and other transient prompts must leave actors clear.
4. Hack enemies on both sides, on street and rooftops, at normal and changed zoom. The terminal must leave the locked enemy and player visible, stay steady while clear, and move when the target/camera enters its area. Check keyboard, controller and pointer digits, Erase, Submit and Cancel after relocation; check success/failure placement too. In crowded scenes, check the shorter six-column keypad, its D-pad row navigation, pointer Erase/Submit and Cancel.
5. Walk hero and enemies onto the grounded lift; ride the floor and roof, and jump/walk under a raised cabin. Front rails must cover cabin passengers, while the back and fixed drive remain behind them. Roof riders remain on top; the whole raised cabin can obscure actors underneath. Check both directions, edge crossings, five-second power, recharge, drops and enemy pancakes.

Native stills and production-module checks support these cases; they do not establish hosted gameplay feel or owner acceptance. After owner acceptance and merge, import the actual merged main revision and repeat this route.

## September 17 — combined playtest follow-up

Import the exact new draft head from the receipt. Base/rollback is merged #76, `ee089acce1ee9dad6ffd877fe32f99dd633aa011`. Owner Makko/physical-controller acceptance is pending; local/native/CI checks do not replace it.

1. Read the opening slowly, then acknowledge coaching. Dialogue gives way to one bottom action prompt. Earn movement/jump early and confirm unread story survives. Check that Create/View is clearly a button in the Continue sentence, with no second Objectives card. Read through the terminal, success/failure and returned story.
2. Inspect the Studio Rat while a lore notice is active. Watch the full pounce and enemy drag without either dialogue covering it. Inspection appears afterward; lore follows after inspection closes or expires. Hidden Continue/inspect must not skip unseen text.
3. Hack beside moving viruses/Firewall enemies. Check the slightly deeper, gently pulsing slowdown and tracer afterimages. Pause/resume, cancel, solve, fail and restart; trails must freeze or clear appropriately. Compare reduced motion/flashes. Puzzle controls/timing, music and the twelve-second ally remain steady.
4. Use deliberate Down + Jump on solid awnings, ordinary roofs/steps, the lift floor and its roof. Land on the next lower support and release/repress to descend again. Check closely stacked platforms and normal upward/side bonks. Light diagonal stick input must still jump normally.
5. Walk the hero and enemies across the cabin at its ground stop; both appear on it. Ride floor/roof upward and down. Walk/jump underneath the raised cabin; its moving front can cover actors below, while the stationary rear drive cannot. Check the transitions once per actor, then the existing five-second power/recharge and enemy pancakes.

After owner acceptance and merge, import the actual new main SHA and repeat the focused route. Earlier routes below are historical.

## September 17 — Finish The Job combined review

Import the exact draft head from the generated receipt into a fresh Makko preview. Base/rollback is merged #75, `48ec019a6037a3bf3910614eb5bae3c0c58d4130`. `FINISH_THE_JOB_RECOVERY.md` is the current scope and evidence record; conflicting older routes below are historical.

1. Start the tutorial and jump/move before the opening dialogue finishes, in either order. Both actions retain credit and unread story remains. Read slowly at the stomp briefing: the three enemies appear only after acknowledging that instruction, once. Complete training without adding mission kills.
2. Earn five rhythm hits before the coaching catches up, then miss. The achievement remains and the lesson requires deliberate stance exit. Open the hack early; check Read/Input/failure/success captions, retry without losing progress, and return to unread story. Final Continue starts the mission without a compulsory wait. Check keyboard and actual PlayStation/Xbox bindings.
3. Inspect the nine small platforms: three facade designs and two opposite side braces, with hangers reaching roofs where required. Check the single terminal beside the awning and clear of the doorway. Watch its painted waveform for five seconds, then compare reduced flashes.
4. Launch the lift with two rhythm hits. It returns five active seconds after the last accepted charge even while occupied; recharge aboard, at the roof seam and during descent. Pause freezes the countdown. Ride the roof/cabin and step onto the fixed canopy/roof without clipping or being dragged down.
5. Check side/upward contact and top landings on all five awnings with the player/enemies. Ordinary roofs/steps remain one-way, with two circled step bonks. Lure the boss up/down the route and across the street: his body fits beneath the street awnings, he clears edges on upper routes, and his existing warned pulses still reach. Confirm no repeated leap/landing loop, then win and retry. Enemy roof visibility, pancakes and deliberate drops remain.
6. Take damage, reach low health, collect a repair and build a rhythm streak. Inspect the six appropriate portrait reactions and hear the light digital pickup chime at the current SFX volume. Perfect/excellent/missed inputs should color the corresponding lane beat, including with saved calibration; leaving/restarting clears stale feedback.

Production-module/native checks do not establish hosted Makko behavior, physical-controller feel or sound quality. Owner acceptance is pending; keep the draft unmerged. After acceptance and merge, import the actual new main merge SHA and repeat the focused route.

## September 17 continuation — focused owner review

Import the draft's exact published head into a fresh Makko preview. This is pending hosted acceptance.

- Jump through unmarked decks and land on them normally; retain only the four circled static bonks and the solid elevator roof. Decorative supports add no collisions.
- Inspect all nine small platforms: wall plates/side braces or upper hangers visibly meet masonry; no dangling outer leg.
- Check the single box beside the first striped awning, clear of the left doorway; jump from it onto the awning. Watch its screen for at least five seconds. Reduced flashes keeps it still.
- Launch the lift with two rhythm hits. It returns five seconds after the last accepted hit with or without passengers; add a hit while aboard to renew it. Check the shared rooftop seam and one-hit reversal during return. Pause consumes no charge.
- Walk off onto the roof and confirm the returning lift does not pull the player through the fixed rooftop. Roof enemy rendering, pancakes, deliberate drop input and victory protection remain.

Exact base and implementation/asset limits: `PLATFORM_MOUNTS_CHARGE_PASS.md`. The missing three proposed replacement platform images still need recovery; current decks are preserved.

## Current correction — enemies visibly stand on the elevator roof

Import the exact review SHA from the manifest/PR. Observe a corrupted enemy, virus, Firewall and drone on the rising and returning roof. Feet must remain visible on the deck; approaching/leaving the edge must not flip their depth. Verify the player can ride inside and stand on the roof. Preserve only the four approved static bonks and normal upward platform routes. `ELEVATOR_ROOF_DEPTH_FIX.md` records the cause and native previews.

Focused production tests and native canvas evidence do not establish owner Makko acceptance. Keep the draft unmerged for that review. `TUTORIAL_FLOW_PROPOSAL.md` is an accompanying recommendation, not a changed tutorial or an accepted script.

## Current correction — only the four circled static objects bonk

Use the photo mapping in `CIRCLED_BONK_CORRECTION.md`. Import the exact review revision from the manifest/PR into a fresh Makko preview.

1. Bonk beneath the circled Signal and Tower striped awnings, Cache maintenance step and Firewall low step. Confirm visible, harmless head contact on just those objects.
2. Jump directly Signal awning → Signal roof; Tower awning → Tower roof; Firewall canopy → high step → roof; Broadcast low step → high step; Cache maintenance step → Cache awning. No outside detour should be required by an unmarked underside.
3. Jump upward through other unmarked roofs and steps, then land on them normally. Check both facings and the actual route where the owner was trapped.
4. Confirm the separately approved elevator roof stays hard and rideable and the descending elevator still pancakes enemies. Retain #72's firm-down drop control, victory result protection and twelve-second ally timer.

Automated route/collision checks are not owner physical-controller/Makko acceptance. Keep the draft unmerged until that review is accepted; after merge import the actual main merge SHA and repeat the focused route.

## Current owner route — deliberate descent, victory and twelve-second allies

Import the exact review SHA from the source manifest or PR into a fresh Makko preview. This follow-up is based on merged #71; previous art, solid roofs and pancake behavior remain.

1. On a platform, lightly press down or walk diagonally down while jumping: the player should jump. Push firmly within the downward cone and jump: descend one platform. Check straight D-pad down, a remapped jump and keyboard Down + Jump.
2. Win against the boss on the street and on a rooftop while tapping/holding Cross. Health must remain zero and the player must stay at the win location while the results appear. Release result buttons briefly, then deliberately select rematch or restart; both must work. Loss retry remains immediate.
3. Hack an enemy: it fights for you for twelve active seconds, with a matching timer/bar and a harmless reboot on expiry. Pause must freeze it; H/mapped interact must still release early.
4. Briefly check tutorial prompts, pause/resume, solid elevator roof and enemy pancaking. Record imported SHA and PASS/FAIL. Synthetic-device integration tests do not establish physical-controller feel or hosted Makko acceptance.

No assistant merge until this review is accepted. After merge, import the actual main merge SHA and repeat the three focused behaviors.

## Current review — solid ledges and elevator pancakes

Automated/native evidence is in `SOLID_LEDGES_SMUSH_PASS.md` and `review-solid-ledges/`. Owner Makko acceptance is pending. Check awning and gray-step bonks, side/upward roof collisions, land/walk/ride on the roof going up and down with the player/enemies/boss, normal rooftop exit and boss pursuit around the roof. Lure an enemy beneath the returning elevator: it must flatten visibly and count once, including its carrier drop. Standing inside/on top, pause, retry and the upper climbing route must remain reliable. This replaces the previous expectation of jumping through awning undersides.

## September 16 — elevator/rooftop/Studio Rat/drone follow-up

Owner follow-up on PR #70: the Firewall high step must clear the full lift shaft, and its canopy-to-roof route must remain jumpable.

Owner report after merged #69: cramped cabin, persistent label, lift floor below the rooftop, missing Studio Rat and a platform blocking the drone's stomp approach. These issues are not accepted merely because #69 merged. The combined correction is on `agent/lift-clearance-context-prompt`, based on `3554b0a326572b86f17a66300aa5ae9d122cd9c3`.

Focused production checks cover actual jumps, gentle visible roof contact, full lift ascent and grounded rooftop walk-off at 30/60/120Hz; fresh-run cat placement with old save credit, checkpoint consumption and no duplicated rewards; and unobstructed mission-drone patrol/stomps. Existing traversal and discovery checks remain. Native stills/movie show the original art with the new behavior. The generated receipt records full local/CI results and exact review SHA. Hosted Makko and physical-controller acceptance remain pending. Follow the focused post-deploy route in `LIFT_ROOFTOP_RAT_PASS.md`; keep this draft unmerged until owner review.

## September 16 — boss fairness, elevator and Studio Rat review

Use the exact revision from the combined `agent/boss-fairness-level-rewards` PR/source receipt. Base/rollback: merged #68, `84f7471fce9bb9300cd7c6f7165a86787054ace9`.

1. Start Level 1 with keyboard, mouse and controller. Choose each difficulty; the initial confirm must not jump/advance dialogue. Health and enemy pace reflect the choice. Pause/resume and boss retry cannot change it; a full restart can.
2. Rhythm-hit the boss when his body reaches the field, on the street and rooftops. Cyan recovery takes damage; guard still rejects the beat. Try near-edge descending stomps and shallow side grazes, then genuine deep contact. Ordinary stomps remain lethal and repeated boss bouncing cannot bypass rearm.
3. In the boss fight, watch original foreground cars at their actual altitude. Warnings precede entry, a clean hit damages either actor, and the same car can hit both. A very narrow boss graze can escape. Retry must restore fresh warned approaches.
4. Ride the elevator from street to Firewall canopy. The drive strip stays fixed for the full travel behind the cabin; teeth/motors animate when powered and reverse on return. Feet stand on the floor center. The rhythm-power label stays readable at the wider zoom. Two beats, canopy transfer, empty return, pause/reset and Cliff's nearby note work.
5. Find the tuxedo cat on Cache's upper route. Inspect once: look at viewer, pounce, drag a normal enemy away. No suitable enemy gives the border gag. No ally/protected enemy theft or duplicate defeat credit. Leave/reload/restart: credit remains; the expanded event plays once for an older cat save.
6. Confirm preserved tutorial Objectives, fitted holograms, terminal depth, animated fixed-scale BG/heavier rain, central Jammer, thin roof lines, Cross jump/beat, Down+Jump descent, H practice/hijack, 20 defeats, 16-hit Jammer, boss camera/upper routes, music, victory/loss/retry and full restart.

Difficulty/rat reward facts are saved silently. No album/unlock threshold is approved or promised. Native previews and production-VM checks are evidence, not owner Makko acceptance. Record imported SHA, PASS/FAIL and a short capture; leave this draft unmerged until that playtest.

## September 16 — facade hologram and Objectives review

Use the exact head from the new combined PR/source receipt on `agent/facade-hologram-objectives`. Base/rollback: merged #67, `d3d6128ce63c795c4096a320012e2136e21dfbc4`. A merged build or native screenshot alone does not approve visual alignment.

1. At the first gate, inspect the circled building seam from the owner screenshot. The rail must meet the facade foot and roof edge; its ground track must meet the wall rail and follow the paving across curb and street. Climb and inspect the full height.
2. Repeat at the other three gates. The right-hand gates follow the rightward pavement perspective. Check that characters stop at each visible barrier at ground and roof height, enemies pass above hardware, contact deforms/parts the field, and clearing the encounter opens passage immediately. The dark hardware remains after collapse. All 20 mission defeats must still reach the Jammer.
3. Complete movement/jump tasks while earlier crew lines remain. Objectives shows “Continue crew briefing” and Space; a connected controller shows its existing Create/View button. Advance into the next chapter: the next actual task replaces the cue. Input behavior remains the same.
4. Confirm the permanent left terminal, hologram/actor depth, animated background asset and heavier rain, original WATCH OUT/damaging cars, central Jammer, Cross jump/beat, platform drop, lift, drones, boss upper-route camera and win/loss/retry/restart remain.

Native evidence and reproduction: `FACADE_HOLOGRAM_PASS.md`. Required suite/syntax and CI results, with the exact head, belong to the generated receipt. Record imported SHA, PASS/FAIL and a short scene capture. After accepted merge, import actual new main and repeat the focused route.

## September 16, 2026 — animated background asset, rain and central Jammer

1. Open the standalone eight-second MP4. Smoke/clouds should roll subtly, with no camera movement, building deformation or visible loop splice.
2. Import the exact review head into Makko. From training, stand still and climb roofs: the actual painted clouds move, signs/steam remain animated, rain is slightly fuller, and walking does not resize the distant city.
3. Pause/resume, restart and retry. Video freezes when play stops and reloads once on a fresh run. A host that cannot play the video must retain the original visible city; report that as a media compatibility failure, not animation acceptance.
4. Finish 20 mission defeats from either end of the district. The Jammer stays in the central safe slots, away from the right edge and lift. Defeat it from either side and verify a clear boss camera move and the existing entrance/flourish/handoff.
5. Recheck WATCH OUT at the actual foreground car height, one health loss on unprotected contact, terminal/window/hologram depth, Cross jump/beat, platform descent, hack, lift, boss win/loss/retry and restart.

Automated production logic and Chromium media checks do not replace owner Makko acceptance. Record the imported SHA and PASS/FAIL before merge. Exact check status belongs to the generated receipt.

## September 16, 2026 — repair playable traffic, terminal placement and visible city motion

PR #65 failed owner review despite a successful merge. Review the new exact head in Makko before merging this repair:

1. Start fresh training. The single terminal is already there; its rear meets the facade and it clears the windows. Enemies and the hologram remain in front. Jump from sidewalk to terminal to first awning.
2. Stay still briefly: rain moves in front of the buildings, sign lights sweep and steam rises. Walk across the district and climb high roofs: the distant city keeps one scale and fills the view. Pause/resume and restart should freeze/reset atmosphere without jumps.
3. During training and after starting the mission, encounter original foreground cars at roof height. WATCH OUT points off the correct edge at the car's actual height for three seconds before visible entry; an unprotected body overlap removes one health bar, with knockback and recovery. Check both sides. Existing fast/high/random flight remains; background cars and cars passing above/below the player cause no damage.
4. Check Cross jump/beat ownership, Down + Jump descent, fading HACK READY, the right-side lift, drones, caches/repairs, Jammer and boss completion/retry. These systems were retained; automated results do not establish hosted acceptance.

Capture the imported SHA and PASS/FAIL. After accepted merge, import the actual new main SHA and repeat the same route. Exact revision, test status and native evidence are in the generated receipt; do not use the merged #65 receipt as an acceptance record.

## September 16, 2026 — sidewalk terminal depth and animated fixed-scale background

Current review branch: `agent/sidewalk-box-background`, based on merged PR #64 (`97b6367b53bc719594e77f32d89cc6bfdfbe72f7`). The owner requests a box set farther back on the sidewalk, visible from the start, with enemies and holograms in front; also a background that stops changing size while walking and has animation.

The one left-side terminal moves from y=650 to y=618, keeping x=690 and its existing 160×206 collider/art registration. Its foot is 32px behind the actors' foot plane. It renders and supports jumps during training and after reset. Only this permanent terminal moves to the scenery pass; upper supports, lift, rewards and boss retain their established order. Hologram fields render over it.

The distant skyline uses one fixed, aspect-correct screen-space size with horizontal/vertical parallax and enough overscan for rooftops. It no longer stretches to cover each moving inverse viewport or inherits walking-induced gameplay zoom. Foreground buildings, traffic and the existing world/cinematic camera keep their transforms. Sparse rain, chimney haze and slow window-light variation use the existing pause/reset-owned clock; reduced flashes keeps the lights steady. Existing artwork and cached haze textures are reused.

See `BOX_BACKGROUND_PASS.md` for acceptance, native previews and limits. Canonical pack version 65 matched all 379 exported base files; its manifest and test receipt remain in `verification/pr64-merged-history.json`. Latest head, PR and final test/CI results belong to the generated receipt. Owner Makko acceptance remains pending; this pass is a draft for review. Earlier current-work sections are historical.

## September 16, 2026 — Cross beats, contextual hack notice and street polish

Current approved branch: `agent/cross-beat-hack-popup`. Base/rollback is merged PR #63, `c6dc0116d08a70ca2c97edddb9404bd87e62906a`. The owner explicitly adds the top background gap, jittery Jammer, Down + Jump platform descent and illustrated rain-soaked blacktop to the Cross beat / unobtrusive hack HUD request. This is one combined draft; older current-work entries are historical.

Cross (× / Xbox A) now jumps outside Rhythm Mode and hits beats inside it; held-button transitions require release. Existing default Square beat saves migrate once by layout version; custom mappings and preferences remain. Jump/beat may share a button; other conflicting actions move to valid slots. Down + the mapped jump drops through the current support, including exiting Rhythm Mode for descent, while retaining the next lower landing and solid street. No held-chord chain dropping.

The HACK panel becomes a brief top-gap HACK READY notice only with a usable target: 1.8 seconds held, 0.6 second fade. Recharge/locked/no-target panels disappear; cooldown and hijack rules remain. Sky art covers the actual inverse viewport through roof travel and zoom. The Jammer housing uses the existing first whole-body pose at a fixed anchor, with gentle signal animation; legacy foot jitter is removed and its label sits above the dish. New wet blacktop starts below the existing curb at y=890; rails and traffic stay aligned. Asset ancestor: `6e1c8a4eb58252e1491dedc7878630dbab14929a`.

Owner continuation: relocate the rhythm lift to x=2440, y=856→358 at the middle-right Firewall canopy, with `destinationSurfaceId` owning both the landing and boss pursuit target. The single illustrated terminal moves to x=690, top y=650, on the left; its established collider ID stays stable. The terminal-to-first-awning entry route and lift-to-canopy transfer pass at 30/60/120Hz. Upper routes still connect across the district. Right-half Jammer spawn candidates move to 3100/3520/3820 to keep all three random positions clear of the relocated lift's full attack range; the three left-half slots stay unchanged. No extra box or elevator is added.

Read `CROSS_BEAT_STREET_PASS.md` for behavior, validation and the Makko route. Canonical pack v64 matched all 367 base source exports; its original manifest/test receipt are preserved in `verification/pr63-merged-history.json`. PR #62 remains owner-failed historical evidence. Automated/native checks are not physical DualSense or hosted Makko acceptance. Exact final revision, PR and CI belong to the generated receipt; keep the draft unmerged until owner acceptance.

## September 16, 2026 — controller playtest repair and car approach warnings

Base/rollback is merged PR #62, `af8019a1e7755195c4e6e2cddf1e3d3f9f82002a`. Branch: `agent/controller-jump-traffic-warning`. The owner reports that #62's controller changes failed in play: RB still made a tiny jump and Cross stopped movement. Preserve that failure attribution; earlier passing automated checks were insufficient.

The failure reproduces in playable training: its hardcoded bumper jump bypasses the mapped held state, causing an immediate release cut (54.81px rise at 60Hz), while Cross advances dialogue and clears inputs (no jump). Training now shares the normal mapped jump for press/hold/release. Cross/A jumps throughout playable training and gameplay; Create/View advances crew speech without clearing movement. R1/RB remains inspect. Menu/intro/keypad ownership remains contextual. Full input-plus-update trajectories match keyboard flight at 30/60/120Hz, including remapped jumps; held Cross reaches about 286px at 60Hz. Jump physics are not retuned.

New illustrated red WATCH OUT tag and independently reversible arrow are pinned to asset ancestor `27c23b7042a903006f79683f01518f9b5eec49fb`. Warning begins three seconds before projected artwork entry (within one frame), flashes without vanishing, points off the correct left/right edge at the actual car height, follows zoom/vertical camera, and ends on the first visible artwork. Only the text tag can shift to clear the HUD, with a connector back to the true-height arrow. Entirely off-view flight does not create a false warning at another level. Original car speed, scale, height, bob, probability and three-second queued launch remain.

Read `docs/source-pack/CONTROLLER_TRAFFIC_REPAIR.md` (or its root pack copy) for evidence and owner review. Tests/native rendering are not a fresh physical DualSense/Makko acceptance. Exact final validation, PR and revision are in the generated receipt. Keep the new draft unmerged pending owner acceptance. Earlier entries are history.

## September 16, 2026 — controller settings and visible hack availability

The owner approved the settings pass and asked for visible hack recharge. Base/rollback is merged PR #61, `91bc4917462062056ebe2cec7d01b89783d81850`; branch `agent/controller-settings-hack-meter`. The earlier controller recommendations are now approved and implemented: Cross jump, Square beat attack, Triangle hack/release, L1 Rhythm Mode, R1 inspect, Circle contextual back/exit and Options pause. Gameplay actions can be remapped under Pause → Controller settings, with saved deadzone, prompt style and vibration. Contextual dialogue/keypad/menu controls stay explicit and fixed.

A live hack meter shows charge, remaining seconds, target/grounded requirements, training lock and active ally/release time using the same availability gates as hack input. The ten-second cooldown, shorter lost-target cooldown, eight-second hijack, attack judgments and movement remain unchanged. Existing standard-mapped controller ownership is shared across gameplay and menus, with held controls blocked on reconnect/resume. No new art, gameplay balance or audio timing change.

Full tests and all-JavaScript syntax checks pass. Production Canvas settings, remapping and six hack states have been rendered and inspected. These checks use synthetic controllers and native rendering, not a physical DualSense or hosted Makko. Read `docs/source-pack/CONTROLLER_SETTINGS_HACK_PASS.md` (or the root copy in the source pack) for the test route and limits. Exact draft head, PR and CI are in the generated receipt. Owner Makko acceptance remains pending before merge. Earlier current-work entries are historical.

## September 16, 2026 — sustained walk loop repair

Base/rollback: merged PR #60, `5e0de1e16f2e40fd077468a18b0404e067cf634f`. Branch: `agent/walk-loop-repair`. The owner reports the recurring walk hitch during long strides and asks for a smoother pass. The previous twelve-pose selection omitted the four return poses available in the retained complete-body source. Restore source poses 0–15, with circular body registration, planted foot baseline and uniform 62.5 ms frames. Sixteen drawings now fill 64 host frame slots across four one-second strides; movement speed, collisions and other actions remain. No generated replacement art is installed.

Asset ancestor: `3e1af42b28521ff02efd7343792a890196493f70`; manifest ancestor: `215fde24db9f7493f1ee862e14761eb097db55e9`. The active startup pin and registry detection require this repaired manifest, including when the old walk is already cached. Read `WALK_LOOP_PASS.md` for the native before/after, long-hold tests, controller recommendations and Makko route. Controller changes are recommendations only, pending owner selection. Exact head/PR/CI are in the generated receipt. Makko acceptance remains required before merge; previous current-work entries are historical.

## September 16, 2026 — upper routes, boss pursuit and readable guidance

Current review branch: `agent/upper-route-boss-polish`. Base/rollback: merged PR #59 (`a4c16069b008c508a1dca60aeba3aab7e3c29b3f`). This expands the saved Jammer-arrow repair with the owner's later request for visible drones, faint roof landing lines, free boss-combat camera movement, more rooftop exploration, a sharp boss flourish, an illustrated elevator and boss participation above the street. Earlier current-work entries are history.

The two existing mission drones move into the first packets over Cache's awning and Tower's lower roof. No extra mission kills: quota stays 20. Existing roof edges gain a one-screen-pixel light stroke with a faint dark keyline. Three optional crown-roof signal caches reward a total of 1,500 score and up to three existing Amp charges; rewards are one-time per run and checkpoint-consistent. The single broadcast terminal and existing platform geometry remain.

Boss combat releases the vertical camera lock. The boss takes a distance-aware route through actual supports using an 850 ms landing warning, an 800–1,250 ms animated leap, and a counter window after landing (one second plus the next beat on intermediate supports; normal recovery at the destination). No landing contact attack. Roof pulses stay on their support's height and horizontal span. Base health, damage, musical attack timings, and player movement remain. Retry returns the boss/camera to street state.

New illustrated lift carriage, twelve crisp whole-body flourish drawings and eight leap drawings are pinned to asset commit `b1e9de902b325a949562e8ebeece375a8452ecca`. The new flourish is drawn by the shared production image cache over the existing animation owner, avoiding the host's stale low-resolution artwork. The four-second entrance uses quick motion, a held roar and return; combat keeps its existing sweep clock. Boss idle/walk and all player art are preserved. Prompts and registration are in `assets/upper-route/`.

The continuation also narrows the existing continuous emitter artwork to 14 world units, with compact caps and elbows, retaining its full facade-to-street footprint and prebaked powered/off states. Only emitter hardware draws behind enemies; gate fields, lift, repairs, props and boss retain the established foreground order. Original cars and the single broadcast terminal remain.

Read `UPPER_ROUTE_BOSS_PASS.md` and the latest acceptance route. Production-module and native-render evidence are not hosted Makko acceptance. Exact review revision, final test results and PR are in the generated receipt. Owner Makko review remains pending before merge.

## September 16, 2026 — restore Jammer arrow to the screen edge

Base/rollback: merged PR #59 (`a4c16069b008c508a1dca60aeba3aab7e3c29b3f`). Branch: `agent/fix-jammer-arrow-edge`. The owner reports the guidance arrow appearing over the player. At zoom 1 and 1.2, the player's projected position lies below the arrow's safe bottom (770); the old ray starts on that clamped boundary and selects its zero-distance bottom intersection. Reproduction at player x=960, y=784 and Jammer x=3520 yielded arrow (960,770), directly over the player.

For a Jammer beyond the left/right viewport, place the cue on that corresponding safe edge, clamp its height and point its artwork at the projected target. The normal-zoom reproduction now gives (1840,770). Keep current arrow artwork, distance, pulse/fade, single UI draw owner, on-screen hiding and gameplay. No asset changes. The circled facade-emitter appearance is not changed by this focused arrow correction.

The production-module mission harness covers both directions, ground/jump heights and four zooms (24 combinations), target direction, HUD bounds and hiding on entry/removal. Required suite/syntax results and exact review head are recorded in the generated receipt. Native/VM checks do not establish hosted Makko acceptance. Earlier current-state entries below are historical.

### Focused Makko review — pending

Import the exact draft revision from the receipt into a fresh preview. Reach the revealed Jammer with it offscreen: the arrow must sit at the far left/right edge toward it, not over 6 Bit, while standing, walking and jumping. Approach until the Jammer enters view: the arrow must disappear. Check the opposite direction on another reveal/debug placement, then destroy the Jammer and confirm the cue stays hidden through the boss handoff. Record the imported SHA and PASS/FAIL before merging. After merge, re-import the actual main SHA and repeat the focused route.

## September 16, 2026 — street depth, one terminal and render cost

Base/rollback is merged PR #58 (`1c8b54ec5db0e102f64c0ffb15bd4b57c5e5acda`). Branch `agent/street-depth-terminal-performance` implements the owner's new feedback: draw emitter hardware behind enemies, replace three large generic boxes with one illustrated broadcast terminal at the Tower, and reduce wasted scenery rendering. The two removed boxes also lose their colliders; thin wall-mounted supports remain. Baked original rail geometry/off states use asset ancestor `1891ebb4e061971362817832e942ef9fbe05d15a`. Native gate-pass draw calls fall from 14 to 1 for the first gate and 55 to 2 after all gates clear at the fixed review camera. This is not a hosted FPS claim. See `STREET_DEPTH_TERMINAL_PERFORMANCE.md` for implementation, assets, tests, limits and the exact Makko route. Review head/CI belong to the generated receipt. Owner Makko acceptance is pending; earlier entries are history.

## Thin rail / original traffic correction — owner review pending

Base/rollback `f048d229a51b9ecce801cd9d736613491c4ae2f9`; branch `agent/thin-rails-original-traffic`. Exact tested/published head and automated results are in the generated receipt. Import the draft head before merging. Use the complete review route in `THIN_RAIL_TRAFFIC_CORRECTION.md`: original cars both directions and protected damage, four full-height facade/curb rails and opening, faint roof edges/foot masking, 3D box/lift, Firewall turns/contact/crowds, drone warning/shot/hijack, heart rewards, both puzzles on controller/pointer with untimed practice, separate cutscene buttons, Objectives, audio, twenty defeats, Jammer and boss/retry/restart. Record SHA, PASS/FAIL and clips. After acceptance and merge, read/import the actual new main merge SHA into a fresh preview and repeat. Native footage and automated checks are not hosted gameplay acceptance.

## Level 1 rebuild after reverted #55 — owner review pending

Base/rollback: `6e3751ba1561d8694e0bdc9a623e74ac6a45624d`; branch `agent/level1-rebuild-reviewed`. Exact review head and PR are in the generated source receipt. Test this head before merging. The failed #55 was reverted; earlier pending-pass instructions below are historical.

1. Import the exact PR head into a fresh Makko preview. Check cold asset loading, title and all intro scenes. Rapid Space/A presses must stop at the current scene; Enter/RB and the separate Next Scene button advance only when ready. Check pointer controls, deliberate S/B hold skip and gameplay handoff.
2. Walk and reverse beside Firewall on both sides; watch several complete strides, attack/recovery and pause/resume. Test side contact during invulnerability, hacking and crowds beside gates/boxes. Bodies must separate; clean descending ordinary stomps must still defeat and rebound. Record any unexpected damage with health before/after.
3. Inspect the shared sidewalk foot plane, shadows, lift boarding, Jammer and boss contact. Use the utility box and service steps; their top/side must match the scene. Inspect all four barrier mounts, sidewalk/curb/road footprint, player pressure, enemy passage, opening and dormant machinery.
4. Climb the original route and the building crowns using the existing single jump. Check landings/reversals, selected parapet masking and camera ascent/descent/return to the boss. Ground guards must stay on their own surface. Collect the heart repair while hurt, verify a full-health cell stays available, and check the carrier drops once.
5. Fight the new Cache and Tower drones: patrol stays near its own roof, lock/shot/recovery is readable, its attack is avoidable, stomp/rhythm damage counts once, and H conversion targets hostiles. Release/expiry must clear allied shots and give the normal reboot safety. Complete all twenty mission defeats and check the last-enemy direction hint.
6. Watch warned foreground cars from both directions and at different roof heights. They must use the existing artwork. Confirm the 2.8-second direction/height warning, safe waiting space, a single damage event, and pause/hack recovery without an unseen incoming hit.
7. Complete both H puzzles using keyboard, controller only, and mouse/touch keypad. Navigate/select/correct/submit/cancel; verify the original slowdown, eight-second ally, cooldown and tutorial locks. Check Objectives, recent dialogue/instant text, rhythm/Amp, audio, discoveries, sixteen-hit Jammer, boss win/loss/retry and full restart.

Record imported SHA, PASS/FAIL and short clips showing (a) Firewall/contact/barrier, (b) roof masking/drone/car warning and hit, and (c) dialogue separation/controller keypad. Record browser/controller and repro steps for failures. Automated checks/native Canvas renders do not certify hosted art delivery, audio or game feel.

**Normal post-merge deployment:** after owner acceptance and merge, read the actual new `main` merge SHA, import that exact revision into Makko and open a fresh preview. Repeat steps 1–7 and record the deployed SHA and the same focused evidence. Do not assume the review SHA is the merge SHA. If needed, re-import base `6e3751ba1561d8694e0bdc9a623e74ac6a45624d` to restore the reverted baseline. Further campaign/cloud work follows acceptance of this rebuild.

## Wall sidewalk/street footprint review

Base/rollback: merged #53, `685d13d4de1d56c8a39a82077460d894144bd091`. Import the exact new PR head from its description/source receipt into a duplicate Makko project and start a fresh preview.

1. At the tutorial wall, check that the bottom crosses the sidewalk in perspective, drops down the curb and reaches the street, with no strip of apparently open pavement in front. Its upper portion still reads as a tall wall through the buildings/rooftops. Compare with `Barrier-Sidewalk-Street-Review.png`.
2. Walk/jump toward the closed boundary; check that it still stops the player at the original gate. Follow all four encounters, view their walls from the street and available rooftops, and clear each gate. The full field should collapse/fade together and movement should unlock immediately as before.
3. Move the camera toward/away from a wall so the foreground extension enters first; check for popping/clipping. Pause during a collapse, resume, restart, and check reduced effects. Retain walking/audio, hijack/repair, lift, Jammer and boss/retry smoke checks.

Record imported SHA, PASS/FAIL and one short clip showing the sidewalk/curb/street footprint, a blocked jump, gate opening and movement through it. Native drawing and automated validation do not replace owner Makko review. After acceptance and merge, import the actual new main merge SHA, open a fresh preview and repeat these same checks; record deployed SHA and evidence. Roll back this visual correction by re-importing the base above.

## Enemy hijack / repair route review

Use the exact new review SHA from the PR/source receipt. Walk PR #52 is already merged at `66c17d1880f5de933e9b928833e5dd2bfff6a817`; this new draft targets main directly and preserves all completed walk and hijack work. Follow `ENEMY_HIJACK_REPAIR_PASS.md`'s focused Makko route: both H puzzles, all three ordinary target types, one ally, enemy combat, player-friendly fire exclusion, target death/failure/cancel, early release, expiry/reboot, pause/restart, full-health/injured repairs, one carrier drop, both directions on the two supports, gate counts and boss retry. Preserve intro/music/lift/Cat/Amp/lore/Jammer/boss smoke checks.

Capture imported SHA, PASS/FAIL and a clip covering target lock → conversion → enemy hit → expiry/reboot → repair. Automated checks and native Canvas review do not replace this owner test. After acceptance/merge re-import actual main merge SHA into a fresh Makko preview, repeat the route and record SHA/evidence. This pass's base/rollback is `66c17d1880f5de933e9b928833e5dd2bfff6a817`, retaining the merged walk; earlier pre-walk rollback is `ea2921960477e38c74740dda378fcb513a8f1cc1`. Neither merge nor automation claims a Makko PASS.

## Current review: stable 6 Bit walk and compact atlas

Base/rollback: merged #51, `ea2921960477e38c74740dda378fcb513a8f1cc1`. Import the exact published head of `agent/player-motion-polish`, identified on its PR and generated receipt. Earlier pending #51 wording below is historical.

1. Start a fresh Makko preview. Hold a direction for several full strides in both directions, including while the camera follows. Watch the body, planted feet and loop seam; confirm the earlier shake/surge and faint extra limbs are reduced. Pause mid-stride, resume and repeat after restart.
2. Start/stop, reverse direction, jump/land while moving, and enter/leave R. Confirm instant controls, normal jump height/reach, stable idle, existing rhythm poses, contacts and ground speed.
3. Traverse the existing lift/rooftop route and encounter walls. Retain title/intro, H/R, audio, Jammer/boss, win/loss/retry and restart checks. Health behavior, traffic collisions, platforms and cloud rooms have not changed in this PR.

Record the imported SHA, PASS/FAIL, and a short clip showing both walking directions, one turn, jump/landing and pause/resume. The comparison video is a sprite diagnostic, not hosted game footage. Owner Makko acceptance remains required before merge.

After acceptance and merge, import the actual new `main` merge SHA into Makko, reopen a fresh preview and repeat the same route. Record the merge SHA and the same short movement clip. Rollback: re-import `ea2921960477e38c74740dda378fcb513a8f1cc1`.

## Current review: idle, flourish and fireball polish

Base/rollback: merged PR #50, `42aebe8c19853da510c385c45606dfd3b4c7973a`. Import the exact published head of `agent/animation-fireball-polish`, recorded on the PR and source-pack receipt. Earlier pending PR #49/#50 instructions below are historical.

1. Open a fresh Makko preview and Start. Watch at least three complete 6 Bit idle loops, then walk, jump/land and enter/leave R. The loop should return without the old take splice; the existing pose timing and feet should remain stable. Restart/reopen and confirm the repaired artwork is still installed without loading errors.
2. Destroy the Jammer and watch the full boss walk → close-up → flourish → idle handoff. The clarified flourish retains 48 poses/four seconds and the same body size and ground contact. Check it again during the combat sweep.
3. Watch fireballs in both directions and the later double pulse. Check the larger flame, soft glow, wake and steady hot front. Jump them and check the same health loss, speed, attack warnings and counter timing; paused effects must freeze and resume with gameplay.
4. Finish one win and one loss/retry, then restart. Retain the normal title/intro, movement/contact, lift, H/R, music/audio and Jammer-to-boss smoke route.

Record the imported SHA, PASS/FAIL and short clips of three idle loops and the boss flourish/fireballs; include health before/after any unexpected hit. Automated/native-Canvas checks do not establish hosted Makko acceptance. Owner acceptance remains required before merge.

After acceptance and merge, re-import the actual new `main` merge SHA into Makko, open a fresh preview and repeat steps 1–4. Record that merge SHA and the same two clips. Roll back by re-importing `42aebe8c19853da510c385c45606dfd3b4c7973a` if needed. Stage C campaign services remain deferred until this presentation pass is accepted.

## Level 1 presentation smoothing after merged #48

Base/rollback: `de9a63ea9311aba23d6a9ad6c3dca3b5e8aa50a5`. Import the exact head of `agent/level1-presentation-smoothing-recovery`; owner Makko acceptance is required before merge.

1. Watch 6 Bit, Virus, Corrupted, Firewall, Jammer and boss idle through complete loops. Confirm the approved designs/actions remain recognizable, texture/silhouette flicker is reduced, and feet/contacts do not drift. Jump and Firewall attack endpoints must still read cleanly.
2. Reveal the Jammer and confirm its visible foot sits on the same 822 sidewalk contact as the actors, without changing range, health or the destruction sequence.
3. Traverse with normal and foreground cars. Background light cones must pass behind buildings; foreground-car light remains over the buildings and behind its car.
4. Run the tutorial and confirm the pink objective card has its own space below score/lore. Inspect the Studio Cat on Cache Overpass: it dashes across the rooftop once, is away from the lift, retains both crew lines and does not replay after collection or reload.
5. Enter all four encounters. Each closed barrier must read as a tall digital wall spanning the sidewalk perspective, then dissolve on the existing immediate unlock clock. Confirm jumping, collision and progression are unchanged.

Automated checks preserve all atlas counts/timing/anchors, verify hashes and smoothing provenance, and exercise the presentation ownership changes. They do not certify live Makko playback, audio, or final visual feel.

Recovery verification: all twelve remote atlas hashes and sizes match the saved outputs; delivery is pinned to `1edf7fe6a011b88d511b955db9d1342f78912009`. The complete local test suite and all-file syntax pass, including equal-time playback at 30/60/120/144 Hz, irregular frame deltas, native speed/pause/one-shot behavior, stable idle references and full jump apex/recovery drawings. Record the exact imported PR head plus short clips of character transitions and the Jammer-to-boss sequence during owner review. After acceptance and merge, re-import the actual new `main` merge SHA into Makko, reopen its preview, and repeat the five checks above plus title/intro, lift, H/R, audio, boss win/loss/retry and restart. Roll back by re-importing `de9a63ea9311aba23d6a9ad6c3dca3b5e8aa50a5` if required.

## Makko sprite-loading repair after merged #47

Base/rollback: `8f09568eeb9726f7b80fb43e1ecb3f6e4672bea2`. Import the repair branch `agent/fix-makko-sprite-loading` at its published review head.

1. Open from a fresh Makko preview, press Start and confirm 6 Bit uses the new idle, walk, jump and rhythm drawings, including the player created before startup finishes.
2. Confirm Virus, Corrupted and Firewall use the replacement sprites throughout their actions. Check the Jammer and boss idle when reached; the two intentionally retained boss clips remain as documented below.
3. Reopen/restart and check there are no repeated sprite downloads, duplicate initialization, shifted feet, or changes to controls, collision, rhythm, hack, intro, HUD and the updated city layers.

Automated coverage includes cold/old/mixed/current registries, single-flight startup, player rebinding, cleared timeout and all twelve atlas paths. Actual saved Makko SDK drawing is recorded in `verification/makko-model-runtime.json`; its local image transport does not certify live host import or audio.

## Recovered model art / live HUD — September 14, 2026

Review `agent/finish-model-art-hud` at the exact head in its PR/receipt. Base/rollback: merged #46, `f3bf9ed294a2bd69fe3a7dccc02a1c50b9241db2`. Owner Makko review is still required before merge.

1. Confirm the model-based 6 Bit idle, walk both directions, jump and headbang appear. Check planted feet and body fairness on street, roofs and lift.
2. Confirm Virus, Corrupted, Firewall and Jammer use the recovered drawings; check warnings, contacts and all animation transitions. Inspect Firewall flame continuity, particularly the three previously flagged poses.
3. Check both city layers across the whole street, including transparent gaps, building/platform alignment and seams.
4. Check the sampler/barcode HUD in exploration, rhythm and boss play. Health, score, lore, combo, Amp and target timing must reflect actual state; healing and fragment flights must end on their panels.
5. Complete the retained title/intro/tutorial, H/R, audio, twenty-enemy mission, Jammer, boss loss/win/retry, pause/restart and save smoke route. Boss idle is redrawn; walk/flourish and traffic deliberately remain their working original animations because the final new exports were not saved.

Native Canvas and deterministic tests do not certify Makko playback, audio or game feel. Earlier routes below are historical.

> **Recovery checkpoint, September 14.** Draft PR #46 exists. Twelve recovered complete-body clips (547 frames), the approved city layers and live HUD are being installed and checked on that same branch. Final boss walk/flourish and vehicle loop exports were removed by workspace maintenance before publication and could not be recovered from GitHub or the saved v5. The original working boss walk/flourish and traffic remain. Do not regenerate the approved designs, claim full completion, or merge this checkpoint. See MODEL_ART_RECOVERY.md.

> **September 13 production checkpoint — in progress.** The owner approved integrating the model-based artwork and HUD as one combined pass on `agent/model-art-hud-integration`, from merged #45. Twelve complete-pose clips (547 frames) and the live HUD are prepared. Final two boss clips, vehicle loops, scenery/anchor calibration, delivery pins and full validation remain. No PR or Makko acceptance is claimed at this checkpoint. See `MODEL_ART_HUD_IMPLEMENTATION.md`; older review-only sections below are historical.

## Current review — model-based art, full-body trial and new HUD

This checkpoint needs visual review of bundled examples; the playable source remains merged #45. Open `repository-snapshot/docs/visual-overhaul/hud-review.html` in the ZIP and switch Explore, Rhythm and Boss. Pause/Play controls the trial. The mode values are explicit examples, not live gameplay.

1. Inspect the hero sheet and actual model PNGs together: cap and green brim, glasses, face paint, exposed mouth/chin, brown hair, coat, shirt, gloves and boots.
2. Watch `headbang-overhaul.animated.webp`: original left, model-based redraw right. All 48 original frame keys/order/durations are retained at 12 fps, but generated anatomy and details are not pixel-exact. Judge cap/coat/hair consistency, full-body fold/recovery and the midpoint/repeat seam. No duplicated filler frames are added.
3. Compare every enemy type, all three vehicles and both city layers in the accompanying sheets. These are drawing examples; full enemy/traffic sequences and precise platform/repeat-seam mapping remain unfinished.
4. Judge HUD legibility in quiet exploration, active rhythm and boss states: barcode health, beat target, combo, Amp, objectives and boss warnings. The preview uses fixture data and a separate renderer; no live UI/gameplay modification is claimed.

`VISUAL_OVERHAUL_REVIEW.md` lists provenance, scope and production work still needed. The generated receipt records actual local checks; no real-browser/Makko acceptance or new external publication is claimed. Owner Makko review remains required before a future integrated build merges. Earlier sample/import routes below are historical.

## Historical review — subtle whole-frame restoration

The owner rejected the cutout animation. The active runtime, original sprite manifest, anchors/facing and scenery now match merged #45. Three complete 2x restoration trials are **not installed**; this checkpoint needs art review, not a new Makko import to view the samples.

1. Watch the individual `verification/original-motion-headbang.animated.webp`, `original-motion-jump.animated.webp` and `original-motion-attack.animated.webp` comparisons: original left, restored right, matched source frame and display size, each looping its own full cycle. Compare the headbang fold/recovery, jump tuck/landing and Firewall lunge/punch. Check temporal texture flicker and whether the modest clarity gain is useful. The combined overview is useful for a glance but can interrupt a repeat of a shorter clip at its shared reset.
2. Inspect the full original/restored image and JSON pairs in `assets/studies/original-motion/`. All 134 source frames, keys, order, durations and tags remain; all spatial coordinates are exactly doubled. The decoded restored alpha must equal the original alpha replicated 2x. These invariants are checked during generation and recorded in its manifest.
3. Treat approval of this sample quality separately from eventual runtime acceptance. Any integration must keep original logical dimensions, foot/head anchors, facing and phase-selected frames; doubling atlas pixels alone must not double actors or collision bodies. Preserve the complete AGENTS Makko smoke route for a future integrated build.

Required local regression and all-file syntax results are recorded in the export receipt. No new Chromium CI, live Makko review, hosted asset publication, PR or merge is claimed. The old cutout import route below is historical and must not be followed for this checkpoint.

## Historical cutout replacement route — rejected and inactive

Import the exact `agent/sprite-upgrade-study` draft head into the duplicate Makko project. Base/rollback is merged #45, `c557c87bb0e04287e6c694d7d6559174d8b65d06`. This is the complete runtime replacement described in `SPRITE_REPLACEMENT_PASS.md`; the unused-study status below is historical. Original model PNGs were unavailable, so review 6 Bit's likeness against your originals as well as the derived intro reference.

1. Watch 6 Bit idle, walk both directions, turn, take off, reach the apex, descend and land repeatedly on street/roofs/lift. Enter/exit Rhythm Mode. Check cap, paint, human face and costume, continuous joints, clean alpha, readable poses and planted feet through every transition. The four source clips now face right.
2. Watch Virus pulse, Corrupted idle/walk and Firewall idle/walk/punch. Stomp ordinary enemies, take side contact and attack/hack as before. Judge readable warnings, body fairness, correct facing and contact; check both sprite-anchor paths supported by the host.
3. Clear all twenty mission enemies and destroy the Jammer. Check the complete boss entrance/idle/walk/pulse sequence. The existing +8% boss size and additional +6% walk increase remain. Review the subtle clarity refinement without expecting a new boss/Jammer design.
4. Traverse the whole street and rooftops in windowed/fullscreen view. Check panorama aspect, seams, foreground windows/platform alignment, three traffic animations and their lighting. Compare quiet traversal with busy combat for clarity.
5. Pause/resume, lose/retry the boss, win, restart and reload. Retain the full AGENTS smoke route for title/intro/tutorial, S/B skip, lift, H/R, audio, discoveries and saves. Watch for missing sheets, stale frames, duplicate loops, errors or a progressive slowdown.

Record the imported commit SHA, browser/window mode, a short clip showing hero transitions and enemy contact, and a clip showing the Jammer-to-boss sequence. Report any issue with exact state/facing/frame if available. Native Canvas and VM checks explicitly adapt Makko's boundary; they do not prove live host playback, audio sync or game feel. Owner Makko acceptance remains the merge gate.

## Sprite/background study status — after merged #45

The current `agent/sprite-upgrade-study` work contains unused art candidates and comparisons only; the playable runtime remains merged #45 (`c557c87bb0e04287e6c694d7d6559174d8b65d06`). This is not a new Makko gameplay build. Inspect `SPRITE_UPGRADE_STUDY.md` and `verification/sprite-upgrade-comparison.gif` for actual limitations. Both sprite studies are RGB with baked checkerboards; the walk has exaggerated knee lift and needs a corrected cycle. A model-faithful final hero requires the original face/front/side PNGs, unavailable in this workspace.

The panoramic background passes its aspect assertion and actual parallax composition with the unchanged foreground; owner art direction review is pending. Any eventual production sprite set must preserve foot anchors/body geometry, phase-selected jump/landing frames, flip direction, input/timing, and pass the retained gameplay/Makko route before merge. Do not treat a promising still drawing as animation/export acceptance.

## Studio Cat / chaotic FX / boss asset review — after merged #44

Import the exact `agent/level1-cat-chaos-assets` review head. Base/rollback is merged #44, `4b207c5570a6bccd86b95c702c11e1e6606bbf01`. New art and size/FX tuning require owner Makko acceptance before merge; older draft sections below are historical.

1. Inspect the cat at street x590 between encounters with E / LB. It must read as a cat, deliver the corrected crew exchange and walk beside the caption without covering text. Repeat after reload with the existing discovery saved; no new lore or duplicate discovery is granted.
2. Reveal the Jammer and move to either side until it leaves the screen. The textured pointer must aim correctly at safe edges, retain its distance label and disappear when the target is visible/destroyed. Check windowed/fullscreen and different zooms.
3. Compare repeated hits, combo-5 waves, combo-10 chains, landings, metal/data/strip defeats and major clears. Bursts should look noticeably different and more unruly while enemy warnings and the fixed beat target stay readable. Pause freezes their current shape; reduced flashes and shake settings still apply.
4. Watch the entire boss entrance, idle, walk and attack. The boss should be modestly larger and the narrow walk fuller; feet must stay on the street through clip changes, mirroring and movement. Check the 8%-larger stable body core feels fair for contact and stomp counters.
5. Watch/jump both directions of the textured ground pulse, including double pulses. The bright leading edge marks the same 64 × 56 hazard; warnings, damage and musical counter windows retain their behavior. Pause/resume, boss loss/rematch, victory and full restart must clear old effects and reuse the three images.

Retain the complete AGENTS smoke route for intro/tutorial, movement/contact, lift/roofs, H/R, audio, quotas/Jammer, boss win/loss/retry and restart. Focused production tests and native `verification/cat-chaos-*.webp` diagnostics cover code/frame behavior; the CI Chromium check covers image decoding/fallback and the existing intro routes. Neither replaces Makko playback/feel review.

## Combined ten-item impact/discovery review — after #43

Import the exact `agent/level1-impact-discovery` PR head into the duplicate Makko project. Rollback is `51b65d4cd71d369b05003ddaa83cfe6f88fe348b`. Owner Makko acceptance is required before merge. Keep the full opening/fullscreen, tutorial, movement/contact, H/R, lift, audio, mission/Jammer, boss win/loss/retry and restart smoke route from AGENTS.

1. Compare normal hits, damage, heavy roof landings, stomps and destruction. Their direction/weight differs; health and the beat target stay steady. Disable Screen shake in Pause and repeat.
2. Hit/defeat Virus, Corrupted and Firewall. Look for bright contact cores, data squares, displaced strips and hot metal. Debris continues after the enemy disappears; attacks/physics never freeze globally. Compare SFX and Flash accents off.
3. Build combo 5 and 10: a forward waveform then short chain links become real attacks. Brackets match the next successful hit, including turning, vertical separation and Amp use. Miss resets the tier. Check that boss guard and Jammer's one-health-per-success remain intact.
4. Perform across musical phrases: actual screen glass, curb, cable lights and pavement build with combo. Quiet traversal stays quieter. Enemy windups remain readable.
5. Jump, land from different heights, run across roofs and stomp near the hanging sign/vents. Check foot sparks, rattle, cable swing, steam and existing vehicle light sweeps without collision changes.
6. Play all four encounters. Signal Alley reconnects; Cache Overpass has protected descending Virus arrivals and traffic shadows; Firewall Plaza has heavier entrances; Broadcast Gate displays build to release. Confirm all 20 required defeats and unchanged gate progression. Clears visibly reframe/unlock the street.
7. Damage and destroy the 16-health Jammer. Watch increasing strain, breakup and buildings recovering in order through the existing cinematic. Rhythm Mode exits immediately. Boss entry/major pulses have weight; the final hit stays visible briefly before results. Retry preserves the restored district without replaying clears.
8. Read health, Amp, combo, objective and approaching beat notes at normal window size and fullscreen. The top-left target stays fixed through shake/zoom. Check keyboard/controller prompts, early/late feedback, calibration and the relocated lore-collection destination. After a successful hack, repair packets must land inside the health bar and its outline must follow that bar. On victory, watch the final impact and card fade before the score starts counting from zero; score, combo and lore must each finish at their saved totals. Pause and rematch must preserve/reset that animation cleanly.
9. Stomp during an encounter: only its caption tilts. Inspect the Studio Rat and watch it drag a bolt through the panel margin. Check its earned results callback; no callback is granted merely by drawing or standing nearby.
10. Between fights, backtrack to the rat at street x590; read Cliff's plate on the first roof x865; inspect WittyF0x's mark on the Firewall canopy x2475 and the venue flyer at street x1840. Use E / LB, then again for the optional crew reply; walk away to dismiss. H/Y still starts hacking. Pause, tutorial, fights and airborne states cannot inspect. Reload and revisit: facts persist, lore totals and combat stats do not change.

Automated evidence covers production target/input/save/lifecycle rules, protected arrivals, camera bounds, reduced effects, victory timing and existing mission/boss regressions. Native Canvas fixtures are in `verification/impact-pass-*.webp`; they use fixed scenario states and an animation adapter. Browser CI retains the intro/fullscreen regression. Audio feel, host sprite playback, controller ergonomics and final tuning remain owner review items.

## Staged intro review — after merged #42

Base/rollback: `f1831f95c187bdd5afd9c8231d2a7a10ac262671`. Import the exact head of `agent/intro-cue-staging` into the duplicate Makko project before merge. The owner confirmed the prior images are visible; this new timing/art pass needs its own review.

1. Start normally and wait. Art/title appear first; readouts, dialogue and captions follow in story order. Earlier speech stays visible, and the scene does not turn its own page. Judge the reading intervals in `INTRO_CUE_STAGING.md`.
2. Press Space once during a reading interval: exactly the next cue appears on the same scene. Hold it: no repeated advance. After the final cue, a fresh press changes scene. Check Enter, click and controller A too.
3. On pages 1, 2, 3, 5 and 6, readouts sit within the actual monitor glass and follow its angle. Pages 4, 7 and 8 use the lower page margin. Inspect page 5's corrected thumb/index grip and wrist; check DJ's face, likeness and two scope traces remain intact. Compare the final and staged renders in `verification/`.
4. Leave the tab or window while a line is showing, then return: its remaining reading time is preserved. Check fullscreen exit/re-entry and resize; text stays aligned and input stays usable.
5. On page 6, inspect the displaced recovery caption only after 6 Bit's refusal. Check reduced effects, early S/B release, a full independent five-second hold and both normal/skipped tutorial entry.
6. Complete the existing opening/tutorial into one mission; verify audible music handoff and the existing Level 1 movement, combat, lift, Jammer, boss/retry and restart route. Automated stubs cannot certify these Makko/audio/device results.

VM checks exercise the actual cue clock and owners. Native Canvas renders verify production layout; Chromium checks native fullscreen, decoded bundled art and trusted inputs with explicit initializer/gameplay/audio boundaries. Exact completed results belong to the receipt and linked CI run.

## Black-screen recovery — after merged #41

Base/rollback: `897b750cf64bafe3d50746cd7c8c19379ef4fbf6`. Test the exact head of `agent/intro-fullscreen-recovery` in the duplicate Makko project before merge. The owner-reported black screen supersedes the previous unconfirmed repair status.

1. Click Start normally. Page 1, its artwork, dialogue and controls must be visible immediately in fullscreen. Exit fullscreen, re-enter with Shift+F, and resize: the same page stays readable and clickable. If fullscreen is declined, it remains usable in the window.
2. Read/advance all eight scenes with click/Space/Enter or controller A. Also take the five-second S/B skip route, including early release with a connected controller. Confirm page 6 inspection and the existing scene-placed dialogue remain.
3. Both completion routes enter Cache's “Still with you” tutorial once. The game canvas returns, intro overlay disappears, and the existing four-second audio fade completes. Complete movement/jump, training, R and H gates; the mission starts once at zero.
4. Check the existing movement/contact, lift, pause/archive, Jammer/boss/retry and restart smoke route. These systems were not retuned. Record exact SHA and any remaining host error.

The dependency-free regression includes the production fullscreen owner and both asynchronous request orderings, denied fullscreen, exit/re-entry, pointer input and tutorial handoff. GitHub's added Chromium check supplies real layout, native fullscreen, hit testing, decoded local artwork, keyboard/pointer, resize and visible failure/retry evidence. It uses explicit initializer/gameplay/audio boundaries and does not certify Makko sprites or audible audio.

## Current intro repair review — after #40

Base/rollback: `a747b58411650146bdc003a529d0470167d275db`. Review the exact manifest revision from `agent/intro-makko-repair` in the duplicate Makko project. The owner has already reported that PR #40's opening failed; the earlier checklist below is historical.

1. Open from the title and leave page 1 running for at least two minutes. All artwork should load and remain visible without context-limit errors. Advance through all eight scenes in windowed/fullscreen views; check the new balloon pointers, comms cards, faces, tape lock, scope, door hand and tower remain readable. Compare `verification/intro-contact.webp` with the host result.
2. Complete once by reading and once by holding S for five seconds, with a controller connected. Also test B, early release, mixed S/B holds, tab/focus cancellation and repeat/held advance. Page 6 inspection and its run-only results callback remain available.
3. After either intro path, Cache answers “Still with you” and Mac establishes the jammed district. Read/complete all five tutorial chapters: movement/jump, three training defeats, five rhythm hits, successful hack, and the final crew line's hold/fade. Check speaker colors/names and prompts. The twenty-defeat mission begins once at zero; no second boot, tower-collapse exposition or extra post-tutorial scene appears.
4. Listen through the existing four-second intro-song fade and gameplay music/rhythm start. Spot-check H/R locks, both hack puzzles, pause/archive, lift, Jammer cinematic, boss/retry and restart with existing saves.

Record exact SHA, project/origin, browser/controller and PASS/FAIL. Tests and native Canvas previews do not establish Makko rendering/audio/feel. Public endpoint/CORS evidence is in `verification/intro-asset-delivery.json`; it does not certify a host content-security policy.

## Intro correction — current owner review gate

Base/rollback: merged PR #39, `510342ed21692fd85f9b99ef6b29990a5694132d`. Review the exact exported revision in a duplicate Makko project. `INTRO_OVERHAUL.md` contains the complete script and reference images. **Makko acceptance is pending.**

1. Start from the title. The new eight-page opening must appear before any tutorial or mission. Read the original four's contributions and the broadcast failure/recovery disagreement. Compare all five visible character designs with the supplied models (INTRO_ART_DIRECTION.md); Cliff should appear only in the page-2 background and other characters remain offscreen/obscured. Confirm the eight bundled images load and names, dialogue, borders and page counter fit at your actual window/fullscreen size.
2. Advance with Space/Enter/click and controller A. Holding/repeating advance must not race through pages. The final page enters the tutorial once; a held A cannot jump/advance the tutorial as well. With an actual connected controller, hold keyboard S for five seconds. Repeat with no controller. Both must skip the entire opening, not just one page.
3. Release S early and confirm the skip cancels. Repeat with B, disconnect during a B hold, and hold/release S and B in different orders. One input must not cancel the other. Switching window/tab cancels unattended holds.
4. On page 6, inspect the displaced caption with Left Arrow or D-pad Left. Review its static endpoint with reduced effects. Finish normally or skip; the optional results callback should remain in that run. A fresh run clears it; persistent lore remains.
5. Listen through the existing four-second intro-song fade and gameplay start. Confirm one soundtrack/beat clock, no title-song overlap, no second crew scene after tutorial, and one mission entry. Spot-check existing tutorial H/R locks, movement, both hacks, pause/archive/calibration, lift, 20-defeat mission, 16-hit Jammer, boss/retry and full restart.

Record exact head, Makko project/origin, browser/controller and PASS/FAIL. Native Canvas renders are production-layout diagnostics, not certified Makko/audio captures. Tests specifically cover the reported S regression, all-page reachability, controller ownership, fade scheduling and stale startup cleanup. Full required suite/syntax and exported revision are recorded in the receipt.

The owner's next requested work is HUD/rhythm presentation and threshold-based attack variety. That follow-up follows the intro; Stage C is no longer the immediate next task.

## Historical acceptance records

Older checklists below describe their own review milestones, not a replacement for the current gate.

## Current campaign planning review — after merged PR #37

This pass changes development documents only. It does not create a new gameplay/Makko acceptance claim. Validate the exact committed review with the existing repository suite and all-file syntax check, inspect the diff for source/asset changes, and check the new plan's counts/references. The generated export receipt records commands, exit status and revision; historical reports below retain their original limits.

Review the concrete planning result:

1. Follow opening → all seven levels → finale in `CAMPAIGN_STORY_MAP.md`. Each transition has a reason, each lead contributes, required context remains on the main route and later payoff is identified.
2. Confirm only four playable characters, latest cameo inclusions/exclusions, Sheila's silhouette, 9 Bit's origin and separate-canon boundaries. No removed guest is a Tower gate.
3. Confirm exactly 28 distinct lore-purpose IDs in the distribution 3/4/5/4/5/4/3, preserving the three current records and durable save identity. The secret collection relationship remains development-only; no runtime copy was changed.
4. Confirm required inspiration references and the older candidate bank are represented, with proposed placements labeled. Scenes, art, exact ending rules and final later-level choices are not misrepresented as approved/shipped.
5. Confirm completed work through #37 is not rescheduled; remaining controller/steering/cue/HUD/camera/calibration, campaign/save/music, genre proofs, assets and mobile feasibility have concrete stages.

For the next gameplay implementation, use one representative route covering changed comms/panel/control behavior plus relevant baseline smoke checks: tutorial ownership/H/R locks, movement/contact, music continuity, lift/Jammer/boss, retry/reset, pause/archive and saved discoveries. Add production assertions for consequential changed behavior. Do not require the owner to replay every historical checklist to review these unchanged documents.

## Historical acceptance reports

## Current target: authored lore and archive — September 12, 2026

Review `agent/level1-lore-archive`, based on merged PR #36 (`58b6abe6179ce6b7e8996c4d4099c9eff674f35f`). The generated manifest/receipt ties required tests to the exact draft revision. Native Canvas renders verify complete text fit and production drawing; they do not establish live Makko rendering, audio or hosted storage. Owner acceptance remains pending.

1. On the same Makko project/origin used for PR #36, press P → Lore archive (L is the pause shortcut). Previously saved records should show their expanded text without recollection. Unrecovered entries must hide their titles and story contents. A different origin may have a separate browser save.
2. Read all recovered records with arrows/Tab/Enter and pointer clicks. Review the crew voices and 6 Bit replies against LEVEL_01_LORE. Esc goes back to the pause screen; P/Resume returns to play. World and music remain paused while reading, and held menu keys must not cause a jump/attack afterward.
3. On a normal fast run, collect the left awning, middle roof and upper route records after 4/9/14 mission defeats. All three remain available together. Collect two quickly: both notices should appear in sequence and both records should already be readable. The archive opens the latest pickup. Check one 500-point reward per record per run.
4. Reload, lose/retry the boss and full-restart. Durable discoveries remain, run counters follow their existing reset rules, and old pickup notices cannot leak into the next run. Reset Settings must not erase lore. If the host blocks saving, the archive must explain that records remain in this session.
5. Smoke-test landing/contact/SFX, H/R tutorial locks, the lift, rooftop Amp prompt/pickup/three charges, target brackets/traffic, Jammer cinematic and boss lose/retry/win. Record exact SHA, Makko project/origin, device and PASS/FAIL. After acceptance and merge, import the actual main merge SHA and repeat the archive/save/pause checks.

The following sections describe earlier review targets and are historical.

## Current target: discovery, targets and traffic — September 12, 2026

Review `agent/level1-discovery-traffic`, based on merged PR #35 (`c346e16e24c00b46611e6328d6f0fd6158cf315a`). All approved implementation is complete. Required `npm test`, all-file syntax and actual Makko animation-boundary checks passed; the generated receipt ties results to the exact revision. Native Canvas diagnostics verify production drawing with fixture positions/body guides. They do not verify live Makko asset delivery, audible mix, persistence on the hosted origin, frame rate or feel. Owner acceptance is pending; older targets below are historical.

1. Take the normal fast route. Lore unlocks at 4, 9 and 14 mission defeats; waiting or collecting an earlier piece must not delay later pieces. Explore the left awning, middle roof and upper route using the existing lift. Collect all three before completing the fight, in different orders across runs. Each has stable text/identity and one 500-point run reward.
2. Reload on the same Makko origin. The unique saved IDs must remain; a replay can award run score but cannot increase the saved unique total beyond three Level 1 records. Boss retry keeps this run's counter/reward. A full restart resets the run counter, while durable discoveries remain. Confirm the three provisional text entries with the owner. No final campaign outcome is implemented here.
3. Walk across the relay roof and touch the Signal Amp. It should collect with feet on the roof, explain longer enemy reach and show three charges. Successful ordinary-enemy rhythm hits use one charge; misses, empty swings and boss/Jammer-only hits do not. The nearby prompt should remain readable.
4. Enter R beside enemies. Cyan brackets indicate normal next-success reach, violet `AMP +` shows extended reach, and boss brackets distinguish guarded/open phases. Compare the preview with actual on-beat hits at the range edge. R-off, tutorial, pause and hacking must hide it. Looking/pausing must not spend charges.
5. Watch all three traffic types: exhaust and source animation should advance, with existing direction, framing and travel. Pause freezes their frames; resume continues. Owner diagnostics may confirm `spaceShipSystem.getDiagnostics().animatedTypes === 3`; fallback imagery is not an animation PASS.
6. Smoke-test opening/landing/contact/SFX, tutorial locks, two-hit lift, sixteen-hit Jammer, cinematic exit, boss lose/retry and win/rematch, full restart and saved pause controls. Record SHA, Makko project/origin, device and PASS/FAIL. After acceptance and merge, import the actual main merge SHA and repeat the focused collection/Amp/target/traffic checks.

## Current target: approved combined polish 1–9 — September 12, 2026

Checkpoint 3 on merged #34 implements **all approved items 1–9 plus particle/logging cleanup**. The one combined draft is the review target; its exact publication status/head/PR are in the generated manifest. Owner Makko acceptance is pending. The export receipt identifies executed full-suite/all-file syntax and actual Makko animation-boundary checks and their exact revision. `npm run check:level-01-polish` covers chunks 1–2; `npm run check:level-01-polish-menu` covers pause keyboard/pointer/lifecycle ownership, settings/storage failure, audio pause, gamepad release, completed-run data and retry/reset. Both are in `npm test`. The earlier gate assertion now permits approved barcode detail while retaining bounds/absence checks. The inventory adds the pause module/test and records resulting script/declaration positions without removing existing findings.

Checkpoint 3 owner checks: press P while moving and during a charge; the world/music should pause. Use Tab/arrows/Enter and pointer dragging to change Music/SFX, mute each, toggle shake/flash accents/CRT, and resume with P/Escape/Resume. No held menu jump, movement or attack should fire afterward. Reopen/reload and full-restart to verify preferences persist. Defaults restores the original mix/effects. During an active run, build a combo, leave/re-enter R, collect fragments, lose/retry the boss, then win. The completion breakdown should reach the actual score, whole-run best combo and fragment count; Enter rematches, Space clears the run. Check a fragment collected after boss handoff retains exactly one reward on retry. Keyboard/pointer checks do not claim a touch UI or audible host mix.

Owner spot-check, when testing this partial branch: take one left/right side hit and a boss pulse; compare lost segments and direction, then touch again during immunity; watch Corrupted/Firewall arrows while moving behind their windups and dodge a Swooper marker; collect the rooftop Amp, use three successful ordinary-target hits, and check the empty state. Pause should freeze new FX; boss retry should restore checkpoint charges, and full restart should clear them. Keep the PR #34 landing/contact/audio smoke checks.

For checkpoint 2, clear each of the four gates: the barrier should collapse promptly while passage opens immediately. Compare R-off/R-on storefronts, sustained combos and the quieter boss area; steam/sparks should stay sparse around charge warnings. Find a rooftop Lost Data beacon, collect it while the camera moves/zooms, and watch pieces assemble and reach the lore counter. Confirm one 500-point reward and one lore entry; pause mid-flight, resume, then retry/reset without stale flights. Canvas diagnostics verify composition and transforms, not host FPS, audible mix or subjective visibility. The complete Makko acceptance checklist below remains required before the eventual combined PR merges.

Owner Makko check: opening/landing/contact/audio; visible charge warnings; Amp pickup/use/depletion; all four gate clears; musical scenery and atmosphere; Lost Data flight/counter; pause keyboard/pointer controls, saved volumes and reduced effects; victory statistics and retry/reset. Confirm music, H/R locks, single jump, lift, Jammer and boss balance remain intact. The generated receipt will record actual results and remaining limits.

## Current target: Makko animation/contact/audio repair — September 12, 2026

PR #33 is merged; the owner's latest test is **FAIL for animation/contact/audio, positive for effects/flow**. Review `agent/level1-makko-health-repair` at the manifest revision. This repair awaits Makko acceptance.

Use the five steps in `MAKKO_HEALTH_CHECK.md`: spawn/landing/stance; all three ordinary enemies' head/side contacts; rhythm/action sounds under music; retained effects/lift/hack/Jammer; boss retry/rematch and full restart. Record SHA, project/device, per-step PASS/FAIL, health before/after unfair hits and a short clip. If sounds stay silent, capture `window.audioSystem.getRuntimeDiagnostics()` after trying a cue.

Required automated receipts include full-suite/all-file syntax and getter-only/official-runtime animation checks. Audio routing checks are not an audible mix test. After acceptance and merge, import the actual main merge SHA into Makko, restart preview and repeat opening/contact/audio and pause/retry smoke checks. Passing Node checks alone does not accept the repair.

## Current responsive combat / visible rhythm pass

Test branch: `agent/level1-responsive-combat`, based on merged #32 (`9719827`). The owner authorized publication of this completed build; it remains unmerged for Makko testing. The archive manifest names the exact tested revision and PR. Owner Makko acceptance remains pending; earlier approval of a different build is not acceptance here.

1. Play the opening/tutorial normally. Try very short Down taps, rapid release/repress, opposing directions, single jumps and H/R tutorial locks. Space advances dialogue without also jumping.
2. Walk close to each enemy in idle/walk/rhythm poses. Check that the weapon/transparent sprite padding does not hurt you. Land onto all three ordinary types, including a moving/attacking Firewall; rising into an enemy or touching its side should damage normally. Optional geometry overlay shows body bounds. Report enemy, action and frame/video for unexpected contact.
3. Enter/exit R beside the same storefront. Entry burst, performer field, equalizers and curb response should be obvious; walking/jumping still require stance exit. Hit on time with and without a target. Lightning must terminate on actual hits. Compare five/ten-hit milestones and a miss resetting the combo. Check Signal Amp reach and the Jammer's unchanged 300-pixel attack rule.
4. Judge jump rise/apex/descent/landing, Firewall warning/attack/recovery, directional defeats and the sound differences between jump/land/stomp, damage, guard, lift and pickup. Music stays continuous through impacts. Report whether effects or sound mask enemy warnings/the musical beat.
5. Use the two-hit lift, hack successfully/fail/take damage during H, destroy the sixteen-hit Jammer and watch the complete cinematic. R ends immediately and cannot reopen during it. Check camera alignment of the scene effects.
6. Fight the boss normally and attempt repeated head bouncing. The existing rearm/separation rule, cyan windows and balance remain. Pause/resume, die/retry, win/rematch and restart the level; check no stale effects, duplicate cues or leaked mode. Boss retry preserves district recovery; full restart resets it.

Automated checks exercise the production owners, source-frame anchoring, swept contact, timestamp judgments, display-rate scheduling, FX lifetime, cue voice limits and the existing campaign-level gates. Canvas inspection verifies composition with actual source art through a boundary renderer. Neither replaces Makko audio/rendering/feel acceptance. After acceptance/merge, import main and repeat the handoff checks against its exact revision.

## Current district restoration and selected-pass completion

Base: merged PR #31 (`b9d7ac4`). Branch: `agent/level1-district-restoration`. Use the six-step checklist and post-merge Makko handoff in `SELECTED_PASS_CHECK.md`. The manifest/receipt identify the exact revision, PR and test results. Check local encounter restoration, all Jammer stages, wave/camera/pause, restored boss retries and full reset, plus the included heavy-stomp correction and retained PR #31 behavior. Capture the same storefront before/after and a short wave/handoff video with revision and PASS/FAIL. Owner playtest remains pending.

## Current animation, mode and effects retest — September 11, 2026

Draft review branch: `agent/level1-animation-effects`, based on merged PR #30 (`1897c4e`). Exact revision/PR/test receipts are in `SOURCE_MANIFEST.json` and `test-evidence.json`. Makko acceptance is pending; preceding reports do not accept this new build.

1. Play the usual opening and tutorial once. Check the existing H/R locks, Space ownership, opposing-direction cancellation and single jump. Switch between walk, jump, idle, rhythm and hacking repeatedly; watch for stuck/restarting clips or feet shifting.
2. Press R on the ground: 6 Bit plants, the beat ring appears, and arrows/jump do not move him. Press R again while holding a direction: movement resumes immediately. A jump pressed while planted must not fire later on its own. Airborne R requests should say to land first, while the jump continues normally.
3. Charge the lift with two successful rhythm hits. Watch the charge effect and shadow; the lift must carry the planted stance. Exit R to walk/jump onto the rooftop. Check landing sparks, grounded shadows and brief attack/stomp echoes on ordinary enemies.
4. Complete a hack, fail one and let one time out. Read the phases, timer and input; codes disappear before input opens. Success restores one health and the existing nearby stun. Previously active Rhythm Mode may resume on a valid grounded completion; taking damage must cancel it instead. Pause/resume and Escape must release ownership cleanly.
5. Finish the Jammer. Rhythm Mode ends immediately and stays off through the whole cinematic. Re-enter R for boss counters; exit R before jumping the pulses or attempting a stomp. Head rebounds must stay safe and separate you without reopening the old endless-bounce exploit.
6. Lose/retry, win/rematch and restart. Retry begins with Rhythm Mode off. No old terminal feedback, charge effect, attack echo or duplicate music should persist. Judge whether the new effects help readability without obscuring enemy warnings.

Use the existing Go / Reset Boss control for repeated boss checks after the normal route. Report the revision, failures and how the planted stance feels in the fight. No new artwork or music is required for this test.

## Historical Jammer transition retest — September 11, 2026

Review branch: `agent/jammer-rhythm-exit`, based on merged PR #29. Owner verification pending; preceding playtest results remain historical.

1. Finish the Jammer with R + correctly timed Down. Rhythm UI/stance must exit immediately on hit sixteen.
2. Press R repeatedly through freeze, purge, pan, entrance, close-up, flourish, hold and camera return. It must not reactivate; movement remains frozen for the cinematic.
3. At control handoff, move normally. Down must require R again. Press R, then verify normal boss rhythm counters.
4. Listen for continuous music/beat timing across the transition. No restart, duplicated music or held final-attack pose.

Production-module assertions cover these lifecycle properties and transport continuity. Makko confirmation remains necessary. New overhaul/effect ideas are proposals and require a separately scoped implementation pass.

## Current test target — musical combat pass

Use `agent/level1-musical-combat` at the revision in the generated manifest. PR #28 is merged. The owner's latest run was substantially better and reached victory, but the difficult boss was defeated through an endless head-bounce exploit. Current acceptance is **pending for the new branch**, and the older test sections below remain historical evidence.

1. Play the usual Level 1 route once. Check the opening boundary, H/R tutorial locks, opposite-direction cancellation, lethal ordinary stomps, lift and safe Jammer placement. The quota remains twenty; Jammer health remains sixteen.
2. Read enemy warnings: jump a Corrupted charge, dodge the marked swooper lane, and counter after a Firewall braces/sweeps. Report if labels obscure bodies or any committed attack unexpectedly turns toward you.
3. Use R + Down: the nearby markers should meet on the beat. Miss early and late deliberately; check the feedback. Take a hit and check that R re-entry is obvious and the song continues.
4. Fight the boss with rhythm counters. The first warning/opening should be forgiving. Six health adds a second pulse; only the last three health can speed up the pattern after the introductory cycles. Hold a normal jump to clear the double pulse. Is the window long enough to recognize it and land useful attacks?
5. Try the previous exploit with no horizontal input. A head landing should send you safely outward. Repeated hovering must not damage another cycle; landing rearms an intentional next stomp. Judge the 260 ms rebound impulse and try both sides/near an arena edge.
6. Lose/retry directly, pause/resume, win/rematch and restart the full level. No stale rebound, beat warning, damage message or duplicate music should survive.

Use the existing Go / Reset Boss development control after the normal run to avoid repeating the entire level. Report how many attempts a legitimate win took, which attack caused most damage, and anything that feels unfair. Automated tests passing do not replace this feel/audio/rendering check.

## Historical acceptance records

## Status

PR #27 is merged at `a69384e5c647e0f1f457564ccbb3c29cd37e2059`. The owner's first playtest reported: unrestricted tutorial movement past the later gate; boss size/alignment changing with animation; boss carried by camera return; immediate death after attempting a stomp; Jammer/lift interaction overlap. **This is a failed acceptance pass, not approval of those behaviors.**

The current `agent/level1-playtest-repairs` branch addresses these reports and awaits a new owner Makko pass. No current Makko/browser gameplay acceptance is claimed. `SOURCE_MANIFEST.json` and `test-evidence.json` identify the exact code, review status and automated receipt.

## Focused repair retest

1. Hold right during the opening tutorial; also try crossing the opening boundary in the air. Finish the tutorial and check that you start on the correct side with the first encounter reachable.
2. Finish the mission once. Check that the Jammer and its attack area are well clear of the lift, and the lift explains its two on-beat charges before activation.
3. Watch boss walk/idle/flourish transitions: feet should stay on the street and body scale remain consistent. During camera return it should stay by the building where it stopped, then walk toward you after control returns, even from offscreen.
4. At full health, land on the boss during guarded and cyan phases. Both should bounce; only cyan should lose one boss health. Repeat at low health using retry as needed. Report player health before/after any unexpected death and whether a pulse was present.
5. Deliberately lose/retry, win/rematch, then restart the level. Confirm that the opening boundary, mission and music reset correctly.

Use the existing **Go / Reset Boss** development control for repeated boss checks after one normal route. No repeated full mission grind is needed for every animation check.

## Added general-play checks

During the same normal run, check ordinary enemy contact and stomps against their visible bodies; note whether attack messages make timing versus range clear. Follow the encounter-specific progress/hints and watch the Jammer change stage at 12, 8 and 4 health remaining. Completed objectives should leave the active objective visible. Judge the overall flow and readability as well as the original five repair items.

## Required checks

| Check | Expected result | Evidence owner |
|---|---|---|
| Existing suite/all JS syntax | Existing production/runtime checks and Makko parsing coverage pass | Codex receipt |
| Boss logic | Damage only in intended states, counter/stomp opportunity, clean death/retry, one completion, no stale hazards after pause/reset | Codex focused harness |
| Import/title/prologue | Exact supplied revision opens and preserves approved presentation | Owner Makko |
| Tutorial/movement | Space exclusive; H/R locks; background timing; opposing keys cancel; single jump | Owner Makko |
| Contact/lift | Normal enemy damage, lethal ordinary-enemy stomp, two-hit lift and readable foot/roof contact | Owner Makko |
| Normal mission route | 20 post-tutorial defeats; opposite-half Jammer; sixteen rhythm hits; established boss entrance | Owner Makko |
| Boss playthrough | Clear warnings/recovery, a fair loss and retry, successful win and honest end-screen actions | Owner Makko |
| Audio/lifecycle | Pause/resume/retry/full restart without duplicate audio, silent layers, stale attacks or broken reset | Owner Makko |

Use `repository-snapshot/docs/technical/MAKKO_HANDOFF.md` for the step-by-step route. Debug hooks may accelerate repeated testing; one normal-route run remains necessary to validate the full sequence.

## Completion report

Record: tested SHA; PASS/FAIL/PASS WITH NOTES; device/Makko project; exact route and failures; any accepted notes; automated commands/results; asset changes; and merge state. Only then mark M1 accepted and merge it. After merge, rebuild the ZIP at the actual merged SHA and retain the receipt's tested SHA so any difference remains visible.

No regression check may remove an approved mechanic just to satisfy obsolete prose from v4. Conversely, a passing logic harness is not permission to skip the owner/Makko gate.
